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
var global_MatrixTransformer = AscCommon.global_MatrixTransformer;
var g_dKoef_mm_to_pix = AscCommon.g_dKoef_mm_to_pix;

function CCacheSlideImage()
{
    this.Image = null;
    this.Color = { r: 0, g: 0, b: 0};
}

var __nextFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) { return setTimeout(callback, 25); };
})();

var __cancelFrame = (function () {
        return window.cancelAnimationFrame ||
            window.cancelRequestAnimationFrame ||
            window.webkitCancelAnimationFrame ||
            window.webkitCancelRequestAnimationFrame ||
            window.mozCancelRequestAnimationFrame ||
            window.oCancelRequestAnimationFrame ||
            window.msCancelRequestAnimationFrame ||
            clearTimeout;
})();

function CTransitionAnimation(htmlpage)
{
    this.HtmlPage = htmlpage;

    this.Type       = 0;
    this.Param      = 0;
    this.Duration   = 0;

    this.StartTime  = 0;
    this.EndTime    = 0;
    this.CurrentTime = 0;

    this.CacheImage1 = new CCacheSlideImage();
    this.CacheImage2 = new CCacheSlideImage();

    this.Rect = new AscCommon._rect();
    this.Params = null;

    this.IsBackward = false;
    this.DemonstrationObject = null;

    this.TimerId = null;
    var oThis = this;

    this.CalculateRect = function()
    {
        // эта функция определяет, где находится рект для перехода

        var _page = this.HtmlPage;

        var w = _page.m_oEditor.HtmlElement.width;
        var _px_h = _page.m_oEditor.HtmlElement.height;
        if (this.HtmlPage.bIsRetinaSupport)
        {
            w /= AscCommon.AscBrowser.retinaPixelRatio;
            _px_h /= AscCommon.AscBrowser.retinaPixelRatio;
        }

        var h = (((_page.m_oBody.AbsolutePosition.B - _page.m_oBody.AbsolutePosition.T) -
            (_page.m_oTopRuler.AbsolutePosition.B - _page.m_oTopRuler.AbsolutePosition.T)) * g_dKoef_mm_to_pix) >> 0;

        var _pageWidth = _page.m_oLogicDocument.Width * g_dKoef_mm_to_pix;
        var _pageHeight = _page.m_oLogicDocument.Height * g_dKoef_mm_to_pix;

        var _hor_Zoom = 100;
        if (0 != _pageWidth)
            _hor_Zoom = (100 * (w - 2 * _page.SlideDrawer.CONST_BORDER)) / _pageWidth;
        var _ver_Zoom = 100;
        if (0 != _pageHeight)
            _ver_Zoom = (100 * (h - 2 * _page.SlideDrawer.CONST_BORDER)) / _pageHeight;

        var _new_value = (Math.min(_hor_Zoom, _ver_Zoom) - 0.5) >> 0;

        if (_new_value < 5)
            _new_value = 5;

        var dKoef = (_new_value * g_dKoef_mm_to_pix / 100);

        var _slideW = (dKoef * _page.m_oLogicDocument.Width) >> 0;
        var _slideH = (dKoef * _page.m_oLogicDocument.Height) >> 0;

        var _centerX = (w / 2) >> 0;
        var _centerSlideX = (dKoef * _page.m_oLogicDocument.Width / 2) >> 0;
        var _hor_width_left = Math.min(0, _centerX - (_centerSlideX) - _page.SlideDrawer.CONST_BORDER);
        var _hor_width_right = Math.max(w - 1, _centerX + (_slideW - _centerSlideX) + _page.SlideDrawer.CONST_BORDER);

        var _centerY = (_px_h / 2) >> 0;
        var _centerSlideY = (dKoef * _page.m_oLogicDocument.Height / 2) >> 0;
        var _ver_height_top = Math.min(0, _centerY - _centerSlideY - _page.SlideDrawer.CONST_BORDER);
        var _ver_height_bottom = Math.max(_px_h - 1, _centerX + (_slideH - _centerSlideY) + _page.SlideDrawer.CONST_BORDER);

        this.Rect.x = _centerX - _centerSlideX - _hor_width_left;
        this.Rect.y = _centerY - _centerSlideY - _ver_height_top;
        this.Rect.w = _slideW;
        this.Rect.h = _slideH;
    }

    this.CalculateRectDemonstration = function()
    {
        var _width = this.HtmlPage.DemonstrationManager.Canvas.width;
        var _height = this.HtmlPage.DemonstrationManager.Canvas.height;

        var _w_mm = this.HtmlPage.m_oLogicDocument.Width;
        var _h_mm = this.HtmlPage.m_oLogicDocument.Height;

        // проверим аспект
        var aspectDisplay = _width / _height;
        var aspectPres = _w_mm / _h_mm;

        var _l = 0;
        var _t = 0;
        var _w = 0;
        var _h = 0;

        if (aspectPres > aspectDisplay)
        {
            _w = _width;
            _h = _w / aspectPres;
            _l = 0;
            _t = (_height - _h) >> 1;
        }
        else
        {
            _h = _height;
            _w = _h * aspectPres;
            _t = 0;
            _l = (_width - _w) >> 1;
        }

        this.Rect.x = _l >> 0;
        this.Rect.y = _t >> 0;
        this.Rect.w = _w >> 0;
        this.Rect.h = _h >> 0;
    }

    this.SetBaseTransform = function()
    {
        if (this.DemonstrationObject == null)
        {
            var ctx1 = this.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
            if (this.HtmlPage.bIsRetinaSupport)
                ctx1.setTransform(AscCommon.AscBrowser.retinaPixelRatio, 0, 0, AscCommon.AscBrowser.retinaPixelRatio, 0, 0);
            else
                ctx1.setTransform(1, 0, 0, 1, 0, 0);

            this.HtmlPage.m_oOverlayApi.SetBaseTransform();
        }
        else
        {
            var _ctx1 = oThis.DemonstrationObject.Canvas.getContext('2d');
            _ctx1.setTransform(1, 0, 0, 1, 0, 0);

            var _ctx2 = oThis.DemonstrationObject.Overlay.getContext('2d');
            _ctx2.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    this.DrawImage1 = function(slide_num, _not_use_prev)
    {
        if (undefined === slide_num)
        {
            if (null == this.DemonstrationObject)
            {
                slide_num = this.HtmlPage.m_oDrawingDocument.SlideCurrent;
                if (slide_num >= this.HtmlPage.m_oDrawingDocument.SlidesCount)
                    slide_num = this.HtmlPage.m_oDrawingDocument.SlidesCount - 1;
            }
            else
            {
                slide_num = this.DemonstrationObject.SlideNum;
                if (slide_num >= this.HtmlPage.m_oDrawingDocument.SlidesCount)
                    slide_num = this.HtmlPage.m_oDrawingDocument.SlidesCount - 1;
            }
        }

        if (slide_num > 0 && (_not_use_prev !== true))
        {
            var _w = this.Rect.w;
            var _h = this.Rect.h;
            var _w_mm = this.HtmlPage.m_oLogicDocument.Width;
            var _h_mm = this.HtmlPage.m_oLogicDocument.Height;

            this.CacheImage1.Image = this.CreateImage(_w, _h);

            var g = new AscCommon.CGraphics();
            g.init(this.CacheImage1.Image.getContext('2d'), _w, _h, _w_mm, _h_mm);
            g.m_oFontManager = AscCommon.g_fontManager;

            g.transform(1,0,0,1,0,0);
            g.IsNoDrawingEmptyPlaceholder = true;

            if (this.HtmlPage.DemonstrationManager.Mode)
                g.IsDemonstrationMode = true;

            this.HtmlPage.m_oLogicDocument.DrawPage(slide_num - 1, g);
        }
    }

    this.DrawImage2 = function(slide_num)
    {
        if (undefined === slide_num)
        {
            if (null == this.DemonstrationObject)
            {
                slide_num = this.HtmlPage.m_oDrawingDocument.SlideCurrent;
                if (slide_num >= this.HtmlPage.m_oDrawingDocument.SlidesCount)
                    slide_num = this.HtmlPage.m_oDrawingDocument.SlidesCount - 1;
            }
            else
            {
                slide_num = this.DemonstrationObject.SlideNum;
                if (slide_num >= this.HtmlPage.m_oDrawingDocument.SlidesCount)
                    slide_num = this.HtmlPage.m_oDrawingDocument.SlidesCount - 1;
            }
        }

        if (slide_num >= 0)
        {
            var _w = this.Rect.w;
            var _h = this.Rect.h;
            var _w_mm = this.HtmlPage.m_oLogicDocument.Width;
            var _h_mm = this.HtmlPage.m_oLogicDocument.Height;

            this.CacheImage2.Image = this.CreateImage(_w, _h);

            var g = new AscCommon.CGraphics();
            g.init(this.CacheImage2.Image.getContext('2d'), _w, _h, _w_mm, _h_mm);
            g.m_oFontManager = AscCommon.g_fontManager;

            g.transform(1,0,0,1,0,0);
            g.IsNoDrawingEmptyPlaceholder = true;

            if (this.HtmlPage.DemonstrationManager.Mode)
                g.IsDemonstrationMode = true;

            this.HtmlPage.m_oLogicDocument.DrawPage(slide_num, g);
        }
    }

    this.StopIfPlaying = function()
    {
        if (this.IsPlaying())
        {
            __cancelFrame(this.TimerId);
            this.TimerId = null;
        }
    }

    this.Start = function(isButtonPreview)
    {
        this.StopIfPlaying();

        if (true == isButtonPreview)
        {
            this.CalculateRect();

            var _currentSlide = 0;
            if (null == this.DemonstrationObject)
            {
                _currentSlide = this.HtmlPage.m_oDrawingDocument.SlideCurrent;
                if (_currentSlide >= this.HtmlPage.m_oDrawingDocument.SlidesCount)
                    _currentSlide = this.HtmlPage.m_oDrawingDocument.SlidesCount - 1;
            }
            else
            {
                _currentSlide = this.GetPrevVisibleSlide(true);
            }

            this.DrawImage1(_currentSlide, false);
            this.DrawImage2(_currentSlide);
        }

        this.StartTime = new Date().getTime();
        this.EndTime = this.StartTime + this.Duration;

        if (this.HtmlPage.bIsRetinaSupport)
        {
            var ctx1 = oThis.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
            ctx1.setTransform(AscCommon.AscBrowser.retinaPixelRatio, 0, 0, AscCommon.AscBrowser.retinaPixelRatio, 0, 0);
        }

        switch (this.Type)
        {
            case c_oAscSlideTransitionTypes.Fade:
            {
                this._startFade();
                break;
            }
            case c_oAscSlideTransitionTypes.Push:
            {
                this._startPush();
                break;
            }
            case c_oAscSlideTransitionTypes.Wipe:
            {
                this._startWipe();
                break;
            }
            case c_oAscSlideTransitionTypes.Split:
            {
                this._startSplit();
                break;
            }
            case c_oAscSlideTransitionTypes.UnCover:
            {
                this._startUnCover();
                break;
            }
            case c_oAscSlideTransitionTypes.Cover:
            {
                this._startCover();
                break;
            }
            case c_oAscSlideTransitionTypes.Clock:
            {
                this._startClock();
                break;
            }
            case c_oAscSlideTransitionTypes.Zoom:
            {
                this._startZoom();
                break;
            }
            default:
            {
                this.End(true);
                break;
            }
        }
    }

    this.End = function(bIsAttack)
    {
        if (bIsAttack === true && null != this.TimerId)
            __cancelFrame(this.TimerId);

        this.TimerId = null;
        this.Params = null;

        if (this.DemonstrationObject != null)
        {
            this.DemonstrationObject.OnEndTransition(bIsAttack);

            this.CacheImage1.Image = null;
            this.CacheImage2.Image = null;
            return;
        }

        this.CacheImage1.Image = null;
        this.CacheImage2.Image = null;

        var ctx1 = this.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
        ctx1.setTransform(1, 0, 0, 1, 0, 0);

        this.HtmlPage.OnScroll();
    }

    this.IsPlaying = function()
    {
        return (null != this.TimerId) ? true : false;
    }

    this.CreateImage = function(w, h)
    {
        var _im = document.createElement('canvas');
        _im.width = w;
        _im.height = h;
        return _im;
    }

    // animations
    this._startFade = function()
    {
        oThis.CurrentTime = new Date().getTime();

        if (oThis.CurrentTime >= oThis.EndTime)
        {
            oThis.End(false);
            return;
        }

        oThis.SetBaseTransform();

        if (oThis.TimerId === null)
        {
            oThis.Params = { IsFirstAfterHalf : true };

            var _ctx1 = null;
            if (null == oThis.DemonstrationObject)
            {
                // отрисовываем на основной канве картинку первого слайда
                _ctx1 = oThis.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
                _ctx1.fillStyle = GlobalSkin.BackgroundColor;
                _ctx1.fillRect(0, 0, oThis.HtmlPage.m_oEditor.HtmlElement.width, oThis.HtmlPage.m_oEditor.HtmlElement.height);
            }
            else
            {
                _ctx1 = oThis.DemonstrationObject.Canvas.getContext('2d');
                _ctx1.fillStyle = "#000000";
                _ctx1.fillRect(0, 0, oThis.DemonstrationObject.Canvas.width, oThis.DemonstrationObject.Canvas.height);
            }

            if (!oThis.IsBackward)
            {
                if (null != oThis.CacheImage1.Image)
                {
                    _ctx1.drawImage(oThis.CacheImage1.Image, oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                }
                else
                {
                    var _c = oThis.CacheImage1.Color;
                    _ctx1.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                    _ctx1.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                    _ctx1.beginPath();
                }
            }
            else
            {
                _ctx1.fillStyle = "rgb(0,0,0)";
                _ctx1.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                _ctx1.beginPath();
            }
        }

        var _ctx2 = null;
        if (oThis.DemonstrationObject == null)
        {
            oThis.HtmlPage.m_oOverlayApi.Clear();
            oThis.HtmlPage.m_oOverlayApi.CheckRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);

            _ctx2 = oThis.HtmlPage.m_oOverlayApi.m_oContext;
        }
        else
        {
            _ctx2 = oThis.DemonstrationObject.Overlay.getContext('2d');
            _ctx2.clearRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
        }

        var _part = (oThis.CurrentTime - oThis.StartTime) / oThis.Duration;
        if (oThis.IsBackward)
            _part = 1 - _part;

        if (oThis.Param == c_oAscSlideTransitionParams.Fade_Smoothly)
        {
            _ctx2.globalAlpha = _part;

            if (null != oThis.CacheImage2.Image)
            {
                _ctx2.drawImage(oThis.CacheImage2.Image, oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
            }
            else
            {
                var _c = oThis.CacheImage2.Color;
                _ctx2.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                _ctx2.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                _ctx2.beginPath();
            }

            _ctx2.globalAlpha = 1;
        }
        else if (oThis.Param == c_oAscSlideTransitionParams.Fade_Through_Black)
        {
            if (!oThis.IsBackward)
            {
                if (oThis.Params.IsFirstAfterHalf)
                {
                    if (_part > 0.5)
                    {
                        var _ctx1 = null;
                        if (null == oThis.DemonstrationObject)
                        {
                            // отрисовываем на основной канве картинку первого слайда
                            _ctx1 = oThis.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
                        }
                        else
                        {
                            _ctx1 = oThis.DemonstrationObject.Canvas.getContext('2d');
                        }

                        _ctx1.fillStyle = "rgb(0,0,0)";
                        _ctx1.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                        _ctx1.beginPath();

                        oThis.Params.IsFirstAfterHalf = false;
                    }
                }

                if (oThis.Params.IsFirstAfterHalf)
                {
                    _ctx2.globalAlpha = (2 * _part);
                    _ctx2.fillStyle = "rgb(0,0,0)";
                    _ctx2.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                    _ctx2.beginPath();
                }
                else
                {
                    _ctx2.globalAlpha = (2 * (_part - 0.5));

                    if (null != oThis.CacheImage2.Image)
                    {
                        _ctx2.drawImage(oThis.CacheImage2.Image, oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                    }
                    else
                    {
                        var _c = oThis.CacheImage2.Color;
                        _ctx2.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                        _ctx2.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                        _ctx2.beginPath();
                    }
                }
            }
            else
            {
                if (oThis.Params.IsFirstAfterHalf)
                {
                    if (_part < 0.5)
                    {
                        var _ctx1 = null;
                        if (null == oThis.DemonstrationObject)
                        {
                            // отрисовываем на основной канве картинку первого слайда
                            _ctx1 = oThis.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
                        }
                        else
                        {
                            _ctx1 = oThis.DemonstrationObject.Canvas.getContext('2d');
                        }

                        if (null != oThis.CacheImage1.Image)
                        {
                            _ctx1.drawImage(oThis.CacheImage1.Image, oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                        }
                        else
                        {
                            var _c = oThis.CacheImage1.Color;
                            _ctx1.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                            _ctx1.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                            _ctx1.beginPath();
                        }

                        oThis.Params.IsFirstAfterHalf = false;
                    }
                }

                if (!oThis.Params.IsFirstAfterHalf)
                {
                    _ctx2.globalAlpha = (2 * _part);
                    _ctx2.fillStyle = "rgb(0,0,0)";
                    _ctx2.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                    _ctx2.beginPath();
                }
                else
                {
                    _ctx2.globalAlpha = (2 * (_part - 0.5));

                    if (null != oThis.CacheImage2.Image)
                    {
                        _ctx2.drawImage(oThis.CacheImage2.Image, oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                    }
                    else
                    {
                        var _c = oThis.CacheImage2.Color;
                        _ctx2.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                        _ctx2.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                        _ctx2.beginPath();
                    }
                }
            }

            _ctx2.globalAlpha = 1;
        }

        oThis.TimerId = __nextFrame(oThis._startFade);
    }

    this._startPush = function()
    {
        oThis.CurrentTime = new Date().getTime();

        if (oThis.CurrentTime >= oThis.EndTime)
        {
            oThis.End(false);
            return;
        }

        oThis.SetBaseTransform();

        var _xDst = oThis.Rect.x;
        var _yDst = oThis.Rect.y;
        var _wDst = oThis.Rect.w;
        var _hDst = oThis.Rect.h;

        if (oThis.TimerId === null)
        {
            oThis.Params = { IsFirstAfterHalf : true };

            if (null == oThis.DemonstrationObject)
            {
                // отрисовываем на основной канве картинку первого слайда
                var _ctx1 = oThis.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
                _ctx1.fillStyle = GlobalSkin.BackgroundColor;
                _ctx1.fillRect(0, 0, oThis.HtmlPage.m_oEditor.HtmlElement.width, oThis.HtmlPage.m_oEditor.HtmlElement.height);
            }
            else
            {
                var _ctx1 = oThis.DemonstrationObject.Canvas.getContext('2d');
                _ctx1.fillStyle = "#000000";
                _ctx1.fillRect(0, 0, oThis.DemonstrationObject.Canvas.width, oThis.DemonstrationObject.Canvas.height);
            }
        }

        var _xSrc = 0;
        var _ySrc = 0;

        var _xDstO = oThis.Rect.x;
        var _yDstO = oThis.Rect.y;
        var _wDstO = oThis.Rect.w;
        var _hDstO = oThis.Rect.h;

        var _xSrcO = 0;
        var _ySrcO = 0;

        var _part = (oThis.CurrentTime - oThis.StartTime) / oThis.Duration;
        if (oThis.IsBackward)
            _part = 1 - _part;

        var _offX = (_wDst * (1 - _part)) >> 0;
        var _offY = (_hDst * (1 - _part)) >> 0;

        switch (oThis.Param)
        {
            case c_oAscSlideTransitionParams.Param_Left:
            {
                _xSrc = _offX;
                _wDst -= _offX;

                _xDstO += _wDst;
                _wDstO -= _wDst;
                break;
            }
            case c_oAscSlideTransitionParams.Param_Right:
            {
                _xDst += _offX;
                _wDst -= _offX;

                _xSrcO = _wDst;
                _wDstO -= _wDst;
                break;
            }
            case c_oAscSlideTransitionParams.Param_Top:
            {
                _ySrc = _offY;
                _hDst -= _offY;

                _yDstO += _hDst;
                _hDstO -= _hDst;
                break;
            }
            case c_oAscSlideTransitionParams.Param_Bottom:
            {
                _yDst += _offY;
                _hDst -= _offY;

                _ySrcO = _hDst;
                _hDstO -= _hDst;
                break;
            }
            default:
                break;
        }

        var _ctx2 = null;

        if (null == oThis.DemonstrationObject)
        {
            oThis.HtmlPage.m_oOverlayApi.Clear();
            oThis.HtmlPage.m_oOverlayApi.CheckRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
            _ctx2 = oThis.HtmlPage.m_oOverlayApi.m_oContext;
        }
        else
        {
            _ctx2 = oThis.DemonstrationObject.Overlay.getContext('2d');
        }

        if (_wDstO > 0 && _hDstO > 0)
        {
            if (null != oThis.CacheImage1.Image)
            {
                _ctx2.drawImage(oThis.CacheImage1.Image, _xSrcO, _ySrcO, _wDstO, _hDstO, _xDstO, _yDstO, _wDstO, _hDstO);
            }
            else
            {
                var _c = oThis.CacheImage2.Color;
                _ctx2.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                _ctx2.fillRect(_xDstO, _yDstO, _wDstO, _hDstO);
                _ctx2.beginPath();
            }
        }

        if (_wDst > 0 && _hDst > 0)
        {
            if (null != oThis.CacheImage2.Image)
            {
                _ctx2.drawImage(oThis.CacheImage2.Image, _xSrc, _ySrc, _wDst, _hDst, _xDst, _yDst, _wDst, _hDst);
            }
            else
            {
                var _c = oThis.CacheImage2.Color;
                _ctx2.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                _ctx2.fillRect(_xDst, _yDst, _wDst, _hDst);
                _ctx2.beginPath();
            }
        }

        oThis.TimerId = __nextFrame(oThis._startPush);
    }

    this._startWipe = function()
    {
        oThis.CurrentTime = new Date().getTime();

        if (oThis.CurrentTime >= oThis.EndTime)
        {
            oThis.End(false);
            return;
        }

        oThis.SetBaseTransform();

        if (oThis.TimerId === null)
        {
            var _ctx1 = null;
            if (null == oThis.DemonstrationObject)
            {
                // отрисовываем на основной канве картинку первого слайда
                _ctx1 = oThis.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
                _ctx1.fillStyle = GlobalSkin.BackgroundColor;
                _ctx1.fillRect(0, 0, oThis.HtmlPage.m_oEditor.HtmlElement.width, oThis.HtmlPage.m_oEditor.HtmlElement.height);
            }
            else
            {
                _ctx1 = oThis.DemonstrationObject.Canvas.getContext('2d');
                _ctx1.fillStyle = "#000000";
                _ctx1.fillRect(0, 0, oThis.DemonstrationObject.Canvas.width, oThis.DemonstrationObject.Canvas.height);
            }

            if (null != oThis.CacheImage1.Image)
            {
                _ctx1.drawImage(oThis.CacheImage1.Image, oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
            }
            else
            {
                var _c = oThis.CacheImage1.Color;
                _ctx1.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                _ctx1.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                _ctx1.beginPath();
            }
        }

        var _xDst = oThis.Rect.x;
        var _yDst = oThis.Rect.y;
        var _wDst = oThis.Rect.w;
        var _hDst = oThis.Rect.h;

        var _part = (oThis.CurrentTime - oThis.StartTime) / oThis.Duration;
        if (oThis.IsBackward)
            _part = 1 - _part;

        var _ctx2 = null;
        if (oThis.DemonstrationObject == null)
        {
            oThis.HtmlPage.m_oOverlayApi.Clear();
            oThis.HtmlPage.m_oOverlayApi.CheckRect(_xDst, _yDst, _wDst, _hDst);

            _ctx2 = oThis.HtmlPage.m_oOverlayApi.m_oContext;
        }
        else
        {
            _ctx2 = oThis.DemonstrationObject.Overlay.getContext('2d');
            _ctx2.clearRect(_xDst, _yDst, _wDst, _hDst);
        }

        var _koefWipeLen = 1;

        switch (oThis.Param)
        {
            case c_oAscSlideTransitionParams.Param_Left:
            {
                if (null == oThis.TimerId)
                {
                    var _canvasTmp = document.createElement('canvas');
                    _canvasTmp.width = 256;
                    _canvasTmp.height = 1;
                    var _canvasTmpCtx = _canvasTmp.getContext('2d');
                    var _data = _canvasTmpCtx.createImageData(256, 1);
                    for (var i = 0; i < 256; i++)
                        _data.data[4 * i + 3] = 255 - i;
                    _canvasTmpCtx.putImageData(_data, 0, 0);

                    oThis.Params = { GradImage : _canvasTmp };
                }

                var _xPosStart = (_xDst - _koefWipeLen * _wDst) >> 0;
                var _xPos = (_xPosStart + (_part * (1 + _koefWipeLen) * _wDst)) >> 0;
                var _gradW = (_koefWipeLen * _wDst) >> 0;

                if (_xPos > _xDst)
                {
                    if ((_xPos + _gradW) > (_xDst + _wDst))
                    {
                        _ctx2.beginPath();
                        _ctx2.fillStyle = "#000000";
                        _ctx2.fillRect(_xDst, _yDst, _xPos - _xDst + 1, _hDst);
                        _ctx2.beginPath();

                        var _srcImageW = (256 * (_wDst - _xPos + _xDst) / _gradW) >> 0;
                        if (_srcImageW > 0 && (_wDst - _xPos + _xDst) > 0)
                            _ctx2.drawImage(oThis.Params.GradImage, 0, 0, _srcImageW, 1, _xPos, _yDst, _wDst - _xPos + _xDst, _hDst);
                    }
                    else
                    {
                        _ctx2.beginPath();
                        _ctx2.fillStyle = "#000000";
                        _ctx2.fillRect(_xDst, _yDst, _xPos - _xDst + 1, _hDst);
                        _ctx2.beginPath();

                        if (_gradW > 0)
                        {
                            _ctx2.drawImage(oThis.Params.GradImage, _xPos, _yDst, _gradW, _hDst);
                        }
                    }
                }
                else
                {
                    var _srcImageW = _xPos + _gradW - _xDst;
                    var _srcImageWW = 256 * (_xPos + _gradW - _xDst) / _gradW;

                    if (_srcImageW > 0 && _srcImageWW > 0)
                    {
                        _ctx2.drawImage(oThis.Params.GradImage, 256 - _srcImageWW, 0, _srcImageWW, 1, _xDst, _yDst, _srcImageW, _hDst);
                    }
                }
                break;
            }
            case c_oAscSlideTransitionParams.Param_Right:
            {
                if (null == oThis.TimerId)
                {
                    var _canvasTmp = document.createElement('canvas');
                    _canvasTmp.width = 256;
                    _canvasTmp.height = 1;
                    var _canvasTmpCtx = _canvasTmp.getContext('2d');
                    var _data = _canvasTmpCtx.createImageData(256, 1);
                    for (var i = 0; i < 256; i++)
                        _data.data[4 * i + 3] = i;
                    _canvasTmpCtx.putImageData(_data, 0, 0);

                    oThis.Params = { GradImage : _canvasTmp };
                }

                var _rDst = _xDst + _wDst;

                var _xPosStart = (_rDst + _koefWipeLen * _wDst) >> 0;
                var _xPos = (_xPosStart - (_part * (1 + _koefWipeLen) * _wDst)) >> 0;
                var _gradW = (_koefWipeLen * _wDst) >> 0;

                if (_xPos < _rDst)
                {
                    if ((_xPos - _gradW) < _xDst)
                    {
                        _ctx2.beginPath();
                        _ctx2.fillStyle = "#000000";
                        _ctx2.fillRect(_xPos, _yDst, _rDst - _xPos, _hDst);
                        _ctx2.beginPath();

                        var _srcImageW = (256 * (_xDst - _xPos + _gradW) / _gradW) >> 0;
                        if (_srcImageW > 0 && (_xPos - _xDst) > 0)
                            _ctx2.drawImage(oThis.Params.GradImage, _srcImageW, 0, 256 - _srcImageW, 1, _xDst, _yDst, _xPos - _xDst, _hDst);
                    }
                    else
                    {
                        _ctx2.beginPath();
                        _ctx2.fillStyle = "#000000";
                        _ctx2.fillRect(_xPos, _yDst, _rDst - _xPos + 1, _hDst);
                        _ctx2.beginPath();

                        if (_gradW > 0)
                        {
                            _ctx2.drawImage(oThis.Params.GradImage, _xPos - _gradW, _yDst, _gradW, _hDst);
                        }
                    }
                }
                else
                {
                    var _gradWW = _xPosStart - _xPos;
                    if (_gradWW > 0)
                    {
                         var _srcImageW = 256 * _gradWW / _gradW;

                         if (_srcImageW > 0 && (_rDst - _xPos + _gradW) > 0)
                         {
                             _ctx2.drawImage(oThis.Params.GradImage, 0, 0, _srcImageW, 1, _xPos - _gradW, _yDst, _rDst - _xPos + _gradW, _hDst);
                         }
                    }
                }
                break;
            }
            case c_oAscSlideTransitionParams.Param_Top:
            {
                if (null == oThis.TimerId)
                {
                    var _canvasTmp = document.createElement('canvas');
                    _canvasTmp.width = 1;
                    _canvasTmp.height = 256;
                    var _canvasTmpCtx = _canvasTmp.getContext('2d');
                    var _data = _canvasTmpCtx.createImageData(1, 256);
                    for (var i = 0; i < 256; i++)
                        _data.data[4 * i + 3] = 255 - i;
                    _canvasTmpCtx.putImageData(_data, 0, 0);

                    oThis.Params = { GradImage : _canvasTmp };
                }

                var _yPosStart = (_yDst - _koefWipeLen * _hDst) >> 0;
                var _yPos = (_yPosStart + (_part * (1 + _koefWipeLen) * _hDst)) >> 0;
                var _gradH = (_koefWipeLen * _hDst) >> 0;

                if (_yPos > _yDst)
                {
                    if ((_yPos + _gradH) > (_yDst + _hDst))
                    {
                        _ctx2.beginPath();
                        _ctx2.fillStyle = "#000000";
                        _ctx2.fillRect(_xDst, _yDst, _wDst, _yPos - _yDst + 1);
                        _ctx2.beginPath();

                        var _srcImageH = (256 * (_hDst - _yPos + _yDst) / _gradH) >> 0;
                        if (_srcImageH > 0 && (_hDst - _yPos + _yDst) > 0)
                            _ctx2.drawImage(oThis.Params.GradImage, 0, 0, 1, _srcImageH, _xDst, _yPos, _wDst, _hDst - _yPos + _yDst);
                    }
                    else
                    {
                        _ctx2.beginPath();
                        _ctx2.fillStyle = "#000000";
                        _ctx2.fillRect(_xDst, _yDst, _wDst, _yPos - _yDst + 1);
                        _ctx2.beginPath();

                        if (_gradH > 0)
                        {
                            _ctx2.drawImage(oThis.Params.GradImage, _xDst, _yPos, _wDst, _gradH);
                        }
                    }
                }
                else
                {
                    var _srcImageH = _yPos + _gradH - _yDst;
                    var _srcImageHH = 256 * (_yPos + _gradH - _yDst) / _gradH;

                    if (_srcImageH > 0 && _srcImageHH > 0)
                    {
                        _ctx2.drawImage(oThis.Params.GradImage, 0, 256 - _srcImageHH, 1, _srcImageHH, _xDst, _yDst, _wDst, _srcImageH);
                    }
                }
                break;
            }
            case c_oAscSlideTransitionParams.Param_Bottom:
            {
                if (null == oThis.TimerId)
                {
                    var _canvasTmp = document.createElement('canvas');
                    _canvasTmp.width = 1;
                    _canvasTmp.height = 256;
                    var _canvasTmpCtx = _canvasTmp.getContext('2d');
                    var _data = _canvasTmpCtx.createImageData(1, 256);
                    for (var i = 0; i < 256; i++)
                        _data.data[4 * i + 3] = i;
                    _canvasTmpCtx.putImageData(_data, 0, 0);

                    oThis.Params = { GradImage : _canvasTmp };
                }

                var _bDst = _yDst + _hDst;
                var _yPosStart = (_bDst + _koefWipeLen * _hDst) >> 0;
                var _yPos = (_yPosStart - (_part * (1 + _koefWipeLen) * _hDst)) >> 0;
                var _gradH = (_koefWipeLen * _hDst) >> 0;

                if (_yPos < _bDst)
                {
                    if ((_yPos - _gradH) < _yDst)
                    {
                        _ctx2.beginPath();
                        _ctx2.fillStyle = "#000000";
                        _ctx2.fillRect(_xDst, _yPos, _wDst, _bDst - _yPos);
                        _ctx2.beginPath();

                        var _srcImageH = (256 * (_yPos - _yDst) / _gradH) >> 0;
                        if (_srcImageH > 0 && (_yPos - _yDst) > 0)
                            _ctx2.drawImage(oThis.Params.GradImage, 0, 256 - _srcImageH, 1, _srcImageH, _xDst, _yDst, _wDst, _yPos - _yDst);
                    }
                    else
                    {
                        _ctx2.beginPath();
                        _ctx2.fillStyle = "#000000";
                        _ctx2.fillRect(_xDst, _yPos, _wDst, _bDst - _yPos);
                        _ctx2.beginPath();

                        if (_gradH > 0)
                        {
                            _ctx2.drawImage(oThis.Params.GradImage, _xDst, _yPos - _gradH, _wDst, _gradH);
                        }
                    }
                }
                else
                {
                    var _srcImageH = _bDst - (_yPos - _gradH);
                    var _srcImageHH = 256 * _srcImageH / _gradH;

                    if (_srcImageH > 0 && _srcImageHH > 0)
                    {
                        _ctx2.drawImage(oThis.Params.GradImage, 0, 0, 1, _srcImageHH, _xDst, _bDst - _srcImageH, _wDst, _srcImageH);
                    }
                }
                break;
            }
            case c_oAscSlideTransitionParams.Param_TopLeft:
            {
                if (null == oThis.TimerId)
                {
                    var _canvasTmp = document.createElement('canvas');
                    _canvasTmp.width = 256;
                    _canvasTmp.height = 1;
                    var _canvasTmpCtx = _canvasTmp.getContext('2d');
                    var _data = _canvasTmpCtx.createImageData(256, 1);
                    for (var i = 0; i < 256; i++)
                        _data.data[4 * i + 3] = 255 - i;
                    _canvasTmpCtx.putImageData(_data, 0, 0);

                    oThis.Params = { GradImage : _canvasTmp };
                }

                var _ang = Math.atan(_hDst / _wDst);
                var _sin = Math.sin(_ang);
                var _cos = Math.cos(_ang);

                var _hDstN2 = _wDst * _sin;
                var _hDstN = 2 * _hDstN2;
                var _wDstN = _wDst * _cos + _hDst * _sin;

                var _e_off_x = -_sin;
                var _e_off_y = -_cos;

                var _gradW = (_koefWipeLen * _hDstN) >> 0;

                var _cX = _xDst + _wDst / 2;
                var _cY = _yDst + _hDst / 2;
                var _cStartX = _cX + (_hDstN2 + _gradW / 2) * _e_off_x;
                var _cStartY = _cY + (_hDstN2 + _gradW / 2) * _e_off_y;

                var _cPosX = _cStartX - _e_off_x * _part * (_gradW + _hDstN);
                var _cPosY = _cStartY - _e_off_y * _part * (_gradW + _hDstN);

                _ctx2.save();
                _ctx2.beginPath();
                _ctx2.rect(_xDst, _yDst, _wDst, _hDst);
                _ctx2.clip();
                _ctx2.beginPath();

                _ctx2.translate(_cPosX, _cPosY);
                _ctx2.rotate(Math.PI/2 - _ang);

                // потом расчитать точнее!!!
                _ctx2.fillStyle = "#000000";
                _ctx2.fillRect(-_hDstN2 - _gradW, -_wDstN / 2, _gradW, _wDstN);
                _ctx2.beginPath();

                _ctx2.drawImage(oThis.Params.GradImage, -_hDstN2, -_wDstN / 2, _hDstN, _wDstN);

                _ctx2.restore();
                break;
            }
            case c_oAscSlideTransitionParams.Param_TopRight:
            {
                if (null == oThis.TimerId)
                {
                    var _canvasTmp = document.createElement('canvas');
                    _canvasTmp.width = 256;
                    _canvasTmp.height = 1;
                    var _canvasTmpCtx = _canvasTmp.getContext('2d');
                    var _data = _canvasTmpCtx.createImageData(256, 1);
                    for (var i = 0; i < 256; i++)
                        _data.data[4 * i + 3] = i;
                    _canvasTmpCtx.putImageData(_data, 0, 0);

                    oThis.Params = { GradImage : _canvasTmp };
                }

                var _ang = Math.atan(_hDst / _wDst);
                var _sin = Math.sin(_ang);
                var _cos = Math.cos(_ang);

                var _wDstN2 = _wDst * _sin;
                var _wDstN = 2 * _wDstN2;
                var _hDstN = _wDst * _cos + _hDst * _sin;

                var _e_off_x = _sin;
                var _e_off_y = -_cos;

                var _gradW = (_koefWipeLen * _wDstN) >> 0;

                var _cX = _xDst + _wDst / 2;
                var _cY = _yDst + _hDst / 2;
                var _cStartX = _cX + (_wDstN2 + _gradW / 2) * _e_off_x;
                var _cStartY = _cY + (_wDstN2 + _gradW / 2) * _e_off_y;

                var _cPosX = _cStartX - _e_off_x * _part * (_gradW + _wDstN);
                var _cPosY = _cStartY - _e_off_y * _part * (_gradW + _wDstN);

                _ctx2.save();
                _ctx2.beginPath();
                _ctx2.rect(_xDst, _yDst, _wDst, _hDst);
                _ctx2.clip();
                _ctx2.beginPath();

                _ctx2.translate(_cPosX, _cPosY);
                _ctx2.rotate(_ang - Math.PI / 2);

                // потом расчитать точнее!!!
                _ctx2.fillStyle = "#000000";
                _ctx2.fillRect(_wDstN2, -_hDstN / 2, _gradW, _hDstN);
                _ctx2.beginPath();

                _ctx2.drawImage(oThis.Params.GradImage, -_wDstN2, -_hDstN / 2, _wDstN, _hDstN);

                _ctx2.restore();
                break;
            }
            case c_oAscSlideTransitionParams.Param_BottomLeft:
            {
                if (null == oThis.TimerId)
                {
                    var _canvasTmp = document.createElement('canvas');
                    _canvasTmp.width = 256;
                    _canvasTmp.height = 1;
                    var _canvasTmpCtx = _canvasTmp.getContext('2d');
                    var _data = _canvasTmpCtx.createImageData(256, 1);
                    for (var i = 0; i < 256; i++)
                        _data.data[4 * i + 3] = 255 - i;
                    _canvasTmpCtx.putImageData(_data, 0, 0);

                    oThis.Params = { GradImage : _canvasTmp };
                }

                var _ang = Math.atan(_hDst / _wDst);
                var _sin = Math.sin(_ang);
                var _cos = Math.cos(_ang);

                var _wDstN2 = _wDst * _sin;
                var _wDstN = 2 * _wDstN2;
                var _hDstN = _wDst * _cos + _hDst * _sin;

                var _e_off_x = _sin;
                var _e_off_y = -_cos;

                var _gradW = (_koefWipeLen * _wDstN) >> 0;

                var _cX = _xDst + _wDst / 2;
                var _cY = _yDst + _hDst / 2;
                var _cStartX = _cX - (_wDstN2 + _gradW / 2) * _e_off_x;
                var _cStartY = _cY - (_wDstN2 + _gradW / 2) * _e_off_y;

                var _cPosX = _cStartX + _e_off_x * _part * (_gradW + _wDstN);
                var _cPosY = _cStartY + _e_off_y * _part * (_gradW + _wDstN);

                _ctx2.save();
                _ctx2.beginPath();
                _ctx2.rect(_xDst, _yDst, _wDst, _hDst);
                _ctx2.clip();
                _ctx2.beginPath();

                _ctx2.translate(_cPosX, _cPosY);
                _ctx2.rotate(_ang - Math.PI / 2);

                // потом расчитать точнее!!!
                _ctx2.fillStyle = "#000000";
                _ctx2.fillRect(-_wDstN2 - _gradW, -_hDstN / 2, _gradW, _hDstN);
                _ctx2.beginPath();

                _ctx2.drawImage(oThis.Params.GradImage, -_wDstN2, -_hDstN / 2, _wDstN, _hDstN);

                _ctx2.restore();
                break;
            }
            case c_oAscSlideTransitionParams.Param_BottomRight:
            {
                if (null == oThis.TimerId)
                {
                    var _canvasTmp = document.createElement('canvas');
                    _canvasTmp.width = 256;
                    _canvasTmp.height = 1;
                    var _canvasTmpCtx = _canvasTmp.getContext('2d');
                    var _data = _canvasTmpCtx.createImageData(256, 1);
                    for (var i = 0; i < 256; i++)
                        _data.data[4 * i + 3] = i;
                    _canvasTmpCtx.putImageData(_data, 0, 0);

                    oThis.Params = { GradImage : _canvasTmp };
                }

                var _ang = Math.atan(_hDst / _wDst);
                var _sin = Math.sin(_ang);
                var _cos = Math.cos(_ang);

                var _hDstN2 = _wDst * _sin;
                var _hDstN = 2 * _hDstN2;
                var _wDstN = _wDst * _cos + _hDst * _sin;

                var _e_off_x = _sin;
                var _e_off_y = _cos;

                var _gradW = (_koefWipeLen * _hDstN) >> 0;

                var _cX = _xDst + _wDst / 2;
                var _cY = _yDst + _hDst / 2;
                var _cStartX = _cX + (_hDstN2 + _gradW / 2) * _e_off_x;
                var _cStartY = _cY + (_hDstN2 + _gradW / 2) * _e_off_y;

                var _cPosX = _cStartX - _e_off_x * _part * (_gradW + _hDstN);
                var _cPosY = _cStartY - _e_off_y * _part * (_gradW + _hDstN);

                _ctx2.save();
                _ctx2.beginPath();
                _ctx2.rect(_xDst, _yDst, _wDst, _hDst);
                _ctx2.clip();
                _ctx2.beginPath();

                _ctx2.translate(_cPosX, _cPosY);
                _ctx2.rotate(Math.PI/2 - _ang);

                // потом расчитать точнее!!!
                _ctx2.fillStyle = "#000000";
                _ctx2.fillRect(_hDstN2, -_wDstN / 2, _gradW, _wDstN);
                _ctx2.beginPath();

                _ctx2.drawImage(oThis.Params.GradImage, -_hDstN2, -_wDstN / 2, _hDstN, _wDstN);

                _ctx2.restore();
                break;
            }
            default:
                break;
        }

        _ctx2.globalCompositeOperation = "source-atop";
        if (null != oThis.CacheImage2.Image)
        {
            _ctx2.drawImage(oThis.CacheImage2.Image, _xDst, _yDst, _wDst, _hDst);
        }
        else
        {
            var _c = oThis.CacheImage2.Color;
            _ctx2.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
            _ctx2.fillRect(_xDst, _yDst, _wDst, _hDst);
            _ctx2.beginPath();
        }

        _ctx2.globalCompositeOperation = "source-over";
        oThis.TimerId = __nextFrame(oThis._startWipe);
    }

    this._startSplit = function()
    {
        oThis.CurrentTime = new Date().getTime();

        if (oThis.CurrentTime >= oThis.EndTime)
        {
            oThis.End(false);
            return;
        }

        oThis.SetBaseTransform();

        var _xDst = oThis.Rect.x;
        var _yDst = oThis.Rect.y;
        var _wDst = oThis.Rect.w;
        var _hDst = oThis.Rect.h;

        var _part = (oThis.CurrentTime - oThis.StartTime) / oThis.Duration;
        if (oThis.IsBackward)
            _part = 1 - _part;

        var _ctx2 = null;
        if (oThis.DemonstrationObject == null)
        {
            oThis.HtmlPage.m_oOverlayApi.Clear();
            oThis.HtmlPage.m_oOverlayApi.CheckRect(_xDst, _yDst, _wDst, _hDst);

            _ctx2 = oThis.HtmlPage.m_oOverlayApi.m_oContext;
        }
        else
        {
            _ctx2 = oThis.DemonstrationObject.Overlay.getContext('2d');
            _ctx2.clearRect(_xDst, _yDst, _wDst, _hDst);
        }

        if (oThis.TimerId === null)
        {
            // отрисовываем на основной канве картинку первого слайда
            var _ctx1 = null;
            if (null == oThis.DemonstrationObject)
            {
                _ctx1 = oThis.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
                _ctx1.fillStyle = GlobalSkin.BackgroundColor;
                _ctx1.fillRect(0, 0, oThis.HtmlPage.m_oEditor.HtmlElement.width, oThis.HtmlPage.m_oEditor.HtmlElement.height);
            }
            else
            {
                _ctx1 = oThis.DemonstrationObject.Canvas.getContext('2d');
                _ctx1.fillStyle = "#000000";
                _ctx1.fillRect(0, 0, oThis.DemonstrationObject.Canvas.width, oThis.DemonstrationObject.Canvas.height);
            }
            if (null != oThis.CacheImage1.Image)
            {
                _ctx1.drawImage(oThis.CacheImage1.Image, oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
            }
            else
            {
                var _c = oThis.CacheImage1.Color;
                _ctx1.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                _ctx1.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                _ctx1.beginPath();
            }
        }

        var _koefWipeLen = 1;

        switch (oThis.Param)
        {
            case c_oAscSlideTransitionParams.Split_VerticalOut:
            {
                if (oThis.TimerId === null)
                {
                    var _canvasTmp = document.createElement('canvas');
                    var __w = 256 + 255;
                    _canvasTmp.width = __w;
                    _canvasTmp.height = 1;
                    var _canvasTmpCtx = _canvasTmp.getContext('2d');
                    var _data = _canvasTmpCtx.createImageData(_canvasTmp.width, 1);
                    for (var i = 0; i < 256; i++)
                        _data.data[4 * i + 3] = i;
                    for (var i = 256; i < __w; i++)
                        _data.data[4 * i + 3] = __w - i - 1;
                    _canvasTmpCtx.putImageData(_data, 0, 0);

                    oThis.Params = { GradImage : _canvasTmp };
                }

                var _cX = _xDst + _wDst / 2;

                if (_part <= 0.5)
                {
                    var _w = (_part * 2 * _wDst) >> 0;
                    var _w2 = _w >> 1;

                    if (_w > 0 && _w2 > 0)
                    {
                        _ctx2.beginPath();
                        _ctx2.fillStyle = "#000000";
                        _ctx2.fillRect(Math.max(_xDst, _cX - _w2 / 2 - 1), _yDst, Math.min(_w2 + 2, _wDst), _hDst);
                        _ctx2.beginPath();

                        var _w4 = _w2 >> 1;
                        var _x = _cX - _w2;
                        var _r = _cX + _w4;
                        _ctx2.drawImage(oThis.Params.GradImage, 0, 0, 255, 1, _x, _yDst, _w4, _hDst);
                        _ctx2.drawImage(oThis.Params.GradImage, 255, 0, 255, 1, _r, _yDst, _w4, _hDst);
                    }
                }
                else
                {
                    var _w = (_part * _wDst) >> 0;
                    var _w2 = _w >> 1;

                    _ctx2.beginPath();
                    _ctx2.fillStyle = "#000000";
                    _ctx2.fillRect(Math.max(_xDst, _cX - _w2 - 1), _yDst, Math.min(_w + 2, _wDst), _hDst);
                    _ctx2.beginPath();

                    var _gradWW = (_wDst - _w) >> 1;
                    var _gradW = (_wDst / 4) >> 0;

                    var _srcOff = 256 * _gradWW / _gradW;
                    if (_gradWW > 0)
                    {
                        //_ctx2.drawImage(oThis.Params.GradImage, 256 - _srcOff, 0, _srcOff, 1, _xDst, _yDst, _gradWW, _hDst);
                        //_ctx2.drawImage(oThis.Params.GradImage, 255, 0, _srcOff, 1, _cX + _w2, _yDst, _gradWW, _hDst);
                        _ctx2.drawImage(oThis.Params.GradImage, 0, 0, 255, 1, _xDst, _yDst, _gradWW, _hDst);
                        _ctx2.drawImage(oThis.Params.GradImage, 255, 0, 255, 1, _cX + _w2, _yDst, _gradWW, _hDst);
                    }
                }
                break;
            }
            case c_oAscSlideTransitionParams.Split_VerticalIn:
            {
                if (oThis.TimerId === null)
                {
                    var _canvasTmp = document.createElement('canvas');
                    var __w = 256 + 255;
                    _canvasTmp.width = __w;
                    _canvasTmp.height = 1;
                    var _canvasTmpCtx = _canvasTmp.getContext('2d');
                    var _data = _canvasTmpCtx.createImageData(_canvasTmp.width, 1);
                    for (var i = 0; i < 256; i++)
                        _data.data[4 * i + 3] = i;
                    for (var i = 256; i < __w; i++)
                        _data.data[4 * i + 3] = __w - i - 1;
                    _canvasTmpCtx.putImageData(_data, 0, 0);

                    oThis.Params = { GradImage : _canvasTmp };
                }

                var _cX = _xDst + _wDst / 2;

                if (_part <= 0.5)
                {
                    var _w = (_part * 2 * _wDst) >> 0;
                    var _w2 = _w >> 1;
                    var _w4 = _w2 >> 1;

                    if (_w4 > 0)
                    {
                        _ctx2.beginPath();
                        _ctx2.fillStyle = "#000000";

                        _ctx2.fillRect(_xDst, _yDst, _w4 + 1, _hDst);
                        _ctx2.beginPath();
                        _ctx2.fillRect(_xDst + _wDst - _w4 - 1, _yDst, _w4 + 1, _hDst);
                        _ctx2.beginPath();

                        var _x = _xDst + _w4;
                        var _r = _xDst + _wDst - _w2;
                        _ctx2.drawImage(oThis.Params.GradImage, 255, 0, 255, 1, _x, _yDst, _w4, _hDst);
                        _ctx2.drawImage(oThis.Params.GradImage, 0, 0, 255, 1, _r, _yDst, _w4, _hDst);
                    }
                }
                else
                {
                    var _w = (_part * _wDst) >> 0;
                    var _w2 = _w >> 1;

                    _ctx2.beginPath();
                    _ctx2.fillStyle = "#000000";

                    _ctx2.fillRect(_xDst, _yDst, _w2 + 1, _hDst);
                    _ctx2.beginPath();
                    _ctx2.fillRect(_xDst + _wDst - _w2 - 1, _yDst, _w2 + 1, _hDst);
                    _ctx2.beginPath();

                    var _gradWW = (_wDst - _w) >> 1;
                    var _gradW = (_wDst / 4) >> 0;

                    var _srcOff = 256 * _gradWW / _gradW;

                    if (_gradWW > 0)
                    {
                        _ctx2.drawImage(oThis.Params.GradImage, 255, 0, 255, 1, _xDst + _w2, _yDst, _gradWW, _hDst);
                        _ctx2.drawImage(oThis.Params.GradImage, 0, 0, 255, 1, _cX, _yDst, _gradWW, _hDst);
                    }
                }
                break;
            }
            case c_oAscSlideTransitionParams.Split_HorizontalOut:
            {
                if (oThis.TimerId === null)
                {
                    var _canvasTmp = document.createElement('canvas');
                    var __w = 256 + 255;
                    _canvasTmp.width = 1;
                    _canvasTmp.height = __w;
                    var _canvasTmpCtx = _canvasTmp.getContext('2d');
                    var _data = _canvasTmpCtx.createImageData(1, __w);
                    for (var i = 0; i < 256; i++)
                        _data.data[4 * i + 3] = i;
                    for (var i = 256; i < __w; i++)
                        _data.data[4 * i + 3] = __w - i - 1;
                    _canvasTmpCtx.putImageData(_data, 0, 0);

                    oThis.Params = { GradImage : _canvasTmp };
                }

                var _cY = _yDst + _hDst / 2;

                if (_part <= 0.5)
                {
                    var _h = (_part * 2 * _hDst) >> 0;
                    var _h2 = _h >> 1;

                    if (_h > 0 && _h2 > 0)
                    {
                        _ctx2.beginPath();
                        _ctx2.fillStyle = "#000000";
                        _ctx2.fillRect(_xDst, Math.max(_cY - _h2 / 2 - 1), _wDst, Math.min(_h2 + 2, _hDst));
                        _ctx2.beginPath();

                        var _h4 = _h2 >> 1;
                        var _y = _cY - _h2;
                        var _b = _cY + _h4;

                        _ctx2.drawImage(oThis.Params.GradImage, 0, 0, 1, 255, _xDst, _y, _wDst, _h4);
                        _ctx2.drawImage(oThis.Params.GradImage, 0, 255, 1, 255, _xDst, _b, _wDst, _h4);
                    }
                }
                else
                {
                    var _h = (_part * _hDst) >> 0;
                    var _h2 = _h >> 1;

                    _ctx2.beginPath();
                    _ctx2.fillStyle = "#000000";
                    _ctx2.fillRect(_xDst, Math.max(_yDst, _cY - _h2 - 1), _wDst, Math.min(_h + 2, _hDst));
                    _ctx2.beginPath();

                    var _gradHH = (_hDst - _h) >> 1;
                    var _gradH = (_hDst / 4) >> 0;

                    //var _srcOff = 256 * _gradHH / _gradH;
                    if (_gradHH > 0)
                    {
                        _ctx2.drawImage(oThis.Params.GradImage, 0, 0, 1, 255, _xDst, _yDst, _wDst, _gradHH);
                        _ctx2.drawImage(oThis.Params.GradImage, 0, 255, 1, 255, _xDst, _cY + _h2, _wDst, _gradHH);
                    }
                }
                break;
            }
            case c_oAscSlideTransitionParams.Split_HorizontalIn:
            {
                if (oThis.TimerId === null)
                {
                    var _canvasTmp = document.createElement('canvas');
                    var __w = 256 + 255;
                    _canvasTmp.width = 1;
                    _canvasTmp.height = __w;
                    var _canvasTmpCtx = _canvasTmp.getContext('2d');
                    var _data = _canvasTmpCtx.createImageData(1, __w);
                    for (var i = 0; i < 256; i++)
                        _data.data[4 * i + 3] = i;
                    for (var i = 256; i < __w; i++)
                        _data.data[4 * i + 3] = __w - i - 1;
                    _canvasTmpCtx.putImageData(_data, 0, 0);

                    oThis.Params = { GradImage : _canvasTmp };
                }

                var _cY = _yDst + _hDst / 2;

                if (_part <= 0.5)
                {
                    var _h = (_part * 2 * _hDst) >> 0;
                    var _h2 = _h >> 1;
                    var _h4 = _h2 >> 1;

                    if (_h4 > 0)
                    {
                        _ctx2.beginPath();
                        _ctx2.fillStyle = "#000000";

                        _ctx2.fillRect(_xDst, _yDst, _wDst, _h4 + 1);
                        _ctx2.beginPath();
                        _ctx2.fillRect(_xDst, _yDst + _hDst - _h4 - 1, _wDst, _h4 + 1);
                        _ctx2.beginPath();

                        var _y = _yDst + _h4;
                        var _b = _yDst + _hDst - _h2;
                        _ctx2.drawImage(oThis.Params.GradImage, 0, 255, 1, 255, _xDst, _y, _wDst, _h4);
                        _ctx2.drawImage(oThis.Params.GradImage, 0, 0, 1, 255, _xDst, _b, _wDst, _h4);
                    }
                }
                else
                {
                    var _h = (_part * _hDst) >> 0;
                    var _h2 = _h >> 1;

                    _ctx2.beginPath();
                    _ctx2.fillStyle = "#000000";

                    _ctx2.fillRect(_xDst, _yDst, _wDst, _h2 + 1);
                    _ctx2.beginPath();
                    _ctx2.fillRect(_xDst, _yDst + _hDst - _h2 - 1, _wDst, _h2 + 1);
                    _ctx2.beginPath();

                    var _gradHH = (_hDst - _h) >> 1;
                    var _gradH = (_hDst / 4) >> 0;

                    //var _srcOff = 256 * _gradHH / _gradH;
                    if (_gradHH > 0)
                    {
                        _ctx2.drawImage(oThis.Params.GradImage, 0, 255, 1, 255, _xDst, _yDst + _h2, _wDst, _gradHH);
                        _ctx2.drawImage(oThis.Params.GradImage, 0, 0, 1, 255, _xDst, _cY, _wDst, _gradHH);
                    }
                }
                break;
            }
            default:
                break;
        }

        _ctx2.globalCompositeOperation = "source-atop";
        if (null != oThis.CacheImage2.Image)
        {
            _ctx2.drawImage(oThis.CacheImage2.Image, _xDst, _yDst, _wDst, _hDst);
        }
        else
        {
            var _c = oThis.CacheImage2.Color;
            _ctx2.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
            _ctx2.fillRect(_xDst, _yDst, _wDst, _hDst);
            _ctx2.beginPath();
        }

        _ctx2.globalCompositeOperation = "source-over";
        oThis.TimerId = __nextFrame(oThis._startSplit);
    }

    this._startUnCover = function()
    {
        oThis.CurrentTime = new Date().getTime();

        if (oThis.CurrentTime >= oThis.EndTime)
        {
            oThis.End(false);
            return;
        }

        oThis.SetBaseTransform();

        if (oThis.TimerId === null)
        {
            var _ctx1 = null;
            if (null == oThis.DemonstrationObject)
            {
                // отрисовываем на основной канве картинку первого слайда
                _ctx1 = oThis.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
                _ctx1.fillStyle = GlobalSkin.BackgroundColor;
                _ctx1.fillRect(0, 0, oThis.HtmlPage.m_oEditor.HtmlElement.width, oThis.HtmlPage.m_oEditor.HtmlElement.height);
            }
            else
            {
                _ctx1 = oThis.DemonstrationObject.Canvas.getContext('2d');
                _ctx1.fillStyle = "#000000";
                _ctx1.fillRect(0, 0, oThis.DemonstrationObject.Canvas.width, oThis.DemonstrationObject.Canvas.height);
            }

            if (null != oThis.CacheImage2.Image)
            {
                _ctx1.drawImage(oThis.CacheImage2.Image, oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
            }
            else
            {
                var _c = oThis.CacheImage2.Color;
                _ctx1.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                _ctx1.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                _ctx1.beginPath();
            }
        }

        var _xDst = oThis.Rect.x;
        var _yDst = oThis.Rect.y;
        var _wDst = oThis.Rect.w;
        var _hDst = oThis.Rect.h;

        var _xSrc = 0;
        var _ySrc = 0;

        var _part = (oThis.CurrentTime - oThis.StartTime) / oThis.Duration;
        if (oThis.IsBackward)
            _part = 1 - _part;

        var _offX = (_wDst * _part) >> 0;
        var _offY = (_hDst * _part) >> 0;

        switch (oThis.Param)
        {
            case c_oAscSlideTransitionParams.Param_Left:
            {
                _xDst += _offX;
                _wDst -= _offX;
                break;
            }
            case c_oAscSlideTransitionParams.Param_Right:
            {
                _xSrc = _offX;
                _wDst -= _offX;
                break;
            }
            case c_oAscSlideTransitionParams.Param_Top:
            {
                _yDst += _offY;
                _hDst -= _offY;
                break;
            }
            case c_oAscSlideTransitionParams.Param_Bottom:
            {
                _ySrc = _offY;
                _hDst -= _offY;
                break;
            }
            case c_oAscSlideTransitionParams.Param_TopLeft:
            {
                _xDst += _offX;
                _yDst += _offY;
                _wDst -= _offX;
                _hDst -= _offY;
                break;
            }
            case c_oAscSlideTransitionParams.Param_TopRight:
            {
                _xSrc = _offX;
                _yDst += _offY;
                _wDst -= _offX;
                _hDst -= _offY;
                break;
            }
            case c_oAscSlideTransitionParams.Param_BottomLeft:
            {
                _xDst += _offX;
                _ySrc = _offY;
                _wDst -= _offX;
                _hDst -= _offY;
                break;
            }
            case c_oAscSlideTransitionParams.Param_BottomRight:
            {
                _xSrc = _offX;
                _ySrc = _offY;
                _wDst -= _offX;
                _hDst -= _offY;
                break;
            }
            default:
                break;
        }

        var _ctx2 = null;
        if (oThis.DemonstrationObject == null)
        {
            oThis.HtmlPage.m_oOverlayApi.Clear();
            oThis.HtmlPage.m_oOverlayApi.CheckRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);

            _ctx2 = oThis.HtmlPage.m_oOverlayApi.m_oContext;
        }
        else
        {
            _ctx2 = oThis.DemonstrationObject.Overlay.getContext('2d');
            _ctx2.clearRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
        }

        if (_wDst > 0 && _hDst > 0)
        {
            if (null != oThis.CacheImage1.Image)
            {
                _ctx2.drawImage(oThis.CacheImage1.Image, _xSrc, _ySrc, _wDst, _hDst, _xDst, _yDst, _wDst, _hDst);
            }
            else
            {
                var _c = oThis.CacheImage1.Color;
                _ctx2.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                _ctx2.fillRect(_xDst, _yDst, _wDst, _hDst);
                _ctx2.beginPath();
            }
        }

        oThis.TimerId = __nextFrame(oThis._startUnCover);
    }

    this._startCover = function()
    {
        oThis.CurrentTime = new Date().getTime();

        if (oThis.CurrentTime >= oThis.EndTime)
        {
            oThis.End(false);
            return;
        }

        oThis.SetBaseTransform();

        if (oThis.TimerId === null)
        {
            var _ctx1 = null;
            if (null == oThis.DemonstrationObject)
            {
                // отрисовываем на основной канве картинку первого слайда
                _ctx1 = oThis.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
                _ctx1.fillStyle = GlobalSkin.BackgroundColor;
                _ctx1.fillRect(0, 0, oThis.HtmlPage.m_oEditor.HtmlElement.width, oThis.HtmlPage.m_oEditor.HtmlElement.height);
            }
            else
            {
                _ctx1 = oThis.DemonstrationObject.Canvas.getContext('2d');
                _ctx1.fillStyle = "#000000";
                _ctx1.fillRect(0, 0, oThis.DemonstrationObject.Canvas.width, oThis.DemonstrationObject.Canvas.height);
            }

            if (null != oThis.CacheImage1.Image)
            {
                _ctx1.drawImage(oThis.CacheImage1.Image, oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
            }
            else
            {
                var _c = oThis.CacheImage1.Color;
                _ctx1.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                _ctx1.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                _ctx1.beginPath();
            }
        }

        var _xDst = oThis.Rect.x;
        var _yDst = oThis.Rect.y;
        var _wDst = oThis.Rect.w;
        var _hDst = oThis.Rect.h;

        var _xSrc = 0;
        var _ySrc = 0;

        var _part = (oThis.CurrentTime - oThis.StartTime) / oThis.Duration;
        if (oThis.IsBackward)
            _part = 1 - _part;

        var _offX = (_wDst * (1 - _part)) >> 0;
        var _offY = (_hDst * (1 - _part)) >> 0;

        switch (oThis.Param)
        {
            case c_oAscSlideTransitionParams.Param_Left:
            {
                _xSrc = _offX;
                _wDst -= _offX;
                break;
            }
            case c_oAscSlideTransitionParams.Param_Right:
            {
                _xDst += _offX;
                _wDst -= _offX;
                break;
            }
            case c_oAscSlideTransitionParams.Param_Top:
            {
                _ySrc = _offY;
                _hDst -= _offY;
                break;
            }
            case c_oAscSlideTransitionParams.Param_Bottom:
            {
                _yDst += _offY;
                _hDst -= _offY;
                break;
            }
            case c_oAscSlideTransitionParams.Param_TopLeft:
            {
                _xSrc = _offX;
                _ySrc = _offY;
                _wDst -= _offX;
                _hDst -= _offY;
                break;
            }
            case c_oAscSlideTransitionParams.Param_TopRight:
            {
                _xDst += _offX;
                _ySrc = _offY;
                _wDst -= _offX;
                _hDst -= _offY;
                break;
            }
            case c_oAscSlideTransitionParams.Param_BottomLeft:
            {
                _xSrc = _offX;
                _yDst += _offY;
                _wDst -= _offX;
                _hDst -= _offY;
                break;
            }
            case c_oAscSlideTransitionParams.Param_BottomRight:
            {
                _xDst += _offX;
                _yDst += _offY;
                _wDst -= _offX;
                _hDst -= _offY;
                break;
            }
            default:
                break;
        }

        var _ctx2 = null;
        if (oThis.DemonstrationObject == null)
        {
            oThis.HtmlPage.m_oOverlayApi.Clear();
            oThis.HtmlPage.m_oOverlayApi.CheckRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);

            _ctx2 = oThis.HtmlPage.m_oOverlayApi.m_oContext;
        }
        else
        {
            _ctx2 = oThis.DemonstrationObject.Overlay.getContext('2d');
            _ctx2.clearRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
        }

        if (_wDst > 0 && _hDst > 0)
        {
            if (null != oThis.CacheImage2.Image)
            {
                _ctx2.drawImage(oThis.CacheImage2.Image, _xSrc, _ySrc, _wDst, _hDst, _xDst, _yDst, _wDst, _hDst);
            }
            else
            {
                var _c = oThis.CacheImage2.Color;
                _ctx2.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                _ctx2.fillRect(_xDst, _yDst, _wDst, _hDst);
                _ctx2.beginPath();
            }
        }

        oThis.TimerId = __nextFrame(oThis._startCover);
    }

    this._startClock = function()
    {
        oThis.CurrentTime = new Date().getTime();

        if (oThis.CurrentTime >= oThis.EndTime)
        {
            oThis.End(false);
            return;
        }

        oThis.SetBaseTransform();

        if (oThis.TimerId === null)
        {
            var _ctx1 = null;
            if (null == oThis.DemonstrationObject)
            {
                // отрисовываем на основной канве картинку первого слайда
                _ctx1 = oThis.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
                _ctx1.fillStyle = GlobalSkin.BackgroundColor;
                _ctx1.fillRect(0, 0, oThis.HtmlPage.m_oEditor.HtmlElement.width, oThis.HtmlPage.m_oEditor.HtmlElement.height);
            }
            else
            {
                _ctx1 = oThis.DemonstrationObject.Canvas.getContext('2d');
                _ctx1.fillStyle = "#000000";
                _ctx1.fillRect(0, 0, oThis.DemonstrationObject.Canvas.width, oThis.DemonstrationObject.Canvas.height);
            }

            if (null != oThis.CacheImage1.Image)
            {
                _ctx1.drawImage(oThis.CacheImage1.Image, oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
            }
            else
            {
                var _c = oThis.CacheImage1.Color;
                _ctx1.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                _ctx1.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                _ctx1.beginPath();
            }
        }

        var _xDst = oThis.Rect.x;
        var _yDst = oThis.Rect.y;
        var _wDst = oThis.Rect.w;
        var _hDst = oThis.Rect.h;

        var _part = (oThis.CurrentTime - oThis.StartTime) / oThis.Duration;
        if (oThis.IsBackward)
            _part = 1 - _part;

        var _anglePart1 = Math.atan(_wDst / _hDst);
        var _anglePart2 = Math.PI / 2 - _anglePart1;
        var _offset = 0;

        var _ctx2 = null;
        if (oThis.DemonstrationObject == null)
        {
            oThis.HtmlPage.m_oOverlayApi.Clear();
            oThis.HtmlPage.m_oOverlayApi.CheckRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);

            _ctx2 = oThis.HtmlPage.m_oOverlayApi.m_oContext;
        }
        else
        {
            _ctx2 = oThis.DemonstrationObject.Overlay.getContext('2d');
            _ctx2.clearRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
        }

        _ctx2.save();
        _ctx2.beginPath();

        var _cX = _xDst + _wDst / 2;
        var _cY = _yDst + _hDst / 2;

        switch (oThis.Param)
        {
            case c_oAscSlideTransitionParams.Clock_Clockwise:
            {
                var _angle = 2 * Math.PI * _part;
                var _x = 0;
                var _y = 0;

                var _mainPart = (2 * _angle / Math.PI) >> 0;
                var _nomainPart = _angle - (_mainPart * Math.PI / 2);

                switch (_mainPart)
                {
                    case 0:
                    {
                        if (_nomainPart > _anglePart1)
                        {
                            _offset = _wDst * Math.tan((Math.PI / 2) - _nomainPart) / 2;

                            _x = _xDst + _wDst;
                            _y = _cY - _offset;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_x, _yDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }
                        else
                        {
                            _offset = _hDst * Math.tan(_nomainPart) / 2;

                            _x = _cX + _offset;
                            _y = _yDst;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }

                        break;
                    }
                    case 1:
                    {
                        if (_nomainPart > _anglePart2)
                        {
                            _offset = _hDst * Math.tan((Math.PI / 2) - _nomainPart) / 2;

                            _x = _cX + _offset;
                            _y = _yDst + _hDst;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst + _hDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }
                        else
                        {
                            _offset = _wDst * Math.tan(_nomainPart) / 2;

                            _x = _xDst + _wDst;
                            _y = _cY + _offset;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_x, _yDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }

                        break;
                    }
                    case 2:
                    {
                        if (_nomainPart > _anglePart1)
                        {
                            _offset = _wDst * Math.tan((Math.PI / 2) - _nomainPart) / 2;

                            _x = _xDst;
                            _y = _cY + _offset;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst + _hDst);
                            _ctx2.lineTo(_xDst, _yDst + _hDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }
                        else
                        {
                            _offset = _hDst * Math.tan(_nomainPart) / 2;

                            _x = _cX - _offset;
                            _y = _yDst + _hDst;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst + _hDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }

                        break;
                    }
                    case 3:
                    {
                        if (_nomainPart > _anglePart2)
                        {
                            _offset = _hDst * Math.tan((Math.PI / 2) - _nomainPart) / 2;

                            _x = _cX - _offset;
                            _y = _yDst;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst + _hDst);
                            _ctx2.lineTo(_xDst, _yDst + _hDst);
                            _ctx2.lineTo(_xDst, _yDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }
                        else
                        {
                            _offset = _wDst * Math.tan(_nomainPart) / 2;

                            _x = _xDst;
                            _y = _cY - _offset;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst + _hDst);
                            _ctx2.lineTo(_xDst, _yDst + _hDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }

                        break;
                    }
                }
                break;
            }
            case c_oAscSlideTransitionParams.Clock_Counterclockwise:
            {
                var _angle = 2 * Math.PI * _part;
                var _x = 0;
                var _y = 0;

                var _mainPart = (2 * _angle / Math.PI) >> 0;
                var _nomainPart = _angle - (_mainPart * Math.PI / 2);

                switch (_mainPart)
                {
                    case 0:
                    {
                        if (_nomainPart > _anglePart1)
                        {
                            _offset = _wDst * Math.tan((Math.PI / 2) - _nomainPart) / 2;

                            _x = _xDst;
                            _y = _cY - _offset;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_x, _yDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }
                        else
                        {
                            _offset = _hDst * Math.tan(_nomainPart) / 2;

                            _x = _cX - _offset;
                            _y = _yDst;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }

                        break;
                    }
                    case 1:
                    {
                        if (_nomainPart > _anglePart2)
                        {
                            _offset = _hDst * Math.tan((Math.PI / 2) - _nomainPart) / 2;

                            _x = _cX - _offset;
                            _y = _yDst + _hDst;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_xDst, _yDst);
                            _ctx2.lineTo(_xDst, _yDst + _hDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }
                        else
                        {
                            _offset = _wDst * Math.tan(_nomainPart) / 2;

                            _x = _xDst;
                            _y = _cY + _offset;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_x, _yDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }

                        break;
                    }
                    case 2:
                    {
                        if (_nomainPart > _anglePart1)
                        {
                            _offset = _wDst * Math.tan((Math.PI / 2) - _nomainPart) / 2;

                            _x = _xDst + _wDst;
                            _y = _cY + _offset;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_xDst, _yDst);
                            _ctx2.lineTo(_xDst, _yDst + _hDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst + _hDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }
                        else
                        {
                            _offset = _hDst * Math.tan(_nomainPart) / 2;

                            _x = _cX + _offset;
                            _y = _yDst + _hDst;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_xDst, _yDst);
                            _ctx2.lineTo(_xDst, _yDst + _hDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }

                        break;
                    }
                    case 3:
                    {
                        if (_nomainPart > _anglePart2)
                        {
                            _offset = _hDst * Math.tan((Math.PI / 2) - _nomainPart) / 2;

                            _x = _cX + _offset;
                            _y = _yDst;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_xDst, _yDst);
                            _ctx2.lineTo(_xDst, _yDst + _hDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst + _hDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }
                        else
                        {
                            _offset = _wDst * Math.tan(_nomainPart) / 2;

                            _x = _xDst + _wDst;
                            _y = _cY - _offset;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX, _yDst);
                            _ctx2.lineTo(_xDst, _yDst);
                            _ctx2.lineTo(_xDst, _yDst + _hDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst + _hDst);
                            _ctx2.lineTo(_x, _y);
                            _ctx2.closePath();
                        }

                        break;
                    }
                }
                break;
            }
            case c_oAscSlideTransitionParams.Clock_Wedge:
            {
                var _angle = Math.PI * _part;
                var _x = 0;
                var _y = 0;

                var _mainPart = (2 * _angle / Math.PI) >> 0;
                var _nomainPart = _angle - (_mainPart * Math.PI / 2);

                switch (_mainPart)
                {
                    case 0:
                    {
                        if (_nomainPart > _anglePart1)
                        {
                            _offset = _wDst * Math.tan((Math.PI / 2) - _nomainPart) / 2;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_xDst, _cY - _offset);
                            _ctx2.lineTo(_xDst, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _cY - _offset);
                            _ctx2.closePath();
                        }
                        else
                        {
                            _offset = _hDst * Math.tan(_nomainPart) / 2;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX - _offset, _yDst);
                            _ctx2.lineTo(_cX + _offset, _yDst);
                            _ctx2.closePath();
                        }

                        break;
                    }
                    case 1:
                    {
                        if (_nomainPart > _anglePart2)
                        {
                            _offset = _hDst * Math.tan((Math.PI / 2) - _nomainPart) / 2;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_cX - _offset, _yDst + _hDst);
                            _ctx2.lineTo(_xDst, _yDst + _hDst);
                            _ctx2.lineTo(_xDst, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst + _hDst);
                            _ctx2.lineTo(_cX + _offset, _yDst + _hDst);
                            _ctx2.closePath();
                        }
                        else
                        {
                            _offset = _wDst * Math.tan(_nomainPart) / 2;

                            _ctx2.moveTo(_cX, _cY);
                            _ctx2.lineTo(_xDst, _cY + _offset);
                            _ctx2.lineTo(_xDst, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _yDst);
                            _ctx2.lineTo(_xDst + _wDst, _cY + _offset);
                        }

                        break;
                    }
                }
                break;
            }
            default:
                break;
        }

        _ctx2.clip();

        if (_wDst > 0 && _hDst > 0)
        {
            if (null != oThis.CacheImage2.Image)
            {
                _ctx2.drawImage(oThis.CacheImage2.Image, _xDst, _yDst, _wDst, _hDst);
            }
            else
            {
                var _c = oThis.CacheImage2.Color;
                _ctx2.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                _ctx2.fillRect(_xDst, _yDst, _wDst, _hDst);
                _ctx2.beginPath();
            }
        }

        _ctx2.restore();

        oThis.TimerId = __nextFrame(oThis._startClock);
    }

    this._startZoom = function()
    {
        oThis.CurrentTime = new Date().getTime();

        if (oThis.CurrentTime >= oThis.EndTime)
        {
            oThis.End(false);
            return;
        }

        oThis.SetBaseTransform();

        var _xDst = oThis.Rect.x;
        var _yDst = oThis.Rect.y;
        var _wDst = oThis.Rect.w;
        var _hDst = oThis.Rect.h;

        var _part = (oThis.CurrentTime - oThis.StartTime) / oThis.Duration;
        if (oThis.IsBackward)
            _part = 1 - _part;

        switch (oThis.Param)
        {
            case c_oAscSlideTransitionParams.Zoom_In:
            {
                var _ctx1 = null;
                if (null == oThis.DemonstrationObject)
                {
                    // отрисовываем на основной канве картинку первого слайда
                    _ctx1 = oThis.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
                    _ctx1.fillStyle = GlobalSkin.BackgroundColor;
                    _ctx1.fillRect(0, 0, oThis.HtmlPage.m_oEditor.HtmlElement.width, oThis.HtmlPage.m_oEditor.HtmlElement.height);
                }
                else
                {
                    _ctx1 = oThis.DemonstrationObject.Canvas.getContext('2d');
                    _ctx1.fillStyle = "#000000";
                    _ctx1.fillRect(0, 0, oThis.DemonstrationObject.Canvas.width, oThis.DemonstrationObject.Canvas.height);
                }


                var _w = ((0.5 * _wDst) * (1 + _part)) >> 0;
                var _h = ((0.5 * _hDst) * (1 + _part)) >> 0;
                var _x = (_wDst - _w) >> 1;
                var _y = (_hDst - _h) >> 1;

                var _x1 = (0.25 * _wDst - _x) >> 0;
                var _y1 = (0.25 * _hDst - _y) >> 0;
                var _w1 = _wDst - 2 * _x1;
                var _h1 = _hDst - 2 * _y1;

                if (_w > 0 && _h > 0)
                {
                    if (null != oThis.CacheImage2.Image)
                    {
                        _ctx1.drawImage(oThis.CacheImage2.Image, _xDst + _x, _yDst + _y, _w, _h);
                    }
                    else
                    {
                        var _c = oThis.CacheImage2.Color;
                        _ctx1.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                        _ctx1.fillRect(_xDst + _x, _yDst + _y, _w, _h);
                        _ctx1.beginPath();
                    }
                }

                _ctx1.globalAlpha = (1 - _part);
                if (null != oThis.CacheImage1.Image)
                {
                    _ctx1.drawImage(oThis.CacheImage1.Image, _x1, _y1, _w1, _h1, _xDst, _yDst, _wDst, _hDst);
                }
                else
                {
                    var _c = oThis.CacheImage1.Color;
                    _ctx1.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                    _ctx1.fillRect(_xDst, _yDst, _wDst, _hDst);
                    _ctx1.beginPath();
                }
                _ctx1.globalAlpha = 1;

                break;
            }
            case c_oAscSlideTransitionParams.Zoom_Out:
            {
                var _ctx1 = null;
                if (null == oThis.DemonstrationObject)
                {
                    // отрисовываем на основной канве картинку первого слайда
                    _ctx1 = oThis.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
                    _ctx1.fillStyle = GlobalSkin.BackgroundColor;
                    _ctx1.fillRect(0, 0, oThis.HtmlPage.m_oEditor.HtmlElement.width, oThis.HtmlPage.m_oEditor.HtmlElement.height);
                }
                else
                {
                    _ctx1 = oThis.DemonstrationObject.Canvas.getContext('2d');
                    _ctx1.fillStyle = "#000000";
                    _ctx1.fillRect(0, 0, oThis.DemonstrationObject.Canvas.width, oThis.DemonstrationObject.Canvas.height);
                }

                _part = 1 - _part;
                var _w = ((0.5 * _wDst) * (1 + _part)) >> 0;
                var _h = ((0.5 * _hDst) * (1 + _part)) >> 0;
                var _x = (_wDst - _w) >> 1;
                var _y = (_hDst - _h) >> 1;

                var _x1 = (0.25 * _wDst - _x) >> 0;
                var _y1 = (0.25 * _hDst - _y) >> 0;
                var _w1 = _wDst - 2 * _x1;
                var _h1 = _hDst - 2 * _y1;

                if (_w > 0 && _h > 0)
                {
                    if (null != oThis.CacheImage1.Image)
                    {
                        _ctx1.drawImage(oThis.CacheImage1.Image, _xDst + _x, _yDst + _y, _w, _h);
                    }
                    else
                    {
                        var _c = oThis.CacheImage1.Color;
                        _ctx1.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                        _ctx1.fillRect(_xDst + _x, _yDst + _y, _w, _h);
                        _ctx1.beginPath();
                    }
                }

                _ctx1.globalAlpha = (1 - _part);
                if (null != oThis.CacheImage2.Image)
                {
                    _ctx1.drawImage(oThis.CacheImage2.Image, _x1, _y1, _w1, _h1, _xDst, _yDst, _wDst, _hDst);
                }
                else
                {
                    var _c = oThis.CacheImage2.Color;
                    _ctx1.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                    _ctx1.fillRect(_xDst, _yDst, _wDst, _hDst);
                    _ctx1.beginPath();
                }
                _ctx1.globalAlpha = 1;

                break;
            }
            case c_oAscSlideTransitionParams.Zoom_AndRotate:
            {
                if (oThis.TimerId === null)
                {
                    var _ctx1 = null;
                    if (null == oThis.DemonstrationObject)
                    {
                        // отрисовываем на основной канве картинку первого слайда
                        _ctx1 = oThis.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
                        _ctx1.fillStyle = GlobalSkin.BackgroundColor;
                        _ctx1.fillRect(0, 0, oThis.HtmlPage.m_oEditor.HtmlElement.width, oThis.HtmlPage.m_oEditor.HtmlElement.height);
                    }
                    else
                    {
                        _ctx1 = oThis.DemonstrationObject.Canvas.getContext('2d');
                        _ctx1.fillStyle = "#000000";
                        _ctx1.fillRect(0, 0, oThis.DemonstrationObject.Canvas.width, oThis.DemonstrationObject.Canvas.height);
                    }

                    if (null != oThis.CacheImage1.Image)
                    {
                        _ctx1.drawImage(oThis.CacheImage1.Image, oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                    }
                    else
                    {
                        var _c = oThis.CacheImage1.Color;
                        _ctx1.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                        _ctx1.fillRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                        _ctx1.beginPath();
                    }
                }

                var _ctx2 = null;
                if (oThis.DemonstrationObject == null)
                {
                    oThis.HtmlPage.m_oOverlayApi.Clear();
                    oThis.HtmlPage.m_oOverlayApi.CheckRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);

                    _ctx2 = oThis.HtmlPage.m_oOverlayApi.m_oContext;
                }
                else
                {
                    _ctx2 = oThis.DemonstrationObject.Overlay.getContext('2d');
                    _ctx2.clearRect(oThis.Rect.x, oThis.Rect.y, oThis.Rect.w, oThis.Rect.h);
                }

                // начинаем с угла в -45 градусов. затем крутим против часовой стрелки на 360 + 45 градусов
                // размер - от 5% до 100%
                var _angle = -45 + 405 * _part;
                var _scale = (0.05 + 0.95 * _part);
                _angle *= (Math.PI / 180);

                _ctx2.save();
                _ctx2.beginPath();
                _ctx2.rect(_xDst, _yDst, _wDst, _hDst);
                _ctx2.clip();
                _ctx2.beginPath();

                var _xC = _xDst + _wDst / 2;
                var _yC = _yDst + _hDst / 2;

                var localTransform = new AscCommon.CMatrixL();
                global_MatrixTransformer.TranslateAppend(localTransform, -_xC, -_yC);
                global_MatrixTransformer.ScaleAppend(localTransform, _scale, _scale);
                global_MatrixTransformer.RotateRadAppend(localTransform, _angle);
                global_MatrixTransformer.TranslateAppend(localTransform, _xC, _yC);

                _ctx2.transform(localTransform.sx, localTransform.shy, localTransform.shx, localTransform.sy, localTransform.tx, localTransform.ty);

                if (null != oThis.CacheImage2.Image)
                {
                    _ctx2.drawImage(oThis.CacheImage2.Image, _xDst, _yDst, _wDst, _hDst);
                }
                else
                {
                    var _c = oThis.CacheImage2.Color;
                    _ctx2.fillStyle = "rgb(" + _c.r + "," + _c.g + "," + _c.b + ")";
                    _ctx2.fillRect(_xDst, _yDst, _wDst, _hDst);
                    _ctx2.beginPath();
                }

                _ctx2.restore();

                break;
            }
            default:
                break;
        }


        oThis.TimerId = __nextFrame(oThis._startZoom);
    }
}

function CDemonstrationManager(htmlpage)
{
    this.HtmlPage   = htmlpage;
    this.Transition = new CTransitionAnimation(htmlpage);

    this.DivWidth = 0;
    this.DivHeight = 0;

    this.MainDivId          = "";
    this.DemonstrationDiv   = null;
    this.DivEndPresentation = null;
    this.EndShowMessage     = "";

    this.SlideNum           = -1;
    this.SlidesCount        = 0;

    this.Mode      = false;
    this.Canvas    = null;
    this.Overlay   = null;

    this.SlideImage = null;

    this.IsPlayMode = true;
    this.CheckSlideDuration = -1;
    this.Transition.DemonstrationObject = this;

    this.CacheImagesManager = new CCacheManager();
    this.SlideImages = new Array(2);
    this.SlideImages[0] = null;
    this.SlideImages[1] = null;

    this.SlideIndexes = new Array(2);
    this.SlideIndexes[0] = -1;
    this.SlideIndexes[1] = -1;

    this.waitReporterObject = null;

    this.PointerDiv = null;

    this.isMouseDown = false;
    this.StartSlideNum = -1;
    this.TmpSlideVisible = -1;

    var oThis = this;

    this.CacheSlide = function(slide_num, slide_index)
    {
        var _w = this.Transition.Rect.w;
        var _h = this.Transition.Rect.h;
        var _w_mm = this.HtmlPage.m_oLogicDocument.Width;
        var _h_mm = this.HtmlPage.m_oLogicDocument.Height;

        var _image = this.CacheImagesManager.Lock(_w, _h);

        var g = new AscCommon.CGraphics();
        g.init(_image.image.getContext('2d'), _w, _h, _w_mm, _h_mm);
        g.m_oFontManager = AscCommon.g_fontManager;

        g.transform(1,0,0,1,0,0);
        g.IsNoDrawingEmptyPlaceholder = true;

        if (this.HtmlPage.DemonstrationManager.Mode)
            g.IsDemonstrationMode = true;

        this.HtmlPage.m_oLogicDocument.DrawPage(slide_num, g);

        this.SlideImages[slide_index] = new CCacheSlideImage();
        this.SlideImages[slide_index].Image = _image;
        this.SlideIndexes[slide_index] = slide_num;
    }

    this.PrepareTransition = function(is_first, is_backward)
    {
        var _slide1 = -1;
        var _slide2 = -1;

        this.Transition.IsBackward = false;
        if (is_first)
        {
            _slide1 = -1;
            _slide2 = this.SlideNum;
        }
        else if (!is_backward)
        {
            _slide1 = this.GetPrevVisibleSlide(true);
            _slide2 = this.SlideNum;
        }
        else
        {
            this.Transition.IsBackward = true;
            _slide1 = this.GetPrevVisibleSlide(true);
            _slide2 = this.SlideNum;
        }

        this.Transition.CalculateRectDemonstration();

        if (this.SlideIndexes[0] != -1 && this.SlideIndexes[0] != _slide1 && this.SlideIndexes[0] != _slide2)
        {
            if (this.SlideImages[0])
                this.CacheImagesManager.UnLock(this.SlideImages[0].Image);
            this.SlideImages[0] = null;
            this.SlideIndexes[0] = -1;
        }
        if (this.SlideIndexes[1] != -1 && this.SlideIndexes[1] != _slide1 && this.SlideIndexes[1] != _slide2)
        {
            if (this.SlideImages[1])
                this.CacheImagesManager.UnLock(this.SlideImages[1].Image);
            this.SlideImages[1] = null;
            this.SlideIndexes[1] = -1;
        }

        if (_slide1 == -1)
        {
            this.Transition.CacheImage1.Image = null;
        }
        else
        {
            if (_slide1 == this.SlideIndexes[0])
            {
                this.Transition.CacheImage1.Image = this.SlideImages[0].Image.image;
            }
            else if (_slide1 == this.SlideIndexes[1])
            {
                this.Transition.CacheImage1.Image = this.SlideImages[1].Image.image;
            }
            else
            {
                if (-1 == this.SlideIndexes[0])
                {
                    this.CacheSlide(_slide1, 0);
                    this.Transition.CacheImage1.Image = this.SlideImages[0].Image.image;
                }
                else
                {
                    this.CacheSlide(_slide1, 1);
                    this.Transition.CacheImage1.Image = this.SlideImages[1].Image.image;
                }
            }
        }

        if (_slide2 == -1)
        {
            this.Transition.CacheImage2.Image = null;
        }
        else
        {
            if (_slide2 == this.SlideIndexes[0])
            {
                this.Transition.CacheImage2.Image = this.SlideImages[0].Image.image;
            }
            else if (_slide2 == this.SlideIndexes[1])
            {
                this.Transition.CacheImage2.Image = this.SlideImages[1].Image.image;
            }
            else
            {
                if (-1 == this.SlideIndexes[0])
                {
                    this.CacheSlide(_slide2, 0);
                    this.Transition.CacheImage2.Image = this.SlideImages[0].Image.image;
                }
                else
                {
                    this.CacheSlide(_slide2, 1);
                    this.Transition.CacheImage2.Image = this.SlideImages[1].Image.image;
                }
            }
        }
    }

    this.PrepareSlide = function()
    {
        if (this.SlideNum < 0 || this.SlideNum >= this.SlidesCount)
        {
            this.SlideImage = -1;
            return;
        }
        else
        {
            if (this.SlideNum != this.SlideIndexes[0])
            {
                if (this.SlideImages[0])
                    this.CacheImagesManager.UnLock(this.SlideImages[0].Image);
                this.SlideImages[0] = null;
                this.SlideIndexes[0] = -1;
            }
            if (this.SlideNum != this.SlideIndexes[1])
            {
                if (this.SlideImages[1])
                    this.CacheImagesManager.UnLock(this.SlideImages[1].Image);
                this.SlideImages[1] = null;
                this.SlideIndexes[1] = -1;
            }

            if (this.SlideNum == this.SlideIndexes[0])
            {
                this.SlideImage = 0;
            }
            else if (this.SlideNum == this.SlideIndexes[1])
            {
                this.SlideImage = 1;
            }
            else
            {
                this.CacheSlide(this.SlideNum, 0);
                this.SlideImage = 0;
            }
        }
    }

    this.CorrectSlideNum = function()
    {
        this.SlidesCount = this.HtmlPage.m_oDrawingDocument.SlidesCount;
        if (this.SlideNum > this.SlidesCount)
            this.SlideNum = this.SlidesCount;
    }

    this.StartWaitReporter = function(main_div_id, start_slide_num, is_play_mode)
    {
		var _parent = document.getElementById(main_div_id);
		if (_parent)
		{
			var _elem = document.createElement('div');
			_elem.setAttribute("id", "dem_id_wait_reporter");
			_elem.setAttribute("style", "line-height:100%;overflow:hidden;position:absolute;margin:0px;padding:25% 0px 0px 0px;left:0px;top:0px;width:100%;height:100%;z-index:20;background-color:#000000;text-align:center;font-family:monospace;font-size:12pt;color:#FFFFFF;");
			_elem.innerHTML = AscCommon.translateManager.getValue("Loading");
			_parent.appendChild(_elem);
		}

		this.waitReporterObject = [main_div_id, start_slide_num, is_play_mode];
    }

    this.EndWaitReporter = function(isNoStart)
    {
		var _parent = document.getElementById(this.waitReporterObject[0]);
		var _elem = document.getElementById("dem_id_wait_reporter");
		try
        {
		    _parent.removeChild(_elem);
        }
        catch (err)
        {
        }

        if (true !== isNoStart)
            this.Start(this.waitReporterObject[0], this.waitReporterObject[1], this.waitReporterObject[2]);
        this.waitReporterObject = null;
    }

    this.Start = function(main_div_id, start_slide_num, is_play_mode)
    {
		this.StartSlideNum = start_slide_num;
		if (-1 == start_slide_num)
			start_slide_num = 0;

        this.SlidesCount = this.HtmlPage.m_oDrawingDocument.SlidesCount;
        this.DemonstrationDiv = document.getElementById(main_div_id);
        if (this.DemonstrationDiv == null || start_slide_num < 0 || start_slide_num >= this.SlidesCount)
            return;

        if (undefined !== window["AscDesktopEditor"])
            window["AscDesktopEditor"]["SetFullscreen"](true);

        this.MainDivId = main_div_id;
        var _width  = this.DemonstrationDiv.clientWidth;
        var _height = this.DemonstrationDiv.clientHeight;

        this.DivWidth = _width;
        this.DivHeight = _height;

        this.Mode = true;
        this.Canvas = document.createElement('canvas');
        this.Canvas.setAttribute("style", "position:absolute;margin:0;padding:0;left:0px;top:0px;width:100%;height:100%;zIndex:2;background-color:#000000;");
        this.Canvas.width = _width;
        this.Canvas.height = _height;

        this.SlideNum = start_slide_num;

        this.HtmlPage.m_oApi.sync_DemonstrationSlideChanged(this.SlideNum);

		this.Canvas.onmousedown  = this.onMouseDown;
		this.Canvas.onmousemove  = this.onMouseMove;
        this.Canvas.onmouseup    = this.onMouseUp;
		this.Canvas.onmouseleave = this.onMouseLeave;

        this.Canvas.onmousewheel = this.onMouseWhell;
        if (this.Canvas.addEventListener)
            this.Canvas.addEventListener("DOMMouseScroll", this.onMouseWhell, false);

        this.DemonstrationDiv.appendChild(this.Canvas);
        this.IsPlayMode = true;

        if (false === is_play_mode)
            this.IsPlayMode = false;

        this.SlideIndexes[0] = -1;
        this.SlideIndexes[1] = -1;

        this.StartSlide(true, true);
    }

    this.StartSlide = function(is_transition_use, is_first_play)
    {
        oThis.HtmlPage.m_oApi.hideVideoControl();
        if (oThis.Canvas)
        {
            oThis.Canvas.style.cursor = "default";
        }

        oThis.StopTransition();

        if (oThis.SlideNum == oThis.SlidesCount)
        {
            if (null == oThis.DivEndPresentation)
            {
                oThis.DivEndPresentation = document.createElement('div');
                oThis.DivEndPresentation.setAttribute("style", "position:absolute;margin:0px;padding:0px;left:0px;top:0px;width:100%;height:100%;z-index:4;background-color:#000000;text-align:center;font-family:monospace;font-size:12pt;color:#FFFFFF;");
                oThis.DivEndPresentation.innerHTML = AscCommon.translateManager.getValue(oThis.EndShowMessage);
                if ("" == oThis.EndShowMessage)
                    oThis.DivEndPresentation.innerHTML = AscCommon.translateManager.getValue("The end of slide preview. Click to exit.");

                //oThis.DemonstrationDivEndPresentation.onmousedown  = oThis.onMouseDownDemonstration;
                //oThis.DemonstrationDivEndPresentation.onmousemove  = oThis.onMouseMoveDemonstration;
				oThis.DivEndPresentation.onmousedown  = oThis.onMouseDown;
                oThis.DivEndPresentation.onmouseup    = oThis.onMouseUp;

                oThis.DivEndPresentation.onmousewheel = oThis.onMouseWhell;
                if (oThis.DivEndPresentation.addEventListener)
                    oThis.DivEndPresentation.addEventListener("DOMMouseScroll", oThis.onMouseWhell, false);

                oThis.DemonstrationDiv.appendChild(oThis.DivEndPresentation);
            }
            return;
        }
        else if (null != oThis.DivEndPresentation)
        {
            this.DemonstrationDiv.removeChild(this.DivEndPresentation);
            this.DivEndPresentation = null;
        }

        var _slides = oThis.HtmlPage.m_oLogicDocument.Slides;
        var _timing = null;
        if (is_transition_use && _slides[oThis.SlideNum])
        {
            _timing = _slides[oThis.SlideNum].timing;

            if (_timing.TransitionType != c_oAscSlideTransitionTypes.None && _timing.TransitionDuration > 0)
            {
                oThis.StartTransition(_timing, is_first_play, false);
                return;
            }
        }

        oThis.OnPaintSlide(false);
    }

    this.StartSlideBackward = function()
    {
        oThis.HtmlPage.m_oApi.hideVideoControl();
        var _is_transition = oThis.Transition.IsPlaying();
        oThis.StopTransition();

        if (oThis.SlideNum == oThis.SlidesCount)
        {
            oThis.SlideNum = this.GetPrevVisibleSlide(true);
            oThis.OnPaintSlide(false);

            if (null != oThis.DivEndPresentation)
            {
                oThis.DemonstrationDiv.removeChild(oThis.DivEndPresentation);
                oThis.DivEndPresentation = null;
            }

            return;
        }

        if (0 >= this.SlideNum)
        {
            this.SlideNum = this.GetFirstVisibleSlide();
            return;
        }

        var _slides = oThis.HtmlPage.m_oLogicDocument.Slides;
        var _timing = _slides[oThis.SlideNum].timing;

        if (!_is_transition && (_timing.TransitionType != c_oAscSlideTransitionTypes.None && _timing.TransitionDuration > 0))
        {
            oThis.StartTransition(_timing, false, true);
            return;
        }

        if (!_is_transition)
            oThis.SlideNum = this.GetPrevVisibleSlide(true);

        oThis.OnPaintSlide(false);
    }

    this.StopTransition = function()
    {
        if (oThis.Transition.TimerId)
            oThis.Transition.End(true);

        if (-1 != this.CheckSlideDuration)
            clearTimeout(this.CheckSlideDuration);

        this.CheckSlideDuration = -1;
    }

    this.StartTransition = function(_timing, is_first, is_backward)
    {
        // сначала проверим, создан ли уже оверлей (в идеале спрашивать еще у транзишна, нужен ли ему оверлей)
        // пока так.
        if (null == oThis.Overlay)
        {
            oThis.Overlay = document.createElement('canvas');
            oThis.Overlay.setAttribute("style", "position:absolute;margin:0;padding:0;left:0px;top:0px;width:100%;height:100%;zIndex:3;");
            oThis.Overlay.width = oThis.Canvas.width;
            oThis.Overlay.height = oThis.Canvas.height;

            oThis.Overlay.onmousedown  = oThis.onMouseDown;
            oThis.Overlay.onmousemove  = oThis.onMouseMove;
            oThis.Overlay.onmouseup    = oThis.onMouseUp;
			oThis.Overlay.onmouseleave = oThis.onMouseLeave;

            oThis.Overlay.onmousewheel = oThis.onMouseWhell;
            if (oThis.Overlay.addEventListener)
                oThis.Overlay.addEventListener("DOMMouseScroll", oThis.onMouseWhell, false);

            this.DemonstrationDiv.appendChild(oThis.Overlay);
        }

        oThis.Transition.Type = _timing.TransitionType;
        oThis.Transition.Param = _timing.TransitionOption;
        oThis.Transition.Duration = _timing.TransitionDuration;

        oThis.PrepareTransition(is_first, is_backward);
        oThis.Transition.Start(false);
    }

    this.OnEndTransition = function(bIsAttack)
    {
        if (oThis.Transition.IsBackward)
        {
            oThis.SlideNum = oThis.GetPrevVisibleSlide(true);
            oThis.HtmlPage.m_oApi.sync_DemonstrationSlideChanged(oThis.SlideNum);
        }

        this.OnPaintSlide(true);
    }

    this.OnPaintSlide = function(is_clear_overlay)
    {
        if (is_clear_overlay && oThis.Overlay)
        {
            var _ctx2 = oThis.Overlay.getContext('2d');
            _ctx2.clearRect(oThis.Transition.Rect.x, oThis.Transition.Rect.y, oThis.Transition.Rect.w, oThis.Transition.Rect.h);
        }

        oThis.Transition.CalculateRectDemonstration();
        oThis.PrepareSlide();

        var _ctx1 = oThis.Canvas.getContext('2d');

        var _image = null;
        if (0 == oThis.SlideImage)
            _image = oThis.SlideImages[0].Image.image;
        else if (1 == oThis.SlideImage)
            _image = oThis.SlideImages[1].Image.image;

        if (null != _image)
        {
            _ctx1.drawImage(_image, oThis.Transition.Rect.x, oThis.Transition.Rect.y, oThis.Transition.Rect.w, oThis.Transition.Rect.h);
        }

        // теперь запустим функцию

        var _slides = oThis.HtmlPage.m_oLogicDocument.Slides;
        var _timing = _slides[oThis.SlideNum] ? _slides[oThis.SlideNum].timing : null;
        if (!_timing)
            return;

        if (_timing.SlideAdvanceAfter === true)
        {
            oThis.CheckSlideDuration = setTimeout(function()
            {
                oThis.CheckSlideDuration = -1;
                if (oThis.IsPlayMode)
                {
					oThis.TmpSlideVisible = oThis.SlideNum;
					oThis.GoToNextVisibleSlide();
                    if(oThis.SlideNum === oThis.SlidesCount && oThis.isLoop())
                    {
                        oThis.SlideNum = oThis.GetFirstVisibleSlide();
                    }
                    oThis.HtmlPage.m_oApi.sync_DemonstrationSlideChanged(oThis.SlideNum);
                    oThis.StartSlide(true, false);
					oThis.TmpSlideVisible = -1;
                }
            },
            _timing.SlideAdvanceDuration);
        }
    }

    this.End = function(isNoUseFullScreen)
    {
		this.PointerRemove();
        if (this.waitReporterObject)
        {
            this.EndWaitReporter(true);
			this.HtmlPage.m_oApi.sync_endDemonstration();
        }
		this.HtmlPage.m_oApi.DemonstrationReporterEnd();

        if (this.HtmlPage.m_oApi.isOnlyDemonstration)
            return;

		if (true !== isNoUseFullScreen)
		{
			if (undefined !== window["AscDesktopEditor"])
				window["AscDesktopEditor"]["SetFullscreen"](false);
		}

        if (!this.Mode)
            return;

        this.StopTransition();

        if (null != this.DivEndPresentation)
        {
            this.DemonstrationDiv.removeChild(this.DivEndPresentation);
            this.DivEndPresentation = null;
        }

        if (null != this.Overlay)
        {
            this.DemonstrationDiv.removeChild(this.Overlay);
            this.Overlay = null;
        }

        this.DemonstrationDiv.removeChild(this.Canvas);
        this.Canvas = null;

        var _oldSlideNum = this.SlideNum;

        this.SlideNum = -1;
        this.DemonstrationDiv = null;
        this.Mode = false;

        var ctx1 = this.HtmlPage.m_oEditor.HtmlElement.getContext('2d');
        ctx1.setTransform(1, 0, 0, 1, 0, 0);

        this.HtmlPage.m_oApi.sync_endDemonstration();

        if (true)
		{
			if (_oldSlideNum < 0)
				_oldSlideNum = 0;
			var _slidesCount = this.HtmlPage.m_oApi.getCountPages();
			if (_oldSlideNum >= _slidesCount)
			    _oldSlideNum = _slidesCount - 1;

			if (0 <= _oldSlideNum)
			    this.HtmlPage.GoToPage(_oldSlideNum);
		}

		this.StartSlideNum = -1;
    }

    this.IsVisibleSlide = function(slideNum)
    {
		if (slideNum == this.StartSlideNum)
		    return true;

		if (-1 != this.TmpSlideVisible)
        {
            if (slideNum == this.TmpSlideVisible)
                return true;
        }

		return this.HtmlPage.m_oLogicDocument.IsVisibleSlide(slideNum);
    };

    this.GoToNextVisibleSlide = function()
    {
		this.SlideNum++;
		while (this.SlideNum < this.SlidesCount)
        {
            if (this.IsVisibleSlide(this.SlideNum))
                break;

            this.SlideNum++;
        }
    };

	this.GoToPrevVisibleSlide = function()
	{
		this.SlideNum--;
		while (this.SlideNum >= 0)
		{
			if (this.IsVisibleSlide(this.SlideNum))
				break;

			this.SlideNum--;
		}
	};

	this.GetPrevVisibleSlide = function(isNoUseLoop)
    {
        var _slide = this.SlideNum - 1;
        while (_slide >= 0)
        {
            if (this.IsVisibleSlide(_slide))
                return _slide;

            --_slide;
        }

        if ((true === isNoUseLoop) || !this.isLoop())
            return -1;

        _slide = this.SlidesCount - 1;
        while (_slide > this.SlideNum)
        {
			if (this.IsVisibleSlide(_slide))
				return _slide;

            --_slide;
        }

        return this.SlidesCount;
    };

	this.GetNextVisibleSlide = function()
    {
		var _slide = this.SlideNum + 1;
		while (_slide < this.SlidesCount)
		{
			if (this.IsVisibleSlide(_slide))
				return _slide;

			++_slide;
		}

		if (!this.isLoop())
			return this.SlidesCount;

		_slide = 0;
		while (_slide < this.SlideNum)
		{
			if (this.IsVisibleSlide(_slide))
				return _slide;

			++_slide;
		}

		return -1;
    };

	this.GetFirstVisibleSlide = function()
	{
	    var _slide = 0;
		while (_slide < this.SlidesCount)
		{
			if (this.IsVisibleSlide(_slide))
				return _slide;
			++_slide;
		}
		return 0;
	};

	this.GetLastVisibleSlide = function()
	{
		var _slide = this.SlidesCount - 1;
		while (_slide >= 0)
		{
			if (this.IsVisibleSlide(_slide))
				return _slide;
			--_slide;
		}
		return this.SlidesCount - 1;
	};

    this.NextSlide = function(isNoSendFormReporter)
    {
        if (!this.Mode)
            return;

		this.TmpSlideVisible = this.SlideNum;

        if (this.HtmlPage.m_oApi.isReporterMode && !isNoSendFormReporter)
			this.HtmlPage.m_oApi.sendFromReporter("{ \"reporter_command\" : \"next\" }");

        this.CorrectSlideNum();

        var _is_transition = this.Transition.IsPlaying();
        if (!_is_transition)
        {
            //this.SlideNum++;
            this.GoToNextVisibleSlide();
		}

        if (this.isLoop() && (this.SlideNum >= this.SlidesCount))
            this.SlideNum = this.GetFirstVisibleSlide();

        if (this.SlideNum > this.SlidesCount)
            this.End();
        else
        {
            this.HtmlPage.m_oNotesApi.IsEmptyDrawCheck = true;
            this.HtmlPage.m_oApi.sync_DemonstrationSlideChanged(this.SlideNum);
            this.StartSlide(!_is_transition, false);
			this.HtmlPage.m_oNotesApi.IsEmptyDrawCheck = false;
        }

        this.TmpSlideVisible = -1;
    }

    this.isLoop = function()
    {
        return (this.HtmlPage.m_oApi.WordControl.m_oLogicDocument.isLoopShowMode() || this.HtmlPage.m_oApi.isEmbedVersion);
    }

    this.PrevSlide = function(isNoSendFormReporter)
    {
        if (!this.Mode)
            return;

		this.TmpSlideVisible = this.SlideNum;

		if (this.HtmlPage.m_oApi.isReporterMode && !isNoSendFormReporter)
			this.HtmlPage.m_oApi.sendFromReporter("{ \"reporter_command\" : \"prev\" }");

        if (this.GetFirstVisibleSlide() != this.SlideNum)
        {
            this.CorrectSlideNum();

            // TODO: backward transition
            this.StartSlideBackward();
            this.HtmlPage.m_oApi.sync_DemonstrationSlideChanged(this.SlideNum);
        }
        else if (this.isLoop())
        {
            this.CorrectSlideNum();
            this.SlideNum = this.SlidesCount;
            this.StartSlideBackward();
            this.HtmlPage.m_oApi.sync_DemonstrationSlideChanged(this.SlideNum);
        }

		this.TmpSlideVisible = -1;
    }

    this.GoToSlide = function(slideNum, isNoSendFormReporter)
    {
        if (!this.Mode)
            return;

		if (this.HtmlPage.m_oApi.isReporterMode && !isNoSendFormReporter)
			this.HtmlPage.m_oApi.sendFromReporter("{ \"reporter_command\" : \"go_to_slide\", \"slide\" : " + slideNum + " }");

        this.CorrectSlideNum();

        if ((slideNum == this.SlideNum) || (slideNum < 0) || (slideNum >= this.SlidesCount))
            return;

        this.SlideNum = slideNum;
        this.HtmlPage.m_oApi.sync_DemonstrationSlideChanged(this.SlideNum);

        this.StartSlide(true, false);
    }

    this.Play = function(isNoSendFormReporter)
    {
        this.IsPlayMode = true;

        if (-1 == this.CheckSlideDuration)
        {
            this.NextSlide(isNoSendFormReporter);
        }
    }

    this.Pause = function()
    {
        this.IsPlayMode = false;
    }

    // manipulators
    this.onKeyDownCode = function(code)
    {
		switch (code)
		{
			case 13:    // enter
			case 32:    // space
			case 34:    // PgDn
			case 39:    // right arrow
			case 40:    // bottom arrow
			{
				oThis.NextSlide();
				break;
			}
			case 33:
			case 37:
			case 38:
			{
				oThis.PrevSlide();
				break;
			}
			case 36:    // home
			{
			    oThis.GoToSlide(oThis.GetFirstVisibleSlide());
				break;
			}
			case 35:    // end
			{
				oThis.GoToSlide(oThis.GetLastVisibleSlide());
				break;
			}
			case 27:    // escape
			{
				oThis.End();
				break;
			}
			default:
				break;
		}
    }

    this.onKeyDown = function(e)
    {
        AscCommon.check_KeyboardEvent(e);

        if (oThis.HtmlPage.m_oApi.reporterWindow)
        {
			var _msg_ = {
				"main_command"  : true,
				"keyCode"       : AscCommon.global_keyboardEvent.KeyCode
			};

			oThis.HtmlPage.m_oApi.sendToReporter(JSON.stringify(_msg_));
			oThis.HtmlPage.IsKeyDownButNoPress = true;
			return false;
        }

        this.onKeyDownCode(AscCommon.global_keyboardEvent.KeyCode);

        oThis.HtmlPage.IsKeyDownButNoPress = true;
        return false;
    }

    this.documentMouseInfo = function(e)
    {
        var transition = oThis.Transition;
        if ((oThis.SlideNum >= 0 && oThis.SlideNum < oThis.SlidesCount) && (!transition || !transition.IsPlaying()))
        {
            AscCommon.check_MouseDownEvent(e, false);

            var _w = transition.Rect.w;
            var _h = transition.Rect.h;
            var _w_mm = oThis.HtmlPage.m_oLogicDocument.Width;
            var _h_mm = oThis.HtmlPage.m_oLogicDocument.Height;

            var _x = global_mouseEvent.X - transition.Rect.x;
            var _y = global_mouseEvent.Y - transition.Rect.y;

            if (oThis.HtmlPage.m_oApi.isReporterMode)
            {
                _x -= ((oThis.HtmlPage.m_oMainParent.AbsolutePosition.L * g_dKoef_mm_to_pix) >> 0);
            }

            _x = _x * _w_mm / _w;
            _y = _y * _h_mm / _h;

            return { x : _x, y : _y, page : oThis.SlideNum };
        }
        return null;
    }

    this.onMouseDown = function(e)
    {
        var documentMI = oThis.documentMouseInfo(e);
        if (documentMI)
        {
            var ret = oThis.HtmlPage.m_oLogicDocument.OnMouseDown(global_mouseEvent, documentMI.x, documentMI.y, documentMI.page);
            if (ret == keydownresult_PreventAll)
            {
                // mouse up will not sended!!!
                oThis.HtmlPage.m_oLogicDocument.OnMouseUp(global_mouseEvent, documentMI.x, documentMI.y, documentMI.page);
                return;
            }
        }

        oThis.isMouseDown = true;
        e.preventDefault();
        return false;
    }

    this.onMouseLeave = function(e)
    {
		if (!oThis.HtmlPage.m_oApi.isReporterMode)
			return;
		if (!oThis.HtmlPage.reporterPointer)
			return;

		oThis.PointerRemove();

        e.preventDefault();
        return false;
    }

    this.onMouseMove = function(e)
    {
        if (true)
        {
            var documentMI = oThis.documentMouseInfo(e);
            if (documentMI)
                oThis.HtmlPage.m_oLogicDocument.OnMouseMove(global_mouseEvent, documentMI.x, documentMI.y, documentMI.page);
        }

		if (!oThis.HtmlPage.reporterPointer)
			return;

        var _x = 0;
        var _y = 0;
		if (e.pageX || e.pageY)
		{
			_x = e.pageX;
			_y = e.pageY;
		}
		else if (e.clientX || e.clientY)
		{
			_x = e.clientX;
			_y = e.clientY;
		}

		_x = (_x * AscCommon.AscBrowser.zoom) >> 0;
		_y = (_y * AscCommon.AscBrowser.zoom) >> 0;

		_x -= parseInt(oThis.HtmlPage.m_oMainParent.HtmlElement.style.left);
		_y -= parseInt(oThis.HtmlPage.m_oMainParent.HtmlElement.style.top);

		var _rect = oThis.Transition.Rect;
		_x -= _rect.x;
		_y -= _rect.y;
		_x /= _rect.w;
		_y /= _rect.h;

		oThis.PointerMove(_x, _y);

        e.preventDefault();
        return false;
    }

    this.onMouseUp = function(e, isAttack, isFromMainToReporter)
    {
    	if (!oThis.isMouseDown && true !== isAttack)
    		return;

    	if (AscCommon.global_mouseEvent.IsLocked)
			AscCommon.global_mouseEvent.IsLocked = false;

		oThis.isMouseDown = false;
		if (isFromMainToReporter && oThis.PointerDiv && oThis.HtmlPage.m_oApi.isReporterMode)
		    oThis.PointerRemove();

		if (oThis.PointerDiv && oThis.HtmlPage.m_oApi.isReporterMode)
		{
			AscCommon.stopEvent(e);
			return false;
        }

		if (oThis.HtmlPage.m_oApi.reporterWindow)
		{
			var _msg_ = {
				"main_command"  : true,
				"mouseUp"       : true
			};

			oThis.HtmlPage.m_oApi.sendToReporter(JSON.stringify(_msg_));

			AscCommon.stopEvent(e);
			return false;
		}

        var documentMI = oThis.documentMouseInfo(e);
        if (documentMI)
        {
            var ret = oThis.HtmlPage.m_oLogicDocument.OnMouseUp(global_mouseEvent, documentMI.x, documentMI.y, documentMI.page);
            if (ret == keydownresult_PreventAll)
                return;
        }

        // next slide
        oThis.CorrectSlideNum();

        var _is_transition = oThis.Transition.IsPlaying();
        if (_is_transition)
        {
            oThis.NextSlide();
        }
        else
        {
            if (oThis.SlideNum < 0 || oThis.SlideNum >= oThis.SlidesCount)
            {
                oThis.NextSlide();
            }
            else
            {
                var _slides = oThis.HtmlPage.m_oLogicDocument.Slides;
                var _timing = _slides[oThis.SlideNum].timing;

                if (_timing.SlideAdvanceOnMouseClick === true)
                {
                    oThis.NextSlide();
                }
            }
        }

		AscCommon.stopEvent(e);
        return false;
    }

    this.onMouseWheelDelta = function(delta)
    {
		if (delta > 0)
		{
			this.NextSlide();
		}
		else
		{
			this.PrevSlide();
		}
    }

    this.onMouseWhell = function(e)
    {
        if (undefined !== window["AscDesktopEditor"])
        {
            if (false === window["AscDesktopEditor"]["CheckNeedWheel"]())
                return;
        }

        var delta = 0;
        if (undefined != e.wheelDelta)
            delta = (e.wheelDelta > 0) ? -1 : 1;
        else
            delta = (e.detail > 0) ? 1 : -1;

		if (oThis.HtmlPage.m_oApi.reporterWindow)
		{
			var _msg_ = {
				"main_command"  : true,
				"mouseWhell"    : delta
			};

			oThis.HtmlPage.m_oApi.sendToReporter(JSON.stringify(_msg_));
			AscCommon.stopEvent(e);
			return false;
		}

        oThis.onMouseWheelDelta(delta);

        AscCommon.stopEvent(e);
        return false;
    }

    this.Resize = function(isNoSend)
    {
		if (isNoSend !== true && oThis.HtmlPage.m_oApi.reporterWindow)
		{
			var _msg_ = {
				"main_command"  : true,
				"resize"        : true
			};

			oThis.HtmlPage.m_oApi.sendToReporter(JSON.stringify(_msg_));
		}
		else if (isNoSend !== true && oThis.HtmlPage.m_oApi.isReporterMode)
        {
			var _msg_ = {
				"reporter_command"  : "resize"
			};

			oThis.HtmlPage.m_oApi.sendFromReporter(JSON.stringify(_msg_));
        }

        if (!this.Mode)
            return;

        var _width  = this.DemonstrationDiv.clientWidth;
        var _height = this.DemonstrationDiv.clientHeight;

        if (_width == this.DivWidth && _height == this.DivHeight && true !== isNoSend)
            return;

		oThis.HtmlPage.m_oApi.disableReporterEvents = true;

        this.DivWidth = _width;
        this.DivHeight = _height;

        this.Canvas.width = _width;
        this.Canvas.height = _height;

        this.Transition.CalculateRectDemonstration();

        this.SlideIndexes[0] = -1;
        this.SlideIndexes[1] = -1;

        if (this.Overlay)
        {
            this.Overlay.width = this.Canvas.width;
            this.Overlay.height = this.Canvas.height;
        }

        if (this.SlideNum < this.SlidesCount)
            this.StartSlide(this.Transition.IsPlaying(), false);

		oThis.HtmlPage.m_oApi.disableReporterEvents = false;
    }

    this.PointerMove = function(x, y, w, h)
    {
        if (!this.PointerDiv)
        {
            this.PointerDiv = document.createElement("div");
            if (AscCommon.AscBrowser.retinaPixelRatio > 1.5)
            {
				this.PointerDiv.setAttribute("style", "position:absolute;z-index:100;pointer-events:none;width:28px;height:28px;margin:0;padding:0;border:none;background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAYAAACohjseAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA+dpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTctMDctMjZUMTU6MTc6MzIrMDM6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE3LTA3LTI2VDE1OjU1OjQ3KzAzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE3LTA3LTI2VDE1OjU1OjQ3KzAzOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCRTk4RENGNDcyMDExMUU3QjE0ODlFOEJERTU4NTc4NyIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCRTk4RENGNTcyMDExMUU3QjE0ODlFOEJERTU4NTc4NyI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkJFOThEQ0YyNzIwMTExRTdCMTQ4OUU4QkRFNTg1Nzg3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkJFOThEQ0YzNzIwMTExRTdCMTQ4OUU4QkRFNTg1Nzg3Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+4SWSuQAABttJREFUeNrcm8+PFEUUx6tranZ3hh1Ww4FwMQIJRr1xEmIEjH+AF08mHl3ictTgj7uJZ1lhiSZKwsmTdyNgDJiQcNtgSGCNF8JJ11l2Zrunu+2adE3evP6+qu7ZXX9N8tLVPbPV/en36tV7r2qjPM9V+Yk8R187qvFbfo+cXc/JNdQOfa+ko2kA1URQH+hTB8onqL+IHo0HLiQ6cD4LIJUscC7BTkGaBnDac9QBSB+gDy4j7Qh8pzz9Qg3WgdIACl1330njkb75jMFxodcjdpRgKxr0wSFpCW0dMFcVMEsqKWvTvjLycrQEaTxwFBDBtIS2O0cmKwE6TXAgzeA4KB/LFUjDXDh/KP7QdcWnSRXQXArE9eXgUvbcKXn2jE8TPg1yOMPahl03TKtNAFNyHIGjz2FRDU55bjQGkSkiECtt0jbsBbQELSpBe1Rjo1JaAK7u1BMhDWoAyTVGwdpEfJAhQARnJRGmIAUiItefJpqEToabpgQ2xwA5qKRF5dEeBUvAWFYeE6Uy4TEBOKTBOQJIJQQpASI4w8ZzBGLZkETSPCg5FwpggebJcd4DibTAPSc1y7iEjANmyc1ck3aExiB9CGnszTEoLlybLQIpadB5yoRoLyZzqTSHZkKcqqkWfWPQpz0HuUAEQVIzRYDUPJ3W6N/5HBOaQytTnmkw/3HzdIAdBkrHJTdTZKLUNKnmdWBaceO3xYIB6kVrORkDALkGOwTUwbeZNhAg1Z7tc4eZtAoEBCmBpOFdhJwMjz1bHsh5oEUnE1PNNzc7w2vXn4t/uHk42/i1l/2xaSGUfmYp1kef78+9fvbJwjtv/xYtLQ3IuGsJL4J62rR8nhH5m5QxjEO2KM/zxZpaoiDdUg6U4s4nWhx8sXZ8cOnKibzfb3vyNhX1eklnZflBZ+X8w1KDw0Is8HYpT0vZJtcH5e+c7JQvKCbOavwyLGCPAdIxVAduCjIfDrtbyxdOFlo7ohp82ufOPO5dXb0XLSxsA7in5NwBcsiYQY4BNcgmpBQpNB7HMguc/SQ3bh3pv7ty0jPtGE+UJIWE3hJD3fE4iWwGl68emwWOQg5Wrxxn0ZIUHbU8GctEtKA935QBswrrUAafX35B7fIzWF07YfsCUMaTc4o1Ic2iBKk+oz0Z/fghrLeUHIp56UV18PrX6tCj++rQxi/jtr0Gc52iD9sXgNM1k+mpqEfPUCqENZn4xq3DItx336r2a68WOin4jRm37TXzMoYs+2o1rPfAGpBGnrtBTXRy0+zRRg89bPeTi6rwjNWbFNe6H1+EgGVfqEJXt+isuJMRp6lA1XoibhKvuP/Tr8hTw+lTxV9Wb1/21bSSDp9fq//5Rws1fl/tEl634Rd0/bd/lqeF23eKv6zevuxrN2sUk+fXDcrpvtJ6po8d7aM7bH/6mSqim+pNimv2O/jWiziVVbXrrE1AWN1wRUesOs+dO/MEPexo/b768823VPLjT8VJOhbbttfsd+hjg3CWNaBSfi1YG4seZAntPItDUQy6WB57ZXuxmJyXfj919g1vcO0cSp57g+9n79z8vsgwNovTrVL6ZRy6ReJRFJPGZeA9Cbi1J1vOPBXnES8U2ZSnc+H8A++It2B57v2JzSzK9Clh6dGIPYO0QDPtG2qYZCrULRNSZhgfO+8tPyzM6/GsHs9mFGXaFLO+OSwHFRm0ZzEkrVG3jIlZjGVx7dK9WSBdukT7QukPg+T+oOJsdIOFEAmOAg5tPtf75su73Y8+WLfjKQRmf9P98P31g9e+ulvmgkMA6GQkaFJ0QNbJHADV67lAVt9ljqe7RyULBzZgWX3dbL6ibQfoMoM2gKS1l3lWYOqyesxuik4JtQQCiWQHaDohWk6cdk0N83SFnQRkz+ihaZWsadnQyRDITg2nUzFTU2MJ2UHqwHJYxirU8YyF35hpEmkqEZxNEDAHS8gjT8oimVu8i9I91+SOUDVDkJVpwrCbRWypGOVjvnV2B7hXiy8UbmcWb2qEB42EnQ0KrPRQuL1YPuOQcU3toWlCGQEuAnAR2GvGzZOu7+3FAmgCIiZfRFN7DEZgN4MS4DIGuddL2FRjPKIZhSZ64zFPVG1TQlCe7tMmhBEASwPTQ8ZNFG2rarJxLgXa249tJCOQzaDcFGoQmV6dBf+MrOy0SFCw1xuBJAkmwkbYTKOJdnLBPPki5H5s5UqFtpRFZDybMELRJvOMvZwt+GsWGOznZrwssBtR1KAEyfd+oa0a2gO3H9spEZSU9E40GHkgI7B7IfsHNsTWhZoqbxq+Q9aTm1JYeszUv2NLM6rdVjQYKbz/GUkONqj+3ZvSgzvwkQYlTebqP/hvBX8JMAASRMzjAJSzzwAAAABJRU5ErkJggg=='); background-size: 28px 28px;");
            }
            else
			{
				this.PointerDiv.setAttribute("style", "position:absolute;z-index:100;pointer-events:none;width:28px;height:28px;margin:0;padding:0;border:none;background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA+dpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTctMDctMjZUMTU6MTc6MzIrMDM6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE3LTA3LTI2VDE1OjU0OjExKzAzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE3LTA3LTI2VDE1OjU0OjExKzAzOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4NTgwNDIyNDcyMDExMUU3OTRGNTgwQjYzODE3QjJFRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo4NTgwNDIyNTcyMDExMUU3OTRGNTgwQjYzODE3QjJFRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjg1ODA0MjIyNzIwMTExRTc5NEY1ODBCNjM4MTdCMkVFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjg1ODA0MjIzNzIwMTExRTc5NEY1ODBCNjM4MTdCMkVFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+dWpcyAAAAsxJREFUeNq8lr+KFEEQxnt6+nZG53Y9jxMzUTAwMDP1CQSRywQjwcjAJxBE8AkMjAQjwUxE8AmMzQQDQTGTO867/ePO7M7O2DVXNXxb2wuzcNjw0b13vfXbqq6q7qiua+NHpGRZeo2iUStVLL1u5RRE5hjmGD7bNUAxvgBVMMse45QXAnEBIRiBCCqVIoDSqLSHYnyL1VOzQBEosLnXDGaMRsl7I6fC6Ng4KWGlPAvUKWAJkMIrXxOJ9gwRJt4Q5BzrPM8pQK2ECGAEmkL4g4nl4OwEmDAg89pmZQxOIbQGQkmwv14TtmPVGcs5WwkPhlOABBp4XeBZoD0FnAGsp7xfqIRahEKasuFthu167QA04b2GjRQMG8LfK8jUOSsWD+0aDzOG7Ag0f/3mRv723fXFj599shpfuzpKH9z/nj56+E39CEkg0UyAke80AwUQr/a8LnldpvXo8ZPbs4+frpjA6N2986v/6uVnvzz0+u11wOsjrxP2nqIw1d0lVplKoc3Is3UwGvQ/2qOSS9duw7Kq8ONA4ScURjGe7N8zu1+/NKK1DN6D9boFJdJyQk1Ze+zkzGhkL56ZaDBoRGsTnZYb7wm1wCVZ85+HDVwxKw2ZslG+MHn63NTDYSNam9PrzfCeUt0WK7ZtAIK106Q3pb4Ai/cfzNHNW41oLYP3FNDA5/ADKg2sAl2/bVdUZ5T6rXXyij2TsuBanPB3cgAveUx12FfdBYt9j9Wl8I+57g6hBo+5BsfyQwiYQXchaB+gFzdsbQL9A7ARw+gmKVzg7HK4iC0YnnZo3kPuLGMI7dJZOri1S+h5ser6YrTL9TRmTSGJBFg7uK9K9VDCrl+wwS4XsIRPgOJhJR5KSENPwAUAN3liFKpEVkKKUP0am/OXN31EBWvRqcIvA41gHjjbrs/ElcJHD/WDRwyc5UO4BUoCRGDEysPnLJ/6/wQYAGSEwicuWovcAAAAAElFTkSuQmCC'); background-size: 28px 28px;");
			}
			this.DemonstrationDiv.appendChild(this.PointerDiv);
        }
        var _rect = this.Transition.Rect;
		this.PointerDiv.style.left = ((_rect.x + x * _rect.w - 14) >> 0) + "px";
		this.PointerDiv.style.top = ((_rect.y + y * _rect.h - 14) >> 0) + "px";

		if (this.HtmlPage.m_oApi.isReporterMode)
        {
			this.Canvas.style.cursor = "none";
			if (this.Overlay)
				this.Overlay.style.cursor = "none";

            var _msg_ = {
                "reporter_command" : "pointer_move",
                "x" : x,
                "y" : y
            };
			this.HtmlPage.m_oApi.sendFromReporter(JSON.stringify(_msg_));
        }
    }

    this.PointerRemove = function()
    {
        if (!this.PointerDiv)
            return;

		this.DemonstrationDiv.removeChild(this.PointerDiv);
		this.PointerDiv = null;

		if (this.HtmlPage.m_oApi.isReporterMode)
		{
			this.Canvas.style.cursor = "default";
			if (this.Overlay)
				this.Overlay.style.cursor = "default";

			this.HtmlPage.m_oApi.sendFromReporter("{ \"reporter_command\" : \"pointer_remove\" }");
		}
    }
}
