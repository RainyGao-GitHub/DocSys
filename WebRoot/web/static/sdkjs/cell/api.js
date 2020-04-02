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

var editor;
(/**
 * @param {Window} window
 * @param {undefined} undefined
 */
  function(window, undefined) {
  var asc = window["Asc"];
  var prot;

  var c_oAscAdvancedOptionsAction = AscCommon.c_oAscAdvancedOptionsAction;
  var c_oAscLockTypes = AscCommon.c_oAscLockTypes;
  var CColor = AscCommon.CColor;
  var g_oDocumentUrls = AscCommon.g_oDocumentUrls;
  var sendCommand = AscCommon.sendCommand;
  var parserHelp = AscCommon.parserHelp;
  var g_oIdCounter = AscCommon.g_oIdCounter;
  var g_oTableId = AscCommon.g_oTableId;

  var c_oAscLockTypeElem = AscCommonExcel.c_oAscLockTypeElem;

  var c_oAscError = asc.c_oAscError;
  var c_oAscFileType = asc.c_oAscFileType;
  var c_oAscAsyncAction = asc.c_oAscAsyncAction;
  var c_oAscAdvancedOptionsID = asc.c_oAscAdvancedOptionsID;
  var c_oAscAsyncActionType = asc.c_oAscAsyncActionType;

  var History = null;


  /**
   *
   * @param config
   * @param eventsHandlers
   * @constructor
   * @returns {spreadsheet_api}
   * @extends {AscCommon.baseEditorsApi}
   */
  function spreadsheet_api(config) {
    AscCommon.baseEditorsApi.call(this, config, AscCommon.c_oEditorId.Spreadsheet);

    /************ private!!! **************/
    this.topLineEditorName = config['id-input'] || '';
    this.topLineEditorElement = null;

    this.controller = null;

    this.handlers = new AscCommonExcel.asc_CHandlersList();

    this.fontRenderingMode = Asc.c_oAscFontRenderingModeType.hintingAndSubpixeling;
    this.wb = null;
    this.wbModel = null;
    this.tmpLCID = null;
    this.tmpDecimalSeparator = null;
    this.tmpGroupSeparator = null;
    this.tmpLocalization = null;

    // spellcheck
    this.defaultLanguage = 1033;
    this.spellcheckState = new AscCommonExcel.CSpellcheckState();

    this.documentFormatSave = c_oAscFileType.XLSX;

    // объекты, нужные для отправки в тулбар (шрифты, стили)
    this._gui_control_colors = null;
    this.GuiControlColorsMap = null;
    this.IsSendStandartColors = false;

    this.asyncMethodCallback = undefined;

    // Переменная отвечает, загрузились ли фонты
    this.FontLoadWaitComplete = false;
    //текущий обьект куда записываются информация для update, когда принимаются изменения в native редакторе
    this.oRedoObjectParamNative = null;

    this.collaborativeEditing = null;

    // AutoSave
    this.autoSaveGapRealTime = 30;	  // Интервал быстрого автосохранения (когда выставлен флаг realtime) - 30 мс.

    // Shapes
    this.isStartAddShape = false;
    this.shapeElementId = null;
    this.textArtElementId = null;

	  // Styles sizes
      this.styleThumbnailWidth = 112;
	  this.styleThumbnailHeight = 38;

    this.formulasList = null;	// Список всех формул

	this.openingEnd = {bin: false, xlsxStart: false, xlsx: false, data: null};

    this._init();
    return this;
  }
  spreadsheet_api.prototype = Object.create(AscCommon.baseEditorsApi.prototype);
  spreadsheet_api.prototype.constructor = spreadsheet_api;
  spreadsheet_api.prototype.sendEvent = function() {
    this.sendInternalEvent.apply(this, arguments);
    this.handlers.trigger.apply(this.handlers, arguments);
  };

  spreadsheet_api.prototype._init = function() {
    AscCommon.baseEditorsApi.prototype._init.call(this);
    this.topLineEditorElement = document.getElementById(this.topLineEditorName);
    // ToDo нужно ли это
    asc['editor'] = ( asc['editor'] || this );
  };

  spreadsheet_api.prototype._loadSdkImages = function () {
    var aImages = AscCommonExcel.getIconsForLoad();
    aImages.push(AscCommonExcel.sFrozenImageUrl, AscCommonExcel.sFrozenImageRotUrl);
    this.ImageLoader.bIsAsyncLoadDocumentImages = false;
    this.ImageLoader.LoadDocumentImages(aImages);
    this.ImageLoader.bIsAsyncLoadDocumentImages = true;
  };

  spreadsheet_api.prototype.asc_CheckGuiControlColors = function() {
    // потом реализовать проверку на то, что нужно ли посылать

    var arr_colors = new Array(10);
    var _count = arr_colors.length;
    for (var i = 0; i < _count; ++i) {
      var color = AscCommonExcel.g_oColorManager.getThemeColor(i);
      arr_colors[i] = new CColor(color.getR(), color.getG(), color.getB());
    }

    // теперь проверим
    var bIsSend = false;
    if (this.GuiControlColorsMap != null) {
      for (var i = 0; i < _count; ++i) {
        var _color1 = this.GuiControlColorsMap[i];
        var _color2 = arr_colors[i];

        if ((_color1.r !== _color2.r) || (_color1.g !== _color2.g) || (_color1.b !== _color2.b)) {
          bIsSend = true;
          break;
        }
      }
    } else {
      this.GuiControlColorsMap = new Array(_count);
      bIsSend = true;
    }

    if (bIsSend) {
      for (var i = 0; i < _count; ++i) {
        this.GuiControlColorsMap[i] = arr_colors[i];
      }

      this.asc_SendControlColors();
    }
  };

  spreadsheet_api.prototype.asc_SendControlColors = function() {
    var standart_colors = null;
    if (!this.IsSendStandartColors) {
      var standartColors = AscCommon.g_oStandartColors;
      var _c_s = standartColors.length;
      standart_colors = new Array(_c_s);

      for (var i = 0; i < _c_s; ++i) {
        standart_colors[i] = new CColor(standartColors[i].R, standartColors[i].G, standartColors[i].B);
      }

      this.IsSendStandartColors = true;
    }

    var _count = this.GuiControlColorsMap.length;

    var _ret_array = new Array(_count * 6);
    var _cur_index = 0;

    for (var i = 0; i < _count; ++i) {
      var basecolor = AscCommonExcel.g_oColorManager.getThemeColor(i);
      var aTints = AscCommonExcel.g_oThemeColorsDefaultModsSpreadsheet[AscCommon.GetDefaultColorModsIndex(basecolor.getR(), basecolor.getG(), basecolor.getB())];
      for (var j = 0, length = aTints.length; j < length; ++j) {
        var tint = aTints[j];
        var color = AscCommonExcel.g_oColorManager.getThemeColor(i, tint);
        _ret_array[_cur_index] = new CColor(color.getR(), color.getG(), color.getB());
        _cur_index++;
      }
    }

    this.asc_SendThemeColors(_ret_array, standart_colors);
  };

  spreadsheet_api.prototype.asc_getFunctionArgumentSeparator = function () {
    return AscCommon.FormulaSeparators.functionArgumentSeparator;
  };
  spreadsheet_api.prototype.asc_getCurrencySymbols = function () {
		var result = {};
		for (var key in AscCommon.g_aCultureInfos) {
			result[key] = AscCommon.g_aCultureInfos[key].CurrencySymbol;
		}
		return result;
	};
	spreadsheet_api.prototype.asc_getLocaleExample = function(format, value, culture) {
		var cultureInfo = AscCommon.g_aCultureInfos[culture] || AscCommon.g_oDefaultCultureInfo;
		var numFormat = AscCommon.oNumFormatCache.get(format);
		var res;
		if (null == value) {
			var ws = this.wbModel.getActiveWs();
			var activeCell = ws.selectionRange.activeCell;
			ws._getCellNoEmpty(activeCell.row, activeCell.col, function(cell) {
              if (cell) {
                res = cell.getValueForExample(numFormat, cultureInfo);
              } else {
                res = '';
              }
            });
		} else {
			res = numFormat.formatToChart(value, undefined, cultureInfo);
		}
		return res;
	};
	spreadsheet_api.prototype.asc_getFormatCells = function(info) {
		return AscCommon.getFormatCells(info);
	};
  spreadsheet_api.prototype.asc_getLocaleCurrency = function(val) {
    var cultureInfo = AscCommon.g_aCultureInfos[val];
    if (!cultureInfo) {
      cultureInfo = AscCommon.g_aCultureInfos[1033];
    }
    return AscCommonExcel.getCurrencyFormat(cultureInfo, 2, true, true);
  };


  spreadsheet_api.prototype.asc_getCurrentListType = function(){
      var ws = this.wb.getWorksheet();
      var oParaPr;
      if (ws && ws.objectRender && ws.objectRender.controller) {
          oParaPr = ws.objectRender.controller.getParagraphParaPr();
      }
      return new AscCommon.asc_CListType(AscFormat.fGetListTypeFromBullet(oParaPr && oParaPr.Bullet));
  };

  spreadsheet_api.prototype.asc_setLocale = function (LCID, decimalSeparator, groupSeparator) {
    if (!this.isLoadFullApi) {
      this.tmpLCID = LCID;
      this.tmpDecimalSeparator = decimalSeparator;
      this.tmpGroupSeparator = groupSeparator;
      return;
    }
    if (AscCommon.setCurrentCultureInfo(LCID, decimalSeparator, groupSeparator)) {
      parserHelp.setDigitSeparator(AscCommon.g_oDefaultCultureInfo.NumberDecimalSeparator);
      if (this.wbModel) {
        AscCommon.oGeneralEditFormatCache.cleanCache();
        AscCommon.oNumFormatCache.cleanCache();
        this.wbModel.rebuildColors();
        if (this.isDocumentLoadComplete) {
          AscCommon.checkCultureInfoFontPicker();
          this._loadFonts([], function () {
            this._onUpdateAfterApplyChanges();
          });
        }
      }
    }
  };
  spreadsheet_api.prototype.asc_getLocale = function () {
    return this.isLoadFullApi ? AscCommon.g_oDefaultCultureInfo.LCID : this.tmpLCID;
  };
  spreadsheet_api.prototype.asc_getDecimalSeparator = function (culture) {
  	var cultureInfo = AscCommon.g_aCultureInfos[culture] || AscCommon.g_oDefaultCultureInfo;
    return cultureInfo.NumberDecimalSeparator;
  };
  spreadsheet_api.prototype.asc_getGroupSeparator = function (culture) {
  	var cultureInfo = AscCommon.g_aCultureInfos[culture] || AscCommon.g_oDefaultCultureInfo;
  	return cultureInfo.NumberGroupSeparator;
  };
  spreadsheet_api.prototype._openDocument = function(data) {
    this.wbModel = new AscCommonExcel.Workbook(this.handlers, this);
    this.initGlobalObjects(this.wbModel);
    AscFonts.IsCheckSymbols = true;
    var oBinaryFileReader = new AscCommonExcel.BinaryFileReader();
    oBinaryFileReader.Read(data, this.wbModel);
    AscFonts.IsCheckSymbols = false;
    this.openingEnd.bin = true;
    this._onEndOpen();
  };

  spreadsheet_api.prototype.initGlobalObjects = function(wbModel) {
    // History & global counters
    History.init(wbModel);

    AscCommonExcel.g_oUndoRedoCell = new AscCommonExcel.UndoRedoCell(wbModel);
    AscCommonExcel.g_oUndoRedoWorksheet = new AscCommonExcel.UndoRedoWoorksheet(wbModel);
    AscCommonExcel.g_oUndoRedoWorkbook = new AscCommonExcel.UndoRedoWorkbook(wbModel);
    AscCommonExcel.g_oUndoRedoCol = new AscCommonExcel.UndoRedoRowCol(wbModel, false);
    AscCommonExcel.g_oUndoRedoRow = new AscCommonExcel.UndoRedoRowCol(wbModel, true);
    AscCommonExcel.g_oUndoRedoComment = new AscCommonExcel.UndoRedoComment(wbModel);
    AscCommonExcel.g_oUndoRedoAutoFilters = new AscCommonExcel.UndoRedoAutoFilters(wbModel);
    AscCommonExcel.g_oUndoRedoSparklines = new AscCommonExcel.UndoRedoSparklines(wbModel);
    AscCommonExcel.g_oUndoRedoPivotTables = new AscCommonExcel.UndoRedoPivotTables(wbModel);
    AscCommonExcel.g_DefNameWorksheet = new AscCommonExcel.Worksheet(wbModel, -1);
    AscCommonExcel.g_oUndoRedoSharedFormula = new AscCommonExcel.UndoRedoSharedFormula(wbModel);
    AscCommonExcel.g_oUndoRedoLayout = new AscCommonExcel.UndoRedoRedoLayout(wbModel);
    AscCommonExcel.g_oUndoRedoHeaderFooter = new AscCommonExcel.UndoRedoHeaderFooter(wbModel);
    AscCommonExcel.g_oUndoRedoArrayFormula = new AscCommonExcel.UndoRedoArrayFormula(wbModel);
    AscCommonExcel.g_oUndoRedoSortState = new AscCommonExcel.UndoRedoSortState(wbModel);
  };

  spreadsheet_api.prototype.asc_DownloadAs = function (options) {
    if (!this.canSave || this.isChartEditor || c_oAscAdvancedOptionsAction.None !== this.advancedOptionsAction) {
      return;
    }

    this.downloadAs(c_oAscAsyncAction.DownloadAs, options);
  };
	spreadsheet_api.prototype._saveCheck = function() {
		return !this.isChartEditor && c_oAscAdvancedOptionsAction.None === this.advancedOptionsAction &&
			!this.isLongAction() && !this.asc_getIsTrackShape() && !this.isOpenedChartFrame &&
			History.IsEndTransaction();
	};
	spreadsheet_api.prototype._haveOtherChanges = function () {
	  return this.collaborativeEditing.haveOtherChanges();
    };
	spreadsheet_api.prototype._prepareSave = function (isIdle) {
		var tmpHandlers;
		if (isIdle) {
			tmpHandlers = this.wbModel.handlers.handlers['asc_onError'];
			this.wbModel.handlers.handlers['asc_onError'] = null;
		}

      /* Нужно закрыть редактор (до выставления флага canSave, т.к. мы должны успеть отправить
       asc_onDocumentModifiedChanged для подписки на сборку) Баг http://bugzilla.onlyoffice.com/show_bug.cgi?id=28331 */
		if (!this.asc_closeCellEditor()) {
			if (isIdle) {
				this.asc_closeCellEditor(true);
			} else {
				return false;
			}
		}

		if (isIdle) {
			this.wbModel.handlers.handlers['asc_onError'] = tmpHandlers;
		}
		return true;
    };

  spreadsheet_api.prototype._printDesktop = function (options) {
    window.AscDesktopEditor_PrintOptions = options;
    window["AscDesktopEditor"]["Print"]();
    return true;
  };

  spreadsheet_api.prototype.asc_ChangePrintArea = function(type) {
	var ws = this.wb.getWorksheet();
	return ws.changePrintArea(type);
  };

  spreadsheet_api.prototype.asc_CanAddPrintArea = function() {
      var ws = this.wb.getWorksheet();
      return ws.canAddPrintArea();
  };

  spreadsheet_api.prototype.asc_SetPrintScale = function(width, height, scale) {
	  var ws = this.wb.getWorksheet();
	  return ws.setPrintScale(width, height, scale);
  };

  spreadsheet_api.prototype.asc_Copy = function() {
    if (window["AscDesktopEditor"])
    {
      window["asc_desktop_copypaste"](this, "Copy");
      return true;
    }
    return AscCommon.g_clipboardBase.Button_Copy();
  };

  spreadsheet_api.prototype.asc_Paste = function() {
    if (window["AscDesktopEditor"])
    {
      window["asc_desktop_copypaste"](this, "Paste");
      return true;
    }
    if (!AscCommon.g_clipboardBase.IsWorking()) {
      return AscCommon.g_clipboardBase.Button_Paste();
    }
    return false;
  };
  
  spreadsheet_api.prototype.asc_SpecialPaste = function(props) {
    return AscCommon.g_specialPasteHelper.Special_Paste(props);
  };
  
  spreadsheet_api.prototype.asc_SpecialPasteData = function(props) {
	if (this.canEdit()) {
      this.wb.specialPasteData(props);
    }
  };

  spreadsheet_api.prototype.asc_TextImport = function(options, callback, bPaste) {
      if (this.canEdit()) {
        var text;
        if(bPaste) {
			text = AscCommon.g_specialPasteHelper.GetPastedData(true);
        } else {
			var ws = this.wb.getWorksheet();
			text = ws.getRangeText();
        }
        if(!text) {
            //error
            //no data was selected to parse
			this.sendEvent('asc_onError', c_oAscError.ID.NoDataToParse, c_oAscError.Level.NoCritical);
			callback(false);
			return;
        }
        callback(AscCommon.parseText(text, options, true));
      }
  };

  spreadsheet_api.prototype.asc_TextToColumns = function(options) {
	  if (this.canEdit()) {
          var ws = this.wb.getWorksheet();
		  var text = ws.getRangeText();
		  var specialPasteHelper = window['AscCommon'].g_specialPasteHelper;
		  if(!specialPasteHelper.specialPasteProps) {
			  specialPasteHelper.specialPasteProps = new Asc.SpecialPasteProps();
          }
		  specialPasteHelper.specialPasteProps.property = Asc.c_oSpecialPasteProps.useTextImport;
		  specialPasteHelper.specialPasteProps.asc_setAdvancedOptions(options);
		  this.wb.pasteData(AscCommon.c_oAscClipboardDataFormat.Text, text, null, null, true);
	  }
  };

  spreadsheet_api.prototype.asc_ShowSpecialPasteButton = function(props) {
      if (this.canEdit()) {
          this.wb.showSpecialPasteButton(props);
      }
  };

  spreadsheet_api.prototype.asc_UpdateSpecialPasteButton = function(props) {
      if (this.canEdit()) {
          this.wb.updateSpecialPasteButton(props);
      }
  };

  spreadsheet_api.prototype.asc_HideSpecialPasteButton = function() {
      if (this.canEdit()) {
          this.wb.hideSpecialPasteButton();
      }
 };

  spreadsheet_api.prototype.asc_Cut = function() {
    if (window["AscDesktopEditor"])
    {
      window["asc_desktop_copypaste"](this, "Cut");
      return true;
    }
    return AscCommon.g_clipboardBase.Button_Cut();
  };

  spreadsheet_api.prototype.asc_PasteData = function (_format, data1, data2, text_data) {
    if (this.canEdit()) {
      this.wb.pasteData(_format, data1, data2, text_data, arguments[5]);
    }
  };

  spreadsheet_api.prototype.asc_CheckCopy = function (_clipboard /* CClipboardData */, _formats) {
    return this.wb.checkCopyToClipboard(_clipboard, _formats);
  };

  spreadsheet_api.prototype.asc_SelectionCut = function () {
    if (this.canEdit()) {
      this.wb.selectionCut();
    }
  };

  spreadsheet_api.prototype.asc_bIsEmptyClipboard = function() {
    var result = this.wb.bIsEmptyClipboard();
    this.wb.restoreFocus();
    return result;
  };

  spreadsheet_api.prototype.asc_Undo = function() {
    this.wb.undo();
    this.wb.restoreFocus();
  };

  spreadsheet_api.prototype.asc_Redo = function() {
    this.wb.redo();
    this.wb.restoreFocus();
  };

  spreadsheet_api.prototype.asc_Resize = function () {
    var isRetinaOld = AscCommon.AscBrowser.isRetina;
    AscCommon.AscBrowser.checkZoom();
    if (this.wb) {
      if (isRetinaOld !== AscCommon.AscBrowser.isRetina) {
        this.wb.changeZoom(null);
      }
      this.wb.resize();

      if (AscCommon.g_inputContext) {
        AscCommon.g_inputContext.onResize("ws-canvas-outer");
      }
    }
  };

  spreadsheet_api.prototype.asc_addAutoFilter = function(styleName, addFormatTableOptionsObj) {
    var ws = this.wb.getWorksheet();
    return ws.addAutoFilter(styleName, addFormatTableOptionsObj);
  };

  spreadsheet_api.prototype.asc_changeAutoFilter = function(tableName, optionType, val) {
    var ws = this.wb.getWorksheet();
    return ws.changeAutoFilter(tableName, optionType, val);
  };

  spreadsheet_api.prototype.asc_applyAutoFilter = function(autoFilterObject) {
    var ws = this.wb.getWorksheet();
    ws.applyAutoFilter(autoFilterObject);
  };
  
  spreadsheet_api.prototype.asc_applyAutoFilterByType = function(autoFilterObject) {
    var ws = this.wb.getWorksheet();
    ws.applyAutoFilterByType(autoFilterObject);
  };
  
  spreadsheet_api.prototype.asc_reapplyAutoFilter = function(displayName) {
    var ws = this.wb.getWorksheet();
    ws.reapplyAutoFilter(displayName);
  };

  spreadsheet_api.prototype.asc_sortColFilter = function(type, cellId, displayName, color, bIsExpandRange) {
    var ws = this.wb.getWorksheet();
    ws.sortRange(type, cellId, displayName, color, bIsExpandRange);
  };

  spreadsheet_api.prototype.asc_getAddFormatTableOptions = function(range) {
    var ws = this.wb.getWorksheet();
    return ws.getAddFormatTableOptions(range);
  };

  spreadsheet_api.prototype.asc_clearFilter = function() {
    var ws = this.wb.getWorksheet();
    return ws.clearFilter();
  };
  
  spreadsheet_api.prototype.asc_clearFilterColumn = function(cellId, displayName) {
    var ws = this.wb.getWorksheet();
    return ws.clearFilterColumn(cellId, displayName);
  };
  
  spreadsheet_api.prototype.asc_changeSelectionFormatTable = function(tableName, optionType) {
    var ws = this.wb.getWorksheet();
    return ws.af_changeSelectionFormatTable(tableName, optionType);
  };
  
  spreadsheet_api.prototype.asc_changeFormatTableInfo = function(tableName, optionType, val) {
    return this.wb.changeFormatTableInfo(tableName, optionType, val);
  };

  spreadsheet_api.prototype.asc_applyAutoCorrectOptions = function(val) {
      this.wb.applyAutoCorrectOptions(val);
  };

  spreadsheet_api.prototype.asc_insertCellsInTable = function(tableName, optionType) {
    var ws = this.wb.getWorksheet();
    return ws.af_insertCellsInTable(tableName, optionType);
  };
  
  spreadsheet_api.prototype.asc_deleteCellsInTable = function(tableName, optionType) {
    var ws = this.wb.getWorksheet();
    return ws.af_deleteCellsInTable(tableName, optionType);
  };
  
  spreadsheet_api.prototype.asc_changeDisplayNameTable = function(tableName, newName) {
    var ws = this.wb.getWorksheet();
    return ws.af_changeDisplayNameTable(tableName, newName);
  };
  
  spreadsheet_api.prototype.asc_changeTableRange = function(tableName, range) {
    var ws = this.wb.getWorksheet();
    return ws.af_changeTableRange(tableName, range);
  };

  spreadsheet_api.prototype.asc_convertTableToRange = function(tableName) {
    var ws = this.wb.getWorksheet();
    return ws.af_convertTableToRange(tableName);
  };

	spreadsheet_api.prototype.asc_getTablePictures = function (props, pivot) {
		return this.wb.getTableStyles(props, pivot);
	};

  spreadsheet_api.prototype.asc_setViewMode = function (isViewMode) {
    this.isViewMode = !!isViewMode;
    if (!this.isLoadFullApi) {
      return;
    }
    if (this.collaborativeEditing) {
      this.collaborativeEditing.setViewerMode(isViewMode);
    }
  };

	  spreadsheet_api.prototype.asc_setFilteringMode = function (mode) {
		  window['AscCommonExcel'].filteringMode = !!mode;
	  };

  /*
   idOption идентификатор дополнительного параметра, пока c_oAscAdvancedOptionsID.CSV.
   option - какие свойства применить, пока массив. для CSV объект asc_CTextOptions(codepage, delimiter)
   exp:	asc_setAdvancedOptions(c_oAscAdvancedOptionsID.CSV, new Asc.asc_CTextOptions(1200, c_oAscCsvDelimiter.Comma) );
   */
  spreadsheet_api.prototype.asc_setAdvancedOptions = function(idOption, option) {
    // Проверяем тип состояния в данный момент
    if (this.advancedOptionsAction !== c_oAscAdvancedOptionsAction.Open) {
      return;
    }
    if (AscCommon.EncryptionWorker.asc_setAdvancedOptions(this, idOption, option)) {
      return;
    }

    var v;
    switch (idOption) {
      case c_oAscAdvancedOptionsID.CSV:
        v = {
          "id": this.documentId,
          "userid": this.documentUserId,
          "format": this.documentFormat,
          "c": "reopen",
          "title": this.documentTitle,
          "delimiter": option.asc_getDelimiter(),
          "delimiterChar": option.asc_getDelimiterChar(),
          "codepage": option.asc_getCodePage(),
          "nobase64": true
        };
        sendCommand(this, null, v);
        break;
      case c_oAscAdvancedOptionsID.DRM:
        v = {
          "id": this.documentId,
          "userid": this.documentUserId,
          "format": this.documentFormat,
          "c": "reopen",
          "title": this.documentTitle,
          "password": option.asc_getPassword(),
          "nobase64": true
        };
        sendCommand(this, null, v);
        break;
    }
  };
  // Опции страницы (для печати)
  spreadsheet_api.prototype.asc_setPageOptions = function(options, index) {
    var sheetIndex = (undefined !== index && null !== index) ? index : this.wbModel.getActive();
    this.wb.getWorksheet(sheetIndex).setPageOptions(options);
  };

  spreadsheet_api.prototype.asc_savePagePrintOptions = function(arrPagesPrint) {
      this.wb.savePagePrintOptions(arrPagesPrint);
  };

  spreadsheet_api.prototype.asc_getPageOptions = function(index) {
    var sheetIndex = (undefined !== index && null !== index) ? index : this.wbModel.getActive();
    return this.wbModel.getWorksheet(sheetIndex).PagePrintOptions;
  };

  spreadsheet_api.prototype.asc_setPageOption = function (func, val, index) {
      var sheetIndex = (undefined !== index && null !== index) ? index : this.wbModel.getActive();
      var ws = this.wb.getWorksheet(sheetIndex);
      ws.setPageOption(func, val);
  };

  spreadsheet_api.prototype.asc_changeDocSize = function (width, height, index) {
    var sheetIndex = (undefined !== index && null !== index) ? index : this.wbModel.getActive();
    var ws = this.wb.getWorksheet(sheetIndex);
    ws.changeDocSize(width, height);
  };

  spreadsheet_api.prototype.asc_changePageMargins = function (left, right, top, bottom, index) {
      var sheetIndex = (undefined !== index && null !== index) ? index : this.wbModel.getActive();
      var ws = this.wb.getWorksheet(sheetIndex);
      ws.changePageMargins(left, right, top, bottom);
  };

  spreadsheet_api.prototype.asc_changePageOrient = function (isPortrait, index) {
      var sheetIndex = (undefined !== index && null !== index) ? index : this.wbModel.getActive();
      var ws = this.wb.getWorksheet(sheetIndex);
      if (isPortrait) {
          ws.changePageOrient(Asc.c_oAscPageOrientation.PagePortrait);
      } else {
          ws.changePageOrient(Asc.c_oAscPageOrientation.PageLandscape);
      }
  };

  spreadsheet_api.prototype._onNeedParams = function(data, opt_isPassword) {
    var t = this;
    // Проверяем, возможно нам пришли опции для CSV
    if (this.documentOpenOptions && !opt_isPassword) {
      var codePageCsv = AscCommon.c_oAscEncodingsMap[this.documentOpenOptions["codePage"]] || AscCommon.c_oAscCodePageUtf8, delimiterCsv = this.documentOpenOptions["delimiter"],
		  delimiterCharCsv = this.documentOpenOptions["delimiterChar"];
      if (null != codePageCsv && (null != delimiterCsv || null != delimiterCharCsv)) {
        this.asc_setAdvancedOptions(c_oAscAdvancedOptionsID.CSV, new asc.asc_CTextOptions(codePageCsv, delimiterCsv, delimiterCharCsv));
        return;
      }
    }
	if (opt_isPassword) {
		if (t.handlers.hasTrigger("asc_onAdvancedOptions")) {
			t.handlers.trigger("asc_onAdvancedOptions", c_oAscAdvancedOptionsID.DRM);
		} else {
			t.handlers.trigger("asc_onError", c_oAscError.ID.ConvertationPassword, c_oAscError.Level.Critical);
		}
	} else {
		if (t.handlers.hasTrigger("asc_onAdvancedOptions")) {
			// ToDo разделитель пока только "," http://bugzilla.onlyoffice.com/show_bug.cgi?id=31009
			var cp = {
				'codepage': AscCommon.c_oAscCodePageUtf8, "delimiter": AscCommon.c_oAscCsvDelimiter.Comma,
				'encodings': AscCommon.getEncodingParams()
			};
			if (data && typeof Blob !== 'undefined' && typeof FileReader !== 'undefined') {
				AscCommon.getJSZipUtils().getBinaryContent(data, function(err, data) {
					if (err) {
						t.handlers.trigger("asc_onError", c_oAscError.ID.Unknown, c_oAscError.Level.Critical);
					} else {
						var dataUint = new Uint8Array(data);
						var bom = AscCommon.getEncodingByBOM(dataUint);
						if (AscCommon.c_oAscCodePageNone !== bom.encoding) {
							cp['codepage'] = bom.encoding;
							data = dataUint.subarray(bom.size);
						}
						cp['data'] = data;
						t.handlers.trigger("asc_onAdvancedOptions", c_oAscAdvancedOptionsID.CSV, new AscCommon.asc_CAdvancedOptions(cp));
					}
				});
			} else {
				t.handlers.trigger("asc_onAdvancedOptions", c_oAscAdvancedOptionsID.CSV, new AscCommon.asc_CAdvancedOptions(cp));
			}
		} else {
			this.asc_setAdvancedOptions(c_oAscAdvancedOptionsID.CSV, new asc.asc_CTextOptions(AscCommon.c_oAscCodePageUtf8, AscCommon.c_oAscCsvDelimiter.Comma));
		}
    }
  };
	spreadsheet_api.prototype._onEndOpen = function() {
		var t = this;
		if (this.openingEnd.bin && this.openingEnd.xlsx) {
			//opening xlsx depends on getBinaryOtherTableGVar(called after Editor.bin)
			this.openDocumentFromZip(t.wbModel, this.openingEnd.data).then(function() {
				g_oIdCounter.Set_Load(false);
				AscCommon.checkCultureInfoFontPicker();
				AscCommonExcel.checkStylesNames(t.wbModel.CellStyles);
				t.FontLoader.LoadDocumentFonts(t.wbModel.generateFontMap2());

				// Какая-то непонятная заглушка, чтобы не падало в ipad
				if (t.isMobileVersion) {
					AscCommon.AscBrowser.isSafariMacOs = false;
					AscCommon.PasteElementsId.PASTE_ELEMENT_ID = "wrd_pastebin";
					AscCommon.PasteElementsId.ELEMENT_DISPAY_STYLE = "none";
				}
			}).catch(function(err) {
				if (window.console && window.console.log) {
					window.console.log(err);
				}
				t.sendEvent('asc_onError', c_oAscError.ID.Unknown, c_oAscError.Level.Critical);
			});
		}
	};
	spreadsheet_api.prototype._openOnClient = function() {
		var t = this;
		if (this.openingEnd.xlsxStart) {
			return;
		}
		this.openingEnd.xlsxStart = true;
		var url = AscCommon.g_oDocumentUrls.getUrl('Editor.xlsx');
		if (url) {
			AscCommon.getJSZipUtils().getBinaryContent(url, function(err, data) {
				if (err) {
					if (window.console && window.console.log) {
						window.console.log(err);
					}
					t.sendEvent('asc_onError', c_oAscError.ID.Unknown, c_oAscError.Level.Critical);
				} else {
					t.openingEnd.xlsx = true;
					t.openingEnd.data = data;
					t._onEndOpen();
				}
			});
		} else {
			t.openingEnd.xlsx = true;
			t._onEndOpen();
		}
	};

  spreadsheet_api.prototype._downloadAs = function(actionType, options, oAdditionalData, dataContainer) {
    var fileType = options.fileType;
    if (c_oAscFileType.PDF === fileType || c_oAscFileType.PDFA === fileType) {
      var printPagesData = this.wb.calcPagesPrint(options.advancedOptions);
      var pdfPrinterMemory = this.wb.printSheets(printPagesData).DocumentRenderer.Memory;
      dataContainer.data = oAdditionalData["nobase64"] ? pdfPrinterMemory.GetData() : pdfPrinterMemory.GetBase64Memory();
    } else {
      var oBinaryFileWriter = new AscCommonExcel.BinaryFileWriter(this.wbModel);
      if (c_oAscFileType.CSV === fileType) {
        if (options.advancedOptions instanceof asc.asc_CTextOptions) {
          oAdditionalData["codepage"] = options.advancedOptions.asc_getCodePage();
          oAdditionalData["delimiter"] = options.advancedOptions.asc_getDelimiter();
          oAdditionalData["delimiterChar"] = options.advancedOptions.asc_getDelimiterChar();
        }
      }
      dataContainer.data = oBinaryFileWriter.Write(oAdditionalData["nobase64"]);
    }

    if (window.isCloudCryptoDownloadAs) {
      var sParamXml = ("<m_nCsvTxtEncoding>" + oAdditionalData["codepage"] + "</m_nCsvTxtEncoding>");
      sParamXml += ("<m_nCsvDelimiter>" + oAdditionalData["delimiter"] + "</m_nCsvDelimiter>");
      window["AscDesktopEditor"]["CryptoDownloadAs"](dataContainer.data, fileType, sParamXml);
      return true;
    }
  };

  spreadsheet_api.prototype.asc_isDocumentModified = function() {
    if (!this.canSave || this.asc_getCellEditMode()) {
      // Пока идет сохранение или редактирование ячейки, мы не закрываем документ
      return true;
    } else if (History && History.Have_Changes) {
      return History.Have_Changes();
    }
    return false;
  };

  // Actions and callbacks interface

  /*
   * asc_onStartAction			(type, id)
   * asc_onEndAction				(type, id)
   * asc_onInitEditorFonts		(gui_fonts)
   * asc_onInitEditorStyles		(gui_styles)
   * asc_onOpenDocumentProgress	(AscCommon.COpenProgress)
   * asc_onAdvancedOptions		(c_oAscAdvancedOptionsID, asc_CAdvancedOptions)			- эвент на получение дополнительных опций (открытие/сохранение CSV)
   * asc_onError				(c_oAscError.ID, c_oAscError.Level)						- эвент об ошибке
   * asc_onEditCell				(Asc.c_oAscCellEditorState)								- эвент на редактирование ячейки с состоянием (переходами из формулы и обратно)
   * asc_onEditorSelectionChanged	(asc_CFont)											- эвент на смену информации о выделении в редакторе ячейки
   * asc_onSelectionChanged		(asc_CCellInfo)										- эвент на смену информации о выделении
   * asc_onSelectionNameChanged	(sName)												- эвент на смену имени выделения (Id-ячейки, число выделенных столбцов/строк, имя диаграммы и др.)
   * asc_onSelection
   *
   * Changed	(asc_CSelectionMathInfo)							- эвент на смену математической информации о выделении
   * asc_onZoomChanged			(zoom)
   * asc_onSheetsChanged			()													- эвент на обновление списка листов
   * asc_onActiveSheetChanged		(indexActiveSheet)									- эвент на обновление активного листа
   * asc_onCanUndoChanged			(bCanUndo)											- эвент на обновление возможности undo
   * asc_onCanRedoChanged			(bCanRedo)											- эвент на обновление возможности redo
   * asc_onSaveUrl				(sUrl, callback(hasError))							- эвент на сохранение файла на сервер по url
   * asc_onDocumentModifiedChanged(bIsModified)										- эвент на обновление статуса "изменен ли файл"
   * asc_onMouseMove				(asc_CMouseMoveData)								- эвент на наведение мышкой на гиперлинк или комментарий
   * asc_onHyperlinkClick			(sUrl)												- эвент на нажатие гиперлинка
   * asc_onCoAuthoringDisconnect	()													- эвент об отключении от сервера без попытки reconnect
   * asc_onSelectionRangeChanged	(selectRange)										- эвент о выборе диапазона для диаграммы (после нажатия кнопки выбора)
   * asc_onRenameCellTextEnd		(countCellsFind, countCellsReplace)					- эвент об окончании замены текста в ячейках (мы не можем сразу прислать ответ)
   * asc_onWorkbookLocked			(result)											- эвент залочена ли работа с листами или нет
   * asc_onWorksheetLocked		(index, result)										- эвент залочен ли лист или нет
   * asc_onGetEditorPermissions	(permission)										- эвент о правах редактора
   * asc_onStopFormatPainter		()													- эвент об окончании форматирования по образцу
   * asc_onUpdateSheetViewSettings	()													- эвент об обновлении свойств листа (закрепленная область, показывать сетку/заголовки)
   * asc_onUpdateTabColor			(index)												- эвент об обновлении цвета иконки листа
   * asc_onDocumentCanSaveChanged	(bIsCanSave)										- эвент об обновлении статуса "можно ли сохранять файл"
   * asc_onDocumentUpdateVersion	(callback)											- эвент о том, что файл собрался и не может больше редактироваться
   * asc_onContextMenu			(event)												- эвент на контекстное меню
   * asc_onDocumentContentReady ()                        - эвент об окончании загрузки документа
   * asc_onFilterInfo	        (countFilter, countRecords)								- send count filtered and all records
   * asc_onLockDocumentProps/asc_onUnLockDocumentProps    - эвент о том, что залочены опции layout
   * asc_onUpdateDocumentProps                            - эвент о том, что необходимо обновить данные во вкладке layout
   * asc_onLockPrintArea/asc_onUnLockPrintArea            - эвент о локе в меню опции print area во вкладке layout
   */

  spreadsheet_api.prototype.asc_registerCallback = function(name, callback, replaceOldCallback) {
    this.handlers.add(name, callback, replaceOldCallback);
  };

  spreadsheet_api.prototype.asc_unregisterCallback = function(name, callback) {
    this.handlers.remove(name, callback);
  };

  spreadsheet_api.prototype.asc_SetDocumentPlaceChangedEnabled = function(val) {
    this.wb.setDocumentPlaceChangedEnabled(val);
  };

  spreadsheet_api.prototype.asc_SetFastCollaborative = function(bFast) {
    if (this.collaborativeEditing) {
      AscCommon.CollaborativeEditing.Set_Fast(bFast);
      this.collaborativeEditing.setFast(bFast);
    }
  };

	spreadsheet_api.prototype.asc_setThumbnailStylesSizes = function (width, height) {
		this.styleThumbnailWidth = width;
		this.styleThumbnailHeight = height;
	};

  // Посылает эвент о том, что обновились листы
  spreadsheet_api.prototype.sheetsChanged = function() {
    this.handlers.trigger("asc_onSheetsChanged");
  };

  spreadsheet_api.prototype.asyncFontsDocumentStartLoaded = function() {
    this.OpenDocumentProgress.Type = c_oAscAsyncAction.LoadDocumentFonts;
    this.OpenDocumentProgress.FontsCount = this.FontLoader.fonts_loading.length;
    this.OpenDocumentProgress.CurrentFont = 0;
    this.sync_StartAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadDocumentFonts);
  };

  spreadsheet_api.prototype.asyncFontsDocumentEndLoaded = function() {
    this.sync_EndAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadDocumentFonts);

    if (this.asyncMethodCallback !== undefined) {
      this.asyncMethodCallback();
      this.asyncMethodCallback = undefined;
    } else {
      // Шрифты загрузились, возможно стоит подождать совместное редактирование
      this.FontLoadWaitComplete = true;
        this._openDocumentEndCallback();
      }
  };

  spreadsheet_api.prototype.asyncFontEndLoaded = function(font) {
    this.sync_EndAction(c_oAscAsyncActionType.Information, c_oAscAsyncAction.LoadFont);
  };

  spreadsheet_api.prototype._loadFonts = function(fonts, callback) {
    if (window["NATIVE_EDITOR_ENJINE"]) {
      return callback();
    }
    this.asyncMethodCallback = callback;
    var arrLoadFonts = [];
    for (var i in fonts)
      arrLoadFonts.push(new AscFonts.CFont(i, 0, "", 0));
    AscFonts.FontPickerByCharacter.extendFonts(arrLoadFonts);
    this.FontLoader.LoadDocumentFonts2(arrLoadFonts);
  };

  spreadsheet_api.prototype.openDocument = function(file) {
	this._openDocument(file.data);
	this._openOnClient();
  };
	spreadsheet_api.prototype.openDocumentFromZip = function (wb, data) {
		var t = this;
		return new Promise(function (resolve, reject) {
			var openXml = AscCommon.openXml;
			//open cache xlsx instead of documentUrl, to support pivot in xls, ods... and don't send jwt signature
			if (t.isChartEditor) {
				resolve();
				return;
			}
			var nextPromise;
			if (data) {
				var doc = new openXml.OpenXmlPackage();
				var wbPart = null;
				var wbXml = null;
				var pivotCaches = {};
				var jsZipWrapper = new AscCommon.JSZipWrapper();
				nextPromise = jsZipWrapper.loadAsync(data).then(function (zip) {
					return doc.openFromZip(zip);
				}).then(function () {
					wbPart = doc.getPartByRelationshipType(openXml.relationshipTypes.workbook);
					return wbPart.getDocumentContent();
				}).then(function (contentWorkbook) {
					wbXml = new AscCommonExcel.CT_Workbook();
					new openXml.SaxParserBase().parse(contentWorkbook, wbXml);
					if (wbXml.pivotCaches) {
						return wbXml.pivotCaches.reduce(function (prevVal, wbPivotCacheXml) {
							var pivotTableCacheDefinitionPart;
							var pivotTableCacheDefinition;
							return prevVal.then(function () {
								if (null !== wbPivotCacheXml.cacheId && null !== wbPivotCacheXml.id) {
									pivotTableCacheDefinitionPart = wbPart.getPartById(wbPivotCacheXml.id);
									return pivotTableCacheDefinitionPart.getDocumentContent();
								}
							}).then(function (content) {
								if (content) {
									pivotTableCacheDefinition = new Asc.CT_PivotCacheDefinition();
									new openXml.SaxParserBase().parse(content, pivotTableCacheDefinition);
									if (pivotTableCacheDefinition.isValidCacheSource()) {
										pivotCaches[wbPivotCacheXml.cacheId] = pivotTableCacheDefinition;
										if (pivotTableCacheDefinition.id) {
											var partPivotTableCacheRecords = pivotTableCacheDefinitionPart.getPartById(
												pivotTableCacheDefinition.id);
											return partPivotTableCacheRecords.getDocumentContent();
										}
									}
								}
							}).then(function (content) {
								if (content) {
									var pivotTableCacheRecords = new Asc.CT_PivotCacheRecords();
									new openXml.SaxParserBase().parse(content, pivotTableCacheRecords);
									pivotTableCacheDefinition.cacheRecords = pivotTableCacheRecords;
								}
							});
						}, Promise.resolve());
					}
				}).then(function () {
					if (wbXml.sheets) {
						var wsIndex = 0;
						return wbXml.sheets.reduce(function (prevVal, wbSheetXml) {
							var wsPart;
							return prevVal.then(function () {
								if (null !== wbSheetXml.id) {
									var actions = [];
									wsPart = wbPart.getPartById(wbSheetXml.id);
									var pivotParts = wsPart.getPartsByRelationshipType(
										openXml.relationshipTypes.pivotTable);
									for (var i = 0; i < pivotParts.length; ++i) {
										actions.push(pivotParts[i].getDocumentContent());
									}
									return Promise.all(actions);
								}
							}).then(function (res) {
								if (res) {
									var ws = t.wbModel.getWorksheet(wsIndex);
									for (var i = 0; i < res.length; ++i) {
										var pivotTable = new Asc.CT_pivotTableDefinition();
										new openXml.SaxParserBase().parse(res[i], pivotTable);
										var cacheDefinition = pivotCaches[pivotTable.cacheId];
										if (cacheDefinition) {
											pivotTable.cacheDefinition = cacheDefinition;
											ws.insertPivotTable(pivotTable);
										}
									}
								}
								wsIndex++;
							});
						}, Promise.resolve());
					}
				}).catch(function (err) {
					//don't show error.(case of open xls, ods, csv)
					if (window.console && window.console.log) {
						window.console.log(err);
					}
				}).then(function () {
					jsZipWrapper.close();
				});
			} else {
				nextPromise = Promise.resolve();
			}
			nextPromise.then(function (err) {
				//clean up
				openXml.SaxParserDataTransfer = {};
				return Asc.ReadDefTableStyles(wb);
			}).then(resolve, reject);
		});
	};

  // Эвент о пришедщих изменениях
  spreadsheet_api.prototype.syncCollaborativeChanges = function() {
    // Для быстрого сохранения уведомлять не нужно.
    if (!this.collaborativeEditing.getFast()) {
      this.handlers.trigger("asc_onCollaborativeChanges");
    }
  };

  // Применение изменений документа, пришедших при открытии
  // Их нужно применять после того, как мы создали WorkbookView
  // т.к. автофильтры, диаграммы, изображения и комментарии завязаны на WorksheetView (ToDo переделать)
  spreadsheet_api.prototype._applyFirstLoadChanges = function() {
    if (this.isDocumentLoadComplete) {
      return;
    }
    if (this.collaborativeEditing.applyChanges()) {
      // Изменений не было
      this.onDocumentContentReady();
    }
    // Пересылаем свои изменения (просто стираем чужие lock-и, т.к. своих изменений нет)
    this.collaborativeEditing.sendChanges();
  };

  // GoTo
  spreadsheet_api.prototype.goTo = function(action) {
    var comment = this.wbModel.getComment(action && action['data']);
    if (comment) {
      this.asc_showWorksheet(this.wbModel.getWorksheetById(comment.wsId).getIndex());
      this.asc_selectComment(comment.nId);
      this.asc_showComment(comment.nId);
    }
  };

  /////////////////////////////////////////////////////////////////////////
  ///////////////////CoAuthoring and Chat api//////////////////////////////
  /////////////////////////////////////////////////////////////////////////
  spreadsheet_api.prototype._coAuthoringInitEnd = function() {
    var t = this;
    this.collaborativeEditing = new AscCommonExcel.CCollaborativeEditing(/*handlers*/{
      "askLock": function() {
        t.CoAuthoringApi.askLock.apply(t.CoAuthoringApi, arguments);
      },
      "releaseLocks": function() {
        t.CoAuthoringApi.releaseLocks.apply(t.CoAuthoringApi, arguments);
      },
      "sendChanges": function() {
        t._onSaveChanges.apply(t, arguments);
      },
      "applyChanges": function() {
        t._onApplyChanges.apply(t, arguments);
      },
      "updateAfterApplyChanges": function() {
        t._onUpdateAfterApplyChanges.apply(t, arguments);
      },
      "drawSelection": function() {
        t._onDrawSelection.apply(t, arguments);
      },
      "drawFrozenPaneLines": function() {
        t._onDrawFrozenPaneLines.apply(t, arguments);
      },
      "updateAllSheetsLock": function() {
        t._onUpdateAllSheetsLock.apply(t, arguments);
      },
      "showDrawingObjects": function() {
        t._onShowDrawingObjects.apply(t, arguments);
      },
      "showComments": function() {
        t._onShowComments.apply(t, arguments);
      },
      "cleanSelection": function() {
        t._onCleanSelection.apply(t, arguments);
      },
      "updateDocumentCanSave": function() {
        t._onUpdateDocumentCanSave();
      },
      "checkCommentRemoveLock": function(lockElem) {
        return t._onCheckCommentRemoveLock(lockElem);
      },
      "unlockDefName": function() {
        t._onUnlockDefName.apply(t, arguments);
      },
      "checkDefNameLock": function(lockElem) {
        return t._onCheckDefNameLock(lockElem);
      },
      "updateAllLayoutsLock": function() {
          t._onUpdateAllLayoutsLock.apply(t, arguments);
      },
      "updateAllHeaderFooterLock": function() {
          t._onUpdateAllHeaderFooterLock.apply(t, arguments);
      },
      "updateAllPrintScaleLock": function() {
          t._onUpdateAllPrintScaleLock.apply(t, arguments);
      }
    }, this.getViewMode());

    this.CoAuthoringApi.onConnectionStateChanged = function(e) {
      t.handlers.trigger("asc_onConnectionStateChanged", e);
    };
    this.CoAuthoringApi.onLocksAcquired = function(e) {
      if (t._coAuthoringCheckEndOpenDocument(t.CoAuthoringApi.onLocksAcquired, e)) {
        return;
      }

      if (2 != e["state"]) {
        var elementValue = e["blockValue"];
        var lockElem = t.collaborativeEditing.getLockByElem(elementValue, c_oAscLockTypes.kLockTypeOther);
        if (null === lockElem) {
          lockElem = new AscCommonExcel.CLock(elementValue);
          t.collaborativeEditing.addUnlock(lockElem);
        }

        var drawing, lockType = lockElem.Element["type"];
        var oldType = lockElem.getType();
        if (c_oAscLockTypes.kLockTypeOther2 === oldType || c_oAscLockTypes.kLockTypeOther3 === oldType) {
          lockElem.setType(c_oAscLockTypes.kLockTypeOther3, true);
        } else {
          lockElem.setType(c_oAscLockTypes.kLockTypeOther, true);
        }

        // Выставляем ID пользователя, залочившего данный элемент
        lockElem.setUserId(e["user"]);

        if (lockType === c_oAscLockTypeElem.Object) {
          drawing = g_oTableId.Get_ById(lockElem.Element["rangeOrObjectId"]);
          if (drawing) {
            var bLocked, bLocked2;
            bLocked = drawing.lockType !== c_oAscLockTypes.kLockTypeNone && drawing.lockType !== c_oAscLockTypes.kLockTypeMine;

            drawing.lockType = lockElem.Type;

            if(drawing instanceof AscCommon.CCore) {
              bLocked2 = drawing.lockType !== c_oAscLockTypes.kLockTypeNone && drawing.lockType !== c_oAscLockTypes.kLockTypeMine;
              if(bLocked2 !== bLocked) {
                t.sendEvent("asc_onLockCore", bLocked2);
              }
            }
          }
        }

        if (t.wb) {
          // Шлем update для toolbar-а, т.к. когда select в lock ячейке нужно заблокировать toolbar
          t.wb._onWSSelectionChanged();

          // Шлем update для листов
          t._onUpdateSheetsLock(lockElem);

          t._onUpdateDefinedNames(lockElem);

          //эвент о локе в меню вкладки layout(кроме print area)
          t._onUpdateLayoutLock(lockElem);
          //эвент о локе в меню опции print area во вкладке layout
          t._onUpdatePrintAreaLock(lockElem);
          //эвент о локе в меню опции headers/footers во вкладке layout
          t._onUpdateHeaderFooterLock(lockElem);
          //эвент о локе в меню опции scale во вкладке layout
          t._onUpdatePrintScaleLock(lockElem);



          var ws = t.wb.getWorksheet();
          var lockSheetId = lockElem.Element["sheetId"];
          if (lockSheetId === ws.model.getId()) {
            if (lockType === c_oAscLockTypeElem.Object) {
              // Нужно ли обновлять закрепление областей
              if (t._onUpdateFrozenPane(lockElem)) {
                ws.draw();
              } else if (drawing && ws.model === drawing.worksheet) {
                if (ws.objectRender) {
                  ws.objectRender.showDrawingObjects(true);
                }
              }
            } else if (lockType === c_oAscLockTypeElem.Range || lockType === c_oAscLockTypeElem.Sheet) {
              ws.updateSelection();
            }
          } else if (-1 !== lockSheetId && 0 === lockSheetId.indexOf(AscCommonExcel.CCellCommentator.sStartCommentId)) {
            // Коммментарий
            t.handlers.trigger("asc_onLockComment", lockElem.Element["rangeOrObjectId"], e["user"]);
          }
        }
      }
    };
    this.CoAuthoringApi.onLocksReleased = function(e, bChanges) {
      if (t._coAuthoringCheckEndOpenDocument(t.CoAuthoringApi.onLocksReleased, e, bChanges)) {
        return;
      }

      var element = e["block"];
      var lockElem = t.collaborativeEditing.getLockByElem(element, c_oAscLockTypes.kLockTypeOther);
      if (null != lockElem) {
        var curType = lockElem.getType();

        var newType = c_oAscLockTypes.kLockTypeNone;
        if (curType === c_oAscLockTypes.kLockTypeOther) {
          if (true != bChanges) {
            newType = c_oAscLockTypes.kLockTypeNone;
          } else {
            newType = c_oAscLockTypes.kLockTypeOther2;
          }
        } else if (curType === c_oAscLockTypes.kLockTypeMine) {
          // Такого быть не должно
          newType = c_oAscLockTypes.kLockTypeMine;
        } else if (curType === c_oAscLockTypes.kLockTypeOther2 || curType === c_oAscLockTypes.kLockTypeOther3) {
          newType = c_oAscLockTypes.kLockTypeOther2;
        }

        if (t.wb) {
          t.wb.getWorksheet().cleanSelection();
        }

        var drawing;
        if (c_oAscLockTypes.kLockTypeNone !== newType) {
          lockElem.setType(newType, true);
        } else {
          // Удаляем из lock-ов, тот, кто правил ушел и не сохранил
          t.collaborativeEditing.removeUnlock(lockElem);
          if (!t._onCheckCommentRemoveLock(lockElem.Element)) {
            if (lockElem.Element["type"] === c_oAscLockTypeElem.Object) {
              drawing = g_oTableId.Get_ById(lockElem.Element["rangeOrObjectId"]);
              if (drawing) {
                var bLocked = drawing.lockType !== c_oAscLockTypes.kLockTypeNone && drawing.lockType !== c_oAscLockTypes.kLockTypeMine;
                drawing.lockType = c_oAscLockTypes.kLockTypeNone;
                if(drawing instanceof AscCommon.CCore) {
                  if(bLocked){
                    t.sendEvent("asc_onLockCore", false);
                  }
                }
              }
            }
          }
        }
        if (t.wb) {
          // Шлем update для листов
          t._onUpdateSheetsLock(lockElem);
          /*снимаем лок для DefName*/
          t.handlers.trigger("asc_onLockDefNameManager",Asc.c_oAscDefinedNameReason.OK);
          //эвент о локе в меню вкладки layout
          t._onUpdateLayoutLock(lockElem);
          //эвент о локе в меню опции print area во вкладке layout
          t._onUpdatePrintAreaLock(lockElem);
          //эвент о локе в меню опции headers/footers во вкладке layout
          t._onUpdateHeaderFooterLock(lockElem);
          //эвент о локе в меню опции scale во вкладке layout
          t._onUpdatePrintScaleLock(lockElem);
        }
      }
    };
    this.CoAuthoringApi.onLocksReleasedEnd = function() {
      if (!t.isDocumentLoadComplete) {
        // Пока документ еще не загружен ничего не делаем
        return;
      }

      if (t.wb) {
        // Шлем update для toolbar-а, т.к. когда select в lock ячейке нужно сбросить блокировку toolbar
        t.wb._onWSSelectionChanged();

        var worksheet = t.wb.getWorksheet();
        worksheet.cleanSelection();
        worksheet._drawSelection();
        worksheet._drawFrozenPaneLines();
        if (worksheet.objectRender) {
          worksheet.objectRender.showDrawingObjects(true);
        }
      }
    };
    this.CoAuthoringApi.onSaveChanges = function(e, userId, bFirstLoad) {
      t.collaborativeEditing.addChanges(e);
      if (!bFirstLoad && t.isDocumentLoadComplete) {
        t.syncCollaborativeChanges();
      }
    };
    this.CoAuthoringApi.onRecalcLocks = function(excelAdditionalInfo) {
      if (!excelAdditionalInfo) {
        return;
      }

      var tmpAdditionalInfo = JSON.parse(excelAdditionalInfo);
      // Это мы получили recalcIndexColumns и recalcIndexRows
      var oRecalcIndexColumns = t.collaborativeEditing.addRecalcIndex('0', tmpAdditionalInfo['indexCols']);
      var oRecalcIndexRows = t.collaborativeEditing.addRecalcIndex('1', tmpAdditionalInfo['indexRows']);

      // Теперь нужно пересчитать индексы для lock-элементов
      if (null !== oRecalcIndexColumns || null !== oRecalcIndexRows) {
        t.collaborativeEditing._recalcLockArray(c_oAscLockTypes.kLockTypeMine, oRecalcIndexColumns, oRecalcIndexRows);
        t.collaborativeEditing._recalcLockArray(c_oAscLockTypes.kLockTypeOther, oRecalcIndexColumns, oRecalcIndexRows);
      }
    };
	  };

  spreadsheet_api.prototype._onSaveChanges = function(recalcIndexColumns, recalcIndexRows, isAfterAskSave) {
    if (this.isDocumentLoadComplete) {
      var arrChanges = this.wbModel.SerializeHistory();
      var deleteIndex = History.GetDeleteIndex();
      var excelAdditionalInfo = null;
      var bCollaborative = this.collaborativeEditing.getCollaborativeEditing();
      if (bCollaborative) {
        // Пересчетные индексы добавляем только если мы не одни
        if (recalcIndexColumns || recalcIndexRows) {
          excelAdditionalInfo = {"indexCols": recalcIndexColumns, "indexRows": recalcIndexRows};
        }
      }
      if (0 < arrChanges.length || null !== deleteIndex || null !== excelAdditionalInfo) {
        this.CoAuthoringApi.saveChanges(arrChanges, deleteIndex, excelAdditionalInfo, this.canUnlockDocument2, bCollaborative);
        History.CanNotAddChanges = true;
      } else {
        this.CoAuthoringApi.unLockDocument(!!isAfterAskSave, this.canUnlockDocument2, null, bCollaborative);
      }
      this.canUnlockDocument2 = false;
    }
  };

  spreadsheet_api.prototype._onApplyChanges = function(changes, fCallback) {
    this.wbModel.DeserializeHistory(changes, fCallback);
  };

  spreadsheet_api.prototype._onUpdateAfterApplyChanges = function() {
    if (!this.isDocumentLoadComplete) {
      // При открытии после принятия изменений мы должны сбросить пересчетные индексы
      this.collaborativeEditing.clearRecalcIndex();
      this.onDocumentContentReady();
    } else if (this.wb && !window["NATIVE_EDITOR_ENJINE"]) {
      // Нужно послать 'обновить свойства' (иначе для удаления данных не обновится строка формул).
      // ToDo Возможно стоит обновлять только строку формул
      AscCommon.CollaborativeEditing.Load_Images();
      this.wb._onWSSelectionChanged();
      History.TurnOff();
      this.wb.drawWorksheet();
      History.TurnOn();
    }
  };

  spreadsheet_api.prototype._onCleanSelection = function() {
    if (this.wb) {
      this.wb.getWorksheet().cleanSelection();
    }
  };

  spreadsheet_api.prototype._onDrawSelection = function() {
    if (this.wb) {
      this.wb.getWorksheet()._drawSelection();
    }
  };

  spreadsheet_api.prototype._onDrawFrozenPaneLines = function() {
    if (this.wb) {
      this.wb.getWorksheet()._drawFrozenPaneLines();
    }
  };

	spreadsheet_api.prototype._onUpdateAllSheetsLock = function () {
		if (this.wbModel) {
			// Шлем update для листов
			this.handlers.trigger("asc_onWorkbookLocked", this.asc_isWorkbookLocked());
			var i, length, wsModel, wsIndex;
			for (i = 0, length = this.wbModel.getWorksheetCount(); i < length; ++i) {
				wsModel = this.wbModel.getWorksheet(i);
				wsIndex = wsModel.getIndex();
				this.handlers.trigger("asc_onWorksheetLocked", wsIndex, this.asc_isWorksheetLockedOrDeleted(wsIndex));
			}
		}
	};

  spreadsheet_api.prototype._onUpdateAllLayoutsLock = function () {
      var t = this;
      if (t.wbModel) {
          var i, length, wsModel, wsIndex;
          for (i = 0, length = t.wbModel.getWorksheetCount(); i < length; ++i) {
              wsModel = t.wbModel.getWorksheet(i);
              wsIndex = wsModel.getIndex();

              var isLocked = t.asc_isLayoutLocked(wsIndex);
              if (isLocked) {
                  t.handlers.trigger("asc_onLockDocumentProps", wsIndex);
              } else {
                  t.handlers.trigger("asc_onUnLockDocumentProps", wsIndex);
              }
          }
      }
  };

  spreadsheet_api.prototype._onUpdateAllHeaderFooterLock = function () {
      var t = this;
      if (t.wbModel) {
          var i, length, wsModel, wsIndex;
          for (i = 0, length = t.wbModel.getWorksheetCount(); i < length; ++i) {
              wsModel = t.wbModel.getWorksheet(i);
              wsIndex = wsModel.getIndex();

              var isLocked = t.asc_isLayoutLocked(wsIndex);
              if (isLocked) {
                  t.handlers.trigger("asc_onLockHeaderFooter", wsIndex);
              } else {
                  t.handlers.trigger("asc_onUnLockHeaderFooter", wsIndex);
              }
          }
      }
  };

	spreadsheet_api.prototype._onUpdateAllPrintScaleLock = function () {
		var t = this;
		if (t.wbModel) {
			var i, length, wsModel, wsIndex;
			for (i = 0, length = t.wbModel.getWorksheetCount(); i < length; ++i) {
				wsModel = t.wbModel.getWorksheet(i);
				wsIndex = wsModel.getIndex();

				var isLocked = t.asc_isLayoutLocked(wsIndex);
				if (isLocked) {
					t.handlers.trigger("asc_onLockPrintScale", wsIndex);
				} else {
					t.handlers.trigger("asc_onUnLockPrintScale", wsIndex);
				}
			}
		}
	};

  spreadsheet_api.prototype._onUpdateLayoutMenu = function (nSheetId) {
      var t = this;
      if (t.wbModel) {
          var wsModel = t.wbModel.getWorksheetById(nSheetId);
          if (wsModel) {
              var wsIndex = wsModel.getIndex();
              t.handlers.trigger("asc_onUpdateDocumentProps", wsIndex);
          }
      }
  };

  spreadsheet_api.prototype._onShowDrawingObjects = function() {
    if (this.wb) {
      var ws = this.wb.getWorksheet();
      if (ws && ws.objectRender) {
        ws.objectRender.showDrawingObjects(true);
      }
    }
  };

  spreadsheet_api.prototype._onShowComments = function() {
    if (this.wb) {
      this.wb.getWorksheet().cellCommentator.drawCommentCells();
    }
  };

	spreadsheet_api.prototype._onUpdateSheetsLock = function (lockElem) {
		// Шлем update для листов, т.к. нужно залочить лист
		if (c_oAscLockTypeElem.Sheet === lockElem.Element["type"]) {
			this._onUpdateAllSheetsLock();
		} else {
			// Шлем update для листа
			var wsModel = this.wbModel.getWorksheetById(lockElem.Element["sheetId"]);
			if (wsModel) {
				var wsIndex = wsModel.getIndex();
				this.handlers.trigger("asc_onWorksheetLocked", wsIndex, this.asc_isWorksheetLockedOrDeleted(wsIndex));
			}
		}
	};

  spreadsheet_api.prototype._onUpdateLayoutLock = function(lockElem) {
      var t = this;

      var wsModel = t.wbModel.getWorksheetById(lockElem.Element["sheetId"]);
      if (wsModel) {
          var wsIndex = wsModel.getIndex();

          var isLocked = t.asc_isLayoutLocked(wsIndex);
          if(isLocked) {
			  t.handlers.trigger("asc_onLockDocumentProps", wsIndex);
          } else {
			  t.handlers.trigger("asc_onUnLockDocumentProps", wsIndex);
          }
      }
  };

  spreadsheet_api.prototype._onUpdatePrintAreaLock = function(lockElem) {
      var t = this;

	  var wsModel = t.wbModel.getWorksheetById(lockElem.Element["sheetId"]);
	  var wsIndex = wsModel? wsModel.getIndex() : undefined;

      var isLocked = t.asc_isPrintAreaLocked(wsIndex);
      if(isLocked) {
          t.handlers.trigger("asc_onLockPrintArea");
      } else {
          t.handlers.trigger("asc_onUnLockPrintArea");
      }
  };

  spreadsheet_api.prototype._onUpdateHeaderFooterLock = function(lockElem) {
      var t = this;

      var wsModel = t.wbModel.getWorksheetById(lockElem.Element["sheetId"]);
      if (wsModel) {
          var wsIndex = wsModel.getIndex();

          var isLocked = t.asc_isHeaderFooterLocked();
          if(isLocked) {
              t.handlers.trigger("asc_onLockHeaderFooter");
          } else {
              t.handlers.trigger("asc_onUnLockHeaderFooter");
          }
      }
  };

  spreadsheet_api.prototype._onUpdatePrintScaleLock = function(lockElem) {
      var t = this;

      var wsModel = t.wbModel.getWorksheetById(lockElem.Element["sheetId"]);
      if (wsModel) {
          var wsIndex = wsModel.getIndex();

          var isLocked = t.asc_isPrintScaleLocked();
          if(isLocked) {
              t.handlers.trigger("asc_onLockPrintScale");
          } else {
              t.handlers.trigger("asc_onUnLockPrintScale");
          }
      }
  };

  spreadsheet_api.prototype._onUpdateFrozenPane = function(lockElem) {
    return (c_oAscLockTypeElem.Object === lockElem.Element["type"] && lockElem.Element["rangeOrObjectId"] === AscCommonExcel.c_oAscLockNameFrozenPane);
  };

  spreadsheet_api.prototype._sendWorkbookStyles = function () {
    // Для нативной версии (сборка и приложение) не генерируем стили
    if (this.wbModel && !window["NATIVE_EDITOR_ENJINE"]) {
      // Отправка стилей ячеек
      this.handlers.trigger("asc_onInitEditorStyles", this.wb.getCellStyles(this.styleThumbnailWidth, this.styleThumbnailHeight));
    }
  };

  spreadsheet_api.prototype.startCollaborationEditing = function() {
    // Начинаем совместное редактирование
    this.collaborativeEditing.startCollaborationEditing();

	  if (this.isDocumentLoadComplete) {
		  var worksheet = this.wb.getWorksheet();
		  worksheet.cleanSelection();
		  worksheet._drawSelection();
		  worksheet._drawFrozenPaneLines();
		  if (worksheet.objectRender) {
			  worksheet.objectRender.showDrawingObjects(true);
		  }
	  }
  };

  spreadsheet_api.prototype.endCollaborationEditing = function() {
    // Временно заканчиваем совместное редактирование
    this.collaborativeEditing.endCollaborationEditing();
  };

	// End Load document
	spreadsheet_api.prototype._openDocumentEndCallback = function () {
		// Не инициализируем дважды
		if (this.isDocumentLoadComplete || !this.ServerIdWaitComplete || !this.FontLoadWaitComplete) {
			return;
		}

        if (AscCommon.EncryptionWorker)
        {
            AscCommon.EncryptionWorker.init();
            if (!AscCommon.EncryptionWorker.isChangesHandled)
                return AscCommon.EncryptionWorker.handleChanges(this.collaborativeEditing.m_arrChanges, this, this._openDocumentEndCallback);
        }

		if (0 === this.wbModel.getWorksheetCount()) {
			this.sendEvent("asc_onError", c_oAscError.ID.ConvertationOpenError, c_oAscError.Level.Critical);
			return;
        }

		this.wb = new AscCommonExcel.WorkbookView(this.wbModel, this.controller, this.handlers, this.HtmlElement,
			this.topLineEditorElement, this, this.collaborativeEditing, this.fontRenderingMode);

		if (this.isMobileVersion) {
			this.wb.defaults.worksheetView.halfSelection = true;
			this.wb.defaults.worksheetView.activeCellBorderColor = new CColor(79, 158, 79);
			var _container = document.getElementById(this.HtmlElementName);
			if (_container) {
				_container.style.overflow = "hidden";
			}
			this.wb.MobileTouchManager = new AscCommonExcel.CMobileTouchManager({eventsElement: "cell_mobile_element"});
			this.wb.MobileTouchManager.Init(this);

			// input context must be created!!!
			var _areaId = AscCommon.g_inputContext.HtmlArea.id;
			var _element = document.getElementById(_areaId);
			_element.parentNode.parentNode.style.zIndex = 10;

			this.wb.MobileTouchManager.initEvents(AscCommon.g_inputContext.HtmlArea.id);
		}

		this.asc_CheckGuiControlColors();
		this.sendColorThemes(this.wbModel.theme);
		this.asc_ApplyColorScheme(false);

		this.sendStandartTextures();
		this.sendMathToMenu();

		this._applyPreOpenLocks();
		// Применяем пришедшие при открытии изменения
		this._applyFirstLoadChanges();
		// Go to if sent options
		var options = this.DocInfo && this.DocInfo.asc_getOptions();
		this.goTo(options && options["action"]);

		// Меняем тип состояния (на никакое)
		this.advancedOptionsAction = c_oAscAdvancedOptionsAction.None;

		// Были ошибки при открытии, посылаем предупреждение
		if (0 < this.wbModel.openErrors.length) {
			this.sendEvent('asc_onError', c_oAscError.ID.OpenWarning, c_oAscError.Level.NoCritical);
		}

		//this.asc_Resize(); // Убрал, т.к. сверху приходит resize (http://bugzilla.onlyoffice.com/show_bug.cgi?id=14680)
	};

	// Переход на диапазон в листе
	spreadsheet_api.prototype._asc_setWorksheetRange = function (val) {
		// Получаем sheet по имени
		var ranges = null, ws;
        var sheet = val.asc_getSheet();
        if (!sheet) {
			ranges = AscCommonExcel.getRangeByRef(val.asc_getLocation(), this.wbModel.getActiveWs(), true);
			if (ranges = ranges[0]) {
				ws = ranges.worksheet;
            }
        } else {
			ws = this.wbModel.getWorksheetByName(sheet);
        }
		if (!ws) {
			this.handlers.trigger("asc_onHyperlinkClick", null);
			return;
		} else if (ws.getHidden()) {
			return;
		}
		// Индекс листа
		var sheetIndex = ws.getIndex();
		// Если не совпали индекс листа и индекс текущего, то нужно сменить
		if (this.asc_getActiveWorksheetIndex() !== sheetIndex) {
			// Меняем активный лист
			this.asc_showWorksheet(sheetIndex);
		}
		var range;
		if (ranges) {
			range = ranges.bbox;
        } else {
			range = ws.getRange2(val.asc_getRange());
			if (range) {
				range = range.getBBox0();
            }
        }
		this.wb._onSetSelection(range, /*validRange*/ true);
	};

	spreadsheet_api.prototype._onSaveCallbackInner = function () {
		var t = this;
		AscCommon.CollaborativeEditing.Clear_CollaborativeMarks();
		// Принимаем чужие изменения
		this.collaborativeEditing.applyChanges();

		this.CoAuthoringApi.onUnSaveLock = function () {
			t.CoAuthoringApi.onUnSaveLock = null;
			if (t.isForceSaveOnUserSave && t.IsUserSave) {
				t.forceSaveButtonContinue = t.forceSave();
			}

			if (t.collaborativeEditing.getCollaborativeEditing()) {
				// Шлем update для toolbar-а, т.к. когда select в lock ячейке нужно заблокировать toolbar
				t.wb._onWSSelectionChanged();
			}

			t.canSave = true;
			t.IsUserSave = false;
			t.lastSaveTime = null;

			if (!t.forceSaveButtonContinue) {
				t.sync_EndAction(c_oAscAsyncActionType.Information, c_oAscAsyncAction.Save);
			}
			// Обновляем состояние возможности сохранения документа
			t.onUpdateDocumentModified(History.Have_Changes());

			if (undefined !== window["AscDesktopEditor"]) {
				window["AscDesktopEditor"]["OnSave"]();
			}
			if (t.disconnectOnSave) {
				t.CoAuthoringApi.disconnect(t.disconnectOnSave.code, t.disconnectOnSave.reason);
				t.disconnectOnSave = null;
			}

			if (t.canUnlockDocument) {
				t._unlockDocument();
			}
		};
		// Пересылаем свои изменения
		this.collaborativeEditing.sendChanges(this.IsUserSave, true);
	};

  spreadsheet_api.prototype._isLockedSparkline = function (id, callback) {
    var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, /*subType*/null,
        this.asc_getActiveWorksheetId(), id);
    this.collaborativeEditing.lock([lockInfo], callback);
  };

	spreadsheet_api.prototype._isLockedPivot = function (pivotName, callback) {
		var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, /*subType*/null,
			this.asc_getActiveWorksheetId(), pivotName);
		this.collaborativeEditing.lock([lockInfo], callback);
	};

  spreadsheet_api.prototype._addWorksheets = function (arrNames, where) {
    // Проверка глобального лока
    if (this.collaborativeEditing.getGlobalLock()) {
      return false;
    }

    var t = this;
    var addWorksheetCallback = function(res) {
      if (res) {
        History.Create_NewPoint();
        History.StartTransaction();
        for (var i = arrNames.length - 1; i >= 0; --i) {
          t.wbModel.createWorksheet(where, arrNames[i]);
        }
        t.wbModel.setActive(where);
        t.wb.updateWorksheetByModel();
        t.wb.showWorksheet();
        History.EndTransaction();
        // Посылаем callback об изменении списка листов
        t.sheetsChanged();
      }
    };

    var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Sheet, /*subType*/null,
      AscCommonExcel.c_oAscLockAddSheet, AscCommonExcel.c_oAscLockAddSheet);
    this.collaborativeEditing.lock([lockInfo], addWorksheetCallback);
  };

  // Workbook interface

  spreadsheet_api.prototype.asc_getWorksheetsCount = function() {
    return this.wbModel.getWorksheetCount();
  };

  spreadsheet_api.prototype.asc_getWorksheetName = function(index) {
    return this.wbModel.getWorksheet(index).getName();
  };

  spreadsheet_api.prototype.asc_getWorksheetTabColor = function(index) {
    return this.wbModel.getWorksheet(index).getTabColor();
  };
  spreadsheet_api.prototype.asc_setWorksheetTabColor = function(color, arrSheets) {
    // Проверка глобального лока
    if (this.collaborativeEditing.getGlobalLock()) {
      return false;
    }

    if (!arrSheets) {
      arrSheets = [this.wbModel.getActive()];
    }

    var sheet, arrLocks = [];
    for (var i = 0; i < arrSheets.length; ++i) {
      sheet = this.wbModel.getWorksheet(arrSheets[i]);
      arrLocks.push(this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, /*subType*/null, sheet.getId(), AscCommonExcel.c_oAscLockNameTabColor));
    }

    var t = this;
    var changeTabColorCallback = function(res) {
      if (res) {
        color = AscCommonExcel.CorrectAscColor(color);
        History.Create_NewPoint();
        History.StartTransaction();
        for (var i = 0; i < arrSheets.length; ++i) {
          t.wbModel.getWorksheet(arrSheets[i]).setTabColor(color);
        }
        History.EndTransaction();
      }
    };
    this.collaborativeEditing.lock(arrLocks, changeTabColorCallback);
  };

  spreadsheet_api.prototype.asc_getActiveWorksheetIndex = function() {
    return this.wbModel.getActive();
  };

  spreadsheet_api.prototype.asc_getActiveWorksheetId = function() {
    var activeIndex = this.wbModel.getActive();
    return this.wbModel.getWorksheet(activeIndex).getId();
  };

  spreadsheet_api.prototype.asc_getWorksheetId = function(index) {
    return this.wbModel.getWorksheet(index).getId();
  };

  spreadsheet_api.prototype.asc_isWorksheetHidden = function(index) {
    return this.wbModel.getWorksheet(index).getHidden();
  };

  spreadsheet_api.prototype.asc_getDefinedNames = function(defNameListId) {
    return this.wb.getDefinedNames(defNameListId);
  };

  spreadsheet_api.prototype.asc_setDefinedNames = function(defName) {
//            return this.wb.setDefinedNames(defName);
    // Проверка глобального лока
    if (this.collaborativeEditing.getGlobalLock()) {
      return;
    }
    return this.wb.editDefinedNames(null, defName);
  };

  spreadsheet_api.prototype.asc_editDefinedNames = function(oldName, newName) {
    // Проверка глобального лока
    if (this.collaborativeEditing.getGlobalLock()) {
      return;
    }

    return this.wb.editDefinedNames(oldName, newName);
  };

  spreadsheet_api.prototype.asc_delDefinedNames = function(oldName) {
    // Проверка глобального лока
    if (this.collaborativeEditing.getGlobalLock()) {
      return;
    }
    return this.wb.delDefinedNames(oldName);
  };

  spreadsheet_api.prototype.asc_checkDefinedName = function(checkName, scope) {
    return this.wbModel.checkDefName(checkName, scope);
  };

  spreadsheet_api.prototype.asc_getDefaultDefinedName = function() {
    return this.wb.getDefaultDefinedName();
  };

  spreadsheet_api.prototype.asc_getDefaultTableStyle = function() {
      return this.wb.getDefaultTableStyle();
  };

  spreadsheet_api.prototype._onUpdateDefinedNames = function(lockElem) {
//      if( lockElem.Element["subType"] == AscCommonExcel.c_oAscLockTypeElemSubType.DefinedNames ){
      if( lockElem.Element["sheetId"] == -1 && lockElem.Element["rangeOrObjectId"] != -1 && !this.collaborativeEditing.getFast() ){
          var dN = this.wbModel.dependencyFormulas.getDefNameByNodeId(lockElem.Element["rangeOrObjectId"]);
          if (dN) {
              dN.isLock = lockElem.UserId;
              this.handlers.trigger("asc_onRefreshDefNameList",dN.getAscCDefName());
          }
          this.handlers.trigger("asc_onLockDefNameManager",Asc.c_oAscDefinedNameReason.LockDefNameManager);
      }
  };

  spreadsheet_api.prototype._onUnlockDefName = function() {
    this.wb.unlockDefName();
  };

  spreadsheet_api.prototype._onCheckDefNameLock = function() {
    return this.wb._onCheckDefNameLock();
  };

  // Залочена ли работа с листом
  spreadsheet_api.prototype.asc_isWorksheetLockedOrDeleted = function(index) {
    var ws = this.wbModel.getWorksheet(index);
    var sheetId = null;
    if (null === ws || undefined === ws) {
      sheetId = this.asc_getActiveWorksheetId();
    } else {
      sheetId = ws.getId();
    }

    var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Sheet, /*subType*/null, sheetId, sheetId);
    // Проверим, редактирует ли кто-то лист
    return (false !== this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther, /*bCheckOnlyLockAll*/false));
  };

  // Залочена ли работа с листами
  spreadsheet_api.prototype.asc_isWorkbookLocked = function() {
    var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Sheet, /*subType*/null, null, null);
    // Проверим, редактирует ли кто-то лист
    return (false !== this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther, /*bCheckOnlyLockAll*/false));
  };

  // Залочена ли работа с листом
  spreadsheet_api.prototype.asc_isLayoutLocked = function(index) {
      var ws = this.wbModel.getWorksheet(index);
      var sheetId = null;
      if (null === ws || undefined === ws) {
          sheetId = this.asc_getActiveWorksheetId();
      } else {
          sheetId = ws.getId();
      }

      var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, /*subType*/null, sheetId, "layoutOptions");
      // Проверим, редактирует ли кто-то лист
      return (false !== this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther, /*bCheckOnlyLockAll*/false));
  };

	// Залочена ли работа с листом
  spreadsheet_api.prototype.asc_isHeaderFooterLocked = function(index) {
      var ws = this.wbModel.getWorksheet(index);
      var sheetId = null;
      if (null === ws || undefined === ws) {
          sheetId = this.asc_getActiveWorksheetId();
      } else {
          sheetId = ws.getId();
      }

      var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, /*subType*/null, sheetId, "headerFooter");
      // Проверим, редактирует ли кто-то лист
      return (false !== this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther, /*bCheckOnlyLockAll*/false));
  };

  spreadsheet_api.prototype.asc_isPrintScaleLocked = function(index) {
      var ws = this.wbModel.getWorksheet(index);
      var sheetId = null;
      if (null === ws || undefined === ws) {
          sheetId = this.asc_getActiveWorksheetId();
      } else {
          sheetId = ws.getId();
      }

      var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, /*subType*/null, sheetId, "printScaleOptions");
      return (false !== this.collaborativeEditing.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther, /*bCheckOnlyLockAll*/false));
  };

	spreadsheet_api.prototype.asc_isPrintAreaLocked = function(index) {
		//проверка лока для именованного диапазона -  области печати
		//локи для именованных диапазонов устроены следующем образом: если изменяется хоть один именованный диапазон
		//добавлять новые/редактировать старые/удалять измененные нельзя, но зато разрешается удалять не измененные
		//в данном случае для области печати логика следующая - если был добавлен именованный диапазон(в тч и область печати)
		//не даём возможность добавлять/редактировть область печати на всех листах, но разрешаем удалять не измененные области печати
		//если вторым пользователем добавлена область печати, первым удалять разершается по общей схеме
		//но поскольку изменения не приняты, этой области печати ещё нет у первого пользователя - удаления не произойдёт

		var res = false;
		if(index !== undefined) {
			var sheetId = this.wbModel.getWorksheet(index).getId();
			var dN = this.wbModel.dependencyFormulas.getDefNameByName("Print_Area", sheetId);
			if(dN) {
				res = !!dN.isLock;
			}
		}

		return res;
	};

  spreadsheet_api.prototype.asc_getHiddenWorksheets = function() {
    var model = this.wbModel;
    var len = model.getWorksheetCount();
    var i, ws, res = [];

    for (i = 0; i < len; ++i) {
      ws = model.getWorksheet(i);
      if (ws.getHidden()) {
        res.push({"index": i, "name": ws.getName()});
      }
    }
    return res;
  };

  spreadsheet_api.prototype.asc_showWorksheet = function(index) {
    if (typeof index === "number") {
      var t = this;
      var ws = this.wbModel.getWorksheet(index);
      var isHidden = ws.getHidden();
      var showWorksheetCallback = function(res) {
        if (res) {
          t.wbModel.getWorksheet(index).setHidden(false);
          t.wb.showWorksheet(index);
        }
      };
      if (isHidden) {
        var sheetId = this.wbModel.getWorksheet(index).getId();
        var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Sheet, /*subType*/null, sheetId, sheetId);
        this.collaborativeEditing.lock([lockInfo], showWorksheetCallback);
      } else {
        showWorksheetCallback(true);
      }
    }
  };

  spreadsheet_api.prototype.asc_hideWorksheet = function (arrSheets) {
    // Проверка глобального лока
    if (this.collaborativeEditing.getGlobalLock()) {
      return false;
    }

    if (!arrSheets) {
      arrSheets = [this.wbModel.getActive()];
    }

    // Вдруг остался один лист
    if (this.asc_getWorksheetsCount() <= this.asc_getHiddenWorksheets().length + arrSheets.length) {
      return false;
    }

    var sheet, arrLocks = [];
    for (var i = 0; i < arrSheets.length; ++i) {
      sheet = this.wbModel.getWorksheet(arrSheets[i]);
      arrLocks.push(this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Sheet, /*subType*/null, sheet.getId(), sheet.getId()));
    }

    var t = this;
    var hideWorksheetCallback = function(res) {
      if (res) {
        History.Create_NewPoint();
        History.StartTransaction();
        for (var i = 0; i < arrSheets.length; ++i) {
          t.wbModel.getWorksheet(arrSheets[i]).setHidden(true);
        }
        History.EndTransaction();
      }
    };

    this.collaborativeEditing.lock(arrLocks, hideWorksheetCallback);
    return true;
  };

  spreadsheet_api.prototype.asc_renameWorksheet = function(name) {
    // Проверка глобального лока
    if (this.collaborativeEditing.getGlobalLock()) {
      return false;
    }

    var i = this.wbModel.getActive();
    var sheetId = this.wbModel.getWorksheet(i).getId();
    var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Sheet, /*subType*/null, sheetId, sheetId);

    var t = this;
    var renameCallback = function(res) {
      if (res) {
        AscFonts.FontPickerByCharacter.getFontsByString(name);
        t._loadFonts([], function() {
            t.wbModel.getWorksheet(i).setName(name);
            t.sheetsChanged();
        });
      } else {
        t.handlers.trigger("asc_onError", c_oAscError.ID.LockedWorksheetRename, c_oAscError.Level.NoCritical);
      }
    };

    this.collaborativeEditing.lock([lockInfo], renameCallback);
    return true;
  };

  spreadsheet_api.prototype.asc_addWorksheet = function (name) {
    var i = this.wbModel.getActive();
    this._addWorksheets([name], i + 1);
  };

  spreadsheet_api.prototype.asc_insertWorksheet = function (arrNames) {
    // Support old versions
    if (!Array.isArray(arrNames)) {
      arrNames = [arrNames];
    }
    var i = this.wbModel.getActive();
    this._addWorksheets(arrNames, i);
  };

  // Удаление листа
  spreadsheet_api.prototype.asc_deleteWorksheet = function (arrSheets) {
    // Проверка глобального лока
    if (this.collaborativeEditing.getGlobalLock()) {
      return false;
    }

    if (!arrSheets) {
      arrSheets = [this.wbModel.getActive()];
    }

    // Check delete all
    if (this.wbModel.getWorksheetCount() === arrSheets.length) {
      return false;
    }

    var sheet, arrLocks = [], arrDeleteNames = [];
    for (var i = 0; i < arrSheets.length; ++i) {
      sheet = arrSheets[i] = this.wbModel.getWorksheet(arrSheets[i]);
      arrDeleteNames.push(sheet.sName);
      arrLocks.push(this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Sheet, /*subType*/null, sheet.getId(), sheet.getId()));
    }

    var t = this;
    var deleteCallback = function(res) {
      if (res) {
        History.Create_NewPoint();
        History.StartTransaction();
        // Нужно проверить все диаграммы, ссылающиеся на удаляемый лист
          t.wbModel.forEach(function (ws) {
			  History.TurnOff();
			  var wsView = t.wb.getWorksheet(ws.index, true);
			  History.TurnOn();
			  for (var i = 0; i < arrDeleteNames.length; ++i) {
                ws.oDrawingOjectsManager.updateChartReferencesWidthHistory(arrDeleteNames[i], parserHelp.getEscapeSheetName(ws.sName));
              }
			  if (wsView && wsView.objectRender && wsView.objectRender.controller) {
				  wsView.objectRender.controller.recalculate2(true);
			  }
          });

        for (var i = 0; i < arrSheets.length; ++i) {
          t.wbModel.removeWorksheet(arrSheets[i].getIndex());
        }
        t.wb.updateWorksheetByModel();
        t.wb.showWorksheet();
        History.EndTransaction();
        // Посылаем callback об изменении списка листов
        t.sheetsChanged();
      }
    };

    this.collaborativeEditing.lock(arrLocks, deleteCallback);
    return true;
  };

  spreadsheet_api.prototype.asc_moveWorksheet = function (where, arrSheets) {
    // Проверка глобального лока
    if (this.collaborativeEditing.getGlobalLock()) {
      return false;
    }

    if (!arrSheets) {
      arrSheets = [this.wbModel.getActive()];
    }

    var active, sheet, i, index, _where, arrLocks = [];
    var arrSheetsLeft = [], arrSheetsRight = [];
    for (i = 0; i < arrSheets.length; ++i) {
      index = arrSheets[i];
      sheet = this.wbModel.getWorksheet(index);
      ((index < where) ? arrSheetsLeft : arrSheetsRight).push(sheet);
      if (!active) {
        active = sheet;
      }
      arrLocks.push(this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Sheet, /*subType*/null, sheet.getId(), sheet.getId()));
    }

    var t = this;
    var moveCallback = function (res) {
      if (res) {
        History.Create_NewPoint();
        History.StartTransaction();
        for (i = 0, _where = where; i < arrSheetsRight.length; ++i, ++_where) {
          index = arrSheetsRight[i].getIndex();
          if (index !== _where) {
            t.wbModel.replaceWorksheet(index, _where);
          }
        }
        for (i = arrSheetsLeft.length - 1, _where = where - 1; i >= 0; --i, --_where) {
          index = arrSheetsLeft[i].getIndex();
          if (index !== _where) {
            t.wbModel.replaceWorksheet(index, _where);
          }
        }
        // Обновим текущий номер
        t.wbModel.setActive(active.getIndex());
        t.wb.updateWorksheetByModel();
        t.wb.showWorksheet();
        History.EndTransaction();
        // Посылаем callback об изменении списка листов
        t.sheetsChanged();
      }
    };

    this.collaborativeEditing.lock(arrLocks, moveCallback);
    return true;
  };

  spreadsheet_api.prototype.asc_copyWorksheet = function (where, arrNames, arrSheets) {
    // Проверка глобального лока
    if (this.collaborativeEditing.getGlobalLock()) {
      return false;
    }

    // Support old versions
    if (!Array.isArray(arrNames)) {
      arrNames = [arrNames];
    }
    if (0 === arrNames.length) {
      return false;
    }
    if (!arrSheets) {
      arrSheets = [this.wbModel.getActive()];
    }

    var scale = this.asc_getZoom();

    // ToDo уйти от lock для листа при копировании
    var sheet, arrLocks = [];
    for (var i = 0; i < arrSheets.length; ++i) {
      sheet = arrSheets[i] = this.wbModel.getWorksheet(arrSheets[i]);
      arrLocks.push(this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Sheet, /*subType*/null, sheet.getId(), sheet.getId()));
    }

    var t = this;
    var copyWorksheet = function(res) {
      if (res) {
        // ToDo перейти от wsViews на wsViewsId
        History.Create_NewPoint();
        History.StartTransaction();
        var index;
        for (var i = arrSheets.length - 1; i >= 0; --i) {
          index = arrSheets[i].getIndex();
          t.wbModel.copyWorksheet(index, where, arrNames[i]);
        }
        // Делаем активным скопированный
        t.wbModel.setActive(where);
        t.wb.updateWorksheetByModel();
        t.wb.showWorksheet();
        History.EndTransaction();
        // Посылаем callback об изменении списка листов
        t.sheetsChanged();
      }
    };

    this.collaborativeEditing.lock(arrLocks, copyWorksheet);
  };

  spreadsheet_api.prototype.asc_cleanSelection = function() {
    this.wb.getWorksheet().cleanSelection();
  };

  spreadsheet_api.prototype.asc_getZoom = function() {
    return this.wb.getZoom();
  };

  spreadsheet_api.prototype.asc_setZoom = function(scale) {
    this.wb.changeZoom(scale);
  };

  spreadsheet_api.prototype.asc_enableKeyEvents = function(isEnabled, isFromInput) {
    if (!this.isLoadFullApi) {
      this.tmpFocus = isEnabled;
      return;
    }

    if (this.wb) {
      this.wb.enableKeyEventsHandler(isEnabled);
    }

    if (isFromInput !== true && AscCommon.g_inputContext)
      AscCommon.g_inputContext.setInterfaceEnableKeyEvents(isEnabled);
  };

  spreadsheet_api.prototype.asc_IsFocus = function(bIsNaturalFocus) {
    var res = true;
	if(this.wb.cellEditor.isTopLineActive)
	{
		res = false;
	}
    else if (this.wb) 
	{
      res = this.wb.getEnableKeyEventsHandler(bIsNaturalFocus);
    }
	
    return res;
  };

  spreadsheet_api.prototype.asc_searchEnabled = function(bIsEnabled) {
  };

  spreadsheet_api.prototype.asc_findText = function(options) {
    if (window["NATIVE_EDITOR_ENJINE"]) {
      if (this.wb.findCellText(options)) {
        var ws = this.wb.getWorksheet();
        var activeCell = this.wbModel.getActiveWs().selectionRange.activeCell;
        return [ws.getCellLeftRelative(activeCell.col, 0), ws.getCellTopRelative(activeCell.row, 0)];
      }

      return null;
    }

    var d = this.wb.findCellText(options);
    this.controller.scroll(d);
    return !!d;
  };

  spreadsheet_api.prototype.asc_replaceText = function(options) {
    options.lookIn = Asc.c_oAscFindLookIn.Formulas; // При замене поиск только в формулах
    this.wb.replaceCellText(options);
  };

  spreadsheet_api.prototype.asc_endFindText = function() {
    // Нужно очистить поиск
    this.wb._cleanFindResults();
  };

  /**
   * Делает активной указанную ячейку
   * @param {String} reference  Ссылка на ячейку вида A1 или R1C1
   */
  spreadsheet_api.prototype.asc_findCell = function (reference) {
    if (this.asc_getCellEditMode()) {
      return;
    }
    var ws = this.wb.getWorksheet();
    var d = ws.findCell(reference);
    if (0 === d.length) {
      return;
    }

    // Получаем sheet по имени
    ws = d[0].getWorksheet();
    if (!ws || ws.getHidden()) {
      return;
    }
    // Индекс листа
    var sheetIndex = ws.getIndex();
    // Если не совпали индекс листа и индекс текущего, то нужно сменить
    if (this.asc_getActiveWorksheetIndex() !== sheetIndex) {
      // Меняем активный лист
      this.asc_showWorksheet(sheetIndex);
    }

    ws = this.wb.getWorksheet();
    ws.setSelection(1 === d.length ? d[0].getBBox0() : d);
  };

	spreadsheet_api.prototype.asc_closeCellEditor = function (cancel) {
		var result = true;
		if (this.wb) {
			result = this.wb.closeCellEditor(cancel);
		}
		return result;
	};

	spreadsheet_api.prototype.asc_setR1C1Mode = function (value) {
		AscCommonExcel.g_R1C1Mode = value;
		if (this.wbModel) {
			this._onUpdateAfterApplyChanges();
			this.wb._onUpdateSelectionName(true);
        }
	};


  // Spreadsheet interface

  spreadsheet_api.prototype.asc_getColumnWidth = function() {
    var ws = this.wb.getWorksheet();
    return ws.getSelectedColumnWidthInSymbols();
  };

  spreadsheet_api.prototype.asc_setColumnWidth = function(width) {
    this.wb.getWorksheet().changeWorksheet("colWidth", width);
  };

  spreadsheet_api.prototype.asc_showColumns = function() {
    this.wb.getWorksheet().changeWorksheet("showCols");
  };

  spreadsheet_api.prototype.asc_hideColumns = function() {
    this.wb.getWorksheet().changeWorksheet("hideCols");
  };

  spreadsheet_api.prototype.asc_autoFitColumnWidth = function() {
    this.wb.getWorksheet().autoFitColumnsWidth(null);
  };

  spreadsheet_api.prototype.asc_getRowHeight = function() {
    var ws = this.wb.getWorksheet();
    return ws.getSelectedRowHeight();
  };

  spreadsheet_api.prototype.asc_setRowHeight = function(height) {
    this.wb.getWorksheet().changeWorksheet("rowHeight", height);
  };
  spreadsheet_api.prototype.asc_autoFitRowHeight = function() {
    this.wb.getWorksheet().autoFitRowHeight(null);
  };

  spreadsheet_api.prototype.asc_showRows = function() {
    this.wb.getWorksheet().changeWorksheet("showRows");
  };

  spreadsheet_api.prototype.asc_hideRows = function() {
    this.wb.getWorksheet().changeWorksheet("hideRows");
  };

  spreadsheet_api.prototype.asc_group = function(val) {
    if(val) {
		this.wb.getWorksheet().changeWorksheet("groupRows");
    } else {
		this.wb.getWorksheet().changeWorksheet("groupCols");
    }
  };

  spreadsheet_api.prototype.asc_ungroup = function(val) {
    if(val) {
        this.wb.getWorksheet().changeWorksheet("groupRows", true);
    } else {
        this.wb.getWorksheet().changeWorksheet("groupCols", true);
    }
  };

  spreadsheet_api.prototype.asc_checkAddGroup = function(bUngroup) {
	  //true - rows, false - columns, null - show dialog, undefined - error
    return this.wb.getWorksheet().checkAddGroup(bUngroup);
  };

  spreadsheet_api.prototype.asc_clearOutline = function() {
	  this.wb.getWorksheet().changeWorksheet("clearOutline");
  };

  spreadsheet_api.prototype.asc_changeGroupDetails = function(bExpand) {
	  this.wb.getWorksheet().changeGroupDetails(bExpand);
  };

  spreadsheet_api.prototype.asc_insertCells = function(options) {
    this.wb.getWorksheet().changeWorksheet("insCell", options);
  };

  spreadsheet_api.prototype.asc_deleteCells = function(options) {
    this.wb.getWorksheet().changeWorksheet("delCell", options);
  };

  spreadsheet_api.prototype.asc_mergeCells = function(options) {
    this.wb.getWorksheet().setSelectionInfo("merge", options);
  };

  spreadsheet_api.prototype.asc_sortCells = function(options) {
    this.wb.getWorksheet().setSelectionInfo("sort", options);
  };

  spreadsheet_api.prototype.asc_emptyCells = function(options) {
    this.wb.emptyCells(options);
  };

  spreadsheet_api.prototype.asc_drawDepCells = function(se) {
    /* ToDo
     if( se != AscCommonExcel.c_oAscDrawDepOptions.Clear )
     this.wb.getWorksheet().prepareDepCells(se);
     else
     this.wb.getWorksheet().cleanDepCells();*/
  };

  // Потеряем ли мы что-то при merge ячеек
  spreadsheet_api.prototype.asc_mergeCellsDataLost = function(options) {
    return this.wb.getWorksheet().getSelectionMergeInfo(options);
  };
  
  //нужно ли спрашивать пользователя о расширении диапазона
  spreadsheet_api.prototype.asc_sortCellsRangeExpand = function() {
    return this.wb.getWorksheet().getSelectionSortInfo();
  };
  
  spreadsheet_api.prototype.asc_getSheetViewSettings = function() {
    return this.wb.getWorksheet().getSheetViewSettings();
  };

	spreadsheet_api.prototype.asc_setDisplayGridlines = function (value) {
		this.wb.getWorksheet()
			.changeWorksheet("sheetViewSettings", {type: AscCH.historyitem_Worksheet_SetDisplayGridlines, value: value});
	};

	spreadsheet_api.prototype.asc_setDisplayHeadings = function (value) {
		this.wb.getWorksheet()
			.changeWorksheet("sheetViewSettings", {type: AscCH.historyitem_Worksheet_SetDisplayHeadings, value: value});
	};

  // Images & Charts

  spreadsheet_api.prototype.asc_drawingObjectsExist = function() {
    for (var i = 0; i < this.wb.model.aWorksheets.length; i++) {
      if (this.wb.model.aWorksheets[i].Drawings && this.wb.model.aWorksheets[i].Drawings.length) {
        return true;
      }
    }
    return false;
  };

  spreadsheet_api.prototype.asc_getChartObject = function(bNoLock) {		// Return new or existing chart. For image return null

    if(bNoLock !== true){
     this.asc_onOpenChartFrame();
   }
    var ws = this.wb.getWorksheet();
    return ws.objectRender.getAscChartObject(bNoLock);
  };

  spreadsheet_api.prototype.asc_addChartDrawingObject = function(chart) {
    var ws = this.wb.getWorksheet();
    AscFonts.IsCheckSymbols = true;
    var ret = ws.objectRender.addChartDrawingObject(chart);
    AscFonts.IsCheckSymbols = false;
    this.asc_onCloseChartFrame();
    return ret;
  };

  spreadsheet_api.prototype.asc_editChartDrawingObject = function(chart) {
    var ws = this.wb.getWorksheet();
    var ret = ws.objectRender.editChartDrawingObject(chart);
    this.asc_onCloseChartFrame();
    return ret;
  };

  spreadsheet_api.prototype.asc_addImageDrawingObject = function (imageUrl, imgProp, token) {

    var t = this;
    AscCommon.sendImgUrls(this, [imageUrl], function(data) {

      if (data && data[0])
      {
        var ws = t.wb.getWorksheet();
        ws.objectRender.addImageDrawingObject([data[0].url], null);
      }

    }, true, false, token);

  };


  spreadsheet_api.prototype.asc_AddMath = function(Type)
  {
    var t = this, fonts = {};
    fonts["Cambria Math"] = 1;
    t._loadFonts(fonts, function() {t.asc_AddMath2(Type);});
  };

  spreadsheet_api.prototype.asc_AddMath2 = function(Type)
  {
    var ws = this.wb.getWorksheet();
    ws.objectRender.addMath(Type);
  };

  spreadsheet_api.prototype.asc_SetMathProps = function(MathProps)
  {
    var ws = this.wb.getWorksheet();
    ws.objectRender.setMathProps(MathProps);
  };

  spreadsheet_api.prototype.asc_showImageFileDialog = function() {
    // ToDo заменить на общую функцию для всех
    this.asc_addImage();
  };
  spreadsheet_api.prototype._addImageUrl = function(urls, obj) {
    var ws = this.wb.getWorksheet();
    if (ws) {
      if (obj && (obj.isImageChangeUrl || obj.isShapeImageChangeUrl || obj.isTextArtChangeUrl)) {
        ws.objectRender.editImageDrawingObject(urls[0], obj);
      } else {
        ws.objectRender.addImageDrawingObject(urls, null);
      }
    }
  };
    // signatures
    spreadsheet_api.prototype.asc_addSignatureLine = function (sGuid, sSigner, sSigner2, sEmail, Width, Height, sImgUrl) {
      var ws = this.wb.getWorksheet();
      if(ws && ws.objectRender){
          ws.objectRender.addSignatureLine(sGuid, sSigner, sSigner2, sEmail, Width, Height, sImgUrl);
      }
    };

    spreadsheet_api.prototype.asc_getAllSignatures = function(){
      var ret = [];
      var aSpTree = [];
		this.wbModel.forEach(function (ws) {
			for (var j = 0; j < ws.Drawings.length; ++j) {
				aSpTree.push(ws.Drawings[j].graphicObject);
			}
		});
      AscFormat.DrawingObjectsController.prototype.getAllSignatures2(ret, aSpTree);
      return ret;
    };

    spreadsheet_api.prototype.asc_CallSignatureDblClickEvent = function(sGuid){
        var allSpr = this.asc_getAllSignatures();
        for(var i = 0; i < allSpr.length; ++i){
          if(allSpr[i].signatureLine && allSpr[i].signatureLine.id === sGuid){
              this.sendEvent("asc_onSignatureDblClick", sGuid, allSpr[i].extX, allSpr[i].extY);
          }
        }
    };
    //-------------------------------------------------------

    spreadsheet_api.prototype.asc_setSelectedDrawingObjectLayer = function(layerType) {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.setGraphicObjectLayer(layerType);
  };

  spreadsheet_api.prototype.asc_setSelectedDrawingObjectAlign = function(alignType) {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.setGraphicObjectAlign(alignType);
  };
  spreadsheet_api.prototype.asc_DistributeSelectedDrawingObjectHor = function() {
      var ws = this.wb.getWorksheet();
      return ws.objectRender.distributeGraphicObjectHor();
  };

  spreadsheet_api.prototype.asc_DistributeSelectedDrawingObjectVer = function() {
      var ws = this.wb.getWorksheet();
      return ws.objectRender.distributeGraphicObjectVer();
  };

  spreadsheet_api.prototype.asc_getSelectedDrawingObjectsCount = function()
  {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.getSelectedDrawingObjectsCount();
  };


  spreadsheet_api.prototype.asc_canEditCrop = function()
  {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.controller.canStartImageCrop();
  };

  spreadsheet_api.prototype.asc_startEditCrop = function()
  {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.controller.startImageCrop();
  };

  spreadsheet_api.prototype.asc_endEditCrop = function()
  {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.controller.endImageCrop();
  };

  spreadsheet_api.prototype.asc_cropFit = function()
  {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.controller.cropFit();
  };

  spreadsheet_api.prototype.asc_cropFill = function()
  {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.controller.cropFill();
  };


  spreadsheet_api.prototype.asc_addTextArt = function(nStyle) {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.addTextArt(nStyle);
  };

  spreadsheet_api.prototype.asc_checkDataRange = function(dialogType, dataRange, fullCheck, isRows, chartType) {
    return parserHelp.checkDataRange(this.wbModel, this.wb, dialogType, dataRange, fullCheck, isRows, chartType);
  };

  // Для вставки диаграмм в Word
  spreadsheet_api.prototype.asc_getBinaryFileWriter = function() {
    return new AscCommonExcel.BinaryFileWriter(this.wbModel);
  };

  spreadsheet_api.prototype.asc_getWordChartObject = function() {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.getWordChartObject();
  };

  spreadsheet_api.prototype.asc_cleanWorksheet = function() {
    var ws = this.wb.getWorksheet();	// Для удаления данных листа и диаграмм
    if (ws.objectRender) {
      ws.objectRender.cleanWorksheet();
    }
  };

  // Выставление данных (пока используется только для MailMerge)
  spreadsheet_api.prototype.asc_setData = function(oData) {
    this.wb.getWorksheet().setData(oData);
  };
  // Получение данных
  spreadsheet_api.prototype.asc_getData = function() {
    this.asc_closeCellEditor();
    return this.wb.getWorksheet().getData();
  };

  // Cell comment interface
  spreadsheet_api.prototype.asc_addComment = function(oComment) {
    var oPlace = oComment.bDocument ? this.wb : this.wb.getWorksheet();
    oPlace.cellCommentator.addComment(oComment);
  };

  spreadsheet_api.prototype.asc_changeComment = function(id, oComment) {
    if (oComment.bDocument) {
      this.wb.cellCommentator.changeComment(id, oComment);
    } else {
      var ws = this.wb.getWorksheet();
      ws.cellCommentator.changeComment(id, oComment);
    }
  };

  spreadsheet_api.prototype.asc_selectComment = function(id) {
    this.wb.getWorksheet().cellCommentator.selectComment(id);
  };

  spreadsheet_api.prototype.asc_showComment = function(id, bNew) {
    var ws = this.wb.getWorksheet();
    ws.cellCommentator.showCommentById(id, bNew);
  };

  spreadsheet_api.prototype.asc_findComment = function(id) {
    var ws = this.wb.getWorksheet();
    return ws.cellCommentator.findComment(id);
  };

  spreadsheet_api.prototype.asc_removeComment = function(id) {
    this.wb.removeComment(id);
  };

  spreadsheet_api.prototype.asc_RemoveAllComments = function(isMine, isCurrent) {
  	this.wb.removeAllComments(isMine, isCurrent);
  };

  spreadsheet_api.prototype.asc_showComments = function (isShowSolved) {
    this.wb.showComments(true, isShowSolved);
  };
  spreadsheet_api.prototype.asc_hideComments = function () {
    this.wb.showComments(false, false);
  };

  // Shapes
  spreadsheet_api.prototype.setStartPointHistory = function() {
    this.noCreatePoint = true;
    this.exucuteHistory = true;
    this.asc_stopSaving();
  };

  spreadsheet_api.prototype.setEndPointHistory = function() {
    this.noCreatePoint = false;
    this.exucuteHistoryEnd = true;
    this.asc_continueSaving();
  };

  spreadsheet_api.prototype.asc_startAddShape = function(sPreset) {
    this.isStartAddShape = this.controller.isShapeAction = true;
    var ws = this.wb.getWorksheet();
    ws.objectRender.controller.startTrackNewShape(sPreset);
  };

  spreadsheet_api.prototype.asc_endAddShape = function() {
    this.isStartAddShape = false;
    this.handlers.trigger("asc_onEndAddShape");
  };


    spreadsheet_api.prototype.asc_addShapeOnSheet = function(sPreset) {
        if(this.wb){
          var ws = this.wb.getWorksheet();
          if(ws && ws.objectRender){
            ws.objectRender.addShapeOnSheet(sPreset);
          }
        }
    };

  spreadsheet_api.prototype.asc_addOleObjectAction = function(sLocalUrl, sData, sApplicationId, fWidth, fHeight, nWidthPix, nHeightPix)
  {
    var _image = this.ImageLoader.LoadImage(AscCommon.getFullImageSrc2(sLocalUrl), 1);
    if (null != _image){
        var ws = this.wb.getWorksheet();
      if(ws.objectRender){
        this.asc_canPaste();
        ws.objectRender.addOleObject(fWidth, fHeight, nWidthPix, nHeightPix, sLocalUrl, sData, sApplicationId);
        this.asc_endPaste();
      }
    }
  };

  spreadsheet_api.prototype.asc_editOleObjectAction = function(bResize, oOleObject, sImageUrl, sData, nPixWidth, nPixHeight)
  {
    if (oOleObject)
    {
      var ws = this.wb.getWorksheet();
      if(ws.objectRender){
        this.asc_canPaste();
        ws.objectRender.editOleObject(oOleObject, sData, sImageUrl, nPixWidth, nPixHeight, bResize);
        this.asc_endPaste();
      }
    }
  };


    spreadsheet_api.prototype.asc_startEditCurrentOleObject = function(){
        var ws = this.wb.getWorksheet();
        if(ws && ws.objectRender){
            ws.objectRender.startEditCurrentOleObject();
        }
    };

  spreadsheet_api.prototype.asc_isAddAutoshape = function() {
    return this.isStartAddShape;
  };

  spreadsheet_api.prototype.asc_canAddShapeHyperlink = function() {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.controller.canAddHyperlink();
  };

  spreadsheet_api.prototype.asc_canGroupGraphicsObjects = function() {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.controller.canGroup();
  };

  spreadsheet_api.prototype.asc_groupGraphicsObjects = function() {
    var ws = this.wb.getWorksheet();
    ws.objectRender.groupGraphicObjects();
  };

  spreadsheet_api.prototype.asc_canUnGroupGraphicsObjects = function() {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.controller.canUnGroup();
  };

  spreadsheet_api.prototype.asc_unGroupGraphicsObjects = function() {
    var ws = this.wb.getWorksheet();
    ws.objectRender.unGroupGraphicObjects();
  };

  spreadsheet_api.prototype.asc_changeShapeType = function(value) {
    this.asc_setGraphicObjectProps(new Asc.asc_CImgProperty({ShapeProperties: {type: value}}));
  };

  spreadsheet_api.prototype.asc_getGraphicObjectProps = function() {
    var ws = this.wb.getWorksheet();
    if (ws && ws.objectRender && ws.objectRender.controller) {
      return ws.objectRender.controller.getGraphicObjectProps();
    }
    return null;
  };

  spreadsheet_api.prototype.asc_setGraphicObjectProps = function(props) {

    var ws = this.wb.getWorksheet();
    var fReplaceCallback = null, sImageUrl = null;
    if(!AscCommon.isNullOrEmptyString(props.ImageUrl)){
      if(!g_oDocumentUrls.getImageLocal(props.ImageUrl)){
        sImageUrl = props.ImageUrl;
        fReplaceCallback = function(sLocalUrl){
          props.ImageUrl = sLocalUrl;
        }
      }
    }
    else if(props.ShapeProperties && props.ShapeProperties.fill && props.ShapeProperties.fill.fill &&
    !AscCommon.isNullOrEmptyString(props.ShapeProperties.fill.fill.url)){
      if(!g_oDocumentUrls.getImageLocal(props.ShapeProperties.fill.fill.url)){
        sImageUrl = props.ShapeProperties.fill.fill.url;
        fReplaceCallback = function(sLocalUrl){
          props.ShapeProperties.fill.fill.url = sLocalUrl;
        }
      }
    }
    else if(props.ShapeProperties && props.ShapeProperties.textArtProperties &&
        props.ShapeProperties.textArtProperties.Fill && props.ShapeProperties.textArtProperties.Fill.fill &&
        !AscCommon.isNullOrEmptyString(props.ShapeProperties.textArtProperties.Fill.fill.url)){
      if(!g_oDocumentUrls.getImageLocal(props.ShapeProperties.textArtProperties.Fill.fill.url)){
        sImageUrl = props.ShapeProperties.textArtProperties.Fill.fill.url;
        fReplaceCallback = function(sLocalUrl){
          props.ShapeProperties.textArtProperties.Fill.fill.url = sLocalUrl;
        }
      }
    }
    if(fReplaceCallback) {

      if (window["AscDesktopEditor"]) {
        var firstUrl = window["AscDesktopEditor"]["LocalFileGetImageUrl"](sImageUrl);
        firstUrl = g_oDocumentUrls.getImageUrl(firstUrl);
        fReplaceCallback(firstUrl);
        ws.objectRender.setGraphicObjectProps(props);
        return;
      }

      AscCommon.sendImgUrls(this, [sImageUrl], function (data) {

        if (data && data[0]) {
          fReplaceCallback(data[0].url);
          ws.objectRender.setGraphicObjectProps(props);
        }

      }, true);
    }
    else{
      if(undefined != props.BulletSymbol && undefined != props.BulletFont) {
        var t = this;
          var fonts = {};
          fonts[props.BulletFont] = 1;
          AscFonts.FontPickerByCharacter.checkTextLight(props.BulletSymbol);
          t._loadFonts(fonts, function() {
            ws.objectRender.setGraphicObjectProps(props);
          });

      }
      else {
        ws.objectRender.setGraphicObjectProps(props);
      }
    }


  };

  spreadsheet_api.prototype.asc_getOriginalImageSize = function() {
    var ws = this.wb.getWorksheet();
    return ws.objectRender.getOriginalImageSize();
  };

  spreadsheet_api.prototype.asc_setInterfaceDrawImagePlaceTextArt = function(elementId) {
    this.textArtElementId = elementId;
  };

  spreadsheet_api.prototype.asc_changeImageFromFile = function() {
    this.asc_addImage({isImageChangeUrl: true});
  };

  spreadsheet_api.prototype.asc_changeShapeImageFromFile = function(type) {
    this.asc_addImage({isShapeImageChangeUrl: true, textureType: type});
  };

  spreadsheet_api.prototype.asc_changeArtImageFromFile = function(type) {
    this.asc_addImage({isTextArtChangeUrl: true, textureType: type});
  };

  spreadsheet_api.prototype.asc_putPrLineSpacing = function(type, value) {
    var ws = this.wb.getWorksheet();
    ws.objectRender.controller.putPrLineSpacing(type, value);
  };

  spreadsheet_api.prototype.asc_putLineSpacingBeforeAfter = function(type, value) { // "type == 0" means "Before", "type == 1" means "After"
    var ws = this.wb.getWorksheet();
    ws.objectRender.controller.putLineSpacingBeforeAfter(type, value);
  };

  spreadsheet_api.prototype.asc_setDrawImagePlaceParagraph = function(element_id, props) {
    var ws = this.wb.getWorksheet();
    ws.objectRender.setDrawImagePlaceParagraph(element_id, props);
  };

    spreadsheet_api.prototype.asc_replaceLoadImageCallback = function(fCallback){
        if(this.wb){
            var ws = this.wb.getWorksheet();
            if(ws.objectRender){
                ws.objectRender.asyncImageEndLoaded = fCallback;
            }
        }
    };

  spreadsheet_api.prototype.asyncImageEndLoaded = function(_image) {
    if (this.wb) {
      var ws = this.wb.getWorksheet();
      if (ws.objectRender.asyncImageEndLoaded) {
        ws.objectRender.asyncImageEndLoaded(_image);
      }
    }
  };

  spreadsheet_api.prototype.asyncImagesDocumentEndLoaded = function() {
    if (c_oAscAdvancedOptionsAction.None === this.advancedOptionsAction && this.wb && !window["NATIVE_EDITOR_ENJINE"]) {
      var ws = this.wb.getWorksheet();
      ws.objectRender.showDrawingObjects(true);
      ws.objectRender.controller.getGraphicObjectProps();
    }
  };

  spreadsheet_api.prototype.asyncImageEndLoadedBackground = function() {
    var worksheet = this.wb.getWorksheet();
    if (worksheet && worksheet.objectRender) {
      var drawing_area = worksheet.objectRender.drawingArea;
      if (drawing_area) {
        for (var i = 0; i < drawing_area.frozenPlaces.length; ++i) {
          worksheet.objectRender.showDrawingObjects(true);
            worksheet.objectRender.controller && worksheet.objectRender.controller.getGraphicObjectProps();
        }
      }
    }
  };

    // spellCheck
    spreadsheet_api.prototype.cleanSpelling = function (isCellEditing) {
      if (!this.spellcheckState.lockSpell) {
        if (this.spellcheckState.startCell) {
          var cellsChange = this.spellcheckState.cellsChange;
          var lastFindOptions = this.spellcheckState.lastFindOptions;
          if (cellsChange.length !== 0 && lastFindOptions && !isCellEditing) {
            this.asc_replaceMisspelledWords(lastFindOptions);
          }
        }
        this.handlers.trigger("asc_onSpellCheckVariantsFound", null);
        this.spellcheckState.isStart = false;
        this.spellcheckState.clean();
      }
    };

    spreadsheet_api.prototype.SpellCheck_CallBack = function (e) {
      this.spellcheckState.lockSpell = false;
      var ws = this.wb.getWorksheet();
      var type = e["type"];
      var usrWords = e["usrWords"];
      var cellsInfo = e["cellsInfo"];
      var changeWords = this.spellcheckState.changeWords;
      var ignoreWords = this.spellcheckState.ignoreWords;
      var lastOptions = this.spellcheckState.lastFindOptions;
      var cellsChange = this.spellcheckState.cellsChange;
      var isStart = this.spellcheckState.isStart;

      if (type === "spell") {
        var usrCorrect = e["usrCorrect"];
        this.spellcheckState.wordsIndex = e["wordsIndex"];
        var lastIndex = this.spellcheckState.lastIndex;
        var activeCell = ws.model.selectionRange.activeCell;
        var isIgnoreUppercase = this.spellcheckState.isIgnoreUppercase;

        for (var i = 0; i < usrWords.length; i++) {
          if (this.spellcheckState.isIgnoreNumbers) {
            var isNumberInStr = /\d+/;
            if (usrWords[i].match(isNumberInStr)) {
              usrCorrect[i] = true;
            }
          }
         
          if (ignoreWords[usrWords[i]] || changeWords[usrWords[i]] || usrWords[i].length === 1 
            || (isIgnoreUppercase && usrWords[i].toUpperCase() === usrWords[i])) {
            usrCorrect[i] = true;
          }
        }

        while (!isStart && usrCorrect[lastIndex]) {
          ++lastIndex;
        }

        this.spellcheckState.lockSpell = false;
        this.spellcheckState.lastIndex = lastIndex;
        var currIndex = cellsInfo[lastIndex];
        if (currIndex && (currIndex.col !== activeCell.col || currIndex.row !== activeCell.row)) {
          var currentCellIsInactive = true;
        }
        while (isStart && currentCellIsInactive && usrCorrect[lastIndex]) {
          if (!cellsInfo[lastIndex + 1] || cellsInfo[lastIndex + 1].col !== cellsInfo[lastIndex].col) {
            var cell = cellsInfo[lastIndex];
            cellsChange.push(new Asc.Range(cell.col, cell.row, cell.col, cell.row));
          }
          ++lastIndex;
        }

        if (undefined === cellsInfo[lastIndex]) {
          this.spellcheckState.nextRow();
          this.asc_nextWord();
          return;
        }

        var cellStartIndex = 0;
        while (cellsInfo[cellStartIndex].col !== cellsInfo[lastIndex].col) {
          cellStartIndex++;
        }
        e["usrWords"].splice(0, cellStartIndex);
        e["usrCorrect"].splice(0, cellStartIndex);
        e["usrLang"].splice(0, cellStartIndex);
        e["cellsInfo"].splice(0, cellStartIndex);
        e["wordsIndex"].splice(0, cellStartIndex);

        lastIndex = lastIndex - cellStartIndex;
        this.spellcheckState.lastIndex = lastIndex;
        this.spellcheckState.lockSpell = true;
        this.spellcheckState.lastSpellInfo = e;

        this.SpellCheckApi.spellCheck({
          "type": "suggest",
          "usrWords": [e["usrWords"][lastIndex]],
          "usrLang": [e["usrLang"][lastIndex]],
          "cellInfo": e["cellsInfo"][lastIndex],
          "wordsIndex": e["wordsIndex"][lastIndex]
        });
      } else if (type === "suggest") {
        this.handlers.trigger("asc_onSpellCheckVariantsFound", new AscCommon.asc_CSpellCheckProperty(e["usrWords"][0], null, e["usrSuggest"][0], null, null));
        var cellInfo = e["cellInfo"];
        var dc = cellInfo.col - ws.model.selectionRange.activeCell.col;
        var dr = cellInfo.row - ws.model.selectionRange.activeCell.row;
        this.spellcheckState.lockSpell = true;

        if ((dc !== 0 || dr !== 0) && isStart && lastOptions) {
          this.asc_replaceMisspelledWords(lastOptions);
        } else {
          var d = ws.changeSelectionStartPoint(dc, dr);
          this.controller.scroll(d);
          this.spellcheckState.lockSpell = false;
        }
        this.spellcheckState.isStart = true;
        this.spellcheckState.wordsIndex = e["wordsIndex"];
      }
    };
  spreadsheet_api.prototype._spellCheckDisconnect = function () {
    this.cleanSpelling();
  };
  spreadsheet_api.prototype._spellCheckRestart = function (word) {
    var lastSpellInfo;
    if ((lastSpellInfo = this.spellcheckState.lastSpellInfo)) {
      var lastIndex = this.spellcheckState.lastIndex;
      this.spellcheckState.lastIndex = -1;

      var usrLang = [];
      for (var i = lastIndex; i < lastSpellInfo["usrWords"].length; ++i) {
        usrLang.push(this.defaultLanguage);
      }

      this.spellcheckState.lockSpell = true;
      this.SpellCheckApi.spellCheck({
        "type": "spell",
        "usrWords": lastSpellInfo["usrWords"].slice(lastIndex),
        "usrLang": usrLang,
        "cellsInfo": lastSpellInfo["cellsInfo"].slice(lastIndex),
        "wordsIndex": lastSpellInfo["wordsIndex"].slice(lastIndex)
      });
    } else {
      this.cleanSpelling();
    }
  };
  spreadsheet_api.prototype.asc_setDefaultLanguage = function (val) {
    if (this.spellcheckState.lockSpell || this.defaultLanguage === val) {
      return;
    }
    this.defaultLanguage = val;
    this._spellCheckRestart();
  };
  spreadsheet_api.prototype.asc_nextWord = function () {
    if (this.spellcheckState.lockSpell) {
      return;
    }

    var ws = this.wb.getWorksheet();
    var activeCell = ws.model.selectionRange.activeCell;
    var lastSpell = this.spellcheckState.lastSpellInfo;
    var cellsInfo;

    if (lastSpell) {
      cellsInfo = lastSpell["cellsInfo"];
      var usrWords = lastSpell["usrWords"];
      var usrCorrect = lastSpell["usrCorrect"];
      var wordsIndex = lastSpell["wordsIndex"];
      var ignoreWords = this.spellcheckState.ignoreWords;
      var changeWords = this.spellcheckState.changeWords;
      var lastIndex = this.spellcheckState.lastIndex;
      this.spellcheckState.cellText = this.asc_getCellInfo().text;
      var cellText = this.spellcheckState.newCellText || this.spellcheckState.cellText;
      var afterReplace = this.spellcheckState.afterReplace;

      for (var i = 0; i < usrWords.length; i++) {
        var usrWord = usrWords[i];

        if (ignoreWords[usrWord] || changeWords[usrWord]) {
          usrCorrect[i] = true;
        }
      }

      while (cellsInfo[lastIndex].col === activeCell.col && cellsInfo[lastIndex].row === activeCell.row) {
        var letterDifference = null;
        var word = usrWords[lastIndex];
        var newWord = this.spellcheckState.newWord;

        if (newWord) {
          letterDifference = newWord.length - word.length;
        } else if (changeWords[word]) {
          letterDifference = changeWords[word].length - word.length;
        }

        if (letterDifference !== null) {
          var replaceWith = newWord || changeWords[word];
          var valueForSearching = new RegExp(usrWords[lastIndex], "y");
          valueForSearching.lastIndex = wordsIndex[lastIndex];
          cellText = cellText.replace(valueForSearching, replaceWith);
          if (letterDifference !== 0) {
            var j = lastIndex + 1;
            while (j < usrWords.length && cellsInfo[j].col === cellsInfo[lastIndex].col) {
              wordsIndex[j] += letterDifference;
              j++;
            }
          }
          this.spellcheckState.newCellText = cellText;
          this.spellcheckState.newWord = null;
        }

        if (this.spellcheckState.newCellText) {
          this.spellcheckState.cellsChange = [];
          var cell = cellsInfo[lastIndex];
          this.spellcheckState.cellsChange.push(new Asc.Range(cell.col, cell.row, cell.col, cell.row));
        }

        if (afterReplace && !usrCorrect[lastIndex]) {
          afterReplace = false;
          break;
        }

        ++lastIndex;

        if (!afterReplace && !usrCorrect[lastIndex]) {
          afterReplace = false;
          break;
        }
      }
      this.spellcheckState.afterReplace = afterReplace;
      this.spellcheckState.lastIndex = lastIndex;
      this.SpellCheck_CallBack(this.spellcheckState.lastSpellInfo);
      return;
    }

    var maxC = ws.model.getColsCount() - 1;
    var maxR = ws.model.getRowsCount() - 1;
    if (-1 === maxC || -1 === maxR) {
      this.handlers.trigger("asc_onSpellCheckVariantsFound", new AscCommon.asc_CSpellCheckProperty());
      return;
    }

    if (!this.spellcheckState.startCell) {
      this.spellcheckState.startCell = activeCell.clone();
      if (this.spellcheckState.startCell.col > maxC) {
        this.spellcheckState.startCell.row += 1;
        this.spellcheckState.startCell.col = 0;
      }
      if (this.spellcheckState.startCell.row > maxR) {
        this.spellcheckState.startCell.row = 0;
        this.spellcheckState.startCell.col = 0;
      }
      this.spellcheckState.currentCell = this.spellcheckState.startCell.clone();
    }

    var startCell = this.spellcheckState.startCell;
    var currentCell = this.spellcheckState.currentCell;
    var lang = this.defaultLanguage;

    var langArray = [];
    var wordsArray = [];
    cellsInfo = [];
    var wordsIndexArray = [];
    var isEnd = false;

    do {
      if (this.spellcheckState.iteration && currentCell.row > startCell.row) {
        break;
      }
      if (currentCell.row > maxR) {
        currentCell.row = 0;
        currentCell.col = 0;
        this.spellcheckState.iteration = true;
      }
      if (this.spellcheckState.iteration && currentCell.row === startCell.row) {
        maxC = startCell.col - 1;
      }
      if (currentCell.col > maxC) {
        this.spellcheckState.nextRow();
        continue;
      }
      ws.model.getRange3(currentCell.row, currentCell.col, currentCell.row, maxC)._foreachNoEmpty(function (cell, r, c) {
        if (cell.text !== null) {
          var cellInfo = new AscCommon.CellBase(r, c);
          var wordsObject = AscCommonExcel.WordSplitting(cell.text);
          var words = wordsObject.wordsArray;
          var wordsIndex = wordsObject.wordsIndex;
          for (var i = 0; i < words.length; ++i) {
            wordsArray.push(words[i]);
            wordsIndexArray.push(wordsIndex[i]);
            langArray.push(lang);
            cellsInfo.push(cellInfo);
          }
          isEnd = true;
        }
      });
      if (isEnd) {
        break;
      }
      this.spellcheckState.nextRow();
    } while (true);

    if (0 < wordsArray.length) {
      this.spellcheckState.lockSpell = true;
      this.SpellCheckApi.spellCheck({
        "type": "spell",
        "usrWords": wordsArray,
        "usrLang": langArray,
        "cellsInfo": cellsInfo,
        "wordsIndex": wordsIndexArray
      });
    } else {
      this.handlers.trigger("asc_onSpellCheckVariantsFound", new AscCommon.asc_CSpellCheckProperty());
      var lastFindOptions = this.spellcheckState.lastFindOptions;
      var cellsChange = this.spellcheckState.cellsChange;
      if (cellsChange.length !== 0 && lastFindOptions) {
        this.spellcheckState.lockSpell = true;
        this.asc_replaceMisspelledWords(lastFindOptions);
      }
      this.spellcheckState.isStart = false;
    }
  };

  spreadsheet_api.prototype.asc_replaceMisspelledWord = function(newWord, variantsFound, replaceAll) {
    var options = new Asc.asc_CFindOptions();
    options.isSpellCheck = true;
    options.wordsIndex = this.spellcheckState.wordsIndex;
    this.spellcheckState.newWord = newWord;
    options.isMatchCase = true;
    
    if (replaceAll === true) {
      if (!this.spellcheckState.isIgnoreUppercase) {
        this.spellcheckState.changeWords[variantsFound.Word] = newWord;
      } else {
        this.spellcheckState.changeWords[variantsFound.Word.toLowerCase()] = newWord;
      }
      options.isReplaceAll = true;
    } 
      this.spellcheckState.lockSpell = false;
      this.spellcheckState.lastFindOptions = options;
      this.asc_nextWord();
  };

    spreadsheet_api.prototype.asc_replaceMisspelledWords = function (options) {
      var t = this;
      var ws = this.wb.getWorksheet();
      var cellsChange = this.spellcheckState.cellsChange;
      var changeWords = this.spellcheckState.changeWords;
      var cellText = this.spellcheckState.cellText;
      var newCellText = this.spellcheckState.newCellText;
      
      if (!newCellText) { 
        cellText = null; 
        newCellText = null;
      }

      var replaceWords = [];
      options.isWholeWord = true;
      for (var key in changeWords) {
        replaceWords.push([AscCommonExcel.getFindRegExp(key, options), changeWords[key]]);
      }
      options.findWhat = cellText;
      options.isMatchCase = true;
      options.replaceWith = newCellText;
      options.replaceWords = replaceWords;

      ws._replaceCellsText(cellsChange, options, false, function () {
        t.spellcheckState.cellsChange = [];
        options.indexInArray = 0;
        var lastSpell = t.spellcheckState.lastSpellInfo;
        if (lastSpell) {
          var lastIndex = t.spellcheckState.lastIndex;
          var cellInfo = lastSpell["cellsInfo"][lastIndex];
          var activeCell = ws.model.selectionRange.activeCell;
          var dc = cellInfo.col - activeCell.col;
          var dr = cellInfo.row - activeCell.row;
          t.spellcheckState.lockSpell = true;
          var d = ws.changeSelectionStartPoint(dc, dr);
          t.controller.scroll(d);
          t.spellcheckState.lockSpell = false;
          t.spellcheckState.newWord = null;
          t.spellcheckState.newCellText = null;
          t.spellcheckState.afterReplace = true;
          t.spellcheckState.lastIndex = 0;
          t.spellcheckState.cellText = t.asc_getCellInfo().text;
          t.asc_nextWord();
          return;
        }
        t.spellcheckState.lockSpell = false;
      });
    };

  spreadsheet_api.prototype.asc_ignoreMisspelledWord = function(spellCheckProperty, ignoreAll) {
    if (ignoreAll) {
      var word = spellCheckProperty.Word;
        this.spellcheckState.ignoreWords[word] = word;
    }
    this.asc_nextWord();
  };

    spreadsheet_api.prototype.asc_ignoreNumbers = function (isIgnore) {
      this.spellcheckState.isIgnoreNumbers = true;
      if (!isIgnore) {
        this.spellcheckState.isIgnoreNumbers = false;
      }
    };

    spreadsheet_api.prototype.asc_ignoreUppercase = function (isIgnore) {
      this.spellcheckState.isIgnoreUppercase = true;
      if (!isIgnore) {
        this.spellcheckState.isIgnoreUppercase = false;
      }
    };

  spreadsheet_api.prototype.asc_cancelSpellCheck = function() {
    this.cleanSpelling();
  }
  
  // Frozen pane
  spreadsheet_api.prototype.asc_freezePane = function () {
    this.wb.getWorksheet().freezePane();
  };

	spreadsheet_api.prototype.asc_setSparklineGroup = function (id, oSparklineGroup) {
		var t = this;
		var changeSparkline = function (res) {
			if (res) {
				var changedSparkline = g_oTableId.Get_ById(id);
				if (changedSparkline) {
					History.Create_NewPoint();
					History.StartTransaction();
					changedSparkline.set(oSparklineGroup);
					History.EndTransaction();
					t.wb._onWSSelectionChanged();
					t.wb.getWorksheet().draw();
				}
			}
		};
		this._isLockedSparkline(id, changeSparkline);
	};

    spreadsheet_api.prototype.asc_setListType = function (type, subtype, size, unicolor, nNumStartAt) {
      var t = this;
        var sNeedFont = AscFormat.fGetFontByNumInfo(type, subtype);
      if(typeof sNeedFont === "string" && sNeedFont.length > 0){
          var t = this, fonts = {};
          fonts[sNeedFont] = 1;
          t._loadFonts(fonts, function() {t.asc_setListType2(type, subtype, size, unicolor, nNumStartAt);});
      }
      else{
          t.asc_setListType2(type, subtype, size, unicolor, nNumStartAt);
      }
    };
    spreadsheet_api.prototype.asc_setListType2 = function (type, subtype, size, unicolor, nNumStartAt) {
        var oWorksheet = this.wb.getWorksheet();
        if(oWorksheet){
            if(oWorksheet.isSelectOnShape){
                return oWorksheet.objectRender.setListType(type, subtype, size, unicolor, nNumStartAt);
            }
        }
    };

  // Cell interface
  spreadsheet_api.prototype.asc_getCellInfo = function() {
    return this.wb.getSelectionInfo();
  };

  // Получить координаты активной ячейки
  spreadsheet_api.prototype.asc_getActiveCellCoord = function() {
    var oWorksheet = this.wb.getWorksheet();
    if(oWorksheet){
      if(oWorksheet.isSelectOnShape){
        return oWorksheet.objectRender.getContextMenuPosition();
      }
      else{
          return oWorksheet.getActiveCellCoord();
      }
    }

  };

  // Получить координаты для каких-либо действий (для общей схемы)
  spreadsheet_api.prototype.asc_getAnchorPosition = function() {
    return this.asc_getActiveCellCoord();
  };

  // Получаем свойство: редактируем мы сейчас или нет
  spreadsheet_api.prototype.asc_getCellEditMode = function() {
    return this.wb ? this.wb.getCellEditMode() : false;
  };

  spreadsheet_api.prototype.asc_getHeaderFooterMode = function() {
	  return this.wb && this.wb.getCellEditMode() && this.wb.cellEditor && this.wb.cellEditor.options &&
		  this.wb.cellEditor.options.menuEditor;
  };

  spreadsheet_api.prototype.asc_getIsTrackShape = function()  {
    return this.wb ? this.wb.getIsTrackShape() : false;
  };

  spreadsheet_api.prototype.asc_setCellFontName = function(fontName) {
    var t = this, fonts = {};
    fonts[fontName] = 1;
    t._loadFonts(fonts, function() {
      var ws = t.wb.getWorksheet();
      if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellFontName) {
        ws.objectRender.controller.setCellFontName(fontName);
      } else {
        t.wb.setFontAttributes("fn", fontName);
        t.wb.restoreFocus();
      }
    });
  };

  spreadsheet_api.prototype.asc_setCellFontSize = function(fontSize) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellFontSize) {
      ws.objectRender.controller.setCellFontSize(fontSize);
    } else {
      this.wb.setFontAttributes("fs", fontSize);
      this.wb.restoreFocus();
    }
  };

  spreadsheet_api.prototype.asc_setCellBold = function(isBold) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellBold) {
      ws.objectRender.controller.setCellBold(isBold);
    } else {
      this.wb.setFontAttributes("b", isBold);
      this.wb.restoreFocus();
    }
  };

  spreadsheet_api.prototype.asc_setCellItalic = function(isItalic) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellItalic) {
      ws.objectRender.controller.setCellItalic(isItalic);
    } else {
      this.wb.setFontAttributes("i", isItalic);
      this.wb.restoreFocus();
    }
  };

  spreadsheet_api.prototype.asc_setCellUnderline = function(isUnderline) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellUnderline) {
      ws.objectRender.controller.setCellUnderline(isUnderline);
    } else {
      this.wb.setFontAttributes("u", isUnderline ? Asc.EUnderline.underlineSingle : Asc.EUnderline.underlineNone);
      this.wb.restoreFocus();
    }
  };

  spreadsheet_api.prototype.asc_setCellStrikeout = function(isStrikeout) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellStrikeout) {
      ws.objectRender.controller.setCellStrikeout(isStrikeout);
    } else {
      this.wb.setFontAttributes("s", isStrikeout);
      this.wb.restoreFocus();
    }
  };

  spreadsheet_api.prototype.asc_setCellSubscript = function(isSubscript) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellSubscript) {
      ws.objectRender.controller.setCellSubscript(isSubscript);
    } else {
      this.wb.setFontAttributes("fa", isSubscript ? AscCommon.vertalign_SubScript : null);
      this.wb.restoreFocus();
    }
  };

  spreadsheet_api.prototype.asc_setCellSuperscript = function(isSuperscript) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellSuperscript) {
      ws.objectRender.controller.setCellSuperscript(isSuperscript);
    } else {
      this.wb.setFontAttributes("fa", isSuperscript ? AscCommon.vertalign_SuperScript : null);
      this.wb.restoreFocus();
    }
  };

  spreadsheet_api.prototype.asc_setCellAlign = function(align) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellAlign) {
      ws.objectRender.controller.setCellAlign(align);
    } else {
      this.wb.getWorksheet().setSelectionInfo("a", align);
      this.wb.restoreFocus();
    }
  };

  spreadsheet_api.prototype.asc_setCellVertAlign = function(align) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellVertAlign) {
      ws.objectRender.controller.setCellVertAlign(align);
    } else {
      this.wb.getWorksheet().setSelectionInfo("va", align);
      this.wb.restoreFocus();
    }
  };

  spreadsheet_api.prototype.asc_setCellTextWrap = function(isWrapped) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellTextWrap) {
      ws.objectRender.controller.setCellTextWrap(isWrapped);
    } else {
      this.wb.getWorksheet().setSelectionInfo("wrap", isWrapped);
      this.wb.restoreFocus();
    }
  };

  spreadsheet_api.prototype.asc_setCellTextShrink = function(isShrinked) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellTextShrink) {
      ws.objectRender.controller.setCellTextShrink(isShrinked);
    } else {
      this.wb.getWorksheet().setSelectionInfo("shrink", isShrinked);
      this.wb.restoreFocus();
    }
  };

  spreadsheet_api.prototype.asc_setCellTextColor = function(color) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellTextColor) {
      ws.objectRender.controller.setCellTextColor(color);
    } else {
      if (color instanceof Asc.asc_CColor) {
        color = AscCommonExcel.CorrectAscColor(color);
        this.wb.setFontAttributes("c", color);
        this.wb.restoreFocus();
      }
    }

  };

  spreadsheet_api.prototype.asc_setCellFill = function (fill) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellBackgroundColor) {
      ws.objectRender.controller.setCellBackgroundColor(fill);
    } else {
      this.wb.getWorksheet().setSelectionInfo("f", fill);
      this.wb.restoreFocus();
    }
  };

  spreadsheet_api.prototype.asc_setCellBackgroundColor = function(color) {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellBackgroundColor) {
      ws.objectRender.controller.setCellBackgroundColor(color);
    } else {
      if (color instanceof Asc.asc_CColor || null == color) {
        if (null != color) {
          color = AscCommonExcel.CorrectAscColor(color);
        }
        this.wb.getWorksheet().setSelectionInfo("bc", color);
        this.wb.restoreFocus();
      }
    }
  };

  spreadsheet_api.prototype.asc_setCellBorders = function(borders) {
    this.wb.getWorksheet().setSelectionInfo("border", borders);
    this.wb.restoreFocus();
  };

  spreadsheet_api.prototype.asc_setCellFormat = function(format) {
    var t = this;
    //todo split setCellFormat into set->_loadFonts->draw and remove checkCultureInfoFontPicker(checkCultureInfoFontPicker is called inside StyleManager.setNum)
    var numFormat = AscCommon.oNumFormatCache.get(format);
    numFormat.checkCultureInfoFontPicker();
    this._loadFonts([], function () {
      t.wb.setCellFormat(format);
      t.wb.restoreFocus();
    });
  };

  spreadsheet_api.prototype.asc_setCellAngle = function(angle) {

    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.setCellAngle) {
      ws.objectRender.controller.setCellAngle(angle);
    } else {
      this.wb.getWorksheet().setSelectionInfo("angle", angle);
      this.wb.restoreFocus();
    }
  };

  spreadsheet_api.prototype.asc_setCellStyle = function(name) {
    this.wb.getWorksheet().setSelectionInfo("style", name);
    this.wb.restoreFocus();
  };

  spreadsheet_api.prototype.asc_increaseCellDigitNumbers = function() {
    this.wb.getWorksheet().setSelectionInfo("changeDigNum", +1);
    this.wb.restoreFocus();
  };

  spreadsheet_api.prototype.asc_decreaseCellDigitNumbers = function() {
    this.wb.getWorksheet().setSelectionInfo("changeDigNum", -1);
    this.wb.restoreFocus();
  };

  // Увеличение размера шрифта
  spreadsheet_api.prototype.asc_increaseFontSize = function() {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.increaseFontSize) {
      ws.objectRender.controller.increaseFontSize();
    } else {
      this.wb.changeFontSize("changeFontSize", true);
      this.wb.restoreFocus();
    }
  };

  // Уменьшение размера шрифта
  spreadsheet_api.prototype.asc_decreaseFontSize = function() {
    var ws = this.wb.getWorksheet();
    if (ws.objectRender.selectedGraphicObjectsExists() && ws.objectRender.controller.decreaseFontSize) {
      ws.objectRender.controller.decreaseFontSize();
    } else {
      this.wb.changeFontSize("changeFontSize", false);
      this.wb.restoreFocus();
    }
  };

  // Формат по образцу
  spreadsheet_api.prototype.asc_formatPainter = function(stateFormatPainter) {
    if (this.wb) {
      this.wb.formatPainter(stateFormatPainter);
    }
  };

  spreadsheet_api.prototype.asc_showAutoComplete = function() {
    this.wb.showAutoComplete();
  };

  spreadsheet_api.prototype.asc_onMouseUp = function(event, x, y) {
    if (this.wb) {
      this.wb._onWindowMouseUpExternal(event, x, y);
    }
  };

  //

  spreadsheet_api.prototype.asc_selectFunction = function() {

  };

	spreadsheet_api.prototype.asc_insertHyperlink = function (options) {
		AscFonts.FontPickerByCharacter.checkText(options.text, this, function () {
			this.wb.insertHyperlink(options);
		});
	};

  spreadsheet_api.prototype.asc_removeHyperlink = function() {
    this.wb.removeHyperlink();
  };

  spreadsheet_api.prototype.asc_insertFormula = function(functionName, type, autoComplete) {
    this.wb.insertFormulaInEditor(functionName, type, autoComplete);
    this.wb.restoreFocus();
  };

  spreadsheet_api.prototype.asc_getFormulasInfo = function() {
    return this.formulasList;
  };
  spreadsheet_api.prototype.asc_getFormulaLocaleName = function(name) {
    return AscCommonExcel.cFormulaFunctionToLocale ? AscCommonExcel.cFormulaFunctionToLocale[name] : name;
  };
  spreadsheet_api.prototype.asc_getFormulaNameByLocale = function (name) {
    var f = AscCommonExcel.cFormulaFunctionLocalized && AscCommonExcel.cFormulaFunctionLocalized[name];
    return f ? f.prototype.name : name;
  };

  spreadsheet_api.prototype.asc_calculate = function(type) {
    this.wb.calculate(type);
  };

  spreadsheet_api.prototype.asc_setFontRenderingMode = function(mode) {
    if (mode !== this.fontRenderingMode) {
      this.fontRenderingMode = mode;
      if (this.wb) {
        this.wb.setFontRenderingMode(mode, /*isInit*/false);
      }
    }
  };

  /**
   * Режим выбора диапазона
   * @param {Asc.c_oAscSelectionDialogType} selectionDialogType
   * @param selectRange
   */
  spreadsheet_api.prototype.asc_setSelectionDialogMode = function(selectionDialogType, selectRange) {
    this.controller.setSelectionDialogMode(Asc.c_oAscSelectionDialogType.None !== selectionDialogType);
    if (this.wb) {
      this.wb._onStopFormatPainter();
      this.wb.setSelectionDialogMode(selectionDialogType, selectRange);
    }
  };

  spreadsheet_api.prototype.asc_SendThemeColors = function(colors, standart_colors) {
    this._gui_control_colors = { Colors: colors, StandartColors: standart_colors };
    var ret = this.handlers.trigger("asc_onSendThemeColors", colors, standart_colors);
    if (false !== ret) {
      this._gui_control_colors = null;
    }
  };

  spreadsheet_api.prototype.getCurrentTheme = function()
  {
     return this.wbModel && this.wbModel.theme;
  };

	spreadsheet_api.prototype.asc_ChangeColorScheme = function (sSchemeName) {
		var t = this;
		var onChangeColorScheme = function (res) {
			if (res) {
				if (t.wbModel.changeColorScheme(sSchemeName)) {
					t.asc_AfterChangeColorScheme();
				}
			}
		};
		// ToDo поправить заглушку, сделать новый тип lock element-а
		var sheetId = -1; // Делаем не существующий лист и не существующий объект
		var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, /*subType*/null, sheetId,
			sheetId);
		this.collaborativeEditing.lock([lockInfo], onChangeColorScheme);
	};

  spreadsheet_api.prototype.asc_ChangeColorSchemeByIdx = function (nIdx) {
    var t = this;
    var onChangeColorScheme = function (res) {
      if (res) {
        if (t.wbModel.changeColorSchemeByIdx(nIdx)) {
          t.asc_AfterChangeColorScheme();
        }
      }
    };
    // ToDo поправить заглушку, сделать новый тип lock element-а
    var sheetId = -1; // Делаем не существующий лист и не существующий объект
    var lockInfo = this.collaborativeEditing.getLockInfo(c_oAscLockTypeElem.Object, /*subType*/null, sheetId,
        sheetId);
    this.collaborativeEditing.lock([lockInfo], onChangeColorScheme);
  };


  spreadsheet_api.prototype.asc_AfterChangeColorScheme = function() {
    this.asc_CheckGuiControlColors();
    this.asc_ApplyColorScheme(true);
  };
  spreadsheet_api.prototype.asc_ApplyColorScheme = function(bRedraw) {

    if (window['IS_NATIVE_EDITOR'] || !window["NATIVE_EDITOR_ENJINE"]) {
      var wsViews = Asc["editor"].wb.wsViews;
      History.Get_RecalcData();
      for (var i = 0; i < wsViews.length; ++i) {
        if (wsViews[i] && wsViews[i].objectRender && wsViews[i].objectRender.controller) {
          wsViews[i].objectRender.controller.startRecalculate(false);
        }
      }
      this.chartPreviewManager.clearPreviews();
      this.textArtPreviewManager.clear();
    }

    // На view-режиме не нужно отправлять стили
    if (this.canEdit()) {
      // Отправка стилей
      this._sendWorkbookStyles();
    }

    if (bRedraw) {
      this.handlers.trigger("asc_onUpdateChartStyles");
      this.handlers.trigger("asc_onSelectionChanged", this.asc_getCellInfo());
      this.wb.drawWS();
    }
  };

  /////////////////////////////////////////////////////////////////////////
  ////////////////////////////AutoSave api/////////////////////////////////
  /////////////////////////////////////////////////////////////////////////
	spreadsheet_api.prototype._autoSaveInner = function () {
		if (this.asc_getCellEditMode() || this.asc_getIsTrackShape()) {
		  return;
        }

		if (!History.Have_Changes(true) && !(this.collaborativeEditing.getCollaborativeEditing() &&
			0 !== this.collaborativeEditing.getOwnLocksLength())) {
			if (this.collaborativeEditing.getFast() && this.collaborativeEditing.haveOtherChanges()) {
				AscCommon.CollaborativeEditing.Clear_CollaborativeMarks();

				// Принимаем чужие изменения
				this.collaborativeEditing.applyChanges();
				// Пересылаем свои изменения (просто стираем чужие lock-и, т.к. своих изменений нет)
				this.collaborativeEditing.sendChanges();
				// Шлем update для toolbar-а, т.к. когда select в lock ячейке нужно заблокировать toolbar
				this.wb._onWSSelectionChanged();
			}
			return;
		}
		if (null === this.lastSaveTime) {
			this.lastSaveTime = new Date();
			return;
		}
		var saveGap = this.collaborativeEditing.getFast() ? this.autoSaveGapRealTime :
			(this.collaborativeEditing.getCollaborativeEditing() ? this.autoSaveGapSlow : this.autoSaveGapFast);
		var gap = new Date() - this.lastSaveTime - saveGap;
		if (0 <= gap) {
			this.asc_Save(true);
		}
	};

	spreadsheet_api.prototype._onUpdateDocumentCanSave = function () {
		// Можно модифицировать это условие на более быстрое (менять самим состояние в аргументах, а не запрашивать каждый раз)
		var tmp = History.Have_Changes() || (this.collaborativeEditing.getCollaborativeEditing() &&
			0 !== this.collaborativeEditing.getOwnLocksLength()) || this.asc_getCellEditMode();
		if (tmp !== this.isDocumentCanSave) {
			this.isDocumentCanSave = tmp;
			this.handlers.trigger('asc_onDocumentCanSaveChanged', this.isDocumentCanSave);
		}
	};
	spreadsheet_api.prototype._onUpdateDocumentCanUndoRedo = function () {
		AscCommon.History._sendCanUndoRedo();
	};

  spreadsheet_api.prototype._onCheckCommentRemoveLock = function(lockElem) {
    var res = false;
    var sheetId = lockElem["sheetId"];
    if (-1 !== sheetId && 0 === sheetId.indexOf(AscCommonExcel.CCellCommentator.sStartCommentId)) {
      // Коммментарий
      res = true;
      this.handlers.trigger("asc_onUnLockComment", lockElem["rangeOrObjectId"]);
    }
    return res;
  };

  spreadsheet_api.prototype.onUpdateDocumentModified = function(bIsModified) {
    // Обновляем только после окончания сохранения
    if (this.canSave) {
      this.handlers.trigger("asc_onDocumentModifiedChanged", bIsModified);
      this._onUpdateDocumentCanSave();

      if (undefined !== window["AscDesktopEditor"]) {
        window["AscDesktopEditor"]["onDocumentModifiedChanged"](bIsModified);
      }
    }
  };

	// Выставление локали
	spreadsheet_api.prototype.asc_setLocalization = function (oLocalizedData) {
		if (!this.isLoadFullApi) {
			this.tmpLocalization = oLocalizedData;
			return;
		}

		if (null == oLocalizedData) {
			AscCommonExcel.cFormulaFunctionLocalized = null;
			AscCommonExcel.cFormulaFunctionToLocale = null;
		} else {
			AscCommonExcel.cFormulaFunctionLocalized = {};
			AscCommonExcel.cFormulaFunctionToLocale = {};
			var localName;
			for (var i in AscCommonExcel.cFormulaFunction) {
				localName = oLocalizedData[i] ? oLocalizedData[i] : null;
				localName = localName ? localName : i;
				AscCommonExcel.cFormulaFunctionLocalized[localName] = AscCommonExcel.cFormulaFunction[i];
				AscCommonExcel.cFormulaFunctionToLocale[i] = localName;
			}
		}
		AscCommon.build_local_rx(oLocalizedData ? oLocalizedData["LocalFormulaOperands"] : null);
		if (this.wb) {
			this.wb.initFormulasList();
		}
		if (this.wbModel) {
			this.wbModel.rebuildColors();
		}
	};

  spreadsheet_api.prototype.asc_nativeOpenFile = function(base64File, version, isUser, xlsxPath) {
	var t = this;
    asc["editor"] = this;

    this.SpellCheckUrl = '';
 
    if (undefined == isUser) {
        this.User = new AscCommon.asc_CUser();
        this.User.setId("TM");
        this.User.setUserName("native");
    }
    if (undefined !== version) {
      AscCommon.CurFileVersion = version;
    }

    this._openDocument(base64File);
	var thenCallback = function() {
		g_oIdCounter.Set_Load(false);
		AscCommon.checkCultureInfoFontPicker();
		AscCommonExcel.checkStylesNames(t.wbModel.CellStyles);
		t._coAuthoringInit();
		t.wb = new AscCommonExcel.WorkbookView(t.wbModel, t.controller, t.handlers, window["_null_object"], window["_null_object"], t, t.collaborativeEditing, t.fontRenderingMode);
	};
	return this.openDocumentFromZip(t.wbModel, xlsxPath).then(thenCallback, thenCallback);
  };

  spreadsheet_api.prototype.asc_nativeCalculateFile = function() {
    window['DoctRendererMode'] = true;	
    this.wb._nativeCalculate();
  };

  spreadsheet_api.prototype.asc_nativeApplyChanges = function(changes) {
    for (var i = 0, l = changes.length; i < l; ++i) {
      this.CoAuthoringApi.onSaveChanges(changes[i], null, true);
    }
    this.collaborativeEditing.applyChanges();
  };

  spreadsheet_api.prototype.asc_nativeApplyChanges2 = function(data, isFull) {
    if (null != this.wbModel) {
      this.oRedoObjectParamNative = this.wbModel.DeserializeHistoryNative(this.oRedoObjectParamNative, data, isFull);
    }
    if (isFull) {
      this._onUpdateAfterApplyChanges();
    }
  };

  spreadsheet_api.prototype.asc_nativeGetFile = function() {
    var oBinaryFileWriter = new AscCommonExcel.BinaryFileWriter(this.wbModel);
    return oBinaryFileWriter.Write();
  };
  spreadsheet_api.prototype.asc_nativeGetFile3 = function()
  {
      var oBinaryFileWriter = new AscCommonExcel.BinaryFileWriter(this.wbModel);
      oBinaryFileWriter.Write(true, true);
      return { data: oBinaryFileWriter.Write(true, true), header: oBinaryFileWriter.WriteFileHeader(oBinaryFileWriter.Memory.GetCurPosition(), Asc.c_nVersionNoBase64) };
  };
  spreadsheet_api.prototype.asc_nativeGetFileData = function() {
    var oBinaryFileWriter = new AscCommonExcel.BinaryFileWriter(this.wbModel);
    oBinaryFileWriter.Write(true);

    var _header = oBinaryFileWriter.WriteFileHeader(oBinaryFileWriter.Memory.GetCurPosition(), Asc.c_nVersionNoBase64);
    window["native"]["Save_End"](_header, oBinaryFileWriter.Memory.GetCurPosition());

    return oBinaryFileWriter.Memory.ImData.data;
  };
  spreadsheet_api.prototype.asc_nativeCalculate = function() {
  };

  spreadsheet_api.prototype.asc_nativePrint = function (_printer, _page, _options) {
    var _adjustPrint = (window.AscDesktopEditor_PrintOptions && window.AscDesktopEditor_PrintOptions.advancedOptions) || new Asc.asc_CAdjustPrint();
    window.AscDesktopEditor_PrintOptions = undefined;

    var pageSetup;
    var countWorksheets = this.wbModel.getWorksheetCount();

    if(_options) {
      //печатаем только 1 страницу первой книги
      var isOnlyFirstPage = _options["printOptions"] && _options["printOptions"]["onlyFirstPage"];
       if(isOnlyFirstPage) {
		   _adjustPrint.isOnlyFirstPage = true;
       }
	   var spreadsheetLayout = _options["spreadsheetLayout"];
	   var _ignorePrintArea = spreadsheetLayout && (true === spreadsheetLayout["ignorePrintArea"] || false === spreadsheetLayout["ignorePrintArea"])? spreadsheetLayout["ignorePrintArea"] : null;
	   if(null !== _ignorePrintArea) {
		   _adjustPrint.asc_setIgnorePrintArea(_ignorePrintArea);
       } else {
		   _adjustPrint.asc_setIgnorePrintArea(true);
       }

	   _adjustPrint.asc_setPrintType(Asc.c_oAscPrintType.EntireWorkbook);

       var ws, newPrintOptions;
	   var _orientation = spreadsheetLayout ? spreadsheetLayout["orientation"] : null;
	   if(_orientation === "portrait") {
		   _orientation = Asc.c_oAscPageOrientation.PagePortrait;
       } else if(_orientation === "landscape") {
		   _orientation = Asc.c_oAscPageOrientation.PageLandscape;
       } else {
		   _orientation = null;
       }
       //need number
	   var _fitToWidth = spreadsheetLayout && AscCommon.isNumber( spreadsheetLayout["fitToWidth"]) ? spreadsheetLayout["fitToWidth"] : null;
	   var _fitToHeight = spreadsheetLayout && AscCommon.isNumber( spreadsheetLayout["fitToHeight"]) ? spreadsheetLayout["fitToHeight"] : null;
	   var _scale = spreadsheetLayout && AscCommon.isNumber( spreadsheetLayout["scale"]) ? spreadsheetLayout["scale"] : null;
	   //need true/false
	   var _headings = spreadsheetLayout && (true === spreadsheetLayout["headings"] || false === spreadsheetLayout["headings"])? spreadsheetLayout["headings"] : null;
	   var _gridLines = spreadsheetLayout && (true === spreadsheetLayout["gridLines"] || false === spreadsheetLayout["gridLines"])? spreadsheetLayout["gridLines"] : null;
       //convert to mm
	   var _pageSize = spreadsheetLayout ? spreadsheetLayout["pageSize"] : null;
	   if(_pageSize) {
	     var width = AscCommon.valueToMm(_pageSize["width"]);
	     var height = AscCommon.valueToMm(_pageSize["height"]);
	     _pageSize = null !== width && null !== height ? {width: width, height: height} : null;
       }
	   var _margins = spreadsheetLayout ? spreadsheetLayout["margins"] : null;
	   if(_margins) {
         var left = AscCommon.valueToMm(_margins["left"]);
         var right = AscCommon.valueToMm(_margins["right"]);
         var top = AscCommon.valueToMm(_margins["top"]);
         var bottom = AscCommon.valueToMm(_margins["bottom"]);
         _margins = null !== left && null !== right && null !== top && null !== bottom ? {left: left, right: right, top: top, bottom: bottom} : null;
       }

	   for (var index = 0; index < this.wbModel.getWorksheetCount(); ++index) {
           ws = this.wbModel.getWorksheet(index);
           newPrintOptions = ws.PagePrintOptions.clone();
           //regionalSettings ?

           var _pageSetup = newPrintOptions.pageSetup;
           if (null !== _orientation) {
               _pageSetup.orientation = _orientation;
           }
           if (_fitToWidth || _fitToHeight) {
               _pageSetup.fitToWidth = _fitToWidth;
               _pageSetup.fitToHeight = _fitToHeight;
           } else if (_scale) {
               _pageSetup.scale = _scale;
               _pageSetup.fitToWidth = 0;
               _pageSetup.fitToHeight = 0;
           }
           if (null !== _headings) {
               newPrintOptions.headings = _headings;
           }
           if (null !== _gridLines) {
               newPrintOptions.gridLines = _gridLines;
           }
           if (_pageSize) {
               _pageSetup.width = _pageSize.width;
               _pageSetup.height = _pageSize.height;
           }
           var pageMargins = newPrintOptions.pageMargins;
           if (_margins) {
               pageMargins.left = _margins.left;
               pageMargins.right = _margins.right;
               pageMargins.top = _margins.top;
               pageMargins.bottom = _margins.bottom;
           }

           if (!_adjustPrint.pageOptionsMap) {
               _adjustPrint.pageOptionsMap = [];
           }
           _adjustPrint.pageOptionsMap[index] = newPrintOptions;
       }
    }

    var _printPagesData = this.wb.calcPagesPrint(_adjustPrint);

    if (undefined === _printer && _page === undefined) {
      _printer = this.wb.printSheets(_printPagesData).DocumentRenderer;

      if (undefined !== window["AscDesktopEditor"]) {
        var pagescount = _printer.m_lPagesCount;

        window["AscDesktopEditor"]["Print_Start"](this.documentId + "/", pagescount, "", -1);

        for (var i = 0; i < pagescount; i++) {
          var _start = _printer.m_arrayPages[i].StartOffset;
          var _end = _printer.Memory.pos;
          if (i != (pagescount - 1)) {
            _end = _printer.m_arrayPages[i + 1].StartOffset;
          }

          window["AscDesktopEditor"]["Print_Page"](
			  _printer.Memory.GetBase64Memory2(_start, _end - _start),
			  _printer.m_arrayPages[i].Width, _printer.m_arrayPages[i].Height);
        }

        // detect fit flag
        var paramEnd = 0;
        if (_adjustPrint && _adjustPrint.asc_getPrintType() == Asc.c_oAscPrintType.EntireWorkbook) {
          for (var j = 0; j < countWorksheets; ++j) {
            if (_adjustPrint && _adjustPrint.pageOptionsMap && _adjustPrint.pageOptionsMap[j]) {
              pageSetup = _adjustPrint.pageOptionsMap[j].pageSetup;
            } else {
              pageSetup = this.wbModel.getWorksheet(j).PagePrintOptions.asc_getPageSetup();
            }
            if (pageSetup.asc_getFitToWidth() || pageSetup.asc_getFitToHeight())
              paramEnd |= 1;
          }
        }

        if (_adjustPrint && _adjustPrint.asc_getPrintType() == Asc.c_oAscPrintType.ActiveSheets) {
          var activeSheet = this.wbModel.getActive();
          if (_adjustPrint && _adjustPrint.pageOptionsMap && _adjustPrint.pageOptionsMap[activeSheet]) {
            pageSetup = _adjustPrint.pageOptionsMap[activeSheet].pageSetup;
          } else {
            pageSetup = this.wbModel.getWorksheet(activeSheet).PagePrintOptions.asc_getPageSetup();
          }
          if (pageSetup.asc_getFitToWidth() || pageSetup.asc_getFitToHeight())
            paramEnd |= 1;
        }

        window["AscDesktopEditor"]["Print_End"](paramEnd);
      }
    } else {
      this.wb.printSheets(_printPagesData, _printer);
    }

    return _printer.Memory;
  };

  spreadsheet_api.prototype.asc_nativePrintPagesCount = function() {
    return 1;
  };

  spreadsheet_api.prototype.asc_nativeGetPDF = function(options) {
    var _ret = this.asc_nativePrint(undefined, undefined, options);

    window["native"]["Save_End"]("", _ret.GetCurPosition());
    return _ret.data;
  };

  spreadsheet_api.prototype.asc_canPaste = function () {
    History.Create_NewPoint();
    History.StartTransaction();
    return true;
  };
  spreadsheet_api.prototype.asc_endPaste = function () {
    History.EndTransaction();
  };
  spreadsheet_api.prototype.asc_Recalculate = function () {
      History.EndTransaction();
      this._onUpdateAfterApplyChanges();
  };


  spreadsheet_api.prototype.pre_Paste = function(_fonts, _images, callback)
  {
    AscFonts.FontPickerByCharacter.extendFonts(_fonts);

    var oFontMap = {};
    for(var i = 0; i < _fonts.length; ++i){
      oFontMap[_fonts[i].name] = 1;
    }
    this._loadFonts(oFontMap, function() {

      var aImages = [];
      for(var key in _images){
        if(_images.hasOwnProperty(key)){
          aImages.push(_images[key])
        }
      }
      if(aImages.length > 0)      {
         window["Asc"]["editor"].ImageLoader.LoadDocumentImages(aImages);
      }
      callback();
    });
  };

  spreadsheet_api.prototype.getDefaultFontFamily = function () {
      return this.wbModel.getDefaultFont();
  };

  spreadsheet_api.prototype.getDefaultFontSize = function () {
      return this.wbModel.getDefaultSize();
  };

	spreadsheet_api.prototype._onEndLoadSdk = function () {
		AscCommon.baseEditorsApi.prototype._onEndLoadSdk.call(this);

		History = AscCommon.History;

		this.controller = new AscCommonExcel.asc_CEventsController();

		this.formulasList = AscCommonExcel.getFormulasInfo();
		this.asc_setLocale(this.tmpLCID, this.tmpDecimalSeparator, this.tmpGroupSeparator);
		this.asc_setLocalization(this.tmpLocalization);
		this.asc_setViewMode(this.isViewMode);

        if (this.openFileCryptBinary)
        {
            this.openFileCryptCallback(this.openFileCryptBinary);
        }
	};

	spreadsheet_api.prototype.asc_OnShowContextMenu = function() {
	  this.asc_closeCellEditor();
    };

	spreadsheet_api.prototype._changePivotStyle = function (pivot, callback) {
		var t = this;
		var changePivotStyle = function (res) {
		  var ws, wsModel, pivotRange, pos, i;
			if (res) {
				wsModel = t.wbModel.getActiveWs();
				pivotRange = pivot.getRange().clone();
				for (i = 0; i < pivot.pageFieldsPositions.length; ++i) {
					pos = pivot.pageFieldsPositions[i];
					pivotRange.union3(pos.col + 1, pos.row);
				}
				History.Create_NewPoint();
				History.StartTransaction();
				callback(wsModel);
				History.EndTransaction();
				pivotRange.union2(pivot.getRange());
				// ToDo update ranges, not big range
				for (i = 0; i < pivot.pageFieldsPositions.length; ++i) {
					pos = pivot.pageFieldsPositions[i];
					pivotRange.union3(pos.col + 1, pos.row);
				}
				wsModel.updatePivotTablesStyle(pivotRange);
				ws = t.wb.getWorksheet();
				ws._onUpdateFormatTable(pivotRange);
				t.wb._onWSSelectionChanged();
				ws.draw();
			}
		};
		this._isLockedPivot(pivot.asc_getName(), changePivotStyle);
	};

	spreadsheet_api.prototype._selectSearchingResults = function () {
	  var ws = this.wbModel.getActiveWs();
	  if (ws && ws.lastFindOptions) {
	    this.wb.drawWS();
      }
	};
	spreadsheet_api.prototype.asc_getAppProps = function()
	{
		return this.wbModel && this.wbModel.App || null;
	};

    spreadsheet_api.prototype.asc_setCoreProps = function(oProps)
    {
      var oCore = this.getInternalCoreProps();
      if(!oCore) {
        return;
      }
      var oWS = this.wb && this.wb.getWorksheet();
      if(!oWS || !oWS.objectRender) {
        History.Create_NewPoint();
        oCore.setProps(oProps);
      }
      var oLocker = oWS.objectRender.objectLocker;
      oLocker.reset();
      oLocker.addObjectId(oCore.Get_Id());
      oLocker.checkObjects(
          function(bNoLock, bSync){
              if(bNoLock) {
                History.Create_NewPoint();
                oCore.setProps(oProps);
              }
          }
      );
      return null;
    };

	spreadsheet_api.prototype.getInternalCoreProps = function()
	{
      return this.wbModel && this.wbModel.Core;
	};

	spreadsheet_api.prototype.asc_setGroupSummary = function (val, bCol) {
		var ws = this.wb && this.wb.getWorksheet();
		if(ws) {
			ws.asc_setGroupSummary(val, bCol);
		}
	};

	spreadsheet_api.prototype.asc_getGroupSummaryRight = function () {
		var ws = this.wbModel.getActiveWs();
		return ws && ws.sheetPr ? ws.sheetPr.SummaryRight : true;
	};

	spreadsheet_api.prototype.asc_getGroupSummaryBelow = function () {
		var ws = this.wbModel.getActiveWs();
		return ws && ws.sheetPr ? ws.sheetPr.SummaryBelow : true;
	};

	spreadsheet_api.prototype.asc_getSortProps = function (bExpand) {
		var ws = this.wb && this.wb.getWorksheet();
		if(ws) {
			return ws.getSortProps(bExpand);
		}
	};

	spreadsheet_api.prototype.asc_setSortProps = function (props, bCancel) {
		var ws = this.wb && this.wb.getWorksheet();
		if(ws) {
		  if(bCancel) {
		    ws.setSortProps(props, null, true);
          }	else {
		    ws.setSelectionInfo("customSort", props);
          }
		}
	};


  /*
   * Export
   * -----------------------------------------------------------------------------
   */

  asc["spreadsheet_api"] = spreadsheet_api;
  prot = spreadsheet_api.prototype;

  prot["asc_GetFontThumbnailsPath"] = prot.asc_GetFontThumbnailsPath;
  prot["asc_setDocInfo"] = prot.asc_setDocInfo;
  prot['asc_getFunctionArgumentSeparator'] = prot.asc_getFunctionArgumentSeparator;
  prot['asc_getCurrencySymbols'] = prot.asc_getCurrencySymbols;
  prot['asc_getLocaleExample'] = prot.asc_getLocaleExample;
  prot['asc_getFormatCells'] = prot.asc_getFormatCells;
  prot["asc_getLocaleCurrency"] = prot.asc_getLocaleCurrency;
  prot["asc_setLocale"] = prot.asc_setLocale;
  prot["asc_getLocale"] = prot.asc_getLocale;
  prot["asc_getDecimalSeparator"] = prot.asc_getDecimalSeparator;
  prot["asc_getGroupSeparator"] = prot.asc_getGroupSeparator;
  prot["asc_getEditorPermissions"] = prot.asc_getEditorPermissions;
  prot["asc_LoadDocument"] = prot.asc_LoadDocument;
  prot["asc_DownloadAs"] = prot.asc_DownloadAs;
  prot["asc_Save"] = prot.asc_Save;
  prot["forceSave"] = prot.forceSave;
  prot["asc_setIsForceSaveOnUserSave"] = prot.asc_setIsForceSaveOnUserSave;
  prot["asc_Resize"] = prot.asc_Resize;
  prot["asc_Copy"] = prot.asc_Copy;
  prot["asc_Paste"] = prot.asc_Paste;
  prot["asc_SpecialPaste"] = prot.asc_SpecialPaste;
  prot["asc_Cut"] = prot.asc_Cut;
  prot["asc_Undo"] = prot.asc_Undo;
  prot["asc_Redo"] = prot.asc_Redo;
  prot["asc_TextImport"] = prot.asc_TextImport;
  prot["asc_TextToColumns"] = prot.asc_TextToColumns;


  prot["asc_getDocumentName"] = prot.asc_getDocumentName;
  prot["asc_getAppProps"] = prot.asc_getAppProps;
  prot["asc_getCoreProps"] = prot.asc_getCoreProps;
  prot["asc_setCoreProps"] = prot.asc_setCoreProps;
  prot["asc_isDocumentModified"] = prot.asc_isDocumentModified;
  prot["asc_isDocumentCanSave"] = prot.asc_isDocumentCanSave;
  prot["asc_getCanUndo"] = prot.asc_getCanUndo;
  prot["asc_getCanRedo"] = prot.asc_getCanRedo;

  prot["asc_setAutoSaveGap"] = prot.asc_setAutoSaveGap;

  prot["asc_setViewMode"] = prot.asc_setViewMode;
  prot["asc_setFilteringMode"] = prot.asc_setFilteringMode;
  prot["asc_setRestriction"] = prot.asc_setRestriction;
  prot["asc_setAdvancedOptions"] = prot.asc_setAdvancedOptions;
  prot["asc_setPageOptions"] = prot.asc_setPageOptions;
  prot["asc_savePagePrintOptions"] = prot.asc_savePagePrintOptions;
  prot["asc_getPageOptions"] = prot.asc_getPageOptions;
  prot["asc_changeDocSize"] = prot.asc_changeDocSize;
  prot["asc_changePageMargins"] = prot.asc_changePageMargins;
  prot["asc_setPageOption"] = prot.asc_setPageOption;
  prot["asc_changePageOrient"] = prot.asc_changePageOrient;

  prot["asc_ChangePrintArea"] = prot.asc_ChangePrintArea;
  prot["asc_CanAddPrintArea"] = prot.asc_CanAddPrintArea;
  prot["asc_SetPrintScale"] = prot.asc_SetPrintScale;


  prot["asc_decodeBuffer"] = prot.asc_decodeBuffer;

  prot["asc_registerCallback"] = prot.asc_registerCallback;
  prot["asc_unregisterCallback"] = prot.asc_unregisterCallback;

  prot["asc_changeArtImageFromFile"] = prot.asc_changeArtImageFromFile;

  prot["asc_SetDocumentPlaceChangedEnabled"] = prot.asc_SetDocumentPlaceChangedEnabled;
  prot["asc_SetFastCollaborative"] = prot.asc_SetFastCollaborative;
	prot["asc_setThumbnailStylesSizes"] = prot.asc_setThumbnailStylesSizes;

  // Workbook interface

  prot["asc_getWorksheetsCount"] = prot.asc_getWorksheetsCount;
  prot["asc_getWorksheetName"] = prot.asc_getWorksheetName;
  prot["asc_getWorksheetTabColor"] = prot.asc_getWorksheetTabColor;
  prot["asc_setWorksheetTabColor"] = prot.asc_setWorksheetTabColor;
  prot["asc_getActiveWorksheetIndex"] = prot.asc_getActiveWorksheetIndex;
  prot["asc_getActiveWorksheetId"] = prot.asc_getActiveWorksheetId;
  prot["asc_getWorksheetId"] = prot.asc_getWorksheetId;
  prot["asc_isWorksheetHidden"] = prot.asc_isWorksheetHidden;
  prot["asc_isWorksheetLockedOrDeleted"] = prot.asc_isWorksheetLockedOrDeleted;
  prot["asc_isWorkbookLocked"] = prot.asc_isWorkbookLocked;
  prot["asc_isLayoutLocked"] = prot.asc_isLayoutLocked;
  prot["asc_isPrintAreaLocked"] = prot.asc_isPrintAreaLocked;
  prot["asc_isHeaderFooterLocked"] = prot.asc_isHeaderFooterLocked;
  prot["asc_getHiddenWorksheets"] = prot.asc_getHiddenWorksheets;
  prot["asc_showWorksheet"] = prot.asc_showWorksheet;
  prot["asc_hideWorksheet"] = prot.asc_hideWorksheet;
  prot["asc_renameWorksheet"] = prot.asc_renameWorksheet;
  prot["asc_addWorksheet"] = prot.asc_addWorksheet;
  prot["asc_insertWorksheet"] = prot.asc_insertWorksheet;
  prot["asc_deleteWorksheet"] = prot.asc_deleteWorksheet;
  prot["asc_moveWorksheet"] = prot.asc_moveWorksheet;
  prot["asc_copyWorksheet"] = prot.asc_copyWorksheet;
  prot["asc_cleanSelection"] = prot.asc_cleanSelection;
  prot["asc_getZoom"] = prot.asc_getZoom;
  prot["asc_setZoom"] = prot.asc_setZoom;
  prot["asc_enableKeyEvents"] = prot.asc_enableKeyEvents;
  prot["asc_searchEnabled"] = prot.asc_searchEnabled;
  prot["asc_findText"] = prot.asc_findText;
  prot["asc_replaceText"] = prot.asc_replaceText;
  prot["asc_endFindText"] = prot.asc_endFindText;
  prot["asc_findCell"] = prot.asc_findCell;
  prot["asc_closeCellEditor"] = prot.asc_closeCellEditor;

  prot["asc_setR1C1Mode"] = prot.asc_setR1C1Mode;

  // Spreadsheet interface

  prot["asc_getColumnWidth"] = prot.asc_getColumnWidth;
  prot["asc_setColumnWidth"] = prot.asc_setColumnWidth;
  prot["asc_showColumns"] = prot.asc_showColumns;
  prot["asc_hideColumns"] = prot.asc_hideColumns;
  prot["asc_autoFitColumnWidth"] = prot.asc_autoFitColumnWidth;
  prot["asc_getRowHeight"] = prot.asc_getRowHeight;
  prot["asc_setRowHeight"] = prot.asc_setRowHeight;
  prot["asc_autoFitRowHeight"] = prot.asc_autoFitRowHeight;
  prot["asc_showRows"] = prot.asc_showRows;
  prot["asc_hideRows"] = prot.asc_hideRows;
  prot["asc_insertCells"] = prot.asc_insertCells;
  prot["asc_deleteCells"] = prot.asc_deleteCells;
  prot["asc_mergeCells"] = prot.asc_mergeCells;
  prot["asc_sortCells"] = prot.asc_sortCells;
  prot["asc_emptyCells"] = prot.asc_emptyCells;
  prot["asc_mergeCellsDataLost"] = prot.asc_mergeCellsDataLost;
  prot["asc_sortCellsRangeExpand"] = prot.asc_sortCellsRangeExpand;
  prot["asc_getSheetViewSettings"] = prot.asc_getSheetViewSettings;
  prot["asc_setDisplayGridlines"] = prot.asc_setDisplayGridlines;
  prot["asc_setDisplayHeadings"] = prot.asc_setDisplayHeadings;

  // Defined Names
  prot["asc_getDefinedNames"] = prot.asc_getDefinedNames;
  prot["asc_setDefinedNames"] = prot.asc_setDefinedNames;
  prot["asc_editDefinedNames"] = prot.asc_editDefinedNames;
  prot["asc_delDefinedNames"] = prot.asc_delDefinedNames;
  prot["asc_getDefaultDefinedName"] = prot.asc_getDefaultDefinedName;
  prot["asc_checkDefinedName"] = prot.asc_checkDefinedName;

  // Auto filters interface + format as table
  prot["asc_addAutoFilter"] = prot.asc_addAutoFilter;
  prot["asc_changeAutoFilter"] = prot.asc_changeAutoFilter;
  prot["asc_applyAutoFilter"] = prot.asc_applyAutoFilter;
  prot["asc_applyAutoFilterByType"] = prot.asc_applyAutoFilterByType;
  prot["asc_reapplyAutoFilter"] = prot.asc_reapplyAutoFilter;
  prot["asc_sortColFilter"] = prot.asc_sortColFilter;
  prot["asc_getAddFormatTableOptions"] = prot.asc_getAddFormatTableOptions;
  prot["asc_clearFilter"] = prot.asc_clearFilter;
  prot["asc_clearFilterColumn"] = prot.asc_clearFilterColumn;
  prot["asc_changeSelectionFormatTable"] = prot.asc_changeSelectionFormatTable;
  prot["asc_changeFormatTableInfo"] = prot.asc_changeFormatTableInfo;
  prot["asc_insertCellsInTable"] = prot.asc_insertCellsInTable;
  prot["asc_deleteCellsInTable"] = prot.asc_deleteCellsInTable;
  prot["asc_changeDisplayNameTable"] = prot.asc_changeDisplayNameTable;
  prot["asc_changeTableRange"] = prot.asc_changeTableRange;
  prot["asc_convertTableToRange"] = prot.asc_convertTableToRange;
  prot["asc_getTablePictures"] = prot.asc_getTablePictures;
  prot["asc_getDefaultTableStyle"] = prot.asc_getDefaultTableStyle;


  prot["asc_applyAutoCorrectOptions"] = prot.asc_applyAutoCorrectOptions;

  //Group data
  prot["asc_group"] = prot.asc_group;
  prot["asc_ungroup"] = prot.asc_ungroup;
  prot["asc_clearOutline"] = prot.asc_clearOutline;
  prot["asc_changeGroupDetails"] = prot.asc_changeGroupDetails;
  prot["asc_checkAddGroup"] = prot.asc_checkAddGroup;
  prot["asc_setGroupSummary"] = prot.asc_setGroupSummary;
  prot["asc_getGroupSummaryRight"] = prot.asc_getGroupSummaryRight;
  prot["asc_getGroupSummaryBelow"] = prot.asc_getGroupSummaryBelow;

  
  // Drawing objects interface

  prot["asc_showDrawingObjects"] = prot.asc_showDrawingObjects;
  prot["asc_drawingObjectsExist"] = prot.asc_drawingObjectsExist;
  prot["asc_getChartObject"] = prot.asc_getChartObject;
  prot["asc_addChartDrawingObject"] = prot.asc_addChartDrawingObject;
  prot["asc_editChartDrawingObject"] = prot.asc_editChartDrawingObject;
  prot["asc_addImageDrawingObject"] = prot.asc_addImageDrawingObject;
  prot["asc_setSelectedDrawingObjectLayer"] = prot.asc_setSelectedDrawingObjectLayer;
  prot["asc_setSelectedDrawingObjectAlign"] = prot.asc_setSelectedDrawingObjectAlign;
  prot["asc_DistributeSelectedDrawingObjectHor"] = prot.asc_DistributeSelectedDrawingObjectHor;
  prot["asc_DistributeSelectedDrawingObjectVer"] = prot.asc_DistributeSelectedDrawingObjectVer;
  prot["asc_getSelectedDrawingObjectsCount"] = prot.asc_getSelectedDrawingObjectsCount;
  prot["asc_getChartPreviews"] = prot.asc_getChartPreviews;
  prot["asc_getTextArtPreviews"] = prot.asc_getTextArtPreviews;
  prot['asc_getPropertyEditorShapes'] = prot.asc_getPropertyEditorShapes;
  prot['asc_getPropertyEditorTextArts'] = prot.asc_getPropertyEditorTextArts;
  prot["asc_checkDataRange"] = prot.asc_checkDataRange;
  prot["asc_getBinaryFileWriter"] = prot.asc_getBinaryFileWriter;
  prot["asc_getWordChartObject"] = prot.asc_getWordChartObject;
  prot["asc_cleanWorksheet"] = prot.asc_cleanWorksheet;
  prot["asc_showImageFileDialog"] = prot.asc_showImageFileDialog;
  prot["asc_addImage"] = prot.asc_addImage;
  prot["asc_setData"] = prot.asc_setData;
  prot["asc_getData"] = prot.asc_getData;
  prot["asc_onCloseChartFrame"] = prot.asc_onCloseChartFrame;

  // Cell comment interface
  prot["asc_addComment"] = prot.asc_addComment;
  prot["asc_changeComment"] = prot.asc_changeComment;
  prot["asc_findComment"] = prot.asc_findComment;
  prot["asc_removeComment"] = prot.asc_removeComment;
  prot["asc_RemoveAllComments"] = prot.asc_RemoveAllComments;
  prot["asc_showComment"] = prot.asc_showComment;
  prot["asc_selectComment"] = prot.asc_selectComment;

  prot["asc_showComments"] = prot.asc_showComments;
  prot["asc_hideComments"] = prot.asc_hideComments;

  // Shapes
  prot["setStartPointHistory"] = prot.setStartPointHistory;
  prot["setEndPointHistory"] = prot.setEndPointHistory;
  prot["asc_startAddShape"] = prot.asc_startAddShape;
  prot["asc_endAddShape"] = prot.asc_endAddShape;
  prot["asc_addShapeOnSheet"] = prot.asc_addShapeOnSheet;
  prot["asc_isAddAutoshape"] = prot.asc_isAddAutoshape;
  prot["asc_canAddShapeHyperlink"] = prot.asc_canAddShapeHyperlink;
  prot["asc_canGroupGraphicsObjects"] = prot.asc_canGroupGraphicsObjects;
  prot["asc_groupGraphicsObjects"] = prot.asc_groupGraphicsObjects;
  prot["asc_canUnGroupGraphicsObjects"] = prot.asc_canUnGroupGraphicsObjects;
  prot["asc_unGroupGraphicsObjects"] = prot.asc_unGroupGraphicsObjects;
  prot["asc_getGraphicObjectProps"] = prot.asc_getGraphicObjectProps;
  prot["asc_setGraphicObjectProps"] = prot.asc_setGraphicObjectProps;
  prot["asc_getOriginalImageSize"] = prot.asc_getOriginalImageSize;
  prot["asc_changeShapeType"] = prot.asc_changeShapeType;
  prot["asc_setInterfaceDrawImagePlaceShape"] = prot.asc_setInterfaceDrawImagePlaceShape;
  prot["asc_setInterfaceDrawImagePlaceTextArt"] = prot.asc_setInterfaceDrawImagePlaceTextArt;
  prot["asc_changeImageFromFile"] = prot.asc_changeImageFromFile;
  prot["asc_putPrLineSpacing"] = prot.asc_putPrLineSpacing;
  prot["asc_addTextArt"] = prot.asc_addTextArt;
  prot["asc_canEditCrop"] = prot.asc_canEditCrop;
  prot["asc_startEditCrop"] = prot.asc_startEditCrop;
  prot["asc_endEditCrop"] = prot.asc_endEditCrop;
  prot["asc_cropFit"] = prot.asc_cropFit;
  prot["asc_cropFill"] = prot.asc_cropFill;
  prot["asc_putLineSpacingBeforeAfter"] = prot.asc_putLineSpacingBeforeAfter;
  prot["asc_setDrawImagePlaceParagraph"] = prot.asc_setDrawImagePlaceParagraph;
  prot["asc_changeShapeImageFromFile"] = prot.asc_changeShapeImageFromFile;
  prot["asc_AddMath"] = prot.asc_AddMath;
  prot["asc_SetMathProps"] = prot.asc_SetMathProps;
  //----------------------------------------------------------------------------------------------------------------------

  // Spellcheck
  prot["asc_setDefaultLanguage"] = prot.asc_setDefaultLanguage;
  prot["asc_nextWord"] = prot.asc_nextWord;
  prot["asc_replaceMisspelledWord"]= prot.asc_replaceMisspelledWord;
  prot["asc_ignoreMisspelledWord"] = prot.asc_ignoreMisspelledWord;
  prot["asc_spellCheckAddToDictionary"] = prot.asc_spellCheckAddToDictionary;
  prot["asc_spellCheckClearDictionary"] = prot.asc_spellCheckClearDictionary;
  prot["asc_cancelSpellCheck"] = prot.asc_cancelSpellCheck;
  prot["asc_ignoreNumbers"] = prot.asc_ignoreNumbers;
  prot["asc_ignoreUppercase"] = prot.asc_ignoreUppercase;

  // Frozen pane
  prot["asc_freezePane"] = prot.asc_freezePane;

  // Sparklines
  prot["asc_setSparklineGroup"] = prot.asc_setSparklineGroup;

  // Cell interface
  prot["asc_getCellInfo"] = prot.asc_getCellInfo;
  prot["asc_getActiveCellCoord"] = prot.asc_getActiveCellCoord;
  prot["asc_getAnchorPosition"] = prot.asc_getAnchorPosition;
  prot["asc_setCellFontName"] = prot.asc_setCellFontName;
  prot["asc_setCellFontSize"] = prot.asc_setCellFontSize;
  prot["asc_setCellBold"] = prot.asc_setCellBold;
  prot["asc_setCellItalic"] = prot.asc_setCellItalic;
  prot["asc_setCellUnderline"] = prot.asc_setCellUnderline;
  prot["asc_setCellStrikeout"] = prot.asc_setCellStrikeout;
  prot["asc_setCellSubscript"] = prot.asc_setCellSubscript;
  prot["asc_setCellSuperscript"] = prot.asc_setCellSuperscript;
  prot["asc_setCellAlign"] = prot.asc_setCellAlign;
  prot["asc_setCellVertAlign"] = prot.asc_setCellVertAlign;
  prot["asc_setCellTextWrap"] = prot.asc_setCellTextWrap;
  prot["asc_setCellTextShrink"] = prot.asc_setCellTextShrink;
  prot["asc_setCellTextColor"] = prot.asc_setCellTextColor;
  prot["asc_setCellFill"] = prot.asc_setCellFill;
  prot["asc_setCellBackgroundColor"] = prot.asc_setCellBackgroundColor;
  prot["asc_setCellBorders"] = prot.asc_setCellBorders;
  prot["asc_setCellFormat"] = prot.asc_setCellFormat;
  prot["asc_setCellAngle"] = prot.asc_setCellAngle;
  prot["asc_setCellStyle"] = prot.asc_setCellStyle;
  prot["asc_increaseCellDigitNumbers"] = prot.asc_increaseCellDigitNumbers;
  prot["asc_decreaseCellDigitNumbers"] = prot.asc_decreaseCellDigitNumbers;
  prot["asc_increaseFontSize"] = prot.asc_increaseFontSize;
  prot["asc_decreaseFontSize"] = prot.asc_decreaseFontSize;
  prot["asc_formatPainter"] = prot.asc_formatPainter;
  prot["asc_showAutoComplete"] = prot.asc_showAutoComplete;
  prot["asc_getHeaderFooterMode"] = prot.asc_getHeaderFooterMode;

  prot["asc_onMouseUp"] = prot.asc_onMouseUp;

  prot["asc_selectFunction"] = prot.asc_selectFunction;
  prot["asc_insertHyperlink"] = prot.asc_insertHyperlink;
  prot["asc_removeHyperlink"] = prot.asc_removeHyperlink;
  prot["asc_insertFormula"] = prot.asc_insertFormula;
  prot["asc_getFormulasInfo"] = prot.asc_getFormulasInfo;
  prot["asc_getFormulaLocaleName"] = prot.asc_getFormulaLocaleName;
  prot["asc_getFormulaNameByLocale"] = prot.asc_getFormulaNameByLocale;
  prot["asc_calculate"] = prot.asc_calculate;
  prot["asc_setFontRenderingMode"] = prot.asc_setFontRenderingMode;
  prot["asc_setSelectionDialogMode"] = prot.asc_setSelectionDialogMode;
  prot["asc_ChangeColorScheme"] = prot.asc_ChangeColorScheme;
  prot["asc_ChangeColorSchemeByIdx"] = prot.asc_ChangeColorSchemeByIdx;
  prot["asc_setListType"] = prot.asc_setListType;
  prot["asc_getCurrentListType"] = prot.asc_getCurrentListType;
  /////////////////////////////////////////////////////////////////////////
  ///////////////////CoAuthoring and Chat api//////////////////////////////
  /////////////////////////////////////////////////////////////////////////
  prot["asc_coAuthoringChatSendMessage"] = prot.asc_coAuthoringChatSendMessage;
  prot["asc_coAuthoringGetUsers"] = prot.asc_coAuthoringGetUsers;
  prot["asc_coAuthoringChatGetMessages"] = prot.asc_coAuthoringChatGetMessages;
  prot["asc_coAuthoringDisconnect"] = prot.asc_coAuthoringDisconnect;

  // other
  prot["asc_stopSaving"] = prot.asc_stopSaving;
  prot["asc_continueSaving"] = prot.asc_continueSaving;

  prot['sendEvent'] = prot.sendEvent;

  // Version History
  prot["asc_undoAllChanges"] = prot.asc_undoAllChanges;

  prot["asc_setLocalization"] = prot.asc_setLocalization;

  // native
  prot["asc_nativeOpenFile"] = prot.asc_nativeOpenFile;
  prot["asc_nativeCalculateFile"] = prot.asc_nativeCalculateFile;
  prot["asc_nativeApplyChanges"] = prot.asc_nativeApplyChanges;
  prot["asc_nativeApplyChanges2"] = prot.asc_nativeApplyChanges2;
  prot["asc_nativeGetFile"] = prot.asc_nativeGetFile;
  prot["asc_nativeGetFileData"] = prot.asc_nativeGetFileData;
  prot["asc_nativeCalculate"] = prot.asc_nativeCalculate;
  prot["asc_nativePrint"] = prot.asc_nativePrint;
  prot["asc_nativePrintPagesCount"] = prot.asc_nativePrintPagesCount;
  prot["asc_nativeGetPDF"] = prot.asc_nativeGetPDF;
  
  prot['asc_isOffline'] = prot.asc_isOffline;
  prot['asc_getUrlType'] = prot.asc_getUrlType;

  prot['asc_getSessionToken'] = prot.asc_getSessionToken;
  // Builder
  prot['asc_nativeInitBuilder'] = prot.asc_nativeInitBuilder;
  prot['asc_SetSilentMode'] = prot.asc_SetSilentMode;

  // plugins
  prot["asc_pluginsRegister"]       = prot.asc_pluginsRegister;
  prot["asc_pluginRun"]             = prot.asc_pluginRun;
  prot["asc_pluginResize"]          = prot.asc_pluginResize;
  prot["asc_pluginButtonClick"]     = prot.asc_pluginButtonClick;
  prot["asc_startEditCurrentOleObject"]         = prot.asc_startEditCurrentOleObject;
  prot["asc_pluginEnableMouseEvents"] = prot.asc_pluginEnableMouseEvents;

  // system input
  prot["SetTextBoxInputMode"]       = prot.SetTextBoxInputMode;
  prot["GetTextBoxInputMode"]       = prot.GetTextBoxInputMode;

  prot["asc_InputClearKeyboardElement"] = prot.asc_InputClearKeyboardElement;

  prot["asc_OnHideContextMenu"] = prot.asc_OnHideContextMenu;
  prot["asc_OnShowContextMenu"] = prot.asc_OnShowContextMenu;

	// signatures
  prot["asc_addSignatureLine"] 		     = prot.asc_addSignatureLine;
  prot["asc_CallSignatureDblClickEvent"] = prot.asc_CallSignatureDblClickEvent;
  prot["asc_getRequestSignatures"] 	     = prot.asc_getRequestSignatures;
  prot["asc_AddSignatureLine2"]          = prot.asc_AddSignatureLine2;
  prot["asc_Sign"]             		     = prot.asc_Sign;
  prot["asc_RequestSign"]             	 = prot.asc_RequestSign;
  prot["asc_ViewCertificate"] 		     = prot.asc_ViewCertificate;
  prot["asc_SelectCertificate"] 	     = prot.asc_SelectCertificate;
  prot["asc_GetDefaultCertificate"]      = prot.asc_GetDefaultCertificate;
  prot["asc_getSignatures"] 		     = prot.asc_getSignatures;
  prot["asc_isSignaturesSupport"] 	     = prot.asc_isSignaturesSupport;
  prot["asc_isProtectionSupport"] 		 = prot.asc_isProtectionSupport;
  prot["asc_RemoveSignature"] 		= prot.asc_RemoveSignature;
  prot["asc_RemoveAllSignatures"] 	= prot.asc_RemoveAllSignatures;
  prot["asc_gotoSignature"] 	    = prot.asc_gotoSignature;
  prot["asc_getSignatureSetup"] 	= prot.asc_getSignatureSetup;

  // password
  prot["asc_setCurrentPassword"]    = prot.asc_setCurrentPassword;
  prot["asc_resetPassword"] 		= prot.asc_resetPassword;

  // mobile
  prot["asc_Remove"] = prot.asc_Remove;

  prot["asc_getSortProps"] = prot.asc_getSortProps;
  prot["asc_setSortProps"] = prot.asc_setSortProps;

})(window);
