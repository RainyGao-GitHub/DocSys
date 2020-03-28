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
 *  ToggleManager.js
 *
 *  Created by Alexander Yuzhin on 1/28/14
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */


if (Common === undefined)
    var Common = {};

define([
    'common/main/lib/component/BaseView'
], function () {
    'use strict';

    var groups = {};

    function toggleGroup(cmp, state) {
        var g, i, l;
        if (state) {
            g = groups[cmp.toggleGroup];
            for (i = 0, l = g.length; i < l; i++) {
                if (g[i] !== cmp) {
                    if (g[i].isActive) {
                        g[i].isActive() && g[i].toggle(false);
                    } else {
                        g[i].toggle(false);
                    }
                }
            }
        }
    }

    /**
     * Private utility class used by component
     */
    Common.UI.ToggleManager = {
        register: function(cmp) {
            if (!cmp.toggleGroup) {
                return;
            }
            var group = groups[cmp.toggleGroup];
            if (!group) {
                group = groups[cmp.toggleGroup] = [];
            }
            group.push(cmp);
            cmp.on('toggle', toggleGroup);
        },

        unregister: function(cmp) {
            if (!cmp.toggleGroup) {
                return;
            }
            var group = groups[cmp.toggleGroup];
            if (group) {
                _.without(group, cmp);
                cmp.off('toggle', toggleGroup);
            }
        },

        /**
         * Gets the toggled components in the passed group or null
         * @param {String} group
         * @return {Common.UI.BaseView}
         */
        getToggled: function(group) {
            var g = groups[group],
                i = 0,
                len;
            if (g) {
                for (len = g.length; i < len; i++) {
                    if (g[i].pressed === true ||
                        g[i].checked === true) {
                        return g[i];
                    }
                }
            }
            return null;
        }
    }
});