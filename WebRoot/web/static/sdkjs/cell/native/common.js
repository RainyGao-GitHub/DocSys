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

window.IS_NATIVE_EDITOR = true;

window.NativeSupportTimeouts = true;
window.NativeTimeoutObject = {};

setTimeout = window.setTimeout = function(func, interval) {
    if (!window.NativeSupportTimeouts)
        return;

    var id = window["native"]["GenerateTimeoutId"](interval);
    window.NativeTimeoutObject["" + id] = {"func": func, repeat: false};

    return id;
}

clearTimeout = window.clearTimeout = function(id) {
    if (!window.NativeSupportTimeouts)
        return;

    window.NativeTimeoutObject["" + id] = undefined;
    window["native"]["ClearTimeout"](id);
}

setInterval = window.setInterval = function(func, interval) {
    if (!window.NativeSupportTimeouts)
        return;

    var id = window["native"]["GenerateTimeoutId"](interval);
    window.NativeTimeoutObject["" + id] = {func: func, repeat: true, interval: interval};

    return id;
}
clearInterval = window.clearInterval = function(id) {
    if (!window.NativeSupportTimeouts)
        return;
    

    window.NativeTimeoutObject["" + id] = undefined;
    window["native"]["ClearTimeout"](id);
}

function offline_timeoutFire(id) {
    if (!window.NativeSupportTimeouts)
        return;

    var prop = "" + id;

    if (undefined === window.NativeTimeoutObject[prop]) {
        return;
    }

    var func = window.NativeTimeoutObject[prop].func;
    var repeat = window.NativeTimeoutObject[prop].repeat;
    var interval = window.NativeTimeoutObject[prop].interval;

    window.NativeTimeoutObject[prop] = undefined;

    if (!func)
        return;

    func.call(null);

    if (repeat) {
        setInterval(func, interval);
    }

    func = null;
}


var console = {
    log : function(param) { window["native"]["consoleLog"](param); },
    time : function (param) {},
    timeEnd : function (param) {}
};

window["NativeCorrectImageUrlOnPaste"] = function(url) {
    return window["native"]["CorrectImageUrlOnPaste"](url);
};
window["NativeCorrectImageUrlOnCopy"] = function(url) {
    return window["native"]["CorrectImageUrlOnCopy"](url);
};

var global_memory_stream_menu = CreateNativeMemoryStream();

window['SockJS'] = createSockJS();
