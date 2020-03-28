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
 *  app.js
 *
 *  Created by Alexander Yuzhin on 9/21/16
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

'use strict';
var reqerr;
require.config({
    baseUrl: '../../',
    paths: {
        jquery          : '../vendor/jquery/jquery',
        underscore      : '../vendor/underscore/underscore',
        backbone        : '../vendor/backbone/backbone',
        framework7      : '../vendor/framework7/js/framework7',
        text            : '../vendor/requirejs-text/text',
        xregexp         : '../vendor/xregexp/xregexp-all-min',
        sockjs          : '../vendor/sockjs/sockjs.min',
        jszip           : '../vendor/jszip/jszip.min',
        jsziputils      : '../vendor/jszip-utils/jszip-utils.min',
        allfonts        : '../../sdkjs/common/AllFonts',
        sdk             : '../../sdkjs/word/sdk-all-min',
        api             : 'api/documents/api',
        core            : 'common/main/lib/core/application',
        extendes        : 'common/mobile/utils/extendes',
        notification    : 'common/main/lib/core/NotificationCenter',
        localstorage    : 'common/main/lib/util/LocalStorage',
        analytics       : 'common/Analytics',
        gateway         : 'common/Gateway',
        locale          : 'common/locale',
        irregularstack  : 'common/IrregularStack',
        sharedsettings  : 'common/mobile/utils/SharedSettings'
    },

    shim: {
        framework7: {
            exports: 'Framework7'
        },
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        core: {
            deps: [
                'backbone',
                'notification',
                'irregularstack',
                'sharedsettings'
            ]
        },
        extendes: {
            deps: [
                'underscore',
                'jquery',
                'framework7'
            ]
        },
        sdk: {
            deps: [
                'jquery',
                'underscore',
                'allfonts',
                'xregexp',
                'sockjs',
                'jszip',
                'jsziputils'
            ]
        },
        gateway: {
            deps: [
                'jquery'
            ]
        },
        analytics: {
            deps: [
                'jquery'
            ]
        }
    }
});

require([
    'backbone',
    'framework7',
    'core',
    'underscore',
    'extendes',
    'sdk',
    'api',
    'analytics',
    'gateway',
    'locale'
], function (Backbone, Framework7, Core) {
    Backbone.history.start();

    /**
     * Application instance with DE namespace defined
     */
    var app = new Backbone.Application({
        nameSpace: 'DE',
        autoCreate: false,
        controllers : [
            'Common.Controllers.Plugins',
            'Editor',
            'Toolbar',
            'Search',
            'Main',
            'DocumentHolder',
            'Settings',
            'EditContainer',
            'EditText',
            'EditParagraph',
            'EditHeader',
            'EditTable',
            'EditImage',
            'EditShape',
            'EditChart',
            'EditHyperlink',
            'AddContainer',
            'AddTable',
            'AddShape',
            'AddImage',
            'AddOther',
            'Common.Controllers.Collaboration'
        ]
    });

    var device = Framework7.prototype.device;
    var loadPlatformCss = function (filename, opt){
        var fileref = document.createElement('link');
        fileref.setAttribute('rel', 'stylesheet');
        fileref.setAttribute('type', 'text/css');
        fileref.setAttribute('href', filename);

        if (typeof fileref != 'undefined') {
            document.getElementsByTagName("head")[0].appendChild(fileref);
        }
    };

    //Store Framework7 initialized instance for easy access
    window.uiApp = new Framework7({
        // Default title for modals
        modalTitle: '{{APP_TITLE_TEXT}}',

        // Enable tap hold events
        tapHold: true,

        // If it is webapp, we can enable hash navigation:
//        pushState: false,

        // If Android
        material: device.android,

        // Hide and show indicator during ajax requests
        onAjaxStart: function (xhr) {
            uiApp.showIndicator();
        },
        onAjaxComplete: function (xhr) {
            uiApp.hideIndicator();
        }
    });

    //Export DOM7 to local variable to make it easy accessable
    window.$$ = Dom7;

    //Load platform styles
    loadPlatformCss('resources/css/app-' + (device.android ? 'material' : 'ios') + '.css');

    Common.Locale.apply(function() {
        require([
            'common/main/lib/util/LocalStorage',
            'common/main/lib/util/utils',
            'common/mobile/lib/controller/Plugins',
            'documenteditor/mobile/app/controller/Editor',
            'documenteditor/mobile/app/controller/Toolbar',
            'documenteditor/mobile/app/controller/Search',
            'documenteditor/mobile/app/controller/Main',
            'documenteditor/mobile/app/controller/DocumentHolder',
            'documenteditor/mobile/app/controller/Settings',
            'documenteditor/mobile/app/controller/edit/EditContainer',
            'documenteditor/mobile/app/controller/edit/EditText',
            'documenteditor/mobile/app/controller/edit/EditParagraph',
            'documenteditor/mobile/app/controller/edit/EditHeader',
            'documenteditor/mobile/app/controller/edit/EditTable',
            'documenteditor/mobile/app/controller/edit/EditImage',
            'documenteditor/mobile/app/controller/edit/EditShape',
            'documenteditor/mobile/app/controller/edit/EditChart',
            'documenteditor/mobile/app/controller/edit/EditHyperlink',
            'documenteditor/mobile/app/controller/add/AddContainer',
            'documenteditor/mobile/app/controller/add/AddTable',
            'documenteditor/mobile/app/controller/add/AddShape',
            'documenteditor/mobile/app/controller/add/AddImage',
            'documenteditor/mobile/app/controller/add/AddOther',
            'common/mobile/lib/controller/Collaboration'
        ], function() {
            app.start();
        });
    });
}, function(err) {
    if (err.requireType == 'timeout' && !reqerr && window.requireTimeourError) {
        reqerr = window.requireTimeourError();
        window.alert(reqerr);
        window.location.reload();
    }
});