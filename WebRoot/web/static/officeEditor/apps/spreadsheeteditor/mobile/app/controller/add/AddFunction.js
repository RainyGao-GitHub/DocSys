/*
 *
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

/**
 *  AddFunction.js
 *
 *  Created by Maxim Kadushkin on 12/14/2016
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */


define([
    'core',
    'spreadsheeteditor/mobile/app/view/add/AddFunction',
    'text!../../../resources/l10n/functions/en.json',
    'text!../../../resources/l10n/functions/en_desc.json'
], function (core, view, fc, fd) {
    'use strict';

    SSE.Controllers.AddFunction = Backbone.Controller.extend(_.extend((function() {

        return {
            models: [],
            collections: [],
            views: [
                'AddFunction'
            ],

            initialize: function () {
                var me = this;

                Common.NotificationCenter.on('addcontainer:show',   _.bind(me.initEvents, me));
                Common.NotificationCenter.on('document:ready',      _.bind(me.onDocumentReady, me));

                me.addListeners({
                    'AddFunction': {
                        'function:insert': me.onInsertFunction.bind(me),
                        'function:info': me.onFunctionInfo.bind(me)
                    }
                });
                this.fd = fd;
            },

            setApi: function (api) {
                this.api = api;
            },

            onLaunch: function () {
                this.createView('AddFunction').render();
            },

            initEvents: function () {
            },

            onDocumentReady: function () {
                var me = this;

                _.defer(function () {
                    var editorLang = Common.localStorage.getItem('sse-settings-func-lang');

                    editorLang = (editorLang ? editorLang : 'en').split(/[\-\_]/)[0].toLowerCase();

                    var localizationFunctions = function(data) {
                        fc = data;
                        me.api.asc_setLocalization(fc);
                        me.fillFunctions.call(me);
                    };

                    $.getJSON(Common.Utils.String.format("{0}/{1}.json", "resources/l10n/functions", editorLang), function(json) {
                        localizationFunctions(json);
                    }).fail(function() {
                        localizationFunctions(fc);
                    });
                });
            },

            fillFunctions: function() {
                var me = this,
                    functions = {};
                var editorLang = Common.localStorage.getItem('sse-settings-func-lang');

                editorLang = (editorLang ? editorLang : 'en').split(/[\-\_]/)[0].toLowerCase();

                var localizationFunctionsDesc = function (data) {};

                $.getJSON(Common.Utils.String.format("{0}/{1}_desc.json", "resources/l10n/functions", editorLang), function(json) {
                    localizationFunctionsDesc(json);
                }).fail(function() {
                    localizationFunctionsDesc(fd);
                });
            },

            onInsertFunction: function (type) {
                SSE.getController('AddContainer').hideModal();
            },

            onFunctionInfo: function (type) {
                this.getView('AddFunction').openFunctionInfo(type);
            }
        }
    })(), SSE.Controllers.AddFunction || {}))
});