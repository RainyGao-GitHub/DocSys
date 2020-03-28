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
 *  SlideSettings.js
 *
 *  Created by Julia Radzhabova on 4/14/14
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!presentationeditor/main/app/template/SlideSettings.template',
    'jquery',
    'underscore',
    'backbone',
    'common/main/lib/component/ComboBox',
    'common/main/lib/component/MetricSpinner',
    'common/main/lib/component/ThemeColorPalette',
    'common/main/lib/component/ColorButton',
    'common/main/lib/component/ComboDataView',
    'common/main/lib/component/MultiSliderGradient',
    'common/main/lib/view/ImageFromUrlDialog'
], function (menuTemplate, $, _, Backbone) {
    'use strict';

    PE.Views.SlideSettings = Backbone.View.extend(_.extend({
        el: '#id-slide-settings',

        // Compile our stats template
        template: _.template(menuTemplate),

        // Delegated events for creating new items, and clearing completed ones.
        events: {
        },

        options: {
            alias: 'SlideSettings'
        },

        initialize: function () {
            this._initSettings = true;
            this._originalProps = null;
            this._noApply = true;
            this._sendUndoPoint = true;
            this._sliderChanged = false;
            this._texturearray = null;

            this.FillItems = [];

            this._stateDisabled = {
                background: true,
                effects: true,
                timing: true,
                header: true
            };

            this._state = {
                FillType:undefined,
                SlideColor: 'ffffff',
                BlipFillType: Asc.c_oAscFillBlipType.STRETCH,
                FGColor: '000000',
                BGColor: 'ffffff',
                GradColor: '000000',
                GradFillType: Asc.c_oAscFillGradType.GRAD_LINEAR
            };

            this.OriginalFillType = undefined;
            this.SlideColor = {Value: 1, Color: 'ffffff'};  // value=1 - цвет определен - прозрачный или другой, value=0 - цвет не определен, рисуем прозрачным
            this.BlipFillType = Asc.c_oAscFillBlipType.STRETCH;
            this.Effect = Asc.c_oAscSlideTransitionTypes.None;
            this.EffectType = undefined;
            this.GradFillType = Asc.c_oAscFillGradType.GRAD_LINEAR;
            this.GradColor = { values: [0, 100], colors: ['000000', 'ffffff'], currentIdx: 0};
            this.GradRadialDirectionIdx = 0;
            this.GradLinearDirectionType = 0;
            this.PatternFillType = 0;
            this.FGColor = {Value: 1, Color: '000000'};  // value=1 - цвет определен - прозрачный или другой, value=0 - цвет не определен, рисуем прозрачным
            this.BGColor = {Value: 1, Color: 'ffffff'};  // value=1 - цвет определен - прозрачный или другой, value=0 - цвет не определен, рисуем прозрачным

            this.textureNames = [this.txtCanvas, this.txtCarton, this.txtDarkFabric, this.txtGrain, this.txtGranite, this.txtGreyPaper,
                this.txtKnit, this.txtLeather, this.txtBrownPaper, this.txtPapyrus, this.txtWood];

            this.render();

            var me = this;
            this._arrFillSrc = [
                {displayValue: this.textColor,          value: Asc.c_oAscFill.FILL_TYPE_SOLID},
                {displayValue: this.textGradientFill,   value: Asc.c_oAscFill.FILL_TYPE_GRAD},
                {displayValue: this.textImageTexture,   value: Asc.c_oAscFill.FILL_TYPE_BLIP},
                {displayValue: this.textPatternFill,    value: Asc.c_oAscFill.FILL_TYPE_PATT},
                {displayValue: this.textNoFill,         value: Asc.c_oAscFill.FILL_TYPE_NOFILL}
            ];

            this.cmbFillSrc = new Common.UI.ComboBox({
                el: $('#slide-combo-fill-src'),
                cls: 'input-group-nr',
                style: 'width: 100%;',
                menuStyle: 'min-width: 100%;',
                editable: false,
                data: this._arrFillSrc,
                disabled: true
            });
            this.cmbFillSrc.setValue(Asc.c_oAscFill.FILL_TYPE_SOLID);
            this.cmbFillSrc.on('selected', _.bind(this.onFillSrcSelect, this));

            this.btnBackColor = new Common.UI.ColorButton({
                style: "width:45px;",
                disabled: true,
                menu        : new Common.UI.Menu({
                    items: [
                        { template: _.template('<div id="slide-back-color-menu" style="width: 169px; height: 220px; margin: 10px;"></div>') },
                        { template: _.template('<a id="slide-back-color-new" style="padding-left:12px;">' + this.textNewColor + '</a>') }
                    ]
                })
            });
            this.btnBackColor.render( $('#slide-back-color-btn'));
            this.btnBackColor.setColor('ffffff');
            this.FillItems.push(this.btnBackColor);

            this.FillColorContainer = $('#slide-panel-color-fill');
            this.FillImageContainer = $('#slide-panel-image-fill');
            this.FillPatternContainer = $('#slide-panel-pattern-fill');
            this.FillGradientContainer = $('#slide-panel-gradient-fill');

            this._arrEffectName = [
                {displayValue: this.textNone,    value: Asc.c_oAscSlideTransitionTypes.None},
                {displayValue: this.textFade,    value: Asc.c_oAscSlideTransitionTypes.Fade},
                {displayValue: this.textPush,    value: Asc.c_oAscSlideTransitionTypes.Push},
                {displayValue: this.textWipe,    value: Asc.c_oAscSlideTransitionTypes.Wipe},
                {displayValue: this.textSplit,   value: Asc.c_oAscSlideTransitionTypes.Split},
                {displayValue: this.textUnCover, value: Asc.c_oAscSlideTransitionTypes.UnCover},
                {displayValue: this.textCover,   value: Asc.c_oAscSlideTransitionTypes.Cover},
                {displayValue: this.textClock,   value: Asc.c_oAscSlideTransitionTypes.Clock},
                {displayValue: this.textZoom,    value: Asc.c_oAscSlideTransitionTypes.Zoom}
            ];

            this.cmbEffectName = new Common.UI.ComboBox({
                el: $('#slide-combo-effect-name'),
                cls: 'input-group-nr',
                style: 'width: 100%;',
                menuStyle: 'min-width: 100%;',
                editable: false,
                data: this._arrEffectName,
                disabled: true
            });
            this.cmbEffectName.setValue('');
            this.cmbEffectName.on('selected', _.bind(this.onEffectNameSelect, this));

            this._arrEffectType = [
                {displayValue: this.textSmoothly,           value: Asc.c_oAscSlideTransitionParams.Fade_Smoothly},
                {displayValue: this.textBlack,              value: Asc.c_oAscSlideTransitionParams.Fade_Through_Black},
                {displayValue: this.textLeft,               value: Asc.c_oAscSlideTransitionParams.Param_Left},
                {displayValue: this.textTop,                value: Asc.c_oAscSlideTransitionParams.Param_Top},
                {displayValue: this.textRight,              value: Asc.c_oAscSlideTransitionParams.Param_Right},
                {displayValue: this.textBottom,             value: Asc.c_oAscSlideTransitionParams.Param_Bottom},
                {displayValue: this.textTopLeft,            value: Asc.c_oAscSlideTransitionParams.Param_TopLeft},
                {displayValue: this.textTopRight,           value: Asc.c_oAscSlideTransitionParams.Param_TopRight},
                {displayValue: this.textBottomLeft,         value: Asc.c_oAscSlideTransitionParams.Param_BottomLeft},
                {displayValue: this.textBottomRight,        value: Asc.c_oAscSlideTransitionParams.Param_BottomRight},
                {displayValue: this.textVerticalIn,         value: Asc.c_oAscSlideTransitionParams.Split_VerticalIn},
                {displayValue: this.textVerticalOut,        value: Asc.c_oAscSlideTransitionParams.Split_VerticalOut},
                {displayValue: this.textHorizontalIn,       value: Asc.c_oAscSlideTransitionParams.Split_HorizontalIn},
                {displayValue: this.textHorizontalOut,      value: Asc.c_oAscSlideTransitionParams.Split_HorizontalOut},
                {displayValue: this.textClockwise,          value: Asc.c_oAscSlideTransitionParams.Clock_Clockwise},
                {displayValue: this.textCounterclockwise,   value: Asc.c_oAscSlideTransitionParams.Clock_Counterclockwise},
                {displayValue: this.textWedge,              value: Asc.c_oAscSlideTransitionParams.Clock_Wedge},
                {displayValue: this.textZoomIn,             value: Asc.c_oAscSlideTransitionParams.Zoom_In},
                {displayValue: this.textZoomOut,            value: Asc.c_oAscSlideTransitionParams.Zoom_Out},
                {displayValue: this.textZoomRotate,         value: Asc.c_oAscSlideTransitionParams.Zoom_AndRotate}
            ];

            this.cmbEffectType = new Common.UI.ComboBox({
                el: $('#slide-combo-effect-type'),
                cls: 'input-group-nr',
                style: 'width: 100%;',
                menuStyle: 'min-width: 100%;',
                editable: false,
                data: this._arrEffectType,
                disabled: true
            });
            this.cmbEffectType.setValue('');
            this.cmbEffectType.on('selected', _.bind(this.onEffectTypeSelect, this));

            this.numDuration = new Common.UI.MetricSpinner({
                el: $('#slide-spin-duration'),
                step: 1,
                width: 65,
                value: '',
                defaultUnit : this.textSec,
                maxValue: 300,
                minValue: 0,
                disabled: true
            });
            this.numDuration.on('change', _.bind(this.onDurationChange, this));
            this.numDuration.on('inputleave', function(){ me.fireEvent('editcomplete', me);});

            this.numDelay = new Common.UI.MetricSpinner({
                el: $('#slide-spin-delay'),
                step: 1,
                width: 70,
                value: '',
                defaultUnit : this.textSec,
                maxValue: 300,
                minValue: 0,
                disabled: true
            });
            this.numDelay.on('change', _.bind(this.onDelayChange, this));
            this.numDelay.on('inputleave', function(){ me.fireEvent('editcomplete', me);});

            this.chStartOnClick = new Common.UI.CheckBox({
                el: $('#slide-checkbox-start-click'),
                labelText: this.strStartOnClick,
                disabled: true
            });
            this.chStartOnClick.on('change', _.bind(this.onStartOnClickChange, this));

            this.chDelay = new Common.UI.CheckBox({
                el: $('#slide-checkbox-delay'),
                labelText: this.strDelay,
                disabled: true
            });
            this.chDelay.on('change', _.bind(this.onCheckDelayChange, this));

            this.btnPreview = new Common.UI.Button({
                el: $('#slide-button-preview'),
                disabled: true
            });
            this.btnPreview.on('click', _.bind(function(btn){
                if (this.api) this.api.SlideTransitionPlay();
                this.fireEvent('editcomplete', this);
            }, this));

            this.btnApplyToAll = new Common.UI.Button({
                el: $('#slide-button-apply-all'),
                disabled: true
            });
            this.btnApplyToAll.on('click', _.bind(function(btn){
                if (this.api) this.api.SlideTimingApplyToAll();
                this.fireEvent('editcomplete', this);
            }, this));

            this.chSlideNum = new Common.UI.CheckBox({
                el: $('#slide-checkbox-slidenum'),
                labelText: this.strSlideNum,
                disabled: true
            });
            this.chSlideNum.on('change', _.bind(this.onHeaderChange, this, 'slidenum'));

            this.chDateTime = new Common.UI.CheckBox({
                el: $('#slide-checkbox-datetime'),
                labelText: this.strDateTime,
                disabled: true
            });
            this.chDateTime.on('change', _.bind(this.onHeaderChange, this, 'datetime'));
        },

        render: function () {
            var el = $(this.el);
            el.html(this.template({
                scope: this
            }));
        },

        setApi: function(api) {
            this.api = api;
            if (this.api) {
                this.api.SetInterfaceDrawImagePlaceSlide('slide-texture-img');
                this.api.asc_registerCallback('asc_onInitStandartTextures', _.bind(this.onInitStandartTextures, this));
            }
            return this;
        },

        onFillSrcSelect: function(combo, record) {
            this.ShowHideElem(record.value);
            switch (record.value){
                case Asc.c_oAscFill.FILL_TYPE_SOLID:
                    this._state.FillType = Asc.c_oAscFill.FILL_TYPE_SOLID;
                    if (!this._noApply) {
                        var props = new Asc.CAscSlideProps();
                        var fill = new Asc.asc_CShapeFill();
                        fill.put_type(Asc.c_oAscFill.FILL_TYPE_SOLID);
                        fill.put_fill( new Asc.asc_CFillSolid());
                        fill.get_fill().put_color(Common.Utils.ThemeColor.getRgbColor((this.SlideColor.Color=='transparent') ? {color: '4f81bd', effectId: 24} : this.SlideColor.Color));
                        props.put_background(fill);
                        this.api.SetSlideProps(props);
                    }
                    break;
                case Asc.c_oAscFill.FILL_TYPE_GRAD:
                    this._state.FillType = Asc.c_oAscFill.FILL_TYPE_GRAD;
                    if (!this._noApply) {
                        var props = new Asc.CAscSlideProps();
                        var fill = new Asc.asc_CShapeFill();
                        fill.put_type(Asc.c_oAscFill.FILL_TYPE_GRAD);
                        fill.put_fill( new Asc.asc_CFillGrad());
                        fill.get_fill().put_grad_type(this.GradFillType);
                        if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) {
                            fill.get_fill().put_linear_angle(this.GradLinearDirectionType * 60000);
                            fill.get_fill().put_linear_scale(true);
                        }
                        if (this.OriginalFillType !== Asc.c_oAscFill.FILL_TYPE_GRAD) {
                            this.GradColor.values = [0, 100];
                            this.GradColor.colors = [this.GradColor.colors[0], this.GradColor.colors[this.GradColor.colors.length - 1]];
                            this.GradColor.currentIdx = 0;
                            var HexColor0 = Common.Utils.ThemeColor.getRgbColor(this.GradColor.colors[0]).get_color().get_hex(),
                                HexColor1 = Common.Utils.ThemeColor.getRgbColor(this.GradColor.colors[1]).get_color().get_hex();

                            if (HexColor0 === 'ffffff' && HexColor1 === 'ffffff') {
                                HexColor0 = {color: '4f81bd', effectId: 24};    // color accent1
                            } else {
                                HexColor0 = this.GradColor.colors[0];
                            }

                            fill.get_fill().put_positions([this.GradColor.values[0]*1000, this.GradColor.values[1]*1000]);
                            fill.get_fill().put_colors([Common.Utils.ThemeColor.getRgbColor(HexColor0), Common.Utils.ThemeColor.getRgbColor(this.GradColor.colors[1])]);
                        }
                        props.put_background(fill);
                        this.api.SetSlideProps(props);
                    }
                    break;
                case Asc.c_oAscFill.FILL_TYPE_BLIP:
                    this._state.FillType = Asc.c_oAscFill.FILL_TYPE_BLIP;
                    break;
                case Asc.c_oAscFill.FILL_TYPE_PATT:
                    this._state.FillType = Asc.c_oAscFill.FILL_TYPE_PATT;
                    if (!this._noApply) {
                        var props = new Asc.CAscSlideProps();
                        var fill = new Asc.asc_CShapeFill();
                        fill.put_type(Asc.c_oAscFill.FILL_TYPE_PATT);
                        fill.put_fill( new Asc.asc_CFillHatch());
                        fill.get_fill().put_pattern_type(this.PatternFillType);

                        var fHexColor = Common.Utils.ThemeColor.getRgbColor(this.FGColor.Color).get_color().get_hex();
                        var bHexColor = Common.Utils.ThemeColor.getRgbColor(this.BGColor.Color).get_color().get_hex();

                        if (bHexColor === 'ffffff' && fHexColor === 'ffffff') {
                            fHexColor = {color: '4f81bd', effectId: 24};    // color accent1
                        } else {
                            fHexColor = this.FGColor.Color;
                        }

                        fill.get_fill().put_color_fg(Common.Utils.ThemeColor.getRgbColor(fHexColor));
                        fill.get_fill().put_color_bg(Common.Utils.ThemeColor.getRgbColor(this.BGColor.Color));
                        props.put_background(fill);
                        this.api.SetSlideProps(props);
                    }
                    break;
                case Asc.c_oAscFill.FILL_TYPE_NOFILL:
                    this._state.FillType = Asc.c_oAscFill.FILL_TYPE_NOFILL;
                    if (!this._noApply) {
                        var props = new Asc.CAscSlideProps();
                        var fill = new Asc.asc_CShapeFill();
                        fill.put_type(Asc.c_oAscFill.FILL_TYPE_NOFILL);
                        fill.put_fill(null);
                        props.put_background(fill);
                        this.api.SetSlideProps(props);
                    }
                    break;
            }
            this.fireEvent('editcomplete', this);
        },

        onColorsBackSelect: function(picker, color) {
            this.btnBackColor.setColor(color);
            this.SlideColor = {Value: 1, Color: color};

            if (this.api && !this._noApply) {
                var props = new Asc.CAscSlideProps();
                var fill = new Asc.asc_CShapeFill();

                if (this.SlideColor.Color=='transparent') {
                    fill.put_type(Asc.c_oAscFill.FILL_TYPE_NOFILL);
                    fill.put_fill(null);
                } else {
                    fill.put_type(Asc.c_oAscFill.FILL_TYPE_SOLID);
                    fill.put_fill( new Asc.asc_CFillSolid());
                    fill.get_fill().put_color(Common.Utils.ThemeColor.getRgbColor(this.SlideColor.Color));
                }

                props.put_background(fill);
                this.api.SetSlideProps(props);
            }
            this.fireEvent('editcomplete', this);
        },

        addNewColor: function(picker, btn) {
            picker.addNewColor((typeof(btn.color) == 'object') ? btn.color.color : btn.color);
        },

        onPatternSelect: function(combo, record){
            if (this.api && !this._noApply) {
                this.PatternFillType = record.get('type');
                var props = new Asc.CAscSlideProps();
                var fill = new Asc.asc_CShapeFill();
                fill.put_type(Asc.c_oAscFill.FILL_TYPE_PATT);
                fill.put_fill( new Asc.asc_CFillHatch());
                fill.get_fill().put_pattern_type(this.PatternFillType);
                if (this.OriginalFillType !== Asc.c_oAscFill.FILL_TYPE_PATT) {
                    fill.get_fill().put_color_fg(Common.Utils.ThemeColor.getRgbColor(this.FGColor.Color));
                    fill.get_fill().put_color_bg(Common.Utils.ThemeColor.getRgbColor(this.BGColor.Color));
                }
                props.put_background(fill);
                this.api.SetSlideProps(props);
            }
            this.fireEvent('editcomplete', this);
        },

        onColorsFGSelect: function(picker, color) {
            this.btnFGColor.setColor(color);
            this.FGColor = {Value: 1, Color: color};
            if (this.api && !this._noApply) {
                var props = new Asc.CAscSlideProps();
                var fill = new Asc.asc_CShapeFill();
                fill.put_type(Asc.c_oAscFill.FILL_TYPE_PATT);
                fill.put_fill( new Asc.asc_CFillHatch());
                fill.get_fill().put_color_fg(Common.Utils.ThemeColor.getRgbColor(this.FGColor.Color));
                if (this.OriginalFillType !== Asc.c_oAscFill.FILL_TYPE_PATT) {
                    fill.get_fill().put_pattern_type(this.PatternFillType);
                    fill.get_fill().put_color_bg(Common.Utils.ThemeColor.getRgbColor(this.BGColor.Color));
                }
                props.put_background(fill);
                this.api.SetSlideProps(props);
            }
            this.fireEvent('editcomplete', this);
        },

        onColorsBGSelect: function(picker, color) {
            this.btnBGColor.setColor(color);
            this.BGColor = {Value: 1, Color: color};
            if (this.api && !this._noApply) {
                var props = new Asc.CAscSlideProps();
                var fill = new Asc.asc_CShapeFill();
                fill.put_type(Asc.c_oAscFill.FILL_TYPE_PATT);
                fill.put_fill( new Asc.asc_CFillHatch());
                if (this.OriginalFillType !== Asc.c_oAscFill.FILL_TYPE_PATT) {
                    fill.get_fill().put_pattern_type(this.PatternFillType);
                    fill.get_fill().put_color_fg(Common.Utils.ThemeColor.getRgbColor(this.FGColor.Color));
                }
                fill.get_fill().put_color_bg(Common.Utils.ThemeColor.getRgbColor(this.BGColor.Color));
                props.put_background(fill);
                this.api.SetSlideProps(props);
            }
            this.fireEvent('editcomplete', this);
        },

        onFillTypeSelect: function(combo, record) {
            this.BlipFillType = record.value;

            if (this.api && this._fromTextureCmb !== true && this.OriginalFillType == Asc.c_oAscFill.FILL_TYPE_BLIP) {
                var props = new Asc.CAscSlideProps();
                var fill = new Asc.asc_CShapeFill();
                fill.put_type(Asc.c_oAscFill.FILL_TYPE_BLIP);
                fill.put_fill( new Asc.asc_CFillBlip());

                fill.get_fill().put_type(this.BlipFillType);

                props.put_background(fill);
                this.api.SetSlideProps(props);
            }
            this.fireEvent('editcomplete', this);
        },

        onGradTypeSelect: function(combo, record){
            this.GradFillType = record.value;

            if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) {
                this.mnuDirectionPicker.store.reset(this._viewDataLinear);
                this.mnuDirectionPicker.cmpEl.width(175);
                this.mnuDirectionPicker.restoreHeight = 174;
                var record = this.mnuDirectionPicker.store.findWhere({type: this.GradLinearDirectionType});
                this.mnuDirectionPicker.selectRecord(record, true);
                if (record)
                    this.btnDirection.setIconCls('item-gradient ' + record.get('iconcls'));
                else
                    this.btnDirection.setIconCls('');
            } else if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_PATH) {
                this.mnuDirectionPicker.store.reset(this._viewDataRadial);
                this.mnuDirectionPicker.cmpEl.width(60);
                this.mnuDirectionPicker.restoreHeight = 58;
                this.mnuDirectionPicker.selectByIndex(this.GradRadialDirectionIdx, true);
                if (this.GradRadialDirectionIdx>=0)
                    this.btnDirection.setIconCls('item-gradient ' + this._viewDataRadial[this.GradRadialDirectionIdx].iconcls);
                else
                    this.btnDirection.setIconCls('');
            }

            if (this.api && !this._noApply) {
                var props = new Asc.CAscSlideProps();
                var fill = new Asc.asc_CShapeFill();
                fill.put_type(Asc.c_oAscFill.FILL_TYPE_GRAD);
                fill.put_fill( new Asc.asc_CFillGrad());
                fill.get_fill().put_grad_type(this.GradFillType);
                if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) {
                    fill.get_fill().put_linear_angle(this.GradLinearDirectionType * 60000);
                    fill.get_fill().put_linear_scale(true);
                }
                props.put_background(fill);
                this.api.SetSlideProps(props);
            }

            this.fireEvent('editcomplete', this);
        },

        onSelectGradient: function(btn, picker, itemView, record) {
            if (this._noApply) return;

            var rawData = {},
                isPickerSelect = _.isFunction(record.toJSON);

            if (isPickerSelect){
                if (record.get('selected')) {
                    rawData = record.toJSON();
                } else {
                    // record deselected
                    return;
                }
            } else {
                rawData = record;
            }

            this.btnDirection.setIconCls('item-gradient ' + rawData.iconcls);
            (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) ? this.GradLinearDirectionType = rawData.type : this.GradRadialDirectionIdx = 0;
            if (this.api) {
                if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) {
                    var props = new Asc.CAscSlideProps();
                    var fill = new Asc.asc_CShapeFill();
                    fill.put_type(Asc.c_oAscFill.FILL_TYPE_GRAD);
                    fill.put_fill( new Asc.asc_CFillGrad());
                    fill.get_fill().put_grad_type(this.GradFillType);
                    fill.get_fill().put_linear_angle(rawData.type * 60000);
                    fill.get_fill().put_linear_scale(true);

                    props.put_background(fill);
                    this.api.SetSlideProps(props);
                }
            }

            this.fireEvent('editcomplete', this);
        },

        onColorsGradientSelect: function(picker, color) {
            this.btnGradColor.setColor(color);
            this.GradColor.colors[this.GradColor.currentIdx] = color;
            this.sldrGradient.setColorValue(Common.Utils.String.format('#{0}', (typeof(color) == 'object') ? color.color : color));

            if (this.api && !this._noApply) {
                var props = new Asc.CAscSlideProps();
                var fill = new Asc.asc_CShapeFill();
                fill.put_type(Asc.c_oAscFill.FILL_TYPE_GRAD);
                fill.put_fill( new Asc.asc_CFillGrad());
                fill.get_fill().put_grad_type(this.GradFillType);
                var arr = [];
                this.GradColor.colors.forEach(function(item){
                    arr.push(Common.Utils.ThemeColor.getRgbColor(item));
                });
                fill.get_fill().put_colors(arr);

                if (this.OriginalFillType !== Asc.c_oAscFill.FILL_TYPE_GRAD) {
                    if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) {
                        fill.get_fill().put_linear_angle(this.GradLinearDirectionType * 60000);
                        fill.get_fill().put_linear_scale(true);
                    }
                    arr = [];
                    this.GradColor.values.forEach(function(item){
                        arr.push(item*1000);
                    });
                    fill.get_fill().put_positions(arr);
                }
                props.put_background(fill);
                this.api.SetSlideProps(props);
            }
            this.fireEvent('editcomplete', this);
        },

        onGradientChange: function(slider, newValue, oldValue){
            this.GradColor.values = slider.getValues();
            this._sliderChanged = true;
            if (this.api && !this._noApply) {
                if (this._sendUndoPoint)  {
                    this.api.setStartPointHistory();
                    this._sendUndoPoint = false;
                    this.updateslider = setInterval(_.bind(this._gradientApplyFunc, this), 100);
                }
            }
        },

        onGradientChangeComplete: function(slider, newValue, oldValue){
            clearInterval(this.updateslider);
            this._sliderChanged = true;
            if (!this._sendUndoPoint) { // start point was added
                this.api.setEndPointHistory();
                this._gradientApplyFunc();
            }
            this._sendUndoPoint = true;
        },

        _gradientApplyFunc: function() {
            if (this._sliderChanged) {
                var props = new Asc.CAscSlideProps();
                var fill = new Asc.asc_CShapeFill();
                fill.put_type(Asc.c_oAscFill.FILL_TYPE_GRAD);
                fill.put_fill( new Asc.asc_CFillGrad());
                fill.get_fill().put_grad_type(this.GradFillType);
                var arr = [];
                this.GradColor.values.forEach(function(item){
                    arr.push(item*1000);
                });
                fill.get_fill().put_positions(arr);

                if (this.OriginalFillType !== Asc.c_oAscFill.FILL_TYPE_GRAD) {
                    if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR) {
                        fill.get_fill().put_linear_angle(this.GradLinearDirectionType * 60000);
                        fill.get_fill().put_linear_scale(true);
                    }
                    arr = [];
                    this.GradColor.colors.forEach(function(item){
                        arr.push(Common.Utils.ThemeColor.getRgbColor(item));
                    });
                    fill.get_fill().put_colors(arr);
                }
                props.put_background(fill);
                this.api.SetSlideProps(props);
                this._sliderChanged = false;
            }
        },

        insertFromUrl: function() {
            var me = this;
            (new Common.Views.ImageFromUrlDialog({
                handler: function(result, value) {
                    if (result == 'ok') {
                        if (me.api) {
                            var checkUrl = value.replace(/ /g, '');
                            if (!_.isEmpty(checkUrl)) {
                                if (me.BlipFillType !== null) {
                                    var props = new Asc.CAscSlideProps();
                                    var fill = new Asc.asc_CShapeFill();
                                    fill.put_type(Asc.c_oAscFill.FILL_TYPE_BLIP);
                                    fill.put_fill( new Asc.asc_CFillBlip());
                                    fill.get_fill().put_type(me.BlipFillType);
                                    fill.get_fill().put_url(checkUrl);

                                    props.put_background(fill);
                                    me.api.SetSlideProps(props);
                                }
                            }
                        }
                    }
                    me.fireEvent('editcomplete', me);
                }
            })).show();
        },

        createDelayedControls: function() {
            var me = this;

            this.cmbPattern = new Common.UI.ComboDataView({
                itemWidth: 28,
                itemHeight: 28,
                menuMaxHeight: 300,
                enableKeyEvents: true,
                cls: 'combo-pattern'
            });
            this.cmbPattern.menuPicker.itemTemplate = this.cmbPattern.fieldPicker.itemTemplate = _.template([
                '<div class="style" id="<%= id %>">',
                '<img src="data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" class="combo-pattern-item" ',
                'width="' + this.cmbPattern.itemWidth + '" height="' + this.cmbPattern.itemHeight + '" ',
                'style="background-position: -<%= offsetx %>px -<%= offsety %>px;"/>',
                '</div>'
            ].join(''));
            this.cmbPattern.render($('#slide-combo-pattern'));
            this.cmbPattern.openButton.menu.cmpEl.css({
                'min-width': 178,
                'max-width': 178
            });
            this.cmbPattern.on('click', _.bind(this.onPatternSelect, this));
            this.FillItems.push(this.cmbPattern);

            this.btnInsertFromFile = new Common.UI.Button({
                el: $('#slide-button-from-file')
            });
            this.btnInsertFromFile.on('click', _.bind(function(btn){
                if (this.api) this.api.ChangeSlideImageFromFile(this.BlipFillType);
                this.fireEvent('editcomplete', this);
            }, this));
            this.FillItems.push(this.btnInsertFromFile);

            this.btnInsertFromUrl = new Common.UI.Button({
                el: $('#slide-button-from-url')
            });
            this.btnInsertFromUrl.on('click', _.bind(this.insertFromUrl, this));
            this.FillItems.push(this.btnInsertFromUrl);

            this._arrFillType = [
                {displayValue: this.textStretch, value: Asc.c_oAscFillBlipType.STRETCH},
                {displayValue: this.textTile,    value: Asc.c_oAscFillBlipType.TILE}
            ];

            this.cmbFillType = new Common.UI.ComboBox({
                el: $('#slide-combo-fill-type'),
                cls: 'input-group-nr',
                menuStyle: 'min-width: 90px;',
                editable: false,
                data: this._arrFillType
            });
            this.cmbFillType.setValue(this._arrFillType[0].value);
            this.cmbFillType.on('selected', _.bind(this.onFillTypeSelect, this));
            this.FillItems.push(this.cmbFillType);

            this._arrGradType = [
                {displayValue: this.textLinear, value: Asc.c_oAscFillGradType.GRAD_LINEAR},
                {displayValue: this.textRadial, value: Asc.c_oAscFillGradType.GRAD_PATH}
            ];

            this.cmbGradType = new Common.UI.ComboBox({
                el: $('#slide-combo-grad-type'),
                cls: 'input-group-nr',
                menuStyle: 'min-width: 90px;',
                editable: false,
                data: this._arrGradType
            });
            this.cmbGradType.setValue(this._arrGradType[0].value);
            this.cmbGradType.on('selected', _.bind(this.onGradTypeSelect, this));
            this.FillItems.push(this.cmbGradType);

            this._viewDataLinear = [
                { offsetx: 0,   offsety: 0,   type:45,  subtype:-1, iconcls:'gradient-left-top' },
                { offsetx: 50,  offsety: 0,   type:90,  subtype:4,  iconcls:'gradient-top'},
                { offsetx: 100, offsety: 0,   type:135, subtype:5,  iconcls:'gradient-right-top'},
                { offsetx: 0,   offsety: 50,  type:0,   subtype:6,  iconcls:'gradient-left', cls: 'item-gradient-separator', selected: true},
                { offsetx: 100, offsety: 50,  type:180, subtype:1,  iconcls:'gradient-right'},
                { offsetx: 0,   offsety: 100, type:315, subtype:2,  iconcls:'gradient-left-bottom'},
                { offsetx: 50,  offsety: 100, type:270, subtype:3,  iconcls:'gradient-bottom'},
                { offsetx: 100, offsety: 100, type:225, subtype:7,  iconcls:'gradient-right-bottom'}
            ];

            this._viewDataRadial = [
                { offsetx: 100, offsety: 150, type:2, subtype:5, iconcls:'gradient-radial-center'}
            ];

            this.btnDirection = new Common.UI.Button({
                cls         : 'btn-large-dataview',
                iconCls     : 'item-gradient gradient-left',
                menu        : new Common.UI.Menu({
                    style: 'min-width: 60px;',
                    menuAlign: 'tr-br',
                    items: [
                        { template: _.template('<div id="id-slide-menu-direction" style="width: 175px; margin: 0 5px;"></div>') }
                    ]
                })
            });
            this.btnDirection.on('render:after', function(btn) {
                me.mnuDirectionPicker = new Common.UI.DataView({
                    el: $('#id-slide-menu-direction'),
                    parentMenu: btn.menu,
                    restoreHeight: 174,
                    store: new Common.UI.DataViewStore(me._viewDataLinear),
                    itemTemplate: _.template('<div id="<%= id %>" class="item-gradient" style="background-position: -<%= offsetx %>px -<%= offsety %>px;"></div>')
                });
            });
            this.btnDirection.render($('#slide-button-direction'));
            this.mnuDirectionPicker.on('item:click', _.bind(this.onSelectGradient, this, this.btnDirection));
            this.FillItems.push(this.btnDirection);

            this.sldrGradient = new Common.UI.MultiSliderGradient({
                el: $('#slide-slider-gradient'),
                width: 125,
                minValue: 0,
                maxValue: 100,
                values: [0, 100]
            });
            this.sldrGradient.on('change', _.bind(this.onGradientChange, this));
            this.sldrGradient.on('changecomplete', _.bind(this.onGradientChangeComplete, this));
            this.sldrGradient.on('thumbclick', function(cmp, index){
                me.GradColor.currentIdx = index;
                var color = me.GradColor.colors[me.GradColor.currentIdx];
                me.btnGradColor.setColor(color);
                me.colorsGrad.select(color,false);
            });
            this.sldrGradient.on('thumbdblclick', function(cmp){
                me.btnGradColor.cmpEl.find('button').dropdown('toggle');
            });
            this.sldrGradient.on('sortthumbs', function(cmp, recalc_indexes){
                var colors = [],
                    currentIdx;
                _.each (recalc_indexes, function(recalc_index, index) {
                    colors.push(me.GradColor.colors[recalc_index]);
                    if (me.GradColor.currentIdx == recalc_index)
                        currentIdx = index;
                });
                me.OriginalFillType = null;
                me.GradColor.colors = colors;
                me.GradColor.currentIdx = currentIdx;
            });
            this.sldrGradient.on('addthumb', function(cmp, index, nearIndex, color){
                me.GradColor.colors[index] = me.GradColor.colors[nearIndex];
                me.GradColor.currentIdx = index;
                me.sldrGradient.addNewThumb(index, color);
            });
            this.sldrGradient.on('removethumb', function(cmp, index){
                me.sldrGradient.removeThumb(index);
                me.GradColor.values.splice(index, 1);
                me.sldrGradient.changeGradientStyle();
            });
            this.FillItems.push(this.sldrGradient);

        },
        
        createDelayedElements: function() {
            this._initSettings = false;
            this.createDelayedControls();
            
            var global_hatch_menu_map = [
                0,1,3,2,4,
                53,5,6,7,8,
                9,10,11,12,13,
                14,15,16,17,18,
                19,20,22,23,24,
                25,27,28,29,30,
                31,32,33,34,35,
                36,37,38,39,40,
                41,42,43,44,45,
                46,49,50,51,52
            ];

            this.patternViewData = [];
            for (var i=0; i<13; i++) {
                for (var j=0; j<4; j++) {
                    var num = i*4+j;
                    this.patternViewData[num] = {offsetx: j*28, offsety: i*28, type: global_hatch_menu_map[num]};
                }
            }
            this.patternViewData.splice(this.patternViewData.length-2, 2);

            for ( var i=0; i<this.patternViewData.length; i++ ) {
                this.patternViewData[i].id = Common.UI.getId();
            }
            this.cmbPattern.menuPicker.store.add(this.patternViewData);
            if (this.cmbPattern.menuPicker.store.length > 0) {
                this.cmbPattern.fillComboView(this.cmbPattern.menuPicker.store.at(0),true);
                this.PatternFillType = this.patternViewData[0].type;
            }

            this.onInitStandartTextures();
            this.UpdateThemeColors();
        },

        onInitStandartTextures: function(texture) {
            var me = this;
            if (texture && texture.length>0){
                me._texturearray = [];
                _.each(texture, function(item){
                    me._texturearray.push({
                        imageUrl: item.get_image(),
                        name   : me.textureNames[item.get_id()],
                        type    : item.get_id(),
//                        allowSelected : false,
                        selected: false
                    });
                });
            }

            if (!me._texturearray || me._texturearray.length<1) return;
            if (!this._initSettings && !this.btnTexture) {
                this.btnTexture = new Common.UI.ComboBox({
                    el: $('#slide-combo-fill-texture'),
                    template: _.template([
                        '<div class="input-group combobox combo-dataview-menu input-group-nr dropdown-toggle" tabindex="0" data-toggle="dropdown">',
                        '<div class="form-control text" style="width: 90px;">' + this.textSelectTexture + '</div>',
                        '<div style="display: table-cell;"></div>',
                        '<button type="button" class="btn btn-default"><span class="caret img-commonctrl"></span></button>',
                        '</div>'
                    ].join(''))
                });
                this.textureMenu = new Common.UI.Menu({
                    items: [
                        { template: _.template('<div id="id-slide-menu-texture" style="width: 233px; margin: 0 5px;"></div>') }
                    ]
                });
                this.textureMenu.render($('#slide-combo-fill-texture'));
                this.FillItems.push(this.btnTexture);

                var onShowBefore = function(menu) {
                    var mnuTexturePicker = new Common.UI.DataView({
                        el: $('#id-slide-menu-texture'),
                        restoreHeight: 174,
                        parentMenu: menu,
                        showLast: false,
                        store: new Common.UI.DataViewStore(me._texturearray || []),
                        itemTemplate: _.template('<div class="item-texture"><img src="<%= imageUrl %>" id="<%= id %>"></div>')
                    });
                    mnuTexturePicker.on('item:click', _.bind(me.onSelectTexture, me));
                    menu.off('show:before', onShowBefore);
                };
                this.textureMenu.on('show:before', onShowBefore);
            }
        },

        onSelectTexture: function(picker, view, record){
            this._fromTextureCmb = true;
            this.cmbFillType.setValue(this._arrFillType[1].value);
            this._fromTextureCmb = false;

            if (this.api) {
                var props = new Asc.CAscSlideProps();
                var fill = new Asc.asc_CShapeFill();
                fill.put_type(Asc.c_oAscFill.FILL_TYPE_BLIP);
                fill.put_fill( new Asc.asc_CFillBlip());
                fill.get_fill().put_type(Asc.c_oAscFillBlipType.TILE);
                fill.get_fill().put_texture_id(record.get('type'));
                props.put_background(fill);
                this.api.SetSlideProps(props);
            }
            $(this.btnTexture.el).find('.form-control').prop('innerHTML', record.get('name'));
            this.fireEvent('editcomplete', this);
        },

        fillEffectTypeCombo: function (type) {
            var arr = [];
            switch (type) {
                case Asc.c_oAscSlideTransitionTypes.Fade:
                    arr.push(this._arrEffectType[0], this._arrEffectType[1]);
                    break;
                case Asc.c_oAscSlideTransitionTypes.Push:
                    arr = this._arrEffectType.slice(2, 6);
                    break;
                case Asc.c_oAscSlideTransitionTypes.Wipe:
                    arr = this._arrEffectType.slice(2, 10);
                    break;
                case Asc.c_oAscSlideTransitionTypes.Split:
                    arr = this._arrEffectType.slice(10, 14);
                    break;
                case Asc.c_oAscSlideTransitionTypes.UnCover:
                    arr = this._arrEffectType.slice(2, 10);
                    break;
                case Asc.c_oAscSlideTransitionTypes.Cover:
                    arr = this._arrEffectType.slice(2, 10);
                    break;
                case Asc.c_oAscSlideTransitionTypes.Clock:
                    arr = this._arrEffectType.slice(14, 17);
                    break;
                case Asc.c_oAscSlideTransitionTypes.Zoom:
                    arr = this._arrEffectType.slice(17);
                    break;
            }
            if (arr.length>0) {
                this.cmbEffectType.store.reset(arr);
                this.cmbEffectType.setValue(arr[0].value);
                this.EffectType = arr[0].value;
            } else {
                this.cmbEffectType.store.reset();
                this.EffectType = undefined;
            }

            this.cmbEffectType.setDisabled(arr.length<1 || this._stateDisabled.effects);
            this.numDuration.setDisabled(arr.length<1 || this._stateDisabled.effects);
            this.btnPreview.setDisabled(arr.length<1 || this._stateDisabled.effects);
        },

        onEffectNameSelect: function(combo, record) {
            var type = record.value;
            if (this.Effect !== type &&
                !((this.Effect===Asc.c_oAscSlideTransitionTypes.Wipe || this.Effect===Asc.c_oAscSlideTransitionTypes.UnCover || this.Effect===Asc.c_oAscSlideTransitionTypes.Cover)&&
                    (type===Asc.c_oAscSlideTransitionTypes.Wipe || type===Asc.c_oAscSlideTransitionTypes.UnCover || type===Asc.c_oAscSlideTransitionTypes.Cover))  )
                this.fillEffectTypeCombo(type);
            this.Effect = type;
            if (this.api && !this._noApply) {
                var props = new Asc.CAscSlideProps();
                var timing = new Asc.CAscSlideTiming();
                timing.put_TransitionType(type);
                timing.put_TransitionOption(this.EffectType);
                props.put_timing(timing);
                this.api.SetSlideProps(props);
            }
            this.fireEvent('editcomplete', this);
        },

        onEffectTypeSelect: function(combo, record) {
            this.EffectType = record.value;
            if (this.api && !this._noApply) {
                var props = new Asc.CAscSlideProps();
                var timing = new Asc.CAscSlideTiming();
                timing.put_TransitionType(this.Effect);
                timing.put_TransitionOption(this.EffectType);
                props.put_timing(timing);
                this.api.SetSlideProps(props);
            }
            this.fireEvent('editcomplete', this);
        },

        onDurationChange: function(field, newValue, oldValue, eOpts){
            if (this.api && !this._noApply)   {
                var props = new Asc.CAscSlideProps();
                var timing = new Asc.CAscSlideTiming();
                timing.put_TransitionDuration(field.getNumberValue()*1000);
                props.put_timing(timing);
                this.api.SetSlideProps(props);
            }
        },

        onDelayChange: function(field, newValue, oldValue, eOpts){
            if (this.api && !this._noApply)   {
                var props = new Asc.CAscSlideProps();
                var timing = new Asc.CAscSlideTiming();
                timing.put_SlideAdvanceDuration(field.getNumberValue()*1000);
                props.put_timing(timing);
                this.api.SetSlideProps(props);
            }
        },

        onStartOnClickChange: function(field, newValue, oldValue, eOpts){
            if (this.api && !this._noApply)   {
                var props = new Asc.CAscSlideProps();
                var timing = new Asc.CAscSlideTiming();
                timing.put_SlideAdvanceOnMouseClick(field.getValue()=='checked');
                props.put_timing(timing);
                this.api.SetSlideProps(props);
            }
            this.fireEvent('editcomplete', this);
        },

        onCheckDelayChange: function(field, newValue, oldValue, eOpts){
            this.numDelay.setDisabled(field.getValue()!=='checked');
            if (this.api && !this._noApply)   {
                var props = new Asc.CAscSlideProps();
                var timing = new Asc.CAscSlideTiming();
                timing.put_SlideAdvanceAfter(field.getValue()=='checked');
                props.put_timing(timing);
                this.api.SetSlideProps(props);
            }
            this.fireEvent('editcomplete', this);
        },

        onHeaderChange: function(type, field, newValue, oldValue, eOpts){
            if (this.api && !this._noApply)   {
                var props = this.api.asc_getHeaderFooterProperties();
                props.get_Slide()[(type=='slidenum') ? 'put_ShowSlideNum' : 'put_ShowDateTime'](field.getValue()=='checked');
                this.api.asc_setHeaderFooterProperties(props);
            }
            this.fireEvent('editcomplete', this);
        },

        UpdateThemeColors: function() {
            if (this._initSettings) return;
            if (!this.colorsBack) {
                this.colorsBack = new Common.UI.ThemeColorPalette({
                    el: $('#slide-back-color-menu'),
                    value: 'ffffff',
                    transparent: true
                });
                this.colorsBack.on('select', _.bind(this.onColorsBackSelect, this));
                this.btnBackColor.menu.items[1].on('click',  _.bind(this.addNewColor, this, this.colorsBack, this.btnBackColor));

                this.btnFGColor = new Common.UI.ColorButton({
                    style: "width:45px;",
                    menu        : new Common.UI.Menu({
                        items: [
                            { template: _.template('<div id="slide-foreground-color-menu" style="width: 169px; height: 220px; margin: 10px;"></div>') },
                            { template: _.template('<a id="slide-foreground-color-new" style="padding-left:12px;">' + this.textNewColor + '</a>') }
                        ]
                    })
                });
                this.btnFGColor.render( $('#slide-foreground-color-btn'));
                this.btnFGColor.setColor('000000');
                this.FillItems.push(this.btnFGColor);
                this.colorsFG = new Common.UI.ThemeColorPalette({
                    el: $('#slide-foreground-color-menu'),
                    value: '000000'
                });
                this.colorsFG.on('select', _.bind(this.onColorsFGSelect, this));
                this.btnFGColor.menu.items[1].on('click',  _.bind(this.addNewColor, this, this.colorsFG, this.btnFGColor));

                this.btnBGColor = new Common.UI.ColorButton({
                    style: "width:45px;",
                    menu        : new Common.UI.Menu({
                        items: [
                            { template: _.template('<div id="slide-background-color-menu" style="width: 169px; height: 220px; margin: 10px;"></div>') },
                            { template: _.template('<a id="slide-background-color-new" style="padding-left:12px;">' + this.textNewColor + '</a>') }
                        ]
                    })
                });
                this.btnBGColor.render( $('#slide-background-color-btn'));
                this.btnBGColor.setColor('ffffff');
                this.FillItems.push(this.btnBGColor);
                this.colorsBG = new Common.UI.ThemeColorPalette({
                    el: $('#slide-background-color-menu'),
                    value: 'ffffff'
                });
                this.colorsBG.on('select', _.bind(this.onColorsBGSelect, this));
                this.btnBGColor.menu.items[1].on('click',  _.bind(this.addNewColor, this, this.colorsBG, this.btnBGColor));

                this.btnGradColor = new Common.UI.ColorButton({
                    style: "width:45px;",
                    menu        : new Common.UI.Menu({
                        items: [
                            { template: _.template('<div id="slide-gradient-color-menu" style="width: 169px; height: 220px; margin: 10px;"></div>') },
                            { template: _.template('<a id="slide-gradient-color-new" style="padding-left:12px;">' + this.textNewColor + '</a>') }
                        ]
                    })
                });
                this.btnGradColor.render( $('#slide-gradient-color-btn'));
                this.btnGradColor.setColor('000000');
                this.FillItems.push(this.btnGradColor);
                this.colorsGrad = new Common.UI.ThemeColorPalette({
                    el: $('#slide-gradient-color-menu'),
                    value: '000000'
                });
                this.colorsGrad.on('select', _.bind(this.onColorsGradientSelect, this));
                this.btnGradColor.menu.items[1].on('click',  _.bind(this.addNewColor, this, this.colorsGrad, this.btnGradColor));
            }
            
            this.colorsBack.updateColors(Common.Utils.ThemeColor.getEffectColors(), Common.Utils.ThemeColor.getStandartColors());
            this.colorsFG.updateColors(Common.Utils.ThemeColor.getEffectColors(), Common.Utils.ThemeColor.getStandartColors());
            this.colorsBG.updateColors(Common.Utils.ThemeColor.getEffectColors(), Common.Utils.ThemeColor.getStandartColors());
            this.colorsGrad.updateColors(Common.Utils.ThemeColor.getEffectColors(), Common.Utils.ThemeColor.getStandartColors());
        },

        ShowHideElem: function(value) {
            this.FillColorContainer.toggleClass('settings-hidden', value !== Asc.c_oAscFill.FILL_TYPE_SOLID);
            this.FillImageContainer.toggleClass('settings-hidden', value !== Asc.c_oAscFill.FILL_TYPE_BLIP);
            this.FillPatternContainer.toggleClass('settings-hidden', value !== Asc.c_oAscFill.FILL_TYPE_PATT);
            this.FillGradientContainer.toggleClass('settings-hidden', value !== Asc.c_oAscFill.FILL_TYPE_GRAD);
        },

        ChangeSettings: function(props) {
            if (this._initSettings)
                this.createDelayedElements();

            if (props)
            {
                this._originalProps = props;
                this._noApply = true;

                // background colors
                var rec = null;
                var fill = props.get_background();
                var fill_type = fill.get_type();
                var color = null;

                if (fill===null || fill_type===null || fill_type==Asc.c_oAscFill.FILL_TYPE_NOFILL) { // заливки нет или не совпадает у неск. фигур
                    this.OriginalFillType = Asc.c_oAscFill.FILL_TYPE_NOFILL;
                } else if (fill_type==Asc.c_oAscFill.FILL_TYPE_SOLID) {
                    fill = fill.get_fill();
                    color = fill.get_color();
                    if (color) {
                        if (color.get_type() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                            this.SlideColor = {Value: 1, Color: {color: Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b()), effectValue: color.get_value() }};
                        } else {
                            this.SlideColor = {Value: 1, Color: Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b())};
                        }

                    } else
                        this.SlideColor = {Value: 0, Color: 'transparent'};
                    this.OriginalFillType = Asc.c_oAscFill.FILL_TYPE_SOLID;
                    this.FGColor = (this.SlideColor.Color!=='transparent') ? {Value: 1, Color: Common.Utils.ThemeColor.colorValue2EffectId(this.SlideColor.Color)} : {Value: 1, Color: '000000'};
                    this.BGColor = {Value: 1, Color: 'ffffff'};
                    this.GradColor.colors[0] = (this.SlideColor.Color!=='transparent') ? Common.Utils.ThemeColor.colorValue2EffectId(this.SlideColor.Color) : '000000';
                    this.GradColor.colors[this.GradColor.colors.length-1] = 'ffffff';
                }  else if (fill_type==Asc.c_oAscFill.FILL_TYPE_BLIP) {
                    fill = fill.get_fill();
                    this.BlipFillType = fill.get_type(); // null - не совпадают у нескольких фигур
                    if (this._state.BlipFillType !== this.BlipFillType) {
                        if (this.BlipFillType == Asc.c_oAscFillBlipType.STRETCH || this.BlipFillType == Asc.c_oAscFillBlipType.TILE) {
                            this.cmbFillType.setValue(this.BlipFillType);
                        } else
                            this.cmbFillType.setValue('');
                        this._state.BlipFillType = this.BlipFillType;
                    }
                    this.OriginalFillType = Asc.c_oAscFill.FILL_TYPE_BLIP;
                } else if (fill_type==Asc.c_oAscFill.FILL_TYPE_PATT) {
                    fill = fill.get_fill();
                    this.PatternFillType = fill.get_pattern_type(); // null - не совпадают у нескольких фигур
                    if (this._state.PatternFillType !== this.PatternFillType) {
                        this.cmbPattern.suspendEvents();
                        var rec = this.cmbPattern.menuPicker.store.findWhere({
                            type: this.PatternFillType
                        });
                        this.cmbPattern.menuPicker.selectRecord(rec);
                        this.cmbPattern.resumeEvents();
                        this._state.PatternFillType = this.PatternFillType;
                    }

                    color = fill.get_color_fg();
                    if (color) {
                        if (color.get_type() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                            this.FGColor = {Value: 1, Color: {color: Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b()), effectValue: color.get_value() }};
                        } else {
                            this.FGColor = {Value: 1, Color: Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b())};
                        }
                    } else
                        this.FGColor = {Value: 1, Color: '000000'};

                    color = fill.get_color_bg();
                    if (color) {
                        if (color.get_type() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                            this.BGColor = {Value: 1, Color: {color: Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b()), effectValue: color.get_value() }};
                        } else {
                            this.BGColor = {Value: 1, Color: Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b())};
                        }
                    } else
                        this.BGColor = {Value: 1, Color: 'ffffff'};

                    this.OriginalFillType = Asc.c_oAscFill.FILL_TYPE_PATT;
                    this.SlideColor = {Value: 1, Color: Common.Utils.ThemeColor.colorValue2EffectId(this.FGColor.Color)};
                    this.GradColor.colors[0] = Common.Utils.ThemeColor.colorValue2EffectId(this.FGColor.Color);
                    this.GradColor.colors[this.GradColor.colors.length-1] = 'ffffff';
                } else if (fill_type==Asc.c_oAscFill.FILL_TYPE_GRAD) {
                    fill = fill.get_fill();
                    var gradfilltype = fill.get_grad_type();  // null - не совпадают у нескольких фигур
                    if (this._state.GradFillType !== gradfilltype || this.GradFillType !== gradfilltype) {
                        this.GradFillType = gradfilltype;
                        rec = undefined;
                        if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR || this.GradFillType == Asc.c_oAscFillGradType.GRAD_PATH) {
                            this.cmbGradType.setValue(this.GradFillType);
                            rec = this.cmbGradType.store.findWhere({value: this.GradFillType});
                            this.onGradTypeSelect(this.cmbGradType, rec.attributes);
                        } else {
                            this.cmbGradType.setValue('');
                            this.btnDirection.setIconCls('');
                        }
                        this._state.GradFillType = this.GradFillType;
                    }

                    if (this.GradFillType == Asc.c_oAscFillGradType.GRAD_LINEAR ) {
                        var value = Math.floor(fill.get_linear_angle()/60000);
                        if (Math.abs(this.GradLinearDirectionType-value)>0.001) {
                            this.GradLinearDirectionType=value;
                            var record = this.mnuDirectionPicker.store.findWhere({type: value});
                            this.mnuDirectionPicker.selectRecord(record, true);
                            if (record)
                                this.btnDirection.setIconCls('item-gradient ' + record.get('iconcls'));
                            else
                                this.btnDirection.setIconCls('');
                        }
                    }

                    var me = this;
                    var colors = fill.get_colors(),
                        positions = fill.get_positions(),
                        length = colors ? colors.length : this.GradColor.colors.length;
                    this.sldrGradient.setThumbs(length);
                    if (this.GradColor.colors.length>length) {
                        this.GradColor.colors.splice(length, this.GradColor.colors.length - length);
                        this.GradColor.values.splice(length, this.GradColor.colors.length - length);
                        this.GradColor.currentIdx = 0;
                    }
                    colors && colors.forEach(function(color, index) {
                        if (color) {
                            if (color.get_type() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                                me.GradColor.colors[index] = {color: Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b()), effectValue: color.get_value()};
                                Common.Utils.ThemeColor.colorValue2EffectId(me.GradColor.colors[index]);
                            } else {
                                me.GradColor.colors[index] = Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b());
                            }
                        } else
                            me.GradColor.colors[index] = '000000';

                        var position = positions[index];
                        if (position!==null)       {
                            position = position/1000;
                            me.GradColor.values[index] = position;
                        }
                    });
                    for (var index=0; index<length; index++) {
                        me.sldrGradient.setColorValue(Common.Utils.String.format('#{0}', (typeof(me.GradColor.colors[index]) == 'object') ? me.GradColor.colors[index].color : me.GradColor.colors[index]), index);
                        me.sldrGradient.setValue(index, me.GradColor.values[index]);
                    }
                    if (_.isUndefined(me.GradColor.currentIdx) || me.GradColor.currentIdx >= this.GradColor.colors.length) {
                        me.GradColor.currentIdx = 0;
                    }
                    me.sldrGradient.setActiveThumb(me.GradColor.currentIdx);
                    this.OriginalFillType = Asc.c_oAscFill.FILL_TYPE_GRAD;
                    this.FGColor = {Value: 1, Color: this.GradColor.colors[0]};
                    this.BGColor = {Value: 1, Color: 'ffffff'};
                    this.SlideColor = {Value: 1, Color: this.GradColor.colors[0]};
                }

                if ( this._state.FillType!==this.OriginalFillType ) {
                    this.cmbFillSrc.setValue(this.OriginalFillType);
                    this._state.FillType=this.OriginalFillType;
                    this.ShowHideElem(this.OriginalFillType);
                }

                $(this.btnTexture.el).find('.form-control').prop('innerHTML', this.textSelectTexture);

                var type1 = typeof(this.SlideColor.Color),
                    type2 = typeof(this._state.SlideColor);

                if ( (type1 !== type2) || (type1=='object' &&
                    (this.SlideColor.Color.effectValue!==this._state.SlideColor.effectValue || this._state.SlideColor.color.indexOf(this.SlideColor.Color.color)<0)) ||
                    (type1!='object' && this._state.SlideColor.indexOf(this.SlideColor.Color)<0 )) {

                    this.btnBackColor.setColor(this.SlideColor.Color);
                    if ( typeof(this.SlideColor.Color) == 'object' ) {
                        var isselected = false;
                        for (var i=0; i<10; i++) {
                            if ( Common.Utils.ThemeColor.ThemeValues[i] == this.SlideColor.Color.effectValue ) {
                                this.colorsBack.select(this.SlideColor.Color,true);
                                isselected = true;
                                break;
                            }
                        }
                        if (!isselected) this.colorsBack.clearSelection();
                    } else
                        this.colorsBack.select(this.SlideColor.Color,true);

                    this._state.SlideColor = this.SlideColor.Color;
                }

                var timing = props.get_timing();
                if (timing) {
                    var value = timing.get_TransitionType();
                    var found = false;
                    if (this._state.Effect !== value) {
                        var item = this.cmbEffectName.store.findWhere({value: value});
                        if (item) {
                            found = true;
                            this.cmbEffectName.setValue(item.get('value'));
                        } else
                            this.cmbEffectName.setValue('');

                        this.fillEffectTypeCombo((found) ? value : undefined);
                        this.Effect = value;
                        this._state.Effect = value;
                    }

                    value = timing.get_TransitionOption();
                    if (this._state.EffectType !== value || found) {
                        found = false;
                        item = this.cmbEffectType.store.findWhere({value: value});
                        if (item) {
                            found = true;
                            this.cmbEffectType.setValue(item.get('value'));
                        } else
                            this.cmbEffectType.setValue('');

                        this._state.EffectType = value;
                    }

                    value = timing.get_TransitionDuration();
                    if ( Math.abs(this._state.Duration-value)>0.001 ||
                        (this._state.Duration===null || value===null)&&(this._state.Duration!==value) ||
                        (this._state.Duration===undefined || value===undefined)&&(this._state.Duration!==value) ) {
                        this.numDuration.setValue((value !== null && value !== undefined) ? value/1000.  : '', true);
                        this._state.Duration=value;
                    }

                    value = timing.get_SlideAdvanceDuration();
                    if ( Math.abs(this._state.Delay-value)>0.001 ||
                        (this._state.Delay===null || value===null)&&(this._state.Delay!==value) ||
                        (this._state.Delay===undefined || value===undefined)&&(this._state.Delay!==value) ) {
                        this.numDelay.setValue((value !== null && value !== undefined) ? value/1000.  : '', true);
                        this._state.Delay=value;
                    }

                    value = timing.get_SlideAdvanceOnMouseClick();
                    if ( this._state.OnMouseClick!==value ) {
                        this.chStartOnClick.setValue((value !== null && value !== undefined) ? value : 'indeterminate', true);
                        this._state.OnMouseClick=value;
                    }
                    value = timing.get_SlideAdvanceAfter();
                    if ( this._state.AdvanceAfter!==value ) {
                        this.chDelay.setValue((value !== null && value !== undefined) ? value : 'indeterminate', true);
                        this.numDelay.setDisabled(this.chDelay.getValue()!=='checked');
                        this._state.AdvanceAfter=value;
                    }
                }

                // pattern colors
                type1 = typeof(this.FGColor.Color);
                type2 = typeof(this._state.FGColor);

                if ( (type1 !== type2) || (type1=='object' &&
                    (this.FGColor.Color.effectValue!==this._state.FGColor.effectValue || this._state.FGColor.color.indexOf(this.FGColor.Color.color)<0)) ||
                    (type1!='object' && this._state.FGColor.indexOf(this.FGColor.Color)<0 )) {

                    this.btnFGColor.setColor(this.FGColor.Color);
                    if ( typeof(this.FGColor.Color) == 'object' ) {
                        var isselected = false;
                        for (var i=0; i<10; i++) {
                            if ( Common.Utils.ThemeColor.ThemeValues[i] == this.FGColor.Color.effectValue ) {
                                this.colorsFG.select(this.FGColor.Color,true);
                                isselected = true;
                                break;
                            }
                        }
                        if (!isselected) this.colorsFG.clearSelection();
                    } else
                        this.colorsFG.select(this.FGColor.Color,true);

                    this._state.FGColor = this.FGColor.Color;
                }

                type1 = typeof(this.BGColor.Color);
                type2 = typeof(this._state.BGColor);

                if ( (type1 !== type2) || (type1=='object' &&
                    (this.BGColor.Color.effectValue!==this._state.BGColor.effectValue || this._state.BGColor.color.indexOf(this.BGColor.Color.color)<0)) ||
                    (type1!='object' && this._state.BGColor.indexOf(this.BGColor.Color)<0 )) {

                    this.btnBGColor.setColor(this.BGColor.Color);
                    if ( typeof(this.BGColor.Color) == 'object' ) {
                        var isselected = false;
                        for (var i=0; i<10; i++) {
                            if ( Common.Utils.ThemeColor.ThemeValues[i] == this.BGColor.Color.effectValue ) {
                                this.colorsBG.select(this.BGColor.Color,true);
                                isselected = true;
                                break;
                            }
                        }
                        if (!isselected) this.colorsBG.clearSelection();
                    } else
                        this.colorsBG.select(this.BGColor.Color,true);

                    this._state.BGColor = this.BGColor.Color;
                }

                color = this.GradColor.colors[this.GradColor.currentIdx];
                type1 = typeof(color);
                type2 = typeof(this._state.GradColor);

                if ( (type1 !== type2) || (type1=='object' &&
                    (color.effectValue!==this._state.GradColor.effectValue || this._state.GradColor.color.indexOf(color.color)<0)) ||
                    (type1!='object' && this._state.GradColor.indexOf(color)<0 )) {

                    this.btnGradColor.setColor(color);
                    if ( typeof(color) == 'object' ) {
                        var isselected = false;
                        for (var i=0; i<10; i++) {
                            if ( Common.Utils.ThemeColor.ThemeValues[i] == color.effectValue ) {
                                this.colorsGrad.select(color,true);
                                isselected = true;
                                break;
                            }
                        }
                        if (!isselected) this.colorsGrad.clearSelection();
                    } else
                        this.colorsGrad.select(color,true);

                    this._state.GradColor = color;
                }


                value = this.api.asc_getHeaderFooterProperties();
                if (value) {
                    var slideprops = value.get_Slide() || new AscCommonSlide.CAscHFProps();
                    this.chSlideNum.setValue(!!slideprops.get_ShowSlideNum(), true);
                    this.chDateTime.setValue(!!slideprops.get_ShowDateTime(), true);
                }

                this._noApply = false;
            }
        },

        SetSlideDisabled: function(background, effects, timing, header) {
            if (this._initSettings) return;
            
            if (background !== this._stateDisabled.background) {
                this.cmbFillSrc.setDisabled(background);
                for (var i=0; i<this.FillItems.length; i++) {
                    this.FillItems[i].setDisabled(background);
                }
                this._stateDisabled.background = background;
            }
            if (effects !== this._stateDisabled.effects) {
                var length = this.cmbEffectType.store.length;
                this.cmbEffectName.setDisabled(effects);
                this.cmbEffectType.setDisabled(length<1 || effects);
                this.numDuration.setDisabled(length<1 || effects);
                this.btnPreview.setDisabled(length<1 || effects);
                this._stateDisabled.effects = effects;
            }
            if (timing !== this._stateDisabled.timing) {
                this.chStartOnClick.setDisabled(timing);
                this.chDelay.setDisabled(timing);
                this.numDelay.setDisabled(timing || this.chDelay.getValue()!=='checked');
                this.btnApplyToAll.setDisabled(timing);
                this._stateDisabled.timing = timing;
            }
            if (header !== this._stateDisabled.header) {
                this.chSlideNum.setDisabled(header);
                this.chDateTime.setDisabled(header);
                this._stateDisabled.header = header;
            }
        },

        strColor                : 'Color',
        strFill                 : 'Background',
        textColor               : 'Color Fill',
        textImageTexture        : 'Picture or Texture',
        textTexture             : 'From Texture',
        textFromUrl             : 'From URL',
        textFromFile            : 'From File',
        textStretch             : 'Stretch',
        textTile                : 'Tile',
        txtCanvas               : 'Canvas',
        txtCarton               : 'Carton',
        txtDarkFabric           : 'Dark Fabric',
        txtGrain                : 'Grain',
        txtGranite              : 'Granite',
        txtGreyPaper            : 'Grey Paper',
        txtKnit                 : 'Knit',
        txtLeather              : 'Leather',
        txtBrownPaper           : 'Brown Paper',
        txtPapyrus              : 'Papyrus',
        txtWood                 : 'Wood',
        textNewColor            : 'Add New Custom Color',
        textAdvanced            : 'Show advanced settings',
        textNoFill              : 'No Fill',
        textSelectTexture       : 'Select',
        textNone: 'None',
        textFade: 'Fade',
        textPush: 'Push',
        textWipe: 'Wipe',
        textSplit: 'Split',
        textUnCover: 'UnCover',
        textCover: 'Cover',
        textClock: 'Clock',
        textZoom: 'Zoom',
        textSmoothly: 'Smoothly',
        textBlack: 'Through Black',
        textLeft: 'Left',
        textTop: 'Top',
        textRight: 'Right',
        textBottom: 'Bottom',
        textTopLeft: 'Top-Left',
        textTopRight: 'Top-Right',
        textBottomLeft: 'Bottom-Left',
        textBottomRight: 'Bottom-Right',
        textVerticalIn: 'Vertical In',
        textVerticalOut: 'Vertical Out',
        textHorizontalIn: 'Horizontal In',
        textHorizontalOut: 'Horizontal Out',
        textClockwise: 'Clockwise',
        textCounterclockwise: 'Counterclockwise',
        textWedge: 'Wedge',
        textZoomIn: 'Zoom In',
        textZoomOut: 'Zoom Out',
        textZoomRotate: 'Zoom and Rotate',
        strStartOnClick: 'Start On Click',
        strDelay: 'Delay',
        textApplyAll: 'Apply to All Slides',
        textPreview: 'Preview',
        strEffect: 'Effect',
        strDuration: 'Duration',
        textGradientFill: 'Gradient Fill',
        textPatternFill: 'Pattern',
        strBackground: 'Background color',
        strForeground: 'Foreground color',
        strPattern: 'Pattern',
        textEmptyPattern: 'No Pattern',
        textLinear: 'Linear',
        textRadial: 'Radial',
        textDirection: 'Direction',
        textStyle: 'Style',
        textGradient: 'Gradient',
        textSec: 's',
        strSlideNum: 'Show Slide Number',
        strDateTime: 'Show Date and Time'
    }, PE.Views.SlideSettings || {}));
});
