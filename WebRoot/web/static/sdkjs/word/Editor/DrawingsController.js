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
 * Специальный класс-обработчик команд в автофигурах
 * @param {CDocument} LogicDocument - Ссылка на главный документ.
 * @param {CDrawingsObjects} DrawingsObjects - ССылка на объект, работающий с автофигурами
 * @constructor
 * @extends {CDocumentControllerBase}
 */
function CDrawingsController(LogicDocument, DrawingsObjects)
{
	CDocumentControllerBase.call(this, LogicDocument);

	this.DrawingObjects = DrawingsObjects;
}
CDrawingsController.prototype = Object.create(CDocumentControllerBase.prototype);
CDrawingsController.prototype.constructor = CDrawingsController;

/**
 * Получаем контент контрол, внутри которого лежит текущая автофигура
 * @returns {CInlineLevelSdt|CBlockLevelSdt}
 */
CDrawingsController.prototype.private_GetParentContentControl = function()
{
	var oDrawing = this.DrawingObjects.getMajorParaDrawing();
	if (oDrawing)
	{
		var oRun = oDrawing.GetRun();
		if (oRun)
		{
			var arrDocPos = oRun.GetDocumentPositionFromObject();
			for (var nIndex = arrDocPos.length - 1; nIndex >= 0; --nIndex)
			{
				var oClass = arrDocPos[nIndex].Class;
				if (oClass instanceof CDocumentContent && oClass.Parent instanceof CBlockLevelSdt)
				{
					return oClass.Parent;
				}
				else if (oClass instanceof CInlineLevelSdt)
				{
					return oClass;
				}
			}
		}
	}

	return null;
};
CDrawingsController.prototype.CanUpdateTarget = function()
{
	return true;
};
CDrawingsController.prototype.RecalculateCurPos = function(bUpdateX, bUpdateY)
{
	return this.DrawingObjects.recalculateCurPos(bUpdateX, bUpdateY);
};
CDrawingsController.prototype.GetCurPage = function()
{
	var ParaDrawing = this.DrawingObjects.getMajorParaDrawing();
	if (null !== ParaDrawing)
		return ParaDrawing.PageNum;

	return -1;
};
CDrawingsController.prototype.AddNewParagraph = function(bRecalculate, bForceAdd)
{
	return this.DrawingObjects.addNewParagraph(bRecalculate, bForceAdd);
};
CDrawingsController.prototype.AddInlineImage = function(nW, nH, oImage, oChart, bFlow)
{
	return this.DrawingObjects.addInlineImage(nW, nH, oImage, oChart, bFlow);
};
CDrawingsController.prototype.AddImages = function(aImages)
{
	return this.DrawingObjects.addImages(aImages);
};
CDrawingsController.prototype.AddSignatureLine = function(oSignatureDrawing)
{
	return this.DrawingObjects.addSignatureLine(oSignatureDrawing);
};
CDrawingsController.prototype.AddOleObject = function(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId)
{
	this.DrawingObjects.addOleObject(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId);
};
CDrawingsController.prototype.AddTextArt = function(nStyle)
{
	var ParaDrawing = this.DrawingObjects.getMajorParaDrawing();
	if (ParaDrawing)
	{
		ParaDrawing.GoTo_Text(undefined, false);
		this.LogicDocument.AddTextArt(nStyle);
	}
};
CDrawingsController.prototype.EditChart = function(Chart)
{
	this.DrawingObjects.editChart(Chart);
};
CDrawingsController.prototype.AddInlineTable = function(nCols, nRows, nMode)
{
	return this.DrawingObjects.addInlineTable(nCols, nRows, nMode);
};
CDrawingsController.prototype.ClearParagraphFormatting = function(isClearParaPr, isClearTextPr)
{
	this.DrawingObjects.paragraphClearFormatting(isClearParaPr, isClearTextPr);
};
CDrawingsController.prototype.AddToParagraph = function(oItem, bRecalculate)
{
	if (para_NewLine === oItem.Type && true === oItem.IsPageOrColumnBreak())
		return;

	this.DrawingObjects.paragraphAdd(oItem, bRecalculate);
	this.LogicDocument.Document_UpdateSelectionState();
	this.LogicDocument.Document_UpdateUndoRedoState();
	this.LogicDocument.Document_UpdateInterfaceState();
};
CDrawingsController.prototype.Remove = function(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord)
{
	return this.DrawingObjects.remove(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord);
};
CDrawingsController.prototype.GetCursorPosXY = function()
{
	return this.DrawingObjects.cursorGetPos();
};
CDrawingsController.prototype.MoveCursorToStartPos = function(AddToSelect)
{
	if (true === AddToSelect)
	{
		// TODO: Пока ничего не делаем, в дальнейшем надо будет делать в зависимости от селекта внутри
		//       автофигуры: если селект текста внутри, то делать для текста внутри, а если выделена
		//       сама автофигура, тогда мы перемещаем курсор влево от нее в контенте параграфа и выделяем все до конца
	}
	else
	{
		this.LogicDocument.controller_MoveCursorToStartPos(false);
	}
};
CDrawingsController.prototype.MoveCursorToEndPos = function(AddToSelect)
{
	if (true === AddToSelect)
	{
		// TODO: Пока ничего не делаем, в дальнейшем надо будет делать в зависимости от селекта внутри
		//       автофигуры: если селект текста внутри, то делать для текста внутри, а если выделена
		//       сама автофигура, тогда мы перемещаем курсор влево от нее в контенте параграфа и выделяем все до конца
	}
	else
	{
		this.LogicDocument.controller_MoveCursorToEndPos(false);
	}
};
CDrawingsController.prototype.MoveCursorLeft = function(AddToSelect, Word)
{
	// Заглушка от передвижения автофигур внутри больщих таблиц
	if (!this.LogicDocument.Pages[this.LogicDocument.CurPage])
		return true;

	return this.DrawingObjects.cursorMoveLeft(AddToSelect, Word);
};
CDrawingsController.prototype.MoveCursorRight = function(AddToSelect, Word, FromPaste)
{
	// Заглушка от передвижения автофигур внутри больщих таблиц
	if (!this.LogicDocument.Pages[this.LogicDocument.CurPage])
		return true;

	return this.DrawingObjects.cursorMoveRight(AddToSelect, Word, FromPaste);
};
CDrawingsController.prototype.MoveCursorUp = function(AddToSelect, CtrlKey)
{
	// Заглушка от передвижения автофигур внутри больщих таблиц
	if (!this.LogicDocument.Pages[this.LogicDocument.CurPage])
		return true;

	var RetValue = this.DrawingObjects.cursorMoveUp(AddToSelect, CtrlKey);
	this.LogicDocument.Document_UpdateInterfaceState();
	this.LogicDocument.Document_UpdateSelectionState();
	return RetValue;
};
CDrawingsController.prototype.MoveCursorDown = function(AddToSelect, CtrlKey)
{
	// Заглушка от передвижения автофигур внутри больщих таблиц
	if (!this.LogicDocument.Pages[this.LogicDocument.CurPage])
		return true;

	var RetValue = this.DrawingObjects.cursorMoveDown(AddToSelect, CtrlKey);
	this.LogicDocument.Document_UpdateInterfaceState();
	this.LogicDocument.Document_UpdateSelectionState();
	return RetValue;
};
CDrawingsController.prototype.MoveCursorToEndOfLine = function(AddToSelect)
{
	return this.DrawingObjects.cursorMoveEndOfLine(AddToSelect);
};
CDrawingsController.prototype.MoveCursorToStartOfLine = function(AddToSelect)
{
	return this.DrawingObjects.cursorMoveStartOfLine(AddToSelect);
};
CDrawingsController.prototype.MoveCursorToXY = function(X, Y, PageAbs, AddToSelect)
{
	return this.DrawingObjects.cursorMoveAt(X, Y, AddToSelect);
};
CDrawingsController.prototype.MoveCursorToCell = function(bNext)
{
	return this.DrawingObjects.cursorMoveToCell(bNext);
};
CDrawingsController.prototype.SetParagraphAlign = function(Align)
{
	if (true != this.DrawingObjects.isSelectedText())
	{
		var ParaDrawing = this.DrawingObjects.getMajorParaDrawing();
		if (null != ParaDrawing)
		{
			var Paragraph = ParaDrawing.Parent;
			Paragraph.Set_Align(Align);
		}
	}
	else
	{
		this.DrawingObjects.setParagraphAlign(Align);
	}
};
CDrawingsController.prototype.SetParagraphSpacing = function (Spacing)
{
	if (true != this.DrawingObjects.isSelectedText())
	{
		var ParaDrawing = this.DrawingObjects.getMajorParaDrawing();
		if (null != ParaDrawing)
		{
			var Paragraph = ParaDrawing.Parent;
			Paragraph.Set_Spacing(Spacing, false);
			this.LogicDocument.Recalculate();
		}
	}
	else
	{
		this.DrawingObjects.setParagraphSpacing(Spacing);
	}
};
CDrawingsController.prototype.SetParagraphTabs = function(Tabs)
{
	this.DrawingObjects.setParagraphTabs(Tabs);
};
CDrawingsController.prototype.SetParagraphIndent = function(Ind)
{
	this.DrawingObjects.setParagraphIndent(Ind);
};
CDrawingsController.prototype.SetParagraphShd = function(Shd)
{
	this.DrawingObjects.setParagraphShd(Shd);
};
CDrawingsController.prototype.SetParagraphStyle = function(Name)
{
	this.DrawingObjects.setParagraphStyle(Name);
};
CDrawingsController.prototype.SetParagraphContextualSpacing = function(Value)
{
	this.DrawingObjects.setParagraphContextualSpacing(Value);
};
CDrawingsController.prototype.SetParagraphPageBreakBefore = function(Value)
{
	this.DrawingObjects.setParagraphPageBreakBefore(Value);
};
CDrawingsController.prototype.SetParagraphKeepLines = function(Value)
{
	this.DrawingObjects.setParagraphKeepLines(Value);
};
CDrawingsController.prototype.SetParagraphKeepNext = function(Value)
{
	this.DrawingObjects.setParagraphKeepNext(Value);
};
CDrawingsController.prototype.SetParagraphWidowControl = function(Value)
{
	this.DrawingObjects.setParagraphWidowControl(Value);
};
CDrawingsController.prototype.SetParagraphBorders = function(Borders)
{
	this.DrawingObjects.setParagraphBorders(Borders);
};
CDrawingsController.prototype.SetParagraphFramePr = function(FramePr, bDelete)
{
	// Не добавляем и не работаем с рамками в автофигурах
};
CDrawingsController.prototype.IncreaseDecreaseFontSize = function(bIncrease)
{
	this.DrawingObjects.paragraphIncDecFontSize(bIncrease);
};
CDrawingsController.prototype.IncreaseDecreaseIndent = function(bIncrease)
{
	if (true != this.DrawingObjects.isSelectedText())
	{
		var ParaDrawing = this.DrawingObjects.getMajorParaDrawing();
		if (null != ParaDrawing)
		{
			var Paragraph = ParaDrawing.Parent;
			Paragraph.IncreaseDecreaseIndent(bIncrease);
		}
	}
	else
	{
		this.DrawingObjects.paragraphIncDecIndent(bIncrease);
	}
};
CDrawingsController.prototype.SetImageProps = function(Props)
{
	this.DrawingObjects.setProps(Props);
};
CDrawingsController.prototype.SetTableProps = function(Props)
{
	this.DrawingObjects.setTableProps(Props);
};
CDrawingsController.prototype.GetCalculatedParaPr = function()
{
	return this.DrawingObjects.getParagraphParaPr();
};
CDrawingsController.prototype.GetCalculatedTextPr = function()
{
	return this.DrawingObjects.getParagraphTextPr();
};
CDrawingsController.prototype.GetDirectParaPr = function()
{
	return this.DrawingObjects.getParagraphParaPrCopy();
};
CDrawingsController.prototype.GetDirectTextPr = function()
{
	return this.DrawingObjects.getParagraphTextPrCopy();
};
CDrawingsController.prototype.RemoveSelection = function(bNoCheckDrawing)
{
	var ParaDrawing = this.DrawingObjects.getMajorParaDrawing();
	if (ParaDrawing)
	{
		ParaDrawing.GoTo_Text(undefined, false);
	}
	return this.DrawingObjects.resetSelection(undefined, bNoCheckDrawing);
};
CDrawingsController.prototype.IsSelectionEmpty = function(bCheckHidden)
{
	return false;
};
CDrawingsController.prototype.DrawSelectionOnPage = function(PageAbs)
{
	this.DrawingDocument.SetTextSelectionOutline(true);
	this.DrawingObjects.drawSelectionPage(PageAbs);
};
CDrawingsController.prototype.GetSelectionBounds = function()
{
	return this.DrawingObjects.GetSelectionBounds();
};
CDrawingsController.prototype.IsMovingTableBorder = function()
{
	return this.DrawingObjects.selectionIsTableBorder();
};
CDrawingsController.prototype.CheckPosInSelection = function(X, Y, PageAbs, NearPos)
{
	return this.DrawingObjects.selectionCheck(X, Y, PageAbs, NearPos);
};
CDrawingsController.prototype.SelectAll = function()
{
	this.DrawingObjects.selectAll();
};
CDrawingsController.prototype.GetSelectedContent = function(SelectedContent)
{
	this.DrawingObjects.GetSelectedContent(SelectedContent);
};
CDrawingsController.prototype.UpdateCursorType = function(X, Y, PageAbs, MouseEvent)
{
	// TODO: Надо вызывать не у LogicDocument, а у DocumentContent заданного
	this.LogicDocument.controller_UpdateCursorType(X, Y, PageAbs, MouseEvent);
};
CDrawingsController.prototype.PasteFormatting = function(TextPr, ParaPr)
{
	this.DrawingObjects.paragraphFormatPaste(TextPr, ParaPr, false);
};
CDrawingsController.prototype.IsSelectionUse = function()
{
	return this.DrawingObjects.isSelectionUse();
};
CDrawingsController.prototype.IsNumberingSelection = function()
{
	var oTargetDocContent = this.DrawingObjects.getTargetDocContent();
	if (oTargetDocContent && oTargetDocContent.IsNumberingSelection)
		return  oTargetDocContent.IsNumberingSelection();

	return false;
};
CDrawingsController.prototype.IsTextSelectionUse = function()
{
	return this.DrawingObjects.isTextSelectionUse();
};
CDrawingsController.prototype.GetCurPosXY = function()
{
	return this.DrawingObjects.getCurPosXY();
};
CDrawingsController.prototype.GetSelectedText = function(bClearText, oPr)
{
	return this.DrawingObjects.getSelectedText(bClearText, oPr);
};
CDrawingsController.prototype.GetCurrentParagraph = function(bIgnoreSelection, arrSelectedParagraphs, oPr)
{
	return this.DrawingObjects.getCurrentParagraph(bIgnoreSelection, arrSelectedParagraphs, oPr);
};
CDrawingsController.prototype.GetSelectedElementsInfo = function(oInfo)
{
	var oContentControl = this.private_GetParentContentControl();
	if (oContentControl)
	{
		if (oContentControl.IsBlockLevel())
		{
			oInfo.SetBlockLevelSdt(oContentControl);
		}
		else if (oContentControl.IsInlineLevel())
		{
			oInfo.SetInlineLevelSdt(oContentControl);
		}
	}

	this.DrawingObjects.getSelectedElementsInfo(oInfo);
};
CDrawingsController.prototype.AddTableRow = function(bBefore)
{
	this.DrawingObjects.tableAddRow(bBefore);
};
CDrawingsController.prototype.AddTableColumn = function(bBefore)
{
	this.DrawingObjects.tableAddCol(bBefore);
};
CDrawingsController.prototype.RemoveTableRow = function()
{
	this.DrawingObjects.tableRemoveRow();
};
CDrawingsController.prototype.RemoveTableColumn = function()
{
	this.DrawingObjects.tableRemoveCol();
};
CDrawingsController.prototype.MergeTableCells = function()
{
	this.DrawingObjects.tableMergeCells();
};
CDrawingsController.prototype.SplitTableCells = function(Cols, Rows)
{
	this.DrawingObjects.tableSplitCell(Cols, Rows);
};
CDrawingsController.prototype.RemoveTableCells = function()
{
	this.DrawingObjects.tableRemoveCells();
};
CDrawingsController.prototype.RemoveTable = function()
{
	this.DrawingObjects.tableRemoveTable();
};
CDrawingsController.prototype.SelectTable = function(Type)
{
	this.DrawingObjects.tableSelect(Type);
};
CDrawingsController.prototype.CanMergeTableCells = function()
{
	return this.DrawingObjects.tableCheckMerge();
};
CDrawingsController.prototype.CanSplitTableCells = function()
{
	return this.DrawingObjects.tableCheckSplit();
};
CDrawingsController.prototype.DistributeTableCells = function(isHorizontally)
{
	return this.DrawingObjects.distributeTableCells(isHorizontally);
};
CDrawingsController.prototype.UpdateInterfaceState = function()
{
	var oTargetTextObject = AscFormat.getTargetTextObject(this.DrawingObjects);
	if (oTargetTextObject)
	{
		this.LogicDocument.Interface_Update_DrawingPr();
		this.DrawingObjects.documentUpdateInterfaceState();
	}
	else
	{
		this.DrawingObjects.resetInterfaceTextPr();
		this.DrawingObjects.updateTextPr();
		this.LogicDocument.Interface_Update_DrawingPr();
		this.DrawingObjects.updateParentParagraphParaPr();
	}
};
CDrawingsController.prototype.UpdateRulersState = function()
{
	// Вызываем данную функцию, чтобы убрать рамку буквицы
	this.DrawingDocument.Set_RulerState_Paragraph(null);
	this.LogicDocument.Document_UpdateRulersStateBySection(this.LogicDocument.CurPos.ContentPos);
	this.DrawingObjects.documentUpdateRulersState();
};
CDrawingsController.prototype.UpdateSelectionState = function()
{
	this.DrawingObjects.documentUpdateSelectionState();
	this.LogicDocument.UpdateTracks();
};
CDrawingsController.prototype.GetSelectionState = function()
{
	return this.DrawingObjects.getSelectionState();
};
CDrawingsController.prototype.SetSelectionState = function(State, StateIndex)
{
	this.DrawingObjects.setSelectionState(State, StateIndex);
};
CDrawingsController.prototype.AddHyperlink = function(Props)
{
	this.DrawingObjects.hyperlinkAdd(Props);
};
CDrawingsController.prototype.ModifyHyperlink = function(Props)
{
	this.DrawingObjects.hyperlinkModify(Props);
};
CDrawingsController.prototype.RemoveHyperlink = function()
{
	this.DrawingObjects.hyperlinkRemove();
};
CDrawingsController.prototype.CanAddHyperlink = function(bCheckInHyperlink)
{
	return this.DrawingObjects.hyperlinkCanAdd(bCheckInHyperlink);
};
CDrawingsController.prototype.IsCursorInHyperlink = function(bCheckEnd)
{
	return this.DrawingObjects.hyperlinkCheck(bCheckEnd);
};
CDrawingsController.prototype.AddComment = function(Comment)
{
	if (true !== this.DrawingObjects.isSelectedText())
	{
		var ParaDrawing = this.DrawingObjects.getMajorParaDrawing();
		if (null != ParaDrawing)
		{
			var Paragraph = ParaDrawing.Parent;
			Paragraph.AddCommentToObject(Comment, ParaDrawing.Get_Id());
		}
	}
	else
	{
		this.DrawingObjects.addComment(Comment);
	}
};
CDrawingsController.prototype.CanAddComment = function()
{
	// TODO: Как будет реализовано добавление комментариев к объекту, возвращать тут true
	if (true != this.DrawingObjects.isSelectedText())
		return false;
	else
		return this.DrawingObjects.canAddComment();
};
CDrawingsController.prototype.GetSelectionAnchorPos = function()
{
	var ParaDrawing = this.DrawingObjects.getMajorParaDrawing();
	return {
		X0   : ParaDrawing.GraphicObj.x,
		Y    : ParaDrawing.GraphicObj.y,
		X1   : ParaDrawing.GraphicObj.x + ParaDrawing.GraphicObj.extX,
		Page : ParaDrawing.PageNum
	};
};
CDrawingsController.prototype.StartSelectionFromCurPos = function()
{
	this.DrawingObjects.startSelectionFromCurPos();
};
CDrawingsController.prototype.SaveDocumentStateBeforeLoadChanges = function(State)
{
	this.DrawingObjects.Save_DocumentStateBeforeLoadChanges(State);
};
CDrawingsController.prototype.RestoreDocumentStateAfterLoadChanges = function(State)
{
	if (true !== this.DrawingObjects.Load_DocumentStateAfterLoadChanges(State))
	{
		var LogicDocument = this.LogicDocument;
		LogicDocument.SetDocPosType(docpostype_Content);

		var ContentPos = 0;
		if (LogicDocument.Pages[LogicDocument.CurPage])
			ContentPos = LogicDocument.Pages[LogicDocument.CurPage].Pos + 1;
		else
			ContentPos = 0;

		ContentPos = Math.max(0, Math.min(LogicDocument.Content.length - 1, ContentPos));
		LogicDocument.CurPos.ContentPos = ContentPos;
		LogicDocument.Content[ContentPos].MoveCursorToStartPos(false);
	}
};
CDrawingsController.prototype.GetColumnSize = function()
{
	// TODO: Переделать
	var _w = Math.max(1, AscCommon.Page_Width - (AscCommon.X_Left_Margin + AscCommon.X_Right_Margin));
	var _h = Math.max(1, AscCommon.Page_Height - (AscCommon.Y_Top_Margin + AscCommon.Y_Bottom_Margin));

	return {
		W : AscCommon.Page_Width - (AscCommon.X_Left_Margin + AscCommon.X_Right_Margin),
		H : AscCommon.Page_Height - (AscCommon.Y_Top_Margin + AscCommon.Y_Bottom_Margin)
	};
};
CDrawingsController.prototype.GetCurrentSectionPr = function()
{
	return null;
};
CDrawingsController.prototype.RemoveTextSelection = function()
{
	this.DrawingObjects.removeTextSelection();
};
CDrawingsController.prototype.AddContentControl = function(nContentControlType)
{
	return this.DrawingObjects.AddContentControl(nContentControlType);
};
CDrawingsController.prototype.GetStyleFromFormatting = function()
{
	return this.DrawingObjects.GetStyleFromFormatting();
};
CDrawingsController.prototype.GetSimilarNumbering = function(oEngine)
{
	var oDocContent = this.DrawingObjects.getTargetDocContent();

	if (oDocContent && oDocContent.GetSimilarNumbering)
		oDocContent.GetSimilarNumbering(oEngine);
};
CDrawingsController.prototype.GetAllFields = function(isUseSelection, arrFields)
{
	return this.DrawingObjects.GetAllFields(isUseSelection, arrFields);
};
CDrawingsController.prototype.IsTableCellSelection = function()
{
	var oTargetDocContent = this.DrawingObjects.getTargetDocContent();
	if (oTargetDocContent && oTargetDocContent.IsTableCellSelection)
		return oTargetDocContent.IsTableCellSelection();

	return false;
};
CDrawingsController.prototype.IsSelectionLocked = function(nCheckType)
{
	this.DrawingObjects.documentIsSelectionLocked(nCheckType);

	var oContentControl = this.private_GetParentContentControl();
	if (oContentControl)
		oContentControl.Document_Is_SelectionLocked(nCheckType);
};
