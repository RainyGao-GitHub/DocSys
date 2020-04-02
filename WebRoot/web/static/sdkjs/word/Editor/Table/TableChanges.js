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
 * Date: 03.11.2016
 * Time: 16:43
 */

AscDFH.changesFactory[AscDFH.historyitem_Table_TableW]                = CChangesTableTableW;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableCellMar]          = CChangesTableTableCellMar;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableAlign]            = CChangesTableTableAlign;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableInd]              = CChangesTableTableInd;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableBorder_Left]      = CChangesTableTableBorderLeft;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableBorder_Top]       = CChangesTableTableBorderTop;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableBorder_Right]     = CChangesTableTableBorderRight;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableBorder_Bottom]    = CChangesTableTableBorderBottom;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableBorder_InsideH]   = CChangesTableTableBorderInsideH;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableBorder_InsideV]   = CChangesTableTableBorderInsideV;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableShd]              = CChangesTableTableShd;
AscDFH.changesFactory[AscDFH.historyitem_Table_Inline]                = CChangesTableInline;
AscDFH.changesFactory[AscDFH.historyitem_Table_AddRow]                = CChangesTableAddRow;
AscDFH.changesFactory[AscDFH.historyitem_Table_RemoveRow]             = CChangesTableRemoveRow;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableGrid]             = CChangesTableTableGrid;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableLook]             = CChangesTableTableLook;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableStyleRowBandSize] = CChangesTableTableStyleRowBandSize;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableStyleColBandSize] = CChangesTableTableStyleColBandSize;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableStyle]            = CChangesTableTableStyle;
AscDFH.changesFactory[AscDFH.historyitem_Table_AllowOverlap]          = CChangesTableAllowOverlap;
AscDFH.changesFactory[AscDFH.historyitem_Table_PositionH]             = CChangesTablePositionH;
AscDFH.changesFactory[AscDFH.historyitem_Table_PositionV]             = CChangesTablePositionV;
AscDFH.changesFactory[AscDFH.historyitem_Table_Distance]              = CChangesTableDistance;
AscDFH.changesFactory[AscDFH.historyitem_Table_Pr]                    = CChangesTablePr;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableLayout]           = CChangesTableTableLayout;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableDescription]      = CChangesTableTableDescription;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableCaption]          = CChangesTableTableCaption;
AscDFH.changesFactory[AscDFH.historyitem_Table_TableGridChange]       = CChangesTableTableGridChange;
AscDFH.changesFactory[AscDFH.historyitem_Table_PrChange]              = CChangesTablePrChange;
//----------------------------------------------------------------------------------------------------------------------
// Карта зависимости изменений
//----------------------------------------------------------------------------------------------------------------------
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableW]                = [
	AscDFH.historyitem_Table_TableW,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableCellMar]          = [
	AscDFH.historyitem_Table_TableCellMar,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableAlign]            = [
	AscDFH.historyitem_Table_TableAlign,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableInd]              = [
	AscDFH.historyitem_Table_TableInd,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableBorder_Left]      = [
	AscDFH.historyitem_Table_TableBorder_Left,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableBorder_Top]       = [
	AscDFH.historyitem_Table_TableBorder_Top,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableBorder_Right]     = [
	AscDFH.historyitem_Table_TableBorder_Right,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableBorder_Bottom]    = [
	AscDFH.historyitem_Table_TableBorder_Bottom,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableBorder_InsideH]   = [
	AscDFH.historyitem_Table_TableBorder_InsideH,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableBorder_InsideV]   = [
	AscDFH.historyitem_Table_TableBorder_InsideV,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableShd]              = [
	AscDFH.historyitem_Table_TableShd,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_Inline]                = [
	AscDFH.historyitem_Table_Inline
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_AddRow]                = [
	AscDFH.historyitem_Table_AddRow,
	AscDFH.historyitem_Table_RemoveRow
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_RemoveRow]             = [
	AscDFH.historyitem_Table_AddRow,
	AscDFH.historyitem_Table_RemoveRow
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableGrid]             = [
	AscDFH.historyitem_Table_TableGrid
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableLook]             = [
	AscDFH.historyitem_Table_TableLook
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableStyleRowBandSize] = [
	AscDFH.historyitem_Table_TableStyleRowBandSize,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableStyleColBandSize] = [
	AscDFH.historyitem_Table_TableStyleColBandSize,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableStyle]            = [
	AscDFH.historyitem_Table_TableStyle
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_AllowOverlap]          = [
	AscDFH.historyitem_Table_AllowOverlap
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_PositionH]             = [
	AscDFH.historyitem_Table_PositionH
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_PositionV]             = [
	AscDFH.historyitem_Table_PositionV
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_Distance]              = [
	AscDFH.historyitem_Table_Distance
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_Pr]                    = [
	AscDFH.historyitem_Table_TableW,
	AscDFH.historyitem_Table_TableCellMar,
	AscDFH.historyitem_Table_TableAlign,
	AscDFH.historyitem_Table_TableInd,
	AscDFH.historyitem_Table_TableBorder_Left,
	AscDFH.historyitem_Table_TableBorder_Top,
	AscDFH.historyitem_Table_TableBorder_Right,
	AscDFH.historyitem_Table_TableBorder_Bottom,
	AscDFH.historyitem_Table_TableBorder_InsideH,
	AscDFH.historyitem_Table_TableBorder_InsideV,
	AscDFH.historyitem_Table_TableShd,
	AscDFH.historyitem_Table_TableStyleRowBandSize,
	AscDFH.historyitem_Table_TableStyleColBandSize,
	AscDFH.historyitem_Table_Pr,
	AscDFH.historyitem_Table_TableLayout,
	AscDFH.historyitem_Table_TableDescription,
	AscDFH.historyitem_Table_TableCaption,
	AscDFH.historyitem_Table_PrChange
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableLayout]           = [
	AscDFH.historyitem_Table_TableLayout,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableDescription] = [
	AscDFH.historyitem_Table_TableDescription,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableCaption]     = [
	AscDFH.historyitem_Table_TableCaption,
	AscDFH.historyitem_Table_Pr
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_TableGridChange] = [
	AscDFH.historyitem_Table_TableGridChange
];
AscDFH.changesRelationMap[AscDFH.historyitem_Table_PrChange] = [
	AscDFH.historyitem_Table_Pr,
	AscDFH.historyitem_Table_PrChange
];

/**
 * Общая функция объединения изменений, которые зависят только от себя и AscDFH.historyitem_Table_Pr
 * @param oChange
 * @returns {boolean}
 */
function private_TableChangesOnMergePr(oChange)
{
	if (oChange.Class !== this.Class)
		return true;

	if (oChange.Type === this.Type || oChange.Type === AscDFH.historyitem_Table_Pr)
		return false;

	return true;
}
//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesTableTableW(Class, Old, New, Color)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableW.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesTableTableW.prototype.constructor = CChangesTableTableW;
CChangesTableTableW.prototype.Type = AscDFH.historyitem_Table_TableW;
CChangesTableTableW.prototype.private_CreateObject = function()
{
	return new CTableMeasurement(tblwidth_Auto, 0);
};
CChangesTableTableW.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.TableW = Value;
	oTable.Recalc_CompiledPr();
};
CChangesTableTableW.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesTableTableCellMar(Class, Old, New, Color)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableCellMar.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesTableTableCellMar.prototype.constructor = CChangesTableTableCellMar;
CChangesTableTableCellMar.prototype.Type = AscDFH.historyitem_Table_TableCellMar;
CChangesTableTableCellMar.prototype.WriteToBinary = function(Writer)
{
	// Long  : Flag
	// 1-bit : Is New.Left undefined?
	// 2-bit : Is New.Top undefined?
	// 3-bit : Is New.Right undefined?
	// 4-bit : Is New.Bottom undefined?
	// 5-bit : Is Old.Left undefined?
	// 6-bit : Is Old.Top undefined?
	// 7-bit : Is Old.Right undefined?
	// 8-bit : Is Old.Bottom undefined?
	// Variable(?CTableMeasurement) : New.Left (1 бит нулевой)
	// Variable(?CTableMeasurement) : New.Top (2 бит нулевой)
	// Variable(?CTableMeasurement) : New.Right (3 бит нулевой)
	// Variable(?CTableMeasurement) : New.Bottom (4 бит нулевой)
	// Variable(?CTableMeasurement) : Old.Left (5 бит нулевой)
	// Variable(?CTableMeasurement) : Old.Top (6 бит нулевой)
	// Variable(?CTableMeasurement) : Old.Right (7 бит нулевой)
	// Variable(?CTableMeasurement) : Old.Bottom (8 бит нулевой)

	var nFlags = 0;

	if (undefined === this.New.Left)
		nFlags |= 1;
	if (undefined === this.New.Top)
		nFlags |= 2;
	if (undefined === this.New.Right)
		nFlags |= 4;
	if (undefined === this.New.Bottom)
		nFlags |= 8;
	if (undefined === this.Old.Left)
		nFlags |= 16;
	if (undefined === this.Old.Top)
		nFlags |= 32;
	if (undefined === this.Old.Right)
		nFlags |= 64;
	if (undefined === this.Old.Bottom)
		nFlags |= 128;

	Writer.WriteLong(nFlags);

	if (undefined !== this.New.Left)
		this.New.Left.Write_ToBinary(Writer);
	if (undefined !== this.New.Top)
		this.New.Top.Write_ToBinary(Writer);
	if (undefined !== this.New.Right)
		this.New.Right.Write_ToBinary(Writer);
	if (undefined !== this.New.Bottom)
		this.New.Bottom.Write_ToBinary(Writer);
	if (undefined !== this.Old.Left)
		this.Old.Left.Write_ToBinary(Writer);
	if (undefined !== this.Old.Top)
		this.Old.Top.Write_ToBinary(Writer);
	if (undefined !== this.Old.Right)
		this.Old.Right.Write_ToBinary(Writer);
	if (undefined !== this.Old.Bottom)
		this.Old.Bottom.Write_ToBinary(Writer);
};
CChangesTableTableCellMar.prototype.ReadFromBinary = function(Reader)
{
	// Long  : Flag
	// 1-bit : Is New.Left undefined?
	// 2-bit : Is New.Top undefined?
	// 3-bit : Is New.Right undefined?
	// 4-bit : Is New.Bottom undefined?
	// 5-bit : Is Old.Left undefined?
	// 6-bit : Is Old.Top undefined?
	// 7-bit : Is Old.Right undefined?
	// 8-bit : Is Old.Bottom undefined?
	// Variable(?CTableMeasurement) : New.Left (1 бит нулевой)
	// Variable(?CTableMeasurement) : New.Top (2 бит нулевой)
	// Variable(?CTableMeasurement) : New.Right (3 бит нулевой)
	// Variable(?CTableMeasurement) : New.Bottom (4 бит нулевой)
	// Variable(?CTableMeasurement) : Old.Left (5 бит нулевой)
	// Variable(?CTableMeasurement) : Old.Top (6 бит нулевой)
	// Variable(?CTableMeasurement) : Old.Right (7 бит нулевой)
	// Variable(?CTableMeasurement) : Old.Bottom (8 бит нулевой)

	this.New = {};
	this.Old = {};
	var nFlags = Reader.GetLong();

	if (nFlags & 1)
	{
		this.New.Left = undefined;
	}
	else
	{
		this.New.Left = new CTableMeasurement(tblwidth_Mm, 0);
		this.New.Left.Read_FromBinary(Reader);
	}

	if (nFlags & 2)
	{
		this.New.Top = undefined;
	}
	else
	{
		this.New.Top = new CTableMeasurement(tblwidth_Mm, 0);
		this.New.Top.Read_FromBinary(Reader);
	}

	if (nFlags & 4)
	{
		this.New.Right = undefined;
	}
	else
	{
		this.New.Right = new CTableMeasurement(tblwidth_Mm, 0);
		this.New.Right.Read_FromBinary(Reader);
	}

	if (nFlags & 8)
	{
		this.New.Bottom = undefined;
	}
	else
	{
		this.New.Bottom = new CTableMeasurement(tblwidth_Mm, 0);
		this.New.Bottom.Read_FromBinary(Reader);
	}

	if (nFlags & 16)
	{
		this.Old.Left = undefined;
	}
	else
	{
		this.Old.Left = new CTableMeasurement(tblwidth_Mm, 0);
		this.Old.Left.Read_FromBinary(Reader);
	}

	if (nFlags & 32)
	{
		this.Old.Top = undefined;
	}
	else
	{
		this.Old.Top = new CTableMeasurement(tblwidth_Mm, 0);
		this.Old.Top.Read_FromBinary(Reader);
	}

	if (nFlags & 64)
	{
		this.Old.Right = undefined;
	}
	else
	{
		this.Old.Right = new CTableMeasurement(tblwidth_Mm, 0);
		this.Old.Right.Read_FromBinary(Reader);
	}

	if (nFlags & 128)
	{
		this.Old.Bottom = undefined;
	}
	else
	{
		this.Old.Bottom = new CTableMeasurement(tblwidth_Mm, 0);
		this.Old.Bottom.Read_FromBinary(Reader);
	}
};
CChangesTableTableCellMar.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;

	oTable.Pr.TableCellMar.Left   = Value.Left;
	oTable.Pr.TableCellMar.Right  = Value.Right;
	oTable.Pr.TableCellMar.Top    = Value.Top;
	oTable.Pr.TableCellMar.Bottom = Value.Bottom;

	oTable.Recalc_CompiledPr();
};
CChangesTableTableCellMar.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesTableTableAlign(Class, Old, New, Color)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableAlign.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesTableTableAlign.prototype.constructor = CChangesTableTableAlign;
CChangesTableTableAlign.prototype.Type = AscDFH.historyitem_Table_TableAlign;
CChangesTableTableAlign.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.Jc = Value;
	oTable.Recalc_CompiledPr();
};
CChangesTableTableAlign.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseDoubleProperty}
 */
function CChangesTableTableInd(Class, Old, New, Color)
{
	AscDFH.CChangesBaseDoubleProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableInd.prototype = Object.create(AscDFH.CChangesBaseDoubleProperty.prototype);
CChangesTableTableInd.prototype.constructor = CChangesTableTableInd;
CChangesTableTableInd.prototype.Type = AscDFH.historyitem_Table_TableInd;
CChangesTableTableInd.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.TableInd = Value;
	oTable.Recalc_CompiledPr();
};
CChangesTableTableInd.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesTableTableBorderLeft(Class, Old, New, Color)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableBorderLeft.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesTableTableBorderLeft.prototype.constructor = CChangesTableTableBorderLeft;
CChangesTableTableBorderLeft.prototype.Type = AscDFH.historyitem_Table_TableBorder_Left;
CChangesTableTableBorderLeft.prototype.private_CreateObject = function()
{
	return new CDocumentBorder();
};
CChangesTableTableBorderLeft.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.TableBorders.Left = Value;
	oTable.Recalc_CompiledPr2();
};
CChangesTableTableBorderLeft.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesTableTableBorderTop(Class, Old, New, Color)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableBorderTop.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesTableTableBorderTop.prototype.constructor = CChangesTableTableBorderTop;
CChangesTableTableBorderTop.prototype.Type = AscDFH.historyitem_Table_TableBorder_Top;
CChangesTableTableBorderTop.prototype.private_CreateObject = function()
{
	return new CDocumentBorder();
};
CChangesTableTableBorderTop.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.TableBorders.Top = Value;
	oTable.Recalc_CompiledPr2();
};
CChangesTableTableBorderTop.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesTableTableBorderRight(Class, Old, New, Color)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableBorderRight.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesTableTableBorderRight.prototype.constructor = CChangesTableTableBorderRight;
CChangesTableTableBorderRight.prototype.Type = AscDFH.historyitem_Table_TableBorder_Right;
CChangesTableTableBorderRight.prototype.private_CreateObject = function()
{
	return new CDocumentBorder();
};
CChangesTableTableBorderRight.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.TableBorders.Right = Value;
	oTable.Recalc_CompiledPr2();
};
CChangesTableTableBorderRight.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesTableTableBorderBottom(Class, Old, New, Color)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableBorderBottom.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesTableTableBorderBottom.prototype.constructor = CChangesTableTableBorderBottom;
CChangesTableTableBorderBottom.prototype.Type = AscDFH.historyitem_Table_TableBorder_Bottom;
CChangesTableTableBorderBottom.prototype.private_CreateObject = function()
{
	return new CDocumentBorder();
};
CChangesTableTableBorderBottom.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.TableBorders.Bottom = Value;
	oTable.Recalc_CompiledPr2();
};
CChangesTableTableBorderBottom.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesTableTableBorderInsideH(Class, Old, New, Color)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableBorderInsideH.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesTableTableBorderInsideH.prototype.constructor = CChangesTableTableBorderInsideH;
CChangesTableTableBorderInsideH.prototype.Type = AscDFH.historyitem_Table_TableBorder_InsideH;
CChangesTableTableBorderInsideH.prototype.private_CreateObject = function()
{
	return new CDocumentBorder();
};
CChangesTableTableBorderInsideH.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.TableBorders.InsideH = Value;
	oTable.Recalc_CompiledPr2();
};
CChangesTableTableBorderInsideH.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesTableTableBorderInsideV(Class, Old, New, Color)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableBorderInsideV.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesTableTableBorderInsideV.prototype.constructor = CChangesTableTableBorderInsideV;
CChangesTableTableBorderInsideV.prototype.Type = AscDFH.historyitem_Table_TableBorder_InsideV;
CChangesTableTableBorderInsideV.prototype.private_CreateObject = function()
{
	return new CDocumentBorder();
};
CChangesTableTableBorderInsideV.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.TableBorders.InsideV = Value;
	oTable.Recalc_CompiledPr2();
};
CChangesTableTableBorderInsideV.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesTableTableShd(Class, Old, New, Color)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableShd.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesTableTableShd.prototype.constructor = CChangesTableTableShd;
CChangesTableTableShd.prototype.Type = AscDFH.historyitem_Table_TableShd;
CChangesTableTableShd.prototype.private_CreateObject = function()
{
	return new CDocumentShd();
};
CChangesTableTableShd.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.Shd = Value;
	oTable.Recalc_CompiledPr2();
};
CChangesTableTableShd.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolValue}
 */
function CChangesTableInline(Class, Old, New, Color)
{
	AscDFH.CChangesBaseBoolValue.call(this, Class, Old, New, Color);
}
CChangesTableInline.prototype = Object.create(AscDFH.CChangesBaseBoolValue.prototype);
CChangesTableInline.prototype.constructor = CChangesTableInline;
CChangesTableInline.prototype.Type = AscDFH.historyitem_Table_Inline;
CChangesTableInline.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Inline = Value;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseContentChange}
 */
function CChangesTableAddRow(Class, Pos, Rows)
{
	AscDFH.CChangesBaseContentChange.call(this, Class, Pos, Rows, true);
}
CChangesTableAddRow.prototype = Object.create(AscDFH.CChangesBaseContentChange.prototype);
CChangesTableAddRow.prototype.constructor = CChangesTableAddRow;
CChangesTableAddRow.prototype.Type = AscDFH.historyitem_Table_AddRow;
CChangesTableAddRow.prototype.Undo = function()
{
	var oTable = this.Class;

	oTable.Content[this.Pos].Set_Index(-1);
	oTable.Content.splice(this.Pos, 1);
	oTable.TableRowsBottom.splice(this.Pos, 1);
	oTable.RowsInfo.splice(this.Pos, 1);

	oTable.Internal_ReIndexing(this.Pos);
	oTable.Recalc_CompiledPr2();
	oTable.private_CheckCurCell();
};
CChangesTableAddRow.prototype.Redo = function()
{
	if (this.Items.length <= 0)
		return;

	var oTable = this.Class;

	oTable.Content.splice(this.Pos, 0, this.Items[0]);
	oTable.TableRowsBottom.splice(this.Pos, 0, {});
	oTable.RowsInfo.splice(this.Pos, 0, new CTableRowsInfo());

	oTable.Internal_ReIndexing(this.Pos);
	oTable.Recalc_CompiledPr2();
	oTable.private_CheckCurCell();
};
CChangesTableAddRow.prototype.private_WriteItem = function(Writer, Item)
{
	Writer.WriteString2(Item.Get_Id());
};
CChangesTableAddRow.prototype.private_ReadItem = function(Reader)
{
	return AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CChangesTableAddRow.prototype.Load = function(Color)
{
	if (this.PosArray.length <= 0 || this.Items.length <= 0)
		return;

	var oTable = this.Class;

	var Pos     = oTable.m_oContentChanges.Check(AscCommon.contentchanges_Add, this.PosArray[0]);
	var Element = this.Items[0];

	if (null != Element)
	{
		oTable.Content.splice(Pos, 0, Element);
		AscCommon.CollaborativeEditing.Update_DocumentPositionsOnAdd(oTable, Pos);
	}

	oTable.Internal_ReIndexing();
	oTable.Recalc_CompiledPr2();
	oTable.private_CheckCurCell();
};
CChangesTableAddRow.prototype.IsRelated = function(oChanges)
{
	if (this.Class === oChanges.Class && (AscDFH.historyitem_Table_AddRow === oChanges.Type || AscDFH.historyitem_Table_RemoveRow === oChanges.Type))
		return true;

	return false;
};
CChangesTableAddRow.prototype.CreateReverseChange = function()
{
	return this.private_CreateReverseChange(CChangesTableRemoveRow);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseContentChange}
 */
function CChangesTableRemoveRow(Class, Pos, Rows)
{
	AscDFH.CChangesBaseContentChange.call(this, Class, Pos, Rows, false);
}
CChangesTableRemoveRow.prototype = Object.create(AscDFH.CChangesBaseContentChange.prototype);
CChangesTableRemoveRow.prototype.constructor = CChangesTableRemoveRow;
CChangesTableRemoveRow.prototype.Type = AscDFH.historyitem_Table_RemoveRow;
CChangesTableRemoveRow.prototype.Undo = function()
{
	if (this.Items.length <= 0)
		return;

	var oTable = this.Class;

	oTable.Content.splice(this.Pos, 0, this.Items[0]);
	oTable.TableRowsBottom.splice(this.Pos, 0, {});
	oTable.RowsInfo.splice(this.Pos, 0, new CTableRowsInfo());

	oTable.Internal_ReIndexing(this.Pos);
	oTable.Recalc_CompiledPr2();
	oTable.private_CheckCurCell();
};
CChangesTableRemoveRow.prototype.Redo = function()
{
	if (this.Items.length <= 0)
		return;

	var oTable = this.Class;

	oTable.Content[this.Pos].Set_Index(-1);
	oTable.Content.splice(this.Pos, 1);
	oTable.TableRowsBottom.splice(this.Pos, 1);
	oTable.RowsInfo.splice(this.Pos, 1);

	oTable.Internal_ReIndexing(this.Pos);
	oTable.Recalc_CompiledPr2();
	oTable.private_CheckCurCell();
};
CChangesTableRemoveRow.prototype.private_WriteItem = function(Writer, Item)
{
	Writer.WriteString2(Item.Get_Id());
};
CChangesTableRemoveRow.prototype.private_ReadItem = function(Reader)
{
	return AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CChangesTableRemoveRow.prototype.Load = function(Color)
{
	if (this.PosArray.length <= 0 || this.Items.length <= 0)
		return;

	var oTable = this.Class;

	var Pos = oTable.m_oContentChanges.Check(AscCommon.contentchanges_Remove, this.PosArray[0]);
	if (false === Pos)
		return;

	oTable.Content[Pos].Set_Index(-1);
	oTable.Content.splice(Pos, 1);
	AscCommon.CollaborativeEditing.Update_DocumentPositionsOnRemove(oTable, Pos, 1);

	oTable.Internal_ReIndexing();
	oTable.Recalc_CompiledPr2();
	oTable.private_CheckCurCell();
};
CChangesTableRemoveRow.prototype.IsRelated = function(oChanges)
{
	if (this.Class === oChanges.Class && (AscDFH.historyitem_Table_AddRow === oChanges.Type || AscDFH.historyitem_Table_RemoveRow === oChanges.Type))
		return true;

	return false;
};
CChangesTableRemoveRow.prototype.CreateReverseChange = function()
{
	return this.private_CreateReverseChange(CChangesTableAddRow);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesTableTableGrid(Class, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
}
CChangesTableTableGrid.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesTableTableGrid.prototype.constructor = CChangesTableTableGrid;
CChangesTableTableGrid.prototype.Type = AscDFH.historyitem_Table_TableGrid;
CChangesTableTableGrid.prototype.WriteToBinary = function(Writer)
{
	// Long : Count of the columns in the new grid
	// Array of double : widths of columns in the new grid
	// Long : Count of the columns in the old grid
	// Array of double : widths of columns in the old grid

	var nNewCount = this.New.length;
	Writer.WriteLong(nNewCount);
	for (var nIndex = 0; nIndex < nNewCount; ++nIndex)
		Writer.WriteDouble(this.New[nIndex]);

	var nOldCount = this.Old.length;
	Writer.WriteLong(nOldCount);
	for (var nIndex = 0; nIndex < nOldCount; ++nIndex)
		Writer.WriteDouble(this.Old[nIndex]);
};
CChangesTableTableGrid.prototype.ReadFromBinary = function(Reader)
{
	// Long : Count of the columns in the new grid
	// Array of double : widths of columns in the new grid
	// Long : Count of the columns in the old grid
	// Array of double : widths of columns in the old grid

	var nCount = Reader.GetLong();
	this.New = [];
	for (var nIndex = 0; nIndex < nCount; ++nIndex)
		this.New[nIndex] = Reader.GetDouble();

	nCount = Reader.GetLong();
	this.Old = [];
	for (var nIndex = 0; nIndex < nCount; ++nIndex)
		this.Old[nIndex] = Reader.GetDouble();
};
CChangesTableTableGrid.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.TableGrid = Value;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectValue}
 */
function CChangesTableTableLook(Class, Old, New)
{
	AscDFH.CChangesBaseObjectValue.call(this, Class, Old, New);
}
CChangesTableTableLook.prototype = Object.create(AscDFH.CChangesBaseObjectValue.prototype);
CChangesTableTableLook.prototype.constructor = CChangesTableTableLook;
CChangesTableTableLook.prototype.Type = AscDFH.historyitem_Table_TableLook;
CChangesTableTableLook.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.TableLook = Value;
	oTable.Recalc_CompiledPr2();
};
CChangesTableTableLook.prototype.private_CreateObject = function()
{
	return new CTableLook();
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesTableTableStyleRowBandSize(Class, Old, New, Color)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableStyleRowBandSize.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesTableTableStyleRowBandSize.prototype.constructor = CChangesTableTableStyleRowBandSize;
CChangesTableTableStyleRowBandSize.prototype.Type = AscDFH.historyitem_Table_TableStyleRowBandSize;
CChangesTableTableStyleRowBandSize.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.TableStyleRowBandSize = Value;
	oTable.Recalc_CompiledPr();
};
CChangesTableTableStyleRowBandSize.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesTableTableStyleColBandSize(Class, Old, New, Color)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableStyleColBandSize.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesTableTableStyleColBandSize.prototype.constructor = CChangesTableTableStyleColBandSize;
CChangesTableTableStyleColBandSize.prototype.Type = AscDFH.historyitem_Table_TableStyleColBandSize;
CChangesTableTableStyleColBandSize.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.TableStyleColBandSize = Value;
	oTable.Recalc_CompiledPr();
};
CChangesTableTableStyleColBandSize.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesTableTableStyle(Class, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
}
CChangesTableTableStyle.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesTableTableStyle.prototype.constructor = CChangesTableTableStyle;
CChangesTableTableStyle.prototype.Type = AscDFH.historyitem_Table_TableStyle;
CChangesTableTableStyle.prototype.WriteToBinary = function(Writer)
{
	// Long : Flags
	// 1-bit : Is new null?
	// 2-bit : Is old null?
	// String : id of new style (1bit = 0)
	// String : id of old style (2bit = 0)

	var nFlags = 0;
	if (null === this.New)
		nFlags |= 1;
	if (null === this.Old)
		nFlags |= 2;

	Writer.WriteLong(nFlags);

	if (null !== this.New)
		Writer.WriteString2(this.New);

	if (null !== this.Old)
		Writer.WriteString2(this.Old);
};
CChangesTableTableStyle.prototype.ReadFromBinary = function(Reader)
{
	// Long : Flags
	// 1-bit : Is new null?
	// 2-bit : Is old null?
	// String : id of new style (1bit = 0)
	// String : id of old style (2bit = 0)

	var nFlags = Reader.GetLong();

	if (nFlags & 1)
		this.New = null;
	else
		this.New = Reader.GetString2();

	if (nFlags & 2)
		this.Old = null;
	else
		this.Old = Reader.GetString2();
};
CChangesTableTableStyle.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.TableStyle = Value;
	oTable.Recalc_CompiledPr2();
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolValue}
 */
function CChangesTableAllowOverlap(Class, Old, New, Color)
{
	AscDFH.CChangesBaseBoolValue.call(this, Class, Old, New, Color);
}
CChangesTableAllowOverlap.prototype = Object.create(AscDFH.CChangesBaseBoolValue.prototype);
CChangesTableAllowOverlap.prototype.constructor = CChangesTableAllowOverlap;
CChangesTableAllowOverlap.prototype.Type = AscDFH.historyitem_Table_AllowOverlap;
CChangesTableAllowOverlap.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.AllowOverlap = Value;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesTablePositionH(Class, Old, New, Color)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New, Color);
}
CChangesTablePositionH.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesTablePositionH.prototype.constructor = CChangesTablePositionH;
CChangesTablePositionH.prototype.Type = AscDFH.historyitem_Table_PositionH;
CChangesTablePositionH.prototype.WriteToBinary = function(Writer)
{
	// Long : New.RelativeFrom
	// Bool : New.Align
	//   true  -> Long   : New.Value
	//   false -> Double : New.Value
	// Long : Old.RelativeFrom
	// Bool : Old.Align
	//   true  -> Long   : Old.Value
	//   false -> Double : Old.Value

	Writer.WriteLong(this.New.RelativeFrom);
	Writer.WriteBool(this.New.Align);
	if (true === this.New.Align)
		Writer.WriteLong(this.New.Value);
	else
		Writer.WriteDouble(this.New.Value);

	Writer.WriteLong(this.Old.RelativeFrom);
	Writer.WriteBool(this.Old.Align);
	if (true === this.Old.Align)
		Writer.WriteLong(this.Old.Value);
	else
		Writer.WriteDouble(this.Old.Value);
};
CChangesTablePositionH.prototype.ReadFromBinary = function(Reader)
{
	// Long : New.RelativeFrom
	// Bool : New.Align
	//   true  -> Long   : New.Value
	//   false -> Double : New.Value
	// Long : Old.RelativeFrom
	// Bool : Old.Align
	//   true  -> Long   : Old.Value
	//   false -> Double : Old.Value

	this.New = {};
	this.Old = {};

	this.New.RelativeFrom = Reader.GetLong();
	this.New.Align        = Reader.GetBool();

	if (true === this.New.Align)
		this.New.Value = Reader.GetLong();
	else
		this.New.Value = Reader.GetDouble();

	this.Old.RelativeFrom = Reader.GetLong();
	this.Old.Align        = Reader.GetBool();

	if (true === this.Old.Align)
		this.Old.Value = Reader.GetLong();
	else
		this.Old.Value = Reader.GetDouble();
};
CChangesTablePositionH.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;

	oTable.PositionH.RelativeFrom = Value.RelativeFrom;
	oTable.PositionH.Align        = Value.Align;
	oTable.PositionH.Value        = Value.Value;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesTablePositionV(Class, Old, New, Color)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New, Color);
}
CChangesTablePositionV.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesTablePositionV.prototype.constructor = CChangesTablePositionV;
CChangesTablePositionV.prototype.Type = AscDFH.historyitem_Table_PositionV;
CChangesTablePositionV.prototype.WriteToBinary = function(Writer)
{
	// Long : New.RelativeFrom
	// Bool : New.Align
	//   true  -> Long   : New.Value
	//   false -> Double : New.Value
	// Long : Old.RelativeFrom
	// Bool : Old.Align
	//   true  -> Long   : Old.Value
	//   false -> Double : Old.Value

	Writer.WriteLong(this.New.RelativeFrom);
	Writer.WriteBool(this.New.Align);
	if (true === this.New.Align)
		Writer.WriteLong(this.New.Value);
	else
		Writer.WriteDouble(this.New.Value);

	Writer.WriteLong(this.Old.RelativeFrom);
	Writer.WriteBool(this.Old.Align);
	if (true === this.Old.Align)
		Writer.WriteLong(this.Old.Value);
	else
		Writer.WriteDouble(this.Old.Value);
};
CChangesTablePositionV.prototype.ReadFromBinary = function(Reader)
{
	// Long : New.RelativeFrom
	// Bool : New.Align
	//   true  -> Long   : New.Value
	//   false -> Double : New.Value
	// Long : Old.RelativeFrom
	// Bool : Old.Align
	//   true  -> Long   : Old.Value
	//   false -> Double : Old.Value

	this.New = {};
	this.Old = {};

	this.New.RelativeFrom = Reader.GetLong();
	this.New.Align        = Reader.GetBool();

	if (true === this.New.Align)
		this.New.Value = Reader.GetLong();
	else
		this.New.Value = Reader.GetDouble();

	this.Old.RelativeFrom = Reader.GetLong();
	this.Old.Align        = Reader.GetBool();

	if (true === this.Old.Align)
		this.Old.Value = Reader.GetLong();
	else
		this.Old.Value = Reader.GetDouble();
};
CChangesTablePositionV.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;

	oTable.PositionV.RelativeFrom = Value.RelativeFrom;
	oTable.PositionV.Align        = Value.Align;
	oTable.PositionV.Value        = Value.Value;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesTableDistance(Class, Old, New, Color)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New, Color);
}
CChangesTableDistance.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesTableDistance.prototype.constructor = CChangesTableDistance;
CChangesTableDistance.prototype.Type = AscDFH.historyitem_Table_Distance;
CChangesTableDistance.prototype.WriteToBinary = function(Writer)
{
	// Double : New.Left
	// Double : New.Top
	// Double : New.Right
	// Double : New.Bottom
	// Double : Old.Left
	// Double : Old.Top
	// Double : Old.Right
	// Double : Old.Bottom

	Writer.WriteDouble(this.New.Left);
	Writer.WriteDouble(this.New.Top);
	Writer.WriteDouble(this.New.Right);
	Writer.WriteDouble(this.New.Bottom);
	Writer.WriteDouble(this.Old.Left);
	Writer.WriteDouble(this.Old.Top);
	Writer.WriteDouble(this.Old.Right);
	Writer.WriteDouble(this.Old.Bottom);
};
CChangesTableDistance.prototype.ReadFromBinary = function(Reader)
{
	// Double : New.Left
	// Double : New.Top
	// Double : New.Right
	// Double : New.Bottom
	// Double : Old.Left
	// Double : Old.Top
	// Double : Old.Right
	// Double : Old.Bottom

	this.New = {
		Left   : 0,
		Top    : 0,
		Right  : 0,
		Bottom : 0
	};

	this.Old = {
		Left   : 0,
		Top    : 0,
		Right  : 0,
		Bottom : 0
	};

	this.New.Left   = Reader.GetDouble();
	this.New.Top    = Reader.GetDouble();
	this.New.Right  = Reader.GetDouble();
	this.New.Bottom = Reader.GetDouble();
	this.Old.Left   = Reader.GetDouble();
	this.Old.Top    = Reader.GetDouble();
	this.Old.Right  = Reader.GetDouble();
	this.Old.Bottom = Reader.GetDouble();
};
CChangesTableDistance.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;

	oTable.Distance.L = Value.Left;
	oTable.Distance.T = Value.Top;
	oTable.Distance.R = Value.Right;
	oTable.Distance.B = Value.Bottom;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectValue}
 */
function CChangesTablePr(Class, Old, New, Color)
{
	AscDFH.CChangesBaseObjectValue.call(this, Class, Old, New, Color);
}
CChangesTablePr.prototype = Object.create(AscDFH.CChangesBaseObjectValue.prototype);
CChangesTablePr.prototype.constructor = CChangesTablePr;
CChangesTablePr.prototype.Type = AscDFH.historyitem_Table_Pr;
CChangesTablePr.prototype.private_CreateObject = function()
{
	return new CTablePr();
};
CChangesTablePr.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr = Value;
	oTable.Recalc_CompiledPr2();
};
CChangesTablePr.prototype.Merge = function(oChange)
{
	if (this.Class !== oChange.Class)
		return true;

	if (this.Type === oChange.Type)
		return false;

	if (!this.New)
		this.New = new CTablePr();

	switch (oChange.Type)
	{
		case AscDFH.historyitem_Table_TableW:
		{
			this.New.TableW = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableCellMar:
		{
			this.New.TableCellMar.Left   = oChange.New.Left;
			this.New.TableCellMar.Right  = oChange.New.Right;
			this.New.TableCellMar.Top    = oChange.New.Top;
			this.New.TableCellMar.Bottom = oChange.New.Bottom;
			break;
		}
		case AscDFH.historyitem_Table_TableAlign:
		{
			this.New.Jc = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableInd:
		{
			this.New.TableInd = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableBorder_Left:
		{
			this.New.TableBorders.Left = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableBorder_Top:
		{
			this.New.TableBorders.Top = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableBorder_Right:
		{
			this.New.TableBorders.Right = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableBorder_Bottom:
		{
			this.New.TableBorders.Bottom = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableBorder_InsideH:
		{
			this.New.TableBorders.InsideH = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableBorder_InsideV:
		{
			this.New.TableBorders.InsideV = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableShd:
		{
			this.New.Shd = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableStyleRowBandSize:
		{
			this.New.TableStyleRowBandSize = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableStyleColBandSize:
		{
			this.New.TableStyleColBandSize = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableLayout:
		{
			this.New.TableLayout = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableDescription:
		{
			this.New.TableDescription = oChange.New;
			break;
		}
		case AscDFH.historyitem_Table_TableCaption:
		{
			this.New.TableCaption = oChange.New;
			break;
		}
	}

	return true;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesTableTableLayout(Class, Old, New, Color)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableLayout.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesTableTableLayout.prototype.constructor = CChangesTableTableLayout;
CChangesTableTableLayout.prototype.Type = AscDFH.historyitem_Table_TableLayout;
CChangesTableTableLayout.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.TableLayout = Value;
	oTable.Recalc_CompiledPr2();
};
CChangesTableTableLayout.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseStringProperty}
 */
function CChangesTableTableDescription(Class, Old, New, Color)
{
	AscDFH.CChangesBaseStringProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableDescription.prototype = Object.create(AscDFH.CChangesBaseStringProperty.prototype);
CChangesTableTableDescription.prototype.constructor = CChangesTableTableDescription;
CChangesTableTableDescription.prototype.Type = AscDFH.historyitem_Table_TableDescription;
CChangesTableTableDescription.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.TableDescription = Value;
	oTable.Recalc_CompiledPr2();
};
CChangesTableTableDescription.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseStringProperty}
 */
function CChangesTableTableCaption(Class, Old, New, Color)
{
	AscDFH.CChangesBaseStringProperty.call(this, Class, Old, New, Color);
}
CChangesTableTableCaption.prototype = Object.create(AscDFH.CChangesBaseStringProperty.prototype);
CChangesTableTableCaption.prototype.constructor = CChangesTableTableCaption;
CChangesTableTableCaption.prototype.Type = AscDFH.historyitem_Table_TableCaption;
CChangesTableTableCaption.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.Pr.TableCaption = Value;
	oTable.Recalc_CompiledPr2();
};
CChangesTableTableCaption.prototype.Merge = private_TableChangesOnMergePr;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesTableTableGridChange(Class, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
}
CChangesTableTableGridChange.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesTableTableGridChange.prototype.constructor = CChangesTableTableGridChange;
CChangesTableTableGridChange.prototype.Type = AscDFH.historyitem_Table_TableGridChange;
CChangesTableTableGridChange.prototype.WriteToBinary = function(oWriter)
{
	// Long            : Count of the columns in the new grid. Zero means undefined
	// Array of double : widths of columns in the new grid
	// Long            : Count of the columns in the old grid. Zero means undefined
	// Array of double : widths of columns in the old grid

	var nNewCount = this.New ? this.New.length : 0;
	oWriter.WriteLong(nNewCount);
	for (var nIndex = 0; nIndex < nNewCount; ++nIndex)
	{
		oWriter.WriteDouble(this.New[nIndex]);
	}

	var nOldCount = this.Old ? this.Old.length : 0;
	oWriter.WriteLong(nOldCount);
	for (var nIndex = 0; nIndex < nOldCount; ++nIndex)
	{
		oWriter.WriteDouble(this.Old[nIndex]);
	}
};
CChangesTableTableGridChange.prototype.ReadFromBinary = function(oReader)
{
	// Long            : Count of the columns in the new grid. Zero means undefined
	// Array of double : widths of columns in the new grid
	// Long            : Count of the columns in the old grid. Zero means undefined
	// Array of double : widths of columns in the old grid

	var nCount = oReader.GetLong();
	if (nCount > 0)
	{
		this.New = [];
		for (var nIndex = 0; nIndex < nCount; ++nIndex)
		{
			this.New[nIndex] = oReader.GetDouble();
		}
	}
	else
	{
		this.New = undefined;
	}

	nCount = oReader.GetLong();
	if (nCount > 0)
	{
		this.Old = [];
		for (var nIndex = 0; nIndex < nCount; ++nIndex)
		{
			this.Old[nIndex] = oReader.GetDouble();
		}
	}
	else
	{
		this.Old = undefined;
	}
};
CChangesTableTableGridChange.prototype.private_SetValue = function(Value)
{
	var oTable = this.Class;
	oTable.TableGridChange = Value;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBase}
 */
function CChangesTablePrChange(Class, Old, New)
{
	AscDFH.CChangesBase.call(this, Class);

	this.Old = Old;
	this.New = New;
}
CChangesTablePrChange.prototype = Object.create(AscDFH.CChangesBase.prototype);
CChangesTablePrChange.prototype.constructor = CChangesTablePrChange;
CChangesTablePrChange.prototype.Type = AscDFH.historyitem_Table_PrChange;
CChangesTablePrChange.prototype.Undo = function()
{
	var oTable = this.Class;
	oTable.Pr.PrChange   = this.Old.PrChange;
	oTable.Pr.ReviewInfo = this.Old.ReviewInfo;
	oTable.UpdateTrackRevisions();
};
CChangesTablePrChange.prototype.Redo = function()
{
	var oTable = this.Class;
	oTable.Pr.PrChange   = this.New.PrChange;
	oTable.Pr.ReviewInfo = this.New.ReviewInfo;
	oTable.UpdateTrackRevisions();
};
CChangesTablePrChange.prototype.WriteToBinary = function(oWriter)
{
	// Long : Flags
	// 1-bit : is New.PrChange undefined ?
	// 2-bit : is New.ReviewInfo undefined ?
	// 3-bit : is Old.PrChange undefined ?
	// 4-bit : is Old.ReviewInfo undefined ?
	// Variable(CTablePr)    : New.PrChange   (1bit = 0)
	// Variable(CReviewInfo) : New.ReviewInfo (2bit = 0)
	// Variable(CTablePr)    : Old.PrChange   (3bit = 0)
	// Variable(CReviewInfo) : Old.ReviewInfo (4bit = 0)

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
CChangesTablePrChange.prototype.ReadFromBinary = function(oReader)
{
	// Long : Flags
	// 1-bit : is New.PrChange undefined ?
	// 2-bit : is New.ReviewInfo undefined ?
	// 3-bit : is Old.PrChange undefined ?
	// 4-bit : is Old.ReviewInfo undefined ?
	// Variable(CTablePr)    : New.PrChange   (1bit = 0)
	// Variable(CReviewInfo) : New.ReviewInfo (2bit = 0)
	// Variable(CTablePr)    : Old.PrChange   (3bit = 0)
	// Variable(CReviewInfo) : Old.ReviewInfo (4bit = 0)

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
		this.New.PrChange = new CTablePr();
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
		this.Old.PrChange = new CTablePr();
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
CChangesTablePrChange.prototype.CreateReverseChange = function()
{
	return new CChangesTablePrChange(this.Class, this.New, this.Old);
};
CChangesTablePrChange.prototype.Merge = function(oChange)
{
	if (this.Class !== oChange.Class)
		return true;

	if (oChange.Type === this.Type || AscDFH.historyitem_Table_Pr === oChange.Type)
		return false;

	return true;
};
