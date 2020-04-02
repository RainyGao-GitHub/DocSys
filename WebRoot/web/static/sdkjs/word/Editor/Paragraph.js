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

// TODO: Надо избавиться от ParaEnd внутри ParaRun, а сам ParaEnd держать также как и ParaNumbering, как параметр
//       внутри самого класса Paragraph

// TODO: Избавиться от функций Internal_GetStartPos, Internal_GetEndPos, Clear_CollaborativeMarks

// Import
var c_oAscLineDrawingRule = AscCommon.c_oAscLineDrawingRule;
var align_Right = AscCommon.align_Right;
var align_Left = AscCommon.align_Left;
var align_Center = AscCommon.align_Center;
var g_oTableId = AscCommon.g_oTableId;
var g_oTextMeasurer = AscCommon.g_oTextMeasurer;
var c_oAscRevisionsChangeType = Asc.c_oAscRevisionsChangeType;
var History = AscCommon.History;

var linerule_Exact = Asc.linerule_Exact;
var c_oAscRelativeFromV = Asc.c_oAscRelativeFromV;

var type_Paragraph = 0x0001;

var UnknownValue  = null;

var REVIEW_COLOR = new AscCommon.CColor(255, 0, 0, 255);
var REVIEW_NUMBERING_COLOR = new AscCommon.CColor(27, 156, 171, 255);

/**
 * Класс Paragraph
 * @constructor
 * @extends {CDocumentContentElementBase}
 */
function Paragraph(DrawingDocument, Parent, bFromPresentation)
{
	CDocumentContentElementBase.call(this, Parent);

    this.CompiledPr =
    {
        Pr         : null,  // Скомпилированный (окончательный стиль параграфа)
        NeedRecalc : true   // Нужно ли пересчитать скомпилированный стиль
    };
    this.Pr = new CParaPr();

    // Рассчитанное положение рамки
    this.CalculatedFrame =
    {
        L : 0,       // Внутренний рект, по которому идет рассчет
        T : 0,
        W : 0,
        H : 0,
        L2 : 0,      // Внешний рект, с учетом границ
        T2 : 0,
        W2 : 0,
        H2 : 0,
        PageIndex : 0
    };

    // Данный TextPr будет относится только к символу конца параграфа
    this.TextPr = new ParaTextPr();
    this.TextPr.Parent = this;

    // Настройки секции
    this.SectPr = undefined; // undefined или CSectionPr

    this.Bounds = new CDocumentBounds(0, 0, 0, 0);

    this.RecalcInfo = new CParaRecalcInfo();

    this.Pages = []; // Массив страниц (CParaPage)
    this.Lines = []; // Массив строк (CParaLine)

    if(!(bFromPresentation === true))
    {
        this.Numbering = new ParaNumbering();
    }
    else
    {
        this.Numbering = new ParaPresentationNumbering();
    }
    this.ParaEnd   =
    {
        Line  : 0,
        Range : 0
    }; //new ParaEnd();
    
    this.CurPos    = new CParagraphCurPos();
    this.Selection = new CParagraphSelection();
    
    this.DrawingDocument = null;
    this.LogicDocument   = null;
    this.bFromDocument   = true;
    
    if ( undefined !== DrawingDocument && null !== DrawingDocument )
    {
        this.DrawingDocument = DrawingDocument;
        this.LogicDocument   = this.DrawingDocument.m_oLogicDocument;
        this.bFromDocument   = bFromPresentation === true ? false : !!this.LogicDocument;
    }   
    else
    {
        this.bFromDocument = !(true === bFromPresentation);
    }
    this.ApplyToAll = false; // Специальный параметр, используемый в ячейках таблицы.
    // True, если ячейка попадает в выделение по ячейкам.

    this.Lock = new AscCommon.CLock(); // Зажат ли данный параграф другим пользователем
    // TODO: Когда у g_oIdCounter будет тоже проверка на TurnOff заменить здесь
    if (this.bFromDocument && false === AscCommon.g_oIdCounter.m_bLoad && true === History.Is_On())
    {
        this.Lock.Set_Type(AscCommon.locktype_Mine, false);
        if (AscCommon.CollaborativeEditing)
            AscCommon.CollaborativeEditing.Add_Unlock2(this);
    }

    this.DeleteCommentOnRemove    = true; // Удаляем ли комменты в функциях Internal_Content_Remove

    this.m_oContentChanges = new AscCommon.CContentChanges(); // список изменений(добавление/удаление элементов)

    // Свойства необходимые для презентаций
    this.PresentationPr =
    {
        Level  : 0,
        Bullet : new CPresentationBullet()
    };

    this.FontMap =
    {
        Map        : {},
        NeedRecalc : true
    };

    this.SearchResults = {};

    this.SpellChecker  = new CParaSpellChecker(this);

    this.NearPosArray  = [];

    // Добавляем в контент элемент "конец параграфа"
    this.Content = [];
    var EndRun = new ParaRun(this);
    EndRun.Add_ToContent( 0, new ParaEnd() );

    this.Content[0] = EndRun;

    this.m_oPRSW = new CParagraphRecalculateStateWrap(this);
    this.m_oPRSC = new CParagraphRecalculateStateCounter();
    this.m_oPRSA = new CParagraphRecalculateStateAlign();
    this.m_oPRSI = new CParagraphRecalculateStateInfo();
    
    this.m_oPDSE = new CParagraphDrawStateElements();
    this.StartState = null;

    this.CollPrChange = false;

    // Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
    g_oTableId.Add( this, this.Id );
    if(bFromPresentation === true)
    {
        this.Save_StartState();
    }
}

Paragraph.prototype = Object.create(CDocumentContentElementBase.prototype);
Paragraph.prototype.constructor = Paragraph;

Paragraph.prototype.GetType = function()
{
	return type_Paragraph;
};
/**
 * Получаем ссылку на глобальный класс документа
 * @returns {CDocument}
 */
Paragraph.prototype.GetLogicDocument = function()
{
	return this.LogicDocument;
};
Paragraph.prototype.Save_StartState = function()
{
	this.StartState = new CParagraphStartState(this);
};
Paragraph.prototype.Use_Wrap = function()
{
	if (true !== this.Is_Inline())
		return false;

	return true;
};
Paragraph.prototype.Use_YLimit = function()
{
	if (undefined != this.Get_FramePr() && this.Parent instanceof CDocument)
		return false;

	return true;
};
Paragraph.prototype.Set_Pr = function(oNewPr)
{
	return this.SetDirectParaPr(oNewPr);
};
/**
 * Устанавливаем прямые настройки параграфа целиком
 * @param oParaPr {CParaPr}
 */
Paragraph.prototype.SetDirectParaPr = function(oParaPr)
{
	if (!oParaPr)
		return;

	var oNewPr = oParaPr.Copy(true);

	History.Add(new CChangesParagraphPr(this, this.Pr, oNewPr));

	this.Pr = oNewPr;

	this.Recalc_CompiledPr();
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
	this.UpdateDocumentOutline();
};
/**
 * Устанавливаем прямые настройки для текста
 * @param oTextPr {CTextPr}
 */
Paragraph.prototype.SetDirectTextPr = function(oTextPr)
{
	// TODO: Пока мы пробегаемся только по верхним элементам параграфа (без поиска в глубину), т.к. данная функция используется
	//       только для новых параграфов

	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		var oRun = this.Content[nIndex];
		if (oRun.Type === para_Run)
		{
			oRun.Set_Pr(oTextPr.Copy());

			// TODO: Передалать ParaEnd
			if (nIndex === nCount - 1)
			{
				this.TextPr.Set_Value(oTextPr.Copy());
			}
		}
	}
};
Paragraph.prototype.Copy = function(Parent, DrawingDocument, oPr)
{
	var Para = new Paragraph(DrawingDocument ? DrawingDocument : this.DrawingDocument, Parent, !this.bFromDocument);

	if (!oPr)
		oPr = {};

	if (false !== oPr.CopyReviewPr)
		oPr.CopyReviewPr = true;

	oPr.Paragraph = Para;

	// Копируем настройки
	Para.Set_Pr(this.Pr.Copy(true, oPr));

	if (this.LogicDocument && null !== this.LogicDocument.CopyNumberingMap && undefined !== Para.Pr.NumPr && undefined !== Para.Pr.NumPr.NumId)
	{
		var NewId = this.LogicDocument.CopyNumberingMap[Para.Pr.NumPr.NumId];
		if (undefined !== NewId)
			Para.SetNumPr(NewId, Para.Pr.NumPr.Lvl);
	}

	Para.TextPr.Set_Value(this.TextPr.Value.Copy(undefined, oPr));

	// Удаляем содержимое нового параграфа
	Para.Internal_Content_Remove2(0, Para.Content.length);

	// Копируем содержимое параграфа
	var Count = this.Content.length;
	for (var Index = 0; Index < Count; Index++)
	{
		var Item = this.Content[Index];

		if (para_Comment === Item.Type && true === oPr.SkipComments)
			continue;

		Para.Internal_Content_Add(Para.Content.length, Item.Copy(false, oPr), false);
	}

	// TODO: Как только переделаем para_End, переделать тут
	// Поскольку в ране не копируется элемент para_End добавим его здесь отдельно

	var EndRun = new ParaRun(Para);
	EndRun.Add_ToContent(0, new ParaEnd());
	Para.Internal_Content_Add(Para.Content.length, EndRun, false);

	EndRun.Set_Pr(this.TextPr.Value.Copy(undefined, oPr));

	if (oPr && oPr.CopyReviewPr)
		EndRun.SetReviewTypeWithInfo(this.GetReviewType(), this.GetReviewInfo().Copy(), false);

	if(oPr && oPr.Comparison)
	{
		oPr.Comparison.updateReviewInfo(EndRun, reviewtype_Add, true);
	}

	// Добавляем секцию в конце
	if (undefined !== this.SectPr)
	{
		var oLogicDocument = this.SectPr.LogicDocument;
		var bCopyHdrFtr = undefined;
		if(oPr && oPr.Comparison)
		{
			oLogicDocument = oPr.Comparison.originalDocument;
			bCopyHdrFtr = true;
		}
		var SectPr = new CSectionPr(oLogicDocument);
		SectPr.Copy(this.SectPr, bCopyHdrFtr, oPr);
		Para.Set_SectionPr(SectPr);
	}

	Para.RemoveSelection();
	Para.MoveCursorToStartPos(false);

	return Para;
};
Paragraph.prototype.Copy2 = function(Parent)
{
	var Para = new Paragraph(this.DrawingDocument, Parent, true);

	// Копируем настройки
	Para.Set_Pr(this.Pr.Copy());

	Para.TextPr.Set_Value(this.TextPr.Value.Copy());

	// Удаляем содержимое нового параграфа
	Para.Internal_Content_Remove2(0, Para.Content.length);

	// Копируем содержимое параграфа
	var Count = this.Content.length;
	for (var Index = 0; Index < Count; Index++)
	{
		var Item = this.Content[Index];
		Para.Internal_Content_Add(Para.Content.length, Item.Copy2(), false);
	}


	Para.RemoveSelection();
	Para.MoveCursorToStartPos(false);

	return Para;
};
/**
 * Получаем настройки прямые настройки текста для начала параграфа
 * @returns {CTextPr}
 */
Paragraph.prototype.GetFirstRunPr = function()
{
	if (this.Content.length <= 0 || para_Run !== this.Content[0].Type)
		return this.TextPr.Value.Copy();

	return this.Content[0].Pr.Copy();
};
Paragraph.prototype.Get_FirstTextPr = function()
{
	if (this.Content.length <= 0 || para_Run !== this.Content[0].Type)
		return this.Get_CompiledPr2(false).TextPr;

	return this.Content[0].Get_CompiledPr();
};
Paragraph.prototype.Get_FirstTextPr2 = function()
{
	var HyperlinkPr;
	for(var i = 0; i < this.Content.length; ++i)
	{
		if(!this.Content[i].Is_Empty())
		{
			if(para_Run === this.Content[i].Type)
			{
				return this.Content[i].Get_CompiledPr();
			}
			else if(para_Hyperlink === this.Content[i].Type)
			{
                HyperlinkPr =  this.Content[i].Get_FirstTextPr2();
                if(HyperlinkPr)
				{
					return HyperlinkPr;
				}
			}
			else if(para_Math === this.Content[i].Type)
			{
				return this.Content[i].GetFirstRPrp();
			}
		}
	}
    return this.Get_CompiledPr2(false).TextPr;
};
/**
 * Получаем самый первый ран в параграфе
 * @returns {?ParaRun}
 */
Paragraph.prototype.GetFirstRun = function()
{
	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		var oRun = this.Content[nIndex].GetFirstRun();
		if (oRun)
			return oRun;
	}

	return null;
};
Paragraph.prototype.GetAllDrawingObjects = function(arrDrawingObjects)
{
	if (!arrDrawingObjects)
		arrDrawingObjects = [];

	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		var oItem = this.Content[nPos];
		if (oItem.GetAllDrawingObjects)
			oItem.GetAllDrawingObjects(arrDrawingObjects);
	}

	return arrDrawingObjects;
};
Paragraph.prototype.GetAllComments = function(List)
{
	if (undefined === List)
		List = [];

	var Len = this.Content.length;
	for (var Pos = 0; Pos < Len; Pos++)
	{
		var Item = this.Content[Pos];

		if (para_Comment === Item.Type)
			List.push({Comment : Item, Paragraph : this});
	}

	return List;
};
Paragraph.prototype.GetAllMaths = function(List)
{
	if (undefined === List)
		List = [];

	var Len = this.Content.length;
	for (var Pos = 0; Pos < Len; Pos++)
	{
		var Item = this.Content[Pos];
		if (para_Math === Item.Type)
			List.push({Math : Item, Paragraph : this});
	}

	return List;
};
Paragraph.prototype.GetAllParagraphs = function(Props, ParaArray)
{
	var ContentLen = this.Content.length;
	for (var CurPos = 0; CurPos < ContentLen; CurPos++)
	{
		if (this.Content[CurPos].GetAllParagraphs)
			this.Content[CurPos].GetAllParagraphs(Props, ParaArray);
	}

	if (true === Props.All)
	{
		ParaArray.push(this);
	}
	else if (true === Props.Numbering)
	{
		var oCurNumPr = this.GetNumPr();
		if (!oCurNumPr)
			return;

		if (Props.NumPr instanceof CNumPr)
		{
			var oNumPr = Props.NumPr;
			if (oCurNumPr.NumId === oNumPr.NumId && (oCurNumPr.Lvl === oNumPr.Lvl || undefined === oNumPr.Lvl || null === oNumPr.Lvl))
				ParaArray.push(this);
		}
		else if (Props.NumPr instanceof Array)
		{
			for (var nIndex = 0, nCount = Props.NumPr.length; nIndex < nCount; ++nIndex)
			{
				var oNumPr = Props.NumPr[nIndex];
				if (oCurNumPr.NumId === oNumPr.NumId && (oCurNumPr.Lvl === oNumPr.Lvl || undefined === oNumPr.Lvl || null === oNumPr.Lvl))
				{
					ParaArray.push(this);
					break;
				}
			}
		}
	}
	else if (true === Props.Style)
	{
		for (var nIndex = 0, nCount = Props.StylesId.length; nIndex < nCount; nIndex++)
		{
			var StyleId = Props.StylesId[nIndex];
			if (this.Pr.PStyle === StyleId)
			{
				ParaArray.push(this);
				break;
			}
		}
	}
	else if (true === Props.Selected)
	{
		if (true === this.Selection.Use)
			ParaArray.push(this);
	}
};

Paragraph.prototype.GetAllSeqFieldsByType = function(sType, aFields)
{
	var nOutlineLevel = this.GetOutlineLvl()
	if(undefined !== nOutlineLevel && null !== nOutlineLevel)
	{
		aFields.push(nOutlineLevel)
	}
	for(var i = 0; i < this.Content.length; ++i)
	{
		this.Content[i].GetAllSeqFieldsByType(sType, aFields);
	}
};

Paragraph.prototype.Get_PageBounds = function(CurPage)
{
	if (!this.Pages[CurPage])
		return new CDocumentBounds(0, 0, 0, 0);

	return this.Pages[CurPage].Bounds;
};
Paragraph.prototype.GetContentBounds = function(CurPage)
{
	var oPage = this.Pages[CurPage];
	if (!oPage || oPage.StartLine > oPage.EndLine)
		return this.Get_PageBounds(CurPage).Copy();

	var isJustify = (this.Get_CompiledPr2(false).ParaPr.Jc === AscCommon.align_Justify) && this.Lines.length > 1;

	var oBounds = null;
	for (var CurLine = oPage.StartLine; CurLine <= oPage.EndLine; ++CurLine)
	{
		var oLine = this.Lines[CurLine];

		var Top    = oLine.Top + oPage.Y;
		var Bottom = oLine.Bottom + oPage.Y;

		var Left = null, Right = null;

		for (var CurRange = 0, RangesCount = oLine.Ranges.length; CurRange < RangesCount; ++CurRange)
		{
			var oRange = oLine.Ranges[CurRange];
			if (null === Left || Left > oRange.XVisible)
				Left = oRange.XVisible;

			if (isJustify)
			{
				if (null === Right || Right < oRange.XEnd)
					Right = oRange.XEnd;
			}
			else
			{
				if (null === Right || Right < oRange.XVisible + oRange.W + oRange.WEnd + oRange.WBreak)
					Right = oRange.XVisible + oRange.W + oRange.WEnd + oRange.WBreak;
			}
		}


		if (!oBounds)
		{
			oBounds = new CDocumentBounds(Left, Top, Right, Bottom);
		}
		else
		{
			if (oBounds.Top > Top)
				oBounds.Top = Top;

			if (oBounds.Bottom < Bottom)
				oBounds.Bottom = Bottom;

			if (oBounds.Left > Left)
				oBounds.Left = Left;

			if (oBounds.Right < Right)
				oBounds.Right = Right;
		}
	}

	return oBounds;
};
Paragraph.prototype.Get_EmptyHeight = function()
{
	var Pr        = this.Get_CompiledPr();
	var EndTextPr = Pr.TextPr.Copy();
	EndTextPr.Merge(this.TextPr.Value);

	g_oTextMeasurer.SetTextPr(EndTextPr, this.Get_Theme());
	g_oTextMeasurer.SetFontSlot(fontslot_ASCII);

	return g_oTextMeasurer.GetHeight();
};
Paragraph.prototype.Get_Theme = function()
{
	if (this.Parent)
		return this.Parent.Get_Theme();

	return null;
};
Paragraph.prototype.Get_ColorMap = function()
{
	if (this.Parent)
		return this.Parent.Get_ColorMap();

	return null;
};
Paragraph.prototype.Reset = function(X, Y, XLimit, YLimit, PageNum, ColumnNum, ColumnsCount)
{
	this.X      = X;
	this.Y      = Y;
	this.XLimit = XLimit;
	this.YLimit = YLimit;

	var ColumnNumOld = this.ColumnNum;
	var PageNumOld   = this.PageNum;

	this.PageNum      = PageNum;
	this.ColumnNum    = ColumnNum ? ColumnNum : 0;
	this.ColumnsCount = ColumnsCount ? ColumnsCount : 1;

	// При первом пересчете параграфа this.Parent.RecalcInfo.Can_RecalcObject() всегда будет true, а вот при повторных
	// уже нет Кроме случая, когда параграф меняет свое местоположение на страницах и колонках
	if (true === this.Parent.RecalcInfo.Can_RecalcObject() || ColumnNumOld !== this.ColumnNum || PageNumOld !== this.PageNum)
	{
		// Эти значения нужны для правильного рассчета положения картинок, смотри баг #34392
		var Ranges = this.Parent.CheckRange(X, Y, XLimit, Y, Y, Y, X, XLimit, this.PageNum, true);
		if (Ranges.length > 0 && this.bFromDocument && this.LogicDocument && this.LogicDocument.GetCompatibilityMode() <= document_compatibility_mode_Word14)
		{
			if (Math.abs(Ranges[0].X0 - X) < 0.001)
				this.X_ColumnStart = Ranges[0].X1;
			else
				this.X_ColumnStart = X;

			if (Math.abs(Ranges[Ranges.length - 1].X1 - XLimit) < 0.001)
				this.X_ColumnEnd = Ranges[Ranges.length - 1].X0;
			else
				this.X_ColumnEnd = XLimit;

			// Ситуация, когда из-за обтекания строчка съезжает вниз целиком
			if (this.X_ColumnStart > this.X_ColumnEnd)
			{
				this.X_ColumnStart = X;
				this.X_ColumnEnd   = XLimit;
			}
		}
		else
		{
			this.X_ColumnStart = X;
			this.X_ColumnEnd   = XLimit;
		}
	}
};
/**
 * Копируем свойства параграфа
 */
Paragraph.prototype.CopyPr = function(OtherParagraph)
{
	return this.CopyPr_Open(OtherParagraph);
};
/**
 * Копируем свойства параграфа при открытии и копировании
 */
Paragraph.prototype.CopyPr_Open = function(OtherParagraph)
{
	OtherParagraph.X      = this.X;
	OtherParagraph.XLimit = this.XLimit;

	if ("undefined" != typeof(OtherParagraph.NumPr))
		OtherParagraph.RemoveNumPr();

	var NumPr = this.GetNumPr();
	if (undefined != NumPr)
	{
		OtherParagraph.SetNumPr(NumPr.NumId, NumPr.Lvl);
	}
	// Копируем прямые настройки параграфа в конце, потому что, например, нумерация может
	// их изменить.
	var oOldPr        = OtherParagraph.Pr;
	OtherParagraph.Pr = this.Pr.Copy(true);
	History.Add(new CChangesParagraphPr(OtherParagraph, oOldPr, OtherParagraph.Pr));
	OtherParagraph.private_UpdateTrackRevisionOnChangeParaPr(true);

	if (this.bFromDocument)
		OtherParagraph.Style_Add(this.Style_Get(), true);

	// TODO: Другой параграф, как правило новый, поэтому можно использовать функцию Apply, но на самом деле надо
	//       переделать на нормальную функцию Set_Pr.
	OtherParagraph.TextPr.Apply_TextPr(this.TextPr.Value);
};
/**
 * Обновляем позиции курсора и селекта во время добавления элементов
 * @param nPosition {number}
 * @param [nCount=1] {number}
 */
Paragraph.prototype.private_UpdateSelectionPosOnAdd = function(nPosition, nCount)
{
	if (this.Content.length <= 0)
	{
		this.CurPos.ContentPos  = 0;
		this.Selection.StartPos = 0;
		this.Selection.EndPos   = 0;
		return;
	}

	if (undefined === nCount || null === nCount)
		nCount = 1;

	if (this.CurPos.ContentPos >= nPosition)
		this.CurPos.ContentPos += nCount;

	if (this.Selection.StartPos >= nPosition)
		this.Selection.StartPos += nCount;

	if (this.Selection.EndPos >= nPosition)
		this.Selection.EndPos += nCount;

	this.Selection.StartPos = Math.max(0, Math.min(this.Content.length - 1, this.Selection.StartPos));
	this.Selection.EndPos   = Math.max(0, Math.min(this.Content.length - 1, this.Selection.EndPos));
	this.CurPos.ContentPos  = Math.max(0, Math.min(this.Content.length - 1, this.CurPos.ContentPos));
};
/**
 * Обновляем позиции курсора и селекта во время удаления элементов
 * @param nPosition {number}
 * @param nCount {number}
 */
Paragraph.prototype.private_UpdateSelectionPosOnRemove = function(nPosition, nCount)
{
	if (this.CurPos.ContentPos >= nPosition + nCount)
	{
		this.CurPos.ContentPos -= nCount;
	}
	else if (this.CurPos.ContentPos >= nPosition)
	{
		if (nPosition < this.Content.length)
			this.CurPos.ContentPos = nPosition;
		else if (nPosition > 0)
			this.CurPos.ContentPos = nPosition - 1;
		else
			this.CurPos.ContentPos = 0;
	}

	if (this.Selection.StartPos <= this.Selection.EndPos)
	{
		if (this.Selection.StartPos >= nPosition + nCount)
			this.Selection.StartPos -= nCount;
		else if (this.Selection.StartPos >= nPosition)
			this.Selection.StartPos = nPosition;

		if (this.Selection.EndPos >= nPosition + nCount)
			this.Selection.EndPos -= nCount;
		else if (this.Selection.EndPos >= nPosition)
			this.Selection.StartPos = nPosition - 1;

		if (this.Selection.StartPos > this.Selection.EndPos)
		{
			this.Selection.Use = false;
			this.Selection.StartPos = 0;
			this.Selection.EndPos   = 0;
		}
	}
	else
	{
		if (this.Selection.EndPos >= nPosition + nCount)
			this.Selection.EndPos -= nCount;
		else if (this.Selection.EndPos >= nPosition)
			this.Selection.EndPos = nPosition;

		if (this.Selection.StartPos >= nPosition + nCount)
			this.Selection.StartPos -= nCount;
		else if (this.Selection.StartPos >= nPosition)
			this.Selection.StartPos = nPosition - 1;

		if (this.Selection.EndPos > this.Selection.StartPos)
		{
			this.Selection.Use = false;
			this.Selection.StartPos = 0;
			this.Selection.EndPos   = 0;
		}
	}

	this.Selection.StartPos = Math.max(0, Math.min(this.Content.length - 1, this.Selection.StartPos));
	this.Selection.EndPos   = Math.max(0, Math.min(this.Content.length - 1, this.Selection.EndPos));
	this.CurPos.ContentPos  = Math.max(0, Math.min(this.Content.length - 1, this.CurPos.ContentPos));
};
/**
 * Добавляем элемент в содержимое параграфа. (Здесь передвигаются все позиции
 * CurPos.ContentPos, Selection.StartPos, Selection.EndPos)
 */
Paragraph.prototype.Internal_Content_Add = function(Pos, Item, bCorrectPos)
{
	History.Add(new CChangesParagraphAddItem(this, Pos, [Item]));
	this.Content.splice(Pos, 0, Item);
	this.private_UpdateTrackRevisions();
	this.private_CheckUpdateBookmarks([Item]);
	this.UpdateDocumentOutline();
	this.private_UpdateSelectionPosOnAdd(Pos, 1);

	// Обновляем позиции в NearestPos
	var NearPosLen = this.NearPosArray.length;
	for (var Index = 0; Index < NearPosLen; Index++)
	{
		var ParaNearPos    = this.NearPosArray[Index];
		var ParaContentPos = ParaNearPos.NearPos.ContentPos;

		if (ParaContentPos.Data[0] >= Pos)
			ParaContentPos.Data[0]++;
	}

	// Обновляем позиции в SearchResults
	for (var Id in this.SearchResults)
	{
		var ContentPos = this.SearchResults[Id].StartPos;

		if (ContentPos.Data[0] >= Pos)
			ContentPos.Data[0]++;

		ContentPos = this.SearchResults[Id].EndPos;

		if (ContentPos.Data[0] >= Pos)
			ContentPos.Data[0]++;
	}

	// Передвинем все метки слов для проверки орфографии
	// Обновляем позиции в SearchResults
	var SpellingsCount = this.SpellChecker.Elements.length;
	for (var Pos = 0; Pos < SpellingsCount; Pos++)
	{
		var Element    = this.SpellChecker.Elements[Pos];
		var ContentPos = Element.StartPos;

		if (ContentPos.Data[0] >= Pos)
			ContentPos.Data[0]++;

		ContentPos = Element.EndPos;

		if (ContentPos.Data[0] >= Pos)
			ContentPos.Data[0]++;
	}

	this.SpellChecker.Update_OnAdd(this, Pos, Item);

	Item.SetParagraph(this);
};
Paragraph.prototype.Add_ToContent = function(Pos, Item)
{
	this.Internal_Content_Add(Pos, Item);
};
Paragraph.prototype.AddToContent = function(nPos, oItem)
{
	this.Add_ToContent(nPos, oItem);
};
Paragraph.prototype.Remove_FromContent = function(Pos, Count)
{
	this.Internal_Content_Remove2(Pos, Count);
};
Paragraph.prototype.RemoveFromContent = function(nPos, nCount)
{
	return this.Internal_Content_Remove2(nPos, nCount);
};
/**
 * Добавляем несколько элементов в конец параграфа
 */
Paragraph.prototype.Internal_Content_Concat = function(arrItems)
{
	var nStartPos = this.Content.length;
	for (var nIndex = 0, nCount = arrItems.length; nIndex < nCount; ++nIndex)
	{
		this.Content.push(arrItems[nIndex]);

		arrItems[nIndex].SetParagraph(this);
		if (arrItems[nIndex].Recalc_RunsCompiledPr)
			arrItems[nIndex].Recalc_RunsCompiledPr();
	}

	History.Add(new CChangesParagraphAddItem(this, nStartPos, arrItems));
	this.private_UpdateTrackRevisions();
	this.private_CheckUpdateBookmarks(arrItems);
	this.UpdateDocumentOutline();

	// Обновлять позиции в NearestPos не надо, потому что мы добавляем новые элементы в конец массива
	this.RecalcInfo.Set_Type_0_Spell(pararecalc_0_Spell_All);
};
/**
 * Удаляем элемент из содержимого параграфа. (Здесь передвигаются все позиции
 * CurPos.ContentPos, Selection.StartPos, Selection.EndPos)
 */
Paragraph.prototype.Internal_Content_Remove = function(Pos)
{
	var Item = this.Content[Pos];
	History.Add(new CChangesParagraphRemoveItem(this, Pos, [Item]));

	if (Item.PreDelete)
		Item.PreDelete();

	this.Content.splice(Pos, 1);
	this.private_UpdateTrackRevisions();
	this.private_CheckUpdateBookmarks([Item]);
	this.UpdateDocumentOutline();
	this.private_UpdateSelectionPosOnRemove(Pos, 1);

	// Обновляем позиции в NearestPos
	var NearPosLen = this.NearPosArray.length;
	for (var Index = 0; Index < NearPosLen; Index++)
	{
		var ParaNearPos    = this.NearPosArray[Index];
		var ParaContentPos = ParaNearPos.NearPos.ContentPos;

		if (ParaContentPos.Data[0] > Pos)
			ParaContentPos.Data[0]--;
	}

	// Обновляем позиции в SearchResults
	for (var Id in this.SearchResults)
	{
		var ContentPos = this.SearchResults[Id].StartPos;

		if (ContentPos.Data[0] > Pos)
			ContentPos.Data[0]--;

		ContentPos = this.SearchResults[Id].EndPos;

		if (ContentPos.Data[0] > Pos)
			ContentPos.Data[0]--;
	}

	// Удаляем комментарий, если это необходимо
	if (true === this.DeleteCommentOnRemove && para_Comment === Item.Type && this.LogicDocument)
		this.LogicDocument.RemoveComment(Item.CommentId, true, false);

	var SpellingsCount = this.SpellChecker.Elements.length;
	for (var Pos = 0; Pos < SpellingsCount; Pos++)
	{
		var Element    = this.SpellChecker.Elements[Pos];
		var ContentPos = Element.StartPos;

		if (ContentPos.Data[0] > Pos)
			ContentPos.Data[0]--;

		ContentPos = Element.EndPos;

		if (ContentPos.Data[0] > Pos)
			ContentPos.Data[0]--;
	}

	// Передвинем все метки слов для проверки орфографии
	this.SpellChecker.Update_OnRemove(this, Pos, 1);
};
/**
 * Удаляем несколько элементов
 */
Paragraph.prototype.Internal_Content_Remove2 = function(Pos, Count)
{
	if (0 === Pos && this.Content.length === Count)
		return this.ClearContent();

	var CommentsToDelete = [];
	if (true === this.DeleteCommentOnRemove && this.LogicDocument && null != this.LogicDocument.Comments)
	{
		var DocumentComments = this.LogicDocument.Comments;
		for (var Index = Pos; Index < Pos + Count; Index++)
		{
			var Item = this.Content[Index];
			if (para_Comment === Item.Type)
			{
				var CommentId = Item.CommentId;
				var Comment   = DocumentComments.Get_ById(CommentId);

				if (null != Comment)
				{
					if (true === Item.Start)
						Comment.Set_StartId(null);
					else
						Comment.Set_EndId(null);
				}

				CommentsToDelete.push(CommentId);
			}
		}
	}

	for (var nIndex = Pos; nIndex < Pos + Count; ++nIndex)
	{
		if (this.Content[nIndex].PreDelete)
			this.Content[nIndex].PreDelete();
	}

	var DeletedItems = this.Content.slice(Pos, Pos + Count);
	History.Add(new CChangesParagraphRemoveItem(this, Pos, DeletedItems));
	this.private_UpdateTrackRevisions();
	this.private_CheckUpdateBookmarks(DeletedItems);
	this.UpdateDocumentOutline();

	if (this.Selection.StartPos > Pos + Count)
		this.Selection.StartPos -= Count;
	else if (this.Selection.StartPos > Pos)
		this.Selection.StartPos = Pos;

	if (this.Selection.EndPos > Pos + Count)
		this.Selection.EndPos -= Count;
	if (this.Selection.EndPos > Pos)
		this.Selection.EndPos = Pos;

	if (this.CurPos.ContentPos > Pos + Count)
		this.CurPos.ContentPos -= Count;
	else if (this.CurPos.ContentPos > Pos)
		this.CurPos.ContentPos = Pos;

	// Обновляем позиции в NearestPos
	var NearPosLen = this.NearPosArray.length;
	for (var Index = 0; Index < NearPosLen; Index++)
	{
		var ParaNearPos    = this.NearPosArray[Index];
		var ParaContentPos = ParaNearPos.NearPos.ContentPos;

		if (ParaContentPos.Data[0] > Pos + Count)
			ParaContentPos.Data[0] -= Count;
		else if (ParaContentPos.Data[0] > Pos)
			ParaContentPos.Data[0] = Math.max(0, Pos);
	}

	this.Content.splice(Pos, Count);
	this.private_UpdateSelectionPosOnRemove(Pos, Count);

	// Комментарии удаляем после, чтобы не нарушить позиции
	if(this.LogicDocument)
	{
		var CountCommentsToDelete = CommentsToDelete.length;
		for (var Index = 0; Index < CountCommentsToDelete; Index++)
		{
			this.LogicDocument.RemoveComment(CommentsToDelete[Index], true, false);
		}
	}

	// Передвинем все метки слов для проверки орфографии
	this.SpellChecker.Update_OnRemove(this, Pos, Count);
};
/**
 * Очищаем полностью параграф (включая последний ран)
 */
Paragraph.prototype.ClearContent = function()
{
	var arrCommentsToDelete = [];
	var isDeleteComments = true === this.DeleteCommentOnRemove && null != this.LogicDocument && null != this.LogicDocument.Comments;
	var oDocumentComments = null;
	if(isDeleteComments)
	{
		oDocumentComments = this.LogicDocument.Comments;
	}
	for (var nPos = 0, nLen = this.Content.length; nPos < nLen; ++nPos)
	{
		var oItem = this.Content[nPos];

		if (isDeleteComments && para_Comment === oItem.Type)
		{
			var sCommentId = oItem.CommentId;
			var oComment   = oDocumentComments.Get_ById(sCommentId);

			if (oComment)
			{
				if (true === oItem.Start)
					oComment.Set_StartId(null);
				else
					oComment.Set_EndId(null);
			}

			arrCommentsToDelete.push(CommentId);
		}

		if (oItem.PreDelete)
			oItem.PreDelete();
	}

	History.Add(new CChangesParagraphRemoveItem(this, 0, this.Content));

	this.private_UpdateTrackRevisions();
	this.private_CheckUpdateBookmarks(this.Content);
	this.UpdateDocumentOutline();

	this.Selection.StartPos = 0;
	this.Selection.EndPos   = 0;
	this.CurPos.ContentPos  = 0;

	this.NearPosArray = [];

	this.Content = [];

	// Комментарии удаляем после, чтобы не нарушить позиции
	if(this.LogicDocument)
	{
		for (var nIndex = 0, nCount = arrCommentsToDelete.length; nIndex < nCount; ++nIndex)
		{
			this.LogicDocument.RemoveComment(arrCommentsToDelete[nIndex], true, false);
		}
	}
};
Paragraph.prototype.Clear_ContentChanges = function()
{
	this.m_oContentChanges.Clear();
};
Paragraph.prototype.Add_ContentChanges = function(Changes)
{
	this.m_oContentChanges.Add(Changes);
};
Paragraph.prototype.Refresh_ContentChanges = function()
{
	this.m_oContentChanges.Refresh();
};
/**
 * Получаем текущую позицию внутри параграфа
 * @returns {CParaPos}
 */
Paragraph.prototype.GetCurrentParaPos = function()
{
	// Сначала определим строку и отрезок
	var ParaPos = this.Content[this.CurPos.ContentPos].GetCurrentParaPos();

	if (-1 !== this.CurPos.Line)
	{
		ParaPos.Line  = this.CurPos.Line;
		ParaPos.Range = this.CurPos.Range;
	}

	ParaPos.Page = this.Get_PageByLine(ParaPos.Line);

	return ParaPos;
};
Paragraph.prototype.Get_PageByLine = function(LineIndex)
{
	for (var CurPage = this.Pages.length - 1; CurPage >= 0; CurPage--)
	{
		var Page = this.Pages[CurPage];
		if (LineIndex >= Page.StartLine && LineIndex <= Page.EndLine)
			return CurPage;
	}

	return 0;
};
Paragraph.prototype.Get_ParaPosByContentPos = function(ContentPos)
{
	// Сначала определим строку и отрезок
	var ParaPos = this.Content[ContentPos.Get(0)].Get_ParaPosByContentPos(ContentPos, 1);
	var CurLine = ParaPos.Line;

	// Определим страницу
	var PagesCount = this.Pages.length;
	for (var CurPage = PagesCount - 1; CurPage >= 0; CurPage--)
	{
		var Page = this.Pages[CurPage];
		if (CurLine >= Page.StartLine && CurLine <= Page.EndLine)
		{
			ParaPos.Page = CurPage;
			return ParaPos;
		}
	}

	return ParaPos;
};
Paragraph.prototype.Check_Range_OnlyMath = function(CurRange, CurLine)
{
	var StartPos = this.Lines[CurLine].Ranges[CurRange].StartPos;
	var EndPos   = this.Lines[CurLine].Ranges[CurRange].EndPos;
	var Checker  = new CParagraphMathRangeChecker();

	for (var Pos = StartPos; Pos <= EndPos; Pos++)
	{
		this.Content[Pos].Check_Range_OnlyMath(Checker, CurRange, CurLine);

		if (false === Checker.Result)
			break;
	}

	if (true !== Checker.Result || null === Checker.Math || true === Checker.Math.Get_Inline())
		return null;

	return Checker.Math;
};
Paragraph.prototype.Check_MathPara = function(MathPos)
{
	if (undefined === this.Content[MathPos] || para_Math !== this.Content[MathPos].Type)
		return false;

	var MathParaChecker = new CParagraphMathParaChecker();

	// Нам надо пробежаться впереди назад и найти ближайшие элементы.
	MathParaChecker.Direction = -1;
	for (var CurPos = MathPos - 1; CurPos >= 0; CurPos--)
	{
		if (this.Content[CurPos].Check_MathPara)
		{
			this.Content[CurPos].Check_MathPara(MathParaChecker);

			if (false !== MathParaChecker.Found)
				break;
		}
	}

	// Нумерация привязанная к формуле делает ее inline.
	if (true !== MathParaChecker.Found)
	{
		if(this.bFromDocument)
		{
            if(undefined !== this.GetNumPr())
			{
				return false;
			}
		}
		else
		{
			if(undefined !== this.Get_CompiledPr2(false).ParaPr.Bullet)
			{
				return false;
			}
		}
	}

	if (true !== MathParaChecker.Result)
		return false;

	MathParaChecker.Direction = 1;
	MathParaChecker.Found     = false;

	var Count = this.Content.length;
	for (var CurPos = MathPos + 1; CurPos < Count; CurPos++)
	{
		if (this.Content[CurPos].Check_MathPara)
		{
			this.Content[CurPos].Check_MathPara(MathParaChecker);

			if (false !== MathParaChecker.Found)
				break;
		}
	}

	if (true !== MathParaChecker.Result)
		return false;

	return true;
};
Paragraph.prototype.GetEndInfo = function()
{
	var PagesCount = this.Pages.length;

	if (PagesCount > 0)
		return this.Pages[PagesCount - 1].EndInfo.Copy();
	else
		return null;
};
Paragraph.prototype.GetEndInfoByPage = function(CurPage)
{
	// Здесь может приходить отрицательное значение
	if (CurPage < 0)
		return this.Parent.GetPrevElementEndInfo(this);
	else
		return this.Pages[CurPage].EndInfo.Copy();
};
Paragraph.prototype.Recalculate_PageEndInfo = function(PRSW, CurPage)
{
	var PrevInfo = ( 0 === CurPage ? this.Parent.GetPrevElementEndInfo(this) : this.Pages[CurPage - 1].EndInfo.Copy() );

	var PRSI = this.m_oPRSI;

	PRSI.Reset(PrevInfo);

	var StartLine  = this.Pages[CurPage].StartLine;
	var EndLine    = this.Pages[CurPage].EndLine;

	for (var CurLine = StartLine; CurLine <= EndLine; CurLine++)
	{
		var RangesCount = this.Lines[CurLine].Ranges.length;
		for (var CurRange = 0; CurRange < RangesCount; CurRange++)
		{
			var StartPos = this.Lines[CurLine].Ranges[CurRange].StartPos;
			var EndPos   = this.Lines[CurLine].Ranges[CurRange].EndPos;
			for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
			{
				this.Content[CurPos].Recalculate_PageEndInfo(PRSI, CurLine, CurRange);
			}
		}
	}

	this.Pages[CurPage].EndInfo.SetFromPRSI(PRSI);

	if (PRSW)
		this.Pages[CurPage].EndInfo.RunRecalcInfo = PRSW.RunRecalcInfoBreak;
};
Paragraph.prototype.UpdateEndInfo = function()
{
	for (var CurPage = 0, PagesCount = this.Pages.length; CurPage < PagesCount; CurPage++)
	{
		this.Recalculate_PageEndInfo(null, CurPage);
	}
};
Paragraph.prototype.Recalculate_Drawing_AddPageBreak = function(CurLine, CurPage, RemoveDrawings)
{
	if (true === RemoveDrawings)
	{
		// Мы должны из соответствующих FlowObjects удалить все Flow-объекты, идущие до этого места в параграфе
		for (var TempPage = 0; TempPage <= CurPage; TempPage++)
		{
			var DrawingsLen = this.Pages[TempPage].Drawings.length;
			for (var CurPos = 0; CurPos < DrawingsLen; CurPos++)
			{
				var Item = this.Pages[TempPage].Drawings[CurPos];
				this.Parent.DrawingObjects.removeById(Item.PageNum, Item.Get_Id());
			}

			this.Pages[TempPage].Drawings = [];
		}
	}

	this.Pages[CurPage].Set_EndLine(CurLine - 1);

	if (0 === CurLine)
		this.Lines[-1] = new CParaLine(0);
};
/**
 * Проверяем есть ли в параграфе встроенные PageBreak
 * @return {bool}
 */
Paragraph.prototype.Check_PageBreak = function()
{
	//TODO: возможно стоит данную проверку проводить во время добавления/удаления элементов из параграфа
	var Count = this.Content.length;
	for (var Pos = 0; Pos < Count; Pos++)
	{
		if (true === this.Content[Pos].Check_PageBreak())
			return true;
	}

	return false;
};
/**
 * Проверяем нужно ли разрывать страницу после заданного PageBreak элемента
 * @param oPageBreakItem {ParaNewLine}
 * @returns {boolean}
 */
Paragraph.prototype.CheckSplitPageOnPageBreak = function(oPageBreakItem)
{
	// Последний параграф с разрывом страницы не проверяем. Так делает Word.
	// Учитываем разрыв страницы/колонки, только если мы находимся в главной части документа, либо
	// во вложенной в нее SdtContent (вложение может быть многоуровневым)
	var oParent = this.Parent;
	while (oParent instanceof CDocumentContent && oParent.IsBlockLevelSdtContent())
		oParent = oParent.GetParent().GetParent();

	if (oParent instanceof CDocument && !this.GetNextParagraph())
		return true;

	var oChecker = new CParagraphCheckSplitPageOnPageBreak(oPageBreakItem, this.GetLogicDocument());
	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		if (this.Content[nPos].CheckSplitPageOnPageBreak(oChecker))
			return true;
	}

	return false;
};
/**
 * Пересчитываем заданную позицию элемента или текущую позицию курсора.
 */
Paragraph.prototype.Internal_Recalculate_CurPos = function(Pos, UpdateCurPos, UpdateTarget, ReturnTarget)
{
	var Transform = this.Get_ParentTextTransform();

	if (!this.IsRecalculated() || this.Lines.length <= 0)
	{
		return {
			X         : 0,
			Y         : 0,
			Height    : 0,
			PageNum   : 0,
			Internal  : {Line : 0, Page : 0, Range : 0},
			Transform : Transform
		};
	}

	var LinePos = this.GetCurrentParaPos();

	if (-1 === LinePos.Line || LinePos.Line >= this.Lines.length)
	{
		return {
			X         : 0,
			Y         : 0,
			Height    : 0,
			PageNum   : 0,
			Internal  : {Line : 0, Page : 0, Range : 0},
			Transform : Transform
		};
	}

	var CurLine  = LinePos.Line;
	var CurRange = LinePos.Range;
	var CurPage  = LinePos.Page;

	// Если в текущей позиции явно указана строка
	if (-1 != this.CurPos.Line)
	{
		CurLine  = this.CurPos.Line;
		CurRange = this.CurPos.Range;
	}

	if (this.Lines[CurLine].Ranges.length <= 0)
	{
		return {
			X         : 0,
			Y         : 0,
			Height    : 0,
			PageNum   : 0,
			Internal  : {Line : 0, Page : 0, Range : 0},
			Transform : Transform
		};
	}

	var X = this.Lines[CurLine].Ranges[CurRange].XVisible;
	var Y = this.Pages[CurPage].Y + this.Lines[CurLine].Y;

	var StartPos = this.Lines[CurLine].Ranges[CurRange].StartPos;
	var EndPos   = this.Lines[CurLine].Ranges[CurRange].EndPos;

	if (true === this.Numbering.Check_Range(CurRange, CurLine))
		X += this.Numbering.WidthVisible;

	for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
	{
		var Item = this.Content[CurPos];
		var Res  = Item.Recalculate_CurPos(X, Y, (CurPos === this.CurPos.ContentPos ? true : false), CurRange, CurLine, CurPage, UpdateCurPos, UpdateTarget, ReturnTarget);

		if (CurPos === this.CurPos.ContentPos)
		{
			Res.Transform = Transform;
			return Res;
		}
		else
		{
			X = Res.X;
		}
	}

	return {
		X         : X,
		Y         : Y,
		PageNum   : this.Get_AbsolutePage(CurPage),
		Internal  : {Line : CurLine, Page : CurPage, Range : CurRange},
		Transform : Transform
	};
};
/**
 * Проверяем не пустые ли границы
 */
Paragraph.prototype.Internal_Is_NullBorders = function(Borders)
{
	if (border_None != Borders.Top.Value || border_None != Borders.Bottom.Value ||
		border_None != Borders.Left.Value || border_None != Borders.Right.Value ||
		border_None != Borders.Between.Value)
		return false;

	return true;
};
Paragraph.prototype.Internal_Check_Ranges = function(CurLine, CurRange)
{
	var Ranges      = this.Lines[CurLine].Ranges;
	var RangesCount = Ranges.length;

	if (RangesCount <= 1)
		return true;
	else if (2 === RangesCount)
	{
		var Range0 = Ranges[0];
		var Range1 = Ranges[1];

		if (Range0.XEnd - Range0.X < 0.001 && 1 === CurRange && Range1.XEnd - Range1.X >= 0.001)
			return true;
		else if (Range1.XEnd - Range1.X < 0.001 && 0 === CurRange && Range0.XEnd - Range0.X >= 0.001)
			return true;
		else
			return false
	}
	else if (3 === RangesCount && 1 === CurRange)
	{
		var Range0 = Ranges[0];
		var Range2 = Ranges[2];

		if (Range0.XEnd - Range0.X < 0.001 && Range2.XEnd - Range2.X < 0.001)
			return true;
		else
			return false;
	}
	else
		return false;
};
/**
 * Получаем текущие текстовые настройки нумерации
 * @returns {CTextPr}
 */
Paragraph.prototype.GetNumberingTextPr = function()
{
	var oNumPr = this.GetNumPr();
	if (!oNumPr)
		return new CTextPr();

	var oNumbering = this.Parent.GetNumbering();
	var oNum       = oNumbering.GetNum(oNumPr.NumId);
	if (!oNum)
		return new CTextPr();

	var oLvl = oNum.GetLvl(oNumPr.Lvl);

	var oNumTextPr = this.Get_CompiledPr2(false).TextPr.Copy();
	oNumTextPr.Merge(this.TextPr.Value);
	oNumTextPr.Merge(oLvl.GetTextPr());

	oNumTextPr.FontFamily.Name = oNumTextPr.RFonts.Ascii.Name;

	return oNumTextPr;
};
/**
 * Получаем рассчитанное значение нумерации для данного параграфа
 * @returns {string}
 */
Paragraph.prototype.GetNumberingText = function(bWithoutLvlText)
{
	var oParent = this.GetParent();
	var oNumPr  = this.GetNumPr();
	if (!oNumPr || !oParent)
		return "";

	var oNumbering = oParent.GetNumbering();
	var oNumInfo   = oParent.CalculateNumberingValues(this, oNumPr);
	return oNumbering.GetText(oNumPr.NumId, oNumPr.Lvl, oNumInfo, bWithoutLvlText);
};
/**
 * Есть ли у параграфа нумерованная нумерация
 * @returns {boolean}
 */
Paragraph.prototype.IsNumberedNumbering = function()
{
	var oNumPr = this.GetNumPr();
	if (!oNumPr)
		return false;

	var oNumbering = this.Parent.GetNumbering();
	var oNum       = oNumbering.GetNum(oNumPr.NumId);
	if (!oNum)
		return false;

	var oLvl = oNum.GetLvl(oNumPr.Lvl);

	return oLvl.IsNumbered();
};
/**
 * Есть ли у параграфа маркированная нумерация
 * @returns {boolean}
 */
Paragraph.prototype.IsBulletedNumbering = function()
{
	var oNumPr = this.GetNumPr();
	if (!oNumPr)
		return false;

	var oNumbering = this.Parent.GetNumbering();
	var oNum       = oNumbering.GetNum(oNumPr.NumId);
	if (!oNum)
		return false;

	var oLvl = oNum.GetLvl(oNumPr.Lvl);

	return oLvl.IsBulleted();
};
/**
 * Пустой ли заданный отрезок
 * @param nCurLine {number}
 * @param nCurRange {number}
 * @returns {boolean}
 */
Paragraph.prototype.IsEmptyRange = function(nCurLine, nCurRange)
{
	var Line  = this.Lines[nCurLine];
	var Range = Line.Ranges[nCurRange];

	var StartPos = Range.StartPos;
	var EndPos   = Range.EndPos;

	for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
	{
		if (false === this.Content[CurPos].IsEmptyRange(nCurLine, nCurRange))
			return false;
	}

	return true;
};
Paragraph.prototype.Reset_RecalculateCache = function()
{

};
Paragraph.prototype.RecalculateCurPos = function(bUpdateX, bUpdateY)
{
	var oCurPosInfo = this.Internal_Recalculate_CurPos(this.CurPos.ContentPos, true, true, false);

	if (bUpdateX)
		this.CurPos.RealX = oCurPosInfo.X;

	if (bUpdateY)
		this.CurPos.RealY = oCurPosInfo.Y;

	return oCurPosInfo;
};
Paragraph.prototype.RecalculateMinMaxContentWidth = function(isRotated)
{
	var MinMax = new CParagraphMinMaxContentWidth();

	var Count = this.Content.length;
	for (var Pos = 0; Pos < Count; Pos++)
	{
		var Item = this.Content[Pos];

		Item.SetParagraph(this);
		Item.RecalculateMinMaxContentWidth(MinMax);
	}

	var ParaPr = this.Get_CompiledPr2(false).ParaPr;
	var MinInd = ParaPr.Ind.Left + ParaPr.Ind.Right + ParaPr.Ind.FirstLine;

	MinMax.nMinWidth += MinInd;
	MinMax.nMaxWidth += MinInd;

	if (true === isRotated)
	{
		ParaPr = this.Get_CompiledPr().ParaPr;

		// Последний пустой параграф не идет в учет
		if (null === this.Get_DocumentNext() && true === this.Is_Empty())
			return {Min : 0, Max : 0};


		var Min = MinMax.nMaxHeight + ParaPr.Spacing.Before + ParaPr.Spacing.After;
		return {Min : Min, Max : Min};
	}

	// добавляем 0.001, чтобы избавиться от погрешностей
	return {
		Min : ( MinMax.nMinWidth > 0 ? MinMax.nMinWidth + 0.001 : 0 ),
		Max : ( MinMax.nMaxWidth > 0 ? MinMax.nMaxWidth + 0.001 : 0 )
	};
};
Paragraph.prototype.Draw = function(CurPage, pGraphics)
{
	// Параграф начинается с новой страницы
	if (this.Pages[CurPage].EndLine < 0)
		return;

	if (pGraphics.Start_Command)
	{
		pGraphics.Start_Command(AscFormat.DRAW_COMMAND_PARAGRAPH);
	}

	var Pr = this.Get_CompiledPr();

	// Задаем обрезку, если данный параграф является рамкой
	if (true !== this.Is_Inline())
	{
		var FramePr = this.Get_FramePr();
		if (undefined != FramePr && this.Parent instanceof CDocument)
		{
			var PixelError = editor.WordControl.m_oLogicDocument.DrawingDocument.GetMMPerDot(1);
			var BoundsL    = this.CalculatedFrame.L2 - PixelError;
			var BoundsT    = this.CalculatedFrame.T2 - PixelError;
			var BoundsH    = this.CalculatedFrame.H2 + 2 * PixelError;
			var BoundsW    = this.CalculatedFrame.W2 + 2 * PixelError;

			pGraphics.SaveGrState();
			pGraphics.AddClipRect(BoundsL, BoundsT, BoundsW, BoundsH);
		}
	}

	// Выясним какая заливка у нашего текста

	var Theme    = this.Get_Theme();
	var ColorMap = this.Get_ColorMap();
	var BgColor  = undefined;
	if (undefined !== Pr.ParaPr.Shd && Asc.c_oAscShdNil !== Pr.ParaPr.Shd.Value && true !== Pr.ParaPr.Shd.Color.Auto)
	{
		if (Pr.ParaPr.Shd.Unifill)
		{
			Pr.ParaPr.Shd.Unifill.check(this.Get_Theme(), this.Get_ColorMap());
			var RGBA = Pr.ParaPr.Shd.Unifill.getRGBAColor();
			BgColor  = new CDocumentColor(RGBA.R, RGBA.G, RGBA.B, false);
		}
		else
		{
			BgColor = Pr.ParaPr.Shd.Color;
		}
	}
	else
	{
		// Нам надо выяснить заливку у родительского класса (возможно мы находимся в ячейке таблицы с забивкой)
		BgColor = this.Parent.Get_TextBackGroundColor();
	}


	// 1 часть отрисовки :
	//    Рисуем слева от параграфа знак, если данный параграф зажат другим пользователем
	this.Internal_Draw_1(CurPage, pGraphics, Pr);

	// 2 часть отрисовки :
	//    Добавляем специальный символ слева от параграфа, для параграфов, у которых стоит хотя бы
	//    одна из настроек: не разрывать абзац(KeepLines), не отрывать от следующего(KeepNext),
	//    начать с новой страницы(PageBreakBefore)
	this.Internal_Draw_2(CurPage, pGraphics, Pr);

	// 3 часть отрисовки :
	//    Рисуем заливку параграфа и различные выделения текста (highlight, поиск, совместное редактирование).
	//    Кроме этого рисуем боковые линии обводки параграфа.
	this.Internal_Draw_3(CurPage, pGraphics, Pr);

	// 4 часть отрисовки :
	//    Рисуем сами элементы параграфа
	this.Internal_Draw_4(CurPage, pGraphics, Pr, BgColor, Theme, ColorMap);

	// 5 часть отрисовки :
	//    Рисуем различные подчеркивания и зачеркивания.
	this.Internal_Draw_5(CurPage, pGraphics, Pr, BgColor);

	// 6 часть отрисовки :
	//    Рисуем верхнюю, нижнюю и промежуточную границы
	this.Internal_Draw_6(CurPage, pGraphics, Pr);

	// Убираем обрезку
	if (undefined != FramePr && this.Parent instanceof CDocument)
	{
		pGraphics.RestoreGrState();
	}
	if (pGraphics.End_Command)
	{
		pGraphics.End_Command();
	}

};
Paragraph.prototype.Internal_Draw_1 = function(CurPage, pGraphics, Pr)
{
	if (this.bFromDocument && (pGraphics.RENDERER_PDF_FLAG !== true))
	{
		// Если данный параграф зажат другим пользователем, рисуем соответствующий знак
		if (AscCommon.locktype_None != this.Lock.Get_Type() && this.LogicDocument && !this.LogicDocument.IsViewModeInReview())
		{
			if (( CurPage > 0 || false === this.IsStartFromNewPage() || null === this.Get_DocumentPrev() ))
			{
				var X_min    = -1 + Math.min(this.Pages[CurPage].X, this.Pages[CurPage].X + Pr.ParaPr.Ind.Left, this.Pages[CurPage].X + Pr.ParaPr.Ind.Left + Pr.ParaPr.Ind.FirstLine);
				var Y_top    = this.Pages[CurPage].Bounds.Top;
				var Y_bottom = this.Pages[CurPage].Bounds.Bottom;

				if (true === editor.isCoMarksDraw || AscCommon.locktype_Mine != this.Lock.Get_Type())
					pGraphics.DrawLockParagraph(this.Lock.Get_Type(), X_min, Y_top, Y_bottom);
			}
		}

		// Если данный параграф был изменен другим пользователем, тогда рисуем знак
		var oColor = this.private_GetCollPrChange();
		if (false !== oColor)
		{
			if (( CurPage > 0 || false === this.IsStartFromNewPage() || null === this.Get_DocumentPrev() ))
			{
				var X_min    = -3 + Math.min(this.Pages[CurPage].X, this.Pages[CurPage].X + Pr.ParaPr.Ind.Left, this.Pages[CurPage].X + Pr.ParaPr.Ind.Left + Pr.ParaPr.Ind.FirstLine);
				var Y_top    = this.Pages[CurPage].Bounds.Top;
				var Y_bottom = this.Pages[CurPage].Bounds.Bottom;

				pGraphics.p_color(oColor.r, oColor.g, oColor.b, 255);
				pGraphics.drawVerLine(0, X_min, Y_top, Y_bottom, 0);
			}
		}

		// Если данный параграф был изменен в режиме рецензирования, тогда рисуем специальный знак
		if (true === this.Pr.HavePrChange())
		{
			if (( CurPage > 0 || false === this.IsStartFromNewPage() || null === this.Get_DocumentPrev() ))
			{
				var X_min    = -3 + Math.min(this.Pages[CurPage].X, this.Pages[CurPage].X + Pr.ParaPr.Ind.Left, this.Pages[CurPage].X + Pr.ParaPr.Ind.Left + Pr.ParaPr.Ind.FirstLine);
				var Y_top    = this.Pages[CurPage].Bounds.Top;
				var Y_bottom = this.Pages[CurPage].Bounds.Bottom;

				var ReviewColor = this.GetPrReviewColor();
				pGraphics.p_color(ReviewColor.r, ReviewColor.g, ReviewColor.b, 255);
				pGraphics.drawVerLine(0, X_min, Y_top, Y_bottom, 0);
			}
		}
	}
};
Paragraph.prototype.Internal_Draw_2 = function(CurPage, pGraphics, Pr)
{
	var isFirstPage = this.Check_FirstPage(CurPage);
	if (this.bFromDocument && !pGraphics.Start_Command && true === editor.ShowParaMarks && true === isFirstPage && ( true === Pr.ParaPr.KeepNext || true === Pr.ParaPr.KeepLines || true === Pr.ParaPr.PageBreakBefore ))
	{
		var SpecFont = {FontFamily : {Name : "Arial", Index : -1}, FontSize : 12, Italic : false, Bold : false};
		var SpecSym  = String.fromCharCode(0x25AA);
		pGraphics.SetFont(SpecFont);
		pGraphics.b_color1(0, 0, 0, 255);

		var CurLine  = this.Pages[CurPage].FirstLine;
		var CurRange = 0;
		var X        = this.Lines[CurLine].Ranges[CurRange].XVisible;
		var Y        = this.Pages[CurPage].Y + this.Lines[CurLine].Y;

		var SpecW = 2.5; // 2.5 mm
		var SpecX = Math.min(X, this.Pages[CurPage].X) - SpecW;

		pGraphics.FillText(SpecX, Y, SpecSym);
	}
};
Paragraph.prototype.Internal_Draw_3 = function(CurPage, pGraphics, Pr)
{
	var LogicDocument = this.LogicDocument;
	if (!LogicDocument)
		return;

	var bDrawBorders = this.Is_NeedDrawBorders();
	if (true === bDrawBorders && 0 === CurPage && true === this.private_IsEmptyPageWithBreak(CurPage))
		bDrawBorders = false;

	var PDSH = g_oPDSH;

	PDSH.ComplexFields.ResetPage(this, CurPage);

	var _Page = this.Pages[CurPage];

	var DocumentComments = LogicDocument.Comments;
	var Page_abs         = this.Get_AbsolutePage(CurPage);

	var DrawComm           = DocumentComments ? DocumentComments.Is_Use() : false;
	var DrawFind           = LogicDocument.SearchEngine.Selection;
	var DrawColl           = undefined !== pGraphics.RENDERER_PDF_FLAG;
	var DrawMMFields       = !!(this.LogicDocument && this.LogicDocument.Is_HighlightMailMergeFields && true === this.LogicDocument.Is_HighlightMailMergeFields());
	var DrawSolvedComments = DocumentComments ? DocumentComments.IsUseSolved() : false;
	var SdtHighlightColor  = this.LogicDocument.GetSdtGlobalShowHighlight && this.LogicDocument.GetSdtGlobalShowHighlight() && undefined === pGraphics.RENDERER_PDF_FLAG ? this.LogicDocument.GetSdtGlobalColor() : null;

	PDSH.Reset(this, pGraphics, DrawColl, DrawFind, DrawComm, DrawMMFields, this.GetEndInfoByPage(CurPage - 1), DrawSolvedComments);

	var StartLine = _Page.StartLine;
	var EndLine   = _Page.EndLine;

	for (var CurLine = StartLine; CurLine <= EndLine; CurLine++)
	{
		var _Line        = this.Lines[CurLine];
		var _LineMetrics = _Line.Metrics;
		var EndLinePos   = _Line.EndPos;

		var Y0 = (_Page.Y + _Line.Y - _LineMetrics.Ascent);
		var Y1 = (_Page.Y + _Line.Y + _LineMetrics.Descent);
		if (_LineMetrics.LineGap < 0)
			Y1 += _LineMetrics.LineGap;

		var RangesCount = _Line.Ranges.length;
		for (var CurRange = 0; CurRange < RangesCount; CurRange++)
		{
			var _Range   = _Line.Ranges[CurRange];
			var X        = _Range.XVisible;
			var StartPos = _Range.StartPos;
			var EndPos   = _Range.EndPos;

			// Сначала проанализируем данную строку: в массивы aHigh, aColl, aFind
			// сохраним позиции начала и конца продолжительных одинаковых настроек
			// выделения, совместного редактирования и поиска соответственно.

			PDSH.Reset_Range(CurPage, CurLine, CurRange, X, Y0, Y1, _Range.Spaces);

			if (true === this.Numbering.Check_Range(CurRange, CurLine))
			{
				var NumberingType = this.Numbering.Type;
				var NumberingItem = this.Numbering;

				if (para_Numbering === NumberingType)
				{
					var NumPr = Pr.ParaPr.NumPr;
					if (undefined === NumPr || undefined === NumPr.NumId || 0 === NumPr.NumId || "0" === NumPr.NumId)
					{
						// Ничего не делаем
					}
					else
					{
						var oNumbering = this.Parent.GetNumbering();
						var oNumLvl    = oNumbering.GetNum(NumPr.NumId).GetLvl(NumPr.Lvl);
						var nNumJc     = oNumLvl.GetJc();
						var oNumTextPr = this.Get_CompiledPr2(false).TextPr.Copy();
						oNumTextPr.Merge(this.TextPr.Value);
						oNumTextPr.Merge(oNumLvl.GetTextPr());

						var X_start = X;

						if (align_Right === nNumJc)
							X_start = X - NumberingItem.WidthNum;
						else if (align_Center === nNumJc)
							X_start = X - NumberingItem.WidthNum / 2;

						// Если есть выделение текста, рисуем его сначала
						if (highlight_None != oNumTextPr.HighLight)
							PDSH.High.Add(Y0, Y1, X_start, X_start + NumberingItem.WidthNum + NumberingItem.WidthSuff, 0, oNumTextPr.HighLight.r, oNumTextPr.HighLight.g, oNumTextPr.HighLight.b, undefined, oNumTextPr);
					}
				}

				PDSH.X += this.Numbering.WidthVisible;
			}

			for (var Pos = StartPos; Pos <= EndPos; Pos++)
			{
				var Item = this.Content[Pos];
				Item.Draw_HighLights(PDSH);
			}

			//----------------------------------------------------------------------------------------------------------
			// Заливка параграфа
			//----------------------------------------------------------------------------------------------------------
			if ((_Range.W > 0.001 || true === this.IsEmpty() || true !== this.IsEmptyRange(CurLine, CurRange) ) && ( ( this.Pages.length - 1 === CurPage ) || ( CurLine < this.Pages[CurPage + 1].FirstLine ) ) && Asc.c_oAscShdClear === Pr.ParaPr.Shd.Value && (Pr.ParaPr.Shd.Unifill || (Pr.ParaPr.Shd.Color && true !== Pr.ParaPr.Shd.Color.Auto)))
			{
				if (pGraphics.Start_Command)
				{
					pGraphics.Start_Command(AscFormat.DRAW_COMMAND_LINE, this.Lines[CurLine], CurLine, 4)
				}

				var TempX0 = this.Lines[CurLine].Ranges[CurRange].X;
				if (0 === CurRange)
					TempX0 = Math.min(TempX0, this.Pages[CurPage].X + Pr.ParaPr.Ind.Left, this.Pages[CurPage].X + Pr.ParaPr.Ind.Left + Pr.ParaPr.Ind.FirstLine);

				var TempX1 = this.Lines[CurLine].Ranges[CurRange].XEnd;

				var TempTop    = this.Lines[CurLine].Top;
				var TempBottom = this.Lines[CurLine].Bottom;

				if (0 === CurLine)
				{
					// Закрашиваем фон до параграфа, только если данный параграф не является первым
					// на странице, предыдущий параграф тоже имеет не пустой фон и у текущего и предыдущего
					// параграфов совпадают правая и левая границы фонов.

					var PrevEl = this.Get_DocumentPrev();
					var PrevPr = null;

					var PrevLeft  = 0;
					var PrevRight = 0;
					var CurLeft   = Math.min(Pr.ParaPr.Ind.Left, Pr.ParaPr.Ind.Left + Pr.ParaPr.Ind.FirstLine);
					var CurRight  = Pr.ParaPr.Ind.Right;
					if (null != PrevEl && type_Paragraph === PrevEl.GetType())
					{
						PrevPr    = PrevEl.Get_CompiledPr2();
						PrevLeft  = Math.min(PrevPr.ParaPr.Ind.Left, PrevPr.ParaPr.Ind.Left + PrevPr.ParaPr.Ind.FirstLine);
						PrevRight = PrevPr.ParaPr.Ind.Right;
					}

					// Если данный параграф находится в группе параграфов с одинаковыми границами(с хотябы одной
					// непустой), и он не первый, тогда закрашиваем вместе с расстоянием до параграфа
					if (true === Pr.ParaPr.Brd.First)
					{
						// Если следующий элемент таблица, тогда PrevPr = null
						if (null === PrevEl || true === this.IsStartFromNewPage() || null === PrevPr || Asc.c_oAscShdNil === PrevPr.ParaPr.Shd.Value || PrevLeft != CurLeft || CurRight != PrevRight || false === this.Internal_Is_NullBorders(PrevPr.ParaPr.Brd) || false === this.Internal_Is_NullBorders(Pr.ParaPr.Brd))
						{
							if (false === this.IsStartFromNewPage() || null === PrevEl)
								TempTop += Pr.ParaPr.Spacing.Before;
						}
					}
				}

				if (this.Lines.length - 1 === CurLine)
				{
					// Закрашиваем фон после параграфа, только если данный параграф не является последним,
					// на странице, следующий параграф тоже имеет не пустой фон и у текущего и следующего
					// параграфов совпадают правая и левая границы фонов.

					var NextEl = this.Get_DocumentNext();
					var NextPr = null;

					var NextLeft  = 0;
					var NextRight = 0;
					var CurLeft   = Math.min(Pr.ParaPr.Ind.Left, Pr.ParaPr.Ind.Left + Pr.ParaPr.Ind.FirstLine);
					var CurRight  = Pr.ParaPr.Ind.Right;
					if (null != NextEl && type_Paragraph === NextEl.GetType())
					{
						NextPr    = NextEl.Get_CompiledPr2();
						NextLeft  = Math.min(NextPr.ParaPr.Ind.Left, NextPr.ParaPr.Ind.Left + NextPr.ParaPr.Ind.FirstLine);
						NextRight = NextPr.ParaPr.Ind.Right;
					}

					if (null != NextEl && type_Paragraph === NextEl.GetType() && true === NextEl.IsStartFromNewPage())
					{
						TempBottom = this.Lines[CurLine].Y + this.Lines[CurLine].Metrics.Descent + this.Lines[CurLine].Metrics.LineGap;
					}
					// Если данный параграф находится в группе параграфов с одинаковыми границами(с хотябы одной
					// непустой), и он не последний, тогда закрашиваем вместе с расстоянием после параграфа
					else if (true === Pr.ParaPr.Brd.Last)
					{
						// Если следующий элемент таблица, тогда NextPr = null
						if (null === NextEl || true === NextEl.IsStartFromNewPage() || null === NextPr || Asc.c_oAscShdNil === NextPr.ParaPr.Shd.Value || NextLeft != CurLeft || CurRight != NextRight || false === this.Internal_Is_NullBorders(NextPr.ParaPr.Brd) || false === this.Internal_Is_NullBorders(Pr.ParaPr.Brd))
							TempBottom -= Pr.ParaPr.Spacing.After;
					}
				}

				if (0 === CurRange)
				{
					if (Pr.ParaPr.Brd.Left.Value === border_Single)
						TempX0 -= 0.5 + Pr.ParaPr.Brd.Left.Size + Pr.ParaPr.Brd.Left.Space;
					else
						TempX0 -= 0.5;
				}

				if (this.Lines[CurLine].Ranges.length - 1 === CurRange)
				{
					TempX1 = this.Pages[CurPage].XLimit - Pr.ParaPr.Ind.Right;

					if (Pr.ParaPr.Brd.Right.Value === border_Single)
						TempX1 += 0.5 + Pr.ParaPr.Brd.Right.Size + Pr.ParaPr.Brd.Right.Space;
					else
						TempX1 += 0.5;
				}

				if (Pr.ParaPr.Shd.Unifill)
				{
					Pr.ParaPr.Shd.Unifill.check(this.Get_Theme(), this.Get_ColorMap());
					var RGBA = Pr.ParaPr.Shd.Unifill.getRGBAColor();
					pGraphics.b_color1(RGBA.R, RGBA.G, RGBA.B, 255);
				}
				else
				{
					pGraphics.b_color1(Pr.ParaPr.Shd.Color.r, Pr.ParaPr.Shd.Color.g, Pr.ParaPr.Shd.Color.b, 255);
				}
				if (pGraphics.SetShd)
				{
					pGraphics.SetShd(Pr.ParaPr.Shd);
				}
				pGraphics.rect(TempX0, this.Pages[CurPage].Y + TempTop, TempX1 - TempX0, TempBottom - TempTop);
				pGraphics.df();

				if (pGraphics.End_Command)
				{
					pGraphics.End_Command()
				}
			}

			//----------------------------------------------------------------------------------------------------------
			// Рисуем подсветку InlineSdt
			//----------------------------------------------------------------------------------------------------------
			if (SdtHighlightColor)
			{
				pGraphics.b_color1(SdtHighlightColor.r, SdtHighlightColor.g, SdtHighlightColor.b, 255);
				var oSdtBounds;
				for (var nSdtIndex = 0, nSdtCount = PDSH.InlineSdt.length; nSdtIndex < nSdtCount; ++nSdtIndex)
				{
					oSdtBounds = PDSH.InlineSdt[nSdtIndex].GetRangeBounds(CurLine, CurRange);
					if (oSdtBounds)
					{
						pGraphics.rect(oSdtBounds.X, oSdtBounds.Y, oSdtBounds.W, oSdtBounds.H);
						pGraphics.df();
					}
				}
			}
			//----------------------------------------------------------------------------------------------------------
			// Рисуем заливку текста
			//----------------------------------------------------------------------------------------------------------

			if (pGraphics.Start_Command)
			{
				pGraphics.Start_Command(AscFormat.DRAW_COMMAND_LINE, this.Lines[CurLine], CurLine, 2);
			}
			var aShd    = PDSH.Shd;
			var Element = aShd.Get_Next();
			while (null != Element)
			{
				pGraphics.b_color1(Element.r, Element.g, Element.b, 255);
				if (pGraphics.SetShd)
				{
					pGraphics.SetShd(Element.Additional2);
				}
				pGraphics.rect(Element.x0, Element.y0, Element.x1 - Element.x0, Element.y1 - Element.y0);
				pGraphics.df();
				Element = aShd.Get_Next();
			}

			//----------------------------------------------------------------------------------------------------------
			// Рисуем выделение текста
			//----------------------------------------------------------------------------------------------------------
			var aMMFields = PDSH.MMFields;
			var Element   = (pGraphics.RENDERER_PDF_FLAG === true ? null : aMMFields.Get_Next());
			while (null != Element)
			{
				pGraphics.drawMailMergeField(Element.x0, Element.y0, Element.x1 - Element.x0, Element.y1 - Element.y0, Element);
				Element = aMMFields.Get_Next();
			}

			//----------------------------------------------------------------------------------------------------------
			// Заливка сложных полей
			//----------------------------------------------------------------------------------------------------------
			var aCFields = PDSH.CFields;
			var Element   = (pGraphics.RENDERER_PDF_FLAG === true ? null : aCFields.Get_Next());
			while (null != Element)
			{
				pGraphics.drawMailMergeField(Element.x0, Element.y0, Element.x1 - Element.x0, Element.y1 - Element.y0, Element);
				Element = aCFields.Get_Next();
			}

			//----------------------------------------------------------------------------------------------------------
			// Рисуем выделение текста
			//----------------------------------------------------------------------------------------------------------
			var aHigh   = PDSH.High;
			var Element = aHigh.Get_Next();
			while (null != Element)
			{
				if (!pGraphics.set_fillColor)
				{
					pGraphics.b_color1(Element.r, Element.g, Element.b, 255);
				}
				else
				{
					pGraphics.set_fillColor(Element.r, Element.g, Element.b);
				}
				pGraphics.rect(Element.x0, Element.y0, Element.x1 - Element.x0, Element.y1 - Element.y0, Element.Additional2);
				pGraphics.df();
				Element = aHigh.Get_Next();
			}

			//----------------------------------------------------------------------------------------------------------
			// Рисуем комментарии
			//----------------------------------------------------------------------------------------------------------
			var aComm                 = PDSH.Comm;
			Element                   = ( pGraphics.RENDERER_PDF_FLAG === true ? null : aComm.Get_Next() );
			var ParentInvertTransform = Element && this.Get_ParentTextInvertTransform();
			while (null != Element)
			{
				if (!pGraphics.DrawTextArtComment)
				{
					if (Element.Additional.Active === true)
						pGraphics.b_color1(240, 200, 120, 255);
					else
						pGraphics.b_color1(248, 231, 195, 255);

					pGraphics.rect(Element.x0, Element.y0, Element.x1 - Element.x0, Element.y1 - Element.y0);
					pGraphics.df();

					DocumentComments.Add_DrawingRect(Element.x0, Element.y0, Element.x1 - Element.x0, Element.y1 - Element.y0, Page_abs, Element.Additional.CommentId, ParentInvertTransform);
				}
				else
				{
					pGraphics.DrawTextArtComment(Element);
				}
				Element = aComm.Get_Next();
			}


			if (pGraphics.End_Command)
			{
				pGraphics.End_Command()
			}

			//----------------------------------------------------------------------------------------------------------
			// Рисуем выделение совместного редактирования
			//----------------------------------------------------------------------------------------------------------
			var aColl = PDSH.Coll;
			Element   = aColl.Get_Next();
			while (null != Element)
			{
				pGraphics.drawCollaborativeChanges(Element.x0, Element.y0, Element.x1 - Element.x0, Element.y1 - Element.y0, Element);
				Element = aColl.Get_Next();
			}

			//----------------------------------------------------------------------------------------------------------
			// Рисуем выделение поиска
			//----------------------------------------------------------------------------------------------------------
			var aFind = PDSH.Find;
			Element   = aFind.Get_Next();
			while (null != Element)
			{
				pGraphics.drawSearchResult(Element.x0, Element.y0, Element.x1 - Element.x0, Element.y1 - Element.y0);
				Element = aFind.Get_Next();
			}
		}


		if (pGraphics.Start_Command)
		{
			pGraphics.Start_Command(AscFormat.DRAW_COMMAND_LINE, this.Lines[CurLine], CurLine, 1)
		}
		//----------------------------------------------------------------------------------------------------------
		// Рисуем боковые линии границы параграфа
		//----------------------------------------------------------------------------------------------------------
		if (true === bDrawBorders && ( ( this.Pages.length - 1 === CurPage ) || ( CurLine < this.Pages[CurPage + 1].FirstLine ) ))
		{
			var TempX0 = Math.min(this.Lines[CurLine].Ranges[0].X, this.Pages[CurPage].X + Pr.ParaPr.Ind.Left, this.Pages[CurPage].X + Pr.ParaPr.Ind.Left + Pr.ParaPr.Ind.FirstLine);
			var TempX1 = this.Pages[CurPage].XLimit - Pr.ParaPr.Ind.Right;//this.Lines[CurLine].Ranges[this.Lines[CurLine].Ranges.length - 1].XEnd;

			if (true === this.Is_LineDropCap())
			{
				TempX1 = TempX0 + this.Get_LineDropCapWidth();
			}

			var TempTop    = this.Lines[CurLine].Top;
			var TempBottom = this.Lines[CurLine].Bottom;

			if (0 === CurLine)
			{
				if (Pr.ParaPr.Brd.Top.Value === border_Single || Asc.c_oAscShdClear === Pr.ParaPr.Shd.Value)
				{
					if ((true === Pr.ParaPr.Brd.First && this.private_CheckNeedBeforeSpacing(CurPage, this.Parent, this.GetAbsolutePage(CurPage), Pr.ParaPr)) ||
						(true !== Pr.ParaPr.Brd.First && ((0 === CurPage && null === this.Get_DocumentPrev()) || (1 === CurPage && true === this.IsStartFromNewPage()))))
						TempTop += Pr.ParaPr.Spacing.Before;
				}
			}

			if (this.Lines.length - 1 === CurLine)
			{
				var NextEl = this.Get_DocumentNext();
				if (null != NextEl && type_Paragraph === NextEl.GetType() && true === NextEl.IsStartFromNewPage())
					TempBottom = this.Lines[CurLine].Y + this.Lines[CurLine].Metrics.Descent + this.Lines[CurLine].Metrics.LineGap;
				else if ((true === Pr.ParaPr.Brd.Last || (null !== NextEl && (type_Table === NextEl.Get_Type() || true === NextEl.private_IsEmptyPageWithBreak(0)))) && ( Pr.ParaPr.Brd.Bottom.Value === border_Single || Asc.c_oAscShdClear === Pr.ParaPr.Shd.Value ))
					TempBottom -= Pr.ParaPr.Spacing.After;
			}


			if (Pr.ParaPr.Brd.Right.Value === border_Single)
			{
				var RGBA = Pr.ParaPr.Brd.Right.Get_Color(this);
				pGraphics.p_color(RGBA.r, RGBA.g, RGBA.b, 255);
				if (pGraphics.SetBorder)
				{
					pGraphics.SetBorder(Pr.ParaPr.Brd.Right);
				}
				pGraphics.drawVerLine(c_oAscLineDrawingRule.Right, TempX1 + 0.5 + Pr.ParaPr.Brd.Right.Size + Pr.ParaPr.Brd.Right.Space, this.Pages[CurPage].Y + TempTop, this.Pages[CurPage].Y + TempBottom, Pr.ParaPr.Brd.Right.Size);
			}

			if (Pr.ParaPr.Brd.Left.Value === border_Single)
			{
				var RGBA = Pr.ParaPr.Brd.Left.Get_Color(this);
				pGraphics.p_color(RGBA.r, RGBA.g, RGBA.b, 255);
				if (pGraphics.SetBorder)
				{
					pGraphics.SetBorder(Pr.ParaPr.Brd.Left);
				}
				pGraphics.drawVerLine(c_oAscLineDrawingRule.Left, TempX0 - 0.5 - Pr.ParaPr.Brd.Left.Size - Pr.ParaPr.Brd.Left.Space, this.Pages[CurPage].Y + TempTop, this.Pages[CurPage].Y + TempBottom, Pr.ParaPr.Brd.Left.Size);
			}
		}

		if (pGraphics.End_Command)
		{
			pGraphics.End_Command()
		}
	}
};
Paragraph.prototype.Internal_Draw_4 = function(CurPage, pGraphics, Pr, BgColor, Theme, ColorMap)
{
	var PDSE = this.m_oPDSE;
	PDSE.Reset(this, pGraphics, BgColor, Theme, ColorMap);
	PDSE.ComplexFields.ResetPage(this, CurPage);

	var StartLine = this.Pages[CurPage].StartLine;
	var EndLine   = this.Pages[CurPage].EndLine;

	for (var CurLine = StartLine; CurLine <= EndLine; CurLine++)
	{
		var Line        = this.Lines[CurLine];
		var RangesCount = Line.Ranges.length;
		if (pGraphics.Start_Command)
		{
			pGraphics.Start_Command(AscFormat.DRAW_COMMAND_LINE, Line, CurLine, 0);
		}

		for (var CurRange = 0; CurRange < RangesCount; CurRange++)
		{
			var Y = this.Pages[CurPage].Y + this.Lines[CurLine].Y;
			var X = this.Lines[CurLine].Ranges[CurRange].XVisible;

			var Range = Line.Ranges[CurRange];

			PDSE.Set_LineMetrics(Y, Y - Line.Metrics.Ascent, Y + Line.Metrics.Descent);
			PDSE.Reset_Range(CurPage, CurLine, CurRange, X, Y);

			var StartPos = Range.StartPos;
			var EndPos   = Range.EndPos;

			// Отрисовка нумерации
			if (true === this.Numbering.Check_Range(CurRange, CurLine))
			{
				var nReviewType  = this.GetReviewType();
				var oReviewColor = this.GetReviewColor();

				var NumberingItem = this.Numbering;
				if (para_Numbering === NumberingItem.Type)
				{
					var isHavePrChange = this.HavePrChange();
					var oPrevNumPr     = this.GetPrChangeNumPr();

					var NumPr = Pr.ParaPr.NumPr;

					var isHaveNumbering = false;
					if ((undefined === this.Get_SectionPr()
						|| true !== this.IsEmpty())
						&& ((NumPr
						&& undefined !== NumPr.NumId
						&& 0 !== NumPr.NumId
						&& "0" !== NumPr.NumId)
						|| (oPrevNumPr
						&& undefined !== oPrevNumPr.NumId
						&& undefined !== oPrevNumPr.Lvl
						&& 0 !== oPrevNumPr.NumId
						&& "0" !== oPrevNumPr.NumId)))
					{
						isHaveNumbering = true;
					}

					if (!isHaveNumbering || (!NumPr && !oPrevNumPr))
					{
						// Ничего не делаем
					}
					else
					{
						var oNumbering = this.Parent.GetNumbering();

						var oNumLvl = null;
						if (NumPr)
							oNumLvl = oNumbering.GetNum(NumPr.NumId).GetLvl(NumPr.Lvl);
						else if (oPrevNumPr)
							oNumLvl = oNumbering.GetNum(oPrevNumPr.NumId).GetLvl(oPrevNumPr.Lvl);

						var nNumSuff   = oNumLvl.GetSuff();
						var nNumJc     = oNumLvl.GetJc();
						var oNumTextPr = this.Get_CompiledPr2(false).TextPr.Copy();

						// Word не рисует подчеркивание у символа списка, если оно пришло из настроек для
						// символа параграфа.

						var oTextPrTemp = this.TextPr.Value.Copy();
						oTextPrTemp.Underline = undefined;

						oNumTextPr.Merge(oTextPrTemp);
						oNumTextPr.Merge(oNumLvl.GetTextPr());

						var oPrevNumTextPr = oPrevNumPr ? this.Get_CompiledPr2(false).TextPr.Copy() : null;
						if (oPrevNumTextPr && (oPrevNumPr
							&& undefined !== oPrevNumPr.NumId
							&& undefined !== oPrevNumPr.Lvl
							&& 0 !== oPrevNumPr.NumId
							&& "0" !== oPrevNumPr.NumId))
						{
							var oPrevNumLvl = oNumbering.GetNum(oPrevNumPr.NumId).GetLvl(oPrevNumPr.Lvl);
							oPrevNumTextPr.Merge(oTextPrTemp);
							oPrevNumTextPr.Merge(oPrevNumLvl.GetTextPr());
						}

						var X_start = X;

						if (align_Right === nNumJc)
							X_start = X - NumberingItem.WidthNum;
						else if (align_Center === nNumJc)
							X_start = X - NumberingItem.WidthNum / 2;

						var AutoColor = ( undefined != BgColor && false === BgColor.Check_BlackAutoColor() ? new CDocumentColor(255, 255, 255, false) : new CDocumentColor(0, 0, 0, false) );

						var RGBA;
						if (oNumTextPr.Unifill)
						{
							oNumTextPr.Unifill.check(PDSE.Theme, PDSE.ColorMap);
							RGBA = oNumTextPr.Unifill.getRGBAColor();
							pGraphics.b_color1(RGBA.R, RGBA.G, RGBA.B, 255);
						}
						else
						{
							if (true === oNumTextPr.Color.Auto)
								pGraphics.b_color1(AutoColor.r, AutoColor.g, AutoColor.b, 255);
							else
								pGraphics.b_color1(oNumTextPr.Color.r, oNumTextPr.Color.g, oNumTextPr.Color.b, 255);
						}

						if (NumberingItem.HaveSourceNumbering() || reviewtype_Common !== nReviewType)
						{
							if (reviewtype_Common === nReviewType)
								pGraphics.b_color1(REVIEW_NUMBERING_COLOR.r, REVIEW_NUMBERING_COLOR.g, REVIEW_NUMBERING_COLOR.b, 255);
							else
								pGraphics.b_color1(oReviewColor.r, oReviewColor.g, oReviewColor.b, 255);
						}
						else if (isHavePrChange && NumPr && !oPrevNumPr)
						{
							var oPrReviewColor = this.GetPrReviewColor();
							pGraphics.b_color1(oPrReviewColor.r, oPrReviewColor.g, oPrReviewColor.b, 255);
						}

						// Рисуется только сам символ нумерации
						switch (nNumJc)
						{
							case align_Right:
								NumberingItem.Draw(X - NumberingItem.WidthNum, Y, pGraphics, oNumbering, oNumTextPr, PDSE.Theme, oPrevNumTextPr);
								break;

							case align_Center:
								NumberingItem.Draw(X - NumberingItem.WidthNum / 2, Y, pGraphics, oNumbering, oNumTextPr, PDSE.Theme, oPrevNumTextPr);
								break;

							case align_Left:
							default:
								NumberingItem.Draw(X, Y, pGraphics, oNumbering, oNumTextPr, PDSE.Theme, oPrevNumTextPr);
								break;
						}

						if (true === editor.ShowParaMarks && (Asc.c_oAscNumberingSuff.Tab === nNumSuff || oNumLvl.IsLegacy()))
						{
							var TempWidth     = NumberingItem.WidthSuff;
							var TempRealWidth = 3.143; // ширина символа "стрелка влево" в шрифте Wingding3,10

							var X1 = X;
							switch (nNumJc)
							{
								case align_Right:
									break;

								case align_Center:
									X1 += NumberingItem.WidthNum / 2;
									break;

								case align_Left:
								default:
									X1 += NumberingItem.WidthNum;
									break;
							}

							var X0 = TempWidth / 2 - TempRealWidth / 2;

							pGraphics.SetFont({
								FontFamily : {Name : "ASCW3", Index : -1},
								FontSize   : 10,
								Italic     : false,
								Bold       : false
							});

							if (X0 > 0)
								pGraphics.FillText2(X1 + X0, Y, String.fromCharCode(tab_Symbol), 0, TempWidth);
							else
								pGraphics.FillText2(X1, Y, String.fromCharCode(tab_Symbol), TempRealWidth - TempWidth, TempWidth);
						}

						if (true === oNumTextPr.Strikeout || true === oNumTextPr.Underline)
						{
							if (oNumTextPr.Unifill)
							{
								pGraphics.p_color(RGBA.R, RGBA.G, RGBA.B, 255);
							}
							else
							{
								if (true === oNumTextPr.Color.Auto)
									pGraphics.p_color(AutoColor.r, AutoColor.g, AutoColor.b, 255);
								else
									pGraphics.p_color(oNumTextPr.Color.r, oNumTextPr.Color.g, oNumTextPr.Color.b, 255);
							}
						}

						if (NumberingItem.HaveSourceNumbering() || reviewtype_Common !== nReviewType)
						{
							var nSourceWidth = NumberingItem.GetSourceWidth();

							if (reviewtype_Common === nReviewType)
								pGraphics.p_color(REVIEW_NUMBERING_COLOR.r, REVIEW_NUMBERING_COLOR.g, REVIEW_NUMBERING_COLOR.b, 255);
							else
								pGraphics.p_color(oReviewColor.r, oReviewColor.g, oReviewColor.b, 255);

							// Либо у нас есть удаленная часть, либо у нас одновременно добавлен и удален параграф, тогда мы зачеркиваем суффикс
							if (NumberingItem.HaveSourceNumbering() || (!NumberingItem.HaveSourceNumbering() && !NumberingItem.HaveFinalNumbering()))
							{
								if (NumberingItem.HaveFinalNumbering())
									pGraphics.drawHorLine(0, (Y - oNumTextPr.FontSize * g_dKoef_pt_to_mm * 0.27), X_start, X_start + nSourceWidth, (oNumTextPr.FontSize / 18) * g_dKoef_pt_to_mm);
								else
									pGraphics.drawHorLine(0, (Y - oNumTextPr.FontSize * g_dKoef_pt_to_mm * 0.27), X_start, X_start + nSourceWidth + NumberingItem.WidthSuff, (oNumTextPr.FontSize / 18) * g_dKoef_pt_to_mm);
							}

							if (NumberingItem.HaveFinalNumbering())
								pGraphics.drawHorLine(0, (Y + this.Lines[CurLine].Metrics.TextDescent * 0.4), X_start + nSourceWidth, X_start + NumberingItem.WidthNum + NumberingItem.WidthSuff, (oNumTextPr.FontSize / 18) * g_dKoef_pt_to_mm);
						}
						else if (isHavePrChange && NumPr && !oPrevNumPr)
						{
							var oPrReviewColor = this.GetPrReviewColor();
							pGraphics.p_color(oPrReviewColor.r, oPrReviewColor.g, oPrReviewColor.b, 255);
							pGraphics.drawHorLine(0, (Y + this.Lines[CurLine].Metrics.TextDescent * 0.4), X_start, X_start + NumberingItem.WidthNum + NumberingItem.WidthSuff, (oNumTextPr.FontSize / 18) * g_dKoef_pt_to_mm);
						}
						else
						{
							if (true === oNumTextPr.Strikeout)
								pGraphics.drawHorLine(0, (Y - oNumTextPr.FontSize * g_dKoef_pt_to_mm * 0.27), X_start, X_start + NumberingItem.WidthNum, (oNumTextPr.FontSize / 18) * g_dKoef_pt_to_mm);

							if (true === oNumTextPr.Underline)
								pGraphics.drawHorLine(0, (Y + this.Lines[CurLine].Metrics.TextDescent * 0.4), X_start, X_start + NumberingItem.WidthNum, (oNumTextPr.FontSize / 18) * g_dKoef_pt_to_mm);
						}
					}
				}
				else if (para_PresentationNumbering === this.Numbering.Type)
				{
					if (true != this.IsEmpty())
					{
						if (Pr.ParaPr.Ind.FirstLine < 0)
							NumberingItem.Draw(X, Y, pGraphics, this.Get_FirstTextPr2(), PDSE);
						else
							NumberingItem.Draw(this.Pages[CurPage].X  + Pr.ParaPr.Ind.Left, Y, pGraphics, this.Get_FirstTextPr2(), PDSE);
					}
				}

				PDSE.X += NumberingItem.WidthVisible;
			}

			for (var Pos = StartPos; Pos <= EndPos; Pos++)
			{
				var Item = this.Content[Pos];
				PDSE.CurPos.Update(Pos, 0);

				Item.Draw_Elements(PDSE);
			}
		}

		if (pGraphics.End_Command)
		{
			pGraphics.End_Command();
		}
	}
};
Paragraph.prototype.Internal_Draw_5 = function(CurPage, pGraphics, Pr, BgColor)
{
	var PDSL = g_oPDSL;
	PDSL.Reset(this, pGraphics, BgColor);
	PDSL.ComplexFields.ResetPage(this, CurPage);

	var Page = this.Pages[CurPage];

	var StartLine = Page.StartLine;
	var EndLine   = Page.EndLine;

	var RunPrReview = null;

	var arrRunReviewAreasColors = [];
	var arrRunReviewAreas       = [];
	var arrRunReviewRects       = [];
	for (var CurLine = StartLine; CurLine <= EndLine; CurLine++)
	{
		var Line  = this.Lines[CurLine];
		var LineM = Line.Metrics;

		if (pGraphics.Start_Command)
		{
			pGraphics.Start_Command(AscFormat.DRAW_COMMAND_LINE, Line, CurLine, 3)
		}

		var Baseline        = Page.Y + Line.Y;
		var UnderlineOffset = LineM.TextDescent * 0.4;

		PDSL.Reset_Line(CurPage, CurLine, Baseline, UnderlineOffset);

		// Сначала проанализируем данную строку: в массивы aStrikeout, aDStrikeout, aUnderline
		// aSpelling сохраним позиции начала и конца продолжительных одинаковых настроек зачеркивания,
		// двойного зачеркивания, подчеркивания и подчеркивания орфографии.

		var RangesCount = Line.Ranges.length;
		for (var CurRange = 0; CurRange < RangesCount; CurRange++)
		{
			var Range = Line.Ranges[CurRange];
			var X     = Range.XVisible;

			PDSL.Reset_Range(CurRange, X, Range.Spaces);

			var StartPos = Range.StartPos;
			var EndPos   = Range.EndPos;

			// TODO: Нумерация подчеркивается и зачеркивается в Draw_Elements, неплохо бы сюда перенести
			if (true === this.Numbering.Check_Range(CurRange, CurLine))
				PDSL.X += this.Numbering.WidthVisible;

			for (var Pos = StartPos; Pos <= EndPos; Pos++)
			{
				PDSL.CurPos.Update(Pos, 0);
				PDSL.CurDepth = 1;

				var Item = this.Content[Pos];
				Item.Draw_Lines(PDSL);
			}
		}

		var aStrikeout  = PDSL.Strikeout;
		var aDStrikeout = PDSL.DStrikeout;
		var aUnderline  = PDSL.Underline;
		var aSpelling   = PDSL.Spelling;
		var aRunReview  = PDSL.RunReview;
		var aCollChange = PDSL.CollChange;
		var aDUnderline = PDSL.DUnderline;

		// Рисуем зачеркивание
		var Element = aStrikeout.Get_Next();
		while (null != Element)
		{
			pGraphics.p_color(Element.r, Element.g, Element.b, 255);
			if (pGraphics.SetAdditionalProps)
			{
				pGraphics.SetAdditionalProps(Element.Additional2);
			}
			pGraphics.drawHorLine(c_oAscLineDrawingRule.Top, Element.y0, Element.x0, Element.x1, Element.w);
			Element = aStrikeout.Get_Next();
		}

		// Рисуем двойное зачеркивание
		Element = aDStrikeout.Get_Next();
		while (null != Element)
		{
			pGraphics.p_color(Element.r, Element.g, Element.b, 255);
			if (pGraphics.SetAdditionalProps)
			{
				pGraphics.SetAdditionalProps(Element.Additional2);
			}
			pGraphics.drawHorLine2(c_oAscLineDrawingRule.Top, Element.y0, Element.x0, Element.x1, Element.w);

			Element = aDStrikeout.Get_Next();
		}

		// Рисуем подчеркивание
		aUnderline.Correct_w_ForUnderline();
		Element = aUnderline.Get_Next();
		while (null != Element)
		{
			pGraphics.p_color(Element.r, Element.g, Element.b, 255);
			if (pGraphics.SetAdditionalProps)
			{
				pGraphics.SetAdditionalProps(Element.Additional2);
			}
			pGraphics.drawHorLine(0, Element.y0, Element.x0, Element.x1, Element.w);
			Element = aUnderline.Get_Next();
		}

		Element = aDUnderline.Get_Next();
		while (null != Element)
		{
			pGraphics.p_color(Element.r, Element.g, Element.b, 255);
			if (pGraphics.SetAdditionalProps)
			{
				pGraphics.SetAdditionalProps(Element.Additional2);
			}
			pGraphics.drawHorLine2(c_oAscLineDrawingRule.Top, Element.y0, Element.x0, Element.x1, Element.w);

			Element = aDUnderline.Get_Next();
		}

		if (pGraphics.RENDERER_PDF_FLAG !== true)
		{
			// Рисуем красный рект вокруг измененных ранов
			var arrRunReviewRectsLine = [];
			Element                   = aRunReview.Get_NextForward();
			while (null !== Element)
			{
				if (null === RunPrReview || true !== RunPrReview.Is_Equal(Element.Additional.RunPr))
				{
					if (arrRunReviewRectsLine.length > 0 && arrRunReviewRects)
					{
						arrRunReviewRects.push(arrRunReviewRectsLine);
						arrRunReviewRectsLine = [];
					}
					RunPrReview       = Element.Additional.RunPr;
					arrRunReviewRects = [];
					arrRunReviewAreas.push(arrRunReviewRects);
					arrRunReviewAreasColors.push(new CDocumentColor(Element.r, Element.g, Element.b));
				}

				arrRunReviewRectsLine.push({
					X    : Element.x0,
					Y    : Page.Y + Line.Y - Line.Metrics.TextAscent,
					W    : Element.x1 - Element.x0,
					H    : Line.Metrics.TextDescent + Line.Metrics.TextAscent + Line.Metrics.LineGap,
					Page : 0
				});
				Element = aRunReview.Get_NextForward();
			}

			if (arrRunReviewRectsLine.length > 0)
				arrRunReviewRects.push(arrRunReviewRectsLine);

			if (this.bFromDocument)
			{
				// Рисуем рект вокруг измененных ранов (измененных другим пользователем)
				Element = aCollChange.Get_Next();
				while (null !== Element)
				{
					pGraphics.p_color(Element.r, Element.g, Element.b, 255);
					pGraphics.AddSmartRect(Element.x0, Page.Y + Line.Top, Element.x1 - Element.x0, Line.Bottom - Line.Top, 0);
					Element = aCollChange.Get_Next();
				}
			}
            // Рисуем подчеркивание орфографии
            if (editor && this.LogicDocument && true === this.LogicDocument.Spelling.Use && !(pGraphics.IsThumbnail === true || pGraphics.IsDemonstrationMode === true || AscCommon.IsShapeToImageConverter))
            {
                pGraphics.p_color(255, 0, 0, 255);
                var SpellingW = editor.WordControl.m_oDrawingDocument.GetMMPerDot(1);
                Element       = aSpelling.Get_Next();
                while (null != Element)
                {
                    pGraphics.DrawSpellingLine(Element.y0, Element.x0, Element.x1, SpellingW);
                    Element = aSpelling.Get_Next();
                }
            }
		}

		if (pGraphics.End_Command)
		{
			pGraphics.End_Command()
		}
	}

	if (pGraphics.DrawPolygon)
	{
		for (var ReviewAreaIndex = 0, ReviewAreasCount = arrRunReviewAreas.length; ReviewAreaIndex < ReviewAreasCount; ++ReviewAreaIndex)
		{
			var arrRunReviewRects = arrRunReviewAreas[ReviewAreaIndex];
			var oRunReviewColor   = arrRunReviewAreasColors[ReviewAreaIndex];
			var ReviewPolygon     = new CPolygon();
			ReviewPolygon.fill(arrRunReviewRects);
			var PolygonPaths = ReviewPolygon.GetPaths(0);
			pGraphics.p_color(oRunReviewColor.r, oRunReviewColor.g, oRunReviewColor.b, 255);
			for (var PolygonIndex = 0, PolygonsCount = PolygonPaths.length; PolygonIndex < PolygonsCount; ++PolygonIndex)
			{
				var Path = PolygonPaths[PolygonIndex];
				pGraphics.DrawPolygon(Path, 1, 0);
			}
		}
	}
};
Paragraph.prototype.Internal_Draw_6 = function(CurPage, pGraphics, Pr)
{
	if (true !== this.Is_NeedDrawBorders())
		return;

	var bEmpty  = this.IsEmpty();
	var X_left  = Math.min(this.Pages[CurPage].X + Pr.ParaPr.Ind.Left, this.Pages[CurPage].X + Pr.ParaPr.Ind.Left + Pr.ParaPr.Ind.FirstLine);
	var X_right = this.Pages[CurPage].XLimit - Pr.ParaPr.Ind.Right;

	if (true === this.Is_LineDropCap())
		X_right = X_left + this.Get_LineDropCapWidth();

	if (Pr.ParaPr.Brd.Left.Value === border_Single)
		X_left -= 0.5 + Pr.ParaPr.Brd.Left.Space;
	else
		X_left -= 0.5;

	if (Pr.ParaPr.Brd.Right.Value === border_Single)
		X_right += 0.5 + Pr.ParaPr.Brd.Right.Space;
	else
		X_right += 0.5;

	var LeftMW  = -( border_Single === Pr.ParaPr.Brd.Left.Value ? Pr.ParaPr.Brd.Left.Size : 0 );
	var RightMW = ( border_Single === Pr.ParaPr.Brd.Right.Value ? Pr.ParaPr.Brd.Right.Size : 0 );

	var RGBA;

	var bEmptyPagesWithBreakBefore = false;
	var bCurEmptyPageWithBreak     = false;
	var bEmptyPagesBefore          = true;
	var bEmptyPageCurrent          = true;

	for (var TempCurPage = 0; TempCurPage < CurPage; ++TempCurPage)
	{
		if (false === this.private_IsEmptyPageWithBreak(TempCurPage))
		{
			bEmptyPagesWithBreakBefore = false;
			break;
		}
		else
		{
			bEmptyPagesWithBreakBefore = true;
		}
	}
	bCurEmptyPageWithBreak = this.private_IsEmptyPageWithBreak(CurPage);

	for (var TempCurPage = 0; TempCurPage < CurPage; ++TempCurPage)
	{
		if (false === this.IsEmptyPage(TempCurPage))
		{
			bEmptyPagesBefore = false;
			break;
		}
	}
	bEmptyPageCurrent = this.IsEmptyPage(CurPage);

	var bDrawTop = false;
	if (border_Single === Pr.ParaPr.Brd.Top.Value
		&& ((true === Pr.ParaPr.Brd.First
		&& false === bCurEmptyPageWithBreak
		&& ((true === bEmptyPagesBefore
		&& true !== bEmptyPageCurrent)
		|| (true === bEmptyPagesWithBreakBefore
		&& false === bCurEmptyPageWithBreak)))
		|| (false === Pr.ParaPr.Brd.First
		&& true === bEmptyPagesWithBreakBefore
		&& false === bCurEmptyPageWithBreak)))
	{
		bDrawTop = true;
	}

	var bDrawBetween = false;
	if (border_Single === Pr.ParaPr.Brd.Between.Value
		&& false === bDrawTop
		&& false === bEmptyPageCurrent
		&& true === bEmptyPagesBefore
		&& false === Pr.ParaPr.Brd.First)
	{
		bDrawBetween = true;
	}

	if (bDrawTop)
	{
		var Y_top = this.Pages[CurPage].Y;

		if (this.private_CheckNeedBeforeSpacing(CurPage, this.Parent, this.GetAbsolutePage(CurPage), Pr.ParaPr))
			Y_top += Pr.ParaPr.Spacing.Before;

		RGBA = Pr.ParaPr.Brd.Top.Get_Color(this);
		pGraphics.p_color(RGBA.r, RGBA.g, RGBA.b, 255);

		if (pGraphics.SetBorder)
		{
			pGraphics.SetBorder(Pr.ParaPr.Brd.Top);
		}
		// Учтем разрывы из-за обтекания
		var StartLine = this.Pages[CurPage].StartLine;

		if (pGraphics.Start_Command)
		{
			pGraphics.Start_Command(AscFormat.DRAW_COMMAND_LINE, this.Lines[StartLine], StartLine, 1);
		}
		var RangesCount = this.Lines[StartLine].Ranges.length;
		for (var CurRange = 0; CurRange < RangesCount; CurRange++)
		{
			var X0 = ( 0 === CurRange ? X_left : this.Lines[StartLine].Ranges[CurRange].X );
			var X1 = ( RangesCount - 1 === CurRange ? X_right : this.Lines[StartLine].Ranges[CurRange].XEnd );

			if (false === this.IsEmptyRange(StartLine, CurRange) || ( true === bEmpty && 1 === RangesCount ))
				pGraphics.drawHorLineExt(c_oAscLineDrawingRule.Top, Y_top, X0, X1, Pr.ParaPr.Brd.Top.Size, LeftMW, RightMW);
		}

		if (pGraphics.End_Command)
		{
			pGraphics.End_Command();
		}
	}

	if (true === bDrawBetween)
	{
		RGBA = Pr.ParaPr.Brd.Between.Get_Color(this);
		pGraphics.p_color(RGBA.r, RGBA.g, RGBA.b, 255);
		if (pGraphics.SetBorder)
		{
			pGraphics.SetBorder(Pr.ParaPr.Brd.Between);
		}
		var Size = Pr.ParaPr.Brd.Between.Size;
		var Y    = this.Pages[CurPage].Y + Pr.ParaPr.Spacing.Before;

		// Учтем разрывы из-за обтекания
		var StartLine   = this.Pages[CurPage].StartLine;
		var RangesCount = this.Lines[StartLine].Ranges.length;
		if (pGraphics.Start_Command)
		{
			pGraphics.Start_Command(AscFormat.DRAW_COMMAND_LINE, this.Lines[StartLine], StartLine, 1);
		}
		for (var CurRange = 0; CurRange < RangesCount; CurRange++)
		{
			var X0 = ( 0 === CurRange ? X_left : this.Lines[StartLine].Ranges[CurRange].X );
			var X1 = ( RangesCount - 1 === CurRange ? X_right : this.Lines[StartLine].Ranges[CurRange].XEnd );

			if (false === this.IsEmptyRange(StartLine, CurRange) || ( true === bEmpty && 1 === RangesCount ))
				pGraphics.drawHorLineExt(c_oAscLineDrawingRule.Top, Y, X0, X1, Size, LeftMW, RightMW);
		}
		if (pGraphics.End_Command)
		{
			pGraphics.End_Command();
		}
	}

	var CurLine = this.Pages[CurPage].EndLine;
	var bEnd    = (this.Lines[CurLine].Info & paralineinfo_End ? true : false);

	var bDrawBottom = false;
	var NextEl      = this.Get_DocumentNext();
	if (border_Single === Pr.ParaPr.Brd.Bottom.Value
		&& true === bEnd
		&& (true === Pr.ParaPr.Brd.Last
		|| type_Table === NextEl.Get_Type()
		|| true === NextEl.private_IsEmptyPageWithBreak(0)))
	{
		bDrawBottom = true;
	}

	if (true === bDrawBottom)
	{
		var TempY        = this.Pages[CurPage].Y;
		var NextEl       = this.Get_DocumentNext();
		var DrawLineRule = c_oAscLineDrawingRule.Bottom;
		if (null != NextEl && type_Paragraph === NextEl.GetType() && true === NextEl.IsStartFromNewPage())
		{
			TempY        = this.Pages[CurPage].Y + this.Lines[CurLine].Y + this.Lines[CurLine].Metrics.Descent + this.Lines[CurLine].Metrics.LineGap;
			DrawLineRule = c_oAscLineDrawingRule.Top;
		}
		else
		{
			TempY        = this.Pages[CurPage].Y + this.Lines[CurLine].Bottom - Pr.ParaPr.Spacing.After;
			DrawLineRule = c_oAscLineDrawingRule.Bottom;
		}

		RGBA = Pr.ParaPr.Brd.Bottom.Get_Color(this);
		pGraphics.p_color(RGBA.r, RGBA.g, RGBA.b, 255);
		if (pGraphics.SetBorder)
		{
			pGraphics.SetBorder(Pr.ParaPr.Brd.Bottom);
		}
		// Учтем разрывы из-за обтекания
		var EndLine     = this.Pages[CurPage].EndLine;
		var RangesCount = this.Lines[EndLine].Ranges.length;
		if (pGraphics.Start_Command)
		{
			pGraphics.Start_Command(AscFormat.DRAW_COMMAND_LINE, this.Lines[EndLine], EndLine, 1);
		}
		for (var CurRange = 0; CurRange < RangesCount; CurRange++)
		{
			var X0 = ( 0 === CurRange ? X_left : this.Lines[EndLine].Ranges[CurRange].X );
			var X1 = ( RangesCount - 1 === CurRange ? X_right : this.Lines[EndLine].Ranges[CurRange].XEnd );

			if (false === this.IsEmptyRange(EndLine, CurRange) || ( true === bEmpty && 1 === RangesCount ))
				pGraphics.drawHorLineExt(DrawLineRule, TempY, X0, X1, Pr.ParaPr.Brd.Bottom.Size, LeftMW, RightMW);
		}
		if (pGraphics.End_Command)
		{
			pGraphics.End_Command();
		}
	}
};
/**
 * Проверяем является ли данная страница параграфа пустой страницей с разрывом колонки или страницы.
 */
Paragraph.prototype.private_IsEmptyPageWithBreak = function(CurPage)
{
	//if (true === this.IsEmptyPage(CurPage))
	//    return true;

	if (this.Pages[CurPage].EndLine !== this.Pages[CurPage].StartLine)
		return false;

	var Info = this.Lines[this.Pages[CurPage].EndLine].Info;
	if (Info & paralineinfo_Empty && Info & paralineinfo_BreakPage)
		return true;

	return false;
};
Paragraph.prototype.Is_NeedDrawBorders = function()
{
	if (true === this.IsEmpty() && undefined !== this.SectPr)
		return false;

	return true;
};
Paragraph.prototype.ReDraw = function()
{
	this.Parent.OnContentReDraw(this.Get_AbsolutePage(0), this.Get_AbsolutePage(this.Pages.length - 1));
};
Paragraph.prototype.Shift = function(PageIndex, Dx, Dy)
{
	if (0 === PageIndex)
	{
		this.X += Dx;
		this.Y += Dy;
		this.XLimit += Dx;
		this.YLimit += Dy;

		this.X_ColumnStart += Dx;
		this.X_ColumnEnd += Dx;
	}

	this.Pages[PageIndex].Shift(Dx, Dy);

	var StartLine = this.Pages[PageIndex].StartLine;
	var EndLine   = this.Pages[PageIndex].EndLine;

	for (var CurLine = StartLine; CurLine <= EndLine; CurLine++)
		this.Lines[CurLine].Shift(Dx, Dy);

	// Пробегаемся по всем картинкам на данной странице и обновляем координаты
	for (var CurLine = StartLine; CurLine <= EndLine; CurLine++)
	{
		var Line        = this.Lines[CurLine];
		var RangesCount = Line.Ranges.length;

		for (var CurRange = 0; CurRange < RangesCount; CurRange++)
		{
			var Range    = Line.Ranges[CurRange];
			var StartPos = Range.StartPos;
			var EndPos   = Range.EndPos;

			for (var Pos = StartPos; Pos <= EndPos; Pos++)
			{
				var Item = this.Content[Pos];
				Item.Shift_Range(Dx, Dy, CurLine, CurRange);
			}
		}
	}
};
/**
 * Удаляем элементы параграфа
 * @param nCount - количество удаляемых элементов, > 0 удаляем элементы после курсора, < 0 удаляем элементы до курсора
 * @param isRemoveWholeElement {boolean} true: удаляем элементы целиком, false - Удаляем содержимое элементов (если нужно содержимое заменяется PlaceHolder)
 * @param bRemoveOnlySelection
 * @param bOnAddText - удаление происходит на добавлении текста
 * @param isWord - удаление по словам (работает только при отсутсвии селекта)
 * @returns {boolean} Если возвращается false, то значит ничего нельзя удалить в заданном направлении
 */
Paragraph.prototype.Remove = function(nCount, isRemoveWholeElement, bRemoveOnlySelection, bOnAddText, isWord)
{
	var Direction = nCount;
	var Result    = true;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;

		if (StartPos > EndPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		// Сразу проверим последний элемент на попадание ParaEnd в селект
		if (EndPos === this.Content.length - 1 && true === this.Content[EndPos].Selection_CheckParaEnd())
		{
			Result = false;

			// Если в данном параграфе было окончание секции, тогда удаляем его
			this.Set_SectionPr(undefined);
		}

		if (StartPos === EndPos)
		{
			if (this.Content[StartPos].IsSolid())
			{
				this.RemoveFromContent(StartPos, 1);
				if (this.Content.length <= 1)
				{
					this.AddToContent(0, new ParaRun(this, false));
					this.CurPos.ContentPos = 0;
				}
				else if (StartPos > 0)
				{
					this.CurPos.ContentPos = StartPos - 1;
					this.Content[StartPos - 1].MoveCursorToEndPos();
				}
				else
				{
					this.CurPos.ContentPos = StartPos;
					this.Content[StartPos].MoveCursorToStartPos();
				}
				this.Correct_ContentPos2();
			}
			else
			{
				this.Content[StartPos].Remove(nCount, bOnAddText);

				var isRemoveOnDrag = this.LogicDocument ? this.LogicDocument.DragAndDropAction : false;

				// TODO: Как только избавимся от para_End переделать здесь
				// Последние 2 элемента не удаляем (один для para_End, второй для всего остального)
				if (StartPos < this.Content.length - 2 && true === this.Content[StartPos].Is_Empty() && true !== this.Content[StartPos].Is_CheckingNearestPos() && (!bOnAddText || isRemoveOnDrag))
				{
					if (this.Selection.StartPos === this.Selection.EndPos)
						this.Selection.Use = false;

					this.Internal_Content_Remove(StartPos);

					this.CurPos.ContentPos = StartPos;
					this.Content[StartPos].MoveCursorToStartPos();
					this.Correct_ContentPos2();
				}
			}
		}
		else
		{
			// Комментарии удаляем потом отдельно, чтобы не путались метки селекта
			var CommentsToDelete = {};
			for (var Pos = StartPos; Pos <= EndPos; Pos++)
			{
				var Item = this.Content[Pos];
				if (para_Comment === Item.Type)
					CommentsToDelete[Item.CommentId] = true;
			}

			this.DeleteCommentOnRemove = false;

			var isStartDeleted = false;
			var isEndDeleted   = false;

			if (this.Content[EndPos].IsSolid())
			{
				this.RemoveFromContent(EndPos, 1);
				isEndDeleted = true;

				if (this.Content.length <= 1)
				{
					this.AddToContent(0, new ParaRun(this, false));
					this.CurPos.ContentPos = 0;
				}
				else if (EndPos > 0)
				{
					this.CurPos.ContentPos = StartPos - 1;
					this.Content[EndPos - 1].MoveCursorToEndPos();
				}
				else
				{
					this.CurPos.ContentPos = EndPos;
					this.Content[EndPos].MoveCursorToStartPos();
				}
				this.Correct_ContentPos2();
			}
			else
			{
				this.Content[EndPos].Remove(nCount, bOnAddText);

				// TODO: Как только избавимся от para_End переделать здесь
				// Последние 2 элемента не удаляем (один для para_End, второй для всего остального)
				if (EndPos < this.Content.length - 2 && true === this.Content[EndPos].Is_Empty() && true !== this.Content[EndPos].Is_CheckingNearestPos())
				{
					this.RemoveFromContent(EndPos, 1);
					isEndDeleted = true;

					this.CurPos.ContentPos = EndPos;
					this.Content[EndPos].MoveCursorToStartPos();
				}
			}

			if (this.LogicDocument && true === this.LogicDocument.IsTrackRevisions())
			{
				for (var Pos = EndPos - 1; Pos >= StartPos + 1; Pos--)
				{
					if (para_Run === this.Content[Pos].Type)
					{
						if (para_Run == this.Content[Pos].Type && this.Content[Pos].CanDeleteInReviewMode())
							this.RemoveFromContent(Pos, 1);
						else
							this.Content[Pos].SetReviewType(reviewtype_Remove, true);
					}
					else
					{
						this.Content[Pos].Remove(nCount, bOnAddText);
						if (this.Content[Pos].IsEmpty())
							this.RemoveFromContent(Pos, 1);
					}
				}
			}
			else
			{
				this.RemoveFromContent(StartPos + 1, EndPos - StartPos - 1);
			}

			var isFootnoteRefRun = (para_Run === this.Content[StartPos].Type && this.Content[StartPos].IsFootnoteReferenceRun());


			if (this.Content[StartPos].IsSolid())
			{
				this.RemoveFromContent(StartPos, 1);
				isStartDeleted = true;

				if (this.Content.length <= 1)
				{
					this.AddToContent(0, new ParaRun(this, false));
					this.CurPos.ContentPos = 0;
				}
			}
			else
			{
				this.Content[StartPos].Remove(nCount, bOnAddText);

				// Мы не удаляем последний элемент с ParaEnd
				if (StartPos <= this.Content.length - 2 && true === this.Content[StartPos].Is_Empty() && true !== this.Content[StartPos].Is_CheckingNearestPos() && ((nCount > -1 && true !== bOnAddText) || para_Run !== this.Content[StartPos].Type))
				{
					this.RemoveFromContent(StartPos, 1);
					isStartDeleted = true;
				}
				else if (isFootnoteRefRun)
				{
					this.Content[StartPos].Set_RStyle(undefined);
				}
			}

			if (this.LogicDocument && true === this.LogicDocument.IsTrackRevisions())
			{
				var _StartPos = Math.max(0, StartPos);
				var _EndPos   = Math.min(this.Content.length - 1, EndPos);

				for (var Pos = _StartPos; Pos <= _EndPos; ++Pos)
				{
					this.Content[Pos].RemoveSelection();
				}

				this.CurPos.ContentPos = StartPos;
			}

			if (isStartDeleted && isEndDeleted)
				this.Selection.Use = false;

			if (nCount > -1 && true !== bOnAddText)
			{
				this.Correct_ContentPos2();
			}
			else
			{
				this.CurPos.ContentPos  = StartPos;
				this.Selection.StartPos = StartPos;
				this.Selection.EndPos   = StartPos;

				if (!this.Content[StartPos] || !this.Content[StartPos].IsCursorPlaceable())
					this.Correct_ContentPos2();
			}

			this.DeleteCommentOnRemove = true;

			if(this.LogicDocument)
			{
				for (var CommentId in CommentsToDelete)
				{
					this.LogicDocument.RemoveComment(CommentId, true, false);
				}
			}
		}

		if (true !== this.Content[this.CurPos.ContentPos].IsSelectionUse())
		{
			this.RemoveSelection();

			if (nCount > -1 && true !== bOnAddText)
				this.Correct_Content();
		}
		else
		{
			this.Selection.Use      = true;
			this.Selection.Start    = false;
			this.Selection.Flag     = selectionflag_Common;
			this.Selection.StartPos = this.CurPos.ContentPos;
			this.Selection.EndPos   = this.CurPos.ContentPos;

			if (nCount > -1 && true !== bOnAddText)
				this.Correct_Content();

			this.Document_SetThisElementCurrent(false);

			return true;
		}
	}
	else
	{
		if (isWord)
		{
			var oStartPos  = this.Get_ParaContentPos(false, false, false);
			var oSearchPos = new CParagraphSearchPos();

			if (nCount > 0)
				this.Get_WordEndPos(oSearchPos, oStartPos);
			else
				this.Get_WordStartPos(oSearchPos, oStartPos);

			if (oSearchPos.Found && 0 !== oSearchPos.Pos.Compare(oStartPos))
			{
				this.StartSelectionFromCurPos();
				this.SetSelectionContentPos(oStartPos, oSearchPos.Pos);
				this.Remove(1, false, false, false, false);
				this.RemoveSelection();
				return true;
			}
		}

		var ContentPos = this.CurPos.ContentPos;
		while (false === this.Content[ContentPos].Remove(Direction, bOnAddText))
		{
			if (Direction < 0)
				ContentPos--;
			else
				ContentPos++;

			if (ContentPos < 0 || ContentPos >= this.Content.length)
				break;

			if (Direction < 0)
				this.Content[ContentPos].MoveCursorToEndPos(false);
			else
				this.Content[ContentPos].MoveCursorToStartPos();
		}

		if (ContentPos < 0 || ContentPos >= this.Content.length)
			Result = false;
		else
		{
			if (true === this.Content[ContentPos].IsSelectionUse())
			{
				this.Selection.Use      = true;
				this.Selection.Start    = false;
				this.Selection.Flag     = selectionflag_Common;

				// TODO: Это плохой код, внутри классов должен выставляться селект целиком
				//       надо посмотреть для чего это было сделано

				//this.Selection.StartPos = ContentPos;
				//this.Selection.EndPos   = ContentPos;
				//this.Correct_Content(ContentPos, ContentPos);
				//this.Document_SetThisElementCurrent(false);
				return true;
			}

			// TODO: Как только избавимся от para_End переделать здесь
			// Последние 2 элемента не удаляем (один для para_End, второй для всего остального)
			if (ContentPos < this.Content.length - 2 && true === this.Content[ContentPos].Is_Empty())
			{
				this.Internal_Content_Remove(ContentPos);

				this.CurPos.ContentPos = ContentPos;
				this.Content[ContentPos].MoveCursorToStartPos();
				this.Correct_ContentPos2();
			}
			else
			{
				// TODO: В режиме рецензии элементы не удаляются, а позиция меняется прямо в ранах
				if (!this.LogicDocument || true !== this.LogicDocument.IsTrackRevisions())
					this.CurPos.ContentPos = ContentPos;
			}
		}

		this.Correct_Content(ContentPos, ContentPos);

		// Обработка удаления диакритических знаков
		if (Direction > 0 && true === Result)
		{
			var oElement = this.Get_RunElementByPos(this.Get_ParaContentPos(false));
			while (oElement && oElement.IsDiacriticalSymbol && oElement.IsDiacriticalSymbol())
			{
				if (false === this.Content[this.CurPos.ContentPos].Remove(Direction, bOnAddText))
				{
					this.CurPos.ContentPos++;

					// TODO:ParaEnd
					if (this.CurPos.ContentPos >= this.Content.length - 2)
						break;

					this.Content[this.CurPos.ContentPos].MoveCursorToStartPos();
				}

				oElement = this.Get_RunElementByPos(this.Get_ParaContentPos(false));
			}
		}

		if (Direction < 0 && false === Result)
		{
			// Мы стоим в начале параграфа и пытаемся удалить элемент влево. Действуем следующим образом:
			// 1. Если у нас параграф с нумерацией.
			//    1.1 Если нумерация нулевого уровня, тогда удаляем нумерацию, но при этом сохраняем
			//        значения отступов так как это делается в Word. (аналогично работаем с нумерацией в
			//        презентациях)
			//    1.2 Если нумерация не нулевого уровня, тогда уменьшаем уровень.
			// 2. Если у нас отступ первой строки ненулевой, тогда:
			//    2.1 Если он положительный делаем его нулевым.
			//    2.2 Если он отрицательный сдвигаем левый отступ на значение отступа первой строки,
			//        а сам отступ первой строки делаем нулевым.
			// 3. Если у нас ненулевой левый отступ, делаем его нулевым
			// 4. Если ничего из предыдущего не случается, тогда говорим родительскому классу, что удаление
			//    не было выполнено.

			Result = true;

			var Pr = this.Get_CompiledPr2(false).ParaPr;
			if (undefined != this.GetNumPr())
			{
				var NumPr = this.GetNumPr();

				if (0 === NumPr.Lvl)
				{
					this.RemoveNumPr();
					this.Set_Ind({FirstLine : 0, Left : Math.max(Pr.Ind.Left, Pr.Ind.Left + Pr.Ind.FirstLine)}, false);
				}
				else
				{
					this.IndDecNumberingLevel(false);
				}
			}
			else if (numbering_presentationnumfrmt_None != this.PresentationPr.Bullet.Get_Type())
			{
				this.Remove_PresentationNumbering();
			}
			else if(this.bFromDocument)
			{
             	if (align_Right === Pr.Jc)
                {
                    this.Set_Align(align_Center);
                }
                else if (align_Center === Pr.Jc)
                {
                    this.Set_Align(align_Left);
                }
                else if (Math.abs(Pr.Ind.FirstLine) > 0.001)
                {
                    if (Pr.Ind.FirstLine > 0)
                        this.Set_Ind({FirstLine : 0}, false);
                    else
                        this.Set_Ind({Left : Pr.Ind.Left + Pr.Ind.FirstLine, FirstLine : 0}, false);
                }
                else if (Math.abs(Pr.Ind.Left) > 0.001)
                {
                    this.Set_Ind({Left : 0}, false);
                }
                else
				{
                    Result = false;
				}
			}
			else
			{
                Result = false;
			}
		}
	}

	return Result;
};
Paragraph.prototype.Remove_ParaEnd = function()
{
	var ContentLen = this.Content.length;
	for (var CurPos = ContentLen - 1; CurPos >= 0; CurPos--)
	{
		var Element = this.Content[CurPos];

		// Предполагаем, что para_End лежит только в ране, который лежит только на самом верхнем уровне
		if (para_Run === Element.Type && true === Element.Remove_ParaEnd())
			return;
	}
};
/**
 * TODO: От этой функции надо избавиться
 * Ищем первый элемент, при промотке вперед
 */
Paragraph.prototype.Internal_FindForward = function(CurPos, arrId)
{
	var LetterPos = CurPos;
	var bFound    = false;
	var Type      = para_Unknown;

	if (CurPos < 0 || CurPos >= this.Content.length)
		return {Found : false};

	while (!bFound)
	{
		Type = this.Content[LetterPos].Type;

		for (var Id = 0; Id < arrId.length; Id++)
		{
			if (arrId[Id] == Type)
			{
				bFound = true;
				break;
			}
		}

		if (bFound)
			break;

		LetterPos++;
		if (LetterPos > this.Content.length - 1)
			break;
	}

	return {LetterPos : LetterPos, Found : bFound, Type : Type};
};
/**
 * TODO: От этой функции надо избавиться
 * Ищем первый элемент, при промотке назад
 *
 */
Paragraph.prototype.Internal_FindBackward = function(CurPos, arrId)
{
	var LetterPos = CurPos;
	var bFound    = false;
	var Type      = para_Unknown;

	if (CurPos < 0 || CurPos >= this.Content.length)
		return {Found : false};

	while (!bFound)
	{
		Type = this.Content[LetterPos].Type;
		for (var Id = 0; Id < arrId.length; Id++)
		{
			if (arrId[Id] == Type)
			{
				bFound = true;
				break;
			}
		}

		if (bFound)
			break;

		LetterPos--;
		if (LetterPos < 0)
			break;
	}

	return {LetterPos : LetterPos, Found : bFound, Type : Type};
};
Paragraph.prototype.Get_TextPr = function(_ContentPos)
{
	var ContentPos = ( undefined === _ContentPos ? this.Get_ParaContentPos(false, false) : _ContentPos );

	var CurPos = ContentPos.Get(0);

	return this.Content[CurPos].Get_TextPr(ContentPos, 1);
};
Paragraph.prototype.Internal_CalculateTextPr = function(LetterPos, StartPr)
{
	var Pr;
	if ("undefined" != typeof(StartPr))
	{
		Pr             = this.Get_CompiledPr();
		StartPr.ParaPr = Pr.ParaPr;
		StartPr.TextPr = Pr.TextPr;
	}
	else
	{
		Pr = this.Get_CompiledPr2(false);
	}

	// Выствляем начальные настройки текста у данного параграфа
	var TextPr = Pr.TextPr.Copy();

	// Ищем ближайший TextPr
	if (LetterPos < 0)
		return TextPr;

	// Ищем предыдущие записи с изменением текстовых свойств
	var Pos = this.Internal_FindBackward(LetterPos, [para_TextPr]);

	if (true === Pos.Found)
	{
		var CurTextPr = this.Content[Pos.LetterPos].Value;

		// Копируем настройки из символьного стиля
		if (undefined != CurTextPr.RStyle)
		{
			var Styles      = this.Parent.Get_Styles();
			var StyleTextPr = Styles.Get_Pr(CurTextPr.RStyle, styletype_Character).TextPr;
			TextPr.Merge(StyleTextPr);
		}

		// Копируем прямые настройки
		TextPr.Merge(CurTextPr);
	}

	TextPr.FontFamily.Name  = TextPr.RFonts.Ascii.Name;
	TextPr.FontFamily.Index = TextPr.RFonts.Ascii.Index;

	return TextPr;
};
Paragraph.prototype.Internal_GetLang = function(LetterPos)
{
	var Lang = this.Get_CompiledPr2(false).TextPr.Lang.Copy();

	// Ищем ближайший TextPr
	if (LetterPos < 0)
		return Lang;

	// Ищем предыдущие записи с изменением текстовых свойств
	var Pos = this.Internal_FindBackward(LetterPos, [para_TextPr]);

	if (true === Pos.Found)
	{
		var CurTextPr = this.Content[Pos.LetterPos].Value;

		// Копируем настройки из символьного стиля
		if (undefined != CurTextPr.RStyle)
		{
			var Styles      = this.Parent.Get_Styles();
			var StyleTextPr = Styles.Get_Pr(CurTextPr.RStyle, styletype_Character).TextPr;
			Lang.Merge(StyleTextPr.Lang);
		}

		// Копируем прямые настройки
		Lang.Merge(CurTextPr.Lang);
	}

	return Lang;
};
Paragraph.prototype.Internal_GetTextPr = function(LetterPos)
{
	var TextPr = new CTextPr();

	// Ищем ближайший TextPr
	if (LetterPos < 0)
		return TextPr;

	// Ищем предыдущие записи с изменением текстовых свойств
	var Pos = this.Internal_FindBackward(LetterPos, [para_TextPr]);

	if (true === Pos.Found)
	{
		var CurTextPr = this.Content[Pos.LetterPos].Value;
		TextPr.Merge(CurTextPr);
	}
	// Если ничего не нашли, то TextPr будет пустым, что тоже нормально

	return TextPr;
};
/**
 * Добавляем новый элемент к содержимому параграфа (на текущую позицию)
 */
Paragraph.prototype.Add = function(Item)
{
	// Выставляем родительский класс
	Item.Parent = this;

	if (Item.SetParagraph)
		Item.SetParagraph(this);

	switch (Item.Get_Type())
	{
		case para_Text:
		case para_Space:
		case para_PageNum:
		case para_Tab:
		case para_Drawing:
		case para_NewLine:
		case para_FootnoteReference:
		case para_FootnoteRef:
		case para_Separator:
		case para_ContinuationSeparator:
		default:
		{
			// Элементы данного типа добавляем во внутренний элемент
			this.Content[this.CurPos.ContentPos].Add(Item);

			break;
		}
		case para_TextPr:
		{
			var TextPr = Item.Value;

			if (undefined != TextPr.FontFamily)
			{
				var FName  = TextPr.FontFamily.Name;
				var FIndex = TextPr.FontFamily.Index;

				TextPr.RFonts          = new CRFonts();
				TextPr.RFonts.Ascii    = {Name : FName, Index : FIndex};
				TextPr.RFonts.EastAsia = {Name : FName, Index : FIndex};
				TextPr.RFonts.HAnsi    = {Name : FName, Index : FIndex};
				TextPr.RFonts.CS       = {Name : FName, Index : FIndex};
			}

			if (true === this.ApplyToAll)
			{
				// Применяем настройки ко всем элементам параграфа
				var ContentLen = this.Content.length;

				for (var CurPos = 0; CurPos < ContentLen; CurPos++)
				{
					this.Content[CurPos].Apply_TextPr(TextPr, undefined, true);
				}

				// Выставляем настройки для символа параграфа
				this.TextPr.Apply_TextPr(TextPr);
			}
			else
			{
				if (true === this.Selection.Use)
				{
					this.Apply_TextPr(TextPr);
				}
				else
				{
					var CurParaPos = this.Get_ParaContentPos(false, false);
					var CurPos     = CurParaPos.Get(0);

					// Сначала посмотрим на элемент слева и справа(текущий)
					var SearchLPos = new CParagraphSearchPos();
					this.Get_LeftPos(SearchLPos, CurParaPos);

					var RItem = this.Get_RunElementByPos(CurParaPos);
					var LItem = ( false === SearchLPos.Found ? null : this.Get_RunElementByPos(SearchLPos.Pos) );

					// 1. Если мы находимся в конце параграфа, тогда применяем заданную настройку к знаку параграфа
					//    и добавляем пустой ран с заданными настройками.
					// 2. Если мы находимся в середине слова (справа и слева текстовый элемент, причем оба не
					// пунктуация), тогда меняем настройки для данного слова. 3. Во всех остальных случаях вставляем
					// пустой ран с заданными настройкми и переносим курсор в этот ран, чтобы при последующем наборе
					// текст отрисовывался с нужными настройками.

					if (null === RItem || para_End === RItem.Type)
					{
						this.Apply_TextPr(TextPr);

						// Если параграф с нумерацией, тогда к символу конца параграфа не применяем стиль
						if (undefined === this.GetNumPr())
							this.TextPr.Apply_TextPr(TextPr);
					}
					else if (null !== RItem && null !== LItem && para_Text === RItem.Type && para_Text === LItem.Type && false === RItem.IsPunctuation() && false === LItem.IsPunctuation())
					{
						var SearchSPos = new CParagraphSearchPos();
						var SearchEPos = new CParagraphSearchPos();

						this.Get_WordStartPos(SearchSPos, CurParaPos);
						this.Get_WordEndPos(SearchEPos, CurParaPos);

						// Такого быть не должно, т.к. мы уже проверили, что справа и слева точно есть текст
						if (true !== SearchSPos.Found || true !== SearchEPos.Found)
							return;

						// Выставим временно селект от начала и до конца слова
						this.Selection.Use = true;
						this.Set_SelectionContentPos(SearchSPos.Pos, SearchEPos.Pos);

						this.Apply_TextPr(TextPr);

						// Убираем селект
						this.RemoveSelection();
					}
					else
					{
						this.Apply_TextPr(TextPr);
					}
				}
			}

			break;
		}
		case para_Math:
		{
			var ContentPos = this.Get_ParaContentPos(false, false);
			var CurPos     = ContentPos.Get(0);

			// Ран формула делит на части, а в остальные элементы формула добавляется целиком.
			if (para_Run === this.Content[CurPos].Type)
			{
				// Разделяем текущий элемент (возвращается правая часть)
				var NewElement = this.Content[CurPos].Split(ContentPos, 1);

				if (null !== NewElement)
					this.Internal_Content_Add(CurPos + 1, NewElement);

				var MathElement = new ParaMath();
				MathElement.Root.Load_FromMenu(Item.Menu, this, null, Item.GetText());
				MathElement.Root.Correct_Content(true);

				this.Internal_Content_Add(CurPos + 1, MathElement);

				// Перемещаем кусор в конец формулы
				this.CurPos.ContentPos = CurPos + 1;
				this.Content[this.CurPos.ContentPos].MoveCursorToEndPos(false);
			}
			else
			{
				this.Content[CurPos].Add(Item);
			}

			break;
		}
		case para_Field:
		case para_InlineLevelSdt:
		case para_Hyperlink:
		{
			var ContentPos = this.Get_ParaContentPos(false, false);
			var CurPos     = ContentPos.Get(0);

			// Формулу и ран поле делит на части, в остальные элементы добавляется целиком.
			if (para_Run === this.Content[CurPos].Type || para_Math === this.Content[CurPos].Type)
			{
				// Разделяем текущий элемент (возвращается правая часть)
				var NewElement = this.Content[CurPos].Split(ContentPos, 1);

				if (null !== NewElement)
					this.Internal_Content_Add(CurPos + 1, NewElement);

				this.Internal_Content_Add(CurPos + 1, Item);

				// Перемещаем в начало следующейго элемента
				this.CurPos.ContentPos = CurPos + 2;
				this.Content[this.CurPos.ContentPos].MoveCursorToStartPos(false);
			}
			else
			{
				this.Content[CurPos].Add(Item);
			}

			break;
		}
		case para_Run :
		{
			var ContentPos = this.Get_ParaContentPos(false, false);
			var CurPos     = ContentPos.Get(0);

			var CurItem = this.Content[CurPos];

			switch (CurItem.Type)
			{
				case para_Run :
				{
					var NewRun = CurItem.Split(ContentPos, 1);

					this.Internal_Content_Add(CurPos + 1, Item);
					this.Internal_Content_Add(CurPos + 2, NewRun);
					this.CurPos.ContentPos = CurPos + 1;
					break;
				}

				case para_Math:
				case para_Hyperlink:
				{
					CurItem.Add(Item);
					break;
				}

				default:
				{
					this.Internal_Content_Add(CurPos + 1, Item);
					this.CurPos.ContentPos = CurPos + 1;
					break;
				}
			}

			Item.MoveCursorToEndPos(false);

			break;
		}
	}
};
/**
 * Данная функция вызывается, когда уже точно известно, что у нас либо выделение начинается с начала параграфа, либо мы
 * стоим курсором в начале параграфа
 * @param bShift
 */
Paragraph.prototype.Add_Tab = function(bShift)
{
	var NumPr = this.GetNumPr();

	if (undefined !== this.GetNumPr())
	{
		this.Shift_NumberingLvl(bShift);
	}
	else if (true === this.IsSelectionUse())
	{
		this.IncreaseDecreaseIndent(!bShift);
	}
	else
	{
		var ParaPr = this.Get_CompiledPr2(false).ParaPr;

		var nDefaultTabStop = AscCommonWord.Default_Tab_Stop;
		if (nDefaultTabStop < 0.001)
			return;

		var LD_PageFields = this.LogicDocument.Get_PageFields(this.Get_AbsolutePage(0));

		var nLeft  = ParaPr.Ind.Left;
		var nFirst = ParaPr.Ind.FirstLine;
		if (true != bShift)
		{
			if (nFirst < -0.001)
			{
				if (nLeft < -0.001)
				{
					this.Set_Ind({FirstLine : 0}, false);
				}
				else if (nLeft + nFirst < -0.001)
				{
					this.Set_Ind({FirstLine : -nLeft}, false);
				}
				else
				{
					var nNewPos = ((((nFirst + nLeft) / nDefaultTabStop + 0.5) | 0) + 1) * nDefaultTabStop;
					if (nNewPos < nLeft)
						this.Set_Ind({FirstLine : nNewPos - nLeft}, false);
					else
						this.Set_Ind({FirstLine : 0}, false);
				}
			}
			else
			{
				var nCurTabPos = (((nFirst + nLeft) / nDefaultTabStop + 0.001) | 0) * nDefaultTabStop;

				if (LD_PageFields.XLimit - LD_PageFields.X - ParaPr.Ind.Right < nLeft + nFirst + 1.5 * nDefaultTabStop)
					return;

				if (nLeft + nFirst < nCurTabPos - 0.001)
				{
					this.Set_Ind({FirstLine : (((nFirst + nLeft) / nDefaultTabStop + 0.001) | 0) * nDefaultTabStop - nLeft}, false);
				}
				else
				{
					if (Math.abs((((nFirst + nLeft) / nDefaultTabStop + 0.001) | 0) * nDefaultTabStop - (((nLeft) / nDefaultTabStop + 0.001) | 0) * nDefaultTabStop) < 0.001 && nFirst < nDefaultTabStop)
						this.Set_Ind({FirstLine : ((((nFirst + nLeft) / nDefaultTabStop + 0.001) | 0) + 1) * nDefaultTabStop - nLeft}, false);
					else
						this.Set_Ind({Left : ((((nFirst + nLeft) / nDefaultTabStop + 0.001) | 0) + 1) * nDefaultTabStop - nFirst}, false);
				}
			}
		}
		else
		{
			if (Math.abs(nFirst) < 0.001)
			{
				if (Math.abs(nLeft) < 0.001)
					return;
				else if (nLeft > 0)
				{
					var nCurTabPos = ((nLeft / nDefaultTabStop + 0.001) | 0) * nDefaultTabStop;
					if (Math.abs(nCurTabPos - nLeft) < 0.001)
						this.Set_Ind({Left : (((nLeft / nDefaultTabStop + 0.001) | 0) - 1) * nDefaultTabStop}, false);
					else
						this.Set_Ind({Left : nCurTabPos}, false);
				}
				else
				{
					this.Set_Ind({Left : 0}, false);
				}
			}
			else if (nFirst > 0)
			{
				var nCurTabPos = (((nFirst + nLeft) / nDefaultTabStop + 0.001) | 0) * nDefaultTabStop;
				if (Math.abs(nLeft + nFirst - nCurTabPos) < 0.001)
				{
					var nPrevTabPos = Math.max(0, ((((nFirst + nLeft) / nDefaultTabStop + 0.001) | 0) - 1) * nDefaultTabStop);
					if (nPrevTabPos > nLeft)
						this.Set_Ind({FirstLine : nPrevTabPos - nLeft}, false);
					else
						this.Set_Ind({FirstLine : 0}, false);

				}
				else
				{
					this.Set_Ind({FirstLine : nCurTabPos - nLeft}, false);
				}
			}
			else
			{
				if (Math.abs(nFirst + nLeft) < 0.001)
				{
					return;
				}
				else if (nFirst + nLeft < 0)
				{
					this.Set_Ind({Left : -nFirst}, false);
				}
				else
				{
					var nCurTabPos = (((nFirst + nLeft) / nDefaultTabStop + 0.001) | 0) * nDefaultTabStop;
					if (Math.abs(nLeft + nFirst - nCurTabPos) < 0.001)
					{
						var nPrevTabPos = Math.max(0, ((((nFirst + nLeft) / nDefaultTabStop + 0.001) | 0) - 1) * nDefaultTabStop);
						this.Set_Ind({Left : nPrevTabPos - nFirst}, false);
					}
					else
					{
						this.Set_Ind({Left : nCurTabPos - nFirst}, false);
					}
				}
			}
		}

		this.CompiledPr.NeedRecalc = true;
	}
};
/**
 * Расширяем параграф до позиции X
 */
Paragraph.prototype.Extend_ToPos = function(_X)
{
	var CompiledPr = this.Get_CompiledPr2(false).ParaPr;
	var Page       = this.Pages[this.Pages.length - 1];

	var X0 = Page.X;
	var X1 = Page.XLimit - X0;
	var X  = _X - X0;

	var Align = CompiledPr.Jc;

	if (X < 0 || X > X1 || ( X < 7.5 && align_Left === Align ) || ( X > X1 - 10 && align_Right === Align ) || ( Math.abs(X1 / 2 - X) < 10 && align_Center === Align ))
		return false;

	if (true === this.IsEmpty())
	{
		if (align_Left !== Align)
		{
			this.Set_Align(align_Left);
		}

		if (Math.abs(X - X1 / 2) < 12.5)
		{
			this.Set_Align(align_Center);
			return true;
		}
		else if (X > X1 - 12.5)
		{
			this.Set_Align(align_Right);
			return true;
		}
		else if (X < 17.5)
		{
			this.Set_Ind({FirstLine : 12.5}, false);
			return true;
		}
	}

	var Tabs = CompiledPr.Tabs.Copy();

	if (Math.abs(X - X1 / 2) < 12.5)
		Tabs.Add(new CParaTab(tab_Center, X1 / 2));
	else if (X > X1 - 12.5)
		Tabs.Add(new CParaTab(tab_Right, X1 - 0.001));
	else
		Tabs.Add(new CParaTab(tab_Left, X));

	this.Set_Tabs(Tabs);

	this.Set_ParaContentPos(this.Get_EndPos(false), false, -1, -1);
	this.Add(new ParaTab());

	return true;
};
Paragraph.prototype.IncDec_FontSize = function(bIncrease)
{
	if (true === this.ApplyToAll)
	{
		// Применяем настройки ко всем элементам параграфа
		var ContentLen = this.Content.length;

		for (var CurPos = 0; CurPos < ContentLen; CurPos++)
		{
			this.Content[CurPos].Apply_TextPr(undefined, bIncrease, true);
		}
	}
	else
	{
		if (true === this.Selection.Use)
		{
			this.Apply_TextPr(undefined, bIncrease, false);
		}
		else
		{
			var CurParaPos = this.Get_ParaContentPos(false, false);
			var CurPos     = CurParaPos.Get(0);

			// Сначала посмотрим на элемент слева и справа(текущий)
			var SearchLPos = new CParagraphSearchPos();
			this.Get_LeftPos(SearchLPos, CurParaPos);

			var RItem = this.Get_RunElementByPos(CurParaPos);
			var LItem = ( false === SearchLPos.Found ? null : this.Get_RunElementByPos(SearchLPos.Pos) );

			// 1. Если мы находимся в конце параграфа, тогда применяем заданную настройку к знаку параграфа
			//    и добавляем пустой ран с заданными настройками.
			// 2. Если мы находимся в середине слова (справа и слева текстовый элемент, причем оба не пунктуация),
			//    тогда меняем настройки для данного слова.
			// 3. Во всех остальных случаях вставляем пустой ран с заданными настройкми и переносим курсор в этот
			//    ран, чтобы при последующем наборе текст отрисовывался с нужными настройками.

			if (null === RItem || para_End === RItem.Type)
			{
				// Изменение настройки для символа параграфа делается внутри
				this.Apply_TextPr(undefined, bIncrease, false);
			}
			else if (null !== RItem && null !== LItem && para_Text === RItem.Type && para_Text === LItem.Type && false === RItem.IsPunctuation() && false === LItem.IsPunctuation())
			{
				var SearchSPos = new CParagraphSearchPos();
				var SearchEPos = new CParagraphSearchPos();

				this.Get_WordStartPos(SearchSPos, CurParaPos);
				this.Get_WordEndPos(SearchEPos, CurParaPos);

				// Такого быть не должно, т.к. мы уже проверили, что справа и слева точно есть текст
				if (true !== SearchSPos.Found || true !== SearchEPos.Found)
					return;

				// Выставим временно селект от начала и до конца слова
				this.Selection.Use = true;
				this.Set_SelectionContentPos(SearchSPos.Pos, SearchEPos.Pos);

				this.Apply_TextPr(undefined, bIncrease, false);

				// Убираем селект
				this.RemoveSelection();
			}
			else
			{
				this.Apply_TextPr(undefined, bIncrease, false);
			}
		}
	}

	return true;
};
Paragraph.prototype.Shift_NumberingLvl = function(bShift)
{
	var NumPr = this.GetNumPr();
	if (!NumPr)
		return;

	if (true != this.Selection.Use)
	{
		var NumId   = NumPr.NumId;
		var Lvl     = NumPr.Lvl;
		var NumInfo = this.Parent.CalculateNumberingValues(this, NumPr);

		if (0 === Lvl && NumInfo[Lvl] <= 1)
		{
			var oNumbering = this.Parent.GetNumbering();
			var oNum       = oNumbering.GetNum(NumId);

			var NumLvl    = oNum.GetLvl(Lvl);
			var NumParaPr = NumLvl.GetParaPr();

			var ParaPr = this.Get_CompiledPr2(false).ParaPr;

			if (undefined != NumParaPr.Ind && undefined != NumParaPr.Ind.Left)
			{
				var NewX = ParaPr.Ind.Left;
				if (true != bShift)
					NewX += AscCommonWord.Default_Tab_Stop;
				else
				{
					NewX -= AscCommonWord.Default_Tab_Stop;

					if (NewX < 0)
						NewX = 0;

					if (ParaPr.Ind.FirstLine < 0 && NewX + ParaPr.Ind.FirstLine < 0)
						NewX = -ParaPr.Ind.FirstLine;
				}

				oNum.ShiftLeftInd(NewX);

				this.private_AddPrChange();
				History.Add(new CChangesParagraphIndFirst(this, this.Pr.Ind.FirstLine, undefined));
				History.Add(new CChangesParagraphIndLeft(this, this.Pr.Ind.Left, undefined));

				// При добавлении списка в параграф, удаляем все собственные сдвиги
				this.Pr.Ind.FirstLine = undefined;
				this.Pr.Ind.Left      = undefined;

				// Надо пересчитать конечный стиль
				this.CompiledPr.NeedRecalc = true;

				this.private_UpdateTrackRevisionOnChangeParaPr(true);
			}
		}
		else
			this.IndDecNumberingLevel(!bShift);
	}
	else
		this.IndDecNumberingLevel(!bShift);
};
Paragraph.prototype.Can_IncreaseLevel = function(bIncrease)
{
	var CurLevel = AscFormat.isRealNumber(this.Pr.Lvl) ? this.Pr.Lvl : 0, NewPr, OldPr = this.Get_CompiledPr2(false).TextPr, DeltaFontSize, i, j, RunPr;
	if (bIncrease)
	{
		if (CurLevel >= 8)
		{
			return false;
		}
		NewPr = this.Internal_CompiledParaPrPresentation(CurLevel + 1).TextPr;
	}
	else
	{
		if (CurLevel <= 0)
		{
			return false;
		}
		NewPr = this.Internal_CompiledParaPrPresentation(CurLevel - 1).TextPr;
	}
	DeltaFontSize = NewPr.FontSize - OldPr.FontSize;
	if (this.Pr.DefaultRunPr && AscFormat.isRealNumber(this.Pr.DefaultRunPr.FontSize))
	{
		if (this.Pr.DefaultRunPr.FontSize + DeltaFontSize < 1)
		{
			return false;
		}
	}
	if (AscFormat.isRealNumber(this.TextPr.FontSize))
	{
		if (this.TextPr.FontSize + DeltaFontSize < 1)
		{
			return false;
		}
	}
	for (i = 0; i < this.Content.length; ++i)
	{
		if (this.Content[i].Type === para_Run)
		{
			RunPr = this.Content[i].Get_CompiledPr();
			if (RunPr.FontSize + DeltaFontSize < 1)
			{
				return false;
			}
		}
		else if (this.Content[i].Type === para_Hyperlink)
		{
			for (j = 0; j < this.Content[i].Content.length; ++j)
			{
				if (this.Content[i].Content[j].Type === para_Run)
				{
					RunPr = this.Content[i].Content[j].Get_CompiledPr();
					if (RunPr.FontSize + DeltaFontSize < 1)
					{
						return false;
					}
				}
			}
		}
	}
	return true;
};
Paragraph.prototype.Increase_Level = function(bIncrease)
{
	var CurLevel = AscFormat.isRealNumber(this.Pr.Lvl) ? this.Pr.Lvl : 0, NewPr, OldPr = this.Get_CompiledPr2(false).TextPr, DeltaFontSize, i, j, RunPr;
	if (bIncrease)
	{
		NewPr = this.Internal_CompiledParaPrPresentation(CurLevel + 1).TextPr;
		if (this.Pr.Ind && this.Pr.Ind.Left != undefined)
		{
			this.Set_Ind({FirstLine : this.Pr.Ind.FirstLine, Left : this.Pr.Ind.Left + 11.1125}, false);
		}
		this.Set_PresentationLevel(CurLevel + 1);
	}
	else
	{
		NewPr = this.Internal_CompiledParaPrPresentation(CurLevel - 1).TextPr;
		if (this.Pr.Ind && this.Pr.Ind.Left != undefined)
		{
			this.Set_Ind({FirstLine : this.Pr.Ind.FirstLine, Left : this.Pr.Ind.Left - 11.1125}, false);
		}
		this.Set_PresentationLevel(CurLevel - 1);
	}
	DeltaFontSize = NewPr.FontSize - OldPr.FontSize;
	if (DeltaFontSize !== 0)
	{
		if (this.Pr.DefaultRunPr && AscFormat.isRealNumber(this.Pr.DefaultRunPr.FontSize))
		{
			var NewParaPr = this.Pr.Copy();
			NewParaPr.DefaultRunPr.FontSize += DeltaFontSize;
			this.Set_Pr(NewParaPr);//Todo: сделать отдельный метод для выставления DefaultRunPr
		}
		if (AscFormat.isRealNumber(this.TextPr.FontSize))
		{
			this.TextPr.Set_FontSize(this.TextPr.FontSize + DeltaFontSize);
		}
		for (i = 0; i < this.Content.length; ++i)
		{
			if (this.Content[i].Type === para_Run)
			{
				if (AscFormat.isRealNumber(this.Content[i].Pr.FontSize))
				{
					this.Content[i].Set_FontSize(this.Content[i].Pr.FontSize + DeltaFontSize);
				}
			}
			else if (this.Content[i].Type === para_Hyperlink)
			{
				for (j = 0; j < this.Content[i].Content.length; ++j)
				{
					if (this.Content[i].Content[j].Type === para_Run)
					{
						if (AscFormat.isRealNumber(this.Content[i].Content[j].Pr.FontSize))
						{
							this.Content[i].Content[j].Set_FontSize(this.Content[i].Content[j].Pr.FontSize + DeltaFontSize);
						}
					}
				}
			}
		}
	}
};
Paragraph.prototype.IncreaseDecreaseIndent = function(bIncrease)
{
	if (undefined !== this.GetNumPr())
	{
		this.Shift_NumberingLvl(!bIncrease);
	}
	else
	{
		var ParaPr = this.Get_CompiledPr2(false).ParaPr;

		var LeftMargin = ParaPr.Ind.Left;
		if (UnknownValue === LeftMargin)
			LeftMargin = 0;
		else if (LeftMargin < 0)
		{
			this.Set_Ind({Left : 0}, false);
			return;
		}

		var LeftMargin_new = 0;
		if (true === bIncrease)
		{
			if (LeftMargin >= 0)
			{
				LeftMargin     = 12.5 * parseInt(10 * LeftMargin / 125);
				LeftMargin_new = ( (LeftMargin - (10 * LeftMargin) % 125 / 10) / 12.5 + 1) * 12.5;
			}

			if (LeftMargin_new < 0)
				LeftMargin_new = 12.5;
		}
		else
		{
			var TempValue  = (125 - (10 * LeftMargin) % 125);
			TempValue      = ( 125 === TempValue ? 0 : TempValue );
			LeftMargin_new = Math.max(( (LeftMargin + TempValue / 10) / 12.5 - 1 ) * 12.5, 0);
		}

		this.Set_Ind({Left : LeftMargin_new}, false);
	}

	var NewPresLvl = ( true === bIncrease ? Math.min(8, this.PresentationPr.Level + 1) : Math.max(0, this.PresentationPr.Level - 1) );
	this.Set_PresentationLevel(NewPresLvl);
};
/**
 * Корректируем позицию курсора: Если курсор находится в начале какого-либо рана, тогда мы его двигаем в конец
 * предыдущего рана
 */
Paragraph.prototype.Correct_ContentPos = function(CorrectEndLinePos)
{
	if (this.IsSelectionUse())
		return;

	var Count  = this.Content.length;
	var CurPos = this.CurPos.ContentPos;

	// Если курсор попадает на конец строки, тогда мы его переносим в начало следующей
	if (true === CorrectEndLinePos && true === this.Content[CurPos].Cursor_Is_End())
	{
		var _CurPos = CurPos + 1;

		// Пропускаем пустые раны
		while (_CurPos < Count && true === this.Content[_CurPos].Is_Empty({SkipAnchor : true}))
			_CurPos++;

		if (_CurPos < Count && true === this.Content[_CurPos].IsStartFromNewLine())
		{
			CurPos = _CurPos;
			this.Content[CurPos].MoveCursorToStartPos();
		}
	}

	while (CurPos > 0 && true === this.Content[CurPos].Cursor_Is_NeededCorrectPos() && para_Run === this.Content[CurPos - 1].Type && !this.Content[CurPos -1].IsSolid())
	{
		CurPos--;
		this.Content[CurPos].MoveCursorToEndPos();
	}

	this.CurPos.ContentPos = CurPos;
};
Paragraph.prototype.Correct_ContentPos2 = function()
{
	if (this.IsSelectionUse())
		return;

	var Count  = this.Content.length;
	var CurPos = Math.min(Math.max(0, this.CurPos.ContentPos), Count - 1);

	// Может так случиться, что текущий элемент окажется непригодным для расположения курсора, тогда мы ищем ближайший
	// пригодный
	while (CurPos > 0 && false === this.Content[CurPos].IsCursorPlaceable())
	{
		CurPos--;
		this.Content[CurPos].MoveCursorToEndPos();
	}

	while (CurPos < Count && false === this.Content[CurPos].IsCursorPlaceable())
	{
		CurPos++;
		this.Content[CurPos].MoveCursorToStartPos(false);
	}

	// Если курсор находится в начале или конце гиперссылки, тогда выводим его из гиперссылки
	while (CurPos > 0 && para_Run !== this.Content[CurPos].Type && para_Math !== this.Content[CurPos].Type && para_Field !== this.Content[CurPos].Type && para_InlineLevelSdt !== this.Content[CurPos].Type && true === this.Content[CurPos].Cursor_Is_Start())
	{
		if (false === this.Content[CurPos - 1].IsCursorPlaceable())
			break;

		CurPos--;
		this.Content[CurPos].MoveCursorToEndPos();
	}

	while (CurPos < Count && para_Run !== this.Content[CurPos].Type && para_Math !== this.Content[CurPos].Type && para_Field !== this.Content[CurPos].Type && para_InlineLevelSdt !== this.Content[CurPos].Type && true === this.Content[CurPos].Cursor_Is_End())
	{
		if (false === this.Content[CurPos + 1].IsCursorPlaceable())
			break;

		CurPos++;
		this.Content[CurPos].MoveCursorToStartPos(false);
	}

	this.private_CorrectCurPosRangeLine();

	this.CurPos.ContentPos = CurPos;

	this.Content[this.CurPos.ContentPos].CorrectContentPos();
};
Paragraph.prototype.Get_ParaContentPos = function(bSelection, bStart, bUseCorrection)
{
	var ContentPos = new CParagraphContentPos();

	var Pos = ( true !== bSelection ? this.CurPos.ContentPos : ( false !== bStart ? this.Selection.StartPos : this.Selection.EndPos ) );

	ContentPos.Add(Pos);

	if (Pos < 0 || Pos >= this.Content.length)
		return ContentPos;

	this.Content[Pos].Get_ParaContentPos(bSelection, bStart, ContentPos, true === bUseCorrection ? true : false);
	return ContentPos;
};
Paragraph.prototype.Set_ParaContentPos = function(ContentPos, CorrectEndLinePos, Line, Range, bCorrectPos)
{
	var Pos = ContentPos.Get(0);

	if (Pos >= this.Content.length)
		Pos = this.Content.length - 1;

	if (Pos < 0)
		Pos = 0;

	this.CurPos.ContentPos = Pos;
	this.Content[Pos].Set_ParaContentPos(ContentPos, 1);

	if (false !== bCorrectPos)
	{
		this.Correct_ContentPos(CorrectEndLinePos);
		this.Correct_ContentPos2();
	}

	this.CurPos.Line  = Line;
	this.CurPos.Range = Range;
};
Paragraph.prototype.Set_SelectionContentPos = function(StartContentPos, EndContentPos, CorrectAnchor)
{
	var Depth = 0;

	var Direction = 1;
	if (StartContentPos.Compare(EndContentPos) > 0)
		Direction = -1;

	var OldStartPos = Math.max(0, Math.min(this.Selection.StartPos, this.Content.length - 1));
	var OldEndPos   = Math.max(0, Math.min(this.Selection.EndPos, this.Content.length - 1));

	if (OldStartPos > OldEndPos)
	{
		OldStartPos = this.Selection.EndPos;
		OldEndPos   = this.Selection.StartPos;
	}

	var StartPos = StartContentPos.Get(Depth);
	var EndPos   = EndContentPos.Get(Depth);

	this.Selection.StartPos = StartPos;
	this.Selection.EndPos   = EndPos;

	// Удалим отметки о старом селекте
	if (OldStartPos < StartPos && OldStartPos < EndPos)
	{
		var TempStart = Math.max(0, OldStartPos);
		var TempEnd   = Math.min(Math.min(StartPos, EndPos), this.Content.length);

		for (var CurPos = TempStart; CurPos < TempEnd; CurPos++)
		{
			this.Content[CurPos].RemoveSelection();
		}
	}

	if (OldEndPos > StartPos && OldEndPos > EndPos)
	{
		var TempStart = Math.max(Math.max(StartPos, EndPos) + 1, 0);
		var TempEnd   = Math.min(OldEndPos, this.Content.length - 1);

		for (var CurPos = TempStart; CurPos <= TempEnd; CurPos++)
		{
			this.Content[CurPos].RemoveSelection();
		}
	}

	if (StartPos === EndPos)
	{
		this.Content[StartPos].Set_SelectionContentPos(StartContentPos, EndContentPos, Depth + 1, 0, 0);
	}
	else
	{
		if (StartPos > EndPos)
		{
			this.Content[StartPos].Set_SelectionContentPos(StartContentPos, null, Depth + 1, 0, 1);
			this.Content[EndPos].Set_SelectionContentPos(null, EndContentPos, Depth + 1, -1, 0);

			for (var CurPos = EndPos + 1; CurPos < StartPos; CurPos++)
				this.Content[CurPos].SelectAll(-1);
		}
		else// if ( StartPos < EndPos )
		{
			this.Content[StartPos].Set_SelectionContentPos(StartContentPos, null, Depth + 1, 0, -1);
			this.Content[EndPos].Set_SelectionContentPos(null, EndContentPos, Depth + 1, 1, 0);

			for (var CurPos = StartPos + 1; CurPos < EndPos; CurPos++)
				this.Content[CurPos].SelectAll(1);
		}

		// TODO: Реализовать выделение гиперссылки целиком (само выделение тут сделано, но непонятно как
		//       дальше обрабатывать Shift + влево/вправо)

		// Делаем как в Word: гиперссылка выделяется целиком, если выделение выходит за пределы гиперссылки
		//            if ( para_Hyperlink === this.Content[StartPos].Type && true !==
		// this.Content[StartPos].IsSelectionEmpty(true) ) this.Content[StartPos].SelectAll( StartPos > EndPos ? -1 :
		// 1 );  if ( para_Hyperlink === this.Content[EndPos].Type && true !==
		// this.Content[EndPos].IsSelectionEmpty(true) ) this.Content[EndPos].SelectAll( StartPos > EndPos ? -1 : 1
		// );
	}

	if (false !== CorrectAnchor)
	{
		// Дополнительная проверка. Если у нас визуально выделен весь параграф (т.е. весь текст и знак параграфа
		// обязательно!), тогда выделяем весь параграф целиком, чтобы в селект попадали и все привязанные объекты.
		// Но если у нас выделен параграф не целиком, тогда мы снимаем выделение с привязанных объектов, стоящих в
		// начале параграфа.

		if (true === this.Selection_CheckParaEnd())
		{
			// Эта ветка нужна для выделения плавающих объектов, стоящих в начале параграфа, когда параграф выделен весь

			var bNeedSelectAll = true;
			var StartPos       = Math.min(this.Selection.StartPos, this.Selection.EndPos);
			for (var Pos = 0; Pos <= StartPos; Pos++)
			{
				if (false === this.Content[Pos].IsSelectedAll({SkipAnchor : true}))
				{
					bNeedSelectAll = false;
					break;
				}
			}

			if (true === bNeedSelectAll)
			{
				if (1 === Direction)
					this.Selection.StartPos = 0;
				else
					this.Selection.EndPos = 0;

				for (var Pos = 0; Pos <= StartPos; Pos++)
				{
					this.Content[Pos].SelectAll(Direction);
				}
			}
		}
		else if (true !== this.IsSelectionEmpty(true)
			&& ((1 === Direction && true === this.Selection.StartManually) || (1 !== Direction && true === this.Selection.EndManually)))
		{
			// Эта ветка нужна для снятия выделения с плавающих объектов, стоящих в начале параграфа, когда параграф
			// выделен не весь. Заметим, что это ветка имеет смысл, только при direction = 1, поэтому выделен весь
			// параграф или нет, проверяется попаданием para_End в селект. Кроме того, ничего не делаем с селектом,
			// если он пустой.

			var bNeedCorrectLeftPos = true;
			var _StartPos           = Math.min(StartPos, EndPos);
			var _EndPos             = Math.max(StartPos, EndPos);
			for (var Pos = 0; Pos < _StartPos; Pos++)
			{
				if (true !== this.Content[Pos].IsEmpty({SkipAnchor : true}))
				{
					bNeedCorrectLeftPos = false;
					break;
				}
			}

			if (true === bNeedCorrectLeftPos)
			{
				for (var nPos = _StartPos; nPos <= _EndPos; ++nPos)
				{
					if (true === this.Content[nPos].SkipAnchorsAtSelectionStart(Direction))
					{
						if (1 === Direction)
						{
							if (nPos + 1 > this.Selection.EndPos)
								break;

							this.Selection.StartPos = nPos + 1;
						}
						else
						{
							if (nPos + 1 > this.Selection.StartPos)
								break;

							this.Selection.EndPos = nPos + 1;
						}

						this.Content[nPos].RemoveSelection();
					}
					else
					{
						break;
					}
				}
			}
		}
	}
};
/**
 * Устанавливаем позиции селекта внутри данного параграфа
 * NB: Данная функция не стартует селект в параграфе, а лишь выставляет его границы!!!
 * @param oStartPos {CParagraphContentPos}
 * @param oEndPos {CParagraphContentPos}
 * @param isCorrectAnchor {boolean}
 */
Paragraph.prototype.SetSelectionContentPos = function(oStartPos, oEndPos, isCorrectAnchor)
{
	return this.Set_SelectionContentPos(oStartPos, oEndPos, isCorrectAnchor);
};
Paragraph.prototype.Get_ParaContentPosByXY = function(X, Y, PageIndex, bYLine, StepEnd, bCenterMode)
{
	var SearchPos        = new CParagraphSearchPosXY();
	SearchPos.CenterMode = (undefined === bCenterMode ? true : bCenterMode);

	if (this.Lines.length <= 0)
		return SearchPos;

	// Определим страницу
	var PNum = (-1 === PageIndex || undefined === PageIndex ? 0 : PageIndex);

	// Сначала определим на какую строку мы попали
	if (PNum >= this.Pages.length)
	{
		PNum   = this.Pages.length - 1;
		bYLine = true;
		Y      = this.Lines.length - 1;
	}
	else if (PNum < 0)
	{
		PNum   = 0;
		bYLine = true;
		Y      = 0;
	}

	var CurLine = 0;
	if (true === bYLine)
		CurLine = Y;
	else
	{
		CurLine = this.Pages[PNum].FirstLine;

		var bFindY   = false;
		var CurLineY = this.Pages[PNum].Y + this.Lines[CurLine].Y + this.Lines[CurLine].Metrics.Descent + this.Lines[CurLine].Metrics.LineGap;
		var LastLine = ( PNum >= this.Pages.length - 1 ? this.Lines.length - 1 : this.Pages[PNum + 1].FirstLine - 1 );

		while (!bFindY)
		{
			if (Y < CurLineY)
				break;
			if (CurLine >= LastLine)
				break;

			CurLine++;
			CurLineY = this.Lines[CurLine].Y + this.Pages[PNum].Y + this.Lines[CurLine].Metrics.Descent + this.Lines[CurLine].Metrics.LineGap;
		}
	}

	// Определим отрезок, в который мы попадаем
	var CurRange    = 0;
	var RangesCount = this.Lines[CurLine].Ranges.length;

	if (RangesCount <= 0)
	{
		return SearchPos;
	}
	else if (RangesCount > 1)
	{
		for (; CurRange < RangesCount - 1; CurRange++)
		{
			var _CurRange  = this.Lines[CurLine].Ranges[CurRange];
			var _NextRange = this.Lines[CurLine].Ranges[CurRange + 1];
			if (X < (_CurRange.XEnd + _NextRange.X) / 2)
				break;
		}
	}

	if (CurRange >= RangesCount)
		CurRange = Math.max(RangesCount - 1, 0);

	// Определим уже непосредственно позицию, куда мы попадаем
	var Range    = this.Lines[CurLine].Ranges[CurRange];
	var StartPos = Range.StartPos;
	var EndPos   = Range.EndPos;

	SearchPos.CurX = Range.XVisible;
	SearchPos.X    = X;
	SearchPos.Y    = Y;

	// Проверим попадание в нумерацию
	if (true === this.Numbering.Check_Range(CurRange, CurLine))
	{
		var oNumPr = this.GetNumPr();
		if (para_Numbering === this.Numbering.Type && oNumPr && oNumPr.IsValid())
		{
			var NumJc = this.Parent.GetNumbering().GetNum(oNumPr.NumId).GetLvl(oNumPr.Lvl).GetJc();

			var NumX0 = SearchPos.CurX;
			var NumX1 = SearchPos.CurX;

			switch (NumJc)
			{
				case align_Right:
				{
					NumX0 -= this.Numbering.WidthNum;
					break;
				}
				case align_Center:
				{
					NumX0 -= this.Numbering.WidthNum / 2;
					NumX1 += this.Numbering.WidthNum / 2;
					break;
				}
				case align_Left:
				default:
				{
					NumX1 += this.Numbering.WidthNum;
					break;
				}
			}

			if (SearchPos.X >= NumX0 && SearchPos.X <= NumX1)
			{
				SearchPos.Numbering = true;
			}
		}

		SearchPos.CurX += this.Numbering.WidthVisible;
	}

	// TODO: ParaEnd
	// Заглушка, чтобы не попадать в последний ран с символом конца параграфа
	if (true !== StepEnd && EndPos === this.Content.length - 1 && EndPos > StartPos)
		EndPos--;

	for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
	{
		var Item = this.Content[CurPos];

		if (false === SearchPos.InText)
			SearchPos.InTextPos.Update2(CurPos, 0);

		if (true === Item.Get_ParaContentPosByXY(SearchPos, 1, CurLine, CurRange, StepEnd))
			SearchPos.Pos.Update2(CurPos, 0);
	}

	SearchPos.InTextX = SearchPos.InText;

	// По Х попали в какой-то элемент, проверяем по Y
	if (true === SearchPos.InText && Y >= this.Pages[PNum].Y + this.Lines[CurLine].Y - this.Lines[CurLine].Metrics.Ascent - 0.01 && Y <= this.Pages[PNum].Y + this.Lines[CurLine].Y + this.Lines[CurLine].Metrics.Descent + this.Lines[CurLine].Metrics.LineGap + 0.01)
		SearchPos.InText = true;
	else
		SearchPos.InText = false;

	// Такое возможно, если все раны до этого (в том числе и этот) были пустыми, тогда, чтобы не возвращать
	// неправильную позицию вернем позицию начала данного пустого рана.
	if (SearchPos.DiffX > 1000000 - 1)
	{
		SearchPos.Line  = -1;
		SearchPos.Range = -1;
	}
	else
	{
		SearchPos.Line  = CurLine;
		SearchPos.Range = CurRange;
	}

	return SearchPos;
};
Paragraph.prototype.GetCursorPosXY = function()
{
	return {X : this.CurPos.RealX, Y : this.CurPos.RealY};
};
Paragraph.prototype.MoveCursorLeft = function(AddToSelect, Word)
{
	if (true === this.Selection.Use)
	{
		var EndSelectionPos   = this.Get_ParaContentPos(true, false);
		var StartSelectionPos = this.Get_ParaContentPos(true, true);

		if (true !== AddToSelect)
		{
			var oPlaceHolderObject = this.GetPlaceHolderObject();
			var oPresentationField = this.GetPresentationField();

			// Иногда нужно скоректировать позицию, например в формулах
			var CorrectedStartPos = this.Get_ParaContentPos(true, true, true);
			var CorrectedEndPos   = this.Get_ParaContentPos(true, false, true);

			var SelectPos = CorrectedStartPos;
			if (CorrectedStartPos.Compare(CorrectedEndPos) > 0)
				SelectPos = CorrectedEndPos;

			this.RemoveSelection();

			var oResultPos = SelectPos;

			if ((oPlaceHolderObject && oPlaceHolderObject instanceof CInlineLevelSdt) || oPresentationField)
			{
				var oSearchPos = new CParagraphSearchPos();
				this.Get_LeftPos(oSearchPos, SelectPos);
				oResultPos = oSearchPos.Pos;
			}

			this.Set_ParaContentPos(oResultPos, true, -1, -1);
		}
		else
		{
			var SearchPos          = new CParagraphSearchPos();
			SearchPos.ForSelection = true;

			if (true === Word)
				this.Get_WordStartPos(SearchPos, EndSelectionPos);
			else
				this.Get_LeftPos(SearchPos, EndSelectionPos);

			if (true === SearchPos.Found)
			{
				this.Set_SelectionContentPos(StartSelectionPos, SearchPos.Pos);
			}
			else
			{
				return false;
			}
		}
	}
	else
	{
		var SearchPos  = new CParagraphSearchPos();
		var ContentPos = this.Get_ParaContentPos(false, false);

		if (true === AddToSelect)
			SearchPos.ForSelection = true;

		if (true === Word)
			this.Get_WordStartPos(SearchPos, ContentPos);
		else
			this.Get_LeftPos(SearchPos, ContentPos);

		if (true === AddToSelect)
		{
			if (true === SearchPos.Found)
			{
				// Селекта еще нет, добавляем с текущей позиции
				this.Selection.Use = true;
				this.Set_SelectionContentPos(ContentPos, SearchPos.Pos);
			}
			else
			{
				this.Selection.Use = false;
				return false;
			}
		}
		else
		{
			if (true === SearchPos.Found)
			{
				this.Set_ParaContentPos(SearchPos.Pos, true, -1, -1);
			}
			else
			{
				return false;
			}
		}
	}

	// Обновляем текущую позицию X,Y. Если есть селект, тогда обновляем по концу селекта
	if (true === this.Selection.Use)
	{
		var SelectionEndPos = this.Get_ParaContentPos(true, false);
		this.Set_ParaContentPos(SelectionEndPos, false, -1, -1);
	}

	this.Internal_Recalculate_CurPos(this.CurPos.ContentPos, true, false, false);

	this.CurPos.RealX = this.CurPos.X;
	this.CurPos.RealY = this.CurPos.Y;

	return true;
};
Paragraph.prototype.MoveCursorLeftWithSelectionFromEnd = function(Word)
{
	this.MoveCursorToEndPos(true, true);
	this.MoveCursorLeft(true, Word);
};
Paragraph.prototype.MoveCursorRight = function(AddToSelect, Word)
{
	if (true === this.Selection.Use)
	{
		var EndSelectionPos   = this.Get_ParaContentPos(true, false);
		var StartSelectionPos = this.Get_ParaContentPos(true, true);

		if (true !== AddToSelect)
		{
			// Проверим, попал ли конец параграфа в выделение
			if (true === this.Selection_CheckParaEnd())
			{
				this.RemoveSelection();
				this.MoveCursorToEndPos(false);
				return false;
			}
			else
			{
				var oPlaceHolderObject = this.GetPlaceHolderObject();
				var oPresentationField = this.GetPresentationField();

				// Иногда нужно скоректировать позицию, например в формулах
				var CorrectedStartPos = this.Get_ParaContentPos(true, true, true);
				var CorrectedEndPos   = this.Get_ParaContentPos(true, false, true);

				var SelectPos = CorrectedEndPos;
				if (CorrectedStartPos.Compare(CorrectedEndPos) > 0)
					SelectPos = CorrectedStartPos;

				this.RemoveSelection();

				var oResultPos = SelectPos;

				if ((oPlaceHolderObject && oPlaceHolderObject instanceof CInlineLevelSdt) || oPresentationField)
				{
					var oSearchPos = new CParagraphSearchPos();
					this.Get_RightPos(oSearchPos, SelectPos);
					oResultPos = oSearchPos.Pos;
				}

				this.Set_ParaContentPos(oResultPos, true, -1, -1);
			}
		}
		else
		{
			var SearchPos          = new CParagraphSearchPos();
			SearchPos.ForSelection = true;

			if (true === Word)
				this.Get_WordEndPos(SearchPos, EndSelectionPos, true);
			else
				this.Get_RightPos(SearchPos, EndSelectionPos, true);

			if (true === SearchPos.Found)
			{
				this.Set_SelectionContentPos(StartSelectionPos, SearchPos.Pos);
			}
			else
			{
				return false;
			}
		}
	}
	else
	{
		var SearchPos  = new CParagraphSearchPos();
		var ContentPos = this.Get_ParaContentPos(false, false);

		if (true === AddToSelect)
			SearchPos.ForSelection = true;

		if (true === Word)
			this.Get_WordEndPos(SearchPos, ContentPos, AddToSelect);
		else
			this.Get_RightPos(SearchPos, ContentPos, AddToSelect);

		if (true === AddToSelect)
		{
			if (true === SearchPos.Found)
			{
				// Селекта еще нет, добавляем с текущей позиции
				this.Selection.Use = true;
				this.Set_SelectionContentPos(ContentPos, SearchPos.Pos);
			}
			else
			{
				this.Selection.Use = false;
				return false;
			}
		}
		else
		{
			if (true === SearchPos.Found)
			{
				this.Set_ParaContentPos(SearchPos.Pos, true, -1, -1);
			}
			else
			{
				return false;
			}
		}
	}

	// Обновляем текущую позицию X,Y. Если есть селект, тогда обновляем по концу селекта
	if (true === this.Selection.Use)
	{
		var SelectionEndPos = this.Get_ParaContentPos(true, false);
		this.Set_ParaContentPos(SelectionEndPos, false, -1, -1);
	}

	this.Internal_Recalculate_CurPos(this.CurPos.ContentPos, true, false, false);

	this.CurPos.RealX = this.CurPos.X;
	this.CurPos.RealY = this.CurPos.Y;

	return true;
};
Paragraph.prototype.MoveCursorRightWithSelectionFromStart = function(Word)
{
	this.MoveCursorToStartPos(false);
	this.MoveCursorRight(true, Word);
};
Paragraph.prototype.MoveCursorToXY = function(X, Y, bLine, bDontChangeRealPos, CurPage)
{
	var SearchPosXY = this.Get_ParaContentPosByXY(X, Y, CurPage, bLine, false);

	this.Set_ParaContentPos(SearchPosXY.Pos, false, SearchPosXY.Line, SearchPosXY.Range);
	this.Internal_Recalculate_CurPos(-1, false, false, false);

	if (bDontChangeRealPos != true)
	{
		this.CurPos.RealX = this.CurPos.X;
		this.CurPos.RealY = this.CurPos.Y;
	}

	if (true != bLine)
	{
		this.CurPos.RealX = X;
		this.CurPos.RealY = Y;
	}
};
/**
 * Находим позицию заданного элемента. (Данной функцией лучше пользоваться, когда параграф рассчитан)
 * @returns {null | CParagraphContentPos}
 */
Paragraph.prototype.Get_PosByElement = function(Class)
{
	var ContentPos = new CParagraphContentPos();

	// Сначала попробуем определить местоположение по данным рассчета
	var CurRange = Class.StartRange;
	var CurLine  = Class.StartLine;

	if (undefined !== this.Lines[CurLine] && undefined !== this.Lines[CurLine].Ranges[CurRange])
	{
		var StartPos = this.Lines[CurLine].Ranges[CurRange].StartPos;
		var EndPos   = this.Lines[CurLine].Ranges[CurRange].EndPos;

		if (0 <= StartPos && StartPos < this.Content.length && 0 <= EndPos && EndPos < this.Content.length)
		{
			for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
			{
				var Element = this.Content[CurPos];
				ContentPos.Update(CurPos, 0);

				if (true === Element.Get_PosByElement(Class, ContentPos, 1, true, CurRange, CurLine))
					return ContentPos;
			}
		}
	}

	// Если мы дошли до сюда, значит мы так и не нашли заданный класс. Попробуем его найти с помощью
	// поиска по всему параграфу, а не по заданному отрезку

	var ContentLen = this.Content.length;
	for (var CurPos = 0; CurPos < ContentLen; CurPos++)
	{
		var Element = this.Content[CurPos];

		ContentPos.Update(CurPos, 0);

		if (true === Element.Get_PosByElement(Class, ContentPos, 1, false, -1, -1))
			return ContentPos;
	}

	return null;
};
Paragraph.prototype.GetPosByElement = function(oClass)
{
	return this.Get_PosByElement(oClass);
};
/**
 * Получаем список классов по заданной позиции
 */
Paragraph.prototype.Get_ClassesByPos = function(ContentPos)
{
	var Classes = [];

	var CurPos = ContentPos.Get(0);
	if (0 <= CurPos && CurPos <= this.Content.length - 1)
		this.Content[CurPos].Get_ClassesByPos(Classes, ContentPos, 1);

	return Classes;
};
/**
 * Получаем по заданной позиции элемент текста
 */
Paragraph.prototype.Get_RunElementByPos = function(ContentPos)
{
	var CurPos     = ContentPos.Get(0);
	var ContentLen = this.Content.length;

	// Сначала ищем в текущем элементе
	var Element = this.Content[CurPos].Get_RunElementByPos(ContentPos, 1);

	// Если заданная позиция была последней в текущем элементе, то ищем в следующем
	while (null === Element)
	{
		CurPos++;

		if (CurPos >= ContentLen)
			break;

		Element = this.Content[CurPos].Get_RunElementByPos();
	}

	return Element;
};
Paragraph.prototype.Get_PageStartPos = function(CurPage)
{
	var CurLine  = this.Pages[CurPage].StartLine;
	var CurRange = 0;

	return this.Get_StartRangePos2(CurLine, CurRange);
};
Paragraph.prototype.Get_LeftPos = function(SearchPos, ContentPos)
{
	SearchPos.InitComplexFields(this.GetComplexFieldsByPos(ContentPos, true));

	var Depth  = 0;
	var CurPos = ContentPos.Get(Depth);

	this.Content[CurPos].Get_LeftPos(SearchPos, ContentPos, Depth + 1, true);
	SearchPos.Pos.Update(CurPos, Depth);

	if (true === SearchPos.Found)
		return true;

	CurPos--;

	if (CurPos >= 0 && this.Content[CurPos + 1].IsStopCursorOnEntryExit())
	{
		// При выходе из формулы встаем в конец рана
		this.Content[CurPos].Get_EndPos(false, SearchPos.Pos, Depth + 1);
		SearchPos.Pos.Update(CurPos, Depth);
		SearchPos.Found = true;
		return true;
	}

	while (CurPos >= 0)
	{
		this.Content[CurPos].Get_LeftPos(SearchPos, ContentPos, Depth + 1, false);
		SearchPos.Pos.Update(CurPos, Depth);

		if (true === SearchPos.Found)
			return true;

		CurPos--;
	}

	return false;
};
Paragraph.prototype.Get_RightPos = function(SearchPos, ContentPos, StepEnd)
{
	SearchPos.InitComplexFields(this.GetComplexFieldsByPos(ContentPos, true));

	var Depth  = 0;
	var CurPos = ContentPos.Get(Depth);

	SearchPos.Found = true;
	while (SearchPos.Found)
	{
		SearchPos.Found = false;

		this.Content[CurPos].Get_RightPos(SearchPos, ContentPos, Depth + 1, true, StepEnd);
		SearchPos.Pos.Update(CurPos, Depth);

		if (SearchPos.Found)
		{
			var oRunElement = this.Get_RunElementByPos(SearchPos.Pos);
			if (oRunElement && oRunElement.IsDiacriticalSymbol && oRunElement.IsDiacriticalSymbol())
			{
				SearchPos.Found = false;
				continue;
			}

			return true;
		}
	}

	CurPos++;

	var Count = this.Content.length;
	if (CurPos < Count && this.Content[CurPos - 1].IsStopCursorOnEntryExit())
	{
		// При выходе из формулы встаем в конец рана
		this.Content[CurPos].Get_StartPos(SearchPos.Pos, Depth + 1);
		SearchPos.Pos.Update(CurPos, Depth);
		SearchPos.Found = true;
		return true;
	}

	while (CurPos < Count)
	{
		this.Content[CurPos].Get_RightPos(SearchPos, ContentPos, Depth + 1, false, StepEnd);
		SearchPos.Pos.Update(CurPos, Depth);

		if (true === SearchPos.Found)
		{
			var oRunElement = this.Get_RunElementByPos(SearchPos.Pos);
			if (oRunElement && oRunElement.IsDiacriticalSymbol && oRunElement.IsDiacriticalSymbol())
			{
				SearchPos.Found = false;
				continue;
			}

			return true;
		}

		CurPos++;
	}

	return false;
};
Paragraph.prototype.Get_WordStartPos = function(SearchPos, ContentPos)
{
	SearchPos.InitComplexFields(this.GetComplexFieldsByPos(ContentPos, true));

	var Depth  = 0;
	var CurPos = ContentPos.Get(Depth);

	this.Content[CurPos].Get_WordStartPos(SearchPos, ContentPos, Depth + 1, true);

	if (true === SearchPos.UpdatePos)
		SearchPos.Pos.Update(CurPos, Depth);

	if (true === SearchPos.Found)
		return;

	CurPos--;

	if (SearchPos.Shift && CurPos >= 0 && this.Content[CurPos].IsStopCursorOnEntryExit())
	{
		SearchPos.Found = true;
		return;
	}

	if (CurPos >= 0 && this.Content[CurPos + 1].IsStopCursorOnEntryExit())
	{
		this.Content[CurPos].Get_EndPos(false, SearchPos.Pos, Depth + 1);
		SearchPos.Pos.Update(CurPos, Depth);
		SearchPos.Found = true;
		return;
	}

	while (CurPos >= 0)
	{
		this.Content[CurPos].Get_WordStartPos(SearchPos, ContentPos, Depth + 1, false);

		if (true === SearchPos.UpdatePos)
			SearchPos.Pos.Update(CurPos, Depth);

		if (true === SearchPos.Found)
			return;

		CurPos--;

		if (SearchPos.Shift && CurPos >= 0 && this.Content[CurPos].IsStopCursorOnEntryExit())
		{
			SearchPos.Found = true;
			return;
		}

		if (CurPos >= 0 && this.Content[CurPos + 1].IsStopCursorOnEntryExit())
		{
			this.Content[CurPos].Get_EndPos(false, SearchPos.Pos, Depth + 1);
			SearchPos.Pos.Update(CurPos, Depth);
			SearchPos.Found = true;
			return;
		}
	}

	if (SearchPos.Shift)
		SearchPos.Found = true;
};
Paragraph.prototype.Get_WordEndPos = function(SearchPos, ContentPos, StepEnd)
{
	SearchPos.InitComplexFields(this.GetComplexFieldsByPos(ContentPos, true));

	var Depth  = 0;
	var CurPos = ContentPos.Get(Depth);

	this.Content[CurPos].Get_WordEndPos(SearchPos, ContentPos, Depth + 1, true, StepEnd);

	if (true === SearchPos.UpdatePos)
		SearchPos.Pos.Update(CurPos, Depth);

	if (true === SearchPos.Found)
		return;

	CurPos++;

	var Count = this.Content.length;

	if (SearchPos.Shift && CurPos < Count && this.Content[CurPos].IsStopCursorOnEntryExit())
	{
		SearchPos.Found = true;
		return;
	}

	if (CurPos < Count && this.Content[CurPos - 1].IsStopCursorOnEntryExit())
	{
		this.Content[CurPos].Get_StartPos(SearchPos.Pos, Depth + 1);
		SearchPos.Pos.Update(CurPos, Depth);
		SearchPos.Found = true;
		return;
	}

	while (CurPos < Count)
	{
		this.Content[CurPos].Get_WordEndPos(SearchPos, ContentPos, Depth + 1, false, StepEnd);

		if (true === SearchPos.UpdatePos)
			SearchPos.Pos.Update(CurPos, Depth);

		if (true === SearchPos.Found)
			return;

		CurPos++;

		if (SearchPos.Shift && CurPos < Count && this.Content[CurPos].IsStopCursorOnEntryExit())
		{
			SearchPos.Found = true;
			return;
		}

		if (CurPos < Count && this.Content[CurPos - 1].IsStopCursorOnEntryExit())
		{
			this.Content[CurPos].Get_StartPos(SearchPos.Pos, Depth + 1);
			SearchPos.Pos.Update(CurPos, Depth);
			SearchPos.Found = true;
			return;
		}
	}

	if (SearchPos.Shift)
		SearchPos.Found = true;
};
Paragraph.prototype.Get_EndRangePos = function(SearchPos, ContentPos)
{
	var LinePos = this.Get_ParaPosByContentPos(ContentPos);

	var CurLine  = LinePos.Line;
	var CurRange = LinePos.Range;

	if (this.Lines.length <= 0 || !this.Lines[CurLine] || !this.Lines[CurLine].Ranges[CurRange])
	{
		SearchPos.Pos   = this.Get_EndPos();
		SearchPos.Line  = 0;
		SearchPos.Range = 0;
		return;
	}

	var Range    = this.Lines[CurLine].Ranges[CurRange];
	var StartPos = Range.StartPos;
	var EndPos   = Range.EndPos;

	SearchPos.Line  = CurLine;
	SearchPos.Range = CurRange;

	// Ищем в данном отрезке
	for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
	{
		var Item = this.Content[CurPos];

		if (true === Item.Get_EndRangePos(CurLine, CurRange, SearchPos, 1))
			SearchPos.Pos.Update(CurPos, 0);
	}
};
Paragraph.prototype.Get_StartRangePos = function(SearchPos, ContentPos)
{
	var LinePos = this.Get_ParaPosByContentPos(ContentPos);

	var CurLine  = LinePos.Line;
	var CurRange = LinePos.Range;

	if (this.Lines.length <= 0 || !this.Lines[CurLine] || !this.Lines[CurLine].Ranges[CurRange])
	{
		SearchPos.Pos   = this.Get_StartPos();
		SearchPos.Line  = 0;
		SearchPos.Range = 0;
		return;
	}

	var Range    = this.Lines[CurLine].Ranges[CurRange];
	var StartPos = Range.StartPos;
	var EndPos   = Range.EndPos;

	SearchPos.Line  = CurLine;
	SearchPos.Range = CurRange;

	// Ищем в данном отрезке
	for (var CurPos = EndPos; CurPos >= StartPos; CurPos--)
	{
		var Item = this.Content[CurPos];

		if (true === Item.Get_StartRangePos(CurLine, CurRange, SearchPos, 1))
			SearchPos.Pos.Update(CurPos, 0);
	}
};
Paragraph.prototype.Get_StartRangePos2 = function(CurLine, CurRange)
{
	var ContentPos = new CParagraphContentPos();
	var Depth      = 0;

	var Pos = this.Lines[CurLine].Ranges[CurRange].StartPos;
	ContentPos.Update(Pos, Depth);

	this.Content[Pos].Get_StartRangePos2(CurLine, CurRange, ContentPos, Depth + 1);
	return ContentPos;
};
Paragraph.prototype.Get_EndRangePos2 = function(CurLine, CurRange)
{
	var ContentPos = new CParagraphContentPos();
	if (!this.Lines[CurLine] || !this.Lines[CurLine].Ranges[CurRange])
		return ContentPos;

	var Depth = 0;
	var Pos   = this.Lines[CurLine].Ranges[CurRange].EndPos;
	ContentPos.Update(Pos, Depth);
	this.Content[Pos].Get_EndRangePos2(CurLine, CurRange, ContentPos, Depth + 1);
	return ContentPos;
};
Paragraph.prototype.Get_StartPos = function()
{
	var ContentPos = new CParagraphContentPos();
	var Depth      = 0;

	ContentPos.Update(0, Depth);

	this.Content[0].Get_StartPos(ContentPos, Depth + 1);
	return ContentPos;
};
/**
 * Получаем начальную позицию в параграфе
 * @returns {CParagraphContentPos}
 */
Paragraph.prototype.GetStartPos = function()
{
	return this.Get_StartPos();
};
Paragraph.prototype.Get_EndPos = function(BehindEnd)
{
	var ContentPos = new CParagraphContentPos();
	var Depth      = 0;

	var ContentLen = this.Content.length;
	ContentPos.Update(ContentLen - 1, Depth);

	this.Content[ContentLen - 1].Get_EndPos(BehindEnd, ContentPos, Depth + 1);
	return ContentPos;
};
Paragraph.prototype.Get_EndPos2 = function(BehindEnd)
{
	var ContentPos = new CParagraphContentPos();
	var Depth      = 0;

	var ContentLen = this.Content.length;
	var Pos;
	if (this.Content.length > 1)
	{
		Pos = ContentLen - 2;
	}
	else
	{
		Pos = ContentLen - 1;
	}

	ContentPos.Update(Pos, Depth);

	this.Content[Pos].Get_EndPos(BehindEnd, ContentPos, Depth + 1);
	return ContentPos;
};
/**
 * Составляем список элементов рана, идущих после заданной позиции
 * @param oRunElements {CParagraphRunElements}
 */
Paragraph.prototype.GetNextRunElements = function(oRunElements)
{
	var ContentPos = oRunElements.ContentPos;
	var CurPos     = ContentPos.Get(0);
	var ContentLen = this.Content.length;

	oRunElements.UpdatePos(CurPos, 0);
	this.Content[CurPos].GetNextRunElements(oRunElements, true, 1);

	CurPos++;
	while (CurPos < ContentLen)
	{
		if (oRunElements.IsEnoughElements())
			break;

		oRunElements.UpdatePos(CurPos, 0);
		this.Content[CurPos].GetNextRunElements(oRunElements, false, 1);

		if (oRunElements.Count <= 0)
			break;

		CurPos++;
	}

	oRunElements.CheckEnd();
};
/**
 * Составляем список элементов рана, идущих до заданной позиции
 * @param oRunElements {CParagraphRunElements}
 */
Paragraph.prototype.GetPrevRunElements = function(oRunElements)
{
	var ContentPos = oRunElements.ContentPos;
	var CurPos     = ContentPos.Get(0);

	oRunElements.UpdatePos(CurPos, 0);
	this.Content[CurPos].GetPrevRunElements(oRunElements, true, 1);

	CurPos--;

	while (CurPos >= 0)
	{
		if (oRunElements.IsEnoughElements())
			break;

		oRunElements.UpdatePos(CurPos, 0);
		this.Content[CurPos].GetPrevRunElements(oRunElements, false, 1);

		CurPos--;
	}

	oRunElements.CheckEnd();
};
/**
 * Получаем следующий за курсором элемент рана
 * @returns {?CRunElementBase}
 */
Paragraph.prototype.GetNextRunElement = function()
{
	var oRunElements = new CParagraphRunElements(this.Get_ParaContentPos(this.Selection.Use, false, false), 1, null);
	this.GetNextRunElements(oRunElements);

	if (oRunElements.Elements.length <= 0)
		return null;

	return oRunElements.Elements[0];
};
/**
 * Получаем идущий до курсора элемент рана
 * @returns {?CRunElementBase}
 */
Paragraph.prototype.GetPrevRunElement = function()
{
	var oRunElements = new CParagraphRunElements(this.Get_ParaContentPos(this.Selection.Use, false, false), 1, null);
	this.GetPrevRunElements(oRunElements);

	if (oRunElements.Elements.length <= 0)
		return null;

	return oRunElements.Elements[0];
};
Paragraph.prototype.MoveCursorUp = function(AddToSelect)
{
	var Result = true;
	if (true === this.Selection.Use)
	{
		var SelectionStartPos = this.Get_ParaContentPos(true, true);
		var SelectionEndPos   = this.Get_ParaContentPos(true, false);

		if (true === AddToSelect)
		{
			var LinePos = this.Get_ParaPosByContentPos(SelectionEndPos);
			var CurLine = LinePos.Line;

			if (0 == CurLine)
			{
				EndPos = this.Get_StartPos();

				// Переходим в предыдущий элемент документа
				Result = false;
			}
			else
			{
				this.MoveCursorToXY(this.CurPos.RealX, CurLine - 1, true, true);
				EndPos = this.Get_ParaContentPos(false, false);
			}

			this.Selection.Use = true;
			this.Set_SelectionContentPos(SelectionStartPos, EndPos);
		}
		else
		{
			var TopPos = SelectionStartPos;
			if (SelectionStartPos.Compare(SelectionEndPos) > 0)
				TopPos = SelectionEndPos;

			var LinePos  = this.Get_ParaPosByContentPos(TopPos);
			var CurLine  = LinePos.Line;
			var CurRange = LinePos.Range;

			// Пересчитаем координату точки TopPos
			this.Set_ParaContentPos(TopPos, false, CurLine, CurRange);

			this.Internal_Recalculate_CurPos(0, true, false, false);
			this.CurPos.RealX = this.CurPos.X;
			this.CurPos.RealY = this.CurPos.Y;

			this.RemoveSelection();

			if (0 == CurLine)
			{
				return false;
			}
			else
			{
				this.MoveCursorToXY(this.CurPos.RealX, CurLine - 1, true, true);
			}
		}
	}
	else
	{
		var LinePos = this.GetCurrentParaPos();
		var CurLine = LinePos.Line;

		if (true === AddToSelect)
		{
			var StartPos = this.Get_ParaContentPos(false, false);
			var EndPos   = null;

			if (0 == CurLine)
			{
				EndPos = this.Get_StartPos();

				// Переходим в предыдущий элемент документа
				Result = false;
			}
			else
			{
				this.MoveCursorToXY(this.CurPos.RealX, CurLine - 1, true, true);
				EndPos = this.Get_ParaContentPos(false, false);
			}

			this.Selection.Use = true;
			this.Set_SelectionContentPos(StartPos, EndPos);
		}
		else
		{
			if (0 == CurLine)
			{
				// Возвращяем значение false, это означает, что надо перейти в
				// предыдущий элемент контента документа.
				return false;
			}
			else
			{
				this.MoveCursorToXY(this.CurPos.RealX, CurLine - 1, true, true);
			}
		}
	}

	return Result;
};
Paragraph.prototype.MoveCursorDown = function(AddToSelect)
{
	var Result = true;
	if (true === this.Selection.Use)
	{
		var SelectionStartPos = this.Get_ParaContentPos(true, true);
		var SelectionEndPos   = this.Get_ParaContentPos(true, false);

		if (true === AddToSelect)
		{
			var LinePos = this.Get_ParaPosByContentPos(SelectionEndPos);
			var CurLine = LinePos.Line;

			if (this.Lines.length - 1 == CurLine)
			{
				EndPos = this.Get_EndPos(true);

				// Переходим в предыдущий элемент документа
				Result = false;
			}
			else
			{
				this.MoveCursorToXY(this.CurPos.RealX, CurLine + 1, true, true);
				EndPos = this.Get_ParaContentPos(false, false);
			}

			this.Selection.Use = true;
			this.Set_SelectionContentPos(SelectionStartPos, EndPos);
		}
		else
		{
			var BottomPos = SelectionEndPos;
			if (SelectionStartPos.Compare(SelectionEndPos) > 0)
				BottomPos = SelectionStartPos;

			var LinePos  = this.Get_ParaPosByContentPos(BottomPos);
			var CurLine  = LinePos.Line;
			var CurRange = LinePos.Range;

			// Пересчитаем координату BottomPos
			this.Set_ParaContentPos(BottomPos, false, CurLine, CurRange);

			this.Internal_Recalculate_CurPos(0, true, false, false);
			this.CurPos.RealX = this.CurPos.X;
			this.CurPos.RealY = this.CurPos.Y;

			this.RemoveSelection();

			if (this.Lines.length - 1 == CurLine)
			{
				return false;
			}
			else
			{
				this.MoveCursorToXY(this.CurPos.RealX, CurLine + 1, true, true);
			}
		}
	}
	else
	{
		var LinePos = this.GetCurrentParaPos();
		var CurLine = LinePos.Line;

		if (true === AddToSelect)
		{
			var StartPos = this.Get_ParaContentPos(false, false);
			var EndPos   = null;

			if (this.Lines.length - 1 == CurLine)
			{
				EndPos = this.Get_EndPos(true);

				// Переходим в предыдущий элемент документа
				Result = false;
			}
			else
			{
				this.MoveCursorToXY(this.CurPos.RealX, CurLine + 1, true, true);
				EndPos = this.Get_ParaContentPos(false, false);
			}

			this.Selection.Use = true;
			this.Set_SelectionContentPos(StartPos, EndPos);
		}
		else
		{
			if (this.Lines.length - 1 == CurLine)
			{
				// Возвращяем значение false, это означает, что надо перейти в
				// предыдущий элемент контента документа.
				return false;
			}
			else
			{
				this.MoveCursorToXY(this.CurPos.RealX, CurLine + 1, true, true);
			}
		}
	}

	return Result;
};
Paragraph.prototype.MoveCursorToEndOfLine = function(AddToSelect)
{
	if (true === this.Selection.Use)
	{
		var EndSelectionPos   = this.Get_ParaContentPos(true, false);
		var StartSelectionPos = this.Get_ParaContentPos(true, true);

		if (true === AddToSelect)
		{
			var SearchPos = new CParagraphSearchPos();
			this.Get_EndRangePos(SearchPos, EndSelectionPos);

			this.Set_SelectionContentPos(StartSelectionPos, SearchPos.Pos);
		}
		else
		{
			var RightPos = EndSelectionPos;
			if (EndSelectionPos.Compare(StartSelectionPos) < 0)
				RightPos = StartSelectionPos;

			var SearchPos = new CParagraphSearchPos();
			this.Get_EndRangePos(SearchPos, RightPos);

			this.RemoveSelection();

			this.Set_ParaContentPos(SearchPos.Pos, false, SearchPos.Line, SearchPos.Range);
		}
	}
	else
	{
		var SearchPos  = new CParagraphSearchPos();
		var ContentPos = this.Get_ParaContentPos(false, false);
		this.Get_EndRangePos(SearchPos, ContentPos);

		if (true === AddToSelect)
		{
			this.Selection.Use = true;
			this.Set_SelectionContentPos(ContentPos, SearchPos.Pos);
		}
		else
		{
			this.Set_ParaContentPos(SearchPos.Pos, false, SearchPos.Line, SearchPos.Range);
		}
	}

	// Обновляем текущую позицию X,Y. Если есть селект, тогда обновляем по концу селекта
	if (true === this.Selection.Use)
	{
		var SelectionEndPos = this.Get_ParaContentPos(true, false);
		this.Set_ParaContentPos(SelectionEndPos, false, -1, -1);
	}

	this.Internal_Recalculate_CurPos(this.CurPos.ContentPos, true, false, false);

	this.CurPos.RealX = this.CurPos.X;
	this.CurPos.RealY = this.CurPos.Y;
};
Paragraph.prototype.MoveCursorToStartOfLine = function(AddToSelect)
{
	if (true === this.Selection.Use)
	{
		var EndSelectionPos   = this.Get_ParaContentPos(true, false);
		var StartSelectionPos = this.Get_ParaContentPos(true, true);

		if (true === AddToSelect)
		{
			var SearchPos = new CParagraphSearchPos();
			this.Get_StartRangePos(SearchPos, EndSelectionPos);

			this.Set_SelectionContentPos(StartSelectionPos, SearchPos.Pos);
		}
		else
		{
			var LeftPos = StartSelectionPos;
			if (StartSelectionPos.Compare(EndSelectionPos) > 0)
				LeftPos = EndSelectionPos;

			var SearchPos = new CParagraphSearchPos();
			this.Get_StartRangePos(SearchPos, LeftPos);

			this.RemoveSelection();

			this.Set_ParaContentPos(SearchPos.Pos, false, SearchPos.Line, SearchPos.Range);
		}
	}
	else
	{
		var SearchPos  = new CParagraphSearchPos();
		var ContentPos = this.Get_ParaContentPos(false, false);

		this.Get_StartRangePos(SearchPos, ContentPos);

		if (true === AddToSelect)
		{
			this.Selection.Use = true;
			this.Set_SelectionContentPos(ContentPos, SearchPos.Pos);
		}
		else
		{
			this.Set_ParaContentPos(SearchPos.Pos, false, SearchPos.Line, SearchPos.Range);
		}
	}

	// Обновляем текущую позицию X,Y. Если есть селект, тогда обновляем по концу селекта
	if (true === this.Selection.Use)
	{
		var SelectionEndPos = this.Get_ParaContentPos(true, false);
		this.Set_ParaContentPos(SelectionEndPos, false, -1, -1);
	}

	this.Internal_Recalculate_CurPos(this.CurPos.ContentPos, true, false, false);

	this.CurPos.RealX = this.CurPos.X;
	this.CurPos.RealY = this.CurPos.Y;
};
Paragraph.prototype.MoveCursorToStartPos = function(AddToSelect)
{
	if (true === AddToSelect)
	{
		var StartPos = null;

		if (true === this.Selection.Use)
			StartPos = this.Get_ParaContentPos(true, true);
		else
			StartPos = this.Get_ParaContentPos(false, false);

		var EndPos = this.Get_StartPos();

		this.Selection.Use   = true;
		this.Selection.Start = false;

		this.Set_SelectionContentPos(StartPos, EndPos);
	}
	else
	{
		this.RemoveSelection();

		this.CurPos.ContentPos = 0;
		this.CurPos.Line       = -1;
		this.CurPos.Range      = -1;

		if (this.Content.length > 0)
		{
			this.Content[0].MoveCursorToStartPos();
			this.Correct_ContentPos(false);
			this.Correct_ContentPos2();
		}
	}
};
Paragraph.prototype.SkipPageColumnBreaks = function()
{
	if (this.Selection.Use)
		return;

	var oRunItem = this.GetNextRunElement();
	while (oRunItem && para_NewLine === oRunItem.Type && oRunItem.IsPageOrColumnBreak())
	{
		this.MoveCursorRight();
		var oNextRunItem = this.GetNextRunElement();
		if (oNextRunItem === oRunItem)
			return;

		oRunItem = oNextRunItem;
	}
};
Paragraph.prototype.MoveCursorToEndPos = function(AddToSelect, StartSelectFromEnd)
{
	if (true === AddToSelect)
	{
		var StartPos = null;

		if (true === this.Selection.Use)
			StartPos = this.Get_ParaContentPos(true, true);
		else if (true === StartSelectFromEnd)
			StartPos = this.Get_EndPos(true);
		else
			StartPos = this.Get_ParaContentPos(false, false);

		var EndPos = this.Get_EndPos(true);

		this.Selection.Use   = true;
		this.Selection.Start = false;

		this.Set_SelectionContentPos(StartPos, EndPos);
	}
	else
	{
		if (true === StartSelectFromEnd)
		{
			this.Selection.Use   = true;
			this.Selection.Start = false;

			this.Selection.StartPos = this.Content.length - 1;
			this.Selection.EndPos   = this.Content.length - 1;

			this.CurPos.ContentPos = this.Content.length - 1;

			this.Content[this.CurPos.ContentPos].MoveCursorToEndPos(true);
		}
		else
		{
			this.RemoveSelection();

			this.CurPos.ContentPos = this.Content.length - 1;
			this.CurPos.Line       = -1;
			this.CurPos.Range      = -1;
			this.Content[this.CurPos.ContentPos].MoveCursorToEndPos();
			this.Correct_ContentPos(false);
			this.Correct_ContentPos2();
		}
	}
};
Paragraph.prototype.Cursor_MoveToNearPos = function(NearPos)
{
	this.Set_ParaContentPos(NearPos.ContentPos, true, -1, -1);

	this.Selection.Use = true;
	this.Set_SelectionContentPos(NearPos.ContentPos, NearPos.ContentPos);

	var SelectionStartPos = this.Get_ParaContentPos(true, true);
	var SelectionEndPos   = this.Get_ParaContentPos(true, false);

	if (0 === SelectionStartPos.Compare(SelectionEndPos))
		this.RemoveSelection();
};
Paragraph.prototype.MoveCursorUpToLastRow = function(X, Y, AddToSelect)
{
	this.CurPos.RealX = X;
	this.CurPos.RealY = Y;

	// Перемещаем курсор в последнюю строку, с позицией, самой близкой по X
	this.MoveCursorToXY(X, this.Lines.length - 1, true, true, this.Pages.length - 1);

	if (true === AddToSelect)
	{
		if (false === this.Selection.Use)
		{
			this.Selection.Use = true;
			this.Set_SelectionContentPos(this.Get_EndPos(true), this.Get_ParaContentPos(false, false));
		}
		else
		{
			this.Set_SelectionContentPos(this.Get_ParaContentPos(true, true), this.Get_ParaContentPos(false, false));
		}
	}
};
Paragraph.prototype.MoveCursorDownToFirstRow = function(X, Y, AddToSelect)
{
	this.CurPos.RealX = X;
	this.CurPos.RealY = Y;

	// Перемещаем курсор в первую строку, с позицией, самой близкой по X
	this.MoveCursorToXY(X, 0, true, true, 0);

	if (true === AddToSelect)
	{
		if (false === this.Selection.Use)
		{
			this.Selection.Use = true;
			this.Set_SelectionContentPos(this.Get_StartPos(), this.Get_ParaContentPos(false, false));
		}
		else
		{
			this.Set_SelectionContentPos(this.Get_ParaContentPos(true, true), this.Get_ParaContentPos(false, false));
		}
	}
};
Paragraph.prototype.Cursor_MoveTo_Drawing = function(Id, bBefore)
{
	if (undefined === bBefore)
		bBefore = true;

	var ContentPos = new CParagraphContentPos();

	var ContentLen = this.Content.length;

	var bFind = false;

	for (var CurPos = 0; CurPos < ContentLen; CurPos++)
	{
		var Element = this.Content[CurPos];

		ContentPos.Update(CurPos, 0);

		if (true === Element.Get_PosByDrawing(Id, ContentPos, 1))
		{
			bFind = true;
			break;
		}
	}

	if (false === bFind || ContentPos.Depth <= 0)
		return;

	if (true != bBefore)
		ContentPos.Data[ContentPos.Depth - 1]++;

	this.RemoveSelection();
	this.Set_ParaContentPos(ContentPos, false, -1, -1);

	this.RecalculateCurPos();
	this.CurPos.RealX = this.CurPos.X;
	this.CurPos.RealY = this.CurPos.Y;
};
Paragraph.prototype.GetCurPosXY = function()
{
	return {X : this.CurPos.RealX, Y : this.CurPos.RealY};
};
Paragraph.prototype.IsSelectionUse = function()
{
	return this.Selection.Use;
};
Paragraph.prototype.IsSelectionToEnd = function()
{
	return this.Selection_CheckParaEnd();
};
/**
 * Функция определяет начальную позицию курсора в параграфе
 */
Paragraph.prototype.Internal_GetStartPos = function()
{
	var oPos = this.Internal_FindForward(0, [para_PageNum, para_Drawing, para_Tab, para_Text, para_Space, para_NewLine, para_End, para_Math]);
	if (true === oPos.Found)
		return oPos.LetterPos;

	return 0;
};
/**
 * Функция определяет конечную позицию в параграфе
 */
Paragraph.prototype.Internal_GetEndPos = function()
{
	var Res = this.Internal_FindBackward(this.Content.length - 1, [para_End]);
	if (true === Res.Found)
		return Res.LetterPos;

	return 0;
};
/**
 * Корректируем содержимое параграфа
 */
Paragraph.prototype.CorrectContent = function()
{
	this.Correct_Content();

	if (this.CurPos.ContentPos >= this.Content.length - 1)
		this.MoveCursorToEndPos();
};
Paragraph.prototype.Correct_Content = function(_StartPos, _EndPos, bDoNotDeleteEmptyRuns)
{
	// Если у нас сейчас в данном параграфе используется ссылка на позицию, тогда мы не корректируем контент, чтобы
	// не удалить место, на которое идет ссылка.
	if (this.NearPosArray.length >= 1)
		return;

	// В данной функции мы корректируем содержимое параграфа:
	// 1. Спаренные пустые раны мы удаляем (удаляем 1 ран)
	// 2. Удаляем пустые гиперссылки, пустые формулы, пустые поля
	// 3. Добавляем пустой ран в место, где нет рана (например, между двумя идущими подряд гиперссылками)

	var StartPos = ( undefined === _StartPos || null === _StartPos ? 0 : Math.max(_StartPos - 1, 0) );
	var EndPos   = ( undefined === _EndPos || null === _EndPos ? this.Content.length - 1 : Math.min(_EndPos + 1, this.Content.length - 1) );

	for (var CurPos = EndPos; CurPos >= StartPos; CurPos--)
	{
		var CurElement = this.Content[CurPos];

		if ((para_Hyperlink === CurElement.Type || para_Math === CurElement.Type || para_Field === CurElement.Type || para_InlineLevelSdt === CurElement.Type) && true === CurElement.Is_Empty() && true !== CurElement.Is_CheckingNearestPos())
		{
			this.Internal_Content_Remove(CurPos);
		}
		else if (para_Run !== CurElement.Type)
		{
			if (CurPos === this.Content.length - 1 || para_Run !== this.Content[CurPos + 1].Type || CurPos === this.Content.length - 2)
			{
				var NewRun = new ParaRun(this);
				this.Internal_Content_Add(CurPos + 1, NewRun);
			}

			// Для начального элемента проверим еще и предыдущий
			if (StartPos === CurPos && ( 0 === CurPos || para_Run !== this.Content[CurPos - 1].Type  ))
			{
				var NewRun = new ParaRun(this);
				this.Internal_Content_Add(CurPos, NewRun);
			}
		}
		else
		{
			if (true !== bDoNotDeleteEmptyRuns)
			{
				// TODO (Para_End): Предпоследний элемент мы не проверяем, т.к. на ран с Para_End мы не ориентируемся
				if (true === CurElement.Is_Empty() && (0 < CurPos || para_Run !== this.Content[CurPos].Type) && CurPos < this.Content.length - 2 && para_Run === this.Content[CurPos + 1].Type)
					this.Internal_Content_Remove(CurPos);
			}
		}
	}

	// Проверим, чтобы предпоследний элемент был Run
	if (1 === this.Content.length || para_Run !== this.Content[this.Content.length - 2].Type)
	{
		var NewRun = new ParaRun(this);
		NewRun.Set_Pr(this.TextPr.Value.Copy());
		this.Internal_Content_Add(this.Content.length - 1, NewRun);
	}

	this.Correct_ContentPos2();
};
Paragraph.prototype.Apply_TextPr = function(TextPr, IncFontSize)
{
	// Данная функция работает по следующему принципу: если задано выделение, тогда применяем настройки к
	// выделенной части, а если выделения нет, тогда в текущее положение вставляем пустой ран с заданными настройками
	// и переносим курсор в данный ран.

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;

		if (StartPos === EndPos)
		{
			var NewElements = this.Content[EndPos].Apply_TextPr(TextPr, IncFontSize, false);

			if (para_Run === this.Content[EndPos].Type)
			{
				this.Internal_ReplaceRun(EndPos, NewElements);
			}
		}
		else
		{
			var Direction = 1;
			if (StartPos > EndPos)
			{
				var Temp = StartPos;
				StartPos = EndPos;
				EndPos   = Temp;

				Direction = -1;
			}

			for (var CurPos = StartPos + 1; CurPos < EndPos; CurPos++)
			{
				this.Content[CurPos].Apply_TextPr(TextPr, IncFontSize, false);
			}

			var bCorrectContent = false;

			var NewElements = this.Content[EndPos].Apply_TextPr(TextPr, IncFontSize, false);
			if (para_Run === this.Content[EndPos].Type)
			{
				this.Internal_ReplaceRun(EndPos, NewElements);
				bCorrectContent = true;
			}

			var NewElements = this.Content[StartPos].Apply_TextPr(TextPr, IncFontSize, false);
			if (para_Run === this.Content[StartPos].Type)
			{
				this.Internal_ReplaceRun(StartPos, NewElements);
				bCorrectContent = true;
			}

			if (true === bCorrectContent)
				this.Correct_Content();
		}
	}
	else
	{
		var Pos         = this.CurPos.ContentPos;
		var Element     = this.Content[Pos];
		var NewElements = Element.Apply_TextPr(TextPr, IncFontSize, false);

		if (para_Run === Element.Type)
		{
			this.Internal_ReplaceRun(Pos, NewElements);
		}

		if (true === this.IsCursorAtEnd() && undefined === this.GetNumPr())
		{
			if (undefined === IncFontSize)
			{
				if (!TextPr.AscFill && !TextPr.AscLine && !TextPr.AscUnifill)
				{
					this.TextPr.Apply_TextPr(TextPr);
				}
				else
				{
					var EndTextPr = this.Get_CompiledPr2(false).TextPr.Copy();
					EndTextPr.Merge(this.TextPr.Value);
					if (TextPr.AscFill)
					{
						this.TextPr.Set_TextFill(AscFormat.CorrectUniFill(TextPr.AscFill, EndTextPr.TextFill, 1));
					}
					if (TextPr.AscUnifill)
					{
						this.TextPr.Set_Unifill(AscFormat.CorrectUniFill(TextPr.AscUnifill, EndTextPr.Unifill, 0));
					}
					if (TextPr.AscLine)
					{
						this.TextPr.Set_TextOutline(AscFormat.CorrectUniStroke(TextPr.AscLine, EndTextPr.TextOutline, 0));
					}
				}
			}
			else
			{
				// Выставляем настройки для символа параграфа
				var EndTextPr = this.Get_CompiledPr2(false).TextPr.Copy();
				EndTextPr.Merge(this.TextPr.Value);

				// TODO: Как только перенесем историю изменений TextPr в сам класс CTextPr, переделать тут
				this.TextPr.Set_FontSize(FontSize_IncreaseDecreaseValue(IncFontSize, EndTextPr.FontSize));
			}

			// TODO (ParaEnd): Переделать
			var LastElement = this.Content[this.Content.length - 1];
			if (para_Run === LastElement.Type)
				LastElement.Set_Pr(this.TextPr.Value.Copy());
		}
	}
};
/**
 * Применяем текстовые настройки к выделенной части параграфа
 * @param {CTextPr} oTextPr
 * @param {boolean | undefined} isIncFontSize
 */
Paragraph.prototype.ApplyTextPr = function(oTextPr, isIncFontSize)
{
	return this.Apply_TextPr(oTextPr, isIncFontSize);
};
Paragraph.prototype.Internal_ReplaceRun = function(Pos, NewRuns)
{
	// По логике, можно удалить Run, стоящий в позиции Pos и добавить все раны, которые не null в массиве NewRuns.
	// Но, согласно работе ParaRun.Apply_TextPr, в массиве всегда идет ровно 3 рана (возможно null). Второй ран
	// всегда не null. Первый не null ран и есть ран, идущий в позиции Pos.

	var LRun = NewRuns[0];
	var CRun = NewRuns[1];
	var RRun = NewRuns[2];

	// CRun - всегда не null
	var CenterRunPos = Pos;

	var OldSelectionStartPos = this.Selection.StartPos;
	var OldSelectionEndPos   = this.Selection.EndPos;
	var OldCurPos            = this.CurPos.ContentPos;

	if (null !== LRun)
	{
		this.Internal_Content_Add(Pos + 1, CRun);
		CenterRunPos = Pos + 1;
	}
	else
	{
		// Если LRun - null, значит CRun - это и есть тот ран который стоит уже в позиции Pos
	}

	if (null !== RRun)
	{
		this.Internal_Content_Add(CenterRunPos + 1, RRun);
	}

	if (OldCurPos > Pos)
	{
		if (null !== LRun && null !== RRun)
			this.CurPos.ContentPos = OldCurPos + 2;
		else if (null !== RRun || null !== RRun)
			this.CurPos.ContentPos = OldCurPos + 1;
	}
	else if (OldCurPos === Pos)
	{
		this.CurPos.ContentPos = CenterRunPos;
	}
	this.CurPos.Line = -1;

	if (OldSelectionStartPos > Pos)
	{
		if (null !== LRun && null !== RRun)
			this.Selection.StartPos = OldSelectionStartPos + 2;
		else if (null !== RRun || null !== RRun)
			this.Selection.StartPos = OldSelectionStartPos + 1;
	}
	else if (OldSelectionStartPos === Pos)
	{
		if (OldSelectionEndPos > OldSelectionStartPos)
		{
			this.Selection.StartPos = Pos;
		}
		else if (OldSelectionEndPos < OldSelectionStartPos)
		{
			if (null !== LRun && null !== RRun)
				this.Selection.StartPos = Pos + 2;
			else if (null !== LRun || null !== RRun)
				this.Selection.StartPos = Pos + 1;
			else
				this.Selection.StartPos = Pos;
		}
		else
		{
			// TODO: Тут надо бы выяснить направление селекта
			this.Selection.StartPos = Pos;

			if (null !== LRun && null !== RRun)
				this.Selection.EndPos = Pos + 2;
			else if (null !== LRun || null !== RRun)
				this.Selection.EndPos = Pos + 1;
			else
				this.Selection.EndPos = Pos;
		}
	}

	if (OldSelectionEndPos > Pos)
	{
		if (null !== LRun && null !== RRun)
			this.Selection.EndPos = OldSelectionEndPos + 2;
		else if (null !== RRun || null !== RRun)
			this.Selection.EndPos = OldSelectionEndPos + 1;
	}
	else if (OldSelectionEndPos === Pos)
	{
		if (OldSelectionEndPos > OldSelectionStartPos)
		{
			if (null !== LRun && null !== RRun)
				this.Selection.EndPos = Pos + 2;
			else if (null !== LRun || null !== RRun)
				this.Selection.EndPos = Pos + 1;
			else
				this.Selection.EndPos = Pos;
		}
		else if (OldSelectionEndPos < OldSelectionStartPos)
		{
			this.Selection.EndPos = Pos;
		}
	}

	return CenterRunPos;
};
Paragraph.prototype.CheckHyperlink = function(X, Y, CurPage)
{
	var oInfo = new CSelectedElementsInfo();
	this.GetElementsInfoByXY(oInfo, X, Y, CurPage);
	return oInfo.GetHyperlink();
};
/**
 * Добавляем гиперссылку
 * @param {CHyperlinkProperty} HyperProps
 */
Paragraph.prototype.AddHyperlink = function(HyperProps)
{
	if (true === this.Selection.Use)
	{
		// Создаем гиперссылку
		var Hyperlink = new ParaHyperlink();

		// Заполняем гиперссылку полями
		if (undefined !== HyperProps.Anchor && null !== HyperProps.Anchor)
		{
			Hyperlink.SetAnchor(HyperProps.Anchor);
			Hyperlink.SetValue("")
		}
		else if (undefined != HyperProps.Value && null != HyperProps.Value)
		{
			Hyperlink.SetValue(HyperProps.Value);
			Hyperlink.SetAnchor("");
		}

		if (undefined != HyperProps.ToolTip && null != HyperProps.ToolTip)
			Hyperlink.SetToolTip(HyperProps.ToolTip);

		// Разделяем содержимое по меткам селекта
		var StartContentPos = this.Get_ParaContentPos(true, true);
		var EndContentPos   = this.Get_ParaContentPos(true, false);

		if (StartContentPos.Compare(EndContentPos) > 0)
		{
			var Temp        = StartContentPos;
			StartContentPos = EndContentPos;
			EndContentPos   = Temp;
		}

		// Если у нас попадает комментарий в данную область, тогда удалим его.
		// TODO: Переделать здесь, когда комментарии смогут лежать во всех классах (например в Hyperlink)

		var StartPos = StartContentPos.Get(0);
		var EndPos   = EndContentPos.Get(0);

		var CommentsToDelete = {};
		for (var Pos = StartPos; Pos <= EndPos; Pos++)
		{
			var Item = this.Content[Pos];
			if (para_Comment === Item.Type)
				CommentsToDelete[Item.CommentId] = true;
		}

		if(this.LogicDocument)
		{
			for (var CommentId in CommentsToDelete)
			{
				this.LogicDocument.RemoveComment(CommentId, true, false);
			}
		}

		// Еще раз обновим метки
		StartContentPos = this.Get_ParaContentPos(true, true);
		EndContentPos   = this.Get_ParaContentPos(true, false);

		if (StartContentPos.Compare(EndContentPos) > 0)
		{
			var Temp        = StartContentPos;
			StartContentPos = EndContentPos;
			EndContentPos   = Temp;
		}

		StartPos = StartContentPos.Get(0);
		EndPos   = EndContentPos.Get(0);

		// TODO: Как только избавимся от ParaEnd, здесь надо будет переделать.
		if (this.Content.length - 1 === EndPos && true === this.Selection_CheckParaEnd())
		{
			EndContentPos = this.Get_EndPos(false);
			EndPos        = EndContentPos.Get(0);
		}

		var NewElementE = this.Content[EndPos].Split(EndContentPos, 1);
		var NewElementS = this.Content[StartPos].Split(StartContentPos, 1);

		var HyperPos = 0;

		if (null !== NewElementS)
			Hyperlink.Add_ToContent(HyperPos++, NewElementS);

		for (var CurPos = StartPos + 1; CurPos <= EndPos; CurPos++)
		{
			Hyperlink.Add_ToContent(HyperPos++, this.Content[CurPos]);
		}

		if (0 === Hyperlink.Content.length)
		{
			Hyperlink.Add_ToContent(0, new ParaRun(this, false));
		}

		this.Internal_Content_Remove2(StartPos + 1, EndPos - StartPos);
		this.Internal_Content_Add(StartPos + 1, Hyperlink);

		if (null !== NewElementE)
			this.Internal_Content_Add(StartPos + 2, NewElementE);

		this.RemoveSelection();
		this.Selection.Use      = true;
		this.Selection.StartPos = StartPos + 1;
		this.Selection.EndPos   = StartPos + 1;

		Hyperlink.MoveCursorToStartPos();
		Hyperlink.SelectAll();

		// Выставляем специальную текстовую настройку
		var TextPr       = new CTextPr();
		TextPr.Color     = null;
		TextPr.Underline = null;
		TextPr.RStyle    = editor && editor.isDocumentEditor ? editor.WordControl.m_oLogicDocument.Get_Styles().GetDefaultHyperlink() : null;
		if (!this.bFromDocument)
		{
			//TextPr.Unifill   = AscFormat.CreateUniFillSchemeColorWidthTint(11, 0);
			TextPr.Underline = true;
		}
		Hyperlink.Apply_TextPr(TextPr, undefined, false);

		// Если мы находимся в режиме рецензирования, то пробегаемся по всему содержимому гиперссылки и
		// проставляем, что все раны новые.
		if (this.LogicDocument && true === this.LogicDocument.IsTrackRevisions())
			Hyperlink.SetReviewType(reviewtype_Add, true);
	}
	else if (null !== HyperProps.Text && "" !== HyperProps.Text)
	{
		var ContentPos = this.Get_ParaContentPos(false, false);
		var CurPos     = ContentPos.Get(0);

		var TextPr = this.Get_TextPr(ContentPos);
		if (undefined !== HyperProps.TextPr && null !== HyperProps.TextPr)
			TextPr = HyperProps.TextPr;

		// Создаем гиперссылку
		var Hyperlink = new ParaHyperlink();

		// Заполняем гиперссылку полями
		if (undefined !== HyperProps.Anchor && null !== HyperProps.Anchor)
		{
			Hyperlink.SetAnchor(HyperProps.Anchor);
			Hyperlink.SetValue("")
		}
		else if (undefined != HyperProps.Value && null != HyperProps.Value)
		{
			Hyperlink.SetValue(HyperProps.Value);
			Hyperlink.SetAnchor("");
		}

		if (undefined != HyperProps.ToolTip && null != HyperProps.ToolTip)
			Hyperlink.SetToolTip(HyperProps.ToolTip);

		// Создаем текстовый ран в гиперссылке
		var HyperRun = new ParaRun(this);

		// Добавляем ран в гиперссылку
		Hyperlink.Add_ToContent(0, HyperRun, false);

		// Задаем текстовые настройки рана (те, которые шли в текущей позиции + стиль гиперссылки)
		if (this.bFromDocument)
		{
			var Styles = editor.WordControl.m_oLogicDocument.Get_Styles();
			HyperRun.Set_Pr(TextPr.Copy());
			HyperRun.Set_Color(undefined);
			HyperRun.Set_Underline(undefined);
			HyperRun.Set_RStyle(Styles.GetDefaultHyperlink());
		}
		else
		{
			HyperRun.Set_Pr(TextPr.Copy());
			HyperRun.Set_Color(undefined);
			//HyperRun.Set_Unifill(AscFormat.CreateUniFillSchemeColorWidthTint(11, 0));
			HyperRun.Set_Underline(true);
		}

		// Заполняем ран гиперссылки текстом
		HyperRun.AddText(HyperProps.Text);

		// Разделяем текущий элемент (возвращается правая часть)
		var NewElement = this.Content[CurPos].Split(ContentPos, 1);

		if (null !== NewElement)
			this.Internal_Content_Add(CurPos + 1, NewElement);

		// Добавляем гиперссылку в содержимое параграфа
		this.Internal_Content_Add(CurPos + 1, Hyperlink);

		// Перемещаем кусор в конец гиперссылки
		this.CurPos.ContentPos = CurPos + 1;
		Hyperlink.MoveCursorToEndPos(false);
	}

	this.Correct_Content();
};
/**
 * Изменяем гиперссылку
 * @param {CHyperlinkProperty} HyperProps
 * @returns {boolean}
 */
Paragraph.prototype.ModifyHyperlink = function(HyperProps)
{
	var HyperPos = -1;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (StartPos > EndPos)
		{
			StartPos = this.Selection.EndPos;
			EndPos   = this.Selection.StartPos;
		}

		for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
		{
			var Element = this.Content[CurPos];

			if (true !== Element.IsSelectionEmpty() && para_Hyperlink !== Element.Type)
				break;
			else if (true !== Element.IsSelectionEmpty() && para_Hyperlink === Element.Type)
			{
				if (-1 === HyperPos)
					HyperPos = CurPos;
				else
					break;
			}
		}

		if (this.Selection.StartPos === this.Selection.EndPos && para_Hyperlink === this.Content[this.Selection.StartPos].Type)
			HyperPos = this.Selection.StartPos;
	}
	else
	{
		if (para_Hyperlink === this.Content[this.CurPos.ContentPos].Type)
			HyperPos = this.CurPos.ContentPos;
	}

	if (-1 != HyperPos)
	{
		var Hyperlink = this.Content[HyperPos];

		if (undefined !== HyperProps.Anchor && null !== HyperProps.Anchor)
		{
			Hyperlink.SetAnchor(HyperProps.Anchor);
			Hyperlink.SetValue("")
		}
		else if (undefined != HyperProps.Value && null != HyperProps.Value)
		{
			Hyperlink.SetValue(HyperProps.Value);
			Hyperlink.SetAnchor("");
		}

		if (undefined != HyperProps.ToolTip && null != HyperProps.ToolTip)
			Hyperlink.SetToolTip(HyperProps.ToolTip);

		if (null != HyperProps.Text)
		{
			var TextPr = Hyperlink.Get_TextPr();

			// Удаляем все что было в гиперссылке
			Hyperlink.Remove_FromContent(0, Hyperlink.Content.length);

			// Создаем текстовый ран в гиперссылке
			var HyperRun = new ParaRun(this);

			// Добавляем ран в гиперссылку
			Hyperlink.Add_ToContent(0, HyperRun, false);

			// Задаем текстовые настройки рана (те, которые шли в текущей позиции + стиль гиперссылки)
			if (this.bFromDocument)
			{
				var Styles = editor.WordControl.m_oLogicDocument.Get_Styles();
				HyperRun.Set_Pr(TextPr.Copy());
				HyperRun.Set_Color(undefined);
				HyperRun.Set_Underline(undefined);
				HyperRun.Set_RStyle(Styles.GetDefaultHyperlink());
			}
			else
			{
				HyperRun.Set_Pr(TextPr.Copy());
				HyperRun.Set_Color(undefined);
				HyperRun.Set_Unifill(AscFormat.CreateUniFillSchemeColorWidthTint(11, 0));
				HyperRun.Set_Underline(true);
			}


			// Заполняем ран гиперссылки текстом
			HyperRun.AddText(HyperProps.Text);

			// Перемещаем кусор в конец гиперссылки

			if (true === this.Selection.Use)
			{
				this.Selection.StartPos = HyperPos;
				this.Selection.EndPos   = HyperPos;

				Hyperlink.SelectAll();
			}
			else
			{
				this.CurPos.ContentPos = HyperPos;
				Hyperlink.MoveCursorToEndPos(false);
			}

			return true;
		}

		return false;
	}

	return false;
};
Paragraph.prototype.RemoveHyperlink = function()
{
	// Сначала найдем гиперссылку, которую нужно удалить
	var HyperPos = -1;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (StartPos > EndPos)
		{
			StartPos = this.Selection.EndPos;
			EndPos   = this.Selection.StartPos;
		}

		for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
		{
			var Element = this.Content[CurPos];

			if (true !== Element.IsSelectionEmpty() && para_Hyperlink !== Element.Type)
				break;
			else if (true !== Element.IsSelectionEmpty() && para_Hyperlink === Element.Type)
			{
				if (-1 === HyperPos)
					HyperPos = CurPos;
				else
					break;
			}
		}

		if (this.Selection.StartPos === this.Selection.EndPos && para_Hyperlink === this.Content[this.Selection.StartPos].Type)
			HyperPos = this.Selection.StartPos;
	}
	else
	{
		if (para_Hyperlink === this.Content[this.CurPos.ContentPos].Type)
			HyperPos = this.CurPos.ContentPos;
	}

	if (-1 !== HyperPos)
	{
		var Hyperlink = this.Content[HyperPos];

		var ContentLen = Hyperlink.Content.length;

		this.Internal_Content_Remove(HyperPos);

		var TextPr       = new CTextPr();
		TextPr.RStyle    = null;
		TextPr.Underline = null;
		TextPr.Color     = null;
		TextPr.Unifill   = null;

		for (var CurPos = 0; CurPos < ContentLen; CurPos++)
		{
			var Element = Hyperlink.Content[CurPos];
			this.Internal_Content_Add(HyperPos + CurPos, Element);
			Element.Apply_TextPr(TextPr, undefined, true);
		}

		if (true === this.Selection.Use)
		{
			this.Selection.StartPos = HyperPos + Hyperlink.State.Selection.StartPos;
			this.Selection.EndPos   = HyperPos + Hyperlink.State.Selection.EndPos;
		}
		else
		{
			this.CurPos.ContentPos = HyperPos + Hyperlink.State.ContentPos;
		}

		return true;
	}

	return false;
};
Paragraph.prototype.CanAddHyperlink = function(bCheckInHyperlink)
{
	if (true === bCheckInHyperlink)
	{
		if (true === this.Selection.Use)
		{
			// Если у нас в выделение попадает начало или конец гиперссылки, или конец параграфа, или
			// у нас все выделение находится внутри гиперссылки, тогда мы не можем добавить новую. Во
			// всех остальных случаях разрешаем добавить.
			// Также, если начало или конец выделения попадает в элемент, который нельзя разделить, тогда мы тоже
			// запрещаем добавление гиперссылки.

			var StartPos = this.Selection.StartPos;
			var EndPos   = this.Selection.EndPos;
			if (EndPos < StartPos)
			{
				StartPos = this.Selection.EndPos;
				EndPos   = this.Selection.StartPos;
			}

			if (false === this.Content[StartPos].CanSplit() || false === this.Content[EndPos].CanSplit())
				return false;

			// Проверяем не находимся ли мы внутри гиперссылки
			for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
			{
				var Element = this.Content[CurPos];
				if (para_Hyperlink === Element.Type || para_Math === Element.Type /*|| true === Element.Selection_CheckParaEnd()*/)
					return false;
			}

			return true;
		}
		else
		{
			// Если мы в элементе, который нельзя делить, тогда не разрешаем добавлять гиперссылку
			if (false === this.Content[this.CurPos.ContentPos].CanSplit())
				return false;

			// Внутри гиперссылки мы не можем задать ниперссылку
			var CurType = this.Content[this.CurPos.ContentPos].Type;
			if (para_Hyperlink === CurType || para_Math === CurType)
				return false;
			else
				return true;
		}
	}
	else
	{
		if (true === this.Selection.Use)
		{
			// Если у нас в выделение попадает несколько гиперссылок или конец параграфа, тогда
			// возвращаем false, во всех остальных случаях true
			// Также, если начало или конец выделения попадает в элемент, который нельзя разделить, тогда мы тоже
			// запрещаем добавление гиперссылки.

			var StartPos = this.Selection.StartPos;
			var EndPos   = this.Selection.EndPos;
			if (EndPos < StartPos)
			{
				StartPos = this.Selection.EndPos;
				EndPos   = this.Selection.StartPos;
			}

			if (false === this.Content[StartPos].CanSplit() || false === this.Content[EndPos].CanSplit())
				return false;

			var bHyper = false;

			for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
			{
				var Element = this.Content[CurPos];
				if ((true === bHyper && para_Hyperlink === Element.Type) || para_Math === Element.Type /*|| true === Element.Selection_CheckParaEnd()*/)
					return false;
				else if (true !== bHyper && para_Hyperlink === Element.Type)
					bHyper = true;
			}

			return true;
		}
		else
		{
			// Если мы в элементе, который нельзя делить, тогда не разрешаем добавлять гиперссылку
			if (false === this.Content[this.CurPos.ContentPos].CanSplit())
				return false;

			// Внутри гиперссылки мы не можем задать ниперссылку
			var CurType = this.Content[this.CurPos.ContentPos].Type;
			if (para_Math === CurType)
				return false;
			else
				return true;
		}
	}
};
Paragraph.prototype.IsCursorInHyperlink = function(bCheckEnd)
{
	if (true === this.Selection.Use)
		return null;

	var oInfo = new CSelectedElementsInfo();
	this.GetSelectedElementsInfo(oInfo, this.Get_ParaContentPos(false), 0);
	return oInfo.GetHyperlink();
};
Paragraph.prototype.Selection_SetStart = function(X, Y, CurPage, bTableBorder)
{
	// Избавляемся от старого селекта
	if (true === this.Selection.Use)
		this.RemoveSelection();

	// Найдем позицию в контенте, в которую мы попали (для селекта ищем и за знаком параграфа, для курсора только перед)
	var SearchPosXY  = this.Get_ParaContentPosByXY(X, Y, CurPage, false, true);
	var SearchPosXY2 = this.Get_ParaContentPosByXY(X, Y, CurPage, false, false);

	// Начинаем селект
	this.Selection.Use           = true;
	this.Selection.Start         = true;
	this.Selection.Flag          = selectionflag_Common;
	this.Selection.StartManually = true;

	// Выставим текущую позицию
	this.Set_ParaContentPos(SearchPosXY2.Pos, true, SearchPosXY2.Line, SearchPosXY2.Range);

	// Выставляем селект
	this.Set_SelectionContentPos(SearchPosXY.Pos, SearchPosXY.Pos);

	if (true === SearchPosXY.Numbering && undefined != this.GetNumPr())
	{
		this.Set_ParaContentPos(this.Get_StartPos(), true, -1, -1);
		this.Parent.SelectNumbering(this.GetNumPr(), this);
	}
};
/**
 * Данная функция может использоваться как при движении, так и при окончательном выставлении селекта.
 * Если bEnd = true, тогда это конец селекта.
 */
Paragraph.prototype.Selection_SetEnd = function(X, Y, CurPage, MouseEvent, bTableBorder)
{
	var PagesCount = this.Pages.length;

	if (this.bFromDocument && this.LogicDocument && true === this.LogicDocument.CanEdit() && null === this.Parent.IsHdrFtr(true) && null == this.Get_DocumentNext() && CurPage >= PagesCount - 1 && Y > this.Pages[PagesCount - 1].Bounds.Bottom && MouseEvent.ClickCount >= 2)
		return this.Parent.Extend_ToPos(X, Y);

	// Обновляем позицию курсора
	this.CurPos.RealX = X;
	this.CurPos.RealY = Y;

	this.Selection.EndManually = true;

	// Найдем позицию в контенте, в которую мы попали (для селекта ищем и за знаком параграфа, для курсора только перед)
	var SearchPosXY  = this.Get_ParaContentPosByXY(X, Y, CurPage, false, true, true);
	var SearchPosXY2 = this.Get_ParaContentPosByXY(X, Y, CurPage, false, false, true);

	// Выставим в полученном месте текущую позицию курсора
	this.Set_ParaContentPos(SearchPosXY2.Pos, true, SearchPosXY2.Line, SearchPosXY2.Range);

	if (true === SearchPosXY.End || true === this.Is_Empty())
	{
		var LastRange = this.Lines[this.Lines.length - 1].Ranges[this.Lines[this.Lines.length - 1].Ranges.length - 1];
		if (CurPage >= PagesCount - 1 && X > LastRange.W && MouseEvent.ClickCount >= 2 && Y <= this.Pages[PagesCount - 1].Bounds.Bottom)
		{
			if (this.bFromDocument && false === this.LogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
					Type      : AscCommon.changestype_2_Element_and_Type,
					Element   : this,
					CheckType : AscCommon.changestype_Paragraph_Content
				}))
			{
				this.LogicDocument.StartAction(AscDFH.historydescription_Document_ParagraphExtendToPos);
				this.LogicDocument.GetHistory().Set_Additional_ExtendDocumentToPos();

				if (this.Extend_ToPos(X))
				{
					this.RemoveSelection();
					this.MoveCursorToEndPos();
					this.Document_SetThisElementCurrent(true);
					this.LogicDocument.Recalculate();
				}

				this.LogicDocument.FinalizeAction();
				return;
			}
		}
	}

	// Выставляем селект
	this.Set_SelectionContentPos(this.Get_ParaContentPos(true, true), SearchPosXY.Pos);

	var SelectionStartPos = this.Get_ParaContentPos(true, true);
	var SelectionEndPos   = this.Get_ParaContentPos(true, false);

	if (0 === SelectionStartPos.Compare(SelectionEndPos) && AscCommon.g_mouse_event_type_up === MouseEvent.Type)
	{
		var oInfo = new CSelectedElementsInfo();
		this.GetSelectedElementsInfo(oInfo);
		var oField = oInfo.Get_Field();
		var oSdt   = oInfo.GetInlineLevelSdt();
		if (oSdt && oSdt.IsPlaceHolder())
		{
			oSdt.SelectAll(1);
			oSdt.SelectThisElement(1);
		}
		else  if (oField && fieldtype_FORMTEXT === oField.Get_FieldType())
		{
			oField.SelectAll(1);
			oField.SelectThisElement(1);
		}
		else
		{
			var ClickCounter = MouseEvent.ClickCount % 2;

			if (1 >= MouseEvent.ClickCount)
			{
				// Убираем селект. Позицию курсора можно не выставлять, т.к. она у нас установлена на конец селекта
				this.RemoveSelection();
			}
			else if (0 == ClickCounter)
			{
				// Выделяем слово, в котором находимся
				var SearchPosS = new CParagraphSearchPos();
				var SearchPosE = new CParagraphSearchPos();

				this.Get_WordEndPos(SearchPosE, SearchPosXY.Pos);
				this.Get_WordStartPos(SearchPosS, SearchPosE.Pos);

				var StartPos = ( true === SearchPosS.Found ? SearchPosS.Pos : this.Get_StartPos() );
				var EndPos   = ( true === SearchPosE.Found ? SearchPosE.Pos : this.Get_EndPos(false) );

				this.Selection.Use = true;
				this.Set_SelectionContentPos(StartPos, EndPos);

				if (this.LogicDocument)
					this.LogicDocument.Set_WordSelection();
			}
			else // ( 1 == ClickCounter % 2 )
			{
				// Выделяем весь параграф целиком

				this.SelectAll(1);
			}
		}
	}
};
Paragraph.prototype.StopSelection = function()
{
	this.Selection.Start = false;
};
Paragraph.prototype.RemoveSelection = function()
{
	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;

		if (StartPos > EndPos)
		{
			StartPos = this.Selection.EndPos;
			EndPos   = this.Selection.StartPos;
		}

		StartPos = Math.max(0, StartPos);
		EndPos   = Math.min(this.Content.length - 1, EndPos);

		for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
		{
			this.Content[CurPos].RemoveSelection();
		}
	}

	this.Selection.Use      = false;
	this.Selection.Start    = false;
	this.Selection.Flag     = selectionflag_Common;
	this.Selection.StartPos = 0;
	this.Selection.EndPos   = 0;
};
Paragraph.prototype.DrawSelectionOnPage = function(CurPage)
{
	if (true != this.Selection.Use)
		return;

	if (CurPage < 0 || CurPage >= this.Pages.length)
		return;

	var PageAbs = this.private_GetAbsolutePageIndex(CurPage);

	if (0 === CurPage && this.Pages[0].EndLine < 0)
		return;

	switch (this.Selection.Flag)
	{
		case selectionflag_Common:
		{
			// Делаем подсветку
			var StartPos = this.Selection.StartPos;
			var EndPos   = this.Selection.EndPos;

			if (StartPos > EndPos)
			{
				StartPos = this.Selection.EndPos;
				EndPos   = this.Selection.StartPos;
			}

			var _StartLine = this.Pages[CurPage].StartLine;
			var _EndLine   = this.Pages[CurPage].EndLine;

			if (StartPos > this.Lines[_EndLine].Get_EndPos() || EndPos < this.Lines[_StartLine].Get_StartPos())
				return;
			else
			{
				StartPos = Math.max(StartPos, this.Lines[_StartLine].Get_StartPos());
				EndPos   = Math.min(EndPos, ( _EndLine != this.Lines.length - 1 ? this.Lines[_EndLine].Get_EndPos() : this.Content.length - 1 ));
			}

			var DrawSelection = new CParagraphDrawSelectionRange();

			var bInline = this.Is_Inline();

			for (var CurLine = _StartLine; CurLine <= _EndLine; CurLine++)
			{
				var Line        = this.Lines[CurLine];
				var RangesCount = Line.Ranges.length;

				// Определяем позицию и высоту строки
				DrawSelection.StartY = this.Pages[CurPage].Y + this.Lines[CurLine].Top;
				DrawSelection.H      = this.Lines[CurLine].Bottom - this.Lines[CurLine].Top;

				for (var CurRange = 0; CurRange < RangesCount; CurRange++)
				{
					var Range = Line.Ranges[CurRange];

					var RStartPos = Range.StartPos;
					var REndPos   = Range.EndPos;

					// Если пересечение пустое с селектом, тогда пропускаем данный отрезок
					if (StartPos > REndPos || EndPos < RStartPos)
						continue;

					DrawSelection.StartX    = this.Lines[CurLine].Ranges[CurRange].XVisible;
					DrawSelection.W         = 0;
					DrawSelection.FindStart = true;

					if (CurLine === this.Numbering.Line && CurRange === this.Numbering.Range)
						DrawSelection.StartX += this.Numbering.WidthVisible;

					for (var CurPos = RStartPos; CurPos <= REndPos; CurPos++)
					{
						var Item = this.Content[CurPos];
						Item.Selection_DrawRange(CurLine, CurRange, DrawSelection);
					}

					var StartX = DrawSelection.StartX;
					var W      = DrawSelection.W;

					var StartY = DrawSelection.StartY;
					var H      = DrawSelection.H;

					if (true !== bInline)
					{
						var Frame_X_min = this.CalculatedFrame.L2;
						var Frame_Y_min = this.CalculatedFrame.T2;
						var Frame_X_max = this.CalculatedFrame.L2 + this.CalculatedFrame.W2;
						var Frame_Y_max = this.CalculatedFrame.T2 + this.CalculatedFrame.H2;

						StartX = Math.min(Math.max(Frame_X_min, StartX), Frame_X_max);
						StartY = Math.min(Math.max(Frame_Y_min, StartY), Frame_Y_max);
						W      = Math.min(W, Frame_X_max - StartX);
						H      = Math.min(H, Frame_Y_max - StartY);
					}

					// Отрисовываем селект
					if (W > 0.001)
						this.DrawingDocument.AddPageSelection(PageAbs, StartX, StartY, W, H);
				}
			}

			break;
		}
		case selectionflag_Numbering:
		case selectionflag_NumberingCur:
		{
			var ParaNum      = this.Numbering;
			var NumberingRun = ParaNum.Run;

			if (null === NumberingRun)
				break;

			var CurLine  = ParaNum.Line;
			var CurRange = ParaNum.Range;

			if (CurLine < this.Pages[CurPage].StartLine || CurLine > this.Pages[CurPage].EndLine)
				break;

			var SelectY = this.Lines[CurLine].Top + this.Pages[CurPage].Y;
			var SelectX = this.Lines[CurLine].Ranges[CurRange].XVisible;
			var SelectW = ParaNum.WidthVisible;
			var SelectH = this.Lines[CurLine].Bottom - this.Lines[CurLine].Top;

			var SelectW2 = SelectW;

			var oNumPr = this.GetNumPr();
			var nNumJc = this.Parent.GetNumbering().GetNum(oNumPr.NumId).GetLvl(oNumPr.Lvl).GetJc();

			switch (nNumJc)
			{
				case align_Center:
				{
					SelectX = this.Lines[CurLine].Ranges[CurRange].XVisible - ParaNum.WidthNum / 2;
					SelectW = ParaNum.WidthVisible + ParaNum.WidthNum / 2;
					break;
				}
				case align_Right:
				{
					SelectX = this.Lines[CurLine].Ranges[CurRange].XVisible - ParaNum.WidthNum;
					SelectW = ParaNum.WidthVisible + ParaNum.WidthNum;
					break;
				}
				case align_Left:
				default:
				{
					SelectX = this.Lines[CurLine].Ranges[CurRange].XVisible;
					SelectW = ParaNum.WidthVisible;
					break;
				}
			}

			this.DrawingDocument.AddPageSelection(PageAbs, SelectX, SelectY, SelectW, SelectH);

			if (selectionflag_NumberingCur === this.Selection.Flag && this.DrawingDocument.AddPageSelection2)
				this.DrawingDocument.AddPageSelection2(PageAbs, SelectX, SelectY, SelectW2, SelectH);

			break;
		}
	}
};
Paragraph.prototype.Selection_CheckParaEnd = function()
{
	if (true !== this.Selection.Use)
		return false;

	var EndPos = ( this.Selection.StartPos > this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos );

	return this.Content[EndPos].Selection_CheckParaEnd();
};
Paragraph.prototype.CheckPosInSelection = function(X, Y, CurPage, NearPos)
{
	if (undefined !== NearPos)
	{
		if (this === NearPos.Paragraph && ((true === this.Selection.Use && true === this.Selection_CheckParaContentPos(NearPos.ContentPos)) || true === this.ApplyToAll))
			return true;

		return false;
	}
	else
	{
		if (CurPage < 0 || CurPage >= this.Pages.length || true != this.Selection.Use)
			return false;

		var SearchPosXY = this.Get_ParaContentPosByXY(X, Y, CurPage, false, true, false);

		if (true === SearchPosXY.InTextX)
		{
			return this.Selection_CheckParaContentPos(SearchPosXY.InTextPos);
		}

		return false;
	}
};
/**
 * Проверяем попадание заданной позиции в селект. Сравнение стартовой и конечной позиций с заданной не совпадает
 * с работой данной функии, например в формулах.
 * @param ContentPos Заданная позиция в параграфе.
 */
Paragraph.prototype.Selection_CheckParaContentPos = function(ContentPos)
{
	var CurPos = ContentPos.Get(0);

	if (this.Selection.StartPos <= CurPos && CurPos <= this.Selection.EndPos)
		return this.Content[CurPos].Selection_CheckParaContentPos(ContentPos, 1, this.Selection.StartPos === CurPos, CurPos === this.Selection.EndPos);
	else if (this.Selection.EndPos <= CurPos && CurPos <= this.Selection.StartPos)
		return this.Content[CurPos].Selection_CheckParaContentPos(ContentPos, 1, this.Selection.EndPos === CurPos, CurPos === this.Selection.StartPos);

	return false;
};
Paragraph.prototype.Selection_CalculateTextPr = function()
{
	if (true === this.Selection.Use || true === this.ApplyToAll)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;

		if (true === this.ApplyToAll)
		{
			StartPos = 0;
			EndPos   = this.Content.length - 1;
		}

		if (StartPos > EndPos)
		{
			var Temp = EndPos;
			EndPos   = StartPos;
			StartPos = Temp;
		}

		if (EndPos >= this.Content.length)
			EndPos = this.Content.length - 1;
		if (StartPos < 0)
			StartPos = 0;

		if (StartPos == EndPos)
			return this.Internal_CalculateTextPr(StartPos);

		while (this.Content[StartPos].Type == para_TextPr)
			StartPos++;

		var oEnd = this.Internal_FindBackward(EndPos - 1, [para_Text, para_Space]);

		if (oEnd.Found)
			EndPos = oEnd.LetterPos;
		else
		{
			while (this.Content[EndPos].Type == para_TextPr)
				EndPos--;
		}

		// Рассчитаем стиль в начале селекта
		var TextPr_start = this.Internal_CalculateTextPr(StartPos);
		var TextPr_vis   = TextPr_start;

		for (var Pos = StartPos + 1; Pos < EndPos; Pos++)
		{
			var Item = this.Content[Pos];
			if (para_TextPr == Item.Type && Pos < this.Content.length - 1 && para_TextPr != this.Content[Pos + 1].Type)
			{
				// Рассчитываем настройки в данной позиции
				var TextPr_cur = this.Internal_CalculateTextPr(Pos);
				TextPr_vis     = TextPr_vis.Compare(TextPr_cur);
			}
		}

		return TextPr_vis;
	}
	else
		return new CTextPr();
};
Paragraph.prototype.Selection_SelectNumbering = function()
{
	if (undefined != this.GetNumPr())
	{
		this.Selection.Use  = true;
		this.Selection.Flag = selectionflag_Numbering;
	}
};
Paragraph.prototype.SelectNumbering = function(isCurrent)
{
	if (this.HaveNumbering())
	{
		this.Selection.Use  = true;
		this.Selection.Flag = isCurrent ? selectionflag_NumberingCur : selectionflag_Numbering;
	}
};
/**
 * Выставляем начало/конец селекта в начало/конец параграфа
 */
Paragraph.prototype.Selection_SetBegEnd = function(StartSelection, StartPara)
{
	var ContentPos = ( true === StartPara ? this.Get_StartPos() : this.Get_EndPos(true) );

	if (true === StartSelection)
	{
		this.Selection.StartManually = false;
		this.Set_SelectionContentPos(ContentPos, this.Get_ParaContentPos(true, false));
	}
	else
	{
		this.Selection.EndManually = false;
		this.Set_SelectionContentPos(this.Get_ParaContentPos(true, true), ContentPos);
	}
};
Paragraph.prototype.SetSelectionUse = function(isUse)
{
	if (true === isUse)
		this.Selection.Use = true;
	else
		this.RemoveSelection();
};
Paragraph.prototype.SetSelectionToBeginEnd = function(isSelectionStart, isElementStart)
{
	this.Selection_SetBegEnd(isSelectionStart, isElementStart);
};
Paragraph.prototype.SelectAll = function(Direction)
{
	this.Selection.Use = true;

	var StartPos = null, EndPos = null;
	if (-1 === Direction)
	{
		StartPos = this.Get_EndPos(true);
		EndPos   = this.Get_StartPos();
	}
	else
	{
		StartPos = this.Get_StartPos();
		EndPos   = this.Get_EndPos(true);
	}

	this.Selection.StartManually = false;
	this.Selection.EndManually   = false;

	this.Set_SelectionContentPos(StartPos, EndPos);
};
Paragraph.prototype.Select_Math = function(ParaMath)
{
	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; nPos++)
	{
		if (this.Content[nPos] === ParaMath)
		{
			this.Selection.Use           = true;
			this.Selection.StartManually = false;
			this.Selection.EndManually   = false;
			this.Selection.StartPos      = nPos;
			this.Selection.EndPos        = nPos;
			this.Selection.Flag          = selectionflag_Common;

			this.Document_SetThisElementCurrent(false);
			return;
		}
	}
};
Paragraph.prototype.GetSelectionBounds = function()
{
	if (this.Pages.length <= 0 || this.Lines.length <= 0)
	{
		return {
			Start     : {X : 0, Y : 0, W : 0, H : 0, Page : 0},
			End       : {X : 0, Y : 0, W : 0, H : 0, Page : 0},
			Direction : 1
		};
	}

	var X0 = this.X, X1 = this.XLimit, Y = this.Y;

	var BeginRect = null;
	var EndRect   = null;

	var StartPage = 0, EndPage = 0;
	var _StartX   = null, _StartY = null, _EndX = null, _EndY = null;
	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;

		if (StartPos > EndPos)
		{
			StartPos = this.Selection.EndPos;
			EndPos   = this.Selection.StartPos;
		}

		var LinesCount = this.Lines.length;
		var StartLine  = -1;
		var EndLine    = -1;

		for (var CurLine = 0; CurLine < LinesCount; CurLine++)
		{
			if (-1 === StartLine && StartPos >= this.Lines[CurLine].Get_StartPos() && StartPos <= this.Lines[CurLine].Get_EndPos())
				StartLine = CurLine;

			if (EndPos >= this.Lines[CurLine].Get_StartPos() && EndPos <= this.Lines[CurLine].Get_EndPos())
				EndLine = CurLine;
		}

		StartLine = Math.min(Math.max(0, StartLine), LinesCount - 1);
		EndLine   = Math.min(Math.max(0, EndLine), LinesCount - 1);

		StartPage = this.GetPageByLine(StartLine);
		EndPage   = this.GetPageByLine(EndLine);

		var PagesCount     = this.Pages.length;
		var DrawSelection  = new CParagraphDrawSelectionRange();
		DrawSelection.Draw = false;

		for (var CurLine = StartLine; CurLine <= EndLine; CurLine++)
		{
			var Line        = this.Lines[CurLine];
			var RangesCount = Line.Ranges.length;

			var CurPage = this.GetPageByLine(CurLine);

			// Определяем позицию и высоту строки
			DrawSelection.StartY = this.Pages[CurPage].Y + this.Lines[CurLine].Top;
			DrawSelection.H      = this.Lines[CurLine].Bottom - this.Lines[CurLine].Top;

			var Result = null;

			for (var CurRange = 0; CurRange < RangesCount; CurRange++)
			{
				var Range = Line.Ranges[CurRange];

				var RStartPos = Range.StartPos;
				var REndPos   = Range.EndPos;

				// Если пересечение пустое с селектом, тогда пропускаем данный отрезок
				if (StartPos > REndPos || EndPos < RStartPos)
					continue;

				DrawSelection.StartX    = this.Lines[CurLine].Ranges[CurRange].XVisible;
				DrawSelection.W         = 0;
				DrawSelection.FindStart = true;

				if (CurLine === this.Numbering.Line && CurRange === this.Numbering.Range)
					DrawSelection.StartX += this.Numbering.WidthVisible;

				for (var CurPos = RStartPos; CurPos <= REndPos; CurPos++)
				{
					var Item = this.Content[CurPos];
					Item.Selection_DrawRange(CurLine, CurRange, DrawSelection);
				}

				var StartX = DrawSelection.StartX;
				var W      = DrawSelection.W;

				var StartY = DrawSelection.StartY;
				var H      = DrawSelection.H;

				if (W > 0.001)
				{
					X0 = StartX;
					X1 = StartX + W;
					Y  = StartY;

					var Page = this.Get_AbsolutePage(CurPage);

					if (null === BeginRect)
						BeginRect = {X : StartX, Y : StartY, W : W, H : H, Page : Page};

					EndRect = {X : StartX, Y : StartY, W : W, H : H, Page : Page};
				}

				if (null === _StartX)
				{
					_StartX = StartX;
					_StartY = StartY;
				}

				_EndX = StartX;
				_EndY = StartY;
			}
		}
	}
	else
	{
		var oPos = this.GetTargetPos();

		_StartX   = oPos.X;
		_StartY   = oPos.Y;
		_EndX     = oPos.X;
		_EndY     = oPos.Y + oPos.Height;
		StartPage = this.CurPos.PagesPos;
		EndPage   = this.CurPos.PagesPos;
	}

	if (null === BeginRect)
		BeginRect = {
			X    : _StartX === null ? this.Pages[StartPage].X : _StartX,
			Y    : _StartY === null ? this.Pages[StartPage].Y : _StartY,
			W    : 0,
			H    : 0,
			Page : this.Get_AbsolutePage(StartPage)
		};

	if (null === EndRect)
		EndRect = {
			X    : _EndX === null ? this.Pages[StartPage].X : _EndX,
			Y    : _EndY === null ? this.Pages[StartPage].Y : _EndY,
			W    : 0,
			H    : 0,
			Page : this.Get_AbsolutePage(EndPage)
		};

	return {Start : BeginRect, End : EndRect, Direction : this.GetSelectDirection()};
};
Paragraph.prototype.GetSelectDirection = function()
{
	if (true !== this.Selection.Use)
		return 0;

	if (this.Selection.StartPos < this.Selection.EndPos)
		return 1;
	else if (this.Selection.StartPos > this.Selection.EndPos)
		return -1;

	return this.Content[this.Selection.StartPos].GetSelectDirection();
};
Paragraph.prototype.GetSelectionAnchorPos = function()
{
	var X0 = this.X, X1 = this.XLimit, Y = this.Y, Page = this.Get_AbsolutePage(0);
	if (true === this.ApplyToAll)
	{
		// Ничего не делаем
	}
	else if (true === this.Selection.Use)
	{
		// Делаем подсветку
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;

		if (StartPos > EndPos)
		{
			StartPos = this.Selection.EndPos;
			EndPos   = this.Selection.StartPos;
		}

		var LinesCount = this.Lines.length;
		var StartLine  = -1;
		var EndLine    = -1;

		for (var CurLine = 0; CurLine < LinesCount; CurLine++)
		{
			if (-1 === StartLine && StartPos >= this.Lines[CurLine].Get_StartPos() && StartPos <= this.Lines[CurLine].Get_EndPos())
				StartLine = CurLine;

			if (EndPos >= this.Lines[CurLine].Get_StartPos() && EndPos <= this.Lines[CurLine].Get_EndPos())
				EndLine = CurLine;
		}

		StartLine = Math.min(Math.max(0, StartLine), LinesCount - 1);
		EndLine   = Math.min(Math.max(0, EndLine), LinesCount - 1);

		var PagesCount     = this.Pages.length;
		var DrawSelection  = new CParagraphDrawSelectionRange();
		DrawSelection.Draw = false;

		for (var CurLine = StartLine; CurLine <= EndLine; CurLine++)
		{
			var Line        = this.Lines[CurLine];
			var RangesCount = Line.Ranges.length;

			// Определим номер страницы
			var CurPage = 0;
			for (; CurPage < PagesCount; CurPage++)
			{
				if (CurLine >= this.Pages[CurPage].StartLine && CurLine <= this.Pages[CurPage].EndLine)
					break;
			}

			CurPage = Math.min(PagesCount - 1, CurPage);

			// Определяем позицию и высоту строки
			DrawSelection.StartY = this.Pages[CurPage].Y + this.Lines[CurLine].Top;
			DrawSelection.H      = this.Lines[CurLine].Bottom - this.Lines[CurLine].Top;

			var Result = null;

			for (var CurRange = 0; CurRange < RangesCount; CurRange++)
			{
				var Range = Line.Ranges[CurRange];

				var RStartPos = Range.StartPos;
				var REndPos   = Range.EndPos;

				// Если пересечение пустое с селектом, тогда пропускаем данный отрезок
				if (StartPos > REndPos || EndPos < RStartPos)
					continue;

				DrawSelection.StartX    = this.Lines[CurLine].Ranges[CurRange].XVisible;
				DrawSelection.W         = 0;
				DrawSelection.FindStart = true;

				if (CurLine === this.Numbering.Line && CurRange === this.Numbering.Range)
					DrawSelection.StartX += this.Numbering.WidthVisible;

				for (var CurPos = RStartPos; CurPos <= REndPos; CurPos++)
				{
					var Item = this.Content[CurPos];
					Item.Selection_DrawRange(CurLine, CurRange, DrawSelection);
				}

				var StartX = DrawSelection.StartX;
				var W      = DrawSelection.W;

				var StartY = DrawSelection.StartY;
				var H      = DrawSelection.H;

				var StartX = DrawSelection.StartX;
				var W      = DrawSelection.W;

				var StartY = DrawSelection.StartY;
				var H      = DrawSelection.H;

				if (W > 0.001)
				{
					X0 = StartX;
					X1 = StartX + W;
					Y  = StartY;

					Page = this.Get_AbsolutePage(CurPage);

					if (null === Result)
						Result = {X0 : X0, X1 : X1, Y : Y, Page : Page};
					else
					{
						Result.X0 = Math.min(Result.X0, X0);
						Result.X1 = Math.max(Result.X1, X1);
					}
				}
			}

			if (null !== Result)
			{
				return Result;
			}
		}
	}
	else
	{
		// Текущая точка
		X0   = this.CurPos.X;
		X1   = this.CurPos.X;
		Y    = this.CurPos.Y;
		Page = this.Get_AbsolutePage(this.CurPos.PagesPos);
	}

	return {X0 : X0, X1 : X1, Y : Y, Page : Page};
};
/**
 * Возвращаем выделенный текст
 */
Paragraph.prototype.GetSelectedText = function(bClearText, oPr)
{
	var Str   = "";
	var Count = this.Content.length;
	for (var Pos = 0; Pos < Count; Pos++)
	{
		var _Str = this.Content[Pos].GetSelectedText(true === this.ApplyToAll, bClearText, oPr);

		if (null === _Str)
			return null;

		Str += _Str;
	}

	return Str;
};
Paragraph.prototype.GetSelectedElementsInfo = function(oInfo, ContentPos, Depth)
{
	oInfo.SetParagraph(this);

	if (ContentPos)
	{
		var Pos = ContentPos.Get(Depth);
		if (this.Content[Pos].GetSelectedElementsInfo)
			this.Content[Pos].GetSelectedElementsInfo(oInfo, ContentPos, Depth + 1);
	}
	else
	{
		if (true === this.Selection.Use && (oInfo.IsCheckAllSelection() || this.Selection.StartPos === this.Selection.EndPos))
		{
			var nStartPos = this.Selection.StartPos < this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos;
			var nEndPos   = this.Selection.StartPos < this.Selection.EndPos ? this.Selection.EndPos : this.Selection.StartPos;

			for (var nPos = nStartPos; nPos <= nEndPos; ++nPos)
			{
				this.Content[nPos].GetSelectedElementsInfo(oInfo);
			}
		}
		else if (false === this.Selection.Use)
		{
			this.Content[this.CurPos.ContentPos].GetSelectedElementsInfo(oInfo);
		}

		if (true !== this.Selection.Use)
		{
			var oNextElement = this.GetNextRunElement();
			var oPrevElement = this.GetPrevRunElement();

			if (oNextElement)
			{
				if (para_PageNum === oNextElement.Type)
				{
					oInfo.SetPageNum(oNextElement);
				}
				else if (para_PageCount === oNextElement.Type)
				{
					oInfo.SetPagesCount(oNextElement);
				}
			}

			if (oPrevElement)
			{
				if (para_PageNum === oPrevElement.Type)
				{
					oInfo.SetPageNum(oPrevElement);
				}
				else if (para_PageCount === oPrevElement.Type)
				{
					oInfo.SetPagesCount(oPrevElement);
				}
			}
		}
	}

	var arrComplexFields = this.GetComplexFieldsByPos(ContentPos ? ContentPos : (this.Selection.Use === true ? this.Get_ParaContentPos(false, false) : this.Get_ParaContentPos(false)), false);
	if (arrComplexFields.length > 0)
		oInfo.SetComplexFields(arrComplexFields);
};
Paragraph.prototype.GetElementsInfoByXY = function(oInfo, X, Y, CurPage)
{
	var SearchPosXY = this.Get_ParaContentPosByXY(X, Y, CurPage, false, false);
	this.GetSelectedElementsInfo(oInfo, SearchPosXY.Pos, 0);
};
Paragraph.prototype.GetSelectedContent = function(oSelectedContent)
{
	if (true !== this.Selection.Use)
		return;

	var isAllSelected = (true === this.Selection_IsFromStart(true) && true === this.Selection_CheckParaEnd());

	var nStartPos = this.Selection.StartPos;
	var nEndPos   = this.Selection.EndPos;
	if (nStartPos > nEndPos)
	{
		nStartPos = this.Selection.EndPos;
		nEndPos   = this.Selection.StartPos;
	}

	var oPara = null;
	if (oSelectedContent.IsTrackRevisions())
	{
		oPara = new Paragraph(this.DrawingDocument, this.Parent, !this.bFromDocument);
		oPara.Set_Pr(this.Pr.Copy());
		oPara.TextPr.Set_Value(this.TextPr.Value.Copy());

		for (var nPos = nStartPos, nParaPos = 0; nPos <= nEndPos; ++nPos)
		{
			var oNewItem = this.Content[nPos].GetSelectedContent(oSelectedContent);
			if (oNewItem)
			{
				if (oNewItem.Type === para_RevisionMove)
				{
					oSelectedContent.SetMovedParts(true);
				}
				else
				{
					oPara.AddToContent(nParaPos, oNewItem);
					nParaPos++;
				}
			}
		}
	}
	else
	{
		if (isAllSelected)
		{
			oPara = this.Copy(this.Parent);
		}
		else
		{
			oPara = new Paragraph(this.DrawingDocument, this.Parent, !this.bFromDocument);

			// Копируем настройки
			oPara.Set_Pr(this.Pr.Copy(true));
			oPara.TextPr.Set_Value(this.TextPr.Value.Copy());

			// Копируем содержимое параграфа
			for (var Pos = nStartPos, nParaPos = 0; Pos <= nEndPos; Pos++)
			{
				var Item = this.Content[Pos];

				if ((nStartPos === Pos || nEndPos === Pos) && true !== Item.IsSelectedAll())
				{
					var Content = Item.CopyContent(true);
					for (var ContentPos = 0, ContentLen = Content.length; ContentPos < ContentLen; ContentPos++)
					{
						if (Content[ContentPos].Type !== para_RevisionMove)
						{
							oPara.Internal_Content_Add(nParaPos, Content[ContentPos], false);
							nParaPos++;
						}
					}
				}
				else
				{
					if (Item.Type !== para_RevisionMove)
					{
						oPara.Internal_Content_Add(nParaPos, Item.Copy(false, {CopyReviewPr : true}), false);
						nParaPos++;
					}
				}
			}

			// Добавляем секцию в конце
			if (undefined !== this.SectPr)
			{
				var SectPr = new CSectionPr(this.SectPr.LogicDocument);
				SectPr.Copy(this.SectPr);
				oPara.Set_SectionPr(SectPr);
			}
		}
	}

	if (oPara)
	{
		if (oSelectedContent.IsSaveNumberingValues() && this.GetParent())
		{
			var oParent    = this.GetParent();
			var oNumPr     = this.GetNumPr();
			var oPrevNumPr = this.GetPrChangeNumPr();

			var oNumInfo     = oNumPr ? oParent.CalculateNumberingValues(this, oNumPr, true) : null;
			var oPrevNumInfo = oPrevNumPr ? oParent.CalculateNumberingValues(this. oPrevNumPr, true) : null;

			oPara.SaveNumberingValues(oNumInfo, oPrevNumInfo);
		}

		oSelectedContent.Add(new CSelectedElement(oPara, isAllSelected));
	}
};
/**
 * Задаем сохраненное значение нумерации для данного параграфа (используется при печати выделенного фрагмента)
 * @param arrNumInfo
 * @param arrPrevNumInfo
 */
Paragraph.prototype.SaveNumberingValues = function(arrNumInfo, arrPrevNumInfo)
{
	this.SavedNumberingValues = {
		NumInfo     : arrNumInfo,
		PrevNumInfo : arrPrevNumInfo
	};
};
/**
 * Получаем сохраненное значение нумерации для заданного параграфа (используется при печати выделенного фрагмента)
 * @returns {{NumInfo: *, PrevNumInfo: *}|*}
 */
Paragraph.prototype.GetSavedNumberingValues = function()
{
	return this.SavedNumberingValues;
};
Paragraph.prototype.GetCalculatedTextPr = function()
{
	var TextPr;
	if (true === this.ApplyToAll)
	{
		this.SelectAll(1);

		var StartPos = 0;
		var Count    = this.Content.length;
		while (true !== this.Content[StartPos].IsCursorPlaceable() && StartPos < Count - 1)
			StartPos++;

		TextPr    = this.Content[StartPos].Get_CompiledTextPr(true);
		var Count = this.Content.length;

		for (var CurPos = StartPos + 1; CurPos < Count; CurPos++)
		{
			var TempTextPr = this.Content[CurPos].Get_CompiledTextPr(false);
			if (null !== TempTextPr && undefined !== TempTextPr && true !== this.Content[CurPos].IsSelectionEmpty())
				TextPr = TextPr.Compare(TempTextPr);
		}

		this.RemoveSelection();
	}
	else
	{
		if (true === this.Selection.Use)
		{
			var StartPos = this.Selection.StartPos;
			var EndPos   = this.Selection.EndPos;

			if (StartPos > EndPos)
			{
				StartPos = this.Selection.EndPos;
				EndPos   = this.Selection.StartPos;
			}

			// TODO: Как только избавимся от para_End переделать здесь.

			if (StartPos === EndPos && this.Content.length - 1 === EndPos)
			{
				TextPr = this.Get_CompiledPr2(false).TextPr.Copy();
				TextPr.Merge(this.TextPr.Value);
			}
			else
			{
				var bCheckParaEnd = false;
				if (this.Content.length - 1 === EndPos && true !== this.Content[EndPos].IsSelectionEmpty(true))
				{
					EndPos--;
					bCheckParaEnd = true;
				}

				// Сначала пропускаем все пустые элементы. После этой операции мы можем попасть в элемент, в котором
				// нельзя находиться курсору, поэтому ищем в обратном направлении первый подходящий элемент.
				var OldStartPos = StartPos;
				while (true === this.Content[StartPos].IsSelectionEmpty() && StartPos < EndPos)
					StartPos++;

				while (true !== this.Content[StartPos].IsCursorPlaceable() && StartPos > OldStartPos)
					StartPos--;


				if (bCheckParaEnd && StartPos === EndPos && this.Content[StartPos].IsSelectionEmpty())
					TextPr = null;
				else
					TextPr = this.Content[StartPos].Get_CompiledTextPr(true);

				// Если все-так так сложилось, что мы находимся в элементе без настроек, тогда берем настройки для
				// символа конца параграфа.
				if (null === TextPr)
				{
					TextPr = this.Get_CompiledPr2(false).TextPr.Copy();
					TextPr.Merge(this.TextPr.Value);
				}

				for (var CurPos = StartPos + 1; CurPos <= EndPos; CurPos++)
				{
					var TempTextPr = this.Content[CurPos].Get_CompiledTextPr(false);

					if (null === TextPr || undefined === TextPr)
						TextPr = TempTextPr;
					else if (null !== TempTextPr && undefined !== TempTextPr && true !== this.Content[CurPos].IsSelectionEmpty())
						TextPr = TextPr.Compare(TempTextPr);
				}

				if (true === bCheckParaEnd)
				{
					var EndTextPr = this.Get_CompiledPr2(false).TextPr.Copy();
					EndTextPr.Merge(this.TextPr.Value);
					TextPr = TextPr.Compare(EndTextPr);
				}
			}
		}
		else
		{
			TextPr = this.Content[this.CurPos.ContentPos].Get_CompiledTextPr(true);

			var oRun = this.Get_ElementByPos(this.Get_ParaContentPos(false, false, false));
			if (para_Run === oRun.Type && oRun.private_IsCurPosNearFootnoteReference())
				TextPr.VertAlign = AscCommon.vertalign_Baseline;
		}
	}

	if (null === TextPr || undefined === TextPr)
		TextPr = this.TextPr.Value.Copy();

	// TODO: Пока возвращаем всегда шрифт лежащий в Ascii, в будущем надо будет это переделать
	if (undefined !== TextPr.RFonts && null !== TextPr.RFonts)
		TextPr.FontFamily = TextPr.RFonts.Ascii;

	return TextPr;
};
Paragraph.prototype.GetCalculatedParaPr = function()
{
	var ParaPr = this.Get_CompiledPr2(false).ParaPr;
	ParaPr.Locked = this.Lock.Is_Locked();

	if (!ParaPr.PStyle && this.bFromDocument && this.LogicDocument && this.LogicDocument.GetStyles)
		ParaPr.PStyle = this.LogicDocument.GetStyles().GetDefaultParagraph();

	if (undefined !== ParaPr.OutlineLvl && undefined === this.Pr.OutlineLvl)
		ParaPr.OutlineLvlStyle = true;

	return ParaPr;
};
/**
 * Проверяем пустой ли параграф
 */
Paragraph.prototype.Is_Empty = function(Props)
{
	var Pr = {SkipEnd : true};

	if (undefined !== Props)
	{
		if (undefined !== Props.SkipNewLine)
			Pr.SkipNewLine = true;

		if (Props.SkipComplexFields)
			Pr.SkipComplexFields = true;

		if (undefined !== Props.SkipPlcHldr)
			Pr.SkipPlcHldr = Props.SkipPlcHldr;
	}

	var ContentLen = this.Content.length;
	for (var CurPos = 0; CurPos < ContentLen; CurPos++)
	{
		if (false === this.Content[CurPos].Is_Empty(Pr))
			return false;
	}

	return true;
};
/**
 * Проверяем, попали ли мы в текст
 */
Paragraph.prototype.IsInText = function(X, Y, CurPage)
{
	if (CurPage < 0 || CurPage >= this.Pages.length)
		return null;

	var SearchPosXY = this.Get_ParaContentPosByXY(X, Y, CurPage, false, true);
	if (true === SearchPosXY.InText)
		return this;

	return null;
};
Paragraph.prototype.Is_UseInDocument = function(Id)
{
	if (Id !== undefined)
	{
		for (var i = 0; i < this.Content.length; ++i)
		{
			if (this.Content[i].Get_Id() === Id)
			{
				break;
			}
		}
		if (i < this.Content.length)
		{
			if (this.Parent)
			{
				return this.Parent.Is_UseInDocument(this.Get_Id());
			}
		}
		return false;
	}

	if (null != this.Parent)
		return this.Parent.Is_UseInDocument(this.Get_Id());

	return false;
};
/**
 * Проверяем пустой ли селект
 */
Paragraph.prototype.IsSelectionEmpty = function(bCheckHidden)
{
	if (undefined === bCheckHidden)
		bCheckHidden = true;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;

		if (StartPos > EndPos)
		{
			EndPos   = this.Selection.StartPos;
			StartPos = this.Selection.EndPos;
		}

		for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
		{
			if (true !== this.Content[CurPos].IsSelectionEmpty(bCheckHidden))
				return false;
		}
	}

	return true;
};
Paragraph.prototype.Get_StartTabsCount = function(TabsCounter)
{
	var ContentLen = this.Content.length;
	for (var Pos = 0; Pos < ContentLen; Pos++)
	{
		var Element = this.Content[Pos];
		if (false === Element.Get_StartTabsCount(TabsCounter))
			return false;
	}

	return true;
};
Paragraph.prototype.Remove_StartTabs = function(TabsCounter)
{
	var ContentLen = this.Content.length;
	for (var Pos = 0; Pos < ContentLen; Pos++)
	{
		var Element = this.Content[Pos];
		if (false === Element.Remove_StartTabs(TabsCounter))
			return false;
	}

	return true;
};
/**
 * Применяем заданную нумерацию к данному параграфу (учитываем отступы, количество табов в начале параграфа и т.д.)
 * @param sNumId {string}
 * @param nLvl {number} 0..8
 */
Paragraph.prototype.ApplyNumPr = function(sNumId, nLvl)
{
	var ParaPr    = this.Get_CompiledPr2(false).ParaPr;
	var NumPr_old = this.GetNumPr();

	var SelectionUse       = this.IsSelectionUse();
	var SelectedOneElement = this.Parent.IsSelectedSingleElement();

	// Когда выделено больше 1 параграфа, нумерация не добавляется к пустым параграфам без нумерации
	if (true === SelectionUse && true !== SelectedOneElement && true === this.Is_Empty() && !this.GetNumPr())
		return;

	this.RemoveNumPr();

	// Рассчитаем количество табов, идущих в начале параграфа
	var TabsCounter = new CParagraphTabsCounter();
	this.Get_StartTabsCount(TabsCounter);

	var TabsCount = TabsCounter.Count;
	var TabsPos   = TabsCounter.Pos;

	// Рассчитаем левую границу и сдвиг первой строки с учетом начальных табов
	var X = ParaPr.Ind.Left + ParaPr.Ind.FirstLine;
	if (TabsCount > 0 && ParaPr.Ind.FirstLine < 0)
	{
		X = ParaPr.Ind.Left;
		TabsCount--;
	}

	var ParaTabsCount = ParaPr.Tabs.Get_Count();
	while (TabsCount)
	{
		// Ищем ближайший таб

		var TabFound = false;
		for (var TabIndex = 0; TabIndex < ParaTabsCount; TabIndex++)
		{
			var Tab = ParaPr.Tabs.Get(TabIndex);

			if (Tab.Pos > X)
			{
				X        = Tab.Pos;
				TabFound = true;
				break;
			}
		}

		// Ищем по дефолтовому сдвигу
		if (false === TabFound)
		{
			var NewX = 0;
			while (X >= NewX)
				NewX += AscCommonWord.Default_Tab_Stop;

			X = NewX;
		}

		TabsCount--;
	}

	var oNumbering = this.Parent.GetNumbering();
	var oNum       = oNumbering.GetNum(sNumId);

	this.private_AddPrChange();

	// Если у параграфа не было никакой нумерации изначально
	if (undefined === NumPr_old)
	{
		if (true === SelectedOneElement || false === SelectionUse)
		{
			// Проверим сначала предыдущий элемент, если у него точно такая же нумерация, тогда копируем его сдвиги
			var Prev          = this.Get_DocumentPrev();
			var PrevNumbering = ( null != Prev ? (type_Paragraph === Prev.GetType() ? Prev.GetNumPr() : undefined) : undefined );
			if (undefined != PrevNumbering && sNumId === PrevNumbering.NumId && nLvl === PrevNumbering.Lvl)
			{
				var NewFirstLine = Prev.Pr.Ind.FirstLine;
				var NewLeft      = Prev.Pr.Ind.Left;
				History.Add(new CChangesParagraphIndFirst(this, this.Pr.Ind.FirstLine, NewFirstLine));
				History.Add(new CChangesParagraphIndLeft(this, this.Pr.Ind.Left, NewLeft));

				// При добавлении списка в параграф, удаляем все собственные сдвиги
				this.Pr.Ind.FirstLine = NewFirstLine;
				this.Pr.Ind.Left      = NewLeft;
			}
			else
			{
				// Выставляем заданную нумерацию и сдвиги. Сдвиг делаем на ближайшую остановку стандартного таба

				var oNumParaPr = oNum.GetLvl(nLvl).GetParaPr();
				if (undefined != oNumParaPr.Ind && undefined != oNumParaPr.Ind.Left)
				{
					oNum.ShiftLeftInd(X + 12.5);
					//oNum.ShiftLeftInd(X + oNumParaPr.Ind.Left);

					History.Add(new CChangesParagraphIndFirst(this, this.Pr.Ind.FirstLine, undefined));
					History.Add(new CChangesParagraphIndLeft(this, this.Pr.Ind.Left, undefined));

					// При добавлении списка в параграф, удаляем все собственные сдвиги
					this.Pr.Ind.FirstLine = undefined;
					this.Pr.Ind.Left      = undefined;
				}
			}

			this.Pr.NumPr = new CNumPr();
			this.Pr.NumPr.Set(sNumId, nLvl);
			History.Add(new CChangesParagraphNumbering(this, NumPr_old, this.Pr.NumPr));
			this.private_RefreshNumbering(NumPr_old);
			this.private_RefreshNumbering(this.Pr.NumPr);
		}
		else
		{
			// Если выделено несколько параграфов, тогда уже по сдвигу X определяем уровень данной нумерации

			var LvlFound  = -1;
			for (var LvlIndex = 0; LvlIndex < 9; ++LvlIndex)
			{
				var oNumLvl = oNum.GetLvl(LvlIndex);
				if (oNumLvl)
				{
					var oNumParaPr = oNumLvl.GetParaPr();

					if (undefined != oNumParaPr.Ind && undefined != oNumParaPr.Ind.Left && X <= oNumParaPr.Ind.Left)
					{
						LvlFound = LvlIndex;
						break;
					}
				}
			}

			if (-1 === LvlFound)
				LvlFound = 8;

			if (this.Pr.Ind && (undefined !== this.Pr.Ind || undefined !== this.Pr.Ind.Left))
			{
				History.Add(new CChangesParagraphIndFirst(this, this.Pr.Ind.FirstLine, undefined));
				History.Add(new CChangesParagraphIndLeft(this, this.Pr.Ind.Left, undefined));

				// При добавлении списка в параграф, удаляем все собственные сдвиги
				this.Pr.Ind.FirstLine = undefined;
				this.Pr.Ind.Left      = undefined;
			}

			this.Pr.NumPr = new CNumPr();
			this.Pr.NumPr.Set(sNumId, LvlFound);
			History.Add(new CChangesParagraphNumbering(this, NumPr_old, this.Pr.NumPr));
			this.private_RefreshNumbering(NumPr_old);
			this.private_RefreshNumbering(this.Pr.NumPr);
		}

		// Удалим все табы идущие в начале параграфа
		TabsCounter.Count = TabsCount;
		this.Remove_StartTabs(TabsCounter);
	}
	else
	{
		// просто меняем список, так чтобы он не двигался
		this.Pr.NumPr = new CNumPr();
		this.Pr.NumPr.Set(sNumId, nLvl);

		History.Add(new CChangesParagraphNumbering(this, NumPr_old, this.Pr.NumPr));
		this.private_RefreshNumbering(NumPr_old);
		this.private_RefreshNumbering(this.Pr.NumPr);

		var Left      = ( NumPr_old.Lvl === nLvl ? undefined : ParaPr.Ind.Left );
		var FirstLine = ( NumPr_old.Lvl === nLvl ? undefined : ParaPr.Ind.FirstLine );

		History.Add(new CChangesParagraphIndFirst(this, this.Pr.Ind.FirstLine, FirstLine));
		History.Add(new CChangesParagraphIndLeft(this, this.Pr.Ind.Left, Left));

		this.Pr.Ind.FirstLine = FirstLine;
		this.Pr.Ind.Left      = Left;
	}

	// Если у параграфа выставлен стиль, тогда не меняем его, если нет, тогда выставляем стандартный
	// стиль для параграфа с нумерацией.
	if (undefined === this.Style_Get())
	{
		if (this.bFromDocument)
			this.Style_Add(this.Parent.Get_Styles().Get_Default_ParaList());
	}

	// Надо пересчитать конечный стиль
	this.CompiledPr.NeedRecalc = true;
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
	this.UpdateDocumentOutline();
};
/**
 * Добавляем нумерацию к данному параграфу, не делая никаких дополнительных действий
 * @param sNumId {?string} Если undefined или null, тогда убираем нумерацию
 * @param nLvl {number} 0..8
 */
Paragraph.prototype.SetNumPr = function(sNumId, nLvl)
{
	if (undefined === sNumId || null === sNumId)
	{
		if (undefined !== this.Pr.NumPr)
		{
			this.private_AddPrChange();

			History.Add(new CChangesParagraphNumbering(this, this.Pr.NumPr, undefined));
			this.private_RefreshNumbering(this.Pr.NumPr);

			this.Pr.NumPr = undefined;

			this.CompiledPr.NeedRecalc = true;
			this.private_UpdateTrackRevisionOnChangeParaPr(true);
			this.UpdateDocumentOutline();
		}
	}
	else
	{
		if (nLvl < 0 || nLvl > 8)
			nLvl = 0;

		var oNumPrOld = this.Pr.NumPr;
		this.Pr.NumPr = new CNumPr(sNumId, nLvl);

		this.private_AddPrChange();
		History.Add(new CChangesParagraphNumbering(this, oNumPrOld, this.Pr.NumPr));
		this.private_RefreshNumbering(oNumPrOld);
		this.private_RefreshNumbering(this.Pr.NumPr);

		// Надо пересчитать конечный стиль
		this.CompiledPr.NeedRecalc = true;
		this.private_UpdateTrackRevisionOnChangeParaPr(true);
		this.UpdateDocumentOutline();
	}
};
/**
 * Изменяем уровень нумерации
 * @param bIncrease {boolean}
 */
Paragraph.prototype.IndDecNumberingLevel = function(bIncrease)
{
	var NumPr = this.GetNumPr();
	if (undefined != NumPr)
	{
		this.private_AddPrChange();

		var oNumPrOld = this.Pr.NumPr;

		var NewLvl;
		if (true === bIncrease)
			NewLvl = Math.min(8, NumPr.Lvl + 1);
		else
			NewLvl = Math.max(0, NumPr.Lvl - 1);

		this.Pr.NumPr = new CNumPr();
		this.Pr.NumPr.Set(NumPr.NumId, NewLvl);

		History.Add(new CChangesParagraphNumbering(this, oNumPrOld, this.Pr.NumPr));
		this.private_RefreshNumbering(NumPr);
		this.private_RefreshNumbering(this.Pr.NumPr);

		// Надо пересчитать конечный стиль
		this.CompiledPr.NeedRecalc = true;
		this.private_UpdateTrackRevisionOnChangeParaPr(true);
	}
};
/**
 * Получаем настройку нумерации у данного параграфа, если она есть
 * @returns {?CNumPr}
 */
Paragraph.prototype.GetNumPr = function()
{
	var oNumPr = this.Get_CompiledPr2(false).ParaPr.NumPr;
	if (oNumPr && oNumPr.IsValid())
		return oNumPr.Copy();

	return undefined;
};
/**
 * Удаляем нумерацию с учетом того, что она может быть задана в стиле
 */
Paragraph.prototype.RemoveNumPr = function()
{
	// Если у нас была задана нумерации в стиле, тогда чтобы ее отменить(не удаляя нумерацию в стиле)
	// мы проставляем NumPr с NumId undefined
	var OldNumPr = this.GetNumPr();
	var NewNumPr = undefined;
	if (undefined != this.CompiledPr.Pr.ParaPr.StyleNumPr)
	{
		NewNumPr = new CNumPr();
		NewNumPr.Set(0, 0);
	}

	this.private_AddPrChange();

	var OldNumPr = undefined != this.Pr.NumPr ? this.Pr.NumPr : undefined;

	History.Add(new CChangesParagraphNumbering(this, OldNumPr, NewNumPr));
	this.private_RefreshNumbering(OldNumPr);
	this.private_RefreshNumbering(NewNumPr);

	this.Pr.NumPr = NewNumPr;

	if (undefined != this.Pr.Ind && undefined != OldNumPr)
	{
		// При удалении нумерации из параграфа, если отступ первой строки > 0, тогда
		// увеличиваем левый отступ параграфа, а первую сторку  делаем 0, а если отступ
		// первой строки < 0, тогда просто делаем оступ первой строки 0.

		if (undefined === this.Pr.Ind.FirstLine || Math.abs(this.Pr.Ind.FirstLine) < 0.001)
		{
			if (undefined != OldNumPr && undefined != OldNumPr.NumId && this.Parent)
			{
				var oNum = this.Parent.GetNumbering().GetNum(OldNumPr.NumId);
				if (oNum)
				{
					var oLvl = oNum.GetLvl(OldNumPr.Lvl);
					var oLvlParaPr = oLvl ? oLvl.GetParaPr() : null;
					if (oLvlParaPr && undefined != oLvlParaPr.Ind && undefined != oLvlParaPr.Ind.Left)
					{
						var CurParaPr         = this.Get_CompiledPr2(false).ParaPr;
						var Left              = CurParaPr.Ind.Left + CurParaPr.Ind.FirstLine;
						var NumLeftCorrection = ( undefined != oLvlParaPr.Ind.FirstLine ? Math.abs(oLvlParaPr.Ind.FirstLine) : 0 );

						var NewFirstLine = 0;
						var NewLeft      = Left < 0 ? Left : Math.max(0, Left - NumLeftCorrection);

						History.Add(new CChangesParagraphIndLeft(this, this.Pr.Ind.Left, NewLeft));
						History.Add(new CChangesParagraphIndFirst(this, this.Pr.Ind.FirstLine, NewFirstLine));
						this.Pr.Ind.Left      = NewLeft;
						this.Pr.Ind.FirstLine = NewFirstLine;
					}
				}
			}
		}
		else if (this.Pr.Ind.FirstLine < 0)
		{
			History.Add(new CChangesParagraphIndFirst(this, this.Pr.Ind.FirstLine, 0));
			this.Pr.Ind.FirstLine = 0;
		}
		else if (undefined != this.Pr.Ind.Left && this.Pr.Ind.FirstLine > 0)
		{
			History.Add(new CChangesParagraphIndLeft(this, this.Pr.Ind.Left, this.Pr.Ind.Left + this.Pr.Ind.FirstLine));
			History.Add(new CChangesParagraphIndFirst(this, this.Pr.Ind.FirstLine, 0));
			this.Pr.Ind.Left += this.Pr.Ind.FirstLine;
			this.Pr.Ind.FirstLine = 0;
		}
	}

	// При удалении проверяем стиль. Если данный стиль является стилем по умолчанию
	// для параграфов с нумерацией, тогда удаляем запись и о стиле.
	var StyleId    = this.Style_Get();
	var NumStyleId = this.LogicDocument ? this.LogicDocument.Get_Styles().Get_Default_ParaList() : null;
	if (StyleId === NumStyleId)
		this.Style_Remove();

	// Надо пересчитать конечный стиль
	this.CompiledPr.NeedRecalc = true;
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
	this.UpdateDocumentOutline();
};
/**
 * Проверяем есть ли у данного параграфа нумерация
 * @returns {boolean}
 */
Paragraph.prototype.HaveNumbering = function()
{
	return (!!this.GetNumPr());
};
/**
 * Получаем скомпилированные текстовые настройки для символа нумерации
 * @returns {?CTextPr}
 */
Paragraph.prototype.GetNumberingCompiledPr = function()
{
	var oNumPr = this.GetNumPr();
	if (!oNumPr || !this.LogicDocument)
		return null;

	var oNumbering = this.LogicDocument.GetNumbering();
	var oNumLvl    = oNumbering.GetNum(oNumPr.NumId).GetLvl(oNumPr.Lvl);

	var oTextPr = this.Get_CompiledPr2(false).TextPr.Copy();
	oTextPr.Merge(this.TextPr.Value);
	oTextPr.Merge(oNumLvl.GetTextPr());
	return oTextPr;
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с нумерацией параграфов в презентациях
//----------------------------------------------------------------------------------------------------------------------
Paragraph.prototype.Add_PresentationNumbering = function(_Bullet, Pr)
{
	var ParaPr                 = this.Get_CompiledPr2(false).ParaPr;
	var _OldBullet = this.Pr.Bullet;
	this.CompiledPr.NeedRecalc = true;

	var oBullet2;
	if (_Bullet)
	{
		oBullet2 = _Bullet;

		this.Pr.Bullet             = undefined;
		var oTheme = this.Get_Theme();
		var oColorMap = this.Get_ColorMap();
		var oUndefParaPr = this.Get_CompiledPr2(false).ParaPr;
		var NewType      = oBullet2.getBulletType();
		var UndefType    = oUndefParaPr.Bullet ? oUndefParaPr.Bullet.getBulletType(oTheme, oColorMap) : numbering_presentationnumfrmt_None;
		var LeftInd;

		if (NewType === UndefType)
		{
			if (NewType === numbering_presentationnumfrmt_Char)//буллеты
			{
				var oUndefPresentationBullet = oUndefParaPr.Bullet.getPresentationBullet(oTheme, oColorMap);
				var oNewPresentationBullet   = oBullet2.getPresentationBullet(oTheme, oColorMap);
				if (oUndefPresentationBullet.m_sChar === oNewPresentationBullet.m_sChar)//символы совпали. ничего выставлять не надо.
				{
					this.Pr.Bullet = _OldBullet;
					this.Set_Bullet(undefined);
				}
				else
				{
					this.Pr.Bullet = _OldBullet;
					if(_OldBullet)
					{
						if(_OldBullet.bulletSize && !oBullet2.bulletSize)
						{
							oBullet2.bulletSize = _OldBullet.bulletSize.createDuplicate();
						}
						if(_OldBullet.bulletColor && !oBullet2.bulletColor)
						{
							oBullet2.bulletColor = _OldBullet.bulletColor.createDuplicate();
						}
					}
					this.Set_Bullet(oBullet2.createDuplicate());//тип совпал, но не совпали символы. выставляем Bullet.
																// Indent в данном случае не выставляем как это делает
																// PowerPoint.
				}
			}
			else //нумерация или отсутствие нумерации
			{
				this.Pr.Bullet = _OldBullet;
				this.Set_Bullet(undefined);
			}
			this.Set_Ind({Left : undefined, FirstLine : undefined}, true);
		}
		else//тип не совпал. выставляем буллет, а также проверим нужно ли выставлять Indent.
		{
			this.Pr.Bullet = _OldBullet;
			if(_OldBullet )
			{
				if(_OldBullet.bulletSize && !oBullet2.bulletSize)
				{
					oBullet2.bulletSize = _OldBullet.bulletSize.createDuplicate();
				}
				if(_OldBullet.bulletColor && !oBullet2.bulletColor)
				{
					oBullet2.bulletColor = _OldBullet.bulletColor.createDuplicate();
				}
				if(_OldBullet.bulletType && AscFormat.isRealNumber(_OldBullet.bulletType.startAt)
					&& (oBullet2.bulletType && !AscFormat.isRealNumber(oBullet2.bulletType.startAt)))
				{
					oBullet2.bulletType.startAt = _OldBullet.bulletType.startAt;
				}
			}
			this.Set_Bullet(oBullet2.createDuplicate());
			LeftInd = Math.min(ParaPr.Ind.Left, ParaPr.Ind.Left + ParaPr.Ind.FirstLine);
			var oFirstRunPr = this.Get_FirstTextPr2();
			var Indent = oFirstRunPr.FontSize*0.305954545 + 2.378363636;
			if (NewType === numbering_presentationnumfrmt_Char)
			{
				this.Set_Ind({Left : LeftInd + Indent, FirstLine : -Indent}, false);
			}
			else if (NewType === numbering_presentationnumfrmt_None)
			{
				this.Set_Ind({FirstLine : 0, Left : LeftInd}, false);
			}
			else
			{
				var oArabicAlphaMap =
					{
						numbering_presentationnumfrmt_ArabicPeriod  : true,
						numbering_presentationnumfrmt_ArabicParenR  : true,
						numbering_presentationnumfrmt_AlphaLcParenR : true,
						numbering_presentationnumfrmt_AlphaLcPeriod : true,
						numbering_presentationnumfrmt_AlphaUcParenR : true,
						numbering_presentationnumfrmt_AlphaUcPeriod : true
					};
				var oRomanMap       =
					{
						numbering_presentationnumfrmt_RomanUcPeriod : true,
						numbering_presentationnumfrmt_RomanLcPeriod : true
					};
				if (!(oArabicAlphaMap[NewType] && oArabicAlphaMap[UndefType] || oRomanMap[NewType] && oRomanMap[UndefType]))
				{
					if (oArabicAlphaMap[NewType])
					{
						this.Set_Ind({Left : LeftInd + Indent, FirstLine : -Indent}, false);
					}
					else
					{
						this.Set_Ind({Left : LeftInd + Indent, FirstLine : -Indent}, false);
					}
				}
				else
				{
					this.Set_Ind({Left : undefined, FirstLine : undefined}, true);
				}
			}
		}
	}

	if(AscCommon.isRealObject(Pr))
	{
		var Size = Pr.BulletSize;
		var nNumStartAt = Pr.NumStartAt;
		var AscColor = Pr.BulletColor;
		var BulletSymbol = Pr.BulletSymbol;
		var BulletFont = Pr.BulletFont;
		if(AscFormat.isRealNumber(Size) || AscFormat.isRealNumber(nNumStartAt) || AscCommon.isRealObject(AscColor) ||
			(typeof BulletSymbol === "string" && BulletSymbol.length > 0 && typeof BulletFont === "string" && BulletFont.length > 0))
		{
			var oBullet;
			var oParaPr = this.Get_CompiledPr2(false).ParaPr;
			if(oParaPr.Bullet)
			{
				oBullet = oParaPr.Bullet.createDuplicate();
				if(AscFormat.isRealNumber(Size))
				{
					oBullet.bulletSize = new AscFormat.CBulletSize();
					oBullet.bulletSize.type = AscFormat.BULLET_TYPE_SIZE_PCT;
					oBullet.bulletSize.val = (Size * 1000) >> 0;
				}
				if(AscCommon.isRealObject(AscColor))
				{
					oBullet.bulletColor = new AscFormat.CBulletColor();
					oBullet.bulletColor.type = AscFormat.BULLET_TYPE_COLOR_CLR;
					oBullet.bulletColor.UniColor = AscFormat.CorrectUniColor(AscColor, oBullet.bulletColor.UniColor, 0);
				}
				if(oBullet.bulletType)
				{
					if(AscFormat.isRealNumber(nNumStartAt))
					{
						oBullet.bulletType.startAt = nNumStartAt !== 1 ? nNumStartAt : null;
					}
					if(typeof BulletSymbol === "string" && BulletSymbol.length > 0
						&& typeof BulletFont === "string" && BulletFont.length > 0)
					{
						oBullet.bulletType.type = AscFormat.BULLET_TYPE_BULLET_CHAR;
						oBullet.bulletType.Char = BulletSymbol;
						oBullet.bulletTypeface = new AscFormat.CBulletTypeface();
						oBullet.bulletTypeface.type = AscFormat.BULLET_TYPE_TYPEFACE_BUFONT;
						oBullet.bulletTypeface.typeface = BulletFont;
					}
				}
				this.Set_Bullet(oBullet);
			}
		}
	}
};
Paragraph.prototype.Get_PresentationNumbering = function()
{
	this.Get_CompiledPr2(false);
	return this.PresentationPr.Bullet;
};
Paragraph.prototype.Remove_PresentationNumbering = function()
{
	var Bullet             = new AscFormat.CBullet();
	Bullet.bulletType      = new AscFormat.CBulletType();
	Bullet.bulletType.type = AscFormat.BULLET_TYPE_BULLET_NONE;
	this.Add_PresentationNumbering(Bullet);
};
Paragraph.prototype.Set_PresentationLevel = function(Level)
{
	if (this.Pr.Lvl != Level)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphPresentationPrLevel(this, this.Pr.Lvl, Level));
		this.Pr.Lvl                = Level;
		this.CompiledPr.NeedRecalc = true;
		this.Recalc_RunsCompiledPr();
		this.private_UpdateTrackRevisionOnChangeParaPr(true);
	}
};
Paragraph.prototype.GetBulletNum = function()
{
	var Level = this.PresentationPr.Level;
	var Bullet = this.PresentationPr.Bullet;

	var BulletNum = null;
	if (Bullet.Get_Type() >= numbering_presentationnumfrmt_ArabicPeriod)
	{
		var Prev = this.Prev;
		BulletNum = Bullet.Get_StartAt();
		while (null != Prev && type_Paragraph === Prev.GetType())
		{
			var PrevLevel = Prev.PresentationPr.Level;
			var PrevBullet = Prev.Get_PresentationNumbering();
			// Если предыдущий параграф более низкого уровня, тогда его не учитываем
			if (Level < PrevLevel)
			{
				Prev = Prev.Prev;
				continue;
			}
			else if (Level > PrevLevel)
				break;
			else if (PrevBullet.Get_Type() === Bullet.Get_Type() && Bullet.Get_StartAt() === PrevBullet.Get_StartAt())
			{
				if (true != Prev.IsEmpty())
					BulletNum++;

				Prev = Prev.Prev;
			}
			else
			{
				break;
			}
		}
	}
	return BulletNum;
};
//----------------------------------------------------------------------------------------------------------------------
/**
 * Формируем конечные свойства параграфа на основе стиля, возможной нумерации и прямых настроек.
 * Также учитываем настройки предыдущего и последующего параграфов.
 */
Paragraph.prototype.Get_CompiledPr = function()
{
	var Pr = this.Get_CompiledPr2();

	// При формировании конечных настроек параграфа, нужно учитывать предыдущий и последующий
	// параграфы. Например, для формирования интервала между параграфами.
	// max(Prev.After, Cur.Before) - реальное значение расстояния между параграфами.
	// Поэтому Prev.After = Prev.After (значение не меняем), а вот Cur.Before = max(Prev.After, Cur.Before) - Prev.After

	var StyleId = this.Style_Get();
	var NumPr   = this.GetNumPr();
	var FramePr = this.Get_FramePr();

	var PrevEl = this.Get_DocumentPrev();
	var NextEl = this.Get_DocumentNext();

	var oPrevParagraph = this.GetPrevParagraph();
	var oNextParagraph = this.GetNextParagraph();

	// Предыдущий и последующий параграфы - это не обязательно именно предыдущий и последующий. Если данный параграф
	// находится в рамке, тогда надо искать предыдущий и последующий только в текущей рамке, а если мы вне рамки, тогда
	// надо пропускать все параграфы находящиеся в рамке.
	if (undefined !== FramePr)
	{
		if (null === PrevEl || type_Paragraph !== PrevEl.GetType())
			PrevEl = null;
		else
		{
			var PrevFramePr = PrevEl.Get_FramePr();
			if (undefined === PrevFramePr || true !== FramePr.Compare(PrevFramePr))
				PrevEl = null;
		}

		if (null === NextEl || type_Paragraph !== NextEl.GetType())
			NextEl = null;
		else
		{
			var NextFramePr = NextEl.Get_FramePr();
			if (undefined === NextFramePr || true !== FramePr.Compare(NextFramePr))
				NextEl = null;
		}
	}
	else
	{
		while (null !== PrevEl && type_Paragraph === PrevEl.GetType() && undefined !== PrevEl.Get_FramePr())
			PrevEl = PrevEl.Get_DocumentPrev();

		while (null !== NextEl && type_Paragraph === NextEl.GetType() && undefined !== NextEl.Get_FramePr())
			NextEl = NextEl.Get_DocumentNext();
	}

	if (PrevEl && PrevEl.IsParagraph())
	{
		var oPrevPr = PrevEl.Get_CompiledPr2(false).ParaPr;
		if (true === this.private_CompareBorderSettings(oPrevPr, Pr.ParaPr) && undefined === PrevEl.Get_SectionPr() && true !== Pr.ParaPr.PageBreakBefore)
		{
			Pr.ParaPr.Brd.First   = false;
			Pr.ParaPr.Brd.Between = oPrevPr.Brd.Between.Copy();
		}
		else
		{
			Pr.ParaPr.Brd.First = true;
		}
	}

	if (oPrevParagraph && StyleId === oPrevParagraph.Style_Get() && Pr.ParaPr.ContextualSpacing)
	{
		Pr.ParaPr.Spacing.Before = 0;
	}
	else if (null != PrevEl && type_Paragraph === PrevEl.GetType())
	{
		var PrevStyle      = PrevEl.Style_Get();
		var Prev_Pr        = PrevEl.Get_CompiledPr2(false).ParaPr;
		var Prev_After     = Prev_Pr.Spacing.After;
		var Prev_AfterAuto = Prev_Pr.Spacing.AfterAutoSpacing;
		var Cur_Before     = Pr.ParaPr.Spacing.Before;
		var Cur_BeforeAuto = Pr.ParaPr.Spacing.BeforeAutoSpacing;
		var Prev_NumPr     = PrevEl.GetNumPr();

		if (true === Cur_BeforeAuto && PrevStyle === StyleId && undefined != Prev_NumPr && undefined != NumPr && Prev_NumPr.NumId === NumPr.NumId)
			Pr.ParaPr.Spacing.Before = 0;
		else
		{
			Cur_Before = this.Internal_CalculateAutoSpacing(Cur_Before, Cur_BeforeAuto, this);
			Prev_After = this.Internal_CalculateAutoSpacing(Prev_After, Prev_AfterAuto, this);

			if ((true === Prev_Pr.ContextualSpacing
				&& PrevStyle === StyleId)
				|| (true === Prev_AfterAuto
				&& PrevStyle === StyleId
				&& undefined != Prev_NumPr
				&& undefined != NumPr
				&& Prev_NumPr.NumId === NumPr.NumId))
				Prev_After = 0;

			Pr.ParaPr.Spacing.Before = Math.max(Prev_After, Cur_Before) - Prev_After;
		}
	}
	else if (null === PrevEl)
	{
		if (true === this.Parent.IsTableCellContent() && true === Pr.ParaPr.ContextualSpacing)
		{
			var Cell = this.Parent.IsTableCellContent(true);
			if (Cell)
			{
				var PrevEl = Cell.GetLastElementInPrevCell();
				if ((null !== PrevEl && type_Paragraph === PrevEl.GetType() && PrevEl.Style_Get() === StyleId) || (null === PrevEl && undefined === StyleId))
				{
					Pr.ParaPr.Spacing.Before = 0;
				}
			}
		}
		else if (true === this.Parent.IsBlockLevelSdtContent() && true === Pr.ParaPr.ContextualSpacing)
		{
			var oPrevPara = null;
			var oSdt      = this.Parent.Parent;
			while (oSdt instanceof CBlockLevelSdt)
			{
				var oTempPrev = oSdt.Get_DocumentPrev();
				if (oTempPrev)
				{
					oPrevPara = oTempPrev.GetLastParagraph();
					break;
				}

				if (oSdt.Parent instanceof CDocumentContent && oSdt.Parent.Parent instanceof CBlockLevelSdt)
					oSdt = oSdt.Parent.Parent;
				else
					oSdt = null;
			}

			if ((null === oPrevPara && undefined === StyleId) || (oPrevPara && oPrevPara.Style_Get() === StyleId))
				Pr.ParaPr.Spacing.Before = 0;
		}
		else if (true === Pr.ParaPr.Spacing.BeforeAutoSpacing || !(this.bFromDocument === true))
		{
			Pr.ParaPr.Spacing.Before = 0;
		}
	}
	else if (type_Table === PrevEl.GetType())
	{
		if (true === Pr.ParaPr.Spacing.BeforeAutoSpacing)
		{
			Pr.ParaPr.Spacing.Before = 14 * g_dKoef_pt_to_mm;
		}
	}
	else if (PrevEl.IsBlockLevelSdt())
	{
		var oPrevPara = PrevEl.GetLastParagraph();
		if (oPrevPara && oPrevPara.Style_Get() === StyleId)
			Pr.ParaPr.Spacing.Before = 0;
	}

	if (NextEl && NextEl.IsParagraph())
	{
		var oNextPr = NextEl.Get_CompiledPr2(false).ParaPr;
		if (true === this.private_CompareBorderSettings(oNextPr, Pr.ParaPr) && undefined === this.Get_SectionPr() && (undefined === NextEl.Get_SectionPr() || true !== NextEl.IsEmpty()) && true !== oNextPr.PageBreakBefore)
			Pr.ParaPr.Brd.Last = false;
		else
			Pr.ParaPr.Brd.Last = true;
	}

	if (oNextParagraph && StyleId === oNextParagraph.Style_Get() && Pr.ParaPr.ContextualSpacing)
	{
		Pr.ParaPr.Spacing.After = 0;
	}
	else if (null != NextEl)
	{
		if (NextEl.IsParagraph())
		{
			var NextStyle       = NextEl.Style_Get();
			var Cur_After       = Pr.ParaPr.Spacing.After;
			var Cur_AfterAuto   = Pr.ParaPr.Spacing.AfterAutoSpacing;
			var Next_NumPr      = NextEl.GetNumPr();

			if (true === Cur_AfterAuto && NextStyle === StyleId && undefined != Next_NumPr && undefined != NumPr && Next_NumPr.NumId === NumPr.NumId)
				Pr.ParaPr.Spacing.After = 0;
			else
				Pr.ParaPr.Spacing.After = this.Internal_CalculateAutoSpacing(Cur_After, Cur_AfterAuto, this);
		}
		else if (NextEl.IsTable() || NextEl.IsBlockLevelSdt())
		{
			var oNextElFirstParagraph = NextEl.GetFirstParagraph();
			if (oNextElFirstParagraph)
			{
				var NextStyle       = oNextElFirstParagraph.Style_Get();
				var Next_Before     = oNextElFirstParagraph.Get_CompiledPr2(false).ParaPr.Spacing.Before;
				var Next_BeforeAuto = oNextElFirstParagraph.Get_CompiledPr2(false).ParaPr.Spacing.BeforeAutoSpacing;
				var Cur_After       = Pr.ParaPr.Spacing.After;
				var Cur_AfterAuto   = Pr.ParaPr.Spacing.AfterAutoSpacing;
				if (NextStyle === StyleId && true === Pr.ParaPr.ContextualSpacing)
				{
					Cur_After   = this.Internal_CalculateAutoSpacing(Cur_After, Cur_AfterAuto, this);
					Next_Before = this.Internal_CalculateAutoSpacing(Next_Before, Next_BeforeAuto, this);

					Pr.ParaPr.Spacing.After = Math.max(Next_Before, Cur_After) - Cur_After;
				}
				else
				{
					Pr.ParaPr.Spacing.After = this.Internal_CalculateAutoSpacing(Pr.ParaPr.Spacing.After, Cur_AfterAuto, this);
				}
			}
		}
	}
	else
	{
		if (true === this.Parent.IsTableCellContent() && true === Pr.ParaPr.ContextualSpacing)
		{
			var Cell = this.Parent.IsTableCellContent(true);
			if (Cell)
			{
				var NextEl = Cell.GetFirstElementInNextCell();
				if ((null !== NextEl && type_Paragraph === NextEl.GetType() && NextEl.Style_Get() === StyleId) || (null === NextEl && StyleId === undefined))
				{
					Pr.ParaPr.Spacing.After = 0;
				}
			}
		}
		else if (true === this.Parent.IsTableCellContent() && true === Pr.ParaPr.Spacing.AfterAutoSpacing)
		{
			Pr.ParaPr.Spacing.After = 0;
		}
		else if (this.Parent.IsBlockLevelSdtContent() && true === Pr.ParaPr.ContextualSpacing)
		{
			var oNextPara = null;
			var oSdt      = this.Parent.Parent;
			while (oSdt instanceof CBlockLevelSdt)
			{
				var oTempNext = oSdt.Get_DocumentNext();
				if (oTempNext)
				{
					oNextPara = oTempNext.GetFirstParagraph();
					break;
				}

				if (oSdt.Parent instanceof CDocumentContent && oSdt.Parent.Parent instanceof CBlockLevelSdt)
					oSdt = oSdt.Parent.Parent;
				else
					oSdt = null;
			}

			if ((null === oNextPara && undefined === StyleId) || (oNextPara && oNextPara.Style_Get() === StyleId))
				Pr.ParaPr.Spacing.After = 0;
		}
		else if (!(this.bFromDocument === true))
		{
			Pr.ParaPr.Spacing.After = 0;
		}
		else
		{
			Pr.ParaPr.Spacing.After = this.Internal_CalculateAutoSpacing(Pr.ParaPr.Spacing.After, Pr.ParaPr.Spacing.AfterAutoSpacing, this);
		}
	}

	return Pr;
};
Paragraph.prototype.Recalc_CompiledPr = function()
{
	this.CompiledPr.NeedRecalc = true;
};
/**
 * Сообщаем, что нужно пересчитать скомпилированные настройки параграфа
 * @param {boolean} isForce - пересчитать прямо сейчас без дополнительных проверок
 */
Paragraph.prototype.RecalcCompiledPr = function(isForce)
{
	this.CompiledPr.NeedRecalc = true;

	if (isForce && this.bFromDocument)
		this.private_CompileParaPr(true);
};
Paragraph.prototype.Recalc_RunsCompiledPr = function()
{
	var Count = this.Content.length;
	for (var Pos = 0; Pos < Count; Pos++)
	{
		var Element = this.Content[Pos];

		if (Element.Recalc_RunsCompiledPr)
			Element.Recalc_RunsCompiledPr();
	}
};
/**
 * Формируем конечные свойства параграфа на основе стиля, возможной нумерации и прямых настроек.
 * Без пересчета расстояния между параграфами.
 */
Paragraph.prototype.Get_CompiledPr2 = function(bCopy)
{
	this.private_CompileParaPr();

	if (false === bCopy)
		return this.CompiledPr.Pr;
	else
	{
		// Отдаем копию объекта, чтобы никто не поменял извне настройки скомпилированного стиля
		var Pr    = {};
		Pr.TextPr = this.CompiledPr.Pr.TextPr.Copy();
		Pr.ParaPr = this.CompiledPr.Pr.ParaPr.Copy();
		return Pr;
	}
};
Paragraph.prototype.private_CompileParaPr = function(isForce)
{
	if (!this.CompiledPr.NeedRecalc)
		return;

	if (this.Parent && (isForce || (true !== AscCommon.g_oIdCounter.m_bLoad && true !== AscCommon.g_oIdCounter.m_bRead)))
	{
		this.CompiledPr.Pr = this.Internal_CompileParaPr2();
		if (!this.bFromDocument)
		{
			this.PresentationPr.Level  = AscFormat.isRealNumber(this.Pr.Lvl) ? this.Pr.Lvl : 0;
			this.PresentationPr.Bullet = this.CompiledPr.Pr.ParaPr.Get_PresentationBullet(this.Get_Theme(), this.Get_ColorMap());
			this.Numbering.Bullet      = this.PresentationPr.Bullet;
			this.CompiledPr.Pr.ParaPr.Lvl = this.PresentationPr.Level;
		}

		if (isForce && (true === AscCommon.g_oIdCounter.m_bLoad || true === AscCommon.g_oIdCounter.m_bRead))
			this.CompiledPr.NeedRecalc = true;
		else
			this.CompiledPr.NeedRecalc = false;
	}
	else
	{
		if (undefined === this.CompiledPr.Pr || null === this.CompiledPr.Pr)
		{
			this.CompiledPr.Pr = {
				ParaPr : g_oDocumentDefaultParaPr,
				TextPr : g_oDocumentDefaultTextPr
			};

			this.CompiledPr.Pr.ParaPr.StyleTabs  = new CParaTabs();
			this.CompiledPr.Pr.ParaPr.StyleNumPr = undefined;
		}
		this.CompiledPr.NeedRecalc = true;
	}
};
/**
 * Формируем конечные свойства параграфа на основе стиля, возможной нумерации и прямых настроек.
 */
Paragraph.prototype.Internal_CompileParaPr2 = function()
{
	if (this.bFromDocument)
	{
		var Styles     = this.Parent.Get_Styles();
		var Numbering  = this.Parent.GetNumbering();
		var TableStyle = this.Parent.Get_TableStyleForPara();
		var ShapeStyle = this.Parent.Get_ShapeStyleForPara();
		var StyleId    = this.Style_Get();

		// Считываем свойства для текущего стиля
		var Pr = Styles.Get_Pr(StyleId, styletype_Paragraph, TableStyle, ShapeStyle);

		Pr.ParaPr.CheckBorderSpaces();

		// Если в стиле была задана нумерация сохраним это в специальном поле
		if (undefined != Pr.ParaPr.NumPr)
			Pr.ParaPr.StyleNumPr = Pr.ParaPr.NumPr.Copy();

		var Lvl = -1;
		if (undefined != this.Pr.NumPr)
		{
			if (undefined != this.Pr.NumPr.NumId && 0 != this.Pr.NumPr.NumId)
			{
				Lvl = this.Pr.NumPr.Lvl;

				if (Lvl >= 0 && Lvl <= 8)
				{
					Pr.ParaPr.Merge(Numbering.GetParaPr(this.Pr.NumPr.NumId, this.Pr.NumPr.Lvl));
				}
				else
				{
					Lvl             = -1;
					Pr.ParaPr.NumPr = undefined;
				}
			}
			else if (0 === this.Pr.NumPr.NumId)
			{
				// Word значение 0 для NumId воспринимает как отсутствие нумерации
				Lvl             = -1;
				Pr.ParaPr.NumPr = undefined;

				Pr.ParaPr.Ind.Left      = 0;
				Pr.ParaPr.Ind.FirstLine = 0;
			}
		}
		else if (undefined != Pr.ParaPr.NumPr)
		{
			if (undefined != Pr.ParaPr.NumPr.NumId && 0 != Pr.ParaPr.NumPr.NumId)
			{
				var oNum = Numbering.GetNum(Pr.ParaPr.NumPr.NumId);

				var _StyleId            = StyleId;
				Lvl                     = oNum.GetLvlByStyle(_StyleId);
				var PassedStyleId       = {};
				PassedStyleId[_StyleId] = true;
				while (-1 === Lvl)
				{
					var Style = Styles.Get(_StyleId);
					if (!Style)
						break;

					_StyleId = Style.Get_BasedOn();
					if (!_StyleId || true === PassedStyleId[_StyleId])
						break;

					PassedStyleId[_StyleId] = true;
					Lvl                     = oNum.GetLvlByStyle(_StyleId);
				}

				if (-1 === Lvl)
					Pr.ParaPr.NumPr = undefined;
			}
		}

		Pr.ParaPr.StyleTabs = ( undefined != Pr.ParaPr.Tabs ? Pr.ParaPr.Tabs.Copy() : new CParaTabs() );

		// Копируем прямые настройки параграфа.
		Pr.ParaPr.Merge(this.Pr);

		if (-1 != Lvl && undefined != Pr.ParaPr.NumPr)
			Pr.ParaPr.NumPr.Lvl = Lvl;
		else
			Pr.ParaPr.NumPr = undefined;

		// Настройки рамки не наследуются
		if (undefined === this.Pr.FramePr)
			Pr.ParaPr.FramePr = undefined;
		else
			Pr.ParaPr.FramePr = this.Pr.FramePr.Copy();

		return Pr;
	}
	else
	{
		return this.Internal_CompiledParaPrPresentation();
	}
};
Paragraph.prototype.Internal_CompiledParaPrPresentation = function(Lvl, bNoMergeDefault)
{
	var _Lvl        = AscFormat.isRealNumber(Lvl) ? Lvl : (AscFormat.isRealNumber(this.Pr.Lvl) ? this.Pr.Lvl : 0);
	var styleObject = this.Parent.Get_Styles(_Lvl);
	if(!styleObject)
	{
		return {ParaPr : g_oDocumentDefaultParaPr,
				TextPr : g_oDocumentDefaultTextPr
		};
	}
	var Styles      = styleObject.styles;

	// Считываем свойства для текущего стиля
	var Pr = Styles.Get_Pr(styleObject.lastId, styletype_Paragraph, null);

	var TableStyle = this.Parent.Get_TableStyleForPara();
	if (TableStyle && TableStyle.TextPr)
	{
		//var TextPr2 = new CTextPr();
		//TextPr2.Unifill = TableStyle.TextPr.Unifill;
		//TextPr2.RFonts = TableStyle.TextPr.RFonts;
		//TextPr2.Bold = TableStyle.TextPr.Bold;
		//TextPr2.Itali = TableStyle.TextPr.RFonts;
		Pr.TextPr.Merge(TableStyle.TextPr);
	}

	Pr.ParaPr.StyleTabs = ( undefined != Pr.ParaPr.Tabs ? Pr.ParaPr.Tabs.Copy() : new CParaTabs() );

	if(!(bNoMergeDefault === true)){
		// Копируем прямые настройки параграфа.
		Pr.ParaPr.Merge(this.Pr);
		if (this.Pr.DefaultRunPr)
			Pr.TextPr.Merge(this.Pr.DefaultRunPr);
	}
	Pr.TextPr.Color.Auto = false;

	return Pr;
};
/**
 * Сообщаем параграфу, что ему надо будет пересчитать скомпилированный стиль
 * (Такое может случится, если у данного параграфа есть нумерация или задан стиль,
 * которые меняются каким-то внешним образом)
 */
Paragraph.prototype.Recalc_CompileParaPr = function()
{
	this.CompiledPr.NeedRecalc = true;
};
Paragraph.prototype.Internal_CalculateAutoSpacing = function(Value, UseAuto, Para)
{
	var Result = Value;
	if (true === UseAuto)
		Result = 14 * g_dKoef_pt_to_mm;

	return Result;
};
Paragraph.prototype.GetDirectTextPr = function()
{
	var TextPr;
	if (true === this.ApplyToAll)
	{
		this.SelectAll(1);

		var Count    = this.Content.length;
		var StartPos = 0;
		while (true === this.Content[StartPos].IsSelectionEmpty() && StartPos < Count)
			StartPos++;

		TextPr = this.Content[StartPos].GetDirectTextPr();

		this.RemoveSelection();
	}
	else
	{
		if (true === this.Selection.Use)
		{
			var StartPos = this.Selection.StartPos;
			var EndPos   = this.Selection.EndPos;

			if (StartPos > EndPos)
			{
				StartPos = this.Selection.EndPos;
				EndPos   = this.Selection.StartPos;
			}

			while (true === this.Content[StartPos].IsSelectionEmpty() && StartPos < EndPos)
				StartPos++;

			TextPr = this.Content[StartPos].GetDirectTextPr();
		}
		else
		{
			TextPr = this.Content[this.CurPos.ContentPos].GetDirectTextPr();
		}
	}

	if (TextPr)
		TextPr = TextPr.Copy();
	else
		TextPr = new CTextPr();

	return TextPr;
};
/**
 * Получаем прямые настройки параграфа
 * @param [isCopy=true] копировать ли настройки
 * @returns {CParaPr}
 */
Paragraph.prototype.GetDirectParaPr = function(isCopy)
{
	if (false === isCopy)
		return this.Pr;

	return this.Pr.Copy();
};
Paragraph.prototype.PasteFormatting = function(TextPr, oParaPr, ApplyPara)
{
	// Применяем текстовые настройки всегда
	if (TextPr)
	{
		var oParaTextPr = new ParaTextPr();
		oParaTextPr.Value.Set_FromObject(TextPr, true);
		this.Add(oParaTextPr);
	}

	// Применяем настройки параграфа
	if (oParaPr)
	{
		this.Set_ContextualSpacing(oParaPr.ContextualSpacing);

		if (oParaPr.Ind)
			this.Set_Ind(oParaPr.Ind, true);
		else
			this.Set_Ind(new CParaInd(), true);

		this.Set_Align(oParaPr.Jc);
		this.Set_KeepLines(oParaPr.KeepLines);
		this.Set_KeepNext(oParaPr.KeepNext);
		this.Set_PageBreakBefore(oParaPr.PageBreakBefore);

		if (oParaPr.Spacing)
			this.Set_Spacing(oParaPr.Spacing, true);
		else
			this.Set_Spacing(new CParaSpacing(), true);

		if (oParaPr.Shd)
			this.Set_Shd(oParaPr.Shd, true);
		else
			this.Set_Shd(undefined);

		this.Set_WidowControl(oParaPr.WidowControl);

		if (oParaPr.Tabs)
			this.Set_Tabs(oParaPr.Tabs);
		else
			this.Set_Tabs(new CParaTabs());


		if (this.bFromDocument)
		{
			if (oParaPr.NumPr)
				this.SetNumPr(oParaPr.NumPr.NumId, oParaPr.NumPr.Lvl);
			else
				this.RemoveNumPr();

			if (oParaPr.PStyle)
				this.Style_Add(oParaPr.PStyle, true);
			else
				this.Style_Remove();

			if (oParaPr.Brd)
				this.Set_Borders(oParaPr.Brd);
		}
		else
		{
			this.Set_Bullet(oParaPr.Bullet);
		}
	}
};
Paragraph.prototype.Style_Get = function()
{
	if (undefined != this.Pr.PStyle)
		return this.Pr.PStyle;

	return undefined;
};
Paragraph.prototype.Style_Add = function(Id, bDoNotDeleteProps)
{
	this.RecalcInfo.Set_Type_0(pararecalc_0_All);

	if (undefined !== this.Pr.PStyle)
		this.Style_Remove();

	if (null === Id || (undefined === Id && true === bDoNotDeleteProps))
		return;

	var oDefParaId = this.LogicDocument ? this.LogicDocument.Get_Styles().Get_Default_Paragraph() : null;

	// Надо пересчитать конечный стиль самого параграфа и всех текстовых блоков
	this.CompiledPr.NeedRecalc = true;
	this.Recalc_RunsCompiledPr();

	// Если стиль является стилем по умолчанию для параграфа, тогда не надо его записывать.
	if (Id != oDefParaId && undefined !== Id)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphPStyle(this, this.Pr.PStyle, Id));
		this.Pr.PStyle = Id;
		this.private_UpdateTrackRevisionOnChangeParaPr(true);
		this.UpdateDocumentOutline();
	}

	if (true === bDoNotDeleteProps)
		return;

	// TODO: По мере добавления элементов в стили параграфа и текста добавить их обработку здесь.

	// При выставлении стиля свойства буквицы(рамки) всегда сбрасываются
	if (undefined !== this.Get_FramePr())
	{
		this.Set_FramePr(undefined, true);
		this.Clear_TextFormatting();
	}

	// Не удаляем форматирование, при добавлении списка к данному параграфу
	var DefNumId = this.LogicDocument ? this.LogicDocument.Get_Styles().Get_Default_ParaList() : null;
	if (Id !== DefNumId)
	{
		this.SetNumPr(undefined);
		this.Set_ContextualSpacing(undefined);
		this.Set_Ind(new CParaInd(), true);
		this.Set_Align(undefined);
		this.Set_KeepLines(undefined);
		this.Set_KeepNext(undefined);
		this.Set_PageBreakBefore(undefined);
		this.Set_Spacing(new CParaSpacing(), true);
		this.Set_Shd(undefined, true);
		this.Set_WidowControl(undefined);
		this.Set_Tabs(undefined);
		this.Set_Border(undefined, AscDFH.historyitem_Paragraph_Borders_Between);
		this.Set_Border(undefined, AscDFH.historyitem_Paragraph_Borders_Bottom);
		this.Set_Border(undefined, AscDFH.historyitem_Paragraph_Borders_Left);
		this.Set_Border(undefined, AscDFH.historyitem_Paragraph_Borders_Right);
		this.Set_Border(undefined, AscDFH.historyitem_Paragraph_Borders_Top);
	}
};
/**
 * Добавление стиля в параграф при открытии и копировании
 */
Paragraph.prototype.Style_Add_Open = function(Id)
{
	this.Pr.PStyle = Id;

	// Надо пересчитать конечный стиль
	this.CompiledPr.NeedRecalc = true;
};
Paragraph.prototype.Style_Remove = function()
{
	if (undefined != this.Pr.PStyle)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphPStyle(this, this.Pr.PStyle, undefined));
		this.Pr.PStyle = undefined;
		this.UpdateDocumentOutline();
	}

	// Надо пересчитать конечный стиль
	this.CompiledPr.NeedRecalc = true;
	this.Recalc_RunsCompiledPr();
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
};
/**
 * Проверяем находится ли курсор в конце параграфа
 */
Paragraph.prototype.IsCursorAtEnd = function(_ContentPos)
{
	// Просто попробуем переместится вправо от текущего положения, если мы не можем, значит
	// мы стоим в конце параграфа.

	var ContentPos = ( undefined === _ContentPos ? this.Get_ParaContentPos(false, false) : _ContentPos );
	var SearchPos  = new CParagraphSearchPos();

	this.Get_RightPos(SearchPos, ContentPos, false);

	if (true === SearchPos.Found)
		return false;
	else
		return true;
};
/**
 * Проверяем находится ли курсор в начале параграфа
 */
Paragraph.prototype.IsCursorAtBegin = function(_ContentPos, bCheckAnchors)
{
	// Просто попробуем переместится вправо от текущего положения, если мы не можем, значит
	// мы стоим в конце параграфа.

	var ContentPos = ( undefined === _ContentPos ? this.Get_ParaContentPos(false, false) : _ContentPos );
	var SearchPos  = new CParagraphSearchPos();
	if (true === bCheckAnchors)
		SearchPos.SetCheckAnchors();

	this.Get_LeftPos(SearchPos, ContentPos);

	if (true === SearchPos.Found)
		return false;
	else
		return true;
};
/**
 * Проверим, начинается ли выделение с начала параграфа
 */
Paragraph.prototype.Selection_IsFromStart = function(bCheckAnchors)
{
	if (true === this.IsSelectionUse())
	{
		var StartPos = this.Get_ParaContentPos(true, true);
		var EndPos   = this.Get_ParaContentPos(true, false);

		if (StartPos.Compare(EndPos) > 0)
			StartPos = EndPos;

		if (true != this.IsCursorAtBegin(StartPos, bCheckAnchors))
			return false;

		return true;
	}

	return false;
};
/**
 * Очищение форматирования параграфа
 */
Paragraph.prototype.Clear_Formatting = function()
{
	if (this.bFromDocument && this.Parent)
	{
		var oStyles    = this.Parent.Get_Styles();
		var oHdrFtr    = this.Parent.IsHdrFtr(true);
		var isFootnote = this.Parent.IsFootnote();
		if (null !== oHdrFtr)
		{
			var sHdrFtrStyleId = null;
			if (AscCommon.hdrftr_Header === oHdrFtr.Type)
				sHdrFtrStyleId = oStyles.Get_Default_Header();
			else
				sHdrFtrStyleId = oStyles.Get_Default_Footer();

			if (null !== sHdrFtrStyleId)
				this.Style_Add(sHdrFtrStyleId, true);
			else
				this.Style_Remove();
		}
		else if (isFootnote)
		{
			var sFootnoteStyleId = oStyles.GetDefaultFootnoteText();
			if (sFootnoteStyleId)
				this.Style_Add(sFootnoteStyleId, true);
			else
				this.Style_Remove();
		}
		else
		{
			this.Style_Remove();
		}

		this.RemoveNumPr();
	}

	this.Set_ContextualSpacing(undefined);
	this.Set_Ind(new CParaInd(), true);
	this.Set_Align(undefined, false);
	this.Set_KeepLines(undefined);
	this.Set_KeepNext(undefined);
	this.Set_PageBreakBefore(undefined);
	this.Set_Spacing(new CParaSpacing(), true);
	this.Set_Shd(new CDocumentShd(), true);
	this.Set_WidowControl(undefined);
	this.Set_Tabs(new CParaTabs());
	this.Set_Border(undefined, AscDFH.historyitem_Paragraph_Borders_Between);
	this.Set_Border(undefined, AscDFH.historyitem_Paragraph_Borders_Bottom);
	this.Set_Border(undefined, AscDFH.historyitem_Paragraph_Borders_Left);
	this.Set_Border(undefined, AscDFH.historyitem_Paragraph_Borders_Right);
	this.Set_Border(undefined, AscDFH.historyitem_Paragraph_Borders_Top);
	if (!(this.bFromDocument === true))
	{
		this.Set_Bullet(undefined);
	}
	// Надо пересчитать конечный стиль
	this.CompiledPr.NeedRecalc = true;
};
Paragraph.prototype.Clear_TextFormatting = function()
{
	var sDefHyperlink = null;
	if (this.bFromDocument && this.LogicDocument)
	{
		sDefHyperlink = this.LogicDocument.GetStyles().GetDefaultHyperlink();
	}

	for (var Index = 0; Index < this.Content.length; Index++)
	{
		var Item = this.Content[Index];
		Item.Clear_TextFormatting(sDefHyperlink);
	}

	this.TextPr.Clear_Style();
};
Paragraph.prototype.Set_Ind = function(Ind, bDeleteUndefined)
{
	if (undefined === this.Pr.Ind)
		this.Pr.Ind = new CParaInd();

	if (( undefined != Ind.FirstLine || true === bDeleteUndefined ) && this.Pr.Ind.FirstLine !== Ind.FirstLine)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphIndFirst(this, this.Pr.Ind.FirstLine, Ind.FirstLine));
		this.Pr.Ind.FirstLine = Ind.FirstLine;
	}

	if (( undefined != Ind.Left || true === bDeleteUndefined ) && this.Pr.Ind.Left !== Ind.Left)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphIndLeft(this, this.Pr.Ind.Left, Ind.Left));
		this.Pr.Ind.Left = Ind.Left;
	}

	if (( undefined != Ind.Right || true === bDeleteUndefined ) && this.Pr.Ind.Right !== Ind.Right)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphIndRight(this, this.Pr.Ind.Right, Ind.Right));
		this.Pr.Ind.Right = Ind.Right;
	}

	// Надо пересчитать конечный стиль
	this.CompiledPr.NeedRecalc = true;
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
};
Paragraph.prototype.Set_Spacing = function(Spacing, bDeleteUndefined)
{
	if (undefined === this.Pr.Spacing)
		this.Pr.Spacing = new CParaSpacing();

	if (( undefined != Spacing.Line || true === bDeleteUndefined ) && this.Pr.Spacing.Line !== Spacing.Line)
	{
		var LineValue = Spacing.Line;

		if (undefined !== Spacing.Line)
		{
			// TODO: Здесь делается корректировка значения, потому что при работе с буквицей могут возникать значения,
			//       которые неправильно записываются в файл, т.к. в docx это значение имеет тип Twips. Надо бы такую
			//       корректировку вынести в отдельную функцию и добавить ко всем параметрам.
			if ((undefined !== Spacing.LineRule && Spacing.LineRule !== linerule_Auto)
				|| (undefined === Spacing.LineRule && (linerule_Exact === this.Pr.Spacing.LineRule || linerule_AtLeast === this.Pr.Spacing.LineRule)))
				LineValue = AscCommon.CorrectMMToTwips(((Spacing.Line / 25.4 * 72 * 20) | 0) * 25.4 / 20 / 72);
		}

		this.private_AddPrChange();
		History.Add(new CChangesParagraphSpacingLine(this, this.Pr.Spacing.Line, LineValue));
		this.Pr.Spacing.Line = LineValue;
	}

	if (( undefined != Spacing.LineRule || true === bDeleteUndefined ) && this.Pr.Spacing.LineRule !== Spacing.LineRule)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphSpacingLineRule(this, this.Pr.Spacing.LineRule, Spacing.LineRule));
		this.Pr.Spacing.LineRule = Spacing.LineRule;
	}

	if (( undefined != Spacing.Before || true === bDeleteUndefined ) && this.Pr.Spacing.Before !== Spacing.Before)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphSpacingBefore(this, this.Pr.Spacing.Before, Spacing.Before));
		this.Pr.Spacing.Before = Spacing.Before;
	}

	if (( undefined != Spacing.After || true === bDeleteUndefined ) && this.Pr.Spacing.After !== Spacing.After)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphSpacingAfter(this, this.Pr.Spacing.After, Spacing.After));
		this.Pr.Spacing.After = Spacing.After;
	}

	if (( undefined != Spacing.AfterAutoSpacing || true === bDeleteUndefined ) && this.Pr.Spacing.AfterAutoSpacing !== Spacing.AfterAutoSpacing)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphSpacingAfterAutoSpacing(this, this.Pr.Spacing.AfterAutoSpacing, Spacing.AfterAutoSpacing));
		this.Pr.Spacing.AfterAutoSpacing = Spacing.AfterAutoSpacing;
	}

	if (( undefined != Spacing.BeforeAutoSpacing || true === bDeleteUndefined ) && this.Pr.Spacing.BeforeAutoSpacing !== Spacing.BeforeAutoSpacing)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphSpacingBeforeAutoSpacing(this, this.Pr.Spacing.BeforeAutoSpacing, Spacing.BeforeAutoSpacing));
		this.Pr.Spacing.BeforeAutoSpacing = Spacing.BeforeAutoSpacing;
	}

	// Надо пересчитать конечный стиль
	this.CompiledPr.NeedRecalc = true;
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
};
Paragraph.prototype.Set_Align = function(Align)
{
	if (this.Pr.Jc != Align)
	{
		this.private_AddPrChange();

		History.Add(new CChangesParagraphAlign(this, this.Pr.Jc, Align));
		this.Pr.Jc = Align;

		// Надо пересчитать конечный стиль
		this.CompiledPr.NeedRecalc = true;
		this.private_UpdateTrackRevisionOnChangeParaPr(true);

		for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
		{
			var oElement = this.Content[nIndex];
			if (para_Math === oElement.Type && true !== oElement.Is_Inline())
				oElement.Set_Align(Align);
		}
	}
};
Paragraph.prototype.Set_DefaultTabSize = function(TabSize)
{
	if (this.Pr.DefaultTab != TabSize)
	{
		this.private_AddPrChange();

		History.Add(new CChangesParagraphDefaultTabSize(this, this.Pr.DefaultTab, TabSize));
		this.Pr.DefaultTab = TabSize;

		// Надо пересчитать конечный стиль
		this.CompiledPr.NeedRecalc = true;
		this.private_UpdateTrackRevisionOnChangeParaPr(true);

	}
};
Paragraph.prototype.Set_Shd = function(_Shd, bDeleteUndefined)
{
	if (undefined === _Shd)
	{
		if (undefined != this.Pr.Shd)
		{
			this.private_AddPrChange();
			History.Add(new CChangesParagraphShd(this, this.Pr.Shd, undefined));
			this.Pr.Shd = undefined;
		}
	}
	else
	{
		var Shd = new CDocumentShd();
		Shd.Set_FromObject(_Shd);

		if (undefined === this.Pr.Shd)
		{
			this.Pr.Shd = new CDocumentShd();
			History.Add(new CChangesParagraphShd(this, undefined, this.Pr.Shd));
		}

		if (( undefined != Shd.Value || true === bDeleteUndefined ) && this.Pr.Shd.Value !== Shd.Value)
		{
			this.private_AddPrChange();
			History.Add(new CChangesParagraphShdValue(this, this.Pr.Shd.Value, Shd.Value));
			this.Pr.Shd.Value = Shd.Value;
		}

		if (undefined != Shd.Color || true === bDeleteUndefined)
		{
			this.private_AddPrChange();
			History.Add(new CChangesParagraphShdColor(this, this.Pr.Shd.Color, Shd.Color));
			this.Pr.Shd.Color = Shd.Color;
		}

		if (undefined != Shd.Unifill || true === bDeleteUndefined)
		{
			this.private_AddPrChange();
			History.Add(new CChangesParagraphShdUnifill(this, this.Pr.Shd.Unifill, Shd.Unifill));
			this.Pr.Shd.Unifill = Shd.Unifill;
		}
	}

	// Надо пересчитать конечный стиль
	this.CompiledPr.NeedRecalc = true;
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
};
Paragraph.prototype.Set_Tabs = function(Tabs)
{
	var _Tabs = new CParaTabs();

	if (Tabs)
	{
		var StyleTabs = this.Get_CompiledPr2(false).ParaPr.StyleTabs;

		// 1. Ищем табы, которые уже есть в стиле (такие добавлять не надо)
		for (var Index = 0; Index < Tabs.Tabs.length; Index++)
		{
			var Value = StyleTabs.Get_Value(Tabs.Tabs[Index].Pos);
			if (-1 === Value)
				_Tabs.Add(Tabs.Tabs[Index]);
		}

		// 2. Ищем табы в стиле, которые нужно отменить
		for (var Index = 0; Index < StyleTabs.Tabs.length; Index++)
		{
			var Value = _Tabs.Get_Value(StyleTabs.Tabs[Index].Pos);
			if (tab_Clear != StyleTabs.Tabs[Index] && -1 === Value)
				_Tabs.Add(new CParaTab(tab_Clear, StyleTabs.Tabs[Index].Pos));
		}
	}

	this.private_AddPrChange();
	History.Add(new CChangesParagraphTabs(this, this.Pr.Tabs, _Tabs));
	this.Pr.Tabs = _Tabs;

	// Надо пересчитать конечный стиль
	this.CompiledPr.NeedRecalc = true;
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
};
Paragraph.prototype.Set_ContextualSpacing = function(Value)
{
	if (Value != this.Pr.ContextualSpacing)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphContextualSpacing(this, this.Pr.ContextualSpacing, Value));
		this.Pr.ContextualSpacing = Value;

		// Надо пересчитать конечный стиль
		this.CompiledPr.NeedRecalc = true;
		this.private_UpdateTrackRevisionOnChangeParaPr(true);
	}
};
Paragraph.prototype.Set_PageBreakBefore = function(Value)
{
	if (Value != this.Pr.PageBreakBefore)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphPageBreakBefore(this, this.Pr.PageBreakBefore, Value));
		this.Pr.PageBreakBefore = Value;

		// Надо пересчитать конечный стиль
		this.CompiledPr.NeedRecalc = true;
		this.private_UpdateTrackRevisionOnChangeParaPr(true);
	}
};
Paragraph.prototype.Set_KeepLines = function(Value)
{
	if (Value != this.Pr.KeepLines)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphKeepLines(this, this.Pr.KeepLines, Value));
		this.Pr.KeepLines = Value;

		// Надо пересчитать конечный стиль
		this.CompiledPr.NeedRecalc = true;
		this.private_UpdateTrackRevisionOnChangeParaPr(true);
	}
};
Paragraph.prototype.Set_KeepNext = function(Value)
{
	if (Value != this.Pr.KeepNext)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphKeepNext(this, this.Pr.KeepNext, Value));
		this.Pr.KeepNext = Value;

		// Надо пересчитать конечный стиль
		this.CompiledPr.NeedRecalc = true;
		this.private_UpdateTrackRevisionOnChangeParaPr(true);
	}
};
Paragraph.prototype.IsKeepNext = function()
{
	return this.Get_CompiledPr2(false).ParaPr.KeepNext;
};
Paragraph.prototype.Set_WidowControl = function(Value)
{
	if (Value != this.Pr.WidowControl)
	{
		this.private_AddPrChange();
		History.Add(new CChangesParagraphWidowControl(this, this.Pr.WidowControl, Value));
		this.Pr.WidowControl = Value;

		// Надо пересчитать конечный стиль
		this.CompiledPr.NeedRecalc = true;
		this.private_UpdateTrackRevisionOnChangeParaPr(true);
	}
};
Paragraph.prototype.Set_Borders = function(Borders)
{
	if (undefined === Borders)
		return;

	var OldBorders = this.Get_CompiledPr2(false).ParaPr.Brd;

	if (undefined != Borders.Between)
	{
		var NewBorder = undefined;
		if (undefined != Borders.Between.Value /*&& border_Single === Borders.Between.Value*/)
		{
			NewBorder         = new CDocumentBorder();
			NewBorder.Color   = ( undefined != Borders.Between.Color ? new CDocumentColor(Borders.Between.Color.r, Borders.Between.Color.g, Borders.Between.Color.b) : new CDocumentColor(OldBorders.Between.Color.r, OldBorders.Between.Color.g, OldBorders.Between.Color.b) );
			NewBorder.Space   = ( undefined != Borders.Between.Space ? Borders.Between.Space : OldBorders.Between.Space );
			NewBorder.Size    = ( undefined != Borders.Between.Size ? Borders.Between.Size : OldBorders.Between.Size  );
			NewBorder.Value   = ( undefined != Borders.Between.Value ? Borders.Between.Value : OldBorders.Between.Value );
			NewBorder.Unifill = ( undefined != Borders.Between.Unifill ? Borders.Between.Unifill.createDuplicate() : OldBorders.Between.Unifill );
		}

		this.private_AddPrChange();
		History.Add(new CChangesParagraphBordersBetween(this, this.Pr.Brd.Between, NewBorder));
		this.Pr.Brd.Between = NewBorder;
	}

	if (undefined != Borders.Top)
	{
		var NewBorder = undefined;
		if (undefined != Borders.Top.Value /*&& border_Single === Borders.Top.Value*/)
		{
			NewBorder         = new CDocumentBorder();
			NewBorder.Color   = ( undefined != Borders.Top.Color ? new CDocumentColor(Borders.Top.Color.r, Borders.Top.Color.g, Borders.Top.Color.b) : new CDocumentColor(OldBorders.Top.Color.r, OldBorders.Top.Color.g, OldBorders.Top.Color.b) );
			NewBorder.Space   = ( undefined != Borders.Top.Space ? Borders.Top.Space : OldBorders.Top.Space );
			NewBorder.Size    = ( undefined != Borders.Top.Size ? Borders.Top.Size : OldBorders.Top.Size  );
			NewBorder.Value   = ( undefined != Borders.Top.Value ? Borders.Top.Value : OldBorders.Top.Value );
			NewBorder.Unifill = ( undefined != Borders.Top.Unifill ? Borders.Top.Unifill.createDuplicate() : OldBorders.Top.Unifill );

		}

		this.private_AddPrChange();
		History.Add(new CChangesParagraphBordersTop(this, this.Pr.Brd.Top, NewBorder));
		this.Pr.Brd.Top = NewBorder;
	}

	if (undefined != Borders.Right)
	{
		var NewBorder = undefined;
		if (undefined != Borders.Right.Value /*&& border_Single === Borders.Right.Value*/)
		{
			NewBorder         = new CDocumentBorder();
			NewBorder.Color   = ( undefined != Borders.Right.Color ? new CDocumentColor(Borders.Right.Color.r, Borders.Right.Color.g, Borders.Right.Color.b) : new CDocumentColor(OldBorders.Right.Color.r, OldBorders.Right.Color.g, OldBorders.Right.Color.b) );
			NewBorder.Space   = ( undefined != Borders.Right.Space ? Borders.Right.Space : OldBorders.Right.Space );
			NewBorder.Size    = ( undefined != Borders.Right.Size ? Borders.Right.Size : OldBorders.Right.Size  );
			NewBorder.Value   = ( undefined != Borders.Right.Value ? Borders.Right.Value : OldBorders.Right.Value );
			NewBorder.Unifill = ( undefined != Borders.Right.Unifill ? Borders.Right.Unifill.createDuplicate() : OldBorders.Right.Unifill );

		}

		this.private_AddPrChange();
		History.Add(new CChangesParagraphBordersRight(this, this.Pr.Brd.Right, NewBorder));
		this.Pr.Brd.Right = NewBorder;
	}

	if (undefined != Borders.Bottom)
	{
		var NewBorder = undefined;
		if (undefined != Borders.Bottom.Value /*&& border_Single === Borders.Bottom.Value*/)
		{
			NewBorder         = new CDocumentBorder();
			NewBorder.Color   = ( undefined != Borders.Bottom.Color ? new CDocumentColor(Borders.Bottom.Color.r, Borders.Bottom.Color.g, Borders.Bottom.Color.b) : new CDocumentColor(OldBorders.Bottom.Color.r, OldBorders.Bottom.Color.g, OldBorders.Bottom.Color.b) );
			NewBorder.Space   = ( undefined != Borders.Bottom.Space ? Borders.Bottom.Space : OldBorders.Bottom.Space );
			NewBorder.Size    = ( undefined != Borders.Bottom.Size ? Borders.Bottom.Size : OldBorders.Bottom.Size  );
			NewBorder.Value   = ( undefined != Borders.Bottom.Value ? Borders.Bottom.Value : OldBorders.Bottom.Value );
			NewBorder.Unifill = ( undefined != Borders.Bottom.Unifill ? Borders.Bottom.Unifill.createDuplicate() : OldBorders.Bottom.Unifill );
		}

		this.private_AddPrChange();
		History.Add(new CChangesParagraphBordersBottom(this, this.Pr.Brd.Bottom, NewBorder));
		this.Pr.Brd.Bottom = NewBorder;
	}

	if (undefined != Borders.Left)
	{
		var NewBorder = undefined;
		if (undefined != Borders.Left.Value /*&& border_Single === Borders.Left.Value*/)
		{
			NewBorder         = new CDocumentBorder();
			NewBorder.Color   = ( undefined != Borders.Left.Color ? new CDocumentColor(Borders.Left.Color.r, Borders.Left.Color.g, Borders.Left.Color.b) : new CDocumentColor(OldBorders.Left.Color.r, OldBorders.Left.Color.g, OldBorders.Left.Color.b) );
			NewBorder.Space   = ( undefined != Borders.Left.Space ? Borders.Left.Space : OldBorders.Left.Space );
			NewBorder.Size    = ( undefined != Borders.Left.Size ? Borders.Left.Size : OldBorders.Left.Size  );
			NewBorder.Value   = ( undefined != Borders.Left.Value ? Borders.Left.Value : OldBorders.Left.Value );
			NewBorder.Unifill = ( undefined != Borders.Left.Unifill ? Borders.Left.Unifill.createDuplicate() : OldBorders.Left.Unifill );

		}

		this.private_AddPrChange();
		History.Add(new CChangesParagraphBordersLeft(this, this.Pr.Brd.Left, NewBorder));
		this.Pr.Brd.Left = NewBorder;
	}

	// Надо пересчитать конечный стиль
	this.CompiledPr.NeedRecalc = true;
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
};
Paragraph.prototype.Set_Border = function(Border, HistoryType)
{
	switch (HistoryType)
	{
		case AscDFH.historyitem_Paragraph_Borders_Between:
			History.Add(new CChangesParagraphBordersBetween(this, this.Pr.Brd.Between, Border));
			this.Pr.Brd.Between = Border;
			break;
		case AscDFH.historyitem_Paragraph_Borders_Bottom:
			History.Add(new CChangesParagraphBordersBottom(this, this.Pr.Brd.Bottom, Border));
			this.Pr.Brd.Bottom = Border;
			break;
		case AscDFH.historyitem_Paragraph_Borders_Left:
			History.Add(new CChangesParagraphBordersLeft(this, this.Pr.Brd.Left, Border));
			this.Pr.Brd.Left = Border;
			break;
		case AscDFH.historyitem_Paragraph_Borders_Right:
			History.Add(new CChangesParagraphBordersRight(this, this.Pr.Brd.Right, Border));
			this.Pr.Brd.Right = Border;
			break;
		case AscDFH.historyitem_Paragraph_Borders_Top:
			History.Add(new CChangesParagraphBordersTop(this, this.Pr.Brd.Top, Border));
			this.Pr.Brd.Top = Border;
			break;
	}

	this.private_AddPrChange();

	// Надо пересчитать конечный стиль
	this.CompiledPr.NeedRecalc = true;
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
};
Paragraph.prototype.Set_Bullet = function(Bullet)
{
	this.private_AddPrChange();
	History.Add(new CChangesParagraphPresentationPrBullet(this, this.Pr.Bullet, Bullet));
	this.Pr.Bullet             = Bullet;
	this.CompiledPr.NeedRecalc = true;
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
};
Paragraph.prototype.SetOutlineLvl = function(nLvl)
{
	if (null === nLvl)
		nLvl = undefined;

	this.private_AddPrChange();
	History.Add(new CChangesParagraphOutlineLvl(this, this.Pr.OutlineLvl, nLvl));
	this.Pr.OutlineLvl = nLvl;
	this.CompiledPr.NeedRecalc = true;
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
};
Paragraph.prototype.GetOutlineLvl = function()
{
	// TODO: Заглушка со стилями заголовков тут временная
	var ParaPr  = this.Get_CompiledPr2(false).ParaPr;
	if(this.LogicDocument)
	{
		var oStyles = this.LogicDocument.Get_Styles();
		for (var nIndex = 0; nIndex < 9; ++nIndex)
		{
			if (ParaPr.PStyle === oStyles.Get_Default_Heading(nIndex))
				return nIndex;
		}
	}

	return ParaPr.OutlineLvl;
};
/**
 * Проверяем начинается ли текущий параграф с новой страницы.
 */
Paragraph.prototype.IsStartFromNewPage = function()
{
	// TODO: пока здесь стоит простая проверка. В будущем надо будет данную проверку улучшить.
	//       Например, сейчас не учитывается случай, когда в начале параграфа стоит PageBreak.

	if ((this.Pages.length > 1 && this.Pages[0].FirstLine === this.Pages[1].FirstLine) || (1 === this.Pages.length && -1 === this.Pages[0].EndLine) || (null === this.Get_DocumentPrev()))
		return true;

	return false;
};
/**
 * Возвращаем ран в котором лежит данный объект
 */
Paragraph.prototype.Get_DrawingObjectRun = function(Id)
{
	var Run        = null;
	var ContentLen = this.Content.length;
	for (var Index = 0; Index < ContentLen; Index++)
	{
		var Element = this.Content[Index];

		Run = Element.Get_DrawingObjectRun(Id);

		if (null !== Run)
			return Run;
	}

	return Run;
};
Paragraph.prototype.Get_DrawingObjectContentPos = function(Id)
{
	var ContentPos = new CParagraphContentPos();

	var ContentLen = this.Content.length;
	for (var Index = 0; Index < ContentLen; Index++)
	{
		var Element = this.Content[Index];

		if (true === Element.Get_DrawingObjectContentPos(Id, ContentPos, 1))
		{
			ContentPos.Update2(Index, 0);
			return ContentPos;
		}
	}

	return null;
};
Paragraph.prototype.Internal_CorrectAnchorPos = function(Result, Drawing)
{
	if (!this.IsRecalculated())
		return;

	// Поправляем позицию
	var RelH = Drawing.PositionH.RelativeFrom;
	var RelV = Drawing.PositionV.RelativeFrom;

	if (Asc.c_oAscRelativeFromH.Character != RelH || c_oAscRelativeFromV.Line != RelV)
	{
		var CurLine = Result.Internal.Line;
		if (c_oAscRelativeFromV.Line != RelV)
		{
			var CurPage = Result.Internal.Page;
			CurLine     = this.Pages[CurPage].StartLine;
		}

		Result.X = this.Lines[CurLine].Ranges[0].X - 3.8;
	}

	if (c_oAscRelativeFromV.Line != RelV)
	{
		var CurPage = Result.Internal.Page;
		var CurLine = this.Pages[CurPage].StartLine;
		Result.Y    = this.Pages[CurPage].Y + this.Lines[CurLine].Y - this.Lines[CurLine].Metrics.Ascent;
	}

	if (Asc.c_oAscRelativeFromH.Character === RelH)
	{
		// Ничего не делаем
	}
	else if (c_oAscRelativeFromV.Line === RelV)
	{
		// Ничего не делаем, пусть ссылка будет в позиции, которая записана в NearPos
	}
	else if (0 === Result.Internal.Page)
	{
		// Перемещаем ссылку в начало параграфа
		Result.ContentPos = this.Get_StartPos();
	}
};
/**
 * Получем ближающую возможную позицию курсора
 */
Paragraph.prototype.Get_NearestPos = function(CurPage, X, Y, bAnchor, Drawing)
{
	var SearchPosXY = this.Get_ParaContentPosByXY(X, Y, CurPage, false, false);

	this.Set_ParaContentPos(SearchPosXY.Pos, true, SearchPosXY.Line, SearchPosXY.Range);
	var ContentPos = this.Get_ParaContentPos(false, false);

	ContentPos = this.private_CorrectNearestPos(ContentPos, bAnchor, Drawing);

	var Result = this.Internal_Recalculate_CurPos(ContentPos, false, false, true);

	// Сохраняем параграф и найденное место в параграфе
	Result.ContentPos = ContentPos;
	Result.SearchPos  = SearchPosXY.Pos;
	Result.Paragraph  = this;
	Result.transform  = this.Get_ParentTextTransform();

	if (true === bAnchor && undefined != Drawing && null != Drawing)
		this.Internal_CorrectAnchorPos(Result, Drawing);

	return Result;
};
Paragraph.prototype.private_CorrectNearestPos = function(ContentPos, Anchor, Drawing)
{
	// Не разрешаем вставлять и привязывать любые объекты к формуле
	if (undefined !== Drawing && null !== Drawing)
	{
		var CurPos = ContentPos.Get(0);
		if (para_Math === this.Content[CurPos].Type)
		{
			if (CurPos > 0)
			{
				CurPos--;

				ContentPos = new CParagraphContentPos();
				ContentPos.Update(CurPos, 0);
				this.Content[CurPos].Get_EndPos(false, ContentPos, 1);
				this.Set_ParaContentPos(ContentPos, false, -1, -1);
			}
			else
			{
				CurPos++;

				ContentPos = new CParagraphContentPos();
				ContentPos.Update(CurPos, 0);
				this.Content[CurPos].Get_StartPos(ContentPos, 1);
				this.Set_ParaContentPos(ContentPos, false, -1, -1);
			}
		}
	}

	return ContentPos;
};
Paragraph.prototype.Check_NearestPos = function(NearPos)
{
	var ParaNearPos     = new CParagraphNearPos();
	ParaNearPos.NearPos = NearPos;

	var Count = this.NearPosArray.length;
	for (var Index = 0; Index < Count; Index++)
	{
		if (this.NearPosArray[Index].NearPos === NearPos)
			return;
	}

	this.NearPosArray.push(ParaNearPos);
	ParaNearPos.Classes.push(this);

	var CurPos = NearPos.ContentPos.Get(0);
	this.Content[CurPos].Check_NearestPos(ParaNearPos, 1);
};
Paragraph.prototype.Clear_NearestPosArray = function()
{
	var ArrayLen = this.NearPosArray.length;

	for (var Pos = 0; Pos < ArrayLen; Pos++)
	{
		var ParaNearPos = this.NearPosArray[Pos];

		var ArrayLen2 = ParaNearPos.Classes.length;

		// 0 элемент это сам класс Paragraph, массив в нем очищаем в данной функции в конце
		for (var Pos2 = 1; Pos2 < ArrayLen2; Pos2++)
		{
			var Class          = ParaNearPos.Classes[Pos2];
			Class.NearPosArray = [];
		}
	}

	this.NearPosArray = [];
};
Paragraph.prototype.Get_ParaNearestPos = function(NearPos)
{
	var ArrayLen = this.NearPosArray.length;

	for (var Pos = 0; Pos < ArrayLen; Pos++)
	{
		var ParaNearPos = this.NearPosArray[Pos];

		if (NearPos === ParaNearPos.NearPos)
			return ParaNearPos;
	}

	return null;
};
Paragraph.prototype.Get_Layout = function(ContentPos, Drawing)
{
	var LinePos = this.Get_ParaPosByContentPos(ContentPos);

	var CurLine  = LinePos.Line;
	var CurRange = LinePos.Range;
	var CurPage  = LinePos.Page;

	if (!this.IsRecalculated())
		return null;

	var X = this.Lines[CurLine].Ranges[CurRange].XVisible;
	var Y = this.Pages[CurPage].Y + this.Lines[CurLine].Y;

	if (true === this.Numbering.Check_Range(CurRange, CurLine))
		X += this.Numbering.WidthVisible;

	var DrawingLayout = new CParagraphDrawingLayout(Drawing, this, X, Y, CurLine, CurRange, CurPage);

	var StartPos = this.Lines[CurLine].Ranges[CurRange].StartPos;
	var EndPos   = this.Lines[CurLine].Ranges[CurRange].EndPos;

	var CurContentPos = ContentPos.Get(0);

	for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
	{
		this.Content[CurPos].Get_Layout(DrawingLayout, ( CurPos === CurContentPos ? true : false ), ContentPos, 1);

		if (true === DrawingLayout.Layout)
		{
			var LogicDocument = this.LogicDocument;
			var LD_PageLimits = LogicDocument.Get_PageLimits(CurPage);
			var LD_PageFields = LogicDocument.Get_PageFields(CurPage);

			var Page_Width  = LD_PageLimits.XLimit;
			var Page_Height = LD_PageLimits.YLimit;

			var X_Left_Field   = LD_PageFields.X;
			var Y_Top_Field    = LD_PageFields.Y;
			var X_Right_Field  = LD_PageFields.XLimit;
			var Y_Bottom_Field = LD_PageFields.YLimit;

			var X_Left_Margin   = X_Left_Field;
			var X_Right_Margin  = Page_Width - X_Right_Field;
			var Y_Bottom_Margin = Page_Height - Y_Bottom_Field;
			var Y_Top_Margin    = Y_Top_Field;

			var CurPage = DrawingLayout.Page;
			var Drawing = DrawingLayout.Drawing;

			var PageAbs   = this.Get_AbsolutePage(CurPage);
			var ColumnAbs = this.Get_AbsoluteColumn(CurPage);
			var PageRel   = PageAbs - this.Parent.Get_AbsolutePage(0);

			var PageLimits = this.Parent.Get_PageLimits(PageRel);
			var PageFields = this.Parent.Get_PageFields(PageRel);

			var _CurPage = 0;
			if (0 !== PageAbs && CurPage > ColumnAbs)
				_CurPage = CurPage - ColumnAbs;

			var ColumnStartX = (0 === CurPage ? this.X_ColumnStart : this.Pages[_CurPage].X     );
			var ColumnEndX   = (0 === CurPage ? this.X_ColumnEnd : this.Pages[_CurPage].XLimit);

			var Top_Margin    = Y_Top_Margin;
			var Bottom_Margin = Y_Bottom_Margin;
			var Page_H        = Page_Height;

			if (true === this.Parent.IsTableCellContent() && undefined != Drawing && true == Drawing.Use_TextWrap())
			{
				Top_Margin    = 0;
				Bottom_Margin = 0;
				Page_H        = 0;
			}

			var PageLimitsOrigin = this.Parent.Get_PageLimits(PageRel);
			if (true === this.Parent.IsTableCellContent() && false === Drawing.IsLayoutInCell())
			{
				PageLimitsOrigin     = LogicDocument.Get_PageLimits(PageAbs);
				var PageFieldsOrigin = LogicDocument.Get_PageFields(PageAbs);
				ColumnStartX         = PageFieldsOrigin.X;
				ColumnEndX           = PageFieldsOrigin.XLimit;
			}

			if (undefined != Drawing && true != Drawing.Use_TextWrap())
			{
				PageFields = LD_PageFields;
				PageLimits = LD_PageLimits;
			}

			var ParagraphTop = (true != Drawing.Use_TextWrap() ? this.Lines[this.Pages[_CurPage].StartLine].Top + this.Pages[_CurPage].Y : this.Pages[_CurPage].Y);
			var Layout       = new CParagraphLayout(DrawingLayout.X, DrawingLayout.Y, this.Get_AbsolutePage(CurPage), DrawingLayout.LastW, ColumnStartX, ColumnEndX, X_Left_Margin, X_Right_Margin, Page_Width, Top_Margin, Bottom_Margin, Page_H, PageFields.X, PageFields.Y, this.Pages[CurPage].Y + this.Lines[CurLine].Y - this.Lines[CurLine].Metrics.Ascent, ParagraphTop);
			return {ParagraphLayout : Layout, PageLimits : PageLimits, PageLimitsOrigin : PageLimitsOrigin};
		}
	}

	return null;
};
Paragraph.prototype.Get_AnchorPos = function(Drawing)
{
	var ContentPos = this.Get_DrawingObjectContentPos(Drawing.Get_Id());

	if (null === ContentPos)
		return {X : 0, Y : 0, Height : 0};

	var ParaPos = this.Get_ParaPosByContentPos(ContentPos);

	// Можем не бояться изменить положение курсора, т.к. данная функция работает, только когда у нас идет
	// выделение автофигуры, а значит курсора нет на экране.

	this.Set_ParaContentPos(ContentPos, false, -1, -1);

	var Result = this.Internal_Recalculate_CurPos(ContentPos, false, false, true);

	Result.Paragraph  = this;
	Result.ContentPos = ContentPos;

	this.Internal_CorrectAnchorPos(Result, Drawing);

	return Result;
};
Paragraph.prototype.IsContentOnFirstPage = function()
{
	// Если параграф сразу переносится на новую страницу, тогда это значение обычно -1
	if (this.Pages[0].EndLine < 0)
		return false;

	return true;
};
Paragraph.prototype.Get_CurrentPage_Absolute = function()
{
	// Обновляем позицию
	this.Internal_Recalculate_CurPos(this.CurPos.ContentPos, true, false, false);
	return this.private_GetAbsolutePageIndex(this.CurPos.PagesPos);
};
Paragraph.prototype.Get_CurrentPage_Relative = function()
{
	// Обновляем позицию
	this.Internal_Recalculate_CurPos(this.CurPos.ContentPos, true, false, false);
	return this.private_GetRelativePageIndex(this.CurPos.PagesPos);
};
Paragraph.prototype.CollectDocumentStatistics = function(Stats)
{
	var ParaStats = new CParagraphStatistics(Stats);
	var Count     = this.Content.length;

	for (var Index = 0; Index < Count; Index++)
	{
		var Item = this.Content[Index];
		Item.CollectDocumentStatistics(ParaStats);
	}

	var oNumPr = this.GetNumPr();
	if (oNumPr)
	{
		ParaStats.EmptyParagraph = false;

		var oNum = this.Parent.GetNumbering().GetNum(oNumPr.NumId);
		if (oNum)
			oNum.GetLvl(oNumPr.Lvl).CollectDocumentStatistics(Stats);
	}

	if (false === ParaStats.EmptyParagraph)
		Stats.Add_Paragraph();
};
Paragraph.prototype.Get_ParentTextTransform = function()
{
	return this.Parent.Get_ParentTextTransform();
};
Paragraph.prototype.Get_ParentTextInvertTransform = function()
{
	var CurDocContent = this.Parent;
	var oCell;
	while (oCell = CurDocContent.IsTableCellContent(true))
	{
		CurDocContent = oCell.Row.Table.Parent;
	}
	if (CurDocContent.Parent)
	{
		if (CurDocContent.Parent.invertTransformText)
		{
			return CurDocContent.Parent.invertTransformText;
		}
		if (CurDocContent.Parent.parent && CurDocContent.Parent.parent.invertTransformText)
		{
			return CurDocContent.Parent.parent.invertTransformText;
		}
	}
	if (CurDocContent.invertTransformText)
	{
		return CurDocContent.invertTransformText;
	}
	return null;
};
Paragraph.prototype.UpdateCursorType = function(X, Y, CurPage)
{
	CurPage            = Math.max(0, Math.min(CurPage, this.Pages.length - 1));
	var text_transform = this.Get_ParentTextTransform();
	var MMData         = new AscCommon.CMouseMoveData();
	var Coords         = this.DrawingDocument.ConvertCoordsToCursorWR(X, Y, this.Get_AbsolutePage(CurPage), text_transform);
	MMData.X_abs       = Coords.X;
	MMData.Y_abs       = Coords.Y;

	// TODO: Поиск гиперссылок и сносок нужно переделать через работу с SelectedElementsInfo
	var oInfo = new CSelectedElementsInfo();
	this.GetElementsInfoByXY(oInfo, X, Y, CurPage);

	var bPageRefLink = false;
	var arrComplexFields = this.GetComplexFieldsByXY(X, Y, CurPage);
	for (var nIndex = 0, nCount = arrComplexFields.length; nIndex < nCount; ++nIndex)
	{
		var oComplexField = arrComplexFields[nIndex];
		var oInstruction  = oComplexField.GetInstruction();
		if (oInstruction && fieldtype_PAGEREF === oInstruction.GetType() && oInstruction.IsHyperlink())
		{
			bPageRefLink = true;
			break;
		}
	}

	var isInText = this.IsInText(X, Y, CurPage);

	var oContentControl = oInfo.GetInlineLevelSdt();
	var oHyperlink      = oInfo.GetHyperlink();
	if (oContentControl)
		oContentControl.DrawContentControlsTrack(true, X, Y, CurPage);

	var Footnote  = this.CheckFootnote(X, Y, CurPage);

	if (isInText && null != oHyperlink && (Y <= this.Pages[CurPage].Bounds.Bottom && Y >= this.Pages[CurPage].Bounds.Top))
	{
		MMData.Type      = AscCommon.c_oAscMouseMoveDataTypes.Hyperlink;
		MMData.Hyperlink = new Asc.CHyperlinkProperty(oHyperlink);

		MMData.Hyperlink.ToolTip = oHyperlink.GetToolTip();
	}
	else if (isInText && null !== Footnote && this.Parent.GetTopDocumentContent() instanceof CDocument)
	{
		MMData.Type   = AscCommon.c_oAscMouseMoveDataTypes.Footnote;
		MMData.Text   = Footnote.GetHint();
		MMData.Number = Footnote.GetNumber();
	}
	else
	{
		MMData.Type = AscCommon.c_oAscMouseMoveDataTypes.Common;
	}

	if (isInText && (null != oHyperlink || bPageRefLink) && true === AscCommon.global_keyboardEvent.CtrlKey)
		this.DrawingDocument.SetCursorType("pointer", MMData);
	else
		this.DrawingDocument.SetCursorType("text", MMData);

	var Bounds = this.Pages[CurPage].Bounds;
	if (true === this.Lock.Is_Locked() && X < Bounds.Right && X > Bounds.Left && Y > Bounds.Top && Y < Bounds.Bottom && this.LogicDocument && !this.LogicDocument.IsViewModeInReview())
	{
		var _X = this.Pages[CurPage].X;
		var _Y = this.Pages[CurPage].Y;

		var MMData              = new AscCommon.CMouseMoveData();
		var Coords              = this.DrawingDocument.ConvertCoordsToCursorWR(_X, _Y, this.Get_AbsolutePage(CurPage), text_transform);
		MMData.X_abs            = Coords.X - 5;
		MMData.Y_abs            = Coords.Y;
		MMData.Type             = AscCommon.c_oAscMouseMoveDataTypes.LockedObject;
		MMData.UserId           = this.Lock.Get_UserId();
		MMData.HaveChanges      = this.Lock.Have_Changes();
		MMData.LockedObjectType = c_oAscMouseMoveLockedObjectType.Common;

		editor.sync_MouseMoveCallback(MMData);
	}
};
Paragraph.prototype.Document_CreateFontMap = function(FontMap)
{
	if (true === this.FontMap.NeedRecalc)
	{
		this.FontMap.Map = {};

		this.private_CompileParaPr();

		var FontScheme = this.Get_Theme().themeElements.fontScheme;
		var CurTextPr  = this.CompiledPr.Pr.TextPr.Copy();

		CurTextPr.Document_CreateFontMap(this.FontMap.Map, FontScheme);

		CurTextPr.Merge(this.TextPr.Value);
		CurTextPr.Document_CreateFontMap(this.FontMap.Map, FontScheme);

		var Count = this.Content.length;
		for (var Index = 0; Index < Count; Index++)
		{
			this.Content[Index].Create_FontMap(this.FontMap.Map);
		}

		this.FontMap.NeedRecalc = false;
	}

	for (var Key in this.FontMap.Map)
	{
		FontMap[Key] = this.FontMap.Map[Key];
	}
};
Paragraph.prototype.Document_CreateFontCharMap = function(FontCharMap)
{
	// TODO: Данная функция устарела и не используется
};
Paragraph.prototype.Document_Get_AllFontNames = function(AllFonts)
{
	// Смотрим на знак конца параграфа
	this.TextPr.Value.Document_Get_AllFontNames(AllFonts);
	if(this.Pr.Bullet)
	{
		this.Pr.Bullet.Get_AllFontNames(AllFonts);
	}
	if(this.Pr.DefaultRunPr)
	{
        this.Pr.DefaultRunPr.Document_Get_AllFontNames(AllFonts);
	}

	var Count = this.Content.length;
	for (var Index = 0; Index < Count; Index++)
	{
		this.Content[Index].Get_AllFontNames(AllFonts);
	}
};
/**
 * Обновляем линейку
 */
Paragraph.prototype.Document_UpdateRulersState = function()
{
	if (true === this.Is_Inline())
	{
		if (this.Parent instanceof CDocument)
		{
			if(this.LogicDocument)
			{
				this.LogicDocument.Document_UpdateRulersStateBySection();
			}
		}
	}
	else
	{
		var StartPage = this.Parent.Get_AbsolutePage(0);
		var Frame     = this.CalculatedFrame;
		this.Parent.DrawingDocument.Set_RulerState_Paragraph({
			L         : Frame.L,
			T         : Frame.T,
			R         : Frame.L + Frame.W,
			B         : Frame.T + Frame.H,
			PageIndex : StartPage + Frame.PageIndex,
			Frame     : this
		}, false);
	}
};
/**
 * Пока мы здесь проверяем только, находимся ли мы внутри гиперссылки
 */
Paragraph.prototype.Document_UpdateInterfaceState = function()
{
	var StartPos, EndPos;
	if (true === this.Selection.Use)
	{
		StartPos = this.Get_ParaContentPos(true, true);
		EndPos   = this.Get_ParaContentPos(true, false);
	}
	else
	{
		var CurPos = this.Get_ParaContentPos(false, false);
		StartPos   = CurPos;
		EndPos     = CurPos;
	}

	if (this.LogicDocument && true === this.LogicDocument.Spelling.Use && (selectionflag_Numbering !== this.Selection.Flag && selectionflag_NumberingCur !== this.Selection.Flag))
		this.SpellChecker.Document_UpdateInterfaceState(StartPos, EndPos);

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (StartPos > EndPos)
		{
			StartPos = this.Selection.EndPos;
			EndPos   = this.Selection.StartPos;
		}

		for (var CurPos = StartPos; CurPos <= EndPos; CurPos++)
		{
			var Element = this.Content[CurPos];

			if (true !== Element.IsSelectionEmpty() && Element.Document_UpdateInterfaceState)
				Element.Document_UpdateInterfaceState();
		}
	}
	else
	{
		var CurType = this.Content[this.CurPos.ContentPos].Type;
		if (this.Content[this.CurPos.ContentPos].Document_UpdateInterfaceState)
			this.Content[this.CurPos.ContentPos].Document_UpdateInterfaceState();
	}

	var arrComplexFields = this.GetCurrentComplexFields();
	for (var nIndex = 0, nCount = arrComplexFields.length; nIndex < nCount; ++nIndex)
	{
		var oInstruction = arrComplexFields[nIndex].GetInstruction();
		if (oInstruction && fieldtype_HYPERLINK === oInstruction.GetType())
		{
			var oHyperProps = new Asc.CHyperlinkProperty();
			oHyperProps.put_ToolTip(oInstruction.GetToolTip());
			oHyperProps.put_Value(oInstruction.GetValue());
			oHyperProps.put_Text(this.LogicDocument ? this.LogicDocument.GetComplexFieldTextValue(arrComplexFields[nIndex]) : null);
			oHyperProps.put_InternalHyperlink(oInstruction);
			editor.sync_HyperlinkPropCallback(oHyperProps);

		}
	}

	if (editor && this.bFromDocument)
	{
		if(!this.LogicDocument)
		{
			return;
		}
		var TrackManager = this.LogicDocument.GetTrackRevisionsManager();

		if (this.Pages.length <= 0 && this.Lines.length <= 0)
			return;

		var ContentPos = this.Get_ParaContentPos(this.Selection.Use, true);
		var ParaPos    = this.Get_ParaPosByContentPos(ContentPos);

		if (this.Pages.length <= ParaPos.Page || this.Lines.length <= ParaPos.Line)
			return;

		var Page_abs      = this.Get_AbsolutePage(ParaPos.Page);
		var _Y            = this.Pages[ParaPos.Page].Y + this.Lines[ParaPos.Line].Top;
		var TextTransform = this.Get_ParentTextTransform();

		var _X     = (this.LogicDocument ? this.LogicDocument.Get_PageLimits(Page_abs).XLimit : 0);
		var Coords = this.DrawingDocument.ConvertCoordsToCursorWR(_X, _Y, Page_abs, TextTransform);

		if (false === this.Selection.Use)
		{
			var Changes = TrackManager.GetElementChanges(this.GetId());
			if (Changes.length > 0)
			{
				for (var ChangeIndex = 0, ChangesCount = Changes.length; ChangeIndex < ChangesCount; ChangeIndex++)
				{
					var Change = Changes[ChangeIndex];
					var Type   = Change.get_Type();
					if ((c_oAscRevisionsChangeType.TextAdd !== Type
						&& c_oAscRevisionsChangeType.TextRem !== Type
						&& c_oAscRevisionsChangeType.TextPr !== Type)
						|| (StartPos.Compare(Change.get_StartPos()) >= 0
						&& StartPos.Compare(Change.get_EndPos()) <= 0))
					{
						Change.put_InternalPos(_X, _Y, Page_abs);
						TrackManager.AddVisibleChange(Change);
					}
				}
			}
		}
	}
};
/**
 * Функция, которую нужно вызвать перед удалением данного элемента
 */
Paragraph.prototype.PreDelete = function()
{
	// Поскольку данный элемент удаляется, поэтому надо удалить все записи о
	// inline объектах в родительском классе, используемых в данном параграфе.
	// Кроме этого, если тут начинались или заканчивались комметарии, то их тоже
	// удаляем.

	for (var Index = 0; Index < this.Content.length; Index++)
	{
		var Item = this.Content[Index];

		if (Item.PreDelete)
			Item.PreDelete();

		if(this.LogicDocument)
		{
			if (para_Comment === Item.Type  && true === this.LogicDocument.RemoveCommentsOnPreDelete)
			{
				this.LogicDocument.RemoveComment(Item.CommentId, true, false);
			}
			else if (para_Bookmark === Item.Type)
			{
				this.LogicDocument.GetBookmarksManager().SetNeedUpdate(true);
			}
		}
	}

	this.RemoveSelection();

	this.UpdateDocumentOutline();

	if (undefined !== this.Get_SectionPr() && this.LogicDocument)
	{
		// Чтобы при удалении параграфа с секцией автоматически запускался правильно пересчет секции, и правильно
		// пересчитывалось на Undo/Redo.
		this.Set_SectionPr(undefined);
	}
};
//----------------------------------------------------------------------------------------------------------------------
// Дополнительные функции
//----------------------------------------------------------------------------------------------------------------------
Paragraph.prototype.Document_SetThisElementCurrent = function(bUpdateStates)
{
	this.Parent.Update_ContentIndexing();
	this.Parent.Set_CurrentElement(this.Index, bUpdateStates);
};
Paragraph.prototype.Is_ThisElementCurrent = function()
{
	var Parent = this.Parent;

	Parent.Update_ContentIndexing();
	if (docpostype_Content === Parent.GetDocPosType() && false === Parent.Selection.Use && this.Index === Parent.CurPos.ContentPos && Parent.Content[this.Index] === this)
		return this.Parent.Is_ThisElementCurrent();

	return false;
};
Paragraph.prototype.Is_Inline = function()
{
	// Пустой элемент с разрывом секции мы считаем Inline параграфом.
	var PrevElement = this.Get_DocumentPrev();
	if (true === this.Is_Empty() && undefined !== this.Get_SectionPr() && null !== PrevElement && (type_Paragraph !== PrevElement.Get_Type() || undefined === PrevElement.Get_SectionPr()))
		return true;

	if (undefined === this.Parent || (!(this.Parent instanceof CDocument) && (undefined === this.Parent.Parent || !(this.Parent.Parent instanceof CHeaderFooter))))
		return true;

	if (undefined != this.Pr.FramePr && Asc.c_oAscYAlign.Inline !== this.Pr.FramePr.YAlign)
		return false;

	return true;
};
Paragraph.prototype.Get_FramePr = function()
{
	return this.Pr.FramePr;
};
Paragraph.prototype.Set_FramePr = function(FramePr, bDelete)
{
	var FramePr_old = this.Pr.FramePr;
	if (undefined === bDelete)
		bDelete = false;

	if (true === bDelete)
	{
		this.Pr.FramePr = undefined;
		this.private_AddPrChange();
		History.Add(new CChangesParagraphFramePr(this, FramePr_old, undefined));
		this.CompiledPr.NeedRecalc = true;
		this.private_UpdateTrackRevisionOnChangeParaPr(true);
		return;
	}

	var FrameParas = this.Internal_Get_FrameParagraphs();

	// Тут FramePr- объект класса из api.js asc_CParagraphFrame
	if (true === FramePr.FromDropCapMenu && 1 === FrameParas.length)
	{
		// Здесь мы смотрим только на количество строк, шрифт, тип и горизонтальный отступ от текста
		var NewFramePr = FramePr_old.Copy();

		if (undefined != FramePr.DropCap)
		{
			var OldLines = NewFramePr.Lines;
			NewFramePr.Init_Default_DropCap(FramePr.DropCap === Asc.c_oAscDropCap.Drop ? true : false);
			NewFramePr.Lines = OldLines;
		}

		if (undefined != FramePr.Lines)
		{
			var AnchorPara = this.Get_FrameAnchorPara();

			if (null === AnchorPara || AnchorPara.Lines.length <= 0)
				return;

			var Before = AnchorPara.Get_CompiledPr().ParaPr.Spacing.Before;
			var LineH  = AnchorPara.Lines[0].Bottom - AnchorPara.Lines[0].Top - Before;
			var LineTA = AnchorPara.Lines[0].Metrics.TextAscent2;
			var LineTD = AnchorPara.Lines[0].Metrics.TextDescent + AnchorPara.Lines[0].Metrics.LineGap;

			this.Set_Spacing({LineRule : linerule_Exact, Line : FramePr.Lines * LineH}, false);
			this.Update_DropCapByLines(this.Internal_CalculateTextPr(this.Internal_GetStartPos()), FramePr.Lines, LineH, LineTA, LineTD, Before);

			NewFramePr.Lines = FramePr.Lines;
		}

		if (undefined != FramePr.FontFamily)
		{
			var FF = new ParaTextPr({RFonts : {Ascii : {Name : FramePr.FontFamily.Name, Index : -1}}});
			this.SelectAll();
			this.Add(FF);
			this.RemoveSelection();
		}

		if (undefined != FramePr.HSpace)
			NewFramePr.HSpace = FramePr.HSpace;

		this.Pr.FramePr = NewFramePr;
	}
	else
	{
		var NewFramePr = FramePr_old.Copy();

		if (undefined != FramePr.H)
			NewFramePr.H = FramePr.H;

		if (undefined != FramePr.HAnchor)
			NewFramePr.HAnchor = FramePr.HAnchor;

		if (undefined != FramePr.HRule)
			NewFramePr.HRule = FramePr.HRule;

		if (undefined != FramePr.HSpace)
			NewFramePr.HSpace = FramePr.HSpace;

		if (undefined != FramePr.Lines)
			NewFramePr.Lines = FramePr.Lines;

		if (undefined != FramePr.VAnchor)
			NewFramePr.VAnchor = FramePr.VAnchor;

		if (undefined != FramePr.VSpace)
			NewFramePr.VSpace = FramePr.VSpace;

		// Потому что undefined - нормальное значение (и W всегда заполняется в интерфейсе)
		NewFramePr.W = FramePr.W;

		if (undefined != FramePr.X)
		{
			NewFramePr.X      = FramePr.X;
			NewFramePr.XAlign = undefined;
		}

		if (undefined != FramePr.XAlign)
		{
			NewFramePr.XAlign = FramePr.XAlign;
			NewFramePr.X      = undefined;
		}

		if (undefined != FramePr.Y)
		{
			NewFramePr.Y      = FramePr.Y;
			NewFramePr.YAlign = undefined;
		}

		if (undefined != FramePr.YAlign)
		{
			NewFramePr.YAlign = FramePr.YAlign;
			NewFramePr.Y      = undefined;
		}

		if (undefined !== FramePr.Wrap)
		{
			if (false === FramePr.Wrap)
				NewFramePr.Wrap = wrap_NotBeside;
			else if (true === FramePr.Wrap)
				NewFramePr.Wrap = wrap_Around;
			else
				NewFramePr.Wrap = FramePr.Wrap;
		}

		this.Pr.FramePr = NewFramePr;
	}

	if (undefined != FramePr.Brd)
	{
		var Count = FrameParas.length;
		for (var Index = 0; Index < Count; Index++)
		{
			FrameParas[Index].Set_Borders(FramePr.Brd);
		}
	}

	if (undefined != FramePr.Shd)
	{
		var Count = FrameParas.length;
		for (var Index = 0; Index < Count; Index++)
		{
			FrameParas[Index].Set_Shd(FramePr.Shd);
		}
	}

	this.private_AddPrChange();
	History.Add(new CChangesParagraphFramePr(this, FramePr_old, this.Pr.FramePr));
	this.CompiledPr.NeedRecalc = true;
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
};
Paragraph.prototype.Set_FramePr2 = function(FramePr)
{
	this.private_AddPrChange();
	History.Add(new CChangesParagraphFramePr(this, this.Pr.FramePr, FramePr));
	this.Pr.FramePr            = FramePr;
	this.CompiledPr.NeedRecalc = true;
	this.private_UpdateTrackRevisionOnChangeParaPr(true);
};
Paragraph.prototype.Set_FrameParaPr = function(Para)
{
	Para.CopyPr(this);
	Para.Set_Ind({FirstLine : 0}, false);
	this.Set_Spacing({After : 0}, false);
	this.Set_Ind({Right : 0}, false);
	this.RemoveNumPr();
};
Paragraph.prototype.Get_FrameBounds = function(FrameX, FrameY, FrameW, FrameH)
{
	var X0 = FrameX, Y0 = FrameY, X1 = FrameX + FrameW, Y1 = FrameY + FrameH;

	var Paras   = this.Internal_Get_FrameParagraphs();
	var Count   = Paras.length;
	var FramePr = this.Get_FramePr();

	if (0 >= Count)
		return {X : X0, Y : Y0, W : X1 - X0, H : Y1 - Y0};

	for (var Index = 0; Index < Count; Index++)
	{
		var Para   = Paras[Index];
		var ParaPr = Para.Get_CompiledPr2(false).ParaPr;
		var Brd    = ParaPr.Brd;

		var _X0 = (undefined != Brd.Left && border_None != Brd.Left.Value ? Math.min(X0, X0 + ParaPr.Ind.Left, X0 + ParaPr.Ind.Left + ParaPr.Ind.FirstLine) : X0 + ParaPr.Ind.Left + ParaPr.Ind.FirstLine);

		if (undefined != Brd.Left && border_None != Brd.Left.Value)
			_X0 -= Brd.Left.Size + Brd.Left.Space + 1;

		if (_X0 < X0)
			X0 = _X0;

		var _X1 = X1 - ParaPr.Ind.Right;

		if (undefined != Brd.Right && border_None != Brd.Right.Value)
			_X1 += Brd.Right.Size + Brd.Right.Space + 1;

		if (_X1 > X1)
			X1 = _X1;
	}

	var _Y1          = Y1;
	var BottomBorder = Paras[Count - 1].Get_CompiledPr2(false).ParaPr.Brd.Bottom;
	if (undefined != BottomBorder && border_None != BottomBorder.Value)
		_Y1 += BottomBorder.Size + BottomBorder.Space;

	if (_Y1 > Y1 && ( Asc.linerule_Auto === FramePr.HRule || ( Asc.linerule_AtLeast === FramePr.HRule && FrameH >= FramePr.H ) ))
		Y1 = _Y1;

	return {X : X0, Y : Y0, W : X1 - X0, H : Y1 - Y0};
};
Paragraph.prototype.Set_CalculatedFrame = function(L, T, W, H, L2, T2, W2, H2, PageIndex)
{
	this.CalculatedFrame.T         = T;
	this.CalculatedFrame.L         = L;
	this.CalculatedFrame.W         = W;
	this.CalculatedFrame.H         = H;
	this.CalculatedFrame.T2        = T2;
	this.CalculatedFrame.L2        = L2;
	this.CalculatedFrame.W2        = W2;
	this.CalculatedFrame.H2        = H2;
	this.CalculatedFrame.PageIndex = PageIndex;
};
Paragraph.prototype.Get_CalculatedFrame = function()
{
	return this.CalculatedFrame;
};
Paragraph.prototype.Internal_Get_FrameParagraphs = function()
{
	var FrameParas = [];

	var FramePr = this.Get_FramePr();
	if (undefined === FramePr)
		return FrameParas;

	FrameParas.push(this);

	var Prev = this.Get_DocumentPrev();
	while (null != Prev)
	{
		if (type_Paragraph === Prev.GetType())
		{
			var PrevFramePr = Prev.Get_FramePr();
			if (undefined != PrevFramePr && true === FramePr.Compare(PrevFramePr))
			{
				FrameParas.push(Prev);
				Prev = Prev.Get_DocumentPrev();
			}
			else
				break;
		}
		else
			break;
	}

	var Next = this.Get_DocumentNext();
	while (null != Next)
	{
		if (type_Paragraph === Next.GetType())
		{
			var NextFramePr = Next.Get_FramePr();
			if (undefined != NextFramePr && true === FramePr.Compare(NextFramePr))
			{
				FrameParas.push(Next);
				Next = Next.Get_DocumentNext();
			}
			else
				break;
		}
		else
			break;
	}

	return FrameParas;
};
Paragraph.prototype.Is_LineDropCap = function()
{
	var FrameParas = this.Internal_Get_FrameParagraphs();
	if (1 !== FrameParas.length || 1 !== this.Lines.length)
		return false;

	return true;
};
Paragraph.prototype.Get_LineDropCapWidth = function()
{
	var W      = this.Lines[0].Ranges[0].W;
	var ParaPr = this.Get_CompiledPr2(false).ParaPr;
	W += ParaPr.Ind.Left + ParaPr.Ind.FirstLine;

	return W;
};
Paragraph.prototype.Change_Frame = function(X, Y, W, H, PageIndex)
{
	var FramePr = this.Get_FramePr();
	if (!this.LogicDocument || undefined === FramePr || ( Math.abs(Y - this.CalculatedFrame.T) < 0.001 && Math.abs(X - this.CalculatedFrame.L) < 0.001 && Math.abs(W - this.CalculatedFrame.W) < 0.001 && Math.abs(H - this.CalculatedFrame.H) < 0.001 && PageIndex === this.CalculatedFrame.PageIndex ))
		return;

	var FrameParas = this.Internal_Get_FrameParagraphs();
	if (false === this.LogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
			Type      : AscCommon.changestype_2_ElementsArray_and_Type,
			Elements  : FrameParas,
			CheckType : AscCommon.changestype_Paragraph_Content
		}))
	{
		this.LogicDocument.StartAction(AscDFH.historydescription_Document_ParagraphChangeFrame);
		var NewFramePr = FramePr.Copy();

		if (Math.abs(X - this.CalculatedFrame.L) > 0.001)
		{
			NewFramePr.X       = X;
			NewFramePr.XAlign  = undefined;
			NewFramePr.HAnchor = Asc.c_oAscHAnchor.Page;
		}

		if (Math.abs(Y - this.CalculatedFrame.T) > 0.001)
		{
			NewFramePr.Y       = Y;
			NewFramePr.YAlign  = undefined;
			NewFramePr.VAnchor = Asc.c_oAscVAnchor.Page;
		}

		if (Math.abs(W - this.CalculatedFrame.W) > 0.001)
			NewFramePr.W = W;

		if (Math.abs(H - this.CalculatedFrame.H) > 0.001)
		{
			if (undefined != FramePr.DropCap && Asc.c_oAscDropCap.None != FramePr.DropCap && 1 === FrameParas.length)
			{
				var PageH        = this.LogicDocument.Get_PageLimits(PageIndex).YLimit;
				var _H           = Math.min(H, PageH);
				NewFramePr.Lines = this.Update_DropCapByHeight(_H);
				NewFramePr.HRule = linerule_Exact;
				NewFramePr.H     = H;
			}
			else
			{
				if (H <= this.CalculatedFrame.H)
					NewFramePr.HRule = linerule_Exact;
				else
					NewFramePr.HRule = Asc.linerule_AtLeast;

				NewFramePr.H = H;
			}
		}

		var Count = FrameParas.length;
		for (var Index = 0; Index < Count; Index++)
		{
			var Para = FrameParas[Index];
			Para.Set_FramePr(NewFramePr, false);
		}

		this.LogicDocument.Recalculate();
		this.LogicDocument.UpdateInterface();
		this.LogicDocument.UpdateRulers();
		this.LogicDocument.FinalizeAction();
	}
};
Paragraph.prototype.Supplement_FramePr = function(FramePr)
{
	if (undefined != FramePr.DropCap && Asc.c_oAscDropCap.None != FramePr.DropCap)
	{
		var _FramePr       = this.Get_FramePr();
		var FirstFramePara = this;
		var Prev           = FirstFramePara.Get_DocumentPrev();
		while (null != Prev)
		{
			if (type_Paragraph === Prev.GetType())
			{
				var PrevFramePr = Prev.Get_FramePr();
				if (undefined != PrevFramePr && true === _FramePr.Compare(PrevFramePr))
				{
					FirstFramePara = Prev;
					Prev           = Prev.Get_DocumentPrev();
				}
				else
					break;
			}
			else
				break;
		}

		var TextPr = FirstFramePara.GetFirstRunPr();

		if (undefined === TextPr.RFonts || undefined === TextPr.RFonts.Ascii)
		{
			TextPr = this.Get_CompiledPr2(false).TextPr;
		}

		FramePr.FontFamily =
			{
				Name  : TextPr.RFonts.Ascii.Name,
				Index : TextPr.RFonts.Ascii.Index
			};
	}

	var FrameParas = this.Internal_Get_FrameParagraphs();
	var Count      = FrameParas.length;

	var ParaPr = FrameParas[0].Get_CompiledPr2(false).ParaPr.Copy();
	for (var Index = 1; Index < Count; Index++)
	{
		var TempPr = FrameParas[Index].Get_CompiledPr2(false).ParaPr;
		ParaPr     = ParaPr.Compare(TempPr);
	}

	FramePr.Brd = ParaPr.Brd;
	FramePr.Shd = ParaPr.Shd;
};
/**
 * Можно ли добавлять буквицу
 * @returns {boolean}
 */
Paragraph.prototype.CanAddDropCap = function()
{
	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		var bResult = this.Content[nPos].CanAddDropCap();
		if (null !== bResult)
			return bResult;
	}

	return false;
};
Paragraph.prototype.Get_TextForDropCap = function(DropCapText, UseContentPos, ContentPos, Depth)
{
	var EndPos = ( true === UseContentPos ? ContentPos.Get(Depth) : this.Content.length - 1 );

	for (var Pos = 0; Pos <= EndPos; Pos++)
	{
		this.Content[Pos].Get_TextForDropCap(DropCapText, (true === UseContentPos && Pos === EndPos ? true : false), ContentPos, Depth + 1);

		if (true === DropCapText.Mixed && ( true === DropCapText.Check || DropCapText.Runs.length > 0 ))
			return;
	}
};
Paragraph.prototype.Split_DropCap = function(NewParagraph)
{
	// Если есть выделение, тогда мы проверяем элементы, идущие до конца выделения, если есть что-то кроме текста
	// тогда мы добавляем в буквицу только первый текстовый элемент, иначе добавляем все от начала параграфа и до
	// конца выделения, кроме этого в буквицу добавляем все табы идущие в начале.

	var DropCapText = new CParagraphGetDropCapText();
	if (true == this.Selection.Use && this.Parent.IsSelectedSingleElement())
	{
		var SelSP = this.Get_ParaContentPos(true, true);
		var SelEP = this.Get_ParaContentPos(true, false);

		if (0 <= SelSP.Compare(SelEP))
			SelEP = SelSP;

		DropCapText.Check = true;
		this.Get_TextForDropCap(DropCapText, true, SelEP, 0);

		DropCapText.Check = false;
		this.Get_TextForDropCap(DropCapText, true, SelEP, 0);
	}
	else
	{
		DropCapText.Mixed = true;
		DropCapText.Check = false;
		this.Get_TextForDropCap(DropCapText, false);
	}

	var Count   = DropCapText.Text.length;
	var PrevRun = null;
	var CurrRun = null;

	for (var Pos = 0, ParaPos = 0, RunPos = 0; Pos < Count; Pos++)
	{
		if (PrevRun !== DropCapText.Runs[Pos])
		{
			PrevRun = DropCapText.Runs[Pos];
			CurrRun = new ParaRun(NewParagraph);
			CurrRun.Set_Pr(DropCapText.Runs[Pos].Pr.Copy());

			NewParagraph.Internal_Content_Add(ParaPos++, CurrRun, false);

			RunPos = 0;
		}

		CurrRun.Add_ToContent(RunPos++, DropCapText.Text[Pos], false);
	}

	if (Count > 0)
		return DropCapText.Runs[Count - 1].Get_CompiledPr(true);

	return null;
};
/**
 * Выделяем первый символьный элемент в параграфе, если он есть
 * @returns {boolean}
 */
Paragraph.prototype.SelectFirstLetter = function()
{
	var oStartPos = new CParagraphContentPos();
	var oEndPos   = new CParagraphContentPos();

	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		oStartPos.Update(nPos, 0);
		oEndPos.Update(nPos, 0);
		if (this.Content[nPos].GetFirstRunElementPos(para_Text, oStartPos, oEndPos, 1))
		{
			this.StartSelectionFromCurPos();
			this.SetSelectionContentPos(oStartPos, oEndPos, false);
			this.Document_SetThisElementCurrent();
			return true;
		}
	}

	return false;
};
/**
 * Проверяем можно ли добавлять буквицу с заданным выделением
 * @returns {boolean}
 */
Paragraph.prototype.CheckSelectionForDropCap = function()
{
	var oSelectionStart = this.Get_ParaContentPos(true, true);
	var oSelectionEnd   = this.Get_ParaContentPos(true, false);

	if (0 <= oSelectionStart.Compare(oSelectionEnd))
		oSelectionEnd = oSelectionStart;

	var nEndPos = oSelectionEnd.Get(0);
	for (var nPos = 0; nPos <= nEndPos; ++nPos)
	{
		if (!this.Content[nPos].CheckSelectionForDropCap(nPos === nEndPos, oSelectionEnd, 1))
			return false;
	}

	return true;
};
Paragraph.prototype.Update_DropCapByLines = function(TextPr, Count, LineH, LineTA, LineTD, Before)
{
	if (null === TextPr)
		return;

	// Мы должны сделать так, чтобы высота данного параграфа была точно Count * LineH
	this.Set_Spacing({Before : Before, After : 0, LineRule : linerule_Exact, Line : Count * LineH - 0.001}, false);

	var FontSize = 72;
	TextPr.FontSize = FontSize;

	g_oTextMeasurer.SetTextPr(TextPr, this.Get_Theme());
	g_oTextMeasurer.SetFontSlot(fontslot_ASCII, 1);

	var TMetrics = {Ascent : null, Descent : null};
	this.private_RecalculateTextMetrics(TMetrics);

	var TDescent = TMetrics.Descent;
	var TAscent  = TMetrics.Ascent;

	var THeight = 0;
	if (null === TAscent || null === TDescent)
		THeight = g_oTextMeasurer.GetHeight();
	else
		THeight = -TDescent + TAscent;

	var EmHeight = THeight;

	var NewEmHeight = (Count - 1) * LineH + LineTA;
	var Koef        = NewEmHeight / EmHeight;

	var NewFontSize = TextPr.FontSize * Koef;
	TextPr.FontSize = parseInt(NewFontSize * 2) / 2;

	g_oTextMeasurer.SetTextPr(TextPr, this.Get_Theme());
	g_oTextMeasurer.SetFontSlot(fontslot_ASCII, 1);

	var TNewMetrics = {Ascent : null, Descent : null};
	this.private_RecalculateTextMetrics(TNewMetrics);

	var TNewDescent = TNewMetrics.Descent;
	var TNewAscent  = TNewMetrics.Ascent;

	var TNewHeight = 0;
	if (null === TNewAscent || null === TNewDescent)
		TNewHeight = g_oTextMeasurer.GetHeight();
	else
		TNewHeight = -TNewDescent + TNewAscent;

	var Descent = g_oTextMeasurer.GetDescender();
	var Ascent  = g_oTextMeasurer.GetAscender();

	var Dy = Descent * (LineH * Count) / ( Ascent - Descent ) + TNewHeight - TNewAscent + LineTD;

	var PTextPr = new ParaTextPr({
		RFonts   : {Ascii : {Name : TextPr.RFonts.Ascii.Name, Index : -1}},
		FontSize : TextPr.FontSize,
		Position : Dy
	});

	this.SelectAll();
	this.Add(PTextPr);
	this.RemoveSelection();
};
Paragraph.prototype.Update_DropCapByHeight = function(_Height)
{
	// Ищем следующий параграф, к которому относится буквица
	var AnchorPara = this.Get_FrameAnchorPara();
	if (null === AnchorPara || AnchorPara.Lines.length <= 0)
		return 1;

	var Before = AnchorPara.Get_CompiledPr().ParaPr.Spacing.Before;
	var LineH  = AnchorPara.Lines[0].Bottom - AnchorPara.Lines[0].Top - Before;
	var LineTA = AnchorPara.Lines[0].Metrics.TextAscent2;
	var LineTD = AnchorPara.Lines[0].Metrics.TextDescent + AnchorPara.Lines[0].Metrics.LineGap;

	var Height = _Height - Before;

	this.Set_Spacing({LineRule : linerule_Exact, Line : Height}, false);

	// Посчитаем количество строк
	var LinesCount = Math.ceil(Height / LineH);

	var TextPr = this.Internal_CalculateTextPr(this.Internal_GetStartPos());
	g_oTextMeasurer.SetTextPr(TextPr, this.Get_Theme());
	g_oTextMeasurer.SetFontSlot(fontslot_ASCII, 1);

	var TMetrics = {Ascent : null, Descent : null};
	this.private_RecalculateTextMetrics(TMetrics);

	var TDescent = TMetrics.Descent;
	var TAscent  = TMetrics.Ascent;

	var THeight = 0;
	if (null === TAscent || null === TDescent)
		THeight = g_oTextMeasurer.GetHeight();
	else
		THeight = -TDescent + TAscent;

	var Koef = (Height - LineTD) / THeight;

	var NewFontSize = TextPr.FontSize * Koef;
	TextPr.FontSize = parseInt(NewFontSize * 2) / 2;

	g_oTextMeasurer.SetTextPr(TextPr, this.Get_Theme());
	g_oTextMeasurer.SetFontSlot(fontslot_ASCII, 1);

	var TNewMetrics = {Ascent : null, Descent : null};
	this.private_RecalculateTextMetrics(TNewMetrics);

	var TNewDescent = TNewMetrics.Descent;
	var TNewAscent  = TNewMetrics.Ascent;

	var TNewHeight = 0;
	if (null === TNewAscent || null === TNewDescent)
		TNewHeight = g_oTextMeasurer.GetHeight();
	else
		TNewHeight = -TNewDescent + TNewAscent;

	var Descent = g_oTextMeasurer.GetDescender();
	var Ascent  = g_oTextMeasurer.GetAscender();

	var Dy = Descent * (Height) / ( Ascent - Descent ) + TNewHeight - TNewAscent + LineTD;

	var PTextPr = new ParaTextPr({
		RFonts   : {Ascii : {Name : TextPr.RFonts.Ascii.Name, Index : -1}},
		FontSize : TextPr.FontSize,
		Position : Dy
	});
	this.SelectAll();
	this.Add(PTextPr);
	this.RemoveSelection();

	return LinesCount;
};
Paragraph.prototype.Get_FrameAnchorPara = function()
{
	var FramePr = this.Get_FramePr();
	if (undefined === FramePr)
		return null;

	var Next = this.Get_DocumentNext();
	while (null != Next)
	{
		if (type_Paragraph === Next.GetType())
		{
			var NextFramePr = Next.Get_FramePr();
			if (undefined === NextFramePr || false === FramePr.Compare(NextFramePr))
				return Next;
		}

		Next = Next.Get_DocumentNext();
	}

	return Next;
};
/**
 * Разделяем данный параграф, возвращаем правую часть
 * @param {Paragraph} [NewParagraph=undefined] Если не задан, тогда мы создаем новый
 * @returns {Paragraph}
 */
Paragraph.prototype.Split = function(NewParagraph)
{
	if (!NewParagraph)
		NewParagraph = new Paragraph(this.DrawingDocument, this.Parent);

	NewParagraph.DeleteCommentOnRemove = false;
	this.DeleteCommentOnRemove         = false;

	// Обнулим селект и курсор
	this.RemoveSelection();
	NewParagraph.RemoveSelection();

	// Переносим контент, идущий с текущей позиции в параграфе и до конца параграфа,
	// в новый параграф.

	var ContentPos = this.Get_ParaContentPos(false, false);
	var CurPos     = ContentPos.Get(0);

	var TextPr = this.Get_TextPr(ContentPos);

	// Разделяем текущий элемент (возвращается правая, отделившаяся часть, если она null, тогда заменяем
	// ее на пустой ран с заданными настройками).
	var NewElement = this.Content[CurPos].Split(ContentPos, 1);

	if (null === NewElement)
	{
		NewElement = new ParaRun(NewParagraph);
		NewElement.Set_Pr(TextPr.Copy());
	}

	// Теперь делим наш параграф на три части:
	// 1. До элемента с номером CurPos включительно (оставляем эту часть в исходном параграфе)
	// 2. После элемента с номером CurPos (добавляем эту часть в новый параграф)
	// 3. Новый элемент, полученный после разделения элемента с номером CurPos, который мы
	//    добавляем в начало нового параграфа.

	var NewContent = this.Content.slice(CurPos + 1);
	this.Internal_Content_Remove2(CurPos + 1, this.Content.length - CurPos - 1);

	// В старый параграф добавим ран с концом параграфа
	var EndRun = new ParaRun(this);
	EndRun.Add_ToContent(0, new ParaEnd());

	this.Internal_Content_Add(this.Content.length, EndRun);

	// Очищаем новый параграф и добавляем в него Right элемент и NewContent
	NewParagraph.Internal_Content_Remove2(0, NewParagraph.Content.length);
	NewParagraph.Internal_Content_Concat(NewContent);
	NewParagraph.Internal_Content_Add(0, NewElement);
	NewParagraph.Correct_Content();

	// Копируем все настройки в новый параграф. Делаем это после того как определили контент параграфов.
	// У нового параграфа настройки конца параграфа делаем, как у старого (происходит в функции CopyPr), а у старого
	// меняем их на настройки текущего рана.
	this.CopyPr(NewParagraph);
	this.TextPr.Clear_Style();
	this.TextPr.Apply_TextPr(TextPr);

	// Если на данном параграфе заканчивалась секция, тогда переносим конец секции на новый параграф
	var SectPr = this.Get_SectionPr();
	if (undefined !== SectPr)
	{
		this.Set_SectionPr(undefined);
		NewParagraph.Set_SectionPr(SectPr);
	}

	this.MoveCursorToEndPos(false, false);
	NewParagraph.MoveCursorToStartPos(false);

	NewParagraph.DeleteCommentOnRemove = true;
	this.DeleteCommentOnRemove         = true;
	
	return NewParagraph;
};
/**
 * Присоединяем контент параграфа Para к текущему параграфу
 * @param Para {Paragraph}
 * @param [isUseConcatedStyle=false] {boolean}
 */
Paragraph.prototype.Concat = function(Para, isUseConcatedStyle)
{
	this.DeleteCommentOnRemove = false;
	Para.DeleteCommentOnRemove = false;

	// Убираем метку конца параграфа у данного параграфа
	this.Remove_ParaEnd();

	// Если в параграфе Para были точки NearPos, за которыми нужно следить перенесем их в этот параграф
	var NearPosCount = Para.NearPosArray.length;
	for (var Pos = 0; Pos < NearPosCount; Pos++)
	{
		var ParaNearPos = Para.NearPosArray[Pos];

		// Подменяем ссылки на параграф (вложенные ссылки менять не надо, т.к. мы добавляем объекты целиком)
		ParaNearPos.Classes[0]        = this;
		ParaNearPos.NearPos.Paragraph = this;
		ParaNearPos.NearPos.ContentPos.Data[0] += this.Content.length;

		this.NearPosArray.push(ParaNearPos);
	}

	// Добавляем содержимое второго параграфа к первому
	this.Internal_Content_Concat(Para.Content);

	// Очистим содержимое параграфа (это нужно, чтобы не лежали ссылки на одинаковые объекты в разных параграфах)
	Para.ClearContent();

	// Если на данном параграфе оканчивалась секция, тогда удаляем эту секцию
	this.Set_SectionPr(undefined);

	// Если на втором параграфе оканчивалась секция, тогда переносим конец секции на данный параграф
	var SectPr = Para.Get_SectionPr();
	if (undefined !== SectPr)
	{
		Para.Set_SectionPr(undefined);
		this.Set_SectionPr(SectPr);
	}

	this.DeleteCommentOnRemove = true;
	Para.DeleteCommentOnRemove = true;

	if (true === isUseConcatedStyle)
		Para.CopyPr(this);
};
/**
 * Копируем настройки параграфа и последние текстовые настройки в новый параграф
 */
Paragraph.prototype.Continue = function(NewParagraph)
{
	var TextPr;
	if (this.IsEmpty())
	{
		TextPr = this.TextPr.Value.Copy();
	}
	else
	{
		var EndPos = this.Get_EndPos2(false);
		var CurPos = this.Get_ParaContentPos(false, false);
		this.Set_ParaContentPos(EndPos, true, -1, -1);
		TextPr = this.Get_TextPr(this.Get_ParaContentPos(false, false)).Copy();
		this.Set_ParaContentPos(CurPos, false, -1, -1, false);

		// 1. Выделение не продолжаем
		// 2. Стиль сноски не продолжаем
		TextPr.HighLight = highlight_None;

		if (this.bFromDocument && this.LogicDocument && TextPr.RStyle === this.LogicDocument.GetStyles().GetDefaultFootnoteReference())
			TextPr.RStyle = undefined;
	}

	// Копируем настройки параграфа
	// У нового параграфа настройки конца параграфа делаем, как у старого (происходит в функции CopyPr), а у старого
	// меняем их на настройки текущего рана.
	this.CopyPr(NewParagraph);

	// Если в параграфе есть нумерация, то Word не копирует настройки последнего рана на конец параграфа
	if (!this.HaveNumbering() && !this.Lock.Is_Locked())
	{
		this.TextPr.Clear_Style();
		this.TextPr.Apply_TextPr(TextPr);
	}

	NewParagraph.Internal_Content_Add(0, new ParaRun(NewParagraph));
	NewParagraph.Correct_Content();
	NewParagraph.MoveCursorToStartPos(false);

	// Выставляем настройки у всех ранов
	// TODO: Вообще рана тут 2, 1 который только что создали, второй с para_End. как избавимся от второго тут
	// переделать.
	for (var Pos = 0, Count = NewParagraph.Content.length; Pos < Count; Pos++)
	{
		if (para_Run === NewParagraph.Content[Pos].Type)
			NewParagraph.Content[Pos].Set_Pr(TextPr.Copy());
	}

};
//----------------------------------------------------------------------------------------------------------------------
// Undo/Redo функции
//----------------------------------------------------------------------------------------------------------------------
Paragraph.prototype.GetSelectionState = function()
{
	var ParaState    = {};
	ParaState.CurPos = {
		X          : this.CurPos.X,
		Y          : this.CurPos.Y,
		Line       : this.CurPos.Line,
		ContentPos : this.Get_ParaContentPos(false, false),
		RealX      : this.CurPos.RealX,
		RealY      : this.CurPos.RealY,
		PagesPos   : this.CurPos.PagesPos
	};

	ParaState.Selection = {
		Start    : this.Selection.Start,
		Use      : this.Selection.Use,
		StartPos : 0,
		EndPos   : 0,
		Flag     : this.Selection.Flag
	};

	if (true === this.Selection.Use)
	{
		ParaState.Selection.StartPos = this.Get_ParaContentPos(true, true);
		ParaState.Selection.EndPos   = this.Get_ParaContentPos(true, false);
	}

	return [ParaState];
};
Paragraph.prototype.SetSelectionState = function(State, StateIndex)
{
	if (State.length <= 0)
		return;

	var ParaState = State[StateIndex];

	this.CurPos.X        = ParaState.CurPos.X;
	this.CurPos.Y        = ParaState.CurPos.Y;
	this.CurPos.Line     = ParaState.CurPos.Line;
	this.CurPos.RealX    = ParaState.CurPos.RealX;
	this.CurPos.RealY    = ParaState.CurPos.RealY;
	this.CurPos.PagesPos = ParaState.CurPos.PagesPos;

	this.Set_ParaContentPos(ParaState.CurPos.ContentPos, true, -1, -1);

	this.RemoveSelection();

	this.Selection.Start = ParaState.Selection.Start;
	this.Selection.Use   = ParaState.Selection.Use;
	this.Selection.Flag  = ParaState.Selection.Flag;

	if (true === this.Selection.Use)
		this.Set_SelectionContentPos(ParaState.Selection.StartPos, ParaState.Selection.EndPos);
};
Paragraph.prototype.Get_ParentObject_or_DocumentPos = function()
{
	this.Parent.Update_ContentIndexing();
	return this.Parent.Get_ParentObject_or_DocumentPos(this.Index);
};
Paragraph.prototype.Refresh_RecalcData = function(Data)
{
	var Type = Data.Type;

	var bNeedRecalc = false;

	var CurPage = 0;

	switch (Type)
	{
		case AscDFH.historyitem_Paragraph_AddItem:
		case AscDFH.historyitem_Paragraph_RemoveItem:
		{
			for (CurPage = this.Pages.length - 1; CurPage > 0; CurPage--)
			{
				if (Data.Pos > this.Lines[this.Pages[CurPage].StartLine].Get_StartPos())
					break;
			}

			this.RecalcInfo.Set_Type_0(pararecalc_0_All);
			bNeedRecalc = true;
			break;
		}
		case AscDFH.historyitem_Paragraph_Numbering:
		case AscDFH.historyitem_Paragraph_PStyle:
		case AscDFH.historyitem_Paragraph_Pr:
		case AscDFH.historyitem_Paragraph_PresentationPr_Bullet:
		case AscDFH.historyitem_Paragraph_PresentationPr_Level:
		{
			this.RecalcInfo.Set_Type_0(pararecalc_0_All);
			bNeedRecalc = true;

			this.CompiledPr.NeedRecalc = true;
			this.Recalc_RunsCompiledPr();

			break;
		}

		case AscDFH.historyitem_Paragraph_Align:
		case AscDFH.historyitem_Paragraph_DefaultTabSize:
		case AscDFH.historyitem_Paragraph_Ind_First:
		case AscDFH.historyitem_Paragraph_Ind_Left:
		case AscDFH.historyitem_Paragraph_Ind_Right:
		case AscDFH.historyitem_Paragraph_ContextualSpacing:
		case AscDFH.historyitem_Paragraph_KeepLines:
		case AscDFH.historyitem_Paragraph_KeepNext:
		case AscDFH.historyitem_Paragraph_PageBreakBefore:
		case AscDFH.historyitem_Paragraph_Spacing_Line:
		case AscDFH.historyitem_Paragraph_Spacing_LineRule:
		case AscDFH.historyitem_Paragraph_Spacing_Before:
		case AscDFH.historyitem_Paragraph_Spacing_After:
		case AscDFH.historyitem_Paragraph_Spacing_AfterAutoSpacing:
		case AscDFH.historyitem_Paragraph_Spacing_BeforeAutoSpacing:
		case AscDFH.historyitem_Paragraph_WidowControl:
		case AscDFH.historyitem_Paragraph_Tabs:
		case AscDFH.historyitem_Paragraph_Borders_Between:
		case AscDFH.historyitem_Paragraph_Borders_Bottom:
		case AscDFH.historyitem_Paragraph_Borders_Left:
		case AscDFH.historyitem_Paragraph_Borders_Right:
		case AscDFH.historyitem_Paragraph_Borders_Top:
		case AscDFH.historyitem_Paragraph_FramePr:
		{
			bNeedRecalc = true;
			break;
		}
		case AscDFH.historyitem_Paragraph_Shd_Value:
		case AscDFH.historyitem_Paragraph_Shd_Color:
		case AscDFH.historyitem_Paragraph_Shd_Unifill:
		case AscDFH.historyitem_Paragraph_Shd:
		{
			if (this.Parent)
			{
				var oDrawingShape = this.Parent.Is_DrawingShape(true);
				if (oDrawingShape && oDrawingShape.getObjectType && oDrawingShape.getObjectType() === AscDFH.historyitem_type_Shape)
				{
					if (oDrawingShape.chekBodyPrTransform(oDrawingShape.getBodyPr()) || oDrawingShape.checkContentWordArt(oDrawingShape.getDocContent()))
					{
						bNeedRecalc = true;
					}
				}

				// TODO: Когда пересчет заголовков таблицы будет переделан на нормальную схему, без копирования
				// нужно будет убрать эту заглушку
				if (this.Parent.IsTableHeader())
					bNeedRecalc = true;
			}
			break;
		}
		case AscDFH.historyitem_Paragraph_SectionPr:
		{
			if (this.Parent instanceof CDocument)
			{
				this.Parent.UpdateContentIndexing();
				var nSectionIndex = this.Parent.GetSectionIndexByElementIndex(this.GetIndex());
				var oFirstElement = this.Parent.GetFirstElementInSection(nSectionIndex);

				if (oFirstElement)
					this.Parent.Refresh_RecalcData2(oFirstElement.GetIndex(), oFirstElement.private_GetRelativePageIndex(0));
			}

			break;
		}
		case AscDFH.historyitem_Paragraph_PrChange:
		{
			if (Data instanceof CChangesParagraphPrChange && Data.IsChangedNumbering())
				bNeedRecalc = true;

			break;
		}
	}

	if (true === bNeedRecalc)
	{
		var Prev = this.Get_DocumentPrev();
		if (0 === CurPage && null != Prev && type_Paragraph === Prev.GetType() && true === Prev.Get_CompiledPr2(false).ParaPr.KeepNext)
			Prev.Refresh_RecalcData2(Prev.Pages.length - 1);

		// Сообщаем родительскому классу, что изменения произошли в элементе с номером this.Index и на странице
		// this.PageNum
		return this.Refresh_RecalcData2(CurPage);
	}
};
Paragraph.prototype.Refresh_RecalcData2 = function(CurPage)
{
	if (!CurPage)
		CurPage = 0;

	// Если Index < 0, значит данный элемент еще не был добавлен в родительский класс
	if (this.Index >= 0)
		this.Parent.Refresh_RecalcData2(this.Index, this.private_GetRelativePageIndex(CurPage));
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для совместного редактирования
//----------------------------------------------------------------------------------------------------------------------
Paragraph.prototype.Write_ToBinary2 = function(Writer)
{
	Writer.WriteLong(AscDFH.historyitem_type_Paragraph);

	// String2   : Id
	// Variable  : ParaPr
	// String2   : Id TextPr
	// Long      : количество элементов
	// Array of String2 : массив с Id элементами
	// Bool     : bFromDocument

	Writer.WriteString2("" + this.Id);

	var PrForWrite, TextPrForWrite, ContentForWrite;
	if (this.StartState)
	{
		PrForWrite     = this.StartState.Pr;
		TextPrForWrite = this.StartState.TextPr;
		ContentForWrite = this.StartState.Content;
		this.StartState = null;
	}
	else
	{
		PrForWrite     = this.Pr;
		TextPrForWrite = this.TextPr;
		ContentForWrite = this.Content;
	}

	PrForWrite.Write_ToBinary(Writer);
	Writer.WriteString2("" + TextPrForWrite.Get_Id());

	var Count = ContentForWrite.length;
	Writer.WriteLong(Count);

	for (var Index = 0; Index < Count; Index++)
	{
		Writer.WriteString2("" + ContentForWrite[Index].Get_Id());
	}

	Writer.WriteBool(this.bFromDocument);
};
Paragraph.prototype.Read_FromBinary2 = function(Reader)
{
	// String2   : Id
	// Variable  : ParaPr
	// String2   : Id TextPr
	// Long      : количество элементов
	// Array of String2 : массив с Id элементами
	// Bool     : bFromDocument

	this.Id = Reader.GetString2();

	this.Pr = new CParaPr();
	this.Pr.Read_FromBinary(Reader);
	this.TextPr = g_oTableId.Get_ById(Reader.GetString2());

	this.Next = null;
	this.Prev = null;

	this.Content = [];
	var Count    = Reader.GetLong();
	for (var Index = 0; Index < Count; Index++)
	{
		var Element = g_oTableId.Get_ById(Reader.GetString2());

		if (null != Element)
		{
			this.Content.push(Element);
			if (Element.SetParagraph)
				Element.SetParagraph(this);
		}
	}

	AscCommon.CollaborativeEditing.Add_NewObject(this);

	this.bFromDocument = Reader.GetBool();
	if (!this.bFromDocument)
	{
		this.Numbering = new ParaPresentationNumbering();
	}
	if (this.bFromDocument || (editor && editor.WordControl && editor.WordControl.m_oDrawingDocument))
	{
		var DrawingDocument = editor.WordControl.m_oDrawingDocument;
		if (undefined !== DrawingDocument && null !== DrawingDocument)
		{
			this.DrawingDocument = DrawingDocument;
			this.LogicDocument   = this.DrawingDocument.m_oLogicDocument;
		}
	}
	else
	{
		AscCommon.CollaborativeEditing.Add_LinkData(this, {});
	}

	this.PageNum = 0;
};
Paragraph.prototype.Load_LinkData = function(LinkData)
{
	if (this.Parent && this.Parent.Parent && this.Parent.Parent.getDrawingDocument)
	{
		this.DrawingDocument = this.Parent.Parent.getDrawingDocument();
	}
};
Paragraph.prototype.Get_SelectionState2 = function()
{
	var ParaState = {};

	ParaState.Id     = this.Get_Id();
	ParaState.CurPos =
		{
			X          : this.CurPos.X,
			Y          : this.CurPos.Y,
			Line       : this.CurPos.Line,
			ContentPos : this.Get_ParaContentPos(false, false),
			RealX      : this.CurPos.RealX,
			RealY      : this.CurPos.RealY,
			PagesPos   : this.CurPos.PagesPos
		};

	ParaState.Selection =
		{
			Start    : this.Selection.Start,
			Use      : this.Selection.Use,
			StartPos : 0,
			EndPos   : 0,
			Flag     : this.Selection.Flag
		};

	if (true === this.Selection.Use)
	{
		ParaState.Selection.StartPos = this.Get_ParaContentPos(true, true);
		ParaState.Selection.EndPos   = this.Get_ParaContentPos(true, false);
	}

	return ParaState;
};
Paragraph.prototype.Set_SelectionState2 = function(ParaState)
{
	this.CurPos.X        = ParaState.CurPos.X;
	this.CurPos.Y        = ParaState.CurPos.Y;
	this.CurPos.Line     = ParaState.CurPos.Line;
	this.CurPos.RealX    = ParaState.CurPos.RealX;
	this.CurPos.RealY    = ParaState.CurPos.RealY;
	this.CurPos.PagesPos = ParaState.CurPos.PagesPos;

	this.Set_ParaContentPos(ParaState.CurPos.ContentPos, true, -1, -1);

	this.RemoveSelection();

	this.Selection.Start = ParaState.Selection.Start;
	this.Selection.Use   = ParaState.Selection.Use;
	this.Selection.Flag  = ParaState.Selection.Flag;

	if (true === this.Selection.Use)
		this.Set_SelectionContentPos(ParaState.Selection.StartPos, ParaState.Selection.EndPos)
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с комментариями
//----------------------------------------------------------------------------------------------------------------------
Paragraph.prototype.AddComment = function(Comment, bStart, bEnd)
{
	if (true == this.ApplyToAll)
	{
		if (true === bEnd)
		{
			var EndContentPos = this.Get_EndPos(false);

			var CommentEnd = new AscCommon.ParaComment(false, Comment.Get_Id());

			var EndPos = EndContentPos.Get(0);

			// Любые другие элементы мы целиком включаем в комментарий
			if (para_Run === this.Content[EndPos].Type)
			{
				var NewElement = this.Content[EndPos].Split(EndContentPos, 1);

				if (null !== NewElement)
					this.Internal_Content_Add(EndPos + 1, NewElement);
			}

			this.Internal_Content_Add(EndPos + 1, CommentEnd);
		}

		if (true === bStart)
		{
			var StartContentPos = this.Get_StartPos();

			var CommentStart = new AscCommon.ParaComment(true, Comment.Get_Id());

			var StartPos = StartContentPos.Get(0);

			// Любые другие элементы мы целиком включаем в комментарий
			if (para_Run === this.Content[StartPos].Type)
			{
				var NewElement = this.Content[StartPos].Split(StartContentPos, 1);

				if (null !== NewElement)
					this.Internal_Content_Add(StartPos + 1, NewElement);

				this.Internal_Content_Add(StartPos + 1, CommentStart);
			}
			else
			{
				this.Internal_Content_Add(StartPos, CommentStart);
			}
		}
	}
	else
	{
		if (true === this.Selection.Use)
		{
			var StartContentPos = this.Get_ParaContentPos(true, true);
			var EndContentPos   = this.Get_ParaContentPos(true, false);

			if (StartContentPos.Compare(EndContentPos) > 0)
			{
				var Temp        = StartContentPos;
				StartContentPos = EndContentPos;
				EndContentPos   = Temp;
			}

			if (true === bEnd)
			{
				var CommentEnd = new AscCommon.ParaComment(false, Comment.Get_Id());

				var EndPos = EndContentPos.Get(0);

				// Любые другие элементы мы целиком включаем в комментарий
				if (para_Run === this.Content[EndPos].Type)
				{
					var NewElement = this.Content[EndPos].Split(EndContentPos, 1);

					if (null !== NewElement)
						this.Internal_Content_Add(EndPos + 1, NewElement);
				}

				this.Internal_Content_Add(EndPos + 1, CommentEnd);
				this.Selection.EndPos = EndPos + 1;
			}

			if (true === bStart)
			{
				var CommentStart = new AscCommon.ParaComment(true, Comment.Get_Id());

				var StartPos = StartContentPos.Get(0);

				// Любые другие элементы мы целиком включаем в комментарий
				if (para_Run === this.Content[StartPos].Type)
				{
					var NewElement = this.Content[StartPos].Split(StartContentPos, 1);

					if (null !== NewElement)
					{
						this.Internal_Content_Add(StartPos + 1, NewElement);
						NewElement.SelectAll();
					}

					this.Internal_Content_Add(StartPos + 1, CommentStart);
					this.Selection.StartPos = StartPos + 1;
				}
				else
				{
					this.Internal_Content_Add(StartPos, CommentStart);
					this.Selection.StartPos = StartPos;
				}
			}
		}
		else
		{
			var ContentPos = this.Get_ParaContentPos(false, false);

			if (true === bEnd)
			{
				var CommentEnd = new AscCommon.ParaComment(false, Comment.Get_Id());

				var EndPos = ContentPos.Get(0);

				// Любые другие элементы мы целиком включаем в комментарий
				if (para_Run === this.Content[EndPos].Type)
				{
					var NewElement = this.Content[EndPos].Split(ContentPos, 1);

					if (null !== NewElement)
						this.Internal_Content_Add(EndPos + 1, NewElement);
				}

				this.Internal_Content_Add(EndPos + 1, CommentEnd);
			}

			if (true === bStart)
			{
				var CommentStart = new AscCommon.ParaComment(true, Comment.Get_Id());

				var StartPos = ContentPos.Get(0);

				// Любые другие элементы мы целиком включаем в комментарий
				if (para_Run === this.Content[StartPos].Type)
				{
					var NewElement = this.Content[StartPos].Split(ContentPos, 1);

					if (null !== NewElement)
						this.Internal_Content_Add(StartPos + 1, NewElement);

					this.Internal_Content_Add(StartPos + 1, CommentStart);
				}
				else
				{
					this.Internal_Content_Add(StartPos, CommentStart);
				}
			}
		}
	}

	this.Correct_Content();
};
Paragraph.prototype.AddCommentToObject = function(Comment, ObjectId)
{
	// TODO: Реализовать добавление комментария по ID объекта
};
Paragraph.prototype.CanAddComment = function()
{
	if (this.ApplyToAll)
	{
		var oState = this.Get_SelectionState2();
		this.Set_ApplyToAll(false);
		this.SelectAll(1);
		var isCanAdd = this.CanAddComment();
		this.Set_SelectionState2(oState);
		this.Set_ApplyToAll(true);
		return isCanAdd;
	}

	if (true === this.Selection.Use && true != this.IsSelectionEmpty())
	{
		var nStartPos = this.Selection.StartPos <= this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos;
		var nEndPos   = this.Selection.StartPos <= this.Selection.EndPos ? this.Selection.EndPos : this.Selection.StartPos;

		for (var nPos = nStartPos; nPos <= nEndPos; ++nPos)
		{
			if (this.Content[nPos].CanAddComment && !this.Content[nPos].CanAddComment())
				return false;
		}

		return true;
	}

	var oNext = this.GetNextRunElement();
	var oPrev = this.GetPrevRunElement();

	if ((oNext && para_Text === oNext.Type)
		|| (oPrev && para_Text === oPrev.Type))
		return true;

	return false;
};
Paragraph.prototype.RemoveCommentMarks = function(Id)
{
	var Count = this.Content.length;
	for (var Pos = 0; Pos < Count; Pos++)
	{
		var Item = this.Content[Pos];
		if (para_Comment === Item.Type && Id === Item.CommentId)
		{
			this.Internal_Content_Remove(Pos);
			Pos--;
			Count--;
		}
	}
};
Paragraph.prototype.ReplaceMisspelledWord = function(Word, oElement)
{
	var Element = null;
	if (oElement)
	{
		for (var nWordId in this.SpellChecker.Elements)
		{
			if (oElement === this.SpellChecker.Elements[nWordId])
			{
				Element = oElement;
				break;
			}
		}
	}

	if (!Element)
		return;

	var isEndDot = false;
	if (Element.IsEndDot() && 0x002E === Word.charCodeAt(Word.length - 1))
	{
		Word     = Word.substr(0, Word.length - 1);
		isEndDot = true;
	}

	// Сначала вставим новое слово
	var Class = Element.StartRun;
	if (para_Run !== Class.Type || Element.StartPos.Data.Depth <= 0)
		return;

	var RunPos = Element.StartPos.Data[Element.StartPos.Depth - 1];
	Class.AddText(Word, RunPos);

	// Удалим старое слово
	var StartPos = Element.StartPos;
	var EndPos   = Element.EndPos;

	// Если комментарии попадают в текст, тогда сначала их надо отдельно удалить
	var CommentsToDelete = {};
	var EPos             = EndPos.Get(0);
	var SPos             = StartPos.Get(0);
	for (var Pos = SPos; Pos <= EPos; Pos++)
	{
		var Item = this.Content[Pos];
		if (para_Comment === Item.Type)
			CommentsToDelete[Item.CommentId] = true;
	}

	if(this.LogicDocument)
	{
		for (var CommentId in CommentsToDelete)
		{
			this.LogicDocument.RemoveComment(CommentId, true, false);
		}
	}

	this.Set_SelectionContentPos(StartPos, EndPos);
	this.Selection.Use  = true;
	this.Selection.Flag = selectionflag_Common;

	this.Remove();

	this.RemoveSelection();
	this.Set_ParaContentPos(StartPos, true, -1, -1);
	if (isEndDot)
		this.MoveCursorRight(false, false);

	this.RecalcInfo.Set_Type_0(pararecalc_0_All);

	Element.Checked = null;
};
Paragraph.prototype.IgnoreMisspelledWord = function(oElement)
{
	if (oElement)
	{
		for (var nWordId in this.SpellChecker.Elements)
		{
			if (oElement === this.SpellChecker.Elements[nWordId])
			{
				oElement.Checked = true;
				this.ReDraw();
			}
		}
	}
};
Paragraph.prototype.Get_SectionPr = function()
{
	return this.SectPr;
};
Paragraph.prototype.Set_SectionPr = function(SectPr, bUpdate)
{
	if (this.LogicDocument !== this.Parent && (!this.LogicDocument || true !== this.LogicDocument.ForceCopySectPr))
		return;

	if (SectPr !== this.SectPr)
	{
		History.Add(new CChangesParagraphSectPr(this, this.SectPr, SectPr));

		var oOldSectPr = this.SectPr;
		this.SectPr = SectPr;

		if (false !== bUpdate)
			this.LogicDocument.UpdateSectionInfo(oOldSectPr, SectPr, true);

		// TODO: Когда избавимся от ParaEnd переделать тут
		if (this.Content.length > 0 && para_Run === this.Content[this.Content.length - 1].Type)
		{
			var LastRun                = this.Content[this.Content.length - 1];
			LastRun.RecalcInfo.Measure = true;
		}
	}
};
Paragraph.prototype.GetLastRangeVisibleBounds = function()
{
	var CurLine = this.Lines.length - 1;
	var CurPage = this.Pages.length - 1;

	var Line        = this.Lines[CurLine];
	var RangesCount = Line.Ranges.length;

	var RangeW = new CParagraphRangeVisibleWidth();

	var CurRange = 0;
	for (; CurRange < RangesCount; CurRange++)
	{
		var Range    = Line.Ranges[CurRange];
		var StartPos = Range.StartPos;
		var EndPos   = Range.EndPos;

		RangeW.W   = 0;
		RangeW.End = false;

		if (true === this.Numbering.Check_Range(CurRange, CurLine))
			RangeW.W += this.Numbering.WidthVisible;

		for (var Pos = StartPos; Pos <= EndPos; Pos++)
		{
			var Item = this.Content[Pos];
			Item.Get_Range_VisibleWidth(RangeW, CurLine, CurRange);
		}

		if (true === RangeW.End || CurRange === RangesCount - 1)
			break;
	}

	// Определяем позицию и высоту строки
	var Y      = this.Pages[CurPage].Y + this.Lines[CurLine].Top;
	var H      = this.Lines[CurLine].Bottom - this.Lines[CurLine].Top;
	var X      = this.Lines[CurLine].Ranges[CurRange].XVisible;
	var W      = RangeW.W;
	var B      = this.Lines[CurLine].Y - this.Lines[CurLine].Top;
	var XLimit = this.Pages[CurPage].XLimit - this.Get_CompiledPr2(false).ParaPr.Ind.Right

	return {X : X, Y : Y, W : W, H : H, BaseLine : B, XLimit : XLimit};
};
Paragraph.prototype.FindNextFillingForm = function(isNext, isCurrent, isStart)
{
	var nCurPos = this.Selection.Use === true ? this.Selection.StartPos : this.CurPos.ContentPos;

	var nStartPos = 0, nEndPos = 0;
	if (isCurrent)
	{
		if (isStart)
		{
			nStartPos = nCurPos;
			nEndPos   = isNext ? this.Content.length - 1 : 0;
		}
		else
		{
			nStartPos = isNext ? 0 : this.Content.length - 1;
			nEndPos   = nCurPos;
		}
	}
	else
	{
		if (isNext)
		{
			nStartPos = 0;
			nEndPos   = this.Content.length - 1;
		}
		else
		{
			nStartPos = this.Content.length - 1;
			nEndPos   = 0;
		}
	}

	if (isNext)
	{
		for (var nIndex = nStartPos; nIndex <= nEndPos; ++nIndex)
		{
			if (this.Content[nIndex].FindNextFillingForm)
			{
				var oRes = this.Content[nIndex].FindNextFillingForm(true, isCurrent && nIndex === nCurPos ? true : false, isStart);
				if (oRes)
					return oRes;
			}
		}
	}
	else
	{
		for (var nIndex = nStartPos; nIndex >= nEndPos; --nIndex)
		{
			if (this.Content[nIndex].FindNextFillingForm)
			{
				var oRes = this.Content[nIndex].FindNextFillingForm(false, isCurrent && nIndex === nCurPos ? true : false, isStart);
				if (oRes)
					return oRes;
			}
		}
	}

	return null;
};
//----------------------------------------------------------------------------------------------------------------------
Paragraph.prototype.private_ResetSelection = function()
{
    this.Selection.StartPos      = 0;
    this.Selection.EndPos        = 0;
    this.Selection.StartManually = false;
    this.Selection.EndManually   = false;

    this.CurPos.ContentPos  = 0;
};
Paragraph.prototype.private_CorrectCurPosRangeLine = function()
{
    if (-1 !== this.CurPos.Line)
        return;

    // В данной функции мы подбираем для курсора подходящие физическое расположение, если логическое расположение
    // предполагает несколько физических позиций (например начало/конец строки или попадание между обтеканием).
    var ParaCurPos = this.Get_ParaContentPos(false, false);

    var Ranges = this.Get_RangesByPos(ParaCurPos);

    this.CurPos.Line  = -1;
    this.CurPos.Range = -1;

    for (var Index = 0, Count = Ranges.length; Index < Count; Index++)
    {
        var RangeIndex = Ranges[Index].Range;
        var LineIndex  = Ranges[Index].Line;

        if (undefined !== this.Lines[LineIndex] && undefined !== this.Lines[LineIndex].Ranges[RangeIndex])
        {
            var Range = this.Lines[LineIndex].Ranges[RangeIndex];
            if (Range.W > 0)
            {
                this.CurPos.Line = LineIndex;
                this.CurPos.Range = RangeIndex;
                break;
            }
        }
    }
};
/**
 * Получаем массив отрезков, в которые попадает заданная позиция. Их может быть больше 1, например,
 * на месте разрыва строки.
 * @param ContentPos - заданная позиция
 * @returns массив отрезков
 */
Paragraph.prototype.Get_RangesByPos = function(ContentPos)
{
    var Run = this.Get_ElementByPos(ContentPos);

    if (null === Run || para_Run !== Run.Type)
        return [];

    return Run.Get_RangesByPos(ContentPos.Get(ContentPos.Depth - 1));
};
/**
 * Получаем элемент по заданной позиции
 * @param ContentPos - заданная позиция
 * @returns ссылка на элемент
 */
Paragraph.prototype.Get_ElementByPos = function(ContentPos)
{
    if (ContentPos.Depth < 1)
        return this;

    var CurPos = ContentPos.Get(0);
    return this.Content[CurPos].Get_ElementByPos(ContentPos, 1);
};
Paragraph.prototype.GetElementByPos = function(oParaContentPos)
{
	return this.Get_ElementByPos(oParaContentPos);
};
Paragraph.prototype.private_RecalculateTextMetrics = function(TextMetrics)
{
    for (var Index = 0, Count = this.Content.length; Index < Count; Index++)
    {
        // TODO: Пока данная функция реализована только в ранах, ее надо реализовать во всех остальных классах
        if (this.Content[Index].Recalculate_Measure2)
            this.Content[Index].Recalculate_Measure2(TextMetrics);
    }
};
Paragraph.prototype.GetPageByLine = function(CurLine)
{
    var CurPage = 0;
    var PagesCount = this.Pages.length;
    for (; CurPage < PagesCount; CurPage++)
    {
        if (CurLine >= this.Pages[CurPage].StartLine && CurLine <= this.Pages[CurPage].EndLine)
            break;
    }

    return Math.min(PagesCount - 1, CurPage);
};
Paragraph.prototype.CompareDrawingsLogicPositions = function(CompareObject)
{
    var Run1 = this.Get_DrawingObjectRun(CompareObject.Drawing1.Get_Id());
    var Run2 = this.Get_DrawingObjectRun(CompareObject.Drawing2.Get_Id());

    if (Run1 && !Run2)
        CompareObject.Result = 1;
    else if (Run2 && !Run1)
        CompareObject.Result = -1;
    else if (Run1 && Run2)
    {
        var RunPos1 = this.Get_PosByElement(Run1);
        var RunPos2 = this.Get_PosByElement(Run2);

        var Result = RunPos2.Compare(RunPos1);

        if (0 !== Result)
            CompareObject.Result = Result;
        else
        {
            Run1.CompareDrawingsLogicPositions(CompareObject);
        }
    }
};
Paragraph.prototype.StartSelectionFromCurPos = function()
{
	var ContentPos = this.Get_ParaContentPos(false, false);

	this.Selection.Use           = true;
	this.Selection.Start         = false;
	this.Selection.StartManually = true;
	this.Selection.EndManually   = true;
	this.Set_SelectionContentPos(ContentPos, ContentPos);
};
/**
 *  Возвращается объект CParagraphContentPos по заданому Id ParaDrawing, если объект
 *  не найдет, вернется null.
 */
Paragraph.prototype.Get_PosByDrawing = function(Id)
{
    var ContentPos = new CParagraphContentPos();

    var ContentLen = this.Content.length;

    var bFind = false;
    for (var CurPos = 0; CurPos < ContentLen; CurPos++)
    {
        var Element = this.Content[CurPos];
        ContentPos.Update(CurPos, 0);

        if (true === Element.Get_PosByDrawing(Id, ContentPos, 1))
        {
            bFind = true;
            break;
        }
    }

    if (false === bFind || ContentPos.Depth <= 0)
        return null;

    return ContentPos;
};
Paragraph.prototype.GetStyleFromFormatting = function()
{
    // Получим настройки первого рана попавшего в выделение
    var TextPr = null;
    var CurPos = 0;
    if (true === this.Selection.Use)
    {
        var StartPos = this.Selection.StartPos > this.Selection.EndPos ? this.Selection.EndPos : this.Selection.StartPos;
        var EndPos   = this.Selection.StartPos > this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos;

        for (CurPos = StartPos; CurPos < EndPos; ++CurPos)
        {
            if (true !== this.Content[CurPos].IsSelectionEmpty())
                break;
        }
    }
    else
    {
        CurPos = this.CurPos.ContentPos;
    }
    TextPr = this.Content[CurPos].Get_FirstTextPr();

    // В стиль не добавляется HighLight
    if (undefined !== TextPr.HighLight)
    {
        TextPr = TextPr.Copy();
        TextPr.HighLight = undefined;
    }

    // Мы создаем стиль параграфа и стиль рана, линкуем их и возвращаем стиль параграфа.
    var oParaStyle = new asc_CStyle();
    oParaStyle.put_Type(styletype_Paragraph);
    oParaStyle.fill_ParaPr(this.Pr);

    var oStyles = this.Parent.Get_Styles();
    var oPStyle = oStyles.Get(this.Pr.PStyle);
    if (null !== oPStyle)
    {
        oParaStyle.put_BasedOn(oPStyle.Get_Name());
        var oPNextStyle = oStyles.Get(oPStyle.Get_Next());
        if (null !== oPNextStyle)
            oParaStyle.put_Next(oPNextStyle.Get_Name());
    }
    else
	{
		var oDefStyle = oStyles.Get(oStyles.GetDefaultParagraph());
		if (oDefStyle)
			oParaStyle.put_BasedOn(oDefStyle.GetName());
	}
    oParaStyle.fill_TextPr(TextPr);

    var oRunStyle = new asc_CStyle();
    oRunStyle.put_Type(styletype_Character);
    oRunStyle.fill_TextPr(TextPr);
    var oRStyle = oStyles.Get(TextPr.RStyle);
    if (null !== oRStyle)
    {

        oRunStyle.put_BasedOn(oRStyle.Get_Name());
        var oRNextStyle = oStyles.Get(oRStyle.Get_Next());
        if (null !== oRNextStyle)
            oRunStyle.put_Next(oRNextStyle.Get_Name());
    }

    // Линкуем стили
    oParaStyle.put_Link(oRunStyle);
    oRunStyle.put_Link(oParaStyle);

    return oParaStyle;
};
Paragraph.prototype.private_AddCollPrChange = function(Color)
{
    this.CollPrChange = Color;
    AscCommon.CollaborativeEditing.Add_ChangedClass(this);
};
Paragraph.prototype.private_GetCollPrChange = function()
{
    return this.CollPrChange;
};
Paragraph.prototype.Clear_CollaborativeMarks = function()
{
    this.CollPrChange = false;
};
Paragraph.prototype.HavePrChange = function()
{
    return this.Pr.HavePrChange();
};
Paragraph.prototype.GetPrChangeNumPr = function()
{
	if (!this.HavePrChange())
		return null;

	var oPrevNumPr = this.Pr.GetPrChangeNumPr();

	if (!oPrevNumPr && this.Pr.PrChange.PStyle)
	{
		var oStyles     = this.Parent.Get_Styles();
		var oTableStyle = this.Parent.Get_TableStyleForPara();
		var oShapeStyle = this.Parent.Get_ShapeStyleForPara();

		// Считываем свойства для текущего стиля
		var oPr = oStyles.Get_Pr(this.Pr.PrChange.PStyle, styletype_Paragraph, oTableStyle, oShapeStyle);

		if (oPr.ParaPr.NumPr)
			oPrevNumPr = oPr.ParaPr.NumPr.Copy();
	}

	if (oPrevNumPr && undefined === oPrevNumPr.Lvl)
	{
		var oNumPr = this.GetNumPr();
		if (oNumPr)
			oPrevNumPr = new CNumPr(oPrevNumPr.NumId, oNumPr.Lvl);
	}

	return oPrevNumPr;
};
Paragraph.prototype.GetPrReviewColor = function()
{
    if (this.Pr.ReviewInfo)
        return this.Pr.ReviewInfo.Get_Color();

    return REVIEW_COLOR;
};
Paragraph.prototype.AcceptPrChange = function()
{
    this.RemovePrChange();
};
Paragraph.prototype.RejectPrChange = function()
{
    if (true === this.HavePrChange())
    {
        this.Set_Pr(this.Pr.PrChange);
    }
};
Paragraph.prototype.AddPrChange = function()
{
    if (false === this.HavePrChange())
    {
        this.Pr.AddPrChange();
		History.Add(new CChangesParagraphPrChange(this,
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
Paragraph.prototype.SetPrChange = function(PrChange, ReviewInfo)
{
	History.Add(new CChangesParagraphPrChange(this,
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
Paragraph.prototype.RemovePrChange = function()
{
    if (true === this.HavePrChange())
    {
		History.Add(new CChangesParagraphPrChange(this,
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
Paragraph.prototype.private_AddPrChange = function()
{
    if (this.LogicDocument && true === this.LogicDocument.IsTrackRevisions() && true !== this.HavePrChange())
        this.AddPrChange();
};
Paragraph.prototype.SetReviewType = function(nType)
{
	this.GetParaEndRun().SetReviewType(nType);
};
Paragraph.prototype.GetReviewType = function()
{
	return this.GetParaEndRun().GetReviewType();
};
Paragraph.prototype.GetReviewInfo = function()
{
	return this.GetParaEndRun().GetReviewInfo();
};
Paragraph.prototype.GetReviewMoveType = function()
{
	return this.GetParaEndRun().GetReviewMoveType();
};
Paragraph.prototype.GetReviewColor = function()
{
	return this.GetParaEndRun().GetReviewColor();
};
Paragraph.prototype.SetReviewTypeWithInfo = function(nType, oInfo)
{
	this.GetParaEndRun().SetReviewTypeWithInfo(nType, oInfo);
};
/**
 * Возвращаем ран, в котором лежит знак конца параграфа
 * @returns {ParaRun}
 */
Paragraph.prototype.GetParaEndRun = function()
{
    return this.Content[this.Content.length - 1];
};
Paragraph.prototype.IsTrackRevisions = function()
{
    if (this.LogicDocument)
        return this.LogicDocument.IsTrackRevisions();

    return false;
};
/**
 * Отличие данной функции от Get_SectionPr в том, что здесь возвращаются настройки секции, к которой
 * принадлежит данный параграф, а там конкретно настройки секции, которые лежат в данном параграфе.
 */
Paragraph.prototype.Get_SectPr = function()
{
    if (this.Parent && this.Parent.Get_SectPr)
    {
        this.Parent.Update_ContentIndexing();
        return this.Parent.Get_SectPr(this.Index);
    }

    return null;
};
Paragraph.prototype.CheckRevisionsChanges = function(oRevisionsManager)
{
	var sParaId = this.GetId();

	var oChange, oStartPos, oEndPos;
	if (true === this.HavePrChange())
	{
		oStartPos = this.Get_StartPos();
		oEndPos   = this.Get_EndPos(true);

		oChange = new CRevisionsChange();
		oChange.SetElement(this);
		oChange.SetStartPos(oStartPos);
		oChange.SetEndPos(oEndPos);
		oChange.SetType(c_oAscRevisionsChangeType.ParaPr);
		oChange.SetValue(this.Pr.GetDiffPrChange());
		oChange.SetUserId(this.Pr.ReviewInfo.GetUserId());
		oChange.SetUserName(this.Pr.ReviewInfo.GetUserName());
		oChange.SetDateTime(this.Pr.ReviewInfo.GetDateTime());
		oRevisionsManager.AddChange(sParaId, oChange);
	}

	var oChecker    = new CParagraphRevisionsChangesChecker(this, oRevisionsManager);
	var oContentPos = new CParagraphContentPos();
	for (var nCurPos = 0, nCount = this.Content.length; nCurPos < nCount; ++nCurPos)
	{
		if (nCurPos === nCount - 1)
			oChecker.SetParaEndRun();

		oContentPos.Update(nCurPos, 0);
		this.Content[nCurPos].CheckRevisionsChanges(oChecker, oContentPos, 1);
	}

	oChecker.FlushAddRemoveChange();
	oChecker.FlushTextPrChange();

	var nReviewType = this.GetReviewType();
	var oReviewInfo = this.GetReviewInfo();

	if (reviewtype_Common !== nReviewType)
	{
		oStartPos = this.Get_EndPos(false);
		oEndPos   = this.Get_EndPos(true);

		oChange = new CRevisionsChange();
		oChange.SetElement(this);
		oChange.SetStartPos(oStartPos);
		oChange.SetEndPos(oEndPos);
		oChange.SetMoveType(this.GetReviewMoveType());
		oChange.SetType(reviewtype_Add === nReviewType ? c_oAscRevisionsChangeType.ParaAdd : c_oAscRevisionsChangeType.ParaRem);
		oChange.SetUserId(oReviewInfo.GetUserId());
		oChange.SetUserName(oReviewInfo.GetUserName());
		oChange.SetDateTime(oReviewInfo.GetDateTime());
		oRevisionsManager.AddChange(sParaId, oChange);
	}

	var oEndRun = this.GetParaEndRun();
	for (var nPos = 0, nCount = oEndRun.Content.length; nPos < nCount; ++nPos)
	{
		var oItem = oEndRun.Content[nPos];
		if (para_RevisionMove === oItem.GetType())
		{
			oChecker.AddReviewMoveMark(oItem, this.Get_EndPos(true));
		}
	}
};
Paragraph.prototype.private_UpdateTrackRevisionOnChangeParaPr = function(bUpdateInfo)
{
    if (true === this.HavePrChange())
    {
        this.private_UpdateTrackRevisions();

        if (true === bUpdateInfo && this.LogicDocument && true === this.LogicDocument.IsTrackRevisions())
        {
            var OldReviewInfo = this.Pr.ReviewInfo.Copy();
            this.Pr.ReviewInfo.Update();
            History.Add(new CChangesParagraphPrReviewInfo(this, OldReviewInfo, this.Pr.ReviewInfo.Copy()));
        }
    }
};
Paragraph.prototype.private_UpdateTrackRevisions = function()
{
    if (this.LogicDocument && this.LogicDocument.GetTrackRevisionsManager)
    {
        var RevisionsManager = this.LogicDocument.GetTrackRevisionsManager();
        RevisionsManager.CheckElement(this);
    }
};
Paragraph.prototype.UpdateDocumentOutline = function()
{
	if (!this.LogicDocument || !this.Parent)
		return;

	var isCheck = true;
	var oParent = this.Parent;
	while (oParent)
	{
		if (oParent === this.LogicDocument)
		{
			break;
		}
		else if (oParent.IsBlockLevelSdtContent())
		{
			oParent = oParent.Parent.Parent;
		}
		else
		{
			isCheck = false;
			break;
		}
	}

	if (isCheck)
	{
		var oDocumentOutline = this.LogicDocument.GetDocumentOutline();
		if (oDocumentOutline.IsUse())
			oDocumentOutline.CheckParagraph(this);
	}
};
Paragraph.prototype.AcceptRevisionChanges = function(Type, bAll)
{
	var oTrackManager = this.LogicDocument ? this.LogicDocument.GetTrackRevisionsManager() : null;
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
            EndPos   = this.Content.length - 1;
        }

        // TODO: Как переделаем ParaEnd переделать здесь
        if (EndPos >= this.Content.length - 1)
        {
            EndPos = this.Content.length - 2;
            if (true === bAll || undefined === Type || c_oAscRevisionsChangeType.TextPr === Type)
                this.Content[this.Content.length - 1].AcceptPrChange();
        }

        if (this.IsSelectionToEnd())
		{
			if (oTrackManager && oTrackManager.GetProcessTrackMove() && c_oAscRevisionsChangeType.MoveMark === Type)
			{
				var oParaEndRun = this.GetParaEndRun();
				oParaEndRun.RemoveTrackMoveMarks(oTrackManager);
			}
			else if (c_oAscRevisionsChangeType.MoveMarkRemove === Type)
			{
				var oParaEndRun = this.GetParaEndRun();
				oParaEndRun.RemoveReviewMoveType();
			}
		}

		// Начинаем с конца, потому что при выполнении данной функции, количество элементов может изменяться
        for (var nCurPos = EndPos; nCurPos >= StartPos; --nCurPos)
		{
			var oItem = this.Content[nCurPos];
			if (c_oAscRevisionsChangeType.MoveMark === Type
				&& para_RevisionMove === oItem.Type
				&& oProcessMove)
			{
				if (oItem.GetMarkId() === oProcessMove.GetMoveId())
				{
					if (oItem.IsFrom() === oProcessMove.IsFrom())
						this.RemoveFromContent(nCurPos, 1);
				}
				else
				{
					oProcessMove.RegisterOtherMove(oItem.GetMarkId());
				}
			}
			else if (oItem.AcceptRevisionChanges)
			{
				oItem.AcceptRevisionChanges(Type, bAll);
			}
		}

		if (c_oAscRevisionsChangeType.MoveMarkRemove !== Type)
		{
			this.Correct_Content();
			this.Correct_ContentPos(false);
			this.private_UpdateTrackRevisions();
		}
    }
};
Paragraph.prototype.RejectRevisionChanges = function(Type, bAll)
{
	var oTrackManager = this.LogicDocument ? this.LogicDocument.GetTrackRevisionsManager() : null;
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
			EndPos   = this.Content.length - 1;
		}

		// TODO: Как переделаем ParaEnd переделать здесь
		if (EndPos >= this.Content.length - 1)
		{
			EndPos = this.Content.length - 2;
			if (true === bAll || undefined === Type || c_oAscRevisionsChangeType.TextPr === Type)
				this.Content[this.Content.length - 1].RejectPrChange();
		}

		if (oTrackManager && oTrackManager.GetProcessTrackMove() && c_oAscRevisionsChangeType.MoveMark === Type && this.IsSelectionToEnd())
		{
			var oParaEndRun = this.GetParaEndRun();
			oParaEndRun.RemoveTrackMoveMarks(oTrackManager);
		}

		// Начинаем с конца, потому что при выполнении данной фунцкции, количество элементов может изменяться
		for (var nCurPos = EndPos; nCurPos >= StartPos; --nCurPos)
		{
			var oItem = this.Content[nCurPos];
			if (c_oAscRevisionsChangeType.MoveMark === Type
				&& para_RevisionMove === oItem.Type
				&& oProcessMove)
			{
				if (oItem.GetMarkId() === oProcessMove.GetMoveId())
				{
					if (oItem.IsFrom() === oProcessMove.IsFrom())
						this.RemoveFromContent(nCurPos, 1);
				}
				else
				{
					oProcessMove.RegisterOtherMove(oItem.GetMarkId());
				}
			}
			else if (oItem.RejectRevisionChanges)
			{
				oItem.RejectRevisionChanges(Type, bAll);
			}
		}

		this.Correct_Content();
		this.Correct_ContentPos(false);
		this.private_UpdateTrackRevisions();
	}
};
Paragraph.prototype.GetRevisionsChangeElement = function(SearchEngine)
{
    if (true === SearchEngine.IsFound())
        return;

    var Direction = SearchEngine.GetDirection();
    if (Direction > 0)
    {
        var DrawingObjects = this.GetAllDrawingObjects();
        for (var DrawingIndex = 0, Count = DrawingObjects.length; DrawingIndex < Count; DrawingIndex++)
        {
            DrawingObjects[DrawingIndex].GetRevisionsChangeElement(SearchEngine);
            if (true === SearchEngine.IsFound())
                return;
        }
    }

    if (true !== SearchEngine.IsCurrentFound())
    {
        if (this === SearchEngine.GetCurrentElement())
            SearchEngine.SetCurrentFound();
    }
    else
    {
        SearchEngine.SetFoundedElement(this);
    }

    if (Direction < 0 && true !== SearchEngine.IsFound())
    {
        var DrawingObjects = this.GetAllDrawingObjects();
        for (var DrawingIndex = DrawingObjects.length - 1; DrawingIndex >= 0; DrawingIndex--)
        {
            DrawingObjects[DrawingIndex].GetRevisionsChangeElement(SearchEngine);
            if (true === SearchEngine.IsFound())
                return;
        }
    }
};
Paragraph.prototype.IsSelectedAll = function()
{
    var bStart = this.Selection_IsFromStart();
    var bEnd   = this.Selection_CheckParaEnd();

    return ((true === bStart && true === bEnd) || true === this.ApplyToAll ? true : false);
};
Paragraph.prototype.GetContentPosition = function(bSelection, bStart, PosArray)
{
    if (!PosArray)
        PosArray = [];

    var Index = PosArray.length;

    var ParaContentPos = this.Get_ParaContentPos(bSelection, bStart);

    var Depth = ParaContentPos.Get_Depth();
    while (Depth > 0)
    {
        var Pos = ParaContentPos.Get(Depth);
        ParaContentPos.Decrease_Depth(1);
        var Class = this.Get_ElementByPos(ParaContentPos);
        Depth--;

        PosArray.splice(Index, 0, {Class : Class, Position : Pos});
    }

    PosArray.splice(Index, 0, {Class : this, Position : ParaContentPos.Get(0)});
    return PosArray;
};
Paragraph.prototype.SetContentSelection = function(StartDocPos, EndDocPos, Depth, StartFlag, EndFlag)
{
    if ((0 === StartFlag && (!StartDocPos[Depth] || this !== StartDocPos[Depth].Class)) || (0 === EndFlag && (!EndDocPos[Depth] || this !== EndDocPos[Depth].Class)))
        return;

    var StartPos = 0, EndPos = 0;
    switch (StartFlag)
    {
        case 0 : StartPos = StartDocPos[Depth].Position; break;
        case 1 : StartPos = 0; break;
        case -1: StartPos = this.Content.length - 1; break;
    }

    switch (EndFlag)
    {
        case 0 : EndPos = EndDocPos[Depth].Position; break;
        case 1 : EndPos = 0; break;
        case -1: EndPos = this.Content.length - 1; break;
    }

    var _StartDocPos = StartDocPos, _StartFlag = StartFlag;
    if (null !== StartDocPos && true === StartDocPos[Depth].Deleted)
    {
        if (StartPos < this.Content.length)
        {
            _StartDocPos = null;
            _StartFlag = 1;
        }
        else if (StartPos > 0)
        {
            StartPos--;
            _StartDocPos = null;
            _StartFlag = -1;
        }
        else
        {
            // Такого не должно быть
            return;
        }
    }

    var _EndDocPos = EndDocPos, _EndFlag = EndFlag;
    if (null !== EndDocPos && true === EndDocPos[Depth].Deleted)
    {
        if (EndPos < this.Content.length)
        {
            _EndDocPos = null;
            _EndFlag = 1;
        }
        else if (EndPos > 0)
        {
            EndPos--;
            _EndDocPos = null;
            _EndFlag = -1;
        }
        else
        {
            // Такого не должно быть
            return;
        }
    }

    this.Selection.Use      = true;
    this.Selection.StartPos = StartPos;
    this.Selection.EndPos   = EndPos;

    if (StartPos !== EndPos)
    {
        if (this.Content[StartPos] && this.Content[StartPos].SetContentSelection)
        this.Content[StartPos].SetContentSelection(_StartDocPos, null, Depth + 1, _StartFlag, StartPos > EndPos ? 1 : -1);

        if (this.Content[EndPos] && this.Content[EndPos].SetContentSelection)
        this.Content[EndPos].SetContentSelection(null, _EndDocPos, Depth + 1, StartPos > EndPos ? -1 : 1, _EndFlag);

        var _StartPos = StartPos;
        var _EndPos = EndPos;
        var Direction = 1;

        if (_StartPos > _EndPos)
        {
            _StartPos = EndPos;
            _EndPos = StartPos;
            Direction = -1;
        }

        for (var CurPos = _StartPos + 1; CurPos < _EndPos; CurPos++)
        {
            this.Content[CurPos].SelectAll(Direction);
        }
    }
    else
    {
        if (this.Content[StartPos] && this.Content[StartPos].SetContentSelection)
        this.Content[StartPos].SetContentSelection(_StartDocPos, _EndDocPos, Depth + 1, _StartFlag, _EndFlag);
    }
};
Paragraph.prototype.SetContentPosition = function(DocPos, Depth, Flag)
{
    if (0 === Flag && (!DocPos[Depth] || this !== DocPos[Depth].Class))
        return;

    var Pos = 0;
    switch (Flag)
    {
        case 0 : Pos = DocPos[Depth].Position; break;
        case 1 : Pos = 0; break;
        case -1: Pos = this.Content.length - 1; break;
    }

    var _DocPos = DocPos, _Flag = Flag;
    if (null !== DocPos && true === DocPos[Depth].Deleted)
    {
        if (Pos < this.Content.length)
        {
            _DocPos = null;
            _Flag = 1;
        }
        else if (Pos > 0)
        {
            Pos--;
            _DocPos = null;
            _Flag = -1;
        }
        else
        {
            // Такого не должно быть
            return;
        }
    }

    // TODO: Как только разберемся с ParaEnd, исправить здесь.
    if (Pos === this.Content.length - 1 && this.Content.length > 1)
	{
		Pos     = this.Content.length - 2;
		_Flag   = -1;
		_DocPos = null;
	}

    this.CurPos.ContentPos = Pos;
    if (this.Content[Pos] && this.Content[Pos].SetContentPosition)
    	this.Content[Pos].SetContentPosition(_DocPos, Depth + 1, _Flag);
    else
        this.Correct_ContentPos2();
};
Paragraph.prototype.Get_XYByContentPos = function(ContentPos)
{
	var ParaContentPos = this.Get_ParaContentPos(false, false);
	this.Set_ParaContentPos(ContentPos, true, -1, -1);
	var Result = this.Internal_Recalculate_CurPos(-1, false, false, true);
	this.Set_ParaContentPos(ParaContentPos, true, this.CurPos.Line, this.CurPos.Range, false);
	return Result;
};
Paragraph.prototype.GetContentLength = function()
{
    return this.Content.length;
};
Paragraph.prototype.Get_PagesCount = function()
{
    return this.Pages.length;
};
Paragraph.prototype.GetPagesCount = function()
{
	return this.Pages.length;
};
Paragraph.prototype.IsEmptyPage = function(CurPage, bSkipEmptyLinesWithBreak)
{
    if (!this.Pages[CurPage] || this.Pages[CurPage].EndLine < this.Pages[CurPage].StartLine)
        return true;

    if (true === bSkipEmptyLinesWithBreak
		&& this.Pages[CurPage].EndLine === this.Pages[CurPage].StartLine
		&& this.Lines[this.Pages[CurPage].EndLine]
		&& this.Lines[this.Pages[CurPage].EndLine].Info & paralineinfo_Empty
		&& this.Lines[this.Pages[CurPage].EndLine].Info & paralineinfo_BreakRealPage)
    	return true;

    return false;
};
Paragraph.prototype.Check_FirstPage = function(CurPage, bSkipEmptyLinesWithBreak)
{
    if (true === this.IsEmptyPage(CurPage, bSkipEmptyLinesWithBreak))
        return false;

    return this.Check_EmptyPages(CurPage - 1, bSkipEmptyLinesWithBreak);
};
Paragraph.prototype.Check_EmptyPages = function(CurPage, bSkipEmptyLinesWithBreak)
{
    for (var _CurPage = CurPage; _CurPage >= 0; --_CurPage)
    {
        if (true !== this.IsEmptyPage(_CurPage, bSkipEmptyLinesWithBreak))
            return false;
    }

    return true;
};
Paragraph.prototype.Get_CurrentColumn = function(CurPage)
{
    this.Internal_Recalculate_CurPos(this.CurPos.ContentPos, true, false, false);
    return this.Get_AbsoluteColumn(this.CurPos.PagesPos);
};
Paragraph.prototype.private_RefreshNumbering = function(NumPr)
{
    if (undefined === NumPr || null === NumPr)
        return;

    History.Add_RecalcNumPr(NumPr);
};
Paragraph.prototype.Get_NumberingPage = function()
{
    var ParaNum = this.Numbering;
    var NumberingRun = ParaNum.Run;

    if (null === NumberingRun)
        return -1;

    var NumLine = ParaNum.Line;
    for (var CurPage = 0, PagesCount = this.Pages.length; CurPage < PagesCount; ++CurPage)
    {
        if (NumLine >= this.Pages[CurPage].StartLine && NumLine <= this.Pages[CurPage].EndLine)
            return CurPage;
    }

    return -1;
};
Paragraph.prototype.Set_ParaPropsForVerticalTextInCell = function(isVerticalText)
{
    if (true === isVerticalText)
    {
        var Left  = (undefined === this.Pr.Ind.Left || this.Pr.Ind.Left < 0.001 ? 2 : undefined);
        var Right = (undefined === this.Pr.Ind.Right || this.Pr.Ind.Right < 0.001 ? 2 : undefined);

        this.Set_Ind({Left : Left, Right : Right}, false);
    }
    else
    {

        var Left  = (undefined !== this.Pr.Ind.Left && Math.abs(this.Pr.Ind.Left - 2) < 0.01 ? undefined : this.Pr.Ind.Left);
        var Right = (undefined !== this.Pr.Ind.Right && Math.abs(this.Pr.Ind.Right - 2) < 0.01 ? undefined : this.Pr.Ind.Right);
        var First = this.Pr.Ind.FirstLine;

        this.Set_Ind({Left : Left, Right : Right, FirstLine : First}, true);
    }
};
/**
 * Проверяем можно ли объединить границы двух параграфов с заданными настройками Pr1, Pr2.
 */
Paragraph.prototype.private_CompareBorderSettings = function(Pr1, Pr2)
{
	// Сначала сравним правую и левую границы параграфов
	var Left_1  = Math.min(Pr1.Ind.Left, Pr1.Ind.Left + Pr1.Ind.FirstLine);
	var Right_1 = Pr1.Ind.Right;
	var Left_2  = Math.min(Pr2.Ind.Left, Pr2.Ind.Left + Pr2.Ind.FirstLine);
	var Right_2 = Pr2.Ind.Right;

	if (Math.abs(Left_1 - Left_2) > 0.001 || Math.abs(Right_1 - Right_2) > 0.001)
		return false;

	// Почему то Word не сравнивает границы между параграфами.
	if (false === Pr1.Brd.Top.Compare(Pr2.Brd.Top)
		|| false === Pr1.Brd.Bottom.Compare(Pr2.Brd.Bottom)
		|| false === Pr1.Brd.Left.Compare(Pr2.Brd.Left)
		|| false === Pr1.Brd.Right.Compare(Pr2.Brd.Right))
		return false;

	return true;
};
Paragraph.prototype.GetFootnotesList = function(oEngine)
{
	oEngine.SetCurrentParagraph(this);
	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		if (this.Content[nIndex].GetFootnotesList)
			this.Content[nIndex].GetFootnotesList(oEngine);

		if (oEngine.IsRangeFull())
			return;
	}
};
Paragraph.prototype.GetAutoWidthForDropCap = function()
{
	if (this.Is_Empty())
	{
		var oEndRun = this.Content[this.Content.length - 1];
		if (!oEndRun || oEndRun.Type !== para_Run)
			return 0;

		var oParaEnd = oEndRun.GetParaEnd();
		if (!oParaEnd)
			return 0;

		return oParaEnd.Get_WidthVisible();
	}
	else
	{
		if (this.Lines.length <= 0 || this.Lines[0].Ranges.length <= 0)
			return 0;

		return this.Lines[0].Ranges[0].W;
	}
};
Paragraph.prototype.GotoFootnoteRef = function(isNext, isCurrent)
{
	var nPos = 0;

	if (true === isCurrent)
	{
		if (true === this.Selection.Use)
			nPos = Math.min(this.Selection.StartPos, this.Selection.EndPos);
		else
			nPos = this.CurPos.ContentPos;

	}
	else
	{
		if (true === isNext)
			nPos = 0;
		else
			nPos = this.Content.length - 1;
	}

	var isStepOver = false;
	if (true === isNext)
	{
		for (var nIndex = nPos, nCount = this.Content.length - 1; nIndex < nCount; ++nIndex)
		{
			var nRes = this.Content[nIndex].GotoFootnoteRef ? this.Content[nIndex].GotoFootnoteRef(true, true === isCurrent && nPos === nIndex, isStepOver) : 0;

			if (nRes > 0)
				isStepOver = true;
			else  if (-1 === nRes)
				return true;
		}
	}
	else
	{
		for (var nIndex = nPos; nIndex >= 0; --nIndex)
		{
			var nRes = this.Content[nIndex].GotoFootnoteRef ? this.Content[nIndex].GotoFootnoteRef(false, true === isCurrent && nPos === nIndex, isStepOver) : 0;

			if (nRes > 0)
				isStepOver = true;
			else  if (-1 === nRes)
				return true;
		}
	}

	return false;
};
Paragraph.prototype.GetText = function(oPr)
{
	var oText = new CParagraphGetText();

	oText.SetBreakOnNonText(false);
	oText.SetParaEndToSpace(true);

	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		if (this.Content[nIndex].Get_Text)
			this.Content[nIndex].Get_Text(oText);
	}

	return oText.Text;
};
Paragraph.prototype.CheckFootnote = function(X, Y, CurPage)
{
	var SearchPosXY = this.Get_ParaContentPosByXY(X, Y, CurPage, false, false);
	var CurLine = SearchPosXY.Line;

	if (true !== SearchPosXY.InText)
		return null;

	if (!this.Lines[CurLine])
	{
		return null;
	}
	else if (this.Lines[CurLine].Info & paralineinfo_Notes)
	{
		var arrFootnoteRefs = this.private_GetFootnoteRefsInLine(CurLine);
		var nMinDiff = 1000000000;
		var oNote = null;
		for (var nIndex = 0, nCount = arrFootnoteRefs.length; nIndex < nCount; ++nIndex)
		{
			var oFootnoteRef = arrFootnoteRefs[nIndex];
			var oFootnote    = oFootnoteRef.GetFootnote();
			var oPosInfo     = oFootnote.GetPositionInfo();

			if (Math.abs(X - oPosInfo.X) < nMinDiff || Math.abs(X - (oPosInfo.X + oPosInfo.W)) < nMinDiff)
			{
				nMinDiff = Math.min(Math.abs(X - oPosInfo.X), Math.abs(X - (oPosInfo.X + oPosInfo.W)));
				oNote    = oFootnote;
			}
		}

		if (nMinDiff > 10)
			oNote = null;

		return oNote;
	}

	return null;
};
Paragraph.prototype.private_GetFootnoteRefsInLine = function(CurLine)
{
	var arrFootnotes = [];
	var oLine = this.Lines[CurLine];
	for (var CurRange = 0, RangesCount = oLine.Ranges.length; CurRange < RangesCount; ++CurRange)
	{
		var oRange = oLine.Ranges[CurRange];
		for (var CurPos = oRange.StartPos; CurPos <= oRange.EndPos; ++CurPos)
		{
			if (this.Content[CurPos].GetFootnoteRefsInRange)
				this.Content[CurPos].GetFootnoteRefsInRange(arrFootnotes, CurLine, CurRange);
		}
	}
	return arrFootnotes;
};
Paragraph.prototype.CheckParaEnd = function()
{
	// TODO (ParaEnd): Как избавимся от ParaEnd убрать эту проверку
	if (this.Content.length <= 0 || para_Run !== this.Content[this.Content.length - 1].Type || null === this.Content[this.Content.length - 1].GetParaEnd())
	{
		var oEndRun = new ParaRun(this);
		oEndRun.Set_Pr(this.TextPr.Value.Copy());
		oEndRun.Add_ToContent(0, new ParaEnd());
		this.Add_ToContent(this.Content.length, oEndRun);
	}
};
Paragraph.prototype.GetLineEndPos = function(CurLine)
{
	if (CurLine < 0 || CurLine >= this.Lines.length)
		return new CParagraphContentPos();

	var oLine = this.Lines[CurLine];
	if (!oLine || oLine.Ranges.length <= 0)
		return new CParagraphContentPos();

	return this.Get_EndRangePos2(CurLine, oLine.Ranges.length - 1);
};
Paragraph.prototype.CheckCommentStartEnd = function(sCommentId)
{
	var oResult = {Start : false, End : false};
	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		var oElement = this.Content[nIndex];
		if (para_Comment === oElement.Type && sCommentId === oElement.GetCommentId())
		{
			if (oElement.IsCommentStart())
				oResult.Start = true;
			else
				oResult.End = true;
		}
	}

	return oResult;
};
Paragraph.prototype.IsColumnBreakOnLeft = function()
{
	var oRunElementsBefore = new CParagraphRunElements(this.Get_ParaContentPos(this.Selection.Use, false, false), 1, null);
	this.GetPrevRunElements(oRunElementsBefore);

	var arrElements = oRunElementsBefore.Elements;
	if (arrElements
		&& 1 === arrElements.length
		&& para_NewLine === arrElements[0].Type
		&& true === arrElements[0].IsColumnBreak())
		return true;

	return false;
};
Paragraph.prototype.Can_CopyCut = function()
{
	return true;
};
Paragraph.prototype.CanUpdateTarget = function(CurPage)
{
	if (this.Pages.length <= 0)
		return false;

	if (this.Pages.length <= CurPage)
		return true;

	if (!this.Pages[CurPage] || !this.Lines[this.Pages[CurPage].EndLine] || !this.Lines[this.Pages[CurPage].EndLine].Ranges.length <= 0)
		return false;

	var nPos = (this.IsSelectionUse() ? this.Selection.EndPos : this.CurPos.ContentPos);

	var oLastLine  = this.Lines[this.Pages[CurPage]];
	var oLastRange = oLastLine.Ranges[oLastLine.Ranges.length - 1];

	if (oLastRange.EndPos > nPos)
		return true;

	return false;
};
Paragraph.prototype.IsInDrawing = function(X, Y, CurPage)
{
	return false;
};
Paragraph.prototype.IsTableBorder = function(X, Y, CurPage)
{
	return null;
};
Paragraph.prototype.GetNumberingInfo = function(oNumberingEngine)
{
	if (!oNumberingEngine || oNumberingEngine.IsStop())
		return;

	oNumberingEngine.CheckParagraph(this);
};
Paragraph.prototype.ClearParagraphFormatting = function(isClearParaPr, isClearTextPr)
{
	if (isClearParaPr
		&& (!this.IsSelectionUse()
		|| this.IsSelectedAll()
		|| !this.Parent.IsSelectedSingleElement()))
	{
		this.Clear_Formatting();
	}

	if (isClearTextPr)
	{
		var oParaTextPr = new ParaTextPr();
		oParaTextPr.Value.Set_FromObject(new CTextPr(), true);

		// Highlight и Lang не сбрасываются при очистке текстовых настроек
		oParaTextPr.Value.Lang      = undefined;
		oParaTextPr.Value.HighLight = undefined;

		this.Add(oParaTextPr);
	}
};
Paragraph.prototype.SetParagraphPr = function(oParaPr)
{
	this.SetDirectParaPr(oParaPr);
};
Paragraph.prototype.SetParagraphAlign = function(Align)
{
	this.Set_Align(Align);
};
Paragraph.prototype.SetParagraphDefaultTabSize = function(TabSize)
{
	this.Set_DefaultTabSize(TabSize);
};
Paragraph.prototype.SetParagraphSpacing = function(Spacing)
{
	this.Set_Spacing(Spacing, false);
};
Paragraph.prototype.SetParagraphTabs = function(Tabs)
{
	this.Set_Tabs(Tabs);
};
Paragraph.prototype.GetParagraphTabs = function()
{
	return this.Get_CompiledPr2(false).ParaPr.Tabs;
};
Paragraph.prototype.SetParagraphIndent = function(Ind)
{
	var NumPr = this.GetNumPr();
	if (undefined !== Ind.ChangeLevel && 0 !== Ind.ChangeLevel && undefined !== NumPr)
	{
		if (Ind.ChangeLevel > 0)
			this.ApplyNumPr(NumPr.NumId, Math.min(8, NumPr.Lvl + 1));
		else
			this.ApplyNumPr(NumPr.NumId, Math.max(0, NumPr.Lvl - 1));
	}
	else
	{
		this.Set_Ind(Ind, false);
	}
};
Paragraph.prototype.SetParagraphShd = function(Shd)
{
	return this.Set_Shd(Shd);
};
Paragraph.prototype.SetParagraphStyle = function(Name)
{
	if (!this.LogicDocument)
		return;

	var StyleId = this.LogicDocument.Get_Styles().GetStyleIdByName(Name, true);
	this.Style_Add(StyleId);
};
Paragraph.prototype.GetParagraphStyle = function()
{
	return this.Style_Get();
};
Paragraph.prototype.SetParagraphStyleById = function(sStyleId)
{
	this.Style_Add(sStyleId);
};
Paragraph.prototype.SetParagraphContextualSpacing = function(Value)
{
	this.Set_ContextualSpacing(Value);
};
Paragraph.prototype.SetParagraphPageBreakBefore = function(Value)
{
	this.Set_PageBreakBefore(Value);
};
Paragraph.prototype.SetParagraphKeepLines = function(Value)
{
	this.Set_KeepLines(Value);
};
Paragraph.prototype.SetParagraphKeepNext = function(Value)
{
	this.Set_KeepNext(Value);
};
Paragraph.prototype.SetParagraphWidowControl = function(Value)
{
	this.Set_WidowControl(Value);
};
Paragraph.prototype.SetParagraphBorders = function(Borders)
{
	this.Set_Borders(Borders);
};
Paragraph.prototype.IncreaseDecreaseFontSize = function(bIncrease)
{
	this.IncDec_FontSize(bIncrease);
};
Paragraph.prototype.GetCurrentParagraph = function(bIgnoreSelection, arrSelectedParagraphs, oPr)
{
	if (arrSelectedParagraphs)
		arrSelectedParagraphs.push(this);

	return this;
};
Paragraph.prototype.Get_FirstParagraph = function()
{
	return this;
};
Paragraph.prototype.GetAllContentControls = function(arrContentControls)
{
	if (!arrContentControls)
		arrContentControls = [];

	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		if (this.Content[nIndex].GetAllContentControls)
			this.Content[nIndex].GetAllContentControls(arrContentControls);
	}

	return arrContentControls;
};
Paragraph.prototype.GetTargetPos = function()
{
	return this.Internal_Recalculate_CurPos(this.CurPos.ContentPos, false, false, true);
};
Paragraph.prototype.GetSelectedContentControls = function()
{
	var arrContentControls = [];

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (StartPos > EndPos)
		{
			StartPos = this.Selection.EndPos;
			EndPos   = this.Selection.StartPos;
		}

		for (var Index = StartPos; Index <= EndPos; ++Index)
		{
			if (this.Content[Index].GetSelectedContentControls)
				this.Content[Index].GetSelectedContentControls(arrContentControls);
		}
	}
	else
	{
		if (this.Content[this.CurPos.ContentPos] && this.Content[this.CurPos.ContentPos].GetSelectedContentControls)
			this.Content[this.CurPos.ContentPos].GetSelectedContentControls(arrContentControls);
	}

	return arrContentControls;
};
Paragraph.prototype.AddContentControl = function(nContentControlType)
{
	if (c_oAscSdtLevelType.Inline !== nContentControlType)
		return null;

	if (true === this.IsSelectionUse())
	{
		if (this.Selection.StartPos === this.Selection.EndPos && para_Run !== this.Content[this.Selection.StartPos].Type)
		{
			if (this.Content[this.Selection.StartPos].AddContentControl)
				return this.Content[this.Selection.StartPos].AddContentControl();

			return null;
		}
		else
		{
			var nStartPos = this.Selection.StartPos;
			var nEndPos   = this.Selection.EndPos;
			if (nEndPos < nStartPos)
			{
				nStartPos = this.Selection.EndPos;
				nEndPos   = this.Selection.StartPos;
			}

			for (var nIndex = nStartPos; nIndex <= nEndPos; ++nIndex)
			{
				if (para_Run !== this.Content[nIndex].Type)
				{
					// TODO: Вывести сообщение, что в данном месте нельзя добавить Plain text content control
					return null;
				}
			}

			// TODO: ParaEnd
			if (nEndPos === this.Content.length - 1)
			{
				nEndPos--;
				this.Content[this.Content.length - 1].RemoveSelection();
			}

			var oContentControl = new CInlineLevelSdt();
			oContentControl.SetDefaultTextPr(this.GetDirectTextPr());

			if (nEndPos < nStartPos)
			{
				this.Add_ToContent(nStartPos, oContentControl);
				oContentControl.Add_ToContent(0, new ParaRun(this));
				this.Selection.StartPos = nStartPos;
				this.Selection.EndPos   = nStartPos;
			}
			else
			{
				var oNewRun = this.Content[nEndPos].Split_Run(Math.max(this.Content[nEndPos].Selection.StartPos, this.Content[nEndPos].Selection.EndPos));
				this.Add_ToContent(nEndPos + 1, oNewRun);

				oNewRun = this.Content[nStartPos].Split_Run(Math.min(this.Content[nStartPos].Selection.StartPos, this.Content[nStartPos].Selection.EndPos));
				this.Add_ToContent(nStartPos + 1, oNewRun);

				oContentControl.ReplacePlaceHolderWithContent();
				for (var nIndex = nEndPos + 1; nIndex >= nStartPos + 1; --nIndex)
				{
					oContentControl.Add_ToContent(0, this.Content[nIndex]);
					this.Remove_FromContent(nIndex, 1);
				}

				if (oContentControl.IsEmpty())
					oContentControl.ReplaceContentWithPlaceHolder();

				this.Add_ToContent(nStartPos + 1, oContentControl);
				this.Selection.StartPos = nStartPos + 1;
				this.Selection.EndPos   = nStartPos + 1;
			}

			oContentControl.MoveCursorToStartPos();
			oContentControl.SelectAll(1);
			return oContentControl;
		}
	}
	else
	{
		var oContentControl = new CInlineLevelSdt();
		oContentControl.SetDefaultTextPr(this.GetDirectTextPr());
		this.Add(oContentControl);

		var oContentControlPos = this.Get_PosByElement(oContentControl);
		if (oContentControlPos)
		{
			oContentControl.Get_StartPos(oContentControlPos, oContentControlPos.Get_Depth() + 1);
			this.Set_ParaContentPos(oContentControlPos, false, -1, -1);
		}

		oContentControl.SelectContentControl();

		return oContentControl;
	}
};
Paragraph.prototype.GetCurrentComplexFields = function(bReturnFieldPos)
{
	var arrComplexFields = [];

	var oInfo = this.GetEndInfoByPage(-1);
	if (oInfo)
	{
		for (var nIndex = 0, nCount = oInfo.ComplexFields.length; nIndex < nCount; ++nIndex)
		{
			var oComplexField = oInfo.ComplexFields[nIndex].ComplexField;
			if (oComplexField.IsUse())
			{
				if (bReturnFieldPos)
					arrComplexFields.push(oInfo.ComplexFields[nIndex]);
				else
					arrComplexFields.push(oComplexField);
			}
		}
	}

	var nEndPos = Math.min(this.CurPos.ContentPos, this.Content.length - 1);
	for (var nIndex = 0; nIndex <= nEndPos; ++nIndex)
	{
		if (this.Content[nIndex].GetCurrentComplexFields)
			this.Content[nIndex].GetCurrentComplexFields(arrComplexFields, nIndex === nEndPos, bReturnFieldPos);
	}

	return arrComplexFields;
};
Paragraph.prototype.GetComplexFieldsByPos = function(oParaPos, bReturnFieldPos)
{
	var nLine  = this.CurPos.Line;
	var nRange = this.CurPos.Range;

	var oCurrentPos = this.Get_ParaContentPos(false);
	this.Set_ParaContentPos(oParaPos, false, -1, -1, false);
	var arrComplexFields = this.GetCurrentComplexFields(bReturnFieldPos);
	this.Set_ParaContentPos(oCurrentPos, false, nLine, nRange, false);
	return arrComplexFields;
};
Paragraph.prototype.GetComplexFieldsByXY = function(X, Y, CurPage, bReturnFieldPos)
{
	var SearchPosXY = this.Get_ParaContentPosByXY(X, Y, CurPage, false, false);
	return this.GetComplexFieldsByPos(SearchPosXY.Pos, bReturnFieldPos);
};
Paragraph.prototype.GetOutlineParagraphs = function(arrOutline, oPr)
{
	if (this.IsEmpty({SkipNewLine : true, SkipComplexFields : true}) && (!oPr || false !== oPr.SkipEmptyParagraphs))
		return;

	var nOutlineLvl = this.GetOutlineLvl();
	if (undefined !== nOutlineLvl
		&& (!oPr
		|| -1 === oPr.OutlineStart
		|| -1 === oPr.OutlineEnd
		|| undefined === oPr.OutlineStart
		|| undefined === oPr.OutlineEnd
		|| (nOutlineLvl >= oPr.OutlineStart - 1 && nOutlineLvl <= oPr.OutlineEnd - 1)))
	{
		arrOutline.push({Paragraph : this, Lvl : nOutlineLvl});
	}
	else if (oPr && oPr.Styles && oPr.Styles.length > 0)
	{
		if(!this.LogicDocument)
		{
			return;
		}
		var oStyle = this.LogicDocument.Get_Styles().Get(this.Style_Get());
		if (!oStyle)
			return;

		var sStyleName = oStyle.Get_Name();

		for (var nIndex = 0, nCount = oPr.Styles.length; nIndex < nCount; ++nIndex)
		{
			if (oPr.Styles[nIndex].Name === sStyleName)
				return arrOutline.push({Paragraph : this, Lvl : oPr.Styles[nIndex].Lvl - 1});
		}
	}

	if (oPr && oPr.SkipDrawings)
		return;

	var arrDrawings = this.GetAllDrawingObjects();
	for (var nDrIndex = 0, nDrCount = arrDrawings.length; nDrIndex < nDrCount; ++nDrIndex)
	{
		var arrContents = arrDrawings[nDrIndex].GetAllDocContents();
		for (var nContentIndex = 0, nContentsCount = arrContents.length; nContentIndex < nContentsCount; ++nContentIndex)
		{
			arrContents[nContentIndex].GetOutlineParagraphs(arrOutline, oPr);
		}
	}
};
Paragraph.prototype.UpdateBookmarks = function(oManager)
{
	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		this.Content[nIndex].UpdateBookmarks(oManager);
	}
};
Paragraph.prototype.GetSimilarNumbering = function(oContinueEngine)
{
	if (oContinueEngine.IsFound())
		return;

	oContinueEngine.CheckParagraph(this);
};
Paragraph.prototype.private_CheckUpdateBookmarks = function(Items)
{
	if (!Items)
		return;

	if(!this.LogicDocument)
	{
		return;
	}
	for (var nIndex = 0, nCount = Items.length; nIndex < nCount; ++nIndex)
	{
		var oItem = Items[nIndex];
		if (oItem && para_Bookmark === oItem.Type)
		{
			this.LogicDocument.GetBookmarksManager().SetNeedUpdate(true);
			return;
		}
	}
};
Paragraph.prototype.GetTableOfContents = function(isUnique, isCheckFields)
{
	if (true !== isCheckFields)
		return null;

	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		var oResult = this.Content[nIndex].GetComplexField(fieldtype_TOC);
		if (oResult)
			return oResult;
	}

	return null;
};
Paragraph.prototype.GetComplexFieldsArrayByType = function(nType)
{
	var arrComplexFields = [];
	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		this.Content[nIndex].GetComplexFieldsArray(nType, arrComplexFields);
	}

	return arrComplexFields;
};
Paragraph.prototype.AddBookmarkForTOC = function()
{
	if (!this.LogicDocument)
		return;

	var oBookmarksManager = this.LogicDocument.GetBookmarksManager();

	var sId   = oBookmarksManager.GetNewBookmarkId();
	var sName = oBookmarksManager.GetNewBookmarkNameTOC();

	this.Add_ToContent(0, new CParagraphBookmark(true, sId, sName));
	this.Add_ToContent(this.Content.length - 1, new CParagraphBookmark(false, sId, sName));

	this.Correct_Content();

	return sName;
};
Paragraph.prototype.AddBookmarkChar = function(oBookmarkChar, isUseSelection, isStartSelection)
{
	var oParaPos   = this.Get_ParaContentPos(isUseSelection, isStartSelection, false);
	var arrClasses = this.Get_ClassesByPos(oParaPos);

	var oRun, oParent;
	if (1 === arrClasses.length && arrClasses[arrClasses.length - 1].Type === para_Run)
	{
		oRun    = arrClasses[arrClasses.length - 1];
		oParent = this;
	}
	else if (arrClasses.length >= 2 && arrClasses[arrClasses.length - 1].Type === para_Run)
	{
		oRun    = arrClasses[arrClasses.length - 1];
		oParent = arrClasses[arrClasses.length - 2];
	}
	else
	{
		return false;
	}

	var oRunPos = oParaPos.Get(oParaPos.Get_Depth() - 1);
	oRun.Split2(oParaPos.Get(oParaPos.Get_Depth()), oParent, oRunPos);
	oParent.Add_ToContent(oRunPos + 1, oBookmarkChar);

	return true;
};
/**
 * Добавляем закладку привязанную к началу данного параграфа
 * @param {string} sBookmarkName
 */
Paragraph.prototype.AddBookmarkAtBegin = function(sBookmarkName)
{
	if (!this.LogicDocument)
		return;

	var oBookmarksManager = this.LogicDocument.GetBookmarksManager();

	var sId = oBookmarksManager.GetNewBookmarkId();

	this.Add_ToContent(0, new CParagraphBookmark(true, sId, sBookmarkName));
	this.Add_ToContent(1, new CParagraphBookmark(false, sId, sBookmarkName));

	this.Correct_Content();
};
/**
 * Проверяем есть ли у нас в заданной точке сложное поле типа PAGEREF с флагом hyperlink = true
 * @param X
 * @param Y
 * @param CurPage
 * @returns {?CComplexField}
 */
Paragraph.prototype.CheckPageRefLink = function(X, Y, CurPage)
{
	var arrComplexFields = this.GetComplexFieldsByXY(X, Y, CurPage);
	for (var nIndex = 0, nCount = arrComplexFields.length; nIndex < nCount; ++nIndex)
	{
		var oComplexField = arrComplexFields[nIndex];
		var oInstruction  = oComplexField.GetInstruction();
		if (oInstruction && fieldtype_PAGEREF === oInstruction.GetType() && oInstruction.IsHyperlink())
			return oComplexField;
	}

	return null;
};
/**
 * Получаем абсолютное значение первой не пустой страницы
 * @returns {number}
 */
Paragraph.prototype.GetFirstNonEmptyPageAbsolute = function()
{
	var nPagesCount = this.Pages.length;
	var nCurPage    = 0;

	while (this.IsEmptyPage(nCurPage, true))
	{
		if (nCurPage >= nPagesCount - 1)
			break;

		nCurPage++;
	}

	return this.Get_AbsolutePage(nCurPage);
};
/**
 * Удаляем все кроме первого таба в параграфе.
 * @returns {boolean} Был ли хоть один таб
 */
Paragraph.prototype.RemoveTabsForTOC = function()
{
	var isTab = false;
	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		if (this.Content[nIndex].RemoveTabsForTOC(isTab))
			isTab = true;
	}

	return isTab;
};
/**
 * Проверяем лежит ли данный параграф в таблице
 * @returns {boolean}
 */
Paragraph.prototype.IsTableCellContent = function()
{
	return (this.Parent && this.Parent.IsTableCellContent() ? true : false);
};
/**
 * Получаем элемент содержимого параграфа
 * @param nIndex
 * @returns {?CParagraphContentBase}
 */
Paragraph.prototype.GetElement = function(nIndex)
{
	if (nIndex < 0 || nIndex >= this.Content.length)
		return null;

	return this.Content[nIndex];
};
/**
 * Получаем количество элементов содержимого параграфа
 * @returns {Number}
 */
Paragraph.prototype.GetElementsCount = function()
{
	// TODO: (ParaEnd) Возвращаем -1, т.к. последний ParaRun используется только для знака конца параграфа
	return this.Content.length - 1;
};
/**
 * Проверяем произошло ли простое изменение параграфа, сейчас это только добавление/удаление комментариев.
 * (можно не в массиве).
 */
Paragraph.prototype.IsParagraphSimpleChanges = function(_Changes)
{
	var Changes = _Changes;
	if (!_Changes.length)
		Changes = [_Changes];

	var ChangesCount = Changes.length;
	for (var ChangesIndex = 0; ChangesIndex < ChangesCount; ChangesIndex++)
	{
		var Data = Changes[ChangesIndex].Data;
		if (!Data.IsParagraphSimpleChanges())
			return false;
	}

	return true;
};
/**
 * Получаем скомпилированные настройки символа конца параграфа
 * @returns {CTextPr}
 */
Paragraph.prototype.GetParaEndCompiledPr = function()
{
	var oLogicDocument = this.bFromDocument ? this.LogicDocument : null;

	var oTextPr = this.Get_CompiledPr2(false).TextPr.Copy();
	if (oLogicDocument && undefined !== this.TextPr.Value.RStyle)
	{
		var oStyles = oLogicDocument.GetStyles();
		if (this.TextPr.Value.RStyle !== oStyles.GetDefaultHyperlink())
		{
			var oStyleTextPr = oStyles.Get_Pr(this.TextPr.Value.RStyle, styletype_Character).TextPr;
			oTextPr.Merge(oStyleTextPr);
		}
	}

	oTextPr.Merge(this.TextPr.Value);
	return oTextPr;
};
Paragraph.prototype.GetLastParagraph = function()
{
	return this;
};
Paragraph.prototype.GetFirstParagraph = function()
{
	return this;
};
/**
 * @returns {CParaSpellChecker}
 */
Paragraph.prototype.GetSpellChecker = function()
{
	return this.SpellChecker;
};
/**
 * Получаем номер страницы, на которой расположена нумерация
 * @param {boolean} isAbsolute возвращаем абсолютный номер страницы или нет
 * @returns {number}
 */
Paragraph.prototype.GetNumberingPage = function(isAbsolute)
{
	if (!this.HaveNumbering())
		return 0;

	return isAbsolute ? this.GetAbsolutePage(this.Numbering.Page) : this.Numbering.Page;
};
/**
 * Получаем рассчитанное значение для нумерованного списка
 * @returns {number} -1 - либо списка нет у данного параграфа, либо данный параграф не был рассчитан
 */
Paragraph.prototype.GetNumberingCalculatedValue = function()
{
	return this.Numbering.GetCalculatedValue();
};
/**
 * Проверяем выделен ли сейчас какой-либо плейсхолдер, если да, то возвращаем управляющий объект
 * @param {CParagraphContentPos} [oContentPos=undefined] - Если не задан, то проверяем по текущему селекту и курсору
 * @returns {null | CInlineLevelSdt}
 */
Paragraph.prototype.GetPlaceHolderObject = function(oContentPos)
{
	var oInfo = new CSelectedElementsInfo();
	this.GetSelectedElementsInfo(oInfo, oContentPos, 0);

	var oSdt = oInfo.GetInlineLevelSdt();
	if (oSdt && oSdt.IsPlaceHolder())
		return oSdt;

	return null;
};
/**
 * Проверяем выделено ли сейчас какое-либо презентационное поле, если да, то возвращаем управляющий объект
 * @param {CParagraphContentPos} [oContentPos=undefined] - Если не задан, то проверяем по текущему селекту и курсору
 * @returns {null | AscCommonWord.CPresentationField}
 */
Paragraph.prototype.GetPresentationField = function(oContentPos)
{
	var oInfo = new CSelectedElementsInfo();
	this.GetSelectedElementsInfo(oInfo, oContentPos, 0);

	var oPresentationField = oInfo.GetPresentationField();
	if (oPresentationField)
		return oPresentationField;

	return null;
};
Paragraph.prototype.GetAllFields = function(isUseSelection, arrFields)
{
	if (!arrFields)
		arrFields = [];

	if (isUseSelection && true !== this.Selection.Use)
	{
		var arrParaFields = this.GetCurrentComplexFields();
		for (var nIndex = 0, nCount = arrParaFields.length; nIndex < nCount; ++nIndex)
		{
			arrFields.push(arrParaFields[nIndex]);
		}
		return arrFields;
	}

	var nStartPos = isUseSelection ?
		(this.Selection.StartPos < this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos)
		: 0;

	var nEndPos = isUseSelection ?
		(this.Selection.StartPos < this.Selection.EndPos ? this.Selection.EndPos : this.Selection.StartPos)
		: this.Content.length - 1;

	for (var nIndex = nStartPos; nIndex <= nEndPos; ++nIndex)
	{
		this.Content[nIndex].GetAllFields(isUseSelection, arrFields);
	}

	return arrFields;
};
/**
 * Используются ли уменьшенные по ширине пробелы между словами?
 * @returns {boolean}
 */
Paragraph.prototype.IsCondensedSpaces = function()
{
	if (this.bFromDocument && this.LogicDocument && this.LogicDocument.GetCompatibilityMode() >= document_compatibility_mode_Word15 && this.Get_CompiledPr2(false).ParaPr.Jc === align_Justify)
		return true;

	return false;
};
/**
 * Выделяем слово, около которого стоит курсор
 * @returns {boolean}
 */
Paragraph.prototype.SelectCurrentWord = function()
{
	if (this.Selection.Use)
		return false;

	var oLItem = this.GetPrevRunElement();
	var oRItem = this.GetNextRunElement();

	if (!oLItem && !oRItem)
		return false;

	var oStartPos = null;
	var oEndPos   = null;

	var oCurPos = this.Get_ParaContentPos(false, false);

	var oSearchSPos = new CParagraphSearchPos();
	var oSearchEPos = new CParagraphSearchPos();

	if (oRItem && oLItem && para_Text === oRItem.Type && para_Text === oLItem.Type)
	{
		if (oRItem.IsPunctuation() && !oLItem.IsPunctuation())
			oRItem = null;
		else if (!oRItem.IsPunctuation() && oLItem.IsPunctuation())
			oLItem = null;
	}

	if (!oRItem || para_Text !== oRItem.Type)
	{
		oEndPos = oCurPos;
	}
	else
	{
		oSearchEPos.SetTrimSpaces(true);
		this.Get_WordEndPos(oSearchEPos, oCurPos);

		if (true !== oSearchEPos.Found)
			return false;

		oEndPos = oSearchEPos.Pos;
	}

	if (!oLItem || para_Text !== oLItem.Type)
	{
		oStartPos = oCurPos;
	}
	else
	{
		this.Get_WordStartPos(oSearchSPos, oCurPos);

		if (true !== oSearchSPos.Found)
			return false;

		oStartPos = oSearchSPos.Pos;
	}

	if (!oStartPos || !oEndPos || 0 === oStartPos.Compare(oEndPos))
		return false;

	// Выставим временно селект от начала и до конца слова
	this.Selection.Use = true;
	this.Set_SelectionContentPos(oStartPos, oEndPos);
	this.Document_SetThisElementCurrent();

	return true;
};
/**
 * Добавляем метки переноса текста во время рецензирования
 * @param {boolean} isFrom
 * @param {boolean} isStart
 * @param {string} sMarkId
 */
Paragraph.prototype.AddTrackMoveMark = function(isFrom, isStart, sMarkId)
{
	if (!this.Selection.Use)
		return;

	var oStartContentPos = this.Get_ParaContentPos(true, true);
	var oEndContentPos   = this.Get_ParaContentPos(true, false);

	if (oStartContentPos.Compare(oEndContentPos) > 0)
	{
		var oTemp        = oStartContentPos;
		oStartContentPos = oEndContentPos;
		oEndContentPos   = oTemp;
	}

	var nStartPos = oStartContentPos.Get(0);
	var nEndPos   = oEndContentPos.Get(0);

	// TODO: Как только избавимся от ParaEnd, здесь надо будет переделать.
	if (this.Content.length - 1 === nEndPos && !isStart)
	{
		if (true === this.Selection_CheckParaEnd())
		{
			var oEndRun = this.GetParaEndRun();
			oEndRun.AddAfterParaEnd(new CRunRevisionMove(false, isFrom, sMarkId));
			return;
		}
		else
		{
			oEndContentPos = this.Get_EndPos(false);
			nEndPos        = oEndContentPos.Get(0);
		}
	}

	if (!isStart)
	{
		var oNewElementE = this.Content[nEndPos].Split(oEndContentPos, 1);
		if (oNewElementE)
		{
			this.AddToContent(nEndPos + 1, oNewElementE);
			oNewElementE.RemoveSelection();
		}

		this.AddToContent(nEndPos + 1, new CParaRevisionMove(false, isFrom, sMarkId));
	}

	if (isStart)
	{
		var nSelectionStartPos = this.Selection.StartPos;
		var nSelectionEndPos   = this.Selection.EndPos;

		var oNewElementS = this.Content[nStartPos].Split(oStartContentPos, 1);
		if (oNewElementS)
		{
			this.AddToContent(nStartPos + 1, oNewElementS);
			oNewElementS.SelectAll();
			this.Content[nStartPos].RemoveSelection();

			nSelectionStartPos++;
			nSelectionEndPos++;
			nStartPos++;
		}

		this.AddToContent(nStartPos, new CParaRevisionMove(true, isFrom, sMarkId));

		this.Selection.StartPos = nSelectionStartPos + 1;
		this.Selection.EndPos   = nSelectionEndPos + 1;
	}
};
/**
 * Удаляем из параграфа заданный элемент, если он тут есть
 * @param oElement
 */
Paragraph.prototype.RemoveElement = function(oElement)
{
	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		var oItem = this.Content[nPos];
		if (oItem === oElement)
		{
			this.Internal_Content_Remove(nPos);
			nPos--;
			nCount--;
		}
		else if (oItem.RemoveElement)
		{
			oItem.RemoveElement(oElement);
		}
	}
};
/**
 * Пробегаемся по все ранам с заданной функцией
 * @param fCheck - функция проверки содержимого рана
 * @returns {boolean}
 */
Paragraph.prototype.CheckRunContent = function(fCheck)
{
	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		if (this.Content[nPos].CheckRunContent(fCheck))
			return true;
	}

	return false;
};
/**
 * Обрабатываем сложные поля данного параграфа
 */
Paragraph.prototype.ProcessComplexFields = function()
{
	var oComplexFields = new CParagraphComplexFieldsInfo();
	oComplexFields.ResetPage(this, 0);

	for (var nPos = 0, nCount = this.Content.length; nPos < nCount; ++nPos)
	{
		this.Content[nPos].ProcessComplexFields(oComplexFields);
	}
};
Paragraph.prototype.GetStartPageForRecalculate = function(nPageAbs)
{
	var nPagesCount = this.GetPagesCount();
	var nCurPage    = -1;
	for (var nPageIndex = 0; nPageIndex < nPagesCount; ++nPageIndex)
	{
		var nTempPageAbs = this.GetAbsolutePage(nPageIndex);
		if (nTempPageAbs === nPageAbs)
		{
			nCurPage = nPageIndex;
			break;
		}
	}

	if (-1 === nCurPage)
		return nPageAbs;

	// Если на заданной странице 2 строки и меньше, значит расчет следует начать с предыдущей страницы
	while (this.Pages[nCurPage].EndLine - this.Pages[nCurPage].StartLine <= 1)
	{
		if (0 === nCurPage)
			break;

		nCurPage--;
	}

	return this.GetAbsolutePage(nCurPage);
};
/**
 * Проверяем попадание в селект метки переноса
 * @param isStart {boolean}
 * @param [isCheckTo=true] {boolean} проверять ли перенесенный текст или удаленный
 * @returns {string | null}
 */
Paragraph.prototype.CheckTrackMoveMarkInSelection = function(isStart, isCheckTo)
{
	if (undefined === isCheckTo)
		isCheckTo = true;

	if (!this.IsSelectionUse())
		return null;

	function private_CheckMarkDirection(oMark)
	{
		return ((isCheckTo && !oMark.IsFrom()) || (!isCheckTo && oMark.IsFrom()));
	}

	var nStartPos = this.Selection.StartPos < this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos;
	var nEndPos   = this.Selection.StartPos < this.Selection.EndPos ? this.Selection.EndPos : this.Selection.StartPos;

	if (isStart)
	{
		if (para_RevisionMove === this.Content[nStartPos].GetType())
		{
			if (private_CheckMarkDirection(this.Content[nStartPos]) && this.Content[nStartPos].IsStart())
				return this.Content[nStartPos].GetMarkId();
			else
				return null;
		}

		var nPos = nStartPos;
		while (this.Content[nPos].IsSelectionEmpty())
		{
			nPos++;

			if (nPos > nEndPos)
				break;

			if (para_RevisionMove === this.Content[nPos].GetType())
			{
				if (private_CheckMarkDirection(this.Content[nPos]) && this.Content[nPos].IsStart())
					return this.Content[nPos].GetMarkId();
				else
					return null;
			}
		}


		if (this.Content[nStartPos].IsSelectedFromStart())
		{
			nPos = nStartPos - 1;
			while (nPos >= 0 && para_RevisionMove !== this.Content[nPos].GetType() && this.Content[nPos].IsEmpty())
			{
				nPos--;
			}

			if (nPos < 0)
			{
				var oPrevElement = this.Get_DocumentPrev();
				if (oPrevElement && oPrevElement.IsParagraph())
				{
					var oLastRun = oPrevElement.GetParaEndRun();
					var oMark    = oLastRun.GetLastTrackMoveMark();
					if (oMark && private_CheckMarkDirection(oMark) && oMark.IsStart())
						return oMark.GetMarkId();
				}
			}
			else if (para_RevisionMove === this.Content[nPos].GetType() && private_CheckMarkDirection(this.Content[nPos]) && this.Content[nPos].IsStart())
			{
				return this.Content[nPos].GetMarkId();
			}
		}
	}
	else
	{
		if (para_RevisionMove === this.Content[nEndPos].GetType())
		{
			if (private_CheckMarkDirection(this.Content[nEndPos]) && !this.Content[nEndPos].IsStart())
				return this.Content[nEndPos].GetMarkId();
			else
				return null;
		}

		var nPos = nEndPos;
		while (this.Content[nPos].IsSelectionEmpty())
		{
			nPos--;

			if (nPos < nStartPos)
				break;

			if (para_RevisionMove === this.Content[nPos].GetType())
			{
				if (private_CheckMarkDirection(this.Content[nPos]) && !this.Content[nPos].IsStart())
					return this.Content[nPos].GetMarkId();
				else
					return null;
			}
		}

		if (this.Content[nEndPos].IsSelectedToEnd())
		{
			nPos = nEndPos + 1;
			while (nPos < this.Content.length && para_RevisionMove !== this.Content[nPos].GetType() && this.Content[nPos].IsEmpty())
			{
				nPos++;
			}

			if (nPos < this.Content.length && para_RevisionMove === this.Content[nPos].GetType() && private_CheckMarkDirection(this.Content[nPos]) && !this.Content[nPos].IsStart())
			{
				return this.Content[nPos].GetMarkId();
			}
			else if (this.Selection_CheckParaEnd())
			{
				var oLastRun = this.GetParaEndRun();
				var oMark    = oLastRun.GetLastTrackMoveMark();
				if (oMark && private_CheckMarkDirection(oMark) && !oMark.IsStart())
					return oMark.GetMarkId();
			}
		}
	}

	return null;
};
/**
 * Очищаем содержимое параграфа, оставляем в нем ровно 1 пустой параграф
 */
Paragraph.prototype.MakeSingleRunParagraph = function()
{
	if (this.Content.length <= 1)
	{
		this.AddToContent(0, new ParaRun(this, false), true);
	}
	else if (this.Content.length > 2 || para_Run !== this.Content[0].Type)
	{
		this.RemoveFromContent(0, this.Content.length - 1, true);
		this.AddToContent(0, new ParaRun(this, false), true);
	}

	var oRun = this.Content[0];
	oRun.ClearContent();
	return oRun;
};
Paragraph.prototype.Document_Is_SelectionLocked = function(CheckType)
{
	var oState = null;
	if (this.IsApplyToAll())
	{
		oState = this.SaveSelectionState();
		this.SelectAll();
	}

	var isSelectionUse = this.IsSelectionUse();
	var arrContentControls = this.GetSelectedContentControls();
	for (var nIndex = 0, nCount = arrContentControls.length; nIndex < nCount; ++nIndex)
	{
		if (arrContentControls[nIndex].IsSelectionUse() === isSelectionUse)
			arrContentControls[nIndex].Document_Is_SelectionLocked(CheckType);
	}

	// Проверка для специального случая, когда мы переносим текст из параграфа в него самого. В такой ситуации надо
	// проверять не только выделенную часть, но и место куда происходит вставка/перенос.
	if (this.NearPosArray.length > 0)
	{
		var ParaState = this.GetSelectionState();
		this.RemoveSelection();
		this.Set_ParaContentPos(this.NearPosArray[0].NearPos.ContentPos, true, -1, -1);
		arrContentControls = this.GetSelectedContentControls();

		for (var nIndex = 0, nCount = arrContentControls.length; nIndex < nCount; ++nIndex)
		{
			if (false === arrContentControls[nIndex].IsSelectionUse())
				arrContentControls[nIndex].Document_Is_SelectionLocked(CheckType);
		}

		this.SetSelectionState(ParaState, 0);
	}

	var bCheckContentControl = false;
	switch ( CheckType )
	{
		case AscCommon.changestype_Paragraph_Content:
		case AscCommon.changestype_Paragraph_Properties:
		case AscCommon.changestype_Paragraph_AddText:
		case AscCommon.changestype_Paragraph_TextProperties:
		case AscCommon.changestype_ContentControl_Add:
		case AscCommon.changestype_Document_Content:
		case AscCommon.changestype_Document_Content_Add:
		case AscCommon.changestype_Image_Properties:
		{
			this.Lock.Check( this.Get_Id() );
			bCheckContentControl = true;
			break;
		}
		case AscCommon.changestype_Remove:
		{
			// Если у нас нет выделения, и курсор стоит в начале, мы должны проверить в том же порядке, в каком
			// идут проверки при удалении в команде Internal_Remove_Backward.
			if ( true != this.Selection.Use && true == this.IsCursorAtBegin() )
			{
				var Pr = this.Get_CompiledPr2(false).ParaPr;
				if ( undefined != this.GetNumPr() || Math.abs(Pr.Ind.FirstLine) > 0.001 || Math.abs(Pr.Ind.Left) > 0.001 )
				{
					// Надо проверить только текущий параграф, а это будет сделано далее
				}
				else
				{
					var Prev = this.Get_DocumentPrev();
					if ( null != Prev && type_Paragraph === Prev.GetType() )
						Prev.Lock.Check( Prev.Get_Id() );
				}
			}
			// Если есть выделение, и знак параграфа попал в выделение ( и параграф выделен не целиком )
			else if ( true === this.Selection.Use )
			{
				var StartPos = this.Selection.StartPos;
				var EndPos   = this.Selection.EndPos;

				if ( StartPos > EndPos )
				{
					var Temp = EndPos;
					EndPos   = StartPos;
					StartPos = Temp;
				}

				if ( EndPos >= this.Content.length - 1 && StartPos > this.Internal_GetStartPos() )
				{
					var Next = this.Get_DocumentNext();
					if ( null != Next && type_Paragraph === Next.GetType() )
						Next.Lock.Check( Next.Get_Id() );
				}
			}

			this.Lock.Check( this.Get_Id() );
			bCheckContentControl = true;
			break;
		}
		case AscCommon.changestype_Delete:
		{
			// Если у нас нет выделения, и курсор стоит в конце, мы должны проверить следующий элемент
			if ( true != this.Selection.Use && true === this.IsCursorAtEnd() )
			{
				var Next = this.Get_DocumentNext();
				if ( null != Next && type_Paragraph === Next.GetType() )
					Next.Lock.Check( Next.Get_Id() );
			}
			// Если есть выделение, и знак параграфа попал в выделение и параграф выделен не целиком
			else if ( true === this.Selection.Use )
			{
				var StartPos = this.Selection.StartPos;
				var EndPos   = this.Selection.EndPos;

				if ( StartPos > EndPos )
				{
					var Temp = EndPos;
					EndPos   = StartPos;
					StartPos = Temp;
				}

				if ( EndPos >= this.Content.length - 1 && StartPos > this.Internal_GetStartPos() )
				{
					var Next = this.Get_DocumentNext();
					if ( null != Next && type_Paragraph === Next.GetType() )
						Next.Lock.Check( Next.Get_Id() );
				}
			}

			this.Lock.Check( this.Get_Id() );
			bCheckContentControl = true;
			break;
		}
		case AscCommon.changestype_Document_SectPr:
		case AscCommon.changestype_Table_Properties:
		case AscCommon.changestype_Table_RemoveCells:
		{
			AscCommon.CollaborativeEditing.Add_CheckLock(true);
			break;
		}
	}

	if (oState)
		this.LoadSelectionState(oState);

	if (bCheckContentControl && this.Parent && this.Parent.CheckContentControlEditingLock)
		this.Parent.CheckContentControlEditingLock();
};
/**
 * Получаем NearestPos по текущей позиции
 * @return {NearestPos}
 */
Paragraph.prototype.GetCurrentAnchorPosition = function()
{
	var oNearPos = {
		Paragraph  : this,
		ContentPos : this.Get_ParaContentPos(false, false),
		transform  : this.Get_ParentTextTransform()
	};

	this.Check_NearestPos(oNearPos);
	return oNearPos;
};
/**
 * Сохраняем состояние селекта
 * @returns {CParagraphSelectionState}
 */
Paragraph.prototype.SaveSelectionState = function()
{
	var oState = new CParagraphSelectionState();

	oState.Selection.Use           = this.Selection.Use;
	oState.Selection.Start         = this.Selection.Start;
	oState.Selection.Flag          = this.Selection.Flag;
	oState.Selection.StartManually = this.Selection.StartManually;
	oState.Selection.EndManually   = this.Selection.EndManually;

	oState.CurPos.X          = this.CurPos.X;
	oState.CurPos.Y          = this.CurPos.Y;
	oState.CurPos.ContentPos = this.CurPos.ContentPos;
	oState.CurPos.Line       = this.CurPos.Line;
	oState.CurPos.Range      = this.CurPos.Range;
	oState.CurPos.RealX      = this.CurPos.RealX;
	oState.CurPos.RealY      = this.CurPos.RealY;
	oState.CurPos.PagesPos   = this.CurPos.PagesPos;

	oState.ContentPos = this.Get_ParaContentPos(false, false, false);
	oState.StartPos   = this.Get_ParaContentPos(true, true, false);
	oState.EndPos     = this.Get_ParaContentPos(true, false, false);

	return oState;
};
/**
 * Загружаем состояние селекта
 * @param {CParagraphSelectionState} oState
 */
Paragraph.prototype.LoadSelectionState = function(oState)
{
	this.RemoveSelection();

	this.Set_ParaContentPos(oState.ContentPos, false, -1, -1, false);

	if (oState.Selection.Use)
		this.Set_SelectionContentPos(oState.StartPos, oState.EndPos, false);

	this.Selection.Use           = oState.Selection.Use;
	this.Selection.Start         = oState.Selection.Start;
	this.Selection.Flag          = oState.Selection.Flag;
	this.Selection.StartManually = oState.Selection.StartManually;
	this.Selection.EndManually   = oState.Selection.EndManually;

	this.CurPos.X          = oState.CurPos.X;
	this.CurPos.Y          = oState.CurPos.Y;
	this.CurPos.ContentPos = oState.CurPos.ContentPos;
	this.CurPos.Line       = oState.CurPos.Line;
	this.CurPos.Range      = oState.CurPos.Range;
	this.CurPos.RealX      = oState.CurPos.RealX;
	this.CurPos.RealY      = oState.CurPos.RealY;
	this.CurPos.PagesPos   = oState.CurPos.PagesPos;
};


var pararecalc_0_All  = 0;
var pararecalc_0_None = 1;

var pararecalc_0_Spell_All  = 0;
var pararecalc_0_Spell_Pos  = 1;
var pararecalc_0_Spell_Lang = 2;
var pararecalc_0_Spell_None = 3;

function CParaRecalcInfo()
{
    this.Recalc_0_Type = pararecalc_0_All;
    this.Recalc_0_Spell =
    {
        Type      : pararecalc_0_All,
        StartPos  : 0,
        EndPos    : 0
    };
}

CParaRecalcInfo.prototype =
{
    Set_Type_0 : function(Type)
    {
        this.Recalc_0_Type = Type;
    },

    Set_Type_0_Spell : function(Type, StartPos, EndPos)
    {
        if ( pararecalc_0_Spell_All === this.Recalc_0_Spell.Type )
            return;
        else if ( pararecalc_0_Spell_None === this.Recalc_0_Spell.Type || pararecalc_0_Spell_Lang === this.Recalc_0_Spell.Type )
        {
            this.Recalc_0_Spell.Type = Type;
            if ( pararecalc_0_Spell_Pos === Type )
            {
                this.Recalc_0_Spell.StartPos = StartPos;
                this.Recalc_0_Spell.EndPos   = EndPos;
            }
        }
        else if ( pararecalc_0_Spell_Pos === this.Recalc_0_Spell.Type )
        {
            if ( pararecalc_0_Spell_All === Type )
                this.Recalc_0_Spell.Type = Type;
            else if ( pararecalc_0_Spell_Pos === Type )
            {
                this.Recalc_0_Spell.StartPos = Math.min( StartPos, this.Recalc_0_Spell.StartPos );
                this.Recalc_0_Spell.EndPos   = Math.max( EndPos,   this.Recalc_0_Spell.EndPos   );
            }
        }
    },

    Update_Spell_OnChange : function(Pos, Count, bAdd)
    {
        if ( pararecalc_0_Spell_Pos === this.Recalc_0_Spell.Type )
        {
            if ( true === bAdd )
            {
                if ( this.Recalc_0_Spell.StartPos > Pos )
                    this.Recalc_0_Spell.StartPos++;

                if ( this.Recalc_0_Spell.EndPos >= Pos )
                    this.Recalc_0_Spell.EndPos++;
            }
            else
            {
                if ( this.Recalc_0_Spell.StartPos > Pos )
                {
                    if ( this.Recalc_0_Spell.StartPos > Pos + Count )
                        this.Recalc_0_Spell.StartPos -= Count;
                    else
                        this.Recalc_0_Spell.StartPos = Pos;
                }

                if ( this.Recalc_0_Spell.EndPos >= Pos )
                {
                    if ( this.Recalc_0_Spell.EndPos >= Pos + Count )
                        this.Recalc_0_Spell.EndPos -= Count;
                    else
                        this.Recalc_0_Spell.EndPos = Math.max( 0, Pos - 1 );
                }
            }
        }
    }
};

function CDocumentBounds(Left, Top, Right, Bottom)
{
    this.Bottom = Bottom;
    this.Left   = Left;
    this.Right  = Right;
    this.Top    = Top;
}

CDocumentBounds.prototype.CopyFrom = function(Bounds)
{
    if (!Bounds)
        return;

    this.Bottom = Bounds.Bottom;
    this.Left   = Bounds.Left;
    this.Right  = Bounds.Right;
    this.Top    = Bounds.Top;
};
CDocumentBounds.prototype.Shift = function(Dx, Dy)
{
    this.Bottom += Dy;
    this.Top    += Dy;
    this.Left   += Dx;
    this.Right  += Dx;
};
CDocumentBounds.prototype.Compare = function(Other)
{
    if (Math.abs(Other.Bottom - this.Bottom) > 0.001 || Math.abs(Other.Top - this.Top) > 0.001 || Math.abs(Other.Left - this.Left) > 0.001 || Math.abs(Other.Right - this.Right))
        return false;

    return true;
};
CDocumentBounds.prototype.Reset = function()
{
    this.Bottom = 0;
    this.Left   = 0;
    this.Right  = 0;
    this.Top    = 0;
};
CDocumentBounds.prototype.Copy = function()
{
	return new CDocumentBounds(this.Left, this.Top, this.Right, this.Bottom);
};

function CParagraphPageEndInfo()
{
    this.Comments      = []; // Массив незакрытых комментариев на данной странице
	this.ComplexFields = []; // Массив незакрытых полей на данной странице

    this.RunRecalcInfo = null;
}
CParagraphPageEndInfo.prototype.Copy = function()
{
	var oInfo = new CParagraphPageEndInfo();

	for (var nIndex = 0, nCount = this.Comments.length; nIndex < nCount; ++nIndex)
	{
		oInfo.Comments.push(this.Comments[nIndex]);
	}

	for (var nIndex = 0, nCount = this.ComplexFields.length; nIndex < nCount; ++nIndex)
	{
		if (this.ComplexFields[nIndex].ComplexField.IsUse())
			oInfo.ComplexFields.push(this.ComplexFields[nIndex].Copy());
	}

	return oInfo;
};
CParagraphPageEndInfo.prototype.SetFromPRSI = function(PRSI)
{
	this.Comments      = PRSI.Comments;
	this.ComplexFields = PRSI.ComplexFields;
};
CParagraphPageEndInfo.prototype.GetComplexFields = function()
{
	var arrComplexFields = [];
	for (var nIndex = 0, nCount = this.ComplexFields.length; nIndex < nCount; ++nIndex)
	{
		arrComplexFields[nIndex] = this.ComplexFields[nIndex].Copy();
	}
	return arrComplexFields;
};

function CParaPos(Range, Line, Page, Pos)
{
    this.Range = Range; // Номер промежутка в строке
    this.Line  = Line;  // Номер строки
    this.Page  = Page;  // Номер страницы
    this.Pos   = Pos;   // Позиция в общем массиве
}


// используется в Internal_Draw_3 и Internal_Draw_5
function CParaDrawingRangeLinesElement(y0, y1, x0, x1, w, r, g, b, Additional, Additional2)
{
    this.y0 = y0;
    this.y1 = y1;
    this.x0 = x0;
    this.x1 = x1;
    this.w  = w;
    this.r  = r;
    this.g  = g;
    this.b  = b;

    this.Additional = Additional;
    this.Additional2 = Additional2;
}


function CParaDrawingRangeLines()
{
    this.Elements = [];
}

CParaDrawingRangeLines.prototype =
{
    Clear : function()
    {
        this.Elements = [];
    },

    Add : function (y0, y1, x0, x1, w, r, g, b, Additional, Additional2)
    {
        this.Elements.push( new CParaDrawingRangeLinesElement(y0, y1, x0, x1, w, r, g, b, Additional, Additional2) );
    },

    Get_Next : function()
    {
        var Count = this.Elements.length;
        if ( Count <= 0 )
            return null;

        // Соединяем, начиная с конца, чтобы проще было обрезать массив
        var Element = this.Elements[Count - 1];
        Count--;

        while ( Count > 0 )
        {
            var PrevEl = this.Elements[Count - 1];

            if (this.private_CanUnionElements(PrevEl, Element))
            {
                Element.x0 = PrevEl.x0;
                Count--;
            }
            else
                break;
        }

        this.Elements.length = Count;

        return Element;
    },

    Get_NextForward : function()
    {
        var Count = this.Elements.length;
        if (Count <= 0)
            return null;

        var Element = this.Elements[0];
        var Pos = 1;

        while (Pos < Count)
        {
            var NextEl = this.Elements[Pos];

            if (this.private_CanUnionElements(NextEl, Element))
            {
                Element.x1 = NextEl.x1;
                Pos++;
            }
            else
                break;
        }

        this.Elements.splice(0, Pos);
        return Element;
    },

    private_CanUnionElements : function(PrevEl, Element)
	{
		if (Math.abs(PrevEl.y0 - Element.y0) < 0.001
			&& Math.abs(PrevEl.y1 - Element.y1) < 0.001
			&& Math.abs(PrevEl.x1 - Element.x0) < 0.001
			&& Math.abs(PrevEl.w - Element.w) < 0.001
			&& PrevEl.r === Element.r
			&& PrevEl.g === Element.g
			&& PrevEl.b === Element.b)
		{
			if (undefined === PrevEl.Additional && undefined === Element.Additional)
				return true;

			if (undefined === PrevEl.Additional || undefined === Element.Additional)
				return false;

			if (undefined !== PrevEl.Additional.Active && PrevEl.Additional.Active === Element.Additional.Active)
			{
				if (!PrevEl.Additional.CommentId
					|| !Element.Additional.CommentId
					|| PrevEl.Additional.CommentId.length !== Element.Additional.CommentId.length)
					return false;

				for (var nIndex = 0, nCount = PrevEl.Additional.CommentId.length; nIndex < nCount; ++nIndex)
				{
					if (PrevEl.Additional.CommentId[nIndex] !== Element.Additional.CommentId[nIndex])
						return false;
				}

				return true;
			}
			else if (undefined !== PrevEl.Additional.RunPr && true === Element.Additional.RunPr.Is_Equal(PrevEl.Additional.RunPr))
			{
				return true;
			}

			return false;
		}

		return false;
	},

    Correct_w_ForUnderline : function()
    {
        var Count = this.Elements.length;
        if ( Count <= 0 )
            return;

        var CurElements = [];
        for ( var Index = 0; Index < Count; Index++ )
        {
            var Element = this.Elements[Index];
            var CurCount = CurElements.length;

            if ( 0 === CurCount )
                CurElements.push( Element );
            else
            {
                var PrevEl = CurElements[CurCount - 1];

                if ( Math.abs( PrevEl.y0 - Element.y0 ) < 0.001 && Math.abs( PrevEl.y1 - Element.y1 ) < 0.001 && Math.abs( PrevEl.x1 - Element.x0 ) < 0.001 )
                {
                    // Сравниваем толщины линий
                    if ( Element.w > PrevEl.w )
                    {
                        for ( var Index2 = 0; Index2 < CurCount; Index2++ )
                            CurElements[Index2].w = Element.w;
                    }
                    else
                        Element.w = PrevEl.w;

                    CurElements.push( Element );
                }
                else
                {
                    CurElements.length = 0;
                    CurElements.push( Element );
                }
            }
        }
    }
};

function CParagraphCurPos()
{
	this.X           = 0;
	this.Y           = 0;
	this.ContentPos  = 0;  // Ближайшая позиция в контенте (между элементами)
	this.Line        = -1;
	this.Range       = -1;
	this.RealX       = 0;  // позиция курсора, без учета расположения букв
	this.RealY       = 0;  // это актуально для клавиш вверх и вниз
	this.PagesPos    = 0;  // позиция в массиве this.Pages
}

function CParagraphSelection()
{
    this.Start     = false;
    this.Use       = false;
    this.StartPos  = 0;
    this.EndPos    = 0;
    this.Flag      = selectionflag_Common;
    
    this.StartManually = true; // true - через Selection_SetStart, false - через Selection_SetBegEnd
    this.EndManually   = true; // true - через Selection_SetEnd, афдыу - через Selection_SetBegEnd  
}

CParagraphSelection.prototype =
{
    Set_StartPos : function(Pos1, Pos2)
    {
        this.StartPos  = Pos1;
    },

    Set_EndPos : function(Pos1, Pos2)
    {
        this.EndPos  = Pos1;
    }
};

function CParagraphContentPos()
{
    this.Data  = [0, 0, 0];
    this.Depth = 0;
    this.bPlaceholder = false;
}

CParagraphContentPos.prototype =
{
    Add : function (Pos)
    {
        this.Data[this.Depth] = Pos;
        this.Depth++;
    },

    Update : function(Pos, Depth)
    {
        this.Data[Depth] = Pos;
        this.Depth = Depth + 1;
    },

    Update2 : function(Pos, Depth)
    {
        this.Data[Depth] = Pos;
    },

    Set : function(OtherPos)
    {
        // Копируем позицию
        var Len = OtherPos.Depth;
        for ( var Pos = 0; Pos < Len; Pos++ )
            this.Data[Pos] = OtherPos.Data[Pos];

        this.Depth = OtherPos.Depth;

        if ( this.Data.length > this.Depth )
            this.Data.length = this.Depth;
    },

    Get : function(Depth)
    {
        return this.Data[Depth];
    },

    Get_Depth : function()
    {
        return this.Depth - 1;
    },

    Decrease_Depth : function(nCount)
    {
        this.Depth = Math.max(0, this.Depth - nCount);
    },

    Copy : function ()
    {
        var PRPos = new CParagraphContentPos();

        var Count = this.Data.length;
        for (var Index = 0; Index < Count; Index++)
        {
            PRPos.Add( this.Data[Index] );
        }

        PRPos.Depth = this.Depth;

        return PRPos;
    },

    Copy_FromDepth : function(ContentPos, Depth)
    {
        var Count = ContentPos.Data.length;
        for (var CurDepth = Depth; CurDepth < Count; CurDepth++)
        {
            this.Update2(ContentPos.Data[CurDepth], CurDepth);
        }

        this.Depth = ContentPos.Depth;
    },

    /**
     * Сравниваем текущую позицию с заданной.
     * @param {CParagraphContentPos} Pos
     * @returns {number} 0 - позиции совпадают, 1 - текущая позиция дальше заданной, -1 - текущая позиция до заданной.
     */
    Compare : function(Pos)
    {
        var CurDepth = 0;

        var Len1 = this.Data.length;
        var Len2 = Pos.Data.length;
        var LenMin = Math.min( Len1, Len2 );

        while ( CurDepth < LenMin )
        {
            if ( this.Data[CurDepth] === Pos.Data[CurDepth] )
            {
                // Если попали в один и тот же элемент, тогда проверяем далее
                CurDepth++;
                continue;
            }
            else if ( this.Data[CurDepth] > Pos.Data[CurDepth] )
                return 1;
            else //if ( this.Data[CurDepth] < Pos.Data[CurDepth] )
                return -1;
        }

        // Такого не должно быть, но на всякий случай пошлем, что позиции не совпадают
        if ( Len1 !== Len2 )
            return -1;

        return 0;
    }
};
/**
 * Получаем текущую глубину позиции
 * @returns {number}
 */
CParagraphContentPos.prototype.GetDepth = function()
{
	return this.Depth - 1;
};
/**
 * Получаем позицию NerestPos
 * @param oParagraph
 */
CParagraphContentPos.prototype.ToAnchorPos = function(oParagraph)
{
	if (!oParagraph)
		return;

	var oNearPos = {
		Paragraph  : oParagraph,
		ContentPos : this,
		transform  : oParagraph.Get_ParentTextTransform()
	};

	oParagraph.Check_NearestPos(oNearPos);
	return oNearPos;
};
/**
 * В данной функции мы устанавливаем глубину позиции (при этом не меняя сам массив позиции)
 * @param {number} nDepth
 */
CParagraphContentPos.prototype.SetDepth = function(nDepth)
{
	this.Depth = Math.max(0, Math.min(nDepth + 1, this.Data.length - 1));
};

function CComplexFieldStatePos(oComplexField, isFieldCode)
{
	this.FieldCode    = undefined !== isFieldCode ? isFieldCode : true;
	this.ComplexField = oComplexField ? oComplexField : null;
}
CComplexFieldStatePos.prototype.Copy = function()
{
	return new CComplexFieldStatePos(this.ComplexField, this.FieldCode);
};
CComplexFieldStatePos.prototype.SetFieldCode = function(isFieldCode)
{
	this.FieldCode = isFieldCode;
};
CComplexFieldStatePos.prototype.IsFieldCode = function()
{
	return this.FieldCode;
};

function CParagraphComplexFieldsInfo()
{
	// Массив CComplexFieldStatePos
	this.CF = [];

	this.isHidden = null;

	this.StoredState = null;
}
CParagraphComplexFieldsInfo.prototype.ResetPage = function(Paragraph, CurPage)
{
	this.isHidden = null;

	var PageEndInfo = Paragraph.GetEndInfoByPage(CurPage - 1);

	if (PageEndInfo)
		this.CF = PageEndInfo.GetComplexFields();
	else
		this.CF = [];
};
/**
 * Находимся ли мы внутри содержимого скрытого поля
 * @returns {boolean}
 */
CParagraphComplexFieldsInfo.prototype.IsHiddenFieldContent = function()
{
	if (null === this.isHidden)
		this.isHidden = this.private_IsHiddenFieldContent();

	return this.isHidden;
};
CParagraphComplexFieldsInfo.prototype.private_IsHiddenFieldContent = function()
{
	if (this.CF.length > 0)
	{
		for (var nIndex = 0, nCount = this.CF.length; nIndex < nCount; ++nIndex)
		{
			if (this.CF[nIndex].ComplexField.IsHidden())
				return true;
		}
	}

	return false;
};
/**
 * Данная функция используется при пересчете, когда мы собираем сложное поле.
 * @param oChar
 */
CParagraphComplexFieldsInfo.prototype.ProcessFieldCharAndCollectComplexField = function(oChar)
{
	this.isHidden = null;

	if (oChar.IsBegin())
	{
		var oComplexField = oChar.GetComplexField();
		if (!oComplexField)
		{
			oChar.SetUse(false);
		}
		else
		{
			oChar.SetUse(true);
			oComplexField.SetBeginChar(oChar);
			this.CF.push(new CComplexFieldStatePos(oComplexField, true));
		}
	}
	else if (oChar.IsEnd())
	{
		if (this.CF.length > 0)
		{
			oChar.SetUse(true);
			var oComplexField = this.CF[this.CF.length - 1].ComplexField;
			oComplexField.SetEndChar(oChar);
			this.CF.splice(this.CF.length - 1, 1);

			if (this.CF.length > 0 && this.CF[this.CF.length - 1].IsFieldCode())
				this.CF[this.CF.length - 1].ComplexField.SetInstructionCF(oComplexField);
		}
		else
		{
			oChar.SetUse(false);
		}
	}
	else if (oChar.IsSeparate())
	{
		if (this.CF.length > 0)
		{
			oChar.SetUse(true);
			var oComplexField = this.CF[this.CF.length - 1].ComplexField;
			oComplexField.SetSeparateChar(oChar);
			this.CF[this.CF.length - 1].SetFieldCode(false);
		}
		else
		{
			oChar.SetUse(false);
		}
	}
};
/**
 * Данная функция используется, когда мы просто хотим отследить где мы находимся, относительно сложных полей
 * @param oChar
 */
CParagraphComplexFieldsInfo.prototype.ProcessFieldChar = function(oChar)
{
	this.isHidden = null;

	if (!oChar || !oChar.IsUse())
		return;

	var oComplexField = oChar.GetComplexField();

	if (oChar.IsBegin())
	{
		this.CF.push(new CComplexFieldStatePos(oComplexField, true));
	}
	else if (oChar.IsSeparate())
	{
		if (this.CF.length > 0)
		{
			this.CF[this.CF.length - 1].SetFieldCode(false);
		}
	}
	else if (oChar.IsEnd())
	{
		if (this.CF.length > 0)
		{
			this.CF.splice(this.CF.length - 1, 1);
		}
	}
};
CParagraphComplexFieldsInfo.prototype.ProcessInstruction = function(oInstruction)
{
	if (this.CF.length <= 0)
		return;

	var oComplexField = this.CF[this.CF.length - 1].ComplexField;
	if (oComplexField && null === oComplexField.GetSeparateChar())
		oComplexField.SetInstruction(oInstruction);
};
CParagraphComplexFieldsInfo.prototype.IsComplexField = function()
{
	return (this.CF.length > 0 ? true : false);
};
CParagraphComplexFieldsInfo.prototype.IsComplexFieldCode = function()
{
	if (!this.IsComplexField())
		return false;

	for (var nIndex = 0, nCount = this.CF.length; nIndex < nCount; ++nIndex)
	{
		if (this.CF[nIndex].IsFieldCode())
			return true;
	}

	return false;
};
CParagraphComplexFieldsInfo.prototype.IsCurrentComplexField = function()
{
	for (var nIndex = 0, nCount = this.CF.length; nIndex < nCount; ++nIndex)
	{
		if (this.CF[nIndex].ComplexField.IsCurrent())
			return true;
	}

	return false;
};
CParagraphComplexFieldsInfo.prototype.IsHyperlinkField = function()
{
	var isHaveHyperlink = false,
		isOtherField    = false;

	for (var nIndex = 0, nCount = this.CF.length; nIndex < nCount; ++nIndex)
	{
		var oInstruction = this.CF[nIndex].ComplexField.GetInstruction();
		if (oInstruction && fieldtype_HYPERLINK === oInstruction.GetType())
			isHaveHyperlink = true;
		else
			isOtherField = true;

	}

	return (isHaveHyperlink && !isOtherField ? true : false);
};
CParagraphComplexFieldsInfo.prototype.PushState = function()
{
	this.StoredState = {
		Hidden : this.isHidden,
		CF     : []
	};

	for (var nIndex = 0, nCount = this.CF.length; nIndex < nCount; ++nIndex)
	{
		this.StoredState.CF[nIndex] = this.CF[nIndex].Copy();
	}
};
CParagraphComplexFieldsInfo.prototype.PopState = function()
{
	if (this.StoredState)
	{
		this.isHidden    = this.StoredState.Hidden;
		this.CF          = this.StoredState.CF;
		this.StoredState = null;
	}
};

function CParagraphDrawStateHighlights()
{
    this.Page   = 0;
    this.Line   = 0;
    this.Range  = 0;

    this.CurPos = new CParagraphContentPos();

    this.DrawColl     = false;
    this.DrawMMFields = false;

    this.High     = new CParaDrawingRangeLines();
    this.Coll     = new CParaDrawingRangeLines();
    this.Find     = new CParaDrawingRangeLines();
    this.Comm     = new CParaDrawingRangeLines();
    this.Shd      = new CParaDrawingRangeLines();
    this.MMFields = new CParaDrawingRangeLines();
    this.CFields  = new CParaDrawingRangeLines();

	this.DrawComments       = true;
	this.DrawSolvedComments = true;
	this.Comments           = [];
	this.CommentsFlag       = AscCommon.comments_NoComment;

    this.SearchCounter = 0;

    this.Paragraph = undefined;
    this.Graphics  = undefined;

    this.X  = 0;
    this.Y0 = 0;
    this.Y1 = 0;

    this.Spaces = 0;

    this.InlineSdt = [];

    this.ComplexFields = new CParagraphComplexFieldsInfo();
}
CParagraphDrawStateHighlights.prototype.Reset = function(Paragraph, Graphics, DrawColl, DrawFind, DrawComments, DrawMMFields, PageEndInfo, DrawSolvedComments)
{
	this.Paragraph = Paragraph;
	this.Graphics  = Graphics;

	this.DrawColl     = DrawColl;
	this.DrawFind     = DrawFind;
	this.DrawMMFields = DrawMMFields;

	this.CurPos = new CParagraphContentPos();

	this.SearchCounter = 0;

	this.DrawComments       = DrawComments;
	this.DrawSolvedComments = DrawSolvedComments;

	this.Comments = [];
	if (null !== PageEndInfo)
	{
		for (var nIndex = 0, nCount = PageEndInfo.Comments.length; nIndex < nCount; ++nIndex)
		{
			this.AddComment(PageEndInfo.Comments[nIndex]);
		}
	}

	this.Check_CommentsFlag();
};
CParagraphDrawStateHighlights.prototype.Reset_Range = function(Page, Line, Range, X, Y0, Y1, SpacesCount)
{
	this.Page  = Page;
	this.Line  = Line;
	this.Range = Range;

	this.High.Clear();
	this.Coll.Clear();
	this.Find.Clear();
	this.Comm.Clear();

	this.X  = X;
	this.Y0 = Y0;
	this.Y1 = Y1;

	this.Spaces = SpacesCount;

	this.InlineSdt = [];
};
CParagraphDrawStateHighlights.prototype.AddInlineSdt = function(oSdt)
{
	this.InlineSdt.push(oSdt);
};
CParagraphDrawStateHighlights.prototype.AddComment = function(Id)
{
	if (!this.DrawComments)
		return;

	var oComment = AscCommon.g_oTableId.Get_ById(Id);
	if (!oComment || (!this.DrawSolvedComments && oComment.IsSolved()))
		return;

	this.Comments.push(Id);
	this.Check_CommentsFlag();
};
CParagraphDrawStateHighlights.prototype.RemoveComment = function(Id)
{
	if (!this.DrawComments)
		return;

	var oComment = AscCommon.g_oTableId.Get_ById(Id);
	if (!oComment || (!this.DrawSolvedComments && oComment.IsSolved()))
		return;

	for (var nIndex = 0, nCount = this.Comments.length; nIndex < nCount; ++nIndex)
	{
		if (this.Comments[nIndex] === Id)
		{
			this.Comments.splice(nIndex, 1);
			break;
		}
	}

	this.Check_CommentsFlag();
};
CParagraphDrawStateHighlights.prototype.Check_CommentsFlag = function()
{
	if(!this.Paragraph.bFromDocument)
	{
		return;
	}
	// Проверяем флаг
	var Para             = this.Paragraph;
	var DocumentComments = Para.LogicDocument.Comments;
	var CurComment       = DocumentComments.Get_CurrentId();
	var CommLen          = this.Comments.length;

	// Сначала проверим есть ли вообще комментарии
	this.CommentsFlag = ( CommLen > 0 ? AscCommon.comments_NonActiveComment : AscCommon.comments_NoComment );

	// Проверим является ли какой-либо комментарий активным
	for (var CurPos = 0; CurPos < CommLen; CurPos++)
	{
		if (CurComment === this.Comments[CurPos])
		{
			this.CommentsFlag = AscCommon.comments_ActiveComment;
			break
		}
	}
};
CParagraphDrawStateHighlights.prototype.Save_Coll = function()
{
	var Coll  = this.Coll;
	this.Coll = new CParaDrawingRangeLines();
	return Coll;
};
CParagraphDrawStateHighlights.prototype.Save_Comm = function()
{
	var Comm  = this.Comm;
	this.Comm = new CParaDrawingRangeLines();
	return Comm;
};
CParagraphDrawStateHighlights.prototype.Load_Coll = function(Coll)
{
	this.Coll = Coll;
};
CParagraphDrawStateHighlights.prototype.Load_Comm = function(Comm)
{
	this.Comm = Comm;
};

function CParagraphDrawStateElements()
{
    this.Paragraph = undefined;
    this.Graphics  = undefined;
    this.BgColor   = undefined;

    this.Theme     = undefined;
    this.ColorMap  = undefined;

    this.CurPos = new CParagraphContentPos();

    this.VisitedHyperlink = false;
    this.Hyperlink = false;

    this.Page   = 0;
    this.Line   = 0;
    this.Range  = 0;

    this.X = 0;
    this.Y = 0;

    this.LineTop    = 0;
    this.LineBottom = 0;
    this.BaseLine   = 0;

    this.ComplexFields = new CParagraphComplexFieldsInfo();
}

CParagraphDrawStateElements.prototype =
{
    Reset : function(Paragraph, Graphics, BgColor, Theme, ColorMap)
    {
        this.Paragraph = Paragraph;
        this.Graphics  = Graphics;
        this.BgColor   = BgColor;
        this.Theme     = Theme;
        this.ColorMap  = ColorMap;

        this.VisitedHyperlink = false;
        this.Hyperlink = false;

        this.CurPos = new CParagraphContentPos();
    },

    Reset_Range : function(Page, Line, Range, X, Y)
    {
        this.Page  = Page;
        this.Line  = Line;
        this.Range = Range;

        this.X = X;
        this.Y = Y;
    },

    Set_LineMetrics : function(BaseLine, Top, Bottom)
    {
        this.LineTop    = Top;
        this.LineBottom = Bottom;
        this.BaseLine   = BaseLine;
    }
};

function CParagraphDrawStateLines()
{
    this.Paragraph = undefined;
    this.Graphics  = undefined;
    this.BgColor   = undefined;

    this.CurPos   = new CParagraphContentPos();
    this.CurDepth = 0;

    this.VisitedHyperlink = false;
    this.Hyperlink = false;

    this.Strikeout  = new CParaDrawingRangeLines();
    this.DStrikeout = new CParaDrawingRangeLines();
    this.Underline  = new CParaDrawingRangeLines();
    this.Spelling   = new CParaDrawingRangeLines();
    this.RunReview  = new CParaDrawingRangeLines();
    this.CollChange = new CParaDrawingRangeLines();
    this.DUnderline = new CParaDrawingRangeLines();

    this.Page  = 0;
    this.Line  = 0;
    this.Range = 0;

    this.X               = 0;
    this.BaseLine        = 0;
    this.UnderlineOffset = 0;
    this.Spaces          = 0;

    this.ComplexFields = new CParagraphComplexFieldsInfo();
}

CParagraphDrawStateLines.prototype =
{
    Reset : function(Paragraph, Graphics, BgColor)
    {
        this.Paragraph = Paragraph;
        this.Graphics  = Graphics;
        this.BgColor   = BgColor;

        this.VisitedHyperlink = false;
        this.Hyperlink = false;

		this.CurPos   = new CParagraphContentPos();
		this.CurDepth = 0;
    },

    Reset_Line : function(Page, Line, Baseline, UnderlineOffset)
    {
        this.Page  = Page;
        this.Line  = Line;

        this.Baseline        = Baseline;
        this.UnderlineOffset = UnderlineOffset;

        this.Strikeout.Clear();
        this.DStrikeout.Clear();
        this.Underline.Clear();
        this.Spelling.Clear();
    },

    Reset_Range : function(Range, X, Spaces)
    {
        this.Range  = Range;
        this.X      = X;
        this.Spaces = Spaces;
    }
};
/**
 * Получаем количество орфографических ошибок в данном месте
 * @returns {number}
 */
CParagraphDrawStateLines.prototype.GetSpellingErrorsCounter = function()
{
	var nCounter = 0;
	var oSpellChecker = this.Paragraph.GetSpellChecker();
	for (var nIndex = 0, nCount = oSpellChecker.GetElementsCount(); nIndex < nCount; ++nIndex)
	{
		var oSpellElement = oSpellChecker.GetElement(nIndex);

		var oStartPos = oSpellElement.GetStartPos();
		var oEndPos   = oSpellElement.GetEndPos();

		if (this.CurPos.Compare(oStartPos) > 0 && this.CurPos.Compare(oEndPos) < 0)
			nCounter++;
	}

	return nCounter;
};

var g_oPDSH = new CParagraphDrawStateHighlights();
//var g_oPDSE = new CParagraphDrawStateElements();
var g_oPDSL = new CParagraphDrawStateLines();

//----------------------------------------------------------------------------------------------------------------------
// Классы для работы с курсором
//----------------------------------------------------------------------------------------------------------------------

// Общий класс для нахождения позиции курсора слева/справа/начала и конца слова и т.д.
function CParagraphSearchPos()
{
    this.Pos   = new CParagraphContentPos(); // Искомая позиция
    this.Found = false;                      // Нашли или нет

    this.Line  = -1;
    this.Range = -1;

    this.Stage       = 0; // Номера этапов для поиска начала и конца слова
    this.Shift       = false;
    this.Punctuation = false;
    this.First       = true;
    this.UpdatePos   = false;
    
    this.ForSelection = false;

    this.CheckAnchors = false;

    this.TrimSpaces = false; // При поиске позиции конца слова, если false - ищем вместе с проблема, true - ищем четкое окончание слова

    this.ComplexFields = [];
}
CParagraphSearchPos.prototype.SetCheckAnchors = function(bCheck)
{
	this.CheckAnchors = bCheck;
};
CParagraphSearchPos.prototype.IsCheckAnchors = function()
{
	return this.CheckAnchors;
};
CParagraphSearchPos.prototype.ProcessComplexFieldChar = function(nDirection, oFieldChar)
{
	if (!oFieldChar || !oFieldChar.IsUse())
		return;


	if (nDirection > 0)
	{
		var oComplexField = oFieldChar.GetComplexField();
		if (oFieldChar.IsBegin())
		{
			this.ComplexFields.push(new CComplexFieldStatePos(oComplexField, true));
		}
		else if (oFieldChar.IsSeparate())
		{
			for (var nIndex = 0, nCount = this.ComplexFields.length; nIndex < nCount; ++nIndex)
			{
				if (oComplexField === this.ComplexFields[nIndex].ComplexField)
				{
					this.ComplexFields[nIndex].SetFieldCode(false);
					break;
				}
			}
		}
		else if (oFieldChar.IsEnd())
		{
			for (var nIndex = 0, nCount = this.ComplexFields.length; nIndex < nCount; ++nIndex)
			{
				if (oComplexField === this.ComplexFields[nIndex].ComplexField)
				{
					this.ComplexFields.splice(nIndex, 1);
					break;
				}
			}
		}
	}
	else
	{
		var oComplexField = oFieldChar.GetComplexField();
		if (oFieldChar.IsEnd())
		{
			this.ComplexFields.push(new CComplexFieldStatePos(oComplexField, false));
		}
		else if (oFieldChar.IsSeparate())
		{
			for (var nIndex = 0, nCount = this.ComplexFields.length; nIndex < nCount; ++nIndex)
			{
				if (oComplexField === this.ComplexFields[nIndex].ComplexField)
				{
					this.ComplexFields[nIndex].SetFieldCode(true);
					break;
				}
			}
		}
		else if (oFieldChar.IsBegin())
		{
			for (var nIndex = 0, nCount = this.ComplexFields.length; nIndex < nCount; ++nIndex)
			{
				if (oComplexField === this.ComplexFields[nIndex].ComplexField)
				{
					this.ComplexFields.splice(nIndex, 1);
					break;
				}
			}
		}
	}
};
CParagraphSearchPos.prototype.InitComplexFields = function(arrComplexFields)
{
	this.ComplexFields = arrComplexFields;
};
CParagraphSearchPos.prototype.IsComplexField = function()
{
	return (this.ComplexFields.length > 0 ? true : false);
};
CParagraphSearchPos.prototype.IsComplexFieldCode = function()
{
	if (!this.IsComplexField())
		return false;

	for (var nIndex = 0, nCount = this.ComplexFields.length; nIndex < nCount; ++nIndex)
	{
		if (this.ComplexFields[nIndex].IsFieldCode())
			return true;
	}

	return false;
};
CParagraphSearchPos.prototype.IsComplexFieldValue = function()
{
	if (!this.IsComplexField() || this.IsComplexFieldCode())
		return false;

	return true;
};
CParagraphSearchPos.prototype.IsHiddenComplexField = function()
{
	for (var nIndex = 0, nCount = this.ComplexFields.length; nIndex < nCount; ++nIndex)
	{
		if (this.ComplexFields[nIndex].ComplexField.IsHidden())
			return true;
	}

	return false;
};
CParagraphSearchPos.prototype.SetTrimSpaces = function(isTrim)
{
	this.TrimSpaces = isTrim;
};
CParagraphSearchPos.prototype.IsTrimSpaces = function(isTrim)
{
	return this.TrimSpaces;
};

function CParagraphSearchPosXY()
{
    this.Pos       = new CParagraphContentPos();
    this.InTextPos = new CParagraphContentPos();

    this.CenterMode     = true; // Ищем ближайший (т.е. ориентируемся по центру элемента), или ищем именно прохождение через элемент
    this.CurX           = 0;
    this.CurY           = 0;
    this.X              = 0;
    this.Y              = 0;
    this.DiffX          = 1000000; // километра для ограничения должно хватить
    this.NumberingDiffX = 1000000; // километра для ограничения должно хватить

    this.Line      = 0;
    this.Range     = 0;

    this.InTextX   = false;
    this.InText    = false;
    this.Numbering = false;
    this.End       = false;
    this.Field     = null;
}

//----------------------------------------------------------------------------------------------------------------------
// Классы для работы с селектом
//----------------------------------------------------------------------------------------------------------------------
function CParagraphDrawSelectionRange()
{
    this.StartX    = 0;
    this.W         = 0;

    this.StartY    = 0;
    this.H         = 0;

    this.FindStart = true;
    this.Draw      = true;
}

//----------------------------------------------------------------------------------------------------------------------
//
//----------------------------------------------------------------------------------------------------------------------
function CParagraphCheckSplitPageOnPageBreak(oPageBreakItem, oLogicDocument)
{
    this.PageBreak = oPageBreakItem;
    this.FindPB    = true;

    this.SplitPageBreakAndParaMark = oLogicDocument ? oLogicDocument.IsSplitPageBreakAndParaMark() : false;
}
CParagraphCheckSplitPageOnPageBreak.prototype.IsSplitPageBreakAndParaMark = function()
{
	return this.SplitPageBreakAndParaMark;
};
CParagraphCheckSplitPageOnPageBreak.prototype.IsFindPageBreak = function()
{
	return this.FindPB;
};
CParagraphCheckSplitPageOnPageBreak.prototype.CheckPageBreakItem = function(oRunItem)
{
	if (oRunItem === this.PageBreak)
	{
		this.FindPB                  = false;
		this.PageBreak.Flags.NewLine = true;
	}
};

function CParagraphGetText()
{
    this.Text = "";

    this.BreakOnNonText = true;
    this.ParaEndToSpace = false;
}
CParagraphGetText.prototype.AddText = function(sText)
{
	if (null !== this.Text)
		this.Text += sText;
};
CParagraphGetText.prototype.SetBreakOnNonText = function(bValue)
{
	this.BreakOnNonText = bValue;
};
CParagraphGetText.prototype.SetParaEndToSpace = function(bValue)
{
	this.ParaEndToSpace = bValue;
};

function CParagraphNearPos()
{
    this.NearPos = null;
    this.Classes = [];
}

function CParagraphElementNearPos()
{
    this.NearPos = null;
    this.Depth   = 0;
}

function CParagraphDrawingLayout(Drawing, Paragraph, X, Y, Line, Range, Page)
{
    this.Paragraph = Paragraph;
    this.Drawing   = Drawing;
    this.Line      = Line;
    this.Range     = Range;
    this.Page      = Page;
    this.X         = X;
    this.Y         = Y;
    this.LastW     = 0;

    this.Layout    = false;
}

function CParagraphGetDropCapText()
{
    this.Runs  = [];
    this.Text  = [];
    this.Mixed = false;
    this.Check = true;
}

//----------------------------------------------------------------------------------------------------------------------
//
//----------------------------------------------------------------------------------------------------------------------

function CRunRecalculateObject(StartLine, StartRange)
{
    this.StartLine   = StartLine;
    this.StartRange  = StartRange;
    this.Lines       = [];
    this.Content     = [];

    this.MathInfo    = null;
}

CRunRecalculateObject.prototype =
{
    Save_Lines : function(Obj, Copy)
    {
        if ( true === Copy )
        {
            var Lines = Obj.Lines;
            var Count = Obj.Lines.length;
            for ( var Index = 0; Index < Count; Index++ )
                this.Lines[Index] = Lines[Index];
        }
        else
        {
            this.Lines = Obj.Lines;
        }
    },

    Save_Content : function(Obj, Copy)
    {
        var Content = Obj.Content;
        var ContentLen = Content.length;
        for ( var Index = 0; Index < ContentLen; Index++ )
        {
            this.Content[Index] = Content[Index].SaveRecalculateObject(Copy);
        }
    },

    Save_MathInfo: function(Obj, Copy)
    {
        this.MathInfo = Obj.Save_MathInfo(Copy);
    },

    Load_Lines : function(Obj)
    {
        Obj.StartLine  = this.StartLine;
        Obj.StartRange = this.StartRange;
        Obj.Lines      = this.Lines;
    },

    Load_Content : function(Obj)
    {
        var Count = Obj.Content.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            Obj.Content[Index].LoadRecalculateObject( this.Content[Index] );
        }
    },

    Load_MathInfo: function(Obj)
    {
        Obj.Load_MathInfo(this.MathInfo);
    },

    Save_RunContent : function(Run, Copy)
    {
        var ContentLen = Run.Content.length;
        for ( var Index = 0, Index2 = 0; Index < ContentLen; Index++ )
        {
            var Item = Run.Content[Index];

			if (para_PageNum === Item.Type || para_Drawing === Item.Type || para_FieldChar === Item.Type)
				this.Content[Index2++] = Item.SaveRecalculateObject(Copy);
        }
    },

    Load_RunContent : function(Run)
    {
        var Count = Run.Content.length;
        for ( var Index = 0, Index2 = 0; Index < Count; Index++ )
        {
            var Item = Run.Content[Index];

			if (para_PageNum === Item.Type || para_Drawing === Item.Type || para_FieldChar === Item.Type)
				Item.LoadRecalculateObject(this.Content[Index2++]);
        }
    },

    Get_DrawingFlowPos : function(FlowPos)
    {
        var Count = this.Content.length;
        for ( var Index = 0, Index2 = 0; Index < Count; Index++ )
        {
            var Item = this.Content[Index];

            if ( para_Drawing === Item.Type && undefined !== Item.FlowPos )
                FlowPos.push( Item.FlowPos );
        }
    },

    Compare : function(_CurLine, _CurRange, OtherLinesInfo)
    {
        var OLI = para_Math === OtherLinesInfo.Type ? OtherLinesInfo.Root : OtherLinesInfo;

        if(para_Math === OtherLinesInfo.Type && OtherLinesInfo.CompareMathInfo(this.MathInfo) == false /*this.WrapState !== OtherLinesInfo.GetCurrentWrapState()*/)
        {
            return false;
        }

        var CurLine = _CurLine - this.StartLine;
        var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

        // Специальная заглушка для элементов типа комментария
        if ( ( 0 === this.Lines.length || 0 === this.LinesLength ) && ( 0 === OLI.Lines.length || 0 === OLI.LinesLength ) )
            return true;

        // заглушка для однострочных контентов
        if(OLI.Type == para_Math_Content && OLI.bOneLine == true)
            return true;

        if ( this.StartLine !== OLI.StartLine || this.StartRange !== OLI.StartRange || CurLine < 0 || CurLine >= this.private_Get_LinesCount() || CurLine >= OLI.protected_GetLinesCount() || CurRange < 0 || CurRange >= this.private_Get_RangesCount(CurLine) || CurRange >= OLI.protected_GetRangesCount(CurLine) )
            return false;


        var ThisSP = this.private_Get_RangeStartPos(CurLine, CurRange);
        var ThisEP = this.private_Get_RangeEndPos(CurLine, CurRange);

        var OtherSP = OLI.protected_GetRangeStartPos(CurLine, CurRange);
        var OtherEP = OLI.protected_GetRangeEndPos(CurLine, CurRange);

        if ( ThisSP !== OtherSP || ThisEP !== OtherEP )
            return false;

        if ( ( (OLI.Content === undefined || para_Run === OLI.Type || para_Math_Run === OLI.Type) && this.Content.length > 0 ) || ( OLI.Content !== undefined && para_Run !== OLI.Type && para_Math_Run !== OLI.Type && OLI.Content.length !== this.Content.length) )
            return false;

        var ContentLen = this.Content.length;
        var StartPos = ThisSP;
        var EndPos   = Math.min( ContentLen - 1, ThisEP );

        for ( var CurPos = StartPos; CurPos <= EndPos; CurPos++ )
        {
            if ( false === this.Content[CurPos].Compare( _CurLine, _CurRange, OLI.Content[CurPos] ) )
                return false;
        }

        return true;
    },
    
    private_Get_RangeOffset : function(LineIndex, RangeIndex)
    {
        return (1 + this.Lines[0] + this.Lines[1 + LineIndex] + RangeIndex * 2);
    },
    
    private_Get_RangeStartPos : function(LineIndex, RangeIndex)
    { 
        return this.Lines[this.private_Get_RangeOffset(LineIndex, RangeIndex)];
    },

    private_Get_RangeEndPos : function(LineIndex, RangeIndex)
    {
        return this.Lines[this.private_Get_RangeOffset(LineIndex, RangeIndex) + 1];
    },
    
    private_Get_LinesCount : function()
    {
        return this.Lines[0];
    },
    
    private_Get_RangesCount : function(LineIndex)
    {
        if (LineIndex === this.Lines[0] - 1)
            return (this.Lines.length - this.Lines[1 + LineIndex]) / 2;
        else
            return (this.Lines[1 + LineIndex + 1] - this.Lines[1 + LineIndex]) / 2;
    }    
};

function CParagraphRunElements(ContentPos, Count, arrTypes, isReverse)
{
    this.ContentPos = ContentPos;
    this.Elements   = [];
    this.Count      = Count + 1; // Добавляем 1 для проверки достижения края параграфа
    this.Types      = arrTypes ? arrTypes : [];
    this.End        = false;
	this.Reverse    = undefined !== isReverse ? isReverse : false;

	this.CurContentPos        = new CParagraphContentPos();
	this.SaveContentPositions = false;
	this.ContentPositions     = [];
}
/**
 * Обновляем текущую позицию
 * @param nPos {number}
 * @param nDepth {number}
 */
CParagraphRunElements.prototype.UpdatePos = function(nPos, nDepth)
{
	this.CurContentPos.Update(nPos, nDepth);
};
/**
 * Сохранять ли позиции элементов
 * @param isSave {boolean}
 */
CParagraphRunElements.prototype.SetSaveContentPositions = function(isSave)
{
	this.SaveContentPositions = isSave;
};
/**
 * Получаем массив позиций элементов
 * @returns {Array}
 */
CParagraphRunElements.prototype.GetContentPositions = function()
{
	return this.ContentPositions;
};
/**
 * Проверяем элемент рана по типу
 * @param nType
 * @returns {boolean}
 */
CParagraphRunElements.prototype.CheckType = function(nType)
{
	if (this.Types.length <= 0)
		return true;

	for (var nIndex = 0, nCount = this.Types.length; nIndex < nCount; ++nIndex)
	{
		if (nType === this.Types[nIndex])
			return true;
	}

	return false;
};
/**
 * Добавляем данный элемент
 * @param oElement {CRunElementBase}
 */
CParagraphRunElements.prototype.Add = function(oElement)
{
	if (this.CheckType(oElement.Type))
	{
		if (this.Reverse)
		{
			if (this.SaveContentPositions)
				this.ContentPositions.splice(0, 0, this.CurContentPos.Copy());

			this.Elements.splice(0, 0, oElement);
		}
		else
		{
			if (this.SaveContentPositions)
				this.ContentPositions.push(this.CurContentPos.Copy());

			this.Elements.push(oElement);
		}

		this.Count--;
	}
};
/**
 * Окончен ли сбор элементов
 * @returns {boolean}
 */
CParagraphRunElements.prototype.IsEnoughElements = function()
{
	return (this.Count <= 0);
};
/**
 * Проверяем достиглили мы края параграфа
 * @param isEnd {boolean}
 */
CParagraphRunElements.prototype.CheckEnd = function(isEnd)
{
	if (this.Count <= 0)
	{
		this.End = false;
		if (this.Reverse)
			this.Elements.splice(0, 1);
		else
			this.Elements.splice(this.Elements.length - 1, 1);
	}
	else if (this.Count >= 1)
	{
		this.End = true;
	}
};
/**
 * Проверяем достигли ли мы конца параграфа
 * @returns {boolean}
 */
CParagraphRunElements.prototype.IsEnd = function()
{
	return this.End;
};
/**
 * Получаем список элементов
 * @returns {Array}
 */
CParagraphRunElements.prototype.GetElements = function()
{
	return this.Elements;
};

function CParagraphStatistics(Stats)
{
    this.Stats          = Stats;
    this.EmptyParagraph = true;
    this.Word           = false;

    this.Symbol  = false;
    this.Space   = false;
    this.NewWord = false;
}

function CParagraphMinMaxContentWidth()
{
    this.bWord        = false;
    this.nWordLen     = 0;
    this.nSpaceLen    = 0;
    this.nMinWidth    = 0;
    this.nMaxWidth    = 0;
    this.nCurMaxWidth = 0;
    this.bMath_OneLine = false; // for ParaMath
    this.nMaxHeight    = 0;
    this.nEndHeight    = 0;
}

function CParagraphRangeVisibleWidth()
{
    this.End = false;
    this.W   = 0;
}

function CParagraphMathRangeChecker()
{
    this.Math   = null; // Искомый элемент
    this.Result = true; // Если есть отличные от Math элементы, тогда false, если нет, тогда true 
}

function CParagraphMathParaChecker()
{
    this.Found     = false;
    this.Result    = true;
    this.Direction = 0;
}


function CParagraphStartState(Paragraph)
{
    this.Pr = Paragraph.Pr.Copy();
    this.TextPr = Paragraph.TextPr;
    this.Content = [];
    for(var i = 0; i < Paragraph.Content.length; ++i)
    {
        this.Content.push(Paragraph.Content[i]);
    }
}

function CParagraphTabsCounter()
{
    this.Count = 0;
    this.Pos   = [];
}

function CParagraphRevisionsChangesChecker(Para, RevisionsManager)
{
    this.Paragraph        = Para;
    this.ParaId           = Para.GetId();
    this.RevisionsManager = RevisionsManager;
    this.ParaEndRun       = false;
    this.CheckOnlyTextPr  = 0;

    // Блок информации для добавления/удаления текста
    this.AddRemove =
    {
        ChangeType : null,
		MoveType   : Asc.c_oAscRevisionsMove.NoMove,
        StartPos   : null,
        EndPos     : null,
        Value      : [],
        UserId     : "",
        UserName   : "",
        DateTime   : 0
    };

    // Блок информации для сбора изменений настроек текста
    this.TextPr =
    {
        Pr       : null,
        StartPos : null,
        EndPos   : null,
        UserId   : "",
        UserName : "",
        DateTime : 0
    };
}
CParagraphRevisionsChangesChecker.prototype.FlushAddRemoveChange = function()
{
    var AddRemove = this.AddRemove;
    if (reviewtype_Add === AddRemove.ChangeType || reviewtype_Remove === AddRemove.ChangeType)
    {
        var Change = new CRevisionsChange();
        Change.SetType(reviewtype_Add === AddRemove.ChangeType ? c_oAscRevisionsChangeType.TextAdd : c_oAscRevisionsChangeType.TextRem);
        Change.SetElement(this.Paragraph);
        Change.put_Value(AddRemove.Value);
        Change.put_StartPos(AddRemove.StartPos);
        Change.put_EndPos(AddRemove.EndPos);
        Change.SetMoveType(AddRemove.MoveType);
        Change.SetUserId(AddRemove.UserId);
        Change.SetUserName(AddRemove.UserName);
        Change.SetDateTime(AddRemove.DateTime);
        this.RevisionsManager.AddChange(this.ParaId, Change);
    }

    AddRemove.ChangeType = null;
    AddRemove.StartPos   = null;
    AddRemove.EndPos     = null;
    AddRemove.Value      = [];
    AddRemove.UserId     = "";
    AddRemove.UserName   = "";
    AddRemove.DateTime   = 0;
};
CParagraphRevisionsChangesChecker.prototype.FlushTextPrChange = function()
{
    var TextPr = this.TextPr;
    if (null !== TextPr.Pr)
    {
        var Change = new CRevisionsChange();
        Change.put_Type(c_oAscRevisionsChangeType.TextPr);
        Change.put_Value(TextPr.Pr);
        Change.put_Paragraph(this.Paragraph);
        Change.put_StartPos(TextPr.StartPos);
        Change.put_EndPos(TextPr.EndPos);
        Change.put_UserId(TextPr.UserId);
        Change.put_UserName(TextPr.UserName);
        Change.put_DateTime(TextPr.DateTime);
        this.RevisionsManager.AddChange(this.ParaId, Change);
    }

    TextPr.Pr       = null;
    TextPr.StartPos = null;
    TextPr.EndPos   = null;
    TextPr.UserId   = "";
    TextPr.UserName = "";
    TextPr.DateTime = 0;

};
CParagraphRevisionsChangesChecker.prototype.AddReviewMoveMark = function(oMark, oParaContentPos)
{
	var oInfo = oMark.GetReviewInfo();

	var oChange = new CRevisionsChange();
	oChange.SetType(c_oAscRevisionsChangeType.MoveMark);
	oChange.SetElement(this.Paragraph);
	oChange.put_StartPos(oParaContentPos);
	oChange.put_EndPos(oParaContentPos);
	oChange.SetValue(oMark);
	oChange.SetUserId(oInfo.GetUserId());
	oChange.SetUserName(oInfo.GetUserName());
	oChange.SetDateTime(oInfo.GetDateTime());
	this.RevisionsManager.AddChange(this.ParaId, oChange);
};
CParagraphRevisionsChangesChecker.prototype.GetAddRemoveType = function()
{
    return this.AddRemove.ChangeType;
};
CParagraphRevisionsChangesChecker.prototype.GetAddRemoveMoveType = function()
{
	return this.AddRemove.MoveType;
};
CParagraphRevisionsChangesChecker.prototype.Get_AddRemoveUserId = function()
{
    return this.AddRemove.UserId;
};
CParagraphRevisionsChangesChecker.prototype.StartAddRemove = function(nChangeType, oContentPos, nMoveType)
{
    this.AddRemove.ChangeType = nChangeType;
    this.AddRemove.StartPos   = oContentPos.Copy();
    this.AddRemove.EndPos     = oContentPos.Copy();
    this.AddRemove.Value      = [];
    this.AddRemove.MoveType   = nMoveType;
};
CParagraphRevisionsChangesChecker.prototype.Set_AddRemoveEndPos = function(ContentPos)
{
    this.AddRemove.EndPos = ContentPos.Copy();
};
CParagraphRevisionsChangesChecker.prototype.Update_AddRemoveReviewInfo = function(ReviewInfo)
{
    if (ReviewInfo && this.AddRemove.DateTime <= ReviewInfo.GetDateTime())
    {
        this.AddRemove.UserId   = ReviewInfo.GetUserId();
        this.AddRemove.UserName = ReviewInfo.GetUserName();
        this.AddRemove.DateTime = ReviewInfo.GetDateTime();
    }
};
CParagraphRevisionsChangesChecker.prototype.Add_Text = function(Text)
{
    if (!Text || "" === Text)
        return;

    var Value = this.AddRemove.Value;
    var ValueLen = Value.length;
    if (ValueLen <= 0 || "string" !== typeof Value[ValueLen - 1])
    {
        Value.push("" + Text);
    }
    else
    {
        Value[ValueLen - 1] += Text;
    }
};
CParagraphRevisionsChangesChecker.prototype.Add_Math = function(MathElement)
{
    this.AddRemove.Value.push(c_oAscRevisionsObjectType.MathEquation);
};
CParagraphRevisionsChangesChecker.prototype.Add_Drawing = function(Drawing)
{
    if (Drawing)
    {
        var Type = Drawing.Get_ObjectType();
        switch (Type)
        {
            case AscDFH.historyitem_type_Chart:
            case AscDFH.historyitem_type_ChartSpace:
            {
                this.AddRemove.Value.push(c_oAscRevisionsObjectType.Chart);
                break;
            }
            case AscDFH.historyitem_type_ImageShape:
            case AscDFH.historyitem_type_Image:
            case AscDFH.historyitem_type_OleObject:
            {
                this.AddRemove.Value.push(c_oAscRevisionsObjectType.Image);
                break;
            }
            case AscDFH.historyitem_type_Shape:
            default:
            {
                this.AddRemove.Value.push(c_oAscRevisionsObjectType.Shape);
                break;
            }
        }
    }
};
CParagraphRevisionsChangesChecker.prototype.HavePrChange = function()
{
    return (null === this.TextPr.Pr ? false : true);
};
CParagraphRevisionsChangesChecker.prototype.ComparePrChange = function(PrChange)
{
    if (null === this.TextPr.Pr)
        return false;

    return this.TextPr.Pr.Is_Equal(PrChange);
};
CParagraphRevisionsChangesChecker.prototype.Start_PrChange = function(Pr, ContentPos)
{
    this.TextPr.Pr = Pr;
    this.TextPr.StartPos = ContentPos.Copy();
    this.TextPr.EndPos   = ContentPos.Copy();
};
CParagraphRevisionsChangesChecker.prototype.SetPrChangeEndPos = function(ContentPos)
{
    this.TextPr.EndPos = ContentPos.Copy();
};
CParagraphRevisionsChangesChecker.prototype.Update_PrChangeReviewInfo = function(ReviewInfo)
{
    if (ReviewInfo && this.TextPr.DateTime <= ReviewInfo.GetDateTime())
    {
        this.TextPr.UserId   = ReviewInfo.GetUserId();
        this.TextPr.UserName = ReviewInfo.GetUserName();
        this.TextPr.DateTime = ReviewInfo.GetDateTime();
    }
};
CParagraphRevisionsChangesChecker.prototype.Is_ParaEndRun = function()
{
    return this.ParaEndRun;
};
CParagraphRevisionsChangesChecker.prototype.SetParaEndRun = function()
{
    this.ParaEndRun = true;
};
CParagraphRevisionsChangesChecker.prototype.Begin_CheckOnlyTextPr = function()
{
    this.CheckOnlyTextPr++;
};
CParagraphRevisionsChangesChecker.prototype.End_CheckOnlyTextPr = function()
{
    this.CheckOnlyTextPr--;
};
CParagraphRevisionsChangesChecker.prototype.Is_CheckOnlyTextPr = function()
{
    return (0 === this.CheckOnlyTextPr ? false : true);
};
CParagraphRevisionsChangesChecker.prototype.Get_PrChangeUserId = function()
{
    return this.TextPr.UserId;
};

function CParagraphSelectionState()
{
	this.ContentPos = new CParagraphContentPos();
	this.StartPos   = new CParagraphContentPos();
	this.EndPos     = new CParagraphContentPos();

	this.Selection  = new CParagraphSelection();
	this.CurPos     = new CParagraphCurPos();
}

//--------------------------------------------------------export----------------------------------------------------
window['AscCommonWord'] = window['AscCommonWord'] || {};
window['AscCommonWord'].Paragraph = Paragraph;
window['AscCommonWord'].UnknownValue = UnknownValue;
window['AscCommonWord'].type_Paragraph = type_Paragraph;
