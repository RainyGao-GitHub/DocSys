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
 * Date: 08.11.2016
 * Time: 18:59
 */

AscDFH.changesFactory[AscDFH.historyitem_Hyperlink_Value]      = CChangesHyperlinkValue;
AscDFH.changesFactory[AscDFH.historyitem_Hyperlink_ToolTip]    = CChangesHyperlinkToolTip;
AscDFH.changesFactory[AscDFH.historyitem_Hyperlink_AddItem]    = CChangesHyperlinkAddItem;
AscDFH.changesFactory[AscDFH.historyitem_Hyperlink_RemoveItem] = CChangesHyperlinkRemoveItem;
AscDFH.changesFactory[AscDFH.historyitem_Hyperlink_Anchor]     = CChangesHyperlinkAnchor;

//----------------------------------------------------------------------------------------------------------------------
// Карта зависимости изменений
//----------------------------------------------------------------------------------------------------------------------
AscDFH.changesRelationMap[AscDFH.historyitem_Hyperlink_Value]      = [AscDFH.historyitem_Hyperlink_Value];
AscDFH.changesRelationMap[AscDFH.historyitem_Hyperlink_ToolTip]    = [AscDFH.historyitem_Hyperlink_ToolTip];
AscDFH.changesRelationMap[AscDFH.historyitem_Hyperlink_AddItem]    = [
	AscDFH.historyitem_Hyperlink_AddItem,
	AscDFH.historyitem_Hyperlink_RemoveItem
];
AscDFH.changesRelationMap[AscDFH.historyitem_Hyperlink_RemoveItem] = [
	AscDFH.historyitem_Hyperlink_AddItem,
	AscDFH.historyitem_Hyperlink_RemoveItem
];
AscDFH.changesRelationMap[AscDFH.historyitem_Hyperlink_Anchor]     = [AscDFH.historyitem_Hyperlink_Anchor];
//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseStringValue}
 */
function CChangesHyperlinkValue(Class, Old, New, Color)
{
	AscDFH.CChangesBaseStringValue.call(this, Class, Old, New, Color);
}
CChangesHyperlinkValue.prototype = Object.create(AscDFH.CChangesBaseStringValue.prototype);
CChangesHyperlinkValue.prototype.constructor = CChangesHyperlinkValue;
CChangesHyperlinkValue.prototype.Type = AscDFH.historyitem_Hyperlink_Value;
CChangesHyperlinkValue.prototype.private_SetValue = function(Value)
{
	this.Class.Value = Value;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseStringValue}
 */
function CChangesHyperlinkToolTip(Class, Old, New, Color)
{
	AscDFH.CChangesBaseStringValue.call(this, Class, Old, New, Color);
}
CChangesHyperlinkToolTip.prototype = Object.create(AscDFH.CChangesBaseStringValue.prototype);
CChangesHyperlinkToolTip.prototype.constructor = CChangesHyperlinkToolTip;
CChangesHyperlinkToolTip.prototype.Type = AscDFH.historyitem_Hyperlink_ToolTip;
CChangesHyperlinkToolTip.prototype.private_SetValue = function(Value)
{
	this.Class.ToolTip = Value;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseContentChange}
 */
function CChangesHyperlinkAddItem(Class, Pos, Items)
{
	AscDFH.CChangesBaseContentChange.call(this, Class, Pos, Items, true);
}
CChangesHyperlinkAddItem.prototype = Object.create(AscDFH.CChangesBaseContentChange.prototype);
CChangesHyperlinkAddItem.prototype.constructor = CChangesHyperlinkAddItem;
CChangesHyperlinkAddItem.prototype.Type = AscDFH.historyitem_Hyperlink_AddItem;
CChangesHyperlinkAddItem.prototype.Undo = function()
{
	var oHyperlink = this.Class;
	oHyperlink.Content.splice(this.Pos, this.Items.length);
	oHyperlink.private_UpdateTrackRevisions();
	oHyperlink.private_CheckUpdateBookmarks(this.Items);
	oHyperlink.private_UpdateSpellChecking();
};
CChangesHyperlinkAddItem.prototype.Redo = function()
{
	var oHyperlink = this.Class;
	var Array_start = oHyperlink.Content.slice(0, this.Pos);
	var Array_end   = oHyperlink.Content.slice(this.Pos);

	oHyperlink.Content = Array_start.concat(this.Items, Array_end);
	oHyperlink.private_UpdateTrackRevisions();
	oHyperlink.private_CheckUpdateBookmarks(this.Items);
	oHyperlink.private_UpdateSpellChecking();
};
CChangesHyperlinkAddItem.prototype.private_WriteItem = function(Writer, Item)
{
	Writer.WriteString2(Item.Get_Id());
};
CChangesHyperlinkAddItem.prototype.private_ReadItem = function(Reader)
{
	return AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CChangesHyperlinkAddItem.prototype.Load = function(Color)
{
	var oHyperlink = this.Class;
	for (var nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
	{
		var Pos     = oHyperlink.m_oContentChanges.Check(AscCommon.contentchanges_Add, this.PosArray[nIndex]);
		var Element = this.Items[nIndex];

		if (null != Element)
		{
			oHyperlink.Content.splice(Pos, 0, Element);
			AscCommon.CollaborativeEditing.Update_DocumentPositionsOnAdd(oHyperlink, Pos);

			if (Element.SetParagraph && oHyperlink.GetParagraph())
				Element.SetParagraph(oHyperlink.GetParagraph());
		}
	}

	oHyperlink.private_UpdateTrackRevisions();
	oHyperlink.private_CheckUpdateBookmarks(this.Items);
	oHyperlink.private_UpdateSpellChecking();
};
CChangesHyperlinkAddItem.prototype.IsRelated = function(oChanges)
{
	if (this.Class === oChanges.Class && (AscDFH.historyitem_Hyperlink_AddItem === oChanges.Type || AscDFH.historyitem_Hyperlink_RemoveItem === oChanges.Type))
		return true;

	return false;
};
CChangesHyperlinkAddItem.prototype.CreateReverseChange = function()
{
	return this.private_CreateReverseChange(CChangesHyperlinkRemoveItem);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseContentChange}
 */
function CChangesHyperlinkRemoveItem(Class, Pos, Items)
{
	AscDFH.CChangesBaseContentChange.call(this, Class, Pos, Items, false);
}
CChangesHyperlinkRemoveItem.prototype = Object.create(AscDFH.CChangesBaseContentChange.prototype);
CChangesHyperlinkRemoveItem.prototype.constructor = CChangesHyperlinkRemoveItem;
CChangesHyperlinkRemoveItem.prototype.Type = AscDFH.historyitem_Hyperlink_RemoveItem;
CChangesHyperlinkRemoveItem.prototype.Undo = function()
{
	var oHyperlink  = this.Class;
	var Array_start = oHyperlink.Content.slice(0, this.Pos);
	var Array_end   = oHyperlink.Content.slice(this.Pos);

	oHyperlink.Content = Array_start.concat(this.Items, Array_end);
	oHyperlink.private_UpdateTrackRevisions();
	oHyperlink.private_CheckUpdateBookmarks(this.Items);
	oHyperlink.private_UpdateSpellChecking();
};
CChangesHyperlinkRemoveItem.prototype.Redo = function()
{
	var oHyperlink  = this.Class;
	oHyperlink.Content.splice(this.Pos, this.Items.length);
	oHyperlink.private_UpdateTrackRevisions();
	oHyperlink.private_CheckUpdateBookmarks(this.Items);
	oHyperlink.private_UpdateSpellChecking();
};
CChangesHyperlinkRemoveItem.prototype.private_WriteItem = function(Writer, Item)
{
	Writer.WriteString2(Item.Get_Id());
};
CChangesHyperlinkRemoveItem.prototype.private_ReadItem = function(Reader)
{
	return AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CChangesHyperlinkRemoveItem.prototype.Load = function(Color)
{
	var oHyperlink = this.Class;
	for (var nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
	{
		var ChangesPos = oHyperlink.m_oContentChanges.Check(AscCommon.contentchanges_Remove, this.PosArray[nIndex]);

		if (false === ChangesPos)
			continue;

		oHyperlink.Content.splice(ChangesPos, 1);
		AscCommon.CollaborativeEditing.Update_DocumentPositionsOnRemove(oHyperlink, ChangesPos, 1);
	}
	oHyperlink.private_UpdateTrackRevisions();
	oHyperlink.private_CheckUpdateBookmarks(this.Items);
	oHyperlink.private_UpdateSpellChecking();
};
CChangesHyperlinkRemoveItem.prototype.IsRelated = function(oChanges)
{
	if (this.Class === oChanges.Class && (AscDFH.historyitem_Hyperlink_AddItem === oChanges.Type || AscDFH.historyitem_Hyperlink_RemoveItem === oChanges.Type))
		return true;

	return false;
};
CChangesHyperlinkRemoveItem.prototype.CreateReverseChange = function()
{
	return this.private_CreateReverseChange(CChangesHyperlinkAddItem);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseStringValue}
 */
function CChangesHyperlinkAnchor(Class, Old, New, Color)
{
	AscDFH.CChangesBaseStringValue.call(this, Class, Old, New, Color);
}
CChangesHyperlinkAnchor.prototype = Object.create(AscDFH.CChangesBaseStringValue.prototype);
CChangesHyperlinkAnchor.prototype.constructor = CChangesHyperlinkAnchor;
CChangesHyperlinkAnchor.prototype.Type = AscDFH.historyitem_Hyperlink_Anchor;
CChangesHyperlinkAnchor.prototype.private_SetValue = function(Value)
{
	this.Class.Anchor = Value;
};
