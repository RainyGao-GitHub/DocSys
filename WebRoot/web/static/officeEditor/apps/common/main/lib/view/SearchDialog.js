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
 *    SearchDialog.js
 *
 *    Created by Maxim Kadushkin on 03 March 2014
 *    Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

/*
*       Usage
*       -----
*
*       Configuration
*       -------------
*
*       @cfg {Boolean} matchcase
*       Show or hide option "Case sensitive"
*
*       @cfg {Boolean} matchword
*       Show or hide option "Whole word"
*
*       @cfg {Boolean} markresult
*       Show or hide option "Highlight results"
*
*
*       Methods
*       -------
*
*       @method show
*       @params {String} mode
*           'search' - dialog has only 'search' options, 'replace' options aren't allowed ;
*           'collapsed' - dialog has all options, 'replace' options are hidden initially
*           undefined value - dialog has all options
* */

 define([
    'common/main/lib/component/Window'
], function () {
    'use strict';

    Common.UI.SearchDialog = Common.UI.Window.extend(_.extend({
        options: {
            width       : 550,
            title       : 'Search & Replace',
            modal       : false,
            cls         : 'search',
            toolclose   : 'hide',
            alias       : 'SearchDialog'
        },

        initialize : function(options) {
            _.extend(this.options, options || {});

            this.template = [
                '<div class="box">',
                    '<div class="input-row">',
                        '<span class="btn-placeholder" id="search-placeholder-btn-options"></span>',
                        '<input type="text" id="sd-text-search" class="input-field form-control" maxlength="255" placeholder="'+this.textSearchStart+'">',
                    '</div>',
                    '<div class="input-row">',
                        '<input type="text" id="sd-text-replace" class="input-field form-control" maxlength="255" placeholder="'+this.textReplaceDef+'">',
                    '</div>',
                    '<div class="input-row">',
                        '<label class="link" id="search-label-replace" result="replaceshow">'+this.txtBtnReplace+'</label>',
                    '</div>',
                '</div>',
                '<div class="separator horizontal"/>',
                '<div class="footer right">',
                    '<button class="btn normal dlg-btn" result="replace">'+this.txtBtnReplace+'</button>',
                    '<button class="btn normal dlg-btn" result="replaceall" style="margin-left: 6px;">'+this.txtBtnReplaceAll+'</button>',
                    '<button class="btn normal dlg-btn iconic" result="back"><span class="icon img-commonctrl back" /></button>',
                    '<button class="btn normal dlg-btn iconic" result="next" style="margin-left: 6px;"><span class="icon img-commonctrl next" /></button>',
                '</div>'
            ].join('');

            this.options.tpl = _.template(this.template)(this.options);

            Common.UI.Window.prototype.initialize.call(this, this.options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);

            this.miMatchCase = new Common.UI.MenuItem({
                caption     : this.textMatchCase,
                checkable   : true
            });

            this.miMatchWord = new Common.UI.MenuItem({
                caption     : this.options.matchwordstr || this.textWholeWords,
                checkable   : true
            });

            this.miHighlight = new Common.UI.MenuItem({
                caption     : this.textHighlight,
                checkable   : true
            });

            this.btnOptions = new Common.UI.Button({
                id          : 'search-btn-options',
                cls         : 'btn-toolbar',
                iconCls     : 'toolbar__icon btn-settings',
//                hint        : me.tipMerge,
                menu        : new Common.UI.Menu({
                    items   : [
                        this.miMatchCase,
                        this.miMatchWord,
                        this.miHighlight
                    ]
                })
            });

            if (this.options.extraoptions) {
                this.btnOptions.menu.addItem({caption:'--'});
                this.options.extraoptions.forEach(function(item){
                    this.btnOptions.menu.addItem(item);
                },this);
            }

            this.btnOptions.render(this.$window.find('#search-placeholder-btn-options'));

            if (!this.options.matchcase) this.miMatchCase.hide();
            if (!this.options.matchword) this.miMatchWord.hide();
            if (!this.options.markresult) this.miHighlight.hide(); else
            if (this.options.markresult.applied) this.miHighlight.setChecked(true,true);
            if (this.options.mode==='search') $(this.$window.find('.input-row').get(2)).hide();

            this.txtSearch = this.$window.find('#sd-text-search');
            this.txtReplace = this.$window.find('#sd-text-replace');
            this.lblReplace = this.$window.find('#search-label-replace');

            this.miHighlight.on('toggle', _.bind(this.onHighlight, this));

            this.$window.find('.btn[result=back]').on('click', _.bind(this.onBtnClick, this, 'back'));
            this.$window.find('.btn[result=next]').on('click', _.bind(this.onBtnClick, this, 'next'));
            this.$window.find('.btn[result=replace]').on('click', _.bind(this.onBtnClick, this, 'replace'));
            this.$window.find('.btn[result=replaceall]').on('click', _.bind(this.onBtnClick, this, 'replaceall'));
            this.$window.find('label[result=replaceshow]').on('click', _.bind(this.onShowReplace, this));
            this.txtSearch.on('keydown', null, 'search', _.bind(this.onKeyPress, this));
            this.txtReplace.on('keydown', null, 'replace', _.bind(this.onKeyPress, this));

            this.on('animate:before', _.bind(this.focus, this));

            return this;
        },

        show: function(mode, text) {
            Common.UI.Window.prototype.show.call(this);

            !this.mode && !mode && (mode = 'search');
            if (mode && this.mode != mode) this.setMode(mode);

            text && this.setSearchText(text);

            if (this.options.markresult && this.miHighlight.checked) {
                this.fireEvent('search:highlight', [this, true]);
            }

            this.focus();
        },

        focus: function() {
            var me  = this;
            setTimeout(function(){
                me.txtSearch.focus();
                me.txtSearch.select();
            }, 10);
        },

        onKeyPress: function(event) {
            if (!this.isLocked()) {
                if (event.keyCode == Common.UI.Keys.RETURN) {
                    if (event.data == 'search')
                        this.onBtnClick('next', event); else
                    if (event.data == 'replace' && this.mode == 'replace') {
                        this.onBtnClick('replace', event);
                    }

                    event.preventDefault();
                    event.stopPropagation();
                } else
                if (event.keyCode == Common.UI.Keys.ESC && $('.asc-loadmask').length<1) {
                    this.hide();
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        },

        onBtnClick: function(action, event) {
            if ( $('.asc-loadmask').length ) return;
            var opts = {
                textsearch  : this.txtSearch.val(),
                textreplace : this.txtReplace.val(),
                matchcase   : this.miMatchCase.checked,
                matchword   : this.miMatchWord.checked,
                highlight   : this.miHighlight.checked
            };
            this.fireEvent('search:'+action, [this, opts]);
        },

        setMode: function(m) {
            this.mode = m;
            var $inputs = this.$window.find('.input-row');

            if (m === 'no-replace') {
                this.setTitle(this.textTitle2);

                $inputs.eq(1).hide();
                $inputs.eq(2).hide();

                this.$window.find('.btn[result=replace]').hide();
                this.$window.find('.btn[result=replaceall]').hide();

                if (this.options.matchcase || this.options.matchword ||this.options.markresult) {
                } else {
                    this.txtSearch.addClass('clear');
                    this.btnOptions.hide();
                }
                this.menuLookin && this.menuLookin.menu.items[1].setDisabled(false);

                this.setHeight(170);
            } else {
                this.txtSearch.removeClass('clear');
                this.setTitle(this.textTitle);

                if (m==='search') {
                    $inputs.eq(2).show();
                    this.lblReplace.text(this.txtBtnReplace);
                    $inputs.eq(1).hide();
                    this.$window.find('.btn[result=replace]').hide();
                    this.$window.find('.btn[result=replaceall]').hide();
                    this.menuLookin && this.menuLookin.menu.items[1].setDisabled(false);
                    this.setHeight(200);
                } else {
                    $inputs.eq(2).show();
                    this.lblReplace.text(this.txtBtnHideReplace);
                    $inputs.eq(1).show();
                    this.$window.find('.btn[result=replace]').show();
                    this.$window.find('.btn[result=replaceall]').show();
                    if (this.menuLookin) {
                        this.menuLookin.menu.items[0].setChecked(true);
                        this.menuLookin.menu.items[1].setDisabled(true);
                    }
                    this.setHeight(230);
                }
            }
        },

        setSearchText: function(value) {
            this.txtSearch && this.txtSearch.val(value);
        },

        onShowReplace: function(e) {
            this.setMode((this.mode=='replace') ? 'search' : 'replace');

            var me  = this;
            _.defer(function(){
                (me.mode=='replace') ? me.txtReplace.focus() : me.txtSearch.focus();
            }, 300);
        },

        onHighlight: function(o, value) {
            this.fireEvent('search:highlight', [this, value]);
        },

        getSettings: function() {
            return {
                textsearch: this.txtSearch.val(),
                matchcase: this.miMatchCase.checked,
                matchword: this.miMatchWord.checked };
        },

        textTitle           : 'Search & Replace',
        textTitle2          : 'Search',
        txtBtnReplace       : 'Replace',
        txtBtnReplaceAll    : 'Replace All',
        textMatchCase       : 'Case sensitive',
        textWholeWords      : 'Whole words only',
        textHighlight       : 'Highlight results',
        textReplaceDef      : 'Enter the replacement text',
        textSearchStart     : 'Enter text for search',
        txtBtnHideReplace   : 'Hide Replace'
    }, Common.UI.SearchDialog || {}));
});