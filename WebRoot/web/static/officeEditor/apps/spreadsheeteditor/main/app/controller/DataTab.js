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
 *  DataTab.js
 *
 *  Created by Julia Radzhabova on 30.05.2019
 *  Copyright (c) 2019 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'spreadsheeteditor/main/app/view/DataTab',
    'spreadsheeteditor/main/app/view/GroupDialog',
    'spreadsheeteditor/main/app/view/SortDialog'
], function () {
    'use strict';

    SSE.Controllers.DataTab = Backbone.Controller.extend(_.extend({
        models : [],
        collections : [
        ],
        views : [
            'DataTab'
        ],
        sdkViewName : '#id_main',

        initialize: function () {
            this._state = {
                CSVOptions: new Asc.asc_CTextOptions(0, 4, '')
            };
        },
        onLaunch: function () {
        },

        setApi: function (api) {
            if (api) {
                this.api = api;
                this.api.asc_registerCallback('asc_onSelectionChanged',     _.bind(this.onSelectionChanged, this));
                this.api.asc_registerCallback('asc_onWorksheetLocked',      _.bind(this.onWorksheetLocked, this));
                this.api.asc_registerCallback('asc_onCoAuthoringDisconnect',_.bind(this.onCoAuthoringDisconnect, this));
                Common.NotificationCenter.on('api:disconnect', _.bind(this.onCoAuthoringDisconnect, this));
            }
            return this;
        },

        setConfig: function(config) {
            this.toolbar = config.toolbar;
            this.view = this.createView('DataTab', {
                toolbar: this.toolbar.toolbar
            });
            this.addListeners({
                'DataTab': {
                    'data:group': this.onGroup,
                    'data:ungroup': this.onUngroup,
                    'data:tocolumns': this.onTextToColumn,
                    'data:show': this.onShowClick,
                    'data:hide': this.onHideClick,
                    'data:groupsettings': this.onGroupSettings,
                    'data:sortcustom': this.onCustomSort
                },
                'Statusbar': {
                    'sheet:changed': this.onApiSheetChanged
                }
            });
        },

        SetDisabled: function(state) {
            this.view && this.view.SetDisabled(state);
        },

        getView: function(name) {
            return !name && this.view ?
                this.view : Backbone.Controller.prototype.getView.call(this, name);
        },

        onCoAuthoringDisconnect: function() {
            this.SetDisabled(true);
        },

        onSelectionChanged: function(info) {
            if (!this.toolbar.editMode || !this.view) return;

            // special disable conditions
            Common.Utils.lockControls(SSE.enumLock.multiselectCols, info.asc_getSelectedColsCount()>1, {array: [this.view.btnTextToColumns]});
            Common.Utils.lockControls(SSE.enumLock.multiselect, info.asc_getFlags().asc_getMultiselect(), {array: [this.view.btnTextToColumns]});
        },

        onUngroup: function(type) {
            var me = this;
            if (type=='rows') {
                (me.api.asc_checkAddGroup(true)!==undefined) && me.api.asc_ungroup(true)
            } else if (type=='columns') {
                (me.api.asc_checkAddGroup(true)!==undefined) && me.api.asc_ungroup(false)
            } else if (type=='clear') {
                me.api.asc_clearOutline();
            } else {
                var val = me.api.asc_checkAddGroup(true);
                if (val===null) {
                    (new SSE.Views.GroupDialog({
                        title: me.view.capBtnUngroup,
                        props: 'rows',
                        handler: function (dlg, result) {
                            if (result=='ok') {
                                me.api.asc_ungroup(dlg.getSettings());
                            }
                            Common.NotificationCenter.trigger('edit:complete', me.toolbar);
                        }
                    })).show();
                } else if (val!==undefined) //undefined - error, true - rows, false - columns
                    me.api.asc_ungroup(val);
            }
            Common.NotificationCenter.trigger('edit:complete', me.toolbar);
        },

        onGroup: function(type, checked) {
            if (type=='rows') {
                (this.api.asc_checkAddGroup()!==undefined) && this.api.asc_group(true)
            } else if (type=='columns') {
                (this.api.asc_checkAddGroup()!==undefined) && this.api.asc_group(false)
            } else if (type=='below') {
                this.api.asc_setGroupSummary(checked, false);
            } else if (type=='right') {
                this.api.asc_setGroupSummary(checked, true);
            } else {
                var me = this,
                    val = me.api.asc_checkAddGroup();
                if (val===null) {
                    (new SSE.Views.GroupDialog({
                        title: me.view.capBtnGroup,
                        props: 'rows',
                        handler: function (dlg, result) {
                            if (result=='ok') {
                                me.api.asc_group(dlg.getSettings());
                            }
                            Common.NotificationCenter.trigger('edit:complete', me.toolbar);
                        }
                    })).show();
                } else if (val!==undefined) //undefined - error, true - rows, false - columns
                    me.api.asc_group(val);
            }
            Common.NotificationCenter.trigger('edit:complete', this.toolbar);
        },

        onGroupSettings: function(menu) {
            var value = this.api.asc_getGroupSummaryBelow();
            menu.items[3].setChecked(!!value, true);
            value = this.api.asc_getGroupSummaryRight();
            menu.items[4].setChecked(!!value, true);
        },

        onTextToColumn: function() {
            this.api.asc_TextImport(this._state.CSVOptions, _.bind(this.onTextToColumnCallback, this), false);
        },

        onTextToColumnCallback: function(data) {
            if (!data || !data.length) return;

            var me = this;
            (new Common.Views.OpenDialog({
                title: me.textWizard,
                closable: true,
                type: Common.Utils.importTextType.Columns,
                preview: true,
                previewData: data,
                settings: me._state.CSVOptions,
                api: me.api,
                handler: function (result, encoding, delimiter, delimiterChar) {
                    if (result == 'ok') {
                        if (me && me.api) {
                            me.api.asc_TextToColumns(new Asc.asc_CTextOptions(encoding, delimiter, delimiterChar));
                        }
                    }
                }
            })).show();
        },

        onShowClick: function() {
            this.api.asc_changeGroupDetails(true);
        },

        onHideClick: function() {
            this.api.asc_changeGroupDetails(false);
        },

        onCustomSort: function() {
            var me = this;
            if (this.api) {
                var res = this.api.asc_sortCellsRangeExpand();
                if (res) {
                    var config = {
                        width: 500,
                        title: this.toolbar.txtSorting,
                        msg: this.toolbar.txtExpandSort,

                        buttons: [  {caption: this.toolbar.txtExpand, primary: true, value: 'expand'},
                            {caption: this.toolbar.txtSortSelected, primary: true, value: 'sort'},
                            'cancel'],
                        callback: function(btn){
                            if (btn == 'expand' || btn == 'sort') {
                                setTimeout(function(){
                                    me.showCustomSort(btn == 'expand');
                                },1);
                            }
                        }
                    };
                    Common.UI.alert(config);
                } else
                    me.showCustomSort(res !== null);
            }
        },

        showCustomSort: function(expand) {
            var me = this,
                props = me.api.asc_getSortProps(expand);
                // props = new Asc.CSortProperties();
            if (props) {
                (new SSE.Views.SortDialog({
                    props: props,
                    api: me.api,
                    handler: function (result, settings) {
                        if (me && me.api) {
                            me.api.asc_setSortProps(settings, result != 'ok');
                        }
                    }
                })).show();
            }
        },

        onWorksheetLocked: function(index,locked) {
            if (index == this.api.asc_getActiveWorksheetIndex()) {
                Common.Utils.lockControls(SSE.enumLock.sheetLock, locked, {array: this.view.btnsSortDown.concat(this.view.btnsSortUp, this.view.btnCustomSort, this.view.btnGroup, this.view.btnUngroup)});
            }
        },

        onApiSheetChanged: function() {
            if (!this.toolbar.mode || !this.toolbar.mode.isEdit || this.toolbar.mode.isEditDiagram || this.toolbar.mode.isEditMailMerge) return;

            var currentSheet = this.api.asc_getActiveWorksheetIndex();
            this.onWorksheetLocked(currentSheet, this.api.asc_isWorksheetLockedOrDeleted(currentSheet));
        },

        textWizard: 'Text to Columns Wizard'

    }, SSE.Controllers.DataTab || {}));
});