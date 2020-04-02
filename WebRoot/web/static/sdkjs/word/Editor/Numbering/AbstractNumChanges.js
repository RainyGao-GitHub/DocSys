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
 * Time: 14:37
 */

AscDFH.changesFactory[AscDFH.historyitem_AbstractNum_LvlChange]    = CChangesAbstractNumLvlChange;
AscDFH.changesFactory[AscDFH.historyitem_AbstractNum_TextPrChange] = CChangesAbstractNumTextPrChange;
AscDFH.changesFactory[AscDFH.historyitem_AbstractNum_ParaPrChange] = CChangesAbstractNumParaPrChange;
AscDFH.changesFactory[AscDFH.historyitem_AbstractNum_StyleLink]    = CChangesAbstractNumStyleLink;
AscDFH.changesFactory[AscDFH.historyitem_AbstractNum_NumStyleLink] = CChangesAbstractNumNumStyleLink;

//----------------------------------------------------------------------------------------------------------------------
// Карта зависимости изменений
//----------------------------------------------------------------------------------------------------------------------
AscDFH.changesRelationMap[AscDFH.historyitem_AbstractNum_LvlChange]    = [
	AscDFH.historyitem_AbstractNum_LvlChange,
	AscDFH.historyitem_AbstractNum_TextPrChange,
	AscDFH.historyitem_AbstractNum_ParaPrChange
];
AscDFH.changesRelationMap[AscDFH.historyitem_AbstractNum_TextPrChange] = [
	AscDFH.historyitem_AbstractNum_LvlChange,
	AscDFH.historyitem_AbstractNum_TextPrChange
];
AscDFH.changesRelationMap[AscDFH.historyitem_AbstractNum_ParaPrChange] = [
	AscDFH.historyitem_AbstractNum_LvlChange,
	AscDFH.historyitem_AbstractNum_ParaPrChange
];
AscDFH.changesRelationMap[AscDFH.historyitem_AbstractNum_StyleLink] = [
	AscDFH.historyitem_AbstractNum_StyleLink
];
AscDFH.changesRelationMap[AscDFH.historyitem_AbstractNum_NumStyleLink] = [
	AscDFH.historyitem_AbstractNum_NumStyleLink
];
//----------------------------------------------------------------------------------------------------------------------


/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesAbstractNumLvlChange(Class, Old, New, Index)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);

	this.Index = Index;
}
CChangesAbstractNumLvlChange.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesAbstractNumLvlChange.prototype.constructor = CChangesAbstractNumLvlChange;
CChangesAbstractNumLvlChange.prototype.Type = AscDFH.historyitem_AbstractNum_LvlChange;
CChangesAbstractNumLvlChange.prototype.WriteToBinary = function(Writer)
{
	// Long          : Lvl index
	// CNumberingLvl : New Lvl
	// CNumberingLvl : Old Lvl

	Writer.WriteLong(this.Index);
	this.New.WriteToBinary(Writer);
	this.Old.WriteToBinary(Writer);
};
CChangesAbstractNumLvlChange.prototype.ReadFromBinary = function(Reader)
{
	// Long          : Lvl index
	// CNumberingLvl : New Lvl
	// CNumberingLvl : Old Lvl

	this.New = new CNumberingLvl();
	this.Old = new CNumberingLvl();

	this.Index = Reader.GetLong();
	this.New.ReadFromBinary(Reader);
	this.Old.ReadFromBinary(Reader);
};
CChangesAbstractNumLvlChange.prototype.private_SetValue = function(Value)
{
	var oAbstractNum = this.Class;
	oAbstractNum.Lvl[this.Index] = Value;
	oAbstractNum.Recalc_CompiledPr(this.Index);
};
CChangesAbstractNumLvlChange.prototype.Load = function(Color)
{
	var oAbstractNum = this.Class;
	oAbstractNum.Lvl[this.Index] = this.New;

	// Сразу нельзя запускать пересчет, т.к. возможно еще не все ссылки проставлены
	AscCommon.CollaborativeEditing.Add_EndActions(this.Class, {iLvl : this.Index});
};
CChangesAbstractNumLvlChange.prototype.CreateReverseChange = function()
{
	return new CChangesAbstractNumLvlChange(this.Class, this.New, this.Old, this.Index);
};
CChangesAbstractNumLvlChange.prototype.Merge = function(oChange)
{
	if (this.Class !== oChange.Class)
		return true;

	if (this.Type === oChange.Type)
		return false;

	if (AscDFH.historyitem_AbstractNum_TextPrChange === oChange.Type)
	{
		this.New.TextPr = oChange.New;
	}
	else if (AscDFH.historyitem_AbstractNum_ParaPrChange === oChange.Type)
	{
		this.New.ParaPr = oChange.New;
	}

	return true;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesAbstractNumTextPrChange(Class, Old, New, Index)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);

	this.Index = Index;
}
CChangesAbstractNumTextPrChange.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesAbstractNumTextPrChange.prototype.constructor = CChangesAbstractNumTextPrChange;
CChangesAbstractNumTextPrChange.prototype.Type = AscDFH.historyitem_AbstractNum_TextPrChange;
CChangesAbstractNumTextPrChange.prototype.WriteToBinary = function(Writer)
{
	// Long : Lvl index
	// TextPr : New TextPr
	// TextPr : Old TextPr

	Writer.WriteLong(this.Index);
	this.New.Write_ToBinary(Writer);
	this.Old.Write_ToBinary(Writer);
};
CChangesAbstractNumTextPrChange.prototype.ReadFromBinary = function(Reader)
{
	// Long : Lvl index
	// TextPr : New TextPr
	// TextPr : Old TextPr

	this.New = new CTextPr();
	this.Old = new CTextPr();

	this.Index = Reader.GetLong();
	this.New.Read_FromBinary(Reader);
	this.Old.Read_FromBinary(Reader);
};
CChangesAbstractNumTextPrChange.prototype.private_SetValue = function(Value)
{
	var oAbstractNum = this.Class;
	oAbstractNum.Lvl[this.Index].TextPr = Value;
	oAbstractNum.Recalc_CompiledPr(this.Index);
};
CChangesAbstractNumTextPrChange.prototype.Load = function(Color)
{
	var oAbstractNum = this.Class;
	oAbstractNum.Lvl[this.Index].TextPr = this.New;

	// Сразу нельзя запускать пересчет, т.к. возможно еще не все ссылки проставлены
	AscCommon.CollaborativeEditing.Add_EndActions(this.Class, {iLvl : this.Index});
};
CChangesAbstractNumTextPrChange.prototype.CreateReverseChange = function()
{
	return new CChangesAbstractNumTextPrChange(this.Class, this.New, this.Old, this.Index);
};
CChangesAbstractNumTextPrChange.prototype.Merge = function(oChange)
{
	if (this.Class !== oChange.Class)
		return true;

	if (this.Type === oChange.Type || oChange.Type === AscDFH.historyitem_AbstractNum_LvlChange)
		return false;

	return true;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesAbstractNumParaPrChange(Class, Old, New, Index)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);

	this.Index = Index;
}
CChangesAbstractNumParaPrChange.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesAbstractNumParaPrChange.prototype.constructor = CChangesAbstractNumParaPrChange;
CChangesAbstractNumParaPrChange.prototype.Type = AscDFH.historyitem_AbstractNum_ParaPrChange;
CChangesAbstractNumParaPrChange.prototype.WriteToBinary = function(Writer)
{
	// Long : Lvl index
	// ParaPr : New ParaPr
	// ParaPr : Old ParaPr

	Writer.WriteLong(this.Index);
	this.New.Write_ToBinary(Writer);
	this.Old.Write_ToBinary(Writer);
};
CChangesAbstractNumParaPrChange.prototype.ReadFromBinary = function(Reader)
{
	// Long : Lvl index
	// ParaPr : New ParaPr
	// ParaPr : Old ParaPr

	this.New = new CParaPr();
	this.Old = new CParaPr();

	this.Index = Reader.GetLong();
	this.New.Read_FromBinary(Reader);
	this.Old.Read_FromBinary(Reader);
};
CChangesAbstractNumParaPrChange.prototype.private_SetValue = function(Value)
{
	var oAbstractNum = this.Class;
	oAbstractNum.Lvl[this.Index].ParaPr = Value;
	oAbstractNum.Recalc_CompiledPr(this.Index);
};
CChangesAbstractNumParaPrChange.prototype.Load = function(Color)
{
	var oAbstractNum = this.Class;
	oAbstractNum.Lvl[this.Index].ParaPr = this.New;

	// Сразу нельзя запускать пересчет, т.к. возможно еще не все ссылки проставлены
	AscCommon.CollaborativeEditing.Add_EndActions(this.Class, {iLvl : this.Index});
};
CChangesAbstractNumParaPrChange.prototype.CreateReverseChange = function()
{
	return new CChangesAbstractNumParaPrChange(this.Class, this.New, this.Old, this.Index);
};
CChangesAbstractNumParaPrChange.prototype.Merge = function(oChange)
{
	if (this.Class !== oChange.Class)
		return true;

	if (this.Type === oChange.Type || oChange.Type === AscDFH.historyitem_AbstractNum_LvlChange)
		return false;

	return true;
};

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseStringProperty}
 */
function CChangesAbstractNumStyleLink(Class, Old, New)
{
	AscDFH.CChangesBaseStringProperty.call(this, Class, Old, New);
}
CChangesAbstractNumStyleLink.prototype = Object.create(AscDFH.CChangesBaseStringProperty.prototype);
CChangesAbstractNumStyleLink.prototype.constructor = CChangesAbstractNumStyleLink;
CChangesAbstractNumStyleLink.prototype.Type = AscDFH.historyitem_AbstractNum_StyleLink;
CChangesAbstractNumStyleLink.prototype.private_SetValue = function(Value)
{
	this.Class.StyleLink = Value;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseStringProperty}
 */
function CChangesAbstractNumNumStyleLink(Class, Old, New)
{
	AscDFH.CChangesBaseStringProperty.call(this, Class, Old, New);
}
CChangesAbstractNumNumStyleLink.prototype = Object.create(AscDFH.CChangesBaseStringProperty.prototype);
CChangesAbstractNumNumStyleLink.prototype.constructor = CChangesAbstractNumNumStyleLink;
CChangesAbstractNumNumStyleLink.prototype.Type = AscDFH.historyitem_AbstractNum_NumStyleLink;
CChangesAbstractNumNumStyleLink.prototype.private_SetValue = function(Value)
{
	this.Class.NumStyleLink = Value;
};
