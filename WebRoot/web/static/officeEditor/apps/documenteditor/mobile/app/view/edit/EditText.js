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
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/4/16
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/mobile/app/template/EditText.template',
    'jquery',
    'underscore',
    'backbone',
    'common/mobile/lib/component/ThemeColorPalette'
], function (editTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.EditText = Backbone.View.extend(_.extend((function() {
        // private
        var _fontsList,
            _editTextController;

        var _bullets = [
            [
                {type: -1, thumb: ''},
                {type: 1, thumb: 'bullet-01.png'},
                {type: 2, thumb: 'bullet-02.png'},
                {type: 3, thumb: 'bullet-03.png'}
            ],
            [
                {type: 4, thumb: 'bullet-04.png'},
                {type: 5, thumb: 'bullet-05.png'},
                {type: 6, thumb: 'bullet-06.png'},
                {type: 7, thumb: 'bullet-07.png'}
            ]
        ];

        var _numbers = [
            [
                {type: -1, thumb: ''},
                {type: 4, thumb: 'number-01.png'},
                {type: 5, thumb: 'number-02.png'},
                {type: 6, thumb: 'number-03.png'}
            ],
            [
                {type: 1, thumb: 'number-04.png'},
                {type: 2, thumb: 'number-05.png'},
                {type: 3, thumb: 'number-06.png'},
                {type: 7, thumb: 'number-07.png'}
            ]
        ];

        return {
            // el: '.view-main',

            template: _.template(editTemplate),

            events: {
            },

            initialize: function () {
                _editTextController = DE.getController('EditText');
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
            },

            initEvents: function () {
                var me = this;

                $('#font-fonts').single('click',        _.bind(me.showFonts, me));
                $('#font-color').single('click',        _.bind(me.showFontColor, me));
                $('#font-background').single('click',   _.bind(me.showBackgroundColor, me));
                $('#font-additional').single('click',   _.bind(me.showAdditional, me));
                $('#font-line-spacing').single('click', _.bind(me.showLineSpacing, me));
                $('#font-bullets').single('click',      _.bind(me.showBullets, me));
                $('#font-numbers').single('click',      _.bind(me.showNumbers, me));

                Common.Utils.addScrollIfNeed('#edit-text .pages', '#edit-text .page');
                me.initControls();
            },

            // Render layout
            render: function () {
                this.layout = $('<div/>').append(this.template({
                    android : Common.SharedSettings.get('android'),
                    phone   : Common.SharedSettings.get('phone'),
                    scope   : this,
                    bullets : _bullets,
                    numbers : _numbers
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

            showPage: function (templateId, suspendEvent) {
                var rootView = DE.getController('EditContainer').rootView;

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
                }
            },

            showFonts: function () {
                this.showPage('#edit-text-fonts');

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

                _fontsList = uiApp.virtualList('#font-list.virtual-list', {
                    items: DE.getController('EditText').getFonts(),
                    template: $template.html(),
                    onItemsAfterInsert: function (list, fragment) {
                        var fontInfo = _editTextController.getFontInfo();
                        $('#font-list input[name=font-name]').val([fontInfo.name]);

                        $('#font-list li').single('click', _.buffered(function (e) {
                            me.fireEvent('font:click', [me, e]);
                        }, 100));
                    }
                });

                Common.Utils.addScrollIfNeed('.page[data-page=edit-text-font-page]', '.page[data-page=edit-text-font-page] .page-content');
            },

            showFontColor: function () {
                var me = this;
                this.showPage('#edit-text-color', true);

                this.paletteTextColor = new Common.UI.ThemeColorPalette({
                    el: $('.page[data-page=edit-text-font-color] .page-content')
                });
                this.paletteTextColor.on('customcolor', function () {
                    me.showCustomFontColor();
                });
                var template = _.template(['<div class="list-block">',
                    '<ul>',
                    '<li>',
                    '<a id="edit-text-add-custom-color" class="item-link">',
                    '<div class="item-content">',
                    '<div class="item-inner">',
                    '<div class="item-title"><%= scope.textAddCustomColor %></div>',
                    '</div>',
                    '</div>',
                    '</a>',
                    '</li>',
                    '</ul>',
                    '</div>'].join(''));
                $('.page[data-page=edit-text-font-color] .page-content').append(template({scope: this}));
                $('#edit-text-add-custom-color').single('click', _.bind(this.showCustomFontColor, this));

                Common.Utils.addScrollIfNeed('.page[data-page=edit-text-font-color]', '.page[data-page=edit-text-font-color] .page-content');
                this.fireEvent('page:show', [this, '#edit-text-color']);
            },

            showCustomFontColor: function () {
                var me = this,
                    selector = '#edit-text-custom-color-view';
                me.showPage(selector, true);

                me.customColorPicker = new Common.UI.HsbColorPicker({
                    el: $('.page[data-page=edit-text-custom-color] .page-content'),
                    color: me.paletteTextColor.currentColor
                });
                me.customColorPicker.on('addcustomcolor', function (colorPicker, color) {
                    me.paletteTextColor.addNewDynamicColor(colorPicker, color);
                    DE.getController('EditContainer').rootView.router.back();
                });

                me.fireEvent('page:show', [me, selector]);
            },

            showBackgroundColor: function () {
                var me = this;
                this.showPage('#edit-text-background', true);

                this.paletteBackgroundColor = new Common.UI.ThemeColorPalette({
                    el: $('.page[data-page=edit-text-font-background] .page-content'),
                    transparent: true
                });
                this.paletteBackgroundColor.on('customcolor', function () {
                    me.showCustomBackgroundColor();
                });
                var template = _.template(['<div class="list-block">',
                    '<ul>',
                    '<li>',
                    '<a id="edit-text-add-custom-background-color" class="item-link">',
                    '<div class="item-content">',
                    '<div class="item-inner">',
                    '<div class="item-title"><%= scope.textAddCustomColor %></div>',
                    '</div>',
                    '</div>',
                    '</a>',
                    '</li>',
                    '</ul>',
                    '</div>'].join(''));
                $('.page[data-page=edit-text-font-background] .page-content').append(template({scope: this}));
                $('#edit-text-add-custom-background-color').single('click', _.bind(this.showCustomBackgroundColor, this));

                Common.Utils.addScrollIfNeed('.page[data-page=edit-text-font-background]', '.page[data-page=edit-text-font-background] .page-content');
                this.fireEvent('page:show', [this, '#edit-text-background']);
            },

            showCustomBackgroundColor: function () {
                var me = this,
                    selector = '#edit-text-custom-color-view';
                me.showPage(selector, true);

                me.customBackgroundColorPicker = new Common.UI.HsbColorPicker({
                    el: $('.page[data-page=edit-text-custom-color] .page-content'),
                    color: me.paletteBackgroundColor.currentColor
                });
                me.customBackgroundColorPicker.on('addcustomcolor', function (colorPicker, color) {
                    me.paletteBackgroundColor.addNewDynamicColor(colorPicker, color);
                    DE.getController('EditContainer').rootView.router.back();
                });

                me.fireEvent('page:show', [me, selector]);
            },

            showAdditional: function () {
                this.showPage('#edit-text-additional');
                Common.Utils.addScrollIfNeed('.page[data-page=edit-text-additional]', '.page[data-page=edit-text-additional] .page-content');
            },

            showLineSpacing: function () {
                this.showPage('#edit-text-linespacing');
                Common.Utils.addScrollIfNeed('#page-text-linespacing', '#page-text-linespacing .page-content');
            },

            showBullets: function () {
                this.showPage('#edit-text-bullets');
            },

            showNumbers: function () {
                this.showPage('#edit-text-numbers');
            },

            textFonts: 'Fonts',
            textFontColor: 'Font Color',
            textHighlightColor: 'Highlight Color',
            textAdditionalFormat: 'Additional Formatting',
            textBack: 'Back',
            textSize: 'Size',
            textFontColors: 'Font Colors',
            textAutomatic: 'Automatic',
            textHighlightColors: 'Highlight Colors',
            textAdditional: 'Additional',
            textStrikethrough: 'Strikethrough',
            textDblStrikethrough: 'Double Strikethrough',
            textDblSuperscript: 'Superscript',
            textSubscript: 'Subscript',
            textSmallCaps: 'Small Caps',
            textAllCaps: 'All Caps',
            textLetterSpacing: 'Letter Spacing',
            textLineSpacing: 'Line Spacing',
            textBullets: 'Bullets',
            textNone: 'None',
            textNumbers: 'Numbers',
            textCharacterBold: 'B',
            textCharacterItalic: 'I',
            textCharacterUnderline: 'U',
            textCharacterStrikethrough: 'S',
            textAddCustomColor: 'Add Custom Color',
            textCustomColor: 'Custom Color'
        }
    })(), DE.Views.EditText || {}))
});