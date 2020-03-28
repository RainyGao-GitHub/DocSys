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
 *  Toolbar.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 9/23/16
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'jquery',
    'underscore',
    'backbone',
    'documenteditor/mobile/app/view/Toolbar'
], function (core, $, _, Backbone) {
    'use strict';

    DE.Controllers.Toolbar = Backbone.Controller.extend(_.extend((function() {
        // private
        var stateDisplayMode = false;

        return {
            models: [],
            collections: [],
            views: [
                'Toolbar'
            ],

            initialize: function() {
                Common.Gateway.on('init', _.bind(this.loadConfig, this));
            },

            loadConfig: function (data) {
                if (data && data.config && data.config.canBackToFolder !== false &&
                    data.config.customization && data.config.customization.goback && (data.config.customization.goback.url || data.config.customization.goback.requestClose && data.config.canRequestClose)) {
                    $('#document-back').show().single('click', _.bind(this.onBack, this));
                }
            },

            setApi: function(api) {
                this.api = api;

                this.api.asc_registerCallback('asc_onCanUndo',      _.bind(this.onApiCanRevert, this, 'undo'));
                this.api.asc_registerCallback('asc_onCanRedo',      _.bind(this.onApiCanRevert, this, 'redo'));
                this.api.asc_registerCallback('asc_onFocusObject',  _.bind(this.onApiFocusObject, this));
                this.api.asc_registerCallback('asc_onCoAuthoringDisconnect', _.bind(this.onCoAuthoringDisconnect, this));
                this.api.asc_registerCallback('asc_onAuthParticipantsChanged', _.bind(this.displayCollaboration, this));
                this.api.asc_registerCallback('asc_onParticipantsChanged',     _.bind(this.displayCollaboration, this));
                Common.NotificationCenter.on('api:disconnect',      _.bind(this.onCoAuthoringDisconnect, this));
            },

            setMode: function (mode) {
                this.getView('Toolbar').setMode(mode);
            },

            onLaunch: function() {
                var me = this;
                me.createView('Toolbar').render();

                $('#toolbar-undo').single('click',  _.bind(me.onUndo, me));
                $('#toolbar-redo').single('click',  _.bind(me.onRedo, me));
            },

            setDocumentTitle: function (title) {
                $('#toolbar-title').html(title);
            },

            // Handlers

            onBack: function (e) {
                var me = this;

                if (me.api.isDocumentModified()) {
                    uiApp.modal({
                        title   : me.dlgLeaveTitleText,
                        text    : me.dlgLeaveMsgText,
                        verticalButtons: true,
                        buttons : [
                            {
                                text: me.leaveButtonText,
                                onClick: function() {
                                    Common.NotificationCenter.trigger('goback', true);
                                }
                            },
                            {
                                text: me.stayButtonText,
                                bold: true
                            }
                        ]
                    });
                } else {
                    Common.NotificationCenter.trigger('goback', true);
                }
            },

            onUndo: function (e) {
                if (this.api)
                    this.api.Undo();
            },

            onRedo: function (e) {
                if (this.api)
                    this.api.Redo();
            },

            // API handlers

            onApiCanRevert: function(which, can) {
                if (this.isDisconnected) return;

                if (which == 'undo') {
                    $('#toolbar-undo').toggleClass('disabled', !can);
                } else {
                    $('#toolbar-redo').toggleClass('disabled', !can);
                }
            },

            setDisplayMode: function(displayMode) {
                stateDisplayMode = displayMode == "final" || displayMode == "original" ? true : false;
                var selected = this.api.getSelectedElements();
                this.onApiFocusObject(selected);
            },

            onApiFocusObject: function (objects) {
                if (this.isDisconnected) return;

                if (objects.length > 0) {
                    var topObject = _.find(objects.reverse(), function (obj) {
                            return obj.get_ObjectType() != Asc.c_oAscTypeSelectElement.SpellCheck;
                        }),
                        topObjectValue = topObject.get_ObjectValue(),
                        objectLocked = _.isFunction(topObjectValue.get_Locked) ? topObjectValue.get_Locked() : false;

                    $('#toolbar-add, #toolbar-edit').toggleClass('disabled', objectLocked || stateDisplayMode);
                }
            },

            activateControls: function() {
                $('#toolbar-edit, #toolbar-add, #toolbar-settings, #toolbar-search, #document-back, #toolbar-edit-document, #toolbar-collaboration').removeClass('disabled');
            },

            activateViewControls: function() {
                $('#toolbar-search, #document-back, #toolbar-collaboration').removeClass('disabled');
            },

            deactivateEditControls: function() {
                $('#toolbar-edit, #toolbar-add, #toolbar-settings').addClass('disabled');
            },

            onCoAuthoringDisconnect: function() {
                this.isDisconnected = true;
                this.deactivateEditControls();
                $('#toolbar-undo').toggleClass('disabled', true);
                $('#toolbar-redo').toggleClass('disabled', true);
                DE.getController('AddContainer').hideModal();
                DE.getController('EditContainer').hideModal();
                DE.getController('Settings').hideModal();
            },

            displayCollaboration: function(users) {
                if(users !== undefined) {
                    var length = 0;
                    _.each(users, function (item) {
                        if (!item.asc_getView())
                            length++;
                    });
                    if (length > 0) {
                        $('#toolbar-collaboration').show();
                    } else {
                        $('#toolbar-collaboration').hide();
                    }
                }
            },

            dlgLeaveTitleText   : 'You leave the application',
            dlgLeaveMsgText     : 'You have unsaved changes in this document. Click \'Stay on this Page\' to await the autosave of the document. Click \'Leave this Page\' to discard all the unsaved changes.',
            leaveButtonText     : 'Leave this Page',
            stayButtonText      : 'Stay on this Page'
        }
    })(), DE.Controllers.Toolbar || {}))
});