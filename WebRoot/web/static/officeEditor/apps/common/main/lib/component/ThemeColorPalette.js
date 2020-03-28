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
 *  ThemeColorPalette.js
 *
 *  Created by Julia Radzhabova on 1/28/14
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

if (Common === undefined)
    var Common = {};

define([
    'common/main/lib/component/BaseView',
    'common/main/lib/view/ExtendedColorDialog'
], function () {
    'use strict';

    Common.UI.ThemeColorPalette = Common.UI.BaseView.extend(_.extend({
        options: {
            dynamiccolors: 10,
            standardcolors: 10,
            themecolors: 10,
            effects: 5,
            allowReselect: true,
            transparent: false,
            value: '000000'
        },

        template    :
            _.template(
                '<div style="padding: 12px;">' +
                '<% var me = this; %>' +
                '<% $(colors).each(function(num, item) { %>' +
                    '<% if (me.isBlankSeparator(item)) { %> <div class="palette-color-spacer" style="width:100%;height:8px;float:left;"></div>' +
                    '<% } else if (me.isSeparator(item)) { %> </div><div class="palette-color-separator" style="width:100%;height:1px;float:left;border-bottom: 1px solid #E0E0E0"></div><div style="padding: 12px;">' +
                    '<% } else if (me.isColor(item)) { %> ' +
                        '<a class="palette-color color-<%=item%>" style="background:#<%=item%>" hidefocus="on">' +
                        '<em><span style="background:#<%=item%>;" unselectable="on">&#160;</span></em>' +
                        '</a>' +
                    '<% } else if (me.isTransparent(item)) { %>' +
                        '<a class="color-<%=item%>" hidefocus="on">' +
                        '<em><span unselectable="on">&#160;</span></em>' +
                        '</a>' +
                    '<% } else if (me.isEffect(item)) { %>' +
                        '<a effectid="<%=item.effectId%>" effectvalue="<%=item.effectValue%>" class="palette-color-effect color-<%=item.color%>" style="background:#<%=item.color%>" hidefocus="on">' +
                        '<em><span style="background:#<%=item.color%>;" unselectable="on">&#160;</span></em>' +
                        '</a>' +
                    '<% } else if (me.isCaption(item)) { %>' +
                    '<div class="palette-color-caption" style="width:100%;float:left;font-size: 11px;"><%=item%></div>' +
                    '<% } %>' +
                '<% }); %>' +
                '</div>' +
                '<% if (me.options.dynamiccolors!==undefined) { %>' +
                '<div class="palette-color-spacer" style="width:100%;height:8px;float:left;"></div><div style="padding: 12px;">' +
                    '<% for (var i=0; i<me.options.dynamiccolors; i++) { %>' +
                        '<a class="color-dynamic-<%=i%> dynamic-empty-color" style="background:#ffffff" color="" hidefocus="on">' +
                        '<em><span unselectable="on">&#160;</span></em></a>' +
                    '<% } %>' +
                '<% } %>' +
                '</div>'),

        colorRe: /(?:^|\s)color-(.{6})(?:\s|$)/,
        selectedCls: 'selected',

        initialize : function(options) {
            Common.UI.BaseView.prototype.initialize.call(this, options);

            var me = this,
                el = me.$el || $(this.el);

            this.colors = me.options.colors || this.generateColorData(me.options.themecolors, me.options.effects, me.options.standardcolors, me.options.transparent);

            el.addClass('theme-colorpalette');
            this.render();

            if (this.options.updateColorsArr)
                this.updateColors(this.options.updateColorsArr[0], this.options.updateColorsArr[1]);
            if (this.options.value)
                this.select(this.options.value, true);
            this.updateCustomColors();
            el.closest('.btn-group').on('show.bs.dropdown', _.bind(this.updateCustomColors, this));
            el.closest('.dropdown-submenu').on('show.bs.dropdown', _.bind(this.updateCustomColors, this));
            el.on('click', _.bind(this.handleClick, this));
        },

        render: function () {
            this.$el.html(this.template({colors: this.colors}));
            return this;
        },

        isBlankSeparator: function(v) {
            return typeof(v) == 'string' && v == '-';
        },
        isSeparator: function(v) {
            return typeof(v) == 'string' && v == '--';
        },
        isColor: function(v) {
            return typeof(v) == 'string' && (/[0-9A-F]{6}/).test(v);
        },
        isTransparent: function(v) {
            return typeof(v) == 'string' && (v=='transparent');
        },
        isCaption: function(v) {
            return (typeof(v) == 'string' && v!='-' && v!='--' && !(/[0-9A-F]{6}|transparent/).test(v));
        },
        isEffect: function(v) {
            return (typeof(v) == 'object' && v.effectId !== undefined);
        },

        getColor: function() {
            return this.value;
        },

        updateCustomColors: function() {
            var el = this.$el || $(this.el);
            if (el) {
                var selected = el.find('a.' + this.selectedCls),
                    color = (selected.length>0 && /color-dynamic/.test(selected[0].className)) ? selected.attr('color') : undefined;
                if (color) { // custom color was selected
                    color = color.toUpperCase();
                    selected.removeClass(this.selectedCls);
                }

                var colors = Common.localStorage.getItem('asc.'+Common.localStorage.getId()+'.colors.custom');
                colors = colors ? colors.split(',') : [];

                var i = -1, colorEl, c = colors.length < this.options.dynamiccolors ? colors.length : this.options.dynamiccolors;
                while (++i < c) {
                    colorEl = el.find('.color-dynamic-'+ i);
                    colorEl.removeClass('dynamic-empty-color').attr('color', colors[i]);
                    colorEl.find('span').css({
                        'background-color': '#'+colors[i]
                    });
                    if (colors[i] == color) {
                        colorEl.addClass(this.selectedCls);
                        color = undefined; //select only first found color
                    }
                }
            }
        },

        handleClick : function(e){
            var me = this;
            var target = $(e.target).closest('a');
            var color, cmp;

            if (target.length==0) return;

            if (target.hasClass('color-transparent') ) {
                $(me.el).find('a.' + me.selectedCls).removeClass(me.selectedCls);
                target.addClass(me.selectedCls);
                me.value = 'transparent';
                me.trigger('select', me, 'transparent');
            } else if ( !(target[0].className.search('color-dynamic')<0) ) {
                if (!/dynamic-empty-color/.test(target[0].className)) {
                    $(me.el).find('a.' + me.selectedCls).removeClass(me.selectedCls);
                    target.addClass(me.selectedCls);
                    color = target.attr('color');
                    if (color)  me.trigger('select', me, color);

                    me.value = color.toUpperCase();
                } else {
                    setTimeout(function(){
                        me.addNewColor();
                    }, 10);
                }
            } else {
                if (!/^[a-fA-F0-9]{6}$/.test(me.value) || _.indexOf(me.colors, me.value)<0 )
                    me.value = false;

                $(me.el).find('a.' + me.selectedCls).removeClass(me.selectedCls);
                target.addClass(me.selectedCls);

                color = target[0].className.match(me.colorRe)[1];
                if ( target.hasClass('palette-color-effect') ) {
                    var effectId = parseInt(target.attr('effectid'));
                    if (color)  {
                        me.value = color.toUpperCase();
                        me.trigger('select', me, {color: color, effectId: effectId});
                    }
                } else {
                    if (/#?[a-fA-F0-9]{6}/.test(color)) {
                        color = /#?([a-fA-F0-9]{6})/.exec(color)[1].toUpperCase();
                        me.value = color;
                        me.trigger('select', me, color);
                    }
                }
            }
        },

        setCustomColor: function(color) {
            var el = this.$el || $(this.el);
            color = /#?([a-fA-F0-9]{6})/.exec(color);
            if (color) {
                this.saveCustomColor(color[1]);

                el.find('a.' + this.selectedCls).removeClass(this.selectedCls);

                var child = el.find('.dynamic-empty-color');
                if (child.length==0) {
                    this.updateCustomColors();
                    child = el.find('.color-dynamic-' + (this.options.dynamiccolors - 1));
                }

                child.first().removeClass('dynamic-empty-color').addClass(this.selectedCls).attr('color', color[1]);
                child.first().find('span').css({
                    'background-color': '#'+color[1]
                });
                this.select(color[1], true);
            }
        },

        saveCustomColor: function(color) {
            var key_name = 'asc.'+Common.localStorage.getId()+'.colors.custom';
            var colors = Common.localStorage.getItem(key_name);
            colors = colors ? colors.split(',') : [];
            if (colors.push(color) > this.options.dynamiccolors) colors.shift();
            Common.localStorage.setItem(key_name, colors.join().toUpperCase());
        },

        addNewColor: function(defcolor) {
            var me = this;

            var win = new Common.UI.ExtendedColorDialog({
            });
            win.on('onmodalresult', function(mr) {
                me._isdlgopen = false;
                if (mr==1) {
                    me.setCustomColor(win.getColor());
                    me.fireEvent('select', me, win.getColor());
                }
            });
            me._isdlgopen = true;
            win.setColor((me.value!==undefined && me.value!==false) ? me.value : ((defcolor!==undefined) ? defcolor : '000000'));
            win.show();
        },

        isDialogOpen: function() {
            return this._isdlgopen == true;
        },

        select: function(color, suppressEvent) {
            var el = this.$el || $(this.el);
            el.find('a.' + this.selectedCls).removeClass(this.selectedCls);

            if (typeof(color) == 'object' ) {
                var effectEl;
                if (color.effectId !== undefined) {
                    effectEl = el.find('a[effectid="'+color.effectId+'"]').first();
                    if (effectEl.length>0) {
                        effectEl.addClass(this.selectedCls);
                        this.value = effectEl[0].className.match(this.colorRe)[1].toUpperCase();
                    } else
                        this.value = false;
                } else if (color.effectValue !== undefined) {
                    effectEl = el.find('a[effectvalue="'+color.effectValue+'"].color-' + color.color.toUpperCase()).first();
                    if (effectEl.length>0) {
                        effectEl.addClass(this.selectedCls);
                        this.value = effectEl[0].className.match(this.colorRe)[1].toUpperCase();
                    } else
                        this.value = false;
                }
            } else {
                if (/#?[a-fA-F0-9]{6}/.test(color)) {
                    color = /#?([a-fA-F0-9]{6})/.exec(color)[1].toUpperCase();
                    this.value = color;
                }

                if (/^[a-fA-F0-9]{6}|transparent$/.test(color) && _.indexOf(this.colors, color)>=0 ) {
                    if (_.indexOf(this.colors, this.value)<0) this.value = false;

                    if (color != this.value || this.options.allowReselect) {
                        (color == 'transparent') ? el.find('a.color-transparent').addClass(this.selectedCls) : el.find('a.palette-color.color-' + color).first().addClass(this.selectedCls);
                        this.value = color;
                        if (suppressEvent !== true) {
                            this.fireEvent('select', this, color);
                        }
                    }
                } else {
                    var co = el.find('#'+color).first();
                    if (co.length==0)
                        co = el.find('a[color="'+color+'"]').first();
                    if (co.length>0) {
                        co.addClass(this.selectedCls);
                        this.value = color.toUpperCase();
                    }
                }
            }
        },

        selectByRGB: function(rgb, suppressEvent) {
            var el = this.$el || $(this.el);
            el.find('a.' + this.selectedCls).removeClass(this.selectedCls);

            var color = (typeof(rgb) == 'object') ? rgb.color : rgb;
            if (/#?[a-fA-F0-9]{6}/.test(color)) {
                color = /#?([a-fA-F0-9]{6})/.exec(color)[1].toUpperCase();
            }

            if (/^[a-fA-F0-9]{6}|transparent$/.test(color)) {
                if (color != this.value || this.options.allowReselect) {
                    var co = (color == 'transparent') ? el.find('a.color-transparent') : el.find('a.color-' + color).first();
                    if (co.length==0)
                        co = el.find('#'+color).first();
                    if (co.length==0)
                        co = el.find('a[color="'+color+'"]').first();
                    if (co.length>0) {
                        co.addClass(this.selectedCls);
                        this.value = color;
                    }
                    if (suppressEvent !== true) {
                        this.fireEvent('select', this, color);
                    }
                }
            }
        },

        updateColors: function(effectcolors, standartcolors, value) {
            if (effectcolors===undefined || standartcolors===undefined) return;

            var me = this,
                el = me.$el || $(this.el);

            if (me.aColorElements === undefined) {
                me.aColorElements = el.find('a.palette-color');
            }
            if (me.aEffectElements === undefined) {
                me.aEffectElements = el.find('a.palette-color-effect');
            }

            var aEl;
            var aColorIdx = 0,
                aEffectIdx = 0;

            for (var i=0; i<me.colors.length; i++) {
                if ( typeof(me.colors[i]) == 'string' && (/[0-9A-F]{6}/).test(me.colors[i]) ) {
                    if (aColorIdx>=standartcolors.length)
                        continue;

                    aEl = $(me.aColorElements[aColorIdx]);
                    aEl.removeClass('color-'+me.colors[i]);

                    me.colors[i] = standartcolors[aColorIdx].toUpperCase();

                    aEl.addClass('color-'+me.colors[i]);
                    aEl.css({background: "#"+me.colors[i]});
                    aEl.find('span').first().css({background: "#"+me.colors[i]});
                    aColorIdx++;
                } else if ( typeof(me.colors[i]) == 'object' && me.colors[i].effectId !== undefined) {
                    if (aEffectIdx>=effectcolors.length)
                        continue;

                    aEl = $(me.aEffectElements[aEffectIdx]);

                    effectcolors[aEffectIdx].color = effectcolors[aEffectIdx].color.toUpperCase();

                    if ( me.colors[i].color !== effectcolors[aEffectIdx].color ) {
                        aEl.removeClass('color-'+me.colors[i].color);
                        aEl.addClass('color-'+effectcolors[aEffectIdx].color);
                        aEl.css({background: "#"+effectcolors[aEffectIdx].color});
                        aEl.find('span').first().css({background: "#"+effectcolors[aEffectIdx].color});
                    }

                    if ( me.colors[i].effectId !== effectcolors[aEffectIdx].effectId )
                        aEl.attr('effectid', '' + effectcolors[aEffectIdx].effectId);
                    if ( me.colors[i].effectValue !== effectcolors[aEffectIdx].effectValue )
                        aEl.attr('effectvalue', '' + effectcolors[aEffectIdx].effectValue);

                    me.colors[i] = effectcolors[aEffectIdx];

                    aEffectIdx++;
                }
            }

            if (value)
                this.select(value, true);
            else {
                var selected = el.find('a.' + this.selectedCls);
                if (selected.length && selected.hasClass('palette-color-effect')) {
                    this.value = selected[0].className.match(this.colorRe)[1].toUpperCase();
                }
            }
            this.options.updateColorsArr = undefined;
        },

        clearSelection: function(suppressEvent) {
            this.$el.find('a.' + this.selectedCls).removeClass(this.selectedCls);
            this.value = undefined;
        },

        generateColorData: function(themecolors, effects, standardcolors, transparent) {
            var arr = [],
                len = (themecolors>0 && effects>0) ? themecolors * effects : 0;
            if (themecolors>0) {
                arr = [this.textThemeColors, '-'];
                for (var i=0; i<themecolors; i++)
                    arr.push({color: 'FFFFFF', effectId: 1});

                if (effects>0) arr.push('-');
                for (var i=0; i<len; i++)
                    arr.push({color: 'FFFFFF', effectId: 1});

                if (standardcolors)
                    arr.push('-', '--', '-');
            }
            if (standardcolors) {
                arr.push(this.textStandartColors, '-');
                if (transparent) {
                    arr.push('transparent');
                    standardcolors--;
                }
                for (var i=0; i<standardcolors; i++)
                    arr.push('FFFFFF');
            }
            if (this.options.dynamiccolors && (themecolors || standardcolors))
                arr.push('-', '--');
            return arr;
        },

        textThemeColors         : 'Theme Colors',
        textStandartColors      : 'Standart Colors'
    }, Common.UI.ThemeColorPalette || {}));
});