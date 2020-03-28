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
 *  HyperlinkSettingsDialog.js
 *
 *  Created by Alexander Yuzhin on 4/9/14
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */


if (Common === undefined)
    var Common = {};

define([
    'common/main/lib/util/utils',
    'common/main/lib/component/ComboBox',
    'common/main/lib/component/InputField',
    'common/main/lib/component/Window'
], function () { 'use strict';

    SSE.Views.HyperlinkSettingsDialog = Common.UI.Window.extend(_.extend({
        options: {
            width   : 350,
            style   : 'min-width: 230px;',
            cls     : 'modal-dlg',
            buttons: ['ok', 'cancel']
        },

        initialize : function(options) {
            _.extend(this.options, {
                title: this.textTitle
            }, options || {});

            this.template = [
                '<div class="box">',
                    '<div class="input-row" style="margin-bottom: 10px;">',
                        '<button type="button" class="btn btn-text-default auto" id="id-dlg-hyperlink-external" style="border-top-right-radius: 0;border-bottom-right-radius: 0;">', this.textExternalLink,'</button>',
                        '<button type="button" class="btn btn-text-default auto" id="id-dlg-hyperlink-internal" style="border-top-left-radius: 0;border-bottom-left-radius: 0;">', this.textInternalLink,'</button>',
                    '</div>',
                    '<div id="id-external-link">',
                        '<div class="input-row">',
                            '<label>' + this.strLinkTo + ' *</label>',
                        '</div>',
                        '<div id="id-dlg-hyperlink-url" class="input-row" style="margin-bottom: 5px;"></div>',
                    '</div>',
                    '<div id="id-internal-link" class="hidden">',
                        '<div class="input-row">',
                            '<label style="width: 50%;">' + this.strSheet + '</label>',
                            '<label style="width: 50%;">' + this.strRange + ' *</label>',
                        '</div>',
                        '<div class="input-row" style="margin-bottom: 5px;">',
                            '<div id="id-dlg-hyperlink-sheet" style="display: inline-block; width: 50%; padding-right: 10px; float: left;"></div>',
                            '<div id="id-dlg-hyperlink-range" style="display: inline-block; width: 50%;"></div>',
                        '</div>',
                    '</div>',
                    '<div class="input-row">',
                        '<label>' + this.strDisplay + '</label>',
                    '</div>',
                    '<div id="id-dlg-hyperlink-display" class="input-row" style="margin-bottom: 5px;"></div>',
                    '<div class="input-row">',
                        '<label>' + this.textTipText + '</label>',
                    '</div>',
                    '<div id="id-dlg-hyperlink-tip" class="input-row" style="margin-bottom: 5px;"></div>',
                '</div>'
            ].join('');

            this.options.tpl = _.template(this.template)(this.options);
            this.api = this.options.api;

            Common.UI.Window.prototype.initialize.call(this, this.options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);

            var $window = this.getChild(),
                me = this;

            me.btnExternal = new Common.UI.Button({
                el: $('#id-dlg-hyperlink-external'),
                enableToggle: true,
                toggleGroup: 'hyperlink-type',
                allowDepress: false,
                pressed: true
            });
            me.btnExternal.on('click', _.bind(me.onLinkTypeClick, me, Asc.c_oAscHyperlinkType.WebLink));

            me.btnInternal = new Common.UI.Button({
                el: $('#id-dlg-hyperlink-internal'),
                enableToggle: true,
                toggleGroup: 'hyperlink-type',
                allowDepress: false
            });
            me.btnInternal.on('click', _.bind(me.onLinkTypeClick, me, Asc.c_oAscHyperlinkType.RangeLink));

            me.cmbSheets = new Common.UI.ComboBox({
                el      : $('#id-dlg-hyperlink-sheet'),
                cls     : 'input-group-nr',
                editable: false,
                menuStyle: 'min-width: 100%;max-height: 150px;'
            });

            me.inputUrl = new Common.UI.InputField({
                el          : $('#id-dlg-hyperlink-url'),
                allowBlank  : false,
                blankError  : me.txtEmpty,
                validateOnBlur: false,
                style       : 'width: 100%;',
                validation  : function(value) {
                    var urltype = me.api.asc_getUrlType($.trim(value));
                    me.isEmail = (urltype==2);
                    return (urltype>0) ? true : me.txtNotUrl;
                }
            });

            me.inputRange = new Common.UI.InputField({
                el          : $('#id-dlg-hyperlink-range'),
                allowBlank  : false,
                blankError  : me.txtEmpty,
                style       : 'width: 100%;',
                validateOnChange: true,
                validateOnBlur: false,
                value: Common.Utils.InternalSettings.get("sse-settings-r1c1") ? 'R1C1' : 'A1',
                validation  : function(value) {
                    var isvalid = me.api.asc_checkDataRange(Asc.c_oAscSelectionDialogType.FormatTable, value, false);
                    if (isvalid == Asc.c_oAscError.ID.No) {
                        return true;
                    } else {
                        return me.textInvalidRange;
                    }
                }
            });

            me.inputDisplay = new Common.UI.InputField({
                el          : $('#id-dlg-hyperlink-display'),
                allowBlank  : true,
                validateOnBlur: false,
                style       : 'width: 100%;'
            });

            me.inputTip = new Common.UI.InputField({
                el          : $('#id-dlg-hyperlink-tip'),
                style       : 'width: 100%;',
                maxLength   : Asc.c_oAscMaxTooltipLength
            });

            $window.find('.dlg-btn').on('click', _.bind(this.onBtnClick, this));

            me.externalPanel = $window.find('#id-external-link');
            me.internalPanel = $window.find('#id-internal-link');
        },

        show: function() {
            Common.UI.Window.prototype.show.apply(this, arguments);

            var me = this;
            _.delay(function(){
                if (me.focusedInput) me.focusedInput.focus();
            },50);
        },

        setSettings: function(settings) {
            if (settings) {
                var me = this;

                this.cmbSheets.setData(settings.sheets);
                var type = (settings.props) ? settings.props.asc_getType() : Asc.c_oAscHyperlinkType.WebLink;
                (type == Asc.c_oAscHyperlinkType.WebLink) ? me.btnExternal.toggle(true) : me.btnInternal.toggle(true);
                me.ShowHideElem(type);
                me.btnInternal.setDisabled(!settings.allowInternal && (type == Asc.c_oAscHyperlinkType.WebLink));
                me.btnExternal.setDisabled(!settings.allowInternal && (type == Asc.c_oAscHyperlinkType.RangeLink));

                if (!settings.props) {
                    this.inputDisplay.setValue(settings.isLock ? this.textDefault : settings.text);
                    this.focusedInput = this.inputUrl.cmpEl.find('input');
                    this.cmbSheets.setValue(settings.currentSheet);
                } else {
                    if (type == Asc.c_oAscHyperlinkType.RangeLink) {
                        this.cmbSheets.setValue(settings.props.asc_getSheet());
                        this.inputRange.setValue(settings.props.asc_getRange());
                        this.focusedInput = this.inputRange.cmpEl.find('input');
                    } else {
                        this.inputUrl.setValue(settings.props.asc_getHyperlinkUrl().replace(new RegExp(" ",'g'), "%20"));
                        this.focusedInput = this.inputUrl.cmpEl.find('input');
                        this.cmbSheets.setValue(settings.currentSheet);
                    }
                    this.inputDisplay.setValue(settings.isLock ? this.textDefault : settings.props.asc_getText());
                    this.inputTip.setValue(settings.props.asc_getTooltip());
                }

                this.inputDisplay.setDisabled(settings.isLock);
            }
        },

        getSettings: function() {
            var props = new Asc.asc_CHyperlink(),
                def_display = "";
            props.asc_setType(this.btnInternal.isActive() ? Asc.c_oAscHyperlinkType.RangeLink : Asc.c_oAscHyperlinkType.WebLink);

            if (this.btnInternal.isActive()) {
                props.asc_setSheet(this.cmbSheets.getValue());
                props.asc_setRange(this.inputRange.getValue());
                def_display = this.cmbSheets.getValue() + '!' + this.inputRange.getValue();
            } else {
                var url = this.inputUrl.getValue().replace(/^\s+|\s+$/g,'');
                if (! /(((^https?)|(^ftp)):\/\/)|(^mailto:)/i.test(url) )
                    url = ( (this.isEmail) ? 'mailto:' : 'http://' ) + url;
                url = url.replace(new RegExp("%20",'g')," ");
                props.asc_setHyperlinkUrl(url);
                def_display = url;
            }

            if (this.inputDisplay.isDisabled())
                props.asc_setText(null);
            else {
                if (_.isEmpty(this.inputDisplay.getValue()))
                    this.inputDisplay.setValue(def_display);
                props.asc_setText(this.inputDisplay.getValue());
            }

            props.asc_setTooltip(this.inputTip.getValue());

            return props;
        },

        onBtnClick: function(event) {
            this._handleInput(event.currentTarget.attributes['result'].value);
        },

        onPrimary: function(event) {
            this._handleInput('ok');
            return false;
        },

        _handleInput: function(state) {
            if (this.options.handler) {
                if (state == 'ok') {
                    var checkurl = (this.btnExternal.isActive()) ? this.inputUrl.checkValidate() : true,
                        checkrange = (this.btnInternal.isActive()) ? this.inputRange.checkValidate() : true,
                        checkdisp = this.inputDisplay.checkValidate();
                    if (checkurl !== true)  {
                        this.inputUrl.cmpEl.find('input').focus();
                        return;
                    }
                    if (checkrange !== true)  {
                        this.inputRange.cmpEl.find('input').focus();
                        return;
                    }
                    if (checkdisp !== true) {
                        this.inputDisplay.cmpEl.find('input').focus();
                        return;
                    }
                }

                this.options.handler.call(this, this, state);
            }

            this.close();
        },

        ShowHideElem: function(value) {
            this.externalPanel.toggleClass('hidden', value !== Asc.c_oAscHyperlinkType.WebLink);
            this.internalPanel.toggleClass('hidden', value !== Asc.c_oAscHyperlinkType.RangeLink);
        },

        onLinkTypeClick: function(type, btn, event) {
            this.ShowHideElem(type);
        },

        textTitle:          'Hyperlink Settings',
        textInternalLink:   'Internal Data Range',
        textExternalLink:   'Web Link',
        textEmptyLink:      'Enter link here',
        textEmptyDesc:      'Enter caption here',
        textEmptyTooltip:   'Enter tooltip here',
        strSheet:           'Sheet',
        strRange:           'Range',
        strDisplay:         'Display',
        textTipText:        'Screen Tip Text',
        strLinkTo:          'Link To',
        txtEmpty:           'This field is required',
        textInvalidRange:   'ERROR! Invalid cells range',
        txtNotUrl:          'This field should be a URL in the format \"http://www.example.com\"',
        textDefault:        'Selected range'
    }, SSE.Views.HyperlinkSettingsDialog || {}))
});