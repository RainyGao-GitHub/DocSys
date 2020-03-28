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
 *  SlideSizeSettings.js
 *
 *  Created by Julia Radzhabova on 4/19/14
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'common/main/lib/component/Window',
    'common/main/lib/component/ComboBox'
], function () { 'use strict';

    PE.Views.SlideSizeSettings = Common.UI.Window.extend(_.extend({
        options: {
            width: 250,
            header: true,
            style: 'min-width: 250px;',
            cls: 'modal-dlg',
            id: 'window-slide-size-settings',
            buttons: ['ok', 'cancel']
        },

        initialize : function(options) {
            _.extend(this.options, {
                title: this.textTitle
            }, options || {});

            this.template = [
                '<div class="box" style="height: 148px;">',
                    '<div class="input-row">',
                        '<label class="text" style="font-weight: bold;">' + this.textSlideSize + '</label>',
                    '</div>',
                    '<div id="slide-size-combo" class="" style="margin-bottom: 10px;"></div>',
                    '<table cols="2" style="width: 100%;margin-bottom: 7px;">',
                        '<tr>',
                            '<td class="padding-small" style="padding-right: 10px;">',
                                '<label class="input-label" style="font-weight: bold;">' + this.textWidth + '</label>',
                                '<div id="slide-size-spin-width"></div>',
                            '</td>',
                            '<td class="padding-small" style="padding-left: 10px;">',
                                '<label class="input-label" style="font-weight: bold;">' + this.textHeight + '</label>',
                                '<div id="slide-size-spin-height"></div>',
                            '</td>',
                        '</tr>',
                    '</table>',
                    '<div class="input-row">',
                        '<label class="text" style="font-weight: bold;">' + this.textSlideOrientation + '</label>',
                    '</div>',
                    '<div id="slide-orientation-combo" class="" style="margin-bottom: 10px;"></div>',
                '</div>',
                '<div class="separator horizontal"/>'
            ].join('');

            this.options.tpl = _.template(this.template)(this.options);

            this.spinners = [];
            this._noApply = false;

            Common.UI.Window.prototype.initialize.call(this, this.options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);

            this.cmbSlideSize = new Common.UI.ComboBox({
                el: $('#slide-size-combo'),
                cls: 'input-group-nr',
                style: 'width: 100%;',
                menuStyle: 'min-width: 218px;',
                editable: false,
                data: [
                    {value:0, displayValue: this.txtStandard , size: [254, 190.5]},
                    {value:1, displayValue: this.txtWidescreen1 , size: [254, 143]},
                    {value:2, displayValue: this.txtWidescreen2 , size: [254, 158.7]},
                    {value:3, displayValue: this.txtLetter , size: [254, 190.5]},
                    {value:4, displayValue: this.txtLedger , size: [338.3, 253.7]},
                    {value:5, displayValue: this.txtA3 , size: [355.6, 266.7]},
                    {value:6, displayValue: this.txtA4 , size: [275, 190.5]},
                    {value:7, displayValue: this.txtB4 , size: [300.7, 225.5]},
                    {value:8, displayValue: this.txtB5 , size: [199.1, 149.3]},
                    {value:9, displayValue: this.txt35 , size: [285.7, 190.5]},
                    {value:10, displayValue: this.txtOverhead , size: [254, 190.5]},
                    {value:11, displayValue: this.txtBanner , size: [203.2, 25.4]},
                    {value:-1, displayValue: this.txtCustom , size: []}
                ]
            });
            this.cmbSlideSize.setValue(0);
            this.cmbSlideSize.on('selected', _.bind(function(combo, record) {
                this._noApply = true;
                if (record.value<0) {
                    // set current slide size
                } else {
                    var w = record.size[0],
                        h = record.size[1],
                        orient = this.cmbSlideOrientation.getValue(),
                        cond = orient==0 && w>h || orient==1 && h>w;
                    this.spnWidth.setValue(Common.Utils.Metric.fnRecalcFromMM(cond ? h : w), true);
                    this.spnHeight.setValue(Common.Utils.Metric.fnRecalcFromMM(cond ? w : h), true);
                }
                this._noApply = false;
            }, this));

            this.spnWidth = new Common.UI.MetricSpinner({
                el: $('#slide-size-spin-width'),
                step: .1,
                width: 98,
                defaultUnit : "cm",
                value: '25.4 cm',
                maxValue: 142.24,
                minValue: 2.54
            });
            this.spinners.push(this.spnWidth);
            this.spnWidth.on('change', _.bind(function(field, newValue, oldValue, eOpts){
                if (!this._noApply) {
                    if (this.cmbSlideSize.getValue() >-1)
                        this.cmbSlideSize.setValue(-1);
                    var w = this.spnWidth.getNumberValue(),
                        h = this.spnHeight.getNumberValue();
                    this.cmbSlideOrientation.setValue( h>w ? 0 : 1);
                }
            }, this));

            this.spnHeight = new Common.UI.MetricSpinner({
                el: $('#slide-size-spin-height'),
                step: .1,
                width: 98,
                defaultUnit : "cm",
                value: '19.05 cm',
                maxValue: 142.24,
                minValue: 2.54
            });
            this.spinners.push(this.spnHeight);
            this.spnHeight.on('change', _.bind(function(field, newValue, oldValue, eOpts){
                if (!this._noApply) {
                    if (this.cmbSlideSize.getValue() >-1)
                        this.cmbSlideSize.setValue(-1);
                    var w = this.spnWidth.getNumberValue(),
                        h = this.spnHeight.getNumberValue();
                    this.cmbSlideOrientation.setValue( h>w ? 0 : 1);
                }
            }, this));

            this.cmbSlideOrientation = new Common.UI.ComboBox({
                el: $('#slide-orientation-combo'),
                cls: 'input-group-nr',
                style: 'width: 100%;',
                menuStyle: 'min-width: 218px;',
                editable: false,
                data: [
                    {value:0, displayValue: this.strPortrait},
                    {value:1, displayValue: this.strLandscape}
                ]
            });
            this.cmbSlideOrientation.setValue(1);
            this.cmbSlideOrientation.on('selected', _.bind(function(combo, record) {
                this._noApply = true;
                var w = this.spnWidth.getNumberValue(),
                    h = this.spnHeight.getNumberValue();
                if (record.value==0 && w>h || record.value==1 && h>w) {
                    this.spnWidth.setValue(h, true);
                    this.spnHeight.setValue(w, true);
                }
                this._noApply = false;
            }, this));

            var $window = this.getChild();
            $window.find('.dlg-btn').on('click', _.bind(this.onBtnClick, this));

            this.updateMetricUnit();
        },

        _handleInput: function(state) {
            if (this.options.handler) {
                this.options.handler.call(this, this, state);
            }

            this.close();
        },

        onBtnClick: function(event) {
            this._handleInput(event.currentTarget.attributes['result'].value);
        },

        onPrimary: function() {
            this._handleInput('ok');
            return false;
        },

        setSettings: function (type, pagewitdh, pageheight) {
            this.spnWidth.setValue(Common.Utils.Metric.fnRecalcFromMM(pagewitdh), true);
            this.spnHeight.setValue(Common.Utils.Metric.fnRecalcFromMM(pageheight), true);
            this.cmbSlideSize.setValue(type);
            this.cmbSlideOrientation.setValue((pageheight>pagewitdh) ? 0 : 1);

        },

        getSettings: function() {
            var props = [this.cmbSlideSize.getValue(),  Common.Utils.Metric.fnRecalcToMM(this.spnWidth.getNumberValue()), Common.Utils.Metric.fnRecalcToMM(this.spnHeight.getNumberValue())];
            return props;
        },

        updateMetricUnit: function() {
            if (this.spinners) {
                for (var i=0; i<this.spinners.length; i++) {
                    var spinner = this.spinners[i];
                    spinner.setDefaultUnit(Common.Utils.Metric.getCurrentMetricName());
                    spinner.setStep(Common.Utils.Metric.getCurrentMetric()==Common.Utils.Metric.c_MetricUnits.pt ? 1 : 0.1);
                }
            }
        },

        textTitle:          'Slide Size Settings',
        textSlideSize:      'Slide Size',
        textWidth:          'Width',
        textHeight:         'Height',
        txtStandard:        'Standard (4:3)',
        txtWidescreen1:     'Widescreen (16:9)',
        txtWidescreen2:     'Widescreen (16:10)',
        txtLetter:          'Letter Paper (8.5x11 in)',
        txtLedger:          'Ledger Paper (11x17 in)',
        txtA3:              'A3 Paper (297x420 mm)',
        txtA4:              'A4 Paper (210x297 mm)',
        txtB4:              'B4 (ICO) Paper (250x353 mm)',
        txtB5:              'B5 (ICO) Paper (176x250 mm)',
        txt35:              '35 mm Slides',
        txtOverhead:        'Overhead',
        txtBanner:          'Banner',
        txtCustom:          'Custom',
        textSlideOrientation: 'Slide Orientation',
        strPortrait:        'Portrait',
        strLandscape:       'Landscape'
    }, PE.Views.SlideSizeSettings || {}))
});