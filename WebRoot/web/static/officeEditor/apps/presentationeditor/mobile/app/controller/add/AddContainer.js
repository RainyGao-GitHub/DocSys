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
 *  AddContainer.js
 *  Presentation Editor
 *
 *  Created by Alexander Yuzhin on 11/22/16
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core'
], function (core) {
    'use strict';

    PE.Controllers.AddContainer = Backbone.Controller.extend(_.extend((function() {
        // private
        var _canAddHyperlink = false,
            _paragraphLocked = false;

        return {
            models: [],
            collections: [],
            views: [],

            initialize: function() {
                //
            },

            setApi: function(api) {
                this.api = api;
                this.api.asc_registerCallback('asc_onCanAddHyperlink', _.bind(this.onApiCanAddHyperlink, this));
                this.api.asc_registerCallback('asc_onFocusObject',     _.bind(this.onApiFocusObject, this));
            },

            onLaunch: function() {
                //
            },

            showModal: function() {
                var me = this;

                if ($$('.container-add.modal-in').length > 0) {
                    return;
                }

                uiApp.closeModal();

                me._showByStack(Common.SharedSettings.get('phone'));

                PE.getController('Toolbar').getView('Toolbar').hideSearch();
            },

            hideModal: function () {
                if (this.picker) {
                    uiApp.closeModal(this.picker);
                }
            },

            _layoutEditorsByStack: function () {
                var me = this,
                    addViews = [];

                addViews.push({
                    caption: me.textSlide,
                    id: 'add-slide',
                    layout: PE.getController('AddSlide')
                        .getView('AddSlide')
                        .rootLayout()
                });

                addViews.push({
                    caption: me.textTable,
                    id: 'add-table',
                    layout: PE.getController('AddTable')
                        .getView('AddTable')
                        .rootLayout()
                });

                addViews.push({
                    caption: me.textShape,
                    id: 'add-shape',
                    layout: PE.getController('AddShape')
                        .getView('AddShape')
                        .rootLayout()
                });

                addViews.push({
                    caption: me.textImage,
                    id: 'add-image',
                    layout: PE.getController('AddImage')
                        .getView('AddImage')
                        .rootLayout()
                });

                if (_canAddHyperlink && !_paragraphLocked)
                    addViews.push({
                        caption: me.textLink,
                        id: 'add-link',
                        layout: PE.getController('AddLink')
                            .getView('AddLink')
                            .rootLayout()
                    });

                return addViews;
            },

            _showByStack: function(isPhone) {
                var me = this,
                    isAndroid = Framework7.prototype.device.android === true,
                    layoutAdds = me._layoutEditorsByStack();

                if ($$('.container-add.modal-in').length > 0) {
                    return;
                }

                // Navigation bar
                var $layoutNavbar = $(
                    '<div class="navbar">' +
                        '<div data-page="index" class="navbar-inner">' +
                            '<div class="center sliding categories"></div>' +
                            (isPhone ? '<div class="right sliding"><a href="#" class="link icon-only close-popup"><i class="icon icon-expand-down"></i></a></div>' : '') +
                        '</div>' +
                    '</div>'
                );


                if (isAndroid) {
                    $layoutNavbar
                        .find('.center')
                        .append('<div class="toolbar tabbar"><div data-page="index" class="toolbar-inner"></div></div>');

                    _.each(layoutAdds, function (layout, index) {
                        $layoutNavbar
                            .find('.toolbar-inner')
                            .append(
                                '<a href="#' + layout.id + '" class="tab-link ' + (index < 1 ? 'active' : '') + '">' + layout.caption + '</a>'
                            );
                    });
                    $layoutNavbar
                        .find('.toolbar-inner')
                        .append('<span class="tab-link-highlight" style="width: ' + (100/layoutAdds.length) + '%;"></span>');
                } else {
                    $layoutNavbar
                        .find('.center')
                        .append('<div class="buttons-row"></div>');

                    _.each(layoutAdds, function (layout, index) {
                        $layoutNavbar
                            .find('.buttons-row')
                            .append(
                                '<a href="#' + layout.id + '" class="tab-link button ' + (index < 1 ? 'active' : '') + '">' + layout.caption + '</a>'
                            );
                    });
                }


                // Content

                var $layoutPages = $(
                    '<div class="pages">' +
                        '<div class="page" data-page="index">' +
                            '<div class="page-content">' +
                                '<div class="tabs-animated-wrap">' +
                                    '<div class="tabs"></div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                );

                _.each(layoutAdds, function (addView, index) {
                    $layoutPages.find('.tabs').append(
                        '<div id="' + addView.id + '" class="tab view ' + (index < 1 ? 'active' : '') + '">' +
                            '<div class="pages">' +
                                '<div class="page no-navbar">' +
                                    '<div class="page-content">' +
                                        addView.layout +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>'
                    );
                });

                if (isPhone) {
                    me.picker = $$(uiApp.popup(
                        '<div class="popup settings container-add">' +
                            '<div class="view add-root-view navbar-through">' +
                                $layoutNavbar.prop('outerHTML') +
                                $layoutPages.prop('outerHTML') +
                            '</div>' +
                        '</div>'
                    ))
                } else {
                    me.picker = uiApp.popover(
                        '<div class="popover settings container-add">' +
                            '<div class="popover-angle"></div>' +
                            '<div class="popover-inner">' +
                                '<div class="content-block">' +
                                    '<div class="view popover-view add-root-view navbar-through">' +
                                        $layoutNavbar.prop('outerHTML') +
                                        $layoutPages.prop('outerHTML') +
                                    '</div>' +
                                '</div>' +
                            '</div>',
                        $$('#toolbar-add')
                    );

                    // Prevent hide overlay. Conflict popover and modals.
                    var $overlay = $('.modal-overlay');

                    $$(me.picker).on('opened', function () {
                        $overlay.on('removeClass', function () {
                            if (!$overlay.hasClass('modal-overlay-visible')) {
                                $overlay.addClass('modal-overlay-visible')
                            }
                        });
                    }).on('close', function () {
                        $overlay.off('removeClass');
                        $overlay.removeClass('modal-overlay-visible')
                    });
                }

                $('.container-add .tab').single('show', function (e) {
                    Common.NotificationCenter.trigger('addcategory:show', e);
                });

                if (isAndroid) {
                    $$('.view.add-root-view.navbar-through').removeClass('navbar-through').addClass('navbar-fixed');
                    $$('.view.add-root-view .navbar').prependTo('.view.add-root-view > .pages > .page');
                }

                me.rootView = uiApp.addView('.add-root-view', {
                    dynamicNavbar: true
                });

                Common.NotificationCenter.trigger('addcontainer:show');
            },

            onApiCanAddHyperlink: function(value) {
                _canAddHyperlink = value;
            },

            onApiFocusObject: function (objects) {
                _paragraphLocked = false;
                _.each(objects, function(object) {
                    if (Asc.c_oAscTypeSelectElement.Paragraph == object.get_ObjectType()) {
                        _paragraphLocked = object.get_ObjectValue().get_Locked();
                    }
                });
            },

            textSlide: 'Slide',
            textTable: 'Table',
            textShape: 'Shape',
            textImage: 'Image',
            textLink:  'Link'
        }
    })(), PE.Controllers.AddContainer || {}))
});