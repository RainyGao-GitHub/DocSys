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
 * Time: 14:03
 */

AscDFH.changesFactory[AscDFH.historyitem_DocumentContent_AddItem]    = CChangesDocumentContentAddItem;
AscDFH.changesFactory[AscDFH.historyitem_DocumentContent_RemoveItem] = CChangesDocumentContentRemoveItem;

//----------------------------------------------------------------------------------------------------------------------
// Карта зависимости изменений
//----------------------------------------------------------------------------------------------------------------------
AscDFH.changesRelationMap[AscDFH.historyitem_DocumentContent_AddItem]    = [
	AscDFH.historyitem_DocumentContent_AddItem,
	AscDFH.historyitem_DocumentContent_RemoveItem
];
AscDFH.changesRelationMap[AscDFH.historyitem_DocumentContent_RemoveItem] = [
	AscDFH.historyitem_DocumentContent_AddItem,
	AscDFH.historyitem_DocumentContent_RemoveItem
];
//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseContentChange}
 */
function CChangesDocumentContentAddItem(Class, Pos, Items)
{
	AscDFH.CChangesBaseContentChange.call(this, Class, Pos, Items, true);
}
CChangesDocumentContentAddItem.prototype = Object.create(AscDFH.CChangesBaseContentChange.prototype);
CChangesDocumentContentAddItem.prototype.constructor = CChangesDocumentContentAddItem;
CChangesDocumentContentAddItem.prototype.Type = AscDFH.historyitem_DocumentContent_AddItem;
CChangesDocumentContentAddItem.prototype.Undo = function()
{
	var oDocument = this.Class;
	for (var nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
	{
		var Pos = true !== this.UseArray ? this.Pos : this.PosArray[nIndex];
		var Elements = oDocument.Content.splice(Pos, 1);
		oDocument.private_RecalculateNumbering(Elements);
		oDocument.private_ReindexContent(Pos);

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
CChangesDocumentContentAddItem.prototype.Redo = function()
{
	var oDocument = this.Class;
	for (var nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
	{
		var Element = this.Items[nIndex];
		var Pos     = true !== this.UseArray ? this.Pos + nIndex : this.PosArray[nIndex];

		oDocument.Content.splice(Pos, 0, Element);
		oDocument.private_RecalculateNumbering([Element]);
		oDocument.private_ReindexContent(Pos);

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
CChangesDocumentContentAddItem.prototype.private_WriteItem = function(Writer, Item)
{
	Writer.WriteString2(Item.Get_Id());
};
CChangesDocumentContentAddItem.prototype.private_ReadItem = function(Reader)
{
	return AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CChangesDocumentContentAddItem.prototype.Load = function(Color)
{
	if (this.PosArray.length <= 0 || this.Items.length <= 0)
		return;

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
			oDocument.private_ReindexContent(Pos);

			AscCommon.CollaborativeEditing.Update_DocumentPositionsOnAdd(oDocument, Pos);
		}
	}
};
CChangesDocumentContentAddItem.prototype.IsRelated = function(oChanges)
{
	if (this.Class === oChanges.Class && (AscDFH.historyitem_DocumentContent_AddItem === oChanges.Type || AscDFH.historyitem_DocumentContent_RemoveItem === oChanges.Type))
		return true;

	return false;
};
CChangesDocumentContentAddItem.prototype.CreateReverseChange = function()
{
	return this.private_CreateReverseChange(CChangesDocumentContentRemoveItem);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseContentChange}
 */
function CChangesDocumentContentRemoveItem(Class, Pos, Items)
{
	AscDFH.CChangesBaseContentChange.call(this, Class, Pos, Items, false);
}
CChangesDocumentContentRemoveItem.prototype = Object.create(AscDFH.CChangesBaseContentChange.prototype);
CChangesDocumentContentRemoveItem.prototype.constructor = CChangesDocumentContentRemoveItem;
CChangesDocumentContentRemoveItem.prototype.Type = AscDFH.historyitem_DocumentContent_RemoveItem;
CChangesDocumentContentRemoveItem.prototype.Undo = function()
{
	if (!this.Items || this.Items.length <= 0)
		return;

	var oDocument = this.Class;

	var Array_start = oDocument.Content.slice(0, this.Pos);
	var Array_end   = oDocument.Content.slice(this.Pos);

	oDocument.private_RecalculateNumbering(this.Items);
	oDocument.private_ReindexContent(this.Pos);
	oDocument.Content = Array_start.concat(this.Items, Array_end);

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
CChangesDocumentContentRemoveItem.prototype.Redo = function()
{
	if (!this.Items || this.Items.length <= 0)
		return;

	var oDocument = this.Class;
	var Elements = oDocument.Content.splice(this.Pos, this.Items.length);
	oDocument.private_RecalculateNumbering(Elements);
	oDocument.private_ReindexContent(this.Pos);

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
CChangesDocumentContentRemoveItem.prototype.private_WriteItem = function(Writer, Item)
{
	Writer.WriteString2(Item.Get_Id());
};
CChangesDocumentContentRemoveItem.prototype.private_ReadItem = function(Reader)
{
	return AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CChangesDocumentContentRemoveItem.prototype.Load = function(Color)
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

		if (Pos > 0)
		{
			if (Pos <= oDocument.Content.length - 1)
			{
				oDocument.Content[Pos - 1].Next = oDocument.Content[Pos];
				oDocument.Content[Pos].Prev     = oDocument.Content[Pos - 1];
			}
			else
			{
				if (oDocument.Content[Pos - 1])
					oDocument.Content[Pos - 1].Next = null;
			}
		}
		else if (Pos <= oDocument.Content.length - 1)
		{
			oDocument.Content[Pos].Prev = null;
		}

		oDocument.private_ReindexContent(Pos);
	}
};
CChangesDocumentContentRemoveItem.prototype.IsRelated = function(oChanges)
{
	if (this.Class === oChanges.Class && (AscDFH.historyitem_DocumentContent_AddItem === oChanges.Type || AscDFH.historyitem_DocumentContent_RemoveItem === oChanges.Type))
		return true;

	return false;
};
CChangesDocumentContentRemoveItem.prototype.CreateReverseChange = function()
{
	return this.private_CreateReverseChange(CChangesDocumentContentAddItem);
};
