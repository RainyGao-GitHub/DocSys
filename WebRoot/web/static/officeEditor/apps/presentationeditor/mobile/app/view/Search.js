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
 *  Search.js
 *  Presentation Editor
 *
 *  Created by Alexander Yuzhin on 11/22/16
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!presentationeditor/mobile/app/template/Search.template',
    'jquery',
    'underscore',
    'backbone'
], function (searchTemplate, $, _, Backbone) {
    'use strict';

    PE.Views.Search = Backbone.View.extend(_.extend((function() {
        // private
        var _isEdit = false,
            _layout;

        return {
            el: '.view-main',

            // Compile our stats template
            template: _.template(searchTemplate),

            // Delegated events for creating new items, and clearing completed ones.
            events: {},

            // Set innerHTML and get the references to the DOM elements
            initialize: function () {
                this.on('searchbar:show', _.bind(this.initEvents, this));
            },

            initEvents: function() {
                $('#search-settings').single('click', _.bind(this.showSettings, this));
            },

            // Render layout
            render: function () {
                _layout = $('<div/>').append(this.template({
                    android : Common.SharedSettings.get('android'),
                    phone   : Common.SharedSettings.get('phone'),
                    isEdit  : _isEdit,
                    scope   : this
                }));

                return this;
            },

            setMode: function (mode) {
                _isEdit = mode.isEdit;
                this.render();
            },

            showSettings: function (e) {
                var me = this;

                uiApp.closeModal();

                if (Common.SharedSettings.get('phone')) {
                    me.picker = $$(uiApp.popup([
                        '<div class="popup settings">',
                            '<div class="view search-settings-view navbar-through">',
                                _layout.find('#search-settings-view').html(),
                            '</div>',
                        '</div>'].join('')
                    ))
                } else {
                    me.picker = uiApp.popover([
                            '<div class="popover settings" style="width: 280px; height: 300px;">',
                                '<div class="popover-angle"></div>',
                                '<div class="popover-inner">',
                                    '<div class="content-block">',
                                        '<div class="view popover-view search-settings-view navbar-through" style="height: 300px;">',
                                            _layout.find('#search-settings-view').html(),
                                        '</div>',
                                    '</div>',
                                '</div>',
                            '</div>'].join(''),
                        $$('#search-settings')
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

                if (Common.SharedSettings.get('android')) {
                    $$('.view.search-settings-view.navbar-through').removeClass('navbar-through').addClass('navbar-fixed');
                    $$('.view.search-settings-view .navbar').prependTo('.view.search-settings-view > .pages > .page');
                }

                me.fireEvent('searchbar:showsettings', me);
            },

            showSearch: function () {
                var me = this,
                    searchBar = $$('.searchbar.document');

                if (searchBar.length < 1) {
                    $(me.el).find('.pages .page').first().prepend(_layout.find('#search-panel-view').html());

                    // Show replace mode if needed
                    var isReplace = Common.SharedSettings.get('search-is-replace');
                    $('.searchbar.document').toggleClass('replace', !_.isUndefined(isReplace) && (isReplace === true));

                    me.fireEvent('searchbar:render', me);
                    me.fireEvent('searchbar:show', me);

                    searchBar = $$('.searchbar.document');

                    if ($('.logo-navbar').length > 0) {
                        var top = Common.SharedSettings.get('android') ? '80px' : '68px';
                        $('.navbar-through .page > .searchbar').css('top', top);
                    }

                    _.defer(function() {
                        uiApp.showNavbar(searchBar);

                        searchBar.transitionEnd(function () {
                            if (!searchBar.hasClass('navbar-hidden')) {
                                $('.searchbar.search input').focus();
                            }
                        });
                    }, 10);
                }
            },

            hideSearch: function () {
                var me = this,
                    searchBar = $$('.searchbar.document');

                if (searchBar.length > 0) {
                    // Animating
                    if (searchBar.hasClass('.navbar-hidding')) {
                        return;
                    }

                    _.defer(function() {
                        searchBar.transitionEnd(function () {
                            me.fireEvent('searchbar:hide', me);
                            searchBar.remove();
                        });

                        uiApp.hideNavbar(searchBar);
                    }, 10);
                }
            },

            textFind: 'Find',
            textFindAndReplace: 'Find and Replace',
            textDone: 'Done',
            textSearch: 'Search',
            textReplace: 'Replace',
            textCase: 'Case sensitive',
            textHighlight: 'Highlight results'
        }
    })(), PE.Views.Search || {}))
});