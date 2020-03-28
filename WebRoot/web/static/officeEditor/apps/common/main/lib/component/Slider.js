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
 *  Slider.js
 *
 *  Created by Julia Radzhabova on 2/18/14
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

/**
 *  Example usage:
 *      new Common.UI.SingleSlider({
 *          el: $('#id'),
 *          minValue    : 0,
 *          maxValue    : 100,
 *          value       : 100
 *      });
 *
 *
 *  @property {Boolean} enableKeyEvents
 *  If true slider increase/decrease its value by {@link #step} when arrow key Up/Down or Right/Left is pressed.
 *
 *  enableKeyEvents: false,
 *
 *
 *
 *  Example usage:
 *      new Common.UI.MultiSlider({
 *          el: $('#id'),
 *          minValue    : 0,
 *          maxValue    : 100,
 *          values      : [0, 100]
 *      });
 *
 */

if (Common === undefined)
    var Common = {};

define([
    'common/main/lib/component/BaseView',
    'underscore'
], function (base, _) {
    'use strict';

    Common.UI.SingleSlider = Common.UI.BaseView.extend({

        options : {
            width: 100,
            minValue: 0,
            maxValue: 100,
            step: 1,
            value: 100,
            enableKeyEvents: false
        },

        disabled: false,

        template    : _.template([
            '<div class="slider single-slider" style="">',
                '<div class="track">',
                    '<div class="track-left img-commonctrl"></div>',
                    '<div class="track-center img-commonctrl"></div>',
                    '<div class="track-right img-commonctrl" style=""></div>',
                '</div>',
                '<div class="thumb img-commonctrl" style=""></div>',
                '<% if (this.options.enableKeyEvents) { %>',
                '<input type="text" style="position: absolute; top:-10px; width: 1px; height: 1px;">',
                '<% } %>',
            '</div>'
        ].join('')),

        initialize : function(options) {
            Common.UI.BaseView.prototype.initialize.call(this, options);

            var me = this;

            me.width = me.options.width;
            me.minValue = me.options.minValue;
            me.maxValue = me.options.maxValue;
            me.delta = 100/(me.maxValue - me.minValue);
            me.step = me.options.step;

            if (me.options.el) {
                me.render();
            }

            this.setValue(me.options.value);
        },

        render : function(parentEl) {
            var me = this;

            if (!me.rendered) {
                this.cmpEl = $(this.template({
                }));

                if (parentEl) {
                    this.setElement(parentEl, false);
                    parentEl.html(this.cmpEl);
                } else {
                    me.$el.html(this.cmpEl);
                }
            } else {
                this.cmpEl = me.$el;
            }

            this.cmpEl.find('.track-center').width(me.options.width - 14);
            this.cmpEl.width(me.options.width);

            this.thumb = this.cmpEl.find('.thumb');

            var onMouseUp = function (e) {
                e.preventDefault();
                e.stopPropagation();

                var pos = Math.max(0, Math.min(100, (Math.round((e.pageX*Common.Utils.zoom() - me.cmpEl.offset().left - me._dragstart) / me.width * 100))));
                me.setThumbPosition(pos);

                me.lastValue = me.value;
                me.value = pos/me.delta + me.minValue;

                me.thumb.removeClass('active');
                $(document).off('mouseup',   onMouseUp);
                $(document).off('mousemove', onMouseMove);

                me._dragstart = undefined;
                me.trigger('changecomplete', me, me.value, me.lastValue);
            };

            var onMouseMove = function (e) {
                if ( me.disabled ) return;
                if ( me._dragstart===undefined ) return;

                e.preventDefault();
                e.stopPropagation();

                var pos = Math.max(0, Math.min(100, (Math.round((e.pageX*Common.Utils.zoom() - me.cmpEl.offset().left - me._dragstart) / me.width * 100))));
                me.setThumbPosition(pos);

                me.lastValue = me.value;
                me.value = pos/me.delta + me.minValue;

                if (Math.abs(me.value-me.lastValue)>0.001)
                    me.trigger('change', me, me.value, me.lastValue);
            };

            var onMouseDown = function (e) {
                if ( me.disabled ) return;
                me._dragstart = e.pageX*Common.Utils.zoom() - me.thumb.offset().left - 7;

                me.thumb.addClass('active');
                $(document).on('mouseup',   onMouseUp);
                $(document).on('mousemove', onMouseMove);

                if (me.options.enableKeyEvents)
                    setTimeout(function() {me.input.focus();}, 10);
            };

            var onTrackMouseDown = function (e) {
                if ( me.disabled ) return;

                var pos = Math.max(0, Math.min(100, (Math.round((e.pageX*Common.Utils.zoom() - me.cmpEl.offset().left) / me.width * 100))));
                me.setThumbPosition(pos);

                me.lastValue = me.value;
                me.value = pos/me.delta + me.minValue;

                me.trigger('change', me, me.value, me.lastValue);
                me.trigger('changecomplete', me, me.value, me.lastValue);
            };

            var updateslider;

            var moveThumb = function(increase) {
                me.lastValue = me.value;
                me.value = Math.max(me.minValue, Math.min(me.maxValue, me.value + ((increase) ? me.step : -me.step)));
                me.setThumbPosition(Math.round((me.value-me.minValue)*me.delta));
                me.trigger('change', me, me.value, me.lastValue);
            };

            var onKeyDown = function (e) {
                if ( me.disabled ) return;

                if (e.keyCode==Common.UI.Keys.UP || e.keyCode==Common.UI.Keys.DOWN || e.keyCode==Common.UI.Keys.LEFT || e.keyCode==Common.UI.Keys.RIGHT) {
                    e.preventDefault();
                    e.stopPropagation();
                    el.off('keydown', 'input', onKeyDown);
                    updateslider = setInterval(_.bind(moveThumb, me, e.keyCode==Common.UI.Keys.UP || e.keyCode==Common.UI.Keys.RIGHT), 100);
                }
            };

            var onKeyUp = function (e) {
                if ( me.disabled ) return;

                if (e.keyCode==Common.UI.Keys.UP || e.keyCode==Common.UI.Keys.DOWN || Common.UI.Keys.LEFT || Common.UI.Keys.RIGHT) {
                    e.stopPropagation();
                    e.preventDefault();
                    clearInterval(updateslider);
                    moveThumb(e.keyCode==Common.UI.Keys.UP || e.keyCode==Common.UI.Keys.RIGHT);
                    el.on('keydown', 'input', onKeyDown);
                    me.trigger('changecomplete', me, me.value, me.lastValue);
                }
            };

            if (!me.rendered) {
                var el = me.cmpEl;
                el.on('mousedown', '.thumb', onMouseDown);
                el.on('mousedown', '.track', onTrackMouseDown);
                if (this.options.enableKeyEvents) {
                    el.on('keydown', 'input', onKeyDown);
                    el.on('keyup',   'input', onKeyUp);
                }
            }

            me.rendered = true;

            return this;
        },

        setThumbPosition: function(x) {
            this.thumb.css({left: x + '%'});
        },

        setValue: function(value) {
            this.lastValue = this.value;
            this.value = Math.max(this.minValue, Math.min(this.maxValue, value));
            this.setThumbPosition(Math.round((value-this.minValue)*this.delta));
        },

        getValue: function() {
            return this.value;
        },

        setDisabled: function(disabled) {
            if (disabled !== this.disabled)
                this.cmpEl.toggleClass('disabled', disabled);
            this.disabled = disabled;
        }
    });

    Common.UI.MultiSlider = Common.UI.BaseView.extend({

        options : {
            width: 100,
            minValue: 0,
            maxValue: 100,
            values: [0, 100],
            thumbTemplate: '<div class="thumb" style=""></div>'
        },

        disabled: false,

        template    : _.template([
            '<div class="slider multi-slider">',
                '<div class="track">',
                    '<div class="track-left"></div>',
                    '<div class="track-center""></div>',
                    '<div class="track-right" style=""></div>',
                '</div>',
                '<% _.each(items, function(item) { %>',
                '<%= thumbTemplate %>',
                '<% }); %>',
            '</div>'
        ].join('')),

        initialize : function(options) {
            Common.UI.BaseView.prototype.initialize.call(this, options);

            var me = this;

            me.width = me.options.width;
            me.minValue = me.options.minValue;
            me.maxValue = me.options.maxValue;
            me.delta = 100/(me.maxValue - me.minValue);
            me.thumbs = [];

            if (me.options.el) {
                me.render();
            }
        },

        render : function(parentEl) {
            var me = this;

            if (!me.rendered) {
                this.cmpEl = $(this.template({
                    items: this.options.values,
                    thumbTemplate: this.options.thumbTemplate
                }));

                if (parentEl) {
                    this.setElement(parentEl, false);
                    parentEl.html(this.cmpEl);
                } else {
                    this.$el.html(this.cmpEl);
                }
            } else {
                this.cmpEl = this.$el;
            }

            var el = this.cmpEl;
            el.find('.track-center').width(me.options.width - 14);
            el.width(me.options.width);

            var onMouseUp = function (e) {
                e.preventDefault();
                e.stopPropagation();

                var index = e.data.index,
                    lastValue = me.thumbs[index].value,
                    minValue = (index-1<0) ? 0 : me.thumbs[index-1].position,
                    maxValue = (index+1<me.thumbs.length) ? me.thumbs[index+1].position : 100,
                    position = Math.round((e.pageX*Common.Utils.zoom() - me.cmpEl.offset().left - me._dragstart) / me.width * 100),
                    need_sort = position < minValue || position > maxValue,
                    pos = Math.max(0, Math.min(100, position)),
                    value = pos/me.delta + me.minValue;

                if (me.isRemoveThumb) {
                    if (me.thumbs.length < 3) {
                        $(document).off('mouseup', me.binding.onMouseUp);
                        $(document).off('mousemove', me.binding.onMouseMove);
                        me._dragstart = undefined;
                        return;
                    }
                    me.trigger('removethumb', me, _.findIndex(me.thumbs, {index: index}));
                    me.trigger('change', me, value, lastValue);
                    me.trigger('changecomplete', me, value, lastValue);
                } else {
                    me.setThumbPosition(index, pos);
                    me.thumbs[index].value = value;

                    if (need_sort)
                        me.sortThumbs();
                }

                $(document).off('mouseup', me.binding.onMouseUp);
                $(document).off('mousemove', me.binding.onMouseMove);

                me._dragstart = undefined;
                !me.isRemoveThumb && me.trigger('changecomplete', me, value, lastValue);
                me.isRemoveThumb = undefined;
            };

            var onMouseMove = function (e) {
                if ( me.disabled ) return;
                if ( me._dragstart===undefined ) return;

                e.preventDefault();
                e.stopPropagation();

                var index = e.data.index,
                    lastValue = me.thumbs[index].value,
                    minValue = (index-1<0) ? 0 : me.thumbs[index-1].position,
                    maxValue = (index+1<me.thumbs.length) ? me.thumbs[index+1].position : 100,
                    position = Math.round((e.pageX*Common.Utils.zoom() - me.cmpEl.offset().left - me._dragstart) / me.width * 100),
                    need_sort = position < minValue || position > maxValue,
                    pos = Math.max(0, Math.min(100, position)),
                    value = pos/me.delta + me.minValue;

                me.setThumbPosition(index, pos);
                me.thumbs[index].value = value;

                if (need_sort)
                    me.sortThumbs();

                var positionY = e.pageY*Common.Utils.zoom() - me.cmpEl.offset().top;
                me.isRemoveThumb = positionY > me.cmpEl.height() || positionY < 0;
                me.setRemoveThumb(index, me.isRemoveThumb);

                if (Math.abs(value-lastValue)>0.001)
                    me.trigger('change', me, value, lastValue);
            };

            var onMouseDown = function (e) {
                if ( me.disabled ) return;

                var index = e.data.index,
                    thumb = me.thumbs[index].thumb;

                me._dragstart = e.pageX*Common.Utils.zoom() - thumb.offset().left - thumb.width()/2;
                me.setActiveThumb(index);

                _.each(me.thumbs, function (item, idx) {
                    (index == idx) ? item.thumb.css('z-index', 500) : item.thumb.css('z-index', '');
                });

                $(document).on('mouseup', null, e.data, me.binding.onMouseUp);
                $(document).on('mousemove', null, e.data, me.binding.onMouseMove);
            };

            var onTrackMouseUp = function (e) {
                if ( me.disabled || !_.isUndefined(me._dragstart) || me.thumbs.length > 9) return;

                var pos = Math.max(0, Math.min(100, (Math.round((e.pageX*Common.Utils.zoom() - me.cmpEl.offset().left) / me.width * 100)))),
                    nearIndex = findThumb(pos),
                    thumbColor = me.thumbs[nearIndex].colorValue,
                    thumbValue = me.thumbs[nearIndex].value,
                    value = pos/me.delta + me.minValue;
                me.addThumb();
                var index = me.thumbs.length - 1;
                me.setThumbPosition(index, pos);
                me.thumbs[index].value = value;
                me.trigger('addthumb', me, index, nearIndex, thumbColor);

                me.trigger('change', me);
                me.trigger('changecomplete', me);
            };

            /*var onTrackMouseDown = function (e) {
                if ( me.disabled ) return;

                var pos = Math.max(0, Math.min(100, (Math.round((e.pageX*Common.Utils.zoom() - me.cmpEl.offset().left) / me.width * 100)))),
                    index = findThumb(pos),
                    lastValue = me.thumbs[index].value,
                    value = pos/me.delta + me.minValue;

                me.setThumbPosition(index, pos);
                me.thumbs[index].value = value;

                me.trigger('change', me, value, lastValue);
                me.trigger('changecomplete', me, value, lastValue);
            };*/

            var findThumb = function(pos) {
                var nearest = 100,
                    index = 0,
                    len = me.thumbs.length,
                    dist;

                for (var i=0; i<len; i++) {
                    dist = Math.abs(me.thumbs[i].position - pos);
                    if (Math.abs(dist <= nearest)) {
                        var above = me.thumbs[i + 1];
                        var below = me.thumbs[i - 1];

                        if (below !== undefined && pos < below.position) {
                            continue;
                        }
                        if (above !== undefined && pos > above.position) {
                            continue;
                        }
                        index = i;
                        nearest = dist;
                    }
                }
                return index;
            };

            this.binding = {
                onMouseUp:   _.bind(onMouseUp, this),
                onMouseMove: _.bind(onMouseMove, this),
                onMouseDown: _.bind(onMouseDown, this)
            };

            this.$thumbs = el.find('.thumb');
            _.each(this.$thumbs, function(item, index) {
                var thumb = $(item);
                me.thumbs.push({
                    thumb: thumb,
                    index: index
                });
                me.setValue(index, me.options.values[index]);
                thumb.on('mousedown', null, me.thumbs[index], me.binding.onMouseDown);
            });
            me.setActiveThumb(0, true);

            if (!me.rendered) {
                /*el.on('mousedown', '.track', onTrackMouseDown);*/
                el.on('mouseup', '.track', onTrackMouseUp);
            }

            me.rendered = true;

            return this;
        },

        setActiveThumb: function(index, suspend) {
            this.currentThumb = index;
            this.$thumbs = this.cmpEl.find('.thumb');
            this.$thumbs.removeClass('active');
            this.thumbs[index].thumb.addClass('active');
            if (suspend!==true) this.trigger('thumbclick', this, index);
        },

        setRemoveThumb: function(index, remove) {
            var ind = _.findIndex(this.thumbs, {index: index});
            if (ind !== -1) {
                if (remove && this.thumbs.length > 2) {
                    this.$el.find('.active').addClass('remove');
                } else {
                    this.$el.find('.remove').removeClass('remove');
                }
            }
        },

        setThumbPosition: function(index, x) {
            this.thumbs[index].position = x;
            this.thumbs[index].thumb.css({left: x + '%'});
        },

        setValue: function(index, value) {
            this.thumbs[index].value = Math.max(this.minValue, Math.min(this.maxValue, value));
            this.setThumbPosition(index, Math.round((value-this.minValue)*this.delta));
        },

        getValue: function(index) {
            return this.thumbs[index].value;
        },

        getValues: function() {
            var values = [];
            _.each (this.thumbs, function(thumb) {
                values.push(thumb.value);
            });

            return values;
        },

        setDisabled: function(disabled) {
            if (disabled !== this.disabled)
                this.cmpEl.toggleClass('disabled', disabled);
            this.disabled = disabled;
        },

        sortThumbs: function() {
            this.thumbs.sort(function(a, b) {
                return (a.position - b.position);
            });
            var recalc_indexes = [];
            _.each (this.thumbs, function(thumb, index) {
                recalc_indexes.push(thumb.index);
                thumb.index = index;
            });
            return recalc_indexes;
        },

        setThumbs: function(count) {
            var length = this.thumbs.length;
            if (length==count) return;

            for (var i=0; i<Math.abs(count-length); i++)
                (length<count) ? this.addThumb() : this.removeThumb();
        },

        addThumb: function() {
            var el = this.cmpEl,
                thumb = $(this.options.thumbTemplate),
                index = this.thumbs.length;
            el.append(thumb);
            this.thumbs.push({
                thumb: thumb,
                index: index
            });
            (index>0) && this.setValue(index, this.getValue(index-1));
            thumb.on('mousedown', null, this.thumbs[index], this.binding.onMouseDown);
        },

        removeThumb: function(index) {
            if (index===undefined) index = this.thumbs.length-1;
            if (index>0) {
                this.thumbs[index].thumb.remove();
                this.thumbs.splice(index, 1);
            }
        }
    });
});
