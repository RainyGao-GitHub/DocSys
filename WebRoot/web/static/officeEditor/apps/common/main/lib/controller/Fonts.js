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
 *  Fonts.js
 *
 *  Created by Alexander Yuzhin on 2/11/14
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

if (Common === undefined)
    var Common = {};

Common.Controllers = Common.Controllers || {};

define([
    'core',
    'common/main/lib/collection/Fonts'
], function () { 'use strict';
    Common.Controllers.Fonts = Backbone.Controller.extend((function() {
        var FONT_TYPE_RECENT = 4;

        function isFontSaved(store, rec) {
            var out = rec.get('type') == FONT_TYPE_RECENT,
                i = -1,
                c = store.length,
                su,
                n = rec.get('name');
            while (!out && ++i < c) {
                su = store.at(i);

                if (su.get('type') != FONT_TYPE_RECENT)
                    break;

                out = su.get('name') == n;
            }

            return out;
        }

        function onSelectFont(combo, record) {
            if (combo.showlastused && !isFontSaved(combo.store, record)) {
//                var node = combo.picker.getNode(records[0]);
//
//                var data = records[0].data;
//                var font = {
//                    id: data.id,
//                    name: data.name,
//                    imgidx: data.imgidx,
//                    cloneid: node.querySelector('img').id,
//                    type: FONT_TYPE_RECENT
//                };
//                combo.getStore().insert(0,[font]);
//
//                var separator = combo.picker.getEl().down('.used-fonts-separator');
//                if (!separator) {
//                    separator = document.createElement('div');
//                    separator.setAttribute('class', 'x-menu-item-separator used-fonts-separator');
//                    separator.setAttribute('style', 'padding:0 10px;margin-left: 10px;');
//
//                    node = combo.picker.getNode(combo.getStore().getAt(1));
//                    node.parentNode.insertBefore(separator,node);
//                }
//
//                font = combo.getStore().getAt(5);
//                if (font.data.type==FONT_TYPE_RECENT) {
//                    combo.getStore().remove(font);
//                } else {
//                    var plugin = combo.getPlugin('scrollpane');
//                    if (plugin){plugin.updateScrollPane();}
//                }
            }
        }

        function onApiFontChange(fontobj) {
            Common.NotificationCenter.trigger('fonts:change', fontobj)
        }

        function onApiLoadFonts(fonts, select) {
            var fontsArray = [];
            _.each(fonts, function(font){
                var fontId = font.asc_getFontId();
                fontsArray.push({
                    id          :_.isEmpty(fontId) ? Common.UI.getId() : fontId,
                    name        : font.asc_getFontName(),
//                    displayValue: font.asc_getFontName(),
                    imgidx      : font.asc_getFontThumbnail(),
                    type        : font.asc_getFontType()
                });
            });

            var store = this.getCollection('Common.Collections.Fonts');

            if (store) {
                store.add(fontsArray);
                store.sort();
            }

            Common.NotificationCenter.trigger('fonts:load', store, select);
        }

        return {
            models: [
                'Common.Models.Fonts'
            ],
            collections: [
                'Common.Collections.Fonts'
            ],
            views: [],

            initialize: function() {
                Common.NotificationCenter.on('fonts:select', _.bind(onSelectFont, this))
            },

            onLaunch: function() {
                //
            },

            setApi: function(api) {
                this.api = api;
                this.api.asc_registerCallback('asc_onInitEditorFonts',  _.bind(onApiLoadFonts, this));
                this.api.asc_registerCallback('asc_onFontFamily',       _.bind(onApiFontChange, this));
            }
        }
    })());
});
