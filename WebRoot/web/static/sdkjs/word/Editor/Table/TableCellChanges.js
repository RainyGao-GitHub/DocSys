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
 * Date: 07.11.2016
 * Time: 16:57
 */

AscDFH.changesFactory[AscDFH.historyitem_TableCell_GridSpan]      = CChangesTableCellGridSpan;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_Margins]       = CChangesTableCellMargins;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_Shd]           = CChangesTableCellShd;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_VMerge]        = CChangesTableCellVMerge;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_Border_Left]   = CChangesTableCellBorderLeft;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_Border_Right]  = CChangesTableCellBorderRight;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_Border_Top]    = CChangesTableCellBorderTop;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_Border_Bottom] = CChangesTableCellBorderBottom;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_VAlign]        = CChangesTableCellVAlign;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_W]             = CChangesTableCellW;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_Pr]            = CChangesTableCellPr;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_TextDirection] = CChangesTableCellTextDirection;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_NoWrap]        = CChangesTableCellNoWrap;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_HMerge]        = CChangesTableCellHMerge;
AscDFH.changesFactory[AscDFH.historyitem_TableCell_PrChange]      = CChangesTableCellPrChange;

//----------------------------------------------------------------------------------------------------------------------
// Карта зависимости изменений
//----------------------------------------------------------------------------------------------------------------------
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_GridSpan]      = [
	AscDFH.historyitem_TableCell_GridSpan,
	AscDFH.historyitem_TableCell_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_Margins]       = [
	AscDFH.historyitem_TableCell_Margins,
	AscDFH.historyitem_TableCell_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_Shd]           = [
	AscDFH.historyitem_TableCell_Shd,
	AscDFH.historyitem_TableCell_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_VMerge]        = [
	AscDFH.historyitem_TableCell_VMerge,
	AscDFH.historyitem_TableCell_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_Border_Left]   = [
	AscDFH.historyitem_TableCell_Border_Left,
	AscDFH.historyitem_TableCell_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_Border_Right]  = [
	AscDFH.historyitem_TableCell_Border_Right,
	AscDFH.historyitem_TableCell_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_Border_Top]    = [
	AscDFH.historyitem_TableCell_Border_Top,
	AscDFH.historyitem_TableCell_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_Border_Bottom] = [
	AscDFH.historyitem_TableCell_Border_Bottom,
	AscDFH.historyitem_TableCell_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_VAlign]        = [
	AscDFH.historyitem_TableCell_VAlign,
	AscDFH.historyitem_TableCell_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_W]             = [
	AscDFH.historyitem_TableCell_W,
	AscDFH.historyitem_TableCell_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_Pr]            = [
	AscDFH.historyitem_TableCell_GridSpan,
	AscDFH.historyitem_TableCell_Margins,
	AscDFH.historyitem_TableCell_Shd,
	AscDFH.historyitem_TableCell_VMerge,
	AscDFH.historyitem_TableCell_Border_Left,
	AscDFH.historyitem_TableCell_Border_Right,
	AscDFH.historyitem_TableCell_Border_Top,
	AscDFH.historyitem_TableCell_Border_Bottom,
	AscDFH.historyitem_TableCell_VAlign,
	AscDFH.historyitem_TableCell_W,
	AscDFH.historyitem_TableCell_Pr,
	AscDFH.historyitem_TableCell_TextDirection,
	AscDFH.historyitem_TableCell_NoWrap,
	AscDFH.historyitem_TableCell_HMerge,
	AscDFH.historyitem_TableCell_PrChange
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_TextDirection] = [
	AscDFH.historyitem_TableCell_TextDirection,
	AscDFH.historyitem_TableCell_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_NoWrap]        = [
	AscDFH.historyitem_TableCell_NoWrap,
	AscDFH.historyitem_TableCell_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_HMerge]        = [
	AscDFH.historyitem_TableCell_HMerge,
	AscDFH.historyitem_TableCell_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_TableCell_PrChange] = [
	AscDFH.historyitem_TableCell_PrChange,
	AscDFH.historyitem_TableCell_Pr
];
/**
 * Общая функция объединения изменений, которые зависят только от себя и AscDFH.historyitem_TableCell_Pr
 * @param oChange
 * @returns {boolean}
 */
function private_TableCellChangesOnMergePr(oChange)
{
	if (oChange.Class !== this.Class)
		return true;

	if (oChange.Type === this.Type || oChange.Type === AscDFH.historyitem_TableCell_Pr)
		return false;

	return true;
}
//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesTableCellGridSpan(Class, Old, New, Color)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New, Color);
}
CChangesTableCellGridSpan.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesTableCellGridSpan.prototype.constructor = CChangesTableCellGridSpan;
CChangesTableCellGridSpan.prototype.Type = AscDFH.historyitem_TableCell_GridSpan;
CChangesTableCellGridSpan.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr.GridSpan = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellGridSpan.prototype.Merge = private_TableCellChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesTableCellMargins(Class, Old, New, Color)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New, Color);
}
CChangesTableCellMargins.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesTableCellMargins.prototype.constructor = CChangesTableCellMargins;
CChangesTableCellMargins.prototype.Type = AscDFH.historyitem_TableCell_Margins;
CChangesTableCellMargins.prototype.WriteToBinary = function(Writer)
{
	// Long  : Flag
	// 1-bit : Is New undefined?
	// 2-bit : Is New null?
	// 3-bit : Is Old undefined?
	// 4-bit : Is Old null?

	// 5-bit  : is New.Left undefined
	// 6-bit  : is New.Top undefined
	// 7-bit  : is New.Right undefined
	// 8-bit  : is New.Bottom undefined
	// 9-bit  : is Old.Left undefined
	// 10-bit : is Old.Top undefined
	// 11-bit : is Old.Right undefined
	// 12-bit : is Old.Bottom undefined

	// CTableMeasure : New.Left
	// CTableMeasure : New.Top
	// CTableMeasure : New.Right
	// CTableMeasure : New.Bottom
	// CTableMeasure : Old.Left
	// CTableMeasure : Old.Top
	// CTableMeasure : Old.Right
	// CTableMeasure : Old.Bottom

	var nFlags = 0;

	if (undefined === this.New)
		nFlags |= 1;
	if (null === this.New)
		nFlags |= 2;
	if (undefined === this.Old)
		nFlags |= 4;
	if (null === this.Old)
		nFlags |= 8;

	if (this.New)
	{
		if (this.New.Left)
			nFlags |= 16;

		if (this.New.Top)
			nFlags |= 32;

		if (this.New.Right)
			nFlags |= 64;

		if (this.New.Bottom)
			nFlags |= 128;
	}

	if (this.Old)
	{
		if (this.Old.Left)
			nFlags |= 256;

		if (this.Old.Top)
			nFlags |= 512;

		if (this.Old.Right)
			nFlags |= 1024;

		if (this.Old.Bottom)
			nFlags |= 2048;
	}

	Writer.WriteLong(nFlags);

	if (this.New)
	{
		if (this.New.Left)
			this.New.Left.WriteToBinary(Writer);

		if (this.New.Top)
			this.New.Top.WriteToBinary(Writer);

		if (this.New.Right)
			this.New.Right.WriteToBinary(Writer);

		if (this.New.Bottom)
			this.New.Bottom.WriteToBinary(Writer);
	}

	if (this.Old)
	{
		if (this.Old.Left)
			this.Old.Left.WriteToBinary(Writer);

		if (this.Old.Top)
			this.Old.Top.WriteToBinary(Writer);

		if (this.Old.Right)
			this.Old.Right.WriteToBinary(Writer);

		if (this.Old.Bottom)
			this.Old.Bottom.WriteToBinary(Writer);
	}
};
CChangesTableCellMargins.prototype.ReadFromBinary = function(Reader)
{
	// Long  : Flag
	// 1-bit : Is New undefined?
	// 2-bit : Is New null?
	// 3-bit : Is Old undefined?
	// 4-bit : Is Old null?

	// 5-bit  : is New.Left undefined
	// 6-bit  : is New.Top undefined
	// 7-bit  : is New.Right undefined
	// 8-bit  : is New.Bottom undefined
	// 9-bit  : is Old.Left undefined
	// 10-bit : is Old.Top undefined
	// 11-bit : is Old.Right undefined
	// 12-bit : is Old.Bottom undefined

	// CTableMeasure : New.Left
	// CTableMeasure : New.Top
	// CTableMeasure : New.Right
	// CTableMeasure : New.Bottom
	// CTableMeasure : Old.Left
	// CTableMeasure : Old.Top
	// CTableMeasure : Old.Right
	// CTableMeasure : Old.Bottom

	var nFlags = Reader.GetLong();

	if (nFlags & 1)
	{
		this.New = undefined;
	}
	else if (nFlags & 2)
	{
		this.New = null;
	}
	else
	{
		this.New = {
			Left   : undefined,
			Top    : undefined,
			Right  : undefined,
			Bottom : undefined
		};

		if (nFlags & 16)
		{
			this.New.Left = new CTableMeasurement(tblwidth_Auto, 0);
			this.New.Left.ReadFromBinary(Reader);
		}

		if (nFlags & 32)
		{
			this.New.Top = new CTableMeasurement(tblwidth_Auto, 0);
			this.New.Top.ReadFromBinary(Reader);
		}

		if (nFlags & 64)
		{
			this.New.Right = new CTableMeasurement(tblwidth_Auto, 0);
			this.New.Right.ReadFromBinary(Reader);
		}

		if (nFlags & 128)
		{
			this.New.Bottom = new CTableMeasurement(tblwidth_Auto, 0);
			this.New.Bottom.ReadFromBinary(Reader);
		}
	}

	if (nFlags & 4)
	{
		this.Old = undefined;
	}
	else if (nFlags & 8)
	{
		this.Old = null;
	}
	else
	{
		this.Old = {
			Left   : undefined,
			Top    : undefined,
			Right  : undefined,
			Bottom : undefined
		};

		if (nFlags & 256)
		{
			this.Old.Left = new CTableMeasurement(tblwidth_Auto, 0);
			this.Old.Left.ReadFromBinary(Reader);
		}

		if (nFlags & 512)
		{
			this.Old.Top = new CTableMeasurement(tblwidth_Auto, 0);
			this.Old.Top.ReadFromBinary(Reader);
		}

		if (nFlags & 1024)
		{
			this.Old.Right = new CTableMeasurement(tblwidth_Auto, 0);
			this.Old.Right.ReadFromBinary(Reader);
		}

		if (nFlags & 2048)
		{
			this.Old.Bottom = new CTableMeasurement(tblwidth_Auto, 0);
			this.Old.Bottom.ReadFromBinary(Reader);
		}
	}
};
CChangesTableCellMargins.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr.TableCellMar = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellMargins.prototype.Merge = private_TableCellChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesTableCellShd(Class, Old, New, Color)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New, Color);
}
CChangesTableCellShd.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesTableCellShd.prototype.constructor = CChangesTableCellShd;
CChangesTableCellShd.prototype.Type = AscDFH.historyitem_TableCell_Shd;
CChangesTableCellShd.prototype.private_CreateObject = function()
{
	return new CDocumentShd();
};
CChangesTableCellShd.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr.Shd = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellShd.prototype.Merge = private_TableCellChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesTableCellVMerge(Class, Old, New, Color)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New, Color);
}
CChangesTableCellVMerge.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesTableCellVMerge.prototype.constructor = CChangesTableCellVMerge;
CChangesTableCellVMerge.prototype.Type = AscDFH.historyitem_TableCell_VMerge;
CChangesTableCellVMerge.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr.VMerge = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellVMerge.prototype.Merge = private_TableCellChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesTableCellBorderLeft(Class, Old, New, Color)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New, Color);
}
CChangesTableCellBorderLeft.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesTableCellBorderLeft.prototype.constructor = CChangesTableCellBorderLeft;
CChangesTableCellBorderLeft.prototype.Type = AscDFH.historyitem_TableCell_Border_Left;
CChangesTableCellBorderLeft.prototype.WriteToBinary = function(Writer)
{
	// Long  : Flag
	// 1-bit : Is New undefined?
	// 2-bit : Is New null?
	// 3-bit : Is Old undefined?
	// 4-bit : Is Old null?

	// CDocumentBorder : New
	// CDocumentBorder : Old

	var nFlags = 0;

	if (undefined === this.New)
		nFlags |= 1;
	if (null === this.New)
		nFlags |= 2;
	if (undefined === this.Old)
		nFlags |= 4;
	if (null === this.Old)
		nFlags |= 8;

	Writer.WriteLong(nFlags);

	if (undefined !== this.New && null !== this.New)
		this.New.Write_ToBinary(Writer);

	if (undefined !== this.Old && null !== this.Old)
		this.Old.Write_ToBinary(Writer);
};
CChangesTableCellBorderLeft.prototype.ReadFromBinary = function(Reader)
{
	// Long  : Flag
	// 1-bit : Is New undefined?
	// 2-bit : Is New null?
	// 3-bit : Is Old undefined?
	// 4-bit : Is Old null?

	// CDocumentBorder : New
	// CDocumentBorder : Old

	var nFlags = Reader.GetLong();

	if (nFlags & 1)
	{
		this.New = undefined;
	}
	else if (nFlags & 2)
	{
		this.New = null;
	}
	else
	{
		this.New = new CDocumentBorder();
		this.New.Read_FromBinary(Reader);
	}

	if (nFlags & 4)
	{
		this.Old = undefined;
	}
	else if (nFlags & 8)
	{
		this.Old = null;
	}
	else
	{
		this.Old = new CDocumentBorder();
		this.Old.Read_FromBinary(Reader);
	}
};
CChangesTableCellBorderLeft.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr.TableCellBorders.Left = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellBorderLeft.prototype.Merge = private_TableCellChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesTableCellBorderTop(Class, Old, New, Color)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New, Color);
}
CChangesTableCellBorderTop.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesTableCellBorderTop.prototype.constructor = CChangesTableCellBorderTop;
CChangesTableCellBorderTop.prototype.Type = AscDFH.historyitem_TableCell_Border_Top;
CChangesTableCellBorderTop.prototype.WriteToBinary = function(Writer)
{
	// Long  : Flag
	// 1-bit : Is New undefined?
	// 2-bit : Is New null?
	// 3-bit : Is Old undefined?
	// 4-bit : Is Old null?

	// CDocumentBorder : New
	// CDocumentBorder : Old

	var nFlags = 0;

	if (undefined === this.New)
		nFlags |= 1;
	if (null === this.New)
		nFlags |= 2;
	if (undefined === this.Old)
		nFlags |= 4;
	if (null === this.Old)
		nFlags |= 8;

	Writer.WriteLong(nFlags);

	if (undefined !== this.New && null !== this.New)
		this.New.Write_ToBinary(Writer);

	if (undefined !== this.Old && null !== this.Old)
		this.Old.Write_ToBinary(Writer);
};
CChangesTableCellBorderTop.prototype.ReadFromBinary = function(Reader)
{
	// Long  : Flag
	// 1-bit : Is New undefined?
	// 2-bit : Is New null?
	// 3-bit : Is Old undefined?
	// 4-bit : Is Old null?

	// CDocumentBorder : New
	// CDocumentBorder : Old

	var nFlags = Reader.GetLong();

	if (nFlags & 1)
	{
		this.New = undefined;
	}
	else if (nFlags & 2)
	{
		this.New = null;
	}
	else
	{
		this.New = new CDocumentBorder();
		this.New.Read_FromBinary(Reader);
	}

	if (nFlags & 4)
	{
		this.Old = undefined;
	}
	else if (nFlags & 8)
	{
		this.Old = null;
	}
	else
	{
		this.Old = new CDocumentBorder();
		this.Old.Read_FromBinary(Reader);
	}
};
CChangesTableCellBorderTop.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr.TableCellBorders.Top = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellBorderTop.prototype.Merge = private_TableCellChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesTableCellBorderRight(Class, Old, New, Color)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New, Color);
}
CChangesTableCellBorderRight.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesTableCellBorderRight.prototype.constructor = CChangesTableCellBorderRight;
CChangesTableCellBorderRight.prototype.Type = AscDFH.historyitem_TableCell_Border_Right;
CChangesTableCellBorderRight.prototype.WriteToBinary = function(Writer)
{
	// Long  : Flag
	// 1-bit : Is New undefined?
	// 2-bit : Is New null?
	// 3-bit : Is Old undefined?
	// 4-bit : Is Old null?

	// CDocumentBorder : New
	// CDocumentBorder : Old

	var nFlags = 0;

	if (undefined === this.New)
		nFlags |= 1;
	if (null === this.New)
		nFlags |= 2;
	if (undefined === this.Old)
		nFlags |= 4;
	if (null === this.Old)
		nFlags |= 8;

	Writer.WriteLong(nFlags);

	if (undefined !== this.New && null !== this.New)
		this.New.Write_ToBinary(Writer);

	if (undefined !== this.Old && null !== this.Old)
		this.Old.Write_ToBinary(Writer);
};
CChangesTableCellBorderRight.prototype.ReadFromBinary = function(Reader)
{
	// Long  : Flag
	// 1-bit : Is New undefined?
	// 2-bit : Is New null?
	// 3-bit : Is Old undefined?
	// 4-bit : Is Old null?

	// CDocumentBorder : New
	// CDocumentBorder : Old

	var nFlags = Reader.GetLong();

	if (nFlags & 1)
	{
		this.New = undefined;
	}
	else if (nFlags & 2)
	{
		this.New = null;
	}
	else
	{
		this.New = new CDocumentBorder();
		this.New.Read_FromBinary(Reader);
	}

	if (nFlags & 4)
	{
		this.Old = undefined;
	}
	else if (nFlags & 8)
	{
		this.Old = null;
	}
	else
	{
		this.Old = new CDocumentBorder();
		this.Old.Read_FromBinary(Reader);
	}
};
CChangesTableCellBorderRight.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr.TableCellBorders.Right = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellBorderRight.prototype.Merge = private_TableCellChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesTableCellBorderBottom(Class, Old, New, Color)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New, Color);
}
CChangesTableCellBorderBottom.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesTableCellBorderBottom.prototype.constructor = CChangesTableCellBorderBottom;
CChangesTableCellBorderBottom.prototype.Type = AscDFH.historyitem_TableCell_Border_Bottom;
CChangesTableCellBorderBottom.prototype.WriteToBinary = function(Writer)
{
	// Long  : Flag
	// 1-bit : Is New undefined?
	// 2-bit : Is New null?
	// 3-bit : Is Old undefined?
	// 4-bit : Is Old null?

	// CDocumentBorder : New
	// CDocumentBorder : Old

	var nFlags = 0;

	if (undefined === this.New)
		nFlags |= 1;
	if (null === this.New)
		nFlags |= 2;
	if (undefined === this.Old)
		nFlags |= 4;
	if (null === this.Old)
		nFlags |= 8;

	Writer.WriteLong(nFlags);

	if (undefined !== this.New && null !== this.New)
		this.New.Write_ToBinary(Writer);

	if (undefined !== this.Old && null !== this.Old)
		this.Old.Write_ToBinary(Writer);
};
CChangesTableCellBorderBottom.prototype.ReadFromBinary = function(Reader)
{
	// Long  : Flag
	// 1-bit : Is New undefined?
	// 2-bit : Is New null?
	// 3-bit : Is Old undefined?
	// 4-bit : Is Old null?

	// CDocumentBorder : New
	// CDocumentBorder : Old

	var nFlags = Reader.GetLong();

	if (nFlags & 1)
	{
		this.New = undefined;
	}
	else if (nFlags & 2)
	{
		this.New = null;
	}
	else
	{
		this.New = new CDocumentBorder();
		this.New.Read_FromBinary(Reader);
	}

	if (nFlags & 4)
	{
		this.Old = undefined;
	}
	else if (nFlags & 8)
	{
		this.Old = null;
	}
	else
	{
		this.Old = new CDocumentBorder();
		this.Old.Read_FromBinary(Reader);
	}
};
CChangesTableCellBorderBottom.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr.TableCellBorders.Bottom = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellBorderBottom.prototype.Merge = private_TableCellChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesTableCellVAlign(Class, Old, New, Color)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New, Color);
}
CChangesTableCellVAlign.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesTableCellVAlign.prototype.constructor = CChangesTableCellVAlign;
CChangesTableCellVAlign.prototype.Type = AscDFH.historyitem_TableCell_VAlign;
CChangesTableCellVAlign.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr.VAlign = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellVAlign.prototype.Merge = private_TableCellChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectValue}
 */
function CChangesTableCellW(Class, Old, New, Color)
{
	AscDFH.CChangesBaseObjectValue.call(this, Class, Old, New, Color);
}
CChangesTableCellW.prototype = Object.create(AscDFH.CChangesBaseObjectValue.prototype);
CChangesTableCellW.prototype.constructor = CChangesTableCellW;
CChangesTableCellW.prototype.Type = AscDFH.historyitem_TableCell_W;
CChangesTableCellW.prototype.private_CreateObject = function()
{
	return new CTableMeasurement(tblwidth_Auto, 0);
};
CChangesTableCellW.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr.TableCellW = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellW.prototype.Merge = private_TableCellChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectValue}
 */
function CChangesTableCellPr(Class, Old, New, Color)
{
	AscDFH.CChangesBaseObjectValue.call(this, Class, Old, New, Color);
}
CChangesTableCellPr.prototype = Object.create(AscDFH.CChangesBaseObjectValue.prototype);
CChangesTableCellPr.prototype.constructor = CChangesTableCellPr;
CChangesTableCellPr.prototype.Type = AscDFH.historyitem_TableCell_Pr;
CChangesTableCellPr.prototype.private_CreateObject = function()
{
	return new CTableCellPr();
};
CChangesTableCellPr.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellPr.prototype.Merge = function(oChange)
{
	if (this.Class !== oChange.Class)
		return true;

	if (this.Type === oChange.Type)
		return false;

	if (!this.New)
		this.New = new CTableCellPr();

	switch(oChange.Type)
	{
		case AscDFH.historyitem_TableCell_GridSpan:
		{
			this.New.GridSpan = oChange.New;
			break;
		}
		case AscDFH.historyitem_TableCell_Margins:
		{
			this.New.TableCellMar = oChange.New;
			break;
		}
		case AscDFH.historyitem_TableCell_Shd:
		{
			this.New.Shd = oChange.New;
			break;
		}
		case AscDFH.historyitem_TableCell_VMerge:
		{
			this.New.VMerge = oChange.New;
			break;
		}
		case AscDFH.historyitem_TableCell_Border_Left:
		{
			this.New.TableCellBorders.Left = oChange.New;
			break;
		}
		case AscDFH.historyitem_TableCell_Border_Right:
		{
			this.New.TableCellBorders.Right = oChange.New;
			break;
		}
		case AscDFH.historyitem_TableCell_Border_Top:
		{
			this.New.TableCellBorders.Top = oChange.New;
			break;
		}
		case AscDFH.historyitem_TableCell_Border_Bottom:
		{
			this.New.TableCellBorders.Bottom = oChange.New;
			break;
		}
		case AscDFH.historyitem_TableCell_VAlign:
		{
			this.New.VAlign = oChange.New;
			break;
		}
		case AscDFH.historyitem_TableCell_W:
		{
			this.New.TableCellW = oChange.New;
			break;
		}
		case AscDFH.historyitem_TableCell_TextDirection:
		{
			this.New.TextDirection = oChange.New;
			break;
		}
		case AscDFH.historyitem_TableCell_NoWrap:
		{
			this.New.NoWrap = oChange.New;
			break;
		}
		case AscDFH.historyitem_TableCell_HMerge:
		{
			this.New.HMerge = oChange.New;
			break;
		}
	}

	return true;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesTableCellTextDirection(Class, Old, New, Color)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New, Color);
}
CChangesTableCellTextDirection.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesTableCellTextDirection.prototype.constructor = CChangesTableCellTextDirection;
CChangesTableCellTextDirection.prototype.Type = AscDFH.historyitem_TableCell_TextDirection;
CChangesTableCellTextDirection.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr.TextDirection = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellTextDirection.prototype.Merge = private_TableCellChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesTableCellNoWrap(Class, Old, New, Color)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New, Color);
}
CChangesTableCellNoWrap.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesTableCellNoWrap.prototype.constructor = CChangesTableCellNoWrap;
CChangesTableCellNoWrap.prototype.Type = AscDFH.historyitem_TableCell_NoWrap;
CChangesTableCellNoWrap.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr.NoWrap = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellNoWrap.prototype.Merge = private_TableCellChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesTableCellHMerge(Class, Old, New, Color)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New, Color);
}
CChangesTableCellHMerge.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesTableCellHMerge.prototype.constructor = CChangesTableCellHMerge;
CChangesTableCellHMerge.prototype.Type = AscDFH.historyitem_TableCell_HMerge;
CChangesTableCellHMerge.prototype.private_SetValue = function(Value)
{
	var oCell = this.Class;
	oCell.Pr.HMerge = Value;
	oCell.Recalc_CompiledPr();
};
CChangesTableCellHMerge.prototype.Merge = private_TableCellChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBase}
 */
function CChangesTableCellPrChange(Class, Old, New)
{
	AscDFH.CChangesBase.call(this, Class);

	this.Old = Old;
	this.New = New;
}
CChangesTableCellPrChange.prototype = Object.create(AscDFH.CChangesBase.prototype);
CChangesTableCellPrChange.prototype.constructor = CChangesTableCellPrChange;
CChangesTableCellPrChange.prototype.Type = AscDFH.historyitem_TableCell_PrChange;
CChangesTableCellPrChange.prototype.Undo = function()
{
	var oTableCell = this.Class;
	oTableCell.Pr.PrChange   = this.Old.PrChange;
	oTableCell.Pr.ReviewInfo = this.Old.ReviewInfo;
	oTableCell.private_UpdateTrackRevisions();
};
CChangesTableCellPrChange.prototype.Redo = function()
{
	var oTableCell = this.Class;
	oTableCell.Pr.PrChange   = this.New.PrChange;
	oTableCell.Pr.ReviewInfo = this.New.ReviewInfo;
	oTableCell.private_UpdateTrackRevisions();
};
CChangesTableCellPrChange.prototype.WriteToBinary = function(oWriter)
{
	// Long : Flags
	// 1-bit : is New.PrChange undefined ?
	// 2-bit : is New.ReviewInfo undefined ?
	// 3-bit : is Old.PrChange undefined ?
	// 4-bit : is Old.ReviewInfo undefined ?
	// Variable(CTableCellPr) : New.PrChange   (1bit = 0)
	// Variable(CReviewInfo)  : New.ReviewInfo (2bit = 0)
	// Variable(CTableCellPr) : Old.PrChange   (3bit = 0)
	// Variable(CReviewInfo)  : Old.ReviewInfo (4bit = 0)

	var nFlags = 0;
	if (undefined === this.New.PrChange)
		nFlags |= 1;

	if (undefined === this.New.ReviewInfo)
		nFlags |= 2;

	if (undefined === this.Old.PrChange)
		nFlags |= 4;

	if (undefined === this.Old.ReviewInfo)
		nFlags |= 8;

	oWriter.WriteLong(nFlags);

	if (undefined !== this.New.PrChange)
		this.New.PrChange.WriteToBinary(oWriter);

	if (undefined !== this.New.ReviewInfo)
		this.New.ReviewInfo.WriteToBinary(oWriter);

	if (undefined !== this.Old.PrChange)
		this.Old.PrChange.WriteToBinary(oWriter);

	if (undefined !== this.Old.ReviewInfo)
		this.Old.ReviewInfo.WriteToBinary(oWriter);
};
CChangesTableCellPrChange.prototype.ReadFromBinary = function(oReader)
{
	// Long : Flags
	// 1-bit : is New.PrChange undefined ?
	// 2-bit : is New.ReviewInfo undefined ?
	// 3-bit : is Old.PrChange undefined ?
	// 4-bit : is Old.ReviewInfo undefined ?
	// Variable(CTableCellPr) : New.PrChange   (1bit = 0)
	// Variable(CReviewInfo)  : New.ReviewInfo (2bit = 0)
	// Variable(CTableCellPr) : Old.PrChange   (3bit = 0)
	// Variable(CReviewInfo)  : Old.ReviewInfo (4bit = 0)

	var nFlags = oReader.GetLong();

	this.New = {
		PrChange   : undefined,
		ReviewInfo : undefined
	};

	this.Old = {
		PrChange   : undefined,
		ReviewInfo : undefined
	};

	if (nFlags & 1)
	{
		this.New.PrChange = undefined;
	}
	else
	{
		this.New.PrChange = new CTableCellPr();
		this.New.PrChange.ReadFromBinary(oReader);
	}

	if (nFlags & 2)
	{
		this.New.ReviewInfo = undefined;
	}
	else
	{
		this.New.ReviewInfo = new CReviewInfo();
		this.New.ReviewInfo.ReadFromBinary(oReader);
	}

	if (nFlags & 4)
	{
		this.Old.PrChange = undefined;
	}
	else
	{
		this.Old.PrChange = new CTableCellPr();
		this.Old.PrChange.ReadFromBinary(oReader);
	}

	if (nFlags & 8)
	{
		this.Old.ReviewInfo = undefined;
	}
	else
	{
		this.Old.ReviewInfo = new CReviewInfo();
		this.Old.ReviewInfo.ReadFromBinary(oReader);
	}
};
CChangesTableCellPrChange.prototype.CreateReverseChange = function()
{
	return new CChangesTableCellPrChange(this.Class, this.New, this.Old);
};
CChangesTableCellPrChange.prototype.Merge = function(oChange)
{
	if (this.Class !== oChange.Class)
		return true;

	if (oChange.Type === this.Type || AscDFH.historyitem_TableCell_Pr === oChange.Type)
		return false;

	return true;
};
