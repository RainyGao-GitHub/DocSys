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
 * Специальный класс-обработчик команд для основной части документа
 * @param {CDocument} LogicDocument - Ссылка на главный документ.
 * @constructor
 * @extends {CDocumentControllerBase}
 */
function CLogicDocumentController(LogicDocument)
{
	CDocumentControllerBase.call(this, LogicDocument);
}
CLogicDocumentController.prototype = Object.create(CDocumentControllerBase.prototype);
CLogicDocumentController.prototype.constructor = CLogicDocumentController;

CLogicDocumentController.prototype.CanUpdateTarget = function()
{
	return this.LogicDocument.controller_CanUpdateTarget();
};
CLogicDocumentController.prototype.RecalculateCurPos = function(bUpdateX, bUpdateY)
{
	return this.LogicDocument.controller_RecalculateCurPos(bUpdateX, bUpdateY);
};
CLogicDocumentController.prototype.GetCurPage = function()
{
	return this.LogicDocument.controller_GetCurPage();
};
CLogicDocumentController.prototype.AddNewParagraph = function(bRecalculate, bForceAdd)
{
	return this.LogicDocument.controller_AddNewParagraph(bRecalculate, bForceAdd);
};
CLogicDocumentController.prototype.AddInlineImage = function(nW, nH, oImage, oChart, bFlow)
{
	this.LogicDocument.controller_AddInlineImage(nW, nH, oImage, oChart, bFlow);
};
CLogicDocumentController.prototype.AddImages = function(aImages)
{
	this.LogicDocument.controller_AddImages(aImages);
};
CLogicDocumentController.prototype.AddOleObject = function(nW, nH, nWidthPix, nHeightPix, oImage, oData, sApplicationId)
{
	this.LogicDocument.controller_AddOleObject(nW, nH, nWidthPix, nHeightPix, oImage, oData, sApplicationId);
};
CLogicDocumentController.prototype.AddTextArt = function(nStyle)
{
	this.LogicDocument.controller_AddTextArt(nStyle);
};
CLogicDocumentController.prototype.EditChart = function(Chart)
{
	// Ничего не делаем
};
CLogicDocumentController.prototype.AddSignatureLine = function(oSignatureDrawing)
{
    this.LogicDocument.controller_AddSignatureLine(oSignatureDrawing);
};


CLogicDocumentController.prototype.AddInlineTable = function(nCols, nRows, nMode)
{
	return this.LogicDocument.controller_AddInlineTable(nCols, nRows, nMode);
};
CLogicDocumentController.prototype.ClearParagraphFormatting = function(isClearParaPr, isClearTextPr)
{
	this.LogicDocument.controller_ClearParagraphFormatting(isClearParaPr, isClearTextPr);
};
CLogicDocumentController.prototype.AddToParagraph = function(oItem)
{
	this.LogicDocument.controller_AddToParagraph(oItem);
};
CLogicDocumentController.prototype.Remove = function(nDirection, bOnlyText, bRemoveOnlySelection, bOnAddText, isWord)
{
	return this.LogicDocument.controller_Remove(nDirection, bOnlyText, bRemoveOnlySelection, bOnAddText, isWord);
};
CLogicDocumentController.prototype.GetCursorPosXY = function()
{
	return this.LogicDocument.controller_GetCursorPosXY();
};
CLogicDocumentController.prototype.MoveCursorToStartPos = function(bAddToSelect)
{
	this.LogicDocument.controller_MoveCursorToStartPos(bAddToSelect);
};
CLogicDocumentController.prototype.MoveCursorToEndPos = function(AddToSelect)
{
	this.LogicDocument.controller_MoveCursorToEndPos(AddToSelect);
};
CLogicDocumentController.prototype.MoveCursorLeft = function(AddToSelect, Word)
{
	return this.LogicDocument.controller_MoveCursorLeft(AddToSelect, Word);
};
CLogicDocumentController.prototype.MoveCursorRight = function(AddToSelect, Word)
{
	return this.LogicDocument.controller_MoveCursorRight(AddToSelect, Word);
};
CLogicDocumentController.prototype.MoveCursorUp = function(AddToSelect)
{
	return this.LogicDocument.controller_MoveCursorUp(AddToSelect);
};
CLogicDocumentController.prototype.MoveCursorDown = function(AddToSelect)
{
	return this.LogicDocument.controller_MoveCursorDown(AddToSelect);
};
CLogicDocumentController.prototype.MoveCursorToEndOfLine = function(AddToSelect)
{
	return this.LogicDocument.controller_MoveCursorToEndOfLine(AddToSelect);
};
CLogicDocumentController.prototype.MoveCursorToStartOfLine = function(AddToSelect)
{
	return this.LogicDocument.controller_MoveCursorToStartOfLine(AddToSelect);
};
CLogicDocumentController.prototype.MoveCursorToXY = function(X, Y, PageAbs, AddToSelect)
{
	return this.LogicDocument.controller_MoveCursorToXY(X, Y, PageAbs, AddToSelect);
};
CLogicDocumentController.prototype.MoveCursorToCell = function(bNext)
{
	return this.LogicDocument.controller_MoveCursorToCell(bNext);
};
CLogicDocumentController.prototype.SetParagraphAlign = function(Align)
{
	this.LogicDocument.controller_SetParagraphAlign(Align);
};
CLogicDocumentController.prototype.SetParagraphSpacing = function (Spacing)
{
	this.LogicDocument.controller_SetParagraphSpacing(Spacing);
};
CLogicDocumentController.prototype.SetParagraphTabs = function(Tabs)
{
	this.LogicDocument.controller_SetParagraphTabs(Tabs);
};
CLogicDocumentController.prototype.SetParagraphIndent = function(Ind)
{
	this.LogicDocument.controller_SetParagraphIndent(Ind);
};
CLogicDocumentController.prototype.SetParagraphShd = function(Shd)
{
	this.LogicDocument.controller_SetParagraphShd(Shd);
};
CLogicDocumentController.prototype.SetParagraphStyle = function(Name)
{
	this.LogicDocument.controller_SetParagraphStyle(Name);
};
CLogicDocumentController.prototype.SetParagraphContextualSpacing = function(Value)
{
	this.LogicDocument.controller_SetParagraphContextualSpacing(Value);
};
CLogicDocumentController.prototype.SetParagraphPageBreakBefore = function(Value)
{
	this.LogicDocument.controller_SetParagraphPageBreakBefore(Value);
};
CLogicDocumentController.prototype.SetParagraphKeepLines = function(Value)
{
	this.LogicDocument.controller_SetParagraphKeepLines(Value);
};
CLogicDocumentController.prototype.SetParagraphKeepNext = function(Value)
{
	this.LogicDocument.controller_SetParagraphKeepNext(Value);
};
CLogicDocumentController.prototype.SetParagraphWidowControl = function(Value)
{
	this.LogicDocument.controller_SetParagraphWidowControl(Value);
};
CLogicDocumentController.prototype.SetParagraphBorders = function(Borders)
{
	this.LogicDocument.controller_SetParagraphBorders(Borders);
};
CLogicDocumentController.prototype.SetParagraphFramePr = function(FramePr, bDelete)
{
	this.LogicDocument.controller_SetParagraphFramePr(FramePr, bDelete);
};
CLogicDocumentController.prototype.IncreaseDecreaseFontSize = function(bIncrease)
{
	this.LogicDocument.controller_IncreaseDecreaseFontSize(bIncrease);
};
CLogicDocumentController.prototype.IncreaseDecreaseIndent = function(bIncrease)
{
	this.LogicDocument.controller_IncreaseDecreaseIndent(bIncrease);
};
CLogicDocumentController.prototype.SetImageProps = function(Props)
{
	this.LogicDocument.controller_SetImageProps(Props);
};
CLogicDocumentController.prototype.SetTableProps = function(Props)
{
	this.LogicDocument.controller_SetTableProps(Props);
};
CLogicDocumentController.prototype.GetCalculatedParaPr = function()
{
	return this.LogicDocument.controller_GetCalculatedParaPr();
};
CLogicDocumentController.prototype.GetCalculatedTextPr = function()
{
	return this.LogicDocument.controller_GetCalculatedTextPr();
};
CLogicDocumentController.prototype.GetDirectParaPr = function()
{
	return this.LogicDocument.controller_GetDirectParaPr();
};
CLogicDocumentController.prototype.GetDirectTextPr = function()
{
	return this.LogicDocument.controller_GetDirectTextPr();
};
CLogicDocumentController.prototype.RemoveSelection = function(bNoCheckDrawing)
{
	this.LogicDocument.controller_RemoveSelection(bNoCheckDrawing);
};
CLogicDocumentController.prototype.IsSelectionEmpty = function(bCheckHidden)
{
	return this.LogicDocument.controller_IsSelectionEmpty(bCheckHidden);
};
CLogicDocumentController.prototype.DrawSelectionOnPage = function(PageAbs)
{
	this.LogicDocument.controller_DrawSelectionOnPage(PageAbs);
};
CLogicDocumentController.prototype.GetSelectionBounds = function()
{
	return this.LogicDocument.controller_GetSelectionBounds();
};
CLogicDocumentController.prototype.IsMovingTableBorder = function()
{
	return this.LogicDocument.controller_IsMovingTableBorder();
};
CLogicDocumentController.prototype.CheckPosInSelection = function(X, Y, PageAbs, NearPos)
{
	return this.LogicDocument.controller_CheckPosInSelection(X, Y, PageAbs, NearPos);
};
CLogicDocumentController.prototype.SelectAll = function()
{
	this.LogicDocument.controller_SelectAll();
};
CLogicDocumentController.prototype.GetSelectedContent = function(SelectedContent)
{
	this.LogicDocument.controller_GetSelectedContent(SelectedContent);
};
CLogicDocumentController.prototype.UpdateCursorType = function(X, Y, PageAbs, MouseEvent)
{
	this.LogicDocument.controller_UpdateCursorType(X, Y, PageAbs, MouseEvent);
};
CLogicDocumentController.prototype.PasteFormatting = function(TextPr, ParaPr)
{
	this.LogicDocument.controller_PasteFormatting(TextPr, ParaPr);
};
CLogicDocumentController.prototype.IsSelectionUse = function()
{
	return this.LogicDocument.controller_IsSelectionUse();
};
CLogicDocumentController.prototype.IsNumberingSelection = function()
{
	return this.LogicDocument.controller_IsNumberingSelection();
};
CLogicDocumentController.prototype.IsTextSelectionUse = function()
{
	return this.LogicDocument.controller_IsTextSelectionUse();
};
CLogicDocumentController.prototype.GetCurPosXY = function()
{
	return this.LogicDocument.controller_GetCurPosXY();
};
CLogicDocumentController.prototype.GetSelectedText = function(bClearText, oPr)
{
	return this.LogicDocument.controller_GetSelectedText(bClearText, oPr);
};
CLogicDocumentController.prototype.GetCurrentParagraph = function(bIgnoreSelection, arrSelectedParagraphs, oPr)
{
	return this.LogicDocument.controller_GetCurrentParagraph(bIgnoreSelection, arrSelectedParagraphs, oPr);
};
CLogicDocumentController.prototype.GetSelectedElementsInfo = function(oInfo)
{
	this.LogicDocument.controller_GetSelectedElementsInfo(oInfo);
};
CLogicDocumentController.prototype.AddTableRow = function(bBefore)
{
	this.LogicDocument.controller_AddTableRow(bBefore);
};
CLogicDocumentController.prototype.AddTableColumn = function(bBefore)
{
	this.LogicDocument.controller_AddTableColumn(bBefore);
};
CLogicDocumentController.prototype.RemoveTableRow = function()
{
	this.LogicDocument.controller_RemoveTableRow();
};
CLogicDocumentController.prototype.RemoveTableColumn = function()
{
	this.LogicDocument.controller_RemoveTableColumn();
};
CLogicDocumentController.prototype.MergeTableCells = function()
{
	this.LogicDocument.controller_MergeTableCells();
};
CLogicDocumentController.prototype.DistributeTableCells = function(isHorizontally)
{
	return this.LogicDocument.controller_DistributeTableCells(isHorizontally);
};
CLogicDocumentController.prototype.SplitTableCells = function(Cols, Rows)
{
	this.LogicDocument.controller_SplitTableCells(Cols, Rows);
};
CLogicDocumentController.prototype.RemoveTableCells = function()
{
	this.LogicDocument.controller_RemoveTableCells();
};
CLogicDocumentController.prototype.RemoveTable = function()
{
	this.LogicDocument.controller_RemoveTable();
};
CLogicDocumentController.prototype.SelectTable = function(Type)
{
	this.LogicDocument.controller_SelectTable(Type);
};
CLogicDocumentController.prototype.CanMergeTableCells = function()
{
	return this.LogicDocument.controller_CanMergeTableCells();
};
CLogicDocumentController.prototype.CanSplitTableCells = function()
{
	return this.LogicDocument.controller_CanSplitTableCells();
};
CLogicDocumentController.prototype.UpdateInterfaceState = function()
{
	this.LogicDocument.controller_UpdateInterfaceState();
};
CLogicDocumentController.prototype.UpdateRulersState = function()
{
	this.LogicDocument.controller_UpdateRulersState();
};
CLogicDocumentController.prototype.UpdateSelectionState = function()
{
	this.LogicDocument.controller_UpdateSelectionState();
};
CLogicDocumentController.prototype.GetSelectionState = function()
{
	return this.LogicDocument.controller_GetSelectionState();
};
CLogicDocumentController.prototype.SetSelectionState = function(State, StateIndex)
{
	this.LogicDocument.controller_SetSelectionState(State, StateIndex);
};
CLogicDocumentController.prototype.AddHyperlink = function(Props)
{
	this.LogicDocument.controller_AddHyperlink(Props);
};
CLogicDocumentController.prototype.ModifyHyperlink = function(Props)
{
	this.LogicDocument.controller_ModifyHyperlink(Props);
};
CLogicDocumentController.prototype.RemoveHyperlink = function()
{
	this.LogicDocument.controller_RemoveHyperlink();
};
CLogicDocumentController.prototype.CanAddHyperlink = function(bCheckInHyperlink)
{
	return this.LogicDocument.controller_CanAddHyperlink(bCheckInHyperlink);
};
CLogicDocumentController.prototype.IsCursorInHyperlink = function(bCheckEnd)
{
	return this.LogicDocument.controller_IsCursorInHyperlink(bCheckEnd);
};
CLogicDocumentController.prototype.AddComment = function(Comment)
{
	this.LogicDocument.controller_AddComment(Comment);
};
CLogicDocumentController.prototype.CanAddComment = function()
{
	return this.LogicDocument.controller_CanAddComment();
};
CLogicDocumentController.prototype.GetSelectionAnchorPos = function()
{
	return this.LogicDocument.controller_GetSelectionAnchorPos();
};
CLogicDocumentController.prototype.StartSelectionFromCurPos = function()
{
	this.LogicDocument.controller_StartSelectionFromCurPos();
};
CLogicDocumentController.prototype.SaveDocumentStateBeforeLoadChanges = function(State)
{
	this.LogicDocument.controller_SaveDocumentStateBeforeLoadChanges(State);
};
CLogicDocumentController.prototype.RestoreDocumentStateAfterLoadChanges = function(State)
{
	this.LogicDocument.controller_RestoreDocumentStateAfterLoadChanges(State);
};
CLogicDocumentController.prototype.GetColumnSize = function()
{
	return this.LogicDocument.controller_GetColumnSize();
};
CLogicDocumentController.prototype.GetCurrentSectionPr = function()
{
	return this.LogicDocument.controller_GetCurrentSectionPr();
};
CLogicDocumentController.prototype.RemoveTextSelection = function()
{
	return this.RemoveSelection();
};
CLogicDocumentController.prototype.AddContentControl = function(nContentControlType)
{
	return this.LogicDocument.controller_AddContentControl(nContentControlType);
};
CLogicDocumentController.prototype.GetStyleFromFormatting = function()
{
	return this.LogicDocument.controller_GetStyleFromFormatting();
};
CLogicDocumentController.prototype.GetSimilarNumbering = function(oContinueEngine)
{
	this.LogicDocument.controller_GetSimilarNumbering(oContinueEngine);
};
CLogicDocumentController.prototype.GetPlaceHolderObject = function()
{
	return this.LogicDocument.controller_GetPlaceHolderObject();
};
CLogicDocumentController.prototype.GetAllFields = function(isUseSelection, arrFields)
{
	return this.LogicDocument.controller_GetAllFields(isUseSelection, arrFields);
};
CLogicDocumentController.prototype.IsTableCellSelection = function()
{
	return this.LogicDocument.controller_IsTableCellSelection();
};
CLogicDocumentController.prototype.IsSelectionLocked = function(CheckType)
{
	this.LogicDocument.controller_IsSelectionLocked(CheckType);
};
