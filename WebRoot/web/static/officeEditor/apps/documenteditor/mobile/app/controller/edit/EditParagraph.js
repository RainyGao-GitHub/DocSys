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
    'core',
    'documenteditor/mobile/app/view/edit/EditParagraph',
    'jquery',
    'underscore',
    'backbone'
], function (core, view, $, _, Backbone) {
    'use strict';

    DE.Controllers.EditParagraph = Backbone.Controller.extend(_.extend((function() {
        // Private
        var _paragraphInfo = {},
            _paragraphProperty = undefined,
            _styleName,
            metricText = Common.Utils.Metric.getCurrentMetricName();

        return {
            models: [],
            collections: [],
            views: [
                'EditParagraph'
            ],

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
                Common.NotificationCenter.on('editcategory:show',  _.bind(this.categoryShow, this));

                this.addListeners({
                    'EditParagraph': {
                        'page:show'     : this.onPageShow,
                        'style:click'   : this.onStyleClick
                    }
                });

                this._styles = [];
                this._styleThumbSize = undefined;
                this._paragraphObject = undefined;
            },

            setApi: function (api) {
                var me = this;
                me.api = api;
            },

            onLaunch: function () {
                this.createView('EditParagraph').render();
            },

            initEvents: function () {
                var me = this;

                me.initSettings();
            },

            categoryShow: function (e) {
                var $target = $(e.currentTarget);

                if ($target && $target.prop('id') === 'edit-paragraph') {
                    this.initSettings();
                }
            },

            onPageShow: function () {
                var me = this,
                    paletteBackgroundColor = me.getView('EditParagraph').paletteBackgroundColor;

                $('#paragraph-distance-before .button').single('click',          _.bind(me.onDistanceBefore, me));
                $('#paragraph-distance-after .button').single('click',           _.bind(me.onDistanceAfter, me));
                $('#paragraph-spin-first-line .button').single('click',          _.bind(me.onSpinFirstLine, me));
                $('#paragraph-space input:checkbox').single('change',            _.bind(me.onSpaceBetween, me));
                $('#paragraph-page-break input:checkbox').single('change',       _.bind(me.onBreakBefore, me));
                $('#paragraph-page-orphan input:checkbox').single('change',      _.bind(me.onOrphan, me));
                $('#paragraph-page-keeptogether input:checkbox').single('change',_.bind(me.onKeepTogether, me));
                $('#paragraph-page-keepnext input:checkbox').single('change',    _.bind(me.onKeepNext, me));

                paletteBackgroundColor && paletteBackgroundColor.on('select',    _.bind(me.onBackgroundColor, me));

                me.initSettings();
            },

            initSettings: function () {
                var me = this;

                metricText = Common.Utils.Metric.getMetricName(Common.Utils.Metric.getCurrentMetric());
                var selectedElements = me.api.getSelectedElements();
                if (selectedElements && _.isArray(selectedElements)) {
                    for (var i = selectedElements.length - 1; i >= 0; i--) {
                        if (Asc.c_oAscTypeSelectElement.Paragraph == selectedElements[i].get_ObjectType()) {
                            _paragraphProperty = selectedElements[i].get_ObjectValue(); 
                            break;
                        }
                    }
                }

                if (_paragraphProperty) {
                    if (_paragraphProperty.get_Ind()===null || _paragraphProperty.get_Ind()===undefined) {
                        _paragraphProperty.get_Ind().put_FirstLine(0);
                    }
                    var firstLineFix = parseFloat(Common.Utils.Metric.fnRecalcFromMM(_paragraphProperty.get_Ind().get_FirstLine()).toFixed(2));
                    $('#paragraph-spin-first-line .item-after label').text(firstLineFix + ' ' + metricText);
                }

                if (me._paragraphObject) {
                    _paragraphInfo.spaceBefore = me._paragraphObject.get_Spacing().get_Before() < 0 ? me._paragraphObject.get_Spacing().get_Before() : Common.Utils.Metric.fnRecalcFromMM(me._paragraphObject.get_Spacing().get_Before());
                    _paragraphInfo.spaceAfter  = me._paragraphObject.get_Spacing().get_After() < 0 ? me._paragraphObject.get_Spacing().get_After() : Common.Utils.Metric.fnRecalcFromMM(me._paragraphObject.get_Spacing().get_After());
                    var distanceBeforeFix = parseFloat(_paragraphInfo.spaceBefore.toFixed(2));
                    var distanceAfterFix = parseFloat(_paragraphInfo.spaceAfter.toFixed(2));
                    $('#paragraph-distance-before .item-after label').text(_paragraphInfo.spaceBefore < 0 ? 'Auto' : distanceBeforeFix + ' ' + metricText);
                    $('#paragraph-distance-after .item-after label').text(_paragraphInfo.spaceAfter < 0 ? 'Auto' : distanceAfterFix + ' ' + metricText);

                    $('#paragraph-space input:checkbox').prop('checked', me._paragraphObject.get_ContextualSpacing());
                    $('#paragraph-page-break input:checkbox').prop('checked', me._paragraphObject.get_PageBreakBefore());
                    $('#paragraph-page-orphan input:checkbox').prop('checked', me._paragraphObject.get_WidowControl());
                    $('#paragraph-page-keeptogether input:checkbox').prop('checked', me._paragraphObject.get_KeepLines());
                    $('#paragraph-page-keepnext input:checkbox').prop('checked', me._paragraphObject.get_KeepNext());


                    // Background color
                    var shade = me._paragraphObject.get_Shade(),
                        backColor = 'transparent';

                    if (!_.isNull(shade) && !_.isUndefined(shade) && shade.get_Value()===Asc.c_oAscShdClear) {
                        var color = shade.get_Color();
                        if (color) {
                            if (color.get_type() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                                backColor = {
                                    color: Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b()),
                                    effectValue: color.get_value()
                                };
                            } else {
                                backColor = Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b());
                            }
                        }
                    }

                    $('#paragraph-background .color-preview').css('background-color', (backColor === 'transparent') ? backColor : ('#' + (_.isObject(backColor) ? backColor.color : backColor)));

                    var palette = me.getView('EditParagraph').paletteBackgroundColor;

                    if (palette) {
                        palette.select(backColor);
                    }

                    $('#paragraph-list input[name=paragraph-style]').val([_styleName]);
                }
            },

            onStyleClick: function (view, e) {
                var $item = $(e.currentTarget).find('input');

                if ($item) {
                    this.api.put_Style($item.prop('value'));
                }
            },

            // Public
            getStyles: function () {
                return this._styles || [];
            },

            getThumbSize: function () {
                return this._styleThumbSize || {width: 0, height: 0};
            },

            // Handlers

            onBackgroundColor: function (palette, color) {
                var me = this;

                $('#paragraph-background .color-preview').css('background-color', (color === 'transparent') ? color : ('#' + (_.isObject(color) ? color.color : color)));

                if (me.api) {
                    var properties = new Asc.asc_CParagraphProperty();

                    properties.put_Shade(new Asc.asc_CParagraphShd());

                    if (color == 'transparent') {
                        properties.get_Shade().put_Value(Asc.c_oAscShdNil);
                    } else {
                        properties.get_Shade().put_Value(Asc.c_oAscShdClear);
                        properties.get_Shade().put_Color(Common.Utils.ThemeColor.getRgbColor(color));
                    }

                    me.api.paraApply(properties);
                }
            },

            onDistanceBefore: function (e) {
                var $button = $(e.currentTarget),
                    distance = _paragraphInfo.spaceBefore,
                    step,
                    maxValue;

                if (Common.Utils.Metric.getCurrentMetric() == Common.Utils.Metric.c_MetricUnits.pt) {
                    step = 1;
                } else {
                    step = 0.01;
                }

                maxValue = Common.Utils.Metric.fnRecalcFromMM(558.8);

                if ($button.hasClass('decrement')) {
                    distance = Math.max(-1, distance - step);
                } else {
                    distance = Math.min(maxValue, distance + step);
                }

                var distanceFix = parseFloat(distance.toFixed(2));

                _paragraphInfo.spaceBefore = distance;

                $('#paragraph-distance-before .item-after label').text(_paragraphInfo.spaceBefore < 0 ? 'Auto' : distanceFix + ' ' + metricText);

                this.api.put_LineSpacingBeforeAfter(0, (_paragraphInfo.spaceBefore < 0) ? -1 : Common.Utils.Metric.fnRecalcToMM(_paragraphInfo.spaceBefore));
            },

            onDistanceAfter: function (e) {
                var $button = $(e.currentTarget),
                    distance = _paragraphInfo.spaceAfter,
                    step,
                    maxValue;

                if (Common.Utils.Metric.getCurrentMetric() == Common.Utils.Metric.c_MetricUnits.pt) {
                    step = 1;
                } else {
                    step = 0.01;
                }

                maxValue = Common.Utils.Metric.fnRecalcFromMM(558.8);

                if ($button.hasClass('decrement')) {
                    distance = Math.max(-1, distance - step);
                } else {
                    distance = Math.min(maxValue, distance + step);
                }

                var distanceFix = parseFloat(distance.toFixed(2));

                _paragraphInfo.spaceAfter = distance;

                $('#paragraph-distance-after .item-after label').text(_paragraphInfo.spaceAfter < 0 ? 'Auto' : distanceFix + ' ' + metricText);
                this.api.put_LineSpacingBeforeAfter(1, (_paragraphInfo.spaceAfter < 0) ? -1 : Common.Utils.Metric.fnRecalcToMM(_paragraphInfo.spaceAfter));
            },

            onSpinFirstLine: function(e) {
                var $button = $(e.currentTarget),
                    distance = _paragraphProperty.get_Ind().get_FirstLine(),
                    step,
                    minValue,
                    maxValue;

                distance = Common.Utils.Metric.fnRecalcFromMM(distance);

                if (Common.Utils.Metric.getCurrentMetric() == Common.Utils.Metric.c_MetricUnits.pt) {
                    step = 1;
                } else {
                    step = 0.1;
                }

                minValue = Common.Utils.Metric.fnRecalcFromMM(-558.7);
                maxValue = Common.Utils.Metric.fnRecalcFromMM(558.7);

                if ($button.hasClass('decrement')) {
                    distance = Math.max(minValue, distance - step);
                } else {
                    distance = Math.min(maxValue, distance + step);
                }

                var distanceFix = parseFloat(distance.toFixed(2));

                $('#paragraph-spin-first-line .item-after label').text(distanceFix + ' ' + metricText);

                distance = Common.Utils.Metric.fnRecalcToMM(distance);

                var newParagraphProp = new Asc.asc_CParagraphProperty();

                _paragraphProperty.get_Ind().put_FirstLine(distance);

                newParagraphProp.get_Ind().put_FirstLine(distance);

                this.api.paraApply(newParagraphProp);
            },

            onSpaceBetween: function (e) {
                var $checkbox = $(e.currentTarget);
                this.api.put_AddSpaceBetweenPrg($checkbox.is(':checked'));
            },

            onBreakBefore: function (e) {
                var $checkbox = $(e.currentTarget);
                var properties = new Asc.asc_CParagraphProperty();

                properties.put_PageBreakBefore($checkbox.is(':checked'));
                this.api.paraApply(properties);
            },

            onOrphan: function (e) {
                var $checkbox = $(e.currentTarget);
                var properties = new Asc.asc_CParagraphProperty();

                properties.put_WidowControl($checkbox.is(':checked'));
                this.api.paraApply(properties);
            },

            onKeepTogether: function (e) {
                var $checkbox = $(e.currentTarget);
                var properties = new Asc.asc_CParagraphProperty();

                properties.put_KeepLines($checkbox.is(':checked'));
                this.api.paraApply(properties);
            },

            onKeepNext: function (e) {
                var $checkbox = $(e.currentTarget);
                var properties = new Asc.asc_CParagraphProperty();

                properties.put_KeepNext($checkbox.is(':checked'));
                this.api.paraApply(properties);
            },


            // API handlers

            onApiParagraphStyleChange: function(name) {
                _styleName = name;
                $('#paragraph-list input[name=paragraph-style]').val([_styleName]);
            }
        }
    })(), DE.Controllers.EditParagraph || {}))
});