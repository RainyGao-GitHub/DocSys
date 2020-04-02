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

/*
    PLACEHOLDERS
 */
(function(window, undefined){

    var AscCommon = window['AscCommon'];

    AscCommon.PlaceholderButtonType = {
    	Image : 0,
        ImageUrl : 1,
		Chart : 2,
		Table : 3,
        Video : 4,
        Audio : 5
	};

    var exportObj = AscCommon.PlaceholderButtonType;
    AscCommon["PlaceholderButtonType"] = exportObj;
    exportObj["Image"] = exportObj.Image;
    exportObj["ImageUrl"] = exportObj.ImageUrl;
    exportObj["Chart"] = exportObj.Chart;
    exportObj["Table"] = exportObj.Table;
    exportObj["Video"] = exportObj.Video;
    exportObj["Audio"] = exportObj.Audio;

    AscCommon.PlaceholderButtonState = {
        None : 0,
        Active : 1,
        Over : 2
    };

    var ButtonSize1x = 42;
    var ButtonImageSize1x = 28;
    var ButtonBetweenSize1x = 8;

    function PlaceholderIcons()
    {
        function PI()
        {
            this.images = [];
            this.load = function(type, url)
            {
                this.images[0] = new Image();
                this.images[0].onload = function() { this.asc_complete = true; };
                this.images[0].src = "../../../../sdkjs/common/Images/placeholders/" + url + ".png";
                AscCommon.backoffOnErrorImg(this.images[0]);

                this.images[1] = new Image();
                this.images[1].onload = function() { this.asc_complete = true; };
                this.images[1].src = "../../../../sdkjs/common/Images/placeholders/" + url + "@2x.png";
                AscCommon.backoffOnErrorImg(this.images[1]);
            };
            this.loadActive = function(url)
            {
                this.images[2] = new Image();
                this.images[2].onload = function() { this.asc_complete = true; };
                this.images[2].src = "../../../../sdkjs/common/Images/placeholders/" + url + "_active.png";
                AscCommon.backoffOnErrorImg(this.images[2]);

                this.images[3] = new Image();
                this.images[3].onload = function() { this.asc_complete = true; };
                this.images[3].src = "../../../../sdkjs/common/Images/placeholders/" + url + "_active@2x.png";
                AscCommon.backoffOnErrorImg(this.images[3]);
            };
            this.get = function()
            {
                var index = AscCommon.AscBrowser.isRetina ? 1 : 0;
                return this.images[index].asc_complete ? this.images[index] : null;
            };
            this.getActive = function()
            {
                var index = AscCommon.AscBrowser.isRetina ? 3 : 2;
                return this.images[index].asc_complete ? this.images[index] : null;
            };
        }

        this.images = [];

        this.register = function(type, url, support_active)
        {
            this.images[type] = new PI();
            this.images[type].load(type, url);
            support_active && this.images[type].loadActive(url);
        };
        this.get = function(type)
        {
        	return this.images[type] ? this.images[type].get() : null;
        };
        this.getActive = function(type)
        {
            return this.images[type] ? this.images[type].getActive() : null;
        };
    }

    AscCommon.CreateDrawingPlaceholder = function(id, buttons, page, rect, transform)
	{
		var placeholder = new Placeholder();
		placeholder.id = id;
		placeholder.buttons = buttons;
		placeholder.anchor.page = page;
		placeholder.anchor.rect = rect;
        placeholder.anchor.transform = transform;

        for (var i = 0; i < placeholder.buttons.length; i++)
            placeholder.states[i] = AscCommon.PlaceholderButtonState.None;

        return placeholder;
	};

    // объект плейсхордер - может содержать в себе несколько кнопок
	// сам решает, где и как рисовать
	function Placeholder()
	{
		this.events = null; // Placeholders

		// id button (parent shape id)
		this.id = null;

		// list of buttons {AscCommon.PlaceholderButtonType}
		this.buttons = [];
        this.states = []; // states

		// position
		this.anchor = {
			page : -1,
			rect : { x : 0, y : 0, w : 0, h : 0 },
			transform : null
		};
	}

	Placeholder.prototype.getCenterInPixels = function(pixelsRect, pageWidthMM, pageHeightMM)
    {
        var cx = this.anchor.rect.x + this.anchor.rect.w / 2;
        var cy = this.anchor.rect.y + this.anchor.rect.h / 2;
        if (this.anchor.transform)
        {
            var tmpCx = cx;
            var tmpCy = cy;
            cx = this.anchor.transform.TransformPointX(tmpCx, tmpCy);
            cy = this.anchor.transform.TransformPointY(tmpCx, tmpCy);
        }

        return {
            x : (0.5 + pixelsRect.left + cx * (pixelsRect.right - pixelsRect.left) / pageWidthMM) >> 0,
            y : (0.5 + pixelsRect.top + cy * (pixelsRect.bottom - pixelsRect.top) / pageHeightMM) >> 0
        };
    };

	// расчет всех ректов кнопок
    Placeholder.prototype.getButtonRects = function(pointCenter, scale)
	{
	    //координаты ретины - масштабируются при отрисовке
        var ButtonSize = ButtonSize1x;//AscCommon.AscBrowser.convertToRetinaValue(ButtonSize1x, true);
        var ButtonBetweenSize = ButtonBetweenSize1x;//AscCommon.AscBrowser.convertToRetinaValue(ButtonBetweenSize1x, true);

		// максимум 2 ряда
		var buttonsCount = this.buttons.length;
		var countColumn = (buttonsCount < 3) ? buttonsCount : (this.buttons.length + 1) >> 1;
		var countColumn2 = buttonsCount - countColumn;

		var sizeAllHor = (countColumn * ButtonSize + (countColumn - 1) * ButtonBetweenSize);
        var sizeAllHor2 = (countColumn2 * ButtonSize + (countColumn2 - 1) * ButtonBetweenSize);
        var sizeAllVer = buttonsCount > 0 ? ButtonSize : 0;
        if (buttonsCount > countColumn)
            sizeAllVer += (ButtonSize + ButtonBetweenSize);

        var parentW = (this.anchor.rect.w * scale.x) >> 0;
        var parentH = (this.anchor.rect.h * scale.y) >> 0;

        if ((sizeAllHor + (ButtonBetweenSize << 1)) > parentW || (sizeAllVer + (ButtonBetweenSize << 1)) > parentH)
            return [];

		var xStart = pointCenter.x - (sizeAllHor >> 1);
        var yStart = pointCenter.y - (((buttonsCount == countColumn) ? ButtonSize : (2 * ButtonSize + ButtonBetweenSize)) >> 1);

		var ret = [];
		var x = xStart;
		var y = yStart;
		var i = 0;
		while (i < countColumn)
		{
			ret.push({x : x, y : y});
			x += (ButtonSize + ButtonBetweenSize);
			i++;
		}

		x = xStart + ((sizeAllHor - sizeAllHor2) >> 1);
        y = yStart + ButtonSize + ButtonBetweenSize;
        while (i < buttonsCount)
        {
            ret.push({x : x, y : y});
            x += (ButtonSize + ButtonBetweenSize);
            i++;
        }

        return ret;
	};

	Placeholder.prototype.isInside = function(x, y, pixelsRect, pageWidthMM, pageHeightMM, pointMenu)
    {
        var pointCenter = this.getCenterInPixels(pixelsRect, pageWidthMM, pageHeightMM);
        var scale = {
            x : (pixelsRect.right - pixelsRect.left) / pageWidthMM,
            y : (pixelsRect.bottom - pixelsRect.top) / pageHeightMM
        };
    	var rects = this.getButtonRects(pointCenter, scale);
        var ButtonSize = ButtonSize1x;//AscCommon.AscBrowser.convertToRetinaValue(ButtonSize1x, true);

        var px = (0.5 + pixelsRect.left + x * (pixelsRect.right - pixelsRect.left) / pageWidthMM) >> 0;
        var py = (0.5 + pixelsRect.top + y * (pixelsRect.bottom - pixelsRect.top) / pageHeightMM) >> 0;

        var rect;
    	for (var i = 0; i < rects.length; i++)
		{
			rect = rects[i];
			if ((px >= rect.x) && (px <= (rect.x + ButtonSize)) && (py >= rect.y) && (py <= (rect.y + ButtonSize)))
			{
			    if (pointMenu)
			    {
                    pointMenu.x = rect.x;
                    pointMenu.y = rect.y;
                }
                return i;
            }
		}

		return -1;
    };

    Placeholder.prototype.onPointerDown = function(x, y, pixelsRect, pageWidthMM, pageHeightMM)
    {
        var pointMenu = { x : 0, y : 0 };
        var indexButton = this.isInside(x, y, pixelsRect, pageWidthMM, pageHeightMM, pointMenu);

		if (-1 == indexButton)
			return false;

		if (this.states[indexButton] == AscCommon.PlaceholderButtonState.Active)
        {
            this.states[indexButton] = AscCommon.PlaceholderButtonState.Over;
            this.events.document.m_oWordControl.OnUpdateOverlay();
            this.events.document.m_oWordControl.EndUpdateOverlay();

            this.events.closeCallback(this.buttons[indexButton], this);
            return true;
        }
        else if (this.events.mapActive[this.buttons[indexButton]])
        {
            for (var i = 0; i < this.buttons.length; i++)
            {
                if (indexButton != i)
                    this.states[i] = AscCommon.PlaceholderButtonState.None;
            }

            this.states[indexButton] = AscCommon.PlaceholderButtonState.Active;
            this.events.document.m_oWordControl.OnUpdateOverlay();
            this.events.document.m_oWordControl.EndUpdateOverlay();
        }

        var xCoord = pointMenu.x;
		var yCoord = pointMenu.y;

        var word_control = this.events.document.m_oWordControl;
        switch (word_control.m_oApi.editorId)
        {
            case AscCommon.c_oEditorId.Word:
                if (true === word_control.m_oWordControl.m_bIsRuler)
                {
                    xCoord += (5 * g_dKoef_mm_to_pix) >> 0;
                    yCoord += (7 * g_dKoef_mm_to_pix) >> 0;
                }
                break;
            case AscCommon.c_oEditorId.Presentation:
                xCoord += ((word_control.m_oMainParent.AbsolutePosition.L + word_control.m_oMainView.AbsolutePosition.L) * g_dKoef_mm_to_pix) >> 0;
                yCoord += ((word_control.m_oMainParent.AbsolutePosition.T + word_control.m_oMainView.AbsolutePosition.T) * g_dKoef_mm_to_pix) >> 0;
                yCoord += ButtonSize1x;
                break;
            default:
                break;
        }

		this.events.callCallback(this.buttons[indexButton], this, xCoord, yCoord);
		return true;
    };

    Placeholder.prototype.onPointerMove = function(x, y, pixelsRect, pageWidthMM, pageHeightMM, checker)
    {
        var indexButton = this.isInside(x, y, pixelsRect, pageWidthMM, pageHeightMM);

        // может в кнопку-то и не попали, но состояние могло смениться => нужно перерисовать интерфейс
        var isUpdate = false;
        for (var i = 0; i < this.buttons.length; i++)
        {
            if (i == indexButton)
            {
                if (this.states[i] == AscCommon.PlaceholderButtonState.None)
                {
                    this.states[i] = AscCommon.PlaceholderButtonState.Over;
                    isUpdate = true;
                }
            }
            else
            {
                if (this.states[i] == AscCommon.PlaceholderButtonState.Over)
                {
                    this.states[i] = AscCommon.PlaceholderButtonState.None;
                    isUpdate = true;
                }
            }
        }

        checker.isNeedUpdateOverlay |= isUpdate;
        return (-1 != indexButton);
    };

    Placeholder.prototype.onPointerUp = function(x, y, pixelsRect, pageWidthMM, pageHeightMM)
    {
		// ничего. нажимаем сразу при down
    };

    Placeholder.prototype.draw = function(overlay, pixelsRect, pageWidthMM, pageHeightMM)
	{
        var pointCenter = this.getCenterInPixels(pixelsRect, pageWidthMM, pageHeightMM);
        var scale = {
            x : (pixelsRect.right - pixelsRect.left) / pageWidthMM,
            y : (pixelsRect.bottom - pixelsRect.top) / pageHeightMM
        };
        var rects = this.getButtonRects(pointCenter, scale);
        if (rects.length != this.buttons.length)
            return;

        var ButtonSize = ButtonSize1x;//AscCommon.AscBrowser.convertToRetinaValue(ButtonSize1x, true);
        var ButtonImageSize = ButtonImageSize1x;//AscCommon.AscBrowser.convertToRetinaValue(ButtonImageSize1x, true);
        var offsetImage = (ButtonSize - ButtonImageSize) >> 1;

        var ctx = overlay.m_oContext;
        for (var i = 0; i < this.buttons.length; i++)
        {
            overlay.CheckPoint(rects[i].x, rects[i].y);
            overlay.CheckPoint(rects[i].x + ButtonSize, rects[i].y + ButtonSize);

            var img = (this.states[i] == AscCommon.PlaceholderButtonState.Active) ? this.events.icons.getActive(this.buttons[i]) : this.events.icons.get(this.buttons[i]);
            if (img)
            {
                var oldGlobalAlpha = ctx.globalAlpha;

                ctx.globalAlpha = ((this.states[i] == AscCommon.PlaceholderButtonState.None) ? 0.5 : 1);

                /* первый вариант
                ctx.beginPath();
                ctx.fillStyle = "#F1F1F1";
                ctx.fillRect(rects[i].x, rects[i].y, ButtonSize, ButtonSize);
                ctx.beginPath();
                */

                // второй вариант
                ctx.beginPath();
                ctx.fillStyle = (this.states[i] == AscCommon.PlaceholderButtonState.Active) ? "#7D858C" : "#F1F1F1";
                var x = rects[i].x;
                var y = rects[i].y;
                var r = 4;
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + ButtonSize - r, y);
                ctx.quadraticCurveTo(x + ButtonSize, y, x + ButtonSize, y + r);
                ctx.lineTo(x + ButtonSize, y + ButtonSize - r);
                ctx.quadraticCurveTo(x + ButtonSize, y + ButtonSize, x + ButtonSize - r, y + ButtonSize);
                ctx.lineTo(x + r, y + ButtonSize);
                ctx.quadraticCurveTo(x, y + ButtonSize, x, y + ButtonSize - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                ctx.fill();
                ctx.beginPath();

                ctx.drawImage(img, rects[i].x + offsetImage, rects[i].y + offsetImage, ButtonImageSize, ButtonImageSize);

                ctx.globalAlpha = oldGlobalAlpha;
            }
        }
	};
	
	function Placeholders(drDocument)
	{
	    this.document = drDocument;

		this.callbacks = [];
		this.objects = [];

		this.icons = new PlaceholderIcons();
		this.icons.register(AscCommon.PlaceholderButtonType.Image, "image");
        this.icons.register(AscCommon.PlaceholderButtonType.ImageUrl, "image_url");
        this.icons.register(AscCommon.PlaceholderButtonType.Table, "table", true);
        this.icons.register(AscCommon.PlaceholderButtonType.Chart, "chart", true);
        this.icons.register(AscCommon.PlaceholderButtonType.Audio, "audio");
        this.icons.register(AscCommon.PlaceholderButtonType.Video, "video");

        // типы, которые поддерживают состояние Active
        this.mapActive = [];
        this.mapActive[AscCommon.PlaceholderButtonType.Table] = true;
        this.mapActive[AscCommon.PlaceholderButtonType.Chart] = true;
    }

	Placeholders.prototype.registerCallback = function(type, callback)
	{
		this.callbacks[type] = callback;
	};

    Placeholders.prototype.callCallback = function(type, obj, xCoord, yCoord)
    {
        this.callbacks[type] && this.callbacks[type](obj, xCoord, yCoord);
    };

    Placeholders.prototype.closeCallback = function(type, obj)
    {
        this.document.m_oWordControl.m_oApi.sendEvent("asc_onHidePlaceholderActions");
    };

    Placeholders.prototype.closeAllActive = function()
    {
        var isUpdate = false;
        for (var i = 0; i < this.objects.length; i++)
        {
            var obj = this.objects[i];
            for (var j = 0; j < obj.states.length; j++)
            {
                if (obj.states[j] == AscCommon.PlaceholderButtonState.Active)
                {
                    isUpdate = true;
                    obj.states[j] = AscCommon.PlaceholderButtonState.None;
                }
            }
        }
        if (isUpdate)
            this.document.m_oWordControl.OnUpdateOverlay();
    };

    Placeholders.prototype.draw = function(overlay, page, pixelsRect, pageWidthMM, pageHeightMM)
    {
        for (var i = 0; i < this.objects.length; i++)
        {
            if (this.objects[i].anchor.page != page)
                continue;

            this.objects[i].draw(overlay, pixelsRect, pageWidthMM, pageHeightMM);
        }
    };

    Placeholders.prototype.onPointerDown = function(pos, pixelsRect, pageWidthMM, pageHeightMM)
	{
		for (var i = 0; i < this.objects.length; i++)
		{
		    if (this.objects[i].anchor.page != pos.Page)
		        continue;

			if (this.objects[i].onPointerDown(pos.X, pos.Y, pixelsRect, pageWidthMM, pageHeightMM))
				return true;
		}
		return false;
	};

    Placeholders.prototype.onPointerMove = function(pos, pixelsRect, pageWidthMM, pageHeightMM)
    {
        var checker = { isNeedUpdateOverlay : false };
        var isButton = false;
        for (var i = 0; i < this.objects.length; i++)
        {
            if (this.objects[i].anchor.page != pos.Page)
                continue;

            isButton |= this.objects[i].onPointerMove(pos.X, pos.Y, pixelsRect, pageWidthMM, pageHeightMM, checker);
        }

        if (isButton)
            this.document.SetCursorType("default");

        // обновить оверлей
        if (checker.isNeedUpdateOverlay && this.document.m_oWordControl)
        {
            this.document.m_oWordControl.OnUpdateOverlay();

            if (isButton)
                this.document.m_oWordControl.EndUpdateOverlay();
        }

        return isButton;
    };

    Placeholders.prototype.onPointerUp = function(pos, pixelsRect, pageWidthMM, pageHeightMM)
    {
        return this.onPointerMove(pos, pixelsRect, pageWidthMM, pageHeightMM);
    };

    Placeholders.prototype.update = function(objects)
	{
		var count = this.objects.length;
		var newCount = objects ? objects.length : 0;
		if (count != newCount)
			return this._onUpdate(objects);

		var t1, t2;
		for (var i = 0; i < count; i++)
		{
            if (this.objects[i].id != objects[i].id)
                return this._onUpdate(objects);

			if (this.objects[i].page != objects[i].page)
				return this._onUpdate(objects);

			t1 = this.objects[i].anchor.rect;
            t2 = objects[i].anchor.rect;

            if (Math.abs(t1.x - t2.x) > 0.001 || Math.abs(t1.y - t2.y) > 0.001 ||
                Math.abs(t1.w - t2.w) > 0.001 || Math.abs(t1.h - t2.h) > 0.001)
            	return this._onUpdate(objects);

            t1 = this.objects[i].anchor.transform;
            t2 = objects[i].anchor.transform;

            if (!t1 && !t2)
            	continue;

            if ((t1 && !t2) || (!t1 && t2))
                return this._onUpdate(objects);

            if (Math.abs(t1.sx - t2.sx) > 0.001 || Math.abs(t1.sy - t2.sy) > 0.001 ||
                Math.abs(t1.shx - t2.shx) > 0.001 || Math.abs(t1.shy - t2.shy) > 0.001 ||
                Math.abs(t1.tx - t2.tx) > 0.001 || Math.abs(t1.ty - t2.ty) > 0.001)
                return this._onUpdate(objects);
		}
	};

    Placeholders.prototype._onUpdate = function(objects)
    {
        this.objects = objects ? objects : [];
        for (var i = 0; i < this.objects.length; i++)
		{
			this.objects[i].events = this;
		}

        this.document.m_oWordControl && this.document.m_oWordControl.OnUpdateOverlay();
    };

    AscCommon.DrawingPlaceholders = Placeholders;

    // example use
    /*
    placeholders.registerCallback(AscCommon.PlaceholderButtonType.Image, function(obj, x, y) {});
    this.placeholders.update(
        [
            AscCommon.CreateDrawingPlaceholder(0, [
             AscCommon.PlaceholderButtonType.Image,
             AscCommon.PlaceholderButtonType.Video,
             AscCommon.PlaceholderButtonType.Audio,
             AscCommon.PlaceholderButtonType.Table,
             AscCommon.PlaceholderButtonType.Chart
            ], 0, { x : 10, y : 10, w : 100, h : 100 }, null),
            AscCommon.CreateDrawingPlaceholder(0, [AscCommon.PlaceholderButtonType.Image], 0, { x : 100, y : 100, w : 100, h : 100 }, null)
        ]
    );
    */

})(window);

/*
    CONTENTCONTROLS
 */
(function(window, undefined){

    var AscCommon = window['AscCommon'];

    AscCommon.CCButtonType = {
        Name : 0,
        Toc : 1,
        Image : 2,
        Combo : 3,
        Date : 4
    };

    var exportObj = AscCommon.CCButtonType;
    AscCommon["CCButtonType"] = exportObj;
    exportObj["Name"] = exportObj.Name;
    exportObj["Toc"] = exportObj.Toc;
    exportObj["Combo"] = exportObj.Combo;
    exportObj["Date"] = exportObj.Date;

    AscCommon.ContentControlTrack = {
        Hover 	: 0,
        In 		: 1
    };

    var ButtonSize1x = 20;

    function CCIcons()
    {
        function CCI()
        {
            this.type = 0;
            this.images = [];

            this.load = function(type, url)
            {
                this.type = type;
                this.images[0] = new Image();
                this.images[0].onload = function() { this.asc_complete = true; };
                this.images[0].src = "../../../../sdkjs/common/Images/content_controls/" + url + ".png";
                AscCommon.backoffOnErrorImg(this.images[0]);

                this.images[1] = new Image();
                this.images[1].onload = function() { this.asc_complete = true; };
                this.images[1].src = "../../../../sdkjs/common/Images/content_controls/" + url + "_active.png";
                AscCommon.backoffOnErrorImg(this.images[1]);

                this.images[2] = new Image();
                this.images[2].onload = function() { this.asc_complete = true; };
                this.images[2].src = "../../../../sdkjs/common/Images/content_controls/" + url + "@2x.png";
                AscCommon.backoffOnErrorImg(this.images[2]);

                this.images[3] = new Image();
                this.images[3].onload = function() { this.asc_complete = true; };
                this.images[3].src = "../../../../sdkjs/common/Images/content_controls/" + url + "_active@2x.png";
                AscCommon.backoffOnErrorImg(this.images[3]);
            };

            this.get = function(isActive)
            {
                var index = AscCommon.AscBrowser.isRetina ? 2 : 0;
                if (isActive)
                    index++;
                if (this.images[index].asc_complete)
                    return this.images[index];
                return null;
            };
        }

        this.images = [];

        this.register = function(type, url)
        {
            var image = new CCI();
            image.load(type, url);
            this.images[type] = image;
        };

        this.getImage = function(type, isActive)
        {
            if (!this.images[type])
                return null;

            return this.images[type].get(isActive);
        };

        this.generateComboImages = function()
        {
            var imageCC = new CCI();
            this.images[AscCommon.CCButtonType.Combo] = imageCC;
            imageCC.type = AscCommon.CCButtonType.Combo;

            for (var i = 0; i < 4; i++)
            {
                var size = (i > 1) ? 40 : 20;

                var image = document.createElement("canvas");
                image.width = size;
                image.height = size;

                var ctx = image.getContext("2d");
                var data = ctx.createImageData(size, size);
                var px = data.data;

                var len = (size >> 1) - 1;
                var count = (len + 1) >> 1;
                var x = (size - len) >> 1;
                var y = (size - count) >> 1;

                var color = (0x01 === (0x01 & i)) ? 255 : 0;

                while ( len > 0 )
                {
                    var ind = 4 * (size * y + x);
                    for ( var j = 0; j < len; j++ )
                    {
                        px[ind++] = color;
                        px[ind++] = color;
                        px[ind++] = color;
                        px[ind++] = 255;
                    }

                    x += 1;
                    y += 1;
                    len -= 2;
                }

                ctx.putImageData(data, 0, 0);

                image.asc_complete = true;

                imageCC.images[i] = image;
            }
        };
    }

    function CContentControlTrack(parent, obj, state, geom)
    {
        if (window["NATIVE_EDITOR_ENJINE"])
            return;

        // contentControls
        this.parent = parent;

        // native contentControl
        this.base = obj;
        this.type = this.base.GetSpecificType();
        this.state = state;

        this.geom = geom;
        this.rects = undefined;
        this.paths = undefined;

        if (undefined === geom[0].Points)
            this.rects = geom;
        else
            this.paths = geom;

        this.OffsetX = 0;
        this.OffsetY = 0;

        this.transform = this.base.Get_ParentTextTransform ? this.base.Get_ParentTextTransform() : null;
        if (this.transform && this.transform.IsIdentity())
            this.transform = null;
        if (this.transform && this.transform.IsIdentity2())
        {
            this.OffsetX = this.transform.tx;
            this.OffsetY = this.transform.ty;
            this.transform = null;
        }
        this.invertTransform = this.transform ? AscCommon.global_MatrixTransformer.Invert(this.transform) : null;

        this.Pos = { X : 0, Y : 0, Page : 0 };

        this.ComboRect = null;
        this.Buttons = []; // header buttons

        this.GetPosition();

        this.Name = this.base.GetAlias();
        if (this.base.IsBuiltInTableOfContents && this.base.IsBuiltInTableOfContents())
            this.Name = AscCommon.translateManager.getValue("Table of Contents");

        this.Color = this.base.GetColor();

        this.HoverButtonIndex = -2; // -1 => Text, otherwise index in this.Buttons
        this.ActiveButtonIndex = -2; // -1 => Text, otherwise index in this.Buttons

        this.IsNoButtons = false;
        if (this.parent.document.m_oWordControl.m_oApi.isViewMode)
            this.IsNoButtons = true;

        this.IsNoButtonsIsFillingForm = this.IsNoButtons;
        if (this.IsNoButtons && this.parent.document.m_oLogicDocument)
            this.IsNoButtons = this.parent.document.m_oLogicDocument.IsFillingFormMode();

        this.CalculateNameRect();
        this.CalculateMoveRect();
        this.CalculateButtons();
    }

    // является ли имя кнопкой
    CContentControlTrack.prototype.IsNameAdvanced = function()
    {
        if (this.parent.document.m_oWordControl.m_oApi.isViewMode)
            return false;

        if (Asc.c_oAscContentControlSpecificType.TOC === this.type)
            return true;

        return false;
    };
    CContentControlTrack.prototype.CalculateNameRect = function(koefX, koefY)
    {
        if (this.Name == "")
            return null;

        var width = this.parent.measure(this.Name);
        width += 6; // 3 + 3

        if (this.IsNameAdvanced() && !this.IsNoButtons)
        {
            width += 5;
            width += 3;
        }
        else
        {
            width += 3;
        }

        var rect = {
            X : this.Pos.X,
            Y : this.Pos.Y - 20 / koefY,
            W : width / koefX,
            H : 20 / koefY
        };

        if (!this.IsNoButtons)
            rect.X += 15 / koefX;

        return rect;
    };
    // расчет области для переноса
    CContentControlTrack.prototype.CalculateMoveRect = function(koefX, koefY)
    {
        if (this.IsNoButtons)
            return null;

        var rect = {
            X : this.Pos.X,
            Y : this.Pos.Y,
            W : 15 / koefX,
            H : 20 / koefY
        };

        if (this.Name == "" && this.Buttons.length == 0)
            rect.X -= rect.W;
        else
            rect.Y -= rect.H;

        return rect;
    };
    // генерация кнопок по типу
    CContentControlTrack.prototype.CalculateButtons = function()
    {
        this.Buttons = [];
        if (this.IsNoButtons)
            return;

        switch (this.type)
        {
            case Asc.c_oAscContentControlSpecificType.TOC:
            {
                this.Buttons.push(AscCommon.CCButtonType.Toc);
                break;
            }
            case Asc.c_oAscContentControlSpecificType.Picture:
            {
                this.Buttons.push(AscCommon.CCButtonType.Image);
                break;
            }
            case Asc.c_oAscContentControlSpecificType.ComboBox:
            case Asc.c_oAscContentControlSpecificType.DropDownList:
            case Asc.c_oAscContentControlSpecificType.DateTime:
            default:
                break;
        }
    };
    CContentControlTrack.prototype.CalculateComboRect = function(koefX, koefY)
    {
        if (this.IsNoButtonsIsFillingForm || !this.ComboRect)
            return null;

        var rect = {
            X : this.ComboRect.X,
            Y : this.ComboRect.Y,
            W : 20 / koefX,
            H : (this.ComboRect.B - this.ComboRect.Y),
            Page : this.ComboRect.Page
        };

        return rect;
    };
    CContentControlTrack.prototype._addToArray = function(arr, x)
    {
        for (var indexA = arr.length - 1; indexA >= 0; indexA--)
        {
            if (Math.abs(x - arr[indexA]) < 0.00001)
                return;
        }
        arr.push(x);
    };
    CContentControlTrack.prototype.GetPosition = function()
    {
        var eps = 0.00001;
        var i, j, count, curRect, curSavedRect;
        var arrY = [];
        var countY = 0;
        var counter2 = 0;
        if (this.rects)
        {
            count = this.rects.length;
            for (i = 0; i < count; i++)
            {
                curRect = this.rects[i];
                counter2 = 0;
                for (j = 0; j < countY; j++)
                {
                    curSavedRect = arrY[j];

                    // проверяем Y
                    if ((0x01 == (0x01 & counter2)) && Math.abs(curSavedRect.Y - curRect.Y) < eps)
                    {
                        this._addToArray(curSavedRect.allX, curRect.X);
                        this._addToArray(curSavedRect.allX, curRect.R);

                        if (curSavedRect.X > curRect.X)
                            curSavedRect.X = curRect.X;
                        if (curSavedRect.R < curRect.R)
                            curSavedRect.R = curRect.R;
                        counter2 |= 1;
                    }
                    // проверяем B
                    if ((0x02 == (0x02 & counter2)) && Math.abs(curSavedRect.B - curRect.Y) < eps)
                    {
                        this._addToArray(curSavedRect.allX, curRect.X);
                        this._addToArray(curSavedRect.allX, curRect.R);

                        if (curSavedRect.X > curRect.X)
                            curSavedRect.X = curRect.X;
                        if (curSavedRect.R < curRect.R)
                            curSavedRect.R = curRect.R;
                        counter2 |= 2;
                    }
                    if (3 == counter2)
                        break;
                }

                // добавляем новые
                if (0x01 != (0x01 & counter2))
                {
                    arrY.push({ X : curRect.X, R : curRect.R, Y : curRect.Y, Page : curRect.Page, allX : [curRect.X, curRect.R] });
                    ++countY;
                }
                if ((0x02 != (0x02 & counter2)) && (Math.abs(curRect.B - curRect.Y) > eps))
                {
                    arrY.push({ X : curRect.X, R : curRect.R, Y : curRect.B, Page : curRect.Page, allX : [curRect.X, curRect.R] });
                    ++countY;
                }
            }
        }
        if (this.paths)
        {
            count = this.paths.length;
            var k, page;
            for (i = 0; i < count; i++)
            {
                page = this.paths[i].Page;

                for (k = 0; k < this.paths[i].Points.length; k++)
                {
                    curRect = this.paths[i].Points[k];
                    counter2 = 0;
                    for (j = 0; j < countY; j++)
                    {
                        curSavedRect = arrY[j];

                        // проверяем Y
                        if (Math.abs(curSavedRect.Y - curRect.Y) < eps)
                        {
                            this._addToArray(curSavedRect.allX, curRect.X);

                            if (curSavedRect.X > curRect.X)
                                curSavedRect.X = curRect.X;
                            if (curSavedRect.R < curRect.X)
                                curSavedRect.R = curRect.X;
                            counter2 = 1;
                        }
                        if (1 == counter2)
                            break;
                    }

                    // добавляем новый
                    if (1 != counter2)
                    {
                        arrY.push({ X : curRect.X, R : curRect.X, Y : curRect.Y, Page : page, allX : [curRect.X] });
                        ++countY;
                    }
                }
            }
        }

        // сортировка по Y
        arrY.sort(function(a, b){
            return a.Y - b.Y;
        });

        if (arrY.length > 0)
        {
            this.Pos.X = arrY[0].X;
            this.Pos.Y = arrY[0].Y;
            this.Pos.Page = arrY[0].Page;
        }

        // ComboRect
        switch (this.type)
        {
            case Asc.c_oAscContentControlSpecificType.ComboBox:
            case Asc.c_oAscContentControlSpecificType.DropDownList:
            case Asc.c_oAscContentControlSpecificType.DateTime:
            {
                if (this.IsNoButtonsIsFillingForm)
                    break;

                var len = arrY.length;
                if (len > 0)
                {
                    this.ComboRect = { X : arrY[len - 1].R, Y : arrY[len - 1].Y, B : arrY[len - 1].Y, Page : arrY[len - 1].Page };
                    for (i = len - 2; i >= 0; i--)
                    {
                        if (this.ComboRect.Page != arrY[i].Page || Math.abs(this.ComboRect.X - arrY[i].R) > eps || arrY[i].allX.length > 2)
                            break;
                    }
                    if (i == (len - 1)) i--;
                    if (i < 0) i = 0;

                    if (i >= 0)
                        this.ComboRect.Y = arrY[i].Y;
                }
                break;
            }
            default:
                break;
        }
    };
    CContentControlTrack.prototype.GetButtonObj = function(indexButton)
    {
        var button = AscCommon.CCButtonType.Name;
        if (indexButton >= 0 && indexButton < this.Buttons.length)
            button = this.Buttons[indexButton];
        if (indexButton == this.Buttons.length)
        {
            switch (this.type)
            {
                case Asc.c_oAscContentControlSpecificType.ComboBox:
                case Asc.c_oAscContentControlSpecificType.DropDownList:
                {
                    button = AscCommon.CCButtonType.Combo;
                    break;
                }
                case Asc.c_oAscContentControlSpecificType.DateTime:
                {
                    button = AscCommon.CCButtonType.Date;
                    break;
                }
            }
        }

        return {
            "obj" : this.base,
            "type" : this.type,
            "button" : button,
            "pr" : this.base.GetContentControlPr ? this.base.GetContentControlPr() : null
        }
    };
    CContentControlTrack.prototype.Copy = function()
    {
        return new CContentControlTrack(this.parent, this.base, this.state, this.geom);
    };

    // draw methods
    CContentControlTrack.prototype.SetColor = function(ctx)
    {
        if (this.Color)
        {
            ctx.strokeStyle = "rgba(" + this.Color.r + ", " + this.Color.g + ", " + this.Color.b + ", 1)";
            ctx.fillStyle = "rgba(" + this.Color.r + ", " + this.Color.g + ", " + this.Color.b + ", 0.25)";
        }
        else
        {
            ctx.strokeStyle = "#ADADAD";
            ctx.fillStyle = "rgba(205, 205, 205, 0.5)";
        }
    };

    function ContentControls(drDocument)
    {
        this.document = drDocument;

        this.icons = new CCIcons();
        this.icons.register(AscCommon.CCButtonType.Toc, "toc");
        this.icons.register(AscCommon.CCButtonType.Image, "img");
        this.icons.generateComboImages();

        this.ContentControlObjects = [];
        this.ContentControlObjectsLast = [];
        this.ContentControlObjectState = -1;
        this.ContentControlSmallChangesCheck = { X: 0, Y: 0, Page: 0, Min: 2, IsSmall : true };

        this.measures = {};

        this.getFont = function(koef)
        {
            if (!koef)
                return "11px Helvetica, Arial, sans-serif";
            var size = (1 + 2 * 11 / koef) >> 0;
            if (size & 1)
                return (size >> 1) + ".5px Helvetica, Arial, sans-serif";
            return (size >> 1) + "px Helvetica, Arial, sans-serif";
        };

        this.measure = function(text)
        {
            if (!this.measures[text])
            {
                this.measures[text] = [0, 0];

                var ctx = this.document.CanvasHitContext;
                ctx.font = "11px Helvetica, Arial, sans-serif";

                this.measures[text][0] = ctx.measureText(text).width;

                ctx.setTransform(2, 0, 0, 2, 0, 0);
                this.measures[text][1] = ctx.measureText(text).width;
                ctx.setTransform(1, 0, 0, 1, 0, 0);
            }

            return this.measures[text][AscCommon.AscBrowser.isRetina ? 1 : 0];
        };

        // сохранение текущих в последние
        // вызывается в конце метода DrawContentControlsTrack
        this.ContentControlsSaveLast = function()
        {
            this.ContentControlObjectsLast = [];
            for (var i = 0; i < this.ContentControlObjects.length; i++)
            {
                this.ContentControlObjectsLast.push(this.ContentControlObjects[i].Copy());
            }
        };

        // совпадают ли текущие с последними? (true не совпадают)
        // вызывается на onPointerMove, если никаких других причин для обновления интерфейса нет - то
        // смотрим, сменилось ли тут чего-то
        this.ContentControlsCheckLast = function()
        {
            var _len1 = this.ContentControlObjects.length;
            var _len2 = this.ContentControlObjectsLast.length;

            if (_len1 != _len2)
                return true;

            var count1, count2;
            for (var i = 0; i < _len1; i++)
            {
                var _obj1 = this.ContentControlObjects[i];
                var _obj2 = this.ContentControlObjectsLast[i];

                if (_obj1.base.GetId() != _obj2.base.GetId())
                    return true;
                if (_obj1.state != _obj2.state)
                    return true;

                if (_obj1.rects && _obj2.rects)
                {
                    count1 = _obj1.rects.length;
                    count2 = _obj2.rects.length;

                    if (count1 != count2)
                        return true;

                    for (var j = 0; j < count1; j++)
                    {
                        if (Math.abs(_obj1.rects[j].X - _obj2.rects[j].X) > 0.00001 ||
                            Math.abs(_obj1.rects[j].Y - _obj2.rects[j].Y) > 0.00001 ||
                            Math.abs(_obj1.rects[j].R - _obj2.rects[j].R) > 0.00001 ||
                            Math.abs(_obj1.rects[j].B - _obj2.rects[j].B) > 0.00001 ||
                            _obj1.rects[j].Page != _obj2.rects[j].Page)
                        {
                            return true;
                        }
                    }
                }
                else if (_obj1.path && _obj2.path)
                {
                    count1 = _obj1.paths.length;
                    count2 = _obj2.paths.length;

                    if (count1 != count2)
                        return true;

                    var _points1, _points2;
                    for (var j = 0; j < count1; j++)
                    {
                        if (_obj1.paths[j].Page != _obj2.paths[j].Page)
                            return true;

                        _points1 = _obj1.paths[j].Points;
                        _points2 = _obj2.paths[j].Points;

                        if (_points1.length != _points2.length)
                            return true;

                        for (var k = 0; k < _points1.length; k++)
                        {
                            if (Math.abs(_points1[k].X - _points2[k].X) > 0.00001 || Math.abs(_points1[k].Y - _points2[k].Y) > 0.00001)
                                return true;
                        }
                    }
                }
                else
                {
                    return true;
                }
            }

            return false;
        };

        // отрисовка
        this.DrawContentControlsTrack = function(overlay)
        {
            var ctx = overlay.m_oContext;

            var _object;
            var _pages = this.document.m_arrPages;
            var _drawingPage;
            var _pageStart = this.document.m_lDrawingFirst;
            var _pageEnd = this.document.m_lDrawingEnd;
            var _geom;
            if (_pageStart < 0)
                return;

            var _x, _y, _r, _b;
            var _koefX = (_pages[_pageStart].drawingPage.right - _pages[_pageStart].drawingPage.left) / _pages[_pageStart].width_mm;
            var _koefY = (_pages[_pageStart].drawingPage.bottom - _pages[_pageStart].drawingPage.top) / _pages[_pageStart].height_mm;

            for (var nIndexContentControl = 0; nIndexContentControl < this.ContentControlObjects.length; nIndexContentControl++)
            {
                _object = this.ContentControlObjects[nIndexContentControl];
                _object.SetColor(ctx);
                ctx.lineWidth = 1;

                if (!_object.transform)
                {
                    if (_object.rects)
                    {
                        for (var j = 0; j < _object.rects.length; j++)
                        {
                            _geom = _object.rects[j];

                            if (_geom.Page < _pageStart || _geom.Page > this._pageEnd)
                                continue;

                            _drawingPage = _pages[_geom.Page].drawingPage;

                            ctx.beginPath();

                            _x = (_drawingPage.left + _koefX * (_geom.X + _object.OffsetX));
                            _y = (_drawingPage.top  + _koefY * (_geom.Y + _object.OffsetY));
                            _r = (_drawingPage.left + _koefX * (_geom.R + _object.OffsetX));
                            _b = (_drawingPage.top  + _koefY * (_geom.B + _object.OffsetY));

                            overlay.CheckRect(_x, _y, _r - _x, _b - _y);
                            ctx.rect((_x >> 0) + 0.5, (_y >> 0) + 0.5, (_r - _x) >> 0, (_b - _y) >> 0);

                            if (_object.state == AscCommon.ContentControlTrack.Hover)
                                ctx.fill();
                            ctx.stroke();

                            ctx.beginPath();
                        }
                    }
                    else if (_object.paths)
                    {
                        for (var j = 0; j < _object.paths.length; j++)
                        {
                            _geom = _object.paths[j];
                            if (_geom.Page < _pageStart || _geom.Page > this._pageEnd)
                                continue;

                            _drawingPage = _pages[_geom.Page].drawingPage;

                            ctx.beginPath();

                            for (var pointIndex = 0, pointCount = _geom.Points.length; pointIndex < pointCount; pointIndex++)
                            {
                                _x = (_drawingPage.left + _koefX * (_geom.Points[pointIndex].X + _object.OffsetX));
                                _y = (_drawingPage.top  + _koefY * (_geom.Points[pointIndex].Y + _object.OffsetY));

                                overlay.CheckPoint(_x, _y);

                                _x = (_x >> 0) + 0.5;
                                _y = (_y >> 0) + 0.5;

                                if (0 == pointCount)
                                    ctx.moveTo(_x, _y);
                                else
                                    ctx.lineTo(_x, _y);
                            }

                            ctx.closePath();

                            if (_object.state == AscCommon.ContentControlTrack.Hover)
                                ctx.fill();
                            ctx.stroke();

                            ctx.beginPath();
                        }
                    }
                }
                else
                {
                    if (_object.rects)
                    {
                        for (var j = 0; j < _object.rects.length; j++)
                        {
                            _geom = _object.rects[j];

                            if (_geom.Page < _pageStart || _geom.Page > this._pageEnd)
                                continue;

                            _drawingPage = _pages[_geom.Page].drawingPage;

                            var x1 = _object.transform.TransformPointX(_geom.X, _geom.Y);
                            var y1 = _object.transform.TransformPointY(_geom.X, _geom.Y);
                            var x2 = _object.transform.TransformPointX(_geom.R, _geom.Y);
                            var y2 = _object.transform.TransformPointY(_geom.R, _geom.Y);
                            var x3 = _object.transform.TransformPointX(_geom.R, _geom.B);
                            var y3 = _object.transform.TransformPointY(_geom.R, _geom.B);
                            var x4 = _object.transform.TransformPointX(_geom.X, _geom.B);
                            var y4 = _object.transform.TransformPointY(_geom.X, _geom.B);

                            x1 = _drawingPage.left + _koefX * x1;
                            x2 = _drawingPage.left + _koefX * x2;
                            x3 = _drawingPage.left + _koefX * x3;
                            x4 = _drawingPage.left + _koefX * x4;

                            y1 = _drawingPage.top + _koefY * y1;
                            y2 = _drawingPage.top + _koefY * y2;
                            y3 = _drawingPage.top + _koefY * y3;
                            y4 = _drawingPage.top + _koefY * y4;

                            ctx.beginPath();

                            overlay.CheckPoint(x1, y1);
                            overlay.CheckPoint(x2, y2);
                            overlay.CheckPoint(x3, y3);
                            overlay.CheckPoint(x4, y4);

                            ctx.moveTo(x1, y1);
                            ctx.lineTo(x2, y2);
                            ctx.lineTo(x3, y3);
                            ctx.lineTo(x4, y4);
                            ctx.closePath();

                            if (_object.state == AscCommon.ContentControlTrack.Hover)
                                ctx.fill();
                            ctx.stroke();

                            ctx.beginPath();
                        }
                    }
                    else if (_object.paths)
                    {
                        for (var j = 0; j < _object.paths.length; j++)
                        {
                            _geom = _object.paths[j];
                            if (_geom.Page < _pageStart || _geom.Page > this._pageEnd)
                                continue;

                            _drawingPage = _pages[_geom.Page].drawingPage;

                            ctx.beginPath();

                            for (var pointIndex = 0, pointCount = _geom.Points.length; pointIndex < pointCount; pointIndex++)
                            {
                                _x = _object.transform.TransformPointX(_geom.Points[pointIndex].X, _geom.Points[pointIndex].Y);
                                _y = _object.transform.TransformPointY(_geom.Points[pointIndex].X, _geom.Points[pointIndex].Y);

                                _x = (_drawingPage.left + _koefX * _x);
                                _y = (_drawingPage.top + _koefY * _y);

                                overlay.CheckPoint(_x, _y);

                                if (0 == pointCount)
                                    ctx.moveTo(_x, _y);
                                else
                                    ctx.lineTo(_x, _y);
                            }

                            ctx.closePath();

                            if (_object.state == AscCommon.ContentControlTrack.Hover)
                                ctx.fill();
                            ctx.stroke();

                            ctx.beginPath();
                        }
                    }
                }

                if (_object.state == AscCommon.ContentControlTrack.In)
                {
                    // draw header
                    if (_object.Pos.Page >= _pageStart && _object.Pos.Page <= _pageEnd)
                    {
                        _drawingPage = _pages[_object.Pos.Page].drawingPage;
                        if (!_object.transform)
                        {
                            _x = ((_drawingPage.left + _koefX * (_object.Pos.X + _object.OffsetX)) >> 0) + 0.5;
                            _y = ((_drawingPage.top + _koefY * (_object.Pos.Y + _object.OffsetY)) >> 0) + 0.5;

                            if (_object.Name != "" || 0 != _object.Buttons.length)
                                _y -= 20;
                            else
                                _x -= 15;

                            var widthName = 0;
                            if (_object.Name != "")
                                widthName = (_object.CalculateNameRect(_koefX, _koefY).W * _koefX) >> 0;

                            var widthHeader = widthName + 20 * _object.Buttons.length;
                            var xText = _x;

                            if (!_object.IsNoButtons)
                            {
                                widthHeader += 15;
                                xText += 15;
                            }

                            if (0 == widthHeader)
                                continue;

                            // сразу чекаем весь хедер
                            overlay.CheckRect(_x, _y, widthHeader, 20);

                            // рисуем подложку
                            ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsBack;
                            ctx.rect(_x, _y, widthHeader, 20);
                            ctx.fill();
                            ctx.beginPath();

                            // draw mover in header
                            if (!_object.IsNoButtons)
                            {
                                ctx.rect(_x, _y, 15, 20);
                                ctx.fillStyle = (1 == this.ContentControlObjectState) ? AscCommonWord.GlobalSkin.ContentControlsAnchorActive : AscCommonWord.GlobalSkin.ContentControlsBack;
                                ctx.fill();
                                ctx.beginPath();

                                if (1 == this.ContentControlObjectState)
                                {
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsAnchorActive;
                                    ctx.rect(_x, _y, 15, 20);
                                    ctx.fill();
                                    ctx.beginPath();
                                }

                                var cx = _x - 0.5 + 4;
                                var cy = _y - 0.5 + 4;

                                var _color1 = "#ADADAD";
                                var _color2 = "#D4D4D4";

                                if (0 == this.ContentControlObjectState || 1 == this.ContentControlObjectState)
                                {
                                    _color1 = "#444444";
                                    _color2 = "#9D9D9D";
                                }

                                overlay.AddRect(cx, cy, 3, 3);
                                overlay.AddRect(cx + 5, cy, 3, 3);
                                overlay.AddRect(cx, cy + 5, 3, 3);
                                overlay.AddRect(cx + 5, cy + 5, 3, 3);
                                overlay.AddRect(cx, cy + 10, 3, 3);
                                overlay.AddRect(cx + 5, cy + 10, 3, 3);

                                ctx.fillStyle = _color2;
                                ctx.fill();
                                ctx.beginPath();

                                ctx.moveTo(cx + 1.5, cy);
                                ctx.lineTo(cx + 1.5, cy + 3);
                                ctx.moveTo(cx + 6.5, cy);
                                ctx.lineTo(cx + 6.5, cy + 3);
                                ctx.moveTo(cx + 1.5, cy + 5);
                                ctx.lineTo(cx + 1.5, cy + 8);
                                ctx.moveTo(cx + 6.5, cy + 5);
                                ctx.lineTo(cx + 6.5, cy + 8);
                                ctx.moveTo(cx + 1.5, cy + 10);
                                ctx.lineTo(cx + 1.5, cy + 13);
                                ctx.moveTo(cx + 6.5, cy + 10);
                                ctx.lineTo(cx + 6.5, cy + 13);

                                ctx.moveTo(cx, cy + 1.5);
                                ctx.lineTo(cx + 3, cy + 1.5);
                                ctx.moveTo(cx + 5, cy + 1.5);
                                ctx.lineTo(cx + 8, cy + 1.5);
                                ctx.moveTo(cx, cy + 6.5);
                                ctx.lineTo(cx + 3, cy + 6.5);
                                ctx.moveTo(cx + 5, cy + 6.5);
                                ctx.lineTo(cx + 8, cy + 6.5);
                                ctx.moveTo(cx, cy + 11.5);
                                ctx.lineTo(cx + 3, cy + 11.5);
                                ctx.moveTo(cx + 5, cy + 11.5);
                                ctx.lineTo(cx + 8, cy + 11.5);

                                ctx.strokeStyle = _color1;
                                ctx.stroke();
                                ctx.beginPath();
                            }

                            // draw name
                            if (_object.Name != "")
                            {
                                if (_object.ActiveButtonIndex == -1)
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsActive;
                                else if (_object.HoverButtonIndex == -1)
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsHover;
                                else
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsBack;

                                ctx.rect(xText, _y, widthName, 20);
                                ctx.fill();
                                ctx.beginPath();

                                ctx.fillStyle = (_object.ActiveButtonIndex == -1) ? AscCommonWord.GlobalSkin.ContentControlsTextActive : AscCommonWord.GlobalSkin.ContentControlsText;
                                ctx.font = this.getFont();
                                ctx.fillText(_object.Name, xText + 3, _y + 20 - 6);

                                if (_object.IsNameAdvanced() && !_object.IsNoButtons)
                                {
                                    var nY = _y - 0.5;
                                    nY += 10;
                                    nY -= 1;

                                    var plus = AscCommon.AscBrowser.isRetina ? 0.5 : 1;

                                    var nX = (xText + widthName - 7) >> 0;
                                    for (var i = 0; i <= 2; i+=plus)
                                        ctx.rect(nX + i, nY + i, 1, 1);

                                    for (var i = 0; i <= 2; i+=plus)
                                        ctx.rect(nX + 4 - i, nY + i, 1, 1);

                                    ctx.fill();
                                    ctx.beginPath();
                                }
                            }

                            // draw buttons
                            for (var nIndexB = 0; nIndexB < _object.Buttons.length; nIndexB++)
                            {
                                var isFill = false;
                                if (_object.ActiveButtonIndex == nIndexB)
                                {
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsActive;
                                    isFill = true;
                                }
                                else if (_object.HoverButtonIndex == nIndexB)
                                {
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsHover;
                                    isFill = true;
                                }

                                if (isFill)
                                {
                                    ctx.rect(xText + widthName + 20 * nIndexB, _y, 20, 20);
                                    ctx.fill();
                                    ctx.beginPath();
                                }

                                var image = this.icons.getImage(_object.Buttons[nIndexB], nIndexB == _object.ActiveButtonIndex);
                                if (image)
                                    ctx.drawImage(image, (xText + widthName + 20 * nIndexB) >> 0, _y >> 0, 20, 20);
                            }

                            // рисуем единую обводку
                            _object.SetColor(ctx);
                            ctx.beginPath();
                            ctx.rect(_x, _y, widthHeader, 20);
                            ctx.stroke();
                            ctx.beginPath();

                            // есть ли комбо-кнопка?
                            if (_object.ComboRect)
                            {
                                _x = ((_drawingPage.left + _koefX * (_object.ComboRect.X + _object.OffsetX)) >> 0) + 0.5;
                                _y = ((_drawingPage.top + _koefY * (_object.ComboRect.Y + _object.OffsetY)) >> 0) + 0.5;
                                _b = ((_drawingPage.top + _koefY * (_object.ComboRect.B + _object.OffsetY)) >> 0) + 0.5;
                                var nIndexB = _object.Buttons.length;

                                ctx.beginPath();
                                ctx.rect(_x, _y, 20, _b - _y);
                                overlay.CheckRect(_x, _y, 20, _b - _y);
                                if (_object.ActiveButtonIndex == nIndexB)
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsActive;
                                else if (_object.HoverButtonIndex == nIndexB)
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsHover;
                                else
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsBack;

                                ctx.fill();
                                ctx.stroke();
                                ctx.beginPath();

                                var image = this.icons.getImage(AscCommon.CCButtonType.Combo, _object.Buttons.length == _object.ActiveButtonIndex);
                                if (image && 7 < (_b - _y))
                                    ctx.drawImage(image, _x, _y + ((_b - _y - 20) >> 1) + 0.5, 20, 20);
                            }
                        }
                        else
                        {
                            var _ft = _object.transform.CreateDublicate();
                            var scaleX_15 = 15 / _koefX;
                            var scaleX_20 = 20 / _koefX;
                            var scaleY_20 = 20 / _koefY;

                            // check overlay bounds ----------
                            _x = _object.Pos.X - scaleX_15;
                            _y = _object.Pos.Y;

                            if (_object.Name != "" || 0 != _object.Buttons.length)
                            {
                                _x = _object.Pos.X;
                                _y = _object.Pos.Y - scaleY_20;
                            }

                            var widthName = 0;
                            if (_object.Name != "")
                                widthName = _object.CalculateNameRect(_koefX, _koefY).W;

                            var widthHeader = widthName + scaleX_20 * _object.Buttons.length;
                            var xText = _x;

                            if (!_object.IsNoButtons)
                            {
                                widthHeader += scaleX_15;
                                xText += scaleX_15;
                            }

                            if (widthHeader < 0.001)
                                continue;

                            _r = _x + widthHeader;
                            _b = _y + scaleY_20;

                            var x1 = _ft.TransformPointX(_x, _y);
                            var y1 = _ft.TransformPointY(_x, _y);
                            var x2 = _ft.TransformPointX(_r, _y);
                            var y2 = _ft.TransformPointY(_r, _y);
                            var x3 = _ft.TransformPointX(_r, _b);
                            var y3 = _ft.TransformPointY(_r, _b);
                            var x4 = _ft.TransformPointX(_x, _b);
                            var y4 = _ft.TransformPointY(_x, _b);

                            x1 = _drawingPage.left + _koefX * x1;
                            x2 = _drawingPage.left + _koefX * x2;
                            x3 = _drawingPage.left + _koefX * x3;
                            x4 = _drawingPage.left + _koefX * x4;
                            y1 = _drawingPage.top + _koefY * y1;
                            y2 = _drawingPage.top + _koefY * y2;
                            y3 = _drawingPage.top + _koefY * y3;
                            y4 = _drawingPage.top + _koefY * y4;

                            overlay.CheckPoint(x1, y1);
                            overlay.CheckPoint(x2, y2);
                            overlay.CheckPoint(x3, y3);
                            overlay.CheckPoint(x4, y4);
                            // --------------------------------

                            var coords = new AscCommon.CMatrix();
                            coords.sx = _koefX;
                            coords.sy = _koefY;
                            coords.tx = _drawingPage.left;
                            coords.ty = _drawingPage.top;

                            global_MatrixTransformer.MultiplyAppend(_ft, coords);
                            ctx.transform(_ft.sx, _ft.shy, _ft.shx, _ft.sy, _ft.tx, _ft.ty);

                            // рисуем подложку
                            ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsBack;
                            ctx.rect(_x, _y, widthHeader, scaleY_20);
                            ctx.fill();
                            ctx.beginPath();

                            // draw mover
                            if (!_object.IsNoButtons)
                            {
                                ctx.rect(_x, _y, scaleX_15, scaleY_20);
                                ctx.fillStyle = (1 == this.ContentControlObjectState) ? AscCommonWord.GlobalSkin.ContentControlsAnchorActive : AscCommonWord.GlobalSkin.ContentControlsBack;
                                ctx.fill();
                                ctx.beginPath();

                                if (1 == this.ContentControlObjectState)
                                {
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsAnchorActive;
                                    ctx.rect(_x, _y, scaleX_15, scaleY_20);
                                    ctx.fill();
                                    ctx.beginPath();
                                }

                                var cx1 = _x + 5 / _koefX;
                                var cy1 = _y + 5 / _koefY;
                                var cx2 = _x + 10 / _koefX;
                                var cy2 = _y + 5 / _koefY;

                                var cx3 = _x + 5 / _koefX;
                                var cy3 = _y + 10 / _koefY;
                                var cx4 = _x + 10 / _koefX;
                                var cy4 = _y + 10 / _koefY;

                                var cx5 = _x + 5 / _koefX;
                                var cy5 = _y + 15 / _koefY;
                                var cx6 = _x + 10 / _koefX;
                                var cy6 = _y + 15 / _koefY;

                                var rad = 1.5 / _koefX;
                                overlay.AddEllipse2(cx1, cy1, rad);
                                overlay.AddEllipse2(cx2, cy2, rad);
                                overlay.AddEllipse2(cx3, cy3, rad);
                                overlay.AddEllipse2(cx4, cy4, rad);
                                overlay.AddEllipse2(cx5, cy5, rad);
                                overlay.AddEllipse2(cx6, cy6, rad);

                                var _color1 = "#ADADAD";
                                if (0 == this.ContentControlObjectState || 1 == this.ContentControlObjectState)
                                    _color1 = "#444444";

                                ctx.fillStyle = _color1;
                                ctx.fill();
                                ctx.beginPath();
                            }

                            // draw name
                            if (_object.Name != "")
                            {
                                if (_object.ActiveButtonIndex == -1)
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsActive;
                                else if (_object.HoverButtonIndex == -1)
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsHover;
                                else
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsBack;

                                ctx.rect(_x + (_object.IsNoButtons ? 0 : scaleX_15), _y, widthName, scaleY_20);
                                ctx.fill();
                                ctx.beginPath();

                                ctx.fillStyle = (_object.ActiveButtonIndex == -1) ? AscCommonWord.GlobalSkin.ContentControlsTextActive : AscCommonWord.GlobalSkin.ContentControlsText;
                                ctx.font = this.getFont(_koefY);
                                ctx.fillText(_object.Name, xText + 3 / _koefX, _y + (20 - 6) / _koefY);

                                if (_object.IsNameAdvanced() && !_object.IsNoButtons)
                                {
                                    var nY = _y + 9 / _koefY;
                                    var nX = xText + widthName - 6 / _koefX;

                                    for (var i = 0; i < 3; i++)
                                        ctx.rect(_x + nX + i / _koefX, nY + i / _koefY, 1 / _koefX, 1 / _koefY);

                                    for (var i = 0; i < 2; i++)
                                        ctx.rect(_x + nX + (4 - i) / _koefX, nY + i / _koefY, 1 / _koefX, 1 / _koefY);

                                    ctx.fill();
                                    ctx.beginPath();
                                }
                            }

                            // draw buttons
                            for (var nIndexB = 0; nIndexB < _object.Buttons.length; nIndexB++)
                            {
                                var isFill = false;
                                if (_object.ActiveButtonIndex == nIndexB)
                                {
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsActive;
                                    isFill = true;
                                }
                                else if (_object.HoverButtonIndex == nIndexB)
                                {
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsHover;
                                    isFill = true;
                                }

                                if (isFill)
                                {
                                    ctx.rect(xText + widthName + scaleX_20 * nIndexB, _y, scaleX_20, scaleY_20);
                                    ctx.fill();
                                    ctx.beginPath();
                                }

                                var image = this.icons.getImage(_object.Buttons[nIndexB], nIndexB == _object.ActiveButtonIndex);
                                if (image)
                                    ctx.drawImage(image, xText + widthName + scaleX_20 * nIndexB, _y, scaleX_20, scaleY_20);
                            }

                            // есть ли комбо-кнопка?
                            if (_object.ComboRect)
                            {
                                _x = _object.ComboRect.X;
                                _y = _object.ComboRect.Y;
                                _b = _object.ComboRect.B;
                                var nIndexB = _object.Buttons.length;

                                ctx.beginPath();
                                ctx.rect(_x, _y, scaleX_20, _b - _y);
                                overlay.CheckRect(_x, _y, scaleX_20, _b - _y);
                                if (_object.ActiveButtonIndex == nIndexB)
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsActive;
                                else if (_object.HoverButtonIndex == nIndexB)
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsHover;
                                else
                                    ctx.fillStyle = AscCommonWord.GlobalSkin.ContentControlsBack;

                                ctx.fill();
                                ctx.lineWidth = 1 / _koefY;
                                ctx.stroke();
                                ctx.lineWidth = 1;
                                ctx.beginPath();

                                var image = this.icons.getImage(AscCommon.CCButtonType.Combo, _object.Buttons.length == _object.ActiveButtonIndex);
                                var scaleY_7 = 7 / _koefY;
                                if (image && scaleY_7 < (_b - _y))
                                    ctx.drawImage(image, _x, _y + ((_b - _y - scaleY_20) >> 1) + 0.5, scaleX_20, scaleY_20);
                            }

                            // рисуем единую обводку
                            _object.SetColor(ctx);

                            overlay.SetBaseTransform();

                            ctx.beginPath();

                            ctx.moveTo(x1, y1);
                            ctx.lineTo(x2, y2);
                            ctx.lineTo(x3, y3);
                            ctx.lineTo(x4, y4);
                            ctx.closePath();

                            ctx.stroke();
                            ctx.beginPath();
                        }
                    }
                }
            }

            this.ContentControlsSaveLast();
        };

        this.OnDrawContentControl = function(obj, state, geom)
        {
            var isActiveRemove = false;
            // всегда должен быть максимум один hover и in
            for (var i = 0; i < this.ContentControlObjects.length; i++)
            {
                if (state == this.ContentControlObjects[i].state)
                {
                    if (-2 != this.ContentControlObjects[i].ActiveButtonIndex)
                        isActiveRemove = true;

                    this.ContentControlObjects.splice(i, 1);
                    i--;
                }
            }

            if (null == obj)
            {
                if (isActiveRemove)
                    this.document.m_oWordControl.m_oApi.sendEvent("asc_onHideContentControlsActions");
                return;
            }

            if (this.ContentControlObjects.length != 0 && this.ContentControlObjects[0].base.GetId() == obj.GetId())
            {
                if (state === AscCommon.ContentControlTrack.Hover)
                    return;

                // In
                if (-2 != this.ContentControlObjects[0].ActiveButtonIndex)
                    isActiveRemove = true;

                this.ContentControlObjects.splice(0, 1);
            }

            var isNormal = true;
            if (Array.isArray(geom) && geom.length === 0)
                isNormal = false;

            if (isNormal)
                this.ContentControlObjects.push(new CContentControlTrack(this, obj, state, geom));

            if (isActiveRemove)
                this.document.m_oWordControl.m_oApi.sendEvent("asc_onHideContentControlsActions");
        };

        this.checkSmallChanges = function(pos)
        {
            if (!this.ContentControlSmallChangesCheck.IsSmall)
                return;

            if (pos.Page != this.ContentControlSmallChangesCheck.Page ||
                Math.abs(pos.X - this.ContentControlSmallChangesCheck.X) > this.ContentControlSmallChangesCheck.Min ||
                Math.abs(pos.Y - this.ContentControlSmallChangesCheck.Y) > this.ContentControlSmallChangesCheck.Min)
            {
                this.ContentControlSmallChangesCheck.IsSmall = false;
            }
        };

        this.isInlineTrack = function()
        {
            return (this.ContentControlObjectState == 1) ? true : false;
        };

        this.onPointerDown = function(pos)
        {
            var oWordControl = this.document.m_oWordControl;

            for (var i = 0; i < this.ContentControlObjects.length; i++)
            {
                var _object = this.ContentControlObjects[i];
                if (_object.state == AscCommon.ContentControlTrack.In)
                {
                    if (_object.Pos.Page == pos.Page && !_object.IsNoButtons)
                    {
                        // check header
                        var _page = this.document.m_arrPages[_object.Pos.Page];
                        if (!_page)
                            return false;

                        var drawingPage = _page.drawingPage;

                        var koefX = (drawingPage.right - drawingPage.left) / _page.width_mm;
                        var koefY = (drawingPage.bottom - drawingPage.top) / _page.height_mm;

                        var xPos = pos.X - _object.OffsetX;
                        var yPos = pos.Y - _object.OffsetY;
                        if (_object.transform)
                        {
                            var tmp = _object.invertTransform.TransformPointX(xPos, yPos);
                            yPos = _object.invertTransform.TransformPointY(xPos, yPos);
                            xPos = tmp;
                        }

                        // move
                        var rectMove = _object.CalculateMoveRect(koefX, koefY);
                        if (rectMove && xPos > rectMove.X && xPos < (rectMove.X + rectMove.W) && yPos > rectMove.Y && yPos < (rectMove.Y + rectMove.H))
                        {
                            oWordControl.m_oLogicDocument.SelectContentControl(_object.base.GetId());
                            this.ContentControlObjectState = 1;
                            this.ContentControlSmallChangesCheck.X = pos.X;
                            this.ContentControlSmallChangesCheck.Y = pos.Y;
                            this.ContentControlSmallChangesCheck.Page = pos.Page;
                            this.ContentControlSmallChangesCheck.IsSmall = true;

                            this.document.InlineTextTrack = null;
                            this.document.InlineTextTrackPage = -1;

                            oWordControl.ShowOverlay();
                            oWordControl.OnUpdateOverlay();
                            oWordControl.EndUpdateOverlay();

                            this.document.LockCursorType("default");
                            return true;
                        }

                        // name
                        var rectName = _object.IsNameAdvanced() ? _object.CalculateNameRect(koefX, koefY) : null;
                        if (rectName && xPos > rectName.X && xPos < (rectName.X + rectName.W) && yPos > rectName.Y && yPos < (rectName.Y + rectName.H))
                        {
                            if (_object.ActiveButtonIndex == -1)
                            {
                                _object.ActiveButtonIndex = -2;
                                oWordControl.m_oApi.sendEvent("asc_onHideContentControlsActions");
                            }
                            else
                            {
                                _object.ActiveButtonIndex = -1;

                                var xCC = rectName.X + _object.OffsetX;
                                var yCC = rectName.Y + rectName.H + _object.OffsetY;
                                if (_object.transform) {
                                    var tmp = _object.transform.TransformPointX(xCC, yCC);
                                    yCC = _object.transform.TransformPointY(xCC, yCC);
                                    xCC = tmp;
                                }

                                var posOnScreen = this.document.ConvertCoordsToCursorWR(xCC, yCC, _object.Pos.Page);
                                oWordControl.m_oApi.sendEvent("asc_onShowContentControlsActions", _object.GetButtonObj(-1), posOnScreen.X, posOnScreen.Y);
                            }

                            oWordControl.ShowOverlay();
                            oWordControl.OnUpdateOverlay();
                            oWordControl.EndUpdateOverlay();

                            this.document.LockCursorType("default");
                            return true;
                        }

                        // check buttons
                        if (_object.Buttons.length > 0)
                        {
                            var rectOrigin = rectName || rectMove;
                            if (!rectOrigin)
                                return false;
                            var x = rectOrigin.X + rectOrigin.W;
                            var y = rectOrigin.Y;
                            var w = 20 / koefX;
                            var h = 20 / koefY;

                            for (var indexB = 0; indexB < _object.Buttons.length; indexB++)
                            {
                                if (xPos > x && xPos < (x + w) && yPos > y && yPos < (y + h))
                                {
                                    if (_object.ActiveButtonIndex == indexB)
                                    {
                                        _object.ActiveButtonIndex = -2;
                                        oWordControl.m_oApi.sendEvent("asc_onHideContentControlsActions");
                                    }
                                    else
                                    {
                                        _object.ActiveButtonIndex = indexB;

                                        var xCC = x + _object.OffsetX;
                                        var yCC = rectOrigin.Y + rectOrigin.H + _object.OffsetY;
                                        if (_object.transform)
                                        {
                                            var tmp = _object.transform.TransformPointX(xCC, yCC);
                                            yCC = _object.transform.TransformPointY(xCC, yCC);
                                            xCC = tmp;
                                        }

                                        var posOnScreen = this.document.ConvertCoordsToCursorWR(xCC, yCC, _object.Pos.Page);
                                        oWordControl.m_oApi.sendEvent("asc_onShowContentControlsActions", _object.GetButtonObj(indexB), posOnScreen.X, posOnScreen.Y);
                                    }

                                    oWordControl.ShowOverlay();
                                    oWordControl.OnUpdateOverlay();
                                    oWordControl.EndUpdateOverlay();

                                    this.document.LockCursorType("default");
                                    return true;
                                }
                                x += w;
                            }
                        }
                    }

                    var _page = this.document.m_arrPages[pos.Page];
                    if (!_page) return false;

                    var drawingPage = _page.drawingPage;

                    var koefX = (drawingPage.right - drawingPage.left) / _page.width_mm;
                    var koefY = (drawingPage.bottom - drawingPage.top) / _page.height_mm;

                    var rectCombo = _object.CalculateComboRect(koefX, koefY);

                    if (rectCombo && pos.Page == rectCombo.Page)
                    {
                        var xPos = pos.X - _object.OffsetX;
                        var yPos = pos.Y - _object.OffsetY;
                        if (_object.transform)
                        {
                            var tmp = _object.invertTransform.TransformPointX(xPos, yPos);
                            yPos = _object.invertTransform.TransformPointY(xPos, yPos);
                            xPos = tmp;
                        }

                        if (xPos > rectCombo.X && xPos < (rectCombo.X + rectCombo.W) && yPos > rectCombo.Y && yPos < (rectCombo.Y + rectCombo.H))
                        {
                            var indexB = _object.Buttons.length;
                            if (_object.ActiveButtonIndex == indexB)
                            {
                                _object.ActiveButtonIndex = -2;
                                oWordControl.m_oApi.sendEvent("asc_onHideContentControlsActions");
                            }
                            else
                            {
                                _object.ActiveButtonIndex = indexB;

                                var xCC = rectCombo.X + _object.OffsetX + 20 / koefX;
                                var yCC = rectCombo.Y + rectCombo.H + _object.OffsetY;
                                if (_object.transform)
                                {
                                    var tmp = _object.transform.TransformPointX(xCC, yCC);
                                    yCC = _object.transform.TransformPointY(xCC, yCC);
                                    xCC = tmp;
                                }

                                var posOnScreen = this.document.ConvertCoordsToCursorWR(xCC, yCC, rectCombo.Page);
                                oWordControl.m_oApi.sendEvent("asc_onShowContentControlsActions", _object.GetButtonObj(indexB), posOnScreen.X, posOnScreen.Y);
                            }

                            oWordControl.ShowOverlay();
                            oWordControl.OnUpdateOverlay();
                            oWordControl.EndUpdateOverlay();

                            this.document.LockCursorType("default");
                            return true;
                        }
                    }

                    break;
                }
            }

            return false;
        };

        this.onPointerMove = function(pos)
        {
            var oWordControl = this.document.m_oWordControl;
            var _object = null;
            var isChangeHover = false;
            for (var i = 0; i < this.ContentControlObjects.length; i++)
            {
                if (-2 != this.ContentControlObjects[i].HoverButtonIndex)
                    isChangeHover = true;
                this.ContentControlObjects[i].HoverButtonIndex = -2;
                if (this.ContentControlObjects[i].state == AscCommon.ContentControlTrack.In)
                {
                    _object = this.ContentControlObjects[i];
                    break;
                }
            }

            if (_object && !_object.IsNoButtons && pos.Page == _object.Pos.Page)
            {
                if (1 == this.ContentControlObjectState)
                {
                    if (pos.Page == this.ContentControlSmallChangesCheck.Page &&
                        Math.abs(pos.X - this.ContentControlSmallChangesCheck.X) < this.ContentControlSmallChangesCheck.Min &&
                        Math.abs(pos.Y - this.ContentControlSmallChangesCheck.Y) < this.ContentControlSmallChangesCheck.Min)
                    {
                        oWordControl.ShowOverlay();
                        oWordControl.OnUpdateOverlay();
                        oWordControl.EndUpdateOverlay();
                        return true;
                    }

                    this.document.InlineTextTrackEnabled = true;
                    this.ContentControlSmallChangesCheck.IsSmall = false;

                    this.document.InlineTextTrack = oWordControl.m_oLogicDocument.Get_NearestPos(pos.Page, pos.X, pos.Y);
                    this.document.InlineTextTrackPage = pos.Page;

                    oWordControl.ShowOverlay();
                    oWordControl.OnUpdateOverlay();
                    oWordControl.EndUpdateOverlay();
                    return true;
                }

                var _page = this.document.m_arrPages[_object.Pos.Page];
                if (!_page)
                    return false;

                var drawingPage = _page.drawingPage;

                var koefX = (drawingPage.right - drawingPage.left) / _page.width_mm;
                var koefY = (drawingPage.bottom - drawingPage.top) / _page.height_mm;

                var xPos = pos.X - _object.OffsetX;
                var yPos = pos.Y - _object.OffsetY;
                if (_object.transform)
                {
                    var tmp = _object.invertTransform.TransformPointX(xPos, yPos);
                    yPos = _object.invertTransform.TransformPointY(xPos, yPos);
                    xPos = tmp;
                }

                var oldState = this.ContentControlObjectState;
                this.ContentControlObjectState = -1;

                // move
                var rectMove = _object.CalculateMoveRect(koefX, koefY);
                if (rectMove && xPos > rectMove.X && xPos < (rectMove.X + rectMove.W) && yPos > rectMove.Y && yPos < (rectMove.Y + rectMove.H))
                {
                    this.ContentControlObjectState = 0;
                    oWordControl.ShowOverlay();
                    oWordControl.OnUpdateOverlay();
                    oWordControl.EndUpdateOverlay();

                    this.document.SetCursorType("default");

                    oWordControl.m_oApi.sync_MouseMoveStartCallback();
                    oWordControl.m_oApi.sync_MouseMoveEndCallback();
                    return true;
                }

                // name
                var rectName = _object.IsNameAdvanced() ? _object.CalculateNameRect(koefX, koefY) : null;
                if (rectName && xPos > rectName.X && xPos < (rectName.X + rectName.W) && yPos > rectName.Y && yPos < (rectName.Y + rectName.H))
                {
                    _object.HoverButtonIndex = -1;
                    oWordControl.ShowOverlay();
                    oWordControl.OnUpdateOverlay();
                    oWordControl.EndUpdateOverlay();

                    this.document.SetCursorType("default");

                    oWordControl.m_oApi.sync_MouseMoveStartCallback();
                    oWordControl.m_oApi.sync_MouseMoveEndCallback();
                    return true;
                }

                // check buttons
                if (_object.Buttons.length > 0)
                {
                    var rectOrigin = rectName || rectMove;
                    if (!rectOrigin)
                        return false;
                    var x = rectOrigin.X + rectOrigin.W;
                    var y = rectOrigin.Y;
                    var w = 20 / koefX;
                    var h = 20 / koefY;

                    for (var indexB = 0; indexB < _object.Buttons.length; indexB++)
                    {
                        if (xPos > x && xPos < (x + w) && yPos > y && yPos < (y + h))
                        {
                            _object.HoverButtonIndex = indexB;
                            oWordControl.ShowOverlay();
                            oWordControl.OnUpdateOverlay();
                            oWordControl.EndUpdateOverlay();

                            this.document.SetCursorType("default");

                            oWordControl.m_oApi.sync_MouseMoveStartCallback();
                            oWordControl.m_oApi.sync_MouseMoveEndCallback();
                            return true;
                        }
                        x += w;
                    }
                }

                if (oldState != this.ContentControlObjectState)
                    oWordControl.OnUpdateOverlay();
            }

            if (_object && !_object.IsNoButtonsIsFillingForm)
            {
                var _page = this.document.m_arrPages[pos.Page];
                if (!_page) return false;

                var drawingPage = _page.drawingPage;
                var koefX = (drawingPage.right - drawingPage.left) / _page.width_mm;
                var koefY = (drawingPage.bottom - drawingPage.top) / _page.height_mm;

                var rectCombo = _object.CalculateComboRect(koefX, koefY);

                if (rectCombo && pos.Page == rectCombo.Page)
                {
                    var xPos = pos.X - _object.OffsetX;
                    var yPos = pos.Y - _object.OffsetY;
                    if (_object.transform)
                    {
                        var tmp = _object.invertTransform.TransformPointX(xPos, yPos);
                        yPos = _object.invertTransform.TransformPointY(xPos, yPos);
                        xPos = tmp;
                    }

                    if (xPos > rectCombo.X && xPos < (rectCombo.X + rectCombo.W) && yPos > rectCombo.Y && yPos < (rectCombo.Y + rectCombo.H))
                    {
                        _object.HoverButtonIndex = _object.Buttons.length;
                        oWordControl.ShowOverlay();
                        oWordControl.OnUpdateOverlay();
                        oWordControl.EndUpdateOverlay();

                        this.document.SetCursorType("default");

                        oWordControl.m_oApi.sync_MouseMoveStartCallback();
                        oWordControl.m_oApi.sync_MouseMoveEndCallback();
                        return true;
                    }
                }
            }

            if (isChangeHover)
                oWordControl.OnUpdateOverlay();

            return false;
        };

        this.onPointerUp = function(pos)
        {
            var oWordControl = this.document.m_oWordControl;

            var oldContentControlSmall = this.ContentControlSmallChangesCheck.IsSmall;
            this.ContentControlSmallChangesCheck.IsSmall = true;

            if (this.ContentControlObjectState == 1)
            {
                for (var i = 0; i < this.ContentControlObjects.length; i++)
                {
                    var _object = this.ContentControlObjects[i];
                    if (_object.state == AscCommon.ContentControlTrack.In)
                    {
                        if (this.document.InlineTextTrackEnabled)
                        {
                            if (this.document.InlineTextTrack && !oldContentControlSmall) // значит был MouseMove
                            {
                                this.document.InlineTextTrack = oWordControl.m_oLogicDocument.Get_NearestPos(pos.Page, pos.X, pos.Y);
                                this.document.m_oLogicDocument.OnContentControlTrackEnd(_object.base.GetId(), this.document.InlineTextTrack, AscCommon.global_keyboardEvent.CtrlKey);
                                this.document.InlineTextTrackEnabled = false;
                                this.document.InlineTextTrack = null;
                                this.document.InlineTextTrackPage = -1;
                            }
                            else
                            {
                                this.document.InlineTextTrackEnabled = false;
                            }
                        }
                        break;
                    }
                }

                this.ContentControlObjectState = 0;
                oWordControl.ShowOverlay();
                oWordControl.OnUpdateOverlay();
                oWordControl.EndUpdateOverlay();
                return true;
            }

            return false;
        }
    }

    AscCommon.DrawingContentControls = ContentControls;

})(window);
