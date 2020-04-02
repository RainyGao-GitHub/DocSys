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
// Import

	var CreateNoFillLine = AscFormat.CreateNoFillLine;
	var CreateNoFillUniFill = AscFormat.CreateNoFillUniFill;
	
var c_oAscChartTypeSettings = Asc.c_oAscChartTypeSettings;
var c_oAscTickMark = Asc.c_oAscTickMark;
var c_oAscTickLabelsPos = Asc.c_oAscTickLabelsPos;
var fChartSize = 75;

function ChartPreviewManager() {
	this.previewGroups = [];
	this.chartsByTypes = [];

	this.CHART_PREVIEW_WIDTH_PIX = 50;
	this.CHART_PREVIEW_HEIGHT_PIX = 50;

	this._canvas_charts = null;
}

ChartPreviewManager.prototype.getAscChartSeriesDefault = function(type) {
	function createItem(value) {
		return { numFormatStr: "General", isDateTimeFormat: false, val: value, isHidden: false };
	}

	// Set data
	var series = [], ser;
	switch(type)
	{
		case c_oAscChartTypeSettings.lineNormal:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(2), createItem(3), createItem(2), createItem(3) ];
			series.push(ser);
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(1), createItem(2), createItem(3), createItem(2) ];
			series.push(ser);
			break;
		}
        case c_oAscChartTypeSettings.line3d:
        {
            ser = new AscFormat.asc_CChartSeria();
            ser.Val.NumCache = [ createItem(1), createItem(2), createItem(1), createItem(2) ];
            series.push(ser);
            ser = new AscFormat.asc_CChartSeria();
            ser.Val.NumCache = [ createItem(3), createItem(2.5), createItem(3), createItem(3.5) ];
            series.push(ser);
            break;
        }
		case c_oAscChartTypeSettings.lineStacked:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(1), createItem(6), createItem(2), createItem(8) ];
			series.push(ser);
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(4), createItem(4), createItem(4), createItem(5) ];
			series.push(ser);
			break;
		}
		case c_oAscChartTypeSettings.lineStackedPer:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(2), createItem(4), createItem(2), createItem(4) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(2), createItem(2), createItem(2), createItem(2) ];
			series.push(ser);
			break;
		}

		case c_oAscChartTypeSettings.hBarNormal:
		case c_oAscChartTypeSettings.hBarNormal3d:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(4) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(3) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(2) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(1) ];
			series.push(ser);
			break;
		}

		case c_oAscChartTypeSettings.hBarStacked:
		case c_oAscChartTypeSettings.hBarStacked3d:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(4), createItem(3), createItem(2), createItem(1) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(5), createItem(4), createItem(3), createItem(2) ];
			series.push(ser);
			break;
		}

		case c_oAscChartTypeSettings.hBarStackedPer:
		case c_oAscChartTypeSettings.hBarStackedPer3d:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(7), createItem(5), createItem(3), createItem(1) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(7), createItem(6), createItem(5), createItem(4) ];
			series.push(ser);
			break;
		}

		case c_oAscChartTypeSettings.barNormal:
		case c_oAscChartTypeSettings.barNormal3d:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(1) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(2) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(3) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(4) ];
			series.push(ser);
			break;
		}

		case c_oAscChartTypeSettings.barStacked:
		case c_oAscChartTypeSettings.barStacked3d:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(1), createItem(2), createItem(3), createItem(4) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(2), createItem(3), createItem(4), createItem(5) ];
			series.push(ser);
			break;
		}

		case c_oAscChartTypeSettings.barStackedPer:
		case c_oAscChartTypeSettings.barStackedPer3d:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(1), createItem(3), createItem(5), createItem(7) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(4), createItem(5), createItem(6), createItem(7) ];
			series.push(ser);
			break;
		}
        case c_oAscChartTypeSettings.barNormal3dPerspective:
        {
            ser = new AscFormat.asc_CChartSeria();
            ser.Val.NumCache = [ createItem(1), createItem(2), createItem(3), createItem(4) ];
            series.push(ser);

            ser = new AscFormat.asc_CChartSeria();
            ser.Val.NumCache = [ createItem(2), createItem(3), createItem(4), createItem(5) ];
            series.push(ser);
            break;
        }
		case c_oAscChartTypeSettings.pie:
		case c_oAscChartTypeSettings.doughnut:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(3), createItem(1) ];
			series.push(ser);
			break;
		}

		case c_oAscChartTypeSettings.areaNormal:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(0), createItem(8), createItem(5), createItem(6) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(0), createItem(4), createItem(2), createItem(9) ];
			series.push(ser);
			break;
		}

		case c_oAscChartTypeSettings.areaStacked:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(0), createItem(8), createItem(5), createItem(11) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(4), createItem(4), createItem(4), createItem(4) ];
			series.push(ser);
			break;
		}

		case c_oAscChartTypeSettings.areaStackedPer:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(0), createItem(4), createItem(1), createItem(16) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(4), createItem(4), createItem(4), createItem(4) ];
			series.push(ser);
			break;
		}

		case c_oAscChartTypeSettings.scatter:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(1), createItem(5) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(2), createItem(6) ];
			series.push(ser);
			break;
		}

		default:
		{
			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(3), createItem(5), createItem(7) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(10), createItem(12), createItem(14) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(1), createItem(3), createItem(5) ];
			series.push(ser);

			ser = new AscFormat.asc_CChartSeria();
			ser.Val.NumCache = [ createItem(8), createItem(10), createItem(12) ];
			series.push(ser);
			break;
		}
	}
	return series;
};

ChartPreviewManager.prototype.getChartByType = function(type)
{
	return AscFormat.ExecuteNoHistory(function()
	{
		var settings = new Asc.asc_ChartSettings();
		settings.type = type;
		var chartSeries = {series: this.getAscChartSeriesDefault(type), parsedHeaders: {bLeft: true, bTop: true}};
		var chart_space = AscFormat.DrawingObjectsController.prototype._getChartSpace(chartSeries, settings, true);
        chart_space.bPreview = true;
		if (Asc['editor'] && AscCommon.c_oEditorId.Spreadsheet === Asc['editor'].getEditorId()) {
			var api_sheet = Asc['editor'];
			chart_space.setWorksheet(api_sheet.wb.getWorksheet().model);
		} else {
			if (editor && editor.WordControl && editor.WordControl.m_oLogicDocument.Slides &&
				editor.WordControl.m_oLogicDocument.Slides[editor.WordControl.m_oLogicDocument.CurPage]) {
				chart_space.setParent(editor.WordControl.m_oLogicDocument.Slides[editor.WordControl.m_oLogicDocument.CurPage]);
			}
		}
		AscFormat.CheckSpPrXfrm(chart_space);
		chart_space.spPr.xfrm.setOffX(0);
		chart_space.spPr.xfrm.setOffY(0);
		chart_space.spPr.xfrm.setExtX(fChartSize);
		chart_space.spPr.xfrm.setExtY(fChartSize);
		settings.putTitle(Asc.c_oAscChartTitleShowSettings.noOverlay);
		//settings.putHorAxisLabel(Asc.c_oAscChartTitleShowSettings.none);
		//settings.putVertAxisLabel(Asc.c_oAscChartTitleShowSettings.none);
		//settings.putLegendPos(Asc.c_oAscChartLegendShowSettings.none);
		//settings.putHorGridLines(Asc.c_oAscGridLinesSettings.none);
		//settings.putVertGridLines(Asc.c_oAscGridLinesSettings.none);


		var val_ax_props = new AscCommon.asc_ValAxisSettings();
		val_ax_props.putMinValRule(Asc.c_oAscValAxisRule.auto);
		val_ax_props.putMaxValRule(Asc.c_oAscValAxisRule.auto);
		val_ax_props.putTickLabelsPos(c_oAscTickLabelsPos.TICK_LABEL_POSITION_NEXT_TO);
		val_ax_props.putInvertValOrder(false);
		val_ax_props.putDispUnitsRule(Asc.c_oAscValAxUnits.none);
		val_ax_props.putMajorTickMark(c_oAscTickMark.TICK_MARK_NONE);
		val_ax_props.putMinorTickMark(c_oAscTickMark.TICK_MARK_NONE);
		val_ax_props.putCrossesRule(Asc.c_oAscCrossesRule.auto);


		var cat_ax_props = new AscCommon.asc_CatAxisSettings();
		cat_ax_props.putIntervalBetweenLabelsRule(Asc.c_oAscBetweenLabelsRule.auto);
		cat_ax_props.putLabelsPosition(Asc.c_oAscLabelsPosition.betweenDivisions);
		cat_ax_props.putTickLabelsPos(c_oAscTickLabelsPos.TICK_LABEL_POSITION_NEXT_TO);
		cat_ax_props.putLabelsAxisDistance(100);
		cat_ax_props.putMajorTickMark(c_oAscTickMark.TICK_MARK_NONE);
		cat_ax_props.putMinorTickMark(c_oAscTickMark.TICK_MARK_NONE);
		cat_ax_props.putIntervalBetweenTick(1);
		cat_ax_props.putCrossesRule(Asc.c_oAscCrossesRule.auto);
		var vert_axis_settings, hor_axis_settings, isScatter;
		switch(type)
		{
			case c_oAscChartTypeSettings.hBarNormal:
			case c_oAscChartTypeSettings.hBarStacked:
			case c_oAscChartTypeSettings.hBarStackedPer:
			{
				vert_axis_settings = cat_ax_props;
				hor_axis_settings = val_ax_props;
				break;
			}
			case c_oAscChartTypeSettings.scatter:
			case c_oAscChartTypeSettings.scatterLine:
			case c_oAscChartTypeSettings.scatterLineMarker:
			case c_oAscChartTypeSettings.scatterMarker:
			case c_oAscChartTypeSettings.scatterNone:
			case c_oAscChartTypeSettings.scatterSmooth:
			case c_oAscChartTypeSettings.scatterSmoothMarker:
			{
				vert_axis_settings = val_ax_props;
				hor_axis_settings = val_ax_props;
				isScatter = true;
                settings.showMarker = true;
                settings.smooth = false;
                settings.bLine = false;
				break;
			}
            case c_oAscChartTypeSettings.areaNormal:
            case c_oAscChartTypeSettings.areaStacked:
            case c_oAscChartTypeSettings.areaStackedPer:
            {
                cat_ax_props.putLabelsPosition(AscFormat.CROSS_BETWEEN_BETWEEN);
                vert_axis_settings = val_ax_props;
                hor_axis_settings = cat_ax_props;

                break;
            }

			default :
			{
				vert_axis_settings = val_ax_props;
				hor_axis_settings = cat_ax_props;
				break;
			}
		}

		settings.putVertAxisProps(vert_axis_settings);
		settings.putHorAxisProps(hor_axis_settings);

		AscFormat.DrawingObjectsController.prototype.applyPropsToChartSpace(settings, chart_space);
		chart_space.setBDeleted(false);
		chart_space.updateLinks();
		if(!(isScatter || type === c_oAscChartTypeSettings.stock))
		{
			if(chart_space.chart.plotArea.valAx)
				chart_space.chart.plotArea.valAx.setDelete(true);
			if(chart_space.chart.plotArea.catAx)
				chart_space.chart.plotArea.catAx.setDelete(true);
		}
		else
		{
			if(chart_space.chart.plotArea.valAx)
			{
				chart_space.chart.plotArea.valAx.setTickLblPos(c_oAscTickLabelsPos.TICK_LABEL_POSITION_NONE);
				chart_space.chart.plotArea.valAx.setMajorTickMark(c_oAscTickMark.TICK_MARK_NONE);
				chart_space.chart.plotArea.valAx.setMinorTickMark(c_oAscTickMark.TICK_MARK_NONE);
			}
			if(chart_space.chart.plotArea.catAx)
			{
				chart_space.chart.plotArea.catAx.setTickLblPos(c_oAscTickLabelsPos.TICK_LABEL_POSITION_NONE);
				chart_space.chart.plotArea.catAx.setMajorTickMark(c_oAscTickMark.TICK_MARK_NONE);
				chart_space.chart.plotArea.catAx.setMinorTickMark(c_oAscTickMark.TICK_MARK_NONE);
			}
		}
		if(!chart_space.spPr)
			chart_space.setSpPr(new AscFormat.CSpPr());

		var new_line = new AscFormat.CLn();
		new_line.setFill(new AscFormat.CUniFill());
		new_line.Fill.setFill(new AscFormat.CNoFill());
		chart_space.spPr.setLn(new_line);

        chart_space.recalcInfo.recalculateReferences = false;
		chart_space.recalculate();

		return chart_space;
	}, this, []);
};

ChartPreviewManager.prototype.clearPreviews = function()
{
	this.previewGroups.length = 0;
};
ChartPreviewManager.prototype.createChartPreview = function(graphics, type, preset) {
	if (!this.chartsByTypes[type]) {
		this.chartsByTypes[type] = this.getChartByType(type);
	}
	var chart_space = this.chartsByTypes[type];
	AscFormat.ApplyPresetToChartSpace(chart_space, preset);
	chart_space.recalcInfo.recalculateReferences = false;
	chart_space.recalculate();
	graphics.save();
	chart_space.draw(graphics);
	graphics.restore();
};

ChartPreviewManager.prototype._isCachedChartStyles = function(chartType) {
	var res = this.previewGroups.hasOwnProperty(chartType);
	if(!res) {
		this.previewGroups[chartType] = [];
	}
	return res;
};
ChartPreviewManager.prototype._getGraphics = function() {
	if (null === this._canvas_charts) {
		this._canvas_charts = document.createElement('canvas');
		this._canvas_charts.width = this.CHART_PREVIEW_WIDTH_PIX;
		this._canvas_charts.height = this.CHART_PREVIEW_HEIGHT_PIX;

		if (AscCommon.AscBrowser.isRetina) {
			this._canvas_charts.width = AscCommon.AscBrowser.convertToRetinaValue(this._canvas_charts.width, true);
			this._canvas_charts.height = AscCommon.AscBrowser.convertToRetinaValue(this._canvas_charts.height, true);
		}
	}

	var _canvas = this._canvas_charts;
	var ctx = _canvas.getContext('2d');
	var graphics = new AscCommon.CGraphics();
	graphics.init(ctx, _canvas.width, _canvas.height, fChartSize, fChartSize);
	graphics.m_oFontManager = AscCommon.g_fontManager;
	graphics.transform(1,0,0,1,0,0);
	return graphics;
};

ChartPreviewManager.prototype.getChartPreviews = function(chartType) {
	if (AscFormat.isRealNumber(chartType)) {
		if (!this._isCachedChartStyles(chartType)) {
			var presets = AscCommon.g_oChartPresets[chartType];
			if (presets) {
				AscFormat.ExecuteNoHistory(function () {
					var graphics = this._getGraphics();
					for (var i = 0; i < presets.length; ++i) {
						this.createChartPreview(graphics, chartType, presets[i]);
						if (!window["IS_NATIVE_EDITOR"]) {
							var chartStyle = new AscCommon.CStyleImage();
							chartStyle.name = i + 1;
							chartStyle.image = this._canvas_charts.toDataURL("image/png");
							this.previewGroups[chartType].push(chartStyle);
						}
					}
				}, this, []);

				var api = Asc['editor'];
				if (api && AscCommon.c_oEditorId.Spreadsheet === api.getEditorId()) {
					var _graphics = api.wb.shapeCtx;
					if (_graphics.ClearLastFont) {
						_graphics.ClearLastFont();
					}
				}
			}

		}
	}
	return this.previewGroups[chartType];
};

function CreateAscColorByIndex(nIndex)
{
	var oColor = new Asc.asc_CColor();
	oColor.type = Asc.c_oAscColor.COLOR_TYPE_SCHEME;
	oColor.value = nIndex;
	return oColor;
}

function CreateAscFillByIndex(nIndex)
{
	var oAscFill = new Asc.asc_CShapeFill();
	oAscFill.type = Asc.c_oAscFill.FILL_TYPE_SOLID;
	oAscFill.fill = new Asc.asc_CFillSolid();
	oAscFill.fill.color = CreateAscColorByIndex(nIndex);
	return oAscFill;
}

function CreateAscGradFillByIndex(nIndex1, nIndex2, nAngle)
{
	var oAscFill = new Asc.asc_CShapeFill();
	oAscFill.type = Asc.c_oAscFill.FILL_TYPE_GRAD;
	oAscFill.fill = new Asc.asc_CFillGrad();
	oAscFill.fill.GradType = Asc.c_oAscFillGradType.GRAD_LINEAR;
	oAscFill.fill.LinearAngle = nAngle;
	oAscFill.fill.LinearScale = true;
	oAscFill.fill.Colors = [CreateAscColorByIndex(nIndex1), CreateAscColorByIndex(nIndex2)];
	oAscFill.fill.Positions = [0, 100000];
	oAscFill.fill.LinearAngle = nAngle;
	oAscFill.fill.LinearScale = true;
	return oAscFill;
}
function TextArtPreviewManager()
{
	this.canvas = null;
	this.canvasWidth = 50;
	this.canvasHeight = 50;
	this.shapeWidth = 50;
	this.shapeHeight = 50;
	this.TAShape = null;
	this.TextArtStyles = [];

	this.aStylesByIndex = [];
	this.aStylesByIndexToApply = [];

	this.dKoeff = 4;
	//if (AscBrowser.isRetina) {
	//	this.dKoeff <<= 1;
	//}
}
TextArtPreviewManager.prototype.initStyles = function()
{

	var oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = AscFormat.CorrectUniFill(CreateAscFillByIndex(24), new AscFormat.CUniFill(), 0);
	oTextPr.TextOutline = CreateNoFillLine();
	this.aStylesByIndex[0] = oTextPr;
	this.aStylesByIndexToApply[0] = oTextPr;

	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = AscFormat.CorrectUniFill(CreateAscGradFillByIndex(52, 24, 5400000), new AscFormat.CUniFill(), 0);
	oTextPr.TextOutline = CreateNoFillLine();
	this.aStylesByIndex[4] = oTextPr;
	this.aStylesByIndexToApply[4] = oTextPr;

	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = AscFormat.CorrectUniFill(CreateAscGradFillByIndex(44, 42, 5400000), new AscFormat.CUniFill(), 0);
	oTextPr.TextOutline = CreateNoFillLine();
	this.aStylesByIndex[8] = oTextPr;
	this.aStylesByIndexToApply[8] = oTextPr;

	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = CreateNoFillUniFill();
	oTextPr.TextOutline = AscFormat.CreatePenFromParams(AscFormat.CorrectUniFill(CreateAscFillByIndex(34), new AscFormat.CUniFill(), 0), undefined, undefined, undefined, undefined, (15773/36000)*this.dKoeff);
	this.aStylesByIndex[1] = oTextPr;
	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = CreateNoFillUniFill();
	oTextPr.TextOutline = AscFormat.CreatePenFromParams(AscFormat.CorrectUniFill(CreateAscFillByIndex(34), new AscFormat.CUniFill(), 0), undefined, undefined, undefined, undefined, (15773/36000));
	this.aStylesByIndexToApply[1] = oTextPr;

	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = CreateNoFillUniFill();
	oTextPr.TextOutline = AscFormat.CreatePenFromParams(AscFormat.CorrectUniFill(CreateAscFillByIndex(59), new AscFormat.CUniFill(), 0), undefined, undefined, undefined, undefined, (15773/36000)*this.dKoeff);
	this.aStylesByIndex[5] = oTextPr;
	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = CreateNoFillUniFill();
	oTextPr.TextOutline = AscFormat.CreatePenFromParams(AscFormat.CorrectUniFill(CreateAscFillByIndex(59), new AscFormat.CUniFill(), 0), undefined, undefined, undefined, undefined, (15773/36000));
	this.aStylesByIndexToApply[5] = oTextPr;

	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = CreateNoFillUniFill();
	oTextPr.TextOutline = AscFormat.CreatePenFromParams(AscFormat.CorrectUniFill(CreateAscFillByIndex(52), new AscFormat.CUniFill(), 0), undefined, undefined, undefined, undefined, (15773/36000)*this.dKoeff);
	this.aStylesByIndex[9] = oTextPr;
	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = CreateNoFillUniFill();
	oTextPr.TextOutline = AscFormat.CreatePenFromParams(AscFormat.CorrectUniFill(CreateAscFillByIndex(52), new AscFormat.CUniFill(), 0), undefined, undefined, undefined, undefined, (15773/36000));
	this.aStylesByIndexToApply[9] = oTextPr;

	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = AscFormat.CorrectUniFill(CreateAscFillByIndex(27), new AscFormat.CUniFill(), 0);
	oTextPr.TextOutline = AscFormat.CreatePenFromParams(AscFormat.CorrectUniFill(CreateAscFillByIndex(52), new AscFormat.CUniFill(), 0), undefined, undefined, undefined, undefined, (12700/36000)*this.dKoeff);
	this.aStylesByIndex[2] = oTextPr;
	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = AscFormat.CorrectUniFill(CreateAscFillByIndex(27), new AscFormat.CUniFill(), 0);
	oTextPr.TextOutline = AscFormat.CreatePenFromParams(AscFormat.CorrectUniFill(CreateAscFillByIndex(52), new AscFormat.CUniFill(), 0), undefined, undefined, undefined, undefined, (12700/36000));
	this.aStylesByIndexToApply[2] = oTextPr;

	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = AscFormat.CorrectUniFill(CreateAscFillByIndex(42), new AscFormat.CUniFill(), 0);
	oTextPr.TextOutline = AscFormat.CreatePenFromParams(AscFormat.CorrectUniFill(CreateAscFillByIndex(46), new AscFormat.CUniFill(), 0), undefined, undefined, undefined, undefined, (12700/36000)*this.dKoeff);
	this.aStylesByIndex[6] = oTextPr;
	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = AscFormat.CorrectUniFill(CreateAscFillByIndex(42), new AscFormat.CUniFill(), 0);
	oTextPr.TextOutline = AscFormat.CreatePenFromParams(AscFormat.CorrectUniFill(CreateAscFillByIndex(46), new AscFormat.CUniFill(), 0), undefined, undefined, undefined, undefined, (12700/36000));
	this.aStylesByIndexToApply[6] = oTextPr;

	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = AscFormat.CorrectUniFill(CreateAscFillByIndex(57), new AscFormat.CUniFill(), 0);
	oTextPr.TextOutline = AscFormat.CreatePenFromParams(AscFormat.CorrectUniFill(CreateAscFillByIndex(54), new AscFormat.CUniFill(), 0), undefined, undefined, undefined, undefined, (12700/36000)*this.dKoeff);
	this.aStylesByIndex[10] = oTextPr;
	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = AscFormat.CorrectUniFill(CreateAscFillByIndex(57), new AscFormat.CUniFill(), 0);
	oTextPr.TextOutline = AscFormat.CreatePenFromParams(AscFormat.CorrectUniFill(CreateAscFillByIndex(54), new AscFormat.CUniFill(), 0), undefined, undefined, undefined, undefined, (12700/36000));
	this.aStylesByIndexToApply[10] = oTextPr;

	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = AscFormat.CorrectUniFill(CreateAscGradFillByIndex(45, 57, 0), new AscFormat.CUniFill(), 0);
	oTextPr.TextOutline = CreateNoFillLine();
	this.aStylesByIndex[3] = oTextPr;
	this.aStylesByIndexToApply[3] = oTextPr;

	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = AscFormat.CorrectUniFill(CreateAscGradFillByIndex(52, 33, 0), new AscFormat.CUniFill(), 0);
	oTextPr.TextOutline = CreateNoFillLine();
	this.aStylesByIndex[7] = oTextPr;
	this.aStylesByIndexToApply[7] = oTextPr;

	oTextPr = new CTextPr();
	oTextPr.Bold = true;
	oTextPr.TextFill = AscFormat.CorrectUniFill(CreateAscGradFillByIndex(27, 45, 5400000), new AscFormat.CUniFill(), 0);
	oTextPr.TextOutline = CreateNoFillLine();
	this.aStylesByIndex[11] = oTextPr;
	this.aStylesByIndexToApply[11] = oTextPr;
};

TextArtPreviewManager.prototype.getStylesToApply = function()
{
	if(this.aStylesByIndex.length === 0)
	{
		this.initStyles();
	}
	return this.aStylesByIndexToApply;
};

TextArtPreviewManager.prototype.clear = function()
{
	this.TextArtStyles.length = 0;
};

TextArtPreviewManager.prototype.getWordArtStyles = function()
{
	if(this.TextArtStyles.length === 0)
	{
		this.generateTextArtStyles();
	}
	return this.TextArtStyles;
};

TextArtPreviewManager.prototype.getCanvas = function()
{
	if (null === this.canvas)
	{
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.canvasWidth;
		this.canvas.height = this.canvasHeight;

		if (AscCommon.AscBrowser.isRetina) {
			this.canvas.width <<= 1;
			this.canvas.height <<= 1;
		}
	}
	return this.canvas;
};

TextArtPreviewManager.prototype.getShapeByPrst = function(prst)
{
	var oShape = this.getShape();
    if(!oShape)
    {
        return null;
    }
	var oContent = oShape.getDocContent();

	var TextSpacing = undefined;
	switch(prst)
	{
		case "textButton":
		{
			TextSpacing = 4;
			oContent.AddText("abcde");
			oContent.AddNewParagraph();
			oContent.AddText("Fghi");
			oContent.AddNewParagraph();
			oContent.AddText("Jklmn");
			break;
		}
		case "textArchUp":
		case "textArchDown":
		{
			TextSpacing = 4;
			oContent.AddText("abcdefg");
			break;
		}

		case "textCircle":
		{
			TextSpacing = 4;
			oContent.AddText("abcdefghijklmnop");
			break;
		}
        case "textButtonPour":
        {
			oContent.AddText("abcde");
            oContent.AddNewParagraph();
			oContent.AddText("abc");
            oContent.AddNewParagraph();
			oContent.AddText("abcde");
            break;
        }
        case "textDeflateInflate":
        {
			oContent.AddText("abcde");
            oContent.AddNewParagraph();
			oContent.AddText("abcde");
            break;
        }
        case "textDeflateInflateDeflate":
        {
			oContent.AddText("abcde");
            oContent.AddNewParagraph();
			oContent.AddText("abcde");
            oContent.AddNewParagraph();
			oContent.AddText("abcde");
            break;
        }
		default:
		{
			oContent.AddText("abcde");
			break;
		}
	}
	oContent.Set_ApplyToAll(true);
	oContent.SetParagraphAlign(AscCommon.align_Center);
	oContent.AddToParagraph(new ParaTextPr({FontSize: 36, Spacing: TextSpacing}));
	oContent.Set_ApplyToAll(false);

	var oBodypr = oShape.getBodyPr().createDuplicate();
	oBodypr.prstTxWarp = AscFormat.ExecuteNoHistory(
		function()
		{
			return AscFormat.CreatePrstTxWarpGeometry(prst)
		}, []);
	if(!oShape.bWordShape)
	{
		oShape.txBody.setBodyPr(oBodypr);
	}
	else
	{
		oShape.setBodyPr(oBodypr);
	}
	oShape.setBDeleted(false);
	oShape.recalculate();
	return oShape;
};
TextArtPreviewManager.prototype.getShape =  function()
{
	var oShape = new AscFormat.CShape();
	var oParent = null, oWorkSheet = null;
	var bWord = true;
	if (Asc['editor'] && AscCommon.c_oEditorId.Spreadsheet === Asc['editor'].getEditorId()) {
		var api_sheet = Asc['editor'];
		oShape.setWorksheet(api_sheet.wb.getWorksheet().model);
		oWorkSheet = api_sheet.wb.getWorksheet().model;
		bWord = false;
	} else {
		if (editor && editor.WordControl && Array.isArray(editor.WordControl.m_oLogicDocument.Slides)) {
			if (editor.WordControl.m_oLogicDocument.Slides[editor.WordControl.m_oLogicDocument.CurPage]) {
				oShape.setParent(editor.WordControl.m_oLogicDocument.Slides[editor.WordControl.m_oLogicDocument.CurPage]);
				oParent = editor.WordControl.m_oLogicDocument.Slides[editor.WordControl.m_oLogicDocument.CurPage];
				bWord = false;
			} else {
				return null;
			}
		}
	}


	var oParentObjects = oShape.getParentObjects();
	var oTrack = new AscFormat.NewShapeTrack("textRect", 0, 0, oParentObjects.theme, oParentObjects.master, oParentObjects.layout, oParentObjects.slide, 0);
	oTrack.track({}, oShape.convertPixToMM(this.canvasWidth), oShape.convertPixToMM(this.canvasHeight));
	oShape = oTrack.getShape(bWord, oShape.getDrawingDocument(), oShape.drawingObjects);
    oShape.setStyle(null);
    oShape.spPr.setFill(AscFormat.CreateUnfilFromRGB(255, 255, 255));
	var oBodypr = oShape.getBodyPr().createDuplicate();
	oBodypr.lIns = 0;
	oBodypr.tIns = 0;
	oBodypr.rIns = 0;
	oBodypr.bIns = 0;
	oBodypr.anchor = 1;
	if(!bWord)
	{
		oShape.txBody.setBodyPr(oBodypr);
	}
	else
	{
		oShape.setBodyPr(oBodypr);
	}
	oShape.spPr.setLn(AscFormat.CreatePenFromParams(CreateNoFillUniFill(), null, null, null, 2, null));
	if(oWorkSheet)
	{
		oShape.setWorksheet(oWorkSheet);
	}
	if(oParent)
	{
		oShape.setParent(oParent);
	}
	oShape.spPr.xfrm.setOffX(0);
	oShape.spPr.xfrm.setOffY(0);
	oShape.spPr.xfrm.setExtX(this.shapeWidth);
	oShape.spPr.xfrm.setExtY(this.shapeHeight);
	return oShape;
};

TextArtPreviewManager.prototype.getTAShape = function()
{
	if(!this.TAShape)
	{

		var MainLogicDocument = (editor && editor.WordControl && editor.WordControl.m_oLogicDocument ? editor && editor.WordControl && editor.WordControl.m_oLogicDocument : null);
		var TrackRevisions = (MainLogicDocument && MainLogicDocument.IsTrackRevisions ? MainLogicDocument.IsTrackRevisions() : false);
		if (MainLogicDocument && true === TrackRevisions)
			MainLogicDocument.SetTrackRevisions(false);
		var oShape = this.getShape();
        if(!oShape)
        {
			if (MainLogicDocument && true === TrackRevisions)
				MainLogicDocument.SetTrackRevisions(true);
            return null;
        }
		var oContent = oShape.getDocContent();
		if(oContent)
		{
			if(oContent.MoveCursorToStartPos)
			{
				oContent.MoveCursorToStartPos();
			}
			oContent.AddText("Ta");
			oContent.Set_ApplyToAll(true);
			oContent.AddToParagraph(new ParaTextPr({FontSize: 109, RFonts: {Ascii : {Name: "Arial", Index: -1}}}));
			oContent.SetParagraphAlign(AscCommon.align_Center);
			oContent.SetParagraphIndent({FirstLine: 0, Left: 0, Right: 0});
			oContent.Set_ApplyToAll(false);
		}
		if (MainLogicDocument && true === TrackRevisions)
			MainLogicDocument.SetTrackRevisions(true);
		this.TAShape = oShape;
	}
	return this.TAShape;
};

TextArtPreviewManager.prototype.getWordArtPreview = function(prst)
{
	var _canvas = this.getCanvas();
	var ctx = _canvas.getContext('2d');
	var graphics = new AscCommon.CGraphics();
	var oShape = this.getShapeByPrst(prst);
    if(!oShape)
    {
        return "";
    }
	graphics.init(ctx, _canvas.width, _canvas.height, oShape.extX, oShape.extY);
	graphics.m_oFontManager = AscCommon.g_fontManager;
	graphics.transform(1,0,0,1,0,0);

	var oldShowParaMarks;
	if(editor)
	{
		oldShowParaMarks = editor.ShowParaMarks;
		editor.ShowParaMarks = false;
	}
	oShape.draw(graphics);

	if(editor)
	{
		editor.ShowParaMarks = oldShowParaMarks;
	}
	return _canvas.toDataURL("image/png");
};

TextArtPreviewManager.prototype.generateTextArtStyles = function()
{
    AscFormat.ExecuteNoHistory(function(){

        if(this.aStylesByIndex.length === 0)
        {
            this.initStyles();
        }
        var _canvas = this.getCanvas();
        var ctx = _canvas.getContext('2d');
        var graphics = new AscCommon.CGraphics();
        var oShape = this.getTAShape();
        if(!oShape)
        {
            this.TextArtStyles.length = 0;
            return;
        }
        oShape.recalculate();

        graphics.m_oFontManager = AscCommon.g_fontManager;

        var oldShowParaMarks;
        if(editor)
        {
            oldShowParaMarks = editor.ShowParaMarks;
            editor.ShowParaMarks = false;
        }
        var oContent = oShape.getDocContent();
        oContent.Set_ApplyToAll(true);
        for(var i = 0; i < this.aStylesByIndex.length; ++i)
        {
            oContent.AddToParagraph(new ParaTextPr(this.aStylesByIndex[i]));
            graphics.init(ctx, _canvas.width, _canvas.height, oShape.extX, oShape.extY);
            graphics.transform(1,0,0,1,0,0);
            oShape.recalcText();
            if(!oShape.bWordShape)
            {
                oShape.recalculate();
            }
            else
            {
                oShape.recalculateText();
            }
            oShape.draw(graphics);
            this.TextArtStyles[i] = _canvas.toDataURL("image/png");
        }
        oContent.Set_ApplyToAll(false);

        if(editor)
        {
            editor.ShowParaMarks = oldShowParaMarks;
        }
    }, this, []);
};



function GenerateWordArtPrewiewCode()
{
	var oWordArtPreview = new TextArtPreviewManager();
	var i, j;
	var oRetString =  "g_PresetTxWarpTypes = \n [";
	for(i = 0; i < AscCommon.g_PresetTxWarpTypes.length; ++i)
	{
		var aByTypes = AscCommon.g_PresetTxWarpTypes[i];
		oRetString += "\n\t[";
		for(j = 0; j < aByTypes.length; ++j)
		{
			oRetString += "\n\t\t{Type: \"" + aByTypes[j]['Type'] + "\", Image: \"" + oWordArtPreview.getWordArtPreview(aByTypes[j]['Image']) + "\"}" + ((j === aByTypes.length - 1) ? "" : ",");
		}
		oRetString += "\n\t]" + (i < (AscCommon.g_PresetTxWarpTypes.length - 1) ? "," : "");
	}
	oRetString += "\n];";
	return oRetString;
}

	//----------------------------------------------------------export----------------------------------------------------
	window['AscCommon'] = window['AscCommon'] || {};
	window['AscCommon'].ChartPreviewManager = ChartPreviewManager;
	window['AscCommon'].TextArtPreviewManager = TextArtPreviewManager;
})(window);
