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
 * Date: 27.10.2016
 * Time: 13:02
 */

AscDFH.changesFactory[AscDFH.historyitem_Document_AddItem]                = CChangesDocumentAddItem;
AscDFH.changesFactory[AscDFH.historyitem_Document_RemoveItem]             = CChangesDocumentRemoveItem;
AscDFH.changesFactory[AscDFH.historyitem_Document_DefaultTab]             = CChangesDocumentDefaultTab;
AscDFH.changesFactory[AscDFH.historyitem_Document_EvenAndOddHeaders]      = CChangesDocumentEvenAndOddHeaders;
AscDFH.changesFactory[AscDFH.historyitem_Document_DefaultLanguage]        = CChangesDocumentDefaultLanguage;
AscDFH.changesFactory[AscDFH.historyitem_Document_MathSettings]           = CChangesDocumentMathSettings;
AscDFH.changesFactory[AscDFH.historyitem_Document_SdtGlobalSettings]      = CChangesDocumentSdtGlobalSettings;
AscDFH.changesFactory[AscDFH.historyitem_Document_Settings_GutterAtTop]   = CChangesDocumentSettingsGutterAtTop;
AscDFH.changesFactory[AscDFH.historyitem_Document_Settings_MirrorMargins] = CChangesDocumentSettingsMirrorMargins;

//----------------------------------------------------------------------------------------------------------------------
// Карта зависимости изменений
//----------------------------------------------------------------------------------------------------------------------
AscDFH.changesRelationMap[AscDFH.historyitem_Document_AddItem]                = [
	AscDFH.historyitem_Document_AddItem,
	AscDFH.historyitem_Document_RemoveItem
];
AscDFH.changesRelationMap[AscDFH.historyitem_Document_RemoveItem]             = [
	AscDFH.historyitem_Document_AddItem,
	AscDFH.historyitem_Document_RemoveItem
];
AscDFH.changesRelationMap[AscDFH.historyitem_Document_DefaultTab]             = [AscDFH.historyitem_Document_DefaultTab];
AscDFH.changesRelationMap[AscDFH.historyitem_Document_EvenAndOddHeaders]      = [AscDFH.historyitem_Document_EvenAndOddHeaders];
AscDFH.changesRelationMap[AscDFH.historyitem_Document_DefaultLanguage]        = [AscDFH.historyitem_Document_DefaultLanguage];
AscDFH.changesRelationMap[AscDFH.historyitem_Document_MathSettings]           = [AscDFH.historyitem_Document_MathSettings];
AscDFH.changesRelationMap[AscDFH.historyitem_Document_SdtGlobalSettings]      = [AscDFH.historyitem_Document_SdtGlobalSettings];
AscDFH.changesRelationMap[AscDFH.historyitem_Document_Settings_GutterAtTop]   = [AscDFH.historyitem_Document_Settings_GutterAtTop];
AscDFH.changesRelationMap[AscDFH.historyitem_Document_Settings_MirrorMargins] = [AscDFH.historyitem_Document_Settings_MirrorMargins];
//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseContentChange}
 */
function CChangesDocumentAddItem(Class, Pos, Items)
{
	AscDFH.CChangesBaseContentChange.call(this, Class, Pos, Items, true);
}
CChangesDocumentAddItem.prototype = Object.create(AscDFH.CChangesBaseContentChange.prototype);
CChangesDocumentAddItem.prototype.constructor = CChangesDocumentAddItem;
CChangesDocumentAddItem.prototype.Type = AscDFH.historyitem_Document_AddItem;
CChangesDocumentAddItem.prototype.Undo = function()
{
	var oDocument = this.Class;
	for (var nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
	{
		var Pos = true !== this.UseArray ? this.Pos : this.PosArray[nIndex];
		var Elements = oDocument.Content.splice(Pos, 1);
		oDocument.private_RecalculateNumbering(Elements);
		oDocument.private_ReindexContent(Pos);
		if (oDocument.SectionsInfo)
		{
			oDocument.SectionsInfo.Update_OnRemove(Pos, 1);
		}

		if (Pos > 0)
		{
			if (Pos <= oDocument.Content.length - 1)
			{
				oDocument.Content[Pos - 1].Next = oDocument.Content[Pos];
				oDocument.Content[Pos].Prev     = oDocument.Content[Pos - 1];
			}
			else
			{
				oDocument.Content[Pos - 1].Next = null;
			}
		}
		else if (Pos <= oDocument.Content.length - 1)
		{
			oDocument.Content[Pos].Prev = null;
		}
	}
};
CChangesDocumentAddItem.prototype.Redo = function()
{
	var oDocument = this.Class;
	for (var nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
	{
		var Element = this.Items[nIndex];
		var Pos     = true !== this.UseArray ? this.Pos + nIndex : this.PosArray[nIndex];

		oDocument.Content.splice(Pos, 0, Element);
		oDocument.private_RecalculateNumbering([Element]);
		oDocument.private_ReindexContent(Pos);
		if (oDocument.SectionsInfo)
		{
			oDocument.SectionsInfo.Update_OnAdd(Pos, [Element]);
		}

		if (Pos > 0)
		{
			oDocument.Content[Pos - 1].Next = Element;
			Element.Prev                    = oDocument.Content[Pos - 1];
		}
		else
		{
			Element.Prev = null;
		}

		if (Pos < oDocument.Content.length - 1)
		{
			oDocument.Content[Pos + 1].Prev = Element;
			Element.Next                    = oDocument.Content[Pos + 1];
		}
		else
		{
			Element.Next = null;
		}

		Element.Parent = oDocument;
	}
};
CChangesDocumentAddItem.prototype.private_WriteItem = function(Writer, Item)
{
	Writer.WriteString2(Item.Get_Id());
};
CChangesDocumentAddItem.prototype.private_ReadItem = function(Reader)
{
	return AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CChangesDocumentAddItem.prototype.Load = function(Color)
{
	var oDocument = this.Class;
	for (var nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
	{
		var Pos     = oDocument.m_oContentChanges.Check(AscCommon.contentchanges_Add, true !== this.UseArray ? this.Pos + nIndex : this.PosArray[nIndex]);
		var Element = this.Items[nIndex];

		Pos = Math.min(Pos, oDocument.Content.length);

		if (null != Element)
		{
			if (Pos > 0)
			{
				oDocument.Content[Pos - 1].Next = Element;
				Element.Prev                    = oDocument.Content[Pos - 1];
			}
			else
			{
				Element.Prev = null;
			}

			if (Pos <= oDocument.Content.length - 1)
			{
				oDocument.Content[Pos].Prev = Element;
				Element.Next                = oDocument.Content[Pos];
			}
			else
			{
				Element.Next = null;
			}

			Element.Parent = oDocument;

			oDocument.Content.splice(Pos, 0, Element);
			oDocument.private_RecalculateNumbering([Element]);
			if (oDocument.SectionsInfo)
			{
				oDocument.SectionsInfo.Update_OnAdd(Pos, [Element]);
			}
			oDocument.private_ReindexContent(Pos);

			AscCommon.CollaborativeEditing.Update_DocumentPositionsOnAdd(oDocument, Pos);

			if (Element.IsParagraph())
			{
				Element.RecalcCompiledPr(true);
				Element.UpdateDocumentOutline();
			}
		}
	}
};
CChangesDocumentAddItem.prototype.IsRelated = function(oChanges)
{
	if (this.Class === oChanges.Class && (AscDFH.historyitem_Document_AddItem === oChanges.Type || AscDFH.historyitem_Document_RemoveItem === oChanges.Type))
		return true;

	return false;
};
CChangesDocumentAddItem.prototype.CreateReverseChange = function()
{
	return this.private_CreateReverseChange(CChangesDocumentRemoveItem);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseContentChange}
 */
function CChangesDocumentRemoveItem(Class, Pos, Items)
{
	AscDFH.CChangesBaseContentChange.call(this, Class, Pos, Items, false);
}
CChangesDocumentRemoveItem.prototype = Object.create(AscDFH.CChangesBaseContentChange.prototype);
CChangesDocumentRemoveItem.prototype.constructor = CChangesDocumentRemoveItem;
CChangesDocumentRemoveItem.prototype.Type = AscDFH.historyitem_Document_RemoveItem;
CChangesDocumentRemoveItem.prototype.Undo = function()
{
	var oDocument = this.Class;

	var Array_start = oDocument.Content.slice(0, this.Pos);
	var Array_end   = oDocument.Content.slice(this.Pos);

	oDocument.private_RecalculateNumbering(this.Items);
	oDocument.private_ReindexContent(this.Pos);
	oDocument.Content = Array_start.concat(this.Items, Array_end);

	if(oDocument.SectionsInfo)
	{
        oDocument.SectionsInfo.Update_OnAdd(this.Pos, this.Items);
	}


	var nStartIndex = Math.max(this.Pos - 1, 0);
	var nEndIndex   = Math.min(oDocument.Content.length - 1, this.Pos + this.Items.length + 1);
	for (var nIndex = nStartIndex; nIndex <= nEndIndex; ++nIndex)
	{
		var oElement = oDocument.Content[nIndex];
		if (nIndex > 0)
			oElement.Prev = oDocument.Content[nIndex - 1];
		else
			oElement.Prev = null;

		if (nIndex < oDocument.Content.length - 1)
			oElement.Next = oDocument.Content[nIndex + 1];
		else
			oElement.Next = null;

		oElement.Parent = oDocument;
	}
};
CChangesDocumentRemoveItem.prototype.Redo = function()
{
	var oDocument = this.Class;
	var Elements = oDocument.Content.splice(this.Pos, this.Items.length);
	oDocument.private_RecalculateNumbering(Elements);
	oDocument.private_ReindexContent(this.Pos);
	if(oDocument.SectionsInfo)
	{
        oDocument.SectionsInfo.Update_OnRemove(this.Pos, this.Items.length);
	}


	var Pos = this.Pos;
	if (Pos > 0)
	{
		if (Pos <= oDocument.Content.length - 1)
		{
			oDocument.Content[Pos - 1].Next = oDocument.Content[Pos];
			oDocument.Content[Pos].Prev     = oDocument.Content[Pos - 1];
		}
		else
		{
			oDocument.Content[Pos - 1].Next = null;
		}
	}
	else if (Pos <= oDocument.Content.length - 1)
	{
		oDocument.Content[Pos].Prev = null;
	}
};
CChangesDocumentRemoveItem.prototype.private_WriteItem = function(Writer, Item)
{
	Writer.WriteString2(Item.Get_Id());
};
CChangesDocumentRemoveItem.prototype.private_ReadItem = function(Reader)
{
	return AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CChangesDocumentRemoveItem.prototype.Load = function(Color)
{
	var oDocument = this.Class;
	for (var nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
	{
		var Pos = oDocument.m_oContentChanges.Check(AscCommon.contentchanges_Remove, true !== this.UseArray ? this.Pos : this.PosArray[nIndex]);

		// действие совпало, не делаем его
		if (false === Pos)
			continue;

		var Elements = oDocument.Content.splice(Pos, 1);
		oDocument.private_RecalculateNumbering(Elements);
		AscCommon.CollaborativeEditing.Update_DocumentPositionsOnRemove(oDocument, Pos, 1);

		for (var nElementIndex = 0; nElementIndex < Elements.length; ++nElementIndex)
		{
			if (Elements[nElementIndex].IsParagraph())
			{
				Elements[nElementIndex].RecalcCompiledPr(true);
				Elements[nElementIndex].UpdateDocumentOutline();
			}
		}

		if (Pos > 0)
		{
			if (Pos <= oDocument.Content.length - 1)
			{
				oDocument.Content[Pos - 1].Next = oDocument.Content[Pos];
				oDocument.Content[Pos].Prev     = oDocument.Content[Pos - 1];
			}
			else
			{
				oDocument.Content[Pos - 1].Next = null;
			}
		}
		else if (Pos <= oDocument.Content.length - 1)
		{
			oDocument.Content[Pos].Prev = null;
		}

		if (0 <= Pos && Pos <= oDocument.Content.length - 1)
		{
			if (oDocument.SectionsInfo)
			{
				oDocument.SectionsInfo.Update_OnRemove(Pos, 1);
			}

			oDocument.private_ReindexContent(Pos);
		}
	}
};
CChangesDocumentRemoveItem.prototype.IsRelated = function(oChanges)
{
	if (this.Class === oChanges.Class && (AscDFH.historyitem_Document_AddItem === oChanges.Type || AscDFH.historyitem_Document_RemoveItem === oChanges.Type))
		return true;

	return false;
};
CChangesDocumentRemoveItem.prototype.CreateReverseChange = function()
{
	return this.private_CreateReverseChange(CChangesDocumentAddItem);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBase}
 */
function CChangesDocumentDefaultTab(Class, Old, New)
{
	AscDFH.CChangesBase.call(this, Class);

	this.Old = Old;
	this.New = New;
}
CChangesDocumentDefaultTab.prototype = Object.create(AscDFH.CChangesBase.prototype);
CChangesDocumentDefaultTab.prototype.constructor = CChangesDocumentDefaultTab;
CChangesDocumentDefaultTab.prototype.Type = AscDFH.historyitem_Document_DefaultTab;
CChangesDocumentDefaultTab.prototype.Undo = function()
{
	AscCommonWord.Default_Tab_Stop = this.Old;
};
CChangesDocumentDefaultTab.prototype.Redo = function()
{
	AscCommonWord.Default_Tab_Stop = this.New;
};
CChangesDocumentDefaultTab.prototype.WriteToBinary = function(Writer)
{
	// Double : New
	// Double : Old
	Writer.WriteDouble(this.New);
	Writer.WriteDouble(this.Old);
};
CChangesDocumentDefaultTab.prototype.ReadFromBinary = function(Reader)
{
	// Double : New
	// Double : Old
	this.New = Reader.GetDouble();
	this.Old = Reader.GetDouble();
};
CChangesDocumentDefaultTab.prototype.CreateReverseChange = function()
{
	return new CChangesDocumentDefaultTab(this.Class, this.New, this.Old);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBase}
 */
function CChangesDocumentEvenAndOddHeaders(Class, Old, New)
{
	AscDFH.CChangesBase.call(this, Class);

	this.Old = Old;
	this.New = New;
}
CChangesDocumentEvenAndOddHeaders.prototype = Object.create(AscDFH.CChangesBase.prototype);
CChangesDocumentEvenAndOddHeaders.prototype.constructor = CChangesDocumentEvenAndOddHeaders;
CChangesDocumentEvenAndOddHeaders.prototype.Type = AscDFH.historyitem_Document_EvenAndOddHeaders;
CChangesDocumentEvenAndOddHeaders.prototype.Undo = function()
{
	EvenAndOddHeaders = this.Old;
};
CChangesDocumentEvenAndOddHeaders.prototype.Redo = function()
{
	EvenAndOddHeaders = this.New;
};
CChangesDocumentEvenAndOddHeaders.prototype.WriteToBinary = function(Writer)
{
	// Bool : New
	// Bool : Old
	Writer.WriteBool(this.New);
	Writer.WriteBool(this.Old);
};
CChangesDocumentEvenAndOddHeaders.prototype.ReadFromBinary = function(Reader)
{
	// Bool : New
	// Bool : Old
	this.New = Reader.GetBool();
	this.Old = Reader.GetBool();
};
CChangesDocumentEvenAndOddHeaders.prototype.CreateReverseChange = function()
{
	return new CChangesDocumentEvenAndOddHeaders(this.Class, this.New, this.Old);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBase}
 */
function CChangesDocumentDefaultLanguage(Class, Old, New)
{
	AscDFH.CChangesBase.call(this, Class);

	this.Old = Old;
	this.New = New;
}
CChangesDocumentDefaultLanguage.prototype = Object.create(AscDFH.CChangesBase.prototype);
CChangesDocumentDefaultLanguage.prototype.constructor = CChangesDocumentDefaultLanguage;
CChangesDocumentDefaultLanguage.prototype.Type = AscDFH.historyitem_Document_DefaultLanguage;
CChangesDocumentDefaultLanguage.prototype.Undo = function()
{
	var oDocument = this.Class;
	oDocument.Styles.Default.TextPr.Lang.Val = this.Old;
	oDocument.Restart_CheckSpelling();
};
CChangesDocumentDefaultLanguage.prototype.Redo = function()
{
	var oDocument = this.Class;
	oDocument.Styles.Default.TextPr.Lang.Val = this.New;
	oDocument.Restart_CheckSpelling();
};
CChangesDocumentDefaultLanguage.prototype.WriteToBinary = function(Writer)
{
	// Long : New
	// Long : Old
	Writer.WriteLong(this.New);
	Writer.WriteLong(this.Old);
};
CChangesDocumentDefaultLanguage.prototype.ReadFromBinary = function(Reader)
{
	// Long : New
	// Long : Old
	this.New = Reader.GetLong();
	this.Old = Reader.GetLong();
};
CChangesDocumentDefaultLanguage.prototype.CreateReverseChange = function()
{
	return new CChangesDocumentDefaultLanguage(this.Class, this.New, this.Old);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBase}
 */
function CChangesDocumentMathSettings(Class, Old, New)
{
	AscDFH.CChangesBase.call(this, Class);

	this.Old = Old;
	this.New = New;
}
CChangesDocumentMathSettings.prototype = Object.create(AscDFH.CChangesBase.prototype);
CChangesDocumentMathSettings.prototype.constructor = CChangesDocumentMathSettings;
CChangesDocumentMathSettings.prototype.Type = AscDFH.historyitem_Document_MathSettings;
CChangesDocumentMathSettings.prototype.Undo = function()
{
	var oDocument = this.Class;
	oDocument.Settings.MathSettings.SetPr(this.Old);
};
CChangesDocumentMathSettings.prototype.Redo = function()
{
	var oDocument = this.Class;
	oDocument.Settings.MathSettings.SetPr(this.New);
};
CChangesDocumentMathSettings.prototype.WriteToBinary = function(Writer)
{
	// Variable : New
	// Variable : Old
	this.New.Write_ToBinary(Writer);
	this.Old.Write_ToBinary(Writer);
};
CChangesDocumentMathSettings.prototype.ReadFromBinary = function(Reader)
{
	// Variable : New
	// Variable : Old
	this.New = new CMathSettings();
	this.New.Read_FromBinary(Reader);
	this.Old = new CMathSettings();
	this.Old.Read_FromBinary(Reader);
};
CChangesDocumentMathSettings.prototype.CreateReverseChange = function()
{
	return new CChangesDocumentMathSettings(this.Class, this.New, this.Old);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesDocumentSdtGlobalSettings(Class, Old, New)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class);

	this.Old = Old;
	this.New = New;
}
CChangesDocumentSdtGlobalSettings.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesDocumentSdtGlobalSettings.prototype.constructor = CChangesDocumentSdtGlobalSettings;
CChangesDocumentSdtGlobalSettings.prototype.Type = AscDFH.historyitem_Document_SdtGlobalSettings;
CChangesDocumentSdtGlobalSettings.prototype.private_SetValue = function(Value)
{
	this.Class.Settings.SdtSettings = Value;
	this.Class.OnChangeSdtGlobalSettings();
};
CChangesDocumentSdtGlobalSettings.prototype.private_CreateObject = function()
{
	return new CSdtGlobalSettings();
};
CChangesDocumentSdtGlobalSettings.prototype.private_IsCreateEmptyObject = function()
{
	return true;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesDocumentSettingsGutterAtTop(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesDocumentSettingsGutterAtTop.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesDocumentSettingsGutterAtTop.prototype.constructor = CChangesDocumentSettingsGutterAtTop;
CChangesDocumentSettingsGutterAtTop.prototype.Type = AscDFH.historyitem_Document_Settings_GutterAtTop;
CChangesDocumentSettingsGutterAtTop.prototype.private_SetValue = function(Value)
{
	this.Class.Settings.GutterAtTop = Value;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesDocumentSettingsMirrorMargins(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesDocumentSettingsMirrorMargins.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesDocumentSettingsMirrorMargins.prototype.constructor = CChangesDocumentSettingsMirrorMargins;
CChangesDocumentSettingsMirrorMargins.prototype.Type = AscDFH.historyitem_Document_Settings_MirrorMargins;
CChangesDocumentSettingsMirrorMargins.prototype.private_SetValue = function(Value)
{
	this.Class.Settings.MirrorMargins = Value;
};
