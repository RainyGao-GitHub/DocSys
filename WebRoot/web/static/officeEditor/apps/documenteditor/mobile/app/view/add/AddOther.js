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
 *  AddOther.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/17/16
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/mobile/app/template/AddOther.template',
    'jquery',
    'underscore',
    'backbone'
], function (addTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.AddOther = Backbone.View.extend(_.extend((function() {
        // private

        return {
            // el: '.view-main',

            template: _.template(addTemplate),

            events: {
            },

            initialize: function () {
                Common.NotificationCenter.on('addcontainer:show', _.bind(this.initEvents, this));
            },

            initEvents: function () {
                var me = this;

                $('#add-other-section').single('click',     _.bind(me.showSectionBreak, me));
                $('#add-other-link').single('click',        _.bind(me.showLink, me));
                $('#add-other-pagenumber').single('click',  _.bind(me.showPagePosition, me));
                $('#add-other-footnote').single('click',    _.bind(me.showPageFootnote, me));

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
                        .find('#addother-root-view')
                        .html();
                }

                return '';
            },

            initControls: function () {
                //
            },

            showPage: function (templateId, animate) {
                var rootView = DE.getController('AddContainer').rootView;

                if (rootView && this.layout) {
                    var $content = this.layout.find(templateId);

                    // Android fix for navigation
                    if (Framework7.prototype.device.android) {
                        $content.find('.page').append($content.find('.navbar'));
                    }

                    rootView.router.load({
                        content: $content.html(),
                        animatePages: animate !== false
                    });

                    this.fireEvent('page:show', [this, templateId]);
                }
            },

            showSectionBreak: function () {
                this.showPage('#addother-sectionbreak');
            },

            showLink: function (animate) {
                this.showPage('#addother-link', animate);

                $('.page[data-page=addother-link] input[type=url]').single('input', _.bind(function(e) {
                    $('#add-link-insert').toggleClass('disabled', _.isEmpty($('#add-link-url input').val()));
                }, this));

                _.delay(function () {
                    $('.page[data-page=addother-link] input[type=url]').focus();
                }, 1000);
            },

            showPagePosition: function () {
                this.showPage('#addother-pagenumber');
            },

            showPageFootnote: function () {
                this.showPage('#addother-insert-footnote');
            },

            renderNumFormat: function (dataFormat, selectFormat) {
                var $listFormat = $('#list-format-footnote ul'),
                    items = [];

                _.each(dataFormat, function (formatItem) {
                    var itemTemplate = [
                        '<li>',
                        '<label class="label-radio item-content">',
                        '<input type="radio" name="doc-footnote-format" data-value="<%= item.value %>" <% if (item.value == select) { %>checked="checked"<% } %> >',
                        '<% if (android) { %><div class="item-media"><i class="icon icon-form-radio"></i></div><% } %>',
                        '<div class="item-inner">',
                        '<div class="item-title"><%= item.text %></div>',
                        '</div>',
                        '</label>',
                        '</li>'
                    ].join('');
                    items.push(_.template(itemTemplate)({
                        android: Framework7.prototype.device.android,
                        item: formatItem,
                        select: selectFormat
                    }));
                });

                $listFormat.html(items);
            },

            renderFootnotePos: function (dataPosition, selectPosition) {
                var $listPos = $('#position-footnote ul'),
                    items = [];

                _.each(dataPosition, function (posItem) {
                    var itemTemplate = [
                        '<li>',
                        '<label class="label-radio item-content">',
                        '<input type="radio" name="doc-footnote-pos" data-value="<%= item.value%>" <% if (item.value == select) { %>checked="checked"<% } %> >',
                        '<% if (android) { %><div class="item-media"><i class="icon icon-form-radio"></i></div><% } %>',
                        '<div class="item-inner">',
                        '<div class="item-title"><%= item.displayValue %></div>',
                        '</div>',
                        '</label>',
                        '</li>'
                    ].join('');
                    items.push(_.template(itemTemplate)({
                        android: Framework7.prototype.device.android,
                        item: posItem,
                        select: selectPosition
                    }));
                });

                $listPos.html(items);
            },

            textPageBreak: 'Page Break',
            textSectionBreak: 'Section Break',
            textColumnBreak: 'Column Break',
            textLink: 'Link',
            textPageNumber: 'Page Number',
            textBack: 'Back',
            textAddLink: 'Add Link',
            textDisplay: 'Display',
            textTip: 'Screen Tip',
            textInsert: 'Insert',
            textPosition: 'Position',
            textLeftTop: 'Left Top',
            textCenterTop: 'Center Top',
            textRightTop: 'Right Top',
            textLeftBottom: 'Left Bottom',
            textCenterBottom: 'Center Bottom',
            textRightBottom: 'Right Bottom',
            textCurrentPos: 'Current Position',
            textNextPage: 'Next Page',
            textContPage: 'Continuous Page',
            textEvenPage: 'Even Page',
            textOddPage: 'Odd Page',
            textFootnote: 'Footnote',
            textInsertFootnote: 'Insert Footnote',
            textFormat: 'Format',
            textStartFrom: 'Start At',
            textLocation: 'Location'
        
        
        }
    })(), DE.Views.AddOther || {}))
});