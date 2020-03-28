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
 *    app.js
 *
 *    Created by Julia Radzhabova on 26 March 2014
 *    Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

'use strict';
var reqerr;
require.config({
    // The shim config allows us to configure dependencies for
    // scripts that do not call define() to register a module
    baseUrl: '../../',
    paths: {
        jquery          : '../vendor/jquery/jquery',
        underscore      : '../vendor/underscore/underscore',
        backbone        : '../vendor/backbone/backbone',
        bootstrap       : '../vendor/bootstrap/dist/js/bootstrap',
        text            : '../vendor/requirejs-text/text',
        perfectscrollbar: 'common/main/lib/mods/perfect-scrollbar',
        jmousewheel     : '../vendor/perfect-scrollbar/src/jquery.mousewheel',
        xregexp         : '../vendor/xregexp/xregexp-all-min',
        sockjs          : '../vendor/sockjs/sockjs.min',
        api             : 'api/documents/api',
        core            : 'common/main/lib/core/application',
        notification    : 'common/main/lib/core/NotificationCenter',
        keymaster       : 'common/main/lib/core/keymaster',
        tip             : 'common/main/lib/util/Tip',
        localstorage    : 'common/main/lib/util/LocalStorage',
        analytics       : 'common/Analytics',
        gateway         : 'common/Gateway',
        locale          : 'common/locale',
        irregularstack  : 'common/IrregularStack'
    },
    shim: {
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
        bootstrap: {
            deps: [
                'jquery'
            ]
        },
        perfectscrollbar: {
            deps: [
                'jmousewheel'
            ]
        },
        notification: {
            deps: [
                'backbone'
            ]
        },
        core: {
            deps: [
                'backbone',
                'notification',
                'irregularstack'
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
    'bootstrap',
    'core',
    'api',
    'analytics',
    'gateway',
    'locale',
    'sockjs',
    'xregexp',
    'underscore'
], function (Backbone, Bootstrap, Core) {
    Backbone.history.start();

    /**
     * Application instance with PE namespace defined
     */
    var app = new Backbone.Application({
        nameSpace: 'PE',
        autoCreate: false,
        controllers : [
            'Viewport',
            'DocumentHolder',
            'Toolbar',
            'Statusbar',
            'RightMenu',
            'LeftMenu',
            'Main',
            'Common.Controllers.Fonts'
            /** coauthoring begin **/
            , 'Common.Controllers.Chat'
            ,'Common.Controllers.Comments'
            /** coauthoring end **/
            ,'Common.Controllers.Plugins'
            ,'Common.Controllers.ExternalDiagramEditor'
            ,'Common.Controllers.ReviewChanges'
            ,'Common.Controllers.Protection'
        ]
    });

    Common.Locale.apply(function(){
        require([
            'presentationeditor/main/app/controller/Viewport',
            'presentationeditor/main/app/controller/DocumentHolder',
            'presentationeditor/main/app/controller/Toolbar',
            'presentationeditor/main/app/controller/Statusbar',
            'presentationeditor/main/app/controller/RightMenu',
            'presentationeditor/main/app/controller/LeftMenu',
            'presentationeditor/main/app/controller/Main',
            'presentationeditor/main/app/view/FileMenuPanels',
            'presentationeditor/main/app/view/ParagraphSettings',
            'presentationeditor/main/app/view/ImageSettings',
            'presentationeditor/main/app/view/ShapeSettings',
            'presentationeditor/main/app/view/SlideSettings',
            'presentationeditor/main/app/view/TableSettings',
            'presentationeditor/main/app/view/TextArtSettings',
            'presentationeditor/main/app/view/SignatureSettings',
            'common/main/lib/util/utils',
            'common/main/lib/util/LocalStorage',
            'common/main/lib/controller/Fonts'
            /** coauthoring begin **/
            ,'common/main/lib/controller/Comments',
            'common/main/lib/controller/Chat',
            /** coauthoring end **/
            'common/main/lib/controller/Plugins',
            'presentationeditor/main/app/view/ChartSettings',
            'common/main/lib/controller/ExternalDiagramEditor'
            ,'common/main/lib/controller/ReviewChanges'
            ,'common/main/lib/controller/Protection'
            ,'common/main/lib/controller/Desktop'
        ], function() {
            window.compareVersions = true;
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