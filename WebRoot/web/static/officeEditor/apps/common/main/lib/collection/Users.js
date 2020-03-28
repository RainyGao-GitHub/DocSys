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
 *    Users.js
 *
 *    Collection
 *
 *    Created by Maxim Kadushkin on 27 February 2014
 *    Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'backbone',
    'common/main/lib/model/User'
], function(Backbone){
    'use strict';

    Common.Collections = Common.Collections || {};

    Common.Collections.Users = Backbone.Collection.extend({
        model: Common.Models.User,

        getOnlineCount: function() {
            var count = 0;
            this.each(function(user){
                user.get('online') && ++count;
            });

            return count;
        },

        getEditingCount: function() {
            return this.filter(function(item){return item.get('online') && !item.get('view')}).length;
        },

        getEditingOriginalCount: function() {
            return this.chain().filter(function(item){return item.get('online') && !item.get('view')}).groupBy(function(item) {return item.get('idOriginal');}).size().value();
        },

        findUser: function(id) {
            return this.find(
                function(model){
                    return model.get('id') == id;
                });
        },

        findOriginalUser: function(id) {
            return this.find(
                function(model){
                    return model.get('idOriginal') == id;
                });
        }
    });

    Common.Collections.HistoryUsers = Backbone.Collection.extend({
        model: Common.Models.User,

        findUser: function(id) {
            return this.find(
                function(model){
                    return model.get('id') == id;
                });
        }
    });
});
