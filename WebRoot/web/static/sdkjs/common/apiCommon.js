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

	var Asc = window['Asc'];
	var AscCommon = window['AscCommon'];

	// Import
	var prot;
	var c_oAscMouseMoveDataTypes = AscCommon.c_oAscMouseMoveDataTypes;

	var c_oAscColor = Asc.c_oAscColor;
	var c_oAscFill = Asc.c_oAscFill;
	var c_oAscFillBlipType = Asc.c_oAscFillBlipType;
	var c_oAscChartTypeSettings = Asc.c_oAscChartTypeSettings;
	var c_oAscTickMark = Asc.c_oAscTickMark;
	var c_oAscAxisType = Asc.c_oAscAxisType;
	// ---------------------------------------------------------------------------------------------------------------

	var c_oAscArrUserColors = [16757719, 7929702, 56805, 10081791, 12884479, 16751001, 6748927, 16762931, 6865407,
		15650047, 16737894, 3407768, 16759142, 10852863, 6750176, 16774656, 13926655, 13815039, 3397375, 11927347, 16752947,
		9404671, 4980531, 16744678, 3407830, 15919360, 16731553, 52479, 13330175, 16743219, 3386367, 14221056, 16737966,
		1896960, 65484, 10970879, 16759296, 16711680, 13496832, 62072, 49906, 16734720, 10682112, 7890687, 16731610, 65406,
		38655, 16747008, 59890, 12733951, 15859712, 47077, 15050496, 15224319, 10154496, 58807, 16724950, 1759488, 9981439,
		15064320, 15893248, 16724883, 58737, 15007744, 36594, 12772608, 12137471, 6442495, 15039488, 16718470, 14274816,
		53721, 16718545, 1625088, 15881472, 13419776, 32985, 16711800, 1490688, 16711884, 8991743, 13407488, 41932, 7978752,
		15028480, 52387, 15007927, 12114176, 1421824, 55726, 13041893, 10665728, 30924, 49049, 14241024, 36530, 11709440,
		13397504, 45710, 34214];

	function CreateAscColorCustom(r, g, b, auto) {
		var ret = new asc_CColor();
		ret.type = c_oAscColor.COLOR_TYPE_SRGB;
		ret.r = r;
		ret.g = g;
		ret.b = b;
		ret.a = 255;
		ret.Auto = ( undefined === auto ? false : auto );
		return ret;
	}

	function CreateAscColor(unicolor) {
      if (null == unicolor || null == unicolor.color) {
          return new asc_CColor();
      }

		var ret = new asc_CColor();
		ret.r = unicolor.RGBA.R;
		ret.g = unicolor.RGBA.G;
		ret.b = unicolor.RGBA.B;
		ret.a = unicolor.RGBA.A;

		var _color = unicolor.color;
		switch (_color.type) {
			case c_oAscColor.COLOR_TYPE_SRGB:
			case c_oAscColor.COLOR_TYPE_SYS: {
				break;
			}
			case c_oAscColor.COLOR_TYPE_PRST:
			case c_oAscColor.COLOR_TYPE_SCHEME: {
				ret.type = _color.type;
				ret.value = _color.id;
				break;
			}
			default:
				break;
		}
		return ret;
	}

	function CreateGUID()
	{
		function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);	}

		var val = '{' + s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4() + '}';
		val = val.toUpperCase();
		return val;
	}
	function CreateUInt32()
	{
		return Math.floor(Math.random() * 0x100000000);
	}

	var c_oLicenseResult = {
		Error         : 1,
		Expired       : 2,
		Success       : 3,
		UnknownUser   : 4,
		Connections   : 5,
		ExpiredTrial  : 6,
		SuccessLimit  : 7,
		UsersCount    : 8,
		ConnectionsOS : 9,
		UsersCountOS  : 10
	};

	var c_oRights = {
		None    : 0,
		Edit    : 1,
		Review  : 2,
		Comment : 3,
		View    : 4
	};

	var c_oLicenseMode = {
		None: 0,
		Trial: 1,
		Developer: 2
	};

	var EPluginDataType = {
		none: "none",
		text: "text",
		ole: "ole",
		html: "html",
        desktop: "desktop"
	};

	/** @constructor */
	function asc_CSignatureLine()
	{
		this.id = undefined;
		this.guid = "";
		this.signer1 = "";
		this.signer2 = "";
		this.email = "";

		this.instructions = "";
		this.showDate = false;

		this.valid = 0;

		this.image = "";

		this.date = "";
		this.isvisible = false;
		this.isrequested = false;
	}
	asc_CSignatureLine.prototype.correct = function()
	{
		if (this.id == null)
			this.id = "0";
		if (this.guid == null)
			this.guid = "";
		if (this.signer1 == null)
			this.signer1 = "";
		if (this.signer2 == null)
			this.signer2 = "";
		if (this.email == null)
			this.email = "";
		if (this.instructions == null)
			this.instructions = "";
		if (this.showDate == null)
			this.showDate = false;
		if (this.valid == null)
			this.valid = 0;
		if (this.image == null)
			this.image = "";
		if (this.date == null)
			this.date = "";
		if (this.isvisible == null)
			this.isvisible = false;
	};
	asc_CSignatureLine.prototype.asc_getId = function(){ return this.id; };
	asc_CSignatureLine.prototype.asc_setId = function(v){ this.id = v; };
	asc_CSignatureLine.prototype.asc_getGuid = function(){ return this.guid; };
	asc_CSignatureLine.prototype.asc_setGuid = function(v){ this.guid = v; };
	asc_CSignatureLine.prototype.asc_getSigner1 = function(){ return this.signer1; };
	asc_CSignatureLine.prototype.asc_setSigner1 = function(v){ this.signer1 = v; };
	asc_CSignatureLine.prototype.asc_getSigner2 = function(){ return this.signer2; };
	asc_CSignatureLine.prototype.asc_setSigner2 = function(v){ this.signer2 = v; };
	asc_CSignatureLine.prototype.asc_getEmail = function(){ return this.email; };
	asc_CSignatureLine.prototype.asc_setEmail = function(v){ this.email = v; };
	asc_CSignatureLine.prototype.asc_getInstructions = function(){ return this.instructions; };
	asc_CSignatureLine.prototype.asc_setInstructions = function(v){ this.instructions = v; };
	asc_CSignatureLine.prototype.asc_getShowDate = function(){ return this.showDate; };
	asc_CSignatureLine.prototype.asc_setShowDate = function(v){ this.showDate = v; };
	asc_CSignatureLine.prototype.asc_getValid = function(){ return this.valid; };
	asc_CSignatureLine.prototype.asc_setValid = function(v){ this.valid = v; };
	asc_CSignatureLine.prototype.asc_getDate = function(){ return this.date; };
	asc_CSignatureLine.prototype.asc_setDate = function(v){ this.date = v; };
	asc_CSignatureLine.prototype.asc_getVisible = function(){ return this.isvisible; };
	asc_CSignatureLine.prototype.asc_setVisible = function(v){ this.isvisible = v; };
	asc_CSignatureLine.prototype.asc_getRequested = function(){ return this.isrequested; };
	asc_CSignatureLine.prototype.asc_setRequested = function(v){ this.isrequested = v; };

	/**
	 * Класс asc_CAscEditorPermissions для прав редакторов
	 * -----------------------------------------------------------------------------
	 *
	 * @constructor
	 * @memberOf Asc
	 */
	function asc_CAscEditorPermissions() {
		this.licenseType = c_oLicenseResult.Error;
		this.licenseMode = c_oLicenseMode.None;
		this.isLight = false;
		this.rights = c_oRights.None;

		this.canCoAuthoring = true;
		this.canReaderMode = true;
		this.canBranding = false;
		this.customization = false;
		this.isAutosaveEnable = true;
		this.AutosaveMinInterval = 300;
		this.isAnalyticsEnable = false;
		this.buildVersion = null;
		this.buildNumber = null;
		return this;
	}

	asc_CAscEditorPermissions.prototype.asc_getLicenseType = function () {
		return this.licenseType;
	};
	asc_CAscEditorPermissions.prototype.asc_getCanCoAuthoring = function () {
		return this.canCoAuthoring;
	};
	asc_CAscEditorPermissions.prototype.asc_getCanReaderMode = function () {
		return this.canReaderMode;
	};
	asc_CAscEditorPermissions.prototype.asc_getCanBranding = function () {
		return this.canBranding;
	};
	asc_CAscEditorPermissions.prototype.asc_getCustomization = function () {
		return this.customization;
	};
	asc_CAscEditorPermissions.prototype.asc_getIsAutosaveEnable = function () {
		return this.isAutosaveEnable;
	};
	asc_CAscEditorPermissions.prototype.asc_getAutosaveMinInterval = function () {
		return this.AutosaveMinInterval;
	};
	asc_CAscEditorPermissions.prototype.asc_getIsAnalyticsEnable = function () {
		return this.isAnalyticsEnable;
	};
	asc_CAscEditorPermissions.prototype.asc_getIsLight = function () {
		return this.isLight;
	};
	asc_CAscEditorPermissions.prototype.asc_getLicenseMode = function () {
		return this.licenseMode;
	};
	asc_CAscEditorPermissions.prototype.asc_getRights = function () {
		return this.rights;
	};
	asc_CAscEditorPermissions.prototype.asc_getBuildVersion = function () {
		return this.buildVersion;
	};
	asc_CAscEditorPermissions.prototype.asc_getBuildNumber = function () {
		return this.buildNumber;
	};

	asc_CAscEditorPermissions.prototype.setLicenseType = function (v) {
		this.licenseType = v;
	};
	asc_CAscEditorPermissions.prototype.setCanBranding = function (v) {
		this.canBranding = v;
	};
	asc_CAscEditorPermissions.prototype.setCustomization = function (v) {
		this.customization = v;
	};
	asc_CAscEditorPermissions.prototype.setIsLight = function (v) {
		this.isLight = v;
	};
	asc_CAscEditorPermissions.prototype.setLicenseMode = function (v) {
		this.licenseMode = v;
	};
	asc_CAscEditorPermissions.prototype.setRights = function (v) {
		this.rights = v;
	};
	asc_CAscEditorPermissions.prototype.setBuildVersion = function (v) {
		this.buildVersion = v;
	};
	asc_CAscEditorPermissions.prototype.setBuildNumber = function (v) {
		this.buildNumber = v;
	};

	/** @constructor */
	function asc_ValAxisSettings() {
		this.minValRule = null;
		this.minVal = null;
		this.maxValRule = null;
		this.maxVal = null;
		this.invertValOrder = null;
		this.logScale = null;
		this.logBase = null;

		this.dispUnitsRule = null;
		this.units = null;


		this.showUnitsOnChart = null;
		this.majorTickMark = null;
		this.minorTickMark = null;
		this.tickLabelsPos = null;
		this.crossesRule = null;
		this.crosses = null;
		this.axisType = c_oAscAxisType.val;
	}

	asc_ValAxisSettings.prototype = {


		isEqual: function(oPr){
			if(!oPr){
				return false;
			}
            if(this.minValRule !== oPr.minValRule){
				return false;
			}
            if(this.minVal !== oPr.minVal){
            	return false;
			}
            if(this.maxValRule !== oPr.maxValRule){
            	return false;
			}
            if(this.maxVal !== oPr.maxVal){
            	return false;
			}
            if(this.invertValOrder !== oPr.invertValOrder){
            	return false;
			}
            if(this.logScale !== oPr.logScale){
            	return false;
			}
            if(this.logBase !== oPr.logBase){
            	return false;
			}
            if(this.dispUnitsRule !== oPr.dispUnitsRule){
            	return false;
			}
            if(this.units !== oPr.units){
            	return false;
			}
            if(this.showUnitsOnChart !== oPr.showUnitsOnChart){
            	return false;
			}
            if(this.majorTickMark !== oPr.majorTickMark){
            	return false;
			}
            if(this.minorTickMark !== oPr.minorTickMark){
            	return false;
			}
            if(this.tickLabelsPos !== oPr.tickLabelsPos){
            	return false;
			}
            if(this.crossesRule !== oPr.crossesRule){
            	return false;
			}
            if(this.crosses !== oPr.crosses){
            	return false;
			}
            if(this.axisType !== oPr.axisType){
            	return false;
			}

			return true;
		},

		putAxisType: function (v) {
			this.axisType = v;
		},

		putMinValRule: function (v) {
			this.minValRule = v;
		}, putMinVal: function (v) {
			this.minVal = v;
		}, putMaxValRule: function (v) {
			this.maxValRule = v;
		}, putMaxVal: function (v) {
			this.maxVal = v;
		}, putInvertValOrder: function (v) {
			this.invertValOrder = v;
		}, putLogScale: function (v) {
			this.logScale = v;
		}, putLogBase: function (v) {
			this.logBase = v;
		}, putUnits: function (v) {
			this.units = v;
		}, putShowUnitsOnChart: function (v) {
			this.showUnitsOnChart = v;
		}, putMajorTickMark: function (v) {
			this.majorTickMark = v;
		}, putMinorTickMark: function (v) {
			this.minorTickMark = v;
		}, putTickLabelsPos: function (v) {
			this.tickLabelsPos = v;
		}, putCrossesRule: function (v) {
			this.crossesRule = v;
		}, putCrosses: function (v) {
			this.crosses = v;
		},


		putDispUnitsRule: function (v) {
			this.dispUnitsRule = v;
		},

		getAxisType: function () {
			return this.axisType;
		},

		getDispUnitsRule: function () {
			return this.dispUnitsRule;
		},

		getMinValRule: function () {
			return this.minValRule;
		}, getMinVal: function () {
			return this.minVal;
		}, getMaxValRule: function () {
			return this.maxValRule;
		}, getMaxVal: function () {
			return this.maxVal;
		}, getInvertValOrder: function () {
			return this.invertValOrder;
		}, getLogScale: function () {
			return this.logScale;
		}, getLogBase: function () {
			return this.logBase;
		}, getUnits: function () {
			return this.units;
		}, getShowUnitsOnChart: function () {
			return this.showUnitsOnChart;
		}, getMajorTickMark: function () {
			return this.majorTickMark;
		}, getMinorTickMark: function () {
			return this.minorTickMark;
		}, getTickLabelsPos: function () {
			return this.tickLabelsPos;
		}, getCrossesRule: function () {
			return this.crossesRule;
		}, getCrosses: function () {
			return this.crosses;
		}, setDefault: function () {
			this.putMinValRule(Asc.c_oAscValAxisRule.auto);
			this.putMaxValRule(Asc.c_oAscValAxisRule.auto);
			this.putTickLabelsPos(Asc.c_oAscTickLabelsPos.TICK_LABEL_POSITION_NEXT_TO);
			this.putInvertValOrder(false);
			this.putDispUnitsRule(Asc.c_oAscValAxUnits.none);
			this.putMajorTickMark(c_oAscTickMark.TICK_MARK_OUT);
			this.putMinorTickMark(c_oAscTickMark.TICK_MARK_NONE);
			this.putCrossesRule(Asc.c_oAscCrossesRule.auto);
		}
	};

	/** @constructor */
	function asc_CatAxisSettings() {
		this.intervalBetweenTick = null;
		this.intervalBetweenLabelsRule = null;
		this.intervalBetweenLabels = null;
		this.invertCatOrder = null;
		this.labelsAxisDistance = null;
		this.majorTickMark = null;
		this.minorTickMark = null;
		this.tickLabelsPos = null;
		this.crossesRule = null;
		this.crosses = null;
		this.labelsPosition = null;
		this.axisType = c_oAscAxisType.cat;
		this.crossMinVal = null;
		this.crossMaxVal = null;
	}

	asc_CatAxisSettings.prototype = {

		isEqual: function(oPr){
			if(!oPr){
				return false;
			}
            if(this.intervalBetweenTick !== oPr.intervalBetweenTick){
            	return false;
			}
            if(this.intervalBetweenLabelsRule !== oPr.intervalBetweenLabelsRule){
            	return false;
			}
            if(this.intervalBetweenLabels !== oPr.intervalBetweenLabels){
            	return false;
			}
            if(this.invertCatOrder !== oPr.invertCatOrder){
            	return false;
			}
            if(this.labelsAxisDistance !== oPr.labelsAxisDistance){
            	return false;
			}
            if(this.majorTickMark !== oPr.majorTickMark){
            	return false;
			}
            if(this.minorTickMark !== oPr.minorTickMark){
            	return false;
			}
            if(this.tickLabelsPos !== oPr.tickLabelsPos){
            	return false;
			}
            if(this.crossesRule !== oPr.crossesRule){
            	return false;
			}
            if(this.crosses !== oPr.crosses){
            	return false;
			}
            if(this.labelsPosition !== oPr.labelsPosition){
            	return false;
			}
            if(this.axisType !==  oPr.axisType){
            	return false;
			}
            if(this.crossMinVal !== oPr.crossMinVal){
            	return false;
			}
            if(this.crossMaxVal !== oPr.crossMaxVal){
            	return false;
			}
			return true;
		},
		putIntervalBetweenTick: function (v) {
			this.intervalBetweenTick = v;
		}, putIntervalBetweenLabelsRule: function (v) {
			this.intervalBetweenLabelsRule = v;
		}, putIntervalBetweenLabels: function (v) {
			this.intervalBetweenLabels = v;
		}, putInvertCatOrder: function (v) {
			this.invertCatOrder = v;
		}, putLabelsAxisDistance: function (v) {
			this.labelsAxisDistance = v;
		}, putMajorTickMark: function (v) {
			this.majorTickMark = v;
		}, putMinorTickMark: function (v) {
			this.minorTickMark = v;
		}, putTickLabelsPos: function (v) {
			this.tickLabelsPos = v;
		}, putCrossesRule: function (v) {
			this.crossesRule = v;
		}, putCrosses: function (v) {
			this.crosses = v;
		},

		putAxisType: function (v) {
			this.axisType = v;
		},

		putLabelsPosition: function (v) {
			this.labelsPosition = v;
		},

		getIntervalBetweenTick: function (v) {
			return this.intervalBetweenTick;
		},

		getIntervalBetweenLabelsRule: function () {
			return this.intervalBetweenLabelsRule;
		}, getIntervalBetweenLabels: function () {
			return this.intervalBetweenLabels;
		}, getInvertCatOrder: function () {
			return this.invertCatOrder;
		}, getLabelsAxisDistance: function () {
			return this.labelsAxisDistance;
		}, getMajorTickMark: function () {
			return this.majorTickMark;
		}, getMinorTickMark: function () {
			return this.minorTickMark;
		}, getTickLabelsPos: function () {
			return this.tickLabelsPos;
		}, getCrossesRule: function () {
			return this.crossesRule;
		}, getCrosses: function () {
			return this.crosses;
		},

		getAxisType: function () {
			return this.axisType;
		},

		getLabelsPosition: function () {
			return this.labelsPosition;
		},

		getCrossMinVal: function () {
			return this.crossMinVal;
		},

		getCrossMaxVal: function () {
			return this.crossMaxVal;
		},


		putCrossMinVal: function (val) {
			this.crossMinVal = val;
		},

		putCrossMaxVal: function (val) {
			this.crossMaxVal = val;
		},

		setDefault: function () {
			this.putIntervalBetweenLabelsRule(Asc.c_oAscBetweenLabelsRule.auto);
			this.putLabelsPosition(Asc.c_oAscLabelsPosition.betweenDivisions);
			this.putTickLabelsPos(Asc.c_oAscTickLabelsPos.TICK_LABEL_POSITION_NEXT_TO);
			this.putLabelsAxisDistance(100);
			this.putMajorTickMark(c_oAscTickMark.TICK_MARK_OUT);
			this.putMinorTickMark(c_oAscTickMark.TICK_MARK_NONE);
			this.putIntervalBetweenTick(1);
			this.putCrossesRule(Asc.c_oAscCrossesRule.auto);
		}
	};

	/** @constructor */
	function asc_ChartSettings() {
		this.style = null;
		this.title = null;
		this.rowCols = null;
		this.horAxisLabel = null;
		this.vertAxisLabel = null;
		this.legendPos = null;
		this.dataLabelsPos = null;
		this.vertAx = null;
		this.horAx = null;
		this.horGridLines = null;
		this.vertGridLines = null;
		this.type = null;
		this.showSerName = null;
		this.showCatName = null;
		this.showVal = null;
		this.separator = null;
		this.horAxisProps = null;
		this.vertAxisProps = null;
		this.inColumns = null;

		this.aRanges = [];

		this.showMarker = null;
		this.bLine = null;
		this.smooth = null;
		this.showHorAxis = null;
		this.showVerAxis = null;
	}

	asc_ChartSettings.prototype = {

		equalBool: function(a, b){
			return ((!!a) === (!!b));
		},

		isEqual: function(oPr){
			if(!oPr){
				return false;
			}
			if(this.style !== oPr.style){
				return false;
			}
            if(this.title !== oPr.title){
				return false;
			}
			if(this.rowCols !== oPr.rowCols){
            	return false;
			}
			if(this.horAxisLabel !== oPr.horAxisLabel){
				return false;
			}
            if(this.vertAxisLabel !== oPr.vertAxisLabel){
				return false;
			}
			if(this.legendPos !== oPr.legendPos){
           		return false;
			}
			if(this.dataLabelsPos !== oPr.dataLabelsPos){
				return false;
			}
			if(this.vertAx !== oPr.vertAx){
				return false;
			}
			if(this.horAx !== oPr.horAx){
				return false;
			}
            if(this.horGridLines !== oPr.horGridLines){
            	return false;
			}
            if(this.vertGridLines !== oPr.vertGridLines){
            	return false;
			}
            if(this.type !== oPr.type){
            	return false;
			}
            if(!this.equalBool(this.showSerName, oPr.showSerName)){
            	return false;
			}

            if(!this.equalBool(this.showCatName, oPr.showCatName)){
            	return false;
			}
            if(!this.equalBool(this.showVal, oPr.showVal)){
            	return false;
			}

            if(this.separator !== oPr.separator &&
			!(this.separator === ' ' && oPr.separator == null || oPr.separator === ' ' && this.separator == null)){
            	return false;
			}
			if(!this.horAxisProps){
            	if(oPr.horAxisProps){
            		return false;
				}
			}
			else{
				if(!this.horAxisProps.isEqual(oPr.horAxisProps)){
					return false;
				}
			}
            if(!this.vertAxisProps){
                if(oPr.vertAxisProps){
                    return false;
                }
            }
            else{
                if(!this.vertAxisProps.isEqual(oPr.vertAxisProps)){
                    return false;
                }
            }
            if(this.aRanges.length !== oPr.aRanges.length){
                return false;
            }
			for(var i = 0; i < this.aRanges.length; ++i) {
				if(this.aRanges[i] !== oPr.aRanges[i]) {
					return false;
				}
			}
            if(!this.equalBool(this.inColumns, oPr.inColumns)){
                return false;
            }

            if(!this.equalBool(this.showMarker, oPr.showMarker)){
                return false;
            }
            if(!this.equalBool(this.bLine, oPr.bLine)){
                return false;
            }
            if(!this.equalBool(this.smooth, oPr.smooth)){
                return false;
            }
            if(!this.equalBool(this.showHorAxis, oPr.showHorAxis)){
                return false;
            }

            if(!this.equalBool(this.showVerAxis, oPr.showVerAxis)){
                return false;
            }
            return true;
		},

		putShowMarker: function (v) {
			this.showMarker = v;
		},

		getShowMarker: function () {
			return this.showMarker;
		},

		putLine: function (v) {
			this.bLine = v;
		},

		getLine: function () {
			return this.bLine;
		},

		putRanges: function(aRanges) {
			if(Array.isArray(aRanges)) {
				this.aRanges = aRanges;
			}
			else {
				this.aRanges.length = 0;
			}
		},
		putRanges2: function(aRanges) {
			this.aRanges.length = 0;

			if(Array.isArray(aRanges)) {
				for(var i = 0; i < aRanges.length; ++i) {
					this.aRanges.push(aRanges[i].asc_getName());
				}
			}
		},

		getRanges: function() {
			return this.aRanges;
		},

		putSmooth: function (v) {
			this.smooth = v;
		},

		getSmooth: function () {
			return this.smooth;
		},

		putStyle: function (index) {
			this.style = parseInt(index, 10);
		},

		getStyle: function () {
			return this.style;
		},

		putRange: function (range) {
			this.aRanges.length = 0;
			this.aRanges[0] = range;
		},

		getRange: function () {
			if(this.aRanges.length > 0) {
				return this.aRanges[0];
			}
			return null;
		},

		putInColumns: function (inColumns) {
			this.inColumns = inColumns;
		},

		getInColumns: function () {
			return this.inColumns;
		},

		putTitle: function (v) {
			this.title = v;
		},

		getTitle: function () {
			return this.title;
		},

		putRowCols: function (v) {
			this.rowCols = v;
		},

		getRowCols: function () {
			return this.rowCols;
		},

		putHorAxisLabel: function (v) {
			this.horAxisLabel = v;
		}, putVertAxisLabel: function (v) {
			this.vertAxisLabel = v;
		}, putLegendPos: function (v) {
			this.legendPos = v;
		}, putDataLabelsPos: function (v) {
			this.dataLabelsPos = v;
		}, putCatAx: function (v) {
			this.vertAx = v;
		}, putValAx: function (v) {
			this.horAx = v;
		},

		getHorAxisLabel: function (v) {
			return this.horAxisLabel;
		}, getVertAxisLabel: function (v) {
			return this.vertAxisLabel;
		}, getLegendPos: function (v) {
			return this.legendPos;
		}, getDataLabelsPos: function (v) {
			return this.dataLabelsPos;
		}, getVertAx: function (v) {
			return this.vertAx;
		}, getHorAx: function (v) {
			return this.horAx;
		},

		putHorGridLines: function (v) {
			this.horGridLines = v;
		},

		getHorGridLines: function (v) {
			return this.horGridLines;
		},

		putVertGridLines: function (v) {
			this.vertGridLines = v;
		},

		getVertGridLines: function () {
			return this.vertGridLines;
		},

		getType: function () {
			return this.type;
		},

		putType: function (v) {
			return this.type = v;
		},

		putShowSerName: function (v) {
			return this.showSerName = v;
		}, putShowCatName: function (v) {
			return this.showCatName = v;
		}, putShowVal: function (v) {
			return this.showVal = v;
		},


		getShowSerName: function () {
			return this.showSerName;
		}, getShowCatName: function () {
			return this.showCatName;
		}, getShowVal: function () {
			return this.showVal;
		},

		putSeparator: function (v) {
			this.separator = v;
		},

		getSeparator: function () {
			return this.separator;
		},

		putHorAxisProps: function (v) {
			this.horAxisProps = v;
		},

		getHorAxisProps: function () {
			return this.horAxisProps;
		},


		putVertAxisProps: function (v) {
			this.vertAxisProps = v;
		},

		getVertAxisProps: function () {
			return this.vertAxisProps;
		},



		checkSwapAxisProps: function(bHBar){
            var hor_axis_settings = this.getHorAxisProps();
            var vert_axis_settings = this.getVertAxisProps();
			if(!bHBar){
                if(hor_axis_settings){
                    if(hor_axis_settings.getAxisType() !== c_oAscAxisType.cat){
                        if(vert_axis_settings &&  vert_axis_settings.getAxisType() === c_oAscAxisType.cat){
                            this.putHorAxisProps(vert_axis_settings);
                        }
                        else{
                            var new_hor_axis_settings = new asc_CatAxisSettings();
                            new_hor_axis_settings.setDefault();
                            this.putHorAxisProps(new_hor_axis_settings);
                        }
                    }
                }
                else{
                    var new_hor_axis_settings = new asc_CatAxisSettings();
                    new_hor_axis_settings.setDefault();
                    this.putHorAxisProps(new_hor_axis_settings);
                }

                if(vert_axis_settings){
                    if(vert_axis_settings.getAxisType() !== c_oAscAxisType.val){
                        if(hor_axis_settings && hor_axis_settings.getAxisType() === c_oAscAxisType.val){
                            this.putVertAxisProps(hor_axis_settings);
                        }
                        else{
                            var new_vert_axis_settings = new asc_ValAxisSettings();
                            new_vert_axis_settings.setDefault();
                            this.putVertAxisProps(new_vert_axis_settings);
                        }
                    }
                }
                else{
                    var new_vert_axis_settings = new asc_ValAxisSettings();
                    new_vert_axis_settings.setDefault();
                    this.putVertAxisProps(new_vert_axis_settings);
                }
            }
            else{
                if(hor_axis_settings){
                    if(hor_axis_settings.getAxisType() !== c_oAscAxisType.val){
                        if(vert_axis_settings &&  vert_axis_settings.getAxisType() === c_oAscAxisType.val){
                            this.putHorAxisProps(vert_axis_settings);
                        }
                        else{
                            var new_hor_axis_settings = new asc_ValAxisSettings();
                            new_hor_axis_settings.setDefault();
                            this.putHorAxisProps(new_hor_axis_settings);
                        }
                    }
                }
                else{
                    var new_hor_axis_settings = new asc_ValAxisSettings();
                    new_hor_axis_settings.setDefault();
                    this.putHorAxisProps(new_hor_axis_settings);
                }

                if(vert_axis_settings){
                    if(vert_axis_settings.getAxisType() !== c_oAscAxisType.cat){
                        if(hor_axis_settings && hor_axis_settings.getAxisType() === c_oAscAxisType.cat){
                            this.putVertAxisProps(hor_axis_settings);
                        }
                        else{
                            var new_vert_axis_settings = new asc_CatAxisSettings();
                            new_vert_axis_settings.setDefault();
                            this.putVertAxisProps(new_vert_axis_settings);
                        }
                    }
                }
                else{
                    var new_vert_axis_settings = new asc_CatAxisSettings();
                    new_vert_axis_settings.setDefault();
                    this.putVertAxisProps(new_vert_axis_settings);
                }
			}
		},

		changeType: function (type) {
			if(null === this.type){
				this.putType(type);
				return;
			}
			if (this.type === type) {
				return;
			}

			var bSwapGridLines = ((this.type === c_oAscChartTypeSettings.hBarNormal ||
			this.type === c_oAscChartTypeSettings.hBarStacked || this.type === c_oAscChartTypeSettings.hBarStackedPer
			|| this.type === c_oAscChartTypeSettings.hBarNormal3d || this.type === c_oAscChartTypeSettings.hBarStacked3d
			|| this.type === c_oAscChartTypeSettings.hBarStackedPer3d) !==
			(type === c_oAscChartTypeSettings.hBarNormal || type === c_oAscChartTypeSettings.hBarStacked ||
			type === c_oAscChartTypeSettings.hBarStackedPer || this.type === c_oAscChartTypeSettings.hBarNormal3d
			|| this.type === c_oAscChartTypeSettings.hBarStacked3d || this.type === c_oAscChartTypeSettings.hBarStackedPer3d)   );
			var bSwapLines = ((
				type === c_oAscChartTypeSettings.lineNormal || type === c_oAscChartTypeSettings.lineStacked ||
				type === c_oAscChartTypeSettings.lineStackedPer || type === c_oAscChartTypeSettings.lineNormalMarker ||
				type === c_oAscChartTypeSettings.lineStackedMarker || type === c_oAscChartTypeSettings.lineStackedPerMarker || type === c_oAscChartTypeSettings.line3d

			) !== (

				this.type === c_oAscChartTypeSettings.lineNormal || this.type === c_oAscChartTypeSettings.lineStacked ||
				this.type === c_oAscChartTypeSettings.lineStackedPer ||
				this.type === c_oAscChartTypeSettings.lineNormalMarker ||
				this.type === c_oAscChartTypeSettings.lineStackedMarker ||
				this.type === c_oAscChartTypeSettings.lineStackedPerMarker ||
				this.type === c_oAscChartTypeSettings.line3d
			));
			var bSwapScatter = ((this.type === c_oAscChartTypeSettings.scatter) !==
			(type === c_oAscChartTypeSettings.scatter));


			var nOldType = this.type;
			this.putType(type);

			var hor_axis_settings = this.getHorAxisProps();
			var vert_axis_settings = this.getVertAxisProps();
			var new_hor_axis_settings, new_vert_axis_settings, oTempVal;
			if (bSwapGridLines) {
				oTempVal = hor_axis_settings;
				hor_axis_settings = vert_axis_settings;
				vert_axis_settings = oTempVal;
				this.putHorAxisProps(hor_axis_settings);
				this.putVertAxisProps(vert_axis_settings);

				oTempVal = this.horGridLines;
				this.putHorGridLines(this.vertGridLines);
				this.putVertGridLines(oTempVal);
			}
			switch (type) {
				case c_oAscChartTypeSettings.pie                 :
				case c_oAscChartTypeSettings.pie3d                 :
				case c_oAscChartTypeSettings.doughnut            : {
					this.putHorAxisProps(null);
					this.putVertAxisProps(null);
					this.putHorAxisLabel(null);
					this.putVertAxisLabel(null);
					this.putShowHorAxis(null);
					this.putShowVerAxis(null);
					break;
				}
				case c_oAscChartTypeSettings.barNormal           :
				case c_oAscChartTypeSettings.barStacked          :
				case c_oAscChartTypeSettings.barStackedPer       :
				case c_oAscChartTypeSettings.barNormal3d         :
				case c_oAscChartTypeSettings.barStacked3d        :
				case c_oAscChartTypeSettings.barStackedPer3d     :
				case c_oAscChartTypeSettings.barNormal3dPerspective     :
				case c_oAscChartTypeSettings.lineNormal          :
				case c_oAscChartTypeSettings.lineStacked         :
				case c_oAscChartTypeSettings.lineStackedPer      :
				case c_oAscChartTypeSettings.lineNormalMarker    :
				case c_oAscChartTypeSettings.lineStackedMarker   :
				case c_oAscChartTypeSettings.lineStackedPerMarker:
				case c_oAscChartTypeSettings.line3d:
				case c_oAscChartTypeSettings.areaNormal          :
				case c_oAscChartTypeSettings.areaStacked         :
				case c_oAscChartTypeSettings.areaStackedPer      :
				case c_oAscChartTypeSettings.stock               :
                case c_oAscChartTypeSettings.surfaceNormal       :
                case c_oAscChartTypeSettings.surfaceWireframe    :
                case c_oAscChartTypeSettings.contourNormal       :
                case c_oAscChartTypeSettings.contourWireframe    :
					{



                        this.checkSwapAxisProps(false);
					if (bSwapLines) {
						this.putShowMarker(false);
						this.putSmooth(null);
						this.putLine(true);
					}
					if (nOldType === c_oAscChartTypeSettings.hBarNormal || nOldType === c_oAscChartTypeSettings.hBarStacked ||
						nOldType === c_oAscChartTypeSettings.hBarStackedPer || nOldType === c_oAscChartTypeSettings.hBarNormal3d ||
						nOldType === c_oAscChartTypeSettings.hBarStacked3d || nOldType === c_oAscChartTypeSettings.hBarStackedPer3d) {
						var bTemp = this.showHorAxis;
						this.putShowHorAxis(this.showVerAxis);
						this.putShowVerAxis(bTemp);
					} else if (nOldType === c_oAscChartTypeSettings.pie || nOldType === c_oAscChartTypeSettings.pie3d || nOldType === c_oAscChartTypeSettings.doughnut) {
						this.putShowHorAxis(true);
						this.putShowVerAxis(true);
					}
					var oHorAxisProps = this.getHorAxisProps();
						if(oHorAxisProps && oHorAxisProps.getAxisType() === c_oAscAxisType.cat){
							if(type === c_oAscChartTypeSettings.areaNormal ||
							type === c_oAscChartTypeSettings.areaStacked ||
							type === c_oAscChartTypeSettings.areaStackedPer||
							type === c_oAscChartTypeSettings.stock ||
							type === c_oAscChartTypeSettings.surfaceNormal ||
							type === c_oAscChartTypeSettings.surfaceWireframe ||
							type === c_oAscChartTypeSettings.contourNormal ||
							type === c_oAscChartTypeSettings.contourWireframe){
								oHorAxisProps.putLabelsPosition(Asc.c_oAscLabelsPosition.byDivisions);
							}
							else{
								oHorAxisProps.putLabelsPosition(Asc.c_oAscLabelsPosition.betweenDivisions);
							}
						}
					break;
				}
				case c_oAscChartTypeSettings.hBarNormal          :
				case c_oAscChartTypeSettings.hBarStacked         :
				case c_oAscChartTypeSettings.hBarStackedPer      :
                case c_oAscChartTypeSettings.hBarNormal3d        :
                case c_oAscChartTypeSettings.hBarStacked3d       :
                case c_oAscChartTypeSettings.hBarStackedPer3d    :
					{
                        this.checkSwapAxisProps(true);
					if (nOldType === c_oAscChartTypeSettings.pie || nOldType === c_oAscChartTypeSettings.pie3d || nOldType === c_oAscChartTypeSettings.doughnut) {
						this.putShowHorAxis(true);
						this.putShowVerAxis(true);
					} else if (nOldType !== c_oAscChartTypeSettings.hBarNormal &&
						nOldType !== c_oAscChartTypeSettings.hBarStacked && nOldType !== c_oAscChartTypeSettings.hBarStackedPer || nOldType !== c_oAscChartTypeSettings.hBarNormal3d ||
                        nOldType !== c_oAscChartTypeSettings.hBarStacked3d || nOldType !== c_oAscChartTypeSettings.hBarStackedPer3d) {
						var bTemp = this.showHorAxis;
						this.putShowHorAxis(this.showVerAxis);
						this.putShowVerAxis(bTemp);
					}

					var oVertAxisProps = this.getVertAxisProps();
					if(oVertAxisProps && oVertAxisProps.getAxisType() === c_oAscAxisType.cat){
						oVertAxisProps.putLabelsPosition(Asc.c_oAscLabelsPosition.betweenDivisions);
					}
					//this.putHorGridLines(c_oAscGridLinesSettings.none);
					//this.putVertGridLines(c_oAscGridLinesSettings.major);
					break;
				}
				case c_oAscChartTypeSettings.scatter             :
				case c_oAscChartTypeSettings.scatterLine         :
				case c_oAscChartTypeSettings.scatterLineMarker   :
				case c_oAscChartTypeSettings.scatterMarker       :
				case c_oAscChartTypeSettings.scatterNone         :
				case c_oAscChartTypeSettings.scatterSmooth       :
				case c_oAscChartTypeSettings.scatterSmoothMarker : {
					if (!hor_axis_settings || hor_axis_settings.getAxisType() !== c_oAscAxisType.val) {
						new_hor_axis_settings = new asc_ValAxisSettings();
						new_hor_axis_settings.setDefault();
						this.putHorAxisProps(new_hor_axis_settings);
					}
					if (!vert_axis_settings || vert_axis_settings.getAxisType() !== c_oAscAxisType.val) {
						new_vert_axis_settings = new asc_ValAxisSettings();
						new_vert_axis_settings.setDefault();
						this.putVertAxisProps(new_vert_axis_settings);
					}
					//this.putHorGridLines(c_oAscGridLinesSettings.major);
					//this.putVertGridLines(c_oAscGridLinesSettings.major);
					if (bSwapScatter) {
						this.putShowMarker(true);
						this.putSmooth(null);
						this.putLine(false);
					}
					if (nOldType === c_oAscChartTypeSettings.hBarNormal || nOldType === c_oAscChartTypeSettings.hBarStacked ||
						nOldType === c_oAscChartTypeSettings.hBarStackedPer || nOldType === c_oAscChartTypeSettings.hBarNormal3d ||
                        nOldType === c_oAscChartTypeSettings.hBarStacked3d || nOldType === c_oAscChartTypeSettings.hBarStackedPer3d) {
						var bTemp = this.showHorAxis;
						this.putShowHorAxis(this.showVerAxis);
						this.putShowVerAxis(bTemp);
					} else if (nOldType === c_oAscChartTypeSettings.pie || nOldType === c_oAscChartTypeSettings.pie3d || nOldType === c_oAscChartTypeSettings.doughnut) {
						this.putShowHorAxis(true);
						this.putShowVerAxis(true);
					}
					break;
				}
			}
		},

		putShowHorAxis: function (v) {
			this.showHorAxis = v;
		}, getShowHorAxis: function () {
			return this.showHorAxis;
		},

		putShowVerAxis: function (v) {
			this.showVerAxis = v;
		}, getShowVerAxis: function () {
			return this.showVerAxis;
		}
	};

	/** @constructor */
	function asc_CRect(x, y, width, height) {
		// private members
		this._x = x;
		this._y = y;
		this._width = width;
		this._height = height;
	}

	asc_CRect.prototype = {
		asc_getX: function () {
			return this._x;
		}, asc_getY: function () {
			return this._y;
		}, asc_getWidth: function () {
			return this._width;
		}, asc_getHeight: function () {
			return this._height;
		}
	};

	/**
	 * Класс CColor для работы с цветами
	 * -----------------------------------------------------------------------------
	 *
	 * @constructor
	 * @memberOf window
	 */

	function CColor(r, g, b, a) {
		this.r = (undefined == r) ? 0 : r;
		this.g = (undefined == g) ? 0 : g;
		this.b = (undefined == b) ? 0 : b;
		this.a = (undefined == a) ? 1 : a;
	}

	CColor.prototype = {
		constructor: CColor, getR: function () {
			return this.r
		}, get_r: function () {
			return this.r
		}, put_r: function (v) {
			this.r = v;
			this.hex = undefined;
		}, getG: function () {
			return this.g
		}, get_g: function () {
			return this.g;
		}, put_g: function (v) {
			this.g = v;
			this.hex = undefined;
		}, getB: function () {
			return this.b
		}, get_b: function () {
			return this.b;
		}, put_b: function (v) {
			this.b = v;
			this.hex = undefined;
		}, getA: function () {
			return this.a
		}, get_hex: function () {
			if (!this.hex) {
				var r = this.r.toString(16);
				var g = this.g.toString(16);
				var b = this.b.toString(16);
				this.hex = ( r.length == 1 ? "0" + r : r) + ( g.length == 1 ? "0" + g : g) + ( b.length == 1 ? "0" + b : b);
			}
			return this.hex;
		},

		Compare: function (Color) {
			return (this.r === Color.r && this.g === Color.g && this.b === Color.b && this.a === Color.a);
		}, Copy: function () {
			return new CColor(this.r, this.g, this.b, this.a);
		},

		getVal: function () {
			return (((this.r << 16) & 0xFF0000) + ((this.g << 8)&0xFF00)+this.b);
		}
	};

	/** @constructor */
	function asc_CColor() {
		this.type = c_oAscColor.COLOR_TYPE_SRGB;
		this.value = null;
		this.r = 0;
		this.g = 0;
		this.b = 0;
		this.a = 255;

		this.Auto = false;

		this.Mods = [];
		this.ColorSchemeId = -1;

		if (1 === arguments.length) {
			this.r = arguments[0].r;
			this.g = arguments[0].g;
			this.b = arguments[0].b;
		} else {
			if (3 <= arguments.length) {
				this.r = arguments[0];
				this.g = arguments[1];
				this.b = arguments[2];
			}
        if (4 === arguments.length) {
            this.a = arguments[3];
        }
		}
	}

	asc_CColor.prototype = {
		constructor: asc_CColor, asc_getR: function () {
			return this.r
		}, asc_putR: function (v) {
			this.r = v;
			this.hex = undefined;
		}, asc_getG: function () {
			return this.g;
		}, asc_putG: function (v) {
			this.g = v;
			this.hex = undefined;
		}, asc_getB: function () {
			return this.b;
		}, asc_putB: function (v) {
			this.b = v;
			this.hex = undefined;
		}, asc_getA: function () {
			return this.a;
		}, asc_putA: function (v) {
			this.a = v;
			this.hex = undefined;
		}, asc_getType: function () {
			return this.type;
		}, asc_putType: function (v) {
			this.type = v;
		}, asc_getValue: function () {
			return this.value;
		}, asc_putValue: function (v) {
			this.value = v;
		}, asc_getHex: function () {
			if (!this.hex) {
				var a = this.a.toString(16);
				var r = this.r.toString(16);
				var g = this.g.toString(16);
				var b = this.b.toString(16);
				this.hex = ( a.length == 1 ? "0" + a : a) + ( r.length == 1 ? "0" + r : r) + ( g.length == 1 ? "0" + g : g) +
					( b.length == 1 ? "0" + b : b);
			}
			return this.hex;
		}, asc_getColor: function () {
			return new CColor(this.r, this.g, this.b);
		}, asc_putAuto: function (v) {
			this.Auto = v;
		}, asc_getAuto: function () {
			return this.Auto;
		}
	};

	/** @constructor */
	function asc_CTextBorder(obj) {
		if (obj) {
			if (obj.Color instanceof asc_CColor) {
				this.Color = obj.Color;
			} else {
				this.Color =
					(undefined != obj.Color && null != obj.Color) ? CreateAscColorCustom(obj.Color.r, obj.Color.g, obj.Color.b) :
						null;
			}
			this.Size = (undefined != obj.Size) ? obj.Size : null;
			this.Value = (undefined != obj.Value) ? obj.Value : null;
			this.Space = (undefined != obj.Space) ? obj.Space : null;
		} else {
			this.Color = CreateAscColorCustom(0, 0, 0);
			this.Size = 0.5 * window["AscCommonWord"].g_dKoef_pt_to_mm;
			this.Value = window["AscCommonWord"].border_Single;
			this.Space = 0;
		}
	}

	asc_CTextBorder.prototype.asc_getColor = function () {
		return this.Color;
	};
	asc_CTextBorder.prototype.asc_putColor = function (v) {
		this.Color = v;
	};
	asc_CTextBorder.prototype.asc_getSize = function () {
		return this.Size;
	};
	asc_CTextBorder.prototype.asc_putSize = function (v) {
		this.Size = v;
	};
	asc_CTextBorder.prototype.asc_getValue = function () {
		return this.Value;
	};
	asc_CTextBorder.prototype.asc_putValue = function (v) {
		this.Value = v;
	};
	asc_CTextBorder.prototype.asc_getSpace = function () {
		return this.Space;
	};
	asc_CTextBorder.prototype.asc_putSpace = function (v) {
		this.Space = v;
	};
	asc_CTextBorder.prototype.asc_getForSelectedCells = function () {
		return this.ForSelectedCells;
	};
	asc_CTextBorder.prototype.asc_putForSelectedCells = function (v) {
		this.ForSelectedCells = v;
	};

	/** @constructor */
	function asc_CParagraphBorders(obj) {

		if (obj) {
			this.Left = (undefined != obj.Left && null != obj.Left) ? new asc_CTextBorder(obj.Left) : null;
			this.Top = (undefined != obj.Top && null != obj.Top) ? new asc_CTextBorder(obj.Top) : null;
			this.Right = (undefined != obj.Right && null != obj.Right) ? new asc_CTextBorder(obj.Right) : null;
			this.Bottom = (undefined != obj.Bottom && null != obj.Bottom) ? new asc_CTextBorder(obj.Bottom) : null;
			this.Between = (undefined != obj.Between && null != obj.Between) ? new asc_CTextBorder(obj.Between) : null;
		} else {
			this.Left = null;
			this.Top = null;
			this.Right = null;
			this.Bottom = null;
			this.Between = null;
		}
	}

	asc_CParagraphBorders.prototype = {
		asc_getLeft: function () {
			return this.Left;
		}, asc_putLeft: function (v) {
			this.Left = (v) ? new asc_CTextBorder(v) : null;
		}, asc_getTop: function () {
			return this.Top;
		}, asc_putTop: function (v) {
			this.Top = (v) ? new asc_CTextBorder(v) : null;
		}, asc_getRight: function () {
			return this.Right;
		}, asc_putRight: function (v) {
			this.Right = (v) ? new asc_CTextBorder(v) : null;
		}, asc_getBottom: function () {
			return this.Bottom;
		}, asc_putBottom: function (v) {
			this.Bottom = (v) ? new asc_CTextBorder(v) : null;
		}, asc_getBetween: function () {
			return this.Between;
		}, asc_putBetween: function (v) {
			this.Between = (v) ? new asc_CTextBorder(v) : null;
		}
	};

	/** @constructor */
	function asc_CListType(obj) {

		if (obj) {
			this.Type = (undefined == obj.Type) ? null : obj.Type;
			this.SubType = (undefined == obj.Type) ? null : obj.SubType;
		} else {
			this.Type = null;
			this.SubType = null;
		}
	}

	asc_CListType.prototype.asc_getListType = function () {
		return this.Type;
	};
	asc_CListType.prototype.asc_getListSubType = function () {
		return this.SubType;
	};

	/** @constructor */
	function asc_CTextFontFamily(obj) {

		if (obj) {
			this.Name = (undefined != obj.Name) ? obj.Name : null; 		// "Times New Roman"
			this.Index = (undefined != obj.Index) ? obj.Index : null;	// -1
		} else {
			this.Name = "Times New Roman";
			this.Index = -1;
		}
	}

	asc_CTextFontFamily.prototype = {
		asc_getName: function () {
			return this.Name;
		}, asc_getIndex: function () {
			return this.Index;
		},
		asc_putName: function (v) {
			this.Name = v;
		}, asc_putIndex: function (v) {
			this.Index = v;
		}
	};

	/** @constructor */
	function asc_CParagraphTab(Pos, Value, Leader)
	{
		this.Pos    = Pos;
		this.Value  = Value;
		this.Leader = Leader;
	}
	asc_CParagraphTab.prototype.asc_getValue = function()
	{
		return this.Value;
	};
	asc_CParagraphTab.prototype.asc_putValue = function(v)
	{
		this.Value = v;
	};
	asc_CParagraphTab.prototype.asc_getPos = function()
	{
		return this.Pos;
	};
	asc_CParagraphTab.prototype.asc_putPos = function(v)
	{
		this.Pos = v;
	};
	asc_CParagraphTab.prototype.asc_getLeader = function()
	{
		if (Asc.c_oAscTabLeader.Heavy === this.Leader)
			return Asc.c_oAscTabLeader.Underscore;

		return this.Leader;
	};
	asc_CParagraphTab.prototype.asc_putLeader = function(v)
	{
		this.Leader = v;
	};

	/** @constructor */
	function asc_CParagraphTabs(obj) {
		this.Tabs = [];

		if (undefined != obj) {
			var Count = obj.Tabs.length;
			for (var Index = 0; Index < Count; Index++) {
				this.Tabs.push(new asc_CParagraphTab(obj.Tabs[Index].Pos, obj.Tabs[Index].Value, obj.Tabs[Index].Leader));
			}
		}
	}

	asc_CParagraphTabs.prototype = {
		asc_getCount: function () {
			return this.Tabs.length;
		}, asc_getTab: function (Index) {
			return this.Tabs[Index];
		}, asc_addTab: function (Tab) {
			this.Tabs.push(Tab)
		}, asc_clear: function () {
			this.Tabs.length = 0;
		}
	};

	/** @constructor */
	function asc_CParagraphShd(obj) {

		if (obj) {
			this.Value = (undefined != obj.Value) ? obj.Value : null;
			if (obj.Unifill && obj.Unifill.fill && obj.Unifill.fill.type === c_oAscFill.FILL_TYPE_SOLID &&
				obj.Unifill.fill.color) {
				this.Color = CreateAscColor(obj.Unifill.fill.color);
			} else {
				this.Color =
					(undefined != obj.Color && null != obj.Color) ? CreateAscColorCustom(obj.Color.r, obj.Color.g, obj.Color.b) :
						null;
			}
		} else {
			this.Value = Asc.c_oAscShdNil;
			this.Color = CreateAscColorCustom(255, 255, 255);
		}
	}

	asc_CParagraphShd.prototype = {
		asc_getValue: function () {
			return this.Value;
		}, asc_putValue: function (v) {
			this.Value = v;
		}, asc_getColor: function () {
			return this.Color;
		}, asc_putColor: function (v) {
			this.Color = (v) ? v : null;
		}
	};

	/** @constructor */
	function asc_CParagraphFrame(obj) {
		if (obj) {
			this.FromDropCapMenu = false;

			this.DropCap = obj.DropCap;
			this.H = obj.H;
			this.HAnchor = obj.HAnchor;
			this.HRule = obj.HRule;
			this.HSpace = obj.HSpace;
			this.Lines = obj.Lines;
			this.VAnchor = obj.VAnchor;
			this.VSpace = obj.VSpace;
			this.W = obj.W;
			this.Wrap = obj.Wrap;
			this.X = obj.X;
			this.XAlign = obj.XAlign;
			this.Y = obj.Y;
			this.YAlign = obj.YAlign;
			this.Brd = (undefined != obj.Brd && null != obj.Brd) ? new asc_CParagraphBorders(obj.Brd) : null;
			this.Shd = (undefined != obj.Shd && null != obj.Shd) ? new asc_CParagraphShd(obj.Shd) : null;
			this.FontFamily =
				(undefined != obj.FontFamily && null != obj.FontFamily) ? new asc_CTextFontFamily(obj.FontFamily) : null;
		} else {
			this.FromDropCapMenu = false;

			this.DropCap = undefined;
			this.H = undefined;
			this.HAnchor = undefined;
			this.HRule = undefined;
			this.HSpace = undefined;
			this.Lines = undefined;
			this.VAnchor = undefined;
			this.VSpace = undefined;
			this.W = undefined;
			this.Wrap = undefined;
			this.X = undefined;
			this.XAlign = undefined;
			this.Y = undefined;
			this.YAlign = undefined;
			this.Shd = null;
			this.Brd = null;
			this.FontFamily = null;
		}
	}

	asc_CParagraphFrame.prototype.asc_getDropCap = function () {
		return this.DropCap;
	};
	asc_CParagraphFrame.prototype.asc_putDropCap = function (v) {
		this.DropCap = v;
	};
	asc_CParagraphFrame.prototype.asc_getH = function () {
		return this.H;
	};
	asc_CParagraphFrame.prototype.asc_putH = function (v) {
		this.H = v;
	};
	asc_CParagraphFrame.prototype.asc_getHAnchor = function () {
		return this.HAnchor;
	};
	asc_CParagraphFrame.prototype.asc_putHAnchor = function (v) {
		this.HAnchor = v;
	};
	asc_CParagraphFrame.prototype.asc_getHRule = function () {
		return this.HRule;
	};
	asc_CParagraphFrame.prototype.asc_putHRule = function (v) {
		this.HRule = v;
	};
	asc_CParagraphFrame.prototype.asc_getHSpace = function () {
		return this.HSpace;
	};
	asc_CParagraphFrame.prototype.asc_putHSpace = function (v) {
		this.HSpace = v;
	};
	asc_CParagraphFrame.prototype.asc_getLines = function () {
		return this.Lines;
	};
	asc_CParagraphFrame.prototype.asc_putLines = function (v) {
		this.Lines = v;
	};
	asc_CParagraphFrame.prototype.asc_getVAnchor = function () {
		return this.VAnchor;
	};
	asc_CParagraphFrame.prototype.asc_putVAnchor = function (v) {
		this.VAnchor = v;
	};
	asc_CParagraphFrame.prototype.asc_getVSpace = function () {
		return this.VSpace;
	};
	asc_CParagraphFrame.prototype.asc_putVSpace = function (v) {
		this.VSpace = v;
	};
	asc_CParagraphFrame.prototype.asc_getW = function () {
		return this.W;
	};
	asc_CParagraphFrame.prototype.asc_putW = function (v) {
		this.W = v;
	};
	asc_CParagraphFrame.prototype.asc_getWrap = function () {
		return this.Wrap;
	};
	asc_CParagraphFrame.prototype.asc_putWrap = function (v) {
		this.Wrap = v;
	};
	asc_CParagraphFrame.prototype.asc_getX = function () {
		return this.X;
	};
	asc_CParagraphFrame.prototype.asc_putX = function (v) {
		this.X = v;
	};
	asc_CParagraphFrame.prototype.asc_getXAlign = function () {
		return this.XAlign;
	};
	asc_CParagraphFrame.prototype.asc_putXAlign = function (v) {
		this.XAlign = v;
	};
	asc_CParagraphFrame.prototype.asc_getY = function () {
		return this.Y;
	};
	asc_CParagraphFrame.prototype.asc_putY = function (v) {
		this.Y = v;
	};
	asc_CParagraphFrame.prototype.asc_getYAlign = function () {
		return this.YAlign;
	};
	asc_CParagraphFrame.prototype.asc_putYAlign = function (v) {
		this.YAlign = v;
	};
	asc_CParagraphFrame.prototype.asc_getBorders = function () {
		return this.Brd;
	};
	asc_CParagraphFrame.prototype.asc_putBorders = function (v) {
		this.Brd = v;
	};
	asc_CParagraphFrame.prototype.asc_getShade = function () {
		return this.Shd;
	};
	asc_CParagraphFrame.prototype.asc_putShade = function (v) {
		this.Shd = v;
	};
	asc_CParagraphFrame.prototype.asc_getFontFamily = function () {
		return this.FontFamily;
	};
	asc_CParagraphFrame.prototype.asc_putFontFamily = function (v) {
		this.FontFamily = v;
	};
	asc_CParagraphFrame.prototype.asc_putFromDropCapMenu = function (v) {
		this.FromDropCapMenu = v;
	};

	/** @constructor */
	function asc_CParagraphSpacing(obj) {

		if (obj) {
			this.Line = (undefined != obj.Line    ) ? obj.Line : null; // Расстояние между строками внутри абзаца
			this.LineRule = (undefined != obj.LineRule) ? obj.LineRule : null; // Тип расстрояния между строками
			this.Before = (undefined != obj.Before  ) ? obj.Before : null; // Дополнительное расстояние до абзаца
			this.After = (undefined != obj.After   ) ? obj.After : null; // Дополнительное расстояние после абзаца
		} else {
			this.Line = undefined; // Расстояние между строками внутри абзаца
			this.LineRule = undefined; // Тип расстрояния между строками
			this.Before = undefined; // Дополнительное расстояние до абзаца
			this.After = undefined; // Дополнительное расстояние после абзаца
		}
	}

	asc_CParagraphSpacing.prototype = {
		asc_getLine: function () {
			return this.Line;
		}, asc_getLineRule: function () {
			return this.LineRule;
		}, asc_getBefore: function () {
			return this.Before;
		}, asc_getAfter: function () {
			return this.After;
		},
		asc_putLine: function(v) {
			this.Line = v;
		},
		asc_putLineRule: function(v){
			this.LineRule = v;
		},
		asc_putBefore: function(v){
			this.Before = v;
		},
		asc_putAfter: function(v){
			this.After = v;
		}
	};

	/** @constructor */
	function asc_CParagraphInd(obj) {
		if (obj) {
			this.Left = (undefined != obj.Left     ) ? obj.Left : null; // Левый отступ
			this.Right = (undefined != obj.Right    ) ? obj.Right : null; // Правый отступ
			this.FirstLine = (undefined != obj.FirstLine) ? obj.FirstLine : null; // Первая строка
		} else {
			this.Left = undefined; // Левый отступ
			this.Right = undefined; // Правый отступ
			this.FirstLine = undefined; // Первая строка
		}
	}

	asc_CParagraphInd.prototype = {
		asc_getLeft: function () {
			return this.Left;
		}, asc_putLeft: function (v) {
			this.Left = v;
		}, asc_getRight: function () {
			return this.Right;
		}, asc_putRight: function (v) {
			this.Right = v;
		}, asc_getFirstLine: function () {
			return this.FirstLine;
		}, asc_putFirstLine: function (v) {
			this.FirstLine = v;
		}
	};

	/** @constructor */
	function asc_CParagraphProperty(obj) {

		if (obj) {
			this.ContextualSpacing = (undefined != obj.ContextualSpacing) ? obj.ContextualSpacing : null;
			this.Ind = (undefined != obj.Ind && null != obj.Ind) ? new asc_CParagraphInd(obj.Ind) : null;
			this.KeepLines = (undefined != obj.KeepLines) ? obj.KeepLines : null;
			this.KeepNext = (undefined != obj.KeepNext) ? obj.KeepNext : undefined;
			this.WidowControl = (undefined != obj.WidowControl ? obj.WidowControl : undefined );
			this.PageBreakBefore = (undefined != obj.PageBreakBefore) ? obj.PageBreakBefore : null;
			this.Spacing = (undefined != obj.Spacing && null != obj.Spacing) ? new asc_CParagraphSpacing(obj.Spacing) : null;
			this.Brd = (undefined != obj.Brd && null != obj.Brd) ? new asc_CParagraphBorders(obj.Brd) : null;
			this.Shd = (undefined != obj.Shd && null != obj.Shd) ? new asc_CParagraphShd(obj.Shd) : null;
			this.Tabs = (undefined != obj.Tabs) ? new asc_CParagraphTabs(obj.Tabs) : undefined;
			this.DefaultTab = obj.DefaultTab != null ? obj.DefaultTab : window["AscCommonWord"].Default_Tab_Stop;
			this.Locked = (undefined != obj.Locked && null != obj.Locked ) ? obj.Locked : false;
			this.CanAddTable = (undefined != obj.CanAddTable ) ? obj.CanAddTable : true;

			this.FramePr = (undefined != obj.FramePr ) ? new asc_CParagraphFrame(obj.FramePr) : undefined;
			this.CanAddDropCap = (undefined != obj.CanAddDropCap ) ? obj.CanAddDropCap : false;
			this.CanAddImage = (undefined != obj.CanAddImage ) ? obj.CanAddImage : false;

			this.Subscript = (undefined != obj.Subscript) ? obj.Subscript : undefined;
			this.Superscript = (undefined != obj.Superscript) ? obj.Superscript : undefined;
			this.SmallCaps = (undefined != obj.SmallCaps) ? obj.SmallCaps : undefined;
			this.AllCaps = (undefined != obj.AllCaps) ? obj.AllCaps : undefined;
			this.Strikeout = (undefined != obj.Strikeout) ? obj.Strikeout : undefined;
			this.DStrikeout = (undefined != obj.DStrikeout) ? obj.DStrikeout : undefined;
			this.TextSpacing = (undefined != obj.TextSpacing) ? obj.TextSpacing : undefined;
			this.Position = (undefined != obj.Position) ? obj.Position : undefined;
			this.Jc = (undefined != obj.Jc) ? obj.Jc : undefined;
			this.ListType = (undefined != obj.ListType) ? obj.ListType : undefined;
			this.OutlineLvl = (undefined != obj.OutlineLvl) ? obj.OutlineLvl : undefined;
			this.OutlineLvlStyle = (undefined != obj.OutlineLvlStyle) ? obj.OutlineLvlStyle : false;
			this.BulletSize = undefined;
			this.BulletColor = undefined;
			this.NumStartAt = undefined;
			this.BulletFont = undefined;
			this.BulletSymbol = undefined;
			var oBullet = obj.Bullet;
			if(oBullet)
			{
				var FirstTextPr = obj.FirstTextPr;
				this.BulletSize = 100;
				if(oBullet.bulletSize)
				{
					switch (oBullet.bulletSize.type)
					{
						case AscFormat.BULLET_TYPE_SIZE_NONE:
						{
							break;
						}
						case AscFormat.BULLET_TYPE_SIZE_TX:
						{
							break;
						}
						case AscFormat.BULLET_TYPE_SIZE_PCT:
						{
							this.BulletSize = oBullet.bulletSize.val / 1000.0;
							break;
						}
						case AscFormat.BULLET_TYPE_SIZE_PTS:
						{
							break;
						}
					}
				}
				this.BulletColor = CreateAscColorCustom(0, 0, 0);
				if(oBullet.bulletColor)
				{
					if(oBullet.bulletColor.UniColor)
					{
						this.BulletColor = CreateAscColor(oBullet.bulletColor.UniColor);
					}
				}
				else 
				{
					if(FirstTextPr && FirstTextPr.Unifill)
					{
						if(FirstTextPr.Unifill.fill instanceof AscFormat.CSolidFill && FirstTextPr.Unifill.fill.color)
						{
							this.BulletColor = CreateAscColor(FirstTextPr.Unifill.fill.color);
						}
						else
						{
							var RGBA = FirstTextPr.Unifill.getRGBAColor();
							this.BulletColor = CreateAscColorCustom(RGBA.R, RGBA.G, RGBA.B);
						}
					}
					else
					{
						this.BulletColor = CreateAscColorCustom(0, 0, 0);
					}
				}

				this.BulletFont = "";
				if(oBullet.bulletTypeface
					&& oBullet.bulletTypeface.type === AscFormat.BULLET_TYPE_TYPEFACE_BUFONT
					&& typeof oBullet.bulletTypeface.typeface === "string"
					&& oBullet.bulletTypeface.typeface.length > 0)
				{
					this.BulletFont = oBullet.bulletTypeface.typeface;
				}
				else
				{
					if(FirstTextPr && FirstTextPr.FontFamily && typeof FirstTextPr.FontFamily.Name === "string"
						&& FirstTextPr.FontFamily.Name.length > 0)
					{
						this.BulletFont = FirstTextPr.FontFamily.Name;
					}
				}


				if(oBullet.bulletType)
				{
					if(oBullet.bulletType.AutoNumType > 0)
					{
						this.NumStartAt = AscFormat.isRealNumber(oBullet.bulletType.startAt) ? Math.max(1, oBullet.bulletType.startAt) : null;
					}
					else
					{
						if(oBullet.bulletType.type === AscFormat.BULLET_TYPE_BULLET_CHAR)
						{
							this.BulletSymbol = oBullet.bulletType.Char;
						}
					}
				}
			}

			this.CanDeleteBlockCC  = undefined !== obj.CanDeleteBlockCC ? obj.CanDeleteBlockCC : true;
			this.CanEditBlockCC    = undefined !== obj.CanEditBlockCC ? obj.CanEditBlockCC : true;
			this.CanDeleteInlineCC = undefined !== obj.CanDeleteInlineCC ? obj.CanDeleteInlineCC : true;
			this.CanEditInlineCC   = undefined !== obj.CanEditInlineCC ? obj.CanEditInlineCC : true;

		} else {
			//ContextualSpacing : false,            // Удалять ли интервал между параграфами одинакового стиля
			//
			//    Ind :
			//    {
			//        Left      : 0,                    // Левый отступ
			//        Right     : 0,                    // Правый отступ
			//        FirstLine : 0                     // Первая строка
			//    },
			//
			//    Jc : align_Left,                      // Прилегание параграфа
			//
			//    KeepLines : false,                    // переносить параграф на новую страницу,
			//                                          // если на текущей он целиком не убирается
			//    KeepNext  : false,                    // переносить параграф вместе со следующим параграфом
			//
			//    PageBreakBefore : false,              // начинать параграф с новой страницы

			this.ContextualSpacing = undefined;
			this.Ind = new asc_CParagraphInd();
			this.KeepLines = undefined;
			this.KeepNext = undefined;
			this.WidowControl = undefined;
			this.PageBreakBefore = undefined;
			this.Spacing = new asc_CParagraphSpacing();
			this.Brd = undefined;
			this.Shd = undefined;
			this.Locked = false;
			this.CanAddTable = true;
			this.Tabs = undefined;

			this.Subscript = undefined;
			this.Superscript = undefined;
			this.SmallCaps = undefined;
			this.AllCaps = undefined;
			this.Strikeout = undefined;
			this.DStrikeout = undefined;
			this.TextSpacing = undefined;
			this.Position = undefined;
			this.Jc = undefined;
			this.ListType = undefined;
			this.OutlineLvl = undefined;
			this.OutlineLvlStyle = false;
			this.BulletSize = undefined;
			this.BulletColor = undefined;
			this.NumStartAt = undefined;
			this.BulletFont = undefined;
			this.BulletSymbol = undefined;

			this.CanDeleteBlockCC  = true;
			this.CanEditBlockCC    = true;
			this.CanDeleteInlineCC = true;
			this.CanEditInlineCC   = true;
		}
	}

	asc_CParagraphProperty.prototype = {

		asc_getContextualSpacing: function () {
			return this.ContextualSpacing;
		}, asc_putContextualSpacing: function (v) {
			this.ContextualSpacing = v;
		}, asc_getInd: function () {
			return this.Ind;
		}, asc_putInd: function (v) {
			this.Ind = v;
		}, asc_getJc: function () {
			return this.Jc;
		}, asc_putJc: function (v) {
			this.Jc = v;
		}, asc_getKeepLines: function () {
			return this.KeepLines;
		}, asc_putKeepLines: function (v) {
			this.KeepLines = v;
		}, asc_getKeepNext: function () {
			return this.KeepNext;
		}, asc_putKeepNext: function (v) {
			this.KeepNext = v;
		}, asc_getPageBreakBefore: function () {
			return this.PageBreakBefore;
		}, asc_putPageBreakBefore: function (v) {
			this.PageBreakBefore = v;
		}, asc_getWidowControl: function () {
			return this.WidowControl;
		}, asc_putWidowControl: function (v) {
			this.WidowControl = v;
		}, asc_getSpacing: function () {
			return this.Spacing;
		}, asc_putSpacing: function (v) {
			this.Spacing = v;
		}, asc_getBorders: function () {
			return this.Brd;
		}, asc_putBorders: function (v) {
			this.Brd = v;
		}, asc_getShade: function () {
			return this.Shd;
		}, asc_putShade: function (v) {
			this.Shd = v;
		}, asc_getLocked: function () {
			return this.Locked;
		}, asc_getCanAddTable: function () {
			return this.CanAddTable;
		}, asc_getSubscript: function () {
			return this.Subscript;
		}, asc_putSubscript: function (v) {
			this.Subscript = v;
		}, asc_getSuperscript: function () {
			return this.Superscript;
		}, asc_putSuperscript: function (v) {
			this.Superscript = v;
		}, asc_getSmallCaps: function () {
			return this.SmallCaps;
		}, asc_putSmallCaps: function (v) {
			this.SmallCaps = v;
		}, asc_getAllCaps: function () {
			return this.AllCaps;
		}, asc_putAllCaps: function (v) {
			this.AllCaps = v;
		}, asc_getStrikeout: function () {
			return this.Strikeout;
		}, asc_putStrikeout: function (v) {
			this.Strikeout = v;
		}, asc_getDStrikeout: function () {
			return this.DStrikeout;
		}, asc_putDStrikeout: function (v) {
			this.DStrikeout = v;
		}, asc_getTextSpacing: function () {
			return this.TextSpacing;
		}, asc_putTextSpacing: function (v) {
			this.TextSpacing = v;
		}, asc_getPosition: function () {
			return this.Position;
		}, asc_putPosition: function (v) {
			this.Position = v;
		}, asc_getTabs: function () {
			return this.Tabs;
		}, asc_putTabs: function (v) {
			this.Tabs = v;
		}, asc_getDefaultTab: function () {
			return this.DefaultTab;
		}, asc_putDefaultTab: function (v) {
			this.DefaultTab = v;
		},

		asc_getFramePr: function () {
			return this.FramePr;
		}, asc_putFramePr: function (v) {
			this.FramePr = v;
		}, asc_getCanAddDropCap: function () {
			return this.CanAddDropCap;
		}, asc_getCanAddImage: function () {
			return this.CanAddImage;
		}, asc_getOutlineLvl: function() {
			return this.OutlineLvl;
		}, asc_putOutLineLvl: function(nLvl) {
			this.OutlineLvl = nLvl;
		}, asc_getOutlineLvlStyle: function() {
			return this.OutlineLvlStyle;
		}, asc_putBulletSize: function(size) {
			this.BulletSize = size;
		}, asc_getBulletSize: function() {
			return this.BulletSize;
		}, asc_putBulletColor: function(color) {
			this.BulletColor = color;
		}, asc_getBulletColor: function() {
			return this.BulletColor;
		}, asc_putNumStartAt: function(NumStartAt) {
			this.NumStartAt = NumStartAt;
		}, asc_getNumStartAt: function() {
			return this.NumStartAt;
		},

		asc_getBulletFont: function() {
			return this.BulletFont;
		},
		asc_putBulletFont: function(v) {
			this.BulletFont = v;
		},

		asc_getBulletSymbol: function() {
			return this.BulletSymbol;
		},
		asc_putBulletSymbol: function(v) {
			this.BulletSymbol = v;
		},
		asc_canDeleteBlockContentControl: function() {
			return this.CanDeleteBlockCC;
		},
		asc_canEditBlockContentControl: function() {
			return this.CanEditBlockCC;
		},
		asc_canDeleteInlineContentControl: function() {
			return this.CanDeleteInlineCC;
		},
		asc_canEditInlineContentControl: function() {
			return this.CanEditInlineCC;
		}
	};

	/** @constructor */
	function asc_CTexture() {
		this.Id = 0;
		this.Image = "";
	}

	asc_CTexture.prototype = {
		asc_getId: function () {
			return this.Id;
		}, asc_getImage: function () {
			return this.Image;
		}
	};

	/** @constructor */
	function asc_CImageSize(width, height, isCorrect) {
		this.Width = (undefined == width) ? 0.0 : width;
		this.Height = (undefined == height) ? 0.0 : height;
		this.IsCorrect = isCorrect;
	}

	asc_CImageSize.prototype = {
		asc_getImageWidth: function () {
			return this.Width;
		}, asc_getImageHeight: function () {
			return this.Height;
		}, asc_getIsCorrect: function () {
			return this.IsCorrect;
		}
	};

	/** @constructor */
	function asc_CPaddings(obj) {

		if (obj) {
			this.Left = (undefined == obj.Left) ? null : obj.Left;
			this.Top = (undefined == obj.Top) ? null : obj.Top;
			this.Bottom = (undefined == obj.Bottom) ? null : obj.Bottom;
			this.Right = (undefined == obj.Right) ? null : obj.Right;
		} else {
			this.Left = null;
			this.Top = null;
			this.Bottom = null;
			this.Right = null;
		}
	}

	asc_CPaddings.prototype = {
		asc_getLeft: function () {
			return this.Left;
		}, asc_putLeft: function (v) {
			this.Left = v;
		}, asc_getTop: function () {
			return this.Top;
		}, asc_putTop: function (v) {
			this.Top = v;
		}, asc_getBottom: function () {
			return this.Bottom;
		}, asc_putBottom: function (v) {
			this.Bottom = v;
		}, asc_getRight: function () {
			return this.Right;
		}, asc_putRight: function (v) {
			this.Right = v;
		}
	};

	/** @constructor */
	function asc_CShapeProperty() {
		this.type = null; // custom
		this.fill = null;
		this.stroke = null;
		this.paddings = null;
		this.canFill = true;
		this.canChangeArrows = false;
		this.bFromChart = false;
		this.bFromImage = false;
		this.Locked = false;
		this.w = null;
		this.h = null;
		this.vert = null;
		this.verticalTextAlign = null;
		this.textArtProperties = null;
		this.lockAspect = null;
		this.title = null;
		this.description = null;

        this.columnNumber = null;
        this.columnSpace = null;
        this.signatureId = null;

		this.rot = null;
		this.rotAdd = null;
		this.flipH = null;
		this.flipV = null;
		this.flipHInvert = null;
		this.flipVInvert = null;
		this.shadow = undefined;
		this.anchor = null;
	}

	asc_CShapeProperty.prototype = {
		constructor: asc_CShapeProperty,
		asc_getType: function () {
			return this.type;
		}, asc_putType: function (v) {
			this.type = v;
		}, asc_getFill: function () {
			return this.fill;
		}, asc_putFill: function (v) {
			this.fill = v;
		}, asc_getStroke: function () {
			return this.stroke;
		}, asc_putStroke: function (v) {
			this.stroke = v;
		}, asc_getPaddings: function () {
			return this.paddings;
		}, asc_putPaddings: function (v) {
			this.paddings = v;
		}, asc_getCanFill: function () {
			return this.canFill;
		}, asc_putCanFill: function (v) {
			this.canFill = v;
		}, asc_getCanChangeArrows: function () {
			return this.canChangeArrows;
		}, asc_setCanChangeArrows: function (v) {
			this.canChangeArrows = v;
		}, asc_getFromChart: function () {
			return this.bFromChart;
		}, asc_setFromChart: function (v) {
			this.bFromChart = v;
		}, asc_getLocked: function () {
			return this.Locked;
		}, asc_setLocked: function (v) {
			this.Locked = v;
		},

		asc_getWidth: function () {
			return this.w;
		}, asc_putWidth: function (v) {
			this.w = v;
		}, asc_getHeight: function () {
			return this.h;
		}, asc_putHeight: function (v) {
			this.h = v;
		}, asc_getVerticalTextAlign: function () {
			return this.verticalTextAlign;
		}, asc_putVerticalTextAlign: function (v) {
			this.verticalTextAlign = v;
		}, asc_getVert: function () {
			return this.vert;
		}, asc_putVert: function (v) {
			this.vert = v;
		}, asc_getTextArtProperties: function () {
			return this.textArtProperties;
		}, asc_putTextArtProperties: function (v) {
			this.textArtProperties = v;
		}, asc_getLockAspect: function () {
			return this.lockAspect
		}, asc_putLockAspect: function (v) {
			this.lockAspect = v;
		}, asc_getTitle: function () {
			return this.title;
		}, asc_putTitle: function (v) {
			this.title = v;
		}, asc_getDescription: function () {
			return this.description;
		}, asc_putDescription: function (v) {
			this.description = v;
		},

		asc_getColumnNumber: function(){
			return this.columnNumber;
		},

		asc_putColumnNumber: function(v){
			this.columnNumber = v;
		},

		asc_getColumnSpace: function(){
			return this.columnSpace;
		},

		asc_putColumnSpace: function(v){
			this.columnSpace = v;
		},

		asc_getSignatureId: function(){
			return this.signatureId;
		},

		asc_putSignatureId: function(v){
			this.signatureId = v;
		},

		asc_getFromImage: function(){
			return this.bFromImage;
		},

		asc_putFromImage: function(v){
			this.bFromImage = v;
		},

		asc_getRot: function(){
			return this.rot;
		},

		asc_putRot: function(v){
			this.rot = v;
		},

		asc_getRotAdd: function(){
			return this.rotAdd;
		},

		asc_putRotAdd: function(v){
			this.rotAdd = v;
		},

		asc_getFlipH: function(){
			return this.flipH;
		},

		asc_putFlipH: function(v){
			this.flipH = v;
		},

		asc_getFlipV: function(){
			return this.flipV;
		},

		asc_putFlipV: function(v){
			this.flipV = v;
		},
		asc_getFlipHInvert: function(){
			return this.flipHInvert;
		},

		asc_putFlipHInvert: function(v){
			this.flipHInvert = v;
		},

		asc_getFlipVInvert: function(){
			return this.flipVInvert;
		},

		asc_putFlipVInvert: function(v){
			this.flipVInvert = v;
		},
		asc_getShadow: function(){
			return this.shadow;
		},

		asc_putShadow: function(v){
			this.shadow = v;
		},
		asc_getAnchor: function(){
			return this.anchor;
		},

		asc_putAnchor: function(v){
			this.anchor = v;
		}
	};

	/** @constructor */
	function asc_TextArtProperties(obj) {
		if (obj) {
			this.Fill = obj.Fill;//asc_Fill
			this.Line = obj.Line;//asc_Stroke
			this.Form = obj.Form;//srting
			this.Style = obj.Style;//
		} else {
			this.Fill = undefined;
			this.Line = undefined;
			this.Form = undefined;
			this.Style = undefined;
		}
	}

	asc_TextArtProperties.prototype.asc_putFill = function (oAscFill) {
		this.Fill = oAscFill;
	};
	asc_TextArtProperties.prototype.asc_getFill = function () {
		return this.Fill;
	};
	asc_TextArtProperties.prototype.asc_putLine = function (oAscStroke) {
		this.Line = oAscStroke;
	};
	asc_TextArtProperties.prototype.asc_getLine = function () {
		return this.Line;
	};
	asc_TextArtProperties.prototype.asc_putForm = function (sForm) {
		this.Form = sForm;
	};
	asc_TextArtProperties.prototype.asc_getForm = function () {
		return this.Form;
	};
	asc_TextArtProperties.prototype.asc_putStyle = function (Style) {
		this.Style = Style;
	};
	asc_TextArtProperties.prototype.asc_getStyle = function () {
		return this.Style;
	};

	function CImagePositionH(obj) {
		if (obj) {
			this.RelativeFrom = ( undefined === obj.RelativeFrom ) ? undefined : obj.RelativeFrom;
			this.UseAlign = ( undefined === obj.UseAlign     ) ? undefined : obj.UseAlign;
			this.Align = ( undefined === obj.Align        ) ? undefined : obj.Align;
			this.Value = ( undefined === obj.Value        ) ? undefined : obj.Value;
			this.Percent = ( undefined === obj.Percent      ) ? undefined : obj.Percent;
		} else {
			this.RelativeFrom = undefined;
			this.UseAlign = undefined;
			this.Align = undefined;
			this.Value = undefined;
			this.Percent = undefined;
		}
	}

	CImagePositionH.prototype.get_RelativeFrom = function () {
		return this.RelativeFrom;
	};
	CImagePositionH.prototype.put_RelativeFrom = function (v) {
		this.RelativeFrom = v;
	};
	CImagePositionH.prototype.get_UseAlign = function () {
		return this.UseAlign;
	};
	CImagePositionH.prototype.put_UseAlign = function (v) {
		this.UseAlign = v;
	};
	CImagePositionH.prototype.get_Align = function () {
		return this.Align;
	};
	CImagePositionH.prototype.put_Align = function (v) {
		this.Align = v;
	};
	CImagePositionH.prototype.get_Value = function () {
		return this.Value;
	};
	CImagePositionH.prototype.put_Value = function (v) {
		this.Value = v;
	};
	CImagePositionH.prototype.get_Percent = function () {
		return this.Percent
	};
	CImagePositionH.prototype.put_Percent = function (v) {
		this.Percent = v;
	};

	function CImagePositionV(obj) {
		if (obj) {
			this.RelativeFrom = ( undefined === obj.RelativeFrom ) ? undefined : obj.RelativeFrom;
			this.UseAlign = ( undefined === obj.UseAlign     ) ? undefined : obj.UseAlign;
			this.Align = ( undefined === obj.Align        ) ? undefined : obj.Align;
			this.Value = ( undefined === obj.Value        ) ? undefined : obj.Value;
			this.Percent = ( undefined === obj.Percent      ) ? undefined : obj.Percent;
		} else {
			this.RelativeFrom = undefined;
			this.UseAlign = undefined;
			this.Align = undefined;
			this.Value = undefined;
			this.Percent = undefined;
		}
	}

	CImagePositionV.prototype.get_RelativeFrom = function () {
		return this.RelativeFrom;
	};
	CImagePositionV.prototype.put_RelativeFrom = function (v) {
		this.RelativeFrom = v;
	};
	CImagePositionV.prototype.get_UseAlign = function () {
		return this.UseAlign;
	};
	CImagePositionV.prototype.put_UseAlign = function (v) {
		this.UseAlign = v;
	};
	CImagePositionV.prototype.get_Align = function () {
		return this.Align;
	};
	CImagePositionV.prototype.put_Align = function (v) {
		this.Align = v;
	};
	CImagePositionV.prototype.get_Value = function () {
		return this.Value;
	};
	CImagePositionV.prototype.put_Value = function (v) {
		this.Value = v;
	};
	CImagePositionV.prototype.get_Percent = function () {
		return this.Percent
	};
	CImagePositionV.prototype.put_Percent = function (v) {
		this.Percent = v;
	};

	function CPosition(obj) {
		if (obj) {
			this.X = (undefined == obj.X) ? null : obj.X;
			this.Y = (undefined == obj.Y) ? null : obj.Y;
		} else {
			this.X = null;
			this.Y = null;
		}
	}

	CPosition.prototype.get_X = function () {
		return this.X;
	};
	CPosition.prototype.put_X = function (v) {
		this.X = v;
	};
	CPosition.prototype.get_Y = function () {
		return this.Y;
	};
	CPosition.prototype.put_Y = function (v) {
		this.Y = v;
	};

	/** @constructor */
	function asc_CImgProperty(obj) {

		if (obj) {
			this.CanBeFlow = (undefined != obj.CanBeFlow) ? obj.CanBeFlow : true;

			this.Width = (undefined != obj.Width        ) ? obj.Width : undefined;
			this.Height = (undefined != obj.Height       ) ? obj.Height : undefined;
			this.WrappingStyle = (undefined != obj.WrappingStyle) ? obj.WrappingStyle : undefined;
			this.Paddings = (undefined != obj.Paddings     ) ? new asc_CPaddings(obj.Paddings) : undefined;
			this.Position = (undefined != obj.Position     ) ? new CPosition(obj.Position) : undefined;
			this.AllowOverlap = (undefined != obj.AllowOverlap ) ? obj.AllowOverlap : undefined;
			this.PositionH = (undefined != obj.PositionH    ) ? new CImagePositionH(obj.PositionH) : undefined;
			this.PositionV = (undefined != obj.PositionV    ) ? new CImagePositionV(obj.PositionV) : undefined;

			this.SizeRelH = (undefined != obj.SizeRelH) ? new CImagePositionH(obj.SizeRelH) : undefined;
			this.SizeRelV = (undefined != obj.SizeRelV) ? new CImagePositionV(obj.SizeRelV) : undefined;

			this.Internal_Position = (undefined != obj.Internal_Position) ? obj.Internal_Position : null;

			this.ImageUrl = (undefined != obj.ImageUrl) ? obj.ImageUrl : null;
			this.Locked = (undefined != obj.Locked) ? obj.Locked : false;
			this.lockAspect = (undefined != obj.lockAspect) ? obj.lockAspect : false;


			this.ChartProperties = (undefined != obj.ChartProperties) ? obj.ChartProperties : null;
			this.ShapeProperties = (undefined != obj.ShapeProperties) ? obj.ShapeProperties : null;

			this.ChangeLevel = (undefined != obj.ChangeLevel) ? obj.ChangeLevel : null;
			this.Group = (obj.Group != undefined) ? obj.Group : null;

			this.fromGroup = obj.fromGroup != undefined ? obj.fromGroup : null;
			this.severalCharts = obj.severalCharts != undefined ? obj.severalCharts : false;
			this.severalChartTypes = obj.severalChartTypes != undefined ? obj.severalChartTypes : undefined;
			this.severalChartStyles = obj.severalChartStyles != undefined ? obj.severalChartStyles : undefined;
			this.verticalTextAlign = obj.verticalTextAlign != undefined ? obj.verticalTextAlign : undefined;
			this.vert = obj.vert != undefined ? obj.vert : undefined;

			//oleObjects
			this.pluginGuid = obj.pluginGuid !== undefined ? obj.pluginGuid : undefined;
			this.pluginData = obj.pluginData !== undefined ? obj.pluginData : undefined;
			this.oleWidth = obj.oleWidth != undefined ? obj.oleWidth : undefined;
			this.oleHeight = obj.oleHeight != undefined ? obj.oleHeight : undefined;

			this.title = obj.title != undefined ? obj.title : undefined;
			this.description = obj.description != undefined ? obj.description : undefined;

            this.columnNumber =  obj.columnNumber != undefined ? obj.columnNumber : undefined;
            this.columnSpace =  obj.columnSpace != undefined ? obj.columnSpace : undefined;
            this.shadow =  obj.shadow != undefined ? obj.shadow : undefined;

			this.rot = obj.rot != undefined ? obj.rot : undefined;
			this.flipH = obj.flipH != undefined ? obj.flipH : undefined;
			this.flipV = obj.flipV != undefined ? obj.flipV : undefined;
			this.resetCrop =  obj.resetCrop != undefined ? obj.resetCrop : undefined;
			this.anchor =  obj.anchor != undefined ? obj.anchor : undefined;

		} else {
			this.CanBeFlow = true;
			this.Width = undefined;
			this.Height = undefined;
			this.WrappingStyle = undefined;
			this.Paddings = undefined;
			this.Position = undefined;
			this.PositionH = undefined;
			this.PositionV = undefined;

			this.SizeRelH = undefined;
			this.SizeRelV = undefined;

			this.Internal_Position = null;
			this.ImageUrl = null;
			this.Locked = false;

			this.ChartProperties = null;
			this.ShapeProperties = null;

			this.ChangeLevel = null;
			this.Group = null;
			this.fromGroup = null;
			this.severalCharts = false;
			this.severalChartTypes = undefined;
			this.severalChartStyles = undefined;
			this.verticalTextAlign = undefined;
			this.vert = undefined;

			//oleObjects
			this.pluginGuid = undefined;
			this.pluginData = undefined;

			this.oleWidth = undefined;
			this.oleHeight = undefined;
            this.title = undefined;
            this.description = undefined;

            this.columnNumber = undefined;
            this.columnSpace =  undefined;


			this.rot = undefined;
			this.rotAdd = undefined;
			this.flipH = undefined;
			this.flipV = undefined;
			this.resetCrop = undefined;
			this.anchor = undefined;
		}
	}

	asc_CImgProperty.prototype = {
		constructor: asc_CImgProperty,
		asc_getChangeLevel: function () {
			return this.ChangeLevel;
		}, asc_putChangeLevel: function (v) {
			this.ChangeLevel = v;
		},

		asc_getCanBeFlow: function () {
			return this.CanBeFlow;
		}, asc_getWidth: function () {
			return this.Width;
		}, asc_putWidth: function (v) {
			this.Width = v;
		}, asc_getHeight: function () {
			return this.Height;
		}, asc_putHeight: function (v) {
			this.Height = v;
		}, asc_getWrappingStyle: function () {
			return this.WrappingStyle;
		}, asc_putWrappingStyle: function (v) {
			this.WrappingStyle = v;
		},

		// Возвращается объект класса Asc.asc_CPaddings
		asc_getPaddings: function () {
			return this.Paddings;
		}, // Аргумент объект класса Asc.asc_CPaddings
		asc_putPaddings: function (v) {
			this.Paddings = v;
		}, asc_getAllowOverlap: function () {
			return this.AllowOverlap;
		}, asc_putAllowOverlap: function (v) {
			this.AllowOverlap = v;
		}, // Возвращается объект класса CPosition
		asc_getPosition: function () {
			return this.Position;
		}, // Аргумент объект класса CPosition
		asc_putPosition: function (v) {
			this.Position = v;
		}, asc_getPositionH: function () {
			return this.PositionH;
		}, asc_putPositionH: function (v) {
			this.PositionH = v;
		}, asc_getPositionV: function () {
			return this.PositionV;
		}, asc_putPositionV: function (v) {
			this.PositionV = v;
		},

		asc_getSizeRelH: function () {
			return this.SizeRelH;
		},

		asc_putSizeRelH: function (v) {
			this.SizeRelH = v;
		},

		asc_getSizeRelV: function () {
			return this.SizeRelV;
		},

		asc_putSizeRelV: function (v) {
			this.SizeRelV = v;
		},

		asc_getValue_X: function (RelativeFrom) {
        if (null != this.Internal_Position) {
            return this.Internal_Position.Calculate_X_Value(RelativeFrom);
        }
			return 0;
		}, asc_getValue_Y: function (RelativeFrom) {
          if (null != this.Internal_Position) {
              return this.Internal_Position.Calculate_Y_Value(RelativeFrom);
          }
			return 0;
		},

		asc_getImageUrl: function () {
			return this.ImageUrl;
		}, asc_putImageUrl: function (v) {
			this.ImageUrl = v;
		}, asc_getGroup: function () {
			return this.Group;
		}, asc_putGroup: function (v) {
			this.Group = v;
		}, asc_getFromGroup: function () {
			return this.fromGroup;
		}, asc_putFromGroup: function (v) {
			this.fromGroup = v;
		},

		asc_getisChartProps: function () {
			return this.isChartProps;
		}, asc_putisChartPross: function (v) {
			this.isChartProps = v;
		},

		asc_getSeveralCharts: function () {
			return this.severalCharts;
		}, asc_putSeveralCharts: function (v) {
			this.severalCharts = v;
		}, asc_getSeveralChartTypes: function () {
			return this.severalChartTypes;
		}, asc_putSeveralChartTypes: function (v) {
			this.severalChartTypes = v;
		},

		asc_getSeveralChartStyles: function () {
			return this.severalChartStyles;
		}, asc_putSeveralChartStyles: function (v) {
			this.severalChartStyles = v;
		},

		asc_getVerticalTextAlign: function () {
			return this.verticalTextAlign;
		}, asc_putVerticalTextAlign: function (v) {
			this.verticalTextAlign = v;
		}, asc_getVert: function () {
			return this.vert;
		}, asc_putVert: function (v) {
			this.vert = v;
		},

		asc_getLocked: function () {
			return this.Locked;
		}, asc_getLockAspect: function () {
			return this.lockAspect;
		}, asc_putLockAspect: function (v) {
			this.lockAspect = v;
		}, asc_getChartProperties: function () {
			return this.ChartProperties;
		}, asc_putChartProperties: function (v) {
			this.ChartProperties = v;
		}, asc_getShapeProperties: function () {
			return this.ShapeProperties;
		}, asc_putShapeProperties: function (v) {
			this.ShapeProperties = v;
		},

		asc_getOriginSize: function (api)
		{
			if (window['AscFormat'].isRealNumber(this.oleWidth) && window['AscFormat'].isRealNumber(this.oleHeight))
			{
				return new asc_CImageSize(this.oleWidth, this.oleHeight, true);
			}
			if (this.ImageUrl === null)
			{
				return new asc_CImageSize(50, 50, false);
			}

			var origW = 0;
			var origH = 0;
			var _image = api.ImageLoader.map_image_index[AscCommon.getFullImageSrc2(this.ImageUrl)];
			if (_image != undefined && _image.Image != null && _image.Status == window['AscFonts'].ImageLoadStatus.Complete)
			{
				origW = _image.Image.width;
				origH = _image.Image.height;
			}
			else if (window["AscDesktopEditor"] && window["AscDesktopEditor"]["GetImageOriginalSize"])
			{
				var _size = window["AscDesktopEditor"]["GetImageOriginalSize"](this.ImageUrl);
				if (_size.W != 0 && _size.H != 0)
				{
					origW = _size.W;
					origH = _size.H;
				}
			}

			if (origW != 0 && origH != 0)
			{
				var __w = Math.max((origW * AscCommon.g_dKoef_pix_to_mm), 1);
				var __h = Math.max((origH * AscCommon.g_dKoef_pix_to_mm), 1);

				return new asc_CImageSize(__w, __h, true);
			}
			return new asc_CImageSize(50, 50, false);
		},

		//oleObjects
		asc_getPluginGuid: function () {
			return this.pluginGuid;
		},

		asc_putPluginGuid: function (v) {
			this.pluginGuid = v;
		},

		asc_getPluginData: function () {
			return this.pluginData;
		},

		asc_putPluginData: function (v) {
			this.pluginData = v;
		},

		asc_getTitle: function(){
			return this.title;
		},

		asc_putTitle: function(v){
			this.title = v;
		},

		asc_getDescription: function(){
			return this.description;
		},

		asc_putDescription: function(v){
			this.description = v;
		},

		asc_getColumnNumber: function(){
			return this.columnNumber;
		},

		asc_putColumnNumber: function(v){
			this.columnNumber = v;
		},

		asc_getColumnSpace: function(){
			return this.columnSpace;
		},

		asc_putColumnSpace: function(v){
			this.columnSpace = v;
		},

		asc_getSignatureId : function() {
			if (this.ShapeProperties)
				return this.ShapeProperties.asc_getSignatureId();
			return undefined;
		},

		asc_getRot: function(){
			return this.rot;
		},

		asc_putRot: function(v){
			this.rot = v;
		},
		asc_getRotAdd: function(){
			return this.rotAdd;
		},

		asc_putRotAdd: function(v){
			this.rotAdd = v;
		},

		asc_getFlipH: function(){
			return this.flipH;
		},

		asc_putFlipH: function(v){
			this.flipH = v;
		},
		asc_getFlipHInvert: function(){
			return this.flipHInvert;
		},

		asc_putFlipHInvert: function(v){
			this.flipHInvert = v;
		},

		asc_getFlipV: function(){
			return this.flipV;
		},

		asc_putFlipV: function(v){
			this.flipV = v;
		},
		asc_getFlipVInvert: function(){
			return this.flipVInvert;
		},

		asc_putFlipVInvert: function(v){
			this.flipVInvert = v;
		},
		asc_putResetCrop: function(v){
			this.resetCrop = v;
		},
		asc_getShadow: function(){
			return this.shadow;
		},

		asc_putShadow: function(v){
			this.shadow = v;
		},
		asc_getAnchor: function(){
			return this.anchor;
		},

		asc_putAnchor: function(v){
			this.anchor = v;
		}
	};

	/** @constructor */
	function asc_CSelectedObject(type, val) {
		this.Type = (undefined != type) ? type : null;
		this.Value = (undefined != val) ? val : null;
	}

	asc_CSelectedObject.prototype = {
		asc_getObjectType: function () {
			return this.Type;
		}, asc_getObjectValue: function () {
			return this.Value;
		}
	};

	/** @constructor */
	function asc_CShapeFill() {
		this.type = null;
		this.fill = null;
		this.transparent = null;
	}

	asc_CShapeFill.prototype = {
		asc_getType: function () {
			return this.type;
		}, asc_putType: function (v) {
			this.type = v;
		}, asc_getFill: function () {
			return this.fill;
		}, asc_putFill: function (v) {
			this.fill = v;
		}, asc_getTransparent: function () {
			return this.transparent;
		}, asc_putTransparent: function (v) {
			this.transparent = v;
		}, asc_CheckForseSet: function () {
			if (null != this.transparent) {
				return true;
			}
			if (null != this.fill && this.fill.Positions != null) {
				return true;
			}
			return false;
		}
	};

	/** @constructor */
	function asc_CFillBlip() {
		this.type = c_oAscFillBlipType.STRETCH;
		this.url = "";
		this.texture_id = null;
	}

	asc_CFillBlip.prototype = {
		asc_getType: function () {
			return this.type
		}, asc_putType: function (v) {
			this.type = v;
		}, asc_getUrl: function () {
			return this.url;
		}, asc_putUrl: function (v) {
			this.url = v;
		}, asc_getTextureId: function () {
			return this.texture_id;
		}, asc_putTextureId: function (v) {
			this.texture_id = v;
		}
	};

	/** @constructor */
	function asc_CFillHatch() {
		this.PatternType = undefined;
		this.fgClr = undefined;
		this.bgClr = undefined;
	}

	asc_CFillHatch.prototype = {
		asc_getPatternType: function () {
			return this.PatternType;
		}, asc_putPatternType: function (v) {
			this.PatternType = v;
		}, asc_getColorFg: function () {
			return this.fgClr;
		}, asc_putColorFg: function (v) {
			this.fgClr = v;
		}, asc_getColorBg: function () {
			return this.bgClr;
		}, asc_putColorBg: function (v) {
			this.bgClr = v;
		}
	};

	/** @constructor */
	function asc_CFillGrad() {
		this.Colors = undefined;
		this.Positions = undefined;
		this.GradType = 0;

		this.LinearAngle = undefined;
		this.LinearScale = true;

		this.PathType = 0;
	}

	asc_CFillGrad.prototype = {
		asc_getColors: function () {
			return this.Colors;
		}, asc_putColors: function (v) {
			this.Colors = v;
		}, asc_getPositions: function () {
			return this.Positions;
		}, asc_putPositions: function (v) {
			this.Positions = v;
		}, asc_getGradType: function () {
			return this.GradType;
		}, asc_putGradType: function (v) {
			this.GradType = v;
		}, asc_getLinearAngle: function () {
			return this.LinearAngle;
		}, asc_putLinearAngle: function (v) {
			this.LinearAngle = v;
		}, asc_getLinearScale: function () {
			return this.LinearScale;
		}, asc_putLinearScale: function (v) {
			this.LinearScale = v;
		}, asc_getPathType: function () {
			return this.PathType;
		}, asc_putPathType: function (v) {
			this.PathType = v;
		}
	};

	/** @constructor */
	function asc_CFillSolid() {
		this.color = new asc_CColor();
	}

	asc_CFillSolid.prototype = {
		asc_getColor: function () {
			return this.color
		}, asc_putColor: function (v) {
			this.color = v;
		}
	};

	/** @constructor */
	function asc_CStroke() {
		this.type = null;
		this.width = null;
		this.color = null;
		this.prstDash = null;

		this.LineJoin = null;
		this.LineCap = null;

		this.LineBeginStyle = null;
		this.LineBeginSize = null;

		this.LineEndStyle = null;
		this.LineEndSize = null;

		this.canChangeArrows = false;
	}

	asc_CStroke.prototype = {
		asc_getType: function () {
			return this.type;
		}, asc_putType: function (v) {
			this.type = v;
		}, asc_getWidth: function () {
			return this.width;
		}, asc_putWidth: function (v) {
			this.width = v;
		}, asc_getColor: function () {
			return this.color;
		}, asc_putColor: function (v) {
			this.color = v;
		},

		asc_getLinejoin: function () {
			return this.LineJoin;
		}, asc_putLinejoin: function (v) {
			this.LineJoin = v;
		}, asc_getLinecap: function () {
			return this.LineCap;
		}, asc_putLinecap: function (v) {
			this.LineCap = v;
		},

		asc_getLinebeginstyle: function () {
			return this.LineBeginStyle;
		}, asc_putLinebeginstyle: function (v) {
			this.LineBeginStyle = v;
		}, asc_getLinebeginsize: function () {
			return this.LineBeginSize;
		}, asc_putLinebeginsize: function (v) {
			this.LineBeginSize = v;
		}, asc_getLineendstyle: function () {
			return this.LineEndStyle;
		}, asc_putLineendstyle: function (v) {
			this.LineEndStyle = v;
		}, asc_getLineendsize: function () {
			return this.LineEndSize;
		}, asc_putLineendsize: function (v) {
			this.LineEndSize = v;
		},

		asc_getCanChangeArrows: function () {
			return this.canChangeArrows;
		},

		asc_putPrstDash: function (v) {
			this.prstDash = v;
		}, asc_getPrstDash: function () {
			return this.prstDash;
		}
	};

	// цвет. может быть трех типов:
	// c_oAscColor.COLOR_TYPE_SRGB		: value - не учитывается
	// c_oAscColor.COLOR_TYPE_PRST		: value - имя стандартного цвета (map_prst_color)
	// c_oAscColor.COLOR_TYPE_SCHEME	: value - тип цвета в схеме
	// c_oAscColor.COLOR_TYPE_SYS		: конвертируется в srgb
	function CAscColorScheme() {
		this.colors = [];
		this.name = "";
		this.scheme = null;
		this.summ = 0;
	}

	CAscColorScheme.prototype.get_colors = function () {
		return this.colors;
	};
	CAscColorScheme.prototype.get_name = function () {
		return this.name;
	};
	CAscColorScheme.prototype.get_dk1 = function () {
		return this.colors[0];
	};
	CAscColorScheme.prototype.get_lt1 = function () {
		return this.colors[1];
	};
	CAscColorScheme.prototype.get_dk2 = function () {
		return this.colors[2];
	};
	CAscColorScheme.prototype.get_lt2 = function () {
		return this.colors[3];
	};
	CAscColorScheme.prototype.get_accent1 = function () {
		return this.colors[4];
	};
	CAscColorScheme.prototype.get_accent2 = function () {
		return this.colors[5];
	};
	CAscColorScheme.prototype.get_accent3 = function () {
		return this.colors[6];
	};
	CAscColorScheme.prototype.get_accent4 = function () {
		return this.colors[7];
	};
	CAscColorScheme.prototype.get_accent5 = function () {
		return this.colors[8];
	};
	CAscColorScheme.prototype.get_accent6 = function () {
		return this.colors[9];
	};
	CAscColorScheme.prototype.get_hlink = function () {
		return this.colors[10];
	};
	CAscColorScheme.prototype.get_folHlink = function () {
		return this.colors[11];
	};
	CAscColorScheme.prototype.putColor = function (color) {
		this.colors.push(color);
		this.summ += color.getVal();
	};
	CAscColorScheme.prototype.isEqual = function (oColorScheme) {
		if(this.summ === oColorScheme.summ)
		{
			for(var i = 0; i < this.colors.length; ++i)
			{
				var oColor1 = this.colors[i];
				var oColor2 = oColorScheme.colors[i];
				if(!(!oColor1 && !oColor2 || oColor2 && oColor2 && oColor1.Compare(oColor2)))
				{
					return false;
				}
			}
			return this.name === oColorScheme.name;
		}
		return false;
	};


	//-----------------------------------------------------------------
	// События движения мыши
	//-----------------------------------------------------------------
	function CMouseMoveData(obj)
	{
		if (obj)
		{
			this.Type  = ( undefined != obj.Type ) ? obj.Type : c_oAscMouseMoveDataTypes.Common;
			this.X_abs = ( undefined != obj.X_abs ) ? obj.X_abs : 0;
			this.Y_abs = ( undefined != obj.Y_abs ) ? obj.Y_abs : 0;

			switch (this.Type)
			{
				case c_oAscMouseMoveDataTypes.Hyperlink :
				{
					this.Hyperlink = ( undefined != obj.PageNum ) ? obj.PageNum : 0;
					break;
				}

				case c_oAscMouseMoveDataTypes.LockedObject :
				{
					this.UserId           = ( undefined != obj.UserId ) ? obj.UserId : "";
					this.HaveChanges      = ( undefined != obj.HaveChanges ) ? obj.HaveChanges : false;
					this.LockedObjectType =
						( undefined != obj.LockedObjectType ) ? obj.LockedObjectType : Asc.c_oAscMouseMoveLockedObjectType.Common;
					break;
				}
				case c_oAscMouseMoveDataTypes.Footnote:
				{
					this.Text   = "";
					this.Number = 1;
					break;
				}
			}
		}
		else
		{
			this.Type  = c_oAscMouseMoveDataTypes.Common;
			this.X_abs = 0;
			this.Y_abs = 0;
		}
	}

	CMouseMoveData.prototype.get_Type = function () {
		return this.Type;
	};
	CMouseMoveData.prototype.get_X = function () {
		return this.X_abs;
	};
	CMouseMoveData.prototype.get_Y = function () {
		return this.Y_abs;
	};
	CMouseMoveData.prototype.get_Hyperlink = function () {
		return this.Hyperlink;
	};
	CMouseMoveData.prototype.get_UserId = function () {
		return this.UserId;
	};
	CMouseMoveData.prototype.get_HaveChanges = function () {
		return this.HaveChanges;
	};
	CMouseMoveData.prototype.get_LockedObjectType = function () {
		return this.LockedObjectType;
	};
	CMouseMoveData.prototype.get_FootnoteText = function()
	{
		return this.Text;
	};
	CMouseMoveData.prototype.get_FootnoteNumber = function()
	{
		return this.Number;
	};


	/**
	 * Класс для работы с интерфейсом для гиперссылок
	 * @param obj
	 * @constructor
	 */
    function CHyperlinkProperty(obj)
	{
		if (obj)
		{
			this.Text    = (undefined != obj.Text   ) ? obj.Text : null;
			this.Value   = (undefined != obj.Value  ) ? obj.Value : "";
			this.ToolTip = (undefined != obj.ToolTip) ? obj.ToolTip : "";
			this.Class   = (undefined !== obj.Class ) ? obj.Class : null;
			this.Anchor  = (undefined !== obj.Anchor) ? obj.Anchor : null;
			this.Heading = (obj.Heading ? obj.Heading : null);
		}
		else
		{
			this.Text    = null;
			this.Value   = "";
			this.ToolTip = "";
			this.Class   = null;
			this.Anchor  = null;
			this.Heading = null;
		}
	}
    CHyperlinkProperty.prototype.get_Value   = function()
    {
        return this.Value;
    };
    CHyperlinkProperty.prototype.put_Value   = function(v)
    {
        this.Value = v;
    };
    CHyperlinkProperty.prototype.get_ToolTip = function()
    {
        return this.ToolTip;
    };
    CHyperlinkProperty.prototype.put_ToolTip = function(v)
    {
        this.ToolTip = v ? v.slice(0, Asc.c_oAscMaxTooltipLength) : v;
    };
    CHyperlinkProperty.prototype.get_Text    = function()
    {
        return this.Text;
    };
    CHyperlinkProperty.prototype.put_Text    = function(v)
    {
        this.Text = v;
    };
    CHyperlinkProperty.prototype.put_InternalHyperlink = function(oClass)
    {
        this.Class = oClass;
    };
    CHyperlinkProperty.prototype.get_InternalHyperlink = function()
    {
        return this.Class;
    };
    CHyperlinkProperty.prototype.is_TopOfDocument = function()
	{
		return (this.Anchor === "_top");
	};
    CHyperlinkProperty.prototype.put_TopOfDocument = function()
	{
		this.Anchor = "_top";
	};
    CHyperlinkProperty.prototype.get_Bookmark = function()
	{
		return this.Anchor;
	};
    CHyperlinkProperty.prototype.put_Bookmark = function(sBookmark)
	{
		this.Anchor = sBookmark;
	};
	CHyperlinkProperty.prototype.is_Heading = function()
	{
		return (this.Heading instanceof AscCommonWord.Paragraph ? true : false)
	};
	CHyperlinkProperty.prototype.put_Heading = function(oParagraph)
	{
		this.Heading = oParagraph;
	};
	CHyperlinkProperty.prototype.get_Heading = function()
	{
		return this.Heading;
	};

	window['Asc']['CHyperlinkProperty'] = window['Asc'].CHyperlinkProperty = CHyperlinkProperty;
	CHyperlinkProperty.prototype['get_Value']             = CHyperlinkProperty.prototype.get_Value;
	CHyperlinkProperty.prototype['put_Value']             = CHyperlinkProperty.prototype.put_Value;
	CHyperlinkProperty.prototype['get_ToolTip']           = CHyperlinkProperty.prototype.get_ToolTip;
	CHyperlinkProperty.prototype['put_ToolTip']           = CHyperlinkProperty.prototype.put_ToolTip;
	CHyperlinkProperty.prototype['get_Text']              = CHyperlinkProperty.prototype.get_Text;
	CHyperlinkProperty.prototype['put_Text']              = CHyperlinkProperty.prototype.put_Text;
	CHyperlinkProperty.prototype['get_InternalHyperlink'] = CHyperlinkProperty.prototype.get_InternalHyperlink;
	CHyperlinkProperty.prototype['put_InternalHyperlink'] = CHyperlinkProperty.prototype.put_InternalHyperlink;
	CHyperlinkProperty.prototype['is_TopOfDocument']      = CHyperlinkProperty.prototype.is_TopOfDocument;
	CHyperlinkProperty.prototype['put_TopOfDocument']     = CHyperlinkProperty.prototype.put_TopOfDocument;
	CHyperlinkProperty.prototype['get_Bookmark']          = CHyperlinkProperty.prototype.get_Bookmark;
	CHyperlinkProperty.prototype['put_Bookmark']          = CHyperlinkProperty.prototype.put_Bookmark;
	CHyperlinkProperty.prototype['is_Heading']            = CHyperlinkProperty.prototype.is_Heading;
	CHyperlinkProperty.prototype['put_Heading']           = CHyperlinkProperty.prototype.put_Heading;
	CHyperlinkProperty.prototype['get_Heading']           = CHyperlinkProperty.prototype.get_Heading;


	/** @constructor */
	function asc_CUserInfo() {
		this.Id = null;
		this.FullName = null;
		this.FirstName = null;
		this.LastName = null;
	}

	asc_CUserInfo.prototype.asc_putId = asc_CUserInfo.prototype.put_Id = function (v) {
		this.Id = v;
	};
	asc_CUserInfo.prototype.asc_getId = asc_CUserInfo.prototype.get_Id = function () {
		return this.Id;
	};
	asc_CUserInfo.prototype.asc_putFullName = asc_CUserInfo.prototype.put_FullName = function (v) {
		this.FullName = v;
	};
	asc_CUserInfo.prototype.asc_getFullName = asc_CUserInfo.prototype.get_FullName = function () {
		return this.FullName;
	};
	asc_CUserInfo.prototype.asc_putFirstName = asc_CUserInfo.prototype.put_FirstName = function (v) {
		this.FirstName = v;
	};
	asc_CUserInfo.prototype.asc_getFirstName = asc_CUserInfo.prototype.get_FirstName = function () {
		return this.FirstName;
	};
	asc_CUserInfo.prototype.asc_putLastName = asc_CUserInfo.prototype.put_LastName = function (v) {
		this.LastName = v;
	};
	asc_CUserInfo.prototype.asc_getLastName = asc_CUserInfo.prototype.get_LastName = function () {
		return this.LastName;
	};

	/** @constructor */
	function asc_CDocInfo() {
		this.Id = null;
		this.Url = null;
		this.Title = null;
		this.Format = null;
		this.VKey = null;
		this.Token = null;
		this.UserInfo = null;
		this.Options = null;
		this.CallbackUrl = null;
		this.TemplateReplacement = null;
		this.Mode = null;
		this.Permissions = null;
		this.Lang = null;
		this.OfflineApp = false;
		this.Encrypted;
	}

	prot = asc_CDocInfo.prototype;
	prot.get_Id = prot.asc_getId = function () {
		return this.Id
	};
	prot.put_Id = prot.asc_putId = function (v) {
		this.Id = v;
	};
	prot.get_Url = prot.asc_getUrl = function () {
		return this.Url;
	};
	prot.put_Url = prot.asc_putUrl = function (v) {
		this.Url = v;
	};
	prot.get_Title = prot.asc_getTitle = function () {
		return this.Title;
	};
	prot.put_Title = prot.asc_putTitle = function (v) {
		this.Title = v;
	};
	prot.get_Format = prot.asc_getFormat = function () {
		return this.Format;
	};
	prot.put_Format = prot.asc_putFormat = function (v) {
		this.Format = v;
	};
	prot.get_VKey = prot.asc_getVKey = function () {
		return this.VKey;
	};
	prot.put_VKey = prot.asc_putVKey = function (v) {
		this.VKey = v;
	};
	prot.get_Token = prot.asc_getToken = function () {
		return this.Token;
	};
	prot.put_Token = prot.asc_putToken = function (v) {
		this.Token = v;
	};
	prot.get_OfflineApp = function () {
		return this.OfflineApp;
	};
	prot.put_OfflineApp = function (v) {
		this.OfflineApp = v;
	};
	prot.get_UserId = prot.asc_getUserId = function () {
		return (this.UserInfo ? this.UserInfo.get_Id() : null );
	};
	prot.get_UserName = prot.asc_getUserName = function () {
		return (this.UserInfo ? this.UserInfo.get_FullName() : null );
	};
	prot.get_FirstName = prot.asc_getFirstName = function () {
		return (this.UserInfo ? this.UserInfo.get_FirstName() : null );
	};
	prot.get_LastName = prot.asc_getLastName = function () {
		return (this.UserInfo ? this.UserInfo.get_LastName() : null );
	};
	prot.get_Options = prot.asc_getOptions = function () {
		return this.Options;
	};
	prot.put_Options = prot.asc_putOptions = function (v) {
		this.Options = v;
	};
	prot.get_CallbackUrl = prot.asc_getCallbackUrl = function () {
		return this.CallbackUrl;
	};
	prot.put_CallbackUrl = prot.asc_putCallbackUrl = function (v) {
		this.CallbackUrl = v;
	};
	prot.get_TemplateReplacement = prot.asc_getTemplateReplacement = function () {
		return this.TemplateReplacement;
	};
	prot.put_TemplateReplacement = prot.asc_putTemplateReplacement = function (v) {
		this.TemplateReplacement = v;
	};
	prot.get_UserInfo = prot.asc_getUserInfo = function () {
		return this.UserInfo;
	};
	prot.put_UserInfo = prot.asc_putUserInfo = function (v) {
		this.UserInfo = v;
	};
	prot.get_Mode = prot.asc_getMode = function () {
		return this.Mode;
	};
	prot.put_Mode = prot.asc_putMode = function (v) {
		this.Mode = v;
	};
	prot.get_Permissions = prot.asc_getPermissions = function () {
		return this.Permissions;
	};
	prot.put_Permissions = prot.asc_putPermissions = function (v) {
		this.Permissions = v;
	};
	prot.get_Lang = prot.asc_getLang = function () {
		return this.Lang;
	};
	prot.put_Lang = prot.asc_putLang = function (v) {
		this.Lang = v;
	};
	prot.get_Encrypted = prot.asc_getEncrypted = function () {
		return this.Encrypted;
	};
	prot.put_Encrypted = prot.asc_putEncrypted = function (v) {
		this.Encrypted = v;
	};

	function COpenProgress() {
		this.Type = Asc.c_oAscAsyncAction.Open;

		this.FontsCount = 0;
		this.CurrentFont = 0;

		this.ImagesCount = 0;
		this.CurrentImage = 0;
	}

	COpenProgress.prototype.asc_getType = function () {
		return this.Type
	};
	COpenProgress.prototype.asc_getFontsCount = function () {
		return this.FontsCount
	};
	COpenProgress.prototype.asc_getCurrentFont = function () {
		return this.CurrentFont
	};
	COpenProgress.prototype.asc_getImagesCount = function () {
		return this.ImagesCount
	};
	COpenProgress.prototype.asc_getCurrentImage = function () {
		return this.CurrentImage
	};

	function CErrorData() {
		this.Value = 0;
	}

	CErrorData.prototype.put_Value = function (v) {
		this.Value = v;
	};
	CErrorData.prototype.get_Value = function () {
		return this.Value;
	};

	function CAscMathType() {
		this.Id = 0;

		this.X = 0;
		this.Y = 0;
	}

	CAscMathType.prototype.get_Id = function () {
		return this.Id;
	};
	CAscMathType.prototype.get_X = function () {
		return this.X;
	};
	CAscMathType.prototype.get_Y = function () {
		return this.Y;
	};

	function CAscMathCategory() {
		this.Id = 0;
		this.Data = [];

		this.W = 0;
		this.H = 0;
	}

	CAscMathCategory.prototype.get_Id = function () {
		return this.Id;
	};
	CAscMathCategory.prototype.get_Data = function () {
		return this.Data;
	};
	CAscMathCategory.prototype.get_W = function () {
		return this.W;
	};
	CAscMathCategory.prototype.get_H = function () {
		return this.H;
	};
	CAscMathCategory.prototype.private_Sort = function () {
		this.Data.sort(function (a, b) {
			return a.Id - b.Id;
		});
	};

	function CStyleImage(name, type, image, uiPriority) {
		this.name = name;
		this.displayName = null;
		this.type = type;
		this.image = image;
		this.uiPriority = uiPriority;
	}

	CStyleImage.prototype.asc_getId = CStyleImage.prototype.asc_getName = CStyleImage.prototype.get_Name = function () {
		return this.name;
	};
	CStyleImage.prototype.asc_getDisplayName = function () { return this.displayName; };
	CStyleImage.prototype.asc_getType = CStyleImage.prototype.get_Type = function () {
		return this.type;
	};
	CStyleImage.prototype.asc_getImage = function () {
		return this.image;
	};

	/** @constructor */
    function asc_CSpellCheckProperty(Word, Checked, Variants, ParaId, Element)
    {
        this.Word     = Word;
        this.Checked  = Checked;
        this.Variants = Variants;

        this.ParaId  = ParaId;
        this.Element = Element;
    }

    asc_CSpellCheckProperty.prototype.get_Word     = function()
    {
        return this.Word;
    };
    asc_CSpellCheckProperty.prototype.get_Checked  = function()
    {
        return this.Checked;
    };
    asc_CSpellCheckProperty.prototype.get_Variants = function()
    {
        return this.Variants;
    };

    function CWatermarkOnDraw(htmlContent, api)
	{
		// example content:
		/*
		{
			"type" : "rect",
			"width" : 100, // mm
			"height" : 100, // mm
			"rotate" : -45, // degrees
			"margins" : [ 10, 10, 10, 10 ], // text margins
			"fill" : [255, 0, 0], // [] => none
			"stroke-width" : 1, // mm
			"stroke" : [0, 0, 255], // [] => none
			"align" : 1, // vertical text align (4 - top, 1 - center, 0 - bottom)

			"paragraphs" : [
				{
					"align" : 4, // horizontal text align [1 - left, 2 - center, 0 - right, 3 - justify]
					"fill" : [255, 0, 0], // paragraph highlight. [] => none
					"linespacing" : 0,

					"runs" : [
						{
							"text" : "some text",
							"fill" : [255, 255, 255], // text highlight. [] => none,
							"font-family" : "Arial",
							"font-size" : 24, // pt
							"bold" : true,
							"italic" : false,
							"strikeout" : "false",
							"underline" : "false"
						},
						{
							"text" : "<%br%>"
						}
					]
				}
			]
		}
		*/

		this.api = api;
		this.isFontsLoaded = false;

		this.inputContentSrc = htmlContent;
		if (typeof this.inputContentSrc === "object")
			this.inputContentSrc = JSON.stringify(this.inputContentSrc);

		this.replaceMap = {};

		this.image = null;
		this.imageBase64 = undefined;
		this.width = 0;
		this.height = 0;

		this.transparent = 0.3;
		this.zoom = 1;
		this.calculatezoom = -1;

		this.contentObjects = null;

		this.CheckParams = function()
		{
			this.replaceMap["%user_name%"] = this.api.User.userName;

            var content = this.inputContentSrc;
            for (var key in this.replaceMap)
            {
                if (!this.replaceMap.hasOwnProperty(key))
                    continue;
                content = content.replace(new RegExp(key, 'g'), this.replaceMap[key]);
            }
            this.contentObjects = {};
            try {
                var _objTmp = JSON.parse(content);
                this.contentObjects = _objTmp;
            }
            catch (err) {
            }

            this.transparent = (undefined == this.contentObjects['transparent']) ? 0.3 : this.contentObjects['transparent'];
		};

		this.Generate = function()
		{
			if (!this.isFontsLoaded)
				return;

			if (this.zoom == this.calculatezoom)
				return;

			this.calculatezoom = this.zoom;
			this.privateGenerateShape(this.contentObjects);
			//console.log( this.image.toDataURL("image/png"));
		};

		this.Draw = function(context, dw_or_dx, dh_or_dy, dw, dh)
		{
			if (!this.image || !this.isFontsLoaded)
				return;

			var x = 0;
			var y = 0;

			if (undefined == dw)
			{
				x = (dw_or_dx - this.width) >> 1;
				y = (dh_or_dy - this.height) >> 1;
			}
			else
			{
				x = (dw_or_dx + ((dw - this.width) / 2)) >> 0;
				y = (dh_or_dy + ((dh - this.height) / 2)) >> 0;
			}
			var oldGlobalAlpha = context.globalAlpha;
			context.globalAlpha = this.transparent;
			context.drawImage(this.image, x, y);
			context.globalAlpha = oldGlobalAlpha;
		};

		this.StartRenderer = function()
		{
			var canvasTransparent = document.createElement("canvas");
			canvasTransparent.width = this.image.width;
			canvasTransparent.height = this.image.height;
			var ctx = canvasTransparent.getContext("2d");
			ctx.globalAlpha = this.transparent;
			ctx.drawImage(this.image, 0, 0);
			this.imageBase64 = canvasTransparent.toDataURL("image/png");
			canvasTransparent = null;
		};
		this.EndRenderer = function()
		{
			delete this.imageBase64;
			this.imageBase64 = undefined;
		};
		this.DrawOnRenderer = function(renderer, w, h)
		{
			var wMM = this.width * AscCommon.g_dKoef_pix_to_mm / this.zoom;
			var hMM = this.height * AscCommon.g_dKoef_pix_to_mm / this.zoom;
			var x = (w - wMM) / 2;
			var y = (h - hMM) / 2;

			renderer.UseOriginImageUrl = true;
			renderer.drawImage(this.imageBase64, x, y, wMM, hMM);
			renderer.UseOriginImageUrl = false;
		};

		this.privateGenerateShape = function(obj)
		{

			AscFormat.ExecuteNoHistory(function(obj) {

                var oShape = new AscFormat.CShape();
                var bWord = false;
                var oApi = Asc['editor'] || editor;
                if(!oApi){
                    return null;
                }
                switch(oApi.getEditorId()){
                    case AscCommon.c_oEditorId.Word:{
                        oShape.setWordShape(true);
                        bWord = true;
                        break;
                    }
                    case AscCommon.c_oEditorId.Presentation:{
                        oShape.setWordShape(false);
                        oShape.setParent(oApi.WordControl.m_oLogicDocument.Slides[oApi.WordControl.m_oLogicDocument.CurPage]);
                        break;
                    }
					case AscCommon.c_oEditorId.Spreadsheet:{
                        oShape.setWordShape(false);
                        oShape.setWorksheet(oApi.wb.getWorksheet().model);
						break;
					}
				}

				var _oldTrackRevision = false;
                if (oApi.getEditorId() == AscCommon.c_oEditorId.Word && oApi.WordControl && oApi.WordControl.m_oLogicDocument)
                    _oldTrackRevision = oApi.WordControl.m_oLogicDocument.TrackRevisions;

                if (_oldTrackRevision)
                    oApi.WordControl.m_oLogicDocument.TrackRevisions = false;

                var bRemoveDocument = false;
                if(oApi.WordControl && !oApi.WordControl.m_oLogicDocument)
				{
					bRemoveDocument = true;
					oApi.WordControl.m_oLogicDocument = new AscCommonWord.CDocument();
					oApi.WordControl.m_oDrawingDocument.m_oLogicDocument = oApi.WordControl.m_oLogicDocument;
				}
                oShape.setBDeleted(false);
				oShape.spPr = new AscFormat.CSpPr();
				oShape.spPr.setParent(oShape);
				oShape.spPr.setXfrm(new AscFormat.CXfrm());
				oShape.spPr.xfrm.setParent(oShape.spPr);
				oShape.spPr.xfrm.setOffX(0);
				oShape.spPr.xfrm.setOffY(0);
				oShape.spPr.xfrm.setExtX(obj['width']);
				oShape.spPr.xfrm.setExtY(obj['height']);
				oShape.spPr.xfrm.setRot(AscFormat.normalizeRotate(obj['rotate'] ? (obj['rotate'] * Math.PI / 180) : 0));
				oShape.spPr.setGeometry(AscFormat.CreateGeometry(obj['type']));
				if(obj['fill'] && obj['fill'].length === 3){
					oShape.spPr.setFill(AscFormat.CreteSolidFillRGB(obj['fill'][0], obj['fill'][1], obj['fill'][2]));
				}
				if(AscFormat.isRealNumber(obj['stroke-width']) || Array.isArray(obj['stroke']) && obj['stroke'].length === 3){
					var oUnifill;
					if(Array.isArray(obj['stroke']) && obj['stroke'].length === 3){
						oUnifill = AscFormat.CreteSolidFillRGB(obj['stroke'][0], obj['stroke'][1], obj['stroke'][2]);
					}
					else{
						oUnifill = AscFormat.CreteSolidFillRGB(0, 0, 0);
					}
					oShape.spPr.setLn(AscFormat.CreatePenFromParams(oUnifill, undefined, undefined, undefined, undefined, AscFormat.isRealNumber(obj['stroke-width']) ? obj['stroke-width'] : 12700.0/36000.0))
				}

				if(bWord){
					oShape.createTextBoxContent();
				}
				else{
					oShape.createTextBody();
				}
				var align = obj['align'];
				if(undefined != align){
					oShape.setVerticalAlign(align);
				}

				if(Array.isArray(obj['margins']) && obj['margins'].length === 4){
					oShape.setPaddings({Left: obj['margins'][0], Top: obj['margins'][1], Right: obj['margins'][2], Bottom: obj['margins'][3]});
				}
				var oContent = oShape.getDocContent();
				var aParagraphsS = obj['paragraphs'];
				if(aParagraphsS.length > 0){
                    oContent.Content.length = 0;
				}
				for(var i = 0; i < aParagraphsS.length; ++i){
					var oCurParS = aParagraphsS[i];
					var oNewParagraph = new AscCommonWord.Paragraph(oContent.DrawingDocument, oContent, !bWord);
					if(AscFormat.isRealNumber(oCurParS['align'])){
						oNewParagraph.Set_Align(oCurParS['align'])
					}
					if(Array.isArray(oCurParS['fill']) && oCurParS['fill'].length === 3){
						var oShd = new AscCommonWord.CDocumentShd();
						oShd.Value = Asc.c_oAscShdClear;
						oShd.Color.r = oCurParS['fill'][0];
						oShd.Color.g = oCurParS['fill'][1];
						oShd.Color.b = oCurParS['fill'][2];
						oNewParagraph.Set_Shd(oShd, true);
					}
					if(AscFormat.isRealNumber(oCurParS['linespacing'])){
						oNewParagraph.Set_Spacing({Line: oCurParS['linespacing'], Before: 0, After: 0, LineRule: Asc.linerule_Auto}, true);
					}
					var aRunsS = oCurParS['runs'];
					for(var j = 0; j < aRunsS.length; ++j){
						var oRunS = aRunsS[j];
						var oRun = new AscCommonWord.ParaRun(oNewParagraph, false);
						if(Array.isArray(oRunS['fill']) && oRunS['fill'].length === 3){
							oRun.Set_Unifill(AscFormat.CreteSolidFillRGB(oRunS['fill'][0], oRunS['fill'][1], oRunS['fill'][2]));
						}
						var fontFamilyName = oRunS['font-family'] ? oRunS['font-family'] : "Arial";
						var fontSize = (oRunS['font-size'] != null) ? oRunS['font-size'] : 50;

						oRun.Set_RFonts_Ascii({Name : fontFamilyName, Index : -1});
						oRun.Set_RFonts_CS({Name : fontFamilyName, Index : -1});
						oRun.Set_RFonts_EastAsia({Name : fontFamilyName, Index : -1});
						oRun.Set_RFonts_HAnsi({Name : fontFamilyName, Index : -1});

						oRun.Set_FontSize(fontSize);

						oRun.Set_Bold(oRunS['bold'] === true);
						oRun.Set_Italic(oRunS['italic'] === true);
						oRun.Set_Strikeout(oRunS['strikeout'] === true);
						oRun.Set_Underline(oRunS['underline'] === true);

						var sCustomText = oRunS['text'];
						if(sCustomText === "<%br%>"){
							oRun.AddToContent(0, new AscCommonWord.ParaNewLine(AscCommonWord.break_Line), false);
						}
						else{
							oRun.AddText(sCustomText);
						}

						oNewParagraph.Internal_Content_Add(j, oRun, false);
					}
					oContent.Internal_Content_Add(oContent.Content.length, oNewParagraph);
				}

				var bLoad = AscCommon.g_oIdCounter.m_bLoad;
				AscCommon.g_oIdCounter.Set_Load(false);
				oShape.recalculate();
				if (oShape.bWordShape)
				{
					oShape.recalculateText();
				}

				AscCommon.g_oIdCounter.Set_Load(bLoad);
				var oldShowParaMarks;
				if (window.editor)
				{
					oldShowParaMarks = oApi.ShowParaMarks;
                    oApi.ShowParaMarks = false;
				}

				AscCommon.IsShapeToImageConverter = true;
				var _bounds_cheker = new AscFormat.CSlideBoundsChecker();

				var w_mm = 210;
				var h_mm = 297;
				var w_px = AscCommon.AscBrowser.convertToRetinaValue(w_mm * AscCommon.g_dKoef_mm_to_pix * this.zoom, true);
				var h_px = AscCommon.AscBrowser.convertToRetinaValue(h_mm * AscCommon.g_dKoef_mm_to_pix * this.zoom, true);

				_bounds_cheker.init(w_px, h_px, w_mm, h_mm);
				_bounds_cheker.transform(1,0,0,1,0,0);

				_bounds_cheker.AutoCheckLineWidth = true;
				_bounds_cheker.CheckLineWidth(oShape);
				oShape.draw(_bounds_cheker, 0);
				_bounds_cheker.CorrectBounds2();

				var _need_pix_width     = _bounds_cheker.Bounds.max_x - _bounds_cheker.Bounds.min_x + 1;
				var _need_pix_height    = _bounds_cheker.Bounds.max_y - _bounds_cheker.Bounds.min_y + 1;

				if (_need_pix_width <= 0 || _need_pix_height <= 0)
					return;

				if (!this.image)
					this.image = document.createElement("canvas");

				this.image.width = _need_pix_width;
				this.image.height = _need_pix_height;
				this.width = _need_pix_width;
				this.height = _need_pix_height;

				var _ctx = this.image.getContext('2d');

				var g = new AscCommon.CGraphics();
				g.init(_ctx, w_px, h_px, w_mm, h_mm);
				g.m_oFontManager = AscCommon.g_fontManager;

				g.m_oCoordTransform.tx = -_bounds_cheker.Bounds.min_x;
				g.m_oCoordTransform.ty = -_bounds_cheker.Bounds.min_y;
				g.transform(1,0,0,1,0,0);

				oShape.draw(g, 0);

				AscCommon.IsShapeToImageConverter = false;

				if(bRemoveDocument)
				{
					oApi.WordControl.m_oLogicDocument = null;
					oApi.WordControl.m_oDrawingDocument.m_oLogicDocument = null;
				}
				if (window.editor)
				{
                    oApi.ShowParaMarks = oldShowParaMarks;
				}

				if (_oldTrackRevision)
					oApi.WordControl.m_oLogicDocument.TrackRevisions = true;

			}, this, [obj]);

		};

		this.onReady = function()
		{
			this.isFontsLoaded = true;
            var oApi = this.api;

            switch (oApi.editorId)
            {
                case AscCommon.c_oEditorId.Word:
                {
                    if (oApi.WordControl)
                    {
                        if (oApi.watermarkDraw)
                        {
                            oApi.watermarkDraw.zoom = oApi.WordControl.m_nZoomValue / 100;
                            oApi.watermarkDraw.Generate();
                        }

                        oApi.WordControl.OnRePaintAttack();
                    }

                    break;
                }
                case AscCommon.c_oEditorId.Presentation:
                {
                    if (oApi.WordControl)
                    {
                        if (oApi.watermarkDraw)
                        {
                            oApi.watermarkDraw.zoom = oApi.WordControl.m_nZoomValue / 100;
                            oApi.watermarkDraw.Generate();
                        }

                        oApi.WordControl.OnRePaintAttack();
                    }
                    break;
                }
                case AscCommon.c_oEditorId.Spreadsheet:
                {
                    var ws = oApi.wb && oApi.wb.getWorksheet();
                    if (ws && ws.objectRender && ws.objectRender)
                    {
                        ws.objectRender.OnUpdateOverlay();
                    }
                    break;
                }
            }
		};

		this.checkOnReady = function()
		{
            this.CheckParams();

            var fonts = [];
            var pars = this.contentObjects['paragraphs'];
            var i, j;
            for (i = 0; i < pars.length; i++)
            {
                var runs = pars[i]['runs'];
                for (j = 0; j < runs.length; j++)
                {
                	if (undefined === runs[j]["font-family"])
                        runs[j]["font-family"] = "Arial";
                	fonts.push(runs[j]["font-family"]);
                }
            }

            for (i = 0; i < fonts.length; i++)
            {
                fonts[i] = new AscFonts.CFont(AscFonts.g_fontApplication.GetFontInfoName(fonts[i]), 0, "", 0, null);
            }

			if (false === AscCommon.g_font_loader.CheckFontsNeedLoading(fonts))
            {
                this.onReady();
                return false;
            }

            this.api.asyncMethodCallback = function() {
                var oApi = Asc['editor'] || editor;
                oApi.watermarkDraw.onReady();
            };

            AscCommon.g_font_loader.LoadDocumentFonts2(fonts);
		}
	}

	// ----------------------------- plugins ------------------------------- //
	function CPluginVariation()
	{
		this.description = "";
		this.url         = "";
		this.baseUrl     = "";
		this.index       = 0;     // сверху не выставляем. оттуда в каком порядке пришли - в таком порядке и работают

		this.icons          = ["1x", "2x"];
		this.isViewer       = false;
		this.EditorsSupport = ["word", "cell", "slide"];

		this.isSystem	  = false;
		this.isVisual     = false;      // визуальный ли
		this.isModal      = false;      // модальное ли окно (используется только для визуального)
		this.isInsideMode = false;      // отрисовка не в окне а внутри редактора (в панели) (используется только для визуального немодального)
		this.isCustomWindow = false;	// ued only if this.isModal == true

		this.initDataType = EPluginDataType.none;
		this.initData     = "";

		this.isUpdateOleOnResize = false;

		this.buttons = [{"text" : "Ok", "primary" : true}, {"text" : "Cancel", "primary" : false}];

		this.size = undefined;
		this.initOnSelectionChanged = undefined;

		this.events = [];
		this.eventsMap = {};
	}

	CPluginVariation.prototype["get_Description"] = function()
	{
		return this.description;
	};
	CPluginVariation.prototype["set_Description"] = function(value)
	{
		this.description = value;
	};
	CPluginVariation.prototype["get_Url"]         = function()
	{
		return this.url;
	};
	CPluginVariation.prototype["set_Url"]         = function(value)
	{
		this.url = value;
	};

	CPluginVariation.prototype["get_Icons"] = function()
	{
		return this.icons;
	};
	CPluginVariation.prototype["set_Icons"] = function(value)
	{
		this.icons = value;
	};

	CPluginVariation.prototype["get_System"]         = function()
	{
		return this.isSystem;
	};
	CPluginVariation.prototype["set_System"]         = function(value)
	{
		this.isSystem = value;
	};
	CPluginVariation.prototype["get_Viewer"]         = function()
	{
		return this.isViewer;
	};
	CPluginVariation.prototype["set_Viewer"]         = function(value)
	{
		this.isViewer = value;
	};
	CPluginVariation.prototype["get_EditorsSupport"] = function()
	{
		return this.EditorsSupport;
	};
	CPluginVariation.prototype["set_EditorsSupport"] = function(value)
	{
		this.EditorsSupport = value;
	};


	CPluginVariation.prototype["get_Visual"]     = function()
	{
		return this.isVisual;
	};
	CPluginVariation.prototype["set_Visual"]     = function(value)
	{
		this.isVisual = value;
	};
	CPluginVariation.prototype["get_Modal"]      = function()
	{
		return this.isModal;
	};
	CPluginVariation.prototype["set_Modal"]      = function(value)
	{
		this.isModal = value;
	};
	CPluginVariation.prototype["get_InsideMode"] = function()
	{
		return this.isInsideMode;
	};
	CPluginVariation.prototype["set_InsideMode"] = function(value)
	{
		this.isInsideMode = value;
	};
	CPluginVariation.prototype["get_CustomWindow"] = function()
	{
		return this.isCustomWindow;
	};
	CPluginVariation.prototype["set_CustomWindow"] = function(value)
	{
		this.isCustomWindow = value;
	};

	CPluginVariation.prototype["get_InitDataType"] = function()
	{
		return this.initDataType;
	};
	CPluginVariation.prototype["set_InitDataType"] = function(value)
	{
		this.initDataType = value;
	};
	CPluginVariation.prototype["get_InitData"]     = function()
	{
		return this.initData;
	};
	CPluginVariation.prototype["set_InitData"]     = function(value)
	{
		this.initData = value;
	};

	CPluginVariation.prototype["get_UpdateOleOnResize"] = function()
	{
		return this.isUpdateOleOnResize;
	};
	CPluginVariation.prototype["set_UpdateOleOnResize"] = function(value)
	{
		this.isUpdateOleOnResize = value;
	};
	CPluginVariation.prototype["get_Buttons"]           = function()
	{
		return this.buttons;
	};
	CPluginVariation.prototype["set_Buttons"]           = function(value)
	{
		this.buttons = value;
	};
	CPluginVariation.prototype["get_Size"]           = function()
	{
		return this.size;
	};
	CPluginVariation.prototype["set_Size"]           = function(value)
	{
		this.size = value;
	};
	CPluginVariation.prototype["get_InitOnSelectionChanged"]           = function()
	{
		return this.initOnSelectionChanged;
	};
	CPluginVariation.prototype["set_InitOnSelectionChanged"]           = function(value)
	{
		this.initOnSelectionChanged = value;
	};
    CPluginVariation.prototype["get_Events"]           = function()
    {
        return this.events;
    };
    CPluginVariation.prototype["set_Events"]           = function(value)
    {
    	if (!value)
    		return;

        this.events = value.slice(0, value.length);
        this.eventsMap = {};
        for (var i = 0; i < this.events.length; i++)
        	this.eventsMap[this.events[i]] = true;
    };

	CPluginVariation.prototype["serialize"]   = function()
	{
		var _object            = {};
		_object["description"] = this.description;
		_object["url"]         = this.url;
		_object["index"]       = this.index;

		_object["icons"]          = this.icons;
		_object["isViewer"]       = this.isViewer;
		_object["EditorsSupport"] = this.EditorsSupport;

		_object["isSystem"]     = this.isSystem;
		_object["isVisual"]     = this.isVisual;
		_object["isModal"]      = this.isModal;
		_object["isInsideMode"] = this.isInsideMode;
		_object["isCustomWindow"] = this.isCustomWindow;

		_object["initDataType"] = this.initDataType;
		_object["initData"]     = this.initData;

		_object["isUpdateOleOnResize"] = this.isUpdateOleOnResize;

		_object["buttons"] = this.buttons;

		_object["size"] = this.size;
		_object["initOnSelectionChanged"] = this.initOnSelectionChanged;

		return _object;
	};
	CPluginVariation.prototype["deserialize"] = function(_object)
	{
		this.description = (_object["description"] != null) ? _object["description"] : this.description;
		this.url         = (_object["url"] != null) ? _object["url"] : this.url;
		this.index       = (_object["index"] != null) ? _object["index"] : this.index;

		this.icons          = (_object["icons"] != null) ? _object["icons"] : this.icons;
		this.isViewer       = (_object["isViewer"] != null) ? _object["isViewer"] : this.isViewer;
		this.EditorsSupport = (_object["EditorsSupport"] != null) ? _object["EditorsSupport"] : this.EditorsSupport;

		this.isVisual     = (_object["isVisual"] != null) ? _object["isVisual"] : this.isVisual;
		this.isModal      = (_object["isModal"] != null) ? _object["isModal"] : this.isModal;
		this.isInsideMode = (_object["isInsideMode"] != null) ? _object["isInsideMode"] : this.isInsideMode;
		this.isCustomWindow = (_object["isCustomWindow"] != null) ? _object["isCustomWindow"] : this.isCustomWindow;

		this.initDataType = (_object["initDataType"] != null) ? _object["initDataType"] : this.initDataType;
		this.initData     = (_object["initData"] != null) ? _object["initData"] : this.initData;

		this.isUpdateOleOnResize = (_object["isUpdateOleOnResize"] != null) ? _object["isUpdateOleOnResize"] : this.isUpdateOleOnResize;

		this.buttons = (_object["buttons"] != null) ? _object["buttons"] : this.buttons;

		this.size = (_object["size"] != null) ? _object["size"] : this.size;
		this.initOnSelectionChanged = (_object["initOnSelectionChanged"] != null) ? _object["initOnSelectionChanged"] : this.initOnSelectionChanged;
	};

	function CPlugin()
	{
		this.name    = "";
		this.guid    = "";
		this.baseUrl = "";

		this.variations = [];
	}

	CPlugin.prototype["get_Name"]    = function()
	{
		return this.name;
	};
	CPlugin.prototype["set_Name"]    = function(value)
	{
		this.name = value;
	};
	CPlugin.prototype["get_Guid"]    = function()
	{
		return this.guid;
	};
	CPlugin.prototype["set_Guid"]    = function(value)
	{
		this.guid = value;
	};
	CPlugin.prototype["get_BaseUrl"] = function()
	{
		return this.baseUrl;
	};
	CPlugin.prototype["set_BaseUrl"] = function(value)
	{
		this.baseUrl = value;
	};

	CPlugin.prototype["get_Variations"] = function()
	{
		return this.variations;
	};
	CPlugin.prototype["set_Variations"] = function(value)
	{
		this.variations = value;
	};

	CPlugin.prototype["serialize"]   = function()
	{
		var _object           = {};
		_object["name"]       = this.name;
		_object["guid"]       = this.guid;
		_object["baseUrl"]    = this.baseUrl;
		_object["variations"] = [];
		for (var i = 0; i < this.variations.length; i++)
		{
			_object["variations"].push(this.variations[i].serialize());
		}
		return _object;
	};
	CPlugin.prototype["deserialize"] = function(_object)
	{
		this.name       = (_object["name"] != null) ? _object["name"] : this.name;
		this.guid       = (_object["guid"] != null) ? _object["guid"] : this.guid;
		this.baseUrl    = (_object["baseUrl"] != null) ? _object["baseUrl"] : this.baseUrl;
		this.variations = [];
		for (var i = 0; i < _object["variations"].length; i++)
		{
			var _variation = new CPluginVariation();
			_variation["deserialize"](_object["variations"][i]);
			this.variations.push(_variation);
		}
	};

    /*
     * Export
     * -----------------------------------------------------------------------------
     */
	window['AscCommon'] = window['AscCommon'] || {};
	window['Asc'] = window['Asc'] || {};

	window['Asc']['c_oAscArrUserColors'] = window['Asc'].c_oAscArrUserColors = c_oAscArrUserColors;

	window["AscCommon"].CreateAscColorCustom = CreateAscColorCustom;
	window["AscCommon"].CreateAscColor = CreateAscColor;
	window["AscCommon"].CreateGUID = CreateGUID;
	window["AscCommon"].CreateUInt32 = CreateUInt32;

	window['Asc']['c_oLicenseResult'] = window['Asc'].c_oLicenseResult = c_oLicenseResult;
	prot = c_oLicenseResult;
	prot['Error'] = prot.Error;
	prot['Expired'] = prot.Expired;
	prot['Success'] = prot.Success;
	prot['UnknownUser'] = prot.UnknownUser;
	prot['Connections'] = prot.Connections;
	prot['ExpiredTrial'] = prot.ExpiredTrial;
	prot['SuccessLimit'] = prot.SuccessLimit;
	prot['UsersCount'] = prot.UsersCount;
	prot['ConnectionsOS'] = prot.ConnectionsOS;
	prot['UsersCountOS'] = prot.UsersCountOS;

	window['Asc']['c_oRights'] = window['Asc'].c_oRights = c_oRights;
	prot = c_oRights;
	prot['None'] = prot.None;
	prot['Edit'] = prot.Edit;
	prot['Review'] = prot.Review;
	prot['Comment'] = prot.Comment;
	prot['View'] = prot.View;

	window['Asc']['c_oLicenseMode'] = window['Asc'].c_oLicenseMode = c_oLicenseMode;
	prot = c_oLicenseMode;
	prot['None'] = prot.None;
	prot['Trial'] = prot.Trial;
	prot['Developer'] = prot.Developer;

	window["Asc"]["EPluginDataType"] = window["Asc"].EPluginDataType = EPluginDataType;
	prot         = EPluginDataType;
	prot['none'] = prot.none;
	prot['text'] = prot.text;
	prot['ole']  = prot.ole;
	prot['html'] = prot.html;

	window["AscCommon"]["asc_CSignatureLine"] = window["AscCommon"].asc_CSignatureLine = asc_CSignatureLine;
	prot = asc_CSignatureLine.prototype;
	prot["asc_getId"] = prot.asc_getId;
	prot["asc_setId"] = prot.asc_setId;
	prot["asc_getGuid"] = prot.asc_getGuid;
	prot["asc_setGuid"] = prot.asc_setGuid;
	prot["asc_getSigner1"] = prot.asc_getSigner1;
	prot["asc_setSigner1"] = prot.asc_setSigner1;
	prot["asc_getSigner2"] = prot.asc_getSigner2;
	prot["asc_setSigner2"] = prot.asc_setSigner2;
	prot["asc_getEmail"] = prot.asc_getEmail;
	prot["asc_setEmail"] = prot.asc_setEmail;
	prot["asc_getInstructions"] = prot.asc_getInstructions;
	prot["asc_setInstructions"] = prot.asc_setInstructions;
	prot["asc_getShowDate"] = prot.asc_getShowDate;
	prot["asc_setShowDate"] = prot.asc_setShowDate;
	prot["asc_getValid"] = prot.asc_getValid;
	prot["asc_setValid"] = prot.asc_setValid;
	prot["asc_getDate"] = prot.asc_getDate;
	prot["asc_setDate"] = prot.asc_setDate;
	prot["asc_getVisible"] = prot.asc_getVisible;
	prot["asc_setVisible"] = prot.asc_setVisible;
	prot["asc_getRequested"] = prot.asc_getRequested;
	prot["asc_setRequested"] = prot.asc_setRequested;

	window["AscCommon"].asc_CAscEditorPermissions = asc_CAscEditorPermissions;
	prot = asc_CAscEditorPermissions.prototype;
	prot["asc_getLicenseType"] = prot.asc_getLicenseType;
	prot["asc_getCanCoAuthoring"] = prot.asc_getCanCoAuthoring;
	prot["asc_getCanReaderMode"] = prot.asc_getCanReaderMode;
	prot["asc_getCanBranding"] = prot.asc_getCanBranding;
	prot["asc_getCustomization"] = prot.asc_getCustomization;
	prot["asc_getIsAutosaveEnable"] = prot.asc_getIsAutosaveEnable;
	prot["asc_getAutosaveMinInterval"] = prot.asc_getAutosaveMinInterval;
	prot["asc_getIsAnalyticsEnable"] = prot.asc_getIsAnalyticsEnable;
	prot["asc_getIsLight"] = prot.asc_getIsLight;
	prot["asc_getLicenseMode"] = prot.asc_getLicenseMode;
	prot["asc_getRights"] = prot.asc_getRights;
	prot["asc_getBuildVersion"] = prot.asc_getBuildVersion;
	prot["asc_getBuildNumber"] = prot.asc_getBuildNumber;

	window["AscCommon"].asc_ValAxisSettings = asc_ValAxisSettings;
	prot = asc_ValAxisSettings.prototype;
	prot["putMinValRule"] = prot.putMinValRule;
	prot["putMinVal"] = prot.putMinVal;
	prot["putMaxValRule"] = prot.putMaxValRule;
	prot["putMaxVal"] = prot.putMaxVal;
	prot["putInvertValOrder"] = prot.putInvertValOrder;
	prot["putLogScale"] = prot.putLogScale;
	prot["putLogBase"] = prot.putLogBase;
	prot["putUnits"] = prot.putUnits;
	prot["putShowUnitsOnChart"] = prot.putShowUnitsOnChart;
	prot["putMajorTickMark"] = prot.putMajorTickMark;
	prot["putMinorTickMark"] = prot.putMinorTickMark;
	prot["putTickLabelsPos"] = prot.putTickLabelsPos;
	prot["putCrossesRule"] = prot.putCrossesRule;
	prot["putCrosses"] = prot.putCrosses;
	prot["putDispUnitsRule"] = prot.putDispUnitsRule;
	prot["getDispUnitsRule"] = prot.getDispUnitsRule;
	prot["putAxisType"] = prot.putAxisType;
	prot["getAxisType"] = prot.getAxisType;
	prot["getMinValRule"] = prot.getMinValRule;
	prot["getMinVal"] = prot.getMinVal;
	prot["getMaxValRule"] = prot.getMaxValRule;
	prot["getMaxVal"] = prot.getMaxVal;
	prot["getInvertValOrder"] = prot.getInvertValOrder;
	prot["getLogScale"] = prot.getLogScale;
	prot["getLogBase"] = prot.getLogBase;
	prot["getUnits"] = prot.getUnits;
	prot["getShowUnitsOnChart"] = prot.getShowUnitsOnChart;
	prot["getMajorTickMark"] = prot.getMajorTickMark;
	prot["getMinorTickMark"] = prot.getMinorTickMark;
	prot["getTickLabelsPos"] = prot.getTickLabelsPos;
	prot["getCrossesRule"] = prot.getCrossesRule;
	prot["getCrosses"] = prot.getCrosses;
	prot["setDefault"] = prot.setDefault;

	window["AscCommon"].asc_CatAxisSettings = asc_CatAxisSettings;
	prot = asc_CatAxisSettings.prototype;
	prot["putIntervalBetweenTick"] = prot.putIntervalBetweenTick;
	prot["putIntervalBetweenLabelsRule"] = prot.putIntervalBetweenLabelsRule;
	prot["putIntervalBetweenLabels"] = prot.putIntervalBetweenLabels;
	prot["putInvertCatOrder"] = prot.putInvertCatOrder;
	prot["putLabelsAxisDistance"] = prot.putLabelsAxisDistance;
	prot["putMajorTickMark"] = prot.putMajorTickMark;
	prot["putMinorTickMark"] = prot.putMinorTickMark;
	prot["putTickLabelsPos"] = prot.putTickLabelsPos;
	prot["putCrossesRule"] = prot.putCrossesRule;
	prot["putCrosses"] = prot.putCrosses;
	prot["putAxisType"] = prot.putAxisType;
	prot["putLabelsPosition"] = prot.putLabelsPosition;
	prot["putCrossMaxVal"] = prot.putCrossMaxVal;
	prot["putCrossMinVal"] = prot.putCrossMinVal;
	prot["getIntervalBetweenTick"] = prot.getIntervalBetweenTick;
	prot["getIntervalBetweenLabelsRule"] = prot.getIntervalBetweenLabelsRule;
	prot["getIntervalBetweenLabels"] = prot.getIntervalBetweenLabels;
	prot["getInvertCatOrder"] = prot.getInvertCatOrder;
	prot["getLabelsAxisDistance"] = prot.getLabelsAxisDistance;
	prot["getMajorTickMark"] = prot.getMajorTickMark;
	prot["getMinorTickMark"] = prot.getMinorTickMark;
	prot["getTickLabelsPos"] = prot.getTickLabelsPos;
	prot["getCrossesRule"] = prot.getCrossesRule;
	prot["getCrosses"] = prot.getCrosses;
	prot["getAxisType"] = prot.getAxisType;
	prot["getLabelsPosition"] = prot.getLabelsPosition;
	prot["getCrossMaxVal"] = prot.getCrossMaxVal;
	prot["getCrossMinVal"] = prot.getCrossMinVal;
	prot["setDefault"] = prot.setDefault;

	window["Asc"]["asc_ChartSettings"] = window["Asc"].asc_ChartSettings = asc_ChartSettings;
	prot = asc_ChartSettings.prototype;
	prot["putStyle"] = prot.putStyle;
	prot["putTitle"] = prot.putTitle;
	prot["putRowCols"] = prot.putRowCols;
	prot["putHorAxisLabel"] = prot.putHorAxisLabel;
	prot["putVertAxisLabel"] = prot.putVertAxisLabel;
	prot["putLegendPos"] = prot.putLegendPos;
	prot["putDataLabelsPos"] = prot.putDataLabelsPos;
	prot["putCatAx"] = prot.putCatAx;
	prot["putValAx"] = prot.putValAx;
	prot["getStyle"] = prot.getStyle;
	prot["getTitle"] = prot.getTitle;
	prot["getRowCols"] = prot.getRowCols;
	prot["getHorAxisLabel"] = prot.getHorAxisLabel;
	prot["getVertAxisLabel"] = prot.getVertAxisLabel;
	prot["getLegendPos"] = prot.getLegendPos;
	prot["getDataLabelsPos"] = prot.getDataLabelsPos;
	prot["getHorAx"] = prot.getHorAx;
	prot["getVertAx"] = prot.getVertAx;
	prot["getHorGridLines"] = prot.getHorGridLines;
	prot["putHorGridLines"] = prot.putHorGridLines;
	prot["getVertGridLines"] = prot.getVertGridLines;
	prot["putVertGridLines"] = prot.putVertGridLines;
	prot["getType"] = prot.getType;
	prot["putType"] = prot.putType;
	prot["putShowSerName"] = prot.putShowSerName;
	prot["getShowSerName"] = prot.getShowSerName;
	prot["putShowCatName"] = prot.putShowCatName;
	prot["getShowCatName"] = prot.getShowCatName;
	prot["putShowVal"] = prot.putShowVal;
	prot["getShowVal"] = prot.getShowVal;
	prot["putSeparator"] = prot.putSeparator;
	prot["getSeparator"] = prot.getSeparator;
	prot["putHorAxisProps"] = prot.putHorAxisProps;
	prot["getHorAxisProps"] = prot.getHorAxisProps;
	prot["putVertAxisProps"] = prot.putVertAxisProps;
	prot["getVertAxisProps"] = prot.getVertAxisProps;
	prot["putRange"] = prot.putRange;
	prot["getRange"] = prot.getRange;
	prot["putRanges"] = prot.putRanges;
	prot["getRanges"] = prot.getRanges;
	prot["putInColumns"] = prot.putInColumns;
	prot["getInColumns"] = prot.getInColumns;
	prot["putShowMarker"] = prot.putShowMarker;
	prot["getShowMarker"] = prot.getShowMarker;
	prot["putLine"] = prot.putLine;
	prot["getLine"] = prot.getLine;
	prot["putSmooth"] = prot.putSmooth;
	prot["getSmooth"] = prot.getSmooth;
	prot["changeType"] = prot.changeType;
	prot["putShowHorAxis"] = prot.putShowHorAxis;
	prot["getShowHorAxis"] = prot.getShowHorAxis;
	prot["putShowVerAxis"] = prot.putShowVerAxis;
	prot["getShowVerAxis"] = prot.getShowVerAxis;

	window["AscCommon"].asc_CRect = asc_CRect;
	prot = asc_CRect.prototype;
	prot["asc_getX"] = prot.asc_getX;
	prot["asc_getY"] = prot.asc_getY;
	prot["asc_getWidth"] = prot.asc_getWidth;
	prot["asc_getHeight"] = prot.asc_getHeight;

	window["AscCommon"].CColor = CColor;
	prot = CColor.prototype;
	prot["getR"] = prot.getR;
	prot["get_r"] = prot.get_r;
	prot["put_r"] = prot.put_r;
	prot["getG"] = prot.getG;
	prot["get_g"] = prot.get_g;
	prot["put_g"] = prot.put_g;
	prot["getB"] = prot.getB;
	prot["get_b"] = prot.get_b;
	prot["put_b"] = prot.put_b;
	prot["getA"] = prot.getA;
	prot["get_hex"] = prot.get_hex;

	window["Asc"]["asc_CColor"] = window["Asc"].asc_CColor = asc_CColor;
	prot = asc_CColor.prototype;
	prot["get_r"] = prot["asc_getR"] = prot.asc_getR;
	prot["put_r"] = prot["asc_putR"] = prot.asc_putR;
	prot["get_g"] = prot["asc_getG"] = prot.asc_getG;
	prot["put_g"] = prot["asc_putG"] = prot.asc_putG;
	prot["get_b"] = prot["asc_getB"] = prot.asc_getB;
	prot["put_b"] = prot["asc_putB"] = prot.asc_putB;
	prot["get_a"] = prot["asc_getA"] = prot.asc_getA;
	prot["put_a"] = prot["asc_putA"] = prot.asc_putA;
	prot["get_auto"] = prot["asc_getAuto"] = prot.asc_getAuto;
	prot["put_auto"] = prot["asc_putAuto"] = prot.asc_putAuto;
	prot["get_type"] = prot["asc_getType"] = prot.asc_getType;
	prot["put_type"] = prot["asc_putType"] = prot.asc_putType;
	prot["get_value"] = prot["asc_getValue"] = prot.asc_getValue;
	prot["put_value"] = prot["asc_putValue"] = prot.asc_putValue;
	prot["get_hex"] = prot["asc_getHex"] = prot.asc_getHex;
	prot["get_color"] = prot["asc_getColor"] = prot.asc_getColor;
	prot["get_hex"] = prot["asc_getHex"] = prot.asc_getHex;

	window["Asc"]["asc_CTextBorder"] = window["Asc"].asc_CTextBorder = asc_CTextBorder;
	prot = asc_CTextBorder.prototype;
	prot["get_Color"] = prot["asc_getColor"] = prot.asc_getColor;
	prot["put_Color"] = prot["asc_putColor"] = prot.asc_putColor;
	prot["get_Size"] = prot["asc_getSize"] = prot.asc_getSize;
	prot["put_Size"] = prot["asc_putSize"] = prot.asc_putSize;
	prot["get_Value"] = prot["asc_getValue"] = prot.asc_getValue;
	prot["put_Value"] = prot["asc_putValue"] = prot.asc_putValue;
	prot["get_Space"] = prot["asc_getSpace"] = prot.asc_getSpace;
	prot["put_Space"] = prot["asc_putSpace"] = prot.asc_putSpace;
	prot["get_ForSelectedCells"] = prot["asc_getForSelectedCells"] = prot.asc_getForSelectedCells;
	prot["put_ForSelectedCells"] = prot["asc_putForSelectedCells"] = prot.asc_putForSelectedCells;

	window["Asc"]["asc_CParagraphBorders"] = window["Asc"].asc_CParagraphBorders = asc_CParagraphBorders;
	prot = asc_CParagraphBorders.prototype;
	prot["get_Left"] = prot["asc_getLeft"] = prot.asc_getLeft;
	prot["put_Left"] = prot["asc_putLeft"] = prot.asc_putLeft;
	prot["get_Top"] = prot["asc_getTop"] = prot.asc_getTop;
	prot["put_Top"] = prot["asc_putTop"] = prot.asc_putTop;
	prot["get_Right"] = prot["asc_getRight"] = prot.asc_getRight;
	prot["put_Right"] = prot["asc_putRight"] = prot.asc_putRight;
	prot["get_Bottom"] = prot["asc_getBottom"] = prot.asc_getBottom;
	prot["put_Bottom"] = prot["asc_putBottom"] = prot.asc_putBottom;
	prot["get_Between"] = prot["asc_getBetween"] = prot.asc_getBetween;
	prot["put_Between"] = prot["asc_putBetween"] = prot.asc_putBetween;

	window["AscCommon"].asc_CListType = asc_CListType;
	prot = asc_CListType.prototype;
	prot["get_ListType"] = prot["asc_getListType"] = prot.asc_getListType;
	prot["get_ListSubType"] = prot["asc_getListSubType"] = prot.asc_getListSubType;

	window["AscCommon"].asc_CTextFontFamily = asc_CTextFontFamily;
	window["AscCommon"]["asc_CTextFontFamily"] = asc_CTextFontFamily;
	prot = asc_CTextFontFamily.prototype;
	prot["get_Name"] = prot["asc_getName"] = prot.get_Name = prot.asc_getName;
	prot["get_Index"] = prot["asc_getIndex"] = prot.get_Index = prot.asc_getIndex;
	prot["put_Name"] = prot["asc_putName"] = prot.put_Name = prot.asc_putName;
	prot["put_Index"] = prot["asc_putIndex"] = prot.put_Index = prot.asc_putIndex;

	window["Asc"]["asc_CParagraphTab"] = window["Asc"].asc_CParagraphTab = asc_CParagraphTab;
	prot = asc_CParagraphTab.prototype;
	prot["get_Value"] = prot["asc_getValue"] = prot.asc_getValue;
	prot["put_Value"] = prot["asc_putValue"] = prot.asc_putValue;
	prot["get_Pos"] = prot["asc_getPos"] = prot.asc_getPos;
	prot["put_Pos"] = prot["asc_putPos"] = prot.asc_putPos;
	prot["get_Leader"] = prot["asc_getLeader"] = prot.asc_getLeader;
	prot["put_Leader"] = prot["asc_putLeader"] = prot.asc_putLeader;

	window["Asc"]["asc_CParagraphTabs"] = window["Asc"].asc_CParagraphTabs = asc_CParagraphTabs;
	prot = asc_CParagraphTabs.prototype;
	prot["get_Count"] = prot["asc_getCount"] = prot.asc_getCount;
	prot["get_Tab"] = prot["asc_getTab"] = prot.asc_getTab;
	prot["add_Tab"] = prot["asc_addTab"] = prot.asc_addTab;
	prot["clear"] = prot.clear = prot["asc_clear"] = prot.asc_clear;

	window["Asc"]["asc_CParagraphShd"] = window["Asc"].asc_CParagraphShd = asc_CParagraphShd;
	prot = asc_CParagraphShd.prototype;
	prot["get_Value"] = prot["asc_getValue"] = prot.asc_getValue;
	prot["put_Value"] = prot["asc_putValue"] = prot.asc_putValue;
	prot["get_Color"] = prot["asc_getColor"] = prot.asc_getColor;
	prot["put_Color"] = prot["asc_putColor"] = prot.asc_putColor;

	window["Asc"]["asc_CParagraphFrame"] = window["Asc"].asc_CParagraphFrame = asc_CParagraphFrame;
	prot = asc_CParagraphFrame.prototype;
	prot["asc_getDropCap"] = prot["get_DropCap"] = prot.asc_getDropCap;
	prot["asc_putDropCap"] = prot["put_DropCap"] = prot.asc_putDropCap;
	prot["asc_getH"] = prot["get_H"] = prot.asc_getH;
	prot["asc_putH"] = prot["put_H"] = prot.asc_putH;
	prot["asc_getHAnchor"] = prot["get_HAnchor"] = prot.asc_getHAnchor;
	prot["asc_putHAnchor"] = prot["put_HAnchor"] = prot.asc_putHAnchor;
	prot["asc_getHRule"] = prot["get_HRule"] = prot.asc_getHRule;
	prot["asc_putHRule"] = prot["put_HRule"] = prot.asc_putHRule;
	prot["asc_getHSpace"] = prot["get_HSpace"] = prot.asc_getHSpace;
	prot["asc_putHSpace"] = prot["put_HSpace"] = prot.asc_putHSpace;
	prot["asc_getLines"] = prot["get_Lines"] = prot.asc_getLines;
	prot["asc_putLines"] = prot["put_Lines"] = prot.asc_putLines;
	prot["asc_getVAnchor"] = prot["get_VAnchor"] = prot.asc_getVAnchor;
	prot["asc_putVAnchor"] = prot["put_VAnchor"] = prot.asc_putVAnchor;
	prot["asc_getVSpace"] = prot["get_VSpace"] = prot.asc_getVSpace;
	prot["asc_putVSpace"] = prot["put_VSpace"] = prot.asc_putVSpace;
	prot["asc_getW"] = prot["get_W"] = prot.asc_getW;
	prot["asc_putW"] = prot["put_W"] = prot.asc_putW;
	prot["asc_getWrap"] = prot["get_Wrap"] = prot.asc_getWrap;
	prot["asc_putWrap"] = prot["put_Wrap"] = prot.asc_putWrap;
	prot["asc_getX"] = prot["get_X"] = prot.asc_getX;
	prot["asc_putX"] = prot["put_X"] = prot.asc_putX;
	prot["asc_getXAlign"] = prot["get_XAlign"] = prot.asc_getXAlign;
	prot["asc_putXAlign"] = prot["put_XAlign"] = prot.asc_putXAlign;
	prot["asc_getY"] = prot["get_Y"] = prot.asc_getY;
	prot["asc_putY"] = prot["put_Y"] = prot.asc_putY;
	prot["asc_getYAlign"] = prot["get_YAlign"] = prot.asc_getYAlign;
	prot["asc_putYAlign"] = prot["put_YAlign"] = prot.asc_putYAlign;
	prot["asc_getBorders"] = prot["get_Borders"] = prot.asc_getBorders;
	prot["asc_putBorders"] = prot["put_Borders"] = prot.asc_putBorders;
	prot["asc_getShade"] = prot["get_Shade"] = prot.asc_getShade;
	prot["asc_putShade"] = prot["put_Shade"] = prot.asc_putShade;
	prot["asc_getFontFamily"] = prot["get_FontFamily"] = prot.asc_getFontFamily;
	prot["asc_putFontFamily"] = prot["put_FontFamily"] = prot.asc_putFontFamily;
	prot["asc_putFromDropCapMenu"] = prot["put_FromDropCapMenu"] = prot.asc_putFromDropCapMenu;

	window["AscCommon"].asc_CParagraphSpacing = asc_CParagraphSpacing;
	prot = asc_CParagraphSpacing.prototype;
	prot["get_Line"] = prot["asc_getLine"] = prot.asc_getLine;
	prot["put_Line"] = prot["asc_putLine"] = prot.asc_putLine;
	prot["get_LineRule"] = prot["asc_getLineRule"] = prot.asc_getLineRule;
	prot["put_LineRule"] = prot["asc_putLineRule"] = prot.asc_putLineRule;
	prot["get_Before"] = prot["asc_getBefore"] = prot.asc_getBefore;
	prot["put_Before"] = prot["asc_putBefore"] = prot.asc_putBefore;
	prot["get_After"] = prot["asc_getAfter"] = prot.asc_getAfter;
	prot["put_After"] = prot["asc_putAfter"] = prot.asc_putAfter;

	window["Asc"]["asc_CParagraphInd"] = window["Asc"].asc_CParagraphInd = asc_CParagraphInd;
	prot = asc_CParagraphInd.prototype;
	prot["get_Left"] = prot["asc_getLeft"] = prot.asc_getLeft;
	prot["put_Left"] = prot["asc_putLeft"] = prot.asc_putLeft;
	prot["get_Right"] = prot["asc_getRight"] = prot.asc_getRight;
	prot["put_Right"] = prot["asc_putRight"] = prot.asc_putRight;
	prot["get_FirstLine"] = prot["asc_getFirstLine"] = prot.asc_getFirstLine;
	prot["put_FirstLine"] = prot["asc_putFirstLine"] = prot.asc_putFirstLine;

	window["Asc"]["asc_CParagraphProperty"] = window["Asc"].asc_CParagraphProperty = asc_CParagraphProperty;
	prot = asc_CParagraphProperty.prototype;
	prot["get_ContextualSpacing"] = prot["asc_getContextualSpacing"] = prot.asc_getContextualSpacing;
	prot["put_ContextualSpacing"] = prot["asc_putContextualSpacing"] = prot.asc_putContextualSpacing;
	prot["get_Ind"] = prot["asc_getInd"] = prot.asc_getInd;
	prot["put_Ind"] = prot["asc_putInd"] = prot.asc_putInd;
	prot["get_Jc"] = prot["asc_getJc"] = prot.asc_getJc;
	prot["put_Jc"] = prot["asc_putJc"] = prot.asc_putJc;
	prot["get_KeepLines"] = prot["asc_getKeepLines"] = prot.asc_getKeepLines;
	prot["put_KeepLines"] = prot["asc_putKeepLines"] = prot.asc_putKeepLines;
	prot["get_KeepNext"] = prot["asc_getKeepNext"] = prot.asc_getKeepNext;
	prot["put_KeepNext"] = prot["asc_putKeepNext"] = prot.asc_putKeepNext;
	prot["get_PageBreakBefore"] = prot["asc_getPageBreakBefore"] = prot.asc_getPageBreakBefore;
	prot["put_PageBreakBefore"] = prot["asc_putPageBreakBefore"] = prot.asc_putPageBreakBefore;
	prot["get_WidowControl"] = prot["asc_getWidowControl"] = prot.asc_getWidowControl;
	prot["put_WidowControl"] = prot["asc_putWidowControl"] = prot.asc_putWidowControl;
	prot["get_Spacing"] = prot["asc_getSpacing"] = prot.asc_getSpacing;
	prot["put_Spacing"] = prot["asc_putSpacing"] = prot.asc_putSpacing;
	prot["get_Borders"] = prot["asc_getBorders"] = prot.asc_getBorders;
	prot["put_Borders"] = prot["asc_putBorders"] = prot.asc_putBorders;
	prot["get_Shade"] = prot["asc_getShade"] = prot.asc_getShade;
	prot["put_Shade"] = prot["asc_putShade"] = prot.asc_putShade;
	prot["get_Locked"] = prot["asc_getLocked"] = prot.asc_getLocked;
	prot["get_CanAddTable"] = prot["asc_getCanAddTable"] = prot.asc_getCanAddTable;
	prot["get_Subscript"] = prot["asc_getSubscript"] = prot.asc_getSubscript;
	prot["put_Subscript"] = prot["asc_putSubscript"] = prot.asc_putSubscript;
	prot["get_Superscript"] = prot["asc_getSuperscript"] = prot.asc_getSuperscript;
	prot["put_Superscript"] = prot["asc_putSuperscript"] = prot.asc_putSuperscript;
	prot["get_SmallCaps"] = prot["asc_getSmallCaps"] = prot.asc_getSmallCaps;
	prot["put_SmallCaps"] = prot["asc_putSmallCaps"] = prot.asc_putSmallCaps;
	prot["get_AllCaps"] = prot["asc_getAllCaps"] = prot.asc_getAllCaps;
	prot["put_AllCaps"] = prot["asc_putAllCaps"] = prot.asc_putAllCaps;
	prot["get_Strikeout"] = prot["asc_getStrikeout"] = prot.asc_getStrikeout;
	prot["put_Strikeout"] = prot["asc_putStrikeout"] = prot.asc_putStrikeout;
	prot["get_DStrikeout"] = prot["asc_getDStrikeout"] = prot.asc_getDStrikeout;
	prot["put_DStrikeout"] = prot["asc_putDStrikeout"] = prot.asc_putDStrikeout;
	prot["get_TextSpacing"] = prot["asc_getTextSpacing"] = prot.asc_getTextSpacing;
	prot["put_TextSpacing"] = prot["asc_putTextSpacing"] = prot.asc_putTextSpacing;
	prot["get_Position"] = prot["asc_getPosition"] = prot.asc_getPosition;
	prot["put_Position"] = prot["asc_putPosition"] = prot.asc_putPosition;
	prot["get_Tabs"] = prot["asc_getTabs"] = prot.asc_getTabs;
	prot["put_Tabs"] = prot["asc_putTabs"] = prot.asc_putTabs;
	prot["get_DefaultTab"] = prot["asc_getDefaultTab"] = prot.asc_getDefaultTab;
	prot["put_DefaultTab"] = prot["asc_putDefaultTab"] = prot.asc_putDefaultTab;
	prot["get_FramePr"] = prot["asc_getFramePr"] = prot.asc_getFramePr;
	prot["put_FramePr"] = prot["asc_putFramePr"] = prot.asc_putFramePr;
	prot["get_CanAddDropCap"] = prot["asc_getCanAddDropCap"] = prot.asc_getCanAddDropCap;
	prot["get_CanAddImage"] = prot["asc_getCanAddImage"] = prot.asc_getCanAddImage;
	prot["get_OutlineLvl"] = prot["asc_getOutlineLvl"] = prot.asc_getOutlineLvl;
	prot["put_OutlineLvl"] = prot["asc_putOutLineLvl"] = prot.asc_putOutLineLvl;
	prot["get_OutlineLvlStyle"] = prot["asc_getOutlineLvlStyle"] = prot.asc_getOutlineLvlStyle;
	prot["put_BulletSize"] = prot["asc_putBulletSize"] = prot.asc_putBulletSize;
	prot["get_BulletSize"] = prot["asc_getBulletSize"] = prot.asc_getBulletSize;
	prot["put_BulletColor"] = prot["asc_putBulletColor"] = prot.asc_putBulletColor;
	prot["get_BulletColor"] = prot["asc_getBulletColor"] = prot.asc_getBulletColor;
	prot["put_NumStartAt"] = prot["asc_putNumStartAt"] = prot.asc_putNumStartAt;
	prot["get_NumStartAt"] = prot["asc_getNumStartAt"] = prot.asc_getNumStartAt;
	prot["get_BulletFont"]   = prot["asc_getBulletFont"] = prot.asc_getBulletFont;
	prot["put_BulletFont"]   = prot["asc_putBulletFont"] = prot.asc_putBulletFont;
	prot["get_BulletSymbol"] = prot["asc_getBulletSymbol"] = prot.asc_getBulletSymbol;
	prot["put_BulletSymbol"] = prot["asc_putBulletSymbol"] = prot.asc_putBulletSymbol;
	prot["can_DeleteBlockContentControl"] = prot["asc_canDeleteBlockContentControl"] = prot.asc_canDeleteBlockContentControl;
	prot["can_EditBlockContentControl"] = prot["asc_canEditBlockContentControl"] = prot.asc_canEditBlockContentControl;
	prot["can_DeleteInlineContentControl"] = prot["asc_canDeleteInlineContentControl"] = prot.asc_canDeleteInlineContentControl;
	prot["can_EditInlineContentControl"] = prot["asc_canEditInlineContentControl"] = prot.asc_canEditInlineContentControl;

	window["AscCommon"].asc_CTexture = asc_CTexture;
	prot = asc_CTexture.prototype;
	prot["get_id"] = prot["asc_getId"] = prot.asc_getId;
	prot["get_image"] = prot["asc_getImage"] = prot.asc_getImage;

	window["AscCommon"].asc_CImageSize = asc_CImageSize;
	prot = asc_CImageSize.prototype;
	prot["get_ImageWidth"] = prot["asc_getImageWidth"] = prot.asc_getImageWidth;
	prot["get_ImageHeight"] = prot["asc_getImageHeight"] = prot.asc_getImageHeight;
	prot["get_IsCorrect"] = prot["asc_getIsCorrect"] = prot.asc_getIsCorrect;

	window["Asc"]["asc_CPaddings"] = window["Asc"].asc_CPaddings = asc_CPaddings;
	prot = asc_CPaddings.prototype;
	prot["get_Left"] = prot["asc_getLeft"] = prot.asc_getLeft;
	prot["put_Left"] = prot["asc_putLeft"] = prot.asc_putLeft;
	prot["get_Top"] = prot["asc_getTop"] = prot.asc_getTop;
	prot["put_Top"] = prot["asc_putTop"] = prot.asc_putTop;
	prot["get_Bottom"] = prot["asc_getBottom"] = prot.asc_getBottom;
	prot["put_Bottom"] = prot["asc_putBottom"] = prot.asc_putBottom;
	prot["get_Right"] = prot["asc_getRight"] = prot.asc_getRight;
	prot["put_Right"] = prot["asc_putRight"] = prot.asc_putRight;

	window["Asc"]["asc_CShapeProperty"] = window["Asc"].asc_CShapeProperty = asc_CShapeProperty;
	prot = asc_CShapeProperty.prototype;
	prot["get_type"] = prot["asc_getType"] = prot.asc_getType;
	prot["put_type"] = prot["asc_putType"] = prot.asc_putType;
	prot["get_fill"] = prot["asc_getFill"] = prot.asc_getFill;
	prot["put_fill"] = prot["asc_putFill"] = prot.asc_putFill;
	prot["get_stroke"] = prot["asc_getStroke"] = prot.asc_getStroke;
	prot["put_stroke"] = prot["asc_putStroke"] = prot.asc_putStroke;
	prot["get_paddings"] = prot["asc_getPaddings"] = prot.asc_getPaddings;
	prot["put_paddings"] = prot["asc_putPaddings"] = prot.asc_putPaddings;
	prot["get_CanFill"] = prot["asc_getCanFill"] = prot.asc_getCanFill;
	prot["put_CanFill"] = prot["asc_putCanFill"] = prot.asc_putCanFill;
	prot["get_CanChangeArrows"] = prot["asc_getCanChangeArrows"] = prot.asc_getCanChangeArrows;
	prot["set_CanChangeArrows"] = prot["asc_setCanChangeArrows"] = prot.asc_setCanChangeArrows;
	prot["get_FromChart"] = prot["asc_getFromChart"] = prot.asc_getFromChart;
	prot["set_FromChart"] = prot["asc_setFromChart"] = prot.asc_setFromChart;
	prot["get_Locked"] = prot["asc_getLocked"] = prot.asc_getLocked;
	prot["set_Locked"] = prot["asc_setLocked"] = prot.asc_setLocked;
	prot["get_Width"] = prot["asc_getWidth"] = prot.asc_getWidth;
	prot["put_Width"] = prot["asc_putWidth"] = prot.asc_putWidth;
	prot["get_Height"] = prot["asc_getHeight"] = prot.asc_getHeight;
	prot["put_Height"] = prot["asc_putHeight"] = prot.asc_putHeight;
	prot["get_VerticalTextAlign"] = prot["asc_getVerticalTextAlign"] = prot.asc_getVerticalTextAlign;
	prot["put_VerticalTextAlign"] = prot["asc_putVerticalTextAlign"] = prot.asc_putVerticalTextAlign;
	prot["get_Vert"] = prot["asc_getVert"] = prot.asc_getVert;
	prot["put_Vert"] = prot["asc_putVert"] = prot.asc_putVert;
	prot["get_TextArtProperties"] = prot["asc_getTextArtProperties"] = prot.asc_getTextArtProperties;
	prot["put_TextArtProperties"] = prot["asc_putTextArtProperties"] = prot.asc_putTextArtProperties;
	prot["get_LockAspect"] = prot["asc_getLockAspect"] = prot.asc_getLockAspect;
	prot["put_LockAspect"] = prot["asc_putLockAspect"] = prot.asc_putLockAspect;
	prot["get_Title"] = prot["asc_getTitle"] = prot.asc_getTitle;
	prot["put_Title"] = prot["asc_putTitle"] = prot.asc_putTitle;
	prot["get_Description"] = prot["asc_getDescription"] = prot.asc_getDescription;
	prot["put_Description"] = prot["asc_putDescription"] = prot.asc_putDescription;
	prot["get_ColumnNumber"] = prot["asc_getColumnNumber"] = prot.asc_getColumnNumber;
	prot["put_ColumnNumber"] = prot["asc_putColumnNumber"] = prot.asc_putColumnNumber;
	prot["get_ColumnSpace"] = prot["asc_getColumnSpace"] = prot.asc_getColumnSpace;
	prot["put_ColumnSpace"] = prot["asc_putColumnSpace"] = prot.asc_putColumnSpace;
	prot["get_SignatureId"] = prot["asc_getSignatureId"] = prot.asc_getSignatureId;
	prot["put_SignatureId"] = prot["asc_putSignatureId"] = prot.asc_putSignatureId;
	prot["get_FromImage"] = prot["asc_getFromImage"] = prot.asc_getFromImage;
	prot["put_FromImage"] = prot["asc_putFromImage"] = prot.asc_putFromImage;
	prot["get_Rot"] = prot["asc_getRot"] = prot.asc_getRot;
	prot["put_Rot"] = prot["asc_putRot"] = prot.asc_putRot;
	prot["get_RotAdd"] = prot["asc_getRotAdd"] = prot.asc_getRotAdd;
	prot["put_RotAdd"] = prot["asc_putRotAdd"] = prot.asc_putRotAdd;
	prot["get_FlipH"] = prot["asc_getFlipH"] = prot.asc_getFlipH;
	prot["put_FlipH"] = prot["asc_putFlipH"] = prot.asc_putFlipH;
	prot["get_FlipV"] = prot["asc_getFlipV"] = prot.asc_getFlipV;
	prot["put_FlipV"] = prot["asc_putFlipV"] = prot.asc_putFlipV;
	prot["get_FlipHInvert"] = prot["asc_getFlipHInvert"] = prot.asc_getFlipHInvert;
	prot["put_FlipHInvert"] = prot["asc_putFlipHInvert"] = prot.asc_putFlipHInvert;
	prot["get_FlipVInvert"] = prot["asc_getFlipVInvert"] = prot.asc_getFlipVInvert;
	prot["put_FlipVInvert"] = prot["asc_putFlipVInvert"] = prot.asc_putFlipVInvert;
	prot["put_Shadow"] = prot.put_Shadow = prot["put_shadow"] = prot.put_shadow = prot["asc_putShadow"] = prot.asc_putShadow;
	prot["get_Shadow"] = prot.get_Shadow = prot["get_shadow"] = prot.get_shadow = prot["asc_getShadow"] = prot.asc_getShadow;
	prot["put_Anchor"] = prot.put_Anchor = prot["asc_putAnchor"] = prot.asc_putAnchor;
	prot["get_Anchor"] = prot.get_Anchor = prot["asc_getAnchor"] = prot.asc_getAnchor;

	window["Asc"]["asc_TextArtProperties"] = window["Asc"].asc_TextArtProperties = asc_TextArtProperties;
	prot = asc_TextArtProperties.prototype;
	prot["asc_putFill"] = prot.asc_putFill;
	prot["asc_getFill"] = prot.asc_getFill;
	prot["asc_putLine"] = prot.asc_putLine;
	prot["asc_getLine"] = prot.asc_getLine;
	prot["asc_putForm"] = prot.asc_putForm;
	prot["asc_getForm"] = prot.asc_getForm;
	prot["asc_putStyle"] = prot.asc_putStyle;
	prot["asc_getStyle"] = prot.asc_getStyle;

	window['Asc']['CImagePositionH'] = window["Asc"].CImagePositionH = CImagePositionH;
	prot = CImagePositionH.prototype;
	prot['get_RelativeFrom'] = prot.get_RelativeFrom;
	prot['put_RelativeFrom'] = prot.put_RelativeFrom;
	prot['get_UseAlign'] = prot.get_UseAlign;
	prot['put_UseAlign'] = prot.put_UseAlign;
	prot['get_Align'] = prot.get_Align;
	prot['put_Align'] = prot.put_Align;
	prot['get_Value'] = prot.get_Value;
	prot['put_Value'] = prot.put_Value;
	prot['get_Percent'] = prot.get_Percent;
	prot['put_Percent'] = prot.put_Percent;

	window['Asc']['CImagePositionV'] = window["Asc"].CImagePositionV = CImagePositionV;
	prot = CImagePositionV.prototype;
	prot['get_RelativeFrom'] = prot.get_RelativeFrom;
	prot['put_RelativeFrom'] = prot.put_RelativeFrom;
	prot['get_UseAlign'] = prot.get_UseAlign;
	prot['put_UseAlign'] = prot.put_UseAlign;
	prot['get_Align'] = prot.get_Align;
	prot['put_Align'] = prot.put_Align;
	prot['get_Value'] = prot.get_Value;
	prot['put_Value'] = prot.put_Value;
	prot['get_Percent'] = prot.get_Percent;
	prot['put_Percent'] = prot.put_Percent;

	window['Asc']['CPosition'] = window["Asc"].CPosition = CPosition;
	prot = CPosition.prototype;
	prot['get_X'] = prot.get_X;
	prot['put_X'] = prot.put_X;
	prot['get_Y'] = prot.get_Y;
	prot['put_Y'] = prot.put_Y;

	window["Asc"]["asc_CImgProperty"] = window["Asc"].asc_CImgProperty = asc_CImgProperty;
	prot = asc_CImgProperty.prototype;
	prot["get_ChangeLevel"] = prot["asc_getChangeLevel"] = prot.asc_getChangeLevel;
	prot["put_ChangeLevel"] = prot["asc_putChangeLevel"] = prot.asc_putChangeLevel;
	prot["get_CanBeFlow"] = prot["asc_getCanBeFlow"] = prot.asc_getCanBeFlow;
	prot["get_Width"] = prot["asc_getWidth"] = prot.asc_getWidth;
	prot["put_Width"] = prot["asc_putWidth"] = prot.asc_putWidth;
	prot["get_Height"] = prot["asc_getHeight"] = prot.asc_getHeight;
	prot["put_Height"] = prot["asc_putHeight"] = prot.asc_putHeight;
	prot["get_WrappingStyle"] = prot["asc_getWrappingStyle"] = prot.asc_getWrappingStyle;
	prot["put_WrappingStyle"] = prot["asc_putWrappingStyle"] = prot.asc_putWrappingStyle;
	prot["get_Paddings"] = prot["asc_getPaddings"] = prot.asc_getPaddings;
	prot["put_Paddings"] = prot["asc_putPaddings"] = prot.asc_putPaddings;
	prot["get_AllowOverlap"] = prot["asc_getAllowOverlap"] = prot.asc_getAllowOverlap;
	prot["put_AllowOverlap"] = prot["asc_putAllowOverlap"] = prot.asc_putAllowOverlap;
	prot["get_Position"] = prot["asc_getPosition"] = prot.asc_getPosition;
	prot["put_Position"] = prot["asc_putPosition"] = prot.asc_putPosition;
	prot["get_PositionH"] = prot["asc_getPositionH"] = prot.asc_getPositionH;
	prot["put_PositionH"] = prot["asc_putPositionH"] = prot.asc_putPositionH;
	prot["get_PositionV"] = prot["asc_getPositionV"] = prot.asc_getPositionV;
	prot["put_PositionV"] = prot["asc_putPositionV"] = prot.asc_putPositionV;
	prot["get_SizeRelH"] = prot["asc_getSizeRelH"] = prot.asc_getSizeRelH;
	prot["put_SizeRelH"] = prot["asc_putSizeRelH"] = prot.asc_putSizeRelH;
	prot["get_SizeRelV"] = prot["asc_getSizeRelV"] = prot.asc_getSizeRelV;
	prot["put_SizeRelV"] = prot["asc_putSizeRelV"] = prot.asc_putSizeRelV;
	prot["get_Value_X"] = prot["asc_getValue_X"] = prot.asc_getValue_X;
	prot["get_Value_Y"] = prot["asc_getValue_Y"] = prot.asc_getValue_Y;
	prot["get_ImageUrl"] = prot["asc_getImageUrl"] = prot.asc_getImageUrl;
	prot["put_ImageUrl"] = prot["asc_putImageUrl"] = prot.asc_putImageUrl;
	prot["get_Group"] = prot["asc_getGroup"] = prot.asc_getGroup;
	prot["put_Group"] = prot["asc_putGroup"] = prot.asc_putGroup;
	prot["get_FromGroup"] = prot["asc_getFromGroup"] = prot.asc_getFromGroup;
	prot["put_FromGroup"] = prot["asc_putFromGroup"] = prot.asc_putFromGroup;
	prot["get_isChartProps"] = prot["asc_getisChartProps"] = prot.asc_getisChartProps;
	prot["put_isChartPross"] = prot["asc_putisChartPross"] = prot.asc_putisChartPross;
	prot["get_SeveralCharts"] = prot["asc_getSeveralCharts"] = prot.asc_getSeveralCharts;
	prot["put_SeveralCharts"] = prot["asc_putSeveralCharts"] = prot.asc_putSeveralCharts;
	prot["get_SeveralChartTypes"] = prot["asc_getSeveralChartTypes"] = prot.asc_getSeveralChartTypes;
	prot["put_SeveralChartTypes"] = prot["asc_putSeveralChartTypes"] = prot.asc_putSeveralChartTypes;
	prot["get_SeveralChartStyles"] = prot["asc_getSeveralChartStyles"] = prot.asc_getSeveralChartStyles;
	prot["put_SeveralChartStyles"] = prot["asc_putSeveralChartStyles"] = prot.asc_putSeveralChartStyles;
	prot["get_VerticalTextAlign"] = prot["asc_getVerticalTextAlign"] = prot.asc_getVerticalTextAlign;
	prot["put_VerticalTextAlign"] = prot["asc_putVerticalTextAlign"] = prot.asc_putVerticalTextAlign;
	prot["get_Vert"] = prot["asc_getVert"] = prot.asc_getVert;
	prot["put_Vert"] = prot["asc_putVert"] = prot.asc_putVert;
	prot["get_Locked"] = prot["asc_getLocked"] = prot.asc_getLocked;
	prot["getLockAspect"] = prot["asc_getLockAspect"] = prot.asc_getLockAspect;
	prot["putLockAspect"] = prot["asc_putLockAspect"] = prot.asc_putLockAspect;
	prot["get_ChartProperties"] = prot["asc_getChartProperties"] = prot.asc_getChartProperties;
	prot["put_ChartProperties"] = prot["asc_putChartProperties"] = prot.asc_putChartProperties;
	prot["get_ShapeProperties"] = prot["asc_getShapeProperties"] = prot.asc_getShapeProperties;
	prot["put_ShapeProperties"] = prot["asc_putShapeProperties"] = prot.asc_putShapeProperties;
	prot["get_OriginSize"] = prot["asc_getOriginSize"] = prot.asc_getOriginSize;
	prot["get_PluginGuid"] = prot["asc_getPluginGuid"] = prot.asc_getPluginGuid;
	prot["put_PluginGuid"] = prot["asc_putPluginGuid"] = prot.asc_putPluginGuid;
	prot["get_PluginData"] = prot["asc_getPluginData"] = prot.asc_getPluginData;
	prot["put_PluginData"] = prot["asc_putPluginData"] = prot.asc_putPluginData;
	prot["get_Rot"] = prot["asc_getRot"] = prot.asc_getRot;
	prot["put_Rot"] = prot["asc_putRot"] = prot.asc_putRot;
	prot["get_RotAdd"] = prot["asc_getRotAdd"] = prot.asc_getRotAdd;
	prot["put_RotAdd"] = prot["asc_putRotAdd"] = prot.asc_putRotAdd;
	prot["get_FlipH"] = prot["asc_getFlipH"] = prot.asc_getFlipH;
	prot["put_FlipH"] = prot["asc_putFlipH"] = prot.asc_putFlipH;
	prot["get_FlipV"] = prot["asc_getFlipV"] = prot.asc_getFlipV;
	prot["put_FlipV"] = prot["asc_putFlipV"] = prot.asc_putFlipV;
	prot["get_FlipHInvert"] = prot["asc_getFlipHInvert"] = prot.asc_getFlipHInvert;
	prot["put_FlipHInvert"] = prot["asc_putFlipHInvert"] = prot.asc_putFlipHInvert;
	prot["get_FlipVInvert"] = prot["asc_getFlipVInvert"] = prot.asc_getFlipVInvert;
	prot["put_FlipVInvert"] = prot["asc_putFlipVInvert"] = prot.asc_putFlipVInvert;
	prot["put_ResetCrop"] = prot["asc_putResetCrop"] = prot.asc_putResetCrop;

	prot["get_Title"] = prot["asc_getTitle"] = prot.asc_getTitle;
	prot["put_Title"] = prot["asc_putTitle"] = prot.asc_putTitle;
	prot["get_Description"] = prot["asc_getDescription"] = prot.asc_getDescription;
	prot["put_Description"] = prot["asc_putDescription"] = prot.asc_putDescription;
	prot["get_ColumnNumber"] = prot["asc_getColumnNumber"] = prot.asc_getColumnNumber;
	prot["put_ColumnNumber"] = prot["asc_putColumnNumber"] = prot.asc_putColumnNumber;
	prot["get_ColumnSpace"] = prot["asc_getColumnSpace"] = prot.asc_getColumnSpace;
	prot["put_ColumnSpace"] = prot["asc_putColumnSpace"] = prot.asc_putColumnSpace;
	prot["asc_getSignatureId"] = prot["asc_getSignatureId"] = prot.asc_getSignatureId;

	prot["put_Shadow"] = prot.put_Shadow = prot["put_shadow"] = prot.put_shadow = prot["asc_putShadow"] = prot.asc_putShadow;
	prot["get_Shadow"] = prot.get_Shadow = prot["get_shadow"] = prot.get_shadow = prot["asc_getShadow"] = prot.asc_getShadow;

	prot["put_Anchor"] = prot.put_Anchor = prot["asc_putAnchor"] = prot.asc_putAnchor;
	prot["get_Anchor"] = prot.get_Anchor = prot["asc_getAnchor"] = prot.asc_getAnchor;




	window["AscCommon"].asc_CSelectedObject = asc_CSelectedObject;
	prot = asc_CSelectedObject.prototype;
	prot["get_ObjectType"] = prot["asc_getObjectType"] = prot.asc_getObjectType;
	prot["get_ObjectValue"] = prot["asc_getObjectValue"] = prot.asc_getObjectValue;

	window["Asc"]["asc_CShapeFill"] = window["Asc"].asc_CShapeFill = asc_CShapeFill;
	prot = asc_CShapeFill.prototype;
	prot["get_type"] = prot["asc_getType"] = prot.asc_getType;
	prot["put_type"] = prot["asc_putType"] = prot.asc_putType;
	prot["get_fill"] = prot["asc_getFill"] = prot.asc_getFill;
	prot["put_fill"] = prot["asc_putFill"] = prot.asc_putFill;
	prot["get_transparent"] = prot["asc_getTransparent"] = prot.asc_getTransparent;
	prot["put_transparent"] = prot["asc_putTransparent"] = prot.asc_putTransparent;
	prot["asc_CheckForseSet"] = prot["asc_CheckForseSet"] = prot.asc_CheckForseSet;

	window["Asc"]["asc_CFillBlip"] = window["Asc"].asc_CFillBlip = asc_CFillBlip;
	prot = asc_CFillBlip.prototype;
	prot["get_type"] = prot["asc_getType"] = prot.asc_getType;
	prot["put_type"] = prot["asc_putType"] = prot.asc_putType;
	prot["get_url"] = prot["asc_getUrl"] = prot.asc_getUrl;
	prot["put_url"] = prot["asc_putUrl"] = prot.asc_putUrl;
	prot["get_texture_id"] = prot["asc_getTextureId"] = prot.asc_getTextureId;
	prot["put_texture_id"] = prot["asc_putTextureId"] = prot.asc_putTextureId;

	window["Asc"]["asc_CFillHatch"] = window["Asc"].asc_CFillHatch = asc_CFillHatch;
	prot = asc_CFillHatch.prototype;
	prot["get_pattern_type"] = prot["asc_getPatternType"] = prot.asc_getPatternType;
	prot["put_pattern_type"] = prot["asc_putPatternType"] = prot.asc_putPatternType;
	prot["get_color_fg"] = prot["asc_getColorFg"] = prot.asc_getColorFg;
	prot["put_color_fg"] = prot["asc_putColorFg"] = prot.asc_putColorFg;
	prot["get_color_bg"] = prot["asc_getColorBg"] = prot.asc_getColorBg;
	prot["put_color_bg"] = prot["asc_putColorBg"] = prot.asc_putColorBg;

	window["Asc"]["asc_CFillGrad"] = window["Asc"].asc_CFillGrad = asc_CFillGrad;
	prot = asc_CFillGrad.prototype;
	prot["get_colors"] = prot["asc_getColors"] = prot.asc_getColors;
	prot["put_colors"] = prot["asc_putColors"] = prot.asc_putColors;
	prot["get_positions"] = prot["asc_getPositions"] = prot.asc_getPositions;
	prot["put_positions"] = prot["asc_putPositions"] = prot.asc_putPositions;
	prot["get_grad_type"] = prot["asc_getGradType"] = prot.asc_getGradType;
	prot["put_grad_type"] = prot["asc_putGradType"] = prot.asc_putGradType;
	prot["get_linear_angle"] = prot["asc_getLinearAngle"] = prot.asc_getLinearAngle;
	prot["put_linear_angle"] = prot["asc_putLinearAngle"] = prot.asc_putLinearAngle;
	prot["get_linear_scale"] = prot["asc_getLinearScale"] = prot.asc_getLinearScale;
	prot["put_linear_scale"] = prot["asc_putLinearScale"] = prot.asc_putLinearScale;
	prot["get_path_type"] = prot["asc_getPathType"] = prot.asc_getPathType;
	prot["put_path_type"] = prot["asc_putPathType"] = prot.asc_putPathType;

	window["Asc"]["asc_CFillSolid"] = window["Asc"].asc_CFillSolid = asc_CFillSolid;
	prot = asc_CFillSolid.prototype;
	prot["get_color"] = prot["asc_getColor"] = prot.asc_getColor;
	prot["put_color"] = prot["asc_putColor"] = prot.asc_putColor;

	window["Asc"]["asc_CStroke"] = window["Asc"].asc_CStroke = asc_CStroke;
	prot = asc_CStroke.prototype;
	prot["get_type"] = prot["asc_getType"] = prot.asc_getType;
	prot["put_type"] = prot["asc_putType"] = prot.asc_putType;
	prot["get_width"] = prot["asc_getWidth"] = prot.asc_getWidth;
	prot["put_width"] = prot["asc_putWidth"] = prot.asc_putWidth;
	prot["get_color"] = prot["asc_getColor"] = prot.asc_getColor;
	prot["put_color"] = prot["asc_putColor"] = prot.asc_putColor;
	prot["get_linejoin"] = prot["asc_getLinejoin"] = prot.asc_getLinejoin;
	prot["put_linejoin"] = prot["asc_putLinejoin"] = prot.asc_putLinejoin;
	prot["get_linecap"] = prot["asc_getLinecap"] = prot.asc_getLinecap;
	prot["put_linecap"] = prot["asc_putLinecap"] = prot.asc_putLinecap;
	prot["get_linebeginstyle"] = prot["asc_getLinebeginstyle"] = prot.asc_getLinebeginstyle;
	prot["put_linebeginstyle"] = prot["asc_putLinebeginstyle"] = prot.asc_putLinebeginstyle;
	prot["get_linebeginsize"] = prot["asc_getLinebeginsize"] = prot.asc_getLinebeginsize;
	prot["put_linebeginsize"] = prot["asc_putLinebeginsize"] = prot.asc_putLinebeginsize;
	prot["get_lineendstyle"] = prot["asc_getLineendstyle"] = prot.asc_getLineendstyle;
	prot["put_lineendstyle"] = prot["asc_putLineendstyle"] = prot.asc_putLineendstyle;
	prot["get_lineendsize"] = prot["asc_getLineendsize"] = prot.asc_getLineendsize;
	prot["put_lineendsize"] = prot["asc_putLineendsize"] = prot.asc_putLineendsize;
	prot["get_canChangeArrows"] = prot["asc_getCanChangeArrows"] = prot.asc_getCanChangeArrows;
	prot["put_prstDash"] = prot["asc_putPrstDash"] = prot.asc_putPrstDash;
	prot["get_prstDash"] = prot["asc_getPrstDash"] = prot.asc_getPrstDash;

	window["AscCommon"].CAscColorScheme = CAscColorScheme;
	prot = CAscColorScheme.prototype;
	prot["get_colors"] = prot.get_colors;
	prot["get_name"] = prot.get_name;

	window["AscCommon"].CMouseMoveData = CMouseMoveData;
	prot = CMouseMoveData.prototype;
	prot["get_Type"] = prot.get_Type;
	prot["get_X"] = prot.get_X;
	prot["get_Y"] = prot.get_Y;
	prot["get_Hyperlink"] = prot.get_Hyperlink;
	prot["get_UserId"] = prot.get_UserId;
	prot["get_HaveChanges"] = prot.get_HaveChanges;
	prot["get_LockedObjectType"] = prot.get_LockedObjectType;
	prot["get_FootnoteText"] =  prot.get_FootnoteText;
	prot["get_FootnoteNumber"] = prot.get_FootnoteNumber;

	window["Asc"]["asc_CUserInfo"] = window["Asc"].asc_CUserInfo = asc_CUserInfo;
	prot = asc_CUserInfo.prototype;
	prot["asc_putId"] = prot["put_Id"] = prot.asc_putId;
	prot["asc_getId"] = prot["get_Id"] = prot.asc_getId;
	prot["asc_putFullName"] = prot["put_FullName"] = prot.asc_putFullName;
	prot["asc_getFullName"] = prot["get_FullName"] = prot.asc_getFullName;
	prot["asc_putFirstName"] = prot["put_FirstName"] = prot.asc_putFirstName;
	prot["asc_getFirstName"] = prot["get_FirstName"] = prot.asc_getFirstName;
	prot["asc_putLastName"] = prot["put_LastName"] = prot.asc_putLastName;
	prot["asc_getLastName"] = prot["get_LastName"] = prot.asc_getLastName;

	window["Asc"]["asc_CDocInfo"] = window["Asc"].asc_CDocInfo = asc_CDocInfo;
	prot = asc_CDocInfo.prototype;
	prot["get_Id"] = prot["asc_getId"] = prot.asc_getId;
	prot["put_Id"] = prot["asc_putId"] = prot.asc_putId;
	prot["get_Url"] = prot["asc_getUrl"] = prot.asc_getUrl;
	prot["put_Url"] = prot["asc_putUrl"] = prot.asc_putUrl;
	prot["get_Title"] = prot["asc_getTitle"] = prot.asc_getTitle;
	prot["put_Title"] = prot["asc_putTitle"] = prot.asc_putTitle;
	prot["get_Format"] = prot["asc_getFormat"] = prot.asc_getFormat;
	prot["put_Format"] = prot["asc_putFormat"] = prot.asc_putFormat;
	prot["get_VKey"] = prot["asc_getVKey"] = prot.asc_getVKey;
	prot["put_VKey"] = prot["asc_putVKey"] = prot.asc_putVKey;
	prot["get_UserId"] = prot["asc_getUserId"] = prot.asc_getUserId;
	prot["get_UserName"] = prot["asc_getUserName"] = prot.asc_getUserName;
	prot["get_Options"] = prot["asc_getOptions"] = prot.asc_getOptions;
	prot["put_Options"] = prot["asc_putOptions"] = prot.asc_putOptions;
	prot["get_CallbackUrl"] = prot["asc_getCallbackUrl"] = prot.asc_getCallbackUrl;
	prot["put_CallbackUrl"] = prot["asc_putCallbackUrl"] = prot.asc_putCallbackUrl;
	prot["get_TemplateReplacement"] = prot["asc_getTemplateReplacement"] = prot.asc_getTemplateReplacement;
	prot["put_TemplateReplacement"] = prot["asc_putTemplateReplacement"] = prot.asc_putTemplateReplacement;
	prot["get_UserInfo"] = prot["asc_getUserInfo"] = prot.asc_getUserInfo;
	prot["put_UserInfo"] = prot["asc_putUserInfo"] = prot.asc_putUserInfo;
	prot["get_Token"] = prot["asc_getToken"] = prot.asc_getToken;
	prot["put_Token"] = prot["asc_putToken"] = prot.asc_putToken;
	prot["get_Mode"] = prot["asc_getMode"] = prot.asc_getMode;
	prot["put_Mode"] = prot["asc_putMode"] = prot.asc_putMode;
	prot["get_Permissions"] = prot["asc_getPermissions"] = prot.asc_getPermissions;
	prot["put_Permissions"] = prot["asc_putPermissions"] = prot.asc_putPermissions;
	prot["get_Lang"] = prot["asc_getLang"] = prot.asc_getLang;
	prot["put_Lang"] = prot["asc_putLang"] = prot.asc_putLang;
	prot["get_Encrypted"] = prot["asc_getEncrypted"] = prot.asc_getEncrypted;
	prot["put_Encrypted"] = prot["asc_putEncrypted"] = prot.asc_putEncrypted;

	window["AscCommon"].COpenProgress = COpenProgress;
	prot = COpenProgress.prototype;
	prot["asc_getType"] = prot.asc_getType;
	prot["asc_getFontsCount"] = prot.asc_getFontsCount;
	prot["asc_getCurrentFont"] = prot.asc_getCurrentFont;
	prot["asc_getImagesCount"] = prot.asc_getImagesCount;
	prot["asc_getCurrentImage"] = prot.asc_getCurrentImage;

	window["AscCommon"].CErrorData = CErrorData;
	prot = CErrorData.prototype;
	prot["put_Value"] = prot.put_Value;
	prot["get_Value"] = prot.get_Value;

	window["AscCommon"].CAscMathType = CAscMathType;
	prot = CAscMathType.prototype;
	prot["get_Id"] = prot.get_Id;
	prot["get_X"] = prot.get_X;
	prot["get_Y"] = prot.get_Y;

	window["AscCommon"].CAscMathCategory = CAscMathCategory;
	prot = CAscMathCategory.prototype;
	prot["get_Id"] = prot.get_Id;
	prot["get_Data"] = prot.get_Data;
	prot["get_W"] = prot.get_W;
	prot["get_H"] = prot.get_H;

	window["AscCommon"].CStyleImage = CStyleImage;
	prot = CStyleImage.prototype;
	prot["asc_getId"] = prot["asc_getName"] = prot["get_Name"] = prot.asc_getName;
	prot["asc_getDisplayName"] = prot.asc_getDisplayName;
	prot["asc_getType"] = prot["get_Type"] = prot.asc_getType;
	prot["asc_getImage"] = prot.asc_getImage;

    window["AscCommon"].asc_CSpellCheckProperty = asc_CSpellCheckProperty;
    prot = asc_CSpellCheckProperty.prototype;
    prot["get_Word"] = prot.get_Word;
    prot["get_Checked"] = prot.get_Checked;
    prot["get_Variants"] = prot.get_Variants;

    window["AscCommon"].CWatermarkOnDraw = CWatermarkOnDraw;

	window["Asc"]["CPluginVariation"] = window["Asc"].CPluginVariation = CPluginVariation;
	window["Asc"]["CPlugin"] = window["Asc"].CPlugin = CPlugin;
})(window);
