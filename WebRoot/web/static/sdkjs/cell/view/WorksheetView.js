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
    var CellValueType = AscCommon.CellValueType;
    var c_oAscBorderStyles = AscCommon.c_oAscBorderStyles;
    var c_oAscBorderType = AscCommon.c_oAscBorderType;
    var c_oAscLockTypes = AscCommon.c_oAscLockTypes;
    var c_oAscFormatPainterState = AscCommon.c_oAscFormatPainterState;
    var c_oAscPrintDefaultSettings = AscCommon.c_oAscPrintDefaultSettings;
    var AscBrowser = AscCommon.AscBrowser;
    var CColor = AscCommon.CColor;
    var fSortAscending = AscCommon.fSortAscending;
    var parserHelp = AscCommon.parserHelp;
    var gc_nMaxDigCountView = AscCommon.gc_nMaxDigCountView;
    var gc_nMaxRow0 = AscCommon.gc_nMaxRow0;
    var gc_nMaxCol0 = AscCommon.gc_nMaxCol0;
    var gc_nMaxRow = AscCommon.gc_nMaxRow;
    var gc_nMaxCol = AscCommon.gc_nMaxCol;
    var History = AscCommon.History;

    var asc = window["Asc"];
    var asc_applyFunction = AscCommonExcel.applyFunction;
    var asc_getcvt = asc.getCvtRatio;
    var asc_floor = asc.floor;
    var asc_ceil = asc.ceil;
    var asc_obj2Color = asc.colorObjToAscColor;
    var asc_typeof = asc.typeOf;
    var asc_incDecFonSize = asc.incDecFonSize;
    var asc_debug = asc.outputDebugStr;
    var asc_Range = asc.Range;
    var asc_CMM = AscCommonExcel.asc_CMouseMoveData;
    var asc_VR = AscCommonExcel.VisibleRange;

    var asc_CFont = AscCommonExcel.asc_CFont;
    var asc_CFill = AscCommonExcel.asc_CFill;
    var asc_CCellInfo = AscCommonExcel.asc_CCellInfo;
    var asc_CHyperlink = asc.asc_CHyperlink;
    var asc_CPageSetup = asc.asc_CPageSetup;
    var asc_CPagePrint = AscCommonExcel.CPagePrint;
    var asc_CAutoFilterInfo = AscCommonExcel.asc_CAutoFilterInfo;

    var c_oTargetType = AscCommonExcel.c_oTargetType;
    var c_oAscCanChangeColWidth = AscCommonExcel.c_oAscCanChangeColWidth;
	var c_oAscMergeType = AscCommonExcel.c_oAscMergeType;
    var c_oAscLockTypeElemSubType = AscCommonExcel.c_oAscLockTypeElemSubType;
    var c_oAscLockTypeElem = AscCommonExcel.c_oAscLockTypeElem;
    var c_oAscError = asc.c_oAscError;
    var c_oAscMergeOptions = asc.c_oAscMergeOptions;
    var c_oAscInsertOptions = asc.c_oAscInsertOptions;
    var c_oAscDeleteOptions = asc.c_oAscDeleteOptions;
    var c_oAscBorderOptions = asc.c_oAscBorderOptions;
    var c_oAscCleanOptions = asc.c_oAscCleanOptions;
    var c_oAscSelectionType = asc.c_oAscSelectionType;
    var c_oAscSelectionDialogType = asc.c_oAscSelectionDialogType;
    var c_oAscAutoFilterTypes = asc.c_oAscAutoFilterTypes;
    var c_oAscChangeTableStyleInfo = asc.c_oAscChangeTableStyleInfo;
    var c_oAscChangeSelectionFormatTable = asc.c_oAscChangeSelectionFormatTable;
    var asc_CSelectionMathInfo = AscCommonExcel.asc_CSelectionMathInfo;

    var pageBreakPreviewMode = false;
	var pageBreakPreviewModeOverlay = false;

    /*
     * Constants
     * -----------------------------------------------------------------------------
     */

    /**
     * header styles
     * @const
     */
    var kHeaderDefault = 0;
    var kHeaderActive = 1;
    var kHeaderHighlighted = 2;

    /**
     * cursor styles
     * @const
     */
    var kCurDefault = "default";
    var kCurCorner = "pointer";
    var kCurColSelect = "pointer";
    var kCurColResize = "col-resize";
    var kCurRowSelect = "pointer";
    var kCurRowResize = "row-resize";
    // Курсор для автозаполнения
    var kCurFillHandle = "crosshair";
    // Курсор для гиперссылки
    var kCurHyperlink = "pointer";
    // Курсор для перемещения области выделения
    var kCurMove = "move";
    var kCurSEResize = "se-resize";
    var kCurNEResize = "ne-resize";
    var kCurAutoFilter = "pointer";


    var kCurFormatPainterExcel = "se-formatpainter";
    AscCommon.g_oHtmlCursor.register(AscCommonExcel.kCurCells, "plus", "6 6", "cell");
	AscCommon.g_oHtmlCursor.register(kCurFormatPainterExcel, "plus_copy", "6 12", "pointer");

    var kNewLine = "\n";

    var kMaxAutoCompleteCellEdit = 20000;
	var kRowsCacheSize = 64;

    var gridlineSize = 1;

    var filterSizeButton = 17;

    function getMergeType(merged) {
		var res = c_oAscMergeType.none;
		if (null !== merged) {
			if (merged.c1 !== merged.c2) {
				res |= c_oAscMergeType.cols;
			}
			if (merged.r1 !== merged.r2) {
				res |= c_oAscMergeType.rows;
			}
		}
		return res;
	}
	function getFontMetrics(format, stringRender) {
    	var res = AscCommonExcel.g_oCacheMeasureEmpty2.get(format);
    	if (!res) {
			if (!format.isEqual2(stringRender.drawingCtx.font)) {
				stringRender.drawingCtx.setFont(format);
			}
			res = stringRender.drawingCtx.getFontMetrics();
			AscCommonExcel.g_oCacheMeasureEmpty2.add(format, res);
		}
		return res;
	}

	function CacheColumn() {
	    this.left = 0;
		this.width = 0;
	}

	function CacheRow() {
		this.top = 0;
		this.height = 0;			// Высота с точностью до 1 px
		this.descender = 0;
	}

    function CacheElement() {
        this.columnsWithText = {};							// Колонки, в которых есть текст
        this.columns = {};
        this.erased = {};
        return this;
    }

	function CacheElementText() {
		this.state = null;
		this.flags = null;
		this.metrics = null;
		this.cellW = null;
		this.cellHA = null;
		this.cellVA = null;
		this.sideL = null;
		this.sideR = null;
		this.cellType = null;
		this.isFormula = false;
		this.angle = null;
		this.textBound = null;
	}

    function Cache() {
        this.rows = {};
        this.sectors = [];

        this.reset = function () {
            this.rows = {};
            this.sectors = [];
        };

        // Structure of cache
        //
        // cache : {
        //
        //   rows : {
        //     0 : {
        //       columns : {
        //         0 : {
        //           text : {
        //             cellHA  : String,
        //             cellVA  : String,
        //             cellW   : Number,
        //             color   : String,
        //             metrics : TextMetrics,
        //             sideL   : Number,
        //             sideR   : Number,
        //             state   : StringRenderInternalState
        //           }
        //         }
        //       },
        //       erased : {
        //         1 : true, 2 : true
        //       }
        //     }
        //   },
        //
        //   sectors: [
        //     0 : true
		//     9 : true
        //   ]
        //
        // }
    }

    function CellFlags() {
        this.wrapText = false;
        this.shrinkToFit = false;
        this.merged = null;
        this.textAlign = null;

        this.bApplyByArray = null;
    }

    CellFlags.prototype.clone = function () {
        var oRes = new CellFlags();
        oRes.wrapText = this.wrapText;
        oRes.shrinkToFit = this.shrinkToFit;
        oRes.merged = this.merged ? this.merged.clone() : null;
        oRes.textAlign = this.textAlign;
        return oRes;
    };
    CellFlags.prototype.isMerged = function () {
        return null !== this.merged;
    };
	CellFlags.prototype.getMergeType = function () {
	    return getMergeType(this.merged);
	};

    function CellBorderObject(borders, mergeInfo, col, row) {
        this.borders = borders;
        this.mergeInfo = mergeInfo;

        this.col = col;
        this.row = row;
    }

    CellBorderObject.prototype.isMerge = function () {
        return null != this.mergeInfo;
    };
    CellBorderObject.prototype.getLeftBorder = function () {
        if (!this.borders ||
          (this.isMerge() && (this.col !== this.mergeInfo.c1 || this.col - 1 !== this.mergeInfo.c2))) {
            return null;
        }
        return this.borders.l;
    };
    CellBorderObject.prototype.getRightBorder = function () {
        if (!this.borders ||
          (this.isMerge() && (this.col - 1 !== this.mergeInfo.c1 || this.col !== this.mergeInfo.c2))) {
            return null;
        }
        return this.borders.r;
    };

    CellBorderObject.prototype.getTopBorder = function () {
        if (!this.borders ||
          (this.isMerge() && (this.row !== this.mergeInfo.r1 || this.row - 1 !== this.mergeInfo.r2))) {
            return null;
        }
        return this.borders.t;
    };
    CellBorderObject.prototype.getBottomBorder = function () {
        if (!this.borders ||
          (this.isMerge() && (this.row - 1 !== this.mergeInfo.r1 || this.row !== this.mergeInfo.r2))) {
            return null;
        }
        return this.borders.b;
    };


    /**
     * Widget for displaying and editing Worksheet object
     * -----------------------------------------------------------------------------
	 * @param {WorkbookView} workbook  WorkbookView
     * @param {Worksheet} model  Worksheet
     * @param {AscCommonExcel.asc_CHandlersList} handlers  Event handlers
     * @param {Object} buffers    DrawingContext + Overlay
     * @param {AscCommonExcel.StringRender} stringRender    StringRender
     * @param {Number} maxDigitWidth    Максимальный размер цифры
     * @param {CCollaborativeEditing} collaborativeEditing
     * @param {Object} settings  Settings
     *
     * @constructor
     * @memberOf Asc
     */
    function WorksheetView(workbook, model, handlers, buffers, stringRender, maxDigitWidth, collaborativeEditing, settings) {
        this.settings = settings;

        this.workbook = workbook;
        this.handlers = handlers;
        this.model = model;

        this.buffers = buffers;
        this.drawingCtx = this.buffers.main;
        this.overlayCtx = this.buffers.overlay;

        this.drawingGraphicCtx = this.buffers.mainGraphic;
        this.overlayGraphicCtx = this.buffers.overlayGraphic;

        this.stringRender = stringRender;

        // Флаг, сигнализирует о том, что мы сделали resize, но это не активный лист (поэтому как только будем показывать, нужно перерисовать и пересчитать кеш)
        this.updateResize = false;
        // Флаг, сигнализирует о том, что мы сменили zoom, но это не активный лист (поэтому как только будем показывать, нужно перерисовать и пересчитать кеш)
        this.updateZoom = false;
        // ToDo Флаг-заглушка, для того, чтобы на mobile не было изменения высоты строк при zoom (по правильному высота просто не должна меняться)
        this.notUpdateRowHeight = false;

        this.cache = new Cache();

        //---member declaration---
        // Максимальная ширина числа из 0,1,2...,9, померенная в нормальном шрифте(дефалтовый для книги) в px(целое)
        // Ecma-376 Office Open XML Part 1, пункт 18.3.1.13
        this.maxDigitWidth = maxDigitWidth;

        this.defaultColWidthChars = 0;
        this.defaultColWidthPx = 0;
        this.defaultRowHeightPx = 0;
        this.defaultRowDescender = 0;
        this.headersLeft = 0;
        this.headersTop = 0;
        this.headersWidth = 0;
        this.headersHeight = 0;
        this.headersHeightByFont = 0;	// Размер по шрифту (размер без скрытия заголовков)
		this.groupWidth = 0;
		this.groupHeight = 0;
        this.cellsLeft = 0;
        this.cellsTop = 0;
        this.cols = [];
        this.rows = [];

        this.highlightedCol = -1;
        this.highlightedRow = -1;
        this.topLeftFrozenCell = null;	// Верхняя ячейка для закрепления диапазона
        this.visibleRange = new asc_Range(0, 0, 0, 0);
        this.isChanged = false;
        this.isCellEditMode = false;
        this.isFormulaEditMode = false;
        this.isChartAreaEditMode = false;
        this.lockDraw = false;
        this.isSelectOnShape = false;	// Выделен shape

        this.stateFormatPainter = c_oAscFormatPainterState.kOff;

        this.selectionDialogType = c_oAscSelectionDialogType.None;
        this.isSelectionDialogMode = false;
        this.copyActiveRange = null;

        this.startCellMoveResizeRange = null;
        this.startCellMoveResizeRange2 = null;
        this.moveRangeDrawingObjectTo = null;

        // Координаты ячейки начала перемещения диапазона
        this.startCellMoveRange = null;
        // Дипазон перемещения
        this.activeMoveRange = null;
        // Range for drag and drop
		this.dragAndDropRange = null;
        // Range fillHandle
        this.activeFillHandle = null;
        // Горизонтальное (0) или вертикальное (1) направление автозаполнения
        this.fillHandleDirection = -1;
        // Зона автозаполнения
        this.fillHandleArea = -1;
        this.nRowsCount = 0;
        this.nColsCount = 0;
        // Массив ячеек для текущей формулы
        this.arrActiveFormulaRanges = [];
        this.arrActiveFormulaRangesPosition = -1;
        this.arrActiveChartRanges = [new AscCommonExcel.SelectionRange(this.model)];
        //------------------------

        this.collaborativeEditing = collaborativeEditing;

        this.drawingArea = new AscFormat.DrawingArea(this);
        this.cellCommentator = new AscCommonExcel.CCellCommentator(this);
        this.objectRender = null;

        this.arrRecalcRanges = [];
		this.arrRecalcRangesWithHeight = [];
		this.arrRecalcRangesCanChangeColWidth = [];
        this.skipUpdateRowHeight = false;
        this.canChangeColWidth = c_oAscCanChangeColWidth.none;
        this.scrollType = 0;
        this.updateRowHeightValuePx = null;

        this.viewPrintLines = false;

        this.cutRange = null;

        this.usePrintScale = false;//флаг нужен для того, чтобы возвращался scale только в случае печати, а при отрисовке, допустим сектки, он был равен 1

        this.arrRowGroups = null;
        this.arrColGroups = null;
        this.clickedGroupButton = null;
        this.ignoreGroupSize = null;//для печати не нужно учитывать отступы групп

        this._init();

        return this;
    }

	WorksheetView.prototype._init = function () {
		this._initWorksheetDefaultWidth();
		this._initPane();
		this._updateGroups();
		this._updateGroups(true);
		this._initCellsArea(AscCommonExcel.recalcType.full);
		this.model.setTableStyleAfterOpen();
		this.model.setDirtyConditionalFormatting(null);
		this.model.initPivotTables();
		this.model.updatePivotTablesStyle(null);
		this._cleanCellsTextMetricsCache();
		this._prepareCellTextMetricsCache();

		// initializing is completed
		this.handlers.trigger("initialized");
	};
	WorksheetView.prototype._initWorksheetDefaultWidth = function () {
		// Теперь рассчитываем число px
		this.defaultColWidthChars = this.model.charCountToModelColWidth(this.model.getBaseColWidth());
		this.defaultColWidthPx = this.model.modelColWidthToColWidth(this.defaultColWidthChars);
		// Делаем кратным 8 (http://support.microsoft.com/kb/214123)
		this.defaultColWidthPx = asc_ceil(this.defaultColWidthPx / 8) * 8;
		this.defaultColWidthChars = this.model.colWidthToCharCount(this.defaultColWidthPx);
		AscCommonExcel.oDefaultMetrics.ColWidthChars = this.model.charCountToModelColWidth(this.defaultColWidthChars);
		var defaultColWidth = this.model.getDefaultWidth();
		if (null !== defaultColWidth) {
			this.defaultColWidthPx = this.model.modelColWidthToColWidth(defaultColWidth);
		}

		// ToDo разобраться со значениями
		this._setDefaultFont(undefined);
		var tm = this._roundTextMetrics(this.stringRender.measureString("A"));
		this.headersHeightByFont = tm.height;

		this.maxRowHeightPx = AscCommonExcel.convertPtToPx(Asc.c_oAscMaxRowHeight);
		this.defaultRowDescender = this.stringRender.lines[0].d;
		AscCommonExcel.oDefaultMetrics.RowHeight = Math.min(Asc.c_oAscMaxRowHeight,
			this.model.getDefaultHeight() || AscCommonExcel.convertPxToPt(this.headersHeightByFont));
		this.defaultRowHeightPx = AscCommonExcel.convertPtToPx(AscCommonExcel.oDefaultMetrics.RowHeight);

		// ToDo refactoring
		this.model.setDefaultHeight(AscCommonExcel.oDefaultMetrics.RowHeight);

		// Инициализируем число колонок и строк (при открытии). Причем нужно поставить на 1 больше,
		// чтобы могли показать последнюю строку/столбец (http://bugzilla.onlyoffice.com/show_bug.cgi?id=23513)
		this._initRowsCount();
		this._initColsCount();

		this.model.initColumns();
	};

	WorksheetView.prototype._initRowsCount = function () {
	    var old = this.nRowsCount;
		this.nRowsCount = Math.min(Math.max(this.model.getRowsCount(), this.visibleRange.r2) + 1, gc_nMaxRow);
		return old !== this.nRowsCount;
	};

	WorksheetView.prototype._initColsCount = function () {
		var old = this.nColsCount;
		this.nColsCount = Math.min(Math.max(this.model.getColsCount(), this.visibleRange.c2) + 1, gc_nMaxCol);
		return old !== this.nColsCount;
	};

    WorksheetView.prototype.getCellVisibleRange = function (col, row) {
        var vr, offsetX = 0, offsetY = 0, cFrozen, rFrozen;
        if (this.topLeftFrozenCell) {
            cFrozen = this.topLeftFrozenCell.getCol0() - 1;
            rFrozen = this.topLeftFrozenCell.getRow0() - 1;
            if (col <= cFrozen && row <= rFrozen) {
                vr = new asc_Range(0, 0, cFrozen, rFrozen);
            } else if (col <= cFrozen) {
                vr = new asc_Range(0, this.visibleRange.r1, cFrozen, this.visibleRange.r2);
                offsetY -= this._getRowTop(rFrozen + 1) - this.cellsTop;
            } else if (row <= rFrozen) {
                vr = new asc_Range(this.visibleRange.c1, 0, this.visibleRange.c2, rFrozen);
                offsetX -= this._getColLeft(cFrozen + 1) - this.cellsLeft;
            } else {
                vr = this.visibleRange;
                offsetX -= this._getColLeft(cFrozen + 1) - this.cellsLeft;
                offsetY -= this._getRowTop(rFrozen + 1) - this.cellsTop;
            }
        } else {
            vr = this.visibleRange;
        }

        offsetX += this._getColLeft(vr.c1) - this.cellsLeft;
        offsetY += this._getRowTop(vr.r1) - this.cellsTop;

        return vr.contains(col, row) ? new asc_VR(vr, offsetX, offsetY) : null;
    };

    WorksheetView.prototype.getCellMetrics = function (col, row) {
        var vr;
        if (vr = this.getCellVisibleRange(col, row)) {
			return {
				left: this._getColLeft(col) - vr.offsetX,
				top: this._getRowTop(row) - vr.offsetY,
				width: this._getColumnWidth(col),
				height: this._getRowHeight(row)
			};
        }
        return null;
    };

    WorksheetView.prototype.getFrozenCell = function () {
        return this.topLeftFrozenCell;
    };

    WorksheetView.prototype.getVisibleRange = function () {
        return this.visibleRange;
    };

    WorksheetView.prototype.getFirstVisibleCol = function (allowPane) {
        var tmp = 0;
        if (allowPane && this.topLeftFrozenCell) {
            tmp = this.topLeftFrozenCell.getCol0();
        }
        return this.visibleRange.c1 - tmp;
    };

    WorksheetView.prototype.getLastVisibleCol = function () {
        return this.visibleRange.c2;
    };

    WorksheetView.prototype.getFirstVisibleRow = function (allowPane) {
        var tmp = 0;
        if (allowPane && this.topLeftFrozenCell) {
            tmp = this.topLeftFrozenCell.getRow0();
        }
        return this.visibleRange.r1 - tmp;
    };

    WorksheetView.prototype.getLastVisibleRow = function () {
        return this.visibleRange.r2;
    };

    WorksheetView.prototype.getHorizontalScrollRange = function () {
		var offsetFrozen = this.getFrozenPaneOffset(false, true);
        var ctxW = this.drawingCtx.getWidth() - offsetFrozen.offsetX - this.cellsLeft;
        for (var w = 0, i = this.nColsCount - 1; i >= 0; --i) {
            w += this._getColumnWidth(i);
            if (w >= ctxW) {
                break;
            }
        }
		var tmp = 0;
		if (this.topLeftFrozenCell) {
			tmp = this.topLeftFrozenCell.getCol0();
		}
		if (gc_nMaxCol === this.nColsCount || this.model.isDefaultWidthHidden()) {
			tmp -= 1;
		}
        return Math.max(0, i - tmp); // Диапазон скрола должен быть меньше количества столбцов, чтобы не было прибавления столбцов при перетаскивании бегунка
    };

    WorksheetView.prototype.getVerticalScrollRange = function () {
		var offsetFrozen = this.getFrozenPaneOffset(true, false);
        var ctxH = this.drawingCtx.getHeight() - offsetFrozen.offsetY - this.cellsTop;
        for (var h = 0, i = this.nRowsCount - 1; i >= 0; --i) {
            h += this._getRowHeight(i);
            if (h >= ctxH) {
                break;
            }
        }
		var tmp = 0;
		if (this.topLeftFrozenCell) {
			tmp = this.topLeftFrozenCell.getRow0();
		}
		if (gc_nMaxRow === this.nRowsCount || this.model.isDefaultHeightHidden()) {
			tmp -= 1;
		}
		return Math.max(0, i - tmp); // Диапазон скрола должен быть меньше количества строк, чтобы не было прибавления строк при перетаскивании бегунка
    };

	WorksheetView.prototype.getHorizontalScrollMax = function () {
		var tmp = 0;
		if (this.topLeftFrozenCell) {
			tmp = this.topLeftFrozenCell.getCol0();
		}
		return (this.model.isDefaultWidthHidden() ? this.nColsCount : gc_nMaxCol) - tmp - 1;
	};

	WorksheetView.prototype.getVerticalScrollMax = function () {
		var tmp = 0;
		if (this.topLeftFrozenCell) {
			tmp = this.topLeftFrozenCell.getRow0();
		}
		return (this.model.isDefaultHeightHidden() ? this.nRowsCount : gc_nMaxRow) - tmp - 1;
	};

    WorksheetView.prototype.getCellsOffset = function (units) {
        var u = units >= 0 && units <= 3 ? units : 0;
        return {
            left: this.cellsLeft * asc_getcvt(0/*px*/, u, this._getPPIX()),
            top: this.cellsTop * asc_getcvt(0/*px*/, u, this._getPPIY())
        };
    };

	WorksheetView.prototype._getColLeft = function (i) {
		var l = this.cols.length;
		return this.cellsLeft + ((i < l) ? this.cols[i].left : (((0 === l) ? 0 :
			this.cols[l - 1].left + this.cols[l - 1].width) + (!this.model.isDefaultWidthHidden()) *
			Asc.round(this.defaultColWidthPx * this.getZoom()) * (i - l)));
	};
    WorksheetView.prototype.getCellLeft = function (column, units) {
		var u = units >= 0 && units <= 3 ? units : 0;
		return this._getColLeft(column) * asc_getcvt(0/*px*/, u, this._getPPIX());
    };

	WorksheetView.prototype._getRowHeightReal = function (i) {
		// Реальная высота из файла (может быть не кратна 1 px, в Excel можно выставить через меню строки)
		var h = -1;
		this.model._getRowNoEmptyWithAll(i, function (row) {
			if (row) {
				if (row.getHidden()) {
					h = 0;
				} else if (row.h > 0 && (row.getCustomHeight() || row.getCalcHeight())) {
					h = row.h;
				}
			}
		});
		return (h < 0) ? AscCommonExcel.oDefaultMetrics.RowHeight : h;
	};
    WorksheetView.prototype._getRowDescender = function (i) {
        return (i < this.rows.length) ? this.rows[i].descender : this.defaultRowDescender;
	};
	WorksheetView.prototype._getRowTop = function (i) {
		var l = this.rows.length;
		return (i < l) ? this.rows[i].top : (((0 === l) ? this.cellsTop :
            this.rows[l - 1].top + this.rows[l - 1].height) + (!this.model.isDefaultHeightHidden()) *
            Asc.round(this.defaultRowHeightPx * this.getZoom()) * (i - l));
	};

    WorksheetView.prototype.getCellTop = function (row, units) {
		var u = units >= 0 && units <= 3 ? units : 0;
		return this._getRowTop(row) * asc_getcvt(0/*px*/, u, this._getPPIY());
    };

    WorksheetView.prototype.getCellLeftRelative = function (col, units) {
        if (col < 0 || col >= this.nColsCount) {
            return null;
        }
        // С учетом видимой области
        var offsetX = 0;
        if (this.topLeftFrozenCell) {
            var cFrozen = this.topLeftFrozenCell.getCol0();
            offsetX = (col < cFrozen) ? 0 : this._getColLeft(this.visibleRange.c1) - this._getColLeft(cFrozen);
        } else {
            offsetX = this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
        }

        var u = units >= 0 && units <= 3 ? units : 0;
        return (this._getColLeft(col) - offsetX) * asc_getcvt(0/*px*/, u, this._getPPIX());
    };

    WorksheetView.prototype.getCellTopRelative = function (row, units) {
        if (row < 0 || row >= this.nRowsCount) {
            return null;
        }
        // С учетом видимой области
        var offsetY = 0;
        if (this.topLeftFrozenCell) {
            var rFrozen = this.topLeftFrozenCell.getRow0();
            offsetY = (row < rFrozen) ? 0 : this._getRowTop(this.visibleRange.r1) - this._getRowTop(rFrozen);
        } else {
            offsetY = this._getRowTop(this.visibleRange.r1) - this.cellsTop;
        }

        var u = units >= 0 && units <= 3 ? units : 0;
        return (this._getRowTop(row) - offsetY) * asc_getcvt(0/*px*/, u, this._getPPIY());
    };

	WorksheetView.prototype._getColumnWidthInner = function (i) {
		return Math.max(this._getColumnWidth(i) - this.settings.cells.padding * 2 - gridlineSize, 0);
	};
	WorksheetView.prototype._getColumnWidth = function (i) {
		return (i < this.cols.length) ? this.cols[i].width :
			(!this.model.isDefaultWidthHidden()) * Asc.round(this.defaultColWidthPx * this.getZoom());
	};

    WorksheetView.prototype.getColumnWidth = function (index, units) {
		var u = units >= 0 && units <= 3 ? units : 0;
		return this._getColumnWidth(index) * asc_getcvt(0/*px*/, u, this._getPPIX());
    };

	WorksheetView.prototype.getColumnWidthInSymbols = function (index) {
		var c = this.model._getColNoEmptyWithAll(index);
		return (c && c.charCount) || this.defaultColWidthChars;
	};

    WorksheetView.prototype.getSelectedColumnWidthInSymbols = function () {
        var i, charCount, res = null;
        var range = this.model.selectionRange.getLast();
        for (i = range.c1; i <= range.c2; ++i) {
			charCount = this.getColumnWidthInSymbols(i);
			if (null !== res && res !== charCount) {
                return null;
            }
			res = charCount;

            if (i >= this.cols.length) {
				break;
			}
        }
        return res;
    };

    WorksheetView.prototype.getSelectedRowHeight = function () {
        var i, hR, res = null;
        var range = this.model.selectionRange.getLast();
        for (i = range.r1; i <= range.r2; ++i) {
			hR = this._getRowHeightReal(i);
			if (null !== res && res !== hR) {
				return null;
			}
			res = hR;

			if (i >= this.rows.length) {
				break;
			}
        }
        return res;
    };

	WorksheetView.prototype._getRowHeight = function (i) {
		return (i < this.rows.length) ? this.rows[i].height :
			(!this.model.isDefaultHeightHidden()) * Asc.round(this.defaultRowHeightPx * this.getZoom());
	};
    WorksheetView.prototype.getRowHeight = function (index, units) {
		var u = units >= 0 && units <= 3 ? units : 0;
		return this._getRowHeight(index) * asc_getcvt(0/*px*/, u, this._getPPIY());
    };

    WorksheetView.prototype.getSelectedRange = function () {
        // ToDo multiselect ?
        var lastRange = this.model.selectionRange.getLast();
        return this._getRange(lastRange.c1, lastRange.r1, lastRange.c2, lastRange.r2);
    };

    WorksheetView.prototype.getSelectedRanges = function () {
        var ret = [];
        var aRanges = this.model.selectionRange.ranges;
        var oRange;
        for(var i = 0; i < aRanges.length; ++i) {
            oRange = aRanges[i];
            ret.push(this._getRange(oRange.c1, oRange.r1, oRange.c2, oRange.r2))
        }
        return ret;
    };

    WorksheetView.prototype.resize = function (isUpdate, editor) {
        if (isUpdate) {
            this._initCellsArea(AscCommonExcel.recalcType.newLines);
            this._normalizeViewRange();
            this._prepareCellTextMetricsCache();
            this.updateResize = false;

            this.objectRender.resizeCanvas();
			if (this.isCellEditMode && editor) {
				editor.move();
			}
        } else {
            this.updateResize = true;
        }
        return this;
    };

    WorksheetView.prototype.getZoom = function () {
        return this.drawingCtx.getZoom();
    };

	WorksheetView.prototype.getPrintScale = function () {
		var res = 1;
		if(this.usePrintScale) {
			var printOptions = this.model.PagePrintOptions;
			res = printOptions && printOptions.pageSetup ? printOptions.pageSetup.scale : 100;
			res = res / 100;
		}
		return res;
	};

    WorksheetView.prototype.changeZoom = function (isUpdate) {
        if (isUpdate) {
            this.notUpdateRowHeight = true;
            this.cleanSelection();
			this._updateGroupsWidth();
            this._initCellsArea(AscCommonExcel.recalcType.recalc);
            this._normalizeViewRange();
            this._cleanCellsTextMetricsCache();

            // ToDo check this
			this._scrollToRange();

            this._prepareCellTextMetricsCache();
            this.cellCommentator.updateActiveComment();
			window['AscCommon'].g_specialPasteHelper.SpecialPasteButton_Update_Position();
            this.handlers.trigger("toggleAutoCorrectOptions", null, true);
            this.handlers.trigger("onDocumentPlaceChanged");
            this._updateDrawingArea();
            this.updateZoom = false;
            this.notUpdateRowHeight = false;
        } else {
            this.updateZoom = true;
        }
        return this;
    };
    WorksheetView.prototype.changeZoomResize = function () {
        this.cleanSelection();
        this._initCellsArea(AscCommonExcel.recalcType.full);
        this._normalizeViewRange();
        this._cleanCellsTextMetricsCache();

		// ToDo check this
		this._scrollToRange();

        this._prepareCellTextMetricsCache();
        this.cellCommentator.updateActiveComment();
		window['AscCommon'].g_specialPasteHelper.SpecialPasteButton_Update_Position();
        this.handlers.trigger("onDocumentPlaceChanged");
		this._updateDrawingArea();

        this.updateResize = false;
        this.updateZoom = false;
    };

    WorksheetView.prototype.getSheetViewSettings = function () {
        return this.model.getSheetViewSettings();
    };

    WorksheetView.prototype.getFrozenPaneOffset = function (noX, noY) {
        var offsetX = 0, offsetY = 0;
        if (this.topLeftFrozenCell) {
            if (!noX) {
                var cFrozen = this.topLeftFrozenCell.getCol0();
                offsetX = this._getColLeft(cFrozen) - this._getColLeft(0);
            }
            if (!noY) {
                var rFrozen = this.topLeftFrozenCell.getRow0();
                offsetY = this._getRowTop(rFrozen) - this._getRowTop(0);
            }
        }
        return {offsetX: offsetX, offsetY: offsetY};
    };


    // mouseX - это разница стартовых координат от мыши при нажатии и границы
    WorksheetView.prototype.changeColumnWidth = function (col, x2, mouseX) {
		var viewMode = this.handlers.trigger('getViewMode');
        var t = this;
        // Учитываем координаты точки, где мы начали изменение размера
        x2 += mouseX;

        var offsetFrozenX = 0;
        var c1 = t.visibleRange.c1;
        if (this.topLeftFrozenCell) {
            var cFrozen = this.topLeftFrozenCell.getCol0() - 1;
            if (0 <= cFrozen) {
                if (col < c1) {
                    c1 = 0;
                } else {
                    offsetFrozenX = t._getColLeft(cFrozen + 1) - t._getColLeft(0);
                }
            }
        }
        var offsetX = t._getColLeft(c1) - t.cellsLeft;
        offsetX -= offsetFrozenX;

        var x1 = t._getColLeft(col) - offsetX - gridlineSize;
        var w = Math.max(x2 - x1, 0);
        if (w === this._getColumnWidth(col)) {
            return;
        }
		w = Asc.round(w / this.getZoom());
        var cc = Math.min(this.model.colWidthToCharCount(w), Asc.c_oAscMaxColumnWidth);

        var onChangeWidthCallback = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

            if (viewMode) {
				History.TurnOff();
			}
            var bIsHidden = t.model.getColHidden(col);
            t.model.setColWidth(cc, col, col);
            t._cleanCache(new asc_Range(0, 0, t.cols.length - 1, t.rows.length - 1));
            t.changeWorksheet("update", {reinitRanges: true});
			t._updateGroups(true, undefined, undefined, true);
            t._updateVisibleColsCount();
			t.cellCommentator.updateActiveComment();
            t.cellCommentator.updateAreaComments();
            if (t.objectRender) {
                if(bIsHidden !==  t.model.getColHidden(col)) {
                    t.objectRender.rebuildChartGraphicObjects([new asc_Range(col, 0, col, gc_nMaxRow0)]);
                }

            }
			if (viewMode) {
				History.TurnOn();
			}
        };
        if (viewMode) {
			onChangeWidthCallback(true);
		} else {
			this._isLockedAll(onChangeWidthCallback);
		}
    };

    // mouseY - это разница стартовых координат от мыши при нажатии и границы
    WorksheetView.prototype.changeRowHeight = function (row, y2, mouseY) {
		var viewMode = this.handlers.trigger('getViewMode');
        var t = this;
        // Учитываем координаты точки, где мы начали изменение размера
        y2 += mouseY;

        var offsetFrozenY = 0;
        var r1 = this.visibleRange.r1;
        if (this.topLeftFrozenCell) {
            var rFrozen = this.topLeftFrozenCell.getRow0() - 1;
            if (0 <= rFrozen) {
                if (row < r1) {
                    r1 = 0;
                } else {
                    offsetFrozenY = this._getRowTop(rFrozen + 1) - this._getRowTop(0);
                }
            }
        }
        var offsetY = this._getRowTop(r1) - t.cellsTop;
        offsetY -= offsetFrozenY;

        var y1 = this._getRowTop(row) - offsetY - gridlineSize;
		var newHeight = Math.max(y2 - y1, 0);
        if (newHeight === this._getRowHeight(row)) {
            return;
        }
		newHeight = Math.min(this.maxRowHeightPx, Asc.round(newHeight / this.getZoom()));

        var onChangeHeightCallback = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

			if (viewMode) {
				History.TurnOff();
			}
            t.model.setRowHeight(AscCommonExcel.convertPxToPt(newHeight), row, row, true);
            t.model.autoFilters.reDrawFilter(null, row);
            t._cleanCache(new asc_Range(0, row, t.cols.length - 1, row));
            t.changeWorksheet("update", {reinitRanges: true});
            t._updateGroups(false, undefined, undefined, true);
            t._updateVisibleRowsCount();
			t.cellCommentator.updateActiveComment();
			t.cellCommentator.updateAreaComments();
            if (t.objectRender) {
				t.objectRender.rebuildChartGraphicObjects([new asc_Range(0, row, gc_nMaxCol0, row)]);
            }
			if (viewMode) {
				History.TurnOn();
			}
        };

		if (viewMode) {
			onChangeHeightCallback(true);
		} else {
			this._isLockedAll(onChangeHeightCallback);
		}
    };


    // Проверяет, есть ли числовые значения в диапазоне
    WorksheetView.prototype._hasNumberValueInActiveRange = function () {
        var cell, cellType, exist = false, setCols = {}, setRows = {};
        // ToDo multiselect
        var selectionRange = this.model.selectionRange.getLast();
        if (selectionRange.isOneCell()) {
            // Для одной ячейки не стоит ничего делать
            return null;
        }
        var mergedRange = this.model.getMergedByCell(selectionRange.r1, selectionRange.c1);
        if (mergedRange && mergedRange.isEqual(selectionRange)) {
            // Для одной ячейки не стоит ничего делать
            return null;
        }

        for (var c = selectionRange.c1; c <= selectionRange.c2; ++c) {
            for (var r = selectionRange.r1; r <= selectionRange.r2; ++r) {
                cell = this._getCellTextCache(c, r);
                if (cell) {
                    // Нашли не пустую ячейку, проверим формат
                    cellType = cell.cellType;
                    if (null == cellType || CellValueType.Number === cellType) {
						exist = setRows[r] = setCols[c] = true;
                    }
                }
            }
        }
        if (exist) {
            // Делаем массивы уникальными и сортируем
            var i, arrCols = [], arrRows = [];
            for(i in setCols) {
				arrCols.push(+i);
            }
			for(i in setRows) {
				arrRows.push(+i);
			}
            return {arrCols: arrCols.sort(fSortAscending), arrRows: arrRows.sort(fSortAscending)};
        } else {
            return null;
        }
    };

    // Автодополняет формулу диапазоном, если это возможно
    WorksheetView.prototype.autoCompleteFormula = function (functionName) {
        var t = this;
        // ToDo autoComplete with multiselect
        var activeCell = this.model.selectionRange.activeCell;
        var ar = this.model.selectionRange.getLast();
        var arCopy = null;
        var arHistorySelect = ar.clone(true);
        var vr = this.visibleRange;

        // Первая верхняя не числовая ячейка
        var topCell = null;
        // Первая левая не числовая ячейка
        var leftCell = null;

        var r = activeCell.row - 1;
        var c = activeCell.col - 1;
        var cell, cellType, isNumberFormat;
        var result = {};
        // Проверим, есть ли числовые значения в диапазоне
        var hasNumber = this._hasNumberValueInActiveRange();
        var val, text;

        if (hasNumber) {
            var i;
            // Есть ли значения в последней строке и столбце
            var hasNumberInLastColumn = (ar.c2 === hasNumber.arrCols[hasNumber.arrCols.length - 1]);
            var hasNumberInLastRow = (ar.r2 === hasNumber.arrRows[hasNumber.arrRows.length - 1]);

            // Нужно уменьшить зону выделения (если она реально уменьшилась)
            var startCol = hasNumber.arrCols[0];
            var startRow = hasNumber.arrRows[0];
            // Старые границы диапазона
            var startColOld = ar.c1;
            var startRowOld = ar.r1;
            // Нужно ли перерисовывать
            var bIsUpdate = false;
            if (startColOld !== startCol || startRowOld !== startRow) {
                bIsUpdate = true;
            }
            if (true === hasNumberInLastRow && true === hasNumberInLastColumn) {
                bIsUpdate = true;
            }
            if (bIsUpdate) {
                this.cleanSelection();
                ar.c1 = startCol;
                ar.r1 = startRow;
                if (false === ar.contains(activeCell.col, activeCell.row)) {
                    // Передвинуть первую ячейку в выделении
                    activeCell.col = startCol;
                    activeCell.row = startRow;
                }
                if (true === hasNumberInLastRow && true === hasNumberInLastColumn) {
                    // Мы расширяем диапазон
                    if (1 === hasNumber.arrRows.length) {
                        // Одна строка или только в последней строке есть значения... (увеличиваем вправо)
                        ar.c2 += 1;
                    } else {
                        // Иначе вводим в строку вниз
                        ar.r2 += 1;
                    }
                }
                this._drawSelection();
            }

            arCopy = ar.clone(true);

            var functionAction = null;
            var changedRange = null;

            if (false === hasNumberInLastColumn && false === hasNumberInLastRow) {
                // Значений нет ни в последней строке ни в последнем столбце (значит нужно сделать формулы в каждой последней ячейке)
                changedRange =
                  [new asc_Range(hasNumber.arrCols[0], arCopy.r2, hasNumber.arrCols[hasNumber.arrCols.length -
                  1], arCopy.r2),
                      new asc_Range(arCopy.c2, hasNumber.arrRows[0], arCopy.c2, hasNumber.arrRows[hasNumber.arrRows.length -
                      1])];
                functionAction = function () {
                    // Пройдемся по последней строке
                    for (i = 0; i < hasNumber.arrCols.length; ++i) {
                        c = hasNumber.arrCols[i];
                        cell = t._getVisibleCell(c, arCopy.r2);
						text = (new asc_Range(c, arCopy.r1, c, arCopy.r2 - 1)).getName();
                        val = "=" + functionName + "(" + text + ")";
                        // ToDo - при вводе формулы в заголовок автофильтра надо писать "0"
                        cell.setValue(val);
                    }
                    // Пройдемся по последнему столбцу
                    for (i = 0; i < hasNumber.arrRows.length; ++i) {
                        r = hasNumber.arrRows[i];
                        cell = t._getVisibleCell(arCopy.c2, r);
                        text = (new asc_Range(arCopy.c1, r, arCopy.c2 - 1, r)).getName();
                        val = "=" + functionName + "(" + text + ")";
                        cell.setValue(val);
                    }
                    // Значение в правой нижней ячейке
                    cell = t._getVisibleCell(arCopy.c2, arCopy.r2);
                    text = (new asc_Range(arCopy.c1, arCopy.r2, arCopy.c2 - 1, arCopy.r2)).getName();
                    val = "=" + functionName + "(" + text + ")";
                    cell.setValue(val);
                };
            } else if (true === hasNumberInLastRow && false === hasNumberInLastColumn) {
                // Есть значения только в последней строке (значит нужно заполнить только последнюю колонку)
                changedRange =
                  new asc_Range(arCopy.c2, hasNumber.arrRows[0], arCopy.c2, hasNumber.arrRows[hasNumber.arrRows.length -
                  1]);
                functionAction = function () {
                    // Пройдемся по последнему столбцу
                    for (i = 0; i < hasNumber.arrRows.length; ++i) {
                        r = hasNumber.arrRows[i];
                        cell = t._getVisibleCell(arCopy.c2, r);
                        text = (new asc_Range(arCopy.c1, r, arCopy.c2 - 1, r)).getName();
                        val = "=" + functionName + "(" + text + ")";
                        cell.setValue(val);
                    }
                };
            } else if (false === hasNumberInLastRow && true === hasNumberInLastColumn) {
                // Есть значения только в последнем столбце (значит нужно заполнить только последнюю строчку)
                changedRange =
                  new asc_Range(hasNumber.arrCols[0], arCopy.r2, hasNumber.arrCols[hasNumber.arrCols.length -
                  1], arCopy.r2);
                functionAction = function () {
                    // Пройдемся по последней строке
                    for (i = 0; i < hasNumber.arrCols.length; ++i) {
                        c = hasNumber.arrCols[i];
                        cell = t._getVisibleCell(c, arCopy.r2);
                        text = (new asc_Range(c, arCopy.r1, c, arCopy.r2 - 1)).getName();
                        val = "=" + functionName + "(" + text + ")";
                        cell.setValue(val);
                    }
                };
            } else {
                // Есть значения и в последнем столбце, и в последней строке
                if (1 === hasNumber.arrRows.length) {
                    changedRange = new asc_Range(arCopy.c2, arCopy.r2, arCopy.c2, arCopy.r2);
                    functionAction = function () {
                        // Одна строка или только в последней строке есть значения...
                        cell = t._getVisibleCell(arCopy.c2, arCopy.r2);
                        // ToDo вводить в первое свободное место, а не сразу за диапазоном
                        text = (new asc_Range(arCopy.c1, arCopy.r2, arCopy.c2 - 1, arCopy.r2)).getName();
                        val = "=" + functionName + "(" + text + ")";
                        cell.setValue(val);
                    };
                } else {
                    changedRange =
                      new asc_Range(hasNumber.arrCols[0], arCopy.r2, hasNumber.arrCols[hasNumber.arrCols.length -
                      1], arCopy.r2);
                    functionAction = function () {
                        // Иначе вводим в строку вниз
                        for (i = 0; i < hasNumber.arrCols.length; ++i) {
                            c = hasNumber.arrCols[i];
                            cell = t._getVisibleCell(c, arCopy.r2);
                            // ToDo вводить в первое свободное место, а не сразу за диапазоном
                            text = (new asc_Range(c, arCopy.r1, c, arCopy.r2 - 1)).getName();
                            val = "=" + functionName + "(" + text + ")";
                            cell.setValue(val);
                        }
                    };
                }
            }

            var onAutoCompleteFormula = function (isSuccess) {
                if (false === isSuccess) {
                    return;
                }

                History.Create_NewPoint();
                History.SetSelection(arHistorySelect.clone());
                History.SetSelectionRedo(arCopy.clone());
                History.StartTransaction();

                asc_applyFunction(functionAction);

                History.EndTransaction();

				t.handlers.trigger("selectionMathInfoChanged", t.getSelectionMathInfo());
				t.draw();
            };

            // Можно ли применять автоформулу
            this._isLockedCells(changedRange, /*subType*/null, onAutoCompleteFormula);

            result.notEditCell = true;
            return result;
        }

        // Ищем первую ячейку с числом
        for (; r >= vr.r1; --r) {
            cell = this._getCellTextCache(activeCell.col, r);
            if (cell) {
                // Нашли не пустую ячейку, проверим формат
                cellType = cell.cellType;
                isNumberFormat = (null === cellType || CellValueType.Number === cellType);
                if (isNumberFormat) {
                    // Это число, мы нашли то, что искали
                    topCell = {
                        c: activeCell.col, r: r, isFormula: cell.isFormula
                    };
                    // смотрим вторую ячейку
                    if (topCell.isFormula && r - 1 >= vr.r1) {
                        cell = this._getCellTextCache(activeCell.col, r - 1);
                        if (cell && cell.isFormula) {
                            topCell.isFormulaSeq = true;
                        }
                    }
                    break;
                }
            }
        }
        // Проверим, первой все равно должна быть колонка
        if (null === topCell || topCell.r !== activeCell.row - 1 || topCell.isFormula && !topCell.isFormulaSeq) {
            for (; c >= vr.c1; --c) {
                cell = this._getCellTextCache(c, activeCell.row);
                if (cell) {
                    // Нашли не пустую ячейку, проверим формат
                    cellType = cell.cellType;
                    isNumberFormat = (null === cellType || CellValueType.Number === cellType);
                    if (isNumberFormat) {
                        // Это число, мы нашли то, что искали
                        leftCell = {
                            r: activeCell.row, c: c
                        };
                        break;
                    }
                }
                if (null !== topCell) {
                    // Если это не первая ячейка слева от текущей и мы нашли верхнюю, то дальше не стоит искать
                    break;
                }
            }
        }

        if (leftCell) {
            // Идем влево до первой не числовой ячейки
            --c;
            for (; c >= 0; --c) {
                cell = this._getCellTextCache(c, activeCell.row);
                if (!cell) {
                    // Могут быть еще не закешированные данные
                    this._addCellTextToCache(c, activeCell.row);
                    cell = this._getCellTextCache(c, activeCell.row);
                    if (!cell) {
                        break;
                    }
                }
                cellType = cell.cellType;
                isNumberFormat = (null === cellType || CellValueType.Number === cellType);
                if (!isNumberFormat) {
                    break;
                }
            }
            // Мы ушли чуть дальше
            ++c;
            // Диапазон или только 1 ячейка
            if (activeCell.col - 1 !== c) {
                // Диапазон
                result = new asc_Range(c, leftCell.r, activeCell.col - 1, leftCell.r);
            } else {
                // Одна ячейка
                result = new asc_Range(c, leftCell.r, c, leftCell.r);
            }
            this._fixSelectionOfMergedCells(result);
			result.text = result.getName();
        }

        if (topCell) {
            // Идем вверх до первой не числовой ячейки
            --r;
            for (; r >= 0; --r) {
                cell = this._getCellTextCache(activeCell.col, r);
                if (!cell) {
                    // Могут быть еще не закешированные данные
                    this._addCellTextToCache(activeCell.col, r);
                    cell = this._getCellTextCache(activeCell.col, r);
                    if (!cell) {
                        break;
                    }
                }
                cellType = cell.cellType;
                isNumberFormat = (null === cellType || CellValueType.Number === cellType);
                if (!isNumberFormat) {
                    break;
                }
            }
            // Мы ушли чуть дальше
            ++r;
            // Диапазон или только 1 ячейка
            if (activeCell.row - 1 !== r) {
                // Диапазон
                result = new asc_Range(topCell.c, r, topCell.c, activeCell.row - 1);
            } else {
                // Одна ячейка
                result = new asc_Range(topCell.c, r, topCell.c, r);
            }
            this._fixSelectionOfMergedCells(result);
			result.text = result.getName();
        }

		return result;
    };

    WorksheetView.prototype._prepareComments = function () {
        // ToDo возможно не нужно это делать именно тут..
        if (0 < this.model.aComments.length) {
            this.model.workbook.handlers.trigger("asc_onAddComments", this.model.aComments);
        }
    };

    WorksheetView.prototype._prepareDrawingObjects = function () {
        this.objectRender = new AscFormat.DrawingObjects();
        if (!window["NATIVE_EDITOR_ENJINE"] || window['IS_NATIVE_EDITOR'] || window['DoctRendererMode']) {
            this.objectRender.init(this);
        }
    };

    WorksheetView.prototype._initCellsArea = function (type) {
        // calculate rows heights and visible rows
		this._calcHeaderRowHeight();
		this._calcHeightRows(type);
        this._updateVisibleRowsCount(/*skipScrolReinit*/true);

        // calculate columns widths and visible columns
		this._calcWidthColumns(type);
        this._updateVisibleColsCount(/*skipScrolReinit*/true);
    };

    WorksheetView.prototype._initPane = function () {
        var pane = this.model.getSheetView().pane;
        if ( null !== pane && pane.isInit() && !window['IS_NATIVE_EDITOR']) {
            this.topLeftFrozenCell = pane.topLeftFrozenCell;
            this.visibleRange.r1 = this.topLeftFrozenCell.getRow0();
            this.visibleRange.c1 = this.topLeftFrozenCell.getCol0();
        }
    };

    WorksheetView.prototype._getSelection = function () {
        return (this.isFormulaEditMode) ? this.arrActiveFormulaRanges[this.arrActiveFormulaRangesPosition] :
          this.model.selectionRange;
    };

    WorksheetView.prototype._fixVisibleRange = function ( range ) {
        var tmp;
        if ( null !== this.topLeftFrozenCell ) {
            tmp = this.topLeftFrozenCell.getRow0();
            if ( range.r1 < tmp ) {
                range.r1 = tmp;
                tmp = this._findVisibleRow( range.r1, +1 );
                if ( 0 < tmp ) {
                    range.r1 = tmp;
                }
            }
            tmp = this.topLeftFrozenCell.getCol0();
            if ( range.c1 < tmp ) {
                range.c1 = tmp;
                tmp = this._findVisibleCol( range.c1, +1 );
                if ( 0 < tmp ) {
                    range.c1 = tmp;
                }
            }
        }
    };

	WorksheetView.prototype._calcColWidth = function (x, i) {
		var w, hiddenW = 0;
		// Получаем свойства колонки
		var column = this.model._getColNoEmptyWithAll(i);
		if (!column) {
			w = this.defaultColWidthPx; // Используем дефолтное значение
		} else if (column.getHidden()) {
			w = 0;            // Если столбец скрытый, ширину выставляем 0
			hiddenW = column.widthPx || this.defaultColWidthPx;
		} else {
			w = null === column.widthPx ? this.defaultColWidthPx : column.widthPx;
		}

		this.cols[i] = new CacheColumn(w);
		this.cols[i].width = Asc.round(w * this.getZoom());
		this.cols[i].left = x;

		return hiddenW;
	};

	WorksheetView.prototype._calcHeightRow = function (y, i) {
		var t = this;
		var r, hR, hiddenH = 0;
		this.model._getRowNoEmptyWithAll(i, function (row) {
			if (!row) {
				hR = -1; // Будет использоваться дефолтная высота строки
			} else if (row.getHidden()) {
				hR = 0;  // Скрытая строка, высоту выставляем 0
				hiddenH += row.h > 0 ? row.h - 1 : t.defaultRowHeightPx;
			} else {
				// Берем высоту из модели, если она custom(баг 15618), либо дефолтную
				if (row.h > 0 && (row.getCustomHeight() || row.getCalcHeight())) {
					hR = row.h;
				} else {
					hR = -1;
				}
			}
		});
		if (hR < 0) {
			hR = AscCommonExcel.oDefaultMetrics.RowHeight;
		}
		r = this.rows[i] = new CacheRow();
		r.top = y;
		r.height = Asc.round(AscCommonExcel.convertPtToPx(hR) * this.getZoom());
		r.descender = this.defaultRowDescender;

		return hiddenH;
	};

    /** Вычисляет ширину колонки заголовков */
    WorksheetView.prototype._calcHeaderColumnWidth = function () {
    	var old = this.cellsLeft;
        if (false === this.model.getSheetView().asc_getShowRowColHeaders()) {
            this.headersWidth = 0;
        } else {
            // Ширина колонки заголовков считается  - max число знаков в строке - перевести в символы - перевести в пикселы
            var numDigit = Math.max(AscCommonExcel.calcDecades(this.visibleRange.r2 + 1), 3);
            var nCharCount = this.model.charCountToModelColWidth(numDigit);
            this.headersWidth = Asc.round(this.model.modelColWidthToColWidth(nCharCount) * this.getZoom());
        }
        //todo приравниваю headersLeft и groupWidth. Необходимо пересмотреть!
        this.headersLeft = this.ignoreGroupSize ? 0 : this.groupWidth;
        this.cellsLeft = this.headersLeft + this.headersWidth;
        return old !== this.cellsLeft;
    };

    /** Вычисляет высоту строки заголовков */
    WorksheetView.prototype._calcHeaderRowHeight = function () {
		this.headersHeight = (false === this.model.getSheetView().asc_getShowRowColHeaders()) ? 0 :
			Asc.round(this.headersHeightByFont * this.getZoom());

		//todo приравниваю headersTop и groupHeight. Необходимо пересмотреть!
		this.headersTop = this.ignoreGroupSize ? 0 : this.groupHeight;
        this.cellsTop = this.headersTop + this.headersHeight;
    };

    /**
     * Вычисляет ширину и позицию колонок
     * @param {AscCommonExcel.recalcType} type
     */
    WorksheetView.prototype._calcWidthColumns = function (type) {
        var x = 0;
        var l = this.model.getColsCount();
        var i = 0, hiddenW = 0;

        if (AscCommonExcel.recalcType.full === type) {
            this.cols = [];
        } else if (AscCommonExcel.recalcType.newLines === type) {
            i = this.cols.length;
            x = this._getColLeft(i) - this.cellsLeft;
        }
		for (; i < l; ++i) {
			hiddenW += this._calcColWidth(x, i);
            x += this._getColumnWidth(i);
        }

        this.nColsCount = Math.min(Math.max(this.nColsCount, i), gc_nMaxCol);
    };

    /**
     * Вычисляет высоту и позицию строк
     * @param {AscCommonExcel.recalcType} type
     */
    WorksheetView.prototype._calcHeightRows = function (type) {
        var y = this.cellsTop;
        var l = this.model.getRowsCount();
        var i = 0, hiddenH = 0;

        if (AscCommonExcel.recalcType.full === type) {
            this.rows = [];
        } else if (AscCommonExcel.recalcType.newLines === type) {
            i = this.rows.length;
            y = this._getRowTop(i);
        }
        for (; i < l; ++i) {
			hiddenH += this._calcHeightRow(y, i);
			y += this._getRowHeight(i);
        }

        this.nRowsCount = Math.min(Math.max(this.nRowsCount, i), gc_nMaxRow);
    };

    /** Вычисляет диапазон индексов видимых колонок */
    WorksheetView.prototype._calcVisibleColumns = function () {
        var w = this.drawingCtx.getWidth();
        var sumW = this.topLeftFrozenCell ? this._getColLeft(this.topLeftFrozenCell.getCol0()) : this.cellsLeft;
        for (var i = this.visibleRange.c1, f = false; i < this.nColsCount && sumW < w; ++i) {
            sumW += this._getColumnWidth(i);
            f = true;
        }
        this.visibleRange.c2 = i - (f ? 1 : 0);
    };

    /** Вычисляет диапазон индексов видимых строк */
    WorksheetView.prototype._calcVisibleRows = function () {
        var h = this.drawingCtx.getHeight();
        var sumH = this.topLeftFrozenCell ? this._getRowTop(this.topLeftFrozenCell.getRow0()) : this.cellsTop;
        for (var i = this.visibleRange.r1, f = false; i < this.nRowsCount && sumH < h; ++i) {
            sumH += this._getRowHeight(i);
            f = true;
        }
        this.visibleRange.r2 = i - (f ? 1 : 0);
		if (this._calcHeaderColumnWidth()) {
			this._updateVisibleColsCount(true);
		}
    };

    /** Обновляет позицию колонок */
    WorksheetView.prototype._updateColumnPositions = function () {
        var x = this.cellsLeft;
        for (var l = this.cols.length, i = 0; i < l; ++i) {
            this.cols[i].left = x;
            x += this.cols[i].width;
        }
    };

    /** Обновляет позицию строк */
    WorksheetView.prototype._updateRowPositions = function () {
        var y = this.cellsTop;
        for (var l = this.rows.length, i = 0; i < l; ++i) {
            this.rows[i].top = y;
            y += this.rows[i].height;
        }
    };

    /** Устанаваливает видимый диапазон ячеек максимально возможным */
    WorksheetView.prototype._normalizeViewRange = function () {
        var t = this;
        var vr = t.visibleRange;
        var w = t.drawingCtx.getWidth() - t.cellsLeft;
        var h = t.drawingCtx.getHeight() - t.cellsTop;
        var vw = this._getColLeft(vr.c2 + 1) - this._getColLeft(vr.c1);
        var vh = this._getRowTop(vr.r2 + 1) - this._getRowTop(vr.r1);
        var i;

        var offsetFrozen = t.getFrozenPaneOffset();
        vw += offsetFrozen.offsetX;
        vh += offsetFrozen.offsetY;

        if ( vw < w ) {
            for ( i = vr.c1 - 1; i >= 0; --i ) {
                vw += this._getColumnWidth(i);
                if ( vw > w ) {
                    break;
                }
            }
            vr.c1 = i + 1;
            if ( vr.c1 >= vr.c2 ) {
                vr.c1 = vr.c2 - 1;
            }
            if ( vr.c1 < 0 ) {
                vr.c1 = 0;
            }
        }

        if ( vh < h ) {
            for ( i = vr.r1 - 1; i >= 0; --i ) {
                vh += this._getRowHeight(i);
                if ( vh > h ) {
                    break;
                }
            }
            vr.r1 = i + 1;
            if ( vr.r1 >= vr.r2 ) {
                vr.r1 = vr.r2 - 1;
            }
            if ( vr.r1 < 0 ) {
                vr.r1 = 0;
            }
        }
    };

    // ----- Drawing for print -----
    WorksheetView.prototype._calcPagesPrint = function(range, pageOptions, indexWorksheet, arrPages, printScale, adjustPrint) {
        if (0 > range.r2 || 0 > range.c2) {
			// Ничего нет
            return;
        }

        var vector_koef = AscCommonExcel.vector_koef / this.getZoom();
        if (AscCommon.AscBrowser.isRetina) {
			vector_koef /= AscCommon.AscBrowser.retinaPixelRatio;
		}

		var isOnlyFirstPage = adjustPrint && adjustPrint.isOnlyFirstPage;

        //TODO убрать использование bFitToWidth/bFitToHeight. сейчас всё должно регулироваться скейлингом
		var bFitToWidth = false;
		var bFitToHeight = false;
		var pageMargins, pageSetup, pageGridLines, pageHeadings;
        if (pageOptions) {
            pageMargins = pageOptions.asc_getPageMargins();
            pageSetup = pageOptions.asc_getPageSetup();
            pageGridLines = pageOptions.asc_getGridLines();
            pageHeadings = pageOptions.asc_getHeadings();
        }

        var pageWidth, pageHeight, pageOrientation, scale;
        if (pageSetup instanceof asc_CPageSetup) {
            pageWidth = pageSetup.asc_getWidth();
            pageHeight = pageSetup.asc_getHeight();
            pageOrientation = pageSetup.asc_getOrientation();
            //bFitToWidth = pageSetup.asc_getFitToWidth();
            //bFitToHeight = pageSetup.asc_getFitToHeight();
        }

		if(printScale) {
			scale = printScale / 100;
		} else {
			//scale пока всегда берём из модели
			var pageSetupModel = this.model.PagePrintOptions ? this.model.PagePrintOptions.pageSetup : null;
			scale = pageSetupModel ? pageSetupModel.asc_getScale() / 100 : 1;
		}

        var pageLeftField, pageRightField, pageTopField, pageBottomField;
        if (pageMargins) {
            pageLeftField = Math.max(pageMargins.asc_getLeft(), c_oAscPrintDefaultSettings.MinPageLeftField);
            pageRightField = Math.max(pageMargins.asc_getRight(), c_oAscPrintDefaultSettings.MinPageRightField);
            pageTopField = Math.max(pageMargins.asc_getTop(), c_oAscPrintDefaultSettings.MinPageTopField);
            pageBottomField = Math.max(pageMargins.asc_getBottom(), c_oAscPrintDefaultSettings.MinPageBottomField);
        }

        if (null == pageGridLines) {
            pageGridLines = c_oAscPrintDefaultSettings.PageGridLines;
        }
        if (null == pageHeadings) {
            pageHeadings = c_oAscPrintDefaultSettings.PageHeadings;
        }

        if (null == pageWidth) {
            pageWidth = c_oAscPrintDefaultSettings.PageWidth;
        }
        if (null == pageHeight) {
            pageHeight = c_oAscPrintDefaultSettings.PageHeight;
        }
        if (null == pageOrientation) {
            pageOrientation = c_oAscPrintDefaultSettings.PageOrientation;
        }

        if (null == pageLeftField) {
            pageLeftField = c_oAscPrintDefaultSettings.PageLeftField;
        }
        if (null == pageRightField) {
            pageRightField = c_oAscPrintDefaultSettings.PageRightField;
        }
        if (null == pageTopField) {
            pageTopField = c_oAscPrintDefaultSettings.PageTopField;
        }
        if (null == pageBottomField) {
            pageBottomField = c_oAscPrintDefaultSettings.PageBottomField;
        }

        if (Asc.c_oAscPageOrientation.PageLandscape === pageOrientation) {
            var tmp = pageWidth;
            pageWidth = pageHeight;
            pageHeight = tmp;
        }

		var pageWidthWithFields = pageWidth - pageLeftField - pageRightField;
		var pageHeightWithFields = pageHeight - pageTopField - pageBottomField;
		var leftFieldInPx = pageLeftField / vector_koef + 1;
		var topFieldInPx = pageTopField / vector_koef + 1;

		if (pageHeadings) {
			// Рисуем заголовки, нужно чуть сдвинуться
			leftFieldInPx += this.cellsLeft;
			topFieldInPx += this.cellsTop;
		}

		//TODO при сравнении резальтатов рассчета страниц в зависимости от scale - LO выдаёт похожие результаты, MS - другие. Необходимо пересмотреть!
		var pageWidthWithFieldsHeadings = ((pageWidth - pageRightField) / vector_koef - leftFieldInPx);
		var pageHeightWithFieldsHeadings = ((pageHeight - pageBottomField) / vector_koef - topFieldInPx);

		var currentColIndex = range.c1;
		var currentWidth = 0;
		var currentRowIndex = range.r1;
		var currentHeight = 0;
		var isCalcColumnsWidth = true;

		var bIsAddOffset = false;
		var nCountOffset = 0;
		var nCountPages = 0;

		while (AscCommonExcel.c_kMaxPrintPages > arrPages.length) {
			if(isOnlyFirstPage && nCountPages > 0) {
				break;
			}

			var newPagePrint = new asc_CPagePrint();

			var colIndex = currentColIndex, rowIndex = currentRowIndex, pageRange;

			newPagePrint.indexWorksheet = indexWorksheet;

			newPagePrint.pageWidth = pageWidth;
			newPagePrint.pageHeight = pageHeight;
			newPagePrint.pageClipRectLeft = pageLeftField / vector_koef;
			newPagePrint.pageClipRectTop = pageTopField / vector_koef;
			newPagePrint.pageClipRectWidth = pageWidthWithFields / vector_koef;
			newPagePrint.pageClipRectHeight = pageHeightWithFields / vector_koef;

			newPagePrint.leftFieldInPx = leftFieldInPx;
			newPagePrint.topFieldInPx = topFieldInPx;

			for (rowIndex = currentRowIndex; rowIndex <= range.r2; ++rowIndex) {
				var currentRowHeight = this._getRowHeight(rowIndex) * scale;
				if (!bFitToHeight && currentHeight + currentRowHeight > pageHeightWithFieldsHeadings) {
					// Закончили рисовать страницу
					rowIndex = rowIndex;
					break;
				}
				if (isCalcColumnsWidth) {
					for (colIndex = currentColIndex; colIndex <= range.c2; ++colIndex) {
						var currentColWidth = this._getColumnWidth(colIndex) * scale;
						if (bIsAddOffset) {
							newPagePrint.startOffset = ++nCountOffset;
							newPagePrint.startOffsetPx = (pageWidthWithFieldsHeadings * newPagePrint.startOffset);
							currentColWidth -= newPagePrint.startOffsetPx;
						}

						if (!bFitToWidth && currentWidth + currentColWidth > pageWidthWithFieldsHeadings &&
							colIndex !== currentColIndex) {
							colIndex = colIndex;
						    break;
						}

						currentWidth += currentColWidth;

						if (!bFitToWidth && currentWidth > pageWidthWithFieldsHeadings &&
							colIndex === currentColIndex) {
							// Смещаем в селедующий раз ячейку
							bIsAddOffset = true;
							++colIndex;
							break;
						} else {
							bIsAddOffset = false;
						}
					}
					isCalcColumnsWidth = false;
					if (pageHeadings) {
						currentWidth += this.cellsLeft;
					}

					if (bFitToWidth) {
						newPagePrint.pageClipRectWidth = Math.max(currentWidth, newPagePrint.pageClipRectWidth);
						newPagePrint.pageWidth = newPagePrint.pageClipRectWidth * vector_koef + (pageLeftField + pageRightField);
					} else {
						newPagePrint.pageClipRectWidth = Math.min(currentWidth, newPagePrint.pageClipRectWidth);
					}
				}

				currentHeight += currentRowHeight;
				currentWidth = 0;
			}

			if (pageHeadings) {
				currentHeight += this.cellsTop;
			}
			if (bFitToHeight) {
				newPagePrint.pageClipRectHeight = Math.max(currentHeight, newPagePrint.pageClipRectHeight);
				newPagePrint.pageHeight = newPagePrint.pageClipRectHeight * vector_koef + (pageTopField + pageBottomField);
			} else {
				newPagePrint.pageClipRectHeight = Math.min(currentHeight, newPagePrint.pageClipRectHeight);
			}

			// Нужно будет пересчитывать колонки
			isCalcColumnsWidth = true;

			// Рисуем сетку
			if (pageGridLines) {
				newPagePrint.pageGridLines = true;
			}

			if (pageHeadings) {
				// Нужно отрисовать заголовки
				newPagePrint.pageHeadings = true;
			}

			pageRange = new asc_Range(currentColIndex, currentRowIndex, colIndex - 1, rowIndex - 1);
			newPagePrint.pageRange = pageRange;
			//чтобы передать временный scale(допустим при печати выделенного) добавляем его в pagePrint
			if(printScale) {
				newPagePrint.scale = printScale / 100;
			} else if(scale) {
				newPagePrint.scale = scale;
			}
			arrPages.push(newPagePrint);
			nCountPages++;

			if (bIsAddOffset) {
				// Мы еще не дорисовали колонку
				colIndex -= 1;
			} else {
				nCountOffset = 0;
			}

			if (colIndex <= range.c2) {
				// Мы еще не все колонки отрисовали
				currentColIndex = colIndex;
				currentHeight = 0;
			} else {
				// Мы дорисовали все колонки, нужна новая строка и стартовая колонка
				currentColIndex = range.c1;
				currentRowIndex = rowIndex;
				currentHeight = 0;
			}

			if (rowIndex > range.r2) {
				// Мы вышли, т.к. дошли до конца отрисовки по строкам
				if (colIndex <= range.c2) {
					currentColIndex = colIndex;
					currentHeight = 0;
				} else {
					// Мы дошли до конца отрисовки
					currentColIndex = colIndex;
					currentRowIndex = rowIndex;
					break;
				}
			}
		}
    };

	WorksheetView.prototype._checkPrintRange = function (range, doNotRecalc) {
		if(!doNotRecalc) {
			this._prepareCellTextMetricsCache(range);
		}

		var maxCol = -1;
		var maxRow = -1;

		var t = this;
		var rowCache, rightSide, curRow = -1, hiddenRow = false;
		this.model.getRange3(range.r1, range.c1, range.r2, range.c2)._foreachNoEmpty(function(cell) {
			var c = cell.nCol;
			var r = cell.nRow;
			if (curRow !== r) {
				curRow = r;
				hiddenRow = 0 === t._getRowHeight(r);
				rowCache = t._getRowCache(r);
			}
			if(!hiddenRow && 0 < t._getColumnWidth(c)){
				var style = cell.getStyle();
				if (style && ((style.fill && style.fill.notEmpty()) || (style.border && style.border.notEmpty()))) {
					maxCol = Math.max(maxCol, c);
					maxRow = Math.max(maxRow, r);
				}
				var ct = t._getCellTextCache(c, r);
				if (ct !== undefined) {
					rightSide = 0;
					if (!ct.flags.isMerged() && !ct.flags.wrapText) {
						rightSide = ct.sideR;
					}

					maxCol = Math.max(maxCol, c + rightSide);
					maxRow = Math.max(maxRow, r);
				}
			}
		});

		return new AscCommon.CellBase(maxRow, maxCol);
	};

    WorksheetView.prototype.calcPagesPrint = function (pageOptions, printOnlySelection, indexWorksheet, arrPages, arrRanges, adjustPrint, doNotRecalc) {
		var range, maxCell, t = this;
		var _printArea = this.model.workbook.getDefinesNames("Print_Area", this.model.getId());
		var ignorePrintArea = adjustPrint ? adjustPrint.asc_getIgnorePrintArea() : null;
		var printArea = !ignorePrintArea && _printArea;

		this.recalcPrintScale();

		var oldPagePrintOptions;
		if(this.model.PagePrintOptions) {
			oldPagePrintOptions = this.model.PagePrintOptions;
			this.model.PagePrintOptions = pageOptions;
		}

		//this.model.PagePrintOptions.pageSetup.scale  = 145;

		var getPrintAreaRanges = function() {
			var res = false;
			AscCommonExcel.executeInR1C1Mode(false, function () {
				res = AscCommonExcel.getRangeByRef(printArea.ref, t.model, true, true, true)
			});
			return res && res.length ? res : null;
		};

		//TODO для печати не нужно учитывать размер группы
		if(this.groupWidth || this.groupHeight) {
			this.ignoreGroupSize = true;
			this._calcHeaderColumnWidth();
			this._calcHeaderRowHeight();
		}

		var printAreaRanges = !printOnlySelection && printArea ? getPrintAreaRanges() : null;
		var pageSetup = pageOptions.asc_getPageSetup();
		var fitToWidth = pageSetup.asc_getFitToWidth();
		var fitToHeight = pageSetup.asc_getFitToHeight();
		var _scale = pageSetup.asc_getScale();

		//проверяем, не пришли ли настройки масштабирование, отличные от тех, которые лежат в модели
		var checkCustomScaleProps = function() {
			var _res;

			var _pageOptions = t.model.PagePrintOptions;
			var _pageSetup = _pageOptions.asc_getPageSetup();
			var modelScale = _pageSetup.asc_getScale();

			if(fitToWidth || fitToHeight) {
				_res = t.calcPrintScale(fitToWidth, fitToHeight);
			}
			if(_res !== null && _res !== modelScale) {
				return _res;
			}

			return null;
		};

		if (printOnlySelection) {
			var tempPrintScale;
			//подменяем scale на временный для печати выделенной области
			if(fitToWidth || fitToHeight) {
				tempPrintScale = this.calcPrintScale(fitToWidth, fitToHeight, true);
			}

			for (var i = 0; i < this.model.selectionRange.ranges.length; ++i) {
				range = this.model.selectionRange.ranges[i];
				if (c_oAscSelectionType.RangeCells === range.getType()) {
					if(!doNotRecalc) {
						this._prepareCellTextMetricsCache(range);
					}
				} else {
					maxCell = this._checkPrintRange(range, doNotRecalc);
					range = new asc_Range(range.c1, range.r1, maxCell.col, maxCell.row);
				}

				this._calcPagesPrint(range, pageOptions, indexWorksheet, arrPages, tempPrintScale, adjustPrint);
			}
		} else if(printArea && printAreaRanges) {

			//когда printArea мультиселект - при отрисовке областей печати в специальном режиме
			// необходимо возвращать массив из фрагментов
			//для этого добавил arrRanges
			tempPrintScale = checkCustomScaleProps();
			for(var j = 0; j < printAreaRanges.length; j++) {
				range = printAreaRanges[j];
				if(range && range.bbox) {
					range = range.bbox;
				} else {
					continue;
				}

				if (c_oAscSelectionType.RangeCells === range.getType()) {
					if(!doNotRecalc) {
						this._prepareCellTextMetricsCache(range);
					}
				} else {
					maxCell = this._checkPrintRange(range, doNotRecalc);
					range = new asc_Range(range.c1, range.r1, maxCell.col, maxCell.row);
				}

				if(arrRanges) {
					arrRanges.push(range);
				}

				this._calcPagesPrint(range, pageOptions, indexWorksheet, arrPages, tempPrintScale, adjustPrint);
			}
		} else {
			range = new asc_Range(0, 0, this.model.getColsCount() - 1, this.model.getRowsCount() - 1);
			maxCell = this._checkPrintRange(range, doNotRecalc);
			var maxCol = maxCell.col;
			var maxRow = maxCell.row;

			maxCell = this.model.autoFilters.getMaxColRow();
			maxCol = Math.max(maxCol, maxCell.col);
			maxRow = Math.max(maxRow, maxCell.row);

			// Получаем максимальную колонку/строку для изображений/чатов
			maxCell = this.objectRender.getMaxColRow();
			maxCol = Math.max(maxCol, maxCell.col);
			maxRow = Math.max(maxRow, maxCell.row);

			range = new asc_Range(0, 0, maxCol, maxRow);

			//подменяем scale на временный для печати выделенной области
			if(_printArea && ignorePrintArea && (fitToWidth || fitToHeight)) {
				tempPrintScale = this.calcPrintScale(fitToWidth, fitToHeight, null, ignorePrintArea);
			} else {
				tempPrintScale = checkCustomScaleProps();
			}

			this._calcPagesPrint(range, pageOptions, indexWorksheet, arrPages, tempPrintScale, adjustPrint);
		}

		if(oldPagePrintOptions) {
			this.model.PagePrintOptions = oldPagePrintOptions;
		}

		if(this.groupWidth || this.groupHeight) {
			this.ignoreGroupSize = false;
			this._calcHeaderColumnWidth();
			this._calcHeaderRowHeight();
		}
	};

	WorksheetView.prototype.drawForPrint = function (drawingCtx, printPagesData, indexPrintPage, countPrintPages) {

		this.stringRender.fontNeedUpdate = true;
		if (null === printPagesData) {
			// Напечатаем пустую страницу
			drawingCtx.BeginPage(c_oAscPrintDefaultSettings.PageWidth, c_oAscPrintDefaultSettings.PageHeight);

			//draw header/footer
			this._drawHeaderFooter(drawingCtx, printPagesData, indexPrintPage, countPrintPages);

            if(window['Asc']['editor'].watermarkDraw)
            {
                window['Asc']['editor'].watermarkDraw.zoom = 1;//this.worksheet.objectRender.zoom.current;
                window['Asc']['editor'].watermarkDraw.Generate();
                window['Asc']['editor'].watermarkDraw.StartRenderer();
                window['Asc']['editor'].watermarkDraw.DrawOnRenderer(drawingCtx.DocumentRenderer, c_oAscPrintDefaultSettings.PageWidth, c_oAscPrintDefaultSettings.PageHeight);
                window['Asc']['editor'].watermarkDraw.EndRenderer();
            }
            drawingCtx.EndPage();
        } else {
            drawingCtx.BeginPage(printPagesData.pageWidth, printPagesData.pageHeight);

			this.usePrintScale = true;
			//TODO для печати не нужно учитывать размер группы
			if(this.groupWidth || this.groupHeight) {
				this.ignoreGroupSize = true;
				this._calcHeaderColumnWidth();
				this._calcHeaderRowHeight();
			}

			//draw header/footer
			this._drawHeaderFooter(drawingCtx, printPagesData, indexPrintPage, countPrintPages);

			var printScale = printPagesData.scale ? printPagesData.scale : this.getPrintScale();

			//pageClipRectWidth - ширина страницы без учёта измененного(*scale) хеадера - как при 100%
			//поэтому при расчтетах из него вычетаем размер заголовка как при 100%
			//смещение слева/сверху рассчитывается с учётом измененной ширины заголовков - поэтому домножаем её на printScale
			var headerWidth = printPagesData.pageHeadings ? this.cellsLeft : 0;/*printPagesData.leftFieldInPx - printPagesData.pageClipRectLeft*/
			var headerHeight = printPagesData.pageHeadings ? this.cellsTop : 0;/*printPagesData.topFieldInPx - printPagesData.pageClipRectTop*/
			var _clipWidth = printPagesData.pageClipRectWidth - (headerWidth - headerWidth*printScale);
			var _clipHeight = printPagesData.pageClipRectHeight - (headerHeight - headerHeight*printScale);
			drawingCtx.AddClipRect(printPagesData.pageClipRectLeft, printPagesData.pageClipRectTop, _clipWidth, _clipHeight);

			var transformMatrix;
			if (printScale !== 1 && drawingCtx.Transform) {
				var mmToPx = asc_getcvt(3/*mm*/, 0/*px*/, this._getPPIX());
				var leftDiff = printPagesData.pageClipRectLeft * (1 - printScale);
				var topDiff = printPagesData.pageClipRectTop * (1 - printScale);
				transformMatrix = drawingCtx.Transform.CreateDublicate();

				//drawingCtx.Transform.Scale(printScale, printScale);
				drawingCtx.setTransform(printScale, drawingCtx.Transform.shy, drawingCtx.Transform.shx, printScale,
					leftDiff / mmToPx, topDiff / mmToPx);
			}

			var offsetCols = printPagesData.startOffsetPx;
			var range = printPagesData.pageRange;
			var offsetX = this._getColLeft(range.c1) - printPagesData.leftFieldInPx + offsetCols;
			var offsetY = this._getRowTop(range.r1) - printPagesData.topFieldInPx;

			var tmpVisibleRange = this.visibleRange;
			// Сменим visibleRange для прохождения проверок отрисовки
			this.visibleRange = range;


			// Нужно отрисовать заголовки
			if (printPagesData.pageHeadings) {
				this._drawColumnHeaders(drawingCtx, range.c1, range.c2, /*style*/ undefined, offsetX,
					printPagesData.topFieldInPx - this.cellsTop);
				this._drawRowHeaders(drawingCtx, range.r1, range.r2, /*style*/ undefined,
					printPagesData.leftFieldInPx - this.cellsLeft, offsetY);
			}

			// Рисуем сетку
			if (printPagesData.pageGridLines) {
				var vector_koef = AscCommonExcel.vector_koef / this.getZoom();
				if (AscCommon.AscBrowser.isRetina) {
					vector_koef /= AscCommon.AscBrowser.retinaPixelRatio;
				}
				this._drawGrid(drawingCtx, range, offsetX, offsetY, printPagesData.pageWidth / vector_koef,
					printPagesData.pageHeight / vector_koef, printPagesData.scale);
			}

			// Отрисовываем ячейки и бордеры
			this._drawCellsAndBorders(drawingCtx, range, offsetX, offsetY);

			drawingCtx.RemoveClipRect();

			if (transformMatrix) {
				drawingCtx.setTransform(transformMatrix.sx, transformMatrix.shy, transformMatrix.shx,
					transformMatrix.sy, transformMatrix.tx, transformMatrix.ty);
			}
			this.usePrintScale = false;

			//Отрисовываем панель группировки по строкам
			//this._drawGroupData(drawingCtx, null, offsetX, offsetY);

			var drawingPrintOptions = {
				ctx: drawingCtx, printPagesData: printPagesData
			};
            var oOldBaseTransform = drawingCtx.DocumentRenderer.m_oBaseTransform;
            var oBaseTransform = new AscCommon.CMatrix();
            oBaseTransform.sx = printScale;
            oBaseTransform.sy = printScale;

			oBaseTransform.tx = asc_getcvt(0/*mm*/, 3/*px*/, this._getPPIX()) * ( -offsetCols * printScale  +  printPagesData.pageClipRectLeft + (printPagesData.leftFieldInPx - printPagesData.pageClipRectLeft) * printScale) - (this.getCellLeft(range.c1, 3) - this.getCellLeft(0, 3)) * printScale;
			oBaseTransform.ty = asc_getcvt(0/*mm*/, 3/*px*/, this._getPPIX()) * (printPagesData.pageClipRectTop + (printPagesData.topFieldInPx - printPagesData.pageClipRectTop) * printScale) - (this.getCellTop(range.r1, 3) - this.getCellTop(0, 3)) * printScale;


            drawingCtx.AddClipRect(printPagesData.pageClipRectLeft + headerWidth*printScale,
                printPagesData.pageClipRectTop + headerHeight*printScale, printPagesData.pageClipRectWidth - headerWidth,
                printPagesData.pageClipRectHeight - headerHeight);

            drawingCtx.DocumentRenderer.SetBaseTransform(oBaseTransform);
			this.objectRender.showDrawingObjectsEx(false, null, drawingPrintOptions);
            drawingCtx.DocumentRenderer.SetBaseTransform(oOldBaseTransform);
			this.visibleRange = tmpVisibleRange;

            drawingCtx.RemoveClipRect();

            if(this.groupWidth || this.groupHeight) {
				this.ignoreGroupSize = false;
				this._calcHeaderColumnWidth();
				this._calcHeaderRowHeight();
			}

            drawingCtx.RemoveClipRect();

            if(window['Asc']['editor'].watermarkDraw)
            {
                window['Asc']['editor'].watermarkDraw.zoom = 1;//this.worksheet.objectRender.zoom.current;
                window['Asc']['editor'].watermarkDraw.Generate();
                window['Asc']['editor'].watermarkDraw.StartRenderer();
                window['Asc']['editor'].watermarkDraw.DrawOnRenderer(drawingCtx.DocumentRenderer, printPagesData.pageWidth,
                    printPagesData.pageHeight);
                window['Asc']['editor'].watermarkDraw.EndRenderer();
            }
			this.stringRender.resetTransform(drawingCtx);
            drawingCtx.EndPage();
        }
    };

	WorksheetView.prototype.fitOnOnePage = function(val) {
		//TODO add constant!
		var width = undefined, height = undefined;
		if(val === 0) {
			//sheet
			width = 1;
			height = 1;
			//todo fitToPage
		} else if(val === 1) {
			//columns
			width = 1;
			//pageSetup.asc_setFitToWidth();
		} else {
			//rows
			height = 1;
			//pageSetup.asc_setFitToHeight();
		}

		this.fitToPages(width, height);
	};

	WorksheetView.prototype.setPrintScale = function (width, height, scale) {
		var t = this;
		this._isLockedLayoutOptions(function(success) {
			if(!success) {
				return;
			}
			t.fitToWidthHeight(width, height, ((width === null && height === null) || (width === 0 && height === 0)) ? scale : undefined);
		});
	};

	//пересчитывать необходимо когда после открытия зашли в настройки печати
	WorksheetView.prototype.recalcPrintScale = function () {
		var pageOptions = this.model.PagePrintOptions;
		var pageSetup = pageOptions.asc_getPageSetup();
		var width = pageSetup.asc_getFitToWidth();
		var height = pageSetup.asc_getFitToHeight();

		if(!height && !width) {
			return;
		}

		var calcScale = this.calcPrintScale(width, height);
		if(!isNaN(calcScale)) {
			this._setPrintScale(calcScale);
		}

		//TODO нужно ли в данном случае лочить?
		//this._isLockedLayoutOptions(callback);
	};

	WorksheetView.prototype.fitToPages = function (width, height) {
		//width/height - count of pages
		//automatic -> width/height = undefined
		//define print scale
		this._setPrintScale(this.calcPrintScale(width, height));

		//TODO нужно ли в данном случае лочить?
		//this._isLockedLayoutOptions(callback);
	};

	//вызывается из меню при изменении только scale to fit -> width
	WorksheetView.prototype.fitToWidth = function (val) {
		//width/height - count of pages
		//automatic -> width/height = undefined
		//define print scale

		var t = this;
		var pageOptions = t.model.PagePrintOptions;

		if(val !== pageOptions.asc_getFitToWidth()) {
			History.Create_NewPoint();
			History.StartTransaction();

			pageOptions.asc_setFitToWidth(val);
			this._setPrintScale(this.calcPrintScale(pageOptions.asc_getFitToWidth(), pageOptions.asc_getFitToHeight()));

			History.EndTransaction();
		}

		//TODO нужно ли в данном случае лочить?
		//this._isLockedLayoutOptions(callback);
	};

	//вызывается из меню при изменении только scale to fit -> height
	WorksheetView.prototype.fitToHeight = function (val) {
		//width/height - count of pages
		//automatic -> width/height = undefined
		//define print scale

		var t = this;
		var pageOptions = t.model.PagePrintOptions;

		if(val !== pageOptions.asc_getFitToHeight()) {
			History.Create_NewPoint();
			History.StartTransaction();

			pageOptions.asc_setFitToHeight(val);
			this._setPrintScale(this.calcPrintScale(pageOptions.asc_getFitToWidth(), pageOptions.asc_getFitToHeight()));

			History.EndTransaction();
		}

		//TODO нужно ли в данном случае лочить?
		//this._isLockedLayoutOptions(callback);
	};

	WorksheetView.prototype.fitToWidthHeight = function (width, height, scale) {
		//width/height - count of pages
		//automatic -> width/height = undefined
		//define print scale
		var t = this;
		
		var pageOptions = t.model.PagePrintOptions;
		var pageSetup = pageOptions.asc_getPageSetup();

		if(width === null) {
			width = 0;
		}
		if(height === null) {
			height = 0;
		}

		var fitToPageModel = this.model.sheetPr ? this.model.sheetPr.FitToPage : null;
		var fitToHeightAuto = height === 0 || height === undefined;
		var fitToWidthAuto = width === 0 || width === undefined;
		var changedFitToPage = (!fitToHeightAuto || !fitToWidthAuto) !== fitToPageModel;

		var fitToWidthModel = pageSetup.fitToWidth;
		var changedWidth = width !== fitToWidthModel;
		var fitToHeightModel = pageSetup.fitToHeight;
		var changedHeight = height !== fitToHeightModel;

		var changedScale = scale && scale !== pageSetup.asc_getScale();

		if(changedWidth || changedHeight || changedScale || changedFitToPage) {
			History.Create_NewPoint();
			History.StartTransaction();

			t._changeFitToPage(width, height);

			if(changedWidth) {
				pageSetup.asc_setFitToWidth(width);
			}
			if(changedHeight) {
				pageSetup.asc_setFitToHeight(height);
			}

			if(undefined === scale && (width !== 0 || height !== 0)) {
				scale = t.calcPrintScale(pageSetup.asc_getFitToWidth(), pageSetup.asc_getFitToHeight());
			}
			if(scale) {
				t._setPrintScale(scale);
			}

			t.changeViewPrintLines(true);
			if(t.viewPrintLines) {
				t.updateSelection();
			}

			History.EndTransaction();
		}
	};

	WorksheetView.prototype._setPrintScale = function (val) {
		var pageOptions = this.model.PagePrintOptions;
		var pageSetup = pageOptions.asc_getPageSetup();
		var oldScale = pageSetup.asc_getScale() / 100;

		if(val !== oldScale) {
			History.Create_NewPoint();
			History.StartTransaction();

			pageSetup.asc_setScale(val);

			History.EndTransaction();
		}

		//TODO нужно ли в данном случае лочить?
		//this._isLockedLayoutOptions(callback);
	};

	WorksheetView.prototype._changeFitToPage = function(width, height) {
		var fitToHeightAuto = height === 0 || height === undefined;
		var fitToWidthAuto = width === 0 || width === undefined;
		this.model.setFitToPage(!fitToHeightAuto || !fitToWidthAuto);
	};

	WorksheetView.prototype.calcPrintScale = function(width, height, bSelection, ignorePrintArea) {
		//TODO для печати не нужно учитывать размер группы
		if(this.groupWidth || this.groupHeight) {
			this.ignoreGroupSize = true;
			this._calcHeaderColumnWidth();
			this._calcHeaderRowHeight();
		}

		var pageOptions = this.model.PagePrintOptions;
		var pageMargins, pageSetup, pageGridLines, pageHeadings;
		if (pageOptions) {
			pageMargins = pageOptions.asc_getPageMargins();
			pageSetup = pageOptions.asc_getPageSetup();
			pageGridLines = pageOptions.asc_getGridLines();
			pageHeadings = pageOptions.asc_getHeadings();
		}

		var pageWidth, pageHeight, pageOrientation;
		if (pageSetup instanceof asc_CPageSetup) {
			pageWidth = pageSetup.asc_getWidth();
			pageHeight = pageSetup.asc_getHeight();
			pageOrientation = pageSetup.asc_getOrientation();
		}

		var pageLeftField, pageRightField, pageTopField, pageBottomField;
		if (pageMargins) {
			pageLeftField = Math.max(pageMargins.asc_getLeft(), c_oAscPrintDefaultSettings.MinPageLeftField);
			pageRightField = Math.max(pageMargins.asc_getRight(), c_oAscPrintDefaultSettings.MinPageRightField);
			pageTopField = Math.max(pageMargins.asc_getTop(), c_oAscPrintDefaultSettings.MinPageTopField);
			pageBottomField = Math.max(pageMargins.asc_getBottom(), c_oAscPrintDefaultSettings.MinPageBottomField);
		}


		var vector_koef = AscCommonExcel.vector_koef / this.getZoom();
		if (AscCommon.AscBrowser.isRetina) {
			vector_koef /= AscCommon.AscBrowser.retinaPixelRatio;
		}

		if (null == pageGridLines) {
			pageGridLines = c_oAscPrintDefaultSettings.PageGridLines;
		}
		if (null == pageHeadings) {
			pageHeadings = c_oAscPrintDefaultSettings.PageHeadings;
		}

		if (null == pageWidth) {
			pageWidth = c_oAscPrintDefaultSettings.PageWidth;
		}
		if (null == pageHeight) {
			pageHeight = c_oAscPrintDefaultSettings.PageHeight;
		}
		if (null == pageOrientation) {
			pageOrientation = c_oAscPrintDefaultSettings.PageOrientation;
		}

		if (null == pageLeftField) {
			pageLeftField = c_oAscPrintDefaultSettings.PageLeftField;
		}
		if (null == pageRightField) {
			pageRightField = c_oAscPrintDefaultSettings.PageRightField;
		}
		if (null == pageTopField) {
			pageTopField = c_oAscPrintDefaultSettings.PageTopField;
		}
		if (null == pageBottomField) {
			pageBottomField = c_oAscPrintDefaultSettings.PageBottomField;
		}


		if (Asc.c_oAscPageOrientation.PageLandscape === pageOrientation) {
			var tmp = pageWidth;
			pageWidth = pageHeight;
			pageHeight = tmp;
		}

		var pageWidthWithFields = pageWidth - pageLeftField - pageRightField;
		var pageHeightWithFields = pageHeight - pageTopField - pageBottomField;
		var leftFieldInPx = pageLeftField / vector_koef + 1;
		var topFieldInPx = pageTopField / vector_koef + 1;

		//TODO ms считает именно так - каждый раз прибаляются размеры заголовков к полям. необходимо перепроверить!
		//if (pageHeadings) {
		// Рисуем заголовки, нужно чуть сдвинуться
		leftFieldInPx += this.cellsLeft;
		topFieldInPx += this.cellsTop;
		//}

		//TODO при сравнении резальтатов рассчета страниц в зависимости от scale - LO выдаёт похожие результаты, MS - другие. Необходимо пересмотреть!
		var pageWidthWithFieldsHeadings = ((pageWidth - pageRightField) / vector_koef - leftFieldInPx) /*/ scale*/;
		var pageHeightWithFieldsHeadings = ((pageHeight - pageBottomField) / vector_koef - topFieldInPx) /*/ scale*/;

		var t = this;
		var doCalcScaleWidth = function(start, end) {
			var res;
			if(width) {
				var widthAllCols = pageHeadings ? t.cellsLeft * width : 0;
				for(var i = start; i <= end; i++) {
					widthAllCols += t._getColumnWidth(i);
				}
				res = ((pageWidthWithFieldsHeadings * width) / widthAllCols) * 100;
			}
			return res;
		};
		var doCalcScaleHeight = function(start, end) {
			var res;
			if(height) {
				var heightAllRows = pageHeadings ? t.cellsTop * height : 0;
				for(var i = start; i <= end; i++) {
					heightAllRows += t._getRowHeight(i);
				}
				res = ((pageHeightWithFieldsHeadings * height) / heightAllRows) * 100;
			}
			return res;
		};

		var wScale;
		var hScale;
		var calcScaleByRanges = function(ranges) {
			var tempWScale = null, tempHScale = null;
			for(var i = 0; i < ranges.length; i++) {
				var range = ranges[i].bbox ? ranges[i].bbox : ranges[i];
				tempWScale = doCalcScaleWidth(range.c1, range.c2);
				tempHScale = doCalcScaleHeight(range.r1, range.r2);
				if(!wScale || (tempWScale && wScale > tempWScale)) {
					wScale = tempWScale;
				}
				if(!hScale || (tempHScale && hScale > tempHScale)) {
					hScale = tempHScale;
				}
			}
		};

		if(bSelection) {
			calcScaleByRanges(this._getSelection().ranges);
		} else {
			//TODO ignorePrintArea - необходимо протащить флаг!
			var printArea = !ignorePrintArea && this.model.workbook.getDefinesNames("Print_Area", this.model.getId());
			var getPrintAreaRanges = function() {
				var res = false;
				AscCommonExcel.executeInR1C1Mode(false, function () {
					res = AscCommonExcel.getRangeByRef(printArea.ref, t.model, true, true)
				});
				return res && res.length ? res : null;
			};

			var printAreaRanges = printArea ? getPrintAreaRanges() : null;
			if(printAreaRanges) {
				calcScaleByRanges(printAreaRanges);
			} else {
				//calculate width/height all columns/rows
				var range = new asc_Range(0, 0, this.model.getColsCount() - 1, this.model.getRowsCount() - 1);
				var maxCell = this._checkPrintRange(range);
				var maxCol = maxCell.col;
				var maxRow = maxCell.row;

				maxCell = this.model.autoFilters.getMaxColRow();
				maxCol = Math.max(maxCol, maxCell.col);
				maxRow = Math.max(maxRow, maxCell.row);

				maxCell = this.objectRender.getMaxColRow();
				maxCol = Math.max(maxCol, maxCell.col);
				maxRow = Math.max(maxRow, maxCell.row);

				//TODO print area
				wScale = doCalcScaleWidth(0, maxCol);
				hScale = doCalcScaleHeight(0, maxRow);
			}
		}


		var minScale;
		if(width && height) {
			minScale = Math.min(Math.round(wScale), Math.round(hScale));
		} else if(width) {
			minScale = Math.round(wScale);
		} else {
			minScale = Math.round(hScale);
		}

		if(minScale < 10) {
			minScale = 10;
		}
		if(minScale > 100) {
			minScale = 100;
		}

		if(this.groupWidth || this.groupHeight) {
			this.ignoreGroupSize = false;
			this._calcHeaderColumnWidth();
			this._calcHeaderRowHeight();
		}

		return minScale;
	};

    // ----- Drawing -----

    WorksheetView.prototype.draw = function (lockDraw) {
        if (lockDraw || this.model.workbook.bCollaborativeChanges || window['IS_NATIVE_EDITOR']) {
            return this;
        }
        this._recalculate();
		this.handlers.trigger("checkLastWork");
        this._clean();
        this._drawCorner();
        this._drawColumnHeaders(null);
        this._drawRowHeaders(null);
        this._drawGrid(null);
        this._drawCellsAndBorders(null);
		this._drawGroupData(null);
		this._drawGroupData(null, null, undefined, undefined, true);
        this._drawFrozenPane();
        this._drawFrozenPaneLines();
        this._fixSelectionOfMergedCells();
        this._drawElements(this.af_drawButtons);
        this.cellCommentator.drawCommentCells();
        this.objectRender.showDrawingObjectsEx(true);
        if (this.overlayCtx) {
            this._drawSelection();
        }

        return this;
    };

    WorksheetView.prototype._clean = function () {
        this.drawingCtx
            .setFillStyle( this.settings.cells.defaultState.background )
            .fillRect( 0, 0, this.drawingCtx.getWidth(), this.drawingCtx.getHeight() );
        if ( this.overlayCtx ) {
            this.overlayCtx.clear();
        }
    };

    WorksheetView.prototype.drawHighlightedHeaders = function (col, row) {
        this._activateOverlayCtx();
        if (col >= 0 && col !== this.highlightedCol) {
            this._doCleanHighlightedHeaders();
            this.highlightedCol = col;
            this._drawColumnHeaders(null, col, col, kHeaderHighlighted);
        } else if (row >= 0 && row !== this.highlightedRow) {
            this._doCleanHighlightedHeaders();
            this.highlightedRow = row;
            this._drawRowHeaders(null, row, row, kHeaderHighlighted);
        }
        this._deactivateOverlayCtx();
        return this;
    };

    WorksheetView.prototype.cleanHighlightedHeaders = function () {
        this._activateOverlayCtx();
        this._doCleanHighlightedHeaders();
        this._deactivateOverlayCtx();
        return this;
    };

    WorksheetView.prototype._activateOverlayCtx = function () {
        this.drawingCtx = this.buffers.overlay;
    };

    WorksheetView.prototype._deactivateOverlayCtx = function () {
        this.drawingCtx = this.buffers.main;
    };

    WorksheetView.prototype._doCleanHighlightedHeaders = function () {
        // ToDo highlighted!
        var hlc = this.highlightedCol, hlr = this.highlightedRow, arn = this.model.selectionRange.getLast();
        var hStyle = this.objectRender.selectedGraphicObjectsExists() ? kHeaderDefault : kHeaderActive;
        if (hlc >= 0) {
            if (hlc >= arn.c1 && hlc <= arn.c2) {
                this._drawColumnHeaders(null, hlc, hlc, hStyle);
            } else {
                this._cleanColumnHeaders(hlc);
                if (hlc + 1 === arn.c1) {
                    this._drawColumnHeaders(null, hlc + 1, hlc + 1, kHeaderActive);
                } else if (hlc - 1 === arn.c2) {
                    this._drawColumnHeaders(null, hlc - 1, hlc - 1, hStyle);
                }
            }
            this.highlightedCol = -1;
        }
        if (hlr >= 0) {
            if (hlr >= arn.r1 && hlr <= arn.r2) {
                this._drawRowHeaders(null, hlr, hlr, hStyle);
            } else {
                this._cleanRowHeaders(hlr);
                if (hlr + 1 === arn.r1) {
                    this._drawRowHeaders(null, hlr + 1, hlr + 1, kHeaderActive);
                } else if (hlr - 1 === arn.r2) {
                    this._drawRowHeaders(null, hlr - 1, hlr - 1, hStyle);
                }
            }
            this.highlightedRow = -1;
        }
    };

    WorksheetView.prototype._drawActiveHeaders = function () {
        var vr = this.visibleRange;
        var range, c1, c2, r1, r2;
        this._activateOverlayCtx();
        for (var i = 0; i < this.model.selectionRange.ranges.length; ++i) {
            range = this.model.selectionRange.ranges[i];
            c1 = Math.max(vr.c1, range.c1);
            c2 = Math.min(vr.c2, range.c2);
            r1 = Math.max(vr.r1, range.r1);
            r2 = Math.min(vr.r2, range.r2);
            this._drawColumnHeaders(null, c1, c2, kHeaderActive);
            this._drawRowHeaders(null, r1, r2, kHeaderActive);
            if (this.topLeftFrozenCell) {
                var cFrozen = this.topLeftFrozenCell.getCol0() - 1;
                var rFrozen = this.topLeftFrozenCell.getRow0() - 1;
                if (0 <= cFrozen) {
                    c1 = Math.max(0, range.c1);
                    c2 = Math.min(cFrozen, range.c2);
                    this._drawColumnHeaders(null, c1, c2, kHeaderActive);
                }
                if (0 <= rFrozen) {
                    r1 = Math.max(0, range.r1);
                    r2 = Math.min(rFrozen, range.r2);
                    this._drawRowHeaders(null, r1, r2, kHeaderActive);
                }
            }
        }
        this._deactivateOverlayCtx();
    };

    WorksheetView.prototype._drawCorner = function () {
        if (false === this.model.getSheetView().asc_getShowRowColHeaders()) {
            return;
        }
        var x2 = this.headersLeft + this.headersWidth;
        var x1 = x2 - this.headersHeight;
        var y2 = this.headersTop + this.headersHeight;
        var y1 = this.headersTop;

        var dx = 4;
        var dy = 4;

        this._drawHeader(null, this.headersLeft, this.headersTop, this.headersWidth,
          this.headersHeight, kHeaderDefault, true, -1);
        this.drawingCtx.beginPath()
          .moveTo(x2 - dx, y1 + dy)
          .lineTo(x2 - dx, y2 - dy)
          .lineTo(x1 + dx, y2 - dy)
          .lineTo(x2 - dx, y1 + dy)
          .setFillStyle(this.settings.header.cornerColor)
          .fill();
    };

    /** Рисует заголовки видимых колонок */
    WorksheetView.prototype._drawColumnHeaders = function (drawingCtx, start, end, style, offsetXForDraw, offsetYForDraw) {
          if (!drawingCtx && false === this.model.getSheetView().asc_getShowRowColHeaders()) {
              return;
          }

		  if (window["IS_NATIVE_EDITOR"]) {
			  // for ios (TODO check the need)
			  this._prepareCellTextMetricsCache(new asc_Range(start, 0, end, 1));
		  }

          var vr = this.visibleRange;
          var offsetX = (undefined !== offsetXForDraw) ? offsetXForDraw : this._getColLeft(vr.c1) - this.cellsLeft;
          var offsetY = (undefined !== offsetYForDraw) ? offsetYForDraw : this.headersTop;
          if (!drawingCtx && this.topLeftFrozenCell && undefined === offsetXForDraw) {
              var cFrozen = this.topLeftFrozenCell.getCol0();
              if (start < vr.c1) {
                  offsetX = this._getColLeft(0) - this.cellsLeft;
              } else {
                  offsetX -= this._getColLeft(cFrozen) - this._getColLeft(0);
              }
          }

          if (asc_typeof(start) !== "number") {
              start = vr.c1;
          }
          if (asc_typeof(end) !== "number") {
              end = vr.c2;
          }
          if (style === undefined) {
              style = kHeaderDefault;
          }

          this._setDefaultFont(drawingCtx);

          // draw column headers
		  var l = this._getColLeft(start) - offsetX, w;
          for (var i = start; i <= end; ++i) {
          	w = this._getColumnWidth(i);
              this._drawHeader(drawingCtx, l, offsetY, w, this.headersHeight, style, true, i);
              l += w;
          }
      };

    /** Рисует заголовки видимых строк */
    WorksheetView.prototype._drawRowHeaders = function (drawingCtx, start, end, style, offsetXForDraw, offsetYForDraw) {
        if (!drawingCtx && false === this.model.getSheetView().asc_getShowRowColHeaders()) {
            return;
        }
        var vr = this.visibleRange;
        var offsetX = (undefined !== offsetXForDraw) ? offsetXForDraw : this.headersLeft;
        var offsetY = (undefined !== offsetYForDraw) ? offsetYForDraw : this._getRowTop(vr.r1) - this.cellsTop;
        if (!drawingCtx && this.topLeftFrozenCell && undefined === offsetYForDraw) {
            var rFrozen = this.topLeftFrozenCell.getRow0();
            if (start < vr.r1) {
				offsetY = this._getRowTop(0) - this.cellsTop;
			} else {
                offsetY -= this._getRowTop(rFrozen) - this._getRowTop(0);
            }
        }

        if (asc_typeof(start) !== "number") {
            start = vr.r1;
        }
        if (asc_typeof(end) !== "number") {
            end = vr.r2;
        }
        if (style === undefined) {
            style = kHeaderDefault;
        }

        this._setDefaultFont(drawingCtx);

        // draw row headers
        var t = this._getRowTop(start) - offsetY, h;
        for (var i = start; i <= end; ++i) {
			h = this._getRowHeight(i);
            this._drawHeader(drawingCtx, offsetX, t, this.headersWidth, h, style, false, i);
			t += h;
        }
    };

    /**
     * Рисует заголовок, принимает координаты и размеры в px
     * @param {DrawingContext} drawingCtx
     * @param {Number} x  Координата левого угла в px
     * @param {Number} y  Координата левого угла в px
     * @param {Number} w  Ширина в px
     * @param {Number} h  Высота в px
     * @param {Number} style  Стиль заголовка (kHeaderDefault, kHeaderActive, kHeaderHighlighted)
     * @param {Boolean} isColHeader  Тип заголовка: true - колонка, false - строка
     * @param {Number} index  Индекс столбца/строки или -1
     */
    WorksheetView.prototype._drawHeader = function (drawingCtx, x, y, w, h, style, isColHeader, index) {
        // Для отрисовки невидимого столбца/строки
        var isZeroHeader = false;
        if (-1 !== index) {
            if (isColHeader) {
                if (0 === w) {
                    if (style !== kHeaderDefault) {
                        return;
                    }
                    // Это невидимый столбец
                    isZeroHeader = true;
                    // Отрисуем только границу
                    w = 1;
                    // Возможно мы уже рисовали границу невидимого столбца (для последовательности невидимых)
                    if (0 < index && 0 === this._getColumnWidth(index - 1)) {
                        // Мы уже нарисовали border для невидимой границы
                        return;
                    }
                } else if (0 < index && 0 === this._getColumnWidth(index - 1)) {
                    // Мы уже нарисовали border для невидимой границы (поэтому нужно чуть меньше рисовать для соседнего столбца)
                    w -= 1;
                    x += 1;
                }
            } else {
                if (0 === h) {
                    if (style !== kHeaderDefault) {
                        return;
                    }
                    // Это невидимая строка
                    isZeroHeader = true;
                    // Отрисуем только границу
                    h = 1;
                    // Возможно мы уже рисовали границу невидимой строки (для последовательности невидимых)
                    if (0 < index && 0 === this._getRowHeight(index - 1)) {
                        // Мы уже нарисовали border для невидимой границы
                        return;
                    }
                } else if (0 < index && 0 === this._getRowHeight(index - 1)) {
                    // Мы уже нарисовали border для невидимой границы (поэтому нужно чуть меньше рисовать для соседней строки)
                    h -= 1;
                    y += 1;
                }
            }
        }

        var ctx = drawingCtx || this.drawingCtx;
        var st = this.settings.header.style[style];
        var x2 = x + w;
        var y2 = y + h;
        var x2WithoutBorder = x2 - gridlineSize;
        var y2WithoutBorder = y2 - gridlineSize;

        // background только для видимых
        if (!isZeroHeader) {
            // draw background
            ctx.setFillStyle(st.background)
              .fillRect(x, y, w, h);
        }
        // draw border
        ctx.setStrokeStyle(st.border)
          .setLineWidth(1)
          .beginPath();
        if (style !== kHeaderDefault && !isColHeader && !window["IS_NATIVE_EDITOR"]) {
            // Select row (top border)
            ctx.lineHorPrevPx(x, y, x2);
        }

        // Right border
		if (isColHeader || !window["IS_NATIVE_EDITOR"]) {
			ctx.lineVerPrevPx(x2, y, y2);
		}
        // Bottom border
		if (!isColHeader || !window["IS_NATIVE_EDITOR"]) {
			ctx.lineHorPrevPx(x, y2, x2);
		}

        if (style !== kHeaderDefault && isColHeader) {
            // Select col (left border)
            ctx.lineVerPrevPx(x, y, y2);
        }
        ctx.stroke();

        // Для невидимых кроме border-а ничего не рисуем
        if (isZeroHeader || -1 === index) {
            return;
        }

        // draw text
        var text = isColHeader ? this._getColumnTitle(index) : this._getRowTitle(index);
        var sr = this.stringRender;
        var tm = this._roundTextMetrics(sr.measureString(text));
		var bl = y2WithoutBorder - Asc.round((isColHeader ? this.defaultRowDescender : this._getRowDescender(index)) * this.getZoom());
        var textX = this._calcTextHorizPos(x, x2WithoutBorder, tm, tm.width < w ? AscCommon.align_Center : AscCommon.align_Left);
        var textY = this._calcTextVertPos(y, h, bl, tm, Asc.c_oAscVAlign.Bottom);

		ctx.AddClipRect(x, y, w, h);
		ctx.setFillStyle(st.color).fillText(text, textX, textY + Asc.round(tm.baseline * this.getZoom()), undefined, sr.charWidths);
		ctx.RemoveClipRect();
    };

	WorksheetView.prototype._drawHeaderFooter = function (drawingCtx, printPagesData, indexPrintPage, countPrintPages) {
		//odd - нечетные страницы, even - четные. в случае если флаг differentOddEven не выставлен, используем odd

		if(!printPagesData) {
			return;
		}

		var headerFooterModel = this.model.headerFooter;
		//HEADER
		var curHeader;
		if(indexPrintPage === 0 && headerFooterModel.differentFirst) {
			curHeader = headerFooterModel.getFirstHeader();
		} else if(headerFooterModel.differentOddEven) {
			curHeader = 0 === (indexPrintPage + 1) % 2 ? headerFooterModel.getEvenHeader() : headerFooterModel.getOddHeader();
		} else {
			curHeader = headerFooterModel.getOddHeader();
		}

		if(curHeader) {
			if(!curHeader.parser) {
				curHeader.parser = new AscCommonExcel.HeaderFooterParser();
				curHeader.parser.parse(curHeader.str);
			}
			this._drawHeaderFooterText(drawingCtx, printPagesData, curHeader.parser, indexPrintPage, countPrintPages);
		}

		//FOOTER
		var curFooter;
		if(indexPrintPage === 0 && headerFooterModel.differentFirst) {
			curFooter = headerFooterModel.getFirstFooter();
		} else if(headerFooterModel.differentOddEven) {
			curFooter = 0 === (indexPrintPage + 1) % 2 ? headerFooterModel.getEvenFooter() : headerFooterModel.getOddFooter();
		} else {
			curFooter = headerFooterModel.getOddFooter();
		}

		if(curFooter) {
			if(!curFooter.parser) {
				curFooter.parser = new AscCommonExcel.HeaderFooterParser();
				curFooter.parser.parse(curFooter.str);
			}
			this._drawHeaderFooterText(drawingCtx, printPagesData, curFooter.parser, indexPrintPage, countPrintPages, true);
		}
	};

	/** Рисует текст ячейки */
	WorksheetView.prototype._drawHeaderFooterText = function (drawingCtx, printPagesData, headerFooterParser, indexPrintPage, countPrintPages, bFooter) {
        //TODO нужно проверить на retina!!!

		var t = this;

		var getFragmentText = function(val) {
			if ( asc_typeof(val) === "string" ){
				return val;
			} else {
				return val.getText(t, indexPrintPage, countPrintPages);
			}
		};

		var getFragments = function(portion) {
			var res = [];
			for(var i = 0; i < portion.length; i++){
				var str = new AscCommonExcel.Fragment();
				str.text = getFragmentText(portion[i].text);
				str.format = portion[i].format.clone();
				//TODO уменьшаю только размер текста. пересмотреть!
				var fSize = str.format.fs ? str.format.fs : AscCommonExcel.g_oDefaultFormat.Font.fs;
				str.format.fs = fSize * printScale;
				res.push(str);
			}
			return res;
		};

		var vector_koef = AscCommonExcel.vector_koef / this.getZoom();
		if (AscCommon.AscBrowser.isRetina) {
			vector_koef /= AscCommon.AscBrowser.retinaPixelRatio;
		}

		var scaleWithDoc = this.model.headerFooter.getScaleWithDoc();
		var printScale = (scaleWithDoc === null || scaleWithDoc === true) ? this.getPrintScale() : 1;

		var margins = this.model.PagePrintOptions.asc_getPageMargins();
		var width = printPagesData.pageWidth / vector_koef;
		var height = printPagesData.pageHeight / vector_koef;

		//это стандартный маргин для случая, если alignWithMargins = true
		//TODO необходимо перепроверить размер маргина
		var defaultMargin = 17.8;
		var alignWithMargins = this.model.headerFooter.getAlignWithMargins();
		var left =  alignWithMargins ? margins.left / vector_koef : defaultMargin / vector_koef;
		var right = alignWithMargins ? margins.right / vector_koef : defaultMargin / vector_koef;
		var top = margins.header / AscCommonExcel.vector_koef;
		var bottom = margins.footer / AscCommonExcel.vector_koef;

		//TODO пересмотреть минимальный отступ
		var rowTop = this._getRowTop(0) - this.groupHeight;
		if(top < rowTop) {
			top = rowTop;
		}
		var footerStartPos = height - bottom;

		var drawPortion = function(index) {
			var portion = headerFooterParser.portions[index];
			if(!portion) {
				return;
			}

			//добавляю флаги для учета переноса строки
			var cellFlags = new AscCommonExcel.CellFlags();
			cellFlags.wrapText = true;
			cellFlags.textAlign = window["AscCommonExcel"].CHeaderFooterEditorSection.prototype.getAlign.call(null, index);
			var fragments = getFragments(portion);
			t.stringRender.setString(fragments, cellFlags);

			var maxWidth = width - left - right;
			var textMetrics = t.stringRender._measureChars(maxWidth);
			var x, y;
			switch(index) {
				case window["AscCommonExcel"].c_oPortionPosition.left: {
					x = left;
					y = !bFooter ? top : footerStartPos - textMetrics.height;
					break;
				}
				case window["AscCommonExcel"].c_oPortionPosition.center: {
					x = ((width - left - right) / 2 + left) - textMetrics.width / 2;
					y = !bFooter ? top : footerStartPos - textMetrics.height;
					break;
				}
				case window["AscCommonExcel"].c_oPortionPosition.right: {
					x = width - right - textMetrics.width;
					y = !bFooter ? top : footerStartPos - textMetrics.height;
					break;
				}
			}

			t.stringRender.fontNeedUpdate = true;
			t.stringRender.render(drawingCtx, x, y, textMetrics.width, t.settings.activeCellBorderColor);
		};

		//добавил аналогично другим отрисовка.
		//без этого отсутвует drawingCtx.DocumentRenderer.m_arrayPages[0].FontPicker.LastPickFont
		/*var transformMatrix;
		if (printScale !== 1 && drawingCtx.Transform) {
			transformMatrix = drawingCtx.Transform.CreateDublicate();

			drawingCtx.setTransform(printScale, drawingCtx.Transform.shy, drawingCtx.Transform.shx, printScale, 0, 0);
		}*/

		this._setDefaultFont(drawingCtx);
		for(var i = 0; i < headerFooterParser.portions.length; i++) {
			drawPortion(i);
		}

		/*if (transformMatrix) {
			drawingCtx.setTransform(transformMatrix.sx, transformMatrix.shy, transformMatrix.shx,
				transformMatrix.sy, transformMatrix.tx, transformMatrix.ty);
		}*/
	};

    WorksheetView.prototype._cleanColumnHeaders = function (colStart, colEnd) {
        var offsetX = this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
        var l, w, i, cFrozen = 0;
        if (this.topLeftFrozenCell) {
            cFrozen = this.topLeftFrozenCell.getCol0();
            offsetX -= this._getColLeft(cFrozen) - this._getColLeft(0);
        }

        if (colEnd === undefined) {
            colEnd = colStart;
        }
        var colStartTmp = Math.max(this.visibleRange.c1, colStart);
        var colEndTmp = Math.min(this.visibleRange.c2, colEnd);
		l = this._getColLeft(colStartTmp) - offsetX;
        for (i = colStartTmp; i <= colEndTmp; ++i) {
        	w = this._getColumnWidth(i);
        	if (0 !== w) {
				this.drawingCtx.clearRectByX(l, this.headersTop, w, this.headersHeight);
				l += w;
			}
        }
        if (0 !== cFrozen) {
            offsetX = this._getColLeft(0) - this.cellsLeft;
            // Почистим для pane
            colStart = Math.max(0, colStart);
            colEnd = Math.min(cFrozen, colEnd);
			l = this._getColLeft(colStart) - offsetX;
            for (i = colStart; i <= colEnd; ++i) {
				w = this._getColumnWidth(i);
				if (0 !== w) {
					this.drawingCtx.clearRectByX(l, this.headersTop, w, this.headersHeight);
					l += w;
				}
            }
        }
    };

    WorksheetView.prototype._cleanRowHeaders = function (rowStart, rowEnd) {
        var offsetY = this._getRowTop(this.visibleRange.r1) - this.cellsTop;
        var t, h, i, rFrozen = 0;
        if (this.topLeftFrozenCell) {
            rFrozen = this.topLeftFrozenCell.getRow0();
            offsetY -= this._getRowTop(rFrozen) - this._getRowTop(0);
        }

        if (rowEnd === undefined) {
            rowEnd = rowStart;
        }
        var rowStartTmp = Math.max(this.visibleRange.r1, rowStart);
        var rowEndTmp = Math.min(this.visibleRange.r2, rowEnd);
		t = this._getRowTop(rowStartTmp) - offsetY;
        for (i = rowStartTmp; i <= rowEndTmp; ++i) {
			h = this._getRowHeight(i);
            if (0 !== h) {
				this.drawingCtx.clearRectByY(this.headersLeft, t, this.headersWidth, h);
				t += h;
            }
        }
        if (0 !== rFrozen) {
            offsetY = this._getRowTop(0) - this.cellsTop;
            // Почистим для pane
            rowStart = Math.max(0, rowStart);
            rowEnd = Math.min(rFrozen, rowEnd);
			t = this._getRowTop(rowStart) - offsetY;
            for (i = rowStart; i <= rowEnd; ++i) {
				h = this._getRowHeight(i);
                if (0 !== h) {
					this.drawingCtx.clearRectByY(this.headersLeft, t, this.headersWidth, h);
					t += h;
                }
            }
        }
    };

    WorksheetView.prototype._cleanColumnHeadersRect = function () {
        this.drawingCtx.clearRect(this.cellsLeft, this.headersTop, this.drawingCtx.getWidth() - this.cellsLeft,
          this.headersHeight);
    };

	/** Рисует сетку таблицы */
	WorksheetView.prototype._drawGrid = function (drawingCtx, range, leftFieldInPx, topFieldInPx, width, height, printScale) {
		//отрисовку для режима предварительного просмотра страниц
		//добавлено сюда потому что отрисовка проиходит одновеременно с отрисовкой сетки
		//и отрисовка происходит в два этапа - сначала текст - до линий сетки, потом линии печати - после линий сетки
		//поэтому рассчет делаю 1 раз
		var visiblePrintPages = pageBreakPreviewMode ? this._getVisiblePrintPages(range).printPages : null;

		// Возможно сетку не нужно рисовать (при печати свои проверки)
		if (!drawingCtx && false === this.model.getSheetView().asc_getShowGridLines()) {
			return;
		}

		if (range === undefined) {
			range = this.visibleRange;
		}
		if(!printScale) {
			printScale = this.getPrintScale();
		}
		var ctx = drawingCtx || this.drawingCtx;
		var widthCtx = (width) ? width / printScale : ctx.getWidth() / printScale;
		var heightCtx = (height) ? height / printScale : ctx.getHeight() / printScale;
		var offsetX = (undefined !== leftFieldInPx) ? leftFieldInPx : this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
		var offsetY = (undefined !== topFieldInPx) ? topFieldInPx : this._getRowTop(this.visibleRange.r1) - this.cellsTop;
		if (!drawingCtx && this.topLeftFrozenCell) {
			if (undefined === leftFieldInPx) {
				var cFrozen = this.topLeftFrozenCell.getCol0();
				offsetX -= this._getColLeft(cFrozen) - this._getColLeft(0);
			}
			if (undefined === topFieldInPx) {
				var rFrozen = this.topLeftFrozenCell.getRow0();
				offsetY -= this._getRowTop(rFrozen) - this._getRowTop(0);
			}
		}
		var x1 = this._getColLeft(range.c1) - offsetX;
		var y1 = this._getRowTop(range.r1) - offsetY;
		var x2 = Math.min(this._getColLeft(range.c2 + 1) - offsetX, widthCtx);
		var y2 = Math.min(this._getRowTop(range.r2 + 1) - offsetY, heightCtx);
		ctx.setFillStyle(this.settings.cells.defaultState.background)
			.fillRect(x1, y1, x2 - x1, y2 - y1);

		//рисуем текст для преварительного просмотра
		this._drawPageBreakPreviewText(drawingCtx, range, leftFieldInPx, topFieldInPx, width, height, visiblePrintPages);

		ctx.setStrokeStyle(this.settings.cells.defaultState.border)
			.setLineWidth(1).beginPath();

		var i, d, l;
		for (i = range.c1, d = x1; i <= range.c2 && d <= x2; ++i) {
			l = this._getColumnWidth(i);
			d += l;
			if (0 < l) {
				ctx.lineVerPrevPx(d, y1, y2);
			}
		}
		for (i = range.r1, d = y1; i <= range.r2 && d <= y2; ++i) {
			l = this._getRowHeight(i);
			d += l;
			if (0 < l) {
				ctx.lineHorPrevPx(x1, d, x2);
			}
		}

		ctx.stroke();

		// Clear grid for pivot tables with classic and outline layout
		var clearRange, pivotRange, clearRanges = this.model.getPivotTablesClearRanges(range);
		ctx.setFillStyle(this.settings.cells.defaultState.background);
		for (i = 0; i < clearRanges.length; i += 2) {
			clearRange = clearRanges[i];
			pivotRange = clearRanges[i + 1];
			x1 = this._getColLeft(clearRange.c1) - offsetX + (clearRange.c1 === pivotRange.c1 ? 1 : 0);
			y1 = this._getRowTop(clearRange.r1) - offsetY + (clearRange.r1 === pivotRange.r1 ? 1 : 0);
			x2 = Math.min(this._getColLeft(clearRange.c2 + 1) - offsetX - (clearRange.c2 === pivotRange.c2 ? 1 : 0), widthCtx);
			y2 = Math.min(this._getRowTop(clearRange.r2 + 1) - offsetY - (clearRange.r2 === pivotRange.r2 ? 1 : 0), heightCtx);

			ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        }

		//рисуем текст для преварительного просмотра
		this._drawPageBreakPreviewLines(drawingCtx, range, leftFieldInPx, topFieldInPx, width, height, visiblePrintPages);

		//отрисовка по аналогии с layout
		//this._drawPageBreakPreviewLines3(drawingCtx, range);

		//отрисовка линий предварительного просмотра страниц без использования calcPagesPrint
		//this._drawPageBreakPreviewLines2(drawingCtx, range, leftFieldInPx, topFieldInPx, width, height);
	};

    WorksheetView.prototype._drawCellsAndBorders = function (drawingCtx, range, offsetXForDraw, offsetYForDraw) {
		if (range === undefined) {
			range = this.visibleRange;
		}

		var left, top, cFrozen, rFrozen;
		var offsetX = (undefined === offsetXForDraw) ? this._getColLeft(this.visibleRange.c1) - this.cellsLeft : offsetXForDraw;
		var offsetY = (undefined === offsetYForDraw) ? this._getRowTop(this.visibleRange.r1) - this.cellsTop : offsetYForDraw;
		if (!drawingCtx && this.topLeftFrozenCell) {
			if (undefined === offsetXForDraw) {
				cFrozen = this.topLeftFrozenCell.getCol0();
				offsetX -= this._getColLeft(cFrozen) - this.cellsLeft;
			}
			if (undefined === offsetYForDraw) {
				rFrozen = this.topLeftFrozenCell.getRow0();
				offsetY -= this._getRowTop(rFrozen) - this.cellsTop;
			}
		}

		if (!drawingCtx && !window['IS_NATIVE_EDITOR']) {
			left = this._getColLeft(range.c1);
			top = this._getRowTop(range.r1);
			// set clipping rect to cells area
			this.drawingCtx.save()
				.beginPath()
				.rect(left - offsetX, top - offsetY, Math.min(this._getColLeft(range.c2 + 1) - left, this.drawingCtx.getWidth() - this.cellsLeft), Math.min(this._getRowTop(range.r2 + 1) - top, this.drawingCtx.getHeight() - this.cellsTop))
				.clip();
		}

		this._prepareCellTextMetricsCache(range);

		var mergedCells = {}, mc;
		for (var row = range.r1; row <= range.r2; ++row) {
			this._drawRowBG(drawingCtx, row, range.c1, range.c2, offsetX, offsetY, mergedCells);
		}
		// draw merged cells at last stage to fix cells background issue
		for (var i in mergedCells) {
			mc = mergedCells[i];
			this._drawRowBG(drawingCtx, mc.r1, mc.c1, mc.c1, offsetX, offsetY, null, mc);
		}
		this._drawSparklines(drawingCtx, range, offsetX, offsetY);
		this._drawCellsBorders(drawingCtx, range, offsetX, offsetY, mergedCells);

		if (!drawingCtx && !window['IS_NATIVE_EDITOR']) {
			// restore canvas' original clipping range
			this.drawingCtx.restore();
		}
	};

    /** Рисует спарклайны */
    WorksheetView.prototype._drawSparklines = function(drawingCtx, range, offsetX, offsetY) {
		this.objectRender.drawSparkLineGroups(drawingCtx || this.drawingCtx, this.model.aSparklineGroups, range,
			offsetX * asc_getcvt(0, 3, this._getPPIX()), offsetY * asc_getcvt(0, 3, this._getPPIX()));
    };

    /** Рисует фон ячеек в строке */
    WorksheetView.prototype._drawRowBG = function (drawingCtx, row, colStart, colEnd, offsetX, offsetY, mergedCells, mc) {
		var height = this._getRowHeight(row);
		if (0 === height && mergedCells) {
			return;
		}

		var drawCells = {}, i;
		var aRules = this.model.aConditionalFormattingRules.sort(function (v1, v2) {
			return v2.priority - v1.priority;
		});

		var top = this._getRowTop(row);
		var ctx = drawingCtx || this.drawingCtx;
		var graphics = drawingCtx ? ctx.DocumentRenderer : this.handlers.trigger('getMainGraphics');
		for (var col = colStart; col <= colEnd; ++col) {
			var width = this._getColumnWidth(col);
			if (0 === width && mergedCells) {
				continue;
			}

			// ToDo подумать, может стоит не брать ячейку из модели (а брать из кеш-а)
			var c = this._getVisibleCell(col, row);
			var findFillColor = this.handlers.trigger('selectSearchingResults') && this.model.inFindResults(row, col) ? this.settings.findFillColor : null;
			var fill = c.getFill();
			var mwidth = 0, mheight = 0;

			if (mergedCells) {
				mc = this.model.getMergedByCell(row, col);
				if (mc) {
					mergedCells[AscCommonExcel.getCellIndex(mc.r1, mc.c1)] = mc;
					col = mc.c2;
					continue;
				}
			}

			if (mc) {
				if (col !== mc.c1 || row !== mc.r1) {
					continue;
				}

				mwidth = this._getColLeft(mc.c2 + 1) - this._getColLeft(mc.c1 + 1);
				mheight = this._getRowTop(mc.r2 + 1) - this._getRowTop(mc.r1 + 1);
			}

			if (findFillColor || fill.hasFill() || mc) {
				// ToDo не отрисовываем заливку границ от ячеек c заливкой, которые находятся правее и ниже
				//  отрисовываемого диапазона. Но по факту проблем быть не должно.
				var fillGrid = findFillColor || fill.hasFill();

				var x = this._getColLeft(col) - (fillGrid ? 1 : 0);
				var y = top - (fillGrid ? 1 : 0);
				var w = width + (fillGrid ? +1 : -1) + mwidth;
				var h = height + (fillGrid ? +1 : -1) + mheight;

				findFillColor = findFillColor || fill.getSolidFill() || (mc && this.settings.cells.defaultState.background);
				if (findFillColor) {
					ctx.setFillStyle(findFillColor).fillRect(x - offsetX, y - offsetY, w, h);
				} else {
					var rect = new AscCommon.asc_CRect(x - offsetX, y - offsetY, w, h);
					var dScale = asc_getcvt(0, 3, this._getPPIX());
					rect._x *= dScale;
					rect._y *= dScale;
					rect._width *= dScale;
					rect._height *= dScale;
					AscFormat.ExecuteNoHistory(
						function (fill, rect) {
							var geometry = new AscFormat.CreateGeometry("rect");
                            geometry.Recalculate(rect._width, rect._height, true);

							var oUniFill = new AscFormat.CUniFill();
							if (fill.patternFill) {
								oUniFill.fill = new AscFormat.CPattFill();
								oUniFill.fill.ftype = fill.patternFill.getHatchOffset();
								oUniFill.fill.fgClr = AscFormat.CreateUniColorRGB2(fill.patternFill.fgColor || AscCommonExcel.createRgbColor(0, 0, 0));
								oUniFill.fill.bgClr = AscFormat.CreateUniColorRGB2(fill.patternFill.bgColor || AscCommonExcel.createRgbColor(255, 255, 255));
							} else if (fill.gradientFill) {
                                oUniFill.fill = new AscFormat.CGradFill();
                                if(fill.gradientFill.type === Asc.c_oAscFillGradType.GRAD_LINEAR) {
                                    oUniFill.fill.lin = new AscFormat.GradLin();
                                    oUniFill.fill.lin.angle = fill.gradientFill.degree*60000;
                                }
                                else {
                                    oUniFill.fill.path = new AscFormat.GradPath();
                                }
								for(var i = 0; i < fill.gradientFill.stop.length; ++i) {
                                    var oGradStop = new AscFormat.CGs();
                                    oGradStop.pos = fill.gradientFill.stop[i].position*100000;
                                    oGradStop.color = AscFormat.CreateUniColorRGB2(fill.gradientFill.stop[i].color || AscCommonExcel.createRgbColor(255, 255, 255));
                                    oUniFill.fill.addColor(oGradStop);
                                }
							} else {
								return;
							}
                            if(ctx instanceof AscCommonExcel.CPdfPrinter)
                            {
                                graphics.SaveGrState();
                                var _baseTransform;
                                if(!ctx.Transform)
                                {
                                    _baseTransform = new AscCommon.CMatrix();
                                }
                                else
                                {
                                    _baseTransform = ctx.Transform;
                                }
                                graphics.SetBaseTransform(_baseTransform);
                            }

							graphics.save();
                            var oMatrix = new AscCommon.CMatrix();
                            oMatrix.tx = rect._x;
                            oMatrix.ty = rect._y;
							graphics.transform3(oMatrix);
							var shapeDrawer = new AscCommon.CShapeDrawer();
							shapeDrawer.Graphics = graphics;

							shapeDrawer.fromShape2(new AscFormat.CColorObj(null, oUniFill, geometry), graphics, geometry);
							shapeDrawer.draw(geometry);
							graphics.restore();

                            if(ctx instanceof AscCommonExcel.CPdfPrinter)
                            {
                                graphics.SetBaseTransform(null);
                                graphics.RestoreGrState();
                            }
						}, this, [fill, rect]
					);
				}
			}

			var showValue = this._drawCellCF(ctx, aRules, c, row, col, top, width + mwidth, height + mheight, offsetX, offsetY);
			if (showValue) {
				drawCells[col] = 1;
			}
        }
		// Check overlap start
		i = this._findOverlapCell(colStart, row);
		if (-1 !== i) {
			drawCells[i] = 1;
		}
		// Check overlap end
		if (colStart !== colEnd) {
			i = this._findOverlapCell(colEnd, row);
			if (-1 !== i) {
				drawCells[i] = 1;
			}
		}
		// draw text
		for (i in drawCells) {
			this._drawCellText(drawingCtx, i >> 0, row, colStart, colEnd, offsetX, offsetY);
		}
    };

    WorksheetView.prototype._drawCellCF = function (ctx, aRules, c, row, col, top, width, height, offsetX, offsetY) {
    	var showValue = true;
		var ct = this._getCellTextCache(col, row);
		if (!ct || !ct.flags.isNumberFormat || 0 === aRules.length) {
			return showValue;
		}

        var graphics = ctx && ctx.DocumentRenderer ? ctx.DocumentRenderer : this.handlers.trigger('getMainGraphics');

		var fontSize = c.getFont().fs;
		var cellValue = c.getNumberValue();
		width -= 2; // indent

    	var oRule, oRuleElement, ranges, multiplyRange, values, min, max;
		for (var i = 0; i < aRules.length; ++i) {
			oRule = aRules[i];
			ranges = oRule.ranges;
			multiplyRange = new AscCommonExcel.MultiplyRange(ranges);
			if (multiplyRange.contains(col, row)) {
				if (AscCommonExcel.ECfType.dataBar === oRule.type || AscCommonExcel.ECfType.iconSet === oRule.type) {
					if (1 !== oRule.aRuleElements.length) {
						continue;
					}
					oRuleElement = oRule.aRuleElements[0];
					if (!oRuleElement || oRule.type !== oRuleElement.type) {
						continue;
					}
					showValue = oRuleElement.ShowValue;
					values = this.model._getValuesForConditionalFormatting(ranges, true);

					var x = this._getColLeft(col);

					if (AscCommonExcel.ECfType.dataBar === oRule.type) {
						min = oRule.getMin(values, this.model);
						max = oRule.getMax(values, this.model);
						if (cellValue < min) {
							cellValue = min;
						} else if (cellValue > max) {
							cellValue = max;
						}

						var minLength = Math.floor(width * oRuleElement.MinLength / 100);
						var maxLength = Math.floor(width * oRuleElement.MaxLength / 100);
						var dataBarLength = minLength + (cellValue - min) / (max - min) * (maxLength - minLength);

						if (oRuleElement.Color) {
							ctx.setFillStyle(oRuleElement.Color).fillRect(x + 1 - offsetX, top + 1 - offsetY, dataBarLength, height - 3);
						}
					} else if (AscCommonExcel.ECfType.iconSet === oRule.type) {
						var img = AscCommonExcel.getCFIcon(oRuleElement, oRule.getIndexRule(values, this.model, cellValue));
						if (!img) {
							continue;
						}
						var iconSize = AscCommon.AscBrowser.convertToRetinaValue(AscCommonExcel.cDefIconSize * fontSize / AscCommonExcel.cDefIconFont, true);
						var rect = new AscCommon.asc_CRect(x - offsetX, top + 1 - offsetY, width, height);
						var bl = rect._y + rect._height - gridlineSize - Asc.round(this._getRowDescender(row) * this.getZoom());
						rect._y = this._calcTextVertPos(rect._y, rect._height, bl, new Asc.TextMetrics(iconSize, iconSize, 0, iconSize - 2 * fontSize / AscCommonExcel.cDefIconFont, 0, 0, 0), ct.cellVA);
						var dScale = asc_getcvt(0, 3, this._getPPIX());
						rect._x *= dScale;
						rect._y *= dScale;
						rect._width *= dScale;
						rect._height *= dScale;
                        AscFormat.ExecuteNoHistory(
                            function (img, rect, imgSize) {
                                var geometry = new AscFormat.CreateGeometry("rect");
                                geometry.Recalculate(imgSize, imgSize, true);

                                var oUniFill = new AscFormat.builder_CreateBlipFill(img, "stretch");

                                if(ctx instanceof AscCommonExcel.CPdfPrinter)
                                {
                                    graphics.SaveGrState();
                                    var _baseTransform;
                                    if(!ctx.Transform)
                                    {
                                        _baseTransform = new AscCommon.CMatrix();
                                    }
                                    else
                                    {
                                        _baseTransform = ctx.Transform;
                                    }
                                    graphics.SetBaseTransform(_baseTransform);
                                }
    

                                graphics.save();
                                var oMatrix = new AscCommon.CMatrix();
                                oMatrix.tx = rect._x;
                                oMatrix.ty = rect._y;
                                graphics.transform3(oMatrix);
                                var shapeDrawer = new AscCommon.CShapeDrawer();
                                shapeDrawer.Graphics = graphics;

                                shapeDrawer.fromShape2(new AscFormat.CColorObj(null, oUniFill, geometry), graphics, geometry);
                                shapeDrawer.draw(geometry);
                                graphics.restore();

                                if(ctx instanceof AscCommonExcel.CPdfPrinter)
                                {
                                    graphics.SetBaseTransform(null);
                                    graphics.RestoreGrState();
                                }
                            }, this, [img, rect, iconSize * dScale * this.getZoom()]
                        );
					}
				}
			}
		}
		return showValue;
	};

	/** Рисует текст ячейки */
	WorksheetView.prototype._drawCellText = function (drawingCtx, col, row, colStart, colEnd, offsetX, offsetY) {
			var ct = this._getCellTextCache(col, row);
	        if (!ct) {
				return null;
            }
			var c = this._getVisibleCell(col, row);
			var color = c.getFont().getColor();
			var isMerged = ct.flags.isMerged(), range, isWrapped = ct.flags.wrapText;
			var ctx = drawingCtx || this.drawingCtx;

			if (isMerged) {
				range = ct.flags.merged;
				if (col !== range.c1 || row !== range.r1) {
					return null;
				}
			}

			var colL = isMerged ? range.c1 : Math.max(colStart, col - ct.sideL);
			var colR = isMerged ? Math.min(range.c2, this.nColsCount - 1) : Math.min(colEnd, col + ct.sideR);
			var rowT = isMerged ? range.r1 : row;
			var rowB = isMerged ? Math.min(range.r2, this.nRowsCount - 1) : row;
			var isTrimmedR = !isMerged && colR !== col + ct.sideR;

			if (!(ct.angle || 0)) {
				if (!isMerged && !isWrapped) {
					this._eraseCellRightBorder(drawingCtx, colL, colR + (isTrimmedR ? 1 : 0), row, offsetX, offsetY);
				}
			}

			var x1 = this._getColLeft(colL) - offsetX;
			var y1 = this._getRowTop(rowT) - offsetY;
			var w = this._getColLeft(colR + 1) - offsetX - x1;
			var h = this._getRowTop(rowB + 1) - offsetY - y1;
			var x2 = x1 + w - (isTrimmedR ? 0 : gridlineSize);
			var y2 = y1 + h - gridlineSize;
			var bl = y2 - Asc.round((isMerged ? (ct.metrics.height - ct.metrics.baseline - 1) : this._getRowDescender(rowB)) * this.getZoom());
			var x1ct = isMerged ? x1 : this._getColLeft(col) - offsetX;
			var x2ct = isMerged ? x2 : x1ct + this._getColumnWidth(col) - gridlineSize;
			var textX = this._calcTextHorizPos(x1ct, x2ct, ct.metrics, ct.cellHA);
			var textY = this._calcTextVertPos(y1, h, bl, ct.metrics, ct.cellVA);
			var textW = this._calcTextWidth(x1ct, x2ct, ct.metrics, ct.cellHA);

			var xb1, yb1, wb, hb, colLeft, colRight;
			var txtRotX, txtRotW, clipUse = false;

			if (ct.angle) {

				xb1 = this._getColLeft(col) - offsetX;
				yb1 = this._getRowTop(row) - offsetY;
				wb = this._getColumnWidth(col);
				hb = this._getRowHeight(row);

				txtRotX = xb1 - ct.textBound.offsetX;
				txtRotW = ct.textBound.width + xb1 - ct.textBound.offsetX;

				if (isMerged) {
					wb = this._getColLeft(colR + 1) - this._getColLeft(colL);
					hb = this._getRowTop(rowB + 1) - this._getRowTop(rowT);
					ctx.AddClipRect(xb1, yb1, wb, hb);
					clipUse = true;
				}

				this.stringRender.angle = ct.angle;
				this.stringRender.fontNeedUpdate = true;

				if (90 === ct.angle || -90 === ct.angle) {
					// клип по ячейке
					if (!isMerged) {
						ctx.AddClipRect(xb1, yb1, wb, hb);
						clipUse = true;
					}
				} else {
					// клип по строке
					if (!isMerged) {
						ctx.AddClipRect(0, y1, this.drawingCtx.getWidth(), h);
						clipUse = true;
					}

					if (!isMerged && !isWrapped) {
						colLeft = col;
						if (0 !== txtRotX) {
							while (true) {
								if (0 == colLeft) {
									break;
								}
								if (txtRotX >= this._getColLeft(colLeft)) {
									break;
								}
								--colLeft;
							}
						}

						colRight = Math.min(col, this.nColsCount - 1);
						if (0 !== txtRotW) {
							while (true) {
								++colRight;
								if (colRight >= this.nColsCount) {
									--colRight;
									break;
								}
								if (txtRotW <= this._getColLeft(colRight)) {
									--colRight;
									break;
								}
							}
						}

						colLeft = isMerged ? range.c1 : colLeft;
						colRight = isMerged ? Math.min(range.c2, this.nColsCount - 1) : colRight;

						this._eraseCellRightBorder(drawingCtx, colLeft, colRight + (isTrimmedR ? 1 : 0), row, offsetX,
							offsetY);
					}
				}

				this.stringRender.rotateAtPoint(drawingCtx, ct.angle, xb1, yb1, ct.textBound.dx, ct.textBound.dy);
				this.stringRender.restoreInternalState(ct.state);

				if (isWrapped) {
					if (ct.angle < 0) {
						if (Asc.c_oAscVAlign.Top === ct.cellVA) {
							this.stringRender.flags.textAlign = AscCommon.align_Left;
						} else if (Asc.c_oAscVAlign.Center === ct.cellVA || Asc.c_oAscVAlign.Dist === ct.cellVA || Asc.c_oAscVAlign.Just === ct.cellVA) {
							this.stringRender.flags.textAlign = AscCommon.align_Center;
						} else if (Asc.c_oAscVAlign.Bottom === ct.cellVA) {
							this.stringRender.flags.textAlign = AscCommon.align_Right;
						}
					} else {
						if (Asc.c_oAscVAlign.Top === ct.cellVA) {
							this.stringRender.flags.textAlign = AscCommon.align_Right;
						} else if (Asc.c_oAscVAlign.Center === ct.cellVA || Asc.c_oAscVAlign.Dist === ct.cellVA || Asc.c_oAscVAlign.Just === ct.cellVA) {
							this.stringRender.flags.textAlign = AscCommon.align_Center;
						} else if (Asc.c_oAscVAlign.Bottom === ct.cellVA) {
							this.stringRender.flags.textAlign = AscCommon.align_Left;
						}
					}
				}

				this.stringRender.render(drawingCtx, 0, 0, textW, color);
				this.stringRender.resetTransform(drawingCtx);

				if (clipUse) {
					ctx.RemoveClipRect();
				}
			} else {
				ctx.AddClipRect(x1, y1, w, h);
				this.stringRender.restoreInternalState(ct.state).render(drawingCtx, textX, textY, textW, color);
				ctx.RemoveClipRect();
			}

			return null;
		};

	WorksheetView.prototype._drawPageBreakPreviewLines = function (drawingCtx, range, leftFieldInPx, topFieldInPx, width, height, printPages) {
		if(!pageBreakPreviewMode) {
			return;
		}

		if (range === undefined) {
			range = this.visibleRange;
		}
		var ctx = drawingCtx || this.drawingCtx;

		var offsetX = (undefined !== leftFieldInPx) ? leftFieldInPx : this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
		var offsetY = (undefined !== topFieldInPx) ? topFieldInPx : this._getRowTop(this.visibleRange.r1) - this.cellsTop;

		var frozenX = 0, frozenY = 0, cFrozen, rFrozen;
		if (!drawingCtx && this.topLeftFrozenCell) {
			if (undefined === leftFieldInPx) {
				cFrozen = this.topLeftFrozenCell.getCol0();
				offsetX -= frozenX = this._getColLeft(cFrozen) - this._getColLeft(0);
			}
			if (undefined === topFieldInPx) {
				rFrozen = this.topLeftFrozenCell.getRow0();
				offsetY -= frozenY =  this._getRowTop(rFrozen) - this._getRowTop(0);
			}
		}

		var i, d, d1;
		var x1, x2, y1, y2;
		var pageBreakPreview = true;
		if(pageBreakPreview) {
			var startRange = printPages[0] ? printPages[0].page.pageRange : null;
			var endRange = printPages[0] ? printPages[printPages.length - 1].page.pageRange : null;
			var unionRange = startRange ? new Asc.Range(startRange.c1, startRange.r1, endRange.c2, endRange.r2) : null;

			//вначале закрашииваем непечатную область
			var fillRanges = [];
			var intersection = unionRange ? range.intersection(unionRange) : null;
			ctx.setFillStyle(this.settings.cells.defaultState.border);
			if(intersection) {
				//закрашиываем всю область обноавления за исключением области пересечения
				fillRanges = intersection.difference(range);
			} else {
				fillRanges.push(range);
			}

			if(fillRanges) {
				ctx.setFillStyle(this.settings.cells.defaultState.border);
				for(i = 0; i < fillRanges.length; i++) {
					x1 = Math.max(this._getColLeft(fillRanges[i].c1), this._getColLeft(range.c1));
					y1 = Math.max(this._getRowTop(fillRanges[i].r1), this._getRowTop(range.r1));
					x2 = Math.min(this._getColLeft(fillRanges[i].c2 + 1) - this.cellsLeft, this._getColLeft(range.c2 + 1) - this.cellsLeft);
					y2 = Math.min(this._getRowTop(fillRanges[i].r2 + 1) - this.cellsTop, this._getRowTop(range.r2 + 1) - this.cellsTop);

					ctx.fillRect(x1 - offsetX, y1 - offsetY, x2 - offsetX, y2 - offsetY);
				}
			}


			if(printPages[0] && intersection) {
				x1 = this._getColLeft(intersection.c1) - offsetX;
				y1 = this._getRowTop(intersection.r1) - offsetY;
				x2 = this._getColLeft(intersection.c2 + 1) - offsetX;
				y2 = this._getRowTop(intersection.r2 + 1) - offsetY;

				//рисуем линии, ограничивающие страницы
				ctx.setStrokeStyle(this.settings.activeCellBorderColor);
				ctx.setLineWidth(3).beginPath();

				var pageRange;
				var pageIntersection;
				for (i = 0, d = 0, d1 = 0; i < printPages.length; ++i) {
					pageRange = printPages[i].page.pageRange;
					pageIntersection = pageRange.intersection(range);
					if(!pageIntersection) {
						if(pageRange.r1 > range.r2 && pageRange.c1 > range.c2) {
							break;
						} else {
							continue;
						}
					}

					d = this._getColLeft(pageRange.c2 + 1) - offsetX;
					d1 = this._getRowTop(pageRange.r2 + 1) - offsetY;
					if(d > x1 && d1 > 0) {
						ctx.lineVerPrevPx(d, y1 - frozenY, y2);
					}
					if(d1 > y1 && d > 0) {
						ctx.lineHorPrevPx(x1 - frozenX, d1, x2);
					}
				}

				ctx.stroke();
			}
		}
	};

	WorksheetView.prototype._drawPageBreakPreviewLines2 = function (drawingCtx, range, leftFieldInPx, topFieldInPx, width, height) {

		if(!pageBreakPreviewMode) {
			return;
		}

		if (range === undefined) {
			range = this.visibleRange;
		}
		var ctx = drawingCtx || this.drawingCtx;

		var widthCtx = (width) ? width : ctx.getWidth();
		var heightCtx = (height) ? height : ctx.getHeight();
		var offsetX = (undefined !== leftFieldInPx) ? leftFieldInPx : this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
		var offsetY = (undefined !== topFieldInPx) ? topFieldInPx : this._getRowTop(this.visibleRange.r1) - this.cellsTop;

		var frozenX = 0, frozenY = 0, cFrozen, rFrozen;
		if (!drawingCtx && this.topLeftFrozenCell) {
			if (undefined === leftFieldInPx) {
				cFrozen = this.topLeftFrozenCell.getCol0();
				offsetX -= frozenX = this._getColLeft(cFrozen) - this._getColLeft(0);
			}
			if (undefined === topFieldInPx) {
				rFrozen = this.topLeftFrozenCell.getRow0();
				offsetY -= frozenY =  this._getRowTop(rFrozen) - this._getRowTop(0);
			}
		}

		var printOptions = this.model.PagePrintOptions;
		var orientation = printOptions.pageSetup.orientation;

		var leftMargin = printOptions.pageMargins.left;
		var rightMargin = printOptions.pageMargins.right;
		var topMargin = printOptions.pageMargins.top;
		var bottomMargin = printOptions.pageMargins.bottom;
		var widthFromSetup = printOptions.pageSetup.width;
		var heightFromSetup = printOptions.pageSetup.height;

		var pageBreakGrid = true;
		var i, d, d1;
		var x1, x2, y1, y2;
		if(pageBreakGrid) {
			x1 = this._getColLeft(range.c1) - offsetX;
			y1 = this._getRowTop(range.r1) - offsetY;
			x2 = Math.min(this._getColLeft(range.c2 + 1) - offsetX, widthCtx);
			y2 = Math.min(this._getRowTop(range.r2 + 1) - offsetY, heightCtx);

			if (Asc.c_oAscPageOrientation.PageLandscape === orientation) {
				var tmp = width;
				widthFromSetup = heightFromSetup;
				heightFromSetup = tmp;
			}

			var widthPage = (widthFromSetup - leftMargin - rightMargin) * asc_getcvt(3, 0, this._getPPIX());
			var heightPage = (heightFromSetup - topMargin - bottomMargin) * asc_getcvt(3, 0, this._getPPIY());

			var headings = printOptions.headings;
			if(headings) {
				widthPage -= this.cellsLeft;
				heightPage -= this.cellsTop;
			}

			ctx.setStrokeStyle(this.settings.findFillColor);
			ctx.setLineWidth(1).beginPath();

			var w;
			for(i = 0, d = 0, d1 = 0; i < this.nColsCount; i++) {
				if(d1 > x2 + offsetX) {
					break;
				}

				w = this._getColumnWidth(i);
				if(d + w > widthPage) {
					if(d1 > x1 + offsetX && d1 < x2 + offsetX) {
						var headingWidth = /*headings ? this.cellsLeft : 0;*/this.cellsLeft;
						ctx.lineVerPrevPx(d1 + headingWidth - offsetX, y1, y2);
					}
					d = 0;
				}
				d += w;
				d1 += w;
			}

			var h;
			for(i = 0, d = 0, d1 = 0; i < this.nRowsCount; i++) {
				if(d1 > y2 + offsetY) {
					break;
				}

				h = this._getRowHeight(i);
				if(d + h > heightPage) {
					if(d1 > y1 + offsetY && d1 < y2 + offsetY) {
						var headingHeight = /*headings ? this.cellsTop : 0;*/this.cellsTop;
						ctx.lineHorPrevPx(x1, d1 + headingHeight - offsetY, x2);
					}
					d = 0;
				}
				d += h;
				d1 += h;
			}

			ctx.stroke();
		}
	};

	//временная функция, если позже будет не нужна - удалить! оставить только 1 фукнкию для отрисовки разбивки на страницы
	WorksheetView.prototype._drawPageBreakPreviewLines3 = function (drawingCtx, range) {
		if(!pageBreakPreviewMode) {
			return;
		}

		if (range === undefined) {
			range = this.visibleRange;
		}

		var ctx = drawingCtx || this.drawingCtx;
		var t = this;
		var printPagesObj = this._getVisiblePrintPages();
		var printPages = printPagesObj.printPages;
		var printRanges = printPagesObj.printRanges;

		//закрашиваем то, что не входит в область печати
		var drawCurArea = function (visibleRange, offsetX, offsetY, args) {
			var range = args[0];
			var c = t.cols;
			var r = t.rows;
			var oIntersection = range.intersectionSimple(range);

			if (!oIntersection) {
				return true;
			}

			var x1 = c[oIntersection.c1].left - offsetX;
			var x2 = c[oIntersection.c2].left + c[oIntersection.c2].width - offsetX;
			var y1 = r[oIntersection.r1].top - offsetY;
			var y2 = r[oIntersection.r2].top + r[oIntersection.r2].height - offsetY;

			var fillColor = t.settings.cells.defaultState.border.Copy();
			ctx.setFillStyle(fillColor).fillRect(x1, y1, x2 - x1, y2 - y1);
		};

		var drawSelectionElement = function (visibleRange, offsetX, offsetY, args) {
			var range = args[0];
			var selectionLineType = args[1];
			var strokeColor = args[2];
			var c = t.cols;
			var r = t.rows;
			var oIntersection = range.intersectionSimple(range);

			if (!oIntersection) {
				return true;
			}

			var fHorLine, fVerLine;
			var canFill = AscCommonExcel.selectionLineType.Selection & selectionLineType;
			var isDashLine = AscCommonExcel.selectionLineType.Dash & selectionLineType;
			if (isDashLine) {
				fHorLine = ctx.dashLineCleverHor;
				fVerLine = ctx.dashLineCleverVer;
			} else {
				fHorLine = ctx.lineHorPrevPx;
				fVerLine = ctx.lineVerPrevPx;
			}

			var firstCol = oIntersection.c1 === range.c1;
			var firstRow = oIntersection.r1 === range.r1;

			var drawLeftSide = oIntersection.c1 === range.c1;
			var drawRightSide = oIntersection.c2 === range.c2;
			var drawTopSide = oIntersection.r1 === range.r1;
			var drawBottomSide = oIntersection.r2 === range.r2;

			var x1 = c[oIntersection.c1].left - offsetX;
			var x2 = c[oIntersection.c2].left + c[oIntersection.c2].width - offsetX;
			var y1 = r[oIntersection.r1].top - offsetY;
			var y2 = r[oIntersection.r2].top + r[oIntersection.r2].height - offsetY;

			ctx.setLineWidth(isDashLine ? 1 : 2).setStrokeStyle(strokeColor);

			ctx.beginPath();
			if (drawTopSide && !firstRow) {
				fHorLine.apply(ctx, [x1 - !isDashLine * 2, y1, x2 + !isDashLine * 1]);
			}
			if (drawBottomSide) {
				fHorLine.apply(ctx, [x1, y2 + !isDashLine * 1, x2]);
			}
			if (drawLeftSide && !firstCol) {
				fVerLine.apply(ctx, [x1, y1, y2 + !isDashLine * 1]);
			}
			if (drawRightSide) {
				fVerLine.apply(ctx, [x2 + !isDashLine * 1, y1, y2 + !isDashLine * 1]);
			}
			ctx.closePath().stroke();
		};

		//рисуем страницы
		if(printPages && printPages.length) {

			//закрашиваем общую область за исключением области печати
			if(printRanges && printRanges.length) {
				//необходимо закрасить всю визуальную область за исключением printRanges
				//TODO долгие операции! возможно стоит изначально в данном режиме рисовать только ту часть таблицы, которая пойдёт на печать

				var rangesBackground;
				for(var i = 0; i < printRanges.length; i++) {
					if(i === 0) {
						rangesBackground = printRanges[i].difference(range);
						continue;
					}

					var curRanges = [];
					for(var j = 0; j < rangesBackground.length; j++) {
						Array.prototype.push.apply(curRanges, printRanges[i].difference(rangesBackground[j]));
					}
					rangesBackground = curRanges;
				}

				if(rangesBackground) {
					for(var i = 0; i < rangesBackground.length; i++) {
						this._drawElements(drawCurArea, rangesBackground[i]);
					}
				}
			} else {
				var startRange = printPages[0].page.pageRange;
				var endRange = printPages[printPages.length - 1].page.pageRange;
				var allPagesRange = new Asc.Range(startRange.c1, startRange.r1, endRange.c2, endRange.r2);
				var difference = allPagesRange.difference(range);
				if(difference && difference.length) {
					for(var i = 0; i < difference.length; i++) {
						this._drawElements(drawCurArea, difference[i]);
					}
				}
			}

			//орисовываем границы страниц
			for (var i = 0, l = printPages.length; i < l; ++i) {
				this._drawElements(drawSelectionElement, printPages[i].page.pageRange, AscCommonExcel.selectionLineType.Dash, this.settings.activeCellBorderColor);
			}

			//рисуем границы либо общей области, либо если определен printArea - рисуем границы каждой области(может быть мультиселект)
			if(printRanges && printRanges.length) {
				for(var i = 0, l = printRanges.length; i < l; ++i) {
					this._drawElements(drawSelectionElement, printRanges[i], AscCommonExcel.selectionLineType.Select, this.settings.activeCellBorderColor);
				}
			} else {
				this._drawElements(drawSelectionElement, allPagesRange, AscCommonExcel.selectionLineType.Select, this.settings.activeCellBorderColor);
			}
		} else {
			this._drawElements(drawCurArea, range);
		}
	};

	WorksheetView.prototype._drawPageBreakPreviewLinesOverlay = function () {
		//функция для отрисовки на layout разметки страницы(специальный режим предварительного просмотра страниц)
		//для того, чтобы отрисовка происходила при смене различных опций - добавить вызовы обновления селекта аналогично функции _drawPrintArea
		//текст всегда рисуем на основной канве, поскольку сетка в ms рисуется поверх

		if(!pageBreakPreviewModeOverlay) {
			return;
		}

		var t = this;
		var printPagesObj = this._getVisiblePrintPages();
		var printPages = printPagesObj.printPages;
		var printRanges = printPagesObj.printRanges;

		//закрашиваем то, что не входит в область печати
		var drawCurArea = function (visibleRange, offsetX, offsetY, args) {
			var range = args[0];
			var ctx = t.overlayCtx;
			var c = t.cols;
			var r = t.rows;
			var oIntersection = range.intersectionSimple(visibleRange);

			if (!oIntersection) {
				return true;
			}

			var x1 = c[oIntersection.c1].left - offsetX;
			var x2 = c[oIntersection.c2].left + c[oIntersection.c2].width - offsetX;
			var y1 = r[oIntersection.r1].top - offsetY;
			var y2 = r[oIntersection.r2].top + r[oIntersection.r2].height - offsetY;

			var fillColor = t.settings.cells.defaultState.border.Copy();
			ctx.setFillStyle(fillColor).fillRect(x1, y1, x2 - x1, y2 - y1);
		};

		//рисуем страницы
		if(printPages && printPages.length) {

			//закрашиваем общую область за исключением области печати
			if(printRanges && printRanges.length) {
				//необходимо закрасить всю визуальную область за исключением printRanges
				//TODO долгие операции! возможно стоит изначально в данном режиме рисовать только ту часть таблицы, которая пойдёт на печать
				
				var rangesBackground;
				for(var i = 0; i < printRanges.length; i++) {
					if(i === 0) {
						rangesBackground = printRanges[i].difference(this.visibleRange);
						continue;
					}

					var curRanges = [];
					for(var j = 0; j < rangesBackground.length; j++) {
						Array.prototype.push.apply(curRanges, printRanges[i].difference(rangesBackground[j]));
					}
					rangesBackground = curRanges;
				}

				if(rangesBackground) {
					for(var i = 0; i < rangesBackground.length; i++) {
						this._drawElements(drawCurArea, rangesBackground[i]);
					}
				}
			} else {
				var startRange = printPages[0].page.pageRange;
				var endRange = printPages[printPages.length - 1].page.pageRange;
				var allPagesRange = new Asc.Range(startRange.c1, startRange.r1, endRange.c2, endRange.r2);
				var difference = allPagesRange.difference(this.visibleRange);
				if(difference && difference.length) {
					for(var i = 0; i < difference.length; i++) {
						this._drawElements(drawCurArea, difference[i]);
					}
				}
			}

			//орисовываем границы страниц
			for (var i = 0, l = printPages.length; i < l; ++i) {
				this._drawElements(this._drawSelectionElement, printPages[i].page.pageRange, AscCommonExcel.selectionLineType.Dash, this.settings.activeCellBorderColor);
			}

			//рисуем границы либо общей области, либо если определен printArea - рисуем границы каждой области(может быть мультиселект)
			if(printRanges && printRanges.length) {
				for(var i = 0, l = printRanges.length; i < l; ++i) {
					this._drawElements(this._drawSelectionElement, printRanges[i], AscCommonExcel.selectionLineType.Select, this.settings.activeCellBorderColor);
				}
			} else {
				this._drawElements(this._drawSelectionElement, allPagesRange, AscCommonExcel.selectionLineType.Select, this.settings.activeCellBorderColor);
			}
		} else {
			this._drawElements(drawCurArea, this.visibleRange);
		}
	};

	WorksheetView.prototype._drawPrintArea = function () {
		var printOptions = this.model.PagePrintOptions;

		var printArea = this.model.workbook.getDefinesNames("Print_Area", this.model.getId());
		var printPages = [];
		if(printArea) {
			this.calcPagesPrint(printOptions, null, null, printPages, null, null, true);
		} else {
			var range = new asc_Range(0, 0, this.visibleRange.c2, this.visibleRange.r2);
			this._calcPagesPrint(range, printOptions, null, printPages, null, null, true);
		}

		var pageSetupModel = printOptions.asc_getPageSetup();
		var fitToWidth = pageSetupModel.asc_getFitToWidth();
		var fitToHeight = pageSetupModel.asc_getFitToHeight();
		var drawProp;
		if(fitToWidth >= 1 && fitToHeight >= 1) {
			return;
		} else if(fitToWidth >= 1) {
			drawProp = 1;
		} else if(fitToHeight >= 1) {
			drawProp = 2;
		}

		for (var i = 0, l = printPages.length; i < l; ++i) {
			this._drawElements(this._drawSelectionElement, printPages[i].pageRange, AscCommonExcel.selectionLineType.Dash, new CColor(0, 0, 0), undefined, drawProp);
		}
	};

	WorksheetView.prototype._drawCutRange = function () {
		if(this.cutRange) {
			this._drawElements(this._drawSelectionElement, this.cutRange, AscCommonExcel.selectionLineType.DashThick, this.settings.activeCellBorderColor);
		}
	};

	WorksheetView.prototype._drawPageBreakPreviewText = function (drawingCtx, range, leftFieldInPx, topFieldInPx, width, height, printPages) {

		if(!pageBreakPreviewMode) {
			return;
		}

		if (range === undefined) {
			range = this.visibleRange;
		}
		var t = this;
		var ctx = drawingCtx || this.drawingCtx;

		var offsetX = (undefined !== leftFieldInPx) ? leftFieldInPx : this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
		var offsetY = (undefined !== topFieldInPx) ? topFieldInPx : this._getRowTop(this.visibleRange.r1) - this.cellsTop;

		var frozenX = 0, frozenY = 0, cFrozen, rFrozen;
		if (!drawingCtx && this.topLeftFrozenCell) {
			if (undefined === leftFieldInPx) {
				cFrozen = this.topLeftFrozenCell.getCol0();
				offsetX -= frozenX = this._getColLeft(cFrozen) - this._getColLeft(0);
			}
			if (undefined === topFieldInPx) {
				rFrozen = this.topLeftFrozenCell.getRow0();
				offsetY -= frozenY =  this._getRowTop(rFrozen) - this._getRowTop(0);
			}
		}

		var basePageString = "Page ";

		var getOptimalFontSize = function(width, height) {
			var needWidth = width / 3;
			var needHeight = height / 3;

			//TODO максмальный размер выбрал произвольно. изменить! + оптимизировать алгоритм по равенству
			var font = new AscCommonExcel.Font();
			var str;
			var i = 0, j = 100, k, textMetrics;
			while (i <= j) {

				k = Math.floor((i + j) / 2);

				font.fs = k;
				str = new AscCommonExcel.Fragment();
				str.text = basePageString + (index + 1);
				str.format = font;
				t.stringRender.setString([str]);
				textMetrics = t.stringRender._measureChars();

				if (textMetrics.width === needWidth && textMetrics.height === needHeight) {
					break;
				} else if (textMetrics.width > needWidth || textMetrics.height > needHeight) {
					j = k - 1;
				} else {
					i = k + 1;
				}
			}
			return k;
		};

		var x1, x2, y1, y2;
		var pageBreakPreview = true;
		if(pageBreakPreview) {
			var startRange = printPages[0] ? printPages[0].page.pageRange : null;
			var endRange = printPages[0] ? printPages[printPages.length - 1].page.pageRange : null;
			var unionRange = startRange ? new Asc.Range(startRange.c1, startRange.r1, endRange.c2, endRange.r2) : null;
			var intersection = unionRange ? range.intersection(unionRange) : null;

			if(printPages[0] && intersection) {
				x1 = this._getColLeft(range.c1) - offsetX;
				y1 = this._getRowTop(range.r1) - offsetY;
				x2 = this._getColLeft(range.c2 + 1) - offsetX;
				y2 = this._getRowTop(range.r2 + 1) - offsetY;


				var pageRange;
				var tX1, tX2, tY1, tY2, pageIntersection, index;
				for (var i = 0; i < printPages.length; ++i) {
					pageRange = printPages[i].page.pageRange;
					index = printPages[i].index;
					pageIntersection = pageRange.intersection(range);
					if(!pageIntersection) {
						if(pageRange.r1 > range.r2 && pageRange.c1 > range.c2) {
							break;
						} else {
							continue;
						}
					}

					var widthPage = this._getColLeft(pageRange.c2 + 1) - this._getColLeft(pageRange.c1);
					var heightPage = this._getRowTop(pageRange.r2 + 1) - this._getRowTop(pageRange.r1);
					var centerX = this._getColLeft(pageRange.c1) + (widthPage) / 2 - offsetX;
					var centerY = this._getRowTop(pageRange.r1) + (heightPage) / 2 - offsetY;

					//TODO подобрать такой размер шрифта, чтобы у текста была нужная нам ширина(1/3 от ширины страницы)
					var font = new AscCommonExcel.Font();
					font.fs = getOptimalFontSize(widthPage, heightPage);
					var str = new AscCommonExcel.Fragment();
					str.text = basePageString + (index + 1);
					str.format = font;
					this.stringRender.setString([str]);

					var textMetrics = this.stringRender._measureChars();
					tX1 = centerX - textMetrics.width / 2;
					tX2 = centerX + textMetrics.width / 2;
					tY1 = centerY - textMetrics.height / 2;
					tY2 = centerY + textMetrics.height / 2;

					if(!(tX1 > x2 || tX2 < x1 || tY1 > y2 || tY2 < y1)) {
						ctx.AddClipRect(x1, y1, x2-x1, y2-y1);
						this.stringRender.render(undefined, tX1, tY1, 100, this.settings.activeCellBorderColor);
						ctx.RemoveClipRect();
					}
				}
			}
		}
	};


	//TODO temp function
	WorksheetView.prototype._getVisiblePrintPages = function (range) {
		var printOptions = this.model.PagePrintOptions;
		var printPages = [];
		var printRanges = [];
		this.calcPagesPrint(printOptions, null, null, printPages, printRanges);

		var res = [];
		if (range === undefined) {
			range = this.visibleRange;
		}

		for (var i = 0; i < printPages.length; ++i) {

			if(printPages[i].pageRange.intersection(range)) {
				res.push({index: i, page: printPages[i]});
			}
		}

		var visiblePrintRanges = [];
		for (var i = 0; i < printRanges.length; ++i) {

			if(printRanges[i].intersection(range)) {
				visiblePrintRanges.push(printRanges[i]);
			}
		}

		return {printPages: res, printRanges: visiblePrintRanges};
	};

    /** Удаляет вертикальные границы ячейки, если текст выходит за границы и соседние ячейки пусты */
    WorksheetView.prototype._eraseCellRightBorder = function ( drawingCtx, colBeg, colEnd, row, offsetX, offsetY ) {
        if ( colBeg >= colEnd ) {
            return;
        }
        var nextCell = -1;
        var ctx = drawingCtx || this.drawingCtx;
        ctx.setFillStyle( this.settings.cells.defaultState.background );
        for ( var col = colBeg; col < colEnd; ++col ) {
            var c = -1 !== nextCell ? nextCell : this._getCell( col, row );
            var bg = null !== c ? c.getFillColor() : null;
            if ( bg !== null ) {
                continue;
            }

            nextCell = this._getCell( col + 1, row );
            bg = null !== nextCell ? nextCell.getFillColor() : null;
            if ( bg !== null ) {
                continue;
            }

            ctx.fillRect( this._getColLeft(col + 1) - offsetX - gridlineSize, this._getRowTop(row) - offsetY, gridlineSize, this._getRowHeight(row) - gridlineSize );
        }
    };

	/** Рисует рамки для ячеек */
	WorksheetView.prototype._drawCellsBorders = function (drawingCtx, range, offsetX, offsetY, mergedCells) {
		//TODO: использовать стили линий при рисовании границ
		var t = this;
		var ctx = drawingCtx || this.drawingCtx;

		var objectMergedCells = {}; // Двумерный map вида строка-колонка {1: {1: range, 4: range}}
		var h, w, i, mergeCellInfo, startCol, endRow, endCol, col, row;
		for (i in mergedCells) {
			mergeCellInfo = mergedCells[i];
			startCol = Math.max(range.c1, mergeCellInfo.c1);
			endRow = Math.min(mergeCellInfo.r2, range.r2, this.nRowsCount);
			endCol = Math.min(mergeCellInfo.c2, range.c2, this.nColsCount);
			for (row = Math.max(range.r1, mergeCellInfo.r1); row <= endRow; ++row) {
				if (!objectMergedCells.hasOwnProperty(row)) {
					objectMergedCells[row] = {};
				}
				for (col = startCol; col <= endCol; ++col) {
					objectMergedCells[row][col] = mergeCellInfo;
				}
			}
		}

		var bc = null, bs = c_oAscBorderStyles.None, isNotFirst = false; // cached border color

		function drawBorder(type, border, x1, y1, x2, y2) {
			var isStroke = false, isNewColor = !AscCommonExcel.g_oColorManager.isEqual(bc,
				border.c), isNewStyle = bs !== border.s;
			if (isNotFirst && (isNewColor || isNewStyle)) {
				ctx.stroke();
				isStroke = true;
			}

			if (isNewColor) {
				bc = border.c;
				ctx.setStrokeStyle(bc);
			}
			if (isNewStyle) {
				bs = border.s;
				ctx.setLineWidth(border.w);
				ctx.setLineDash(border.getDashSegments());
			}

			if (isStroke || false === isNotFirst) {
				isNotFirst = true;
				ctx.beginPath();
			}

			switch (type) {
				case c_oAscBorderType.Hor:
					ctx.lineHor(x1, y1, x2);
					break;
				case c_oAscBorderType.Ver:
					ctx.lineVer(x1, y1, y2);
					break;
				case c_oAscBorderType.Diag:
					ctx.lineDiag(x1, y1, x2, y2);
					break;
			}
		}

		function drawVerticalBorder(borderLeftObject, borderRightObject, x, y1, y2) {
			var borderLeft = borderLeftObject ? borderLeftObject.borders : null,
				borderRight = borderRightObject ? borderRightObject.borders : null;

			var border = AscCommonExcel.getMatchingBorder(borderLeft && borderLeft.r, borderRight && borderRight.l);
			if (!border || border.w < 1) {
				return;
			}

			// ToDo переделать рассчет
			var tbw = t._calcMaxBorderWidth(borderLeftObject && borderLeftObject.getTopBorder(),
				borderRightObject && borderRightObject.getTopBorder()); // top border width
			var bbw = t._calcMaxBorderWidth(borderLeftObject && borderLeftObject.getBottomBorder(),
				borderRightObject && borderRightObject.getBottomBorder()); // bottom border width
			var dy1 = tbw > border.w ? tbw - 1 : (tbw > 1 ? -1 : 0);
			var dy2 = bbw > border.w ? -2 : (bbw > 2 ? 1 : 0);

			drawBorder(c_oAscBorderType.Ver, border, x, y1 + (-1 + dy1), x, y2 + (1 + dy2));
		}

		function drawHorizontalBorder(borderTopObject, borderBottomObject, x1, y, x2) {
			var borderTop = borderTopObject ? borderTopObject.borders : null,
				borderBottom = borderBottomObject ? borderBottomObject.borders : null;

			var border = AscCommonExcel.getMatchingBorder(borderTop && borderTop.b, borderBottom && borderBottom.t);
			if (border && border.w > 0) {
				// ToDo переделать рассчет
				var lbw = t._calcMaxBorderWidth(borderTopObject && borderTopObject.getLeftBorder(),
					borderBottomObject && borderBottomObject.getLeftBorder());
				var rbw = t._calcMaxBorderWidth(borderTopObject && borderTopObject.getRightBorder(),
					borderTopObject && borderTopObject.getRightBorder());
				var dx1 = border.w > lbw ? (lbw > 1 ? -1 : 0) : (lbw > 2 ? 2 : 1);
				var dx2 = border.w > rbw ? (rbw > 2 ? 1 : 0) : (rbw > 1 ? -2 : -1);
				drawBorder(c_oAscBorderType.Hor, border, x1 + (-1 + dx1), y, x2 + (1 + dx2), y);
			}
		}

		var arrPrevRow = [], arrCurrRow = [], arrNextRow = [];
		var objMCPrevRow = null, objMCRow = null, objMCNextRow = null;
		var bCur, bPrev, bNext, bTopCur, bTopPrev, bTopNext, bBotCur, bBotPrev, bBotNext;
		bCur = bPrev = bNext = bTopCur = bTopNext = bBotCur = bBotNext = null;
		row = range.r1 - 1;
		var prevCol = range.c1 - 1;
		// Определим первую колонку (т.к. могут быть скрытые колонки)
		while (0 <= prevCol && 0 === this._getColumnWidth(prevCol))
			--prevCol;

		// Сначала пройдемся по верхней строке (над отрисовываемым диапазоном)
		while (0 <= row) {
			if (this._getRowHeight(row) > 0) {
				objMCPrevRow = objectMergedCells[row];
				for (col = prevCol; col <= range.c2 && col < t.nColsCount; ++col) {
					if (0 > col || this._getColumnWidth(col) <= 0) {
						continue;
					}
					arrPrevRow[col] =
						new CellBorderObject(t._getVisibleCell(col, row).getBorder(), objMCPrevRow ? objMCPrevRow[col] :
							null, col, row);
				}
				break;
			}
			--row;
		}

		var mc = null, nextRow, isFirstRow = true;
		var isPrevColExist = (0 <= prevCol);
		for (row = range.r1; row <= range.r2; row = nextRow) {
			nextRow = row + 1;
			h = this._getRowHeight(row);
			if (0 === h) {
				continue;
			}
			// Нужно отсеять пустые снизу
			for (; nextRow <= range.r2 && nextRow < t.nRowsCount; ++nextRow) {
				if (0 < this._getRowHeight(nextRow)) {
					break;
				}
			}

			var isFirstRowTmp = isFirstRow, isLastRow = nextRow > range.r2 || nextRow >= t.nRowsCount;
			isFirstRow = false; // Это уже не первая строка (определяем не по совпадению с range.r1, а по видимости)

			objMCRow = isFirstRowTmp ? objectMergedCells[row] : objMCNextRow;
			objMCNextRow = objectMergedCells[nextRow];

			var rowCache = t._getRowCache(row);
			var y1 = this._getRowTop(row) - offsetY;
			var y2 = y1 + h - gridlineSize;

			var nextCol, isFirstCol = true;
			for (col = range.c1; col <= range.c2 && col < t.nColsCount; col = nextCol) {
				nextCol = col + 1;
				w = this._getColumnWidth(col);
				if (0 === w) {
					continue;
				}
				// Нужно отсеять пустые справа
				for (; nextCol <= range.c2 && nextCol < t.nColsCount; ++nextCol) {
					if (0 < this._getColumnWidth(nextCol)) {
						break;
					}
				}

				var isFirstColTmp = isFirstCol, isLastCol = nextCol > range.c2 || nextCol >= t.nColsCount;
				isFirstCol = false; // Это уже не первая колонка (определяем не по совпадению с range.c1, а по видимости)

				mc = objMCRow ? objMCRow[col] : null;

				var x1 = this._getColLeft(col) - offsetX;
				var x2 = x1 + w - gridlineSize;

				if (row === t.nRowsCount) {
					bBotPrev = bBotCur = bBotNext = null;
				} else {
					if (isFirstColTmp) {
						bBotPrev = arrNextRow[prevCol] =
							new CellBorderObject(isPrevColExist ? t._getVisibleCell(prevCol, nextRow).getBorder() :
								null, objMCNextRow ? objMCNextRow[prevCol] : null, prevCol, nextRow);
						bBotCur = arrNextRow[col] =
							new CellBorderObject(t._getVisibleCell(col, nextRow).getBorder(), objMCNextRow ?
								objMCNextRow[col] : null, col, nextRow);
					} else {
						bBotPrev = bBotCur;
						bBotCur = bBotNext;
					}
				}

				if (isFirstColTmp) {
					bPrev = arrCurrRow[prevCol] =
						new CellBorderObject(isPrevColExist ? t._getVisibleCell(prevCol, row).getBorder() :
							null, objMCRow ? objMCRow[prevCol] : null, prevCol, row);
					bCur =
						arrCurrRow[col] = new CellBorderObject(t._getVisibleCell(col, row).getBorder(), mc, col, row);
					bTopPrev = arrPrevRow[prevCol];
					bTopCur = arrPrevRow[col];
				} else {
					bPrev = bCur;
					bCur = bNext;
					bTopPrev = bTopCur;
					bTopCur = bTopNext;
				}

				if (col === t.nColsCount) {
					bNext = null;
					bTopNext = null;
				} else {
					bNext = arrCurrRow[nextCol] =
						new CellBorderObject(t._getVisibleCell(nextCol, row).getBorder(), objMCRow ? objMCRow[nextCol] :
							null, nextCol, row);
					bTopNext = arrPrevRow[nextCol];

					if (row === t.nRowsCount) {
						bBotNext = null;
					} else {
						bBotNext = arrNextRow[nextCol] =
							new CellBorderObject(t._getVisibleCell(nextCol, nextRow).getBorder(), objMCNextRow ?
								objMCNextRow[nextCol] : null, nextCol, nextRow);
					}
				}

				if (mc && row !== mc.r1 && row !== mc.r2 && col !== mc.c1 && col !== mc.c2) {
					continue;
				}

				// draw diagonal borders
				if ((bCur.borders.dd || bCur.borders.du) && (!mc || (row === mc.r1 && col === mc.c1))) {
					var x2Diagonal = x2;
					var y2Diagonal = y2;
					if (mc) {
						// Merge cells
						x2Diagonal = this._getColLeft(mc.c2 + 1) - offsetX - 1;
						y2Diagonal = this._getRowTop(mc.r2 + 1) - offsetY - 1;
					}
					// ToDo Clip diagonal borders
                    /*ctx.save()
                     .beginPath()
                     .rect(x1 + (lb.w < 1 ? -1 : (lb.w < 3 ? 0 : +1)),
                     y1 + (tb.w < 1 ? -1 : (tb.w < 3 ? 0 : +1)),
                     c[col].width + ( -1 + (lb.w < 1 ? +1 : (lb.w < 3 ? 0 : -1)) + (rb.w < 1 ? +1 : (rb.w < 2 ? 0 : -1)) ),
                     r[row].height + ( -1 + (tb.w < 1 ? +1 : (tb.w < 3 ? 0 : -1)) + (bb.w < 1 ? +1 : (bb.w < 2 ? 0 : -1)) ))
                     .clip();
                     */
					if (bCur.borders.dd) {
						// draw diagonal line l,t - r,b
						drawBorder(c_oAscBorderType.Diag, bCur.borders.d, x1 - 1, y1 - 1, x2Diagonal, y2Diagonal);
					}
					if (bCur.borders.du) {
						// draw diagonal line l,b - r,t
						drawBorder(c_oAscBorderType.Diag, bCur.borders.d, x1 - 1, y2Diagonal, x2Diagonal, y1 - 1);
					}
					// ToDo Clip diagonal borders
					//ctx.restore();
					// canvas context has just been restored, so destroy border color cache
					//bc = undefined;
				}

				// draw left border
				if (isFirstColTmp && !t._isLeftBorderErased(col, rowCache)) {
					drawVerticalBorder(bPrev, bCur, x1 - gridlineSize, y1, y2);
					// Если мы в печати и печатаем первый столбец, то нужно напечатать бордеры
//						if (lb.w >= 1 && drawingCtx && 0 === col) {
					// Иначе они будут не такой ширины
					// ToDo посмотреть что с этим ? в печати будет обрезка
//							drawVerticalBorder(lb, tb, tbPrev, bb, bbPrev, x1, y1, y2);
//						}
				}
				// draw right border
				if ((!mc || col === mc.c2) && !t._isRightBorderErased(col, rowCache)) {
					drawVerticalBorder(bCur, bNext, x2, y1, y2);
				}
				// draw top border
				if (isFirstRowTmp) {
					drawHorizontalBorder(bTopCur, bCur, x1, y1 - gridlineSize, x2);
					// Если мы в печати и печатаем первую строку, то нужно напечатать бордеры
//						if (tb.w > 0 && drawingCtx && 0 === row) {
					// ToDo посмотреть что с этим ? в печати будет обрезка
//							drawHorizontalBorder.call(this, tb, lb, lbPrev, rb, rbPrev, x1, y1, x2);
//						}
				}
				if (!mc || row === mc.r2) {
					// draw bottom border
					drawHorizontalBorder(bCur, bBotCur, x1, y2, x2);
				}
			}

			arrPrevRow = arrCurrRow;
			arrCurrRow = arrNextRow;
			arrNextRow = [];
		}

		if (isNotFirst) {
			ctx.stroke();
		}
	};

    /** Рисует закрепленные области областей */
    WorksheetView.prototype._drawFrozenPane = function ( noCells ) {
        if ( this.topLeftFrozenCell ) {
            var row = this.topLeftFrozenCell.getRow0();
            var col = this.topLeftFrozenCell.getCol0();

            var tmpRange, offsetX, offsetY;
            if ( 0 < row && 0 < col ) {
                offsetX = this._getColLeft(0) - this.cellsLeft;
                offsetY = this._getRowTop(0) - this.cellsTop;
                tmpRange = new asc_Range( 0, 0, col - 1, row - 1 );
                if ( !noCells ) {
                    this._drawGrid( null, tmpRange, offsetX, offsetY );
					this._drawGroupData(null, tmpRange, offsetX, offsetY);
					this._drawGroupData(null, tmpRange, offsetX, undefined, true);
                    this._drawCellsAndBorders(null, tmpRange, offsetX, offsetY );
                }
            }
            if ( 0 < row ) {
                row -= 1;
                offsetX = undefined;
                offsetY = this._getRowTop(0) - this.cellsTop;
                tmpRange = new asc_Range( this.visibleRange.c1, 0, this.visibleRange.c2, row );
                this._drawRowHeaders( null, 0, row, kHeaderDefault, offsetX, offsetY );
                if ( !noCells ) {
                    this._drawGrid( null, tmpRange, offsetX, offsetY );
					this._drawGroupData(null, tmpRange, offsetX, offsetY);
					this._drawGroupData(null, tmpRange, offsetX, offsetY, true);
                    this._drawCellsAndBorders(null, tmpRange, offsetX, offsetY );
                }
            }
            if ( 0 < col ) {
                col -= 1;
                offsetX = this._getColLeft(0) - this.cellsLeft;
                offsetY = undefined;
                tmpRange = new asc_Range( 0, this.visibleRange.r1, col, this.visibleRange.r2 );
                this._drawColumnHeaders( null, 0, col, kHeaderDefault, offsetX, offsetY );
                if ( !noCells ) {
                    this._drawGrid( null, tmpRange, offsetX, offsetY );
					this._drawGroupData(null, tmpRange, offsetX, offsetY);
					this._drawGroupData(null, tmpRange, offsetX, offsetY, true);
                    this._drawCellsAndBorders(null, tmpRange, offsetX, offsetY );
                }
            }
        }
    };

	/** Рисует закрепление областей */
	WorksheetView.prototype._drawFrozenPaneLines = function (drawingCtx) {
		// Возможно стоит отрисовывать на overlay, а не на основной канве
		var ctx = drawingCtx || this.drawingCtx;
		var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, null, this.model.getId(),
			AscCommonExcel.c_oAscLockNameFrozenPane);
		var isLocked = this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther, false);
		var color = isLocked ? AscCommonExcel.c_oAscCoAuthoringOtherBorderColor : this.settings.frozenColor;
		ctx.setLineWidth(1).setStrokeStyle(color).beginPath();
		var fHorLine, fVerLine;
		if (isLocked) {
			fHorLine = ctx.dashLineCleverHor;
			fVerLine = ctx.dashLineCleverVer;
		} else {
			fHorLine = ctx.lineHorPrevPx;
			fVerLine = ctx.lineVerPrevPx;
		}

		if (this.topLeftFrozenCell) {
			var row = this.topLeftFrozenCell.getRow0();
			var col = this.topLeftFrozenCell.getCol0();
			if (0 < row) {
				fHorLine.apply(ctx, [0, this._getRowTop(row), ctx.getWidth()]);
			} else {
				fHorLine.apply(ctx, [this.headersLeft, this.headersTop + this.headersHeight, this.headersLeft + this.headersWidth]);
			}

			if (0 < col) {
				fVerLine.apply(ctx, [this._getColLeft(col), 0, ctx.getHeight()]);
			} else {
				fVerLine.apply(ctx, [this.headersLeft + this.headersWidth, this.headersTop, this.headersTop + this.headersHeight]);

			}
			ctx.stroke();

		} else if (this.model.getSheetView().asc_getShowRowColHeaders()) {
			fHorLine.apply(ctx, [this.headersLeft, this.headersTop + this.headersHeight, this.headersLeft + this.headersWidth]);
			fVerLine.apply(ctx, [this.headersWidth + this.headersLeft, this.headersTop, this.headersTop + this.headersHeight]);
			ctx.stroke();
		}
	};

    WorksheetView.prototype.drawFrozenGuides = function ( x, y, target ) {
        var data, offsetFrozen;
        var ctx = this.overlayCtx;

        ctx.clear();
        this._drawSelection();

        switch ( target ) {
            case c_oTargetType.FrozenAnchorV:
                data = this._findColUnderCursor( x, true, true );
                if ( data ) {
                    data.col += 1;
                    if ( 0 <= data.col && data.col < this.nColsCount ) {
                        var h = ctx.getHeight();
                        var offsetX = this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
                        offsetFrozen = this.getFrozenPaneOffset( false, true );
                        offsetX -= offsetFrozen.offsetX;
                        ctx.setFillPattern( this.settings.ptrnLineDotted1 )
                            .fillRect( this._getColLeft(data.col) - offsetX - gridlineSize, 0, 1, h );
                    }
                }
                break;
            case c_oTargetType.FrozenAnchorH:
                data = this._findRowUnderCursor( y, true, true );
                if ( data ) {
                    data.row += 1;
                    if ( 0 <= data.row && data.row < this.nRowsCount ) {
                        var w = ctx.getWidth();
                        var offsetY = this._getRowTop(this.visibleRange.r1) - this.cellsTop;
                        offsetFrozen = this.getFrozenPaneOffset( true, false );
                        offsetY -= offsetFrozen.offsetY;
                        ctx.setFillPattern( this.settings.ptrnLineDotted1 )
                            .fillRect( 0, this._getRowTop(data.row) - offsetY - 1, w, 1 );
                    }
                }
                break;
        }
    };

    WorksheetView.prototype._isFrozenAnchor = function ( x, y ) {
        var result = {result: false, cursor: "move", name: ""};
        if ( false === this.model.getSheetView().asc_getShowRowColHeaders() ) {
            return result;
        }

        var _this = this;
        var frozenCell = this.topLeftFrozenCell ? this.topLeftFrozenCell : new AscCommon.CellAddress( 0, 0, 0 );

        function isPointInAnchor( x, y, rectX, rectY, rectW, rectH ) {
			var delta = 2;
            return (x >= rectX - delta) && (x <= rectX + rectW + delta) && (y >= rectY - delta) && (y <= rectY + rectH + delta);
        }

        // vertical
        var _x = this._getColLeft(frozenCell.getCol0()) - 0.5;
        var _y = _this.headersTop;
        var w = 0;
        var h = _this.headersHeight;
        if ( isPointInAnchor( x, y, _x, _y, w, h ) ) {
            result.result = true;
            result.name = c_oTargetType.FrozenAnchorV;
        }

        // horizontal
        _x = _this.headersLeft;
        _y = this._getRowTop(frozenCell.getRow0()) - 0.5;
        w = _this.headersWidth - 0.5;
        h = 0;
        if ( isPointInAnchor( x, y, _x, _y, w, h ) ) {
            result.result = true;
            result.name = c_oTargetType.FrozenAnchorH;
        }

        return result;
    };

    WorksheetView.prototype.applyFrozenAnchor = function ( x, y, target ) {
        var t = this;
        var onChangeFrozenCallback = function ( isSuccess ) {
            if ( false === isSuccess ) {
                t.overlayCtx.clear();
                t._drawSelection();
                return;
            }
            var lastCol = 0, lastRow = 0, data;
            if ( t.topLeftFrozenCell ) {
                lastCol = t.topLeftFrozenCell.getCol0();
                lastRow = t.topLeftFrozenCell.getRow0();
            }
            switch ( target ) {
                case c_oTargetType.FrozenAnchorV:
                    data = t._findColUnderCursor( x, true, true );
                    if ( data ) {
                        data.col += 1;
                        if ( 0 <= data.col && data.col < t.nColsCount ) {
                            lastCol = data.col;
                        }
                    }
                    break;
                case c_oTargetType.FrozenAnchorH:
                    data = t._findRowUnderCursor( y, true, true );
                    if ( data ) {
                        data.row += 1;
                        if ( 0 <= data.row && data.row < t.nRowsCount ) {
                            lastRow = data.row;
                        }
                    }
                    break;
            }
            t._updateFreezePane( lastCol, lastRow );
        };

        this._isLockedFrozenPane( onChangeFrozenCallback );
    };

    /** Для api закрепленных областей */
    WorksheetView.prototype.freezePane = function () {
        var t = this;
        var activeCell = this.model.selectionRange.activeCell.clone();
        var onChangeFreezePane = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }
            var col, row, mc;
            if (null !== t.topLeftFrozenCell) {
                col = row = 0;
            } else {
                col = activeCell.col;
                row = activeCell.row;

                if (0 !== row || 0 !== col) {
                    mc = t.model.getMergedByCell(row, col);
                    if (mc) {
                        col = mc.c1;
                        row = mc.r1;
                    }
                }

                if (0 === col && 0 === row) {
                    col = ((t.visibleRange.c2 - t.visibleRange.c1) / 2) >> 0;
                    row = ((t.visibleRange.r2 - t.visibleRange.r1) / 2) >> 0;
                }
            }
            t._updateFreezePane(col, row);
        };

        return this._isLockedFrozenPane(onChangeFreezePane);
    };

    WorksheetView.prototype._updateFreezePane = function (col, row, lockDraw) {
        if (window['IS_NATIVE_EDITOR'])
            return;

        var lastCol = 0, lastRow = 0;
        if (this.topLeftFrozenCell) {
            lastCol = this.topLeftFrozenCell.getCol0();
            lastRow = this.topLeftFrozenCell.getRow0();
        }
        History.Create_NewPoint();
        var oData = new AscCommonExcel.UndoRedoData_FromTo(new AscCommonExcel.UndoRedoData_BBox(new asc_Range(lastCol, lastRow, lastCol, lastRow)), new AscCommonExcel.UndoRedoData_BBox(new asc_Range(col, row, col, row)), null);
        History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_ChangeFrozenCell,
          this.model.getId(), null, oData);

        var isUpdate = false;
        if (0 === col && 0 === row) { // Очистка
            if (null !== this.topLeftFrozenCell) {
                isUpdate = true;
            }
            this.topLeftFrozenCell = this.model.getSheetView().pane = null;
        } else { // Создание
            if (null === this.topLeftFrozenCell) {
                isUpdate = true;
            }
            var pane = this.model.getSheetView().pane = new AscCommonExcel.asc_CPane();
            this.topLeftFrozenCell = pane.topLeftFrozenCell = new AscCommon.CellAddress(row, col, 0);
        }
        this.visibleRange.c1 = col;
        this.visibleRange.r1 = row;
		this._updateVisibleRowsCount(true);
        this._updateVisibleColsCount(true);
        this.scrollType |= AscCommonExcel.c_oAscScrollType.ScrollVertical | AscCommonExcel.c_oAscScrollType.ScrollHorizontal;

        if (this.objectRender && this.objectRender.drawingArea) {
            this.objectRender.drawingArea.init();
        }
        if (!lockDraw) {
            this.draw();
        }

        // Эвент на обновление
        if (isUpdate && !this.model.workbook.bUndoChanges && !this.model.workbook.bRedoChanges) {
            this.handlers.trigger("updateSheetViewSettings");
        }
    };

    /** */

    WorksheetView.prototype._drawSelectionElement = function (visibleRange, offsetX, offsetY, args) {
        var range = args[0];
        var selectionLineType = args[1];
        var strokeColor = args[2];
        var isAllRange = args[3];
        var colorN = this.settings.activeCellBorderColor2;
        var ctx = this.overlayCtx;
        var oIntersection = range.intersectionSimple(visibleRange);

        if (!oIntersection) {
            return true;
        }

        var fHorLine, fVerLine;
        var canFill = AscCommonExcel.selectionLineType.Selection & selectionLineType;
        var isDashLine = AscCommonExcel.selectionLineType.Dash & selectionLineType;
        var dashThickLine = AscCommonExcel.selectionLineType.DashThick & selectionLineType;

        if (isDashLine || dashThickLine) {
            fHorLine = ctx.dashLineCleverHor;
            fVerLine = ctx.dashLineCleverVer;
        } else {
            fHorLine = ctx.lineHorPrevPx;
            fVerLine = ctx.lineVerPrevPx;
        }

        var firstCol = oIntersection.c1 === visibleRange.c1 && !isAllRange;
        var firstRow = oIntersection.r1 === visibleRange.r1 && !isAllRange;

        var drawLeftSide = oIntersection.c1 === range.c1;
        var drawRightSide = oIntersection.c2 === range.c2;
        var drawTopSide = oIntersection.r1 === range.r1;
        var drawBottomSide = oIntersection.r2 === range.r2;

        if(args[4]) {
        	if(args[4] === 1) {
				drawLeftSide = false;
				drawRightSide = false;
			} else if(args[4] === 2){
				drawTopSide = false;
				drawBottomSide = false;
			}
		}

        var x1 = this._getColLeft(oIntersection.c1) - offsetX;
        var x2 = this._getColLeft(oIntersection.c2 + 1) - offsetX;
        var y1 = this._getRowTop(oIntersection.r1) - offsetY;
        var y2 = this._getRowTop(oIntersection.r2 + 1) - offsetY;

        if (canFill) {
            var fillColor = strokeColor.Copy();
            fillColor.a = 0.15;
            ctx.setFillStyle(fillColor).fillRect(x1, y1, x2 - x1, y2 - y1);
        }

        ctx.setLineWidth(isDashLine ? 1 : 2).setStrokeStyle(strokeColor);

        ctx.beginPath();
        if (drawTopSide && !firstRow) {
            fHorLine.apply(ctx, [x1 - !isDashLine * 2, y1, x2 + !isDashLine * 1]);
        }
        if (drawBottomSide) {
            fHorLine.apply(ctx, [x1, y2 + !isDashLine * 1, x2]);
        }
        if (drawLeftSide && !firstCol) {
            fVerLine.apply(ctx, [x1, y1, y2 + !isDashLine * 1]);
        }
        if (drawRightSide) {
            fVerLine.apply(ctx, [x2 + !isDashLine * 1, y1, y2 + !isDashLine * 1]);
        }
        ctx.closePath().stroke();

		// draw active cell in selection
		var isActive = AscCommonExcel.selectionLineType.ActiveCell & selectionLineType;
		if (isActive) {
			var cell = (this.isSelectionDialogMode ? this.copyActiveRange : this.model.selectionRange).activeCell;
			var fs = this.model.getMergedByCell(cell.row, cell.col);
			fs = oIntersection.intersectionSimple(fs || new asc_Range(cell.col, cell.row, cell.col, cell.row));
			if (fs) {
			    var top = this._getRowTop(fs.r1);
			    var left = this._getColLeft(fs.c1);
				var _x1 = left - offsetX + 1;
				var _y1 = top - offsetY + 1;
				var _w = this._getColLeft(fs.c2 + 1) - left - 2;
				var _h = this._getRowTop(fs.r2 + 1) - top - 2;
				if (0 < _w && 0 < _h) {
					ctx.clearRect(_x1, _y1, _w, _h);
				}
			}
		}

        if (canFill) {/*Отрисовка светлой полосы при выборе ячеек для формулы*/
            ctx.setLineWidth(1);
            ctx.setStrokeStyle(colorN);
            ctx.beginPath();
            if (drawTopSide) {
                fHorLine.apply(ctx, [x1, y1 + 1, x2 - 1]);
            }
            if (drawBottomSide) {
                fHorLine.apply(ctx, [x1, y2 - 1, x2 - 1]);
            }
            if (drawLeftSide) {
                fVerLine.apply(ctx, [x1 + 1, y1, y2 - 2]);
            }
            if (drawRightSide) {
                fVerLine.apply(ctx, [x2 - 1, y1, y2 - 2]);
            }
            ctx.closePath().stroke();
        }

        // Отрисовка квадратов для move/resize
        var isResize = AscCommonExcel.selectionLineType.Resize & selectionLineType;
        var isPromote = AscCommonExcel.selectionLineType.Promote & selectionLineType;
        if (isResize || isPromote) {
            ctx.setFillStyle(colorN);
            if (drawRightSide && drawBottomSide) {
                ctx.fillRect(x2 - 4, y2 - 4, 7, 7);
            }
            ctx.setFillStyle(strokeColor);
            if (drawRightSide && drawBottomSide) {
                ctx.fillRect(x2 - 3, y2 - 3, 5, 5);
            }

            if (isResize) {
                ctx.setFillStyle(colorN);
                if (drawLeftSide && drawTopSide) {
                    ctx.fillRect(x1 - 4, y1 - 4, 7, 7);
                }
                if (drawRightSide && drawTopSide) {
                    ctx.fillRect(x2 - 4, y1 - 4, 7, 7);
                }
                if (drawLeftSide && drawBottomSide) {
                    ctx.fillRect(x1 - 4, y2 - 4, 7, 7);
                }
                ctx.setFillStyle(strokeColor);
                if (drawLeftSide && drawTopSide) {
                    ctx.fillRect(x1 - 3, y1 - 3, 5, 5);
                }
                if (drawRightSide && drawTopSide) {
                    ctx.fillRect(x2 - 3, y1 - 3, 5, 5);
                }
                if (drawLeftSide && drawBottomSide) {
                    ctx.fillRect(x1 - 3, y2 - 3, 5, 5);
                }
            }
        }
        return true;
    };
    /**Отрисовывает диапазон с заданными параметрами*/
    WorksheetView.prototype._drawElements = function (drawFunction) {
        var cFrozen = 0, rFrozen = 0, args = Array.prototype.slice.call(arguments, 1),
			offsetX = this._getColLeft(this.visibleRange.c1) - this.cellsLeft,
            offsetY = this._getRowTop(this.visibleRange.r1) - this.cellsTop, res;
        if (this.topLeftFrozenCell) {
            cFrozen = this.topLeftFrozenCell.getCol0();
            rFrozen = this.topLeftFrozenCell.getRow0();
            offsetX -= this._getColLeft(cFrozen) - this._getColLeft(0);
            offsetY -= this._getRowTop(rFrozen) - this._getRowTop(0);

            var oFrozenRange;
            cFrozen -= 1;
            rFrozen -= 1;
            if (0 <= cFrozen && 0 <= rFrozen) {
                oFrozenRange = new asc_Range(0, 0, cFrozen, rFrozen);
                res = drawFunction.call(this, oFrozenRange, this._getColLeft(0) - this.cellsLeft, this._getRowTop(0) - this.cellsTop, args);
                if (!res) {
                    return;
                }
            }
            if (0 <= cFrozen) {
                oFrozenRange = new asc_Range(0, this.visibleRange.r1, cFrozen, this.visibleRange.r2);
                res = drawFunction.call(this, oFrozenRange, this._getColLeft(0) - this.cellsLeft, offsetY, args);
                if (!res) {
                    return;
                }
            }
            if (0 <= rFrozen) {
                oFrozenRange = new asc_Range(this.visibleRange.c1, 0, this.visibleRange.c2, rFrozen);
                res = drawFunction.call(this, oFrozenRange, offsetX, this._getRowTop(0) - this.cellsTop, args);
                if (!res) {
                    return;
                }
            }
        }

        // Можно вместо call попользовать apply, но тогда нужно каждый раз соединять массив аргументов и 3 объекта
        drawFunction.call(this, this.visibleRange, offsetX, offsetY, args);
    };

    /**
     * Рисует выделение вокруг ячеек
     */
    WorksheetView.prototype._drawSelection = function () {
        var isShapeSelect = false;
        if (window['IS_NATIVE_EDITOR']) {
            return;
        }

		this.handlers.trigger("checkLastWork");

        // set clipping rect to cells area
        var ctx = this.overlayCtx;
        ctx.save().beginPath()
          .rect(this.cellsLeft, this.cellsTop, ctx.getWidth() - this.cellsLeft, ctx.getHeight() - this.cellsTop)
          .clip();

		if(this.viewPrintLines) {
			this._drawPrintArea();
		}

		this._drawCutRange();

		if(pageBreakPreviewModeOverlay) {
			this._drawPageBreakPreviewLinesOverlay();
		}

        if (!this.isSelectionDialogMode) {
            this._drawCollaborativeElements();
        }
        var isOtherSelectionMode = this.isSelectionDialogMode || this.isFormulaEditMode;
        if (isOtherSelectionMode && !this.handlers.trigger('isActive')) {
            if (this.isSelectionDialogMode) {
                this._drawSelectRange();
            } else if (this.isFormulaEditMode) {
                this._drawFormulaRanges(this.arrActiveFormulaRanges);
            }
        } else {
            isShapeSelect = (asc["editor"].isStartAddShape || this.objectRender.selectedGraphicObjectsExists());
            if (isShapeSelect) {
                if (this.isChartAreaEditMode) {
                    this._drawFormulaRanges(this.arrActiveChartRanges);
                }
            } else {
				this._drawFormulaRanges(this.arrActiveFormulaRanges);
				if (this.isChartAreaEditMode) {
					this._drawFormulaRanges(this.arrActiveChartRanges);
				}
                this._drawSelectionRange();

                if (this.activeFillHandle) {
                    this._drawElements(this._drawSelectionElement, this.activeFillHandle.clone(true),
                      AscCommonExcel.selectionLineType.None, this.settings.activeCellBorderColor);
                }
                if (this.isSelectionDialogMode) {
                    this._drawSelectRange();
                }
                if (this.stateFormatPainter && this.handlers.trigger('isActive')) {
                    this._drawFormatPainterRange();
                }
                if (null !== this.activeMoveRange) {
                    this._drawElements(this._drawSelectionElement, this.activeMoveRange,
                      AscCommonExcel.selectionLineType.None, new CColor(0, 0, 0));
                }
            }
        }

        // restore canvas' original clipping range
        ctx.restore();

        if (!isOtherSelectionMode && !isShapeSelect) {
            this._drawActiveHeaders();
        }
    };

    WorksheetView.prototype._drawSelectionRange = function () {
        var type, ranges = (this.isSelectionDialogMode ? this.copyActiveRange : this.model.selectionRange).ranges;
        var range, selectionLineType;
        for (var i = 0, l = ranges.length; i < l; ++i) {
            range = ranges[i].clone();
			type = range.getType();
            if (c_oAscSelectionType.RangeMax === type) {
                range.c2 = this.nColsCount - 1;
                range.r2 = this.nRowsCount - 1;
            } else if (c_oAscSelectionType.RangeCol === type) {
                range.r2 = this.nRowsCount - 1;
            } else if (c_oAscSelectionType.RangeRow === type) {
                range.c2 = this.nColsCount - 1;
            }

            selectionLineType = AscCommonExcel.selectionLineType.Selection;
            if (1 === l) {
                selectionLineType |=
                  AscCommonExcel.selectionLineType.ActiveCell | AscCommonExcel.selectionLineType.Promote;
            } else if (i === this.model.selectionRange.activeCellId) {
                selectionLineType |= AscCommonExcel.selectionLineType.ActiveCell;
            }
            this._drawElements(this._drawSelectionElement, range, selectionLineType,
              this.settings.activeCellBorderColor);
        }
		this.handlers.trigger("drawMobileSelection", this.settings.activeCellBorderColor);
    };

    WorksheetView.prototype._drawFormatPainterRange = function () {
        var t = this, color = new CColor(0, 0, 0);
        this.copyActiveRange.ranges.forEach(function (item) {
            t._drawElements(t._drawSelectionElement, item, AscCommonExcel.selectionLineType.Dash, color);
        });
    };

    WorksheetView.prototype._drawFormulaRanges = function (arrRanges) {
        var i, ranges, length = AscCommonExcel.c_oAscFormulaRangeBorderColor.length;
        var strokeColor, colorIndex, uniqueColorIndex = 0, tmpColors = [];
        for (i = 0; i < arrRanges.length; ++i) {
            ranges = arrRanges[i].ranges;
            for (var j = 0, l = ranges.length; j < l; ++j) {
                colorIndex = asc.getUniqueRangeColor(ranges, j, tmpColors);
                if (null == colorIndex) {
                    colorIndex = uniqueColorIndex++;
                }
                tmpColors.push(colorIndex);
                if (ranges[j].noColor) {
					colorIndex = 0;
				}
                if(arrRanges[i].chartRangeIndex !== undefined) {
                    colorIndex = arrRanges[i].chartRangeIndex;
                }
                strokeColor = AscCommonExcel.c_oAscFormulaRangeBorderColor[colorIndex % length];

                this._drawElements(this._drawSelectionElement, ranges[j],
                  AscCommonExcel.selectionLineType.Selection | (ranges[j].isName ? AscCommonExcel.selectionLineType.None :
                    AscCommonExcel.selectionLineType.Resize), strokeColor);
            }
        }
    };

    WorksheetView.prototype._drawSelectRange = function () {
        var ranges = this.model.selectionRange.ranges;
        for (var i = 0, l = ranges.length; i < l; ++i) {
            this._drawElements(this._drawSelectionElement, ranges[i], AscCommonExcel.selectionLineType.Dash,
              AscCommonExcel.c_oAscCoAuthoringOtherBorderColor);
        }
    };

    WorksheetView.prototype._drawCollaborativeElements = function () {
        if ( this.collaborativeEditing.getCollaborativeEditing() ) {
            this._drawCollaborativeElementsMeOther(c_oAscLockTypes.kLockTypeMine);
            this._drawCollaborativeElementsMeOther(c_oAscLockTypes.kLockTypeOther);
            this._drawCollaborativeElementsAllLock();
        }
    };

    WorksheetView.prototype._drawCollaborativeElementsAllLock = function () {
        var currentSheetId = this.model.getId();
        var nLockAllType = this.collaborativeEditing.isLockAllOther(currentSheetId);
        if (Asc.c_oAscMouseMoveLockedObjectType.None !== nLockAllType) {
            var isAllRange = true, strokeColor = (Asc.c_oAscMouseMoveLockedObjectType.TableProperties ===
            nLockAllType) ? AscCommonExcel.c_oAscCoAuthoringLockTablePropertiesBorderColor :
              AscCommonExcel.c_oAscCoAuthoringOtherBorderColor, oAllRange = new asc_Range(0, 0, gc_nMaxCol0, gc_nMaxRow0);
            this._drawElements(this._drawSelectionElement, oAllRange, AscCommonExcel.selectionLineType.Dash,
              strokeColor, isAllRange);
        }
    };

    WorksheetView.prototype._drawCollaborativeElementsMeOther = function (type) {
        var currentSheetId = this.model.getId(), i, strokeColor, arrayCells, oCellTmp;
        if (c_oAscLockTypes.kLockTypeMine === type) {
            strokeColor = AscCommonExcel.c_oAscCoAuthoringMeBorderColor;
            arrayCells = this.collaborativeEditing.getLockCellsMe(currentSheetId);

            arrayCells = arrayCells.concat(this.collaborativeEditing.getArrayInsertColumnsBySheetId(currentSheetId));
            arrayCells = arrayCells.concat(this.collaborativeEditing.getArrayInsertRowsBySheetId(currentSheetId));
        } else {
            strokeColor = AscCommonExcel.c_oAscCoAuthoringOtherBorderColor;
            arrayCells = this.collaborativeEditing.getLockCellsOther(currentSheetId);
        }

        for (i = 0; i < arrayCells.length; ++i) {
            oCellTmp = new asc_Range(arrayCells[i].c1, arrayCells[i].r1, arrayCells[i].c2, arrayCells[i].r2);
            this._drawElements(this._drawSelectionElement, oCellTmp, AscCommonExcel.selectionLineType.Dash,
              strokeColor);
        }
    };

    WorksheetView.prototype.cleanSelection = function (range, isFrozen) {
        if (window['IS_NATIVE_EDITOR']) {
            return;
        }

        isFrozen = !!isFrozen;
        if (range === undefined) {
            range = this.visibleRange;
        }
        var ctx = this.overlayCtx;
        var width = ctx.getWidth();
        var height = ctx.getHeight();
        var offsetX, offsetY, diffWidth = 0, diffHeight = 0;
        var x1 = Number.MAX_VALUE;
        var x2 = -Number.MAX_VALUE;
        var y1 = Number.MAX_VALUE;
        var y2 = -Number.MAX_VALUE;
        var _x1, _x2, _y1, _y2;
        var i;

        if (this.topLeftFrozenCell) {
            var cFrozen = this.topLeftFrozenCell.getCol0();
            var rFrozen = this.topLeftFrozenCell.getRow0();
            diffWidth = this._getColLeft(cFrozen) - this._getColLeft(0);
            diffHeight = this._getRowTop(rFrozen) - this._getRowTop(0);

            if (!isFrozen) {
                var oFrozenRange;
                cFrozen -= 1;
                rFrozen -= 1;
                if (0 <= cFrozen && 0 <= rFrozen) {
                    oFrozenRange = new asc_Range(0, 0, cFrozen, rFrozen);
                    this.cleanSelection(oFrozenRange, true);
                }
                if (0 <= cFrozen) {
                    oFrozenRange = new asc_Range(0, this.visibleRange.r1, cFrozen, this.visibleRange.r2);
                    this.cleanSelection(oFrozenRange, true);
                }
                if (0 <= rFrozen) {
                    oFrozenRange = new asc_Range(this.visibleRange.c1, 0, this.visibleRange.c2, rFrozen);
                    this.cleanSelection(oFrozenRange, true);
                }
            }
        }
        if (isFrozen) {
            if (range.c1 !== this.visibleRange.c1) {
                diffWidth = 0;
            }
            if (range.r1 !== this.visibleRange.r1) {
                diffHeight = 0;
            }
            offsetX = this._getColLeft(range.c1) - this.cellsLeft - diffWidth;
            offsetY = this._getRowTop(range.r1) - this.cellsTop - diffHeight;
        } else {
            offsetX = this._getColLeft(this.visibleRange.c1) - this.cellsLeft - diffWidth;
            offsetY = this._getRowTop(this.visibleRange.r1) - this.cellsTop - diffHeight;
        }

        this._activateOverlayCtx();
        var t = this;
        this.model.selectionRange.ranges.forEach(function (item) {
            var arnIntersection = item.intersectionSimple(range);
            if (arnIntersection) {
                _x1 = t._getColLeft(arnIntersection.c1) - offsetX - 2;
                _x2 = t._getColLeft(arnIntersection.c2 + 1) - offsetX +
                  1 + /* Это ширина "квадрата" для автофильтра от границы ячейки */2;
                _y1 = t._getRowTop(arnIntersection.r1) - offsetY - 2;
                _y2 = t._getRowTop(arnIntersection.r2 + 1) - offsetY +
                  1 + /* Это высота "квадрата" для автофильтра от границы ячейки */2;

                x1 = Math.min(x1, _x1);
                x2 = Math.max(x2, _x2);
                y1 = Math.min(y1, _y1);
                y2 = Math.max(y2, _y2);
            }

            if (!isFrozen) {
                t._cleanColumnHeaders(item.c1, item.c2);
                t._cleanRowHeaders(item.r1, item.r2);
            }
        });
        this._deactivateOverlayCtx();

        // Если есть активное автозаполнения, то нужно его тоже очистить
        if (this.activeFillHandle !== null) {
            var activeFillClone = this.activeFillHandle.clone(true);

            // Координаты для автозаполнения
            _x1 = this._getColLeft(activeFillClone.c1) - offsetX - 2;
            _x2 = this._getColLeft(activeFillClone.c2 + 1) - offsetX + 1 + 2;
            _y1 = this._getRowTop(activeFillClone.r1) - offsetY - 2;
            _y2 = this._getRowTop(activeFillClone.r2 + 1) - offsetY + 1 + 2;

            // Выбираем наибольший range для очистки
            x1 = Math.min(x1, _x1);
            x2 = Math.max(x2, _x2);
            y1 = Math.min(y1, _y1);
            y2 = Math.max(y2, _y2);
        }

        if (this.collaborativeEditing.getCollaborativeEditing()) {
            var currentSheetId = this.model.getId();

            var nLockAllType = this.collaborativeEditing.isLockAllOther(currentSheetId);
            if (Asc.c_oAscMouseMoveLockedObjectType.None !== nLockAllType) {
                this.overlayCtx.clear();
            } else {
                var arrayElementsMe = this.collaborativeEditing.getLockCellsMe(currentSheetId);
                var arrayElementsOther = this.collaborativeEditing.getLockCellsOther(currentSheetId);
                var arrayElements = arrayElementsMe.concat(arrayElementsOther);
                arrayElements =
                  arrayElements.concat(this.collaborativeEditing.getArrayInsertColumnsBySheetId(currentSheetId));
                arrayElements =
                  arrayElements.concat(this.collaborativeEditing.getArrayInsertRowsBySheetId(currentSheetId));

                for (i = 0; i < arrayElements.length; ++i) {
                    var arFormulaTmp = new asc_Range(arrayElements[i].c1, arrayElements[i].r1, arrayElements[i].c2, arrayElements[i].r2);

                    var aFormulaIntersection = arFormulaTmp.intersection(range);
                    if (aFormulaIntersection) {
                        // Координаты для автозаполнения
                        _x1 = this._getColLeft(aFormulaIntersection.c1) - offsetX - 2;
                        _x2 = this._getColLeft(aFormulaIntersection.c2 + 1) - offsetX + 1 + 2;
                        _y1 = this._getRowTop(aFormulaIntersection.r1) - offsetY - 2;
                        _y2 = this._getRowTop(aFormulaIntersection.r2 + 1) - offsetY + 1 + 2;

                        // Выбираем наибольший range для очистки
                        x1 = Math.min(x1, _x1);
                        x2 = Math.max(x2, _x2);
                        y1 = Math.min(y1, _y1);
                        y2 = Math.max(y2, _y2);
                    }
                }
            }
        }

		//TODO пересмотреть! возможно стоит очищать частями в зависимости от print_area
		//print lines view
		if(this.viewPrintLines || this.cutRange) {
			this.overlayCtx.clear();
		}
		if(pageBreakPreviewModeOverlay) {
			this.overlayCtx.clear();
		}

        for (i = 0; i < this.arrActiveFormulaRanges.length; ++i) {
            this.arrActiveFormulaRanges[i].ranges.forEach(function (item) {
                var arnIntersection = item.intersectionSimple(range);
                if (arnIntersection) {
                    _x1 = t._getColLeft(arnIntersection.c1) - offsetX - 3;
                    _x2 = arnIntersection.c2 > t.nColsCount ? width : t._getColLeft(arnIntersection.c2 + 1) - offsetX + 1 + 2;
                    _y1 = t._getRowTop(arnIntersection.r1) - offsetY - 3;
                    _y2 = arnIntersection.r2 > t.nRowsCount ? height : t._getRowTop(arnIntersection.r2 + 1) - offsetY + 1 + 2;

                    x1 = Math.min(x1, _x1);
                    x2 = Math.max(x2, _x2);
                    y1 = Math.min(y1, _y1);
                    y2 = Math.max(y2, _y2);
                }
            });
        }
        for (i = 0; i < this.arrActiveChartRanges.length; ++i) {
            this.arrActiveChartRanges[i].ranges.forEach(function (item) {
                var arnIntersection = item.intersectionSimple(range);
                if (arnIntersection) {
                    _x1 = t._getColLeft(arnIntersection.c1) - offsetX - 3;
                    _x2 = arnIntersection.c2 > t.nColsCount ? width : t._getColLeft(arnIntersection.c2 + 1) - offsetX + 1 + 2;
                    _y1 = t._getRowTop(arnIntersection.r1) - offsetY - 3;
                    _y2 = arnIntersection.r2 > t.nRowsCount ? height : t._getRowTop(arnIntersection.r2 + 1) - offsetY + 1 + 2;

                    x1 = Math.min(x1, _x1);
                    x2 = Math.max(x2, _x2);
                    y1 = Math.min(y1, _y1);
                    y2 = Math.max(y2, _y2);
                }
            });
        }

        if (null !== this.activeMoveRange) {
			var arnIntersection = this.activeMoveRange.intersectionSimple(range);
			if (arnIntersection) {
				// Координаты для перемещения диапазона
				_x1 = this._getColLeft(arnIntersection.c1) - offsetX - 2;
				_x2 = this._getColLeft(arnIntersection.c2 + 1) - offsetX + 1 + 2;
				_y1 = this._getRowTop(arnIntersection.r1) - offsetY - 2;
				_y2 = this._getRowTop(arnIntersection.r2 + 1) - offsetY + 1 + 2;

				// Выбираем наибольший range для очистки
				x1 = Math.min(x1, _x1);
				x2 = Math.max(x2, _x2);
				y1 = Math.min(y1, _y1);
				y2 = Math.max(y2, _y2);
			}
        }

        if (null !== this.copyActiveRange) {
            this.copyActiveRange.ranges.forEach(function (item) {
                var arnIntersection = item.intersectionSimple(range);
                if (arnIntersection) {
                    _x1 = t._getColLeft(arnIntersection.c1) - offsetX - 2;
                    _x2 = t._getColLeft(arnIntersection.c2 + 1) - offsetX + 1 + /* Это ширина "квадрата" для автофильтра от границы ячейки */2;
                    _y1 = t._getRowTop(arnIntersection.r1) - offsetY - 2;
                    _y2 = t._getRowTop(arnIntersection.r2 + 1) - offsetY + 1 + /* Это высота "квадрата" для автофильтра от границы ячейки */2;

                    x1 = Math.min(x1, _x1);
                    x2 = Math.max(x2, _x2);
                    y1 = Math.min(y1, _y1);
                    y2 = Math.max(y2, _y2);
                }
            });
        }

        if (!(Number.MAX_VALUE === x1 && -Number.MAX_VALUE === x2 && Number.MAX_VALUE === y1 &&
          -Number.MAX_VALUE === y2)) {
            ctx.save()
              .beginPath()
              .rect(this.cellsLeft, this.cellsTop, ctx.getWidth() - this.cellsLeft, ctx.getHeight() - this.cellsTop)
              .clip()
              .clearRect(x1, y1, x2 - x1, y2 - y1)
              .restore();
        }
        return this;
    };

    WorksheetView.prototype.updateSelection = function () {
        this.cleanSelection();
        this._drawSelection();
    };
	WorksheetView.prototype.updateSelectionWithSparklines = function () {
		if (!this.checkSelectionSparkline()) {
			this._drawSelection();
		}
	};

    // mouseX - это разница стартовых координат от мыши при нажатии и границы
    WorksheetView.prototype.drawColumnGuides = function ( col, x, y, mouseX ) {
        // Учитываем координаты точки, где мы начали изменение размера
        x += mouseX;

        var ctx = this.overlayCtx;
        var offsetX = this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
        var offsetFrozen = this.getFrozenPaneOffset( false, true );
        offsetX -= offsetFrozen.offsetX;

        var x1 = this._getColLeft(col) - offsetX - gridlineSize;
        var h = ctx.getHeight();
        var width = Asc.round((x - x1) / this.getZoom());
        if ( 0 > width ) {
            width = 0;
        }

        ctx.clear();
        this._drawSelection();
        ctx.setFillPattern( this.settings.ptrnLineDotted1 )
            .fillRect( x1, 0, 1, h )
            .fillRect( x, 0, 1, h );

        return new asc_CMM( {
            type      : Asc.c_oAscMouseMoveType.ResizeColumn,
            sizeCCOrPt: this.model.colWidthToCharCount(width),
            sizePx    : width,
            x         : AscCommon.AscBrowser.convertToRetinaValue(x1 + this._getColumnWidth(col)),
            y         : AscCommon.AscBrowser.convertToRetinaValue(this.cellsTop)
        } );
    };

    // mouseY - это разница стартовых координат от мыши при нажатии и границы
    WorksheetView.prototype.drawRowGuides = function ( row, x, y, mouseY ) {
        // Учитываем координаты точки, где мы начали изменение размера
        y += mouseY;

        var ctx = this.overlayCtx;
        var offsetY = this._getRowTop(this.visibleRange.r1) - this.cellsTop;
        var offsetFrozen = this.getFrozenPaneOffset( true, false );
        offsetY -= offsetFrozen.offsetY;

        var y1 = this._getRowTop(row) - offsetY - gridlineSize;
        var w = ctx.getWidth();
        var height = Asc.round((y - y1) / this.getZoom());
        if ( 0 > height ) {
            height = 0;
        }

        ctx.clear();
        this._drawSelection();
        ctx.setFillPattern( this.settings.ptrnLineDotted1 )
            .fillRect( 0, y1, w, 1 )
            .fillRect( 0, y, w, 1 );

        return new asc_CMM( {
            type      : Asc.c_oAscMouseMoveType.ResizeRow,
            sizeCCOrPt: AscCommonExcel.convertPxToPt(height),
            sizePx    : height,
            x         : AscCommon.AscBrowser.convertToRetinaValue(this.cellsLeft),
            y         : AscCommon.AscBrowser.convertToRetinaValue(y1 + this._getRowHeight(row))
        } );
    };

    // --- Cache ---
    WorksheetView.prototype._cleanCache = function (range) {
		var s = this.cache.sectors;
		var rows = this.cache.rows;

        if (range === undefined) {
            range = this.model.selectionRange.getLast();
        }

        // ToDo now delete all. Change this code
		for (var i = Asc.floor(range.r1 / kRowsCacheSize), l = Asc.floor(range.r2 / kRowsCacheSize); i <= l; ++i) {
			if (s[i]) {
				for (var j = i * kRowsCacheSize, k = (i + 1) * kRowsCacheSize; j < k; ++j) {
					delete rows[j];
				}
				delete s[i];
			}
		}
    };


    // ----- Cell text cache -----

    /** Очищает кэш метрик текста ячеек */
    WorksheetView.prototype._cleanCellsTextMetricsCache = function () {
        this.cache.sectors = [];
    };

    /**
     * Обновляет общий кэш и кэширует метрики текста ячеек для указанного диапазона
     * @param {Asc.Range} [range]  Диапазон кэширования текта
     */
    WorksheetView.prototype._prepareCellTextMetricsCache = function (range) {
        var firstUpdateRow = null;
        if (!range) {
            range = this.visibleRange;
            if (this.topLeftFrozenCell) {
                var row = this.topLeftFrozenCell.getRow0();
                var col = this.topLeftFrozenCell.getCol0();
                if (0 < row && 0 < col) {
                    firstUpdateRow = asc.getMinValueOrNull(firstUpdateRow,
                      this._prepareCellTextMetricsCache2(new Asc.Range(0, 0, col - 1, row - 1)));
                }
                if (0 < row) {
                    firstUpdateRow = asc.getMinValueOrNull(firstUpdateRow, this._prepareCellTextMetricsCache2(
                      new Asc.Range(this.visibleRange.c1, 0, this.visibleRange.c2, row - 1)));
                }
                if (0 < col) {
                    firstUpdateRow = asc.getMinValueOrNull(firstUpdateRow, this._prepareCellTextMetricsCache2(
                      new Asc.Range(0, this.visibleRange.r1, col - 1, this.visibleRange.r2)));
                }
            }
        }

        firstUpdateRow = asc.getMinValueOrNull(firstUpdateRow, this._prepareCellTextMetricsCache2(range));
        if (null !== firstUpdateRow || this.isChanged) {
            // Убрал это из _calcCellsTextMetrics, т.к. вызов был для каждого сектора(добавляло тормоза: баг 20388)
            // Код нужен для бага http://bugzilla.onlyoffice.com/show_bug.cgi?id=13875
            this._updateRowPositions();
            this._calcVisibleRows();

            if (this.objectRender) {
                this.objectRender.updateSizeDrawingObjects({target: c_oTargetType.RowResize, row: firstUpdateRow},
                  true);
            }
        }
    };

    /**
     * Обновляет общий кэш и кэширует метрики текста ячеек для указанного диапазона (сама реализация, напрямую не вызывать, только из _prepareCellTextMetricsCache)
     * @param {Asc.Range} [range]  Диапазон кэширования текта
     */
    WorksheetView.prototype._prepareCellTextMetricsCache2 = function (range) {
        var firstUpdateRow = null;
        var s = this.cache.sectors;
        for (var i = Asc.floor(range.r1 / kRowsCacheSize), l = Asc.floor(range.r2 / kRowsCacheSize); i <= l; ++i) {
        	if (!s[i]) {
        		if (null === firstUpdateRow) {
					firstUpdateRow = i * kRowsCacheSize;
				}
				s[i] = true;
				this._calcCellsTextMetrics(new Asc.Range(0, i * kRowsCacheSize, this.cols.length - 1, (i + 1) * kRowsCacheSize - 1));
			}
		}
        return firstUpdateRow;
    };

    /**
     * Кэширует метрики текста для диапазона ячеек
     * @param {Asc.Range} range  description
     */
    WorksheetView.prototype._calcCellsTextMetrics = function (range) {
        var t = this;
		this.model.getRange3(range.r1, 0, range.r2, range.c2)._foreachNoEmpty(function(cell, row, col) {
			t._addCellTextToCache(col, row);
		}, null, true);
        this.isChanged = false;
    };

    WorksheetView.prototype._fetchRowCache = function (row) {
		return (this.cache.rows[row] = (this.cache.rows[row] || new CacheElement()));
	};

    WorksheetView.prototype._fetchCellCache = function (col, row) {
		var r = this._fetchRowCache(row);
		return (r.columns[col] = (r.columns[col] || new CacheElementText()));
	};

    WorksheetView.prototype._fetchCellCacheText = function (col, row) {
		var r = this._fetchRowCache(row);
		return (r.columnsWithText[col] = (r.columnsWithText[col] || true));
	};

    WorksheetView.prototype._getRowCache = function (row) {
        return this.cache.rows[row];
    };

    WorksheetView.prototype._getCellCache = function (col, row) {
        var r = this.cache.rows[row];
		return r && r.columnsWithText[col] && r.columns[col];
    };

    WorksheetView.prototype._getCellTextCache = function (col, row, dontLookupMergedCells) {
        var c = this._getCellCache(col, row);
        if (c) {
            return c;
        } else if (!dontLookupMergedCells) {
            // ToDo проверить это условие, возможно оно избыточно
            var range = this.model.getMergedByCell(row, col);
            return null !== range ? this._getCellTextCache(range.c1, range.r1, true) : undefined;
        }
        return undefined;
    };

    WorksheetView.prototype._changeColWidth = function (col, width) {
		var oldColWidth = this.getColumnWidthInSymbols(col);
        var pad = this.settings.cells.padding * 2 + 1;
        var cc = Math.min(this.model.colWidthToCharCount(width + pad), Asc.c_oAscMaxColumnWidth);

        if (cc > oldColWidth) {
            History.Create_NewPoint();
            History.StartTransaction();
            // Выставляем, что это bestFit
            this.model.setColBestFit(true, this.model.charCountToModelColWidth(cc), col, col);
            History.EndTransaction();

			// ToDo refactoring this!!!
			this._calcWidthColumns(AscCommonExcel.recalcType.recalc);
            this.isChanged = true;
        }
    };

    WorksheetView.prototype._addCellTextToCache = function (col, row) {
        var self = this;

        function makeFnIsGoodNumFormat(flags, width) {
            return function (str) {
                return self.stringRender.measureString(str, flags, width).width <= width;
            };
        }

        var c = this._getCell(col, row);
        if (null === c) {
            return col;
        }

        var str, tm, strCopy;

        // Range для замерженной ячейки
        var fl = this._getCellFlags(c);
        var mc = fl.merged;
        if (null !== mc) {
            if (col !== mc.c1 || row !== mc.r1) {
                // Проверим внесена ли первая ячейка в cache (иначе если была скрыта первая строка или первый столбец, то мы не внесем)
                if (undefined === this._getCellTextCache(mc.c1, mc.r1, true)) {
                    return this._addCellTextToCache(mc.c1, mc.r1);
                }
				// skip other merged cell from range
                return mc.c2;
            }
        }
		var mergeType = fl.getMergeType();
        var align = c.getAlign();
        var angle = align.getAngle();
        var va = align.getAlignVertical();
        if (c.isEmptyTextString()) {
            if (!angle && c.isNotDefaultFont() && !(mergeType & c_oAscMergeType.rows)) {
                // Пустая ячейка с измененной гарнитурой или размером, учитвается в высоте
                str = c.getValue2();
                if (0 < str.length) {
                    strCopy = str[0];
                    if (!(tm = AscCommonExcel.g_oCacheMeasureEmpty.get(strCopy.format))) {
                        // Без текста не будет толка
                        strCopy = strCopy.clone();
                        strCopy.text = 'A';
                        tm = this._roundTextMetrics(this.stringRender.measureString([strCopy], fl));
                        AscCommonExcel.g_oCacheMeasureEmpty.add(strCopy.format, tm);
                    }
					cache = this._fetchCellCache(col, row);
					cache.metrics = tm;
                    this._updateRowHeight(cache, row);
                }
            }

            return mc ? mc.c2 : col;
        }

        var dDigitsCount = 0;
        var colWidth = 0;
        var cellType = c.getType();
        fl.isNumberFormat = (null === cellType || CellValueType.String !== cellType); // Автоподбор делается по любому типу (кроме строки)
        var numFormatStr = c.getNumFormatStr();
        var pad = this.settings.cells.padding * 2 + 1;
        var sstr, sfl, stm;
        var isCustomWidth = this.model.getColCustomWidth(col);

        if (!isCustomWidth && fl.isNumberFormat && !(mergeType & c_oAscMergeType.cols) &&
          (c_oAscCanChangeColWidth.numbers === this.canChangeColWidth ||
          c_oAscCanChangeColWidth.all === this.canChangeColWidth)) {
            colWidth = this._getColumnWidthInner(col);
            // Измеряем целую часть числа
            sstr = c.getValue2(gc_nMaxDigCountView, function () {
                return true;
            });
            if ("General" === numFormatStr && c_oAscCanChangeColWidth.all !== this.canChangeColWidth) {
				sstr = AscCommonExcel.dropDecimalAutofit(sstr);
            }
            sfl = fl.clone();
            sfl.wrapText = false;
            stm = this._roundTextMetrics(this.stringRender.measureString(sstr, sfl, colWidth));
            // Если целая часть числа не убирается в ячейку, то расширяем столбец
            if (stm.width > colWidth) {
                this._changeColWidth(col, stm.width);
            }
            // Обновленная ячейка
            dDigitsCount = this.getColumnWidthInSymbols(col);
            colWidth = this._getColumnWidthInner(col);
        } else if (null === mc) {
            // Обычная ячейка
            dDigitsCount = this.getColumnWidthInSymbols(col);
            colWidth = this._getColumnWidthInner(col);
            // подбираем ширину
            if (!isCustomWidth && !(mergeType & c_oAscMergeType.cols) && !fl.wrapText &&
              c_oAscCanChangeColWidth.all === this.canChangeColWidth) {
                sstr = c.getValue2(gc_nMaxDigCountView, function () {
                    return true;
                });
                stm = this._roundTextMetrics(this.stringRender.measureString(sstr, fl, colWidth));
                if (stm.width > colWidth) {
                    this._changeColWidth(col, stm.width);
                    // Обновленная ячейка
                    dDigitsCount = this.getColumnWidthInSymbols(col);
                    colWidth = this._getColumnWidthInner(col);
                }
            }
        } else {
            // Замерженная ячейка, нужна сумма столбцов
            for (var i = mc.c1; i <= mc.c2 && i < this.cols.length; ++i) {
                colWidth += this._getColumnWidth(i);
                dDigitsCount += this.getColumnWidthInSymbols(i);
            }
            colWidth -= pad;
        }

        var rowHeight = this._getRowHeight(row);

        // ToDo dDigitsCount нужно рассчитывать исходя не из дефалтового шрифта и размера, а исходя из текущего шрифта и размера ячейки
        str = c.getValue2(dDigitsCount, makeFnIsGoodNumFormat(fl, colWidth));
        var ha = c.getAlignHorizontalByValue(align.getAlignHorizontal());
        var maxW = fl.wrapText || fl.shrinkToFit || mergeType || asc.isFixedWidthCell(str) ?
          this._calcMaxWidth(col, row, mc) : undefined;
        tm = this._roundTextMetrics(this.stringRender.measureString(str, fl, maxW));
        var cto = (mergeType || fl.wrapText || fl.shrinkToFit) ? {
            maxWidth: maxW - this._getColumnWidthInner(col) + this._getColumnWidth(col), leftSide: 0, rightSide: 0
        } : this._calcCellTextOffset(col, row, ha, tm.width);

        var textBound = {};
        if (angle) {
            //  повернутый текст учитывает мерж ячеек по строкам
            if (mergeType & c_oAscMergeType.rows) {
                rowHeight = 0;

                for (var j = mc.r1; j <= mc.r2 && j < this.nRowsCount; ++j) {
                    rowHeight += this._getRowHeight(j);
                }
            }

            var textW = tm.width;
            if (fl.wrapText) {

                if (this.model.getRowCustomHeight(row)) {
                    tm = this._roundTextMetrics(this.stringRender.measureString(str, fl, rowHeight));
                    textBound =
                      this.stringRender.getTransformBound(angle, colWidth, rowHeight, tm.width, ha, va, rowHeight);
                } else {

                    if (!(mergeType & c_oAscMergeType.rows)) {
                        rowHeight = tm.height;
                    }
                    tm = this._roundTextMetrics(this.stringRender.measureString(str, fl, rowHeight));
                    textBound =
                      this.stringRender.getTransformBound(angle, colWidth, rowHeight, tm.width, ha, va, tm.width);
                }
            } else {
                textBound = this.stringRender.getTransformBound(angle, colWidth, rowHeight, textW, ha, va, maxW);
            }

//  NOTE: если проекция строчки на Y больше высоты ячейки подставлять # и рисовать все по центру

//                    if (fl.isNumberFormat) {
//                        var prj = Math.abs(Math.sin(angle * Math.PI / 180.0) * tm.width);
//                        if (prj > rowHeight) {
//                            //if (maxW === undefined) {}
//                            maxW = rowHeight / Math.abs(Math.cos(angle * Math.PI / 180.0));
//                            str  =  c.getValue2(gc_nMaxDigCountView, makeFnIsGoodNumFormat(fl, maxW));
//
//                            for (i = 0; i < str.length; ++i) {
//                                var f = str[i].format;
//                                if (f) f.repeat = true;
//                            }
//
//                            tm   =  this._roundTextMetrics(this.stringRender.measureString(str, fl, maxW));
//                        }
//                    }
        }

        var cache = this._fetchCellCache(col, row);
		cache.state = this.stringRender.getInternalState();
		cache.flags = fl;
		cache.metrics = tm;
		cache.cellW = cto.maxWidth;
		cache.cellHA = ha;
		cache.cellVA = va;
		cache.sideL = cto.leftSide;
		cache.sideR = cto.rightSide;
		cache.cellType = cellType;
		cache.isFormula = c.isFormula();
		cache.angle = angle;
		cache.textBound = textBound;

        this._fetchCellCacheText(col, row);

        if (!angle && (cto.leftSide !== 0 || cto.rightSide !== 0)) {
            this._addErasedBordersToCache(col - cto.leftSide, col + cto.rightSide, row);
        }

        this._updateRowHeight(cache, row, maxW, colWidth);

        return mc ? mc.c2 : col;
    };

    WorksheetView.prototype._updateRowHeight2 = function (cell) {
    	var fr, fm, lm, f;
		var align = cell.getAlign();
		var angle = align.getAngle();
		var va = align.getAlignVertical();
		var rowInfo = this.rows[cell.nRow];
		var updateDescender = (va === Asc.c_oAscVAlign.Bottom && !angle);
		var d = this._getRowDescender(cell.nRow);
		if (cell.getValueMultiText()) {
			fr = cell.getValue2();
		} else {
			fr = [new AscCommonExcel.Fragment()];
			fr[0].format = cell.getFont();
		}

		var th;
		var cellType = cell.getType();
		// Автоподбор делается по любому типу (кроме строки)
		var isNumberFormat = !cell.isEmptyTextString() && (null === cellType || CellValueType.String !== cellType);
		if (angle || isNumberFormat || align.getWrap()) {
			this._addCellTextToCache(cell.nCol, cell.nRow);
			th = this.updateRowHeightValuePx || AscCommonExcel.convertPtToPx(this._getRowHeightReal(cell.nRow));
		} else {
			th = this.updateRowHeightValuePx || AscCommonExcel.convertPtToPx(this._getRowHeightReal(cell.nRow));
			// ToDo with angle and wrap
			for (var i = 0; i < fr.length; ++i) {
				f = fr[i].format;
				if (!f.isEqual2(AscCommonExcel.g_oDefaultFormat.Font) || f.va) {
					fm = getFontMetrics(f, this.stringRender);
					lm = this.stringRender._calcLineMetrics2(f.getSize(), f.va, fm);
					th = Math.min(this.maxRowHeightPx, Math.max(th, lm.th + 1));
					if (updateDescender && !f.va) {
						d = Math.max(d, lm.th - lm.bl);
					}
				}
			}
		}

		rowInfo.height = Asc.round(th * this.getZoom());
		rowInfo.descender = d;
		return th;
	};
	WorksheetView.prototype._updateRowHeight = function (cache, row, maxW, colWidth) {
	    if (this.skipUpdateRowHeight) {
	        return;
        }
	    var res = null;
		var mergeType = cache.flags && cache.flags.getMergeType();
		var isMergedRows = (mergeType & c_oAscMergeType.rows) || (mergeType && cache.flags.wrapText);
		var tm = cache.metrics;
		var va = cache.cellVA;
		var textBound = cache.textBound;
		var rowInfo = this.rows[row];
		// update row's descender
		if (va !== Asc.c_oAscVAlign.Top && va !== Asc.c_oAscVAlign.Center && !mergeType && !cache.angle) {
			// ToDo move descender in model
			var newDescender = tm.height - tm.baseline - 1;
			if (newDescender > this._getRowDescender(row)) {
				rowInfo.descender = newDescender;
			}
		}

		var isCustomHeight = this.model.getRowCustomHeight(row);
		// update row's height
		// Замерженная ячейка (с 2-мя или более строками) не влияет на высоту строк!
		if (!isCustomHeight && !(window["NATIVE_EDITOR_ENJINE"] && this.notUpdateRowHeight) && !isMergedRows) {
			var newHeight = tm.height;
			var oldHeight = this.updateRowHeightValuePx || AscCommonExcel.convertPtToPx(this._getRowHeightReal(row));
			if (cache.angle && textBound) {
				newHeight = Math.max(oldHeight, textBound.height);
			}

			newHeight = Math.min(this.maxRowHeightPx, Math.max(oldHeight, newHeight));
			if (newHeight !== oldHeight) {
				if (this.updateRowHeightValuePx) {
					this.updateRowHeightValuePx = newHeight;
				}
				rowInfo.height = Asc.round(newHeight * this.getZoom());
				History.TurnOff();
				res = newHeight;
				var oldExcludeCollapsed = this.model.bExcludeCollapsed;
				this.model.bExcludeCollapsed = true;
				// ToDo delete setRowHeight here
				this.model.setRowHeight(AscCommonExcel.convertPxToPt(newHeight), row, row, false);
				this.model.bExcludeCollapsed = oldExcludeCollapsed;
				History.TurnOn();

				if (cache.angle) {
					if (cache.flags.wrapText && !isCustomHeight) {
						maxW = tm.width;
					}

					cache.textBound = this.stringRender.getTransformBound(cache.angle, colWidth, rowInfo.height, tm.width,
						cache.cellHA, va, maxW);
				}

				this.isChanged = true;
			}
		}
		return res;
	};

	WorksheetView.prototype._updateRowsHeight = function () {
	    if (0 === this.arrRecalcRangesWithHeight.length) {
	        return null;
        }
	    var canChangeColWidth = this.canChangeColWidth;
	    var t = this;
        var duplicate = {};
		var range, cache, row, minRow = gc_nMaxRow0;
		for (var i = 0; i < this.arrRecalcRangesWithHeight.length; ++i) {
		    range = this.arrRecalcRangesWithHeight[i];
			this.canChangeColWidth = this.arrRecalcRangesCanChangeColWidth[i];

			this.model.getRowIterator(range.r1, 0, gc_nMaxCol0, function(itRow) {
				for (var r = range.r1; r <= range.r2 && r < t.rows.length; duplicate[r++] = 1) {
					if (duplicate[r]) {
						continue;
					}
					if (t.model.getRowCustomHeight(r)) {
						t._calcHeightRow(0, r);
						continue;
					}

					t.updateRowHeightValuePx = t.defaultRowHeightPx;
					row = t.rows[r];
					row.height = Asc.round(t.defaultRowHeightPx * t.getZoom());
					row.descender = t.defaultRowDescender;

					cache = t._getRowCache(r);

					itRow.setRow(r);
					var cell;
					while (cell = itRow.next()) {
						if (c_oAscMergeType.rows & getMergeType(t.model.getMergedByCell(cell.nRow, cell.nCol))) {
							continue;
						}
						t.updateRowHeightValuePx = (cache && cache[cell.nCol] ? t._updateRowHeight(cache[cell.nCol], r)
							: t._updateRowHeight2(cell)) || t.updateRowHeightValuePx;
					}

					if (t.updateRowHeightValuePx) {
						History.TurnOff();
						var oldExcludeCollapsed = t.model.bExcludeCollapsed;
						t.model.bExcludeCollapsed = true;
						t.model.setRowHeight(AscCommonExcel.convertPxToPt(t.updateRowHeightValuePx), r, r, false);
						t.model.bExcludeCollapsed = oldExcludeCollapsed;
						History.TurnOn();
					}

					minRow = Math.min(minRow, range.r1);
				}
			});
        }
		this.updateRowHeightValuePx = null;
		this.arrRecalcRangesWithHeight = [];
		this.arrRecalcRangesCanChangeColWidth = [];
		this.canChangeColWidth = canChangeColWidth;

		this._updateRowPositions();
		return minRow;
	};

    WorksheetView.prototype._calcMaxWidth = function (col, row, mc) {
        if (null === mc) {
            return this._getColumnWidthInner(col);
        }
        return this._getColumnWidthInner(mc.c1) + (this._getColLeft(mc.c2 + 1) - this._getColLeft(mc.c1 + 1));
    };

    WorksheetView.prototype._calcCellTextOffset = function (col, row, textAlign, textWidth) {
		var ls = 0, rs = 0, i, size;
        var width = this._getColumnWidth(col);
		textWidth = textWidth + this.settings.cells.padding;
		if (textAlign === AscCommon.align_Center) {
			textWidth /= 2;
			width /= 2;
		}

		var maxWidth = 0;
		if (textAlign !== AscCommon.align_Left) {
			size = width;
			for (i = col - 1; i >= 0 && this._isCellEmptyOrMerged(i, row); --i) {
				if (textWidth <= size) {
					break;
				}
				size += this._getColumnWidth(i);
			}
			ls = Math.max(col - i - 1, 0);
			maxWidth += size;
		}
		if (textAlign !== AscCommon.align_Right) {
			size = width;
			for (i = col + 1; i < gc_nMaxCol && this._isCellEmptyOrMerged(i, row); ++i) {
				if (textWidth <= size) {
					break;
				}
				size += this._getColumnWidth(i);
			}
			rs = Math.max(i - col - 1, 0);
			maxWidth += size;
		}

        return {
            maxWidth: maxWidth, leftSide: ls, rightSide: rs
        };
    };

    WorksheetView.prototype._calcCellsWidth = function (colBeg, colEnd, row) {
        var inc = colBeg <= colEnd ? 1 : -1, res = [];
        for (var i = colBeg; (colEnd - i) * inc >= 0; i += inc) {
            if (i !== colBeg && !this._isCellEmptyOrMerged(i, row)) {
                break;
            }
            res.push(this._getColumnWidth(i));
            if (res.length > 1) {
                res[res.length - 1] += res[res.length - 2];
            }
        }
        return res;
    };

    // If this cell with overlap text return index of column
    WorksheetView.prototype._findOverlapCell = function (col, row) {
        var r = this._getRowCache(row);
        if (r) {
            for (var i in r.columnsWithText) {
                if (!r.columns[i] || 0 === this._getColumnWidth(i)) {
                    continue;
                }
                var ct = r.columns[i];
                if (!ct) {
                    continue;
                }
                i >>= 0;
                if (col === i) {
                	continue;
				}
                var lc = i - ct.sideL, rc = i + ct.sideR;
                if (col >= lc && col <= rc) {
                    return i;
                }
            }
        }
        return -1;
    };


    // ----- Merged cells cache -----

    WorksheetView.prototype._isMergedCells = function (range) {
        return range.isEqual(this.model.getMergedByCell(range.r1, range.c1));
    };

    // ----- Cell borders cache -----

    WorksheetView.prototype._addErasedBordersToCache = function (colBeg, colEnd, row) {
        var rc = this._fetchRowCache(row);
        for (var col = colBeg; col < colEnd; ++col) {
            rc.erased[col] = true;
        }
    };

    WorksheetView.prototype._isLeftBorderErased = function (col, rowCache) {
        return rowCache && rowCache.erased[col - 1] === true;
    };
    WorksheetView.prototype._isRightBorderErased = function (col, rowCache) {
        return rowCache && rowCache.erased[col] === true;
    };

    WorksheetView.prototype._calcMaxBorderWidth = function (b1, b2) {
        // ToDo пересмотреть
        return Math.max(b1 && b1.w, b2 && b2.w);
    };


    // ----- Cells utilities -----

    /**
     * Возвращает заголовок колонки по индексу
     * @param {Number} col  Индекс колонки
     * @return {String}
     */
    WorksheetView.prototype._getColumnTitle = function (col) {
		return AscCommonExcel.g_R1C1Mode ? this._getRowTitle(col) : AscCommon.g_oCellAddressUtils.colnumToColstrFromWsView(col + 1);
    };

    /**
     * Возвращает заголовок строки по индексу
     * @param {Number} row  Индекс строки
     * @return {String}
     */
    WorksheetView.prototype._getRowTitle = function (row) {
        return "" + (row + 1);
    };

    /**
     * Возвращает ячейку таблицы (из Worksheet)
     * @param {Number} col  Индекс колонки
     * @param {Number} row  Индекс строки
     * @return {Range}
     */
    WorksheetView.prototype._getCell = function (col, row) {
        if (col < 0 || col > gc_nMaxCol0 || row < 0 || row > this.gc_nMaxRow0) {
            return null;
        }

        return this.model.getCell3(row, col);
    };

    WorksheetView.prototype._getVisibleCell = function (col, row) {
        return this.model.getCell3(row, col);
    };

    WorksheetView.prototype._getCellFlags = function (col, row) {
        var c = row !== undefined ? this._getCell(col, row) : col;
        var fl = new CellFlags();
        if (null !== c) {
            var align = c.getAlign();
            fl.wrapText = align.getWrap();
            fl.shrinkToFit = fl.wrapText ? false : align.getShrinkToFit();
            fl.merged = c.hasMerged();
            fl.textAlign = c.getAlignHorizontalByValue(align.getAlignHorizontal());
        }
        return fl;
    };

    WorksheetView.prototype._isCellNullText = function (col, row) {
        var c = row !== undefined ? this._getCell(col, row) : col;
        return null === c || c.isNullText();
    };

    WorksheetView.prototype._isCellEmptyOrMerged = function (col, row) {
        var c = row !== undefined ? this._getCell(col, row) : col;
        return null === c || (c.isNullText() && null === c.hasMerged());
    };

    WorksheetView.prototype._getRange = function (c1, r1, c2, r2) {
        return this.model.getRange3(r1, c1, r2, c2);
    };

    WorksheetView.prototype._selectColumnsByRange = function () {
        var ar = this.model.selectionRange.getLast();
        var type = ar.getType();
        if (c_oAscSelectionType.RangeMax !== type) {
            this.cleanSelection();
            if (c_oAscSelectionType.RangeRow === type) {
                ar.assign(0, 0, gc_nMaxCol0, gc_nMaxRow0);
            } else {
                ar.assign(ar.c1, 0, ar.c2, gc_nMaxRow0);
            }

            this._drawSelection();
            this._updateSelectionNameAndInfo();
        }
    };

    WorksheetView.prototype._selectRowsByRange = function () {
        var ar = this.model.selectionRange.getLast();
		var type = ar.getType();
        if (c_oAscSelectionType.RangeMax !== type) {
            this.cleanSelection();

            if (c_oAscSelectionType.RangeCol === type) {
                ar.assign(0, 0, gc_nMaxCol0, gc_nMaxRow0);
            } else {
                ar.assign(0, ar.r1, gc_nMaxCol0, ar.r2);
            }

            this._drawSelection();
            this._updateSelectionNameAndInfo();
        }
    };

    /**
     * Возвращает true, если диапазон больше видимой области, и операции над ним могут привести к задержкам
     * @param {Asc.Range} range  Диапазон для проверки
     * @returns {Boolean}
     */
    WorksheetView.prototype._isLargeRange = function (range) {
        var vr = this.visibleRange;
        return range.c2 - range.c1 + 1 > (vr.c2 - vr.c1 + 1) * 3 || range.r2 - range.r1 + 1 > (vr.r2 - vr.r1 + 1) * 3;
    };

    WorksheetView.prototype.drawDepCells = function () {
        var ctx = this.overlayCtx, _cc = this.cellCommentator, c, node, that = this;

        ctx.clear();
        this._drawSelection();

        var color = new CColor(0, 0, 255);

        function draw_arrow(context, fromx, fromy, tox, toy) {
            var headlen = 9, showArrow = tox > that._getColLeft(0) && toy > that._getRowTop(0), dx = tox -
              fromx, dy = toy - fromy, tox = tox > that._getColLeft(0) ? tox : that._getColLeft(0), toy = toy >
            that._getRowTop(0) ? toy : that._getRowTop(0), angle = Math.atan2(dy, dx), _a = Math.PI / 18;

            // ToDo посмотреть на четкость moveTo, lineTo
            context.save()
              .setLineWidth(1)
              .beginPath()
              .lineDiag
              .moveTo(fromx, fromy)
              .lineTo(tox, toy);
            // .dashLine(fromx-.5, fromy-.5, tox-.5, toy-.5, 15, 5)
            if (showArrow) {
                context
                  .moveTo(tox - headlen * Math.cos(angle - _a),
                    toy - headlen * Math.sin(angle - _a))
                  .lineTo(tox, toy)
                  .lineTo(tox - headlen * Math.cos(angle + _a),
                    toy - headlen * Math.sin(angle + _a))
                  .lineTo(tox - headlen * Math.cos(angle - _a),
                    toy - headlen * Math.sin(angle - _a));
            }

            context
              .setStrokeStyle(color)
              .setFillStyle(color)
              .stroke()
              .fill()
              .closePath()
              .restore();
        }

        function gCM(_this, col, row) {
            var metrics = {top: 0, left: 0, width: 0, height: 0, result: false}; 	// px

            var fvr = _this.getFirstVisibleRow();
            var fvc = _this.getFirstVisibleCol();
            var mergedRange = _this.model.getMergedByCell(row, col);

            if (mergedRange && (fvc < mergedRange.c2) && (fvr < mergedRange.r2)) {
                var startCol = (mergedRange.c1 > fvc) ? mergedRange.c1 : fvc;
                var startRow = (mergedRange.r1 > fvr) ? mergedRange.r1 : fvr;

                metrics.top = _this._getRowTop(startRow) - _this._getRowTop(fvr) + _this._getRowTop(0);
                metrics.left = _this._getColLeft(startCol) - _this._getColLeft(fvc) + _this._getColLeft(0);

				metrics.width = _this._getColLeft(mergedRange.c2 + 1) - _this._getColLeft(startCol);
				metrics.height = _this._getRowHeight(mergedRange.r2 + 1) - _this._getRowHeight(startRow);
            } else {
                metrics.top = _this._getRowTop(row) - _this._getRowTop(fvr) + _this._getRowTop(0);
                metrics.left = _this._getColLeft(col) - _this._getColLeft(fvc) + _this._getColLeft(0);
                metrics.width = _this._getColumnWidth(col);
                metrics.height = _this._getRowHeight(row);
            }
			metrics.result = true;

            return metrics;
        }

        for (var id in this.depDrawCells) {
            c = this.depDrawCells[id].from;
            node = this.depDrawCells[id].to;
            var mainCellMetrics = gCM(this, c.nCol, c.nRow), nodeCellMetrics, _t1, _t2;
            for (var id in node) {
                if (!node[id].isArea) {
                    _t1 = gCM(this, node[id].returnCell().nCol, node[id].returnCell().nRow)
                    nodeCellMetrics = {
                        t: _t1.top,
                        l: _t1.left,
                        w: _t1.width,
                        h: _t1.height,
                        apt: _t1.top + _t1.height / 2,
                        apl: _t1.left + _t1.width / 4
                    };
                } else {
                    var _t1 = gCM(this, node[id].getBBox0().c1, node[id].getBBox0().r1), _t2 = gCM(this, node[id].getBBox0().c2,
                        node[id].getBBox0().r2);

                    nodeCellMetrics = {
                        t: _t1.top,
                        l: _t1.left,
                        w: _t2.left + _t2.width - _t1.left,
                        h: _t2.top + _t2.height - _t1.top,
                        apt: _t1.top + _t1.height / 2,
                        apl: _t1.left + _t1.width / 4
                    };
                }

                var x1 = Math.floor(nodeCellMetrics.apl), y1 = Math.floor(nodeCellMetrics.apt), x2 = Math.floor(
                  mainCellMetrics.left + mainCellMetrics.width / 4), y2 = Math.floor(
                  mainCellMetrics.top + mainCellMetrics.height / 2);

                if (x1 < 0 && x2 < 0 || y1 < 0 && y2 < 0) {
                    continue;
                }

                if (y1 < this._getRowTop(0)) {
                    y1 -= this._getRowTop(0);
                }

                if (y1 < 0 && y2 > 0) {
                    var _x1 = Math.floor(Math.sqrt((x1 - x2) * (x1 - x2) * y1 * y1 / ((y2 - y1) * (y2 - y1))));
                    // x1 -= (x1-x2>0?1:-1)*_x1;
                    if (x1 > x2) {
                        x1 -= _x1;
                    } else if (x1 < x2) {
                        x1 += _x1;
                    }
                } else if (y1 > 0 && y2 < 0) {
                    var _x2 = Math.floor(Math.sqrt((x1 - x2) * (x1 - x2) * y2 * y2 / ((y2 - y1) * (y2 - y1))));
                    // x2 -= (x2-x1>0?1:-1)*_x2;
                    if (x2 > x1) {
                        x2 -= _x2;
                    } else if (x2 < x1) {
                        x2 += _x2;
                    }
                }

                if (x1 < 0 && x2 > 0) {
                    var _y1 = Math.floor(Math.sqrt((y1 - y2) * (y1 - y2) * x1 * x1 / ((x2 - x1) * (x2 - x1))))
                    // y1 -= (y1-y2>0?1:-1)*_y1;
                    if (y1 > y2) {
                        y1 -= _y1;
                    } else if (y1 < y2) {
                        y1 += _y1;
                    }
                } else if (x1 > 0 && x2 < 0) {
                    var _y2 = Math.floor(Math.sqrt((y1 - y2) * (y1 - y2) * x2 * x2 / ((x2 - x1) * (x2 - x1))))
                    // y2 -= (y2-y1>0?1:-1)*_y2;
                    if (y2 > y1) {
                        y2 -= _y2;
                    } else if (y2 < y1) {
                        y2 += _y2;
                    }
                }

                draw_arrow(ctx, x1 < this._getColLeft(0) ? this._getColLeft(0) : x1,
                  y1 < this._getRowTop(0) ? this._getRowTop(0) : y1, x2, y2);
                // draw_arrow(ctx, x1, y1, x2, y2);

                // ToDo посмотреть на четкость rect
                if (nodeCellMetrics.apl > this._getColLeft(0) && nodeCellMetrics.apt > this._getRowTop(0)) {
                    ctx.save()
                      .beginPath()
                      .arc(Math.floor(nodeCellMetrics.apl), Math.floor(nodeCellMetrics.apt), 3,
                        0, 2 * Math.PI, false, -0.5, -0.5)
                      .setFillStyle(color)
                      .fill()
                      .closePath()
                      .setLineWidth(1)
                      .setStrokeStyle(color)
                      .rect(nodeCellMetrics.l, nodeCellMetrics.t,
                        nodeCellMetrics.w - 1, nodeCellMetrics.h - 1)
                      .stroke()
                      .restore();
                }
            }
        }
    };

    WorksheetView.prototype.prepareDepCells = function (se) {
        this.drawDepCells();
    };

    WorksheetView.prototype.cleanDepCells = function () {
        this.depDrawCells = null;
        this.drawDepCells();
    };

    // ----- Text drawing -----

    WorksheetView.prototype._getPPIX = function () {
        return this.drawingCtx.getPPIX();
    };

    WorksheetView.prototype._getPPIY = function () {
        return this.drawingCtx.getPPIY();
    };

    WorksheetView.prototype._setDefaultFont = function (drawingCtx) {
        var ctx = drawingCtx || this.drawingCtx;
        ctx.setFont(AscCommonExcel.g_oDefaultFormat.Font);
    };

    /**
     * @param {Asc.TextMetrics} tm
     * @return {Asc.TextMetrics}
     */
    WorksheetView.prototype._roundTextMetrics = function (tm) {
        tm.width = Asc.round(tm.width);
        tm.height = Asc.round(tm.height);
        tm.baseline = Asc.round(tm.baseline);
        return tm;
    };

    WorksheetView.prototype._calcTextHorizPos = function (x1, x2, tm, align) {
        switch (align) {
            case AscCommon.align_Center:
                return Asc.round(0.5 * (x1 + x2 + 1 - tm.width));
            case AscCommon.align_Right:
                return x2 + 1 - this.settings.cells.padding - tm.width;
            case AscCommon.align_Justify:
            default:
                return x1 + this.settings.cells.padding;
        }
    };

    WorksheetView.prototype._calcTextVertPos = function (y1, h, baseline, tm, align) {
        switch (align) {
			case Asc.c_oAscVAlign.Center:
			case Asc.c_oAscVAlign.Dist:
			case Asc.c_oAscVAlign.Just:
                return y1 + Asc.round(0.5 * (h - tm.height * this.getZoom()));
            case Asc.c_oAscVAlign.Top:
                return y1;
            default:
                return baseline - Asc.round(tm.baseline * this.getZoom());
        }
    };

    WorksheetView.prototype._calcTextWidth = function (x1, x2, tm, halign) {
        switch (halign) {
            case AscCommon.align_Justify:
                return x2 + 1 - this.settings.cells.padding * 2 - x1;
            default:
                return tm.width;
        }
    };

    // ----- Scrolling -----

    WorksheetView.prototype._calcCellPosition = function (c, r, dc, dr) {
        var t = this;
        var vr = t.visibleRange;

        function findNextCell(col, row, dx, dy) {
            var state = t._isCellNullText(col, row);
            var i = col + dx;
            var j = row + dy;
            while (i >= 0 && i < t.nColsCount && j >= 0 && j < t.nRowsCount) {
                var newState = t._isCellNullText(i, j);
                if (newState !== state) {
                    var ret = {};
                    ret.col = state ? i : i - dx;
                    ret.row = state ? j : j - dy;
                    if (ret.col !== col || ret.row !== row || state) {
                        return ret;
                    }
                    state = newState;
                }
                i += dx;
                j += dy;
            }
            // Проверки для перехода в самый конец (ToDo пока убрал, чтобы не добавлять тормозов)
			/*if (i === t.nColsCount && state) {
				i = gc_nMaxCol;
			}
			if (j === t.nRowsCount && state) {
				j = gc_nMaxRow;
			}*/
            return {col: i - dx, row: j - dy};
        }

        function findEOT() {
            var obr = t.objectRender ? t.objectRender.getMaxColRow() : new AscCommon.CellBase(-1, -1);
            var maxCols = t.model.getColsCount();
            var maxRows = t.model.getRowsCount();
            var lastC = -1, lastR = -1;

            for (var col = 0; col < maxCols; ++col) {
                for (var row = 0; row < maxRows; ++row) {
                    if (!t._isCellNullText(col, row)) {
                        lastC = Math.max(lastC, col);
                        lastR = Math.max(lastR, row);
                    }
                }
            }
            return {col: Math.max(lastC, obr.col), row: Math.max(lastR, obr.row)};
        }

        var eot = dc > +2.0001 && dc < +2.9999 && dr > +2.0001 && dr < +2.9999 ? findEOT() : null;

        var newCol = (function () {
            if (dc > +0.0001 && dc < +0.9999) {
                return c + (vr.c2 - vr.c1 + 1);
            }  // PageDown
            if (dc < -0.0001 && dc > -0.9999) {
                return c - (vr.c2 - vr.c1 + 1);
            }  // PageUp
            if (dc > +1.0001 && dc < +1.9999) {
                return findNextCell(c, r, +1, 0).col;
            }  // Ctrl + ->
            if (dc < -1.0001 && dc > -1.9999) {
                return findNextCell(c, r, -1, 0).col;
            }  // Ctrl + <-
            if (dc > +2.0001 && dc < +2.9999) {
                return (eot || findNextCell(c, r, +1, 0)).col;
            }  // End
            if (dc < -2.0001 && dc > -2.9999) {
                return 0;
            }  // Home
            return c + dc;
        })();
        var newRow = (function () {
            if (dr > +0.0001 && dr < +0.9999) {
                return r + (vr.r2 - vr.r1 + 1);
            }
            if (dr < -0.0001 && dr > -0.9999) {
                return r - (vr.r2 - vr.r1 + 1);
            }
            if (dr > +1.0001 && dr < +1.9999) {
                return findNextCell(c, r, 0, +1).row;
            }
            if (dr < -1.0001 && dr > -1.9999) {
                return findNextCell(c, r, 0, -1).row;
            }
            if (dr > +2.0001 && dr < +2.9999) {
                return !eot ? 0 : eot.row;
            }
            if (dr < -2.0001 && dr > -2.9999) {
                return 0;
            }
            return r + dr;
        })();

        if (newCol >= t.nColsCount && newCol <= gc_nMaxCol0) {
            t.nColsCount = newCol + 1;
            //t._calcWidthColumns(AscCommonExcel.recalcType.newLines);
        }
        if (newRow >= t.nRowsCount && newRow <= gc_nMaxRow0) {
            t.nRowsCount = newRow + 1;
            //t._calcHeightRows(AscCommonExcel.recalcType.newLines);
        }

        return {
            col: newCol < 0 ? 0 : Math.min(newCol, t.nColsCount - 1),
            row: newRow < 0 ? 0 : Math.min(newRow, t.nRowsCount - 1)
        };
    };

    WorksheetView.prototype._isColDrawnPartially = function (col, leftCol, diffWidth) {
        if (col <= leftCol || col > gc_nMaxCol0) {
            return false;
        }
        return this._getColLeft(col + 1) - this._getColLeft(leftCol) + this.cellsLeft + diffWidth > this.drawingCtx.getWidth();
    };

    WorksheetView.prototype._isRowDrawnPartially = function (row, topRow, diffHeight) {
        if (row <= topRow || row > gc_nMaxRow0) {
            return false;
        }
        return this._getRowTop(row + 1) - this._getRowTop(topRow) + this.cellsTop + diffHeight > this.drawingCtx.getHeight();
    };

    WorksheetView.prototype._getMissingWidth = function () {
		var visibleWidth = this.cellsLeft + this._getColLeft(this.nColsCount) - this._getColLeft(this.visibleRange.c1);
		var offsetFrozen = this.getFrozenPaneOffset(false, true);
		visibleWidth += offsetFrozen.offsetX;
		return this.drawingCtx.getWidth() - visibleWidth;
    };

    WorksheetView.prototype._getMissingHeight = function () {
        var visibleHeight = this.cellsTop + this._getRowTop(this.nRowsCount) - this._getRowTop(this.visibleRange.r1);
        var offsetFrozen = this.getFrozenPaneOffset(true, false);
		visibleHeight += offsetFrozen.offsetY;
        return this.drawingCtx.getHeight() - visibleHeight;
    };

    WorksheetView.prototype._updateVisibleRowsCount = function (skipScrollReinit) {
        this._calcVisibleRows();
        if (gc_nMaxRow !== this.nRowsCount && !this.model.isDefaultHeightHidden()) {
			var missingHeight = this._getMissingHeight();
			if (0 < missingHeight) {
				var rowHeight = Asc.round(this.defaultRowHeightPx * this.getZoom());
				this.nRowsCount = Math.min(this.nRowsCount + Asc.ceil(missingHeight / rowHeight), gc_nMaxRow);
				this._calcVisibleRows();
				if (!skipScrollReinit) {
					this.handlers.trigger("reinitializeScroll", AscCommonExcel.c_oAscScrollType.ScrollVertical);
				}
			}
		}
        this._updateDrawingArea();
    };

    WorksheetView.prototype._updateVisibleColsCount = function (skipScrollReinit) {
        this._calcVisibleColumns();
		if (gc_nMaxCol !== this.nColsCount && !this.model.isDefaultWidthHidden()) {
			var missingWidth = this._getMissingWidth();
			if (0 < missingWidth) {
				var colWidth = Asc.round(this.defaultColWidthPx * this.getZoom());
				this.nColsCount = Math.min(this.nColsCount + Asc.ceil(missingWidth / colWidth), gc_nMaxCol);
				this._calcVisibleColumns();
				if (!skipScrollReinit) {
					this.handlers.trigger("reinitializeScroll", AscCommonExcel.c_oAscScrollType.ScrollHorizontal);
				}
			}
		}
    };

    WorksheetView.prototype.scrollVertical = function (delta, editor, initRowsCount) {
        var vr = this.visibleRange;
        var fixStartRow = new asc_Range(vr.c1, vr.r1, vr.c2, vr.r1);
        this._fixSelectionOfHiddenCells(0, delta >= 0 ? +1 : -1, fixStartRow);
        var start = this._calcCellPosition(vr.c1, fixStartRow.r1, 0, delta).row;
        fixStartRow.assign(vr.c1, start, vr.c2, start);
        this._fixSelectionOfHiddenCells(0, delta >= 0 ? +1 : -1, fixStartRow);
        this._fixVisibleRange(fixStartRow);
        var reinitScrollY = start !== fixStartRow.r1;
        // Для скролла вверх обычный сдвиг + дорисовка
        if (reinitScrollY && 0 > delta) {
            delta += fixStartRow.r1 - start;
        }
        start = fixStartRow.r1;

        if (start === vr.r1) {
            if (reinitScrollY) {
            	this.scrollType |= AscCommonExcel.c_oAscScrollType.ScrollVertical;
            	this._reinitializeScroll();
            }
            return this;
        }

		if (!this.notUpdateRowHeight) {
			this.cleanSelection();
			this.cellCommentator.cleanSelectedComment();
		}

        var ctx = this.drawingCtx;
        var ctxW = ctx.getWidth();
        var ctxH = ctx.getHeight();
        var offsetX, offsetY, diffWidth = 0, diffHeight = 0, cFrozen = 0, rFrozen = 0;
        if (this.topLeftFrozenCell) {
            cFrozen = this.topLeftFrozenCell.getCol0();
            rFrozen = this.topLeftFrozenCell.getRow0();
            diffWidth = this._getColLeft(cFrozen) - this._getColLeft(0);
            diffHeight = this._getRowTop(rFrozen) - this._getRowTop(0);
        }
        var oldVRE_isPartial = this._isRowDrawnPartially(vr.r2, vr.r1, diffHeight);
        var oldVR = vr.clone();
        var oldStart = vr.r1;
        var oldEnd = vr.r2;
		var x = this.cellsLeft;

        // ToDo стоит тут переделать весь scroll
        vr.r1 = start;
        this._updateVisibleRowsCount();
        // Это необходимо для того, чтобы строки, у которых высота по тексту, рассчитались
        if (!oldVR.intersectionSimple(vr)) {
            // Полностью обновилась область
            this._prepareCellTextMetricsCache(vr);
        } else {
            if (0 > delta) {
                // Идем вверх
                this._prepareCellTextMetricsCache(new asc_Range(vr.c1, start, vr.c2, oldStart - 1));
            } else {
                // Идем вниз
                this._prepareCellTextMetricsCache(new asc_Range(vr.c1, oldEnd + 1, vr.c2, vr.r2));
            }
        }

		if (this.notUpdateRowHeight) {
			return this;
		}

        var oldW, dx;
        var topOldStart = this._getRowTop(oldStart);
        var dy = this._getRowTop(start) - topOldStart;
        var oldH = ctxH - this.cellsTop - Math.abs(dy) - diffHeight;
        var scrollDown = (dy > 0 && oldH > 0);
        var y = this.cellsTop + (scrollDown ? dy : 0) + diffHeight;
        var lastRowHeight = (scrollDown && oldVRE_isPartial) ?
        ctxH - (this._getRowTop(oldEnd) - topOldStart + this.cellsTop + diffHeight) : 0;

        //TODO рассмотреть все случаи, когда необходимо вычитать groupWidth
        if (x !== this.cellsLeft) {
			this.scrollType |= AscCommonExcel.c_oAscScrollType.ScrollHorizontal;
            this._drawCorner();
            this._cleanColumnHeadersRect();
            this._drawColumnHeaders(null);

            dx = this.cellsLeft - x;
            oldW = ctxW - x - Math.abs(dx);

            if (rFrozen) {
                ctx.drawImage(ctx.getCanvas(), x, this.cellsTop, oldW, diffHeight, x + dx, this.cellsTop, oldW,
                  diffHeight);
                // ToDo Посмотреть с объектами!!!
            }
            this._drawFrozenPane(true);
        } else {
            dx = 0;
            x = this.headersLeft - this.groupWidth;
            oldW = ctxW;
        }

        // Перемещаем область
        var moveHeight = oldH - lastRowHeight;
        if (moveHeight > 0) {
            ctx.drawImage(ctx.getCanvas(), x, y, oldW, moveHeight, x + dx, y - dy, oldW, moveHeight);

            // Заглушка для safari (http://bugzilla.onlyoffice.com/show_bug.cgi?id=25546). Режим 'copy' сначала затирает, а
            // потом рисует (а т.к. мы рисуем сами на себе, то уже картинка будет пустой)
            if (AscBrowser.isSafari) {
                this.drawingGraphicCtx.moveImageDataSafari(x, y, oldW, moveHeight, x + dx, y - dy);
            } else {
                this.drawingGraphicCtx.moveImageData(x, y, oldW, moveHeight, x + dx, y - dy);
            }
        }
        // Очищаем область
        var clearTop = this.cellsTop + diffHeight + (scrollDown && moveHeight > 0 ? moveHeight : 0);
        var clearHeight = (moveHeight > 0) ? Math.abs(dy) + lastRowHeight : ctxH - (this.cellsTop + diffHeight);
        ctx.setFillStyle(this.settings.cells.defaultState.background)
          .fillRect(this.headersLeft - this.groupWidth, clearTop, ctxW, clearHeight);
        this.drawingGraphicCtx.clearRect(this.headersLeft - this.groupWidth, clearTop, ctxW, clearHeight);

		this._updateDrawingArea();

        // Дорисовываем необходимое
        if (dy < 0 || vr.r2 !== oldEnd || oldVRE_isPartial || dx !== 0) {
            var r1, r2;
            if (moveHeight > 0) {
                if (scrollDown) {
                    r1 = oldEnd + (oldVRE_isPartial ? 0 : 1);
                    r2 = vr.r2;
                } else {
                    r1 = vr.r1;
                    r2 = vr.r1 - 1 - delta;
                }
            } else {
                r1 = vr.r1;
                r2 = vr.r2;
            }
            var range = new asc_Range(vr.c1, r1, vr.c2, r2);
            if (dx === 0) {
                this._drawRowHeaders(null, r1, r2);
            } else {
                // redraw all headres, because number of decades in row index has been changed
                this._drawRowHeaders(null);
                if (dx < 0) {
                    // draw last column
                    var r_;
                    var r1_ = r2 + 1;
                    var r2_ = vr.r2;
                    if (r2_ >= r1_) {
                        r_ = new asc_Range(vr.c2, r1_, vr.c2, r2_);
                        this._drawGrid(null, r_);
						this._drawGroupData(null, r_);
                        this._drawCellsAndBorders(null, r_);
                    }
                    if (0 < rFrozen) {
                        r_ = new asc_Range(vr.c2, 0, vr.c2, rFrozen - 1);
                        offsetY = this._getRowTop(0) - this.cellsTop;
                        this._drawGrid(null, r_, /*offsetXForDraw*/undefined, offsetY);
						this._drawGroupData(null, r_, /*offsetXForDraw*/undefined, offsetY);
                        this._drawCellsAndBorders(null, r_, /*offsetXForDraw*/undefined, offsetY);
                    }
                }
            }
            offsetX = this._getColLeft(this.visibleRange.c1) - this.cellsLeft - diffWidth;
            offsetY = this._getRowTop(this.visibleRange.r1) - this.cellsTop - diffHeight;
            this._drawGrid(null, range);
			if(dx !== 0) {
				this._drawGroupData(null);
			} else {
				this._drawGroupData(null, range);
			}

            this._drawCellsAndBorders(null, range);
            this.af_drawButtons(range, offsetX, offsetY);
            this.objectRender.showDrawingObjectsEx(false,
              new AscFormat.GraphicOption(this, AscCommonExcel.c_oAscScrollType.ScrollVertical, range, {
                  offsetX: offsetX, offsetY: offsetY
              }));
            if (0 < cFrozen) {
                range.c1 = 0;
                range.c2 = cFrozen - 1;
                offsetX = this._getColLeft(0) - this.cellsLeft;
                this._drawGrid(null, range, offsetX);
				this._drawGroupData(null, range, offsetX);
                this._drawCellsAndBorders(null, range, offsetX);
                this.af_drawButtons(range, offsetX, offsetY);
                this.objectRender.showDrawingObjectsEx(false,
                  new AscFormat.GraphicOption(this, AscCommonExcel.c_oAscScrollType.ScrollVertical, range, {
                      offsetX: offsetX, offsetY: offsetY
                  }));
            }
        }
        // Отрисовывать нужно всегда, вдруг бордеры
        this._drawFrozenPaneLines();
        this._fixSelectionOfMergedCells();
        this._drawSelection();

        if (reinitScrollY || (0 > delta && initRowsCount && this._initRowsCount())) {
			this.scrollType |= AscCommonExcel.c_oAscScrollType.ScrollVertical;
        }
		this._reinitializeScroll();
        this.handlers.trigger("onDocumentPlaceChanged");

		if (this.isCellEditMode && editor && this.model.selectionRange.activeCell.row >= rFrozen) {
			editor.move();
		}

        //ToDo this.drawDepCells();
        this.cellCommentator.updateActiveComment();
        this.cellCommentator.drawCommentCells();
		window['AscCommon'].g_specialPasteHelper.SpecialPasteButton_Update_Position();
        this.handlers.trigger("toggleAutoCorrectOptions", true);
        return this;
    };

    WorksheetView.prototype.scrollHorizontal = function (delta, editor, initColsCount) {
        var vr = this.visibleRange;
        var fixStartCol = new asc_Range(vr.c1, vr.r1, vr.c1, vr.r2);
        this._fixSelectionOfHiddenCells(delta >= 0 ? +1 : -1, 0, fixStartCol);
        var start = this._calcCellPosition(fixStartCol.c1, vr.r1, delta, 0).col;
        fixStartCol.assign(start, vr.r1, start, vr.r2);
        this._fixSelectionOfHiddenCells(delta >= 0 ? +1 : -1, 0, fixStartCol);
        this._fixVisibleRange(fixStartCol);
        var reinitScrollX = start !== fixStartCol.c1;
        // Для скролла влево обычный сдвиг + дорисовка
        if (reinitScrollX && 0 > delta) {
            delta += fixStartCol.c1 - start;
        }
        start = fixStartCol.c1;

        if (start === vr.c1) {
            if (reinitScrollX) {
				this.scrollType |= AscCommonExcel.c_oAscScrollType.ScrollHorizontal;
				this._reinitializeScroll();
            }
            return this;
        }

        if (!this.notUpdateRowHeight) {
			this.cleanSelection();
			this.cellCommentator.cleanSelectedComment();
		}

        var ctx = this.drawingCtx;
        var ctxW = ctx.getWidth();
        var ctxH = ctx.getHeight();
		var oldStart = vr.c1;
		var oldEnd = vr.c2;
		var leftOldStart = this._getColLeft(oldStart);
        var dx = this._getColLeft(start) - leftOldStart;
        var offsetX, offsetY, diffWidth = 0, diffHeight = 0;
        var oldW = ctxW - this.cellsLeft - Math.abs(dx);
        var scrollRight = (dx > 0 && oldW > 0);
        var x = this.cellsLeft + (scrollRight ? dx : 0);
        var y = this.headersTop - this.groupHeight;
        var cFrozen = 0, rFrozen = 0;
        if (this.topLeftFrozenCell) {
            rFrozen = this.topLeftFrozenCell.getRow0();
            cFrozen = this.topLeftFrozenCell.getCol0();
            diffWidth = this._getColLeft(cFrozen) - this._getColLeft(0);
            diffHeight = this._getRowTop(rFrozen) - this._getRowTop(0);
            x += diffWidth;
            oldW -= diffWidth;
        }
        var oldVCE_isPartial = this._isColDrawnPartially(vr.c2, vr.c1, diffWidth);
        var oldVR = vr.clone();

        // ToDo стоит тут переделать весь scroll
        vr.c1 = start;
        this._updateVisibleColsCount();
        // Это необходимо для того, чтобы строки, у которых высота по тексту, рассчитались
        if (!oldVR.intersectionSimple(vr)) {
            // Полностью обновилась область
            this._prepareCellTextMetricsCache(vr);
        } else {
            if (0 > delta) {
                // Идем влево
                this._prepareCellTextMetricsCache(new asc_Range(start, vr.r1, oldStart - 1, vr.r2));
            } else {
                // Идем вправо
                this._prepareCellTextMetricsCache(new asc_Range(oldEnd + 1, vr.r1, vr.c2, vr.r2));
            }
        }

        if (this.notUpdateRowHeight) {
            return this;
        }

        var lastColWidth = (scrollRight && oldVCE_isPartial) ?
        ctxW - (this._getColLeft(oldEnd) - leftOldStart + this.cellsLeft + diffWidth) : 0;

        // Перемещаем область
        var moveWidth = oldW - lastColWidth;
        if (moveWidth > 0) {
            ctx.drawImage(ctx.getCanvas(), x, y, moveWidth, ctxH, x - dx, y, moveWidth, ctxH);

            // Заглушка для safari (http://bugzilla.onlyoffice.com/show_bug.cgi?id=25546). Режим 'copy' сначала затирает, а
            // потом рисует (а т.к. мы рисуем сами на себе, то уже картинка будет пустой)
            if (AscBrowser.isSafari) {
                this.drawingGraphicCtx.moveImageDataSafari(x, y, moveWidth, ctxH, x - dx, y);
            } else {
                this.drawingGraphicCtx.moveImageData(x, y, moveWidth, ctxH, x - dx, y);
            }
        }
        // Очищаем область
        var clearLeft = this.cellsLeft + diffWidth + (scrollRight && moveWidth > 0 ? moveWidth : 0);
        var clearWidth = (moveWidth > 0) ? Math.abs(dx) + lastColWidth : ctxW - (this.cellsLeft + diffWidth);
        ctx.setFillStyle(this.settings.cells.defaultState.background)
          .fillRect(clearLeft, y, clearWidth, ctxH);
        this.drawingGraphicCtx.clearRect(clearLeft, y, clearWidth, ctxH);

		this._updateDrawingArea();

        // Дорисовываем необходимое
        if (dx < 0 || vr.c2 !== oldEnd || oldVCE_isPartial) {
            var c1, c2;
            if (moveWidth > 0) {
                if (scrollRight) {
                    c1 = oldEnd + (oldVCE_isPartial ? 0 : 1);
                    c2 = vr.c2;
                } else {
                    c1 = vr.c1;
                    c2 = vr.c1 - 1 - delta;
                }
            } else {
                c1 = vr.c1;
                c2 = vr.c2;
            }
            var range = new asc_Range(c1, vr.r1, c2, vr.r2);
            offsetX = this._getColLeft(this.visibleRange.c1) - this.cellsLeft - diffWidth;
            offsetY = this._getRowTop(this.visibleRange.r1) - this.cellsTop - diffHeight;
            this._drawColumnHeaders(null, c1, c2);
            this._drawGrid(null, range);
			this._drawGroupData(null, range, undefined, undefined, true);
            this._drawCellsAndBorders(null, range);
            this.af_drawButtons(range, offsetX, offsetY);
            this.objectRender.showDrawingObjectsEx(false,
              new AscFormat.GraphicOption(this, AscCommonExcel.c_oAscScrollType.ScrollHorizontal, range, {
                  offsetX: offsetX, offsetY: offsetY
              }));
            if (rFrozen) {
                range.r1 = 0;
                range.r2 = rFrozen - 1;
                offsetY = this._getRowTop(0) - this.cellsTop;
                this._drawGrid(null, range, undefined, offsetY);
				this._drawGroupData(null, range, undefined, offsetY, true);
                this._drawCellsAndBorders(null, range, undefined, offsetY);
                this.af_drawButtons(range, offsetX, offsetY);
                this.objectRender.showDrawingObjectsEx(false,
                  new AscFormat.GraphicOption(this, AscCommonExcel.c_oAscScrollType.ScrollHorizontal, range, {
                      offsetX: offsetX, offsetY: offsetY
                  }));
            }
        }

        // Отрисовывать нужно всегда, вдруг бордеры
        this._drawFrozenPaneLines();
        this._fixSelectionOfMergedCells();
        this._drawSelection();

		if (reinitScrollX || (0 > delta && initColsCount && this._initColsCount())) {
			this.scrollType |= AscCommonExcel.c_oAscScrollType.ScrollHorizontal;
        }

		this._reinitializeScroll();
        this.handlers.trigger("onDocumentPlaceChanged");

		if (this.isCellEditMode && editor && this.model.selectionRange.activeCell.col >= cFrozen) {
			editor.move();
		}

        //ToDo this.drawDepCells();
        this.cellCommentator.updateActiveComment();
        this.cellCommentator.drawCommentCells();
		window['AscCommon'].g_specialPasteHelper.SpecialPasteButton_Update_Position();
        this.handlers.trigger("toggleAutoCorrectOptions", true);
        return this;
    };

    // ----- Selection -----

    // x,y - абсолютные координаты относительно листа (без учета заголовков)
    WorksheetView.prototype.findCellByXY = function (x, y, canReturnNull, skipCol, skipRow) {
        var i, sum, size, result = new AscFormat.CCellObjectInfo();
        if (canReturnNull) {
            result.col = result.row = null;
        }

        x += this.cellsLeft;
        y += this.cellsTop;
        if (!skipCol) {
			sum = this._getColLeft(this.nColsCount);
			if (sum < x) {
				result.col = this.nColsCount;
				if (!this.model.isDefaultWidthHidden()) {
					result.col += ((x - sum) / (this.defaultColWidthPx * this.getZoom())) | 0;
					result.col = Math.min(result.col, gc_nMaxCol0);
                    sum +=  (result.col - this.nColsCount) * (this.defaultColWidthPx * this.getZoom());
				}
			} else {
				sum = this.cellsLeft;
				for (i = 0; i < this.nColsCount; ++i) {
					size = this._getColumnWidth(i);
					if (sum + size > x) {
						break;
					}
					sum += size;
				}
				result.col = i;
			}

			if (null !== result.col) {
				result.colOff = x - sum;
			}
        }
        if (!skipRow) {
            sum = this._getRowTop(this.nRowsCount);
            if (sum < y) {
				result.row = this.nRowsCount;
                if (!this.model.isDefaultHeightHidden()) {
					result.row += ((y - sum) / (this.defaultRowHeightPx * this.getZoom())) | 0;
					result.row = Math.min(result.row, gc_nMaxRow0);
                    sum +=  (result.row - this.nRowsCount) * (this.defaultRowHeightPx * this.getZoom());
                }
            } else {
                sum = this.cellsTop;
                for (i = 0; i < this.nRowsCount; ++i) {
					size = this._getRowHeight(i);
                    if (sum + size > y) {
                        break;
                    }
                    sum += size;
                }
				result.row = i;
            }

            if (null !== result.row) {
                result.rowOff = y - sum;
            }
        }

        return result;
    };

	/**
     *
	 * @param x
	 * @param canReturnNull
	 * @param half - считать с половиной следующей ячейки
	 * @returns {*}
	 * @private
	 */
	WorksheetView.prototype._findColUnderCursor = function (x, canReturnNull, half) {
		var activeCellCol = half ? this._getSelection().activeCell.col : -1;
		var w, dx = 0;
		var c = this.visibleRange.c1;
		var offset = this._getColLeft(c) - this.cellsLeft;
		var c2, x1, x2, cFrozen, widthDiff = 0;
		if (x >= this.cellsLeft) {
			if (this.topLeftFrozenCell) {
				cFrozen = this.topLeftFrozenCell.getCol0();
				widthDiff = this._getColLeft(cFrozen) - this._getColLeft(0);
				if (x < this.cellsLeft + widthDiff && 0 !== widthDiff) {
					c = 0;
					widthDiff = 0;
				}
			}
			for (x1 = this.cellsLeft + widthDiff, c2 = this.nColsCount - 1; c <= c2; ++c, x1 = x2) {
				w = this._getColumnWidth(c);
				x2 = x1 + w;
				dx = half ? w / 2.0 * Math.sign(c - activeCellCol) : 0;
				if (x1 + dx > x) {
					if (c !== this.visibleRange.c1) {
						if (dx) {
							c -= 1;
							x2 = x1;
							x1 -= w;
						}
						return {col: c, left: x1, right: x2};
					} else {
						c = c2;
						break;
					}
				} else if (x <= x2 + dx) {
					return {col: c, left: x1, right: x2};
				}
			}
			if (!canReturnNull) {
				x1 = this._getColLeft(c2) - offset;
				return {col: c2, left: x1, right: x1 + this._getColumnWidth(c2)};
			}
		} else {
			if (this.topLeftFrozenCell) {
				cFrozen = this.topLeftFrozenCell.getCol0();
				if (0 !== cFrozen) {
					c = 0;
					offset = this._getColLeft(c) - this.cellsLeft;
				}
			}
			for (x2 = this.cellsLeft + this._getColumnWidth(c), c2 = 0; c >= c2; --c, x2 = x1) {
				x1 = this._getColLeft(c) - offset;
				if (x1 <= x && x < x2) {
					return {col: c, left: x1, right: x2};
				}
			}
			if (!canReturnNull) {
				return {col: c2, left: x1, right: x1 + this._getColumnWidth(c2)};
			}
		}
		return null;
	};

	/**
     *
	 * @param y
	 * @param canReturnNull
	 * @param half - считать с половиной следующей ячейки
	 * @returns {*}
	 * @private
	 */
	WorksheetView.prototype._findRowUnderCursor = function (y, canReturnNull, half) {
		var activeCellRow = half ? this._getSelection().activeCell.row : -1;
		var h, dy = 0;
		var r = this.visibleRange.r1;
		var offset = this._getRowTop(r) - this.cellsTop;
		var r2, y1, y2, rFrozen, heightDiff = 0;
		if (y >= this.cellsTop) {
			if (this.topLeftFrozenCell) {
				rFrozen = this.topLeftFrozenCell.getRow0();
				heightDiff = this._getRowTop(rFrozen) - this._getRowTop(0);
				if (y < this.cellsTop + heightDiff && 0 !== heightDiff) {
					r = 0;
					heightDiff = 0;
				}
			}
			for (y1 = this.cellsTop + heightDiff, r2 = this.nRowsCount - 1; r <= r2; ++r, y1 = y2) {
			    h = this._getRowHeight(r);
				y2 = y1 + h;
				dy = half ? h / 2.0 * Math.sign(r - activeCellRow) : 0;
				if (y1 + dy > y) {
					if (r !== this.visibleRange.r1) {
						if (dy) {
							r -= 1;
							y2 = y1;
							y1 -= h;
						}
						return {row: r, top: y1, bottom: y2};
					} else {
						r = r2;
						break;
					}
				} else if (y <= y2 + dy) {
					return {row: r, top: y1, bottom: y2};
				}
			}
			if (!canReturnNull) {
				y1 = this._getRowTop(r2) - offset;
				return {row: r2, top: y1, bottom: y1 + this._getRowHeight(r2)};
			}
		} else {
			if (this.topLeftFrozenCell) {
				rFrozen = this.topLeftFrozenCell.getRow0();
				if (0 !== rFrozen) {
					r = 0;
					offset = this._getRowTop(r) - this.cellsTop;
				}
			}
			for (y2 = this.cellsTop + this._getRowHeight(r), r2 = 0; r >= r2; --r, y2 = y1) {
				y1 = this._getRowTop(r) - offset;
				if (y1 <= y && y < y2) {
					return {row: r, top: y1, bottom: y2};
				}
			}
			if (!canReturnNull) {
				return {row: r2, top: y1, bottom: y1 + this._getRowHeight(r2)};
			}
		}
		return null;
	};

    WorksheetView.prototype._hitResizeCorner = function (x1, y1, x2, y2) {
        var wEps = AscCommon.global_mouseEvent.KoefPixToMM, hEps = AscCommon.global_mouseEvent.KoefPixToMM;
        return Math.abs(x2 - x1) <= wEps + 2 && Math.abs(y2 - y1) <= hEps + 2;
    };
    WorksheetView.prototype._hitInRange = function (range, rangeType, vr, x, y, offsetX, offsetY) {
        var wEps = 2 * AscCommon.global_mouseEvent.KoefPixToMM, hEps = 2 * AscCommon.global_mouseEvent.KoefPixToMM;
        var cursor, x1, x2, y1, y2, isResize;
        var col = -1, row = -1;

        var oFormulaRangeIn = range.intersectionSimple(vr);
        if (oFormulaRangeIn) {
            x1 = this._getColLeft(oFormulaRangeIn.c1) - offsetX;
            x2 = this._getColLeft(oFormulaRangeIn.c2 + 1) - offsetX;
            y1 = this._getRowTop(oFormulaRangeIn.r1) - offsetY;
            y2 = this._getRowTop(oFormulaRangeIn.r2 + 1) - offsetY;

            isResize = AscCommonExcel.selectionLineType.Resize & rangeType;

            if (isResize && this._hitResizeCorner(x1 - 1, y1 - 1, x, y)) {
                /*TOP-LEFT*/
                cursor = kCurSEResize;
                col = range.c2;
                row = range.r2;
            } else if (isResize && this._hitResizeCorner(x2, y1 - 1, x, y)) {
                /*TOP-RIGHT*/
                cursor = kCurNEResize;
                col = range.c1;
                row = range.r2;
            } else if (isResize && this._hitResizeCorner(x1 - 1, y2, x, y)) {
                /*BOTTOM-LEFT*/
                cursor = kCurNEResize;
                col = range.c2;
                row = range.r1;
            } else if (this._hitResizeCorner(x2, y2, x, y)) {
                /*BOTTOM-RIGHT*/
                cursor = kCurSEResize;
                col = range.c1;
                row = range.r1;
            } else if ((((range.c1 === oFormulaRangeIn.c1 && Math.abs(x - x1) <= wEps) ||
              (range.c2 === oFormulaRangeIn.c2 && Math.abs(x - x2) <= wEps)) && hEps <= y - y1 && y - y2 <= hEps) ||
              (((range.r1 === oFormulaRangeIn.r1 && Math.abs(y - y1) <= hEps) ||
              (range.r2 === oFormulaRangeIn.r2 && Math.abs(y - y2) <= hEps)) && wEps <= x - x1 && x - x2 <= wEps)) {
                cursor = kCurMove;
            }
        }

        return cursor ? {
            cursor: cursor, col: col, row: row
        } : null;
    };

    WorksheetView.prototype._hitCursorSelectionRange = function (vr, x, y, offsetX, offsetY) {
        var res = this._hitInRange(this.model.selectionRange.getLast(),
          AscCommonExcel.selectionLineType.Selection | AscCommonExcel.selectionLineType.ActiveCell |
          AscCommonExcel.selectionLineType.Promote, vr, x, y, offsetX, offsetY);
        return res ? {
            cursor: kCurMove === res.cursor ? kCurMove : kCurFillHandle,
            target: kCurMove === res.cursor ? c_oTargetType.MoveRange : c_oTargetType.FillHandle,
            col: -1,
            row: -1
        } : null;
    };

    WorksheetView.prototype._hitCursorFormulaOrChart = function (vr, x, y, offsetX, offsetY) {
        var i, l, res;
        var oFormulaRange;
        var arrRanges = this.isFormulaEditMode ? this.arrActiveFormulaRanges : this.arrActiveChartRanges;
        var targetArr = this.isFormulaEditMode ? 0 : -1;

        for (i = 0, l = arrRanges.length; i < l; ++i) {
            oFormulaRange = arrRanges[i].getLast();
            res = !oFormulaRange.isName &&
              this._hitInRange(oFormulaRange, AscCommonExcel.selectionLineType.Resize, vr, x, y, offsetX, offsetY);
            if (res) {
                break;
            }
        }
        return res ? {
            cursor: res.cursor,
            target: c_oTargetType.MoveResizeRange,
            col: res.col,
            row: res.row,
            formulaRange: oFormulaRange,
            indexFormulaRange: i,
            targetArr: targetArr
        } : null;
    };

	WorksheetView.prototype.getCursorTypeFromXY = function (x, y) {
	    var canEdit = this.handlers.trigger('canEdit');
		var viewMode = this.handlers.trigger('getViewMode');
		this.handlers.trigger("checkLastWork");
		var res, c, r, f, offsetX, offsetY, cellCursor;
		var sheetId = this.model.getId(), userId, lockRangePosLeft, lockRangePosTop, lockInfo, oHyperlink;
		var widthDiff = 0, heightDiff = 0, isLocked = false, target = c_oTargetType.Cells, row = -1, col = -1,
			isSelGraphicObject, isNotFirst;

		if (c_oAscSelectionDialogType.None === this.selectionDialogType) {
			var frozenCursor = this._isFrozenAnchor(x, y);
			if (canEdit && frozenCursor.result) {
				lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, null, sheetId,
					AscCommonExcel.c_oAscLockNameFrozenPane);
				isLocked =
					this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther, false);
				if (false !== isLocked) {
					// Кто-то сделал lock
					var frozenCell = this.topLeftFrozenCell ? this.topLeftFrozenCell :
						new AscCommon.CellAddress(0, 0, 0);
					userId = isLocked.UserId;
					lockRangePosLeft = this._getColLeft(frozenCell.getCol0());
					lockRangePosTop = this._getRowTop(frozenCell.getRow0());
				}
				return {
					cursor: frozenCursor.cursor,
					target: frozenCursor.name,
					col: -1,
					row: -1,
					userId: userId,
					lockRangePosLeft: lockRangePosLeft,
					lockRangePosTop: lockRangePosTop
				};
			}

			var drawingInfo = this.objectRender.checkCursorDrawingObject(x, y);
			if (asc["editor"].isStartAddShape &&
				AscCommonExcel.CheckIdSatetShapeAdd(this.objectRender.controller.curState)) {
				return {cursor: kCurFillHandle, target: c_oTargetType.Shape, col: -1, row: -1};
			}

			if (drawingInfo && drawingInfo.id) {
				// Возможно картинка с lock
				lockInfo =
					this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, null, sheetId, drawingInfo.id);
				isLocked =
					this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther, false);
				if (false !== isLocked) {
					// Кто-то сделал lock
					userId = isLocked.UserId;
					lockRangePosLeft = drawingInfo.object.getVisibleLeftOffset(true);
					lockRangePosTop = drawingInfo.object.getVisibleTopOffset(true);
				}

				if (drawingInfo.hyperlink instanceof ParaHyperlink) {
					oHyperlink = new AscCommonExcel.Hyperlink();
					oHyperlink.Tooltip = drawingInfo.hyperlink.ToolTip;
					var spl = drawingInfo.hyperlink.Value.split("!");
					if (spl.length === 2) {
						oHyperlink.setLocation(drawingInfo.hyperlink.Value);
					} else {
						oHyperlink.Hyperlink = drawingInfo.hyperlink.Value;
					}

					cellCursor =
						{cursor: drawingInfo.cursor, target: c_oTargetType.Cells, col: -1, row: -1, userId: userId};
					return {
						cursor: kCurHyperlink,
						target: c_oTargetType.Hyperlink,
						hyperlink: new asc_CHyperlink(oHyperlink),
						cellCursor: cellCursor,
						userId: userId
					};
				}

				return {
					cursor: drawingInfo.cursor,
					target: c_oTargetType.Shape,
					drawingId: drawingInfo.id,
					col: -1,
					row: -1,
					userId: userId,
					lockRangePosLeft: lockRangePosLeft,
					lockRangePosTop: lockRangePosTop
				};
			}
		}

		var oResDefault = {cursor: kCurDefault, target: c_oTargetType.None, col: -1, row: -1};
		if (x >= this.headersLeft && x < this.cellsLeft && y < this.cellsTop && y >= this.headersTop) {
			return {cursor: kCurCorner, target: c_oTargetType.Corner, col: -1, row: -1};
		}

		var cFrozen = -1, rFrozen = -1;
		offsetX = this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
		offsetY = this._getRowTop(this.visibleRange.r1) - this.cellsTop;
		if (this.topLeftFrozenCell) {
			cFrozen = this.topLeftFrozenCell.getCol0();
			rFrozen = this.topLeftFrozenCell.getRow0();
			widthDiff = this._getColLeft(cFrozen) - this._getColLeft(0);
			heightDiff = this._getRowTop(rFrozen) - this._getRowTop(0);

			offsetX = (x < this.cellsLeft + widthDiff) ? 0 : offsetX - widthDiff;
			offsetY = (y < this.cellsTop + heightDiff) ? 0 : offsetY - heightDiff;
		}

		//TODO проверить!
		//group row
		if(x <= this.cellsLeft && this.groupWidth && x < this.groupWidth) {
			if(y > this.groupHeight + this.headersHeight) {
				r = this._findRowUnderCursor(y, true);
			}
			row = -1;
			if(r) {
				row = r.row + (isNotFirst && f && y < r.top + 3 ? -1 : 0);
			}
			return {
				cursor: kCurDefault,
				target: c_oTargetType.GroupRow,
				col: -1,
				row: row,
				mouseY: r ? (((y < r.top + 3) ? r.top : r.bottom) - y - 1) : null
			};
		}

		var epsChangeSize = 3 * AscCommon.global_mouseEvent.KoefPixToMM;

		//TODO проверить!
		//group col
		if (y <= this.cellsTop && this.groupHeight && y < this.groupHeight) {
			c = null;
			if(x > this.groupWidth + this.headersWidth) {
				c = this._findColUnderCursor(x, true);
			}
			col = -1;
			if (c) {
				col = c.col + (isNotFirst && f && x < c.left + 3 ? -1 : 0);
			}
			/*isNotFirst = c.col !== (-1 !== cFrozen ? 0 : this.visibleRange.c1);
			f = (canEdit || viewMode) && (isNotFirst && x < c.left + epsChangeSize || x >= c.right - epsChangeSize) && !this.isCellEditMode;*/
			// ToDo В Excel зависимость epsilon от размера ячейки (у нас фиксированный 3)
			return {
				cursor: kCurDefault,
				target: c_oTargetType.GroupCol,
				col: col,
				row: -1,
				mouseX: c ? (((x < c.left + 3) ? c.left : c.right) - x - 1) : null
			};
		}

		if (x <= this.cellsLeft && y >= this.cellsTop) {
			r = this._findRowUnderCursor(y, true);
			if (r === null) {
				return oResDefault;
			}
			isNotFirst = (r.row !== (-1 !== rFrozen ? 0 : this.visibleRange.r1));
			f = (canEdit || viewMode) && (isNotFirst && y < r.top + epsChangeSize || y >= r.bottom - epsChangeSize) && !this.isCellEditMode;
			// ToDo В Excel зависимость epsilon от размера ячейки (у нас фиксированный 3)
			return {
				cursor: f ? kCurRowResize : kCurRowSelect,
				target: f ? c_oTargetType.RowResize : c_oTargetType.RowHeader,
				col: -1,
				row: r.row + (isNotFirst && f && y < r.top + 3 ? -1 : 0),
				mouseY: f ? (((y < r.top + 3) ? r.top : r.bottom) - y - 1) : null
			};
		}

		if (y <= this.cellsTop && x >= this.cellsLeft) {
			c = this._findColUnderCursor(x, true);
			if (c === null) {
				return oResDefault;
			}
			isNotFirst = c.col !== (-1 !== cFrozen ? 0 : this.visibleRange.c1);
			f = (canEdit || viewMode) && (isNotFirst && x < c.left + epsChangeSize || x >= c.right - epsChangeSize) && !this.isCellEditMode;
			// ToDo В Excel зависимость epsilon от размера ячейки (у нас фиксированный 3)
			return {
				cursor: f ? kCurColResize : kCurColSelect,
				target: f ? c_oTargetType.ColumnResize : c_oTargetType.ColumnHeader,
				col: c.col + (isNotFirst && f && x < c.left + 3 ? -1 : 0),
				row: -1,
				mouseX: f ? (((x < c.left + 3) ? c.left : c.right) - x - 1) : null
			};
		}

		if (this.stateFormatPainter) {
			if (x <= this.cellsLeft && y >= this.cellsTop) {
				r = this._findRowUnderCursor(y, true);
				if (r !== null) {
					target = c_oTargetType.RowHeader;
					row = r.row;
				}
			}
			if (y <= this.cellsTop && x >= this.cellsLeft) {
				c = this._findColUnderCursor(x, true);
				if (c !== null) {
					target = c_oTargetType.ColumnHeader;
					col = c.col;
				}
			}
			return {cursor: kCurFormatPainterExcel, target: target, col: col, row: row};
		}

		if (this.isFormulaEditMode || this.isChartAreaEditMode) {
			this._drawElements(function (_vr, _offsetX, _offsetY) {
				return (null === (res = this._hitCursorFormulaOrChart(_vr, x, y, _offsetX, _offsetY)));
			});
			if (res) {
				return res;
			}
		}

		isSelGraphicObject = this.objectRender.selectedGraphicObjectsExists();
		if (canEdit && !isSelGraphicObject && this.model.selectionRange.isSingleRange() &&
			c_oAscSelectionDialogType.None === this.selectionDialogType) {
			this._drawElements(function (_vr, _offsetX, _offsetY) {
				return (null === (res = this._hitCursorSelectionRange(_vr, x, y, _offsetX, _offsetY)));
			});
			if (res) {
				return res;
			}
		}

		if (x > this.cellsLeft && y > this.cellsTop) {
			c = this._findColUnderCursor(x, true);
			r = this._findRowUnderCursor(y, true);
			if (c === null || r === null) {
				return oResDefault;
			}

			// Проверка на совместное редактирование
			var lockRange = undefined;
			var lockAllPosLeft = undefined;
			var lockAllPosTop = undefined;
			var userIdAllProps = undefined;
			var userIdAllSheet = undefined;
			if (canEdit && this.collaborativeEditing.getCollaborativeEditing()) {
				var c1Recalc = null, r1Recalc = null;
				var selectRangeRecalc = new asc_Range(c.col, r.row, c.col, r.row);
				// Пересчет для входящих ячеек в добавленные строки/столбцы
				var isIntersection = this._recalcRangeByInsertRowsAndColumns(sheetId, selectRangeRecalc);
				if (false === isIntersection) {
					lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Range, /*subType*/null, sheetId,
						new AscCommonExcel.asc_CCollaborativeRange(selectRangeRecalc.c1, selectRangeRecalc.r1,
							selectRangeRecalc.c2, selectRangeRecalc.r2));
					isLocked = this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther,
                        /*bCheckOnlyLockAll*/false);
					if (false !== isLocked) {
						// Кто-то сделал lock
						userId = isLocked.UserId;
						lockRange = isLocked.Element["rangeOrObjectId"];

						c1Recalc =
							this.collaborativeEditing.m_oRecalcIndexColumns[sheetId].getLockOther(lockRange["c1"],
								c_oAscLockTypes.kLockTypeOther);
						r1Recalc = this.collaborativeEditing.m_oRecalcIndexRows[sheetId].getLockOther(lockRange["r1"],
							c_oAscLockTypes.kLockTypeOther);
						if (null !== c1Recalc && null !== r1Recalc) {
							lockRangePosLeft = this._getColLeft(c1Recalc);
							lockRangePosTop = this._getRowTop(r1Recalc);
							// Пересчитываем X и Y относительно видимой области
							lockRangePosLeft -= offsetX;
							lockRangePosTop -= offsetY;
							lockRangePosLeft = this.cellsLeft > lockRangePosLeft ? this.cellsLeft : lockRangePosLeft;
							lockRangePosTop = this.cellsTop > lockRangePosTop ? this.cellsTop : lockRangePosTop;
						}
					}
				} else {
					lockInfo =
						this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Range, /*subType*/null, sheetId, null);
				}
				// Проверим не удален ли весь лист (именно удален, т.к. если просто залочен, то не рисуем рамку вокруг)
				lockInfo["type"] = c_oAscLockTypeElem.Sheet;
				isLocked = this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther,
                    /*bCheckOnlyLockAll*/true);
				if (false !== isLocked) {
					// Кто-то сделал lock
					userIdAllSheet = isLocked.UserId;
				}

				// Проверим не залочены ли все свойства листа (только если не удален весь лист)
				if (undefined === userIdAllSheet) {
					lockInfo["type"] = c_oAscLockTypeElem.Range;
					lockInfo["subType"] = c_oAscLockTypeElemSubType.InsertRows;
					isLocked = this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther,
                        /*bCheckOnlyLockAll*/true);
					if (false !== isLocked) {
						// Кто-то сделал lock
						userIdAllProps = isLocked.UserId;
					}
				}
			}

			if (canEdit) {
				var pivotButtons = this.model.getPivotTableButtons(new asc_Range(c.col, r.row, c.col, r.row));
				var isPivot = pivotButtons.some(function (element) {
					return element.row === r.row && element.col === c.col;
				});
				this._drawElements(function (_vr, _offsetX, _offsetY) {
					if (isPivot) {
						if (_vr.contains(c.col, r.row) &&
							this._hitCursorFilterButton(x + _offsetX, y + _offsetY, c.col, r.row)) {
							res = {cursor: kCurAutoFilter, target: c_oTargetType.FilterObject, col: -1, row: -1};
						}
					} else {
						res = this.af_checkCursor(x, y, _vr, _offsetX, _offsetY, r, c);
					}
					return (null === res);
				});
				if (res) {
					return res;
				}
			}

			// Проверим есть ли комменты
			var comment = this.cellCommentator.getComment(c.col, r.row, true);
			var coords = null;
			var indexes = null;

			if (comment) {
				indexes = [comment.asc_getId()];
				coords = this.cellCommentator.getCommentTooltipPosition(comment);
			}

			// Проверим, может мы в гиперлинке
			oHyperlink = this.model.getHyperlinkByCell(r.row, c.col);
			cellCursor = {
				cursor: AscCommonExcel.kCurCells,
				target: c_oTargetType.Cells,
				col: (c ? c.col : -1),
				row: (r ? r.row : -1),
				userId: userId,
				lockRangePosLeft: lockRangePosLeft,
				lockRangePosTop: lockRangePosTop,
				userIdAllProps: userIdAllProps,
				lockAllPosLeft: lockAllPosLeft,
				lockAllPosTop: lockAllPosTop,
				userIdAllSheet: userIdAllSheet,
				commentIndexes: indexes,
				commentCoords: coords
			};
			if(null === oHyperlink) {
				var formulaParsed;
				this.model.getCell3(r.row, c.col)._foreachNoEmpty(function (cell) {
					if (cell.isFormula()) {
						formulaParsed = cell.getFormulaParsed();
					}
				});
				if (formulaParsed) {
					var formulaHyperlink = formulaParsed.getFormulaHyperlink();
					if (formulaHyperlink) {
						//запсускаю пересчет в связи с тем, что после открытия значение не рассчитано,
						// но показывать результат при наведении на ссылку нужно
						if(null === formulaParsed.value) {
							formulaParsed.calculate();
						}
						if(formulaParsed.value && formulaParsed.value.hyperlink) {
							oHyperlink = new AscCommonExcel.Hyperlink();
							oHyperlink.Hyperlink = formulaParsed.value.hyperlink;
						} else if(formulaParsed.value && AscCommonExcel.cElementType.array === formulaParsed.value.type) {
							var firstArrayElem = formulaParsed.value.getElementRowCol(0,0);
							if(firstArrayElem && firstArrayElem.hyperlink) {
								oHyperlink = new AscCommonExcel.Hyperlink();
								oHyperlink.Hyperlink = firstArrayElem.hyperlink;
							}
						}
					}
				}
			}

			if (null !== oHyperlink) {
				return {
					cursor: kCurHyperlink,
					target: c_oTargetType.Hyperlink,
					hyperlink: new asc_CHyperlink(oHyperlink),
					cellCursor: cellCursor,
					userId: userId,
					lockRangePosLeft: lockRangePosLeft,
					lockRangePosTop: lockRangePosTop,
					userIdAllProps: userIdAllProps,
					userIdAllSheet: userIdAllSheet,
					lockAllPosLeft: lockAllPosLeft,
					lockAllPosTop: lockAllPosTop,
					commentIndexes: indexes,
					commentCoords: coords
				};
			}
			return cellCursor;
		}

		return oResDefault;
	};

    WorksheetView.prototype._fixSelectionOfMergedCells = function (fixedRange, force) {
        var selection;
        var ar = fixedRange ? fixedRange : ((selection = this._getSelection()) ? selection.getLast() : null);
        if (!ar || (!force && c_oAscSelectionType.RangeCells !== ar.getType())) {
            return;
        }

        // ToDo - переделать этот момент!!!!
        var res = this.model.expandRangeByMerged(ar.clone(true));

        if (ar.c1 !== res.c1 && ar.c1 !== res.c2) {
            ar.c1 = ar.c1 <= ar.c2 ? res.c1 : res.c2;
        }
        ar.c2 = ar.c1 === res.c1 ? res.c2 : (res.c1);
        if (ar.r1 !== res.r1 && ar.r1 !== res.r2) {
            ar.r1 = ar.r1 <= ar.r2 ? res.r1 : res.r2;
        }
        ar.r2 = ar.r1 === res.r1 ? res.r2 : res.r1;
        ar.normalize();
        if (!fixedRange) {
			selection.update();
        }
    };

    WorksheetView.prototype._findVisibleCol = function (from, dc, flag) {
        var to = dc < 0 ? -1 : this.nColsCount, c;
        for (c = from; c !== to; c += dc) {
            if (0 < this._getColumnWidth(c)) {
                return c;
            }
        }
        return flag ? -1 : this._findVisibleCol(from, dc * -1, true);
    };
    WorksheetView.prototype._findVisibleRow = function (from, dr, flag) {
        var to = dr < 0 ? -1 : this.nRowsCount, r;
        for (r = from; r !== to; r += dr) {
            if (0 < this._getRowHeight(r)){
                return r;
            }
        }
        return flag ? -1 : this._findVisibleRow(from, dr * -1, true);
    };

    WorksheetView.prototype._fixSelectionOfHiddenCells = function (dc, dr, range) {
        var ar = (range) ? range : this.model.selectionRange.getLast(), c1, c2, r1, r2, mc, i, arn = ar.clone(true);

        if (dc === undefined) {
            dc = +1;
        }
        if (dr === undefined) {
            dr = +1;
        }

        if (ar.c2 === ar.c1) {
            if (0 === this._getColumnWidth(ar.c1)) {
                c1 = c2 = this._findVisibleCol(ar.c1, dc);
            }
        } else {
            if (0 !== dc && this.nColsCount > ar.c2 && 0 === this._getColumnWidth(ar.c2)) {
                // Проверка для одновременно замерженных и скрытых ячеек (A1:C1 merge, B:C hidden)
                for (mc = null, i = arn.r1; i <= arn.r2; ++i) {
                    mc = this.model.getMergedByCell(i, ar.c2);
                    if (mc) {
                        break;
                    }
                }
                if (!mc) {
                    c2 = this._findVisibleCol(ar.c2, dc);
                }
            }
        }
        if (c1 < 0 || c2 < 0) {
            throw "Error: all columns are hidden";
        }

        if (ar.r2 === ar.r1) {
            if (0 === this._getRowHeight(ar.r1)) {
                r1 = r2 = this._findVisibleRow(ar.r1, dr);
            }
        } else {
            if (0 !== dr && this.nRowsCount > ar.r2 && 0 === this._getRowHeight(ar.r2)) {
                //Проверка для одновременно замерженных и скрытых ячеек (A1:A3 merge, 2:3 hidden)
                for (mc = null, i = arn.c1; i <= arn.c2; ++i) {
                    mc = this.model.getMergedByCell(ar.r2, i);
                    if (mc) {
                        break;
                    }
                }
                if (!mc) {
                    r2 = this._findVisibleRow(ar.r2, dr);
                }
            }
        }
        if (r1 < 0 || r2 < 0) {
            throw "Error: all rows are hidden";
        }

        ar.assign(c1 !== undefined ? c1 : ar.c1, r1 !== undefined ? r1 : ar.r1, c2 !== undefined ? c2 : ar.c2,
          r2 !== undefined ? r2 : ar.r2);
    };

    WorksheetView.prototype._getCellByXY = function (x, y) {
		var c1, r1, c2, r2;

		if (x < this.cellsLeft && y < this.cellsTop) {
		    c1 = r1 = 0;
			c2 = gc_nMaxCol0;
			r2 = gc_nMaxRow0;
		} else if (x < this.cellsLeft) {
			r1 = r2 = this._findRowUnderCursor(y).row;
			c1 = 0;
			c2 = gc_nMaxCol0;
		} else if (y < this.cellsTop) {
			c1 = c2 = this._findColUnderCursor(x).col;
			r1 = 0;
			r2 = gc_nMaxRow0;
		} else {
			c1 = c2 = this._findColUnderCursor(x).col;
			r1 = r2 = this._findRowUnderCursor(y).row;
		}

		return new asc_Range(c1, r1, c2, r2);
    };

	WorksheetView.prototype._moveActiveCellToXY = function (x, y) {
		var selection = this._getSelection();
		var ar = selection.getLast();
		var range = this._getCellByXY(x, y);
		ar.assign(range.c1, range.r1, range.c2, range.r2);
		var r = range.r1, c = range.c1;
		switch (ar.getType()) {
			case c_oAscSelectionType.RangeCol:
				r = this.visibleRange.r1;
				break;
			case c_oAscSelectionType.RangeRow:
				c = this.visibleRange.c1;
				break;
			case c_oAscSelectionType.RangeMax:
				r = this.visibleRange.r1;
				c = this.visibleRange.c1;
			    break;
		}
		var force = selection.setCell(r, c);
		if (c_oAscSelectionType.RangeCells !== ar.getType()) {
			this._fixSelectionOfHiddenCells();
		}
		this._fixSelectionOfMergedCells(ar, force);
	};

    WorksheetView.prototype._moveActiveCellToOffset = function (activeCell, dc, dr) {
        var ar = this._getSelection().getLast();
        var mc = this.model.getMergedByCell(activeCell.row, activeCell.col);
        var c = mc ? (dc < 0 ? mc.c1 : dc > 0 ? Math.min(mc.c2, this.nColsCount - 1 - dc) : activeCell.col) :
          activeCell.col;
        var r = mc ? (dr < 0 ? mc.r1 : dr > 0 ? Math.min(mc.r2, this.nRowsCount - 1 - dr) : activeCell.row) :
          activeCell.row;
        var p = this._calcCellPosition(c, r, dc, dr);
        ar.assign(p.col, p.row, p.col, p.row);
        this.model.selectionRange.setCell(p.row, p.col);
        this._fixSelectionOfHiddenCells(dc >= 0 ? +1 : -1, dr >= 0 ? +1 : -1);
        this._fixSelectionOfMergedCells();
    };

    // Движение активной ячейки в выделенной области
    WorksheetView.prototype._moveActivePointInSelection = function (dc, dr) {
        var t = this, cell = this.model.selectionRange.activeCell;

        // Если мы на скрытой строке или ячейке, то двигаться в выделении нельзя (так делает и Excel)
        if (0 === this._getColumnWidth(cell.col) || 0 === this._getRowHeight(cell.row)) {
            return;
        }
        return this.model.selectionRange.offsetCell(dr, dc, true, function (row, col) {
            return (0 === ((0 <= row) ? t._getRowHeight(row) : t._getColumnWidth(col)));
        });
    };

	WorksheetView.prototype._calcSelectionEndPointByXY = function (x, y, keepType) {
		var activeCell = this._getSelection().activeCell;
		var range = this._getCellByXY(x, y);
		var res = (keepType ? this._getSelection().getLast() : range).clone();
		var type = res.getType();

		if (c_oAscSelectionType.RangeRow === type) {
			res.r1 = Math.min(range.r1, activeCell.row);
			res.r2 = Math.max(range.r1, activeCell.row);
        } else if (c_oAscSelectionType.RangeCol === type) {
			res.c1 = Math.min(range.c1, activeCell.col);
			res.c2 = Math.max(range.c1, activeCell.col);
		} else if (c_oAscSelectionType.RangeCells === type) {
			res.assign(activeCell.col, activeCell.row, range.c1, range.r1, true);
		}

		this._fixSelectionOfMergedCells(res);
		return res;
	};

    WorksheetView.prototype._calcSelectionEndPointByOffset = function (dc, dr) {
        var selection = this._getSelection();
        var ar = selection.getLast();
        var c1, r1, c2, r2, tmp;
        tmp = asc.getEndValueRange(dc, selection.activeCell.col, ar.c1, ar.c2);
        c1 = tmp.x1;
        c2 = tmp.x2;
        tmp = asc.getEndValueRange(dr, selection.activeCell.row, ar.r1, ar.r2);
        r1 = tmp.x1;
        r2 = tmp.x2;

        var p1 = this._calcCellPosition(c2, r2, dc, dr), p2;
        var res = new asc_Range(c1, r1, c2 = p1.col, r2 = p1.row, true);
        dc = Math.sign(dc);
        dr = Math.sign(dr);
        if (c_oAscSelectionType.RangeCells === ar.getType()) {
            this._fixSelectionOfMergedCells(res);
            while (ar.isEqual(res)) {
                p2 = this._calcCellPosition(c2, r2, dc, dr);
                res.assign(c1, r1, c2 = p2.col, r2 = p2.row, true);
                this._fixSelectionOfMergedCells(res);
                if (p1.c2 === p2.c2 && p1.r2 === p2.r2) {
                    break;
                }
                p1 = p2;
            }
        }
        var bIsHidden = false;
        if (0 !== dc && 0 === this._getColumnWidth(c2)) {
            c2 = this._findVisibleCol(c2, dc);
            bIsHidden = true;
        }
        if (0 !== dr && 0 === this._getRowHeight(r2)) {
            r2 = this._findVisibleRow(r2, dr);
            bIsHidden = true;
        }
        if (bIsHidden) {
            res.assign(c1, r1, c2, r2, true);
        }
        return res;
    };

    WorksheetView.prototype._calcActiveRangeOffsetIsCoord = function (x, y) {
        var ar = this._getSelection().getLast();
        if (this.isFormulaEditMode) {
            // Для формул нужно сделать ограничение по range (у нас хранится полный диапазон)
            if (ar.c2 >= this.nColsCount || ar.r2 >= this.nRowsCount) {
                ar = ar.clone(true);
                ar.c2 = (ar.c2 >= this.nColsCount) ? this.nColsCount - 1 : ar.c2;
                ar.r2 = (ar.r2 >= this.nRowsCount) ? this.nRowsCount - 1 : ar.r2;
            }
        }

        var d = new AscCommon.CellBase(0, 0);

        if (y <= this.cellsTop + 2) {
            d.row = -1;
        } else if (y >= this.drawingCtx.getHeight() - 2) {
            d.row = 1;
        }

        if (x <= this.cellsLeft + 2) {
            d.col = -1;
        } else if (x >= this.drawingCtx.getWidth() - 2) {
            d.col = 1;
        }

        var type = ar.getType();
        if (type === c_oAscSelectionType.RangeRow) {
            d.col = 0;
        } else if (type === c_oAscSelectionType.RangeCol) {
            d.row = 0;
        } else if (type === c_oAscSelectionType.RangeMax) {
            d.col = 0;
            d.row = 0;
        }

        return d;
    };

    WorksheetView.prototype._calcRangeOffset = function (range) {
        var vr = this.visibleRange;
        var ar = range || this._getSelection().getLast();
        if (this.isFormulaEditMode) {
            // Для формул нужно сделать ограничение по range (у нас хранится полный диапазон)
            if (ar.c2 >= this.nColsCount || ar.r2 >= this.nRowsCount) {
                ar = ar.clone(true);
                ar.c2 = (ar.c2 >= this.nColsCount) ? this.nColsCount - 1 : ar.c2;
                ar.r2 = (ar.r2 >= this.nRowsCount) ? this.nRowsCount - 1 : ar.r2;
            }
        }
        var arn = ar.clone(true);
        var isMC = this._isMergedCells(arn);
        var adjustRight = ar.c2 >= vr.c2 || ar.c1 >= vr.c2 && isMC;
        var adjustBottom = ar.r2 >= vr.r2 || ar.r1 >= vr.r2 && isMC;
        var incX = ar.c1 < vr.c1 && isMC ? arn.c1 - vr.c1 : ar.c2 < vr.c1 ? ar.c2 - vr.c1 : 0;
        var incY = ar.r1 < vr.r1 && isMC ? arn.r1 - vr.r1 : ar.r2 < vr.r1 ? ar.r2 - vr.r1 : 0;
        var type = ar.getType();

        var offsetFrozen = this.getFrozenPaneOffset();

        if (adjustRight) {
            while (this._isColDrawnPartially(isMC ? arn.c2 : ar.c2, vr.c1 + incX, offsetFrozen.offsetX)) {
                ++incX;
            }
        }
        if (adjustBottom) {
            while (this._isRowDrawnPartially(isMC ? arn.r2 : ar.r2, vr.r1 + incY, offsetFrozen.offsetY)) {
                ++incY;
            }
        }
		return new AscCommon.CellBase(type === c_oAscSelectionType.RangeRow || type === c_oAscSelectionType.RangeCells ?
			incY : 0, type === c_oAscSelectionType.RangeCol || type === c_oAscSelectionType.RangeCells ? incX : 0);
    };
	WorksheetView.prototype._scrollToRange = function (range) {
		var vr = this.visibleRange;
		var nRowsCount = this.nRowsCount;
		var nColsCount = this.nColsCount;
		var ar = range || this._getSelection().getLast();
		if (this.isFormulaEditMode) {
			// Для формул нужно сделать ограничение по range (у нас хранится полный диапазон)
			if (ar.c2 >= this.nColsCount || ar.r2 >= this.nRowsCount) {
				ar = ar.clone(true);
				ar.c2 = (ar.c2 >= this.nColsCount) ? this.nColsCount - 1 : ar.c2;
				ar.r2 = (ar.r2 >= this.nRowsCount) ? this.nRowsCount - 1 : ar.r2;
			}
		}
		var arn = ar.clone(true);

		var scroll = 0;
		if (arn.r1 < vr.r1) {
			scroll = arn.r1 - vr.r1;
		} else if (arn.r1 >= vr.r2) {
			this.nRowsCount = arn.r2 + 1 + 1;
			scroll = this.getVerticalScrollRange();
			if (scroll > arn.r1) {
				scroll = arn.r1;
			}
			scroll -= vr.r1 - (this.topLeftFrozenCell ? this.topLeftFrozenCell.getRow0() : 0);
			this.nRowsCount = nRowsCount;
		}
		if (scroll) {
			this.scrollType |= AscCommonExcel.c_oAscScrollType.ScrollVertical;
			this.scrollVertical(scroll, null, true);
		}

		scroll = 0;
		if (arn.c1 < vr.c1) {
			scroll = arn.c1 - vr.c1;
		} else if (arn.c1 >= vr.c2) {
			this.nColsCount = arn.c2 + 1 + 1;
			scroll = this.getHorizontalScrollRange();
			if (scroll > arn.c1) {
				scroll = arn.c1;
			}
			scroll -= vr.c1 - (this.topLeftFrozenCell ? this.topLeftFrozenCell.getCol0() : 0);
			this.nColsCount = nColsCount;
		}
		if (scroll) {
			this.scrollType |= AscCommonExcel.c_oAscScrollType.ScrollHorizontal;
			this.scrollHorizontal(scroll, null, true);
		}

		return null;
	};

    /**
     * @param {Range} [range]
     * @returns {AscCommon.CellBase}
     */
    WorksheetView.prototype._calcActiveCellOffset = function (range) {
        var vr = this.visibleRange;
        var activeCell = this.model.selectionRange.activeCell;
        var ar = range ? range : this.model.selectionRange.getLast();
        var mc = this.model.getMergedByCell(activeCell.row, activeCell.col);
        var startCol = mc ? mc.c1 : activeCell.col;
        var startRow = mc ? mc.r1 : activeCell.row;
        var incX = startCol < vr.c1 ? startCol - vr.c1 : 0;
        var incY = startRow < vr.r1 ? startRow - vr.r1 : 0;
		var type = ar.getType();

        var offsetFrozen = this.getFrozenPaneOffset();
        // adjustRight
        if (startCol >= vr.c2) {
            while (this._isColDrawnPartially(startCol, vr.c1 + incX, offsetFrozen.offsetX)) {
                ++incX;
            }
        }
        // adjustBottom
        if (startRow >= vr.r2) {
            while (this._isRowDrawnPartially(startRow, vr.r1 + incY, offsetFrozen.offsetY)) {
                ++incY;
            }
        }
		return new AscCommon.CellBase(type === c_oAscSelectionType.RangeRow || type === c_oAscSelectionType.RangeCells ?
			incY : 0, type === c_oAscSelectionType.RangeCol || type === c_oAscSelectionType.RangeCells ? incX : 0);
    };

    // Потеряем ли мы что-то при merge ячеек
    WorksheetView.prototype.getSelectionMergeInfo = function (options) {
        // ToDo now check only last selection range
		var t = this;
		var arn = this.model.selectionRange.getLast().clone(true);
		var range = this.model.getRange3(arn.r1, arn.c1, arn.r2, arn.c2);
		var lastRow = -1, res;

        if (this.cellCommentator.isMissComments(arn)) {
            return true;
        }

        switch (options) {
            case c_oAscMergeOptions.Merge:
            case c_oAscMergeOptions.MergeCenter:
				res = range._foreachNoEmptyByCol(function(cell) {
					if (false === t._isCellNullText(cell)) {
						if (-1 !== lastRow) {
							return true;
						}
						lastRow = cell.nRow;
					}
				});
                break;
            case c_oAscMergeOptions.MergeAcross:
				res = range._foreachNoEmpty(function(cell) {
					if (false === t._isCellNullText(cell)) {
						if (lastRow === cell.nRow) {
							return true;
						}
						lastRow = cell.nRow;
					}
				});
                break;
        }

        return !!res;
    };

	//нужно ли спрашивать пользователя о расширении диапазона
	WorksheetView.prototype.getSelectionSortInfo = function () {
		//в случае попытки сортировать мультиселект, необходимо выдавать ошибку
		var arn = this.model.selectionRange.getLast().clone(true);

		//null - не выдавать сообщение и не расширять, false - не выдавать сообщение и расширЯть, true - выдавать сообщение
		var bResult = false;

		//если внутри форматированной таблиц, никогда не выдаем сообщение
		if(this.model.autoFilters._isTablePartsContainsRange(arn))
		{
			bResult = null;
		}
		else if(!arn.isOneCell())//в случае одной выделенной ячейки - всегда не выдаём сообщение и автоматически расширяем
		{
			//если одна замерженная ячейка
			var cell = this.model.getRange3(arn.r1, arn.c1, arn.r2, arn.c2);
			var isMerged = cell.hasMerged();

			if(isMerged && isMerged.isEqual(arn)) {
				return false;
			}

			var colCount = arn.c2 - arn.c1 + 1;
			var rowCount = arn.r2 - arn.r1 + 1;
			//если выделено более одного столбца и более одной строки - не выдаем сообщение и не расширяем
			if(colCount > 1 && rowCount > 1)
			{
				bResult = null;
			}
			else
			{
				//далее проверяем есть ли смежные ячейки у startCol/startRow
				var activeCell = this.model.selectionRange.activeCell;
				var activeCellRange = new Asc.Range(activeCell.col, activeCell.row, activeCell.col, activeCell.row);

				var expandRange = this.model.autoFilters.expandRange(activeCellRange, true);
				expandRange = this.model.autoFilters.checkExpandRangeForSort(expandRange);

				//если диапазон не расширяется за счет близлежащих ячеек - не выдаем сообщение и не расширяем
				if(arn.isEqual(expandRange) || activeCellRange.isEqual(expandRange))
				{
					bResult = null;
				}
				else if(arn.c1 === expandRange.c1 && arn.c2 === expandRange.c2)
				{
					bResult = null;
				}
				else
				{
					bResult = true;
				}
			}
		}

		return bResult;
	};

    WorksheetView.prototype.getSelectionMathInfo = function () {
        var oSelectionMathInfo = new asc_CSelectionMathInfo();
        var sum = 0;
        var oExistCells = {};

		if (window["NATIVE_EDITOR_ENJINE"]) {
		    return oSelectionMathInfo;
		}

        var t = this;
        this.model.selectionRange.ranges.forEach(function (item) {
            var cellValue;
            var range = t.model.getRange3(item.r1, item.c1, item.r2, item.c2);
            range._setPropertyNoEmpty(null, null, function (cell, r) {
                var idCell = cell.nCol + '-' + cell.nRow;
                if (!oExistCells[idCell] && !cell.isNullTextString() && 0 < t._getRowHeight(r)) {
                    oExistCells[idCell] = true;
                    ++oSelectionMathInfo.count;
                    if (CellValueType.Number === cell.getType()) {
						cellValue = cell.getNumberValue();
                        if (0 === oSelectionMathInfo.countNumbers) {
                            oSelectionMathInfo.min = oSelectionMathInfo.max = cellValue;
                        } else {
                            oSelectionMathInfo.min = Math.min(oSelectionMathInfo.min, cellValue);
                            oSelectionMathInfo.max = Math.max(oSelectionMathInfo.max, cellValue);
                        }
                        ++oSelectionMathInfo.countNumbers;
                        sum += cellValue;
                    }
                }
            });
        });

        // Показываем только данные для 2-х или более ячеек (http://bugzilla.onlyoffice.com/show_bug.cgi?id=24115)
        if (1 < oSelectionMathInfo.count && 0 < oSelectionMathInfo.countNumbers) {
            // Мы должны отдавать в формате активной ячейки
			var activeCell = this.model.selectionRange.activeCell;
            var numFormat = this.model.getRange3(activeCell.row, activeCell.col,
				activeCell.row, activeCell.col).getNumFormat();
            if (Asc.c_oAscNumFormatType.Time === numFormat.getType()) {
                // Для времени нужно отдавать в формате [h]:mm:ss (http://bugzilla.onlyoffice.com/show_bug.cgi?id=26271)
                numFormat = AscCommon.oNumFormatCache.get('[h]:mm:ss');
            }

            oSelectionMathInfo.sum =
              numFormat.formatToMathInfo(sum, CellValueType.Number, this.settings.mathMaxDigCount);
            oSelectionMathInfo.average =
              numFormat.formatToMathInfo(sum / oSelectionMathInfo.countNumbers, CellValueType.Number,
                this.settings.mathMaxDigCount);

            oSelectionMathInfo.min =
              numFormat.formatToMathInfo(oSelectionMathInfo.min, CellValueType.Number, this.settings.mathMaxDigCount);
            oSelectionMathInfo.max =
              numFormat.formatToMathInfo(oSelectionMathInfo.max, CellValueType.Number, this.settings.mathMaxDigCount);
        }
        return oSelectionMathInfo;
    };

    WorksheetView.prototype.getSelectionName = function (bRangeText) {
        if (this.isSelectOnShape) {
            return " ";
        }	// Пока отправим пустое имя(с пробелом, пустое не воспринимаем в меню..) ToDo

        var ar = this.model.selectionRange.getLast();
        var cell = this.model.selectionRange.activeCell;
        var mc = this.model.getMergedByCell(cell.row, cell.col);
        var c1 = mc ? mc.c1 : cell.col, r1 = mc ? mc.r1 : cell.row, ar_norm = ar.normalize(), mc_norm = mc ?
          mc.normalize() : null, c2 = mc_norm ? mc_norm.isEqual(ar_norm) ? mc_norm.c1 : ar_norm.c2 :
          ar_norm.c2, r2 = mc_norm ? mc_norm.isEqual(ar_norm) ? mc_norm.r1 : ar_norm.r2 :
          ar_norm.r2, selectionSize = !bRangeText ? "" : (function (r) {
            var rc = Math.abs(r.r2 - r.r1) + 1;
            var cc = Math.abs(r.c2 - r.c1) + 1;
            switch (r.getType()) {
                case c_oAscSelectionType.RangeCells:
                    return rc + "R x " + cc + "C";
                case c_oAscSelectionType.RangeCol:
                    return cc + "C";
                case c_oAscSelectionType.RangeRow:
                    return rc + "R";
                case c_oAscSelectionType.RangeMax:
                    return gc_nMaxRow + "R x " + gc_nMaxCol + "C";
            }
            return "";
        })(ar);
        if (selectionSize) {
            return selectionSize;
        }

        var dN = new Asc.Range(ar_norm.c1, ar_norm.r1, c2, r2, true);
        var defName = parserHelp.get3DRef(this.model.getName(), dN.getAbsName());
        defName = this.model.workbook.findDefinesNames(defName, this.model.getId(), true);
        if (defName) {
            return defName;
        }

        return (new Asc.Range(c1, r1, c1, r1)).getName(AscCommonExcel.g_R1C1Mode ?
			AscCommonExcel.referenceType.A : AscCommonExcel.referenceType.R);
    };

    WorksheetView.prototype.getSelectionRangeValues = function () {
        var ret = [];
        var aRanges = this.model.selectionRange.ranges;
        for(var  i = 0; i < aRanges.length; ++i)
        {
            ret.push(this._getRangeValue(aRanges[i].clone(true)))
        }
        return ret;
    };


    WorksheetView.prototype.getSelectionRangeValue = function () {
		// ToDo проблема с выбором целого столбца/строки
		return this._getRangeValue(this.model.selectionRange.getLast().clone(true));
	};


    WorksheetView.prototype._getRangeValue = function (ar) {
        // ToDo проблема с выбором целого столбца/строки
        var sAbsName = ar.getAbsName();
		var sName = (c_oAscSelectionDialogType.FormatTable === this.selectionDialogType ||
		c_oAscSelectionDialogType.CustomSort === this.selectionDialogType) ? sAbsName :
			parserHelp.get3DRef(this.model.getName(), sAbsName);
        var type = ar.type;
        var selectionRangeValueObj = new AscCommonExcel.asc_CSelectionRangeValue();
        selectionRangeValueObj.asc_setName(sName);
        selectionRangeValueObj.asc_setType(type);

        return selectionRangeValueObj;
    };

    WorksheetView.prototype.getSelectionInfo = function () {
        return this.objectRender.selectedGraphicObjectsExists() ? this._getSelectionInfoObject() :
          this._getSelectionInfoCell();
    };

    WorksheetView.prototype._getSelectionInfoCell = function () {
        var selectionRange = this.model.selectionRange;
        var cell = selectionRange.activeCell;
        var mc = this.model.getMergedByCell(cell.row, cell.col);
        var c1 = mc ? mc.c1 : cell.col;
        var r1 = mc ? mc.r1 : cell.row;
        var c = this._getVisibleCell(c1, r1);
		var font = c.getFont(true);
		var fa = font.getVerticalAlign();
        var bg = c.getFillColor();
        var align = c.getAlign();
        var cellType = c.getType();
        var isNumberFormat = (!cellType || CellValueType.Number === cellType);

        var cell_info = new asc_CCellInfo();
        cell_info.formula = c.getFormula();

		AscCommonExcel.g_ActiveCell = new Asc.Range(c1, r1, c1, r1);
        cell_info.text = c.getValueForEdit(true);

		cell_info.halign = align.getAlignHorizontal();
		cell_info.valign = align.getAlignVertical();

        var tablePartsOptions = selectionRange.isSingleRange() ?
          this.model.autoFilters.searchRangeInTableParts(selectionRange.getLast()) : -2;
        var curTablePart = tablePartsOptions >= 0 ? this.model.TableParts[tablePartsOptions] : null;
        var tableStyleInfo = curTablePart && curTablePart.TableStyleInfo ? curTablePart.TableStyleInfo : null;

        cell_info.autoFilterInfo = new asc_CAutoFilterInfo();
        if (-2 === tablePartsOptions || this.model.inPivotTable(selectionRange.getLast())) {
            cell_info.autoFilterInfo.isAutoFilter = null;
            cell_info.autoFilterInfo.isApplyAutoFilter = false;
        } else {
            var checkApplyFilterOrSort = this.model.autoFilters.checkApplyFilterOrSort(tablePartsOptions);
            cell_info.autoFilterInfo.isAutoFilter = checkApplyFilterOrSort.isAutoFilter;
            cell_info.autoFilterInfo.isApplyAutoFilter = checkApplyFilterOrSort.isFilterColumns;
        }

        if (curTablePart !== null) {
            cell_info.formatTableInfo = new AscCommonExcel.asc_CFormatTableInfo();
            cell_info.formatTableInfo.tableName = curTablePart.DisplayName;

            if (tableStyleInfo) {
                cell_info.formatTableInfo.tableStyleName = tableStyleInfo.Name;

                cell_info.formatTableInfo.bandVer = tableStyleInfo.ShowColumnStripes;
                cell_info.formatTableInfo.firstCol = tableStyleInfo.ShowFirstColumn;
                cell_info.formatTableInfo.lastCol = tableStyleInfo.ShowLastColumn;

                cell_info.formatTableInfo.bandHor = tableStyleInfo.ShowRowStripes;
            }
            cell_info.formatTableInfo.lastRow = curTablePart.TotalsRowCount !== null;
            cell_info.formatTableInfo.firstRow = curTablePart.HeaderRowCount === null;
            cell_info.formatTableInfo.tableRange = curTablePart.Ref.getAbsName();
            cell_info.formatTableInfo.filterButton = curTablePart.isShowButton();

			cell_info.formatTableInfo.altText = curTablePart.altText;
            cell_info.formatTableInfo.altTextSummary = curTablePart.altTextSummary;

            this.af_setDisableProps(curTablePart, cell_info.formatTableInfo);
        }

        cell_info.styleName = c.getStyleName();
        cell_info.angle = align.getAngle();

        cell_info.flags = new AscCommonExcel.asc_CCellFlag();
        cell_info.flags.shrinkToFit = align.getShrinkToFit();
        cell_info.flags.wrapText = align.getWrap();

        // ToDo activeRange type
        cell_info.flags.selectionType = selectionRange.getLast().getType();
        cell_info.flags.multiselect = !selectionRange.isSingleRange();

        cell_info.flags.lockText = ("" !== cell_info.text && (isNumberFormat || "" !== cell_info.formula));

        cell_info.font = new asc_CFont();
		cell_info.font.name = font.getName();
		cell_info.font.size = font.getSize();
		cell_info.font.bold = font.getBold();
		cell_info.font.italic = font.getItalic();
		// ToDo убрать, когда будет реализовано двойное подчеркивание
		cell_info.font.underline = (Asc.EUnderline.underlineNone !== font.getUnderline());
		cell_info.font.strikeout = font.getStrikeout();
		cell_info.font.subscript = fa === AscCommon.vertalign_SubScript;
		cell_info.font.superscript = fa === AscCommon.vertalign_SuperScript;
        cell_info.font.color = asc_obj2Color(font.getColor());

        cell_info.fill = new asc_CFill((null != bg) ? asc_obj2Color(bg) : bg);
		cell_info.fill2 = c.getFill().clone();

		cell_info.numFormat = c.getNumFormatStr();
        cell_info.numFormatInfo = c.getNumFormatTypeInfo();

        // Получаем гиперссылку (//ToDo)
        var ar = selectionRange.getLast().clone();
        var range = this.model.getRange3(ar.r1, ar.c1, ar.r2, ar.c2);
        var hyperlink = range.getHyperlink();
        var oHyperlink;
        if (null !== hyperlink) {
            // Гиперлинк
            oHyperlink = new asc_CHyperlink(hyperlink);
            oHyperlink.asc_setText(cell_info.text);
            cell_info.hyperlink = oHyperlink;
        } else {
            cell_info.hyperlink = null;
        }

        cell_info.comment = this.cellCommentator.getComment(c1, r1, false);
		cell_info.flags.merge = range.isOneCell() ? Asc.c_oAscMergeOptions.Disabled :
			null !== range.hasMerged() ? Asc.c_oAscMergeOptions.Merge : Asc.c_oAscMergeOptions.None;

        var sheetId = this.model.getId();
		var lockInfo;
        // Пересчет для входящих ячеек в добавленные строки/столбцы
        var isIntersection = this._recalcRangeByInsertRowsAndColumns(sheetId, ar);
        if (false === isIntersection) {
			lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Range, /*subType*/null, sheetId,
              new AscCommonExcel.asc_CCollaborativeRange(ar.c1, ar.r1, ar.c2, ar.r2));

            if (false !== this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther,
                /*bCheckOnlyLockAll*/false)) {
                // Уже ячейку кто-то редактирует
                cell_info.isLocked = true;
            }
        }

		if (null !== curTablePart) {
			var tableAr = curTablePart.Ref.clone();
			isIntersection = this._recalcRangeByInsertRowsAndColumns(sheetId, tableAr);
			if (false === isIntersection) {
				lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Range, /*subType*/null, sheetId,
					new AscCommonExcel.asc_CCollaborativeRange(tableAr.c1, tableAr.r1, tableAr.c2, tableAr.r2));

				if (false !== this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther,
						/*bCheckOnlyLockAll*/false)) {
					// Уже таблицу кто-то редактирует
					cell_info.isLockedTable = true;
				}
			}
		}

        cell_info.sparklineInfo = this.model.getSparklineGroup(c1, r1);
		if (cell_info.sparklineInfo) {
			lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, /*subType*/null, sheetId,
				cell_info.sparklineInfo.Get_Id());
			if (false !== this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther,
					/*bCheckOnlyLockAll*/false)) {
				cell_info.isLockedSparkline = true;
			}
		}

		cell_info.pivotTableInfo = this.model.getPivotTable(c1, r1);
		if (cell_info.pivotTableInfo) {
			lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, /*subType*/null, sheetId,
				cell_info.pivotTableInfo.asc_getName());
			if (false !== this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther,
                    /*bCheckOnlyLockAll*/false)) {
				cell_info.isLockedPivotTable = true;
			}
		}

		cell_info.dataValidation = this.model.getDataValidation(c1, r1);

		lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, /*subType*/null, sheetId, AscCommonExcel.c_oAscHeaderFooterEdit);
		if (false !== this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther, /*bCheckOnlyLockAll*/false)) {
			cell_info.isLockedHeaderFooter = true;
		}

		cell_info.selectedColsCount = Math.abs(ar.c2 - ar.c1) + 1;

        return cell_info;
	};

    WorksheetView.prototype._getSelectionInfoObject = function () {
        var objectInfo = new asc_CCellInfo();

        objectInfo.flags = new AscCommonExcel.asc_CCellFlag();
        var graphicObjects = this.objectRender.getSelectedGraphicObjects();
        if (graphicObjects.length) {
            objectInfo.flags.selectionType = this.objectRender.getGraphicSelectionType(graphicObjects[0].Id);
        }

        var textPr = this.objectRender.controller.getParagraphTextPr();
        var theme = this.objectRender.controller.getTheme();
        if (textPr && theme && theme.themeElements && theme.themeElements.fontScheme) {
            textPr.ReplaceThemeFonts(theme.themeElements.fontScheme);
        }

        var paraPr = this.objectRender.controller.getParagraphParaPr();
        if (!paraPr && textPr) {
            paraPr = new CParaPr();
        }
        if (textPr && paraPr) {
            objectInfo.text = this.objectRender.controller.GetSelectedText(true);

            var horAlign = paraPr.Jc;
            var vertAlign = Asc.c_oAscVAlign.Center;
            var shape_props = this.objectRender.controller.getDrawingProps().shapeProps;
            var angle = null;
            if (shape_props) {
                switch (shape_props.verticalTextAlign) {
                    case AscFormat.VERTICAL_ANCHOR_TYPE_BOTTOM:
                        vertAlign = Asc.c_oAscVAlign.Bottom;
                        break;
                    case AscFormat.VERTICAL_ANCHOR_TYPE_CENTER:
                        vertAlign = Asc.c_oAscVAlign.Center;
                        break;

                    case AscFormat.VERTICAL_ANCHOR_TYPE_TOP:
                    case AscFormat.VERTICAL_ANCHOR_TYPE_DISTRIBUTED:
                    case AscFormat.VERTICAL_ANCHOR_TYPE_JUSTIFIED:
                        vertAlign = Asc.c_oAscVAlign.Top;
                        break;
                }
                switch (shape_props.vert) {
                    case AscFormat.nVertTTvert:
                        angle = 90;
                        break;
                    case AscFormat.nVertTTvert270:
                        angle = 270;
                        break;
                    default:
                        angle = 0;
                        break;
                }

            }

            objectInfo.halign = horAlign;
            objectInfo.valign = vertAlign;
            objectInfo.angle = angle;

            objectInfo.font = new asc_CFont();
            objectInfo.font.name = textPr.FontFamily ? textPr.FontFamily.Name : null;
            objectInfo.font.size = textPr.FontSize;
            objectInfo.font.bold = textPr.Bold;
            objectInfo.font.italic = textPr.Italic;
            objectInfo.font.underline = textPr.Underline;
            objectInfo.font.strikeout = textPr.Strikeout;
            objectInfo.font.subscript = textPr.VertAlign == AscCommon.vertalign_SubScript;
            objectInfo.font.superscript = textPr.VertAlign == AscCommon.vertalign_SuperScript;
            if(textPr.Unifill){
                if(theme){
                    textPr.Unifill.check(theme, this.objectRender.controller.getColorMap());
                }
                var oColor = textPr.Unifill.getRGBAColor();
                objectInfo.font.color = AscCommon.CreateAscColorCustom(oColor.R, oColor.G, oColor.B);
            }
            else if (textPr.Color) {
                objectInfo.font.color = AscCommon.CreateAscColorCustom(textPr.Color.r, textPr.Color.g, textPr.Color.b);
            }

            var shapeHyperlink = this.objectRender.controller.getHyperlinkInfo();
            if (shapeHyperlink && (shapeHyperlink instanceof ParaHyperlink)) {

                var hyperlink = new AscCommonExcel.Hyperlink();
                hyperlink.Tooltip = shapeHyperlink.ToolTip;

                var spl = shapeHyperlink.Value.split("!");
                if (spl.length === 2) {
                    hyperlink.setLocation(shapeHyperlink.Value);
                } else {
                    hyperlink.Hyperlink = shapeHyperlink.Value;
                }

                objectInfo.hyperlink = new asc_CHyperlink(hyperlink);
                objectInfo.hyperlink.asc_setText(shapeHyperlink.GetSelectedText(true, true));
            }
        } else {
            // Может быть не задано текста, поэтому выставим по умолчанию
            objectInfo.font = new asc_CFont();
            objectInfo.font.name = null;
            objectInfo.font.size = null;
        }

        // Заливка не нужна как таковая
        objectInfo.fill = new asc_CFill(null);

        // ToDo locks

        return objectInfo;
    };

    // Получаем координаты активной ячейки
    WorksheetView.prototype.getActiveCellCoord = function () {
        return this.getCellCoord(this.model.selectionRange.activeCell.col, this.model.selectionRange.activeCell.row);
    };
    WorksheetView.prototype.getCellCoord = function (col, row) {
        var offsetX = 0, offsetY = 0;
        var vrCol = this.visibleRange.c1, vrRow = this.visibleRange.r1;
        if ( this.topLeftFrozenCell ) {
            var offsetFrozen = this.getFrozenPaneOffset();
            var cFrozen = this.topLeftFrozenCell.getCol0();
            var rFrozen = this.topLeftFrozenCell.getRow0();
            if ( col >= cFrozen ) {
                offsetX = offsetFrozen.offsetX;
            }
            else {
                vrCol = 0;
            }

            if ( row >= rFrozen ) {
                offsetY = offsetFrozen.offsetY;
            }
            else {
                vrRow = 0;
            }
        }

        var xL = this._getColLeft(col);
        var yL = this._getRowTop(row);
        // Пересчитываем X и Y относительно видимой области
        xL -= (this._getColLeft(vrCol) - this.cellsLeft);
        yL -= (this._getRowTop(vrRow) - this.cellsTop);
        // Пересчитываем X и Y относительно закрепленной области
        xL += offsetX;
        yL += offsetY;

        var width = this._getColumnWidth(col);
        var height = this._getRowHeight(row);

        if ( AscBrowser.isRetina ) {
            xL = AscCommon.AscBrowser.convertToRetinaValue(xL);
            yL = AscCommon.AscBrowser.convertToRetinaValue(yL);
            width = AscCommon.AscBrowser.convertToRetinaValue(width);
            height = AscCommon.AscBrowser.convertToRetinaValue(height);
        }

        return new AscCommon.asc_CRect( xL, yL, width, height );
    };

    WorksheetView.prototype._endSelectionShape = function () {
        var isSelectOnShape = this.isSelectOnShape;
        if (this.isSelectOnShape) {
            this.isSelectOnShape = false;
            this.objectRender.unselectDrawingObjects();
			window['AscCommon'].g_specialPasteHelper.SpecialPasteButton_Update_Position();
        }
        return isSelectOnShape;
    };

    WorksheetView.prototype._updateSelectionNameAndInfo = function () {
        this.handlers.trigger("selectionNameChanged", this.getSelectionName(/*bRangeText*/false));
        this.handlers.trigger("selectionChanged");
        this.handlers.trigger("selectionMathInfoChanged", this.getSelectionMathInfo());
    };

    WorksheetView.prototype.getSelectionShape = function () {
        return this.isSelectOnShape;
    };
    WorksheetView.prototype.setSelectionShape = function ( isSelectOnShape ) {
        this.isSelectOnShape = isSelectOnShape;
        // отправляем евент для получения свойств картинки, шейпа или группы
        this.model.workbook.handlers.trigger( "asc_onHideComment" );
        this._updateSelectionNameAndInfo();

		window['AscCommon'].g_specialPasteHelper.SpecialPasteButton_Update_Position();
    };
    WorksheetView.prototype.setSelection = function (range) {
    	if (!Array.isArray(range)) {
    		range = [AscCommonExcel.Range.prototype.createFromBBox(this.model, range)];
		}

		this.cleanSelection();

		var bbox, bFirst = true;
		for (var i = 0; i < range.length; ++i) {
			bbox = range[i].getBBox0();
			var type = bbox.getType();
			if (type === c_oAscSelectionType.RangeCells || type === c_oAscSelectionType.RangeCol ||
				type === c_oAscSelectionType.RangeRow || type === c_oAscSelectionType.RangeMax) {
				if (bFirst) {
					this.model.selectionRange.clean();
					bFirst = false;
				} else {
					this.model.selectionRange.addRange();
				}
				this.model.selectionRange.getLast().assign2(bbox);
			}
		}
		if (!bFirst) {
			this.model.selectionRange.update();
		}

		this._fixSelectionOfMergedCells();
		this.updateSelectionWithSparklines();

		this._updateSelectionNameAndInfo();
		this._scrollToRange();
    };

	WorksheetView.prototype.changeSelectionStartPoint = function (x, y, isCoord, isCtrl) {
		this.cleanSelection();

		var activeCell = this._getSelection().activeCell.clone();

		if (!this.isFormulaEditMode) {
			this.cleanFormulaRanges();
			if (isCtrl) {
				this.model.selectionRange.addRange();
			} else {
				this.model.selectionRange.clean();
			}
		}
		var ar = this._getSelection().getLast().clone();
		var ret = {};
		var isChangeSelectionShape = false;

		var comment;
		if (isCoord) {
			comment = this.cellCommentator.getCommentByXY(x, y, true);
			// move active range to coordinates x,y
			this._moveActiveCellToXY(x, y);
			isChangeSelectionShape = this._endSelectionShape();
		} else {
			comment = this.cellCommentator.getComment(x, y, true);
			// move active range to offset x,y
			this._moveActiveCellToOffset(activeCell, x, y);
			ret = this._calcRangeOffset();
		}

		if (!comment) {
			this.cellCommentator.resetLastSelectedId();
		}

		if (this.isSelectionDialogMode) {
			if (!this.model.selectionRange.isEqual(ar)) {
				// Смена диапазона
				this.handlers.trigger("selectionRangeChanged", this.getSelectionRangeValue());
			}
		} else if (!this.isCellEditMode) {
			if (isChangeSelectionShape || !this.model.selectionRange.isEqual(ar)) {
				this.handlers.trigger("selectionNameChanged", this.getSelectionName(/*bRangeText*/false));
				if (!isCoord) {
					this.handlers.trigger("selectionChanged");
					this.handlers.trigger("selectionMathInfoChanged", this.getSelectionMathInfo());
				}
			}
		}

		if (!isChangeSelectionShape) {
			if (!isCoord) {
				this.updateSelectionWithSparklines();
			} else {
				this._drawSelection();
			}
		}

		//ToDo this.drawDepCells();

		return ret;
	};

    // Смена селекта по нажатию правой кнопки мыши
    WorksheetView.prototype.changeSelectionStartPointRightClick = function (x, y, target) {
        var isSelectOnShape = this._endSelectionShape();
        this.model.workbook.handlers.trigger("asc_onHideComment");

        var val, c1, c2, r1, r2, range;
        val = this._findColUnderCursor(x, true);
        if (val) {
            c1 = c2 = val.col;
            if (c_oTargetType.ColumnResize === target && 0 < c1 && 0 === this._getColumnWidth(c1 - 1)) {
				c1 = c2 = c1 - 1;
            }
        } else {
            c1 = 0;
            c2 = gc_nMaxCol0;
        }
        val = this._findRowUnderCursor(y, true);
        if (val) {
            r1 = r2 = val.row;
			if (c_oTargetType.RowResize === target && 0 < r1 && 0 === this._getRowHeight(r1 - 1)) {
				r1 = r2 = r1 - 1;
			}
        } else {
            r1 = 0;
            r2 = gc_nMaxRow0;
        }

		range = new asc_Range(c1, r1, c2, r2);
        if (!this.model.selectionRange.containsRange(range)) {
            // Не попали в выделение (меняем первую точку)
            this.cleanSelection();
            this.model.selectionRange.clean();
			this.setSelection(range);
            this._drawSelection();

            this._updateSelectionNameAndInfo();
        } else if (isSelectOnShape) {
			this._updateSelectionNameAndInfo();
        }
    };

    /**
     *
     * @param x - координата или прибавка к column
     * @param y - координата или прибавка к row
     * @param isCoord - выделение с помощью мышки или с клавиатуры. При выделении с помощью мышки, не нужно отправлять эвенты о смене выделения и информации
     * @param keepType
     * @returns {*}
     */
    WorksheetView.prototype.changeSelectionEndPoint = function (x, y, isCoord, keepType) {
        var isChangeSelectionShape = isCoord ? this._endSelectionShape() : false;
        var ar = this._getSelection().getLast();

		var newRange = isCoord ? this._calcSelectionEndPointByXY(x, y, keepType) :
			this._calcSelectionEndPointByOffset(x, y);
        var isEqual = newRange.isEqual(ar);
        if (isEqual && !isCoord) {
            // При движении стрелками можем попасть на замерженную ячейку
        }
        if (!isEqual || isChangeSelectionShape) {
            this.cleanSelection();
            ar.assign2(newRange);
            this._drawSelection();

            //ToDo this.drawDepCells();

            if (!this.isCellEditMode) {
                if (!this.isSelectionDialogMode) {
                    this.handlers.trigger("selectionNameChanged", this.getSelectionName(/*bRangeText*/true));
                    if (!isCoord) {
                        this.handlers.trigger("selectionChanged");
                        this.handlers.trigger("selectionMathInfoChanged", this.getSelectionMathInfo());
                    }
                } else {
                    // Смена диапазона
                    this.handlers.trigger("selectionRangeChanged", this.getSelectionRangeValue());
                }
            }
        }

        this.model.workbook.handlers.trigger("asc_onHideComment");

        return isCoord ? this._calcActiveRangeOffsetIsCoord(x, y) : this._calcRangeOffset();
    };

    // Окончание выделения
    WorksheetView.prototype.changeSelectionDone = function () {
        if (this.stateFormatPainter) {
            this.applyFormatPainter();
		} else {
			this.checkSelectionSparkline();
        }
    };

    // Обработка движения в выделенной области
    WorksheetView.prototype.changeSelectionActivePoint = function (dc, dr) {
        var ret, res;
        if (0 === dc && 0 === dr) {
            return this._calcActiveCellOffset();
        }
		res = this._moveActivePointInSelection(dc, dr);
        if (0 === res) {
            return this.changeSelectionStartPoint(dc, dr, /*isCoord*/false, false);
        } else if (-1 === res) {
            return null;
        }

        // Очищаем выделение
        this.cleanSelection();
        // Перерисовываем
        this.updateSelectionWithSparklines();

        // Смотрим, ушли ли мы за границу видимой области
        ret = this._calcActiveCellOffset();

        // Эвент обновления
        this.handlers.trigger("selectionNameChanged", this.getSelectionName(/*bRangeText*/false));
        this.handlers.trigger("selectionChanged");

        return ret;
    };

	WorksheetView.prototype.checkSelectionSparkline = function () {
		if (!this.getSelectionShape() && !this.isFormulaEditMode && !this.isCellEditMode) {
			var cell = this.model.selectionRange.activeCell;
			var mc = this.model.getMergedByCell(cell.row, cell.col);
			var c1 = mc ? mc.c1 : cell.col;
			var r1 = mc ? mc.r1 : cell.row;
			var oSparklineInfo = this.model.getSparklineGroup(c1, r1);
			if (oSparklineInfo) {
				this.cleanSelection();
				this.cleanFormulaRanges();
				var range = oSparklineInfo.getLocationRanges();
				range.ranges.forEach(function (item) {
					item.isName = true;
					item.noColor = true;
				});
				this.arrActiveFormulaRanges.push(range);
				this._drawSelection();
				return true;
			}
		}
	};


    // ----- Changing cells -----

    WorksheetView.prototype.applyFormatPainter = function () {
        var t = this;
        var from = t.handlers.trigger('getRangeFormatPainter').getLast(), to = this.model.selectionRange.getLast().clone();
        var onApplyFormatPainterCallback = function (isSuccess) {
            // Очищаем выделение
            t.cleanSelection();

            if (true === isSuccess) {
                AscCommonExcel.promoteFromTo(from, t.model, to, t.model);
            }

            // Сбрасываем параметры
            if (c_oAscFormatPainterState.kMultiple !== t.stateFormatPainter) {
                t.handlers.trigger('onStopFormatPainter');
            }

			t._updateRange(to);
            // Перерисовываем
			t.draw();
        };

        var result = AscCommonExcel.preparePromoteFromTo(from, to);
        if (!result) {
            // ToDo вывести ошибку
            onApplyFormatPainterCallback(false);
            return;
        }

        this._isLockedCells(to, null, onApplyFormatPainterCallback);
    };
    WorksheetView.prototype.formatPainter = function (stateFormatPainter) {
        // Если передали состояние, то выставляем его. Если нет - то меняем на противоположное.
        this.stateFormatPainter = (null != stateFormatPainter) ? stateFormatPainter :
          ((c_oAscFormatPainterState.kOff !== this.stateFormatPainter) ? c_oAscFormatPainterState.kOff :
            c_oAscFormatPainterState.kOn);

        if (this.stateFormatPainter) {
            this.copyActiveRange = this.model.selectionRange.clone();
            this._drawFormatPainterRange();
        } else {
            this.cleanSelection();
            this.copyActiveRange = null;
            this._drawSelection();
        }
        return this.copyActiveRange;
    };

    /* Функция для работы автозаполнения (selection). (x, y) - координаты точки мыши на области */
    WorksheetView.prototype.changeSelectionFillHandle = function (x, y) {
        // Возвращаемый результат
        var ret = null;
        // Если мы только первый раз попали сюда, то копируем выделенную область
        if (null === this.activeFillHandle) {
            this.activeFillHandle = this.model.selectionRange.getLast().clone();
            // Для первого раза нормализуем (т.е. первая точка - это левый верхний угол)
            this.activeFillHandle.normalize();
            return ret;
        }

        // Очищаем выделение, будем рисовать заново
        this.cleanSelection();
        // Копируем выделенную область
        var ar = this.model.selectionRange.getLast().clone(true);
        // Получаем координаты левого верхнего угла выделения
        var xL = this._getColLeft(ar.c1);
        var yL = this._getRowTop(ar.r1);
        // Получаем координаты правого нижнего угла выделения
        var xR = this._getColLeft(ar.c2 + 1);
        var yR = this._getRowTop(ar.r2 + 1);

        // range для пересчета видимой области
        var activeFillHandleCopy;

        // Колонка по X и строка по Y
        var colByX = this._findColUnderCursor(x, /*canReturnNull*/false, true).col;
        var rowByY = this._findRowUnderCursor(y, /*canReturnNull*/false, true).row;
        // Колонка по X и строка по Y (без половинчатого счета). Для сдвига видимой области
        var colByXNoDX = this._findColUnderCursor(x, /*canReturnNull*/false, false).col;
        var rowByYNoDY = this._findRowUnderCursor(y, /*canReturnNull*/false, false).row;
        // Сдвиг в столбцах и строках от крайней точки
        var dCol;
        var dRow;

        // Пересчитываем X и Y относительно видимой области
        x += (this._getColLeft(this.visibleRange.c1) - this.cellsLeft);
        y += (this._getRowTop(this.visibleRange.r1) - this.cellsTop);

        // Вычисляем расстояние от (x, y) до (xL, yL)
        var dXL = x - xL;
        var dYL = y - yL;
        // Вычисляем расстояние от (x, y) до (xR, yR)
        var dXR = x - xR;
        var dYR = y - yR;
        var dXRMod;
        var dYRMod;

        // Определяем область попадания и точку
        /*
         (1)					(2)					(3)

         ------------|-----------------------|------------
         |						|
         (4)		|			(5)			|		(6)
         |						|
         ------------|-----------------------|------------

         (7)					(8)					(9)
         */

        // Область точки (x, y)
        var _tmpArea = 0;
        if (dXR <= 0) {
            // Области (1), (2), (4), (5), (7), (8)
            if (dXL <= 0) {
                // Области (1), (4), (7)
                if (dYR <= 0) {
                    // Области (1), (4)
                    if (dYL <= 0) {
                        // Область (1)
                        _tmpArea = 1;
                    } else {
                        // Область (4)
                        _tmpArea = 4;
                    }
                } else {
                    // Область (7)
                    _tmpArea = 7;
                }
            } else {
                // Области (2), (5), (8)
                if (dYR <= 0) {
                    // Области (2), (5)
                    if (dYL <= 0) {
                        // Область (2)
                        _tmpArea = 2;
                    } else {
                        // Область (5)
                        _tmpArea = 5;
                    }
                } else {
                    // Область (3)
                    _tmpArea = 8;
                }
            }
        } else {
            // Области (3), (6), (9)
            if (dYR <= 0) {
                // Области (3), (6)
                if (dYL <= 0) {
                    // Область (3)
                    _tmpArea = 3;
                } else {
                    // Область (6)
                    _tmpArea = 6;
                }
            } else {
                // Область (9)
                _tmpArea = 9;
            }
        }

        // Проверяем, в каком направлении движение
        switch (_tmpArea) {
            case 2:
            case 8:
                // Двигаемся по вертикали.
                this.fillHandleDirection = 1;
                break;
            case 4:
            case 6:
                // Двигаемся по горизонтали.
                this.fillHandleDirection = 0;
                break;
            case 1:
                // Сравниваем расстояния от точки до левого верхнего угла выделения
                dXRMod = Math.abs(x - xL);
                dYRMod = Math.abs(y - yL);
                // Сдвиги по столбцам и строкам
                dCol = Math.abs(colByX - ar.c1);
                dRow = Math.abs(rowByY - ar.r1);
                // Определим направление позднее
                this.fillHandleDirection = -1;
                break;
            case 3:
                // Сравниваем расстояния от точки до правого верхнего угла выделения
                dXRMod = Math.abs(x - xR);
                dYRMod = Math.abs(y - yL);
                // Сдвиги по столбцам и строкам
                dCol = Math.abs(colByX - ar.c2);
                dRow = Math.abs(rowByY - ar.r1);
                // Определим направление позднее
                this.fillHandleDirection = -1;
                break;
            case 7:
                // Сравниваем расстояния от точки до левого нижнего угла выделения
                dXRMod = Math.abs(x - xL);
                dYRMod = Math.abs(y - yR);
                // Сдвиги по столбцам и строкам
                dCol = Math.abs(colByX - ar.c1);
                dRow = Math.abs(rowByY - ar.r2);
                // Определим направление позднее
                this.fillHandleDirection = -1;
                break;
            case 5:
            case 9:
                // Сравниваем расстояния от точки до правого нижнего угла выделения
                dXRMod = Math.abs(dXR);
                dYRMod = Math.abs(dYR);
                // Сдвиги по столбцам и строкам
                dCol = Math.abs(colByX - ar.c2);
                dRow = Math.abs(rowByY - ar.r2);
                // Определим направление позднее
                this.fillHandleDirection = -1;
                break;
        }

        //console.log(_tmpArea);

        // Возможно еще не определили направление
        if (-1 === this.fillHandleDirection) {
            // Проверим сдвиги по столбцам и строкам, если не поможет, то рассчитываем по расстоянию
            if (0 === dCol && 0 !== dRow) {
                // Двигаемся по вертикали.
                this.fillHandleDirection = 1;
            } else if (0 !== dCol && 0 === dRow) {
                // Двигаемся по горизонтали.
                this.fillHandleDirection = 0;
            } else if (dXRMod >= dYRMod) {
                // Двигаемся по горизонтали.
                this.fillHandleDirection = 0;
            } else {
                // Двигаемся по вертикали.
                this.fillHandleDirection = 1;
            }
        }

        // Проверяем, в каком направлении движение
        if (0 === this.fillHandleDirection) {
            // Определяем область попадания и точку
            /*
             |						|
             |						|
             (1)		|			(2)			|		(3)
             |						|
             |						|
             */
            if (dXR <= 0) {
                // Область (1) или (2)
                if (dXL <= 0) {
                    // Область (1)
                    this.fillHandleArea = 1;
                } else {
                    // Область (2)
                    this.fillHandleArea = 2;
                }
            } else {
                // Область (3)
                this.fillHandleArea = 3;
            }

            // Находим колонку для точки
            this.activeFillHandle.c2 = colByX;

            switch (this.fillHandleArea) {
                case 1:
                    // Первая точка (xR, yR), вторая точка (x, yL)
                    this.activeFillHandle.c1 = ar.c2;
                    this.activeFillHandle.r1 = ar.r2;

                    this.activeFillHandle.r2 = ar.r1;

                    // Случай, если мы еще не вышли из внутренней области
                    if (this.activeFillHandle.c2 == ar.c1) {
                        this.fillHandleArea = 2;
                    }
                    break;
                case 2:
                    // Первая точка (xR, yR), вторая точка (x, yL)
                    this.activeFillHandle.c1 = ar.c2;
                    this.activeFillHandle.r1 = ar.r2;

                    this.activeFillHandle.r2 = ar.r1;

                    if (this.activeFillHandle.c2 > this.activeFillHandle.c1) {
                        // Ситуация половинки последнего столбца
                        this.activeFillHandle.c1 = ar.c1;
                        this.activeFillHandle.r1 = ar.r1;

                        this.activeFillHandle.c2 = ar.c1;
                        this.activeFillHandle.r2 = ar.r1;
                    }
                    break;
                case 3:
                    // Первая точка (xL, yL), вторая точка (x, yR)
                    this.activeFillHandle.c1 = ar.c1;
                    this.activeFillHandle.r1 = ar.r1;

                    this.activeFillHandle.r2 = ar.r2;
                    break;
            }

            // Копируем в range для пересчета видимой области
            activeFillHandleCopy = this.activeFillHandle.clone();
            activeFillHandleCopy.c2 = colByXNoDX;
        } else {
            // Определяем область попадания и точку
            /*
             (1)
             ____________________________


             (2)

             ____________________________

             (3)
             */
            if (dYR <= 0) {
                // Область (1) или (2)
                if (dYL <= 0) {
                    // Область (1)
                    this.fillHandleArea = 1;
                } else {
                    // Область (2)
                    this.fillHandleArea = 2;
                }
            } else {
                // Область (3)
                this.fillHandleArea = 3;
            }

            // Находим строку для точки
            this.activeFillHandle.r2 = rowByY;

            switch (this.fillHandleArea) {
                case 1:
                    // Первая точка (xR, yR), вторая точка (xL, y)
                    this.activeFillHandle.c1 = ar.c2;
                    this.activeFillHandle.r1 = ar.r2;

                    this.activeFillHandle.c2 = ar.c1;

                    // Случай, если мы еще не вышли из внутренней области
                    if (this.activeFillHandle.r2 == ar.r1) {
                        this.fillHandleArea = 2;
                    }
                    break;
                case 2:
                    // Первая точка (xR, yR), вторая точка (xL, y)
                    this.activeFillHandle.c1 = ar.c2;
                    this.activeFillHandle.r1 = ar.r2;

                    this.activeFillHandle.c2 = ar.c1;

                    if (this.activeFillHandle.r2 > this.activeFillHandle.r1) {
                        // Ситуация половинки последней строки
                        this.activeFillHandle.c1 = ar.c1;
                        this.activeFillHandle.r1 = ar.r1;

                        this.activeFillHandle.c2 = ar.c1;
                        this.activeFillHandle.r2 = ar.r1;
                    }
                    break;
                case 3:
                    // Первая точка (xL, yL), вторая точка (xR, y)
                    this.activeFillHandle.c1 = ar.c1;
                    this.activeFillHandle.r1 = ar.r1;

                    this.activeFillHandle.c2 = ar.c2;
                    break;
            }

            // Копируем в range для пересчета видимой области
            activeFillHandleCopy = this.activeFillHandle.clone();
            activeFillHandleCopy.r2 = rowByYNoDY;
        }

        //console.log ("row1: " + this.activeFillHandle.r1 + " col1: " + this.activeFillHandle.c1 + " row2: " + this.activeFillHandle.r2 + " col2: " + this.activeFillHandle.c2);
        // Перерисовываем
        this._drawSelection();

        // Смотрим, ушли ли мы за границу видимой области
        ret = this._calcRangeOffset(activeFillHandleCopy);
        this.model.workbook.handlers.trigger("asc_onHideComment");

        return ret;
    };

    /* Функция для применения автозаполнения */
    WorksheetView.prototype.applyFillHandle = function (x, y, ctrlPress) {
        var t = this;

        // Текущее выделение (к нему применится автозаполнение)
        var arn = t.model.selectionRange.getLast();
        var range = t.model.getRange3(arn.r1, arn.c1, arn.r2, arn.c2);

        // Были ли изменения
        var bIsHaveChanges = false;
        // Вычисляем индекс сдвига
        var nIndex = 0;
        /*nIndex*/
        if (0 === this.fillHandleDirection) {
            // Горизонтальное движение
            nIndex = this.activeFillHandle.c2 - arn.c1;
            if (2 === this.fillHandleArea) {
                // Для внутренности нужно вычесть 1 из значения
                bIsHaveChanges = arn.c2 !== (this.activeFillHandle.c2 - 1);
            } else {
                bIsHaveChanges = arn.c2 !== this.activeFillHandle.c2;
            }
        } else {
            // Вертикальное движение
            nIndex = this.activeFillHandle.r2 - arn.r1;
            if (2 === this.fillHandleArea) {
                // Для внутренности нужно вычесть 1 из значения
                bIsHaveChanges = arn.r2 !== (this.activeFillHandle.r2 - 1);
            } else {
                bIsHaveChanges = arn.r2 !== this.activeFillHandle.r2;
            }
        }

        // Меняли ли что-то
        if (bIsHaveChanges && (this.activeFillHandle.r1 !== this.activeFillHandle.r2 ||
          this.activeFillHandle.c1 !== this.activeFillHandle.c2)) {
            // Диапазон ячеек, который мы будем менять
            var changedRange = arn.clone();

            // Очищаем выделение
            this.cleanSelection();
            if (2 === this.fillHandleArea) {
                // Мы внутри, будет удаление cбрасываем первую ячейку
                // Проверяем, удалили ли мы все (если да, то область не меняется)
                if (arn.c1 !== this.activeFillHandle.c2 || arn.r1 !== this.activeFillHandle.r2) {
                    // Уменьшаем диапазон (мы удалили не все)
                    if (0 === this.fillHandleDirection) {
                        // Горизонтальное движение (для внутренности необходимо вычесть 1)
                        arn.c2 = this.activeFillHandle.c2 - 1;

                        changedRange.c1 = changedRange.c2;
                        changedRange.c2 = this.activeFillHandle.c2;
                    } else {
                        // Вертикальное движение (для внутренности необходимо вычесть 1)
                        arn.r2 = this.activeFillHandle.r2 - 1;

                        changedRange.r1 = changedRange.r2;
                        changedRange.r2 = this.activeFillHandle.r2;
                    }
                }
            } else {
                // Мы вне выделения. Увеличиваем диапазон
                if (0 === this.fillHandleDirection) {
                    // Горизонтальное движение
                    if (1 === this.fillHandleArea) {
                        arn.c1 = this.activeFillHandle.c2;

                        changedRange.c2 = changedRange.c1 - 1;
                        changedRange.c1 = this.activeFillHandle.c2;
                    } else {
                        arn.c2 = this.activeFillHandle.c2;

                        changedRange.c1 = changedRange.c2 + 1;
                        changedRange.c2 = this.activeFillHandle.c2;
                    }
                } else {
                    // Вертикальное движение
                    if (1 === this.fillHandleArea) {
                        arn.r1 = this.activeFillHandle.r2;

                        changedRange.r2 = changedRange.r1 - 1;
                        changedRange.r1 = this.activeFillHandle.r2;
                    } else {
                        arn.r2 = this.activeFillHandle.r2;

                        changedRange.r1 = changedRange.r2 + 1;
                        changedRange.r2 = this.activeFillHandle.r2;
                    }
                }
            }

            changedRange.normalize();

            var applyFillHandleCallback = function (res) {
                if (res) {
                    // Автозаполняем ячейки
                    var oCanPromote = range.canPromote(/*bCtrl*/ctrlPress, /*bVertical*/(1 === t.fillHandleDirection),
                      nIndex);
                    if (null != oCanPromote) {
                        History.Create_NewPoint();
                        History.StartTransaction();

                        range.promote(/*bCtrl*/ctrlPress, /*bVertical*/(1 === t.fillHandleDirection), nIndex,
                          oCanPromote);

                        // Вызываем функцию пересчета для заголовков форматированной таблицы
                        t.model.autoFilters.renameTableColumn(arn);

                        // Сбрасываем параметры автозаполнения
                        t.activeFillHandle = null;
                        t.fillHandleDirection = -1;

                        History.SetSelection(range.bbox.clone());
                        History.SetSelectionRedo(oCanPromote.to.clone());
                        History.EndTransaction();

						// Обновляем выделенные ячейки
						t._updateRange(arn);
						t.draw();
                    } else {
                        t.handlers.trigger("onErrorEvent", c_oAscError.ID.CannotFillRange,
                          c_oAscError.Level.NoCritical);
                        t.model.selectionRange.assign2(range.bbox);

                // Сбрасываем параметры автозаполнения
                t.activeFillHandle = null;
                t.fillHandleDirection = -1;

                        t.updateSelection();
                    }
                } else {
					// Сбрасываем параметры автозаполнения
					t.activeFillHandle = null;
					t.fillHandleDirection = -1;
					// Перерисовываем
					t._drawSelection();
                }
            };

			if (this.model.inPivotTable(changedRange)) {
				// Сбрасываем параметры автозаполнения
				this.activeFillHandle = null;
				this.fillHandleDirection = -1;
				// Перерисовываем
				this._drawSelection();

				this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot,
					c_oAscError.Level.NoCritical);
				return;
			}


			if (this.intersectionFormulaArray(changedRange)) {
				// Сбрасываем параметры автозаполнения
				this.activeFillHandle = null;
				this.fillHandleDirection = -1;
				// Перерисовываем
				this._drawSelection();

				this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CannotChangeFormulaArray,
					c_oAscError.Level.NoCritical);
				return;
			}

            // Можно ли применять автозаполнение ?
            this._isLockedCells(changedRange, /*subType*/null, applyFillHandleCallback);
        } else {
            // Ничего не менялось, сбрасываем выделение
            this.cleanSelection();
            // Сбрасываем параметры автозаполнения
            this.activeFillHandle = null;
            this.fillHandleDirection = -1;
            // Перерисовываем
            this._drawSelection();
        }
    };

    /* Функция для работы перемещения диапазона (selection). (x, y) - координаты точки мыши на области
     *  ToDo нужно переделать, чтобы moveRange появлялся только после сдвига от текущей ячейки
     */
    WorksheetView.prototype.changeSelectionMoveRangeHandle = function (x, y) {
        // Возвращаемый результат
        var ret = null;

        //если выделена ячейка заголовка ф/т, меняем выделение с ячейки на столбец ф/т
        //если выделена вся видимая часть форматированной таблицы, но не выделены последние скрытые строчки
        var selectionRange = (this.dragAndDropRange || this.model.selectionRange.getLast()).clone();
        if (null === this.startCellMoveRange) {
            this.af_changeSelectionTablePart(selectionRange);
        }

        // Колонка по X и строка по Y
        var colByX = this._findColUnderCursor(x, /*canReturnNull*/false, false).col;
        var rowByY = this._findRowUnderCursor(y, /*canReturnNull*/false, false).row;
        var type = selectionRange.getType();

        if (type === c_oAscSelectionType.RangeRow) {
            colByX = 0;
        } else if (type === c_oAscSelectionType.RangeCol) {
            rowByY = 0;
        } else if (type === c_oAscSelectionType.RangeMax) {
            colByX = 0;
            rowByY = 0;
        }

        // Если мы только первый раз попали сюда, то копируем выделенную область
        if (null === this.startCellMoveRange) {
            // Учитываем погрешность (мы должны быть внутри диапазона при старте)
            if (colByX < selectionRange.c1) {
                colByX = selectionRange.c1;
            } else if (colByX > selectionRange.c2) {
                colByX = selectionRange.c2;
            }
            if (rowByY < selectionRange.r1) {
                rowByY = selectionRange.r1;
            } else if (rowByY > selectionRange.r2) {
                rowByY = selectionRange.r2;
            }
            this.startCellMoveRange = new asc_Range(colByX, rowByY, colByX, rowByY);
            this.startCellMoveRange.isChanged = false;	// Флаг, сдвигались ли мы от первоначального диапазона
            return ret;
        }

        // Разница, на сколько мы сдвинулись
        var colDelta = colByX - this.startCellMoveRange.c1;
        var rowDelta = rowByY - this.startCellMoveRange.r1;

        // Проверяем, нужно ли отрисовывать перемещение (сдвигались или нет)
        if (false === this.startCellMoveRange.isChanged && 0 === colDelta && 0 === rowDelta) {
            return ret;
        }
        // Выставляем флаг
        this.startCellMoveRange.isChanged = true;

        // Очищаем выделение, будем рисовать заново
        this.cleanSelection();

        this.activeMoveRange = selectionRange;
        // Для первого раза нормализуем (т.е. первая точка - это левый верхний угол)
        this.activeMoveRange.normalize();

        // Выставляем
        this.activeMoveRange.c1 += colDelta;
        if (0 > this.activeMoveRange.c1) {
            colDelta -= this.activeMoveRange.c1;
            this.activeMoveRange.c1 = 0;
        }
        this.activeMoveRange.c2 += colDelta;

        this.activeMoveRange.r1 += rowDelta;
        if (0 > this.activeMoveRange.r1) {
            rowDelta -= this.activeMoveRange.r1;
            this.activeMoveRange.r1 = 0;
        }
        this.activeMoveRange.r2 += rowDelta;

        // Перерисовываем
        this._drawSelection();
        var d = new AscCommon.CellBase(0, 0);
        /*var d = {
         deltaX : this.activeMoveRange.c1 < this.visibleRange.c1 ? this.activeMoveRange.c1-this.visibleRange.c1 :
         this.activeMoveRange.c2>this.visibleRange.c2 ? this.activeMoveRange.c2-this.visibleRange.c2 : 0,
         deltaY : this.activeMoveRange.r1 < this.visibleRange.r1 ? this.activeMoveRange.r1-this.visibleRange.r1 :
         this.activeMoveRange.r2>this.visibleRange.r2 ? this.activeMoveRange.r2-this.visibleRange.r2 : 0
         };
         while ( this._isColDrawnPartially( this.activeMoveRange.c2, this.visibleRange.c1 + d.deltaX) ) {++d.deltaX;}
         while ( this._isRowDrawnPartially( this.activeMoveRange.r2, this.visibleRange.r1 + d.deltaY) ) {++d.deltaY;}*/

        if (y <= this.cellsTop + 2) {
            d.row = -1;
        } else if (y >= this.drawingCtx.getHeight() - 2) {
            d.row = 1;
        }

        if (x <= this.cellsLeft + 2) {
            d.col = -1;
        } else if (x >= this.drawingCtx.getWidth() - 2) {
            d.col = 1;
        }

        this.model.workbook.handlers.trigger("asc_onHideComment");

		type = this.activeMoveRange.getType();
        if (type === c_oAscSelectionType.RangeRow) {
            d.col = 0;
        } else if (type === c_oAscSelectionType.RangeCol) {
            d.row = 0;
        } else if (type === c_oAscSelectionType.RangeMax) {
            d.col = 0;
            d.row = 0;
        }

        return d;
    };


    WorksheetView.prototype.changeChartSelectionMoveResizeRangeHandle = function(x, y, targetInfo, editor) {
        // Колонка по X и строка по Y
        var colByX = this._findColUnderCursor(x, /*canReturnNull*/false, false).col;
        var rowByY = this._findRowUnderCursor(y, /*canReturnNull*/false, false).row;
        var type, i;
        var indexFormulaRange = targetInfo.indexFormulaRange;
        var oActiveRange = this.arrActiveChartRanges[indexFormulaRange], oValRange, bVert, colDelta, rowDelta;
        var ar = oActiveRange.getLast().clone(), arTmp;
        var oRange;
        var oTopActiveRange = null, oLeftActiveRange = null, oValActiveRange = null;
        var r1 = null, r2 = null, c1 = null, c2 = null, delta;

        if(oActiveRange.separated) {
            switch (targetInfo.cursor) {
                case kCurNEResize:
                case kCurSEResize:{
                    if (colByX < this.startCellMoveResizeRange2.c1) {
                        c2 = this.startCellMoveResizeRange2.c1;
                        c1 = colByX;
                    } else if (colByX > this.startCellMoveResizeRange2.c1) {
                        c1 = this.startCellMoveResizeRange2.c1;
                        c2 = colByX;
                    } else {
                        c1 = this.startCellMoveResizeRange2.c1;
                        c2 = this.startCellMoveResizeRange2.c1
                    }
                    if (rowByY < this.startCellMoveResizeRange2.r1) {
                        r2 = this.startCellMoveResizeRange2.r2;
                        r1 = rowByY;
                    } else if (rowByY > this.startCellMoveResizeRange2.r1) {
                        r1 = this.startCellMoveResizeRange2.r1;
                        r2 = rowByY;
                    } else {
                        r1 = this.startCellMoveResizeRange2.r1;
                        r2 = this.startCellMoveResizeRange2.r1;
                    }
                    if(oActiveRange.chartRangeIndex !== 2)  {
                        if(Math.abs(ar.c2 - ar.c1) > Math.abs(ar.r2 - ar.r1)) {
                            r1 = Math.min(ar.r1, ar.r2);
                            r2 = r1;
                        }
                        else if(Math.abs(ar.c2 - ar.c1) < Math.abs(ar.r2 - ar.r1)) {
                            c1 = Math.min(ar.c1, ar.c2);
                            c2 = c1;
                        }
                        else {
                            if(Math.abs(this.startCellMoveResizeRange2.c1 - colByX) > Math.abs(this.startCellMoveResizeRange2.r1 - rowByY)){
                                r1 = Math.min(ar.r1, ar.r2);
                                r2 = r1;
                            }
                            else {
                                c1 = Math.min(ar.c1, ar.c2);
                                c2 = c1;
                            }
                        }
                    }
                    break;
                }
                case kCurMove: {
                    colDelta = colByX - this.startCellMoveResizeRange2.c1;
                    c1 = this.startCellMoveResizeRange.c1 + colDelta;
                    c2 = this.startCellMoveResizeRange.c2 + colDelta;
                    delta = Math.min(c1, c2);
                    if(delta < 0) {
                        c1 -= delta;
                        c2 -= delta;
                    }
                    rowDelta = rowByY - this.startCellMoveResizeRange2.r1;
                    r1 = this.startCellMoveResizeRange.r1 + rowDelta;
                    r2 = this.startCellMoveResizeRange.r2 + rowDelta;
                    delta = Math.min(r1, r2);
                    if(delta < 0) {
                        r1 -= delta;
                        r2 -= delta;
                    }
                    break;
                }
            }
            arTmp = oActiveRange.getLast().clone();
            if(r1 !== null && r2 !== null) {
                arTmp.r1 = r1;
                arTmp.r2 = r2;
            }
            if(c1 !== null && c2 !== null) {
                arTmp.c1 = c1;
                arTmp.c2 = c2;
            }
            oActiveRange.getLast().assign2(arTmp);
        }
        else {
            for(i = 0; i < this.arrActiveChartRanges.length; ++i) {
                if(this.arrActiveChartRanges[i].chartRangeIndex === 0) {
                    oValActiveRange = this.arrActiveChartRanges[i];
                }
                else if(this.arrActiveChartRanges[i].chartRangeIndex === 1) {
                    if(oValActiveRange) {
                        if(oValActiveRange.vert) {
                            oLeftActiveRange = this.arrActiveChartRanges[i];
                        }
                        else {
                            oTopActiveRange = this.arrActiveChartRanges[i];
                        }
                    }
                }
                else if(this.arrActiveChartRanges[i].chartRangeIndex === 2) {
                    if(oValActiveRange) {
                        if(oValActiveRange.vert) {
                            oTopActiveRange = this.arrActiveChartRanges[i];
                        }
                        else {
                            oLeftActiveRange = this.arrActiveChartRanges[i];
                        }
                    }
                }
            }
            if(!oValActiveRange) {
                return;
            }
            switch (targetInfo.cursor) {
                case kCurNEResize:
                case kCurSEResize:{

                    if(oValActiveRange === oActiveRange || oTopActiveRange === oActiveRange) {
                        if (colByX < this.startCellMoveResizeRange2.c1) {
                            c2 = this.startCellMoveResizeRange2.c1;
                            c1 = colByX;
                        } else if (colByX > this.startCellMoveResizeRange2.c1) {
                            c1 = this.startCellMoveResizeRange2.c1;
                            c2 = colByX;
                        } else {
                            c1 = this.startCellMoveResizeRange2.c1;
                            c2 = this.startCellMoveResizeRange2.c1
                        }
                    }

                    if(oValActiveRange === oActiveRange || oLeftActiveRange === oActiveRange) {
                        if (rowByY < this.startCellMoveResizeRange2.r1) {
                            r2 = this.startCellMoveResizeRange2.r2;
                            r1 = rowByY;
                        } else if (rowByY > this.startCellMoveResizeRange2.r1) {
                            r1 = this.startCellMoveResizeRange2.r1;
                            r2 = rowByY;
                        } else {
                            r1 = this.startCellMoveResizeRange2.r1;
                            r2 = this.startCellMoveResizeRange2.r1;
                        }
                    }

                    if(oLeftActiveRange && oLeftActiveRange !== oActiveRange) {
                        oRange = oLeftActiveRange.getLast();
                        if(oRange) {
                            if(c1 <= oRange.c2) {
                                c1 = oRange.c2 + 1;
                            }
                        }
                    }
                    if(oTopActiveRange && oTopActiveRange !== oActiveRange) {
                        oRange = oTopActiveRange.getLast();
                        if(oRange) {
                            if(r1 <= oRange.r2) {
                                r1 = oRange.r2 + 1;
                            }
                        }
                    }
                    break;
                }
                case kCurMove: {
                    if(oActiveRange === oValActiveRange || oActiveRange === oTopActiveRange) {
                        colDelta = colByX - this.startCellMoveResizeRange2.c1;
                        if(colDelta < 0) {
                            oRange = null;
                            if(oLeftActiveRange) {
                                oRange = oLeftActiveRange.getLast();
                                if(oRange) {
                                    if(this.startCellMoveResizeRange.c1 + colDelta <= oRange.c2) {
                                        colDelta += (oRange.c2 - (this.startCellMoveResizeRange.c1 + colDelta) + 1);
                                    }
                                }
                            }
                        }
                        c1 = this.startCellMoveResizeRange.c1 + colDelta;
                        c2 = this.startCellMoveResizeRange.c2 + colDelta;
                        delta = Math.min(c1, c2);
                        if(delta < 0) {
                            c1 -= delta;
                            c2 -= delta;
                        }
                    }
                    if(oActiveRange === oValActiveRange || oActiveRange === oLeftActiveRange) {
                        rowDelta = rowByY - this.startCellMoveResizeRange2.r1;
                        if(rowDelta < 0) {
                            oRange = null;
                            if(oTopActiveRange) {
                                oRange = oTopActiveRange.getLast();
                                if(oRange) {
                                    if(this.startCellMoveResizeRange.r1 + rowDelta <= oRange.r2) {
                                        rowDelta += (oRange.r2 - (this.startCellMoveResizeRange.r1 + rowDelta) + 1);
                                    }
                                }
                            }
                        }
                        r1 = this.startCellMoveResizeRange.r1 + rowDelta;
                        r2 = this.startCellMoveResizeRange.r2 + rowDelta;
                        delta = Math.min(r1, r2);
                        if(delta < 0) {
                            r1 -= delta;
                            r2 -= delta;
                        }
                    }

                    break;
                }
            }
            if(oValActiveRange) {
                arTmp = oValActiveRange.getLast().clone();
                if(r1 !== null && r2 !== null) {
                    arTmp.r1 = r1;
                    arTmp.r2 = r2;
                }
                if(c1 !== null && c2 !== null) {
                    arTmp.c1 = c1;
                    arTmp.c2 = c2;
                }
                oValActiveRange.getLast().assign2(arTmp);
            }
            if(oLeftActiveRange) {
                arTmp = oLeftActiveRange.getLast().clone();
                if(r1 !== null && r2 !== null) {
                    arTmp.r1 = r1;
                    arTmp.r2 = r2;
                }
                oLeftActiveRange.getLast().assign2(arTmp);
            }
            if(oTopActiveRange) {
                arTmp = oTopActiveRange.getLast().clone();
                if(c1 !== null && c2 !== null) {
                    arTmp.c1 = c1;
                    arTmp.c2 = c2;
                }
                oTopActiveRange.getLast().assign2(arTmp);
            }
        }
        this._drawSelection();
    };

    WorksheetView.prototype.changeSelectionMoveResizeRangeHandle = function (x, y, targetInfo, editor) {
        // Возвращаемый результат
        if (!targetInfo) {
            return null;
        }

        var type;
        var indexFormulaRange = targetInfo.indexFormulaRange, d = new AscCommon.CellBase(0, 0), newFormulaRange = null;
        var ar = (0 == targetInfo.targetArr ? this.arrActiveFormulaRanges[indexFormulaRange] :
          this.arrActiveChartRanges[indexFormulaRange]).getLast().clone();

        // Колонка по X и строка по Y
        var colByX = this._findColUnderCursor(x, /*canReturnNull*/false, false).col;
        var rowByY = this._findRowUnderCursor(y, /*canReturnNull*/false, false).row;

        // Если мы только первый раз попали сюда, то копируем выделенную область
        if (null === this.startCellMoveResizeRange) {
            if ((targetInfo.cursor == kCurNEResize || targetInfo.cursor == kCurSEResize)) {
                this.startCellMoveResizeRange = ar.clone(true);
                this.startCellMoveResizeRange2 =
                  new asc_Range(targetInfo.col, targetInfo.row, targetInfo.col, targetInfo.row, true);
            } else {
                this.startCellMoveResizeRange = ar.clone(true);
                if (colByX < ar.c1) {
                    colByX = ar.c1;
                } else if (colByX > ar.c2) {
                    colByX = ar.c2;
                }
                if (rowByY < ar.r1) {
                    rowByY = ar.r1;
                } else if (rowByY > ar.r2) {
                    rowByY = ar.r2;
                }
                this.startCellMoveResizeRange2 = new asc_Range(colByX, rowByY, colByX, rowByY);
            }
            return null;
        }

        // Очищаем выделение, будем рисовать заново
        // this.cleanSelection();
        this.overlayCtx.clear();

        if(targetInfo.targetArr !== 0) {
            return this.changeChartSelectionMoveResizeRangeHandle(x, y, targetInfo, editor);
        }
        if (targetInfo.cursor == kCurNEResize || targetInfo.cursor == kCurSEResize) {

            if (colByX < this.startCellMoveResizeRange2.c1) {
                ar.c2 = this.startCellMoveResizeRange2.c1;
                ar.c1 = colByX;
            } else if (colByX > this.startCellMoveResizeRange2.c1) {
                ar.c1 = this.startCellMoveResizeRange2.c1;
                ar.c2 = colByX;
            } else {
                ar.c1 = this.startCellMoveResizeRange2.c1;
                ar.c2 = this.startCellMoveResizeRange2.c1
            }

            if (rowByY < this.startCellMoveResizeRange2.r1) {
                ar.r2 = this.startCellMoveResizeRange2.r2;
                ar.r1 = rowByY;
            } else if (rowByY > this.startCellMoveResizeRange2.r1) {
                ar.r1 = this.startCellMoveResizeRange2.r1;
                ar.r2 = rowByY;
            } else {
                ar.r1 = this.startCellMoveResizeRange2.r1;
                ar.r2 = this.startCellMoveResizeRange2.r1;
            }

        } else {
            this.startCellMoveResizeRange.normalize();
			type = this.startCellMoveResizeRange.getType();
			var colDelta = type !== c_oAscSelectionType.RangeRow && type !== c_oAscSelectionType.RangeMax ?
				colByX - this.startCellMoveResizeRange2.c1 : 0;
			var rowDelta = type !== c_oAscSelectionType.RangeCol && type !== c_oAscSelectionType.RangeMax ?
				rowByY - this.startCellMoveResizeRange2.r1 : 0;

            ar.c1 = this.startCellMoveResizeRange.c1 + colDelta;
            if (0 > ar.c1) {
                colDelta -= ar.c1;
                ar.c1 = 0;
            }
            ar.c2 = this.startCellMoveResizeRange.c2 + colDelta;

            ar.r1 = this.startCellMoveResizeRange.r1 + rowDelta;
            if (0 > ar.r1) {
                rowDelta -= ar.r1;
                ar.r1 = 0;
            }
            ar.r2 = this.startCellMoveResizeRange.r2 + rowDelta;

        }

        if (y <= this.cellsTop + 2) {
            d.row = -1;
        } else if (y >= this.drawingCtx.getHeight() - 2) {
            d.row = 1;
        }

        if (x <= this.cellsLeft + 2) {
            d.col = -1;
        } else if (x >= this.drawingCtx.getWidth() - 2) {
            d.col = 1;
        }

        type = this.startCellMoveResizeRange.getType();
        if (type === c_oAscSelectionType.RangeRow) {
            d.col = 0;
        } else if (type === c_oAscSelectionType.RangeCol) {
            d.row = 0;
        } else if (type === c_oAscSelectionType.RangeMax) {
            d.col = 0;
            d.row = 0;
        }

        var _p = this.arrActiveFormulaRanges[indexFormulaRange].cursorePos, _l = this.arrActiveFormulaRanges[indexFormulaRange].formulaRangeLength;
        this.arrActiveFormulaRanges[indexFormulaRange].getLast().assign2(ar.clone(true));
        this.arrActiveFormulaRanges[indexFormulaRange].cursorePos = _p;
        this.arrActiveFormulaRanges[indexFormulaRange].formulaRangeLength = _l;
        newFormulaRange = this.arrActiveFormulaRanges[indexFormulaRange].getLast();

        this._drawSelection();

        if (newFormulaRange) {
            editor.changeCellRange(newFormulaRange);
        }

        return d;
    };

    WorksheetView.prototype._cleanSelectionMoveRange = function () {
        // Перерисовываем и сбрасываем параметры
        this.cleanSelection();
        this.activeMoveRange = null;
        this.startCellMoveRange = null;
        this._drawSelection();
    };

    /* Функция для применения перемещения диапазона */
    WorksheetView.prototype.applyMoveRangeHandle = function (ctrlKey) {
        if (null === this.activeMoveRange) {
            // Сбрасываем параметры
            this.startCellMoveRange = null;
            return;
        }

		this.model.workbook.handlers.trigger("cleanCutData", null, true);

        var arnFrom = this.model.selectionRange.getLast();
        var arnTo = this.activeMoveRange.clone(true);
        if (arnFrom.isEqual(arnTo)) {
            this._cleanSelectionMoveRange();
            return;
        }
		if (this.model.inPivotTable([arnFrom, arnTo])) {
			this._cleanSelectionMoveRange();
			this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot, c_oAscError.Level.NoCritical);
			return;
		}

		//***array-formula***
		//теперь не передаю 3 параметром в функцию checkMoveFormulaArray ctrlKey, поскольку undo/redo для
		//клонирования части формулы работает некорректно
		//при undo созданную формулу обходимо не переносить, а удалять
		//TODO пересомтреть!
		if (!this.checkMoveFormulaArray(arnFrom, arnTo)) {
			this._cleanSelectionMoveRange();
			this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
			return;
		}

        var resmove = this.model._prepareMoveRange(arnFrom, arnTo);
        if (resmove === -2) {
            this.handlers.trigger("onErrorEvent", c_oAscError.ID.CannotMoveRange, c_oAscError.Level.NoCritical);
            this._cleanSelectionMoveRange();
        } else if (resmove === -1) {
            var t = this;
            this.model.workbook.handlers.trigger("asc_onConfirmAction", Asc.c_oAscConfirm.ConfirmReplaceRange,
              function (can) {
                  if (can) {
                      t.moveRangeHandle(arnFrom, arnTo, ctrlKey);
                  } else {
                      t._cleanSelectionMoveRange();
                  }
              });
        } else {
            this.moveRangeHandle(arnFrom, arnTo, ctrlKey);
        }
    };

	WorksheetView.prototype.applyCutRange = function (arnFrom, arnTo, opt_wsTo) {
		var moveToOtherSheet = opt_wsTo && opt_wsTo.model && this.model !== opt_wsTo.model;

		if (!moveToOtherSheet && arnFrom.isEqual(arnTo)) {
			return;
		}
		if ((!moveToOtherSheet && this.model.inPivotTable([arnFrom, arnTo])) || (moveToOtherSheet && (this.model.inPivotTable([arnFrom]) || opt_wsTo.model.inPivotTable([arnTo])))) {
			this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot, c_oAscError.Level.NoCritical);
			return;
		}

		//***array-formula***
		//теперь не передаю 3 параметром в функцию checkMoveFormulaArray ctrlKey, поскольку undo/redo для
		//клонирования части формулы работает некорректно
		//при undo созданную формулу обходимо не переносить, а удалять
		//TODO пересомтреть!
		if (!this.checkMoveFormulaArray(arnFrom, arnTo, null, opt_wsTo)) {
			this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
			return;
		}

		var resmove = this.model._prepareMoveRange(arnFrom, arnTo, opt_wsTo && opt_wsTo.model);
		if (resmove === -2) {
			this.handlers.trigger("onErrorEvent", c_oAscError.ID.CannotMoveRange, c_oAscError.Level.NoCritical);
		} else if (resmove === -1) {
			var t = this;
			this.model.workbook.handlers.trigger("asc_onConfirmAction", Asc.c_oAscConfirm.ConfirmReplaceRange,
				function (can) {
					if (can) {
						t.moveRangeHandle(arnFrom, arnTo, null, opt_wsTo);
					}
				});
		} else {
			this.moveRangeHandle(arnFrom, arnTo, null, opt_wsTo);
		}
	};

    WorksheetView.prototype.applyMoveResizeRangeHandle = function ( target ) {
        if ( -1 == target.targetArr && !this.startCellMoveResizeRange.isEqual( this.moveRangeDrawingObjectTo ) ) {
            this.objectRender.applyMoveResizeRange(this.arrActiveChartRanges);
            //this.objectRender.moveRangeDrawingObject( this.startCellMoveResizeRange, this.moveRangeDrawingObjectTo );
        }

        this.startCellMoveResizeRange = null;
        this.startCellMoveResizeRange2 = null;
        this.moveRangeDrawingObjectTo = null;
    };

    WorksheetView.prototype.moveRangeHandle = function (arnFrom, arnTo, copyRange, opt_wsTo) {
		//opt_wsTo - for test reasons only
        var t = this;
		var wsTo = opt_wsTo ? opt_wsTo : this;

        var onApplyMoveRangeHandleCallback = function (isSuccess) {
            if (false === isSuccess) {
				wsTo.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedAllError, c_oAscError.Level.NoCritical);
                wsTo._cleanSelectionMoveRange();
                return;
            }

            var onApplyMoveAutoFiltersCallback = function (isSuccess) {
                if (false === isSuccess) {
					wsTo.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedAllError, c_oAscError.Level.NoCritical);
                    wsTo._cleanSelectionMoveRange();
                    return;
                }

				var hasMerged = t.model.getRange3(arnFrom.r1, arnFrom.c1, arnFrom.r2, arnFrom.c2).hasMerged();

                // Очищаем выделение
                wsTo.cleanSelection();

                //ToDo t.cleanDepCells();
                History.Create_NewPoint();
                if(opt_wsTo === undefined) {
                    History.SetSelection(arnFrom.clone());
                }
                History.SetSelectionRedo(arnTo.clone());
                History.StartTransaction();

                t.model.autoFilters._preMoveAutoFilters(arnFrom, arnTo, copyRange, opt_wsTo);

                t.model._moveRange(arnFrom, arnTo, copyRange, opt_wsTo && opt_wsTo.model);
                t.cellCommentator.moveRangeComments(arnFrom, arnTo, copyRange, opt_wsTo);
                t.objectRender.moveRangeDrawingObject(arnFrom, arnTo);

                // Вызываем функцию пересчета для заголовков форматированной таблицы
                t.model.autoFilters.renameTableColumn(arnFrom);
                wsTo.model.autoFilters.renameTableColumn(arnTo);
                t.model.autoFilters.reDrawFilter(arnFrom);

                t.model.autoFilters.afterMoveAutoFilters(arnFrom, arnTo, opt_wsTo);

				if(opt_wsTo) {
					History.SetSheetUndo(wsTo.model.getId());
				}
				History.EndTransaction();

				wsTo._updateRange(arnTo);
				t._updateRange(arnFrom);

				wsTo.model.selectionRange.assign2(arnTo);
				// Сбрасываем параметры
				wsTo.activeMoveRange = null;
				wsTo.startCellMoveRange = null;

				// Тут будет отрисовка select-а
				wsTo.draw();
				// Вызовем на всякий случай, т.к. мы можем уже обновиться из-за формул ToDo возможно стоит убрать это в дальнейшем (но нужна переработка формул) - http://bugzilla.onlyoffice.com/show_bug.cgi?id=24505
				wsTo._updateSelectionNameAndInfo();

				if (hasMerged && false !== t.model.autoFilters._intersectionRangeWithTableParts(arnTo)) {
					//не делаем действий в asc_onConfirmAction, потому что во время диалога может выполниться autosave и новые измения добавятся в точку, которую уже отправили
					//тем более результат диалога ни на что не влияет
					wsTo.model.workbook.handlers.trigger("asc_onConfirmAction", Asc.c_oAscConfirm.ConfirmPutMergeRange,
						function () {
						});
				}
            };

            if (t.model.autoFilters._searchFiltersInRange(arnFrom, true)) {
                t._isLockedAll(onApplyMoveAutoFiltersCallback);
				if(copyRange){
					t._isLockedDefNames(null, null);
				}
            } else {
                onApplyMoveAutoFiltersCallback();
            }
        };

        if (this.af_isCheckMoveRange(arnFrom, arnTo, opt_wsTo)) {
            if(opt_wsTo) {
                this._isLockedCells([arnFrom], null, opt_wsTo._isLockedCells([arnTo], null, onApplyMoveRangeHandleCallback));
            } else {
                this._isLockedCells([arnFrom, arnTo], null, onApplyMoveRangeHandleCallback);
            }
        } else {
            this._cleanSelectionMoveRange();
        }
    };

    WorksheetView.prototype.emptySelection = function ( options, bIsCut ) {
        // Удаляем выделенные графичекие объекты
        if ( this.objectRender.selectedGraphicObjectsExists() ) {
			var isIntoShape = this.objectRender.controller.getTargetDocContent();
			if(bIsCut && isIntoShape) {
                if(isIntoShape.Selection && isIntoShape.Selection.Use) {
                    this.objectRender.controller.remove(-1, undefined, undefined, undefined, undefined);
                }
			} else {
				this.objectRender.controller.deleteSelectedObjects();
			}
		} else {
            this.setSelectionInfo( "empty", options );
        }
    };

	WorksheetView.prototype.isNeedSelectionCut = function () {
		var res = true;
		if (AscCommon.g_clipboardBase.bCut && !this.objectRender.selectedGraphicObjectsExists()) {
			res = false;
		}
		return res;
	};

	WorksheetView.prototype.isMultiSelect = function () {
		if(!this.objectRender.selectedGraphicObjectsExists()) {
			return !this.model.selectionRange.isSingleRange();
		}
		return null;
	};

    WorksheetView.prototype.setSelectionInfo = function (prop, val, onlyActive) {
        // Проверка глобального лока
        if (this.collaborativeEditing.getGlobalLock()) {
            return;
        }

        var t = this;
        var checkRange = [];
        var activeCell = this.model.selectionRange.activeCell.clone();
        var arn = this.model.selectionRange.getLast().clone(true);

        var onSelectionCallback = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }
            var hasUpdates = false;

            var callTrigger = false;
            var res;
            var mc, r, cell;

            function makeBorder(b) {
                var border = new AscCommonExcel.BorderProp();
                if (b === false) {
                    border.setStyle(c_oAscBorderStyles.None);
                } else if (b) {
                    if (b.style !== null && b.style !== undefined) {
                        border.setStyle(b.style);
                    }
                    if (b.color !== null && b.color !== undefined) {
                        if (b.color instanceof Asc.asc_CColor) {
                            border.c = AscCommonExcel.CorrectAscColor(b.color);
                        }
                    }
                }
                return border;
            }

            History.Create_NewPoint();
            History.StartTransaction();

            checkRange.forEach(function (item, i) {
                var c;
				var bIsUpdate = true;
                var range = t.model.getRange3(item.r1, item.c1, item.r2, item.c2);
                var isLargeRange = t._isLargeRange(range.bbox);
                var canChangeColWidth = c_oAscCanChangeColWidth.none;

				if (prop !== "paste" && t.model.autoFilters.bIsExcludeHiddenRows(range, activeCell)) {
					t.model.excludeHiddenRows(true);
				}

                switch (prop) {
                    case "fn":
                        range.setFontname(val);
                        canChangeColWidth = c_oAscCanChangeColWidth.numbers;
                        break;
                    case "fs":
                        range.setFontsize(val);
                        canChangeColWidth = c_oAscCanChangeColWidth.numbers;
                        break;
                    case "b":
                        range.setBold(val);
                        break;
                    case "i":
                        range.setItalic(val);
                        break;
                    case "u":
                        range.setUnderline(val);
                        break;
                    case "s":
                        range.setStrikeout(val);
                        break;
                    case "fa":
                        range.setFontAlign(val);
                        break;
                    case "a":
                        range.setAlignHorizontal(val);
                        break;
                    case "va":
                        range.setAlignVertical(val);
                        break;
                    case "c":
                        range.setFontcolor(val);
                        break;
					case "f":
						range.setFill(val || null);
						break;
                    case "bc":
                        range.setFillColor(val || null);
                        break; // ToDo можно делать просто отрисовку
                    case "wrap":
                        range.setWrap(val);
                        break;
                    case "shrink":
                        range.setShrinkToFit(val);
                        break;
                    case "value":
                        range.setValue(val);
                        break;
                    case "format":
                        range.setNumFormat(val);
                        canChangeColWidth = c_oAscCanChangeColWidth.numbers;
                        break;
                    case "angle":
                        range.setAngle(val);
                        break;
                    case "rh":
                        range.removeHyperlink(null, true);
                        break;
                    case "border":
                        if (isLargeRange && !callTrigger) {
                            callTrigger = true;
                            t.handlers.trigger("slowOperation", true);
                        }
                        // None
                        if (val.length < 1) {
                            range.setBorder(null);
                            break;
                        }
                        res = new AscCommonExcel.Border();
                        // Diagonal
                        res.d = makeBorder(val[c_oAscBorderOptions.DiagD] || val[c_oAscBorderOptions.DiagU]);
                        res.dd = !!val[c_oAscBorderOptions.DiagD];
                        res.du = !!val[c_oAscBorderOptions.DiagU];
                        // Vertical
                        res.l = makeBorder(val[c_oAscBorderOptions.Left]);
                        res.iv = makeBorder(val[c_oAscBorderOptions.InnerV]);
                        res.r = makeBorder(val[c_oAscBorderOptions.Right]);
                        // Horizontal
                        res.t = makeBorder(val[c_oAscBorderOptions.Top]);
                        res.ih = makeBorder(val[c_oAscBorderOptions.InnerH]);
                        res.b = makeBorder(val[c_oAscBorderOptions.Bottom]);
                        // Change border
                        range.setBorder(res);
                        break;
                    case "merge":
                        if (isLargeRange && !callTrigger) {
                            callTrigger = true;
                            t.handlers.trigger("slowOperation", true);
                        }
                        switch (val) {
                            case c_oAscMergeOptions.MergeCenter:
                            case c_oAscMergeOptions.Merge:
                                range.merge(val);
                                t.cellCommentator.mergeComments(range.getBBox0());
                                break;
                            case c_oAscMergeOptions.None:
                                range.unmerge();
                                break;
                            case c_oAscMergeOptions.MergeAcross:
                                for (res = range.bbox.r1; res <= range.bbox.r2; ++res) {
                                    t.model.getRange3(res, range.bbox.c1, res, range.bbox.c2).merge(val);
                                    cell = new asc_Range(range.bbox.c1, res, range.bbox.c2, res);
                                    t.cellCommentator.mergeComments(cell);
                                }
                                break;
                        }
                        break;

                    case "sort":
                        if (isLargeRange && !callTrigger) {
                            callTrigger = true;
                            t.handlers.trigger("slowOperation", true);
                        }
                       	var opt_by_rows = false;
						//var props = t.getSortProps(true);
                        //t.cellCommentator.sortComments(range.sort(val.type, opt_by_rows ? activeCell.row : activeCell.col, val.color, true, opt_by_rows, props.levels));
                        t.cellCommentator.sortComments(t._doSort(range, val.type, opt_by_rows ? activeCell.row : activeCell.col, val.color, true, opt_by_rows));
						t.setSortProps(t._generateSortProps(val.type, opt_by_rows ? activeCell.row : activeCell.col, val.color, true, opt_by_rows, range.bbox), true);
                        break;

					case "customSort":
						if (isLargeRange && !callTrigger) {
							callTrigger = true;
							t.handlers.trigger("slowOperation", true);
						}

						t.setSortProps(val);
						break;

                    case "empty":
                        if (isLargeRange && !callTrigger) {
                            callTrigger = true;
                            t.handlers.trigger("slowOperation", true);
                        }
                        /* отключаем отрисовку на случай необходимости пересчета ячеек, заносим ячейку, при необходимости в список перерисовываемых */
                        t.model.workbook.dependencyFormulas.lockRecal();

                        switch(val) {
							case c_oAscCleanOptions.All:
							    range.cleanAll();
								t.model.deletePivotTables(range.bbox);
								t.model.removeSparklines(range.bbox);
								// Удаляем комментарии
                                t.cellCommentator.deleteCommentsRange(range.bbox);
								break;
							case c_oAscCleanOptions.Text:
							case c_oAscCleanOptions.Formula:
							    range.cleanText();
								t.model.deletePivotTables(range.bbox);
								break;
							case c_oAscCleanOptions.Format:
							    range.cleanFormat();
								break;
							case c_oAscCleanOptions.Hyperlinks:
							    range.cleanHyperlinks();
								break;
							case c_oAscCleanOptions.Sparklines:
								t.model.removeSparklines(range.bbox);
								break;
							case c_oAscCleanOptions.SparklineGroups:
								t.model.removeSparklineGroups(range.bbox);
								break;
                        }

						t.model.excludeHiddenRows(false);

						// Если нужно удалить автофильтры - удаляем
						if (window['AscCommonExcel'].filteringMode) {
							if (val === c_oAscCleanOptions.All || val === c_oAscCleanOptions.Text) {
								t.model.autoFilters.isEmptyAutoFilters(range.bbox);
							} else if (val === c_oAscCleanOptions.Format) {
								t.model.autoFilters.cleanFormat(range.bbox);
							}
						}

                        // Вызываем функцию пересчета для заголовков форматированной таблицы
                        if (val === c_oAscCleanOptions.All || val === c_oAscCleanOptions.Text) {
                            t.model.autoFilters.renameTableColumn(range.bbox);
                        }

                        /* возвращаем отрисовку. и перерисовываем ячейки с предварительным пересчетом */
                        t.model.workbook.dependencyFormulas.unlockRecal();
                        break;

                    case "changeDigNum":
                        res = [];
                        for (c = item.c1; c <= item.c2; ++c) {
							res.push(t.getColumnWidthInSymbols(c));
                        }
                        range.shiftNumFormat(val, res);
                        canChangeColWidth = c_oAscCanChangeColWidth.numbers;
                        break;
                    case "changeFontSize":
                        mc = t.model.getMergedByCell(activeCell.row, activeCell.col);
                        c = mc ? mc.c1 : activeCell.col;
                        r = mc ? mc.r1 : activeCell.row;
                        cell = t._getVisibleCell(c, r);
						var oldFontSize = cell.getFont().getSize();
                            var newFontSize = asc_incDecFonSize(val, oldFontSize);
                            if (null !== newFontSize) {
                                range.setFontsize(newFontSize);
                                canChangeColWidth = c_oAscCanChangeColWidth.numbers;
                            }
                        break;
                    case "style":
                        range.setCellStyle(val);
                        canChangeColWidth = c_oAscCanChangeColWidth.numbers;
                        break;
                    case "paste":
						var specialPasteHelper = window['AscCommon'].g_specialPasteHelper;
						specialPasteHelper.specialPasteProps = specialPasteHelper.specialPasteProps ? specialPasteHelper.specialPasteProps : new Asc.SpecialPasteProps();

                        t._loadDataBeforePaste(isLargeRange, val, val.data, bIsUpdate, canChangeColWidth, item);
						bIsUpdate = false;
                        break;
                    case "hyperlink":
                        if (val && val.hyperlinkModel) {
                            if (Asc.c_oAscHyperlinkType.RangeLink === val.asc_getType()) {
								val.hyperlinkModel._updateLocation();
                                if (null === val.hyperlinkModel.LocationRangeBbox) {
                                    bIsUpdate = false;
                                    break;
                                }
                            }
							if (null !== val.asc_getText()) {
								// Вставим текст в активную ячейку (а не так, как MSExcel в первую ячейку диапазона)
								mc = t.model.getMergedByCell(activeCell.row, activeCell.col);
								c = mc ? mc.c1 : activeCell.col;
								r = mc ? mc.r1 : activeCell.row;
								t.model.getRange3(r, c, r, c).setValue(val.asc_getText());
								// Вызываем функцию пересчета для заголовков форматированной таблицы
								t.model.autoFilters.renameTableColumn(range.bbox);
							}

                            val.hyperlinkModel.Ref = range;
                            range.setHyperlink(val.hyperlinkModel);
                            break;
                        } else {
                            bIsUpdate = false;
                            break;
                        }

                    default:
                        bIsUpdate = false;
                        break;
                }

				t.model.excludeHiddenRows(false);

                if (bIsUpdate) {
					t.canChangeColWidth = canChangeColWidth;
					t._updateRange(item);
					t.canChangeColWidth = c_oAscCanChangeColWidth.none;

                    hasUpdates = true;
                }
            });

			t.model.workbook.handlers.trigger("cleanCutData", true, true);

			//в случае, если вставляем из глобального буфера, транзакцию закрываем внутри функции _loadDataBeforePaste на callbacks от загрузки шрифтов и картинок
			if (prop !== "paste"/* || (prop === "paste" && val.fromBinary)*/) {
				History.EndTransaction();
				/*if(prop === "paste") {
					window['AscCommon'].g_specialPasteHelper.Paste_Process_End();
				}*/
			}

			if (hasUpdates) {
				t.draw();
			}
			if (callTrigger) {
				t.handlers.trigger("slowOperation", false);
			}

			if(prop === "paste") {
				if(val.needDraw) {
					t.draw();
				} else {
					val.needDraw = true;
				}
			}
        };

		if ("paste" === prop) {
		    if (val.onlyImages) {
				onSelectionCallback(true);
				return;
            } else {
				var newRange = val.fromBinary ? this._pasteFromBinary(val.data, true) : this._pasteFromHTML(val.data, true);
				checkRange = [newRange];

				if(this.intersectionFormulaArray(newRange)) {
					t.handlers.trigger("onErrorEvent", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
					return false;
				}
            }
        } else if (onlyActive) {
			checkRange.push(new asc_Range(activeCell.col, activeCell.row, activeCell.col, activeCell.row));
		} else {
			this.model.selectionRange.ranges.forEach(function (item) {
				checkRange.push(item.clone());
			});
		}

		if (("merge" === prop || "paste" === prop || "sort" === prop || "hyperlink" === prop || "rh" === prop ||
			"customSort" === prop) && this.model.inPivotTable(checkRange)) {
			this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot,
				c_oAscError.Level.NoCritical);
			return;
		}
		if ("empty" === prop && !this.model.checkDeletePivotTables(checkRange)) {
		    // ToDo other error
			this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot,
				c_oAscError.Level.NoCritical);
			return;
        }
		if("empty" === prop && this.intersectionFormulaArray(arn)) {
			t.handlers.trigger("onErrorEvent", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
			return;
		}
		if("sort" === prop) {
			var aMerged = this.model.mergeManager.get(checkRange);
			if (aMerged.outer.length > 0 || (aMerged.inner.length > 0 && null == window['AscCommonExcel']._isSameSizeMerged(checkRange, aMerged.inner, true))) {
				t.handlers.trigger("onErrorEvent", c_oAscError.ID.CannotFillRange, c_oAscError.Level.NoCritical);
				return;
			}
		}
		this._isLockedCells(checkRange, /*subType*/null, onSelectionCallback);
    };

	WorksheetView.prototype.specialPaste = function (props) {
		var api = window["Asc"]["editor"];
		var t = this;

		var specialPasteHelper = window['AscCommon'].g_specialPasteHelper;
		var specialPasteData = specialPasteHelper.specialPasteData;

		if(!specialPasteData)
		{
			return;
		}

		var isIntoShape = t.objectRender.controller.getTargetDocContent();
		var onSelectionCallback = function(isSuccess)
		{
			if(!isSuccess)
			{
				return false;
			}

			window['AscCommon'].g_specialPasteHelper.Paste_Process_Start();
			window['AscCommon'].g_specialPasteHelper.Special_Paste_Start();

			api.asc_Undo();

			//транзакция закроется в end_paste
			History.Create_NewPoint();
			History.StartTransaction();

			//далее специальная вставка
			specialPasteHelper.specialPasteProps = props;
			//TODO пока для закрытия транзации выставляю флаг. пересмотреть!
			window['AscCommon'].g_specialPasteHelper.bIsEndTransaction = true;
			AscCommonExcel.g_clipboardExcel.pasteData(t, specialPasteData._format, specialPasteData.data1, specialPasteData.data2, specialPasteData.text_data, true);
		};

		if(specialPasteData.activeRange && !isIntoShape)
		{
			this._isLockedCells(specialPasteData.activeRange.ranges, /*subType*/null, props && props.width ? t._isLockedAll(onSelectionCallback) : onSelectionCallback);
		}
		else
		{
			onSelectionCallback(true);
		}
	};

    WorksheetView.prototype._pasteData = function (isLargeRange, fromBinary, val, bIsUpdate, pasteToRange, bText) {
        var t = this;
		var specialPasteHelper = window['AscCommon'].g_specialPasteHelper;
		var specialPasteProps = specialPasteHelper.specialPasteProps;

		if ( val.props && val.props.onlyImages === true ) {
			if(!specialPasteHelper.specialPasteStart)
			{
				this.handlers.trigger("showSpecialPasteOptions", [Asc.c_oSpecialPasteProps.picture]);
			}
			return;
		}

        var callTrigger = false;
        if (isLargeRange) {
            callTrigger = true;
            t.handlers.trigger("slowOperation", true);
        }

		//если вставка производится внутрь ф/т, расширяем её вниз
		var activeTable = t.model.autoFilters.getTableContainActiveCell(t.model.selectionRange.activeCell);
		var newRange;
		if (pasteToRange && activeTable && specialPasteProps.formatTable) {
			var delta = pasteToRange.r2 - activeTable.Ref.r2;
			if(delta > 0) {
				//TODO пересмотреть!
				//пока сделал при вставке в ф/т расширяем только в случае, если внизу есть пустые строки, сдвиг не делаем
				//потому что в случае совместного редактирования необходимо лочить весь лист(из-за сдвига)
				//и так же необходимо заранее расширить область обновления, чтобы данные внизу ф/т перерисовались
				//и ещё excel ругается, когда область вставки затрагивает несколько таблиц - причём не во всех случаях - просмотреть!
				//так же рассмотреть ситуацию, когда вставляется ниже последней строки ф/т заполненные текстом даные(если хоть 1 ячека содержит текст) - баг 26402
				if(false && !t.model.autoFilters._isPartTablePartsUnderRange(activeTable.Ref)) {
					//сдвигаем и расширяем
					t.model.getRange3(activeTable.Ref.r2 + 1, activeTable.Ref.c1, activeTable.Ref.r2 + delta, activeTable.Ref.c2).addCellsShiftBottom();
					newRange = new Asc.Range(activeTable.Ref.c1, activeTable.Ref.r1, activeTable.Ref.c2, activeTable.Ref.r2 + delta);
				} else {
					//в противном случае используем ячейки внизу таблицы без сдвига, перед этим проверяем на предмет наличия пустых строк под таблицей
					var tempRange = new Asc.Range(activeTable.Ref.c1, activeTable.Ref.r2 + 1, activeTable.Ref.c2, activeTable.Ref.r2 + delta);
					if(t.model.autoFilters._isEmptyRange(tempRange, 0)) {
						//расширяем таблицу вниз
						newRange = new Asc.Range(activeTable.Ref.c1, activeTable.Ref.r1, activeTable.Ref.c2, activeTable.Ref.r2 + delta);
					}
				}
				if(newRange) {
					t.model.autoFilters.changeTableRange(activeTable.DisplayName, newRange);
				}
			}
		}

		var pasteRange = AscCommonExcel.g_clipboardExcel.pasteProcessor.activeRange;
		var activeCellsPasteFragment = typeof pasteRange === "string" ? AscCommonExcel.g_oRangeCache.getAscRange(pasteRange) : pasteRange;

		//для бага 26402 - добавляю возможность продолжения ф/т если вставляем фрагмент по ширине такой же как и ф/т
		//и имеет хоть одну ячейку с данными
		if(specialPasteProps.formatTable) {
			var tableIndexAboveRange = t.model.autoFilters.searchRangeInTableParts(new Asc.Range(pasteToRange.c1, pasteToRange.r1 - 1, pasteToRange.c1, pasteToRange.r1 - 1));
			var tableAboveRange = t.model.TableParts[tableIndexAboveRange];

			if(tableAboveRange && tableAboveRange.Ref && !tableAboveRange.isTotalsRow() && tableAboveRange.Ref.c1 === pasteToRange.c1 && tableAboveRange.Ref.c2 === pasteToRange.c2) {
				//далее проверяем наличие ф/т в области вставки
				if(-1 === t.model.autoFilters.searchRangeInTableParts(pasteToRange)) {
					//проверям на наличие хотя бы одной значимой ячейки в диапазоне, который вставляем
					if(activeCellsPasteFragment && fromBinary && !val.autoFilters._isEmptyRange(activeCellsPasteFragment, 0)) {
						newRange = new Asc.Range(tableAboveRange.Ref.c1, tableAboveRange.Ref.r1, pasteToRange.c2, pasteToRange.r2);
						//продлеваем ф/т
						t.model.autoFilters.changeTableRange(tableAboveRange.DisplayName, newRange);
					}
				}
			}
		}



		//добавляем форматированные таблицы
		var arnToRange = t.model.selectionRange.getLast();
        var tablesMap = null, intersectionRangeWithTableParts;
        if (fromBinary && val.TableParts && val.TableParts.length && specialPasteProps.formatTable) {
            var range, tablePartRange, tables = val.TableParts, diffRow, diffCol, curTable, bIsAddTable;
            var activeRange = AscCommonExcel.g_clipboardExcel.pasteProcessor.activeRange;
            var refInsertBinary = AscCommonExcel.g_oRangeCache.getAscRange(activeRange);
            for (var i = 0; i < tables.length; i++) {
                curTable = tables[i];
                tablePartRange = curTable.Ref;
                diffRow = tablePartRange.r1 - refInsertBinary.r1 + arnToRange.r1;
                diffCol = tablePartRange.c1 - refInsertBinary.c1 + arnToRange.c1;
                range = t.model.getRange3(diffRow, diffCol, diffRow + (tablePartRange.r2 - tablePartRange.r1),
                    diffCol + (tablePartRange.c2 - tablePartRange.c1));

                //если в активную область при записи попала лишь часть таблицы
                if(activeCellsPasteFragment && !activeCellsPasteFragment.containsRange(tablePartRange)){
					continue;
				}

                //если область вставки содержит форматированную таблицу, которая пересекается с вставляемой форматированной таблицей
                intersectionRangeWithTableParts = t.model.autoFilters._intersectionRangeWithTableParts(range.bbox);
                if (intersectionRangeWithTableParts) {
                    continue;
                }

                if (curTable.style) {
                    range.cleanFormat();
                }

                //TODO использовать bWithoutFilter из tablePart
                var bWithoutFilter = false;
                if (!curTable.AutoFilter) {
                    bWithoutFilter = true;
                }

				var offset = new AscCommon.CellBase(range.bbox.r1 - tablePartRange.r1, range.bbox.c1 -
					tablePartRange.c1);
                var newDisplayName = this.model.workbook.dependencyFormulas.getNextTableName();
                var props = {
                    bWithoutFilter: bWithoutFilter,
                    tablePart: curTable,
                    offset: offset,
                    displayName: newDisplayName
                };
                t.model.autoFilters.addAutoFilter(curTable.TableStyleInfo.Name, range.bbox, true, true, props);
                if (null === tablesMap) {
                    tablesMap = {};
                }

                tablesMap[curTable.DisplayName] = newDisplayName;
            }

			if(bIsAddTable)
			{
				t._isLockedDefNames(null, null);
			}
        }


        //делаем unmerge ф/т
        intersectionRangeWithTableParts = t.model.autoFilters._intersectionRangeWithTableParts(arnToRange);
        if (intersectionRangeWithTableParts && intersectionRangeWithTableParts.length) {
            var tablePart;
            for (var i = 0; i < intersectionRangeWithTableParts.length; i++) {
                tablePart = intersectionRangeWithTableParts[i];
                this.model.getRange3(tablePart.Ref.r1, tablePart.Ref.c1, tablePart.Ref.r2, tablePart.Ref.c2).unmerge();
            }
        }

        t.model.workbook.dependencyFormulas.lockRecal();
        var selectData;
        if (fromBinary) {
            selectData = t._pasteFromBinary(val, null, tablesMap);
        } else {
			if(bText) {
				specialPasteProps.font = false;
			}
            selectData = t._pasteFromHTML(val, null, specialPasteProps);
        }

        t.model.autoFilters.renameTableColumn(t.model.selectionRange.getLast());

        if (!selectData) {
            bIsUpdate = false;
            t.model.workbook.dependencyFormulas.unlockRecal();
            if (callTrigger) {
                t.handlers.trigger("slowOperation", false);
            }
            return;
        }

        var arrFormula = selectData[1];
		var adjustFormatArr = [];
        for (var i = 0; i < arrFormula.length; ++i) {
            var rangeF = arrFormula[i].range;
            var valF = arrFormula[i].val;
			var arrayRef = arrFormula[i].arrayRef;

			//***array-formula***
			if(arrayRef && window['AscCommonExcel'].bIsSupportArrayFormula) {
				var rangeFormulaArray = this.model.getRange3(arrayRef.r1, arrayRef.c1, arrayRef.r2, arrayRef.c2);
				rangeFormulaArray.setValue(valF, function (r) {
					//ret = r;
				}, true, arrayRef);
				History.Add(AscCommonExcel.g_oUndoRedoArrayFormula, AscCH.historyitem_ArrayFromula_AddFormula, this.model.getId(),
					new Asc.Range(arrayRef.c1, arrayRef.r1, arrayRef.c2, arrayRef.r2), new AscCommonExcel.UndoRedoData_ArrayFormula(arrayRef, valF));
			} else if (rangeF.isOneCell()) {
                rangeF.setValue(valF, null, true);
				if(!fromBinary) {
					adjustFormatArr.push(rangeF);
				}
            } else {
                var oBBox = rangeF.getBBox0();
                t.model._getCell(oBBox.r1, oBBox.c1, function(cell) {
                    cell.setValue(valF, null, true);
                });
            }
        }

        t.model.workbook.dependencyFormulas.unlockRecal();
		//добавил для случая, когда вставка формулы проиходит в заголовок таблицы
		if(arrFormula && arrFormula.length) {
			t.model.autoFilters.renameTableColumn(t.model.selectionRange.getLast());
		}

		//for special paste
		if(!window['AscCommon'].g_specialPasteHelper.specialPasteStart)
		{
			//var specialPasteShowOptions = new Asc.SpecialPasteShowOptions();
			var allowedSpecialPasteProps;
			var sProps = Asc.c_oSpecialPasteProps;
			if(fromBinary)
			{
				allowedSpecialPasteProps = [sProps.paste, sProps.pasteOnlyFormula, sProps.formulaNumberFormat, sProps.formulaAllFormatting, sProps.formulaWithoutBorders, sProps.formulaColumnWidth,  sProps.pasteOnlyValues, sProps.valueNumberFormat, sProps.valueAllFormating, sProps.pasteOnlyFormating/*, sProps.link*/];
				if(!(val.TableParts && val.TableParts.length))
				{
					//add transpose property
					allowedSpecialPasteProps.push(sProps.transpose);
				}
			}
			else
			{
				//matchDestinationFormatting - пока не добавляю, так как работает как и values
				if(bText) {
					allowedSpecialPasteProps = [sProps.keepTextOnly, sProps.useTextImport];
				} else {
					allowedSpecialPasteProps = [sProps.sourceformatting, sProps.destinationFormatting];
				}
			}
			window['AscCommon'].g_specialPasteHelper.CleanButtonInfo();
			window['AscCommon'].g_specialPasteHelper.buttonInfo.asc_setOptions(allowedSpecialPasteProps);
			window['AscCommon'].g_specialPasteHelper.buttonInfo.setRange(selectData[0]);
		}
		else
		{
			window['AscCommon'].g_specialPasteHelper.buttonInfo.setRange(selectData[0]);
			window['AscCommon'].g_specialPasteHelper.SpecialPasteButton_Update_Position();
		}

		return {selectData: selectData, adjustFormatArr: adjustFormatArr};
    };

    WorksheetView.prototype._loadDataBeforePaste = function ( isLargeRange, val, pasteContent, bIsUpdate, canChangeColWidth, pasteToRange ) {
        var t = this;
		var specialPasteHelper = window['AscCommon'].g_specialPasteHelper;
		var specialPasteProps = specialPasteHelper.specialPasteProps;
		var selectData;
		var specialPasteChangeColWidth = specialPasteProps && specialPasteProps.width;

		var callbackLoadFonts = function() {
			_doPaste();

			selectData = selectData ? selectData.selectData : null;
			if(!selectData) {
				window['AscCommon'].g_specialPasteHelper.Paste_Process_End();
				return;
			}

			var arn = selectData[0];
			var selectionRange = arn.clone(true);
			if (bIsUpdate) {
				if (isLargeRange) {
					t.handlers.trigger("slowOperation", false);
				}

				if(specialPasteChangeColWidth) {
					t.changeWorksheet("update");
				} else {
					t._updateRange(arn);
				}
			}
			window['AscCommon'].g_specialPasteHelper.Paste_Process_End();

			if(val.needDraw) {
				t.draw();
			} else {
				val.needDraw = true;
			}

			var oSelection = History.GetSelection();
			if (null != oSelection) {
				oSelection = oSelection.clone();
				oSelection.assign(selectionRange.c1, selectionRange.r1, selectionRange.c2, selectionRange.r2);
				History.SetSelection(oSelection);
				History.SetSelectionRedo(oSelection);
			}
		};

		var _doPaste = function() {

			var fromBinaryExcel = val.fromBinary;
			//paste from excel binary
			if(fromBinaryExcel)
			{
				AscCommonExcel.executeInR1C1Mode(false, function () {
					selectData = t._pasteData(isLargeRange, fromBinaryExcel, pasteContent, bIsUpdate, pasteToRange);
				});

				History.EndTransaction();
			}
			else
			{
				var imagesFromWord = pasteContent.props.addImagesFromWord;
				if (imagesFromWord && imagesFromWord.length != 0 && !(window["Asc"]["editor"] && window["Asc"]["editor"].isChartEditor) && specialPasteProps.images) {
					var oObjectsForDownload = AscCommon.GetObjectsForImageDownload(pasteContent.props._aPastedImages);
					var oImageMap;

					//if already load images on server
					if (AscCommonExcel.g_clipboardExcel.pasteProcessor.alreadyLoadImagesOnServer === true) {
						oImageMap = {};
						for (var i = 0, length = oObjectsForDownload.aBuilderImagesByUrl.length; i < length; ++i) {
							var url = oObjectsForDownload.aUrls[i];

							//get name from array already load on server urls
							var name = AscCommonExcel.g_clipboardExcel.pasteProcessor.oImages[url];
							var aImageElem = oObjectsForDownload.aBuilderImagesByUrl[i];
							if (name) {
								if (Array.isArray(aImageElem)) {
									for (var j = 0; j < aImageElem.length; ++j) {
										var imageElem = aImageElem[j];
										if (null != imageElem) {
											imageElem.SetUrl(name);
										}
									}
								}
								oImageMap[i] = name;
							} else {
								oImageMap[i] = url;
							}
						}

						AscCommonExcel.executeInR1C1Mode(false, function () {
							selectData = t._pasteData(isLargeRange, fromBinaryExcel, pasteContent, bIsUpdate, pasteToRange);
						});
						AscCommonExcel.g_clipboardExcel.pasteProcessor._insertImagesFromBinaryWord(t, pasteContent, oImageMap);
					} else {
						oImageMap = pasteContent.props.oImageMap;
						if (window["NATIVE_EDITOR_ENJINE"]) {
							//TODO для мобильных приложений  - не рабочий код!
							AscCommon.ResetNewUrls(pasteContent.props.data, oObjectsForDownload.aUrls, oObjectsForDownload.aBuilderImagesByUrl, oImageMap);
							AscCommonExcel.executeInR1C1Mode(false, function () {
								selectData = t._pasteData(isLargeRange, fromBinaryExcel, pasteContent, bIsUpdate, pasteToRange);
							});
							AscCommonExcel.g_clipboardExcel.pasteProcessor._insertImagesFromBinaryWord(t, pasteContent, oImageMap);
						} else {
							AscCommonExcel.executeInR1C1Mode(false, function () {
								selectData = t._pasteData(isLargeRange, fromBinaryExcel, pasteContent, bIsUpdate, pasteToRange);
							});
							AscCommonExcel.g_clipboardExcel.pasteProcessor._insertImagesFromBinaryWord(t, pasteContent, oImageMap);
						}
					}
				} else {
					AscCommonExcel.executeInR1C1Mode(false, function () {
						selectData = t._pasteData(isLargeRange, fromBinaryExcel, pasteContent, bIsUpdate, pasteToRange, val.bText);
					});
				}

				if(selectData && selectData.adjustFormatArr && selectData.adjustFormatArr.length) {
					for(i = 0; i < selectData.adjustFormatArr.length; i++) {
						selectData.adjustFormatArr[i]._foreach(function(cell){
							cell._adjustCellFormat();
						});
					}
				}

				History.EndTransaction();
			}

		};

		var fonts = pasteContent.props && pasteContent.props.fontsNew ? pasteContent.props.fontsNew : val.fontsNew;
		//загрузка шрифтов, в случае удачи на callback вставляем текст
		t._loadFonts(fonts, callbackLoadFonts);
    };

    WorksheetView.prototype._pasteFromHTML = function (pasteContent, isCheckSelection, specialPasteProps) {
        var t = this;
        var wb = window["Asc"]["editor"].wb;
        var lastSelection = this.model.selectionRange.getLast();
        var arn = AscCommonExcel.g_clipboardExcel.pasteProcessor && AscCommonExcel.g_clipboardExcel.pasteProcessor.activeRange ?
         AscCommonExcel.g_clipboardExcel.pasteProcessor.activeRange : lastSelection;

        var arrFormula = [];
        var numFor = 0;
        var rMax = pasteContent.content.length + pasteContent.props.rowSpanSpCount + arn.r1;
        var cMax = pasteContent.props.cellCount + arn.c1;

        var isMultiple = false;
        var firstCell = t.model.getRange3(arn.r1, arn.c1, arn.r1, arn.c1);
        var isMergedFirstCell = firstCell.hasMerged();
        var rangeUnMerge = t.model.getRange3(arn.r1, arn.c1, rMax - 1, cMax - 1);
        var isOneMerge = false;

        //если вставляем в мерженную ячейку, диапазон которой больше или равен
		var fPasteCell = pasteContent.content[0][0];
        if (arn.c2 >= cMax - 1 && arn.r2 >= rMax - 1 && isMergedFirstCell && isMergedFirstCell.isEqual(arn) &&  cMax - arn.c1 === fPasteCell.colSpan && rMax - arn.r1 === fPasteCell.rowSpan) {
            if (!isCheckSelection) {
                pasteContent.content[0][0].colSpan = isMergedFirstCell.c2 - isMergedFirstCell.c1 + 1;
                pasteContent.content[0][0].rowSpan = isMergedFirstCell.r2 - isMergedFirstCell.r1 + 1;
            }
            isOneMerge = true;
        }
		else {
            //проверка на наличие части объединённой ячейки в области куда осуществляем вставку
            for (var rFirst = arn.r1; rFirst < rMax; ++rFirst) {
                for (var cFirst = arn.c1; cFirst < cMax; ++cFirst) {
                    var range = t.model.getRange3(rFirst, cFirst, rFirst, cFirst);
                    var merged = range.hasMerged();
                    if (merged) {
                        if (merged.r1 < arn.r1 || merged.r2 > rMax - 1 || merged.c1 < arn.c1 || merged.c2 > cMax - 1) {
                            //ошибка в случае если вставка происходит в часть объедененной ячейки
                            if (isCheckSelection) {
                                return arn;
                            } else {
                                this.handlers.trigger("onErrorEvent", c_oAscError.ID.PastInMergeAreaError,
                                  c_oAscError.Level.NoCritical);
                                return;
                            }
                        }
                    }
                }
            }
        }

        var rMax2 = rMax;
        var cMax2 = cMax;
        rMax = pasteContent.content.length;
        if (isCheckSelection) {
            var newArr = arn.clone(true);
            newArr.r2 = rMax2 - 1;
            newArr.c2 = cMax2 - 1;
            if (isMultiple || isOneMerge) {
                newArr.r2 = lastSelection.r2;
                newArr.c2 = lastSelection.c2;
            }
            return newArr;
        }

        //если не возникает конфликт, делаем unmerge
		if(specialPasteProps.format)
		{
			rangeUnMerge.unmerge();
			//this.cellCommentator.deleteCommentsRange(rangeUnMerge.bbox);
		}

        if (!isOneMerge) {
            arn.r2 = (rMax2 - 1 > 0) ? (rMax2 - 1) : 0;
            arn.c2 = (cMax2 - 1 > 0) ? (cMax2 - 1) : 0;
        }

		var maxARow = 1, maxACol = 1, plRow = 0, plCol = 0;
		var mergeArr = [];
		var putInsertedCellIntoRange = function(row, col, currentObj)
		{
			var pastedRangeProps = {};
			var contentCurrentObj = currentObj.content;
			var range = t.model.getRange3(row, col, row, col);

			//value
			if (contentCurrentObj.length === 1) {
				var onlyOneChild = contentCurrentObj[0];
				var valFormat = onlyOneChild.text;
				pastedRangeProps.val = valFormat;
				pastedRangeProps.font = onlyOneChild.format;
			} else {
				pastedRangeProps.value2 = contentCurrentObj;
				pastedRangeProps.alignVertical = currentObj.va;
				pastedRangeProps.val = currentObj.textVal;
			}

			if (contentCurrentObj.length === 1 && contentCurrentObj[0].format) {
				var fs = contentCurrentObj[0].format.getSize();
				if (fs !== '' && fs !== null && fs !== undefined) {
				   pastedRangeProps.fontSize = fs;
				}
			}

			//fontFamily
			if (currentObj.props && currentObj.props.fontName) {
				pastedRangeProps.fontName = currentObj.props.fontName;
			}

			//AlignHorizontal
			if (!isOneMerge) {
				pastedRangeProps.alignHorizontal = currentObj.a;
			}

			//for merge
			var isMerged = false;
			for (var mergeCheck = 0; mergeCheck < mergeArr.length; ++mergeCheck) {
				if (mergeArr[mergeCheck].contains(col, row)) {
					isMerged = true;
				}
			}
			if ((currentObj.colSpan > 1 || currentObj.rowSpan > 1) && !isMerged) {
				var offsetCol  = currentObj.colSpan - 1;
				var offsetRow = currentObj.rowSpan - 1;
				pastedRangeProps.offsetLast = new AscCommon.CellBase(offsetRow, offsetCol);

				mergeArr.push(new Asc.Range(range.bbox.c1, range.bbox.r1, range.bbox.c2 + offsetCol, range.bbox.r2 + offsetRow));
				if (contentCurrentObj[0] == undefined) {
					pastedRangeProps.val = '';
				}
				pastedRangeProps.merge = c_oAscMergeOptions.Merge;
			}

			//borders
			if (!isOneMerge) {
				pastedRangeProps.borders = currentObj.borders;
			}

			//wrap
			pastedRangeProps.wrap = currentObj.wrap;

			//fill
			if (currentObj.bc && currentObj.bc.rgb) {
				pastedRangeProps.fillColor = currentObj.bc;
			}

			//hyperlink
			if (currentObj.hyperLink || currentObj.location) {
				pastedRangeProps.hyperLink = currentObj;
			}

			//apply props by cell
			t._setPastedDataByCurrentRange(range, pastedRangeProps, {arrFormula: arrFormula}, specialPasteProps);
		};

        for (var autoR = 0; autoR < maxARow; ++autoR) {
            for (var autoC = 0; autoC < maxACol; ++autoC) {
                for (var r = 0; r < rMax; ++r) {
                    for (var c = 0; c < pasteContent.content[r].length; ++c) {
                        if (undefined !== pasteContent.content[r][c]) {
							var pasteIntoRow = r + autoR * plRow + arn.r1;
							var pasteIntoCol = c + autoC * plCol + arn.c1;

                            var currentObj = pasteContent.content[r][c];

							putInsertedCellIntoRange(pasteIntoRow, pasteIntoCol, currentObj);
                        }
                    }
                }
            }
        }

        if (isMultiple) {
            arn.r2 = lastSelection.r2;
            arn.c2 = lastSelection.c2;
        }

        t.isChanged = true;
        lastSelection.c2 = arn.c2;
        lastSelection.r2 = arn.r2;

		return [arn, arrFormula];
    };

    WorksheetView.prototype._pasteFromBinary = function (val, isCheckSelection, tablesMap) {
        var t = this;
		var trueActiveRange = t.model.selectionRange.getLast().clone();
		var lastSelection = this.model.selectionRange.getLast();
        var arn = t.model.selectionRange.getLast().clone();
        var arrFormula = [];

        var pasteRange = AscCommonExcel.g_clipboardExcel.pasteProcessor.activeRange;
        var activeCellsPasteFragment = typeof pasteRange === "string" ? AscCommonExcel.g_oRangeCache.getAscRange(pasteRange) : pasteRange;

		var specialPasteHelper = window['AscCommon'].g_specialPasteHelper;
		var specialPasteProps = specialPasteHelper.specialPasteProps;

		var countPasteRow = activeCellsPasteFragment.r2 - activeCellsPasteFragment.r1 + 1;
		var countPasteCol = activeCellsPasteFragment.c2 - activeCellsPasteFragment.c1 + 1;
		if(specialPasteProps && specialPasteProps.transpose) {
			countPasteRow = activeCellsPasteFragment.c2 - activeCellsPasteFragment.c1 + 1;
			countPasteCol = activeCellsPasteFragment.r2 - activeCellsPasteFragment.r1 + 1;
		}
        var rMax = countPasteRow + arn.r1;
        var cMax = countPasteCol + arn.c1;

        if (cMax > gc_nMaxCol0) {
            cMax = gc_nMaxCol0;
        }
        if (rMax > gc_nMaxRow0) {
            rMax = gc_nMaxRow0;
        }

        var isMultiple = false;
        var firstCell = t.model.getRange3(arn.r1, arn.c1, arn.r1, arn.c1);
        var isMergedFirstCell = firstCell.hasMerged();
        var isOneMerge = false;


        var startCell = val.getCell3(activeCellsPasteFragment.r1, activeCellsPasteFragment.c1);
        var isMergedStartCell = startCell.hasMerged();

        var firstValuesCol;
        var firstValuesRow;
        if (isMergedStartCell != null) {
            firstValuesCol = isMergedStartCell.c2 - isMergedStartCell.c1;
            firstValuesRow = isMergedStartCell.r2 - isMergedStartCell.r1;
        } else {
            firstValuesCol = 0;
            firstValuesRow = 0;
        }

		var excludeHiddenRows = t.model.autoFilters.bIsExcludeHiddenRows(t.model.selectionRange.getLast(), t.model.selectionRange.activeCell);
		var hiddenRowsArray = {};
		var getOpenRowsCount = function(oRange) {
			var res = oRange.r2 - oRange.r1 + 1;
			if(false && excludeHiddenRows) {
				var tempRange = t.model.getRange3(oRange.r1,0,oRange.r2, 0);
				tempRange._foreachRowNoEmpty(function(row) {
					if(row.getHidden()) {
						res--;
						if(!isCheckSelection) {
							hiddenRowsArray[row.index] = 1;
						}
					}
				});
			}
			return res;
		};

        var rowDiff = arn.r1 - activeCellsPasteFragment.r1;
        var colDiff = arn.c1 - activeCellsPasteFragment.c1;
        var newPasteRange = new Asc.Range(arn.c1 - colDiff, arn.r1 - rowDiff, arn.c2 - colDiff, arn.r2 - rowDiff);
        //если вставляем в мерженную ячейку, диапазон которой больше или меньше, но не равен выделенной области
        if (isMergedFirstCell && isMergedFirstCell.isEqual(arn) && cMax - arn.c1 === (firstValuesCol + 1) &&
          rMax - arn.r1 === (firstValuesRow + 1) && !newPasteRange.isEqual(activeCellsPasteFragment)) {
            isOneMerge = true;
            rMax = arn.r2 + 1;
            cMax = arn.c2 + 1;
        } else if (arn.c2 >= cMax - 1 && arn.r2 >= rMax - 1) {
            //если область кратная куску вставки
            var widthArea = arn.c2 - arn.c1 + 1;
            var heightArea = getOpenRowsCount(arn);
            var widthPasteFr = cMax - arn.c1;
            var heightPasteFr = rMax - arn.r1;
            //если кратны, то обрабатываем
            if (widthArea % widthPasteFr === 0 && heightArea % heightPasteFr === 0) {
				//Для случая, когда выделен весь диапазон, запрещаю множественную вставку
				if(arn.getType() !== window["Asc"].c_oAscSelectionType.RangeMax && arn.getType() !== window["Asc"].c_oAscSelectionType.RangeCol && arn.getType() !== window["Asc"].c_oAscSelectionType.RangeRow) {
					isMultiple = true;
				}
            } else if (firstCell.hasMerged() !== null)//в противном случае ошибка
            {
                if (isCheckSelection) {
                    return arn;
                } else {
                    this.handlers.trigger("onError", c_oAscError.ID.PastInMergeAreaError, c_oAscError.Level.NoCritical);
                    return;
                }
            }
        } else {
            //проверка на наличие части объединённой ячейки в области куда осуществляем вставку
            for (var rFirst = arn.r1; rFirst < rMax; ++rFirst) {
                for (var cFirst = arn.c1; cFirst < cMax; ++cFirst) {
                    var range = t.model.getRange3(rFirst, cFirst, rFirst, cFirst);
                    var merged = range.hasMerged();
                    if (merged) {
                        if (merged.r1 < arn.r1 || merged.r2 > rMax - 1 || merged.c1 < arn.c1 || merged.c2 > cMax - 1) {
                            //ошибка в случае если вставка происходит в часть объедененной ячейки
                            if (isCheckSelection) {
                                return arn;
                            } else {
                                this.handlers.trigger("onErrorEvent", c_oAscError.ID.PastInMergeAreaError,
                                  c_oAscError.Level.NoCritical);
                                return;
                            }
                        }
                    }
                }
            }
        }

        var rMax2 = rMax;
        var cMax2 = cMax;
        var getLockRange = function() {
			var newArr = arn.clone(true);
			newArr.r2 = rMax2 - 1;
			newArr.c2 = cMax2 - 1;
			if (isMultiple || isOneMerge) {
				newArr.r2 = arn.r2;
				newArr.c2 = arn.c2;
			}
			return newArr;
		};

		if (isCheckSelection) {
			return getLockRange();
		}

		var bboxUnMerge = getLockRange();
		var rangeUnMerge = t.model.getRange3(bboxUnMerge.r1, bboxUnMerge.c1, bboxUnMerge.r2, bboxUnMerge.c2);

		//если не возникает конфликт, делаем unmerge
		if (specialPasteProps.format) {
			rangeUnMerge.unmerge();
			this.cellCommentator.deleteCommentsRange(rangeUnMerge.bbox);
		}
		if (!isOneMerge) {
			arn.r2 = rMax2 - 1;
			arn.c2 = cMax2 - 1;
		}

		var maxARow = 1, maxACol = 1, plRow = 0, plCol = 0;
		if (isMultiple)//случай автозаполнения сложных форм
		{
			if (specialPasteProps.format) {
				t.model.getRange3(trueActiveRange.r1, trueActiveRange.c1, trueActiveRange.r2, trueActiveRange.c2)
					.unmerge();
			}
			maxARow = heightArea / heightPasteFr;
			maxACol = widthArea / widthPasteFr;
			plRow = (rMax2 - arn.r1);
			plCol = (arn.c2 - arn.c1) + 1;
		} else {
			trueActiveRange.r2 = arn.r2;
			trueActiveRange.c2 = arn.c2;
		}

		//необходимо проверить, пересекаемся ли мы с фоматированной таблицей
		//если да, то подхватывать dxf при вставке не нужно
		var intersectionAllRangeWithTables = t.model.autoFilters._intersectionRangeWithTableParts(trueActiveRange);


		var addComments = function (pasteRow, pasteCol, comments) {
			var comment;
			for (var i = 0; i < comments.length; i++) {
				comment = comments[i];
				if (comment.nCol == pasteCol && comment.nRow == pasteRow) {
					var commentData = comment.clone(true);
					//change nRow, nCol
					commentData.asc_putCol(nCol);
					commentData.asc_putRow(nRow);
					t.cellCommentator.addComment(commentData, true);
				}
			}
		};

		var mergeArr = [];
		var checkMerge = function(range, curMerge, nRow, nCol, rowDiff, colDiff, pastedRangeProps)
		{
			var isMerged = false;

			for (var mergeCheck = 0; mergeCheck < mergeArr.length; ++mergeCheck) {
				if (mergeArr[mergeCheck].contains(nCol, nRow)) {
					isMerged = true;
				}
			}

			if (!isOneMerge) {
				if (curMerge != null && !isMerged) {
					var offsetCol = curMerge.c2 - curMerge.c1;
					if (offsetCol + nCol >= gc_nMaxCol0) {
						offsetCol = gc_nMaxCol0 - nCol;
					}

					var offsetRow = curMerge.r2 - curMerge.r1;
					if (offsetRow + nRow >= gc_nMaxRow0) {
						offsetRow = gc_nMaxRow0 - nRow;
					}

					pastedRangeProps.offsetLast = new AscCommon.CellBase(offsetRow, offsetCol);
					if(specialPasteProps.transpose)
					{
						mergeArr.push(new Asc.Range(
							curMerge.c1 + arn.c1 - activeCellsPasteFragment.r1 + colDiff,
							curMerge.r1 + arn.r1 - activeCellsPasteFragment.c1 + rowDiff,
							curMerge.c2 + arn.c1 - activeCellsPasteFragment.r1 + colDiff,
							curMerge.r2 + arn.r1 - activeCellsPasteFragment.c1 + rowDiff
						));
					}
					else
					{
						mergeArr.push(new Asc.Range(
							curMerge.c1 + arn.c1 - activeCellsPasteFragment.c1 + colDiff,
							curMerge.r1 + arn.r1 - activeCellsPasteFragment.r1 + rowDiff,
							curMerge.c2 + arn.c1 - activeCellsPasteFragment.c1 + colDiff,
							curMerge.r2 + arn.r1 - activeCellsPasteFragment.r1 + rowDiff
						));
					}
				}
			}
			else {
				if (!isMerged) {
					pastedRangeProps.offsetLast = new AscCommon.CellBase(isMergedFirstCell.r2 - isMergedFirstCell.r1, isMergedFirstCell.c2 - isMergedFirstCell.c1);
					mergeArr.push(new Asc.Range(isMergedFirstCell.c1, isMergedFirstCell.r1, isMergedFirstCell.c2, isMergedFirstCell.r2));
				}
			}
		};

		var getTableDxf = function (pasteRow, pasteCol, newVal) {
			var dxf = null;

			if (false !== intersectionAllRangeWithTables) {
				return {dxf: null};
			}

			var tables = val.autoFilters._intersectionRangeWithTableParts(newVal.bbox);
			var blocalArea = true;
			if (tables && tables[0]) {
				var table = tables[0];
				var styleInfo = table.TableStyleInfo;
				var styleForCurTable = styleInfo ? t.model.workbook.TableStyles.AllStyles[styleInfo.Name] : null;

				if (activeCellsPasteFragment.containsRange(table.Ref)) {
					blocalArea = false;
				}

				if (!styleForCurTable) {
					return null;
				}

				var headerRowCount = 1;
				var totalsRowCount = 0;
				if (null != table.HeaderRowCount) {
					headerRowCount = table.HeaderRowCount;
				}
				if (null != table.TotalsRowCount) {
					totalsRowCount = table.TotalsRowCount;
				}

				var bbox = new Asc.Range(table.Ref.c1, table.Ref.r1, table.Ref.c2, table.Ref.r2);
				styleForCurTable.initStyle(val.sheetMergedStyles, bbox, styleInfo, headerRowCount, totalsRowCount);
				val._getCell(pasteRow, pasteCol, function (cell) {
					if (cell) {
						dxf = cell.getCompiledStyle();
					}
					if (null === dxf) {
						pasteRow = pasteRow - table.Ref.r1;
						pasteCol = pasteCol - table.Ref.c1;
						dxf = val.getCompiledStyle(pasteRow, pasteCol);
					}
				});
			}

			return {dxf: dxf, blocalArea: blocalArea};
		};

		var colsWidth = {};
		var putInsertedCellIntoRange = function (nRow, nCol, pasteRow, pasteCol, rowDiff, colDiff, range, newVal, curMerge, transposeRange) {
			var pastedRangeProps = {};
			//range может далее изменится в связи с наличием мерженных ячеек, firstRange - не меняется(ему делаем setValue, как первой ячейке в диапазоне мерженных)
			var firstRange = range.clone();

			//****paste comments****
			if (specialPasteProps.comment && val.aComments && val.aComments.length) {
				addComments(pasteRow, pasteCol, val.aComments);
			}

			//merge
			checkMerge(range, curMerge, nRow, nCol, rowDiff, colDiff, pastedRangeProps);

			//set style
			if (!isOneMerge) {
				pastedRangeProps.cellStyle = newVal.getStyleName();
			}

			if (!isOneMerge)//settings for cell(format)
			{
				//format
				var numFormat = newVal.getNumFormat();
				var nameFormat;
				if (numFormat && numFormat.sFormat) {
					nameFormat = numFormat.sFormat;
				}

				pastedRangeProps.numFormat = nameFormat;
			}

			if (!isOneMerge)//settings for cell
			{
				var align = newVal.getAlign();
				//vertical align
				pastedRangeProps.alignVertical = align.getAlignVertical();
				//horizontal align
				pastedRangeProps.alignHorizontal = align.getAlignHorizontal();

				//borders
				var fullBorders;
				if (specialPasteProps.transpose) {
					//TODO сделано для правильного отображения бордеров при транспонирования. возможно стоит использовать эту функцию во всех ситуациях. проверить!
					fullBorders = newVal.getBorder(newVal.bbox.r1, newVal.bbox.c1).clone();
				} else {
					fullBorders = newVal.getBorderFull();
				}
				if (pastedRangeProps.offsetLast && pastedRangeProps.offsetLast.col > 0 && curMerge && fullBorders) {
					//для мерженных ячеек, правая границу
					var endMergeCell = val.getCell3(pasteRow, curMerge.c2);
					var fullBordersEndMergeCell = endMergeCell.getBorderFull();
					if (fullBordersEndMergeCell && fullBordersEndMergeCell.r) {
						fullBorders.r = fullBordersEndMergeCell.r;
					}
				}

				pastedRangeProps.bordersFull = fullBorders;
				//fill
				pastedRangeProps.fill = newVal.getFill();
				//wrap
				//range.setWrap(newVal.getWrap());
				pastedRangeProps.wrap = align.getWrap();
				//angle
				pastedRangeProps.angle = align.getAngle();
				//hyperlink
				pastedRangeProps.hyperlinkObj = newVal.getHyperlink();

				pastedRangeProps.font = newVal.getFont();
			}

			var tableDxf = getTableDxf(pasteRow, pasteCol, newVal);
			if (tableDxf && tableDxf.blocalArea) {
				pastedRangeProps.tableDxfLocal = tableDxf.dxf;
			} else if (tableDxf) {
				pastedRangeProps.tableDxf = tableDxf.dxf;
			}


			if (undefined === colsWidth[nCol]) {
				colsWidth[nCol] = val._getCol(pasteCol);
			}
			pastedRangeProps.colsWidth = colsWidth;

			//***array-formula***
			var fromCell;
			val._getCell(pasteRow, pasteCol, function (cell) {
				fromCell = cell;
			});

			//apply props by cell
			var formulaProps = {
				firstRange: firstRange,
				arrFormula: arrFormula,
				tablesMap: tablesMap,
				newVal: newVal,
				isOneMerge: isOneMerge,
				val: val,
				activeCellsPasteFragment: activeCellsPasteFragment,
				transposeRange: transposeRange,
				cell: fromCell,
				fromRange: activeCellsPasteFragment,
				fromBinary: true
			};
			t._setPastedDataByCurrentRange(range, pastedRangeProps, formulaProps, specialPasteProps);
		};

		//случай, когда при копировании был выделен целый стобец/строка
		var fromSelectionRange = val.selectionRange.getLast();
		var fromSelectionRangeType = fromSelectionRange.getType();
		//MS для случая копирования полностью выделенных столбцов/строк по-разному осуществляет вставку
		//в этот же документ вставляется вся строка/столбец, затирая все данные в строке/столбце
		//в другой документ вставляется лишь фрагмент с данными
		//сделал как 2 вариант в ms - стоит пересмотреть
		if(Asc.c_oAscSelectionType.RangeCol === fromSelectionRangeType || Asc.c_oAscSelectionType.RangeRow === fromSelectionRangeType || Asc.c_oAscSelectionType.RangeMax === fromSelectionRangeType) {
			maxARow = 1;
			maxACol = 1;
		}

		/*var cells;
		 if(Asc.c_oAscSelectionType.RangeMax === fromSelectionRangeType) {
		 cells = this.model.getRange3(0, 0, gc_nMaxRow0, gc_nMaxCol0);
		 cells.cleanAll();
		 } else if(Asc.c_oAscSelectionType.RangeRow === fromSelectionRangeType) {

		 } else if(Asc.c_oAscSelectionType.RangeCol === fromSelectionRangeType) {

		 }*/

		var getNextNoHiddenRow = function(index) {
			var startIndex = index;
			while(hiddenRowsArray[index]) {
				index++;
			}
			return index - startIndex;
		};

		var hiddenRowCount = {};
		for (var autoR = 0; autoR < maxARow; ++autoR) {
			for (var autoC = 0; autoC < maxACol; ++autoC) {
				if(!hiddenRowCount[autoC]) {
					hiddenRowCount[autoC] = 0;
				}
				for (var r = 0; r < rMax - arn.r1; ++r) {
					for (var c = 0; c < cMax - arn.c1; ++c) {
						if(false && isMultiple && hiddenRowsArray[r + autoR * plRow + arn.r1 + hiddenRowCount[autoC]]) {
							hiddenRowCount[autoC] += getNextNoHiddenRow(r + autoR * plRow + arn.r1 + hiddenRowCount[autoC]);
						 }

						var pasteRow = r + activeCellsPasteFragment.r1;
						var pasteCol = c + activeCellsPasteFragment.c1;
						if (specialPasteProps.transpose) {
							pasteRow = c + activeCellsPasteFragment.r1;
							pasteCol = r + activeCellsPasteFragment.c1;
						}

						var newVal = val.getCell3(pasteRow, pasteCol);
						if (undefined !== newVal) {

							var nRow = r + autoR * plRow + arn.r1 + hiddenRowCount[autoC];
							var nCol = c + autoC * plCol + arn.c1;

							if (nRow > gc_nMaxRow0) {
								nRow = gc_nMaxRow0;
							}
							if (nCol > gc_nMaxCol0) {
								nCol = gc_nMaxCol0;
							}

							var curMerge = newVal.hasMerged();
							if (curMerge && specialPasteProps.transpose) {
								curMerge = curMerge.clone();
								var r1 = curMerge.r1;
								var r2 = curMerge.r2;
								var c1 = curMerge.c1;
								var c2 = curMerge.c2;

								curMerge.r1 = c1;
								curMerge.r2 = c2;
								curMerge.c1 = r1;
								curMerge.c2 = r2;
							}

							range = t.model.getRange3(nRow, nCol, nRow, nCol);
							var transposeRange = null;
							if (specialPasteProps.transpose) {
								transposeRange = t.model.getRange3(c + autoR * plRow + arn.r1, r + autoC * plCol + arn.c1, c + autoR * plRow + arn.r1, r + autoC * plCol + arn.c1);
							}

							putInsertedCellIntoRange(nRow, nCol, pasteRow, pasteCol, autoR * plRow, autoC * plCol,
								range, newVal, curMerge, transposeRange);

							//если замержили range
							c = range.bbox.c2 - autoC * plCol - arn.c1;
							if (c === cMax) {
								r = range.bbox.r2 - autoC * plCol - arn.r1;
							}
						}
					}
				}
			}
		}

        t.isChanged = true;
        var arnFor = [trueActiveRange, arrFormula];

		//TODO переделать на setSelection. закомментировал в связи с падением, когда вставляем ниже видимой зоны таблицы
		//this.setSelection(trueActiveRange);
		lastSelection.c2 = trueActiveRange.c2;
        lastSelection.r2 = trueActiveRange.r2;

        return arnFor;
    };

	WorksheetView.prototype._setPastedDataByCurrentRange = function (range, rangeStyle, formulaProps, specialPasteProps) {
		var t = this;

		var firstRange, arrFormula, tablesMap, newVal, isOneMerge, val, activeCellsPasteFragment, transposeRange;
		if (formulaProps) {
			//TODO firstRange возможно стоит убрать(добавлено было для правки бага 27745)
			firstRange = formulaProps.firstRange;
			arrFormula = formulaProps.arrFormula;
			tablesMap = formulaProps.tablesMap;
			newVal = formulaProps.newVal;
			isOneMerge = formulaProps.isOneMerge;
			val = formulaProps.val;
			activeCellsPasteFragment = formulaProps.activeCellsPasteFragment;
			transposeRange = formulaProps.transposeRange;
		}

		/*var value2ToValue = function (value2) {
			var res = "";

			if (value2 && value2.length) {
				for (var i = 0; i < value2.length; i++) {
					res += value2[i].text;
				}
			}

			return res;
		};*/

		//set formula - for paste from binary
		var calculateValueAndBinaryFormula = function (newVal, firstRange, range) {
			var cellValueData = specialPasteProps.cellStyle ? newVal.getValueData() : null;
			if (cellValueData && cellValueData.value) {
				if (!specialPasteProps.formula) {
					cellValueData.formula = null;
				}
				rangeStyle.cellValueData = cellValueData;
			} else if (cellValueData && cellValueData.formula && !specialPasteProps.formula) {
				cellValueData.formula = null;
				rangeStyle.cellValueData = cellValueData;
			} else {
				rangeStyle.val = newVal.getValue();
			}

			var sFormula = newVal.getFormula();
			var sId = newVal.getName();

			if (sFormula) {
				//formula
				if (sFormula && !isOneMerge) {

					var offset, arrayOffset;
					var arrayFormulaRef = formulaProps.cell && formulaProps.cell.formulaParsed ? formulaProps.cell.formulaParsed.getArrayFormulaRef() : null;
					var cellAddress = new AscCommon.CellAddress(sId);
					if (specialPasteProps.transpose && transposeRange) {
						//для transpose необходимо брать offset перевернутого range
						if (arrayFormulaRef) {
							offset = new AscCommon.CellBase(transposeRange.bbox.r1 - cellAddress.row + 1, transposeRange.bbox.c1 - cellAddress.col + 1);
							arrayOffset = new AscCommon.CellBase(transposeRange.bbox.r1 - cellAddress.row + 1, transposeRange.bbox.c1 - cellAddress.col + 1);
						} else {
							offset = new AscCommon.CellBase(transposeRange.bbox.r1 - cellAddress.row + 1, transposeRange.bbox.c1 - cellAddress.col + 1);
						}
					} else {
						if (arrayFormulaRef) {
							offset = new AscCommon.CellBase(range.bbox.r1 - arrayFormulaRef.r1, range.bbox.c1 - arrayFormulaRef.c1);
							arrayOffset = new AscCommon.CellBase(range.bbox.r1 - cellAddress.row + 1, range.bbox.c1 - cellAddress.col + 1);
						} else {
							offset = new AscCommon.CellBase(range.bbox.r1 - cellAddress.row + 1, range.bbox.c1 - cellAddress.col + 1);
						}
					}
					var assemb, _p_ = new AscCommonExcel.parserFormula(sFormula, null, t.model);
					if (_p_.parse()) {

						//array-formula
						if (arrayFormulaRef) {
							arrayFormulaRef = arrayFormulaRef.clone();

							if (!formulaProps.fromRange.containsRange(arrayFormulaRef)) {
								arrayFormulaRef = arrayFormulaRef.intersection(formulaProps.fromRange);
							}

							if (arrayFormulaRef) {
								if (specialPasteProps.transpose) {
									var diffCol1 = arrayFormulaRef.c1 - activeCellsPasteFragment.c1;
									var diffRow1 = arrayFormulaRef.r1 - activeCellsPasteFragment.r1;
									var diffCol2 = arrayFormulaRef.c2 - activeCellsPasteFragment.c1;
									var diffRow2 = arrayFormulaRef.r2 - activeCellsPasteFragment.r1;

									arrayFormulaRef.c1 = activeCellsPasteFragment.c1 + diffRow1;
									arrayFormulaRef.r1 = activeCellsPasteFragment.r1 + diffCol1;
									arrayFormulaRef.c2 = activeCellsPasteFragment.c1 + diffRow2;
									arrayFormulaRef.r2 = activeCellsPasteFragment.r1 + diffCol2;
								}

								arrayFormulaRef.setOffset(arrayOffset ? arrayOffset : offset);
							}
						}
						if (specialPasteProps.transpose) {
							//для transpose необходимо перевернуть все дипазоны в формулах
							_p_.transpose(activeCellsPasteFragment);
						}

						if (null !== tablesMap) {
							var renameParams = {};
							renameParams.offset = offset;
							renameParams.tableNameMap = tablesMap;
							_p_.renameSheetCopy(renameParams);
							assemb = _p_.assemble(true)
						} else {
							assemb = _p_.changeOffset(offset, null, true).assemble(true);
						}

						rangeStyle.formula = {range: range, val: "=" + assemb, arrayRef: arrayFormulaRef};
					}
				}
			}
		};

		var calculateFormulaFromHtml = function(sFormula) {
			if (sFormula) {
				//formula
				if (sFormula && !isOneMerge) {
					sFormula = sFormula.substr(1);
					var offset = new AscCommon.CellBase(0, 0);
					var assemb, _p_ = new AscCommonExcel.parserFormula(sFormula, null, t.model);
					assemb = _p_.changeOffset(offset, null, true).assemble(true);
					rangeStyle.formula = {range: range, val: "=" + assemb};

				}
			}
		};

		var searchRangeIntoFormulaArrays = function (arr, curRange) {
			var res = false;
			if (arr && curRange && curRange.bbox) {
				for (var i = 0; i < arr.length; i++) {
					var refArray = arr[i].arrayRef;
					if (refArray && refArray.intersection(curRange.bbox)) {
						res = true;
						break;
					}
				}
			}
			return res;
		};

		//column width
		var col = range.bbox.c1;
		if (specialPasteProps.width && rangeStyle.colsWidth[col]) {
			var widthProp = rangeStyle.colsWidth[col];

			t.model.setColWidth(widthProp.width, col, col);
			t.model.setColHidden(widthProp.hd, col, col);
			t.model.setColBestFit(widthProp.BestFit, widthProp.width, col, col);

			rangeStyle.colsWidth[col] = null;
		}

		//offsetLast
		if (rangeStyle.offsetLast && specialPasteProps.merge) {
			range.setOffsetLast(rangeStyle.offsetLast);
			range.merge(rangeStyle.merge);

		}

		//for formula
		if (formulaProps && formulaProps.fromBinary) {
			calculateValueAndBinaryFormula(newVal, firstRange, range);
		} else if(!specialPasteProps.advancedOptions && rangeStyle && rangeStyle.val && rangeStyle.val.charAt(0) === "=") {
			calculateFormulaFromHtml(rangeStyle.val);
		}

		//fontName
		if (rangeStyle.fontName && specialPasteProps.fontName) {
			range.setFontname(rangeStyle.fontName);
		}

		//cellStyle
		if (rangeStyle.cellStyle && specialPasteProps.cellStyle) {
			//сделал для того, чтобы не перетерались старые бордеры бордерами стиля в случае, если специальная вставка без бордеров
			var oldBorders = null;
			if (!specialPasteProps.borders) {
				oldBorders = range.getBorderFull();
				if (oldBorders) {
					oldBorders = oldBorders.clone();
				}
			}
			range.setCellStyle(rangeStyle.cellStyle);
			if (oldBorders) {
				range.setBorder(null);
				range.setBorder(oldBorders);
			}
		}

		//если не вставляем форматированную таблицу, но формат необходимо вставить
		if (specialPasteProps.format && !specialPasteProps.formatTable && rangeStyle.tableDxf) {
			range.getLeftTopCell(function (firstCell) {
				if (firstCell) {
					firstCell.setStyle(rangeStyle.tableDxf);
				}
			});
		}

		//numFormat
		if (rangeStyle.numFormat && specialPasteProps.numFormat) {
			range.setNumFormat(rangeStyle.numFormat);
		}
		//font
		if (rangeStyle.font && specialPasteProps.font) {
			var font = rangeStyle.font;
			//если вставляем форматированную таблицу с параметров values + all formating
			if (specialPasteProps.format && !specialPasteProps.formatTable && rangeStyle.tableDxf &&
				rangeStyle.tableDxf.font) {
				font = rangeStyle.tableDxf.font.merge(rangeStyle.font);
			}
			range.setFont(font);
		}


		//***value***
		//если формула - добавляем в массив и обрабатываем уже в _pasteData
		if (rangeStyle.formula && specialPasteProps.formula) {
			arrFormula.push(rangeStyle.formula);
		} else if (specialPasteProps.formula && searchRangeIntoFormulaArrays(arrFormula, range)) {
			//если ячейка является частью формулы массива-> в этом случае не нужно делать setValueData
		} else if (rangeStyle.cellValueData2 && specialPasteProps.font && specialPasteProps.val) {
			t.model._getCell(rangeStyle.cellValueData2.row, rangeStyle.cellValueData2.col, function (cell) {
				cell.setValueData(rangeStyle.cellValueData2.valueData);
			});
		} else if (rangeStyle.value2 && specialPasteProps.font && specialPasteProps.val) {
			if (formulaProps && firstRange) {
				firstRange.setValue2(rangeStyle.value2);
			} else {
				range.setValue2(rangeStyle.value2);
			}
		} else if (rangeStyle.cellValueData && specialPasteProps.val) {
			if (formulaProps && firstRange) {
				firstRange.setValueData(rangeStyle.cellValueData);
			} else {
				range.setValueData(rangeStyle.cellValueData);
			}
		} else if (null != rangeStyle.val && specialPasteProps.val) {
			//TODO возможно стоит всегда вызывать setValueData и тип выставлять в зависимости от val
			if (rangeStyle.val[0] === "'") {
				range.setValueData(
					new AscCommonExcel.UndoRedoData_CellValueData(null, new AscCommonExcel.CCellValue({
						text: rangeStyle.val,
						type: CellValueType.String
					})));
			} else {
				range.setValue(rangeStyle.val);
			}
		} /*else if (rangeStyle.value2 && specialPasteProps.val) {
			range.setValue(value2ToValue(rangeStyle.value2));
		}*/

		//alignVertical
		if (undefined !== rangeStyle.alignVertical && specialPasteProps.alignVertical) {
			range.setAlignVertical(rangeStyle.alignVertical);
		}
		//alignHorizontal
		if (undefined !== rangeStyle.alignHorizontal && specialPasteProps.alignHorizontal) {
			range.setAlignHorizontal(rangeStyle.alignHorizontal);
		}
		//fontSize
		if (rangeStyle.fontSize && specialPasteProps.fontSize) {
			range.setFontsize(rangeStyle.fontSize);
		}
		//borders
		if (rangeStyle.borders && specialPasteProps.borders) {
			range.setBorderSrc(rangeStyle.borders);
		}
		//bordersFull
		if (rangeStyle.bordersFull && specialPasteProps.borders) {
			range.setBorder(rangeStyle.bordersFull);
		}
		//wrap
		if (rangeStyle.wrap && specialPasteProps.wrap) {
			range.setWrap(rangeStyle.wrap);
		}
		//fill
		if (specialPasteProps.fill && undefined !== rangeStyle.fill) {
			range.setFill(rangeStyle.fill);
		}
		if (specialPasteProps.fill && undefined !== rangeStyle.fillColor) {
			range.setFillColor(rangeStyle.fillColor);
		}
		//angle
		if (undefined !== rangeStyle.angle && specialPasteProps.angle) {
			range.setAngle(rangeStyle.angle);
		}

		if (rangeStyle.tableDxfLocal && specialPasteProps.format) {
			range.getLeftTopCell(function (firstCell) {
				if (firstCell) {
					firstCell.setStyle(rangeStyle.tableDxfLocal);
				}
			});
		}

		//hyperLink
		if (rangeStyle.hyperLink && specialPasteProps.hyperlink) {
			var _link = rangeStyle.hyperLink.hyperLink;
			var newHyperlink = new AscCommonExcel.Hyperlink();
			if (_link.search('#') === 0) {
				newHyperlink.setLocation(_link.replace('#', ''));
			} else {
				newHyperlink.Hyperlink = _link;
			}
			newHyperlink.Ref = range;
			newHyperlink.Tooltip = rangeStyle.hyperLink.toolTip;
			newHyperlink.Location = rangeStyle.hyperLink.location;
			range.setHyperlink(newHyperlink);
		} else if (rangeStyle.hyperlinkObj && specialPasteProps.hyperlink) {
			rangeStyle.hyperlinkObj.Ref = range;
			range.setHyperlink(rangeStyle.hyperlinkObj, true);
		}
	};

	WorksheetView.prototype.showSpecialPasteOptions = function(options/*, range, positionShapeContent*/)
	{
		var specialPasteShowOptions = window['AscCommon'].g_specialPasteHelper.buttonInfo;

		var positionShapeContent = options.position;
		var range = options.range;
		var props = options.options;
		var cellCoord;
		if(!positionShapeContent)
		{
			window['AscCommon'].g_specialPasteHelper.CleanButtonInfo();
			window['AscCommon'].g_specialPasteHelper.buttonInfo.setRange(range);

			var isVisible = null !== this.getCellVisibleRange(range.c2, range.r2);
			cellCoord = this.getSpecialPasteCoords(range, isVisible);
		}
		else
		{
			//var isVisible = null !== this.getCellVisibleRange(range.c2, range.r2);
			cellCoord = [new AscCommon.asc_CRect( positionShapeContent.x, positionShapeContent.y, 0, 0 )];
		}


		specialPasteShowOptions.asc_setOptions(props);
		specialPasteShowOptions.asc_setCellCoord(cellCoord);
		this.handlers.trigger("showSpecialPasteOptions", specialPasteShowOptions);
	};

	WorksheetView.prototype.updateSpecialPasteButton = function()
	{
		var specialPasteShowOptions, cellCoord;
		var isIntoShape = this.objectRender.controller.getTargetDocContent();
		if(window['AscCommon'].g_specialPasteHelper.showSpecialPasteButton && isIntoShape)
		{
			if(window['AscCommon'].g_specialPasteHelper.buttonInfo.shapeId === isIntoShape.Id)
			{
				var curShape = isIntoShape.Parent.parent;

				var mmToPx = asc_getcvt(3/*mm*/, 0/*px*/, this._getPPIX());

				var cursorPos = window['AscCommon'].g_specialPasteHelper.buttonInfo.range;
				var offsetX = this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
				var offsetY = this._getRowTop(this.visibleRange.r1) - this.cellsTop;
				var posX = curShape.transformText.TransformPointX(cursorPos.X, cursorPos.Y) * mmToPx - offsetX + this.cellsLeft;
				var posY = curShape.transformText.TransformPointY(cursorPos.X, cursorPos.Y) * mmToPx - offsetY + this.cellsTop;
				if ( AscCommon.AscBrowser.isRetina ) {
					posX = AscCommon.AscBrowser.convertToRetinaValue(posX);
					posY = AscCommon.AscBrowser.convertToRetinaValue(posY);
				}


				cellCoord = [new AscCommon.asc_CRect( posX, posY, 0, 0 )];
			}
		}
		else if(window['AscCommon'].g_specialPasteHelper.showSpecialPasteButton)
		{
			var range = window['AscCommon'].g_specialPasteHelper.buttonInfo.range;
			var isVisible = null !== this.getCellVisibleRange(range.c2, range.r2);
			cellCoord = this.getSpecialPasteCoords(range, isVisible);
		}

		if (cellCoord) {
			specialPasteShowOptions = window['AscCommon'].g_specialPasteHelper.buttonInfo;
			specialPasteShowOptions.asc_setOptions(null);
			specialPasteShowOptions.asc_setCellCoord(cellCoord);
			this.handlers.trigger("showSpecialPasteOptions", specialPasteShowOptions);
		}
	};

	WorksheetView.prototype.getSpecialPasteCoords = function(range, isVisible)
	{
		var disableCoords = function()
		{
			cellCoord._x = -1;
			cellCoord._y = -1;
		};

		//TODO пересмотреть когда иконка вылезает за пределы области видимости
		var cellCoord = this.getCellCoord(range.c2, range.r2);
		if(window['AscCommon'].g_specialPasteHelper.buttonInfo.shapeId)
		{
			disableCoords();
			cellCoord = [cellCoord];
		}
		else
		{
			var visibleRange = this.getVisibleRange();
			var intersectionVisibleRange = visibleRange.intersection(range);

			if(intersectionVisibleRange)
			{
				cellCoord = [];
				cellCoord[0] = this.getCellCoord(intersectionVisibleRange.c2, intersectionVisibleRange.r2);
				cellCoord[1] = this.getCellCoord(range.c1, range.r1);
			}
			else
			{
				disableCoords();
				cellCoord = [cellCoord];
			}
		}

		return cellCoord;
	};

	WorksheetView.prototype._isLockedHeaderFooter = function (callback) {
		var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, null, this.model.getId(),
			AscCommonExcel.c_oAscHeaderFooterEdit);
		this.collaborativeEditing.lock([lockInfo], callback);
	};

	WorksheetView.prototype._isLockedLayoutOptions = function (callback) {
		var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, null, this.model.getId(),
			AscCommonExcel.c_oAscLockLayoutOptions);
		this.collaborativeEditing.lock([lockInfo], callback);
	};

	WorksheetView.prototype.getLayoutLockInfo = function () {
		var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, null, this.model.getId(),
			AscCommonExcel.c_oAscLockLayoutOptions);
		return lockInfo;
	};

	WorksheetView.prototype._isLockedPrintScaleOptions = function (callback) {
		var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, null, this.model.getId(),
			AscCommonExcel.c_oAscLockPrintScaleOptions);
		this.collaborativeEditing.lock([lockInfo], callback);
	};

	// Залочена ли панель для закрепления
	WorksheetView.prototype._isLockedFrozenPane = function (callback) {
		var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, null, this.model.getId(),
			AscCommonExcel.c_oAscLockNameFrozenPane);
		this.collaborativeEditing.lock([lockInfo], callback);
	};

	WorksheetView.prototype._isLockedDefNames = function (callback, defNameId) {
		var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, null
            /*c_oAscLockTypeElemSubType.DefinedNames*/, -1, defNameId);
		this.collaborativeEditing.lock([lockInfo], callback);
	};

	// Залочен ли весь лист
	WorksheetView.prototype._isLockedAll = function (callback) {
		var ar = this.model.selectionRange.getLast();

		var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Range, /*subType*/
			c_oAscLockTypeElemSubType.ChangeProperties, this.model.getId(),
			new AscCommonExcel.asc_CCollaborativeRange(ar.c1, ar.r1, ar.c2, ar.r2));
		this.collaborativeEditing.lock([lockInfo], callback);
	};
    // Пересчет для входящих ячеек в добавленные строки/столбцы
    WorksheetView.prototype._recalcRangeByInsertRowsAndColumns = function (sheetId, ar) {
        var isIntersection = false, isIntersectionC1 = true, isIntersectionC2 = true, isIntersectionR1 = true, isIntersectionR2 = true;
        do {
            if (isIntersectionC1 && this.collaborativeEditing.isIntersectionInCols(sheetId, ar.c1)) {
                ar.c1 += 1;
            } else {
                isIntersectionC1 = false;
            }

            if (isIntersectionR1 && this.collaborativeEditing.isIntersectionInRows(sheetId, ar.r1)) {
                ar.r1 += 1;
            } else {
                isIntersectionR1 = false;
            }

            if (isIntersectionC2 && this.collaborativeEditing.isIntersectionInCols(sheetId, ar.c2)) {
                ar.c2 -= 1;
            } else {
                isIntersectionC2 = false;
            }

            if (isIntersectionR2 && this.collaborativeEditing.isIntersectionInRows(sheetId, ar.r2)) {
                ar.r2 -= 1;
            } else {
                isIntersectionR2 = false;
            }


            if (ar.c1 > ar.c2 || ar.r1 > ar.r2) {
                isIntersection = true;
                break;
            }
        } while (isIntersectionC1 || isIntersectionC2 || isIntersectionR1 || isIntersectionR2)
          ;

        if (false === isIntersection) {
            ar.c1 = this.collaborativeEditing.getLockMeColumn(sheetId, ar.c1);
            ar.c2 = this.collaborativeEditing.getLockMeColumn(sheetId, ar.c2);
            ar.r1 = this.collaborativeEditing.getLockMeRow(sheetId, ar.r1);
            ar.r2 = this.collaborativeEditing.getLockMeRow(sheetId, ar.r2);
        }

        return isIntersection;
    };
    // Функция проверки lock (возвращаемый результат нельзя использовать в качестве ответа, он нужен только для редактирования ячейки)
    WorksheetView.prototype._isLockedCells = function (range, subType, callback) {
        var sheetId = this.model.getId();
        var isIntersection = false;
        var newCallback = callback;
        var t = this;

        this.collaborativeEditing.onStartCheckLock();
        var isArrayRange = Array.isArray(range);
        var nLength = isArrayRange ? range.length : 1;
        var nIndex = 0;
        var ar = null;
        var arrLocks = [];

        for (; nIndex < nLength; ++nIndex) {
            ar = isArrayRange ? range[nIndex].clone(true) : range.clone(true);

            if (c_oAscLockTypeElemSubType.InsertColumns !== subType &&
              c_oAscLockTypeElemSubType.InsertRows !== subType) {
                // Пересчет для входящих ячеек в добавленные строки/столбцы
                isIntersection = this._recalcRangeByInsertRowsAndColumns(sheetId, ar);
            }

            if (false === isIntersection) {
				arrLocks.push(this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Range, subType, sheetId,
					new AscCommonExcel.asc_CCollaborativeRange(ar.c1, ar.r1, ar.c2, ar.r2)));

				if (c_oAscLockTypeElemSubType.InsertColumns === subType) {
					newCallback = function (isSuccess) {
						if (isSuccess) {
							t.collaborativeEditing.addColsRange(sheetId, range.clone(true));
							t.collaborativeEditing.addCols(sheetId, range.c1, range.c2 - range.c1 + 1);
						}
						callback(isSuccess);
					};
				} else if (c_oAscLockTypeElemSubType.InsertRows === subType) {
					newCallback = function (isSuccess) {
						if (isSuccess) {
							t.collaborativeEditing.addRowsRange(sheetId, range.clone(true));
							t.collaborativeEditing.addRows(sheetId, range.r1, range.r2 - range.r1 + 1);
						}
						callback(isSuccess);
					};
				} else if (c_oAscLockTypeElemSubType.DeleteColumns === subType) {
					newCallback = function (isSuccess) {
						if (isSuccess) {
							t.collaborativeEditing.removeColsRange(sheetId, range.clone(true));
							t.collaborativeEditing.removeCols(sheetId, range.c1, range.c2 - range.c1 + 1);
						}
						callback(isSuccess);
					};
				} else if (c_oAscLockTypeElemSubType.DeleteRows === subType) {
					newCallback = function (isSuccess) {
						if (isSuccess) {
							t.collaborativeEditing.removeRowsRange(sheetId, range.clone(true));
							t.collaborativeEditing.removeRows(sheetId, range.r1, range.r2 - range.r1 + 1);
						}
						callback(isSuccess);
					};
				}
            } else {
                if (c_oAscLockTypeElemSubType.InsertColumns === subType) {
                    t.collaborativeEditing.addColsRange(sheetId, range.clone(true));
                    t.collaborativeEditing.addCols(sheetId, range.c1, range.c2 - range.c1 + 1);
                } else if (c_oAscLockTypeElemSubType.InsertRows === subType) {
                    t.collaborativeEditing.addRowsRange(sheetId, range.clone(true));
                    t.collaborativeEditing.addRows(sheetId, range.r1, range.r2 - range.r1 + 1);
                } else if (c_oAscLockTypeElemSubType.DeleteColumns === subType) {
                    t.collaborativeEditing.removeColsRange(sheetId, range.clone(true));
                    t.collaborativeEditing.removeCols(sheetId, range.c1, range.c2 - range.c1 + 1);
                } else if (c_oAscLockTypeElemSubType.DeleteRows === subType) {
                    t.collaborativeEditing.removeRowsRange(sheetId, range.clone(true));
                    t.collaborativeEditing.removeRows(sheetId, range.r1, range.r2 - range.r1 + 1);
                }
            }
        }

		return this.collaborativeEditing.lock(arrLocks, newCallback);
    };

	WorksheetView.prototype.changeWorksheet = function (prop, val) {
		// Проверка глобального лока
		if (this.collaborativeEditing.getGlobalLock()) {
			return;
		}

		var t = this;
		var arn = this.model.selectionRange.getLast().clone();
		var checkRange = arn.clone();

		var range, count;
		var oRecalcType = AscCommonExcel.recalcType.recalc;
		var reinitRanges = false;
		var updateDrawingObjectsInfo = null;
		var updateDrawingObjectsInfo2 = null;//{bInsert: false, operType: c_oAscInsertOptions.InsertColumns, updateRange: arn}
		var isUpdateCols = false, isUpdateRows = false;
		var isCheckChangeAutoFilter;
		var functionModelAction = null;
		var lockDraw = false;	// Параметр, при котором не будет отрисовки (т.к. мы просто обновляем информацию на неактивном листе)
		var lockRange, arrChangedRanges = [];

		var onChangeWorksheetCallback = function (isSuccess) {
			if (false === isSuccess) {
				return;
			}

			asc_applyFunction(functionModelAction);

			t._initCellsArea(oRecalcType);
			if (oRecalcType) {
				t.cache.reset();
			}
			t._cleanCellsTextMetricsCache();
			t._prepareCellTextMetricsCache();

			arrChangedRanges = arrChangedRanges.concat(t.model.hiddenManager.getRecalcHidden());

			t.cellCommentator.updateAreaComments();

			if (t.objectRender) {
				if (reinitRanges) {
					t._updateDrawingArea();
				}
				if (null !== updateDrawingObjectsInfo) {
					t.objectRender.updateSizeDrawingObjects(updateDrawingObjectsInfo);
				}
				if (null !== updateDrawingObjectsInfo2) {
					t.objectRender.updateDrawingObject(updateDrawingObjectsInfo2.bInsert,
						updateDrawingObjectsInfo2.operType, updateDrawingObjectsInfo2.updateRange);
				}
				t.model.onUpdateRanges(arrChangedRanges);
				t.objectRender.rebuildChartGraphicObjects(arrChangedRanges);
			}
			t.scrollType |= AscCommonExcel.c_oAscScrollType.ScrollVertical | AscCommonExcel.c_oAscScrollType.ScrollHorizontal;
			t.draw(lockDraw);

			if (isUpdateCols) {
				t._updateVisibleColsCount();
			}
			if (isUpdateRows) {
				t._updateVisibleRowsCount();
			}

			t.handlers.trigger("selectionChanged");
			t.handlers.trigger("selectionMathInfoChanged", t.getSelectionMathInfo());
		};

		var checkDeleteCellsFilteringMode = function () {
			if (!window['AscCommonExcel'].filteringMode) {
				if (val === c_oAscDeleteOptions.DeleteCellsAndShiftLeft || val === c_oAscDeleteOptions.DeleteColumns) {
					//запрещаем в этом режиме удалять столбцы
					return false;
				} else if (val === c_oAscDeleteOptions.DeleteCellsAndShiftTop ||
					val === c_oAscDeleteOptions.DeleteRows) {

					var tempRange = arn;
					if (val === c_oAscDeleteOptions.DeleteRows) {
						tempRange = new asc_Range(0, checkRange.r1, gc_nMaxCol0, checkRange.r2);
					}

					//запрещаем удалять последнюю строку фильтра и его заголовок + запрещаем удалять ф/т
					var autoFilter = t.model.AutoFilter;
					if (autoFilter && autoFilter.Ref) {
						var ref = autoFilter.Ref;
						//нельзя удалять целиком а/ф
						if (tempRange.containsRange(ref)) {
							return false;
						} else if (tempRange.containsRange(new asc_Range(ref.c1, ref.r1, ref.c2, ref.r1))) {
							//нельзя удалять первую строку а/ф
							return false;
						} /*else if (ref.r2 === ref.r1 + 1) {
							//нельзя удалять последнюю строку тела а/ф
							if (tempRange.containsRange(new asc_Range(ref.c1, ref.r1 + 1, ref.c2, ref.r1 + 1))) {
								return false;
							}
						}*/
					}
					//нельзя целиком удалять ф/т
					var tableParts = t.model.TableParts;
					for (var i = 0; i < tableParts.length; i++) {
						if (tempRange.containsRange(tableParts[i].Ref)) {
							return false;
						}
					}
				}
			}

			return true;
		};

		switch (prop) {
			case "colWidth":
				functionModelAction = function () {
					t.model.setColWidth(val, checkRange.c1, checkRange.c2);
					isUpdateCols = true;
					oRecalcType = AscCommonExcel.recalcType.full;
					reinitRanges = true;
					updateDrawingObjectsInfo = {target: c_oTargetType.ColumnResize, col: checkRange.c1};
				};
				this._isLockedAll(onChangeWorksheetCallback);
				break;
			case "showCols":
				functionModelAction = function () {
					//AscCommonExcel.checkFilteringMode(function () {
						t.model.setColHidden(false, arn.c1, arn.c2);
						t._updateGroups(true);
						oRecalcType = AscCommonExcel.recalcType.full;
						reinitRanges = true;
						updateDrawingObjectsInfo = {target: c_oTargetType.ColumnResize, col: arn.c1};
					//});
				};
				this._isLockedAll(onChangeWorksheetCallback);
				break;
			case "hideCols":
				functionModelAction = function () {
					//AscCommonExcel.checkFilteringMode(function () {
						t.model.setColHidden(true, arn.c1, arn.c2);
						//TODO _updateRowGroups нужно перенести в onChangeWorksheetCallback с соответсвующим флагом обновления
						t._updateGroups(true);
						oRecalcType = AscCommonExcel.recalcType.full;
						reinitRanges = true;
						updateDrawingObjectsInfo = {target: c_oTargetType.ColumnResize, col: arn.c1};
					//});
				};
				this._isLockedAll(onChangeWorksheetCallback);
				break;
			case "rowHeight":
				functionModelAction = function () {
					// Приводим к px (чтобы было ровно)
					val = val / AscCommonExcel.sizePxinPt;
					val = (val | val) * AscCommonExcel.sizePxinPt;
					t.model.setRowHeight(Math.min(val, Asc.c_oAscMaxRowHeight), checkRange.r1, checkRange.r2, true);
					isUpdateRows = true;
					oRecalcType = AscCommonExcel.recalcType.full;
					reinitRanges = true;
					updateDrawingObjectsInfo = {target: c_oTargetType.RowResize, row: checkRange.r1};
				};
				return this._isLockedAll(onChangeWorksheetCallback);
			case "showRows":
				functionModelAction = function () {
					//TODO пока убираю проверку на FilteringMode. перепроверить, нужна ли она?!
					//AscCommonExcel.checkFilteringMode(function () {
						t.model.setRowHidden(false, arn.r1, arn.r2);
						//TODO _updateRowGroups нужно перенести в onChangeWorksheetCallback с соответсвующим флагом обновления
						t._updateGroups();
						t.model.autoFilters.reDrawFilter(arn);
						oRecalcType = AscCommonExcel.recalcType.full;
						reinitRanges = true;
						updateDrawingObjectsInfo = {target: c_oTargetType.RowResize, row: arn.r1};
					//});
				};
				this._isLockedAll(onChangeWorksheetCallback);
				break;
			case "hideRows":
				functionModelAction = function () {
					//AscCommonExcel.checkFilteringMode(function () {
						t.model.setRowHidden(true, arn.r1, arn.r2);
						//TODO _updateRowGroups нужно перенести в onChangeWorksheetCallback с соответсвующим флагом обновления
						t._updateGroups();
						t.model.autoFilters.reDrawFilter(arn);
						oRecalcType = AscCommonExcel.recalcType.full;
						reinitRanges = true;
						updateDrawingObjectsInfo = {target: c_oTargetType.RowResize, row: arn.r1};
					//});
				};
				this._isLockedAll(onChangeWorksheetCallback);
				break;
			case "insCell":
				if (!window['AscCommonExcel'].filteringMode) {
					if(val === c_oAscInsertOptions.InsertCellsAndShiftRight || val === c_oAscInsertOptions.InsertColumns){
						return;
					}
				}

				t.model.workbook.handlers.trigger("cleanCutData", true, true);
				range = t.model.getRange3(arn.r1, arn.c1, arn.r2, arn.c2);
				switch (val) {
					case c_oAscInsertOptions.InsertCellsAndShiftRight:
						isCheckChangeAutoFilter =
							t.af_checkInsDelCells(arn, c_oAscInsertOptions.InsertCellsAndShiftRight, prop);
						if (isCheckChangeAutoFilter === false) {
							return;
						}

						functionModelAction = function () {
							History.Create_NewPoint();
							History.StartTransaction();
							if (range.addCellsShiftRight()) {
								oRecalcType = AscCommonExcel.recalcType.full;
								reinitRanges = true;
								t.cellCommentator.updateCommentsDependencies(true, val, arn);
								updateDrawingObjectsInfo2 = {bInsert: true, operType: val, updateRange: arn};
							}
							History.EndTransaction();
						};

						arrChangedRanges.push(lockRange = new asc_Range(arn.c1, arn.r1, gc_nMaxCol0, arn.r2));
						if (this.model.inPivotTable(lockRange)) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot,
								c_oAscError.Level.NoCritical);
							return;
						}
						count = checkRange.c2 - checkRange.c1 + 1;
						if (!this.model.checkShiftArrayFormulas(arn, new AscCommon.CellBase(0, count))) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
							return;
						}
						this._isLockedCells(lockRange, null, onChangeWorksheetCallback);
						break;
					case c_oAscInsertOptions.InsertCellsAndShiftDown:
						isCheckChangeAutoFilter =
							t.af_checkInsDelCells(arn, c_oAscInsertOptions.InsertCellsAndShiftDown, prop);
						if (isCheckChangeAutoFilter === false) {
							return;
						}

						functionModelAction = function () {
							History.Create_NewPoint();
							History.StartTransaction();
							if (range.addCellsShiftBottom()) {
								oRecalcType = AscCommonExcel.recalcType.full;
								reinitRanges = true;
								t.cellCommentator.updateCommentsDependencies(true, val, arn);
								updateDrawingObjectsInfo2 = {bInsert: true, operType: val, updateRange: arn};
							}
							History.EndTransaction();
						};

						arrChangedRanges.push(lockRange = new asc_Range(arn.c1, arn.r1, arn.c2, gc_nMaxRow0));
						if (this.model.inPivotTable(lockRange)) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot,
								c_oAscError.Level.NoCritical);
							return;
						}
						count = checkRange.c2 - checkRange.c1 + 1;
						if (!this.model.checkShiftArrayFormulas(arn, new AscCommon.CellBase(count, 0))) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
							return;
						}
						this._isLockedCells(lockRange, null, onChangeWorksheetCallback);
						break;
					case c_oAscInsertOptions.InsertColumns:
						isCheckChangeAutoFilter = t.model.autoFilters.isRangeIntersectionSeveralTableParts(arn);
						if (isCheckChangeAutoFilter === true) {
							this.model.workbook.handlers.trigger("asc_onError",
								c_oAscError.ID.AutoFilterChangeFormatTableError, c_oAscError.Level.NoCritical);
							return;
						}
						lockRange = new asc_Range(arn.c1, 0, arn.c2, gc_nMaxRow0);
						count = arn.c2 - arn.c1 + 1;
						if (this.model.checkShiftPivotTable(lockRange, new AscCommon.CellBase(0, count))) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot,
								c_oAscError.Level.NoCritical);
							return;
						}
						if (!this.model.checkShiftArrayFormulas(lockRange, new AscCommon.CellBase(0, count))) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
							return;
						}

						functionModelAction = function () {
							History.Create_NewPoint();
							History.StartTransaction();
							oRecalcType = AscCommonExcel.recalcType.full;
							reinitRanges = true;
							t.model.insertColsBefore(arn.c1, count);
							t._updateGroups(true);
							updateDrawingObjectsInfo2 = {bInsert: true, operType: val, updateRange: arn};
							t.cellCommentator.updateCommentsDependencies(true, val, arn);
							History.EndTransaction();
						};

						arrChangedRanges.push(lockRange);
						this._isLockedCells(lockRange, c_oAscLockTypeElemSubType.InsertColumns,
							onChangeWorksheetCallback);
						break;
					case c_oAscInsertOptions.InsertRows:
						lockRange = new asc_Range(0, arn.r1, gc_nMaxCol0, arn.r2);
						count = arn.r2 - arn.r1 + 1;
						if (this.model.checkShiftPivotTable(lockRange, new AscCommon.CellBase(count, 0))) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot,
								c_oAscError.Level.NoCritical);
							return;
						}
						if (!this.model.checkShiftArrayFormulas(lockRange, new AscCommon.CellBase(count, 0))) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
							return;
						}

						functionModelAction = function () {
							oRecalcType = AscCommonExcel.recalcType.full;
							reinitRanges = true;
							t.model.insertRowsBefore(arn.r1, count);
							t._updateGroups();
							updateDrawingObjectsInfo2 = {bInsert: true, operType: val, updateRange: arn};
							t.cellCommentator.updateCommentsDependencies(true, val, arn);
						};

						arrChangedRanges.push(lockRange);
						this._isLockedCells(lockRange, c_oAscLockTypeElemSubType.InsertRows, onChangeWorksheetCallback);
						break;
				}
				break;
			case "delCell":
				if (!checkDeleteCellsFilteringMode()) {
					return;
				}

				t.model.workbook.handlers.trigger("cleanCutData", true, true);
				range = t.model.getRange3(checkRange.r1, checkRange.c1, checkRange.r2, checkRange.c2);
				switch (val) {
					case c_oAscDeleteOptions.DeleteCellsAndShiftLeft:
						isCheckChangeAutoFilter =
							t.af_checkInsDelCells(arn, c_oAscDeleteOptions.DeleteCellsAndShiftLeft, prop);
						if (isCheckChangeAutoFilter === false) {
							return;
						}

						functionModelAction = function () {
							History.Create_NewPoint();
							History.StartTransaction();
							if (isCheckChangeAutoFilter === true) {
								t.model.autoFilters.isEmptyAutoFilters(arn,
									c_oAscDeleteOptions.DeleteCellsAndShiftLeft);
							}
							if (range.deleteCellsShiftLeft(function () {
									t._cleanCache(lockRange);
									t.cellCommentator.updateCommentsDependencies(false, val, checkRange);
								})) {
								updateDrawingObjectsInfo2 = {bInsert: false, operType: val, updateRange: arn};
							}
							History.EndTransaction();
							reinitRanges = true;
						};

						arrChangedRanges.push(
							lockRange = new asc_Range(checkRange.c1, checkRange.r1, gc_nMaxCol0, checkRange.r2));
						if (this.model.inPivotTable(lockRange)) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot,
								c_oAscError.Level.NoCritical);
							return;
						}
						count = checkRange.c2 - checkRange.c1 + 1;
						if (!this.model.checkShiftArrayFormulas(arn, new AscCommon.CellBase(0, -count))) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
							return;
						}
						this._isLockedCells(lockRange, null, onChangeWorksheetCallback);
						break;
					case c_oAscDeleteOptions.DeleteCellsAndShiftTop:
						isCheckChangeAutoFilter =
							t.af_checkInsDelCells(arn, c_oAscDeleteOptions.DeleteCellsAndShiftTop, prop);
						if (isCheckChangeAutoFilter === false) {
							return;
						}

						functionModelAction = function () {
							History.Create_NewPoint();
							History.StartTransaction();
							if (isCheckChangeAutoFilter === true) {
								t.model.autoFilters.isEmptyAutoFilters(arn, c_oAscDeleteOptions.DeleteCellsAndShiftTop);
							}
							if (range.deleteCellsShiftUp(function () {
									t._cleanCache(lockRange);
									t.cellCommentator.updateCommentsDependencies(false, val, checkRange);
								})) {
								updateDrawingObjectsInfo2 = {bInsert: false, operType: val, updateRange: arn};
							}
							History.EndTransaction();

							reinitRanges = true;
						};

						arrChangedRanges.push(
							lockRange = new asc_Range(checkRange.c1, checkRange.r1, checkRange.c2, gc_nMaxRow0));
						if (this.model.inPivotTable(lockRange)) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot,
								c_oAscError.Level.NoCritical);
							return;
						}
						count = checkRange.c2 - checkRange.c1 + 1;
						if (!this.model.checkShiftArrayFormulas(arn, new AscCommon.CellBase(-count, 0))) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
							return;
						}

						this._isLockedCells(lockRange, null, onChangeWorksheetCallback);
						break;
					case c_oAscDeleteOptions.DeleteColumns:
						isCheckChangeAutoFilter = t.model.autoFilters.isActiveCellsCrossHalfFTable(checkRange,
							c_oAscDeleteOptions.DeleteColumns, prop);
						if (isCheckChangeAutoFilter === false) {
							return;
						}
						lockRange = new asc_Range(checkRange.c1, 0, checkRange.c2, gc_nMaxRow0);
						count = checkRange.c2 - checkRange.c1 + 1;
						if (this.model.checkShiftPivotTable(lockRange, new AscCommon.CellBase(0, -count))) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot,
								c_oAscError.Level.NoCritical);
							return;
						}
						if (!this.model.checkShiftArrayFormulas(lockRange, new AscCommon.CellBase(0, -count))) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
							return;
						}

						functionModelAction = function () {
							oRecalcType = AscCommonExcel.recalcType.full;
							reinitRanges = true;
							History.Create_NewPoint();
							History.StartTransaction();
							t.cellCommentator.updateCommentsDependencies(false, val, checkRange);
							t.model.autoFilters.isEmptyAutoFilters(arn, c_oAscDeleteOptions.DeleteColumns);
							t.model.removeCols(checkRange.c1, checkRange.c2);
							t._updateGroups(true);
							updateDrawingObjectsInfo2 = {bInsert: false, operType: val, updateRange: arn};
							History.EndTransaction();
						};

						arrChangedRanges.push(lockRange);
						this._isLockedCells(lockRange, c_oAscLockTypeElemSubType.DeleteColumns,
							onChangeWorksheetCallback);
						break;
					case c_oAscDeleteOptions.DeleteRows:
						isCheckChangeAutoFilter =
							t.model.autoFilters.isActiveCellsCrossHalfFTable(checkRange, c_oAscDeleteOptions.DeleteRows,
								prop);
						if (isCheckChangeAutoFilter === false) {
							return;
						}
						lockRange = new asc_Range(0, checkRange.r1, gc_nMaxCol0, checkRange.r2);
						count = checkRange.r2 - checkRange.r1 + 1;
						if (this.model.checkShiftPivotTable(lockRange, new AscCommon.CellBase(-count, 0))) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot,
								c_oAscError.Level.NoCritical);
							return;
						}
						if (!this.model.checkShiftArrayFormulas(lockRange, new AscCommon.CellBase(-count, 0))) {
							this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
							return;
						}

						functionModelAction = function () {
							oRecalcType = AscCommonExcel.recalcType.full;
							reinitRanges = true;
							History.Create_NewPoint();
							History.StartTransaction();
							checkRange = t.model.autoFilters.checkDeleteAllRowsFormatTable(checkRange, true);
							t.cellCommentator.updateCommentsDependencies(false, val, checkRange);
							t.model.autoFilters.isEmptyAutoFilters(arn, c_oAscDeleteOptions.DeleteRows);

							var bExcludeHiddenRows = t.model.autoFilters.bIsExcludeHiddenRows(checkRange, t.model.selectionRange.activeCell);
							t.model.removeRows(checkRange.r1, checkRange.r2, bExcludeHiddenRows);

							t._updateGroups();
							updateDrawingObjectsInfo2 = {bInsert: false, operType: val, updateRange: arn};
							History.EndTransaction();
						};

						arrChangedRanges.push(lockRange);
						this._isLockedCells(lockRange, c_oAscLockTypeElemSubType.DeleteRows, onChangeWorksheetCallback);
						break;
				}
				this.handlers.trigger("selectionNameChanged", t.getSelectionName(/*bRangeText*/false));
				break;
			case "groupRows":
				if(!val && !this.checkSetGroup(arn)) {
					return;
				}

				functionModelAction = function () {
					History.Create_NewPoint();
					History.StartTransaction();
					t.model.setGroupRow(val, arn.r1, arn.r2);
					//TODO _updateRowGroups нужно перенести в onChangeWorksheetCallback с соответсвующим флагом обновления
					t._updateGroups();
					History.EndTransaction();
					/*oRecalcType = AscCommonExcel.recalcType.full;
					reinitRanges = true;
					updateDrawingObjectsInfo = {target: c_oTargetType.RowResize, row: arn.r1};*/
				};
				this._isLockedAll(onChangeWorksheetCallback);
				break;
			case "groupCols":
				if(!val && !this.checkSetGroup(arn, true)) {
					return;
				}

				functionModelAction = function () {
					History.Create_NewPoint();
					History.StartTransaction();
					t.model.setGroupCol(val, arn.c1, arn.c2);
					//TODO _updateRowGroups нужно перенести в onChangeWorksheetCallback с соответсвующим флагом обновления
					t._updateGroups(true);
					History.EndTransaction();
					/*oRecalcType = AscCommonExcel.recalcType.full;
					 reinitRanges = true;
					 updateDrawingObjectsInfo = {target: c_oTargetType.RowResize, row: arn.r1};*/
				};
				this._isLockedAll(onChangeWorksheetCallback);
				break;
			case "clearOutline":
				var groupArrCol= this.arrColGroups ? this.arrColGroups.groupArr : null;
				var groupArrRow = this.arrRowGroups ? this.arrRowGroups.groupArr : null;

				if(!groupArrCol && !groupArrRow) {
					return;
				}

				functionModelAction = t.clearOutline();
				this._isLockedAll(onChangeWorksheetCallback);
				break;
			case "sheetViewSettings":
				functionModelAction = function () {
					if (AscCH.historyitem_Worksheet_SetDisplayGridlines === val.type) {
						t.model.setDisplayGridlines(val.value);
					} else {
						t.model.setDisplayHeadings(val.value);
					}

					isUpdateCols = true;
					isUpdateRows = true;
					oRecalcType = AscCommonExcel.recalcType.full;
					reinitRanges = true;
				};

				this._isLockedAll(onChangeWorksheetCallback);
				break;
			case "update":
				if (val !== undefined) {
					lockDraw = true === val.lockDraw;
					reinitRanges = !!val.reinitRanges;
				}
				onChangeWorksheetCallback(true);
				break;
		}
	};

    WorksheetView.prototype.onChangeWidthCallback = function (col, r1, r2, onlyIfMore) {
        var width = null;
        var row, ct, c, fl, str, maxW, tm, mc, isMerged, oldWidth, oldColWidth;
        var lastHeight = null;
        var filterButton = null;
        if (null == r1) {
            r1 = 0;
        }
        if (null == r2) {
            r2 = this.model.getRowsCount() - 1;
        }

        oldColWidth = this.getColumnWidthInSymbols(col);

        this.canChangeColWidth = c_oAscCanChangeColWidth.all;
        for (row = r1; row <= r2; ++row) {
            // пересчет метрик текста
            this._addCellTextToCache(col, row);
            ct = this._getCellTextCache(col, row);
            if (ct === undefined) {
                continue;
            }
            fl = ct.flags;
            isMerged = fl.isMerged();
            if (isMerged) {
                mc = fl.merged;
                // Для замерженных ячеек (с 2-мя или более колонками) оптимизировать не нужно
                if (mc.c1 !== mc.c2) {
                    continue;
                }
            }

            if (ct.metrics.height > this.maxRowHeightPx) {
                if (isMerged) {
                    continue;
                }
                // Запоминаем старую ширину (в случае, если у нас по высоте не уберется)
                oldWidth = ct.metrics.width;
                lastHeight = null;
                // вычисление новой ширины столбца, чтобы высота текста была меньше maxRowHeightPx
                c = this._getCell(col, row);
                str = c.getValue2();
                maxW = ct.metrics.width + this.maxDigitWidth;
                while (1) {
                    tm = this._roundTextMetrics(this.stringRender.measureString(str, fl, maxW));
                    if (tm.height <= this.maxRowHeightPx) {
                        break;
                    }
                    if (lastHeight === tm.height) {
                        // Ситуация, когда у нас текст не уберется по высоте (http://bugzilla.onlyoffice.com/show_bug.cgi?id=19974)
                        tm.width = oldWidth;
                        break;
                    }
                    lastHeight = tm.height;
                    maxW += this.maxDigitWidth;
                }
                width = Math.max(width, tm.width);
            } else {
                filterButton = this.af_getSizeButton(col, row);
                if (null !== filterButton && CellValueType.String === ct.cellType) {
                    width = Math.max(width, ct.metrics.width + filterButton.width);
                } else {
                    width = Math.max(width, ct.metrics.width);
                }
            }
        }
        this.canChangeColWidth = c_oAscCanChangeColWidth.none;

        var pad, cc, cw;
        if (width > 0) {
            pad = this.settings.cells.padding * 2 + 1;
            cc = Math.min(this.model.colWidthToCharCount(width + pad), Asc.c_oAscMaxColumnWidth);
        } else {
            cc = this.defaultColWidthChars;
        }

        if (cc === oldColWidth || (onlyIfMore && cc < oldColWidth)) {
            return -1;
        }

        History.Create_NewPoint();
        if (!onlyIfMore) {
            var oSelection = History.GetSelection();
            if (null != oSelection) {
                oSelection = oSelection.clone();
                oSelection.assign(col, 0, col, gc_nMaxRow0);
                History.SetSelection(oSelection);
                History.SetSelectionRedo(oSelection);
            }
        }
        History.StartTransaction();
        // Выставляем, что это bestFit
		cw = this.model.charCountToModelColWidth(cc);
        this.model.setColBestFit(true, cw, col, col);
        History.EndTransaction();
        return oldColWidth !== cc ? cw : -1;
    };

    WorksheetView.prototype._autoFitColumnWidth = function (col) {
    	var res = false;
		var w = this.onChangeWidthCallback(col, null, null);
		if (-1 !== w) {
			this._calcColWidth(0, col);
			res = true;

			this._cleanCache(new asc_Range(col, 0, col, this.rows.length - 1));
		}
		return res;
	};
    WorksheetView.prototype.autoFitColumnsWidth = function (col) {
        var t = this;
        var max = this.model.getColsCount();
		var selectionRanges = t.model.selectionRange.clone().ranges;

        return this._isLockedAll(function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

            var c1, c2, bUpdate = false;

			History.Create_NewPoint();
			History.StartTransaction();

			if (null !== col) {
				if (t._autoFitColumnWidth(col)) {
					bUpdate = true;
				}
			} else {
				for (var i = 0; i < selectionRanges.length; ++i) {
					c1 = selectionRanges[i].c1;
					c2 = Math.min(selectionRanges[i].c2, max);
					for (; c1 <= c2; ++c1) {
						if (t._autoFitColumnWidth(c1)) {
							bUpdate = true;
						}
					}
				}
			}

			if (bUpdate) {
				t._updateColumnPositions();
				t._updateVisibleColsCount();
				t._calcHeightRows(AscCommonExcel.recalcType.recalc);
				t._updateVisibleRowsCount();
				t._updateDrawingArea();
				t.changeWorksheet("update");
			}
			History.EndTransaction();
        });
    };

    WorksheetView.prototype.autoFitRowHeight = function (r1, r2) {
        var t = this;
        var onChangeHeightCallback = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

            var r;
            for (r = r1; r <= r2; ++r) {
				if (t.model.getRowCustomHeight(r)) {
					break;
				}
			}
            if (r2 < r) {
            	return;
			}

            History.Create_NewPoint();
            var oSelection = History.GetSelection();
            if (null != oSelection) {
                oSelection = oSelection.clone();
                oSelection.assign(0, r1, gc_nMaxCol0, r2);
                History.SetSelection(oSelection);
                History.SetSelectionRedo(oSelection);
            }
            History.StartTransaction();

			t.model.setRowBestFit(true, AscCommonExcel.oDefaultMetrics.RowHeight, r1, r2);
			t._updateRange(new Asc.Range(0, r1, gc_nMaxCol0, r2));
			t.draw();
            History.EndTransaction();
        };
		if (null === r1) {
			var lastSelection = this.model.selectionRange.getLast();
			r1 = lastSelection.r1;
			r2 = lastSelection.r2;
		}
        return this._isLockedAll(onChangeHeightCallback);
    };


	// ----- Search -----
	WorksheetView.prototype._isCellEqual = function (c, r, options) {
		var cell, cellText;
		// Не пользуемся RegExp, чтобы не возиться со спец.символами
		var mc = this.model.getMergedByCell(r, c);
		cell = mc ? this._getVisibleCell(mc.c1, mc.r1) : this._getVisibleCell(c, r);
		cellText = (options.lookIn === Asc.c_oAscFindLookIn.Formulas) ? cell.getValueForEdit() : cell.getValue();
		if (true !== options.isMatchCase) {
			cellText = cellText.toLowerCase();
		}
		if ((cellText.indexOf(options.findWhat) >= 0) &&
			(true !== options.isWholeCell || options.findWhat.length === cellText.length)) {
			return (mc ? new asc_Range(mc.c1, mc.r1, mc.c1, mc.r1) : new asc_Range(c, r, c, r));
		}
		return null;
	};
	WorksheetView.prototype.findCellText = function (options) {
		var self = this;
		if (true !== options.isMatchCase) {
			options.findWhat = options.findWhat.toLowerCase();
		}
		var selectionRange = options.selectionRange || this.model.selectionRange;
		var lastRange = selectionRange.getLast();
		var ar = selectionRange.activeCell;
		var c = ar.col;
		var r = ar.row;
		var merge = this.model.getMergedByCell(r, c);
		options.findInSelection = options.scanOnOnlySheet &&
			!(selectionRange.isSingleRange() && (lastRange.isOneCell() || lastRange.isEqual(merge)));

		var minC, minR, maxC, maxR;
		if (options.findInSelection) {
			minC = lastRange.c1;
			minR = lastRange.r1;
			maxC = lastRange.c2;
			maxR = lastRange.r2;
		} else {
			minC = 0;
			minR = 0;
			maxC = this.cols.length - 1;
			maxR = this.rows.length - 1;
		}

		var inc = options.scanForward ? +1 : -1;
		var isEqual;

		function findNextCell() {
			var ct = undefined;
			do {
				if (options.scanByRows) {
					c += inc;
					if (c < minC || c > maxC) {
						c = options.scanForward ? minC : maxC;
						r += inc;
					}
				} else {
					r += inc;
					if (r < minR || r > maxR) {
						r = options.scanForward ? minR : maxR;
						c += inc;
					}
				}
				if (c < minC || c > maxC || r < minR || r > maxR) {
					return undefined;
				}
				self.model._getCellNoEmpty(r, c, function(cell){
					if (cell && !cell.isNullTextString()) {
						ct = true;
					}
				});
			} while (!ct);
			return ct;
		}

		while (findNextCell()) {
			isEqual = this._isCellEqual(c, r, options);
			if (null !== isEqual) {
				return isEqual;
			}
		}

		// Продолжаем циклический поиск
		if (options.scanForward) {
			// Идем вперед с первой ячейки
			if (options.scanByRows) {
				c = minC - 1;
				r = minR;
				maxR = ar.row;
			} else {
				c = minC;
				r = minR - 1;
				maxC = ar.col;
			}
		} else {
			// Идем назад с последней
			c = maxC;
			r = maxR;
			if (options.scanByRows) {
				c = maxC + 1;
				r = maxR;

				minR = ar.row;
			} else {
				c = maxC;
				r = maxR + 1;
				minC = ar.col;
			}
		}
		while (findNextCell()) {
			isEqual = this._isCellEqual(c, r, options);
			if (null !== isEqual) {
				return isEqual;
			}
		}
		return null;
	};

	WorksheetView.prototype.replaceCellText = function (options, lockDraw, callback) {
		// Очищаем результаты
		options.countFind = 0;
		options.countReplace = 0;

		var cell, tmp;
		var aReplaceCells = [];
		if (options.isReplaceAll) {
			this.model._findAllCells(options);
			var findResult = this.model.lastFindOptions.findResults.values;
			for (var row in findResult) {
				for (var col in findResult[row]) {
					if (!this.model.lastFindOptions.scanByRows) {
						tmp = col;
						col = row;
						row = tmp;
					}
					col |= 0;
					row |= 0;
					aReplaceCells.push(new Asc.Range(col, row, col, row));
				}
			}
		} else {
			cell = this.model.selectionRange.activeCell;
			// Попробуем сначала найти
			var isEqual = this._isCellEqual(cell.col, cell.row, options);
			if (isEqual) {
				aReplaceCells.push(isEqual);
			}
		}

		if (0 === aReplaceCells.length) {
			return callback(options);
		}
		this.model.clearFindResults();
		return this._replaceCellsText(aReplaceCells, options, lockDraw, callback);
	};

        WorksheetView.prototype._replaceCellsText = function (aReplaceCells, options, lockDraw, callback) {
            var t = this;
            if (this.model.inPivotTable(aReplaceCells)) {
				this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedCellPivot,
					c_oAscError.Level.NoCritical);
                options.error = true;
				this.draw(lockDraw);
                return callback(options);
            }

            options.indexInArray = 0;
            options.countFind = aReplaceCells.length;
            options.countReplace = 0;
            if (options.isReplaceAll && false === this.collaborativeEditing.getCollaborativeEditing()) {
                this._isLockedCells(aReplaceCells, /*subType*/null, function () {
                    t._replaceCellText(aReplaceCells, options, lockDraw, callback, true);
                });
            } else {
                this._replaceCellText(aReplaceCells, options, lockDraw, callback, false);
            }
        };

        WorksheetView.prototype._replaceCellText = function (aReplaceCells, options, lockDraw, callback, oneUser) {
                var t = this;
                if (options.indexInArray >= aReplaceCells.length) {
                    this.draw(lockDraw);
                    return callback(options);
                }

                var onReplaceCallback = function (isSuccess) {
                    var cell = aReplaceCells[options.indexInArray];
                    ++options.indexInArray;
                    if (false !== isSuccess) {
						var c = t._getVisibleCell(cell.c1, cell.r1);
						var cellValue = c.getValueForEdit();

                    	// Check replace cell for spell. Replace full cell to fix skip first words (otherwise replace)
                    	if (!options.isSpellCheck) {
							cellValue = cellValue.replace(options.findRegExp, function () {
								++options.countReplace;
								return options.replaceWith;
							});
						} else {
							// ToDo replace one command
							if (1 === options.indexInArray && options.replaceWith) {
								cellValue = options.replaceWith;
							} else {
								for (var i = 0; i < options.replaceWords.length; ++i) {
									cellValue = cellValue.replace(options.replaceWords[i][0], function () {
										return options.replaceWords[i][1];
									});
								}
							}
						}

						var v, newValue;
						// get first fragment and change its text
						v = c.getValueForEdit2().slice(0, 1);
						// Создаем новый массив, т.к. getValueForEdit2 возвращает ссылку
						newValue = [];
						newValue[0] = new AscCommonExcel.Fragment({ text: cellValue, format: v[0].format.clone() });

						if (!t._saveCellValueAfterEdit(c, newValue, /*flags*/undefined, /*isNotHistory*/true,
							/*lockDraw*/true)) {
							options.error = true;
							t.draw(lockDraw);
							return callback(options);
						}
                    }

                    window.setTimeout(function () {
                        t._replaceCellText(aReplaceCells, options, lockDraw, callback, oneUser);
                    }, 1);
                };

			return oneUser ? onReplaceCallback(true) :
				this._isLockedCells(aReplaceCells[options.indexInArray], /*subType*/null, onReplaceCallback);
		};   

	WorksheetView.prototype.findCell = function (reference) {
		var mc;
		var translatePrintArea = AscCommonExcel.tryTranslateToPrintArea(reference);
		var ranges;
		if(translatePrintArea) {
			ranges = AscCommonExcel.getRangeByRef(translatePrintArea, this.model, true, true);
		}
		if(!ranges || 0 === ranges.length) {
			ranges = AscCommonExcel.getRangeByRef(reference, this.model, true, true);
		}
		var oldR1C1mode = AscCommonExcel.g_R1C1Mode, t = this;

		if (0 === ranges.length && this.handlers.trigger('canEdit')) {

			//проверяем на совпадение с именем диапазона в другом формате
			var changeModeRanges;
			AscCommonExcel.executeInR1C1Mode(!AscCommonExcel.g_R1C1Mode, function () {
				changeModeRanges = AscCommonExcel.getRangeByRef(reference, t.model, true, true);
			});
			if(changeModeRanges && changeModeRanges.length){
				this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.InvalidReferenceOrName,
					c_oAscError.Level.NoCritical);
				return ranges;
			}

			/*TODO: сделать поиск по названиям автофигур, должен искать до того как вызвать поиск по именованным диапазонам*/
			if (this.collaborativeEditing.getGlobalLock() || !this.handlers.trigger("getLockDefNameManagerStatus")) {
				this.handlers.trigger("onErrorEvent", c_oAscError.ID.LockCreateDefName, c_oAscError.Level.NoCritical);
				this._updateSelectionNameAndInfo();
			} else {
				// ToDo multiselect defined names
				var selectionLast = this.model.selectionRange.getLast();
				mc = selectionLast.isOneCell() ? this.model.getMergedByCell(selectionLast.r1, selectionLast.c1) : null;
				AscCommonExcel.g_R1C1Mode = false;
				var defName = this.model.workbook.editDefinesNames(null, new Asc.asc_CDefName(reference,
					parserHelp.get3DRef(this.model.getName(), (mc || selectionLast).getAbsName())));
				AscCommonExcel.g_R1C1Mode = oldR1C1mode;

				if (defName) {
					this._isLockedDefNames(null, defName.getNodeId());
				} else {
					this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.InvalidReferenceOrName,
						c_oAscError.Level.NoCritical);
				}
			}
		}
		return ranges;
	};

    /* Ищет дополнение для ячейки */
    WorksheetView.prototype.getCellAutoCompleteValues = function (cell, maxCount) {
		var merged = this._getVisibleCell(cell.col, cell.row).hasMerged();
		if (merged) {
			cell = new AscCommon.CellBase(merged.r1, merged.c1);
        }
        var arrValues = [], objValues = {};
        var range = this.findCellAutoComplete(cell, 1, maxCount);
        this.getColValues(range, cell.col, arrValues, objValues);
        range = this.findCellAutoComplete(cell, -1, maxCount);
        this.getColValues(range, cell.col, arrValues, objValues);

        arrValues.sort();
        return arrValues;
    };

    /* Ищет дополнение для ячейки (снизу или сверху) */
    WorksheetView.prototype.findCellAutoComplete = function (cellActive, step, maxCount) {
        var col = cellActive.col, row = cellActive.row;
        row += step;
        if (!maxCount) {
            maxCount = Number.MAX_VALUE;
        }
        var count = 0, isBreak = false, end = 0 < step ? this.model.getRowsCount() - 1 :
          0, isEnd = true, colsCount = this.model.getColsCount(), range = new asc_Range(col, row, col, row);
        for (; row * step <= end && count < maxCount; row += step, isEnd = true, ++count) {
            for (col = range.c1; col <= range.c2; ++col) {
				this.model._getCellNoEmpty(row, col, function(cell) {
					if (cell && false === cell.isNullText()) {
						isEnd = false;
						isBreak = true;
					}
				});
				if (isBreak) {
					isBreak = false;
					break;
				}
            }
            // Идем влево по колонкам
            for (col = range.c1 - 1; col >= 0; --col) {
				this.model._getCellNoEmpty(row, col, function(cell) {
					isBreak = (null === cell || cell.isNullText());
				});
				if (isBreak) {
					isBreak = false;
                    break;
                }
                isEnd = false;
            }
            range.c1 = col + 1;
            // Идем вправо по колонкам
            for (col = range.c2 + 1; col < colsCount; ++col) {
				this.model._getCellNoEmpty(row, col, function(cell) {
					isBreak = (null === cell || cell.isNullText());
				});
				if (isBreak) {
					isBreak = false;
                    break;
                }
                isEnd = false;
            }
            range.c2 = col - 1;

            if (isEnd) {
                break;
            }
        }
        if (0 < step) {
            range.r2 = row - 1;
        } else {
            range.r1 = row + 1;
        }
        return range.r1 <= range.r2 ? range : null;
    };

    /* Формирует уникальный массив */
    WorksheetView.prototype.getColValues = function (range, col, arrValues, objValues) {
        if (null === range) {
            return;
        }
        var row, value, valueLowCase;
        for (row = range.r1; row <= range.r2; ++row) {
			this.model._getCellNoEmpty(row, col, function(cell) {
				if (cell && CellValueType.String === cell.getType()) {
					value = cell.getValue();
					valueLowCase = value.toLowerCase();
					if (!objValues.hasOwnProperty(valueLowCase)) {
						arrValues.push(value);
						objValues[valueLowCase] = 1;
					}
				}
			});
        }
    };

    // ----- Cell Editor -----

    WorksheetView.prototype.setCellEditMode = function ( isCellEditMode ) {
        this.isCellEditMode = isCellEditMode;
    };

    WorksheetView.prototype.setFormulaEditMode = function ( isFormulaEditMode ) {
        this.isFormulaEditMode = isFormulaEditMode;
    };

    WorksheetView.prototype.setSelectionDialogMode = function (selectionDialogType, selectRange) {
        if (selectionDialogType === this.selectionDialogType) {
            return;
        }
        var oldSelectionDialogType = this.selectionDialogType;
        this.selectionDialogType = selectionDialogType;
        this.isSelectionDialogMode = c_oAscSelectionDialogType.None !== this.selectionDialogType;
        this.cleanSelection();

        if (false === this.isSelectionDialogMode) {
            if (null !== this.copyActiveRange) {
                this.model.selectionRange = this.copyActiveRange.clone();
            }
            this.copyActiveRange = null;
            if (oldSelectionDialogType === c_oAscSelectionDialogType.Chart) {
                this.objectRender.controller.checkChartForProps(false);
            }
        } else {
            this.copyActiveRange = this.model.selectionRange.clone();
            if (selectRange) {
                if (typeof selectRange === 'string') {
                    selectRange = this.model.getRange2(selectRange);
                    if (selectRange) {
                        selectRange = selectRange.getBBox0();
                    }
                }

                if (null != selectRange) {
                    this.model.selectionRange.assign2(selectRange);
                }
            }
            if (selectionDialogType === c_oAscSelectionDialogType.Chart) {
                this.objectRender.controller.checkChartForProps(true);
            }
        }
        this._drawSelection();
    };

    // Получаем свойство: редактируем мы сейчас или нет
    WorksheetView.prototype.getCellEditMode = function () {
        return this.isCellEditMode;
    };

    WorksheetView.prototype._isFormula = function ( val ) {
        return (0 < val.length && 1 < val[0].text.length && '=' === val[0].text.charAt( 0 ));
    };

    WorksheetView.prototype.getActiveCell = function (x, y, isCoord) {
        var t = this;
        var col, row;
        if (isCoord) {
            col = t._findColUnderCursor(x, true);
            row = t._findRowUnderCursor(y, true);
            if (!col || !row) {
                return false;
            }
            col = col.col;
            row = row.row;
        } else {
            col = t.model.selectionRange.activeCell.col;
            row = t.model.selectionRange.activeCell.row;
        }

        // Проверим замерженность
        var mergedRange = this.model.getMergedByCell(row, col);
        return mergedRange ? mergedRange : new asc_Range(col, row, col, row);
    };

	WorksheetView.prototype._saveCellValueAfterEdit = function (c, val, flags, isNotHistory, lockDraw) {
	    var bbox = c.bbox;
		var t = this;
		var oldMode = this.isFormulaEditMode;
		this.isFormulaEditMode = false;

		var applyByArray = flags && flags.bApplyByArray;
		//t.model.workbook.dependencyFormulas.lockRecal();

		if (!isNotHistory) {
			History.Create_NewPoint();
			History.StartTransaction();
		}

		//***array-formula***
		var changeRangesIfArrayFormula = function() {
			if(applyByArray) {
				c = t.getSelectedRange();
				if(c.bbox.isOneCell()) {
					//проверяем, есть ли формула массива в этой ячейке
					t.model._getCell(c.bbox.r1, c.bbox.c1, function(cell){
						var formulaRef = cell && cell.formulaParsed && cell.formulaParsed.ref ? cell.formulaParsed.ref : null;
						if(formulaRef) {
							c = t.model.getRange3(formulaRef.r1, formulaRef.c1, formulaRef.r2, formulaRef.c2);
						}
					});
				}
				bbox = c.bbox;
			}
		};

		var oAutoExpansionTable;
		var isFormula = this._isFormula(val);
		if (isFormula) {
			var ftext = val.reduce(function (pv, cv) {
				return pv + cv.text;
			}, "");

			// ToDo - при вводе формулы в заголовок автофильтра надо писать "0"
			//***array-formula***
			var ret = true;
			changeRangesIfArrayFormula();
			if(applyByArray) {
				this.model.workbook.dependencyFormulas.lockRecal();
			}

			c.setValue(ftext, function (r) {
				ret = r;
			}, null, applyByArray ? bbox : null);

			//***array-formula***
			if(applyByArray) {
				this.model.workbook.dependencyFormulas.unlockRecal();
			}

			if (!ret) {
				this.isFormulaEditMode = oldMode;
				History.EndTransaction();
				//t.model.workbook.dependencyFormulas.unlockRecal();
				return false;
			}

			//***array-formula***
			if(applyByArray) {
				History.Add(AscCommonExcel.g_oUndoRedoArrayFormula, AscCH.historyitem_ArrayFromula_AddFormula, this.model.getId(),
					new Asc.Range(c.bbox.c1, c.bbox.r1, c.bbox.c2, c.bbox.r2), new AscCommonExcel.UndoRedoData_ArrayFormula(c.bbox, "=" + c.getFormula()));
			}

			isFormula = c.isFormula();
			this.model.autoFilters.renameTableColumn(bbox);
		} else {
			//***array-formula***
			changeRangesIfArrayFormula();
			c.setValue2(val);

			// Вызываем функцию пересчета для заголовков форматированной таблицы
			this.model.autoFilters.renameTableColumn(bbox);
		}

		var api = window["Asc"]["editor"];
		var bFast = api.collaborativeEditing.m_bFast;
		var bIsSingleUser = !api.collaborativeEditing.getCollaborativeEditing();
		if (!(bFast && !bIsSingleUser)) {
			oAutoExpansionTable = this.model.autoFilters.checkTableAutoExpansion(bbox);
		}

		if (!isFormula) {
			for (var i = 0; i < val.length; ++i) {
				if (-1 !== val[i].text.indexOf(kNewLine)) {
					c.setWrap(true);
					break;
				}
			}
		}

		if (!isNotHistory) {
			History.EndTransaction();
		}

		if(isFormula && !applyByArray) {
			c._foreach(function(cell){
				cell._adjustCellFormat();
			});
		}

		if (oAutoExpansionTable && !applyByArray) {
			var callback = function () {
				var options = {
					props: [Asc.c_oAscAutoCorrectOptions.UndoTableAutoExpansion],
					cell: bbox,
					wsId: t.model.getId()
				};
				t.handlers.trigger("toggleAutoCorrectOptions", true, options);
			};
			t.af_changeTableRange(oAutoExpansionTable.name, oAutoExpansionTable.range, callback);
		} else {
			t.handlers.trigger("toggleAutoCorrectOptions");
		}

		//t.model.workbook.dependencyFormulas.unlockRecal();

		this.canChangeColWidth = isNotHistory ? c_oAscCanChangeColWidth.none : c_oAscCanChangeColWidth.numbers;
		this._updateRange(bbox);
		this.canChangeColWidth = c_oAscCanChangeColWidth.none;
		this.draw(lockDraw);

		// если вернуть false, то редактор не закроется
		return true;
	};

	WorksheetView.prototype.openCellEditor =
		function (editor, cursorPos, isFocus, isClearCell, isHideCursor, isQuickInput, selectionRange) {
			var t = this, col, row, c, fl, mc, bg, isMerged;

			if (selectionRange) {
				this.model.selectionRange = selectionRange;
			}
			if (0 < this.arrActiveFormulaRanges.length) {
				this.cleanSelection();
				this.cleanFormulaRanges();
				this._drawSelection();
			}

			var cell = this.model.selectionRange.activeCell;

			function getVisibleRangeObject() {
				var vr = t.visibleRange.clone(), offsetX = 0, offsetY = 0;
				if (t.topLeftFrozenCell) {
					var cFrozen = t.topLeftFrozenCell.getCol0();
					var rFrozen = t.topLeftFrozenCell.getRow0();
					if (0 < cFrozen) {
						if (col >= cFrozen) {
							offsetX = t._getColLeft(cFrozen) - t._getColLeft(0);
						} else {
							vr.c1 = 0;
							vr.c2 = cFrozen - 1;
						}
					}
					if (0 < rFrozen) {
						if (row >= rFrozen) {
							offsetY = t._getRowTop(rFrozen) - t._getRowTop(0);
						} else {
							vr.r1 = 0;
							vr.r2 = rFrozen - 1;
						}
					}
				}
				return {vr: vr, offsetX: offsetX, offsetY: offsetY};
			}

			col = cell.col;
			row = cell.row;

			// Возможно стоит заменить на ячейку из кеша
			c = this._getVisibleCell(col, row);
			fl = this._getCellFlags(c);
			isMerged = fl.isMerged();
			if (isMerged) {
				mc = fl.merged;
				c = this._getVisibleCell(mc.c1, mc.r1);
				fl = this._getCellFlags(c);
			}

			// Выставляем режим 'не редактируем' (иначе мы попытаемся переместить редактор, который еще не открыт)
			this.isCellEditMode = false;
			this.handlers.trigger("onScroll", this._calcActiveCellOffset());
			this.isCellEditMode = true;

			bg = c.getFillColor();
			this.isFormulaEditMode = false;

			var font = c.getFont();
			// Скрываем окно редактирования комментария
			this.model.workbook.handlers.trigger("asc_onHideComment");

			var _fragmentsTmp = c.getValueForEdit2();
			var fragments = [];
			for (var i = 0; i < _fragmentsTmp.length; ++i) {
				fragments.push(_fragmentsTmp[i].clone());
			}

			var arrAutoComplete = this.getCellAutoCompleteValues(cell, kMaxAutoCompleteCellEdit);
			var arrAutoCompleteLC = asc.arrayToLowerCase(arrAutoComplete);

			this.model.workbook.handlers.trigger("cleanCutData", true, true);

			editor.open({
				fragments: fragments,
				flags: fl,
				font: font,
				background: bg || this.settings.cells.defaultState.background,
				cursorPos: cursorPos,
				zoom: this.getZoom(),
				focus: isFocus,
				isClearCell: isClearCell,
				isHideCursor: isHideCursor,
				isQuickInput: isQuickInput,
				isAddPersentFormat: isQuickInput && Asc.c_oAscNumFormatType.Percent === c.getNumFormatType(),
				autoComplete: arrAutoComplete,
				autoCompleteLC: arrAutoCompleteLC,
				bbox: c.bbox,
				cellNumFormat: c.getNumFormatType(),
				saveValueCallback: function (val, flags, callback) {
					var saveCellValueCallback = function(success) {
						if(!success) {
							if(callback) {
								return callback(false);
							} else {
								return false;
							}
						}

						var bRes = t._saveCellValueAfterEdit(c, val, flags, /*isNotHistory*/false, /*lockDraw*/false);
						if(callback) {
							return callback(bRes);
						} else {
							return bRes;
						}
					};

					var dataValidation = t.model.getDataValidation(col, row);
					if (dataValidation && !dataValidation.checkValue(val, t.model)) {
						t.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.DataValidate, c_oAscError.Level.NoCritical, dataValidation);
						return false;
					}

					//***array-formula***
					var ref = null;
					if(flags.bApplyByArray) {
						//необходимо проверить на выделение массива частично
						var activeRange = t.getSelectedRange();
						var doNotApply = false;
						var formulaRef;
						if(!activeRange.bbox.isOneCell()) {
							if(t.model.autoFilters.isIntersectionTable(activeRange.bbox)) {
								t.handlers.trigger("onErrorEvent", c_oAscError.ID.MultiCellsInTablesFormulaArray, c_oAscError.Level.NoCritical);
								return false;
							} else {
								activeRange._foreachNoEmpty(function(cell) {
									ref = cell.formulaParsed && cell.formulaParsed.ref ? cell.formulaParsed.ref : null;

									if(ref && !activeRange.bbox.containsRange(ref)) {
										doNotApply = true;
										return false;
									}
								});
							}
						} else {
							activeRange._foreachNoEmpty(function(cell) {
								formulaRef = cell.formulaParsed && cell.formulaParsed.ref ? cell.formulaParsed.ref : null;
							});
						}
						if(doNotApply) {
							t.handlers.trigger("onErrorEvent", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
							return false;
						} else {
							var lockedRange = formulaRef ? formulaRef : activeRange.bbox;
							t._isLockedCells(lockedRange, /*subType*/null, saveCellValueCallback);
						}
					} else {
						//проверяем activeCell на наличие форулы массива
						var activeCell = t.model.selectionRange.activeCell;

						t.model.getRange3(activeCell.row, activeCell.col, activeCell.row, activeCell.col)._foreachNoEmpty(function(cell) {
							ref = cell.formulaParsed && cell.formulaParsed.ref ? cell.formulaParsed.ref : null;
						});
						if(ref && !ref.isOneCell()) {
							t.handlers.trigger("onErrorEvent", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
							return false;
						} else {
							return saveCellValueCallback(true);
						}
					}
				},
				getSides: function () {
					var _c1, _r1, _c2, _r2, ri = 0, bi = 0;
					if (isMerged) {
						_c1 = mc.c1;
						_c2 = mc.c2;
						_r1 = mc.r1;
						_r2 = mc.r2;
					} else {
						_c1 = _c2 = col;
						_r1 = _r2 = row;
					}
					var vro = getVisibleRangeObject();
					var i, w, h, arrLeftS = [], arrRightS = [], arrBottomS = [];
					var offsX = t._getColLeft(vro.vr.c1) - t._getColLeft(0) - vro.offsetX;
					var offsY = t._getRowTop(vro.vr.r1) - t._getRowTop(0) - vro.offsetY;
					var cellX = t._getColLeft(_c1) - offsX, cellY = t._getRowTop(_r1) - offsY;
					var _left = cellX;
					for (i = _c1; i >= vro.vr.c1; --i) {
						w = t._getColumnWidth(i);
						if (0 < w) {
							arrLeftS.push(_left);
						}
						_left -= w;
					}

					if (_c2 > vro.vr.c2) {
						_c2 = vro.vr.c2;
					}
					_left = cellX;
					for (i = _c1; i <= vro.vr.c2; ++i) {
						w = t._getColumnWidth(i);
						_left += w;
						if (0 < w) {
							arrRightS.push(_left);
						}
						if (_c2 === i) {
							ri = arrRightS.length - 1;
						}
					}
					w = t.drawingCtx.getWidth();
					if (arrRightS[arrRightS.length - 1] > w) {
						arrRightS[arrRightS.length - 1] = w;
					}

					if (_r2 > vro.vr.r2) {
						_r2 = vro.vr.r2;
					}
					var _top = cellY;
					for (i = _r1; i <= vro.vr.r2; ++i) {
						h = t._getRowHeight(i);
						_top += h;
						if (0 < h) {
							arrBottomS.push(_top);
						}
						if (_r2 === i) {
							bi = arrBottomS.length - 1;
						}
					}
					h = t.drawingCtx.getHeight();
					if (arrBottomS[arrBottomS.length - 1] > h) {
						arrBottomS[arrBottomS.length - 1] = h;
					}
					return {l: arrLeftS, r: arrRightS, b: arrBottomS, cellX: cellX, cellY: cellY, ri: ri, bi: bi};
				},
				checkVisible: function () {
					return null !== t.getCellVisibleRange(c.bbox.c1, c.bbox.r1);
				}
			});
			this.model.workbook.handlers.trigger("asc_onEditCell", Asc.c_oAscCellEditorState.editStart);
		};

    WorksheetView.prototype.openCellEditorWithText = function (editor, text, cursorPos, isFocus, selectionRange) {
        selectionRange = (selectionRange) ? selectionRange : this.model.selectionRange;
        var activeCell = selectionRange.activeCell;
        var c = this._getVisibleCell(activeCell.col, activeCell.row);
        var v, copyValue;
        // get first fragment and change its text
        v = c.getValueForEdit2().slice(0, 1);
        // Создаем новый массив, т.к. getValueForEdit2 возвращает ссылку
        copyValue = [];
        copyValue[0] = new AscCommonExcel.Fragment({text: text, format: v[0].format.clone()});

        this.openCellEditor(editor, /*cursorPos*/undefined, isFocus, /*isClearCell*/true,
			/*isHideCursor*/false, /*isQuickInput*/false, selectionRange);
		editor.paste(copyValue, cursorPos);
    };

    WorksheetView.prototype.getFormulaRanges = function () {
        return this.arrActiveFormulaRanges;
    };

    WorksheetView.prototype.updateRanges = function (ranges, skipHeight) {
        if (0 < ranges.length) {
			for (var i = 0; i < ranges.length; ++i) {
				this._updateRange(ranges[i], skipHeight);
			}
        }
    };

    WorksheetView.prototype._updateRange = function (range, skipHeight) {
		this._cleanCache(range);
		if (c_oAscSelectionType.RangeMax === range.getType()) {
			// ToDo refactoring. Clean this only delete/insert/update info rows/column
			this.rows = [];
			this.cols = [];
		}
		if (skipHeight) {
			this.arrRecalcRanges.push(range);
		} else {
			this.arrRecalcRangesWithHeight.push(range);
			this.arrRecalcRangesCanChangeColWidth.push(this.canChangeColWidth);
		}
	};

    WorksheetView.prototype._reinitializeScroll = function () {
		this.handlers.trigger("reinitializeScroll", this.scrollType);
		this.scrollType = 0;
	};

    WorksheetView.prototype._recalculate = function () {
		var ranges = this.arrRecalcRangesWithHeight.concat(this.arrRecalcRanges,
			this.model.hiddenManager.getRecalcHidden());

		if (0 < ranges.length) {
			this.arrRecalcRanges = [];
			// ToDo refactoring this!!!
			this._calcHeightRows(AscCommonExcel.recalcType.newLines);
			this._calcWidthColumns(AscCommonExcel.recalcType.newLines);

			var minRow = this._updateRowsHeight();
			this._updateVisibleRowsCount(/*skipScrolReinit*/true);
			this._updateSelectionNameAndInfo();

			if (null !== minRow) {
				if (this.objectRender) {
					this.objectRender.updateSizeDrawingObjects({target: c_oTargetType.RowResize, row: minRow}, true);
				}
			}

			this.model.onUpdateRanges(ranges);
			this.objectRender.rebuildChartGraphicObjects(ranges);
			this.cellCommentator.updateActiveComment();

			if (this._initRowsCount()) {
				this.scrollType |= AscCommonExcel.c_oAscScrollType.ScrollVertical;
			}
			if (this._initColsCount()) {
				this.scrollType |= AscCommonExcel.c_oAscScrollType.ScrollHorizontal;
			}

			this.handlers.trigger("onDocumentPlaceChanged");
		}
		this._reinitializeScroll();
	};
	WorksheetView.prototype._updateDrawingArea = function () {
		if (this.objectRender && this.objectRender.drawingArea) {
			this.objectRender.drawingArea.reinitRanges();
		}
	};

    WorksheetView.prototype.setChartRange = function (range) {
        this.isChartAreaEditMode = true;
        this.arrActiveChartRanges[0].assign2(range);
    };
    WorksheetView.prototype.endEditChart = function () {
        if (this.isChartAreaEditMode) {
            this.isChartAreaEditMode = false;
            this.arrActiveChartRanges[0].clean();
        }
    };

    WorksheetView.prototype.enterCellRange = function (editor) {
        if (!this.isFormulaEditMode) {
            return;
        }

        var currentFormula = this.arrActiveFormulaRanges[this.arrActiveFormulaRangesPosition];
        var currentRange = currentFormula.getLast().clone();
        var activeCellId = currentFormula.activeCellId;
        var activeCell = currentFormula.activeCell.clone();
        // Замерженную ячейку должны отдать только левую верхнюю.
        var mergedRange = this.model.getMergedByCell(currentRange.r1, currentRange.c1);
        if (mergedRange && currentRange.isEqual(mergedRange)) {
            currentRange.r2 = currentRange.r1;
            currentRange.c2 = currentRange.c1;
        }

        /*            var defName = this.model.workbook.findDefinesNames(this.model.getName()+"!"+currentRange.getAbsName(),this.model.getId());
         console.log("defName #2 " + defName);*/
        var sheetName = "", cFEWSO = editor.handlers.trigger("getCellFormulaEnterWSOpen");
        if (editor.formulaIsOperator() && cFEWSO && cFEWSO.model.getId() != this.model.getId()) {
            sheetName = parserHelp.getEscapeSheetName(this.model.getName()) + "!";
        }
        editor.enterCellRange(/*defName || */sheetName + currentRange.getName());

        for (var tmpRange, i = 0; i < this.arrActiveFormulaRanges.length; ++i) {
            tmpRange = this.arrActiveFormulaRanges[i];
            if (tmpRange.getLast().isEqual(currentRange)) {
                tmpRange.activeCellId = activeCellId;
                tmpRange.activeCell.col = activeCell.col;
                tmpRange.activeCell.row = activeCell.row;
                break;
            }
        }
    };

    WorksheetView.prototype.addFormulaRange = function (range) {
        var r = this.model.selectionRange.clone();
        if (range) {
            r.assign2(range);
            var lastSelection = r.getLast();
            lastSelection.cursorePos = range.cursorePos;
            lastSelection.formulaRangeLength = range.formulaRangeLength;
            lastSelection.colorRangePos = range.colorRangePos;
            lastSelection.colorRangeLength = range.colorRangeLength;
            lastSelection.isName = range.isName;
        }
        this.arrActiveFormulaRanges.push(r);
        this.arrActiveFormulaRangesPosition = this.arrActiveFormulaRanges.length - 1;
        this._fixSelectionOfMergedCells();
    };

    WorksheetView.prototype.activeFormulaRange = function (range) {
        this.arrActiveFormulaRangesPosition = -1;
        for (var i = 0; i < this.arrActiveFormulaRanges.length; ++i) {
            if (this.arrActiveFormulaRanges[i].getLast().isEqual(range)) {
                this.arrActiveFormulaRangesPosition = i;
                return;
            }
        }
    };
    WorksheetView.prototype.removeFormulaRange = function (range) {
        this.arrActiveFormulaRangesPosition = -1;
        for (var i = 0; i < this.arrActiveFormulaRanges.length; ++i) {
            if (this.arrActiveFormulaRanges[i].getLast().isEqual(range)) {
                this.arrActiveFormulaRanges.splice(i, 1);
                return;
            }
        }
    };

    WorksheetView.prototype.cleanFormulaRanges = function () {
        // Очищаем массив ячеек для текущей формулы
        this.arrActiveFormulaRangesPosition = -1;
        this.arrActiveFormulaRanges = [];
    };

	WorksheetView.prototype.addAutoFilter = function (styleName, addFormatTableOptionsObj) {
		// Проверка глобального лока
		if (this.collaborativeEditing.getGlobalLock()) {
			return;
		}

		if (!this.handlers.trigger("getLockDefNameManagerStatus")) {
			this.handlers.trigger("onErrorEvent", c_oAscError.ID.LockCreateDefName, c_oAscError.Level.NoCritical);
			return;
		}

		if (!window['AscCommonExcel'].filteringMode) {
			return;
		}

		this.model.workbook.handlers.trigger("cleanCutData", true, true);

		var t = this;
		var ar = this.model.selectionRange.getLast().clone();

		var isChangeAutoFilterToTablePart = function (addFormatTableOptionsObj) {
			var res = false;
			var worksheet = t.model;

			var activeRange = AscCommonExcel.g_oRangeCache.getAscRange(addFormatTableOptionsObj.asc_getRange());
			if (activeRange && worksheet.AutoFilter && activeRange.containsRange(worksheet.AutoFilter.Ref) &&
				activeRange.r1 === worksheet.AutoFilter.Ref.r1) {
				res = true;
			}

			return res;
		};

		var filterRange, bIsChangeFilterToTable, addNameColumn;
		var onChangeAutoFilterCallback = function (isSuccess) {
			if (false === isSuccess) {
				t.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedAllError,
					c_oAscError.Level.NoCritical);
				t.handlers.trigger("selectionChanged");
				return;
			}

			var addFilterCallBack;
			if (bIsChangeFilterToTable)//CHANGE FILTER TO TABLEPART
			{
				addFilterCallBack = function (isSuccess) {
					if (false === isSuccess) {
						return;
					}

					History.Create_NewPoint();
					History.StartTransaction();

					t.model.autoFilters.changeAutoFilterToTablePart(styleName, ar, addFormatTableOptionsObj);

					t._onUpdateFormatTable(filterRange, !!(styleName), true);
					History.EndTransaction();
				};
				if(ar.containsRange(filterRange)) {
					filterRange = ar.clone();
				}
				if (addNameColumn) {
					filterRange.r2 = filterRange.r2 + 1;
				}
				t._isLockedCells(filterRange, /*subType*/null, addFilterCallBack);
			} else//ADD
			{
				addFilterCallBack = function (isSuccess) {
					if (false === isSuccess) {
						return;
					}

					History.Create_NewPoint();
					History.StartTransaction();


					var type = ar.getType();
					var isSlowOperation = false;
					if (c_oAscSelectionType.RangeMax === type || c_oAscSelectionType.RangeRow === type ||  c_oAscSelectionType.RangeCol === type) {
						isSlowOperation = null != styleName;
					}

					if (isSlowOperation) {
						t.handlers.trigger("slowOperation", true);
					}

					var slowOperationCallback = function() {
						//add to model
						t.model.autoFilters.addAutoFilter(styleName, ar, addFormatTableOptionsObj, null, null, filterInfo);

						//updates
						if (styleName && addNameColumn) {
							t.setSelection(filterRange);
						}

						t._onUpdateFormatTable(filterRange, !!(styleName), true);
						History.EndTransaction();

						if (isSlowOperation) {
							t.handlers.trigger("slowOperation", false);
						}
					};

					if(isSlowOperation) {
						window.setTimeout(function() {
							slowOperationCallback();
						}, 0);
					} else {
						slowOperationCallback();
					}
				};

				if (styleName == null) {
					addFilterCallBack(true);
				} else {
					t._isLockedCells(filterRange, null, addFilterCallBack)
				}
			}
		};

		//calculate filter range
		var filterInfo;
		if (addFormatTableOptionsObj && isChangeAutoFilterToTablePart(addFormatTableOptionsObj) === true) {
			filterRange = t.model.AutoFilter.Ref.clone();

			addNameColumn = false;
			if (addFormatTableOptionsObj === false) {
				addNameColumn = true;
			} else if (typeof addFormatTableOptionsObj == 'object') {
				addNameColumn = !addFormatTableOptionsObj.asc_getIsTitle();
			}

			bIsChangeFilterToTable = true;
		} else {
			if (styleName == null) {
				filterRange = ar && ar.isOneCell() ? ar.clone() : t.model.autoFilters.cutRangeByDefinedCells(ar);
				ar = filterRange;
			} else {
				filterInfo = t.model.autoFilters._getFilterInfoByAddTableProps(ar, addFormatTableOptionsObj, true);
				filterRange = filterInfo.filterRange;
				addNameColumn = filterInfo.addNameColumn;
			}
		}

		var checkFilterRange = filterInfo ? filterInfo.rangeWithoutDiff : filterRange;
		if (t._checkAddAutoFilter(checkFilterRange, styleName, addFormatTableOptionsObj) === true) {
			this._isLockedAll(onChangeAutoFilterCallback);
			this._isLockedDefNames(null, null);
		} else//для того, чтобы в случае ошибки кнопка отжималась!
		{
			t.handlers.trigger("selectionChanged");
		}
	};

	WorksheetView.prototype.changeAutoFilter = function (tableName, optionType, val) {
		// Проверка глобального лока
		if (this.collaborativeEditing.getGlobalLock()) {
			return;
		}

		if (!window['AscCommonExcel'].filteringMode) {
			return;
		}

		this.model.workbook.handlers.trigger("cleanCutData", true, true);

		var t = this;
		var ar = this.model.selectionRange.getLast().clone();

		var onChangeAutoFilterCallback = function (isSuccess) {
			if (false === isSuccess) {
				t.handlers.trigger("selectionChanged");
				return;
			}

			switch (optionType) {
				case Asc.c_oAscChangeFilterOptions.filter: {
					//DELETE
					if (!val) {
						var filterRange = null;
						var tablePartsContainsRange = t.model.autoFilters._isTablePartsContainsRange(ar);
						if (tablePartsContainsRange && tablePartsContainsRange.Ref) {
							filterRange = tablePartsContainsRange.Ref.clone();
						} else if (t.model.AutoFilter) {
							filterRange = t.model.AutoFilter.Ref;
						}

						if (null === filterRange) {
							return;
						}

						var deleteFilterCallBack = function () {
							t.model.autoFilters.deleteAutoFilter(ar, tableName);

							t.af_drawButtons(filterRange);
							t._onUpdateFormatTable(filterRange, false, true);
						};

						t._isLockedCells(filterRange, /*subType*/null, deleteFilterCallBack);

					} else//ADD ONLY FILTER
					{
						var addFilterCallBack = function () {
							History.Create_NewPoint();
							History.StartTransaction();

							t.model.autoFilters.addAutoFilter(null, ar);
							History.EndTransaction();

							t._onUpdateFormatTable(filterRange, false, true);
						};

						var filterInfo = t.model.autoFilters._getFilterInfoByAddTableProps(ar);
						filterRange = filterInfo.filterRange;

						t._isLockedCells(filterRange, null, addFilterCallBack)
					}

					break;
				}
				case Asc.c_oAscChangeFilterOptions.style://CHANGE STYLE
				{
					var changeStyleFilterCallBack = function () {
						History.Create_NewPoint();
						History.StartTransaction();

						//TODO внутри вызывается _isTablePartsContainsRange
						t.model.autoFilters.changeTableStyleInfo(val, ar, tableName);
						History.EndTransaction();

						t._onUpdateFormatTable(filterRange, false, true);
					};

					var filterRange;
					//calculate lock range and callback parameters
					var isTablePartsContainsRange = t.model.autoFilters._isTablePartsContainsRange(ar);
					if (isTablePartsContainsRange !== null)//if one of the tableParts contains activeRange
					{
						filterRange = isTablePartsContainsRange.Ref.clone();
					}

					t._isLockedCells(filterRange, /*subType*/null, changeStyleFilterCallBack);

					break;
				}
			}
		};

		if (Asc.c_oAscChangeFilterOptions.style === optionType) {
			onChangeAutoFilterCallback(true);
		} else {
			this._isLockedAll(onChangeAutoFilterCallback);
		}
	};

    WorksheetView.prototype.applyAutoFilter = function (autoFilterObject) {
        var t = this;
        var ar = this.model.selectionRange.getLast().clone();
        var onChangeAutoFilterCallback = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

            var applyFilterProps = t.model.autoFilters.applyAutoFilter(autoFilterObject, ar);
			if(!applyFilterProps) {
				return false;
			}
            var minChangeRow = applyFilterProps.minChangeRow;
            var rangeOldFilter = applyFilterProps.rangeOldFilter;

            if (null !== rangeOldFilter && !t.model.workbook.bUndoChanges && !t.model.workbook.bRedoChanges) {
                t._onUpdateFormatTable(rangeOldFilter, false, true);
				if (applyFilterProps.nOpenRowsCount !== applyFilterProps.nAllRowsCount) {
					t.handlers.trigger('onFilterInfo', applyFilterProps.nOpenRowsCount, applyFilterProps.nAllRowsCount);
				}
            }

            if (null !== minChangeRow) {
                t.objectRender.updateSizeDrawingObjects({target: c_oTargetType.RowResize, row: minChangeRow}, true);
            }
        };
		if (!window['AscCommonExcel'].filteringMode) {
			History.LocalChange = true;
			onChangeAutoFilterCallback();
			History.LocalChange = false;
        } else {
			this._isLockedAll(onChangeAutoFilterCallback);
        }
    };

    WorksheetView.prototype.reapplyAutoFilter = function (tableName) {
        var t = this;
        var ar = this.model.selectionRange.getLast().clone();
        var onChangeAutoFilterCallback = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

            //reApply
            var applyFilterProps = t.model.autoFilters.reapplyAutoFilter(tableName, ar);

            //reSort
            var filter = applyFilterProps.filter;
            if (filter && filter.SortState && filter.SortState.SortConditions && filter.SortState.SortConditions[0]) {
                var sortState = filter.SortState;
                var rangeWithoutHeaderFooter = filter.getRangeWithoutHeaderFooter();
                var sortRange = t.model.getRange3(rangeWithoutHeaderFooter.r1, rangeWithoutHeaderFooter.c1,
                  rangeWithoutHeaderFooter.r2, rangeWithoutHeaderFooter.c2);
                var startCol = sortState.SortConditions[0].Ref.c1;
                var type;
                var rgbColor = null;
                switch (sortState.SortConditions[0].ConditionSortBy) {
                    case Asc.ESortBy.sortbyCellColor:
                    {
                        type = Asc.c_oAscSortOptions.ByColorFill;
                        rgbColor = sortState.SortConditions[0].dxf.fill.bg();
                        break;
                    }
                    case Asc.ESortBy.sortbyFontColor:
                    {
                        type = Asc.c_oAscSortOptions.ByColorFont;
                        rgbColor = sortState.SortConditions[0].dxf.font.getColor();
                        break;
                    }
                    default:
                    {
                        type = Asc.c_oAscSortOptions.ByColorFont;
                        if (sortState.SortConditions[0].ConditionDescending) {
                            type = Asc.c_oAscSortOptions.Descending;
                        } else {
                            type = Asc.c_oAscSortOptions.Ascending;
                        }
                    }
                }

				var sort = t._doSort(sortRange, type, startCol, rgbColor, null, null, null, sortState);
                t.cellCommentator.sortComments(sort);
            }

            t.model.autoFilters._resetTablePartStyle();

            var minChangeRow = applyFilterProps.minChangeRow;
            var updateRange = applyFilterProps.updateRange;

            if (updateRange && !t.model.workbook.bUndoChanges && !t.model.workbook.bRedoChanges) {
                t._onUpdateFormatTable(updateRange, false, true);
            }

            if (null !== minChangeRow) {
                t.objectRender.updateSizeDrawingObjects({target: c_oTargetType.RowResize, row: minChangeRow}, true);
            }
        };
		if (!window['AscCommonExcel'].filteringMode) {
			History.LocalChange = true;
			onChangeAutoFilterCallback();
			History.LocalChange = false;
		} else {
			this._isLockedAll(onChangeAutoFilterCallback);
		}
    };

    WorksheetView.prototype.applyAutoFilterByType = function (autoFilterObject) {
        var t = this;
        var activeCell = this.model.selectionRange.activeCell.clone();
        var ar = this.model.selectionRange.getLast().clone();

		//нельзя применять если столбец, где находится активная ячейка, не определен
		if(!this.model.getColDataNoEmpty(activeCell.col)) {
			return;
		}

        var isStartRangeIntoFilterOrTable = t.model.autoFilters.isStartRangeContainIntoTableOrFilter(activeCell);
        var isApplyAutoFilter = null, isAddAutoFilter = null, cellId = null, isFromatTable = null;
        if (null !== isStartRangeIntoFilterOrTable)//into autofilter or format table
        {
            isFromatTable = !(-1 === isStartRangeIntoFilterOrTable);
            var filterRef = isFromatTable ? t.model.TableParts[isStartRangeIntoFilterOrTable].Ref :
              t.model.AutoFilter.Ref;
            cellId = t.model.autoFilters._rangeToId(new Asc.Range(ar.c1, filterRef.r1, ar.c1, filterRef.r1));
            isApplyAutoFilter = true;

            if (isFromatTable && !t.model.TableParts[isStartRangeIntoFilterOrTable].AutoFilter)//add autofilter to tablepart
            {
                isAddAutoFilter = true;
            }
        } else//without filter
        {
            isAddAutoFilter = true;
            isApplyAutoFilter = true;
        }


        var onChangeAutoFilterCallback = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

            History.Create_NewPoint();
            History.StartTransaction();

            if (null !== isAddAutoFilter) {
                //delete old filter
                if (!isFromatTable && t.model.AutoFilter && t.model.AutoFilter.Ref) {
                    t.model.autoFilters.isEmptyAutoFilters(t.model.AutoFilter.Ref);
                }

                //add new filter
                t.model.autoFilters.addAutoFilter(null, ar, null);
                //generate cellId
                if (null === cellId) {
                    cellId = t.model.autoFilters._rangeToId(
						new Asc.Range(activeCell.col, t.model.AutoFilter.Ref.r1, activeCell.col, t.model.AutoFilter.Ref.r1));
                }
            }

            if (null !== isApplyAutoFilter) {
                autoFilterObject.asc_setCellId(cellId);

                var filter = autoFilterObject.filter;
                if (c_oAscAutoFilterTypes.CustomFilters === filter.type) {
                    t.model._getCell(activeCell.row, activeCell.col, function(cell) {
                        filter.filter.CustomFilters[0].Val = cell.getValueWithoutFormat();
                    });
                } else if (c_oAscAutoFilterTypes.ColorFilter === filter.type) {
                    t.model._getCell(activeCell.row, activeCell.col, function(cell) {
                        if (filter.filter && filter.filter.dxf && filter.filter.dxf.fill) {
                            var xfs = cell.getCompiledStyleCustom(false, true, true);
                            if (false === filter.filter.CellColor) {
                                var fontColor = xfs && xfs.font ? xfs.font.getColor() : null;
                                //TODO добавлять дефолтовый цвет шрифта в случае, если цвет шрифта не указан
                                if (null !== fontColor) {
                                    filter.filter.dxf.fill.fromColor(fontColor);
                                }
                            } else {
                                //TODO просмотерть ситуации без заливки
                                var cellColor = null !== xfs && xfs.fill && xfs.fill.bg() ? xfs.fill.bg() : null;
                                filter.filter.dxf.fill.fromColor(null !== cellColor ? new AscCommonExcel.RgbColor(cellColor.getRgb()) : null);
                            }
                        }
                    });
                }

                var applyFilterProps = t.model.autoFilters.applyAutoFilter(autoFilterObject, ar, true);
				if(!applyFilterProps) {
					History.EndTransaction();
					return false;
				}
                var minChangeRow = applyFilterProps.minChangeRow;
                var rangeOldFilter = applyFilterProps.rangeOldFilter;

				History.EndTransaction();

                if (null !== rangeOldFilter && !t.model.workbook.bUndoChanges && !t.model.workbook.bRedoChanges) {
                    t._onUpdateFormatTable(rangeOldFilter, false, true);
                }
                if (null !== minChangeRow) {
                    t.objectRender.updateSizeDrawingObjects({target: c_oTargetType.RowResize, row: minChangeRow}, true);
                }
            } else {
				History.EndTransaction();
			}
        };

        if (null === isAddAutoFilter)//do not add autoFilter
        {
			if (!window['AscCommonExcel'].filteringMode) {
				History.LocalChange = true;
				onChangeAutoFilterCallback();
				History.LocalChange = false;
			} else {
				this._isLockedAll(onChangeAutoFilterCallback);
			}
        } else//add autofilter + apply
        {
			if (!window['AscCommonExcel'].filteringMode) {
				return;
			}
            if (t._checkAddAutoFilter(ar, null, autoFilterObject, true) === true) {
                this._isLockedAll(onChangeAutoFilterCallback);
                this._isLockedDefNames(null, null);
            }
        }

    };

    WorksheetView.prototype.sortRange = function (type, cellId, displayName, color, bIsExpandRange) {
        var t = this;
        var ar = this.model.selectionRange.getLast().clone();

		if (!window['AscCommonExcel'].filteringMode) {
			return;
		}

		var sortProps = t.model.autoFilters.getPropForSort(cellId, ar, displayName);
		var cloneSortProps = sortProps;
		var isFilter = sortProps && sortProps.curFilter && sortProps.curFilter.isAutoFilter();
		var filterRef;
		if(bIsExpandRange && isFilter) {
			//в случае расширения диапазона если мы находимся внутри а/ф игнорируются наcтройки
			filterRef = sortProps.curFilter.Ref;
			sortProps = null;
		}

		var expandRange;
		var selectionRange = t.model.selectionRange;
		var activeCell = selectionRange.activeCell.clone();
		var activeRange = selectionRange.getLast();
		if (null === sortProps) {
			//expand selectionRange
			if (bIsExpandRange) {
				expandRange = t.model.autoFilters.expandRange(activeRange);
				expandRange = t.model.autoFilters.checkExpandRangeForSort(expandRange);

				var bIgnoreFirstRow = window['AscCommonExcel'].ignoreFirstRowSort(t.model, expandRange);
				if (bIgnoreFirstRow) {
					expandRange.r1++;
				} else if(expandRange && filterRef && filterRef.containsRange(expandRange) && expandRange.r1 === filterRef.r1) {
					sortProps = cloneSortProps;
				}
			}
		}

        var onChangeAutoFilterCallback = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

            var onSortAutoFilterCallBack = function (success) {
				if (false === success) {
					return;
				}

				History.Create_NewPoint();
                History.StartTransaction();

                var rgbColor = color ? new AscCommonExcel.RgbColor((color.asc_getR() << 16) + (color.asc_getG() << 8) + color.asc_getB()) : null;


                var sort = t._doSort(sortProps.sortRange, type, sortProps.startCol, rgbColor);
                t.cellCommentator.sortComments(sort);
                t.model.autoFilters.sortColFilter(type, cellId, ar, sortProps, displayName, rgbColor);

				History.EndTransaction();
                t._onUpdateFormatTable(sortProps.sortRange.bbox, false);
            };

			if (null === sortProps) {
				var rgbColor = color ?  new AscCommonExcel.RgbColor((color.asc_getR() << 16) + (color.asc_getG() << 8) + color.asc_getB()) : null;

				//expand selectionRange
				if(bIsExpandRange && expandRange) {
					//change selection
					t.setSelection(expandRange);
					selectionRange.activeCell = activeCell;
				}

				//sort
				t.setSelectionInfo("sort", {type: type, color: rgbColor});
				//TODO возможно стоит возвратить selection обратно

            } else if (false !== sortProps) {
                t._isLockedCells(sortProps.sortRange.bbox, /*subType*/null, onSortAutoFilterCallBack);
            }
        };

		var bNeedSort = true;
		if(expandRange) {
			bNeedSort = !this.intersectionFormulaArray(expandRange, true);
		} else if(sortProps) {
			bNeedSort =  !this.intersectionFormulaArray(sortProps.sortRange.bbox, true)
		} else if(!sortProps) {
			bNeedSort = !this.intersectionFormulaArray(activeRange, true);
		}
		if(bNeedSort) {
			this._isLockedAll(onChangeAutoFilterCallback);
		} else {
			window.setTimeout(function() {
				t.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CannotChangeFormulaArray, c_oAscError.Level.NoCritical);
			}, 0);
		}
    };

    WorksheetView.prototype.getAddFormatTableOptions = function (range) {
        var selectionRange = this.model.selectionRange.getLast();
        //TODO возможно стоит перенести getAddFormatTableOptions во view
        return this.model.autoFilters.getAddFormatTableOptions(selectionRange, range);
    };

    WorksheetView.prototype.clearFilter = function () {
        var t = this;
        var ar = this.model.selectionRange.getLast().clone();

        var onChangeAutoFilterCallback = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

			AscCommonExcel.checkFilteringMode(function () {
				var updateRange = t.model.autoFilters.isApplyAutoFilterInCell(ar, true);
				if (false !== updateRange) {
					t._onUpdateFormatTable(updateRange, false, true);
				}
			});
        };
        this._isLockedAll(onChangeAutoFilterCallback);
    };

    WorksheetView.prototype.clearFilterColumn = function (cellId, displayName) {
        var t = this;

        var onChangeAutoFilterCallback = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

			AscCommonExcel.checkFilteringMode(function () {
				var updateRange = t.model.autoFilters.clearFilterColumn(cellId, displayName);
				if (false !== updateRange) {
					t._onUpdateFormatTable(updateRange, false, true);
				}
			});
        };
        this._isLockedAll(onChangeAutoFilterCallback);
    };

    /**
     * Обновление при изменениях форматированной таблицы
     * @param range - обновляемый диапазон (он же диапазон для выделения)
     * @param recalc - делать ли автоподбор по названию столбца
     * @param changeRowsOrMerge - менялись ли строки (скрытие раскрытие) или был unmerge
     * @private
     */
    WorksheetView.prototype._onUpdateFormatTable = function (range, recalc, changeRowsOrMerge) {
		var arrChanged;

        if (!recalc) {
            // ToDo сделать правильное обновление при скрытии/раскрытии строк/столбцов
			this._initCellsArea(AscCommonExcel.recalcType.full);
			this.cache.reset();
			this._cleanCellsTextMetricsCache();
			this._prepareCellTextMetricsCache();
			this._updateDrawingArea();
			arrChanged = [new asc_Range(range.c1, 0, range.c2, gc_nMaxRow0)];
			this.model.onUpdateRanges(arrChanged);
			this.objectRender.rebuildChartGraphicObjects(arrChanged);
			this.scrollType |= AscCommonExcel.c_oAscScrollType.ScrollVertical | AscCommonExcel.c_oAscScrollType.ScrollHorizontal;
			this.draw();
			this._updateSelectionNameAndInfo();
            return;
        }

        if (!this.model.selectionRange.getLast().isEqual(range)) {
            this.setSelection(range);
        }

        // ToDo refactoring this!!!
		this._calcHeightRows(AscCommonExcel.recalcType.newLines);
		this._calcWidthColumns(AscCommonExcel.recalcType.newLines);

        var i, r = range.r1, bIsUpdate = false, w;
        // AutoFit column with by headers of table
        for (i = range.c1; i <= range.c2; ++i) {
            w = this.onChangeWidthCallback(i, r, r, /*onlyIfMore*/true);
            if (-1 !== w) {
				this._calcColWidth(0, i);
                this._cleanCache(new asc_Range(i, 0, i, this.rows.length - 1));
                bIsUpdate = true;
            }
        }

        if (bIsUpdate) {
            this._updateColumnPositions();
            this._updateVisibleColsCount();
            this.changeWorksheet("update");
        } else if (changeRowsOrMerge) {
            // Был merge, нужно обновить (ToDo)
            this._initCellsArea(AscCommonExcel.recalcType.full);
            this.cache.reset();
            this._cleanCellsTextMetricsCache();
            this._prepareCellTextMetricsCache();
			this._updateDrawingArea();
            arrChanged = [new asc_Range(range.c1, 0, range.c2, gc_nMaxRow0)];
			this.model.onUpdateRanges(arrChanged);
            this.objectRender.rebuildChartGraphicObjects(arrChanged);
			this.scrollType |= AscCommonExcel.c_oAscScrollType.ScrollVertical | AscCommonExcel.c_oAscScrollType.ScrollHorizontal;
            this.draw();
			this._updateSelectionNameAndInfo();
        } else {
            // Просто отрисуем
            this.draw();
			this._updateSelectionNameAndInfo();
        }
    };

    WorksheetView.prototype._loadFonts = function (fonts, callback) {
        var api = window["Asc"]["editor"];
        api._loadFonts(fonts, callback);
    };

    WorksheetView.prototype.setData = function (oData) {
        History.Clear();
        History.TurnOff();
		var oAllRange = this.model.getRange3(0, 0, this.model.getRowsCount(), this.model.getColsCount());
        oAllRange.cleanAll();

        var row, oCell;
        for (var r = 0; r < oData.length; ++r) {
            row = oData[r];
            for (var c = 0; c < row.length; ++c) {
                if (row[c]) {
                    oCell = this._getVisibleCell(c, r);
                    oCell.setValue(row[c]);
                }
            }
        }
        History.TurnOn();
        this._updateRange(oAllRange.bbox); // ToDo Стоит обновить nRowsCount и nColsCount
		this.draw();
    };
    WorksheetView.prototype.getData = function () {
        var arrResult, arrCells = [], c, r, row, lastC = -1, lastR = -1, val;
        var maxCols = Math.min(this.model.getColsCount(), gc_nMaxCol);
        var maxRows = Math.min(this.model.getRowsCount(), gc_nMaxRow);

        for (r = 0; r < maxRows; ++r) {
            row = [];
            for (c = 0; c < maxCols; ++c) {
				this.model._getCellNoEmpty(r, c, function(cell) {
					if (cell && '' !== (val = cell.getValue())) {
						lastC = Math.max(lastC, c);
						lastR = Math.max(lastR, r);
					} else {
						val = '';
					}
				});
                row.push(val);
            }
            arrCells.push(row);
        }

        arrResult = arrCells.slice(0, lastR + 1);
        ++lastC;
        if (lastC < maxCols) {
            for (r = 0; r < arrResult.length; ++r) {
                arrResult[r] = arrResult[r].slice(0, lastC);
            }
        }
        return arrResult;
    };

	WorksheetView.prototype.getFilterButtonSize = function () {
	    return AscBrowser.isRetina ? AscCommon.AscBrowser.convertToRetinaValue(filterSizeButton, true) : filterSizeButton;
	};
    WorksheetView.prototype.af_drawButtons = function (updatedRange, offsetX, offsetY) {
        var i, aWs = this.model;
        var t = this;

        if (aWs.workbook.bUndoChanges || aWs.workbook.bRedoChanges) {
            return false;
        }

        var drawCurrentFilterButtons = function (filter) {
			var autoFilter = filter.isAutoFilter() ? filter : filter.AutoFilter;

			if(!filter.Ref) {
				return;
			}

            var range = new Asc.Range(filter.Ref.c1, filter.Ref.r1, filter.Ref.c2, filter.Ref.r1);

            if (range.isIntersect(updatedRange)) {
                var row = range.r1;

				var sortConditions = filter.isApplySortConditions() ? filter.SortState.SortConditions : null;
                for (var col = range.c1; col <= range.c2; col++) {
                    if (col >= updatedRange.c1 && col <= updatedRange.c2) {
                        var isSetFilter = false;
                        var isShowButton = true;
						var isSortState = null;//true - ascending, false - descending

						var colId = filter.isAutoFilter() ? t.model.autoFilters._getTrueColId(autoFilter, col - range.c1, true) : col - range.c1;
                        if (autoFilter.FilterColumns && autoFilter.FilterColumns.length) {
                            var filterColumn = null, filterColumnWithMerge = null;

                            for (var i = 0; i < autoFilter.FilterColumns.length; i++) {
                                if (autoFilter.FilterColumns[i].ColId === col - range.c1) {
                                    filterColumn = autoFilter.FilterColumns[i];
                                }

                                if (colId === col - range.c1 && filterColumn !== null) {
                                    filterColumnWithMerge = filterColumn;
                                    break;
                                } else if (autoFilter.FilterColumns[i].ColId === colId) {
                                    filterColumnWithMerge = autoFilter.FilterColumns[i];
                                }
                            }

                            if (filterColumnWithMerge && filterColumnWithMerge.isApplyAutoFilter()) {
                                isSetFilter = true;
                            }

                            if (filterColumn && filterColumn.ShowButton === false) {
                                isShowButton = false;
                            }

                        }

						if(sortConditions && sortConditions.length)
						{
							for(var i = 0; i < sortConditions.length; i++) {
								var sortCondition = sortConditions[i];
								if(colId === sortCondition.Ref.c1 - range.c1)
								{
									isSortState = !!(sortCondition.ConditionDescending);
								}
							}
						}

                        if (isShowButton === false) {
                            continue;
                        }

                        t.af_drawCurrentButton(offsetX, offsetY, {isSortState: isSortState, isSetFilter: isSetFilter, row: row, col: col});
                    }
                }
            }
        };

        if (aWs.AutoFilter) {
            drawCurrentFilterButtons(aWs.AutoFilter);
        }
        if (aWs.TableParts && aWs.TableParts.length) {
            for (i = 0; i < aWs.TableParts.length; i++) {
                if (aWs.TableParts[i].AutoFilter && aWs.TableParts[i].HeaderRowCount !== 0) {
                    drawCurrentFilterButtons(aWs.TableParts[i], true);
                }
            }
        }

        var pivotButtons = this.model.getPivotTableButtons(updatedRange);
        for (i = 0; i < pivotButtons.length; ++i) {
			this.af_drawCurrentButton(offsetX, offsetY,
				{isSortState: null, isSetFilter: false, row: pivotButtons[i].row, col: pivotButtons[i].col});
        }

        return true;
    };

	WorksheetView.prototype.af_drawCurrentButton = function (offsetX, offsetY, props) {
		var t = this;
		var ctx = t.drawingCtx;

		var isMobileRetina = false;

	    //TODO пересмотреть масштабирование!!!
		var isApplyAutoFilter = props.isSetFilter;
		var isApplySortState = props.isSortState;
		var row = props.row;
        var col = props.col;

        var widthButtonPx, heightButtonPx;
		widthButtonPx = heightButtonPx = this.getFilterButtonSize();

		var widthBorder = 1;
		var scaleIndex = 1;

		var m_oColor = new CColor(120, 120, 120);

		var widthWithBorders = widthButtonPx;
		var heightWithBorders = heightButtonPx;
		var width = widthButtonPx - widthBorder * 2;
		var height = heightButtonPx - widthBorder * 2;
		var colWidth = t._getColumnWidth(col);
		var rowHeight = t._getRowHeight(row);
		if (rowHeight < heightWithBorders)
		{
			widthWithBorders = widthWithBorders * (rowHeight / heightWithBorders);
			heightWithBorders = rowHeight;
		}

		//стартовая позиция кнопки
		var x1 = t._getColLeft(col + 1) - widthWithBorders - 0.5 - offsetX;
		//-1 смещение относительно нижней границы ячейки на 1px
		var y1 = t._getRowTop(row + 1) - heightWithBorders - 0.5 - offsetY - 1;

		var _drawButtonFrame = function(startX, startY, width, height)
		{
			ctx.setFillStyle(t.settings.cells.defaultState.background);
			ctx.setLineWidth(1);
			ctx.setStrokeStyle(t.settings.cells.defaultState.border);
			ctx.fillRect(startX, startY, width, height);
			ctx.strokeRect(startX, startY, width, height);
		};

		var _drawSortArrow = function(startX, startY, isDescending, heightArrow)
		{
			//isDescending = true - стрелочка смотрит вниз
			//рисуем сверху вниз
			ctx.beginPath();
			ctx.lineVer(startX, startY, startY + heightArrow * scaleIndex);

			var tmp;
			var x = startX;
			var y = startY;

			var heightArrow1 = heightArrow * scaleIndex;
			var height = 3 * scaleIndex;
			var x1, x2, y1;
			if(isDescending)
			{
				for(var i = 0; i < height; i++)
				{
					tmp = i;
					x1 = x - tmp;
					x2 = x - tmp + 1;
					y1 = y - tmp + heightArrow1 - 1;
					ctx.lineHor(x1, y1, x2);
					x1 = x + tmp;
					x2 = x + tmp + 1;
					y1 = y - tmp + heightArrow1 - 1;
					ctx.lineHor(x1, y1, x2);
				}
			}
			else
			{
				for(var i = 0; i < height; i++)
				{
				    tmp = i;
					x1 = x - tmp;
					x2 = x - tmp + 1;
					y1 = y + tmp;
					ctx.lineHor(x1, y1, x2);
					x1 = x + tmp;
					x2 = x + tmp + 1;
					y1 = y + tmp;
					ctx.lineHor(x1, y1, x2);
				}
			}

			if(isMobileRetina)
			{
				ctx.setLineWidth(AscBrowser.retinaPixelRatio * 2);
			}
			else
			{
				ctx.setLineWidth(AscBrowser.retinaPixelRatio);
			}

			ctx.setStrokeStyle(m_oColor);
			ctx.stroke();
		};

        var _drawFilterMark = function (x, y, height)
		{
            var heightLine = Math.round(height);
			var heightCleanLine = heightLine - 2;

			ctx.beginPath();

			ctx.moveTo(x, y);
			ctx.lineTo(x, y - heightCleanLine);
			ctx.setLineWidth(2 * AscBrowser.retinaPixelRatio * (isMobileRetina ? 2 : 1));
			ctx.setStrokeStyle(m_oColor);
			ctx.stroke();

			var heightTriangle = 4;
			y = y - heightLine + 1;
			_drawFilterDreieck(x, y, heightTriangle, 2);
        };

		var _drawFilterDreieck = function (x, y, height, base)
		{
			ctx.beginPath();

			if(isMobileRetina)
			{
				ctx.setLineWidth(AscBrowser.retinaPixelRatio * 2);
			}
			else
			{
				ctx.setLineWidth(AscBrowser.retinaPixelRatio);
			}

			x = x + 1;
			var diffY = (height / 2);
			height = height * scaleIndex;
			for(var i = 0; i < height; i++)
			{
				ctx.lineHor(x - (i + base) , y + (height - i) - diffY, x + i)
			}

			ctx.setStrokeStyle(m_oColor);
			ctx.stroke();
		};

		//TODO пересмотреть отрисовку кнопок + отрисовку при масштабировании
		var _drawButton = function(upLeftXButton, upLeftYButton)
		{
			//квадрат кнопки рисуем
			_drawButtonFrame(upLeftXButton, upLeftYButton, width, height);

			//координаты центра
			var centerX = upLeftXButton + (width / 2);
			var centerY = upLeftYButton + (height / 2);

			if(null !== isApplySortState && isApplyAutoFilter)
			{
				var heigthObj = Math.ceil(height / 2) + 2;
				var marginTop = Math.floor((height - heigthObj) / 2);
				centerY = upLeftYButton + heigthObj + marginTop;

				_drawSortArrow(upLeftXButton + 4 * scaleIndex, upLeftYButton + 5 * scaleIndex, isApplySortState, 8);
				_drawFilterMark(centerX + 3, centerY, heigthObj);
			}
			else if(null !== isApplySortState)
			{
				_drawSortArrow(upLeftXButton + width - 5 * scaleIndex, upLeftYButton + 3 * scaleIndex, isApplySortState, 10);
				_drawFilterDreieck(centerX - 3, centerY + 1, 3, 1);
			}
			else if (isApplyAutoFilter)
			{
				var heigthObj = Math.ceil(height / 2) + 2;
				var marginTop = Math.floor((height - heigthObj) / 2);

				centerY = upLeftYButton + heigthObj + marginTop;
				_drawFilterMark(centerX + 1, centerY, heigthObj);
			}
			else
			{
				_drawFilterDreieck(centerX, centerY, 4, 1);
			}
		};

		//TODO!!! некорректно рисуется кнопка при уменьшении масштаба и уменьшении размера строки
		var diffX = 0;
		var diffY = 0;
		if ((colWidth - 2) < width && rowHeight < (height + 2))
		{
			if (rowHeight < colWidth)
			{
				scaleIndex = rowHeight / height;
				width = width * scaleIndex;
				height = rowHeight;
			}
			else
			{
				scaleIndex = colWidth / width;
				diffY = width - colWidth;
				diffX = width - colWidth;
				width = colWidth;
				height = height * scaleIndex;
			}
		}
		else if ((colWidth - 2) < width)
		{
			scaleIndex = colWidth / width;
			//смещения по x и y
			diffY = width - colWidth;
			diffX = width - colWidth + 2;
			width = colWidth;
			height = height * scaleIndex;
		}
		else if ((rowHeight - widthBorder * 2) < height)
		{
			scaleIndex = rowHeight / (height + widthBorder * 2);
			width = width * scaleIndex;
			height = rowHeight -  widthBorder * 2;
		}


		if(window['IS_NATIVE_EDITOR'])
		{
			isMobileRetina = true;
		}

		if(AscBrowser.isRetina)
		{
			scaleIndex *= 2;
		}

		_drawButton(x1 + diffX, y1 + diffY);
	};

	WorksheetView.prototype.af_checkCursor = function (x, y, _vr, offsetX, offsetY, r, c) {
		var aWs = this.model;
		var t = this;
		var result = null;

		var _isShowButtonInFilter = function (col, filter) {
			var result = true;
			var autoFilter = filter.isAutoFilter() ? filter : filter.AutoFilter;

			if (filter.HeaderRowCount === 0) {
				result = null;
			} else if (autoFilter && autoFilter.FilterColumns)//проверяем скрытые ячейки
			{
				var colId = col - autoFilter.Ref.c1;
				for (var i = 0; i < autoFilter.FilterColumns.length; i++) {
					if (autoFilter.FilterColumns[i].ColId === colId) {
						if (autoFilter.FilterColumns[i].ShowButton === false) {
							result = null;
						}

						break;
					}
				}
			} else if (!filter.isAutoFilter() && autoFilter === null)//если форматированная таблица и отсутсвует а/ф
			{
				result = null;
			}

			return result;
		};

		var checkCurrentFilter = function (filter, num) {
			var range = new Asc.Range(filter.Ref.c1, filter.Ref.r1, filter.Ref.c2, filter.Ref.r1);
			if (range.contains(c.col, r.row) && _isShowButtonInFilter(c.col, filter)) {
				var row = range.r1;
				for (var col = range.c1; col <= range.c2; col++) {
					if (col === c.col) {

						if(t._hitCursorFilterButton(x, y, col, row)){
							result = {cursor: kCurAutoFilter, target: c_oTargetType.FilterObject, col: -1, row: -1, idFilter: {id: num, colId: col - range.c1}};
							break;
						}
					}
				}
			}
		};

		if(_vr.contains(c.col, r.row))
		{
			x = x + offsetX;
			y = y + offsetY;

			if (aWs.AutoFilter && aWs.AutoFilter.Ref) {
				checkCurrentFilter(aWs.AutoFilter, null);
			}

			if (aWs.TableParts && aWs.TableParts.length && !result) {
				for (var i = 0; i < aWs.TableParts.length; i++) {
					if (aWs.TableParts[i].AutoFilter) {
						checkCurrentFilter(aWs.TableParts[i], i);
					}
				}
			}
		}

		return result;
	};

	WorksheetView.prototype._hitCursorFilterButton = function(x, y, col, row)
	{
		var width, height;
		width = height = this.getFilterButtonSize();
		var rowHeight = this._getRowHeight(row);
		if (rowHeight < height) {
			width = width * (rowHeight / height);
			height = rowHeight;
		}

		var top = this._getRowTop(row + 1);
		var left = this._getColLeft(col + 1);
		var x1 = left - width - 0.5;
		var y1 = top - height - 0.5;
		var x2 = left - 0.5;
		var y2 = top - 0.5;

		return (x >= x1 && x <= x2 && y >= y1 && y <= y2);
	};

	WorksheetView.prototype._checkAddAutoFilter = function (activeRange, styleName, addFormatTableOptionsObj, filterByCellContextMenu) {
			//write error, if not add autoFilter and return false
			var result = true;
			var worksheet = this.model;
			var filter = worksheet.AutoFilter;

			if (filter && styleName && filter.Ref.isIntersect(activeRange) && !(filter.Ref.containsRange(activeRange) &&
					(activeRange.isOneCell() || (filter.Ref.isEqual(activeRange))) ||
					(filter.Ref.r1 === activeRange.r1 && activeRange.containsRange(filter.Ref)))) {
				worksheet.workbook.handlers.trigger("asc_onError", c_oAscError.ID.AutoFilterDataRangeError,
					c_oAscError.Level.NoCritical);
				result = false;
			} else if (filter && styleName && filter.Ref.r1 === activeRange.r2 + 1 && addFormatTableOptionsObj.isTitle === false) {
				worksheet.workbook.handlers.trigger("asc_onError", c_oAscError.ID.AutoFilterDataRangeError, c_oAscError.Level.NoCritical);
				result = false;
			} else if (!styleName && activeRange.isOneCell() && worksheet.autoFilters._isEmptyRange(activeRange, 1)) {
				//add filter to empty range - if select contains 1 cell
				worksheet.workbook.handlers.trigger("asc_onError", c_oAscError.ID.AutoFilterDataRangeError,
					c_oAscError.Level.NoCritical);
				result = false;
			} else if (!styleName && !activeRange.isOneCell() && worksheet.autoFilters._isEmptyRange(activeRange, 0)) {
				//add filter to empty range
				worksheet.workbook.handlers.trigger("asc_onError", c_oAscError.ID.AutoFilterDataRangeError,
					c_oAscError.Level.NoCritical);
				result = false;
			} else if (!styleName && filterByCellContextMenu && false === worksheet.autoFilters._getAdjacentCellsAF(activeRange, this).isIntersect(activeRange)) {
				//TODO _getAdjacentCellsAF стоит заменить на expandRange ?
				//add filter to empty range
				worksheet.workbook.handlers.trigger("asc_onError", c_oAscError.ID.AutoFilterDataRangeError, c_oAscError.Level.NoCritical);
				result = false;
			} else if (styleName && addFormatTableOptionsObj && addFormatTableOptionsObj.isTitle === false &&
				worksheet.autoFilters._isEmptyCellsUnderRange(activeRange) == false &&
				worksheet.autoFilters._isPartTablePartsUnderRange(activeRange)) {
				//add format table without title if down another format table
				worksheet.workbook.handlers.trigger("asc_onError", c_oAscError.ID.AutoFilterChangeFormatTableError,
					c_oAscError.Level.NoCritical);
				result = false;
			} else if (this.model.inPivotTable(activeRange)) {
				result = false;
            } else if(styleName && this.intersectionFormulaArray(activeRange, true, true)) {
				worksheet.workbook.handlers.trigger("asc_onError", c_oAscError.ID.MultiCellsInTablesFormulaArray, c_oAscError.Level.NoCritical);
				result = false;
			}

			return result;
		};

    WorksheetView.prototype.af_getSizeButton = function (c, r) {
        var ws = this;
        var result = null;

        var isCellContainsAutoFilterButton = function (col, row) {
            var aWs = ws.model;
            if (aWs.TableParts) {
                var tablePart;
                for (var i = 0; i < aWs.TableParts.length; i++) {
                    tablePart = aWs.TableParts[i];
                    //TODO добавить проверку на isHidden у кнопки
                    if (tablePart.Ref.contains(col, row) && tablePart.Ref.r1 === row) {
                        return true;
                    }
                }
            }

            //TODO добавить проверку на isHidden у кнопки
            if (aWs.AutoFilter && aWs.AutoFilter.Ref.contains(col, row) && aWs.AutoFilter.Ref.r1 === row) {
                return true;
            }

            return false;
        };

        if (isCellContainsAutoFilterButton(c, r)) {
			var width, height;
			width = height = this.getFilterButtonSize();
            var rowHeight = this._getRowHeight(r);
            var index = 1;
            if (rowHeight < height) {
                index = rowHeight / height;
                width = width * index;
                height = rowHeight;
            }

            result = {width: width, height: height};
        }

        return result;
    };

    WorksheetView.prototype.af_setDialogProp = function (filterProp, isReturnProps) {
        var ws = this.model;

        if(!filterProp){
            return;
        }

        //get filter
        var filter, autoFilter, displayName = null;
        if (filterProp.id === null) {
            autoFilter = ws.AutoFilter;
            filter = ws.AutoFilter;
        } else {
            autoFilter = ws.TableParts[filterProp.id].AutoFilter;
            filter = ws.TableParts[filterProp.id];
            displayName = filter.DisplayName;
        }

        //get values
        var colId = filterProp.colId;
		if(filterProp.id === null) {
			colId = this.model.autoFilters._getTrueColId(filter, colId, true);
		}

        var openAndClosedValues = ws.autoFilters.getOpenAndClosedValues(filter, colId);
        var values = openAndClosedValues.values;
        var automaticRowCount = openAndClosedValues.automaticRowCount;
        //для случае когда скрыто только пустое значение не отображаем customfilter
		var ignoreCustomFilter = openAndClosedValues.ignoreCustomFilter;
        var filters = autoFilter.getFilterColumn(colId);

        var rangeButton = new Asc.Range(autoFilter.Ref.c1 + colId, autoFilter.Ref.r1, autoFilter.Ref.c1 + colId, autoFilter.Ref.r1);
        var cellId = ws.autoFilters._rangeToId(rangeButton);
        var cell = this.model.getRange3(rangeButton.r1, rangeButton.c1, rangeButton.r2, rangeButton.c2);
        var columnName = cell.getValue();

        var cellCoord = this.getCellCoord(autoFilter.Ref.c1 + colId, autoFilter.Ref.r1);

        //get filter object
        var filterObj = new Asc.AutoFilterObj();
        if (filters && filters.ColorFilter) {
            filterObj.type = c_oAscAutoFilterTypes.ColorFilter;
            filterObj.filter = filters.ColorFilter.clone();
        } else if (!ignoreCustomFilter && filters && filters.CustomFiltersObj && filters.CustomFiltersObj.CustomFilters) {
            filterObj.type = c_oAscAutoFilterTypes.CustomFilters;
            filterObj.filter = filters.CustomFiltersObj;
        } else if (filters && filters.DynamicFilter) {
            filterObj.type = c_oAscAutoFilterTypes.DynamicFilter;
            filterObj.filter = filters.DynamicFilter.clone();
        } else if (filters && filters.Top10) {
            filterObj.type = c_oAscAutoFilterTypes.Top10;
            filterObj.filter = filters.Top10.clone();
        } else if (filters) {
            filterObj.type = c_oAscAutoFilterTypes.Filters;
        } else {
            filterObj.type = c_oAscAutoFilterTypes.None;
        }

        //get sort
        var sortVal = null;
        var sortColor = null;
        if (filter && filter.SortState && filter.SortState.SortConditions && filter.SortState.SortConditions[0]) {
            var SortConditions = filter.SortState.SortConditions;

            for(var i = 0; i < SortConditions.length; i++) {
				var sortCondition = SortConditions[i];
            	if (rangeButton.c1 == sortCondition.Ref.c1) {

					var conditionSortBy = SortConditions.ConditionSortBy;
					switch (conditionSortBy) {
						case Asc.ESortBy.sortbyCellColor:
						{
							sortVal = Asc.c_oAscSortOptions.ByColorFill;
							sortColor = sortCondition.dxf && sortCondition.dxf.fill ? sortCondition.dxf.fill.bg() : null;
							break;
						}
						case Asc.ESortBy.sortbyFontColor:
						{
							sortVal = Asc.c_oAscSortOptions.ByColorFont;
							sortColor = sortCondition.dxf && sortCondition.dxf.font ? sortCondition.dxf.font.getColor() : null;
							break;
						}
						default:
						{
							if (sortCondition.ConditionDescending) {
								sortVal = Asc.c_oAscSortOptions.Descending;
							} else {
								sortVal = Asc.c_oAscSortOptions.Ascending;
							}

							break;
						}
					}
				}
			}
        }

        var ascColor = null;
        if (null !== sortColor) {
            ascColor = new Asc.asc_CColor();
            ascColor.asc_putR(sortColor.getR());
            ascColor.asc_putG(sortColor.getG());
            ascColor.asc_putB(sortColor.getB());
            ascColor.asc_putA(sortColor.getA());
        }


        //set menu object
        var autoFilterObject = new Asc.AutoFiltersOptions();

        autoFilterObject.asc_setSortState(sortVal);
        autoFilterObject.asc_setCellCoord(cellCoord);
        autoFilterObject.asc_setCellId(cellId);
        autoFilterObject.asc_setValues(values);
        autoFilterObject.asc_setFilterObj(filterObj);
        autoFilterObject.asc_setAutomaticRowCount(automaticRowCount);
        autoFilterObject.asc_setDiplayName(displayName);
        autoFilterObject.asc_setSortColor(ascColor);
		autoFilterObject.asc_setColumnName(columnName);
		autoFilterObject.asc_setSheetColumnName(AscCommon.g_oCellAddressUtils.colnumToColstr(rangeButton.c1 + 1));

		var columnRange = new Asc.Range(colId + autoFilter.Ref.c1, autoFilter.Ref.r1 + 1, colId + autoFilter.Ref.c1, autoFilter.Ref.r2);

        var filterTypes = this.model.getRowColColors(columnRange);
        autoFilterObject.asc_setIsTextFilter(filterTypes.text);
        autoFilterObject.asc_setColorsFill(filterTypes.colors);
        autoFilterObject.asc_setColorsFont(filterTypes.fontColors);

        if (isReturnProps) {
            return autoFilterObject;
        } else {
            this.handlers.trigger("setAutoFiltersDialog", autoFilterObject);
        }
    };

    WorksheetView.prototype.af_changeSelectionTablePart = function (activeRange) {
        var t = this;
        var tableParts = t.model.TableParts;
        var _changeSelectionToAllTablePart = function () {

            var tablePart;
            for (var i = 0; i < tableParts.length; i++) {
                tablePart = tableParts[i];
                if (tablePart.Ref.intersection(activeRange)) {
                    if (t.model.autoFilters._activeRangeContainsTablePart(activeRange, tablePart.Ref)) {
                        var newActiveRange = new Asc.Range(tablePart.Ref.c1, tablePart.Ref.r1, tablePart.Ref.c2, tablePart.Ref.r2);
                        t.setSelection(newActiveRange);
                    }

                    break;
                }
            }
        };

        var _changeSelectionFromCellToColumn = function () {
            if (tableParts && tableParts.length && activeRange.isOneCell()) {
                for (var i = 0; i < tableParts.length; i++) {
                    if (tableParts[i].HeaderRowCount !== 0 && tableParts[i].Ref.containsRange(activeRange) && tableParts[i].Ref.r1 === activeRange.r1) {
                        var newActiveRange = new Asc.Range(activeRange.c1, activeRange.r1, activeRange.c1, tableParts[i].Ref.r2);
                        if (!activeRange.isEqual(newActiveRange)) {
                            t.setSelection(newActiveRange);
                        }
                        break;
                    }
                }
            }
        };

        if (activeRange.isOneCell()) {
            _changeSelectionFromCellToColumn(activeRange);
        } else {
            _changeSelectionToAllTablePart(activeRange);
        }
    };

    WorksheetView.prototype.af_isCheckMoveRange = function (arnFrom, arnTo, opt_wsTo) {
        var ws = this.model;
        var tableParts = ws.TableParts;
        var tablePart;

        var checkMoveRangeIntoApplyAutoFilter = function (arnTo) {
            if (ws.AutoFilter && ws.AutoFilter.Ref && arnTo.intersection(ws.AutoFilter.Ref) && !arnFrom.isEqual(ws.AutoFilter.Ref)) {
                //если затрагиваем скрытые строки а/ф - выдаём ошибку
                if (ws.autoFilters._searchHiddenRowsByFilter(ws.AutoFilter, arnTo)) {
                    return false;
                }
            }
            return true;
        };

        //1) если выделена часть форматированной таблицы и ещё часть(либо полностью)
        var counterIntersection = 0;
        var counterContains = 0;
        for (var i = 0; i < tableParts.length; i++) {
            tablePart = tableParts[i];
            if (tablePart.Ref.intersection(arnFrom)) {
                if (arnFrom.containsRange(tablePart.Ref)) {
                    counterContains++;
                } else {
                    counterIntersection++;
                }
            }
        }

        if ((counterIntersection > 0 && counterContains > 0) || (counterIntersection > 1)) {
            ws.workbook.handlers.trigger("asc_onError", c_oAscError.ID.AutoFilterDataRangeError,
              c_oAscError.Level.NoCritical);
            return false;
        }


        //2)если затрагиваем перемещаемым диапазоном часть а/ф со скрытыми строчками
        if (!opt_wsTo && !checkMoveRangeIntoApplyAutoFilter(arnTo)) {
            ws.workbook.handlers.trigger("asc_onError", c_oAscError.ID.AutoFilterMoveToHiddenRangeError,
              c_oAscError.Level.NoCritical);
            return false;
        }

        return true;
    };

    WorksheetView.prototype.af_changeSelectionFormatTable = function (tableName, optionType) {
        var t = this;
        var ws = this.model;

        var tablePart = ws.autoFilters._getFilterByDisplayName(tableName);

        if (!tablePart || (tablePart && !tablePart.Ref)) {
            return false;
        }

        var refTablePart = tablePart.Ref;

        var lastSelection = this.model.selectionRange.getLast();
        var startCol = lastSelection.c1;
        var endCol = lastSelection.c2;
        var startRow = lastSelection.r1;
        var endRow = lastSelection.r2;

        switch (optionType) {
            case c_oAscChangeSelectionFormatTable.all:
            {
                startCol = refTablePart.c1;
                endCol = refTablePart.c2;
                startRow = refTablePart.r1;
                endRow = refTablePart.r2;

                break;
            }
            case c_oAscChangeSelectionFormatTable.data:
            {
				var rangeWithoutHeaderFooter = tablePart.getRangeWithoutHeaderFooter();
                startCol = lastSelection.c1 < refTablePart.c1 ? refTablePart.c1 : lastSelection.c1;
                endCol = lastSelection.c2 > refTablePart.c2 ? refTablePart.c2 : lastSelection.c2;
                startRow = rangeWithoutHeaderFooter.r1;
                endRow = rangeWithoutHeaderFooter.r2;

                break;
            }
            case c_oAscChangeSelectionFormatTable.row:
            {
                startCol = refTablePart.c1;
                endCol = refTablePart.c2;
                startRow = lastSelection.r1 < refTablePart.r1 ? refTablePart.r1 : lastSelection.r1;
                endRow = lastSelection.r2 > refTablePart.r2 ? refTablePart.r2 : lastSelection.r2;

                break;
            }
            case c_oAscChangeSelectionFormatTable.column:
            {
                startCol = lastSelection.c1 < refTablePart.c1 ? refTablePart.c1 : lastSelection.c1;
                endCol = lastSelection.c2 > refTablePart.c2 ? refTablePart.c2 : lastSelection.c2;
                startRow = refTablePart.r1;
                endRow = refTablePart.r2;

                break;
            }
        }

        t.setSelection(new Asc.Range(startCol, startRow, endCol, endRow));
    };

    WorksheetView.prototype.af_changeFormatTableInfo = function (tableName, optionType, val) {
        var tablePart = this.model.autoFilters._getFilterByDisplayName(tableName);
        var t = this;
        var ar = this.model.selectionRange.getLast();

        if (!tablePart || (tablePart && !tablePart.TableStyleInfo)) {
            return false;
        }

		if (!window['AscCommonExcel'].filteringMode) {
			return false;
		}

        var isChangeTableInfo = this.af_checkChangeTableInfo(tablePart, optionType);
        if (isChangeTableInfo !== false) {
            var lockRange = isChangeTableInfo.lockRange ? isChangeTableInfo.lockRange : null;
            var updateRange = isChangeTableInfo.updateRange;
        	var callback = function (isSuccess) {
                if (false === isSuccess) {
                    t.handlers.trigger("selectionChanged");
                    return;
                }

                History.Create_NewPoint();
                History.StartTransaction();

                var newTableRef = t.model.autoFilters.changeFormatTableInfo(tableName, optionType, val);
                if (newTableRef.r1 > ar.r1 || newTableRef.r2 < ar.r2) {
                    var startRow = newTableRef.r1 > ar.r1 ? newTableRef.r1 : ar.r1;
                    var endRow = newTableRef.r2 < ar.r2 ? newTableRef.r2 : ar.r2;
                    var newActiveRange = new Asc.Range(ar.c1, startRow, ar.c2, endRow);

                    t.setSelection(newActiveRange);
                    History.SetSelectionRedo(newActiveRange);
                }

				History.EndTransaction();
                t._onUpdateFormatTable(updateRange, false, true);
            };

            lockRange = lockRange ? lockRange : t.af_getLockRangeTableInfo(tablePart, optionType, val);
            if (lockRange) {
                t._isLockedCells(lockRange, null, callback);
            } else {
                callback();
            }
        }
    };

    WorksheetView.prototype.af_checkChangeTableInfo = function (table, optionType) {
        var res = table.Ref;
        var t = this;
        var ws = this.model, range;
        var lockRange = null;

		var sendError = function() {
			ws.workbook.handlers.trigger("asc_onError", c_oAscError.ID.AutoFilterChangeFormatTableError, c_oAscError.Level.NoCritical);
			t.handlers.trigger("selectionChanged");
		};

		var checkShift = function(range) {
			var result = false;

			if(!t.model.autoFilters._isPartTablePartsUnderRange(range)) {
				result = true;

				//проверяем ещё на наличие части объединенной ячейки
				//для объединенной ячейки - ms выдаёт другую ошибку
				//TODO мы сейчас выдаём одинаковую ошибку для случаев с форматированной таблицей внизу и объединенной областью. пересмотреть!
				//пока комментирую проверку на объединенные ячейки

				var downRange = Asc.Range(range.c1, range.r2 + 1, range.c2, gc_nMaxRow0);
				var mergedRange = ws.getMergedByRange(downRange);

				if(mergedRange && mergedRange.all) {
					for(var i = 0; i < mergedRange.all.length; i++) {
						if(mergedRange.all[i] && mergedRange.all[i].bbox) {
							if(mergedRange.all[i].bbox.intersection(mergedRange) && !mergedRange.all[i].bbox.containsRange(mergedRange)) {
								result = false;
								break;
							}
						}
					}
				}
			}

			return result;
		};

		switch (optionType) {
			case c_oAscChangeTableStyleInfo.rowHeader:
			{
				//добавляем строку заголовков. нужно чтобы либо сверху была пустая строка, либо был возможен сдвиг диапазона вниз
				if(!table.isHeaderRow()) {
					range = Asc.Range(table.Ref.c1, table.Ref.r1 - 1, table.Ref.c2, table.Ref.r1 - 1);
					if(!this.model.autoFilters._isEmptyRange(range, 0)) {
						if(!checkShift(table.Ref)) {
							sendError();
							res = false;
						} else {
							//в данном случае возвращаем не диапазон лока, а диапазон обновления данных
							lockRange = Asc.Range(table.Ref.c1, table.Ref.r1 - 1, table.Ref.c2, gc_nMaxRow0);
							res = table.Ref;
						}
					}
				}

				break;
			}
			case c_oAscChangeTableStyleInfo.rowTotal:
			{
				range = new Asc.Range(table.Ref.c1, table.Ref.r2 + 1, table.Ref.c2, table.Ref.r2 + 1);
				if(table.isTotalsRow()) {

					if(checkShift(table.Ref)) {
						//сдвиг диапазона вверх
						//в данном случае возвращаем не диапазон лока, а диапазон обновления данных
						lockRange = Asc.Range(table.Ref.c1, table.Ref.r2 - 1, table.Ref.c2, gc_nMaxRow0);
						res = table.Ref;
					}
				} else { // добавляем строку
					if(checkShift(table.Ref)) {
						//сдвиг диапазона вниз
						lockRange = Asc.Range(table.Ref.c1, table.Ref.r2 + 1, table.Ref.c2, gc_nMaxRow0);
						res = Asc.Range(table.Ref.c1, table.Ref.r1, table.Ref.c2, table.Ref.r2 + 1);
					} else if(!this.model.autoFilters._isEmptyRange(range, 0)){
						sendError();
						res = false;
					}
				}

				break;
			}
		}

		return res ? {updateRange: res, lockRange: lockRange} : res;
    };

    WorksheetView.prototype.af_getLockRangeTableInfo = function (tablePart, optionType, val) {
        var res = null;

        switch (optionType) {
            case c_oAscChangeTableStyleInfo.columnBanded:
            case c_oAscChangeTableStyleInfo.columnFirst:
            case c_oAscChangeTableStyleInfo.columnLast:
            case c_oAscChangeTableStyleInfo.rowBanded:
            case c_oAscChangeTableStyleInfo.filterButton:
            {
                res = tablePart.Ref;
                break;
            }
            case c_oAscChangeTableStyleInfo.rowTotal:
            {
                if (val === false) {
                    res = tablePart.Ref;
                } else {
					var rangeUpTable = new Asc.Range(tablePart.Ref.c1, tablePart.Ref.r2 + 1, tablePart.Ref.c2, tablePart.Ref.r2 + 1);
					if(this.model.autoFilters._isEmptyRange(rangeUpTable, 0) && this.model.autoFilters.searchRangeInTableParts(rangeUpTable) === -1){
                    res = new Asc.Range(tablePart.Ref.c1, tablePart.Ref.r1, tablePart.Ref.c2, tablePart.Ref.r2 + 1);
                }
					else{
						res = new Asc.Range(tablePart.Ref.c1, tablePart.Ref.r2 + 1, tablePart.Ref.c2, gc_nMaxRow0);
					}
                }
                break;
            }
            case c_oAscChangeTableStyleInfo.rowHeader:
            {
                if (val === false) {
                    res = tablePart.Ref;
                } else {
					var rangeUpTable = new Asc.Range(tablePart.Ref.c1, tablePart.Ref.r1 - 1, tablePart.Ref.c2, tablePart.Ref.r1 - 1);
					if(this.model.autoFilters._isEmptyRange(rangeUpTable, 0) && this.model.autoFilters.searchRangeInTableParts(rangeUpTable) === -1){
                    res = new Asc.Range(tablePart.Ref.c1, tablePart.Ref.r1 - 1, tablePart.Ref.c2, tablePart.Ref.r2);
                }
					else{
						res = new Asc.Range(tablePart.Ref.c1, tablePart.Ref.r1 - 1, tablePart.Ref.c2, gc_nMaxRow0);
					}
                }
                break;
            }
        }

        return res;
    };

	WorksheetView.prototype.af_insertCellsInTable = function (tableName, optionType) {
		var t = this;
		var ws = this.model;

		var tablePart = ws.autoFilters._getFilterByDisplayName(tableName);

		if (!tablePart || (tablePart && !tablePart.Ref)) {
			return false;
		}

		var insertCellsAndShiftDownRight = function (arn, displayName, type) {
			var range = t.model.getRange3(arn.r1, arn.c1, arn.r2, arn.c2);
			var isCheckChangeAutoFilter = t.af_checkInsDelCells(arn, type, "insCell", true);
			if (isCheckChangeAutoFilter === false) {
				return;
			}

			var callback = function (isSuccess) {
				if (false === isSuccess) {
					return;
				}

				History.Create_NewPoint();
				History.StartTransaction();
				var shiftCells = type === c_oAscInsertOptions.InsertCellsAndShiftRight ?
					range.addCellsShiftRight(displayName) : range.addCellsShiftBottom(displayName);
				History.EndTransaction();
				if (shiftCells) {
					t.cellCommentator.updateCommentsDependencies(true, type, arn);
					t.objectRender.updateDrawingObject(true, type, arn);
					t._onUpdateFormatTable(range, false, true);
				}
			};

			var r2 = type === c_oAscInsertOptions.InsertCellsAndShiftRight ? tablePart.Ref.r2 : gc_nMaxRow0;
			var c2 = type !== c_oAscInsertOptions.InsertCellsAndShiftRight ? tablePart.Ref.c2 : gc_nMaxCol0;
			var changedRange = new asc_Range(tablePart.Ref.c1, tablePart.Ref.r1, c2, r2);
			t._isLockedCells(changedRange, null, callback);
		};

		var newActiveRange = this.model.selectionRange.getLast().clone();
		var displayName = undefined;
		var type = null;
		var totalRow = tablePart.isTotalsRow();
		switch (optionType) {
			case c_oAscInsertOptions.InsertTableRowAbove: {
				newActiveRange.c1 = tablePart.Ref.c1;
				newActiveRange.c2 = tablePart.Ref.c2;
				type = c_oAscInsertOptions.InsertCellsAndShiftDown;

				break;
			}
			case c_oAscInsertOptions.InsertTableRowBelow: {
				newActiveRange.c1 = tablePart.Ref.c1;
				newActiveRange.c2 = tablePart.Ref.c2;
				newActiveRange.r1 = totalRow ? tablePart.Ref.r2 : tablePart.Ref.r2 + 1;
				newActiveRange.r2 = totalRow ? tablePart.Ref.r2 : tablePart.Ref.r2 + 1;
				if (!totalRow) {
					displayName = tableName;
				}
				type = c_oAscInsertOptions.InsertCellsAndShiftDown;

				break;
			}
			case c_oAscInsertOptions.InsertTableColLeft: {
				newActiveRange.r1 = tablePart.Ref.r1;
				newActiveRange.r2 = tablePart.Ref.r2;
				type = c_oAscInsertOptions.InsertCellsAndShiftRight;

				break;
			}
			case c_oAscInsertOptions.InsertTableColRight: {
				newActiveRange.c1 = tablePart.Ref.c2 + 1;
				newActiveRange.c2 = tablePart.Ref.c2 + 1;
				newActiveRange.r1 = tablePart.Ref.r1;
				newActiveRange.r2 = tablePart.Ref.r2;
				displayName = tableName;
				type = c_oAscInsertOptions.InsertCellsAndShiftRight;

				break;
			}
		}

		insertCellsAndShiftDownRight(newActiveRange, displayName, type)
	};

    WorksheetView.prototype.af_deleteCellsInTable = function (tableName, optionType) {
        var t = this;
        var ws = this.model;

        var tablePart = ws.autoFilters._getFilterByDisplayName(tableName);

        if (!tablePart || (tablePart && !tablePart.Ref)) {
            return false;
        }

        var deleteCellsAndShiftLeftTop = function (arn, type) {
            var isCheckChangeAutoFilter = t.af_checkInsDelCells(arn, type, "delCell", true);
            if (isCheckChangeAutoFilter === false) {
                return;
            }

            var callback = function (isSuccess) {
                if (false === isSuccess) {
                    return;
                }

                History.Create_NewPoint();
                History.StartTransaction();

                if (isCheckChangeAutoFilter === true) {
                    t.model.autoFilters.isEmptyAutoFilters(arn, type);
                }

                var preDeleteAction = function () {
                    t.cellCommentator.updateCommentsDependencies(false, type, arn);
                };

                var res;
				var range;
                if (type === c_oAscDeleteOptions.DeleteCellsAndShiftLeft) {
					range = t.model.getRange3(arn.r1, arn.c1, arn.r2, arn.c2);
                    res = range.deleteCellsShiftLeft(preDeleteAction);
                } else {
					arn = t.model.autoFilters.checkDeleteAllRowsFormatTable(arn, true);
					range = t.model.getRange3(arn.r1, arn.c1, arn.r2, arn.c2);
                    res = range.deleteCellsShiftUp(preDeleteAction);
                }

				History.EndTransaction();
                if (res) {
                    t.objectRender.updateDrawingObject(true, type, arn);
                    t._onUpdateFormatTable(range, false, true);
                }
            };

			var r2 = type === c_oAscDeleteOptions.DeleteCellsAndShiftLeft ? tablePart.Ref.r2 : gc_nMaxRow0;
			var c2 = type !== c_oAscDeleteOptions.DeleteCellsAndShiftLeft ? tablePart.Ref.c2 : gc_nMaxCol0;
			var changedRange = new asc_Range(tablePart.Ref.c1, tablePart.Ref.r1, c2, r2);
            t._isLockedCells(changedRange, null, callback);
        };

        var deleteTableCallback = function (ref) {

			if (!window['AscCommonExcel'].filteringMode) {
				return false;
			}

            var callback = function (isSuccess) {
                if (false === isSuccess) {
                    return;
                }

                History.Create_NewPoint();
                History.StartTransaction();

                t.model.autoFilters.isEmptyAutoFilters(ref);
                var cleanRange = t.model.getRange3(ref.r1, ref.c1, ref.r2, ref.c2);
                cleanRange.cleanAll();
                t.cellCommentator.deleteCommentsRange(cleanRange.bbox);

				History.EndTransaction();
                t._onUpdateFormatTable(ref, false, true);
            };

            t._isLockedCells(ref, null, callback);
        };

        var newActiveRange = this.model.selectionRange.getLast().clone();
        var val = null;
        switch (optionType) {
            case c_oAscDeleteOptions.DeleteColumns:
            {
                newActiveRange.r1 = tablePart.Ref.r1;
                newActiveRange.r2 = tablePart.Ref.r2;

                val = c_oAscDeleteOptions.DeleteCellsAndShiftLeft;
                break;
            }
            case c_oAscDeleteOptions.DeleteRows:
            {
                newActiveRange.c1 = tablePart.Ref.c1;
                newActiveRange.c2 = tablePart.Ref.c2;

                val = c_oAscDeleteOptions.DeleteCellsAndShiftTop;
                break;
            }
            case c_oAscDeleteOptions.DeleteTable:
            {
                deleteTableCallback(tablePart.Ref.clone());
                break;
            }
        }

        if (val !== null) {
            deleteCellsAndShiftLeftTop(newActiveRange, val);
        }
    };

    WorksheetView.prototype.af_changeDisplayNameTable = function (tableName, newName) {
        this.model.autoFilters.changeDisplayNameTable(tableName, newName);
    };

    WorksheetView.prototype.af_checkInsDelCells = function (activeRange, val, prop, isFromFormatTable) {
        var ws = this.model;
        var res = true;

		if (!window['AscCommonExcel'].filteringMode) {
			if(val === c_oAscInsertOptions.InsertCellsAndShiftRight || val === c_oAscInsertOptions.InsertColumns){
				return false;
			}else if(val === c_oAscDeleteOptions.DeleteCellsAndShiftLeft || val === c_oAscDeleteOptions.DeleteColumns){
				return false;
			}
		}

        var intersectionTableParts = ws.autoFilters.getTableIntersectionRange(activeRange);
        var isPartTablePartsUnderRange = ws.autoFilters._isPartTablePartsUnderRange(activeRange);
        var isPartTablePartsRightRange = ws.autoFilters.isPartTablePartsRightRange(activeRange);
        var isOneTableIntersection = intersectionTableParts && intersectionTableParts.length === 1 ? intersectionTableParts[0] : null;

		var isPartTablePartsByRowCol = ws.autoFilters._isPartTablePartsByRowCol(activeRange);
		//var isPartTablePartsRows = ws.autoFilters._isPartTablePartsUnderRange(activeRange);

		var allTablesInside = true;
		if(intersectionTableParts && intersectionTableParts.length) {
			for(var i = 0; i < intersectionTableParts.length; i++) {
				if(intersectionTableParts[i] && intersectionTableParts[i].Ref && !activeRange.containsRange(intersectionTableParts[i].Ref)) {
					allTablesInside = false;
					break;
				}
			}
		}

		//TODO перепроверить ->
		//когда выделено несколько колонок и нажимаем InsertCellsAndShiftRight(аналогично со строками)
		//ms в данном случае выдаёт ошибку, но пока не вижу никаких ограничений для данного действия
        var checkInsCells = function () {
            switch (val) {
                case c_oAscInsertOptions.InsertCellsAndShiftDown:
                {
                    if (isFromFormatTable) {
                        //если внизу находится часть форматированной таблицы или это часть форматированной таблицы
                        if (isPartTablePartsUnderRange) {
                            res = false;
                        } else if (isOneTableIntersection !== null &&
                          !(isOneTableIntersection.Ref.c1 === activeRange.c1 &&
                          isOneTableIntersection.Ref.c2 === activeRange.c2)) {
                            res = false;
                        }
                    } else {
                        if (isPartTablePartsUnderRange) {
                            res = false;
                        } /*else if (intersectionTableParts && null !== isOneTableIntersection) {
                            res = false;
                        } else if (isOneTableIntersection && !isOneTableIntersection.Ref.isEqual(activeRange)) {
                            res = false;
                        }*/ else if(isPartTablePartsByRowCol && isPartTablePartsByRowCol.cols) {
							res = false;
						}
                    }

                    break;
                }
                case c_oAscInsertOptions.InsertCellsAndShiftRight:
                {
                    //если справа находится часть форматированной таблицы или это часть форматированной таблицы
                    if (isFromFormatTable) {
                        if (isPartTablePartsRightRange) {
                            res = false;
                        }
                    } else {
                        if (isPartTablePartsRightRange) {
                            res = false;
                        } /*else if (intersectionTableParts && null !== isOneTableIntersection) {
                            res = false;
                        } else if (isOneTableIntersection && !isOneTableIntersection.Ref.isEqual(activeRange)) {
                            res = false;
                        } */else if(isPartTablePartsByRowCol && isPartTablePartsByRowCol.rows) {
							res = false;
						}
                    }

                    break;
                }
                case c_oAscInsertOptions.InsertColumns:
                {

                    break;
                }
                case c_oAscInsertOptions.InsertRows:
                {

                    break;
                }
            }
        };

        var checkDelCells = function () {
            switch (val) {
                case c_oAscDeleteOptions.DeleteCellsAndShiftTop:
                {
                    if (isFromFormatTable) {
                        if (isPartTablePartsUnderRange) {
                            res = false;
                        }
                    } else {
                        if (isPartTablePartsUnderRange) {
                            res = false;
                        } /*else if (!isOneTableIntersection && null !== isOneTableIntersection) {
                            res = false;
                        } else if (isOneTableIntersection && !isOneTableIntersection.Ref.isEqual(activeRange)) {
                            res = false;
                        }*/ else if(!allTablesInside) {
							res = false;
						}
                    }

                    break;
                }
                case c_oAscDeleteOptions.DeleteCellsAndShiftLeft:
                {
                    if (isFromFormatTable) {
                        if (isPartTablePartsRightRange) {
                            res = false;
                        }
                    } else {
                        if (isPartTablePartsRightRange) {
                            res = false;
                        } /*else if (!isOneTableIntersection && null !== isOneTableIntersection) {
                            res = false;
                        } else if (isOneTableIntersection && !isOneTableIntersection.Ref.isEqual(activeRange)) {
                            res = false;
                        }*/ else if(!allTablesInside) {
							res = false;
						}
                    }

                    break;
                }
                case c_oAscDeleteOptions.DeleteColumns:
                {

                    break;
                }
                case c_oAscDeleteOptions.DeleteRows:
                {

                    break;
                }
            }
        };

        prop === "insCell" ? checkInsCells() : checkDelCells();

        if (res === false) {
            ws.workbook.handlers.trigger("asc_onError", c_oAscError.ID.AutoFilterChangeFormatTableError,
              c_oAscError.Level.NoCritical);
        }

        return res;
    };

    WorksheetView.prototype.af_setDisableProps = function (tablePart, formatTableInfo) {
        var selectionRange = this.model.selectionRange;
        var lastRange = selectionRange.getLast();
        var activeCell = selectionRange.activeCell;

        if (!tablePart) {
            return false;
        }

        var refTable = tablePart.Ref;
        var refTableContainsActiveRange = selectionRange.isSingleRange() && refTable.containsRange(lastRange);

        //если курсор стоит в нижней строке, то разрешаем добавление нижней строки
        formatTableInfo.isInsertRowBelow = (refTableContainsActiveRange && ((tablePart.TotalsRowCount === null && activeCell.row === refTable.r2) ||
        (tablePart.TotalsRowCount !== null && activeCell.row === refTable.r2 - 1)));

        //если курсор стоит в правом столбце, то разрешаем добавление одного столбца правее
        formatTableInfo.isInsertColumnRight = (refTableContainsActiveRange && activeCell.col === refTable.c2);

        //если внутри находится вся активная область или если выходит активная область за границу справа
        formatTableInfo.isInsertColumnLeft = refTableContainsActiveRange;

        //если внутри находится вся активная область(кроме строки заголовков) или если выходит активная область за границу снизу
        formatTableInfo.isInsertRowAbove = (refTableContainsActiveRange && ((lastRange.r1 > refTable.r1 && tablePart.HeaderRowCount === null) ||
        (lastRange.r1 >= refTable.r1 && tablePart.HeaderRowCount !== null)));

		//если есть заголовок, и в данных всего одна строка
		//todo пределать все проверки HeaderRowCount на вызов функции isHeaderRow
		var dataRange = tablePart.getRangeWithoutHeaderFooter();
		if(refTable.r1 === lastRange.r1 && refTable.r2 === lastRange.r2) {
			formatTableInfo.isDeleteRow = true;
		} else if((tablePart.isHeaderRow() || tablePart.isTotalsRow()) && dataRange.r1 === dataRange.r2 && lastRange.r1 === lastRange.r2 && dataRange.r1 === lastRange.r1) {
			formatTableInfo.isDeleteRow = false;
		} else {
			formatTableInfo.isDeleteRow = refTableContainsActiveRange && !(lastRange.r1 <= refTable.r1 && lastRange.r2 >= refTable.r1 && null === tablePart.HeaderRowCount);
		}

        formatTableInfo.isDeleteColumn = true;
        formatTableInfo.isDeleteTable = true;

		if (!window['AscCommonExcel'].filteringMode) {
			formatTableInfo.isDeleteColumn = false;
			formatTableInfo.isInsertColumnRight = false;
			formatTableInfo.isInsertColumnLeft = false;

		}
    };

	WorksheetView.prototype.af_convertTableToRange = function (tableName) {
        var t = this;

		if (!window['AscCommonExcel'].filteringMode) {
			return;
		}

        var callback = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

            History.Create_NewPoint();
            History.StartTransaction();

            t.model.autoFilters.convertTableToRange(tableName);
			History.EndTransaction();

            t._onUpdateFormatTable(lockRange, false, true);
        };

        var table = t.model.autoFilters._getFilterByDisplayName(tableName);

        var lockRange = null !== table ? table.Ref : null;
        var callBackLockedDefNames = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

            t._isLockedCells(lockRange, null, callback);
        };

        //лочим данный именованный диапазон
        var defNameId = t.model.workbook.dependencyFormulas.getDefNameByName(tableName, t.model.getId());
        defNameId = defNameId ? defNameId.getNodeId() : null;

        t._isLockedDefNames(callBackLockedDefNames, defNameId);
    };

    WorksheetView.prototype.af_changeTableRange = function (tableName, range, callbackAfterChange) {
        var t = this;
        if(typeof range === "string"){
			range = AscCommonExcel.g_oRangeCache.getAscRange(range);
		}

		if (!window['AscCommonExcel'].filteringMode) {
			return;
		}

        var callback = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

            History.Create_NewPoint();
            History.StartTransaction();

            t.model.autoFilters.changeTableRange(tableName, range);

			History.EndTransaction();
            t._onUpdateFormatTable(range, false, true);
            //TODO добавить перерисовку таблицы и перерисовку шаблонов
			if(callbackAfterChange){
				callbackAfterChange();
            }
        };

        //TODO возможно не стоит лочить весь диапазон. проверить: когда один ползователь меняет диапазон, другой снимает а/ф с ф/т. в этом случае в deleteAutoFilter передавать не range а имя ф/т
        var table = t.model.autoFilters._getFilterByDisplayName(tableName);
        var tableRange = null !== table ? table.Ref : null;

        var lockRange = range;
        if (null !== tableRange) {
            var r1 = tableRange.r1 < range.r1 ? tableRange.r1 : range.r1;
            var r2 = tableRange.r2 > range.r2 ? tableRange.r2 : range.r2;
            var c1 = tableRange.c1 < range.c1 ? tableRange.c1 : range.c1;
            var c2 = tableRange.c2 > range.c2 ? tableRange.c2 : range.c2;

            lockRange = new Asc.Range(c1, r1, c2, r2);
        }

        var callBackLockedDefNames = function (isSuccess) {
            if (false === isSuccess) {
                return;
            }

			var callbackLockAll = function(_success) {
				if (false === _success) {
					return;
				}

				t._isLockedCells(lockRange, null, callback);
			};

			t._isLockedAll(callbackLockAll);
		};

        //лочим данный именованный диапазон при смене размера ф/т
        var defNameId = t.model.workbook.dependencyFormulas.getDefNameByName(tableName, t.model.getId());
        defNameId = defNameId ? defNameId.getNodeId() : null;

        t._isLockedDefNames(callBackLockedDefNames, defNameId);
    };

    WorksheetView.prototype.af_checkChangeRange = function (range) {
        var res = null;
        var intersectionTables = this.model.autoFilters.getTableIntersectionRange(range);
        if (0 < intersectionTables.length) {
            var tablePart = intersectionTables[0];
            if (range.isOneCell()) {
                res = c_oAscError.ID.FTChangeTableRangeError
            } else if (range.r1 !== tablePart.Ref.r1)//первая строка таблицы не равна первой строке выделенного диапазона
            {
                res = c_oAscError.ID.FTChangeTableRangeError;
            } else if (intersectionTables.length !== 1)//выделено несколько таблиц
            {
                res = c_oAscError.ID.FTRangeIncludedOtherTables;
            } else if (this.model.AutoFilter && this.model.AutoFilter.Ref &&
              this.model.AutoFilter.Ref.isIntersect(range)) {
                res = c_oAscError.ID.FTChangeTableRangeError;
            }
        } else {
            res = c_oAscError.ID.FTChangeTableRangeError;
        }

        return res;
    };

	WorksheetView.prototype.checkMoveFormulaArray = function(from, to, ctrlKey, opt_wsTo) {
		//***array-formula***
		var res = true;

		//TODO вместо getRange3 нужна функция, которая может заканчивать цикл по ячейкам
		if(!ctrlKey) {
			//проверяем from, затрагиваем ли мы часть формулы массива
			res = !this.intersectionFormulaArray(from);
		}

		//проверяем to, затрагиваем ли мы часть формулы массива
		var ws = opt_wsTo ? opt_wsTo : this;
		if(res && to) {
			res = !ws.intersectionFormulaArray(to);
		}

		return res;
	};

	WorksheetView.prototype.intersectionFormulaArray = function(range, notCheckContains, checkOneCellArray) {
		//checkOneCellArray - ф/т можно добавить поверх формулы массива, которая содержит 1 ячейку, если более - то ошибка
		//notCheckContains - ф/т нельзя добавить, если мы пересекаемся или содержим ф/т

		var res = false;
		this.model.getRange3(range.r1, range.c1, range.r2, range.c2)._foreachNoEmpty(function(cell) {
			if(cell.isFormula()) {
				var formulaParsed = cell.getFormulaParsed();
				var arrayFormulaRef = formulaParsed.getArrayFormulaRef();
				if(arrayFormulaRef && (!checkOneCellArray || (checkOneCellArray && !arrayFormulaRef.isOneCell()))) {
					if(notCheckContains) {
						res = true;
					} else if(!notCheckContains && !range.containsRange(arrayFormulaRef)){
						res = true;
					}
				}
			}
		});
		return res;
	};

    // Convert coordinates methods
	WorksheetView.prototype.ConvertXYToLogic = function (x, y) {
		var c = this.visibleRange.c1, cFrozen, widthDiff;
		var r = this.visibleRange.r1, rFrozen, heightDiff;
		if (this.topLeftFrozenCell) {
			cFrozen = this.topLeftFrozenCell.getCol0();
			widthDiff = this._getColLeft(cFrozen) - this._getColLeft(0);
			if (x < this.cellsLeft + widthDiff && 0 !== widthDiff) {
				c = 0;
			}

			rFrozen = this.topLeftFrozenCell.getRow0();
			heightDiff = this._getRowTop(rFrozen) - this._getRowTop(0);
			if (y < this.cellsTop + heightDiff && 0 !== heightDiff) {
				r = 0;
			}
		}

		x += this._getColLeft(c) - this.cellsLeft - this.cellsLeft;
		y += this._getRowTop(r) - this.cellsTop - this.cellsTop;

		x *= asc_getcvt(0/*px*/, 3/*mm*/, this._getPPIX());
		y *= asc_getcvt(0/*px*/, 3/*mm*/, this._getPPIY());
		return {X: x, Y: y};
	};
	WorksheetView.prototype.ConvertLogicToXY = function (xL, yL) {
		xL *= asc_getcvt(3/*mm*/, 0/*px*/, this._getPPIX());
		yL *= asc_getcvt(3/*mm*/, 0/*px*/, this._getPPIY());

		var c = this.visibleRange.c1, cFrozen, widthDiff = 0;
		var r = this.visibleRange.r1, rFrozen, heightDiff = 0;
		if (this.topLeftFrozenCell) {
			cFrozen = this.topLeftFrozenCell.getCol0();
			widthDiff = this._getColLeft(cFrozen) - this._getColLeft(0);
			if (xL < widthDiff && 0 !== widthDiff) {
				c = 0;
				widthDiff = 0;
			}

			rFrozen = this.topLeftFrozenCell.getRow0();
			heightDiff = this._getRowTop(rFrozen) - this._getRowTop(0);
			if (yL < heightDiff && 0 !== heightDiff) {
				r = 0;
				heightDiff = 0;
			}
		}

		xL -= (this._getColLeft(c) - widthDiff - this.cellsLeft - this.cellsLeft);
		yL -= (this._getRowTop(r) - heightDiff - this.cellsTop - this.cellsTop);
		return {X: xL, Y: yL};
	};

	/** Для api layout */
	WorksheetView.prototype.changeDocSize = function (width, height) {
		var t = this;
		var pageOptions = t.model.PagePrintOptions;

		var onChangeDocSize = function (isSuccess) {
			if (false === isSuccess) {
				return;
			}

			History.Create_NewPoint();
			History.StartTransaction();

			pageOptions.pageSetup.asc_setWidth(width);
			pageOptions.pageSetup.asc_setHeight(height);

			History.EndTransaction();

			t.recalcPrintScale();
			t.changeViewPrintLines(true);

			if(t.viewPrintLines) {
				t.updateSelection();
			}
			window["Asc"]["editor"]._onUpdateLayoutMenu(t.model.Id);
		};

		return this._isLockedLayoutOptions(onChangeDocSize);
	};

	WorksheetView.prototype.changePageOrient = function (orientation) {
		var pageOptions = this.model.PagePrintOptions;
		var t = this;

		var callback = function (isSuccess) {
			if (false === isSuccess) {
				return;
			}

			History.Create_NewPoint();
			History.StartTransaction();

			pageOptions.pageSetup.asc_setOrientation(orientation);

			History.EndTransaction();

			t.recalcPrintScale();
			t.changeViewPrintLines(true);

			if(t.viewPrintLines) {
				t.updateSelection();
			}
			window["Asc"]["editor"]._onUpdateLayoutMenu(t.model.Id);
		};

		return this._isLockedLayoutOptions(callback);
	};

	WorksheetView.prototype.changePageMargins = function (left, right, top, bottom) {
		var t = this;
		var pageOptions = t.model.PagePrintOptions;
		var pageMargins = pageOptions.asc_getPageMargins();

		var callback = function (isSuccess) {
			if (false === isSuccess) {
				return;
			}

			History.Create_NewPoint();
			History.StartTransaction();

			pageMargins.asc_setLeft(left);
			pageMargins.asc_setRight(right);
			pageMargins.asc_setTop(top);
			pageMargins.asc_setBottom(bottom);

			History.EndTransaction();

			t.recalcPrintScale();
			t.changeViewPrintLines(true);

			if(t.viewPrintLines) {
				t.updateSelection();
			}
			window["Asc"]["editor"]._onUpdateLayoutMenu(t.model.Id);
		};

		return this._isLockedLayoutOptions(callback);
	};

	WorksheetView.prototype.setPageOption = function (callback, val) {
		var t = this;
		var onChangeDocSize = function (isSuccess) {
			if (false === isSuccess) {
				return;
			}

			History.Create_NewPoint();
			History.StartTransaction();

			callback(val);
			t.recalcPrintScale();
			t.changeViewPrintLines(true);

			History.EndTransaction();

			if(t.viewPrintLines) {
				t.updateSelection();
			}
		};

		return this._isLockedLayoutOptions(onChangeDocSize);
	};

	WorksheetView.prototype.setPageOptions = function (obj) {
		var t = this;
		var viewMode = !window["Asc"]["editor"].canEdit();

		if(!obj) {
			return;
		}

		var onChangeDocSize = function (isSuccess) {
			if (false === isSuccess) {
				return;
			}

			t.savePageOptions(obj, viewMode);
			t.recalcPrintScale();
			t.changeViewPrintLines(true);

			if(t.viewPrintLines) {
				t.updateSelection();
			}
		};

		return viewMode ? onChangeDocSize(true) : this._isLockedLayoutOptions(onChangeDocSize);
	};

	WorksheetView.prototype.savePageOptions = function (obj, viewMode) {
		var t = this;
		var pageOptions = t.model.PagePrintOptions;

		var callback = function() {
			History.Create_NewPoint();
			History.StartTransaction();

			var pageSetupModel = pageOptions.asc_getPageSetup();
			var oldFitToWidth = pageSetupModel.asc_getFitToWidth();
			var oldFitToHeight = pageSetupModel.asc_getFitToHeight();
			var pageSetupObj = obj.asc_getPageSetup();
			var newFitToWidth = pageSetupObj.asc_getFitToWidth();
			var newFitToHeight = pageSetupObj.asc_getFitToHeight();

			//если поменялись scaling - fit sheet on.. -> необходимо пересчитать scaling
			if(oldFitToWidth != newFitToWidth || oldFitToHeight != newFitToHeight) {
				t.fitToWidthHeight(newFitToWidth, newFitToHeight);
			}

			if(newFitToWidth === 0 && newFitToHeight === 0) {
				pageOptions.asc_getPageSetup().asc_setScale(pageSetupObj.asc_getScale());
			}

			pageOptions.asc_setOptions(obj);

			t.recalcPrintScale();
			t.changeViewPrintLines(true);
			//window["Asc"]["editor"]._onUpdateLayoutMenu(this.model.nSheetId);

			History.EndTransaction();
		};
		if(viewMode) {
			History.TurnOff();
		}
		callback();
		if(viewMode) {
			History.TurnOn();
		}

		if(t.viewPrintLines) {
			t.updateSelection();
		}
	};

	WorksheetView.prototype.changePrintArea = function (type) {
		var t = this;
		var wb = window["Asc"]["editor"].wb;

		//TODO нужно ли лочить именованные диапазоны при изменении особого именованного диапазона - Print_Area
		var callback = function (isSuccess) {
			if (false === isSuccess) {
				return;
			}

			var getRangesStr = function(ranges, oldStr) {
				var str = oldStr ? oldStr : "";
				var selectionLast = t.model.selectionRange.getLast();
				var mc = selectionLast.isOneCell() ? t.model.getMergedByCell(selectionLast.r1, selectionLast.c1) : null;
				for(var i = 0; i < ranges.length; i++) {
					if(i === 0 && str !== "") {
						str += ",";
					}
					AscCommonExcel.executeInR1C1Mode(false, function () {
						str += parserHelp.get3DRef(t.model.getName(), (mc || ranges[i]).getAbsName());
					});
					if(i !== ranges.length - 1) {
						str += ",";
					}
				}
				return str;
			};

			var printArea = t.model.workbook.getDefinesNames("Print_Area", t.model.getId());
			if(printArea && printArea.sheetId !== t.model.getId()) {
				printArea = null;
			}
			var oldDefName, oldScope, newRef, newDefName, oldRef;
			switch (type) {
				case Asc.c_oAscChangePrintAreaType.set: {
					//если нет такого именнованного диапазона - создаём. если есть - меняем ref

					oldDefName = printArea ? printArea.getAscCDefName() : null;
					oldScope = oldDefName ? oldDefName.asc_getScope() : t.model.index;
					newRef = getRangesStr(t.model.selectionRange.ranges);
					newDefName = new Asc.asc_CDefName("Print_Area", newRef, oldScope, false, null, null, true);
					t.changeViewPrintLines(true);
					wb.editDefinedNames(oldDefName, newDefName);

					break;
				}
				case Asc.c_oAscChangePrintAreaType.clear: {
					if(printArea) {
						wb.delDefinedNames(printArea.getAscCDefName());
					}
					break;
				}
				case Asc.c_oAscChangePrintAreaType.add: {
					//расширяем именованный диапазон
					oldDefName = printArea ? printArea.getAscCDefName() : null;
					if(oldDefName) {
						oldScope = oldDefName ? oldDefName.asc_getScope() : t.model.index;
						oldRef = oldDefName.asc_getRef();
						newRef = getRangesStr(t.model.selectionRange.ranges, oldRef);
						newDefName = new Asc.asc_CDefName("Print_Area", newRef, oldScope, false, null, null, true);
						t.recalcPrintScale();
						t.changeViewPrintLines(true);
						wb.editDefinedNames(oldDefName, newDefName);
					}

					break;
				}
			}

		};

		return callback();
	};

    WorksheetView.prototype.canAddPrintArea = function () {
        var res = false, t = this;
        var printArea = this.model.workbook.getDefinesNames("Print_Area", this.model.getId());
        if(printArea && printArea.sheetId === this.model.getId()) {
            var selection = this.model.selectionRange.ranges;

            var areaRefsArr;
			AscCommonExcel.executeInR1C1Mode(false, function () {
				areaRefsArr = AscCommonExcel.getRangeByRef(printArea.ref, t.model, true, true, true)
			});
            if(areaRefsArr && areaRefsArr.length) {
				res = true;
            	for(var i = 0; i < areaRefsArr.length; i++) {
					var range = areaRefsArr[i];

					//todo проверирить если есть валидные области, нужно ли в данном случае сразу возвращать false
					if(range && range.bbox) {
						range = range.bbox;
					} else {
						return false;
					}

                    for(var j = 0; j < selection.length; j++) {
                        if(selection[j].intersection(range)) {
                            return false;
                        }
                    }
                }
            }
        }

		return res;
	};

	WorksheetView.prototype.changeViewPrintLines = function (val) {
		this.viewPrintLines = val;
	};

	WorksheetView.prototype.getRangeText = function (range, delimiter) {
		var t = this;
		if (range === undefined) {
			range = this.model.selectionRange.getLast();
		}
		if(delimiter === undefined) {
			delimiter = "\n";
		}

		var firstDefCell;
		var res = "";
		var bImptyText = true;
		var maxRow = Math.min(range.r2, t.rows.length - 1);
		this.model.getRange3(range.r1, range.c1, maxRow, range.c2)._foreach2(function(cell, r, c) {
			if(cell !== null) {
				var text = cell.getValueForEdit();
				//извлекаем тест до первого переноса строки
				//TODO ms  в данном случае показывает на первом preview всю ячейку в одну строку, а на втором preview обрубает до первого переноса строки
				text = text.split(/\r?\n/)[0];
				if(text !== "") {
					res += text;
					bImptyText = false;
				}
				firstDefCell = true;
			}
			if(r !== maxRow && firstDefCell) {
				res += delimiter;
			}
		});
		return bImptyText ? "" : res;
	};

	//GROUP DATA FUNCTIONS
	WorksheetView.prototype._updateGroups = function(bCol, start, end, bUpdateOnlyRowLevelMap, bUpdateOnlyRange) {
		if(bCol) {
			if(bUpdateOnlyRowLevelMap) {
				//this.arrColGroups.levelMap = this.getGroupDataArray(bCol, start, end, bUpdateOnlyRowLevelMap, bUpdateOnlyRange).levelMap;
			} else {
				this.arrColGroups = this.getGroupDataArray(bCol, start, end);
				var oldGroupHeight = this.groupHeight;
				this.groupHeight = this.getGroupCommonWidth(this.getGroupCommonLevel(bCol), bCol);

				//TODO пересмотреть! добавлено, потому что при undo не вызывается

				if(oldGroupHeight !== this.groupHeight) {
					this._calcHeaderRowHeight();
				}
			}
		} else {
			if(bUpdateOnlyRowLevelMap) {
				//this.arrRowGroups.levelMap = this.getGroupDataArray(bCol, start, end, bUpdateOnlyRowLevelMap, bUpdateOnlyRange).levelMap;
			} else {
				this.arrRowGroups = this.getGroupDataArray(bCol, start, end);
				this.groupWidth = this.getGroupCommonWidth(this.getGroupCommonLevel());
			}
		}
	};

	WorksheetView.prototype._updateGroupsWidth = function() {
		this.groupHeight = this.getGroupCommonWidth(this.getGroupCommonLevel(true), true);
		this.groupWidth = this.getGroupCommonWidth(this.getGroupCommonLevel());
	};

	WorksheetView.prototype.getGroupDataArray = function (bCol, start, end, bUpdateOnlyRowLevelMap, bUpdateOnlyRange) {
		//проходимся по диапазону, и проверяем верхние/нижние строчки на наличия в них аттрибута outLineLevel
		//возможно стоит добавить кэш для отрисовки

		if(start === undefined) {
			start = 0;
			end = bCol ? gc_nMaxCol : gc_nMaxRow;
		}

		/*var levelMap = {};
		if(bUpdateOnlyRange) {
			if(bCol && this.arrColGroups && this.arrColGroups.levelMap) {
				levelMap = this.arrColGroups.levelMap;
			} else if(this.arrRowGroups && this.arrRowGroups.levelMap) {
				levelMap = this.arrRowGroups.levelMap;
			}
		}*/

		var res = null;
		var up = true, down = true;
		var fProcess = function(val){
			var outLineLevel = val ? val.getOutlineLevel() : null;

			//levelMap[val.index] = {level: outLineLevel, collapsed: false};
			if(bUpdateOnlyRowLevelMap) {
				return;
			}

			var continueRange = function(level, index) {
				var tempNeedPush = true;

				if(!res[level] || undefined === res[level][index]) {
					return true;
				}

				if(val.index === res[level][index].start - 1) {
					res[level][index].start--;
					tempNeedPush = false;
				} else if(val.index === res[level][index].end + 1) {
					res[level][index].end++;
					tempNeedPush = false;
				} else if(val.index >= res[level][index].start && val.index <= res[level][index].end) {
					tempNeedPush = false;
				}

				return tempNeedPush;
			};

			if(!outLineLevel) {
				if(start === val.index) {
					up = false;
				} else if(end === val.index) {
					down = false;
				}
			} else {
				if(!res) {
					res = [];
				}
				if(!res[outLineLevel]) {
					res[outLineLevel] = [];
				}
				var needPush = true;
				for(var j = 0; j < res[outLineLevel].length; j++) {
					if(!continueRange(outLineLevel, j)) {
						needPush = false;
						break;
					}
				}

				if(needPush) {
					res[outLineLevel].push({start: val.index, end: val.index});
				}

				//расширяем предыдущие(младшие) уровни
				//для того что - младший уровень не может быть меньше старшего
				for(var n = 1; n < outLineLevel; n++) {

					var bAdd = false;
					if(!res[n]) {
						bAdd = true;
						if(res[outLineLevel]) {
							res[n] = [{start: res[outLineLevel][res[outLineLevel].length - 1].start, end: res[outLineLevel][res[outLineLevel].length - 1].end}];
						} else {
							res[n] = [];
						}
					}

					var bContinue = false;
					for(var m = 0; m < res[n].length; m++) {
						if(!continueRange(n, m)) {
							bContinue = true;
						}
					}

					//если не расширен данный(предыдущий) уровень или не добавлен новый элемент, тогда в него добавляем строки текущего
					if(!bContinue && !bAdd) {
						res[n].push({start: res[outLineLevel][res[outLineLevel].length - 1].start, end: res[outLineLevel][res[outLineLevel].length - 1].end});
					}
				}
			}
		};


		var _allProps = bCol ? this.model.oAllCol : null/*this.model.oSheetFormatPr.oAllRow*/;
		var allOutLineLevel = _allProps ? _allProps.getOutlineLevel() : 0;
		if(!allOutLineLevel) {
			//allOutLineLevel = bCol ? this.model.oSheetFormatPr.nOutlineLevelCol : null/*this.model.oSheetFormatPr.nOutlineLevelRow*/;
		}

		if(allOutLineLevel) {
			if(!res) {
				res = [];
			}
			if(!res[allOutLineLevel]) {
				res[allOutLineLevel] = [];
			}
			res[allOutLineLevel].push({start: 0, end: bCol ? gc_nMaxCol0 : gc_nMaxRow0});
		}

		if(bCol) {
			this.model.getRange3(0, start, 0, end)._foreachColNoEmpty(fProcess);
		} else {
			this.model.getRange3(start, 0, end, 0)._foreachRowNoEmpty(fProcess);
		}

		if(!bUpdateOnlyRange) {
			while(up) {
				start--;
				if(start < 0) {
					break;
				}
				bCol ? fProcess(this.model._getColNoEmptyWithAll(start)) : this.model._getRowNoEmptyWithAll(start, fProcess);
			}

			var maxCount = bCol ? this.model.getColsCount() : this.model.getRowsCount();
			var cMaxCount = bCol ? gc_nMaxCol0 : gc_nMaxRow0;
			while(down) {
				end++;
				if(end > maxCount || end > cMaxCount) {
					break;
				}
				bCol ? fProcess(this.model._getColNoEmptyWithAll(start)) : this.model._getRowNoEmptyWithAll(start, fProcess);
			}
		}

		//TODO возможно стоит вначале пройтись по старому groupArr и проставить всем столбцам/строкам false - могут быть проблемы при удалении всех групп и тд
		//val.setCollapsed(false);


		//вычисляем опцию collapsed уже после основных вычислений
		//связано с тем, что она проставляется в строке/столбце, следующей за последней в группе
		//если последний столбец/строка скрыты, то в следующей ячейке необходимо проставить collapsed = true
		//не записываю в историю, а высчитываю каждый раз здесь в связи с тем
		// что при удалении столбца/строки с данным свойством, оно переходит следующему столбцу/строке, те столбцу/строке
		//следующему за последней скрытой в группе
		//TODO рассмотреть: запись свойства collapsed только на сохранение

		var groupArr, index, i, j;
		if(res) {
			groupArr = bCol ? this.arrColGroups : this.arrRowGroups;
			groupArr = groupArr ? groupArr.groupArr : null;
			if(groupArr) {
				for(i = 0; i < groupArr.length; i++) {
					if (groupArr[i]) {
						for (j = 0; j < groupArr[i].length; j++) {
							index = groupArr[i][j].end;
						}
					}
				}
			}
		}

		groupArr = res;
		if(!groupArr) {
			groupArr = bCol ? this.arrColGroups : this.arrRowGroups;
			groupArr = groupArr ? groupArr.groupArr : null;
		}

		return {groupArr: res/*, levelMap: levelMap*/};
	};

	WorksheetView.prototype._drawGroupData = function ( drawingCtx, range, leftFieldInPx, topFieldInPx, bCol /*width, height*/  ) {
		var t = this;
		if ( !range ) {
			range = this.visibleRange;
		}

		this._drawGroupDataMenu(drawingCtx, bCol);

		var ctx = drawingCtx || this.drawingCtx;
		var offsetX = (undefined !== leftFieldInPx) ? leftFieldInPx : this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
		var offsetY = (undefined !== topFieldInPx) ? topFieldInPx : this._getRowTop(this.visibleRange.r1) - this.cellsTop;
		if (!drawingCtx && this.topLeftFrozenCell) {
			if (undefined === leftFieldInPx) {
				var cFrozen = this.topLeftFrozenCell.getCol0();
				offsetX -= this._getColLeft(cFrozen) - this._getColLeft(0);
			}
			if (undefined === topFieldInPx) {
				var rFrozen = this.topLeftFrozenCell.getRow0();
				offsetY -= this._getRowTop(rFrozen) - this._getRowTop(0);
			}
		}

		var zoom = this.getZoom();
		if(zoom > 1) {
			zoom = 1;
		}

		var st = this.settings.header.style[kHeaderDefault];
		var x1, y1, x2, y2, arrayLines, groupData;
		var lineWidth = AscCommon.AscBrowser.convertToRetinaValue(2, true);
		var thickLineDiff = AscCommon.AscBrowser.isRetina ? 0.5 : 0;
		var tempButtonMap = [];//чтобы не рисовать точки там где кпопки
		var bFirstLine = true;
		var _buttonSize = this._getGroupButtonSize();
		var buttonSize = AscCommon.AscBrowser.convertToRetinaValue(_buttonSize, true);
		var padding = AscCommon.AscBrowser.convertToRetinaValue(1, true);
		var buttons = [];
		var endPosArr = {};
		var i, j, l, index, diff, startPos, endPos, paddingTop, pointLevel;

		if(bCol) {
			y1 = 0;
			x1 = this._getColLeft(range.c1) - offsetX;
			x2 = this._getColLeft(range.c2 + 1) - offsetX;
			y2 = this.groupHeight;

			ctx.setFillStyle(st.background).fillRect(x1, y1, x2 - x1, y2 - y1);
			ctx.setStrokeStyle(this.settings.cells.defaultState.border).setLineWidth(1).beginPath();
			ctx.lineHorPrevPx(x1, y2, x2);
			ctx.stroke();

			groupData = this.arrColGroups ? this.arrColGroups : this.getGroupDataArray(true, range.r1, range.r2);
			if(!groupData || !groupData.groupArr) {
				return;
			}
			arrayLines = groupData.groupArr;
			//rowLevelMap = groupData.levelMap;

			ctx.setStrokeStyle(new CColor(0, 0, 0)).setLineWidth(lineWidth).beginPath();

			var _summaryRight = this.model.sheetPr ? this.model.sheetPr.SummaryRight : true;
			var minCol;
			var maxCol;
			var startX, endX, widthNextRow, collasedEndRow;
			for(i = 0; i < arrayLines.length; i++) {
				if(arrayLines[i]) {
					index = bFirstLine ? 1 : i;
					var posY = padding * 2 + buttonSize / 2 - padding + (index - 1) * buttonSize;

					for(j = 0; j < arrayLines[i].length; j++) {

						if(_summaryRight) {
							if(endPosArr[arrayLines[i][j].end]) {
								continue;
							}
							endPosArr[arrayLines[i][j].end] = 1;

							startX = Math.max(arrayLines[i][j].start, range.c1);
							endX = Math.min(arrayLines[i][j].end + 1, range.c2 + 1);
							minCol = (minCol === undefined || minCol > startX) ? startX : minCol;
							maxCol = (maxCol === undefined || maxCol < endX) ? endX : maxCol;

							diff = startX === arrayLines[i][j].start ? AscCommon.AscBrowser.convertToRetinaValue(3, true) : 0;
							startPos = this._getColLeft(startX) + diff - offsetX;
							endPos = this._getColLeft(endX) - offsetX;
							widthNextRow = /*this.getColWidth(endX)*/this._getColLeft(endX + 1) - this._getColLeft(endX);
							paddingTop = (widthNextRow - buttonSize) / 2;
							if(paddingTop < 0) {
								paddingTop = 0;
							}

							//button
							if(endX === arrayLines[i][j].end + 1) {
								//TODO ms обрезает кнопки сверху/снизу
								if(widthNextRow && endX >= startX) {
									if(!tempButtonMap[i]) {
										tempButtonMap[i] = [];
									}
									tempButtonMap[i][endX] = 1;
									buttons.push({r: endX, level: i});
								}
							}

							if(startPos > endPos) {
								continue;
							}

							collasedEndRow = this._getGroupCollapsed(arrayLines[i][j].end + 1, bCol);
							//var collasedEndRow = rowLevelMap[arrayLines[i][j].end + 1] && rowLevelMap[arrayLines[i][j].end + 1].collapsed
							if(!collasedEndRow) {
								ctx.lineHorPrevPx(startPos, posY, endPos + paddingTop);
							}

							// _
							//|
							if(!collasedEndRow && startX === arrayLines[i][j].start) {
								ctx.lineVerPrevPx(startPos, posY - 2 * padding + thickLineDiff, posY + 4 * padding);
							}
						} else {

							if(endPosArr[arrayLines[i][j].start]) {
								continue;
							}
							endPosArr[arrayLines[i][j].start] = 1;

							startX = Math.max(arrayLines[i][j].start - 1, range.c1);
							endX = Math.min(arrayLines[i][j].end + 1, range.c2 + 1);
							minCol = (minCol === undefined || minCol > startX) ? startX : minCol;
							maxCol = (maxCol === undefined || maxCol < endX) ? endX : maxCol;

							diff = /*startX === arrayLines[i][j].start ? AscCommon.AscBrowser.convertToRetinaValue(3, true) :*/ 0;
							startPos = this._getColLeft(startX) + diff - offsetX;
							endPos = this._getColLeft(endX) - offsetX;
							widthNextRow = this._getColLeft(startX + 1) - this._getColLeft(startX);
							paddingTop = startX === arrayLines[i][j].start - 1 ? (widthNextRow + buttonSize) / 2 : 0;
							if(paddingTop < 0) {
								paddingTop = 0;
							}

							//button
							if(startX === arrayLines[i][j].start - 1) {
								//TODO ms обрезает кнопки сверху/снизу
								if(widthNextRow && endX >= startX) {
									if(!tempButtonMap[i]) {
										tempButtonMap[i] = [];
									}
									tempButtonMap[i][startX] = 1;
									buttons.push({r: startX, level: i});
								}
							}

							if(startPos > endPos) {
								continue;
							}

							collasedEndRow = this._getGroupCollapsed(arrayLines[i][j].start - 1, bCol);

							if( endPos > startPos + paddingTop - 1*padding) {
								if(!collasedEndRow && endPos > startPos + paddingTop - 1*padding) {
									//ctx.lineVerPrevPx(posX, startPos - paddingTop - 1*padding, endPos);
									ctx.lineHorPrevPx(startPos + paddingTop - 1*padding, posY, endPos);
								}

								// _
								//  |
								if(!collasedEndRow && endX === arrayLines[i][j].end + 1 && endPos > startPos + paddingTop - 1*padding) {
									//ctx.lineHorPrevPx(posX - lineWidth + thickLineDiff, endPos, posX + 4*padding);
									ctx.lineVerPrevPx(endPos, posY - 2 * padding + thickLineDiff, posY + 4 * padding);
								}
							}
						}
					}
					bFirstLine = false;
				}
			}

			//TODO не рисовать точки на местах линий и кнопок
			for(l = minCol; l < maxCol; l++) {
				pointLevel = this._getGroupLevel(l, bCol);

				/*if(!rowLevelMap[l]) {
					continue;
				}

				pointLevel = rowLevelMap[l].level;*/
				var colWidth = /*this.getColWidth(endX)*/this._getColLeft(l + 1) - this._getColLeft(l);
				if(pointLevel === 0 || (tempButtonMap[pointLevel + 1] && tempButtonMap[pointLevel + 1][l]) || colWidth === 0) {
					continue;
				}
				ctx.lineVerPrevPx(this._getColLeft(l) - offsetX + colWidth / 2, 7 * padding + pointLevel * buttonSize, 7 * padding + (pointLevel) * buttonSize + 2 * padding);
				//ctx.lineHorPrevPx(7 + pointLevel * buttonSize, this._getRowTop(l) - offsetY + colWidth / 2, 7 + (pointLevel) * buttonSize + 2);
			}

			ctx.stroke();
			ctx.closePath();

		} else {
			x1 = 0;
			y1 = this._getRowTop(range.r1) - offsetY;
			x2 = this.groupWidth;
			y2 = this._getRowTop(range.r2 + 1) - offsetY;

			ctx.setFillStyle(st.background).fillRect(x1, y1, x2 - x1, y2 - y1);
			ctx.setStrokeStyle(this.settings.cells.defaultState.border).setLineWidth(1).beginPath();
			ctx.lineVerPrevPx(x2, y1, y2);
			ctx.stroke();

			groupData = this.arrRowGroups ? this.arrRowGroups : this.getGroupDataArray(null, range.r1, range.r2);
			if(!groupData || !groupData.groupArr) {
				return;
			}
			arrayLines = groupData.groupArr;
			//rowLevelMap = groupData.levelMap;

			ctx.setStrokeStyle(new CColor(0, 0, 0)).setLineWidth(lineWidth).beginPath();

			var checkPrevHideLevel = function(level, row) {
				var res = false;
				for(var n = level - 1; n >= 0; n--) {
					if(arrayLines[n]) {
						for(var m = 0; m < arrayLines[n].length; m++) {
							if (row >= arrayLines[n][m].start && row <= arrayLines[n][m].end && t._getGroupCollapsed(arrayLines[n][m].start - 1)) {
								res = true;
								break;
							}
						}
					}
				}
				return res;
			};

			var _summaryBelow = this.model.sheetPr ? this.model.sheetPr.SummaryBelow : true;
			var minRow;
			var maxRow;
			var startY, endY, heightNextRow;
			for(i = 0; i < arrayLines.length; i++) {
				if(arrayLines[i]) {
					index = bFirstLine ? 1 : i;
					var posX = padding * 2 + buttonSize / 2 - padding + (index - 1) * buttonSize;

					for(j = 0; j < arrayLines[i].length; j++) {

						if(_summaryBelow) {
							if(endPosArr[arrayLines[i][j].end]) {
								continue;
							}
							endPosArr[arrayLines[i][j].end] = 1;

							startY = Math.max(arrayLines[i][j].start, range.r1);
							endY = Math.min(arrayLines[i][j].end + 1, range.r2 + 1);
							minRow = (minRow === undefined || minRow > startY) ? startY : minRow;
							maxRow = (maxRow === undefined || maxRow < endY) ? endY : maxRow;

							diff = startY === arrayLines[i][j].start ? 3 * padding : 0;
							startPos = this._getRowTop(startY) + diff - offsetY;
							endPos = this._getRowTop(endY) - offsetY;
							heightNextRow = this._getRowHeight(endY);
							paddingTop = (heightNextRow - buttonSize) / 2;
							if(paddingTop < 0) {
								paddingTop = 0;
							}

							//button
							if(endY === arrayLines[i][j].end + 1) {
								//TODO ms обрезает кнопки сверху/снизу
								if(heightNextRow && endY >= startY) {
									if(!tempButtonMap[i]) {
										tempButtonMap[i] = [];
									}
									tempButtonMap[i][endY] = 1;
									buttons.push({r: endY, level: i});
								}
							}

							if(startPos > endPos) {
								continue;
							}

							var collasedEndCol = this._getGroupCollapsed(arrayLines[i][j].end + 1);
							//var collasedEndCol = rowLevelMap[arrayLines[i][j].end + 1] && rowLevelMap[arrayLines[i][j].end + 1].collapsed;
							if(!collasedEndCol) {
								ctx.lineVerPrevPx(posX, startPos, endPos + paddingTop);
							}

							// _
							//|
							if(!collasedEndCol && startY === arrayLines[i][j].start) {
								ctx.lineHorPrevPx(posX - lineWidth + thickLineDiff, startPos, posX + 4*padding);
							}
						} else {
							if(endPosArr[arrayLines[i][j].start]) {
								continue;
							}
							endPosArr[arrayLines[i][j].start] = 1;

							startY = Math.max(arrayLines[i][j].start - 1, range.r1);
							endY = Math.min(arrayLines[i][j].end + 1, range.r2 + 1);
							minRow = (minRow === undefined || minRow > startY) ? startY : minRow;
							maxRow = (maxRow === undefined || maxRow < endY) ? endY : maxRow;

							diff = /*startY === arrayLines[i][j].start - 1 ? 3 * padding :*/ 0;
							startPos = (startY === arrayLines[i][j].start - 1 ? this._getRowTop(startY + 1) : this._getRowTop(startY)) + diff - offsetY;
							endPos = this._getRowTop(endY) - offsetY;
							heightNextRow = this._getRowHeight(startY);
							paddingTop = startY === arrayLines[i][j].start - 1 ? (heightNextRow - buttonSize) / 2 : 0;
							if(paddingTop < 0) {
								paddingTop = 0;
							}

							//button
							if(startY === arrayLines[i][j].start - 1) {
								//TODO ms обрезает кнопки сверху/снизу
								if(heightNextRow && endY >= startY) {
									if(!tempButtonMap[i]) {
										tempButtonMap[i] = [];
									}
									tempButtonMap[i][startY] = 1;
									buttons.push({r: startY, level: i});
								}
							}

							if(startPos > endPos) {
								continue;
							}

							if(endPos > startPos - paddingTop - 1*padding) {
								var collapsedStartRow = this._getGroupCollapsed(arrayLines[i][j].start - 1);
								var hiddenStartRow = this._getHidden(arrayLines[i][j].start);
								if(!collapsedStartRow && !hiddenStartRow) {
									ctx.lineVerPrevPx(posX, startPos - paddingTop - 1*padding, endPos);
								}

								// |_
								if(!collapsedStartRow && !hiddenStartRow && endY === arrayLines[i][j].end + 1 && !checkPrevHideLevel(i, arrayLines[i][j].start)) {
									ctx.lineHorPrevPx(posX - lineWidth + thickLineDiff, endPos, posX + 4*padding);
								}
							}
						}
					}
					bFirstLine = false;
				}
			}

			//TODO не рисовать точки на местах линий и кнопок
			for(l = minRow; l < maxRow; l++) {
				pointLevel = this._getGroupLevel(l, bCol);

				/*if(!rowLevelMap[l]) {
					continue;
				}

				pointLevel = rowLevelMap[l].level;*/
				var rowHeight = this._getRowHeight(l);
				if(pointLevel === 0 || (tempButtonMap[pointLevel + 1] && tempButtonMap[pointLevel + 1][l]) || rowHeight === 0) {
					continue;
				}
				ctx.lineHorPrevPx(padding * 7 + pointLevel * buttonSize, this._getRowTop(l) - offsetY + rowHeight / 2, padding * 7 + (pointLevel) * buttonSize + padding * 2);
			}

			ctx.stroke();
			ctx.closePath();
		}


		this._drawGroupDataButtons(drawingCtx, buttons, leftFieldInPx, topFieldInPx, bCol);
	};

	WorksheetView.prototype._drawGroupDataButtons = function(drawingCtx, buttons, leftFieldInPx, topFieldInPx, bCol) {
		if(!buttons) {
			return;
		}

		var groupData = bCol ? this.arrColGroups : this.arrRowGroups;
		if(!groupData || !groupData.groupArr) {
			return;
		}

		//var rowLevelMap = groupData.levelMap;

		var ctx = drawingCtx || this.drawingCtx;

		var offsetX = 0, offsetY = 0;
		if(bCol) {
			offsetX = (undefined !== leftFieldInPx) ? leftFieldInPx : this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
			if (!drawingCtx && this.topLeftFrozenCell) {
				if (undefined === leftFieldInPx) {
					var cFrozen = this.topLeftFrozenCell.getCol0();
					offsetX -= this._getColLeft(cFrozen) - this._getColLeft(0);
				}
			}
		} else {
			offsetY = (undefined !== topFieldInPx) ? topFieldInPx : this._getRowTop(this.visibleRange.r1) - this.cellsTop;
			if (!drawingCtx && this.topLeftFrozenCell) {
				if (undefined === topFieldInPx) {
					var rFrozen = this.topLeftFrozenCell.getRow0();
					offsetY -= this._getRowTop(rFrozen) - this._getRowTop(0);
				}
			}
		}

		//buttons
		//проходимся 2 раза, поскольку разная толщина у рамки и у -/+

		var i, val, level, diff, pos, x, y, w, h, active;
		var borderSize = AscCommon.AscBrowser.convertToRetinaValue(1, true);
		ctx.setStrokeStyle(new CColor(0, 0, 0)).setLineWidth( borderSize ).beginPath();
		for(i = 0; i < buttons.length; i++) {
			val = buttons[i].r;
			level = buttons[i].level;

			pos = this._getGroupDataButtonPos(val, level, bCol);

			x = pos.x;
			y = pos.y;
			w = pos.w;
			h = pos.h;

			x = x - offsetX;
			y = y - offsetY;

			ctx.AddClipRect(bCol ? pos.pos - borderSize - offsetX : x - borderSize, bCol ? y - borderSize : pos.pos - borderSize - offsetY, bCol ? pos.size + borderSize : w + borderSize, bCol ? h + borderSize : pos.size + borderSize);
			ctx.beginPath();

			if(buttons[i].clean) {
				ctx.clearRect(x, y, w, h);
			}

			ctx.lineHorPrevPx(x, y, x + w);
			ctx.lineHorPrevPx(x + w, y + h, x);
			ctx.lineVerPrevPx(x + w, y, y + h);
			ctx.lineVerPrevPx(x, y + h, y - borderSize);

			ctx.stroke();
			ctx.RemoveClipRect();
		}
		ctx.closePath();

		ctx.setStrokeStyle(new CColor(0, 0, 0)).setLineWidth( AscCommon.AscBrowser.convertToRetinaValue(2, true)).beginPath();

		var sizeLine = AscCommon.AscBrowser.convertToRetinaValue(8, true);
		//var paddingLine = AscCommon.AscBrowser.convertToRetinaValue(3, true);
		diff = AscCommon.AscBrowser.convertToRetinaValue(1, true);
		for(i = 0; i < buttons.length; i++) {
			val = buttons[i].r;
			level = buttons[i].level;
			active = buttons[i].active;

			diff = active ? 1 : 0;
			pos = this._getGroupDataButtonPos(val, level, bCol);

			x = pos.x;
			y = pos.y;
			w = pos.w;
			h = pos.h;

			x = x - offsetX;
			y = y - offsetY;

			ctx.AddClipRect(bCol ? pos.pos - offsetX : x, bCol ? y : pos.pos - offsetY, bCol ? pos.size : w, bCol ? h : pos.size);
			ctx.beginPath();

			var paddingLine = Math.floor((w - sizeLine) / 2);

			if(w > sizeLine + 2) {
				if(this._getGroupCollapsed(val, bCol)/*rowLevelMap[val] && rowLevelMap[val].collapsed*/) {
					ctx.lineHorPrevPx(x + paddingLine, y + h / 2 + 1, x + sizeLine + paddingLine);
					ctx.lineVerPrevPx(x + paddingLine + sizeLine / 2 + 1, y + h / 2 - sizeLine / 2,  y + h / 2 + sizeLine / 2);
				} else {
					ctx.lineHorPrevPx(x + paddingLine, y + h / 2 + diff, x + sizeLine + paddingLine);
				}
			}

			ctx.stroke();
			ctx.RemoveClipRect();
		}

		ctx.closePath();
	};

	WorksheetView.prototype._getGroupDataButtonPos = function(val, level, bCol) {
		//возвращает позицию без учета сдвига offsetY

		var zoom = this.getZoom();
		if(zoom > 1) {
			zoom = 1;
		}
		var _buttonSize = this._getGroupButtonSize();
		var buttonSize = AscCommon.AscBrowser.convertToRetinaValue(_buttonSize, true);
		var padding = AscCommon.AscBrowser.convertToRetinaValue(1, true);

		if(bCol) {
			var endPosX = this._getColLeft(val);
			var colW = this._getColLeft(val + 1) - this._getColLeft(val);

			var posY = padding * 2 + buttonSize / 2 - padding + (level - 1) * buttonSize;
			x = endPosX + colW/2 - buttonSize / 2;
			y = posY - Math.floor(6 * zoom) * padding;
		} else {
			var endPosY = this._getRowTop(val);
			var rowH = this._getRowHeight(val);
			var posX = padding * 2 + buttonSize / 2 - padding + (level - 1) * buttonSize;
			var x = posX - Math.floor(6 * zoom) * padding;
			var y = endPosY + rowH/2 - buttonSize / 2;
		}
		var w = buttonSize - 1;
		var h = buttonSize - 1;

		return {x: x, y: y, w: w, h: h, size: bCol ? colW : rowH, pos: bCol ? endPosX : endPosY};
	};

	WorksheetView.prototype._getGroupLevel = function(index, bCol) {
		var res;
		var fProcess = function(val) {
			res = val ? val.getOutlineLevel() : 0;
		};
		bCol ? fProcess(this.model._getColNoEmptyWithAll(index)) : this.model._getRowNoEmptyWithAll(index, fProcess);

		return res;
	};

	WorksheetView.prototype._getGroupCollapsed = function(index, bCol) {
		var res;
		var getCollapsed = function(val) {
			res =  val ? val.getCollapsed() : false;
		};
		bCol ? getCollapsed(this.model._getColNoEmptyWithAll(index)) : this.model._getRowNoEmptyWithAll(index, getCollapsed);
		return res;
	};

	WorksheetView.prototype._getHidden = function(index, bCol) {
		var res;
		var callback = function(val) {
			res =  val ? val.getHidden() : false;
		};
		bCol ? callback(this.model._getColNoEmptyWithAll(index)) : this.model._getRowNoEmptyWithAll(index, callback);
		return res;
	};

	//GROUP MENU BUTTONS
	WorksheetView.prototype._drawGroupDataMenu = function ( drawingCtx, bCol ) {
		var ctx = drawingCtx || this.drawingCtx;

		var groupData;
		if(bCol) {
			groupData = this.arrColGroups ? this.arrColGroups : null;
		} else {
			groupData = this.arrRowGroups ? this.arrRowGroups : null;
		}

		if(!groupData || !groupData.groupArr) {
			return;
		}

		var st = this.settings.header.style[kHeaderDefault];

		var x1, y1, x2, y2;
		if(bCol) {
			x1 = this.headersLeft;
			y1 = 0;
			x2 = this.headersLeft + this.headersWidth;
			y2 = this.groupHeight;
		} else {
			x1 = 0;
			y1 = this.headersTop;
			x2 = this.groupWidth;
			y2 = this.headersTop + this.headersHeight;
		}

		ctx.setFillStyle(st.background).fillRect(x1, y1, x2 - x1, y2 - y1);
		//угол до кнопок
		ctx.setFillStyle(st.background).fillRect(0, 0, this.headersLeft, this.headersTop);

		ctx.setStrokeStyle(this.settings.cells.defaultState.border).setLineWidth(1).beginPath();
		ctx.lineHorPrevPx(x1, y2, x2);
		ctx.lineVerPrevPx(x2, y1, y2);
		//угол до кнопок
		ctx.lineHorPrevPx(0, this.headersTop, this.headersLeft);
		ctx.lineVerPrevPx(this.headersLeft, 0, this.headersTop);
		ctx.stroke();
		ctx.closePath();

		if(false === this.model.getSheetView().asc_getShowRowColHeaders()) {
			return;
		}

		if(groupData.groupArr.length) {
			for(var i = 0; i < groupData.groupArr.length; i++) {
				this._drawGroupDataMenuButton(ctx, i, null, null, bCol);
			}
			ctx.stroke();
			ctx.closePath();
		}
	};

	WorksheetView.prototype._drawGroupDataMenuButton = function ( drawingCtx, level, bActive, bClean, bCol ) {
		var ctx = drawingCtx || this.drawingCtx;
		var st = this.settings.header.style[kHeaderDefault];

		var props = this.getGroupDataMenuButPos(level, bCol);
		var x = props.x;
		var y = props.y;
		var w = props.w;
		var h = props.h;

		if(bClean) {
			this.drawingCtx.clearRect(x, y, w, h);
		}

		ctx.beginPath();

		ctx.setStrokeStyle(this.settings.cells.defaultState.border).setLineWidth( AscCommon.AscBrowser.convertToRetinaValue(1, true)).beginPath();

		ctx.lineHorPrevPx(x, y, x + w);
		ctx.lineVerPrevPx(x + w, y, y + h);
		ctx.lineHorPrevPx(x + w, y + h, x);
		ctx.lineVerPrevPx(x, y + h, y - AscCommon.AscBrowser.convertToRetinaValue(1, true));

		var text = level + 1 + "";
		var sr = this.stringRender;
		var zoom = 1/*this.getZoom()*/;

		var factor = asc.round(zoom * 1000) / 1000;
		var dc = sr.drawingCtx;
		var oldPpiX = dc.ppiX;
		var oldPpiY = dc.ppiY;
		var oldScaleFactor = dc.scaleFactor;
		dc.ppiX = asc.round(dc.ppiX / dc.scaleFactor * factor * 1000) / 1000;
		dc.ppiY = asc.round(dc.ppiY / dc.scaleFactor * factor * 1000) / 1000;

		/*if (AscCommon.AscBrowser.isRetina) {
			dc.ppiX = AscCommon.AscBrowser.convertToRetinaValue(dc.ppiX, true);
			dc.ppiY = AscCommon.AscBrowser.convertToRetinaValue(dc.ppiY, true);
		}*/

		dc.scaleFactor = factor;

		var tm = this._roundTextMetrics(sr.measureString(text));
		dc.ppiX = oldPpiX;
		dc.ppiY = oldPpiY;
		dc.scaleFactor = oldScaleFactor;

		if(w > tm.width + 3) {
			var diff = bActive ? 1 : 0;
			ctx.setFillStyle(st.color).fillText(text, x + w / 2 - tm.width / 2 + diff, y + Asc.round(tm.baseline) + h / 2 -  tm.height / 2 + diff, undefined, sr.charWidths);
		}

		ctx.stroke();
		ctx.closePath();
	};

	WorksheetView.prototype.getGroupDataMenuButPos = function (level, bCol) {
		//var buttonSize =  AscCommon.AscBrowser.convertToRetinaValue(Math.min(16, bCol ? this.headersWidth : this.headersHeight), true) - 1 * padding;
		var zoom = this.getZoom();
		if(zoom > 1) {
			zoom = 1;
		}
		var _buttonSize = this._getGroupButtonSize();
		var padding =  AscCommon.AscBrowser.convertToRetinaValue(1, true);
		var buttonSize =  AscCommon.AscBrowser.convertToRetinaValue(_buttonSize, true) - padding;

		//TODO учитывать будущий отступ для группировке колонок!
		var x, y;
		if(bCol) {
			x = this.headersLeft + this.headersWidth/2 - buttonSize/2;
			y = padding * 2 + level * (buttonSize + padding);
		} else {
			x = padding * 2 + level * (buttonSize + padding);
			y = this.headersTop + this.headersHeight/2 - buttonSize/2;
		}

		return {x: x, y: y, w: buttonSize, h: buttonSize};
	};

	WorksheetView.prototype.getGroupCommonLevel = function (bCol) {
		var res = 0;
		var func = function(elem) {
			var outLineLevel = elem.getOutlineLevel();
			if(outLineLevel && outLineLevel > res) {
				res = outLineLevel;
			}
		};

		var _allProps = bCol ? this.model.getAllCol() :  this.model.getAllRow();
		var allOutLineLevel = _allProps ? _allProps.getOutlineLevel() : 0;
		if(bCol) {
			this.model.getRange3(0, 0, 0, gc_nMaxCol0)._foreachColNoEmpty(func);
		} else {
			this.model.getRange3(0, 0, gc_nMaxRow0, 0)._foreachRowNoEmpty(func);
		}

		return allOutLineLevel > res ? allOutLineLevel : res;
	};

	WorksheetView.prototype.getGroupCommonWidth = function (level, bCol) {
		//width group menu - padding left - 2px, padding right - 2px, 1 section - 16px
		var zoom = this.getZoom();
		if(zoom > 1) {
			zoom = 1;
		}

		var res = 0;
		if(level > 0) {
			var padding = 2;
			/*var headersSize;
			//так как headersHeight и headersWidth рассчитывается после вызова данной функции, рассчитываем ихъ здесь самостоятельно
			if(!bCol) {
				headersSize = (false === this.model.getSheetView().asc_getShowRowColHeaders()) ? 0 : Asc.round(this.headersHeightByFont * this.getZoom());
			} else {
				if (false === this.model.getSheetView().asc_getShowRowColHeaders()) {
					headersSize = 0;
				} else {
					// Ширина колонки заголовков считается  - max число знаков в строке - перевести в символы - перевести в пикселы
					var numDigit = Math.max(AscCommonExcel.calcDecades(this.visibleRange.r2 + 1), 3);
					var nCharCount = this.model.charCountToModelColWidth(numDigit);
					headersSize = Asc.round(this.model.modelColWidthToColWidth(nCharCount) * this.getZoom());
				}
			}*/

			var _buttonSize = this._getGroupButtonSize();
			res = padding * 2 + _buttonSize + _buttonSize * level;
		}
		return AscCommon.AscBrowser.convertToRetinaValue(res, true);
	};

	WorksheetView.prototype._getGroupButtonSize = function () {
		var zoom = this.getZoom();
		if(zoom > 1) {
			zoom = 1;
		}
		//var headersWidth = this.headersWidth;
		//if(!headersWidth) {
			var numDigit = Math.max(AscCommonExcel.calcDecades(this.visibleRange.r2 + 1), 3);
			var nCharCount = this.model.charCountToModelColWidth(numDigit);
			var headersWidth = Asc.round(this.model.modelColWidthToColWidth(nCharCount) * zoom);
		//}
		//var headersHeight = this.headersHeight;
		//if(!headersHeight) {
			var headersHeight = Asc.round(this.headersHeightByFont * zoom);
		//}

		return Math.min(Math.floor(16 * zoom), headersWidth - 1, headersHeight - 1);
	};

	WorksheetView.prototype.groupRowClick = function (x, y, target, type) {
		if(this.collaborativeEditing.getGlobalLock()) {
			return;
		}
		var currentSheetId = this.model.getId();
		var nLockAllType = this.collaborativeEditing.isLockAllOther(currentSheetId);
		if (Asc.c_oAscMouseMoveLockedObjectType.Sheet === nLockAllType || Asc.c_oAscMouseMoveLockedObjectType.TableProperties === nLockAllType) {
			return;
		}

		var t = this;
		var bCol = c_oTargetType.GroupCol === target.target;

		var offsetX = /*(undefined !== leftFieldInPx) ? leftFieldInPx : */this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
		if (/*!drawingCtx &&*/ this.topLeftFrozenCell) {
			//if (undefined === leftFieldInPx) {
				var cFrozen = this.topLeftFrozenCell.getCol0();
				offsetX -= this._getColLeft(cFrozen) - this._getColLeft(0);
			//}
		}
		var offsetY = /*(undefined !== topFieldInPx) ? topFieldInPx : */this._getRowTop(this.visibleRange.r1) - this.cellsTop;
		if (/*!drawingCtx &&*/ this.topLeftFrozenCell) {
			//if (undefined === topFieldInPx) {
				var rFrozen = this.topLeftFrozenCell.getRow0();
				offsetY -= this._getRowTop(rFrozen) - this._getRowTop(0);
			//}
		}

		if("mousemove" === type) {
			if(t.clickedGroupButton) {
				var props;
				bCol = t.clickedGroupButton.bCol;
				if(bCol) {
					offsetY = 0;
				} else {
					offsetX = 0;
				}

				if(undefined !== t.clickedGroupButton.r) {
					props = t._getGroupDataButtonPos(t.clickedGroupButton.r, t.clickedGroupButton.level, bCol);
					if(props) {
						if (x >= props.x - offsetX && x <= props.x + props.w - offsetX && y >= props.y - offsetY && y <= props.y - offsetY + props.h) {
							return true;
						} else {
							t._drawGroupDataButtons(null, [{r: t.clickedGroupButton.r, level: t.clickedGroupButton.level, active: false, clean: true}], undefined, undefined, bCol);
							t.clickedGroupButton = null;
							return false;
						}
					}
				} else {
					props = this.getGroupDataMenuButPos(t.clickedGroupButton.level, bCol);
					if(x >= props.x && y >= props.y && x <= props.x + props.w && y <= props.y + props.h) {
						return true;
					} else {
						this._drawGroupDataMenuButton(null, t.clickedGroupButton.level, false, true, bCol);
						t.clickedGroupButton = null;
						return false;
					}
				}
			}
		}

		if((target.row < 0 && !bCol) || (target.col < 0 && bCol)) {
			//проверяем, возможно мы попали в одну из кнопок управления уровнями
			return this._groupRowMenuClick(x, y, target, type, bCol);
		}

		if(bCol) {
			offsetY = 0;
		} else {
			offsetX = 0;
		}

		var _summaryRight = this.model.sheetPr ? this.model.sheetPr.SummaryRight : true;
		var _summaryBelow = this.model.sheetPr ? this.model.sheetPr.SummaryBelow : true;
		var mouseDownClick;
		var doClick = function() {
			var arrayLines = bCol ? t.arrColGroups.groupArr : t.arrRowGroups.groupArr;
			/*var levelMap = bCol ? t.arrColGroups.levelMap : t.arrRowGroups.levelMap;*/

			var endPosArr = {};
			for(var i = 0; i < arrayLines.length; i++) {
				var props, collapsed;
				if(arrayLines[i]) {
					for(var j = 0; j < arrayLines[i].length; j++) {
						if((!bCol && !_summaryBelow) || (bCol && !_summaryRight)) {
							if(endPosArr[arrayLines[i][j].start]) {
								continue;
							}
							endPosArr[arrayLines[i][j].start] = 1;

							if((arrayLines[i][j].start - 1 === target.row && !bCol) || (arrayLines[i][j].start - 1 === target.col && bCol)) {
								props = t._getGroupDataButtonPos(arrayLines[i][j].start - 1, i, bCol);
								collapsed = t._getGroupCollapsed(arrayLines[i][j].start - 1, bCol);/*levelMap[arrayLines[i][j].end + 1] && levelMap[arrayLines[i][j].end + 1].collapsed*/
								if(props) {
									if(x >= props.x - offsetX && x <= props.x + props.w - offsetX && y >= props.y - offsetY && y <= props.y - offsetY + props.h) {
										if("mouseup" === type) {
											t._tryChangeGroup(arrayLines[i][j], collapsed, i, bCol);
											t.clickedGroupButton = null;
										} else if("mousedown" === type) {
											//перерисовываем кнопку в нажатом состоянии
											t._drawGroupDataButtons(null, [{r: arrayLines[i][j].start - 1, level: i, active: true, clean: true}], undefined, undefined, bCol);
											t.clickedGroupButton = {level: i, r: arrayLines[i][j].start - 1, bCol: bCol};
											mouseDownClick = true;
										}
										return;
									}
								}
							}
						} else {
							if(endPosArr[arrayLines[i][j].end]) {
								continue;
							}
							endPosArr[arrayLines[i][j].end] = 1;

							if((arrayLines[i][j].end + 1 === target.row && !bCol) || (arrayLines[i][j].end + 1 === target.col && bCol)) {
								props = t._getGroupDataButtonPos(arrayLines[i][j].end + 1, i, bCol);
								collapsed = t._getGroupCollapsed(arrayLines[i][j].end + 1, bCol);/*levelMap[arrayLines[i][j].end + 1] && levelMap[arrayLines[i][j].end + 1].collapsed*/
								if(props) {
									if(x >= props.x - offsetX && x <= props.x + props.w - offsetX && y >= props.y - offsetY && y <= props.y - offsetY + props.h) {
										if("mouseup" === type) {
											t._tryChangeGroup(arrayLines[i][j], collapsed, i, bCol);
											t.clickedGroupButton = null;
										} else if("mousedown" === type) {
											//перерисовываем кнопку в нажатом состоянии
											t._drawGroupDataButtons(null, [{r: arrayLines[i][j].end + 1, level: i, active: true, clean: true}], undefined, undefined, bCol);
											t.clickedGroupButton = {level: i, r: arrayLines[i][j].end + 1, bCol: bCol};
											mouseDownClick = true;
										}
										return;
									}
								}
							}
						}
					}
				}
			}
		};

		var prevOutlineLevel = null;
		var outLineLevel;
		var func = function(val) {
			if(prevOutlineLevel === null) {
				prevOutlineLevel = val.getOutlineLevel();
			} else {
				outLineLevel = val.getOutlineLevel();
			}
		};
		if(bCol) {
			//TODO не учитывается oAllCol
			if(_summaryRight) {
				this.model.getRange3(0, target.col - 1,0, target.col)._foreachColNoEmpty(func);
			} else {
				this.model.getRange3(0, target.col,0, target.col + 1)._foreachColNoEmpty(func);
			}
		} else {
			if(_summaryBelow) {
				this.model.getRange3(target.row - 1, 0, target.row, 0)._foreachRowNoEmpty(func);
			} else {
				this.model.getRange3(target.row, 0, target.row + 1, 0)._foreachRowNoEmpty(func);
			}
		}

		//проверяем предыдущую строку - если там есть outLineLevel, а в следующей outLineLevel c другим индексом, тогда в следующей может быть кнопка управления группой
		if(outLineLevel !== prevOutlineLevel) {
			doClick();
		}
		if(mouseDownClick) {
			return true;
		}
	};

	WorksheetView.prototype._groupRowMenuClick = function (x, y, target, type, bCol) {
		if(this.collaborativeEditing.getGlobalLock()) {
			return;
		}
		var currentSheetId = this.model.getId();
		var nLockAllType = this.collaborativeEditing.isLockAllOther(currentSheetId);
		if (Asc.c_oAscMouseMoveLockedObjectType.Sheet === nLockAllType || Asc.c_oAscMouseMoveLockedObjectType.TableProperties === nLockAllType) {
			return;
		}

		//TODO для группировки колонок - y должен быть больше поля колонок
		var bButtonClick = !bCol && x <= this.cellsLeft && this.groupWidth && x < this.groupWidth && y < this.cellsTop;
		if(!bButtonClick) {
			bButtonClick = bCol && y <= this.cellsTop && this.groupHeight && y < this.groupHeight && x < this.cellsLeft;
		}
		if(bButtonClick) {
			var groupArr;
			if(bCol) {
				groupArr = this.arrColGroups ? this.arrColGroups.groupArr : null;
			} else {
				groupArr = this.arrRowGroups ? this.arrRowGroups.groupArr : null;
			}

			if(!groupArr) {
				return;
			}

			var props;
			for(var i = 0; i <= groupArr.length; i++) {
				props = this.getGroupDataMenuButPos(i, bCol);
				if(x >= props.x && y >= props.y && x <= props.x + props.w && y <= props.y + props.h) {
					if("mouseup" === type) {
						this.hideGroupLevel(i + 1, bCol);
						this.clickedGroupButton = null;
					} else if("mousedown" === type){
						this._drawGroupDataMenuButton(null, i, true, true, bCol);
						this.clickedGroupButton = {level: i, bCol: bCol};
						return true;
					}

					break;
				}
			}
		}
	};

	WorksheetView.prototype._tryChangeGroup = function (pos, collapsed, level, bCol) {
		// Проверка глобального лока
		if (this.collaborativeEditing.getGlobalLock()) {
			return;
		}

		//при закрытии группы всем внутренним строкам проставляется hidden
		//при открытии группы проходимся по всем строкам и открываем только те, которые не закрыты внутренними группами
		//а для тех что закрыты внутренними группами - ещё раз скрыаем их
		var start = pos.start;
		var end = pos.end;

		// Проверка глобального лока
		if (this.collaborativeEditing.getGlobalLock()) {
			return;
		}

		var t = this;
		var functionModelAction = null;
		var onChangeWorksheetCallback = function (isSuccess) {
			if (false === isSuccess) {
				return;
			}

			asc_applyFunction(functionModelAction);

			if(bCol) {
				t._updateAfterChangeGroup(undefined, null, true);
			} else {
				t._updateAfterChangeGroup(null, null, true);
			}
		};


		functionModelAction = function () {
			var _summaryBelow = t.model.sheetPr ? t.model.sheetPr.SummaryBelow : true;
			var _summaryRight = t.model.sheetPr ? t.model.sheetPr.SummaryRight : true;
			var isNeedRecal = !bCol ? t.model.needRecalFormulas(start, end) : null;
			if(isNeedRecal) {
				t.model.workbook.dependencyFormulas.lockRecal();
			}

			History.Create_NewPoint();
			History.StartTransaction();

			var oldExcludeCollapsed = t.model.bExcludeCollapsed;
			t.model.bExcludeCollapsed = true;

			var changeModelFunc = bCol ? t.model.setColHidden :  t.model.setRowHidden;
			var collapsedFunction = bCol ? t.model.setCollapsedCol :  t.model.setCollapsedRow;
			if(!collapsed) {//скрываем
				changeModelFunc.call(t.model, true, start, end);
				if((!_summaryBelow && !bCol) || (!_summaryRight && bCol)) {
					collapsedFunction.call(t.model, !collapsed, start - 1);
				} else {
					collapsedFunction.call(t.model, !collapsed, end + 1);
				}
				//hideFunc(true, start, end);
				//t.model.autoFilters.reDrawFilter(arn);
			} else {
				//открываем все строки, кроме внутренних групп
				//внутренние группы скрываем, если среди них есть раскрытые
				changeModelFunc.call(t.model, false, start, end);
				if((!_summaryBelow && !bCol) || (!_summaryRight && bCol)) {
					collapsedFunction.call(t.model, !collapsed, start - 1);
				} else {
					collapsedFunction.call(t.model, !collapsed, end + 1);
				}

				var groupArr/*, levelMap*/;
				if(bCol) {
					groupArr = t.arrColGroups ? t.arrColGroups.groupArr : null;
					//levelMap = t.arrColGroups ? t.arrColGroups.levelMap : null;
				} else {
					groupArr = t.arrRowGroups ? t.arrRowGroups.groupArr : null;
					//levelMap = t.arrRowGroups ? t.arrRowGroups.levelMap : null;
				}
				if(groupArr) {
					for(var i = level + 1; i <= groupArr.length; i++) {
						if(!groupArr[i]) {
							continue;
						}
						for(var j = 0; j < groupArr[i].length; j++) {
							if((!_summaryBelow && !bCol) || (!_summaryRight && bCol)) {
								if(groupArr[i][j] && groupArr[i][j].start > start && groupArr[i][j].end <= end) {
									if(t._getGroupCollapsed(groupArr[i][j].start - 1, bCol)) {
										changeModelFunc.call(t.model, true, groupArr[i][j].start, groupArr[i][j].end);
									}
								}
							} else {
								if(groupArr[i][j] && groupArr[i][j].start >= start && groupArr[i][j].end < end) {
									if(t._getGroupCollapsed(groupArr[i][j].end + 1, bCol)) {
										changeModelFunc.call(t.model, true, groupArr[i][j].start, groupArr[i][j].end);
									}
								}
							}
						}
					}
				}
			}

			t.model.bExcludeCollapsed = oldExcludeCollapsed;

			History.EndTransaction();
			if(isNeedRecal) {
				t.model.workbook.dependencyFormulas.unlockRecal();
			}
		};
		this._isLockedAll(onChangeWorksheetCallback);
	};

	WorksheetView.prototype.hideGroupLevel = function (level, bCol) {

		var t = this, groupArr;
		if(bCol) {
			groupArr = this.arrColGroups ? this.arrColGroups.groupArr : null;
		} else {
			groupArr = this.arrRowGroups ? this.arrRowGroups.groupArr : null;
		}
		//var rowLevelMap = t.arrRowGroups ? t.arrRowGroups.rowLevelMap : null;

		if(!groupArr) {
			return;
		}

		// Проверка глобального лока
		if (this.collaborativeEditing.getGlobalLock()) {
			return;
		}

		var onChangeWorksheetCallback = function (isSuccess) {
			if (false === isSuccess) {
				return;
			}

			asc_applyFunction(callback);

			if(bCol) {
				t._updateAfterChangeGroup(undefined, null);
			} else {
				t._updateAfterChangeGroup(null);
			}
			//тут требуется обновить только rowLevelMap
			//t._updateGroups(bCol, undefined, undefined, true);
		};

		var callback = function() {
			History.Create_NewPoint();
			History.StartTransaction();

			var isNeedRecal = false;
			if(!bCol) {
				for(var i = 0; i <= level; i++) {
					if(!groupArr[i]) {
						continue;
					}
					for(var j = 0; j < groupArr[i].length; j++) {
						isNeedRecal = t.model.needRecalFormulas(groupArr[i][j].start, groupArr[i][j].end);
						if(isNeedRecal) {
							break;
						}
					}
				}
			}
			if(isNeedRecal) {
				t.model.workbook.dependencyFormulas.lockRecal();
			}

			//TODO check filtering mode
			var oldExcludeCollapsed = t.model.bExcludeCollapsed;
			var _summaryBelow = t.model.sheetPr ? t.model.sheetPr.SummaryBelow : true;
			var _summaryRight = t.model.sheetPr ? t.model.sheetPr.SummaryRight : true;
			t.model.bExcludeCollapsed = true;
			for(i = 0; i <= level; i++) {
				if(!groupArr[i]) {
					continue;
				}
				for(j = 0; j < groupArr[i].length; j++) {
					if(bCol) {
						t.model.setColHidden(i >= level, groupArr[i][j].start, groupArr[i][j].end);
						if(_summaryRight) {
							t.model.setCollapsedCol(i >= level, groupArr[i][j].end + 1);
						} else {
							t.model.setCollapsedCol(i >= level, groupArr[i][j].start - 1);
						}

					} else {
						t.model.setRowHidden(i >= level, groupArr[i][j].start, groupArr[i][j].end);
						if(_summaryBelow) {
							t.model.setCollapsedRow(i >= level, groupArr[i][j].end + 1);
						} else {
							t.model.setCollapsedRow(i >= level, groupArr[i][j].start - 1);
						}

					}
				}
			}
			t.model.bExcludeCollapsed = oldExcludeCollapsed;

			History.EndTransaction();

			if(isNeedRecal) {
				t.model.workbook.dependencyFormulas.unlockRecal();
			}
		};

		this._isLockedAll(onChangeWorksheetCallback);
	};

	WorksheetView.prototype.changeGroupDetails = function (bExpand) {
		//multiselect
		if(this.model.selectionRange.ranges.length > 1) {
			return;
		}

		var ar = this.model.selectionRange.getLast().clone();
		var t = this;

		//ms делает следущим образом:
		//закрываем группы, кнопки которых попали в выделение. если же ни одна из кнопок не попала - смотрим пересечение с группой с максимальным уровнем
		//TODO если кнопка группа с наименьшим уровнем попала в выделение и внутри этой группы на предыдущей строке есть кнопка группы с меньшим уровнем,
		//TODO то скрываем именно внутреннюю группу - это необходимо сделать! касается только группы с самым наименьшим уровенем, далее внутренни группы не нужно проверять


		var getNeedGroups = function(groupArr, /*levelMap,*/ bCol) {

			var maxGroupIndexMap = {}, deleteIndexes = {};
			var selectPartGroup, curLevel = 0;
			var container = [];
			if(groupArr) {
				for(var i = 0; i < groupArr.length; i++) {
					if(groupArr[i]) {
						for(var j = 0; j < groupArr[i].length; j++) {
							//TODO COLUMNS! - bCol
							var collapsed = t._getGroupCollapsed(groupArr[i][j].end + 1, bCol);
							//полностью выделена группа, если выделена кнопка
							if(groupArr[i][j].end + 1 >= ar.r1 && groupArr[i][j].end + 1 <= ar.r2 && undefined === maxGroupIndexMap[groupArr[i][j].end]) {
								if(!deleteIndexes[groupArr[i][j].end] && undefined !== maxGroupIndexMap[groupArr[i][j].end + 1] && !collapsed /*!levelMap[groupArr[i][j].end + 1].collapsed*/) {
									delete container[maxGroupIndexMap[groupArr[i][j].end + 1]];
									deleteIndexes[maxGroupIndexMap[groupArr[i][j].end + 1]] = 1;
								} else {
									maxGroupIndexMap[groupArr[i][j].end] = container.length;
								}
								if(!bExpand && !collapsed/*(!levelMap[groupArr[i][j].end + 1] || !levelMap[groupArr[i][j].end + 1].collapsed)*/) {
									container.push(groupArr[i][j]);
								}
							} else {
								//частичное выделение - выбираем максимальный уровень, первую по счёту группу
								var outLineGroupRange;
								if(bCol) {
									outLineGroupRange = Asc.Range(groupArr[i][j].start, 0, groupArr[i][j].end, gc_nMaxRow);
								} else {
									outLineGroupRange = Asc.Range(0, groupArr[i][j].start, gc_nMaxCol, groupArr[i][j].end);
								}
								if(!collapsed && i > curLevel && outLineGroupRange.intersection(ar)) {
									selectPartGroup = groupArr[i][j];
									curLevel = i;
								}
							}
						}
					}
				}
			}
			return {container: container, selectPartGroup: selectPartGroup};
		};

		var needGroups = getNeedGroups(t.arrRowGroups.groupArr/*, t.arrRowGroups.levelMap*/);
		var allGroupSelectedRow = needGroups.container;
		var selectPartRowGroup = needGroups.selectPartGroup;

		if(allGroupSelectedRow.length) {
			selectPartRowGroup = null;
		}


		needGroups = getNeedGroups(t.arrColGroups.groupArr, /*t.arrColGroups.levelMap,*/ true);
		var allGroupSelectedCol = needGroups.container;
		var selectPartColGroup = needGroups.selectPartGroup;


		if(allGroupSelectedCol.length) {
			selectPartColGroup = null;
		}

		var onChangeWorksheetCallback = function (isSuccess) {
			if (false === isSuccess) {
				return;
			}

			asc_applyFunction(callback);
			t._updateAfterChangeGroup(null, null);
		};

		//TODO необходимо не закрывать полностью выделенные 1 уровни
		var callback = function(isSuccess) {
			if (false === isSuccess) {
				return;
			}

			History.Create_NewPoint();
			History.StartTransaction();

			//строки
			var i;
			if(allGroupSelectedRow.length) {
				for(i = 0; i < allGroupSelectedRow.length; i++) {
					if(!allGroupSelectedRow[i]) {
						continue;
					}

					//если блок попал полностью под выделение
					t.model.setRowHidden(!bExpand, allGroupSelectedRow[i].start, allGroupSelectedRow[i].end);
				}
			}

			if(selectPartRowGroup) {
				t.model.setRowHidden(!bExpand, selectPartRowGroup.start, selectPartRowGroup.end);
			}

			//столбцы
			if(allGroupSelectedCol.length) {
				for(i = 0; i < allGroupSelectedCol.length; i++) {
					if(!allGroupSelectedCol[i]) {
						continue;
					}

					//если блок попал полностью под выделение
					t.model.setColHidden(!bExpand, allGroupSelectedCol[i].start, allGroupSelectedCol[i].end);
				}
			}
			if(selectPartColGroup) {
				t.model.setColHidden(!bExpand, selectPartColGroup.start, selectPartColGroup.end);
			}

			History.EndTransaction();
		};

		if(selectPartRowGroup || selectPartColGroup || allGroupSelectedRow.length || allGroupSelectedCol.length) {
			this._isLockedAll(onChangeWorksheetCallback);
		}
	};

	//самый простой вариант реализации данной функции
	//ориентируемся по первой строке выделенного диапазона
	//попали внутрь группы или затронули кнопку - выполняем действие
	//приоритет у группы с максимальным уровнем
	WorksheetView.prototype.changeGroupDetailsSimple = function (bExpand) {
		//multiselect
		if (this.model.selectionRange.ranges.length > 1) {
			return;
		}

		var ar = this.model.selectionRange.getLast().clone();
		var t = this;


		var getNeedGroups = function(groupArr, bCol) {
			var res;
			if(groupArr) {
				for(var i = 0; i < groupArr.length; i++) {
					if(groupArr[i]) {
						for(var j = 0; j < groupArr[i].length; j++) {
							//полностью выделена группа, если выделена кнопка
							if(!bCol && groupArr[i][j].start <= ar.r1 && groupArr[i][j].end + 1 >= ar.r1) {
								res = groupArr[i][j];
							} else if(groupArr[i][j].start <= ar.c1 && groupArr[i][j].end + 1 >= ar.c1) {
								res = groupArr[i][j];
							}
						}
					}
				}
			}
			return res;
		};

		var needGroups = getNeedGroups(t.arrRowGroups.groupArr);
		var allGroupSelectedRow = needGroups;


		needGroups = getNeedGroups(t.arrColGroups.groupArr, true);
		var allGroupSelectedCol = needGroups;

		var onChangeWorksheetCallback = function (isSuccess) {
			if (false === isSuccess) {
				return;
			}

			asc_applyFunction(callback);
			t._updateAfterChangeGroup(null, null);
		};

		//TODO необходимо не закрывать полностью выделенные 1 уровни
		var callback = function(isSuccess) {
			if (false === isSuccess) {
				return;
			}

			History.Create_NewPoint();
			History.StartTransaction();

			//строки
			var i;
			if(allGroupSelectedRow) {
				//если блок попал полностью под выделение
				t.model.setRowHidden(!bExpand, allGroupSelectedRow.start, allGroupSelectedRow.end);
			}


			//столбцы
			if(allGroupSelectedCol) {
				//если блок попал полностью под выделение
				t.model.setColHidden(!bExpand, allGroupSelectedCol.start, allGroupSelectedCol.end);
			}

			History.EndTransaction();
		};

		if(allGroupSelectedRow || allGroupSelectedCol) {
			this._isLockedAll(onChangeWorksheetCallback);
		}
	};

	WorksheetView.prototype._updateAfterChangeGroup = function(updateRow, updateCol, changeRowCol) {
		var t = this;

		var oRecalcType = AscCommonExcel.recalcType.recalc;
		var lockDraw = false;	// Параметр, при котором не будет отрисовки (т.к. мы просто обновляем информацию на неактивном листе)
		var arrChangedRanges = [];

		t._initCellsArea(oRecalcType);

		if(changeRowCol) {
			t.cache.reset();
		}
		t._cleanCellsTextMetricsCache();
		t._prepareCellTextMetricsCache();

		arrChangedRanges = arrChangedRanges.concat(t.model.hiddenManager.getRecalcHidden());

		t.cellCommentator.updateAreaComments();

		if (t.objectRender) {
			t._updateDrawingArea();
			t.model.onUpdateRanges(arrChangedRanges);
			t.objectRender.rebuildChartGraphicObjects(arrChangedRanges);
		}

		if(updateRow) {
			t._updateGroups(null);
		} else if(updateRow === null) {
		 	t._updateGroups(false, undefined, undefined, true);
		}
		if(updateCol) {
			t._updateGroups(true);
		} else if(updateCol === null) {
			t._updateGroups(true, undefined, undefined, true);
		}

		t.draw(lockDraw);

		t.handlers.trigger("reinitializeScroll", AscCommonExcel.c_oAscScrollType.ScrollVertical | AscCommonExcel.c_oAscScrollType.ScrollHorizontal);
		t.handlers.trigger("selectionChanged");
		t.handlers.trigger("selectionMathInfoChanged", t.getSelectionMathInfo());
	};

	WorksheetView.prototype.clearOutline = function() {
		var t = this;

		//TODO check filtering mode
		var ar = t.model.selectionRange;

		//если активной является 1 ячейка, то сбрасываем все группы
		var isOneCell = 1 === ar.ranges.length && ar.ranges[0].isOneCell();

		var groupArrCol= t.arrColGroups ? t.arrColGroups.groupArr : null;
		var groupArrRow = t.arrRowGroups ? t.arrRowGroups.groupArr : null;

		var doChangeRowArr = [], doChangeColArr = [];
		var range, intersection;
		for(var n = 0; n < ar.ranges.length; n++) {
			if(groupArrRow) {
				for(var i = 0; i <= groupArrRow.length; i++) {
					if(!groupArrRow[i]) {
						continue;
					}
					for(var j = 0; j < groupArrRow[i].length; j++) {
						range = Asc.Range(0, groupArrRow[i][j].start, gc_nMaxCol, groupArrRow[i][j].end);
						if(isOneCell) {
							intersection = range;
						} else {
							intersection = ar.ranges[n].intersection(range);
						}
						if(intersection) {
							doChangeRowArr.push(intersection);
						}
					}
				}
			}

			if(groupArrCol) {
				for(i = 0; i <= groupArrCol.length; i++) {
					if(!groupArrCol[i]) {
						continue;
					}
					for(j = 0; j < groupArrCol[i].length; j++) {
						range = Asc.Range(groupArrCol[i][j].start, 0, groupArrCol[i][j].end, gc_nMaxRow);
						if(isOneCell) {
							intersection = range;
						} else {
							intersection = ar.ranges[n].intersection(range);
						}
						if(intersection) {
							doChangeColArr.push(intersection);
						}
					}
				}
			}
		}

		var callback = function(isSuccess) {
			if(!isSuccess) {
				return;
			}

			History.Create_NewPoint();
			History.StartTransaction();

			var ar = t.model.selectionRange.getLast();
			var _type = ar.getType();
			if(_type === c_oAscSelectionType.RangeMax || _type === c_oAscSelectionType.RangeRow) {
				if(t.model.oAllCol) {
					t.model.oAllCol.setOutlineLevel(0);
				}
			}
			if(_type === c_oAscSelectionType.RangeMax || _type === c_oAscSelectionType.RangeCol) {
				if(t.model.oSheetFormatPr && t.model.oSheetFormatPr.oAllRow) {
					t.model.oSheetFormatPr.oAllRow.setOutlineLevel(0);
				}
			}


			for(var j in doChangeRowArr) {
				t.model.setRowHidden(false, doChangeRowArr[j].r1, doChangeRowArr[j].r2);
				t.model.setOutlineRow(0, doChangeRowArr[j].r1, doChangeRowArr[j].r2);
			}
			for(j in doChangeColArr) {
				t.model.setColHidden(false, doChangeColArr[j].c1, doChangeColArr[j].c2);
				t.model.setOutlineCol(0, doChangeColArr[j].c1, doChangeColArr[j].c2);
			}

			History.EndTransaction();

			t._updateGroups(null);
			t._updateGroups(true);
		};

		if(doChangeRowArr.length || doChangeColArr.length) {
			this._isLockedAll(callback);
		}
	};

	WorksheetView.prototype.checkAddGroup = function(bUngroup) {
		//true - rows, false - columns, null - show dialog, undefined - error

		//multiselect
		if(this.model.selectionRange.ranges.length > 1) {
			this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CopyMultiselectAreaError, c_oAscError.Level.NoCritical);
			return;
		}
		if(bUngroup && !this._isGroupSheet()) {
			this.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.CannotUngroupError, c_oAscError.Level.NoCritical);
			return;
		}

		var res = null;
		var ar = this.model.selectionRange.getLast().clone();
		var type = ar.getType();

		if (c_oAscSelectionType.RangeCol === type) {
			res = false;
		} else if(c_oAscSelectionType.RangeRow === type) {
			res = true;
		}

		return res;
	};

	WorksheetView.prototype._isGroupSheet = function() {
		//проверка на то, есть ли вообще группировка на листе
		var res = false;

		if((this.arrRowGroups && this.arrRowGroups.groupArr) || (this.arrColGroups && this.arrColGroups.groupArr)) {
			res = true;
		}

		return res;
	};

	WorksheetView.prototype.checkSetGroup = function(range, bCol) {
		var res = true;
		var c_maxLevel = window['AscCommonExcel'].c_maxOutlineLevel;
		var maxLevel, i;

		if(!bCol && this.arrRowGroups && this.arrRowGroups.groupArr) {
			if(this.arrRowGroups.groupArr[c_maxLevel]) {
				maxLevel = this.arrRowGroups.groupArr[c_maxLevel];
				for(i = 0; i < maxLevel.length; i++) {
					if(range.r1 >= maxLevel[i].start && range.r2 <= maxLevel[i].end) {
						res = false;
						break;
					}
				}
			}
		} else if(bCol && (this.arrColGroups && this.arrColGroups.groupArr)) {
			if(this.arrColGroups.groupArr[c_maxLevel]) {
				maxLevel = this.arrColGroups.groupArr[c_maxLevel];
				for(i = 0; i < maxLevel.length; i++) {
					if(range.c1 >= maxLevel[i].start && range.c2 <= maxLevel[i].end) {
						res = false;
						break;
					}
				}
			}
		}

		return res;
	};

	WorksheetView.prototype.asc_setGroupSummary = function(val, bCol) {
		var t = this;
		var groupArr = bCol ? this.arrColGroups : this.arrRowGroups;
		groupArr = groupArr ? groupArr.groupArr : null;
		var collapsedIndexes = [];
		if(groupArr) {
			for(var i = 0; i < groupArr.length; i++) {
				if (groupArr[i]) {
					for (var j = 0; j < groupArr[i].length; j++) {
						var collapsedFrom, collapsedTo;
						if(val === false) {
							collapsedFrom = groupArr[i][j].end + 1;
							collapsedTo = groupArr[i][j].start - 1;

						} else {
							collapsedFrom = groupArr[i][j].start - 1;
							collapsedTo = groupArr[i][j].end + 1;
						}

						var fromCollapsed = this._getGroupCollapsed(collapsedFrom, bCol);
						if(fromCollapsed !== this._getGroupCollapsed(collapsedTo, bCol) && collapsedTo > 0 && collapsedFrom > 0) {
							collapsedIndexes[collapsedTo] = fromCollapsed;
						}
					}
				}
			}
		}


		var callback = function(success) {
			if(!success) {
				return;
			}

			History.Create_NewPoint();
			History.StartTransaction();

			bCol ? t.model.setSummaryRight(val) : t.model.setSummaryBelow(val);

			for(var n in collapsedIndexes) {
				bCol ? t.model.setCollapsedCol(collapsedIndexes[n], n) : t.model.setCollapsedRow(collapsedIndexes[n], n);
			}

			History.EndTransaction();

			if(bCol) {
				t._updateAfterChangeGroup(undefined, null);
			} else {
				t._updateAfterChangeGroup(null);
			}
		};

		this._isLockedAll(callback);

	};

	WorksheetView.prototype.expandActiveCellByFormulaArray = function(activeCellRange) {
		var formulaRef;
		if(!activeCellRange) {
			return activeCellRange;
		}
		this.model.getRange3(activeCellRange.r1, activeCellRange.c1, activeCellRange.r1, activeCellRange.c1)._foreachNoEmpty(function(cell) {
			formulaRef = cell.formulaParsed && cell.formulaParsed.ref ? cell.formulaParsed.ref : null;
		});
		return formulaRef ? formulaRef : activeCellRange;
	};

	WorksheetView.prototype.getSortProps = function(bExpand) {
		var sortSettings = null;
		var t = this;

		//todo добавить локи

		//перед этой функцией необходимо вызвать getSelectionSortInfo - необходимо ли расширять
		//bExpand - ответ от этой функции, который протаскивается через интерфейс
		//если мультиселект - дизейбл кнопки sort
		var selection = t.model.selectionRange.getLast();
		var oldSelection = selection.clone();

		var autoFilter = t.model.AutoFilter;
		var modelSort, dataHasHeaders, columnSort;
		var tables = t.model.autoFilters.getTableIntersectionRange(selection);
		var lockChangeHeaders, lockChangeOrientation, caseSensitive;
		//проверяем, возможно находится рядом а/ф
		var tryExpandRange = t.model.autoFilters.expandRange(selection, true);
		if(tables && tables.length) {
			if(tables && tables && tables.length === 1 && tables[0].Ref.containsRange(selection)) {
				selection = tables[0].getRangeWithoutHeaderFooter();
				columnSort = true;
				dataHasHeaders = true;
				modelSort = tables[0].SortState;
				lockChangeHeaders = true;
				lockChangeOrientation = true;
			} else {
				t.workbook.handlers.trigger("asc_onError", c_oAscError.ID.AutoFilterDataRangeError, c_oAscError.Level.NoCritical);
				return false;
			}
		} else if(autoFilter && autoFilter.Ref && (autoFilter.Ref.isEqual(selection) || (selection.isOneCell() && (autoFilter.Ref.containsRange(selection) || autoFilter.Ref.containsRange(tryExpandRange))))) {
			selection = autoFilter.getRangeWithoutHeaderFooter();
			columnSort = true;
			dataHasHeaders = true;
			modelSort = autoFilter.SortState;
			lockChangeHeaders = true;
			lockChangeOrientation = true;
		} else {
			if(bExpand) {
				selection = tryExpandRange ? tryExpandRange : t.model.autoFilters.expandRange(selection, true);
			}
			selection =  t.model.autoFilters.cutRangeByDefinedCells(selection);
			if(bExpand) {
				selection = t.model.autoFilters.checkExpandRangeForSort(selection);
			}

			//в модели лежит флаг columnSort - если он true значит сортируем по строке(те перемещаем колонки)
			//в настройках флаг columnSort - означает, что сортируем по колонке
			modelSort = this.model.sortState;
			columnSort = modelSort ? !modelSort.ColumnSort : true;
			caseSensitive = modelSort ? modelSort.CaseSensitive : false;

			var isOneRow = selection.r1 === selection.r2;
			if(isOneRow || !columnSort) {
				if(isOneRow) {
					lockChangeHeaders = true;
				}
				dataHasHeaders = false;
			}

			if(columnSort) {
				if(modelSort) {
					dataHasHeaders = /*!modelSort.Ref.isEqual(selection) ?*/ modelSort._hasHeaders /*: false*/;
				} else {
					dataHasHeaders = window['AscCommonExcel'].ignoreFirstRowSort(t.model, selection);
				}
			}


			//для columnSort - добавлять с1++
			if (dataHasHeaders) {
				selection.r1++;
			}

			//если пустой дипазон, выдаём ошибку
			if(t.model.autoFilters._isEmptyRange(selection, 0)) {
				t.workbook.handlers.trigger("asc_onError", c_oAscError.ID.AutoFilterDataRangeError, c_oAscError.Level.NoCritical);
				return false;
			}
		}

		this.setSelection(selection);
		sortSettings = new Asc.CSortProperties(this);
		//необходимо ещё сохранять значение старого селекта, чтобы при нажатии пользователя на отмену - откатить
		sortSettings.selection = oldSelection;

		//заголовки
		sortSettings.hasHeaders = dataHasHeaders;
		sortSettings.columnSort = columnSort;

		sortSettings.caseSensitive = caseSensitive;

		sortSettings.lockChangeHeaders = lockChangeHeaders;
		sortSettings.lockChangeOrientation = lockChangeOrientation;

		var getSortLevel = function(sortCondition) {
			var level = new Asc.CSortPropertiesLevel();
			var index = columnSort ? sortCondition.Ref.c1 - selection.c1 : sortCondition.Ref.r1 - selection.r1;
			var name = sortSettings.getNameColumnByIndex(index, selection);

			level.index = index;
			level.name = name;

			//TODO добавить функцию в CSortPropertiesLevel для получения всех цветов(при открытии соответсвующего меню)
			//TODO перенести в отдельную константу Descending/Ascending
			level.descending = sortCondition.ConditionDescending ? Asc.c_oAscSortOptions.Descending : Asc.c_oAscSortOptions.Ascending;
			level.sortBy = sortCondition.ConditionSortBy;

			var conditionSortBy = sortCondition.ConditionSortBy;
			var sortColor = null;
			switch (conditionSortBy) {
				case Asc.ESortBy.sortbyCellColor: {
					level.sortBy = Asc.c_oAscSortOptions.ByColorFill;
					if(sortCondition.dxf && sortCondition.dxf.fill) {
						if(sortCondition.dxf.fill && sortCondition.dxf.fill.patternFill) {
							if(sortCondition.dxf.fill.patternFill.bgColor) {
								sortColor = sortCondition.dxf.fill.patternFill.bgColor;
							} else if(sortCondition.dxf.fill.patternFill.fgColor) {
								sortColor = sortCondition.dxf.fill.patternFill.fgColor;
							}
						}
					}
					//sortColor = sortCondition.dxf && sortCondition.dxf.fill ? sortCondition.dxf.fill.bg() : null;
					break;
				}
				case Asc.ESortBy.sortbyFontColor: {
					level.sortBy = Asc.c_oAscSortOptions.ByColorFont;
					sortColor = sortCondition.dxf && sortCondition.dxf.font && sortCondition.dxf.font.c ? sortCondition.dxf.font.getColor() : null;
					break;
				}
				case Asc.ESortBy.sortbyIcon: {
					level.sortBy = Asc.c_oAscSortOptions.ByIcon;
					break;
				}
				default: {
					level.sortBy = Asc.c_oAscSortOptions.ByValue;
					break;
				}
			}

			var ascColor = null;
			if (null !== sortColor) {
				ascColor = new Asc.asc_CColor();
				ascColor.asc_putR(sortColor.getR());
				ascColor.asc_putG(sortColor.getG());
				ascColor.asc_putB(sortColor.getB());
				ascColor.asc_putA(sortColor.getA());

				level.color = ascColor;
			}
			return level;
		};


		//столбцы/строки с настройками
		if(modelSort) {
			//заполняем только в случае пересечения
			if(selection.intersection(modelSort.Ref)) {
				for(var i = 0; i < modelSort.SortConditions.length; i++) {
					if(modelSort.SortConditions[i].Ref.intersection(selection)) {
						if(!sortSettings.levels) {
							sortSettings.levels = [];
						}

						sortSettings.levels.push(getSortLevel(modelSort.SortConditions[i]));
					}
				}
			}
		}

		sortSettings._newSelection = selection;
		sortSettings.generateSortList();

		return sortSettings;
	};

	WorksheetView.prototype.setSortProps = function(props, doNotSortRange, bCancel) {
		if(bCancel && props && props.selection) {
			this.setSelection(props.selection.clone());
			return;
		}

		if(!props || !props.levels || !props.levels.length) {
			return false;
		}

		var t = this;
		var selection = t.model.selectionRange.getLast();

		var aMerged = this.model.mergeManager.get(selection);
		if (aMerged.outer.length > 0 || (aMerged.inner.length > 0 && null == window['AscCommonExcel']._isSameSizeMerged(selection, aMerged.inner, true))) {
			t.handlers.trigger("onErrorEvent", c_oAscError.ID.CannotFillRange, c_oAscError.Level.NoCritical);
			return;
		}

		//TODO отдельная обработка для таблиц
		var callback = function(obj) {
			//формируем sortState из настроек
			var sortState = new AscCommonExcel.SortState();

			//? activeRange
			sortState.Ref = new Asc.Range(selection.c1, selection.r1, selection.c2, selection.r2);

			History.Create_NewPoint();
			History.StartTransaction();

			var columnSort = props.columnSort;
			sortState.ColumnSort = !columnSort;
			sortState.CaseSensitive = props.caseSensitive;
			for(var i = 0; i < props.levels.length; i++) {
				var sortCondition = new AscCommonExcel.SortCondition();
				var level = props.levels[i];
				var r1 = columnSort ? selection.r1 : level.index + selection.r1;
				var c1 = columnSort ? selection.c1 + level.index : selection.c1;
				var r2 = columnSort ? selection.r2 : level.index + selection.r1;
				var c2  = columnSort ? selection.c1 + level.index : selection.c2;
				sortCondition.Ref = new Asc.Range(c1, r1, c2, r2);
				sortCondition.ConditionSortBy = null;
				sortCondition.ConditionDescending = Asc.c_oAscSortOptions.Descending === level.descending;

				var conditionSortBy = level.sortBy;
				var sortColor = null, newDxf, isRgbColor;
				switch (conditionSortBy) {
					case Asc.c_oAscSortOptions.ByColorFill: {
						sortCondition.ConditionSortBy = Asc.ESortBy.sortbyCellColor;
						sortColor = level.color;
						isRgbColor = sortColor && sortColor.getType && sortColor.getType() === AscCommonExcel.UndoRedoDataTypes.RgbColor;
						sortColor = sortColor && !isRgbColor ? new AscCommonExcel.RgbColor((sortColor.asc_getR() << 16) + (sortColor.asc_getG() << 8) + sortColor.asc_getB()) : null;

						newDxf = new AscCommonExcel.CellXfs();
						newDxf.fill = new AscCommonExcel.Fill();
						newDxf.fill.fromColor(sortColor);

						break;
					}
					case Asc.c_oAscSortOptions.ByColorFont: {
						sortCondition.ConditionSortBy = Asc.ESortBy.sortbyFontColor;
						sortColor = level.color;
						isRgbColor = sortColor && sortColor.getType && sortColor.getType() === AscCommonExcel.UndoRedoDataTypes.RgbColor;
						sortColor = sortColor && !isRgbColor ? new AscCommonExcel.RgbColor((sortColor.asc_getR() << 16) + (sortColor.asc_getG() << 8) + sortColor.asc_getB()) : null;

						newDxf = new AscCommonExcel.CellXfs();
						newDxf.font = new AscCommonExcel.Font();
						newDxf.font.setColor(sortColor);

						break;
					}
					case Asc.c_oAscSortOptions.ByIcon: {
						sortCondition.ConditionSortBy = Asc.ESortBy.sortbyIcon;
						break;
					}
					default: {
						sortCondition.ConditionSortBy = Asc.ESortBy.sortbyValue;
						break;
					}
				}

				if(newDxf) {
					sortCondition.dxf = AscCommonExcel.g_StyleCache.addXf(newDxf);
				}


				if(!sortState.SortConditions) {
					sortState.SortConditions = [];
				}

				sortState.SortConditions.push(sortCondition);
			}

			if(obj) {
				History.Add(AscCommonExcel.g_oUndoRedoSortState, AscCH.historyitem_SortState_Add, t.model.getId(), null,
					new AscCommonExcel.UndoRedoData_SortState(obj.sortState ? obj.sortState.clone() : null, sortState ? sortState.clone() : null, true, obj.DisplayName));

				obj.SortState = sortState;

				if(!obj.isAutoFilter()) {
					t._onUpdateFormatTable(selection, false);
				}
			} else {
				History.Add(AscCommonExcel.g_oUndoRedoSortState, AscCH.historyitem_SortState_Add, t.model.getId(), null,
					new AscCommonExcel.UndoRedoData_SortState(t.model.sortState ? t.model.sortState.clone() : null, sortState ? sortState.clone() : null));

				sortState._hasHeaders = props.hasHeaders;
				t.model.sortState = sortState;
			}

			if(!doNotSortRange) {
				var range = t.model.getRange3(selection.r1, selection.c1, selection.r2, selection.c2);
				t.cellCommentator.sortComments(t._doSort(range, null, null, null, null, !columnSort, sortState));
			}
			if(props && props.selection) {
				t.setSelection(props.selection.clone());
			}

			History.EndTransaction();
		};

		//TODO lock
		var tables = t.model.autoFilters.getTableIntersectionRange(selection);
		var obj;
		if(tables && tables.length) {
			obj = tables[0];
		} else if(t.model.AutoFilter && t.model.AutoFilter.Ref && t.model.AutoFilter.Ref.intersection(selection)) {
			obj = t.model.AutoFilter;
		}


		this._isLockedAll(callback(obj));
	};

	WorksheetView.prototype._generateSortProps = function(nOption, nStartRowCol, sortColor, opt_guessHeader, opt_by_row, range) {
		var sortSettings = new Asc.CSortProperties(this);
		var columnSort = sortSettings.columnSort = opt_by_row !== true;

		var getSortLevel = function() {
			var level = new Asc.CSortPropertiesLevel();

			level.index = columnSort ? nStartRowCol - range.c1 : nStartRowCol - range.r1;

			level.descending = nOption != Asc.c_oAscSortOptions.Ascending;
			level.sortBy = nOption;
			level.color = sortColor;

			return level;
		};

		sortSettings.levels = [];
		sortSettings.levels.push(getSortLevel());
		sortSettings._newSelection = range;

		return sortSettings;
	};

	WorksheetView.prototype.checkCustomSortRange = function (range, bRow) {
		var res = null;
		var ar = this.copyActiveRange.getLast();

		if((bRow && range.r1 !== range.r2) || (!bRow && range.c1 !== range.c2)) {
			res = c_oAscError.ID.CustomSortMoreOneSelectedError;
		} else if(((bRow && (range.r1 < ar.r1 || range.r1 > ar.r2)) || (!bRow && (range.c1 < ar.c1 || range.c1 > ar.c2)))) {
			res = c_oAscError.ID.CustomSortNotOriginalSelectError;
		}

		return res;
	};

	WorksheetView.prototype._doSort = function (range, nOption, nStartRowCol, sortColor, opt_guessHeader, opt_by_row, opt_custom_sort) {
		var res;

		var bordersArr = [];
		range._foreachNoEmpty(function(cell, row, col) {
			var style = cell ? cell.getStyle() : null;
			if(style && style.border) {
				if(!bordersArr[row]) {
					bordersArr[row] = [];
				}
				bordersArr[row][col] = style.border;
				cell.setBorder(null);
			}
		});
		res = range.sort(nOption, nStartRowCol, sortColor, opt_guessHeader, opt_by_row, opt_custom_sort);
		for(var i = 0; i < bordersArr.length; i++) {
			if(bordersArr[i]) {
				for(var j = 0; j < bordersArr[i].length; j++) {
					if(bordersArr[i][j]) {
						var curBorder = bordersArr[i][j];
						this.model._getCell(i, j, function(cell) {
							cell.setBorder(curBorder);
						});

					}
				}
			}
		}

		return res;
	};

	//------------------------------------------------------------export---------------------------------------------------
    window['AscCommonExcel'] = window['AscCommonExcel'] || {};
	window["AscCommonExcel"].CellFlags = CellFlags;
    window["AscCommonExcel"].WorksheetView = WorksheetView;

})(window);
