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
 *  ControlSettingsDialog.js.js
 *
 *  Created by Julia Radzhabova on 12.12.2017
 *  Copyright (c) 2018 Ascensio System SIA. All rights reserved.
 *
 */

define([ 'text!documenteditor/main/app/template/ControlSettingsDialog.template',
    'common/main/lib/util/utils',
    'common/main/lib/component/CheckBox',
    'common/main/lib/component/InputField',
    'common/main/lib/view/AdvancedSettingsWindow',
    'common/main/lib/view/SymbolTableDialog',
    'documenteditor/main/app/view/EditListItemDialog'
], function (contentTemplate) { 'use strict';

    DE.Views.ControlSettingsDialog = Common.Views.AdvancedSettingsWindow.extend(_.extend({
        options: {
            contentWidth: 310,
            height: 392,
            toggleGroup: 'control-adv-settings-group',
            storageName: 'de-control-settings-adv-category'
        },

        initialize : function(options) {
            var me = this;

            _.extend(this.options, {
                title: this.textTitle,
                items: [
                    {panelId: 'id-adv-control-settings-general', panelCaption: this.strGeneral},
                    {panelId: 'id-adv-control-settings-lock',    panelCaption: this.textLock},
                    {panelId: 'id-adv-control-settings-list',    panelCaption: this.textCombobox},
                    {panelId: 'id-adv-control-settings-date',    panelCaption: this.textDate},
                    {panelId: 'id-adv-control-settings-checkbox',panelCaption: this.textCheckbox}
                ],
                contentTemplate: _.template(contentTemplate)({
                    scope: this
                })
            }, options);

            this.handler    = options.handler;
            this.props      = options.props;
            this.api        = options.api;

            Common.Views.AdvancedSettingsWindow.prototype.initialize.call(this, this.options);
        },

        render: function() {
            Common.Views.AdvancedSettingsWindow.prototype.render.call(this);
            var me = this;

            this.txtName = new Common.UI.InputField({
                el          : $('#control-settings-txt-name'),
                allowBlank  : true,
                validateOnChange: false,
                validateOnBlur: false,
                style       : 'width: 100%;',
                maxLength: 64,
                value       : ''
            });

            this.txtTag = new Common.UI.InputField({
                el          : $('#control-settings-txt-tag'),
                allowBlank  : true,
                validateOnChange: false,
                validateOnBlur: false,
                style       : 'width: 100%;',
                maxLength: 64,
                value       : ''
            });

            this.cmbShow = new Common.UI.ComboBox({
                el: $('#control-settings-combo-show'),
                cls: 'input-group-nr',
                menuStyle: 'min-width: 120px;',
                editable: false,
                data: [
                    { displayValue: this.textBox,   value: Asc.c_oAscSdtAppearance.Frame },
                    { displayValue: this.textNone,  value: Asc.c_oAscSdtAppearance.Hidden }
                ]
            });
            this.cmbShow.setValue(Asc.c_oAscSdtAppearance.Frame);

            this.btnColor = new Common.UI.ColorButton({
                style: "width:45px;",
                menu        : new Common.UI.Menu({
                    additionalAlign: this.menuAddAlign,
                    items: [
                        {
                            id: 'control-settings-system-color',
                            caption: this.textSystemColor,
                            template: _.template('<a tabindex="-1" type="menuitem"><span class="menu-item-icon" style="background-image: none; width: 12px; height: 12px; margin: 1px 7px 0 -7px; background-color: #dcdcdc;"></span><%= caption %></a>')
                        },
                        {caption: '--'},
                        { template: _.template('<div id="control-settings-color-menu" style="width: 169px; height: 220px; margin: 10px;"></div>') },
                        { template: _.template('<a id="control-settings-color-new" style="padding-left:12px;">' + me.textNewColor + '</a>') }
                    ]
                })
            });

            this.btnColor.on('render:after', function(btn) {
                me.colors = new Common.UI.ThemeColorPalette({
                    el: $('#control-settings-color-menu')
                });
                me.colors.on('select', _.bind(me.onColorsSelect, me));
            });
            this.btnColor.render( $('#control-settings-color-btn'));
            this.btnColor.setColor('000000');
            this.btnColor.menu.items[3].on('click',  _.bind(this.addNewColor, this, this.colors, this.btnColor));
            $('#control-settings-system-color').on('click', _.bind(this.onSystemColor, this));

            this.btnApplyAll = new Common.UI.Button({
                el: $('#control-settings-btn-all')
            });
            this.btnApplyAll.on('click', _.bind(this.applyAllClick, this));

            this.chLockDelete = new Common.UI.CheckBox({
                el: $('#control-settings-chb-lock-delete'),
                labelText: this.txtLockDelete
            });

            this.chLockEdit = new Common.UI.CheckBox({
                el: $('#control-settings-chb-lock-edit'),
                labelText: this.txtLockEdit
            });

            // combobox & dropdown list
            this.list = new Common.UI.ListView({
                el: $('#control-settings-list', this.$window),
                store: new Common.UI.DataViewStore(),
                emptyText: '',
                template: _.template(['<div class="listview inner" style=""></div>'].join('')),
                itemTemplate: _.template([
                    '<div id="<%= id %>" class="list-item" style="width: 100%;display:inline-block;">',
                    '<div style="width:90px;display: inline-block;vertical-align: middle; overflow: hidden; text-overflow: ellipsis;white-space: pre;margin-right: 5px;"><%= name %></div>',
                    '<div style="width:90px;display: inline-block;vertical-align: middle; overflow: hidden; text-overflow: ellipsis;white-space: pre;"><%= value %></div>',
                    '</div>'
                ].join(''))
            });
            this.list.on('item:select', _.bind(this.onSelectItem, this));

            this.btnAdd = new Common.UI.Button({
                el: $('#control-settings-btn-add')
            });
            this.btnAdd.on('click', _.bind(this.onAddItem, this));

            this.btnChange = new Common.UI.Button({
                el: $('#control-settings-btn-change')
            });
            this.btnChange.on('click', _.bind(this.onChangeItem, this));

            this.btnDelete = new Common.UI.Button({
                el: $('#control-settings-btn-delete')
            });
            this.btnDelete.on('click', _.bind(this.onDeleteItem, this));

            this.btnUp = new Common.UI.Button({
                el: $('#control-settings-btn-up')
            });
            this.btnUp.on('click', _.bind(this.onMoveItem, this, true));

            this.btnDown = new Common.UI.Button({
                el: $('#control-settings-btn-down')
            });
            this.btnDown.on('click', _.bind(this.onMoveItem, this, false));

            // date picker
            var data = [{ value: 0x042C }, { value: 0x0402 }, { value: 0x0405 }, { value: 0x0407 },  {value: 0x0807}, { value: 0x0408 }, { value: 0x0C09 }, { value: 0x0809 }, { value: 0x0409 }, { value: 0x0C0A }, { value: 0x080A },
                { value: 0x040B }, { value: 0x040C }, { value: 0x0410 }, { value: 0x0411 }, { value: 0x0412 }, { value: 0x0426 }, { value: 0x0413 }, { value: 0x0415 }, { value: 0x0416 },
                { value: 0x0816 }, { value: 0x0419 }, { value: 0x041B }, { value: 0x0424 }, { value: 0x081D }, { value: 0x041D }, { value: 0x041F }, { value: 0x0422 }, { value: 0x042A }, { value: 0x0804 }];
            data.forEach(function(item) {
                var langinfo = Common.util.LanguageInfo.getLocalLanguageName(item.value);
                item.displayValue = langinfo[1];
                item.langName = langinfo[0];
            });

            this.cmbLang = new Common.UI.ComboBox({
                el          : $('#control-settings-lang'),
                menuStyle   : 'min-width: 100%; max-height: 185px;',
                cls         : 'input-group-nr',
                editable    : false,
                data        : data
            });
            this.cmbLang.setValue(0x0409);
            this.cmbLang.on('selected',function(combo, record) {
                me.updateFormats(record.value);
            });

            this.listFormats = new Common.UI.ListView({
                el: $('#control-settings-format'),
                store: new Common.UI.DataViewStore(),
                scrollAlwaysVisible: true
            });
            this.listFormats.on('item:select', _.bind(this.onSelectFormat, this));

            this.txtDate = new Common.UI.InputField({
                el          : $('#control-settings-txt-format'),
                allowBlank  : true,
                validateOnChange: false,
                validateOnBlur: false,
                style       : 'width: 100%;',
                value       : ''
            });

            // Check Box
            this.btnEditChecked = new Common.UI.Button({
                el: $('#control-settings-btn-checked-edit'),
                hint: this.tipChange
            });
            this.btnEditChecked.cmpEl.css({'font-size': '16px', 'line-height': '16px'});
            this.btnEditChecked.on('click', _.bind(this.onEditCheckbox, this, true));

            this.btnEditUnchecked = new Common.UI.Button({
                el: $('#control-settings-btn-unchecked-edit'),
                hint: this.tipChange
            });
            this.btnEditUnchecked.cmpEl.css({'font-size': '16px', 'line-height': '16px'});
            this.btnEditUnchecked.on('click', _.bind(this.onEditCheckbox, this, false));

            this.afterRender();
        },

        onColorsSelect: function(picker, color) {
            this.btnColor.setColor(color);
            var clr_item = this.btnColor.menu.$el.find('#control-settings-system-color > a');
            clr_item.hasClass('selected') && clr_item.removeClass('selected');
            this.isSystemColor = false;
        },

        updateThemeColors: function() {
            this.colors.updateColors(Common.Utils.ThemeColor.getEffectColors(), Common.Utils.ThemeColor.getStandartColors());
        },

        addNewColor: function(picker, btn) {
            picker.addNewColor((typeof(btn.color) == 'object') ? btn.color.color : btn.color);
        },

        onSystemColor: function(e) {
            var color = Common.Utils.ThemeColor.getHexColor(220, 220, 220);
            this.btnColor.setColor(color);
            this.colors.clearSelection();
            var clr_item = this.btnColor.menu.$el.find('#control-settings-system-color > a');
            !clr_item.hasClass('selected') && clr_item.addClass('selected');
            this.isSystemColor = true;
        },

        afterRender: function() {
            this.updateThemeColors();
            this._setDefaults(this.props);
            if (this.storageName) {
                var value = Common.localStorage.getItem(this.storageName);
                this.setActiveCategory((value!==null) ? parseInt(value) : 0);
            }
        },

        show: function() {
            Common.Views.AdvancedSettingsWindow.prototype.show.apply(this, arguments);
        },

        _setDefaults: function (props) {
            if (props) {
                var val = props.get_Alias();
                this.txtName.setValue(val ? val : '');

                val = props.get_Tag();
                this.txtTag.setValue(val ? val : '');

                val = props.get_Appearance();
                (val!==null && val!==undefined) && this.cmbShow.setValue(val);

                val = props.get_Color();
                this.isSystemColor = (val===null);
                if (val) {
                    val = Common.Utils.ThemeColor.getHexColor(val.get_r(), val.get_g(), val.get_b());
                    this.colors.selectByRGB(val,true);
                } else {
                    this.colors.clearSelection();
                    var clr_item = this.btnColor.menu.$el.find('#control-settings-system-color > a');
                    !clr_item.hasClass('selected') && clr_item.addClass('selected');
                    val = Common.Utils.ThemeColor.getHexColor(220, 220, 220);
                }
                this.btnColor.setColor(val);

                val = props.get_Lock();
                (val===undefined) && (val = Asc.c_oAscSdtLockType.Unlocked);
                this.chLockDelete.setValue(val==Asc.c_oAscSdtLockType.SdtContentLocked || val==Asc.c_oAscSdtLockType.SdtLocked);
                this.chLockEdit.setValue(val==Asc.c_oAscSdtLockType.SdtContentLocked || val==Asc.c_oAscSdtLockType.ContentLocked);

                var type = props.get_SpecificType();

                //for list controls
                this.btnsCategory[2].setVisible(type == Asc.c_oAscContentControlSpecificType.ComboBox || type == Asc.c_oAscContentControlSpecificType.DropDownList);
                if (type == Asc.c_oAscContentControlSpecificType.ComboBox || type == Asc.c_oAscContentControlSpecificType.DropDownList) {
                    this.btnsCategory[2].setCaption(type == Asc.c_oAscContentControlSpecificType.ComboBox ? this.textCombobox : this.textDropDown);
                    var specProps = (type == Asc.c_oAscContentControlSpecificType.ComboBox) ? props.get_ComboBoxPr() : props.get_DropDownListPr();
                    if (specProps) {
                        var count = specProps.get_ItemsCount();
                        var arr = [];
                        for (var i=0; i<count; i++) {
                            arr.push({
                                value: specProps.get_ItemValue(i),
                                name: specProps.get_ItemDisplayText(i)
                            });
                        }
                        this.list.store.reset(arr);
                    }
                    this.disableListButtons();
                }

                //for date picker
                this.btnsCategory[3].setVisible(type == Asc.c_oAscContentControlSpecificType.DateTime);
                if (type == Asc.c_oAscContentControlSpecificType.DateTime) {
                    var specProps = props.get_DateTimePr();
                    if (specProps) {
                        this.datetime = specProps;
                        var lang = specProps.get_LangId() || this.options.controlLang;
                        if (lang) {
                            var item = this.cmbLang.store.findWhere({value: lang});
                            item = item ? item.get('value') : 0x0409;
                            this.cmbLang.setValue(item);
                        }
                        this.updateFormats(this.cmbLang.getValue());
                        var format = specProps.get_DateFormat();
                        var rec = this.listFormats.store.findWhere({format: format});
                        this.listFormats.selectRecord(rec);
                        this.listFormats.scrollToRecord(rec);
                        this.txtDate.setValue(format);
                    }
                }

                // for check box
                this.btnsCategory[4].setVisible(type == Asc.c_oAscContentControlSpecificType.CheckBox);
                if (type == Asc.c_oAscContentControlSpecificType.CheckBox) {
                    var specProps = props.get_CheckBoxPr();
                    if (specProps) {
                        var code = specProps.get_CheckedSymbol(),
                            font = specProps.get_CheckedFont();
                        font && this.btnEditChecked.cmpEl.css('font-family', font);
                        code && this.btnEditChecked.setCaption(String.fromCharCode(code));
                        this.checkedBox = {code: code, font: font};

                        code = specProps.get_UncheckedSymbol();
                        font = specProps.get_UncheckedFont();
                        font && this.btnEditUnchecked.cmpEl.css('font-family', font);
                        code && this.btnEditUnchecked.setCaption(String.fromCharCode(code));
                        this.uncheckedBox = {code: code, font: font};
                    }
                }

                this.type = type;
            }
        },

        getSettings: function () {
            var props   = new AscCommon.CContentControlPr();
            props.put_Alias(this.txtName.getValue());
            props.put_Tag(this.txtTag.getValue());
            props.put_Appearance(this.cmbShow.getValue());

            if (this.isSystemColor) {
                props.put_Color(null);
            } else {
                var color = Common.Utils.ThemeColor.getRgbColor(this.colors.getColor());
                props.put_Color(color.get_r(), color.get_g(), color.get_b());
            }

            var lock = Asc.c_oAscSdtLockType.Unlocked;

            if (this.chLockDelete.getValue()=='checked' && this.chLockEdit.getValue()=='checked')
                lock = Asc.c_oAscSdtLockType.SdtContentLocked;
            else if (this.chLockDelete.getValue()=='checked')
                lock = Asc.c_oAscSdtLockType.SdtLocked;
            else if (this.chLockEdit.getValue()=='checked')
                lock = Asc.c_oAscSdtLockType.ContentLocked;
            props.put_Lock(lock);

            // for list controls
            if (this.type == Asc.c_oAscContentControlSpecificType.ComboBox || this.type == Asc.c_oAscContentControlSpecificType.DropDownList) {
                var specProps = (this.type == Asc.c_oAscContentControlSpecificType.ComboBox) ? this.props.get_ComboBoxPr() : this.props.get_DropDownListPr();
                specProps.clear();
                this.list.store.each(function (item, index) {
                    specProps.add_Item(item.get('name'), item.get('value'));
                });
                (this.type == Asc.c_oAscContentControlSpecificType.ComboBox) ? props.put_ComboBoxPr(specProps) : props.put_DropDownListPr(specProps);
            }

            //for date picker
            if (this.type == Asc.c_oAscContentControlSpecificType.DateTime) {
                var specProps = this.props.get_DateTimePr();
                specProps.put_DateFormat(this.txtDate.getValue());
                specProps.put_LangId(this.cmbLang.getValue());
                props.put_DateTimePr(specProps);
            }

            // for check box
            if (this.type == Asc.c_oAscContentControlSpecificType.CheckBox) {
                if (this.checkedBox && this.checkedBox.changed || this.uncheckedBox && this.uncheckedBox.changed) {
                    var specProps = this.props.get_CheckBoxPr();
                    if (this.checkedBox) {
                        specProps.put_CheckedSymbol(this.checkedBox.code);
                        specProps.put_CheckedFont(this.checkedBox.font);
                    }
                    if (this.uncheckedBox) {
                        specProps.put_UncheckedSymbol(this.uncheckedBox.code);
                        specProps.put_UncheckedFont(this.uncheckedBox.font);
                    }
                    props.put_CheckBoxPr(specProps);
                }
            }

            return props;
        },

        onDlgBtnClick: function(event) {
            var me = this;
            var state = (typeof(event) == 'object') ? event.currentTarget.attributes['result'].value : event;
            if (state == 'ok') {
                this.handler && this.handler.call(this, state, this.getSettings());
            }

            this.close();
        },

        applyAllClick: function(btn, eOpts){
            if (this.api) {
                var props   = new AscCommon.CContentControlPr();
                props.put_Appearance(this.cmbShow.getValue());
                if (this.isSystemColor) {
                    props.put_Color(null);
                } else {
                    var color = Common.Utils.ThemeColor.getRgbColor(this.colors.getColor());
                    props.put_Color(color.get_r(), color.get_g(), color.get_b());
                }
                this.api.asc_SetContentControlProperties(props, null, true);
            }
        },

        onSelectItem: function(listView, itemView, record) {
            this.disableListButtons(false);
        },

        disableListButtons: function(disabled) {
            if (disabled===undefined)
                disabled = !this.list.getSelectedRec();
            this.btnChange.setDisabled(disabled);
            this.btnDelete.setDisabled(disabled);
            this.btnUp.setDisabled(disabled);
            this.btnDown.setDisabled(disabled);
        },

        onAddItem: function() {
            var me = this,
                win = new DE.Views.EditListItemDialog({
                    store: me.list.store,
                    handler: function(result, name, value) {
                        if (result == 'ok') {
                            var rec = me.list.store.add({
                                    value: value,
                                    name: name
                                });
                            if (rec) {
                                me.list.selectRecord(rec);
                                me.list.scrollToRecord(rec);
                                me.disableListButtons();
                            }
                        }
                        me.list.cmpEl.find('.listview').focus();
                    }
                });
            win.show();
        },

        onChangeItem: function() {
            var me = this,
                rec = this.list.getSelectedRec(),
                win = new DE.Views.EditListItemDialog({
                    store: me.list.store,
                    handler: function(result, name, value) {
                        if (result == 'ok') {
                            if (rec) {
                                rec.set({
                                    value: value,
                                    name: name
                                });
                            }
                        }
                        me.list.cmpEl.find('.listview').focus();
                    }
                });
            rec && win.show();
            rec && win.setSettings({name: rec.get('name'), value: rec.get('value')});
        },

        onDeleteItem: function(btn, eOpts){
            var rec = this.list.getSelectedRec();
            if (rec) {
                var store = this.list.store;
                var idx = _.indexOf(store.models, rec);
                store.remove(rec);
                if (idx>store.length-1) idx = store.length-1;
                if (store.length>0) {
                    this.list.selectByIndex(idx);
                    this.list.scrollToRecord(store.at(idx));
                }
            }
            this.disableListButtons();
            this.list.cmpEl.find('.listview').focus();
        },

        onMoveItem: function(up) {
            var store = this.list.store,
                length = store.length,
                rec = this.list.getSelectedRec();
            if (rec) {
                var index = store.indexOf(rec);
                store.add(store.remove(rec), {at: up ? Math.max(0, index-1) : Math.min(length-1, index+1)});
                this.list.selectRecord(rec);
                this.list.scrollToRecord(rec);
            }
            this.list.cmpEl.find('.listview').focus();
        },

        updateFormats: function(lang) {
            if (this.datetime) {
                var props = this.datetime,
                    formats = props.get_FormatsExamples(),
                    arr = [];
                for (var i = 0, len = formats.length; i < len; i++)
                {
                    props.get_String(formats[i], undefined, lang);
                    var rec = new Common.UI.DataViewModel();
                    rec.set({
                        format: formats[i],
                        value: props.get_String(formats[i], undefined, lang)
                    });
                    arr.push(rec);
                }
                this.listFormats.store.reset(arr);
                this.listFormats.selectByIndex(0);
                var rec = this.listFormats.getSelectedRec();
                this.listFormats.scrollToRecord(rec);
                this.txtDate.setValue(rec.get('format'));
            }
        },

        onEditCheckbox: function(checked) {
            if (this.api) {
                var me = this,
                    props = (checked) ? me.checkedBox : me.uncheckedBox,
                    cmp = (checked) ? me.btnEditChecked : me.btnEditUnchecked,
                    handler = function(dlg, result, settings) {
                        if (result == 'ok') {
                            props.changed = true;
                            props.code = settings.code;
                            props.font = settings.font;
                            props.font && cmp.cmpEl.css('font-family', props.font);
                            settings.symbol && cmp.setCaption(settings.symbol);
                        }
                    },
                    win = new Common.Views.SymbolTableDialog({
                        api: me.api,
                        lang: me.options.interfaceLang,
                        modal: true,
                        type: 0,
                        font: props.font,
                        code: props.code,
                        handler: handler
                    });
                win.show();
                win.on('symbol:dblclick', handler);
            }
        },

        onSelectFormat: function(lisvView, itemView, record) {
            if (!record) return;
            this.txtDate.setValue(record.get('format'));
        },

        textTitle:    'Content Control Settings',
        textName: 'Title',
        textTag: 'Tag',
        txtLockDelete: 'Content control cannot be deleted',
        txtLockEdit: 'Contents cannot be edited',
        textLock: 'Locking',
        textShowAs: 'Show as',
        textColor: 'Color',
        textBox: 'Bounding box',
        textNone: 'None',
        textNewColor: 'Add New Custom Color',
        textApplyAll: 'Apply to All',
        textAppearance: 'Appearance',
        textSystemColor: 'System',
        strGeneral: 'General',
        textAdd: 'Add',
        textChange: 'Edit',
        textDelete: 'Delete',
        textUp: 'Up',
        textDown: 'Down',
        textCombobox: 'Combo box',
        textDropDown: 'Drop-down list',
        textDisplayName: 'Display name',
        textValue: 'Value',
        textDate: 'Date format',
        textLang: 'Language',
        textFormat: 'Display the date like this',
        textCheckbox: 'Check box',
        textChecked: 'Checked symbol',
        textUnchecked: 'Unchecked symbol',
        tipChange: 'Change symbol'

    }, DE.Views.ControlSettingsDialog || {}))
});