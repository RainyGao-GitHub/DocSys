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
 *  EditParagraph.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/14/16
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/mobile/app/template/EditParagraph.template',
    'jquery',
    'underscore',
    'backbone'
], function (editTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.EditParagraph = Backbone.View.extend(_.extend((function() {
        // private
        // var _paragraphStyles;

        return {
            // el: '.view-main',

            template: _.template(editTemplate),

            events: {
                // "click #font-fonts" : "showPage",
                // "click #font-color" : "showPage"
            },

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
            },

            initEvents: function () {
                var me = this;

                $('#paragraph-background').single('click',  _.bind(me.showColors, me));
                $('#paragraph-advanced').single('click',    _.bind(me.showAdvanced, me));

                me.renderStyles();

                DE.getController('EditParagraph').initSettings();
                Common.Utils.addScrollIfNeed('#edit-paragraph .pages', '#edit-paragraph .page');
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
                        .find('#edit-paragraph-root')
                        .html();
                }

                return '';
            },

            showPage: function (templateId, customFireEvent) {
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

                    if (customFireEvent !== true) {
                        this.fireEvent('page:show', [this, templateId]);
                    }
                }
            },

            renderStyles: function () {
                var me = this,
                    thumbSize = DE.getController('EditParagraph').getThumbSize(),
                    $styleList = $('#paragraph-list ul'),
                    template = _.template(
                        '<li>' +
                            '<label class="label-radio item-content">' +
                                '<input type="radio" name="paragraph-style" value="<%= name %>">' +
                                (Framework7.prototype.device.android ? '<div class="item-media"><i class="icon icon-form-radio"></i></div>' : '') +
                                '<div class="item-inner">' +
                                    '<div data-name="<%= name %>" class="item-title style" style="background-image: url(<%= image %>); width:{0}px; height:{1}px; background-size:{0}px {1}px; background-repeat: no-repeat;"></div>'.format(thumbSize.width, thumbSize.height) +
                                '</div>' +
                            '</label>' +
                        '</li>'
                    );

                _.each(DE.getController('EditParagraph').getStyles(), function(style) {
                    $(template(style)).appendTo($styleList).on('click', _.buffered(function (e) {
                        me.fireEvent('style:click', [me, e]);
                    }, 100))
                });
            },

            showColors: function () {
                var me = this;
                this.showPage('#edit-paragraph-color', true);

                this.paletteBackgroundColor = new Common.UI.ThemeColorPalette({
                    el: $('.page[data-page=edit-paragraph-color] .page-content'),
                    transparent: true
                });
                this.paletteBackgroundColor.on('customcolor', function () {
                    me.showCustomColor();
                });
                var template = _.template(['<div class="list-block">',
                    '<ul>',
                    '<li>',
                    '<a id="edit-paragraph-add-custom-color" class="item-link">',
                    '<div class="item-content">',
                    '<div class="item-inner">',
                    '<div class="item-title"><%= scope.textAddCustomColor %></div>',
                    '</div>',
                    '</div>',
                    '</a>',
                    '</li>',
                    '</ul>',
                    '</div>'].join(''));
                $('.page[data-page=edit-paragraph-color] .page-content').append(template({scope: this}));
                $('#edit-paragraph-add-custom-color').single('click', _.bind(this.showCustomColor, this));

                Common.Utils.addScrollIfNeed('.page[data-page=edit-paragraph-color]', '.page[data-page=edit-paragraph-color] .page-content');
                this.fireEvent('page:show', [this, '#edit-paragraph-color']);
            },

            showAdvanced: function () {
                this.showPage('#edit-paragraph-advanced');
                Common.Utils.addScrollIfNeed('.page[data-page=edit-paragraph-advanced]', '.page[data-page=edit-paragraph-advanced] .page-content');
            },

            showCustomColor: function () {
                var me = this,
                    selector = '#edit-paragraph-custom-color-view';
                me.showPage(selector, true);

                me.customColorPicker = new Common.UI.HsbColorPicker({
                    el: $('.page[data-page=edit-paragraph-custom-color] .page-content'),
                    color: me.paletteBackgroundColor.currentColor
                });
                me.customColorPicker.on('addcustomcolor', function (colorPicker, color) {
                    me.paletteBackgroundColor.addNewDynamicColor(colorPicker, color);
                    DE.getController('EditContainer').rootView.router.back();
                });

                me.fireEvent('page:show', [me, selector]);
            },

            textBackground: 'Background',
            textAdvSettings: 'Advanced settings',
            textPrgStyles: 'Paragraph styles',
            textBack: 'Back',
            textAdvanced: 'Advanced',
            textFromText: 'Distance from Text',
            textBefore: 'Before',
            textAuto: 'Auto',
            textFirstLine: 'First Line',
            textAfter: 'After',
            textSpaceBetween: 'Space Between Paragraphs',
            textPageBreak: 'Page Break Before',
            textOrphan: 'Orphan Control',
            textKeepLines: 'Keep Lines Together',
            textKeepNext: 'Keep with Next',
            textAddCustomColor: 'Add Custom Color',
            textCustomColor: 'Custom Color'
        }
    })(), DE.Views.EditParagraph || {}))
});