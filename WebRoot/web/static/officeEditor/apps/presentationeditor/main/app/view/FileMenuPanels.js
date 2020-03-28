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
 *    FileMenuPanels.js
 *
 *    Contains views for menu 'File'
 *
 *    Created by Maxim Kadushkin on 20 February 2014
 *    Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'common/main/lib/view/DocumentAccessDialog',
    'common/main/lib/component/CheckBox'
], function () {
    'use strict';

    !PE.Views.FileMenuPanels && (PE.Views.FileMenuPanels = {});

    PE.Views.FileMenuPanels.ViewSaveAs = Common.UI.BaseView.extend({
        el: '#panel-saveas',
        menu: undefined,

        formats: [[
            {name: 'PPTX',  imgCls: 'pptx',  type: Asc.c_oAscFileType.PPTX},
            {name: 'PDF',   imgCls: 'pdf',   type: Asc.c_oAscFileType.PDF},
            {name: 'ODP',   imgCls: 'odp',   type: Asc.c_oAscFileType.ODP}
        ],[
            {name: 'POTX',  imgCls: 'potx',   type: Asc.c_oAscFileType.POTX},
            {name: 'PDFA',  imgCls: 'pdfa',  type: Asc.c_oAscFileType.PDFA},
            {name: 'OTP',   imgCls: 'otp',   type: Asc.c_oAscFileType.OTP}
        ]],


        template: _.template([
            '<table><tbody>',
                '<% _.each(rows, function(row) { %>',
                    '<tr>',
                        '<% _.each(row, function(item) { %>',
                            '<td><div><svg class="btn-doc-format" format="<%= item.type %>">',
                                '<use xlink:href="#svg-format-<%= item.imgCls %>"></use>',
                            '</svg></div></td>',
                        '<% }) %>',
                    '</tr>',
                '<% }) %>',
            '</tbody></table>'
        ].join('')),

        initialize: function(options) {
            Common.UI.BaseView.prototype.initialize.call(this,arguments);

            this.menu = options.menu;
        },

        render: function() {
            this.$el.html(this.template({rows:this.formats}));
            $('.btn-doc-format',this.el).on('click', _.bind(this.onFormatClick,this));

            if (_.isUndefined(this.scroller)) {
                this.scroller = new Common.UI.Scroller({
                    el: this.$el,
                    suppressScrollX: true
                });
            }

            return this;
        },

        onFormatClick: function(e) {
            var type = e.currentTarget.attributes['format'];
            if (!_.isUndefined(type) && this.menu) {
                this.menu.fireEvent('saveas:format', [this.menu, parseInt(type.value)]);
            }
        }
    });

    PE.Views.FileMenuPanels.ViewSaveCopy = Common.UI.BaseView.extend({
        el: '#panel-savecopy',
        menu: undefined,

        formats: [[
            {name: 'PPTX',  imgCls: 'pptx',  type: Asc.c_oAscFileType.PPTX, ext: '.pptx'},
            {name: 'PDF',   imgCls: 'pdf',   type: Asc.c_oAscFileType.PDF,  ext: '.pdf'},
            {name: 'ODP',   imgCls: 'odp',   type: Asc.c_oAscFileType.ODP,  ext: '.odp'}
        ],[
            {name: 'POTX',  imgCls: 'potx',  type: Asc.c_oAscFileType.POTX, ext: '.potx'},
            {name: 'PDFA',  imgCls: 'pdfa',  type: Asc.c_oAscFileType.PDFA, ext: '.pdf'},
            {name: 'OTP',   imgCls: 'otp',   type: Asc.c_oAscFileType.OTP,  ext: '.otp'}
        ]],

        template: _.template([
            '<table><tbody>',
                '<% _.each(rows, function(row) { %>',
                    '<tr>',
                        '<% _.each(row, function(item) { %>',
                            '<td><div><svg class="btn-doc-format" format="<%= item.type %>", format-ext="<%= item.ext %>">',
                                '<use xlink:href="#svg-format-<%= item.imgCls %>"></use>',
                            '</svg></div></td>',
                        '<% }) %>',
                    '</tr>',
                '<% }) %>',
            '</tbody></table>'
        ].join('')),

        initialize: function(options) {
            Common.UI.BaseView.prototype.initialize.call(this,arguments);

            this.menu = options.menu;
        },

        render: function() {
            this.$el.html(this.template({rows:this.formats}));
            $('.btn-doc-format',this.el).on('click', _.bind(this.onFormatClick,this));

            if (_.isUndefined(this.scroller)) {
                this.scroller = new Common.UI.Scroller({
                    el: this.$el,
                    suppressScrollX: true
                });
            }

            return this;
        },

        onFormatClick: function(e) {
            var type = e.currentTarget.attributes['format'],
                ext = e.currentTarget.attributes['format-ext'];
            if (!_.isUndefined(type) && !_.isUndefined(ext) && this.menu) {
                this.menu.fireEvent('savecopy:format', [this.menu, parseInt(type.value), ext.value]);
            }
        }
    });

    PE.Views.FileMenuPanels.Settings = Common.UI.BaseView.extend(_.extend({
        el: '#panel-settings',
        menu: undefined,

        template: _.template([
            '<table><tbody>',
                '<tr class="edit">',
                    '<td class="left"><label><%= scope.txtSpellCheck %></label></td>',
                    '<td class="right"><div id="fms-chb-spell-check"/></td>',
                '</tr>','<tr class="divider edit"></tr>',
                '<tr class="edit">',
                    '<td class="left"><label><%= scope.txtInput %></label></td>',
                    '<td class="right"><div id="fms-chb-input-mode"/></td>',
                '</tr>','<tr class="divider edit"></tr>',
                '<tr class="edit">',
                    '<td class="left"><label><%= scope.textAlignGuides %></label></td>',
                    '<td class="right"><span id="fms-chb-align-guides" /></td>',
                '</tr>','<tr class="divider edit"></tr>',
                '<tr class="autosave">',
                    '<td class="left"><label id="fms-lbl-autosave"><%= scope.textAutoSave %></label></td>',
                    '<td class="right"><span id="fms-chb-autosave" /></td>',
                '</tr>','<tr class="divider autosave"></tr>',
                '<tr class="forcesave">',
                    '<td class="left"><label id="fms-lbl-forcesave"><%= scope.textForceSave %></label></td>',
                    '<td class="right"><span id="fms-chb-forcesave" /></td>',
                '</tr>','<tr class="divider forcesave"></tr>',
                /** coauthoring begin **/
                '<tr class="coauth changes">',
                    '<td class="left"><label><%= scope.strCoAuthMode %></label></td>',
                    '<td class="right">',
                        '<div><div id="fms-cmb-coauth-mode" style="display: inline-block; margin-right: 15px;vertical-align: middle;"/>',
                        '<label id="fms-lbl-coauth-mode" style="vertical-align: middle;"><%= scope.strCoAuthModeDescFast %></label></div></td>',
                '</tr>','<tr class="divider coauth changes"></tr>',
                /** coauthoring end **/
                '<tr>',
                    '<td class="left"><label><%= scope.strZoom %></label></td>',
                    '<td class="right"><div id="fms-cmb-zoom" class="input-group-nr" /></td>',
                '</tr>','<tr class="divider"></tr>',
                '<tr>',
                    '<td class="left"><label><%= scope.strFontRender %></label></td>',
                    '<td class="right"><span id="fms-cmb-font-render" /></td>',
                '</tr>','<tr class="divider"></tr>',
                '<tr class="edit">',
                    '<td class="left"><label><%= scope.strUnit %></label></td>',
                    '<td class="right"><span id="fms-cmb-unit" /></td>',
                '</tr>','<tr class="divider edit"></tr>',
                '<tr>',
                    '<td class="left"></td>',
                    '<td class="right"><button id="fms-btn-apply" class="btn normal dlg-btn primary"><%= scope.okButtonText %></button></td>',
                '</tr>',
            '</tbody></table>'
        ].join('')),

        initialize: function(options) {
            Common.UI.BaseView.prototype.initialize.call(this,arguments);

            this.menu = options.menu;
        },

        render: function(node) {
            var me = this;
            var $markup = $(this.template({scope: this}));

            this.chSpell = new Common.UI.CheckBox({
                el: $markup.findById('#fms-chb-spell-check'),
                labelText: this.strSpellCheckMode
            });

            this.chInputMode = new Common.UI.CheckBox({
                el: $markup.findById('#fms-chb-input-mode'),
                labelText: this.strInputMode
            });

            this.cmbZoom = new Common.UI.ComboBox({
                el          : $markup.findById('#fms-cmb-zoom'),
                style       : 'width: 160px;',
                editable    : false,
                cls         : 'input-group-nr',
                menuStyle   : 'max-height: 210px;',
                data        : [
                    { value: -1, displayValue: this.txtFitSlide },
                    { value: -2, displayValue: this.txtFitWidth },
                    { value: 50, displayValue: "50%" },
                    { value: 60, displayValue: "60%" },
                    { value: 70, displayValue: "70%" },
                    { value: 80, displayValue: "80%" },
                    { value: 90, displayValue: "90%" },
                    { value: 100, displayValue: "100%" },
                    { value: 110, displayValue: "110%" },
                    { value: 120, displayValue: "120%" },
                    { value: 150, displayValue: "150%" },
                    { value: 175, displayValue: "175%" },
                    { value: 200, displayValue: "200%" }
                ]
            });

            /** coauthoring begin **/
            this.cmbCoAuthMode = new Common.UI.ComboBox({
                el          : $markup.findById('#fms-cmb-coauth-mode'),
                style       : 'width: 160px;',
                editable    : false,
                cls         : 'input-group-nr',
                data        : [
                    { value: 1, displayValue: this.strFast, descValue: this.strCoAuthModeDescFast},
                    { value: 0, displayValue: this.strStrict, descValue: this.strCoAuthModeDescStrict }
                ]
            }).on('selected', function(combo, record) {
                if (record.value == 1 && (me.chAutosave.getValue()!=='checked'))
                    me.chAutosave.setValue(1);
                me.lblCoAuthMode.text(record.descValue);
            });

            this.lblCoAuthMode = $markup.findById('#fms-lbl-coauth-mode');
            /** coauthoring end **/

            this.chAutosave = new Common.UI.CheckBox({
                el: $markup.findById('#fms-chb-autosave'),
                labelText: this.strAutosave
            }).on('change', function(field, newValue, oldValue, eOpts){
                if (field.getValue()!=='checked' && me.cmbCoAuthMode.getValue()) {
                    me.cmbCoAuthMode.setValue(0);
                    me.lblCoAuthMode.text(me.strCoAuthModeDescStrict);
                }
            });
            this.lblAutosave = $markup.findById('#fms-lbl-autosave');

            this.chForcesave = new Common.UI.CheckBox({
                el: $markup.findById('#fms-chb-forcesave'),
                labelText: this.strForcesave
            });

            this.chAlignGuides = new Common.UI.CheckBox({
                el: $markup.findById('#fms-chb-align-guides'),
                labelText: this.strAlignGuides
            });

            var itemsTemplate =
                _.template([
                    '<% _.each(items, function(item) { %>',
                    '<li id="<%= item.id %>" data-value="<%= item.value %>" <% if (item.value === "custom") { %> style="border-top: 1px solid #e5e5e5;margin-top: 5px;" <% } %> ><a tabindex="-1" type="menuitem" <% if (typeof(item.checked) !== "undefined" && item.checked) { %> class="checked" <% } %> ><%= scope.getDisplayValue(item) %></a></li>',
                    '<% }); %>'
                ].join(''));
            this.cmbFontRender = new Common.UI.ComboBox({
                el          : $markup.findById('#fms-cmb-font-render'),
                style       : 'width: 160px;',
                editable    : false,
                cls         : 'input-group-nr',
                itemsTemplate: itemsTemplate,
                data        : [
                    { value: Asc.c_oAscFontRenderingModeType.hintingAndSubpixeling, displayValue: this.txtWin },
                    { value: Asc.c_oAscFontRenderingModeType.noHinting, displayValue: this.txtMac },
                    { value: Asc.c_oAscFontRenderingModeType.hinting, displayValue: this.txtNative },
                    { value: 'custom', displayValue: this.txtCacheMode }
                ]
            });
            this.cmbFontRender.on('selected', _.bind(this.onFontRenderSelected, this));

            this.cmbUnit = new Common.UI.ComboBox({
                el          : $markup.findById('#fms-cmb-unit'),
                style       : 'width: 160px;',
                editable    : false,
                cls         : 'input-group-nr',
                data        : [
                    { value: Common.Utils.Metric.c_MetricUnits['cm'], displayValue: this.txtCm },
                    { value: Common.Utils.Metric.c_MetricUnits['pt'], displayValue: this.txtPt },
                    { value: Common.Utils.Metric.c_MetricUnits['inch'], displayValue: this.txtInch }
                ]
            });

            this.btnApply = new Common.UI.Button({
                el: $markup.findById('#fms-btn-apply')
            });

            this.btnApply.on('click', _.bind(this.applySettings, this));

            this.$el = $(node).html($markup);

            if (_.isUndefined(this.scroller)) {
                this.scroller = new Common.UI.Scroller({
                    el: this.$el,
                    suppressScrollX: true
                });
            }

            return this;
        },

        show: function() {
            Common.UI.BaseView.prototype.show.call(this,arguments);

            this.updateSettings();
        },

        setMode: function(mode) {
            this.mode = mode;
            $('tr.edit', this.el)[mode.isEdit?'show':'hide']();
            $('tr.autosave', this.el)[mode.isEdit ? 'show' : 'hide']();
            if (this.mode.isDesktopApp && this.mode.isOffline) {
                this.chAutosave.setCaption(this.strAutoRecover);
                this.lblAutosave.text(this.textAutoRecover);
            }
            $('tr.forcesave', this.el)[mode.canForcesave ? 'show' : 'hide']();
            /** coauthoring begin **/
            $('tr.coauth.changes', this.el)[mode.isEdit && !mode.isOffline && mode.canCoAuthoring ? 'show' : 'hide']();
            /** coauthoring end **/
        },

        updateSettings: function() {
            this.chSpell.setValue(Common.Utils.InternalSettings.get("pe-settings-spellcheck"));

            this.chInputMode.setValue(Common.Utils.InternalSettings.get("pe-settings-inputmode"));

            var value = Common.Utils.InternalSettings.get("pe-settings-zoom");
            value = (value!==null) ? parseInt(value) : (this.mode.customization && this.mode.customization.zoom ? parseInt(this.mode.customization.zoom) : -1);
            var item = this.cmbZoom.store.findWhere({value: value});
            this.cmbZoom.setValue(item ? parseInt(item.get('value')) : (value>0 ? value+'%' : 100));

            /** coauthoring begin **/
            var fast_coauth = Common.Utils.InternalSettings.get("pe-settings-coauthmode");
            item = this.cmbCoAuthMode.store.findWhere({value: fast_coauth ? 1 : 0});
            this.cmbCoAuthMode.setValue(item ? item.get('value') : 1);
            this.lblCoAuthMode.text(item ? item.get('descValue') : this.strCoAuthModeDescFast);
            /** coauthoring end **/

            value = Common.Utils.InternalSettings.get("pe-settings-fontrender");
            item = this.cmbFontRender.store.findWhere({value: parseInt(value)});
            this.cmbFontRender.setValue(item ? item.get('value') : Asc.c_oAscFontRenderingModeType.hintingAndSubpixeling);
            this._fontRender = this.cmbFontRender.getValue();

            value = Common.Utils.InternalSettings.get("pe-settings-cachemode");
            item = this.cmbFontRender.store.findWhere({value: 'custom'});
            item && value && item.set('checked', !!value);
            item && value && this.cmbFontRender.cmpEl.find('#' + item.get('id') + ' a').addClass('checked');

            value = Common.Utils.InternalSettings.get("pe-settings-unit");
            item = this.cmbUnit.store.findWhere({value: value});
            this.cmbUnit.setValue(item ? parseInt(item.get('value')) : Common.Utils.Metric.getDefaultMetric());
            this._oldUnits = this.cmbUnit.getValue();

            value = Common.Utils.InternalSettings.get("pe-settings-autosave");
            this.chAutosave.setValue(value == 1);

            if (this.mode.canForcesave) {
                this.chForcesave.setValue(Common.Utils.InternalSettings.get("pe-settings-forcesave"));
            }

            this.chAlignGuides.setValue(Common.Utils.InternalSettings.get("pe-settings-showsnaplines"));
        },

        applySettings: function() {
            Common.localStorage.setItem("pe-settings-spellcheck", this.chSpell.isChecked() ? 1 : 0);
            Common.localStorage.setItem("pe-settings-inputmode", this.chInputMode.isChecked() ? 1 : 0);
            Common.localStorage.setItem("pe-settings-zoom", this.cmbZoom.getValue());
            Common.Utils.InternalSettings.set("pe-settings-zoom", Common.localStorage.getItem("pe-settings-zoom"));
            /** coauthoring begin **/
            if (this.mode.isEdit && !this.mode.isOffline && this.mode.canCoAuthoring) {
                Common.localStorage.setItem("pe-settings-coauthmode", this.cmbCoAuthMode.getValue());
            }
            /** coauthoring end **/
            Common.localStorage.setItem("pe-settings-fontrender", this.cmbFontRender.getValue());
            var item = this.cmbFontRender.store.findWhere({value: 'custom'});
            Common.localStorage.setItem("pe-settings-cachemode", item && !item.get('checked') ? 0 : 1);
            Common.localStorage.setItem("pe-settings-unit", this.cmbUnit.getValue());
            Common.localStorage.setItem("pe-settings-autosave", this.chAutosave.isChecked() ? 1 : 0);
            if (this.mode.canForcesave)
                Common.localStorage.setItem("pe-settings-forcesave", this.chForcesave.isChecked() ? 1 : 0);
            Common.Utils.InternalSettings.set("pe-settings-showsnaplines", this.chAlignGuides.isChecked());

            Common.localStorage.save();

            if (this.menu) {
                this.menu.fireEvent('settings:apply', [this.menu]);

                if (this._oldUnits !== this.cmbUnit.getValue())
                    Common.NotificationCenter.trigger('settings:unitschanged', this);
            }
        },

        onFontRenderSelected: function(combo, record) {
            if (record.value == 'custom') {
                var item = combo.store.findWhere({value: 'custom'});
                item && item.set('checked', !record.checked);
                combo.cmpEl.find('#' + record.id + ' a').toggleClass('checked', !record.checked);
                combo.setValue(this._fontRender);
            }
            this._fontRender = combo.getValue();
        },

        strInputMode:   'Turn on hieroglyphs',
        strZoom: 'Default Zoom Value',
        okButtonText: 'Apply',
        txtFitSlide: 'Fit to Slide',
        txtInput: 'Alternate Input',
        txtWin: 'as Windows',
        txtMac: 'as OS X',
        txtNative: 'Native',
        strFontRender: 'Font Hinting',
        strUnit: 'Unit of Measurement',
        txtCm: 'Centimeter',
        txtPt: 'Point',
        textAutoSave: 'Autosave',
        strAutosave: 'Turn on autosave',
        /** coauthoring begin **/
        strShowChanges: 'Realtime Collaboration Changes',
        /** coauthoring end **/
        txtAll: 'View All',
        txtLast: 'View Last',
        textAlignGuides: 'Alignment Guides',
        strAlignGuides: 'Turn on alignment guides',
        strCoAuthMode: 'Co-editing mode',
        strCoAuthModeDescFast: 'Other users will see your changes at once',
        strCoAuthModeDescStrict: 'You will need to accept changes before you can see them',
        strFast: 'Fast',
        strStrict: 'Strict',
        textAutoRecover: 'Autorecover',
        strAutoRecover: 'Turn on autorecover',
        txtInch: 'Inch',
        txtFitWidth: 'Fit to Width',
        textForceSave: 'Save to Server',
        strForcesave: 'Always save to server (otherwise save to server on document close)',
        txtSpellCheck: 'Spell Checking',
        strSpellCheckMode: 'Turn on spell checking option',
        txtCacheMode: 'Default cache mode'
    }, PE.Views.FileMenuPanels.Settings || {}));

    PE.Views.FileMenuPanels.RecentFiles = Common.UI.BaseView.extend({
        el: '#panel-recentfiles',
        menu: undefined,

        template: _.template([
            '<div id="id-recent-view" style="margin: 20px 0;"></div>'
        ].join('')),

        initialize: function(options) {
            Common.UI.BaseView.prototype.initialize.call(this,arguments);

            this.menu = options.menu;
            this.recent = options.recent;
        },

        render: function() {
            this.$el.html(this.template());

            this.viewRecentPicker = new Common.UI.DataView({
                el: $('#id-recent-view'),
                store: new Common.UI.DataViewStore(this.recent),
                itemTemplate: _.template([
                    '<div class="recent-wrap">',
                        '<div class="recent-icon"></div>',
                        '<div class="file-name"><%= Common.Utils.String.htmlEncode(title) %></div>',
                        '<div class="file-info"><%= Common.Utils.String.htmlEncode(folder) %></div>',
                    '</div>'
                ].join(''))
            });

            this.viewRecentPicker.on('item:click', _.bind(this.onRecentFileClick, this));

            if (_.isUndefined(this.scroller)) {
                this.scroller = new Common.UI.Scroller({
                    el: this.$el,
                    suppressScrollX: true
                });
            }

            return this;
        },

        onRecentFileClick: function(view, itemview, record){
            if ( this.menu )
                this.menu.fireEvent('recent:open', [this.menu, record.get('url')]);
        }
    });

    PE.Views.FileMenuPanels.CreateNew = Common.UI.BaseView.extend(_.extend({
        el: '#panel-createnew',
        menu: undefined,

        events: function() {
            return {
                'click .blank-document-btn':_.bind(this._onBlankDocument, this),
                'click .thumb-list .thumb-wrap': _.bind(this._onDocumentTemplate, this)
            };
        },

        template: _.template([
            '<h3 style="margin-top: 20px;"><%= scope.fromBlankText %></h3><hr noshade />',
            '<div class="blank-document">',
                '<div class="blank-document-btn">',
                    '<svg class="btn-doc-format">',
                        '<use xlink:href="#svg-format-pptx"></use>',
                    '</svg>',
                '</div>',
                '<div class="blank-document-info">',
                    '<h3><%= scope.newDocumentText %></h3>',
                    '<%= scope.newDescriptionText %>',
                '</div>',
            '</div>',
            '<h3><%= scope.fromTemplateText %></h3><hr noshade />',
            '<div class="thumb-list">',
                '<% _.each(docs, function(item) { %>',
                    '<div class="thumb-wrap" template="<%= item.url %>">',
                        '<div class="thumb"',
                            '<% if (!_.isEmpty(item.icon)) { ' +
                                'print(\" style=\'background-image: url(item.icon);\'>\")' +
                            ' } else { ' +
                                'print(\"><svg class=\'btn-doc-format\'><use xlink:href=\'#svg-format-blank\'></use></svg>\")' +
                            ' } %>',
                        '</div>',
                        '<div class="title"><%= item.name %></div>',
                    '</div>',
                '<% }) %>',
            '</div>'
        ].join('')),

        initialize: function(options) {
            Common.UI.BaseView.prototype.initialize.call(this,arguments);

            this.menu = options.menu;
        },

        render: function() {
            this.$el.html(this.template({
                scope: this,
                docs: this.options[0].docs
            }));

            if (_.isUndefined(this.scroller)) {
                this.scroller = new Common.UI.Scroller({
                    el: this.$el,
                    suppressScrollX: true
                });
            }

            return this;
        },

        _onBlankDocument: function() {
            if ( this.menu )
                this.menu.fireEvent('create:new', [this.menu, 'blank']);
        },

        _onDocumentTemplate: function(e) {
            if ( this.menu )
                this.menu.fireEvent('create:new', [this.menu, e.currentTarget.attributes['template'].value]);
        },

        fromBlankText       : 'From Blank',
        newDocumentText     : 'New Presentation',
        newDescriptionText  : 'Create a new blank presentation which you will be able to style and format after it is created during the editing. Or choose one of the templates to start a document of a certain type or purpose where some styles have already been pre-applied.',
        fromTemplateText    : 'From Template',
        noTemplatesText     : 'There are no templates'
    }, PE.Views.FileMenuPanels.CreateNew || {}));

    PE.Views.FileMenuPanels.DocumentInfo = Common.UI.BaseView.extend(_.extend({
        el: '#panel-info',
        menu: undefined,

        initialize: function(options) {
            Common.UI.BaseView.prototype.initialize.call(this,arguments);
            this.rendered = false;

            this.template = _.template([
                '<table class="main">',
                    '<tr>',
                        '<td class="left"><label>' + this.txtPlacement + '</label></td>',
                        '<td class="right"><label id="id-info-placement">-</label></td>',
                    '</tr>',
                    '<tr>',
                        '<td class="left"><label>' + this.txtOwner + '</label></td>',
                        '<td class="right"><label id="id-info-owner">-</label></td>',
                    '</tr>',
                    '<tr>',
                        '<td class="left"><label>' + this.txtUploaded + '</label></td>',
                        '<td class="right"><label id="id-info-uploaded">-</label></td>',
                    '</tr>',
                    '<tr class="divider general"></tr>',
                    '<tr class="divider general"></tr>',
                    // '<tr>',
                    //     '<td class="left"><label>' + this.txtEditTime + '</label></td>',
                    //     '<td class="right"><label id="id-info-edittime"></label></td>',
                    // '</tr>',
                    '<tr>',
                        '<td class="left"><label>' + this.txtTitle + '</label></td>',
                        '<td class="right"><div id="id-info-title"></div></td>',
                    '</tr>',
                    '<tr>',
                        '<td class="left"><label>' + this.txtSubject + '</label></td>',
                        '<td class="right"><div id="id-info-subject"></div></td>',
                    '</tr>',
                    '<tr>',
                        '<td class="left"><label>' + this.txtComment + '</label></td>',
                        '<td class="right"><div id="id-info-comment"></div></td>',
                    '</tr>',
                    '<tr class="divider"></tr>',
                    '<tr class="divider"></tr>',
                    '<tr>',
                        '<td class="left"><label>' + this.txtModifyDate + '</label></td>',
                        '<td class="right"><label id="id-info-modify-date"></label></td>',
                    '</tr>',
                    '<tr>',
                        '<td class="left"><label>' + this.txtModifyBy + '</label></td>',
                        '<td class="right"><label id="id-info-modify-by"></label></td>',
                    '</tr>',
                    '<tr class="divider modify">',
                    '<tr class="divider modify">',
                    '<tr>',
                        '<td class="left"><label>' + this.txtCreated + '</label></td>',
                        '<td class="right"><label id="id-info-date"></label></td>',
                    '</tr>',
                    '<tr>',
                        '<td class="left"><label>' + this.txtAppName + '</label></td>',
                        '<td class="right"><label id="id-info-appname"></label></td>',
                    '</tr>',
                    '<tr>',
                        '<td class="left" style="vertical-align: top;"><label style="margin-top: 3px;">' + this.txtAuthor + '</label></td>',
                        '<td class="right" style="vertical-align: top;"><div id="id-info-author">',
                            '<table>',
                                '<tr>',
                                    '<td><div id="id-info-add-author"><input type="text" spellcheck="false" class="form-control" placeholder="' +  this.txtAddAuthor +'"></div></td>',
                                '</tr>',
                            '</table>',
                        '</div></td>',
                    '</tr>',
                    '<tr class="divider"></tr>',
                    '<tr>',
                        '<td class="left"></td>',
                        '<td class="right"><button id="fminfo-btn-apply" class="btn normal dlg-btn primary"><%= scope.okButtonText %></button></td>',
                    '</tr>',
                '</table>'
            ].join(''));

            this.menu = options.menu;
            this.coreProps = null;
            this.authors = [];
            this._locked = false;
        },

        render: function(node) {
            var me = this;
            var $markup = $(me.template({scope: me}));

            // server info
            this.lblPlacement = $markup.findById('#id-info-placement');
            this.lblOwner = $markup.findById('#id-info-owner');
            this.lblUploaded = $markup.findById('#id-info-uploaded');

            // edited info
            var keyDownBefore = function(input, e){
                if (e.keyCode === Common.UI.Keys.ESC) {
                    var newVal = input._input.val(),
                        oldVal = input.getValue();
                    if (newVal !== oldVal) {
                        input.setValue(oldVal);
                        e.stopPropagation();
                    }
                }
            };

            this.inputTitle = new Common.UI.InputField({
                el          : $markup.findById('#id-info-title'),
                style       : 'width: 200px;',
                placeHolder : this.txtAddText,
                validateOnBlur: false
            }).on('keydown:before', keyDownBefore);
            this.inputSubject = new Common.UI.InputField({
                el          : $markup.findById('#id-info-subject'),
                style       : 'width: 200px;',
                placeHolder : this.txtAddText,
                validateOnBlur: false
            }).on('keydown:before', keyDownBefore);
            this.inputComment = new Common.UI.InputField({
                el          : $markup.findById('#id-info-comment'),
                style       : 'width: 200px;',
                placeHolder : this.txtAddText,
                validateOnBlur: false
            }).on('keydown:before', keyDownBefore);

            // modify info
            this.lblModifyDate = $markup.findById('#id-info-modify-date');
            this.lblModifyBy = $markup.findById('#id-info-modify-by');

            // creation info
            this.lblDate = $markup.findById('#id-info-date');
            this.lblApplication = $markup.findById('#id-info-appname');
            this.tblAuthor = $markup.findById('#id-info-author table');
            this.trAuthor = $markup.findById('#id-info-add-author').closest('tr');
            this.authorTpl = '<tr><td><div style="display: inline-block;width: 200px;"><input type="text" spellcheck="false" class="form-control" readonly="true" value="{0}" ></div><div class="close img-commonctrl"></div></td></tr>';

            this.tblAuthor.on('click', function(e) {
                var btn = $markup.find(e.target);
                if (btn.hasClass('close') && !btn.hasClass('disabled')) {
                    var el = btn.closest('tr'),
                        idx = me.tblAuthor.find('tr').index(el);
                    el.remove();
                    me.authors.splice(idx, 1);
                }
            });

            this.inputAuthor = new Common.UI.InputField({
                el          : $markup.findById('#id-info-add-author'),
                style       : 'width: 200px;',
                validateOnBlur: false,
                placeHolder: this.txtAddAuthor
            }).on('changed:after', function(input, newValue, oldValue, e) {
                if (newValue == oldValue) return;

                var val = newValue.trim();
                if (!!val && val !== oldValue.trim()) {
                    var isFromApply = e && e.relatedTarget && (e.relatedTarget.id == 'fminfo-btn-apply');
                    val.split(/\s*[,;]\s*/).forEach(function(item){
                        var str = item.trim();
                        if (str) {
                            me.authors.push(item);
                            if (!isFromApply) {
                                var div = $(Common.Utils.String.format(me.authorTpl, Common.Utils.String.htmlEncode(str)));
                                me.trAuthor.before(div);
                            }
                        }
                    });
                    !isFromApply && me.inputAuthor.setValue('');
                }
            }).on('keydown:before', keyDownBefore);

            this.btnApply = new Common.UI.Button({
                el: $markup.findById('#fminfo-btn-apply')
            });
            this.btnApply.on('click', _.bind(this.applySettings, this));

            this.rendered = true;

            this.updateInfo(this.doc);

            this.$el = $(node).html($markup);
            if (_.isUndefined(this.scroller)) {
                this.scroller = new Common.UI.Scroller({
                    el: this.$el,
                    suppressScrollX: true
                });
            }

            return this;
        },

        show: function() {
            Common.UI.BaseView.prototype.show.call(this,arguments);

            this.updateFileInfo();
        },

        hide: function() {
            Common.UI.BaseView.prototype.hide.call(this,arguments);
        },

        updateInfo: function(doc) {
            if (!this.doc && doc && doc.info) {
                doc.info.author && console.log("Obsolete: The 'author' parameter of the document 'info' section is deprecated. Please use 'owner' instead.");
                doc.info.created && console.log("Obsolete: The 'created' parameter of the document 'info' section is deprecated. Please use 'uploaded' instead.");
            }

            this.doc = doc;
            if (!this.rendered)
                return;

            var visible = false;
            doc = doc || {};
            if (doc.info) {
                // server info
                if (doc.info.folder )
                    this.lblPlacement.text( doc.info.folder );
                visible = this._ShowHideInfoItem(this.lblPlacement, doc.info.folder!==undefined && doc.info.folder!==null) || visible;
                var value = doc.info.owner || doc.info.author;
                if (value)
                    this.lblOwner.text(value);
                visible = this._ShowHideInfoItem(this.lblOwner, !!value) || visible;
                value = doc.info.uploaded || doc.info.created;
                if (value)
                    this.lblUploaded.text(value);
                visible = this._ShowHideInfoItem(this.lblUploaded, !!value) || visible;
            } else
                this._ShowHideDocInfo(false);
            $('tr.divider.general', this.el)[visible?'show':'hide']();

            var appname = (this.api) ? this.api.asc_getAppProps() : null;
            if (appname) {
                appname = (appname.asc_getApplication() || '') + ' ' + (appname.asc_getAppVersion() || '');
                this.lblApplication.text(appname);
            }
            this._ShowHideInfoItem(this.lblApplication, !!appname);

            this.coreProps = (this.api) ? this.api.asc_getCoreProps() : null;
            if (this.coreProps) {
                var value = this.coreProps.asc_getCreated();
                if (value)
                    this.lblDate.text(value.toLocaleString(this.mode.lang, {year: 'numeric', month: '2-digit', day: '2-digit'}) + ' ' + value.toLocaleString(this.mode.lang, {timeStyle: 'short'}));
                this._ShowHideInfoItem(this.lblDate, !!value);
            }
        },

        updateFileInfo: function() {
            if (!this.rendered)
                return;

            var me = this,
                props = (this.api) ? this.api.asc_getCoreProps() : null,
                value;

            this.coreProps = props;
            // var app = (this.api) ? this.api.asc_getAppProps() : null;
            // if (app) {
            //     value = app.asc_getTotalTime();
            //     if (value)
            //         this.lblEditTime.text(value + ' ' + this.txtMinutes);
            // }
            // this._ShowHideInfoItem(this.lblEditTime, !!value);

            if (props) {
                var visible = false;
                value = props.asc_getModified();
                if (value)
                    this.lblModifyDate.text(value.toLocaleString(this.mode.lang, {year: 'numeric', month: '2-digit', day: '2-digit'}) + ' ' + value.toLocaleString(this.mode.lang, {timeStyle: 'short'}));
                visible = this._ShowHideInfoItem(this.lblModifyDate, !!value) || visible;
                value = props.asc_getLastModifiedBy();
                if (value)
                    this.lblModifyBy.text(value);
                visible = this._ShowHideInfoItem(this.lblModifyBy, !!value) || visible;
                $('tr.divider.modify', this.el)[visible?'show':'hide']();

                value = props.asc_getTitle();
                this.inputTitle.setValue(value || '');
                value = props.asc_getSubject();
                this.inputSubject.setValue(value || '');
                value = props.asc_getDescription();
                this.inputComment.setValue(value || '');

                this.inputAuthor.setValue('');
                this.tblAuthor.find('tr:not(:last-of-type)').remove();
                this.authors = [];
                value = props.asc_getCreator();//"123\"\"\"\<\>,456";
                value && value.split(/\s*[,;]\s*/).forEach(function(item) {
                    var div = $(Common.Utils.String.format(me.authorTpl, Common.Utils.String.htmlEncode(item)));
                    me.trAuthor.before(div);
                    me.authors.push(item);
                });
                this.tblAuthor.find('.close').toggleClass('hidden', !this.mode.isEdit);
                !this.mode.isEdit && this._ShowHideInfoItem(this.tblAuthor, !!this.authors.length);
            }
            this.SetDisabled();
        },

        _ShowHideInfoItem: function(el, visible) {
            el.closest('tr')[visible?'show':'hide']();
            return visible;
        },

        _ShowHideDocInfo: function(visible) {
            this._ShowHideInfoItem(this.lblPlacement, visible);
            this._ShowHideInfoItem(this.lblOwner, visible);
            this._ShowHideInfoItem(this.lblUploaded, visible);
        },

        setMode: function(mode) {
            this.mode = mode;
            this.inputAuthor.setVisible(mode.isEdit);
            this.btnApply.setVisible(mode.isEdit);
            this.tblAuthor.find('.close').toggleClass('hidden', !mode.isEdit);
            if (!mode.isEdit) {
                this.inputTitle._input.attr('placeholder', '');
                this.inputSubject._input.attr('placeholder', '');
                this.inputComment._input.attr('placeholder', '');
                this.inputAuthor._input.attr('placeholder', '');
            }
            this.SetDisabled();
            return this;
        },

        setApi: function(o) {
            this.api = o;
            this.api.asc_registerCallback('asc_onLockCore',  _.bind(this.onLockCore, this));
            this.updateInfo(this.doc);
            return this;
        },

        onLockCore: function(lock) {
            this._locked = lock;
            this.updateFileInfo();
        },

        SetDisabled: function() {
            var disable = !this.mode.isEdit || this._locked;
            this.inputTitle.setDisabled(disable);
            this.inputSubject.setDisabled(disable);
            this.inputComment.setDisabled(disable);
            this.inputAuthor.setDisabled(disable);
            this.tblAuthor.find('.close').toggleClass('disabled', this._locked);
            this.tblAuthor.toggleClass('disabled', disable);
            this.btnApply.setDisabled(this._locked);
        },

        applySettings: function() {
            if (this.coreProps && this.api) {
                this.coreProps.asc_putTitle(this.inputTitle.getValue());
                this.coreProps.asc_putSubject(this.inputSubject.getValue());
                this.coreProps.asc_putDescription(this.inputComment.getValue());
                this.coreProps.asc_putCreator(this.authors.join(';'));
                this.api.asc_setCoreProps(this.coreProps);
            }
            this.menu.hide();
        },

        txtPlacement: 'Location',
        txtOwner: 'Owner',
        txtUploaded: 'Uploaded',
        txtAppName: 'Application',
        txtEditTime: 'Total Editing time',
        txtTitle: 'Title',
        txtSubject: 'Subject',
        txtComment: 'Comment',
        txtModifyDate: 'Last Modified',
        txtModifyBy: 'Last Modified By',
        txtCreated: 'Created',
        txtAuthor: 'Author',
        txtAddAuthor: 'Add Author',
        txtAddText: 'Add Text',
        txtMinutes: 'min',
        okButtonText: 'Apply'
    }, PE.Views.FileMenuPanels.DocumentInfo || {}));

    PE.Views.FileMenuPanels.DocumentRights = Common.UI.BaseView.extend(_.extend({
        el: '#panel-rights',
        menu: undefined,

        initialize: function(options) {
            Common.UI.BaseView.prototype.initialize.call(this,arguments);
            this.rendered = false;

            this.template = _.template([
                '<table class="main">',
                    '<tr class="rights">',
                        '<td class="left" style="vertical-align: top;"><label>' + this.txtRights + '</label></td>',
                        '<td class="right"><div id="id-info-rights"></div></td>',
                    '</tr>',
                    '<tr class="edit-rights">',
                        '<td class="left"></td><td class="right"><button id="id-info-btn-edit" class="btn normal dlg-btn primary custom" style="margin-right: 10px;">' + this.txtBtnAccessRights + '</button></td>',
                    '</tr>',
                '</table>'
            ].join(''));

            this.templateRights = _.template([
                '<table>',
                    '<% _.each(users, function(item) { %>',
                    '<tr>',
                        '<td><span class="userLink <% if (item.isLink) { %>sharedLink<% } %>"></span><span><%= Common.Utils.String.htmlEncode(item.user) %></span></td>',
                        '<td><%= Common.Utils.String.htmlEncode(item.permissions) %></td>',
                    '</tr>',
                    '<% }); %>',
                '</table>'
            ].join(''));

            this.menu = options.menu;
        },

        render: function(node) {
            var $markup = $(this.template());

            this.cntRights = $markup.findById('#id-info-rights');
            this.btnEditRights = new Common.UI.Button({
                el: $markup.findById('#id-info-btn-edit')
            });
            this.btnEditRights.on('click', _.bind(this.changeAccessRights, this));

            this.rendered = true;

            this.updateInfo(this.doc);

            this.$el = $(node).html($markup);

            if (_.isUndefined(this.scroller)) {
                this.scroller = new Common.UI.Scroller({
                    el: this.$el,
                    suppressScrollX: true
                });
            }

            Common.NotificationCenter.on('collaboration:sharingupdate', this.updateSharingSettings.bind(this));
            Common.NotificationCenter.on('collaboration:sharingdeny', this.onLostEditRights.bind(this));

            return this;
        },

        show: function() {
            Common.UI.BaseView.prototype.show.call(this,arguments);
        },

        hide: function() {
            Common.UI.BaseView.prototype.hide.call(this,arguments);
        },

        updateInfo: function(doc) {
            this.doc = doc;
            if (!this.rendered)
                return;

            doc = doc || {};

            if (doc.info) {
                if (doc.info.sharingSettings)
                    this.cntRights.html(this.templateRights({users: doc.info.sharingSettings}));
                this._ShowHideInfoItem('rights', doc.info.sharingSettings!==undefined && doc.info.sharingSettings!==null && doc.info.sharingSettings.length>0);
                this._ShowHideInfoItem('edit-rights', (!!this.sharingSettingsUrl && this.sharingSettingsUrl.length || this.mode.canRequestSharingSettings) && this._readonlyRights!==true);
            } else
                this._ShowHideDocInfo(false);
        },

        _ShowHideInfoItem: function(cls, visible) {
            $('tr.'+cls, this.el)[visible?'show':'hide']();
        },

        _ShowHideDocInfo: function(visible) {
            this._ShowHideInfoItem('rights', visible);
            this._ShowHideInfoItem('edit-rights', visible);
        },

        setMode: function(mode) {
            this.mode = mode;
            this.sharingSettingsUrl = mode.sharingSettingsUrl;
            return this;
        },

        changeAccessRights: function(btn,event,opts) {
            Common.NotificationCenter.trigger('collaboration:sharing');
        },

        updateSharingSettings: function(rights) {
            this._ShowHideInfoItem('rights', this.doc.info.sharingSettings!==undefined && this.doc.info.sharingSettings!==null && this.doc.info.sharingSettings.length>0);
            this.cntRights.html(this.templateRights({users: this.doc.info.sharingSettings}));
        },

        onLostEditRights: function() {
            this._readonlyRights = true;
            if (!this.rendered)
                return;

            this._ShowHideInfoItem('edit-rights', false);
        },

        txtRights: 'Persons who have rights',
        txtBtnAccessRights: 'Change access rights'
    }, PE.Views.FileMenuPanels.DocumentRights || {}));

    PE.Views.FileMenuPanels.Help = Common.UI.BaseView.extend({
        el: '#panel-help',
        menu: undefined,

        template: _.template([
            '<div style="width:100%; height:100%; position: relative;">',
                '<div id="id-help-contents" style="position: absolute; width:220px; top: 0; bottom: 0;" class="no-padding"></div>',
                '<div id="id-help-frame" style="position: absolute; left: 220px; top: 0; right: 0; bottom: 0;" class="no-padding"></div>',
            '</div>'
        ].join('')),

        initialize: function(options) {
            Common.UI.BaseView.prototype.initialize.call(this,arguments);

            this.menu = options.menu;
            this.urlPref = 'resources/help/en/';

            this.en_data = [
                {"src": "ProgramInterface/ProgramInterface.htm", "name": "Introducing Presentation Editor user interface", "headername": "Program Interface"},
                {"src": "ProgramInterface/FileTab.htm", "name": "File tab"},
                {"src": "ProgramInterface/HomeTab.htm", "name": "Home Tab"},
                {"src": "ProgramInterface/InsertTab.htm", "name": "Insert tab"},
                {"src": "ProgramInterface/PluginsTab.htm", "name": "Plugins tab"},
                {"src": "UsageInstructions/OpenCreateNew.htm", "name": "Create a new presentation or open an existing one", "headername": "Basic operations" },
                {"src": "UsageInstructions/CopyPasteUndoRedo.htm", "name": "Copy/paste data, undo/redo your actions"},
                {"src": "UsageInstructions/ManageSlides.htm", "name": "Manage slides", "headername": "Working with slides"},
                {"src": "UsageInstructions/SetSlideParameters.htm", "name": "Set slide parameters"},
                {"src": "UsageInstructions/ApplyTransitions.htm", "name": "Apply transitions" },
                {"src": "UsageInstructions/PreviewPresentation.htm", "name": "Preview your presentation" },
                {"src": "UsageInstructions/InsertText.htm", "name": "Insert and format your text", "headername": "Text formatting"},
                {"src": "UsageInstructions/AddHyperlinks.htm", "name": "Add hyperlinks"},
                {"src": "UsageInstructions/CreateLists.htm", "name": "Create lists" },
                {"src": "UsageInstructions/CopyClearFormatting.htm", "name": "Copy/clear formatting"},
                {"src": "UsageInstructions/InsertAutoshapes.htm", "name": "Insert and format autoshapes", "headername": "Operations on objects"},
                {"src": "UsageInstructions/InsertImages.htm", "name": "Insert and adjust images"},
                {"src": "UsageInstructions/InsertCharts.htm", "name": "Insert and edit charts" },
                {"src": "UsageInstructions/InsertTables.htm", "name": "Insert and format tables" },
                {"src": "UsageInstructions/FillObjectsSelectColor.htm", "name": "Fill objects and select colors"},
                {"src": "UsageInstructions/ManipulateObjects.htm", "name": "Manipulate objects on a slide"},
                {"src": "UsageInstructions/AlignArrangeObjects.htm", "name": "Align and arrange objects on a slide"},
                {"src": "UsageInstructions/InsertEquation.htm", "name": "Insert equations", "headername": "Math equations" },
                {"src": "HelpfulHints/CollaborativeEditing.htm", "name": "Collaborative presentation editing", "headername": "Presentation co-editing" },
                {"src": "UsageInstructions/ViewPresentationInfo.htm", "name": "View presentation information", "headername": "Tools and settings"},
                {"src": "UsageInstructions/SavePrintDownload.htm", "name": "Save/print/download your presentation" },
                {"src": "HelpfulHints/AdvancedSettings.htm", "name": "Advanced settings of Presentation Editor"},
                {"src": "HelpfulHints/Navigation.htm", "name": "View settings and navigation tools"},
                {"src": "HelpfulHints/Search.htm", "name": "Search function"},
                {"src": "HelpfulHints/SpellChecking.htm", "name": "Spell-checking"},
                {"src": "HelpfulHints/About.htm", "name": "About Presentation Editor", "headername": "Helpful hints"},
                {"src": "HelpfulHints/SupportedFormats.htm", "name": "Supported formats of electronic presentations"},
                {"src": "HelpfulHints/KeyboardShortcuts.htm", "name": "Keyboard shortcuts"}
            ];

            if (Common.Utils.isIE) {
                window.onhelp = function () { return false; }
            }
        },

        render: function() {
            var me = this;
            this.$el.html(this.template());

            this.viewHelpPicker = new Common.UI.DataView({
                el: $('#id-help-contents'),
                store: new Common.UI.DataViewStore([]),
                keyMoveDirection: 'vertical',
                itemTemplate: _.template([
                    '<div id="<%= id %>" class="help-item-wrap">',
                        '<div class="caption"><%= name %></div>',
                    '</div>'
                ].join(''))
            });
            this.viewHelpPicker.on('item:add', function(dataview, itemview, record) {
                if (record.has('headername')) {
                    $(itemview.el).before('<div class="header-name">' + record.get('headername') + '</div>');
                }
            });

            this.viewHelpPicker.on('item:select', function(dataview, itemview, record) {
                me.iFrame.src = me.urlPref + record.get('src');
            });

            this.iFrame = document.createElement('iframe');

            this.iFrame.src = "";
            this.iFrame.align = "top";
            this.iFrame.frameBorder = "0";
            this.iFrame.width = "100%";
            this.iFrame.height = "100%";
            Common.Gateway.on('internalcommand', function(data) {
                if (data.type == 'help:hyperlink') {
                    var src = data.data;
                    var rec = me.viewHelpPicker.store.find(function(record){
                        return (src.indexOf(record.get('src'))>0);
                    });
                    if (rec) {
                        me.viewHelpPicker.selectRecord(rec, true);
                        me.viewHelpPicker.scrollToRecord(rec);
                    }
                }
            });
            
            $('#id-help-frame').append(this.iFrame);

            return this;
        },

        setLangConfig: function(lang) {
            var me = this;
            var store = this.viewHelpPicker.store;
            if (lang) {
                lang = lang.split(/[\-\_]/)[0];
                var config = {
                    dataType: 'json',
                    error: function () {
                        if ( me.urlPref.indexOf('resources/help/en/')<0 ) {
                            me.urlPref = 'resources/help/en/';
                            store.url = 'resources/help/en/Contents.json';
                            store.fetch(config);
                        } else {
                            me.urlPref = 'resources/help/en/';
                            store.reset(me.en_data);
                        }
                    },
                    success: function () {
                        var rec = store.at(0);
                        me.viewHelpPicker.selectRecord(rec);
                        me.iFrame.src = me.urlPref + rec.get('src');
                    }
                };
                store.url = 'resources/help/' + lang + '/Contents.json';
                store.fetch(config);
                this.urlPref = 'resources/help/' + lang + '/';
            }
        },

        show: function () {
            Common.UI.BaseView.prototype.show.call(this);
            if (!this._scrollerInited) {
                this.viewHelpPicker.scroller.update();
                this._scrollerInited = true;
            }
        }
    });

    PE.Views.FileMenuPanels.ProtectDoc = Common.UI.BaseView.extend(_.extend({
        el: '#panel-protect',
        menu: undefined,

        template: _.template([
            '<label id="id-fms-lbl-protect-header" style="font-size: 18px;"><%= scope.strProtect %></label>',
            '<div id="id-fms-password">',
                '<label class="header"><%= scope.strEncrypt %></label>',
                '<div id="fms-btn-add-pwd" style="width:190px;"></div>',
                '<table id="id-fms-view-pwd" cols="2" width="300">',
                    '<tr>',
                        '<td colspan="2"><label style="cursor: default;"><%= scope.txtEncrypted %></label></td>',
                    '</tr>',
                    '<tr>',
                        '<td><div id="fms-btn-change-pwd" style="width:190px;"></div></td>',
                        '<td align="right"><div id="fms-btn-delete-pwd" style="width:190px; margin-left:20px;"></div></td>',
                    '</tr>',
                '</table>',
            '</div>',
            '<div id="id-fms-signature">',
                '<label class="header"><%= scope.strSignature %></label>',
                '<div id="fms-btn-invisible-sign" style="width:190px; margin-bottom: 20px;"></div>',
                '<div id="id-fms-signature-view"></div>',
            '</div>'
        ].join('')),

        initialize: function(options) {
            Common.UI.BaseView.prototype.initialize.call(this,arguments);

            this.menu = options.menu;

            var me = this;
            this.templateSignature = _.template([
                '<table cols="2" width="300" class="<% if (!hasSigned) { %>hidden<% } %>"">',
                    '<tr>',
                        '<td colspan="2"><label style="cursor: default;"><%= tipText %></label></td>',
                    '</tr>',
                    '<tr>',
                        '<td><label class="link signature-view-link">' + me.txtView + '</label></td>',
                        '<td align="right"><label class="link signature-edit-link <% if (!hasSigned) { %>hidden<% } %>">' + me.txtEdit + '</label></td>',
                    '</tr>',
                '</table>'
            ].join(''));
        },

        render: function() {
            this.$el.html(this.template({scope: this}));

            var protection = PE.getController('Common.Controllers.Protection').getView();

            this.btnAddPwd = protection.getButton('add-password');
            this.btnAddPwd.render(this.$el.find('#fms-btn-add-pwd'));
            this.btnAddPwd.on('click', _.bind(this.closeMenu, this));

            this.btnChangePwd = protection.getButton('change-password');
            this.btnChangePwd.render(this.$el.find('#fms-btn-change-pwd'));
            this.btnChangePwd.on('click', _.bind(this.closeMenu, this));

            this.btnDeletePwd = protection.getButton('del-password');
            this.btnDeletePwd.render(this.$el.find('#fms-btn-delete-pwd'));
            this.btnDeletePwd.on('click', _.bind(this.closeMenu, this));

            this.cntPassword = $('#id-fms-password');
            this.cntPasswordView = $('#id-fms-view-pwd');

            this.btnAddInvisibleSign = protection.getButton('signature');
            this.btnAddInvisibleSign.render(this.$el.find('#fms-btn-invisible-sign'));
            this.btnAddInvisibleSign.on('click', _.bind(this.closeMenu, this));

            this.cntSignature = $('#id-fms-signature');
            this.cntSignatureView = $('#id-fms-signature-view');
            if (_.isUndefined(this.scroller)) {
                this.scroller = new Common.UI.Scroller({
                    el: this.$el,
                    suppressScrollX: true
                });
            }

            this.$el.on('click', '.signature-edit-link', _.bind(this.onEdit, this));
            this.$el.on('click', '.signature-view-link', _.bind(this.onView, this));

            return this;
        },

        show: function() {
            Common.UI.BaseView.prototype.show.call(this,arguments);
            this.updateSignatures();
            this.updateEncrypt();
        },

        setMode: function(mode) {
            this.mode = mode;
            this.cntSignature.toggleClass('hidden', !this.mode.isSignatureSupport);
            this.cntPassword.toggleClass('hidden', !this.mode.isPasswordSupport);
        },

        setApi: function(o) {
            this.api = o;
            return this;
        },

        closeMenu: function() {
            this.menu && this.menu.hide();
        },

        onEdit: function() {
            this.menu && this.menu.hide();

            var me = this;
            Common.UI.warning({
                title: this.notcriticalErrorTitle,
                msg: this.txtEditWarning,
                buttons: ['ok', 'cancel'],
                primary: 'ok',
                callback: function(btn) {
                    if (btn == 'ok') {
                        me.api.asc_RemoveAllSignatures();
                    }
                }
            });

        },

        onView: function() {
            this.menu && this.menu.hide();
            PE.getController('RightMenu').rightmenu.SetActivePane(Common.Utils.documentSettingsType.Signature, true);
        },

        updateSignatures: function(){
            var valid = this.api.asc_getSignatures(),
                hasValid = false,
                hasInvalid = false;

            _.each(valid, function(item, index){
                if (item.asc_getValid()==0)
                    hasValid = true;
                else
                    hasInvalid = true;
            });

            // hasValid = true;
            // hasInvalid = true;

            var tipText = (hasInvalid) ? this.txtSignedInvalid : (hasValid ? this.txtSigned : "");
            this.cntSignatureView.html(this.templateSignature({tipText: tipText, hasSigned: (hasValid || hasInvalid)}));
        },

        updateEncrypt: function() {
            this.cntPasswordView.toggleClass('hidden', this.btnAddPwd.isVisible());
        },

        strProtect: 'Protect Presentation',
        strSignature: 'With Signature',
        txtView: 'View signatures',
        txtEdit: 'Edit presentation',
        txtSigned: 'Valid signatures has been added to the presentation. The presentation is protected from editing.',
        txtSignedInvalid: 'Some of the digital signatures in presentation are invalid or could not be verified. The presentation is protected from editing.',
        notcriticalErrorTitle: 'Warning',
        txtEditWarning: 'Editing will remove the signatures from the presentation.<br>Are you sure you want to continue?',
        strEncrypt: 'With Password',
        txtEncrypted: 'This presentation has been protected by password'

    }, PE.Views.FileMenuPanels.ProtectDoc || {}));

});
