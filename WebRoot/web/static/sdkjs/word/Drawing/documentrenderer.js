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
var g_memory = AscFonts.g_memory;
var DecodeBase64Char = AscFonts.DecodeBase64Char;
var b64_decode = AscFonts.b64_decode;

function CPageMeta()
{
    this.width_mm = 0;
    this.height_mm = 0;
    this.start = 0;
    this.end = 0;
}

function CStream(data, size)
{
    this.obj = null;
    this.data = data;
    this.size = size;
    this.pos = 0;
    this.cur = 0;

    this.Seek = function(_pos)
    {
        if (_pos > this.size)
            return 1;
        this.pos = _pos;
        return 0;
    }
    this.Skip = function(_skip)
    {
        if (_skip < 0)
            return 1;
        return this.Seek(this.pos + _skip);
    }

    // 1 bytes
    this.GetUChar = function()
    {
        if (this.pos >= this.size)
            return 0;
        return this.data[this.pos++];
    }
    this.GetChar = function()
    {
        if (this.pos >= this.size)
            return 0;
        var m = this.data[this.pos++];
        if (m > 0x7F)
            m -= 256;
        return m;
    }
    this.GetString = function(len)
    {
        len *= 2;
        if (this.pos + len > this.size)
            return "";
        var t = "";
        for (var i = 0; i < len; i+=2)
        {
            var _c = this.data[this.pos + i + 1] << 8 | this.data[this.pos + i];
            if (_c == 0)
                break;

            t += String.fromCharCode(_c);
        }
        this.pos += len;
        return t;
    }

    this.GetStringA = function(len)
    {
        if (this.pos + len > this.size)
            return "";
        var t = "";
        for (var i = 0; i < len; i++)
        {
            var _c = this.data[this.pos + i];
            if (_c == 0)
                break;

            t += String.fromCharCode(_c);
        }
        this.pos += len;
        return t;
    }

    // 2 byte
    this.GetUShort = function()
    {
        if (this.pos + 1 >= this.size)
            return 0;
        return (this.data[this.pos++] | this.data[this.pos++] << 8);
    }
    this.GetShort = function()
    {
        if (this.pos + 1 >= this.size)
            return 0;
        var _c = (this.data[this.pos++] | this.data[this.pos++] << 8);

        if (_c > 0x7FFF)
            return _c - 65536;
        return _c;
    }

    // 4 byte
    this.GetULong = function()
    {
        if (this.pos + 3 >= this.size)
            return 0;
        var s = (this.data[this.pos++] | this.data[this.pos++] << 8 | this.data[this.pos++] << 16 | this.data[this.pos++] << 24);
        if (s < 0)
            s += (0xFFFFFFFF + 1);
        return s;
    }
    this.GetLong = function()
    {
        // 32-áèòíûå ÷èñëà - ïî óìîë÷àíèþ çíàêîâûå!!!
        return (this.data[this.pos++] | this.data[this.pos++] << 8 | this.data[this.pos++] << 16 | this.data[this.pos++] << 24);
    }

    // double
    this.GetDouble = function()
    {
        return this.GetLong() / 10000;
    }
    this.GetDouble2 = function()
    {
        return this.GetShort() / 100;
    }

    this.SkipImage = function()
    {
        var _type = this.GetUChar();

        switch (_type)
        {
            case 2:
            {
                this.Skip(4);
                break;
            }
            case 3:
            {
                var _lenA = this.GetULong();
                this.Skip(_lenA);
                break;
            }
            case 10:
            case 11:
            {
                this.Skip(44);
                break;
            }
            default:
            {
                this.Skip(20);
                break;
            }
        }
    }
}

function CreateDocumentData(szSrc)
{
    var isBase64 = false;
	if (typeof(szSrc) == "string" || szSrc instanceof String){
		isBase64 = true;
	}

	var stream = null;
	if (!isBase64)
    {
		stream = new CStream(szSrc, szSrc.length);
		return stream;
    }

    var srcLen = szSrc.length;
    var nWritten = 0;

    var index = 0;
    var dst_len = "";
    while (true)
    {
        var _c = szSrc.charCodeAt(index);
        if (_c == ";".charCodeAt(0))
            break;

        dst_len += String.fromCharCode(_c);
        index++;
    }

    index++;
    var dstLen = parseInt(dst_len);

    if (0 == dstLen)
        return null;

    var pointer = g_memory.Alloc(dstLen);
    stream = new CStream(pointer.data, dstLen);
    stream.obj = pointer.obj;

    var dstPx = stream.data;

    if (window.chrome)
    {
        while (index < srcLen)
        {
            var dwCurr = 0;
            var i;
            var nBits = 0;
            for (i=0; i<4; i++)
            {
                if (index >= srcLen)
                    break;
                var nCh = DecodeBase64Char(szSrc.charCodeAt(index++));
                if (nCh == -1)
                {
                    i--;
                    continue;
                }
                dwCurr <<= 6;
                dwCurr |= nCh;
                nBits += 6;
            }

            dwCurr <<= 24-nBits;
            for (i=0; i<nBits/8; i++)
            {
                dstPx[nWritten++] = ((dwCurr & 0x00ff0000) >>> 16);
                dwCurr <<= 8;
            }
        }
    }
    else
    {
        var p = b64_decode;
        while (index < srcLen)
        {
            var dwCurr = 0;
            var i;
            var nBits = 0;
            for (i=0; i<4; i++)
            {
                if (index >= srcLen)
                    break;
                var nCh = p[szSrc.charCodeAt(index++)];
                if (nCh == undefined)
                {
                    i--;
                    continue;
                }
                dwCurr <<= 6;
                dwCurr |= nCh;
                nBits += 6;
            }

            dwCurr <<= 24-nBits;
            for (i=0; i<nBits/8; i++)
            {
                dstPx[nWritten++] = ((dwCurr & 0x00ff0000) >>> 16);
                dwCurr <<= 8;
            }
        }
    }

    return stream;
}

function CDrawingObject(metaDoc)
{
    this.Page = -1;
    this.StreamPos = -1;

    this.BreakDrawing = 0;
    this.Graphics = null;

    this.fontId = -1;
    this.fontSize = -1;
    this.tm_sx = 0;
    this.tm_sy = 0;
    this.tm_shx = 0;
    this.tm_shy = 0;

    this.LastTimeDrawing = -1;

    this.MetaDoc = metaDoc;
}

CDrawingObject.prototype =
{
    CheckOnScroll : function()
    {
        if (-1 == this.LastTimeDrawing)
        {
            this.LastTimeDrawing = new Date().getTime();
            return false;
        }
        var newTime = new Date().getTime();
        if (newTime - this.LastTimeDrawing > 3000) // 3 сек
        {
            this.LastTimeDrawing = newTime;
            return true;
        }
    }
};

function CDocMetaSelection()
{
    this.Page1 = 0;
    this.Line1 = 0;
    this.Glyph1 = 0;

    this.Page2 = 0;
    this.Line2 = 0;
    this.Glyph2 = 0;

    this.IsSelection = false;
}

function CSpan()
{
    this.fontName = 0;
    this.fontSize = 0;

    this.colorR = 0;
    this.colorG = 0;
    this.colorB = 0;

    this.inner = "";

    this.CreateDublicate = function()
    {
        var ret = new CSpan();

        ret.fontName = this.fontName;
        ret.fontSize = this.fontSize;

        ret.colorR = this.colorR;
        ret.colorG = this.colorG;
        ret.colorB = this.colorB;

        ret.inner = this.inner;

        return ret;
    }
}

function CLineInfo()
{
    this.X = 0;
    this.Y = 0;
    this.W = 0;
    this.H = 0;
    this.Ex = 1;
    this.Ey = 0;

    //this.offsets = [];
    this.text = "";
}

function CDocMeta()
{
    this.Fonts = [];
    this.ImageMap = {};

    this.Pages = null;
    this.PagesCount = 0;

    this.LockObject = null;
    this.stream = null;

    this.CountParagraphs = 0;
    this.CountWords = 0;
    this.CountSymbols = 0;
    this.CountSpaces = 0;

    this.Drawings = [];

    this.Selection = new CDocMetaSelection();
    this.TextMatrix = new AscCommon.CMatrix();

    this.SearchInfo =
    {
        Id   : null,
        Page : 0,
        Text : null
    };

    this.SearchResults = {
        IsSearch    : false,
        Text        : "",
        MachingCase : false,
        Pages       : [],
        CurrentPage : -1,
        Current     : -1,
        Show        : false,
        Count       : 0
    };

    this.pagestreams = [];
    this.waitSelectAll = false;

    this.CachedImagesCount = 5;
    this.CachedImages = [];
}

CDocMeta.prototype =
{
    Init : function()
    {
        if (!window["AscDesktopEditor"] || !window["AscDesktopEditor"]["IsNativeViewer"] || !window["AscDesktopEditor"]["IsNativeViewer"]())
            return;

        CDocMeta.prototype.Load = function(url, doc_bin_base64)
        {
            var stream = CreateDocumentData(doc_bin_base64);

            this.PagesCount = stream.GetLong();
            this.Pages = new Array(this.PagesCount);

            this.CountParagraphs = 0;
            this.CountWords = 0;
            this.CountSymbols = 0;
            this.CountSpaces = 0;

            for (var i = 0; i < this.PagesCount; i++)
            {
                var pageInfo = new CPageMeta();
                pageInfo.width_mm = stream.GetDouble();
                pageInfo.height_mm = stream.GetDouble();
                pageInfo.start = 0;
                pageInfo.end = 0;

                this.Pages[i] = pageInfo;
            }

            if (0 == this.PagesCount)
            {
                this.PagesCount = 1;
                this.Pages = new Array(this.PagesCount);

                var pageInfo = new CPageMeta();
                pageInfo.width_mm = 210;
                pageInfo.height_mm = 297;

                this.Pages[0] = pageInfo;
            }

            if (0 != this.Drawings.length)
            {
                this.Drawings.splice(0, this.Drawings.length);
            }

            AscCommon.g_font_loader.LoadEmbeddedFonts("fonts/", this.Fonts);

            var oThis = this;
            setInterval(function() {oThis.NativeDrawTimer();}, 40);
        };

        CDocMeta.prototype.NativeDrawTimer = function()
        {
            var _ret = window["AscDesktopEditor"]["NativeViewerGetCompleteTasks"]();

            var _drDoc = editor.WordControl.m_oDrawingDocument;

            var _current = 0;

            var _countDrawTasks = _ret[_current++];
            var _countTextTasks = _ret[_current++];

            for (var i = 0; i < _countDrawTasks; ++i)
            {
                var _url    = _ret[_current++];
                var _page   = _ret[_current++];
                var _x      = _ret[_current++];
                var _y      = _ret[_current++];

                if (_page >= _drDoc.m_lDrawingFirst && _page <= _drDoc.m_lDrawingEnd)
                {
                    _drDoc.StopRenderingPage(_page);
                    editor.WordControl.OnScroll();
                }
            }

            for (var i = 0; i < _countTextTasks; ++i)
            {
                var _stream = CreateDocumentData(_ret[_current++]);
                var _page = _ret[_current++];
                this.pagestreams[_page] = _stream;
                this.Pages[_page].end   = this.pagestreams[_page] ? this.pagestreams[_page].size : 0;

                this.CountParagraphs    = _ret[_current++];
                this.CountWords         = _ret[_current++];
                this.CountSpaces        = _ret[_current++];
                this.CountSymbols       = _ret[_current++];

                if (_page == (this.PagesCount - 1))
                {
                    this.selectAllCheckEnd();
                }
            }
        };

        CDocMeta.prototype.getStreamPage = function(pageNum)
        {
            return this.pagestreams[pageNum] ? this.pagestreams[pageNum] : new CStream(null, 0);
        };

        CDocMeta.prototype.OnImageLoad = function(obj)
        {
            if (obj.BreakDrawing == 1)
            {
                return;
            }

            var page = this.Pages[obj.Page];
            var g = obj.Graphics;

            g.SetIntegerGrid(true);

            var _url = window["AscDesktopEditor"]["NativeViewerGetPageUrl"](obj.Page, g.m_lWidthPix, g.m_lHeightPix,
                editor.WordControl.m_oDrawingDocument.m_lDrawingFirst, editor.WordControl.m_oDrawingDocument.m_lDrawingEnd);

            if (_url == "")
            {
                // ждем возврата задачи
                return;
            }

            var img = new Image();
            img.onload = function(){
                if (1 != obj.BreakDrawing)
                {
                    var _ctx = g.m_oContext;
                    _ctx.drawImage(img, 0, 0, img.width, img.height);
                }

                // дорисовали страницу. теперь нужно удалить все объекты, у которых страница такая же
                // по идее удаляем только obj
                obj.MetaDoc.stopRenderingPage(obj.Page);
                editor.WordControl.OnScroll();
            };
            img.onerror = function(){
                obj.MetaDoc.stopRenderingPage(obj.Page);
            };
            img.src = "ascdesktop://fonts/" + _url;
        };

        CDocMeta.prototype.selectAllCheckStart = function()
        {
            if (this.pagestreams[this.PagesCount - 1] !== undefined)
            {
                this.waitSelectAll = false;
                return true;
            }

            this.waitSelectAll = true;
            editor.sync_StartAction(window['Asc'].c_oAscAsyncActionType.BlockInteraction, window['Asc'].c_oAscAsyncAction.SlowOperation);
        };

        CDocMeta.prototype.selectAllCheckEnd = function()
        {
            if (this.waitSelectAll)
            {
                this.waitSelectAll = false;
                editor.sync_EndAction(window['Asc'].c_oAscAsyncActionType.BlockInteraction, window['Asc'].c_oAscAsyncAction.SlowOperation);
                this.selectAll();
            }
        };
    },

    Load : function(url, doc_bin_base64)
    {
        var stream = CreateDocumentData(doc_bin_base64);

        this.PagesCount = stream.GetLong();
        this.Pages = new Array(this.PagesCount);

        this.CountParagraphs = stream.GetLong();
        this.CountWords = stream.GetLong();
        this.CountSymbols = stream.GetLong();
        this.CountSpaces = stream.GetLong();

        var fontsCount = stream.GetLong();
        for (var i = 0; i < fontsCount; i++)
        {
            this.Fonts[i] = new AscFonts.CFont("font" + i, "embedded" + i, AscFonts.FONT_TYPE_EMBEDDED, "", null);
        }

        for (var i = 0; i < this.PagesCount; i++)
        {
            var pageInfo = new CPageMeta();
            pageInfo.width_mm = stream.GetDouble();
            pageInfo.height_mm = stream.GetDouble();
            pageInfo.start = stream.GetLong();
            pageInfo.end = stream.GetLong();

            this.Pages[i] = pageInfo;
        }

        if (0 == this.PagesCount)
        {
            this.PagesCount = 1;
            this.Pages = new Array(this.PagesCount);

            var pageInfo = new CPageMeta();
            pageInfo.width_mm = 210;
            pageInfo.height_mm = 297;
            pageInfo.start = 0;
            pageInfo.end = 0;

            this.Pages[0] = pageInfo;
        }

        this.stream = stream;

        if (0 != this.Drawings.length)
        {
            this.Drawings.splice(0, this.Drawings.length);
        }

        AscCommon.g_font_loader.LoadEmbeddedFonts("fonts/", this.Fonts);
    },

    InitDocument : function(drDoc)
    {
        drDoc.m_arrPages = [];
        drDoc.m_lPagesCount = 0;

        for (var i = 0; i < this.PagesCount; i++)
        {
            var _page = new AscCommon.CPage();
            _page.width_mm = this.Pages[i].width_mm;
            _page.height_mm = this.Pages[i].height_mm;
            _page.pageIndex = i;
            drDoc.m_arrPages[i] = _page;
        }

        drDoc.m_lCurrentPage = 0;
        drDoc.m_lPagesCount = this.PagesCount;
        drDoc.m_lCountCalculatePages = this.PagesCount;

        this.SearchResults.Pages = new Array(this.PagesCount);
        for (var i = 0; i < this.PagesCount; i++)
        {
            this.SearchResults.Pages[i] = [];
        }

        editor.sync_countPagesCallback(this.PagesCount);
        editor.sync_currentPageCallback(0);
    },

    drawPage : function(pageIndex, g)
    {
        // если пришла отрисовка - то точно надо перерисовать (изменился размер)
		this.stopRenderingPage(pageIndex);

        var drObject = new CDrawingObject(this);
        drObject.Page = pageIndex;
        drObject.StreamPos = this.Pages[pageIndex].start;
        drObject.Graphics = g;

        this.Drawings[this.Drawings.length] = drObject;
		this.OnImageLoad(drObject);
    },

    stopRenderingPage : function(pageIndex)
    {
        for (var i = 0; i < this.Drawings.length; i++)
        {
            if (pageIndex == this.Drawings[i].Page)
            {
                this.Drawings[i].BreakDrawing = 1;

                if (this.Drawings[i].Graphics.IsClipContext)
                {
                    this.Drawings[i].Graphics.m_oContext.restore();
                    this.Drawings[i].Graphics.IsClipContext = false;
                }

                this.Drawings.splice(i, 1);
                i--;
            }
        }
    },

    getStreamPage : function(pageNum)
    {
        return this.stream;
    },

    OnImageLoad : function(obj)
    {
        if (obj.BreakDrawing == 1)
        {
            return;
        }

        var page = this.Pages[obj.Page];
        var s = this.getStreamPage(obj.Page);
        s.Seek(obj.StreamPos);
        var g = obj.Graphics;

        g.SetIntegerGrid(false);

        // textline parameters
        var _lineX = 0;
        var _lineY = 0;
        var _lineEx = 0;
        var _lineEy = 0;
        var _lineAscent = 0;
        var _lineDescent = 0;
        var _lineWidth = 0;
        var _lineGidExist = false;
        var _linePrevCharX = 0;
        var _lineCharCount = 0;

        if (obj.fontId != -1)
        {
            // все для того, чтобы не лочить отрисовку страниц. с этим ифом - отрисовка полностью параллельна
            g.font("font" + obj.fontId, obj.fontSize);
        }

        var bIsFromPaint = (this.Pages[obj.Page].start == obj.StreamPos) ? 1 : 0;
        if (bIsFromPaint)
        {
            // default colors: black!!!
            g.b_color1(0, 0, 0, 255);
            g.p_color(0, 0, 0, 255);
        }

        if (obj.CheckOnScroll() && 0 == bIsFromPaint)
            editor.WordControl.OnScroll();

        var _cachedImage = null;

        while (s.pos < page.end)
        {
            var command = s.GetUChar();

            switch (command)
            {
                case 41:
                {
                    var fontId = s.GetLong();
                    var font = "font" + fontId;
                    var style = s.GetLong();
                    var size = s.GetDouble();

                    var m = g.m_oTransform;
                    g.font(font, size);

                    obj.fontId = fontId;
                    obj.fontSize = size;
                    obj.tm_sx = m.sx;
                    obj.tm_sy = m.sy;
                    obj.tm_shx = m.shx;
                    obj.tm_shy = m.shy;

                    break;
                }
                case 22:
                {
                    g.b_color1(s.GetUChar(), s.GetUChar(), s.GetUChar(), s.GetUChar());
                    break;
                }
                case 1:
                {
                    g.p_color(s.GetUChar(), s.GetUChar(), s.GetUChar(), s.GetUChar());
                    break;
                }
                case 3:
                {
                    g.p_width(s.GetDouble() * 1000);
                    break;
                }
                case 131:
                {
                    g.transform(1,0,0,1,0,0);
                    break;
                }
                case 130:
                {
                    g.transform(s.GetDouble(), s.GetDouble(), s.GetDouble(), s.GetDouble(), s.GetDouble(), s.GetDouble());
                    break;
                }
                case 80:
                {
                    /*
                    var gid = s.GetUShort();
                    var _char = s.GetUShort();
					if (0xFFFF == gid)
						g.FillText(s.GetDouble(), s.GetDouble(), String.fromCharCode(_char));
					else
						g.tg(gid, s.GetDouble(), s.GetDouble());
				    */
                    if (0 != _lineCharCount)
                        _linePrevCharX += s.GetDouble2();
                    _lineCharCount++;

                    var _char = s.GetUShort();
                    var _gid = (_lineGidExist === true) ? s.GetUShort() : 0xFFFF;

                    if (_char == 0xFFFF)
                    {
                        s.Skip(2);
                        break;
                    }

                    var __x = 0;
                    var __y = 0;
                    var m1 = g.m_oTransform.sx;
                    var m2 = g.m_oTransform.shx;
                    var m3 = g.m_oTransform.shy;
                    var m4 = g.m_oTransform.sy;

                    var det1 = m1 * m4 - m2 * m3;
                    if (det1 == 0)
                        det1 = 0.01;

                    var xDst = _lineX + _linePrevCharX * _lineEx;
                    var yDst = _lineY + _linePrevCharX * _lineEy;

                    __x = (m4 * xDst - m2 * yDst) / det1;
                    __y = (m1 * yDst - m3 * xDst) / det1;

                    if (0xFFFF == _gid)
                        g.FillText(__x, __y, String.fromCharCode(_char));
                    else
                        g.tg(_gid, __x, __y);

                    s.Skip(2);

                    break;
                }
                case 98:
                case 100:
                {
                    // beginpath
                    g._s();
                    break;
                }
                case 91:
                {
                    // moveto
                    //s.Skip(2 * 4);
                    g._m(s.GetDouble(), s.GetDouble());
                    break;
                }
                case 92:
                {
                    // lineto
                    //s.Skip(2 * 4);
                    g._l(s.GetDouble(), s.GetDouble());
                    break;
                }
                case 94:
                {
                    // curveto
                    //s.Skip(6 * 4);
                    g._c(s.GetDouble(), s.GetDouble(), s.GetDouble(), s.GetDouble(), s.GetDouble(), s.GetDouble());
                    break;
                }
                case 97:
                {
                    g._z();
                    break;
                }
                case 99:
                {
                    // drawpath
                    //s.Skip(4);
                    var type = s.GetLong();
                    if (type > 255)
                        g.df();
                    if ((type & 0xFF) != 0)
                        g.ds();
                    break;
                }
                case 110:
                {
                    // drawImage
                    var _type = s.GetUChar();

                    if (2 == _type)
                    {
                        var _src = AscCommon.g_oDocumentUrls.getImageUrl("image" + s.GetLong() + ".svg");
                        obj.StreamPos = s.pos;

                        _cachedImage = this.GetCachedImage(_src);
                        if (null != _cachedImage)
                        {
                            try {
                                g.drawImage2(_cachedImage, 0, 0, page.width_mm, page.height_mm);
                            } catch (err) {}
							break;
                        }
                        else
						{
							var img = new Image();
							img.onload = function ()
							{
								obj.MetaDoc.SetCachedImage(_src, img);
								if (1 != obj.BreakDrawing)
								{
								    try {
									    g.drawImage2(img, 0, 0, page.width_mm, page.height_mm);
                                    } catch (err) {}
								}

								obj.MetaDoc.OnImageLoad(obj);
							};
							img.onerror = function ()
							{
								obj.MetaDoc.OnImageLoad(obj);
							};
							img.src = _src;

							return;
						}
                    }
                    else if (3 == _type)
                    {
                        var _lenA = s.GetULong();
                        var _src = "data:image/svg+xml;base64," + s.GetStringA(_lenA);

                        obj.StreamPos = s.pos;

						_cachedImage = this.GetCachedImage(_src);
						if (null != _cachedImage)
						{
						    try {
							    g.drawImage2(_cachedImage, 0, 0, page.width_mm, page.height_mm);
                            } catch (err) {}
							break;
						}
						else
						{
							var img = new Image();
							img.onload = function ()
							{
								obj.MetaDoc.SetCachedImage(_src, img);
								if (1 != obj.BreakDrawing)
								{
								    try {
									    g.drawImage2(img, 0, 0, page.width_mm, page.height_mm);
                                    } catch (err) {}
								}

								obj.MetaDoc.OnImageLoad(obj);
							};
							img.onerror = function ()
							{
								obj.MetaDoc.OnImageLoad(obj);
							};
							img.src = _src;

							return;
						}
                    }

                    var _src = (0 == _type || 10 == _type) ? AscCommon.g_oDocumentUrls.getImageUrl("image" + s.GetLong() + ".jpg") : AscCommon.g_oDocumentUrls.getImageUrl("image" + s.GetLong() + ".png");

                    var __x = s.GetDouble();
                    var __y = s.GetDouble();
                    var __w = s.GetDouble();
                    var __h = s.GetDouble();

                    var _tr = null;
                    if (10 == _type || 11 == _type)
                    {
                        _tr = new AscCommon.CMatrix();
                        _tr.sx = s.GetDouble();
                        _tr.shy = s.GetDouble();
                        _tr.shx = s.GetDouble();
                        _tr.sy = s.GetDouble();
                        _tr.tx = s.GetDouble();
                        _tr.ty = s.GetDouble();
                    }

                    obj.StreamPos = s.pos;

					_cachedImage = this.GetCachedImage(_src);
					if (null != _cachedImage)
					{
						if (1 != obj.BreakDrawing)
						{
							var _ctx = g.m_oContext;

							if (_tr)
							{
								var _dX = g.m_oCoordTransform.sx;
								var _dY = g.m_oCoordTransform.sy;

								_ctx.save();
								_ctx.setTransform(_tr.sx * _dX, _tr.shy * _dY, _tr.shx * _dX, _tr.sy * _dY, _tr.tx * _dX, _tr.ty * _dY);
							}

							try {
							    g.drawImage2(_cachedImage,__x,__y,__w,__h);
                            } catch (err) {}
							//editor.WordControl.OnScroll();

							if (_tr)
							{
								_ctx.restore();
							}
						}
						break;
					}
					else
					{
						var img = new Image();
						img.onload = function ()
						{
							obj.MetaDoc.SetCachedImage(_src, img);
							if (1 != obj.BreakDrawing)
							{
								var _ctx = g.m_oContext;

								if (_tr)
								{
									var _dX = g.m_oCoordTransform.sx;
									var _dY = g.m_oCoordTransform.sy;

									_ctx.save();
									_ctx.setTransform(_tr.sx * _dX, _tr.shy * _dY, _tr.shx * _dX, _tr.sy * _dY, _tr.tx * _dX, _tr.ty * _dY);
								}

								try {
								    g.drawImage2(img, __x, __y, __w, __h);
                                } catch (err) {}
								//editor.WordControl.OnScroll();

								if (_tr)
								{
									_ctx.restore();
								}
							}

							obj.MetaDoc.OnImageLoad(obj);
						};
						img.onerror = function ()
						{
							obj.MetaDoc.OnImageLoad(obj);
						};
						img.src = _src;

						return;
					}
					break;
                }
                case 160:
                {
                    // textline
                    _linePrevCharX = 0;
                    _lineCharCount = 0;

                    var mask = s.GetUChar();
                    _lineX = s.GetDouble();
                    _lineY = s.GetDouble();

                    if ((mask & 0x01) != 0)
                    {
                        _lineEx = 1;
                        _lineEy = 0;
                    }
                    else
                    {
                        _lineEx = s.GetDouble();
                        _lineEy = s.GetDouble();
                    }

                    _lineAscent = s.GetDouble();
                    _lineDescent = s.GetDouble();

                    if ((mask & 0x04) != 0)
                        _lineWidth = s.GetDouble();

                    if ((mask & 0x02) != 0)
                        _lineGidExist = true;
                    else
                        _lineGidExist = false;

                    break;
                }
                case 162:
                {
                    // textline end
                    break;
                }
                case 161:
                {
                    // text transform
                    g.transform(s.GetDouble(), s.GetDouble(), s.GetDouble(), s.GetDouble(), 0, 0);
                    break;
                }
                case 163:
                {
                    // text clip rect reset
                    g.TextClipRect = null;
                    break;
                }
                case 164:
                {
                    // text clip rect
                    g.SetTextClipRect(s.GetDouble(), s.GetDouble(), s.GetDouble(), s.GetDouble());
                    break;
                }
                case 121:
                {
                    var _command_type = s.GetLong();
                    if (32 == _command_type)
                    {
                        if (!g.IsClipContext)
                        {
                            g.m_oContext.save();
                        }

                        g.IsClipContext = true;
                    }
                    else if (64 == _command_type && g.IsClipContext)
                    {
                        g.m_oContext.restore();
                        g.IsClipContext = false;
                    }
                    break;
                }
                case 122:
                {
                    var _command_type = s.GetLong();
                    if (32 == _command_type)
                    {
                        // clip
                        g.m_oContext.clip();
                    }
                    break;
                }
                default:
                {
                    s.pos = page.end;
                }
            }
        }

        // дорисовали страницу. теперь нужно удалить все объекты, у которых страница такая же
        // по идее удаляем только obj
        this.stopRenderingPage(obj.Page);

        if (editor.watermarkDraw)
        {
            g.m_oContext.setTransform(1, 0, 0, 1, 0, 0);
            editor.watermarkDraw.Draw(g.m_oContext, g.m_oContext.canvas.width, g.m_oContext.canvas.height);
        }

        if (bIsFromPaint == 0)
            editor.WordControl.OnScroll();
    },

    GetNearestPos : function(pageNum, x, y)
    {
        var page = this.Pages[pageNum];
        var s = this.getStreamPage(pageNum);
        s.Seek(page.start);

        // textline parameters
        var _line = -1;
        var _glyph = -1;
        var _minDist = 0xFFFFFF;

        // textline parameters
        var _lineX = 0;
        var _lineY = 0;
        var _lineEx = 0;
        var _lineEy = 0;
        var _lineAscent = 0;
        var _lineDescent = 0;
        var _lineWidth = 0;
        var _lineGidExist = false;
        var _linePrevCharX = 0;
        var _lineCharCount = 0;
        var _lineLastGlyphWidth = 0;
        var _arrayGlyphOffsets = [];

        var _numLine = -1;

        var _lenGls = 0;
        var tmp = 0;

        while (s.pos < page.end)
        {
            var command = s.GetUChar();

            switch (command)
            {
                case 41:
                {
                    s.Skip(12);
                    break;
                }
                case 22:
                {
                    s.Skip(4);
                    break;
                }
                case 1:
                {
                    s.Skip(4);
                    break;
                }
                case 3:
                {
                    s.Skip(4);
                    break;
                }
                case 131:
                {
                    break;
                }
                case 130:
                {
                    s.Skip(24);
                    break;
                }
                case 80:
                {
                    if (0 != _lineCharCount)
                        _linePrevCharX += s.GetDouble2();

                    _arrayGlyphOffsets[_lineCharCount] = _linePrevCharX;

                    _lineCharCount++;

                    if (_lineGidExist)
                        s.Skip(4);
                    else
                        s.Skip(2);

                    if (0 == _lineWidth)
                        _lineLastGlyphWidth = s.GetDouble2();
                    else
                        s.Skip(2);

                    break;
                }
                case 98:
                case 100:
                {
                    break;
                }
                case 91:
                {
                    // moveto
                    s.Skip(8);
                    break;
                }
                case 92:
                {
                    // lineto
                    s.Skip(8);
                    break;
                }
                case 94:
                {
                    // curveto
                    s.Skip(24);break;
                }
                case 97:
                {
                    break;
                }
                case 99:
                {
                    // drawpath
                    s.Skip(4);
                    break;
                }
                case 110:
                {
                    // drawImage
                    s.SkipImage();
                    break;
                }
                case 160:
                {
                    // textline
                    _linePrevCharX = 0;
                    _lineCharCount = 0;
                    _lineWidth = 0;

                    _arrayGlyphOffsets.splice(0, _arrayGlyphOffsets.length);

                    ++_numLine;

                    var mask = s.GetUChar();
                    _lineX = s.GetDouble();
                    _lineY = s.GetDouble();

                    if ((mask & 0x01) != 0)
                    {
                        _lineEx = 1;
                        _lineEy = 0;
                    }
                    else
                    {
                        _lineEx = s.GetDouble();
                        _lineEy = s.GetDouble();
                    }

                    _lineAscent = s.GetDouble();
                    _lineDescent = s.GetDouble();

                    if ((mask & 0x04) != 0)
                        _lineWidth = s.GetDouble();

                    if ((mask & 0x02) != 0)
                        _lineGidExist = true;
                    else
                        _lineGidExist = false;

                    break;
                }
                case 162:
                {
                    // textline end

                    // âñå ïîäñ÷èòàíî
                    if (0 == _lineWidth)
                        _lineWidth = _linePrevCharX + _lineLastGlyphWidth;

                    // â ïðèíöèïå êîä îäèí è òîò æå. Íî ïî÷òè âñåãäà ëèíèè ãîðèçîíòàëüíûå.
                    // à äëÿ ãîðèçîíòàëüíîé ëèíèè âñå ìîæíî ïîîïòèìèçèðîâàòü
                    if (_lineEx == 1 && _lineEy == 0)
                    {
                        var _distX = x - _lineX;
                        if (y >= (_lineY - _lineAscent) && y <= (_lineY + _lineDescent) && _distX >= 0 && _distX <= _lineWidth)
                        {
                            // ïîïàëè âíóòðü ëèíèè. Òåïåðü íóæíî íàéòè ãëèô
                            _line = _numLine;

                            _lenGls = _arrayGlyphOffsets.length;
                            for (_glyph = 0; _glyph < _lenGls; _glyph++)
                            {
                                if (_arrayGlyphOffsets[_glyph] > _distX)
                                    break;
                            }
                            if (_glyph > 0)
                                --_glyph;

                            return { Line : _line, Glyph : _glyph };
                        }

                        if (_distX >= 0 && _distX <= _lineWidth)
                            tmp = Math.abs(y - _lineY);
                        else if (_distX < 0)
                        {
                            tmp = Math.sqrt((x - _lineX) * (x - _lineX) + (y - _lineY) * (y - _lineY));
                        }
                        else
                        {
                            var _xx1 = _lineX + _lineWidth;
                            tmp = Math.sqrt((x - _xx1) * (x - _xx1) + (y - _lineY) * (y - _lineY));
                        }

                        if (tmp < _minDist)
                        {
                            _minDist = tmp;
                            _line = _numLine;

                            if (_distX < 0)
                                _glyph = -2;
                            else if (_distX > _lineWidth)
                            {
                                _glyph = -1;
                            }
                            else
                            {
                                _lenGls = _arrayGlyphOffsets.length;
                                for (_glyph = 0; _glyph < _lenGls; _glyph++)
                                {
                                    if (_arrayGlyphOffsets[_glyph] > _distX)
                                        break;
                                }

                                if (_glyph > 0)
                                    _glyph--;
                            }
                        }

                        // Íè÷åãî íå íàäî äåëàòü, óæå íàéäåíà áîëåå "áëèæíÿÿ" ëèíèÿ
                    }
                    else
                    {
                        // îïðåäåëÿåì òî÷êè descent ëèíèè
                        var ortX = -_lineEy;
                        var ortY = _lineEx;

                        var _dx = _lineX + ortX * _lineDescent;
                        var _dy = _lineY + ortY * _lineDescent;

                        // òåïåðü ïðîåêöèè (ñî çíàêîì) íà ëèíèþ descent
                        var h = -((x - _dx) * ortX + (y - _dy) * ortY);
                        var w = (x - _dx) * _lineEx + (y - _dy) * _lineEy;

                        if (w >= 0 && w <= _lineWidth && h >= 0 && h <= (_lineDescent + _lineAscent))
                        {
                            // ïîïàëè âíóòðü ëèíèè. Òåïåðü íóæíî íàéòè ãëèô
                            _line = _numLine;

                            _lenGls = _arrayGlyphOffsets.length;
                            for (_glyph = 0; _glyph < _lenGls; _glyph++)
                            {
                                if (_arrayGlyphOffsets[_glyph] > w)
                                    break;
                            }

                            if (_glyph > 0)
                                _glyph--;

                            return { Line : _line, Glyph : _glyph };
                        }

                        if (w >= 0 && w <= _lineWidth)
                            tmp = Math.abs(h - _lineDescent);
                        else if (w < 0)
                        {
                            tmp = Math.sqrt((x - _lineX) * (x - _lineX) + (y - _lineY) * (y - _lineY));
                        }
                        else
                        {
                            var _tmpX = _lineX + _lineWidth * _lineEx;
                            var _tmpY = _lineY + _lineWidth * _lineEy;
                            tmp = Math.sqrt((x - _tmpX) * (x - _tmpX) + (y - _tmpY) * (y - _tmpY));
                        }

                        //tmp = Math.abs(h - _lineDescent);
                        if (tmp < _minDist)
                        {
                            _minDist = tmp;
                            _line = _numLine;

                            if (w < 0)
                                _glyph = -2;
                            else if (w > _lineWidth)
                                _glyph = -1;
                            else
                            {
                                _lenGls = _arrayGlyphOffsets.length;
                                for (_glyph = 0; _glyph < _lenGls; _glyph++)
                                {
                                    if (_arrayGlyphOffsets[_glyph] > w)
                                        break;
                                }

                                if (_glyph > 0)
                                    _glyph--;
                            }
                        }

                        // Íè÷åãî íå íàäî äåëàòü, óæå íàéäåíà áîëåå "áëèæíÿÿ" ëèíèÿ
                    }

                    break;
                }
                case 161:
                {
                    // text transform
                    s.Skip(16);
                    break;
                }
                case 163:
                {
                    break;
                }
                case 164:
                {
                    s.Skip(16);
                    break;
                }
                case 121:
                case 122:
                {
                    // begin/end command
                    s.Skip(4);
                    break;
                }
                default:
                {
                    s.pos = page.end;
                }
            }
        }

        return { Line : _line, Glyph : _glyph };
    },

    GetCountLines : function(pageNum)
    {
        var page = this.Pages[pageNum];
        var s = this.getStreamPage(pageNum);
        s.Seek(page.start);

        var _lineGidExist = false;
        var _lineCharCount = 0;
        var _numLine = -1;

        while (s.pos < page.end)
        {
            var command = s.GetUChar();

            switch (command)
            {
                case 41:
                {
                    s.Skip(12);
                    break;
                }
                case 22:
                {
                    s.Skip(4);
                    break;
                }
                case 1:
                {
                    s.Skip(4);
                    break;
                }
                case 3:
                {
                    s.Skip(4);
                    break;
                }
                case 131:
                {
                    break;
                }
                case 130:
                {
                    s.Skip(24);
                    break;
                }
                case 80:
                {
                    if (0 != _lineCharCount)
                        s.Skip(2);

                    _lineCharCount++;

                    if (_lineGidExist)
                        s.Skip(4);
                    else
                        s.Skip(2);

                    s.Skip(2);

                    break;
                }
                case 98:
                case 100:
                {
                    break;
                }
                case 91:
                {
                    // moveto
                    s.Skip(8);
                    break;
                }
                case 92:
                {
                    // lineto
                    s.Skip(8);
                    break;
                }
                case 94:
                {
                    // curveto
                    s.Skip(24);break;
                }
                case 97:
                {
                    break;
                }
                case 99:
                {
                    // drawpath
                    s.Skip(4);
                    break;
                }
                case 110:
                {
                    // drawImage
                    s.SkipImage();
                    break;
                }
                case 160:
                {
                    // textline
                    _lineCharCount = 0;
                    ++_numLine;

                    var mask = s.GetUChar();
                    s.Skip(8);

                    if ((mask & 0x01) == 0)
                        s.Skip(8);

                    s.Skip(8);

                    if ((mask & 0x04) != 0)
                        s.Skip(4);

                    if ((mask & 0x02) != 0)
                        _lineGidExist = true;
                    else
                        _lineGidExist = false;

                    break;
                }
                case 162:
                {
                    break;
                }
                case 161:
                {
                    // text transform
                    s.Skip(16);
                    break;
                }
                case 163:
                {
                    break;
                }
                case 164:
                {
                    s.Skip(16);
                    break;
                }
                case 121:
                case 122:
                {
                    // begin/end command
                    s.Skip(4);
                    break;
                }
                default:
                {
                    s.pos = page.end;
                }
            }
        }

        return _numLine;
    },

    DrawSelection : function(pageNum, overlay, xDst, yDst, width, height)
    {
        var sel = this.Selection;
        var Page1 = 0;
        var Page2 = 0;
        var Line1 = 0;
        var Line2 = 0;
        var Glyph1 = 0;
        var Glyph2 = 0;

        if (sel.Page2 > sel.Page1)
        {
            Page1 = sel.Page1;
            Page2 = sel.Page2;
            Line1 = sel.Line1;
            Line2 = sel.Line2;
            Glyph1 = sel.Glyph1;
            Glyph2 = sel.Glyph2;
        }
        else if (sel.Page2 < sel.Page1)
        {
            Page1 = sel.Page2;
            Page2 = sel.Page1;
            Line1 = sel.Line2;
            Line2 = sel.Line1;
            Glyph1 = sel.Glyph2;
            Glyph2 = sel.Glyph1;
        }
        else if (sel.Page1 == sel.Page2)
        {
            Page1 = sel.Page1;
            Page2 = sel.Page2;

            if (sel.Line1 < sel.Line2)
            {
                Line1 = sel.Line1;
                Line2 = sel.Line2;
                Glyph1 = sel.Glyph1;
                Glyph2 = sel.Glyph2;
            }
            else if (sel.Line2 < sel.Line1)
            {
                Line1 = sel.Line2;
                Line2 = sel.Line1;
                Glyph1 = sel.Glyph2;
                Glyph2 = sel.Glyph1;
            }
            else
            {
                Line1 = sel.Line1;
                Line2 = sel.Line2;

                if (-1 == sel.Glyph1)
                {
                    Glyph1 = sel.Glyph2;
                    Glyph2 = sel.Glyph1;
                }
                else if (-1 == sel.Glyph2)
                {
                    Glyph1 = sel.Glyph1;
                    Glyph2 = sel.Glyph2;
                }
                else if (sel.Glyph1 < sel.Glyph2)
                {
                    Glyph1 = sel.Glyph1;
                    Glyph2 = sel.Glyph2;
                }
                else
                {
                    Glyph1 = sel.Glyph2;
                    Glyph2 = sel.Glyph1;
                }
            }
        }

        if (Page1 > pageNum  || Page2 < pageNum)
            return;

        if (Page1 < pageNum)
        {
            Page1 = pageNum;
            Line1 = 0;
            Glyph1 = -2;
        }
        var bIsFillToEnd = false;
        if (Page2 > pageNum)
            bIsFillToEnd = true;

        var page = this.Pages[pageNum];
        var s = this.getStreamPage(pageNum);
        s.Seek(page.start);

        // textline parameters
        var _lineX = 0;
        var _lineY = 0;
        var _lineEx = 0;
        var _lineEy = 0;
        var _lineAscent = 0;
        var _lineDescent = 0;
        var _lineWidth = 0;
        var _lineGidExist = false;
        var _linePrevCharX = 0;
        var _lineCharCount = 0;
        var _lineLastGlyphWidth = 0;
        var _arrayGlyphOffsets = [];

        var _numLine = -1;

        var dKoefX = width / page.width_mm;
        var dKoefY = height / page.height_mm;

        while (s.pos < page.end)
        {
            var command = s.GetUChar();

            switch (command)
            {
                case 41:
                {
                    s.Skip(12);
                    break;
                }
                case 22:
                {
                    s.Skip(4);
                    break;
                }
                case 1:
                {
                    s.Skip(4);
                    break;
                }
                case 3:
                {
                    s.Skip(4);
                    break;
                }
                case 131:
                {
                    break;
                }
                case 130:
                {
                    s.Skip(24);
                    break;
                }
                case 80:
                {
                    if (0 != _lineCharCount)
                        _linePrevCharX += s.GetDouble2();

                    _arrayGlyphOffsets[_lineCharCount] = _linePrevCharX;

                    _lineCharCount++;

                    if (_lineGidExist)
                        s.Skip(4);
                    else
                        s.Skip(2);

                    if (0 == _lineWidth)
                        _lineLastGlyphWidth = s.GetDouble2();
                    else
                        s.Skip(2);

                    break;
                }
                case 98:
                case 100:
                {
                    break;
                }
                case 91:
                {
                    // moveto
                    s.Skip(8);
                    break;
                }
                case 92:
                {
                    // lineto
                    s.Skip(8);
                    break;
                }
                case 94:
                {
                    // curveto
                    s.Skip(24);break;
                }
                case 97:
                {
                    break;
                }
                case 99:
                {
                    // drawpath
                    s.Skip(4);
                    break;
                }
                case 110:
                {
                    // drawImage
                    s.SkipImage();
                    break;
                }
                case 160:
                {
                    // textline
                    _linePrevCharX = 0;
                    _lineCharCount = 0;
                    _lineWidth = 0;

                    _arrayGlyphOffsets.splice(0, _arrayGlyphOffsets.length);

                    ++_numLine;

                    var mask = s.GetUChar();
                    _lineX = s.GetDouble();
                    _lineY = s.GetDouble();

                    if ((mask & 0x01) != 0)
                    {
                        _lineEx = 1;
                        _lineEy = 0;
                    }
                    else
                    {
                        _lineEx = s.GetDouble();
                        _lineEy = s.GetDouble();
                    }

                    _lineAscent = s.GetDouble();
                    _lineDescent = s.GetDouble();

                    if ((mask & 0x04) != 0)
                        _lineWidth = s.GetDouble();

                    if ((mask & 0x02) != 0)
                        _lineGidExist = true;
                    else
                        _lineGidExist = false;

                    break;
                }
                case 162:
                {
                    // textline end
                    var off1 = 0;
                    var off2 = 0;

                    if (_numLine < Line1)
                        break;
                    if (_numLine > Line2 && !bIsFillToEnd)
                        return;

                    // âñå ïîäñ÷èòàíî
                    if (0 == _lineWidth)
                        _lineWidth = _linePrevCharX + _lineLastGlyphWidth;

                    if (Line1 == _numLine)
                    {
                        if (-2 == Glyph1)
                            off1 = 0;
                        else if (-1 == Glyph1)
                            off1 = _lineWidth;
                        else
                            off1 = _arrayGlyphOffsets[Glyph1];
                    }
                    if (bIsFillToEnd || Line2 != _numLine)
                        off2 = _lineWidth;
                    else
                    {
                        if (Glyph2 == -2)
                            off2 = 0;
                        else if (Glyph2 == -1)
                            off2 = _lineWidth;
                        else
                        {
                            off2 = _arrayGlyphOffsets[Glyph2];
                            /*
                            if (Glyph2 >= (_arrayGlyphOffsets.length - 1))
                                off2 = _lineWidth;
                            else
                                off2 = _arrayGlyphOffsets[Glyph2 + 1];
                            */
                        }
                    }

                    if (off2 <= off1)
                        break;

                    // â ïðèíöèïå êîä îäèí è òîò æå. Íî ïî÷òè âñåãäà ëèíèè ãîðèçîíòàëüíûå.
                    // à äëÿ ãîðèçîíòàëüíîé ëèíèè âñå ìîæíî ïîîïòèìèçèðîâàòü
                    if (_lineEx == 1 && _lineEy == 0)
                    {
                        var _x = parseInt(xDst + dKoefX * (_lineX + off1)) - 0.5;
                        var _y = parseInt(yDst + dKoefY * (_lineY - _lineAscent)) - 0.5;

                        var _w = parseInt(dKoefX * (off2 - off1)) + 1;
                        var _h = parseInt(dKoefY * (_lineAscent + _lineDescent)) + 1;

                        if (_x < overlay.min_x)
                            overlay.min_x = _x;
                        if ((_x + _w) > overlay.max_x)
                            overlay.max_x = _x + _w;

                        if (_y < overlay.min_y)
                            overlay.min_y = _y;
                        if ((_y + _h) > overlay.max_y)
                            overlay.max_y = _y + _h;

                        overlay.m_oContext.rect(_x,_y,_w,_h);
                    }
                    else
                    {
                        // îïðåäåëÿåì òî÷êè descent ëèíèè
                        var ortX = -_lineEy;
                        var ortY = _lineEx;

                        var _dx = _lineX + ortX * _lineDescent;
                        var _dy = _lineY + ortY * _lineDescent;

                        var _x1 = _dx + off1 * _lineEx;
                        var _y1 = _dy + off1 * _lineEy;

                        var _x2 = _x1 - ortX * (_lineAscent + _lineDescent);
                        var _y2 = _y1 - ortY * (_lineAscent + _lineDescent);

                        var _x3 = _x2 + (off2 - off1) * _lineEx;
                        var _y3 = _y2 + (off2 - off1) * _lineEy;

                        var _x4 = _x3 + ortX * (_lineAscent + _lineDescent);
                        var _y4 = _y3 + ortY * (_lineAscent + _lineDescent);

                        _x1 = xDst + dKoefX * _x1;
                        _x2 = xDst + dKoefX * _x2;
                        _x3 = xDst + dKoefX * _x3;
                        _x4 = xDst + dKoefX * _x4;

                        _y1 = yDst + dKoefY * _y1;
                        _y2 = yDst + dKoefY * _y2;
                        _y3 = yDst + dKoefY * _y3;
                        _y4 = yDst + dKoefY * _y4;

                        overlay.CheckPoint(_x1, _y1);
                        overlay.CheckPoint(_x2, _y2);
                        overlay.CheckPoint(_x3, _y3);
                        overlay.CheckPoint(_x4, _y4);

                        var ctx = overlay.m_oContext;
                        ctx.moveTo(_x1, _y1);
                        ctx.lineTo(_x2, _y2);
                        ctx.lineTo(_x3, _y3);
                        ctx.lineTo(_x4, _y4);
                        ctx.closePath();
                    }

                    break;
                }
                case 161:
                {
                    // text transform
                    s.Skip(16);
                    break;
                }
                case 163:
                {
                    break;
                }
                case 164:
                {
                    s.Skip(16);
                    break;
                }
                case 121:
                case 122:
                {
                    // begin/end command
                    s.Skip(4);
                    break;
                }
                default:
                {
                    s.pos = page.end;
                }
            }
        }
    },

    CopySelection : function(pageNum, _text_format)
    {
        var ret = "";

        var sel = this.Selection;
        var Page1 = 0;
        var Page2 = 0;
        var Line1 = 0;
        var Line2 = 0;
        var Glyph1 = 0;
        var Glyph2 = 0;

        if (sel.Page2 > sel.Page1)
        {
            Page1 = sel.Page1;
            Page2 = sel.Page2;
            Line1 = sel.Line1;
            Line2 = sel.Line2;
            Glyph1 = sel.Glyph1;
            Glyph2 = sel.Glyph2;
        }
        else if (sel.Page2 < sel.Page1)
        {
            Page1 = sel.Page2;
            Page2 = sel.Page1;
            Line1 = sel.Line2;
            Line2 = sel.Line1;
            Glyph1 = sel.Glyph2;
            Glyph2 = sel.Glyph1;
        }
        else if (sel.Page1 == sel.Page2)
        {
            Page1 = sel.Page1;
            Page2 = sel.Page2;

            if (sel.Line1 < sel.Line2)
            {
                Line1 = sel.Line1;
                Line2 = sel.Line2;
                Glyph1 = sel.Glyph1;
                Glyph2 = sel.Glyph2;
            }
            else if (sel.Line2 < sel.Line1)
            {
                Line1 = sel.Line2;
                Line2 = sel.Line1;
                Glyph1 = sel.Glyph2;
                Glyph2 = sel.Glyph1;
            }
            else
            {
                Line1 = sel.Line1;
                Line2 = sel.Line2;

                if (((sel.Glyph1 != -1) && (sel.Glyph1 < sel.Glyph2)) || (-1 == sel.Glyph2))
                {
                    Glyph1 = sel.Glyph1;
                    Glyph2 = sel.Glyph2;
                }
                else
                {
                    Glyph1 = sel.Glyph2;
                    Glyph2 = sel.Glyph1;
                }
            }
        }

        if (Page1 > pageNum  || Page2 < pageNum)
            return;

        if (Page1 < pageNum)
        {
            Page1 = pageNum;
            Line1 = 0;
            Glyph1 = -2;
        }
        var bIsFillToEnd = false;
        if (Page2 > pageNum)
            bIsFillToEnd = true;


        var page = this.Pages[pageNum];
        var s = this.getStreamPage(pageNum);
        s.Seek(page.start);

        var lineSpans = [];
        var curSpan = new CSpan();
        var isChangeSpan = false;

        var _lineCharCount = 0;
        var _lineGidExist = false;

        var _numLine = -1;

        while (s.pos < page.end)
        {
            var command = s.GetUChar();

            switch (command)
            {
                case 41:
                {
                    curSpan.fontName = s.GetULong();
                    s.Skip(4);
                    curSpan.fontSize = s.GetDouble();
                    isChangeSpan = true;
                    break;
                }
                case 22:
                {
                    curSpan.colorR = s.GetUChar();
                    curSpan.colorG = s.GetUChar();
                    curSpan.colorB = s.GetUChar();
                    s.Skip(1);
                    isChangeSpan = true;
                    break;
                }
                case 1:
                {
                    s.Skip(4);
                    break;
                }
                case 3:
                {
                    s.Skip(4);
                    break;
                }
                case 131:
                {
                    break;
                }
                case 130:
                {
                    s.Skip(24);
                    break;
                }
                case 80:
                {
                    if (0 != _lineCharCount)
                        s.Skip(2);

                    _lineCharCount++;
                    if (isChangeSpan)
                    {
                        lineSpans[lineSpans.length] = curSpan.CreateDublicate();
                    }
                    var sp = lineSpans[lineSpans.length - 1];

                    var _char = s.GetUShort();
                    if (0xFFFF == _char)
                        sp.inner += " ";
                    else
                        sp.inner += String.fromCharCode(_char);

                    if (_lineGidExist)
                        s.Skip(2);

                    s.Skip(2);

                    isChangeSpan = false;
                    break;
                }
                case 98:
                case 100:
                {
                    break;
                }
                case 91:
                {
                    // moveto
                    s.Skip(8);
                    break;
                }
                case 92:
                {
                    // lineto
                    s.Skip(8);
                    break;
                }
                case 94:
                {
                    // curveto
                    s.Skip(24);break;
                }
                case 97:
                {
                    break;
                }
                case 99:
                {
                    // drawpath
                    s.Skip(4);
                    break;
                }
                case 110:
                {
                    // drawImage
                    s.SkipImage();
                    break;
                }
                case 160:
                {
                    // textline
                    isChangeSpan = true;
                    lineSpans.splice(0, lineSpans.length);
                    _lineCharCount = 0;
                    ++_numLine;

                    var mask = s.GetUChar();
                    s.Skip(8);

                    if ((mask & 0x01) == 0)
                    {
                        s.Skip(8);
                    }

                    s.Skip(8);

                    if ((mask & 0x04) != 0)
                        s.Skip(4);

                    if ((mask & 0x02) != 0)
                        _lineGidExist = true;
                    else
                        _lineGidExist = false;

                    break;
                }
                case 162:
                {
                    // textline end
                    // ñïàíû íàáèòû. òåïåðü íóæíî ñôîðìèðîâàòü ëèíèþ è ñãåíåðèðîâàòü íóæíóþ ñòðîêó.
                    if (Line1 <= _numLine && ((!bIsFillToEnd && Line2 >= _numLine) || bIsFillToEnd))
                    {
                        var _g1 = -2;
                        var _g2 = -1;
                        if (Line1 == _numLine)
                        {
                            _g1 = Glyph1;
                        }
                        if (bIsFillToEnd || Line2 != _numLine)
                        {
                            _g2 = -1;
                        }
                        else
                        {
                            _g2 = Glyph2;
                        }

                        if (_g1 != -1 && _g2 != -2)
                        {
                            var textLine = "<p>";

                            if (-2 == _g1 && -1 == _g2)
                            {
                                var countSpans = lineSpans.length;
                                for (var i = 0; i < countSpans; i++)
                                {
                                    textLine += "<span>";
                                    textLine += lineSpans[i].inner;
                                    textLine += "</span>";

                                    if (_text_format)
                                        _text_format.Text += lineSpans[i].inner;
                                }
                            }
                            else
                            {
                                var curIndex = 0;
                                var countSpans = lineSpans.length;
                                for (var i = 0; i < countSpans; i++)
                                {
                                    var old = curIndex;
                                    var start = curIndex;
                                    var end = start + lineSpans[i].inner.length;
                                    curIndex = end;

                                    if (_g1 > start)
                                        start = _g1;
                                    if (_g2 != -1 && _g2 < end)
                                        end = _g2;

                                    if (start > end)
                                        continue;

                                    start -= old;
                                    end -= old;

                                    textLine += "<span>";
                                    textLine += lineSpans[i].inner.substring(start, end);
                                    textLine += "</span>";

                                    if (_text_format)
                                        _text_format.Text += lineSpans[i].inner.substring(start, end);
                                }
                            }

                            textLine += "</p>";

                            if (_text_format)
                                _text_format.Text += "\n";

                            ret += textLine;
                        }
                    }

                    break;
                }
                case 161:
                {
                    // text transform
                    s.Skip(16);
                    break;
                }
                case 163:
                {
                    break;
                }
                case 164:
                {
                    s.Skip(16);
                    break;
                }
                case 121:
                case 122:
                {
                    // begin/end command
                    s.Skip(4);
                    break;
                }
                default:
                {
                    s.pos = page.end;
                }
            }
        }
        return ret;
    },

    SearchPage : function(pageNum, text)
    {
        var page = this.Pages[pageNum];
        var s = this.getStreamPage(pageNum);
        s.Seek(page.start);

        var glyphsEqualFound = 0;
        var glyphsFindCount = text.length;

        if (0 == glyphsFindCount)
            return;

        var _numLine = -1;
        var _lineGidExist = false;
        var _linePrevCharX = 0;
        var _lineCharCount = 0;
        var _lineLastGlyphWidth = 0;

        var _findLine = 0;
        var _findLineOffsetX = 0;
        var _findLineOffsetR = 0;
        var _findGlyphIndex = 0;

        var _SeekToNextPoint = 0;
        var _SeekLinePrevCharX = 0;

        var arrayLines = [];
        var curLine = null;

        while (s.pos < page.end)
        {
            var command = s.GetUChar();

            switch (command)
            {
                case 41:
                {
                    s.Skip(12);
                    break;
                }
                case 22:
                {
                    s.Skip(4);
                    break;
                }
                case 1:
                {
                    s.Skip(4);
                    break;
                }
                case 3:
                {
                    s.Skip(4);
                    break;
                }
                case 131:
                {
                    break;
                }
                case 130:
                {
                    s.Skip(24);
                    break;
                }
                case 80:
                {
                    if (0 != _lineCharCount)
                        _linePrevCharX += s.GetDouble2();

                    _lineCharCount++;

                    var _char = s.GetUShort();
                    if (_lineGidExist)
                        s.Skip(2);

                    if (0xFFFF == _char)
                        curLine.text += " ";
                    else
                        curLine.text += String.fromCharCode(_char);

                    if (curLine.W != 0)
                        s.Skip(2);
                    else
                        curLine.W = s.GetDouble2();

                    break;
                }
                case 98:
                case 100:
                {
                    break;
                }
                case 91:
                {
                    // moveto
                    s.Skip(8);
                    break;
                }
                case 92:
                {
                    // lineto
                    s.Skip(8);
                    break;
                }
                case 94:
                {
                    // curveto
                    s.Skip(24);break;
                }
                case 97:
                {
                    break;
                }
                case 99:
                {
                    // drawpath
                    s.Skip(4);
                    break;
                }
                case 110:
                {
                    // drawImage
                    s.SkipImage();
                    break;
                }
                case 160:
                {
                    _linePrevCharX = 0;
                    _lineCharCount = 0;

                    arrayLines[arrayLines.length] = new CLineInfo();
                    curLine = arrayLines[arrayLines.length - 1];

                    var mask = s.GetUChar();
                    curLine.X = s.GetDouble();
                    curLine.Y = s.GetDouble();

                    if ((mask & 0x01) == 1)
                    {
                        var dAscent = s.GetDouble();
                        var dDescent = s.GetDouble();

                        curLine.Y -= dAscent;
                        curLine.H = dAscent + dDescent;
                    }
                    else
                    {
                        curLine.Ex = s.GetDouble();
                        curLine.Ey = s.GetDouble();

                        var dAscent = s.GetDouble();
                        var dDescent = s.GetDouble();

                        curLine.X = curLine.X + dAscent * curLine.Ey;
                        curLine.Y = curLine.Y - dAscent * curLine.Ex;

                        curLine.H = dAscent + dDescent;
                    }

                    if ((mask & 0x04) != 0)
                        curLine.W = s.GetDouble();

                    if ((mask & 0x02) != 0)
                        _lineGidExist = true;
                    else
                        _lineGidExist = false;

                    break;
                }
                case 162:
                {
                    break;
                }
                case 161:
                {
                    // text transform
                    s.Skip(16);
                    break;
                }
                case 163:
                {
                    break;
                }
                case 164:
                {
                    s.Skip(16);
                    break;
                }
                case 121:
                case 122:
                {
                    // begin/end command
                    s.Skip(4);
                    break;
                }
                default:
                {
                    s.pos = page.end;
                }
            }
        }

        // òåêñò çàïîëíåí. òåïåðü íóæíî ïðîñòî ïðîáåãàòüñÿ è ñìîòðåòü
        // îòêóäà ñîâïàäåíèå íà÷àëîñü è ãäå çàêîí÷èëîñü
        _linePrevCharX = 0;
        _lineCharCount = 0;
        _numLine = 0;

        s.Seek(page.start);

        while (s.pos < page.end)
        {
            var command = s.GetUChar();

            switch (command)
            {
                case 41:
                {
                    s.Skip(12);
                    break;
                }
                case 22:
                {
                    s.Skip(4);
                    break;
                }
                case 1:
                {
                    s.Skip(4);
                    break;
                }
                case 3:
                {
                    s.Skip(4);
                    break;
                }
                case 131:
                {
                    break;
                }
                case 130:
                {
                    s.Skip(24);
                    break;
                }
                case 80:
                {
                    if (0 != _lineCharCount)
                        _linePrevCharX += s.GetDouble2();

                    _lineCharCount++;

                    var _char = s.GetUShort();
                    if (_lineGidExist)
                        s.Skip(2);

                    if (0xFFFF == _char)
                        _char = " ".charCodeAt(0);

                    _lineLastGlyphWidth = s.GetDouble2();
                    if (_char == text.charCodeAt(glyphsEqualFound))
                    {
                        if (0 == glyphsEqualFound)
                        {
                            _findLine = _numLine;
                            _findLineOffsetX = _linePrevCharX;
                            _findGlyphIndex = _lineCharCount;

                            _SeekToNextPoint = s.pos;
                            _SeekLinePrevCharX = _linePrevCharX;
                        }

                        glyphsEqualFound++;
                        _findLineOffsetR = _linePrevCharX + _lineLastGlyphWidth;
                        if (glyphsFindCount == glyphsEqualFound)
                        {
                            var _text = "";
                            var _rects = [];
                            for (var i = _findLine; i <= _numLine; i++)
                            {
                                var ps = 0;
                                if (_findLine == i)
                                    ps = _findLineOffsetX;
                                var pe = arrayLines[i].W;
                                if (i == _numLine)
                                    pe = _findLineOffsetR;

                                var _l = arrayLines[i];
                                if (i == _findLine && i == _numLine)
                                {
                                    _text = _l.text.substring(0, _findGlyphIndex - 1);
                                    _text += "<b>";
                                    _text += _l.text.substring(_findGlyphIndex - 1, _lineCharCount);
                                    _text += "</b>";
                                    _text += _l.text.substring(_lineCharCount);
                                }
                                else if (i == _findLine)
                                {
                                    _text = _l.text.substring(0, _findGlyphIndex - 1);
                                    _text += "<b>";
                                    _text += _l.text.substring(_findGlyphIndex - 1);
                                }
                                else if (i == _numLine)
                                {
                                    _text += _l.text.substring(0, _lineCharCount);
                                    _text += "</b>";
                                    _text += _l.text.substring(_lineCharCount);
                                }
                                else
                                {
                                    _text += _l.text;
                                }

                                if (_l.Ex == 1 && _l.Ey == 0)
                                {
                                    _rects[_rects.length] = { PageNum : pageNum, X : _l.X + ps, Y : _l.Y, W : pe - ps, H : _l.H };
                                }
                                else
                                {
                                    _rects[_rects.length] = { PageNum : pageNum, X : _l.X + ps * _l.Ex, Y : _l.Y + ps * _l.Ey, W : pe - ps, H : _l.H, Ex : _l.Ex, Ey : _l.Ey };
                                }
                            }

                            //console.log(_text);
                            editor.WordControl.m_oDrawingDocument.AddPageSearch(_text, _rects, search_Common);

                            /*
                            // âñå íàéäåíî. íóæíî äîáàâèòü ðåêòû
                            if (_findLineEx == 1 && _findLineEy == 0)
                            {
                                var navigator = { Page : pageNum, X: _findLineX + _findLineOffsetX, Y: _findLineY - _findAscent,
                                    W : (_findLineOffsetR - _findLineOffsetX) , H : (_findAscent + _findDescent) };

                                var _find = { text: "", navigator : navigator };
                                editor.WordControl.m_oApi.sync_SearchFoundCallback(_find);

                                var _rect = [];
                                _rect[0] = { PageNum : pageNum, X : navigator.X, Y : navigator.Y, W : navigator.W, H : navigator.H };
                                editor.WordControl.m_oDrawingDocument.AddPageSearch("", _rect);
                            }
                            else
                            {
                                var ortX = _findLineEx;
                                var ortY = -_findLineEy;

                                var _x = _lineX + ortX * _findAscent;
                                var _y = _lineY + ortY * _findAscent;

                                var navigator = { Page : pageNum, X: _x, Y: _y,
                                    W : (_findLineOffsetR - _findLineOffsetX) , H : (_findAscent + _findDescent),
                                    Ex: _findLineEx, Ey: _findLineEy };

                                var _find = { text: "", navigator : navigator };
                                editor.WordControl.m_oApi.sync_SearchFoundCallback(_find);
                            }
                            */

                            // íóæíî âåðíóòüñÿ è ïîïðîáîâàòü èñêàòü ñî ñëåä áóêâû.
                            glyphsEqualFound = 0;
                            s.pos = _SeekToNextPoint;
                            _linePrevCharX = _SeekLinePrevCharX;
                            _lineCharCount = _findGlyphIndex;
                            _numLine = _findLine;
                        }
                    }
                    else
                    {
                        if (0 != glyphsEqualFound)
                        {
                            // íóæíî âåðíóòüñÿ è ïîïðîáîâàòü èñêàòü ñî ñëåä áóêâû.
                            glyphsEqualFound = 0;
                            s.pos = _SeekToNextPoint;
                            _linePrevCharX = _SeekLinePrevCharX;
                            _lineCharCount = _findGlyphIndex;
                            _numLine = _findLine;
                        }
                    }

                    break;
                }
                case 98:
                case 100:
                {
                    break;
                }
                case 91:
                {
                    // moveto
                    s.Skip(8);
                    break;
                }
                case 92:
                {
                    // lineto
                    s.Skip(8);
                    break;
                }
                case 94:
                {
                    // curveto
                    s.Skip(24);break;
                }
                case 97:
                {
                    break;
                }
                case 99:
                {
                    // drawpath
                    s.Skip(4);
                    break;
                }
                case 110:
                {
                    // drawImage
                    s.SkipImage();
                    break;
                }
                case 160:
                {
                    // textline
                    _linePrevCharX = 0;
                    _lineCharCount = 0;

                    var mask = s.GetUChar();
                    s.Skip(8);

                    if ((mask & 0x01) == 0)
                        s.Skip(8);

                    s.Skip(8);

                    if ((mask & 0x04) != 0)
                        s.Skip(4);

                    if ((mask & 0x02) != 0)
                        _lineGidExist = true;
                    else
                        _lineGidExist = false;

                    break;
                }
                case 162:
                {
                    ++_numLine;
                    break;
                }
                case 161:
                {
                    // text transform
                    s.Skip(16);
                    break;
                }
                case 163:
                {
                    break;
                }
                case 164:
                {
                    s.Skip(16);
                    break;
                }
                case 121:
                case 122:
                {
                    // begin/end command
                    s.Skip(4);
                    break;
                }
                default:
                {
                    s.pos = page.end;
                }
            }
        }
    },

    SearchPage2 : function(pageNum)
    {
        var page = this.Pages[pageNum];
        var s = this.getStreamPage(pageNum);
        s.Seek(page.start);

        var _searchResults = this.SearchResults;
        var _navRects = _searchResults.Pages[pageNum];

        var glyphsEqualFound = 0;
        var text = _searchResults.Text;
        var glyphsFindCount = text.length;

        if (!_searchResults.MachingCase)
        {
            text = text.toLowerCase();
        }

        if (0 == glyphsFindCount)
            return;

        var _numLine = -1;
        var _lineGidExist = false;
        var _linePrevCharX = 0;
        var _lineCharCount = 0;
        var _lineLastGlyphWidth = 0;

        var _findLine = 0;
        var _findLineOffsetX = 0;
        var _findLineOffsetR = 0;
        var _findGlyphIndex = 0;

        var _SeekToNextPoint = 0;
        var _SeekLinePrevCharX = 0;

        var arrayLines = [];
        var curLine = null;

        while (s.pos < page.end)
        {
            var command = s.GetUChar();

            switch (command)
            {
                case 41:
                {
                    s.Skip(12);
                    break;
                }
                case 22:
                {
                    s.Skip(4);
                    break;
                }
                case 1:
                {
                    s.Skip(4);
                    break;
                }
                case 3:
                {
                    s.Skip(4);
                    break;
                }
                case 131:
                {
                    break;
                }
                case 130:
                {
                    s.Skip(24);
                    break;
                }
                case 80:
                {
                    if (0 != _lineCharCount)
                        _linePrevCharX += s.GetDouble2();

                    _lineCharCount++;

                    var _char = s.GetUShort();
                    if (_lineGidExist)
                        s.Skip(2);

                    if (0xFFFF == _char)
                        curLine.text += " ";
                    else
                        curLine.text += String.fromCharCode(_char);

                    if (curLine.W != 0)
                        s.Skip(2);
                    else
                        curLine.W = s.GetDouble2();

                    break;
                }
                case 98:
                case 100:
                {
                    break;
                }
                case 91:
                {
                    // moveto
                    s.Skip(8);
                    break;
                }
                case 92:
                {
                    // lineto
                    s.Skip(8);
                    break;
                }
                case 94:
                {
                    // curveto
                    s.Skip(24);break;
                }
                case 97:
                {
                    break;
                }
                case 99:
                {
                    // drawpath
                    s.Skip(4);
                    break;
                }
                case 110:
                {
                    // drawImage
                    s.SkipImage();
                    break;
                }
                case 160:
                {
                    _linePrevCharX = 0;
                    _lineCharCount = 0;

                    arrayLines[arrayLines.length] = new CLineInfo();
                    curLine = arrayLines[arrayLines.length - 1];

                    var mask = s.GetUChar();
                    curLine.X = s.GetDouble();
                    curLine.Y = s.GetDouble();

                    if ((mask & 0x01) == 1)
                    {
                        var dAscent = s.GetDouble();
                        var dDescent = s.GetDouble();

                        curLine.Y -= dAscent;
                        curLine.H = dAscent + dDescent;
                    }
                    else
                    {
                        curLine.Ex = s.GetDouble();
                        curLine.Ey = s.GetDouble();

                        var dAscent = s.GetDouble();
                        var dDescent = s.GetDouble();

                        curLine.X = curLine.X + dAscent * curLine.Ey;
                        curLine.Y = curLine.Y - dAscent * curLine.Ex;

                        curLine.H = dAscent + dDescent;
                    }

                    if ((mask & 0x04) != 0)
                        curLine.W = s.GetDouble();

                    if ((mask & 0x02) != 0)
                        _lineGidExist = true;
                    else
                        _lineGidExist = false;

                    break;
                }
                case 162:
                {
                    break;
                }
                case 161:
                {
                    // text transform
                    s.Skip(16);
                    break;
                }
                case 163:
                {
                    break;
                }
                case 164:
                {
                    s.Skip(16);
                    break;
                }
                case 121:
                case 122:
                {
                    // begin/end command
                    s.Skip(4);
                    break;
                }
                default:
                {
                    s.pos = page.end;
                }
            }
        }

        // òåêñò çàïîëíåí. òåïåðü íóæíî ïðîñòî ïðîáåãàòüñÿ è ñìîòðåòü
        // îòêóäà ñîâïàäåíèå íà÷àëîñü è ãäå çàêîí÷èëîñü
        _linePrevCharX = 0;
        _lineCharCount = 0;
        _numLine = 0;

        s.Seek(page.start);

        while (s.pos < page.end)
        {
            var command = s.GetUChar();

            switch (command)
            {
                case 41:
                {
                    s.Skip(12);
                    break;
                }
                case 22:
                {
                    s.Skip(4);
                    break;
                }
                case 1:
                {
                    s.Skip(4);
                    break;
                }
                case 3:
                {
                    s.Skip(4);
                    break;
                }
                case 131:
                {
                    break;
                }
                case 130:
                {
                    s.Skip(24);
                    break;
                }
                case 80:
                {
                    if (0 != _lineCharCount)
                        _linePrevCharX += s.GetDouble2();

                    _lineCharCount++;

                    var _char = s.GetUShort();
                    if (_lineGidExist)
                        s.Skip(2);

                    if (0xFFFF == _char)
                        _char = " ".charCodeAt(0);

                    _lineLastGlyphWidth = s.GetDouble2();

                    var _isFound = false;
                    if (_searchResults.MachingCase)
                    {
                        if (_char == text.charCodeAt(glyphsEqualFound))
                            _isFound = true;
                    }
                    else
                    {
                        var _strMem = String.fromCharCode(_char);
                        _strMem = _strMem.toLowerCase();
                        if (_strMem.charCodeAt(0) == text.charCodeAt(glyphsEqualFound))
                            _isFound = true;
                    }

                    if (_isFound)
                    {
                        if (0 == glyphsEqualFound)
                        {
                            _findLine = _numLine;
                            _findLineOffsetX = _linePrevCharX;
                            _findGlyphIndex = _lineCharCount;

                            _SeekToNextPoint = s.pos;
                            _SeekLinePrevCharX = _linePrevCharX;
                        }

                        glyphsEqualFound++;
                        _findLineOffsetR = _linePrevCharX + _lineLastGlyphWidth;
                        if (glyphsFindCount == glyphsEqualFound)
                        {
                            var _rects = [];
                            for (var i = _findLine; i <= _numLine; i++)
                            {
                                var ps = 0;
                                if (_findLine == i)
                                    ps = _findLineOffsetX;
                                var pe = arrayLines[i].W;
                                if (i == _numLine)
                                    pe = _findLineOffsetR;

                                var _l = arrayLines[i];
                                if (_l.Ex == 1 && _l.Ey == 0)
                                {
                                    _rects[_rects.length] = { PageNum : pageNum, X : _l.X + ps, Y : _l.Y, W : pe - ps, H : _l.H };
                                }
                                else
                                {
                                    _rects[_rects.length] = { PageNum : pageNum, X : _l.X + ps * _l.Ex, Y : _l.Y + ps * _l.Ey, W : pe - ps, H : _l.H, Ex : _l.Ex, Ey : _l.Ey };
                                }
                            }

                            _navRects[_navRects.length] = _rects;

                            // íóæíî âåðíóòüñÿ è ïîïðîáîâàòü èñêàòü ñî ñëåä áóêâû.
                            glyphsEqualFound = 0;
                            s.pos = _SeekToNextPoint;
                            _linePrevCharX = _SeekLinePrevCharX;
                            _lineCharCount = _findGlyphIndex;
                            _numLine = _findLine;
                        }
                    }
                    else
                    {
                        if (0 != glyphsEqualFound)
                        {
                            // íóæíî âåðíóòüñÿ è ïîïðîáîâàòü èñêàòü ñî ñëåä áóêâû.
                            glyphsEqualFound = 0;
                            s.pos = _SeekToNextPoint;
                            _linePrevCharX = _SeekLinePrevCharX;
                            _lineCharCount = _findGlyphIndex;
                            _numLine = _findLine;
                        }
                    }

                    break;
                }
                case 98:
                case 100:
                {
                    break;
                }
                case 91:
                {
                    // moveto
                    s.Skip(8);
                    break;
                }
                case 92:
                {
                    // lineto
                    s.Skip(8);
                    break;
                }
                case 94:
                {
                    // curveto
                    s.Skip(24);break;
                }
                case 97:
                {
                    break;
                }
                case 99:
                {
                    // drawpath
                    s.Skip(4);
                    break;
                }
                case 110:
                {
                    // drawImage
                    s.SkipImage();
                    break;
                }
                case 160:
                {
                    // textline
                    _linePrevCharX = 0;
                    _lineCharCount = 0;

                    var mask = s.GetUChar();
                    s.Skip(8);

                    if ((mask & 0x01) == 0)
                        s.Skip(8);

                    s.Skip(8);

                    if ((mask & 0x04) != 0)
                        s.Skip(4);

                    if ((mask & 0x02) != 0)
                        _lineGidExist = true;
                    else
                        _lineGidExist = false;

                    break;
                }
                case 162:
                {
                    ++_numLine;
                    break;
                }
                case 161:
                {
                    // text transform
                    s.Skip(16);
                    break;
                }
                case 163:
                {
                    break;
                }
                case 164:
                {
                    s.Skip(16);
                    break;
                }
                case 121:
                case 122:
                {
                    // begin/end command
                    s.Skip(4);
                    break;
                }
                default:
                {
                    s.pos = page.end;
                }
            }
        }
    },

    OnMouseDown : function(page, x, y)
    {
        var ret = this.GetNearestPos(page, x, y);

        var sel = this.Selection;
        sel.Page1 = page;
        sel.Line1 = ret.Line;
        sel.Glyph1 = ret.Glyph;

        sel.Page2 = page;
        sel.Line2 = ret.Line;
        sel.Glyph2 = ret.Glyph;

        sel.IsSelection = true;
        this.OnUpdateSelection();
    },

    OnMouseMove : function(page, x, y)
    {
        if (false === this.Selection.IsSelection)
            return;

        var ret = this.GetNearestPos(page, x, y);

        var sel = this.Selection;
        sel.Page2 = page;
        sel.Line2 = ret.Line;
        sel.Glyph2 = ret.Glyph;

        this.OnUpdateSelection();
    },

    OnMouseUp : function()
    {
        if (this.Selection.IsSelection)
            editor.sendEvent("asc_onSelectionEnd");
        this.Selection.IsSelection = false;
    },

    OnUpdateSelection : function()
    {
        editor.WordControl.m_oOverlayApi.Show();
        editor.WordControl.OnUpdateOverlay();
    },

    Copy : function(_text_format)
    {
        var sel = this.Selection;
        var page1 = sel.Page1;
        var page2 = sel.Page2;

        if (page2 < page1)
        {
            page1 = page2;
            page2 = sel.Page1;
        }

        var ret = "<div>";
        for (var i = page1; i <= page2; i++)
        {
            ret += this.CopySelection(i, _text_format);
        }
        ret += "</div>";

        //console.log(ret);
        return ret;
    },

    OnKeyDown : function(e)
    {
        if (!editor.bInit_word_control)
            return false;

        var bRetValue = false;

        if ( e.KeyCode == 33 ) // PgUp
        {
            editor.WordControl.m_oScrollVerApi.scrollByY(-editor.WordControl.m_oEditor.HtmlElement.height, false);
        }
        else if ( e.KeyCode == 34 ) // PgDn
        {
            editor.WordControl.m_oScrollVerApi.scrollByY(editor.WordControl.m_oEditor.HtmlElement.height, false);
        }
        else if ( e.KeyCode == 35 ) // êëàâèøà End
        {
            if ( true === e.CtrlKey ) // Ctrl + End - ïåðåõîä â êîíåö äîêóìåíòà
            {
                editor.WordControl.m_oScrollVerApi.scrollToY(editor.WordControl.m_dScrollY_max, false);
            }

            bRetValue = true;
        }
        else if ( e.KeyCode == 36 ) // êëàâèøà Home
        {
            if ( true === e.CtrlKey ) // Ctrl + Home - ïåðåõîä â íà÷àëî äîêóìåíòà
            {
                editor.WordControl.m_oScrollVerApi.scrollToY(0, false);
            }

            bRetValue = true;
        }
        else if ( e.KeyCode == 37 ) // Left Arrow
        {
            bRetValue = true;
        }
        else if ( e.KeyCode == 38 ) // Top Arrow
        {
            bRetValue = true;
        }
        else if ( e.KeyCode == 39 ) // Right Arrow
        {
            bRetValue = true;
        }
        else if ( e.KeyCode == 40 ) // Bottom Arrow
        {
            bRetValue = true;
        }
        else if ( e.KeyCode == 65 && true === e.CtrlKey ) // Ctrl + A - âûäåëÿåì âñå
        {
            bRetValue = true;

            if (this.selectAllCheckStart())
            {
                this.selectAll();
            }
        }
		else if ( e.KeyCode == 80 && true === e.CtrlKey ) // Ctrl + P + ...
        {
            editor.onPrint();
            bRetValue = true;
        }
        else if ( e.KeyCode == 83 && true === e.CtrlKey ) // Ctrl + S + ...
        {
            // nothing
            bRetValue = true;
        }

        return bRetValue;
    },

    selectAll : function()
    {
        var sel = this.Selection;

        sel.Page1 = 0;
        sel.Line1 = 0;
        sel.Glyph1 = 0;

        sel.Page2 = 0;
        sel.Line2 = 0;
        sel.Glyph2 = 0;

        sel.IsSelection = false;

        if (0 != this.PagesCount)
        {
            var lLinesLastPage = this.GetCountLines(this.PagesCount - 1);
            if (1 != this.PagesCount || 0 != lLinesLastPage)
            {
                sel.Glyph1 = -2;
                sel.Page2 = this.PagesCount - 1;
                sel.Line2 = lLinesLastPage;
                sel.Glyph2 = -1;

                this.OnUpdateSelection();
            }
        }

        editor.sendEvent("asc_onSelectionEnd");
    },

    selectAllCheckStart : function()
    {
        this.waitSelectAll = false;
        return true;
    },

    selectAllCheckEnd : function()
    {
    },

    StartSearch : function(text)
    {
        editor.WordControl.m_oDrawingDocument.StartSearch();

        this.SearchInfo.Text = text;
        this.SearchInfo.Page = 0;

        var oThis = this;
        this.SearchInfo.Id = setTimeout(function(){oThis.OnSearchPage();}, 1);
    },

    OnSearchPage : function()
    {
        this.SearchPage(this.SearchInfo.Page, this.SearchInfo.Text);
        this.SearchInfo.Page++;

        if (this.SearchInfo.Page >= this.PagesCount)
        {
            this.StopSearch();
            return;
        }

        var oThis = this;
        this.SearchInfo.Id = setTimeout(function(){oThis.OnSearchPage();}, 1);
    },

    StopSearch : function()
    {
        if (null != this.SearchInfo.Id)
        {
            clearTimeout(this.SearchInfo.Id);
            this.SearchInfo.Id = null;
        }
        editor.WordControl.m_oDrawingDocument.EndSearch(false);
    },

    findText : function(text, isMachingCase, isNext)
    {
        this.SearchResults.IsSearch = true;
        if (text == this.SearchResults.Text && isMachingCase == this.SearchResults.MachingCase)
        {
            if (this.SearchResults.Count == 0)
            {
                editor.WordControl.m_oDrawingDocument.CurrentSearchNavi = null;
                this.SearchResults.CurrentPage = -1;
                this.SearchResults.Current = -1;
                return;
            }

            // поиск совпал, просто делаем навигацию к нужному месту
            if (isNext)
            {
                if ((this.SearchResults.Current + 1) < this.SearchResults.Pages[this.SearchResults.CurrentPage].length)
                {
                    // результат на этой же странице
                    this.SearchResults.Current++;
                }
                else
                {
                    var _pageFind = this.SearchResults.CurrentPage + 1;
                    var _bIsFound = false;
                    for (var i = _pageFind; i < this.PagesCount; i++)
                    {
                        if (0 < this.SearchResults.Pages[i].length)
                        {
                            this.SearchResults.Current = 0;
                            this.SearchResults.CurrentPage = i;
                            _bIsFound = true;
                            break;
                        }
                    }
                    if (!_bIsFound)
                    {
                        for (var i = 0; i < _pageFind; i++)
                        {
                            if (0 < this.SearchResults.Pages[i].length)
                            {
                                this.SearchResults.Current = 0;
                                this.SearchResults.CurrentPage = i;
                                _bIsFound = true;
                                break;
                            }
                        }
                    }
                }
            }
            else
            {
                if (this.SearchResults.Current > 0)
                {
                    // результат на этой же странице
                    this.SearchResults.Current--;
                }
                else
                {
                    var _pageFind = this.SearchResults.CurrentPage - 1;
                    var _bIsFound = false;
                    for (var i = _pageFind; i >= 0; i--)
                    {
                        if (0 < this.SearchResults.Pages[i].length)
                        {
                            this.SearchResults.Current = this.SearchResults.Pages[i].length - 1;
                            this.SearchResults.CurrentPage = i;
                            _bIsFound = true;
                            break;
                        }
                    }
                    if (!_bIsFound)
                    {
                        for (var i = this.PagesCount - 1; i > _pageFind; i--)
                        {
                            if (0 < this.SearchResults.Pages[i].length)
                            {
                                this.SearchResults.Current = this.SearchResults.Pages[i].length - 1;
                                this.SearchResults.CurrentPage = i;
                                _bIsFound = true;
                                break;
                            }
                        }
                    }
                }
            }

            editor.WordControl.m_oDrawingDocument.CurrentSearchNavi =
                this.SearchResults.Pages[this.SearchResults.CurrentPage][this.SearchResults.Current];

            editor.WordControl.ToSearchResult();
            return;
        }
        // новый поиск
        for (var i = 0; i < this.PagesCount; i++)
        {
            this.SearchResults.Pages[i].splice(0,  this.SearchResults.Pages[i].length);
        }
        this.SearchResults.Count = 0;

        this.SearchResults.CurrentPage = -1;
        this.SearchResults.Current = -1;

        this.SearchResults.Text = text;
        this.SearchResults.MachingCase = isMachingCase;

        for (var i = 0; i < this.PagesCount; i++)
        {
            this.SearchPage2(i);
            this.SearchResults.Count += this.SearchResults.Pages[i].length;
        }

        if (this.SearchResults.Count == 0)
        {
            editor.WordControl.m_oDrawingDocument.CurrentSearchNavi = null;
            editor.WordControl.OnUpdateOverlay();
            return;
        }

        for (var i = 0; i < this.SearchResults.Pages.length; i++)
        {
            if (0 != this.SearchResults.Pages[i].length)
            {
                this.SearchResults.CurrentPage = i;
                this.SearchResults.Current = 0;

                break;
            }
        }

        editor.WordControl.m_oDrawingDocument.CurrentSearchNavi =
            this.SearchResults.Pages[this.SearchResults.CurrentPage][this.SearchResults.Current];

        editor.WordControl.ToSearchResult();
    },

    GetCachedImage : function(_src)
    {
        if (0 == this.CachedImagesCount)
            return null;

        var _len = this.CachedImages.length;
        for (var i = 0; i < _len; i++)
        {
            if (this.CachedImages[i].src == _src)
                return this.CachedImages[i].image;
        }
        return  null;
    },

    SetCachedImage : function(_src, _image)
    {
        if (0 == this.CachedImagesCount)
            return;

        if (this.CachedImages.length == this.CachedImagesCount)
            this.CachedImages.shift();

		this.CachedImages.push({ src: _src, image: _image });
    }
};

//------------------------------------------------------------export----------------------------------------------------
window['AscCommonWord'] = window['AscCommonWord'] || {};
window['AscCommonWord'].CDocMeta = CDocMeta;
