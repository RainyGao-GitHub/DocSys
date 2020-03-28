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
 *  EditText.js
 *  Spreadsheet Editor
 *
 *  Created by Alexander Yuzhin on 12/21/16
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!spreadsheeteditor/mobile/app/template/EditText.template',
    'jquery',
    'underscore',
    'backbone',
    'common/mobile/lib/component/ThemeColorPalette',
    'common/mobile/lib/component/HsbColorPicker'
], function (editTemplate, $, _, Backbone) {
    'use strict';

    SSE.Views.EditText = Backbone.View.extend(_.extend((function() {
        // private
        var _fontsArray = [];
        return {
            // el: '.view-main',

            template: _.template(editTemplate),

            events: {
            },

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
                Common.NotificationCenter.on('fonts:load', _.bind(this.onApiFontsLoad, this));
            },

            initEvents: function () {
                var me = this;

                me.updateItemHandlers();
                me.initControls();
            },

            // Render layout
            render: function () {
                this.layout = $('<div/>').append(this.template({
                    android : Common.SharedSettings.get('android'),
                    phone   : Common.SharedSettings.get('phone'),
                    scope   : this
                }));

                return this;
            },

            rootLayout: function () {
                if (this.layout) {
                    return this.layout
                        .find('#edit-text-root')
                        .html();
                }

                return '';
            },

            initControls: function () {
                //
            },

            updateItemHandlers: function () {
                var selectorsDynamicPage = [
                    '#edit-text'
                ].map(function (selector) {
                    return selector + ' a.item-link[data-page]';
                }).join(', ');

                $(selectorsDynamicPage).single('click', _.bind(this.onItemClick, this));
                $('#font-color').single('click', _.bind(this.showFontColor, this));
            },

            showPage: function (templateId, suspendEvent) {
                var rootView = SSE.getController('EditContainer').rootView;

                if (rootView && this.layout) {
                    var $content = this.layout.find(templateId);

                    // Android fix for navigation
                    if (Framework7.prototype.device.android) {
                        $content.find('.page').append($content.find('.navbar'));
                    }

                    rootView.router.load({
                        content: $content.html()
                    });

                    if (suspendEvent !== true) {
                        this.fireEvent('page:show', [this, templateId]);
                    }

                    this.initEvents();
                }
            },

            showFontColor: function () {
                var me = this;
                var page = '#edit-text-color';
                this.showPage(page, true);

                this.paletteTextColor = new Common.UI.ThemeColorPalette({
                    el: $('.page[data-page=edit-text-color] .page-content'),
                    transparent: true
                });
                this.paletteTextColor.on('customcolor', function () {
                    me.showCustomTextColor();
                });
                var template = _.template(['<div class="list-block">',
                    '<ul>',
                    '<li>',
                    '<a id="edit-text-add-custom-fill-color" class="item-link">',
                    '<div class="item-content">',
                    '<div class="item-inner">',
                    '<div class="item-title"><%= scope.textAddCustomColor %></div>',
                    '</div>',
                    '</div>',
                    '</a>',
                    '</li>',
                    '</ul>',
                    '</div>'].join(''));
                $('.page[data-page=edit-text-color] .page-content').append(template({scope: this}));
                $('#edit-text-add-custom-fill-color').single('click', _.bind(this.showCustomTextColor, this));

                Common.Utils.addScrollIfNeed('.page[data-page=edit-text]', '.page[data-page=edit-text] .page-content');
                this.fireEvent('page:show', [this, page]);
            },

            showCustomTextColor: function () {
                var me = this,
                    selector = '#edit-text-custom-color-view';
                me.showPage(selector, true);

                me.customTextColorPicker = new Common.UI.HsbColorPicker({
                    el: $('.page[data-page=edit-text-custom-color] .page-content'),
                    color: me.paletteTextColor.currentColor
                });
                me.customTextColorPicker.on('addcustomcolor', function (colorPicker, color) {
                    me.paletteTextColor.addNewDynamicColor(colorPicker, color);
                    SSE.getController('EditContainer').rootView.router.back();
                });

                me.fireEvent('page:show', [me, selector]);
            },

            renderFonts: function () {
                var me = this,
                    $template = $(
                        '<div>' +
                            '<li>' +
                                '<label class="label-radio item-content">' +
                                    '<input type="radio" name="font-name" value="{{name}}">' +
                                        (Framework7.prototype.device.android ? '<div class="item-media"><i class="icon icon-form-radio"></i></div>' : '') +
                                    '<div class="item-inner">' +
                                        '<div class="item-title" style="font-family: \'{{name}}\';">{{name}}</div>' +
                                    '</div>' +
                                '</label>' +
                            '</li>' +
                        '</div>'
                    );

                uiApp.virtualList('#font-list.virtual-list', {
                    items: _fontsArray,
                    template: $template.html(),
                    onItemsAfterInsert: function (list, fragment) {
                        var fontInfo = SSE.getController('EditText').getFontInfo();
                        $('#font-list input[name=font-name]').val([fontInfo.name]);

                        $('#font-list li').single('click', _.buffered(function (e) {
                            me.fireEvent('font:click', [me, e]);
                        }, 100));
                    }
                });
            },

            onItemClick: function (e) {
                var $target = $(e.currentTarget),
                    page = $target.data('page');

                if (page && page.length > 0 ) {
                    this.showPage(page);
                }
            },

            onApiFontsLoad: function (fonts, selcted) {
                _fontsArray = fonts;
            },

            textBack: 'Back',
            textFonts: 'Fonts',
            textTextColor: 'Text Color',
            textFillColor: 'Fill Color',
            textSize: 'Size',
            textCharacterBold: 'B',
            textCharacterItalic: 'I',
            textCharacterUnderline: 'U',
            textAddCustomColor: 'Add Custom Color',
            textCustomColor: 'Custom Color'
        }
    })(), SSE.Views.EditText || {}))
});