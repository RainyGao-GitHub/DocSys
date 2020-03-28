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
 *  HeaderFooterSettings.js
 *
 *  Created by Julia Radzhabova on 02/03/14
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/main/app/template/HeaderFooterSettings.template',
    'jquery',
    'underscore',
    'backbone',
    'common/main/lib/component/Button',
    'common/main/lib/component/MetricSpinner',
    'common/main/lib/component/CheckBox',
    'common/main/lib/component/RadioBox'
], function (menuTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.HeaderFooterSettings = Backbone.View.extend(_.extend({
        el: '#id-header-settings',

        // Compile our stats template
        template: _.template(menuTemplate),

        // Delegated events for creating new items, and clearing completed ones.
        events: {
        },

        options: {
            alias: 'HeaderFooterSettings'
        },

        initialize: function () {
            this._initSettings = true;

            this._state = {
                PositionType: c_pageNumPosition.PAGE_NUM_POSITION_TOP,
                Position: 12.5,
                DiffFirst: false,
                DiffOdd: false,
                SameAs: false,
                DisabledControls: false,
                Numbering: undefined
            };
            this.spinners = [];
            this.lockedControls = [];
            this._locked = false;

            this.render();
        },

        render: function () {
            var el = this.$el || $(this.el);
            el.html(this.template({
                scope: this
            }));
        },

        setApi: function(api) {
            this.api = api;
            return this;
        },

        ChangeSettings: function(prop) {
            if (this._initSettings)
                this.createDelayedElements();

            this.disableControls(this._locked);

            if (prop) {
                var value = prop.get_Type();
                if (this._state.PositionType !== value) {
                    if (value == c_pageNumPosition.PAGE_NUM_POSITION_BOTTOM)
                        this.lblPosition[0].innerHTML = this.textHeaderFromBottom;
                    else
                        this.lblPosition[0].innerHTML = this.textHeaderFromTop;
                    this._state.PositionType = value;
                }

                value = prop.get_Position();
                if ( Math.abs(this._state.Position-value)>0.001 ) {
                    this.numPosition.setValue(Common.Utils.Metric.fnRecalcFromMM(value), true);
                    this._state.Position = value;
                }

                value = prop.get_DifferentFirst();
                if ( this._state.DiffFirst!==value ) {
                    this.chDiffFirst.setValue(value, true);
                    this._state.DiffFirst=value;
                }

                value = prop.get_DifferentEvenOdd();
                if ( this._state.DiffOdd!==value ) {
                    this.chDiffOdd.setValue(value, true);
                    this._state.DiffOdd=value;
                }

                value = prop.get_LinkToPrevious();
                if ( this._state.SameAs!==value ) {
                    this.chSameAs.setDisabled(value===null || this._locked);
                    this.chSameAs.setValue(value==true, true);
                    this._state.SameAs=value;
                }

                value = prop.get_StartPageNumber();
                if ( this._state.Numbering!==value && value !== null) {
                    if (value<0)
                        this.radioPrev.setValue(true, true);
                    else {
                        this.radioFrom.setValue(true, true);
                        this.numFrom.setValue(value, true);
                    }
                    this._state.Numbering=value;
                }
            }
        },

        onBtnPositionClick: function(btn, eOpts){
            if (this.api)
                this.api.put_PageNum(btn.options.posWhere, btn.options.posAlign);
            this.fireEvent('editcomplete', this);
        },

        onNumPositionChange: function(field, newValue, oldValue, eOpts){
            if (this.api)
                this.api.put_HeadersAndFootersDistance(Common.Utils.Metric.fnRecalcToMM(field.getNumberValue()));
        },

        onDiffFirstChange: function(field, newValue, oldValue, eOpts){
            if (this.api)
                this.api.HeadersAndFooters_DifferentFirstPage(field.getValue()=='checked');
            this.fireEvent('editcomplete', this);
        },

        onDiffOddChange: function(field, newValue, oldValue, eOpts){
            if (this.api)
                this.api.HeadersAndFooters_DifferentOddandEvenPage((field.getValue()=='checked'));
            this.fireEvent('editcomplete', this);
        },

        onSameAsChange: function(field, newValue, oldValue, eOpts){
            if (this.api)
                this.api.HeadersAndFooters_LinkToPrevious((field.getValue()=='checked'));
            this.fireEvent('editcomplete', this);
        },

        onInsertCurrentClick: function() {
            if (this.api)
                this.api.put_PageNum(-1);
            this.fireEvent('editcomplete', this);
        },

        onRadioPrev: function(field, newValue, eOpts) {
            if (newValue && this.api) {
                this.api.asc_SetSectionStartPage(-1);
            }
            this.fireEvent('editcomplete', this);
        },

        onRadioFrom: function(field, newValue, eOpts) {
            if (newValue && this.api) {
                if (_.isEmpty(this.numFrom.getValue()))
                    this.numFrom.setValue(1, true);
                this.api.asc_SetSectionStartPage(this.numFrom.getNumberValue());
            }
            this.fireEvent('editcomplete', this);
        },

        onNumFromChange: function(field, newValue, oldValue, eOpts){
            if (this.api) {
                this.radioFrom.setValue(true, true);
                this.api.asc_SetSectionStartPage(field.getNumberValue());
            }
        },

        updateMetricUnit: function() {
            if (this.spinners) {
                for (var i=0; i<this.spinners.length; i++) {
                    var spinner = this.spinners[i];
                    spinner.setDefaultUnit(Common.Utils.Metric.getCurrentMetricName());
                    spinner.setStep(Common.Utils.Metric.getCurrentMetric()==Common.Utils.Metric.c_MetricUnits.pt ? 1 : 0.01);
                }
            }
        },

        createDelayedControls: function() {
            var me = this;
            var _arrPosition = [
                [c_pageNumPosition.PAGE_NUM_POSITION_TOP,     c_pageNumPosition.PAGE_NUM_POSITION_LEFT,      'icon-right-panel btn-colontitul-tl', 'headerfooter-button-top-left', this.textTopLeft],
                [c_pageNumPosition.PAGE_NUM_POSITION_TOP,     c_pageNumPosition.PAGE_NUM_POSITION_CENTER,    'icon-right-panel btn-colontitul-tc', 'headerfooter-button-top-center', this.textTopCenter],
                [c_pageNumPosition.PAGE_NUM_POSITION_TOP,     c_pageNumPosition.PAGE_NUM_POSITION_RIGHT,     'icon-right-panel btn-colontitul-tr', 'headerfooter-button-top-right', this.textTopRight],
                [c_pageNumPosition.PAGE_NUM_POSITION_BOTTOM,  c_pageNumPosition.PAGE_NUM_POSITION_LEFT,      'icon-right-panel btn-colontitul-bl', 'headerfooter-button-bottom-left', this.textBottomLeft],
                [c_pageNumPosition.PAGE_NUM_POSITION_BOTTOM,  c_pageNumPosition.PAGE_NUM_POSITION_CENTER,    'icon-right-panel btn-colontitul-bc', 'headerfooter-button-bottom-center', this.textBottomCenter],
                [c_pageNumPosition.PAGE_NUM_POSITION_BOTTOM,  c_pageNumPosition.PAGE_NUM_POSITION_RIGHT,     'icon-right-panel btn-colontitul-br', 'headerfooter-button-bottom-right', this.textBottomRight]
            ];

            this._btnsPosition = [];
            _.each(_arrPosition, function(item, index, list){
                var _btn = new Common.UI.Button({
                    cls: 'btn-options huge bg-white',
                    iconCls: item[2],
                    posWhere:item[0],
                    posAlign:item[1],
                    hint: item[4]
                });
                _btn.render( $('#'+item[3])) ;
                _btn.on('click', _.bind(this.onBtnPositionClick, this));
                this._btnsPosition.push( _btn );
                this.lockedControls.push(_btn);
            }, this);

            this.numPosition = new Common.UI.MetricSpinner({
                el: $('#headerfooter-spin-position'),
                step: .1,
                width: 85,
                value: '1.25 cm',
                defaultUnit : "cm",
                maxValue: 55.88,
                minValue: 0
            });
            this.spinners.push(this.numPosition);
            this.lockedControls.push(this.numPosition);

            this.lblPosition = $(this.el).find('#headerfooter-label-position');

            this.chDiffFirst = new Common.UI.CheckBox({
                el: $('#headerfooter-check-diff-first'),
                labelText: this.textDiffFirst
            });
            this.lockedControls.push(this.chDiffFirst);

            this.chDiffOdd = new Common.UI.CheckBox({
                el: $('#headerfooter-check-diff-odd'),
                labelText: this.textDiffOdd
            });
            this.lockedControls.push(this.chDiffOdd);

            this.chSameAs = new Common.UI.CheckBox({
                el: $('#headerfooter-check-same-as'),
                labelText: this.textSameAs
            });

            this.numPosition.on('change', _.bind(this.onNumPositionChange, this));
            this.numPosition.on('inputleave', function(){ me.fireEvent('editcomplete', me);});
            this.chDiffFirst.on('change', _.bind(this.onDiffFirstChange, this));
            this.chDiffOdd.on('change', _.bind(this.onDiffOddChange, this));
            this.chSameAs.on('change', _.bind(this.onSameAsChange, this));

            this.btnInsertCurrent = new Common.UI.Button({
                el: $('#headerfooter-button-current')
            });
            this.lockedControls.push(this.btnInsertCurrent);
            this.btnInsertCurrent.on('click', _.bind(this.onInsertCurrentClick, this));

            this.radioPrev = new Common.UI.RadioBox({
                el: $('#headerfooter-radio-prev'),
                labelText: this.textPrev,
                name: 'asc-radio-header-numbering',
                checked: true
            }).on('change', _.bind(this.onRadioPrev, this));
            this.lockedControls.push(this.radioPrev);

            this.radioFrom = new Common.UI.RadioBox({
                el: $('#headerfooter-radio-from'),
                labelText: this.textFrom,
                name: 'asc-radio-header-numbering'
            }).on('change', _.bind(this.onRadioFrom, this));
            this.lockedControls.push(this.radioFrom);

            this.numFrom = new Common.UI.MetricSpinner({
                el: $('#headerfooter-spin-from'),
                step: 1,
                width: 85,
                value: '1',
                defaultUnit : "",
                maxValue: 2147483646,
                minValue: 0,
                allowDecimal: false
            });
            this.lockedControls.push(this.numFrom);
            this.numFrom.on('change', _.bind(this.onNumFromChange, this));
            this.numFrom.on('inputleave', function(){ me.fireEvent('editcomplete', me);});
        },
        
        createDelayedElements: function() {
            this.createDelayedControls();
            this.updateMetricUnit();
            this._initSettings = false;
        },

        setLocked: function (locked) {
            this._locked = locked;
        },

        disableControls: function(disable) {
            if (this._initSettings) return;
            
            if (this._state.DisabledControls!==disable) {
                this._state.DisabledControls = disable;
                _.each(this.lockedControls, function(item) {
                    item.setDisabled(disable);
                });
                this.chSameAs.setDisabled(disable || (this._state.SameAs===null));
            }
        },

        textHeaderFromTop:      'Header from Top',
        textHeaderFromBottom:   'Header from Bottom',
        textPosition:           'Position',
        textOptions:            'Options',
        textDiffFirst:          'Different first page',
        textDiffOdd:            'Different odd and even pages',
        textPageNum:            'Insert Page Number',
        textTopLeft:            'Top Left',
        textTopRight:           'Top Right',
        textTopCenter:          'Top Center',
        textBottomLeft:         'Bottom Left',
        textBottomRight:        'Bottom Right',
        textBottomCenter:       'Bottom Center',
        textSameAs:             'Link to Previous',
        textInsertCurrent: 'Insert to Current Position',
        textTopPage: 'Top of Page',
        textBottomPage: 'Bottom of Page',
        textPageNumbering: 'Page Numbering',
        textPrev: 'Continue from previous section',
        textFrom: 'Start at'
    }, DE.Views.HeaderFooterSettings || {}));
});