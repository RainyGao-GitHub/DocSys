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


// TODO: На самом деле этот класс не нужен. Его нужно совместить с классом CHeaderFooterController, пока он будет сделан
// как оберточный класс над CHeaderFooterController

/**
 * Специальный класс-обработчик команд в колонтитулах
 * @param {CDocument} LogicDocument - Ссылка на главный документ.
 * @param {CHeaderFooterController} HdrFtr - ССылка на объект, управляющий колонтитулами
 * @constructor
 * @extends {CDocumentControllerBase}
 */
function CHdrFtrController(LogicDocument, HdrFtr)
{
	CDocumentControllerBase.call(this, LogicDocument);
	this.HdrFtr = HdrFtr;
}
CHdrFtrController.prototype = Object.create(CDocumentControllerBase.prototype);
CHdrFtrController.prototype.constructor = CHdrFtrController;

CHdrFtrController.prototype.CanUpdateTarget = function()
{
	return true;
};
CHdrFtrController.prototype.RecalculateCurPos = function(bUpdateX, bUpdateY)
{
	return this.HdrFtr.RecalculateCurPos(bUpdateX, bUpdateY);
};
CHdrFtrController.prototype.GetCurPage = function()
{
	var CurHdrFtr = this.HdrFtr.CurHdrFtr;
	if (null !== CurHdrFtr && -1 !== CurHdrFtr.RecalcInfo.CurPage)
		return CurHdrFtr.RecalcInfo.CurPage;

	return -1;
};
CHdrFtrController.prototype.AddNewParagraph = function(bRecalculate, bForceAdd)
{
	return this.HdrFtr.AddNewParagraph(bRecalculate, bForceAdd);
};
CHdrFtrController.prototype.AddSignatureLine = function(oSignatureDrawing)
{
	this.HdrFtr.AddSignatureLine(oSignatureDrawing);
};
CHdrFtrController.prototype.AddInlineImage = function(nW, nH, oImage, oChart, bFlow)
{
	this.HdrFtr.AddInlineImage(nW, nH, oImage, oChart, bFlow);
};
CHdrFtrController.prototype.AddImages = function(aImages)
{
	this.HdrFtr.AddImages(aImages);
};
CHdrFtrController.prototype.AddOleObject = function(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId)
{
	this.HdrFtr.AddOleObject(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId);
};
CHdrFtrController.prototype.AddTextArt = function(nStyle)
{
	this.HdrFtr.AddTextArt(nStyle);
};
CHdrFtrController.prototype.EditChart = function(Chart)
{
	this.HdrFtr.EditChart(Chart);
};
CHdrFtrController.prototype.AddInlineTable = function(nCols, nRows, nMode)
{
	return this.HdrFtr.AddInlineTable(nCols, nRows, nMode);
};
CHdrFtrController.prototype.ClearParagraphFormatting = function(isClearParaPr, isClearTextPr)
{
	this.HdrFtr.ClearParagraphFormatting(isClearParaPr, isClearTextPr);
};
CHdrFtrController.prototype.AddToParagraph = function(oItem, bRecalculate)
{
	if (para_NewLine === oItem.Type && true === oItem.IsPageOrColumnBreak())
		return;

	this.HdrFtr.AddToParagraph(oItem, bRecalculate);
	this.LogicDocument.Document_UpdateSelectionState();
	this.LogicDocument.Document_UpdateUndoRedoState();
};
CHdrFtrController.prototype.Remove = function(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord)
{
	var nResult = this.HdrFtr.Remove(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord);

	// TODO: Проверить зачем была добавлена эта заглушка. При удалении могут быть выставлены новые позиции курсора
	//       и селекта, поэтому странно убирать селект здесь.

	// if (null !== this.HdrFtr.CurHdtr && docpostype_DrawingObjects !== this.HdrFtr.CurHdrFtr.Content.CurPos.Type)
	// {
	// 	this.LogicDocument.RemoveSelection();
	// 	this.LogicDocument.Selection.Use = false;
	// }

	return nResult;
};
CHdrFtrController.prototype.GetCursorPosXY = function()
{
	return this.HdrFtr.GetCursorPosXY();
};
CHdrFtrController.prototype.MoveCursorToStartPos = function(AddToSelect)
{
	this.HdrFtr.MoveCursorToStartPos(AddToSelect);
};
CHdrFtrController.prototype.MoveCursorToEndPos = function(AddToSelect)
{
	this.HdrFtr.MoveCursorToEndPos(AddToSelect);
};
CHdrFtrController.prototype.MoveCursorLeft = function(AddToSelect, Word)
{
	return this.HdrFtr.MoveCursorLeft(AddToSelect, Word);
};
CHdrFtrController.prototype.MoveCursorRight = function(AddToSelect, Word, FromPaste)
{
	return this.HdrFtr.MoveCursorRight(AddToSelect, Word, FromPaste);
};
CHdrFtrController.prototype.MoveCursorUp = function(AddToSelect)
{
	var RetValue = this.HdrFtr.MoveCursorUp(AddToSelect);
	this.LogicDocument.Document_UpdateInterfaceState();
	this.LogicDocument.Document_UpdateSelectionState();
	return RetValue;
};
CHdrFtrController.prototype.MoveCursorDown = function(AddToSelect)
{
	var RetValue = this.HdrFtr.MoveCursorDown(AddToSelect);
	this.LogicDocument.Document_UpdateInterfaceState();
	this.LogicDocument.Document_UpdateSelectionState();
	return RetValue;
};
CHdrFtrController.prototype.MoveCursorToEndOfLine = function(AddToSelect)
{
	return this.HdrFtr.MoveCursorToEndOfLine(AddToSelect);
};
CHdrFtrController.prototype.MoveCursorToStartOfLine = function(AddToSelect)
{
	return this.HdrFtr.MoveCursorToStartOfLine(AddToSelect);
};
CHdrFtrController.prototype.MoveCursorToXY = function(X, Y, PageAbs, AddToSelect)
{
	return this.HdrFtr.MoveCursorToXY(X, Y, PageAbs, AddToSelect);
};
CHdrFtrController.prototype.MoveCursorToCell = function(bNext)
{
	return this.HdrFtr.MoveCursorToCell(bNext);
};
CHdrFtrController.prototype.SetParagraphAlign = function(Align)
{
	this.HdrFtr.SetParagraphAlign(Align);
};
CHdrFtrController.prototype.SetParagraphSpacing = function (Spacing)
{
	this.HdrFtr.SetParagraphSpacing(Spacing);
};
CHdrFtrController.prototype.SetParagraphTabs = function(Tabs)
{
	this.HdrFtr.SetParagraphTabs(Tabs);
};
CHdrFtrController.prototype.SetParagraphIndent = function(Ind)
{
	this.HdrFtr.SetParagraphIndent(Ind);
};
CHdrFtrController.prototype.SetParagraphShd = function(Shd)
{
	this.HdrFtr.SetParagraphShd(Shd);
};
CHdrFtrController.prototype.SetParagraphStyle = function(Name)
{
	this.HdrFtr.SetParagraphStyle(Name);
};
CHdrFtrController.prototype.SetParagraphContextualSpacing = function(Value)
{
	this.HdrFtr.SetParagraphContextualSpacing(Value);
};
CHdrFtrController.prototype.SetParagraphPageBreakBefore = function(Value)
{
	this.HdrFtr.SetParagraphPageBreakBefore(Value);
};
CHdrFtrController.prototype.SetParagraphKeepLines = function(Value)
{
	this.HdrFtr.SetParagraphKeepLines(Value);
};
CHdrFtrController.prototype.SetParagraphKeepNext = function(Value)
{
	this.HdrFtr.SetParagraphKeepNext(Value);
};
CHdrFtrController.prototype.SetParagraphWidowControl = function(Value)
{
	this.HdrFtr.SetParagraphWidowControl(Value);
};
CHdrFtrController.prototype.SetParagraphBorders = function(Borders)
{
	this.HdrFtr.SetParagraphBorders(Borders);
};
CHdrFtrController.prototype.SetParagraphFramePr = function(FramePr, bDelete)
{
	this.HdrFtr.SetParagraphFramePr(FramePr, bDelete);
};
CHdrFtrController.prototype.IncreaseDecreaseFontSize = function(bIncrease)
{
	this.HdrFtr.IncreaseDecreaseFontSize(bIncrease);
};
CHdrFtrController.prototype.IncreaseDecreaseIndent = function(bIncrease)
{
	this.HdrFtr.IncreaseDecreaseIndent(bIncrease);
};
CHdrFtrController.prototype.SetImageProps = function(Props)
{
	this.HdrFtr.SetImageProps(Props);
};
CHdrFtrController.prototype.SetTableProps = function(Props)
{
	this.HdrFtr.SetTableProps(Props);
};
CHdrFtrController.prototype.GetCalculatedParaPr = function()
{
	return this.HdrFtr.GetCalculatedParaPr();
};
CHdrFtrController.prototype.GetCalculatedTextPr = function()
{
	return this.HdrFtr.GetCalculatedTextPr();
};
CHdrFtrController.prototype.GetDirectParaPr = function()
{
	return this.HdrFtr.GetDirectParaPr();
};
CHdrFtrController.prototype.GetDirectTextPr = function()
{
	return this.HdrFtr.GetDirectTextPr();
};
CHdrFtrController.prototype.RemoveSelection = function(bNoCheckDrawing)
{
	this.HdrFtr.RemoveSelection(bNoCheckDrawing);
};
CHdrFtrController.prototype.IsSelectionEmpty = function(bCheckHidden)
{
	return this.HdrFtr.IsSelectionEmpty(bCheckHidden);
};
CHdrFtrController.prototype.DrawSelectionOnPage = function(PageAbs)
{
	this.HdrFtr.DrawSelectionOnPage(PageAbs);
};
CHdrFtrController.prototype.GetSelectionBounds = function()
{
	return this.HdrFtr.GetSelectionBounds();
};
CHdrFtrController.prototype.IsMovingTableBorder = function()
{
	return this.HdrFtr.IsMovingTableBorder();
};
CHdrFtrController.prototype.CheckPosInSelection = function(X, Y, PageAbs, NearPos)
{
	return this.HdrFtr.CheckPosInSelection(X, Y, PageAbs, NearPos);
};
CHdrFtrController.prototype.SelectAll = function()
{
	this.HdrFtr.SelectAll();
};
CHdrFtrController.prototype.GetSelectedContent = function(SelectedContent)
{
	this.HdrFtr.GetSelectedContent(SelectedContent);
};
CHdrFtrController.prototype.UpdateCursorType = function(X, Y, PageAbs, MouseEvent)
{
	this.HdrFtr.UpdateCursorType(X, Y, PageAbs, MouseEvent);
};
CHdrFtrController.prototype.PasteFormatting = function(TextPr, ParaPr)
{
	this.HdrFtr.PasteFormatting(TextPr, ParaPr, false);
};
CHdrFtrController.prototype.IsSelectionUse = function()
{
	return this.HdrFtr.IsSelectionUse();
};
CHdrFtrController.prototype.IsNumberingSelection = function()
{
	return this.HdrFtr.IsNumberingSelection();
};
CHdrFtrController.prototype.IsTextSelectionUse = function()
{
	return this.HdrFtr.IsTextSelectionUse();
};
CHdrFtrController.prototype.GetCurPosXY = function()
{
	return this.HdrFtr.GetCurPosXY();
};
CHdrFtrController.prototype.GetSelectedText = function(bClearText, oPr)
{
	return this.HdrFtr.GetSelectedText(bClearText, oPr);
};
CHdrFtrController.prototype.GetCurrentParagraph = function(bIgnoreSelection, arrSelectedParagraphs, oPr)
{
	return this.HdrFtr.GetCurrentParagraph(bIgnoreSelection, arrSelectedParagraphs, oPr);
};
CHdrFtrController.prototype.GetSelectedElementsInfo = function(oInfo)
{
	this.HdrFtr.GetSelectedElementsInfo(oInfo);
};
CHdrFtrController.prototype.AddTableRow = function(bBefore)
{
	this.HdrFtr.AddTableRow(bBefore);
};
CHdrFtrController.prototype.AddTableColumn = function(bBefore)
{
	this.HdrFtr.AddTableColumn(bBefore);
};
CHdrFtrController.prototype.RemoveTableRow = function()
{
	this.HdrFtr.RemoveTableRow();
};
CHdrFtrController.prototype.RemoveTableColumn = function()
{
	this.HdrFtr.RemoveTableColumn();
};
CHdrFtrController.prototype.MergeTableCells = function()
{
	this.HdrFtr.MergeTableCells();
};
CHdrFtrController.prototype.SplitTableCells = function(Cols, Rows)
{
	this.HdrFtr.SplitTableCells(Cols, Rows);
};
CHdrFtrController.prototype.RemoveTableCells = function()
{
	this.HdrFtr.RemoveTableCells();
};
CHdrFtrController.prototype.RemoveTable = function()
{
	this.HdrFtr.RemoveTable();
};
CHdrFtrController.prototype.SelectTable = function(Type)
{
	this.HdrFtr.SelectTable(Type);
};
CHdrFtrController.prototype.CanMergeTableCells = function()
{
	return this.HdrFtr.CanMergeTableCells();
};
CHdrFtrController.prototype.CanSplitTableCells = function()
{
	return this.HdrFtr.CanSplitTableCells();
};
CHdrFtrController.prototype.UpdateInterfaceState = function()
{
	this.LogicDocument.Interface_Update_HdrFtrPr();
	this.HdrFtr.Document_UpdateInterfaceState();
};
CHdrFtrController.prototype.UpdateRulersState = function()
{
	this.DrawingDocument.Set_RulerState_Paragraph(null);
	this.HdrFtr.Document_UpdateRulersState(this.LogicDocument.CurPage);
};
CHdrFtrController.prototype.UpdateSelectionState = function()
{
	this.HdrFtr.Document_UpdateSelectionState();
	this.LogicDocument.UpdateTracks();
};
CHdrFtrController.prototype.GetSelectionState = function()
{
	return this.HdrFtr.GetSelectionState();
};
CHdrFtrController.prototype.SetSelectionState = function(State, StateIndex)
{
	this.HdrFtr.SetSelectionState(State, StateIndex);
};
CHdrFtrController.prototype.AddHyperlink = function(Props)
{
	this.HdrFtr.AddHyperlink(Props);
};
CHdrFtrController.prototype.ModifyHyperlink = function(Props)
{
	this.HdrFtr.ModifyHyperlink(Props);
};
CHdrFtrController.prototype.RemoveHyperlink = function()
{
	this.HdrFtr.RemoveHyperlink();
};
CHdrFtrController.prototype.CanAddHyperlink = function(bCheckInHyperlink)
{
	return this.HdrFtr.CanAddHyperlink(bCheckInHyperlink);
};
CHdrFtrController.prototype.IsCursorInHyperlink = function(bCheckEnd)
{
	return this.HdrFtr.IsCursorInHyperlink(bCheckEnd);
};
CHdrFtrController.prototype.AddComment = function(Comment)
{
	this.HdrFtr.AddComment(Comment);
};
CHdrFtrController.prototype.CanAddComment = function()
{
	return this.HdrFtr.CanAddComment();
};
CHdrFtrController.prototype.GetSelectionAnchorPos = function()
{
	return this.HdrFtr.GetSelectionAnchorPos();
};
CHdrFtrController.prototype.StartSelectionFromCurPos = function()
{
	this.HdrFtr.StartSelectionFromCurPos();
};
CHdrFtrController.prototype.SaveDocumentStateBeforeLoadChanges = function(State)
{
	var HdrFtr = this.HdrFtr.Get_CurHdrFtr();
	if (null !== HdrFtr)
	{
		var HdrFtrContent = HdrFtr.Get_DocumentContent();
		State.HdrFtr      = HdrFtr;

		State.HdrFtrDocPosType = HdrFtrContent.CurPos.Type;
		State.HdrFtrSelection  = HdrFtrContent.Selection.Use;

		if (docpostype_Content === HdrFtrContent.GetDocPosType())
		{
			State.Pos      = HdrFtrContent.GetContentPosition(false, false, undefined);
			State.StartPos = HdrFtrContent.GetContentPosition(true, true, undefined);
			State.EndPos   = HdrFtrContent.GetContentPosition(true, false, undefined);
		}
		else if (docpostype_DrawingObjects === HdrFtrContent.GetDocPosType())
		{
			this.LogicDocument.DrawingObjects.Save_DocumentStateBeforeLoadChanges(State);
		}
	}
};
CHdrFtrController.prototype.RestoreDocumentStateAfterLoadChanges = function(State)
{
	var HdrFtr = State.HdrFtr;
	if (null !== HdrFtr && undefined !== HdrFtr && true === HdrFtr.Is_UseInDocument())
	{
		this.HdrFtr.Set_CurHdrFtr(HdrFtr);
		var HdrFtrContent = HdrFtr.Get_DocumentContent();
		if (docpostype_Content === State.HdrFtrDocPosType)
		{
			HdrFtrContent.SetDocPosType(docpostype_Content);
			HdrFtrContent.Selection.Use = State.HdrFtrSelection;
			if (true === HdrFtrContent.Selection.Use)
			{
				HdrFtrContent.SetContentPosition(State.StartPos, 0, 0);
				HdrFtrContent.SetContentSelection(State.StartPos, State.EndPos, 0, 0, 0);
			}
			else
			{
				HdrFtrContent.SetContentPosition(State.Pos, 0, 0);
				this.LogicDocument.NeedUpdateTarget = true;
			}
		}
		else if (docpostype_DrawingObjects === State.HdrFtrDocPosType)
		{
			HdrFtrContent.SetDocPosType(docpostype_DrawingObjects);

			if (true !== this.LogicDocument.DrawingObjects.Load_DocumentStateAfterLoadChanges(State))
			{
				HdrFtrContent.SetDocPosType(docpostype_Content);
				HdrFtrContent.MoveCursorToStartPos();
			}
		}
	}
	else
	{
		this.LogicDocument.EndHdrFtrEditing(false);
	}
};
CHdrFtrController.prototype.GetColumnSize = function()
{
	var CurHdrFtr = this.HdrFtr.CurHdrFtr;
	if (null !== CurHdrFtr && -1 !== CurHdrFtr.RecalcInfo.CurPage)
	{
		var oPage   = this.LogicDocument.Pages[CurHdrFtr.RecalcInfo.CurPage];
		var oSectPr = this.LogicDocument.Get_SectPr(oPage.Pos);

		return {
			W : oSectPr.GetContentFrameWidth(),
			H : oSectPr.GetContentFrameHeight()
		};
	}

	return {
		W : 0,
		H : 0
	};
};
CHdrFtrController.prototype.GetCurrentSectionPr = function()
{
	return null;
};
CHdrFtrController.prototype.RemoveTextSelection = function()
{
	var CurHdrFtr = this.HdrFtr.CurHdrFtr;
	if (null != CurHdrFtr)
		return CurHdrFtr.Content.RemoveTextSelection();
};
CHdrFtrController.prototype.AddContentControl = function(nContentControlType)
{
	var CurHdrFtr = this.HdrFtr.CurHdrFtr;
	if (null != CurHdrFtr)
		return CurHdrFtr.Content.AddContentControl(nContentControlType);

	return null;
};
CHdrFtrController.prototype.GetStyleFromFormatting = function()
{
	return this.HdrFtr.GetStyleFromFormatting();
};
CHdrFtrController.prototype.GetSimilarNumbering = function(oEngine)
{
	this.HdrFtr.GetSimilarNumbering(oEngine)
};
CHdrFtrController.prototype.GetPlaceHolderObject = function()
{
	return this.HdrFtr.GetPlaceHolderObject();
};
CHdrFtrController.prototype.GetAllFields = function(isUseSelection, arrFields)
{
	// Поиск по всем колонтитулам должен происходить не здесь
	if (!isUseSelection)
		return arrFields ? arrFields : [];

	return this.HdrFtr.GetAllFields(isUseSelection, arrFields);
};
CHdrFtrController.prototype.IsTableCellSelection = function()
{
	return this.HdrFtr.IsTableCellSelection();
};
CHdrFtrController.prototype.IsSelectionLocked = function(CheckType)
{
	this.HdrFtr.Document_Is_SelectionLocked(CheckType);
};
