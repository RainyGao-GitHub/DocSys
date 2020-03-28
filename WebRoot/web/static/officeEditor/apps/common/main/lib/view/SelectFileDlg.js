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
 * User: Julia.Radzhabova
 * Date: 09.02.15
 */

define([
    'common/main/lib/component/Window',
    'common/main/lib/component/LoadMask'
], function () { 'use strict';

    Common.Views.SelectFileDlg = Common.UI.Window.extend(_.extend({
        initialize : function(options) {
            var _options = {};
            _.extend(_options,  {
                title: this.textTitle,
                width: 1024,
                height: 621,
                header: true
            }, options);

            this.template = [
                '<div id="id-select-file-placeholder"></div>'
            ].join('');

            _options.tpl = _.template(this.template)(_options);

            this.fileChoiceUrl = options.fileChoiceUrl || '';
            Common.UI.Window.prototype.initialize.call(this, _options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);
            this.$window.find('> .body').css({height: 'auto', overflow: 'hidden'});

            var iframe = document.createElement("iframe");
            iframe.width        = '100%';
            iframe.height       = 585;
            iframe.align        = "top";
            iframe.frameBorder  = 0;
            iframe.scrolling    = "no";
            iframe.onload       = _.bind(this._onLoad,this);
            $('#id-select-file-placeholder').append(iframe);

            this.loadMask = new Common.UI.LoadMask({owner: $('#id-select-file-placeholder')});
            this.loadMask.setTitle(this.textLoading);
            this.loadMask.show();

            iframe.src = this.fileChoiceUrl;

            var me = this;
            this._eventfunc = function(msg) {
                me._onWindowMessage(msg);
            };
            this._bindWindowEvents.call(this);

            this.on('close', function(obj){
                me._unbindWindowEvents();
            });
        },

        _bindWindowEvents: function() {
            if (window.addEventListener) {
                window.addEventListener("message", this._eventfunc, false)
            } else if (window.attachEvent) {
                window.attachEvent("onmessage", this._eventfunc);
            }
        },

        _unbindWindowEvents: function() {
            if (window.removeEventListener) {
                window.removeEventListener("message", this._eventfunc)
            } else if (window.detachEvent) {
                window.detachEvent("onmessage", this._eventfunc);
            }
        },

        _onWindowMessage: function(msg) {
            // TODO: check message origin
            if (msg && window.JSON) {
                try {
                    this._onMessage.call(this, window.JSON.parse(msg.data));
                } catch(e) {}
            }
        },

        _onMessage: function(msg) {
            if (msg && msg.Referer == "onlyoffice" && msg.file !== undefined) {
                Common.NotificationCenter.trigger('window:close', this);
                var me = this;
                setTimeout(function() {
                    if ( !_.isEmpty(msg.file) ) {
                        me.trigger('selectfile', me, msg.file);
                    }
                }, 50);
            }
        },

        _onLoad: function() {
            if (this.loadMask)
                this.loadMask.hide();
        },

        textTitle   : 'Select Data Source',
        textLoading : 'Loading'
    }, Common.Views.SelectFileDlg || {}));
});
