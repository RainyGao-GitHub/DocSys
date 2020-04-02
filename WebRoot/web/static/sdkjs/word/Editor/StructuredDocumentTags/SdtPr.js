/*
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

"use strict";
/**
 * User: Ilja.Kirillov
 * Date: 03.05.2017
 * Time: 12:12
 */

function CSdtPr()
{
	this.Alias = undefined;
	this.Id    = undefined;
	this.Tag   = undefined;
	this.Label = undefined;
	this.Lock  = undefined;

	this.DocPartObj = {
		Gallery  : undefined,
		Category : undefined,
		Unique   : undefined
	};

	this.Appearance = Asc.c_oAscSdtAppearance.Frame;
	this.Color      = undefined;

	this.CheckBox = undefined;
	this.Picture  = false;
	this.ComboBox = undefined;
	this.DropDown = undefined;
	this.Date     = undefined;

	this.TextPr = new CTextPr();
}

CSdtPr.prototype.Copy = function()
{
	var oPr = new CSdtPr();

	oPr.Alias      = this.Alias;
	oPr.Id         = this.Id;
	oPr.Tag        = this.Tag;
	oPr.Label      = this.Label;
	oPr.Lock       = this.Lock;
	oPr.Appearance = this.Appearance;
	oPr.Color      = (this.Color ? this.Color.Copy() : undefined);

	if (this.CheckBox)
		oPr.CheckBox = this.CheckBox.Copy();

	oPr.Picture = this.Picture;

	if (this.ComboBox)
		oPr.ComboBox = this.ComboBox.Copy();

	if (this.DropDown)
		oPr.DropDown = this.DropDown.Copy();

	if (this.Date)
		oPr.Date = this.Date.Copy();

	oPr.TextPr = this.TextPr.Copy();

	return oPr;
};
CSdtPr.prototype.Write_ToBinary = function(Writer)
{
	this.TextPr.WriteToBinary(Writer);

	var StartPos = Writer.GetCurPosition();
	Writer.Skip(4);
	var Flags = 0;

	if (undefined !== this.Alias)
	{
		Writer.WriteString2(this.Alias);
		Flags |= 1;
	}

	if (undefined !== this.Id)
	{
		Writer.WriteLong(this.Id);
		Flags |= 2;
	}

	if (undefined !== this.Tag)
	{
		Writer.WriteString2(this.Tag);
		Flags |= 4;
	}

	if (undefined !== this.Label)
	{
		Writer.WriteLong(this.Tag);
		Flags |= 8;
	}

	if (undefined !== this.Lock)
	{
		Writer.WriteLong(this.Lock);
		Flags |= 16;
	}

	if (undefined !== this.DocPartObj.Unique)
	{
		Writer.WriteBool(this.DocPartObj.Unique);
		Flags |= 32;
	}

	if (undefined !== this.DocPartObj.Gallery)
	{
		Writer.WriteString2(this.DocPartObj.Gallery);
		Flags |= 64;
	}

	if (undefined !== this.DocPartObj.Category)
	{
		Writer.WriteString2(this.DocPartObj.Category);
		Flags |= 128;
	}

	if (undefined !== this.Appearance)
	{
		Writer.WriteLong(this.Appearance);
		Flags |= 256;
	}

	if (undefined !== this.Color)
	{
		this.Color.WriteToBinary(Writer);
		Flags |= 512;
	}

	if (undefined !== this.CheckBox)
	{
		this.CheckBox.WriteToBinary(Writer);
		Flags |= 1024;
	}

	if (undefined !== this.Picture)
	{
		Writer.WriteBool(this.Picture);
		Flags |= 2048;
	}

	if (undefined !== this.ComboBox)
	{
		this.ComboBox.WriteToBinary(Writer);
		Flags |= 4096;
	}

	if (undefined !== this.DropDown)
	{
		this.DropDown.WriteToBinary(Writer);
		Flags |= 8192;
	}

	if (undefined !== this.Date)
	{
		this.Date.WriteToBinary(Writer);
		Flags |= 16384;
	}


	var EndPos = Writer.GetCurPosition();
	Writer.Seek(StartPos);
	Writer.WriteLong(Flags);
	Writer.Seek(EndPos);
};
CSdtPr.prototype.Read_FromBinary = function(Reader)
{
	this.TextPr = new CTextPr();
	this.TextPr.ReadFromBinary(Reader);

	var Flags = Reader.GetLong();

	if (Flags & 1)
		this.Alias = Reader.GetString2();

	if (Flags & 2)
		this.Id = Reader.GetLong();

	if (Flags & 4)
		this.Tag = Reader.GetString2();

	if (Flags & 8)
		this.Tag = Reader.GetLong();

	if (Flags & 16)
		this.Lock = Reader.GetLong();

	if (Flags & 32)
		this.DocPartObj.Unique = Reader.GetBool();

	if (Flags & 64)
		this.DocPartObj.Gallery = Reader.GetString2();

	if (Flags & 128)
		this.DocPartObj.Category = Reader.GetString2();

	if (Flags & 256)
		this.Appearance = Reader.GetLong();

	if (Flags & 512)
	{
		this.Color = new CDocumentColor();
		this.Color.ReadFromBinary(Reader);
	}

	if (Flags & 1024)
	{
		this.CheckBox = new CSdtCheckBoxPr();
		this.CheckBox.ReadFromBinary(Reader);
	}

	if (Flags & 2048)
		this.Picture = Reader.GetBool();

	if (Flags & 4096)
	{
		this.ComboBox = new CSdtComboBoxPr();
		this.ComboBox.ReadFromBinary(Reader);
	}

	if (Flags & 8192)
	{
		this.DropDown = new CSdtComboBoxPr();
		this.DropDown.ReadFromBinary(Reader);
	}

	if (Flags & 16384)
	{
		this.Date = new CSdtDatePickerPr();
		this.Date.ReadToBinary(Reader);
	}
};
CSdtPr.prototype.IsBuiltInDocPart = function()
{
	if (this.DocPartObj && (this.DocPartObj.Category || this.DocPartObj.Gallery))
		return true;

	return false;
};

function CContentControlPr(nType)
{
	this.CC         = null;
	this.Id         = undefined;
	this.Tag        = undefined;
	this.Alias      = undefined;
	this.Lock       = undefined;
	this.InternalId = undefined;
	this.CCType     = undefined !== nType ? nType : c_oAscSdtLevelType.Inline;

	this.Appearance = Asc.c_oAscSdtAppearance.Frame;
	this.Color      = undefined;

	this.CheckBoxPr = undefined;
	this.ComboBoxPr = undefined;
	this.DropDownPr = undefined;
	this.DateTimePr = undefined;
}
CContentControlPr.prototype.FillFromObject = function(oPr)
{
	if (undefined !== oPr.Id)
		this.Id = oPr.Id;

	if (undefined !== oPr.Tag)
		this.Tag = oPr.Tag;

	if (undefined !== oPr.Alias)
		this.Alias = oPr.Alias;

	if (undefined !== oPr.Lock)
		this.Lock  = oPr.Lock;

	if (undefined !== oPr.InternalId)
		this.InternalId = oPr.InternalId;

	if (undefined !== oPr.Appearance)
		this.Appearance = oPr.Appearance;

	if (undefined !== oPr.Color)
		this.Color = oPr.Color;
};
CContentControlPr.prototype.FillFromContentControl = function(oContentControl)
{
	if (!oContentControl)
		return;

	this.CC         = oContentControl;
	this.CCType     = oContentControl.IsBlockLevel() ? c_oAscSdtLevelType.Block : c_oAscSdtLevelType.Inline;
	this.Id         = oContentControl.Pr.Id;
	this.Lock       = oContentControl.Pr.Lock;
	this.InternalId = oContentControl.GetId();
	this.Tag        = oContentControl.GetTag();
	this.Alias      = oContentControl.GetAlias();
	this.Appearance = oContentControl.GetAppearance();
	this.Color      = oContentControl.GetColor();

	if (oContentControl.IsCheckBox())
		this.CheckBoxPr = oContentControl.GetCheckBoxPr().Copy();
	else if (oContentControl.IsComboBox())
		this.ComboBoxPr = oContentControl.GetComboBoxPr().Copy();
	else if (oContentControl.IsDropDownList())
		this.DropDownPr = oContentControl.GetDropDownListPr().Copy();
	else if (oContentControl.IsDatePicker())
		this.DateTimePr = oContentControl.GetDatePickerPr().Copy();
};
CContentControlPr.prototype.SetToContentControl = function(oContentControl)
{
	if (!oContentControl)
		return;

	if (undefined !== this.Tag)
		oContentControl.SetTag(this.Tag);

	if (undefined !== this.Id)
		oContentControl.SetContentControlId(this.Id);

	if (undefined !== this.Lock)
		oContentControl.SetContentControlLock(this.Lock);

	if (undefined !== this.Alias)
		oContentControl.SetAlias(this.Alias);

	if (undefined !== this.Appearance)
		oContentControl.SetAppearance(this.Appearance);

	if (undefined !== this.Color)
		oContentControl.SetColor(this.Color);

	if (undefined !== this.CheckBoxPr)
	{
		oContentControl.SetCheckBoxPr(this.CheckBoxPr);
		oContentControl.private_UpdateCheckBoxContent();
	}

	if (undefined !== this.ComboBoxPr)
		oContentControl.SetComboBoxPr(this.ComboBoxPr);

	if (undefined !== this.DropDownPr)
		oContentControl.SetDropDownListPr(this.DropDownPr);

	if (undefined !== this.DateTimePr)
		oContentControl.ApplyDatePickerPr(this.DateTimePr);
};
CContentControlPr.prototype.GetId = function()
{
	return this.Id;
};
CContentControlPr.prototype.SetId = function(Id)
{
	this.Id = Id;
};
CContentControlPr.prototype.GetTag = function()
{
	return this.Tag;
};
CContentControlPr.prototype.SetTag = function(sTag)
{
	this.Tag = sTag;
};
CContentControlPr.prototype.GetLock = function()
{
	return this.Lock;
};
CContentControlPr.prototype.SetLock = function(nLock)
{
	this.Lock = nLock;
};
CContentControlPr.prototype.GetInternalId = function()
{
	return this.InternalId;
};
CContentControlPr.prototype.GetContentControlType = function()
{
	return this.CCType;
};
CContentControlPr.prototype.GetAlias = function()
{
	return this.Alias;
};
CContentControlPr.prototype.SetAlias = function(sAlias)
{
	this.Alias = sAlias;
};
CContentControlPr.prototype.GetAppearance = function()
{
	return this.Appearance;
};
CContentControlPr.prototype.SetAppearance = function(nAppearance)
{
	this.Appearance = nAppearance;
};
CContentControlPr.prototype.GetColor = function()
{
	if (!this.Color)
		return null;

	return new Asc.asc_CColor(this.Color.r, this.Color.g, this.Color.b);
};
CContentControlPr.prototype.SetColor = function(r, g, b)
{
	if (undefined === r)
		this.Color = undefined;
	else if (null === r)
		this.Color = null;
	else
		this.Color = new CDocumentColor(r, g, b);
};
CContentControlPr.prototype.GetSpecificType = function()
{
	if (this.CC)
		return this.CC.GetSpecificType();

	return Asc.c_oAscContentControlSpecificType.None;
};
CContentControlPr.prototype.GetCheckBoxPr = function()
{
	if (this.CC && this.CC.IsCheckBox())
		return this.CheckBoxPr;

	return null;
};
CContentControlPr.prototype.SetCheckBoxPr = function(oPr)
{
	this.CheckBoxPr = oPr;
};
CContentControlPr.prototype.GetComboBoxPr = function()
{
	if (this.CC && this.CC.IsComboBox())
		return this.ComboBoxPr;

	return null;
};
CContentControlPr.prototype.SetComboBoxPr = function(oPr)
{
	this.ComboBoxPr = oPr;
};
CContentControlPr.prototype.GetDropDownListPr = function()
{
	if (this.CC && this.CC.IsDropDownList())
		return this.DropDownPr;

	return null;
};
CContentControlPr.prototype.SetDropDownListPr = function(oPr)
{
	this.DropDownPr = oPr;
};
CContentControlPr.prototype.GetDateTimePr = function()
{
	if (this.CC && this.CC.IsDatePicker())
		return this.DateTimePr;

	return null;
};
CContentControlPr.prototype.SetDateTimePr = function(oPr)
{
	this.DateTimePr = oPr;
};

/**
 * Класс с глобальными настройками для всех контейнеров
 * @constructor
 */
function CSdtGlobalSettings()
{
	this.Color         = new AscCommonWord.CDocumentColor(220, 220, 220);
	this.ShowHighlight = false;
}
/**
 * Проверяем все ли параметры выставлены по умолчанию
 * @returns {boolean}
 */
CSdtGlobalSettings.prototype.IsDefault = function()
{
	if (!this.Color
		|| 220 !== this.Color.r
		|| 220 !== this.Color.g
		|| 220 !== this.Color.b
		|| false !== this.ShowHighlight)
		return false;

	return true;
};
CSdtGlobalSettings.prototype.Copy = function()
{
	var oSettings = new CSdtGlobalSettings();

	oSettings.Color         = this.Color.Copy();
	oSettings.ShowHighlight = this.ShowHighlight;

	return oSettings;
};
CSdtGlobalSettings.prototype.Write_ToBinary = function(oWriter)
{
	// CDocumentColor : Color
	// Bool           : ShowHighlight

	this.Color.WriteToBinary(oWriter);
	oWriter.WriteBool(this.ShowHighlight);
};
CSdtGlobalSettings.prototype.Read_FromBinary = function(oReader)
{
	this.Color.ReadFromBinary(oReader);
	this.ShowHighlight = oReader.GetBool();
};

/**
 * Класс с настройками чекбокса
 * @constructor
 */
function CSdtCheckBoxPr()
{
	this.Checked         = false;
	this.CheckedSymbol   = Asc.c_oAscSdtCheckBoxDefaults.CheckedSymbol;
	this.UncheckedSymbol = Asc.c_oAscSdtCheckBoxDefaults.UncheckedSymbol;
	this.CheckedFont     = Asc.c_oAscSdtCheckBoxDefaults.CheckedFont;
	this.UncheckedFont   = Asc.c_oAscSdtCheckBoxDefaults.UncheckedFont;
}
CSdtCheckBoxPr.prototype.Copy = function()
{
	var oCopy = new CSdtCheckBoxPr();

	oCopy.Checked         = this.Checked;
	oCopy.CheckedSymbol   = this.CheckedSymbol;
	oCopy.CheckedFont     = this.CheckedFont;
	oCopy.UncheckedSymbol = this.UncheckedSymbol;
	oCopy.UncheckedFont   = this.UncheckedFont;

	return oCopy;
};
CSdtCheckBoxPr.prototype.IsEqual = function(oOther)
{
	if (!oOther
		|| oOther.Checked !== this.Checked
		|| oOther.CheckedSymbol !== this.CheckedSymbol
		|| oOther.CheckedFont !== this.CheckedFont
		|| oOther.UncheckedSymbol !== this.UncheckedSymbol
		|| oOther.UncheckedFont !== this.UncheckedFont)
		return false;

	return true;
};
CSdtCheckBoxPr.prototype.WriteToBinary = function(oWriter)
{
	oWriter.WriteBool(this.Checked);
	oWriter.WriteString2(this.CheckedFont);
	oWriter.WriteLong(this.CheckedSymbol);
	oWriter.WriteString2(this.UncheckedFont);
	oWriter.WriteLong(this.UncheckedSymbol);
};
CSdtCheckBoxPr.prototype.ReadFromBinary = function(oReader)
{
	this.Checked         = oReader.GetBool();
	this.CheckedFont     = oReader.GetString2();
	this.CheckedSymbol   = oReader.GetLong();
	this.UncheckedFont   = oReader.GetString2();
	this.UncheckedSymbol = oReader.GetLong();
};
CSdtCheckBoxPr.prototype.Write_ToBinary = function(oWriter)
{
	this.WriteToBinary(oWriter);
};
CSdtCheckBoxPr.prototype.Read_FromBinary = function(oReader)
{
	this.ReadFromBinary(oReader);
};
CSdtCheckBoxPr.prototype.GetCheckedSymbol = function()
{
	return this.CheckedSymbol;
};
CSdtCheckBoxPr.prototype.SetCheckedSymbol = function(nSymbol)
{
	this.CheckedSymbol = nSymbol;
};
CSdtCheckBoxPr.prototype.GetCheckedFont = function()
{
	return this.CheckedFont;
};
CSdtCheckBoxPr.prototype.SetCheckedFont = function(sFont)
{
	this.CheckedFont = sFont;
};
CSdtCheckBoxPr.prototype.GetUncheckedSymbol = function()
{
	return this.UncheckedSymbol;
};
CSdtCheckBoxPr.prototype.SetUncheckedSymbol = function(nSymbol)
{
	this.UncheckedSymbol = nSymbol;
};
CSdtCheckBoxPr.prototype.GetUncheckedFont = function()
{
	return this.UncheckedFont;
};
CSdtCheckBoxPr.prototype.SetUncheckedFont = function(sFont)
{
	this.UncheckedFont = sFont;
};

/**
 * Класс, представляющий элемент списка Combobox или DropDownList
 * @constructor
 */
function CSdtListItem()
{
	this.DisplayText = "";
	this.Value       = "";
}
CSdtListItem.prototype.Copy = function()
{
	var oItem = new CSdtListItem();
	oItem.DisplayText = this.DisplayText;
	oItem.Value       = this.Value;
	return oItem;
};
CSdtListItem.prototype.IsEqual = function(oItem)
{
	return (this.DisplayText === oItem.DisplayText && this.Value === oItem.Value);
};
CSdtListItem.prototype.WriteToBinary = function(oWriter)
{
	oWriter.WriteString2(this.DisplayText);
	oWriter.WriteString2(this.Value);
};
CSdtListItem.prototype.ReadFromBinary = function(oReader)
{
	this.DisplayText = oReader.GetString2();
	this.Value       = oReader.GetString2();
};

/**
 * Класс с настройками для выпадающего списка
 * @constructor
 */
function CSdtComboBoxPr()
{
	this.ListItems = [];
	this.LastValue = -1;
}
CSdtComboBoxPr.prototype.Copy = function()
{
	var oList = new CSdtComboBoxPr();

	oList.LastValue = this.LastValue;
	oList.ListItems = [];

	for (var nIndex = 0, nCount = this.ListItems.length; nIndex < nCount; ++nIndex)
	{
		oList.ListItems.push(this.ListItems[nIndex].Copy());
	}

	return oList;
};
CSdtComboBoxPr.prototype.IsEqual = function(oOther)
{
	if (!oOther || this.LastValue !== oOther.LastValue || this.ListItems.length !== oOther.ListItems.length)
		return false;

	for (var nIndex = 0, nCount = this.ListItems.length; nIndex < nCount; ++nIndex)
	{
		if (!this.ListItems[nIndex].IsEqual(oOther.ListItems[nIndex]))
			return false;
	}

	return true;
};
CSdtComboBoxPr.prototype.AddItem = function(sDisplay, sValue)
{
	if (null !== this.GetTextByValue(sValue))
		return false;

	var oItem = new CSdtListItem();
	oItem.DisplayText = sDisplay;
	oItem.Value       = sValue;
	this.ListItems.push(oItem);

	return true;
};
CSdtComboBoxPr.prototype.Clear = function()
{
	this.ListItems = [];
	this.LastValue = -1;
};
CSdtComboBoxPr.prototype.GetTextByValue = function(sValue)
{
	if (!sValue || "" === sValue)
		return null;

	for (var nIndex = 0, nCount = this.ListItems.length; nIndex < nCount; ++nIndex)
	{
		if (this.ListItems[nIndex].Value === sValue)
			return this.ListItems[nIndex].DisplayText;
	}

	return null;
};
CSdtComboBoxPr.prototype.WriteToBinary = function(oWriter)
{
	oWriter.WriteLong(this.LastValue);
	oWriter.WriteLong(this.ListItems.length);
	for (var nIndex = 0, nCount = this.ListItems.length; nIndex < nCount; ++nIndex)
	{
		this.ListItems[nIndex].WriteToBinary(oWriter);
	}
};
CSdtComboBoxPr.prototype.ReadFromBinary = function(oReader)
{
	this.LastValue = oReader.GetLong();

	var nCount = oReader.GetLong();
	for (var nIndex = 0; nIndex < nCount; ++nIndex)
	{
		var oItem = new CSdtListItem();
		oItem.ReadFromBinary(oReader);
		this.ListItems.push(oItem);
	}
};
CSdtComboBoxPr.prototype.Write_ToBinary = function(oWriter)
{
	this.WriteToBinary(oWriter);
};
CSdtComboBoxPr.prototype.Read_FromBinary = function(oReader)
{
	this.ReadFromBinary(oReader);
};
CSdtComboBoxPr.prototype.GetItemsCount = function()
{
	return this.ListItems.length;
};
CSdtComboBoxPr.prototype.GetItemDisplayText = function(nIndex)
{
	if (!this.ListItems[nIndex])
		return "";

	return this.ListItems[nIndex].DisplayText;
};
CSdtComboBoxPr.prototype.GetItemValue = function(nIndex)
{
	if (!this.ListItems[nIndex])
		return "";

	return this.ListItems[nIndex].Value;
};

/**
 * Класс с настройками для даты
 * @constructor
 */
function CSdtDatePickerPr()
{
	this.FullDate   = (new Date()).toISOString().slice(0, 19) + 'Z';
	this.LangId     = 1033;
	this.DateFormat = "dd.MM.yyyy";
	this.Calendar   = Asc.c_oAscCalendarType.Gregorian;
}
CSdtDatePickerPr.prototype.Copy = function()
{
	var oDate = new CSdtDatePickerPr();

	oDate.FullDate   = this.FullDate;
	oDate.LangId     = this.LangId;
	oDate.DateFormat = this.DateFormat;
	oDate.Calendar   = this.Calendar;

	return oDate;
};
CSdtDatePickerPr.prototype.IsEqual = function(oDate)
{
	return (oDate && this.FullDate === oDate.FullDate && this.LangId === oDate.LangId && this.DateFormat === oDate.DateFormat && this.Calendar === oDate.Calendar);
};
CSdtDatePickerPr.prototype.ToString = function(sFormat, sFullDate, nLangId)
{
	if (undefined === sFormat)
		sFormat = this.DateFormat;

	if (undefined === sFullDate)
		sFullDate = this.FullDate;

	if (undefined === nLangId)
		nLangId = this.LangId;

	var oFormat = AscCommon.oNumFormatCache.get(sFormat);
	if (oFormat)
	{
		var oCultureInfo = AscCommon.g_aCultureInfos[nLangId];
		if (!oCultureInfo)
			oCultureInfo = AscCommon.g_aCultureInfos[1033];

		var oDateTime = new Asc.cDate(sFullDate);
		return oFormat.formatToChart(oDateTime.getExcelDate() + (oDateTime.getHours() * 60 * 60 + oDateTime.getMinutes() * 60 + oDateTime.getSeconds()) / AscCommonExcel.c_sPerDay, 15, oCultureInfo);
	}

	return sFullDate;
};
CSdtDatePickerPr.prototype.WriteToBinary = function(oWriter)
{
	oWriter.WriteString2(this.FullDate);
	oWriter.WriteLong(this.LangId);
	oWriter.WriteString2(this.DateFormat);
	oWriter.WriteLong(this.Calendar);
};
CSdtDatePickerPr.prototype.ReadFromBinary = function(oReader)
{
	this.FullDate   = oReader.GetString2();
	this.LangId     = oReader.GetLong();
	this.DateFormat = oReader.GetString2();
	this.Calendar   = oReader.GetLong();
};
CSdtDatePickerPr.prototype.Write_ToBinary = function(oWriter)
{
	this.WriteToBinary(oWriter);
};
CSdtDatePickerPr.prototype.Read_FromBinary = function(oReader)
{
	this.ReadFromBinary(oReader);
};
CSdtDatePickerPr.prototype.GetFullDate = function()
{
	return this.FullDate;
};
CSdtDatePickerPr.prototype.SetFullDate = function(sFullDate)
{
	var oDate = sFullDate instanceof Date ? sFullDate : new Date(sFullDate);
	this.FullDate = oDate.toISOString().slice(0, 19) + 'Z';
};
CSdtDatePickerPr.prototype.GetLangId = function()
{
	return this.LangId;
};
CSdtDatePickerPr.prototype.SetLangId = function(nLangId)
{
	this.LangId = nLangId;
};
CSdtDatePickerPr.prototype.GetDateFormat = function()
{
	return this.DateFormat;
};
CSdtDatePickerPr.prototype.SetDateFormat = function(sDateFormat)
{
	this.DateFormat = sDateFormat;
};
CSdtDatePickerPr.prototype.GetCalendar = function()
{
	return this.Calendar;
};
CSdtDatePickerPr.prototype.SetCalendar = function(nCalendar)
{
	this.Calendar = nCalendar;
};
CSdtDatePickerPr.prototype.GetFormatsExamples = function()
{
	return [
		"MM/DD/YYYY",
		"dddd\\,\\ mmmm\\ dd\\,\\ yyyy",
		"DD\\ MMMM\\ YYYY",
		"MMMM\\ DD\\,\\ YYYY",
		"DD-MMM-YY",
		"MMMM\\ YY",
		"MMM-YY",
		"MM/DD/YYYY\\ hh:mm\\ AM/PM",
		"MM/DD/YYYY\\ hh:mm:ss\\ AM/PM",
		"hh:mm",
		"hh:mm:ss",
		"hh:mm\\ AM/PM",
		"hh:mm:ss:\\ AM/PM"
	];
};

//--------------------------------------------------------export--------------------------------------------------------
window['AscCommonWord']        = window['AscCommonWord'] || {};
window['AscCommonWord'].CSdtPr = CSdtPr;

window['AscCommon'] = window['AscCommon'] || {};

window['AscCommon'].CContentControlPr    = CContentControlPr;
window['AscCommon']['CContentControlPr'] = CContentControlPr;

CContentControlPr.prototype['get_Id']                 = CContentControlPr.prototype.GetId;
CContentControlPr.prototype['put_Id']                 = CContentControlPr.prototype.SetId;
CContentControlPr.prototype['get_Tag']                = CContentControlPr.prototype.GetTag;
CContentControlPr.prototype['put_Tag']                = CContentControlPr.prototype.SetTag;
CContentControlPr.prototype['get_Lock']               = CContentControlPr.prototype.GetLock;
CContentControlPr.prototype['put_Lock']               = CContentControlPr.prototype.SetLock;
CContentControlPr.prototype['get_InternalId']         = CContentControlPr.prototype.GetInternalId;
CContentControlPr.prototype['get_ContentControlType'] = CContentControlPr.prototype.GetContentControlType;
CContentControlPr.prototype['get_Alias']              = CContentControlPr.prototype.GetAlias;
CContentControlPr.prototype['put_Alias']              = CContentControlPr.prototype.SetAlias;
CContentControlPr.prototype['get_Appearance']         = CContentControlPr.prototype.GetAppearance;
CContentControlPr.prototype['put_Appearance']         = CContentControlPr.prototype.SetAppearance;
CContentControlPr.prototype['get_Color']              = CContentControlPr.prototype.GetColor;
CContentControlPr.prototype['put_Color']              = CContentControlPr.prototype.SetColor;
CContentControlPr.prototype['get_SpecificType']       = CContentControlPr.prototype.GetSpecificType;
CContentControlPr.prototype['get_CheckBoxPr']         = CContentControlPr.prototype.GetCheckBoxPr;
CContentControlPr.prototype['put_CheckBoxPr']         = CContentControlPr.prototype.SetCheckBoxPr;
CContentControlPr.prototype['get_ComboBoxPr']         = CContentControlPr.prototype.GetComboBoxPr;
CContentControlPr.prototype['put_ComboBoxPr']         = CContentControlPr.prototype.SetComboBoxPr;
CContentControlPr.prototype['get_DropDownListPr']     = CContentControlPr.prototype.GetDropDownListPr;
CContentControlPr.prototype['put_DropDownListPr']     = CContentControlPr.prototype.SetDropDownListPr;
CContentControlPr.prototype['get_DateTimePr']         = CContentControlPr.prototype.GetDateTimePr;
CContentControlPr.prototype['put_DateTimePr']         = CContentControlPr.prototype.SetDateTimePr;

window['AscCommon'].CSdtCheckBoxPr    = CSdtCheckBoxPr;
window['AscCommon']['CSdtCheckBoxPr'] = CSdtCheckBoxPr;

CSdtCheckBoxPr.prototype['get_CheckedSymbol']   = CSdtCheckBoxPr.prototype.GetCheckedSymbol;
CSdtCheckBoxPr.prototype['put_CheckedSymbol']   = CSdtCheckBoxPr.prototype.SetCheckedSymbol;
CSdtCheckBoxPr.prototype['get_CheckedFont']     = CSdtCheckBoxPr.prototype.GetCheckedFont;
CSdtCheckBoxPr.prototype['put_CheckedFont']     = CSdtCheckBoxPr.prototype.SetCheckedFont;
CSdtCheckBoxPr.prototype['get_UncheckedSymbol'] = CSdtCheckBoxPr.prototype.GetUncheckedSymbol;
CSdtCheckBoxPr.prototype['put_UncheckedSymbol'] = CSdtCheckBoxPr.prototype.SetUncheckedSymbol;
CSdtCheckBoxPr.prototype['get_UncheckedFont']   = CSdtCheckBoxPr.prototype.GetUncheckedFont;
CSdtCheckBoxPr.prototype['put_UncheckedFont']   = CSdtCheckBoxPr.prototype.SetUncheckedFont;

window['AscCommon'].CSdtComboBoxPr    = CSdtComboBoxPr;
window['AscCommon']['CSdtComboBoxPr'] = CSdtComboBoxPr;

CSdtComboBoxPr.prototype['add_Item']            = CSdtComboBoxPr.prototype.AddItem;
CSdtComboBoxPr.prototype['clear']               = CSdtComboBoxPr.prototype.Clear;
CSdtComboBoxPr.prototype['get_TextByValue']     = CSdtComboBoxPr.prototype.GetTextByValue;
CSdtComboBoxPr.prototype['get_ItemsCount']      = CSdtComboBoxPr.prototype.GetItemsCount;
CSdtComboBoxPr.prototype['get_ItemDisplayText'] = CSdtComboBoxPr.prototype.GetItemDisplayText;
CSdtComboBoxPr.prototype['get_ItemValue']       = CSdtComboBoxPr.prototype.GetItemValue;

window['AscCommon'].CSdtDatePickerPr    = CSdtDatePickerPr;
window['AscCommon']['CSdtDatePickerPr'] = CSdtDatePickerPr;

CSdtDatePickerPr.prototype['get_FullDate']        = CSdtDatePickerPr.prototype.GetFullDate;
CSdtDatePickerPr.prototype['put_FullDate']        = CSdtDatePickerPr.prototype.SetFullDate;
CSdtDatePickerPr.prototype['get_LangId']          = CSdtDatePickerPr.prototype.GetLangId;
CSdtDatePickerPr.prototype['put_LangId']          = CSdtDatePickerPr.prototype.SetLangId;
CSdtDatePickerPr.prototype['get_DateFormat']      = CSdtDatePickerPr.prototype.GetDateFormat;
CSdtDatePickerPr.prototype['put_DateFormat']      = CSdtDatePickerPr.prototype.SetDateFormat;
CSdtDatePickerPr.prototype['get_Calendar']        = CSdtDatePickerPr.prototype.GetCalendar;
CSdtDatePickerPr.prototype['put_Calendar']        = CSdtDatePickerPr.prototype.SetCalendar;
CSdtDatePickerPr.prototype['get_FormatsExamples'] = CSdtDatePickerPr.prototype.GetFormatsExamples;
CSdtDatePickerPr.prototype['get_String']          = CSdtDatePickerPr.prototype.ToString;
