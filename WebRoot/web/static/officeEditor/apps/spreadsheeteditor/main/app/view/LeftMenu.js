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
define([
    'text!spreadsheeteditor/main/app/template/LeftMenu.template',
    'jquery',
    'underscore',
    'backbone',
    'common/main/lib/component/Button',
    'common/main/lib/view/About',
    /** coauthoring begin **/
    'common/main/lib/view/Comments',
    'common/main/lib/view/Chat',
    /** coauthoring end **/
    'common/main/lib/view/SearchDialog',
    'common/main/lib/view/Plugins',
    'spreadsheeteditor/main/app/view/FileMenu'
], function (menuTemplate, $, _, Backbone) {
    'use strict';

    var SCALE_MIN = 40;
    var MENU_SCALE_PART = 300;

    SSE.Views.LeftMenu = Backbone.View.extend(_.extend({
        el: '#left-menu',

        template: _.template(menuTemplate),

        // Delegated events for creating new items, and clearing completed ones.
        events: function() {
            return {
                /** coauthoring begin **/
                'click #left-btn-comments': _.bind(this.onCoauthOptions, this),
                'click #left-btn-chat': _.bind(this.onCoauthOptions, this),
                /** coauthoring end **/
                'click #left-btn-plugins': _.bind(this.onCoauthOptions, this),
                'click #left-btn-spellcheck': _.bind(this.onCoauthOptions, this),
                'click #left-btn-support': function() {
                    var config = this.mode.customization;
                    config && !!config.feedback && !!config.feedback.url ?
                        window.open(config.feedback.url) :
                        window.open('{{SUPPORT_URL}}');
                }
            }
        },

        initialize: function () {
            this.minimizedMode = true;
            this._state = {};
        },

        render: function () {
            var $markup = $(this.template({}));

            this.btnSearch = new Common.UI.Button({
                action: 'search',
                el: $markup.elementById('#left-btn-search'),
                hint: this.tipSearch + Common.Utils.String.platformKey('Ctrl+F'),
                disabled: true,
                enableToggle: true
            });

            this.btnAbout = new Common.UI.Button({
                action: 'about',
                el: $markup.elementById('#left-btn-about'),
                hint: this.tipAbout,
                enableToggle: true,
                disabled: true,
                toggleGroup: 'leftMenuGroup'
            });

            this.btnSupport = new Common.UI.Button({
                action: 'support',
                el: $markup.elementById('#left-btn-support'),
                hint: this.tipSupport,
                disabled: true
            });

            /** coauthoring begin **/
            this.btnComments = new Common.UI.Button({
                el: $markup.elementById('#left-btn-comments'),
                hint: this.tipComments +  Common.Utils.String.platformKey('Ctrl+Shift+H'),
                enableToggle: true,
                disabled: true,
                toggleGroup: 'leftMenuGroup'
            });

            this.btnChat = new Common.UI.Button({
                el: $markup.elementById('#left-btn-chat'),
                hint: this.tipChat + Common.Utils.String.platformKey('Alt+Q'),
                enableToggle: true,
                disabled: true,
                toggleGroup: 'leftMenuGroup'
            });

            this.btnComments.hide();
            this.btnChat.hide();

            this.btnComments.on('toggle',       this.onBtnCommentsToggle.bind(this));
            this.btnComments.on('click',        this.onBtnMenuClick.bind(this));
            this.btnChat.on('click',            this.onBtnMenuClick.bind(this));
            /** coauthoring end **/

            this.btnPlugins = new Common.UI.Button({
                el: $markup.elementById('#left-btn-plugins'),
                hint: this.tipPlugins,
                enableToggle: true,
                disabled: true,
                toggleGroup: 'leftMenuGroup'
            });
            this.btnPlugins.hide();
            this.btnPlugins.on('click',         _.bind(this.onBtnMenuClick, this));

            this.btnSpellcheck = new Common.UI.Button({
                el: $markup.elementById('#left-btn-spellcheck'),
                hint: this.tipSpellcheck,
                enableToggle: true,
                disabled: true,
                toggleGroup: 'leftMenuGroup'
            });
            this.btnSpellcheck.hide();
            this.btnSpellcheck.on('click',      _.bind(this.onBtnMenuClick, this));

            this.btnSearch.on('click',          _.bind(this.onBtnMenuClick, this));
            this.btnAbout.on('toggle',          _.bind(this.onBtnMenuToggle, this));

            this.menuFile = new SSE.Views.FileMenu({});
            this.btnAbout.panel = (new Common.Views.About({el: '#about-menu-panel', appName: 'Spreadsheet Editor'}));
            this.$el.html($markup);

            return this;
        },

        onBtnMenuToggle: function(btn, state) {
            if (state) {
                btn.panel['show']();
                if (!this._state.pluginIsRunning)
                    this.$el.width(SCALE_MIN);

                if (this.btnSearch.isActive())
                    this.btnSearch.toggle(false);
            } else {
                btn.panel['hide']();
            }
            SSE.getController('Toolbar').DisableToolbar(state==true);
            Common.NotificationCenter.trigger('layout:changed', 'leftmenu');
        },

        onBtnCommentsToggle: function(btn, state) {
            if (!state)
                this.fireEvent('comments:hide', this);
        },

        onBtnMenuClick: function(btn, e) {
            this.btnAbout.toggle(false);

            if (btn.options.action == 'search') {
            } else {
                if (btn.pressed) {
                    if (!(this.$el.width() > SCALE_MIN)) {
                        this.$el.width(Common.localStorage.getItem('sse-mainmenu-width') || MENU_SCALE_PART);
                    }
                } else if (!this._state.pluginIsRunning){
                    Common.localStorage.setItem('sse-mainmenu-width',this.$el.width());
                    this.$el.width(SCALE_MIN);
                }
            }

//            this.btnChat.id == btn.id && !this.btnChat.pressed && this.fireEvent('chat:hide', this);
            Common.NotificationCenter.trigger('layout:changed', 'leftmenu');
        },

        /** coauthoring begin **/
        onCoauthOptions: function(e) {
            if (this.mode.canCoAuthoring) {
                if (this.mode.canViewComments) {
                    if (this.btnComments.pressed && this.btnComments.$el.hasClass('notify'))
                        this.btnComments.$el.removeClass('notify');
                    this.panelComments[this.btnComments.pressed?'show':'hide']();
                    this.fireEvent((this.btnComments.pressed) ? 'comments:show' : 'comments:hide', this);
                }
               if (this.mode.canChat) {
                   if (this.btnChat.pressed) {
                       if (this.btnChat.$el.hasClass('notify'))
                           this.btnChat.$el.removeClass('notify');

                       this.panelChat.show();
                       this.panelChat.focus();
                   } else
                        this.panelChat['hide']();
               }
            }
            if (this.panelSpellcheck) {
                if (this.btnSpellcheck.pressed) {
                    this.panelSpellcheck.show();
                } else
                    this.panelSpellcheck['hide']();
            }
            // if (this.mode.canPlugins && this.panelPlugins) {
            //     if (this.btnPlugins.pressed) {
            //         this.panelPlugins.show();
            //     } else
            //         this.panelPlugins['hide']();
            // }
        },

        setOptionsPanel: function(name, panel) {
            if (name == 'chat') {
                this.panelChat = panel.render('#left-panel-chat');
            } else if (name == 'comment') {
                this.panelComments = panel;
            } else
            if (name == 'plugins' && !this.panelPlugins) {
                this.panelPlugins = panel.render('#left-panel-plugins');
            } else
            if (name == 'spellcheck' && !this.panelSpellcheck) {
                this.panelSpellcheck = panel.render('#left-panel-spellcheck');
            }
        },

        markCoauthOptions: function(opt, ignoreDisabled) {
            if (opt=='chat' && this.btnChat.isVisible() &&
                    !this.btnChat.isDisabled() && !this.btnChat.pressed) {
                this.btnChat.$el.addClass('notify');
            }
            if (opt=='comments' && this.btnComments.isVisible() && !this.btnComments.pressed &&
                                (!this.btnComments.isDisabled() || ignoreDisabled) ) {
                this.btnComments.$el.addClass('notify');
            }
        },
        /** coauthoring end **/

        close: function(menu) {
            this.btnAbout.toggle(false);
            if (!this._state.pluginIsRunning)
                this.$el.width(SCALE_MIN);
            /** coauthoring begin **/
            if (this.mode.canCoAuthoring) {
                if (this.mode.canViewComments) {
                    this.panelComments['hide']();
                    if (this.btnComments.pressed)
                        this.fireEvent('comments:hide', this);
                    this.btnComments.toggle(false, true);
                }
                if (this.mode.canChat) {
                    this.panelChat['hide']();
                    this.btnChat.toggle(false);
                }
            }
            /** coauthoring end **/
            if (this.mode.canPlugins && this.panelPlugins && !this._state.pluginIsRunning) {
                this.panelPlugins['hide']();
                this.btnPlugins.toggle(false, true);
            }
            if (this.panelSpellcheck) {
                this.panelSpellcheck['hide']();
                this.btnSpellcheck.toggle(false, true);
            }
        },

        isOpened: function() {
            var isopened = this.btnSearch.pressed;
            /** coauthoring begin **/
            !isopened && (isopened = this.btnComments.pressed || this.btnChat.pressed);
            /** coauthoring end **/
            return isopened;
        },

        disableMenu: function(menu, disable) {
            this.btnAbout.setDisabled(false);
            this.btnSupport.setDisabled(false);
            this.btnSearch.setDisabled(false);
            /** coauthoring begin **/
            this.btnComments.setDisabled(false);
            this.btnChat.setDisabled(false);
            /** coauthoring end **/
            this.btnPlugins.setDisabled(false);
            this.btnSpellcheck.setDisabled(false);
        },

        showMenu: function(menu) {
            var re = /^(\w+):?(\w*)$/.exec(menu);
            if ( re[1] == 'file' ) {
                this.menuFile.show(re[2].length ? re[2] : undefined);
            } else {
                /** coauthoring begin **/
                if (menu == 'chat') {
                    if (this.btnChat.isVisible() &&
                            !this.btnChat.isDisabled() && !this.btnChat.pressed) {
                        this.btnChat.toggle(true);
                        this.onBtnMenuClick(this.btnChat);
                        this.onCoauthOptions();
                        this.panelChat.focus();
                    }
                } else
                if (menu == 'comments') {
                    if (this.btnComments.isVisible() &&
                            !this.btnComments.isDisabled() && !this.btnComments.pressed) {
                        this.btnComments.toggle(true);
                        this.onBtnMenuClick(this.btnComments);
                        this.onCoauthOptions();
                        this.btnComments.$el.focus();
                    }
                }
                /** coauthoring end **/
            }
        },

        getMenu: function(type) {
            switch (type) {
            case 'file': return this.menuFile;
            case 'about': return this.btnAbout.panel;
            default: return null;
            }
        },

        setMode: function(mode) {
            this.mode = mode;
            this.btnAbout.panel.setMode(mode);
            return this;
        },

        setDeveloperMode: function(mode) {
            if ( !this.$el.is(':visible') ) return;

            if (!this.developerHint) {
                this.developerHint = $('<div id="developer-hint">' + ((mode == Asc.c_oLicenseMode.Trial) ? this.txtTrial : this.txtDeveloper) + '</div>').appendTo(this.$el);
                this.devHeight = this.developerHint.outerHeight();
                $(window).on('resize', _.bind(this.onWindowResize, this));
            }
            this.developerHint.toggleClass('hidden', !mode);

            var btns = this.$el.find('button.btn-category:visible'),
                lastbtn = (btns.length>0) ? $(btns[btns.length-1]) : null;
            this.minDevPosition = (lastbtn) ? (lastbtn.offset().top - lastbtn.offsetParent().offset().top + lastbtn.height() + 20) : 20;
            this.onWindowResize();
        },

        onWindowResize: function() {
            this.developerHint.css('top', Math.max((this.$el.height()-this.devHeight)/2, this.minDevPosition));
        },

        /** coauthoring begin **/
        tipComments : 'Comments',
        tipChat     : 'Chat',
        /** coauthoring end **/
        tipAbout    : 'About',
        tipSupport  : 'Feedback & Support',
        tipFile     : 'File',
        tipSearch   : 'Search',
        tipPlugins  : 'Plugins',
        txtDeveloper: 'DEVELOPER MODE',
        txtTrial: 'TRIAL MODE',
        tipSpellcheck: 'Spell checking'
    }, SSE.Views.LeftMenu || {}));
});
