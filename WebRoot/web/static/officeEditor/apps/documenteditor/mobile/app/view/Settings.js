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
 *  Settings.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/7/16
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/mobile/app/template/Settings.template',
    'jquery',
    'underscore',
    'backbone'
], function (settingsTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.Settings = Backbone.View.extend(_.extend((function() {
        // private
        var _isEdit = false,
            _canEdit = false,
            _canDownload = false,
            _canDownloadOrigin = false,
            _canReader = false,
            _canAbout = true,
            _canHelp = true,
            _canPrint = false,
            _canReview = false,
            _isReviewOnly = false;

        return {
            // el: '.view-main',

            template: _.template(settingsTemplate),

            events: {
                //
            },

            initialize: function() {
                Common.NotificationCenter.on('settingscontainer:show', _.bind(this.initEvents, this));
                Common.Gateway.on('opendocument', _.bind(this.loadDocument, this));
                this.on('page:show', _.bind(this.updateItemHandlers, this));
            },

            initEvents: function () {
                var me = this;

                Common.Utils.addScrollIfNeed('.view[data-page=settings-root-view] .pages', '.view[data-page=settings-root-view] .page');
                me.updateItemHandlers();
                me.initControls();
            },

            // Render layout
            render: function() {
                this.layout = $('<div/>').append(this.template({
                    android : Common.SharedSettings.get('android'),
                    phone   : Common.SharedSettings.get('phone'),
                    orthography: Common.SharedSettings.get('sailfish'),
                    scope   : this,
                    width   : $(window).width(),
                    prodversion: '{{PRODUCT_VERSION}}',
                    publishername: '{{PUBLISHER_NAME}}',
                    publisheraddr: '{{PUBLISHER_ADDRESS}}',
                    publisherurl: '{{PUBLISHER_URL}}',
                    printed_url: ("{{PUBLISHER_URL}}").replace(/https?:\/{2}/, "").replace(/\/$/,""),
                    supportemail: '{{SUPPORT_EMAIL}}',
                    phonenum: '{{PUBLISHER_PHONE}}'
                }));

                return this;
            },

            setMode: function (mode) {
                _isEdit = mode.isEdit;
                _canEdit = !mode.isEdit && mode.canEdit && mode.canRequestEditRights;
                _canDownload = mode.canDownload;
                _canDownloadOrigin = mode.canDownloadOrigin;
                _canReader = !mode.isEdit && mode.canReader;
                _canPrint = mode.canPrint;
                _canReview = mode.canReview;
                _isReviewOnly = mode.isReviewOnly;

                if (mode.customization && mode.canBrandingExt) {
                    _canAbout = (mode.customization.about!==false);
                }

                if (mode.customization) {
                    _canHelp = (mode.customization.help!==false);
                }
            },

            rootLayout: function () {
                if (this.layout) {
                    var $layour = this.layout.find('#settings-root-view'),
                        isPhone = Common.SharedSettings.get('phone');

                    if (_isEdit) {
                        $layour.find('#settings-search .item-title').text(this.textFindAndReplace)
                    } else {
                        $layour.find('#settings-document').hide();
                        $layour.find('#color-schemes').hide();
                        $layour.find('#settings-spellcheck').hide();
                        $layour.find('#settings-orthography').hide();
                    }
                    if (!_canReader)
                        $layour.find('#settings-readermode').hide();
                    else {
                        $layour.find('#settings-readermode input:checkbox')
                            .prop('checked', Common.SharedSettings.get('readerMode'));
                    }
                    if (!_canDownload) $layour.find('#settings-download-as').hide();
                    if (!_canDownloadOrigin) $layour.find('#settings-download').hide();
                    if (!_canAbout) $layour.find('#settings-about').hide();
                    if (!_canHelp) $layour.find('#settings-help').hide();
                    if (!_canPrint) $layour.find('#settings-print').hide();
                    if (!_canReview) $layour.find('#settings-review').hide();
                    if (_isReviewOnly) $layour.find('#settings-review').addClass('disabled');

                    return $layour.html();
                }

                return '';
            },

            initControls: function() {
                //
            },

            updateItemHandlers: function () {
                var selectorsDynamicPage = [
                    '.page[data-page=settings-root-view]',
                    '.page[data-page=settings-document-view]',
                    '.page[data-page=settings-advanced-view]'
                ].map(function (selector) {
                    return selector + ' a.item-link[data-page]';
                }).join(', ');

                $(selectorsDynamicPage).single('click', _.bind(this.onItemClick, this));
            },

            showPage: function(templateId, suspendEvent) {
                var rootView = DE.getController('Settings').rootView();

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

            onItemClick: function (e) {
                var $target = $(e.currentTarget),
                    page = $target.data('page');

                if (page && page.length > 0 ) {
                    this.showPage(page);
                }
            },

            renderPageSizes: function(sizes, selectIndex) {
                var $pageFormats = $('.page[data-page=settings-document-formats-view]'),
                    $list = $pageFormats.find('ul'),
                    items = [];

                _.each(sizes, function (size, index) {
                    items.push(_.template([
                        '<li>',
                            '<label class="label-radio item-content">',
                                '<input type="radio" name="document-format" value="<%= item.value %>" <% if (index == selectIndex) { %>checked="checked"<% } %> >',
                                '<% if (android) { %><div class="item-media"><i class="icon icon-form-radio"></i></div><% } %>',
                                '<div class="item-inner">',
                                    '<div class="item-title-row">',
                                        '<div class="item-title"><%= item.caption %></div>',
                                    '</div>',
                                    '<div class="item-subtitle"><%= parseFloat(Common.Utils.Metric.fnRecalcFromMM(item.value[0]).toFixed(2)) %> <%= Common.Utils.Metric.getCurrentMetricName() %> x <%= parseFloat(Common.Utils.Metric.fnRecalcFromMM(item.value[1]).toFixed(2)) %> <%= Common.Utils.Metric.getCurrentMetricName() %></div>',
                                '</div>',
                            '</label>',
                        '</li>'
                    ].join(''))({
                        android: Framework7.prototype.device.android,
                        item: size,
                        index: index,
                        selectIndex: selectIndex
                    }));
                });

                $list.html(items.join(''));
            },

            loadDocument: function(data) {
                var permissions = {};

                if (data.doc) {
                    permissions = _.extend(permissions, data.doc.permissions);

                    if (permissions.edit === false) {
                    }
                }
            },

            renderSchemaSettings: function(currentSchema, arrSchemas) {
                if (arrSchemas) {
                    var templateInsert = "";
                    _.each(arrSchemas, function (schema, index) {
                        var colors = schema.get_colors(),//schema.colors;
                            name = schema.get_name();
                        templateInsert += '<li class="color-schemes-menu"><label class="label-radio item-content"><input type="radio" name="color-schema" value="' + index + '"';
                        if (index === currentSchema) {
                            templateInsert += ' checked="checked"'
                        }
                        templateInsert += '>';
                        if (Framework7.prototype.device.android) {
                            templateInsert += '<div class="item-media"><i class="icon icon-form-radio"></i></div>';
                        }
                        templateInsert += '<div class="item-inner"><span class="color-schema-block">';
                        for (var j = 2; j < 7; j++) {
                            var clr = '#' + Common.Utils.ThemeColor.getHexColor(colors[j].get_r(), colors[j].get_g(), colors[j].get_b());
                            templateInsert = templateInsert + "<span class='color' style='background: " + clr + ";'></span>"
                        }
                        templateInsert += '</span><span class="text">' + name + '</span></div></label></li>';
                    }, this);
                    $('#color-schemes-content ul').html(templateInsert);
                }
            },

            textFindAndReplace: 'Find and Replace',
            textSettings: 'Settings',
            textDone: 'Done',
            textFind: 'Find',
            textEditDoc: 'Edit Document',
            textReader: 'Reader Mode',
            textDownload: 'Download',
            textDocInfo: 'Document Info',
            textHelp: 'Help',
            textAbout: 'About',
            textBack: 'Back',
            textDocTitle: 'Document title',
            textLoading: 'Loading...',
            textAuthor: 'Author',
            textCreateDate: 'Create date',
            textStatistic: 'Statistic',
            textPages: 'Pages',
            textParagraphs: 'Paragraphs',
            textWords: 'Words',
            textSymbols: 'Symbols',
            textSpaces: 'Spaces',
            textDownloadAs: 'Download As...',
            textVersion: 'Version',
            textAddress: 'address',
            textEmail: 'email',
            textTel: 'tel',
            textDocumentSettings: 'Document Settings',
            textPortrait: 'Portrait',
            textLandscape: 'Landscape',
            textFormat: 'Format',
            textCustom: 'Custom',
            textCustomSize: 'Custom Size',
            textDocumentFormats: 'Document Formats',
            textOrientation: 'Orientation',
            textPoweredBy: 'Powered by',
            textSpellcheck: 'Spell Checking',
            textPrint: 'Print',
            textReview: 'Review',
            textMargins: 'Margins',
            textTop: 'Top',
            textLeft: 'Left',
            textBottom: 'Bottom',
            textRight: 'Right',
            textAdvancedSettings: 'Application Settings',
            textUnitOfMeasurement: 'Unit of Measurement',
            textCentimeter: 'Centimeter',
            textPoint: 'Point',
            textInch: 'Inch',
            textColorSchemes: 'Color Schemes',
            textNoCharacters: 'Nonprinting Characters',
            textHiddenTableBorders: 'Hidden Table Borders',
            textCollaboration: 'Collaboration',
            textCommentingDisplay: 'Commenting Display',
            textDisplayComments: 'Comments',
            textDisplayResolvedComments: 'Resolved Comments',
            textSubject: 'Subject',
            textTitle: 'Title',
            textComment: 'Comment',
            textOwner: 'Owner',
            textApplication : 'Application',
            textLocation: 'Location',
            textUploaded: 'Uploaded',
            textLastModified: 'Last Modified',
            textLastModifiedBy: 'Last Modified By',
            textCreated: 'Created'


    }
    })(), DE.Views.Settings || {}))
});