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
  
// Import
var g_oTableId = AscCommon.g_oTableId;
var g_oTextMeasurer = AscCommon.g_oTextMeasurer;
var History = AscCommon.History;

var c_oAscShdNil = Asc.c_oAscShdNil;

var c_oAscRevisionsChangeType = Asc.c_oAscRevisionsChangeType;

var reviewtype_Common = 0x00;
var reviewtype_Remove = 0x01;
var reviewtype_Add    = 0x02;

function CSpellCheckerMarks()
{
	this.len = 0;
	this.data = null;

	this.Check = function(len)
	{
		if (len <= this.len)
		{
			for (var i = 0; i < len; i++)
				this.data[i] = 0;
			return this.data;
		}

		this.len = len;
		this.data = typeof(Int8Array) !== undefined ? new Int8Array(this.len) : new Array(this.len);
		return this.data;
	};
}
var g_oSpellCheckerMarks = new CSpellCheckerMarks();

/**
 *
 * @param Paragraph
 * @param bMathRun
 * @constructor
 * @extends {CParagraphContentWithContentBase}
 */
function ParaRun(Paragraph, bMathRun)
{
	CParagraphContentWithContentBase.call(this);

	this.Id        = AscCommon.g_oIdCounter.Get_NewId();  // Id данного элемента
	this.Type      = para_Run;                  // тип данного элемента
	this.Paragraph = Paragraph;                 // Ссылка на параграф
	this.Pr        = new CTextPr();             // Текстовые настройки данного run
	this.Content   = [];                        // Содержимое данного run

	this.State      = new CParaRunState();       // Положение курсора и селекта в данного run
	this.Selection  = this.State.Selection;
	this.CompiledPr = new CTextPr();             // Скомпилированные настройки
	this.RecalcInfo = new CParaRunRecalcInfo();  // Флаги для пересчета (там же флаг пересчета стиля)

	this.TextAscent  = 0; // текстовый ascent + linegap
	this.TextAscent  = 0; // текстовый ascent + linegap
	this.TextDescent = 0; // текстовый descent
	this.TextHeight  = 0; // высота текста
	this.TextAscent2 = 0; // текстовый ascent
	this.Ascent      = 0; // общий ascent
	this.Descent     = 0; // общий descent
	this.YOffset     = 0; // смещение по Y

	this.CollPrChangeMine   = false;
	this.CollPrChangeOther  = false;
	this.CollaborativeMarks = new CRunCollaborativeMarks();
	this.m_oContentChanges  = new AscCommon.CContentChanges(); // список изменений(добавление/удаление элементов)

	this.NearPosArray  = [];
	this.SearchMarks   = [];
	this.SpellingMarks = [];

	this.ReviewType = reviewtype_Common;
	this.ReviewInfo = new CReviewInfo();

	if (editor
		&& !editor.isPresentationEditor
		&& editor.WordControl
		&& editor.WordControl.m_oLogicDocument
		&& true === editor.WordControl.m_oLogicDocument.IsTrackRevisions()
		&& !editor.WordControl.m_oLogicDocument.RecalcTableHeader
		&& !editor.WordControl.m_oLogicDocument.MoveDrawing
		&& !(this.Paragraph && !this.Paragraph.bFromDocument))
	{
		this.ReviewType = reviewtype_Add;
		this.ReviewInfo.Update();
	}

	if (bMathRun)
	{
		this.Type = para_Math_Run;

		// запомним позицию для Recalculate_CurPos, когда  Run пустой
		this.pos      = new CMathPosition();
		this.ParaMath = null;
		this.Parent   = null;
		this.ArgSize  = 0;
		this.size     = new CMathSize();
		this.MathPrp  = new CMPrp();
		this.bEqArray = false;
	}

	this.StartState = null;

	this.CompositeInput = null;

	// Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
	g_oTableId.Add(this, this.Id);
	if (this.Paragraph && !this.Paragraph.bFromDocument)
	{
		this.Save_StartState();
	}
}

ParaRun.prototype = Object.create(CParagraphContentWithContentBase.prototype);
ParaRun.prototype.constructor = ParaRun;

ParaRun.prototype.Get_Type = function()
{
    return this.Type;
};
//-----------------------------------------------------------------------------------
// Функции для работы с Id
//-----------------------------------------------------------------------------------
ParaRun.prototype.Get_Id = function()
{
    return this.Id;
};
ParaRun.prototype.GetId = function()
{
	return this.Id;
};
ParaRun.prototype.Set_ParaMath = function(ParaMath, Parent)
{
    this.ParaMath = ParaMath;
    this.Parent   = Parent;

    for(var i = 0; i < this.Content.length; i++)
    {
        this.Content[i].relate(this);
    }
};
ParaRun.prototype.Save_StartState = function()
{
    this.StartState = new CParaRunStartState(this);
};
//-----------------------------------------------------------------------------------
// Функции для работы с содержимым данного рана
//-----------------------------------------------------------------------------------
ParaRun.prototype.Copy = function(Selected, oPr)
{
	if (!oPr)
		oPr = {};

	var isCopyReviewPr = oPr.CopyReviewPr;

    var bMath = this.Type == para_Math_Run ? true : false;

    var NewRun = new ParaRun(this.Paragraph, bMath);

	NewRun.Set_Pr(this.Pr.Copy(undefined, oPr));

    var oLogicDocument = this.GetLogicDocument();
	if(oPr && oPr.Comparison)
	{
		oPr.Comparison.updateReviewInfo(NewRun, reviewtype_Add);
	}
    else if (true === isCopyReviewPr || (oLogicDocument && (oLogicDocument.RecalcTableHeader || oLogicDocument.MoveDrawing)))
	{
		var nReviewType = this.GetReviewType();
		var oReviewInfo = this.GetReviewInfo().Copy();
		if (!(oLogicDocument && (oLogicDocument.RecalcTableHeader || oLogicDocument.MoveDrawing)))
			oReviewInfo.SetMove(Asc.c_oAscRevisionsMove.NoMove);

		NewRun.SetReviewTypeWithInfo(nReviewType, oReviewInfo);
	}
    else if (oLogicDocument && true === oLogicDocument.IsTrackRevisions())
	{
		NewRun.SetReviewType(reviewtype_Add);
	}

    if(true === bMath)
        NewRun.Set_MathPr(this.MathPrp.Copy());





    var StartPos = 0;
    var EndPos   = this.Content.length;

    if (true === Selected && true === this.State.Selection.Use)
    {
        StartPos = this.State.Selection.StartPos;
        EndPos   = this.State.Selection.EndPos;

        if (StartPos > EndPos)
        {
            StartPos = this.State.Selection.EndPos;
            EndPos   = this.State.Selection.StartPos;
        }
    }
    else if (true === Selected && true !== this.State.Selection.Use)
	{
		EndPos = -1;
	}

	var CurPos, AddedPos, Item;

	if(oPr && oPr.Comparison)
	{
		var aCopyContent = [];
		for (CurPos = StartPos; CurPos < EndPos; CurPos++)
		{
			Item = this.Content[CurPos];

			if (para_NewLine === Item.Type
				&& oPr
				&& ((oPr.SkipLineBreak && Item.IsLineBreak())
				|| (oPr.SkipPageBreak && Item.IsPageBreak())
				|| (oPr.SkipColumnBreak && Item.IsColumnBreak())))
			{
				if (oPr.Paragraph && true !== oPr.Paragraph.IsEmpty())
				{
					aCopyContent.push( new ParaSpace());
				}
			}
			else
			{
				// TODO: Как только перенесем para_End в сам параграф (как и нумерацию) убрать здесь
				if (para_End !== Item.Type
					&& para_RevisionMove !== Item.Type
					&& (para_Drawing !== Item.Type || Item.Is_Inline() || true !== oPr.SkipAnchors)
					&& (para_FootnoteReference !== Item.Type || true !== oPr.SkipFootnoteReference)
					&& ((para_FieldChar !== Item.Type && para_InstrText !== Item.Type) || true !== oPr.SkipComplexFields))
				{
					aCopyContent.push(Item.Copy(oPr));
				}
			}
		}
		NewRun.ConcatToContent(aCopyContent);
	}
	else
	{
		for (CurPos = StartPos, AddedPos = 0; CurPos < EndPos; CurPos++)
		{
			Item = this.Content[CurPos];

			if (para_NewLine === Item.Type
				&& oPr
				&& ((oPr.SkipLineBreak && Item.IsLineBreak())
				|| (oPr.SkipPageBreak && Item.IsPageBreak())
				|| (oPr.SkipColumnBreak && Item.IsColumnBreak())))
			{
				if (oPr.Paragraph && true !== oPr.Paragraph.IsEmpty())
				{
					NewRun.Add_ToContent(AddedPos, new ParaSpace(), false);
					AddedPos++;
				}
			}
			else
			{
				// TODO: Как только перенесем para_End в сам параграф (как и нумерацию) убрать здесь
				if (para_End !== Item.Type
					&& para_RevisionMove !== Item.Type
					&& (para_Drawing !== Item.Type || Item.Is_Inline() || true !== oPr.SkipAnchors)
					&& (para_FootnoteReference !== Item.Type || true !== oPr.SkipFootnoteReference)
					&& ((para_FieldChar !== Item.Type && para_InstrText !== Item.Type) || true !== oPr.SkipComplexFields))
				{
					NewRun.Add_ToContent(AddedPos, Item.Copy(oPr), false);
					AddedPos++;
				}
			}
		}
	}

    return NewRun;
};

ParaRun.prototype.Copy2 = function(oPr)
{
    var NewRun = new ParaRun(this.Paragraph);

    NewRun.Set_Pr( this.Pr.Copy(undefined, oPr) );
	if(oPr && oPr.Comparison)
	{
		oPr.Comparison.updateReviewInfo(NewRun, reviewtype_Add);
	}
    var StartPos = 0;
    var EndPos   = this.Content.length;
	var CurPos;
	if(oPr && oPr.Comparison)
	{
		var aContentToInsert = [];
		for (CurPos = StartPos; CurPos < EndPos; CurPos++ )
		{
			aContentToInsert.push(this.Content[CurPos].Copy(oPr));
		}
		NewRun.ConcatToContent(aContentToInsert);
	}
	else
	{
		for (CurPos = StartPos; CurPos < EndPos; CurPos++ )
		{
			var Item = this.Content[CurPos];
			NewRun.Add_ToContent( CurPos - StartPos, Item.Copy(oPr), false );
		}
	}
    return NewRun;
};

ParaRun.prototype.CopyContent = function(Selected)
{
    return [this.Copy(Selected, {CopyReviewPr : true})];
};
ParaRun.prototype.GetSelectedContent = function(oSelectedContent)
{
	if (oSelectedContent.IsTrackRevisions())
	{
		var nReviewType = this.GetReviewType();
		var oReviewInfo = this.GetReviewInfo();

		if (reviewtype_Add === nReviewType || reviewtype_Common === nReviewType)
		{
			var oRun = this.Copy(true, {CopyReviewPr : false});

			if (reviewtype_Common !== nReviewType && (oReviewInfo.IsMovedTo() || oReviewInfo.IsMovedFrom()))
				oSelectedContent.SetMovedParts(true);

			if (oSelectedContent.IsMoveTrack())
				oSelectedContent.AddRunForMoveTrack(oRun);


			for (var nPos = 0, nCount = oRun.Content.length; nPos < nCount; ++nPos)
			{
				if (oRun.Content[nPos].Type === para_RevisionMove)
				{
					oRun.RemoveFromContent(nPos, 1);
					nPos--;
					nCount--;

					oSelectedContent.SetMovedParts(true);
				}
			}

			return oRun;
		}
	}
	else
	{
		return this.Copy(true, {CopyReviewPr : true});
	}

	return null;
};

ParaRun.prototype.GetAllDrawingObjects = function(arrDrawingObjects)
{
	if (!arrDrawingObjects)
		arrDrawingObjects = [];

	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		var oItem = this.Content[nPos];
		if (para_Drawing === oItem.Type)
		{
			arrDrawingObjects.push(oItem);
			oItem.GetAllDrawingObjects(arrDrawingObjects);
		}
	}

	return arrDrawingObjects;
};

ParaRun.prototype.Clear_ContentChanges = function()
{
    this.m_oContentChanges.Clear();
};

ParaRun.prototype.Add_ContentChanges = function(Changes)
{
    this.m_oContentChanges.Add( Changes );
};

ParaRun.prototype.Refresh_ContentChanges = function()
{
    this.m_oContentChanges.Refresh();
};

ParaRun.prototype.Get_Text = function(Text)
{
	if (null === Text.Text)
		return;

	var ContentLen = this.Content.length;

	for (var CurPos = 0; CurPos < ContentLen; CurPos++)
	{
		var Item     = this.Content[CurPos];
		var ItemType = Item.Type;

		var bBreak = false;

		switch (ItemType)
		{
			case para_Drawing:
			case para_PageNum:
			case para_PageCount:
			{
				if (true === Text.BreakOnNonText)
				{
					Text.Text = null;
					bBreak    = true;
				}

				break;
			}
			case para_End:
			{
				if (true === Text.BreakOnNonText)
				{
					Text.Text = null;
					bBreak    = true;
				}

				if (true === Text.ParaEndToSpace)
					Text.Text += " ";

				break;
			}

			case para_Text :
			{
				Text.Text += String.fromCharCode(Item.Value);
				break;
			}
			case para_Space:
			case para_NewLine:
			case para_Tab:
			{
				Text.Text += " ";
				break;
			}
		}

		if (true === bBreak)
			break;
	}
};

/**
 * Получем текст из данного рана
 * @param oText
 * @returns {string}
 */
ParaRun.prototype.GetText = function(oText)
{
	if (!oText)
	{
		oText = {
			Text : ""
		};
	}

	this.Get_Text(oText);
	return oText.Text;
};

// Проверяем пустой ли ран
ParaRun.prototype.Is_Empty = function(oProps)
{
	var SkipAnchor  = (undefined !== oProps ? oProps.SkipAnchor : false);
	var SkipEnd     = (undefined !== oProps ? oProps.SkipEnd : false);
	var SkipPlcHldr = (undefined !== oProps ? oProps.SkipPlcHldr : false);
	var SkipNewLine = (undefined !== oProps ? oProps.SkipNewLine : false);
	var SkipCF      = (undefined !== oProps ? oProps.SkipComplexFields : false);

	var nCount = this.Content.length;

	if (true !== SkipAnchor
		&& true !== SkipEnd
		&& true !== SkipPlcHldr
		&& true !== SkipNewLine
		&& true !== SkipCF)
	{
		if (nCount > 0)
			return false;
		else
			return true;
	}
	else
	{
		for (var nCurPos = 0; nCurPos < nCount; ++nCurPos)
		{
			var oItem = this.Content[nCurPos];
			var nType = oItem.Type;

			if ((true !== SkipAnchor || para_Drawing !== nType || false !== oItem.Is_Inline())
				&& (true !== SkipEnd || para_End !== nType)
				&& (true !== SkipPlcHldr || true !== oItem.IsPlaceholder())
				&& (true !== SkipNewLine || para_NewLine !== nType)
				&& (true !== SkipCF || (para_InstrText !== nType && para_FieldChar !== nType)))
				return false;
		}

		return true;
	}
};

ParaRun.prototype.Is_CheckingNearestPos = function()
{
    if (this.NearPosArray.length > 0)
        return true;

    return false;
};

// Начинается ли данный ран с новой строки
ParaRun.prototype.IsStartFromNewLine = function()
{
    if (this.protected_GetLinesCount() < 2 || 0 !== this.protected_GetRangeStartPos(1, 0))
        return false;

    return true;
};

// Добавляем элемент в текущую позицию
ParaRun.prototype.Add = function(Item, bMath)
{
	if (undefined !== Item.Parent)
		Item.Parent = this;

	if (this.IsParaEndRun())
	{
		var NewRun = this.private_SplitRunInCurPos();
		if (NewRun)
		{
			NewRun.MoveCursorToStartPos();
			NewRun.Add(Item, bMath);
			NewRun.SetThisElementCurrentInParagraph();
			return;
		}
	}

	if (this.Paragraph && this.Paragraph.LogicDocument)
	{
		// Специальный код, связанный с обработкой изменения языка ввода при наборе.
		if (true === this.Paragraph.LogicDocument.CheckLanguageOnTextAdd && editor)
		{
			var nRequiredLanguage = editor.asc_getKeyboardLanguage();
			var nCurrentLanguage  = this.Get_CompiledPr(false).Lang.Val;
			if (-1 !== nRequiredLanguage && nRequiredLanguage !== nCurrentLanguage)
			{
				var NewLang = new CLang();
				NewLang.Val = nRequiredLanguage;

				if (this.Is_Empty())
				{
					this.Set_Lang(NewLang);
				}
				else
				{
					var NewRun = this.private_SplitRunInCurPos();
					if (NewRun)
					{
						NewRun.Set_Lang(NewLang);
						NewRun.MoveCursorToStartPos();
						NewRun.Add(Item, bMath);
						NewRun.Make_ThisElementCurrent();
						return;
					}
				}
			}
		}

		if(this.Paragraph.bFromDocument)
        {
            // Специальный код, связанный с работой сносок:
            // 1. При добавлении сноски мы ее оборачиваем в отдельный ран со специальным стилем.
            // 2. Если мы находимся в ране со специальным стилем сносок и следующий или предыдущий элемент и есть сноска, тогда
            //    мы добавляем элемент (если это не ссылка на сноску) в новый ран без стиля для сносок.
            var oStyles = this.Paragraph.LogicDocument.Get_Styles();
            if (para_FootnoteRef === Item.Type || para_FootnoteReference === Item.Type)
            {
                if (this.Is_Empty())
                {
                	this.Set_VertAlign(undefined);
                    this.Set_RStyle(oStyles.GetDefaultFootnoteReference());
                }
                else
                {
                    var NewRun = this.private_SplitRunInCurPos();
                    if (NewRun)
                    {
                        NewRun.Set_VertAlign(undefined);
                        NewRun.Set_RStyle(oStyles.GetDefaultFootnoteReference());
                        NewRun.MoveCursorToStartPos();
                        NewRun.Add(Item, bMath);
                        NewRun.Make_ThisElementCurrent();
                        return;
                    }
                }
            }
            else if (true === this.private_IsCurPosNearFootnoteReference())
            {
                var NewRun = this.private_SplitRunInCurPos();
                if (NewRun)
                {
                    NewRun.Set_VertAlign(AscCommon.vertalign_Baseline);
                    NewRun.MoveCursorToStartPos();
                    NewRun.Add(Item, bMath);
                    NewRun.Make_ThisElementCurrent();
                    return;
                }
            }
            // Специальный код с обработкой выделения (highlight)
            // Текст, который пишем до или после выделенного текста делаем без выделения.
            if ((0 === this.State.ContentPos || this.Content.length === this.State.ContentPos) && highlight_None !== this.Get_CompiledPr(false).HighLight)
            {
                var Parent = this.Get_Parent();
                var RunPos = this.private_GetPosInParent(Parent);
                if (null !== Parent && -1 !== RunPos)
                {
                    if ((0 === this.State.ContentPos
                        && (0 === RunPos
                        || Parent.Content[RunPos - 1].Type !== para_Run
                        || highlight_None === Parent.Content[RunPos - 1].Get_CompiledPr(false).HighLight))
                        || (this.Content.length === this.State.ContentPos
                        && (RunPos === Parent.Content.length - 1
                        || para_Run !== Parent.Content[RunPos + 1].Type
                        || highlight_None === Parent.Content[RunPos + 1].Get_CompiledPr(false).HighLight)
                        || (RunPos === Parent.Content.length - 2
                        && Parent instanceof Paragraph)))
                    {
                        var NewRun = this.private_SplitRunInCurPos();
                        if (NewRun)
                        {
                            NewRun.Set_HighLight(highlight_None);
                            NewRun.MoveCursorToStartPos();
                            NewRun.Add(Item, bMath);
                            NewRun.Make_ThisElementCurrent();
                            return;
                        }
                    }
                }
            }
        }
	}

	var oTrackRevisionsRun = this.CheckTrackRevisionsBeforeAdd();
    if (oTrackRevisionsRun)
    {
		oTrackRevisionsRun.private_AddItemToRun(oTrackRevisionsRun.State.ContentPos, Item);
		oTrackRevisionsRun.Make_ThisElementCurrent();
    }
    else if(this.Type == para_Math_Run && this.State.ContentPos == 0 && true === this.Is_StartForcedBreakOperator()) // если в начале текущего Run идет принудительный перенос => создаем новый Run
    {
        var NewRun = new ParaRun(this.Paragraph, bMath);
        NewRun.Set_Pr(this.Pr.Copy());
        NewRun.private_AddItemToRun(0, Item);

        // Ищем данный элемент в родительском классе
        var RunPos = this.private_GetPosInParent(this.Parent);

        this.Parent.Internal_Content_Add(RunPos, NewRun, true);
    }
    else
	{
		this.private_AddItemToRun(this.State.ContentPos, Item);

		if (this.Type === para_Run && Item.CanStartAutoCorrect())
			this.ProcessAutoCorrect(this.State.ContentPos - 1);
	}
};

/**
 * Ищем подходящий ран для добавления текста в режиме рецензирования (если нужно создаем новый), если возвращается
 * null, значит текущий ран подходит.
 * @returns {?ParaRun}
 */
ParaRun.prototype.CheckTrackRevisionsBeforeAdd = function()
{
	var TrackRevisions = false;
	if (this.Paragraph && this.Paragraph.LogicDocument)
		TrackRevisions = this.Paragraph.LogicDocument.IsTrackRevisions();

	var ReviewType = this.GetReviewType();
	if ((true === TrackRevisions && (reviewtype_Add !== ReviewType || true !== this.ReviewInfo.IsCurrentUser()))
		|| (false === TrackRevisions && reviewtype_Common !== ReviewType))
	{
		var DstReviewType = true === TrackRevisions ? reviewtype_Add : reviewtype_Common;

		// Если мы стоим в конце рана, тогда проверяем следующий элемент родительского класса, аналогично если мы стоим
		// в начале рана, проверяем предыдущий элемент родительского класса.

		var Parent = this.Get_Parent();
		if (null === Parent)
			return null;

		// Ищем данный элемент в родительском классе
		var RunPos = this.private_GetPosInParent(Parent);

		if (-1 === RunPos)
			return null;

		var CurPos = this.State.ContentPos;
		if (0 === CurPos && RunPos > 0)
		{
			var PrevElement = Parent.Content[RunPos - 1];
			if (para_Run === PrevElement.Type && DstReviewType === PrevElement.GetReviewType() && true === this.Pr.Is_Equal(PrevElement.Pr) && PrevElement.ReviewInfo && true === PrevElement.ReviewInfo.IsCurrentUser())
			{
				PrevElement.State.ContentPos = PrevElement.Content.length;
				return PrevElement;
			}
		}

		if (this.Content.length === CurPos && (RunPos < Parent.Content.length - 2 || (RunPos < Parent.Content.length - 1 && !(Parent instanceof Paragraph))))
		{
			var NextElement = Parent.Content[RunPos + 1];
			if (para_Run === NextElement.Type && DstReviewType === NextElement.GetReviewType() && true === this.Pr.Is_Equal(NextElement.Pr) && NextElement.ReviewInfo && true === NextElement.ReviewInfo.IsCurrentUser())
			{
				NextElement.State.ContentPos = 0;
				return NextElement;
			}
		}

		var NewRun = new ParaRun(this.Paragraph, this.IsMathRun());
		NewRun.Set_Pr(this.Pr.Copy());
		NewRun.SetReviewType(DstReviewType);
		NewRun.State.ContentPos = 0;

		if (0 === CurPos)
		{
			Parent.Add_ToContent(RunPos, NewRun);
		}
		else if (this.Content.length === CurPos)
		{
			Parent.Add_ToContent(RunPos + 1, NewRun);
		}
		else
		{
			var OldReviewInfo = (this.ReviewInfo ? this.ReviewInfo.Copy() : undefined);
			var OldReviewType = this.ReviewType;

			// Нужно разделить данный ран в текущей позиции
			var RightRun = this.Split2(CurPos);
			Parent.Add_ToContent(RunPos + 1, NewRun);
			Parent.Add_ToContent(RunPos + 2, RightRun);

			this.SetReviewTypeWithInfo(OldReviewType, OldReviewInfo);
			RightRun.SetReviewTypeWithInfo(OldReviewType, OldReviewInfo);
		}

		return NewRun;
	}

	return null;
};
/**
 * Проверяем, предзназначен ли данный ран чисто для математических формул.
 * @returns {boolean}
 */
ParaRun.prototype.IsMathRun = function()
{
	return this.Type === para_Math_Run ? true : false;
};

ParaRun.prototype.private_SplitRunInCurPos = function()
{
	var NewRun = null;
	var Parent = this.Get_Parent();
	var RunPos = this.private_GetPosInParent();
	if (null !== Parent && -1 !== RunPos)
	{
		// Если мы стоим в начале рана, тогда добавим новый ран в начало, если мы стоим в конце рана, тогда
		// добавим новый ран после текущего, а если мы в середине рана, тогда надо разбивать текущий ран.
		NewRun = new ParaRun(this.Paragraph, para_Math_Run === this.Type);
		NewRun.Set_Pr(this.Pr.Copy());

		var CurPos = this.State.ContentPos;
		if (0 === CurPos)
		{
			Parent.Add_ToContent(RunPos, NewRun);
		}
		else if (this.Content.length === CurPos)
		{
			Parent.Add_ToContent(RunPos + 1, NewRun);
		}
		else
		{
			// Нужно разделить данный ран в текущей позиции
			var RightRun = this.Split2(CurPos);
			Parent.Add_ToContent(RunPos + 1, NewRun);
			Parent.Add_ToContent(RunPos + 2, RightRun);
		}
	}

	return NewRun;
};
ParaRun.prototype.private_IsCurPosNearFootnoteReference = function()
{
	if (this.Paragraph && this.Paragraph.LogicDocument && this.Paragraph.bFromDocument)
	{
		var oStyles = this.Paragraph.LogicDocument.Get_Styles();
		var nCurPos = this.State.ContentPos;

		if (this.Get_RStyle() === oStyles.GetDefaultFootnoteReference()
			&& ((nCurPos > 0 && this.Content[nCurPos - 1] && (para_FootnoteRef === this.Content[nCurPos - 1].Type || para_FootnoteReference === this.Content[nCurPos - 1].Type))
			|| (nCurPos < this.Content.length && this.Content[nCurPos] && (para_FootnoteRef === this.Content[nCurPos].Type || para_FootnoteReference === this.Content[nCurPos].Type))))
			return true;
	}

	return false;
};
ParaRun.prototype.private_AddItemToRun = function(nPos, Item)
{
	if (para_FootnoteReference === Item.Type && true === Item.IsCustomMarkFollows() && undefined !== Item.GetCustomText())
	{
		this.AddToContent(nPos, Item, true);
		this.AddText(Item.GetCustomText(), nPos + 1);
	}
	else
	{
		this.Add_ToContent(nPos, Item, true);
	}
};
/**
 * Очищаем все содержимое данного рана
 */
ParaRun.prototype.ClearContent = function()
{
	if (this.Content.length <= 0)
		return;

	this.RemoveFromContent(0, this.Content.length, true);
};
ParaRun.prototype.Remove = function(Direction, bOnAddText)
{
    var TrackRevisions = null;
    if (this.Paragraph && this.Paragraph.LogicDocument)
        TrackRevisions = this.Paragraph.LogicDocument.IsTrackRevisions();

    var Selection = this.State.Selection;

    if (true === TrackRevisions && !this.CanDeleteInReviewMode())
    {
    	if (reviewtype_Remove === this.GetReviewType())
		{
			// Тут мы ничего не делаем, просто перешагиваем через удаленный текст
			if (true !== Selection.Use)
			{
				var CurPos = this.State.ContentPos;

				// Просто перешагиваем через элемент
				if (Direction < 0)
				{
					// Пропускаем все Flow-объекты
					while (CurPos > 0 && para_Drawing === this.Content[CurPos - 1].Type && false === this.Content[CurPos - 1].Is_Inline())
						CurPos--;

					if (CurPos <= 0)
						return false;

					this.State.ContentPos--;
				}
				else
				{
					if (CurPos >= this.Content.length || para_End === this.Content[CurPos].Type)
						return false;

					this.State.ContentPos++;
				}

				this.Make_ThisElementCurrent();
			}
			else
			{
				// Ничего не делаем
			}
		}
		else
		{
			if (true === Selection.Use)
			{
				// Мы должны данный ран разбить в начальной и конечной точках выделения и центральный ран пометить как
				// удаленный.

				var StartPos = Selection.StartPos;
				var EndPos   = Selection.EndPos;

				if (StartPos > EndPos)
				{
					StartPos = Selection.EndPos;
					EndPos   = Selection.StartPos;
				}

				var Parent = this.Get_Parent();
				var RunPos = this.private_GetPosInParent(Parent);

				if (-1 !== RunPos)
				{
					var DeletedRun = null;
					if (StartPos <= 0 && EndPos >= this.Content.length)
						DeletedRun = this;
					else if (StartPos <= 0)
					{
						this.Split2(EndPos, Parent, RunPos);
						DeletedRun = this;
					}
					else if (EndPos >= this.Content.length)
					{
						DeletedRun = this.Split2(StartPos, Parent, RunPos);
					}
					else
					{
						this.Split2(EndPos, Parent, RunPos);
						DeletedRun = this.Split2(StartPos, Parent, RunPos);
					}

					DeletedRun.SetReviewType(reviewtype_Remove, true);
				}
			}
			else
			{
				var Parent = this.Get_Parent();
				var RunPos = this.private_GetPosInParent(Parent);

				var CurPos = this.State.ContentPos;
				if (Direction < 0)
				{
					// Пропускаем все Flow-объекты
					while (CurPos > 0 && para_Drawing === this.Content[CurPos - 1].Type && false === this.Content[CurPos - 1].Is_Inline())
						CurPos--;

					if (CurPos <= 0)
						return false;

					// Проверяем, возможно предыдущий элемент - инлайн картинка, тогда мы его не удаляем, а выделяем как картинку
					if (para_Drawing == this.Content[CurPos - 1].Type && true === this.Content[CurPos - 1].Is_Inline())
					{
						return this.Paragraph.Parent.Select_DrawingObject(this.Content[CurPos - 1].Get_Id());
					}

					if (1 === CurPos && 1 === this.Content.length)
					{
						this.SetReviewType(reviewtype_Remove, true);
						this.State.ContentPos = CurPos - 1;
						this.Make_ThisElementCurrent();
						return true;
					}
					else if (1 === CurPos && Parent && RunPos > 0)
					{
						var PrevElement = Parent.Content[RunPos - 1];
						if (para_Run === PrevElement.Type && reviewtype_Remove === PrevElement.GetReviewType() && true === this.Pr.Is_Equal(PrevElement.Pr))
						{
							var Item = this.Content[CurPos - 1];
							this.Remove_FromContent(CurPos - 1, 1, true);
							PrevElement.Add_ToContent(PrevElement.Content.length, Item);
							PrevElement.State.ContentPos = PrevElement.Content.length - 1;
							PrevElement.Make_ThisElementCurrent();
							return true;
						}
					}
					else if (CurPos === this.Content.length && Parent && RunPos < Parent.Content.length - 1)
					{
						var NextElement = Parent.Content[RunPos + 1];
						if (para_Run === NextElement.Type && reviewtype_Remove === NextElement.GetReviewType() && true === this.Pr.Is_Equal(NextElement.Pr))
						{
							var Item = this.Content[CurPos - 1];
							this.Remove_FromContent(CurPos - 1, 1, true);
							NextElement.Add_ToContent(0, Item);
							this.State.ContentPos = CurPos - 1;
							this.Make_ThisElementCurrent();
							return true;
						}
					}

					// Если мы дошли до сюда, значит данный элемент нужно выделять в отдельный ран
					var RRun = this.Split2(CurPos, Parent, RunPos);
					var CRun = this.Split2(CurPos - 1, Parent, RunPos);

					CRun.SetReviewType(reviewtype_Remove, true);
					this.State.ContentPos = CurPos - 1;
					this.Make_ThisElementCurrent();
				}
				else
				{
					if (CurPos >= this.Content.length || para_End === this.Content[CurPos].Type)
						return false;

					// Проверяем, возможно следующий элемент - инлайн картинка, тогда мы его не удаляем, а выделяем как картинку
					if (para_Drawing == this.Content[CurPos].Type && true === this.Content[CurPos].Is_Inline())
					{
						return this.Paragraph.Parent.Select_DrawingObject(this.Content[CurPos].Get_Id());
					}

					if (CurPos === this.Content.length - 1 && 0 === CurPos)
					{
						this.SetReviewType(reviewtype_Remove, true);
						this.State.ContentPos = 1;
						this.Make_ThisElementCurrent();
						return true;
					}
					else if (0 === CurPos && Parent && RunPos > 0)
					{
						var PrevElement = Parent.Content[RunPos - 1];
						if (para_Run === PrevElement.Type && reviewtype_Remove === PrevElement.GetReviewType() && true === this.Pr.Is_Equal(PrevElement.Pr))
						{
							var Item = this.Content[CurPos];
							this.Remove_FromContent(CurPos, 1, true);
							PrevElement.Add_ToContent(PrevElement.Content.length, Item);
							this.State.ContentPos = CurPos;
							this.Make_ThisElementCurrent();
							return true;
						}
					}
					else if (CurPos === this.Content.length - 1 && Parent && RunPos < Parent.Content.length - 1)
					{
						var NextElement = Parent.Content[RunPos + 1];
						if (para_Run === NextElement.Type && reviewtype_Remove === NextElement.GetReviewType() && true === this.Pr.Is_Equal(NextElement.Pr))
						{
							var Item = this.Content[CurPos];
							this.Remove_FromContent(CurPos, 1, true);
							NextElement.Add_ToContent(0, Item);
							NextElement.State.ContentPos = 1;
							NextElement.Make_ThisElementCurrent();
							return true;
						}
					}

					// Если мы дошли до сюда, значит данный элемент нужно выделять в отдельный ран
					var RRun = this.Split2(CurPos + 1, Parent, RunPos);
					var CRun = this.Split2(CurPos, Parent, RunPos);

					CRun.SetReviewType(reviewtype_Remove, true);

					RRun.State.ContentPos = 0;
					RRun.Make_ThisElementCurrent();
				}
			}
		}
    }
    else
    {
        if (true === Selection.Use)
        {
            var StartPos = Selection.StartPos;
            var EndPos = Selection.EndPos;

            if (StartPos > EndPos)
            {
                var Temp = StartPos;
                StartPos = EndPos;
                EndPos = Temp;
            }

            // Если в выделение попадает ParaEnd, тогда удаляем все кроме этого элемента
            if (true === this.Selection_CheckParaEnd())
            {
                for (var CurPos = EndPos - 1; CurPos >= StartPos; CurPos--)
                {
                    if (para_End !== this.Content[CurPos].Type)
                        this.Remove_FromContent(CurPos, 1, true);
                }
            }
            else
            {
                this.Remove_FromContent(StartPos, EndPos - StartPos, true);
            }

            this.RemoveSelection();
            this.State.ContentPos = StartPos;
        }
        else
        {
            var CurPos = this.State.ContentPos;

            if (Direction < 0)
            {
                // Пропускаем все Flow-объекты
                while (CurPos > 0 && para_Drawing === this.Content[CurPos - 1].Type && false === this.Content[CurPos - 1].Is_Inline())
                    CurPos--;

                if (CurPos <= 0)
                    return false;

                // Проверяем, возможно предыдущий элемент - инлайн картинка, тогда мы его не удаляем, а выделяем как картинку
                if (para_Drawing == this.Content[CurPos - 1].Type && true === this.Content[CurPos - 1].Is_Inline())
                {
                    return this.Paragraph.Parent.Select_DrawingObject(this.Content[CurPos - 1].Get_Id());
                }
                else if (para_FieldChar === this.Content[CurPos - 1].Type)
				{
					var oComplexField = this.Content[CurPos - 1].GetComplexField();
					if (oComplexField)
					{
						oComplexField.SelectField();
						var oLogicDocument = (this.Paragraph && this.Paragraph.bFromDocument) ? this.Paragraph.LogicDocument : null;
						if (oLogicDocument)
						{
							oLogicDocument.Document_UpdateInterfaceState();
							oLogicDocument.Document_UpdateSelectionState();
						}
					}
					return true;
				}

				var oStyles = (this.Paragraph && this.Paragraph.bFromDocument) ? this.Paragraph.LogicDocument.GetStyles() : null;
				if (oStyles && 1 === this.Content.length && para_FootnoteReference === this.Content[0].Type && this.Get_RStyle() === oStyles.GetDefaultFootnoteReference())
					this.Set_RStyle(undefined);

                this.RemoveFromContent(CurPos - 1, 1, true);
                this.State.ContentPos = CurPos - 1;
            }
            else
            {
            	while (CurPos < this.Content.length && para_Drawing === this.Content[CurPos].Type && false === this.Content[CurPos].Is_Inline())
					CurPos++;

                if (CurPos >= this.Content.length || para_End === this.Content[CurPos].Type)
                    return false;

                // Проверяем, возможно следующий элемент - инлайн картинка, тогда мы его не удаляем, а выделяем как картинку
                if (para_Drawing == this.Content[CurPos].Type && true === this.Content[CurPos].Is_Inline())
                {
                    return this.Paragraph.Parent.Select_DrawingObject(this.Content[CurPos].Get_Id());
                }
				else if (para_FieldChar === this.Content[CurPos].Type)
				{
					var oComplexField = this.Content[CurPos].GetComplexField();
					if (oComplexField)
					{
						oComplexField.SelectField();
						var oLogicDocument = (this.Paragraph && this.Paragraph.bFromDocument) ? this.Paragraph.LogicDocument : null;
						if (oLogicDocument)
						{
							oLogicDocument.Document_UpdateInterfaceState();
							oLogicDocument.Document_UpdateSelectionState();
						}
					}
					return true;
				}

				var oStyles = (this.Paragraph && this.Paragraph.bFromDocument) ? this.Paragraph.LogicDocument.GetStyles() : null;
				if (oStyles && 1 === this.Content.length && para_FootnoteReference === this.Content[0].Type && this.Get_RStyle() === oStyles.GetDefaultFootnoteReference())
					this.Set_RStyle(undefined);

				this.RemoveFromContent(CurPos, 1, true);
                this.State.ContentPos = CurPos;
            }
        }
    }

    return true;
};

ParaRun.prototype.Remove_ParaEnd = function()
{
    var Pos = -1;

    var ContentLen = this.Content.length;
    for ( var CurPos = 0; CurPos < ContentLen; CurPos++ )
    {
        if ( para_End === this.Content[CurPos].Type )
        {
            Pos = CurPos;
            break;
        }
    }

    if ( -1 === Pos )
        return false;

    this.Remove_FromContent( Pos, ContentLen - Pos, true );

    return true;
};

/**
 * Обновляем позиции селекта, курсора и переносов строк при добавлении элемента в контент данного рана.
 * @param Pos
 */
ParaRun.prototype.private_UpdatePositionsOnAdd = function(Pos)
{
    // Обновляем текущую позицию
    if (this.State.ContentPos >= Pos)
        this.State.ContentPos++;

    // Обновляем начало и конец селекта
    if (true === this.State.Selection.Use)
    {
        if (this.State.Selection.StartPos >= Pos)
            this.State.Selection.StartPos++;

        if (this.State.Selection.EndPos >= Pos)
            this.State.Selection.EndPos++;
    }

    // Также передвинем всем метки переносов страниц и строк
    var LinesCount = this.protected_GetLinesCount();
    for (var CurLine = 0; CurLine < LinesCount; CurLine++)
    {
        var RangesCount = this.protected_GetRangesCount(CurLine);

        for (var CurRange = 0; CurRange < RangesCount; CurRange++)
        {
            var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
            var EndPos = this.protected_GetRangeEndPos(CurLine, CurRange);

            if (StartPos > Pos)
                StartPos++;

            if (EndPos > Pos)
                EndPos++;

            this.protected_FillRange(CurLine, CurRange, StartPos, EndPos);
        }

        // Особый случай, когда мы добавляем элемент в самый последний ран
        if (Pos === this.Content.length - 1 && LinesCount - 1 === CurLine)
        {
            this.protected_FillRangeEndPos(CurLine, RangesCount - 1, this.protected_GetRangeEndPos(CurLine, RangesCount - 1) + 1);
        }
    }
};

/**
 * Обновляем позиции селекта, курсора и переносов строк при удалении элементов из контента данного рана.
 * @param Pos
 * @param Count
 */
ParaRun.prototype.private_UpdatePositionsOnRemove = function(Pos, Count)
{
    // Обновим текущую позицию
    if (this.State.ContentPos > Pos + Count)
        this.State.ContentPos -= Count;
    else if (this.State.ContentPos > Pos)
        this.State.ContentPos = Pos;

    // Обновим начало и конец селекта
    if (true === this.State.Selection.Use)
    {
        if (this.State.Selection.StartPos <= this.State.Selection.EndPos)
        {
            if (this.State.Selection.StartPos > Pos + Count)
                this.State.Selection.StartPos -= Count;
            else if (this.State.Selection.StartPos > Pos)
                this.State.Selection.StartPos = Pos;

            if (this.State.Selection.EndPos >= Pos + Count)
                this.State.Selection.EndPos -= Count;
            else if (this.State.Selection.EndPos > Pos)
                this.State.Selection.EndPos = Math.max(0, Pos - 1);
        }
        else
        {
            if (this.State.Selection.StartPos >= Pos + Count)
                this.State.Selection.StartPos -= Count;
            else if (this.State.Selection.StartPos > Pos)
                this.State.Selection.StartPos = Math.max(0, Pos - 1);

            if (this.State.Selection.EndPos > Pos + Count)
                this.State.Selection.EndPos -= Count;
            else if (this.State.Selection.EndPos > Pos)
                this.State.Selection.EndPos = Pos;
        }
    }

    // Также передвинем всем метки переносов страниц и строк
    var LinesCount = this.protected_GetLinesCount();
    for (var CurLine = 0; CurLine < LinesCount; CurLine++)
    {
        var RangesCount = this.protected_GetRangesCount(CurLine);
        for (var CurRange = 0; CurRange < RangesCount; CurRange++)
        {
            var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
            var EndPos = this.protected_GetRangeEndPos(CurLine, CurRange);

            if (StartPos > Pos + Count)
                StartPos -= Count;
            else if (StartPos > Pos)
                StartPos = Math.max(0, Pos);

            if (EndPos >= Pos + Count)
                EndPos -= Count;
            else if (EndPos >= Pos)
                EndPos = Math.max(0, Pos);

            this.protected_FillRange(CurLine, CurRange, StartPos, EndPos);
        }
    }
};

ParaRun.prototype.private_UpdateCompositeInputPositionsOnAdd = function(Pos)
{
	if (null !== this.CompositeInput)
	{
		if (Pos <= this.CompositeInput.Pos)
			this.CompositeInput.Pos++;
		else if (Pos < this.CompositeInput.Pos + this.CompositeInput.Length)
			this.CompositeInput.Length++;
	}
};

ParaRun.prototype.private_UpdateCompositeInputPositionsOnRemove = function(Pos, Count)
{
	if (null !== this.CompositeInput)
	{
		if (Pos + Count <= this.CompositeInput.Pos)
		{
			this.CompositeInput.Pos -= Count;
		}
		else if (Pos < this.CompositeInput.Pos)
		{
			this.CompositeInput.Pos    = Pos;
			this.CompositeInput.Length = Math.max(0, this.CompositeInput.Length - (Count - (this.CompositeInput.Pos - Pos)));
		}
		else if (Pos + Count < this.CompositeInput.Pos + this.CompositeInput.Length)
		{
			this.CompositeInput.Length = Math.max(0, this.CompositeInput.Length - Count);
		}
		else if (Pos < this.CompositeInput.Pos + this.CompositeInput.Length)
		{
			this.CompositeInput.Length = Math.max(0, Pos - this.CompositeInput.Pos);
		}
	}
};

ParaRun.prototype.GetLogicDocument = function()
{
	if (this.Paragraph && this.Paragraph.LogicDocument)
		return this.Paragraph.LogicDocument;

	if (editor && editor.WordControl)
		return editor.WordControl.m_oLogicDocument;

	return null;
};

// Добавляем элемент в позицию с сохранием в историю
ParaRun.prototype.Add_ToContent = function(Pos, Item, UpdatePosition)
{
	if (-1 === Pos)
		Pos = this.Content.length;

	if (Item.SetParent)
		Item.SetParent(this);

	// Здесь проверка на возвожность добавления в историю стоит заранее для ускорения открытия файлов, чтобы
	// не создавалось лишних классов
	if (History.CanAddChanges())
		History.Add(new CChangesRunAddItem(this, Pos, [Item], true));

	if (Pos >= this.Content.length)
	{
		Pos = this.Content.length;
		this.Content.push(Item);
	}
	else
	{
		this.Content.splice(Pos, 0, Item);
	}

    if (true === UpdatePosition)
        this.private_UpdatePositionsOnAdd(Pos);

    // Обновляем позиции в NearestPos
    var NearPosLen = this.NearPosArray.length;
    for ( var Index = 0; Index < NearPosLen; Index++ )
    {
        var RunNearPos = this.NearPosArray[Index];
        var ContentPos = RunNearPos.NearPos.ContentPos;
        var Depth      = RunNearPos.Depth;

        if ( ContentPos.Data[Depth] >= Pos )
            ContentPos.Data[Depth]++;
    }

	// Обновляем позиции в поиске
	var SearchMarksCount = this.SearchMarks.length;
	for (var Index = 0; Index < SearchMarksCount; Index++)
	{
		var Mark       = this.SearchMarks[Index];
		var ContentPos = ( true === Mark.Start ? Mark.SearchResult.StartPos : Mark.SearchResult.EndPos );
		var Depth      = Mark.Depth;

		if (ContentPos.Data[Depth] > Pos || (ContentPos.Data[Depth] === Pos && true === Mark.Start))
			ContentPos.Data[Depth]++;
	}

    // Обновляем позиции для орфографии
    var SpellingMarksCount = this.SpellingMarks.length;
    for ( var Index = 0; Index < SpellingMarksCount; Index++ )
    {
        var Mark       = this.SpellingMarks[Index];
        var ContentPos = ( true === Mark.Start ? Mark.Element.StartPos : Mark.Element.EndPos );
        var Depth      = Mark.Depth;

        if ( ContentPos.Data[Depth] >= Pos )
            ContentPos.Data[Depth]++;
    }

    this.private_UpdateSpellChecking();
	this.private_UpdateDocumentOutline();
    this.private_UpdateTrackRevisionOnChangeContent(true);

    // Обновляем позиции меток совместного редактирования
    this.CollaborativeMarks.Update_OnAdd( Pos );

    this.RecalcInfo.OnAdd(Pos);
};

ParaRun.prototype.Remove_FromContent = function(Pos, Count, UpdatePosition)
{
	for (var nIndex = Pos, nCount = Math.min(Pos + Count, this.Content.length); nIndex < nCount; ++nIndex)
	{
		if (this.Content[nIndex].PreDelete)
			this.Content[nIndex].PreDelete();
	}

	if (History.CanAddChanges())
	{
		var DeletedItems = this.Content.slice(Pos, Pos + Count);
		History.Add(new CChangesRunRemoveItem(this, Pos, DeletedItems));
	}

	this.Content.splice(Pos, Count);

    if (true === UpdatePosition)
        this.private_UpdatePositionsOnRemove(Pos, Count);

	// Обновляем позиции в NearestPos
    var NearPosLen = this.NearPosArray.length;
    for ( var Index = 0; Index < NearPosLen; Index++ )
    {
        var RunNearPos = this.NearPosArray[Index];
        var ContentPos = RunNearPos.NearPos.ContentPos;
        var Depth      = RunNearPos.Depth;

        if ( ContentPos.Data[Depth] > Pos + Count )
            ContentPos.Data[Depth] -= Count;
        else if ( ContentPos.Data[Depth] > Pos )
            ContentPos.Data[Depth] = Math.max( 0 , Pos );
    }

    // Обновляем позиции в поиске
    var SearchMarksCount = this.SearchMarks.length;
    for ( var Index = 0; Index < SearchMarksCount; Index++ )
    {
        var Mark       = this.SearchMarks[Index];
        var ContentPos = ( true === Mark.Start ? Mark.SearchResult.StartPos : Mark.SearchResult.EndPos );
        var Depth      = Mark.Depth;

        if ( ContentPos.Data[Depth] > Pos + Count )
            ContentPos.Data[Depth] -= Count;
        else if ( ContentPos.Data[Depth] > Pos )
            ContentPos.Data[Depth] = Math.max( 0 , Pos );
    }

    // Обновляем позиции для орфографии
    var SpellingMarksCount = this.SpellingMarks.length;
    for ( var Index = 0; Index < SpellingMarksCount; Index++ )
    {
        var Mark       = this.SpellingMarks[Index];
        var ContentPos = ( true === Mark.Start ? Mark.Element.StartPos : Mark.Element.EndPos );
        var Depth      = Mark.Depth;

        if ( ContentPos.Data[Depth] > Pos + Count )
            ContentPos.Data[Depth] -= Count;
        else if ( ContentPos.Data[Depth] > Pos )
            ContentPos.Data[Depth] = Math.max( 0 , Pos );
    }

    this.private_UpdateSpellChecking();
	this.private_UpdateDocumentOutline();
	this.private_UpdateTrackRevisionOnChangeContent(true);

    // Обновляем позиции меток совместного редактирования
    this.CollaborativeMarks.Update_OnRemove( Pos, Count );

    this.RecalcInfo.OnRemove(Pos, Count);
};

/**
 * Добавляем к массиву содержимого массив новых элементов
 * @param arrNewItems
 */
ParaRun.prototype.ConcatToContent = function(arrNewItems)
{
	for (var nIndex = 0, nCount = arrNewItems.length; nIndex < nCount; ++nIndex)
	{
		if (arrNewItems[nIndex].SetParent)
			arrNewItems[nIndex].SetParent(this);
	}

	var StartPos = this.Content.length;
	this.Content = this.Content.concat(arrNewItems);

	History.Add(new CChangesRunAddItem(this, StartPos, arrNewItems, false));

	this.private_UpdateTrackRevisionOnChangeContent(true);

	// Отмечаем, что надо перемерить элементы в данном ране
	this.RecalcInfo.Measure = true;
};
/**
 * Добавляем в конец рана заданную строку
 * @param {string} sString
 * @param {number} [nPos=-1] если позиция не задана (или значение -1), то добавляем в конец
 */
ParaRun.prototype.AddText = function(sString, nPos)
{
	var nCharPos = undefined !== nPos && null !== nPos && -1 !== nPos ? nPos : this.Content.length;

	if (this.IsMathRun())
	{
		for (var oIterator = sString.getUnicodeIterator(); oIterator.check(); oIterator.next())
		{
			var nCharCode = oIterator.value();

			var oMathText = new CMathText();
			oMathText.add(nCharCode);
			this.AddToContent(nCharPos++, oMathText);
		}
	}
	else
	{
		for (var oIterator = sString.getUnicodeIterator(); oIterator.check(); oIterator.next())
		{
			var nCharCode = oIterator.value();

			if (9 === nCharCode) // \t
				this.AddToContent(nCharPos++, new ParaTab());
			else if (10 === nCharCode) // \n
				this.AddToContent(nCharPos++, new ParaNewLine(break_Line));
			else if (13 === nCharCode) // \r
				continue;
			else if (32 === nCharCode) // space
				this.AddToContent(nCharPos++, new ParaSpace());
			else
				this.AddToContent(nCharPos++, new ParaText(nCharCode));
		}
	}
};
/**
 * Добавляем в конец рана заданную инструкцию для сложного поля
 * @param {string} sString
 * @param {number} [nPos=-1] если позиция не задана (или значение -1), то добавляем в конец
 */
ParaRun.prototype.AddInstrText = function(sString, nPos)
{
	var nCharPos = undefined !== nPos && null !== nPos && -1 !== nPos ? nPos : this.Content.length;
	for (var oIterator = sString.getUnicodeIterator(); oIterator.check(); oIterator.next())
	{
		this.AddToContent(nCharPos++, new ParaInstrText(oIterator.value()));
	}
};

// Определим строку и отрезок текущей позиции
ParaRun.prototype.GetCurrentParaPos = function()
{
    var Pos = this.State.ContentPos;

    if (-1 === this.StartLine)
        return new CParaPos(-1, -1, -1, -1);

    var CurLine  = 0;
    var CurRange = 0;

    var LinesCount = this.protected_GetLinesCount();
    for (; CurLine < LinesCount; CurLine++)
    {
        var RangesCount = this.protected_GetRangesCount(CurLine);
        for (CurRange = 0; CurRange < RangesCount; CurRange++)
        {
            var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
            var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);
            if ( Pos < EndPos && Pos >= StartPos )
                return new CParaPos((CurLine === 0 ? CurRange + this.StartRange : CurRange), CurLine + this.StartLine, 0, 0);
        }
    }

    // Значит курсор стоит в самом конце, поэтому посылаем последний отрезок
    if(this.Type == para_Math_Run && LinesCount > 1)
    {
        var Line  = LinesCount - 1,
            Range = this.protected_GetRangesCount(LinesCount - 1) - 1;

        StartPos = this.protected_GetRangeStartPos(Line, Range);
        EndPos   = this.protected_GetRangeEndPos(Line, Range);

        // учтем, что в одной строке в формуле может быть только один Range
        while(StartPos == EndPos && Line > 0 && this.Content.length !== 0) // == this.Content.length, т.к. последний Range
        {
            Line--;
            StartPos = this.protected_GetRangeStartPos(Line, Range);
            EndPos   = this.protected_GetRangeEndPos(Line, Range);
        }

        return new CParaPos((this.protected_GetRangesCount(Line) - 1), Line + this.StartLine, 0, 0 );
    }

    return new CParaPos((LinesCount <= 1 ? this.protected_GetRangesCount(0) - 1 + this.StartRange : this.protected_GetRangesCount(LinesCount - 1) - 1), LinesCount - 1 + this.StartLine, 0, 0 );
};

ParaRun.prototype.Get_ParaPosByContentPos = function(ContentPos, Depth)
{
    if (this.StartRange < 0 || this.StartLine < 0)
        return new CParaPos(0, 0, 0, 0);

    var Pos = ContentPos.Get(Depth);

    var CurLine  = 0;
    var CurRange = 0;

    var LinesCount = this.protected_GetLinesCount();
    if (LinesCount <= 0)
        return new CParaPos(0, 0, 0, 0);

    for (; CurLine < LinesCount; CurLine++)
    {
        var RangesCount = this.protected_GetRangesCount(CurLine);
        for (CurRange = 0; CurRange < RangesCount; CurRange++)
        {
            var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
            var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

            var bUpdateMathRun = Pos == EndPos && StartPos == EndPos && EndPos == this.Content.length && this.Type == para_Math_Run; // для para_Run позиция может быть после последнего элемента (пример: Run, за ним идет мат объект)
            if (Pos < EndPos && Pos >= StartPos || bUpdateMathRun)
                return new CParaPos((CurLine === 0 ? CurRange + this.StartRange : CurRange), CurLine + this.StartLine, 0, 0);
        }
    }

    return new CParaPos((LinesCount === 1 ? this.protected_GetRangesCount(0) - 1 + this.StartRange : this.protected_GetRangesCount(0) - 1), LinesCount - 1 + this.StartLine, 0, 0);
};

ParaRun.prototype.Recalculate_CurPos = function(X, Y, CurrentRun, _CurRange, _CurLine, CurPage, UpdateCurPos, UpdateTarget, ReturnTarget)
{
    var Para = this.Paragraph;

    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    var Pos = StartPos;
    var _EndPos = ( true === CurrentRun ? Math.min( EndPos, this.State.ContentPos ) : EndPos );

    if(this.Type == para_Math_Run)
    {
        var Lng = this.Content.length;

        Pos = _EndPos;

        var LocParaMath = this.ParaMath.GetLinePosition(_CurLine, _CurRange);
        X = LocParaMath.x;
        Y = LocParaMath.y;

        var MATH_Y = Y;
        var loc;

        if(Lng == 0)
        {
            X += this.pos.x;
            Y += this.pos.y;
        }
        else if(Pos < EndPos)
        {
            loc = this.Content[Pos].GetLocationOfLetter();

            X += loc.x;
            Y += loc.y;
        }
        else if(!(StartPos == EndPos)) // исключаем этот случай StartPos == EndPos && EndPos == Pos, это возможно когда конец Run находится в начале строки, при этом ни одна из букв этого Run не входит в эту строку
        {
            var Letter = this.Content[Pos - 1];
            loc = Letter.GetLocationOfLetter();

            X += loc.x + Letter.Get_WidthVisible();
            Y += loc.y;
        }

    }
    else
    {
        for ( ; Pos < _EndPos; Pos++ )
        {
            var Item = this.private_CheckInstrText(this.Content[Pos]);
            var ItemType = Item.Type;

            if (para_Drawing === ItemType && drawing_Inline !== Item.DrawingType)
                continue;

            X += Item.Get_WidthVisible();
        }
    }

	var bNearFootnoteReference = this.private_IsCurPosNearFootnoteReference();
    if ( true === CurrentRun && Pos === this.State.ContentPos )
    {
        if ( true === UpdateCurPos )
        {
            // Обновляем позицию курсора в параграфе

            Para.CurPos.X        = X;
            Para.CurPos.Y        = Y;
            Para.CurPos.PagesPos = CurPage;

            if ( true === UpdateTarget )
            {
                var CurTextPr = this.Get_CompiledPr(false);
				var dFontKoef = bNearFootnoteReference ? 1 : CurTextPr.Get_FontKoef();

				g_oTextMeasurer.SetTextPr(CurTextPr, this.Paragraph.Get_Theme());
				g_oTextMeasurer.SetFontSlot(fontslot_ASCII, dFontKoef);
				var Height    = g_oTextMeasurer.GetHeight();
				var Descender = Math.abs(g_oTextMeasurer.GetDescender());
				var Ascender  = Height - Descender;

				Para.DrawingDocument.SetTargetSize(Height, Ascender);

                var RGBA;
                Para.DrawingDocument.UpdateTargetTransform(Para.Get_ParentTextTransform());
                if(CurTextPr.TextFill)
                {
                    CurTextPr.TextFill.check(Para.Get_Theme(), Para.Get_ColorMap());
                    var oColor = CurTextPr.TextFill.getRGBAColor();
                    Para.DrawingDocument.SetTargetColor( oColor.R, oColor.G, oColor.B );
                }
                else if(CurTextPr.Unifill)
                {
                    CurTextPr.Unifill.check(Para.Get_Theme(), Para.Get_ColorMap());
                    RGBA = CurTextPr.Unifill.getRGBAColor();
                    Para.DrawingDocument.SetTargetColor( RGBA.R, RGBA.G, RGBA.B );
                }
                else
                {
                    if ( true === CurTextPr.Color.Auto )
                    {
                        // Выясним какая заливка у нашего текста
                        var Pr = Para.Get_CompiledPr();
                        var BgColor = undefined;
                        if ( undefined !== Pr.ParaPr.Shd && c_oAscShdNil !== Pr.ParaPr.Shd.Value )
                        {
                            if(Pr.ParaPr.Shd.Unifill)
                            {
                                Pr.ParaPr.Shd.Unifill.check(this.Paragraph.Get_Theme(), this.Paragraph.Get_ColorMap());
                                var RGBA =  Pr.ParaPr.Shd.Unifill.getRGBAColor();
                                BgColor = new CDocumentColor(RGBA.R, RGBA.G, RGBA.B, false);
                            }
                            else
                            {
                                BgColor = Pr.ParaPr.Shd.Color;
                            }
                        }
                        else
                        {
                            // Нам надо выяснить заливку у родительского класса (возможно мы находимся в ячейке таблицы с забивкой)
                            BgColor = Para.Parent.Get_TextBackGroundColor();

                            if ( undefined !== CurTextPr.Shd && c_oAscShdNil !== CurTextPr.Shd.Value && !(CurTextPr.FontRef && CurTextPr.FontRef.Color) )
                                BgColor = CurTextPr.Shd.Get_Color( this.Paragraph );
                        }

                        // Определим автоцвет относительно заливки
                        var AutoColor = ( undefined != BgColor && false === BgColor.Check_BlackAutoColor() ? new CDocumentColor( 255, 255, 255, false ) : new CDocumentColor( 0, 0, 0, false ) );
                        var  RGBA, Theme = Para.Get_Theme(), ColorMap = Para.Get_ColorMap();
                        if((BgColor == undefined || BgColor.Auto) && CurTextPr.FontRef && CurTextPr.FontRef.Color)
                        {
                            CurTextPr.FontRef.Color.check(Theme, ColorMap);
                            RGBA = CurTextPr.FontRef.Color.RGBA;
                            AutoColor = new CDocumentColor( RGBA.R, RGBA.G, RGBA.B, RGBA.A );
                        }

                        Para.DrawingDocument.SetTargetColor( AutoColor.r, AutoColor.g, AutoColor.b );
                    }
                    else
                        Para.DrawingDocument.SetTargetColor( CurTextPr.Color.r, CurTextPr.Color.g, CurTextPr.Color.b );
                }

                var TargetY = Y - Ascender - CurTextPr.Position;
				if (!bNearFootnoteReference)
				{
					switch (CurTextPr.VertAlign)
					{
						case AscCommon.vertalign_SubScript:
						{
							TargetY -= CurTextPr.FontSize * g_dKoef_pt_to_mm * AscCommon.vaKSub;
							break;
						}
						case AscCommon.vertalign_SuperScript:
						{
							TargetY -= CurTextPr.FontSize * g_dKoef_pt_to_mm * AscCommon.vaKSuper;
							break;
						}
					}
				}

                var PageAbs = Para.Get_AbsolutePage(CurPage);
                // TODO: Тут делаем, чтобы курсор не выходил за границы буквицы. На самом деле, надо делать, чтобы
                //       курсор не выходил за границы строки, но для этого надо делать обрезку по строкам, а без нее
                //       такой вариант будет смотреться плохо.
                if (para_Math_Run === this.Type && null !== this.Parent && true !== this.Parent.bRoot && this.Parent.bMath_OneLine)
                {
                    var oBounds = this.Parent.Get_Bounds();
                    var __Y0 = TargetY, __Y1 = TargetY + Height;

                    // пока так
                    // TO DO : переделать

                    var YY = this.Parent.pos.y - this.Parent.size.ascent,
                        XX = this.Parent.pos.x;

                    var ___Y0 = MATH_Y + YY - 0.2 * oBounds.H;
                    var ___Y1 = MATH_Y + YY + 1.4 * oBounds.H;

                    __Y0 = Math.max( __Y0, ___Y0 );
                    __Y1 = Math.min( __Y1, ___Y1 );

					Para.DrawingDocument.SetTargetSize(__Y1 - __Y0, Ascender);
                    Para.DrawingDocument.UpdateTarget( X, __Y0, PageAbs );
                }
                else if ( undefined != Para.Get_FramePr() )
                {
                    var __Y0 = TargetY, __Y1 = TargetY + Height;
                    var ___Y0 = Para.Pages[CurPage].Y + Para.Lines[CurLine].Top;
                    var ___Y1 = Para.Pages[CurPage].Y + Para.Lines[CurLine].Bottom;

                    __Y0 = Math.max( __Y0, ___Y0 );
                    __Y1 = Math.min( __Y1, ___Y1 );

					Para.DrawingDocument.SetTargetSize(__Y1 - __Y0, Ascender);
                    Para.DrawingDocument.UpdateTarget( X, __Y0, PageAbs );
                }
                else
                {
                    Para.DrawingDocument.UpdateTarget(X, TargetY, PageAbs);
                }
            }
        }

        if ( true === ReturnTarget )
        {
			var CurTextPr = this.Get_CompiledPr(false);
			var dFontKoef = bNearFootnoteReference ? 1 : CurTextPr.Get_FontKoef();

			g_oTextMeasurer.SetTextPr(CurTextPr, this.Paragraph.Get_Theme());
			g_oTextMeasurer.SetFontSlot(fontslot_ASCII, dFontKoef);

			var Height    = g_oTextMeasurer.GetHeight();
			var Descender = Math.abs(g_oTextMeasurer.GetDescender());
			var Ascender  = Height - Descender;

			var TargetY = Y - Ascender - CurTextPr.Position;
			if (!bNearFootnoteReference)
			{
				switch (CurTextPr.VertAlign)
				{
					case AscCommon.vertalign_SubScript:
					{
						TargetY -= CurTextPr.FontSize * g_dKoef_pt_to_mm * AscCommon.vaKSub;
						break;
					}
					case AscCommon.vertalign_SuperScript:
					{
						TargetY -= CurTextPr.FontSize * g_dKoef_pt_to_mm * AscCommon.vaKSuper;
						break;
					}
				}
			}


            return { X : X, Y : TargetY, Height : Height, PageNum : Para.Get_AbsolutePage(CurPage), Internal : { Line : CurLine, Page : CurPage, Range : CurRange } };
        }
        else
            return { X : X, Y : Y, PageNum : Para.Get_AbsolutePage(CurPage), Internal : { Line : CurLine, Page : CurPage, Range : CurRange } };

    }

    return { X : X, Y: Y,  PageNum : Para.Get_AbsolutePage(CurPage), Internal : { Line : CurLine, Page : CurPage, Range : CurRange } };
};

// Проверяем, произошло ли простейшее изменение (набор или удаление текста)
ParaRun.prototype.Is_SimpleChanges = function(Changes)
{
    var ParaPos = null;

    var Count = Changes.length;
    for (var Index = 0; Index < Count; Index++)
    {
        var Data = Changes[Index].Data;

        if (undefined === Data.Items || 1 !== Data.Items.length)
            return false;

        var Type = Data.Type;
        var Item = Data.Items[0];

        if (undefined === Item)
            return false;

        if (AscDFH.historyitem_ParaRun_AddItem !== Type && AscDFH.historyitem_ParaRun_RemoveItem !== Type)
            return false;

        // Добавление/удаление картинок может изменить размер строки. Добавление/удаление переноса строки/страницы/колонки
        // нельзя обсчитывать функцией Recalculate_Fast. Добавление и удаление разметок сложных полей тоже нельзя
		// обсчитывать в быстром пересчете.
        // TODO: Но на самом деле стоило бы сделать нормальную проверку на высоту строки в функции Recalculate_Fast
        var ItemType = Item.Type;
        if (para_Drawing === ItemType || para_NewLine === ItemType || para_FootnoteRef === ItemType || para_FootnoteReference === ItemType || para_FieldChar === ItemType || para_InstrText === ItemType)
            return false;

        // Проверяем, что все изменения произошли в одном и том же отрезке
        var CurParaPos = this.Get_SimpleChanges_ParaPos([Changes[Index]]);
        if (null === CurParaPos)
            return false;

        if (null === ParaPos)
            ParaPos = CurParaPos;
        else if (ParaPos.Line !== CurParaPos.Line || ParaPos.Range !== CurParaPos.Range)
            return false;
    }

    return true;
};

/**
 * Проверяем произошло ли простое изменение параграфа, сейчас главное, чтобы это было не добавлениe/удаление картинки
 * или ссылки на сноску или разметки сложного поля, или изменение типа реценизрования для рана со знаком конца
 * параграфа. На вход приходит либо массив изменений, либо одно изменение
 * (можно не в массиве).
 * @returns {boolean}
 */
ParaRun.prototype.IsParagraphSimpleChanges = function(_Changes)
{
    var Changes = _Changes;
    if (!_Changes.length)
        Changes = [_Changes];

    var ChangesCount = Changes.length;
    for (var ChangesIndex = 0; ChangesIndex < ChangesCount; ChangesIndex++)
    {
        var Data = Changes[ChangesIndex].Data;
        var ChangeType = Data.Type;

        if (AscDFH.historyitem_ParaRun_AddItem === ChangeType || AscDFH.historyitem_ParaRun_RemoveItem === ChangeType)
        {
            for (var ItemIndex = 0, ItemsCount = Data.Items.length; ItemIndex < ItemsCount; ItemIndex++)
            {
                var Item = Data.Items[ItemIndex];
                if (para_Drawing === Item.Type || para_FootnoteReference === Item.Type || para_FieldChar === Item.Type || para_InstrText === Item.Type)
                    return false;
            }
        }
        else if (AscDFH.historyitem_ParaRun_ReviewType === ChangeType && this.GetParaEnd())
		{
			return false;
		}
    }

    return true;
};
/**
 * Проверяем, подходит ли содержимое данного рана быстрого пересчета
 * @returns {boolean}
 */
ParaRun.prototype.IsContentSuitableForParagraphSimpleChanges = function()
{
	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		var nItemType = this.Content[nPos].Type;
		if (1 !== g_oSRCFPSC[nItemType])
			return false;
	}
	return true;
};

// Возвращаем строку и отрезок, в котором произошли простейшие изменения
ParaRun.prototype.Get_SimpleChanges_ParaPos = function(Changes)
{
    var Change = Changes[0].Data;
    var Type   = Changes[0].Data.Type;
    var Pos    = Change.Pos;

    var CurLine  = 0;
    var CurRange = 0;

    var LinesCount = this.protected_GetLinesCount();
    for (; CurLine < LinesCount; CurLine++)
    {
        var RangesCount = this.protected_GetRangesCount(CurLine);
        for (CurRange = 0; CurRange < RangesCount; CurRange++)
        {
            var RangeStartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
            var RangeEndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

            if  ( ( AscDFH.historyitem_ParaRun_AddItem === Type && Pos < RangeEndPos && Pos >= RangeStartPos ) || ( AscDFH.historyitem_ParaRun_RemoveItem === Type && Pos < RangeEndPos && Pos >= RangeStartPos ) || ( AscDFH.historyitem_ParaRun_RemoveItem === Type && Pos >= RangeEndPos && CurLine === LinesCount - 1 && CurRange === RangesCount - 1 ) )
            {
                // Если отрезок остается пустым, тогда надо все заново пересчитывать
                if ( RangeStartPos === RangeEndPos )
                    return null;

                return new CParaPos( ( CurLine === 0 ? CurRange + this.StartRange : CurRange ), CurLine + this.StartLine, 0, 0 );
            }
        }
    }

    // Если отрезок остается пустым, тогда надо все заново пересчитывать
    if (this.protected_GetRangeStartPos(0, 0) === this.protected_GetRangeEndPos(0, 0))
        return null;

    return new CParaPos( this.StartRange, this.StartLine, 0, 0 );
};

ParaRun.prototype.Split = function (ContentPos, Depth)
{
    var CurPos = ContentPos.Get(Depth);
    return this.Split2( CurPos );
};

ParaRun.prototype.Split2 = function(CurPos, Parent, ParentPos)
{
    History.Add(new CChangesRunOnStartSplit(this, CurPos));
    AscCommon.CollaborativeEditing.OnStart_SplitRun(this, CurPos);

    // Если задается Parent и ParentPos, тогда ран автоматически добавляется в родительский класс
    var UpdateParent    = (undefined !== Parent && undefined !== ParentPos && this === Parent.Content[ParentPos] ? true : false);
    var UpdateSelection = (true === UpdateParent && true === Parent.IsSelectionUse() && true === this.IsSelectionUse() ? true : false);

    // Создаем новый ран
    var bMathRun = this.Type == para_Math_Run;
    var NewRun = new ParaRun(this.Paragraph, bMathRun);

    // Копируем настройки
    NewRun.Set_Pr(this.Pr.Copy(true));
    NewRun.SetReviewTypeWithInfo(this.ReviewType, this.ReviewInfo ? this.ReviewInfo.Copy() : undefined);

    NewRun.CollPrChangeMine  = this.CollPrChangeMine;
    NewRun.CollPrChangeOther = this.CollPrChangeOther;

    if(bMathRun)
        NewRun.Set_MathPr(this.MathPrp.Copy());

    // TODO: Как только избавимся от para_End переделать тут
    // Проверим, если наш ран содержит para_End, тогда мы должны para_End переметить в правый ран

    var CheckEndPos = -1;
    var CheckEndPos2 = Math.min( CurPos, this.Content.length );
    for ( var Pos = 0; Pos < CheckEndPos2; Pos++ )
    {
        if ( para_End === this.Content[Pos].Type )
        {
            CheckEndPos = Pos;
            break;
        }
    }

    if ( -1 !== CheckEndPos )
        CurPos = CheckEndPos;

    var ParentOldSelectionStartPos, ParentOldSelectionEndPos, OldSelectionStartPos, OldSelectionEndPos;
    if (true === UpdateSelection)
    {
        ParentOldSelectionStartPos = Parent.Selection.StartPos;
        ParentOldSelectionEndPos   = Parent.Selection.EndPos;
        OldSelectionStartPos = this.Selection.StartPos;
        OldSelectionEndPos   = this.Selection.EndPos;
    }

    if (true === UpdateParent)
    {
        Parent.Add_ToContent(ParentPos + 1, NewRun);

        // Обновим массив NearPosArray
        for (var Index = 0, Count = this.NearPosArray.length; Index < Count; Index++)
        {
            var RunNearPos = this.NearPosArray[Index];
            var ContentPos = RunNearPos.NearPos.ContentPos;
            var Depth      = RunNearPos.Depth;

            var Pos = ContentPos.Get(Depth);

            if (Pos >= CurPos)
            {
                ContentPos.Update2(Pos - CurPos, Depth);
                ContentPos.Update2(ParentPos + 1, Depth - 1);

                this.NearPosArray.splice(Index, 1);
                Count--;
                Index--;

                NewRun.NearPosArray.push(RunNearPos);

                if (this.Paragraph)
                {
                    for (var ParaIndex = 0, ParaCount = this.Paragraph.NearPosArray.length; ParaIndex < ParaCount; ParaIndex++)
                    {
                        var ParaNearPos = this.Paragraph.NearPosArray[ParaIndex];
                        if (ParaNearPos.Classes[ParaNearPos.Classes.length - 1] === this)
                            ParaNearPos.Classes[ParaNearPos.Classes.length - 1] = NewRun;
                    }
                }
            }
        }

		// Обновляем позиции в поиске
		for (var nIndex = 0, nSearchMarksCount = this.SearchMarks.length; nIndex < nSearchMarksCount; ++nIndex)
		{
			var oMark       = this.SearchMarks[nIndex];
			var oContentPos = oMark.Start ? oMark.SearchResult.StartPos : oMark.SearchResult.EndPos;
			var nDepth      = oMark.Depth;

			if (oContentPos.Get(nDepth) > CurPos || (oContentPos.Get(nDepth) === CurPos && oMark.Start))
			{
				this.SearchMarks.splice(nIndex, 1);
				NewRun.SearchMarks.splice(NewRun.SearchMarks.length, 0, oMark);
				oContentPos.Data[nDepth] -= CurPos;
				oContentPos.Data[nDepth - 1]++;

				if (oMark.Start)
					oMark.SearchResult.ClassesS[oMark.SearchResult.ClassesS.length - 1] = NewRun;
				else
					oMark.SearchResult.ClassesE[oMark.SearchResult.ClassesE.length - 1] = NewRun;

				nSearchMarksCount--;
				nIndex--;
			}
		}
    }


	// Разделяем содержимое по ранам
    NewRun.ConcatToContent( this.Content.slice(CurPos) );
    this.Remove_FromContent( CurPos, this.Content.length - CurPos, true );

    // Если были точки орфографии, тогда переместим их в новый ран
    var SpellingMarksCount = this.SpellingMarks.length;
    for ( var Index = 0; Index < SpellingMarksCount; Index++ )
    {
        var Mark    = this.SpellingMarks[Index];
        var MarkPos = ( true === Mark.Start ? Mark.Element.StartPos.Get(Mark.Depth) : Mark.Element.EndPos.Get(Mark.Depth) );

        if ( MarkPos >= CurPos )
        {
            var MarkElement = Mark.Element;
            if ( true === Mark.Start )
            {
                MarkElement.StartPos.Data[Mark.Depth] -= CurPos;
            }
            else
            {
                MarkElement.EndPos.Data[Mark.Depth] -= CurPos;
            }

            NewRun.SpellingMarks.push( Mark );

            this.SpellingMarks.splice( Index, 1 );
            SpellingMarksCount--;
            Index--;
        }
    }

    if (true === UpdateSelection)
    {
        if (ParentOldSelectionStartPos <= ParentPos && ParentPos <= ParentOldSelectionEndPos)
            Parent.Selection.EndPos = ParentOldSelectionEndPos + 1;
        else if (ParentOldSelectionEndPos <= ParentPos && ParentPos <= ParentOldSelectionStartPos)
            Parent.Selection.StartPos = ParentOldSelectionStartPos + 1;

        if (OldSelectionStartPos <= CurPos && CurPos <= OldSelectionEndPos)
        {
            this.Selection.EndPos = this.Content.length;
            NewRun.Selection.Use      = true;
            NewRun.Selection.StartPos = 0;
            NewRun.Selection.EndPos   = OldSelectionEndPos - CurPos;
        }
        else if (OldSelectionEndPos <= CurPos && CurPos <= OldSelectionStartPos)
        {
            this.Selection.StartPos = this.Content.length;
            NewRun.Selection.Use      = true;
            NewRun.Selection.EndPos   = 0;
            NewRun.Selection.StartPos = OldSelectionStartPos - CurPos;
        }
    }

    History.Add(new CChangesRunOnEndSplit(this, NewRun));
    AscCommon.CollaborativeEditing.OnEnd_SplitRun(NewRun);
    return NewRun;
};


ParaRun.prototype.Check_NearestPos = function(ParaNearPos, Depth)
{
    var RunNearPos = new CParagraphElementNearPos();
    RunNearPos.NearPos = ParaNearPos.NearPos;
    RunNearPos.Depth   = Depth;

    this.NearPosArray.push( RunNearPos );
    ParaNearPos.Classes.push( this );
};

ParaRun.prototype.Get_DrawingObjectRun = function(Id)
{
    var ContentLen = this.Content.length;
    for ( var CurPos = 0; CurPos < ContentLen; CurPos++ )
    {
        var Element = this.Content[CurPos];

        if ( para_Drawing === Element.Type && Id === Element.Get_Id() )
            return this;
    }

    return null;
};

ParaRun.prototype.Get_DrawingObjectContentPos = function(Id, ContentPos, Depth)
{
    var ContentLen = this.Content.length;
    for ( var CurPos = 0; CurPos < ContentLen; CurPos++ )
    {
        var Element = this.Content[CurPos];

        if ( para_Drawing === Element.Type && Id === Element.Get_Id() )
        {
            ContentPos.Update( CurPos, Depth );
            return true;
        }
    }

    return false;
};

ParaRun.prototype.Get_DrawingObjectSimplePos = function(Id)
{
    var ContentLen = this.Content.length;
    for (var CurPos = 0; CurPos < ContentLen; CurPos++)
    {
        var Element = this.Content[CurPos];
        if (para_Drawing === Element.Type && Id === Element.Get_Id())
            return CurPos;
    }

    return -1;
};

ParaRun.prototype.Remove_DrawingObject = function(Id)
{
    var ContentLen = this.Content.length;
    for ( var CurPos = 0; CurPos < ContentLen; CurPos++ )
    {
        var Element = this.Content[CurPos];

        if ( para_Drawing === Element.Type && Id === Element.Get_Id() )
        {
            var TrackRevisions = null;
            if (this.Paragraph && this.Paragraph.LogicDocument && this.Paragraph.bFromDocument)
                TrackRevisions = this.Paragraph.LogicDocument.IsTrackRevisions();

            if (true === TrackRevisions)
            {
                var ReviewType = this.GetReviewType();
                if (reviewtype_Common === ReviewType)
                {
                    // Разбиваем ран на две части
                    var StartPos = CurPos;
                    var EndPos = CurPos + 1;

                    var Parent = this.Get_Parent();
                    var RunPos = this.private_GetPosInParent(Parent);

                    if (-1 !== RunPos && Parent)
                    {
                        var DeletedRun = null;
                        if (StartPos <= 0 && EndPos >= this.Content.length)
                            DeletedRun = this;
                        else if (StartPos <= 0)
                        {
                            this.Split2(EndPos, Parent, RunPos);
                            DeletedRun = this;
                        }
                        else if (EndPos >= this.Content.length)
                        {
                            DeletedRun = this.Split2(StartPos, Parent, RunPos);
                        }
                        else
                        {
                            this.Split2(EndPos, Parent, RunPos);
                            DeletedRun = this.Split2(StartPos, Parent, RunPos);
                        }

                        DeletedRun.SetReviewType(reviewtype_Remove);
                    }
                }
                else if (reviewtype_Add === ReviewType)
                {
                    this.Remove_FromContent(CurPos, 1, true);
                }
                else if (reviewtype_Remove === ReviewType)
                {
                    // Ничего не делаем
                }
            }
            else
            {
                this.Remove_FromContent(CurPos, 1, true);
            }

            return;
        }
    }
};

ParaRun.prototype.Get_Layout = function(DrawingLayout, UseContentPos, ContentPos, Depth)
{
    var CurLine  = DrawingLayout.Line - this.StartLine;
    var CurRange = ( 0 === CurLine ? DrawingLayout.Range - this.StartRange : DrawingLayout.Range );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    var CurContentPos = ( true === UseContentPos ? ContentPos.Get(Depth) : -1 );

    var CurPos = StartPos;
    for ( ; CurPos < EndPos; CurPos++ )
    {
        if ( CurContentPos === CurPos )
            break;

        var Item         = this.Content[CurPos];
        var ItemType     = Item.Type;
        var WidthVisible = Item.Get_WidthVisible();

        switch ( ItemType )
        {
            case para_Text:
            case para_Space:
            case para_PageNum:
            case para_PageCount:
            {
                DrawingLayout.LastW = WidthVisible;

                break;
            }
            case para_Drawing:
            {
                if ( true === Item.Is_Inline() || true === DrawingLayout.Paragraph.Parent.Is_DrawingShape() )
                {
                    DrawingLayout.LastW = WidthVisible;
                }

                break;
            }
        }

        DrawingLayout.X += WidthVisible;
    }

    if (CurContentPos === CurPos)
        DrawingLayout.Layout = true;
};

ParaRun.prototype.GetNextRunElements = function(oRunElements, isUseContentPos, nDepth)
{
    var nStartPos  = true === isUseContentPos ? oRunElements.ContentPos.Get(nDepth) : 0;

    for (var nCurPos = nStartPos, nCount = this.Content.length; nCurPos < nCount; ++nCurPos)
    {
    	if (oRunElements.IsEnoughElements())
    		return;

		oRunElements.UpdatePos(nCurPos, nDepth);
		oRunElements.Add(this.Content[nCurPos]);
    }
};
ParaRun.prototype.GetPrevRunElements = function(oRunElements, isUseContentPos, nDepth)
{
    var nStartPos = true === isUseContentPos ? oRunElements.ContentPos.Get(nDepth) - 1 : this.Content.length - 1;

    for (var nCurPos = nStartPos; nCurPos >= 0; --nCurPos)
    {
    	if (oRunElements.IsEnoughElements())
    		return;

		oRunElements.UpdatePos(nCurPos, nDepth);
		oRunElements.Add(this.Content[nCurPos]);
    }
};

ParaRun.prototype.CollectDocumentStatistics = function(ParaStats)
{
	var Count = this.Content.length;
	for (var Index = 0; Index < Count; Index++)
	{
		var Item     = this.Content[Index];
		var ItemType = Item.Type;

		var bSymbol  = false;
		var bSpace   = false;
		var bNewWord = false;

		if ((para_Text === ItemType && false === Item.Is_NBSP()) || (para_PageNum === ItemType || para_PageCount === ItemType))
		{
			if (false === ParaStats.Word)
				bNewWord = true;

			bSymbol = true;
			bSpace  = false;

			ParaStats.Word           = true;
			ParaStats.EmptyParagraph = false;
		}
		else if ((para_Text === ItemType && true === Item.Is_NBSP()) || para_Space === ItemType || para_Tab === ItemType)
		{
			bSymbol = true;
			bSpace  = true;

			ParaStats.Word = false;
		}

		if (true === bSymbol)
			ParaStats.Stats.Add_Symbol(bSpace);

		if (true === bNewWord)
			ParaStats.Stats.Add_Word();
	}
};

ParaRun.prototype.Create_FontMap = function(Map)
{
    // для Math_Para_Pun argSize учитывается, когда мержатся текстовые настройки в Internal_Compile_Pr()
    if ( undefined !== this.Paragraph && null !== this.Paragraph )
    {
        var TextPr;
        var FontSize, FontSizeCS;
        if(this.Type === para_Math_Run)
        {
            TextPr = this.Get_CompiledPr(false);

            FontSize   = TextPr.FontSize;
            FontSizeCS = TextPr.FontSizeCS;

            if(null !== this.Parent && undefined !== this.Parent && null !== this.Parent.ParaMath && undefined !== this.Parent.ParaMath)
            {
                TextPr.FontSize   = this.Math_GetRealFontSize(TextPr.FontSize);
                TextPr.FontSizeCS = this.Math_GetRealFontSize(TextPr.FontSizeCS);
            }
        }
        else
            TextPr = this.Get_CompiledPr(false);

        TextPr.Document_CreateFontMap(Map, this.Paragraph.Get_Theme().themeElements.fontScheme);
        var Count = this.Content.length;
        for (var Index = 0; Index < Count; Index++)
        {
            var Item = this.Content[Index];

			if (para_Drawing === Item.Type)
				Item.documentCreateFontMap(Map);
			else if (para_FootnoteReference === Item.Type)
				Item.CreateDocumentFontMap(Map);
        }

        if(this.Type === para_Math_Run)
        {
            TextPr.FontSize   = FontSize;
            TextPr.FontSizeCS = FontSizeCS;
        }
    }
};

ParaRun.prototype.Get_AllFontNames = function(AllFonts)
{
	this.Pr.Document_Get_AllFontNames(AllFonts);

	var Count = this.Content.length;
	for (var Index = 0; Index < Count; Index++)
	{
		var Item = this.Content[Index];

		if (para_Drawing === Item.Type)
			Item.documentGetAllFontNames(AllFonts);
		else if (para_FootnoteReference === Item.Type)
			Item.GetAllFontNames(AllFonts);
	}
};

ParaRun.prototype.GetSelectedText = function(bAll, bClearText, oPr)
{
    var StartPos = 0;
    var EndPos   = 0;

    if ( true === bAll )
    {
        StartPos = 0;
        EndPos   = this.Content.length;
    }
    else if ( true === this.Selection.Use )
    {
        StartPos = this.State.Selection.StartPos;
        EndPos   = this.State.Selection.EndPos;

        if ( StartPos > EndPos )
        {
            var Temp = EndPos;
            EndPos   = StartPos;
            StartPos = Temp;
        }
    }

    var Str = "";

    for ( var Pos = StartPos; Pos < EndPos; Pos++ )
    {
        var Item = this.Content[Pos];
        var ItemType = Item.Type;

        switch ( ItemType )
        {
            case para_Drawing:
            case para_Numbering:
            case para_PresentationNumbering:
            case para_PageNum:
            case para_PageCount:
            {
                if ( true === bClearText )
                    return null;

                break;
            }

            case para_Text :
            {
                Str += AscCommon.encodeSurrogateChar(Item.Value);
                break;
            }
            case para_Space:
            case para_Tab  : Str += " "; break;
			case para_NewLine:
			{
				if (oPr && true === oPr.NewLine)
				{
					Str += '\r';
				}
				break;
			}
			case para_End:
			{
				if (oPr && true === oPr.NewLineParagraph)
				{
					if (this.Paragraph && null === this.Paragraph.Get_DocumentNext() && true === this.Paragraph.Parent.IsTableCellContent() && true !== this.Paragraph.Parent.IsLastTableCellInRow(true))
						Str += '\t';
					else
						Str += '\r\n';
				}

				break;
			}
        }
    }

    return Str;
};

ParaRun.prototype.GetSelectDirection = function()
{
    if (true !== this.Selection.Use)
        return 0;

    if (this.Selection.StartPos <= this.Selection.EndPos)
        return 1;

    return -1;
};

ParaRun.prototype.CanAddDropCap = function()
{
	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		switch (this.Content[nPos].Type)
		{
			case para_Text:
				return true;

			case para_Space:
			case para_Tab:
			case para_PageNum:
			case para_PageCount:
				return false;
		}
	}

	return null;
};

ParaRun.prototype.Get_TextForDropCap = function(DropCapText, UseContentPos, ContentPos, Depth)
{
    var EndPos = ( true === UseContentPos ? ContentPos.Get(Depth) : this.Content.length );

    for ( var Pos = 0; Pos < EndPos; Pos++ )
    {
        var Item = this.Content[Pos];
        var ItemType = Item.Type;

        if ( true === DropCapText.Check )
        {
			if (para_Space === ItemType || para_Tab === ItemType || para_PageNum === ItemType || para_PageCount === ItemType || para_Drawing === ItemType || para_End === ItemType)
            {
                DropCapText.Mixed = true;
                return;
            }
        }
        else
        {
            if ( para_Text === ItemType )
            {
                DropCapText.Runs.push(this);
                DropCapText.Text.push(Item);

                this.Remove_FromContent( Pos, 1, true );
                Pos--;
                EndPos--;

                if ( true === DropCapText.Mixed )
                    return;
            }
        }
    }
};

ParaRun.prototype.Get_StartTabsCount = function(TabsCounter)
{
    var ContentLen = this.Content.length;

    for ( var Pos = 0; Pos < ContentLen; Pos++ )
    {
        var Item = this.Content[Pos];
        var ItemType = Item.Type;

        if ( para_Tab === ItemType )
        {
            TabsCounter.Count++;
            TabsCounter.Pos.push( Pos );
        }
        else if ( para_Text === ItemType || para_Space === ItemType || (para_Drawing === ItemType && true === Item.Is_Inline() ) || para_PageNum === ItemType || para_PageCount === ItemType || para_Math === ItemType )
            return false;
    }

    return true;
};

ParaRun.prototype.Remove_StartTabs = function(TabsCounter)
{
    var ContentLen = this.Content.length;
    for ( var Pos = 0; Pos < ContentLen; Pos++ )
    {
        var Item = this.Content[Pos];
        var ItemType = Item.Type;

        if ( para_Tab === ItemType )
        {
            this.Remove_FromContent( Pos, 1, true );

            TabsCounter.Count--;
            Pos--;
            ContentLen--;
        }
        else if ( para_Text === ItemType || para_Space === ItemType || (para_Drawing === ItemType && true === Item.Is_Inline() ) || para_PageNum === ItemType || para_PageCount === ItemType || para_Math === ItemType )
            return false;
    }

    return true;
};
//-----------------------------------------------------------------------------------
// Функции пересчета
//-----------------------------------------------------------------------------------   
// Пересчитываем размеры всех элементов
ParaRun.prototype.Recalculate_MeasureContent = function()
{
	if (!this.RecalcInfo.IsMeasureNeed())
		return;

	var oTextPr = this.Get_CompiledPr(false);
	var oTheme  = this.Paragraph.Get_Theme();

	g_oTextMeasurer.SetTextPr(oTextPr, oTheme);
	g_oTextMeasurer.SetFontSlot(fontslot_ASCII);

	// Запрашиваем текущие метрики шрифта, под TextAscent мы будем понимать ascent + linegap(которые записаны в шрифте)
	this.TextHeight  = g_oTextMeasurer.GetHeight();
	this.TextDescent = Math.abs(g_oTextMeasurer.GetDescender());
	this.TextAscent  = this.TextHeight - this.TextDescent;
	this.TextAscent2 = g_oTextMeasurer.GetAscender();
	this.YOffset     = oTextPr.Position;

	var oInfoMathText;
	if (para_Math_Run == this.Type)
	{
		oInfoMathText = new CMathInfoTextPr({
			TextPr      : oTextPr,
			ArgSize     : this.Parent.Compiled_ArgSz.value,
			bNormalText : this.IsNormalText(),
			bEqArray    : this.Parent.IsEqArray()
		});
	}

	if (this.RecalcInfo.Measure)
	{
		for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
		{
			this.private_MeasureElement(nPos, oTextPr, oTheme, oInfoMathText);
		}
	}
	else
	{
		for (var nIndex = 0, nCount = this.RecalcInfo.MeasurePositions.length; nIndex < nCount; ++nIndex)
		{
			var nPos = this.RecalcInfo.MeasurePositions[nIndex];
			if (!this.Content[nPos])
				continue;

			this.private_MeasureElement(nPos, oTextPr, oTheme, oInfoMathText);
		}
	}

	this.RecalcInfo.Recalc = true;
	this.RecalcInfo.ResetMeasure();
};
ParaRun.prototype.private_MeasureElement = function(nPos, oTextPr, oTheme, oInfoMathText)
{
	var oParagraph = this.GetParagraph();

	var oItem     = this.Content[nPos];
	var nItemType = oItem.Type;

	if (para_Drawing === nItemType && oParagraph)
	{
		oItem.Parent          = oParagraph;
		oItem.DocumentContent = oParagraph.Parent;
		oItem.DrawingDocument = oParagraph.Parent.DrawingDocument;
	}

	// TODO: Как только избавимся от para_End переделать здесь
	if (para_End === nItemType && oParagraph)
	{
		var oEndTextPr = oParagraph.GetParaEndCompiledPr();
		g_oTextMeasurer.SetTextPr(oEndTextPr, oTheme);
		oItem.Measure(g_oTextMeasurer, oEndTextPr);
		return;
	}

	oItem.Measure(g_oTextMeasurer, oTextPr, oInfoMathText, this);

	if (para_Drawing === nItemType)
	{
		// После автофигур надо заново выставлять настройки
		g_oTextMeasurer.SetTextPr(oTextPr, oTheme);
		g_oTextMeasurer.SetFontSlot(fontslot_ASCII);
	}
};
ParaRun.prototype.Recalculate_Measure2 = function(Metrics)
{
    var TAscent  = Metrics.Ascent;
    var TDescent = Metrics.Descent;

    var Count = this.Content.length;
    for ( var Index = 0; Index < Count; Index++ )
    {
        var Item = this.Content[Index];
        var ItemType = Item.Type;

        if ( para_Text === ItemType )
        {
            var Temp = g_oTextMeasurer.Measure2(String.fromCharCode(Item.Value));

            if ( null === TAscent || TAscent < Temp.Ascent )
                TAscent = Temp.Ascent;

            if ( null === TDescent || TDescent > Temp.Ascent - Temp.Height )
                TDescent = Temp.Ascent - Temp.Height;
        }
    }

    Metrics.Ascent  = TAscent;
    Metrics.Descent = TDescent;
};

ParaRun.prototype.Recalculate_Range = function(PRS, ParaPr, Depth)
{
    if ( this.Paragraph !== PRS.Paragraph )
    {
        this.Paragraph = PRS.Paragraph;
        this.RecalcInfo.TextPr  = true;
        this.RecalcInfo.Measure = true;

        this.private_UpdateSpellChecking();
    }

    // Сначала измеряем элементы (можно вызывать каждый раз, внутри разруливается, чтобы измерялось 1 раз)
    this.Recalculate_MeasureContent();

    var CurLine  = PRS.Line - this.StartLine;
    var CurRange = ( 0 === CurLine ? PRS.Range - this.StartRange : PRS.Range );

    // Если мы рассчитываем первый отрезок в первой строке, тогда нам нужно обновить информацию о нумерации
    if ( 0 === CurRange && 0 === CurLine )
    {
        var PrevRecalcInfo = PRS.RunRecalcInfoLast;

        // Либо до этого ничего не было (изначально первая строка и первый отрезок), либо мы заново пересчитываем
        // первую строку и первый отрезок (из-за обтекания, например).
        if ( null === PrevRecalcInfo )
            this.RecalcInfo.NumberingAdd = true;
        else
            this.RecalcInfo.NumberingAdd = PrevRecalcInfo.NumberingAdd;

        this.RecalcInfo.NumberingUse  = false;
        this.RecalcInfo.NumberingItem = null;
    }

    // Сохраняем ссылку на информацию пересчета данного рана
    PRS.RunRecalcInfoLast = this.RecalcInfo;

    // Добавляем информацию о новом отрезке
    var RangeStartPos = this.protected_AddRange(CurLine, CurRange);
    var RangeEndPos   = 0;

    var Para                = PRS.Paragraph;

    var MoveToLBP           = PRS.MoveToLBP;
    var NewRange            = PRS.NewRange;
    var ForceNewPage        = PRS.ForceNewPage;
    var NewPage             = PRS.NewPage;
    var End                 = PRS.End;

    var Word                = PRS.Word;
    var StartWord           = PRS.StartWord;
    var FirstItemOnLine     = PRS.FirstItemOnLine;
	var EmptyLine           = PRS.EmptyLine;
    var TextOnLine          = PRS.TextOnLine;

    var RangesCount         = PRS.RangesCount;

    var SpaceLen            = PRS.SpaceLen;
    var WordLen             = PRS.WordLen;

    var X                   = PRS.X;
    var XEnd                = PRS.XEnd;

    var ParaLine            = PRS.Line;
    var ParaRange           = PRS.Range;
    var bMathWordLarge      = PRS.bMathWordLarge;
    var OperGapRight        = PRS.OperGapRight;
    var OperGapLeft         = PRS.OperGapLeft;

    var bInsideOper         = PRS.bInsideOper;
    var bContainCompareOper = PRS.bContainCompareOper;
    var bEndRunToContent    = PRS.bEndRunToContent;
    var bNoOneBreakOperator = PRS.bNoOneBreakOperator;
    var bForcedBreak        = PRS.bForcedBreak;

    var Pos = RangeStartPos;

    var ContentLen = this.Content.length;
    var XRange    = PRS.XRange;
    var oSectionPr = undefined;

	// TODO: Сделать возможность показывать инструкцию
    var isHiddenCFPart = PRS.ComplexFields.IsComplexFieldCode();

    PRS.CheckUpdateLBP(Pos, Depth);

    if (false === StartWord && true === FirstItemOnLine && XEnd - X < 0.001 && RangesCount > 0)
    {
        NewRange = true;
        RangeEndPos = Pos;
    }
    else
    {
        for (; Pos < ContentLen; Pos++)
        {
            var Item = this.Content[Pos];
            var ItemType = Item.Type;

            if (PRS.ComplexFields.IsHiddenFieldContent() && para_End !== ItemType && para_FieldChar !== ItemType)
            	continue;

			if (para_InstrText === ItemType && !PRS.IsFastRecalculate())
			{
				var oInstrText = Item;
				if (!PRS.ComplexFields.IsComplexFieldCode())
				{
					if (32 === Item.Value)
					{
						Item     = new ParaSpace();
						ItemType = para_Space;
					}
					else
					{
						Item     = new ParaText(Item.Value);
						ItemType = para_Text;
					}
					Item.Measure(g_oTextMeasurer, this.Get_CompiledPr(false));
					oInstrText.SetReplacementItem(Item);
				}
				else
				{
					oInstrText.SetReplacementItem(null);
				}
			}

			if (isHiddenCFPart && para_End !== ItemType && para_FieldChar !== ItemType)
				continue;

			// Проверяем, не нужно ли добавить нумерацию к данному элементу
            if (true === this.RecalcInfo.NumberingAdd && true === Item.Can_AddNumbering())
                X = this.private_RecalculateNumbering(PRS, Item, ParaPr, X);

            switch (ItemType)
            {
                case para_Sym:
                case para_Text:
                case para_FootnoteReference:
                case para_FootnoteRef:
                case para_Separator:
                case para_ContinuationSeparator:
                {
                    // Отмечаем, что началось слово
                    StartWord = true;

					if (para_ContinuationSeparator === ItemType || para_Separator === ItemType)
						Item.UpdateWidth(PRS);

					if (true !== PRS.IsFastRecalculate())
					{
						if (para_FootnoteReference === ItemType)
						{
							if (this.GetLogicDocument() && !this.GetLogicDocument().RecalcTableHeader)
							{
								Item.UpdateNumber(PRS, this.GetLogicDocument().PrintSelection);
								PRS.AddFootnoteReference(Item, PRS.GetCurrentContentPos(Pos));
							}
							else
							{
								Item.private_Measure();
							}
						}
						else if (para_FootnoteRef === ItemType)
						{
							Item.UpdateNumber(PRS.TopDocument);
						}
					}

                    // При проверке, убирается ли слово, мы должны учитывать ширину предшествующих пробелов.
                    var LetterLen = Item.Width / TEXTWIDTH_DIVIDER;//var LetterLen = Item.Get_Width();

                    if (true !== Word)
                    {
                        // Слово только началось. Делаем следующее:
                        // 1) Если до него на строке ничего не было и данная строка не
                        //    имеет разрывов, тогда не надо проверять убирается ли слово в строке.
                        // 2) В противном случае, проверяем убирается ли слово в промежутке.

                        // Если слово только началось, и до него на строке ничего не было, и в строке нет разрывов, тогда не надо проверять убирается ли оно на строке.
                        if (true !== FirstItemOnLine || false === Para.Internal_Check_Ranges(ParaLine, ParaRange))
						{
							if (X + SpaceLen + LetterLen > XEnd)
							{
								if (para_Text === ItemType && !Item.CanBeAtBeginOfLine() && !PRS.LineBreakFirst)
								{
									MoveToLBP = true;
									NewRange  = true;
								}
								else
								{
									NewRange    = true;
									RangeEndPos = Pos;
								}
							}
						}

                        if (true !== NewRange)
                        {
                        	// Если с данного элемента не может начинаться строка, тогда считает все пробелы идущие
							// до него частью этого слова.
							// Если места для разрыва строки еще не было, значит это все еще первый элемент идет, и
							// тогда общую ширину пробелов прибавляем к ширине символа.
							// Если разрыв были и с данного символа не может начинаться строка, тогда испоьльзуем
							// предыдущий разрыв.
							if (para_Text === ItemType)
							{
								if (PRS.LineBreakFirst && !Item.CanBeAtBeginOfLine())
								{
									FirstItemOnLine = true;
									LetterLen       = LetterLen + SpaceLen;
									SpaceLen        = 0;
								}
								else if (Item.CanBeAtBeginOfLine())
								{
									PRS.Set_LineBreakPos(Pos, FirstItemOnLine);
								}
							}

                            // Если текущий символ с переносом, например, дефис, тогда на нем заканчивается слово
                            if (Item.Flags & PARATEXT_FLAGS_SPACEAFTER)//if ( true === Item.IsSpaceAfter() )
							{
								// Добавляем длину пробелов до слова и ширину самого слова.
								X += SpaceLen + LetterLen;

								Word            = false;
								FirstItemOnLine = false;
								EmptyLine       = false;
								TextOnLine      = true;
								SpaceLen        = 0;
								WordLen         = 0;
							}
                            else
							{
								Word    = true;
								WordLen = LetterLen;
							}
						}
                    }
                    else
                    {
                        if(X + SpaceLen + WordLen + LetterLen > XEnd)
                        {
                            if(true === FirstItemOnLine)
                            {
                                // Слово оказалось единственным элементом в промежутке, и, все равно,
                                // не умещается целиком. Делаем следующее:
                                //
                                //
                                // 1) Если у нас строка без вырезов, тогда ставим перенос строки на
                                //    текущей позиции.
                                // 2) Если у нас строка с вырезом, и данный вырез не последний, тогда
                                //    ставим перенос внутри строки в начале слова.
                                // 3) Если у нас строка с вырезом и вырез последний, тогда ставим перенос
                                //    строки в начале слова.

                                if (false === Para.Internal_Check_Ranges(ParaLine, ParaRange))
                                {
                                    // Слово не убирается в отрезке. Переносим слово в следующий отрезок
                                    MoveToLBP = true;
                                    NewRange = true;
                                }
                                else
                                {
                                    EmptyLine = false;
									TextOnLine = true;
                                    X += WordLen;

                                    // Слово не убирается в отрезке, но, поскольку, слово 1 на строке и отрезок тоже 1,
                                    // делим слово в данном месте
                                    NewRange = true;
                                    RangeEndPos = Pos;
                                }
                            }
                            else
                            {
                                // Слово не убирается в отрезке. Переносим слово в следующий отрезок
                                MoveToLBP = true;
                                NewRange = true;
                            }
                        }

                        if (true !== NewRange)
                        {
                            // Мы убираемся в пределах данной строки. Прибавляем ширину буквы к ширине слова
                            WordLen += LetterLen;

                            // Если текущий символ с переносом, например, дефис, тогда на нем заканчивается слово
                            if (Item.Flags & PARATEXT_FLAGS_SPACEAFTER)//if ( true === Item.IsSpaceAfter() )
                            {
                                // Добавляем длину пробелов до слова и ширину самого слова.
                                X += SpaceLen + WordLen;

                                Word = false;
                                FirstItemOnLine = false;
                                EmptyLine = false;
								TextOnLine = true;
                                SpaceLen = 0;
                                WordLen = 0;
                            }
                        }
                    }

                    break;
                }
                case para_Math_Text:
                case para_Math_Ampersand:
                case para_Math_Placeholder:
                {
                    // Отмечаем, что началось слово
                    StartWord = true;

                    // При проверке, убирается ли слово, мы должны учитывать ширину предшествующих пробелов.
                    var LetterLen = Item.Get_Width2() / TEXTWIDTH_DIVIDER;//var LetterLen = Item.Get_Width();

                    if (true !== Word)
                    {
                        // Если слово только началось, и до него на строке ничего не было, и в строке нет разрывов, тогда не надо проверять убирается ли оно на строке.
                        if (true !== FirstItemOnLine /*|| false === Para.Internal_Check_Ranges(ParaLine, ParaRange)*/)
                        {
                            if (X + SpaceLen + LetterLen > XEnd)
                            {
                                NewRange = true;
                                RangeEndPos = Pos;
                            }
                            else if(bForcedBreak == true)
                            {
                                MoveToLBP = true;
                                NewRange = true;
                                PRS.Set_LineBreakPos(Pos, FirstItemOnLine);
                            }
                        }

                        if(true !== NewRange)
                        {
                            if(this.Parent.bRoot == true)
                                PRS.Set_LineBreakPos(Pos, FirstItemOnLine);

                            WordLen += LetterLen;
                            Word = true;
                        }

                    }
                    else
                    {
                        if(X + SpaceLen + WordLen + LetterLen > XEnd)
                        {
                            if(true === FirstItemOnLine /*&& true === Para.Internal_Check_Ranges(ParaLine, ParaRange)*/)
                            {
                                // Слово оказалось единственным элементом в промежутке, и, все равно, не умещается целиком.
                                // для Формулы слово не разбиваем, перенос не делаем, пишем в одну строку (слово выйдет за границу как в Ворде)

                                bMathWordLarge = true;

                            }
                            else
                            {
                                // Слово не убирается в отрезке. Переносим слово в следующий отрезок
                                MoveToLBP = true;
                                NewRange = true;
                            }
                        }

                        if (true !== NewRange)
                        {
                            // Мы убираемся в пределах данной строки. Прибавляем ширину буквы к ширине слова
                            WordLen += LetterLen;
                        }
                    }

                    break;
                }
                case para_Space:
                {
					Item.CheckCondensedWidth(PRS.IsCondensedSpaces());

					if (Word && PRS.LastItem && para_Text === PRS.LastItem.Type && !PRS.LastItem.CanBeAtEndOfLine())
					{
						WordLen += Item.Width / TEXTWIDTH_DIVIDER;//SpaceLen += Item.Get_Width();
						break;
					}

                    FirstItemOnLine = false;

                    if (true === Word)
                    {
                        // Добавляем длину пробелов до слова + длина самого слова. Не надо проверять
                        // убирается ли слово, мы это проверяем при добавленнии букв.
                        X += SpaceLen + WordLen;

                        Word = false;
                        EmptyLine = false;
						TextOnLine = true;
                        SpaceLen = 0;
                        WordLen = 0;
                    }

                    // На пробеле не делаем перенос. Перенос строки или внутристрочный
                    // перенос делаем при добавлении любого непробельного символа
                    SpaceLen += Item.Width / TEXTWIDTH_DIVIDER;//SpaceLen += Item.Get_Width();

                    break;
                }
                case para_Math_BreakOperator:
                {
                    var BrkLen = Item.Get_Width2()/TEXTWIDTH_DIVIDER;

                    var bCompareOper = Item.Is_CompareOperator();
                    var bOperBefore = this.ParaMath.Is_BrkBinBefore() == true;

                    var bOperInEndContent = bOperBefore === false && bEndRunToContent === true && Pos == ContentLen - 1 && Word == true, // необходимо для того, чтобы у контентов мат объектов (к-ые могут разбиваться на строки) не было отметки Set_LineBreakPos, иначе скобка (или GapLeft), перед которой стоит break_Operator, перенесется на следующую строку (без текста !)
                        bLowPriority      = bCompareOper == false && bContainCompareOper == false;

                    if(Pos == 0 && true === this.IsForcedBreak()) // принудительный перенос срабатывает всегда
                    {
                        if(FirstItemOnLine === true && Word == false && bNoOneBreakOperator == true) // первый оператор в строке
                        {
                            WordLen += BrkLen;
                        }
                        else if(bOperBefore)
                        {
                            X += SpaceLen + WordLen;
                            WordLen = 0;
                            SpaceLen = 0;
                            NewRange = true;
                            RangeEndPos = Pos;

                        }
                        else
                        {
                            if(FirstItemOnLine == false && X + SpaceLen + WordLen + BrkLen > XEnd)
                            {
                                MoveToLBP = true;
                                NewRange = true;
                            }
                            else
                            {
                                X += SpaceLen + WordLen;
                                Word = false;
                                MoveToLBP = true;
                                NewRange = true;
                                PRS.Set_LineBreakPos(1, FirstItemOnLine);
                            }
                        }
                    }
                    else if(bOperInEndContent || bLowPriority) // у этого break Operator приоритет низкий(в контенте на данном уровне есть другие операторы с более высоким приоритетом) => по нему не разбиваем, обрабатываем как обычную букву
                    {
                        if(X + SpaceLen + WordLen + BrkLen > XEnd)
                        {
                            if(FirstItemOnLine == true)
                            {
                                bMathWordLarge = true;
                            }
                            else
                            {
                                // Слово не убирается в отрезке. Переносим слово в следующий отрезок
                                MoveToLBP = true;
                                NewRange = true;
                            }
                        }
                        else
                        {
                            WordLen += BrkLen;
                        }
                    }
                    else
                    {
                        var WorLenCompareOper = WordLen + X - XRange + (bOperBefore  ? SpaceLen : BrkLen);

                        var bOverXEnd, bOverXEndMWordLarge;
                        var bNotUpdBreakOper = false;

                        var bCompareWrapIndent = PRS.bFirstLine == true ? WorLenCompareOper > PRS.WrapIndent : true;

                        if(PRS.bPriorityOper == true && bCompareOper == true && bContainCompareOper == true && bCompareWrapIndent == true && !(Word == false && FirstItemOnLine === true)) // (Word == true && FirstItemOnLine == true) - не первый элемент в строке
                            bContainCompareOper = false;

                        if(bOperBefore)  // оператор "до" => оператор находится в начале строки
                        {
                            bOverXEnd = X + WordLen + SpaceLen + BrkLen > XEnd; // BrkLen прибавляем дла случая, если идут подряд Brk Operators в конце
                            bOverXEndMWordLarge = X + WordLen + SpaceLen > XEnd; // ширину самого оператора не учитываем при расчете bMathWordLarge, т.к. он будет находится на следующей строке

                            if(bOverXEnd && (true !== FirstItemOnLine || true === Word))
                            {
                                // если вышли за границы не обновляем параметр bInsideOper, т.к. если уже были breakOperator, то, соответственно, он уже выставлен в true
                                // а если на этом уровне не было breakOperator, то и обновлять его нне нужо

                                if(FirstItemOnLine === false)
                                {
                                    MoveToLBP = true;
                                    NewRange = true;
                                }
                                else
                                {
                                    if(Word == true && bOverXEndMWordLarge == true)
                                    {
                                        bMathWordLarge = true;
                                    }

                                    X += SpaceLen + WordLen;

                                    if(PRS.bBreakPosInLWord == true)
                                    {
                                        PRS.Set_LineBreakPos(Pos, FirstItemOnLine);

                                    }
                                    else
                                    {
                                        bNotUpdBreakOper = true;
                                    }

                                    RangeEndPos = Pos;

                                    SpaceLen = 0;
                                    WordLen = 0;

                                    NewRange = true;
                                    EmptyLine = false;
									TextOnLine = true;
                                }
                            }
                            else
                            {
                                if(FirstItemOnLine === false)
                                    bInsideOper = true;


                                if(Word == false && FirstItemOnLine == true )
                                {
                                    SpaceLen += BrkLen;
                                }
                                else
                                {
                                    // проверка на FirstItemOnLine == false нужна для случая, если иду подряд несколько breakOperator
                                    // в этом случае Word == false && FirstItemOnLine == false, нужно также поставить отметку для потенциального переноса

                                    X += SpaceLen + WordLen;
                                    PRS.Set_LineBreakPos(Pos, FirstItemOnLine);
                                    EmptyLine = false;
									TextOnLine = true;
                                    WordLen = BrkLen;
                                    SpaceLen = 0;

                                }

                                // в первой строке может не быть ни одного break Operator, при этом слово не выходит за границы, т.о. обновляем FirstItemOnLine также и на Word = true
                                // т.к. оператор идет в начале строки, то соответственно слово в стоке не будет первым, если в строке больше одного оператора
                                if(bNoOneBreakOperator == false || Word == true)
                                    FirstItemOnLine = false;

                            }
                        }
                        else   // оператор "после" => оператор находится в конце строки
                        {
                            bOverXEnd = X + WordLen + BrkLen - Item.GapRight > XEnd;
                            bOverXEndMWordLarge = bOverXEnd;

                            if(bOverXEnd && FirstItemOnLine === false) // Слово не убирается в отрезке. Переносим слово в следующий отрезок
                            {
                                MoveToLBP = true;
                                NewRange = true;

                                if(Word == false)
                                    PRS.Set_LineBreakPos(Pos, FirstItemOnLine);
                            }
                            else
                            {
                                bInsideOper = true;

                                // осуществляем здесь, чтобы не изменить GapRight в случае, когда новое слово не убирается на break_Operator
                                OperGapRight = Item.GapRight;

                                if(bOverXEndMWordLarge == true) // FirstItemOnLine == true
                                {
                                    bMathWordLarge = true;

                                }

                                X += BrkLen + WordLen;

                                EmptyLine = false;
								TextOnLine = true;
                                SpaceLen = 0;
                                WordLen = 0;

                                var bNotUpdate = bOverXEnd == true && PRS.bBreakPosInLWord == false;

                                // FirstItemOnLine == true
                                if(bNotUpdate == false) // LineBreakPos обновляем здесь, т.к. слово может начаться с мат объекта, а не с Run, в мат объекте нет соответствующей проверки
								{
									PRS.Set_LineBreakPos(Pos + 1, FirstItemOnLine);
								}
                                else
                                {
                                    bNotUpdBreakOper = true;
                                }

                                FirstItemOnLine = false;

                                Word = false;
                            }
                        }
                    }

                    if(bNotUpdBreakOper == false)
                        bNoOneBreakOperator = false;

                    break;
                }
                case para_Drawing:
                {
                    if(oSectionPr === undefined)
                    {
                        oSectionPr = Para.Get_SectPr();
                    }
                    Item.CheckRecalcAutoFit(oSectionPr);
                    if (true === Item.Is_Inline() || true === Para.Parent.Is_DrawingShape())
                    {
                    	// TODO: Нельзя что-то писать в историю во время пересчета, это действие надо делать при открытии
                        // if (true !== Item.Is_Inline())
                        //     Item.Set_DrawingType(drawing_Inline);

                        if (true === StartWord)
                            FirstItemOnLine = false;

                        Item.YOffset = this.YOffset;

                        // Если до этого было слово, тогда не надо проверять убирается ли оно, но если стояли пробелы,
                        // тогда мы их учитываем при проверке убирается ли данный элемент, и добавляем только если
                        // данный элемент убирается
                        if (true === Word || WordLen > 0)
                        {
                            // Добавляем длину пробелов до слова + длина самого слова. Не надо проверять
                            // убирается ли слово, мы это проверяем при добавленнии букв.
                            X += SpaceLen + WordLen;

                            Word = false;
                            EmptyLine = false;
							TextOnLine = true;
                            SpaceLen = 0;
                            WordLen = 0;
                        }

                        var DrawingWidth = Item.Get_Width();
                        if (X + SpaceLen + DrawingWidth > XEnd && ( false === FirstItemOnLine || false === Para.Internal_Check_Ranges(ParaLine, ParaRange) ))
                        {
                            // Автофигура не убирается, ставим перенос перед ней
                            NewRange = true;
                            RangeEndPos = Pos;
                        }
                        else
                        {
                            // Добавляем длину пробелов до автофигуры
                            X += SpaceLen + DrawingWidth;

                            FirstItemOnLine = false;
                            EmptyLine = false;
                        }

                        SpaceLen = 0;
                    }
                    else if (!Item.IsSkipOnRecalculate())
                    {
                        // Основная обработка происходит в Recalculate_Range_Spaces. Здесь обрабатывается единственный случай,
                        // когда после второго пересчета с уже добавленной картинкой оказывается, что место в параграфе, где
                        // идет картинка ушло на следующую страницу. В этом случае мы ставим перенос страницы перед картинкой.

                        var LogicDocument = Para.Parent;
                        var LDRecalcInfo = LogicDocument.RecalcInfo;
                        var DrawingObjects = LogicDocument.DrawingObjects;
                        var CurPage = PRS.Page;

                        if (true === LDRecalcInfo.Check_FlowObject(Item) && true === LDRecalcInfo.Is_PageBreakBefore())
                        {
                            LDRecalcInfo.Reset();

                            // Добавляем разрыв страницы. Если это первая страница, тогда ставим разрыв страницы в начале параграфа,
                            // если нет, тогда в начале текущей строки.

                            if (null != Para.Get_DocumentPrev() && true != Para.Parent.IsTableCellContent() && 0 === CurPage)
                            {
                                Para.Recalculate_Drawing_AddPageBreak(0, 0, true);
                                PRS.RecalcResult = recalcresult_NextPage | recalcresultflags_Page;
                                PRS.NewRange = true;
                                return;
                            }
                            else
                            {
                                if (ParaLine != Para.Pages[CurPage].FirstLine)
                                {
                                    Para.Recalculate_Drawing_AddPageBreak(ParaLine, CurPage, false);
                                    PRS.RecalcResult = recalcresult_NextPage | recalcresultflags_Page;
                                    PRS.NewRange = true;
                                    return;
                                }
                                else
                                {
                                    RangeEndPos = Pos;
                                    NewRange = true;
                                    ForceNewPage = true;
                                }
                            }


                            // Если до этого было слово, тогда не надо проверять убирается ли оно
                            if (true === Word || WordLen > 0)
                            {
                                // Добавляем длину пробелов до слова + длина самого слова. Не надо проверять
                                // убирается ли слово, мы это проверяем при добавленнии букв.
                                X += SpaceLen + WordLen;

                                Word = false;
                                SpaceLen = 0;

                                WordLen = 0;
                            }
                        }
                    }

                    break;
                }
                case para_PageCount:
                case para_PageNum:
                {
                    if (para_PageCount === ItemType)
                    {
                        var oHdrFtr = Para.Parent.IsHdrFtr(true);
                        if (oHdrFtr)
                            oHdrFtr.Add_PageCountElement(Item);
                    }
                    else if (para_PageNum === ItemType)
                    {
                        var LogicDocument = Para.LogicDocument;
                        var SectionPage   = LogicDocument.Get_SectionPageNumInfo2(Para.Get_AbsolutePage(PRS.Page)).CurPage;

                        Item.Set_Page(SectionPage);
                    }

                    // Если до этого было слово, тогда не надо проверять убирается ли оно, но если стояли пробелы,
                    // тогда мы их учитываем при проверке убирается ли данный элемент, и добавляем только если
                    // данный элемент убирается
                    if (true === Word || WordLen > 0)
                    {
                        // Добавляем длину пробелов до слова + длина самого слова. Не надо проверять
                        // убирается ли слово, мы это проверяем при добавленнии букв.
                        X += SpaceLen + WordLen;

                        Word = false;
                        EmptyLine = false;
						TextOnLine = true;
                        SpaceLen = 0;
                        WordLen = 0;
                    }

                    // Если на строке начиналось какое-то слово, тогда данная строка уже не пустая
                    if (true === StartWord)
                        FirstItemOnLine = false;

                    var PageNumWidth = Item.Get_Width();
                    if (X + SpaceLen + PageNumWidth > XEnd && ( false === FirstItemOnLine || false === Para.Internal_Check_Ranges(ParaLine, ParaRange) ))
                    {
                        // Данный элемент не убирается, ставим перенос перед ним
                        NewRange = true;
                        RangeEndPos = Pos;
                    }
                    else
                    {
                        // Добавляем длину пробелов до слова и ширину данного элемента
                        X += SpaceLen + PageNumWidth;

                        FirstItemOnLine = false;
                        EmptyLine = false;
						TextOnLine = true;
                    }

                    SpaceLen = 0;

                    break;
                }
                case para_Tab:
                {
                    // Сначала проверяем, если у нас уже есть таб, которым мы должны рассчитать, тогда высчитываем
                    // его ширину.

					var isLastTabToRightEdge = PRS.LastTab && -1 !== PRS.LastTab.Value ? PRS.LastTab.TabRightEdge : false;

                    X = this.private_RecalculateLastTab(PRS.LastTab, X, XEnd, Word, WordLen, SpaceLen);

                    // Добавляем длину пробелов до слова + длина самого слова. Не надо проверять
                    // убирается ли слово, мы это проверяем при добавленнии букв.
                    X += SpaceLen + WordLen;
                    Word = false;
                    SpaceLen = 0;
                    WordLen = 0;

                    var TabPos   = Para.private_RecalculateGetTabPos(X, ParaPr, PRS.Page, false);
                    var NewX     = TabPos.NewX;
                    var TabValue = TabPos.TabValue;

                    Item.SetLeader(TabPos.TabLeader);

					PRS.LastTab.TabPos       = NewX;
					PRS.LastTab.Value        = TabValue;
					PRS.LastTab.X            = X;
					PRS.LastTab.Item         = Item;
					PRS.LastTab.TabRightEdge = TabPos.TabRightEdge;

					var oLogicDocument     = PRS.Paragraph.LogicDocument;
					var nCompatibilityMode = oLogicDocument && oLogicDocument.GetCompatibilityMode ? oLogicDocument.GetCompatibilityMode() : document_compatibility_mode_Current;

					// Если таб не левый, значит он не может быть сразу рассчитан, а если левый, тогда
                    // рассчитываем его сразу здесь
                    if (tab_Left !== TabValue)
                    {
						Item.Width        = 0;
						Item.WidthVisible = 0;

						// В Word2013 и раньше, если не левый таб заканчивается правее правой границы, тогда у параграфа
						// правая граница имеет максимально возможное значение (55см)
						if (AscCommon.MMToTwips(TabPos.NewX) > AscCommon.MMToTwips(XEnd) && nCompatibilityMode <= document_compatibility_mode_Word14)
						{
							Para.Lines[PRS.Line].Ranges[PRS.Range].XEnd = 558.7;
							XEnd                                        = 558.7;
							PRS.BadLeftTab                              = true;
						}
                    }
                    else
					{
						// TODO: Если таб расположен между правым полем страницы и правым отступом параграфа (отступ
						// должен быть положительным), то начиная с версии document_compatibility_mode_Word15
						// табы немного неправильно рассчитываются. Смотри файл "Табы. Рассчет табов рядом с правым краем(2016).docx"

						var twX    = AscCommon.MMToTwips(X);
						var twXEnd = AscCommon.MMToTwips(XEnd);
						var twNewX = AscCommon.MMToTwips(NewX);

						if (nCompatibilityMode <= document_compatibility_mode_Word14
							&& !isLastTabToRightEdge
							&& true !== TabPos.DefaultTab
							&& (twNewX >= twXEnd && XEnd < 558.7 && PRS.Range >= PRS.RangesCount - 1))
						{
							Para.Lines[PRS.Line].Ranges[PRS.Range].XEnd = 558.7;
							XEnd                                        = 558.7;
							PRS.BadLeftTab                              = true;

							twXEnd = AscCommon.MMToTwips(XEnd);
						}

						if (!PRS.BadLeftTab
							&& (false === FirstItemOnLine || false === Para.Internal_Check_Ranges(ParaLine, ParaRange))
							&& (((TabPos.DefaultTab || PRS.Range < PRS.RangesCount - 1) && twNewX > twXEnd)
							|| (!TabPos.DefaultTab && twNewX > AscCommon.MMToTwips(TabPos.PageXLimit))))
						{
							WordLen     = NewX - X;
							RangeEndPos = Pos;
							NewRange    = true;
						}
						else
						{
							Item.Width        = NewX - X;
							Item.WidthVisible = NewX - X;

							X = NewX;
						}
                    }

					// Считаем, что с таба начинается слово
					PRS.Set_LineBreakPos(Pos, FirstItemOnLine);

                    // Если перенос идет по строке, а не из-за обтекания, тогда разрываем перед табом, а если
                    // из-за обтекания, тогда разрываем перед последним словом, идущим перед табом
                    if (RangesCount === CurRange)
                    {
                        if (true === StartWord)
                        {
                            FirstItemOnLine = false;
                            EmptyLine = false;
							TextOnLine = true;
                        }
                    }


                    StartWord = true;
                    Word = true;

                    break;
                }
                case para_NewLine:
                {
                    // Сначала проверяем, если у нас уже есть таб, которым мы должны рассчитать, тогда высчитываем
                    // его ширину.
                    X = this.private_RecalculateLastTab(PRS.LastTab, X, XEnd, Word, WordLen, SpaceLen);

                    X += WordLen;

                    if (true === Word)
                    {
                        EmptyLine = false;
						TextOnLine = true;
                        Word = false;
                        X += SpaceLen;
                        SpaceLen = 0;
                    }

                    if (break_Page === Item.BreakType || break_Column === Item.BreakType)
                    {
                        PRS.BreakPageLine = true;
                        if (break_Page === Item.BreakType)
                            PRS.BreakRealPageLine = true;

						// Учитываем разрыв страницы/колонки, только если мы находимся в главной части документа, либо
						// во вложенной в нее SdtContent (вложение может быть многоуровневым)
                        var oParent = Para.Parent;
                        while (oParent instanceof CDocumentContent && oParent.IsBlockLevelSdtContent())
							oParent = oParent.GetParent().GetParent();

						if (!(oParent instanceof CDocument) || true !== Para.Is_Inline())
						{
							// TODO: Продумать, как избавиться от данного элемента, т.к. удалять его при пересчете нельзя,
							//       иначе будут проблемы с совместным редактированием.

							Item.Flags.Use = false;
							continue;
						}

						if (break_Page === Item.BreakType && !Para.CheckSplitPageOnPageBreak(Item))
                            continue;

                        Item.Flags.NewLine = true;

                        NewPage       = true;
                        NewRange      = true;
                    }
                    else
                    {
                    	PRS.BreakLine = true;

                        NewRange = true;
                        EmptyLine = false;
						TextOnLine = true;

                        // здесь оставляем проверку, т.к. в случае, если после неинлайновой формулы нах-ся инлайновая необходимо в любом случае сделать перенос (проверка в private_RecalculateRange(), где выставляется PRS.ForceNewLine = true не пройдет)
                        if (true === PRS.MathNotInline)
                            PRS.ForceNewLine = true;
                    }

                    RangeEndPos = Pos + 1;

                    break;
                }
                case para_End:
                {
                    if (true === Word)
                    {
                        FirstItemOnLine = false;
                        EmptyLine       = false;
						TextOnLine      = true;
                    }

                    X += WordLen;

                    if (true === Word)
                    {
                        X += SpaceLen;
                        SpaceLen = 0;
                        WordLen  = 0;
                    }

                    X = this.private_RecalculateLastTab(PRS.LastTab, X, XEnd, Word, WordLen, SpaceLen);

                    NewRange = true;
                    End      = true;

                    RangeEndPos = Pos + 1;

                    break;
                }
				case para_FieldChar:
				{
					if (PRS.IsFastRecalculate())
						break;

					Item.SetXY(X + SpaceLen + WordLen, PRS.Y);
					Item.SetPage(Para.Get_AbsolutePage(CurPage));

					Item.SetRun(this);
					PRS.ComplexFields.ProcessFieldChar(Item);

					isHiddenCFPart = PRS.ComplexFields.IsComplexFieldCode();

					if (Item.IsSeparate() && !isHiddenCFPart)
					{
						// Специальная ветка, для полей PAGE и NUMPAGES, находящихся в колонтитуле
						var oComplexField = Item.GetComplexField();
						var oHdrFtr       = Para.Parent.IsHdrFtr(true);

						if (oHdrFtr && !oComplexField && this.Paragraph)
						{
							// Т.к. Recalculate_Width запускается после Recalculate_Range, то возможен случай, когда у нас
							// поля еще не собраны, но в колонтитулах они нам нужны уже собранные
							this.Paragraph.ProcessComplexFields();
							oComplexField = Item.GetComplexField();
						}

						if (oHdrFtr && oComplexField)
						{
							var oInstruction = oComplexField.GetInstruction();
							if (oInstruction && (fieldtype_NUMPAGES === oInstruction.GetType() || fieldtype_PAGE === oInstruction.GetType() || fieldtype_FORMULA === oInstruction.GetType()))
							{
								if (fieldtype_NUMPAGES === oInstruction.GetType())
								{
									oHdrFtr.Add_PageCountElement(Item);
								}
								else if (fieldtype_PAGE === oInstruction.GetType())
								{
									var LogicDocument = Para.LogicDocument;
									var SectionPage   = LogicDocument.Get_SectionPageNumInfo2(Para.Get_AbsolutePage(PRS.Page)).CurPage;
									Item.SetNumValue(SectionPage);
								}
								else
								{
									var sValue = oComplexField.CalculateValue();
									var nValue = parseInt(sValue);
									if (isNaN(nValue))
										nValue = 0;

									Item.SetNumValue(nValue);
								}
							}

							// Если до этого было слово, тогда не надо проверять убирается ли оно, но если стояли пробелы,
							// тогда мы их учитываем при проверке убирается ли данный элемент, и добавляем только если
							// данный элемент убирается
							if (true === Word || WordLen > 0)
							{
								// Добавляем длину пробелов до слова + длина самого слова. Не надо проверять
								// убирается ли слово, мы это проверяем при добавленнии букв.
								X += SpaceLen + WordLen;

								Word = false;
								EmptyLine = false;
								TextOnLine = true;
								SpaceLen = 0;
								WordLen = 0;
							}

							// Если на строке начиналось какое-то слово, тогда данная строка уже не пустая
							if (true === StartWord)
								FirstItemOnLine = false;

							var PageNumWidth = Item.Get_Width();
							if (X + SpaceLen + PageNumWidth > XEnd && ( false === FirstItemOnLine || false === Para.Internal_Check_Ranges(ParaLine, ParaRange) ))
							{
								// Данный элемент не убирается, ставим перенос перед ним
								NewRange = true;
								RangeEndPos = Pos;
							}
							else
							{
								// Добавляем длину пробелов до слова и ширину данного элемента
								X += SpaceLen + PageNumWidth;

								FirstItemOnLine = false;
								EmptyLine = false;
								TextOnLine = true;
							}

							SpaceLen = 0;
						}
						else
						{
							Item.SetNumValue(null);
						}
					}

					break;
				}
            }

            if (para_Space !== ItemType)
            	PRS.LastItem = Item;

            if (true === NewRange)
                break;
        }
    }


    PRS.MoveToLBP       = MoveToLBP;
    PRS.NewRange        = NewRange;
    PRS.ForceNewPage    = ForceNewPage;
    PRS.NewPage         = NewPage;
    PRS.End             = End;

    PRS.Word            = Word;
    PRS.StartWord       = StartWord;
    PRS.FirstItemOnLine = FirstItemOnLine;
    PRS.EmptyLine       = EmptyLine;
    PRS.TextOnLine      = TextOnLine;

    PRS.SpaceLen        = SpaceLen;
    PRS.WordLen         = WordLen;
    PRS.bMathWordLarge  = bMathWordLarge;
    PRS.OperGapRight    = OperGapRight;
    PRS.OperGapLeft     = OperGapLeft;

    PRS.X               = X;
    PRS.XEnd            = XEnd;

    PRS.bInsideOper         = bInsideOper;
    PRS.bContainCompareOper = bContainCompareOper;
    PRS.bEndRunToContent    = bEndRunToContent;
    PRS.bNoOneBreakOperator = bNoOneBreakOperator;
    PRS.bForcedBreak        = bForcedBreak;


	if (this.Type == para_Math_Run)
	{
		if (true === NewRange)
		{
			var WidthLine = X - XRange;

			if (this.ParaMath.Is_BrkBinBefore() == false)
				WidthLine += SpaceLen;

			this.ParaMath.UpdateWidthLine(PRS, WidthLine);
		}
		else
		{
			// для пустого Run, обновляем LineBreakPos на случай, если пустой Run находится между break_operator (мат. объект) и мат объектом
			if (this.Content.length == 0)
			{
				if (PRS.bForcedBreak == true)
				{
					PRS.MoveToLBP = true;
					PRS.NewRange  = true;
					PRS.Set_LineBreakPos(0, PRS.FirstItemOnLine);
				}
				else if (this.ParaMath.Is_BrkBinBefore() == false && Word == false && PRS.bBreakBox == true)
				{
					PRS.Set_LineBreakPos(Pos, PRS.FirstItemOnLine);
					PRS.X += SpaceLen;
					PRS.SpaceLen = 0;
				}
			}

			// запоминаем конец Run
			PRS.PosEndRun.Set(PRS.CurPos);
			PRS.PosEndRun.Update2(this.Content.length, Depth);
		}
	}

	if (Pos >= ContentLen)
	{
		RangeEndPos = Pos;
	}

    this.protected_FillRange(CurLine, CurRange, RangeStartPos, RangeEndPos);

    this.RecalcInfo.Recalc = false;
};

ParaRun.prototype.Recalculate_Set_RangeEndPos = function(PRS, PRP, Depth)
{
    var CurLine  = PRS.Line - this.StartLine;
    var CurRange = ( 0 === CurLine ? PRS.Range - this.StartRange : PRS.Range );
    var CurPos   = PRP.Get(Depth);

    this.protected_FillRangeEndPos(CurLine, CurRange, CurPos);
};

ParaRun.prototype.Recalculate_LineMetrics = function(PRS, ParaPr, _CurLine, _CurRange, ContentMetrics)
{
	var Para = PRS.Paragraph;

	// Если заданный отрезок пустой, тогда мы не должны учитывать метрики данного рана.

	var CurLine  = _CurLine - this.StartLine;
	var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

	var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
	var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

	var UpdateLineMetricsText = false;
	var LineRule              = ParaPr.Spacing.LineRule;

	for (var CurPos = StartPos; CurPos < EndPos; CurPos++)
	{
		var Item = this.private_CheckInstrText(this.Content[CurPos]);

		if (Item === Para.Numbering.Item)
		{
			PRS.LineAscent = Para.Numbering.LineAscent;
		}

		switch (Item.Type)
		{
			case para_Sym:
			case para_Text:
			case para_PageNum:
			case para_PageCount:
			case para_FootnoteReference:
			case para_FootnoteRef:
			case para_Separator:
			case para_ContinuationSeparator:
			{
				UpdateLineMetricsText = true;
				break;
			}
			case para_Math_Text:
			case para_Math_Ampersand:
			case para_Math_Placeholder:
			case para_Math_BreakOperator:
			{
				ContentMetrics.UpdateMetrics(Item.size);

				break;
			}
			case para_Space:
			{
				break;
			}
			case para_Drawing:
			{
				if (true === Item.Is_Inline() || true === Para.Parent.Is_DrawingShape())
				{
					// Обновим метрики строки
					if (Asc.linerule_Exact === LineRule)
					{
						if (PRS.LineAscent < Item.Height)
							PRS.LineAscent = Item.Height;
					}
					else
					{
						if (PRS.LineAscent < Item.Height + this.YOffset)
							PRS.LineAscent = Item.Height + this.YOffset;

						if (PRS.LineDescent < -this.YOffset)
							PRS.LineDescent = -this.YOffset;
					}
				}

				break;
			}

			case para_End:
			{
				break;
			}
			case para_FieldChar:
			{
				if (Item.IsNumValue())
					UpdateLineMetricsText = true;

				break;
			}
		}
	}

	if (true === UpdateLineMetricsText)
	{
		// Пересчитаем метрику строки относительно размера данного текста
		if (PRS.LineTextAscent < this.TextAscent)
			PRS.LineTextAscent = this.TextAscent;

		if (PRS.LineTextAscent2 < this.TextAscent2)
			PRS.LineTextAscent2 = this.TextAscent2;

		if (PRS.LineTextDescent < this.TextDescent)
			PRS.LineTextDescent = this.TextDescent;

		if (Asc.linerule_Exact === LineRule)
		{
			// Смещение не учитывается в метриках строки, когда расстояние между строк точное
			if (PRS.LineAscent < this.TextAscent)
				PRS.LineAscent = this.TextAscent;

			if (PRS.LineDescent < this.TextDescent)
				PRS.LineDescent = this.TextDescent;
		}
		else
		{
			if (PRS.LineAscent < this.TextAscent + this.YOffset)
				PRS.LineAscent = this.TextAscent + this.YOffset;

			if (PRS.LineDescent < this.TextDescent - this.YOffset)
				PRS.LineDescent = this.TextDescent - this.YOffset;
		}
	}
};

ParaRun.prototype.Recalculate_Range_Width = function(PRSC, _CurLine, _CurRange)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

	// TODO: Сделать возможность показывать инструкцию
	var isHiddenCFPart = PRSC.ComplexFields.IsComplexFieldCode();
    for ( var Pos = StartPos; Pos < EndPos; Pos++ )
    {
		var Item = this.private_CheckInstrText(this.Content[Pos]);
        var ItemType = Item.Type;

		if (PRSC.ComplexFields.IsHiddenFieldContent() && para_End !== ItemType && para_FieldChar !== ItemType)
			continue;

		if (isHiddenCFPart && para_End !== ItemType && para_FieldChar !== ItemType && para_InstrText !== ItemType)
			continue;

		switch( ItemType )
        {
            case para_Sym:
            case para_Text:
            case para_FootnoteReference:
            case para_FootnoteRef:
            case para_Separator:
            case para_ContinuationSeparator:
            {
                PRSC.Letters++;

                if ( true !== PRSC.Word )
                {
                    PRSC.Word = true;
                    PRSC.Words++;
                }

                PRSC.Range.W += Item.Width / TEXTWIDTH_DIVIDER;//Item.Get_Width();
                PRSC.Range.W += PRSC.SpaceLen;

                PRSC.SpaceLen = 0;

                // Пробелы перед первым словом в строке не считаем
                if (PRSC.Words > 1)
                    PRSC.Spaces += PRSC.SpacesCount;
                else
                    PRSC.SpacesSkip += PRSC.SpacesCount;

                PRSC.SpacesCount = 0;

                // Если текущий символ, например, дефис, тогда на нем заканчивается слово
                if (Item.Flags & PARATEXT_FLAGS_SPACEAFTER)//if ( true === Item.IsSpaceAfter() )
                    PRSC.Word = false;

                break;
            }
            case para_Math_Text:
            case para_Math_Placeholder:
            case para_Math_Ampersand:
            case para_Math_BreakOperator:
            {
                PRSC.Letters++;

                PRSC.Range.W += Item.Get_Width() / TEXTWIDTH_DIVIDER; // Get_Width рассчитываем ширину с учетом состояний Gaps
                break;
            }
            case para_Space:
            {
                if ( true === PRSC.Word )
                {
                    PRSC.Word        = false;
                    PRSC.SpacesCount = 1;
                    PRSC.SpaceLen    = Item.Width / TEXTWIDTH_DIVIDER;//Item.Get_Width();
                }
                else
                {
                    PRSC.SpacesCount++;
                    PRSC.SpaceLen += Item.Width / TEXTWIDTH_DIVIDER;//Item.Get_Width();
                }

                break;
            }
            case para_Drawing:
            {
                PRSC.Words++;
                PRSC.Range.W += PRSC.SpaceLen;

                if (PRSC.Words > 1)
                    PRSC.Spaces += PRSC.SpacesCount;
                else
                    PRSC.SpacesSkip += PRSC.SpacesCount;

                PRSC.Word        = false;
                PRSC.SpacesCount = 0;
                PRSC.SpaceLen    = 0;

                if ( true === Item.Is_Inline() || true === PRSC.Paragraph.Parent.Is_DrawingShape() )
                    PRSC.Range.W += Item.Get_Width();

                break;
            }
            case para_PageNum:
            case para_PageCount:
            {
                PRSC.Words++;
                PRSC.Range.W += PRSC.SpaceLen;

                if (PRSC.Words > 1)
                    PRSC.Spaces += PRSC.SpacesCount;
                else
                    PRSC.SpacesSkip += PRSC.SpacesCount;

                PRSC.Word        = false;
                PRSC.SpacesCount = 0;
                PRSC.SpaceLen    = 0;

                PRSC.Range.W += Item.Get_Width();

                break;
            }
            case para_Tab:
            {
                PRSC.Range.W += Item.Get_Width();
                PRSC.Range.W += PRSC.SpaceLen;

				// Учитываем только слова и пробелы, идущие после последнего таба

				PRSC.LettersSkip += PRSC.Letters;
                PRSC.SpacesSkip  += PRSC.Spaces;

                PRSC.Words   = 0;
                PRSC.Spaces  = 0;
                PRSC.Letters = 0;

                PRSC.SpaceLen    = 0;
                PRSC.SpacesCount = 0;
                PRSC.Word        = false;

                break;
            }

            case para_NewLine:
            {
                if (true === PRSC.Word && PRSC.Words > 1)
                    PRSC.Spaces += PRSC.SpacesCount;

                PRSC.SpacesCount = 0;
                PRSC.Word        = false;

                PRSC.Range.WBreak = Item.Get_WidthVisible();

                break;
            }
            case para_End:
            {
                if ( true === PRSC.Word )
                    PRSC.Spaces += PRSC.SpacesCount;

				PRSC.Range.WEnd = Item.Get_WidthVisible();

                break;
            }
			case para_FieldChar:
			{
				if (this.Paragraph && this.Paragraph.m_oPRSW.IsFastRecalculate())
					PRSC.ComplexFields.ProcessFieldChar(Item);
				else
					PRSC.ComplexFields.ProcessFieldCharAndCollectComplexField(Item);

				isHiddenCFPart = PRSC.ComplexFields.IsComplexFieldCode();

				if (Item.IsNumValue())
				{
					PRSC.Words++;
					PRSC.Range.W += PRSC.SpaceLen;

					if (PRSC.Words > 1)
						PRSC.Spaces += PRSC.SpacesCount;
					else
						PRSC.SpacesSkip += PRSC.SpacesCount;

					PRSC.Word        = false;
					PRSC.SpacesCount = 0;
					PRSC.SpaceLen    = 0;

					PRSC.Range.W += Item.Get_Width();
				}

				break;
			}
			case para_InstrText:
			{
				if (this.Paragraph && this.Paragraph.m_oPRSW.IsFastRecalculate())
					break;

				PRSC.ComplexFields.ProcessInstruction(Item);

				break;
			}
        }
    }
};

ParaRun.prototype.Recalculate_Range_Spaces = function(PRSA, _CurLine, _CurRange, CurPage)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

	// TODO: Сделать возможность показывать инструкцию
	var isHiddenCFPart = PRSA.ComplexFields.IsComplexFieldCode();
    for ( var Pos = StartPos; Pos < EndPos; Pos++ )
    {
		var Item = this.private_CheckInstrText(this.Content[Pos]);
        var ItemType = Item.Type;

		if (PRSA.ComplexFields.IsHiddenFieldContent() && para_End !== ItemType && para_FieldChar !== ItemType)
		{
			// Чтобы правильно позиционировался курсор и селект
			Item.WidthVisible = 0;
			continue;
		}

		if (isHiddenCFPart && para_End !== ItemType && para_FieldChar !== ItemType)
		{
			Item.WidthVisible = 0;
			continue;
		}

		switch( ItemType )
        {
            case para_Sym:
            case para_Text:
            case para_FootnoteReference:
            case para_FootnoteRef:
            case para_Separator:
            case para_ContinuationSeparator:
            {
                var WidthVisible = 0;

                if ( 0 !== PRSA.LettersSkip )
                {
                    WidthVisible = Item.Width / TEXTWIDTH_DIVIDER;//WidthVisible = Item.Get_Width();
                    PRSA.LettersSkip--;
                }
                else
                    WidthVisible = Item.Width / TEXTWIDTH_DIVIDER + PRSA.JustifyWord;//WidthVisible = Item.Get_Width() + PRSA.JustifyWord;

                Item.WidthVisible = (WidthVisible * TEXTWIDTH_DIVIDER) | 0;//Item.Set_WidthVisible(WidthVisible);

				if (para_FootnoteReference === ItemType)
				{
					var oFootnote = Item.GetFootnote();
					oFootnote.UpdatePositionInfo(this.Paragraph, this, _CurLine, _CurRange, PRSA.X, WidthVisible);
				}

                PRSA.X    += WidthVisible;
                PRSA.LastW = WidthVisible;

                break;
            }
            case para_Math_Text:
            case para_Math_Placeholder:
            case para_Math_BreakOperator:
            case para_Math_Ampersand:
            {
                var WidthVisible = Item.Get_Width() / TEXTWIDTH_DIVIDER; // Get_Width рассчитываем ширину с учетом состояний Gaps
                Item.WidthVisible = (WidthVisible * TEXTWIDTH_DIVIDER)| 0;//Item.Set_WidthVisible(WidthVisible);

                PRSA.X    += WidthVisible;
                PRSA.LastW = WidthVisible;

                break;
            }
            case para_Space:
            {
                var WidthVisible = Item.Width / TEXTWIDTH_DIVIDER;//WidthVisible = Item.Get_Width();

                if ( 0 !== PRSA.SpacesSkip )
                {
                    PRSA.SpacesSkip--;
                }
                else if ( 0 !== PRSA.SpacesCounter )
                {
                    WidthVisible += PRSA.JustifySpace;
                    PRSA.SpacesCounter--;
                }

                Item.WidthVisible = (WidthVisible * TEXTWIDTH_DIVIDER) | 0;//Item.Set_WidthVisible(WidthVisible);

                PRSA.X    += WidthVisible;
                PRSA.LastW = WidthVisible;

                break;
            }
            case para_Drawing:
            {
                var Para = PRSA.Paragraph;
                var PageAbs = Para.private_GetAbsolutePageIndex(CurPage);
                var PageRel = Para.private_GetRelativePageIndex(CurPage);
                var ColumnAbs = Para.Get_AbsoluteColumn(CurPage);

                var LogicDocument = this.Paragraph.LogicDocument;
                var LD_PageLimits = LogicDocument.Get_PageLimits(PageAbs);
                var LD_PageFields = LogicDocument.Get_PageFields(PageAbs);

                var Page_Width  = LD_PageLimits.XLimit;
                var Page_Height = LD_PageLimits.YLimit;

                var DrawingObjects = Para.Parent.DrawingObjects;
                var PageLimits     = Para.Parent.Get_PageLimits(PageRel);
                var PageFields     = Para.Parent.Get_PageFields(PageRel);

                var X_Left_Field   = PageFields.X;
                var Y_Top_Field    = PageFields.Y;
                var X_Right_Field  = PageFields.XLimit;
                var Y_Bottom_Field = PageFields.YLimit;

                var X_Left_Margin   = PageFields.X - PageLimits.X;
                var Y_Top_Margin    = PageFields.Y - PageLimits.Y;
                var X_Right_Margin  = PageLimits.XLimit - PageFields.XLimit;
                var Y_Bottom_Margin = PageLimits.YLimit - PageFields.YLimit;

                var isTableCellContent = Para.Parent.IsTableCellContent();
                var isUseWrap          = Item.Use_TextWrap();
                var isLayoutInCell     = Item.IsLayoutInCell();

                // TODO: Надо здесь почистить все, а то названия переменных путаются, и некоторые имеют неправильное значение

                if (isTableCellContent && (!isUseWrap || !isLayoutInCell))
                {
                    X_Left_Field   = LD_PageFields.X;
                    Y_Top_Field    = LD_PageFields.Y;
                    X_Right_Field  = LD_PageFields.XLimit;
                    Y_Bottom_Field = LD_PageFields.YLimit;

                    X_Left_Margin   = X_Left_Field;
                    X_Right_Margin  = Page_Width  - X_Right_Field;
                    Y_Bottom_Margin = Page_Height - Y_Bottom_Field;
                    Y_Top_Margin    = Y_Top_Field;
                }

               	var _CurPage = 0;
				if (0 !== PageAbs && CurPage > ColumnAbs)
					_CurPage = CurPage - ColumnAbs;

				var ColumnStartX = (0 === CurPage ? Para.X_ColumnStart : Para.Pages[_CurPage].X     );
				var ColumnEndX   = (0 === CurPage ? Para.X_ColumnEnd   : Para.Pages[_CurPage].XLimit);

                var Top_Margin    = Y_Top_Margin;
                var Bottom_Margin = Y_Bottom_Margin;
                var Page_H        = Page_Height;

                if (isTableCellContent && isUseWrap)
                {
                    Top_Margin    = 0;
                    Bottom_Margin = 0;
                    Page_H        = 0;
                }

                var PageLimitsOrigin = Para.Parent.Get_PageLimits(PageRel);
                if (isTableCellContent && !isLayoutInCell)
                {
                    PageLimitsOrigin = LogicDocument.Get_PageLimits(PageAbs);
                    var PageFieldsOrigin = LogicDocument.Get_PageFields(PageAbs);
                    ColumnStartX = PageFieldsOrigin.X;
                    ColumnEndX   = PageFieldsOrigin.XLimit;
                }

                if (!isUseWrap)
                {
                    PageFields.X      = X_Left_Field;
                    PageFields.Y      = Y_Top_Field;
                    PageFields.XLimit = X_Right_Field;
                    PageFields.YLimit = Y_Bottom_Field;

					if (!isTableCellContent || !isLayoutInCell)
					{
						PageLimits.X      = 0;
						PageLimits.Y      = 0;
						PageLimits.XLimit = Page_Width;
						PageLimits.YLimit = Page_Height;
					}
                }

                if ( true === Item.Is_Inline() || true === Para.Parent.Is_DrawingShape() )
                {
                	if (linerule_Exact === Para.Get_CompiledPr2(false).ParaPr.Spacing.LineRule)
					{
						var LineTop    = Para.Pages[CurPage].Y + Para.Lines[CurLine].Y - Para.Lines[CurLine].Metrics.Ascent;
						var LineBottom = Para.Pages[CurPage].Y + Para.Lines[CurLine].Y - Para.Lines[CurLine].Metrics.Descent;
						Item.SetVerticalClip(LineTop, LineBottom);
					}
					else
					{
						Item.SetVerticalClip(null, null);
					}

                    Item.Update_Position(PRSA.Paragraph, new CParagraphLayout( PRSA.X, PRSA.Y , PageAbs, PRSA.LastW, ColumnStartX, ColumnEndX, X_Left_Margin, X_Right_Margin, Page_Width, Top_Margin, Bottom_Margin, Page_H, PageFields.X, PageFields.Y, Para.Pages[CurPage].Y + Para.Lines[CurLine].Y - Para.Lines[CurLine].Metrics.Ascent, Para.Pages[CurPage].Y), PageLimits, PageLimitsOrigin, _CurLine);
                    Item.Reset_SavedPosition();

                    PRSA.X    += Item.WidthVisible;
                    PRSA.LastW = Item.WidthVisible;
                }
                else if (!Item.IsSkipOnRecalculate())
                {
                    Para.Pages[CurPage].Add_Drawing(Item);

                    if ( true === PRSA.RecalcFast )
                    {
                        // Если у нас быстрый пересчет, тогда мы не трогаем плавающие картинки
                        // TODO: Если здесь привязка к символу, тогда быстрый пересчет надо отменить
                        break;
                    }

                    if (true === PRSA.RecalcFast2)
                    {
                        // Тут мы должны сравнить положение картинок
                        var oRecalcObj = Item.SaveRecalculateObject();
                        Item.Update_Position(PRSA.Paragraph, new CParagraphLayout( PRSA.X, PRSA.Y , PageAbs, PRSA.LastW, ColumnStartX, ColumnEndX, X_Left_Margin, X_Right_Margin, Page_Width, Top_Margin, Bottom_Margin, Page_H, PageFields.X, PageFields.Y, Para.Pages[CurPage].Y + Para.Lines[CurLine].Y - Para.Lines[CurLine].Metrics.Ascent, Para.Pages[_CurPage].Y), PageLimits, PageLimitsOrigin, _CurLine);

                        if (Math.abs(Item.X - oRecalcObj.X) > 0.001 || Math.abs(Item.Y - oRecalcObj.Y) > 0.001 || Item.PageNum !== oRecalcObj.PageNum)
                        {
                            // Положение картинок не совпало, отправляем пересчет текущей страницы.
                            PRSA.RecalcResult = recalcresult_CurPage | recalcresultflags_Page;
                            return;
                        }

                        break;
                    }

                    // У нас Flow-объект. Если он с обтеканием, тогда мы останавливаем пересчет и
                    // запоминаем текущий объект. В функции Internal_Recalculate_2 пересчитываем
                    // его позицию и сообщаем ее внешнему классу.

                    if (isUseWrap)
                    {
                        var LogicDocument = Para.Parent;
                        var LDRecalcInfo  = Para.Parent.RecalcInfo;
                        if ( true === LDRecalcInfo.Can_RecalcObject() )
                        {
                            // Обновляем позицию объекта
                            Item.Update_Position(PRSA.Paragraph, new CParagraphLayout( PRSA.X, PRSA.Y , PageAbs, PRSA.LastW, ColumnStartX, ColumnEndX, X_Left_Margin, X_Right_Margin, Page_Width, Top_Margin, Bottom_Margin, Page_H, PageFields.X, PageFields.Y, Para.Pages[CurPage].Y + Para.Lines[CurLine].Y - Para.Lines[CurLine].Metrics.Ascent, Para.Pages[_CurPage].Y), PageLimits, PageLimitsOrigin, _CurLine);
                            LDRecalcInfo.Set_FlowObject( Item, 0, recalcresult_NextElement, -1 );

                            // TODO: Добавить проверку на не попадание в предыдущие колонки
                            if (0 === PRSA.CurPage && Item.wrappingPolygon.top > PRSA.PageY + 0.001 && Item.wrappingPolygon.left > PRSA.PageX + 0.001)
                                PRSA.RecalcResult = recalcresult_CurPagePara;
                            else
                                PRSA.RecalcResult = recalcresult_CurPage | recalcresultflags_Page;

                            return;
                        }
                        else if ( true === LDRecalcInfo.Check_FlowObject(Item) )
                        {
                            // Если мы находимся с таблице, тогда делаем как Word, не пересчитываем предыдущую страницу,
                            // даже если это необходимо. Такое поведение нужно для точного определения рассчиталась ли
                            // данная страница окончательно или нет. Если у нас будет ветка с переходом на предыдущую страницу,
                            // тогда не рассчитав следующую страницу мы о конечном рассчете текущей страницы не узнаем.

                            // Если данный объект нашли, значит он уже был рассчитан и нам надо проверить номер страницы.
                            // Заметим, что даже если картинка привязана к колонке, и после пересчета место привязки картинки
                            // сдвигается в следующую колонку, мы проверяем все равно только реальную страницу (без
                            // учета колонок, так делает и Word).
                            if ( Item.PageNum === PageAbs )
                            {
                                // Все нормально, можно продолжить пересчет
                                LDRecalcInfo.Reset();
                                Item.Reset_SavedPosition();
                            }
                            else if (isTableCellContent)
                            {
                                // Картинка не на нужной странице, но так как это таблица
                                // мы пересчитываем заново текущую страницу, а не предыдущую

                                // Обновляем позицию объекта
                                Item.Update_Position(PRSA.Paragraph, new CParagraphLayout( PRSA.X, PRSA.Y, PageAbs, PRSA.LastW, ColumnStartX, ColumnEndX, X_Left_Margin, X_Right_Margin, Page_Width, Top_Margin, Bottom_Margin, Page_H, PageFields.X, PageFields.Y, Para.Pages[CurPage].Y + Para.Lines[CurLine].Y - Para.Lines[CurLine].Metrics.Ascent, Para.Pages[_CurPage].Y), PageLimits, PageLimitsOrigin, _CurLine);

                                LDRecalcInfo.Set_FlowObject( Item, 0, recalcresult_NextElement, -1 );
                                LDRecalcInfo.Set_PageBreakBefore( false );
                                PRSA.RecalcResult = recalcresult_CurPage | recalcresultflags_Page;
                                return;
                            }
                            else
                            {
                                LDRecalcInfo.Set_PageBreakBefore( true );
                                DrawingObjects.removeById( Item.PageNum, Item.Get_Id() );
                                PRSA.RecalcResult = recalcresult_PrevPage | recalcresultflags_Page;
                                return;
                            }
                        }
                        else
                        {
                            // Либо данный элемент уже обработан, либо будет обработан в будущем
                        }

                        continue;
                    }
                    else
					{
						// Картинка ложится на или под текст, в данном случае пересчет можно спокойно продолжать
						Item.Update_Position(PRSA.Paragraph, new CParagraphLayout(PRSA.X, PRSA.Y, PageAbs, PRSA.LastW, ColumnStartX, ColumnEndX, X_Left_Margin, X_Right_Margin, Page_Width, Top_Margin, Bottom_Margin, Page_H, PageFields.X, PageFields.Y, Para.Pages[CurPage].Y + Para.Lines[CurLine].Y - Para.Lines[CurLine].Metrics.Ascent, Para.Pages[_CurPage].Y), PageLimits, PageLimitsOrigin, _CurLine);
						Item.Reset_SavedPosition();
					}
                }


                break;
            }
            case para_PageNum:
            case para_PageCount:
            {
                PRSA.X    += Item.WidthVisible;
                PRSA.LastW = Item.WidthVisible;

                break;
            }
            case para_Tab:
            {
                PRSA.X += Item.WidthVisible;

                break;
            }
            case para_End:
            {
                var SectPr = PRSA.Paragraph.Get_SectionPr();
                if (!PRSA.Paragraph.LogicDocument || PRSA.Paragraph.LogicDocument !== PRSA.Paragraph.Parent || !PRSA.Paragraph.bFromDocument)
                    SectPr = undefined;

                if ( undefined !== SectPr )
                {
                    // Нас интересует следующая секция
                    var LogicDocument = PRSA.Paragraph.LogicDocument;
                    var NextSectPr = LogicDocument.SectionsInfo.Get_SectPr(PRSA.Paragraph.Index + 1).SectPr;

                    Item.Update_SectionPr(NextSectPr, PRSA.XEnd - PRSA.X);
                }
                else
                    Item.Clear_SectionPr();

                PRSA.X += Item.Get_Width();

                break;
            }
            case para_NewLine:
            {
				if (break_Page === Item.BreakType || break_Column === Item.BreakType)
					Item.Update_String(PRSA.XEnd - PRSA.X);

                PRSA.X += Item.WidthVisible;

                break;
            }
			case para_FieldChar:
			{
				PRSA.ComplexFields.ProcessFieldChar(Item);
				isHiddenCFPart = PRSA.ComplexFields.IsComplexFieldCode();

				if (Item.IsNumValue())
				{
					PRSA.X    += Item.WidthVisible;
					PRSA.LastW = Item.WidthVisible;
				}

				break;
			}

        }
    }
};

ParaRun.prototype.Recalculate_PageEndInfo = function(PRSI, _CurLine, _CurRange)
{
	var CurLine  = _CurLine - this.StartLine;
	var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

	var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
	var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

	for (var Pos = StartPos; Pos < EndPos; ++Pos)
	{
		var Item = this.Content[Pos];
		if (para_FieldChar === Item.Type)
		{
			PRSI.ProcessFieldChar(Item);
		}
	}
};

ParaRun.prototype.private_RecalculateNumbering = function(PRS, Item, ParaPr, _X)
{
    var X = PRS.Recalculate_Numbering(Item, this, ParaPr, _X);

    // Запоминаем, что на данном элементе была добавлена нумерация
    this.RecalcInfo.NumberingAdd  = false;
    this.RecalcInfo.NumberingUse  = true;
    this.RecalcInfo.NumberingItem = PRS.Paragraph.Numbering;

    return X;
};

ParaRun.prototype.private_RecalculateLastTab = function(LastTab, X, XEnd, Word, WordLen, SpaceLen)
{
	if (tab_Left === LastTab.Value)
	{
		LastTab.Reset();
	}
    else if ( -1 !== LastTab.Value )
    {
        var TempXPos = X;

        if ( true === Word || WordLen > 0 )
            TempXPos += SpaceLen + WordLen;

        var TabItem   = LastTab.Item;
        var TabStartX = LastTab.X;
        var TabRangeW = TempXPos - TabStartX;
        var TabValue  = LastTab.Value;
        var TabPos    = LastTab.TabPos;

		var oLogicDocument     = this.Paragraph ? this.Paragraph.LogicDocument : null;
		var nCompatibilityMode = oLogicDocument && oLogicDocument.GetCompatibilityMode ? oLogicDocument.GetCompatibilityMode() : document_compatibility_mode_Current;

		if (AscCommon.MMToTwips(TabPos) > AscCommon.MMToTwips(XEnd) && nCompatibilityMode >= document_compatibility_mode_Word15)
		{
			TabValue = tab_Right;
			TabPos   = XEnd;
		}

        var TabCalcW = 0;
        if ( tab_Right === TabValue )
            TabCalcW = Math.max( TabPos - (TabStartX + TabRangeW), 0 );
        else if ( tab_Center === TabValue )
            TabCalcW = Math.max( TabPos - (TabStartX + TabRangeW / 2), 0 );

        if ( X + TabCalcW > LastTab.PageXLimit )
            TabCalcW = LastTab.PageXLimit - X;

        TabItem.Width        = TabCalcW;
        TabItem.WidthVisible = TabCalcW;

        LastTab.Reset();

        return X + TabCalcW;
    }

    return X;
};
/**
 * Специальная функия для проверки InstrText. Если InstrText идет не между Begin и Separate сложного поля, тогда
 * мы заменяем его обычным текстовым элементом.
 * @param oItem
 */
ParaRun.prototype.private_CheckInstrText = function(oItem)
{
	if (!oItem)
		return oItem;

	if (para_InstrText !== oItem.Type)
		return oItem;

	var oReplacement = oItem.GetReplacementItem();
	return (oReplacement ? oReplacement : oItem);
};

ParaRun.prototype.Refresh_RecalcData = function(oData)
{
	var oPara = this.Paragraph;

	if (this.Type == para_Math_Run)
	{
		if (this.Parent !== null && this.Parent !== undefined)
		{
			this.Parent.Refresh_RecalcData();
		}
	}
	else if (-1 !== this.StartLine && oPara)
	{
		var nCurLine = this.StartLine;

		if (oData instanceof CChangesRunAddItem || oData instanceof CChangesRunRemoveItem)
		{
			nCurLine = -1;
			var nChangePos = oData.GetMinPos();
			for (var nLine = 0, nLinesCount = this.protected_GetLinesCount(); nLine < nLinesCount; ++nLine)
			{
				for (var nRange = 0, nRangesCount = this.protected_GetRangesCount(nLine); nRange < nRangesCount; ++nRange)
				{
					var nStartPos = this.protected_GetRangeStartPos(nLine, nRange);
					var nEndPos   = this.protected_GetRangeEndPos(nLine, nRange);

					if (nStartPos <= nChangePos && nChangePos < nEndPos)
					{
						nCurLine = nLine + this.StartLine;
						break;
					}
				}

				if (-1 !== nCurLine)
					break;
			}

			if (-1 === nCurLine)
				nCurLine = this.StartLine + this.protected_GetLinesCount() - 1;
		}

		for (var nCurPage = 0, nPagesCount = oPara.GetPagesCount(); nCurPage < nPagesCount; ++nCurPage)
		{
			var oPage = oPara.Pages[nCurPage];
			if (oPage.StartLine <= nCurLine && nCurLine <= oPage.EndLine)
			{
				oPara.Refresh_RecalcData2(nCurPage);
				return;
			}
		}

		oPara.Refresh_RecalcData2(0);
	}
};
ParaRun.prototype.Refresh_RecalcData2 = function()
{
	this.Refresh_RecalcData();
};
ParaRun.prototype.SaveRecalculateObject = function(Copy)
{
    var RecalcObj = new CRunRecalculateObject(this.StartLine, this.StartRange);
    RecalcObj.Save_Lines( this, Copy );
    RecalcObj.Save_RunContent( this, Copy );
    return RecalcObj;
};
ParaRun.prototype.LoadRecalculateObject = function(RecalcObj)
{
    RecalcObj.Load_Lines(this);
    RecalcObj.Load_RunContent(this);
};
ParaRun.prototype.PrepareRecalculateObject = function()
{
	this.protected_ClearLines();

	var Count = this.Content.length;
	for (var Index = 0; Index < Count; Index++)
	{
		var Item     = this.Content[Index];
		var ItemType = Item.Type;

		if (para_PageNum === ItemType || para_Drawing === ItemType)
			Item.PrepareRecalculateObject();
	}
};
ParaRun.prototype.IsEmptyRange = function(_CurLine, _CurRange)
{
	var CurLine  = _CurLine - this.StartLine;
	var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

	var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
	var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

	if (EndPos <= StartPos)
		return true;

    return false;
};

ParaRun.prototype.Check_Range_OnlyMath = function(Checker, _CurRange, _CurLine)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    for (var Pos = StartPos; Pos < EndPos; Pos++)
    {
        var Item = this.Content[Pos];
        var ItemType = Item.Type;

        if (para_End === ItemType || para_NewLine === ItemType || (para_Drawing === ItemType && true !== Item.Is_Inline()))
            continue;
        else
        {
            Checker.Result = false;
            Checker.Math   = null;
            break;
        }
    }
};

ParaRun.prototype.Check_MathPara = function(Checker)
{
    var Count = this.Content.length;
    if ( Count <= 0 )
        return;

    var Item = ( Checker.Direction > 0 ? this.Content[0] : this.Content[Count - 1] );
    var ItemType = Item.Type;

    if ( para_End === ItemType || para_NewLine === ItemType )
    {
        Checker.Result = true;
        Checker.Found  = true;
    }
    else
    {
        Checker.Result = false;
        Checker.Found  = true;
    }
};

ParaRun.prototype.Check_PageBreak = function()
{
    var Count = this.Content.length;
    for (var Pos = 0; Pos < Count; Pos++)
    {
        var Item = this.Content[Pos];
        if (para_NewLine === Item.Type && (break_Page === Item.BreakType || break_Column === Item.BreakType))
            return true;
    }

    return false;
};

ParaRun.prototype.CheckSplitPageOnPageBreak = function(oChecker)
{
	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		var oItem = this.Content[nPos];

		if (oChecker.IsFindPageBreak())
		{
			oChecker.CheckPageBreakItem(oItem);
		}
		else
		{
			var nItemType = oItem.Type;

			if (para_End === nItemType && !oChecker.IsSplitPageBreakAndParaMark())
				return false;
			else if (para_Drawing !== nItemType || drawing_Anchor !== oItem.Get_DrawingType())
				return true;
		}
	}

	return false;
};

ParaRun.prototype.RecalculateMinMaxContentWidth = function(MinMax)
{
    this.Recalculate_MeasureContent();

    var bWord        = MinMax.bWord;
    var nWordLen     = MinMax.nWordLen;
    var nSpaceLen    = MinMax.nSpaceLen;
    var nMinWidth    = MinMax.nMinWidth;
    var nMaxWidth    = MinMax.nMaxWidth;
    var nCurMaxWidth = MinMax.nCurMaxWidth;
    var nMaxHeight   = MinMax.nMaxHeight;

    var bCheckTextHeight = false;
    var Count = this.Content.length;
    for ( var Pos = 0; Pos < Count; Pos++ )
    {
		var Item     = this.private_CheckInstrText(this.Content[Pos]);
        var ItemType = Item.Type;

        switch( ItemType )
        {
            case para_Text:
            {
                var ItemWidth = Item.Width / TEXTWIDTH_DIVIDER;//var ItemWidth = Item.Get_Width();
                if ( false === bWord )
                {
                    bWord    = true;
                    nWordLen = ItemWidth;
                }
                else
                {
                    nWordLen += ItemWidth;

                    if (Item.Flags & PARATEXT_FLAGS_SPACEAFTER)
                    {
                        if ( nMinWidth < nWordLen )
                            nMinWidth = nWordLen;

                        bWord    = false;
                        nWordLen = 0;
                    }
                }

                if ( nSpaceLen > 0 )
                {
                    nCurMaxWidth += nSpaceLen;
                    nSpaceLen     = 0;
                }

                nCurMaxWidth += ItemWidth;
                bCheckTextHeight = true;
                break;
            }
            case para_Math_Text:
            case para_Math_Ampersand:
            case para_Math_Placeholder:
            {
                var ItemWidth = Item.Get_Width() / TEXTWIDTH_DIVIDER;
                if ( false === bWord )
                {
                    bWord    = true;
                    nWordLen = ItemWidth;
                }
                else
                {
                    nWordLen += ItemWidth;
                }

                nCurMaxWidth += ItemWidth;
                bCheckTextHeight = true;
                break;
            }
            case para_Space:
            {
                if ( true === bWord )
                {
                    if ( nMinWidth < nWordLen )
                        nMinWidth = nWordLen;

                    bWord    = false;
                    nWordLen = 0;
                }

                // Мы сразу не добавляем ширину пробелов к максимальной ширине, потому что
                // пробелы, идущие в конце параграфа или перед переносом строки(явным), не
                // должны учитываться.
                nSpaceLen += Item.Width / TEXTWIDTH_DIVIDER;//nSpaceLen += Item.Get_Width();
                bCheckTextHeight = true;
                break;
            }
            case para_Math_BreakOperator:
            {
                if ( true === bWord )
                {
                    if ( nMinWidth < nWordLen )
                        nMinWidth = nWordLen;

                    bWord    = false;
                    nWordLen = 0;
                }

                nCurMaxWidth += Item.Get_Width() / TEXTWIDTH_DIVIDER;
                bCheckTextHeight = true;
                break;
            }

            case para_Drawing:
            {
                if ( true === bWord )
                {
                    if ( nMinWidth < nWordLen )
                        nMinWidth = nWordLen;

                    bWord    = false;
                    nWordLen = 0;
                }

                if ((true === Item.Is_Inline() || true === this.Paragraph.Parent.Is_DrawingShape()) && Item.Width > nMinWidth)
                {
                    nMinWidth = Item.Width;
                }
                else if (true === Item.Use_TextWrap())
                {
                    var DrawingW = Item.getXfrmExtX();
                    if (DrawingW > nMinWidth)
                        nMinWidth = DrawingW;
                }

                if ((true === Item.Is_Inline() || true === this.Paragraph.Parent.Is_DrawingShape()) && Item.Height > nMaxHeight)
                {
                    nMaxHeight = Item.Height;
                }
                else if (true === Item.Use_TextWrap())
                {
                    var DrawingH = Item.getXfrmExtY();
                    if (DrawingH > nMaxHeight)
                        nMaxHeight = DrawingH;
                }

                if ( nSpaceLen > 0 )
                {
                    nCurMaxWidth += nSpaceLen;
                    nSpaceLen     = 0;
                }

                if ( true === Item.Is_Inline() || true === this.Paragraph.Parent.Is_DrawingShape() )
                    nCurMaxWidth += Item.Width;

                break;
            }

            case para_PageNum:
            case para_PageCount:
            {
                if ( true === bWord )
                {
                    if ( nMinWidth < nWordLen )
                        nMinWidth = nWordLen;

                    bWord    = false;
                    nWordLen = 0;
                }

                if ( Item.Width > nMinWidth )
                    nMinWidth = Item.Get_Width();

                if ( nSpaceLen > 0 )
                {
                    nCurMaxWidth += nSpaceLen;
                    nSpaceLen     = 0;
                }

                nCurMaxWidth += Item.Get_Width();
                bCheckTextHeight = true;
                break;
            }

            case para_Tab:
            {
                nWordLen += Item.Width;

                if ( nMinWidth < nWordLen )
                    nMinWidth = nWordLen;

                bWord    = false;
                nWordLen = 0;

                if ( nSpaceLen > 0 )
                {
                    nCurMaxWidth += nSpaceLen;
                    nSpaceLen     = 0;
                }

                nCurMaxWidth += Item.Width;
                bCheckTextHeight = true;
                break;
            }

            case para_NewLine:
            {
                if ( nMinWidth < nWordLen )
                    nMinWidth = nWordLen;

                bWord    = false;
                nWordLen = 0;

                nSpaceLen = 0;

                if ( nCurMaxWidth > nMaxWidth )
                    nMaxWidth = nCurMaxWidth;

                nCurMaxWidth = 0;
                bCheckTextHeight = true;
                break;
            }

            case para_End:
            {
                if ( nMinWidth < nWordLen )
                    nMinWidth = nWordLen;

                if ( nCurMaxWidth > nMaxWidth )
                    nMaxWidth = nCurMaxWidth;

                if (nMaxHeight < 0.001)
                    bCheckTextHeight = true;

                break;
            }
        }
    }

    if (true === bCheckTextHeight && nMaxHeight < this.TextAscent + this.TextDescent)
        nMaxHeight = this.TextAscent + this.TextDescent;

    MinMax.bWord        = bWord;
    MinMax.nWordLen     = nWordLen;
    MinMax.nSpaceLen    = nSpaceLen;
    MinMax.nMinWidth    = nMinWidth;
    MinMax.nMaxWidth    = nMaxWidth;
    MinMax.nCurMaxWidth = nCurMaxWidth;
    MinMax.nMaxHeight   = nMaxHeight;
};

ParaRun.prototype.Get_Range_VisibleWidth = function(RangeW, _CurLine, _CurRange)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    for ( var Pos = StartPos; Pos < EndPos; Pos++ )
    {
        var Item = this.private_CheckInstrText(this.Content[Pos]);
        var ItemType = Item.Type;

        switch( ItemType )
        {
            case para_Sym:
            case para_Text:
            case para_Space:
            case para_Math_Text:
            case para_Math_Ampersand:
            case para_Math_Placeholder:
            case para_Math_BreakOperator:
            {
                RangeW.W += Item.Get_WidthVisible();
                break;
            }
            case para_Drawing:
            {
                if ( true === Item.Is_Inline() )
                    RangeW.W += Item.Width;

                break;
            }
            case para_PageNum:
            case para_PageCount:
            case para_Tab:
            {
                RangeW.W += Item.Width;
                break;
            }
            case para_NewLine:
            {
                RangeW.W += Item.WidthVisible;

                break;
            }
            case para_End:
            {
                RangeW.W += Item.Get_WidthVisible();
                RangeW.End = true;

                break;
            }
			default:
			{
				if (Item.Get_WidthVisible())
					RangeW.W += Item.Get_WidthVisible();

				break;
			}
        }
    }
};

ParaRun.prototype.Shift_Range = function(Dx, Dy, _CurLine, _CurRange)
{
    var CurLine = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    for ( var CurPos = StartPos; CurPos < EndPos; CurPos++ )
    {
        var Item = this.Content[CurPos];

        if ( para_Drawing === Item.Type )
            Item.Shift( Dx, Dy );
    }
};
//-----------------------------------------------------------------------------------
// Функции отрисовки
//-----------------------------------------------------------------------------------
ParaRun.prototype.Draw_HighLights = function(PDSH)
{
    var pGraphics = PDSH.Graphics;

    var CurLine   = PDSH.Line - this.StartLine;
    var CurRange  = ( 0 === CurLine ? PDSH.Range - this.StartRange : PDSH.Range );

    var aHigh     = PDSH.High;
    var aColl     = PDSH.Coll;
    var aFind     = PDSH.Find;
    var aComm     = PDSH.Comm;
    var aShd      = PDSH.Shd;
    var aFields   = PDSH.MMFields;

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    var Para     = PDSH.Paragraph;
    var SearchResults = Para.SearchResults;

    var bDrawFind = PDSH.DrawFind;
    var bDrawColl = PDSH.DrawColl;

    var oCompiledPr = this.Get_CompiledPr(false);
    var oShd = oCompiledPr.Shd;
    var bDrawShd  = ( oShd === undefined || c_oAscShdNil === oShd.Value || (oShd.Color && true === oShd.Color.Auto) ? false : true );
    var ShdColor  = ( true === bDrawShd ? oShd.Get_Color( PDSH.Paragraph ) : null );

    if(this.Type == para_Math_Run && this.IsPlaceholder())
        bDrawShd = false;

    var X  = PDSH.X;
    var Y0 = PDSH.Y0;
    var Y1 = PDSH.Y1;

    var CommentsFlag  = PDSH.CommentsFlag;
    var arrComments   = [];
    for (var nIndex = 0, nCount = PDSH.Comments.length; nIndex < nCount; ++nIndex)
	{
		arrComments.push(PDSH.Comments[nIndex]);
	}

    var HighLight = oCompiledPr.HighLight;
    if(oCompiledPr.HighlightColor)
    {
        var Theme = this.Paragraph.Get_Theme(), ColorMap = this.Paragraph.Get_ColorMap(), RGBA;
        oCompiledPr.HighlightColor.check(Theme, ColorMap);
        RGBA = oCompiledPr.HighlightColor.RGBA;
        HighLight = new CDocumentColor(RGBA.R, RGBA.G, RGBA.B, RGBA.A);
    }

    var SearchMarksCount = this.SearchMarks.length;

    this.CollaborativeMarks.Init_Drawing();

	var isHiddenCFPart = PDSH.ComplexFields.IsComplexFieldCode();

    for ( var Pos = StartPos; Pos < EndPos; Pos++ )
    {
		var Item = this.private_CheckInstrText(this.Content[Pos]);
        var ItemType         = Item.Type;
        var ItemWidthVisible = Item.Get_WidthVisible();

        if ((PDSH.ComplexFields.IsHiddenFieldContent() || isHiddenCFPart) && para_End !== ItemType && para_FieldChar !== ItemType)
        	continue;

        // Определим попадание в поиск и совместное редактирование. Попадание в комментарий определять не надо,
        // т.к. класс CParaRun попадает или не попадает в комментарий целиком.

        for ( var SPos = 0; SPos < SearchMarksCount; SPos++)
        {
            var Mark = this.SearchMarks[SPos];
            var MarkPos = Mark.SearchResult.StartPos.Get(Mark.Depth);

            if ( Pos === MarkPos && true === Mark.Start )
                PDSH.SearchCounter++;
        }

        var DrawSearch = ( PDSH.SearchCounter > 0 && true === bDrawFind ? true : false );

        var DrawColl = this.CollaborativeMarks.Check( Pos );

        if ( true === bDrawShd )
            aShd.Add( Y0, Y1, X, X + ItemWidthVisible, 0, ShdColor.r, ShdColor.g, ShdColor.b, undefined, oShd );

		if (PDSH.ComplexFields.IsComplexField()
			&& !PDSH.ComplexFields.IsComplexFieldCode()
			&& PDSH.ComplexFields.IsCurrentComplexField()
			&& !PDSH.ComplexFields.IsHyperlinkField())
			PDSH.CFields.Add(Y0, Y1, X, X + ItemWidthVisible, 0, 0, 0, 0);

        switch( ItemType )
        {
            case para_PageNum:
            case para_PageCount:
            case para_Drawing:
            case para_Tab:
            case para_Text:
            case para_Math_Text:
            case para_Math_Placeholder:
            case para_Math_BreakOperator:
            case para_Math_Ampersand:
            case para_Sym:
            case para_FootnoteReference:
            case para_FootnoteRef:
            case para_Separator:
            case para_ContinuationSeparator:
            {
                if ( para_Drawing === ItemType && !Item.Is_Inline() )
                    break;

                if ( CommentsFlag != AscCommon.comments_NoComment )
                    aComm.Add( Y0, Y1, X, X + ItemWidthVisible, 0, 0, 0, 0, { Active : CommentsFlag === AscCommon.comments_ActiveComment ? true : false, CommentId : arrComments } );
                else if ( highlight_None != HighLight )
                    aHigh.Add( Y0, Y1, X, X + ItemWidthVisible, 0, HighLight.r, HighLight.g, HighLight.b, undefined, HighLight );

                if ( true === DrawSearch )
                    aFind.Add( Y0, Y1, X, X + ItemWidthVisible, 0, 0, 0, 0  );
                else if ( null !== DrawColl )
                    aColl.Add( Y0, Y1, X, X + ItemWidthVisible, 0, DrawColl.r, DrawColl.g, DrawColl.b );

                if ( para_Drawing != ItemType || Item.Is_Inline() )
                    X += ItemWidthVisible;

                break;
            }
            case para_Space:
            {
                // Пробелы в конце строки (и строку состоящую из пробелов) не подчеркиваем, не зачеркиваем и не выделяем
                if ( PDSH.Spaces > 0 )
                {
                    if ( CommentsFlag != AscCommon.comments_NoComment )
                        aComm.Add( Y0, Y1, X, X + ItemWidthVisible, 0, 0, 0, 0, { Active : CommentsFlag === AscCommon.comments_ActiveComment ? true : false, CommentId : arrComments } );
                    else if ( highlight_None != HighLight )
                        aHigh.Add( Y0, Y1, X, X + ItemWidthVisible, 0, HighLight.r, HighLight.g, HighLight.b, undefined, HighLight );

                    PDSH.Spaces--;
                }

                if ( true === DrawSearch )
                    aFind.Add( Y0, Y1, X, X + ItemWidthVisible, 0, 0, 0, 0  );
                else if ( null !== DrawColl )
                    aColl.Add( Y0, Y1, X, X + ItemWidthVisible, 0, DrawColl.r, DrawColl.g, DrawColl.b  );

                X += ItemWidthVisible;

                break;
            }
            case para_End:
            {
                if ( null !== DrawColl )
                    aColl.Add( Y0, Y1, X, X + ItemWidthVisible, 0, DrawColl.r, DrawColl.g, DrawColl.b  );

                X += Item.Get_Width();
                break;
            }
            case para_NewLine:
            {
                X += ItemWidthVisible;
                break;
            }
			case para_FieldChar:
			{
				PDSH.ComplexFields.ProcessFieldChar(Item);
				isHiddenCFPart = PDSH.ComplexFields.IsComplexFieldCode();

				if (Item.IsNumValue())
				{
					if ( CommentsFlag != AscCommon.comments_NoComment )
						aComm.Add( Y0, Y1, X, X + ItemWidthVisible, 0, 0, 0, 0, { Active : CommentsFlag === AscCommon.comments_ActiveComment ? true : false, CommentId : arrComments } );
					else if ( highlight_None != HighLight )
						aHigh.Add( Y0, Y1, X, X + ItemWidthVisible, 0, HighLight.r, HighLight.g, HighLight.b, undefined, HighLight );

					if ( true === DrawSearch )
						aFind.Add( Y0, Y1, X, X + ItemWidthVisible, 0, 0, 0, 0  );
					else if ( null !== DrawColl )
						aColl.Add( Y0, Y1, X, X + ItemWidthVisible, 0, DrawColl.r, DrawColl.g, DrawColl.b );

						X += ItemWidthVisible;
				}

				break;
			}
        }

        for ( var SPos = 0; SPos < SearchMarksCount; SPos++)
        {
            var Mark = this.SearchMarks[SPos];
            var MarkPos = Mark.SearchResult.EndPos.Get(Mark.Depth);

            if ( Pos + 1 === MarkPos && true !== Mark.Start )
                PDSH.SearchCounter--;
        }
    }

    // Обновим позицию X
    PDSH.X = X;
};

ParaRun.prototype.Draw_Elements = function(PDSE)
{
    var CurLine  = PDSE.Line - this.StartLine;
    var CurRange = ( 0 === CurLine ? PDSE.Range - this.StartRange : PDSE.Range );
    var CurPage  = PDSE.Page;

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    var Para      = PDSE.Paragraph;
    var pGraphics = PDSE.Graphics;
    var BgColor   = PDSE.BgColor;
    var Theme     = PDSE.Theme;

    var X = PDSE.X;
    var Y = PDSE.Y;

    var CurTextPr = this.Get_CompiledPr( false );
    pGraphics.SetTextPr( CurTextPr, Theme );

    var InfoMathText ;
    if(this.Type == para_Math_Run)
    {
        var ArgSize = this.Parent.Compiled_ArgSz.value,
            bNormalText = this.IsNormalText();

        var InfoTextPr =
        {
            TextPr:         CurTextPr,
            ArgSize:        ArgSize,
            bNormalText:    bNormalText,
            bEqArray:       this.bEqArray
        };

        InfoMathText = new CMathInfoTextPr(InfoTextPr);
    }

    if ( undefined !== CurTextPr.Shd && c_oAscShdNil !== CurTextPr.Shd.Value && !(CurTextPr.FontRef && CurTextPr.FontRef.Color) )
        BgColor = CurTextPr.Shd.Get_Color( Para );

    var AutoColor = ( undefined != BgColor && false === BgColor.Check_BlackAutoColor() ? new CDocumentColor( 255, 255, 255, false ) : new CDocumentColor( 0, 0, 0, false ) );
    var  RGBA, Theme = PDSE.Theme, ColorMap = PDSE.ColorMap;
    if((BgColor == undefined || BgColor.Auto) && CurTextPr.FontRef && CurTextPr.FontRef.Color)
    {
        CurTextPr.FontRef.Color.check(Theme, ColorMap);
        RGBA = CurTextPr.FontRef.Color.RGBA;
        AutoColor = new CDocumentColor( RGBA.R, RGBA.G, RGBA.B, RGBA.A );
    }


    var RGBA;
    var ReviewType  = this.GetReviewType();
    var ReviewColor = null;
    var bPresentation = this.Paragraph && !this.Paragraph.bFromDocument;
    if (reviewtype_Add === ReviewType || reviewtype_Remove === ReviewType)
    {
        ReviewColor = this.GetReviewColor();
        pGraphics.b_color1(ReviewColor.r, ReviewColor.g, ReviewColor.b, 255);
    }
    else if (CurTextPr.Unifill)
    {
        CurTextPr.Unifill.check(PDSE.Theme, PDSE.ColorMap);
        RGBA = CurTextPr.Unifill.getRGBAColor();

		if (true === PDSE.VisitedHyperlink)
		{
			AscFormat.G_O_VISITED_HLINK_COLOR.check(PDSE.Theme, PDSE.ColorMap);
			RGBA = AscFormat.G_O_VISITED_HLINK_COLOR.getRGBAColor();
			pGraphics.b_color1(RGBA.R, RGBA.G, RGBA.B, RGBA.A);
		}
        else
        {
            if(bPresentation && PDSE.Hyperlink)
            {
                AscFormat.G_O_HLINK_COLOR.check(PDSE.Theme, PDSE.ColorMap);
                RGBA = AscFormat.G_O_HLINK_COLOR.getRGBAColor();
                pGraphics.b_color1( RGBA.R, RGBA.G, RGBA.B, RGBA.A );
            }
            else
            {
                pGraphics.b_color1( RGBA.R, RGBA.G, RGBA.B, RGBA.A);
            }
        }
    }
    else
    {
        if (true === PDSE.VisitedHyperlink)
        {
            AscFormat.G_O_VISITED_HLINK_COLOR.check(PDSE.Theme, PDSE.ColorMap);
            RGBA = AscFormat.G_O_VISITED_HLINK_COLOR.getRGBAColor();
            pGraphics.b_color1( RGBA.R, RGBA.G, RGBA.B, RGBA.A );
        }
        else if ( true === CurTextPr.Color.Auto )
        {
            pGraphics.b_color1( AutoColor.r, AutoColor.g, AutoColor.b, 255);
        }
        else
        {
            pGraphics.b_color1( CurTextPr.Color.r, CurTextPr.Color.g, CurTextPr.Color.b, 255);
        }
    }

	var isHiddenCFPart = PDSE.ComplexFields.IsComplexFieldCode();

    for ( var Pos = StartPos; Pos < EndPos; Pos++ )
    {
		var Item = this.private_CheckInstrText(this.Content[Pos]);
        var ItemType = Item.Type;

		if ((PDSE.ComplexFields.IsHiddenFieldContent() || isHiddenCFPart) && para_End !== ItemType && para_FieldChar !== ItemType)
			continue;

        var TempY = Y;

        switch (CurTextPr.VertAlign)
        {
            case AscCommon.vertalign_SubScript:
            {
                Y -= AscCommon.vaKSub * CurTextPr.FontSize * g_dKoef_pt_to_mm;
                break;
            }
            case AscCommon.vertalign_SuperScript:
            {
                Y -= AscCommon.vaKSuper * CurTextPr.FontSize * g_dKoef_pt_to_mm;
                break;
            }
        }

        switch( ItemType )
        {
            case para_PageNum:
            case para_PageCount:
            case para_Drawing:
            case para_Tab:
            case para_Text:
            case para_Sym:
            case para_FootnoteReference:
            case para_FootnoteRef:
            case para_Separator:
            case para_ContinuationSeparator:
            {
                if (para_Drawing != ItemType || Item.Is_Inline())
                {
                    Item.Draw(X, Y - this.YOffset, pGraphics, PDSE);
                    X += Item.Get_WidthVisible();
                }

                // Внутри отрисовки инлайн-автофигур могут изменится цвета и шрифт, поэтому восстанавливаем настройки
                if ((para_Drawing === ItemType && Item.Is_Inline()) || (para_Tab === ItemType))
                {
                    pGraphics.SetTextPr( CurTextPr, Theme );

                    if (reviewtype_Add === ReviewType || reviewtype_Remove === ReviewType)
                    {
                        pGraphics.b_color1(ReviewColor.r, ReviewColor.g, ReviewColor.b, 255);
                    }
                    else if (RGBA)
                    {
                        pGraphics.b_color1( RGBA.R, RGBA.G, RGBA.B, 255);
                        pGraphics.p_color( RGBA.R, RGBA.G, RGBA.B, 255);
                    }
                    else
                    {
                        if ( true === CurTextPr.Color.Auto )
                        {
                            pGraphics.b_color1( AutoColor.r, AutoColor.g, AutoColor.b, 255);
                            pGraphics.p_color( AutoColor.r, AutoColor.g, AutoColor.b, 255);
                        }
                        else
                        {
                            pGraphics.b_color1( CurTextPr.Color.r, CurTextPr.Color.g, CurTextPr.Color.b, 255);
                            pGraphics.p_color(  CurTextPr.Color.r, CurTextPr.Color.g, CurTextPr.Color.b, 255);
                        }
                    }
                }

                break;
            }
            case para_Space:
            {
                Item.Draw( X, Y - this.YOffset, pGraphics );

                X += Item.Get_WidthVisible();

                break;
            }
            case para_End:
            {
                var SectPr = Para.Get_SectionPr();
                if (!Para.LogicDocument || Para.LogicDocument !== Para.Parent)
                    SectPr = undefined;

                if ( undefined === SectPr )
                {
                	var oEndTextPr = Para.GetParaEndCompiledPr();

                    if (reviewtype_Common !== ReviewType)
                    {
                        pGraphics.SetTextPr(oEndTextPr, PDSE.Theme);
                        pGraphics.b_color1(ReviewColor.r, ReviewColor.g, ReviewColor.b, 255);
                    }
                    else if (oEndTextPr.Unifill)
                    {
						oEndTextPr.Unifill.check(PDSE.Theme, PDSE.ColorMap);
                        var RGBAEnd = oEndTextPr.Unifill.getRGBAColor();
                        pGraphics.SetTextPr(oEndTextPr, PDSE.Theme);
                        pGraphics.b_color1(RGBAEnd.R, RGBAEnd.G, RGBAEnd.B, 255);
                    }
                    else
                    {
                        pGraphics.SetTextPr(oEndTextPr, PDSE.Theme);
                        if (true === oEndTextPr.Color.Auto)
                            pGraphics.b_color1(AutoColor.r, AutoColor.g, AutoColor.b, 255);
                        else
                            pGraphics.b_color1(oEndTextPr.Color.r, oEndTextPr.Color.g, oEndTextPr.Color.b, 255);
                    }

                    var bEndCell = false;

                    var oDocContent = Para.GetParent();
                    var oCell       = oDocContent.IsTableCellContent(true);
                    if (oCell)
					{
						var oCellContent = oCell.GetContent();
						bEndCell = Para === oCellContent.GetLastParagraph();
					}

                    Item.Draw(X, Y - this.YOffset, pGraphics, bEndCell, reviewtype_Common !== ReviewType ?  true : false);
                }
                else
                {
                    Item.Draw(X, Y - this.YOffset, pGraphics, false, false);
                }

                X += Item.Get_Width();

                break;
            }
            case para_NewLine:
            {
                Item.Draw( X, Y - this.YOffset, pGraphics );
                X += Item.WidthVisible;
                break;
            }
            case para_Math_Ampersand:
            case para_Math_Text:
            case para_Math_BreakOperator:
            {
                var PosLine = this.ParaMath.GetLinePosition(PDSE.Line, PDSE.Range);
                Item.Draw(PosLine.x, PosLine.y, pGraphics, InfoMathText);
                X += Item.Get_WidthVisible();
                break;
            }
            case para_Math_Placeholder:
            {
                if(pGraphics.RENDERER_PDF_FLAG !== true) // если идет печать/ конвертация в PDF плейсхолдер не отрисовываем
                {
                    var PosLine = this.ParaMath.GetLinePosition(PDSE.Line, PDSE.Range);
                    Item.Draw(PosLine.x, PosLine.y, pGraphics, InfoMathText);
                    X += Item.Get_WidthVisible();
                }
                break;
            }
			case para_FieldChar:
			{
				PDSE.ComplexFields.ProcessFieldChar(Item);
				isHiddenCFPart = PDSE.ComplexFields.IsComplexFieldCode();

				if (Item.IsNumValue())
				{
					Item.Draw(X, Y - this.YOffset, pGraphics, PDSE);
					X += Item.Get_WidthVisible();
				}

				break;
			}
        }

        Y = TempY;
    }
    // Обновляем позицию
    PDSE.X = X;
};

ParaRun.prototype.Draw_Lines = function(PDSL)
{
    var CurLine  = PDSL.Line - this.StartLine;
    var CurRange = ( 0 === CurLine ? PDSL.Range - this.StartRange : PDSL.Range );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    var X        = PDSL.X;
    var Y        = PDSL.Baseline;
    var UndOff   = PDSL.UnderlineOffset;

    var Para       = PDSL.Paragraph;

    var aStrikeout  = PDSL.Strikeout;
    var aDStrikeout = PDSL.DStrikeout;
    var aUnderline  = PDSL.Underline;
    var aSpelling   = PDSL.Spelling;
    var aDUnderline = PDSL.DUnderline;

    var CurTextPr = this.Get_CompiledPr( false );
    var StrikeoutY = Y - this.YOffset;

    var fontCoeff = 1; // учтем ArgSize
    if(this.Type == para_Math_Run)
    {
        var ArgSize = this.Parent.Compiled_ArgSz;
        fontCoeff   = MatGetKoeffArgSize(CurTextPr.FontSize, ArgSize.value);
    }

	var UnderlineY = Y + UndOff - this.YOffset;
	var LineW      = (CurTextPr.FontSize / 18) * g_dKoef_pt_to_mm;

    switch(CurTextPr.VertAlign)
    {
        case AscCommon.vertalign_Baseline   :
		{
			StrikeoutY += -CurTextPr.FontSize * fontCoeff * g_dKoef_pt_to_mm * 0.27;
			break;
		}
        case AscCommon.vertalign_SubScript  :
		{
			StrikeoutY += -CurTextPr.FontSize * fontCoeff * AscCommon.vaKSize * g_dKoef_pt_to_mm * 0.27 - AscCommon.vaKSub * CurTextPr.FontSize  * fontCoeff * g_dKoef_pt_to_mm;
			UnderlineY -= AscCommon.vaKSub * CurTextPr.FontSize  * fontCoeff * g_dKoef_pt_to_mm;
			break;
		}
        case AscCommon.vertalign_SuperScript:
		{
			StrikeoutY += -CurTextPr.FontSize * fontCoeff * AscCommon.vaKSize * g_dKoef_pt_to_mm * 0.27 - AscCommon.vaKSuper * CurTextPr.FontSize * fontCoeff * g_dKoef_pt_to_mm;
			break;
		}
    }


    var BgColor = PDSL.BgColor;
    if ( undefined !== CurTextPr.Shd && c_oAscShdNil !== CurTextPr.Shd.Value  && !(CurTextPr.FontRef && CurTextPr.FontRef.Color) )
        BgColor = CurTextPr.Shd.Get_Color( Para );

    var CurColor, RGBA, Theme = this.Paragraph.Get_Theme(), ColorMap = this.Paragraph.Get_ColorMap();
    var AutoColor = ( undefined != BgColor && false === BgColor.Check_BlackAutoColor() ? new CDocumentColor( 255, 255, 255, false ) : new CDocumentColor( 0, 0, 0, false ) );
    if((BgColor == undefined || BgColor.Auto) && CurTextPr.FontRef && CurTextPr.FontRef.Color)
    {
        CurTextPr.FontRef.Color.check(Theme, ColorMap);
        RGBA = CurTextPr.FontRef.Color.RGBA;
        AutoColor = new CDocumentColor( RGBA.R, RGBA.G, RGBA.B, RGBA.A );
    }

    var ReviewType  = this.GetReviewType();
    var bAddReview  = reviewtype_Add === ReviewType ? true : false;
    var bRemReview  = reviewtype_Remove === ReviewType ? true : false;
    var ReviewColor = this.GetReviewColor();
    var oReviewInfo = this.GetReviewInfo();

    var oRemAddInfo  = oReviewInfo.GetPrevAdded();
    var isRemAdd     = !!oRemAddInfo;
    var oRemAddColor = oRemAddInfo ? oRemAddInfo.GetColor() : REVIEW_COLOR;

    // Выставляем цвет обводки

    var bPresentation = this.Paragraph && !this.Paragraph.bFromDocument;
    if (true === PDSL.VisitedHyperlink)
	{
		AscFormat.G_O_VISITED_HLINK_COLOR.check(Theme, ColorMap);
		RGBA     = AscFormat.G_O_VISITED_HLINK_COLOR.getRGBAColor();
		CurColor = new CDocumentColor(RGBA.R, RGBA.G, RGBA.B, RGBA.A);
	}
    else if ( true === CurTextPr.Color.Auto && !CurTextPr.Unifill)
	{
		CurColor = new CDocumentColor(AutoColor.r, AutoColor.g, AutoColor.b);
	}
    else
    {
        if(bPresentation && PDSL.Hyperlink)
        {
            AscFormat.G_O_HLINK_COLOR.check(Theme, ColorMap);
            RGBA = AscFormat.G_O_HLINK_COLOR.getRGBAColor();
            CurColor = new CDocumentColor( RGBA.R, RGBA.G, RGBA.B, RGBA.A );
        }
        else if(CurTextPr.Unifill)
        {
            CurTextPr.Unifill.check(Theme, ColorMap);
            RGBA = CurTextPr.Unifill.getRGBAColor();
            CurColor = new CDocumentColor( RGBA.R, RGBA.G, RGBA.B );
        }
        else
        {
            CurColor = new CDocumentColor( CurTextPr.Color.r, CurTextPr.Color.g, CurTextPr.Color.b );
        }
    }

    PDSL.CurPos.Update(StartPos, PDSL.CurDepth);
    var nSpellingErrorsCounter = PDSL.GetSpellingErrorsCounter();

    var SpellingMarksCount = this.SpellingMarks.length;
    var SpellDataLen = EndPos + 1;
    var SpellData = g_oSpellCheckerMarks.Check(SpellDataLen);
    var Mark = null, MarkIndex = 0;
    for ( var SPos = 0; SPos < SpellingMarksCount; SPos++)
    {
        Mark = this.SpellingMarks[SPos];

        if ( false === Mark.Element.Checked )
        {
            if ( true === Mark.Start )
            {
            	MarkIndex = Mark.Element.StartPos.Get(Mark.Depth);
            	if (MarkIndex < SpellDataLen)
            		SpellData[MarkIndex] += 1;
            }
            else
            {
				MarkIndex = Mark.Element.EndPos.Get(Mark.Depth);
				if (MarkIndex < SpellDataLen)
					SpellData[MarkIndex] -= 1;
            }
        }
    }

	var isHiddenCFPart = PDSL.ComplexFields.IsComplexFieldCode();

    for ( var Pos = StartPos; Pos < EndPos; Pos++ )
	{
		var Item             = this.private_CheckInstrText(this.Content[Pos]);
		var ItemType         = Item.Type;
		var ItemWidthVisible = Item.Get_WidthVisible();

		if ((PDSL.ComplexFields.IsHiddenFieldContent() || isHiddenCFPart) && para_End !== ItemType && para_FieldChar !== ItemType)
			continue;

		if (SpellData[Pos])
			nSpellingErrorsCounter += SpellData[Pos];

		switch (ItemType)
		{
			case para_End:
			{
				if (this.Paragraph)
				{
					if (bAddReview)
					{
						if (oReviewInfo.IsMovedTo())
							aDUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
						else
							aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
					}
					else if (bRemReview)
					{
						if (oReviewInfo.IsMovedFrom())
							aDStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
						else
							aStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);

						if (isRemAdd)
							aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, oRemAddColor.r, oRemAddColor.g, oRemAddColor.b);
					}
				}

				X += ItemWidthVisible;

				break;
			}
			case para_NewLine:
			{
				X += ItemWidthVisible;
				break;
			}

			case para_PageNum:
			case para_PageCount:
			case para_Drawing:
			case para_Tab:
			case para_Text:
			case para_Sym:
			case para_FootnoteReference:
			case para_FootnoteRef:
			case para_Separator:
			case para_ContinuationSeparator:
			{
				if (para_Text === ItemType && null !== this.CompositeInput && Pos >= this.CompositeInput.Pos && Pos < this.CompositeInput.Pos + this.CompositeInput.Length)
				{
					aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
				}

				if (para_Drawing != ItemType || Item.Is_Inline())
				{
					if (para_Drawing !== ItemType)
					{
						if (true === bRemReview)
						{
							if (oReviewInfo.IsMovedFrom())
								aDStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
							else
								aStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);

							if (isRemAdd)
								aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, oRemAddColor.r, oRemAddColor.g, oRemAddColor.b);
						}
						else if (true === CurTextPr.DStrikeout)
						{
							aDStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
						}
						else if (true === CurTextPr.Strikeout)
						{
							aStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
						}
					}

					if (true === bAddReview)
					{
						if (oReviewInfo.IsMovedTo())
							aDUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
						else
							aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
					}
					else if (true === CurTextPr.Underline)
					{
						aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
					}

					if (nSpellingErrorsCounter > 0)
						aSpelling.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, 0, 0, 0);

					X += ItemWidthVisible;
				}

				break;
			}
			case para_Space:
			{
				// Пробелы, идущие в конце строки, не подчеркиваем и не зачеркиваем
				if (PDSL.Spaces > 0)
				{
					if (true === bRemReview)
					{
						if (oReviewInfo.IsMovedFrom())
							aDStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
						else
							aStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);

						if (isRemAdd)
							aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, oRemAddColor.r, oRemAddColor.g, oRemAddColor.b);
					}
					else if (true === CurTextPr.DStrikeout)
					{
						aDStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
					}
					else if (true === CurTextPr.Strikeout)
					{
						aStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
					}

					if (true === bAddReview)
					{
						if (oReviewInfo.IsMovedTo())
							aDUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
						else
							aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
					}
					else if (true === CurTextPr.Underline)
					{
						aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
					}

					PDSL.Spaces--;
				}

				X += ItemWidthVisible;

				break;
			}
			case para_Math_Text:
			case para_Math_BreakOperator:
			case para_Math_Ampersand:
			{
				if (true === bRemReview)
				{
					if (oReviewInfo.IsMovedFrom())
						aDStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b, undefined, CurTextPr);
					else
						aStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b, undefined, CurTextPr);

					if (isRemAdd)
						aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, oRemAddColor.r, oRemAddColor.g, oRemAddColor.b);
				}
				else if (true === CurTextPr.DStrikeout)
				{
					aDStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
				}
				else if (true === CurTextPr.Strikeout)
				{
					aStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
				}

				if (true === bAddReview)
				{
					if (oReviewInfo.IsMovedTo())
						aDUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
					else
						aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
				}


				X += ItemWidthVisible;
				break;
			}
			case para_Math_Placeholder:
			{
				var ctrPrp = this.Parent.GetCtrPrp();
				if (true === bRemReview)
				{
					if (oReviewInfo.IsMovedFrom())
						aDStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b, undefined, CurTextPr);
					else
						aStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b, undefined, CurTextPr);

					if (isRemAdd)
						aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, oRemAddColor.r, oRemAddColor.g, oRemAddColor.b);
				}
				else if (true === ctrPrp.DStrikeout)
				{
					aDStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
				}
				else if (true === ctrPrp.Strikeout)
				{
					aStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
				}

				if (true === bAddReview)
				{
					if (oReviewInfo.IsMovedTo())
						aDUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
					else
						aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
				}

				X += ItemWidthVisible;
				break;
			}
			case para_FieldChar:
			{
				PDSL.ComplexFields.ProcessFieldChar(Item);
				isHiddenCFPart = PDSL.ComplexFields.IsComplexFieldCode();

				if (Item.IsNumValue())
				{
					if (true === bRemReview)
					{
						if (oReviewInfo.IsMovedFrom())
							aDStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
						else
							aStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);

						if (isRemAdd)
							aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, oRemAddColor.r, oRemAddColor.g, oRemAddColor.b);
					}
					else if (true === CurTextPr.DStrikeout)
					{
						aDStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
					}
					else if (true === CurTextPr.Strikeout)
					{
						aStrikeout.Add(StrikeoutY, StrikeoutY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
					}

					if (true === bAddReview)
					{
						if (oReviewInfo.IsMovedTo())
							aDUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
						else
							aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, ReviewColor.r, ReviewColor.g, ReviewColor.b);
					}
					else if (true === CurTextPr.Underline)
					{
						aUnderline.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, CurColor.r, CurColor.g, CurColor.b, undefined, CurTextPr);
					}

					if (nSpellingErrorsCounter > 0)
						aSpelling.Add(UnderlineY, UnderlineY, X, X + ItemWidthVisible, LineW, 0, 0, 0);

					X += ItemWidthVisible;
				}

				break;
			}
		}
	}

	if (true === this.Pr.HavePrChange() && para_Math_Run !== this.Type)
    {
        var ReviewColor = this.GetPrReviewColor();
        PDSL.RunReview.Add(0, 0, PDSL.X, X, 0, ReviewColor.r, ReviewColor.g, ReviewColor.b, {RunPr: this.Pr});
    }

    var CollPrChangeColor = this.private_GetCollPrChangeOther();
    if (false !== CollPrChangeColor)
        PDSL.CollChange.Add(0, 0, PDSL.X, X, 0, CollPrChangeColor.r, CollPrChangeColor.g, CollPrChangeColor.b, {RunPr : this.Pr});

    // Обновляем позицию
    PDSL.X = X;
};
//-----------------------------------------------------------------------------------
// Функции для работы с курсором
//-----------------------------------------------------------------------------------
// Находится ли курсор в начале рана
ParaRun.prototype.IsCursorPlaceable = function()
{
    return true;
};

ParaRun.prototype.Cursor_Is_Start = function()
{
    if ( this.State.ContentPos <= 0 )
        return true;

    return false;
};

// Проверяем нужно ли поправить позицию курсора
ParaRun.prototype.Cursor_Is_NeededCorrectPos = function()
{
    if ( true === this.Is_Empty(false) )
        return true;

    var NewRangeStart = false;
    var RangeEnd      = false;

    var Pos = this.State.ContentPos;

    var LinesLen = this.protected_GetLinesCount();
    for ( var CurLine = 0; CurLine < LinesLen; CurLine++ )
    {
        var RangesLen = this.protected_GetRangesCount(CurLine);
        for ( var CurRange = 0; CurRange < RangesLen; CurRange++ )
        {
            var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
            var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

            if (0 !== CurLine || 0 !== CurRange)
            {
                if (Pos === StartPos)
                {
                    NewRangeStart = true;
                }
            }

            if (Pos === EndPos)
            {
                RangeEnd = true;
            }
        }

        if ( true === NewRangeStart )
            break;
    }

    if ( true !== NewRangeStart && true !== RangeEnd && true === this.Cursor_Is_Start() )
        return true;

    return false;
};

ParaRun.prototype.Cursor_Is_End = function()
{
    if ( this.State.ContentPos >= this.Content.length )
        return true;

    return false;
};
/**
 * Проверяем находится ли курсор в начале рана
 * @returns {boolean}
 */
ParaRun.prototype.IsCursorAtBegin = function()
{
	return this.Cursor_Is_Start();
};
/**
 * Проверяем находится ли курсор в конце рана
 * @returns {boolean}
 */
ParaRun.prototype.IsCursorAtEnd = function()
{
	return this.Cursor_Is_End();
};

ParaRun.prototype.MoveCursorToStartPos = function()
{
    this.State.ContentPos = 0;
};

ParaRun.prototype.MoveCursorToEndPos = function(SelectFromEnd)
{
    if ( true === SelectFromEnd )
    {
        var Selection = this.State.Selection;
        Selection.Use      = true;
        Selection.StartPos = this.Content.length;
        Selection.EndPos   = this.Content.length;
    }
    else
    {
        var CurPos = this.Content.length;

        while ( CurPos > 0 )
        {
            if ( para_End === this.Content[CurPos - 1].Type )
                CurPos--;
            else
                break;
        }

        this.State.ContentPos = CurPos;
    }
};

ParaRun.prototype.Get_ParaContentPosByXY = function(SearchPos, Depth, _CurLine, _CurRange, StepEnd)
{
    var Result = false;

    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    var CurPos = StartPos;
    var InMathText = this.Type == para_Math_Run ? SearchPos.InText == true : false;

    if (CurPos >= EndPos)
	{
		// Заглушка, чтобы мы тыкая вправо попадали в самый правый пустой ран

		// Проверяем, попали ли мы в данный элемент
		var Diff = SearchPos.X - SearchPos.CurX;

		if (((Diff <= 0 && Math.abs(Diff) < SearchPos.DiffX - 0.001) || (Diff > 0 && Diff < SearchPos.DiffX + 0.001)) && (SearchPos.CenterMode || SearchPos.X > SearchPos.CurX) && InMathText == false)
		{
			SearchPos.DiffX = Math.abs(Diff);
			SearchPos.Pos.Update(CurPos, Depth);
			Result = true;
		}
	}
	else
	{
		for (; CurPos < EndPos; CurPos++)
		{
			var Item     = this.private_CheckInstrText(this.Content[CurPos]);
			var ItemType = Item.Type;

			var TempDx = 0;

			if (para_Drawing != ItemType || true === Item.Is_Inline())
			{
				TempDx = Item.Get_WidthVisible();
			}

			if (this.Type == para_Math_Run)
			{
				var PosLine    = this.ParaMath.GetLinePosition(_CurLine, _CurRange);
				var loc        = this.Content[CurPos].GetLocationOfLetter();
				SearchPos.CurX = PosLine.x + loc.x; // позиция формулы в строке + смещение буквы в контенте
			}

			// Проверяем, попали ли мы в данный элемент
			var Diff = SearchPos.X - SearchPos.CurX;


			if (((Diff <= 0 && Math.abs(Diff) < SearchPos.DiffX - 0.001) || (Diff > 0 && Diff < SearchPos.DiffX + 0.001)) && (SearchPos.CenterMode || SearchPos.X > SearchPos.CurX) && InMathText == false)
			{
				SearchPos.DiffX = Math.abs(Diff);
				SearchPos.Pos.Update(CurPos, Depth);
				Result = true;

				if (Diff >= -0.001 && Diff <= TempDx + 0.001)
				{
					SearchPos.InTextPos.Update(CurPos, Depth);
					SearchPos.InText = true;
				}
			}

			SearchPos.CurX += TempDx;

			// Заглушка для знака параграфа и конца строки
			Diff = SearchPos.X - SearchPos.CurX;
			if ((Math.abs(Diff) < SearchPos.DiffX + 0.001 && (SearchPos.CenterMode || SearchPos.X > SearchPos.CurX)) && InMathText == false)
			{
				if (para_End === ItemType)
				{
					SearchPos.End = true;

					// Если мы ищем позицию для селекта, тогда нужно искать и за знаком параграфа
					if (true === StepEnd)
					{
						SearchPos.DiffX = Math.abs(Diff);
						SearchPos.Pos.Update(this.Content.length, Depth);
						Result = true;
					}
				}
				else if (CurPos === EndPos - 1 && para_NewLine != ItemType)
				{
					SearchPos.DiffX = Math.abs(Diff);
					SearchPos.Pos.Update(EndPos, Depth);
					Result = true;
				}
			}
		}
	}

    // Такое возможно, если все раны до этого (в том числе и этот) были пустыми, тогда, чтобы не возвращать
    // неправильную позицию вернем позицию начала данного путого рана.
    if ( SearchPos.DiffX > 1000000 - 1 )
    {
    	SearchPos.DiffX = SearchPos.X - SearchPos.CurX;
        SearchPos.Pos.Update( StartPos, Depth );
        Result = true;
    }

    if (this.Type == para_Math_Run) // не только для пустых Run, но и для проверки на конец Run (т.к. Diff не обновляется)
    {
        //для пустых Run искомая позиция - позиция самого Run
        var bEmpty = this.Is_Empty();

        var PosLine = this.ParaMath.GetLinePosition(_CurLine, _CurRange);

        if(bEmpty)
            SearchPos.CurX = PosLine.x + this.pos.x;

        Diff = SearchPos.X - SearchPos.CurX;
        if(SearchPos.InText == false && (bEmpty || StartPos !== EndPos) && (Math.abs( Diff ) < SearchPos.DiffX + 0.001 && (SearchPos.CenterMode || SearchPos.X > SearchPos.CurX)))
        {
			SearchPos.DiffX = Math.abs(Diff);
			SearchPos.Pos.Update(CurPos, Depth);
			Result = true;
        }
    }

    return Result;
};

ParaRun.prototype.Get_ParaContentPos = function(bSelection, bStart, ContentPos, bUseCorrection)
{
    var Pos = ( true !== bSelection ? this.State.ContentPos : ( false !== bStart ? this.State.Selection.StartPos : this.State.Selection.EndPos ) );

    if (Pos < 0)
    	Pos = 0;

    if (Pos > this.Content.length)
    	Pos = this.Content.length;

    ContentPos.Add(Pos);
};

ParaRun.prototype.Set_ParaContentPos = function(ContentPos, Depth)
{
    var Pos = ContentPos.Get(Depth);

    var Count = this.Content.length;
    if ( Pos > Count )
        Pos = Count;

    // TODO: Как только переделаем работу c Para_End переделать здесь
    for ( var TempPos = 0; TempPos < Pos; TempPos++ )
    {
        if ( para_End === this.Content[TempPos].Type )
        {
            Pos = TempPos;
            break;
        }
    }

    if ( Pos < 0 )
        Pos = 0;

    this.State.ContentPos = Pos;
};

ParaRun.prototype.Get_PosByElement = function(Class, ContentPos, Depth, UseRange, Range, Line)
{
    if ( this === Class )
        return true;

    return false;
};

ParaRun.prototype.Get_ElementByPos = function(ContentPos, Depth)
{
    return this;
};

ParaRun.prototype.Get_PosByDrawing = function(Id, ContentPos, Depth)
{
    var Count = this.Content.length;
    for ( var CurPos = 0; CurPos < Count; CurPos++ )
    {
        var Item = this.Content[CurPos];
        if ( para_Drawing === Item.Type && Id === Item.Get_Id() )
        {
            ContentPos.Update( CurPos, Depth );
            return true;
        }
    }

    return false;
};

ParaRun.prototype.Get_RunElementByPos = function(ContentPos, Depth)
{
    if ( undefined !== ContentPos )
    {
        var CurPos = ContentPos.Get(Depth);
        var ContentLen = this.Content.length;

        if ( CurPos >= this.Content.length || CurPos < 0 )
            return null;

        return this.Content[CurPos];
    }
    else
    {
        if ( this.Content.length > 0 )
            return this.Content[0];
        else
            return null;
    }
};

ParaRun.prototype.Get_LastRunInRange = function(_CurLine, _CurRange)
{
    var CurLine = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    return this;
};

ParaRun.prototype.Get_LeftPos = function(SearchPos, ContentPos, Depth, UseContentPos)
{
	var CurPos = true === UseContentPos ? ContentPos.Get(Depth) : this.Content.length;

	var isFieldCode  = SearchPos.IsComplexFieldCode();
	var isFieldValue = SearchPos.IsComplexFieldValue();
	var isHiddenCF   = SearchPos.IsHiddenComplexField();

	while (true)
	{
		CurPos--;

		var Item = this.private_CheckInstrText(this.Content[CurPos]);

		if (CurPos >= 0 && para_FieldChar === Item.Type)
		{
			SearchPos.ProcessComplexFieldChar(-1, Item);
			isFieldCode  = SearchPos.IsComplexFieldCode();
			isFieldValue = SearchPos.IsComplexFieldValue();
			isHiddenCF   = SearchPos.IsHiddenComplexField();
		}

		if (CurPos >= 0 && (isFieldCode || isHiddenCF || (Item.IsDiacriticalSymbol && Item.IsDiacriticalSymbol())))
			continue;

		if (CurPos < 0 || (!(para_Drawing === Item.Type && false === Item.Is_Inline() && false === SearchPos.IsCheckAnchors()) && !(para_FootnoteReference === Item.Type && true === Item.IsCustomMarkFollows())))
			break;
	}

	if (CurPos >= 0)
	{
		SearchPos.Found = true;
		SearchPos.Pos.Update(CurPos, Depth);
	}
};

ParaRun.prototype.Get_RightPos = function(SearchPos, ContentPos, Depth, UseContentPos, StepEnd)
{
	var CurPos = ( true === UseContentPos ? ContentPos.Get(Depth) : 0 );

	var isFieldCode  = SearchPos.IsComplexFieldCode();
	var isFieldValue = SearchPos.IsComplexFieldValue();
	var isHiddenCF   = SearchPos.IsHiddenComplexField();

	var Count = this.Content.length;
	while (true)
	{
		CurPos++;

		// Мы встали в конец рана:
		//   Если мы перешагнули para_End или para_Drawing Anchor, тогда возвращаем false
		//   В противном случае true
		if (Count === CurPos)
		{
			if (CurPos === 0)
				return;

			var PrevItem     = this.private_CheckInstrText(this.Content[CurPos - 1]);
			var PrevItemType = PrevItem.Type;

			if (para_FieldChar === PrevItem.Type)
			{
				SearchPos.ProcessComplexFieldChar(1, PrevItem);
				isFieldCode  = SearchPos.IsComplexFieldCode();
				isFieldValue = SearchPos.IsComplexFieldValue();
				isHiddenCF   = SearchPos.IsHiddenComplexField();
			}

			if (isFieldCode || isHiddenCF)
				return;

			if ((true !== StepEnd && para_End === PrevItemType) || (para_Drawing === PrevItemType && false === PrevItem.Is_Inline() && false === SearchPos.IsCheckAnchors()) || (para_FootnoteReference === PrevItemType && true === PrevItem.IsCustomMarkFollows()))
				return;

			break;
		}

		if (CurPos > Count)
			break;

		if (this.Content[CurPos] && this.Content[CurPos].IsDiacriticalSymbol && this.Content[CurPos].IsDiacriticalSymbol())
			continue;

		// Минимальное значение CurPos = 1, т.к. мы начинаем со значния >= 0 и добавляем 1
		var Item     = this.private_CheckInstrText(this.Content[CurPos - 1]);
		var ItemType = Item.Type;

		if (para_FieldChar === Item.Type)
		{
			SearchPos.ProcessComplexFieldChar(1, Item);
			isFieldCode  = SearchPos.IsComplexFieldCode();
			isFieldValue = SearchPos.IsComplexFieldValue();
			isHiddenCF   = SearchPos.IsHiddenComplexField();
		}

		if (isFieldCode || isHiddenCF)
			continue;

		if (!(true !== StepEnd && para_End === ItemType)
			&& !(para_Drawing === Item.Type && false === Item.Is_Inline())
			&& !(para_FootnoteReference === Item.Type && true === Item.IsCustomMarkFollows()))
			break;
	}

	if (CurPos <= Count)
	{
		SearchPos.Found = true;
		SearchPos.Pos.Update(CurPos, Depth);
	}
};

ParaRun.prototype.Get_WordStartPos = function(SearchPos, ContentPos, Depth, UseContentPos)
{
    var CurPos = ( true === UseContentPos ? ContentPos.Get(Depth) - 1 : this.Content.length - 1 );

	SearchPos.UpdatePos = false;
	if (CurPos < 0 || this.Content.length <= 0)
		return;

    SearchPos.Shift = true;

	var isFieldCode  = SearchPos.IsComplexFieldCode();
	var isFieldValue = SearchPos.IsComplexFieldValue();
	var isHiddenCF   = SearchPos.IsHiddenComplexField();

    // На первом этапе ищем позицию первого непробельного элемента
    if ( 0 === SearchPos.Stage )
    {
        while ( true )
        {
            var Item = this.private_CheckInstrText(this.Content[CurPos]);
            var Type = Item.Type;

            var bSpace = false;

			if (para_FieldChar === Type)
			{
				SearchPos.ProcessComplexFieldChar(-1, Item);
				isFieldCode  = SearchPos.IsComplexFieldCode();
				isFieldValue = SearchPos.IsComplexFieldValue();
				isHiddenCF   = SearchPos.IsHiddenComplexField();
			}

            if ( para_Space === Type || para_Tab === Type || ( para_Text === Type && true === Item.Is_NBSP() ) || ( para_Drawing === Type && true !== Item.Is_Inline() ) )
                bSpace = true;

            if (true === bSpace || isFieldCode || isHiddenCF)
            {
                CurPos--;

				if (CurPos < 0)
				{
					SearchPos.Pos.Update(0, Depth);
					SearchPos.UpdatePos = true;
					return;
				}
            }
            else
            {
                // Если мы остановились на нетекстовом элементе, тогда его и возвращаем
                if ( para_Text !== this.Content[CurPos].Type && para_Math_Text !== this.Content[CurPos].Type)
                {
                    SearchPos.Pos.Update( CurPos, Depth );
                    SearchPos.Found     = true;
                    SearchPos.UpdatePos = true;
                    return;
                }

                SearchPos.Pos.Update( CurPos, Depth );
                SearchPos.Stage       = 1;
                SearchPos.Punctuation = this.Content[CurPos].IsPunctuation();
				SearchPos.UpdatePos   = true;

                break;
            }
        }
    }
    else
    {
        CurPos = ( true === UseContentPos ? ContentPos.Get(Depth) : this.Content.length );
    }

    // На втором этапе мы смотрим на каком элементе мы встали: если текст - пунктуация, тогда сдвигаемся
    // до конца всех знаков пунктуации

    while ( CurPos > 0 )
    {
        CurPos--;
        var Item = this.private_CheckInstrText(this.Content[CurPos]);
        var TempType = Item.Type;

		if (para_FieldChar === Item.Type)
		{
			SearchPos.ProcessComplexFieldChar(-1, Item);
			isFieldCode  = SearchPos.IsComplexFieldCode();
			isFieldValue = SearchPos.IsComplexFieldValue();
			isHiddenCF   = SearchPos.IsHiddenComplexField();
		}

		if (isFieldCode || isHiddenCF)
			continue;

        if ( (para_Text !== TempType && para_Math_Text !== TempType) || true === Item.Is_NBSP() || ( true === SearchPos.Punctuation && true !== Item.IsPunctuation() ) || ( false === SearchPos.Punctuation && false !== Item.IsPunctuation() ) )
        {
            SearchPos.Found = true;
            break;
        }
        else
        {
			SearchPos.Pos.Update(CurPos, Depth);
			SearchPos.UpdatePos = true;
        }
    }
};

ParaRun.prototype.Get_WordEndPos = function(SearchPos, ContentPos, Depth, UseContentPos, StepEnd)
{
    var CurPos = ( true === UseContentPos ? ContentPos.Get(Depth) : 0 );

	SearchPos.UpdatePos = false;

    var ContentLen = this.Content.length;
	if (CurPos >= ContentLen || ContentLen <= 0)
		return;

	var isFieldCode  = SearchPos.IsComplexFieldCode();
	var isFieldValue = SearchPos.IsComplexFieldValue();
	var isHiddenCF   = SearchPos.IsHiddenComplexField();

    if ( 0 === SearchPos.Stage )
    {
        // На первом этапе ищем первый нетекстовый ( и не таб ) элемент
        while ( true )
        {
            var Item = this.private_CheckInstrText(this.Content[CurPos]);
            var Type = Item.Type;
            var bText = false;

			if (para_FieldChar === Type)
			{
				SearchPos.ProcessComplexFieldChar(1, Item);
				isFieldCode  = SearchPos.IsComplexFieldCode();
				isFieldValue = SearchPos.IsComplexFieldValue();
				isHiddenCF   = SearchPos.IsHiddenComplexField();
			}

            if ( (para_Text === Type || para_Math_Text === Type) && true != Item.Is_NBSP() && ( true === SearchPos.First || ( SearchPos.Punctuation === Item.IsPunctuation() ) ) )
                bText = true;

            if (true === bText || isFieldCode || isHiddenCF)
            {
            	if (!isFieldCode && !isHiddenCF)
				{
					if (true === SearchPos.First)
					{
						SearchPos.First       = false;
						SearchPos.Punctuation = Item.IsPunctuation();
					}

					// Отмечаем, что сдвиг уже произошел
					SearchPos.Shift = true;
				}

                CurPos++;

				if (CurPos >= ContentLen)
				{
					SearchPos.Pos.Update(CurPos, Depth);
					SearchPos.UpdatePos = true;
					return;
				}
            }
            else
            {
                SearchPos.Stage = 1;

                // Первый найденный элемент не текстовый, смещаемся вперед
                if ( true === SearchPos.First )
                {
                    // Если первый найденный элемент - конец параграфа, тогда выходим из поиска
                    if ( para_End === Type )
                    {
                        if ( true === StepEnd )
                        {
                            SearchPos.Pos.Update( CurPos + 1, Depth );
                            SearchPos.Found     = true;
                            SearchPos.UpdatePos = true;
                        }

                        return;
                    }

                    CurPos++;

                    // Отмечаем, что сдвиг уже произошел
                    SearchPos.Shift = true;
                }

                if (SearchPos.IsTrimSpaces())
				{
					SearchPos.Pos.Update(CurPos, Depth);
					SearchPos.Found     = true;
					SearchPos.UpdatePos = true;
					return;
				}

                break;
            }
        }
    }

	if (CurPos >= ContentLen)
	{
		SearchPos.Pos.Update(CurPos, Depth);
		SearchPos.UpdatePos = true;
		return;
	}


    // На втором этапе мы смотрим на каком элементе мы встали: если это не пробел, тогда
    // останавливаемся здесь. В противном случае сдвигаемся вперед, пока не попали на первый
    // не пробельный элемент.
    if ( !(para_Space === this.Content[CurPos].Type || ( para_Text === this.Content[CurPos].Type && true === this.Content[CurPos].Is_NBSP() ) ) )
    {
        SearchPos.Pos.Update( CurPos, Depth );
        SearchPos.Found     = true;
        SearchPos.UpdatePos = true;
    }
    else
    {
        while ( CurPos < ContentLen - 1 )
        {
            CurPos++;
            var Item = this.private_CheckInstrText(this.Content[CurPos]);
            var TempType = Item.Type;

			if (para_FieldChar === Item.Type)
			{
				SearchPos.ProcessComplexFieldChar(1, Item);
				isFieldCode  = SearchPos.IsComplexFieldCode();
				isFieldValue = SearchPos.IsComplexFieldValue();
				isHiddenCF   = SearchPos.IsHiddenComplexField();
			}

			if (isFieldCode || isHiddenCF)
				continue;

            if ( (true !== StepEnd && para_End === TempType) || !( para_Space === TempType || ( para_Text === TempType && true === Item.Is_NBSP() ) ) )
            {
                SearchPos.Found = true;
                break;
            }
        }

        // Обновляем позицию в конце каждого рана (хуже от этого не будет)
		SearchPos.Pos.Update(CurPos, Depth);
		SearchPos.UpdatePos = true;
    }
};

ParaRun.prototype.Get_EndRangePos = function(_CurLine, _CurRange, SearchPos, Depth)
{
    var CurLine = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    var LastPos = -1;
    for ( var CurPos = StartPos; CurPos < EndPos; CurPos++ )
    {
        var Item = this.Content[CurPos];
        var ItemType = Item.Type;
        if ( !((para_Drawing === ItemType && true !== Item.Is_Inline()) || para_End === ItemType || (para_NewLine === ItemType && break_Line === Item.BreakType)))
            LastPos = CurPos + 1;
    }

    // Проверяем, попал ли хоть один элемент в данный отрезок, если нет, тогда не регистрируем такой ран
    if ( -1 !== LastPos )
    {
        SearchPos.Pos.Update( LastPos, Depth );
        return true;
    }
    else
        return false;
};

ParaRun.prototype.Get_StartRangePos = function(_CurLine, _CurRange, SearchPos, Depth)
{
    var CurLine = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    var FirstPos = -1;
    for ( var CurPos = EndPos - 1; CurPos >= StartPos; CurPos-- )
    {
        var Item = this.Content[CurPos];
        if ( !(para_Drawing === Item.Type && true !== Item.Is_Inline()) )
            FirstPos = CurPos;
    }

    // Проверяем, попал ли хоть один элемент в данный отрезок, если нет, тогда не регистрируем такой ран
    if ( -1 !== FirstPos )
    {
        SearchPos.Pos.Update( FirstPos, Depth );
        return true;
    }
    else
        return false;
};

ParaRun.prototype.Get_StartRangePos2 = function(_CurLine, _CurRange, ContentPos, Depth)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var Pos = this.protected_GetRangeStartPos(CurLine, CurRange);
    ContentPos.Update( Pos, Depth );
};

ParaRun.prototype.Get_EndRangePos2 = function(_CurLine, _CurRange, ContentPos, Depth)
{
	var CurLine  = _CurLine - this.StartLine;
	var CurRange = (0 === CurLine ? _CurRange - this.StartRange : _CurRange);
	var Pos      = this.protected_GetRangeEndPos(CurLine, CurRange);
	ContentPos.Update(Pos, Depth);
};

ParaRun.prototype.Get_StartPos = function(ContentPos, Depth)
{
    ContentPos.Update( 0, Depth );
};

ParaRun.prototype.Get_EndPos = function(BehindEnd, ContentPos, Depth)
{
    var ContentLen = this.Content.length;

    if ( true === BehindEnd )
        ContentPos.Update( ContentLen, Depth );
    else
    {
        for ( var CurPos = 0; CurPos < ContentLen; CurPos++ )
        {
            if ( para_End === this.Content[CurPos].Type )
            {
                ContentPos.Update( CurPos, Depth );
                return;
            }
        }

        // Не нашли para_End
        ContentPos.Update( ContentLen, Depth );
    }
};
//-----------------------------------------------------------------------------------
// Функции для работы с селектом
//-----------------------------------------------------------------------------------
ParaRun.prototype.Set_SelectionContentPos = function(StartContentPos, EndContentPos, Depth, StartFlag, EndFlag)
{
    var StartPos = 0;
    switch (StartFlag)
    {
        case  1: StartPos = 0; break;
        case -1: StartPos = this.Content.length; break;
        case  0: StartPos = StartContentPos.Get(Depth); break;
    }

    var EndPos = 0;
    switch (EndFlag)
    {
        case  1: EndPos = 0; break;
        case -1: EndPos = this.Content.length; break;
        case  0: EndPos = EndContentPos.Get(Depth); break;
    }

    var Selection = this.State.Selection;
    Selection.StartPos = StartPos;
    Selection.EndPos   = EndPos;
    Selection.Use      = true;
};
ParaRun.prototype.SetContentSelection = function(StartDocPos, EndDocPos, Depth, StartFlag, EndFlag)
{
    var StartPos = 0;
    switch (StartFlag)
    {
        case  1: StartPos = 0; break;
        case -1: StartPos = this.Content.length; break;
        case  0: StartPos = StartDocPos[Depth].Position; break;
    }

    var EndPos = 0;
    switch (EndFlag)
    {
        case  1: EndPos = 0; break;
        case -1: EndPos = this.Content.length; break;
        case  0: EndPos = EndDocPos[Depth].Position; break;
    }

    var Selection = this.State.Selection;
    Selection.StartPos = StartPos;
    Selection.EndPos   = EndPos;
    Selection.Use      = true;
};
ParaRun.prototype.SetContentPosition = function(DocPos, Depth, Flag)
{
    var Pos = 0;
    switch (Flag)
    {
        case  1: Pos = 0; break;
        case -1: Pos = this.Content.length; break;
        case  0: Pos = DocPos[Depth].Position; break;
    }

    var nLen = this.Content.length;
    if (nLen > 0 && Pos >= nLen && para_End === this.Content[nLen - 1].Type)
    	Pos = nLen - 1;

    this.State.ContentPos = Pos;
};
ParaRun.prototype.Set_SelectionAtEndPos = function()
{
    this.Set_SelectionContentPos(null, null, 0, -1, -1);
};

ParaRun.prototype.Set_SelectionAtStartPos = function()
{
    this.Set_SelectionContentPos(null, null, 0, 1, 1);
};

ParaRun.prototype.IsSelectionUse = function()
{
    return this.State.Selection.Use;
};

ParaRun.prototype.IsSelectedAll = function(Props)
{
    var Selection = this.State.Selection;
    if ( false === Selection.Use && true !== this.Is_Empty( Props ) )
        return false;

    var SkipAnchor = Props ? Props.SkipAnchor : false;
    var SkipEnd    = Props ? Props.SkipEnd    : false;

    var StartPos = Selection.StartPos;
    var EndPos   = Selection.EndPos;

    if ( EndPos < StartPos )
    {
        StartPos = Selection.EndPos;
        EndPos   = Selection.StartPos;
    }

    for ( var Pos = 0; Pos < StartPos; Pos++ )
    {
        var Item = this.Content[Pos];
        var ItemType = Item.Type;

        if ( !( ( true === SkipAnchor && ( para_Drawing === ItemType && true !== Item.Is_Inline() ) ) || ( true === SkipEnd && para_End === ItemType ) ) )
            return false;
    }

    var Count = this.Content.length;
    for ( var Pos = EndPos; Pos < Count; Pos++ )
    {
        var Item = this.Content[Pos];
        var ItemType = Item.Type;

        if ( !( ( true === SkipAnchor && ( para_Drawing === ItemType && true !== Item.Is_Inline() ) ) || ( true === SkipEnd && para_End === ItemType ) ) )
            return false;
    }

    return true;
};
ParaRun.prototype.IsSelectedFromStart = function()
{
	if (!this.Selection.Use && !this.IsEmpty())
		return false;

	return (Math.min(this.Selection.StartPos, this.Selection.EndPos) === 0);
};
ParaRun.prototype.IsSelectedToEnd = function()
{
	if (!this.Selection.Use && !this.IsEmpty())
		return false;

	return (Math.max(this.Selection.StartPos, this.Selection.EndPos) === this.Content.length);
};

ParaRun.prototype.SkipAnchorsAtSelectionStart = function(Direction)
{
	if (false === this.Selection.Use || true === this.IsEmpty({SkipAnchor : true}))
		return true;

	var oSelection = this.State.Selection;
	var nStartPos  = Math.min(oSelection.StartPos, oSelection.EndPos);
	var nEndPos    = Math.max(oSelection.StartPos, oSelection.EndPos);

	for (var nPos = 0; nPos < nStartPos; ++nPos)
	{
		var oItem = this.Content[nPos];
		if (para_Drawing !== oItem.Type || true === oItem.Is_Inline())
			return false;
	}

	for (var nPos = nStartPos; nPos < nEndPos; ++nPos)
	{
		var oItem = this.Content[nPos];
		if (para_Drawing === oItem.Type && true !== oItem.Is_Inline())
		{
			if (1 === Direction)
				oSelection.StartPos = nPos + 1;
			else
				oSelection.EndPos = nPos + 1;
		}
		else
		{
			return false;
		}
	}

	if (nEndPos < this.Content.length)
		return false;

	return true;
};

ParaRun.prototype.RemoveSelection = function()
{
    var Selection = this.State.Selection;

    Selection.Use      = false;
    Selection.StartPos = 0;
    Selection.EndPos   = 0;
};

ParaRun.prototype.SelectAll = function(Direction)
{
    var Selection = this.State.Selection;

    Selection.Use      = true;

    if ( -1 === Direction )
    {
        Selection.StartPos = this.Content.length;
        Selection.EndPos   = 0;
    }
    else
    {
        Selection.StartPos = 0;
        Selection.EndPos   = this.Content.length;
    }
};

ParaRun.prototype.Selection_DrawRange = function(_CurLine, _CurRange, SelectionDraw)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    var Selection = this.State.Selection;
    var SelectionUse      = Selection.Use;
    var SelectionStartPos = Selection.StartPos;
    var SelectionEndPos   = Selection.EndPos;

    if ( SelectionStartPos > SelectionEndPos )
    {
        SelectionStartPos = Selection.EndPos;
        SelectionEndPos   = Selection.StartPos;
    }

    var FindStart = SelectionDraw.FindStart;

    for(var CurPos = StartPos; CurPos < EndPos; CurPos++)
    {
        var Item = this.private_CheckInstrText(this.Content[CurPos]);
        var ItemType = Item.Type;
        var DrawSelection = false;

        if ( true === FindStart )
        {
            if ( true === Selection.Use && CurPos >= SelectionStartPos && CurPos < SelectionEndPos )
            {
                FindStart = false;

                DrawSelection = true;
            }
            else
            {
                if ( para_Drawing !== ItemType || true === Item.Is_Inline() )
                    SelectionDraw.StartX += Item.Get_WidthVisible();
            }
        }
        else
        {
            if ( true === Selection.Use && CurPos >= SelectionStartPos && CurPos < SelectionEndPos )
            {
                DrawSelection = true;
            }
        }

        if ( true === DrawSelection )
        {
            if (para_Drawing === ItemType && true !== Item.Is_Inline())
            {
                if (true === SelectionDraw.Draw)
                    Item.Draw_Selection();
            }
            else
                SelectionDraw.W += Item.Get_WidthVisible();
        }
    }

    SelectionDraw.FindStart = FindStart;
};

ParaRun.prototype.IsSelectionEmpty = function(CheckEnd)
{
    var Selection = this.State.Selection;
    if (true !== Selection.Use)
        return true;

    if(this.Type == para_Math_Run && this.IsPlaceholder())
        return true;

    var StartPos = Selection.StartPos;
    var EndPos   = Selection.EndPos;

    if ( StartPos > EndPos )
    {
        StartPos = Selection.EndPos;
        EndPos   = Selection.StartPos;
    }

    if ( true === CheckEnd )
        return ( EndPos > StartPos ? false : true );
    else if(this.Type == para_Math_Run && this.Is_Empty())
    {
        return false;
    }
    else
    {
        for ( var CurPos = StartPos; CurPos < EndPos; CurPos++ )
        {
            var ItemType = this.Content[CurPos].Type;
            if (para_End !== ItemType)
                return false;
        }
    }

    return true;
};

ParaRun.prototype.Selection_CheckParaEnd = function()
{
    var Selection = this.State.Selection;
    if ( true !== Selection.Use )
        return false;

    var StartPos = Selection.StartPos;
    var EndPos   = Selection.EndPos;

    if ( StartPos > EndPos )
    {
        StartPos = Selection.EndPos;
        EndPos   = Selection.StartPos;
    }

    for ( var CurPos = StartPos; CurPos < EndPos; CurPos++ )
    {
        var Item = this.Content[CurPos];

        if ( para_End === Item.Type )
            return true;
    }

    return false;
};

ParaRun.prototype.Selection_CheckParaContentPos = function(ContentPos, Depth, bStart, bEnd)
{
    var CurPos = ContentPos.Get(Depth);

    if (this.Selection.StartPos <= this.Selection.EndPos && this.Selection.StartPos <= CurPos && CurPos <= this.Selection.EndPos)
    {
        if ((true !== bEnd)   || (true === bEnd   && CurPos !== this.Selection.EndPos))
            return true;
    }
    else if (this.Selection.StartPos > this.Selection.EndPos && this.Selection.EndPos <= CurPos && CurPos <= this.Selection.StartPos)
    {
        if ((true !== bEnd)   || (true === bEnd   && CurPos !== this.Selection.StartPos))
            return true;
    }

    return false;
};
//-----------------------------------------------------------------------------------
// Функции для работы с настройками текста свойств
//-----------------------------------------------------------------------------------
ParaRun.prototype.Clear_TextFormatting = function( DefHyper )
{
    // Highlight и Lang не сбрасываются при очистке текстовых настроек

    this.Set_Bold( undefined );
    this.Set_Italic( undefined );
    this.Set_Strikeout( undefined );
    this.Set_Underline( undefined );
    this.Set_FontSize( undefined );
    this.Set_Color( undefined );
    this.Set_Unifill( undefined );
    this.Set_VertAlign( undefined );
    this.Set_Spacing( undefined );
    this.Set_DStrikeout( undefined );
    this.Set_Caps( undefined );
    this.Set_SmallCaps( undefined );
    this.Set_Position( undefined );
    this.Set_RFonts2( undefined );
    this.Set_RStyle( undefined );
    this.Set_Shd( undefined );
    this.Set_TextFill( undefined );
    this.Set_TextOutline( undefined );

    // Насильно заставим пересчитать стиль, т.к. как данная функция вызывается у параграфа, у которого мог смениться стиль
    this.Recalc_CompiledPr(true);
};

ParaRun.prototype.Get_TextPr = function()
{
    return this.Pr.Copy();
};

ParaRun.prototype.Get_FirstTextPr = function()
{
    return this.Pr;
};

ParaRun.prototype.Get_CompiledTextPr = function(Copy)
{
	if (true === this.State.Selection.Use && true === this.Selection_CheckParaEnd())
	{
		var oRunTextPr = this.Get_CompiledPr(true);
		var oEndTextPr = this.Paragraph.GetParaEndCompiledPr();

		oRunTextPr = oRunTextPr.Compare(oEndTextPr);

		return oRunTextPr;
	}
	else
	{
		return this.Get_CompiledPr(Copy);
	}
};

ParaRun.prototype.GetDirectTextPr = function()
{
	return this.Pr;
};

ParaRun.prototype.Recalc_CompiledPr = function(RecalcMeasure)
{
    this.RecalcInfo.TextPr  = true;

    // Если изменение какой-то текстовой настройки требует пересчета элементов
    if ( true === RecalcMeasure )
        this.RecalcInfo.Measure = true;

    // Если мы в формуле, тогда ее надо пересчитывать
    this.private_RecalcCtrPrp();
};

ParaRun.prototype.Recalc_RunsCompiledPr = function()
{
    this.Recalc_CompiledPr(true);
};

ParaRun.prototype.Get_CompiledPr = function(bCopy)
{
	if (this.IsStyleHyperlink() && this.IsInHyperlinkInTOC())
		this.RecalcInfo.TextPr = true;

    if ( true === this.RecalcInfo.TextPr )
    {
        this.RecalcInfo.TextPr = false;
        this.CompiledPr = this.Internal_Compile_Pr();
    }

    if ( false === bCopy )
        return this.CompiledPr;
    else
        return this.CompiledPr.Copy(); // Отдаем копию объекта, чтобы никто не поменял извне настройки стиля
};

ParaRun.prototype.Internal_Compile_Pr = function ()
{
	if (undefined === this.Paragraph || null === this.Paragraph)
	{
		// Сюда мы никогда не должны попадать, но на всякий случай,
		// чтобы не выпадало ошибок сгенерим дефолтовые настройки
		var TextPr = new CTextPr();
		TextPr.Init_Default();
		this.RecalcInfo.TextPr = true;
		return TextPr;
	}

	// Получим настройки текста, для данного параграфа
	var TextPr = this.Paragraph.Get_CompiledPr2(false).TextPr.Copy();

	// Мержим настройки стиля.
	// Одно исключение, когда задан стиль Hyperlink внутри класса Hyperlink внутри поля TOC, то стиль
	// мержить не надо и, более того, цвет и подчеркивание из прямых настроек тоже не используется.
	if (undefined !== this.Pr.RStyle)
	{
		if (!this.IsStyleHyperlink() || !this.IsInHyperlinkInTOC())
		{
			var Styles      = this.Paragraph.Parent.Get_Styles();
			var StyleTextPr = Styles.Get_Pr(this.Pr.RStyle, styletype_Character).TextPr;
			TextPr.Merge(StyleTextPr);
		}
	}

	if (this.Type == para_Math_Run)
	{
		if (undefined === this.Parent || null === this.Parent)
		{
			// Сюда мы никогда не должны попадать, но на всякий случай,
			// чтобы не выпадало ошибок сгенерим дефолтовые настройки
			var TextPr = new CTextPr();
			TextPr.Init_Default();
			this.RecalcInfo.TextPr = true;
			return TextPr;
		}

		if (!this.IsNormalText()) // math text
		{
			// выставим дефолтные текстовые настройки  для математических Run
			var Styles  = this.Paragraph.Parent.Get_Styles();
			var StyleId = this.Paragraph.Style_Get();
			// скопируем текстовые настройки прежде чем подменим на пустые

			var MathFont    = {Name : "Cambria Math", Index : -1};
			var oShapeStyle = null, oShapeTextPr = null;
			;
			if (Styles && typeof Styles.lastId === "string")
			{
				StyleId      = Styles.lastId;
				Styles       = Styles.styles;
				oShapeStyle  = Styles.Get(StyleId);
				oShapeTextPr = oShapeStyle.TextPr.Copy();
				oShapeStyle.TextPr.RFonts.Merge({Ascii : MathFont});
			}
			var StyleDefaultTextPr = Styles.Default.TextPr.Copy();


			// Ascii - по умолчанию шрифт Cambria Math
			// hAnsi, eastAsia, cs - по умолчанию шрифты не Cambria Math, а те, которые компилируются в документе
			Styles.Default.TextPr.RFonts.Merge({Ascii : MathFont});


			var Pr = Styles.Get_Pr(StyleId, styletype_Paragraph, null, null);

			TextPr.RFonts.Set_FromObject(Pr.TextPr.RFonts);

			// подменяем обратно
			Styles.Default.TextPr = StyleDefaultTextPr;
			if (oShapeStyle && oShapeTextPr)
			{
				oShapeStyle.TextPr = oShapeTextPr;
			}
		}


		if (this.IsPlaceholder())
		{

			TextPr.Merge(this.Parent.GetCtrPrp());
			TextPr.Merge(this.Pr);            // Мержим прямые настройки данного рана
		}
		else
		{
			TextPr.Merge(this.Pr);            // Мержим прямые настройки данного рана

			if (!this.IsNormalText()) // math text
			{
				var MPrp = this.MathPrp.GetTxtPrp();
				TextPr.Merge(MPrp); // bold, italic
			}
		}
	}
	else
	{
		TextPr.Merge(this.Pr); // Мержим прямые настройки данного рана

		if (this.Pr.Color && !this.Pr.Unifill)
		{
			TextPr.Unifill = undefined;
		}
	}

	if (TextPr.TextFill)
		TextPr.TextFill.check(this.Paragraph.Get_Theme(), this.Paragraph.Get_ColorMap());
	else if (TextPr.Unifill)
		TextPr.Unifill.check(this.Paragraph.Get_Theme(), this.Paragraph.Get_ColorMap());

	// Для совместимости со старыми версиями запишем FontFamily
	TextPr.FontFamily.Name  = TextPr.RFonts.Ascii.Name;
	TextPr.FontFamily.Index = TextPr.RFonts.Ascii.Index;

	return TextPr;
};

ParaRun.prototype.IsStyleHyperlink = function()
{
	if (!this.Paragraph || !this.Paragraph.bFromDocument || !this.Paragraph.LogicDocument || !this.Paragraph.LogicDocument.Get_Styles() || !this.Paragraph.LogicDocument.Get_Styles().GetDefaultHyperlink)
		return false;

	return (this.Pr.RStyle === this.Paragraph.LogicDocument.Get_Styles().GetDefaultHyperlink() ? true : false);
};
ParaRun.prototype.IsInHyperlinkInTOC = function()
{
	var oParagraph = this.GetParagraph();
	if (!oParagraph || !oParagraph.bFromDocument)
		return false;

	var oPos = oParagraph.Get_PosByElement(this);
	if (!oPos)
		return false;

	var isHyperlink = false;
	var arrClasses = oParagraph.Get_ClassesByPos(oPos);
	for (var nIndex = 0, nCount = arrClasses.length; nIndex < nCount; ++nIndex)
	{
		if (arrClasses[nIndex] instanceof ParaHyperlink)
		{
			isHyperlink = true;
			break;
		}
	}

	var arrComplexFields = oParagraph.GetComplexFieldsByPos(oPos);

	if (!isHyperlink)
	{
		for (var nIndex = 0, nCount = arrComplexFields.length; nIndex < nCount; ++nIndex)
		{
			var oInstruction = arrComplexFields[nIndex].GetInstruction();
			if (oInstruction && fieldtype_HYPERLINK === oInstruction.GetType())
			{
				isHyperlink = true;
				break;
			}
		}

		if (!isHyperlink)
			return false;
	}

	for (var nIndex = 0, nCount = arrComplexFields.length; nIndex < nCount; ++nIndex)
	{
		var oInstruction = arrComplexFields[nIndex].GetInstruction();
		if (oInstruction && fieldtype_TOC === oInstruction.GetType())
			return true;
	}

	return false;
};

ParaRun.prototype.Set_Pr = function(TextPr)
{
	return this.SetPr(TextPr);
};
/**
 * Жестко меняем настройки на заданные
 * @param {CTextPr} oTextPr
 */
ParaRun.prototype.SetPr = function(oTextPr)
{
	History.Add(new CChangesRunTextPr(this, this.Pr, oTextPr, this.private_IsCollPrChangeMine()));
	this.Pr = oTextPr;
	this.Recalc_CompiledPr(true);

	this.private_UpdateSpellChecking();
	this.private_UpdateTrackRevisionOnChangeTextPr(true);
};
ParaRun.prototype.Apply_TextPr = function(TextPr, IncFontSize, ApplyToAll)
{
	if (undefined === IncFontSize && this.Pr.Is_Equal(TextPr) && (!this.IsParaEndRun() || !this.Paragraph || this.Paragraph.TextPr.Value.Is_Equal(TextPr)))
		return [null, this, null];

    var bReview = false;
    if (this.Paragraph && this.Paragraph.LogicDocument && this.Paragraph.bFromDocument && true === this.Paragraph.LogicDocument.IsTrackRevisions())
        bReview = true;

    var ReviewType = this.GetReviewType();
    var IsPrChange = this.HavePrChange();
    if ( true === ApplyToAll )
    {
        if (true === bReview && true !== this.HavePrChange())
            this.AddPrChange();

        if ( undefined === IncFontSize )
        {
            this.Apply_Pr(TextPr);
        }
        else
        {
            var _TextPr = new CTextPr();
            var CurTextPr = this.Get_CompiledPr( false );

            this.private_AddCollPrChangeMine();
            this.Set_FontSize( FontSize_IncreaseDecreaseValue( IncFontSize, CurTextPr.FontSize ) );
        }

        // Дополнительно проверим, если у нас para_End лежит в данном ране и попадает в выделение, тогда
        // применим заданные настроки к символу конца параграфа

        // TODO: Возможно, стоит на этапе пересчета запонимать, лежит ли para_End в данном ране. Чтобы в каждом
        //       ране потом не бегать каждый раз по всему массиву в поисках para_End.

        var bEnd = false;
        var Count = this.Content.length;
        for ( var Pos = 0; Pos < Count; Pos++ )
        {
            if ( para_End === this.Content[Pos].Type )
            {
                bEnd = true;
                break;
            }
        }

        if ( true === bEnd )
		{
			if (undefined === IncFontSize)
			{
				if (!TextPr.AscFill && !TextPr.AscLine && !TextPr.AscUnifill)
				{
					this.Paragraph.TextPr.Apply_TextPr(TextPr);
				}
				else
				{
					var oEndTextPr = this.Paragraph.GetParaEndCompiledPr();
					if (TextPr.AscFill)
					{
						this.Paragraph.TextPr.Set_TextFill(AscFormat.CorrectUniFill(TextPr.AscFill, oEndTextPr.TextFill, 1));
					}
					if (TextPr.AscUnifill)
					{
						this.Paragraph.TextPr.Set_Unifill(AscFormat.CorrectUniFill(TextPr.AscUnifill, oEndTextPr.Unifill, 0));
					}
					if (TextPr.AscLine)
					{
						this.Paragraph.TextPr.Set_TextOutline(AscFormat.CorrectUniStroke(TextPr.AscLine, oEndTextPr.TextOutline, 0));
					}
				}
			}
			else
			{
				var oEndTextPr = this.Paragraph.GetParaEndCompiledPr();

				// TODO: Как только перенесем историю изменений TextPr в сам класс CTextPr, переделать тут
				this.Paragraph.TextPr.Set_FontSize(FontSize_IncreaseDecreaseValue(IncFontSize, oEndTextPr.FontSize));
			}
		}
    }
    else
    {
        var Result = [];
        var LRun = this, CRun = null, RRun = null;

        if ( true === this.State.Selection.Use )
        {
            var StartPos = this.State.Selection.StartPos;
            var EndPos   = this.State.Selection.EndPos;

            if (StartPos === EndPos && 0 !== this.Content.length)
			{
				CRun = this;
				LRun = null;
				RRun = null;
			}
			else
			{
				var Direction = 1;
				if (StartPos > EndPos)
				{
					var Temp  = StartPos;
					StartPos  = EndPos;
					EndPos    = Temp;
					Direction = -1;
				}

				// Если выделено не до конца, тогда разделяем по последней точке
				if (EndPos < this.Content.length)
				{
					RRun = LRun.Split_Run(EndPos);
					RRun.SetReviewType(ReviewType);
					if (IsPrChange)
						RRun.AddPrChange();
				}

				// Если выделено не с начала, тогда делим по начальной точке
				if (StartPos > 0)
				{
					CRun = LRun.Split_Run(StartPos);
					CRun.SetReviewType(ReviewType);
					if (IsPrChange)
						CRun.AddPrChange();
				}
				else
				{
					CRun = LRun;
					LRun = null;
				}

				if (null !== LRun)
				{
					LRun.Selection.Use      = true;
					LRun.Selection.StartPos = LRun.Content.length;
					LRun.Selection.EndPos   = LRun.Content.length;
				}

				CRun.SelectAll(Direction);

				if (true === bReview && true !== CRun.HavePrChange())
					CRun.AddPrChange();

				if (undefined === IncFontSize)
					CRun.Apply_Pr(TextPr);
				else
				{
					var _TextPr   = new CTextPr();
					var CurTextPr = this.Get_CompiledPr(false);

					CRun.private_AddCollPrChangeMine();
					CRun.Set_FontSize(FontSize_IncreaseDecreaseValue(IncFontSize, CurTextPr.FontSize));
				}

				if (null !== RRun)
				{
					RRun.Selection.Use      = true;
					RRun.Selection.StartPos = 0;
					RRun.Selection.EndPos   = 0;
				}

				// Дополнительно проверим, если у нас para_End лежит в данном ране и попадает в выделение, тогда
				// применим заданные настроки к символу конца параграфа

				// TODO: Возможно, стоит на этапе пересчета запонимать, лежит ли para_End в данном ране. Чтобы в каждом
				//       ране потом не бегать каждый раз по всему массиву в поисках para_End.

				if (true === this.Selection_CheckParaEnd())
				{
					if (undefined === IncFontSize)
					{
						if (!TextPr.AscFill && !TextPr.AscLine && !TextPr.AscUnifill)
						{
							this.Paragraph.TextPr.Apply_TextPr(TextPr);
						}
						else
						{
							var oEndTextPr = this.Paragraph.GetParaEndCompiledPr();
							if (TextPr.AscFill)
							{
								this.Paragraph.TextPr.Set_TextFill(AscFormat.CorrectUniFill(TextPr.AscFill, oEndTextPr.TextFill, 1));
							}
							if (TextPr.AscUnifill)
							{
								this.Paragraph.TextPr.Set_Unifill(AscFormat.CorrectUniFill(TextPr.AscUnifill, oEndTextPr.Unifill, 0));
							}
							if (TextPr.AscLine)
							{
								this.Paragraph.TextPr.Set_TextOutline(AscFormat.CorrectUniStroke(TextPr.AscLine, oEndTextPr.TextOutline, 0));
							}
						}
					}
					else
					{
						var oEndTextPr = this.Paragraph.GetParaEndCompiledPr();

						// TODO: Как только перенесем историю изменений TextPr в сам класс CTextPr, переделать тут
						this.Paragraph.TextPr.Set_FontSize(FontSize_IncreaseDecreaseValue(IncFontSize, oEndTextPr.FontSize));
					}
				}
			}
        }
        else
        {
            var CurPos = this.State.ContentPos;

            // Если выделено не до конца, тогда разделяем по последней точке
            if ( CurPos < this.Content.length )
            {
                RRun = LRun.Split_Run(CurPos);
                RRun.SetReviewType(ReviewType);
                if (IsPrChange)
                    RRun.AddPrChange();
            }

            if ( CurPos > 0 )
            {
                CRun = LRun.Split_Run(CurPos);
                CRun.SetReviewType(ReviewType);
                if (IsPrChange)
                    CRun.AddPrChange();
            }
            else
            {
                CRun = LRun;
                LRun = null;
            }

            if ( null !== LRun )
                LRun.RemoveSelection();

            CRun.RemoveSelection();
            CRun.MoveCursorToStartPos();

            if (true === bReview && true !== CRun.HavePrChange())
                CRun.AddPrChange();

            if ( undefined === IncFontSize )
            {
                CRun.Apply_Pr( TextPr );
            }
            else
            {
                var _TextPr = new CTextPr();
                var CurTextPr = this.Get_CompiledPr( false );
                CRun.private_AddCollPrChangeMine();
                CRun.Set_FontSize( FontSize_IncreaseDecreaseValue( IncFontSize, CurTextPr.FontSize ) );
            }


            if ( null !== RRun )
                RRun.RemoveSelection();
        }

        Result.push( LRun );
        Result.push( CRun );
        Result.push( RRun );

        return Result;
    }
};

ParaRun.prototype.Split_Run = function(Pos)
{
    History.Add(new CChangesRunOnStartSplit(this, Pos));
    AscCommon.CollaborativeEditing.OnStart_SplitRun(this, Pos);

    // Создаем новый ран
    var bMathRun = this.Type == para_Math_Run;
    var NewRun = new ParaRun(this.Paragraph, bMathRun);

    // Копируем настройки
    NewRun.Set_Pr(this.Pr.Copy(true));

    if(bMathRun)
        NewRun.Set_MathPr(this.MathPrp.Copy());


    var OldCrPos = this.State.ContentPos;
    var OldSSPos = this.State.Selection.StartPos;
    var OldSEPos = this.State.Selection.EndPos;

    // Разделяем содержимое по ранам
    NewRun.ConcatToContent( this.Content.slice(Pos) );
    this.Remove_FromContent( Pos, this.Content.length - Pos, true );

    // Подправим точки селекта и текущей позиции
    if ( OldCrPos >= Pos )
    {
        NewRun.State.ContentPos = OldCrPos - Pos;
        this.State.ContentPos   = this.Content.length;
    }
    else
    {
        NewRun.State.ContentPos = 0;
    }

    if ( OldSSPos >= Pos )
    {
        NewRun.State.Selection.StartPos = OldSSPos - Pos;
        this.State.Selection.StartPos   = this.Content.length;
    }
    else
    {
        NewRun.State.Selection.StartPos = 0;
    }

    if ( OldSEPos >= Pos )
    {
        NewRun.State.Selection.EndPos = OldSEPos - Pos;
        this.State.Selection.EndPos   = this.Content.length;
    }
    else
    {
        NewRun.State.Selection.EndPos = 0;
    }

    // Если были точки орфографии, тогда переместим их в новый ран
    var SpellingMarksCount = this.SpellingMarks.length;
    for ( var Index = 0; Index < SpellingMarksCount; Index++ )
    {
        var Mark    = this.SpellingMarks[Index];
        var MarkPos = ( true === Mark.Start ? Mark.Element.StartPos.Get(Mark.Depth) : Mark.Element.EndPos.Get(Mark.Depth) );

        if ( MarkPos >= Pos )
        {
            var MarkElement = Mark.Element;
            if ( true === Mark.Start )
            {
                //MarkElement.ClassesS[Mark.Depth]       = NewRun;
                MarkElement.StartPos.Data[Mark.Depth] -= Pos;
            }
            else
            {
                //MarkElement.ClassesE[Mark.Depth]     = NewRun;
                MarkElement.EndPos.Data[Mark.Depth] -= Pos;
            }

            NewRun.SpellingMarks.push( Mark );

            this.SpellingMarks.splice( Index, 1 );
            SpellingMarksCount--;
            Index--;
        }
    }

    History.Add(new CChangesRunOnEndSplit(this, NewRun));
    AscCommon.CollaborativeEditing.OnEnd_SplitRun(NewRun);
    return NewRun;
};

ParaRun.prototype.Clear_TextPr = function()
{
    // Данная функция вызывается пока только при изменении стиля параграфа. Оставляем в этой ситуации язык неизмененным,
    // а также не трогаем highlight.
    var NewTextPr = new CTextPr();
    NewTextPr.Lang      = this.Pr.Lang.Copy();
    NewTextPr.HighLight = this.Pr.Copy_HighLight();
    this.Set_Pr( NewTextPr );
};

/**
 * В данной функции мы применяем приходящие настройки поверх старых. Если значение undefined, то старое значение
 * не меняем, а если null, то удаляем его из прямых настроек.
 * @param {CTextPr} TextPr
 */
ParaRun.prototype.Apply_Pr = function(TextPr)
{
	this.private_AddCollPrChangeMine();

	if (this.Type == para_Math_Run && false === this.IsNormalText())
	{
		if (null === TextPr.Bold && null === TextPr.Italic)
			this.Math_Apply_Style(undefined);
		else
		{
			if (undefined != TextPr.Bold)
			{
				if (TextPr.Bold == true)
				{
					if (this.MathPrp.sty == STY_ITALIC || this.MathPrp.sty == undefined)
						this.Math_Apply_Style(STY_BI);
					else if (this.MathPrp.sty == STY_PLAIN)
						this.Math_Apply_Style(STY_BOLD);

				}
				else if (TextPr.Bold == false || TextPr.Bold == null)
				{
					if (this.MathPrp.sty == STY_BI || this.MathPrp.sty == undefined)
						this.Math_Apply_Style(STY_ITALIC);
					else if (this.MathPrp.sty == STY_BOLD)
						this.Math_Apply_Style(STY_PLAIN);
				}
			}

			if (undefined != TextPr.Italic)
			{
				if (TextPr.Italic == true)
				{
					if (this.MathPrp.sty == STY_BOLD)
						this.Math_Apply_Style(STY_BI);
					else if (this.MathPrp.sty == STY_PLAIN || this.MathPrp.sty == undefined)
						this.Math_Apply_Style(STY_ITALIC);
				}
				else if (TextPr.Italic == false || TextPr.Italic == null)
				{
					if (this.MathPrp.sty == STY_BI)
						this.Math_Apply_Style(STY_BOLD);
					else if (this.MathPrp.sty == STY_ITALIC || this.MathPrp.sty == undefined)
						this.Math_Apply_Style(STY_PLAIN);
				}
			}
		}
	}
	else
	{
		if (undefined !== TextPr.Bold)
			this.Set_Bold(null === TextPr.Bold ? undefined : TextPr.Bold);

		if (undefined !== TextPr.Italic)
			this.Set_Italic(null === TextPr.Italic ? undefined : TextPr.Italic);
	}

	if (undefined !== TextPr.Strikeout)
		this.Set_Strikeout(null === TextPr.Strikeout ? undefined : TextPr.Strikeout);

	if (undefined !== TextPr.Underline)
		this.Set_Underline(null === TextPr.Underline ? undefined : TextPr.Underline);

	if (undefined !== TextPr.FontSize)
		this.Set_FontSize(null === TextPr.FontSize ? undefined : TextPr.FontSize);

	if (undefined !== TextPr.Color && undefined === TextPr.Unifill)
	{
		this.Set_Color(null === TextPr.Color ? undefined : TextPr.Color);
		this.Set_Unifill(undefined);
		this.Set_TextFill(undefined);
	}
	else if (undefined !== TextPr.Unifill)
	{
		this.Set_Unifill(null === TextPr.Unifill ? undefined : TextPr.Unifill);
		this.Set_Color(undefined);
		this.Set_TextFill(undefined);
	}
	else if (undefined !== TextPr.AscUnifill && this.Paragraph)
	{
		if (!this.Paragraph.bFromDocument)
		{
			var oCompiledPr = this.Get_CompiledPr(true);
			this.Set_Unifill(AscFormat.CorrectUniFill(TextPr.AscUnifill, oCompiledPr.Unifill, 0), AscCommon.isRealObject(TextPr.AscUnifill) && TextPr.AscUnifill.asc_CheckForseSet());
			this.Set_Color(undefined);
			this.Set_TextFill(undefined);
		}
	}
	else if (undefined !== TextPr.TextFill)
	{
		this.Set_Unifill(undefined);
		this.Set_Color(undefined);
		this.Set_TextFill(null === TextPr.TextFill ? undefined : TextPr.TextFill);
	}
	else if (undefined !== TextPr.AscFill && this.Paragraph)
	{
		var oMergeUnifill, oColor;
		if (this.Paragraph.bFromDocument)
		{
			var oCompiledPr = this.Get_CompiledPr(true);
			if (oCompiledPr.TextFill)
			{
				oMergeUnifill = oCompiledPr.TextFill;
			}
			else if (oCompiledPr.Unifill)
			{
				oMergeUnifill = oCompiledPr.Unifill;
			}
			else if (oCompiledPr.Color)
			{
				oColor        = oCompiledPr.Color;
				oMergeUnifill = AscFormat.CreateUnfilFromRGB(oColor.r, oColor.g, oColor.b);
			}
			this.Set_Unifill(undefined);
			this.Set_Color(undefined);
			this.Set_TextFill(AscFormat.CorrectUniFill(TextPr.AscFill, oMergeUnifill, 1), AscCommon.isRealObject(TextPr.AscFill) && TextPr.AscFill.asc_CheckForseSet());
		}
	}

	if (undefined !== TextPr.TextOutline)
	{
		this.Set_TextOutline(null === TextPr.TextOutline ? undefined : TextPr.TextOutline);
	}
	else if (undefined !== TextPr.AscLine && this.Paragraph)
	{
		var oCompiledPr = this.Get_CompiledPr(true);
		this.Set_TextOutline(AscFormat.CorrectUniStroke(TextPr.AscLine, oCompiledPr.TextOutline, 0));
	}

	if (undefined !== TextPr.VertAlign)
		this.Set_VertAlign(null === TextPr.VertAlign ? undefined : TextPr.VertAlign);

	if (undefined !== TextPr.HighLight)
		this.Set_HighLight(null === TextPr.HighLight ? undefined : TextPr.HighLight);

	if (undefined !== TextPr.RStyle)
		this.Set_RStyle(null === TextPr.RStyle ? undefined : TextPr.RStyle);

	if (undefined !== TextPr.Spacing)
		this.Set_Spacing(null === TextPr.Spacing ? undefined : TextPr.Spacing);

	if (undefined !== TextPr.DStrikeout)
		this.Set_DStrikeout(null === TextPr.DStrikeout ? undefined : TextPr.DStrikeout);

	if (undefined !== TextPr.Caps)
		this.Set_Caps(null === TextPr.Caps ? undefined : TextPr.Caps);

	if (undefined !== TextPr.SmallCaps)
		this.Set_SmallCaps(null === TextPr.SmallCaps ? undefined : TextPr.SmallCaps);

	if (undefined !== TextPr.Position)
		this.Set_Position(null === TextPr.Position ? undefined : TextPr.Position);

	if (undefined !== TextPr.RFonts)
	{
		if (this.Type == para_Math_Run && !this.IsNormalText()) // при смене Font в этом случае (даже на Cambria Math) cs, eastAsia не меняются
		{
			// только для редактирования
			// делаем так для проверки действительно ли нужно сменить Font, чтобы при смене других текстовых настроек не выставился Cambria Math (TextPr.RFonts приходит всегда в виде объекта)
			if (TextPr.RFonts.Ascii !== undefined || TextPr.RFonts.HAnsi !== undefined)
			{
				var RFonts = new CRFonts();
				RFonts.Set_All("Cambria Math", -1);

				this.Set_RFonts2(RFonts);
			}
		}
		else
			this.Set_RFonts2(TextPr.RFonts);
	}


	if (undefined !== TextPr.Lang)
		this.Set_Lang2(TextPr.Lang);

	if (undefined !== TextPr.Shd)
		this.Set_Shd(null === TextPr.Shd ? undefined : TextPr.Shd);

	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		if (para_End === this.Content[nPos].Type)
			return this.Paragraph.TextPr.Apply_TextPr(TextPr);
	}
};
ParaRun.prototype.ApplyPr = function(oTextPr)
{
	return this.Apply_Pr(oTextPr);
};

ParaRun.prototype.HavePrChange = function()
{
    return this.Pr.HavePrChange();
};

ParaRun.prototype.GetPrReviewColor = function()
{
    if (this.Pr.ReviewInfo)
        return this.Pr.ReviewInfo.Get_Color();

    return REVIEW_COLOR;
};

ParaRun.prototype.AddPrChange = function()
{
    if (false === this.HavePrChange())
    {
        this.Pr.AddPrChange();
		History.Add(new CChangesRunPrChange(this,
			{
				PrChange   : undefined,
				ReviewInfo : undefined
			},
			{
				PrChange   : this.Pr.PrChange,
				ReviewInfo : this.Pr.ReviewInfo
			}));
		this.private_UpdateTrackRevisions();
    }
};

ParaRun.prototype.SetPrChange = function(PrChange, ReviewInfo)
{
	History.Add(new CChangesRunPrChange(this,
		{
			PrChange   : this.Pr.PrChange,
			ReviewInfo : this.Pr.ReviewInfo ? this.Pr.ReviewInfo.Copy() : undefined
		},
		{
			PrChange   : PrChange,
			ReviewInfo : ReviewInfo ? ReviewInfo.Copy() : undefined
		}));
	this.Pr.SetPrChange(PrChange, ReviewInfo);
    this.private_UpdateTrackRevisions();
};

ParaRun.prototype.RemovePrChange = function()
{
	if (true === this.HavePrChange())
	{
		History.Add(new CChangesRunPrChange(this,
			{
				PrChange   : this.Pr.PrChange,
				ReviewInfo : this.Pr.ReviewInfo
			},
			{
				PrChange   : undefined,
				ReviewInfo : undefined
			}));
		this.Pr.RemovePrChange();
		this.private_UpdateTrackRevisions();
	}
};

ParaRun.prototype.RejectPrChange = function()
{
    if (true === this.HavePrChange())
    {
		if (this.GetParaEnd())
			this.Paragraph.TextPr.SetPr(this.Pr.PrChange);

        this.Set_Pr(this.Pr.PrChange);

        this.RemovePrChange();
    }
};

ParaRun.prototype.AcceptPrChange = function()
{
    this.RemovePrChange();
};

ParaRun.prototype.GetDiffPrChange = function()
{
    return this.Pr.GetDiffPrChange();
};

ParaRun.prototype.Set_Bold = function(Value)
{
	return this.SetBold(Value);
};
/**
 * @param isBold {boolean}
 */
ParaRun.prototype.SetBold = function(isBold)
{
	if (isBold !== this.Pr.Bold)
	{
		History.Add(new CChangesRunBold(this, this.Pr.Bold, isBold, this.private_IsCollPrChangeMine()));
		this.Pr.Bold = isBold;

		this.Recalc_CompiledPr(true);
		this.private_UpdateTrackRevisionOnChangeTextPr(true);
	}
};

ParaRun.prototype.Get_Bold = function()
{
    return this.Get_CompiledPr(false).Bold;
};

ParaRun.prototype.Set_Italic = function(Value)
{
    if ( Value !== this.Pr.Italic )
    {
        var OldValue = this.Pr.Italic;
        this.Pr.Italic = Value;

        History.Add(new CChangesRunItalic(this, OldValue, Value, this.private_IsCollPrChangeMine()));

        this.Recalc_CompiledPr(true);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Get_Italic = function()
{
    return this.Get_CompiledPr(false).Italic;
};

ParaRun.prototype.Set_Strikeout = function(Value)
{
    if ( Value !== this.Pr.Strikeout )
    {
        var OldValue = this.Pr.Strikeout;
        this.Pr.Strikeout = Value;

        History.Add(new CChangesRunStrikeout(this, OldValue, Value, this.private_IsCollPrChangeMine()));

        this.Recalc_CompiledPr(false);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Get_Strikeout = function()
{
    return this.Get_CompiledPr(false).Strikeout;
};

ParaRun.prototype.Set_Underline = function(Value)
{
    if ( Value !== this.Pr.Underline )
    {
        var OldValue = this.Pr.Underline;
        this.Pr.Underline = Value;

        History.Add(new CChangesRunUnderline(this, OldValue, Value, this.private_IsCollPrChangeMine()));

        this.Recalc_CompiledPr(false);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Get_Underline = function()
{
    return this.Get_CompiledPr(false).Underline;
};

ParaRun.prototype.Set_FontSize = function(Value)
{
    if ( Value !== this.Pr.FontSize )
    {
        var OldValue = this.Pr.FontSize;
        this.Pr.FontSize = Value;

        History.Add(new CChangesRunFontSize(this, OldValue, Value, this.private_IsCollPrChangeMine()));

        this.Recalc_CompiledPr(true);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Get_FontSize = function()
{
    return this.Get_CompiledPr(false).FontSize;
};

ParaRun.prototype.Set_Color = function(Value)
{
    if ( ( undefined === Value && undefined !== this.Pr.Color ) || ( Value instanceof CDocumentColor && ( undefined === this.Pr.Color || false === Value.Compare(this.Pr.Color) ) ) )
    {
        var OldValue = this.Pr.Color;
        this.Pr.Color = Value;

        History.Add(new CChangesRunColor(this, OldValue, Value, this.private_IsCollPrChangeMine()));

        this.Recalc_CompiledPr(false);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Set_Unifill = function(Value, bForce)
{
    if ( ( undefined === Value && undefined !== this.Pr.Unifill ) || ( Value instanceof AscFormat.CUniFill && ( undefined === this.Pr.Unifill || false === AscFormat.CompareUnifillBool(this.Pr.Unifill, Value) ) ) || bForce )
    {
        var OldValue = this.Pr.Unifill;
        this.Pr.Unifill = Value;

        History.Add(new CChangesRunUnifill(this, OldValue, Value, this.private_IsCollPrChangeMine()));

        this.Recalc_CompiledPr(false);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};
ParaRun.prototype.Set_TextFill = function(Value, bForce)
{
    if ( ( undefined === Value && undefined !== this.Pr.TextFill ) || ( Value instanceof AscFormat.CUniFill && ( undefined === this.Pr.TextFill || false === AscFormat.CompareUnifillBool(this.Pr.TextFill.IsIdentical, Value) ) ) || bForce )
    {
        var OldValue = this.Pr.TextFill;
        this.Pr.TextFill = Value;

        History.Add(new CChangesRunTextFill(this, OldValue, Value, this.private_IsCollPrChangeMine()));

        this.Recalc_CompiledPr(false);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Set_TextOutline = function(Value)
{
    if ( ( undefined === Value && undefined !== this.Pr.TextOutline ) || ( Value instanceof AscFormat.CLn && ( undefined === this.Pr.TextOutline || false === this.Pr.TextOutline.IsIdentical(Value) ) ) )
    {
        var OldValue = this.Pr.TextOutline;
        this.Pr.TextOutline = Value;

        History.Add(new CChangesRunTextOutline(this, OldValue, Value, this.private_IsCollPrChangeMine()));

        this.Recalc_CompiledPr(false);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Get_Color = function()
{
    return this.Get_CompiledPr(false).Color;
};

ParaRun.prototype.Set_VertAlign = function(Value)
{
    if ( Value !== this.Pr.VertAlign )
    {
        var OldValue = this.Pr.VertAlign;
        this.Pr.VertAlign = Value;

        History.Add(new CChangesRunVertAlign(this, OldValue, Value, this.private_IsCollPrChangeMine()));

        this.Recalc_CompiledPr(true);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Get_VertAlign = function()
{
    return this.Get_CompiledPr(false).VertAlign;
};

ParaRun.prototype.Set_HighLight = function(Value)
{
    var OldValue = this.Pr.HighLight;
    if ( (undefined === Value && undefined !== OldValue) || ( highlight_None === Value && highlight_None !== OldValue ) || ( Value instanceof CDocumentColor && ( undefined === OldValue || highlight_None === OldValue || false === Value.Compare(OldValue) ) ) )
    {
        this.Pr.HighLight = Value;
        History.Add(new CChangesRunHighLight(this, OldValue, Value, this.private_IsCollPrChangeMine()));

        this.Recalc_CompiledPr(false);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Get_HighLight = function()
{
    return this.Get_CompiledPr(false).HighLight;
};


ParaRun.prototype.Set_RStyle = function(Value)
{
    if ( Value !== this.Pr.RStyle )
    {
        var OldValue = this.Pr.RStyle;
        this.Pr.RStyle = Value;

        History.Add(new CChangesRunRStyle(this, OldValue, Value, this.private_IsCollPrChangeMine()));

        this.Recalc_CompiledPr(true);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};
ParaRun.prototype.Get_RStyle = function()
{
	return this.Get_CompiledPr(false).RStyle;
};
ParaRun.prototype.GetRStyle = function()
{
	return this.Get_RStyle();
};
ParaRun.prototype.SetRStyle = function(sStyleId)
{
	this.Set_RStyle(sStyleId);
};

ParaRun.prototype.Set_Spacing = function(Value)
{
    if (Value !== this.Pr.Spacing)
    {
        var OldValue = this.Pr.Spacing;
        this.Pr.Spacing = Value;

        History.Add(new CChangesRunSpacing(this, OldValue, Value, this.private_IsCollPrChangeMine()));

        this.Recalc_CompiledPr(true);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Get_Spacing = function()
{
    return this.Get_CompiledPr(false).Spacing;
};

ParaRun.prototype.Set_DStrikeout = function(Value)
{
    if ( Value !== this.Pr.DStrikeout )
    {
        var OldValue = this.Pr.DStrikeout;
        this.Pr.DStrikeout = Value;

        History.Add(new CChangesRunDStrikeout(this, OldValue, Value, this.private_IsCollPrChangeMine()));

        this.Recalc_CompiledPr(false);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Get_DStrikeout = function()
{
    return this.Get_CompiledPr(false).DStrikeout;
};

ParaRun.prototype.Set_Caps = function(Value)
{
    if ( Value !== this.Pr.Caps )
    {
        var OldValue = this.Pr.Caps;
        this.Pr.Caps = Value;

        History.Add(new CChangesRunCaps(this, OldValue, Value, this.private_IsCollPrChangeMine()));
        this.Recalc_CompiledPr(true);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Get_Caps = function()
{
    return this.Get_CompiledPr(false).Caps;
};

ParaRun.prototype.Set_SmallCaps = function(Value)
{
    if ( Value !== this.Pr.SmallCaps )
    {
        var OldValue = this.Pr.SmallCaps;
        this.Pr.SmallCaps = Value;

        History.Add(new CChangesRunSmallCaps(this, OldValue, Value, this.private_IsCollPrChangeMine()));
        this.Recalc_CompiledPr(true);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Get_SmallCaps = function()
{
    return this.Get_CompiledPr(false).SmallCaps;
};

ParaRun.prototype.Set_Position = function(Value)
{
    if ( Value !== this.Pr.Position )
    {
        var OldValue = this.Pr.Position;
        this.Pr.Position = Value;

        History.Add(new CChangesRunPosition(this, OldValue, Value, this.private_IsCollPrChangeMine()));
        this.Recalc_CompiledPr(false);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);

        this.YOffset = this.Get_Position();
    }
};

ParaRun.prototype.Get_Position = function()
{
    return this.Get_CompiledPr(false).Position;
};

ParaRun.prototype.Set_RFonts = function(Value)
{
    var OldValue = this.Pr.RFonts;
    this.Pr.RFonts = Value;

    History.Add(new CChangesRunRFonts(this, OldValue, Value, this.private_IsCollPrChangeMine()));

    this.Recalc_CompiledPr(true);
    this.private_UpdateTrackRevisionOnChangeTextPr(true);
};

ParaRun.prototype.Get_RFonts = function()
{
    return this.Get_CompiledPr(false).RFonts;
};

ParaRun.prototype.Set_RFonts2 = function(RFonts)
{
	if (undefined !== RFonts)
	{
		if (undefined !== RFonts.Ascii)
			this.Set_RFonts_Ascii(RFonts.Ascii);

		if (undefined !== RFonts.HAnsi)
			this.Set_RFonts_HAnsi(RFonts.HAnsi);

		if (undefined !== RFonts.CS)
			this.Set_RFonts_CS(RFonts.CS);

		if (undefined !== RFonts.EastAsia)
			this.Set_RFonts_EastAsia(RFonts.EastAsia);

		if (undefined !== RFonts.Hint)
			this.Set_RFonts_Hint(RFonts.Hint);
	}
	else
	{
		this.Set_RFonts_Ascii(undefined);
		this.Set_RFonts_HAnsi(undefined);
		this.Set_RFonts_CS(undefined);
		this.Set_RFonts_EastAsia(undefined);
		this.Set_RFonts_Hint(undefined);
	}
};
ParaRun.prototype.Set_RFont_ForMathRun = function()
{
    this.Set_RFonts_Ascii({Name : "Cambria Math", Index : -1});
    this.Set_RFonts_CS({Name : "Cambria Math", Index : -1});
    this.Set_RFonts_EastAsia({Name : "Cambria Math", Index : -1});
    this.Set_RFonts_HAnsi({Name : "Cambria Math", Index : -1});
};
ParaRun.prototype.Set_RFonts_Ascii = function(Value)
{
	var _Value = (null === Value ? undefined : Value);

	if (_Value !== this.Pr.RFonts.Ascii)
	{
		var OldValue         = this.Pr.RFonts.Ascii;
		this.Pr.RFonts.Ascii = _Value;

		History.Add(new CChangesRunRFontsAscii(this, OldValue, _Value, this.private_IsCollPrChangeMine()));
		this.Recalc_CompiledPr(true);
		this.private_UpdateTrackRevisionOnChangeTextPr(true);
	}
};
ParaRun.prototype.Set_RFonts_HAnsi = function(Value)
{
	var _Value = (null === Value ? undefined : Value);

	if (_Value !== this.Pr.RFonts.HAnsi)
	{
		var OldValue         = this.Pr.RFonts.HAnsi;
		this.Pr.RFonts.HAnsi = _Value;

		History.Add(new CChangesRunRFontsHAnsi(this, OldValue, _Value, this.private_IsCollPrChangeMine()));
		this.Recalc_CompiledPr(true);
		this.private_UpdateTrackRevisionOnChangeTextPr(true);
	}
};
ParaRun.prototype.Set_RFonts_CS = function(Value)
{
	var _Value = (null === Value ? undefined : Value);

	if (_Value !== this.Pr.RFonts.CS)
	{
		var OldValue      = this.Pr.RFonts.CS;
		this.Pr.RFonts.CS = _Value;

		History.Add(new CChangesRunRFontsCS(this, OldValue, _Value, this.private_IsCollPrChangeMine()));
		this.Recalc_CompiledPr(true);
		this.private_UpdateTrackRevisionOnChangeTextPr(true);
	}
};
ParaRun.prototype.Set_RFonts_EastAsia = function(Value)
{
	var _Value = (null === Value ? undefined : Value);

	if (_Value !== this.Pr.RFonts.EastAsia)
	{
		var OldValue            = this.Pr.RFonts.EastAsia;
		this.Pr.RFonts.EastAsia = _Value;

		History.Add(new CChangesRunRFontsEastAsia(this, OldValue, _Value, this.private_IsCollPrChangeMine()));
		this.Recalc_CompiledPr(true);
		this.private_UpdateTrackRevisionOnChangeTextPr(true);
	}
};
ParaRun.prototype.Set_RFonts_Hint = function(Value)
{
	var _Value = (null === Value ? undefined : Value);

	if (_Value !== this.Pr.RFonts.Hint)
	{
		var OldValue        = this.Pr.RFonts.Hint;
		this.Pr.RFonts.Hint = _Value;

		History.Add(new CChangesRunRFontsHint(this, OldValue, _Value, this.private_IsCollPrChangeMine()));
		this.Recalc_CompiledPr(true);
		this.private_UpdateTrackRevisionOnChangeTextPr(true);
	}
};

ParaRun.prototype.Set_Lang = function(Value)
{
    var OldValue = this.Pr.Lang;

    this.Pr.Lang = new CLang();
    if ( undefined != Value )
        this.Pr.Lang.Set_FromObject( Value );

    History.Add(new CChangesRunLang(this, OldValue, this.Pr.Lang, this.private_IsCollPrChangeMine()));
    this.Recalc_CompiledPr(false);
    this.private_UpdateTrackRevisionOnChangeTextPr(true);
};

ParaRun.prototype.Set_Lang2 = function(Lang)
{
    if ( undefined != Lang )
    {
        if ( undefined != Lang.Bidi )
            this.Set_Lang_Bidi( Lang.Bidi );

        if ( undefined != Lang.EastAsia )
            this.Set_Lang_EastAsia( Lang.EastAsia );

        if ( undefined != Lang.Val )
            this.Set_Lang_Val( Lang.Val );

        this.private_UpdateSpellChecking();
    }
};

ParaRun.prototype.Set_Lang_Bidi = function(Value)
{
    if ( Value !== this.Pr.Lang.Bidi )
    {
        var OldValue = this.Pr.Lang.Bidi;
        this.Pr.Lang.Bidi = Value;

		History.Add(new CChangesRunLangBidi(this, OldValue, Value, this.private_IsCollPrChangeMine()));
        this.Recalc_CompiledPr(false);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Set_Lang_EastAsia = function(Value)
{
    if ( Value !== this.Pr.Lang.EastAsia )
    {
        var OldValue = this.Pr.Lang.EastAsia;
        this.Pr.Lang.EastAsia = Value;

        History.Add(new CChangesRunLangEastAsia(this, OldValue, Value, this.private_IsCollPrChangeMine()));
        this.Recalc_CompiledPr(false);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Set_Lang_Val = function(Value)
{
    if ( Value !== this.Pr.Lang.Val )
    {
        var OldValue = this.Pr.Lang.Val;
        this.Pr.Lang.Val = Value;

        History.Add(new CChangesRunLangVal(this, OldValue, Value, this.private_IsCollPrChangeMine()));
        this.Recalc_CompiledPr(false);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};

ParaRun.prototype.Set_Shd = function(Shd)
{
    if ( (undefined === this.Pr.Shd && undefined === Shd) || (undefined !== this.Pr.Shd && undefined !== Shd && true === this.Pr.Shd.Compare( Shd ) ) )
        return;

    var OldShd = this.Pr.Shd;

    if ( undefined !== Shd )
    {
        this.Pr.Shd = new CDocumentShd();
        this.Pr.Shd.Set_FromObject( Shd );
    }
    else
        this.Pr.Shd = undefined;

    History.Add(new CChangesRunShd(this, OldShd, this.Pr.Shd, this.private_IsCollPrChangeMine()));
    this.Recalc_CompiledPr(false);
    this.private_UpdateTrackRevisionOnChangeTextPr(true);
};

//-----------------------------------------------------------------------------------
// Undo/Redo функции
//-----------------------------------------------------------------------------------
ParaRun.prototype.Check_HistoryUninon = function(Data1, Data2)
{
    var Type1 = Data1.Type;
    var Type2 = Data2.Type;

    if ( AscDFH.historyitem_ParaRun_AddItem === Type1 && AscDFH.historyitem_ParaRun_AddItem === Type2 )
    {
        if ( 1 === Data1.Items.length && 1 === Data2.Items.length && Data1.Pos === Data2.Pos - 1 && para_Text === Data1.Items[0].Type && para_Text === Data2.Items[0].Type )
            return true;
    }

    return false;
};
//-----------------------------------------------------------------------------------
// Функции для совместного редактирования
//-----------------------------------------------------------------------------------
ParaRun.prototype.Write_ToBinary2 = function(Writer)
{
    Writer.WriteLong( AscDFH.historyitem_type_ParaRun );

    // Long     : Type
    // String   : Id
    // String   : Paragraph Id
    // Variable : CTextPr
    // Long     : ReviewType
    // Bool     : isUndefined ReviewInfo
    // ->false  : ReviewInfo
    // Long     : Количество элементов
    // Array of variable : массив с элементами

    Writer.WriteLong(this.Type);
    var ParagraphToWrite, PrToWrite, ContentToWrite;
    if(this.StartState)
    {
        ParagraphToWrite = this.StartState.Paragraph;
        PrToWrite = this.StartState.Pr;
        ContentToWrite = this.StartState.Content;
    }
    else
    {
        ParagraphToWrite = this.Paragraph;
        PrToWrite = this.Pr;
        ContentToWrite = this.Content;
    }

    Writer.WriteString2( this.Id );
    Writer.WriteString2( null !== ParagraphToWrite && undefined !== ParagraphToWrite ? ParagraphToWrite.Get_Id() : "" );
    PrToWrite.Write_ToBinary( Writer );
    Writer.WriteLong(this.ReviewType);
    if (this.ReviewInfo)
    {
        Writer.WriteBool(false);
        this.ReviewInfo.WriteToBinary(Writer);
    }
    else
    {
        Writer.WriteBool(true);
    }

    var Count = ContentToWrite.length;
    Writer.WriteLong( Count );
    for ( var Index = 0; Index < Count; Index++ )
    {
        var Item = ContentToWrite[Index];
        Item.Write_ToBinary( Writer );
    }
};

ParaRun.prototype.Read_FromBinary2 = function(Reader)
{
    // Long     : Type
    // String   : Id
    // String   : Paragraph Id
    // Variable : CTextPr
    // Long     : ReviewType
    // Bool     : isUndefined ReviewInfo
    // ->false  : ReviewInfo
    // Long     : Количество элементов
    // Array of variable : массив с элементами

    this.Type      = Reader.GetLong();
    this.Id        = Reader.GetString2();
    this.Paragraph = g_oTableId.Get_ById( Reader.GetString2() );
    this.Pr        = new CTextPr();
    this.Pr.Read_FromBinary( Reader );
    this.ReviewType = Reader.GetLong();
    this.ReviewInfo = new CReviewInfo();
    if (false === Reader.GetBool())
        this.ReviewInfo.ReadFromBinary(Reader);

    if (para_Math_Run == this.Type)
	{
        this.MathPrp = new CMPrp();
		this.size    = new CMathSize();
        this.pos     = new CMathPosition();
	}

    if(undefined !== editor && true === editor.isDocumentEditor)
    {
        var Count = Reader.GetLong();
        this.Content = [];
        for ( var Index = 0; Index < Count; Index++ )
        {
            var Element = ParagraphContent_Read_FromBinary( Reader );
            if ( null !== Element )
                this.Content.push( Element );
        }
    }
};

ParaRun.prototype.Clear_CollaborativeMarks = function()
{
    this.CollaborativeMarks.Clear();
    this.CollPrChangeOther = false;
};
ParaRun.prototype.private_AddCollPrChangeMine = function()
{
    this.CollPrChangeMine  = true;
    this.CollPrChangeOther = false;
};
ParaRun.prototype.private_IsCollPrChangeMine = function()
{
    if (true === this.CollPrChangeMine)
        return true;

    return false;
};
ParaRun.prototype.private_AddCollPrChangeOther = function(Color)
{
    this.CollPrChangeOther = Color;
    AscCommon.CollaborativeEditing.Add_ChangedClass(this);
};
ParaRun.prototype.private_GetCollPrChangeOther = function()
{
    return this.CollPrChangeOther;
};
/**
 * Специальная функция-заглушка, добавляем элементы за знаком конца параграфа, для поддержки разделителей, лежащих
 * между параграфами
 * @param {CRunElementBase} oElement
 */
ParaRun.prototype.AddAfterParaEnd = function(oElement)
{
	this.State.ContentPos = this.Content.length;
	this.AddToContent(this.State.ContentPos, oElement);
};
/**
 * Специальная функция очищающая метки переноса во время рецензирования
 * @param {CTrackRevisionsManager} oTrackManager
 */
ParaRun.prototype.RemoveTrackMoveMarks = function(oTrackManager)
{
	var oTrackMove = oTrackManager.GetProcessTrackMove();

	var sMoveId = oTrackMove.GetMoveId();
	var isFrom  = oTrackMove.IsFrom();

	for (var nPos = this.Content.length - 1; nPos >= 0; --nPos)
	{
		var oItem = this.Content[nPos];
		if (para_RevisionMove === oItem.Type)
		{
			if (sMoveId === oItem.GetMarkId())
			{
				if (isFrom === oItem.IsFrom())
					this.RemoveFromContent(nPos, 1, true);
			}
			else
			{
				oTrackMove.RegisterOtherMove(oItem.GetMarkId());
			}
		}
	}
};

ParaRun.prototype.private_RecalcCtrPrp = function()
{
    if (para_Math_Run === this.Type && undefined !== this.Parent && null !== this.Parent && null !== this.Parent.ParaMath)
        this.Parent.ParaMath.SetRecalcCtrPrp(this);
};
function CParaRunSelection()
{
    this.Use      = false;
    this.StartPos = 0;
    this.EndPos   = 0;
}

function CParaRunState()
{
    this.Selection  = new CParaRunSelection();
    this.ContentPos = 0;
}

function CParaRunRecalcInfo()
{
    this.TextPr  = true; // Нужно ли пересчитать скомпилированные настройки
    this.Measure = true; // Нужно ли перемерять элементы
    this.Recalc  = true; // Нужно ли пересчитывать (только если текстовый ран)
    this.RunLen  = 0;

    this.MeasurePositions = []; // Массив позиций элементов, которые нужно пересчитать

    // Далее идут параметры, которые выставляются после пересчета данного Range, такие как пересчитывать ли нумерацию
    this.NumberingItem = null;
    this.NumberingUse  = false; // Используется ли нумерация в данном ране
    this.NumberingAdd  = true;  // Нужно ли в следующем ране использовать нумерацию
}

CParaRunRecalcInfo.prototype.Reset = function()
{
	this.TextPr  = true;
	this.Measure = true;
	this.Recalc  = true;
	this.RunLen  = 0;

	this.MeasurePositions = [];
};
/**
 * Вызываем данную функцию после пересчета элементов рана
 */
CParaRunRecalcInfo.prototype.ResetMeasure = function()
{
	this.Measure          = false;
	this.MeasurePositions = [];
};
/**
 * Проверяем нужен ли пересчет элементов рана
 * @return {boolean}
 */
CParaRunRecalcInfo.prototype.IsMeasureNeed = function()
{
	return (this.Measure || this.MeasurePositions.length > 0);
};
/**
 * Регистрируем добавление элемента в ран
 * @param nPos {number}
 */
CParaRunRecalcInfo.prototype.OnAdd = function(nPos)
{
	if (this.Measure)
		return;

	for (var nIndex = 0, nCount = this.MeasurePositions.length; nIndex < nCount; ++nIndex)
	{
		if (this.MeasurePositions[nIndex] >= nPos)
			this.MeasurePositions[nIndex]++;
	}

	this.MeasurePositions.push(nPos);
};
/**
 * Регистрируем удаление элементов из рана
 * @param nPos {number}
 * @param nCount {number}
 */
CParaRunRecalcInfo.prototype.OnRemove = function(nPos, nCount)
{
	if (this.Measure)
		return;

	for (var nIndex = 0, nLen = this.MeasurePositions.length; nIndex < nLen; ++nIndex)
	{
		if (nPos <= this.MeasurePositions[nIndex] && this.MeasurePositions[nIndex] <= nPos + nCount - 1)
		{
			this.MeasurePositions.splice(nIndex, 1);
			nIndex--;
		}
		else if (this.MeasurePositions[nIndex] >= nPos + nCount)
		{
			this.MeasurePositions[nIndex] -= nCount;
		}
	}
};

function CParaRunRange(StartPos, EndPos)
{
    this.StartPos = StartPos; // Начальная позиция в контенте, с которой начинается данный отрезок
    this.EndPos   = EndPos;   // Конечная позиция в контенте, на которой заканчивается данный отрезок (перед которой)
}

function CParaRunLine()
{
    this.Ranges       = [];
    this.Ranges[0]    = new CParaRunRange( 0, 0 );
    this.RangesLength = 0;
}

CParaRunLine.prototype =
{
    Add_Range : function(RangeIndex, StartPos, EndPos)
    {
        if ( 0 !== RangeIndex )
        {
            this.Ranges[RangeIndex] = new CParaRunRange( StartPos, EndPos );
            this.RangesLength  = RangeIndex + 1;
        }
        else
        {
            this.Ranges[0].StartPos = StartPos;
            this.Ranges[0].EndPos   = EndPos;
            this.RangesLength = 1;
        }

        if ( this.Ranges.length > this.RangesLength )
            this.Ranges.legth = this.RangesLength;
    },

    Copy : function()
    {
        var NewLine = new CParaRunLine();

        NewLine.RangesLength = this.RangesLength;

        for ( var CurRange = 0; CurRange < this.RangesLength; CurRange++ )
        {
            var Range = this.Ranges[CurRange];
            NewLine.Ranges[CurRange] = new CParaRunRange( Range.StartPos, Range.EndPos );
        }

        return NewLine;
    },

    Compare : function(OtherLine, CurRange)
    {
        // Сначала проверим наличие данного отрезка в обеих строках
        if ( this.RangesLength <= CurRange || OtherLine.RangesLength <= CurRange )
            return false;

        var OtherRange = OtherLine.Ranges[CurRange];
        var ThisRange  = this.Ranges[CurRange];

        if ( OtherRange.StartPos !== ThisRange.StartPos || OtherRange.EndPos !== ThisRange.EndPos )
            return false;

        return true;
    }


};

// Метка о конце или начале изменений пришедших от других соавторов документа
var pararun_CollaborativeMark_Start = 0x00;
var pararun_CollaborativeMark_End   = 0x01;

function CParaRunCollaborativeMark(Pos, Type)
{
    this.Pos  = Pos;
    this.Type = Type;
}

function FontSize_IncreaseDecreaseValue(bIncrease, Value)
{
    // Закон изменения размеров :
    // 1. Если значение меньше 8, тогда мы увеличиваем/уменьшаем по 1 (от 1 до 8)
    // 2. Если значение больше 72, тогда мы увеличиваем/уменьшаем по 10 (от 80 до бесконечности
    // 3. Если значение в отрезке [8,72], тогда мы переходим по следующим числам 8,9,10,11,12,14,16,18,20,22,24,26,28,36,48,72

    var Sizes = [8,9,10,11,12,14,16,18,20,22,24,26,28,36,48,72];

    var NewValue = Value;
    if ( true === bIncrease )
    {
        if ( Value < Sizes[0] )
        {
            if ( Value >= Sizes[0] - 1 )
                NewValue = Sizes[0];
            else
                NewValue = Math.floor(Value + 1);
        }
        else if ( Value >= Sizes[Sizes.length - 1] )
        {
            NewValue = Math.min( 300, Math.floor( Value / 10 + 1 ) * 10 );
        }
        else
        {
            for ( var Index = 0; Index < Sizes.length; Index++ )
            {
                if ( Value < Sizes[Index] )
                {
                    NewValue = Sizes[Index];
                    break;
                }
            }
        }
    }
    else
    {
        if ( Value <= Sizes[0] )
        {
            NewValue = Math.max( Math.floor( Value - 1 ), 1 );
        }
        else if ( Value > Sizes[Sizes.length - 1] )
        {
            if ( Value <= Math.floor( Sizes[Sizes.length - 1] / 10 + 1 ) * 10 )
                NewValue = Sizes[Sizes.length - 1];
            else
                NewValue = Math.floor( Math.ceil(Value / 10) - 1 ) * 10;
        }
        else
        {
            for ( var Index = Sizes.length - 1; Index >= 0; Index-- )
            {
                if ( Value > Sizes[Index] )
                {
                    NewValue = Sizes[Index];
                    break;
                }
            }
        }
    }

    return NewValue;
}


function CRunCollaborativeMarks()
{
    this.Ranges = [];
    this.DrawingObj = {};
}

CRunCollaborativeMarks.prototype =
{
    Add : function(PosS, PosE, Color)
    {
        var Count = this.Ranges.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var Range = this.Ranges[Index];

            if ( PosS > Range.PosE )
                continue;
            else if ( PosS >= Range.PosS && PosS <= Range.PosE && PosE >= Range.PosS && PosE <= Range.PosE )
            {
                if ( true !== Color.Compare(Range.Color) )
                {
                    var _PosE = Range.PosE;
                    Range.PosE = PosS;
                    this.Ranges.splice( Index + 1, 0, new CRunCollaborativeRange(PosS, PosE, Color) );
                    this.Ranges.splice( Index + 2, 0, new CRunCollaborativeRange(PosE, _PosE, Range.Color) );
                }

                return;
            }
            else if ( PosE < Range.PosS )
            {
                this.Ranges.splice( Index, 0, new CRunCollaborativeRange(PosS, PosE, Color) );
                return;
            }
            else if ( PosS < Range.PosS && PosE > Range.PosE )
            {
                Range.PosS = PosS;
                Range.PosE = PosE;
                Range.Color = Color;
                return;
            }
            else if ( PosS < Range.PosS ) // && PosE <= Range.PosE )
            {
                if ( true === Color.Compare(Range.Color) )
                    Range.PosS = PosS;
                else
                {
                    Range.PosS = PosE;
                    this.Ranges.splice( Index, 0, new CRunCollaborativeRange(PosS, PosE, Color) );
                }

                return;
            }
            else //if ( PosS >= Range.PosS && PosE > Range.Pos.E )
            {
                if ( true === Color.Compare(Range.Color) )
                    Range.PosE = PosE;
                else
                {
                    Range.PosE = PosS;
                    this.Ranges.splice( Index + 1, 0, new CRunCollaborativeRange(PosS, PosE, Color) );
                }

                return;
            }
        }

        this.Ranges.push( new CRunCollaborativeRange(PosS, PosE, Color) );
    },

    Update_OnAdd : function(Pos)
    {
        var Count = this.Ranges.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var Range = this.Ranges[Index];

            if ( Pos <= Range.PosS )
            {
                Range.PosS++;
                Range.PosE++;
            }
            else if ( Pos > Range.PosS && Pos < Range.PosE )
            {
                var NewRange = new CRunCollaborativeRange( Pos + 1, Range.PosE + 1, Range.Color.Copy() );
                this.Ranges.splice( Index + 1, 0, NewRange );
                Range.PosE = Pos;
                Count++;
                Index++;
            }
            //else if ( Pos < Range.PosE )
            //    Range.PosE++;
        }
    },

    Update_OnRemove : function(Pos, Count)
    {
        var Len = this.Ranges.length;
        for ( var Index = 0; Index < Len; Index++ )
        {
            var Range = this.Ranges[Index];

            var PosE = Pos + Count;
            if ( Pos < Range.PosS )
            {
                if ( PosE <= Range.PosS )
                {
                    Range.PosS -= Count;
                    Range.PosE -= Count;
                }
                else if ( PosE >= Range.PosE )
                {
                    this.Ranges.splice( Index, 1 );
                    Len--;
                    Index--;continue;
                }
                else
                {
                    Range.PosS = Pos;
                    Range.PosE -= Count;
                }
            }
            else if ( Pos >= Range.PosS && Pos < Range.PosE )
            {
                if ( PosE >= Range.PosE )
                    Range.PosE = Pos;
                else
                    Range.PosE -= Count;
            }
            else
                continue;
        }
    },

    Clear : function()
    {
        this.Ranges = [];
    },

    Init_Drawing  : function()
    {
        this.DrawingObj = {};

        var Count = this.Ranges.length;
        for ( var CurPos = 0; CurPos < Count; CurPos++ )
        {
            var Range = this.Ranges[CurPos];

            for ( var Pos = Range.PosS; Pos < Range.PosE; Pos++ )
                this.DrawingObj[Pos] = Range.Color;
        }
    },

    Check : function(Pos)
    {
        if ( undefined !== this.DrawingObj[Pos] )
            return this.DrawingObj[Pos];

        return null;
    }
};

function CRunCollaborativeRange(PosS, PosE, Color)
{
    this.PosS  = PosS;
    this.PosE  = PosE;
    this.Color = Color;
}

ParaRun.prototype.Math_SetPosition = function(pos, PosInfo)
{
    var Line  = PosInfo.CurLine,
        Range = PosInfo.CurRange;

    var CurLine  = Line - this.StartLine;
    var CurRange = ( 0 === CurLine ? Range - this.StartRange : Range );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    // запомним позицию для Recalculate_CurPos, когда  Run пустой
    this.pos.x = pos.x;
    this.pos.y = pos.y;

    for(var Pos = StartPos; Pos < EndPos; Pos++)
    {
        var Item = this.Content[Pos];
        if(PosInfo.DispositionOpers !== null && Item.Type == para_Math_BreakOperator)
        {
            PosInfo.DispositionOpers.push(pos.x + Item.GapLeft);
        }

        this.Content[Pos].setPosition(pos);
        pos.x += this.Content[Pos].Get_WidthVisible(); // Get_Width => Get_WidthVisible
                                                     // Get_WidthVisible - Width + Gaps с учетом настроек состояния
    }
};
ParaRun.prototype.Math_Get_StartRangePos = function(_CurLine, _CurRange, SearchPos, Depth, bStartLine)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);

    var Pos = this.State.ContentPos;
    var Result = true;

    if(bStartLine || StartPos < Pos)
    {
        SearchPos.Pos.Update(StartPos, Depth);
    }
    else
    {
        Result = false;
    }

    return Result;
};
ParaRun.prototype.Math_Get_EndRangePos = function(_CurLine, _CurRange, SearchPos, Depth, bEndLine)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var EndPos = this.protected_GetRangeEndPos(CurLine, CurRange);

    var Pos = this.State.ContentPos;
    var Result = true;

    if(bEndLine  || Pos < EndPos)
    {
        SearchPos.Pos.Update(EndPos, Depth);
    }
    else
    {
        Result = false;
    }

    return Result;
};
ParaRun.prototype.Math_Is_End = function(_CurLine, _CurRange)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var EndPos = this.protected_GetRangeEndPos(CurLine, CurRange);

    return EndPos == this.Content.length;
};
ParaRun.prototype.IsEmptyRange = function(_CurLine, _CurRange)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    return StartPos == EndPos;
};
ParaRun.prototype.Recalculate_Range_OneLine = function(PRS, ParaPr, Depth)
{
    // данная функция используется только для мат объектов, которые на строки не разбиваются

    // ParaText (ParagraphContent.js)
    // для настройки TextPr
    // Measure

    // FontClassification.js
    // Get_FontClass

    var Lng = this.Content.length;

    var CurLine  = PRS.Line - this.StartLine;
    var CurRange = ( 0 === CurLine ? PRS.Range - this.StartRange : PRS.Range );


    // обновляем позиции start и end для Range
    var RangeStartPos = this.protected_AddRange(CurLine, CurRange);
    var RangeEndPos = Lng;

    this.Math_RecalculateContent(PRS);

    this.protected_FillRange(CurLine, CurRange, RangeStartPos, RangeEndPos);
};
ParaRun.prototype.Math_RecalculateContent = function(PRS)
{
    var WidthPoints = this.Parent.Get_WidthPoints();
    this.bEqArray = this.Parent.IsEqArray();

    var ascent = 0, descent = 0, width = 0;

    this.Recalculate_MeasureContent();
    var Lng = this.Content.length;

    for(var i = 0 ; i < Lng; i++)
    {
        var Item = this.Content[i];
        var size = Item.size,
            Type = Item.Type;

        var WidthItem = Item.Get_WidthVisible(); // Get_Width => Get_WidthVisible
                                                 // Get_WidthVisible - Width + Gaps с учетом настроек состояния
        width += WidthItem;

        if(ascent < size.ascent)
            ascent = size.ascent;

        if (descent < size.height - size.ascent)
            descent = size.height - size.ascent;

        if(this.bEqArray)
        {
            if(Type === para_Math_Ampersand && true === Item.IsAlignPoint())
            {
                WidthPoints.AddNewAlignRange();
            }
            else
            {
                WidthPoints.UpdatePoint(WidthItem);
            }
        }
    }

    this.size.width  = width;
    this.size.ascent = ascent;
    this.size.height = ascent + descent;
};
ParaRun.prototype.Math_Set_EmptyRange = function(_CurLine, _CurRange)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = (0 === CurLine ? _CurRange - this.StartRange : _CurRange);

    var RangeStartPos = this.protected_AddRange(CurLine, CurRange);
    var RangeEndPos   = RangeStartPos;

    this.protected_FillRange(CurLine, CurRange, RangeStartPos, RangeEndPos);
};
// в этой функции проставляем состояние Gaps (крайние или нет) для всех операторов, к-ые участвуют в разбиении, чтобы не получилось случайно, что при изменении разбивки формулы на строки произошло, что у оператора не будет проставлен Gap
ParaRun.prototype.UpdateOperators = function(_CurLine, _CurRange, bEmptyGapLeft, bEmptyGapRight)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    for(var Pos = StartPos; Pos < EndPos; Pos++)
    {
        var _bEmptyGapLeft  = bEmptyGapLeft && Pos == StartPos,
            _bEmptyGapRight = bEmptyGapRight && Pos == EndPos - 1;

        this.Content[Pos].Update_StateGapLeft(_bEmptyGapLeft);
        this.Content[Pos].Update_StateGapRight(_bEmptyGapRight);
    }
};
ParaRun.prototype.Math_Apply_Style = function(Value)
{
    if(Value !== this.MathPrp.sty)
    {
        var OldValue     = this.MathPrp.sty;
        this.MathPrp.sty = Value;

        History.Add(new CChangesRunMathStyle(this, OldValue, Value));

        this.Recalc_CompiledPr(true);
        this.private_UpdateTrackRevisionOnChangeTextPr(true);
    }
};
ParaRun.prototype.IsNormalText = function()
{
    var comp_MPrp = this.MathPrp.GetCompiled_ScrStyles();
    return comp_MPrp.nor === true;
};
ParaRun.prototype.getPropsForWrite = function()
{
    var prRPr = null, wRPrp = null;
    if(this.Paragraph && false === this.Paragraph.bFromDocument){
        prRPr = this.Pr.Copy();
    }
    else{
        wRPrp = this.Pr.Copy();
    }
    var mathRPrp = this.MathPrp.Copy();

    return {wRPrp: wRPrp, mathRPrp: mathRPrp, prRPrp: prRPr};
};
ParaRun.prototype.Get_MathPr = function(bCopy)
{
    if(this.Type = para_Math_Run)
    {
        if(bCopy)
            return this.MathPrp.Copy();
        else
            return this.MathPrp;
    }
};
ParaRun.prototype.Math_PreRecalc = function(Parent, ParaMath, ArgSize, RPI, GapsInfo)
{
    this.Parent    = Parent;
    this.Paragraph = ParaMath.Paragraph;

    var FontSize = this.Get_CompiledPr(false).FontSize;

    if(RPI.bChangeInline)
        this.RecalcInfo.Measure = true; // нужно сделать пересчет элементов, например для дроби, т.к. ArgSize у внутренних контентов будет другой => размер

    if(RPI.bCorrect_ConvertFontSize) // изменение FontSize после конвертации из старого формата в новый
    {
        var FontKoef;

        if(ArgSize == -1 || ArgSize == -2)
        {
            var Pr = new CTextPr();

            if(this.Pr.FontSize !== null && this.Pr.FontSize !== undefined)
            {
                FontKoef = MatGetKoeffArgSize(this.Pr.FontSize, ArgSize);
                Pr.FontSize = (((this.Pr.FontSize/FontKoef * 2 + 0.5) | 0) / 2);
                this.RecalcInfo.TextPr  = true;
                this.RecalcInfo.Measure = true;
            }

            if(this.Pr.FontSizeCS !== null && this.Pr.FontSizeCS !== undefined)
            {
                FontKoef = MatGetKoeffArgSize( this.Pr.FontSizeCS, ArgSize);
                Pr.FontSizeCS = (((this.Pr.FontSizeCS/FontKoef * 2 + 0.5) | 0) / 2);
                this.RecalcInfo.TextPr  = true;
                this.RecalcInfo.Measure = true;
            }

            this.Apply_Pr(Pr);
        }
    }

    for (var Pos = 0 ; Pos < this.Content.length; Pos++ )
    {
        if( !this.Content[Pos].IsAlignPoint() )
            GapsInfo.setGaps(this.Content[Pos], FontSize);

        this.Content[Pos].PreRecalc(this, ParaMath);
        this.Content[Pos].SetUpdateGaps(false);
    }

};
ParaRun.prototype.Math_GetRealFontSize = function(FontSize)
{
    var RealFontSize = FontSize ;

    if(FontSize !== null && FontSize !== undefined)
    {
        var ArgSize   = this.Parent.Compiled_ArgSz.value;
        RealFontSize  = FontSize*MatGetKoeffArgSize(FontSize, ArgSize);
    }

    return RealFontSize;
};
ParaRun.prototype.Math_CompareFontSize = function(ComparableFontSize, bStartLetter)
{
    var lng = this.Content.length;

    var Letter = this.Content[lng - 1];

    if(bStartLetter == true)
        Letter = this.Content[0];


    var CompiledPr = this.Get_CompiledPr(false);
    var LetterFontSize = Letter.Is_LetterCS() ? CompiledPr.FontSizeCS : CompiledPr.FontSize;

    return ComparableFontSize == this.Math_GetRealFontSize(LetterFontSize);
};
ParaRun.prototype.Math_EmptyRange = function(_CurLine, _CurRange) // до пересчета нужно узнать будет ли данный Run пустым или нет в данном Range, необходимо для того, чтобы выставить wrapIndent
{
    var bEmptyRange = true;
    var Lng = this.Content.length;

    if(Lng > 0)
    {
        var CurLine  = _CurLine - this.StartLine;
        var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

        bEmptyRange = this.protected_GetPrevRangeEndPos(CurLine, CurRange) >= Lng;
    }

    return bEmptyRange;
};
ParaRun.prototype.Math_UpdateGaps = function(_CurLine, _CurRange, GapsInfo)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

    var FontSize = this.Get_CompiledPr(false).FontSize;

    for(var Pos = StartPos; Pos < EndPos; Pos++)
    {
        GapsInfo.updateCurrentObject(this.Content[Pos], FontSize);

        var bUpdateCurrent = this.Content[Pos].IsNeedUpdateGaps();

        if(bUpdateCurrent || GapsInfo.bUpdate)
        {
            GapsInfo.updateGaps();
        }

        GapsInfo.bUpdate = bUpdateCurrent;

        this.Content[Pos].SetUpdateGaps(false);

    }
};
ParaRun.prototype.Math_Can_ModidyForcedBreak = function(Pr, bStart, bEnd)
{
    var Pos = this.Math_GetPosForcedBreak(bStart, bEnd);

    if(Pos !== null)
    {
        if(this.MathPrp.IsBreak())
        {
            Pr.Set_DeleteForcedBreak();
        }
        else
        {
            Pr.Set_InsertForcedBreak();
        }
    }

};
ParaRun.prototype.Math_GetPosForcedBreak = function(bStart, bEnd)
{
    var ResultPos = null;

    if(this.Content.length > 0)
    {
        var StartPos = this.Selection.StartPos,
            EndPos   = this.Selection.EndPos,
            bSelect  = this.Selection.Use;

        if(StartPos > EndPos)
        {
            StartPos = this.Selection.EndPos;
            EndPos   = this.Selection.StartPos;
        }

        var bCheckTwoItem = bSelect == false || (bSelect == true && EndPos == StartPos),
            bCheckOneItem = bSelect == true && EndPos - StartPos == 1;

        if(bStart)
        {
            ResultPos = this.Content[0].Type == para_Math_BreakOperator ? 0 : ResultPos;
        }
        else if(bEnd)
        {
            var lastPos = this.Content.length - 1;
            ResultPos = this.Content[lastPos].Type == para_Math_BreakOperator ? lastPos : ResultPos;
        }
        else if(bCheckTwoItem)
        {
            var Pos = bSelect == false ? this.State.ContentPos : StartPos;
            var bPrevBreakOperator  = Pos > 0 ? this.Content[Pos - 1].Type == para_Math_BreakOperator : false,
                bCurrBreakOperator  = Pos < this.Content.length ? this.Content[Pos].Type == para_Math_BreakOperator : false;

            if(bCurrBreakOperator)
            {
                ResultPos = Pos
            }
            else if(bPrevBreakOperator)
            {
                ResultPos = Pos - 1;
            }

        }
        else if(bCheckOneItem)
        {
            if(this.Content[StartPos].Type == para_Math_BreakOperator)
            {
                ResultPos = StartPos;
            }
        }
    }

    return ResultPos;
};
ParaRun.prototype.Check_ForcedBreak = function(bStart, bEnd)
{
    return this.Math_GetPosForcedBreak(bStart, bEnd) !== null;
};
ParaRun.prototype.Set_MathForcedBreak = function(bInsert)
{
	if (bInsert == true && false == this.MathPrp.IsBreak())
	{
		History.Add(new CChangesRunMathForcedBreak(this, true, undefined));
		this.MathPrp.Insert_ForcedBreak();
	}
	else if (bInsert == false && true == this.MathPrp.IsBreak())
	{
		History.Add(new CChangesRunMathForcedBreak(this, false, this.MathPrp.Get_AlnAt()));
		this.MathPrp.Delete_ForcedBreak();
	}
};
ParaRun.prototype.Math_SplitRunForcedBreak = function()
{
    var Pos =  this.Math_GetPosForcedBreak();
    var NewRun = null;

    if(Pos != null && Pos > 0) // разбиваем Run на два
    {
        NewRun = this.Split_Run(Pos);
    }

    return NewRun;
};
ParaRun.prototype.UpdLastElementForGaps = function(_CurLine, _CurRange, GapsInfo)
{
    var CurLine  = _CurLine - this.StartLine;
    var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

    var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);
    var FontSize = this.Get_CompiledPr(false).FontSize;
    var Last     = this.Content[EndPos];

    GapsInfo.updateCurrentObject(Last, FontSize);

};
ParaRun.prototype.IsPlaceholder = function()
{
    return this.Content.length == 1 && this.Content[0].IsPlaceholder && this.Content[0].IsPlaceholder();
};
ParaRun.prototype.AddMathPlaceholder = function()
{
    var oPlaceholder = new CMathText(false);
	oPlaceholder.SetPlaceholder();
    this.Add_ToContent(0, oPlaceholder, false);
};
ParaRun.prototype.RemoveMathPlaceholder = function()
{
	for (var nPos = 0; nPos < this.Content.length; ++nPos)
	{
		if (para_Math_Placeholder === this.Content[nPos].Type)
		{
			this.Remove_FromContent(nPos, 1, true);
			nPos--;
		}
	}
};
ParaRun.prototype.Set_MathPr = function(MPrp)
{
    var OldValue = this.MathPrp;
    this.MathPrp.Set_Pr(MPrp);

    History.Add(new CChangesRunMathPrp(this, OldValue, this.MathPrp));
    this.Recalc_CompiledPr(true);
    this.private_UpdateTrackRevisionOnChangeTextPr(true);
};
ParaRun.prototype.Set_MathTextPr2 = function(TextPr, MathPr)
{
    this.Set_Pr(TextPr.Copy());
    this.Set_MathPr(MathPr.Copy());
};
ParaRun.prototype.IsAccent = function()
{
    return this.Parent.IsAccent();
};
ParaRun.prototype.GetCompiled_ScrStyles = function()
{
    return this.MathPrp.GetCompiled_ScrStyles();
};
ParaRun.prototype.IsEqArray = function()
{
    return this.Parent.IsEqArray();
};
ParaRun.prototype.IsForcedBreak = function()
{
    var bForcedBreak = false;

    if(this.ParaMath!== null)
        bForcedBreak = false == this.ParaMath.Is_Inline() && true == this.MathPrp.IsBreak();

    return bForcedBreak;
};
ParaRun.prototype.Is_StartForcedBreakOperator = function()
{
    var bStartOperator = this.Content.length > 0 && this.Content[0].Type == para_Math_BreakOperator;
    return true == this.IsForcedBreak() && true == bStartOperator;
};
ParaRun.prototype.Get_AlignBrk = function(_CurLine, bBrkBefore)
{
    // null      - break отсутствует
    // 0         - break присутствует, alnAt = undefined
    // Number    = break присутствует, alnAt = Number


    // если оператор находится в конце строки и по этому оператору осушествляется принудительный перенос (Forced)
    // тогда StartPos = 0, EndPos = 1 (для предыдущей строки), т.к. оператор с принудительным переносом всегда должен находится в начале Run

    var CurLine  = _CurLine - this.StartLine;
    var AlnAt = null;

    if(CurLine > 0)
    {
        var RangesCount = this.protected_GetRangesCount(CurLine - 1);
        var StartPos = this.protected_GetRangeStartPos(CurLine - 1, RangesCount - 1);
        var EndPos = this.protected_GetRangeEndPos(CurLine - 1, RangesCount - 1);

        var bStartBreakOperator = bBrkBefore == true && StartPos == 0 && EndPos == 0;
        var bEndBreakOperator   = bBrkBefore == false && StartPos == 0 && EndPos == 1;

        if(bStartBreakOperator || bEndBreakOperator)
        {
            AlnAt = false == this.Is_StartForcedBreakOperator() ? null : this.MathPrp.Get_AlignBrk();
        }
    }

    return AlnAt;
};
ParaRun.prototype.Math_Is_InclineLetter = function()
{
    var result = false;

    if(this.Content.length == 1)
        result = this.Content[0].Is_InclineLetter();

    return result;
};
ParaRun.prototype.GetMathTextPrForMenu = function()
{
    var TextPr = new CTextPr();

    if(this.IsPlaceholder())
        TextPr.Merge(this.Parent.GetCtrPrp());

    TextPr.Merge(this.Pr);

    var MathTextPr = this.MathPrp.Copy();
    var BI = MathTextPr.GetBoldItalic();

    TextPr.Italic = BI.Italic;
    TextPr.Bold   = BI.Bold;

    return TextPr;
};
ParaRun.prototype.ApplyPoints = function(PointsInfo)
{
    if(this.Parent.IsEqArray())
    {
        this.size.width = 0;

        for(var Pos = 0; Pos < this.Content.length; Pos++)
        {
            var Item = this.Content[Pos];
            if(Item.Type === para_Math_Ampersand && true === Item.IsAlignPoint())
            {
                PointsInfo.NextAlignRange();
                Item.size.width = PointsInfo.GetAlign();
            }

            this.size.width += this.Content[Pos].Get_WidthVisible(); // Get_Width => Get_WidthVisible
                                                                     // Get_WidthVisible - Width + Gaps с учетом настроек состояния
        }
    }
};
ParaRun.prototype.Get_TextForAutoCorrect = function(AutoCorrectEngine, RunPos)
{
    var ActionElement = AutoCorrectEngine.Get_ActionElement();
    var nCount = this.Content.length;
    for (var nPos = 0; nPos < nCount; nPos++)
    {
        var Item = this.Content[nPos];
        if (para_Math_Text === Item.Type || para_Math_BreakOperator === Item.Type)
        {
            AutoCorrectEngine.Add_Text(String.fromCharCode(Item.value), this, nPos, RunPos, Item.Pos);
        }
		else if (para_Math_Ampersand === Item.Type)
		{
			 AutoCorrectEngine.Add_Text('&', this, nPos, RunPos, Item.Pos);
		}

        if (Item === ActionElement)
        {
            AutoCorrectEngine.Stop_CollectText();
            break;
        }
    }

    if (null === AutoCorrectEngine.TextPr)
        AutoCorrectEngine.TextPr = this.Pr.Copy();

    if (null == AutoCorrectEngine.MathPr)
        AutoCorrectEngine.MathPr = this.MathPrp.Copy();
};
ParaRun.prototype.IsShade = function()
{
    var oShd = this.Get_CompiledPr(false).Shd;
    return !(oShd === undefined || c_oAscShdNil === oShd.Value);
};
ParaRun.prototype.Get_RangesByPos = function(Pos)
{
    var Ranges = [];
    var LinesCount = this.protected_GetLinesCount();
    for (var LineIndex = 0; LineIndex < LinesCount; LineIndex++)
    {
        var RangesCount = this.protected_GetRangesCount(LineIndex);
        for (var RangeIndex = 0; RangeIndex < RangesCount; RangeIndex++)
        {
            var StartPos = this.protected_GetRangeStartPos(LineIndex, RangeIndex);
            var EndPos   = this.protected_GetRangeEndPos(LineIndex, RangeIndex);

            if (StartPos <= Pos && Pos <= EndPos)
                Ranges.push({Range : (LineIndex === 0 ? RangeIndex + this.StartRange : RangeIndex), Line : LineIndex + this.StartLine});
        }
    }

    return Ranges;
};
ParaRun.prototype.CompareDrawingsLogicPositions = function(CompareObject)
{
    var Drawing1 = CompareObject.Drawing1;
    var Drawing2 = CompareObject.Drawing2;

    for (var Pos = 0, Count = this.Content.length; Pos < Count; Pos++)
    {
        var Item = this.Content[Pos];

        if (Item === Drawing1)
        {
            CompareObject.Result = 1;
            return;
        }
        else if (Item === Drawing2)
        {
            CompareObject.Result = -1;
            return;
        }
    }
};
ParaRun.prototype.GetReviewType = function()
{
    return this.ReviewType;
};
ParaRun.prototype.GetReviewMoveType = function()
{
	return this.ReviewInfo.MoveType;
};
ParaRun.prototype.RemoveReviewMoveType = function()
{
	if (!this.ReviewInfo || Asc.c_oAscRevisionsMove.NoMove === this.ReviewInfo.MoveType)
		return;

	var oInfo = this.ReviewInfo.Copy();
	oInfo.MoveType = Asc.c_oAscRevisionsMove.NoMove;

	History.Add(new CChangesRunReviewType(this, {
		ReviewType : this.ReviewType,
		ReviewInfo : this.ReviewInfo.Copy()
	}, {
		ReviewType : this.ReviewType,
		ReviewInfo : oInfo.Copy()
	}));

	this.ReviewInfo = oInfo;
	this.private_UpdateTrackRevisions();
};
ParaRun.prototype.GetReviewInfo = function()
{
	return this.ReviewInfo;
};
ParaRun.prototype.GetReviewColor = function()
{
    if (this.ReviewInfo)
        return this.ReviewInfo.Get_Color();

    return REVIEW_COLOR;
};
/**
 * Меняем тип рецензирования для данного рана
 * @param {number} nType
 * @param {boolean} [isCheckDeleteAdded=false] - нужно ли проверять, что происходит удаление добавленного ранее
 * @constructor
 */
ParaRun.prototype.SetReviewType = function(nType, isCheckDeleteAdded)
{
	var oParagraph = this.GetParagraph();
	if (this.IsParaEndRun() && oParagraph)
	{
		var oParent = oParagraph.GetParent();
		if (reviewtype_Common !== nType
			&& !oParagraph.Get_DocumentNext()
			&& oParent
			&& (oParent instanceof CDocument
			|| (oParent instanceof CDocumentContent &&
			oParent.GetParent() instanceof CTableCell)))
		{
			return;
		}
	}

    if (nType !== this.ReviewType)
	{
		var OldReviewType = this.ReviewType;
		var OldReviewInfo = this.ReviewInfo.Copy();

		if (reviewtype_Add === this.ReviewType && reviewtype_Remove === nType && true === isCheckDeleteAdded)
		{
			this.ReviewInfo.SavePrev(this.ReviewType);
		}

		this.ReviewType = nType;
		this.ReviewInfo.Update();

		if (this.GetLogicDocument() && null !== this.GetLogicDocument().TrackMoveId)
			this.ReviewInfo.SetMove(Asc.c_oAscRevisionsMove.MoveFrom);

		History.Add(new CChangesRunReviewType(this, {
			ReviewType : OldReviewType,
			ReviewInfo : OldReviewInfo
		}, {
			ReviewType : this.ReviewType,
			ReviewInfo : this.ReviewInfo.Copy()
		}));
		this.private_UpdateTrackRevisions();
	}
};
/**
 * Меняем тип рецензирования вместе с информацией о рецензента
 * @param {number} nType
 * @param {CReviewInfo} oInfo
 * @param {boolean} [isCheckLastParagraph=true] Нужно ли проверять последний параграф в документе или в ячейке таблицы
 */
ParaRun.prototype.SetReviewTypeWithInfo = function(nType, oInfo, isCheckLastParagraph)
{
	var oParagraph = this.GetParagraph();
	if (false !== isCheckLastParagraph && this.IsParaEndRun() && oParagraph)
	{
		var oParent = oParagraph.GetParent();
		if (reviewtype_Common !== nType
			&& !oParagraph.Get_DocumentNext()
			&& oParent
			&& (oParent instanceof CDocument
			|| (oParent instanceof CDocumentContent &&
			oParent.GetParent() instanceof CTableCell)))
		{
			return;
		}
	}

	History.Add(new CChangesRunReviewType(this, {
		ReviewType : this.ReviewType,
		ReviewInfo : this.ReviewInfo ? this.ReviewInfo.Copy() : undefined
	}, {
		ReviewType : nType,
		ReviewInfo : oInfo ? oInfo.Copy() : undefined
	}));

	this.ReviewType = nType;
	this.ReviewInfo = oInfo;

	this.private_UpdateTrackRevisions();
};
ParaRun.prototype.Get_Parent = function()
{
	return this.GetParent();
};
ParaRun.prototype.private_GetPosInParent = function(_Parent)
{
	return this.GetPosInParent(_Parent);
};
ParaRun.prototype.Make_ThisElementCurrent = function(bUpdateStates)
{
    if (this.Is_UseInDocument())
    {
    	this.SetThisElementCurrentInParagraph();
        this.Paragraph.Document_SetThisElementCurrent(true === bUpdateStates ? true : false);
    }
};
ParaRun.prototype.SetThisElementCurrent = function()
{
	var ContentPos = this.Paragraph.Get_PosByElement(this);
	if (!ContentPos)
		return;

	var StartPos = ContentPos.Copy();
	this.Get_StartPos(StartPos, StartPos.Get_Depth() + 1);

	this.Paragraph.Set_ParaContentPos(StartPos, true, -1, -1, false);
	this.Paragraph.Document_SetThisElementCurrent(false);
};
/**
 * Устанавливаем курсор параграфа в текущую позицию данного рана
 */
ParaRun.prototype.SetThisElementCurrentInParagraph = function()
{
	if (!this.Paragraph)
		return;

	var oContentPos = this.Paragraph.Get_PosByElement(this);
	if (!oContentPos)
		return;

	oContentPos.Add(this.State.ContentPos);
	this.Paragraph.Set_ParaContentPos(oContentPos, true, -1, -1, false);
};
ParaRun.prototype.SelectThisElement = function(nDirection)
{
	if (!this.Paragraph)
		return false;

	var oContentPos = this.Paragraph.Get_PosByElement(this);
	if (!oContentPos)
		return false;

	var oStartPos = oContentPos.Copy();
	var oEndPos   = oContentPos.Copy();

	if (nDirection > 0)
	{
		this.Get_StartPos(oStartPos, oStartPos.GetDepth() + 1);
		this.Get_EndPos(true, oEndPos, oEndPos.GetDepth() + 1);
	}
	else
	{
		this.Get_StartPos(oEndPos, oEndPos.Get_Depth() + 1);
		this.Get_EndPos(true, oStartPos, oStartPos.Get_Depth() + 1);
	}

	this.Paragraph.Selection.Use   = true;
	this.Paragraph.Selection.Start = false;
	this.Paragraph.Set_ParaContentPos(oStartPos, true, -1, -1);
	this.Paragraph.Set_SelectionContentPos(oStartPos, oEndPos, false);
	this.Paragraph.Document_SetThisElementCurrent(false);

	return true;
};
ParaRun.prototype.GetAllParagraphs = function(Props, ParaArray)
{
    var ContentLen = this.Content.length;
    for (var CurPos = 0; CurPos < ContentLen; CurPos++)
    {
        if (para_Drawing == this.Content[CurPos].Type)
            this.Content[CurPos].GetAllParagraphs(Props, ParaArray);
    }
};
ParaRun.prototype.CheckRevisionsChanges = function(Checker, ContentPos, Depth)
{
    if (this.Is_Empty())
        return;

    if (true !== Checker.Is_ParaEndRun() && true !== Checker.Is_CheckOnlyTextPr())
    {
        var ReviewType = this.GetReviewType();
        if (ReviewType !== Checker.GetAddRemoveType() || (reviewtype_Common !== ReviewType && (this.ReviewInfo.GetUserId() !== Checker.Get_AddRemoveUserId() || this.GetReviewMoveType() !== Checker.GetAddRemoveMoveType())))
        {
            Checker.FlushAddRemoveChange();
            ContentPos.Update(0, Depth);

            if (reviewtype_Add === ReviewType || reviewtype_Remove === ReviewType)
                Checker.StartAddRemove(ReviewType, ContentPos, this.GetReviewMoveType());
        }

        if (reviewtype_Add === ReviewType || reviewtype_Remove === ReviewType)
        {
            var Text = "";
            var ContentLen = this.Content.length;
            for (var CurPos = 0; CurPos < ContentLen; CurPos++)
            {
                var Item = this.Content[CurPos];
                var ItemType = Item.Type;
                switch (ItemType)
                {
                    case para_Drawing:
                    {
                        Checker.Add_Text(Text);
                        Text = "";
                        Checker.Add_Drawing(Item);
                        break;
                    }
                    case para_Text :
                    {
                        Text += String.fromCharCode(Item.Value);
                        break;
                    }
                    case para_Math_Text:
                    {
                        Text += String.fromCharCode(Item.getCodeChr());
                        break;
                    }
                    case para_Space:
                    case para_Tab  :
                    {
                        Text += " ";
                        break;
                    }
                }
            }
            Checker.Add_Text(Text);
            ContentPos.Update(this.Content.length, Depth);
            Checker.Set_AddRemoveEndPos(ContentPos);
            Checker.Update_AddRemoveReviewInfo(this.ReviewInfo);
        }
    }

    var HavePrChange = this.HavePrChange();
    var DiffPr = this.GetDiffPrChange();
    if (HavePrChange !== Checker.HavePrChange() || true !== Checker.ComparePrChange(DiffPr) || this.Pr.ReviewInfo.GetUserId() !== Checker.Get_PrChangeUserId())
    {
        Checker.FlushTextPrChange();
        ContentPos.Update(0, Depth);
        if (true === HavePrChange)
        {
            Checker.Start_PrChange(DiffPr, ContentPos);
        }
    }

    if (true === HavePrChange)
    {
        ContentPos.Update(this.Content.length, Depth);
        Checker.SetPrChangeEndPos(ContentPos);
        Checker.Update_PrChangeReviewInfo(this.Pr.ReviewInfo);
    }
};
ParaRun.prototype.private_UpdateTrackRevisionOnChangeContent = function(bUpdateInfo)
{
    if (reviewtype_Common !== this.GetReviewType())
    {
        this.private_UpdateTrackRevisions();

        if (true === bUpdateInfo && this.Paragraph && this.Paragraph.LogicDocument && this.Paragraph.bFromDocument && true === this.Paragraph.LogicDocument.IsTrackRevisions() && this.ReviewInfo && true === this.ReviewInfo.IsCurrentUser())
        {
            var OldReviewInfo = this.ReviewInfo.Copy();
            this.ReviewInfo.Update();
            History.Add(new CChangesRunContentReviewInfo(this, OldReviewInfo, this.ReviewInfo.Copy()));
        }
    }
};
ParaRun.prototype.private_UpdateTrackRevisionOnChangeTextPr = function(bUpdateInfo)
{
    if (true === this.HavePrChange())
    {
        this.private_UpdateTrackRevisions();

        if (true === bUpdateInfo && this.Paragraph && this.Paragraph.bFromDocument && this.Paragraph.LogicDocument && true === this.Paragraph.LogicDocument.IsTrackRevisions())
        {
            var OldReviewInfo = this.Pr.ReviewInfo.Copy();
            this.Pr.ReviewInfo.Update();
            History.Add(new CChangesRunPrReviewInfo(this, OldReviewInfo, this.Pr.ReviewInfo.Copy()));
        }
    }
};
ParaRun.prototype.private_UpdateTrackRevisions = function()
{
    if (this.Paragraph && this.Paragraph.bFromDocument && this.Paragraph.LogicDocument && this.Paragraph.LogicDocument.GetTrackRevisionsManager)
    {
        var RevisionsManager = this.Paragraph.LogicDocument.GetTrackRevisionsManager();
        RevisionsManager.CheckElement(this.Paragraph);
    }
};
ParaRun.prototype.AcceptRevisionChanges = function(nType, bAll)
{
	if (this.Selection.Use && c_oAscRevisionsChangeType.MoveMarkRemove === nType)
		return this.RemoveReviewMoveType();

	var Parent = this.Get_Parent();
	var RunPos = this.private_GetPosInParent();

	var ReviewType   = this.GetReviewType();
	var HavePrChange = this.HavePrChange();

	// Нет изменений в данном ране
	if (reviewtype_Common === ReviewType && true !== HavePrChange)
		return;

	var oTrackManager = this.GetLogicDocument() ? this.GetLogicDocument().GetTrackRevisionsManager() : null;
	var oProcessMove  = oTrackManager ? oTrackManager.GetProcessTrackMove() : null;

	if (true === this.Selection.Use || true === bAll)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (StartPos > EndPos)
		{
			StartPos = this.Selection.EndPos;
			EndPos   = this.Selection.StartPos;
		}

		if (true === bAll)
		{
			StartPos = 0;
			EndPos   = this.Content.length;
		}

		var CenterRun = null, CenterRunPos = RunPos;
		if (0 === StartPos && this.Content.length === EndPos)
		{
			CenterRun = this;
		}
		else if (StartPos > 0 && this.Content.length === EndPos)
		{
			CenterRun    = this.Split2(StartPos, Parent, RunPos);
			CenterRunPos = RunPos + 1;
		}
		else if (0 === StartPos && this.Content.length > EndPos)
		{
			CenterRun = this;
			this.Split2(EndPos, Parent, RunPos);
		}
		else
		{
			this.Split2(EndPos, Parent, RunPos);
			CenterRun    = this.Split2(StartPos, Parent, RunPos);
			CenterRunPos = RunPos + 1;
		}

		if (true === HavePrChange && (undefined === nType || c_oAscRevisionsChangeType.TextPr === nType))
		{
			CenterRun.RemovePrChange();
		}

		if (reviewtype_Add === ReviewType
			&& (undefined === nType
			|| c_oAscRevisionsChangeType.TextAdd === nType
			|| (c_oAscRevisionsChangeType.MoveMark === nType
			&& Asc.c_oAscRevisionsMove.NoMove !== this.GetReviewMoveType()
			&& oProcessMove
			&& !oProcessMove.IsFrom()
			&& oProcessMove.GetUserId() === this.GetReviewInfo().GetUserId())))
		{
			CenterRun.SetReviewType(reviewtype_Common);
		}
		else if (reviewtype_Remove === ReviewType
			&& (undefined === nType
			|| c_oAscRevisionsChangeType.TextRem === nType
			|| (c_oAscRevisionsChangeType.MoveMark === nType
			&& Asc.c_oAscRevisionsMove.NoMove !== this.GetReviewMoveType()
			&& oProcessMove
			&& oProcessMove.IsFrom()
			&& oProcessMove.GetUserId() === this.GetReviewInfo().GetUserId())))
		{
			Parent.RemoveFromContent(CenterRunPos, 1);

			if (Parent.GetContentLength() <= 0)
			{
				Parent.RemoveSelection();
				Parent.AddToContent(0, new ParaRun());
				Parent.MoveCursorToStartPos();
			}
		}
	}
};
ParaRun.prototype.RejectRevisionChanges = function(nType, bAll)
{
	var Parent = this.Get_Parent();
	var RunPos = this.private_GetPosInParent();

	var ReviewType   = this.GetReviewType();
	var HavePrChange = this.HavePrChange();

	// Нет изменений в данном ране
	if (reviewtype_Common === ReviewType && true !== HavePrChange)
		return;

	var oTrackManager = this.GetLogicDocument() ? this.GetLogicDocument().GetTrackRevisionsManager() : null;
	var oProcessMove  = oTrackManager ? oTrackManager.GetProcessTrackMove() : null;

	if (true === this.Selection.Use || true === bAll)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (StartPos > EndPos)
		{
			StartPos = this.Selection.EndPos;
			EndPos   = this.Selection.StartPos;
		}

		if (true === bAll)
		{
			StartPos = 0;
			EndPos   = this.Content.length;
		}

		var CenterRun = null, CenterRunPos = RunPos;
		if (0 === StartPos && this.Content.length === EndPos)
		{
			CenterRun = this;
		}
		else if (StartPos > 0 && this.Content.length === EndPos)
		{
			CenterRun    = this.Split2(StartPos, Parent, RunPos);
			CenterRunPos = RunPos + 1;
		}
		else if (0 === StartPos && this.Content.length > EndPos)
		{
			CenterRun = this;
			this.Split2(EndPos, Parent, RunPos);
		}
		else
		{
			this.Split2(EndPos, Parent, RunPos);
			CenterRun    = this.Split2(StartPos, Parent, RunPos);
			CenterRunPos = RunPos + 1;
		}

		if (true === HavePrChange && (undefined === nType || c_oAscRevisionsChangeType.TextPr === nType))
		{
			CenterRun.Set_Pr(CenterRun.Pr.PrChange);
		}

		var oReviewInfo = this.GetReviewInfo();
		var oPrevInfo   = oReviewInfo.GetPrevAdded();
		if ((reviewtype_Add === ReviewType
			&& (undefined === nType
			|| c_oAscRevisionsChangeType.TextAdd === nType
			|| (c_oAscRevisionsChangeType.MoveMark === nType
			&& Asc.c_oAscRevisionsMove.NoMove !== this.GetReviewMoveType()
			&& oProcessMove
			&& !oProcessMove.IsFrom()
			&& oProcessMove.GetUserId() === this.GetReviewInfo().GetUserId())))
			|| (undefined === nType
			&& bAll
			&& reviewtype_Remove === ReviewType
			&& oPrevInfo))
		{
			Parent.RemoveFromContent(CenterRunPos, 1);

			if (Parent.GetContentLength() <= 0)
			{
				Parent.RemoveSelection();
				Parent.AddToContent(0, new ParaRun());
				Parent.MoveCursorToStartPos();
			}
		}
		else if (reviewtype_Remove === ReviewType
			&& (undefined === nType
			|| c_oAscRevisionsChangeType.TextRem === nType
			|| (c_oAscRevisionsChangeType.MoveMark === nType
			&& Asc.c_oAscRevisionsMove.NoMove !== this.GetReviewMoveType()
			&& oProcessMove
			&& oProcessMove.IsFrom()
			&& oProcessMove.GetUserId() === this.GetReviewInfo().GetUserId())))
		{
			if (oPrevInfo && c_oAscRevisionsChangeType.MoveMark !== nType)
			{
				CenterRun.SetReviewTypeWithInfo(reviewtype_Add, oPrevInfo.Copy());
			}
			else
			{
				CenterRun.SetReviewType(reviewtype_Common);
			}
		}
	}
};
ParaRun.prototype.Is_InHyperlink = function()
{
    if (!this.Paragraph)
        return false;

    var ContentPos = this.Paragraph.Get_PosByElement(this);
    var Classes    = this.Paragraph.Get_ClassesByPos(ContentPos);

    var bHyper = false;
    var bRun   = false;

    for (var Index = 0, Count = Classes.length; Index < Count; Index++)
    {
        var Item = Classes[Index];
        if (Item === this)
        {
            bRun = true;
            break;
        }
        else if (Item instanceof ParaHyperlink)
        {
            bHyper = true;
        }
    }

    return (bHyper && bRun);
};
ParaRun.prototype.Get_ClassesByPos = function(Classes, ContentPos, Depth)
{
    Classes.push(this);
};
ParaRun.prototype.Is_UseInParagraph = function()
{
    if (!this.Paragraph)
        return false;

    var ContentPos = this.Paragraph.Get_PosByElement(this);
    if (!ContentPos)
        return false;

    return true;
};
/**
 * Получаем позицию данного рана в родительском параграфе
 * @param nInObjectPos {?number}
 * @returns {?CParagraphContentPos}
 */
ParaRun.prototype.GetParagraphContentPosFromObject = function(nInObjectPos)
{
	if (undefined === nInObjectPos)
		nInObjectPos = 0;

	var oParagraph = this.GetParagraph();
	if (!oParagraph)
		return null;

	var oContentPos = oParagraph.GetPosByElement(this);
	if (!oContentPos)
		return null;

	oContentPos.Add(nInObjectPos);
	return oContentPos;
};
ParaRun.prototype.Displace_BreakOperator = function(isForward, bBrkBefore, CountOperators)
{
    var bResult = true;
    var bFirstItem = this.State.ContentPos == 0 || this.State.ContentPos == 1,
        bLastItem  = this.State.ContentPos == this.Content.length - 1 || this.State.ContentPos == this.Content.length;

    if(true === this.Is_StartForcedBreakOperator() && bFirstItem == true)
    {
        var AlnAt = this.MathPrp.Get_AlnAt();

        var NotIncrease = AlnAt == CountOperators && isForward == true;

        if(NotIncrease == false)
        {
            this.MathPrp.Displace_Break(isForward);

            var NewAlnAt = this.MathPrp.Get_AlnAt();

            if(AlnAt !== NewAlnAt)
            {
                History.Add(new CChangesRunMathAlnAt(this, AlnAt, NewAlnAt));
            }
        }
    }
    else
    {
        bResult = (bLastItem && bBrkBefore) || (bFirstItem && !bBrkBefore) ? false : true;
    }

    return bResult; // применили смещение к данному Run
};
ParaRun.prototype.Math_UpdateLineMetrics = function(PRS, ParaPr)
{
    var LineRule = ParaPr.Spacing.LineRule;

    // Пересчитаем метрику строки относительно размера данного текста
    if ( PRS.LineTextAscent < this.TextAscent )
        PRS.LineTextAscent = this.TextAscent;

    if ( PRS.LineTextAscent2 < this.TextAscent2 )
        PRS.LineTextAscent2 = this.TextAscent2;

    if ( PRS.LineTextDescent < this.TextDescent )
        PRS.LineTextDescent = this.TextDescent;

    if ( Asc.linerule_Exact === LineRule )
    {
        // Смещение не учитывается в метриках строки, когда расстояние между строк точное
        if ( PRS.LineAscent < this.TextAscent )
            PRS.LineAscent = this.TextAscent;

        if ( PRS.LineDescent < this.TextDescent )
            PRS.LineDescent = this.TextDescent;
    }
    else
    {
        if ( PRS.LineAscent < this.TextAscent + this.YOffset  )
            PRS.LineAscent = this.TextAscent + this.YOffset;

        if ( PRS.LineDescent < this.TextDescent - this.YOffset )
            PRS.LineDescent = this.TextDescent - this.YOffset;
    }

};
ParaRun.prototype.Set_CompositeInput = function(oCompositeInput)
{
    this.CompositeInput = oCompositeInput;
};
ParaRun.prototype.GetFootnotesList = function(oEngine)
{
	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		var oItem = this.Content[nIndex];
		if (para_FootnoteReference === oItem.Type)
		{
			oEngine.Add(oItem.GetFootnote(), oItem, this);
		}
	}
};
ParaRun.prototype.Is_UseInDocument = function()
{
	return (this.Paragraph && true === this.Paragraph.Is_UseInDocument() && true === this.Is_UseInParagraph() ? true : false);
};
ParaRun.prototype.GetParaEnd = function()
{
	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		if (this.Content[nIndex].Type === para_End)
			return this.Content[nIndex];
	}

	return null;
};
/**
 * Проверяем, является ли это ран со знаком конца параграфа
 * @returns {boolean}
 */
ParaRun.prototype.IsParaEndRun = function()
{
	return this.GetParaEnd() ? true : false;
};
ParaRun.prototype.RemoveElement = function(oElement)
{
	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		if (oElement === this.Content[nIndex])
			return this.RemoveFromContent(nIndex, 1, true);
	}
};
ParaRun.prototype.GotoFootnoteRef = function(isNext, isCurrent, isStepOver)
{
	var nPos = 0;
	if (true === isCurrent)
	{
		if (true === this.Selection.Use)
			nPos = Math.min(this.Selection.StartPos, this.Selection.EndPos);
		else
			nPos = this.State.ContentPos;
	}
	else
	{
		if (true === isNext)
			nPos = 0;
		else
			nPos = this.Content.length - 1;
	}

	var nResult = 0;
	if (true === isNext)
	{
		for (var nIndex = nPos, nCount = this.Content.length; nIndex < nCount; ++nIndex)
		{
			if (para_FootnoteReference === this.Content[nIndex].Type && ((true !== isCurrent && true === isStepOver) || (true === isCurrent && (true === this.Selection.Use || nPos !== nIndex))))
			{
				if (this.Paragraph && this.Paragraph.bFromDocument && this.Paragraph.LogicDocument)
					this.Paragraph.LogicDocument.RemoveSelection();

				this.State.ContentPos = nIndex;
				this.Make_ThisElementCurrent(true);
				return -1;
			}
			nResult++;
		}
	}
	else
	{
		for (var nIndex = Math.min(nPos, this.Content.length - 1); nIndex >= 0; --nIndex)
		{
			if (para_FootnoteReference === this.Content[nIndex].Type && ((true !== isCurrent && true === isStepOver) || (true === isCurrent && (true === this.Selection.Use || nPos !== nIndex))))
			{
				if (this.Paragraph && this.Paragraph.bFromDocument && this.Paragraph.LogicDocument)
					this.Paragraph.LogicDocument.RemoveSelection();

				this.State.ContentPos = nIndex;
				this.Make_ThisElementCurrent(true);
				return -1;
			}
			nResult++;
		}
	}

	return nResult;
};
ParaRun.prototype.GetFootnoteRefsInRange = function(arrFootnotes, _CurLine, _CurRange)
{
	var CurLine = _CurLine - this.StartLine;
	var CurRange = (0 === CurLine ? _CurRange - this.StartRange : _CurRange);

	var StartPos = this.protected_GetRangeStartPos(CurLine, CurRange);
	var EndPos   = this.protected_GetRangeEndPos(CurLine, CurRange);

	for (var CurPos = StartPos; CurPos < EndPos; CurPos++)
	{
		if (para_FootnoteReference === this.Content[CurPos].Type)
			arrFootnotes.push(this.Content[CurPos]);
	}
};
ParaRun.prototype.GetAllContentControls = function(arrContentControls)
{
	if (!arrContentControls)
		return;

	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		var oItem = this.Content[nIndex];
		if (para_Drawing === oItem.Type || para_FootnoteReference === oItem.Type)
		{
			oItem.GetAllContentControls(arrContentControls);
		}
	}
};
/**
 * Получаем позицию заданного элемента
 * @param oElement
 * @returns {number} позиция, либо -1, если заданного элемента нет
 */
ParaRun.prototype.GetElementPosition = function(oElement)
{
	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		if (oElement === this.Content[nPos])
			return nPos;
	}

	return -1;
};
/**
 * Устанавливаем текущее положение позиции курсора в данном ране
 * @param nPos
 */
ParaRun.prototype.SetCursorPosition = function(nPos)
{
	this.State.ContentPos = Math.max(0, Math.min(nPos, this.Content.length));
};
/**
 * Получаем номер строки по заданной позиции.
 * @param nPos
 */
ParaRun.prototype.GetLineByPosition = function(nPos)
{
	for (var nLineIndex = 0, nLinesCount = this.protected_GetLinesCount(); nLineIndex < nLinesCount; ++nLineIndex)
	{
		for (var nRangeIndex = 0, nRangesCount = this.protected_GetRangesCount(nLineIndex); nRangeIndex < nRangesCount; ++nRangeIndex)
		{
			var nStartPos = this.protected_GetRangeStartPos(nLineIndex, nRangeIndex);
			var nEndPos   = this.protected_GetRangeEndPos(nLineIndex, nRangeIndex);

			if (nPos >= nStartPos && nPos < nEndPos)
				return nLineIndex + this.StartLine;
		}
	}

	return this.StartLine;
};
/**
 * Данная функция вызывается перед удалением данного рана из родительского класса.
 */
ParaRun.prototype.PreDelete = function()
{
	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		if (this.Content[nIndex].PreDelete)
			this.Content[nIndex].PreDelete();
	}

	this.RemoveSelection();
};
ParaRun.prototype.GetCurrentComplexFields = function(arrComplexFields, isCurrent, isFieldPos)
{
	var nEndPos = isCurrent ? this.State.ContentPos : this.Content.length;
	for (var nPos = 0; nPos < nEndPos; ++nPos)
	{
		var oItem = this.Content[nPos];
		if (oItem.Type !== para_FieldChar)
			continue;

		if (isFieldPos)
		{
			var oComplexField = oItem.GetComplexField();
			if (oItem.IsBegin())
			{
				arrComplexFields.push(new CComplexFieldStatePos(oComplexField, true));
			}
			else if (oItem.IsSeparate())
			{
				if (arrComplexFields.length > 0)
				{
					arrComplexFields[arrComplexFields.length - 1].SetFieldCode(false)
				}
			}
			else if (oItem.IsEnd())
			{
				if (arrComplexFields.length > 0)
				{
					arrComplexFields.splice(arrComplexFields.length - 1, 1);
				}
			}
		}
		else
		{
			if (oItem.IsBegin())
			{
				arrComplexFields.push(oItem.GetComplexField());
			}
			else if (oItem.IsEnd())
			{
				if (arrComplexFields.length > 0)
				{
					arrComplexFields.splice(arrComplexFields.length - 1, 1);
				}
			}
		}
	}
};
ParaRun.prototype.RemoveTabsForTOC = function(_isTab)
{
	var isTab = _isTab;
	for (var nPos = 0; nPos < this.Content.length; ++nPos)
	{
		if (para_Tab === this.Content[nPos].Type)
		{
			if (!isTab)
			{
				// Первый таб в параграфе оставляем
				isTab = true;
			}
			else
			{
				this.Remove_FromContent(nPos, 1);
			}
		}
	}

	return isTab;
};
ParaRun.prototype.GetAllFields = function(isUseSelection, arrFields)
{
	var nStartPos = isUseSelection ?
		(this.Selection.StartPos < this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos)
		: 0;

	var nEndPos = isUseSelection ?
		(this.Selection.StartPos < this.Selection.EndPos ? this.Selection.EndPos : this.Selection.StartPos)
		: this.Content.length;

	for (var nPos = nStartPos; nPos < nEndPos; ++nPos)
	{
		var oItem = this.Content[nPos];
		if (para_FieldChar === oItem.Type)
		{
			var oComplexField = oItem.GetComplexField();

			var isNeedAdd = true;
			for (var nFieldIndex = 0, nFieldsCount = arrFields.length; nFieldIndex < nFieldsCount; ++nFieldIndex)
			{
				if (oComplexField === arrFields[nFieldIndex])
				{
					isNeedAdd = false;
					break;
				}
			}

			if (isNeedAdd)
				arrFields.push(oComplexField);
		}
		else if (para_Drawing === oItem.Type)
		{
			oItem.GetAllFields(false, arrFields);
		}
		else if (para_FootnoteReference === oItem.Type)
		{
			oItem.GetFootnote().GetAllFields(false, arrFields);
		}
	}
};

ParaRun.prototype.GetAllSeqFieldsByType = function(sType, aFields)
{
	for (var nPos = 0; nPos < this.Content.length; ++nPos)
	{
		var oItem = this.Content[nPos];
		if (para_FieldChar === oItem.Type)
		{
			var oComplexField = oItem.GetComplexField();
			if(oComplexField)
			{
				var oInstruction = oComplexField.Instruction;
				if(oInstruction)
				{
					if(oInstruction.Type === fieldtype_SEQ)
					{
						if(oInstruction.Id === sType)
						{
							var isNeedAdd = true;
							for (var nFieldIndex = 0, nFieldsCount = aFields.length; nFieldIndex < nFieldsCount; ++nFieldIndex)
							{
								if (oComplexField === aFields[nFieldIndex])
								{
									isNeedAdd = false;
									break;
								}
							}
							if (isNeedAdd)
							{
								aFields.push(oComplexField);
							}
						}
					}
				}
			}
		}
		else if(para_Field === oItem.Type)
		{
			if(oItem.FieldType === fieldtype_SEQ)
			{
				if(oItem.Arguments[0] === sType)
				{
					aFields.push(oItem);
				}
			}
		}
		else if (para_Drawing === oItem.Type)
		{
			oItem.GetAllSeqFieldsByType(sType, aFields);
		}
	}
};
ParaRun.prototype.AddToContent = function(nPos, oItem, isUpdatePositions)
{
	return this.Add_ToContent(nPos, oItem, isUpdatePositions);
};
ParaRun.prototype.RemoveFromContent = function(nPos, nCount, isUpdatePositions)
{
	return this.Remove_FromContent(nPos, nCount, isUpdatePositions);
};
ParaRun.prototype.GetComplexField = function(nType)
{
	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		var oItem = this.Content[nPos];

		if (para_FieldChar === oItem.Type && oItem.IsBegin())
		{
			var oComplexField = oItem.GetComplexField();
			if (!oComplexField)
				continue;

			var oInstruction = oComplexField.GetInstruction();
			if (!oInstruction)
				continue;

			if (nType === oInstruction.GetType())
				return oComplexField;
		}
	}
	return null;
};
ParaRun.prototype.GetComplexFieldsArray = function(nType, arrComplexFields)
{
	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		var oItem = this.Content[nPos];

		if (para_FieldChar === oItem.Type && oItem.IsBegin())
		{
			var oComplexField = oItem.GetComplexField();
			if (!oComplexField)
				continue;

			var oInstruction = oComplexField.GetInstruction();
			if (!oInstruction)
				continue;

			if (nType === oInstruction.GetType())
				arrComplexFields.push(oComplexField);
		}
	}
};
/**
 * Получаем количество элементов в ране
 * @returns {Number}
 */
ParaRun.prototype.GetElementsCount = function()
{
	return this.Content.length;
};
/**
 * Получаем элемент по заданной позиции
 * @param nPos {number}
 * @returns {?CRunElementBase}
 */
ParaRun.prototype.GetElement = function(nPos)
{
	if (nPos < 0 || nPos >= this.Content.length)
		return null;

	return this.Content[nPos];
};
/**
 * Проверяем является ли данный ран специальным, содержащим ссылку на сноску
 * @returns {boolean}
 */
ParaRun.prototype.IsFootnoteReferenceRun = function()
{
	return (1 === this.Content.length && para_FootnoteReference === this.Content[0].Type);
};
/**
 * Производим автозамену
 * @param nPos - позиция, на которой был добавлен последний элемент, с которого стартовала автозамена
 * @returns {boolean}
 */
ParaRun.prototype.ProcessAutoCorrect = function(nPos)
{
	// Сколько максимально просматриваем элементов влево
	var nMaxElements = 10;

	var oParagraph = this.GetParagraph();
	if (!oParagraph)
		return false;

	if(false === oParagraph.bFromDocument)
		return false;

	var oDocument = oParagraph.LogicDocument;
	if (!oDocument || !(oDocument instanceof CDocument))
		return false;

	var oContentPos = oParagraph.Get_PosByElement(this);
	if (!oContentPos)
		return false;

	oContentPos.Update(nPos, oContentPos.GetDepth() + 1);

	if (para_Text === this.Content[nPos].Type && (34 === this.Content[nPos].Value || 39 === this.Content[nPos].Value))
	{
		if (oDocument.IsAutoCorrectSmartQuotes())
		{
			var isOpenQuote = true;

			var oRunElementsBefore = new CParagraphRunElements(oContentPos, 1, null, false);
			oParagraph.GetPrevRunElements(oRunElementsBefore);
			var arrElements = oRunElementsBefore.GetElements();
			if (arrElements.length > 0)
			{
				var oPrevElement = arrElements[0];
				if (para_Text === oPrevElement.Type
					&& 45 !== oPrevElement.Value
					&& 40 !== oPrevElement.Value
					&& 91 !== oPrevElement.Value
					&& 123 !== oPrevElement.Value)
					isOpenQuote = false;
			}

			var nCharCode;

			// Обработка русских кавычек "елочка"
			if (34 === this.Content[nPos].Value && this.Get_CompiledPr(false).Lang && 1049 === this.Get_CompiledPr(false).Lang.Val)
			{
				nCharCode = isOpenQuote ? 171 : 187;
			}
			else
			{
				nCharCode = (34 === this.Content[nPos].Value ? (isOpenQuote ? 8220 : 8221) : (isOpenQuote ? 8216 : 8217));
			}

			// Проверку на лок можно не делать, т.к. мы собираемся менять содержимое данного рана, а такую проверку мы уже делали

			oDocument.StartAction(AscDFH.historydescription_Document_AutoCorrectSmartQuotes);

			this.RemoveFromContent(nPos, 1);
			this.AddToContent(nPos, new ParaText(nCharCode));
			this.State.ContentPos = nPos + 1;

			oDocument.FinalizeAction();

			return true;
		}
		return false;
	}
	else if (para_Text === this.Content[nPos].Type && 45 === this.Content[nPos].Value)
	{
		if (oDocument.IsAutoCorrectHyphensWithDash())
		{
			var oRunElementsBefore = new CParagraphRunElements(oContentPos, 1, null, false);
			oRunElementsBefore.SetSaveContentPositions(true);
			oParagraph.GetPrevRunElements(oRunElementsBefore);
			var arrElements = oRunElementsBefore.GetElements();
			if (arrElements.length > 0 && para_Text === arrElements[0].Type && 45 === arrElements[0].Value)
			{
				oDocument.StartAction(AscDFH.Document_AutoCorrectHyphensWithDash);

				var oDash = new ParaText(8212);
				this.AddToContent(nPos + 1, oDash);
				var oStartPos = oRunElementsBefore.GetContentPositions()[0];
				var oEndPos   = oContentPos;
				oContentPos.Update(nPos + 1, oContentPos.GetDepth());

				oParagraph.RemoveSelection();
				oParagraph.SetSelectionUse(true);
				oParagraph.SetSelectionContentPos(oStartPos, oEndPos, false);
				oParagraph.Remove(1);
				oParagraph.RemoveSelection();

				// TODO:
				for (var nTempPos = 0, nCount = this.Content.length; nTempPos < nCount; ++nTempPos)
				{
					if (this.Content[nTempPos] === oDash)
					{
						this.State.ContentPos = nTempPos + 1;
						break;
					}
				}

				oDocument.FinalizeAction();
				return true;
			}
		}
		return false;
	}

	var oRunElementsBefore = new CParagraphRunElements(oContentPos, nMaxElements, null, true);
	oParagraph.GetPrevRunElements(oRunElementsBefore);
	var arrElements = oRunElementsBefore.GetElements();
	if (arrElements.length <= 0)
		return false;

	var sText = "";
	for (var nIndex = 0, nCount = arrElements.length; nIndex < nCount; ++nIndex)
	{
		if (para_Text !== arrElements[nIndex].Type)
			return false;

		sText += String.fromCharCode(arrElements[nIndex].Value);
	}

	// Автосоздание списка
	if (oParagraph.GetNumPr())
		return false;

	var oPrevNumPr = null;
	var oPrevParagraph = oParagraph.Get_DocumentPrev();
	if (oPrevParagraph && type_Paragraph === oPrevParagraph.GetType())
		oPrevNumPr = oPrevParagraph.GetNumPr();

	if (oRunElementsBefore.IsEnd())
	{
		var oNumPr = null;

		if (oDocument.IsAutomaticBulletedLists())
		{
			var oNumLvl = this.private_GetSuitableBulletedLvlForAutoCorrect(sText);
			if (oNumLvl)
			{
				if (oPrevNumPr)
				{
					var oPrevNumLvl = oDocument.GetNumbering().GetNum(oPrevNumPr.NumId).GetLvl(oPrevNumPr.Lvl);
					if (oPrevNumLvl.IsSimilar(oNumLvl))
					{
						oNumPr = new CNumPr(oPrevNumPr.NumId, oPrevNumPr.Lvl);
					}
				}

				if (!oNumPr)
				{
					var oNum = oDocument.GetNumbering().CreateNum();
					oNum.CreateDefault(c_oAscMultiLevelNumbering.Bullet);
					oNum.SetLvl(oNumLvl, 0);
					oNumPr = new CNumPr(oNum.GetId(), 0);
				}
			}
		}

		if (oDocument.IsAutomaticNumberedLists())
		{
			var arrResult = this.private_GetSuitableNumberedLvlForAutoCorrect(sText);

			if (arrResult)
			{
				for (var nIndex = 0, nCount = arrResult.length; nIndex < nCount; ++nIndex)
				{
					var oResult = arrResult[nIndex];
					if (oResult && -1 !== oResult.Value && oResult.Lvl)
					{
						if (1 === oResult.Value)
						{
							var oNum = oDocument.GetNumbering().CreateNum();
							oNum.CreateDefault(c_oAscMultiLevelNumbering.Numbered);
							oNum.SetLvl(oResult.Lvl, 0);
							oNumPr = new CNumPr(oNum.GetId(), 0);
							break;
						}
						else if (oPrevNumPr)
						{
							oResult.Lvl.ResetNumberedText(oPrevNumPr.Lvl);
							var oPrevNumLvl = oDocument.GetNumbering().GetNum(oPrevNumPr.NumId).GetLvl(oPrevNumPr.Lvl);
							if (oPrevNumLvl.IsSimilar(oResult.Lvl))
							{
								var oNumInfo = oPrevParagraph.Parent.CalculateNumberingValues(oPrevParagraph, oPrevNumPr);
								if (oResult.Value > oNumInfo[oPrevNumPr.Lvl] && oResult.Value <= oNumInfo[oPrevNumPr.Lvl] + 2)
								{
									oNumPr = new CNumPr(oPrevNumPr.NumId, oPrevNumPr.Lvl);
									break;
								}
							}
						}
					}
				}
			}
		}


		if (oNumPr)
		{
			if (false === oDocument.Document_Is_SelectionLocked({
					Type      : AscCommon.changestype_2_ElementsArray_and_Type,
					Elements  : [oParagraph],
					CheckType : AscCommon.changestype_Paragraph_Properties
				}))
			{
				oDocument.StartAction(AscDFH.historydescription_Document_AutomaticListAsType);

				var oStartPos = oParagraph.GetStartPos();
				var oEndPos   = oContentPos;
				oContentPos.Update(nPos + 1, oContentPos.GetDepth());

				oParagraph.RemoveSelection();
				oParagraph.SetSelectionUse(true);
				oParagraph.SetSelectionContentPos(oStartPos, oEndPos, false);
				oParagraph.Remove(1);
				oParagraph.RemoveSelection();
				oParagraph.MoveCursorToStartPos(false);

				oParagraph.ApplyNumPr(oNumPr.NumId, oNumPr.Lvl);

				oDocument.Recalculate();
				oDocument.FinalizeAction();
			}
		}
	}

	return false;
};
/**
 * Подбираем подходящий маркированный список
 * @param sText {string}
 * @returns {?CNumberingLvl}
 */
ParaRun.prototype.private_GetSuitableBulletedLvlForAutoCorrect = function(sText)
{
	var oNumberingLvl = new CNumberingLvl();
	oNumberingLvl.InitDefault(0, c_oAscMultiLevelNumbering.Bullet);

	if ('*' === sText)
	{
		var oTextPr = new CTextPr();
		oTextPr.RFonts.SetAll("Symbol");
		oNumberingLvl.SetByType(c_oAscNumberingLevel.Bullet, 0, String.fromCharCode(0x00B7), oTextPr);
		return oNumberingLvl;
	}
	else if ('-' === sText)
	{
		var oTextPr = new CTextPr();
		oTextPr.RFonts.SetAll("Arial");
		oNumberingLvl.SetByType(c_oAscNumberingLevel.Bullet, 0, String.fromCharCode(0x2013), oTextPr);
		return oNumberingLvl;
	}

	return null;
};
/**
 * Подбираем подходящий нумерованный список
 * @param sText {string}
 * @returns {null | {Lvl : CNumberingLvl, Value : number}}
 */
ParaRun.prototype.private_GetSuitableNumberedLvlForAutoCorrect = function(sText)
{
	if (sText.length < 2)
		return null;

	var sLastChar = sText.charAt(sText.length - 1);
	if ('.' !== sLastChar && ')' !== sLastChar)
		return null;

	var nFirstCharCode = sText.charCodeAt(0);

	var nValue = -1;

	var sValue = sText.slice(0, sText.length - 1);

	// Проверяем, либо у нас все числовое, либо у нас все буквенное (все заглавные, либо все не заглавные)
	if (48 <= nFirstCharCode && nFirstCharCode <= 57)
	{
		var oNumberingLvl = new CNumberingLvl();
		oNumberingLvl.InitDefault(0, c_oAscMultiLevelNumbering.Numbered);

		for (var nIndex = 0, nCount = sValue.length; nIndex < nCount; ++nIndex)
		{
			var nCurCharCode = sValue.charCodeAt(nIndex);
			if (48 > nCurCharCode || nCurCharCode > 57)
				return null;
		}

		if ('.' === sLastChar)
			oNumberingLvl.SetByType(c_oAscNumberingLevel.DecimalDot_Left, 0);
		else if (')' === sLastChar)
			oNumberingLvl.SetByType(c_oAscNumberingLevel.DecimalBracket_Left, 0);

		nValue = parseInt(sValue);

		if (isNaN(nValue))
			nValue = -1;

		return [{Lvl : oNumberingLvl, Value : nValue}];
	}
	else if (65 <= nFirstCharCode && nFirstCharCode <= 90)
	{
		var nRoman  = AscCommon.RomanToInt(sValue);
		var nLetter = AscCommon.LatinNumberingToInt(sValue);

		var arrResult = [];
		if (!isNaN(nRoman))
		{
			var oNumberingLvl = new CNumberingLvl();
			oNumberingLvl.InitDefault(0, c_oAscMultiLevelNumbering.Numbered);

			if ('.' === sLastChar)
				oNumberingLvl.SetByType(c_oAscNumberingLevel.UpperRomanDot_Right, 0);
			else if (')' === sLastChar)
				oNumberingLvl.SetByType(c_oAscNumberingLevel.UpperRomanBracket_Left, 0);

			arrResult.push({Lvl : oNumberingLvl, Value : nRoman});
		}

		if (!isNaN(nLetter))
		{
			var oNumberingLvl = new CNumberingLvl();
			oNumberingLvl.InitDefault(0, c_oAscMultiLevelNumbering.Numbered);

			if ('.' === sLastChar)
				oNumberingLvl.SetByType(c_oAscNumberingLevel.UpperLetterDot_Left, 0);
			else if (')' === sLastChar)
				oNumberingLvl.SetByType(c_oAscNumberingLevel.UpperLetterBracket_Left, 0);

			arrResult.push({Lvl : oNumberingLvl, Value : nLetter});
		}

		if (arrResult.length > 0)
			return arrResult;

		return null;
	}
	else if (97 <= nFirstCharCode && nFirstCharCode <= 122)
	{
		var nRoman  = AscCommon.RomanToInt(sValue);
		var nLetter = AscCommon.LatinNumberingToInt(sValue);

		var arrResult = [];

		if (!isNaN(nRoman))
		{
			var oNumberingLvl = new CNumberingLvl();
			oNumberingLvl.InitDefault(0, c_oAscMultiLevelNumbering.Numbered);

			if ('.' === sLastChar)
				oNumberingLvl.SetByType(c_oAscNumberingLevel.LowerRomanDot_Right, 0);
			else if (')' === sLastChar)
				oNumberingLvl.SetByType(c_oAscNumberingLevel.LowerRomanBracket_Left, 0);

			arrResult.push({Lvl : oNumberingLvl, Value : nRoman});
		}
		if (!isNaN(nLetter))
		{
			var oNumberingLvl = new CNumberingLvl();
			oNumberingLvl.InitDefault(0, c_oAscMultiLevelNumbering.Numbered);

			if ('.' === sLastChar)
				oNumberingLvl.SetByType(c_oAscNumberingLevel.LowerLetterDot_Left, 0);
			else if (')' === sLastChar)
				oNumberingLvl.SetByType(c_oAscNumberingLevel.LowerLetterBracket_Left, 0);

			arrResult.push({Lvl : oNumberingLvl, Value : nLetter});
		}

		if (arrResult.length > 0)
			return arrResult;

		return null;
	}

	return null;
};
ParaRun.prototype.UpdateBookmarks = function(oManager)
{
	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		if (para_Drawing === this.Content[nIndex].Type)
			this.Content[nIndex].UpdateBookmarks(oManager);
	}
};
ParaRun.prototype.CheckRunContent = function(fCheck)
{
	return fCheck(this);
};
ParaRun.prototype.ProcessComplexFields = function(oComplexFields)
{
	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		var oItem     = this.private_CheckInstrText(this.Content[nPos]);
		var nItemType = oItem.Type;

		if (oComplexFields.IsHiddenFieldContent() && para_End !== nItemType && para_FieldChar !== nItemType)
			continue;

		if (para_FieldChar === nItemType)
			oComplexFields.ProcessFieldCharAndCollectComplexField(oItem);
		else if (para_InstrText === nItemType)
			oComplexFields.ProcessInstruction(oItem);
	}
};
ParaRun.prototype.GetSelectedElementsInfo = function(oInfo)
{
	if (oInfo && oInfo.IsCheckAllSelection() && !this.IsSelectionEmpty(true))
	{
		oInfo.RegisterRunWithReviewType(this.GetReviewType());

		for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
		{
			if (para_RevisionMove === this.Content[nPos].Type)
			{
				oInfo.RegisterTrackMoveMark(this.Content[nPos].Type);
			}
		}
	}
};
ParaRun.prototype.GetLastTrackMoveMark = function()
{
	for (var nPos = this.Content.length - 1; nPos >= 0; --nPos)
	{
		if (para_RevisionMove === this.Content[nPos].Type)
			return this.Content[nPos];
	}

	return null;
};
/**
 * Можно ли удалять данный ран во время рецензирования
 * @returns {boolean}
 */
ParaRun.prototype.CanDeleteInReviewMode = function()
{
	var nReviewType = this.GetReviewType();
	var oReviewInfo = this.GetReviewInfo();

	return ((reviewtype_Add === nReviewType && oReviewInfo.IsCurrentUser() && (!oReviewInfo.IsMovedTo() || this.Paragraph.LogicDocument.TrackMoveRelocation)) || (reviewtype_Remove === nReviewType && oReviewInfo.IsPrevAddedByCurrentUser()));
};
/**
 * Данная функция используется в иерархии классов для поиска первого рана
 * @returns {ParaRun}
 */
ParaRun.prototype.GetFirstRun = function()
{
	return this;
};
ParaRun.prototype.GetFirstRunElementPos = function(nType, oStartPos, oEndPos, nDepth)
{
	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		if (nType === this.Content[nPos].Type)
		{
			oStartPos.Update(nPos, nDepth);
			oEndPos.Update(nPos + 1, nDepth);
			return true;
		}
	}
	return false;
};

function CParaRunStartState(Run)
{
    this.Paragraph = Run.Paragraph;
    this.Pr = Run.Pr.Copy();
    this.Content = [];
    for(var i = 0; i < Run.Content.length; ++i)
    {
        this.Content.push(Run.Content[i]);
    }
}

function CReviewInfo()
{
    this.Editor   = editor;
    this.UserId   = "";
    this.UserName = "";
    this.DateTime = "";

    this.MoveType = Asc.c_oAscRevisionsMove.NoMove;

    this.PrevType = -1;
    this.PrevInfo = null;
}
CReviewInfo.prototype.Update = function()
{
    if (this.Editor && this.Editor.DocInfo)
    {
        this.UserId   = this.Editor.DocInfo.get_UserId();
        this.UserName = this.Editor.DocInfo.get_UserName();
        this.DateTime = (new Date()).getTime();
    }
};
CReviewInfo.prototype.Copy = function()
{
    var Info = new CReviewInfo();
    Info.UserId   = this.UserId;
    Info.UserName = this.UserName;
    Info.DateTime = this.DateTime;
    Info.MoveType = this.MoveType;
    Info.PrevType = this.PrevType;
    Info.PrevInfo = this.PrevInfo ? this.PrevInfo.Copy() : null;
    return Info;
};
/**
 * Получаем имя пользователя
 * @returns {string}
 */
CReviewInfo.prototype.GetUserName = function()
{
	return this.UserName;
};
/**
 * Получаем дату-время изменения
 * @returns {number}
 */
CReviewInfo.prototype.GetDateTime = function()
{
	return this.DateTime;
};
CReviewInfo.prototype.Write_ToBinary = function(oWriter)
{
	oWriter.WriteString2(this.UserId);
	oWriter.WriteString2(this.UserName);
	oWriter.WriteString2(this.DateTime);
	oWriter.WriteLong(this.MoveType);

    if (-1 !== this.PrevType && null !== this.PrevInfo)
	{
		oWriter.WriteBool(true);
		oWriter.WriteLong(this.PrevType);
		this.PrevInfo.Write_ToBinary(oWriter);
	}
	else
	{
		oWriter.WriteBool(false);
	}
};
CReviewInfo.prototype.Read_FromBinary = function(oReader)
{
    this.UserId   = oReader.GetString2();
    this.UserName = oReader.GetString2();
    this.DateTime = parseInt(oReader.GetString2());
    this.MoveType = oReader.GetLong();

	if (oReader.GetBool())
	{
		this.PrevType = oReader.GetLong();
		this.PrevInfo = new CReviewInfo();
		this.PrevInfo.Read_FromBinary(oReader);
	}
	else
	{
		this.PrevType = -1;
		this.PrevInfo = null;
	}
};
CReviewInfo.prototype.Get_Color = function()
{
    if (!this.UserId && !this.UserName)
        return REVIEW_COLOR;

    return AscCommon.getUserColorById(this.UserId, this.UserName, true, false);
};
CReviewInfo.prototype.IsCurrentUser = function()
{
    if (this.Editor && this.Editor.DocInfo)
    {
        var UserId = this.Editor.DocInfo.get_UserId();
        return (UserId === this.UserId);
    }

    return true;
};
/**
 * Получаем идентификатор пользователя
 * @returns {string}
 */
CReviewInfo.prototype.GetUserId = function()
{
	return this.UserId;
};
CReviewInfo.prototype.WriteToBinary = function(oWriter)
{
	this.Write_ToBinary(oWriter);
};
CReviewInfo.prototype.ReadFromBinary = function(oReader)
{
	this.Read_FromBinary(oReader);
};
/**
 * Сохраняем предыдущее действие (обычно это добавление, а новое - удаление)
 * @param {number} nType
 */
CReviewInfo.prototype.SavePrev = function(nType)
{
	this.PrevType = nType;
	this.PrevInfo = this.Copy();
};
CReviewInfo.prototype.SetPrevReviewTypeWithInfoRecursively = function(nType, oInfo)
{
	var last = this;
	while (last.PrevInfo)
	{
		last = last.PrevInfo;
	}
	last.PrevType = nType;
	last.PrevInfo = oInfo;
};
/**
 * Данная функция запрашивает было ли ранее произведено добавление
 * @returns {?CReviewInfo}
 */
CReviewInfo.prototype.GetPrevAdded = function()
{
	var nPrevType = this.PrevType;
	var oPrevInfo = this.PrevInfo;
	while (oPrevInfo)
	{
		if (reviewtype_Add === this.PrevType)
		{
			return oPrevInfo;
		}

		nPrevType = oPrevInfo.PrevType;
		oPrevInfo = oPrevInfo.PrevInfo;
	}

	return null;
};
/**
 * Данная функция запрашивает было ли ранее произведено добавление текущим пользователем
 * @returns {?CReviewInfo}
 */
CReviewInfo.prototype.IsPrevAddedByCurrentUser = function()
{
	var oPrevInfo = this.GetPrevAdded();
	if (!oPrevInfo)
		return false;

	return oPrevInfo.IsCurrentUser();
};
CReviewInfo.prototype.GetColor = function()
{
	return this.Get_Color();
};
/**
 * Выставляем тип переноса
 * @param {Asc.c_oAscRevisionsMove} nType
 */
CReviewInfo.prototype.SetMove = function(nType)
{
	this.MoveType = nType;
};
/**
 * Добавленный текст во время переноса?
 * @returns {boolean}
 */
CReviewInfo.prototype.IsMovedTo = function()
{
	return this.MoveType === Asc.c_oAscRevisionsMove.MoveTo;
};
/**
 * Удаленный текст во время переноса?
 * @returns {boolean}
 */
CReviewInfo.prototype.IsMovedFrom = function()
{
	return this.MoveType === Asc.c_oAscRevisionsMove.MoveFrom;
};


function CanUpdatePosition(Para, Run) {
    return (Para && true === Para.Is_UseInDocument() && true === Run.Is_UseInParagraph());
}

//--------------------------------------------------------export----------------------------------------------------
window['AscCommonWord'] = window['AscCommonWord'] || {};
window['AscCommonWord'].ParaRun = ParaRun;
window['AscCommonWord'].CanUpdatePosition = CanUpdatePosition;
