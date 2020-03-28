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
 *  RadioBox.js
 *
 *  Created by Julia Radzhabova on 2/26/14
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */
/**
 * Radiobox can be in two states: true or false.
 * To get the radiobox state use getValue() function. It can return true/false.
 *
 * @property {String} name
 *  The name of the group of radioboxes.
 *
 *  name: 'group-name',
 *
 *  @property {Boolean} checked
 *  Initial state of radiobox.
 *
 *  checked: false,
 *
 * **/

   if (Common === undefined)
    var Common = {};

define([
    'common/main/lib/component/BaseView',
    'underscore'
], function (base, _) {
    'use strict';

    Common.UI.RadioBox = Common.UI.BaseView.extend({

        options : {
            labelText: ''
        },

        disabled    : false,
        rendered    : false,

        template    : _.template('<label class="radiobox"><input type="radio" name="<%= name %>" id="<%= id %>" class="button__radiobox">' +
                                    '<label for="<%= id %>" class="radiobox__shape" /><span><%= labelText %></span></label>'),

        initialize : function(options) {
            Common.UI.BaseView.prototype.initialize.call(this, options);

            var me = this;

            this.name =  this.options.name || Common.UI.getId();

            this.render();

            if (this.options.disabled)
                this.setDisabled(this.options.disabled);

            if (this.options.checked!==undefined)
                this.setValue(this.options.checked, true);

            // handle events
            this.$radio.on('click', _.bind(this.onItemCheck, this));
        },

        render: function () {
            var el = this.$el || $(this.el);
            el.html(this.template({
                labelText: this.options.labelText,
                name: this.name,
                id: Common.UI.getId('rdb-')
            }));

            this.$radio = el.find('input[type=radio]');
            this.$label = el.find('label.radiobox');
            this.rendered = true;

            return this;
        },

        setDisabled: function(disabled) {
            if (!this.rendered)
                return;

            if (disabled !== this.disabled) {
                this.$label.toggleClass('disabled', disabled);
                this.$radio.toggleClass('disabled', disabled);
                (disabled) ? this.$radio.attr({disabled: disabled}) : this.$radio.removeAttr('disabled');
            }

            this.disabled = disabled;
        },

        isDisabled: function() {
            return this.disabled;
        },

        onItemCheck: function (e) {
            if (!this.disabled) this.setValue(true);
        },

        setRawValue: function(value) {
            var value = (value === true || value === 'true' || value === '1' || value === 1 );
            $('input[type=radio][name=' + this.name + ']').removeClass('checked');
            this.$radio.toggleClass('checked', value);
            this.$radio.prop('checked', value);
        },

        setValue: function(value, suspendchange) {
            if (this.rendered) {
                var lastValue = this.$radio.hasClass('checked');
                this.setRawValue(value);
                if (suspendchange !== true && lastValue !== value)
                    this.trigger('change', this, this.$radio.is(':checked'));
            } else {
                this.options.checked = value;
            }
        },

        getValue: function() {
            return this.$radio.is(':checked');
        },

        setCaption: function(text) {
            this.$label.find('span').text(text);
        }
    });
});