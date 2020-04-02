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

(function(window, undefined){

    var g_isMouseSendEnabled = false;
    var g_language = "";

    // должны быть методы
    // init(data);
    // button(id)

    window.plugin_sendMessage = function sendMessage(data)
    {
        window.parent.postMessage(data, "*");
    };

    window.plugin_onMessage = function(event)
    {
        if (!window.Asc.plugin)
            return;

        if (typeof(event.data) == "string")
        {
            var pluginData = {};
            try
            {
                pluginData = JSON.parse(event.data);
            }
            catch(err)
            {
                pluginData = {};
            }

            var type = pluginData.type;

            if (pluginData.guid != window.Asc.plugin.guid)
            {
                if (undefined !== pluginData.guid)
                    return;

                switch (type)
                {
                    case "onExternalPluginMessage":
                        break;
                    default:
                        return;
                }
            }

            if (type == "init")
                window.Asc.plugin.info = pluginData;

            if (!window.Asc.plugin.tr || !window.Asc.plugin.tr_init)
            {
				window.Asc.plugin.tr_init = true;
                window.Asc.plugin.tr = function(val) {
                    if (!window.Asc.plugin.translateManager || !window.Asc.plugin.translateManager[val])
                        return val;
                    return window.Asc.plugin.translateManager[val];
                };
            }

            var newLang = "";
            if (window.Asc.plugin.info)
                newLang = window.Asc.plugin.info.lang;
            if (newLang == "" || newLang != g_language)
            {
                g_language = newLang;
                if (g_language == "en-EN" || g_language == "")
				{
					window.Asc.plugin.translateManager = {};
					if (window.Asc.plugin.onTranslate)
						window.Asc.plugin.onTranslate();
				}
				else
				{
					var _client = new XMLHttpRequest();
					_client.open("GET", "./translations/" + g_language + ".json");

					_client.onreadystatechange = function ()
					{
						if (_client.readyState == 4)
						{
						    if (_client.status == 200 || location.href.indexOf("file:") == 0)
						    {
                                try
                                {
                                    window.Asc.plugin.translateManager = JSON.parse(_client.responseText);
                                }
                                catch (err)
                                {
                                    window.Asc.plugin.translateManager = {};
                                }
                            }
                            else
                            {
                                window.Asc.plugin.translateManager = {};
                            }


                            if (window.Asc.plugin.onTranslate)
                                window.Asc.plugin.onTranslate();
						}
					};
					_client.send();
				}
            }

            switch (type)
            {
                case "init":
                {
                    pluginStart();
                    window.Asc.plugin.init(window.Asc.plugin.info.data);
                    break;
                }
                case "button":
                {
                    var _buttonId = parseInt(pluginData.button);
                    if (!window.Asc.plugin.button && -1 == _buttonId)
						window.Asc.plugin.executeCommand("close", "");
                    else
                        window.Asc.plugin.button(_buttonId);
                    break;
                }
                case "enableMouseEvent":
                {
                    g_isMouseSendEnabled = pluginData.isEnabled;
					if (window.Asc.plugin.onEnableMouseEvent)
						window.Asc.plugin.onEnableMouseEvent(g_isMouseSendEnabled);
                    break;
                }
                case "onExternalMouseUp":
                {
                    if (window.Asc.plugin.onExternalMouseUp)
                        window.Asc.plugin.onExternalMouseUp();
                    break;
                }
                case "onMethodReturn":
                {
					window.Asc.plugin.isWaitMethod = false;

					if (window.Asc.plugin.methodCallback)
					{
					    var methodCallback = window.Asc.plugin.methodCallback;
                        window.Asc.plugin.methodCallback = null;
                        methodCallback(pluginData.methodReturnData);
                        methodCallback = null;
					}
					else if (window.Asc.plugin.onMethodReturn)
					{
						window.Asc.plugin.onMethodReturn(pluginData.methodReturnData);
					}

					if (window.Asc.plugin.executeMethodStack && window.Asc.plugin.executeMethodStack.length > 0)
                    {
                        var obj = window.Asc.plugin.executeMethodStack.shift();
                        window.Asc.plugin.executeMethod(obj.name, obj.params, obj.callback);
                    }

                    break;
                }
				case "onCommandCallback":
				{
                    if (window.Asc.plugin.onCallCommandCallback)
                    {
                        window.Asc.plugin.onCallCommandCallback();
                        window.Asc.plugin.onCallCommandCallback = null;
                    }
                    else if (window.Asc.plugin.onCommandCallback)
						window.Asc.plugin.onCommandCallback();
					break;
				}
                case "onExternalPluginMessage":
                {
					if (window.Asc.plugin.onExternalPluginMessage && pluginData.data && pluginData.data.type)
						window.Asc.plugin.onExternalPluginMessage(pluginData.data);
                }
                case "onEvent":
                {
                    if (window.Asc.plugin["event_" + pluginData.eventName])
                        window.Asc.plugin["event_" + pluginData.eventName](pluginData.eventData);
                }
                default:
                    break;
            }
        }
    };

    function pluginStart()
    {
        if (window.Asc.plugin.isStarted)
            return;

        window.Asc.plugin.isStarted = true;
        window.Asc.plugin.executeCommand = function(type, data, callback)
        {
            window.Asc.plugin.info.type = type;
            window.Asc.plugin.info.data = data;

            var _message = "";
            try
            {
                _message = JSON.stringify(window.Asc.plugin.info);
            }
            catch(err)
            {
                _message = JSON.stringify({ type : data });
            }

            window.Asc.plugin.onCallCommandCallback = callback;
            window.plugin_sendMessage(_message);
        };

        window.Asc.plugin.executeMethod = function(name, params, callback)
        {
            if (window.Asc.plugin.isWaitMethod === true)
            {
                if (undefined === this.executeMethodStack)
                    this.executeMethodStack = [];

                this.executeMethodStack.push({ name : name, params : params, callback : callback });
                return false;
            }

            window.Asc.plugin.isWaitMethod = true;
            window.Asc.plugin.methodCallback = callback;

            window.Asc.plugin.info.type = "method";
            window.Asc.plugin.info.methodName = name;
            window.Asc.plugin.info.data = params;

            var _message = "";
            try
            {
                _message = JSON.stringify(window.Asc.plugin.info);
            }
            catch(err)
            {
                return false;
            }
            window.plugin_sendMessage(_message);
            return true;
        };

        window.Asc.plugin.resizeWindow = function(width, height, minW, minH, maxW, maxH)
        {
            if (undefined == minW)
                minW = 0;
            if (undefined == minH)
                minH = 0;
            if (undefined == maxW)
                maxW = 0;
            if (undefined == maxH)
                maxH = 0;

            var data = JSON.stringify({ width : width, height : height, minw : minW, minh : minH, maxw : maxW, maxh : maxH });

            window.Asc.plugin.info.type = "resize";
            window.Asc.plugin.info.data = data;

            var _message = "";
            try
            {
                _message = JSON.stringify(window.Asc.plugin.info);
            }
            catch(err)
            {
                _message = JSON.stringify({ type : data });
            }
            window.plugin_sendMessage(_message);
        };

        window.Asc.plugin.callCommand = function(func, isClose, isCalc, callback)
        {
            var _txtFunc = "var Asc = {}; Asc.scope = " + JSON.stringify(window.Asc.scope) + "; var scope = Asc.scope; (" + func.toString() + ")();";
            var _type = (isClose === true) ? "close" : "command";
            window.Asc.plugin.info.recalculate = (false === isCalc) ? false : true;
            window.Asc.plugin.executeCommand(_type, _txtFunc, callback);
        };

        window.Asc.plugin.callModule = function(url, callback, isClose)
        {
            var _isClose = isClose;
            var _client = new XMLHttpRequest();
            _client.open("GET", url);

            _client.onreadystatechange = function() {
                if (_client.readyState == 4 && (_client.status == 200 || location.href.indexOf("file:") == 0))
                {
                    var _type = (_isClose === true) ? "close" : "command";
                    window.Asc.plugin.info.recalculate = true;
                    window.Asc.plugin.executeCommand(_type, _client.responseText);
                    if (callback)
                        callback(_client.responseText);
                }
            };
            _client.send();
        };

        window.Asc.plugin.loadModule = function(url, callback)
        {
            var _client = new XMLHttpRequest();
            _client.open("GET", url);

            _client.onreadystatechange = function() {
                if (_client.readyState == 4 && (_client.status == 200 || location.href.indexOf("file:") == 0))
                {
                    if (callback)
                        callback(_client.responseText);
                }
            };
            _client.send();
        };

        window.Asc.plugin.checkPixelRatio = function(isAttack)
        {
            if (window.Asc.plugin.checkedPixelRatio && true !== isAttack)
                return;

            window.Asc.plugin.checkedPixelRatio = true;

            var userAgent = navigator.userAgent.toLowerCase();
            var isIE = (userAgent.indexOf("msie") > -1 || userAgent.indexOf("trident") > -1 || userAgent.indexOf("edge") > -1);
            var isChrome = !isIE && (userAgent.indexOf("chrome") > -1);
            var isMozilla = !isIE && (userAgent.indexOf("firefox") > -1);

            var zoom = 1.0;
            var isRetina = false;
            var retinaPixelRatio = 1;

            var isMobileVersion = window.Asc.plugin.info ? window.Asc.plugin.info.isMobileMode : false;

            // пока отключаем мозиллу... хотя почти все работает
            if ((/*isMozilla || */isChrome) && document && document.firstElementChild && document.body && !isMobileVersion)
            {
                if (window.devicePixelRatio > 0.1)
                {
                    if (window.devicePixelRatio < 1.99)
                    {
                        zoom = window.devicePixelRatio;
                    }
                    else
                    {
                        zoom = window.devicePixelRatio / 2;
                        retinaPixelRatio = 2;
                        isRetina = true;
                    }

                    document.firstElementChild.style.zoom = 1.0 / zoom;
                }
                else
                {
                    document.firstElementChild.style.zoom = "normal";
                }
            }
            else
            {
                isRetina = (Math.abs(2 - window.devicePixelRatio) < 0.01);
                if (isRetina)
                    retinaPixelRatio = 2;

                if (isMobileVersion)
                {
                    isRetina = (window.devicePixelRatio >= 1.9);
                    retinaPixelRatio = window.devicePixelRatio;
                }
            }

            window.Asc.plugin.zoom = zoom;
            window.Asc.plugin.retinaPixelRatio = retinaPixelRatio;
        };

        window.Asc.plugin.checkPixelRatio();
    }

    window.onmousemove = function(e)
    {
        if (!g_isMouseSendEnabled || !window.Asc.plugin || !window.Asc.plugin.executeCommand)
            return;

        var _x = (undefined === e.clientX) ? e.pageX : e.clientX;
        var _y = (undefined === e.clientY) ? e.pageY : e.clientY;

        window.Asc.plugin.executeCommand("onmousemove", JSON.stringify({ x : _x, y : _y }));

    };
    window.onmouseup   = function(e)
    {
        if (!g_isMouseSendEnabled || !window.Asc.plugin || !window.Asc.plugin.executeCommand)
            return;

        var _x = (undefined === e.clientX) ? e.pageX : e.clientX;
        var _y = (undefined === e.clientY) ? e.pageY : e.clientY;

        window.Asc.plugin.executeCommand("onmouseup", JSON.stringify({ x : _x, y : _y }));
    };

    window.plugin_sendMessage(JSON.stringify({ guid : window.Asc.plugin.guid, type : "initialize_internal" }));

})(window, undefined);
