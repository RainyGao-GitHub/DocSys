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
 *  EditShape.js
 *  Presentation Editor
 *
 *  Created by Julia Radzhabova on 11/25/16
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!presentationeditor/mobile/app/template/EditShape.template',
    'jquery',
    'underscore',
    'backbone',
    'common/mobile/lib/component/ThemeColorPalette',
    'common/mobile/lib/component/HsbColorPicker'
], function (editTemplate, $, _, Backbone) {
    'use strict';

    PE.Views.EditShape = Backbone.View.extend(_.extend((function() {
        // private

        return {
            // el: '.view-main',

            template: _.template(editTemplate),

            events: {
            },

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
                Common.NotificationCenter.on('editcategory:show',  _.bind(this.categoryShow, this));
                this.isShapeCanFill = true;
            },

            initEvents: function () {
                var me = this;

                $('#shape-style').single('click',                   _.bind(me.showStyle, me));
                $('#shape-replace').single('click',                 _.bind(me.showReplace, me));
                $('#shape-reorder').single('click',                 _.bind(me.showReorder, me));
                $('#shape-align').single('click',                   _.bind(me.showAlign, me));
                $('#edit-shape-bordercolor').single('click',        _.bind(me.showBorderColor, me));

                $('.edit-shape-style .categories a').single('click', _.bind(me.showStyleCategory, me));

                Common.Utils.addScrollIfNeed('#edit-shape .pages', '#edit-shape .page');
                me.initControls();
            },

            categoryShow: function(e) {
                // if ('edit-shape' == $(e.currentTarget).prop('id')) {
                //     this.initEvents();
                // }
            },

            // Render layout
            render: function () {
                var shapes = Common.SharedSettings.get('shapes').slice();
                shapes.splice(0, 1); // Remove line shapes

                this.layout = $('<div/>').append(this.template({
                    android : Common.SharedSettings.get('android'),
                    phone   : Common.SharedSettings.get('phone'),
                    shapes  : shapes,
                    scope   : this
                }));

                return this;
            },

            rootLayout: function () {
                if (this.layout) {
                    return this.layout
                        .find('#edit-shape-root')
                        .html();
                }

                return '';
            },

            initControls: function () {
                //
            },

            showPage: function (templateId, suspendEvent) {
                var rootView = PE.getController('EditContainer').rootView;

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

            showStyleCategory: function (e) {
                // remove android specific style
                $('.page[data-page=edit-shape-style] .list-block.inputs-list').removeClass('inputs-list');
            },

            showStyle: function () {
                var me = this;
                var selector = this.isShapeCanFill ? '#edit-shape-style' : '#edit-shape-style-nofill';
                this.showPage(selector, true);

                if (!this.isShapeCanFill)
                    this.showStyleCategory();

                this.paletteFillColor = new Common.UI.ThemeColorPalette({
                    el: $('#tab-shape-fill'),
                    transparent: true
                });
                this.paletteFillColor.on('customcolor', function () {
                    me.showCustomFillColor();
                });
                var template = _.template(['<div class="list-block">',
                    '<ul>',
                    '<li>',
                    '<a id="edit-shape-add-custom-color" class="item-link">',
                    '<div class="item-content">',
                    '<div class="item-inner">',
                    '<div class="item-title"><%= scope.textAddCustomColor %></div>',
                    '</div>',
                    '</div>',
                    '</a>',
                    '</li>',
                    '</ul>',
                    '</div>'].join(''));
                $('#tab-shape-fill').append(template({scope: this}));
                $('#edit-shape-add-custom-color').single('click', _.bind(this.showCustomFillColor, this));

                Common.Utils.addScrollIfNeed('.page[data-page=edit-shape-style]', '.page[data-page=edit-shape-style] .page-content');
                this.fireEvent('page:show', [this, selector]);
            },

            showCustomFillColor: function () {
                var me = this,
                    selector = '#edit-shape-custom-color-view';
                me.showPage(selector, true);

                me.customColorPicker = new Common.UI.HsbColorPicker({
                    el: $('.page[data-page=edit-shape-custom-color] .page-content'),
                    color: me.paletteFillColor.currentColor
                });
                me.customColorPicker.on('addcustomcolor', function (colorPicker, color) {
                    me.paletteFillColor.addNewDynamicColor(colorPicker, color);
                    PE.getController('EditContainer').rootView.router.back();
                });

                me.fireEvent('page:show', [me, selector]);
            },

            showReplace: function () {
                this.showPage('#edit-shape-replace');
                Common.Utils.addScrollIfNeed('.page.shape-replace', '.page.shape-replace .page-content');
            },

            showReorder: function () {
                this.showPage('#edit-shape-reorder');
                Common.Utils.addScrollIfNeed('.page.shape-reorder', '.page.shape-reorder .page-content');
            },

            showAlign: function () {
                this.showPage('#edit-shape-align');
                Common.Utils.addScrollIfNeed('.page.shape-align', '.page.shape-align .page-content');
            },

            showBorderColor: function () {
                var me = this;
                var selector = '#edit-shape-border-color-view';
                this.showPage(selector, true);

                this.paletteBorderColor = new Common.UI.ThemeColorPalette({
                    el: $('.page[data-page=edit-shape-border-color] .page-content')
                });
                this.paletteBorderColor.on('customcolor', function () {
                    me.showCustomBorderColor();
                });
                var template = _.template(['<div class="list-block">',
                    '<ul>',
                    '<li>',
                    '<a id="edit-shape-add-custom-border-color" class="item-link">',
                    '<div class="item-content">',
                    '<div class="item-inner">',
                    '<div class="item-title"><%= scope.textAddCustomColor %></div>',
                    '</div>',
                    '</div>',
                    '</a>',
                    '</li>',
                    '</ul>',
                    '</div>'].join(''));
                $('.page[data-page=edit-shape-border-color] .page-content').append(template({scope: this}));
                $('#edit-shape-add-custom-border-color').single('click', _.bind(this.showCustomBorderColor, this));

                this.fireEvent('page:show', [this, selector]);
            },

            showCustomBorderColor: function () {
                var me = this,
                    selector = '#edit-shape-custom-color-view';
                me.showPage(selector, true);

                me.customBorderColorPicker = new Common.UI.HsbColorPicker({
                    el: $('.page[data-page=edit-shape-custom-color] .page-content'),
                    color: me.paletteBorderColor.currentColor
                });
                me.customBorderColorPicker.on('addcustomcolor', function (colorPicker, color) {
                    me.paletteBorderColor.addNewDynamicColor(colorPicker, color);
                    me.paletteFillColor.updateDynamicColors();
                    me.paletteFillColor.select(me.paletteFillColor.currentColor);
                    PE.getController('EditContainer').rootView.router.back();
                });

                me.fireEvent('page:show', [me, selector]);
            },

            textStyle: 'Style',
            textReplace: 'Replace',
            textReorder: 'Reorder',
            textRemoveShape: 'Remove Shape',
            textBack: 'Back',
            textToForeground: 'Bring to Foreground',
            textToBackground: 'Send to Background',
            textForward: 'Move Forward',
            textBackward: 'Move Backward',
            textFill: 'Fill',
            textBorder: 'Border',
            textEffects: 'Effects',
            textSize: 'Size',
            textColor: 'Color',
            textOpacity: 'Opacity',
            textAlign: 'Align',
            textAlignLeft:     'Align Left',
            textAlignRight:    'Align Right',
            textAlignCenter:   'Align Center',
            textAlignTop:      'Align Top',
            textAlignBottom:   'Align Bottom',
            textAlignMiddle:   'Align Middle',
            txtDistribHor:     'Distribute Horizontally',
            txtDistribVert:    'Distribute Vertically',
            textAddCustomColor: 'Add Custom Color',
            textCustomColor: 'Custom Color'
        }
    })(), PE.Views.EditShape || {}))
});