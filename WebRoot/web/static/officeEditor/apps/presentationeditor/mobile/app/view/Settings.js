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
 *  Presentation Editor
 *
 *  Created by Alexander Yuzhin on 11/22/16
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!presentationeditor/mobile/app/template/Settings.template',
    'jquery',
    'underscore',
    'backbone'
], function (settingsTemplate, $, _, Backbone) {
    'use strict';

    PE.Views.Settings = Backbone.View.extend(_.extend((function() {
        // private
        var isEdit,
            canEdit = false,
            canDownload = false,
            canAbout = true,
            canHelp = true,
            canPrint = false;

        return {
            // el: '.view-main',

            template: _.template(settingsTemplate),

            events: {
                //
            },

            initialize: function () {
                Common.NotificationCenter.on('settingscontainer:show', _.bind(this.initEvents, this));
                Common.Gateway.on('opendocument', _.bind(this.loadDocument, this));
            },

            initEvents: function () {
                var me = this;

                $('#settings-document-info').single('click', _.bind(me.showInfo, me));
                $('#settings-download').single('click', _.bind(me.showDownload, me));
                $('#settings-history').single('click', _.bind(me.showHistory, me));
                $('#settings-help').single('click', _.bind(me.showHelp, me));
                $('#settings-about').single('click', _.bind(me.showAbout, me));
                $('#settings-presentation-setup').single('click', _.bind(me.showSetup, me));
                $('#settings-application').single('click', _.bind(me.showSetApp, me));

                Common.Utils.addScrollIfNeed('.view[data-page=settings-root-view] .pages', '.view[data-page=settings-root-view] .page');
                me.initControls();
            },

            // Render layout
            render: function () {
                this.layout = $('<div/>').append(this.template({
                    android: Common.SharedSettings.get('android'),
                    phone: Common.SharedSettings.get('phone'),
                    scope: this,
                    width: $(window).width(),
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
                isEdit = mode.isEdit;
                canEdit = !mode.isEdit && mode.canEdit && mode.canRequestEditRights;
                canDownload = mode.canDownload || mode.canDownloadOrigin;
                canPrint = mode.canPrint;

                if (mode.customization && mode.canBrandingExt) {
                    canAbout = (mode.customization.about!==false);
                }

                if (mode.customization) {
                    canHelp = (mode.customization.help!==false);
                }
            },

            rootLayout: function () {
                if (this.layout) {
                    var $layour = this.layout.find('#settings-root-view'),
                        isPhone = Common.SharedSettings.get('phone');

                    if (isEdit) {
                        $layour.find('#settings-readermode').hide();
                        $layour.find('#settings-search .item-title').text(this.textFindAndReplace)
                    } else {
                        $layour.find('#settings-application').hide();
                        $layour.find('#settings-spellcheck').hide();
                        $layour.find('#settings-presentation-setup').hide();
                        $layour.find('#settings-readermode input:checkbox')
                            .attr('checked', Common.SharedSettings.get('readerMode'))
                            .prop('checked', Common.SharedSettings.get('readerMode'));
                    }
                    if (!canDownload) $layour.find('#settings-download').hide();
                    if (!canAbout) $layour.find('#settings-about').hide();
                    if (!canHelp) $layour.find('#settings-help').hide();
                    if (!canPrint) $layour.find('#settings-print').hide();

                    return $layour.html();
                }

                return '';
            },

            initControls: function () {
                //
            },

            showPage: function (templateId) {
                var rootView = PE.getController('Settings').rootView();

                if (rootView && this.layout) {
                    var $content = this.layout.find(templateId);

                    // Android fix for navigation
                    if (Framework7.prototype.device.android) {
                        $content.find('.page').append($content.find('.navbar'));
                    }

                    rootView.router.load({
                        content: $content.html()
                    });

                    this.fireEvent('page:show',  [this, templateId]);
                }
            },

            showColorSchemes: function () {
                this.showPage('#color-schemes-view');
            },

            showInfo: function () {
                this.showPage('#settings-info-view');
            },

            showDownload: function () {
                this.showPage('#settings-download-view');
            },

            showHistory: function () {
                this.showPage('#settings-history-view');
            },

            showHelp: function () {
                var url = '{{HELP_URL}}';
                if (url.charAt(url.length-1) !== '/') {
                    url += '/';
                }
                if (Common.SharedSettings.get('sailfish')) {
                    url+='mobile-applications/documents/mobile-web-editors/android/index.aspx';
                } else if (Common.SharedSettings.get('android')) {
                    url+='mobile-applications/documents/mobile-web-editors/android/index.aspx';
                } else {
                    url+='mobile-applications/documents/mobile-web-editors/ios/index.aspx';
                }
                window.open(url, "_blank");
                PE.getController('Settings').hideModal();
            },

            showAbout: function () {
                this.showPage('#settings-about-view');
            },

            showSetup: function () {
                this.showPage('#settings-setup-view');
                $('#color-schemes').single('click', _.bind(this.showColorSchemes, this));
            },

            showSetApp: function () {
                this.showPage('#settings-application-view');
            },

            loadDocument: function (data) {
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

            unknownText: 'Unknown',
            textSettings: 'Settings',
            textFind: 'Find',
            textDone: 'Done',
            textEditPresent: 'Edit Presentation',
            textPresentSetup: 'Presentation Setup',
            textPresentSettings: 'Presentation Settings',
            textDownload: 'Download',
            textPresentInfo: 'Presentation Info',
            textHelp: 'Help',
            textAbout: 'About',
            textBack: 'Back',
            textPresentTitle: 'Presentation Title',
            textLoading: 'Loading...',
            textAuthor: 'Author',
            textCreateDate: 'Create date',
            textDownloadAs: 'Download As...',
            textVersion: 'Version',
            textAddress: 'address',
            textEmail: 'email',
            textTel: 'tel',
            textSlideSize: 'Slide Size',
            mniSlideStandard: 'Standard (4:3)',
            mniSlideWide: 'Widescreen (16:9)',
            textPoweredBy: 'Powered by',
            textFindAndReplace: 'Find and Replace',
            textSpellcheck: 'Spell Checking',
            textPrint: 'Print',
            textApplicationSettings: 'Application Settings',
            textUnitOfMeasurement: 'Unit of Measurement',
            textCentimeter: 'Centimeter',
            textPoint: 'Point',
            textInch: 'Inch',
            textColorSchemes: 'Color Schemes',
            textCollaboration: 'Collaboration',
            textSubject: 'Subject',
            textTitle: 'Title',
            textComment: 'Comment',
            textOwner: 'Owner',
            textApplication : 'Application',
            textCreated: 'Created',
            textLastModified: 'Last Modified',
            textLastModifiedBy: 'Last Modified By',
            textUploaded: 'Uploaded',
            textLocation: 'Location'
        }
    })(), PE.Views.Settings || {}))
});