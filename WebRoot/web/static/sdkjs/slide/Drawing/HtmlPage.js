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

// Import
var MOVE_DELTA = AscFormat.MOVE_DELTA;

var g_anchor_left          = AscCommon.g_anchor_left;
var g_anchor_top           = AscCommon.g_anchor_top;
var g_anchor_right         = AscCommon.g_anchor_right;
var g_anchor_bottom        = AscCommon.g_anchor_bottom;
var CreateControlContainer = AscCommon.CreateControlContainer;
var CreateControl          = AscCommon.CreateControl;
var global_keyboardEvent   = AscCommon.global_keyboardEvent;
var global_mouseEvent      = AscCommon.global_mouseEvent;
var History                = AscCommon.History;
var g_dKoef_pix_to_mm      = AscCommon.g_dKoef_pix_to_mm;
var g_dKoef_mm_to_pix      = AscCommon.g_dKoef_mm_to_pix;

var g_bIsMobile = AscCommon.AscBrowser.isMobile;

var Page_Width  = 297;
var Page_Height = 210;

var X_Left_Margin   = 30;  // 3   cm
var X_Right_Margin  = 15;  // 1.5 cm
var Y_Bottom_Margin = 20;  // 2   cm
var Y_Top_Margin    = 20;  // 2   cm

var X_Right_Field  = Page_Width - X_Right_Margin;
var Y_Bottom_Field = Page_Height - Y_Bottom_Margin;

var GlobalSkinTeamlab = {
	Name                                  : "classic",
	RulersButton                          : true,
	NavigationButtons                     : true,
	BackgroundColor                       : "#B0B0B0",
	BackgroundColorThumbnails             : "#EBEBEB",
	BackgroundScroll                      : "#F1F1F1",
	RulerDark                             : "#B0B0B0",
	RulerLight                            : "EDEDED",
	RulerOutline                          : "#929292",
	RulerMarkersFillColor                 : "#E7E7E7",
	PageOutline                           : "#81878F",
	STYLE_THUMBNAIL_WIDTH                 : 80,
	STYLE_THUMBNAIL_HEIGHT                : 40,
	BorderSplitterColor                   : "#787878",
	SupportNotes                          : true,
	SplitterWidthMM                       : 1.5,
	ThumbnailScrollWidthNullIfNoScrolling : true
};
var GlobalSkinFlat    = {
	Name                                  : "flat",
	RulersButton                          : false,
	NavigationButtons                     : false,
	BackgroundColor                       : "#F4F4F4",
	BackgroundColorThumbnails             : "#F4F4F4",
	BackgroundScroll                      : "#F1F1F1",
	RulerDark                             : "#CFCFCF",
	RulerLight                            : "#FFFFFF",
	RulerOutline                          : "#BBBEC2",
	RulerMarkersFillColor                 : "#FFFFFF",
	PageOutline                           : "#BBBEC2",
	STYLE_THUMBNAIL_WIDTH                 : 109,
	STYLE_THUMBNAIL_HEIGHT                : 45,
	BorderSplitterColor                   : "#CBCBCB",
	SupportNotes                          : true,
	SplitterWidthMM                       : 1,
	ThumbnailScrollWidthNullIfNoScrolling : false
};
var GlobalSkinFlat2    = {
	Name                                  : "flat",
	RulersButton                          : false,
	NavigationButtons                     : false,
	BackgroundColor                       : "#E2E2E2",
	BackgroundColorThumbnails             : "#F4F4F4",
	BackgroundScroll       				  : "#E2E2E2",
	RulerDark                             : "#CFCFCF",
	RulerLight                            : "#FFFFFF",
	RulerOutline                          : "#BBBEC2",
	RulerMarkersFillColor                 : "#FFFFFF",
	PageOutline                           : "#BBBEC2",
	STYLE_THUMBNAIL_WIDTH                 : 109,
	STYLE_THUMBNAIL_HEIGHT                : 45,
	BorderSplitterColor                   : "#CBCBCB",
	SupportNotes                          : true,
	SplitterWidthMM                       : 1,
	ThumbnailScrollWidthNullIfNoScrolling : false
};

var GlobalSkin = GlobalSkinFlat2;

function updateGlobalSkin(newSkin)
{
	GlobalSkin.Name                   = newSkin.Name;
	GlobalSkin.RulersButton           = newSkin.RulersButton;
	GlobalSkin.NavigationButtons      = newSkin.NavigationButtons;
	GlobalSkin.BackgroundColor        = newSkin.BackgroundColor;
	GlobalSkin.RulerDark              = newSkin.RulerDark;
	GlobalSkin.RulerLight             = newSkin.RulerLight;
	GlobalSkin.BackgroundScroll       = newSkin.BackgroundScroll;
	GlobalSkin.RulerOutline           = newSkin.RulerOutline;
	GlobalSkin.RulerMarkersFillColor  = newSkin.RulerMarkersFillColor;
	GlobalSkin.PageOutline            = newSkin.PageOutline;
	GlobalSkin.STYLE_THUMBNAIL_WIDTH  = newSkin.STYLE_THUMBNAIL_WIDTH;
	GlobalSkin.STYLE_THUMBNAIL_HEIGHT = newSkin.STYLE_THUMBNAIL_HEIGHT;
	GlobalSkin.isNeedInvertOnActive   = newSkin.isNeedInvertOnActive;
}

function CEditorPage(api)
{
	// ------------------------------------------------------------------
	this.Name           = "";
	this.IsSupportNotes = true;

	this.EditorType = "presentations";

	this.X      = 0;
	this.Y      = 0;
	this.Width  = 10;
	this.Height = 10;

	// body
	this.m_oBody = null;

	// thumbnails
	this.m_oThumbnailsContainer = null;
	this.m_oThumbnailsBack      = null;
	this.m_oThumbnailsSplit		= null;
	this.m_oThumbnails          = null;
	this.m_oThumbnails_scroll   = null;

	// notes
	this.m_oNotesContainer = null;
	this.m_oNotes          = null;
	this.m_oNotes_scroll   = null;
	this.m_oNotesOverlay   = null;

	this.m_oNotesApi	   = null;

	// main
	this.m_oMainParent = null;
	this.m_oMainContent = null;
	// <-
	// horizontal scroll
	this.m_oScrollHor = null;

	// right panel (vertical scroll & buttons (page & rulersEnabled))
	this.m_oPanelRight                = null;
	this.m_oPanelRight_buttonRulers   = null;
	this.m_oPanelRight_vertScroll     = null;
	this.m_oPanelRight_buttonPrevPage = null;
	this.m_oPanelRight_buttonNextPage = null;

	// vertical ruler (left panel)
	this.m_oLeftRuler             = null;
	this.m_oLeftRuler_buttonsTabs = null;
	this.m_oLeftRuler_vertRuler   = null;

	// horizontal ruler (top panel)
	this.m_oTopRuler          = null;
	this.m_oTopRuler_horRuler = null;

	this.ScrollWidthPx = 14;

	// main view
	this.m_oMainView                            = null;
	this.m_oEditor                              = null;
	this.m_oOverlay                             = null;
	this.m_oOverlayApi                          = new AscCommon.COverlay();
	this.m_oOverlayApi.m_bIsAlwaysUpdateOverlay = true;

	// reporter mode
	this.m_oDemonstrationDivParent = null;
	this.m_oDemonstrationDivId = null;
	// TODO: buttons
	// ------------------------------------------------------------------

	// scrolls api
	this.m_oScrollHor_   = null;
	this.m_oScrollVer_   = null;
	this.m_oScrollThumb_ = null;
	this.m_oScrollNotes_ = null;
	this.m_nVerticalSlideChangeOnScrollInterval = 300; // AscCommon.AscBrowser.isMacOs ? 300 : 0; // как часто можно менять слайды при вертикальном скролле
	this.m_nVerticalSlideChangeOnScrollLast = -1;
    this.m_nVerticalSlideChangeOnScrollEnabled = false;

	this.m_oScrollHorApi   = null;
	this.m_oScrollVerApi   = null;
	this.m_oScrollThumbApi = null;
	this.m_oScrollNotesApi = null;

	this.MobileTouchManager 			= null;
	this.MobileTouchManagerThumbnails 	= null;

	// properties
	this.m_bIsHorScrollVisible          = false;
	this.m_bIsRuler                     = false;
	this.m_bDocumentPlaceChangedEnabled = false;

	this.m_nZoomValue = 100;
	this.zoom_values  = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];
	this.m_nZoomType  = 2; // 0 - custom, 1 - fitToWodth, 2 - fitToPage

	this.m_oBoundsController = new AscFormat.CBoundsController();
	this.m_nTabsType         = tab_Left;

	this.m_dScrollY     = 0;
	this.m_dScrollX     = 0;
	this.m_dScrollY_max = 1;
	this.m_dScrollX_max = 1;

	this.m_dScrollX_Central   = 0;
	this.m_dScrollY_Central   = 0;
	this.m_bIsRePaintOnScroll = true;

	this.m_dDocumentWidth      = 0;
	this.m_dDocumentHeight     = 0;
	this.m_dDocumentPageWidth  = 0;
	this.m_dDocumentPageHeight = 0;

	this.m_bIsScroll     = false;
	this.m_nPaintTimerId = -1;

	this.m_oHorRuler                     = new CHorRuler();
	this.m_oHorRuler.IsCanMoveMargins    = false;
	this.m_oHorRuler.IsCanMoveAnyMarkers = false;
	this.m_oHorRuler.IsDrawAnyMarkers    = false;

	this.m_oVerRuler                  = new CVerRuler();
	this.m_oVerRuler.IsCanMoveMargins = false;

	this.m_oDrawingDocument = new AscCommon.CDrawingDocument();
	this.m_oLogicDocument   = null;

	this.m_oLayoutDrawer                 = new CLayoutThumbnailDrawer();
	this.m_oLayoutDrawer.DrawingDocument = this.m_oDrawingDocument;

	this.m_oMasterDrawer                 = new CMasterThumbnailDrawer();
	this.m_oMasterDrawer.DrawingDocument = this.m_oDrawingDocument;

	this.m_oDrawingDocument.m_oWordControl           = this;
	this.m_oDrawingDocument.TransitionSlide.HtmlPage = this;
	this.m_oDrawingDocument.m_oLogicDocument         = this.m_oLogicDocument;

	this.m_bIsUpdateHorRuler       = false;
	this.m_bIsUpdateVerRuler       = false;
	this.m_bIsUpdateTargetNoAttack = false;

	this.arrayEventHandlers = [];

	this.m_oTimerScrollSelect = -1;
	this.IsFocus              = true;
	this.m_bIsMouseLock       = false;

	this.m_oHorRuler.m_oWordControl = this;
	this.m_oVerRuler.m_oWordControl = this;

	this.Thumbnails                 = new CThumbnailsManager();
	this.SlideDrawer                = new CSlideDrawer();
	this.SlideBoundsOnCalculateSize = new AscFormat.CBoundsController();
	this.MainScrollsEnabledFlag     = 0;

	this.bIsUseKeyPress = true;
	this.bIsEventPaste  = false;

	this.DrawingFreeze = false;

	this.ZoomFreePageNum = -1;

	this.m_bIsIE = AscCommon.AscBrowser.isIE;

	// сплиттеры (для табнейлов и для заметок)
	this.Splitter1Pos    = 0;
    this.Splitter1PosSetUp = 0;
	this.Splitter1PosMin = 0;
	this.Splitter1PosMax = 0;

	this.Splitter2Pos    = 0;
	this.Splitter2PosMin = 0;
	this.Splitter2PosMax = 0;

	this.SplitterDiv  = null;
	this.SplitterType = 0;

	this.OldSplitter1Pos = 0;

	// ----
	this.OldDocumentWidth  = 0;
	this.OldDocumentHeight = 0;

	// axis Y
	this.SlideScrollMIN = 0;
	this.SlideScrollMAX = 0;

	// поддерживает ли браузер нецелые пикселы -------------------------------
	this.bIsDoublePx = true;
	var oTestSpan    = document.createElement("span");
	oTestSpan.setAttribute("style", "font-size:8pt");
	document.body.appendChild(oTestSpan);
	var defaultView   = oTestSpan.ownerDocument.defaultView;
	var computedStyle = defaultView.getComputedStyle(oTestSpan, null);
	if (null != computedStyle)
	{
		var fontSize = computedStyle.getPropertyValue("font-size");
		if (-1 != fontSize.indexOf("px") && parseFloat(fontSize) == parseInt(fontSize))
			this.bIsDoublePx = false;
	}
	document.body.removeChild(oTestSpan);

	// -----------------------------------------------------------------------

	this.m_nTimerScrollInterval   = 40;
	this.m_nCurrentTimeClearCache = 0;

	this.StartVerticalScroll     = false;
	this.VerticalScrollOnMouseUp = {SlideNum : 0, ScrollY : 0, ScrollY_max : 0};
	this.IsGoToPageMAXPosition   = false;

	this.bIsRetinaSupport         = true;
	this.bIsRetinaNoSupportAttack = false;

	this.MasterLayouts = null; // мастер, от которого посылались в меню последние шаблоны

	// demonstrationMode
	this.DemonstrationManager = new CDemonstrationManager(this);

	this.IsEnabledRulerMarkers = false;

	this.IsUpdateOverlayOnlyEnd    = false;
	this.IsUpdateOverlayOnEndCheck = false;

	this.IsUseNullThumbnailsSplitter = false;

	this.NoneRepaintPages = false;

	this.reporterTimer = -1;
	this.reporterTimerAdd = 0;
	this.reporterTimerLastStart = -1;
	this.reporterPointer = false;

	this.m_oApi = api;
	var oThis   = this;

	this.reporterTimerFunc = function(isReturn)
	{
		var _curTime = new Date().getTime();
		_curTime -= oThis.reporterTimerLastStart;
		_curTime += oThis.reporterTimerAdd;

		if (isReturn)
			return _curTime;

		_curTime = (_curTime / 1000) >> 0;
		var _sec = _curTime % 60;
		_curTime = (_curTime / 60) >> 0;
		var _min = _curTime % 60;
		var _hrs = (_curTime / 60) >> 0;

		if (100 >= _hrs)
			_hrs = 0;

		var _value = (_hrs > 9) ? ("" + _hrs) : ("0" + _hrs);
		_value += ":";
		_value += ((_min > 9) ? ("" + _min) : ("0" + _min));
		_value += ":";
		_value += ((_sec > 9) ? ("" + _sec) : ("0" + _sec));

		var _elem = document.getElementById("dem_id_time");
		if (_elem)
			_elem.innerHTML = _value;
	};

	this.MainScrollLock   = function()
	{
		this.MainScrollsEnabledFlag++;
	};
	this.MainScrollUnLock = function()
	{
		this.MainScrollsEnabledFlag--;
		if (this.MainScrollsEnabledFlag < 0)
			this.MainScrollsEnabledFlag = 0;
	};

	this.checkBodyOffset = function()
	{
		var off = jQuery("#" + this.Name).offset();

		// почему-то иногда неправильно определяется "top" (возвращается ноль)
        if (!this.m_oApi.isEmbedVersion && !this.m_oApi.isMobileVersion && off && (0 == off.top))
            return;

		if (off)
		{
			this.X = off.left;
			this.Y = off.top;
		}
	};

	this.checkBodySize = function()
	{
		this.checkBodyOffset();

		var el = document.getElementById(this.Name);

		if (this.Width != el.offsetWidth || this.Height != el.offsetHeight)
		{
			this.Width  = el.offsetWidth;
			this.Height = el.offsetHeight;
			return true;
		}
		return false;
	};

	this.Init = function()
	{
		if (this.m_oApi.isReporterMode)
		{
			var _elem = document.getElementById(this.Name);
			if (_elem)
				_elem.style.overflow = "hidden";
		}

		this.m_oBody = CreateControlContainer(this.Name);
        this.m_oBody.HtmlElement.style.touchAction = "none";

		this.Splitter1Pos    = 67.5;
        this.Splitter1PosSetUp = this.Splitter1Pos;
		this.Splitter2Pos    = (this.IsSupportNotes === true) ? 11 : 0;

		this.OldSplitter1Pos = this.Splitter1Pos;

		this.Splitter1PosMin = 20;
		this.Splitter1PosMax = 80;
		this.Splitter2PosMin = 10;
		this.Splitter2PosMax = 100;

		if (this.m_oApi.isReporterMode)
		{
			this.Splitter2Pos = 90;
			this.Splitter2PosMax = 200;
		}

		var ScrollWidthMm  = this.ScrollWidthPx * g_dKoef_pix_to_mm;
		var ScrollWidthMm9 = 10 * g_dKoef_pix_to_mm;

		this.Thumbnails.m_oWordControl = this;

		// thumbnails -----
		this.m_oThumbnailsContainer = CreateControlContainer("id_panel_thumbnails");
		this.m_oThumbnailsContainer.Bounds.SetParams(0, 0, this.Splitter1Pos, 1000, false, false, true, false, this.Splitter1Pos, -1);
		this.m_oThumbnailsContainer.Anchor = (g_anchor_left | g_anchor_top | g_anchor_bottom);
		this.m_oBody.AddControl(this.m_oThumbnailsContainer);

		this.m_oThumbnailsSplit = CreateControlContainer("id_panel_thumbnails_split");
		this.m_oThumbnailsSplit.Bounds.SetParams(this.Splitter1Pos, 0, 1000, 1000, true, false, false, false, GlobalSkin.SplitterWidthMM, -1);
		this.m_oThumbnailsSplit.Anchor = (g_anchor_left | g_anchor_top | g_anchor_bottom);
		this.m_oBody.AddControl(this.m_oThumbnailsSplit);

		this.m_oThumbnailsBack = CreateControl("id_thumbnails_background");
		this.m_oThumbnailsBack.Bounds.SetParams(0, 0, ScrollWidthMm9, 1000, false, false, true, false, -1, -1);
		this.m_oThumbnailsBack.Anchor = (g_anchor_left | g_anchor_top | g_anchor_right | g_anchor_bottom);
		this.m_oThumbnailsContainer.AddControl(this.m_oThumbnailsBack);

		this.m_oThumbnails = CreateControl("id_thumbnails");
		this.m_oThumbnails.Bounds.SetParams(0, 0, ScrollWidthMm9, 1000, false, false, true, false, -1, -1);
		this.m_oThumbnails.Anchor = (g_anchor_left | g_anchor_top | g_anchor_right | g_anchor_bottom);
		this.m_oThumbnailsContainer.AddControl(this.m_oThumbnails);

		this.m_oThumbnails_scroll = CreateControl("id_vertical_scroll_thmbnl");
		this.m_oThumbnails_scroll.Bounds.SetParams(0, 0, 1000, 1000, false, false, false, false, ScrollWidthMm9, -1);
		this.m_oThumbnails_scroll.Anchor = (g_anchor_top | g_anchor_right | g_anchor_bottom);
		this.m_oThumbnailsContainer.AddControl(this.m_oThumbnails_scroll);
		// ----------------

		if (this.m_oApi.isMobileVersion)
		{
			this.m_oThumbnails_scroll.HtmlElement.style.display = "none";
		}

		// main content -------------------------------------------------------------
		this.m_oMainParent = CreateControlContainer("id_main_parent");
		this.m_oMainParent.Bounds.SetParams(this.Splitter1Pos + GlobalSkin.SplitterWidthMM, 0, g_dKoef_pix_to_mm, 1000, true, false, true, false, -1, -1);
		this.m_oBody.AddControl(this.m_oMainParent);

		this.m_oMainContent = CreateControlContainer("id_main");
		this.m_oMainContent.Bounds.SetParams(0, 0, g_dKoef_pix_to_mm, this.Splitter2Pos + GlobalSkin.SplitterWidthMM, true, false, true, true, -1, -1);

		this.m_oMainContent.Anchor = (g_anchor_left | g_anchor_top | g_anchor_right | g_anchor_bottom);
		this.m_oMainParent.AddControl(this.m_oMainContent);

		// panel right --------------------------------------------------------------
		this.m_oPanelRight = CreateControlContainer("id_panel_right");
		this.m_oPanelRight.Bounds.SetParams(0, 0, 1000, ScrollWidthMm, false, false, false, true, ScrollWidthMm, -1);
		this.m_oPanelRight.Anchor = (g_anchor_top | g_anchor_right | g_anchor_bottom);

		this.m_oMainContent.AddControl(this.m_oPanelRight);

		this.m_oPanelRight_buttonRulers = CreateControl("id_buttonRulers");
		this.m_oPanelRight_buttonRulers.Bounds.SetParams(0, 0, 1000, 1000, false, false, false, false, -1, ScrollWidthMm);
		this.m_oPanelRight_buttonRulers.Anchor = (g_anchor_left | g_anchor_top | g_anchor_right);
		this.m_oPanelRight.AddControl(this.m_oPanelRight_buttonRulers);

		var _vertScrollTop = ScrollWidthMm;
		if (GlobalSkin.RulersButton === false)
		{
			this.m_oPanelRight_buttonRulers.HtmlElement.style.display = "none";
			_vertScrollTop                                            = 0;
		}

		this.m_oPanelRight_buttonNextPage = CreateControl("id_buttonNextPage");
		this.m_oPanelRight_buttonNextPage.Bounds.SetParams(0, 0, 1000, 1000, false, false, false, false, -1, ScrollWidthMm);
		this.m_oPanelRight_buttonNextPage.Anchor = (g_anchor_left | g_anchor_bottom | g_anchor_right);
		this.m_oPanelRight.AddControl(this.m_oPanelRight_buttonNextPage);

		this.m_oPanelRight_buttonPrevPage = CreateControl("id_buttonPrevPage");
		this.m_oPanelRight_buttonPrevPage.Bounds.SetParams(0, 0, 1000, ScrollWidthMm, false, false, false, true, -1, ScrollWidthMm);
		this.m_oPanelRight_buttonPrevPage.Anchor = (g_anchor_left | g_anchor_bottom | g_anchor_right);
		this.m_oPanelRight.AddControl(this.m_oPanelRight_buttonPrevPage);

		var _vertScrollBottom = 2 * ScrollWidthMm;
		if (GlobalSkin.NavigationButtons == false)
		{
			this.m_oPanelRight_buttonNextPage.HtmlElement.style.display = "none";
			this.m_oPanelRight_buttonPrevPage.HtmlElement.style.display = "none";
			_vertScrollBottom                                           = 0;
		}

		this.m_oPanelRight_vertScroll = CreateControl("id_vertical_scroll");
		this.m_oPanelRight_vertScroll.Bounds.SetParams(0, _vertScrollTop, 1000, _vertScrollBottom, false, true, false, true, -1, -1);
		this.m_oPanelRight_vertScroll.Anchor = (g_anchor_left | g_anchor_top | g_anchor_right | g_anchor_bottom);
		this.m_oPanelRight.AddControl(this.m_oPanelRight_vertScroll);
		// --------------------------------------------------------------------------

		// --- left ---
		this.m_oLeftRuler = CreateControlContainer("id_panel_left");
		this.m_oLeftRuler.Bounds.SetParams(0, 0, 1000, 1000, false, false, false, false, 5, -1);
		this.m_oLeftRuler.Anchor = (g_anchor_left | g_anchor_top | g_anchor_bottom);
		this.m_oMainContent.AddControl(this.m_oLeftRuler);

		this.m_oLeftRuler_buttonsTabs = CreateControl("id_buttonTabs");
		this.m_oLeftRuler_buttonsTabs.Bounds.SetParams(0, 0.8, 1000, 1000, false, true, false, false, -1, 5);
		this.m_oLeftRuler_buttonsTabs.Anchor = (g_anchor_left | g_anchor_top | g_anchor_right);
		this.m_oLeftRuler.AddControl(this.m_oLeftRuler_buttonsTabs);

		this.m_oLeftRuler_vertRuler = CreateControl("id_vert_ruler");
		this.m_oLeftRuler_vertRuler.Bounds.SetParams(0, 7, 1000, 1000, false, true, false, false, -1, -1);
		this.m_oLeftRuler_vertRuler.Anchor = (g_anchor_left | g_anchor_right | g_anchor_top | g_anchor_bottom);
		this.m_oLeftRuler.AddControl(this.m_oLeftRuler_vertRuler);
		// ------------

		// --- top ----
		this.m_oTopRuler = CreateControlContainer("id_panel_top");
		this.m_oTopRuler.Bounds.SetParams(5, 0, 1000, 1000, true, false, false, false, -1, 7);
		this.m_oTopRuler.Anchor = (g_anchor_left | g_anchor_top | g_anchor_right);
		this.m_oMainContent.AddControl(this.m_oTopRuler);

		this.m_oTopRuler_horRuler = CreateControl("id_hor_ruler");
		this.m_oTopRuler_horRuler.Bounds.SetParams(0, 0, 1000, 1000, false, false, false, false, -1, -1);
		this.m_oTopRuler_horRuler.Anchor = (g_anchor_left | g_anchor_right | g_anchor_top | g_anchor_bottom);
		this.m_oTopRuler.AddControl(this.m_oTopRuler_horRuler);
		// ------------

		// scroll hor --
		this.m_oScrollHor = CreateControlContainer("id_horscrollpanel");
		this.m_oScrollHor.Bounds.SetParams(0, 0, ScrollWidthMm, 1000, false, false, true, false, -1, ScrollWidthMm);
		this.m_oScrollHor.Anchor = (g_anchor_left | g_anchor_right | g_anchor_bottom);
		this.m_oMainContent.AddControl(this.m_oScrollHor);
		// -------------

		// notes ----
		this.m_oNotesContainer = CreateControlContainer("id_panel_notes");
		this.m_oNotesContainer.Bounds.SetParams(0, 0, g_dKoef_pix_to_mm, 1000, true, true, true, false, -1, this.Splitter2Pos);
		this.m_oNotesContainer.Anchor = (g_anchor_left | g_anchor_right | g_anchor_bottom);
		this.m_oMainParent.AddControl(this.m_oNotesContainer);

		this.m_oNotes = CreateControl("id_notes");
		this.m_oNotes.Bounds.SetParams(0, 0, ScrollWidthMm, 1000, false, false, true, false, -1, -1);
		this.m_oNotes.Anchor = (g_anchor_left | g_anchor_top | g_anchor_right | g_anchor_bottom);
		this.m_oNotesContainer.AddControl(this.m_oNotes);

		this.m_oNotesOverlay = CreateControl("id_notes_overlay");
		this.m_oNotesOverlay.Bounds.SetParams(0, 0, ScrollWidthMm, 1000, false, false, true, false, -1, -1);
		this.m_oNotesOverlay.Anchor = (g_anchor_left | g_anchor_top | g_anchor_right | g_anchor_bottom);
		this.m_oNotesContainer.AddControl(this.m_oNotesOverlay);

		this.m_oNotes_scroll = CreateControl("id_vertical_scroll_notes");
		this.m_oNotes_scroll.Bounds.SetParams(0, 0, 1000, 1000, false, false, false, false, ScrollWidthMm, -1);
		this.m_oNotes_scroll.Anchor = (g_anchor_top | g_anchor_right | g_anchor_bottom);
		this.m_oNotesContainer.AddControl(this.m_oNotes_scroll);

		if (!GlobalSkin.SupportNotes)
		{
			this.m_oNotesContainer.HtmlElement.style.display = "none";
		}

		// ----------

		this.m_oMainView = CreateControlContainer("id_main_view");
		var useScrollW = (this.m_oApi.isMobileVersion || this.m_oApi.isReporterMode) ? 0 : ScrollWidthMm;
		this.m_oMainView.Bounds.SetParams(5, 7, useScrollW, useScrollW, true, true, true, true, -1, -1);
		this.m_oMainView.Anchor = (g_anchor_left | g_anchor_right | g_anchor_top | g_anchor_bottom);
		this.m_oMainContent.AddControl(this.m_oMainView);

		this.m_oEditor = CreateControl("id_viewer");
		this.m_oEditor.Bounds.SetParams(0, 0, 1000, 1000, false, false, false, false, -1, -1);
		this.m_oEditor.Anchor = (g_anchor_left | g_anchor_top | g_anchor_right | g_anchor_bottom);
		this.m_oMainView.AddControl(this.m_oEditor);

		this.m_oOverlay = CreateControl("id_viewer_overlay");
		this.m_oOverlay.Bounds.SetParams(0, 0, 1000, 1000, false, false, false, false, -1, -1);
		this.m_oOverlay.Anchor = (g_anchor_left | g_anchor_top | g_anchor_right | g_anchor_bottom);
		this.m_oMainView.AddControl(this.m_oOverlay);

		if (this.m_oApi.isReporterMode)
		{
			var _documentParent = document.createElement("div");
			_documentParent.setAttribute("id", "id_reporter_dem_parent");
			_documentParent.setAttribute("class", "block_elem");
			_documentParent.style.overflow = "hidden";
			_documentParent.style.zIndex = 11;
			_documentParent.style.backgroundColor = GlobalSkin.BackgroundColor;
			this.m_oMainView.HtmlElement.appendChild(_documentParent);

			this.m_oDemonstrationDivParent = CreateControlContainer("id_reporter_dem_parent");
			this.m_oDemonstrationDivParent.Bounds.SetParams(0, 0, 1000, 1000, false, false, false, false, -1, -1);
			this.m_oDemonstrationDivParent.Anchor = (g_anchor_left | g_anchor_right | g_anchor_top | g_anchor_bottom);
			this.m_oMainView.AddControl(this.m_oDemonstrationDivParent);

			var _documentDem = document.createElement("div");
			_documentDem.setAttribute("id", "id_reporter_dem");
			_documentDem.setAttribute("class", "block_elem");
			_documentDem.style.overflow = "hidden";
			_documentDem.style.backgroundColor = GlobalSkin.BackgroundColor;
			_documentParent.appendChild(_documentDem);

			this.m_oDemonstrationDivId = CreateControlContainer("id_reporter_dem");
			this.m_oDemonstrationDivId.Bounds.SetParams(0, 0, 1000, 8, false, false, false, true, -1, -1);
			this.m_oDemonstrationDivId.Anchor = (g_anchor_left | g_anchor_right | g_anchor_top | g_anchor_bottom);
			this.m_oDemonstrationDivParent.AddControl(this.m_oDemonstrationDivId);
			this.m_oDemonstrationDivId.HtmlElement.style.cursor = "default";

			// bottons
			var demBottonsDiv = document.createElement("div");
			demBottonsDiv.setAttribute("id", "id_reporter_dem_controller");
			demBottonsDiv.setAttribute("class", "block_elem");
			demBottonsDiv.style.overflow = "hidden";
			demBottonsDiv.style.backgroundColor = GlobalSkin.BackgroundColor;
			demBottonsDiv.style.cursor = "default";
			_documentParent.appendChild(demBottonsDiv);

			demBottonsDiv.onmousedown = function (e) { AscCommon.stopEvent(e); };

			var _ctrl = CreateControlContainer("id_reporter_dem_controller");
			_ctrl.Bounds.SetParams(0, 0, 1000, 1000, false, false, false, false, -1, 8);
			_ctrl.Anchor = (g_anchor_left | g_anchor_right | g_anchor_bottom);
			this.m_oDemonstrationDivParent.AddControl(_ctrl);

			var _head = document.getElementsByTagName('head')[0];

			var styleContent = ".block_elem_no_select { -khtml-user-select: none; user-select: none; -moz-user-select: none; -webkit-user-select: none; }";
			styleContent += ".back_image_buttons { position:absolute; left: 0px; top: 0px; background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAB4CAQAAAAEPFmDAAAEQElEQVR4Ae2XQWtUVxiGr2JiTE3ENGgrKJYmm6gCsYBIEsA+hcjYwnSjSagrvYBb951xnV0ghEj2oroPtAEF7Gb+QiBBEqAmPyGGt4ePXrhM7nxnoKQDcp6PO3xneOHhnJl7OCdL/K8kmGAdxXOa0Lq6yHGee+Sx0CjL7PMsJtaolrWvZzExA0zxiJuumP4g3A/i0dDLkfYH4X4Qh5wn5mQQPgrigSxzxNTZZJ2JzEBYVWjr2tS6/s3JqNJzlYfc43xmkFsd1fOCQ+ayNo6K9UKHOpI7KmaGJ4xlbVSJB1lih9moeFBL2tFsVHyKOyxwOSY2uMs2qww5S23orra1qiFnqQ0uMcc0fc5SFzDMGlvM2FwdNKw1bSnk5OboZybIv7W5xqDGLouu2FBNu1pUNMcVFrht4hiM8MrEETSiVyaOwGkwcSKRSHxJIF4yEs9JeqkucuT8yOnuxIvsUutCvKhd1eJibrPAlS7E4ZlmizWGfXF4prWlNQ374vB8wxwz9HdUYmX9EKtsc7daKcP6Ia1qW+25I2cs+pgO8ksdxG3jWXZY4kzsdKVZ7WhJZ2KnKy6zwB1O+WKDOQ5ZccWG5nSoFVdsMMYTprylLu4Sm9TdpS7uEpuqu0td3CUectX/cxV3if7In6u4Szg58tJd4qT/Oj1lz+4SLpKeai+IIzlyJoq7hAuyu0QUqbhLRMV2l0gkEonjArFCXzwnaUVd5MiZ6rRDt399Kfsztk8XOXWT+yqrMdCNuJ79lbW4mcWwnOK5P7K/s3r0+Ijs8wGf+NVfavt8oE9yc+T2+T2/8V1MbDDJRxqccMSGJvVRDZ1wxAajzHMrJja4wAfectYRG7qgD3qrs47Y4Ay/8BN9vtjgInu8ccWGLmpPb2JiUz+CmLg4Yw5GxMUZc9ARe2fMgtipuiB2qi7wT9W9vUf0/ObEa762NiZ+rWjOxDCQJRKJxDHCNX9coGv+uIDz7riAG3zm99K4EcY3KrQ39FmlnBphXJFjhCdMlsa3wnikWv0cmdq0iGZWiZ5LpjatpA45fiA3tWnJneOPqRuetqRuuNpCbTpfa9BEvHO1hpqS3rlaw5T3Y1rDtO+yKKbtImfa+/FYA/HeFtzFFvm9LXh8xj9HZ1z8tjR9dfHbqumrTRv/jWma1vDUprOcry7pHLW9x2UVTec9LnKmdt5jU8Xf4+td7lzXu9y5RvydK5FIJP47CKFyV42MclcNOaHKnXcxV9F5YnuKzhHbU3RJnMRJfHziHmwgiUQi8QXAPC0OQrWY93KaV0sHoVpyc4xR53GoOmNebBmVarmjdlllOuaYIi/VVOfZqq3mO8y2nfkOs83bqnrWtEy2wXioDetbleKWyTY0HmrD+socdZPVOBeqZn29WnxgsnHrx60/qBQfmMxyGre+Msdjk52z/pz1j3sm7uVS9/7P1fvXqRcbSCJxDPwD2RsvhewoOKQAAAAASUVORK5CYII=') }";

			styleContent += "@media all and (-webkit-min-device-pixel-ratio : 1.5),\
		all and (-o-min-device-pixel-ratio: 3/2),\
		all and (min--moz-device-pixel-ratio: 1.5),\
		all and (min-device-pixel-ratio: 1.5) {\n\
		\
		.back_image_buttons { position:absolute; left: 0px; top: 0px; background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAADwCAQAAABhjmjsAAAJJklEQVR4Ae3bA5RdaboG4KcqlWrbxDCoNUkLyai1x7Ztm6hkbLM1to09iNadGPdGbTteuUGl+tT1f3Vq9k7932X+txX1u74n69usnB57WAr4f2cKuIALuIALuIAL+MJJPuYhcb9NdXBfdYhznICLjA6+UMscbqYX6Yvaizq4r9rbGSboJQLc75Xe4WDDLvKy/AHr4L6q14DT9OtYa1I++LE+7B74jddbbSR3wDq4rzrZOQ7Ejebb6EV54FN93LlY7fV+A3kD1sF91eHOcSw2mu9GyAEf472eo9c6gy4yTN6AdXBfta8z3UuPHRZbq0MOuN8rDTrAkM94r02kjIzlPF8H9qWj9nTjday01BCQwEi5qAU4HbU/9iZXQd6AdXBfOmqvM98WyACno3aZ15lllLRfxzq4Lx2168x3S0Pfi9qAX+7D9rXdY/2WAHBwXzXZ2foM+52biABzL19zthFf8EbbcgekDu6rDnKeI7HafMMRYPq8yaB+V3q2P+cOSB3cV/Wa4nS9Npvl9ggwTPFVU9zlowbtzD2rUgf3VYc512FGrLDEXblnaaDfoDfps9KzLMsdkDq4r+p1uil6bTDLuggwnO0rJtjlvd5vOOBOK7ivOtK5Dtax1HIdyL21ZF8f9Ao9FnmWtbkDUgf3VX3OMoA7/cmmCDCc7zIn2e5tPu2ugKel4L7qWOfa37BFVnphBJgDfdzzMdsD8wekDu6r+p1jAm51TAwYHu5ix8S9GKqD+6oTPcC+xIE51Oc9OfAVT3BftZf7uXsz+P9xCriAC7iAC7iAC7iAC7iAC7iAC7iAC7iAC3gE3/FyG4SkDu6rXoSrzbMzEsytXuiXIeDAvgRmmzluCAKnN8eXep0tAeCYvgROb6LXmm8oBjzOq3zA3q73PH8MAAf1JfDFBpxlnK1muSUC3INJvuoMIz7jLbZngAP7EvgiHOJcR2ClhYYjwPR5m3cYb63nWJABDu1LYHpNdZpem8xyRztw89drT/U1A4Z92ExDrZHBfdXoX/893LkO1bHCEp0IMHuZ6Q3GWeHZVrQER/U1gxnndFP0WG+W9e3B9Bg903zNPQyZ6cOGW4BD+9Iaj56jnOdAHUus0IkAs5+PeIkeCzzb5Y3g2L5mMH3OMQl3mGVTBBge6sf2ss2bfK4BHNzXAgwneJBxhi2wKgJ8rk+aglleZ1kDOLivFfhY0xyGW8y3LuekBffwYY/FNd7gxxpTx/U1n7TgQOc4GVvMdx3kgA/2Dq/Ub6sP+rjttADH9TWD+51mQK9dlvsbwzk3HvR5kZkO1/EV73CrMaTO6mtY714TnGFvI66wyDbIAT/Ex0xqOMqawcF9CcwJznFIOmqRA/6XD9tc5U1+LCN1aF8C/8uHd9JRmwf+vBfps8l7fcYQWeDAvgRebYJeQ5ZaqUM+mGEXGbROdurAvgSmY63FdkA2OH3YJiR1VF8Cpw/vlJd4BVzABVzABVzABVzABVzABVzABVzABVzAChiM4CtebpuQ1MF91YtwhXmGI8Gs9GSrQ8CBfQnMBn+wMQ682iTbvNxXAsCBfQm80SGGzXNFFHg/n/OcmFWsA/sS+DL3c6+02gHgHjzH5+ybv4p1cF/62tK93E9fWu0AMAO+m7+KdXBfAnOoC9Jqh4DZN38V6+C+BIa+LqudBUZaxadYlQEO6OsC1mW188D5q1g39OWBu6x2ADhrFeuAvgZwl9XOAOeuYh3Q1wDustoZ4NxVrPP6GsANq50Jnuh7BgLBqS8IfLALHZrAQSu9xpOsDFzp1Be00pv83oZy0tpN8CTfNZBxWWroywYf4gKHBlyW8lYvgWP7ErhhlcutZQM4f/USOLIvgbutchY4f/USOLQvgRtWubwAaACvzF+9BA7sS+ANDo19xcNqT7aSAHBgXwKz0R9sUF7TlhfxBVzABVzABVzABVzABVzABVzABVzABVzA09zfh42eN5ljvtapg/uqoxxthdEzxa3uaA+e5tcOMsNM3TNohs0e6s8tuWF9iftQ/ZZYontOd7ohv3Z7W/DbvA/SiP95PHi797cEB/dVpzoTEvk/c2GRZW3BzDCYRuw+3kwztE4d3Ff9A6o7efSfSeBGcu54UIf0NZAbuAncTM4dD+qAvgZyAzeB25Bzx4O6oS+P3MBN4LZkueNB3dCXQdbATeC2ZPnjQR3cl8gkbh44kSPGgzq0L5ETNxOcjrV07GWDg/uCwYkbNGId3Be90ulMisH8EeuovviTVpfr5IzcEeuAvsDLUgNX7oh1QF/kjUcDN3fEOqAv8taygZs7Yh3aF//w8FbvRxpvlBHf5gMtucF91VRntXg8XGh5W/B0v3JQGq/7iJs9zF+1BMf1xb8ASOT7+5DR82Zz244HdVhfIh9judEz1a1uLy/xCvj/dQq4gAu4gAu4gAu4gAu4gAu4gAu4gAu4gHtHSOkBdPuxlvltcN+Dx9TX8yCjZo8E96T/jvZj7cHBfQ9u7CvgAi7gAi7gAi7gAi7gAi7gAi7gAi4vAAp4D0gBF3ABF3ABF3ABF3ABF3ABF3ABF3AB7wEp4ALu7O9pHuM+jsLt/tpPfMtWY04d3FeNdw8nO9Q+2G6D61xl19j/JN7zfdDhQMo6b3XJGLnBfdUEZ9kbSNlhobVjAfe71DN0zzc9z9BuYoP7ql4PdE/dc5VZOrsL/noar/uIz9hNcHBfdV7idif/cffAz29csxe6RHtucF81wQP85cyxtj14f9c6vKFwnVNsbckN7qvGe6q9/eXs8G272oJf5Euk3OjtalTe60RSXuyiluDgvmqi+5Oy1SI34zhn2p+Uuda0Bf/Sw0jjnel2wFEWSiP6lYe3BAf3VQ9xIon7Y9sB+3isRHaD37QF3+Q4AM/ydVKe6WsAbnZ8S3BwX/V0+wH4kyuluKfzAPytb7YF79IH4Bi3SXFU+h7DxrcEB/dVL9AL4Bu2SbGPZwLouKSAy0oDv/LQFieZX3tYS3BwX/VQJ7Q4ad3o12O7LN3gHX6HBwVdllJf4GXpJhw/2mWp3HiUW8vmh4dveGbow0PqC3p4uNKfIh8Pv+H5oY+HqS/o8fBKs3XiXgC8xaXGlDqwL/4FALBnvOIpny4t4AIu4AIu4AIu4AIOyN8BqEAas3b9nocAAAAASUVORK5CYII=');background-size: 60px 120px; }\
		\
		}";


			styleContent += "";
			styleContent += ".btn-text-default { position: absolute; background: #fff; border: 1px solid #cfcfcf; border-radius: 2px; color: #444444; font-size: 11px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; height: 22px; cursor: pointer; }";
			styleContent += ".btn-text-default-img { background-repeat: no-repeat; position: absolute; background: transparent; border: none; color: #444444; font-size: 11px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; height: 22px; cursor: pointer; }";
			styleContent += ".btn-text-default-img:focus { outline: 0; outline-offset: 0; } .btn-text-default-img:hover { background-color: #d8dadc; }";
			styleContent += ".btn-text-default-img:active, .btn-text-default.active { background-color: #7d858c !important; color: white; -webkit-box-shadow: none; box-shadow: none; }";
			styleContent += ".btn-text-default:focus { outline: 0; outline-offset: 0; } .btn-text-default:hover { background-color: #d8dadc; }";
			styleContent += ".btn-text-default:active, .btn-text-default.active { background-color: #7d858c !important; color: white; -webkit-box-shadow: none; box-shadow: none; }";
			styleContent += ".separator { margin: 0px 10px; height: 19px; display: inline-block; position: absolute; border-left: 1px solid #cbcbcb; vertical-align: top; padding: 0; width: 0; box-sizing: border-box; }";
			styleContent += ".btn-play { background-position: 0px -40px; } .btn-play:active { background-position: -20px -40px; }";
			styleContent += ".btn-prev { background-position: 0px 0px; } .btn-prev:active { background-position: -20px 0px; }";
			styleContent += ".btn-next { background-position: 0px -20px; } .btn-next:active { background-position: -20px -20px; }";
			styleContent += ".btn-pause { background-position: 0px -80px; } .btn-pause:active { background-position: -20px -80px; }";
			styleContent += ".btn-pointer { background-position: 0px -100px; } .btn-pointer-active { background-position: -20px -100px; }";
			styleContent += ".btn-pointer:active { background-position: -20px -100px; }";
			styleContent += ".btn-text-default-img2 { background-repeat: no-repeat; position: absolute; background-color: #7d858c; border: none; color: #7d858c; font-size: 11px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; height: 22px; cursor: pointer; }";
			styleContent += ".btn-text-default-img2:focus { outline: 0; outline-offset: 0; }";
			styleContent += ".btn-text-default::-moz-focus-inner { border: 0; padding: 0; }";
			styleContent += ".btn-text-default-img::-moz-focus-inner { border: 0; padding: 0; }";
			styleContent += ".btn-text-default-img2::-moz-focus-inner { border: 0; padding: 0; }";


			var style		 = document.createElement('style');
			style.type 	 = 'text/css';
			style.innerHTML = styleContent;
			_head.appendChild(style);

			this.reporterTranslates = ["Reset", "Slide {0} of {1}", "End slideshow"];
			var _translates = this.m_oApi.reporterTranslates;
			if (_translates)
			{
				this.reporterTranslates[0] = _translates[0];
				this.reporterTranslates[1] = _translates[1];
				this.reporterTranslates[2] = _translates[2];

				if (_translates[3])
					this.m_oApi.DemonstrationEndShowMessage(_translates[3]);
			}

			var _buttonsContent = "";
			_buttonsContent += "<label class=\"block_elem_no_select\" id=\"dem_id_time\" style=\"color:#666666;text-shadow: none;white-space: nowrap;font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; position:absolute; left:10px; bottom: 7px;\">00:00:00</label>";
			_buttonsContent += "<button class=\"btn-text-default-img\" id=\"dem_id_play\" style=\"left: 60px; bottom: 3px; width: 20px; height: 20px;\"><span class=\"btn-play back_image_buttons\" id=\"dem_id_play_span\" style=\"width:100%;height:100%;\"></span></button>";
			_buttonsContent += ("<button class=\"btn-text-default\"     id=\"dem_id_reset\" style=\"left: 85px; bottom: 2px; \">" + this.reporterTranslates[0] + "</button>");
			_buttonsContent += ("<button class=\"btn-text-default\"     id=\"dem_id_end\" style=\"right: 10px; bottom: 2px; \">" + this.reporterTranslates[2] + "</button>");

			_buttonsContent += "<button class=\"btn-text-default-img\" id=\"dem_id_prev\"  style=\"left: 150px; bottom: 3px; width: 20px; height: 20px;\"><span class=\"btn-prev back_image_buttons\" style=\"width:100%;height:100%;\"></span></button>";
			_buttonsContent += "<button class=\"btn-text-default-img\" id=\"dem_id_next\"  style=\"left: 170px; bottom: 3px; width: 20px; height: 20px;\"><span class=\"btn-next back_image_buttons\" style=\"width:100%;height:100%;\"></span></button>";

			_buttonsContent += "<div class=\"separator block_elem_no_select\" id=\"dem_id_sep\" style=\"left: 185px; bottom: 3px;\"></div>";

			_buttonsContent += "<label class=\"block_elem_no_select\" id=\"dem_id_slides\" style=\"color:#666666;text-shadow: none;white-space: nowrap;font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; position:absolute; left:207px; bottom: 7px;\"></label>";

			_buttonsContent += "<div class=\"separator block_elem_no_select\" id=\"dem_id_sep2\" style=\"left: 350px; bottom: 3px;\"></div>";

			_buttonsContent += "<button class=\"btn-text-default-img\" id=\"dem_id_pointer\"  style=\"left: 365px; bottom: 3px; width: 20px; height: 20px;\"><span id=\"dem_id_pointer_span\" class=\"btn-pointer back_image_buttons\" style=\"width:100%;height:100%;\"></span></button>";

			demBottonsDiv.innerHTML = _buttonsContent;

			// events
			this.m_oApi.asc_registerCallback("asc_onDemonstrationSlideChanged", function (slideNum)
			{
				var _elem = document.getElementById("dem_id_slides");
				if (!_elem)
					return;

				var _count = window.editor.getCountPages();
				var _current = slideNum + 1;
				if (_current > _count)
					_current = _count;

				var _text = "Slide {0} of {1}";
				if (window.editor.WordControl.reporterTranslates)
					_text = window.editor.WordControl.reporterTranslates[1];
				_text = _text.replace("{0}", _current);
				_text = _text.replace("{1}", _count);

				_elem.innerHTML = _text;

				//window.editor.WordControl.Thumbnails.SelectPage(_current - 1);
				window.editor.WordControl.GoToPage(_current - 1, false, false, true);

				window.editor.WordControl.OnResizeReporter();
			});

			this.m_oApi.asc_registerCallback("asc_onEndDemonstration", function ()
			{
				try
				{
					window.editor.sendFromReporter("{ \"reporter_command\" : \"end\" }");
				}
				catch (err)
				{
				}
			});

			this.m_oApi.asc_registerCallback("asc_onDemonstrationFirstRun", function ()
			{
				var _elem = document.getElementById("dem_id_play_span");
				_elem.classList.remove("btn-play");
				_elem.classList.add("btn-pause");

				var _wordControl = window.editor.WordControl;
				_wordControl.reporterTimerLastStart = new Date().getTime();
				_wordControl.reporterTimer = setInterval(_wordControl.reporterTimerFunc, 1000);

			});

			this.elementReporter1 = document.getElementById("dem_id_end");
			this.elementReporter1.onclick = function() {
				window.editor.EndDemonstration();
			};

			this.elementReporter2 = document.getElementById("dem_id_prev");
			this.elementReporter2.onclick = function() {
				window.editor.DemonstrationPrevSlide();
			};

			this.elementReporter3 = document.getElementById("dem_id_next");
			this.elementReporter3.onclick = function() {
				window.editor.DemonstrationNextSlide();
			};

			this.elementReporter4 = document.getElementById("dem_id_play");
			this.elementReporter4.onclick = function() {

				var _wordControl = window.editor.WordControl;
				var _isNowPlaying = _wordControl.DemonstrationManager.IsPlayMode;
				var _elem = document.getElementById("dem_id_play_span");

				if (_isNowPlaying)
				{
					window.editor.DemonstrationPause();

					_elem.classList.remove("btn-pause");
					_elem.classList.add("btn-play");

					if (-1 != _wordControl.reporterTimer)
					{
						clearInterval(_wordControl.reporterTimer);
						_wordControl.reporterTimer = -1;
					}

					_wordControl.reporterTimerAdd = _wordControl.reporterTimerFunc(true);

					window.editor.sendFromReporter("{ \"reporter_command\" : \"pause\" }");
				}
				else
				{
					window.editor.DemonstrationPlay();

					_elem.classList.remove("btn-play");
					_elem.classList.add("btn-pause");

					_wordControl.reporterTimerLastStart = new Date().getTime();

					_wordControl.reporterTimer = setInterval(_wordControl.reporterTimerFunc, 1000);

					window.editor.sendFromReporter("{ \"reporter_command\" : \"play\" }");
				}
			};

			this.elementReporter5 = document.getElementById("dem_id_reset");
			this.elementReporter5.onclick = function() {

				var _wordControl = window.editor.WordControl;
				_wordControl.reporterTimerAdd = 0;
				_wordControl.reporterTimerLastStart = new Date().getTime();
				_wordControl.reporterTimerFunc();

			};

			this.elementReporter6 = document.getElementById("dem_id_pointer");
			this.elementReporter6.onclick = function() {

				var _wordControl = window.editor.WordControl;
				var _elem1 = document.getElementById("dem_id_pointer");
				var _elem2 = document.getElementById("dem_id_pointer_span");

				if (_wordControl.reporterPointer)
				{
					_elem1.classList.remove("btn-text-default-img2");
					_elem1.classList.add("btn-text-default-img");

					_elem2.classList.remove("btn-pointer-active");
					_elem2.classList.add("btn-pointer");
				}
				else
				{
					_elem1.classList.remove("btn-text-default-img");
					_elem1.classList.add("btn-text-default-img2");

					_elem2.classList.remove("btn-pointer");
					_elem2.classList.add("btn-pointer-active");
				}

				_wordControl.reporterPointer = !_wordControl.reporterPointer;

				if (!_wordControl.reporterPointer)
					_wordControl.DemonstrationManager.PointerRemove();
			};

			window.onkeydown = this.onKeyDown;
			window.onkeyup = this.onKeyUp;

			if (!window["AscDesktopEditor"])
			{
				if (window.attachEvent)
					window.attachEvent('onmessage', this.m_oApi.DemonstrationToReporterMessages);
				else
					window.addEventListener('message', this.m_oApi.DemonstrationToReporterMessages, false);
			}

			document.oncontextmenu = function(e)
			{
				AscCommon.stopEvent(e);
				return false;
			};
		}
		else
		{
			if (window.addEventListener)
			{
				window.addEventListener("beforeunload", function (e)
				{
					window.editor.EndDemonstration();
				});
			}

			this.m_oBody.HtmlElement.oncontextmenu = function(e)
			{
				if (AscCommon.AscBrowser.isVivaldiLinux)
				{
					AscCommon.Window_OnMouseUp(e);
				}
				AscCommon.stopEvent(e);
				return false;
			};
		}
		// --------------------------------------------------------------------------

		this.m_oDrawingDocument.TargetHtmlElement = document.getElementById('id_target_cursor');

		if (this.m_oApi.isMobileVersion)
		{
			this.MobileTouchManager = new AscCommon.CMobileTouchManager( { eventsElement : "slides_mobile_element" } );
			this.MobileTouchManager.Init(this.m_oApi);

			this.MobileTouchManagerThumbnails = new AscCommon.CMobileTouchManagerThumbnails( { eventsElement : "slides_mobile_element" } );
			this.MobileTouchManagerThumbnails.Init(this.m_oApi);
		}

		if (this.IsSupportNotes)
		{
			this.m_oNotes.HtmlElement.style.backgroundColor = GlobalSkin.BackgroundColor;
			this.m_oNotesContainer.HtmlElement.style.backgroundColor = GlobalSkin.BackgroundColor;
			this.m_oNotesContainer.HtmlElement.style.borderTop = ("1px solid " + GlobalSkin.BorderSplitterColor);
		}

		this.m_oOverlayApi.m_oControl  = this.m_oOverlay;
		this.m_oOverlayApi.m_oHtmlPage = this;
		this.m_oOverlayApi.Clear();
		this.ShowOverlay();

		this.m_oDrawingDocument.AutoShapesTrack = new AscCommon.CAutoshapeTrack();
		this.m_oDrawingDocument.AutoShapesTrack.init2(this.m_oOverlayApi);

		this.SlideDrawer.m_oWordControl = this;

		this.checkNeedRules();
		this.initEvents();
		this.OnResize(true);

		this.m_oNotesApi = new CNotesDrawer(this);
		this.m_oNotesApi.Init();

		if (this.m_oApi.isReporterMode)
			this.m_oApi.StartDemonstration(this.Name, 0);
	};

	this.CheckRetinaDisplay = function()
	{
		var old = this.bIsRetinaSupport;
		if (!this.bIsRetinaNoSupportAttack)
		{
			this.bIsRetinaSupport       = AscCommon.AscBrowser.isRetina;
			this.m_oOverlayApi.IsRetina = this.bIsRetinaSupport;

			if (this.m_oNotesApi && this.m_oNotesApi.m_oOverlayApi)
				this.m_oNotesApi.m_oOverlayApi.IsRetina = this.bIsRetinaSupport;
		}
		else
		{
			this.bIsRetinaSupport = false;
			this.m_oOverlayApi.IsRetina = this.bIsRetinaSupport;

			if (this.m_oNotesApi && this.m_oNotesApi.m_oOverlayApi)
				this.m_oNotesApi.m_oOverlayApi.IsRetina = this.bIsRetinaSupport;
		}

		if (old != this.bIsRetinaSupport)
		{
			// сбросить кэш страниц
			this.onButtonTabsDraw();
		}
	};

	this.CheckRetinaElement = function(htmlElem)
	{
		if (this.bIsRetinaSupport)
		{
			if (htmlElem.id == "id_viewer" ||
				(htmlElem.id == "id_viewer_overlay" && this.m_oOverlayApi.IsRetina) ||
				htmlElem.id == "id_hor_ruler" ||
				htmlElem.id == "id_vert_ruler" ||
				htmlElem.id == "id_buttonTabs" ||
				htmlElem.id == "id_notes" ||
				(htmlElem.id == "id_notes_overlay" && this.m_oOverlayApi.IsRetina))
				return true;
		}
		return false;
	};

	this.ShowOverlay        = function()
	{
		this.m_oOverlayApi.Show();
	};
	this.UnShowOverlay      = function()
	{
		this.m_oOverlayApi.UnShow();
	};
	this.CheckUnShowOverlay = function()
	{
		var drDoc = this.m_oDrawingDocument;

		/*
		 if (!drDoc.m_bIsSearching && !drDoc.m_bIsSelection)
		 {
		 this.UnShowOverlay();
		 return false;
		 }
		 */

		return true;
	};
	this.CheckShowOverlay   = function()
	{
		var drDoc = this.m_oDrawingDocument;
		if (drDoc.m_bIsSearching || drDoc.m_bIsSelection)
			this.ShowOverlay();
	};

	this.initEvents = function()
	{
		this.arrayEventHandlers[0] = new AscCommon.button_eventHandlers("", "0px 0px", "0px -16px", "0px -32px", this.m_oPanelRight_buttonRulers, this.onButtonRulersClick);
		this.arrayEventHandlers[1] = new AscCommon.button_eventHandlers("", "0px 0px", "0px -16px", "0px -32px", this.m_oPanelRight_buttonPrevPage, this.onPrevPage);
		this.arrayEventHandlers[2] = new AscCommon.button_eventHandlers("", "0px -48px", "0px -64px", "0px -80px", this.m_oPanelRight_buttonNextPage, this.onNextPage);

		this.m_oLeftRuler_buttonsTabs.HtmlElement.onclick = this.onButtonTabsClick;

        AscCommon.addMouseEvent(this.m_oEditor.HtmlElement, "down", this.onMouseDown);
        AscCommon.addMouseEvent(this.m_oEditor.HtmlElement, "move", this.onMouseMove);
        AscCommon.addMouseEvent(this.m_oEditor.HtmlElement, "up", this.onMouseUp);

        AscCommon.addMouseEvent(this.m_oOverlay.HtmlElement, "down", this.onMouseDown);
        AscCommon.addMouseEvent(this.m_oOverlay.HtmlElement, "move", this.onMouseMove);
        AscCommon.addMouseEvent(this.m_oOverlay.HtmlElement, "up", this.onMouseUp);

        var _cur         = document.getElementById('id_target_cursor');
        AscCommon.addMouseEvent(_cur, "down", this.onMouseDownTarget);
        AscCommon.addMouseEvent(_cur, "move", this.onMouseMoveTarget);
        AscCommon.addMouseEvent(_cur, "up", this.onMouseUpTarget);

		this.m_oMainContent.HtmlElement.onmousewheel = this.onMouseWhell;
		if (this.m_oMainContent.HtmlElement.addEventListener)
			this.m_oMainContent.HtmlElement.addEventListener("DOMMouseScroll", this.onMouseWhell, false);

		this.m_oBody.HtmlElement.onmousewheel = function(e)
		{
			e.preventDefault();
			return false;
		};

        AscCommon.addMouseEvent(this.m_oTopRuler_horRuler.HtmlElement, "down", this.horRulerMouseDown);
        AscCommon.addMouseEvent(this.m_oTopRuler_horRuler.HtmlElement, "move", this.horRulerMouseMove);
        AscCommon.addMouseEvent(this.m_oTopRuler_horRuler.HtmlElement, "up", this.horRulerMouseUp);

        AscCommon.addMouseEvent(this.m_oLeftRuler_vertRuler.HtmlElement, "down", this.verRulerMouseDown);
        AscCommon.addMouseEvent(this.m_oLeftRuler_vertRuler.HtmlElement, "move", this.verRulerMouseMove);
        AscCommon.addMouseEvent(this.m_oLeftRuler_vertRuler.HtmlElement, "up", this.verRulerMouseUp);

		if (!this.m_oApi.isMobileVersion)
		{
            AscCommon.addMouseEvent(this.m_oMainParent.HtmlElement, "down", this.onBodyMouseDown);
            AscCommon.addMouseEvent(this.m_oMainParent.HtmlElement, "move", this.onBodyMouseMove);
            AscCommon.addMouseEvent(this.m_oMainParent.HtmlElement, "up", this.onBodyMouseUp);

            AscCommon.addMouseEvent(this.m_oBody.HtmlElement, "down", this.onBodyMouseDown);
            AscCommon.addMouseEvent(this.m_oBody.HtmlElement, "move", this.onBodyMouseMove);
            AscCommon.addMouseEvent(this.m_oBody.HtmlElement, "up", this.onBodyMouseUp);
		}

		this.initEvents2MobileAdvances();

		this.Thumbnails.initEvents();
	};

	this.initEvents2MobileAdvances = function()
	{
		if (!this.m_oApi.isMobileVersion)
		{
			this.m_oEditor.HtmlElement["ontouchstart"] = function (e)
			{
				oThis.onMouseDown(e.touches[0]);
				return false;
			};
			this.m_oEditor.HtmlElement["ontouchmove"] = function (e)
			{
				oThis.onMouseMove(e.touches[0]);
				return false;
			};
			this.m_oEditor.HtmlElement["ontouchend"] = function (e)
			{
				oThis.onMouseUp(e.changedTouches[0]);
				return false;
			};

			this.m_oOverlay.HtmlElement["ontouchstart"] = function (e)
			{
				oThis.onMouseDown(e.touches[0]);
				return false;
			};
			this.m_oOverlay.HtmlElement["ontouchmove"] = function (e)
			{
				oThis.onMouseMove(e.touches[0]);
				return false;
			};
			this.m_oOverlay.HtmlElement["ontouchend"] = function (e)
			{
				oThis.onMouseUp(e.changedTouches[0]);
				return false;
			};

			this.m_oTopRuler_horRuler.HtmlElement["ontouchstart"] = function (e)
			{
				oThis.horRulerMouseDown(e.touches[0]);
				return false;
			};
			this.m_oTopRuler_horRuler.HtmlElement["ontouchmove"] = function (e)
			{
				oThis.horRulerMouseMove(e.touches[0]);
				return false;
			};
			this.m_oTopRuler_horRuler.HtmlElement["ontouchend"] = function (e)
			{
				oThis.horRulerMouseUp(e.changedTouches[0]);
				return false;
			};

			this.m_oLeftRuler_vertRuler.HtmlElement["ontouchstart"] = function (e)
			{
				oThis.verRulerMouseDown(e.touches[0]);
				return false;
			};
			this.m_oLeftRuler_vertRuler.HtmlElement["ontouchmove"] = function (e)
			{
				oThis.verRulerMouseMove(e.touches[0]);
				return false;
			};
			this.m_oLeftRuler_vertRuler.HtmlElement["ontouchend"] = function (e)
			{
				oThis.verRulerMouseUp(e.changedTouches[0]);
				return false;
			};
		}
	};

	this.initEventsMobile = function()
	{
		if (this.m_oApi.isMobileVersion)
		{
			this.m_oThumbnailsContainer.HtmlElement.style.zIndex = "11";

			this.TextBoxBackground = CreateControl(AscCommon.g_inputContext.HtmlArea.id);
			this.TextBoxBackground.HtmlElement.parentNode.parentNode.style.zIndex = 10;

			this.MobileTouchManager.initEvents(AscCommon.g_inputContext.HtmlArea.id);
			this.MobileTouchManagerThumbnails.initEvents(this.m_oThumbnails.HtmlElement.id);

			if (AscCommon.AscBrowser.isAndroid)
			{
				this.TextBoxBackground.HtmlElement["oncontextmenu"] = function(e)
				{
					if (e.preventDefault)
						e.preventDefault();

					e.returnValue = false;
					return false;
				};

				this.TextBoxBackground.HtmlElement["onselectstart"] = function(e)
				{
					oThis.m_oLogicDocument.SelectAll();

					if (e.preventDefault)
						e.preventDefault();

					e.returnValue = false;
					return false;
				};
			}
		}
	};

	this.onButtonRulersClick       = function()
	{
		if (false === oThis.m_oApi.bInit_word_control || true === oThis.m_oApi.isViewMode)
			return;

		oThis.m_bIsRuler = !oThis.m_bIsRuler;
		oThis.checkNeedRules();
		oThis.OnResize(true);
	};

	this.HideRulers = function()
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		if (oThis.m_bIsRuler === false)
			return;

		oThis.m_bIsRuler = !oThis.m_bIsRuler;
		oThis.checkNeedRules();
		oThis.OnResize(true);
	};

	this.zoom_FitToWidth_value = function()
	{
		var _value = 100;
		if (!this.m_oLogicDocument)
			return _value;

		var w = this.m_oEditor.HtmlElement.width;
		if (this.bIsRetinaSupport)
			w /= AscCommon.AscBrowser.retinaPixelRatio;

		var Zoom       = 100;
		var _pageWidth = this.m_oLogicDocument.Width * g_dKoef_mm_to_pix;
		if (0 != _pageWidth)
		{
			Zoom = 100 * (w - 2 * this.SlideDrawer.CONST_BORDER) / _pageWidth;

			if (Zoom < 5)
				Zoom = 5;
		}
		_value = Zoom >> 0;
		return _value;
	};
	this.zoom_FitToPage_value  = function(_canvas_height)
	{
		var _value = 100;
		if (!this.m_oLogicDocument)
			return _value;

		var w = this.m_oEditor.HtmlElement.width;
		var h = (undefined == _canvas_height) ? this.m_oEditor.HtmlElement.height : _canvas_height;

		if (this.bIsRetinaSupport)
		{
			w /= AscCommon.AscBrowser.retinaPixelRatio;
			h /= AscCommon.AscBrowser.retinaPixelRatio;
		}

		var _pageWidth  = this.m_oLogicDocument.Width * g_dKoef_mm_to_pix;
		var _pageHeight = this.m_oLogicDocument.Height * g_dKoef_mm_to_pix;

		var _hor_Zoom = 100;
		if (0 != _pageWidth)
			_hor_Zoom = (100 * (w - 2 * this.SlideDrawer.CONST_BORDER)) / _pageWidth;
		var _ver_Zoom = 100;
		if (0 != _pageHeight)
			_ver_Zoom = (100 * (h - 2 * this.SlideDrawer.CONST_BORDER)) / _pageHeight;

		_value = (Math.min(_hor_Zoom, _ver_Zoom) - 0.5) >> 0;

		if (_value < 5)
			_value = 5;
		return _value;
	};

	this.zoom_FitToWidth = function()
	{
		this.m_nZoomType = 1;
		if (!this.m_oLogicDocument)
			return;

		var _new_value = this.zoom_FitToWidth_value();
		if (_new_value != this.m_nZoomValue)
		{
			this.m_nZoomValue = _new_value;
			this.zoom_Fire(1);
			return true;
		}
		else
		{
			this.m_oApi.sync_zoomChangeCallback(this.m_nZoomValue, 1);
		}
		return false;
	};
	this.zoom_FitToPage  = function()
	{
		this.m_nZoomType = 2;
		if (!this.m_oLogicDocument)
			return;

		var _new_value = this.zoom_FitToPage_value();

		if (_new_value != this.m_nZoomValue)
		{
			this.m_nZoomValue = _new_value;
			this.zoom_Fire(2);
			return true;
		}
		else
		{
			this.m_oApi.sync_zoomChangeCallback(this.m_nZoomValue, 2);
		}
		return false;
	};

	this.zoom_Fire = function(type)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		this.m_nZoomType = type;

		// нужно проверить режим и сбросить кеш грамотно (ie version)
		AscCommon.g_fontManager.ClearRasterMemory();

		var oWordControl = oThis;

		oWordControl.m_bIsRePaintOnScroll = false;
		var dPosition                     = 0;
		if (oWordControl.m_dScrollY_max != 0)
		{
			dPosition = oWordControl.m_dScrollY / oWordControl.m_dScrollY_max;
		}
		oWordControl.CheckZoom();
		oWordControl.CalculateDocumentSize();
		var lCurPage = oWordControl.m_oDrawingDocument.SlideCurrent;

		this.GoToPage(lCurPage, true);
		this.ZoomFreePageNum = lCurPage;

		if (-1 != lCurPage)
		{
			this.CreateBackgroundHorRuler();
			oWordControl.m_bIsUpdateHorRuler = true;
			this.CreateBackgroundVerRuler();
			oWordControl.m_bIsUpdateVerRuler = true;
		}
		var lPosition = parseInt(dPosition * oWordControl.m_oScrollVerApi.getMaxScrolledY());
		oWordControl.m_oScrollVerApi.scrollToY(lPosition);

		this.ZoomFreePageNum = -1;

		oWordControl.m_oApi.sync_zoomChangeCallback(this.m_nZoomValue, type);
		oWordControl.m_bIsUpdateTargetNoAttack = true;
		oWordControl.m_bIsRePaintOnScroll      = true;

		oWordControl.OnScroll();

		if (this.MobileTouchManager)
			this.MobileTouchManager.Resize_After();

		if (this.IsSupportNotes && this.m_oNotesApi)
			this.m_oNotesApi.OnResize();
	};

	this.zoom_Out = function()
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var _zooms = oThis.zoom_values;
		var _count = _zooms.length;

		var _Zoom = _zooms[0];
		for (var i = (_count - 1); i >= 0; i--)
		{
			if (this.m_nZoomValue > _zooms[i])
			{
				_Zoom = _zooms[i];
				break;
			}
		}

		if (oThis.m_nZoomValue <= _Zoom)
			return;

		oThis.m_nZoomValue = _Zoom;
		oThis.zoom_Fire(0);
	};

	this.zoom_In = function()
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var _zooms = oThis.zoom_values;
		var _count = _zooms.length;

		var _Zoom = _zooms[_count - 1];
		for (var i = 0; i < _count; i++)
		{
			if (this.m_nZoomValue < _zooms[i])
			{
				_Zoom = _zooms[i];
				break;
			}
		}

		if (oThis.m_nZoomValue >= _Zoom)
			return;

		oThis.m_nZoomValue = _Zoom;
		oThis.zoom_Fire(0);
	};

	this.DisableRulerMarkers = function()
	{
		if (!this.IsEnabledRulerMarkers)
			return;

		this.IsEnabledRulerMarkers                 = false;
		this.m_oHorRuler.RepaintChecker.BlitAttack = true;
		this.m_oHorRuler.IsCanMoveAnyMarkers       = false;
		this.m_oHorRuler.IsDrawAnyMarkers          = false;
		this.m_oHorRuler.m_dMarginLeft             = 0;
		this.m_oHorRuler.m_dMarginRight            = this.m_oLogicDocument.Width;

		this.m_oVerRuler.m_dMarginTop              = 0;
		this.m_oVerRuler.m_dMarginBottom           = this.m_oLogicDocument.Height;
		this.m_oVerRuler.RepaintChecker.BlitAttack = true;

		if (this.m_bIsRuler)
		{
			this.UpdateHorRuler();
			this.UpdateVerRuler();
		}
	};

	this.EnableRulerMarkers = function()
	{
		if (this.IsEnabledRulerMarkers)
			return;

		this.IsEnabledRulerMarkers                 = true;
		this.m_oHorRuler.RepaintChecker.BlitAttack = true;
		this.m_oHorRuler.IsCanMoveAnyMarkers       = true;
		this.m_oHorRuler.IsDrawAnyMarkers          = true;

		if (this.m_bIsRuler)
		{
			this.UpdateHorRuler();
			this.UpdateVerRuler();
		}
	};

	this.ToSearchResult = function()
	{
		var naviG = this.m_oDrawingDocument.CurrentSearchNavi;
		if (naviG.Page == -1)
			return;

		var navi = naviG.Place[0];
		var x    = navi.X;
		var y    = navi.Y;

		var rectSize = (navi.H * this.m_nZoomValue * g_dKoef_mm_to_pix / 100);
		var pos      = this.m_oDrawingDocument.ConvertCoordsToCursor2(x, y, navi.PageNum);

		if (true === pos.Error)
			return;

		var boxX = 0;
		var boxY = 0;

		var w = this.m_oEditor.HtmlElement.width;
		if (this.bIsRetinaSupport)
			w /= AscCommon.AscBrowser.retinaPixelRatio;
		var h = this.m_oEditor.HtmlElement.height;
		if (this.bIsRetinaSupport)
			h /= AscCommon.AscBrowser.retinaPixelRatio;

		var boxR = w - 2;
		var boxB = h - rectSize;

		var nValueScrollHor = 0;
		if (pos.X < boxX)
			nValueScrollHor = this.GetHorizontalScrollTo(x, navi.PageNum);

		if (pos.X > boxR)
		{
			var _mem        = x - g_dKoef_pix_to_mm * w * 100 / this.m_nZoomValue;
			nValueScrollHor = this.GetHorizontalScrollTo(_mem, navi.PageNum);
		}

		var nValueScrollVer = 0;
		if (pos.Y < boxY)
			nValueScrollVer = this.GetVerticalScrollTo(y, navi.PageNum);

		if (pos.Y > boxB)
		{
			var _mem        = y + navi.H + 10 - g_dKoef_pix_to_mm * h * 100 / this.m_nZoomValue;
			nValueScrollVer = this.GetVerticalScrollTo(_mem, navi.PageNum);
		}

		var isNeedScroll = false;
		if (0 != nValueScrollHor)
		{
			isNeedScroll                   = true;
			this.m_bIsUpdateTargetNoAttack = true;
			var temp                       = nValueScrollHor * this.m_dScrollX_max / (this.m_dDocumentWidth - w);
			this.m_oScrollHorApi.scrollToX(parseInt(temp), false);
		}
		if (0 != nValueScrollVer)
		{
			isNeedScroll                   = true;
			this.m_bIsUpdateTargetNoAttack = true;
			var temp                       = nValueScrollVer * this.m_dScrollY_max / (this.m_dDocumentHeight - h);
			this.m_oScrollVerApi.scrollToY(parseInt(temp), false);
		}

		if (true === isNeedScroll)
		{
			this.OnScroll();
			return;
		}

		this.OnUpdateOverlay();
	};

	this.onButtonTabsClick = function()
	{
		var oWordControl = oThis;
		if (oWordControl.m_nTabsType == tab_Left)
		{
			oWordControl.m_nTabsType = tab_Center;
			oWordControl.onButtonTabsDraw();
		}
		else if (oWordControl.m_nTabsType == tab_Center)
		{
			oWordControl.m_nTabsType = tab_Right;
			oWordControl.onButtonTabsDraw();
		}
		else
		{
			oWordControl.m_nTabsType = tab_Left;
			oWordControl
				.onButtonTabsDraw();
		}
	};

	this.onButtonTabsDraw = function()
	{
		var _ctx = this.m_oLeftRuler_buttonsTabs.HtmlElement.getContext('2d');
		if (this.bIsRetinaSupport)
		{
			_ctx.setTransform(AscCommon.AscBrowser.retinaPixelRatio, 0, 0, AscCommon.AscBrowser.retinaPixelRatio, 0, 0);
		}
		else
		{
			_ctx.setTransform(1, 0, 0, 1, 0, 0);
		}

		var _width  = 19;
		var _height = 19;

		_ctx.clearRect(0, 0, 19, 19);

		_ctx.lineWidth   = 1;
		_ctx.strokeStyle = "#BBBEC2";
		_ctx.strokeRect(2.5, 3.5, 14, 14);
		_ctx.beginPath();

		_ctx.strokeStyle = "#3E3E3E";

		_ctx.lineWidth = 2;
		if (this.m_nTabsType == tab_Left)
		{
			_ctx.moveTo(8, 9);
			_ctx.lineTo(8, 14);
			_ctx.lineTo(13, 14);
		}
		else if (this.m_nTabsType == tab_Center)
		{
			_ctx.moveTo(6, 14);
			_ctx.lineTo(14, 14);
			_ctx.moveTo(10, 9);
			_ctx.lineTo(10, 14);
		}
		else
		{
			_ctx.moveTo(12, 9);
			_ctx.lineTo(12, 14);
			_ctx.lineTo(7, 14);
		}

		_ctx.stroke();
		_ctx.beginPath();
	};

	this.onPrevPage = function()
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var oWordControl = oThis;
		if (0 < oWordControl.m_oDrawingDocument.SlideCurrent)
		{
			oWordControl.GoToPage(oWordControl.m_oDrawingDocument.SlideCurrent - 1);
		}
		else
		{
			oWordControl.GoToPage(0);
		}
	};
	this.onNextPage = function()
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var oWordControl = oThis;
		if ((oWordControl.m_oDrawingDocument.SlidesCount - 1) > oWordControl.m_oDrawingDocument.SlideCurrent)
		{
			oWordControl.GoToPage(oWordControl.m_oDrawingDocument.SlideCurrent + 1);
		}
		else if (oWordControl.m_oDrawingDocument.SlidesCount > 0)
		{
			oWordControl.GoToPage(oWordControl.m_oDrawingDocument.SlidesCount - 1);
		}
	};

	this.horRulerMouseDown = function(e)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		if (e.preventDefault)
			e.preventDefault();
		else
			e.returnValue = false;

		var oWordControl = oThis;

		if (-1 != oWordControl.m_oDrawingDocument.SlideCurrent)
			oWordControl.m_oHorRuler.OnMouseDown(oWordControl.m_oDrawingDocument.SlideCurrectRect.left, 0, e);
	};
	this.horRulerMouseUp   = function(e)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		if (e.preventDefault)
			e.preventDefault();
		else
			e.returnValue = false;

		var oWordControl = oThis;

		if (-1 != oWordControl.m_oDrawingDocument.SlideCurrent)
			oWordControl.m_oHorRuler.OnMouseUp(oWordControl.m_oDrawingDocument.SlideCurrectRect.left, 0, e);
	};
	this.horRulerMouseMove = function(e)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		if (e.preventDefault)
			e.preventDefault();
		else
			e.returnValue = false;

		var oWordControl = oThis;

		if (-1 != oWordControl.m_oDrawingDocument.SlideCurrent)
			oWordControl.m_oHorRuler.OnMouseMove(oWordControl.m_oDrawingDocument.SlideCurrectRect.left, 0, e);
	};

	this.verRulerMouseDown = function(e)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		if (e.preventDefault)
			e.preventDefault();
		else
			e.returnValue = false;

		var oWordControl = oThis;

		if (-1 != oWordControl.m_oDrawingDocument.SlideCurrent)
			oWordControl.m_oVerRuler.OnMouseDown(0, oWordControl.m_oDrawingDocument.SlideCurrectRect.top, e);
	};
	this.verRulerMouseUp   = function(e)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		if (e.preventDefault)
			e.preventDefault();
		else
			e.returnValue = false;

		var oWordControl = oThis;

		if (-1 != oWordControl.m_oDrawingDocument.SlideCurrent)
			oWordControl.m_oVerRuler.OnMouseUp(0, oWordControl.m_oDrawingDocument.SlideCurrectRect.top, e);
	};
	this.verRulerMouseMove = function(e)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		if (e.preventDefault)
			e.preventDefault();
		else
			e.returnValue = false;

		var oWordControl = oThis;

		if (-1 != oWordControl.m_oDrawingDocument.SlideCurrent)
			oWordControl.m_oVerRuler.OnMouseMove(0, oWordControl.m_oDrawingDocument.SlideCurrectRect.top, e);
	};

	this.SelectWheel = function()
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var oWordControl = oThis;
		var positionMinY = oWordControl.m_oMainContent.AbsolutePosition.T * g_dKoef_mm_to_pix + oWordControl.Y;
		if (oWordControl.m_bIsRuler)
			positionMinY = (oWordControl.m_oMainContent.AbsolutePosition.T + oWordControl.m_oTopRuler_horRuler.AbsolutePosition.B) * g_dKoef_mm_to_pix +
				oWordControl.Y;

		var positionMaxY = oWordControl.m_oMainContent.AbsolutePosition.B * g_dKoef_mm_to_pix + oWordControl.Y;

		var scrollYVal = 0;
		if (global_mouseEvent.Y < positionMinY)
		{
			var delta = 30;
			if (20 > (positionMinY - global_mouseEvent.Y))
				delta = 10;

			scrollYVal = -delta;
		}
		else if (global_mouseEvent.Y > positionMaxY)
		{
			var delta = 30;
			if (20 > (global_mouseEvent.Y - positionMaxY))
				delta = 10;

			scrollYVal = delta;
		}

		var scrollXVal = 0;
		if (oWordControl.m_bIsHorScrollVisible)
		{
			var positionMinX = oWordControl.m_oMainParent.AbsolutePosition.L * g_dKoef_mm_to_pix + oWordControl.X;
			if (oWordControl.m_bIsRuler)
				positionMinX += oWordControl.m_oLeftRuler.AbsolutePosition.R * g_dKoef_mm_to_pix;

			var positionMaxX = oWordControl.m_oMainParent.AbsolutePosition.R * g_dKoef_mm_to_pix + oWordControl.X - oWordControl.ScrollWidthPx;

			if (global_mouseEvent.X < positionMinX)
			{
				var delta = 30;
				if (20 > (positionMinX - global_mouseEvent.X))
					delta = 10;

				scrollXVal = -delta;
			}
			else if (global_mouseEvent.X > positionMaxX)
			{
				var delta = 30;
				if (20 > (global_mouseEvent.X - positionMaxX))
					delta = 10;

				scrollXVal = delta;
			}
		}

		if (0 != scrollYVal)
		{
			if (((oWordControl.m_dScrollY + scrollYVal) >= oWordControl.SlideScrollMIN) && ((oWordControl.m_dScrollY + scrollYVal) <= oWordControl.SlideScrollMAX))
				oWordControl.m_oScrollVerApi.scrollByY(scrollYVal, false);
		}
		if (0 != scrollXVal)
			oWordControl.m_oScrollHorApi.scrollByX(scrollXVal, false);

		if (scrollXVal != 0 || scrollYVal != 0)
			oWordControl.onMouseMove2();
	};

	this.createSplitterDiv = function(bIsVert)
	{
		var Splitter            = document.createElement("div");
		Splitter.id             = "splitter_id";
		Splitter.style.position = "absolute";

		// skin
		//Splitter.style.backgroundColor = "#000000";
		//Splitter.style.backgroundImage = "url(Images/splitter.png)";
		Splitter.style.backgroundImage = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjMxN4N3hgAAAB9JREFUGFdj+P//PwsDAwOQ+m8PooEYwQELwmRwqgAAbXwhnmjs9sgAAAAASUVORK5CYII=)";

		if (bIsVert)
		{
			Splitter.style.left   = parseInt(this.Splitter1Pos * g_dKoef_mm_to_pix) + "px";
			Splitter.style.top    = "0px";
			Splitter.style.width  = parseInt(GlobalSkin.SplitterWidthMM * g_dKoef_mm_to_pix) + "px";
			Splitter.style.height = this.Height + "px";
			this.SplitterType     = 1;

			Splitter.style.backgroundRepeat = "repeat-y";
		}
		else
		{
			Splitter.style.left   = parseInt((this.Splitter1Pos + GlobalSkin.SplitterWidthMM) * g_dKoef_mm_to_pix) + "px";
			Splitter.style.top    = (this.Height - parseInt((this.Splitter2Pos + GlobalSkin.SplitterWidthMM) * g_dKoef_mm_to_pix) + 1) + "px";
			Splitter.style.width  = this.Width - parseInt((this.Splitter1Pos + GlobalSkin.SplitterWidthMM) * g_dKoef_mm_to_pix) + "px";
			Splitter.style.height = parseInt(GlobalSkin.SplitterWidthMM * g_dKoef_mm_to_pix) + "px";
			this.SplitterType     = 2;

			Splitter.style.backgroundRepeat = "repeat-x";
		}

		Splitter.style.overflow = 'hidden';
		Splitter.style.zIndex   = 1000;
		Splitter.setAttribute("contentEditable", false);

		this.SplitterDiv = Splitter;
		this.m_oBody.HtmlElement.appendChild(this.SplitterDiv);
	};

	this.onBodyMouseDown = function(e)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		if (AscCommon.g_inputContext && AscCommon.g_inputContext.externalChangeFocus())
			return;

		if (oThis.SplitterType != 0)
			return;

		var _isCatch = false;

		var downClick = global_mouseEvent.ClickCount;
		AscCommon.check_MouseDownEvent(e, true);
		global_mouseEvent.ClickCount = downClick;
		global_mouseEvent.LockMouse();

		var oWordControl = oThis;

		var x1 = oWordControl.Splitter1Pos * g_dKoef_mm_to_pix;
		var x2 = (oWordControl.Splitter1Pos + GlobalSkin.SplitterWidthMM) * g_dKoef_mm_to_pix;
		var y1 = oWordControl.Height - ((oWordControl.Splitter2Pos + GlobalSkin.SplitterWidthMM) * g_dKoef_mm_to_pix);
		var y2 = oWordControl.Height - (oWordControl.Splitter2Pos * g_dKoef_mm_to_pix);

		var _x = global_mouseEvent.X - oWordControl.X;
		var _y = global_mouseEvent.Y - oWordControl.Y;

		if (_x >= x1 && _x <= x2 && _y >= 0 && _y <= oWordControl.Height && (oThis.IsUseNullThumbnailsSplitter || (oThis.Splitter1Pos != 0)))
		{
			oWordControl.m_oBody.HtmlElement.style.cursor = "w-resize";
			oWordControl.createSplitterDiv(true);
			_isCatch = true;
		}
		else if (_x >= x2 && _x <= oWordControl.Width && _y >= y1 && _y <= y2)
		{
			oWordControl.m_oBody.HtmlElement.style.cursor = "s-resize";
			oWordControl.createSplitterDiv(false);
			_isCatch = true;
		}
		else
		{
			oWordControl.m_oBody.HtmlElement.style.cursor = "default";
		}

		if (_isCatch)
		{
			if (oWordControl.m_oMainParent && oWordControl.m_oMainParent.HtmlElement)
				oWordControl.m_oMainParent.HtmlElement.style.pointerEvents = "none";
			if (oWordControl.m_oThumbnailsContainer && oWordControl.m_oThumbnailsContainer.HtmlElement)
				oWordControl.m_oThumbnailsContainer.HtmlElement.style.pointerEvents = "none";
			AscCommon.stopEvent(e);
		}
	};

	this.onBodyMouseMove = function(e)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var _isCatch = false;

		AscCommon.check_MouseMoveEvent(e, true);

		var oWordControl = oThis;

		if (null == oWordControl.SplitterDiv)
		{
			var x1 = oWordControl.Splitter1Pos * g_dKoef_mm_to_pix;
			var x2 = (oWordControl.Splitter1Pos + GlobalSkin.SplitterWidthMM) * g_dKoef_mm_to_pix;
			var y1 = oWordControl.Height - ((oWordControl.Splitter2Pos + GlobalSkin.SplitterWidthMM) * g_dKoef_mm_to_pix);
			var y2 = oWordControl.Height - (oWordControl.Splitter2Pos * g_dKoef_mm_to_pix);

			var _x = global_mouseEvent.X - oWordControl.X;
			var _y = global_mouseEvent.Y - oWordControl.Y;

			if (_x >= x1 && _x <= x2 && _y >= 0 && _y <= oWordControl.Height)
			{
				oWordControl.m_oBody.HtmlElement.style.cursor = "w-resize";
			}
			else if (_x >= x2 && _x <= oWordControl.Width && _y >= y1 && _y <= y2)
			{
				oWordControl.m_oBody.HtmlElement.style.cursor = "s-resize";
			}
			else
			{
				oWordControl.m_oBody.HtmlElement.style.cursor = "default";
			}
		}
		else
		{
			var _x = global_mouseEvent.X - oWordControl.X;
			var _y = global_mouseEvent.Y - oWordControl.Y;

			if (1 == oWordControl.SplitterType)
			{
				var isCanUnShowThumbnails = true;
				if (oWordControl.m_oApi.isReporterMode)
					isCanUnShowThumbnails = false;

				var _min = parseInt(oWordControl.Splitter1PosMin * g_dKoef_mm_to_pix);
				var _max = parseInt(oWordControl.Splitter1PosMax * g_dKoef_mm_to_pix);
				if (_x > _max)
					_x = _max;
				else if ((_x < (_min / 2)) && isCanUnShowThumbnails)
					_x = 0;
				else if (_x < _min)
					_x = _min;

				oWordControl.m_oBody.HtmlElement.style.cursor = "w-resize";
				oWordControl.SplitterDiv.style.left           = _x + "px";
			}
			else
			{
				var _max = oWordControl.Height - parseInt(oWordControl.Splitter2PosMin * g_dKoef_mm_to_pix);
				var _min = oWordControl.Height - parseInt(oWordControl.Splitter2PosMax * g_dKoef_mm_to_pix);

				if (_min < (30 * g_dKoef_mm_to_pix))
					_min = 30 * g_dKoef_mm_to_pix;

				var _c = parseInt(oWordControl.Splitter2PosMin * g_dKoef_mm_to_pix);
				if (_y > (_max + (_c / 2)))
					_y = oWordControl.Height;
				else if (_y > _max)
					_y = _max;
				else if (_y < _min)
					_y = _min;

				oWordControl.m_oBody.HtmlElement.style.cursor = "s-resize";
				oWordControl.SplitterDiv.style.top            = (_y - parseInt(GlobalSkin.SplitterWidthMM * g_dKoef_mm_to_pix)) + "px";
			}

			_isCatch = true;
		}

		if (_isCatch)
			AscCommon.stopEvent(e);
	};

	this.OnResizeSplitter = function(isNoNeedResize)
	{
		this.OldSplitter1Pos = this.Splitter1Pos;

		this.m_oThumbnailsContainer.Bounds.R    = this.Splitter1Pos;
		this.m_oThumbnailsContainer.Bounds.AbsW = this.Splitter1Pos;
		this.m_oThumbnailsSplit.Bounds.L 		= this.Splitter1Pos;

		if (!this.IsSupportNotes)
			this.Splitter2Pos = 0;
		else if (this.Splitter2Pos < 1)
			this.Splitter2Pos = 1;


		if (this.IsUseNullThumbnailsSplitter || (0 != this.Splitter1Pos))
		{
			this.m_oMainParent.Bounds.L = this.Splitter1Pos + GlobalSkin.SplitterWidthMM;
			this.m_oMainContent.Bounds.B = GlobalSkin.SupportNotes ? this.Splitter2Pos + GlobalSkin.SplitterWidthMM : 1000;
			this.m_oMainContent.Bounds.isAbsB = GlobalSkin.SupportNotes;

			this.m_oNotesContainer.Bounds.AbsH = this.Splitter2Pos;

			this.m_oThumbnailsContainer.HtmlElement.style.display = "block";
			this.m_oThumbnailsSplit.HtmlElement.style.display = "block";
			this.m_oMainParent.HtmlElement.style.borderLeft = ("1px solid " + GlobalSkin.BorderSplitterColor);
		}
		else
		{
			this.m_oMainParent.Bounds.L = 0;
			this.m_oMainContent.Bounds.B = GlobalSkin.SupportNotes ? this.Splitter2Pos + GlobalSkin.SplitterWidthMM : 1000;
			this.m_oMainContent.Bounds.isAbsB = GlobalSkin.SupportNotes;

			this.m_oNotesContainer.Bounds.AbsH = this.Splitter2Pos;

			this.m_oThumbnailsContainer.HtmlElement.style.display = "none";
			this.m_oThumbnailsSplit.HtmlElement.style.display = "none";
			this.m_oMainParent.HtmlElement.style.borderLeft = "none";
		}

		if (this.IsSupportNotes)
		{
			if (this.m_oNotesContainer.Bounds.AbsH < 1)
				this.m_oNotesContainer.Bounds.AbsH = 1;
		}

		if (this.Splitter2Pos <= 1)
		{
			this.m_oNotes.HtmlElement.style.display = "none";
			this.m_oNotes_scroll.HtmlElement.style.display = "none";
		}
		else
		{
			this.m_oNotes.HtmlElement.style.display = "block";
			this.m_oNotes_scroll.HtmlElement.style.display = "block";
		}

		if (true !== isNoNeedResize)
			this.OnResize2(true);
	};

	this.onBodyMouseUp = function(e)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var _isCatch = false;

		AscCommon.check_MouseUpEvent(e, true);

		var oWordControl = oThis;
		oWordControl.m_oDrawingDocument.UnlockCursorType();

		if (oWordControl.m_oMainParent && oWordControl.m_oMainParent.HtmlElement)
			oWordControl.m_oMainParent.HtmlElement.style.pointerEvents = "";
		if (oWordControl.m_oThumbnailsContainer && oWordControl.m_oThumbnailsContainer.HtmlElement)
			oWordControl.m_oThumbnailsContainer.HtmlElement.style.pointerEvents = "";

		if (null != oWordControl.SplitterDiv)
		{
			var _x = parseInt(oWordControl.SplitterDiv.style.left);
			var _y = parseInt(oWordControl.SplitterDiv.style.top);

			if (oWordControl.SplitterType == 1)
			{
				var _posX = _x * g_dKoef_pix_to_mm;
				if (Math.abs(oWordControl.Splitter1Pos - _posX) > 1)
				{
					oWordControl.Splitter1Pos = _posX;
                    oWordControl.Splitter1PosSetUp = oWordControl.Splitter1Pos;
					oWordControl.OnResizeSplitter();
					oWordControl.m_oApi.syncOnThumbnailsShow();
				}
			}
			else
			{
				var _posY = (oWordControl.Height - _y) * g_dKoef_pix_to_mm - GlobalSkin.SplitterWidthMM;
				if (Math.abs(oWordControl.Splitter2Pos - _posY) > 1)
				{
					oWordControl.Splitter2Pos = _posY;
					oWordControl.OnResizeSplitter();
				}
			}

			oWordControl.m_oBody.HtmlElement.removeChild(oWordControl.SplitterDiv);
			oWordControl.SplitterDiv  = null;
			oWordControl.SplitterType = 0;

			_isCatch = true;
		}

		if (_isCatch)
			AscCommon.stopEvent(e);
	};

	this.onMouseDownTarget = function(e)
	{
		if (oThis.m_oDrawingDocument.TargetHtmlElementOnSlide)
			return oThis.onMouseDown(e);
		else
			return oThis.m_oNotesApi.onMouseDown(e);
	};
	this.onMouseMoveTarget = function(e)
	{
		if (oThis.m_oDrawingDocument.TargetHtmlElementOnSlide)
			return oThis.onMouseMove(e);
		else
			return oThis.m_oNotesApi.onMouseMove(e);
	};
	this.onMouseUpTarget = function(e)
	{
		if (oThis.m_oDrawingDocument.TargetHtmlElementOnSlide)
			return oThis.onMouseUp(e);
		else
			return oThis.m_oNotesApi.onMouseUp(e);
	};

	this.onMouseDown = function(e)
	{
		oThis.m_oApi.checkLastWork();

		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var oWordControl = oThis;

		if (oWordControl.m_oDrawingDocument.TransitionSlide.IsPlaying())
			oWordControl.m_oDrawingDocument.TransitionSlide.End(true);

		if (!oThis.m_bIsIE)
		{
			if (e.preventDefault)
				e.preventDefault();
			else
				e.returnValue = false;
		}

		if (AscCommon.g_inputContext && AscCommon.g_inputContext.externalChangeFocus())
			return;

		oWordControl.Thumbnails.SetFocusElement(FOCUS_OBJECT_MAIN);
		if (oWordControl.DemonstrationManager.Mode)
			return false;

		var _xOffset = oWordControl.X;
		var _yOffset = oWordControl.Y;

		if (true === oWordControl.m_bIsRuler)
		{
			_xOffset += (5 * g_dKoef_mm_to_pix);
			_yOffset += (7 * g_dKoef_mm_to_pix);
		}

		if (window['closeDialogs'] != undefined)
			window['closeDialogs']();

		AscCommon.check_MouseDownEvent(e, true);
		global_mouseEvent.LockMouse();

		if ((0 == global_mouseEvent.Button) || (undefined == global_mouseEvent.Button))
		{
			global_mouseEvent.Button    = 0;
			oWordControl.m_bIsMouseLock = true;

			if (oWordControl.m_oDrawingDocument.IsEmptyPresentation && oWordControl.m_oLogicDocument.CanEdit())
			{
				oWordControl.m_oLogicDocument.addNextSlide();
				return;
			}
		}

		if ((0 == global_mouseEvent.Button) || (undefined == global_mouseEvent.Button) || (2 == global_mouseEvent.Button))
		{
			var pos = oWordControl.m_oDrawingDocument.ConvertCoordsFromCursor2(global_mouseEvent.X, global_mouseEvent.Y);
			if (pos.Page == -1)
				return;

			var ret = oWordControl.m_oDrawingDocument.checkMouseDown_Drawing(pos);
			if (ret === true)
			{
				if (-1 == oWordControl.m_oTimerScrollSelect)
					oWordControl.m_oTimerScrollSelect = setInterval(oWordControl.SelectWheel, 20);

				AscCommon.stopEvent(e);
				return;
			}

			oWordControl.StartUpdateOverlay();
			oWordControl.m_oDrawingDocument.m_lCurrentPage = pos.Page;
			oWordControl.m_oLogicDocument.OnMouseDown(global_mouseEvent, pos.X, pos.Y, pos.Page);
			oWordControl.EndUpdateOverlay();
		}
		else
		{
			var pos = oWordControl.m_oDrawingDocument.ConvertCoordsFromCursor2(global_mouseEvent.X, global_mouseEvent.Y);
			if (pos.Page == -1)
				return;

			oWordControl.m_oDrawingDocument.m_lCurrentPage = pos.Page;
		}

		if (-1 == oWordControl.m_oTimerScrollSelect)
		{
			oWordControl.m_oTimerScrollSelect = setInterval(oWordControl.SelectWheel, 20);
		}

		oWordControl.Thumbnails.SetFocusElement(FOCUS_OBJECT_MAIN);
	};

	this.onMouseMove  = function(e)
	{
		oThis.m_oApi.checkLastWork();

		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var oWordControl = oThis;

		if (e.preventDefault)
			e.preventDefault();
		else
			e.returnValue = false;

		if (oWordControl.DemonstrationManager.Mode)
			return false;

		if (oWordControl.m_oDrawingDocument.IsEmptyPresentation)
			return;

		AscCommon.check_MouseMoveEvent(e);
		var pos = oWordControl.m_oDrawingDocument.ConvertCoordsFromCursor2(global_mouseEvent.X, global_mouseEvent.Y);
		if (pos.Page == -1)
			return;

		if (oWordControl.m_oDrawingDocument.m_sLockedCursorType != "")
			oWordControl.m_oDrawingDocument.SetCursorType("default");

		if (oWordControl.m_oDrawingDocument.InlineTextTrackEnabled)
		{
			var pos2 = oWordControl.m_oDrawingDocument.ConvertCoordsToCursorWR(pos.X, pos.Y, pos.Page, undefined, true);
			if (pos2.Y > oWordControl.m_oNotesContainer.AbsolutePosition.T * g_dKoef_mm_to_pix)
				return;
		}

		oWordControl.StartUpdateOverlay();

		var is_drawing = oWordControl.m_oDrawingDocument.checkMouseMove_Drawing(pos);
		if (is_drawing === true)
			return;

		oWordControl.m_oLogicDocument.OnMouseMove(global_mouseEvent, pos.X, pos.Y, pos.Page);
		oWordControl.EndUpdateOverlay();
	};
	this.onMouseMove2 = function()
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var oWordControl = oThis;
		var pos          = oWordControl.m_oDrawingDocument.ConvertCoordsFromCursor2(global_mouseEvent.X, global_mouseEvent.Y);
		if (pos.Page == -1)
			return;

		if (oWordControl.m_oDrawingDocument.IsEmptyPresentation)
			return;

		oWordControl.StartUpdateOverlay();

		var is_drawing = oWordControl.m_oDrawingDocument.checkMouseMove_Drawing(pos);
		if (is_drawing === true)
			return;

		oWordControl.m_oLogicDocument.OnMouseMove(global_mouseEvent, pos.X, pos.Y, pos.Page);
		oWordControl.EndUpdateOverlay();
	};
	this.onMouseUp    = function(e, bIsWindow)
	{
		oThis.m_oApi.checkLastWork();

		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var oWordControl = oThis;
		if (!global_mouseEvent.IsLocked)
			return;

		if (oWordControl.DemonstrationManager.Mode)
		{
			if (e.preventDefault)
				e.preventDefault();
			else
				e.returnValue = false;
			return false;
		}

		AscCommon.check_MouseUpEvent(e);

		if (oWordControl.m_oDrawingDocument.IsEmptyPresentation)
			return;

		var pos = oWordControl.m_oDrawingDocument.ConvertCoordsFromCursor2(global_mouseEvent.X, global_mouseEvent.Y);
		if (pos.Page == -1)
			return;

		oWordControl.m_oDrawingDocument.UnlockCursorType();
		oWordControl.m_bIsMouseLock = false;
		if (oWordControl.m_oDrawingDocument.TableOutlineDr.bIsTracked)
		{
			oWordControl.m_oDrawingDocument.TableOutlineDr.checkMouseUp(global_mouseEvent.X, global_mouseEvent.Y, oWordControl);
			oWordControl.m_oLogicDocument.Document_UpdateInterfaceState();
			oWordControl.m_oLogicDocument.Document_UpdateRulersState();

			if (-1 != oWordControl.m_oTimerScrollSelect)
			{
				clearInterval(oWordControl.m_oTimerScrollSelect);
				oWordControl.m_oTimerScrollSelect = -1;
			}
			oWordControl.OnUpdateOverlay();
			return;
		}

		if (-1 != oWordControl.m_oTimerScrollSelect)
		{
			clearInterval(oWordControl.m_oTimerScrollSelect);
			oWordControl.m_oTimerScrollSelect = -1;
		}

		oWordControl.m_bIsMouseUpSend = true;

		if (oWordControl.m_oDrawingDocument.InlineTextTrackEnabled)
		{
			var pos2 = oWordControl.m_oDrawingDocument.ConvertCoordsToCursorWR(pos.X, pos.Y, pos.Page, undefined, true);
			if (pos2.Y > oWordControl.m_oNotesContainer.AbsolutePosition.T * g_dKoef_mm_to_pix)
				return;
		}

		oWordControl.StartUpdateOverlay();

		var is_drawing = oWordControl.m_oDrawingDocument.checkMouseUp_Drawing(pos);
		if (is_drawing === true)
			return;

		oWordControl.m_oLogicDocument.OnMouseUp(global_mouseEvent, pos.X, pos.Y, pos.Page);

		oWordControl.m_bIsMouseUpSend = false;
		//        oWordControl.m_oLogicDocument.Document_UpdateInterfaceState();
		oWordControl.m_oLogicDocument.Document_UpdateRulersState();

		oWordControl.EndUpdateOverlay();
	};

	this.onMouseUpMainSimple = function()
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var oWordControl = oThis;

		global_mouseEvent.Type = AscCommon.g_mouse_event_type_up;

		AscCommon.MouseUpLock.MouseUpLockedSend = true;

		global_mouseEvent.Sender = null;

		global_mouseEvent.UnLockMouse();

		global_mouseEvent.IsPressed = false;

		if (-1 != oWordControl.m_oTimerScrollSelect)
		{
			clearInterval(oWordControl.m_oTimerScrollSelect);
			oWordControl.m_oTimerScrollSelect = -1;
		}
	};

	this.setNodesEnable = function(bEnabled)
	{
		if (bEnabled == this.IsSupportNotes)
			return;

		GlobalSkin.SupportNotes = bEnabled;
		this.IsSupportNotes = bEnabled;
		this.Splitter2Pos = 0;

		this.OnResizeSplitter();
	};

	this.onMouseUpExternal = function(x, y)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var oWordControl = oThis;

		if (oWordControl.DemonstrationManager.Mode)
			return oWordControl.DemonstrationManager.onMouseUp({ pageX:0, pageY:0 });

		//---
		global_mouseEvent.X = x;
		global_mouseEvent.Y = y;

		global_mouseEvent.Type = AscCommon.g_mouse_event_type_up;

		AscCommon.MouseUpLock.MouseUpLockedSend = true;
		global_mouseEvent.Sender                = null;

		global_mouseEvent.UnLockMouse();

		global_mouseEvent.IsPressed = false;

		if (oWordControl.m_oDrawingDocument.IsEmptyPresentation)
			return;

		//---
		var pos = oWordControl.m_oDrawingDocument.ConvertCoordsFromCursor2(global_mouseEvent.X, global_mouseEvent.Y);
		if (pos.Page == -1)
			return;

		oWordControl.m_oDrawingDocument.UnlockCursorType();

		oWordControl.m_bIsMouseLock = false;

		if (-1 != oWordControl.m_oTimerScrollSelect)
		{
			clearInterval(oWordControl.m_oTimerScrollSelect);
			oWordControl.m_oTimerScrollSelect = -1;
		}

		oWordControl.StartUpdateOverlay();

		oWordControl.m_bIsMouseUpSend = true;

		oWordControl.m_oLogicDocument.OnMouseUp(global_mouseEvent, pos.X, pos.Y, pos.Page);
		oWordControl.m_bIsMouseUpSend = false;
		oWordControl.m_oLogicDocument.Document_UpdateInterfaceState();
		oWordControl.m_oLogicDocument.Document_UpdateRulersState();

		oWordControl.EndUpdateOverlay();
	};

	this.onMouseWhell = function(e)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		if (undefined !== window["AscDesktopEditor"])
		{
			if (false === window["AscDesktopEditor"]["CheckNeedWheel"]())
				return;
		}

		if (global_mouseEvent.IsLocked)
			return;

		if (oThis.DemonstrationManager.Mode)
		{
			if (e.preventDefault)
				e.preventDefault();
			else
				e.returnValue = false;
			return false;
		}

		var _ctrl = false;
		if (e.metaKey !== undefined)
			_ctrl = e.ctrlKey || e.metaKey;
		else
			_ctrl = e.ctrlKey;

		if (true === _ctrl)
		{
			if (e.preventDefault)
				e.preventDefault();
			else
				e.returnValue = false;

			return false;
		}

		var delta  = 0;
		var deltaX = 0;
		var deltaY = 0;

		if (undefined != e.wheelDelta && e.wheelDelta != 0)
		{
			//delta = (e.wheelDelta > 0) ? -45 : 45;
			delta = -45 * e.wheelDelta / 120;
		}
		else if (undefined != e.detail && e.detail != 0)
		{
			//delta = (e.detail > 0) ? 45 : -45;
			delta = 45 * e.detail / 3;
		}

		// New school multidimensional scroll (touchpads) deltas
		deltaY = delta;

		if (oThis.m_bIsHorScrollVisible)
		{
			if (e.axis !== undefined && e.axis === e.HORIZONTAL_AXIS)
			{
				deltaY = 0;
				deltaX = delta;
			}

			// Webkit
			if (undefined !== e.wheelDeltaY && 0 !== e.wheelDeltaY)
			{
				//deltaY = (e.wheelDeltaY > 0) ? -45 : 45;
				deltaY = -45 * e.wheelDeltaY / 120;
			}
			if (undefined !== e.wheelDeltaX && 0 !== e.wheelDeltaX)
			{
				//deltaX = (e.wheelDeltaX > 0) ? -45 : 45;
				deltaX = -45 * e.wheelDeltaX / 120;
			}
		}

		deltaX >>= 0;
		deltaY >>= 0;

        oThis.m_nVerticalSlideChangeOnScrollEnabled = true;

		if (0 != deltaX)
			oThis.m_oScrollHorApi.scrollBy(deltaX, 0, false);
		else if (0 != deltaY)
			oThis.m_oScrollVerApi.scrollBy(0, deltaY, false);

        oThis.m_nVerticalSlideChangeOnScrollEnabled = false;

		if (e.preventDefault)
			e.preventDefault();
		else
			e.returnValue = false;
		return false;
	};

	this.onKeyUp = function(e)
	{
		global_keyboardEvent.AltKey   = false;
		global_keyboardEvent.CtrlKey  = false;
		global_keyboardEvent.ShiftKey = false;
		global_keyboardEvent.AltGr    = false;

		if (oThis.m_oApi.isReporterMode)
		{
			AscCommon.stopEvent(e);
			return false;
		}
	};

	this.onKeyDown = function(e)
	{
		oThis.m_oApi.checkLastWork();

		if (oThis.m_oApi.isLongAction())
		{
			e.preventDefault();
			return;
		}

		var oWordControl = oThis;
		if (false === oWordControl.m_oApi.bInit_word_control)
		{
			AscCommon.check_KeyboardEvent2(e);
			e.preventDefault();
			return;
		}

		if (oWordControl.IsFocus === false)
			return;

		if (oWordControl.m_oApi.isLongAction() || oWordControl.m_bIsMouseLock === true)
		{
			AscCommon.check_KeyboardEvent2(e);
			e.preventDefault();
			return;
		}

		if (oThis.DemonstrationManager.Mode)
		{
			oWordControl.DemonstrationManager.onKeyDown(e);
			return;
		}

		if (oWordControl.Thumbnails.FocusObjType == FOCUS_OBJECT_THUMBNAILS)
		{
			if (0 == oWordControl.Splitter1Pos)
			{
				// табнейлы не видны. Чего же тогда обрабатывать им клавиатуру
				e.preventDefault();
				return false;
			}

			var ret = oWordControl.Thumbnails.onKeyDown(e);
			if (false === ret)
				return false;
			if (undefined === ret)
				return;
		}

		if (oWordControl.m_oDrawingDocument.TransitionSlide.IsPlaying())
			oWordControl.m_oDrawingDocument.TransitionSlide.End(true);

		var oWordControl = oThis;
		if (false === oWordControl.m_oApi.bInit_word_control || oWordControl.IsFocus === false || oWordControl.m_oApi.isLongAction() || oWordControl.m_bIsMouseLock === true)
			return;

		AscCommon.check_KeyboardEvent(e);

		oWordControl.StartUpdateOverlay();

		oWordControl.IsKeyDownButNoPress = true;

		var _ret_mouseDown          = oWordControl.m_oLogicDocument.OnKeyDown(global_keyboardEvent);
		oWordControl.bIsUseKeyPress = ((_ret_mouseDown & keydownresult_PreventKeyPress) != 0) ? false : true;

		if ((_ret_mouseDown & keydownresult_PreventDefault) != 0)
		{
			// убираем превент с альтом. Уж больно итальянцы недовольны.
			e.preventDefault();
		}

		oWordControl.EndUpdateOverlay();
	};

	this.onKeyDownNoActiveControl = function(e)
	{
		var bSendToEditor = false;

		if (e.CtrlKey && !e.ShiftKey)
		{
			switch (e.KeyCode)
			{
				case 80: // P
				case 83: // S
					bSendToEditor = true;
					break;
				default:
					break;
			}
		}

		return bSendToEditor;
	};

	this.onKeyDownTBIM = function(e)
	{
		var oWordControl = oThis;
		if (false === oWordControl.m_oApi.bInit_word_control || oWordControl.IsFocus === false || oWordControl.m_oApi.isLongAction() || oWordControl.m_bIsMouseLock === true)
			return;

		AscCommon.check_KeyboardEvent(e);

		oWordControl.IsKeyDownButNoPress = true;

		oWordControl.StartUpdateOverlay();

		var _ret_mouseDown          = oWordControl.m_oLogicDocument.OnKeyDown(global_keyboardEvent);
		oWordControl.bIsUseKeyPress = ((_ret_mouseDown & keydownresult_PreventKeyPress) != 0) ? false : true;

		oWordControl.EndUpdateOverlay();

		if ((_ret_mouseDown & keydownresult_PreventDefault) != 0)
		{
			// убираем превент с альтом. Уж больно итальянцы недовольны.
			e.preventDefault();
			return false;
		}
	};

	this.onKeyPress = function(e)
	{
		if (window.GlobalPasteFlag || window.GlobalCopyFlag)
			return;

		if (oThis.Thumbnails.FocusObjType == FOCUS_OBJECT_THUMBNAILS)
		{
			return;
		}

		var oWordControl = oThis;
		if (false === oWordControl.m_oApi.bInit_word_control || oWordControl.IsFocus === false || oWordControl.m_oApi.isLongAction() || oWordControl.m_bIsMouseLock === true)
			return;

		if (window.opera && !oWordControl.IsKeyDownButNoPress)
		{
			oWordControl.onKeyDown(e);
		}

		oWordControl.IsKeyDownButNoPress = false;

		if (oThis.DemonstrationManager.Mode)
			return;

		if (false === oWordControl.bIsUseKeyPress)
			return;

		if (null == oWordControl.m_oLogicDocument)
			return;

		AscCommon.check_KeyboardEvent(e);

		oWordControl.StartUpdateOverlay();

		var retValue = oWordControl.m_oLogicDocument.OnKeyPress(global_keyboardEvent);
		if (true === retValue)
		{
			e.preventDefault();
		}

		oWordControl.EndUpdateOverlay();
	};

	// -------------------------------------------------------- //
	// -----------------end demonstration---------------------- //
	// -------------------------------------------------------- //

	this.verticalScrollCheckChangeSlide = function()
	{
		if (0 == this.m_nVerticalSlideChangeOnScrollInterval || !this.m_nVerticalSlideChangeOnScrollEnabled)
		{
            this.m_oScrollVer_.disableCurrentScroll = false;
            return true;
        }

        // защита от внутренних скроллах. мы превентим ТОЛЬКО самый верхний из onMouseWheel
        this.m_nVerticalSlideChangeOnScrollEnabled = false;

		var newTime = new Date().getTime();
		if (-1 == this.m_nVerticalSlideChangeOnScrollLast)
		{
			this.m_nVerticalSlideChangeOnScrollLast = newTime;
            this.m_oScrollVer_.disableCurrentScroll = false;
			return true;
		}

		var checkTime = this.m_nVerticalSlideChangeOnScrollLast + this.m_nVerticalSlideChangeOnScrollInterval;
		if (newTime < this.m_nVerticalSlideChangeOnScrollLast || newTime > checkTime)
		{
            this.m_nVerticalSlideChangeOnScrollLast = newTime;
            this.m_oScrollVer_.disableCurrentScroll = false;
			return true;
		}

		this.m_oScrollVer_.disableCurrentScroll = true;
		return false;
	};

	this.verticalScroll                = function(sender, scrollPositionY, maxY, isAtTop, isAtBottom)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		if (0 != this.MainScrollsEnabledFlag)
			return;

		if (oThis.m_oApi.isReporterMode)
			return;

		if (!this.m_oDrawingDocument.IsEmptyPresentation)
		{
			if (this.StartVerticalScroll)
			{
				this.VerticalScrollOnMouseUp.ScrollY     = scrollPositionY;
				this.VerticalScrollOnMouseUp.ScrollY_max = maxY;

				this.VerticalScrollOnMouseUp.SlideNum = (scrollPositionY * this.m_oDrawingDocument.SlidesCount / Math.max(1, maxY)) >> 0;
				if (this.VerticalScrollOnMouseUp.SlideNum >= this.m_oDrawingDocument.SlidesCount)
					this.VerticalScrollOnMouseUp.SlideNum = this.m_oDrawingDocument.SlidesCount - 1;

				this.m_oApi.sendEvent("asc_onPaintSlideNum", this.VerticalScrollOnMouseUp.SlideNum);
				return;
			}

			var lNumSlide         = ((scrollPositionY / this.m_dDocumentPageHeight) + 0.01) >> 0; // 0.01 - ошибка округления!!
			var _can_change_slide = true;
			if (-1 != this.ZoomFreePageNum && this.ZoomFreePageNum == this.m_oDrawingDocument.SlideCurrent)
				_can_change_slide = false;

			if (_can_change_slide)
			{
				if (lNumSlide != this.m_oDrawingDocument.SlideCurrent)
				{
					if (!this.verticalScrollCheckChangeSlide())
						return;

					if (this.IsGoToPageMAXPosition)
					{
						if (lNumSlide >= this.m_oDrawingDocument.SlideCurrent)
							this.IsGoToPageMAXPosition = false;
					}

					this.GoToPage(lNumSlide);
					return;
				}
				else if (this.SlideScrollMAX < scrollPositionY)
				{
                    if (!this.verticalScrollCheckChangeSlide())
                        return;

					this.IsGoToPageMAXPosition = false;
					this.GoToPage(this.m_oDrawingDocument.SlideCurrent + 1);
					return;
				}
			}
			else
			{
                if (!this.verticalScrollCheckChangeSlide())
                    return;

				this.GoToPage(this.ZoomFreePageNum);
			}
		}
		else
		{
			if (this.StartVerticalScroll)
				return;
		}

		var oWordControl                       = oThis;
		oWordControl.m_dScrollY                = Math.max(0, Math.min(scrollPositionY, maxY));
		oWordControl.m_dScrollY_max            = maxY;
		oWordControl.m_bIsUpdateVerRuler       = true;
		oWordControl.m_bIsUpdateTargetNoAttack = true;

		oWordControl.IsGoToPageMAXPosition = false;

		if (oWordControl.m_bIsRePaintOnScroll === true)
			oWordControl.OnScroll();
	};
	this.verticalScrollMouseUp         = function(sender, e)
	{
		if (0 != this.MainScrollsEnabledFlag || !this.StartVerticalScroll)
			return;

		if (this.m_oDrawingDocument.IsEmptyPresentation)
		{
			this.StartVerticalScroll = false;
			this.m_oScrollVerApi.scrollByY(0, true);
			return;
		}

		if (this.VerticalScrollOnMouseUp.SlideNum != this.m_oDrawingDocument.SlideCurrent)
			this.GoToPage(this.VerticalScrollOnMouseUp.SlideNum);
		else
		{
			this.StartVerticalScroll = false;
			this.m_oApi.sendEvent("asc_onEndPaintSlideNum");

			this.m_oScrollVerApi.scrollByY(0, true);
		}
	};
	this.CorrectSpeedVerticalScroll    = function(newScrollPos)
	{
		if (0 != this.MainScrollsEnabledFlag)
			return;

		this.StartVerticalScroll = true;

		var res = {isChange : false, Pos : newScrollPos};
		return res;
	};
	this.CorrectVerticalScrollByYDelta = function(delta)
	{
		if (0 != this.MainScrollsEnabledFlag)
			return;

		this.IsGoToPageMAXPosition = true;
		var res                    = {isChange : false, Pos : delta};

		if (this.m_dScrollY > this.SlideScrollMIN && (this.m_dScrollY + delta) < this.SlideScrollMIN)
		{
			res.Pos      = this.SlideScrollMIN - this.m_dScrollY;
			res.isChange = true;
		}
		else if (this.m_dScrollY < this.SlideScrollMAX && (this.m_dScrollY + delta) > this.SlideScrollMAX)
		{
			res.Pos      = this.SlideScrollMAX - this.m_dScrollY;
			res.isChange = true;
		}

		return res;
	};

	this.horizontalScroll = function(sender, scrollPositionX, maxX, isAtLeft, isAtRight)
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		if (0 != this.MainScrollsEnabledFlag)
			return;

		var oWordControl                       = oThis;
		oWordControl.m_dScrollX                = scrollPositionX;
		oWordControl.m_dScrollX_max            = maxX;
		oWordControl.m_bIsUpdateHorRuler       = true;
		oWordControl.m_bIsUpdateTargetNoAttack = true;

		if (oWordControl.m_bIsRePaintOnScroll === true)
		{
			oWordControl.OnScroll();
		}
	};

	this.CreateScrollSettings = function()
	{
		var settings = new AscCommon.ScrollSettings();
		settings.screenW = this.m_oEditor.HtmlElement.width;
		settings.screenH = this.m_oEditor.HtmlElement.height;
		settings.vscrollStep = 45;
		settings.hscrollStep = 45;
		settings.contentH = this.m_dDocumentHeight;
		settings.contentW = this.m_dDocumentWidth;

		settings.scrollBackgroundColor = GlobalSkin.BackgroundScroll;
		settings.scrollBackgroundColorHover = GlobalSkin.BackgroundScroll;
		settings.scrollBackgroundColorActive = GlobalSkin.BackgroundScroll;

		if (this.m_bIsRuler)
		{
			settings.screenAddH = this.m_oTopRuler_horRuler.HtmlElement.height;
		}

		if (this.bIsRetinaSupport)
		{
			settings.screenW = AscCommon.AscBrowser.convertToRetinaValue(settings.screenW);
			settings.screenH = AscCommon.AscBrowser.convertToRetinaValue(settings.screenH);
			settings.screenAddH = AscCommon.AscBrowser.convertToRetinaValue(settings.screenAddH);
		}
		return settings;
	};

	this.UpdateScrolls = function()
	{
		var settings;
		if (window["NATIVE_EDITOR_ENJINE"])
			return;

		settings = this.CreateScrollSettings();
		settings.alwaysVisible = true;
		if (this.m_bIsHorScrollVisible)
		{
			if (this.m_oScrollHor_)
				this.m_oScrollHor_.Repos(settings, true, undefined);//unbind("scrollhorizontal")
			else
			{
				this.m_oScrollHor_ = new AscCommon.ScrollObject("id_horizontal_scroll", settings);
				this.m_oScrollHor_.bind("scrollhorizontal", function(evt)
				{
					oThis.horizontalScroll(this, evt.scrollD, evt.maxScrollX);
				});

				this.m_oScrollHor_.onLockMouse  = function(evt)
				{
					AscCommon.check_MouseDownEvent(evt, true);
					global_mouseEvent.LockMouse();
				};
				this.m_oScrollHor_.offLockMouse = function(evt)
				{
					AscCommon.check_MouseUpEvent(evt);
				};

				this.m_oScrollHorApi = this.m_oScrollHor_;
			}
		}

		settings = this.CreateScrollSettings();
		if (this.m_oScrollVer_)
		{
			this.m_oScrollVer_.Repos(settings, undefined, true);//unbind("scrollvertical")
		}
		else
		{

			this.m_oScrollVer_ = new AscCommon.ScrollObject("id_vertical_scroll", settings);

			this.m_oScrollVer_.onLockMouse  = function(evt)
			{
				AscCommon.check_MouseDownEvent(evt, true);
				global_mouseEvent.LockMouse();
			};
			this.m_oScrollVer_.offLockMouse = function(evt)
			{
				AscCommon.check_MouseUpEvent(evt);
			};

			this.m_oScrollVer_.bind("scrollvertical", function(evt)
			{
				oThis.verticalScroll(this, evt.scrollD, evt.maxScrollY);
			});
			this.m_oScrollVer_.bind("mouseup.presentations", function(evt)
			{
				oThis.verticalScrollMouseUp(this, evt);
			});
			this.m_oScrollVer_.bind("correctVerticalScroll", function(yPos)
			{
				return oThis.CorrectSpeedVerticalScroll(yPos);
			});
			this.m_oScrollVer_.bind("correctVerticalScrollDelta", function(delta)
			{
				return oThis.CorrectVerticalScrollByYDelta(delta);
			});
			this.m_oScrollVerApi = this.m_oScrollVer_;
		}

		this.m_oApi.sendEvent("asc_onUpdateScrolls", this.m_dDocumentWidth, this.m_dDocumentHeight);

		this.m_dScrollX_max = this.m_bIsHorScrollVisible ? this.m_oScrollHorApi.getMaxScrolledX() : 0;
		this.m_dScrollY_max = this.m_oScrollVerApi.getMaxScrolledY();

		if (this.m_dScrollX >= this.m_dScrollX_max)
			this.m_dScrollX = this.m_dScrollX_max;
		if (this.m_dScrollY >= this.m_dScrollY_max)
			this.m_dScrollY = this.m_dScrollY_max;
	};

	this.OnRePaintAttack = function()
	{
		this.m_bIsFullRepaint = true;
		this.OnScroll();
	};

	this.DeleteVerticalScroll = function()
	{
		this.m_oMainView.Bounds.R                    = 0;
		this.m_oPanelRight.HtmlElement.style.display = "none";
		this.OnResize();
	};

	this.OnResize = function(isAttack)
	{
		AscCommon.AscBrowser.checkZoom();

		var isNewSize = this.checkBodySize();
		if (!isNewSize && false === isAttack)
		{
			this.DemonstrationManager.Resize();
			return;
		}

		if (this.MobileTouchManager)
			this.MobileTouchManager.Resize_Before();

		if (this.Splitter1Pos > 0.1)
		{
            var maxSplitterThMax = g_dKoef_pix_to_mm * this.Width / 3;
            if (maxSplitterThMax > 80)
            	maxSplitterThMax = 80;

			this.Splitter1PosMin = maxSplitterThMax >> 2;
			this.Splitter1PosMax = maxSplitterThMax >> 0;

            this.Splitter1Pos = this.Splitter1PosSetUp;
            if (this.Splitter1Pos < this.Splitter1PosMin)
                this.Splitter1Pos = this.Splitter1PosMin;
            if (this.Splitter1Pos > this.Splitter1PosMax)
                this.Splitter1Pos = this.Splitter1PosMax;

            this.OnResizeSplitter(true);
        }

		//console.log("resize");
		this.CheckRetinaDisplay();

		if (GlobalSkin.SupportNotes)
		{
			var _pos = this.Height - ((this.Splitter2Pos * g_dKoef_mm_to_pix) >> 0);
			var _min = 30 * g_dKoef_mm_to_pix;
			if (_pos < _min)
			{
				this.Splitter2Pos = (this.Height - _min) / g_dKoef_mm_to_pix;
				if (this.Splitter2Pos < this.Splitter2PosMin)
					this.Splitter2Pos = 1;

				if (this.Splitter2Pos <= 1)
				{
					this.m_oNotes.HtmlElement.style.display = "none";
					this.m_oNotes_scroll.HtmlElement.style.display = "none";
				}
				else
				{
					this.m_oNotes.HtmlElement.style.display = "block";
					this.m_oNotes_scroll.HtmlElement.style.display = "block";
				}

				this.m_oMainContent.Bounds.B = this.Splitter2Pos + GlobalSkin.SplitterWidthMM;
				this.m_oMainContent.Bounds.isAbsB = true;
				this.m_oNotesContainer.Bounds.AbsH = this.Splitter2Pos;
			}
		}

		this.m_oBody.Resize(this.Width * g_dKoef_pix_to_mm, this.Height * g_dKoef_pix_to_mm, this);
		if (this.m_oApi.isReporterMode)
			this.OnResizeReporter();
		this.onButtonTabsDraw();

		if (AscCommon.g_inputContext)
			AscCommon.g_inputContext.onResize("id_main_parent");

		this.DemonstrationManager.Resize();

		if (this.checkNeedHorScroll())
		{
			return;
		}

		// теперь проверим необходимость перезуммирования
		if (1 == this.m_nZoomType && 0 != this.m_dDocumentPageWidth && 0 != this.m_dDocumentPageHeight)
		{
			if (true === this.zoom_FitToWidth())
			{
				this.m_oBoundsController.ClearNoAttack();
				this.onTimerScroll_sync();

				this.FullRulersUpdate();
				return;
			}
		}
		if (2 == this.m_nZoomType && 0 != this.m_dDocumentPageWidth && 0 != this.m_dDocumentPageHeight)
		{
			if (true === this.zoom_FitToPage())
			{
				this.m_oBoundsController.ClearNoAttack();
				this.onTimerScroll_sync();

				this.FullRulersUpdate();
				return;
			}
		}

		this.Thumbnails.m_bIsUpdate = true;
		this.CalculateDocumentSize();

		this.m_bIsUpdateTargetNoAttack = true;
		this.m_bIsRePaintOnScroll      = true;

		this.m_oBoundsController.ClearNoAttack();

		this.OnScroll();
		this.onTimerScroll_sync(true);

		this.DemonstrationManager.Resize();

		if (this.MobileTouchManager)
			this.MobileTouchManager.Resize_After();

		if (this.IsSupportNotes && this.m_oNotesApi)
			this.m_oNotesApi.OnResize();

		this.FullRulersUpdate();
	};

	this.FullRulersUpdate = function()
	{
		this.m_oHorRuler.RepaintChecker.BlitAttack = true;
		this.m_oVerRuler.RepaintChecker.BlitAttack = true;

		this.m_bIsUpdateHorRuler = true;
		this.m_bIsUpdateVerRuler = true;

		if (this.m_bIsRuler)
		{
			this.UpdateHorRulerBack(true);
			this.UpdateVerRulerBack(true);
		}
	};

	this.OnResizeReporter = function()
	{
		if (this.m_oApi.isReporterMode)
		{
			var _label1 = document.getElementById("dem_id_time");
			if (!_label1)
				return;

			var _buttonPlay = document.getElementById("dem_id_play");
			var _buttonReset = document.getElementById("dem_id_reset");
			var _buttonPrev = document.getElementById("dem_id_prev");
			var _buttonNext = document.getElementById("dem_id_next");
			var _buttonSeparator = document.getElementById("dem_id_sep");
			var _labelMain = document.getElementById("dem_id_slides");
			var _buttonSeparator2 = document.getElementById("dem_id_sep2");
			var _buttonPointer = document.getElementById("dem_id_pointer");
			var _buttonEnd = document.getElementById("dem_id_end");

			_label1.style.display = "block";
			_buttonPlay.style.display = "block";
			_buttonReset.style.display = "block";
			_buttonEnd.style.display = "block";

			var _label1_width = _label1.offsetWidth;
			var _main_width = _labelMain.offsetWidth;
			var _buttonReset_width = _buttonReset.offsetWidth;
			var _buttonEnd_width = _buttonEnd.offsetWidth;

			if (0 == _label1_width)
				_label1_width = 45;
			if (0 == _main_width)
				_main_width = 55;
			if (0 == _buttonReset_width)
				_buttonReset_width = 45;
			if (0 == _buttonEnd_width)
				_buttonEnd_width = 60;

			var _width = parseInt(this.m_oMainView.HtmlElement.style.width);

			// test first mode
			// [10][time][6][play/pause(20)][6][reset]----[10]----[prev(20)][next(20)][15][slide x of x][15][pointer(20)]----[10]----[end][10]
			var _widthCenter = (20 + 20 + 15 + _main_width + 15 + 20);
			var _posCenter = (_width - _widthCenter) >> 1;

			var _test_width1 = 10 + _label1_width + 6 + 20 + 6 + _buttonReset_width + 10 + 20 + 20 + 15 + _main_width + 15 + 20 + 10 + _buttonEnd_width + 10;
			var _is1 = ((10 + _label1_width + 6 + 20 + 6 + _buttonReset_width + 10) <= _posCenter) ? true : false;
			var _is2 = ((_posCenter + _widthCenter) <= (_width - 20 - _buttonEnd_width)) ? true : false;
			if (_is2 && (_test_width1 <= _width))
			{
				_label1.style.display = "block";
				_buttonPlay.style.display = "block";
				_buttonReset.style.display = "block";
				_buttonEnd.style.display = "block";

				_label1.style.left = "10px";
				_buttonPlay.style.left = (10 + _label1_width + 6) + "px";
				_buttonReset.style.left = (10 + _label1_width + 6 + 20 + 6) + "px";

				if (!_is1)
				{
					_posCenter = 10 + _label1_width + 6 + 20 + 6 + _buttonReset_width + 10 + ((_width - _test_width1) >> 1);
				}

				_buttonPrev.style.left = _posCenter + "px";
				_buttonNext.style.left = (_posCenter + 20) + "px";
				_buttonSeparator.style.left = (_posCenter + 48 - 10) + "px";
				_labelMain.style.left = (_posCenter + 55) + "px";
				_buttonSeparator2.style.left = (_posCenter + 55 + _main_width + 7 - 10) + "px";
				_buttonPointer.style.left = (_posCenter + 70 + _main_width) + "px";

				return;
			}

			// test second mode
			// [10][prev(20)][next(20)][15][slide x of x][15][pointer(20)]----[10]----[end][10]
			var _test_width2 = 10 + 20 + 20 + 15 + _main_width + 15 + 20 + 10 + _buttonEnd_width + 10;
			if (_test_width2 <= _width)
			{
				_label1.style.display = "none";
				_buttonPlay.style.display = "none";
				_buttonReset.style.display = "none";
				_buttonEnd.style.display = "block";

				_buttonPrev.style.left = "10px";
				_buttonNext.style.left = "30px";
				_buttonSeparator.style.left = (58 - 10) + "px";
				_labelMain.style.left = "65px";
				_buttonSeparator2.style.left = (65 + _main_width + 7 - 10) + "px";
				_buttonPointer.style.left = (80 + _main_width) + "px";
				return;
			}

			// test third mode
			// ---------[prev(20)][next(20)][15][slide x of x][15][pointer(20)]---------
			// var _test_width3 = 20 + 20 + 15 + _main_width + 15 + 20;
			if (_posCenter < 0)
				_posCenter = 0;

			_label1.style.display = "none";
			_buttonPlay.style.display = "none";
			_buttonReset.style.display = "none";
			_buttonEnd.style.display = "none";

			_buttonPrev.style.left = _posCenter + "px";
			_buttonNext.style.left = (_posCenter + 20) + "px";
			_buttonSeparator.style.left = (_posCenter + 48 - 10) + "px";
			_labelMain.style.left = (_posCenter + 55) + "px";
			_buttonSeparator2.style.left = (_posCenter + 55 + _main_width + 7 - 10) + "px";
			_buttonPointer.style.left = (_posCenter + 70 + _main_width) + "px";
		}
	};

	this.OnResize2 = function(isAttack)
	{
		this.m_oBody.Resize(this.Width * g_dKoef_pix_to_mm, this.Height * g_dKoef_pix_to_mm, this);
		if (this.m_oApi.isReporterMode)
			this.OnResizeReporter();

		this.onButtonTabsDraw();
		this.DemonstrationManager.Resize();

		if (this.checkNeedHorScroll())
		{
			return;
		}

		// теперь проверим необходимость перезуммирования
		if (1 == this.m_nZoomType)
		{
			if (true === this.zoom_FitToWidth())
			{
				this.m_oBoundsController.ClearNoAttack();
				this.onTimerScroll_sync();

				this.FullRulersUpdate();
				return;
			}
		}
		if (2 == this.m_nZoomType)
		{
			if (true === this.zoom_FitToPage())
			{
				this.m_oBoundsController.ClearNoAttack();
				this.onTimerScroll_sync();

				this.FullRulersUpdate();
				return;
			}
		}

		this.m_bIsUpdateHorRuler = true;
		this.m_bIsUpdateVerRuler = true;

		this.m_oHorRuler.RepaintChecker.BlitAttack = true;
		this.m_oVerRuler.RepaintChecker.BlitAttack = true;

		this.Thumbnails.m_bIsUpdate = true;
		this.CalculateDocumentSize();

		this.m_bIsUpdateTargetNoAttack = true;
		this.m_bIsRePaintOnScroll      = true;

		this.m_oBoundsController.ClearNoAttack();
		this.OnScroll();
		this.onTimerScroll_sync(true);

		this.DemonstrationManager.Resize();

		if (this.IsSupportNotes && this.m_oNotesApi)
			this.m_oNotesApi.OnResize();

		this.FullRulersUpdate();
	};

	this.checkNeedRules     = function()
	{
		if (this.m_bIsRuler)
		{
			this.m_oLeftRuler.HtmlElement.style.display = 'block';
			this.m_oTopRuler.HtmlElement.style.display  = 'block';

			this.m_oMainView.Bounds.L = 5;
			this.m_oMainView.Bounds.T = 7;
		}
		else
		{
			this.m_oLeftRuler.HtmlElement.style.display = 'none';
			this.m_oTopRuler.HtmlElement.style.display  = 'none';

			this.m_oMainView.Bounds.L = 0;
			this.m_oMainView.Bounds.T = 0;
		}
	};

	this.checkNeedHorScrollValue = function(_width)
	{
		var w = this.m_oEditor.HtmlElement.width;
		if (this.bIsRetinaSupport)
			w /= AscCommon.AscBrowser.retinaPixelRatio;

		return (_width <= w) ? false : true;
	};

	this.checkNeedHorScroll = function()
	{
		if (!this.m_oLogicDocument)
			return false;

		if (this.m_oApi.isReporterMode)
		{
			this.m_oEditor.HtmlElement.style.display = 'none';
            this.m_oOverlay.HtmlElement.style.display = 'none';
			this.m_oScrollHor.HtmlElement.style.display = 'none';
            return false;
        }

		this.m_bIsHorScrollVisible = this.checkNeedHorScrollValue(this.m_dDocumentWidth);

		var hor_scroll         = document.getElementById('panel_hor_scroll');
		hor_scroll.style.width = this.m_dDocumentWidth + "px";

		if (this.m_bIsHorScrollVisible)
		{
			if (this.m_oApi.isMobileVersion)
			{
				this.m_oPanelRight.Bounds.B = 0;
				this.m_oMainView.Bounds.B   = 0;
                this.m_oScrollHor.HtmlElement.style.display = 'none';
			}
			else
			{
				this.m_oScrollHor.HtmlElement.style.display = 'block';
			}
		}
		else
		{
			this.m_oScrollHor.HtmlElement.style.display = 'none';
		}

		return false;
	};

	this.StartUpdateOverlay = function()
	{
		this.IsUpdateOverlayOnlyEnd = true;
	};
	this.EndUpdateOverlay   = function()
	{
		this.IsUpdateOverlayOnlyEnd = false;
		if (this.IsUpdateOverlayOnEndCheck)
			this.OnUpdateOverlay();
		this.IsUpdateOverlayOnEndCheck = false;
	};

	this.OnUpdateOverlay = function()
	{
		if (this.IsUpdateOverlayOnlyEnd)
		{
			this.IsUpdateOverlayOnEndCheck = true;
			return false;
		}

		this.m_oApi.checkLastWork();

		var overlay = this.m_oOverlayApi;
		var overlayNotes = null;

		var isDrawNotes = false;
		if (this.IsSupportNotes && this.m_oNotesApi)
		{
			overlayNotes = this.m_oNotesApi.m_oOverlayApi;
			overlayNotes.SetBaseTransform();
			overlayNotes.Clear();

			if (this.m_oLogicDocument.IsFocusOnNotes())
				isDrawNotes = true;
		}

		overlay.SetBaseTransform();
		overlay.Clear();
		var ctx = overlay.m_oContext;

		var drDoc = this.m_oDrawingDocument;
		drDoc.SelectionMatrix = null;

		if (drDoc.SlideCurrent >= drDoc.m_oLogicDocument.Slides.length)
			drDoc.SlideCurrent = drDoc.m_oLogicDocument.Slides.length - 1;

		if (drDoc.m_bIsSearching)
		{
			ctx.fillStyle = "rgba(255,200,0,1)";
			ctx.beginPath();

			var drDoc = this.m_oDrawingDocument;
			drDoc.DrawSearch(overlay);

			ctx.globalAlpha = 0.5;
			ctx.fill();
			ctx.beginPath();
			ctx.globalAlpha = 1.0;

			if (null != drDoc.CurrentSearchNavi)
			{
				ctx.globalAlpha = 0.2;
				ctx.fillStyle   = "rgba(51,102,204,255)";

				var places = drDoc.CurrentSearchNavi.Place;
				for (var i = 0; i < places.length; i++)
				{
					var place = places[i];
					if (drDoc.SlideCurrent == place.PageNum)
					{
						drDoc.DrawSearchCur(overlay, place);
					}
				}

				ctx.fill();
				ctx.globalAlpha = 1.0;
			}
		}

		if (drDoc.m_bIsSelection)
		{
			ctx.fillStyle   = "rgba(51,102,204,255)";
			ctx.strokeStyle = "#9ADBFE";

			ctx.beginPath();

			if (drDoc.SlideCurrent != -1)
				this.m_oLogicDocument.Slides[drDoc.SlideCurrent].drawSelect(1);

			ctx.globalAlpha = 0.2;
			ctx.fill();
			ctx.globalAlpha = 1.0;
			ctx.stroke();
			ctx.beginPath();
			ctx.globalAlpha = 1.0;

			if (this.MobileTouchManager)
				this.MobileTouchManager.CheckSelect(overlay);
		}

		if (isDrawNotes && drDoc.m_bIsSelection)
		{
			var ctxOverlay = overlayNotes.m_oContext;
			ctxOverlay.fillStyle   = "rgba(51,102,204,255)";
			ctxOverlay.strokeStyle = "#9ADBFE";

			ctxOverlay.beginPath();

			if (drDoc.SlideCurrent != -1)
				this.m_oLogicDocument.Slides[drDoc.SlideCurrent].drawNotesSelect();

			ctxOverlay.globalAlpha = 0.2;
			ctxOverlay.fill();
			ctxOverlay.globalAlpha = 1.0;
			ctxOverlay.stroke();
			ctxOverlay.beginPath();
			ctxOverlay.globalAlpha = 1.0;
		}

		if (this.MobileTouchManager)
			this.MobileTouchManager.CheckTableRules(overlay);

		ctx.globalAlpha = 1.0;
		ctx             = null;

		if (this.m_oLogicDocument != null && drDoc.SlideCurrent >= 0)
		{
			this.m_oLogicDocument.Slides[drDoc.SlideCurrent].drawSelect(2);

			var elements = this.m_oLogicDocument.Slides[this.m_oLogicDocument.CurPage].graphicObjects;
			if (!elements.canReceiveKeyPress() && -1 != drDoc.SlideCurrent)
			{
				var drawPage = drDoc.SlideCurrectRect;
				drDoc.AutoShapesTrack.init(overlay, drawPage.left, drawPage.top, drawPage.right, drawPage.bottom, this.m_oLogicDocument.Width, this.m_oLogicDocument.Height);

				elements.DrawOnOverlay(drDoc.AutoShapesTrack);
				drDoc.AutoShapesTrack.CorrectOverlayBounds();

				overlay.SetBaseTransform();
			}
		}

		if (drDoc.InlineTextTrackEnabled && null != drDoc.InlineTextTrack)
		{
			var _oldPage        = drDoc.AutoShapesTrack.PageIndex;
			var _oldCurPageInfo = drDoc.AutoShapesTrack.CurrentPageInfo;

			drDoc.AutoShapesTrack.PageIndex = drDoc.InlineTextTrackPage;
			drDoc.AutoShapesTrack.DrawInlineMoveCursor(drDoc.InlineTextTrack.X, drDoc.InlineTextTrack.Y, drDoc.InlineTextTrack.Height, drDoc.InlineTextTrack.transform, drDoc.InlineTextInNotes ? overlayNotes : null);

			drDoc.AutoShapesTrack.PageIndex       = _oldPage;
			drDoc.AutoShapesTrack.CurrentPageInfo = _oldCurPageInfo;
		}

        if (drDoc.placeholders.objects.length > 0 && drDoc.SlideCurrent >= 0)
        {
        	drDoc.placeholders.draw(overlay, drDoc.SlideCurrent, drDoc.SlideCurrectRect, this.m_oLogicDocument.Width, this.m_oLogicDocument.Height);
        }

		drDoc.DrawHorVerAnchor();

		return true;
	};

	this.GetDrawingPageInfo = function(nPageIndex)
	{
		return {
			drawingPage : this.m_oDrawingDocument.SlideCurrectRect,
			width_mm    : this.m_oLogicDocument.Width,
			height_mm   : this.m_oLogicDocument.Height
		};
	};

	this.OnCalculatePagesPlace = function()
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var canvas = this.m_oEditor.HtmlElement;
		if (null == canvas)
			return;

		var dKoef         = (this.m_nZoomValue * g_dKoef_mm_to_pix / 100);
		var _bounds_slide = this.SlideDrawer.BoundsChecker.Bounds;

		var _slideW = (dKoef * this.m_oLogicDocument.Width) >> 0;
		var _slideH = (dKoef * this.m_oLogicDocument.Height) >> 0;

		var _srcW = this.m_oEditor.HtmlElement.width;
		var _srcH = this.m_oEditor.HtmlElement.height;
		if (this.bIsRetinaSupport)
		{
			_srcW = (_srcW / AscCommon.AscBrowser.retinaPixelRatio) >> 0;
			_srcH = (_srcH / AscCommon.AscBrowser.retinaPixelRatio) >> 0;

			_bounds_slide = {
				min_x : (_bounds_slide.min_x / AscCommon.AscBrowser.retinaPixelRatio) >> 0,
				min_y : (_bounds_slide.min_y / AscCommon.AscBrowser.retinaPixelRatio) >> 0,
				max_x : (_bounds_slide.max_x / AscCommon.AscBrowser.retinaPixelRatio) >> 0,
				max_y : (_bounds_slide.max_y / AscCommon.AscBrowser.retinaPixelRatio) >> 0
			};
		}

		var _centerX         = (_srcW / 2) >> 0;
		var _centerSlideX    = (dKoef * this.m_oLogicDocument.Width / 2) >> 0;
		var _hor_width_left  = Math.min(0, _centerX - (_centerSlideX - _bounds_slide.min_x) - this.SlideDrawer.CONST_BORDER);
		var _hor_width_right = Math.max(_srcW - 1, _centerX + (_bounds_slide.max_x - _centerSlideX) + this.SlideDrawer.CONST_BORDER);

		var _centerY           = (_srcH / 2) >> 0;
		var _centerSlideY      = (dKoef * this.m_oLogicDocument.Height / 2) >> 0;
		var _ver_height_top    = Math.min(0, _centerY - (_centerSlideY - _bounds_slide.min_y) - this.SlideDrawer.CONST_BORDER);
		var _ver_height_bottom = Math.max(_srcH - 1, _centerX + (_bounds_slide.max_y - _centerSlideY) + this.SlideDrawer.CONST_BORDER);

		if (this.m_dScrollY <= this.SlideScrollMIN)
			this.m_dScrollY = this.SlideScrollMIN;
		if (this.m_dScrollY >= this.SlideScrollMAX)
			this.m_dScrollY = this.SlideScrollMAX;

		var _x = -this.m_dScrollX + _centerX - _centerSlideX - _hor_width_left;
		var _y = -(this.m_dScrollY - this.SlideScrollMIN) + _centerY - _centerSlideY - _ver_height_top;

		// теперь расчитаем какие нужны позиции, чтобы слайд находился по центру
		var _x_c                = _centerX - _centerSlideX;
		var _y_c                = _centerY - _centerSlideY;
		this.m_dScrollX_Central = _centerX - _centerSlideX - _hor_width_left - _x_c;
		this.m_dScrollY_Central = this.SlideScrollMIN + _centerY - _centerSlideY - _ver_height_top - _y_c;

		this.m_oDrawingDocument.SlideCurrectRect.left   = _x;
		this.m_oDrawingDocument.SlideCurrectRect.top    = _y;
		this.m_oDrawingDocument.SlideCurrectRect.right  = _x + _slideW;
		this.m_oDrawingDocument.SlideCurrectRect.bottom = _y + _slideH;

		if (this.m_oApi.isMobileVersion || this.m_oApi.isViewMode)
		{
			var lPage = this.m_oApi.GetCurrentVisiblePage();
			this.m_oApi.sendEvent("asc_onCurrentVisiblePage", this.m_oApi.GetCurrentVisiblePage());
		}

		if (this.m_bDocumentPlaceChangedEnabled)
			this.m_oApi.sendEvent("asc_onDocumentPlaceChanged");

		// remove media
		this.m_oApi.hideVideoControl();
	};

	this.OnPaint = function()
	{
		if (false === oThis.m_oApi.bInit_word_control)
			return;

		var canvas = this.m_oEditor.HtmlElement;
		if (null == canvas)
			return;

		var context = canvas.getContext("2d");
		var _width  = canvas.width;
		var _height = canvas.height;

		context.fillStyle = GlobalSkin.BackgroundColor;
		context.fillRect(0, 0, _width, _height);
		//context.clearRect(0, 0, _width, _height);

		/*
		 if (this.SlideDrawer.IsRecalculateSlide == true)
		 {
		 this.SlideDrawer.CheckSlide(this.m_oDrawingDocument.SlideCurrent);
		 this.SlideDrawer.IsRecalculateSlide = false;
		 }
		 */

		this.SlideDrawer.DrawSlide(context, this.m_dScrollX, this.m_dScrollX_max,
			this.m_dScrollY - this.SlideScrollMIN, this.m_dScrollY_max, this.m_oDrawingDocument.SlideCurrent);

		this.OnUpdateOverlay();

		if (this.m_bIsUpdateHorRuler)
		{
			this.UpdateHorRuler();
			this.m_bIsUpdateHorRuler = false;
		}
		if (this.m_bIsUpdateVerRuler)
		{
			this.UpdateVerRuler();
			this.m_bIsUpdateVerRuler = false;
		}
		if (this.m_bIsUpdateTargetNoAttack)
		{
			this.m_oDrawingDocument.UpdateTargetNoAttack();
			this.m_bIsUpdateTargetNoAttack = false;
		}
	};

	this.CheckFontCache = function()
	{
		var _c = oThis;
		_c.m_nCurrentTimeClearCache++;
		if (_c.m_nCurrentTimeClearCache > 750) // 30 секунд. корректировать при смене интервала главного таймера!!!
		{
			_c.m_nCurrentTimeClearCache = 0;
			_c.m_oDrawingDocument.CheckFontCache();
		}
        oThis.m_oLogicDocument.ContinueCheckSpelling();
	};
	this.OnScroll       = function()
	{
		this.OnCalculatePagesPlace();
		this.m_bIsScroll = true;
	};

	this.CheckZoom = function()
	{
		if (!this.NoneRepaintPages)
			this.m_oDrawingDocument.ClearCachePages();
	};

	this.CalculateDocumentSizeInternal = function(_canvas_height, _zoom_value, _check_bounds2)
	{
		var size = {
			m_dDocumentWidth		: 0,
			m_dDocumentHeight		: 0,
			m_dDocumentPageWidth	: 0,
			m_dDocumentPageHeight	: 0,
			SlideScrollMIN			: 0,
			SlideScrollMAX			: 0
		};

		var _zoom = (undefined == _zoom_value) ? this.m_nZoomValue : _zoom_value;
		var dKoef = (_zoom * g_dKoef_mm_to_pix / 100);

		var _bounds_slide = this.SlideBoundsOnCalculateSize;
		if (undefined == _check_bounds2)
		{
			this.SlideBoundsOnCalculateSize.fromBounds(this.SlideDrawer.BoundsChecker.Bounds);
		}
		else
		{
			_bounds_slide = new AscFormat.CBoundsController();
			this.SlideDrawer.CheckSlideSize(_zoom, this.m_oDrawingDocument.SlideCurrent);
			_bounds_slide.fromBounds(this.SlideDrawer.BoundsChecker2.Bounds);
		}

		var _srcW = this.m_oEditor.HtmlElement.width;
		var _srcH = (undefined !== _canvas_height) ? _canvas_height : this.m_oEditor.HtmlElement.height;
		if (this.bIsRetinaSupport)
		{
			_srcW = (_srcW / AscCommon.AscBrowser.retinaPixelRatio) >> 0;
			_srcH = (_srcH / AscCommon.AscBrowser.retinaPixelRatio) >> 0;

			_bounds_slide = {
				min_x : (_bounds_slide.min_x / AscCommon.AscBrowser.retinaPixelRatio) >> 0,
				min_y : (_bounds_slide.min_y / AscCommon.AscBrowser.retinaPixelRatio) >> 0,
				max_x : (_bounds_slide.max_x / AscCommon.AscBrowser.retinaPixelRatio) >> 0,
				max_y : (_bounds_slide.max_y / AscCommon.AscBrowser.retinaPixelRatio) >> 0
			};
		}

		var _centerX         = (_srcW / 2) >> 0;
		var _centerSlideX    = (dKoef * this.m_oLogicDocument.Width / 2) >> 0;
		var _hor_width_left  = Math.min(0, _centerX - (_centerSlideX - _bounds_slide.min_x) - this.SlideDrawer.CONST_BORDER);
		var _hor_width_right = Math.max(_srcW - 1, _centerX + (_bounds_slide.max_x - _centerSlideX) + this.SlideDrawer.CONST_BORDER);

		var _centerY           = (_srcH / 2) >> 0;
		var _centerSlideY      = (dKoef * this.m_oLogicDocument.Height / 2) >> 0;
		var _ver_height_top    = Math.min(0, _centerY - (_centerSlideY - _bounds_slide.min_y) - this.SlideDrawer.CONST_BORDER);
		var _ver_height_bottom = Math.max(_srcH - 1, _centerY + (_bounds_slide.max_y - _centerSlideY) + this.SlideDrawer.CONST_BORDER);

		var lWSlide = _hor_width_right - _hor_width_left + 1;
		var lHSlide = _ver_height_bottom - _ver_height_top + 1;

		var one_slide_width  = lWSlide;
		var one_slide_height = Math.max(lHSlide, _srcH);

		size.m_dDocumentPageWidth  = one_slide_width;
		size.m_dDocumentPageHeight = one_slide_height;

		size.m_dDocumentWidth  = one_slide_width;
		size.m_dDocumentHeight = (one_slide_height * this.m_oDrawingDocument.SlidesCount) >> 0;

		if (0 == this.m_oDrawingDocument.SlidesCount)
			size.m_dDocumentHeight = one_slide_height >> 0;

		size.SlideScrollMIN = this.m_oDrawingDocument.SlideCurrent * one_slide_height;
		size.SlideScrollMAX = size.SlideScrollMIN + one_slide_height - _srcH;

		if (0 == this.m_oDrawingDocument.SlidesCount)
		{
			size.SlideScrollMIN = 0;
			size.SlideScrollMAX = size.SlideScrollMIN + one_slide_height - _srcH;
		}

		return size;
	};

	this.CalculateDocumentSize = function(bIsAttack)
	{
		if (false === oThis.m_oApi.bInit_word_control)
		{
			oThis.UpdateScrolls();
			return;
		}

		var size = this.CalculateDocumentSizeInternal();

		this.m_dDocumentWidth      = size.m_dDocumentWidth;
		this.m_dDocumentHeight     = size.m_dDocumentHeight;
		this.m_dDocumentPageWidth  = size.m_dDocumentPageWidth;
		this.m_dDocumentPageHeight = size.m_dDocumentPageHeight;

		this.OldDocumentWidth  = this.m_dDocumentWidth;
		this.OldDocumentHeight = this.m_dDocumentHeight;

		this.SlideScrollMIN = size.SlideScrollMIN;
		this.SlideScrollMAX = size.SlideScrollMAX;

		// теперь проверим необходимость перезуммирования
		if (1 == this.m_nZoomType)
		{
			if (true === this.zoom_FitToWidth())
				return;
		}
		if (2 == this.m_nZoomType)
		{
			if (true === this.zoom_FitToPage())
				return;
		}

		this.MainScrollLock();

		this.checkNeedHorScroll();

		document.getElementById('panel_right_scroll').style.height = this.m_dDocumentHeight + "px";

		this.UpdateScrolls();

		this.MainScrollUnLock();

		this.Thumbnails.SlideWidth  = this.m_oLogicDocument.Width;
		this.Thumbnails.SlideHeight = this.m_oLogicDocument.Height;
		this.Thumbnails.SlidesCount = this.m_oDrawingDocument.SlidesCount;
		this.Thumbnails.CheckSizes();

		if (this.MobileTouchManager)
			this.MobileTouchManager.Resize();

		if (this.m_oApi.watermarkDraw)
		{
			this.m_oApi.watermarkDraw.zoom = this.m_nZoomValue / 100;
			this.m_oApi.watermarkDraw.Generate();
		}
	};

	this.CheckCalculateDocumentSize = function(_bounds)
	{
		if (false === oThis.m_oApi.bInit_word_control)
		{
			oThis.UpdateScrolls();
			return;
		}

		var size = this.CalculateDocumentSizeInternal();

		this.m_dDocumentWidth      = size.m_dDocumentWidth;
		this.m_dDocumentHeight     = size.m_dDocumentHeight;
		this.m_dDocumentPageWidth  = size.m_dDocumentPageWidth;
		this.m_dDocumentPageHeight = size.m_dDocumentPageHeight;

		this.OldDocumentWidth  = this.m_dDocumentWidth;
		this.OldDocumentHeight = this.m_dDocumentHeight;

		this.SlideScrollMIN = size.SlideScrollMIN;
		this.SlideScrollMAX = size.SlideScrollMAX;

		this.MainScrollLock();

		var bIsResize = this.checkNeedHorScroll();

		document.getElementById('panel_right_scroll').style.height = this.m_dDocumentHeight + "px";

		this.UpdateScrolls();

		this.MainScrollUnLock();

		return bIsResize;
	};

	this.InitDocument = function(bIsEmpty)
	{
		this.m_oDrawingDocument.m_oWordControl   = this;
		this.m_oDrawingDocument.m_oLogicDocument = this.m_oLogicDocument;

		if (false === bIsEmpty)
		{
			this.m_oLogicDocument.LoadTestDocument();
		}

		this.CalculateDocumentSize();
		this.StartMainTimer();

		this.CreateBackgroundHorRuler();
		this.CreateBackgroundVerRuler();
		this.UpdateHorRuler();
		this.UpdateVerRuler();
	};

	this.InitControl = function()
	{
		this.Thumbnails.Init();

		this.CalculateDocumentSize();
		this.StartMainTimer();

		this.CreateBackgroundHorRuler();
		this.CreateBackgroundVerRuler();
		this.UpdateHorRuler();
		this.UpdateVerRuler();

		this.m_oApi.syncOnThumbnailsShow();

		if (true)
		{
			AscCommon.InitBrowserInputContext(this.m_oApi, "id_target_cursor", "id_main_parent");
			if (AscCommon.g_inputContext)
				AscCommon.g_inputContext.onResize("id_main_parent");

			if (this.m_oApi.isMobileVersion)
				this.initEventsMobile();

			if (this.m_oApi.isReporterMode)
				AscCommon.g_inputContext.HtmlArea.style.display = "none";
		}
	};

	this.StartMainTimer = function()
	{
		if (-1 == this.m_nPaintTimerId)
			this.onTimerScroll();
	};

	this.onTimerScroll = function(isThUpdateSync)
	{
		var oWordControl                = oThis;

		if (oWordControl.m_oApi.isLongAction())
        {
            oWordControl.m_nPaintTimerId = setTimeout(oWordControl.onTimerScroll, oWordControl.m_nTimerScrollInterval);
            return;
        }

		var isRepaint = oWordControl.m_bIsScroll;
		if (oWordControl.m_bIsScroll)
		{
			oWordControl.m_bIsScroll = false;
			oWordControl.OnPaint();

			if (isThUpdateSync !== undefined)
			{
				oWordControl.Thumbnails.onCheckUpdate();
			}
		}
		else
		{
			oWordControl.Thumbnails.onCheckUpdate();
		}

		if (!isRepaint && oWordControl.m_oNotesApi.IsRepaint)
			isRepaint = true;

		if (oWordControl.IsSupportNotes && oWordControl.m_oNotesApi)
			oWordControl.m_oNotesApi.CheckPaint();

		if (null != oWordControl.m_oLogicDocument)
		{
			oWordControl.m_oDrawingDocument.UpdateTargetFromPaint = true;
			oWordControl.m_oLogicDocument.CheckTargetUpdate();
			oWordControl.m_oDrawingDocument.CheckTargetShow();
			oWordControl.m_oDrawingDocument.UpdateTargetFromPaint = false;

			oWordControl.CheckFontCache();

			if (oWordControl.m_bIsUpdateTargetNoAttack)
			{
				oWordControl.m_oDrawingDocument.UpdateTargetNoAttack();
				oWordControl.m_bIsUpdateTargetNoAttack = false;
			}
		}

		oWordControl.m_oDrawingDocument.Collaborative_TargetsUpdate(isRepaint);

		oWordControl.m_nPaintTimerId = setTimeout(oWordControl.onTimerScroll, oWordControl.m_nTimerScrollInterval);
		//window.requestAnimationFrame(oWordControl.onTimerScroll);
	};

	this.onTimerScroll_sync = function(isThUpdateSync)
	{
		var oWordControl                = oThis;
		var isRepaint                   = oWordControl.m_bIsScroll;
		if (oWordControl.m_bIsScroll)
		{
			oWordControl.m_bIsScroll = false;
			oWordControl.OnPaint();

			if (isThUpdateSync !== undefined)
			{
				oWordControl.Thumbnails.onCheckUpdate();
			}
            if (null != oWordControl.m_oLogicDocument && oWordControl.m_oApi.bInit_word_control)
                oWordControl.m_oLogicDocument.Viewer_OnChangePosition();
		}
		else
		{
			oWordControl.Thumbnails.onCheckUpdate();
		}
		if (null != oWordControl.m_oLogicDocument)
		{
			oWordControl.m_oDrawingDocument.UpdateTargetFromPaint = true;
			oWordControl.m_oLogicDocument.CheckTargetUpdate();
			oWordControl.m_oDrawingDocument.CheckTargetShow();
			oWordControl.m_oDrawingDocument.UpdateTargetFromPaint = false;

			oWordControl.CheckFontCache();
		}
		oWordControl.m_oDrawingDocument.Collaborative_TargetsUpdate(isRepaint);
	};

	this.UpdateHorRuler = function(isattack)
	{
		if (!this.m_bIsRuler)
			return;

		if (!isattack && this.m_oDrawingDocument.SlideCurrent == -1)
			return;

		var drawRect = this.m_oDrawingDocument.SlideCurrectRect;
		var _left    = drawRect.left;
		this.m_oHorRuler.BlitToMain(_left, 0, this.m_oTopRuler_horRuler.HtmlElement);
	};
	this.UpdateVerRuler = function(isattack)
	{
		if (!this.m_bIsRuler)
			return;

		if (!isattack && this.m_oDrawingDocument.SlideCurrent == -1)
			return;

		var drawRect = this.m_oDrawingDocument.SlideCurrectRect;
		var _top     = drawRect.top;
		this.m_oVerRuler.BlitToMain(0, _top, this.m_oLeftRuler_vertRuler.HtmlElement);
	};

	this.SetCurrentPage = function()
	{
		var drDoc = this.m_oDrawingDocument;
		if (0 <= drDoc.SlideCurrent && drDoc.SlideCurrent < drDoc.SlidesCount)
		{
			this.CreateBackgroundHorRuler();
			this.CreateBackgroundVerRuler();
		}

		this.m_bIsUpdateHorRuler = true;
		this.m_bIsUpdateVerRuler = true;

		this.OnScroll();

		this.m_oApi.sync_currentPageCallback(drDoc.m_lCurrentPage);
	};

	this.UpdateHorRulerBack = function(isattack)
	{
		var drDoc = this.m_oDrawingDocument;
		if (0 <= drDoc.SlideCurrent && drDoc.SlideCurrent < drDoc.SlidesCount)
		{
			this.CreateBackgroundHorRuler(undefined, isattack);
		}
		this.UpdateHorRuler(isattack);
	};
	this.UpdateVerRulerBack = function(isattack)
	{
		var drDoc = this.m_oDrawingDocument;
		if (0 <= drDoc.SlideCurrent && drDoc.SlideCurrent < drDoc.SlidesCount)
		{
			this.CreateBackgroundVerRuler(undefined, isattack);
		}
		this.UpdateVerRuler(isattack);
	};

	this.CreateBackgroundHorRuler = function(margins, isattack)
	{
		var cachedPage       = {};
		cachedPage.width_mm  = this.m_oLogicDocument.Width;
		cachedPage.height_mm = this.m_oLogicDocument.Height;

		if (margins !== undefined)
		{
			cachedPage.margin_left   = margins.L;
			cachedPage.margin_top    = margins.T;
			cachedPage.margin_right  = margins.R;
			cachedPage.margin_bottom = margins.B;
		}
		else
		{
			cachedPage.margin_left   = 0;
			cachedPage.margin_top    = 0;
			cachedPage.margin_right  = this.m_oLogicDocument.Width;
			cachedPage.margin_bottom = this.m_oLogicDocument.Height;
		}

		this.m_oHorRuler.CreateBackground(cachedPage, isattack);
	};
	this.CreateBackgroundVerRuler = function(margins, isattack)
	{
		var cachedPage       = {};
		cachedPage.width_mm  = this.m_oLogicDocument.Width;
		cachedPage.height_mm = this.m_oLogicDocument.Height;

		if (margins !== undefined)
		{
			cachedPage.margin_left   = margins.L;
			cachedPage.margin_top    = margins.T;
			cachedPage.margin_right  = margins.R;
			cachedPage.margin_bottom = margins.B;
		}
		else
		{
			cachedPage.margin_left   = 0;
			cachedPage.margin_top    = 0;
			cachedPage.margin_right  = this.m_oLogicDocument.Width;
			cachedPage.margin_bottom = this.m_oLogicDocument.Height;
		}

		this.m_oVerRuler.CreateBackground(cachedPage, isattack);
	};

	this.ThemeGenerateThumbnails = function(_master)
	{
		var _layouts = _master.sldLayoutLst;
		var _len     = _layouts.length;

		for (var i = 0; i < _len; i++)
		{
			_layouts[i].recalculate();

			_layouts[i].ImageBase64 = this.m_oLayoutDrawer.GetThumbnail(_layouts[i]);
			_layouts[i].Width64     = this.m_oLayoutDrawer.WidthPx;
			_layouts[i].Height64    = this.m_oLayoutDrawer.HeightPx;
		}
	};

	this.CheckLayouts = function(bIsAttack)
	{
        if(window["NATIVE_EDITOR_ENJINE"] === true){
            return;
        }
		var master = null;
		if (-1 == this.m_oDrawingDocument.SlideCurrent && 0 == this.m_oLogicDocument.slideMasters.length)
			return;

		if (-1 != this.m_oDrawingDocument.SlideCurrent)
			master = this.m_oLogicDocument.Slides[this.m_oDrawingDocument.SlideCurrent].Layout.Master;
		else
		{
			master = this.m_oLogicDocument.lastMaster;
			if(!master)
			{
				master = this.m_oLogicDocument.slideMasters[0];
			}
		}

		if (this.MasterLayouts != master || Math.abs(this.m_oLayoutDrawer.WidthMM - this.m_oLogicDocument.Width) > MOVE_DELTA || Math.abs(this.m_oLayoutDrawer.HeightMM - this.m_oLogicDocument.Height) > MOVE_DELTA || bIsAttack === true)
		{
			this.MasterLayouts = master;

			var _len = master.sldLayoutLst.length;
			var arr  = new Array(_len);

			var bRedraw = Math.abs(this.m_oLayoutDrawer.WidthMM - this.m_oLogicDocument.Width) > MOVE_DELTA || Math.abs(this.m_oLayoutDrawer.HeightMM - this.m_oLogicDocument.Height) > MOVE_DELTA;
			for (var i = 0; i < _len; i++)
			{
				arr[i]       = new CLayoutThumbnail();
				arr[i].Index = i;

				var __type = master.sldLayoutLst[i].type;
				if (__type !== undefined && __type != null)
					arr[i].Type = __type;

				arr[i].Name = master.sldLayoutLst[i].cSld.name;

				if ("" == master.sldLayoutLst[i].ImageBase64 || bRedraw)
				{
					this.m_oLayoutDrawer.WidthMM       = this.m_oLogicDocument.Width;
					this.m_oLayoutDrawer.HeightMM      = this.m_oLogicDocument.Height;
					master.sldLayoutLst[i].ImageBase64 = this.m_oLayoutDrawer.GetThumbnail(master.sldLayoutLst[i]);
					master.sldLayoutLst[i].Width64     = this.m_oLayoutDrawer.WidthPx;
					master.sldLayoutLst[i].Height64    = this.m_oLayoutDrawer.HeightPx;
				}

				arr[i].Image  = master.sldLayoutLst[i].ImageBase64;
				arr[i].Width  = master.sldLayoutLst[i].Width64;
				arr[i].Height = master.sldLayoutLst[i].Height64;
			}

			this.m_oApi.sendEvent("asc_onUpdateLayout", arr);
			this.m_oApi.sendEvent("asc_onUpdateThemeIndex", this.MasterLayouts.ThemeIndex);

			this.m_oApi.sendColorThemes(this.MasterLayouts.Theme);
		}

		this.m_oDrawingDocument.CheckGuiControlColors(bIsAttack);
	};

	this.GoToPage = function(lPageNum, isFromZoom, bIsAttack, isReporterUpdateSlide)
	{
		if (this.m_oApi.isReporterMode)
		{
			if (!this.DemonstrationManager.Mode)
			{
				// first run
				this.m_oApi.StartDemonstration("id_reporter_dem", 0);
				this.m_oApi.sendEvent("asc_onDemonstrationFirstRun");
				this.m_oApi.sendFromReporter("{ \"reporter_command\" : \"start_show\" }");
			}
			else if (true !== isReporterUpdateSlide)
			{
				this.m_oApi.DemonstrationGoToSlide(lPageNum);
			}
			//return;
		}

		if (this.DemonstrationManager.Mode && !isReporterUpdateSlide)
		{
            return this.m_oApi.DemonstrationGoToSlide(lPageNum);
		}

		var drDoc = this.m_oDrawingDocument;

		if (!this.m_oScrollVerApi)
		{
			// сборка файлов
			return;
		}

		var _old_empty = this.m_oDrawingDocument.IsEmptyPresentation;

		this.m_oDrawingDocument.IsEmptyPresentation = false;
		if (-1 == lPageNum)
		{
			this.m_oDrawingDocument.IsEmptyPresentation = true;

			if (this.IsSupportNotes && this.m_oNotesApi)
				this.m_oNotesApi.OnRecalculateNote(-1, 0, 0);
		}

		if (this.m_oDrawingDocument.TransitionSlide.IsPlaying())
			this.m_oDrawingDocument.TransitionSlide.End(true);

		if (lPageNum != -1 && (lPageNum < 0 || lPageNum >= drDoc.SlidesCount))
			return;

		this.Thumbnails.LockMainObjType = true;
		this.StartVerticalScroll        = false;
		this.m_oApi.sendEvent("asc_onEndPaintSlideNum");

		var _bIsUpdate = (drDoc.SlideCurrent != lPageNum);

		this.ZoomFreePageNum = lPageNum;
		drDoc.SlideCurrent   = lPageNum;
		var isRecalculateNote = this.m_oLogicDocument.Set_CurPage(lPageNum);
		if (bIsAttack && !isRecalculateNote)
		{
			var _curPage = this.m_oLogicDocument.CurPage;
			if (_curPage >= 0)
				this.m_oNotesApi.OnRecalculateNote(_curPage, this.m_oLogicDocument.Slides[_curPage].NotesWidth, this.m_oLogicDocument.Slides[_curPage].getNotesHeight());
		}

		// теперь пошлем все шаблоны первой темы
		this.CheckLayouts();

		this.SlideDrawer.CheckSlide(drDoc.SlideCurrent);

		if (true !== isFromZoom)
		{
			this.m_oLogicDocument.Document_UpdateInterfaceState();
		}

		this.CalculateDocumentSize(false);

		this.Thumbnails.SelectPage(lPageNum);

		this.CreateBackgroundHorRuler();
		this.CreateBackgroundVerRuler();

		this.m_bIsUpdateHorRuler = true;
		this.m_bIsUpdateVerRuler = true;

		this.OnCalculatePagesPlace();

		//this.m_oScrollVerApi.scrollTo(0, drDoc.SlideCurrent * this.m_dDocumentPageHeight);
		if (this.IsGoToPageMAXPosition)
		{
			if (this.SlideScrollMAX > this.m_dScrollY_max)
				this.SlideScrollMAX = this.m_dScrollY_max;

			this.m_oScrollVerApi.scrollToY(this.SlideScrollMAX);
			this.IsGoToPageMAXPosition = false;
		}
		else
		{
			//this.m_oScrollVerApi.scrollToY(this.SlideScrollMIN);
			if (this.m_dScrollY_Central > this.m_dScrollY_max)
				this.m_dScrollY_Central = this.m_dScrollY_max;

			this.m_oScrollVerApi.scrollToY(this.m_dScrollY_Central);
		}

		if (this.m_bIsHorScrollVisible)
		{
			if (this.m_dScrollX_Central > this.m_dScrollX_max)
				this.m_dScrollX_Central = this.m_dScrollX_max;

			this.m_oScrollHorApi.scrollToX(this.m_dScrollX_Central);
		}

		this.ZoomFreePageNum = -1;

		if (this.m_oApi.isViewMode === false && null != this.m_oLogicDocument)
		{
			//this.m_oLogicDocument.Set_CurPage( drDoc.SlideCurrent );
			//this.m_oLogicDocument.MoveCursorToXY(0, 0, false);
			this.m_oLogicDocument.RecalculateCurPos();

			this.m_oApi.sync_currentPageCallback(drDoc.SlideCurrent);
		}
		else
		{
			this.m_oApi.sync_currentPageCallback(drDoc.SlideCurrent);
		}

		this.m_oLogicDocument.Document_UpdateSelectionState();

		this.Thumbnails.LockMainObjType = false;

		if (this.m_oDrawingDocument.IsEmptyPresentation != _old_empty || _bIsUpdate || bIsAttack === true)
			this.OnScroll();
	};

	this.GetVerticalScrollTo = function(y)
	{
		var dKoef = g_dKoef_mm_to_pix * this.m_nZoomValue / 100;
		return 5 + y * dKoef;
	};

	this.GetHorizontalScrollTo = function(x)
	{
		var dKoef = g_dKoef_mm_to_pix * this.m_nZoomValue / 100;
		return 5 + dKoef * x;
	};

	this.SaveDocument = function(noBase64)
	{
		var writer = new AscCommon.CBinaryFileWriter();
		this.m_oLogicDocument.CalculateComments();
		if (noBase64) {
			return writer.WriteDocument3(this.m_oLogicDocument);;
		} else {
			var str = writer.WriteDocument(this.m_oLogicDocument);
			return str;
			//console.log(str);
		}
	};
	
	this.GetMainContentBounds = function()
	{
		return this.m_oMainParent.AbsolutePosition;
	};
}

//------------------------------------------------------------export----------------------------------------------------
window['AscCommon']                       = window['AscCommon'] || {};
window['AscCommonSlide']                  = window['AscCommonSlide'] || {};
window['AscCommonSlide'].GlobalSkinFlat   = GlobalSkinFlat;
window['AscCommonSlide'].GlobalSkinFlat2  = GlobalSkinFlat2;
window['AscCommonSlide'].GlobalSkin       = GlobalSkin;
window['AscCommonSlide'].updateGlobalSkin = updateGlobalSkin;
window['AscCommonSlide'].CEditorPage      = CEditorPage;

window['AscCommon'].Page_Width      = Page_Width;
window['AscCommon'].Page_Height     = Page_Height;
window['AscCommon'].X_Left_Margin   = X_Left_Margin;
window['AscCommon'].X_Right_Margin  = X_Right_Margin;
window['AscCommon'].Y_Bottom_Margin = Y_Bottom_Margin;
window['AscCommon'].Y_Top_Margin    = Y_Top_Margin;
