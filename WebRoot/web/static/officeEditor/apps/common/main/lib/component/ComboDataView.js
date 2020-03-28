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
 *  ComboDataView.js
 *
 *  Created by Alexander Yuzhin on 2/13/14
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

if (Common === undefined)
    var Common = {};

define([
    'common/main/lib/component/BaseView',
    'common/main/lib/component/DataView'
], function () {
    'use strict';

    Common.UI.ComboDataView = Common.UI.BaseView.extend({
        options : {
            id                  : null,
            cls                 : '',
            style               : '',
            hint                : false,
            itemWidth           : 80,
            itemHeight          : 40,
            menuMaxHeight       : 300,
            enableKeyEvents     : false,
            beforeOpenHandler   : null,
            additionalMenuItems  : null,
            showLast: true,
            minWidth: -1
        },

        template: _.template([
            '<div id="<%= id %>" class="combo-dataview <%= cls %>" style="<%= style %>">',
                '<div class="view"></div> ',
                '<div class="button"></div> ',
            '</div>'
        ].join('')),

        initialize : function(options) {
            Common.UI.BaseView.prototype.initialize.call(this, options);

            this.id          = this.options.id || Common.UI.getId();
            this.cls         = this.options.cls;
            this.style       = this.options.style;
            this.hint        = this.options.hint;
            this.store       = this.options.store || new Common.UI.DataViewStore();
            this.itemWidth   = this.options.itemWidth;
            this.itemHeight  = this.options.itemHeight;
            this.menuMaxHeight = this.options.menuMaxHeight;
            this.beforeOpenHandler = this.options.beforeOpenHandler;
            this.showLast    = this.options.showLast;
            this.rootWidth   = 0;
            this.rootHeight  = 0;
            this.rendered    = false;
            this.needFillComboView = false;
            this.minWidth = this.options.minWidth;

            this.fieldPicker = new Common.UI.DataView({
                cls: 'field-picker',
                allowScrollbar: false,
                itemTemplate : _.template([
                    '<div class="style" id="<%= id %>">',
                        '<img src="<%= imageUrl %>" width="' + this.itemWidth + '" height="' + this.itemHeight + '"/>',
                        '<% if (typeof title !== "undefined") {%>',
                            '<span class="title"><%= title %></span>',
                        '<% } %>',
                    '</div>'
                ].join(''))
            });

            this.openButton = new Common.UI.Button({
                cls: 'open-menu',
                menu: new Common.UI.Menu({
                    menuAlign: 'tl-tl',
                    offset: [0, 3],
                    items: [
                        {template: _.template('<div class="menu-picker-container"></div>')}
                    ]
                })
            });

            if  (this.options.additionalMenuItems != null) {
                this.openButton.menu.items = this.openButton.menu.items.concat(this.options.additionalMenuItems)
            }

            this.menuPicker  = new Common.UI.DataView({
                cls: 'menu-picker',
                parentMenu: this.openButton.menu,
                restoreHeight: this.menuMaxHeight,
                style: 'max-height: '+this.menuMaxHeight+'px;',
                enableKeyEvents: this.options.enableKeyEvents,
                store: this.store,
                itemTemplate : _.template([
                    '<div class="style" id="<%= id %>">',
                        '<img src="<%= imageUrl %>" width="' + this.itemWidth + '" height="' + this.itemHeight + '"/>',
                        '<% if (typeof title !== "undefined") {%>',
                            '<span class="title"><%= title %></span>',
                        '<% } %>',
                    '</div>'
                ].join(''))
            });

            // Handle resize
            setInterval(_.bind(this.checkSize, this), 500);

            if (this.options.el) {
                this.render();
            }
        },

        render: function(parentEl) {
            if (!this.rendered) {
                var me = this;

                me.trigger('render:before', me);

                me.cmpEl = me.$el || $(me.el);

                var templateEl = me.template({
                    id      : me.id,
                    cls     : me.cls,
                    style   : me.style
                });

                if (parentEl) {
                    me.setElement(parentEl, false);

                    me.cmpEl = $(templateEl);

                    parentEl.html(me.cmpEl);
                  } else {
                    me.cmpEl.html(templateEl);
                }

                me.rootWidth  = me.cmpEl.width();
                me.rootHeight = me.cmpEl.height();

                me.fieldPicker.render($('.view', me.cmpEl));
                me.openButton.render($('.button', me.cmpEl));
                me.menuPicker.render($('.menu-picker-container', me.cmpEl));

                if (me.openButton.menu.cmpEl) {
                    if (me.openButton.menu.cmpEl) {
                        me.openButton.menu.menuAlignEl = me.cmpEl;
                        me.openButton.menu.cmpEl.css('min-width', me.itemWidth);
                        me.openButton.menu.on('show:before',          _.bind(me.onBeforeShowMenu, me));
                        me.openButton.menu.on('show:after',           _.bind(me.onAfterShowMenu, me));
                        me.openButton.cmpEl.on('hide.bs.dropdown',    _.bind(me.onBeforeHideMenu, me));
                        me.openButton.cmpEl.on('hidden.bs.dropdown',  _.bind(me.onAfterHideMenu, me));
                    }
                }

                if (me.options.hint) {
                    me.cmpEl.attr('data-toggle', 'tooltip');
                    me.cmpEl.tooltip({
                        title       : me.options.hint,
                        placement   : me.options.hintAnchor || 'cursor'
                    });
                }

                me.fieldPicker.on('item:select', _.bind(me.onFieldPickerSelect, me));
                me.menuPicker.on('item:select',  _.bind(me.onMenuPickerSelect, me));
                me.fieldPicker.on('item:click',  _.bind(me.onFieldPickerClick, me));
                me.menuPicker.on('item:click',   _.bind(me.onMenuPickerClick, me));
                me.fieldPicker.on('item:contextmenu', _.bind(me.onPickerItemContextMenu, me));
                me.menuPicker.on('item:contextmenu',  _.bind(me.onPickerItemContextMenu, me));

                me.fieldPicker.el.addEventListener('contextmenu', _.bind(me.onPickerComboContextMenu, me), false);
                me.menuPicker.el.addEventListener('contextmenu', _.bind(me.onPickerComboContextMenu, me), false);

                me.onResize();

                me.rendered = true;

                me.trigger('render:after', me);
            }

            return this;
        },

        checkSize: function() {
            if (this.cmpEl && this.cmpEl.is(':visible')) {
                var me = this,
                    width  = this.cmpEl.width(),
                    height = this.cmpEl.height();

                if (width < this.minWidth) return;

                if (this.rootWidth != width || this.rootHeight != height) {
                    this.rootWidth  = width;
                    this.rootHeight = height;
                    setTimeout(function() {
                        me.openButton.menu.cmpEl.outerWidth();
                        me.rootWidth = me.cmpEl.width();
                    }, 10);
                    this.onResize();
                }
            }
        },

        onResize: function() {
            if (this.openButton) {
                var button = $('button', this.openButton.cmpEl);
                button && button.css({
                    width : $('.button', this.cmpEl).width(),
                    height: $('.button', this.cmpEl).height()
                });

                this.openButton.menu.hide();

                var picker = this.menuPicker;
                if (picker) {
                    var record = picker.getSelectedRec();
                    this.fillComboView(record || picker.store.at(0), !!record, true);

                    picker.onResize();
                }
            }

            if (!this.isSuspendEvents)
                this.trigger('resize', this);
        },

        onBeforeShowMenu: function(e) {
            var me = this;

            if (_.isFunction(me.beforeOpenHandler)){
                me.beforeOpenHandler(me, e);
            } else if (me.openButton.menu.cmpEl) {
                var itemMargin = 0;

                try {
                    var itemEl = $($('.dropdown-menu .dataview.inner .style', me.cmpEl)[0]);
                    itemMargin = itemEl ? (parseInt(itemEl.css('margin-left')) + parseInt(itemEl.css('margin-right'))) : 0;
                } catch(e) {}

                me.openButton.menu.cmpEl.css({
                    'width' : Math.round((me.cmpEl.width() + (itemMargin * me.fieldPicker.store.length))/ me.itemWidth - .2) * (me.itemWidth + itemMargin),
                    'min-height': this.cmpEl.height()
                });
            }

            if (me.options.hint) {
                var tip = me.cmpEl.data('bs.tooltip');
                if (tip) {
                    if (tip.dontShow===undefined)
                        tip.dontShow = true;
                    tip.hide();
                }
            }
            this.menuPicker.selectedBeforeHideRec = null; // for DataView - onKeyDown - Return key
        },

        onBeforeHideMenu: function(e) {
            this.trigger('hide:before', this, e);

            if (Common.UI.Scroller.isMouseCapture())
                e.preventDefault();

            if (this.isStylesNotClosable)
                return false;
        },

        onAfterShowMenu: function(e) {
            var me = this;
            if (me.menuPicker.scroller) {
                me.menuPicker.scroller.update({
                    includePadding: true,
                    suppressScrollX: true,
                    alwaysVisibleY: true
                });
            }
        },

        onAfterHideMenu: function(e, isFromInputControl) {
            this.menuPicker.selectedBeforeHideRec = this.menuPicker.getSelectedRec(); // for DataView - onKeyDown - Return key
            (this.showLast) ? this.menuPicker.showLastSelected() : this.menuPicker.deselectAll();
            this.trigger('hide:after', this, e, isFromInputControl);
        },

        onFieldPickerSelect: function(picker, item, record) {
            //
        },

        onMenuPickerSelect: function(picker, item, record, fromKeyDown) {
            this.needFillComboView = this.disabled;
            if (this.disabled || fromKeyDown===true) return;

            this.fillComboView(record, false);
            if (record && !this.isSuspendEvents)
                this.trigger('select', this, record);
        },

        onFieldPickerClick: function(dataView, itemView, record) {
            if (this.disabled) return;

            if (!this.isSuspendEvents)
                this.trigger('click', this, record);

            if (this.options.hint) {
                var tip = this.cmpEl.data('bs.tooltip');
                if (tip) {
                    if (tip.dontShow===undefined)
                        tip.dontShow = true;
                    tip.hide();
                }
            }

            if (!this.showLast) this.fieldPicker.deselectAll();
        },

        onMenuPickerClick: function(dataView, itemView, record) {
            if (this.disabled) return;

            if (!this.isSuspendEvents)
                this.trigger('click', this, record);
        },

        onPickerItemContextMenu: function(dataView, itemView, record, e) {
            if (this.disabled) return;

            if (!this.isSuspendEvents) {
                this.trigger('contextmenu', this, record, e);
            }
            e.preventDefault();
            e.stopPropagation();
            return false;
        },

        onPickerComboContextMenu: function(mouseEvent) {
            if (this.disabled) return;

            if (!this.isSuspendEvents) {
                this.trigger('contextmenu', this, undefined, mouseEvent);
            }
        },

        setDisabled: function(disabled) {
            this.disabled = disabled;

            if (!this.rendered)
                return;

            this.cmpEl.toggleClass('disabled', disabled);
            $('button', this.openButton.cmpEl).toggleClass('disabled', disabled);
            this.fieldPicker.setDisabled(disabled);

            if (this.needFillComboView && !disabled) {
                var picker = this.menuPicker;
                if (picker) {
                    var record = picker.getSelectedRec();
                    this.fillComboView(record || picker.store.at(0), false);
                }
            }
        },

        isDisabled: function() {
            return this.disabled;
        },

        fillComboView: function(record, forceSelect, forceFill) {
            if (!_.isUndefined(record) && record instanceof Backbone.Model){
                this.needFillComboView = !this.isVisible();

                var me              = this,
                    store           = me.menuPicker.store,
                    fieldPickerEl   = $(me.fieldPicker.el);

                if (store) {
                    if (forceFill || !me.fieldPicker.store.findWhere({'id': record.get('id')})){
                        if (me.itemMarginLeft===undefined) {
                            var div = $($(this.menuPicker.el).find('.inner > div:not(.grouped-data):not(.ps-scrollbar-x-rail):not(.ps-scrollbar-y-rail)')[0]);
                            if (div.length > 0) {
                                me.itemMarginLeft  = parseInt(div.css('margin-left'));
                                me.itemMarginRight = parseInt(div.css('margin-right'));
                                me.itemPaddingLeft  = parseInt(div.css('padding-left'));
                                me.itemPaddingRight = parseInt(div.css('padding-right'));
                                me.itemBorderLeft  = parseInt(div.css('border-left-width'));
                                me.itemBorderRight = parseInt(div.css('border-right-width'));
                            }
                        }

                        var indexRec = store.indexOf(record);
                        if (indexRec < 0)
                            return;

                        var countRec = store.length,
                            maxViewCount = Math.floor(Math.max(fieldPickerEl.width(), me.minWidth) / (me.itemWidth + (me.itemMarginLeft || 0) + (me.itemMarginRight || 0) + (me.itemPaddingLeft || 0) + (me.itemPaddingRight || 0) +
                                                                                                (me.itemBorderLeft || 0) + (me.itemBorderRight || 0))),
                            newStyles = [];

                        if (fieldPickerEl.height() / me.itemHeight > 2)
                            maxViewCount *= Math.floor(fieldPickerEl.height() / me.itemHeight);

                        indexRec = Math.floor(indexRec / maxViewCount) * maxViewCount;
                        if (countRec - indexRec < maxViewCount)
                            indexRec = Math.max(countRec - maxViewCount, 0);
                        for (var index = indexRec, viewCount = 0; index < countRec && viewCount < maxViewCount; index++, viewCount++) {
                            newStyles.push(store.at(index));
                        }

                        me.fieldPicker.store.reset(newStyles);
                    }

                    if (forceSelect) {
                        var selectRecord = me.fieldPicker.store.findWhere({'id': record.get('id')});
                        if (selectRecord){
                            me.suspendEvents();
                            me.fieldPicker.selectRecord(selectRecord, true);
                            me.resumeEvents();
                        }
                    }
                }
            }
        },

        clearComboView: function() {
            this.fieldPicker.store.reset([]);
        },

        selectByIndex: function(index) {
            if (index < 0)
                this.fieldPicker.deselectAll();

            this.menuPicker.selectByIndex(index);
        },

        setItemWidth: function(width) {
            if (this.itemWidth != width)
                this.itemWidth = window.devicePixelRatio > 1 ? width / 2 : width;
        },

        setItemHeight: function(height) {
            if (this.itemHeight != height)
                this.itemHeight = window.devicePixelRatio > 1 ? height / 2 : height;
        },

        removeTips: function() {
            var picker = this.menuPicker;
            _.each(picker.dataViewItems, function(item) {
                var tip = item.$el.data('bs.tooltip');
                if (tip) (tip.tip()).remove();
            }, picker);
        }
    })
});