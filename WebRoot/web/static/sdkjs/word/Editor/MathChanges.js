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
 * Date: 09.11.2016
 * Time: 15:52
 */

// TODO: Изменения с добавлениями строк и колонок матриц работают не совсем корректно:
//       Нужно либо сделать специальнный класс CContentChanges для случая прямоугольной матрицы,
//       либо навсегда запретить одновременное редактирования колонок и строк одной и той же матрицы

AscDFH.changesFactory[AscDFH.historyitem_MathContent_AddItem]      = CChangesMathContentAddItem;
AscDFH.changesFactory[AscDFH.historyitem_MathContent_RemoveItem]   = CChangesMathContentRemoveItem;
AscDFH.changesFactory[AscDFH.historyitem_MathContent_ArgSize]      = CChangesMathContentArgSize;
AscDFH.changesFactory[AscDFH.historyitem_MathPara_Jc]              = CChangesMathParaJc;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_AddItems]        = CChangesMathBaseAddItems;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_RemoveItems]     = CChangesMathBaseRemoveItems;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_FontSize]        = CChangesMathBaseFontSize;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_Shd]             = CChangesMathBaseShd;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_Color]           = CChangesMathBaseColor;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_Unifill]         = CChangesMathBaseUnifill;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_Underline]       = CChangesMathBaseUnderline;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_Strikeout]       = CChangesMathBaseStrikeout;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_DoubleStrikeout] = CChangesMathBaseDoubleStrikeout;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_Italic]          = CChangesMathBaseItalic;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_Bold]            = CChangesMathBaseBold;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_RFontsAscii]     = CChangesMathBaseRFontsAscii;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_RFontsHAnsi]     = CChangesMathBaseRFontsHAnsi;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_RFontsCS]        = CChangesMathBaseRFontsCS;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_RFontsEastAsia]  = CChangesMathBaseRFontsEastAsia;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_RFontsHint]      = CChangesMathBaseRFontsHint;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_HighLight]       = CChangesMathBaseHighLight;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_ReviewType]      = CChangesMathBaseReviewType;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_TextFill]        = CChangesMathBaseTextFill;
AscDFH.changesFactory[AscDFH.historyitem_MathBase_TextOutline]     = CChangesMathBaseTextOutline;
AscDFH.changesFactory[AscDFH.historyitem_MathBox_AlnAt]            = CChangesMathBoxAlnAt;
AscDFH.changesFactory[AscDFH.historyitem_MathBox_ForcedBreak]      = CChangesMathBoxForcedBreak;
AscDFH.changesFactory[AscDFH.historyitem_MathFraction_Type]        = CChangesMathFractionType;
AscDFH.changesFactory[AscDFH.historyitem_MathRadical_HideDegree]   = CChangesMathRadicalHideDegree;
AscDFH.changesFactory[AscDFH.historyitem_MathNary_LimLoc]          = CChangesMathNaryLimLoc;
AscDFH.changesFactory[AscDFH.historyitem_MathNary_UpperLimit]      = CChangesMathNaryUpperLimit;
AscDFH.changesFactory[AscDFH.historyitem_MathNary_LowerLimit]      = CChangesMathNaryLowerLimit;
AscDFH.changesFactory[AscDFH.historyitem_MathDelimiter_BegOper]    = CChangesMathDelimBegOper;
AscDFH.changesFactory[AscDFH.historyitem_MathDelimiter_EndOper]    = CChangesMathDelimEndOper;
AscDFH.changesFactory[AscDFH.historyitem_MathDelimiter_Grow]       = CChangesMathDelimiterGrow;
AscDFH.changesFactory[AscDFH.historyitem_MathDelimiter_Shape]      = CChangesMathDelimiterShape;
AscDFH.changesFactory[AscDFH.historyitem_MathDelimiter_SetColumn]  = CChangesMathDelimiterSetColumn;
AscDFH.changesFactory[AscDFH.historyitem_MathGroupChar_Pr]         = CChangesMathGroupCharPr;
AscDFH.changesFactory[AscDFH.historyitem_MathLimit_Type]           = CChangesMathLimitType;
AscDFH.changesFactory[AscDFH.historyitem_MathBorderBox_Top]        = CChangesMathBorderBoxTop;
AscDFH.changesFactory[AscDFH.historyitem_MathBorderBox_Bot]        = CChangesMathBorderBoxBot;
AscDFH.changesFactory[AscDFH.historyitem_MathBorderBox_Left]       = CChangesMathBorderBoxLeft;
AscDFH.changesFactory[AscDFH.historyitem_MathBorderBox_Right]      = CChangesMathBorderBoxRight;
AscDFH.changesFactory[AscDFH.historyitem_MathBorderBox_Hor]        = CChangesMathBorderBoxHor;
AscDFH.changesFactory[AscDFH.historyitem_MathBorderBox_Ver]        = CChangesMathBorderBoxVer;
AscDFH.changesFactory[AscDFH.historyitem_MathBorderBox_TopLTR]     = CChangesMathBorderBoxTopLTR;
AscDFH.changesFactory[AscDFH.historyitem_MathBorderBox_TopRTL]     = CChangesMathBorderBoxTopRTL;
AscDFH.changesFactory[AscDFH.historyitem_MathBar_LinePos]          = CChangesMathBarLinePos;
AscDFH.changesFactory[AscDFH.historyitem_MathMatrix_AddRow]        = CChangesMathMatrixAddRow;
AscDFH.changesFactory[AscDFH.historyitem_MathMatrix_RemoveRow]     = CChangesMathMatrixRemoveRow;
AscDFH.changesFactory[AscDFH.historyitem_MathMatrix_AddColumn]     = CChangesMathMatrixAddColumn;
AscDFH.changesFactory[AscDFH.historyitem_MathMatrix_RemoveColumn]  = CChangesMathMatrixRemoveColumn;
AscDFH.changesFactory[AscDFH.historyitem_MathMatrix_BaseJc]        = CChangesMathMatrixBaseJc;
AscDFH.changesFactory[AscDFH.historyitem_MathMatrix_ColumnJc]      = CChangesMathMatrixColumnJc;
AscDFH.changesFactory[AscDFH.historyitem_MathMatrix_Interval]      = CChangesMathMatrixInterval;
AscDFH.changesFactory[AscDFH.historyitem_MathMatrix_Plh]           = CChangesMathMatrixPlh;
AscDFH.changesFactory[AscDFH.historyitem_MathDegree_SubSupType]    = CChangesMathDegreeSubSupType;

//----------------------------------------------------------------------------------------------------------------------
// Карта зависимости изменений
//----------------------------------------------------------------------------------------------------------------------
AscDFH.changesRelationMap[AscDFH.historyitem_MathContent_AddItem]      = [
	AscDFH.historyitem_MathContent_AddItem,
	AscDFH.historyitem_MathContent_RemoveItem
];
AscDFH.changesRelationMap[AscDFH.historyitem_MathContent_RemoveItem]   = [
	AscDFH.historyitem_MathContent_AddItem,
	AscDFH.historyitem_MathContent_RemoveItem
];
AscDFH.changesRelationMap[AscDFH.historyitem_MathContent_ArgSize]      = [AscDFH.historyitem_MathContent_ArgSize];
AscDFH.changesRelationMap[AscDFH.historyitem_MathPara_Jc]              = [AscDFH.historyitem_MathPara_Jc];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_AddItems]        = [
	AscDFH.historyitem_MathBase_AddItems,
	AscDFH.historyitem_MathBase_RemoveItems
];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_RemoveItems]     = [
	AscDFH.historyitem_MathBase_AddItems,
	AscDFH.historyitem_MathBase_RemoveItems
];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_FontSize]        = [AscDFH.historyitem_MathBase_FontSize];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_Shd]             = [AscDFH.historyitem_MathBase_Shd];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_Color]           = [AscDFH.historyitem_MathBase_Color];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_Unifill]         = [AscDFH.historyitem_MathBase_Unifill];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_Underline]       = [AscDFH.historyitem_MathBase_Underline];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_Strikeout]       = [AscDFH.historyitem_MathBase_Strikeout];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_DoubleStrikeout] = [AscDFH.historyitem_MathBase_DoubleStrikeout];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_Italic]          = [AscDFH.historyitem_MathBase_Italic];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_Bold]            = [AscDFH.historyitem_MathBase_Bold];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_RFontsAscii]     = [AscDFH.historyitem_MathBase_RFontsAscii];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_RFontsHAnsi]     = [AscDFH.historyitem_MathBase_RFontsHAnsi];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_RFontsCS]        = [AscDFH.historyitem_MathBase_RFontsCS];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_RFontsEastAsia]  = [AscDFH.historyitem_MathBase_RFontsEastAsia];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_RFontsHint]      = [AscDFH.historyitem_MathBase_RFontsHint];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_HighLight]       = [AscDFH.historyitem_MathBase_HighLight];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_ReviewType]      = [AscDFH.historyitem_MathBase_ReviewType];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_TextFill]        = [AscDFH.historyitem_MathBase_TextFill];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBase_TextOutline]     = [AscDFH.historyitem_MathBase_TextOutline];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBox_AlnAt]            = [AscDFH.historyitem_MathBox_AlnAt, AscDFH.historyitem_MathBox_ForcedBreak];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBox_ForcedBreak]      = [AscDFH.historyitem_MathBox_AlnAt, AscDFH.historyitem_MathBox_ForcedBreak];
AscDFH.changesRelationMap[AscDFH.historyitem_MathFraction_Type]        = [AscDFH.historyitem_MathFraction_Type];
AscDFH.changesRelationMap[AscDFH.historyitem_MathRadical_HideDegree]   = [AscDFH.historyitem_MathRadical_HideDegree];
AscDFH.changesRelationMap[AscDFH.historyitem_MathNary_LimLoc]          = [AscDFH.historyitem_MathNary_LimLoc];
AscDFH.changesRelationMap[AscDFH.historyitem_MathNary_UpperLimit]      = [AscDFH.historyitem_MathNary_UpperLimit];
AscDFH.changesRelationMap[AscDFH.historyitem_MathNary_LowerLimit]      = [AscDFH.historyitem_MathNary_LowerLimit];
AscDFH.changesRelationMap[AscDFH.historyitem_MathDelimiter_BegOper]    = [AscDFH.historyitem_MathDelimiter_BegOper];
AscDFH.changesRelationMap[AscDFH.historyitem_MathDelimiter_EndOper]    = [AscDFH.historyitem_MathDelimiter_EndOper];
AscDFH.changesRelationMap[AscDFH.historyitem_MathDelimiter_Grow]       = [AscDFH.historyitem_MathDelimiter_Grow];
AscDFH.changesRelationMap[AscDFH.historyitem_MathDelimiter_Shape]      = [AscDFH.historyitem_MathDelimiter_Shape];
AscDFH.changesRelationMap[AscDFH.historyitem_MathDelimiter_SetColumn]  = [AscDFH.historyitem_MathDelimiter_SetColumn];
AscDFH.changesRelationMap[AscDFH.historyitem_MathGroupChar_Pr]         = [AscDFH.historyitem_MathGroupChar_Pr];
AscDFH.changesRelationMap[AscDFH.historyitem_MathLimit_Type]           = [AscDFH.historyitem_MathLimit_Type];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBorderBox_Top]        = [AscDFH.historyitem_MathBorderBox_Top];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBorderBox_Bot]        = [AscDFH.historyitem_MathBorderBox_Bot];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBorderBox_Left]       = [AscDFH.historyitem_MathBorderBox_Left];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBorderBox_Right]      = [AscDFH.historyitem_MathBorderBox_Right];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBorderBox_Hor]        = [AscDFH.historyitem_MathBorderBox_Hor];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBorderBox_Ver]        = [AscDFH.historyitem_MathBorderBox_Ver];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBorderBox_TopLTR]     = [AscDFH.historyitem_MathBorderBox_TopLTR];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBorderBox_TopRTL]     = [AscDFH.historyitem_MathBorderBox_TopRTL];
AscDFH.changesRelationMap[AscDFH.historyitem_MathBar_LinePos]          = [AscDFH.historyitem_MathBar_LinePos];
AscDFH.changesRelationMap[AscDFH.historyitem_MathMatrix_AddRow]        = [
	AscDFH.historyitem_MathMatrix_AddRow,
	AscDFH.historyitem_MathMatrix_RemoveRow,
	AscDFH.historyitem_MathMatrix_AddColumn,
	AscDFH.historyitem_MathMatrix_RemoveColumn
];
AscDFH.changesRelationMap[AscDFH.historyitem_MathMatrix_RemoveRow]     = [
	AscDFH.historyitem_MathMatrix_AddRow,
	AscDFH.historyitem_MathMatrix_RemoveRow,
	AscDFH.historyitem_MathMatrix_AddColumn,
	AscDFH.historyitem_MathMatrix_RemoveColumn
];
AscDFH.changesRelationMap[AscDFH.historyitem_MathMatrix_AddColumn]     = [
	AscDFH.historyitem_MathMatrix_AddRow,
	AscDFH.historyitem_MathMatrix_RemoveRow,
	AscDFH.historyitem_MathMatrix_AddColumn,
	AscDFH.historyitem_MathMatrix_RemoveColumn
];
AscDFH.changesRelationMap[AscDFH.historyitem_MathMatrix_RemoveColumn]  = [
	AscDFH.historyitem_MathMatrix_AddRow,
	AscDFH.historyitem_MathMatrix_RemoveRow,
	AscDFH.historyitem_MathMatrix_AddColumn,
	AscDFH.historyitem_MathMatrix_RemoveColumn
];
AscDFH.changesRelationMap[AscDFH.historyitem_MathMatrix_BaseJc]        = [AscDFH.historyitem_MathMatrix_BaseJc];
AscDFH.changesRelationMap[AscDFH.historyitem_MathMatrix_ColumnJc]      = [AscDFH.historyitem_MathMatrix_ColumnJc];
AscDFH.changesRelationMap[AscDFH.historyitem_MathMatrix_Interval]      = [AscDFH.historyitem_MathMatrix_Interval];
AscDFH.changesRelationMap[AscDFH.historyitem_MathMatrix_Plh]           = [AscDFH.historyitem_MathMatrix_Plh];
AscDFH.changesRelationMap[AscDFH.historyitem_MathDegree_SubSupType]    = [AscDFH.historyitem_MathDegree_SubSupType];
//----------------------------------------------------------------------------------------------------------------------


/**
 * @constructor
 * @extends {AscDFH.CChangesBaseContentChange}
 */
function CChangesMathContentAddItem(Class, Pos, Items)
{
	AscDFH.CChangesBaseContentChange.call(this, Class, Pos, Items, true);
}
CChangesMathContentAddItem.prototype = Object.create(AscDFH.CChangesBaseContentChange.prototype);
CChangesMathContentAddItem.prototype.constructor = CChangesMathContentAddItem;
CChangesMathContentAddItem.prototype.Type = AscDFH.historyitem_MathContent_AddItem;
CChangesMathContentAddItem.prototype.Undo = function()
{
	var oMathContent = this.Class;
	oMathContent.Content.splice(this.Pos, this.Items.length);
};
CChangesMathContentAddItem.prototype.Redo = function()
{
	var oMathContent = this.Class;

	var Array_start = oMathContent.Content.slice(0, this.Pos);
	var Array_end   = oMathContent.Content.slice(this.Pos);

	oMathContent.Content = Array_start.concat(this.Items, Array_end);

	for (var nIndex = 0; nIndex < this.Items.length; ++nIndex)
	{
		this.Items[nIndex].Set_ParaMath(oMathContent.ParaMath);

		if (this.Items[nIndex].SetParagraph)
			this.Items[nIndex].SetParagraph(oMathContent.Paragraph);

		this.Items[nIndex].Recalc_RunsCompiledPr();
	}
};
CChangesMathContentAddItem.prototype.private_WriteItem = function(Writer, Item)
{
	Writer.WriteString2(Item.Get_Id());
};
CChangesMathContentAddItem.prototype.private_ReadItem = function(Reader)
{
	return AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CChangesMathContentAddItem.prototype.Load = function(Color)
{
	var oMathContent = this.Class;
	for (var nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
	{
		var Pos     = oMathContent.m_oContentChanges.Check(AscCommon.contentchanges_Add, this.PosArray[nIndex]);
		var Element = this.Items[nIndex];

		if (null != Element)
		{
			oMathContent.Content.splice(Pos, 0, Element);

			if (Element.SetParagraph)
				Element.SetParagraph(oMathContent.Paragraph);

			if (Element.Set_ParaMath)
				Element.Set_ParaMath(oMathContent.ParaMath);

			Element.Recalc_RunsCompiledPr();
			AscCommon.CollaborativeEditing.Update_DocumentPositionsOnAdd(oMathContent, Pos);
		}
	}
};
CChangesMathContentAddItem.prototype.IsRelated = function(oChanges)
{
	if (this.Class === oChanges.Class && (AscDFH.historyitem_MathContent_AddItem === oChanges.Type || AscDFH.historyitem_MathContent_RemoveItem === oChanges.Type))
		return true;

	return false;
};
CChangesMathContentAddItem.prototype.CreateReverseChange = function()
{
	return this.private_CreateReverseChange(CChangesMathContentRemoveItem);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseContentChange}
 */
function CChangesMathContentRemoveItem(Class, Pos, Items)
{
	AscDFH.CChangesBaseContentChange.call(this, Class, Pos, Items, false);
}
CChangesMathContentRemoveItem.prototype = Object.create(AscDFH.CChangesBaseContentChange.prototype);
CChangesMathContentRemoveItem.prototype.constructor = CChangesMathContentRemoveItem;
CChangesMathContentRemoveItem.prototype.Type = AscDFH.historyitem_MathContent_RemoveItem;
CChangesMathContentRemoveItem.prototype.Undo = function()
{
	var oMathContent = this.Class;

	var Array_start = oMathContent.Content.slice(0, this.Pos);
	var Array_end   = oMathContent.Content.slice(this.Pos);

	oMathContent.Content = Array_start.concat(this.Items, Array_end);

	for (var nIndex = 0; nIndex < this.Items.length; ++nIndex)
	{
		this.Items[nIndex].Set_ParaMath(oMathContent.ParaMath);

		if (this.Items[nIndex].SetParagraph)
			this.Items[nIndex].SetParagraph(oMathContent.Paragraph);

		this.Items[nIndex].Recalc_RunsCompiledPr();
	}
};
CChangesMathContentRemoveItem.prototype.Redo = function()
{
	var oMathContent = this.Class;
	oMathContent.Content.splice(this.Pos, this.Items.length);
};
CChangesMathContentRemoveItem.prototype.private_WriteItem = function(Writer, Item)
{
	Writer.WriteString2(Item.Get_Id());
};
CChangesMathContentRemoveItem.prototype.private_ReadItem = function(Reader)
{
	return AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CChangesMathContentRemoveItem.prototype.Load = function(Color)
{
	var oMathContent = this.Class;
	for (var nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
	{
		var ChangesPos = oMathContent.m_oContentChanges.Check(AscCommon.contentchanges_Remove, this.PosArray[nIndex]);

		if (false === ChangesPos)
			continue;

		oMathContent.Content.splice(ChangesPos, 1);
		AscCommon.CollaborativeEditing.Update_DocumentPositionsOnRemove(oMathContent, ChangesPos, 1);
	}
};
CChangesMathContentRemoveItem.prototype.IsRelated = function(oChanges)
{
	if (this.Class === oChanges.Class && (AscDFH.historyitem_MathContent_AddItem === oChanges.Type || AscDFH.historyitem_MathContent_RemoveItem === oChanges.Type))
		return true;

	return false;
};
CChangesMathContentRemoveItem.prototype.CreateReverseChange = function()
{
	return this.private_CreateReverseChange(CChangesMathContentAddItem);
};
/**
 * Изменение настроек ArgSize в классе CMathContent
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathContentArgSize(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathContentArgSize.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathContentArgSize.prototype.constructor = CChangesMathContentArgSize;
CChangesMathContentArgSize.prototype.Type = AscDFH.historyitem_MathContent_ArgSize;
CChangesMathContentArgSize.prototype.private_SetValue = function(Value)
{
	var oMathContent = this.Class;
	oMathContent.ArgSize.SetValue(Value);
	oMathContent.Recalc_RunsCompiledPr();
};

/**
 * Изменение прилегания всей формулы (ParaMath)
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathParaJc(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathParaJc.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathParaJc.prototype.constructor = CChangesMathParaJc;
CChangesMathParaJc.prototype.Type = AscDFH.historyitem_MathPara_Jc;
CChangesMathParaJc.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetAlign(Value);
};


/**
 * @constructor
 * @extends {AscDFH.CChangesBaseContentChange}
 */
function CChangesMathBaseAddItems(Class, Pos, Items)
{
	AscDFH.CChangesBaseContentChange.call(this, Class, Pos, Items, true);
}
CChangesMathBaseAddItems.prototype = Object.create(AscDFH.CChangesBaseContentChange.prototype);
CChangesMathBaseAddItems.prototype.constructor = CChangesMathBaseAddItems;
CChangesMathBaseAddItems.prototype.Type = AscDFH.historyitem_MathBase_AddItems;
CChangesMathBaseAddItems.prototype.Undo = function()
{
	this.Class.raw_RemoveFromContent(this.Pos, this.Items.length);
};
CChangesMathBaseAddItems.prototype.Redo = function()
{
	this.Class.raw_AddToContent(this.Pos, this.Items, false);
};
CChangesMathBaseAddItems.prototype.private_WriteItem = function(Writer, Item)
{
	Writer.WriteString2(Item.Get_Id());
};
CChangesMathBaseAddItems.prototype.private_ReadItem = function(Reader)
{
	return AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CChangesMathBaseAddItems.prototype.Load = function(Color)
{
	var oMathBase = this.Class;
	for (var nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
	{
		var Pos     = oMathBase.m_oContentChanges.Check(AscCommon.contentchanges_Add, this.PosArray[nIndex]);
		var Element = this.Items[nIndex];

		if (null !== Element)
		{
			oMathBase.Content.splice(Pos, 0, Element);

			if (Element.Set_ParaMath)
				Element.Set_ParaMath(oMathBase.ParaMath);

			if (Element.SetParagraph)
				Element.SetParagraph(oMathBase.Paragraph);

			Element.ParentElement = oMathBase;
			AscCommon.CollaborativeEditing.Update_DocumentPositionsOnAdd(oMathBase, Pos);
		}
	}

	oMathBase.fillContent();
};
CChangesMathBaseAddItems.prototype.IsRelated = function(oChanges)
{
	if (this.Class === oChanges.Class && (AscDFH.historyitem_MathBase_AddItems === oChanges.Type || AscDFH.historyitem_MathBase_RemoveItems === oChanges.Type))
		return true;

	return false;
};
CChangesMathBaseAddItems.prototype.CreateReverseChange = function()
{
	return this.private_CreateReverseChange(CChangesMathBaseRemoveItems);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseContentChange}
 */
function CChangesMathBaseRemoveItems(Class, Pos, Items)
{
	AscDFH.CChangesBaseContentChange.call(this, Class, Pos, Items, false);
}
CChangesMathBaseRemoveItems.prototype = Object.create(AscDFH.CChangesBaseContentChange.prototype);
CChangesMathBaseRemoveItems.prototype.constructor = CChangesMathBaseRemoveItems;
CChangesMathBaseRemoveItems.prototype.Type = AscDFH.historyitem_MathBase_RemoveItems;
CChangesMathBaseRemoveItems.prototype.Undo = function()
{
	this.Class.raw_AddToContent(this.Pos, this.Items, false);
};
CChangesMathBaseRemoveItems.prototype.Redo = function()
{
	this.Class.raw_RemoveFromContent(this.Pos, this.Items.length);
};
CChangesMathBaseRemoveItems.prototype.private_WriteItem = function(Writer, Item)
{
	Writer.WriteString2(Item.Get_Id());
};
CChangesMathBaseRemoveItems.prototype.private_ReadItem = function(Reader)
{
	return AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CChangesMathBaseRemoveItems.prototype.Load = function()
{
	var oMathBase = this.Class;
	for (var nIndex = 0, nCount = this.Items.length; nIndex < nCount; ++nIndex)
	{
		var ChangesPos = oMathBase.m_oContentChanges.Check(AscCommon.contentchanges_Remove, this.PosArray[nIndex]);
		if (false === ChangesPos)
			continue;

		oMathBase.Content.splice(ChangesPos, 1);
		AscCommon.CollaborativeEditing.Update_DocumentPositionsOnRemove(oMathBase, ChangesPos, 1);
	}
	oMathBase.fillContent();
};
CChangesMathBaseRemoveItems.prototype.IsRelated = function(oChanges)
{
	if (this.Class === oChanges.Class && (AscDFH.historyitem_MathBase_AddItems === oChanges.Type || AscDFH.historyitem_MathBase_RemoveItems === oChanges.Type))
		return true;

	return false;
};
CChangesMathBaseRemoveItems.prototype.CreateReverseChange = function()
{
	return this.private_CreateReverseChange(CChangesMathBaseAddItems);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathBaseFontSize(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathBaseFontSize.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathBaseFontSize.prototype.constructor = CChangesMathBaseFontSize;
CChangesMathBaseFontSize.prototype.Type = AscDFH.historyitem_MathBase_FontSize;
CChangesMathBaseFontSize.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetFontSize(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesMathBaseShd(Class, Old, New)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New);
}
CChangesMathBaseShd.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesMathBaseShd.prototype.constructor = CChangesMathBaseShd;
CChangesMathBaseShd.prototype.Type = AscDFH.historyitem_MathBase_Shd;
CChangesMathBaseShd.prototype.private_CreateObject = function()
{
	return new CDocumentShd();
};
CChangesMathBaseShd.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetShd(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesMathBaseColor(Class, Old, New)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New);
}
CChangesMathBaseColor.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesMathBaseColor.prototype.constructor = CChangesMathBaseColor;
CChangesMathBaseColor.prototype.Type = AscDFH.historyitem_MathBase_Color;
CChangesMathBaseColor.prototype.private_CreateObject = function()
{
	return new CDocumentColor(0, 0, 0, false);
};
CChangesMathBaseColor.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetColor(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesMathBaseUnifill(Class, Old, New)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New);
}
CChangesMathBaseUnifill.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesMathBaseUnifill.prototype.constructor = CChangesMathBaseUnifill;
CChangesMathBaseUnifill.prototype.Type = AscDFH.historyitem_MathBase_Unifill;
CChangesMathBaseUnifill.prototype.private_CreateObject = function()
{
	return new AscFormat.CUniFill();
};
CChangesMathBaseUnifill.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetUnifill(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBaseUnderline(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBaseUnderline.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBaseUnderline.prototype.constructor = CChangesMathBaseUnderline;
CChangesMathBaseUnderline.prototype.Type = AscDFH.historyitem_MathBase_Underline;
CChangesMathBaseUnderline.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetUnderline(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBaseStrikeout(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBaseStrikeout.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBaseStrikeout.prototype.constructor = CChangesMathBaseStrikeout;
CChangesMathBaseStrikeout.prototype.Type = AscDFH.historyitem_MathBase_Strikeout;
CChangesMathBaseStrikeout.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetStrikeout(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBaseDoubleStrikeout(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBaseDoubleStrikeout.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBaseDoubleStrikeout.prototype.constructor = CChangesMathBaseDoubleStrikeout;
CChangesMathBaseDoubleStrikeout.prototype.Type = AscDFH.historyitem_MathBase_DoubleStrikeout;
CChangesMathBaseDoubleStrikeout.prototype.private_SetValue = function(Value)
{
	this.Class.raw_Set_DoubleStrikeout(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBaseItalic(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBaseItalic.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBaseItalic.prototype.constructor = CChangesMathBaseItalic;
CChangesMathBaseItalic.prototype.Type = AscDFH.historyitem_MathBase_Italic;
CChangesMathBaseItalic.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetItalic(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBaseBold(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBaseBold.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBaseBold.prototype.constructor = CChangesMathBaseBold;
CChangesMathBaseBold.prototype.Type = AscDFH.historyitem_MathBase_Bold;
CChangesMathBaseBold.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetBold(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesMathBaseRFontsAscii(Class, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
}
CChangesMathBaseRFontsAscii.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesMathBaseRFontsAscii.prototype.constructor = CChangesMathBaseRFontsAscii;
CChangesMathBaseRFontsAscii.prototype.Type = AscDFH.historyitem_MathBase_RFontsAscii;
CChangesMathBaseRFontsAscii.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetRFontsAscii(Value);
};
CChangesMathBaseRFontsAscii.prototype.WriteToBinary = function(Writer)
{
	// Long  : Flag
	// 1-bit : Подсвечивать ли данные изменения
	// 2-bit : Is undefined New ?
	// 3-bit : Is undefined Old ?
	// String : New
	// String : Old

	var nFlags = 0;

	if (false !== this.Color)
		nFlags |= 1;

	if (undefined === this.New)
		nFlags |= 2;

	if (undefined === this.Old)
		nFlags |= 4;

	Writer.WriteLong(nFlags);

	if (undefined !== this.New)
		Writer.WriteString2(this.New.Name);

	if (undefined !== this.Old)
		Writer.WriteString2(this.Old.Name);
};
CChangesMathBaseRFontsAscii.prototype.ReadFromBinary = function(Reader)
{
	// Long  : Flag
	// 1-bit : Подсвечивать ли данные изменения
	// 2-bit : Is undefined New ?
	// 3-bit : Is undefined Old ?
	// String : New
	// String : Old

	var nFlags = Reader.GetLong();

	if (nFlags & 1)
		this.Color = true;
	else
		this.Color = false;

	if (nFlags & 2)
	{
		this.New = undefined;
	}
	else
	{
		this.New = {
			Name  : Reader.GetString2(),
			Index : -1
		};
	}

	if (nFlags & 4)
	{
		this.Old = undefined;
	}
	else
	{
		this.Old = {
			Name  : Reader.GetString2(),
			Index : -1
		};
	}
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesMathBaseRFontsHAnsi(Class, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
}
CChangesMathBaseRFontsHAnsi.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesMathBaseRFontsHAnsi.prototype.constructor = CChangesMathBaseRFontsHAnsi;
CChangesMathBaseRFontsHAnsi.prototype.Type = AscDFH.historyitem_MathBase_RFontsHAnsi;
CChangesMathBaseRFontsHAnsi.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetRFontsHAnsi(Value);
};
CChangesMathBaseRFontsHAnsi.prototype.WriteToBinary  = CChangesMathBaseRFontsAscii.prototype.WriteToBinary;
CChangesMathBaseRFontsHAnsi.prototype.ReadFromBinary = CChangesMathBaseRFontsAscii.prototype.ReadFromBinary;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesMathBaseRFontsCS(Class, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
}
CChangesMathBaseRFontsCS.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesMathBaseRFontsCS.prototype.constructor = CChangesMathBaseRFontsCS;
CChangesMathBaseRFontsCS.prototype.Type = AscDFH.historyitem_MathBase_RFontsCS;
CChangesMathBaseRFontsCS.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetRFontsCS(Value);
};
CChangesMathBaseRFontsCS.prototype.WriteToBinary  = CChangesMathBaseRFontsAscii.prototype.WriteToBinary;
CChangesMathBaseRFontsCS.prototype.ReadFromBinary = CChangesMathBaseRFontsAscii.prototype.ReadFromBinary;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesMathBaseRFontsEastAsia(Class, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
}
CChangesMathBaseRFontsEastAsia.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesMathBaseRFontsEastAsia.prototype.constructor = CChangesMathBaseRFontsEastAsia;
CChangesMathBaseRFontsEastAsia.prototype.Type = AscDFH.historyitem_MathBase_RFontsEastAsia;
CChangesMathBaseRFontsEastAsia.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetRFontsEastAsia(Value);
};
CChangesMathBaseRFontsEastAsia.prototype.WriteToBinary  = CChangesMathBaseRFontsAscii.prototype.WriteToBinary;
CChangesMathBaseRFontsEastAsia.prototype.ReadFromBinary = CChangesMathBaseRFontsAscii.prototype.ReadFromBinary;
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathBaseRFontsHint(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathBaseRFontsHint.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathBaseRFontsHint.prototype.constructor = CChangesMathBaseRFontsHint;
CChangesMathBaseRFontsHint.prototype.Type = AscDFH.historyitem_MathBase_RFontsHint;
CChangesMathBaseRFontsHint.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetRFontsHint(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesMathBaseHighLight(Class, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
}
CChangesMathBaseHighLight.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesMathBaseHighLight.prototype.constructor = CChangesMathBaseHighLight;
CChangesMathBaseHighLight.prototype.Type = AscDFH.historyitem_MathBase_HighLight;
CChangesMathBaseHighLight.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetHighLight(Value);
};
CChangesMathBaseHighLight.prototype.WriteToBinary = function(Writer)
{
	// Long  : Flag
	// 1-bit : Подсвечивать ли данные изменения
	// 2-bit : Is undefined New ?
	// 3-bit : Is "none" New ?
	// 4-bit : Is undefined New ?
	// 5-bit : Is "none" New ?
	// Variable(?CDocumentColor) : New (если 2 и 3 биты нулевые)
	// Variable(?CDocumentColor) : Old (если 4 и 5 биты нулевые)

	var nFlags = 0;

	if (false !== this.Color)
		nFlags |= 1;

	if (undefined === this.New)
		nFlags |= 2;
	else if (highlight_None === this.New)
		nFlags |= 4;

	if (undefined === this.Old)
		nFlags |= 8;
	else if (highlight_None === this.Old)
		nFlags |= 16;

	Writer.WriteLong(nFlags);

	if (undefined !== this.New && highlight_None !== this.New)
		this.New.Write_ToBinary(Writer);

	if (undefined !== this.Old && highlight_None !== this.Old)
		this.Old.Write_ToBinary(Writer);
};
CChangesMathBaseHighLight.prototype.ReadFromBinary = function(Reader)
{
	// Long  : Flag
	// 1-bit : Подсвечивать ли данные изменения
	// 2-bit : Is undefined New ?
	// 3-bit : Is "none" New ?
	// 4-bit : Is undefined New ?
	// 5-bit : Is "none" New ?
	// Variable(?CDocumentColor) : New (если 2 и 3 биты нулевые)
	// Variable(?CDocumentColor) : Old (если 4 и 5 биты нулевые)

	var nFlags = Reader.GetLong();

	if (nFlags & 1)
		this.Color = true;
	else
		this.Color = false;

	if (nFlags & 2)
	{
		this.New = undefined;
	}
	else if (nFlags & 4)
	{
		this.New = highlight_None;
	}
	else
	{
		this.New = new CDocumentColor(0, 0, 0);
		this.New.Read_FromBinary(Reader);
	}

	if (nFlags & 8)
	{
		this.Old = undefined;
	}
	else if (nFlags & 16)
	{
		this.Old = highlight_None;
	}
	else
	{
		this.Old = new CDocumentColor(0, 0, 0);
		this.Old.Read_FromBinary(Reader);
	}
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesMathBaseReviewType(Class, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
}
CChangesMathBaseReviewType.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesMathBaseReviewType.prototype.constructor = CChangesMathBaseReviewType;
CChangesMathBaseReviewType.prototype.Type = AscDFH.historyitem_MathBase_ReviewType;
CChangesMathBaseReviewType.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetReviewType(Value.Type, Value.Info);
};
CChangesMathBaseReviewType.prototype.WriteToBinary = function(Writer)
{
	// Long : Flags
	// 1-bit : New.Info is undefined?
	// 2-bit : Old.Info is undefined?
	// Long : New.Type
	// CReviewInfo: New.Info (1-bit is zero)
	// Long : Old.Type
	// CReviewInfo: Old.Info (1-bit is zero)

	var nFlags = 0;
	if (undefined === this.New.Info)
		nFlags |= 1;
	if (undefined === this.Old.Info)
		nFlags |= 2;

	Writer.WriteLong(nFlags);
	Writer.WriteLong(this.New.Type);
	if (undefined !== this.New.Info)
		this.New.Info.Write_ToBinary(Writer);
	Writer.WriteLong(this.Old.Type);
	if (undefined !== this.Old.Info)
		this.Old.Info.Write_ToBinary(Writer);
};
CChangesMathBaseReviewType.prototype.ReadFromBinary = function(Reader)
{
	// Long : Flags
	// 1-bit : New.Info is undefined?
	// 2-bit : Old.Info is undefined?
	// Long : New.Type
	// CReviewInfo: New.Info (1-bit is zero)
	// Long : Old.Type
	// CReviewInfo: Old.Info (1-bit is zero)

	var nFlags = Reader.GetLong();

	this.New = {
		Type : Reader.GetLong(),
		Info : undefined
	};

	if (!(nFlags & 1))
	{
		this.New.Info = new CReviewInfo();
		this.New.Info.Read_FromBinary(Reader);
	}

	this.Old = {
		Type : Reader.GetLong(),
		Info : undefined
	};

	if (!(nFlags & 2))
	{
		this.Old.Info = new CReviewInfo();
		this.Old.Info.Read_FromBinary(Reader);
	}
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesMathBaseTextFill(Class, Old, New)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New);
}
CChangesMathBaseTextFill.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesMathBaseTextFill.prototype.constructor = CChangesMathBaseTextFill;
CChangesMathBaseTextFill.prototype.Type = AscDFH.historyitem_MathBase_TextFill;
CChangesMathBaseTextFill.prototype.private_CreateObject = function()
{
	return new AscFormat.CUniFill();
};
CChangesMathBaseTextFill.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetTextFill(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesMathBaseTextOutline(Class, Old, New)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New);
}
CChangesMathBaseTextOutline.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesMathBaseTextOutline.prototype.constructor = CChangesMathBaseTextOutline;
CChangesMathBaseTextOutline.prototype.Type = AscDFH.historyitem_MathBase_TextOutline;
CChangesMathBaseTextOutline.prototype.private_CreateObject = function()
{
	return new AscFormat.CLn();
};
CChangesMathBaseTextOutline.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetTextOutline(Value);
};


/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathBoxAlnAt(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathBoxAlnAt.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathBoxAlnAt.prototype.constructor = CChangesMathBoxAlnAt;
CChangesMathBoxAlnAt.prototype.Type = AscDFH.historyitem_MathBox_AlnAt;
CChangesMathBoxAlnAt.prototype.private_SetValue = function(Value)
{
	this.Class.raw_setAlnAt(Value);
};
CChangesMathBoxAlnAt.prototype.Merge = function(oChange)
{
	if (this.Class !== oChange.Class)
		return true;

	if (this.Type === oChange.Type || AscDFH.historyitem_MathBox_ForcedBreak === oChange.Type)
		return false;

	return true;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBoxForcedBreak(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBoxForcedBreak.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBoxForcedBreak.prototype.constructor = CChangesMathBoxForcedBreak;
CChangesMathBoxForcedBreak.prototype.Type = AscDFH.historyitem_MathBox_ForcedBreak;
CChangesMathBoxForcedBreak.prototype.private_SetValue = function(Value)
{
	this.Class.raw_ForcedBreak(Value, this.Class.Pr.Get_AlnAt());
};
CChangesMathBoxForcedBreak.prototype.Merge = function(oChange)
{
	if (this.Class !== oChange.Class)
		return true;

	if (this.Type === oChange.Type)
		return false;

	return true;
};


/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathFractionType(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathFractionType.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathFractionType.prototype.constructor = CChangesMathFractionType;
CChangesMathFractionType.prototype.Type = AscDFH.historyitem_MathFraction_Type;
CChangesMathFractionType.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetFractionType(Value);
};


/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathRadicalHideDegree(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathRadicalHideDegree.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathRadicalHideDegree.prototype.constructor = CChangesMathRadicalHideDegree;
CChangesMathRadicalHideDegree.prototype.Type = AscDFH.historyitem_MathRadical_HideDegree;
CChangesMathRadicalHideDegree.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetHideDegree(Value);
};


/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathNaryLimLoc(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathNaryLimLoc.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathNaryLimLoc.prototype.constructor = CChangesMathNaryLimLoc;
CChangesMathNaryLimLoc.prototype.Type = AscDFH.historyitem_MathNary_LimLoc;
CChangesMathNaryLimLoc.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetLimLoc(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathNaryUpperLimit(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathNaryUpperLimit.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathNaryUpperLimit.prototype.constructor = CChangesMathNaryUpperLimit;
CChangesMathNaryUpperLimit.prototype.Type = AscDFH.historyitem_MathNary_UpperLimit;
CChangesMathNaryUpperLimit.prototype.private_SetValue = function(Value)
{
	this.Class.raw_HideUpperIterator(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathNaryLowerLimit(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathNaryLowerLimit.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathNaryLowerLimit.prototype.constructor = CChangesMathNaryLowerLimit;
CChangesMathNaryLowerLimit.prototype.Type = AscDFH.historyitem_MathNary_LowerLimit;
CChangesMathNaryLowerLimit.prototype.private_SetValue = function(Value)
{
	this.Class.raw_HideLowerIterator(Value);
};


/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathDelimBegOper(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathDelimBegOper.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathDelimBegOper.prototype.constructor = CChangesMathDelimBegOper;
CChangesMathDelimBegOper.prototype.Type = AscDFH.historyitem_MathDelimiter_BegOper;
CChangesMathDelimBegOper.prototype.private_SetValue = function(Value)
{
	this.Class.raw_HideBegOperator(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathDelimEndOper(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathDelimEndOper.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathDelimEndOper.prototype.constructor = CChangesMathDelimEndOper;
CChangesMathDelimEndOper.prototype.Type = AscDFH.historyitem_MathDelimiter_EndOper;
CChangesMathDelimEndOper.prototype.private_SetValue = function(Value)
{
	this.Class.raw_HideEndOperator(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathDelimiterGrow(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathDelimiterGrow.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathDelimiterGrow.prototype.constructor = CChangesMathDelimiterGrow;
CChangesMathDelimiterGrow.prototype.Type = AscDFH.historyitem_MathDelimiter_Grow;
CChangesMathDelimiterGrow.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetGrow(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathDelimiterShape(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathDelimiterShape.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathDelimiterShape.prototype.constructor = CChangesMathDelimiterShape;
CChangesMathDelimiterShape.prototype.Type = AscDFH.historyitem_MathDelimiter_Shape;
CChangesMathDelimiterShape.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetShape(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathDelimiterSetColumn(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathDelimiterSetColumn.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathDelimiterSetColumn.prototype.constructor = CChangesMathDelimiterSetColumn;
CChangesMathDelimiterSetColumn.prototype.Type = AscDFH.historyitem_MathDelimiter_SetColumn;
CChangesMathDelimiterSetColumn.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetColumn(Value);
};


/**
 * @constructor
 * @extends {AscDFH.CChangesBaseObjectProperty}
 */
function CChangesMathGroupCharPr(Class, Old, New)
{
	AscDFH.CChangesBaseObjectProperty.call(this, Class, Old, New);
}
CChangesMathGroupCharPr.prototype = Object.create(AscDFH.CChangesBaseObjectProperty.prototype);
CChangesMathGroupCharPr.prototype.constructor = CChangesMathGroupCharPr;
CChangesMathGroupCharPr.prototype.Type = AscDFH.historyitem_MathGroupChar_Pr;
CChangesMathGroupCharPr.prototype.private_CreateObject = function()
{
	return new CMathGroupChrPr();
};
CChangesMathGroupCharPr.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetPr(Value);
};


/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathLimitType(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathLimitType.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathLimitType.prototype.constructor = CChangesMathLimitType;
CChangesMathLimitType.prototype.Type = AscDFH.historyitem_MathLimit_Type;
CChangesMathLimitType.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetType(Value);
};


/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBorderBoxTop(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBorderBoxTop.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBorderBoxTop.prototype.constructor = CChangesMathBorderBoxTop;
CChangesMathBorderBoxTop.prototype.Type = AscDFH.historyitem_MathBorderBox_Top;
CChangesMathBorderBoxTop.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetTop(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBorderBoxBot(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBorderBoxBot.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBorderBoxBot.prototype.constructor = CChangesMathBorderBoxBot;
CChangesMathBorderBoxBot.prototype.Type = AscDFH.historyitem_MathBorderBox_Bot;
CChangesMathBorderBoxBot.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetBot(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBorderBoxLeft(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBorderBoxLeft.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBorderBoxLeft.prototype.constructor = CChangesMathBorderBoxLeft;
CChangesMathBorderBoxLeft.prototype.Type = AscDFH.historyitem_MathBorderBox_Left;
CChangesMathBorderBoxLeft.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetLeft(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBorderBoxRight(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBorderBoxRight.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBorderBoxRight.prototype.constructor = CChangesMathBorderBoxRight;
CChangesMathBorderBoxRight.prototype.Type = AscDFH.historyitem_MathBorderBox_Right;
CChangesMathBorderBoxRight.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetRight(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBorderBoxHor(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBorderBoxHor.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBorderBoxHor.prototype.constructor = CChangesMathBorderBoxHor;
CChangesMathBorderBoxHor.prototype.Type = AscDFH.historyitem_MathBorderBox_Hor;
CChangesMathBorderBoxHor.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetHor(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBorderBoxVer(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBorderBoxVer.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBorderBoxVer.prototype.constructor = CChangesMathBorderBoxVer;
CChangesMathBorderBoxVer.prototype.Type = AscDFH.historyitem_MathBorderBox_Ver;
CChangesMathBorderBoxVer.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetVer(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBorderBoxTopLTR(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBorderBoxTopLTR.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBorderBoxTopLTR.prototype.constructor = CChangesMathBorderBoxTopLTR;
CChangesMathBorderBoxTopLTR.prototype.Type = AscDFH.historyitem_MathBorderBox_TopLTR;
CChangesMathBorderBoxTopLTR.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetTopLTR(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathBorderBoxTopRTL(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathBorderBoxTopRTL.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathBorderBoxTopRTL.prototype.constructor = CChangesMathBorderBoxTopRTL;
CChangesMathBorderBoxTopRTL.prototype.Type = AscDFH.historyitem_MathBorderBox_TopRTL;
CChangesMathBorderBoxTopRTL.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetTopRTL(Value);
};


/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathBarLinePos(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathBarLinePos.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathBarLinePos.prototype.constructor = CChangesMathBarLinePos;
CChangesMathBarLinePos.prototype.Type = AscDFH.historyitem_MathBar_LinePos;
CChangesMathBarLinePos.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetLinePos(Value);
};


/**
 * @constructor
 * @extends {AscDFH.CChangesBase}
 */
function CChangesMathMatrixAddRow(Class, Pos, Items)
{
	AscDFH.CChangesBase.call(this, Class);

	this.Pos    = Pos;
	this.Items  = Items;

	this.UseArray = false;
	this.PosArray = [];
}
CChangesMathMatrixAddRow.prototype = Object.create(AscDFH.CChangesBase.prototype);
CChangesMathMatrixAddRow.prototype.constructor = CChangesMathMatrixAddRow;
CChangesMathMatrixAddRow.prototype.Type = AscDFH.historyitem_MathMatrix_AddRow;
CChangesMathMatrixAddRow.prototype.Undo = function()
{
	this.Class.raw_RemoveRow(this.Pos, this.Items.length);
};
CChangesMathMatrixAddRow.prototype.Redo = function()
{
	this.Class.raw_AddRow(this.Pos, this.Items);
};
CChangesMathMatrixAddRow.prototype.WriteToBinary = function(Writer)
{
	// Long     : Количество элементов
	// Array of :
	//  {
	//    Long     : Позиция
	//    Variable : Id элемента
	//  }

	var bArray = this.UseArray;
	var nCount = this.Items.length;

	Writer.WriteLong(nCount);
	for (var nIndex = 0; nIndex < nCount; ++nIndex)
	{
		if (true === bArray)
			Writer.WriteLong(this.PosArray[nIndex]);
		else
			Writer.WriteLong(this.Pos + nIndex);

		Writer.WriteString2(this.Items[nIndex].Get_Id());
	}
};
CChangesMathMatrixAddRow.prototype.ReadFromBinary = function(Reader)
{
	// Long     : Количество элементов
	// Array of :
	//  {
	//    Long     : Позиция
	//    Variable : Id Элемента
	//  }

	this.UseArray = true;
	this.Items    = [];
	this.PosArray = [];

	var nCount = Reader.GetLong();
	for (var nIndex = 0; nIndex < nCount; ++nIndex)
	{
		this.PosArray[nIndex] = Reader.GetLong();
		this.Items[nIndex]    = AscCommon.g_oTableId.Get_ById(Reader.GetString2());
	}
};
CChangesMathMatrixAddRow.prototype.CreateReverseChange = function()
{
	// TODO: Это изменение надо целиком переделать
	return new CChangesMathMatrixRemoveRow(this.Class, this.Pos, this.Items);
};
CChangesMathMatrixAddRow.prototype.Merge = function(oChange)
{
	// TODO: Это изменение надо целиком переделать
	return true;
};
CChangesMathMatrixAddRow.prototype.Load = function()
{
	var nPos = this.UseArray ? this.PosArray[0] : this.Pos;
	this.Class.raw_AddRow(nPos, this.Items);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBase}
 */
function CChangesMathMatrixRemoveRow(Class, Pos, Items)
{
	AscDFH.CChangesBase.call(this, Class);

	this.Pos    = Pos;
	this.Items  = Items;

	this.UseArray = false;
	this.PosArray = [];
}
CChangesMathMatrixRemoveRow.prototype = Object.create(AscDFH.CChangesBase.prototype);
CChangesMathMatrixRemoveRow.prototype.constructor = CChangesMathMatrixRemoveRow;
CChangesMathMatrixRemoveRow.prototype.Type = AscDFH.historyitem_MathMatrix_RemoveRow;
CChangesMathMatrixRemoveRow.prototype.Undo = function()
{
	this.Class.raw_AddRow(this.Pos, this.Items);
};
CChangesMathMatrixRemoveRow.prototype.Redo = function()
{
	this.Class.raw_RemoveRow(this.Pos, this.Items.length);
};
CChangesMathMatrixRemoveRow.prototype.WriteToBinary = function(Writer)
{
	// Long          : Количество удаляемых элементов
	// Array of
	// {
	//    Long : позиции удаляемых элементов
	//    String : id удаляемых элементов
	// }

	var bArray = this.UseArray;
	var nCount = this.Items.length;

	var nStartPos = Writer.GetCurPosition();
	Writer.Skip(4);
	var nRealCount = nCount;

	for (var nIndex = 0; nIndex < nCount; ++nIndex)
	{
		if (true === bArray)
		{
			if (false === this.PosArray[nIndex])
			{
				nRealCount--;
			}
			else
			{
				Writer.WriteLong(this.PosArray[nIndex]);
				Writer.WriteString2(this.Items[nIndex]);
			}
		}
		else
		{
			Writer.WriteLong(this.Pos);
			Writer.WriteString2(this.Items[nIndex]);
		}
	}

	var nEndPos = Writer.GetCurPosition();
	Writer.Seek(nStartPos);
	Writer.WriteLong(nRealCount);
	Writer.Seek(nEndPos);
};
CChangesMathMatrixRemoveRow.prototype.ReadFromBinary = function(Reader)
{
	// Long          : Количество удаляемых элементов
	// Array of
	// {
	//    Long : позиции удаляемых элементов
	//    String : id удаляемых элементов
	// }

	this.UseArray = true;
	this.Items    = [];
	this.PosArray = [];

	var nCount = Reader.GetLong();
	for (var nIndex = 0; nIndex < nCount; ++nIndex)
	{
		this.PosArray[nIndex] = Reader.GetLong();
		this.Items[nIndex]    = AscCommon.g_oTableId.Get_ById(Reader.GetString2());
	}
};
CChangesMathMatrixRemoveRow.prototype.CreateReverseChange = function()
{
	// TODO: Это изменение надо целиком переделать
	return new CChangesMathMatrixAddRow(this.Class, this.Pos, this.Items);
};
CChangesMathMatrixRemoveRow.prototype.Merge = function(oChange)
{
	// TODO: Это изменение надо целиком переделать
	return true;
};
CChangesMathMatrixRemoveRow.prototype.Load = function()
{
	var nPos = this.UseArray ? this.PosArray[0] : this.Pos;
	this.Class.raw_RemoveRow(nPos, this.Items.length);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBase}
 */
function CChangesMathMatrixAddColumn(Class, Pos, Items)
{
	AscDFH.CChangesBase.call(this, Class);

	this.Pos    = Pos;
	this.Items  = Items;

	this.UseArray = false;
	this.PosArray = [];
}
CChangesMathMatrixAddColumn.prototype = Object.create(AscDFH.CChangesBase.prototype);
CChangesMathMatrixAddColumn.prototype.constructor = CChangesMathMatrixAddColumn;
CChangesMathMatrixAddColumn.prototype.Type = AscDFH.historyitem_MathMatrix_AddColumn;
CChangesMathMatrixAddColumn.prototype.Undo = function()
{
	this.Class.raw_RemoveColumn(this.Pos, this.Items.length);
};
CChangesMathMatrixAddColumn.prototype.Redo = function()
{
	this.Class.raw_AddColumn(this.Pos, this.Items);
};
CChangesMathMatrixAddColumn.prototype.WriteToBinary  = CChangesMathMatrixAddRow.prototype.WriteToBinary;
CChangesMathMatrixAddColumn.prototype.ReadFromBinary = CChangesMathMatrixAddRow.prototype.ReadFromBinary;
CChangesMathMatrixAddColumn.prototype.CreateReverseChange = function()
{
	// TODO: Это изменение надо целиком переделать
	return new CChangesMathMatrixRemoveColumn(this.Class, this.Pos, this.Items);
};
CChangesMathMatrixAddColumn.prototype.Merge = function(oChange)
{
	// TODO: Это изменение надо целиком переделать
	return true;
};
CChangesMathMatrixAddColumn.prototype.Load = function()
{
	var nPos = this.UseArray ? this.PosArray[0] : this.Pos;
	this.Class.raw_AddColumn(nPos, this.Items);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBase}
 */
function CChangesMathMatrixRemoveColumn(Class, Pos, Items)
{
	AscDFH.CChangesBase.call(this, Class);

	this.Pos    = Pos;
	this.Items  = Items;

	this.UseArray = false;
	this.PosArray = [];
}
CChangesMathMatrixRemoveColumn.prototype = Object.create(AscDFH.CChangesBase.prototype);
CChangesMathMatrixRemoveColumn.prototype.constructor = CChangesMathMatrixRemoveColumn;
CChangesMathMatrixRemoveColumn.prototype.Type = AscDFH.historyitem_MathMatrix_RemoveColumn;
CChangesMathMatrixRemoveColumn.prototype.Undo = function()
{
	this.Class.raw_AddColumn(this.Pos, this.Items);
};
CChangesMathMatrixRemoveColumn.prototype.Redo = function()
{
	this.Class.raw_RemoveColumn(this.Pos, this.Items.length);
};
CChangesMathMatrixRemoveColumn.prototype.WriteToBinary  = CChangesMathMatrixRemoveRow.prototype.WriteToBinary;
CChangesMathMatrixRemoveColumn.prototype.ReadFromBinary = CChangesMathMatrixRemoveRow.prototype.ReadFromBinary;
CChangesMathMatrixRemoveColumn.prototype.CreateReverseChange = function()
{
	// TODO: Это изменение надо целиком переделать
	return new CChangesMathMatrixAddColumn(this.Class, this.Pos, this.Items);
};
CChangesMathMatrixRemoveColumn.prototype.Merge = function(oChange)
{
	// TODO: Это изменение надо целиком переделать
	return true;
};
CChangesMathMatrixRemoveColumn.prototype.Load = function()
{
	var nPos = this.UseArray ? this.PosArray[0] : this.Pos;
	this.Class.raw_RemoveColumn(nPos, this.Items.length);
};

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathMatrixBaseJc(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathMatrixBaseJc.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathMatrixBaseJc.prototype.constructor = CChangesMathMatrixBaseJc;
CChangesMathMatrixBaseJc.prototype.Type = AscDFH.historyitem_MathMatrix_BaseJc;
CChangesMathMatrixBaseJc.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetBaseJc(Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesMathMatrixColumnJc(Class, Old, New, ColumnIndex)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);

	this.ColumnIndex = ColumnIndex;
}
CChangesMathMatrixColumnJc.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesMathMatrixColumnJc.prototype.constructor = CChangesMathMatrixColumnJc;
CChangesMathMatrixColumnJc.prototype.Type = AscDFH.historyitem_MathMatrix_ColumnJc;
CChangesMathMatrixColumnJc.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetColumnJc(Value, this.ColumnIndex);
};
CChangesMathMatrixColumnJc.prototype.WriteToBinary = function(Writer)
{
	// Long  : Flag
	// 1-bit : Подсвечивать ли данные изменения
	// 2-bit : IsUndefined New
	// 3-bit : IsUndefined Old
	// long : New
	// long : Old
	// long : ColumnIndex

	var nFlags = 0;

	if (false !== this.Color)
		nFlags |= 1;

	if (undefined === this.New)
		nFlags |= 2;

	if (undefined === this.Old)
		nFlags |= 4;

	Writer.WriteLong(nFlags);

	if (undefined !== this.New)
		Writer.WriteLong(this.New);

	if (undefined !== this.Old)
		Writer.WriteLong(this.Old);

	Writer.WriteLong(this.ColumnIndex);
};
CChangesMathMatrixColumnJc.prototype.ReadFromBinary = function(Reader)
{
	// Long  : Flag
	// 1-bit : Подсвечивать ли данные изменения
	// 2-bit : IsUndefined New
	// 3-bit : IsUndefined Old
	// long : New
	// long : Old
	// long : ColumnIndex

	var nFlags = Reader.GetLong();

	if (nFlags & 1)
		this.Color = true;
	else
		this.Color = false;

	if (nFlags & 2)
		this.New = undefined;
	else
		this.New = Reader.GetLong();

	if (nFlags & 4)
		this.Old = undefined;
	else
		this.Old = Reader.GetLong();

	this.ColumnIndex = Reader.GetLong();
};
CChangesMathMatrixColumnJc.prototype.CreateReverseChange = function()
{
	return new CChangesMathMatrixColumnJc(this.Class, this.New, this.Old, this.ColumnIndex);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesMathMatrixInterval(Class, ItemType, OldRule, OldGap, NewRule, NewGap)
{
	AscDFH.CChangesBaseProperty.call(this, Class, {Rule : OldRule, Gap : OldGap}, {Rule : NewRule, Gap : NewGap});

	this.ItemType = ItemType;
}
CChangesMathMatrixInterval.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesMathMatrixInterval.prototype.constructor = CChangesMathMatrixInterval;
CChangesMathMatrixInterval.prototype.Type = AscDFH.historyitem_MathMatrix_Interval;
CChangesMathMatrixInterval.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetInterval(this.ItemType, Value.Rule, Value.Gap);
};
CChangesMathMatrixInterval.prototype.WriteToBinary = function(Writer)
{
	// Long  : Flag
	// 1-bit : Is undefined New.Rule?
	// 2-bit : Is undefined New.Gap?
	// 3-bit : Is undefined Old.Rule?
	// 4-bit : Is undefined Old.Gap?
	// long : ItemType
	// long : New.Rule (1bit is zero)
	// long : New.Gap (2bit is zero)
	// long : Old.Rule (3bit is zero)
	// long : Old.Gap (4bit is zero)

	var nFlags = 0;

	if (undefined !== this.New.Rule)
		nFlags |= 1;
	if (undefined !== this.New.Gap)
		nFlags |= 2;
	if (undefined !== this.Old.Rule)
		nFlags |= 4;
	if (undefined !== this.Old.Gap)
		nFlags |= 8;

	Writer.WriteLong(nFlags);
	Writer.WriteLong(this.ItemType);

	if (undefined !== this.New.Rule)
		Writer.WriteLong(this.New.Rule);
	if (undefined !== this.New.Gap)
		Writer.WriteLong(this.New.Gap);

	if (undefined !== this.Old.Rule)
		Writer.WriteLong(this.Old.Rule);
	if (undefined !== this.Old.Gap)
		Writer.WriteLong(this.Old.Gap);
};
CChangesMathMatrixInterval.prototype.ReadFromBinary = function(Reader)
{
	// Long  : Flag
	// 1-bit : Is undefined New.Rule?
	// 2-bit : Is undefined New.Gap?
	// 3-bit : Is undefined Old.Rule?
	// 4-bit : Is undefined Old.Gap?
	// long : ItemType
	// long : New.Rule (1bit is zero)
	// long : New.Gap (2bit is zero)
	// long : Old.Rule (3bit is zero)
	// long : Old.Gap (4bit is zero)

	this.New = {
		Rule : undefined,
		Gap  : undefined
	};

	this.Old = {
		Rule : undefined,
		Gap  : undefined
	};

	var nFlags = Reader.GetLong();
	this.ItemType = Reader.GetLong();

	if (!(nFlags & 1))
		this.New.Rule = Reader.GetLong();

	if (!(nFlags & 2))
		this.New.Gap = Reader.GetLong();

	if (!(nFlags & 4))
		this.Old.Rule = Reader.GetLong();

	if (!(nFlags & 8))
		this.Old.Gap = Reader.GetLong();
};
CChangesMathMatrixInterval.prototype.CreateReverseChange = function()
{
	return new CChangesMathMatrixInterval(this.Class, this.ItemType, this.New.Rule, this.New.Gap, this.Old.Rule, this.Old.Gap);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseBoolProperty}
 */
function CChangesMathMatrixPlh(Class, Old, New)
{
	AscDFH.CChangesBaseBoolProperty.call(this, Class, Old, New);
}
CChangesMathMatrixPlh.prototype = Object.create(AscDFH.CChangesBaseBoolProperty.prototype);
CChangesMathMatrixPlh.prototype.constructor = CChangesMathMatrixPlh;
CChangesMathMatrixPlh.prototype.Type = AscDFH.historyitem_MathMatrix_Plh;
CChangesMathMatrixPlh.prototype.private_SetValue = function(Value)
{
	this.Class.raw_HidePlh(Value);
};


/**
 * @constructor
 * @extends {AscDFH.CChangesBaseLongProperty}
 */
function CChangesMathDegreeSubSupType(Class, Old, New)
{
	AscDFH.CChangesBaseLongProperty.call(this, Class, Old, New);
}
CChangesMathDegreeSubSupType.prototype = Object.create(AscDFH.CChangesBaseLongProperty.prototype);
CChangesMathDegreeSubSupType.prototype.constructor = CChangesMathDegreeSubSupType;
CChangesMathDegreeSubSupType.prototype.Type = AscDFH.historyitem_MathDegree_SubSupType;
CChangesMathDegreeSubSupType.prototype.private_SetValue = function(Value)
{
	this.Class.raw_SetType(Value);
};
