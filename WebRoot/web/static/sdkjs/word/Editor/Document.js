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

// TODO: Сейчас Paragraph.Recalculate_FastWholeParagraph работает только на добавлении текста, надо переделать
//       алгоритм определения изменений, чтобы данная функция работала и при других изменениях.

// Import
var c_oAscLineDrawingRule = AscCommon.c_oAscLineDrawingRule;
var align_Left = AscCommon.align_Left;
var hdrftr_Header = AscCommon.hdrftr_Header;
var hdrftr_Footer = AscCommon.hdrftr_Footer;
var c_oAscFormatPainterState = AscCommon.c_oAscFormatPainterState;
var changestype_None = AscCommon.changestype_None;
var changestype_Paragraph_Content = AscCommon.changestype_Paragraph_Content;
var changestype_2_Element_and_Type = AscCommon.changestype_2_Element_and_Type;
var changestype_2_ElementsArray_and_Type = AscCommon.changestype_2_ElementsArray_and_Type;
var g_oTableId = AscCommon.g_oTableId;
var History = AscCommon.History;

var c_oAscHAnchor = Asc.c_oAscHAnchor;
var c_oAscXAlign = Asc.c_oAscXAlign;
var c_oAscYAlign = Asc.c_oAscYAlign;
var c_oAscVAnchor = Asc.c_oAscVAnchor;
var c_oAscRevisionsChangeType = Asc.c_oAscRevisionsChangeType;
var c_oAscSectionBreakType    = Asc.c_oAscSectionBreakType;

var Page_Width     = 210;
var Page_Height    = 297;

var X_Left_Margin   = 30;  // 3   cm
var X_Right_Margin  = 15;  // 1.5 cm
var Y_Bottom_Margin = 20;  // 2   cm
var Y_Top_Margin    = 20;  // 2   cm

var X_Right_Field  = Page_Width  - X_Right_Margin;
var Y_Bottom_Field = Page_Height - Y_Bottom_Margin;

var docpostype_Content        = 0x00;
var docpostype_HdrFtr         = 0x02;
var docpostype_DrawingObjects = 0x03;
var docpostype_Footnotes      = 0x04;

var selectionflag_Common        = 0x000;
var selectionflag_Numbering     = 0x001; // Выделена нумерация
var selectionflag_NumberingCur  = 0x002; // Выделена нумерация и данный параграф является текущим

var search_Common              = 0x0000; // Поиск в простом тексте
var search_Header              = 0x0100; // Поиск в верхнем колонтитуле
var search_Footer              = 0x0200; // Поиск в нижнем колонтитуле
var search_Footnote            = 0x0400; // Поиск в сноске

var search_HdrFtr_All          = 0x0001; // Поиск в колонтитуле, который находится на всех страницах
var search_HdrFtr_All_no_First = 0x0002; // Поиск в колонтитуле, который находится на всех страницах, кроме первой
var search_HdrFtr_First        = 0x0003; // Поиск в колонтитуле, который находится только на первой страниц
var search_HdrFtr_Even         = 0x0004; // Поиск в колонтитуле, который находится только на четных страницах
var search_HdrFtr_Odd          = 0x0005; // Поиск в колонтитуле, который находится только на нечетных страницах, включая первую
var search_HdrFtr_Odd_no_First = 0x0006; // Поиск в колонтитуле, который находится только на нечетных страницах, кроме первой

// Типы которые возвращают классы CParagraph и CTable после пересчета страницы
var recalcresult_NextElement = 0x01; // Пересчитываем следующий элемент
var recalcresult_PrevPage    = 0x02; // Пересчитываем заново предыдущую страницу
var recalcresult_CurPage     = 0x04; // Пересчитываем заново текущую страницу
var recalcresult_NextPage    = 0x08; // Пересчитываем следующую страницу
var recalcresult_NextLine    = 0x10; // Пересчитываем следующую строку
var recalcresult_CurLine     = 0x20; // Пересчитываем текущую строку
var recalcresult_CurPagePara = 0x40; // Специальный случай, когда мы встретили картинку в начале параграфа
var recalcresult_ParaMath    = 0x80; // Пересчитываем заново неинлайновую формулу

var recalcresultflags_Column            = 0x010000; // Пересчитываем только колонку
var recalcresultflags_Page              = 0x020000; // Пересчитываем всю страницу
var recalcresultflags_LastFromNewPage   = 0x040000; // Используется совсместно с recalcresult_NextPage, означает, что начало последнего элемента нужно перенести на новую страницу
var recalcresultflags_LastFromNewColumn = 0x080000; // Используется совсместно с recalcresult_NextPage, означает, что начало последнего элемента нужно перенести на новую колонку
var recalcresultflags_Footnotes         = 0x010000; // Сообщаем, что необходимо пересчитать сноски на данной странице

// Типы которые возвращают классы CDocument и CDocumentContent после пересчета страницы
var recalcresult2_End      = 0x00; // Документ рассчитан до конца
var recalcresult2_NextPage = 0x01; // Рассчет нужно продолжить
var recalcresult2_CurPage  = 0x02; // Нужно заново пересчитать данную страницу

var document_EditingType_Common = 0x00; // Обычный режим редактирования
var document_EditingType_Review = 0x01; // Режим рецензирования

var keydownflags_PreventDefault  = 0x0001;
var keydownflags_PreventKeyPress = 0x0002;

var keydownresult_PreventNothing  = 0x0000;
var keydownresult_PreventDefault  = 0x0001;
var keydownresult_PreventKeyPress = 0x0002;
var keydownresult_PreventAll      = 0xFFFF;

var MEASUREMENT_MAX_MM_VALUE = 1000; // Маскимальное значение в мм, используемое в документе (MS Word) - 55,87 см, или 558,7 мм.

function CDocumentColumnProps()
{
    this.W     = 0;
    this.Space = 0;
}
CDocumentColumnProps.prototype.put_W = function(W)
{
    this.W = W;
};
CDocumentColumnProps.prototype.get_W = function()
{
    return this.W;
};
CDocumentColumnProps.prototype.put_Space = function(Space)
{
    this.Space = Space;
};
CDocumentColumnProps.prototype.get_Space = function()
{
    return this.Space;
};

function CDocumentColumnsProps()
{
    this.EqualWidth = true;
    this.Num        = 1;
    this.Sep        = false;
    this.Space      = 30;

    this.Cols       = [];

    this.TotalWidth = 230;
}
CDocumentColumnsProps.prototype.From_SectPr = function(SectPr)
{
    var Columns = SectPr.Columns;

    this.TotalWidth = SectPr.GetContentFrameWidth();
    this.EqualWidth = Columns.EqualWidth;
    this.Num        = Columns.Num;
    this.Sep        = Columns.Sep;
    this.Space      = Columns.Space;

    for (var Index = 0, Count = Columns.Cols.length; Index < Count; ++Index)
    {
        var Col = new CDocumentColumnProps();
        Col.put_W(Columns.Cols[Index].W);
        Col.put_Space(Columns.Cols[Index].Space);
        this.Cols[Index] = Col;
    }
};
CDocumentColumnsProps.prototype.get_EqualWidth = function()
{
    return this.EqualWidth;
};
CDocumentColumnsProps.prototype.put_EqualWidth = function(EqualWidth)
{
    this.EqualWidth = EqualWidth;
};
CDocumentColumnsProps.prototype.get_Num = function()
{
    return this.Num;
};
CDocumentColumnsProps.prototype.put_Num = function(Num)
{
    this.Num = Num;
};
CDocumentColumnsProps.prototype.get_Sep = function()
{
    return this.Sep;
};
CDocumentColumnsProps.prototype.put_Sep = function(Sep)
{
    this.Sep = Sep;
};
CDocumentColumnsProps.prototype.get_Space = function()
{
    return this.Space;
};
CDocumentColumnsProps.prototype.put_Space = function(Space)
{
    this.Space = Space;
};
CDocumentColumnsProps.prototype.get_ColsCount = function()
{
    return this.Cols.length;
};
CDocumentColumnsProps.prototype.get_Col = function(Index)
{
    return this.Cols[Index];
};
CDocumentColumnsProps.prototype.put_Col = function(Index, Col)
{
    this.Cols[Index] = Col;
};
CDocumentColumnsProps.prototype.put_ColByValue = function(Index, W, Space)
{
    var Col = new CDocumentColumnProps();
    Col.put_W(W);
    Col.put_Space(Space);
    this.Cols[Index] = Col;
};
CDocumentColumnsProps.prototype.get_TotalWidth = function()
{
    return this.TotalWidth;
};

function CDocumentSectionProps(oSectPr, oLogicDocument)
{
    if (oSectPr && oLogicDocument)
    {
        this.W      = oSectPr.GetPageWidth();
        this.H      = oSectPr.GetPageHeight();
        this.Orient = oSectPr.GetOrientation();

        this.Left   = oSectPr.GetPageMarginLeft();
        this.Top    = oSectPr.GetPageMarginTop();
        this.Right  = oSectPr.GetPageMarginRight();
        this.Bottom = oSectPr.GetPageMarginBottom();

        this.Header = oSectPr.GetPageMarginHeader();
        this.Footer = oSectPr.GetPageMarginFooter();

		this.Gutter        = oSectPr.GetGutter();
		this.GutterRTL     = oSectPr.IsGutterRTL();
		this.GutterAtTop   = oLogicDocument.IsGutterAtTop();
		this.MirrorMargins = oLogicDocument.IsMirrorMargins();
    }
    else
    {
        this.W      = undefined;
        this.H      = undefined;
        this.Orient = undefined;

        this.Left   = undefined;
        this.Top    = undefined;
        this.Right  = undefined;
        this.Bottom = undefined;

        this.Header = undefined;
        this.Footer = undefined;

        this.Gutter        = undefined;
        this.GutterRTL     = undefined;
        this.GutterAtTop   = undefined;
        this.MirrorMargins = undefined;
    }
}
CDocumentSectionProps.prototype.get_W = function()
{
    return this.W;
};
CDocumentSectionProps.prototype.put_W = function(W)
{
    this.W = W;
};
CDocumentSectionProps.prototype.get_H = function()
{
    return this.H;
};
CDocumentSectionProps.prototype.put_H = function(H)
{
    this.H = H;
};
CDocumentSectionProps.prototype.get_Orientation = function()
{
    return this.Orient;
};
CDocumentSectionProps.prototype.put_Orientation = function(Orient)
{
    this.Orient = Orient;
};
CDocumentSectionProps.prototype.get_LeftMargin = function()
{
    return this.Left;
};
CDocumentSectionProps.prototype.put_LeftMargin = function(Left)
{
    this.Left = Left;
};
CDocumentSectionProps.prototype.get_TopMargin = function()
{
    return this.Top;
};
CDocumentSectionProps.prototype.put_TopMargin = function(Top)
{
    this.Top = Top;
};
CDocumentSectionProps.prototype.get_RightMargin = function()
{
    return this.Right;
};
CDocumentSectionProps.prototype.put_RightMargin = function(Right)
{
    this.Right = Right;
};
CDocumentSectionProps.prototype.get_BottomMargin = function()
{
    return this.Bottom;
};
CDocumentSectionProps.prototype.put_BottomMargin = function(Bottom)
{
    this.Bottom = Bottom;
};
CDocumentSectionProps.prototype.get_HeaderDistance = function()
{
    return this.Header;
};
CDocumentSectionProps.prototype.put_HeaderDistance = function(Header)
{
    this.Header = Header;
};
CDocumentSectionProps.prototype.get_FooterDistance = function()
{
    return this.Footer;
};
CDocumentSectionProps.prototype.put_FooterDistance = function(Footer)
{
    this.Footer = Footer;
};
CDocumentSectionProps.prototype.get_Gutter = function()
{
	return this.Gutter;
};
CDocumentSectionProps.prototype.put_Gutter = function(nGutter)
{
	this.Gutter = nGutter;
};
CDocumentSectionProps.prototype.get_GutterRTL = function()
{
	return this.GutterRTL;
};
CDocumentSectionProps.prototype.put_GutterRTL = function(isRTL)
{
	this.GutterRTL = isRTL;
};
CDocumentSectionProps.prototype.get_GutterAtTop = function()
{
	return this.GutterAtTop;
};
CDocumentSectionProps.prototype.put_GutterAtTop = function(isAtTop)
{
	this.GutterAtTop = isAtTop;
};
CDocumentSectionProps.prototype.get_MirrorMargins = function()
{
	return this.MirrorMargins;
};
CDocumentSectionProps.prototype.put_MirrorMargins = function(isMirrorMargins)
{
	this.MirrorMargins = isMirrorMargins;
};

function CSelectedElement(Element, SelectedAll)
{
    this.Element     = Element;
    this.SelectedAll = SelectedAll;
}

function CSelectedContent()
{
    this.Elements = [];

    this.DrawingObjects = [];
    this.Comments       = [];
    this.Maths          = [];

    this.SaveNumberingValues = false;

    this.HaveShape        = false;
    this.MoveDrawing      = false; // Только для переноса автофигур
    this.HaveMath         = false;
    this.HaveTable        = false;
    this.CanConvertToMath = false;

    this.InsertOptions = {
    	Table : Asc.c_oSpecialPasteProps.overwriteCells
	};


    // Опции для отслеживания переноса
    this.TrackRevisions = false;
    this.MoveTrackId    = null;
    this.MoveTrackRuns  = [];
    this.HaveMovedParts = false;

    this.LastSection = null;
}

CSelectedContent.prototype =
{
    Reset : function()
    {
        this.Elements = [];

        this.DrawingObjects = [];
        this.Comments       = [];
        this.Maths          = [];

        this.HaveShape   = false;
        this.MoveDrawing = false; // Только для переноса автофигур
        this.HaveMath    = false;
    },

    Add : function(Element)
    {
        this.Elements.push( Element );
    },

    Set_MoveDrawing : function(Value)
    {
        this.MoveDrawing = Value;
    },

    On_EndCollectElements : function(LogicDocument, bFromCopy)
    {
        // Теперь пройдемся по всем найденным элементам и выясним есть ли автофигуры и комментарии
        var Count = this.Elements.length;

        var isNonParagraph = false;
        for (var Pos = 0; Pos < Count; Pos++)
        {
            var Element = this.Elements[Pos].Element;
            Element.GetAllDrawingObjects(this.DrawingObjects);
            Element.GetAllComments(this.Comments);
            Element.GetAllMaths(this.Maths);

            var nElementType = Element.GetType();

			if (type_Paragraph === nElementType && Count > 1)
				Element.Correct_Content();

			if (type_Table === nElementType)
				this.HaveTable = true;

			if (type_Paragraph !== nElementType)
				isNonParagraph = true;

			Element.MoveCursorToEndPos(false);
        }

        this.HaveMath = (this.Maths.length > 0 ? true : false);

        // Проверка возможности конвертации имеющегося контента в контент для вставки в формулу.
		// Если формулы уже имеются, то ничего не конвертируем.
		if (!this.HaveMath && !isNonParagraph)
		{
			this.CanConvertToMath = true;
		}

        // Относительно картинок нас интересует только наличие автофигур с текстом.
        Count = this.DrawingObjects.length;
        for (var Pos = 0; Pos < Count; Pos++)
        {
            var DrawingObj = this.DrawingObjects[Pos];
            var ShapeType = DrawingObj.GraphicObj.getObjectType();

            if ( AscDFH.historyitem_type_Shape === ShapeType || AscDFH.historyitem_type_GroupShape === ShapeType )
            {
                this.HaveShape = true;
                break;
            }
        }

        // Если у комментария присутствует только начало или конец, тогда такой комментарий мы удяляем отсюда
        var Comments = {};
        Count = this.Comments.length;
        for (var Pos = 0; Pos < Count; Pos++)
        {
            var Element = this.Comments[Pos];

            var Id = Element.Comment.CommentId;
            if ( undefined === Comments[Id] )
                Comments[Id] = {};

            if ( true === Element.Comment.Start )
                Comments[Id].Start = Element.Paragraph;
            else
                Comments[Id].End   = Element.Paragraph;
        }

        // Пробегаемся по найденным комментариям и удаляем те, у которых нет начала или конца
        var NewComments = [];
        for (var Id in Comments)
        {
            var Element = Comments[Id];

            var Para = null;
            if ( undefined === Element.Start && undefined !== Element.End )
                Para = Element.End;
            else if ( undefined !== Element.Start && undefined === Element.End )
                Para = Element.Start;
            else if ( undefined !== Element.Start && undefined !== Element.End )
                NewComments.push(Id);

            if (null !== Para)
            {
                var OldVal = Para.DeleteCommentOnRemove;
                Para.DeleteCommentOnRemove = false;
                Para.RemoveCommentMarks(Id);
                Para.DeleteCommentOnRemove = OldVal;
            }
        }

        if (true !== bFromCopy)
        {
            // Новые комментарии мы дублируем и добавляем в список комментариев
            Count = NewComments.length;
            var Count2 = this.Comments.length;
            var DocumentComments = LogicDocument.Comments;
            for (var Pos = 0; Pos < Count; Pos++)
            {
                var Id = NewComments[Pos];
                var OldComment = DocumentComments.Get_ById(Id);

                if (null !== OldComment)
                {
                    var NewComment = OldComment.Copy();

                    if (History.Is_On())
                    {
                        DocumentComments.Add(NewComment);
                        editor.sync_AddComment(NewComment.Get_Id(), NewComment.Data);

                        // поправим Id в самих элементах AscCommon.ParaComment
                        for (var Pos2 = 0; Pos2 < Count2; Pos2++)
                        {
                            var Element = this.Comments[Pos2].Comment;
                            if (Id === Element.CommentId)
                            {
                                Element.SetCommentId(NewComment.GetId());
                            }
                        }
                    }
                }
            }
        }

        // Ставим метки переноса в начало и конец
        if (this.Elements.length > 0 && LogicDocument && null !== LogicDocument.TrackMoveId && undefined !== LogicDocument.TrackMoveId)
		{
			var isCanMove = !this.IsHaveMovedParts();
			for (var nIndex = 0, nCount = this.Elements.length; nIndex < nCount; ++nIndex)
			{
				if (!this.Elements[nIndex].Element.IsParagraph())
				{
					isCanMove = false;
					break;
				}
			}

			if (LogicDocument.TrackMoveRelocation)
				isCanMove = true;

			if (isCanMove)
			{
				if (LogicDocument.TrackMoveRelocation)
				{
					var oMarks = LogicDocument.GetTrackRevisionsManager().GetMoveMarks(LogicDocument.TrackMoveId);
					if (oMarks)
					{
						oMarks.To.Start.RemoveThisMarkFromDocument();
						oMarks.To.End.RemoveThisMarkFromDocument();
					}
				}

				var oStartElement = this.Elements[0].Element;
				var oEndElement   = this.Elements[this.Elements.length - 1].Element;

				var oStartParagraph = oStartElement.GetFirstParagraph();
				var oEndParagraph   = oEndElement.GetLastParagraph();

				oStartParagraph.AddToContent(0, new CParaRevisionMove(true, false, LogicDocument.TrackMoveId));

				if (oEndParagraph !== oEndElement || this.Elements[this.Elements.length - 1].SelectedAll)
				{
					var oEndRun = oEndParagraph.GetParaEndRun();
					oEndRun.AddAfterParaEnd(new CRunRevisionMove(false, false, LogicDocument.TrackMoveId));

					var oInfo = new CReviewInfo();
					oInfo.Update();
					oInfo.SetMove(Asc.c_oAscRevisionsMove.MoveTo);
					oEndRun.SetReviewTypeWithInfo(reviewtype_Add, oInfo, false);
				}
				else
				{
					oEndParagraph.AddToContent(oEndParagraph.GetElementsCount(), new CParaRevisionMove(false, false, LogicDocument.TrackMoveId));
				}

				for (var nIndex = 0, nCount = this.MoveTrackRuns.length; nIndex < nCount; ++nIndex)
				{
					var oRun = this.MoveTrackRuns[nIndex];
					var oInfo = new CReviewInfo();
					oInfo.Update();
					oInfo.SetMove(Asc.c_oAscRevisionsMove.MoveTo);
					oRun.SetReviewTypeWithInfo(reviewtype_Add, oInfo);
				}
			}
			else
			{
				LogicDocument.TrackMoveId = null;
			}
		}
    }
};
CSelectedContent.prototype.SetInsertOptionForTable = function(nType)
{
	this.InsertOptions.Table = nType;
};
/**
 * Converts current content to ParaMath if it possible. Doesn't change current SelectedContent.
 * @returns {?AscCommonWord.ParaMath}
 * */
CSelectedContent.prototype.ConvertToMath = function()
{
	if (!this.CanConvertToMath)
		return null;

	var oParaMath = new AscCommonWord.ParaMath();
	oParaMath.Root.Remove_FromContent(0, oParaMath.Root.GetElementsCount());

	for (var nParaIndex = 0, nParasCount = this.Elements.length, nRunPos = 0; nParaIndex < nParasCount; ++nParaIndex)
	{
		var oParagraph = this.Elements[nParaIndex].Element;
		if (type_Paragraph !== oParagraph.GetType())
			continue;

		for (var nInParaPos = 0; nInParaPos < oParagraph.GetElementsCount(); ++nInParaPos)
		{
			var oElement = oParagraph.Content[nInParaPos];
			if (para_Run === oElement.GetType())
			{
				var oRun = new ParaRun(oParagraph, true);
				oParaMath.Root.Add_ToContent(nRunPos++, oRun);

				for (var nInRunPos = 0, nCount = oElement.GetElementsCount(); nInRunPos < nCount; ++nInRunPos)
				{
					var oItem = oElement.Content[nInRunPos];
					if (para_Text === oItem.Type)
					{
						if (38 === oItem.Value)
						{
							oRun.Add(new CMathAmp(), true);
						}
						else
						{
							var oMathText = new CMathText(false);
							oMathText.add(oItem.Value);
							oRun.Add(oMathText, true);
						}
					}
					else if (para_Space === oItem.Value)
					{
						var oMathText = new CMathText(false);
						oMathText.add(0x0032);
						oRun.Add(oMathText, true);
					}
				}

				oRun.Apply_Pr(oElement.Get_TextPr());
			}
		}
	}

	oParaMath.Root.Correct_Content(true);
	return oParaMath;
};
/**
 * Устанавливаем, что сейчас происходит перенос во время рецензирования
 * @param {boolean} isTrackRevision
 * @param {string} sMoveId
 */
CSelectedContent.prototype.SetMoveTrack = function(isTrackRevision, sMoveId)
{
	this.TrackRevisions = isTrackRevision;
	this.MoveTrackId    = sMoveId;
};
/**
 * Проверяем собираем ли содержимое для переноса в рецензировании
 * @returns {boolean}
 */
CSelectedContent.prototype.IsMoveTrack = function()
{
	return this.MoveTrackId !== null;
};
/**
 * @returns {boolean}
 */
CSelectedContent.prototype.IsTrackRevisions = function()
{
	return this.TrackRevisions;
};
/**
 * Добавляем ран, который участвует в переносе
 * @param {ParaRun} oRun
 */
CSelectedContent.prototype.AddRunForMoveTrack = function(oRun)
{
	this.MoveTrackRuns.push(oRun);
};
/**
 * Устанавливаем есть ли в содержимом текст перенесенный во время рецензирования
 * @param {boolean} isHave
 */
CSelectedContent.prototype.SetMovedParts = function(isHave)
{
	this.HaveMovedParts = isHave;
};
/**
 * Запрашиваем, есть ли перенесенная во время рецензирования часть
 * @returns {boolean}
 */
CSelectedContent.prototype.IsHaveMovedParts = function()
{
	return this.HaveMovedParts;
};
/**
 * Запоминаем секцию, на которой закончилось выделение (если оно было в основной части документа)
 * @param {CSectionPr} oSectPr
 */
CSelectedContent.prototype.SetLastSection = function(oSectPr)
{
	this.LastSection = oSectPr;
};
/**
 * Получаем секцию, на которой закончилось выделение
 * @returns {null|CSectionPr}
 */
CSelectedContent.prototype.GetLastSection = function()
{
	return this.LastSection;
};
/**
 * Сохранять значения нумерации
 * @param {boolean} isSave
 */
CSelectedContent.prototype.SetSaveNumberingValues = function(isSave)
{
	this.SaveNumberingValues = isSave;
};
/**
 * Заппрашиваем, нужно ли сохранять расчитанные значения нумерации
 * @returns {boolean}
 */
CSelectedContent.prototype.IsSaveNumberingValues = function()
{
	return this.SaveNumberingValues;
};
/**
 * Конвертируем элементы в один элемент с простым текстом
 */
CSelectedContent.prototype.ConvertToText = function()
{
	var oParagraph = new Paragraph(editor.WordControl.m_oDrawingDocument);

	var sText = "";
	for (var nIndex = 0, nCount = this.Elements.length; nIndex < nCount; ++nIndex)
	{
		var oElement = this.Elements[nIndex].Element;
		if (oElement.IsParagraph())
			sText += oElement.GetText();
	}

	var oRun = new ParaRun(oParagraph, null);
	oRun.AddText(sText);
	oParagraph.AddToContent(0, oRun);

	this.Elements.length = 0;
	this.Elements.push(new CSelectedElement(oParagraph, false));
};
CSelectedContent.prototype.CreateNewCommentsGuid = function(DocumentComments)
{
	for (var Index = 0; Index < this.Comments.length; Index++)
	{
		var comment = DocumentComments.Get_ById(this.Comments[Index].Comment.CommentId);
		if (comment)
		{
			comment.CreateNewCommentsGuid();
		}
	}
};


function CDocumentRecalculateState()
{
    this.Id           = null;

    this.PageIndex    = 0;
    this.SectionIndex = 0;
    this.ColumnIndex  = 0;
    this.Start        = true;
    this.StartIndex   = 0;
    this.StartPage    = 0;

    this.ResetStartElement = false;
    this.MainStartPos      = -1;
}

function CDocumentRecalculateHdrFtrPageCountState()
{
	this.Id        = null;
	this.PageIndex = 0;
	this.PageCount = -1;
}

function Document_Recalculate_Page()
{
    var LogicDocument = editor.WordControl.m_oLogicDocument;
    LogicDocument.Recalculate_Page();
}

function Document_Recalculate_HdrFtrPageCount()
{
	var LogicDocument = editor.WordControl.m_oLogicDocument;
	LogicDocument.private_RecalculateHdrFtrPageCountUpdate();
}

function CDocumentPageSection()
{
    this.Pos    = 0;
    this.EndPos = -1;

    this.Y      = 0;
    this.YLimit = 0;

    this.YLimit2 = 0;

    this.Columns = [];
    this.ColumnsSep = false;

    this.IterationsCount       = 0;
    this.CurrentY              = 0;
    this.RecalculateBottomLine = true;
    this.CanDecrease           = true;
    this.WasIncrease           = false; // Было ли хоть раз увеличение
    this.IterationStep         = 10;
    this.IterationDirection    = 0;
}
/**
 * Инициализируем параметры данной секции
 * @param {number} nPageAbs
 * @param {CSectionPr} oSectPr
 */
CDocumentPageSection.prototype.Init = function(nPageAbs, oSectPr)
{
	var oFrame  = oSectPr.GetContentFrame(nPageAbs);
	var nX      = oFrame.Left;
	var nXLimit = oFrame.Right;

	for (var nCurColumn = 0, nColumnsCount = oSectPr.GetColumnsCount(); nCurColumn < nColumnsCount; ++nCurColumn)
	{
		this.Columns[nCurColumn] = new CDocumentPageColumn();

		this.Columns[nCurColumn].X      = nX;
		this.Columns[nCurColumn].XLimit = nColumnsCount - 1 === nCurColumn ? nXLimit : nX + oSectPr.GetColumnWidth(nCurColumn);

		nX += oSectPr.GetColumnWidth(nCurColumn) + oSectPr.GetColumnSpace(nCurColumn);
	}
	this.ColumnsSep = oSectPr.GetColumnSep();

	this.Y       = oFrame.Top;
	this.YLimit  = oFrame.Bottom;
	this.YLimit2 = oFrame.Bottom;
};
CDocumentPageSection.prototype.Copy = function()
{
    var NewSection = new CDocumentPageSection();

    NewSection.Pos    = this.Pos;
    NewSection.EndPos = this.EndPos;
    NewSection.Y      = this.Y;
    NewSection.YLimit = this.YLimit;

    for (var ColumnIndex = 0, Count = this.Columns.length; ColumnIndex < Count; ++ColumnIndex)
    {
		NewSection.Columns[ColumnIndex] = this.Columns[ColumnIndex].Copy();
    }

    return NewSection;
};
CDocumentPageSection.prototype.Shift = function(Dx, Dy)
{
    this.Y      += Dy;
    this.YLimit += Dy;

    for (var ColumnIndex = 0, Count = this.Columns.length; ColumnIndex < Count; ++ColumnIndex)
    {
        this.Columns[ColumnIndex].Shift(Dx, Dy);
    }
};
/**
 * Происходи ли процесс расчета нижней границы разрыва секции на текущей странице
 * @returns {boolean}
 */
CDocumentPageSection.prototype.IsCalculatingSectionBottomLine = function()
{
    return (this.IterationsCount > 0 && true === this.RecalculateBottomLine);
};
/**
 * Можно ли расчитывать нижнюю границу разрыва секции на текущей странице
 * @returns {boolean}
 */
CDocumentPageSection.prototype.CanRecalculateBottomLine = function()
{
    return this.RecalculateBottomLine;
};
/**
 * Запрещаем возможность расчета нижней границы разрыва секции на текущей страницы
 */
CDocumentPageSection.prototype.ForbidRecalculateBottomLine = function()
{
	this.RecalculateBottomLine = false;
};
CDocumentPageSection.prototype.Get_Y = function()
{
    return this.Y;
};
CDocumentPageSection.prototype.Get_YLimit = function()
{
    if (0 === this.IterationsCount)
        return this.YLimit;
    else
        return this.CurrentY;
};
/**
 * Производим шаг рассчета нижней границы рарзрыва секции
 * @param {boolean} isIncrease
 * @returns {number}
 */
CDocumentPageSection.prototype.IterateBottomLineCalculation = function(isIncrease)
{
	// Алгоритм следующий:
	// На первом шаге мы прогнозируем положение границы по уже имеющемуся объему текста и
	// ширине колонок.
	// Далее мы сдвигаем границу на значение IterationStep, вверх или вниз в зависимости
	// от результата расчета страницы. При перемене направления сдвига мы всегда уменьшаем шаг
	// в 2 раза. Также мы можем уменьшать шаг в 2 раза, если сдвигаем границу вверх, и хотябы
	// раз до этого двигали ее вниз. Останавливаем итерацию при попытке подвинуть границу наверх,
	// когда шаг итерации становится менее 2мм.

	if (0 === this.IterationsCount)
	{
		// Пытаемся заранее спрогнозировать позицию, где должно быть разделение. Учитывая, что колонки могут быть разной
		// ширины, мы расчитываем суммарную занимаемую текстом область. Делим ее по колонкам, с учетом их суммарной
		// ширины.

		var nSumArea = 0, nSumWidth = 0;
		for (var nColumnIndex = 0, nColumnsCount = this.Columns.length; nColumnIndex < nColumnsCount; ++nColumnIndex)
		{
			var oColumn = this.Columns[nColumnIndex];
			if (true !== oColumn.Empty)
				nSumArea += (oColumn.Bounds.Bottom - this.Y) * (oColumn.XLimit - oColumn.X);

			nSumWidth += oColumn.XLimit - oColumn.X;
		}

		if (nSumWidth > 0.001)
			this.CurrentY = this.Y + nSumArea / nSumWidth;
		else
			this.CurrentY = this.Y;
	}
	else
	{
		if (false === isIncrease)
		{
			if (this.IterationDirection > 0 || this.WasIncrease)
				this.IterationStep /= 2;

			this.CurrentY -= this.IterationStep;
			this.IterationDirection = -1;

			if (this.CurrentY < this.Y)
			{
				// Такое может быть, когда у нас всего одна строка в начале страницы, которую мы размещаем всегда
				this.CurrentY    = this.Y;
				this.CanDecrease = false;
			}
		}
		else
		{
			if (this.IterationDirection < 0)
				this.IterationStep /= 2;

			this.CurrentY += this.IterationStep;
			this.IterationDirection = 1;

			this.WasIncrease = true;
		}
	}

	if (this.IterationStep < 2)
		this.CanDecrease = false;

	this.CurrentY = Math.min(this.CurrentY, this.YLimit2);

	this.IterationsCount++;
	return this.CurrentY;
};
CDocumentPageSection.prototype.Reset_Columns = function()
{
    for (var ColumnIndex = 0, Count = this.Columns.length; ColumnIndex < Count; ++ColumnIndex)
    {
        this.Columns[ColumnIndex].Reset();
    }
};
/**
 * Можем ли мы провести еще одну итерацию с уменьшением нижней границы
 * @returns {boolean}
 */
CDocumentPageSection.prototype.CanDecreaseBottomLine = function()
{
	return this.CanDecrease;
};

function CDocumentPageColumn()
{
    this.Bounds = new CDocumentBounds(0, 0, 0, 0);
    this.Pos    = 0;
    this.EndPos = -1;
    this.Empty  = true;

    this.X      = 0;
    this.Y      = 0;
    this.XLimit = 0;
    this.YLimit = 0;

    this.SpaceBefore = 0;
    this.SpaceAfter  = 0;
}
CDocumentPageColumn.prototype.Copy = function()
{
    var NewColumn = new CDocumentPageColumn();

    NewColumn.Bounds.CopyFrom(this.Bounds);
    NewColumn.Pos    = this.Pos;
    NewColumn.EndPos = this.EndPos;
    NewColumn.X      = this.X;
    NewColumn.Y      = this.Y;
    NewColumn.XLimit = this.XLimit;
    NewColumn.YLimit = this.YLimit;

    return NewColumn;
};
CDocumentPageColumn.prototype.Shift = function(Dx, Dy)
{
    this.X      += Dx;
    this.XLimit += Dx;
    this.Y      += Dy;
    this.YLimit += Dy;

    this.Bounds.Shift(Dx, Dy);
};
CDocumentPageColumn.prototype.Reset = function()
{
    this.Bounds.Reset();
    this.Pos    = 0;
    this.EndPos = -1;
    this.Empty  = true;

    this.X      = 0;
    this.Y      = 0;
    this.XLimit = 0;
    this.YLimit = 0;
};
CDocumentPageColumn.prototype.IsEmpty = function()
{
	return this.Empty;
};

function CDocumentPage()
{
    this.Width   = 0;
    this.Height  = 0;
    this.Margins =
    {
        Left   : 0,
        Right  : 0,
        Top    : 0,
        Bottom : 0
    };

    this.Bounds = new CDocumentBounds(0,0,0,0);
    this.Pos    = 0;
    this.EndPos = 0;

    this.X      = 0;
    this.Y      = 0;
    this.XLimit = 0;
    this.YLimit = 0;

    this.Sections = [];

    this.EndSectionParas = [];

    this.ResetStartElement = false;
}

CDocumentPage.prototype.Update_Limits = function(Limits)
{
    this.X      = Limits.X;
    this.XLimit = Limits.XLimit;
    this.Y      = Limits.Y;
    this.YLimit = Limits.YLimit;
};
CDocumentPage.prototype.Shift = function(Dx, Dy)
{
    this.X      += Dx;
    this.XLimit += Dx;
    this.Y      += Dy;
    this.YLimit += Dy;

    this.Bounds.Shift(Dx, Dy);

    for (var SectionIndex = 0, Count = this.Sections.length; SectionIndex < Count; ++SectionIndex)
    {
        this.Sections[SectionIndex].Shift(Dx, Dy);
    }
};
CDocumentPage.prototype.Check_EndSectionPara = function(Element)
{
    var Count = this.EndSectionParas.length;
    for ( var Index = 0; Index < Count; Index++ )
    {
        if ( Element === this.EndSectionParas[Index] )
            return true;
    }

    return false;
};
CDocumentPage.prototype.Copy = function()
{
    var NewPage = new CDocumentPage();

    NewPage.Width          = this.Width;
    NewPage.Height         = this.Height;
    NewPage.Margins.Left   = this.Margins.Left;
    NewPage.Margins.Right  = this.Margins.Right;
    NewPage.Margins.Top    = this.Margins.Top;
    NewPage.Margins.Bottom = this.Margins.Bottom;

    NewPage.Bounds.CopyFrom(this.Bounds);
    NewPage.Pos    = this.Pos;
    NewPage.EndPos = this.EndPos;
    NewPage.X      = this.X;
    NewPage.Y      = this.Y;
    NewPage.XLimit = this.XLimit;
    NewPage.YLimit = this.YLimit;

    for (var SectionIndex = 0, Count = this.Sections.length; SectionIndex < Count; ++SectionIndex)
    {
        NewPage.Sections[SectionIndex] = this.Sections[SectionIndex].Copy();
    }

    return NewPage;
};

function CStatistics(LogicDocument)
{
    this.LogicDocument = LogicDocument;
    this.Api           = LogicDocument.Get_Api();

    this.Id       = null; // Id таймера для подсчета всего кроме страниц
    this.PagesId  = null; // Id таймера для подсчета страниц

    this.StartPos = 0;

    this.Pages           = 0;
    this.Words           = 0;
    this.Paragraphs      = 0;
    this.SymbolsWOSpaces = 0;
    this.SymbolsWhSpaces = 0;
}

CStatistics.prototype =
{
//-----------------------------------------------------------------------------------
// Функции для запуска и остановки сбора статистики
//-----------------------------------------------------------------------------------
    Start : function()
    {
        this.StartPos = 0;
        this.CurPage  = 0;

        this.Pages           = 0;
        this.Words           = 0;
        this.Paragraphs      = 0;
        this.SymbolsWOSpaces = 0;
        this.SymbolsWhSpaces = 0;


        var LogicDocument = this.LogicDocument;
        this.PagesId = setTimeout(function(){LogicDocument.Statistics_GetPagesInfo();}, 1);
        this.Id      = setTimeout(function(){LogicDocument.Statistics_GetParagraphsInfo();}, 1);
        this.Send();
    },

    Next_ParagraphsInfo : function(StartPos)
    {
        this.StartPos = StartPos;
        var LogicDocument = this.LogicDocument;
        clearTimeout(this.Id);
        this.Id = setTimeout(function(){LogicDocument.Statistics_GetParagraphsInfo();}, 1);
        this.Send();
    },

    Next_PagesInfo : function()
    {
        var LogicDocument = this.LogicDocument;
        clearTimeout(this.PagesId);
        this.PagesId = setTimeout(function(){LogicDocument.Statistics_GetPagesInfo();}, 100);
        this.Send();
    },

    Stop_PagesInfo : function()
    {
        if (null !== this.PagesId)
        {
            clearTimeout(this.PagesId);
            this.PagesId = null;
        }

        this.Check_Stop();
    },

    Stop_ParagraphsInfo : function()
    {
        if (null != this.Id)
        {
            clearTimeout(this.Id);
            this.Id = null;
        }

        this.Check_Stop();
    },

    Check_Stop : function()
    {
        if (null === this.Id && null === this.PagesId)
        {
            this.Send();
            this.Api.sync_GetDocInfoEndCallback();
        }
    },

    Send : function()
    {
        var Stats =
        {
            PageCount      : this.Pages,
            WordsCount     : this.Words,
            ParagraphCount : this.Paragraphs,
            SymbolsCount   : this.SymbolsWOSpaces,
            SymbolsWSCount : this.SymbolsWhSpaces
        };

        this.Api.sync_DocInfoCallback(Stats);
    },
//-----------------------------------------------------------------------------------
// Функции для пополнения статистики
//-----------------------------------------------------------------------------------
    Add_Paragraph : function (Count)
    {
        if ( "undefined" != typeof( Count ) )
            this.Paragraphs += Count;
        else
            this.Paragraphs++;
    },

    Add_Word : function(Count)
    {
        if ( "undefined" != typeof( Count ) )
            this.Words += Count;
        else
            this.Words++;
    },

    Update_Pages : function(PagesCount)
    {
        this.Pages = PagesCount;
    },

    Add_Symbol : function(bSpace)
    {
        this.SymbolsWhSpaces++;
        if ( true != bSpace )
            this.SymbolsWOSpaces++;
    }
};

function CDocumentRecalcInfo()
{
    this.FlowObject                = null;   // Текущий float-объект, который мы пересчитываем
    this.FlowObjectPageBreakBefore = false;  // Нужно ли перед float-объектом поставить pagebreak
    this.FlowObjectPage            = 0;      // Количество обработанных страниц
    this.FlowObjectElementsCount   = 0;      // Количество элементов подряд идущих в рамке (только для рамок)
    this.RecalcResult              = recalcresult_NextElement;

    this.WidowControlParagraph     = null;   // Параграф, который мы пересчитываем из-за висячих строк
    this.WidowControlLine          = -1;     // Номер строки, перед которой надо поставить разрыв страницы
    this.WidowControlReset         = false;  //

    this.KeepNextParagraph         = null;    // Параграф, который надо пересчитать из-за того, что следующий начался с новой страницы
    this.KeepNextEndParagraph      = null;    // Параграф, на котором определилось, что нужно делать пересчет предыдущих

    this.FrameRecalc               = false;   // Пересчитываем ли рамку
    this.ParaMath                  = null;

    this.FootnoteReference         = null;    // Ссылка на сноску, которую мы пересчитываем
    this.FootnotePage              = 0;
    this.FootnoteColumn            = 0;

    this.AdditionalInfo            = null;

    this.NeedRecalculateFromStart  = false;
}

CDocumentRecalcInfo.prototype =
{
    Reset : function()
    {
        this.FlowObject                = null;
        this.FlowObjectPageBreakBefore = false;
        this.FlowObjectPage            = 0;
        this.FlowObjectElementsCount   = 0;
        this.RecalcResult              = recalcresult_NextElement;

        this.WidowControlParagraph     = null;
        this.WidowControlLine          = -1;
        this.WidowControlReset         = false;

        this.KeepNextParagraph         = null;
        this.KeepNextEndParagraph      = null;

        this.ParaMath                  = null;

        this.FootnoteReference         = null;
        this.FootnotePage              = 0;
        this.FootnoteColumn            = 0;
    },

    Can_RecalcObject : function()
    {
        if (null === this.FlowObject && null === this.WidowControlParagraph && null === this.KeepNextParagraph && null == this.ParaMath && null === this.FootnoteReference)
            return true;

        return false;
    },

    Can_RecalcWidowControl : function()
    {
        // TODO: Пока нельзя отдельно проверять объекты, вызывающие пересчет страниц, потому что возможны зависания.
        //       Надо обдумать новую более грамотную схему, при которой можно будет вызывать независимые пересчеты заново.
        return this.Can_RecalcObject();
    },

    Set_FlowObject : function(Object, RelPage, RecalcResult, ElementsCount, AdditionalInfo)
    {
        this.FlowObject              = Object;
        this.FlowObjectPage          = RelPage;
        this.FlowObjectElementsCount = ElementsCount;
        this.RecalcResult            = RecalcResult;
        this.AdditionalInfo          = AdditionalInfo;
    },

    Set_ParaMath : function(Object)
    {
        this.ParaMath = Object;
    },

    Check_ParaMath: function(ParaMath)
    {
        if ( ParaMath === this.ParaMath )
            return true;

        return false;
    },

    Check_FlowObject : function(FlowObject)
    {
        if ( FlowObject === this.FlowObject )
            return true;

        return false;
    },

    Set_PageBreakBefore : function(Value)
    {
        this.FlowObjectPageBreakBefore = Value;
    },

    Is_PageBreakBefore : function()
    {
        return this.FlowObjectPageBreakBefore;
    },

    Set_KeepNext : function(Paragraph, EndParagraph)
    {
        this.KeepNextParagraph    = Paragraph;
        this.KeepNextEndParagraph = EndParagraph;
    },

    Check_KeepNext : function(Paragraph)
    {
        if ( Paragraph === this.KeepNextParagraph )
            return true;

        return false;
    },

    Check_KeepNextEnd : function(Paragraph)
    {
        if (Paragraph === this.KeepNextEndParagraph)
            return true;

        return false;
    },

    Need_ResetWidowControl : function()
    {
        this.WidowControlReset = true;
    },

    Reset_WidowControl : function()
    {
        if (true === this.WidowControlReset)
        {
            this.WidowControlParagraph = null;
            this.WidowControlLine      = -1;
            this.WidowControlReset     = false;
        }
    },

    Set_WidowControl : function(Paragraph, Line)
    {
        this.WidowControlParagraph = Paragraph;
        this.WidowControlLine      = Line;
    },

    Check_WidowControl : function(Paragraph, Line)
    {
        if (Paragraph === this.WidowControlParagraph && Line === this.WidowControlLine)
            return true;

        return false;
    },

    Set_FrameRecalc  : function(Value)
    {
        this.FrameRecalc = Value;
    },

    Set_FootnoteReference : function(oFootnoteReference, nPageAbs, nColumnAbs)
    {
        this.FootnoteReference = oFootnoteReference;
        this.FootnotePage      = nPageAbs;
		this.FootnoteColumn    = nColumnAbs;
    },

    Check_FootnoteReference : function(oFootnoteReference)
    {
        return (this.FootnoteReference === oFootnoteReference ? true : false);
    },

    Reset_FootnoteReference : function()
    {
        this.FootnoteReference         = null;
		this.FootnotePage              = 0;
		this.FootnoteColumn            = 0;
		this.FlowObjectPageBreakBefore = false;
    },

	Set_NeedRecalculateFromStart : function(isNeedRecalculate)
	{
		this.NeedRecalculateFromStart = isNeedRecalculate;
	},

	Is_NeedRecalculateFromStart : function()
	{
		return this.NeedRecalculateFromStart;
	}

};

function CDocumentFieldsManager()
{
	this.m_aFields = [];

	this.m_oMailMergeFields = {};

	this.m_aComplexFields = [];
	this.m_oCurrentComplexField = null;
}

CDocumentFieldsManager.prototype.Register_Field = function(oField)
{
    this.m_aFields.push(oField);

    var nFieldType = oField.Get_FieldType();
    if (fieldtype_MERGEFIELD === nFieldType)
    {
        var sName = oField.Get_Argument(0);
        if (undefined !== sName)
        {
            if (undefined === this.m_oMailMergeFields[sName])
                this.m_oMailMergeFields[sName] = [];

            this.m_oMailMergeFields[sName].push(oField);
        }
    }
};
CDocumentFieldsManager.prototype.Update_MailMergeFields = function(Map)
{
    for (var FieldName in this.m_oMailMergeFields)
    {
        for (var Index = 0, Count = this.m_oMailMergeFields[FieldName].length; Index < Count; Index++)
        {
            var oField = this.m_oMailMergeFields[FieldName][Index];
            oField.Map_MailMerge(Map[FieldName]);
        }
    }
};
CDocumentFieldsManager.prototype.Replace_MailMergeFields = function(Map)
{
    for (var FieldName in this.m_oMailMergeFields)
    {
        for (var Index = 0, Count = this.m_oMailMergeFields[FieldName].length; Index < Count; Index++)
        {
            var oField = this.m_oMailMergeFields[FieldName][Index];
            oField.Replace_MailMerge(Map[FieldName]);
        }
    }
};
CDocumentFieldsManager.prototype.Restore_MailMergeTemplate = function()
{
    if (true === AscCommon.CollaborativeEditing.Is_SingleUser())
    {
        // В такой ситуации мы восстанавливаем стандартный текст полей. Чтобы это сделать нам сначала надо пробежаться
        // по всем таким полям, определить параграфы, в которых необходимо восстановить поля. Залочить эти параграфы,
        // и произвести восстановление полей.

        var FieldsToRestore    = [];
        var FieldsRemain       = [];
        var ParagrapsToRestore = [];
        for (var FieldName in this.m_oMailMergeFields)
        {
            for (var Index = 0, Count = this.m_oMailMergeFields[FieldName].length; Index < Count; Index++)
            {
                var oField = this.m_oMailMergeFields[FieldName][Index];
                var oFieldPara = oField.GetParagraph();

                if (oFieldPara && oField.Is_NeedRestoreTemplate())
                {
                    var bNeedAddPara = true;
                    for (var ParaIndex = 0, ParasCount = ParagrapsToRestore.length; ParaIndex < ParasCount; ParaIndex++)
                    {
                        if (oFieldPara === ParagrapsToRestore[ParaIndex])
                        {
                            bNeedAddPara = false;
                            break;
                        }
                    }
                    if (true === bNeedAddPara)
                        ParagrapsToRestore.push(oFieldPara);

                    FieldsToRestore.push(oField);
                }
                else
                {
                    FieldsRemain.push(oField);
                }
            }
        }

        var LogicDocument = (ParagrapsToRestore.length > 0 ? ParagrapsToRestore[0].LogicDocument : null);
        if (LogicDocument && false === LogicDocument.Document_Is_SelectionLocked(changestype_None, { Type : changestype_2_ElementsArray_and_Type, Elements : ParagrapsToRestore, CheckType : changestype_Paragraph_Content }))
        {
            LogicDocument.StartAction(AscDFH.historydescription_Document_RestoreFieldTemplateText);
            for (var nIndex = 0, nCount = FieldsToRestore.length; nIndex < nCount; nIndex++)
            {
                var oField = FieldsToRestore[nIndex];
                oField.Restore_StandardTemplate();
            }

            for (var nIndex = 0, nCount = FieldsRemain.length; nIndex < nCount; nIndex++)
            {
                var oField = FieldsRemain[nIndex];
                oField.Restore_Template();
            }
            LogicDocument.FinalizeAction();
        }
        else
        {
            // Восстанавливать ничего не надо просто возващаем значения тимплейтов
            for (var FieldName in this.m_oMailMergeFields)
            {
                for (var Index = 0, Count = this.m_oMailMergeFields[FieldName].length; Index < Count; Index++)
                {
                    var oField = this.m_oMailMergeFields[FieldName][Index];
                    oField.Restore_Template();
                }
            }
        }
    }
    else
    {
        for (var FieldName in this.m_oMailMergeFields)
        {
            for (var Index = 0, Count = this.m_oMailMergeFields[FieldName].length; Index < Count; Index++)
            {
                var oField = this.m_oMailMergeFields[FieldName][Index];
                oField.Restore_Template();
            }
        }
    }
};
CDocumentFieldsManager.prototype.GetAllFieldsByType = function(nType)
{
	var arrFields = [];
	for (var nIndex = 0, nCount = this.m_aFields.length; nIndex < nCount; ++nIndex)
	{
		var oField = this.m_aFields[nIndex];
		if (nType === oField.Get_FieldType() && oField.Is_UseInDocument())
		{
			arrFields.push(oField);
		}
	}
	return arrFields;
};
CDocumentFieldsManager.prototype.RegisterComplexField = function(oComplexField)
{
	this.m_aComplexFields.push(oComplexField);
};
CDocumentFieldsManager.prototype.GetCurrentComplexField = function()
{
	return this.m_oCurrentComplexField;
};
CDocumentFieldsManager.prototype.SetCurrentComplexField = function(oComplexField)
{
	if (this.m_oCurrentComplexField === oComplexField)
		return false;

	if (this.m_oCurrentComplexField)
		this.m_oCurrentComplexField.SetCurrent(false);

	this.m_oCurrentComplexField = oComplexField;

	if (this.m_oCurrentComplexField)
		this.m_oCurrentComplexField.SetCurrent(true);

	return true;
};

var selected_None              = -1;
var selected_DrawingObject     = 0;
var selected_DrawingObjectText = 1;

function CSelectedElementsInfo(oPr)
{
	this.m_bSkipTOC = !!(oPr && oPr.SkipTOC);
	this.m_bCheckAllSelection = !!(oPr && oPr.CheckAllSelection); // Проверять все выделение, или только 1 элемент

	this.m_bTable             = false; // Находится курсор или выделение целиком в какой-нибудь таблице
	this.m_bMixedSelection    = false; // Попадает ли в выделение одновременно несколько элементов
	this.m_nDrawing           = selected_None;
	this.m_pParagraph         = null;  // Параграф, в котором находится выделение
	this.m_oMath              = null;  // Формула, в которой находится выделение
	this.m_oHyperlink         = null;  // Гиперссылка, в которой находится выделение
	this.m_oField             = null;  // Поле, в котором находится выделение
	this.m_oCell              = null;  // Выделенная ячейка (специальная ситуация, когда выделена ровно одна ячейка)
	this.m_oBlockLevelSdt     = null;  // Если мы находимся в классе CBlockLevelSdt
	this.m_oInlineLevelSdt    = null;  // Если мы находимся в классе CInlineLevelSdt (важно, что мы находимся внутри класса)
	this.m_bSdtOverDrawing    = false; // Последний контент контрол обернут вокруг Drawing
	this.m_arrSdts            = [];    // Список всех контейнеров, попавших в селект
	this.m_arrComplexFields   = [];
	this.m_oPageNum           = null;
	this.m_oPagesCount        = null;
	this.m_bReviewAdd         = false; // Добавленный контент в режиме рецензирования
	this.m_bReviewRemove      = false; // Удаленный контент в режиме рецензирования
	this.m_bReviewNormal      = false; // Обычный контент
	this.m_oPresentationField = null;
	this.m_arrMoveMarks       = [];

    this.Reset = function()
    {
        this.m_bSelection      = false;
        this.m_bTable          = false;
        this.m_bMixedSelection = false;
        this.m_nDrawing        = -1;
    };

    this.Set_Math = function(Math)
    {
        this.m_oMath = Math;
    };

    this.Set_Field = function(Field)
    {
        this.m_oField = Field;
    };

    this.Get_Math = function()
    {
        return this.m_oMath;
    };

    this.Get_Field = function()
    {
        return this.m_oField;
    };

    this.Set_Table = function()
    {
        this.m_bTable = true;
    };

    this.Set_Drawing = function(nDrawing)
    {
        this.m_nDrawing = nDrawing;

		this.m_bSdtOverDrawing = true;
    };

    this.Is_DrawingObjSelected = function()
    {
        return ( this.m_nDrawing === selected_DrawingObject ? true : false );
    };

    this.Set_MixedSelection = function()
    {
        this.m_bMixedSelection = true;
    };

    this.Is_InTable = function()
    {
        return this.m_bTable;
    };

    this.Is_MixedSelection = function()
    {
        return this.m_bMixedSelection;
    };

    this.Set_SingleCell = function(Cell)
    {
        this.m_oCell = Cell;
    };

    this.Get_SingleCell = function()
    {
        return this.m_oCell;
    };
}
CSelectedElementsInfo.prototype.IsSkipTOC = function()
{
	return this.m_bSkipTOC;
};
CSelectedElementsInfo.prototype.SetParagraph = function(Para)
{
	this.m_pParagraph = Para;
};
CSelectedElementsInfo.prototype.GetParagraph = function()
{
	return this.m_pParagraph;
};
CSelectedElementsInfo.prototype.SetBlockLevelSdt = function(oSdt)
{
	this.m_oBlockLevelSdt = oSdt;
	this.m_arrSdts.push(oSdt);
	this.m_bSdtOverDrawing = false;
};
/**
 * @returns {?CBlockLevelSdt}
 */
CSelectedElementsInfo.prototype.GetBlockLevelSdt = function()
{
	return this.m_oBlockLevelSdt;
};
CSelectedElementsInfo.prototype.SetInlineLevelSdt = function(oSdt)
{
	this.m_oInlineLevelSdt = oSdt;
	this.m_arrSdts.push(oSdt);
	this.m_bSdtOverDrawing = false;
};
/**
 * @returns {?CInlineLevelSdt}
 */
CSelectedElementsInfo.prototype.GetInlineLevelSdt = function()
{
	return this.m_oInlineLevelSdt;
};
CSelectedElementsInfo.prototype.IsSdtOverDrawing = function()
{
	return this.m_bSdtOverDrawing;
};
CSelectedElementsInfo.prototype.GetAllSdts = function()
{
	return this.m_arrSdts;
};
CSelectedElementsInfo.prototype.CanDeleteBlockSdts = function()
{
	for (var nIndex = 0, nCount = this.m_arrSdts.length; nIndex < nCount; ++nIndex)
	{
		if (this.m_arrSdts[nIndex].IsBlockLevel() && !this.m_arrSdts[nIndex].CanBeDeleted() && this.m_arrSdts[nIndex].IsSelectedAll())
			return false;
	}

	return true;
};
CSelectedElementsInfo.prototype.CanEditBlockSdts = function()
{
	for (var nIndex = 0, nCount = this.m_arrSdts.length; nIndex < nCount; ++nIndex)
	{
		var isSkip = this.m_arrSdts[nIndex].IsSkipSpecialContentControlLock();
		this.m_arrSdts[nIndex].SkipSpecialContentControlLock(true);

		if (this.m_arrSdts[nIndex].IsBlockLevel() && !this.m_arrSdts[nIndex].CanBeEdited())
		{
			this.m_arrSdts[nIndex].SkipSpecialContentControlLock(isSkip);
			return false;
		}

		this.m_arrSdts[nIndex].SkipSpecialContentControlLock(isSkip);
	}

	return true;
};
CSelectedElementsInfo.prototype.CanDeleteInlineSdts = function()
{
	for (var nIndex = 0, nCount = this.m_arrSdts.length; nIndex < nCount; ++nIndex)
	{
		if (this.m_arrSdts[nIndex].IsInlineLevel() && !this.m_arrSdts[nIndex].CanBeDeleted() && this.m_arrSdts[nIndex].IsSelectedAll())
			return false;
	}

	return true;
};
CSelectedElementsInfo.prototype.CanEditInlineSdts = function()
{
	for (var nIndex = 0, nCount = this.m_arrSdts.length; nIndex < nCount; ++nIndex)
	{
		var isSkip = this.m_arrSdts[nIndex].IsSkipSpecialContentControlLock();
		this.m_arrSdts[nIndex].SkipSpecialContentControlLock(true);

		if (this.m_arrSdts[nIndex].IsInlineLevel() && !this.m_arrSdts[nIndex].CanBeEdited())
		{
			this.m_arrSdts[nIndex].SkipSpecialContentControlLock(isSkip);
			return false;
		}

		this.m_arrSdts[nIndex].SkipSpecialContentControlLock(isSkip);
	}

	return true;
};
CSelectedElementsInfo.prototype.SetComplexFields = function(arrComplexFields)
{
	this.m_arrComplexFields = arrComplexFields;
};
CSelectedElementsInfo.prototype.GetComplexFields = function()
{
	return this.m_arrComplexFields;
};
CSelectedElementsInfo.prototype.GetTableOfContents = function()
{
	for (var nIndex = this.m_arrComplexFields.length - 1; nIndex >= 0; --nIndex)
	{
		var oComplexField = this.m_arrComplexFields[nIndex];
		var oInstruction  = oComplexField.GetInstruction();

		if (AscCommonWord.fieldtype_TOC === oInstruction.GetType())
			return oComplexField;
	}

	if (this.m_oBlockLevelSdt && this.m_oBlockLevelSdt.IsBuiltInTableOfContents())
		return this.m_oBlockLevelSdt;

	return null;
};
CSelectedElementsInfo.prototype.SetHyperlink = function(oHyperlink)
{
	this.m_oHyperlink = oHyperlink;
};
CSelectedElementsInfo.prototype.GetHyperlink = function()
{
	if (this.m_oHyperlink)
		return this.m_oHyperlink;

	for (var nIndex = 0, nCount = this.m_arrComplexFields.length; nIndex < nCount; ++nIndex)
	{
		var oInstruction = this.m_arrComplexFields[nIndex].GetInstruction();
		if (oInstruction && (fieldtype_HYPERLINK === oInstruction.GetType() || fieldtype_REF === oInstruction.GetType()))
			return oInstruction;
	}

	return null;
};
CSelectedElementsInfo.prototype.SetPageNum = function(oElement)
{
	this.m_oPageNum = oElement;
};
CSelectedElementsInfo.prototype.GetPageNum = function()
{
	return this.m_oPageNum;
};
CSelectedElementsInfo.prototype.SetPagesCount = function(oElement)
{
	this.m_oPagesCount = oElement;
};
CSelectedElementsInfo.prototype.GetPagesCount = function()
{
	return this.m_oPagesCount;
};
CSelectedElementsInfo.prototype.IsCheckAllSelection = function()
{
	return this.m_bCheckAllSelection;
};
CSelectedElementsInfo.prototype.RegisterRunWithReviewType = function(nReviewType)
{
	switch (nReviewType)
	{
		case reviewtype_Add: this.m_bReviewAdd = true; break;
		case reviewtype_Remove : this.m_bReviewRemove = true; break;
		case reviewtype_Common: this.m_bReviewNormal = true; break;

	}
};
CSelectedElementsInfo.prototype.HaveAddedInReview = function()
{
	return this.m_bReviewAdd;
};
CSelectedElementsInfo.prototype.HaveRemovedInReview = function()
{
	return this.m_bReviewRemove;
};
CSelectedElementsInfo.prototype.HaveNotReviewedContent = function()
{
	return this.m_bReviewNormal;
};
CSelectedElementsInfo.prototype.SetPresentationField = function(oField)
{
	this.m_oPresentationField = oField;
};
CSelectedElementsInfo.prototype.GetPresentationField = function()
{
	return this.m_oPresentationField;
};
CSelectedElementsInfo.prototype.RegisterTrackMoveMark = function(oMoveMark)
{
	this.m_arrMoveMarks.push(oMoveMark);
};
CSelectedElementsInfo.prototype.GetTrackMoveMarks = function()
{
	return this.m_arrMoveMarks;
};

var document_compatibility_mode_Word11  = 11;
var document_compatibility_mode_Word12  = 12;
var document_compatibility_mode_Word14  = 14;
var document_compatibility_mode_Word15  = 15;

var document_compatibility_mode_Current = document_compatibility_mode_Word12;

function CDocumentSettings()
{
    this.MathSettings      = undefined !== CMathSettings ? new CMathSettings() : {};
    this.CompatibilityMode = document_compatibility_mode_Current;
    this.SdtSettings       = new CSdtGlobalSettings();

    this.ListSeparator = undefined;
    this.DecimalSymbol = undefined;
    this.GutterAtTop   = false;
    this.MirrorMargins = false;

    // Compatibility
    this.SplitPageBreakAndParaMark = false;
	this.DoNotExpandShiftReturn    = false;
}

/**
 * Основной класс для работы с документом в Word.
 * @param DrawingDocument
 * @param isMainLogicDocument
 * @constructor
 * @extends {CDocumentContentBase}
 */
function CDocument(DrawingDocument, isMainLogicDocument)
{
	CDocumentContentBase.call(this);

    //------------------------------------------------------------------------------------------------------------------
    //  Сохраняем ссылки на глобальные объекты
    //------------------------------------------------------------------------------------------------------------------
    this.History              = History;
    this.IdCounter            = AscCommon.g_oIdCounter;
    this.TableId              = g_oTableId;
    this.CollaborativeEditing = (("undefined" !== typeof(AscCommon.CWordCollaborativeEditing) && AscCommon.CollaborativeEditing instanceof AscCommon.CWordCollaborativeEditing) ? AscCommon.CollaborativeEditing : null);
    this.Api                  = editor;
    //------------------------------------------------------------------------------------------------------------------
    //  Выставляем ссылки на главный класс
    //------------------------------------------------------------------------------------------------------------------
    if (false !== isMainLogicDocument)
    {
        if (this.History)
            this.History.Set_LogicDocument(this);

        if (this.CollaborativeEditing)
            this.CollaborativeEditing.m_oLogicDocument = this;
    }
    //__________________________________________________________________________________________________________________

    this.Id = this.IdCounter.Get_NewId();
	//Props
	this.App = null;
	this.Core = null;

    // Сначала настраиваем размеры страницы и поля
    this.SectPr = new CSectionPr(this);
    this.SectionsInfo = new CDocumentSectionsInfo();

    this.Content[0] = new Paragraph(DrawingDocument, this);
    this.Content[0].Set_DocumentNext(null);
    this.Content[0].Set_DocumentPrev(null);

    this.Settings = new CDocumentSettings();

    this.CurPos  =
    {
        X          : 0,
        Y          : 0,
        ContentPos : 0, // в зависимости, от параметра Type: позиция в Document.Content
        RealX      : 0, // позиция курсора, без учета расположения букв
        RealY      : 0, // это актуально для клавиш вверх и вниз
        Type       : docpostype_Content
    };

	this.Selection =
    {
        Start    : false,
        Use      : false,
        StartPos : 0,
        EndPos   : 0,
        Flag     : selectionflag_Common,
        Data     : null,
        UpdateOnRecalc : false,
		WordSelected : false,
        DragDrop : { Flag : 0, Data : null }  // 0 - не drag-n-drop, и мы его проверяем, 1 - drag-n-drop, -1 - не проверять drag-n-drop
    };

	this.Action = {
		Start           : false,
		Depth           : 0,
		PointsCount     : 0,
		Recalculate     : false,
		UpdateSelection : false,
		UpdateInterface : false,
		UpdateRulers    : false,
		UpdateUndoRedo  : false,
		Redraw          : {
			Start : undefined,
			End   : undefined
		},

		Additional : {}
	};

    if (false !== isMainLogicDocument)
        this.ColumnsMarkup = new CColumnsMarkup();

    // Здесь мы храним инфрмацию, связанную с разбивкой на страницы и самими страницами
    this.Pages = [];

    this.RecalcInfo = new CDocumentRecalcInfo();

    this.RecalcId     = 0; // Номер пересчета
    this.FullRecalc   = new CDocumentRecalculateState(); // Объект полного пересчета
    this.HdrFtrRecalc = new CDocumentRecalculateHdrFtrPageCountState(); // Объект дополнительного пересчета колонтитулов после полного пересчета

    this.TurnOffRecalc          = 0;
    this.TurnOffInterfaceEvents = false;
    this.TurnOffRecalcCurPos    = false;

    this.CheckEmptyElementsOnSelection = true; // При выделении проверять или нет пустой параграф в конце/начале выделения.

    this.Numbering = new CNumbering();
    this.Styles    = new CStyles();
    this.Styles.Set_LogicDocument(this);

    this.DrawingDocument = DrawingDocument;

    this.NeedUpdateTarget = false;

    // Флаг, который контролирует нужно ли обновлять наш курсор у остальных редакторов нашего документа.
    // Также следим за частотой обновления, чтобы оно проходило не чаще одного раза в секунду.
    this.NeedUpdateTargetForCollaboration = true;
    this.LastUpdateTargetTime             = 0;

    this.ReindexStartPos = 0;

    // Класс для работы с колонтитулами
    this.HdrFtr = new CHeaderFooterController(this, this.DrawingDocument);

    // Класс для работы с поиском
    this.SearchInfo =
    {
        Id       : null,
        StartPos : 0,
        CurPage  : 0,
        String   : null
    };

    // Позция каретки
    this.TargetPos =
    {
        X       : 0,
        Y       : 0,
        PageNum : 0
    };

    this.CopyTextPr = null; // TextPr для копирования по образцу
    this.CopyParaPr = null; // ParaPr для копирования по образцу

    // Класс для работы со статискикой документа
    this.Statistics = new CStatistics( this );

    this.HighlightColor = null;

    if(typeof AscCommon.CComments !== "undefined")
        this.Comments = new AscCommon.CComments();

    this.Lock = new AscCommon.CLock();

    this.m_oContentChanges = new AscCommon.CContentChanges(); // список изменений(добавление/удаление элементов)

    // Массив укзателей на все инлайновые графические объекты
    this.DrawingObjects = null;

    if (typeof CGraphicObjects !== "undefined")
        this.DrawingObjects = new CGraphicObjects(this, this.DrawingDocument, this.Api);

    this.theme          = AscFormat.GenerateDefaultTheme(this);
    this.clrSchemeMap   = AscFormat.GenerateDefaultColorMap();

    // Класс для работы с поиском и заменой в документе
    this.SearchEngine = null;
    if (typeof CDocumentSearch !== "undefined")
        this.SearchEngine = new CDocumentSearch();

    // Параграфы, в которых есть ошибки в орфографии (объект с ключом - Id параграфа)
    this.Spelling = new CDocumentSpelling();

    // Дополнительные настройки
	this.ForceHideCCTrack          = false; // Насильно запрещаем отрисовку рамок у ContentControl
    this.UseTextShd                = true;  // Использовать ли заливку текста
    this.ForceCopySectPr           = false; // Копировать ли настройки секции, если родительский класс параграфа не документ
    this.CopyNumberingMap          = null;  // Мап старый индекс -> новый индекс для копирования нумерации
    this.CheckLanguageOnTextAdd    = false; // Проверять ли язык при добавлении текста в ран
	this.RemoveCommentsOnPreDelete = true;  // Удалять ли комментарий при удалении объекта
	this.CheckInlineSdtOnDelete    = null;  // Проверяем заданный InlineSdt на удалении символов внутри него
	this.DragAndDropAction         = false; // Происходит ли сейчас действие drag-n-drop
	this.RecalcTableHeader         = false; // Пересчитываем ли сейчас заголовок таблицы
	this.TrackMoveId               = null;  // Идентификатор переноса внутри рецензирования
	this.TrackMoveRelocation       = false; // Перенос ранее перенесенного текста внутри рецензирования
	this.RemoveEmptySelection      = true;  // При обновлении селекта, если он пустой тогда сбрасываем его
	this.MoveDrawing               = false; // Происходит ли сейчас перенос автофигуры
	this.PrintSelection            = false; // Печатаем выделенный фрагмент

	this.DrawTableMode = {
		Start  : false,
		Draw   : false,
		Erase  : false,
		StartX : -1,
		StartY : -1,
		EndX   : -1,
		EndY   : -1,
		Page   : -1,

		TablesOnPage   : [],
		Table          : null,
		TablePageStart : -1,
		TablePageEnd   : -1,

		UpdateTablePages : function()
		{
			if (this.Table)
			{
				var nPageStart = this.Page;
				var nPageEnd   = this.Page;

				if (!(this.Table.Parent instanceof CDocument))
				{
					nPageStart = this.Table.Parent.GetPageIndexByXYAndPageAbs(this.StartX, this.StartY, this.Page);
					nPageEnd   = this.Table.Parent.GetPageIndexByXYAndPageAbs(this.EndX, this.EndY, this.Page);
				}

				this.TablePageStart = this.Table.Parent.private_GetElementPageIndexByXY(this.Table.GetIndex(), this.StartX, this.StartY, nPageStart);
				this.TablePageEnd   = this.Table.Parent.private_GetElementPageIndexByXY(this.Table.GetIndex(), this.EndX, this.EndY, nPageEnd);
			}
			else
			{
				this.TablePageStart = -1;
				this.TablePageEnd   = -1;
			}
		},

		CheckSelectedTable : function()
		{
			var nStartX = this.StartX;
			var nEndX   = this.EndX;

			if (nEndX < nStartX)
			{
				nStartX = this.EndX;
				nEndX   = this.StartX;
			}

			var nStartY = this.StartY;
			var nEndY   = this.EndY;

			if (nEndY < nStartY)
			{
				nStartY = this.EndY;
				nEndY   = this.StartY;
			}

			if (this.Erase)
			{
				this.Table = null;

				var arrTables = this.TablesOnPage;
				for (var nTableIndex = 0, nTablesCount = arrTables.length; nTableIndex < nTablesCount; ++nTableIndex)
				{
					var oBounds = arrTables[nTableIndex].Table.GetPageBounds(arrTables[nTableIndex].Page);

					if (((nStartX < oBounds.Left && oBounds.Left < nEndX) || (nStartX < oBounds.Right && oBounds.Right < nEndX))
						&& ((nStartY < oBounds.Top && oBounds.Top < nEndY) || (nStartY < oBounds.Bottom && oBounds.Bottom < nEndY)))
					{
						this.Table = arrTables[nTableIndex].Table;
						return;
					}

					if ((((oBounds.Left < nStartX && nStartX < oBounds.Right) || (oBounds.Left < nEndX && nEndX < oBounds.Right))
						&& ((oBounds.Top < nStartY && nStartY < oBounds.Bottom) || (oBounds.Top < nEndY && nEndY < oBounds.Bottom)))
						|| (oBounds.Left < nStartX && nEndX < oBounds.Right && nStartY < oBounds.Top && oBounds.Bottom < nEndY)
						|| (nStartX < oBounds.Left && oBounds.Right < nEndX && oBounds.Top < nStartY && nEndY < oBounds.Bottom))
					{
						this.Table = arrTables[nTableIndex].Table;
					}
				}
			}
		}
	};

	// Параметры для случая, когда мы не можем сразу перерисовать треки и нужно перерисовывать их на таймере пересчета
	this.NeedUpdateTracksOnRecalc = false;
	this.NeedUpdateTracksParams   = {
		Selection      : false,
		EmptySelection : false
	};

    // Мап для рассылки
    this.MailMergeMap             = null;
    this.MailMergePreview         = false;
    this.MailMergeFieldsHighlight = false; // Подсвечивать ли все поля связанные с рассылкой
    this.MailMergeFields          = [];

    // Класс, управляющий полями
    this.FieldsManager = new CDocumentFieldsManager();

    // Класс, управляющий закладками
	if (typeof CBookmarksManager !== "undefined")
		this.BookmarksManager = new CBookmarksManager(this);

    // Режим рецензирования
    this.TrackRevisions = false;
    this.TrackRevisionsManager = new CTrackRevisionsManager(this);

    this.DocumentOutline = new CDocumentOutline(this);

    this.AutoCorrectSettings = {
    	SmartQuotes            : true,
		HyphensWithDash        : true,
    	AutomaticBulletedLists : true,
		AutomaticNumberedLists : true
	};

    // Контролируем изменения интерфейса
    this.ChangedStyles      = []; // Объект с Id стилями, которые были изменены/удалены/добавлены
	this.TurnOffPanelStyles = 0;  // == 0 - можно обновлять панельку со стилями, != 0 - нельзя обновлять

    // Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
    this.TableId.Add(this, this.Id);

	// Объект для составного ввода текста
	this.CompositeInput = null;

	// Нужно ли проверять тип лока у ContentControl при проверке залоченности выделенных объектов
	this.CheckContentControlsLock = true;

	this.ViewModeInReview = {
		mode                : 0,     // -1 - исходный, 0 - со всеми изменениями, 1 - результат
		isFastCollaboration : false
	};

	this.LastBulletList   = undefined; // Последний примененный маркированный список
	this.LastNumberedList = undefined; // Последний примененный нумерованный список

	// Класс для работы со сносками
	this.Footnotes               = new CFootnotesController(this);
	this.LogicDocumentController = new CLogicDocumentController(this);
	this.DrawingsController      = new CDrawingsController(this, this.DrawingObjects);
	this.HeaderFooterController  = new CHdrFtrController(this, this.HdrFtr);

	this.Controller = this.LogicDocumentController;

    this.StartTime = 0;

    // Кэш для некоторых запросов, которые могут за раз делаться несколько раз
    this.AllParagraphsList = null;
    this.AllFootnotesList  = null;

	//------------------------------------------------------------------------------------------------------------------
	//  Check StartCollaborationEditing
	//------------------------------------------------------------------------------------------------------------------
	if (this.CollaborativeEditing && !this.CollaborativeEditing.Is_SingleUser())
	{
		this.StartCollaborationEditing();
	}
	//__________________________________________________________________________________________________________________
}
CDocument.prototype = Object.create(CDocumentContentBase.prototype);
CDocument.prototype.constructor = CDocument;

CDocument.prototype.Init                           = function()
{

};
CDocument.prototype.On_EndLoad                     = function()
{
    // Обновляем информацию о секциях
    this.UpdateAllSectionsInfo();

    // Проверяем последний параграф на наличие секции
    this.Check_SectionLastParagraph();

    // Специальная проверка плохо заданных нумераций через стиль. Когда ссылка на нумерацию в стиле есть,
    // а обратной ссылки в нумерации на стиль - нет.
    this.Styles.Check_StyleNumberingOnLoad(this.Numbering);

    // Перемещаем курсор в начало документа
    this.MoveCursorToStartPos(false);

    if (editor.DocInfo)
    {
        var TemplateReplacementData = editor.DocInfo.get_TemplateReplacement();
        if (null !== TemplateReplacementData)
        {
            this.private_ProcessTemplateReplacement(TemplateReplacementData);
        }
    }
    if (null !== this.CollaborativeEditing)
    {
        this.Set_FastCollaborativeEditing(true);
    }
};
CDocument.prototype.Add_TestDocument               = function()
{
    this.Content   = [];
    var Text       = ["Comparison view helps you track down memory leaks, by displaying which objects have been correctly cleaned up by the garbage collector. Generally used to record and compare two (or more) memory snapshots of before and after an operation. The idea is that inspecting the delta in freed memory and reference count lets you confirm the presence and cause of a memory leak.", "Containment view provides a better view of object structure, helping us analyse objects referenced in the global namespace (i.e. window) to find out what is keeping them around. It lets you analyse closures and dive into your objects at a low level.", "Dominators view helps confirm that no unexpected references to objects are still hanging around (i.e that they are well contained) and that deletion/garbage collection is actually working."];
    var ParasCount = 50;
    var RunsCount  = Text.length;
    for (var ParaIndex = 0; ParaIndex < ParasCount; ParaIndex++)
    {
        var Para = new Paragraph(this.DrawingDocument, this);
        //var Run = new ParaRun(Para);
        for (var RunIndex = 0; RunIndex < RunsCount; RunIndex++)
        {

            var String    = Text[RunIndex];
            var StringLen = String.length;
            for (var TextIndex = 0; TextIndex < StringLen; TextIndex++)
            {
                var Run         = new ParaRun(Para);
                var TextElement = String[TextIndex];

                Run.AddText(TextElement);
                Para.AddToContent(0, Run);
            }


        }
        //Para.Add_ToContent(0, Run);
        this.Internal_Content_Add(this.Content.length, Para);
    }

	this.RecalculateFromStart(true);
};
CDocument.prototype.LoadEmptyDocument              = function()
{
    this.DrawingDocument.TargetStart();
    this.Recalculate();

    this.Interface_Update_ParaPr();
    this.Interface_Update_TextPr();
};
CDocument.prototype.Set_CurrentElement = function(Index, bUpdateStates)
{
	var OldDocPosType = this.CurPos.Type;

	var ContentPos = Math.max(0, Math.min(this.Content.length - 1, Index));

	this.SetDocPosType(docpostype_Content);
	this.CurPos.ContentPos = Math.max(0, Math.min(this.Content.length - 1, Index));

	this.Reset_WordSelection();
	if (true === this.Content[ContentPos].IsSelectionUse())
	{
		this.Selection.Flag     = selectionflag_Common;
		this.Selection.Use      = true;
		this.Selection.StartPos = ContentPos;
		this.Selection.EndPos   = ContentPos;
	}
	else
		this.RemoveSelection();

	if (false != bUpdateStates)
	{
		this.Document_UpdateInterfaceState();
		this.Document_UpdateRulersState();
		this.Document_UpdateSelectionState();
	}

	if (docpostype_HdrFtr === OldDocPosType)
	{
		this.DrawingDocument.ClearCachePages();
		this.DrawingDocument.FirePaint();
	}
};
CDocument.prototype.Is_ThisElementCurrent          = function()
{
    return true;
};
CDocument.prototype.Get_PageContentStartPos = function(PageIndex, ElementIndex)
{
	if (undefined === ElementIndex && undefined !== this.Pages[PageIndex])
		ElementIndex = this.Pages[PageIndex].Pos;

	var oSectPr = this.SectionsInfo.Get_SectPr(ElementIndex).SectPr;

	var oFrame = oSectPr.GetContentFrame(PageIndex);

	var Y      = oFrame.Top;
	var YLimit = oFrame.Bottom;
	var X      = oFrame.Left;
	var XLimit = oFrame.Right;

	var HdrFtrLine = this.HdrFtr.GetHdrFtrLines(PageIndex);

	var YHeader = HdrFtrLine.Top;
	if (null !== YHeader && YHeader > Y && oSectPr.GetPageMarginTop() >= 0)
		Y = YHeader;

	var YFooter = HdrFtrLine.Bottom;
	if (null !== YFooter && YFooter < YLimit && oSectPr.GetPageMarginBottom() >= 0)
		YLimit = YFooter;

	return {
		X      : X,
		Y      : Y,
		XLimit : XLimit,
		YLimit : YLimit
	};
};
CDocument.prototype.Get_PageContentStartPos2 = function(StartPageIndex, StartColumnIndex, ElementPageIndex, ElementIndex)
{
	if (undefined === ElementIndex && undefined !== this.Pages[StartPageIndex])
		ElementIndex = this.Pages[StartPageIndex].Pos;

	var oSectPr = this.SectionsInfo.Get_SectPr(ElementIndex).SectPr;

	var ColumnsCount = oSectPr.GetColumnsCount();
	var ColumnAbs    = (StartColumnIndex + ElementPageIndex) - ((StartColumnIndex + ElementPageIndex) / ColumnsCount | 0) * ColumnsCount;
	var PageAbs      = StartPageIndex + ((StartColumnIndex + ElementPageIndex) / ColumnsCount | 0);

	var oFrame = oSectPr.GetContentFrame(PageAbs);

	var Y      = oFrame.Top;
	var YLimit = oFrame.Bottom;
	var X      = oFrame.Left;
	var XLimit = oFrame.Right;

	var SectionIndex = this.FullRecalc.SectionIndex;
	if (this.Pages[PageAbs] && this.Pages[PageAbs].Sections[SectionIndex])
	{
		Y      = this.Pages[PageAbs].Sections[SectionIndex].Get_Y();
		YLimit = this.Pages[PageAbs].Sections[SectionIndex].Get_YLimit();
	}

	var HdrFtrLine = this.HdrFtr.GetHdrFtrLines(PageAbs);

	for (var ColumnIndex = 0; ColumnIndex < ColumnAbs; ++ColumnIndex)
	{
		X += oSectPr.GetColumnWidth(ColumnIndex);
		X += oSectPr.GetColumnSpace(ColumnIndex);
	}

	if (ColumnsCount - 1 !== ColumnAbs)
		XLimit = X + oSectPr.Get_ColumnWidth(ColumnAbs);

	var YHeader = HdrFtrLine.Top;
	if (null !== YHeader && YHeader > Y && oSectPr.GetPageMarginTop() >= 0)
		Y = YHeader;

	var YFooter = HdrFtrLine.Bottom;
	if (null !== YFooter && YFooter < YLimit && oSectPr.GetPageMarginBottom() >= 0)
		YLimit = YFooter;

	var ColumnSpaceBefore = (ColumnAbs > 0 ? oSectPr.GetColumnSpace(ColumnAbs - 1) : 0);
	var ColumnSpaceAfter  = (ColumnAbs < ColumnsCount - 1 ? oSectPr.GetColumnSpace(ColumnAbs) : 0);

	return {
		X                 : X,
		Y                 : Y,
		XLimit            : XLimit,
		YLimit            : YLimit,
		ColumnSpaceBefore : ColumnSpaceBefore,
		ColumnSpaceAfter  : ColumnSpaceAfter
	};
};
CDocument.prototype.Get_PageLimits = function(nPageIndex)
{
	var nIndex  = this.Pages[nPageIndex] ? this.Pages[nPageIndex].Pos : 0;
	var oSectPr = this.SectionsInfo.Get_SectPr(nIndex).SectPr;

	return {
		X      : 0,
		Y      : 0,
		XLimit : oSectPr.GetPageWidth(),
		YLimit : oSectPr.GetPageHeight()
	};
};
CDocument.prototype.Get_PageFields = function(nPageIndex)
{
	var nIndex  = this.Pages[nPageIndex] ? this.Pages[nPageIndex].Pos : 0;
	var oSectPr = this.SectionsInfo.Get_SectPr(nIndex).SectPr;
	var oFrame  = oSectPr.GetContentFrame(nPageIndex);

	return {
		X      : oFrame.Left,
		Y      : oFrame.Top,
		XLimit : oFrame.Right,
		YLimit : oFrame.Bottom
	};
};
CDocument.prototype.Get_ColumnFields = function(nElementIndex, nColumnIndex, nPageIndex)
{
	if (undefined === nElementIndex)
	{
		if (!this.Page[nPageIndex])
		{
			return {
				X      : 0,
				XLimit : 0
			};
		}

		nPageIndex = this.Pages[nPageIndex].Pos;
	}

	var oSectPr = this.SectionsInfo.Get_SectPr(nElementIndex).SectPr;
	var oFrame  = oSectPr.GetContentFrame(nPageIndex);

	var X      = oFrame.Left;
	var XLimit = oFrame.Right;

	var ColumnsCount = oSectPr.GetColumnsCount();
	if (nColumnIndex >= ColumnsCount)
		nColumnIndex = ColumnsCount - 1;

	for (var ColIndex = 0; ColIndex < nColumnIndex; ++ColIndex)
	{
		X += oSectPr.GetColumnWidth(ColIndex);
		X += oSectPr.GetColumnSpace(ColIndex);
	}

	if (ColumnsCount - 1 !== nColumnIndex)
		XLimit = X + oSectPr.GetColumnWidth(nColumnIndex);

	return {
		X      : X,
		XLimit : XLimit
	};
};
CDocument.prototype.Get_Theme                      = function()
{
    return this.theme;
};
CDocument.prototype.GetTheme = function()
{
	return this.Get_Theme();
};
CDocument.prototype.Get_ColorMap                   = function()
{
    return this.clrSchemeMap;
};
CDocument.prototype.GetColorMap = function()
{
	return this.Get_ColorMap();
};
/**
 * Начинаем новое действие, связанное с изменением документа
 * @param {number} nDescription
 * @param {object} [oSelectionState=null] - начальное состояние селекта, до начала действия
 */
CDocument.prototype.StartAction = function(nDescription, oSelectionState)
{
	var isNewPoint = this.History.Create_NewPoint(nDescription, oSelectionState);

	if (true === this.Action.Start)
	{
		this.Action.Depth++;

		if (isNewPoint)
			this.Action.PointsCount++;
	}
	else
	{
		this.Action.Start           = true;
		this.Action.Depth           = 0;
		this.Action.PointsCount     = isNewPoint ? 1 : 0;
		this.Action.Recalculate     = false;
		this.Action.UpdateSelection = false;
		this.Action.UpdateInterface = false;
		this.Action.UpdateRulers    = false;
		this.Action.UpdateUndoRedo  = false;
		this.Action.UpdateTracks    = false;
		this.Action.Redraw.Start    = undefined;
		this.Action.Redraw.End      = undefined;
		this.Action.Additional      = {};
	}
};
/**
 * В процессе ли какое-либо действие
 * @returns {boolean}
 */
CDocument.prototype.IsActionInProgress = function()
{
	return this.Action.Start;
};
/**
 * Сообщаем документу, что потребуется пересчет
 * @param {boolean} [isForceRecalculate = false] Запускать ли пересчет прямо сейчас
 */
CDocument.prototype.Recalculate = function(isForceRecalculate)
{
	if (this.Action.Start && true !== isForceRecalculate)
		this.Action.Recalculate = true;
	else
		this.private_Recalculate();
};
/**
 * Сообщаем документу, что потребуется обновить состояние селекта
 * @param {boolean} [isRemoveEmptySelection = true]
 */
CDocument.prototype.UpdateSelection = function(isRemoveEmptySelection)
{
	if (false === isRemoveEmptySelection)
	{
		this.RemoveEmptySelection = false;
		this.private_UpdateSelection();
		this.RemoveEmptySelection = true;
	}
	else if (this.Action.Start)
	{
		this.Action.UpdateSelection = true;
	}
	else
	{
		this.private_UpdateSelection();
	}
};
/**
 * Сообщаем документу, что потребуется обновить состояние интерфейса
 * @param {?boolean} bSaveCurRevisionChange
 */
CDocument.prototype.UpdateInterface = function(bSaveCurRevisionChange)
{
	if (undefined !== bSaveCurRevisionChange)
		this.private_UpdateInterface(bSaveCurRevisionChange);
	else if (this.Action.Start)
		this.Action.UpdateInterface = true;
	else
		this.private_UpdateInterface();
};
/**
 * Сообщаем документу, что потребуется обновить линейки
 */
CDocument.prototype.UpdateRulers = function()
{
	if (this.Action.Start)
		this.Action.UpdateRulers = true;
	else
		this.private_UpdateRulers();
};
/**
 * Сообщаем документу, что потребуется обновить состояние кнопки Unddo/Redo
 */
CDocument.prototype.UpdateUndoRedo = function()
{
	if (this.Action.Start)
		this.Action.UpdateUndoRedo = true;
	else
		this.private_UpdateUndoRedo();
};
/**
 * Сообщаем документу, что нужно обновить треки
 */
CDocument.prototype.UpdateTracks = function()
{
	if (this.Action.Start)
		this.Action.UpdateTracks = true;
	else
		this.private_UpdateDocumentTracks();
};
/**
 * Перерисовываем заданные страницы
 * @param {number} nStartPage
 * @param {number} nEndPage
 */
CDocument.prototype.Redraw = function(nStartPage, nEndPage)
{
	if (this.Action.Start)
	{
		if (undefined !== nStartPage && undefined !== nEndPage && -1 !== this.Action.Redraw.Start)
		{
			if (undefined === this.Action.Redraw.Start || nStartPage < this.Action.Redraw.Start)
				this.Action.Redraw.Start = nStartPage;

			if (undefined === this.Action.Redraw.End || nEndPage > this.Action.Redraw.End)
				this.Action.Redraw.End = nEndPage;
		}
		else
		{
			this.Action.Redraw.Start = -1;
			this.Action.Redraw.End   = -1;
		}
	}
	else
	{
		this.private_Redraw(nStartPage, nEndPage);
	}
};
CDocument.prototype.private_Redraw = function(nStartPage, nEndPage)
{
	if (-1 !== nStartPage && -1 !== nEndPage)
	{
		var _nStartPage = Math.max(0, nStartPage);
		var _nEndPage   = Math.min(this.DrawingDocument.m_lCountCalculatePages - 1, nEndPage);

		for (var nCurPage = _nStartPage; nCurPage <= _nEndPage; ++nCurPage)
			this.DrawingDocument.OnRepaintPage(nCurPage);
	}
	else
	{
		this.DrawingDocument.ClearCachePages();
		this.DrawingDocument.FirePaint();
	}
};
/**
 * Завершаем действие
 * @param {boolean} [isCheckEmptyAction=true] Нужно ли проверять, что действие ничего не делало
 */
CDocument.prototype.FinalizeAction = function(isCheckEmptyAction)
{
	if (!this.Action.Start)
		return;

	if (this.Action.Depth > 0)
	{
		// Если на каждое действие создавалась точка, но последнее действие оказалось пустым
		if (this.Action.Depth + 1 === this.Action.PointsCount && this.History.Is_LastPointEmpty())
		{
			this.History.Remove_LastPoint();
			this.Action.PointsCount--;
		}

		this.Action.Depth--;
		return;
	}

	// Дополнительная обработка-----------------------------------------------------------------------------------------
	if (this.Action.Additional.TrackMove)
		this.private_FinalizeRemoveTrackMove();

	if (this.TrackMoveId)
		this.private_FinalizeCheckTrackMove();

	//------------------------------------------------------------------------------------------------------------------

	var isAllPointsEmpty = true;
	if (false !== isCheckEmptyAction)
	{
		for (var nIndex = 0, nPointsCount = this.Action.PointsCount; nIndex < nPointsCount; ++nIndex)
		{
			if (this.History.Is_LastPointEmpty())
			{
				this.History.Remove_LastPoint();
			}
			else
			{
				isAllPointsEmpty = false;
				break;
			}
		}
	}
	else
	{
		isAllPointsEmpty = false;
	}

	if (!isAllPointsEmpty)
	{
		if (this.Action.Recalculate)
		{
			this.private_Recalculate();
		}
		else if (undefined !== this.Action.Redraw.Start && undefined !== this.Action.Redraw.End)
		{
			this.private_Redraw(this.Action.Redraw.Start, this.Action.Redraw.End);
		}
	}

	if (this.Action.UpdateInterface)
		this.private_UpdateInterface();

	if (this.Action.UpdateSelection)
		this.private_UpdateSelection();

	if (this.Action.UpdateRulers)
		this.private_UpdateRulers();

	if (this.Action.UpdateUndoRedo)
		this.private_UpdateUndoRedo();

	if (this.Action.UpdateTracks)
		this.private_UpdateDocumentTracks();

	this.Action.Start           = false;
	this.Action.Depth           = 0;
	this.Action.PointsCount     = 0;
	this.Action.Recalculate     = false;
	this.Action.UpdateSelection = false;
	this.Action.UpdateInterface = false;
	this.Action.UpdateRulers    = false;
	this.Action.UpdateUndoRedo  = false;
	this.Action.UpdateTracks    = false;
	this.Action.Redraw.Start    = undefined;
	this.Action.Redraw.End      = undefined;
	this.Action.Additional      = {};
};
CDocument.prototype.private_FinalizeRemoveTrackMove = function()
{
	for (var sMoveId in this.Action.Additional.TrackMove)
	{
		var oMarks = this.Action.Additional.TrackMove[sMoveId];

		if (oMarks)
		{
			if (oMarks.To.Start)
				oMarks.To.Start.RemoveThisMarkFromDocument();

			if (oMarks.To.End)
				oMarks.To.End.RemoveThisMarkFromDocument();

			if (oMarks.From.Start)
				oMarks.From.Start.RemoveThisMarkFromDocument();

			if (oMarks.From.End)
				oMarks.From.End.RemoveThisMarkFromDocument();
		}

		this.Action.Recalculate = true;
	}
};
CDocument.prototype.private_FinalizeCheckTrackMove = function()
{
	var sMoveId = this.TrackMoveId;
	var oMarks  = this.TrackRevisionsManager.GetMoveMarks(sMoveId);

	if (oMarks
		&& (!oMarks.To.Start
		|| !oMarks.To.Start.IsUseInDocument()
		|| !oMarks.To.End
		|| !oMarks.To.End.IsUseInDocument()
		|| !oMarks.From.Start
		|| !oMarks.From.Start.IsUseInDocument()
		|| !oMarks.From.End
		|| !oMarks.From.End.IsUseInDocument()))
	{
		// TODO: Вообще лучше переделать схему, потому что она не всегда правильно работает
		//       Если удаляемый элемент попадает в ранее добавленный текст, тогда и метка удалится, хотя такого быть не
		//       должно

		this.TrackMoveId = null;
		this.RemoveTrackMoveMarks(sMoveId);

		if (oMarks.To.Start)
			oMarks.To.Start.RemoveThisMarkFromDocument();

		if (oMarks.To.End)
			oMarks.To.End.RemoveThisMarkFromDocument();

		if (oMarks.From.Start)
			oMarks.From.Start.RemoveThisMarkFromDocument();

		if (oMarks.From.End)
			oMarks.From.End.RemoveThisMarkFromDocument();

		this.Action.Recalculate = true;
	}
};
/**
 * Данная функция предназначена для отключения пересчета. Это может быть полезно, т.к. редактор всегда запускает
 * пересчет после каждого действия.
 */
CDocument.prototype.TurnOff_Recalculate = function()
{
    this.TurnOffRecalc++;
};
/**
 * Включаем пересчет, если он был отключен.
 * @param {boolean} bRecalculate Запускать ли пересчет
 */
CDocument.prototype.TurnOn_Recalculate = function(bRecalculate)
{
    this.TurnOffRecalc--;

    if (bRecalculate)
        this.Recalculate();
};
/**
 * Проверяем включен ли пересчет.
 * @returns {boolean}
 */
CDocument.prototype.Is_OnRecalculate = function()
{
    if (0 === this.TurnOffRecalc)
        return true;

    return false;
};
/**
 * Запускаем пересчет документа.
 * @param _RecalcData
 * @param [isForceStrictRecalc=false] {boolean} Запускать ли пересчет первый раз без таймера
 */
CDocument.prototype.private_Recalculate = function(_RecalcData, isForceStrictRecalc)
{
	if (this.RecalcInfo.Is_NeedRecalculateFromStart())
	{
		this.RecalcInfo.Set_NeedRecalculateFromStart(false);
		this.RecalculateFromStart();
		return;
	}

	this.DocumentOutline.Update();

    this.StartTime = new Date().getTime();

    if (true !== this.Is_OnRecalculate())
        return;

    // Останавливаем поиск
    if (false != this.SearchEngine.ClearOnRecalc)
    {
        var bOldSearch = ( this.SearchEngine.Count > 0 ? true : false );

        this.SearchEngine.Clear();

        if (true === bOldSearch)
        {
            editor.sync_SearchEndCallback();

            this.DrawingDocument.ClearCachePages();
            this.DrawingDocument.FirePaint();
        }
    }

    // Обновляем позицию курсора
    this.NeedUpdateTarget = true;

    // Увеличиваем номер пересчета
    this.RecalcId++;

    // Если задан параметр _RecalcData, тогда мы не можем ориентироваться на историю
    if (undefined === _RecalcData)
    {
        // Проверяем можно ли сделать быстрый пересчет
        var SimpleChanges = History.Is_SimpleChanges();
        if (1 === SimpleChanges.length)
        {
            var Run  = SimpleChanges[0].Class;
            var Para = Run.Paragraph;

            var PageIndex = Para.Recalculate_FastRange(SimpleChanges);
            if (-1 !== PageIndex && this.Pages[PageIndex])
            {
                // Если за данным параграфом следовал пустой параграф с новой секцией, тогда его тоже надо пересчитать.
                var NextElement = Para.Get_DocumentNext();
                if (null !== NextElement && true === this.Pages[PageIndex].Check_EndSectionPara(NextElement))
                    this.private_RecalculateEmptySectionParagraph(NextElement, Para, PageIndex, Para.Get_AbsoluteColumn(Para.Get_PagesCount() - 1), Para.Get_ColumnsCount());

                // Перерисуем страницу, на которой произошли изменения
                this.DrawingDocument.OnRecalculatePage(PageIndex, this.Pages[PageIndex]);
                this.DrawingDocument.OnEndRecalculate(false, true);
                History.Reset_RecalcIndex();
                this.private_UpdateCursorXY(true, true);

                if (Para.Parent && Para.Parent.GetTopDocumentContent)
				{
					var oTopDocument = Para.Parent.GetTopDocumentContent();
					if (oTopDocument instanceof CFootEndnote)
						oTopDocument.OnFastRecalculate();
				}

                return;
            }
        }

        // TODO: Тут надо вставить заглушку, что если у нас в долгом пересчете находится страница <= PageIndex + 1,
        //       по отношению к данной, тогда не надо делать быстрый пересчет.
        var SimplePara = History.IsParagraphSimpleChanges();
        if (null !== SimplePara)
        {
            var FastPages      = SimplePara.Recalculate_FastWholeParagraph();
            var FastPagesCount = FastPages.length;

            var bCanRecalc = true;
            for (var Index = 0; Index < FastPagesCount; Index++)
			{
				if (!this.Pages[FastPages[Index]])
				{
					bCanRecalc = false;
					break;
				}
			}

            if (FastPagesCount > 0 && true === bCanRecalc)
            {
                // Если изменения произошли на последней странице параграфа, и за данным параграфом следовал
                // пустой параграф с новой секцией, тогда его тоже надо пересчитать.
                var NextElement  = SimplePara.Get_DocumentNext();
                var LastFastPage = FastPages[FastPagesCount - 1];
                if (null !== NextElement && true === this.Pages[LastFastPage].Check_EndSectionPara(NextElement))
                    this.private_RecalculateEmptySectionParagraph(NextElement, SimplePara, LastFastPage, SimplePara.Get_AbsoluteColumn(SimplePara.Get_PagesCount() - 1), SimplePara.Get_ColumnsCount());

                for (var Index = 0; Index < FastPagesCount; Index++)
                {
                    var PageIndex = FastPages[Index];
                    this.DrawingDocument.OnRecalculatePage(PageIndex, this.Pages[PageIndex]);
                }

                this.DrawingDocument.OnEndRecalculate(false, true);
                History.Reset_RecalcIndex();
                this.private_UpdateCursorXY(true, true);

                if (SimplePara.Parent && SimplePara.Parent.GetTopDocumentContent)
				{
					var oTopDocument = SimplePara.Parent.GetTopDocumentContent();
					if (oTopDocument instanceof CFootEndnote)
						oTopDocument.OnFastRecalculate();
				}

				return;
            }
        }
    }

    //console.log( "Long Recalc " );

    var ChangeIndex = 0;
    var MainChange  = false;

    // Получаем данные об произошедших изменениях
    var RecalcData = History.Get_RecalcData(_RecalcData);

    History.Reset_RecalcIndex();

    this.DrawingObjects.recalculate_(RecalcData.Drawings);
    this.DrawingObjects.recalculateText_(RecalcData.Drawings);

    // 1. Пересчитываем все автофигуры, которые нужно пересчитать. Изменения в них ни на что не влияют.
    for (var GraphIndex = 0; GraphIndex < RecalcData.Flow.length; GraphIndex++)
    {
        RecalcData.Flow[GraphIndex].recalculateDocContent();
    }

    // 2. Просмотрим все колонтитулы, которые подверглись изменениям. Найдем стартовую страницу, с которой надо
    //    запустить пересчет.

    var SectPrIndex = -1;
    for (var HdrFtrIndex = 0; HdrFtrIndex < RecalcData.HdrFtr.length; HdrFtrIndex++)
    {
        var HdrFtr    = RecalcData.HdrFtr[HdrFtrIndex];
        var FindIndex = this.SectionsInfo.Find_ByHdrFtr(HdrFtr);

        if (-1 === FindIndex)
            continue;

        // Колонтитул может быть записан в данной секции, но в ней не использоваться. Нам нужно начинать пересчет
        // с места использования данного колонтитула.

        var SectPr     = this.SectionsInfo.Get_SectPr2(FindIndex).SectPr;
        var HdrFtrInfo = SectPr.GetHdrFtrInfo(HdrFtr);

        if (null !== HdrFtrInfo)
        {
            var bHeader = HdrFtrInfo.Header;
            var bFirst  = HdrFtrInfo.First;
            var bEven   = HdrFtrInfo.Even;

            var CheckSectIndex = -1;

            if (true === bFirst)
            {
                var CurSectIndex = FindIndex;
                var SectCount    = this.SectionsInfo.Elements.length;

                while (CurSectIndex < SectCount)
                {
                    var CurSectPr = this.SectionsInfo.Get_SectPr2(CurSectIndex).SectPr;

                    if (FindIndex === CurSectIndex || null === CurSectPr.GetHdrFtr(bHeader, bFirst, bEven))
                    {
                        if (true === CurSectPr.Get_TitlePage())
                        {
                            CheckSectIndex = CurSectIndex;
                            break;
                        }

                    }
                    else
                    {
                        // Если мы попали сюда, значит данный колонтитул нигде не используется
                        break;
                    }

                    CurSectIndex++;
                }
            }
            else if (true === bEven)
            {
                if (true === EvenAndOddHeaders)
                    CheckSectIndex = FindIndex;
            }
            else
            {
                CheckSectIndex = FindIndex;
            }

            if (-1 !== CheckSectIndex && ( -1 === SectPrIndex || CheckSectIndex < SectPrIndex ))
                SectPrIndex = CheckSectIndex;
        }
    }

	if (-1 === RecalcData.Inline.Pos && -1 === SectPrIndex)
	{
		// Никаких изменений не было ни с самим документом, ни секциями
		ChangeIndex               = -1;
		RecalcData.Inline.PageNum = 0;
	}
	else if (-1 === RecalcData.Inline.Pos)
	{
		// Были изменения только внутри секций
		MainChange = false;

		// Выставляем начало изменений на начало секции
		ChangeIndex               = ( 0 === SectPrIndex ? 0 : this.SectionsInfo.Get_SectPr2(SectPrIndex - 1).Index + 1 );
		RecalcData.Inline.PageNum = 0;
	}
	else if (-1 === SectPrIndex)
	{
		// Изменения произошли только внутри основного документа
		MainChange = true;

		ChangeIndex = RecalcData.Inline.Pos;
	}
	else
	{
		// Изменения произошли и внутри документа, и внутри секций. Смотрим на более ранюю точку начала изменений
		// для секций и основоной части документа.
		MainChange = true;

		ChangeIndex = RecalcData.Inline.Pos;

		var ChangeIndex2 = ( 0 === SectPrIndex ? 0 : this.SectionsInfo.Get_SectPr2(SectPrIndex - 1).Index + 1 );

		if (ChangeIndex2 <= ChangeIndex)
		{
			ChangeIndex               = ChangeIndex2;
			RecalcData.Inline.PageNum = 0;
		}
	}

	// Найдем начальную страницу, с которой мы начнем пересчет
	var StartPage  = 0;
	var StartIndex = 0;

	var isUseTimeout = false;

	if (ChangeIndex < 0 && true === RecalcData.NotesEnd)
	{
		// Сюда мы попадаем при рассчете сносок, которые выходят за пределы самого документа
		StartIndex = this.Content.length;
		StartPage  = RecalcData.NotesEndPage;
		MainChange = true;
	}
	else
	{
		if (ChangeIndex < 0)
		{
			this.DrawingDocument.ClearCachePages();
			this.DrawingDocument.FirePaint();
			return;
		}
		else if (ChangeIndex >= this.Content.length)
		{
			ChangeIndex = this.Content.length - 1;
		}

		// Проверяем предыдущие элементы на наличие параметра KeepNext, но не более, чем на 1 страницу
		var nTempPage  = this.private_GetPageByPos(ChangeIndex);
		var nTempIndex = (-1 !== nTempPage && nTempPage > 1) ? this.Pages[nTempPage - 1].Pos : 0;
		while (ChangeIndex > nTempIndex)
		{
			var PrevElement = this.Content[ChangeIndex - 1];
			if (type_Paragraph === PrevElement.GetType() && PrevElement.IsKeepNext())
			{
				ChangeIndex--;
				RecalcData.Inline.PageNum = PrevElement.Get_AbsolutePage(PrevElement.GetPagesCount());
				// считаем, что изменилась последняя страница
			}
			else
			{
				break;
			}
		}

		var ChangedElement = this.Content[ChangeIndex];
		if (ChangedElement.GetPagesCount() > 0 && -1 !== ChangedElement.GetIndex() && ChangedElement.Get_StartPage_Absolute() < RecalcData.Inline.PageNum - 1)
		{
			StartPage  = ChangedElement.GetStartPageForRecalculate(RecalcData.Inline.PageNum - 1);

			if (!this.FullRecalc.Id || StartPage < this.FullRecalc.PageIndex)
				StartIndex = this.Pages[StartPage].Pos;
			else
				StartIndex = this.FullRecalc.StartIndex;
		}
		else
		{
			var nTempPage = this.private_GetPageByPos(ChangeIndex);
			if (-1 !== nTempPage)
			{
				StartPage  = nTempPage;
				StartIndex = this.Pages[nTempPage].Pos;
			}

			if (ChangeIndex === StartIndex && StartPage < RecalcData.Inline.PageNum)
				StartPage = RecalcData.Inline.PageNum - 1;
		}

		// Если у нас уже начался долгий пересчет, тогда мы его останавливаем, и запускаем новый с текущими параметрами.
		// Здесь возможен случай, когда мы долгий пересчет основной части документа останавливаем из-за пересчета
		// колонтитулов, в этом случае параметр MainContentPos не меняется, и мы будем пересчитывать только колонтитулы
		// либо до страницы, на которой они приводят к изменению основную часть документа, либо до страницы, где
		// остановился предыдущий пересчет.

		if (null != this.FullRecalc.Id)
		{
			// В такой ситуации не надо запускать заново пересчет
			if (this.FullRecalc.StartIndex < StartIndex || (this.FullRecalc.StartIndex === StartIndex && this.FullRecalc.PageIndex <= StartPage))
				return;

			clearTimeout(this.FullRecalc.Id);
			this.FullRecalc.Id = null;
			this.DrawingDocument.OnEndRecalculate(false);
		}
		else if (null !== this.HdrFtrRecalc.Id)
		{
			clearTimeout(this.HdrFtrRecalc.Id);
			this.HdrFtrRecalc.Id = null;
			this.DrawingDocument.OnEndRecalculate(false);
		}
	}

	this.HdrFtrRecalc.PageCount = -1;

    // Очищаем данные пересчета
    this.RecalcInfo.Reset();

    this.FullRecalc.PageIndex         = StartPage;
    this.FullRecalc.SectionIndex      = 0;
    this.FullRecalc.ColumnIndex       = 0;
    this.FullRecalc.StartIndex        = StartIndex;
    this.FullRecalc.Start             = true;
    this.FullRecalc.StartPage         = StartPage;
    this.FullRecalc.ResetStartElement = this.private_RecalculateIsNewSection(StartPage, StartIndex);

    // Если у нас произошли какие-либо изменения с основной частью документа, тогда начинаем его пересчитывать сразу,
    // а если изменения касались только секций, тогда пересчитываем основную часть документа только с того места, где
    // остановился предыдущий пересчет, либо с того места, где изменения секций приводят к пересчету документа.
    if (true === MainChange)
        this.FullRecalc.MainStartPos = StartIndex;

    this.DrawingDocument.OnStartRecalculate(StartPage);


    // TODO: По большому счету всегда можно запускать пересчет с нулевым таймаутом, но сейчас при переносе картинок и
	//       некоторых других действиях нам важно, чтобы пересчет первый раз сработал сразу. Поэтому запускаем пересчет
	//       на таймере ТОЛЬКО если он уже был запущен на таймере до этого. Если избавиться от первого условия, то
	//       запускать на таймере можно будет всегда.
    if (isUseTimeout && !isForceStrictRecalc)
	{
		this.FullRecalc.Id = setTimeout(Document_Recalculate_Page, 0);
	}
    else
	{
		this.Recalculate_Page();
	}
};
/**
 * Запускаем пересчет документа.
 * @param oRecalcData
 * @param [isForceStrictRecalc=false] {boolean} Запускать ли пересчет первый раз без таймера
 */
CDocument.prototype.RecalculateWithParams = function(oRecalcData, isForceStrictRecalc)
{
	this.private_Recalculate(oRecalcData, isForceStrictRecalc);
};
/**
 * Пересчитываем следующую страницу.
 */
CDocument.prototype.Recalculate_Page = function()
{
    var SectionIndex = this.FullRecalc.SectionIndex;
    var PageIndex    = this.FullRecalc.PageIndex;
    var ColumnIndex  = this.FullRecalc.ColumnIndex;
    var bStart       = this.FullRecalc.Start;        // флаг, который говорит о том, рассчитываем мы эту страницу первый раз или нет (за один общий пересчет)
    var StartIndex   = this.FullRecalc.StartIndex;

    if (0 === SectionIndex && 0 === ColumnIndex && true === bStart)
    {
        var OldPage = ( undefined !== this.Pages[PageIndex] ? this.Pages[PageIndex] : null );

        if (true === bStart)
        {
            var Page              = new CDocumentPage();
            this.Pages[PageIndex] = Page;
            Page.Pos              = StartIndex;

            if (true === this.HdrFtr.Recalculate(PageIndex))
                this.FullRecalc.MainStartPos = StartIndex;

            var SectPr = this.SectionsInfo.Get_SectPr(StartIndex).SectPr;
			var oFrame = SectPr.GetContentFrame(PageIndex);

            Page.Width          = SectPr.PageSize.W;
            Page.Height         = SectPr.PageSize.H;
            Page.Margins.Left   = oFrame.Left;
            Page.Margins.Top    = oFrame.Top;
            Page.Margins.Right  = oFrame.Right;
            Page.Margins.Bottom = oFrame.Bottom;

            Page.Sections[0] = new CDocumentPageSection();
            Page.Sections[0].Init(PageIndex, SectPr);
        }

        var Count = this.Content.length;

        // Проверяем нужно ли пересчитывать основную часть документа на данной странице
        var MainStartPos = this.FullRecalc.MainStartPos;
        if (null !== OldPage && ( -1 === MainStartPos || MainStartPos > StartIndex ))
        {
            if (OldPage.EndPos >= Count - 1 && PageIndex - this.Content[Count - 1].Get_StartPage_Absolute() >= this.Content[Count - 1].GetPagesCount() - 1)
            {
                //console.log( "HdrFtr Recalc " + PageIndex );

                this.Pages[PageIndex] = OldPage;
                this.DrawingDocument.OnRecalculatePage(PageIndex, this.Pages[PageIndex]);

                this.private_CheckCurPage();
                this.DrawingDocument.OnEndRecalculate(true);
                this.DrawingObjects.onEndRecalculateDocument(this.Pages.length);

                if (true === this.Selection.UpdateOnRecalc)
                {
                    this.Selection.UpdateOnRecalc = false;
                    this.DrawingDocument.OnSelectEnd();
                }

                this.FullRecalc.Id           = null;
                this.FullRecalc.MainStartPos = -1;

                return;
            }
            else if (undefined !== this.Pages[PageIndex + 1])
            {
                //console.log( "HdrFtr Recalc " + PageIndex );

                // Переходим к следующей странице
                this.Pages[PageIndex] = OldPage;
                this.DrawingDocument.OnRecalculatePage(PageIndex, this.Pages[PageIndex]);

                this.FullRecalc.PageIndex         = PageIndex + 1;
                this.FullRecalc.Start             = true;
                this.FullRecalc.StartIndex        = this.Pages[PageIndex + 1].Pos;
                this.FullRecalc.ResetStartElement = false;

                var CurSectInfo  = this.SectionsInfo.Get_SectPr(this.Pages[PageIndex + 1].Pos);
                var PrevSectInfo = this.SectionsInfo.Get_SectPr(this.Pages[PageIndex].EndPos);

                if (PrevSectInfo !== CurSectInfo)
                    this.FullRecalc.ResetStartElement = true;

                if (window["NATIVE_EDITOR_ENJINE_SYNC_RECALC"] === true)
                {
                    if (PageIndex + 1 > this.FullRecalc.StartPage + 2)
                    {
                        if (window["native"] && window["native"]["WC_CheckSuspendRecalculate"] !== undefined)
                        {
                            //if (window["native"]["WC_CheckSuspendRecalculate"]())
                            //    return;

                            this.FullRecalc.Id = setTimeout(Document_Recalculate_Page, 10);
                            return;
                        }
                    }

                    this.Recalculate_Page();
                    return;
                }

                if (PageIndex + 1 > this.FullRecalc.StartPage + 2)
                {
                    this.FullRecalc.Id = setTimeout(Document_Recalculate_Page, 20);
                }
                else
                    this.Recalculate_Page();

                return;
            }
        }
        else
        {
            if (true === bStart)
            {
                this.Pages.length = PageIndex + 1;

                this.DrawingObjects.createGraphicPage(PageIndex);
                this.DrawingObjects.resetDrawingArrays(PageIndex, this);
            }
        }

        //console.log( "Regular Recalc " + PageIndex );

        var StartPos = this.Get_PageContentStartPos(PageIndex, StartIndex);

		this.Footnotes.Reset(PageIndex, this.SectionsInfo.Get_SectPr(StartIndex).SectPr);

        this.Pages[PageIndex].ResetStartElement = this.FullRecalc.ResetStartElement;
        this.Pages[PageIndex].X                 = StartPos.X;
        this.Pages[PageIndex].XLimit            = StartPos.XLimit;
        this.Pages[PageIndex].Y                 = StartPos.Y;
        this.Pages[PageIndex].YLimit            = StartPos.YLimit;

        this.Pages[PageIndex].Sections[0].Y      = StartPos.Y;
        this.Pages[PageIndex].Sections[0].YLimit = StartPos.YLimit;
        this.Pages[PageIndex].Sections[0].Pos    = StartIndex;
        this.Pages[PageIndex].Sections[0].EndPos = StartIndex;
    }

    this.Recalculate_PageColumn();
};
/**
 * Пересчитываем следующую колоноку.
 */
CDocument.prototype.Recalculate_PageColumn                   = function()
{
    var PageIndex          = this.FullRecalc.PageIndex;
    var SectionIndex       = this.FullRecalc.SectionIndex;
    var ColumnIndex        = this.FullRecalc.ColumnIndex;
    var StartIndex         = this.FullRecalc.StartIndex;
    var bResetStartElement = this.FullRecalc.ResetStartElement;

     // console.log("Page " + PageIndex + " Section " + SectionIndex + " Column " + ColumnIndex + " Element " + StartIndex);
     // console.log(this.RecalcInfo);

    var StartPos = this.Get_PageContentStartPos2(PageIndex, ColumnIndex, 0, StartIndex);

    var X      = StartPos.X;
    var Y      = StartPos.Y;
    var YLimit = StartPos.YLimit;
    var XLimit = StartPos.XLimit;

    var Page        = this.Pages[PageIndex];
    var PageSection = Page.Sections[SectionIndex];
    var PageColumn  = PageSection.Columns[ColumnIndex];

    PageColumn.X           = X;
    PageColumn.XLimit      = XLimit;
    PageColumn.Y           = Y;
    PageColumn.YLimit      = YLimit;
    PageColumn.Pos         = StartIndex;
    PageColumn.Empty       = false;
    PageColumn.SpaceBefore = StartPos.ColumnSpaceBefore;
    PageColumn.SpaceAfter  = StartPos.ColumnSpaceAfter;

    this.Footnotes.ContinueElementsFromPreviousColumn(PageIndex, ColumnIndex, Y, YLimit);

    var SectElement  = this.SectionsInfo.Get_SectPr(StartIndex);
    var SectPr       = SectElement.SectPr;
    var ColumnsCount = SectPr.Get_ColumnsCount();

    var bReDraw             = true;
    var bContinue           = false;
    var _PageIndex          = PageIndex;
    var _ColumnIndex        = ColumnIndex;
    var _StartIndex         = StartIndex;
    var _SectionIndex       = SectionIndex;
    var _bStart             = false;
    var _bResetStartElement = false;

    var Count = this.Content.length;
    var Index;
    for (Index = StartIndex; Index < Count; ++Index)
    {
        // Пересчитываем элемент документа
        var Element = this.Content[Index];

        var RecalcResult = recalcresult_NextElement;
        var bFlow        = false;

        if (true !== Element.Is_Inline())
        {
            bFlow = true;

            // Проверяем PageBreak и ColumnBreak в предыдущей строке
            var isPageBreakOnPrevLine   = false;
            var isColumnBreakOnPrevLine = false;

            var PrevElement = Element.Get_DocumentPrev();

            if (null !== PrevElement && type_Paragraph === PrevElement.Get_Type() && true === PrevElement.Is_Empty() && undefined !== PrevElement.Get_SectionPr())
                PrevElement = PrevElement.Get_DocumentPrev();

            if (null !== PrevElement && type_Paragraph === PrevElement.Get_Type())
            {
                var bNeedPageBreak = true;
                if (undefined !== PrevElement.Get_SectionPr())
                {
                    var PrevSectPr = PrevElement.Get_SectionPr();
                    var CurSectPr  = this.SectionsInfo.Get_SectPr(Index).SectPr;
                    if (c_oAscSectionBreakType.Continuous !== CurSectPr.Get_Type() || true !== CurSectPr.Compare_PageSize(PrevSectPr))
                        bNeedPageBreak = false;
                }

                var EndLine = PrevElement.Pages[PrevElement.Pages.length - 1].EndLine;
                if (true === bNeedPageBreak && -1 !== EndLine && PrevElement.Lines[EndLine].Info & paralineinfo_BreakRealPage && Index !== Page.Pos)
                    isPageBreakOnPrevLine = true;

                if (-1 !== EndLine && !(PrevElement.Lines[EndLine].Info & paralineinfo_BreakRealPage) && PrevElement.Lines[EndLine].Info & paralineinfo_BreakPage && Index !== PageColumn.Pos)
                    isColumnBreakOnPrevLine = true;
            }

            if (true === isColumnBreakOnPrevLine)
            {
                RecalcResult = recalcresult_NextPage | recalcresultflags_LastFromNewColumn;
            }
            else if (true === isPageBreakOnPrevLine)
            {
                RecalcResult = recalcresult_NextPage | recalcresultflags_LastFromNewPage;
            }
            else
            {
                var RecalcInfo =
                    {
                        Element           : Element,
                        X                 : X,
                        Y                 : Y,
                        XLimit            : XLimit,
                        YLimit            : YLimit,
                        PageIndex         : PageIndex,
                        SectionIndex      : SectionIndex,
                        ColumnIndex       : ColumnIndex,
                        Index             : Index,
                        StartIndex        : StartIndex,
                        ColumnsCount      : ColumnsCount,
                        ResetStartElement : bResetStartElement,
                        RecalcResult      : RecalcResult
                    };

                if (type_Table === Element.GetType())
                    this.private_RecalculateFlowTable(RecalcInfo);
                else if (type_Paragraph === Element.Get_Type())
                    this.private_RecalculateFlowParagraph(RecalcInfo);

                Index        = RecalcInfo.Index;
                RecalcResult = RecalcInfo.RecalcResult;
            }
        }
        else
        {
            if ((0 === Index && 0 === PageIndex && 0 === ColumnIndex) || Index != StartIndex || (Index === StartIndex && true === bResetStartElement))
            {
                Element.Set_DocumentIndex(Index);
                Element.Reset(X, Y, XLimit, YLimit, PageIndex, ColumnIndex, ColumnsCount);
            }

            // Делаем как в Word: Обработаем особый случай, когда на данном параграфе заканчивается секция, и он
            // пустой. В такой ситуации этот параграф не добавляет смещения по Y, и сам приписывается в конец
            // предыдущего элемента. Второй подряд идущий такой же параграф обсчитывается по обычному.

            var SectInfoElement = this.SectionsInfo.Get_SectPr(Index);
            var PrevElement     = this.Content[Index - 1]; // может быть undefined, но в следующем условии сразу стоит проверка на Index > 0
            if (Index > 0 && ( Index !== StartIndex || true !== bResetStartElement ) && Index === SectInfoElement.Index && true === Element.IsEmpty() && ( type_Paragraph !== PrevElement.GetType() || undefined === PrevElement.Get_SectionPr() ))
            {
                RecalcResult = recalcresult_NextElement;

                this.private_RecalculateEmptySectionParagraph(Element, PrevElement, PageIndex, ColumnIndex, ColumnsCount);

                // Добавим в список особых параграфов
                this.Pages[PageIndex].EndSectionParas.push(Element);

                // Выставляем этот флаг, чтобы у нас не менялось значение по Y
                bFlow = true;
            }
            else
            {
                var ElementPageIndex = this.private_GetElementPageIndex(Index, PageIndex, ColumnIndex, ColumnsCount);
                RecalcResult         = Element.Recalculate_Page(ElementPageIndex);
            }
        }

        if (true != bFlow && (RecalcResult & recalcresult_NextElement || RecalcResult & recalcresult_NextPage))
        {
            var ElementPageIndex = this.private_GetElementPageIndex(Index, PageIndex, ColumnIndex, ColumnsCount);
            Y                    = Element.Get_PageBounds(ElementPageIndex).Bottom;
        }

        PageColumn.Bounds.Bottom = Y;

        if (RecalcResult & recalcresult_CurPage)
        {
            bReDraw       = false;
            bContinue     = true;
            _PageIndex    = PageIndex;
            _SectionIndex = SectionIndex;
            _bStart       = false;

            if (RecalcResult & recalcresultflags_Column)
            {
                _ColumnIndex = ColumnIndex;
                _StartIndex  = StartIndex;
            }
            else
            {
                _ColumnIndex = 0;
                _StartIndex  = this.Pages[_PageIndex].Sections[_SectionIndex].Columns[0].Pos;
            }

            break;
        }
        else if (RecalcResult & recalcresult_NextElement)
        {
            if (Index < Count - 1)
            {
                var CurSectInfo  = this.SectionsInfo.Get_SectPr(Index);
                var NextSectInfo = this.SectionsInfo.Get_SectPr(Index + 1);
                if (CurSectInfo !== NextSectInfo)
                {
                    PageColumn.EndPos  = Index;
                    PageSection.EndPos = Index;
                    Page.EndPos        = Index;

                    if (c_oAscSectionBreakType.Continuous === NextSectInfo.SectPr.Get_Type() && true === CurSectInfo.SectPr.Compare_PageSize(NextSectInfo.SectPr) && this.Footnotes.IsEmptyPage(PageIndex))
                    {
                        // Новая секция начинается на данной странице. Нам надо получить новые поля данной секции, но
                        // на данной странице мы будем использовать только новые горизонтальные поля, а поля по вертикали
                        // используем от предыдущей секции.

                        var SectionY = Y;
                        for (var TempColumnIndex = 0; TempColumnIndex < ColumnsCount; ++TempColumnIndex)
                        {
                            if (PageSection.Columns[TempColumnIndex].Bounds.Bottom > SectionY)
                                SectionY = PageSection.Columns[TempColumnIndex].Bounds.Bottom;
                        }

                        PageSection.YLimit = SectionY;

                        if ((!PageSection.IsCalculatingSectionBottomLine() || PageSection.CanDecreaseBottomLine()) && ColumnsCount > 1 && PageSection.CanRecalculateBottomLine())
                        {
                            PageSection.IterateBottomLineCalculation(false);

                            bContinue           = true;
                            _PageIndex          = PageIndex;
                            _SectionIndex       = SectionIndex;
                            _ColumnIndex        = 0;
                            _StartIndex         = this.Pages[_PageIndex].Sections[_SectionIndex].Columns[0].Pos;
                            _bStart             = false;
                            _bResetStartElement = 0 === SectionIndex ? Page.ResetStartElement : true;

                            this.Pages[_PageIndex].Sections[_SectionIndex].Reset_Columns();

                            break;
                        }
                        else
                        {
                            bContinue           = true;
                            _PageIndex          = PageIndex;
                            _SectionIndex       = SectionIndex + 1;
                            _ColumnIndex        = 0;
                            _StartIndex         = Index + 1;
                            _bStart             = false;
                            _bResetStartElement = true;

							var NewPageSection = new CDocumentPageSection();
							NewPageSection.Init(PageIndex, NextSectInfo.SectPr);
							NewPageSection.Pos           = Index;
							NewPageSection.EndPos        = Index;
							NewPageSection.Y             = SectionY + 0.001;
							NewPageSection.YLimit        = this.Pages[PageIndex].YLimit;
							Page.Sections[_SectionIndex] = NewPageSection;
                            break;
                        }
                    }
                    else
                    {
                        bContinue           = true;
                        _PageIndex          = PageIndex + 1;
                        _SectionIndex       = 0;
                        _ColumnIndex        = 0;
                        _StartIndex         = Index + 1;
                        _bStart             = true;
                        _bResetStartElement = true;
                        break;
                    }
                }
            }
        }
        else if (RecalcResult & recalcresult_NextPage)
        {
            if (true === PageSection.IsCalculatingSectionBottomLine() && (RecalcResult & recalcresultflags_LastFromNewPage || ColumnIndex >= ColumnsCount - 1))
            {
                PageSection.IterateBottomLineCalculation(true);

                bContinue           = true;
                _PageIndex          = PageIndex;
                _SectionIndex       = SectionIndex;
                _ColumnIndex        = 0;
                _StartIndex         = this.Pages[_PageIndex].Sections[_SectionIndex].Columns[0].Pos;
                _bStart             = false;
                _bResetStartElement = 0 === SectionIndex ? Page.ResetStartElement : true;

                this.Pages[_PageIndex].Sections[_SectionIndex].Reset_Columns();

                bReDraw = false;
                break;
            }
            else if (RecalcResult & recalcresultflags_LastFromNewColumn)
            {
                PageColumn.EndPos  = Index - 1;
                PageSection.EndPos = Index - 1;
                Page.EndPos        = Index - 1;

                bContinue           = true;
                _SectionIndex       = SectionIndex;
                _ColumnIndex        = ColumnIndex + 1;
                _PageIndex          = PageIndex;
                _StartIndex         = Index;
                _bStart             = true;
                _bResetStartElement = true;

                if (_ColumnIndex >= ColumnsCount)
                {
                    _SectionIndex = 0;
                    _ColumnIndex  = 0;
                    _PageIndex    = PageIndex + 1;
                }
                else
                {
                    bReDraw = false;
                }

                break;
            }
            else if (RecalcResult & recalcresultflags_LastFromNewPage)
            {
                PageColumn.EndPos  = Index - 1;
                PageSection.EndPos = Index - 1;
                Page.EndPos        = Index - 1;

                bContinue = true;

                _SectionIndex       = 0;
                _ColumnIndex        = 0;
                _PageIndex          = PageIndex + 1;
                _StartIndex         = Index;
                _bStart             = true;
                _bResetStartElement = true;

                if (PageColumn.EndPos === PageColumn.Pos)
                {
                    var Element          = this.Content[PageColumn.Pos];
                    var ElementPageIndex = this.private_GetElementPageIndex(Index, PageIndex, ColumnIndex, ColumnsCount);
                    if (true === Element.IsEmptyPage(ElementPageIndex))
                        PageColumn.Empty = true;
                }

                for (var TempColumnIndex = ColumnIndex + 1; TempColumnIndex < ColumnsCount; ++TempColumnIndex)
                {
                    PageSection.Columns[TempColumnIndex].Empty  = true;
                    PageSection.Columns[TempColumnIndex].Pos    = Index;
                    PageSection.Columns[TempColumnIndex].EndPos = Index - 1;
                }

                break;
            }
            else if (RecalcResult & recalcresultflags_Page)
            {
                PageColumn.EndPos  = Index;
                PageSection.EndPos = Index;
                Page.EndPos        = Index;

                bContinue = true;

                _SectionIndex = 0;
                _ColumnIndex  = 0;
                _PageIndex    = PageIndex + 1;
                _StartIndex   = Index;
                _bStart       = true;

                if (PageColumn.EndPos === PageColumn.Pos)
                {
                    var Element          = this.Content[PageColumn.Pos];
                    var ElementPageIndex = this.private_GetElementPageIndex(Index, PageIndex, ColumnIndex, ColumnsCount);
                    if (true === Element.IsEmptyPage(ElementPageIndex))
                        PageColumn.Empty = true;
                }

                for (var TempColumnIndex = ColumnIndex + 1; TempColumnIndex < ColumnsCount; ++TempColumnIndex)
                {
                    var ElementPageIndex = this.private_GetElementPageIndex(Index, PageIndex, TempColumnIndex, ColumnsCount);
                    this.Content[Index].Recalculate_SkipPage(ElementPageIndex);

                    PageSection.Columns[TempColumnIndex].Empty  = true;
                    PageSection.Columns[TempColumnIndex].Pos    = Index;
                    PageSection.Columns[TempColumnIndex].EndPos = Index - 1;
                }

                break;
            }
            else
            {
                PageColumn.EndPos  = Index;
                PageSection.EndPos = Index;
                Page.EndPos        = Index;

                bContinue = true;

                _ColumnIndex = ColumnIndex + 1;
                if (_ColumnIndex >= ColumnsCount)
                {
                    _SectionIndex = 0;
                    _ColumnIndex  = 0;
                    _PageIndex    = PageIndex + 1;
                }
                else
                {
                    bReDraw = false;
                }

                _StartIndex = Index;
                _bStart     = true;

                if (PageColumn.EndPos === PageColumn.Pos)
                {
                    var Element          = this.Content[PageColumn.Pos];
                    var ElementPageIndex = this.private_GetElementPageIndex(Index, PageIndex, ColumnIndex, ColumnsCount);
                    if (true === Element.IsEmptyPage(ElementPageIndex))
                        PageColumn.Empty = true;
                }

                break;
            }
        }
        else if (RecalcResult & recalcresult_PrevPage)
        {
            bReDraw   = false;
            bContinue = true;
            if (RecalcResult & recalcresultflags_Column)
            {
                if (0 === ColumnIndex)
                {
                    _PageIndex    = Math.max(PageIndex - 1, 0);
                    _SectionIndex = this.Pages[_PageIndex].Sections.length - 1;
                    _ColumnIndex  = this.Pages[_PageIndex].Sections[_SectionIndex].Columns.length - 1;
                }
                else
                {
                    _PageIndex    = PageIndex;
                    _ColumnIndex  = ColumnIndex - 1;
                    _SectionIndex = SectionIndex;
                }
            }
            else
            {
                if (_SectionIndex > 0)
                {
                    // Сюда мы никогда не должны попадать
                }

                _PageIndex    = Math.max(PageIndex - 1, 0);
                _SectionIndex = this.Pages[_PageIndex].Sections.length - 1;
                _ColumnIndex  = 0;
            }

            _StartIndex = this.Pages[_PageIndex].Sections[_SectionIndex].Columns[_ColumnIndex].Pos;
            _bStart     = false;
            break;
        }

        if (docpostype_Content == this.GetDocPosType() && Index === this.CurPos.ContentPos)
        {
            if (type_Paragraph === Element.GetType())
                this.CurPage = PageIndex;
            else
                this.CurPage = PageIndex; // TODO: переделать
        }

        if (docpostype_Content === this.GetDocPosType() && ((true !== this.Selection.Use && Index === this.CurPos.ContentPos + 1) || (true === this.Selection.Use && Index === (Math.max(this.Selection.EndPos, this.Selection.StartPos) + 1))))
            this.private_UpdateCursorXY(true, true);
    }

    if (Index >= Count)
    {
        // До перерисовки селекта должны выставить
        Page.EndPos        = Count - 1;
        PageSection.EndPos = Count - 1;
        PageColumn.EndPos  = Count - 1;

        //console.log("LastRecalc: " + ((new Date().getTime() - this.StartTime) / 1000));
    }

    if (Index >= Count || _PageIndex > PageIndex || _ColumnIndex > ColumnIndex)
    {
        this.private_RecalculateShiftFootnotes(PageIndex, ColumnIndex, Y, SectPr);
    }

    if (true === bReDraw)
    {
        this.DrawingDocument.OnRecalculatePage(PageIndex, this.Pages[PageIndex]);
    }

    if (Index >= Count)
    {
		// Пересчет основной части документа законечен. Возможна ситуация, при которой последние сноски с данной
		// страницы переносятся на следующую (т.е. остались непересчитанные сноски). Эти сноски нужно пересчитать
		if (this.Footnotes.HaveContinuesFootnotes(PageIndex, ColumnIndex))
		{
			bContinue    = true;
			_PageIndex   = PageIndex;
			_ColumnIndex = ColumnIndex + 1;
			if (_ColumnIndex >= ColumnsCount)
			{
				_ColumnIndex = 0;
				_PageIndex   = PageIndex + 1;
			}

			_bStart     = true;
			_StartIndex = Count;
		}
		else
		{
			this.private_CheckUnusedFields();
			this.private_CheckCurPage();
			this.DrawingDocument.OnEndRecalculate(true);
			this.DrawingObjects.onEndRecalculateDocument(this.Pages.length);

			if (true === this.Selection.UpdateOnRecalc)
			{
				this.Selection.UpdateOnRecalc = false;
				this.DrawingDocument.OnSelectEnd();
			}

			this.FullRecalc.Id           = null;
			this.FullRecalc.MainStartPos = -1;

			// Основной пересчет окончен, если в колонтитулах есть элемент с количеством страниц, тогда нам надо
			// запустить дополнительный пересчет колонтитулов.
			// Если так случилось, что после повторного полного пересчета, вызванного изменением количества страниц и
			// изменением метрик колонтитула, новое количество страниц стало меньше, чем раньше, тогда мы не пересчитываем
			// дальше, чтобы избежать зацикливаний.

			if (-1 === this.HdrFtrRecalc.PageCount || this.HdrFtrRecalc.PageCount < this.Pages.length)
			{
				this.HdrFtrRecalc.PageCount = this.Pages.length;
				var nPageCountStartPage     = this.HdrFtr.HavePageCountElement();
				if (-1 !== nPageCountStartPage)
				{
					this.DrawingDocument.OnStartRecalculate(nPageCountStartPage);
					this.HdrFtrRecalc.PageIndex = nPageCountStartPage;
					this.private_RecalculateHdrFtrPageCountUpdate();
				}
			}
		}
    }

	if (this.NeedUpdateTracksOnRecalc)
	{
		this.private_UpdateTracks(this.NeedUpdateTracksParams.Selection, this.NeedUpdateTracksParams.EmptySelection);
	}

    if (true === bContinue)
    {
        this.FullRecalc.PageIndex         = _PageIndex;
        this.FullRecalc.SectionIndex      = _SectionIndex;
        this.FullRecalc.ColumnIndex       = _ColumnIndex;
        this.FullRecalc.StartIndex        = _StartIndex;
        this.FullRecalc.Start             = _bStart;
        this.FullRecalc.ResetStartElement = _bResetStartElement;
        this.FullRecalc.MainStartPos      = _StartIndex;

        if (window["NATIVE_EDITOR_ENJINE_SYNC_RECALC"] === true)
        {
            if (_PageIndex > this.FullRecalc.StartPage + 2)
            {
                if (window["native"] && window["native"]["WC_CheckSuspendRecalculate"] !== undefined)
                {
                    //if (window["native"]["WC_CheckSuspendRecalculate"]())
                    //    return;

                    this.FullRecalc.Id = setTimeout(Document_Recalculate_Page, 10);
                    return;
                }
            }

            this.Recalculate_Page();
            return;
        }

        if (_PageIndex > this.FullRecalc.StartPage + 2)
        {
            this.FullRecalc.Id = setTimeout(Document_Recalculate_Page, 20);
        }
        else
        {
            this.Recalculate_Page();
        }
    }
};
CDocument.prototype.private_RecalculateIsNewSection = function(nPageAbs, nContentIndex)
{
	// Определим, является ли данная страница первой в новой секции
	var bNewSection = ( 0 === nPageAbs ? true : false );
	if (0 !== nPageAbs)
	{
		var PrevStartIndex = this.Pages[nPageAbs - 1].Pos;
		var CurSectInfo    = this.SectionsInfo.Get_SectPr(nContentIndex);
		var PrevSectInfo   = this.SectionsInfo.Get_SectPr(PrevStartIndex);

		if (PrevSectInfo !== CurSectInfo && (c_oAscSectionBreakType.Continuous !== CurSectInfo.SectPr.Get_Type() || true !== CurSectInfo.SectPr.Compare_PageSize(PrevSectInfo.SectPr) ))
			bNewSection = true;
	}

	return bNewSection;
};
CDocument.prototype.private_RecalculateShiftFootnotes = function(nPageAbs, nColumnAbs, dY, oSectPr)
{
	var nPosType = oSectPr.GetFootnotePos();

	// section_footnote_PosDocEnd, section_footnote_PosSectEnd ненужные константы по логике, но Word воспринимает их
	// именно как section_footnote_PosBeneathText, в то время как все остальное (даже константа не по формату)
	// воспринимает как  section_footnote_PosPageBottom.
	if (section_footnote_PosBeneathText === nPosType || section_footnote_PosDocEnd === nPosType || section_footnote_PosSectEnd === nPosType)
	{
		this.Footnotes.Shift(nPageAbs, nColumnAbs, 0, dY);
	}
	else
	{
		var dFootnotesHeight = this.Footnotes.GetHeight(nPageAbs, nColumnAbs);
		var oPageMetrics     = this.Get_PageContentStartPos(nPageAbs);
		this.Footnotes.Shift(nPageAbs, nColumnAbs, 0, oPageMetrics.YLimit - dFootnotesHeight);
	}
};
CDocument.prototype.private_RecalculateFlowTable             = function(RecalcInfo)
{
    var Element            = RecalcInfo.Element;
    var X                  = RecalcInfo.X;
    var Y                  = RecalcInfo.Y;
    var XLimit             = RecalcInfo.XLimit;
    var YLimit             = RecalcInfo.YLimit;
    var PageIndex          = RecalcInfo.PageIndex;
    var ColumnIndex        = RecalcInfo.ColumnIndex;
    var Index              = RecalcInfo.Index;
    var StartIndex         = RecalcInfo.StartIndex;
    var ColumnsCount       = RecalcInfo.ColumnsCount;
    var bResetStartElement = RecalcInfo.ResetStartElement;
    var RecalcResult       = RecalcInfo.RecalcResult;

    // Когда у нас колонки мы не разбиваем плавающую таблицу на страницы.
    var isColumns = ColumnsCount > 1 ? true : false;
    if (true === isColumns)
        YLimit = 10000;

    if (true === this.RecalcInfo.Can_RecalcObject())
    {
        var ElementPageIndex = 0;
        if ((0 === Index && 0 === PageIndex) || Index != StartIndex || (Index === StartIndex && true === bResetStartElement))
        {
            Element.Set_DocumentIndex(Index);
            Element.Reset(X, Y, XLimit, YLimit, PageIndex, ColumnIndex, ColumnsCount, this.Pages[PageIndex].Sections[this.Pages[PageIndex].Sections.length - 1].Y);
            ElementPageIndex = 0;
        }
        else
        {
            ElementPageIndex = PageIndex - Element.PageNum;
        }

        var TempRecalcResult = Element.Recalculate_Page(ElementPageIndex);
        this.RecalcInfo.Set_FlowObject(Element, ElementPageIndex, TempRecalcResult, -1, {
            X      : X,
            Y      : Y,
            XLimit : XLimit,
            YLimit : YLimit
        });

        if (((0 === Index && 0 === PageIndex) || Index != StartIndex) && true != Element.IsContentOnFirstPage() && true !== isColumns)
        {
            this.RecalcInfo.Set_PageBreakBefore(true);
            RecalcResult = recalcresult_NextPage | recalcresultflags_LastFromNewPage;
        }
        else
        {
            var FlowTable = new CFlowTable(Element, PageIndex);
            this.DrawingObjects.addFloatTable(FlowTable);
            RecalcResult = recalcresult_CurPage;
        }
    }
    else if (true === this.RecalcInfo.Check_FlowObject(Element))
    {
        if (Element.PageNum === PageIndex)
        {
            if (true === this.RecalcInfo.Is_PageBreakBefore())
            {
                this.RecalcInfo.Reset();
                RecalcResult = recalcresult_NextPage | recalcresultflags_LastFromNewPage;
            }
            else
            {
                X      = this.RecalcInfo.AdditionalInfo.X;
                Y      = this.RecalcInfo.AdditionalInfo.Y;
                XLimit = this.RecalcInfo.AdditionalInfo.XLimit;
                YLimit = this.RecalcInfo.AdditionalInfo.YLimit;

                // Пересчет нужнен для обновления номеров колонок и страниц
                Element.Reset(X, Y, XLimit, YLimit, PageIndex, ColumnIndex, ColumnsCount, this.Pages[PageIndex].Sections[this.Pages[PageIndex].Sections.length - 1].Y);
                RecalcResult = Element.Recalculate_Page(0);
                this.RecalcInfo.FlowObjectPage++;

                if (true === isColumns)
                    RecalcResult = recalcresult_NextElement;

                if (RecalcResult & recalcresult_NextElement)
                    this.RecalcInfo.Reset();
            }
        }
        else if (Element.PageNum > PageIndex || (this.RecalcInfo.FlowObjectPage <= 0 && Element.PageNum < PageIndex))
        {
            this.DrawingObjects.removeFloatTableById(PageIndex - 1, Element.Get_Id());
            this.RecalcInfo.Set_PageBreakBefore(true);
            RecalcResult = recalcresult_PrevPage;
        }
        else
        {
            RecalcResult = Element.Recalculate_Page(PageIndex - Element.PageNum);
            this.RecalcInfo.FlowObjectPage++;
            this.DrawingObjects.addFloatTable(new CFlowTable(Element, PageIndex));

            if (RecalcResult & recalcresult_NextElement)
                this.RecalcInfo.Reset();
        }
    }
    else
    {
        RecalcResult = recalcresult_NextElement;
    }

    RecalcInfo.Index        = Index;
    RecalcInfo.RecalcResult = RecalcResult;
};
CDocument.prototype.private_RecalculateFlowParagraph         = function(RecalcInfo)
{
    var Element            = RecalcInfo.Element;
    var X                  = RecalcInfo.X;
    var Y                  = RecalcInfo.Y;
    var XLimit             = RecalcInfo.XLimit;
    var YLimit             = RecalcInfo.YLimit;
    var PageIndex          = RecalcInfo.PageIndex;
    var ColumnIndex        = RecalcInfo.ColumnIndex;
    var Index              = RecalcInfo.Index;
    var StartIndex         = RecalcInfo.StartIndex;
    var ColumnsCount       = RecalcInfo.ColumnsCount;
    var bResetStartElement = RecalcInfo.ResetStartElement;
    var RecalcResult       = RecalcInfo.RecalcResult;

    var Page = this.Pages[PageIndex];

    if (true === this.RecalcInfo.Can_RecalcObject())
    {
        var FramePr = Element.Get_FramePr();

        // Рассчитаем количество подряд идущих параграфов с одинаковыми FramePr
        var FlowCount = this.private_RecalculateFlowParagraphCount(Index);

        var Page_W = Page.Width;
        var Page_H = Page.Height;

        var Page_Field_L = Page.Margins.Left;
        var Page_Field_R = Page.Margins.Right;
        var Page_Field_T = Page.Margins.Top;
        var Page_Field_B = Page.Margins.Bottom;

        var Column_Field_L = X;
        var Column_Field_R = XLimit;

        //--------------------------------------------------------------------------------------------------
        // 1. Рассчитаем размер рамки
        //--------------------------------------------------------------------------------------------------
        var FrameH = 0;
        var FrameW = -1;

        var Frame_XLimit = FramePr.Get_W();
        var Frame_YLimit = FramePr.Get_H();

		var FrameHRule = ( undefined === FramePr.HRule ? Asc.linerule_Auto : FramePr.HRule );

        if (undefined === Frame_XLimit)
            Frame_XLimit = Page_Field_R - Page_Field_L;

        if (undefined === Frame_YLimit || Asc.linerule_Auto === FrameHRule)
            Frame_YLimit = Page_H;

        for (var TempIndex = Index; TempIndex < Index + FlowCount; ++TempIndex)
        {
            var TempElement = this.Content[TempIndex];
            TempElement.Set_DocumentIndex(TempIndex);

			var ElementPageIndex = 0;
			if ((0 === TempIndex && 0 === PageIndex) || TempIndex != StartIndex || (TempIndex === StartIndex && true === bResetStartElement))
			{
				TempElement.Reset(0, FrameH, Frame_XLimit, Frame_YLimit, PageIndex, ColumnIndex, ColumnsCount);
			}
			else
			{
				ElementPageIndex = PageIndex - Element.PageNum;
			}

            RecalcResult = TempElement.Recalculate_Page(ElementPageIndex);

            if (!(RecalcResult & recalcresult_NextElement))
                break;

            FrameH = TempElement.Get_PageBounds(0).Bottom;
        }

        if (-1 === FrameW && 1 === FlowCount && 1 === Element.Lines.length && undefined === FramePr.Get_W())
        {
			FrameW     = Element.GetAutoWidthForDropCap();
			var ParaPr = Element.Get_CompiledPr2(false).ParaPr;
			FrameW += ParaPr.Ind.Left + ParaPr.Ind.FirstLine;

            // Если прилегание в данном случае не к левой стороне, тогда пересчитываем параграф,
            // с учетом того, что ширина буквицы должна быть FrameW
            if (align_Left != ParaPr.Jc)
            {
                Element.Reset(0, 0, FrameW, Frame_YLimit, PageIndex, ColumnIndex, ColumnsCount);
                Element.Recalculate_Page(0);
                FrameH = TempElement.Get_PageBounds(0).Bottom;
            }
        }
        else if (-1 === FrameW)
        {
            FrameW = Frame_XLimit;
        }

        if ((Asc.linerule_AtLeast === FrameHRule && FrameH < FramePr.H) || Asc.linerule_Exact === FrameHRule)
        {
            FrameH = FramePr.H;
        }
        //--------------------------------------------------------------------------------------------------
        // 2. Рассчитаем положение рамки
        //--------------------------------------------------------------------------------------------------

        // Теперь зная размеры рамки можем рассчитать ее позицию
        var FrameHAnchor = ( FramePr.HAnchor === undefined ? c_oAscHAnchor.Margin : FramePr.HAnchor );
        var FrameVAnchor = ( FramePr.VAnchor === undefined ? c_oAscVAnchor.Text : FramePr.VAnchor );

        // Рассчитаем положение по горизонтали
        var FrameX = 0;
        if (undefined != FramePr.XAlign || undefined === FramePr.X)
        {
            var XAlign = c_oAscXAlign.Left;
            if (undefined != FramePr.XAlign)
                XAlign = FramePr.XAlign;

            switch (FrameHAnchor)
            {
                case c_oAscHAnchor.Page   :
                {
                    switch (XAlign)
                    {
                        case c_oAscXAlign.Inside  :
                        case c_oAscXAlign.Outside :
                        case c_oAscXAlign.Left    :
                            FrameX = Page_Field_L - FrameW;
                            break;
                        case c_oAscXAlign.Right   :
                            FrameX = Page_Field_R;
                            break;
                        case c_oAscXAlign.Center  :
                            FrameX = (Page_W - FrameW) / 2;
                            break;
                    }

                    break;
                }
                case c_oAscHAnchor.Text   :
                case c_oAscHAnchor.Margin :
                {
                    switch (XAlign)
                    {
                        case c_oAscXAlign.Inside  :
                        case c_oAscXAlign.Outside :
                        case c_oAscXAlign.Left    :
                            FrameX = Column_Field_L;
                            break;
                        case c_oAscXAlign.Right   :
                            FrameX = Column_Field_R - FrameW;
                            break;
                        case c_oAscXAlign.Center  :
                            FrameX = (Column_Field_R + Column_Field_L - FrameW) / 2;
                            break;
                    }

                    break;
                }
            }

        }
        else
        {
            switch (FrameHAnchor)
            {
                case c_oAscHAnchor.Page   :
                    FrameX = FramePr.X;
                    break;
                case c_oAscHAnchor.Text   :
                case c_oAscHAnchor.Margin :
                    FrameX = Page_Field_L + FramePr.X;
                    break;
            }
        }

        if (FrameW + FrameX > Page_W)
            FrameX = Page_W - FrameW;

        if (FrameX < 0)
            FrameX = 0;

        // Рассчитаем положение по вертикали
        var FrameY = 0;
        if (undefined != FramePr.YAlign)
        {
            var YAlign = FramePr.YAlign;
            // Случай c_oAscYAlign.Inline не обрабатывается, потому что такие параграфы считаются Inline

            switch (FrameVAnchor)
            {
                case c_oAscVAnchor.Page   :
                {
                    switch (YAlign)
                    {
                        case c_oAscYAlign.Inside  :
                        case c_oAscYAlign.Outside :
                        case c_oAscYAlign.Top     :
                            FrameY = 0;
                            break;
                        case c_oAscYAlign.Bottom  :
                            FrameY = Page_H - FrameH;
                            break;
                        case c_oAscYAlign.Center  :
                            FrameY = (Page_H - FrameH) / 2;
                            break;
                    }

                    break;
                }
                case c_oAscVAnchor.Text   :
                {
                    FrameY = Y;
                    break;
                }
                case c_oAscVAnchor.Margin :
                {
                    switch (YAlign)
                    {
                        case c_oAscYAlign.Inside  :
                        case c_oAscYAlign.Outside :
                        case c_oAscYAlign.Top     :
                            FrameY = Page_Field_T;
                            break;
                        case c_oAscYAlign.Bottom  :
                            FrameY = Page_Field_B - FrameH;
                            break;
                        case c_oAscYAlign.Center  :
                            FrameY = (Page_Field_B + Page_Field_T - FrameH) / 2;
                            break;
                    }

                    break;
                }
            }
        }
        else
        {
            var FramePrY = 0;
            if (undefined != FramePr.Y)
                FramePrY = FramePr.Y;

            switch (FrameVAnchor)
            {
                case c_oAscVAnchor.Page   :
                    FrameY = FramePrY;
                    break;
                case c_oAscVAnchor.Text   :
                    FrameY = FramePrY + Y;
                    break;
                case c_oAscVAnchor.Margin :
                    FrameY = FramePrY + Page_Field_T;
                    break;
            }
        }

        if (FrameH + FrameY > Page_H)
            FrameY = Page_H - FrameH;

        // TODO: Пересмотреть, почему эти погрешности возникают
        // Избавляемся от погрешности
        FrameY += 0.001;
        FrameH -= 0.002;

        if (FrameY < 0)
            FrameY = 0;

        var FrameBounds = this.Content[Index].Get_FrameBounds(FrameX, FrameY, FrameW, FrameH);
        var FrameX2     = FrameBounds.X, FrameY2 = FrameBounds.Y, FrameW2 = FrameBounds.W, FrameH2 = FrameBounds.H;

        if (!(RecalcResult & recalcresult_NextElement))
        {
            // Ничего не делаем здесь, пересчитываем текущую страницу заново, либо предыдущую

            if (RecalcResult & recalcresult_PrevPage)
                this.RecalcInfo.Set_FrameRecalc(false);

            // TODO: Если мы заново пересчитываем текущую страницу, проверить надо ли обнулять параметр RecalcInfo.FrameRecalc
        }
        else if ((FrameY2 + FrameH2 > Page_H || Y > Page_H - 0.001) && Index != StartIndex)
        {
            this.RecalcInfo.Set_FrameRecalc(true);
            RecalcResult = recalcresult_NextPage | recalcresultflags_LastFromNewColumn;
        }
        else
        {
            this.RecalcInfo.Set_FrameRecalc(false);
            for (var TempIndex = Index; TempIndex < Index + FlowCount; ++TempIndex)
            {
                var TempElement = this.Content[TempIndex];
                TempElement.Shift(TempElement.Pages.length - 1, FrameX, FrameY);
                TempElement.Set_CalculatedFrame(FrameX, FrameY, FrameW, FrameH, FrameX2, FrameY2, FrameW2, FrameH2, PageIndex);
            }

            var FrameDx = ( undefined === FramePr.HSpace ? 0 : FramePr.HSpace );
            var FrameDy = ( undefined === FramePr.VSpace ? 0 : FramePr.VSpace );

            this.DrawingObjects.addFloatTable(new CFlowParagraph(Element, FrameX2, FrameY2, FrameW2, FrameH2, FrameDx, FrameDy, Index, FlowCount, FramePr.Wrap));

            Index += FlowCount - 1;

            if (FrameY >= Y && FrameX >= X - 0.001)
            {
                RecalcResult = recalcresult_NextElement;
            }
            else
            {
                this.RecalcInfo.Set_FlowObject(Element, PageIndex, recalcresult_NextElement, FlowCount);
                RecalcResult = recalcresult_CurPage | recalcresultflags_Page;
            }
        }
    }
    else if (true === this.RecalcInfo.Check_FlowObject(Element) && true === this.RecalcInfo.Is_PageBreakBefore())
    {
        this.RecalcInfo.Reset();
        this.RecalcInfo.Set_FrameRecalc(true);
        RecalcResult = recalcresult_NextPage | recalcresultflags_LastFromNewPage;
    }
    else if (true === this.RecalcInfo.Check_FlowObject(Element))
    {
        if (this.RecalcInfo.FlowObjectPage !== PageIndex)
        {
            // Номер страницы не такой же (должен быть +1), значит нам надо заново персесчитать предыдущую страницу
            // с условием, что данная рамка начнется с новой страницы
            this.RecalcInfo.Set_PageBreakBefore(true);
            this.DrawingObjects.removeFloatTableById(this.RecalcInfo.FlowObjectPage, Element.Get_Id());
            RecalcResult = recalcresult_PrevPage | recalcresultflags_Page;
        }
        else
        {
            // Все нормально рассчиталось

            // В случае колонок может так случится, что логическое место окажется в другой колонке, поэтому мы делаем
            // Reset для обновления логической позиции, но физическую позицию не меняем.
            var FlowCount = this.RecalcInfo.FlowObjectElementsCount;
            for (var TempIndex = Index; TempIndex < Index + FlowCount; ++TempIndex)
            {
                var TempElement = this.Content[TempIndex];
                TempElement.Reset(TempElement.X, TempElement.Y, TempElement.XLimit, TempElement.YLimit, TempElement.PageNum, ColumnIndex, ColumnsCount);
            }


            Index += this.RecalcInfo.FlowObjectElementsCount - 1;
            this.RecalcInfo.Reset();
            RecalcResult = recalcresult_NextElement;
        }
    }
    else
    {
        // В случае колонок может так случится, что логическое место окажется в другой колонке, поэтому мы делаем
        // Reset для обновления логической позиции, но физическую позицию не меняем.
        var FlowCount = this.private_RecalculateFlowParagraphCount(Index);
        for (var TempIndex = Index; TempIndex < Index + FlowCount; ++TempIndex)
        {
            var TempElement = this.Content[TempIndex];
            TempElement.Reset(TempElement.X, TempElement.Y, TempElement.XLimit, TempElement.YLimit, PageIndex, ColumnIndex, ColumnsCount);
        }

        RecalcResult = recalcresult_NextElement;
    }

    RecalcInfo.Index        = Index;
    RecalcInfo.RecalcResult = RecalcResult;
};
CDocument.prototype.private_RecalculateFlowParagraphCount    = function(Index)
{
    var Element   = this.Content[Index];
    var FramePr   = Element.Get_FramePr();
    var FlowCount = 1;
    for (var TempIndex = Index + 1, Count = this.Content.length; TempIndex < Count; ++TempIndex)
    {
        var TempElement = this.Content[TempIndex];
        if (type_Paragraph === TempElement.GetType() && true != TempElement.Is_Inline())
        {
            var TempFramePr = TempElement.Get_FramePr();
            if (true === FramePr.Compare(TempFramePr))
                FlowCount++;
            else
                break;
        }
        else
            break;
    }

    return FlowCount;
};
CDocument.prototype.private_RecalculateHdrFtrPageCountUpdate = function()
{
	this.HdrFtrRecalc.Id = null;

	var nPageAbs    = this.HdrFtrRecalc.PageIndex;
	var nPagesCount = this.Pages.length;

	while (nPageAbs < nPagesCount)
	{
		var Result = this.HdrFtr.RecalculatePageCountUpdate(nPageAbs, nPagesCount);
		if (null === Result)
		{
			nPageAbs++;
		}
		else if (false === Result)
		{
			this.DrawingDocument.OnRecalculatePage(nPageAbs, this.Pages[nPageAbs]);

			if (nPageAbs < this.HdrFtrRecalc.PageIndex + 5)
			{
				nPageAbs++;
			}
			else
			{
				this.HdrFtrRecalc.PageIndex = nPageAbs + 1;
				this.HdrFtrRecalc.Id        = setTimeout(Document_Recalculate_HdrFtrPageCount, 20);
				return;
			}
		}
		else
		{
			this.RecalcInfo.Reset();
			this.FullRecalc.PageIndex         = nPageAbs;
			this.FullRecalc.SectionIndex      = 0;
			this.FullRecalc.ColumnIndex       = 0;
			this.FullRecalc.StartIndex        = this.Pages[nPageAbs].Pos;
			this.FullRecalc.Start             = true;
			this.FullRecalc.StartPage         = nPageAbs;
			this.FullRecalc.ResetStartElement = this.private_RecalculateIsNewSection(nPageAbs, this.Pages[nPageAbs].Pos);
			this.FullRecalc.MainStartPos      = this.Pages[nPageAbs].Pos;

			this.DrawingDocument.OnStartRecalculate(nPageAbs);
			this.Recalculate_Page();
			return;
		}
	}

	if (nPageAbs >= nPagesCount)
		this.DrawingDocument.OnEndRecalculate(false, true);
};
CDocument.prototype.private_CheckUnusedFields = function()
{
	if (this.Content.length <= 0)
		return;

	var oLastPara = this.Content[this.Content.length - 1];
	if (type_Paragraph !== oLastPara.GetType())
		return;

	var oInfo = oLastPara.GetEndInfoByPage(oLastPara.GetPagesCount() - 1);
	for (var nIndex = 0, nCount = oInfo.ComplexFields.length; nIndex < nCount; ++nIndex)
	{
		var oComplexField = oInfo.ComplexFields[nIndex].ComplexField;
		var oBeginChar    = oComplexField.GetBeginChar();
		var oEndChar      = oComplexField.GetEndChar();
		var oSeparateChar = oComplexField.GetSeparateChar();

		if (oBeginChar)
			oBeginChar.SetUse(false);

		if (oEndChar)
			oEndChar.SetUse(false);

		if (oSeparateChar)
			oSeparateChar.SetUse(false);
	}
};
CDocument.prototype.IsCalculatingContinuousSectionBottomLine = function()
{
	var nPageIndex    = this.FullRecalc.PageIndex;
	var nSectionIndex = this.FullRecalc.SectionIndex;

	if (!this.Pages[nPageIndex] || !this.Pages[nPageIndex].Sections[nSectionIndex])
		return false;

	var oPageSection = this.Pages[nPageIndex].Sections[nSectionIndex];
	return oPageSection.IsCalculatingSectionBottomLine();
};
/**
 * Получаем номер рассчитанной страницы, с которой начинается заданный элемент
 * @param nElementPos
 * @returns {number}
 */
CDocument.prototype.private_GetPageByPos = function(nElementPos)
{
	var nResultPage = -1;
	for (var nCurPage = 0, nPagesCount = this.Pages.length; nCurPage < nPagesCount; ++nCurPage)
	{
		if (nElementPos > this.Pages[nCurPage].Pos)
			nResultPage = nCurPage;
		else
			break;
	}

	return nResultPage;
};
CDocument.prototype.OnColumnBreak_WhileRecalculate           = function()
{
    var PageIndex    = this.FullRecalc.PageIndex;
    var SectionIndex = this.FullRecalc.SectionIndex;

    if (this.Pages[PageIndex] && this.Pages[PageIndex].Sections[SectionIndex])
        this.Pages[PageIndex].Sections[SectionIndex].ForbidRecalculateBottomLine();
};
CDocument.prototype.Reset_RecalculateCache                   = function()
{
    this.SectionsInfo.Reset_HdrFtrRecalculateCache();

    var Count = this.Content.length;
    for (var Index = 0; Index < Count; Index++)
    {
        this.Content[Index].Reset_RecalculateCache();
    }

    this.Footnotes.ResetRecalculateCache();
};
/**
 * Останавливаем процесс пересчета (если пересчет был запущен и он долгий)
 * @constructor
 */
CDocument.prototype.StopRecalculate = function()
{
	if (this.FullRecalc.Id)
	{
		clearTimeout(this.FullRecalc.Id);
		this.FullRecalc.Id = null;
		this.DrawingDocument.OnEndRecalculate(false);
		this.RecalcInfo.Set_NeedRecalculateFromStart(true);
	}
};
CDocument.prototype.OnContentRecalculate                     = function(bNeedRecalc, PageNum, DocumentIndex)
{
    if (false === bNeedRecalc)
    {
        var Element = this.Content[DocumentIndex];
        // Просто перерисуем все страницы, на которых находится данный элеменет
        for (var PageNum = Element.PageNum; PageNum < Element.PageNum + Element.Pages.length; PageNum++)
        {
            this.DrawingDocument.OnRecalculatePage(PageNum, this.Pages[PageNum]);
        }

        this.DrawingDocument.OnEndRecalculate(false, true);

        this.Document_UpdateRulersState();
    }
    else
    {
        this.Recalculate();
    }
};
CDocument.prototype.OnContentReDraw                          = function(StartPage, EndPage)
{
    this.ReDraw(StartPage, EndPage);
};
CDocument.prototype.CheckTargetUpdate = function()
{
	// Проверим можно ли вообще пересчитывать текущее положение.
	if (this.DrawingDocument.UpdateTargetFromPaint === true)
	{
		if (true === this.DrawingDocument.UpdateTargetCheck)
			this.NeedUpdateTarget = this.DrawingDocument.UpdateTargetCheck;
		this.DrawingDocument.UpdateTargetCheck = false;
	}

	var bFlag = this.Controller.CanUpdateTarget();

	if (true === this.NeedUpdateTarget && true === bFlag && false === this.IsMovingTableBorder())
	{
		// Обновляем курсор сначала, чтобы обновить текущую страницу
		this.RecalculateCurPos();
		this.NeedUpdateTarget = false;
	}
};
CDocument.prototype.RecalculateCurPos = function()
{
	if (true === this.TurnOffRecalcCurPos)
		return;

	if (true === AscCommon.CollaborativeEditing.Get_GlobalLockSelection())
		return;

	this.DrawingDocument.UpdateTargetTransform(null);

	this.Controller.RecalculateCurPos();

	// TODO: Здесь добавлено обновление линейки, чтобы обновлялись границы рамки при наборе текста, а также чтобы
	//       обновлялись поля колонтитулов при наборе текста.
	this.Document_UpdateRulersState();
};
CDocument.prototype.private_CheckCurPage = function()
{
	if (true === this.TurnOffRecalcCurPos)
		return;

	if (true === AscCommon.CollaborativeEditing.Get_GlobalLockSelection())
		return;

	var nCurPage = this.Controller.GetCurPage();
	if (-1 !== nCurPage)
		this.CurPage = nCurPage;
};
CDocument.prototype.Set_TargetPos = function(X, Y, PageNum)
{
	this.TargetPos.X       = X;
	this.TargetPos.Y       = Y;
	this.TargetPos.PageNum = PageNum;
};
/**
 * Запрос на перерисовку заданного отрезка страниц.
 * @param StartPage
 * @param EndPage
 */
CDocument.prototype.ReDraw                                   = function(StartPage, EndPage)
{
    if ("undefined" === typeof(StartPage))
        StartPage = 0;
    if ("undefined" === typeof(EndPage))
        EndPage = this.DrawingDocument.m_lCountCalculatePages;

    for (var CurPage = StartPage; CurPage <= EndPage; CurPage++)
        this.DrawingDocument.OnRepaintPage(CurPage);
};
CDocument.prototype.DrawPage                                 = function(nPageIndex, pGraphics)
{
    this.Draw(nPageIndex, pGraphics);
};
CDocument.prototype.CanDrawPage = function(nPageAbs)
{
	if (null !== this.FullRecalc.Id && nPageAbs >= this.FullRecalc.PageIndex - 1)
		return false;

	return true;
};
/**
 * Перерисовка заданной страницы документа.
 * @param nPageIndex
 * @param pGraphics
 */
CDocument.prototype.Draw                                     = function(nPageIndex, pGraphics)
{
    // TODO: Пока делаем обновление курсоров при каждой отрисовке. Необходимо поменять
    this.CollaborativeEditing.Update_ForeignCursorsPositions();
    //--------------------------------------------------------------------------------------------------------------

    this.Comments.Reset_Drawing(nPageIndex);

    // Определим секцию
    var Page_StartPos = this.Pages[nPageIndex].Pos;
    var SectPr        = this.SectionsInfo.Get_SectPr(Page_StartPos).SectPr;

    if (docpostype_HdrFtr !== this.CurPos.Type && !this.IsViewMode())
        pGraphics.Start_GlobalAlpha();

    // Рисуем границы вокруг страницы (если границы надо рисовать под текстом)
    if (section_borders_ZOrderBack === SectPr.Get_Borders_ZOrder())
        this.DrawPageBorders(pGraphics, SectPr, nPageIndex);

    this.HdrFtr.Draw(nPageIndex, pGraphics);

    // Рисуем содержимое документа на данной странице
    if (docpostype_HdrFtr === this.CurPos.Type)
        pGraphics.put_GlobalAlpha(true, 0.4);
    else if (!this.IsViewMode())
        pGraphics.End_GlobalAlpha();

    this.DrawingObjects.drawBehindDoc(nPageIndex, pGraphics);

    this.Footnotes.Draw(nPageIndex, pGraphics);

    var Page = this.Pages[nPageIndex];
    for (var SectionIndex = 0, SectionsCount = Page.Sections.length; SectionIndex < SectionsCount; ++SectionIndex)
    {
        var PageSection = Page.Sections[SectionIndex];
        for (var ColumnIndex = 0, ColumnsCount = PageSection.Columns.length; ColumnIndex < ColumnsCount; ++ColumnIndex)
        {
            var Column         = PageSection.Columns[ColumnIndex];
            var ColumnStartPos = Column.Pos;
            var ColumnEndPos   = Column.EndPos;

            if (true === PageSection.ColumnsSep && ColumnIndex > 0 && !Column.IsEmpty())
			{

				var SepX = (Column.X + PageSection.Columns[ColumnIndex - 1].XLimit) / 2;
				pGraphics.p_color(0, 0, 0, 255);
				pGraphics.drawVerLine(c_oAscLineDrawingRule.Left, SepX, PageSection.Y, PageSection.YLimit, 0.75 * g_dKoef_pt_to_mm);
			}

            // Плавающие объекты не должны попадать в клип колонок
            var FlowElements = [];

            if (ColumnsCount > 1)
            {
                pGraphics.SaveGrState();

                var X    = ColumnIndex === 0 ? 0 : Column.X - Column.SpaceBefore / 2;
                var XEnd = (ColumnIndex >= ColumnsCount - 1 ? Page.Width : Column.XLimit + Column.SpaceAfter / 2);
                pGraphics.AddClipRect(X, 0, XEnd - X, Page.Height);
            }

            for (var ContentPos = ColumnStartPos; ContentPos <= ColumnEndPos; ++ContentPos)
            {
                if (true === this.Content[ContentPos].Is_Inline())
                {
                    var ElementPageIndex = this.private_GetElementPageIndex(ContentPos, nPageIndex, ColumnIndex, ColumnsCount);
                    this.Content[ContentPos].Draw(ElementPageIndex, pGraphics);
                }
                else
                {
                    FlowElements.push(ContentPos);
                }
            }

            if (ColumnsCount > 1)
            {
                pGraphics.RestoreGrState();
            }

            for (var FlowPos = 0, FlowsCount = FlowElements.length; FlowPos < FlowsCount; ++FlowPos)
            {
                var ContentPos       = FlowElements[FlowPos];
                var ElementPageIndex = this.private_GetElementPageIndex(ContentPos, nPageIndex, ColumnIndex, ColumnsCount);
                this.Content[ContentPos].Draw(ElementPageIndex, pGraphics);
            }
        }
    }

    this.DrawingObjects.drawBeforeObjects(nPageIndex, pGraphics);

    // Рисуем границы вокруг страницы (если границы надо рисовать перед текстом)
    if (section_borders_ZOrderFront === SectPr.Get_Borders_ZOrder())
        this.DrawPageBorders(pGraphics, SectPr, nPageIndex);

    if (docpostype_HdrFtr === this.CurPos.Type)
    {
        pGraphics.put_GlobalAlpha(false, 1.0);

        // Рисуем колонтитулы
        var SectIndex = this.SectionsInfo.Get_Index(Page_StartPos);
        var SectCount = this.SectionsInfo.Get_Count();

        var SectIndex = ( 1 === SectCount ? -1 : SectIndex );

        var Header = this.HdrFtr.Pages[nPageIndex].Header;
        var Footer = this.HdrFtr.Pages[nPageIndex].Footer;

        var RepH = ( null === Header || null !== SectPr.GetHdrFtrInfo(Header) ? false : true );
        var RepF = ( null === Footer || null !== SectPr.GetHdrFtrInfo(Footer) ? false : true );

        var HeaderInfo = undefined;
        if (null !== Header && undefined !== Header.RecalcInfo.PageNumInfo[nPageIndex])
        {
            var bFirst = Header.RecalcInfo.PageNumInfo[nPageIndex].bFirst;
            var bEven  = Header.RecalcInfo.PageNumInfo[nPageIndex].bEven;

            var HeaderSectPr = Header.RecalcInfo.SectPr[nPageIndex];

            if (undefined !== HeaderSectPr)
                bFirst = ( true === bFirst && true === HeaderSectPr.Get_TitlePage() ? true : false );

            HeaderInfo = {bFirst : bFirst, bEven : bEven};
        }

        var FooterInfo = undefined;
        if (null !== Footer && undefined !== Footer.RecalcInfo.PageNumInfo[nPageIndex])
        {
            var bFirst = Footer.RecalcInfo.PageNumInfo[nPageIndex].bFirst;
            var bEven  = Footer.RecalcInfo.PageNumInfo[nPageIndex].bEven;

            var FooterSectPr = Footer.RecalcInfo.SectPr[nPageIndex];

            if (undefined !== FooterSectPr)
                bFirst = ( true === bFirst && true === FooterSectPr.Get_TitlePage() ? true : false );

            FooterInfo = {bFirst : bFirst, bEven : bEven};
        }

		var oHdrFtrLine = this.HdrFtr.GetHdrFtrLines(nPageIndex);
		var nHeaderY    = this.Pages[nPageIndex].Y;
		if (null !== oHdrFtrLine.Top && oHdrFtrLine.Top > nHeaderY)
			nHeaderY = oHdrFtrLine.Top;

		var nFooterY = this.Pages[nPageIndex].YLimit;
		if (null !== oHdrFtrLine.Bottom && oHdrFtrLine.Bottom < nFooterY)
			nFooterY = oHdrFtrLine.Bottom;

        pGraphics.DrawHeaderEdit(nHeaderY, this.HdrFtr.Lock.Get_Type(), SectIndex, RepH, HeaderInfo);
        pGraphics.DrawFooterEdit(nFooterY, this.HdrFtr.Lock.Get_Type(), SectIndex, RepF, FooterInfo);
    }
};
CDocument.prototype.DrawPageBorders = function(Graphics, oSectPr, nPageIndex)
{
	var LBorder = oSectPr.Get_Borders_Left();
	var TBorder = oSectPr.Get_Borders_Top();
	var RBorder = oSectPr.Get_Borders_Right();
	var BBorder = oSectPr.Get_Borders_Bottom();

	var W = oSectPr.GetPageWidth();
	var H = oSectPr.GetPageHeight();

	// Порядок отрисовки границ всегда одинаковый вне зависимости от цветы и толщины: сначала вертикальные,
	// потом горизонтальные поверх вертикальных

	if (section_borders_OffsetFromPage === oSectPr.GetBordersOffsetFrom())
	{
		// Рисуем левую границу
		if (border_None !== LBorder.Value)
		{
			var X  = LBorder.Space + LBorder.Size / 2;
			var Y0 = ( border_None !== TBorder.Value ? TBorder.Space + TBorder.Size / 2 : 0 );
			var Y1 = ( border_None !== BBorder.Value ? H - BBorder.Space - BBorder.Size / 2 : H );

			Graphics.p_color(LBorder.Color.r, LBorder.Color.g, LBorder.Color.b, 255);
			Graphics.drawVerLine(c_oAscLineDrawingRule.Center, X, Y0, Y1, LBorder.Size);
		}

		// Рисуем правую границу
		if (border_None !== RBorder.Value)
		{
			var X  = W - RBorder.Space - RBorder.Size / 2;
			var Y0 = ( border_None !== TBorder.Value ? TBorder.Space + TBorder.Size / 2 : 0 );
			var Y1 = ( border_None !== BBorder.Value ? H - BBorder.Space - BBorder.Size / 2 : H );

			Graphics.p_color(RBorder.Color.r, RBorder.Color.g, RBorder.Color.b, 255);
			Graphics.drawVerLine(c_oAscLineDrawingRule.Center, X, Y0, Y1, RBorder.Size);
		}

		// Рисуем верхнюю границу
		if (border_None !== TBorder.Value)
		{
			var Y  = TBorder.Space;
			var X0 = ( border_None !== LBorder.Value ? LBorder.Space + LBorder.Size / 2 : 0 );
			var X1 = ( border_None !== RBorder.Value ? W - RBorder.Space - RBorder.Size / 2 : W );

			Graphics.p_color(TBorder.Color.r, TBorder.Color.g, TBorder.Color.b, 255);
			Graphics.drawHorLineExt(c_oAscLineDrawingRule.Top, Y, X0, X1, TBorder.Size, ( border_None !== LBorder.Value ? -LBorder.Size / 2 : 0 ), ( border_None !== RBorder.Value ? RBorder.Size / 2 : 0 ));
		}

		// Рисуем нижнюю границу
		if (border_None !== BBorder.Value)
		{
			var Y  = H - BBorder.Space;
			var X0 = ( border_None !== LBorder.Value ? LBorder.Space + LBorder.Size / 2 : 0 );
			var X1 = ( border_None !== RBorder.Value ? W - RBorder.Space - RBorder.Size / 2 : W );

			Graphics.p_color(BBorder.Color.r, BBorder.Color.g, BBorder.Color.b, 255);
			Graphics.drawHorLineExt(c_oAscLineDrawingRule.Bottom, Y, X0, X1, BBorder.Size, ( border_None !== LBorder.Value ? -LBorder.Size / 2 : 0 ), ( border_None !== RBorder.Value ? RBorder.Size / 2 : 0 ));
		}
	}
	else
	{
		var oFrame = oSectPr.GetContentFrame(nPageIndex);

		var _X0 = oFrame.Left;
		var _X1 = oFrame.Right;
		var _Y0 = oFrame.Top;
		var _Y1 = oFrame.Bottom;

		// Рисуем левую границу
		if (border_None !== LBorder.Value)
		{
			var X  = _X0 - LBorder.Space;
			var Y0 = ( border_None !== TBorder.Value ? _Y0 - TBorder.Space - TBorder.Size / 2 : _Y0 );
			var Y1 = ( border_None !== BBorder.Value ? _Y1 + BBorder.Space + BBorder.Size / 2 : _Y1 );

			Graphics.p_color(LBorder.Color.r, LBorder.Color.g, LBorder.Color.b, 255);
			Graphics.drawVerLine(c_oAscLineDrawingRule.Right, X, Y0, Y1, LBorder.Size);
		}

		// Рисуем правую границу
		if (border_None !== RBorder.Value)
		{
			var X  = _X1 + RBorder.Space;
			var Y0 = ( border_None !== TBorder.Value ? _Y0 - TBorder.Space - TBorder.Size / 2 : _Y0 );
			var Y1 = ( border_None !== BBorder.Value ? _Y1 + BBorder.Space + BBorder.Size / 2 : _Y1 );

			Graphics.p_color(RBorder.Color.r, RBorder.Color.g, RBorder.Color.b, 255);
			Graphics.drawVerLine(c_oAscLineDrawingRule.Left, X, Y0, Y1, RBorder.Size);
		}

		// Рисуем верхнюю границу
		if (border_None !== TBorder.Value)
		{
			var Y  = _Y0 - TBorder.Space;
			var X0 = ( border_None !== LBorder.Value ? _X0 - LBorder.Space : _X0 );
			var X1 = ( border_None !== RBorder.Value ? _X1 + RBorder.Space : _X1 );

			Graphics.p_color(TBorder.Color.r, TBorder.Color.g, TBorder.Color.b, 255);
			Graphics.drawHorLineExt(c_oAscLineDrawingRule.Bottom, Y, X0, X1, TBorder.Size, ( border_None !== LBorder.Value ? -LBorder.Size : 0 ), ( border_None !== RBorder.Value ? RBorder.Size : 0 ));
		}

		// Рисуем нижнюю границу
		if (border_None !== BBorder.Value)
		{
			var Y  = _Y1 + BBorder.Space;
			var X0 = ( border_None !== LBorder.Value ? _X0 - LBorder.Space : _X0 );
			var X1 = ( border_None !== RBorder.Value ? _X1 + RBorder.Space : _X1 );

			Graphics.p_color(BBorder.Color.r, BBorder.Color.g, BBorder.Color.b, 255);
			Graphics.drawHorLineExt(c_oAscLineDrawingRule.Top, Y, X0, X1, BBorder.Size, ( border_None !== LBorder.Value ? -LBorder.Size : 0 ), ( border_None !== RBorder.Value ? RBorder.Size : 0 ));
		}
	}

	// TODO: Реализовать:
	//       1. ArtBorders
	//       2. Различные типы обычных границ. Причем, если пересакающиеся границы имеют одинаковый тип и размер,
	//          тогда надо специально отрисовывать места соединения данных линий.

};
/**
 *
 * @param bRecalculate
 * @param bForceAdd - добавляем параграф, пропуская всякие проверки типа пустого параграфа с нумерацией.
 */
CDocument.prototype.AddNewParagraph = function(bRecalculate, bForceAdd)
{
	this.Controller.AddNewParagraph(bRecalculate, bForceAdd);

	if (false !== bRecalculate)
		this.Recalculate();

	this.UpdateInterface();
	this.private_UpdateCursorXY(true, true);
};
/**
 * Расширяем документ до точки (X,Y) с помощью новых параграфов.
 * Y0 - низ последнего параграфа, YLimit - предел страницы.
 * @param X
 * @param Y
 */
CDocument.prototype.Extend_ToPos = function(X, Y)
{
    var LastPara  = this.GetLastParagraph();
    var LastPara2 = LastPara;

    this.StartAction(AscDFH.historydescription_Document_DocumentExtendToPos);
    this.History.Set_Additional_ExtendDocumentToPos();

    while (true)
    {
        var NewParagraph = new Paragraph(this.DrawingDocument, this);
        var NewRun       = new ParaRun(NewParagraph, false);
        NewParagraph.Add_ToContent(0, NewRun);

        var StyleId = LastPara.Style_Get();
        var NextId  = undefined;

        if (undefined != StyleId)
        {
            NextId = this.Styles.Get_Next(StyleId);

            if (null === NextId || undefined === NextId)
                NextId = StyleId;
        }

        // Простое добавление стиля, без дополнительных действий
        if (NextId === this.Styles.Get_Default_Paragraph() || NextId === this.Styles.Get_Default_ParaList())
            NewParagraph.Style_Remove();
        else
            NewParagraph.Style_Add(NextId, true);

        if (undefined != LastPara.TextPr.Value.FontSize || undefined !== LastPara.TextPr.Value.RFonts.Ascii)
        {
            var TextPr        = new CTextPr();
            TextPr.FontSize   = LastPara.TextPr.Value.FontSize;
            TextPr.FontSizeCS = LastPara.TextPr.Value.FontSize;
            TextPr.RFonts     = LastPara.TextPr.Value.RFonts.Copy();
            NewParagraph.SelectAll();
            NewParagraph.Apply_TextPr(TextPr);
        }

        var CurPage = LastPara.Pages.length - 1;
        var X0      = LastPara.Pages[CurPage].X;
        var Y0      = LastPara.Pages[CurPage].Bounds.Bottom;
        var XLimit  = LastPara.Pages[CurPage].XLimit;
        var YLimit  = LastPara.Pages[CurPage].YLimit;
        var PageNum = LastPara.PageNum;

		this.AddToContent(this.Content.length, NewParagraph, false);

        NewParagraph.Reset(X0, Y0, XLimit, YLimit, PageNum);
        var RecalcResult = NewParagraph.Recalculate_Page(0);

        if (recalcresult_NextElement != RecalcResult)
        {
        	this.RemoveFromContent(this.Content.length - 1, 1, false);
            break;
        }

        if (NewParagraph.Pages[0].Bounds.Bottom > Y)
            break;

        LastPara = NewParagraph;
    }

    LastPara = this.Content[this.Content.length - 1];

    if (LastPara != LastPara2 || false === this.Document_Is_SelectionLocked(changestype_None, {
            Type      : changestype_2_Element_and_Type,
            Element   : LastPara,
            CheckType : changestype_Paragraph_Content
        }))
    {
        // Теперь нам нужно вставить таб по X
        LastPara.Extend_ToPos(X);
    }

    LastPara.MoveCursorToEndPos();
    LastPara.Document_SetThisElementCurrent(true);

    this.Recalculate();
    this.FinalizeAction();
};
CDocument.prototype.GroupGraphicObjects = function()
{
	if (this.CanGroup())
	{
		this.DrawingObjects.groupSelectedObjects();
	}
};
CDocument.prototype.UnGroupGraphicObjects = function()
{
	if (this.CanUnGroup())
	{
		this.DrawingObjects.unGroupSelectedObjects();
	}
};
CDocument.prototype.StartChangeWrapPolygon = function()
{
	this.DrawingObjects.startChangeWrapPolygon();
};
CDocument.prototype.CanChangeWrapPolygon = function()
{
	return this.DrawingObjects.canChangeWrapPolygon();
};
CDocument.prototype.CanGroup = function()
{
	return this.DrawingObjects.canGroup();
};
CDocument.prototype.CanUnGroup = function()
{
	return this.DrawingObjects.canUnGroup();
};
CDocument.prototype.AddInlineImage = function(W, H, Img, Chart, bFlow)
{
	if (undefined === bFlow)
		bFlow = false;


    this.TurnOff_InterfaceEvents();
    this.Controller.AddInlineImage(W, H, Img, Chart, bFlow);
    this.TurnOn_InterfaceEvents(true);
};

CDocument.prototype.AddImages = function(aImages){
    this.Controller.AddImages(aImages);
};

CDocument.prototype.AddOleObject  = function(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId)
{
	this.Controller.AddOleObject(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId);
};
CDocument.prototype.EditOleObject = function(oOleObject, sData, sImageUrl, nPixWidth, nPixHeight)
{
	oOleObject.setData(sData);
	var _blipFill           = new AscFormat.CBlipFill();
	_blipFill.RasterImageId = sImageUrl;
	oOleObject.setBlipFill(_blipFill);
	oOleObject.setPixSizes(nPixWidth, nPixHeight);
};
CDocument.prototype.AddTextArt = function(nStyle)
{
	this.Controller.AddTextArt(nStyle);
};

CDocument.prototype.AddSignatureLine = function(oSignatureDrawing){
    this.Controller.AddSignatureLine(oSignatureDrawing);
};

CDocument.prototype.EditChart = function(Chart)
{
	this.Controller.EditChart(Chart);
};
CDocument.prototype.GetChartObject = function(type)
{
    var W = null, H = null;
    if(type != null)
    {
        var oTargetContent = this.DrawingObjects.getTargetDocContent();
        if(oTargetContent && !oTargetContent.bPresentation)
        {
            W = oTargetContent.XLimit;
            H = W;
        }
        else
        {
            var oColumnSize = this.GetColumnSize();
            if(oColumnSize)
            {
                W = oColumnSize.W;
                H = oColumnSize.H;
            }
        }
    }
    return this.DrawingObjects.getChartObject(type, W, H);

};
/**
 * Добавляем таблицу в текущую позицию курсора
 * @param {number} nCols
 * @param {number} nRows
 * @param {number} [nMode=0] 0 - делим параграф в текущей точке, -1 добавляем до текущего параграфа, 1 - добавляем после текущего параграфа
 * @returns {?CTable}
 */
CDocument.prototype.AddInlineTable = function(nCols, nRows, nMode)
{
	if (nCols <= 0 || nRows <= 0)
		return null;

	var oTable = this.Controller.AddInlineTable(nCols, nRows, nMode);

	this.Recalculate();
	this.UpdateSelection();
	this.UpdateInterface();
	this.UpdateRulers();

	return oTable;
};
CDocument.prototype.AddDropCap = function(bInText)
{
	// Определим параграф, к которому мы будем добавлять буквицу
	var Pos = -1;

	if (false === this.Selection.Use)
		Pos = this.CurPos.ContentPos;
	else if (true === this.Selection.Use && this.Selection.StartPos <= this.Selection.EndPos)
		Pos = this.Selection.StartPos;
	else if (true === this.Selection.Use && this.Selection.StartPos > this.Selection.EndPos)
		Pos = this.Selection.EndPos;

	if (-1 === Pos || !this.Content[Pos].IsParagraph())
		return;

	var OldParagraph = this.Content[Pos];

	if (this.IsSelectionUse() && !OldParagraph.CheckSelectionForDropCap())
		this.RemoveSelection();

	if (!this.IsSelectionUse() && !OldParagraph.SelectFirstLetter())
		return;

	if (OldParagraph.Lines.length <= 0)
		return;

	if (!this.IsSelectionLocked(changestype_Paragraph_Content))
	{
		this.StartAction(AscDFH.historydescription_Document_AddDropCap);

		var NewParagraph = new Paragraph(this.DrawingDocument, this);

		var TextPr = OldParagraph.Split_DropCap(NewParagraph);
		var Before = OldParagraph.Get_CompiledPr().ParaPr.Spacing.Before;
		var LineH  = OldParagraph.Lines[0].Bottom - OldParagraph.Lines[0].Top - Before;
		var LineTA = OldParagraph.Lines[0].Metrics.TextAscent2;
		var LineTD = OldParagraph.Lines[0].Metrics.TextDescent + OldParagraph.Lines[0].Metrics.LineGap;

		var FramePr = new CFramePr();
		FramePr.Init_Default_DropCap(bInText);
		NewParagraph.Set_FrameParaPr(OldParagraph);
		NewParagraph.Set_FramePr2(FramePr);
		NewParagraph.Update_DropCapByLines(TextPr, NewParagraph.Pr.FramePr.Lines, LineH, LineTA, LineTD, Before);

		this.Internal_Content_Add(Pos, NewParagraph);
		NewParagraph.MoveCursorToEndPos();

		this.RemoveSelection();
		this.CurPos.ContentPos = Pos;
		this.SetDocPosType(docpostype_Content);

		this.Recalculate();
		this.UpdateInterface();
		this.UpdateRulers();
		this.UpdateTracks();
		this.FinalizeAction();
	}
};
CDocument.prototype.RemoveDropCap = function(bDropCap)
{
	var Pos = -1;

	if (false === this.Selection.Use && type_Paragraph === this.Content[this.CurPos.ContentPos].GetType())
		Pos = this.CurPos.ContentPos;
	else if (true === this.Selection.Use && this.Selection.StartPos <= this.Selection.EndPos && type_Paragraph === this.Content[this.Selection.StartPos].GetType())
		Pos = this.Selection.StartPos;
	else if (true === this.Selection.Use && this.Selection.StartPos > this.Selection.EndPos && type_Paragraph === this.Content[this.Selection.EndPos].GetType())
		Pos = this.Selection.EndPos;

	if (-1 === Pos)
		return;

	var Para    = this.Content[Pos];
	var FramePr = Para.Get_FramePr();

	// Возможно буквицой является предыдущий параграф
	if (undefined === FramePr && true === bDropCap)
	{
		var Prev = Para.Get_DocumentPrev();
		if (null != Prev && type_Paragraph === Prev.GetType())
		{
			var PrevFramePr = Prev.Get_FramePr();
			if (undefined != PrevFramePr && undefined != PrevFramePr.DropCap)
			{
				Para    = Prev;
				FramePr = PrevFramePr;
			}
			else
				return;
		}
		else
			return;
	}

	if (undefined === FramePr)
		return;

	var FrameParas = Para.Internal_Get_FrameParagraphs();

	if (false === bDropCap)
	{
		if (false === this.Document_Is_SelectionLocked(changestype_None, {
				Type      : changestype_2_ElementsArray_and_Type,
				Elements  : FrameParas,
				CheckType : changestype_Paragraph_Content
			}))
		{
			this.StartAction(AscDFH.historydescription_Document_RemoveDropCap);
			var Count = FrameParas.length;
			for (var Index = 0; Index < Count; Index++)
			{
				FrameParas[Index].Set_FramePr(undefined, true);
			}

			this.Recalculate();
			this.UpdateInterface();
			this.UpdateRulers();
			this.FinalizeAction();
		}
	}
	else
	{
		// Сначала найдем параграф, к которому относится буквица
		var Next = Para.Get_DocumentNext();
		var Last = Para;
		while (null != Next)
		{
			if (type_Paragraph != Next.GetType() || undefined === Next.Get_FramePr() || true != FramePr.Compare(Next.Get_FramePr()))
				break;

			Last = Next;
			Next = Next.Get_DocumentNext();
		}

		if (null != Next && type_Paragraph === Next.GetType())
		{
			FrameParas.push(Next);
			if (false === this.Document_Is_SelectionLocked(changestype_None, {
					Type      : changestype_2_ElementsArray_and_Type,
					Elements  : FrameParas,
					CheckType : changestype_Paragraph_Content
				}))
			{
				this.StartAction(AscDFH.historydescription_Document_RemoveDropCap);

				// Удалим ненужный элемент
				FrameParas.splice(FrameParas.length - 1, 1);

				// Передвинем курсор в начало следующего параграфа, и рассчитаем текстовые настройки и расстояния между строк
				Next.MoveCursorToStartPos();
				var Spacing = Next.Get_CompiledPr2(false).ParaPr.Spacing.Copy();
				var TextPr  = Next.GetFirstRunPr();

				var Count = FrameParas.length;
				for (var Index = 0; Index < Count; Index++)
				{
					var FramePara = FrameParas[Index];
					FramePara.Set_FramePr(undefined, true);
					FramePara.Set_Spacing(Spacing, true);
					FramePara.SelectAll();
					FramePara.Clear_TextFormatting();
					FramePara.Apply_TextPr(TextPr, undefined);
				}


				Next.CopyPr(Last);
				Last.Concat(Next);

				this.Internal_Content_Remove(Next.Index, 1);

				Last.MoveCursorToStartPos();
				Last.Document_SetThisElementCurrent(true);

				this.Recalculate();
				this.UpdateInterface();
				this.UpdateRulers();
				this.FinalizeAction();
			}
		}
		else
		{
			if (false === this.Document_Is_SelectionLocked(changestype_None, {
					Type      : changestype_2_ElementsArray_and_Type,
					Elements  : FrameParas,
					CheckType : changestype_Paragraph_Content
				}))
			{
				this.StartAction(AscDFH.historydescription_Document_RemoveDropCap);
				var Count = FrameParas.length;
				for (var Index = 0; Index < Count; Index++)
				{
					FrameParas[Index].Set_FramePr(undefined, true);
				}

				this.Recalculate();
				this.UpdateInterface();
				this.UpdateRulers();
				this.FinalizeAction();
			}
		}
	}
};
CDocument.prototype.private_CheckFramePrLastParagraph = function()
{
    var Count = this.Content.length;
    if (Count <= 0)
        return;

    var Element = this.Content[Count - 1];
    if (type_Paragraph === Element.GetType() && undefined !== Element.Get_FramePr())
    {
        Element.Set_FramePr(undefined, true);
    }
};
CDocument.prototype.CheckRange = function(X0, Y0, X1, Y1, _Y0, _Y1, X_lf, X_rf, PageNum, Inner, bMathWrap)
{
	var HdrFtrRanges = this.HdrFtr.CheckRange(X0, Y0, X1, Y1, _Y0, _Y1, X_lf, X_rf, PageNum, bMathWrap);
	return this.DrawingObjects.CheckRange(X0, Y0, X1, Y1, _Y0, _Y1, X_lf, X_rf, PageNum, HdrFtrRanges, null, bMathWrap);
};
CDocument.prototype.AddToParagraph = function(oParaItem, bRecalculate)
{
	if (!oParaItem)
		return;

	if (this.IsNumberingSelection() && para_TextPr !== oParaItem.Type)
		this.RemoveSelection();

	this.Controller.AddToParagraph(oParaItem, bRecalculate);
};
/**
 * Очищаем форматирование внутри селекта
 * {boolean} [isClearParaPr=true] Очищать ли настройки параграфа
 * {boolean} [isClearTextPr=true] Очищать ли настройки текста
 */
CDocument.prototype.ClearParagraphFormatting = function(isClearParaPr, isClearTextPr)
{
	if (false !== isClearParaPr)
		isClearParaPr = true;

	if (false !== isClearTextPr)
		isClearTextPr = true;

	this.Controller.ClearParagraphFormatting(isClearParaPr, isClearTextPr);

	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.Remove = function(nDirection, isRemoveWholeElement, bRemoveOnlySelection, bOnTextAdd, isWord)
{
	if (undefined === bRemoveOnlySelection)
		bRemoveOnlySelection = false;

	if (undefined === bOnTextAdd)
		bOnTextAdd = false;

	if (undefined === isWord)
		isWord = false;

	this.Controller.Remove(nDirection, isRemoveWholeElement, bRemoveOnlySelection, bOnTextAdd, isWord);

	this.Recalculate();
	this.UpdateInterface();
	this.UpdateRulers();
	this.UpdateTracks();
};
CDocument.prototype.RemoveBeforePaste = function()
{
	if ((docpostype_DrawingObjects === this.GetDocPosType() && null === this.DrawingObjects.getTargetDocContent())
		|| (docpostype_HdrFtr === this.GetDocPosType() && this.HdrFtr.CurHdrFtr && docpostype_DrawingObjects === this.HdrFtr.CurHdrFtr.GetContent().GetDocPosType() && null === this.DrawingObjects.getTargetDocContent()))
		this.RemoveSelection();
	else
		this.Remove(1, true, true, true);
};
CDocument.prototype.GetCursorPosXY = function()
{
	return this.Controller.GetCursorPosXY();
};
/**
 * Получаем точное физическое положение курсора
 * @returns {{X: number, Y: number}}
 */
CDocument.prototype.GetCursorRealPosition = function()
{
	return {
		X : this.CurPos.RealX,
		Y : this.CurPos.RealY
	};
};
CDocument.prototype.MoveCursorToStartOfDocument = function()
{
	var nDocPosType = this.GetDocPosType();

	if (nDocPosType === docpostype_DrawingObjects)
		this.EndDrawingEditing();
	else if (nDocPosType === docpostype_Footnotes)
		this.EndFootnotesEditing();
	else if (nDocPosType === docpostype_HdrFtr)
		this.EndHdrFtrEditing();

	this.RemoveSelection();
	this.SetDocPosType(docpostype_Content);
	this.MoveCursorToStartPos(false);
};
CDocument.prototype.MoveCursorToStartPos = function(AddToSelect)
{
	this.Reset_WordSelection();
	this.private_UpdateTargetForCollaboration();

	this.Controller.MoveCursorToStartPos(AddToSelect);

	this.private_UpdateCursorXY(true, true);
};
CDocument.prototype.MoveCursorToEndPos = function(AddToSelect)
{
	this.Reset_WordSelection();
	this.private_UpdateTargetForCollaboration();

	this.Controller.MoveCursorToEndPos(AddToSelect);

	this.private_UpdateCursorXY(true, true);
};
CDocument.prototype.MoveCursorLeft = function(AddToSelect, Word)
{
	this.Reset_WordSelection();
	this.private_UpdateTargetForCollaboration();

	if (undefined === Word || null === Word)
		Word = false;

	this.Controller.MoveCursorLeft(AddToSelect, Word);

	this.Document_UpdateInterfaceState();
	this.Document_UpdateRulersState();
	this.private_UpdateCursorXY(true, true);
};
CDocument.prototype.MoveCursorRight = function(AddToSelect, Word, FromPaste)
{
	this.Reset_WordSelection();
	this.private_UpdateTargetForCollaboration();

	if (undefined === Word || null === Word)
		Word = false;

	this.Controller.MoveCursorRight(AddToSelect, Word, FromPaste);

	this.Document_UpdateInterfaceState();
	this.Document_UpdateSelectionState();
	this.private_UpdateCursorXY(true, true);
};
CDocument.prototype.MoveCursorUp = function(AddToSelect, CtrlKey)
{
	this.Reset_WordSelection();
	this.private_UpdateTargetForCollaboration();

	if (true === this.IsFillingFormMode())
		this.MoveToFillingForm(false);
	else
		this.Controller.MoveCursorUp(AddToSelect, CtrlKey);
};
CDocument.prototype.MoveCursorDown = function(AddToSelect, CtrlKey)
{
	this.Reset_WordSelection();
	this.private_UpdateTargetForCollaboration();

	if (true === this.IsFillingFormMode())
		this.MoveToFillingForm(true);
	else
		this.Controller.MoveCursorDown(AddToSelect, CtrlKey);
};
CDocument.prototype.MoveCursorToEndOfLine = function(AddToSelect)
{
	this.Reset_WordSelection();
	this.private_UpdateTargetForCollaboration();

	this.Controller.MoveCursorToEndOfLine(AddToSelect);

	this.Document_UpdateInterfaceState();
	this.private_UpdateCursorXY(true, true);
};
CDocument.prototype.MoveCursorToStartOfLine = function(AddToSelect)
{
	this.Reset_WordSelection();
	this.private_UpdateTargetForCollaboration();

	this.Controller.MoveCursorToStartOfLine(AddToSelect);

	this.Document_UpdateInterfaceState();
	this.private_UpdateCursorXY(true, true);
};
CDocument.prototype.MoveCursorToXY = function(X, Y, AddToSelect)
{
	this.Reset_WordSelection();
	this.private_UpdateTargetForCollaboration();
	this.Controller.MoveCursorToXY(X, Y, this.CurPage, AddToSelect);
};
CDocument.prototype.MoveCursorToCell = function(bNext)
{
	this.Reset_WordSelection();
	this.private_UpdateTargetForCollaboration();
	this.Controller.MoveCursorToCell(bNext);
};
CDocument.prototype.MoveCursorToSignature = function(sGuid)
{
    this.DrawingObjects.moveCursorToSignature(sGuid);
};
CDocument.prototype.MoveCursorToPageStart = function()
{
	if (docpostype_Content !== this.GetDocPosType())
	{
		this.RemoveSelection();
		this.SetDocPosType(docpostype_Content);
	}

	this.MoveCursorToXY(0, 0, false);
	this.UpdateInterface();
	this.UpdateSelection();
};
CDocument.prototype.MoveCursorToPageEnd = function()
{
	if (docpostype_Content !== this.GetDocPosType())
	{
		this.RemoveSelection();
		this.SetDocPosType(docpostype_Content);
	}

	this.MoveCursorToXY(0, 10000, false);
	this.UpdateInterface();
	this.UpdateSelection();
};
CDocument.prototype.SetParagraphAlign = function(Align)
{
	var SelectedInfo = this.GetSelectedElementsInfo();
	var Math         = SelectedInfo.Get_Math();
	if (null !== Math && true !== Math.Is_Inline())
	{
		Math.Set_Align(Align);
	}
	else
	{
		this.Controller.SetParagraphAlign(Align);
	}

	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.SetParagraphSpacing = function(Spacing)
{
	this.Controller.SetParagraphSpacing(Spacing);
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.SetParagraphTabs = function(Tabs)
{
	this.Controller.SetParagraphTabs(Tabs);
	this.Recalculate();
	this.UpdateSelection();
	this.UpdateInterface();
	this.Api.Update_ParaTab(AscCommonWord.Default_Tab_Stop, Tabs);
};
CDocument.prototype.SetParagraphIndent = function(Ind)
{
	this.Controller.SetParagraphIndent(Ind);
	this.Recalculate();
	this.UpdateSelection();
	this.UpdateInterface();
};
CDocument.prototype.SetParagraphNumbering = function(NumInfo)
{
	if (this.private_SetParagraphNumbering(NumInfo))
	{
		this.Recalculate();
		this.Document_UpdateSelectionState();
		this.Document_UpdateInterfaceState();
	}
};
CDocument.prototype.SetParagraphOutlineLvl = function(nLvl)
{
	var arrParagraphs = this.GetSelectedParagraphs();
	for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
	{
		arrParagraphs[nIndex].SetOutlineLvl(nLvl);
		arrParagraphs[nIndex].UpdateDocumentOutline();
	}

	this.Recalculate();
};
CDocument.prototype.private_SetParagraphNumbering = function(oNumInfo)
{
	var oNumPr = this.GetSelectedNum();

	var arrSelectedParagraphs;

	if (oNumPr)
		arrSelectedParagraphs = this.GetAllParagraphsByNumbering(oNumPr);
	else
		arrSelectedParagraphs = this.GetSelectedParagraphs();

	if (arrSelectedParagraphs.length <= 0)
		return false;

	if (oNumInfo.SubType < 0)
	{
		this.private_RemoveParagraphNumbering(arrSelectedParagraphs, oNumPr);
	}
	else
	{
		if (0 === oNumInfo.Type) // Bullet
		{
			if (0 === oNumInfo.SubType)
				this.private_SetParagraphNumberingSimpleBullet(arrSelectedParagraphs, oNumPr);
			else
				this.private_SetParagraphNumberingCustomBullet(arrSelectedParagraphs, oNumPr, oNumInfo.SubType)
		}
		else if (1 === oNumInfo.Type) // Numbered
		{
			if (0 === oNumInfo.SubType)
				this.private_SetParagraphNumberingSimpleNumbered(arrSelectedParagraphs, oNumPr);
			else
				this.private_SetParagraphNumberingCustomNumbered(arrSelectedParagraphs, oNumPr, oNumInfo.SubType);
		}
		else if (2 === oNumInfo.Type) // Multilevel
		{
			this.private_SetParagraphNumberingMultiLevel(arrSelectedParagraphs, oNumPr, oNumInfo.SubType);
		}
	}

	for (var nIndex = 0, nCount = arrSelectedParagraphs.length; nIndex < nCount; ++nIndex)
	{
		arrSelectedParagraphs[nIndex].UpdateDocumentOutline();
	}

	return true;
};
CDocument.prototype.private_RemoveParagraphNumbering = function(arrParagraphs, oNumPr)
{
	if (this.GetSelectedNum())
		this.RemoveSelection();

	for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
	{
		var oPara = arrParagraphs[nIndex];
		oPara.RemoveNumPr();
	}
};
CDocument.prototype.private_SetParagraphNumberingSimpleBullet = function(arrParagraphs, oNumPr)
{
	if (arrParagraphs.length <= 0)
		return;

	// 1. Пытаемся присоединить список к списку предыдущего параграфа (если только он маркированный)
	// 2. Пытаемся присоединить список к списку следующего параграфа (если он маркированный)
	// 3. Пытаемся добавить список, который добавлялся предыдущий раз
	// 4. Создаем новый маркированный список

	var sNumId  = null;
	var nNumLvl = 0;

	var oPrevPara = arrParagraphs[0].GetPrevParagraph();
	if (oPrevPara && oPrevPara.GetNumPr())
	{
		var oPrevNumPr = oPrevPara.GetNumPr();
		if (oPrevNumPr && this.Numbering.CheckFormat(oPrevNumPr.NumId, oPrevNumPr.Lvl, Asc.c_oAscNumberingFormat.Bullet))
		{
			sNumId  = oPrevNumPr.NumId;
			nNumLvl = oPrevNumPr.Lvl;
		}
	}

	if (!sNumId)
	{
		var oNextPara = arrParagraphs[arrParagraphs.length - 1].GetNextParagraph();
		if (oNextPara && oNextPara.GetNumPr())
		{
			var oNextNumPr = oNextPara.GetNumPr();
			if (oNextNumPr && this.Numbering.CheckFormat(oNextNumPr.NumId, oNextNumPr.Lvl, Asc.c_oAscNumberingFormat.Bullet))
			{
				sNumId  = oNextNumPr.NumId;
				nNumLvl = oNextNumPr.Lvl;
			}
		}
	}

	if (oNumPr && this.Numbering.GetNum(oNumPr.NumId))
	{
		var oNum = this.Numbering.GetNum(oNumPr.NumId);
		var oLvl;

		var oLastNumPr = this.GetLastBulletList();
		if (oLastNumPr && this.Numbering.GetNum(oLastNumPr.NumId) && this.Numbering.GetNum(oLastNumPr.NumId).GetLvl(oLastNumPr.Lvl).IsBulleted())
		{
			var oLastNum = this.Numbering.GetNum(oLastNumPr.NumId);
			oLvl         = oLastNum.GetLvl(oLastNumPr.Lvl).Copy();
		}
		else
		{
			oLvl = oNum.GetLvl(oNumPr.Lvl).Copy();

			var oTextPr = new CTextPr();
			oTextPr.RFonts.SetAll("Symbol");
			oLvl.SetByType(c_oAscNumberingLevel.Bullet, oNumPr.Lvl, String.fromCharCode(0x00B7), oTextPr);
		}

		oLvl.ParaPr = oNum.GetLvl(oNumPr.Lvl).ParaPr.Copy();

		oNum.SetLvl(oLvl, oNumPr.Lvl);
		this.SetLastBulletList(oNumPr.NumId, oNumPr.Lvl);
		return;
	}

	var isCheckPrev = false;
	if (!sNumId)
	{
		var oLastNumPr = this.GetLastBulletList();
		if (oLastNumPr && this.Numbering.GetNum(oLastNumPr.NumId) && this.Numbering.GetNum(oLastNumPr.NumId).GetLvl(0).IsBulleted())
		{
			var oPrevNum = this.Numbering.GetNum(oLastNumPr.NumId);

			var oNum = this.Numbering.CreateNum();
			oNum.CreateDefault(c_oAscMultiLevelNumbering.Bullet);
			oNum.SetLvl(oPrevNum.GetLvl(oLastNumPr.Lvl).Copy(), 0);

			sNumId  = oNum.GetId();
			nNumLvl = 0;

			isCheckPrev = true;
		}
	}


	if (!sNumId)
	{
		var oNum = this.Numbering.CreateNum();
		oNum.CreateDefault(c_oAscMultiLevelNumbering.Bullet);

		sNumId  = oNum.GetId();
		nNumLvl = 0;

		isCheckPrev = true;
	}

	if (isCheckPrev)
	{
		var oResult = this.private_CheckPrevNumberingOnAdd(arrParagraphs, sNumId, nNumLvl);
		if (oResult)
		{
			sNumId  = oResult.NumId;
			nNumLvl = oResult.Lvl;
		}
	}

	this.SetLastBulletList(sNumId, nNumLvl);

	// Если у параграфа уже была нумерация, тогда мы сохраняем её уровень, если нет - добавляем с новым значением nNumLvl
	for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
	{
		var oOldNumPr = arrParagraphs[nIndex].GetNumPr();

		if (oOldNumPr)
			arrParagraphs[nIndex].ApplyNumPr(sNumId, oOldNumPr.Lvl);
		else
			arrParagraphs[nIndex].ApplyNumPr(sNumId, nNumLvl);
	}
};
CDocument.prototype.private_SetParagraphNumberingCustomBullet = function(arrParagraphs, oNumPr, nType)
{
	if (arrParagraphs.length <= 0)
		return;

	// Для начала пробежимся и узнаем, есть ли у нас парграфы с разными списками и разными уровнями
	var bDiffLvl = false;
	var bDiffId  = false;
	var nPrevLvl = null;
	var sPrevId  = null;
	for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
	{
		var oTempNumPr = arrParagraphs[nIndex].GetNumPr();
		if (oTempNumPr)
		{
			if (null === nPrevLvl)
				nPrevLvl = oTempNumPr.Lvl;

			if (null === sPrevId)
				sPrevId = oTempNumPr.NumId;

			if (sPrevId !== oTempNumPr.NumId)
				bDiffId = true;

			if (nPrevLvl !== oTempNumPr.Lvl)
			{
				bDiffLvl = true;
				break;
			}
		}
		else
		{
			bDiffLvl = true;
			break;
		}
	}


	// 1. Если у нас есть параграфы со списками разных уровней, тогда мы
	//    делаем стандартный маркированный список, у которого первый(нулевой)
	//    уровень изменен на тот который задан через NumInfo.SubType
	// 2. Если все параграфы содержат списки одного уровня.
	//    2.1 Если у всех списков одинаковый Id, тогда мы создаем
	//        копию текущего списка и меняем в нем текущий уровень
	//        на тот, который задан через NumInfo.SubType
	//    2.2 Если у списков разные Id, тогда мы создаем стандартный
	//        маркированный список с измененным уровнем (равным текущему),
	//        на тот, который прописан в NumInfo.Subtype

	var sLvlText   = "";
	var oLvlTextPr = new CTextPr();
	oLvlTextPr.RFonts.SetAll("Times New Roman");
	switch (nType)
	{
		case 1:
		{
			sLvlText = String.fromCharCode(0x00B7);
			oLvlTextPr.RFonts.SetAll("Symbol");
			break;
		}
		case 2:
		{
			sLvlText = "o";
			oLvlTextPr.RFonts.SetAll("Courier New");
			break;
		}
		case 3:
		{
			sLvlText = String.fromCharCode(0x00A7);
			oLvlTextPr.RFonts.SetAll("Wingdings");
			break;
		}
		case 4:
		{
			sLvlText = String.fromCharCode(0x0076);
			oLvlTextPr.RFonts.SetAll("Wingdings");
			break;
		}
		case 5:
		{
			sLvlText = String.fromCharCode(0x00D8);
			oLvlTextPr.RFonts.SetAll("Wingdings");
			break;
		}
		case 6:
		{
			sLvlText = String.fromCharCode(0x00FC);
			oLvlTextPr.RFonts.SetAll("Wingdings");
			break;
		}
		case 7:
		{
			sLvlText = String.fromCharCode(0x00A8);
			oLvlTextPr.RFonts.SetAll("Symbol");
			break;
		}
		case 8:
		{
			sLvlText = String.fromCharCode(0x2013);
			oLvlTextPr.RFonts.SetAll("Arial");
			break;
		}
	}

	var isCheckPrev = false;

	var sNumId = null;
	if (oNumPr)
	{
		nPrevLvl = oNumPr.Lvl;

		oNum = this.Numbering.GetNum(oNumPr.NumId);
		if (oNum)
		{
			oNum.SetLvlByType(oNumPr.Lvl, c_oAscNumberingLevel.Bullet, sLvlText, oLvlTextPr);
		}

		this.SetLastBulletList(sPrevId, nPrevLvl);
	}
	else if (true === bDiffLvl)
	{
		nPrevLvl = 0;

		var oNum = this.Numbering.CreateNum();
		oNum.CreateDefault(c_oAscMultiLevelNumbering.Bullet);
		oNum.SetLvlByType(0, c_oAscNumberingLevel.Bullet, sLvlText, oLvlTextPr);

		sNumId = oNum.GetId();

		isCheckPrev = true;
	}
	else if (true === bDiffId || true != this.Numbering.CheckFormat(sPrevId, nPrevLvl, Asc.c_oAscNumberingFormat.Bullet))
	{
		var oNum = this.Numbering.CreateNum();
		oNum.CreateDefault(c_oAscMultiLevelNumbering.Bullet);
		oNum.SetLvlByType(nPrevLvl, c_oAscNumberingLevel.Bullet, sLvlText, oLvlTextPr);

		sNumId = oNum.GetId();

		isCheckPrev = true;
	}
	else
	{
		var oNum = this.Numbering.GetNum(sPrevId);
		if (oNum)
		{
			oNum.SetLvlByType(nPrevLvl, c_oAscNumberingLevel.Bullet, sLvlText, oLvlTextPr);
		}

		this.SetLastBulletList(sPrevId, nPrevLvl);
	}

	if (isCheckPrev)
	{
		var oResult = this.private_CheckPrevNumberingOnAdd(arrParagraphs, sNumId, nPrevLvl);
		if (oResult)
			sNumId = oResult.NumId;
	}

	if (sNumId)
	{
		// Параграфы, которые не содержали списка у них уровень выставляем 0,
		// а у тех которые содержали, мы уровень не меняем
		for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
		{
			var oOldNumPr = arrParagraphs[nIndex].GetNumPr();
			if (oOldNumPr)
				arrParagraphs[nIndex].ApplyNumPr(sNumId, oOldNumPr.Lvl);
			else
				arrParagraphs[nIndex].ApplyNumPr(sNumId, 0);
		}

		this.SetLastBulletList(sNumId, 0);
	}
};
CDocument.prototype.private_SetParagraphNumberingSimpleNumbered = function(arrParagraphs, oNumPr)
{
	if (arrParagraphs.length <= 0)
		return;

	// 1. Пытаемся присоединить список к списку предыдущего параграфа (если он нумерованный)
	// 2. Пытаемся присоединить список к списку следующего параграфа (если он нумерованный)
	// 3. Пытаемся добавить список, который добавлялся предыдущий раз (добавляем его копию, и опционально продолжаем)
	// 4. Создаем новый нумерованный список

	var sNumId  = null;
	var nNumLvl = 0;

	var oPrevPara = arrParagraphs[0].GetPrevParagraph();
	if (oPrevPara)
	{
		var oPrevNumPr = oPrevPara.GetNumPr();
		if (oPrevNumPr && true === this.Numbering.CheckFormat(oPrevNumPr.NumId, oPrevNumPr.Lvl, Asc.c_oAscNumberingFormat.Decimal))
		{
			sNumId  = oPrevNumPr.NumId;
			nNumLvl = oPrevNumPr.Lvl;
		}
	}

	if (!sNumId)
	{
		var oNextPara = arrParagraphs[arrParagraphs.length - 1].GetNextParagraph();
		if (oNextPara)
		{
			var oNextNumPr = oNextPara.GetNumPr();
			if (oNextNumPr && true == this.Numbering.CheckFormat(oNextNumPr.NumId, oNextNumPr.Lvl, Asc.c_oAscNumberingFormat.Decimal))
			{
				sNumId  = oNextNumPr.NumId;
				nNumLvl = oNextNumPr.Lvl;
			}
		}
	}

	if (oNumPr && this.Numbering.GetNum(oNumPr.NumId))
	{
		var oNum = this.Numbering.GetNum(oNumPr.NumId);
		var oLvl;

		var oLastNumPr = this.GetLastNumberedList();
		if (oLastNumPr && this.Numbering.GetNum(oLastNumPr.NumId) && this.Numbering.GetNum(oLastNumPr.NumId).GetLvl(oNumPr.Lvl).IsNumbered())
		{
			var oPrevNum = this.Numbering.GetNum(oLastNumPr.NumId);

			if (oPrevNum.IsHaveRelatedLvlText())
			{
				// В этом случае мы не можем подменить просто текущий уровень, меняем целиком весь список
				for (var nLvl = 0; nLvl < 9; ++nLvl)
				{
					oNum.SetLvl(oPrevNum.GetLvl(nLvl).Copy(), nLvl);
				}
			}
			else
			{
				oLvl        = oPrevNum.GetLvl(oLastNumPr.Lvl).Copy();
				oLvl.ParaPr = oNum.GetLvl(oNumPr.Lvl).ParaPr.Copy();
				oLvl.ResetNumberedText(oNumPr.Lvl);

				oNum.SetLvl(oLvl, oNumPr.Lvl);
				this.SetLastNumberedList(oNumPr.NumId, oNumPr.Lvl);
			}
		}
		else
		{
			oLvl = oNum.GetLvl(oNumPr.Lvl).Copy();
			oLvl.SetByType(c_oAscNumberingLevel.DecimalDot_Right, oNumPr.Lvl);
			oLvl.ParaPr = oNum.GetLvl(oNumPr.Lvl).ParaPr.Copy();

			oNum.SetLvl(oLvl, oNumPr.Lvl);
			this.SetLastNumberedList(oNumPr.NumId, oNumPr.Lvl);
		}

		return;
	}

	var isCheckPrev = false;

	if (!sNumId)
	{
		var oLastNumPr = this.GetLastNumberedList();
		if (oLastNumPr && this.Numbering.GetNum(oLastNumPr.NumId) && this.Numbering.GetNum(oLastNumPr.NumId).GetLvl(0).IsNumbered())
		{
			var oLastNum = this.Numbering.GetNum(oLastNumPr.NumId);

			var oNum = this.Numbering.CreateNum();

			if (oLastNum.IsHaveRelatedLvlText())
			{
				for (var nLvl = 0; nLvl < 9; ++nLvl)
				{
					oNum.SetLvl(oLastNum.GetLvl(nLvl).Copy(), nLvl);
				}
			}
			else
			{
				oNum.CreateDefault(c_oAscMultiLevelNumbering.Numbered);
				oNum.SetLvl(oLastNum.GetLvl(oLastNumPr.Lvl).Copy(), 0);
			}

			sNumId  = oNum.GetId();
			nNumLvl = 0;

			isCheckPrev = true;
		}
	}

	if (!sNumId)
	{
		var oNum = this.Numbering.CreateNum();
		oNum.CreateDefault(c_oAscMultiLevelNumbering.Numbered);

		sNumId  = oNum.GetId();
		nNumLvl = 0;

		isCheckPrev = true;
	}

	if (isCheckPrev)
	{
		var oResult = this.private_CheckPrevNumberingOnAdd(arrParagraphs, sNumId, nNumLvl);
		if (oResult)
		{
			sNumId  = oResult.NumId;
			nNumLvl = oResult.Lvl;
		}
	}

	this.SetLastNumberedList(sNumId, nNumLvl);

	// Если у параграфа уже была нумерация, тогда мы сохраняем её уровень, если нет - добавляем с новым значением nNumLvl
	for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
	{
		var oOldNumPr = arrParagraphs[nIndex].GetNumPr();
		if (oOldNumPr)
			arrParagraphs[nIndex].ApplyNumPr(sNumId, oOldNumPr.Lvl);
		else
			arrParagraphs[nIndex].ApplyNumPr(sNumId, nNumLvl);
	}
};
CDocument.prototype.private_SetParagraphNumberingCustomNumbered = function(arrParagraphs, oNumPr, nType)
{
	if (arrParagraphs.length <= 0)
		return;

	// Для начала пробежимся и узнаем, есть ли у нас парграфы с разными списками и разными уровнями
	var bDiffLvl = false;
	var bDiffId  = false;
	var nPrevLvl = null;
	var sPrevId  = null;
	for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
	{
		var oTempNumPr = arrParagraphs[nIndex].GetNumPr();
		if (oTempNumPr)
		{
			if (null === nPrevLvl)
				nPrevLvl = oTempNumPr.Lvl;

			if (null === sPrevId)
				sPrevId = oTempNumPr.NumId;

			if (sPrevId !== oTempNumPr.NumId)
				bDiffId = true;

			if (nPrevLvl !== oTempNumPr.Lvl)
			{
				bDiffLvl = true;
				break;
			}
		}
		else
		{
			bDiffLvl = true;
			break;
		}
	}

	// 1. Если у нас есть параграфы со списками разных уровней, тогда мы
	//    делаем стандартный нумерованный список, у которого первый(нулевой)
	//    уровень изменен на тот который задан через nType
	// 2. Если все параграфы содержат списки одного уровня.
	//    2.1 Если у всех списков одинаковый Id, тогда мы создаем
	//        копию текущего списка и меняем в нем текущий уровень
	//        на тот, который задан через NumInfo.SubType
	//    2.2 Если у списков разные Id, тогда мы создаем стандартный
	//        нумерованный список с измененным уровнем (равным текущему),
	//        на тот, который прописан в NumInfo.Subtype

	var oNum       = null;
	var sNumId     = null;
	var nChangeLvl = 0;

	var isCheckPrev = false;

	if (oNumPr)
	{
		oNum       = this.Numbering.GetNum(oNumPr.NumId);
		nChangeLvl = oNumPr.Lvl;
	}
	else if (true === bDiffLvl)
	{
		oNum = this.Numbering.CreateNum();
		oNum.CreateDefault(c_oAscMultiLevelNumbering.Numbered);

		sNumId     = oNum.GetId();
		nChangeLvl = 0;

		isCheckPrev = true;
	}
	else if (true === bDiffId)
	{
		oNum = this.Numbering.CreateNum();
		oNum.CreateDefault(c_oAscMultiLevelNumbering.Numbered);

		sNumId     = oNum.GetId();
		nChangeLvl = nPrevLvl;

		isCheckPrev = true;
	}
	else
	{
		oNum       = this.Numbering.GetNum(sPrevId);
		nChangeLvl = nPrevLvl;

		this.SetLastNumberedList(sPrevId, nPrevLvl);
	}

	switch (nType)
	{
		case 1:
		{
			oNum.SetLvlByType(nChangeLvl, c_oAscNumberingLevel.DecimalDot_Right);
			break;
		}
		case 2:
		{
			oNum.SetLvlByType(nChangeLvl, c_oAscNumberingLevel.DecimalBracket_Right);
			break;
		}
		case 3:
		{
			oNum.SetLvlByType(nChangeLvl, c_oAscNumberingLevel.UpperRomanDot_Right);
			break;
		}
		case 4:
		{
			oNum.SetLvlByType(nChangeLvl, c_oAscNumberingLevel.UpperLetterDot_Left);
			break;
		}
		case 5:
		{
			oNum.SetLvlByType(nChangeLvl, c_oAscNumberingLevel.LowerLetterBracket_Left);
			break;
		}
		case 6:
		{
			oNum.SetLvlByType(nChangeLvl, c_oAscNumberingLevel.LowerLetterDot_Left);
			break;
		}
		case 7:
		{
			oNum.SetLvlByType(nChangeLvl, c_oAscNumberingLevel.LowerRomanDot_Right);
			break;
		}
	}

	if (isCheckPrev)
	{
		var oResult = this.private_CheckPrevNumberingOnAdd(arrParagraphs, sNumId, nChangeLvl);
		if (oResult)
			sNumId = oResult.NumId;
	}

	if (sNumId)
	{
		// Параграфы, которые не содержали списка у них уровень выставляем 0,
		// а у тех которые содержали, мы уровень не меняем
		for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
		{
			var oOldNumPr = arrParagraphs[nIndex].GetNumPr();
			if (oOldNumPr)
				arrParagraphs[nIndex].ApplyNumPr(sNumId, oOldNumPr.Lvl);
			else
				arrParagraphs[nIndex].ApplyNumPr(sNumId, 0);
		}

		this.SetLastNumberedList(sNumId, 0);
	}
};
CDocument.prototype.private_SetParagraphNumberingMultiLevel = function(arrParagraphs, oNumPr, nType)
{
	if (arrParagraphs.length <= 0)
		return;

	var bDiffId = false;
	var sPrevId = null;
	for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
	{
		var oTempNumPr = arrParagraphs[nIndex].GetNumPr();
		if (oTempNumPr)
		{
			if (null === sPrevId)
				sPrevId = oTempNumPr.NumId;

			if (sPrevId !== oTempNumPr.NumId)
				bDiffId = true;
		}
		else
		{
			bDiffId = true;
			break;
		}
	}

	var oNum   = null;
	var sNumId = null;

	if (oNumPr)
	{
		oNum = this.Numbering.GetNum(oNumPr.NumId);
	}
	else if (bDiffId)
	{
		oNum   = this.Numbering.CreateNum();
		sNumId = oNum.GetId();
	}
	else
	{
		oNum = this.Numbering.GetNum(sPrevId);
	}

	switch (nType)
	{
		case 1:
		{
			oNum.CreateDefault(c_oAscMultiLevelNumbering.MultiLevel1);
			break;
		}
		case 2:
		{
			oNum.CreateDefault(c_oAscMultiLevelNumbering.MultiLevel2);
			break;
		}
		case 3:
		{
			oNum.CreateDefault(c_oAscMultiLevelNumbering.MultiLevel3);
			break;
		}
	}

	if (sNumId)
	{
		// Параграфы, которые не содержали списка у них уровень выставляем 0,
		// а у тех которые содержали, мы уровень не меняем
		for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
		{
			var oOldNumPr = arrParagraphs[nIndex].GetNumPr();
			if (oOldNumPr)
				arrParagraphs[nIndex].ApplyNumPr(sNumId, oOldNumPr.Lvl);
			else
				arrParagraphs[nIndex].ApplyNumPr(sNumId, 0);
		}
	}
};
CDocument.prototype.private_CheckPrevNumberingOnAdd = function(arrParagraphs, sNumId, nLvl)
{
	var sResultNumId = sNumId;
	var nResultLvl   = nLvl;

	if (arrParagraphs.length !== 1 || this.IsSelectionUse())
		return {NumId : sResultNumId, Lvl : nResultLvl};

	var oPrevPara = arrParagraphs[0].GetPrevParagraph();
	while (oPrevPara)
	{
		if (oPrevPara.GetNumPr() || !oPrevPara.IsEmpty())
			break;

		oPrevPara = oPrevPara.GetPrevParagraph();
	}

	if (oPrevPara && oPrevPara.GetNumPr())
	{
		var oPrevNumPr = oPrevPara.GetNumPr();
		var oPrevLvl   = this.Numbering.GetNum(oPrevNumPr.NumId).GetLvl(oPrevNumPr.Lvl);
		var oCurrLvl   = this.Numbering.GetNum(sNumId).GetLvl(nLvl);

		if (oPrevLvl.IsSimilar(oCurrLvl))
		{
			sResultNumId = oPrevNumPr.NumId;
			nResultLvl   = oPrevNumPr.Lvl;
		}
	}

	return {NumId : sResultNumId, Lvl : nResultLvl};
};
CDocument.prototype.SetParagraphShd = function(Shd)
{
	this.Controller.SetParagraphShd(Shd);
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
/**
 * Выставляем стиль для выделенных параграфов
 * @param {string} sName - название стиля
 * @param {boolean} [isCheckLinkedStyle=false] - если true и если выделен текст внутри одного параграфа, то мы выставляем линкованный стиль текста, если он есть
 */
CDocument.prototype.SetParagraphStyle = function(sName, isCheckLinkedStyle)
{
	if (isCheckLinkedStyle && this.IsSelectionUse())
	{
		var sStyleId = this.Styles.GetStyleIdByName(sName);
		var oStyle   = this.Styles.Get(sStyleId);

		var arrCurrentParagraphs = this.GetCurrentParagraph(false, true);
		if (1 === arrCurrentParagraphs.length && arrCurrentParagraphs[0].IsSelectedSingleElement() && true !== arrCurrentParagraphs[0].IsSelectedAll() && oStyle && oStyle.GetLink())
		{
			var oLinkedStyle = this.Styles.Get(oStyle.GetLink());
			if (oLinkedStyle && styletype_Character === oLinkedStyle.GetType())
			{
				var oTextPr = new CTextPr();
				oTextPr.Set_FromObject({RStyle : oLinkedStyle.GetId()}, true);
				arrCurrentParagraphs[0].ApplyTextPr(oTextPr);
				this.Recalculate();
				this.Document_UpdateSelectionState();
				this.Document_UpdateInterfaceState();
				return;
			}
		}
	}

	var oParaPr = this.GetCalculatedParaPr();
	if (oParaPr.PStyle && this.Styles.Get(oParaPr.PStyle) && this.Styles.Get(oParaPr.PStyle).GetName() === sName)
		this.Controller.ClearParagraphFormatting(false, true);
	else
		this.Controller.SetParagraphStyle(sName);

	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.SetParagraphContextualSpacing = function(Value)
{
	this.Controller.SetParagraphContextualSpacing(Value);
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.SetParagraphPageBreakBefore = function(Value)
{
	this.Controller.SetParagraphPageBreakBefore(Value);
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.SetParagraphKeepLines = function(Value)
{
	this.Controller.SetParagraphKeepLines(Value);
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.SetParagraphKeepNext = function(Value)
{
	this.Controller.SetParagraphKeepNext(Value);
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.SetParagraphWidowControl = function(Value)
{
	this.Controller.SetParagraphWidowControl(Value);
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.SetParagraphBorders = function(Borders)
{
	this.Controller.SetParagraphBorders(Borders);
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.SetParagraphFramePr = function(FramePr, bDelete)
{
	this.Controller.SetParagraphFramePr(FramePr, bDelete);
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateRulersState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.IncreaseDecreaseFontSize = function(bIncrease)
{
	this.Controller.IncreaseDecreaseFontSize(bIncrease);
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.IncreaseDecreaseIndent = function(bIncrease)
{
	this.Controller.IncreaseDecreaseIndent(bIncrease);
};
CDocument.prototype.Paragraph_SetHighlight = function(IsColor, r, g, b)
{
	if (true === this.IsTextSelectionUse())
	{
		if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.StartAction(AscDFH.historydescription_Document_SetTextHighlight);

			if (false === IsColor)
				this.AddToParagraph(new ParaTextPr({HighLight : highlight_None}));
			else
				this.AddToParagraph(new ParaTextPr({HighLight : new CDocumentColor(r, g, b)}));

			this.UpdateInterface();
			this.FinalizeAction();
		}
	}
	else
	{
		if (false === IsColor)
			this.HighlightColor = highlight_None;
		else
			this.HighlightColor = new CDocumentColor(r, g, b);
	}
};

CDocument.prototype.GetSelectedDrawingObjectsCount = function()
{
    return this.DrawingObjects.getSelectedDrawingObjectsCount();
};
CDocument.prototype.PutShapesAlign = function(type, align)
{
    return this.DrawingObjects.putShapesAlign(type, align);
};
CDocument.prototype.DistributeDrawingsHorizontally = function(align)
{
    return this.DrawingObjects.distributeHor(align);
};
CDocument.prototype.DistributeDrawingsVertically = function(align)
{
    return this.DrawingObjects.distributeVer(align);
};
CDocument.prototype.SetImageProps = function(Props)
{
	this.Controller.SetImageProps(Props);
	this.Recalculate();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.ShapeApply = function(shapeProps)
{
	this.DrawingObjects.shapeApply(shapeProps);
};
CDocument.prototype.SelectDrawings = function(arrDrawings, oTargetContent)
{
	this.private_UpdateTargetForCollaboration();

	var nCount = arrDrawings.length;
	if (nCount > 1 && arrDrawings[0].IsInline())
		return;

	for (var nIndex = 0; nIndex < nCount; ++nIndex)
	{
		if (!arrDrawings[nIndex].IsUseInDocument())
			return;
	}

	this.DrawingObjects.resetSelection();
	var oHdrFtr = oTargetContent.IsHdrFtr(true);
	if (oHdrFtr)
	{
		oHdrFtr.Content.SetDocPosType(docpostype_DrawingObjects);
		oHdrFtr.Set_CurrentElement(false);
	}
	else
	{
		this.SetDocPosType(docpostype_DrawingObjects);
	}

	for (var i = 0; i < nCount; ++i)
	{
		this.DrawingObjects.selectObject(arrDrawings[i].GraphicObj, 0);
	}
};
CDocument.prototype.SetTableProps = function(Props)
{
	this.Controller.SetTableProps(Props);
	this.Recalculate();
	this.Document_UpdateInterfaceState();
	this.Document_UpdateRulersState();
	this.Document_UpdateSelectionState();
};
/**
 * Получаем рассчитанные настройки параграфа (полностью заполненные)
 * @returns {CParaPr}
 */
CDocument.prototype.GetCalculatedParaPr = function()
{
	return this.Controller.GetCalculatedParaPr();
};
/**
 * Получаем рассчитанные настройки текста (полностью заполненные)
 * @returns {CTextPr}
 */
CDocument.prototype.GetCalculatedTextPr = function()
{
	var ret = this.Controller.GetCalculatedTextPr();
    if(ret)
    {
        var oTheme = this.Get_Theme();
        if(oTheme)
        {
            ret.ReplaceThemeFonts(oTheme.themeElements.fontScheme);
        }
        return ret;
    }
};
/**
 * Получаем прямые настройки параграфа, т.е. которые выставлены непосредственно у параграфа, без учета стилей
 * @returns {CParaPr}
 */
CDocument.prototype.GetDirectTextPr = function()
{
	return this.Controller.GetDirectTextPr();
};
/**
 * Получаем прямые настройки текста, т.е. которые выставлены непосредственно у рана, без учета стилей
 * @returns {CTextPr}
 */
CDocument.prototype.GetDirectParaPr = function()
{
	return this.Controller.GetDirectParaPr();
};
CDocument.prototype.Get_PageSizesByDrawingObjects = function()
{
	return this.DrawingObjects.getPageSizesByDrawingObjects();
};
/**
 * Выставояем поля документа
 * @param oMargins {{Left : number, Top : number, Right : number, Bottom : number}}
 * @param isFromRuler {boolean} пришло ли изменение из линейки
 */
CDocument.prototype.SetDocumentMargin = function(oMargins, isFromRuler)
{
	// TODO: Document.Set_DocumentOrientation Сделать в зависимости от выделения

	var nCurPos = this.CurPos.ContentPos;
	var oSectPr = this.SectionsInfo.Get_SectPr(nCurPos).SectPr;

	var L = oMargins.Left;
	var T = oMargins.Top;
	var R = undefined === oMargins.Right ? undefined : oSectPr.GetPageWidth() - oMargins.Right;
	var B = undefined === oMargins.Bottom ? undefined : oSectPr.GetPageHeight() - oMargins.Bottom;

	if (isFromRuler)
	{
		if (this.IsMirrorMargins() && 1 === this.CurPage % 2)
		{
			L = oSectPr.GetPageWidth() - oMargins.Right;
			R = oMargins.Left;
		}

		var nGutter = oSectPr.GetGutter();
		if (nGutter > 0.001)
		{
			if (this.IsGutterAtTop())
				T = Math.max(0, T - nGutter);
			else if (oSectPr.IsGutterRTL())
				R = Math.max(0, R - nGutter);
			else
				L = Math.max(0, L - nGutter);
		}
	}

	oSectPr.SetPageMargins(L, T, R, B);
	this.DrawingObjects.CheckAutoFit();

	this.Recalculate();
	this.UpdateSelection();
	this.UpdateInterface();
	this.UpdateRulers();
};
CDocument.prototype.Set_DocumentPageSize = function(W, H, bNoRecalc)
{
	// TODO: Document.Set_DocumentOrientation Сделать в зависимости от выделения

	var CurPos = this.CurPos.ContentPos;
	var SectPr = this.SectionsInfo.Get_SectPr(CurPos).SectPr;

	SectPr.SetPageSize(W, H);

	this.DrawingObjects.CheckAutoFit();
	if (true != bNoRecalc)
	{
		this.Recalculate();
		this.Document_UpdateSelectionState();
		this.Document_UpdateInterfaceState();
		this.Document_UpdateRulersState();
	}
};
CDocument.prototype.Get_DocumentPageSize = function()
{
	// TODO: Document.Get_DocumentOrientation Сделать в зависимости от выделения

	var CurPos             = this.CurPos.ContentPos;
	var SectionInfoElement = this.SectionsInfo.Get_SectPr(CurPos);

	if (undefined === SectionInfoElement)
		return true;

	var SectPr = SectionInfoElement.SectPr;

	return {W : SectPr.GetPageWidth(), H : SectPr.GetPageHeight()};
};
CDocument.prototype.Set_DocumentOrientation = function(Orientation, bNoRecalc)
{
	// TODO: Document.Set_DocumentOrientation Сделать в зависимости от выделения

	var CurPos = this.CurPos.ContentPos;
	var SectPr = this.SectionsInfo.Get_SectPr(CurPos).SectPr;

	SectPr.SetOrientation(Orientation, true);

	this.DrawingObjects.CheckAutoFit();
	if (true != bNoRecalc)
	{
		this.Recalculate();
		this.Document_UpdateSelectionState();
		this.Document_UpdateInterfaceState();
		this.Document_UpdateRulersState();
	}
};
CDocument.prototype.Get_DocumentOrientation = function()
{
	// TODO: Document.Get_DocumentOrientation Сделать в зависимости от выделения

	var CurPos             = this.CurPos.ContentPos;
	var SectionInfoElement = this.SectionsInfo.Get_SectPr(CurPos);

	if (undefined === SectionInfoElement)
		return true;

	var SectPr = SectionInfoElement.SectPr;

	return ( SectPr.GetOrientation() === Asc.c_oAscPageOrientation.PagePortrait ? true : false );
};
CDocument.prototype.Set_DocumentDefaultTab = function(DTab)
{
	this.History.Add(new CChangesDocumentDefaultTab(this, AscCommonWord.Default_Tab_Stop, DTab));
	AscCommonWord.Default_Tab_Stop = DTab;
};
CDocument.prototype.Set_DocumentEvenAndOddHeaders = function(Value)
{
	if (Value !== EvenAndOddHeaders)
	{
		this.History.Add(new CChangesDocumentEvenAndOddHeaders(this, EvenAndOddHeaders, Value));
		EvenAndOddHeaders = Value;
	}
};
/**
 * Обновляем данные в интерфейсе о свойствах параграфа.
 */
CDocument.prototype.Interface_Update_ParaPr = function()
{
	if (!this.Api)
		return;

	var ParaPr = this.GetCalculatedParaPr();

	if (null != ParaPr)
	{
		// Проверим, можно ли добавить буквицу
		ParaPr.CanAddDropCap = false;

		if (docpostype_Content === this.GetDocPosType())
		{
			var Para = null;
			if (false === this.Selection.Use && type_Paragraph === this.Content[this.CurPos.ContentPos].GetType())
				Para = this.Content[this.CurPos.ContentPos];
			else if (true === this.Selection.Use && this.Selection.StartPos <= this.Selection.EndPos && type_Paragraph === this.Content[this.Selection.StartPos].GetType())
				Para = this.Content[this.Selection.StartPos];
			else if (true === this.Selection.Use && this.Selection.StartPos > this.Selection.EndPos && type_Paragraph === this.Content[this.Selection.EndPos].GetType())
				Para = this.Content[this.Selection.EndPos];

			if (null != Para && undefined === Para.Get_FramePr())
			{
				var Prev = Para.Get_DocumentPrev();
				if ((null === Prev || type_Paragraph != Prev.GetType() || undefined === Prev.Get_FramePr() || undefined === Prev.Get_FramePr().DropCap) && true === Para.CanAddDropCap())
					ParaPr.CanAddDropCap = true;
			}
		}

		var oSelectedInfo = this.GetSelectedElementsInfo({CheckAllSelection : true});
		var oMath         = oSelectedInfo.Get_Math();

		if (oMath)
			ParaPr.CanAddImage = false;
		else
			ParaPr.CanAddImage = true;

		if (oMath && !oMath.Is_Inline())
			ParaPr.Jc = oMath.Get_Align();

		ParaPr.CanDeleteBlockCC  = oSelectedInfo.CanDeleteBlockSdts();
		ParaPr.CanEditBlockCC    = oSelectedInfo.CanEditBlockSdts();
		ParaPr.CanDeleteInlineCC = oSelectedInfo.CanDeleteInlineSdts();
		ParaPr.CanEditInlineCC   = oSelectedInfo.CanEditInlineSdts();

		if (undefined != ParaPr.Tabs)
			this.Api.Update_ParaTab(AscCommonWord.Default_Tab_Stop, ParaPr.Tabs);

		if (ParaPr.Shd && ParaPr.Shd.Unifill)
		{
			ParaPr.Shd.Unifill.check(this.theme, this.Get_ColorMap());
		}


		this.Api.UpdateParagraphProp(ParaPr);
	}
};
/**
 * Обновляем данные в интерфейсе о свойствах текста.
 */
CDocument.prototype.Interface_Update_TextPr = function()
{
	if (!this.Api)
		return;

	var TextPr = this.GetCalculatedTextPr();

	if (null != TextPr)
	{
		var theme = this.Get_Theme();
		if (theme && theme.themeElements && theme.themeElements.fontScheme)
		{
            TextPr.ReplaceThemeFonts(theme.themeElements.fontScheme);
		}
		if (TextPr.Unifill)
		{
			var RGBAColor = TextPr.Unifill.getRGBAColor();
			TextPr.Color  = new CDocumentColor(RGBAColor.R, RGBAColor.G, RGBAColor.B, false);
		}
		if (TextPr.Shd && TextPr.Shd.Unifill)
		{
			TextPr.Shd.Unifill.check(this.theme, this.Get_ColorMap());
		}
		this.Api.UpdateTextPr(TextPr);
	}
};
/**
 * Обновляем данные в интерфейсе о свойствах графики (картинки, автофигуры).
 * @param Flag
 * @returns {*}
 */
CDocument.prototype.Interface_Update_DrawingPr = function(Flag)
{
	var DrawingPr = this.DrawingObjects.Get_Props();

	if (true === Flag)
		return DrawingPr;
	else
	{
		if (this.Api)
		{
			for (var i = 0; i < DrawingPr.length; ++i)
				this.Api.sync_ImgPropCallback(DrawingPr[i]);
		}
	}
	if (Flag)
		return null;
};
/**
 * Обновляем данные в интерфейсе о свойствах таблицы.
 * @param Flag
 * @returns {*}
 */
CDocument.prototype.Interface_Update_TablePr = function(Flag)
{
	var TablePr = null;
	if (docpostype_Content == this.GetDocPosType() && ((true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos) || false == this.Selection.Use))
	{
		if (true == this.Selection.Use)
			TablePr = this.Content[this.Selection.StartPos].GetTableProps();
		else
			TablePr = this.Content[this.CurPos.ContentPos].GetTableProps();
	}

	if (null !== TablePr)
		TablePr.CanBeFlow = true;

	if (true === Flag)
		return TablePr;
	else if (null != TablePr)
		this.Api.sync_TblPropCallback(TablePr);
};
/**
 * Обновляем данные в интерфейсе о свойствах колонотитулов.
 */
CDocument.prototype.Interface_Update_HdrFtrPr = function()
{
	if (docpostype_HdrFtr === this.GetDocPosType())
	{
		this.Api.sync_HeadersAndFootersPropCallback(this.HdrFtr.Get_Props());
	}
};
CDocument.prototype.Internal_GetContentPosByXY = function(X, Y, nCurPage, ColumnsInfo)
{
    if (!ColumnsInfo)
        ColumnsInfo = {Column : 0, ColumnsCount : 1};

    if (undefined === nCurPage || null === nCurPage)
		nCurPage = this.CurPage;

    if (nCurPage >= this.Pages.length)
    	nCurPage = this.Pages.length - 1;
    else if (nCurPage < 0)
    	nCurPage = 0;

    // Сначала проверим Flow-таблицы
    var FlowTable = this.DrawingObjects.getTableByXY(X, Y, nCurPage, this);
    if (null != FlowTable)
    {
        var ElementPos;
        if (flowobject_Table === FlowTable.Get_Type())
        {
            ElementPos = FlowTable.Table.Index;
        }
        else
        {
            var Frame = FlowTable;

            var StartPos  = Frame.StartIndex;
            var FlowCount = Frame.FlowCount;

            for (var Pos = StartPos; Pos < StartPos + FlowCount; ++Pos)
            {
                var Item = this.Content[Pos];

                if (Y < Item.Pages[0].Bounds.Bottom)
                    return Pos;
            }

            ElementPos = StartPos + FlowCount - 1;
        }

        var Element              = this.Content[ElementPos];
        ColumnsInfo.Column       = Element.Get_StartColumn();
        ColumnsInfo.ColumnsCount = Element.Get_ColumnsCount();
        return ElementPos;
    }

    // Теперь проверим пустые параграфы с окончанием секций
    var SectCount = this.Pages[nCurPage].EndSectionParas.length;
    for (var Index = 0; Index < SectCount; ++Index)
    {
        var Item   = this.Pages[nCurPage].EndSectionParas[Index];
        var Bounds = Item.Pages[0].Bounds;

        if (Y < Bounds.Bottom && Y > Bounds.Top && X > Bounds.Left && X < Bounds.Right)
        {
            var Element              = this.Content[Item.Index];
            ColumnsInfo.Column       = Element.Get_StartColumn();
            ColumnsInfo.ColumnsCount = Element.Get_ColumnsCount();
            return Item.Index;
        }
    }

    // Сначала мы определим секцию и колонку, в которую попали
    var Page = this.Pages[nCurPage];

    var SectionIndex = 0;
    for (var SectionsCount = Page.Sections.length; SectionIndex < SectionsCount - 1; ++SectionIndex)
    {
        if (Y < Page.Sections[SectionIndex + 1].Y)
            break;
    }

    var PageSection  = this.Pages[nCurPage].Sections[SectionIndex];
    var ColumnsCount = PageSection.Columns.length;
    var ColumnIndex  = 0;
    for (; ColumnIndex < ColumnsCount - 1; ++ColumnIndex)
    {
        if (X < (PageSection.Columns[ColumnIndex].XLimit + PageSection.Columns[ColumnIndex + 1].X) / 2)
            break;
    }

    // TODO: Разобраться с ситуацией, когда пустые колонки стоят не только в конце
    while (ColumnIndex > 0 && true === PageSection.Columns[ColumnIndex].Empty)
        ColumnIndex--;

    ColumnsInfo.Column       = ColumnIndex;
    ColumnsInfo.ColumnsCount = ColumnsCount;

    var Column   = PageSection.Columns[ColumnIndex];
    var StartPos = Column.Pos;
    var EndPos   = Column.EndPos;

    // Сохраним позиции всех Inline элементов на данной странице
    var InlineElements = [];
    for (var Index = StartPos; Index <= EndPos; Index++)
    {
        var Item = this.Content[Index];

        var PrevItem       = Item.Get_DocumentPrev();
        var bEmptySectPara = (type_Paragraph === Item.GetType() && undefined !== Item.Get_SectionPr() && true === Item.IsEmpty() && null !== PrevItem && (type_Paragraph !== PrevItem.GetType() || undefined === PrevItem.Get_SectionPr())) ? true : false;

        if (false != Item.Is_Inline() && (type_Paragraph !== Item.GetType() || false === bEmptySectPara))
            InlineElements.push(Index);
    }

    var Count = InlineElements.length;
    if (Count <= 0)
        return Math.min(Math.max(0, Page.EndPos), this.Content.length - 1);

    for (var Pos = 0; Pos < Count - 1; ++Pos)
    {
        var Item = this.Content[InlineElements[Pos + 1]];

        var PageBounds = Item.GetPageBounds(0);
        if (Y < PageBounds.Top)
            return InlineElements[Pos];

        if (Item.GetPagesCount() > 1)
        {
            if (true !== Item.IsStartFromNewPage())
                return InlineElements[Pos + 1];

            return InlineElements[Pos];
        }

        if (Pos === Count - 2)
        {
            // Такое возможно, если страница заканчивается Flow-таблицей
            return InlineElements[Count - 1];
        }
    }

    return InlineElements[0];
};
CDocument.prototype.RemoveSelection = function(bNoCheckDrawing)
{
	this.Reset_WordSelection();
	this.Controller.RemoveSelection(bNoCheckDrawing);
};
CDocument.prototype.IsSelectionEmpty = function(bCheckHidden)
{
	return this.Controller.IsSelectionEmpty(bCheckHidden);
};
CDocument.prototype.DrawSelectionOnPage = function(PageAbs)
{
	this.DrawingDocument.UpdateTargetTransform(null);
	this.DrawingDocument.SetTextSelectionOutline(false);
	this.Controller.DrawSelectionOnPage(PageAbs);
};
CDocument.prototype.GetSelectionBounds = function()
{
	return this.Controller.GetSelectionBounds();
};
CDocument.prototype.Selection_SetStart         = function(X, Y, MouseEvent)
{
	this.Reset_WordSelection();

    var bInText      = (null === this.IsInText(X, Y, this.CurPage) ? false : true);
    var bTableBorder = (null === this.IsTableBorder(X, Y, this.CurPage) ? false : true);
    var nInDrawing   = this.DrawingObjects.IsInDrawingObject(X, Y, this.CurPage, this);
	var bFlowTable   = (null === this.DrawingObjects.getTableByXY(X, Y, this.CurPage, this) ? false : true);

    // Сначала посмотрим, попалили мы в текстовый селект (но при этом не в границу таблицы и не более чем одинарным кликом)
    if (-1 !== this.Selection.DragDrop.Flag
		&& MouseEvent.ClickCount <= 1
		&& false === bTableBorder
		&& (nInDrawing < 0
			|| (nInDrawing === DRAWING_ARRAY_TYPE_BEHIND && true === bInText)
			|| (nInDrawing > -1
				&& (docpostype_DrawingObjects === this.CurPos.Type || (docpostype_HdrFtr === this.CurPos.Type && this.HdrFtr.CurHdrFtr && docpostype_DrawingObjects === this.HdrFtr.CurHdrFtr.Content.CurPos.Type))
				&& true === this.DrawingObjects.isSelectedText()
				&& null !== this.DrawingObjects.getMajorParaDrawing()
				&& this.DrawingObjects.getGraphicInfoUnderCursor(this.CurPage, X, Y).cursorType === "text"))
		&& true === this.CheckPosInSelection(X, Y, this.CurPage, undefined))
	{
		// Здесь мы сразу не начинаем перемещение текста. Его мы начинаем, курсор хотя бы немного изменит свою позицию,
		// это проверяется на MouseMove.
		// TODO: В ворде кроме изменения положения мыши, также запускается таймер для стартования drag-n-drop по времени,
		//       его можно здесь вставить.

		this.Selection.DragDrop.Flag = 1;
		this.Selection.DragDrop.Data = {X : X, Y : Y, PageNum : this.CurPage};
		return;
	}

    var bCheckHdrFtr = true;
	var bFootnotes = false;

	var nDocPosType = this.GetDocPosType();
    if (docpostype_HdrFtr === nDocPosType)
    {
        bCheckHdrFtr         = false;
        this.Selection.Start = true;
        this.Selection.Use   = true;
        if (false != this.HdrFtr.Selection_SetStart(X, Y, this.CurPage, MouseEvent, false))
            return;

        this.Selection.Start = false;
        this.Selection.Use   = false;
        this.DrawingDocument.ClearCachePages();
        this.DrawingDocument.FirePaint();
        this.DrawingDocument.EndTrackTable(null, true);
    }
	else
	{
		bFootnotes = this.Footnotes.CheckHitInFootnote(X, Y, this.CurPage);
	}

    var PageMetrics = this.Get_PageContentStartPos(this.CurPage, this.Pages[this.CurPage].Pos);

	var oldDocPosType = this.GetDocPosType();
    // Проверяем, не попали ли мы в колонтитул (если мы попадаем в Flow-объект, то попадание в колонтитул не проверяем)
    if (true != bFlowTable && nInDrawing < 0 && true === bCheckHdrFtr && MouseEvent.ClickCount >= 2 && ( Y <= PageMetrics.Y || Y > PageMetrics.YLimit ))
    {
        // Если был селект, тогда убираем его
        if (true === this.Selection.Use)
            this.RemoveSelection();

        this.SetDocPosType(docpostype_HdrFtr);

        // Переходим к работе с колонтитулами
        MouseEvent.ClickCount = 1;
        this.HdrFtr.Selection_SetStart(X, Y, this.CurPage, MouseEvent, true);
        this.Interface_Update_HdrFtrPr();

        this.DrawingDocument.ClearCachePages();
        this.DrawingDocument.FirePaint();
        this.DrawingDocument.EndTrackTable(null, true);
    }
	else if (true !== bFlowTable && nInDrawing < 0 && true === bFootnotes)
	{
		this.RemoveSelection();
        this.Selection.Start = true;
        this.Selection.Use   = true;

		this.SetDocPosType(docpostype_Footnotes);
		this.Footnotes.StartSelection(X, Y, this.CurPage, MouseEvent);
	}
    else if (nInDrawing === DRAWING_ARRAY_TYPE_BEFORE || nInDrawing === DRAWING_ARRAY_TYPE_INLINE || ( false === bTableBorder && false === bInText && nInDrawing >= 0 ))
    {
        if (docpostype_DrawingObjects != this.CurPos.Type)
            this.RemoveSelection();

        // Прячем курсор
        this.DrawingDocument.TargetEnd();
        this.DrawingDocument.SetCurrentPage(this.CurPage);

        this.Selection.Use   = true;
        this.Selection.Start = true;
        this.Selection.Flag  = selectionflag_Common;
        this.SetDocPosType(docpostype_DrawingObjects);
        this.DrawingObjects.OnMouseDown(MouseEvent, X, Y, this.CurPage);
    }
    else
    {
        var bOldSelectionIsCommon = true;

        if (docpostype_DrawingObjects === this.CurPos.Type && (true != this.IsInDrawing(X, Y, this.CurPage) || ( nInDrawing === DRAWING_ARRAY_TYPE_BEHIND && true === bInText )))
        {
            this.DrawingObjects.resetSelection();
            bOldSelectionIsCommon = false;
        }

        var ContentPos = this.Internal_GetContentPosByXY(X, Y);

        if (docpostype_Content != this.CurPos.Type)
        {
            this.SetDocPosType(docpostype_Content);
            this.CurPos.ContentPos = ContentPos;
            bOldSelectionIsCommon  = false;
        }

		var SelectionUse_old = this.Selection.Use;
		var Item             = this.Content[ContentPos];
		var ElementPageIndex = this.private_GetElementPageIndexByXY(ContentPos, X, Y, this.CurPage);
		var bTableBorder     = null === Item.IsTableBorder(X, Y, ElementPageIndex) ? false : true;

        // Убираем селект, кроме случаев либо текущего параграфа, либо при движении границ внутри таблицы
        if (!(true === SelectionUse_old && true === MouseEvent.ShiftKey && true === bOldSelectionIsCommon))
        {
            if ((selectionflag_Common != this.Selection.Flag) || ( true === this.Selection.Use && MouseEvent.ClickCount <= 1 && true != bTableBorder ))
                this.RemoveSelection();
        }

        this.Selection.Use   = true;
        this.Selection.Start = true;
        this.Selection.Flag  = selectionflag_Common;

		if (true === SelectionUse_old && true === MouseEvent.ShiftKey && true === bOldSelectionIsCommon)
		{
			this.Selection_SetEnd(X, Y, {Type : AscCommon.g_mouse_event_type_up, ClickCount : 1});
			this.Selection.Use    = true;
			this.Selection.Start  = true;
			this.Selection.EndPos = ContentPos;
			this.Selection.Data   = null;
		}
		else
		{
			var ElementPageIndex = this.private_GetElementPageIndexByXY(ContentPos, X, Y, this.CurPage);
			Item.Selection_SetStart(X, Y, ElementPageIndex, MouseEvent, bTableBorder);

			if (this.IsNumberingSelection())
			{
				// TODO: Можно сделать передвигание нумерации как в Word
				return;
			}

			Item.Selection_SetEnd(X, Y, ElementPageIndex, {
				Type       : AscCommon.g_mouse_event_type_move,
				ClickCount : 1
			}, bTableBorder);

			if (true !== bTableBorder)
			{
				this.Selection.Use      = true;
				this.Selection.StartPos = ContentPos;
				this.Selection.EndPos   = ContentPos;
				this.Selection.Data     = null;

				this.CurPos.ContentPos = ContentPos;

				if (type_Paragraph === Item.GetType() && true === MouseEvent.CtrlKey)
				{
					var oHyperlink   = Item.CheckHyperlink(X, Y, ElementPageIndex);
					var oPageRefLink = Item.CheckPageRefLink(X, Y, ElementPageIndex);
					if (null != oHyperlink)
					{
						this.Selection.Data = {
							Hyperlink : oHyperlink
						};
					}
					else if (null !== oPageRefLink)
					{
						this.Selection.Data = {
							PageRef : oPageRefLink
						};
					}
				}
			}
			else
			{
				this.Selection.Data = {
					TableBorder : true,
					Pos         : ContentPos,
					Selection   : SelectionUse_old
				};
			}
		}
	}

	//при переходе из колонтитула в контент(и обратно) необходимо скрывать иконку с/в
	var newDocPosType = this.GetDocPosType();
    if((docpostype_HdrFtr === newDocPosType && docpostype_Content === oldDocPosType) || (docpostype_Content === newDocPosType && docpostype_HdrFtr === oldDocPosType))
    {
		window['AscCommon'].g_specialPasteHelper.SpecialPasteButton_Hide();
    }
};
/**
 * Данная функция может использоваться как при движении, так и при окончательном выставлении селекта.
 * Если bEnd = true, тогда это конец селекта.
 * @param X
 * @param Y
 * @param MouseEvent
 */
CDocument.prototype.Selection_SetEnd = function(X, Y, MouseEvent)
{
	this.Reset_WordSelection();

	// Работаем с колонтитулом
	if (docpostype_HdrFtr === this.CurPos.Type)
    {
        this.HdrFtr.Selection_SetEnd(X, Y, this.CurPage, MouseEvent);
        if (AscCommon.g_mouse_event_type_up == MouseEvent.Type)
        {
            if (true != this.DrawingObjects.isPolylineAddition())
                this.Selection.Start = false;
            else
                this.Selection.Start = true;
        }

        return;
    }
    else if (docpostype_DrawingObjects === this.CurPos.Type)
    {
        if (AscCommon.g_mouse_event_type_up == MouseEvent.Type)
        {
            this.DrawingObjects.OnMouseUp(MouseEvent, X, Y, this.CurPage);

            if (true != this.DrawingObjects.isPolylineAddition())
            {
                this.Selection.Start = false;
                this.Selection.Use   = true;
            }
            else
            {
                this.Selection.Start = true;
                this.Selection.Use   = true;
            }
        }
        else
        {
            this.DrawingObjects.OnMouseMove(MouseEvent, X, Y, this.CurPage);
        }
        return;
    }
	else if (docpostype_Footnotes === this.CurPos.Type)
	{
		this.Footnotes.EndSelection(X, Y, this.CurPage, MouseEvent);

		if (AscCommon.g_mouse_event_type_up == MouseEvent.Type)
			this.Selection.Start = false;

		return;
	}

    // Обрабатываем движение границы у таблиц
    if (true === this.IsMovingTableBorder())
    {
		var nPos = this.Selection.Data.Pos;

		// Убираем селект раньше, чтобы при создании точки в истории не сохранялось состояние передвижения границы таблицы
		if (AscCommon.g_mouse_event_type_up == MouseEvent.Type)
		{
			this.Selection.Start = false;
			this.Selection.Use   = this.Selection.Data.Selection;
			this.Selection.Data  = null;
		}

		var Item             = this.Content[nPos];
        var ElementPageIndex = this.private_GetElementPageIndexByXY(nPos, X, Y, this.CurPage);
        Item.Selection_SetEnd(X, Y, ElementPageIndex, MouseEvent, true);
        return;
    }

    if (false === this.Selection.Use)
        return;

    var ContentPos = this.Internal_GetContentPosByXY(X, Y);

    this.CurPos.ContentPos = ContentPos;
    var OldEndPos          = this.Selection.EndPos;
    this.Selection.EndPos  = ContentPos;

    // Удалим отметки о старом селекте
    if (OldEndPos < this.Selection.StartPos && OldEndPos < this.Selection.EndPos)
    {
        var TempLimit = Math.min(this.Selection.StartPos, this.Selection.EndPos);
        for (var Index = OldEndPos; Index < TempLimit; Index++)
        {
        	this.Content[Index].RemoveSelection();
        }
    }
    else if (OldEndPos > this.Selection.StartPos && OldEndPos > this.Selection.EndPos)
    {
        var TempLimit = Math.max(this.Selection.StartPos, this.Selection.EndPos);
        for (var Index = TempLimit + 1; Index <= OldEndPos; Index++)
        {
        	this.Content[Index].RemoveSelection();
        }
    }

    // Направление селекта: 1 - прямое, -1 - обратное, 0 - отмечен 1 элемент документа
    var Direction = ( ContentPos > this.Selection.StartPos ? 1 : ( ContentPos < this.Selection.StartPos ? -1 : 0 )  );

    if (AscCommon.g_mouse_event_type_up == MouseEvent.Type)
    	this.StopSelection();

    var Start, End;
    if (0 == Direction)
    {
        var Item             = this.Content[this.Selection.StartPos];
        var ElementPageIndex = this.private_GetElementPageIndexByXY(this.Selection.StartPos, X, Y, this.CurPage);
        Item.Selection_SetEnd(X, Y, ElementPageIndex, MouseEvent);

        if (this.IsNumberingSelection())
		{
			// Ничего не делаем
		}
        else if (false === Item.IsSelectionUse())
        {
            this.Selection.Use = false;

            if (this.IsInText(X, Y, this.CurPage))
			{
				if (null != this.Selection.Data && this.Selection.Data.Hyperlink)
				{
					var oHyperlink    = this.Selection.Data.Hyperlink;
					var sBookmarkName = oHyperlink.GetAnchor();
					var sValue        = oHyperlink.GetValue();

					if (oHyperlink.IsTopOfDocument())
					{
						this.MoveCursorToStartOfDocument();
					}
					else if (sBookmarkName)
					{
						var oBookmark = this.BookmarksManager.GetBookmarkByName(sBookmarkName);
						if (oBookmark)
							oBookmark[0].GoToBookmark();
					}
					else if (sValue)
					{
						editor.sync_HyperlinkClickCallback(sValue);

						oHyperlink.SetVisited(true);
						for (var PageIdx = Item.Get_AbsolutePage(0); PageIdx < Item.Get_AbsolutePage(0) + Item.Get_PagesCount(); PageIdx++)
							this.DrawingDocument.OnRecalculatePage(PageIdx, this.Pages[PageIdx]);

						this.DrawingDocument.OnEndRecalculate(false, true);
					}
				}
				else if (null !== this.Selection.Data && this.Selection.Data.PageRef)
				{
					var oInstruction = this.Selection.Data.PageRef.GetInstruction();
					if (oInstruction && fieldtype_PAGEREF === oInstruction.GetType())
					{
						var oBookmark = this.BookmarksManager.GetBookmarkByName(oInstruction.GetBookmarkName());
						if (oBookmark)
							oBookmark[0].GoToBookmark();
					}
				}
			}
        }
        else
        {
            this.Selection.Use = true;
        }

        return;
    }
    else if (Direction > 0)
    {
        Start = this.Selection.StartPos;
        End   = this.Selection.EndPos;
    }
    else
    {
        End   = this.Selection.StartPos;
        Start = this.Selection.EndPos;
    }

    // TODO: Разрулить пустой селект
    // Чтобы не было эффекта, когда ничего не поселекчено, а при удалении соединяются параграфы

	for (var Index = Start; Index <= End; Index++)
	{
		var Item = this.Content[Index];
		Item.SetSelectionUse(true);

		switch (Index)
		{
			case Start:

				Item.SetSelectionToBeginEnd(Direction > 0 ? false : true, false);
				break;

			case End:

				Item.SetSelectionToBeginEnd(Direction > 0 ? true : false, true);
				break;

			default:

				Item.SelectAll(Direction);
				break;
		}
	}

    var ElementPageIndex = this.private_GetElementPageIndexByXY(ContentPos, X, Y, this.CurPage);
    this.Content[ContentPos].Selection_SetEnd(X, Y, ElementPageIndex, MouseEvent);

    // Проверяем, чтобы у нас в селект не попали элементы, в которых не выделено ничего
    if (true === this.Content[End].IsSelectionEmpty() && true === this.CheckEmptyElementsOnSelection)
    {
        this.Content[End].RemoveSelection();
        End--;
    }

    if (Start != End && true === this.Content[Start].IsSelectionEmpty() && true === this.CheckEmptyElementsOnSelection)
    {
        this.Content[Start].RemoveSelection();
        Start++;
    }

    if (Direction > 0)
    {
        this.Selection.StartPos = Start;
        this.Selection.EndPos   = End;
    }
    else
    {
        this.Selection.StartPos = End;
        this.Selection.EndPos   = Start;
    }
};
/**
 * Получаем направление селекта
 * @returns {number} Возвращается направление селекта. 1 - нормальное направление, -1 - обратное
 */
CDocument.prototype.GetSelectDirection = function()
{
	var oStartPos = this.GetContentPosition(true, true);
	var oEndPos   = this.GetContentPosition(true, false);

	for (var nPos = 0, nLen = Math.min(oStartPos.length, oEndPos.length); nPos < nLen; ++nPos)
	{
		if (!oEndPos[nPos] || !oStartPos[nPos] || oStartPos[nPos].Class !== oEndPos[nPos].Class)
			return 1;

		if (oStartPos[nPos].Position < oEndPos[nPos].Position)
			return 1;
		else if (oStartPos[nPos].Position > oEndPos[nPos].Position)
			return -1;
	}

	return 1;
};
CDocument.prototype.IsMovingTableBorder = function()
{
	return this.Controller.IsMovingTableBorder();
};
/**
 * Проверяем попали ли мы в селект.
 * @param X
 * @param Y
 * @param PageAbs
 * @param NearPos
 * @returns {boolean}
 */
CDocument.prototype.CheckPosInSelection = function(X, Y, PageAbs, NearPos)
{
	return this.Controller.CheckPosInSelection(X, Y, PageAbs, NearPos);
};
/**
 * Выделяем все содержимое, в зависимости от текущего положения курсора.
 */
CDocument.prototype.SelectAll = function()
{
	this.private_UpdateTargetForCollaboration();

	this.Reset_WordSelection();
	this.Controller.SelectAll();

	// TODO: Пока делаем Start = true, чтобы при Ctrl+A не происходил переход к концу селекта, надо будет
	//       сделать по нормальному
	this.Selection.Start = true;
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
	this.Document_UpdateRulersState();
	this.Selection.Start = false;

	// Отдельно обрабатываем это событие, потому что внутри него идет проверка на this.Selection.Start !== true
	this.Document_UpdateCopyCutState();

	this.private_UpdateCursorXY(true, true);
};
/**
 * Выделяем все элементы в заданном диапазоне
 * @param {number} nStartPos
 * @param {number} nEndPos
 */
CDocument.prototype.SelectRange = function(nStartPos, nEndPos)
{
	this.RemoveSelection();

	this.DrawingDocument.SelectEnabled(true);
	this.DrawingDocument.TargetEnd();

	this.SetDocPosType(docpostype_Content);

	this.Selection.Use   = true;
	this.Selection.Start = false;
	this.Selection.Flag  = selectionflag_Common;

	this.Selection.StartPos = Math.max(0, Math.min(nStartPos, this.Content.length - 1));
	this.Selection.EndPos   = Math.max(this.Selection.StartPos, Math.min(nEndPos, this.Content.length - 1));

	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		this.Content[nIndex].SelectAll();
	}

	// TODO: Пока делаем Start = true, чтобы при Ctrl+A не происходил переход к концу селекта, надо будет
	//       сделать по нормальному
	this.Selection.Start = true;
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
	this.Document_UpdateRulersState();
	this.Selection.Start = false;

	// Отдельно обрабатываем это событие, потому что внутри него идет проверка на this.Selection.Start !== true
	this.Document_UpdateCopyCutState();

	this.private_UpdateCursorXY(true, true);
};
CDocument.prototype.OnEndTextDrag = function(NearPos, bCopy)
{
    if (true === this.Comments.Is_Use())
    {
        this.SelectComment(null, false);
        editor.sync_HideComment();
    }

    // Сначала нам надо проверить попадаем ли мы обратно в выделенный текст, если да, тогда ничего не делаем,
    // а если нет, тогда удаляем выделенный текст и вставляем его в заданное место.

    if (true === this.CheckPosInSelection(0, 0, 0, NearPos))
    {
        this.RemoveSelection();

        // Нам надо снять селект и поставить курсор в то место, где была ближайшая позиция
        var Paragraph = NearPos.Paragraph;
        Paragraph.Cursor_MoveToNearPos(NearPos);
        Paragraph.Document_SetThisElementCurrent(false);

        this.Document_UpdateSelectionState();
        this.Document_UpdateInterfaceState();
        this.Document_UpdateRulersState();
    }
    else
    {
    	var bCancelTrackMove = false;
    	var sPrevTrackModeId = null;
    	if (this.IsTrackRevisions())
		{
			var oInfo = this.GetSelectedElementsInfo({CheckAllSelection : true});
			if (!oInfo.HaveNotReviewedContent() && !oInfo.HaveAddedInReview() && oInfo.HaveRemovedInReview())
				return;

			if (oInfo.HaveRemovedInReview() || !oInfo.HaveNotReviewedContent())
				bCancelTrackMove = true;

			sPrevTrackModeId = this.private_CheckTrackMoveSelection(oInfo);
			if (sPrevTrackModeId)
			{
				this.SelectTrackMove(sPrevTrackModeId, false, false, false);
				this.TrackMoveRelocation = true;
			}
		}

        // Создаем сразу точку в истории, т.к. при выполнении функции GetSelectedContent нам надо, чтобы данная
        // точка уже набивалась изменениями. Если из-за совместного редактирования действие сделать невозможно будет,
        // тогда последнюю точку удаляем.
        this.StartAction(AscDFH.historydescription_Document_DragText);

        NearPos.Paragraph.Check_NearestPos(NearPos);

		var oDocPos = this.AnchorPositionToDocumentPosition(NearPos);
		this.TrackDocumentPositions([oDocPos]);

		if (!bCopy)
		{
			this.DragAndDropAction = true;
			this.TrackMoveId       = sPrevTrackModeId ? sPrevTrackModeId : (this.IsTrackRevisions() && !bCancelTrackMove ? this.TrackRevisionsManager.GetNewMoveId() : null);
		}
		else
		{
			this.TrackMoveId = null;
		}


		// Получим копию выделенной части документа, которую надо перенести в новое место, одновременно с этим
        // удаляем эту выделенную часть (если надо).

        var DocContent = this.GetSelectedContent(true);

        if (false === this.Can_InsertContent(DocContent, NearPos))
        {
            this.History.Remove_LastPoint();
			NearPos.Paragraph.Clear_NearestPosArray();

			this.DragAndDropAction   = false;
			this.TrackMoveId         = null;
			this.TrackMoveRelocation = false;

			this.FinalizeAction(false);
            return;
        }

        var Para = NearPos.Paragraph;

		// Нам нужно отдельно проверить локи для контент контролов, поэтому мы отключаем стандартную проверку
		// в функции IsSelectionLocked и отдельно проверяем вставляемую часть и место куда мы вставляем на наличие
		// залоченных контент контролов
		this.SetCheckContentControlsLock(false);

		var oSelectInfo = this.GetSelectedElementsInfo();
		var arrSdts     = oSelectInfo.GetAllSdts();
		if (arrSdts.length > 0 && !bCopy)
		{
			for (var nIndex = 0, nCount = arrSdts.length; nIndex < nCount; ++nIndex)
			{
				var oSdt = arrSdts[nIndex];
				if ((!oSdt.CanBeDeleted() && oSdt.IsSelectedAll()) || (!oSdt.CanBeEdited() && !oSdt.IsSelectedAll()))
				{
					this.DragAndDropAction   = false;
					this.TrackMoveId         = null;
					this.TrackMoveRelocation = false;

					this.FinalizeAction();
					this.SetCheckContentControlsLock(true);
					return;
				}
			}
		}

		var isLocked = false;

		var oParaNearPos = Para.Get_ParaNearestPos(NearPos);
		var oLastClass   = oParaNearPos.Classes[oParaNearPos.Classes.length - 1];
		if (oLastClass instanceof ParaRun)
		{
			arrSdts = oLastClass.GetParentContentControls();
			if (arrSdts.length > 0 && !arrSdts[arrSdts.length - 1].CanBeEdited())
				isLocked = true;
		}

        // Если мы копируем, тогда не надо проверять выделенные параграфы, а если переносим, тогда проверяем
        var CheckChangesType = (true !== bCopy ? AscCommon.changestype_Document_Content : changestype_None);
        if (!isLocked && !this.IsSelectionLocked(CheckChangesType, {
                Type      : changestype_2_ElementsArray_and_Type,
                Elements  : [Para],
                CheckType : changestype_Paragraph_Content
            }, true))
        {
        	if (this.TrackMoveId && !this.TrackMoveRelocation)
			{
				var arrParagraphs = this.GetSelectedParagraphs();
				if (arrParagraphs.length > 0)
				{
					arrParagraphs[arrParagraphs.length - 1].AddTrackMoveMark(true, false, this.TrackMoveId);
					arrParagraphs[0].AddTrackMoveMark(true, true, this.TrackMoveId);
				}
			}

            // Если надо удаляем выделенную часть (пересчет отключаем на время удаления)
            if (true !== bCopy)
            {
                this.TurnOff_Recalculate();
                this.TurnOff_InterfaceEvents();
                this.Remove(1, false, false, true);
                this.TurnOn_Recalculate(false);
                this.TurnOn_InterfaceEvents(false);

                if (false === Para.Is_UseInDocument())
                {
					this.DragAndDropAction   = false;
					this.TrackMoveId         = null;
					this.TrackMoveRelocation = false;

                    this.Document_Undo();
                    this.History.Clear_Redo();
					this.SetCheckContentControlsLock(true);
					this.FinalizeAction(false);
                    return;
                }
            }

            this.RemoveSelection(true);

			this.RefreshDocumentPositions([oDocPos]);
			var oTempNearPos = this.DocumentPositionToAnchorPosition(oDocPos);
			if (oTempNearPos)
			{
				NearPos = oTempNearPos;
				Para    = NearPos.Paragraph;
			}
			if(bCopy)
			{
				DocContent.CreateNewCommentsGuid(this.Comments);
			}

			// Выделение выставляется внутри функции InsertContent
            Para.Parent.InsertContent(DocContent, NearPos);

			this.Recalculate();
            this.UpdateSelection();
            this.UpdateInterface();
            this.UpdateRulers();
			this.FinalizeAction();
        }
        else
		{
			this.History.Remove_LastPoint();
			NearPos.Paragraph.Clear_NearestPosArray();
			this.FinalizeAction(false);
		}

		this.SetCheckContentControlsLock(true);

		this.DragAndDropAction   = false;
		this.TrackMoveId         = null;
		this.TrackMoveRelocation = false;
	}
};
/**
 * В данной функции мы получаем выделенную часть документа в формате класса CSelectedContent.
 * @param bUseHistory - нужна ли запись в историю созданных классов. (при drag-n-drop нужна, при копировании не нужна)
 * @param oPr {{SaveNumberingValues : boolean}} дополнительные настройки
 * @returns {CSelectedContent}
 */
CDocument.prototype.GetSelectedContent = function(bUseHistory, oPr)
{
	// При копировании нам не нужно, чтобы новые классы помечались как созданные в рецензировании, а при перетаскивании
	// нужно.
	var isTrack = this.IsTrackRevisions();
	if (isTrack && !bUseHistory)
		this.SetTrackRevisions(false);

	var bNeedTurnOffTableId = g_oTableId.m_bTurnOff === false && true !== bUseHistory;
	if (!bUseHistory)
		History.TurnOff();

	if (bNeedTurnOffTableId)
	{
		g_oTableId.m_bTurnOff = true;
	}

	var oSelectedContent = new CSelectedContent();

	if (oPr)
	{
		if (undefined !== oPr.SaveNumberingValues)
			oSelectedContent.SetSaveNumberingValues(oPr.SaveNumberingValues);
	}

	oSelectedContent.SetMoveTrack(isTrack, this.TrackMoveId);
	this.Controller.GetSelectedContent(oSelectedContent);
	oSelectedContent.On_EndCollectElements(this, false);

	if (!bUseHistory)
		History.TurnOn();

	if (bNeedTurnOffTableId)
	{
		g_oTableId.m_bTurnOff = false;
	}

	if (isTrack && !bUseHistory)
		this.SetTrackRevisions(true);

	return oSelectedContent;
};
CDocument.prototype.Can_InsertContent = function(SelectedContent, NearPos)
{
	// Проверяем, что вставка не пустая
	if (SelectedContent.Elements.length <= 0)
		return false;

	var Para = NearPos.Paragraph;

	// Автофигуры не вставляем в другие автофигуры
	if (true === Para.Parent.Is_DrawingShape() && true === SelectedContent.HaveShape)
		return false;


	//В заголовки диаграмм не вставляем формулы и любые DrawingObjects
	if (Para.bFromDocument === false && (SelectedContent.DrawingObjects.length > 0 || SelectedContent.HaveMath || SelectedContent.HaveTable))
		return false;

	// Проверяем корректность места, куда вставляем
	var ParaNearPos = NearPos.Paragraph.Get_ParaNearestPos(NearPos);
	if (null === ParaNearPos || ParaNearPos.Classes.length < 2)
		return false;

	var LastClass = ParaNearPos.Classes[ParaNearPos.Classes.length - 1];
	if (para_Math_Run === LastClass.Type)
	{
		if (!SelectedContent.CanConvertToMath)
		{
			// Проверяем, что вставляемый контент тоже формула
			var Element = SelectedContent.Elements[0].Element;
			if (1 !== SelectedContent.Elements.length || type_Paragraph !== Element.GetType() || null === LastClass.Parent)
				return false;

			var Math  = null;
			var Count = Element.Content.length;
			for (var Index = 0; Index < Count; Index++)
			{
				var Item = Element.Content[Index];
				if (para_Math === Item.Type && null === Math)
					Math = Element.Content[Index];
				else if (true !== Item.Is_Empty({SkipEnd : true}))
					return false;
			}
		}
	}
	else if (para_Run !== LastClass.Type)
		return false;

	if (null === Para.Parent || undefined === Para.Parent)
		return false;

	return true;
};
CDocument.prototype.InsertContent = function(SelectedContent, NearPos)
{
	var Para        = NearPos.Paragraph;
	var ParaNearPos = Para.Get_ParaNearestPos(NearPos);
	var LastClass   = ParaNearPos.Classes[ParaNearPos.Classes.length - 1];

	this.private_CheckSelectedContentBeforePaste(SelectedContent, NearPos);

	if (para_Math_Run === LastClass.Type)
	{
		var MathRun        = LastClass;
		var NewMathRun     = MathRun.Split(ParaNearPos.NearPos.ContentPos, ParaNearPos.Classes.length - 1);
		var MathContent    = ParaNearPos.Classes[ParaNearPos.Classes.length - 2];
		var MathContentPos = ParaNearPos.NearPos.ContentPos.Data[ParaNearPos.Classes.length - 2];
		var Element        = SelectedContent.Elements[0].Element;

		var InsertMathContent = null;
		for (var nPos = 0, nParaLen = Element.Content.length; nPos < nParaLen; nPos++)
		{
			if (para_Math === Element.Content[nPos].Type)
			{
				InsertMathContent = Element.Content[nPos];
				break;
			}
		}

        if(null === InsertMathContent)
        {
            //try to convert content to ParaMath in simple cases.
            InsertMathContent = SelectedContent.ConvertToMath();
        }

        if (null !== InsertMathContent)
		{
			MathContent.Add_ToContent(MathContentPos + 1, NewMathRun);
			MathContent.Insert_MathContent(InsertMathContent.Root, MathContentPos + 1, true);
		}
	}
	else if (para_Run === LastClass.Type)
	{
		var NearContentPos = NearPos.ContentPos;
		// Сначала найдем номер элемента, начиная с которого мы будем производить вставку
		var DstIndex       = -1;
		var Count          = this.Content.length;
		for (var Index = 0; Index < Count; Index++)
		{
			if (this.Content[Index] === Para)
			{
				DstIndex = Index;
				break;
			}
		}

		if (-1 === DstIndex)
			return false;

		var Elements      = SelectedContent.Elements;
		var ElementsCount = Elements.length;
		var FirstElement  = SelectedContent.Elements[0];
		if (1 === ElementsCount && true !== FirstElement.SelectedAll && type_Paragraph === FirstElement.Element.GetType() && true !== FirstElement.Element.Is_Empty())
		{
			// Нам нужно в заданный параграф вставить выделенный текст
			var NewPara          = FirstElement.Element;
			var NewElementsCount = NewPara.Content.length - 1; // Последний ран с para_End не добавляем

			if (LastClass instanceof ParaRun && LastClass.GetParent() instanceof CInlineLevelSdt && LastClass.GetParent().IsPlaceHolder())
			{
				var oInlineLeveLSdt = LastClass.GetParent();
				oInlineLeveLSdt.ReplacePlaceHolderWithContent();

				LastClass = oInlineLeveLSdt.GetElement(0);

				ParaNearPos.Classes[ParaNearPos.Classes.length - 1] = LastClass;

				ParaNearPos.NearPos.ContentPos.Update(0, ParaNearPos.Classes.length - 1);
				ParaNearPos.NearPos.ContentPos.Update(0, ParaNearPos.Classes.length - 2);
			}

			var LastClass  = ParaNearPos.Classes[ParaNearPos.Classes.length - 1];
			var NewElement = LastClass.Split(ParaNearPos.NearPos.ContentPos, ParaNearPos.Classes.length - 1);
			var PrevClass  = ParaNearPos.Classes[ParaNearPos.Classes.length - 2];
			var PrevPos    = ParaNearPos.NearPos.ContentPos.Data[ParaNearPos.Classes.length - 2];

			PrevClass.Add_ToContent(PrevPos + 1, NewElement);

			// TODO: Заглушка для переноса автофигур и картинок. Когда разрулим ситуацию так, чтобы когда у нас
			//       в текста была выделена автофигура выделение шло для автофигур, тогда здесь можно будет убрать.
			var bNeedSelect = (true === SelectedContent.MoveDrawing ? false : true);

			for (var Index = 0; Index < NewElementsCount; Index++)
			{
				var Item = NewPara.Content[Index];
				PrevClass.Add_ToContent(PrevPos + 1 + Index, Item);

				if (true === bNeedSelect)
					Item.SelectAll();
			}

			if (true === bNeedSelect)
			{
				PrevClass.Selection.Use      = true;
				PrevClass.Selection.StartPos = PrevPos + 1;
				PrevClass.Selection.EndPos   = PrevPos + 1 + NewElementsCount - 1;

				for (var Index = 0; Index < ParaNearPos.Classes.length - 2; Index++)
				{
					var Class    = ParaNearPos.Classes[Index];
					var ClassPos = ParaNearPos.NearPos.ContentPos.Data[Index];

					Class.Selection.Use      = true;
					Class.Selection.StartPos = ClassPos;
					Class.Selection.EndPos   = ClassPos;
				}

				this.Selection.Use      = true;
				this.Selection.StartPos = DstIndex;
				this.Selection.EndPos   = DstIndex;
			}

			if (PrevClass.Correct_Content)
			{
				PrevClass.Correct_Content();
			}
		}
		else
		{
			var bConcatS   = ( type_Paragraph !== Elements[0].Element.GetType() ? false : true );
			var bConcatE   = ( type_Paragraph !== Elements[ElementsCount - 1].Element.GetType() || true === Elements[ElementsCount - 1].SelectedAll ? false : true );
			var ParaS      = Para;
			var ParaE      = Para;
			var ParaEIndex = DstIndex;

			// Нам надо разделить наш параграф в заданной позиции, если позиция в
			// начале или конце параграфа, тогда делить не надо
			Para.Cursor_MoveToNearPos(NearPos);
			Para.RemoveSelection();

			var bAddEmptyPara          = false;
			var bDoNotIncreaseDstIndex = false;

			if (true === Para.IsCursorAtEnd() && !Para.IsEmpty())
			{
				bConcatE = false;

				if (1 === ElementsCount && type_Paragraph === FirstElement.Element.GetType() && ( true === FirstElement.Element.Is_Empty() || true == FirstElement.SelectedAll ))
				{
					bConcatS = false;

					// TODO: Возможно флаг bDoNotIncreaseDstIndex не нужен, и здесь не нужно увеличивать индекс DstIndex
					if (type_Paragraph !== this.Content[DstIndex].Get_Type() || true !== this.Content[DstIndex].Is_Empty())
					{
						DstIndex++;
						bDoNotIncreaseDstIndex = true;
					}
				}
				else if (true === Elements[ElementsCount - 1].SelectedAll && true === bConcatS)
					bAddEmptyPara = true;
			}
			else if (true === Para.IsCursorAtBegin())
			{
				bConcatS = false;
			}
			else
			{
				// Создаем новый параграф
				var NewParagraph = new Paragraph(this.DrawingDocument, this);
				Para.Split(NewParagraph);
				this.Internal_Content_Add(DstIndex + 1, NewParagraph);

				ParaE      = NewParagraph;
				ParaEIndex = DstIndex + 1;
			}

			var NewEmptyPara = null;
			if (true === bAddEmptyPara && true !== SelectedContent.DoNotAddEmptyPara)
			{
				// Создаем новый параграф
				NewEmptyPara = new Paragraph(this.DrawingDocument, this);
				NewEmptyPara.Set_Pr(ParaS.Pr);
				NewEmptyPara.TextPr.Apply_TextPr(ParaS.TextPr.Value);
				this.Internal_Content_Add(DstIndex + 1, NewEmptyPara);
			}

			var StartIndex = 0;
			if (true === bConcatS)
			{
				// Вызываем так, чтобы выделить все внутренние элементы
				var _ParaS = Elements[0].Element;
				_ParaS.SelectAll();
				var _ParaSContentLen = _ParaS.Content.length;

				// Если мы присоединяем новый параграф, то и копируем все настройки параграфа (так делает Word)
				ParaS.Concat(Elements[0].Element);
				ParaS.Set_Pr(Elements[0].Element.Pr);
				ParaS.TextPr.Clear_Style();
				ParaS.TextPr.Apply_TextPr(Elements[0].Element.TextPr.Value);

				StartIndex++;

				ParaS.Selection.Use      = true;
				ParaS.Selection.StartPos = ParaS.Content.length - _ParaSContentLen;
				ParaS.Selection.EndPos   = ParaS.Content.length - 1;

				for (var nParaSIndex = ParaS.Selection.StartPos; nParaSIndex <= Math.min(ParaS.Selection.EndPos, ParaS.Content.length - 1); ++nParaSIndex)
				{
					ParaS.Content[nParaSIndex].SelectAll(1);
				}
			}
			else if (true !== Para.IsCursorAtBegin() && true !== bDoNotIncreaseDstIndex)
			{
				DstIndex++;
			}

			var EndIndex = ElementsCount - 1;
			if (true === bConcatE && StartIndex < EndIndex)
			{
				var _ParaE    = Elements[ElementsCount - 1].Element;
				var TempCount = _ParaE.Content.length - 1;

				_ParaE.SelectAll();
				_ParaE.Concat(ParaE);
				_ParaE.Set_Pr(ParaE.Pr);

				this.Internal_Content_Add(ParaEIndex, _ParaE);
				this.Internal_Content_Remove(ParaEIndex + 1, 1);

				_ParaE.Selection.Use      = true;
				_ParaE.Selection.StartPos = 0;
				_ParaE.Selection.EndPos   = TempCount;

				EndIndex--;
			}

			for (var Index = StartIndex; Index <= EndIndex; Index++)
			{
				this.Internal_Content_Add(DstIndex + Index, Elements[Index].Element);
				this.Content[DstIndex + Index].SelectAll();
			}

			var LastPos = DstIndex + ElementsCount - 1;
			if (NewEmptyPara && NewEmptyPara === this.Content[LastPos + 1])
			{
				LastPos++;
				this.Content[LastPos].SelectAll();
			}

			this.Selection.Use      = true;
			this.Selection.StartPos = DstIndex;
			this.Selection.EndPos   = LastPos;
			this.CurPos.ContentPos  = LastPos;
		}

		if (docpostype_DrawingObjects !== this.CurPos.Type)
			this.SetDocPosType(docpostype_Content);
	}
};
CDocument.prototype.UpdateCursorType = function(X, Y, PageAbs, MouseEvent)
{
	if (null !== this.FullRecalc.Id && this.FullRecalc.PageIndex <= PageAbs)
		return;

	this.Api.sync_MouseMoveStartCallback();

	this.DrawingDocument.OnDrawContentControl(null, AscCommon.ContentControlTrack.Hover);

	var nDocPosType = this.GetDocPosType();
	if (docpostype_HdrFtr === nDocPosType)
	{
		this.HeaderFooterController.UpdateCursorType(X, Y, PageAbs, MouseEvent);
	}
	else if (docpostype_DrawingObjects === nDocPosType)
	{
		this.DrawingsController.UpdateCursorType(X, Y, PageAbs, MouseEvent);
	}
	else
	{
		if (true === this.Footnotes.CheckHitInFootnote(X, Y, PageAbs))
			this.Footnotes.UpdateCursorType(X, Y, PageAbs, MouseEvent);
		else
			this.LogicDocumentController.UpdateCursorType(X, Y, PageAbs, MouseEvent);
	}

	this.Api.sync_MouseMoveEndCallback();
};
/**
 * Проверяем попадание в границу таблицы.
 * @param X
 * @param Y
 * @param PageIndex
 * @returns {?CTable} null - не попали, а если попали возвращается указатель на таблицу
 */
CDocument.prototype.IsTableBorder = function(X, Y, PageIndex)
{
	if (PageIndex >= this.Pages.length || PageIndex < 0)
		return null;

	if (docpostype_HdrFtr === this.GetDocPosType())
	{
		return this.HdrFtr.IsTableBorder(X, Y, PageIndex);
	}
	else
	{
		if (-1 != this.DrawingObjects.IsInDrawingObject(X, Y, PageIndex, this))
		{
			return null;
		}
		else if (true === this.Footnotes.CheckHitInFootnote(X, Y, PageIndex))
		{
			return this.Footnotes.IsTableBorder(X, Y, PageIndex);
		}
		else
		{
			var ColumnsInfo      = {};
			var ElementPos       = this.Internal_GetContentPosByXY(X, Y, PageIndex, ColumnsInfo);
			var Element          = this.Content[ElementPos];
			var ElementPageIndex = this.private_GetElementPageIndex(ElementPos, PageIndex, ColumnsInfo.Column, ColumnsInfo.Column, ColumnsInfo.ColumnsCount);
			return Element.IsTableBorder(X, Y, ElementPageIndex);
		}
	}
};
/**
 * Проверяем, происходит ли сейчас выделение ячеек какой-либо таблицы
 * @returns {boolean}
 */
CDocument.prototype.IsTableCellSelection = function()
{
	return this.Controller.IsTableCellSelection();
};
/**
 * Проверяем, попали ли мы четко в текст (не лежащий в автофигуре)
 * @param X
 * @param Y
 * @param PageIndex
 * @returns {*}
 */
CDocument.prototype.IsInText = function(X, Y, PageIndex)
{
	if (PageIndex >= this.Pages.length || PageIndex < 0)
		return null;

	if (docpostype_HdrFtr === this.GetDocPosType())
	{
		return this.HdrFtr.IsInText(X, Y, PageIndex);
	}
	else
	{
		if (true === this.Footnotes.CheckHitInFootnote(X, Y, PageIndex))
		{
			return this.Footnotes.IsInText(X, Y, PageIndex);
		}
		else
		{
			var ContentPos       = this.Internal_GetContentPosByXY(X, Y, PageIndex);
			var ElementPageIndex = this.private_GetElementPageIndexByXY(ContentPos, X, Y, PageIndex);
			var Item             = this.Content[ContentPos];
			return Item.IsInText(X, Y, ElementPageIndex);
		}
	}
};
CDocument.prototype.Get_ParentTextTransform = function()
{
	return null;
};
/**
 * Проверяем, попали ли мы в автофигуру данного DocumentContent
 * @param X
 * @param Y
 * @param PageIndex
 * @returns {*}
 */
CDocument.prototype.IsInDrawing = function(X, Y, PageIndex)
{
	if (docpostype_HdrFtr === this.GetDocPosType())
	{
		return this.HdrFtr.IsInDrawing(X, Y, PageIndex);
	}
	else
	{
		if (-1 != this.DrawingObjects.IsInDrawingObject(X, Y, this.CurPage, this))
		{
			return true;
		}
		else if (true === this.Footnotes.CheckHitInFootnote(X, Y, PageIndex))
		{
			return this.Footnotes.IsInDrawing(X, Y, PageIndex);
		}
		else
		{
			var ContentPos       = this.Internal_GetContentPosByXY(X, Y, PageIndex);
			var Item             = this.Content[ContentPos];
			var ElementPageIndex = this.private_GetElementPageIndexByXY(ContentPos, X, Y, PageIndex);
			return Item.IsInDrawing(X, Y, ElementPageIndex);
		}
	}
};
CDocument.prototype.Is_UseInDocument = function(Id)
{
	var Count = this.Content.length;
	for (var Index = 0; Index < Count; Index++)
	{
		if (Id === this.Content[Index].GetId())
			return true;
	}

	return false;
};
CDocument.prototype.OnKeyDown = function(e)
{
    var OldRecalcId = this.RecalcId;

    // Если мы только что расширяли документ двойным щелчком, то сохраняем это действие
    if (true === this.History.Is_ExtendDocumentToPos())
        this.History.ClearAdditional();

    // Сбрасываем текущий элемент в поиске
    if (this.SearchEngine.Count > 0)
        this.SearchEngine.Reset_Current();

    var bUpdateSelection = true;
    var bRetValue        = keydownresult_PreventNothing;

    if (e.KeyCode == 8) // BackSpace
    {
        if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Remove, null, true, this.IsFormFieldEditing()))
        {
            this.StartAction(AscDFH.historydescription_Document_BackSpaceButton);

			var oSelectInfo = this.GetSelectedElementsInfo();
			if (oSelectInfo.GetInlineLevelSdt())
				this.CheckInlineSdtOnDelete = oSelectInfo.GetInlineLevelSdt();

			this.Remove(-1, true, false, false, e.CtrlKey);

			this.CheckInlineSdtOnDelete = null;

			this.FinalizeAction();
        }
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 9) // Tab
    {
        var SelectedInfo = this.GetSelectedElementsInfo();

        if (null !== SelectedInfo.Get_Math())
        {
            var ParaMath  = SelectedInfo.Get_Math();
            var Paragraph = ParaMath.GetParagraph();
            if (Paragraph && false === this.Document_Is_SelectionLocked(changestype_None, {
                    Type      : changestype_2_Element_and_Type,
                    Element   : Paragraph,
                    CheckType : changestype_Paragraph_Content
                }))
            {
                this.StartAction(AscDFH.historydescription_Document_AddTabToMath);
                ParaMath.HandleTab(!e.ShiftKey);
                this.Recalculate();
                this.FinalizeAction();
            }
        }
        else if (true === SelectedInfo.Is_InTable() && true != e.CtrlKey)
        {
            this.MoveCursorToCell(true === e.ShiftKey ? false : true);
        }
        else if (true === SelectedInfo.Is_DrawingObjSelected() && true != e.CtrlKey)
        {
            this.DrawingObjects.selectNextObject(( e.ShiftKey === true ? -1 : 1 ));
        }
        else
        {
            if (true === SelectedInfo.Is_MixedSelection())
            {
                if (true === e.ShiftKey)
                    this.DecreaseIndent();
                else
                    this.IncreaseIndent();
            }
            else
            {
                var Paragraph = SelectedInfo.GetParagraph();
                var ParaPr    = Paragraph ? Paragraph.Get_CompiledPr2(false).ParaPr : null;
                if (null != Paragraph && ( true === Paragraph.IsCursorAtBegin() || true === Paragraph.Selection_IsFromStart() ) && ( undefined != Paragraph.GetNumPr() || ( true != Paragraph.IsEmpty() && ParaPr.Tabs.Tabs.length <= 0 ) ))
                {
                    if (false === this.Document_Is_SelectionLocked(changestype_None, {
                            Type      : changestype_2_Element_and_Type,
                            Element   : Paragraph,
                            CheckType : AscCommon.changestype_Paragraph_Properties
                        }))
                    {
                        this.StartAction(AscDFH.historydescription_Document_MoveParagraphByTab);
                        Paragraph.Add_Tab(e.ShiftKey);
                        this.Recalculate();
                        this.UpdateInterface();
                        this.UpdateSelection();
						this.FinalizeAction();
                    }
                }
                else if (false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content))
                {
                    this.StartAction(AscDFH.historydescription_Document_AddTab);
                    this.AddToParagraph(new ParaTab());
					this.FinalizeAction();
                }
            }
        }
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 13) // Enter
    {
        var Hyperlink = this.IsCursorInHyperlink(false);
        if (null != Hyperlink && false === e.ShiftKey)
        {
			var sBookmarkName = Hyperlink.GetAnchor();
			var sValue        = Hyperlink.GetValue();

			if (Hyperlink.IsTopOfDocument())
			{
				this.MoveCursorToStartOfDocument();
			}
			else if (sBookmarkName)
			{
				var oBookmark = this.BookmarksManager.GetBookmarkByName(sBookmarkName);
				if (oBookmark)
					oBookmark[0].GoToBookmark();
			}
			else if (sValue)
			{
				editor.sync_HyperlinkClickCallback(sValue);
				Hyperlink.SetVisited(true);

				// TODO: Пока сделаем так, потом надо будет переделать
				this.DrawingDocument.ClearCachePages();
				this.DrawingDocument.FirePaint();
			}
        }
        else
		{
			var oSelectedInfo = this.GetSelectedElementsInfo();
			var CheckType = ( e.ShiftKey || e.CtrlKey ? changestype_Paragraph_Content : AscCommon.changestype_Document_Content_Add );

			var bCanPerform = true;
			if ((oSelectedInfo.GetInlineLevelSdt() && !oSelectedInfo.IsSdtOverDrawing() && (!e.ShiftKey || e.CtrlKey)) || (oSelectedInfo.Get_Field() && oSelectedInfo.Get_Field().IsFillingForm()))
				bCanPerform = false;

			if (bCanPerform && (docpostype_DrawingObjects === this.CurPos.Type ||
				(docpostype_HdrFtr === this.CurPos.Type && null != this.HdrFtr.CurHdrFtr && docpostype_DrawingObjects === this.HdrFtr.CurHdrFtr.Content.CurPos.Type )))
			{
				var oTargetDocContent = this.DrawingObjects.getTargetDocContent();
				if (!oTargetDocContent)
				{
					var nRet    = this.DrawingObjects.handleEnter();
					bCanPerform = (nRet === 0);
				}

				if (this.DrawingObjects.selection && null !== this.DrawingObjects.selection.cropSelection)
					CheckType = AscCommon.changestype_Drawing_Props;
			}

			if (bCanPerform && false === this.Document_Is_SelectionLocked(CheckType, null, false, true !== e.CtrlKey && this.IsFormFieldEditing()))
			{
				this.StartAction(AscDFH.historydescription_Document_EnterButton);

				var oMath = oSelectedInfo.Get_Math();
				if (null !== oMath && oMath.Is_InInnerContent())
				{
					if (oMath.Handle_AddNewLine())
						this.Recalculate();
				}
				else
				{
					if (e.ShiftKey && e.CtrlKey)
					{
						this.AddToParagraph(new ParaNewLine(break_Column));
					}
					else if (e.ShiftKey)
					{
						this.AddToParagraph(new ParaNewLine(break_Line));
					}
					else if (e.CtrlKey)
					{
						this.AddToParagraph(new ParaNewLine(break_Page));
					}
					else
					{
						this.AddNewParagraph();
					}
				}
				this.FinalizeAction();
			}
		}

        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 27) // Esc
    {
        // 1. Если начался drag-n-drop сбрасываем его.
        // 2. Если у нас сейчас происходит выделение маркером, тогда его отменяем
        // 3. Если у нас сейчас происходит форматирование по образцу, тогда его отменяем
        // 4. Если у нас выделена автофигура (в колонтитуле или документе), тогда снимаем выделение с нее
        // 5. Если мы просто находимся в колонтитуле (автофигура не выделена) выходим из колонтитула
		if (editor.isDrawTablePen || editor.isDrawTableErase)
		{
            editor.isDrawTablePen && editor.sync_TableDrawModeCallback(false);
            editor.isDrawTableErase && editor.sync_TableEraseModeCallback(false);
            this.UpdateCursorType(this.CurPos.RealX, this.CurPos.RealY, this.CurPage, new AscCommon.CMouseEventHandler());
		}
		else if (true === this.DrawingDocument.IsTrackText())
        {
            // Сбрасываем проверку Drag-n-Drop
            this.Selection.DragDrop.Flag = 0;
            this.Selection.DragDrop.Data = null;

            this.DrawingDocument.CancelTrackText();
        }
        else if (true === editor.isMarkerFormat)
        {
            editor.sync_MarkerFormatCallback(false);
            this.UpdateCursorType(this.CurPos.RealX, this.CurPos.RealY, this.CurPage, new AscCommon.CMouseEventHandler());
        }
        else if (c_oAscFormatPainterState.kOff !== editor.isPaintFormat)
        {
            editor.sync_PaintFormatCallback(c_oAscFormatPainterState.kOff);
            this.UpdateCursorType(this.CurPos.RealX, this.CurPos.RealY, this.CurPage, new AscCommon.CMouseEventHandler());
        }
        else if (editor.isStartAddShape)
        {
            editor.sync_StartAddShapeCallback(false);
            editor.sync_EndAddShape();
            this.UpdateCursorType(this.CurPos.RealX, this.CurPos.RealY, this.CurPage, new AscCommon.CMouseEventHandler());
        }
        else if (docpostype_DrawingObjects === this.CurPos.Type || (docpostype_HdrFtr === this.CurPos.Type && null != this.HdrFtr.CurHdrFtr && docpostype_DrawingObjects === this.HdrFtr.CurHdrFtr.Content.CurPos.Type ))
        {
        	this.EndDrawingEditing();
        }
        else if (docpostype_HdrFtr == this.CurPos.Type)
        {
            this.EndHdrFtrEditing(true);
        }

		if(window['AscCommon'].g_specialPasteHelper.showSpecialPasteButton)
		{
			window['AscCommon'].g_specialPasteHelper.SpecialPasteButton_Hide();
		}

        bRetValue = keydownresult_PreventAll;
    }
	else if (e.KeyCode == 32) // Space
	{
		var bFillingForm = false;
		if (this.IsFormFieldEditing() && ((true === e.ShiftKey && true === e.CtrlKey) || true !== e.CtrlKey))
			bFillingForm = true;

		var oSelectedInfo = this.GetSelectedElementsInfo();
		var oMath         = oSelectedInfo.Get_Math();
		var oInlineSdt    = oSelectedInfo.GetInlineLevelSdt();
		var oBlockSdt     = oSelectedInfo.GetBlockLevelSdt();

		var oCheckBox;

		if (oInlineSdt && oInlineSdt.IsCheckBox())
			oCheckBox = oInlineSdt;
		else if (oBlockSdt && oBlockSdt.IsCheckBox())
			oCheckBox = oBlockSdt;

		if (oCheckBox)
		{
			oCheckBox.SkipSpecialContentControlLock(true);
			if (!this.IsSelectionLocked(changestype_Paragraph_Content, null, true, bFillingForm))
			{
				this.StartAction(AscDFH.historydescription_Document_SpaceButton);
				oCheckBox.ToggleCheckBox();
				this.Recalculate();
				this.FinalizeAction();
			}
			oCheckBox.SkipSpecialContentControlLock(false);
		}
		else
		{
			if (false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content, null, true, bFillingForm))
			{
				this.StartAction(AscDFH.historydescription_Document_SpaceButton);

				// Если мы находимся в формуле, тогда пытаемся выполнить автозамену
				if (null !== oMath && true === oMath.Make_AutoCorrect())
				{
					// Ничего тут не делаем. Все делается в автозамене
				}
				else
				{
					if (true === e.ShiftKey && true === e.CtrlKey)
					{
						this.DrawingDocument.TargetStart();
						this.DrawingDocument.TargetShow();

						this.AddToParagraph(new ParaText(0x00A0));
					}
					else if (true === e.CtrlKey)
					{
						this.ClearParagraphFormatting(false, true);
					}
					else
					{
						this.DrawingDocument.TargetStart();
						this.DrawingDocument.TargetShow();

						this.CheckLanguageOnTextAdd = true;
						this.AddToParagraph(new ParaSpace());
						this.CheckLanguageOnTextAdd = false;
					}
				}
				this.FinalizeAction();
			}
		}

		bRetValue = keydownresult_PreventNothing;
	}
    else if (e.KeyCode == 33) // PgUp
    {
        if (true === e.AltKey)
        {
            var MouseEvent = new AscCommon.CMouseEventHandler();

            MouseEvent.ClickCount = 1;
            MouseEvent.Type       = AscCommon.g_mouse_event_type_down;

            this.CurPage--;

            if (this.CurPage < 0)
                this.CurPage = 0;

            this.Selection_SetStart(0, 0, MouseEvent);

            MouseEvent.Type = AscCommon.g_mouse_event_type_up;
            this.Selection_SetEnd(0, 0, MouseEvent);
        }
        else
        {
            if (docpostype_HdrFtr === this.CurPos.Type)
            {
                if (true === this.HdrFtr.GoTo_PrevHdrFtr())
                {
                    this.Document_UpdateSelectionState();
                    this.Document_UpdateInterfaceState();
                }
            }
            else
            {
            	if (this.Controller !== this.LogicDocumentController)
				{
					this.RemoveSelection();
					this.SetDocPosType(docpostype_Content);
				}

            	this.MoveCursorPageUp(true === e.ShiftKey, true === e.CtrlKey);
            }
        }

		this.private_CheckCursorPosInFillingFormMode();
        this.CheckComplexFieldsInSelection();
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 34) // PgDn
    {
        if (true === e.AltKey)
        {
            var MouseEvent = new AscCommon.CMouseEventHandler();

            MouseEvent.ClickCount = 1;
            MouseEvent.Type       = AscCommon.g_mouse_event_type_down;

            this.CurPage++;

            // TODO: переделать данную проверку
            if (this.CurPage >= this.DrawingDocument.m_lPagesCount)
                this.CurPage = this.DrawingDocument.m_lPagesCount - 1;

            this.Selection_SetStart(0, 0, MouseEvent);

            MouseEvent.Type = AscCommon.g_mouse_event_type_up;
            this.Selection_SetEnd(0, 0, MouseEvent);
        }
        else
        {
            if (docpostype_HdrFtr === this.CurPos.Type)
            {
                if (true === this.HdrFtr.GoTo_NextHdrFtr())
                {
                    this.Document_UpdateSelectionState();
                    this.Document_UpdateInterfaceState();
                }
            }
            else
            {
				if (this.Controller !== this.LogicDocumentController)
				{
					this.RemoveSelection();
					this.SetDocPosType(docpostype_Content);
				}

				this.MoveCursorPageDown(true === e.ShiftKey, true === e.CtrlKey);
            }
        }

		this.private_CheckCursorPosInFillingFormMode();
		this.CheckComplexFieldsInSelection();
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 35) // клавиша End
    {
        if (true === e.CtrlKey) // Ctrl + End - переход в конец документа
        {
            this.MoveCursorToEndPos(true === e.ShiftKey);
        }
        else // Переходим в конец строки
        {
            this.MoveCursorToEndOfLine(true === e.ShiftKey);
        }

        this.Document_UpdateInterfaceState();
        this.Document_UpdateRulersState();

		this.private_CheckCursorPosInFillingFormMode();
		this.CheckComplexFieldsInSelection();
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 36) // клавиша Home
    {
        if (true === e.CtrlKey) // Ctrl + Home - переход в начало документа
        {
            this.MoveCursorToStartPos(true === e.ShiftKey);
        }
        else // Переходим в начало строки
        {
            this.MoveCursorToStartOfLine(true === e.ShiftKey);
        }

        this.Document_UpdateInterfaceState();
        this.Document_UpdateRulersState();

		this.private_CheckCursorPosInFillingFormMode();
		this.CheckComplexFieldsInSelection();
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 37) // Left Arrow
    {
        // Чтобы при зажатой клавише курсор не пропадал
        if (true != e.ShiftKey)
            this.DrawingDocument.TargetStart();

        this.DrawingDocument.UpdateTargetFromPaint = true;
        this.MoveCursorLeft(true === e.ShiftKey, true === e.CtrlKey);
		this.private_CheckCursorPosInFillingFormMode();
		this.CheckComplexFieldsInSelection();
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 38) // Top Arrow
    {
        // TODO: Реализовать Ctrl + Up/ Ctrl + Shift + Up
        // Чтобы при зажатой клавише курсор не пропадал
        if (true != e.ShiftKey)
            this.DrawingDocument.TargetStart();

        this.DrawingDocument.UpdateTargetFromPaint = true;
        this.MoveCursorUp(true === e.ShiftKey, true === e.CtrlKey);
		this.private_CheckCursorPosInFillingFormMode();
		this.CheckComplexFieldsInSelection();
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 39) // Right Arrow
    {
        // Чтобы при зажатой клавише курсор не пропадал
        if (true != e.ShiftKey)
            this.DrawingDocument.TargetStart();

        this.DrawingDocument.UpdateTargetFromPaint = true;
        this.MoveCursorRight(true === e.ShiftKey, true === e.CtrlKey);
		this.private_CheckCursorPosInFillingFormMode();
		this.CheckComplexFieldsInSelection();
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 40) // Bottom Arrow
    {
        // TODO: Реализовать Ctrl + Down/ Ctrl + Shift + Down
        // Чтобы при зажатой клавише курсор не пропадал
        if (true != e.ShiftKey)
            this.DrawingDocument.TargetStart();

        this.DrawingDocument.UpdateTargetFromPaint = true;
        this.MoveCursorDown(true === e.ShiftKey, true === e.CtrlKey);
		this.private_CheckCursorPosInFillingFormMode();
		this.CheckComplexFieldsInSelection();
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 46) // Delete
    {
        if (true != e.ShiftKey)
        {
            if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Delete, null, true, this.IsFormFieldEditing()))
            {
                this.StartAction(AscDFH.historydescription_Document_DeleteButton);

				var oSelectInfo = this.GetSelectedElementsInfo();
				if (oSelectInfo.GetInlineLevelSdt())
					this.CheckInlineSdtOnDelete = oSelectInfo.GetInlineLevelSdt();

				this.Remove(1, false, false, false, e.CtrlKey);

				this.CheckInlineSdtOnDelete = null;

				this.FinalizeAction();
            }
            bRetValue = keydownresult_PreventAll;
        }
    }
    else if (e.KeyCode == 49 && true === e.AltKey && !e.AltGr) // Alt + Ctrl + Num1 - применяем стиль Heading1
    {
        if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Properties))
        {
            this.StartAction(AscDFH.historydescription_Document_SetStyleHeading1);
            this.SetParagraphStyle("Heading 1");
            this.UpdateInterface();
			this.FinalizeAction();
        }
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 50 && true === e.AltKey && !e.AltGr) // Alt + Ctrl + Num2 - применяем стиль Heading2
    {
        if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Properties))
        {
            this.StartAction(AscDFH.historydescription_Document_SetStyleHeading2);
            this.SetParagraphStyle("Heading 2");
            this.UpdateInterface();
			this.FinalizeAction();
        }
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 51 && true === e.AltKey && !e.AltGr) // Alt + Ctrl + Num3 - применяем стиль Heading3
    {
        if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Properties))
        {
            this.StartAction(AscDFH.historydescription_Document_SetStyleHeading3);
            this.SetParagraphStyle("Heading 3");
            this.UpdateInterface();
			this.FinalizeAction();
        }
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode === 53 && true === e.CtrlKey) // Ctrl + Num5 - зачеркиваем текст
    {
        var TextPr = this.GetCalculatedTextPr();
        if (null != TextPr)
        {
            if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
            {
                this.StartAction(AscDFH.historydescription_Document_SetTextStrikeoutHotKey);
                this.AddToParagraph(new ParaTextPr({Strikeout : TextPr.Strikeout === true ? false : true}));
                this.UpdateInterface();
				this.FinalizeAction();
            }
            bRetValue = keydownresult_PreventAll;
        }
    }
    else if (e.KeyCode === 56 && true === e.CtrlKey && true === e.ShiftKey) // Ctrl + Shift + Num8 показать/скрыть невидимые символы
	{
		var isShow = this.Api.get_ShowParaMarks();
		this.Api.put_ShowParaMarks(!isShow);
		this.Api.sync_ShowParaMarks();
		bRetValue = keydownresult_PreventAll;
	}
    else if (e.KeyCode == 65 && true === e.CtrlKey) // Ctrl + A - выделяем все
    {
        this.SelectAll();
        bUpdateSelection = false;
        bRetValue        = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 66 && true === e.CtrlKey) // Ctrl + B - делаем текст жирным
    {
        var TextPr = this.GetCalculatedTextPr();
        if (null != TextPr)
        {
            if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
            {
                this.StartAction(AscDFH.historydescription_Document_SetTextBoldHotKey);
                this.AddToParagraph(new ParaTextPr({Bold : TextPr.Bold === true ? false : true}));
                this.UpdateInterface();
				this.FinalizeAction();
            }
            bRetValue = keydownresult_PreventAll;
        }
    }
    else if (e.KeyCode == 67 && true === e.CtrlKey) // Ctrl + C + ...
    {
        if (true === e.ShiftKey) // Ctrl + Shift + C - копирование форматирования текста
        {
            this.Document_Format_Copy();
            bRetValue = keydownresult_PreventAll;
        }
    }
    else if (e.KeyCode == 69 && true === e.CtrlKey) // Ctrl + E + ...
    {
        if (true !== e.AltKey) // Ctrl + E - переключение прилегания параграфа между center и left
        {
            this.private_ToggleParagraphAlignByHotkey(AscCommon.align_Center);
            bRetValue = keydownresult_PreventAll;
        }
        else // Ctrl + Alt + E - добавляем знак евро €
        {
            if (false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content))
            {
                this.StartAction(AscDFH.historydescription_Document_AddEuroLetter);
                this.DrawingDocument.TargetStart();
                this.DrawingDocument.TargetShow();
                this.AddToParagraph(new ParaText(0x20AC));
				this.FinalizeAction();
            }
            bRetValue = keydownresult_PreventAll;
        }
    }
	else if (e.KeyCode == 70 && true === e.CtrlKey) // Ctrl + F + ...
	{
		if (true === e.AltKey)
		{
			this.AddFootnote();
			bRetValue = keydownresult_PreventAll;
		}
	}
    else if (e.KeyCode == 73 && true === e.CtrlKey) // Ctrl + I - делаем текст наклонным
    {
        var TextPr = this.GetCalculatedTextPr();
        if (null != TextPr)
        {
            if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
            {
                this.StartAction(AscDFH.historydescription_Document_SetTextItalicHotKey);
                this.AddToParagraph(new ParaTextPr({Italic : TextPr.Italic === true ? false : true}));
                this.UpdateInterface();
				this.FinalizeAction();
            }
            bRetValue = keydownresult_PreventAll;
        }
    }
    else if (e.KeyCode == 74 && true === e.CtrlKey) // Ctrl + J переключение прилегания параграфа между justify и left
    {
        this.private_ToggleParagraphAlignByHotkey(AscCommon.align_Justify);
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 75 && true === e.CtrlKey && false === e.ShiftKey) // Ctrl + K - добавление гиперссылки
    {
        if (true === this.CanAddHyperlink(false) && this.CanEdit())
            this.Api.sync_DialogAddHyperlink();

        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 76 && true === e.CtrlKey) // Ctrl + L + ...
    {
        if (true === e.ShiftKey) // Ctrl + Shift + L - добавляем список к данному параграфу
        {
            if (false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content))
            {
                this.StartAction(AscDFH.historydescription_Document_SetParagraphNumberingHotKey);
                this.SetParagraphNumbering({Type : 0, SubType : 1});
                this.UpdateInterface();
				this.FinalizeAction();
            }
            bRetValue = keydownresult_PreventAll;
        }
        else // Ctrl + L - переключение прилегания параграфа между left и justify
        {
            this.private_ToggleParagraphAlignByHotkey(align_Left);
            bRetValue = keydownresult_PreventAll;
        }
    }
    else if (e.KeyCode == 77 && true === e.CtrlKey) // Ctrl + M + ...
    {
        if (true === e.ShiftKey) // Ctrl + Shift + M - уменьшаем левый отступ
            this.DecreaseIndent();
        else // Ctrl + M - увеличиваем левый отступ
            this.IncreaseIndent();

        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 80 && true === e.CtrlKey) // Ctrl + P + ...
    {
        if (true === e.ShiftKey) // Ctrl + Shift + P - добавляем номер страницы в текущую позицию
        {
            if (false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content))
            {
                this.StartAction(AscDFH.historydescription_Document_AddPageNumHotKey);
                this.AddToParagraph(new ParaPageNum());
				this.FinalizeAction();
            }
            bRetValue = keydownresult_PreventAll;
        }
        else // Ctrl + P - print
        {
            this.DrawingDocument.m_oWordControl.m_oApi.onPrint();
            bRetValue = keydownresult_PreventAll;
        }
    }
    else if (e.KeyCode == 82 && true === e.CtrlKey) // Ctrl + R - переключение прилегания параграфа между right и left
    {
        this.private_ToggleParagraphAlignByHotkey(AscCommon.align_Right);
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 83 && false === this.IsViewMode() && true === e.CtrlKey) // Ctrl + S - save
    {
		this.Api.asc_Save(false);
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 85 && true === e.CtrlKey) // Ctrl + U - делаем текст подчеркнутым
    {
        var TextPr = this.GetCalculatedTextPr();
        if (null != TextPr)
        {
            if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
            {
                this.StartAction(AscDFH.historydescription_Document_SetTextUnderlineHotKey);
                this.AddToParagraph(new ParaTextPr({Underline : TextPr.Underline === true ? false : true}));
                this.UpdateInterface();
				this.FinalizeAction();
            }
            bRetValue = keydownresult_PreventAll;
        }
    }
	else if (e.KeyCode == 86 && true === e.CtrlKey) // Ctrl + V
	{
		if (true === e.ShiftKey) // Ctrl + Shift + V - вставка форматирования текста
		{
			if (false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content))
			{
				this.StartAction(AscDFH.historydescription_Document_FormatPasteHotKey);
				this.Document_Format_Paste();
				this.FinalizeAction();
			}
			bRetValue = keydownresult_PreventAll;
		}
	}
    else if (e.KeyCode == 89 && true === e.CtrlKey && (this.CanEdit() || this.IsEditCommentsMode() || this.IsFillingFormMode())) // Ctrl + Y - Redo
    {
        this.Document_Redo();
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 90 && true === e.CtrlKey && (this.CanEdit() || this.IsEditCommentsMode() || this.IsFillingFormMode()) && !this.IsViewModeInReview()) // Ctrl + Z - Undo
    {
       	this.Document_Undo();
        bRetValue = keydownresult_PreventAll;
    }
    else if ((/*в Opera такой код*/AscCommon.AscBrowser.isOpera && (e.KeyCode == 93 || 57351 == e.KeyCode)) ||
             (e.KeyCode == 121 && true === e.ShiftKey)) // // Shift + F10 - контекстное меню
    {
        var X_abs, Y_abs, oPosition, ConvertedPos;
        if (this.DrawingObjects.selectedObjects.length > 0)
        {
            oPosition    = this.DrawingObjects.getContextMenuPosition(this.CurPage);
            ConvertedPos = this.DrawingDocument.ConvertCoordsToCursorWR(oPosition.X, oPosition.Y, oPosition.PageIndex);
        }
        else
        {
            ConvertedPos = this.DrawingDocument.ConvertCoordsToCursorWR(this.TargetPos.X, this.TargetPos.Y, this.TargetPos.PageNum);
        }
        X_abs = ConvertedPos.X;
        Y_abs = ConvertedPos.Y;

        editor.sync_ContextMenuCallback({Type : Asc.c_oAscContextMenuTypes.Common, X_abs : X_abs, Y_abs : Y_abs});

        bUpdateSelection = false;
        bRetValue        = keydownresult_PreventAll;
    }
	else if (e.KeyCode == 120) // F9 - обновление полей
	{
		this.UpdateFields(true);

		bUpdateSelection = false;
		bRetValue        = keydownresult_PreventAll;
	}
    else if (e.KeyCode == 144) // Num Lock
    {
        // Ничего не делаем
        bUpdateSelection = false;
        bRetValue        = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 145) // Scroll Lock
    {
        // Ничего не делаем
        bUpdateSelection = false;
        bRetValue        = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 187) // =
    {
        if (!e.CtrlKey && true === e.AltKey && !e.AltGr) // Alt + =
        {
            var oSelectedInfo = this.GetSelectedElementsInfo();
            var oMath         = oSelectedInfo.Get_Math();
            if (null === oMath)
            {
            	this.Api.asc_AddMath();
				bRetValue = keydownresult_PreventAll;
            }
        }
    }
    else if (e.KeyCode == 188 && true === e.CtrlKey) // Ctrl + ,
    {
        var TextPr = this.GetCalculatedTextPr();
        if (null != TextPr)
        {
            if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
            {
                this.StartAction(AscDFH.historydescription_Document_SetTextVertAlignHotKey2);
                this.AddToParagraph(new ParaTextPr({VertAlign : TextPr.VertAlign === AscCommon.vertalign_SuperScript ? AscCommon.vertalign_Baseline : AscCommon.vertalign_SuperScript}));
                this.UpdateInterface();
				this.FinalizeAction();
            }
            bRetValue = keydownresult_PreventAll;
        }
    }
    else if (e.KeyCode == 189) // Клавиша Num-
    {
        if (true === e.CtrlKey && true === e.ShiftKey && false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content, null, true))
        {
            this.StartAction(AscDFH.historydescription_Document_MinusButton);

            this.DrawingDocument.TargetStart();
            this.DrawingDocument.TargetShow();

            var Item = new ParaText(0x002D);
            Item.Set_SpaceAfter(false);

            this.AddToParagraph(Item);
			this.FinalizeAction();
            bRetValue = keydownresult_PreventAll;
        }
    }
    else if (e.KeyCode == 190 && true === e.CtrlKey) // Ctrl + .
    {
        var TextPr = this.GetCalculatedTextPr();
        if (null != TextPr)
        {
            if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
            {
                this.StartAction(AscDFH.historydescription_Document_SetTextVertAlignHotKey3);
                this.AddToParagraph(new ParaTextPr({VertAlign : TextPr.VertAlign === AscCommon.vertalign_SubScript ? AscCommon.vertalign_Baseline : AscCommon.vertalign_SubScript}));
                this.UpdateInterface();
				this.FinalizeAction();
            }
            bRetValue = keydownresult_PreventAll;
        }
    }
    else if (e.KeyCode == 219 && true === e.CtrlKey) // Ctrl + [
    {
    	this.Api.FontSizeOut();
        this.Document_UpdateInterfaceState();
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 221 && true === e.CtrlKey) // Ctrl + ]
    {
        this.Api.FontSizeIn();
        this.Document_UpdateInterfaceState();
        bRetValue = keydownresult_PreventAll;
    }
    else if (e.KeyCode == 12288) // Space
    {
        if (false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content, null, true, this.IsFormFieldEditing()))
        {
            this.StartAction(AscDFH.historydescription_Document_SpaceButton);

            this.DrawingDocument.TargetStart();
            this.DrawingDocument.TargetShow();

            this.CheckLanguageOnTextAdd = true;
            this.AddToParagraph(new ParaSpace());
            this.CheckLanguageOnTextAdd = false;

			this.FinalizeAction();
        }

        bRetValue = keydownresult_PreventAll;
    }

    // Если был пересчет, значит были изменения, а вместе с ними пересылается и новая позиция курсора
    if (bRetValue & keydownresult_PreventKeyPress && OldRecalcId === this.RecalcId)
        this.private_UpdateTargetForCollaboration();

    if (bRetValue & keydownflags_PreventKeyPress && true === bUpdateSelection)
        this.Document_UpdateSelectionState();

    return bRetValue;
};
CDocument.prototype.OnKeyPress = function(e)
{
	var Code;
	if (null != e.Which)
		Code = e.Which;
	else if (e.KeyCode)
		Code = e.KeyCode;
	else
		Code = 0;//special char

	if (Code > 0x20)
	{
		if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_AddText, null, true, this.IsFormFieldEditing()))
		{
			this.StartAction(AscDFH.historydescription_Document_AddLetter);

			this.DrawingDocument.TargetStart();
			this.DrawingDocument.TargetShow();

			this.CheckLanguageOnTextAdd = true;
			this.AddToParagraph(new ParaText(Code));
			this.CheckLanguageOnTextAdd = false;

			this.FinalizeAction();
		}

		this.UpdateSelection();
		return true;
	}

	return false;
};
CDocument.prototype.OnMouseDown = function(e, X, Y, PageIndex)
{
	if (PageIndex < 0)
		return;

	this.private_UpdateTargetForCollaboration();

	// Сбрасываем проверку Drag-n-Drop
	this.Selection.DragDrop.Flag = 0;
	this.Selection.DragDrop.Data = null;

	// Сбрасываем текущий элемент в поиске
	if (this.SearchEngine.Count > 0)
		this.SearchEngine.Reset_Current();

	// Обработка правой кнопки мыши происходит на событии MouseUp
	if (AscCommon.g_mouse_button_right === e.Button)
		return;

	if (this.DrawTableMode.Draw || this.DrawTableMode.Erase)
	{
		this.DrawTableMode.Start  = true;
		this.DrawTableMode.StartX = X;
		this.DrawTableMode.StartY = Y;
		this.DrawTableMode.Page   = PageIndex;


		var arrTables = this.GetAllTablesOnPage(PageIndex);

		this.DrawTableMode.TablesOnPage = arrTables;

		var oElement     = null;
		var nMinDistance = null;
		var isInside     = false;
		for (var nTableIndex = 0, nTablesCount = arrTables.length; nTableIndex < nTablesCount; ++nTableIndex)
		{
			var oBounds = arrTables[nTableIndex].Table.GetPageBounds(arrTables[nTableIndex].Page);

			var nTempMin;
			var isTempInside = false;
			if (oBounds.Left < X && X < oBounds.Right)
			{
				if (oBounds.Top < Y && Y < oBounds.Bottom)
				{
					nTempMin     = Math.min(Math.abs(oBounds.Left - X), Math.abs(X - oBounds.Right), Math.abs(oBounds.Top - Y), Math.abs(Y - oBounds.Bottom));
					isTempInside = true;
				}
				else
				{
					nTempMin = Math.min(Math.abs(oBounds.Top - Y), Math.abs(Y - oBounds.Bottom));
				}
			}
			else
			{
				if (oBounds.Top < Y && Y < oBounds.Bottom)
				{
					nTempMin = Math.min(Math.abs(oBounds.Left - X), Math.abs(X - oBounds.Right));
				}
				else
				{
					nTempMin = Math.max(Math.min(Math.abs(oBounds.Top - Y), Math.abs(Y - oBounds.Bottom)), Math.min(Math.abs(oBounds.Left - X), Math.abs(X - oBounds.Right)));
				}
			}

			if (null == nMinDistance || (nTempMin < nMinDistance && (!isInside || isTempInside)))
			{
				oElement     = arrTables[nTableIndex].Table;
				nMinDistance = nTempMin;

				if (isTempInside)
					isInside = true;
			}
		}

		if (this.DrawTableMode.Draw && !isInside && nMinDistance > 5)
			oElement = null;

		if (oElement)
			this.DrawTableMode.Table = oElement;

		this.DrawTableMode.UpdateTablePages();

		return;
	}

	// Если мы только что расширяли документ двойным щелчком, то отменяем это действие
	if (true === this.History.Is_ExtendDocumentToPos())
	{
		this.Document_Undo();

		// Заглушка на случай "неудачного" пересчета, когда после него страниц меньше, чем ту, по которое мы кликаем
		if (PageIndex >= this.Pages.length)
		{
			this.RemoveSelection();
			return;
		}
	}

	var OldCurPage = this.CurPage;
	this.CurPage   = PageIndex;

	if (true === editor.isStartAddShape && (docpostype_HdrFtr !== this.CurPos.Type || null !== this.HdrFtr.CurHdrFtr))
	{
		if (docpostype_HdrFtr !== this.CurPos.Type)
		{
			this.SetDocPosType(docpostype_DrawingObjects);
			this.Selection.Use   = true;
			this.Selection.Start = true;
		}
		else
		{
			this.Selection.Use   = true;
			this.Selection.Start = true;

			this.HdrFtr.WaitMouseDown = false;
			var CurHdrFtr             = this.HdrFtr.CurHdrFtr;
			var DocContent            = CurHdrFtr.Content;

			DocContent.SetDocPosType(docpostype_DrawingObjects);
			DocContent.Selection.Use   = true;
			DocContent.Selection.Start = true;
		}

		if (true != this.DrawingObjects.isPolylineAddition())
			this.DrawingObjects.startAddShape(editor.addShapePreset);

		this.DrawingObjects.OnMouseDown(e, X, Y, this.CurPage);
	}
	else
	{
		if (true === e.ShiftKey &&
			( (docpostype_DrawingObjects !== this.CurPos.Type && !(docpostype_HdrFtr === this.CurPos.Type && this.HdrFtr.CurHdrFtr && this.HdrFtr.CurHdrFtr.Content.CurPos.Type === docpostype_DrawingObjects))
			|| true === this.DrawingObjects.checkTextObject(X, Y, PageIndex) ))
		{
			if (true === this.IsSelectionUse())
				this.Selection.Start = false;
			else
				this.StartSelectionFromCurPos();

			this.Selection_SetEnd(X, Y, e);
			this.Document_UpdateSelectionState();
			return;
		}

		this.Selection_SetStart(X, Y, e);

		if (e.ClickCount <= 1 && 1 !== this.Selection.DragDrop.Flag)
		{
			this.RecalculateCurPos();
			this.Document_UpdateSelectionState();
		}
	}
};
CDocument.prototype.OnMouseUp = function(e, X, Y, PageIndex)
{
	if (PageIndex < 0)
		return;

	if (this.DrawTableMode.Draw || this.DrawTableMode.Erase)
	{
		if (!this.DrawTableMode.Start)
			return;

		this.DrawTableMode.Start = false;

		if (PageIndex !== this.DrawTableMode.Page)
			return;

		this.DrawTableMode.EndX = X;
		this.DrawTableMode.EndY = Y;
		this.DrawTableMode.UpdateTablePages();

		this.DrawTable();

		this.DrawTableMode.StartX = -1;
		this.DrawTableMode.StartY = -1;
		this.DrawTableMode.EndX   = -1;
		this.DrawTableMode.EndY   = -1;
		this.DrawTableMode.Page   = -1;
		this.DrawTableMode.Table  = null;

		this.DrawingDocument.OnUpdateOverlay();
		return;
	}

	this.private_UpdateTargetForCollaboration();

	if (1 === this.Selection.DragDrop.Flag)
	{
		this.Selection.DragDrop.Flag = -1;
		var OldCurPage               = this.CurPage;
		this.CurPage                 = this.Selection.DragDrop.Data.PageNum;
		this.Selection_SetStart(this.Selection.DragDrop.Data.X, this.Selection.DragDrop.Data.Y, e);
		this.Selection.DragDrop.Flag = 0;
		this.Selection.DragDrop.Data = null;
	}

	// Если мы нажимали правую кнопку мыши, тогда нам надо сделать
	if (AscCommon.g_mouse_button_right === e.Button)
	{
		if (true === this.Selection.Start)
			return;

		var ConvertedPos = this.DrawingDocument.ConvertCoordsToCursorWR(X, Y, PageIndex);
		var X_abs        = ConvertedPos.X;
		var Y_abs        = ConvertedPos.Y;

		// Проверим попадание в значок таблицы, если в него попадаем, тогда выделяем таблицу
		if (true === this.DrawingDocument.IsCursorInTableCur(X, Y, PageIndex))
		{
			var Table = this.DrawingDocument.TableOutlineDr.TableOutline.Table;
			Table.SelectAll();
			Table.Document_SetThisElementCurrent(false);
			this.Document_UpdateSelectionState();
			this.Document_UpdateInterfaceState();
			editor.sync_ContextMenuCallback({Type : Asc.c_oAscContextMenuTypes.Common, X_abs : X_abs, Y_abs : Y_abs});
			return;
		}

		// Сначала проверим попадание в Flow-таблицы и автофигуры
		var pFlowTable = this.DrawingObjects.getTableByXY(X, Y, PageIndex, this);
		var nInDrawing = this.DrawingObjects.IsInDrawingObject(X, Y, PageIndex, this);

		if (docpostype_HdrFtr != this.CurPos.Type && -1 === nInDrawing && null === pFlowTable)
		{
			var PageMetrics = this.Get_PageContentStartPos(this.CurPage, this.Pages[this.CurPage].Pos);
			// Проверяем, не попали ли мы в колонтитул
			if (Y <= PageMetrics.Y)
			{
				editor.sync_ContextMenuCallback({
					Type    : Asc.c_oAscContextMenuTypes.ChangeHdrFtr,
					X_abs   : X_abs,
					Y_abs   : Y_abs,
					Header  : true,
					PageNum : PageIndex
				});
				return;
			}
			else if (Y > PageMetrics.YLimit)
			{
				editor.sync_ContextMenuCallback({
					Type    : Asc.c_oAscContextMenuTypes.ChangeHdrFtr,
					X_abs   : X_abs,
					Y_abs   : Y_abs,
					Header  : false,
					PageNum : PageIndex
				});
				return;
			}
		}

		// Проверяем попалили мы в селект
		if (false === this.CheckPosInSelection(X, Y, PageIndex, undefined))
		{
			this.CurPage = PageIndex;

			var MouseEvent_new =
				{
					// TODO : Если в MouseEvent будет использоваться что-то кроме ClickCount, Type и CtrlKey, добавить здесь
					ClickCount : 1,
					Type       : AscCommon.g_mouse_event_type_down,
					CtrlKey    : false,
					Button     : AscCommon.g_mouse_button_right
				};
			this.Selection_SetStart(X, Y, MouseEvent_new);

			MouseEvent_new.Type = AscCommon.g_mouse_event_type_up;
			this.Selection_SetEnd(X, Y, MouseEvent_new);

			this.Document_UpdateSelectionState();
			this.Document_UpdateRulersState();
			this.Document_UpdateInterfaceState();
		}

		editor.sync_ContextMenuCallback({Type : Asc.c_oAscContextMenuTypes.Common, X_abs : X_abs, Y_abs : Y_abs});
		this.private_UpdateCursorXY(true, true);

		return;
	}
	else if (AscCommon.g_mouse_button_left === e.Button)
	{
		if (true === this.Comments.Is_Use())
		{
			var Type = ( docpostype_HdrFtr === this.CurPos.Type ? AscCommon.comment_type_HdrFtr : AscCommon.comment_type_Common );

			// Проверяем не попали ли мы в комментарий
			var arrComments = this.Comments.Get_ByXY(PageIndex, X, Y, Type);

			var CommentsX     = null;
			var CommentsY     = null;
			var arrCommentsId = [];

			for (var nCommentIndex = 0, nCommentsCount = arrComments.length; nCommentIndex < nCommentsCount; ++nCommentIndex)
			{
				var Comment = arrComments[nCommentIndex];
				if (null != Comment && (this.Comments.IsUseSolved() || !Comment.IsSolved()))
				{
					if (null === CommentsX)
					{
						var Comment_PageNum = Comment.m_oStartInfo.PageNum;
						var Comment_Y       = Comment.m_oStartInfo.Y;
						var Comment_X       = this.Get_PageLimits(PageIndex).XLimit;
						var Para            = this.TableId.Get_ById(Comment.StartId);

						// Para может быть не задано, если комментарий добавлен к заголовку таблицы
						if (Para)
						{
							var TextTransform = Para.Get_ParentTextTransform();
							if (TextTransform)
							{
								Comment_Y = TextTransform.TransformPointY(Comment.m_oStartInfo.X, Comment.m_oStartInfo.Y);
							}

							var Coords = this.DrawingDocument.ConvertCoordsToCursorWR(Comment_X, Comment_Y, Comment_PageNum);
							this.SelectComment(Comment.Get_Id(), false);

							CommentsX = Coords.X;
							CommentsY = Coords.Y;
						}
					}

					arrCommentsId.push(Comment.Get_Id());
				}
			}

			if (null !== CommentsX && null !== CommentsY && arrCommentsId.length > 0)
			{
				this.Api.sync_ShowComment(arrCommentsId, CommentsX, CommentsY);
			}
			else
			{
				this.SelectComment(null, false);
				this.Api.sync_HideComment();
			}
		}
	}

	if (true === this.Selection.Start)
	{
		this.CurPage         = PageIndex;
		this.Selection.Start = false;
		this.Selection_SetEnd(X, Y, e);
		this.CheckComplexFieldsInSelection();
		this.Document_UpdateSelectionState();

		if (c_oAscFormatPainterState.kOff !== editor.isPaintFormat)
		{
			if (false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content))
			{
				this.StartAction(AscDFH.historydescription_Document_FormatPasteHotKey2);
				this.Document_Format_Paste();
				this.FinalizeAction();
			}

			if (c_oAscFormatPainterState.kOn === editor.isPaintFormat)
				editor.sync_PaintFormatCallback(c_oAscFormatPainterState.kOff);
		}
		else if (true === editor.isMarkerFormat && true === this.IsTextSelectionUse())
		{
			if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
			{
				this.StartAction(AscDFH.historydescription_Document_SetTextHighlight2);
				var ParaItem = null;
				if (this.HighlightColor != highlight_None)
				{
					var TextPr = this.GetCalculatedTextPr();
					if ("undefined" === typeof( TextPr.HighLight ) || null === TextPr.HighLight || highlight_None === TextPr.HighLight ||
						this.HighlightColor.r != TextPr.HighLight.r || this.HighlightColor.g != TextPr.HighLight.g || this.HighlightColor.b != TextPr.HighLight.b)
						ParaItem = new ParaTextPr({HighLight : this.HighlightColor});
					else
						ParaItem = new ParaTextPr({HighLight : highlight_None});
				}
				else
				{
					ParaItem = new ParaTextPr({HighLight : this.HighlightColor});
				}

				this.AddToParagraph(ParaItem);
				this.MoveCursorToXY(X, Y, false);
				this.Document_UpdateSelectionState();

				this.FinalizeAction();

				this.Api.sync_MarkerFormatCallback(true);
			}
		}
	}

	var oSelectedContent = this.GetSelectedElementsInfo();
	var oInlineSdt       = oSelectedContent.GetInlineLevelSdt();
	var oBlockSdt        = oSelectedContent.GetBlockLevelSdt();
	if ((oInlineSdt && oInlineSdt.IsCheckBox()) || (oBlockSdt && oBlockSdt.IsCheckBox()))
	{
		var oCC = (oInlineSdt && oInlineSdt.IsCheckBox()) ? oInlineSdt : oBlockSdt;
		oCC.SkipSpecialContentControlLock(true);
		if (!this.IsSelectionLocked(AscCommon.changestype_Paragraph_Content, null, true, this.IsFillingFormMode()))
		{
			this.StartAction();
			oCC.ToggleCheckBox();
			this.Recalculate();
			this.UpdateTracks();
			this.FinalizeAction();
		}
		oCC.SkipSpecialContentControlLock(false);
	}

	this.private_CheckCursorPosInFillingFormMode();

	this.private_UpdateCursorXY(true, true);
};
CDocument.prototype.OnMouseMove = function(e, X, Y, PageIndex)
{
	if (PageIndex < 0)
		return;

	if (this.DrawTableMode.Start
		&& (PageIndex === this.DrawTableMode.Page)
		&& (this.DrawTableMode.Draw || this.DrawTableMode.Erase))
	{
		this.DrawTableMode.EndX = X;
		this.DrawTableMode.EndY = Y;
		this.DrawTableMode.CheckSelectedTable();
		this.DrawTableMode.UpdateTablePages();
	}


	if (true === this.Selection.Start)
		this.private_UpdateTargetForCollaboration();

	this.UpdateCursorType(X, Y, PageIndex, e);
	this.CollaborativeEditing.Check_ForeignCursorsLabels(X, Y, PageIndex);

	if (this.DrawTableMode.Draw || this.DrawTableMode.Erase)
	{
	    if (this.DrawTableMode.Start)
            this.DrawingDocument.OnUpdateOverlay();

		return;
	}

	if (1 === this.Selection.DragDrop.Flag)
	{
		// Если курсор не изменил позицию, тогда ничего не делаем, а если изменил, тогда стартуем Drag-n-Drop
		if (Math.abs(this.Selection.DragDrop.Data.X - X) > 0.001 || Math.abs(this.Selection.DragDrop.Data.Y - Y) > 0.001)
		{
			this.Selection.DragDrop.Flag = 0;
			this.Selection.DragDrop.Data = null;

			// Вызываем стандартное событие mouseMove, чтобы сбросить различные подсказки, если они были
			this.Api.sync_MouseMoveStartCallback();
			this.Api.sync_MouseMoveCallback(new AscCommon.CMouseMoveData());
			this.Api.sync_MouseMoveEndCallback();

			this.DrawingDocument.StartTrackText();
		}

		return;
	}

	if (true === this.Selection.Use && true === this.Selection.Start)
	{
		this.CurPage = PageIndex;
		this.Selection_SetEnd(X, Y, e);
		this.Document_UpdateSelectionState();
	}
};
/**
 * Проверяем будет ли добавление текста на ивенте KeyDown
 * @param e
 * @returns {Number[]} Массив юникодных значений
 */
CDocument.prototype.GetAddedTextOnKeyDown = function(e)
{
	if (e.KeyCode === 32) // Space
	{
		var oSelectedInfo = this.GetSelectedElementsInfo();
		var oMath         = oSelectedInfo.Get_Math();

		if (!oMath)
		{
			if (true === e.ShiftKey && true === e.CtrlKey)
				return [0x00A0];
		}
	}
	else if (e.KeyCode == 69 && true === e.CtrlKey) // Ctrl + E + ...
	{
		if (true === e.AltKey) // Ctrl + Alt + E - добавляем знак евро €
			return [0x20AC];
	}
	else if (e.KeyCode == 189) // Клавиша Num-
	{
		if (true === e.CtrlKey && true === e.ShiftKey)
			return [0x2013];
	}

	return [];
};
CDocument.prototype.Get_Numbering = function()
{
	return this.Numbering;
};
CDocument.prototype.GetNumbering = function()
{
	return this.Numbering;
};
/**
 * Получаем стиль по выделенному фрагменту
 */
CDocument.prototype.GetStyleFromFormatting = function()
{
	return this.Controller.GetStyleFromFormatting();
};
/**
 * Добавляем новый стиль (или заменяем старый с таким же названием).
 * И сразу применяем его к выделенному фрагменту.
 */
CDocument.prototype.Add_NewStyle = function(oStyle)
{
	if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Document_Styles, {Type : AscCommon.changestype_2_AdditionalTypes, Types : [AscCommon.changestype_Paragraph_Properties]}))
	{
		this.StartAction(AscDFH.historydescription_Document_AddNewStyle);
		var NewStyle = this.Styles.Create_StyleFromInterface(oStyle);
		this.SetParagraphStyle(NewStyle.Get_Name());
		this.Recalculate();
		this.UpdateInterface();
		this.FinalizeAction();
	}
};
/**
 * Удаляем заданный стиль по имени.
 */
CDocument.prototype.Remove_Style = function(sStyleName)
{
	var StyleId = this.Styles.GetStyleIdByName(sStyleName);
	// Сначала проверим есть ли стиль с таким именем
	if (null == StyleId)
		return;

	if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Document_Styles))
	{
		this.StartAction(AscDFH.historydescription_Document_RemoveStyle);
		this.Styles.Remove_StyleFromInterface(StyleId);
		this.Recalculate();
		this.UpdateInterface();
		this.FinalizeAction();
	}
};
/**
 * Удаляем все недефолтовые стили в документе.
 */
CDocument.prototype.Remove_AllCustomStyles = function()
{
	if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Document_Styles))
	{
		this.StartAction(AscDFH.historydescription_Document_RemoveAllCustomStyles);
		this.Styles.Remove_AllCustomStylesFromInterface();
		this.Recalculate();
		this.UpdateInterface();
		this.FinalizeAction();
	}
};
/**
 * Проверяем является ли заданный стиль дефолтовым.
 */
CDocument.prototype.Is_StyleDefault = function(sName)
{
	return this.Styles.Is_StyleDefault(sName);
};
/**
 * Проверяем изменен ли дефолтовый стиль.
 */
CDocument.prototype.Is_DefaultStyleChanged = function(sName)
{
	return this.Styles.Is_DefaultStyleChanged(sName);
};
CDocument.prototype.Get_Styles = function()
{
	return this.Styles;
};
/**
 * Получаем ссылку на объект, работающий со стилями
 * @returns {CStyles}
 */
CDocument.prototype.GetStyles = function()
{
	return this.Styles;
};
CDocument.prototype.CopyStyle = function()
{
	return this.Styles.CopyStyle();
};
CDocument.prototype.Get_TableStyleForPara = function()
{
	return null;
};
CDocument.prototype.Get_ShapeStyleForPara = function()
{
	return null;
};
CDocument.prototype.Get_TextBackGroundColor = function()
{
	return undefined;
};
CDocument.prototype.Select_DrawingObject = function(Id)
{
	this.RemoveSelection();

	// Прячем курсор
	this.DrawingDocument.TargetEnd();
	this.DrawingDocument.SetCurrentPage(this.CurPage);

	this.Selection.Start = false;
	this.Selection.Use   = true;
	this.SetDocPosType(docpostype_DrawingObjects);
	this.DrawingObjects.selectById(Id, this.CurPage);

	this.Document_UpdateInterfaceState();
	this.Document_UpdateSelectionState();
};
/**
 * Получем ближайшую возможную позицию курсора.
 * @param PageNum
 * @param X
 * @param Y
 * @param bAnchor
 * @param Drawing
 * @returns {*}
 */
CDocument.prototype.Get_NearestPos = function(PageNum, X, Y, bAnchor, Drawing)
{
	if (undefined === bAnchor)
		bAnchor = false;

	if (docpostype_HdrFtr === this.GetDocPosType())
		return this.HdrFtr.Get_NearestPos(PageNum, X, Y, bAnchor, Drawing);

	var bInText    = (null === this.IsInText(X, Y, PageNum) ? false : true);
	var nInDrawing = this.DrawingObjects.IsInDrawingObject(X, Y, PageNum, this);

	if (true != bAnchor)
	{
		// Проверяем попадание в графические объекты
		var NearestPos = this.DrawingObjects.getNearestPos(X, Y, PageNum, Drawing);
		if (( nInDrawing === DRAWING_ARRAY_TYPE_BEFORE || nInDrawing === DRAWING_ARRAY_TYPE_INLINE || ( false === bInText && nInDrawing >= 0 ) ) && null != NearestPos)
			return NearestPos;

		NearestPos = true === this.Footnotes.CheckHitInFootnote(X, Y, PageNum) ? this.Footnotes.GetNearestPos(X, Y, PageNum, false, Drawing) : null;
		if (null !== NearestPos)
			return NearestPos;
	}

	var ContentPos = this.Internal_GetContentPosByXY(X, Y, PageNum);

	// Делаем логику как в ворде
	if (true === bAnchor && ContentPos > 0 && PageNum > 0 && ContentPos === this.Pages[PageNum].Pos && ContentPos === this.Pages[PageNum - 1].EndPos && this.Pages[PageNum].EndPos > this.Pages[PageNum].Pos && type_Paragraph === this.Content[ContentPos].GetType() && true === this.Content[ContentPos].IsContentOnFirstPage())
		ContentPos++;

	var ElementPageIndex = this.private_GetElementPageIndexByXY(ContentPos, X, Y, PageNum);
	return this.Content[ContentPos].GetNearestPos(ElementPageIndex, X, Y, bAnchor, Drawing);
};
CDocument.prototype.Internal_Content_Add = function(Position, NewObject, bCheckLastElement)
{
	// Position = this.Content.length  допускается
	if (Position < 0 || Position > this.Content.length)
		return;

	var PrevObj = this.Content[Position - 1] ? this.Content[Position - 1] : null;
	var NextObj = this.Content[Position] ? this.Content[Position] : null;

	this.private_RecalculateNumbering([NewObject]);
	this.History.Add(new CChangesDocumentAddItem(this, Position, [NewObject]));
	this.Content.splice(Position, 0, NewObject);
	this.private_UpdateSelectionPosOnAdd(Position);
	NewObject.Set_Parent(this);
	NewObject.Set_DocumentNext(NextObj);
	NewObject.Set_DocumentPrev(PrevObj);

	if (null != PrevObj)
		PrevObj.Set_DocumentNext(NewObject);

	if (null != NextObj)
		NextObj.Set_DocumentPrev(NewObject);

	// Обновим информацию о секциях
	this.SectionsInfo.Update_OnAdd(Position, [NewObject]);

	// Проверим последний параграф
	this.Check_SectionLastParagraph();

	// Проверим, что последний элемент - параграф
	if (false !== bCheckLastElement && type_Paragraph !== this.Content[this.Content.length - 1].GetType())
		this.Internal_Content_Add(this.Content.length, new Paragraph(this.DrawingDocument, this));

	// Запоминаем, что нам нужно произвести переиндексацию элементов
	this.private_ReindexContent(Position);

	if (type_Paragraph === NewObject.GetType())
		this.DocumentOutline.CheckParagraph(NewObject);
};
CDocument.prototype.Internal_Content_Remove = function(Position, Count, bCheckLastElement)
{
	var ChangePos = -1;

	if (Position < 0 || Position >= this.Content.length || Count <= 0)
		return -1;

	var PrevObj = this.Content[Position - 1] ? this.Content[Position - 1] : null;
	var NextObj = this.Content[Position + Count] ? this.Content[Position + Count] : null;

	for (var Index = 0; Index < Count; Index++)
	{
		this.Content[Position + Index].PreDelete();
	}

	this.History.Add(new CChangesDocumentRemoveItem(this, Position, this.Content.slice(Position, Position + Count)));
	var Elements = this.Content.splice(Position, Count);
	this.private_RecalculateNumbering(Elements);
	this.private_UpdateSelectionPosOnRemove(Position, Count);

	if (null != PrevObj)
		PrevObj.Set_DocumentNext(NextObj);

	if (null != NextObj)
		NextObj.Set_DocumentPrev(PrevObj);

	// Проверим, что последний элемент - параграф
	if (false !== bCheckLastElement && (this.Content.length <= 0 || type_Paragraph !== this.Content[this.Content.length - 1].GetType()))
		this.Internal_Content_Add(this.Content.length, new Paragraph(this.DrawingDocument, this));

	// Обновим информацию о секциях
	this.SectionsInfo.Update_OnRemove(Position, Count, true);

	// Проверим последний параграф
	this.Check_SectionLastParagraph();

	// Проверим не является ли рамкой последний параграф
	this.private_CheckFramePrLastParagraph();

	// Запоминаем, что нам нужно произвести переиндексацию элементов
	this.private_ReindexContent(Position);

	return ChangePos;
};
CDocument.prototype.Clear_ContentChanges = function()
{
	this.m_oContentChanges.Clear();
};
CDocument.prototype.Add_ContentChanges = function(Changes)
{
	this.m_oContentChanges.Add(Changes);
};
CDocument.prototype.Refresh_ContentChanges = function()
{
	this.m_oContentChanges.Refresh();
};
/**
 * @param AlignV 0 - Верх, 1 - низ
 * @param AlignH стандартные значения align_Left, align_Center, align_Right
 */
CDocument.prototype.Document_AddPageNum = function(AlignV, AlignH)
{
	if (AlignV >= 0)
	{
		var PageIndex = this.CurPage;
		if (docpostype_HdrFtr === this.GetDocPosType())
			PageIndex = this.HdrFtr.Get_CurPage();

		if (PageIndex < 0)
			PageIndex = this.CurPage;

		this.Create_HdrFtrWidthPageNum(PageIndex, AlignV, AlignH);
	}
	else
	{
		this.AddToParagraph(new ParaPageNum());
	}

	this.Document_UpdateInterfaceState();
};
CDocument.prototype.Document_SetHdrFtrFirstPage = function(Value)
{
	var CurHdrFtr = this.HdrFtr.CurHdrFtr;

	if (null === CurHdrFtr || -1 === CurHdrFtr.RecalcInfo.CurPage)
		return;

	var CurPage = CurHdrFtr.RecalcInfo.CurPage;
	var Index   = this.Pages[CurPage].Pos;
	var SectPr  = this.SectionsInfo.Get_SectPr(Index).SectPr;

	SectPr.Set_TitlePage(Value);

	if (true === Value)
	{
		// Если мы добавляем разные колонтитулы для первой страницы, а этих колонтитулов нет, тогда создаем их
		var FirstSectPr = this.SectionsInfo.Get_SectPr2(0).SectPr;
		var FirstHeader = FirstSectPr.Get_Header_First();
		var FirstFooter = FirstSectPr.Get_Footer_First();

		if (null === FirstHeader)
		{
			var Header = new CHeaderFooter(this.HdrFtr, this, this.DrawingDocument, hdrftr_Header);
			FirstSectPr.Set_Header_First(Header);

			this.HdrFtr.Set_CurHdrFtr(Header);
		}
		else
			this.HdrFtr.Set_CurHdrFtr(FirstHeader);

		if (null === FirstFooter)
		{
			var Footer = new CHeaderFooter(this.HdrFtr, this, this.DrawingDocument, hdrftr_Footer);
			FirstSectPr.Set_Footer_First(Footer);
		}
	}
	else
	{
		var TempSectPr = SectPr;
		var TempIndex  = Index;
		while (null === TempSectPr.Get_Header_Default())
		{
			TempIndex--;
			if (TempIndex < 0)
				break;

			TempSectPr = this.SectionsInfo.Get_SectPr(TempIndex).SectPr;
		}

		this.HdrFtr.Set_CurHdrFtr(TempSectPr.Get_Header_Default());
	}


	this.Recalculate();

	if (null !== this.HdrFtr.CurHdrFtr)
	{
		this.HdrFtr.CurHdrFtr.Content.MoveCursorToStartPos();
		this.HdrFtr.CurHdrFtr.Set_Page(CurPage);
	}

	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.Document_SetHdrFtrEvenAndOddHeaders = function(Value)
{
	this.Set_DocumentEvenAndOddHeaders(Value);

	var FirstSectPr;
	if (true === Value)
	{
		// Если мы добавляем разные колонтитулы для четных и нечетных страниц, а этих колонтитулов нет, тогда
		// создаем их в самой первой секции
		FirstSectPr = this.SectionsInfo.Get_SectPr2(0).SectPr;
		if (null === FirstSectPr.Get_Header_Even())
		{
			var Header = new CHeaderFooter(this.HdrFtr, this, this.DrawingDocument, hdrftr_Header);
			FirstSectPr.Set_Header_Even(Header);
		}

		if (null === FirstSectPr.Get_Footer_Even())
		{
			var Footer = new CHeaderFooter(this.HdrFtr, this, this.DrawingDocument, hdrftr_Footer);
			FirstSectPr.Set_Footer_Even(Footer);
		}
	}
	else
	{
		FirstSectPr = this.SectionsInfo.Get_SectPr2(0).SectPr;
	}

	if (null !== FirstSectPr.Get_Header_First() && true === FirstSectPr.TitlePage)
		this.HdrFtr.Set_CurHdrFtr(FirstSectPr.Get_Header_First());
	else
		this.HdrFtr.Set_CurHdrFtr(FirstSectPr.Get_Header_Default());


	this.Recalculate();

	if (null !== this.HdrFtr.CurHdrFtr)
		this.HdrFtr.CurHdrFtr.Content.MoveCursorToStartPos();

	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.Document_SetHdrFtrDistance = function(Value)
{
	var CurHdrFtr = this.HdrFtr.CurHdrFtr;

	if (null === CurHdrFtr)
		return;

	var CurPage = CurHdrFtr.RecalcInfo.CurPage;
	if (-1 === CurPage)
		return;

	var Index  = this.Pages[CurPage].Pos;
	var SectPr = this.SectionsInfo.Get_SectPr(Index).SectPr;

	if (hdrftr_Header === CurHdrFtr.Type)
		SectPr.SetPageMarginHeader(Value);
	else
		SectPr.SetPageMarginFooter(Value);

	this.Recalculate();

	this.Document_UpdateRulersState();
	this.Document_UpdateInterfaceState();
	this.Document_UpdateSelectionState();
};
CDocument.prototype.Document_SetHdrFtrBounds = function(Y0, Y1)
{
	var CurHdrFtr = this.HdrFtr.CurHdrFtr;

	if (null === CurHdrFtr)
		return;

	var CurPage = CurHdrFtr.RecalcInfo.CurPage;
	if (-1 === CurPage)
		return;

	var Index  = this.Pages[CurPage].Pos;
	var SectPr = this.SectionsInfo.Get_SectPr(Index).SectPr;
	var Bounds = CurHdrFtr.Get_Bounds();

	if (hdrftr_Header === CurHdrFtr.Type)
	{
		if (null !== Y0)
			SectPr.SetPageMarginHeader(Y0);

		if (null !== Y1)
			SectPr.SetPageMargins(undefined, Y1, undefined, undefined);
	}
	else
	{
		if (null !== Y0)
		{
			var H   = Bounds.Bottom - Bounds.Top;
			var _Y1 = Y0 + H;

			SectPr.SetPageMarginFooter(SectPr.GetPageHeight() - _Y1);
		}
	}

	this.Recalculate();

	this.Document_UpdateRulersState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.Document_SetHdrFtrLink = function(bLinkToPrevious)
{
	var CurHdrFtr = this.HdrFtr.CurHdrFtr;
	if (docpostype_HdrFtr !== this.GetDocPosType() || null === CurHdrFtr || -1 === CurHdrFtr.RecalcInfo.CurPage)
		return;

	var PageIndex = CurHdrFtr.RecalcInfo.CurPage;

	var Index  = this.Pages[PageIndex].Pos;
	var SectPr = this.SectionsInfo.Get_SectPr(Index).SectPr;

	// У самой первой секции не может быть повторяющихся колонтитулов, поэтому не делаем ничего
	if (SectPr === this.SectionsInfo.Get_SectPr2(0).SectPr)
		return;

	// Определим тип колонтитула, в котором мы находимся
	var SectionPageInfo = this.Get_SectionPageNumInfo(PageIndex);

	var bFirst  = ( true === SectionPageInfo.bFirst && true === SectPr.Get_TitlePage() ? true : false );
	var bEven   = ( true === SectionPageInfo.bEven && true === EvenAndOddHeaders ? true : false );
	var bHeader = ( hdrftr_Header === CurHdrFtr.Type ? true : false );

	var _CurHdrFtr = SectPr.GetHdrFtr(bHeader, bFirst, bEven);

	if (true === bLinkToPrevious)
	{
		// Если нам надо повторять колонтитул, а он уже изначально повторяющийся, тогда не делаем ничего
		if (null === _CurHdrFtr)
			return;

		// Очистим селект
		_CurHdrFtr.RemoveSelection();

		// Просто удаляем запись о данном колонтитуле в секции
		SectPr.Set_HdrFtr(bHeader, bFirst, bEven, null);

		var HdrFtr = this.Get_SectionHdrFtr(PageIndex, bFirst, bEven);

		// Заглушка. Вообще такого не должно быть, чтобы был колонтитул не в первой секции, и не было в первой,
		// но, на всякий случай, обработаем такую ситуацию.
		if (true === bHeader)
		{
			if (null === HdrFtr.Header)
				CurHdrFtr = this.Create_SectionHdrFtr(hdrftr_Header, PageIndex);
			else
				CurHdrFtr = HdrFtr.Header;
		}
		else
		{
			if (null === HdrFtr.Footer)
				CurHdrFtr = this.Create_SectionHdrFtr(hdrftr_Footer, PageIndex);
			else
				CurHdrFtr = HdrFtr.Footer;
		}


		this.HdrFtr.Set_CurHdrFtr(CurHdrFtr);
		this.HdrFtr.CurHdrFtr.MoveCursorToStartPos(false);
	}
	else
	{
		// Если данный колонтитул уже не повторяющийся, тогда ничего не делаем
		if (null !== _CurHdrFtr)
			return;

		var NewHdrFtr = CurHdrFtr.Copy();
		SectPr.Set_HdrFtr(bHeader, bFirst, bEven, NewHdrFtr);
		this.HdrFtr.Set_CurHdrFtr(NewHdrFtr);
		this.HdrFtr.CurHdrFtr.MoveCursorToStartPos(false);
	}

	this.Recalculate();

	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.SetSectionStartPage = function(nStartPage)
{
	var oCurHdrFtr = this.HdrFtr.CurHdrFtr;
	if (!oCurHdrFtr)
		return;

	var nCurPage = oCurHdrFtr.RecalcInfo.CurPage;
	if (-1 === nCurPage)
		return;

	var nIndex  = this.Pages[nCurPage].Pos;
	var oSectPr = this.SectionsInfo.Get_SectPr(nIndex).SectPr;

	oSectPr.Set_PageNum_Start(nStartPage);

	this.Recalculate();

	this.Document_UpdateRulersState();
	this.Document_UpdateInterfaceState();
	this.Document_UpdateSelectionState();
};
CDocument.prototype.Document_Format_Copy = function()
{
	this.CopyTextPr = this.GetDirectTextPr();
	this.CopyParaPr = this.GetDirectParaPr();
};
CDocument.prototype.EndHdrFtrEditing = function(bCanStayOnPage)
{
	if (docpostype_HdrFtr === this.GetDocPosType())
	{
		this.SetDocPosType(docpostype_Content);
		var CurHdrFtr = this.HdrFtr.Get_CurHdrFtr();
		if (null === CurHdrFtr || undefined === CurHdrFtr || true !== bCanStayOnPage)
		{
			this.MoveCursorToStartPos(false);
		}
		else
		{
			CurHdrFtr.RemoveSelection();

			if (hdrftr_Header == CurHdrFtr.Type)
				this.MoveCursorToXY(0, 0, false);
			else
				this.MoveCursorToXY(0, 100000, false); // TODO: Переделать здесь по-нормальному
		}

		this.DrawingDocument.ClearCachePages();
		this.DrawingDocument.FirePaint();

		this.Document_UpdateRulersState();
		this.Document_UpdateInterfaceState();
		this.Document_UpdateSelectionState();
	}
};
CDocument.prototype.EndFootnotesEditing = function()
{
	if (docpostype_Footnotes === this.GetDocPosType())
	{
		this.SetDocPosType(docpostype_Content);

		this.MoveCursorToStartPos(false);

		// TODO: Не всегда можно в данной функции использовать MoveCursorToXY, потому что
		//       данная страница еще может быть не рассчитана.
		//this.MoveCursorToXY(0, 0, false);

		this.DrawingDocument.ClearCachePages();
		this.DrawingDocument.FirePaint();

		this.Document_UpdateRulersState();
		this.Document_UpdateInterfaceState();
		this.Document_UpdateSelectionState();
	}
};
CDocument.prototype.EndDrawingEditing = function()
{
	if (docpostype_DrawingObjects === this.GetDocPosType() || (docpostype_HdrFtr === this.GetDocPosType() && null != this.HdrFtr.CurHdrFtr && docpostype_DrawingObjects === this.HdrFtr.CurHdrFtr.Content.CurPos.Type ))
	{
		this.DrawingObjects.resetSelection2();
		this.Document_UpdateInterfaceState();
		this.Document_UpdateSelectionState();
		this.private_UpdateCursorXY(true, true);
	}
};
CDocument.prototype.Document_Format_Paste = function()
{
	this.Controller.PasteFormatting(this.CopyTextPr, this.CopyParaPr);
	this.Recalculate();
	this.Document_UpdateInterfaceState();
	this.Document_UpdateSelectionState();
};
CDocument.prototype.IsTableCellContent = function(isReturnCell)
{
	if (true === isReturnCell)
		return null;

	return false;
};
CDocument.prototype.Check_AutoFit = function()
{
	return false;
};
CDocument.prototype.Is_TopDocument = function(bReturnTopDocument)
{
	if (true === bReturnTopDocument)
		return this;

	return true;
};
CDocument.prototype.Is_InTable = function(bReturnTopTable)
{
	if (true === bReturnTopTable)
		return null;

	return false;
};
CDocument.prototype.Is_DrawingShape = function(bRetShape)
{
	if (bRetShape === true)
	{
		return null;
	}
	return false;
};
CDocument.prototype.IsSelectionUse = function()
{
	return this.Controller.IsSelectionUse();
};
CDocument.prototype.IsNumberingSelection = function()
{
	return this.Controller.IsNumberingSelection();
};
CDocument.prototype.IsTextSelectionUse = function()
{
	return this.Controller.IsTextSelectionUse();
};
CDocument.prototype.GetCurPosXY = function()
{
	var TempXY = this.Controller.GetCurPosXY();
	this.private_CheckCurPage();
	return {X : TempXY.X, Y : TempXY.Y, PageNum : this.CurPage};
};
/**
 * Возвращаем выделенный текст, если в выделении не более 1 параграфа, и там нет картинок, нумерации страниц и т.д.
 * @param bClearText
 * @param oPr
 * @returns {?string}
 */
CDocument.prototype.GetSelectedText = function(bClearText, oPr)
{
	if (undefined === oPr)
		oPr = {};

	if (undefined === bClearText)
		bClearText = false;

	return this.Controller.GetSelectedText(bClearText, oPr);
};
/**
 * Получаем текущий параграф (или граничные параграфы селекта)
 * @param bIgnoreSelection Если true, тогда используется текущая позиция, даже если есть селект
 * @param bReturnSelectedArray (Используется, только если bIgnoreSelection==false) Если true, тогда возвращаем массив из
 * из параграфов, которые попали в выделение.
 * @param {object} oPr
 *  oPr.ReplacePlaceHolder {boolean} - Если текущий параграф в плейсхолдере, тогда заменяем его нормальным контентом
 *  oPr.ReturnSelectedTable {boolean} - Если идет выделение по ячейкам, тогда возвращаем таблицу
 * @returns {Paragraph | [Paragraph]}
 */
CDocument.prototype.GetCurrentParagraph = function(bIgnoreSelection, bReturnSelectedArray, oPr)
{
	if (true !== bIgnoreSelection && true === bReturnSelectedArray)
	{
		var arrSelectedParagraphs = [];
		this.Controller.GetCurrentParagraph(bIgnoreSelection, arrSelectedParagraphs, oPr);
		return arrSelectedParagraphs;
	}
	else
	{
		return this.Controller.GetCurrentParagraph(bIgnoreSelection, null, oPr);
	}
};
/**
 * Возвращаем массив параграфов, попавших в селект
 * @returns {Paragraph[]}
 */
CDocument.prototype.GetSelectedParagraphs = function()
{
	return this.GetCurrentParagraph(false, true);
};
/**
 * Получаем информацию о текущем выделении
 * @returns {CSelectedElementsInfo}
 */
CDocument.prototype.GetSelectedElementsInfo = function(oPr)
{
	var oInfo = new CSelectedElementsInfo(oPr);
	this.Controller.GetSelectedElementsInfo(oInfo);
	return oInfo;
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с таблицами
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.AddTableRow = function(bBefore)
{
	this.Controller.AddTableRow(bBefore);
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.AddTableColumn = function(bBefore)
{
	this.Controller.AddTableColumn(bBefore);
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.RemoveTableRow = function()
{
	this.Controller.RemoveTableRow();
	this.Recalculate();
	this.UpdateSelection();
	this.UpdateInterface();
};
CDocument.prototype.RemoveTableColumn = function()
{
	this.Controller.RemoveTableColumn();
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.MergeTableCells = function()
{
	this.Controller.MergeTableCells();
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.SplitTableCells = function(Cols, Rows)
{
	this.Controller.SplitTableCells(Cols, Rows);
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.RemoveTableCells = function()
{
	this.Controller.RemoveTableCells();
	this.Recalculate();
	this.UpdateSelection();
	this.UpdateInterface();
};
CDocument.prototype.RemoveTable = function()
{
	this.Controller.RemoveTable();
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
	this.Document_UpdateRulersState();
};
CDocument.prototype.SelectTable = function(Type)
{
	this.Controller.SelectTable(Type);
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
	//this.Document_UpdateRulersState();
};
CDocument.prototype.CanMergeTableCells = function()
{
	return this.Controller.CanMergeTableCells();
};
CDocument.prototype.CanSplitTableCells = function()
{
	return this.Controller.CanSplitTableCells();
};
CDocument.prototype.CheckTableCoincidence = function(Table)
{
	return false;
};
CDocument.prototype.DistributeTableCells = function(isHorizontally)
{
	if (!this.Controller.DistributeTableCells(isHorizontally))
		return false;

	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();

	return true;
};
//----------------------------------------------------------------------------------------------------------------------
// Дополнительные функции
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.Document_CreateFontMap = function()
{
	var FontMap = {};
	this.SectionsInfo.Document_CreateFontMap(FontMap);

	var Count = this.Content.length;
	for (var Index = 0; Index < Count; Index++)
	{
		this.Content[Index].CreateFontMap(FontMap);
	}
	AscFormat.checkThemeFonts(FontMap, this.theme.themeElements.fontScheme);
	return FontMap;
};
CDocument.prototype.Document_CreateFontCharMap = function(FontCharMap)
{
	this.SectionsInfo.Document_CreateFontCharMap(FontCharMap);
	this.DrawingObjects.documentCreateFontCharMap(FontCharMap);

	var Count = this.Content.length;
	for (var Index = 0; Index < Count; Index++)
	{
		this.Content[Index].CreateFontCharMap(FontCharMap);
	}
};
CDocument.prototype.Document_Get_AllFontNames = function()
{
	var AllFonts = {};

	this.SectionsInfo.Document_Get_AllFontNames(AllFonts);
	this.Numbering.GetAllFontNames(AllFonts);
	this.Styles.Document_Get_AllFontNames(AllFonts);
	this.theme.Document_Get_AllFontNames(AllFonts);

	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		this.Content[nIndex].GetAllFontNames(AllFonts);
	}
	AscFormat.checkThemeFonts(AllFonts, this.theme.themeElements.fontScheme);
	return AllFonts;
};
CDocument.prototype.Document_UpdateInterfaceState = function(bSaveCurRevisionChange)
{
	this.UpdateInterface(bSaveCurRevisionChange);
};
CDocument.prototype.private_UpdateInterface = function(bSaveCurRevisionChange)
{
	if (true === this.TurnOffInterfaceEvents)
		return;

	if (true === AscCommon.CollaborativeEditing.Get_GlobalLockSelection())
		return;

	// Удаляем весь список
	this.Api.sync_BeginCatchSelectedElements();

	this.TrackRevisionsManager.BeginCollectChanges(bSaveCurRevisionChange);

	// Уберем из интерфейса записи о том где мы находимся (параграф, таблица, картинка или колонтитул)
	this.Api.ClearPropObjCallback();

	this.Controller.UpdateInterfaceState();
	this.TrackRevisionsManager.EndCollectChanges(this.Api);

	// Сообщаем, что список составлен
	this.Api.sync_EndCatchSelectedElements();

	this.Document_UpdateUndoRedoState();
	this.Document_UpdateCanAddHyperlinkState();
	this.Document_UpdateSectionPr();
	this.Document_UpdateStylesPanel();
};
CDocument.prototype.private_UpdateRulers = function()
{
	if (true === this.TurnOffInterfaceEvents)
		return;

	if (true === AscCommon.CollaborativeEditing.Get_GlobalLockSelection())
		return;

	this.DrawingDocument.Set_RulerState_Start();
	this.Controller.UpdateRulersState();
	this.DrawingDocument.Set_RulerState_End();
};
CDocument.prototype.Document_UpdateRulersState = function()
{
	this.UpdateRulers();
};
CDocument.prototype.Document_UpdateRulersStateBySection = function(nPos)
{
	// В данной функции мы уже точно знаем, что нам секцию нужно выбирать исходя из текущего параграфа
	var nCurPos = undefined === nPos ? ( this.Selection.Use === true ? this.Selection.EndPos : this.CurPos.ContentPos ) : nPos;

	var oSectPr = this.SectionsInfo.Get_SectPr(nCurPos).SectPr;
	if (oSectPr.GetColumnsCount() > 1)
	{
		this.ColumnsMarkup.UpdateFromSectPr(oSectPr, this.CurPage);

		var oElement = this.Content[nCurPos];
		if (oElement.IsParagraph())
			this.ColumnsMarkup.SetCurCol(oElement.Get_CurrentColumn());

		this.DrawingDocument.Set_RulerState_Columns(this.ColumnsMarkup);
	}
	else
	{
		var oFrame = oSectPr.GetContentFrame(this.CurPage);
		this.DrawingDocument.Set_RulerState_Paragraph({L : oFrame.Left, T : oFrame.Top, R : oFrame.Right, B : oFrame.Bottom}, true);
	}
};
CDocument.prototype.Document_UpdateSelectionState = function()
{
	this.UpdateSelection();
};
CDocument.prototype.private_UpdateSelection = function()
{
	if (true === this.TurnOffInterfaceEvents)
		return;

	if (true === AscCommon.CollaborativeEditing.Get_GlobalLockSelection())
		return;

	this.DrawingDocument.UpdateTargetTransform(null);

	// TODO: Надо подумать как это вынести в верхнюю функцию внутренние реализации типа controller_UpdateSelectionState
	//       потому что они все очень похожие.

	this.Controller.UpdateSelectionState();

	this.UpdateDocumentOutlinePosition();

	// Обновим состояние кнопок Copy/Cut
	this.Document_UpdateCopyCutState();
};
CDocument.prototype.UpdateDocumentOutlinePosition = function()
{
	if (this.DocumentOutline.IsUse())
	{
		if (this.Controller !== this.LogicDocumentController)
		{
			this.DocumentOutline.UpdateCurrentPosition(null);
		}
		else
		{
			var oCurrentParagraph = this.GetCurrentParagraph(false, false);
			this.DocumentOutline.UpdateCurrentPosition(oCurrentParagraph.GetDocumentPositionFromObject());
		}
	}
};
CDocument.prototype.private_UpdateDocumentTracks = function()
{
	if (true === this.TurnOffInterfaceEvents)
		return;

	if (true === AscCommon.CollaborativeEditing.Get_GlobalLockSelection())
		return;

	this.private_UpdateTracks(this.IsSelectionUse(), this.IsSelectionEmpty());
};
CDocument.prototype.private_UpdateTracks = function(bSelection, bEmptySelection)
{
	var Pos = (true === this.Selection.Use && selectionflag_Numbering !== this.Selection.Flag ? this.Selection.EndPos : this.CurPos.ContentPos);
	if (docpostype_Content === this.GetDocPosType() && !(Pos >= 0 && (null === this.FullRecalc.Id || this.FullRecalc.StartIndex > Pos)))
	{
		this.NeedUpdateTracksOnRecalc = true;

		this.NeedUpdateTracksParams.Selection      = bSelection;
		this.NeedUpdateTracksParams.EmptySelection = bEmptySelection;

		return;
	}

	this.NeedUpdateTracksOnRecalc = false;

	var oSelectedInfo = this.GetSelectedElementsInfo();

	var Math = oSelectedInfo.Get_Math();
	if (null !== Math)
		this.DrawingDocument.Update_MathTrack(true, (false === bSelection || true === bEmptySelection ? true : false), Math);
	else
		this.DrawingDocument.Update_MathTrack(false);

	var oBlockLevelSdt  = oSelectedInfo.GetBlockLevelSdt();
	var oInlineLevelSdt = oSelectedInfo.GetInlineLevelSdt();

	if (oInlineLevelSdt)
		oInlineLevelSdt.DrawContentControlsTrack(false);
	else if (oBlockLevelSdt)
		oBlockLevelSdt.DrawContentControlsTrack(false);
	else
		this.DrawingDocument.OnDrawContentControl(null, AscCommon.ContentControlTrack.In);

	var oField = oSelectedInfo.Get_Field();
	if (null !== oField && (fieldtype_MERGEFIELD !== oField.Get_FieldType() || true !== this.MailMergeFieldsHighlight))
	{
		var aBounds = oField.Get_Bounds();
		this.DrawingDocument.Update_FieldTrack(true, aBounds);
	}
	else
	{
		this.DrawingDocument.Update_FieldTrack(false);

		var arrComplexFields = oSelectedInfo.GetComplexFields();
		if ((arrComplexFields.length > 0 && this.FieldsManager.SetCurrentComplexField(arrComplexFields[arrComplexFields.length - 1]))
			|| (arrComplexFields.length <= 0 && this.FieldsManager.SetCurrentComplexField(null)))
		{
			this.DrawingDocument.ClearCachePages();
			this.DrawingDocument.FirePaint();
		}
	}
};
CDocument.prototype.Document_UpdateUndoRedoState = function()
{
	this.UpdateUndoRedo();
};
CDocument.prototype.private_UpdateUndoRedo = function()
{
	if (true === this.TurnOffInterfaceEvents)
		return;

	if (true === AscCommon.CollaborativeEditing.Get_GlobalLockSelection())
		return;

	// TODO: Возможно стоит перенсти эту проверку в класс CHistory и присылать
	//       данные события при изменении значения History.Index

	// Проверяем состояние Undo/Redo

	if (this.IsViewModeInReview())
	{
		this.Api.sync_CanUndoCallback(false);
		this.Api.sync_CanRedoCallback(false);
	}
	else
	{
		var bCanUndo = this.History.Can_Undo();
		if (true !== bCanUndo && this.Api && this.CollaborativeEditing && true === this.CollaborativeEditing.Is_Fast() && true !== this.CollaborativeEditing.Is_SingleUser())
			bCanUndo = this.CollaborativeEditing.CanUndo();

		this.Api.sync_CanUndoCallback(bCanUndo);
		this.Api.sync_CanRedoCallback(this.History.Can_Redo());
		this.Api.CheckChangedDocument();
	}
};
CDocument.prototype.Document_UpdateCopyCutState = function()
{
	if (true === this.TurnOffInterfaceEvents)
		return;

	if (true === AscCommon.CollaborativeEditing.Get_GlobalLockSelection())
		return;

	// Во время работы селекта не обновляем состояние
	if (true === this.Selection.Start)
		return;

	this.Api.sync_CanCopyCutCallback(this.Can_CopyCut());
};
CDocument.prototype.Document_UpdateCanAddHyperlinkState = function()
{
	if (true === this.TurnOffInterfaceEvents)
		return;

	if (true === AscCommon.CollaborativeEditing.Get_GlobalLockSelection())
		return;

	// Проверяем можно ли добавить гиперссылку
	this.Api.sync_CanAddHyperlinkCallback(this.CanAddHyperlink(false));
};
CDocument.prototype.Document_UpdateSectionPr = function()
{
	if (true === this.TurnOffInterfaceEvents)
		return;

	if (true === this.CollaborativeEditing.Get_GlobalLockSelection())
		return;

	// Обновляем ориентацию страницы
	this.Api.sync_PageOrientCallback(this.Get_DocumentOrientation());

	// Обновляем размер страницы
	var PageSize = this.Get_DocumentPageSize();
	this.Api.sync_DocSizeCallback(PageSize.W, PageSize.H);

	// Обновляем настройки колонок
	var CurPos = this.CurPos.ContentPos;
	var SectPr = this.SectionsInfo.Get_SectPr(CurPos).SectPr;

	if (SectPr)
	{
		var ColumnsPr = new CDocumentColumnsProps();
		ColumnsPr.From_SectPr(SectPr);
		this.Api.sync_ColumnsPropsCallback(ColumnsPr);
		this.Api.sync_SectionPropsCallback(new CDocumentSectionProps(SectPr, this));
	}
};
CDocument.prototype.Get_ColumnsProps = function()
{
	// Обновляем настройки колонок
	var CurPos = this.CurPos.ContentPos;
	var SectPr = this.SectionsInfo.Get_SectPr(CurPos).SectPr;

	var ColumnsPr = new CDocumentColumnsProps();
	if (SectPr)
	{
		ColumnsPr.From_SectPr(SectPr);
	}

	return ColumnsPr;
};


CDocument.prototype.GetWatermarkProps = function()
{
    var SectionPageInfo = this.Get_SectionPageNumInfo(this.CurPage);
    var bFirst = SectionPageInfo.bFirst;
    var bEven  = SectionPageInfo.bEven;
    var HdrFtr = this.Get_SectionHdrFtr(this.CurPage, false, false);
    var Header = HdrFtr.Header;
    var oProps;
    if (null === Header)
    {
        oProps = new Asc.CAscWatermarkProperties();
        oProps.put_Type(Asc.c_oAscWatermarkType.None);
        oProps.put_Api(this.Api);
        return oProps;
    }
    var oWatermark = Header.FindWatermark();
    if(oWatermark)
    {
        oProps = oWatermark.GetWatermarkProps();
        oProps.put_Api(this.Api);
        return oProps;
    }
    oProps = new Asc.CAscWatermarkProperties();
    oProps.put_Type(Asc.c_oAscWatermarkType.None);
    oProps.put_Api(this.Api);
    return oProps;
};

CDocument.prototype.SetWatermarkProps = function(oProps)
{
    this.StartAction(AscDFH.historydescription_Document_AddWatermark);
    var SectionPageInfo = this.Get_SectionPageNumInfo(this.CurPage);
    var bFirst = SectionPageInfo.bFirst;
    var bEven  = SectionPageInfo.bEven;
    var HdrFtr = this.Get_SectionHdrFtr(this.CurPage, bFirst, bEven);
    var Header = HdrFtr.Header;
    if(null === Header)
    {
        if(Asc.c_oAscWatermarkType.None === oProps.get_Type())
        {
            this.FinalizeAction(true);
            return;
        }
        Header = this.Create_SectionHdrFtr(hdrftr_Header, this.CurPage);
    }
    var oWatermark = Header.FindWatermark();
    if(oWatermark)
    {
        if(oWatermark.GraphicObj.selected)
        {
            this.RemoveSelection(true);
        }
        oWatermark.Remove_FromDocument(false);
    }
    oWatermark = this.DrawingObjects.createWatermark(oProps);
    if(oWatermark)
    {
        var oDocState = this.Get_SelectionState2();
        var oContent = Header.Content;
        oContent.MoveCursorToEndPos(false);
        var oSdt = null, oElement;
        for(var i = 0; i < oContent.Content.length; ++i)
        {
            oElement = oContent.Content[i];
            if(oElement.GetType && oElement.GetType() === AscCommonWord.type_BlockLevelSdt)
            {
                oSdt = oElement;
                break;
            }
        }
        if(!oSdt)
        {
            oSdt = oContent.AddContentControl(Asc.c_oAscSdtLevelType.Block);
        }
        oSdt.SetDocPartObj(undefined, "Watermarks", true);
        oSdt.AddToParagraph(oWatermark);
        this.Set_SelectionState2(oDocState);
    }
    this.Recalculate();
    this.Document_UpdateInterfaceState();
    this.Document_UpdateSelectionState();
    this.Document_UpdateRulersState();
    this.FinalizeAction(true);
};

/**
 * Отключаем отсылку сообщений в интерфейс.
 */
CDocument.prototype.TurnOff_InterfaceEvents = function()
{
	this.TurnOffInterfaceEvents = true;
};
/**
 * Включаем отсылку сообщений в интерфейс.
 *
 * @param {bool} bUpdate Обновлять ли интерфейс
 */
CDocument.prototype.TurnOn_InterfaceEvents = function(bUpdate)
{
	this.TurnOffInterfaceEvents = false;

	if (true === bUpdate)
	{
		this.Document_UpdateInterfaceState();
		this.Document_UpdateSelectionState();
		this.Document_UpdateRulersState();
	}
};
CDocument.prototype.TurnOff_RecalculateCurPos = function()
{
	this.TurnOffRecalcCurPos = true;
};
CDocument.prototype.TurnOn_RecalculateCurPos = function(bUpdate)
{
	this.TurnOffRecalcCurPos = false;

	if (true === bUpdate)
		this.Document_UpdateSelectionState();
};
CDocument.prototype.Can_CopyCut = function()
{
	var bCanCopyCut = false;

	var LogicDocument  = null;
	var DrawingObjects = null;

	var nDocPosType = this.GetDocPosType();
	if (docpostype_HdrFtr === nDocPosType)
	{
		var CurHdrFtr = this.HdrFtr.CurHdrFtr;
		if (null !== CurHdrFtr)
		{
			if (docpostype_DrawingObjects === CurHdrFtr.Content.GetDocPosType())
				DrawingObjects = this.DrawingObjects;
			else
				LogicDocument = CurHdrFtr.Content;
		}
	}
	else if (docpostype_DrawingObjects === nDocPosType)
	{
		DrawingObjects = this.DrawingObjects;
	}
	else if (docpostype_Footnotes === nDocPosType)
	{
		if (0 === this.Footnotes.Selection.Direction)
		{
			var oFootnote = this.Footnotes.GetCurFootnote();
			if (oFootnote)
			{
				if (docpostype_DrawingObjects === oFootnote.GetDocPosType())
				{
					DrawingObjects = this.DrawingObjects;
				}
				else
				{
					LogicDocument = oFootnote;
				}
			}
		}
		else
		{
			return true;
		}
	}
	else //if (docpostype_Content === nDocPosType)
	{
		LogicDocument = this;
	}

	if (null !== DrawingObjects)
	{
		if (true === DrawingObjects.isSelectedText())
			LogicDocument = DrawingObjects.getTargetDocContent();
		else
			bCanCopyCut = true;
	}

	if (null !== LogicDocument)
	{
		if (true === LogicDocument.IsSelectionUse() && true !== LogicDocument.IsSelectionEmpty(true))
		{
			if (selectionflag_Numbering === LogicDocument.Selection.Flag)
				bCanCopyCut = false;
			else if (LogicDocument.Selection.StartPos !== LogicDocument.Selection.EndPos)
				bCanCopyCut = true;
			else
				bCanCopyCut = LogicDocument.Content[LogicDocument.Selection.StartPos].Can_CopyCut();
		}
	}

	return bCanCopyCut;
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с номерами страниц
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.Get_StartPage_Absolute = function()
{
	return 0;
};
CDocument.prototype.Get_StartPage_Relative = function()
{
	return 0;
};
CDocument.prototype.Get_AbsolutePage = function(CurPage)
{
	return CurPage;
};
CDocument.prototype.Set_CurPage = function(PageNum)
{
	this.CurPage = Math.min(this.Pages.length - 1, Math.max(0, PageNum));
};
CDocument.prototype.Get_CurPage = function()
{
	// Работаем с колонтитулом
	if (docpostype_HdrFtr === this.GetDocPosType())
		return this.HdrFtr.Get_CurPage();

	return this.CurPage;
};
//----------------------------------------------------------------------------------------------------------------------
// Undo/Redo функции
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.Create_NewHistoryPoint = function(nDescription, oSelectionState)
{
	this.History.Create_NewPoint(nDescription, oSelectionState);
};
CDocument.prototype.Document_Undo = function(Options)
{
	// Проверка !this.IsViewModeInReview() нужна, чтобы во вьювере было переключение режима просмотра рецензирования
	if (true === AscCommon.CollaborativeEditing.Get_GlobalLock() && true !== this.IsFillingFormMode() && !this.IsViewModeInReview())
		return;

	// Нужно сбрасывать, т.к. после Undo/Redo данные списки у нас будут в глобальной таблице, но не такие, какие нужны
	this.SetLastNumberedList(null);
	this.SetLastBulletList(null);

	if (true !== this.History.Can_Undo() && this.Api && this.CollaborativeEditing && true === this.CollaborativeEditing.Is_Fast() && true !== this.CollaborativeEditing.Is_SingleUser())
	{
		if (this.CollaborativeEditing.CanUndo() && true === this.Api.canSave)
		{
			this.CollaborativeEditing.Set_GlobalLock(true);
			this.Api.forceSaveUndoRequest = true;
		}
	}
	else
	{
		if (this.History.Can_Undo())
		{
			this.DrawingDocument.EndTrackTable(null, true);
			this.DrawingObjects.TurnOffCheckChartSelection();
			this.BookmarksManager.SetNeedUpdate(true);

			this.History.Undo(Options);
			this.DocumentOutline.UpdateAll(); // TODO: надо бы подумать как переделать на более легкий пересчет
			this.DrawingObjects.TurnOnCheckChartSelection();
			this.RecalculateWithParams(this.History.RecalculateData);

			this.Document_UpdateSelectionState();
			this.Document_UpdateInterfaceState();
			this.Document_UpdateRulersState();
		}
	}
};
CDocument.prototype.Document_Redo = function()
{
	if (true === AscCommon.CollaborativeEditing.Get_GlobalLock() && true !== this.IsFillingFormMode())
		return;

	// Нужно сбрасывать, т.к. после Undo/Redo данные списки у нас будут в глобальной таблице, но не такие, какие нужны
	this.SetLastNumberedList(null);
	this.SetLastBulletList(null);

	if (this.History.Can_Redo())
	{
		this.DrawingDocument.EndTrackTable(null, true);
		this.DrawingObjects.TurnOffCheckChartSelection();
		this.BookmarksManager.SetNeedUpdate(true);

		this.History.Redo();
		this.DocumentOutline.UpdateAll(); // TODO: надо бы подумать как переделать на более легкий пересчет
		this.DrawingObjects.TurnOnCheckChartSelection();
		this.RecalculateWithParams(this.History.RecalculateData);

		this.Document_UpdateSelectionState();
		this.Document_UpdateInterfaceState();
		this.Document_UpdateRulersState();
	}
};
CDocument.prototype.GetSelectionState = function()
{
	var DocState    = {};
	DocState.CurPos = {
		X          : this.CurPos.X,
		Y          : this.CurPos.Y,
		ContentPos : this.CurPos.ContentPos,
		RealX      : this.CurPos.RealX,
		RealY      : this.CurPos.RealY,
		Type       : this.CurPos.Type
	};

	DocState.Selection = {

		Start    : false,
		Use      : this.Selection.Use,
		StartPos : this.Selection.StartPos,
		EndPos   : this.Selection.EndPos,
		Flag     : this.Selection.Flag,
		Data     : this.Selection.Data
	};

	DocState.CurPage    = this.CurPage;
	DocState.CurComment = this.Comments.Get_CurrentId();

	var State = null;
	if (true === editor.isStartAddShape && docpostype_DrawingObjects === this.GetDocPosType())
	{
		DocState.CurPos.Type     = docpostype_Content;
		DocState.Selection.Start = false;
		DocState.Selection.Use   = false;

		this.Content[DocState.CurPos.ContentPos].RemoveSelection();
		State = this.Content[this.CurPos.ContentPos].GetSelectionState();
	}
	else
	{
		State = this.Controller.GetSelectionState();
	}

	if (null != this.Selection.Data && true === this.Selection.Data.TableBorder)
	{
		DocState.Selection.Data = null;
	}

	State.push(DocState);

	return State;
};
CDocument.prototype.SetSelectionState = function(State)
{
	this.RemoveSelection();

	if (docpostype_DrawingObjects === this.GetDocPosType())
		this.DrawingObjects.resetSelection();

	if (State.length <= 0)
		return;

	var DocState = State[State.length - 1];

	this.CurPos.X          = DocState.CurPos.X;
	this.CurPos.Y          = DocState.CurPos.Y;
	this.CurPos.ContentPos = DocState.CurPos.ContentPos;
	this.CurPos.RealX      = DocState.CurPos.RealX;
	this.CurPos.RealY      = DocState.CurPos.RealY;
	this.SetDocPosType(DocState.CurPos.Type);

	this.Selection.Start    = false;
	this.Selection.Use      = DocState.Selection.Use;
	this.Selection.StartPos = DocState.Selection.StartPos;
	this.Selection.EndPos   = DocState.Selection.EndPos;
	this.Selection.Flag     = DocState.Selection.Flag;
	this.Selection.Data     = DocState.Selection.Data;

	this.Selection.DragDrop.Flag = 0;
	this.Selection.DragDrop.Data = null;

	this.CurPage = DocState.CurPage;
	this.Comments.Set_Current(DocState.CurComment);

	this.Controller.SetSelectionState(State, State.length - 2);
};
CDocument.prototype.Get_ParentObject_or_DocumentPos = function(Index)
{
	return {Type : AscDFH.historyitem_recalctype_Inline, Data : Index};
};
CDocument.prototype.Refresh_RecalcData = function(Data)
{
	var ChangePos = -1;
	var Type      = Data.Type;

	switch (Type)
	{
		case AscDFH.historyitem_Document_AddItem:
		case AscDFH.historyitem_Document_RemoveItem:
		{
			ChangePos = Data.Pos;
			break;
		}

		case AscDFH.historyitem_Document_DefaultTab:
		case AscDFH.historyitem_Document_EvenAndOddHeaders:
		case AscDFH.historyitem_Document_MathSettings:
		case AscDFH.historyitem_Document_Settings_GutterAtTop:
		case AscDFH.historyitem_Document_Settings_MirrorMargins:
		{
			ChangePos = 0;
			break;
		}
	}

	if (-1 != ChangePos)
	{
		this.History.RecalcData_Add({
			Type : AscDFH.historyitem_recalctype_Inline,
			Data : {Pos : ChangePos, PageNum : 0}
		});
	}
};
CDocument.prototype.Refresh_RecalcData2 = function(nIndex, nPageRel)
{
	if (-1 === nIndex)
		return;

	this.History.RecalcData_Add({
		Type : AscDFH.historyitem_recalctype_Inline,
		Data : {
			Pos     : nIndex,
			PageNum : nPageRel
		}
	});
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с гиперссылками
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.AddHyperlink = function(HyperProps)
{
	// Проверку, возможно ли добавить гиперссылку, должны были вызвать до этой функции
	if (null != HyperProps.Text && "" != HyperProps.Text && true === this.IsSelectionUse())
	{
		// Корректировка в данном случае пройдет при добавлении гиперссылки.
		var SelectionInfo = this.GetSelectedElementsInfo();
		var Para          = SelectionInfo.GetParagraph();
		if (null !== Para)
			HyperProps.TextPr = Para.Get_TextPr(Para.Get_ParaContentPos(true, true));

		this.Remove(1, false, false, true);
		this.RemoveTextSelection();
	}

	this.Controller.AddHyperlink(HyperProps);
	this.Recalculate();
	this.Document_UpdateInterfaceState();
	this.Document_UpdateSelectionState();
};
CDocument.prototype.ModifyHyperlink = function(oHyperProps)
{
	var sText    = oHyperProps.get_Text(),
		sValue   = oHyperProps.get_Value(),
		sToolTip = oHyperProps.get_ToolTip(),
		sAnchor  = oHyperProps.get_Bookmark();

	var oClass = oHyperProps.get_InternalHyperlink();
	if (oClass instanceof ParaHyperlink)
	{
		var oHyperlink = oClass;

		if (undefined !== sAnchor && null !== sAnchor && "" !== sAnchor)
		{
			oHyperlink.SetAnchor(sAnchor);
			oHyperlink.SetValue("");
		}
		else if (undefined !== sValue && null !== sValue)
		{
			oHyperlink.SetValue(sValue);
			oHyperlink.SetAnchor("");
		}

		if (undefined !== sToolTip && null !== sToolTip)
			oHyperlink.SetToolTip(sToolTip);

		if (null !== sText)
		{
			var oHyperRun = new ParaRun(oHyperlink.GetParagraph());
			oHyperRun.Set_Pr(oHyperlink.GetTextPr().Copy());
			oHyperRun.Set_Color(undefined);
			oHyperRun.Set_Underline(undefined);
			oHyperRun.Set_RStyle(this.GetStyles().GetDefaultHyperlink());
			oHyperRun.AddText(sText);

			oHyperlink.RemoveSelection();
			oHyperlink.RemoveAll();
			oHyperlink.AddToContent(0, oHyperRun, false);

			this.RemoveSelection();
			oHyperlink.MoveCursorOutsideElement(false);
		}
	}
	else if (oClass instanceof CFieldInstructionHYPERLINK)
	{
		var oInstruction = oClass;
		var oComplexField = oInstruction.GetComplexField();
		if (!oComplexField || oComplexField)
		{
			if (undefined !== sAnchor && null !== sAnchor && "" !== sAnchor)
			{
				oInstruction.SetBookmarkName(sAnchor);
				oInstruction.SetLink("");
			}
			else if (undefined !== sValue && null !== sValue)
			{
				oInstruction.SetLink(sValue);
				oInstruction.SetBookmarkName("");
			}

			if (undefined !== sToolTip && null !== sToolTip)
				oInstruction.SetToolTip(sToolTip);

			oComplexField.SelectFieldCode();
			var sInstruction = oInstruction.ToString();
			for (var oIterator = sInstruction.getUnicodeIterator(); oIterator.check(); oIterator.next())
			{
				this.AddToParagraph(new ParaInstrText(oIterator.value()));
			}

			if (null !== sText)
			{
				oComplexField.SelectFieldValue();
				var oTextPr = this.GetDirectTextPr();
				this.AddText(sText);
				oComplexField.SelectFieldValue();
				this.AddToParagraph(new ParaTextPr(oTextPr));
			}
			oComplexField.MoveCursorOutsideElement(false);
		}
	}
	else
	{
		return;
	}

	this.Recalculate();
    this.Document_UpdateSelectionState();
    this.Document_UpdateInterfaceState();
};
CDocument.prototype.RemoveHyperlink = function(oHyperProps)
{
	var oClass = oHyperProps.get_InternalHyperlink();
	if (oClass instanceof ParaHyperlink)
	{
		var oHyperlink = oClass;

		var oParent      = oHyperlink.GetParent();
		var nPosInParent = oHyperlink.GetPosInParent(oParent);

		if (!oParent)
			return;

		oParent.RemoveFromContent(nPosInParent, 1);

		var oTextPr       = new CTextPr();
		oTextPr.RStyle    = null;
		oTextPr.Underline = null;
		oTextPr.Color     = null;
		oTextPr.Unifill   = null;

		var oElement = null;
		for (var nPos = 0, nCount = oHyperlink.GetElementsCount(); nPos < nCount; ++nPos)
		{
			oElement = oHyperlink.GetElement(nPos);
			oParent.AddToContent(nPosInParent + nPos, oElement);
			oElement.ApplyTextPr(oTextPr, undefined, true);
		}

		this.RemoveSelection();
		if (oElement)
		{
			oElement.SetThisElementCurrent();
			oElement.MoveCursorToEndPos();
		}
	}
	else if (oClass instanceof CFieldInstructionHYPERLINK)
	{
		var oInstruction = oClass;
		var oComplexField = oInstruction.GetComplexField();
		if (!oComplexField || oComplexField)
		{
			var oTextPr       = new CTextPr();
			oTextPr.RStyle    = null;
			oTextPr.Underline = null;
			oTextPr.Color     = null;
			oTextPr.Unifill   = null;

			oComplexField.SelectFieldValue();
			this.AddToParagraph(new ParaTextPr(oTextPr));

			oComplexField.RemoveFieldWrap();
		}
	}
	else
	{
		return;
	}

	//this.Controller.RemoveHyperlink();
	this.Recalculate();
	this.Document_UpdateSelectionState();
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.CanAddHyperlink = function(bCheckInHyperlink)
{
	return this.Controller.CanAddHyperlink(bCheckInHyperlink);
};
/**
 * Проверяем, находимся ли мы в гиперссылке сейчас.
 * @param bCheckEnd
 * @returns {*}
 */
CDocument.prototype.IsCursorInHyperlink = function(bCheckEnd)
{
	if (undefined === bCheckEnd)
		bCheckEnd = true;

	return this.Controller.IsCursorInHyperlink(bCheckEnd);
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с совместным редактирования
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.Document_Is_SelectionLocked = function(CheckType, AdditionalData, DontLockInFastMode, isIgnoreCanEditFlag)
{
	if (!this.CanEdit() && true !== isIgnoreCanEditFlag)
		return true;

	if (true === this.CollaborativeEditing.Get_GlobalLock())
		return true;

	this.CollaborativeEditing.OnStart_CheckLock();

	this.private_DocumentIsSelectionLocked(CheckType);

	if (AdditionalData)
	{
		if (undefined !== AdditionalData.length)
		{
			for (var nIndex = 0, nCount = AdditionalData.length; nIndex < nCount; ++nIndex)
			{
				this.private_IsSelectionLockedAdditional(AdditionalData[nIndex]);
			}
		}
		else
		{
			this.private_IsSelectionLockedAdditional(AdditionalData);
		}
	}

	var bResult = this.CollaborativeEditing.OnEnd_CheckLock(DontLockInFastMode);

	if (true === bResult)
	{
		this.Document_UpdateSelectionState();
		this.Document_UpdateInterfaceState();
		//this.Document_UpdateRulersState();
	}

	return bResult;
};
CDocument.prototype.private_IsSelectionLockedAdditional = function(oAdditionalData)
{
	if (oAdditionalData)
	{
		if (AscCommon.changestype_2_InlineObjectMove === oAdditionalData.Type)
		{
			var PageNum = oAdditionalData.PageNum;
			var X       = oAdditionalData.X;
			var Y       = oAdditionalData.Y;

			var NearestPara = this.Get_NearestPos(PageNum, X, Y).Paragraph;
			NearestPara.Document_Is_SelectionLocked(AscCommon.changestype_Document_Content);
		}
		else if (AscCommon.changestype_2_HdrFtr === oAdditionalData.Type)
		{
			this.HdrFtr.Document_Is_SelectionLocked(AscCommon.changestype_HdrFtr);
		}
		else if (AscCommon.changestype_2_Comment === oAdditionalData.Type)
		{
			this.Comments.Document_Is_SelectionLocked(oAdditionalData.Id);
		}
		else if (AscCommon.changestype_2_Element_and_Type === oAdditionalData.Type)
		{
			oAdditionalData.Element.Document_Is_SelectionLocked(oAdditionalData.CheckType, false);
		}
		else if (AscCommon.changestype_2_ElementsArray_and_Type === oAdditionalData.Type)
		{
			var Count = oAdditionalData.Elements.length;
			for (var Index = 0; Index < Count; Index++)
			{
				oAdditionalData.Elements[Index].Document_Is_SelectionLocked(oAdditionalData.CheckType, false);
			}
		}
		else if (AscCommon.changestype_2_Element_and_Type_Array === oAdditionalData.Type)
		{
			var nCount = Math.min(oAdditionalData.Elements.length, oAdditionalData.CheckTypes.length);
			for (var nIndex = 0; nIndex < nCount; ++nIndex)
			{
				oAdditionalData.Elements[nIndex].Document_Is_SelectionLocked(oAdditionalData.CheckTypes[nIndex], false);
			}
		}
		else if (AscCommon.changestype_2_AdditionalTypes === oAdditionalData.Type)
		{
			var Count = oAdditionalData.Types.length;
			for (var Index = 0; Index < Count; ++Index)
			{
				this.private_DocumentIsSelectionLocked(oAdditionalData.Types[Index]);
			}
		}
	}
};
CDocument.prototype.IsSelectionLocked = function(nCheckType, oAdditionalData, isDontLockInFastMode, isIgnoreCanEditFlag)
{
	return this.Document_Is_SelectionLocked(nCheckType, oAdditionalData, isDontLockInFastMode, isIgnoreCanEditFlag);
};
/**
 * Начинаем составную проверку на залоченность объектов
 * @param [isIgnoreCanEditFlag=false] игнорируем ли запрет на редактирование
 * @returns {boolean} началась ли проверка залоченности
 */
CDocument.prototype.StartSelectionLockCheck = function(isIgnoreCanEditFlag)
{
	if (!this.CanEdit() && true !== isIgnoreCanEditFlag)
		return false;

	if (true === this.CollaborativeEditing.Get_GlobalLock())
		return false;

	this.CollaborativeEditing.OnStart_CheckLock();

	return true;
};
/**
 * Производим шаг проверки залоченности с заданными типом
 * @param nCheckType {number} тип проверки
 * @param isClearOnLock {boolean} очищать ли общий массив локов от последней проверки, в случае залоченности
 * @returns {boolean} залочен ли редактор на выполнение данного шага
 */
CDocument.prototype.ProcessSelectionLockCheck = function(nCheckType, isClearOnLock)
{
	if (isClearOnLock)
		this.CollaborativeEditing.OnStartCheckLockInstance();

	this.private_DocumentIsSelectionLocked(nCheckType);

	if (isClearOnLock)
		return this.CollaborativeEditing.OnEndCheckLockInstance();

	return false;
};
/**
 * Заканчиваем процесс составной проверки залоченности объектов
 * @param [isDontLockInFastMode=false] {boolean} нужно ли лочить в быстром режиме совместного редактирования
 * @returns {boolean} залочен ли редактор на выполнение данного составного действия
 */
CDocument.prototype.EndSelectionLockCheck = function(isDontLockInFastMode)
{
	var isLocked = this.CollaborativeEditing.OnEnd_CheckLock(isDontLockInFastMode);
	if (isLocked)
	{
		this.Document_UpdateSelectionState();
		this.Document_UpdateInterfaceState();
	}

	return isLocked;
};
CDocument.prototype.private_DocumentIsSelectionLocked = function(CheckType)
{
	if (AscCommon.changestype_None != CheckType)
	{
		if (AscCommon.changestype_Document_SectPr === CheckType)
		{
			this.Lock.Check(this.Get_Id());
		}
		else if (AscCommon.changestype_Document_Styles === CheckType)
		{
			this.Styles.Lock.Check(this.Styles.Get_Id());
		}
		else if (AscCommon.changestype_ColorScheme === CheckType)
		{
			this.DrawingObjects.Lock.Check(this.DrawingObjects.Get_Id());
		}
		else if(AscCommon.changestype_CorePr === CheckType)
		{
			if(this.Core)
			{
				this.Core.Lock.Check(this.Core.Get_Id());
			}
		}
		else
		{
			this.Controller.IsSelectionLocked(CheckType);
		}
	}
};
CDocument.prototype.controller_IsSelectionLocked = function(CheckType)
{
	switch (this.Selection.Flag)
	{
		case selectionflag_Common :
		{
			if (true === this.Selection.Use)
			{
				var StartPos = ( this.Selection.StartPos > this.Selection.EndPos ? this.Selection.EndPos : this.Selection.StartPos );
				var EndPos   = ( this.Selection.StartPos > this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos );

				if (StartPos != EndPos && AscCommon.changestype_Delete === CheckType)
					CheckType = AscCommon.changestype_Remove;

				for (var Index = StartPos; Index <= EndPos; Index++)
					this.Content[Index].Document_Is_SelectionLocked(CheckType);
			}
			else
			{
				var CurElement = this.Content[this.CurPos.ContentPos];

				if (AscCommon.changestype_Document_Content_Add === CheckType && type_Paragraph === CurElement.GetType() && true === CurElement.IsCursorAtEnd())
					AscCommon.CollaborativeEditing.Add_CheckLock(false);
				else
					this.Content[this.CurPos.ContentPos].Document_Is_SelectionLocked(CheckType);
			}

			break;
		}
		case selectionflag_Numbering:
		{
			var oNumPr = this.Selection.Data.CurPara.GetNumPr();
			if (oNumPr)
			{
				var oNum = this.GetNumbering().GetNum(oNumPr.NumId);
				oNum.IsSelectionLocked(CheckType);
			}

			this.Content[this.CurPos.ContentPos].Document_Is_SelectionLocked(CheckType);

			break;
		}
	}
};
CDocument.prototype.Get_SelectionState2 = function()
{
	this.RemoveSelection();

	// Сохраняем Id ближайшего элемента в текущем классе
	var State       = new CDocumentSelectionState();
	var nDocPosType = this.GetDocPosType();
	if (docpostype_HdrFtr === nDocPosType)
	{
		State.Type = docpostype_HdrFtr;

		if (null != this.HdrFtr.CurHdrFtr)
			State.Id = this.HdrFtr.CurHdrFtr.Get_Id();
		else
			State.Id = null;
	}
	else if (docpostype_DrawingObjects === nDocPosType)
	{
		// TODO: запрашиваем параграф текущего выделенного элемента
		var X       = 0;
		var Y       = 0;
		var PageNum = this.CurPage;

		var ContentPos = this.Internal_GetContentPosByXY(X, Y, PageNum);

		State.Type = docpostype_Content;
		State.Id   = this.Content[ContentPos].GetId();
	}
	else if (docpostype_Footnotes === nDocPosType)
	{
		State.Type = docpostype_Footnotes;
		State.Id   = this.Footnotes.GetCurFootnote().Get_Id();
	}
	else // if (docpostype_Content === nDocPosType)
	{
		State.Id   = this.Get_Id();
		State.Type = docpostype_Content;

		var Element = this.Content[this.CurPos.ContentPos];
		State.Data  = Element.Get_SelectionState2();
	}

	return State;
};
CDocument.prototype.Set_SelectionState2 = function(State)
{
	this.RemoveSelection();

	var Id = State.Id;
	if (docpostype_HdrFtr === State.Type)
	{
		this.SetDocPosType(docpostype_HdrFtr);

		if (null === Id || true != this.HdrFtr.Set_CurHdrFtr_ById(Id))
		{
			this.SetDocPosType(docpostype_Content);
			this.CurPos.ContentPos = 0;

			this.Content[this.CurPos.ContentPos].MoveCursorToStartPos(false);
		}
	}
	else if (docpostype_Footnotes === State.Type)
	{
		this.SetDocPosType(docpostype_Footnotes);
		var oFootnote = g_oTableId.Get_ById(State.Id);
		if (oFootnote && true === this.Footnotes.Is_UseInDocument(State.Id))
		{
			this.Footnotes.private_SetCurrentFootnoteNoSelection(oFootnote);
			oFootnote.MoveCursorToStartPos(false);
		}
		else
		{
			this.EndFootnotesEditing();
		}
	}
	else // if ( docpostype_Content === State.Type )
	{
		var CurId = State.Data.Id;

		var bFlag = false;

		var Pos = 0;

		// Найдем элемент с Id = CurId
		var Count = this.Content.length;
		for (Pos = 0; Pos < Count; Pos++)
		{
			if (this.Content[Pos].GetId() == CurId)
			{
				bFlag = true;
				break;
			}
		}

		if (true !== bFlag)
		{
			var TempElement = g_oTableId.Get_ById(CurId);
			Pos             = ( null != TempElement ? TempElement.Index : 0 );
			Pos             = Math.max(0, Math.min(Pos, this.Content.length - 1));
		}

		this.Selection.Start    = false;
		this.Selection.Use      = false;
		this.Selection.StartPos = Pos;
		this.Selection.EndPos   = Pos;
		this.Selection.Flag     = selectionflag_Common;

		this.SetDocPosType(docpostype_Content);
		this.CurPos.ContentPos = Pos;

		if (true !== bFlag)
			this.Content[this.CurPos.ContentPos].MoveCursorToStartPos(false);
		else
			this.Content[this.CurPos.ContentPos].SetSelectionState2(State.Data);
	}
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с комментариями
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.AddComment = function(CommentData, isForceGlobal)
{
	if (true === isForceGlobal || true != this.CanAddComment())
	{
		CommentData.Set_QuoteText(null);
		var Comment = new AscCommon.CComment(this.Comments, CommentData);
		this.Comments.Add(Comment);

		// Обновляем информацию для Undo/Redo
		this.Document_UpdateInterfaceState();
	}
	else
	{
		// TODO: Как будет реализовано добавление комментариев к объекту, добавить проверку на выделение объекта

		var QuotedText = this.GetSelectedText(false);
		if (null === QuotedText || "" === QuotedText)
		{
			var oParagraph = this.GetCurrentParagraph();
			if (oParagraph && oParagraph.SelectCurrentWord())
			{
				QuotedText = this.GetSelectedText(false);
				if (null === QuotedText)
					QuotedText = "";
			}
			else
			{
				QuotedText = "";
			}
		}
		CommentData.Set_QuoteText(QuotedText);

		var Comment = new AscCommon.CComment(this.Comments, CommentData);
		this.Comments.Add(Comment);
		this.Controller.AddComment(Comment);

		// TODO: Продумать, как избавиться от пересчета
		this.Recalculate();
		this.Document_UpdateInterfaceState();
	}

	return Comment;
};
CDocument.prototype.EditComment = function(Id, CommentData)
{
	if (!this.Comments.IsUseSolved() && this.Comments.Get_CurrentId() === Id)
	{
		var oComment = this.Comments.Get_ById(Id);
		if (oComment && !oComment.IsSolved() && CommentData.IsSolved())
		{
			this.Comments.Set_Current(null);
			this.Api.sync_HideComment();
			this.DrawingDocument.ClearCachePages();
			this.DrawingDocument.FirePaint();
		}
	}

	this.Comments.Set_CommentData(Id, CommentData);
	this.Document_UpdateInterfaceState();
};
CDocument.prototype.RemoveComment = function(Id, bSendEvent, bRecalculate)
{
	if (null === Id)
		return;

	if (true === this.Comments.Remove_ById(Id))
	{
		if (true === bRecalculate)
		{
			// TODO: Продумать как избавиться от пересчета при удалении комментария
			this.Recalculate();
			this.Document_UpdateInterfaceState();
		}

		if (true === bSendEvent)
			this.Api.sync_RemoveComment(Id);
	}
};
CDocument.prototype.CanAddComment = function()
{
	if (!this.CanEdit() && !this.IsEditCommentsMode())
		return false;

	if (true !== this.Comments.Is_Use())
		return false;

	return this.Controller.CanAddComment();
};
CDocument.prototype.SelectComment = function(Id, ScrollToComment)
{
	var OldId = this.Comments.Get_CurrentId();
	this.Comments.Set_Current(Id);

	var Comment = this.Comments.Get_ById(Id);
	if (null != Comment)
	{
		var Comment_PageNum = Comment.m_oStartInfo.PageNum;
		var Comment_Y       = Comment.m_oStartInfo.Y;
		var Comment_X       = Comment.m_oStartInfo.X;

		if (true === ScrollToComment)
			this.DrawingDocument.m_oWordControl.ScrollToPosition(Comment_X, Comment_Y, Comment_PageNum);
	}

	if (OldId != Id)
	{
		this.DrawingDocument.ClearCachePages();
		this.DrawingDocument.FirePaint();
	}
};
CDocument.prototype.ShowComment = function(arrId)
{
	var CommentsX     = null;
	var CommentsY     = null;
	var arrCommentsId = [];

	for (var nIndex = 0, nCount = arrId.length; nIndex < nCount; ++nIndex)
	{
		var Comment = this.Comments.Get_ById(arrId[nIndex]);
		if (null != Comment && null != Comment.StartId && null != Comment.EndId)
		{
			if (null === CommentsX)
			{
				var Comment_PageNum = Comment.m_oStartInfo.PageNum;
				var Comment_Y       = Comment.m_oStartInfo.Y;
				var Comment_X       = this.Get_PageLimits(Comment_PageNum).XLimit;

				var Coords = this.DrawingDocument.ConvertCoordsToCursorWR(Comment_X, Comment_Y, Comment_PageNum);

				CommentsX = Coords.X;
				CommentsY = Coords.Y;
			}

			arrCommentsId.push(Comment.Get_Id());
		}

	}

	if (null !== CommentsX && null !== CommentsY && arrCommentsId.length > 0)
	{
		this.Api.sync_ShowComment(arrCommentsId, CommentsX, CommentsY);
	}
	else
	{
		this.Api.sync_HideComment();
	}
};
CDocument.prototype.ShowComments = function(isShowSolved)
{
	if (false !== isShowSolved)
		isShowSolved = true;

	this.Comments.Set_Use(true);
	this.Comments.SetUseSolved(isShowSolved);
	this.DrawingDocument.ClearCachePages();
	this.DrawingDocument.FirePaint();
};
CDocument.prototype.HideComments = function()
{
	this.Comments.Set_Use(false);
	this.Comments.SetUseSolved(false);
	this.Comments.Set_Current(null);
	this.DrawingDocument.ClearCachePages();
	this.DrawingDocument.FirePaint();
};
CDocument.prototype.GetPrevElementEndInfo = function(CurElement)
{
    var PrevElement = CurElement.Get_DocumentPrev();

    if (null !== PrevElement && undefined !== PrevElement)
        return PrevElement.GetEndInfo();
    else
        return null;
};
CDocument.prototype.GetSelectionAnchorPos = function()
{
	var Result = this.Controller.GetSelectionAnchorPos();

	var PageLimit = this.Get_PageLimits(Result.Page);
	Result.X0     = PageLimit.X;
	Result.X1     = PageLimit.XLimit;

	var Coords0 = this.DrawingDocument.ConvertCoordsToCursorWR(Result.X0, Result.Y, Result.Page);
	var Coords1 = this.DrawingDocument.ConvertCoordsToCursorWR(Result.X1, Result.Y, Result.Page);

	return {X0 : Coords0.X, X1 : Coords1.X, Y : Coords0.Y};
};
/**
 * Получаем все комментарии по заданным параметрам
 * @param isMine {boolean} удаляем только все свои комментарии
 * @param isCurrent {boolean} удаляем только все комментарии, находящиеся в текущей позиции
 * @returns {Array.string}
 */
CDocument.prototype.GetAllComments = function(isMine, isCurrent)
{
	var arrCommentsId = [];

	if (isCurrent)
	{
		if (true === this.Comments.Is_Use())
		{
			var oCurPosXY   = this.GetCursorRealPosition();
			var arrComments = this.Comments.Get_ByXY(this.CurPage, oCurPosXY.X, oCurPosXY.Y, docpostype_HdrFtr === this.GetDocPosType() ? AscCommon.comment_type_HdrFtr : AscCommon.comment_type_Common);

			for (var nCommentIndex = 0, nCommentsCount = arrComments.length; nCommentIndex < nCommentsCount; ++nCommentIndex)
			{
				var oComment = arrComments[nCommentIndex];
				if (oComment && (!isMine || oComment.IsCurrentUser()))
					arrCommentsId.push(oComment.GetId());
			}
		}
	}
	else
	{
		var oComments = this.Comments.GetAllComments();
		for (var sId in oComments)
		{
			var oComment = oComments[sId];
			if (oComment && (!isMine || oComment.IsCurrentUser()))
				arrCommentsId.push(oComment.GetId());
		}
	}

	return arrCommentsId;
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с textbox
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.TextBox_Put = function(sText, rFonts)
{
	if (false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content))
	{
		this.StartAction(AscDFH.historydescription_Document_AddTextFromTextBox);

		// Отключаем пересчет, включим перед последним добавлением. Поскольку,
		// у нас все добавляется в 1 параграф, так можно делать.
		this.Start_SilentMode();

		if (undefined === rFonts)
		{
			this.AddText(sText);
		}
		else
		{
			var Para = this.GetCurrentParagraph();
			if (null === Para)
				return;

			var RunPr = Para.Get_TextPr();
			if (null === RunPr || undefined === RunPr)
				RunPr = new CTextPr();

			RunPr.RFonts = rFonts;

			var Run = new ParaRun(Para);
			Run.Set_Pr(RunPr);
			Run.AddText(sText);
			Para.Add(Run);
		}

		this.End_SilentMode(true);

		this.FinalizeAction();
	}
};
//----------------------------------------------------------------------------------------------------------------------
// события вьюера
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.Viewer_OnChangePosition = function()
{
	var Comment = this.Comments.Get_Current();
	if (null != Comment)
	{
		var Comment_PageNum = Comment.m_oStartInfo.PageNum;
		var Comment_Y       = Comment.m_oStartInfo.Y;
		var Comment_X       = this.Get_PageLimits(Comment_PageNum).XLimit;
		var Para            = g_oTableId.Get_ById(Comment.StartId);

		if (null !== Para)
		{
			var TextTransform = Para.Get_ParentTextTransform();
			if (TextTransform)
			{
				Comment_Y = TextTransform.TransformPointY(Comment.m_oStartInfo.X, Comment.m_oStartInfo.Y);
			}
		}

		var Coords = this.DrawingDocument.ConvertCoordsToCursorWR(Comment_X, Comment_Y, Comment_PageNum);
		this.Api.sync_UpdateCommentPosition(Comment.Get_Id(), Coords.X, Coords.Y);
	}
    window['AscCommon'].g_specialPasteHelper.SpecialPasteButton_Update_Position();
	this.TrackRevisionsManager.Update_VisibleChangesPosition(this.Api);
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с секциями
//----------------------------------------------------------------------------------------------------------------------
/**
 * Обновляем информацию о всех секциях в данном документе
 */
CDocument.prototype.UpdateAllSectionsInfo = function()
{
	this.SectionsInfo.Clear();

	var Count = this.Content.length;
	for (var Index = 0; Index < Count; Index++)
	{
		var Element = this.Content[Index];
		if (type_Paragraph === Element.GetType() && undefined !== Element.Get_SectionPr())
			this.SectionsInfo.Add(Element.Get_SectionPr(), Index);
	}

	this.SectionsInfo.Add(this.SectPr, Count);

	// Когда полностью обновляются секции надо пересчитывать с самого начала
	this.RecalcInfo.Set_NeedRecalculateFromStart(true);
};
/**
 * Обновляем информацию о заданной секции
 * @param oSectPr {CSectionPr} - Если не задано, значит добавляется новая секция
 * @param oNewSectPr {CSectionPr} - Если не задано, тогда секция удаляется
 * @param isCheckHdrFtr {boolean} - Проверять ли колонтитулы при удалении секции
 */
CDocument.prototype.UpdateSectionInfo = function(oSectPr, oNewSectPr, isCheckHdrFtr)
{
	if (!this.SectionsInfo.UpdateSection(oSectPr, oNewSectPr, isCheckHdrFtr))
		this.UpdateAllSectionsInfo();
};
CDocument.prototype.Check_SectionLastParagraph = function()
{
	var Count = this.Content.length;
	if (Count <= 0)
		return;

	var Element = this.Content[Count - 1];
	if (type_Paragraph === Element.GetType() && undefined !== Element.Get_SectionPr())
		this.Internal_Content_Add(Count, new Paragraph(this.DrawingDocument, this));
};
CDocument.prototype.Add_SectionBreak = function(SectionBreakType)
{
	if (docpostype_Content !== this.GetDocPosType())
		return false;

	if (true === this.Selection.Use)
	{
		// Если у нас есть селект, тогда ставим курсор в начало селекта
		this.MoveCursorLeft(false, false);
	}

	var nContentPos = this.CurPos.ContentPos;
	var oElement    = this.Content[nContentPos];
	var oCurSectPr  = this.SectionsInfo.Get_SectPr(nContentPos).SectPr;
	if (oElement.IsParagraph())
	{
		// Если мы стоим в параграфе, тогда делим данный параграф на 2 в текущей точке(даже если мы стоим в начале
		// или в конце параграфа) и к первому параграфу приписываем конец секции

		var oNewParagraph = oElement.Split();
		oNewParagraph.MoveCursorToStartPos(false);

		this.AddToContent(nContentPos + 1, oNewParagraph);
		this.CurPos.ContentPos = nContentPos + 1;

		// Заметим, что после функции Split, у параграфа Element не может быть окончания секции, т.к. если она
		// была в нем изначально, тогда после функции Split, окончание секции перенеслось в новый параграф.
	}
	else if (oElement.IsTable())
	{
		// Если мы стоим в таблице, тогда делим данную таблицу на 2 по текущему ряду(текущий ряд попадает во
		// вторую таблицу). Вставляем между таблицами параграф, и к этому параграфу приписываем окончание
		// секции. Если мы стоим в первой строке таблицы, таблицу делить не надо, достаточно добавить новый
		// параграф перед ней.

		var oNewParagraph = new Paragraph(this.DrawingDocument, this);
		var oNewTable     = oElement.Split();

		if (null === oNewTable)
		{
			this.AddToContent(nContentPos, oNewParagraph);
			this.CurPos.ContentPos = nContentPos + 1;
		}
		else
		{
			this.AddToContent(nContentPos + 1, oNewParagraph);
			this.AddToContent(nContentPos + 2, oNewTable);
			this.CurPos.ContentPos = nContentPos + 2;
		}

		this.Content[this.CurPos.ContentPos].MoveCursorToStartPos(false);

		oElement = oNewParagraph;
	}
	else
	{
		return false;
	}

	var oSectPr = new CSectionPr(this);

	// В данном месте мы ставим разрыв секции. Чтобы до текущего места ничего не изменилось, мы у новой
	// для новой секции копируем все настройки из старой, а в старую секцию выставляем приходящий тип
	// разрыва секций. Заметим, что поскольку мы делаем все так, чтобы до текущей страницы ничего не
	// изменилось, надо сохранить эту информацию для пересчета, для этого мы помечаем все следующие изменения
	// как не влияющие на пересчет.

	this.History.MinorChanges = true;

	oSectPr.Copy(oCurSectPr);
	oCurSectPr.Set_Type(SectionBreakType);
	oCurSectPr.Set_PageNum_Start(-1);
	oCurSectPr.Clear_AllHdrFtr();

	this.History.MinorChanges = false;

	oElement.Set_SectionPr(oSectPr);
	oElement.Refresh_RecalcData2(0, 0);

	this.Recalculate();
	this.UpdateInterface();
	this.UpdateSelection();

	return true;
};
CDocument.prototype.Get_SectionFirstPage = function(SectIndex, Page_abs)
{
	if (SectIndex <= 0)
		return 0;

	var StartIndex = this.SectionsInfo.Get_SectPr2(SectIndex - 1).Index;

	// Ищем номер страницы, на которой закончилась предыдущая секция
	var CurPage = Page_abs;
	for (; CurPage > 0; CurPage--)
	{
		if (this.Pages[CurPage].EndPos >= StartIndex && this.Pages[CurPage].Pos <= StartIndex)
			break;
	}

	return CurPage + 1;
};
CDocument.prototype.Get_SectionPageNumInfo = function(Page_abs)
{
	var PageNumInfo = this.Get_SectionPageNumInfo2(Page_abs);

	var FP = PageNumInfo.FirstPage;
	var CP = PageNumInfo.CurPage;

	// Первая страница учитывается, только если параграф, идущий сразу за разрывом секции, начинается с новой страницы
	var bCheckFP  = true;
	var SectIndex = PageNumInfo.SectIndex;
	if (SectIndex > 0)
	{
		var CurSectInfo  = this.SectionsInfo.Get_SectPr2(SectIndex);
		var PrevSectInfo = this.SectionsInfo.Get_SectPr2(SectIndex - 1);

		if (CurSectInfo !== PrevSectInfo && c_oAscSectionBreakType.Continuous === CurSectInfo.SectPr.Get_Type() && true === CurSectInfo.SectPr.Compare_PageSize(PrevSectInfo.SectPr))
		{
			var ElementIndex = PrevSectInfo.Index;
			if (ElementIndex < this.Content.length - 1 && true !== this.Content[ElementIndex + 1].IsStartFromNewPage())
				bCheckFP = false;
		}
	}


	var bFirst = ( FP === CP && true === bCheckFP ? true : false );
	var bEven  = ( 0 === CP % 2 ? true : false ); // Четность/нечетность проверяется по текущему номеру страницы в секции, с учетом нумерации в секциях

	return new CSectionPageNumInfo(FP, CP, bFirst, bEven, Page_abs);
};
CDocument.prototype.Get_SectionPageNumInfo2 = function(Page_abs)
{
	var StartIndex = 0;

	// Такое может случится при первом рассчете документа, и когда мы находимся в автофигуре
	if (undefined !== this.Pages[Page_abs])
		StartIndex = this.Pages[Page_abs].Pos;

	var SectIndex      = this.SectionsInfo.Get_Index(StartIndex);
	var StartSectIndex = SectIndex;

	if (0 === SectIndex)
	{
		var PageNumStart = this.SectionsInfo.Get_SectPr2(0).SectPr.Get_PageNum_Start();
		var BT           = this.SectionsInfo.Get_SectPr2(0).SectPr.Get_Type();

		// Нумерация начинается с 1, если начальное значение не задано. Заметим, что в Word нумерация может начинаться и
		// со значения 0, а все отрицательные значения воспринимаются как продолжение нумерации с предыдущей секции.
		if (PageNumStart < 0)
			PageNumStart = 1;

		if ((c_oAscSectionBreakType.OddPage === BT && 0 === PageNumStart % 2) || (c_oAscSectionBreakType.EvenPage === BT && 1 === PageNumStart % 2))
			PageNumStart++;

		return {FirstPage : PageNumStart, CurPage : Page_abs + PageNumStart, SectIndex : StartSectIndex};
	}

	var SectionFirstPage = this.Get_SectionFirstPage(SectIndex, Page_abs);

	var FirstPage    = SectionFirstPage;
	var PageNumStart = this.SectionsInfo.Get_SectPr2(SectIndex).SectPr.Get_PageNum_Start();
	var BreakType    = this.SectionsInfo.Get_SectPr2(SectIndex).SectPr.Get_Type();

	var StartInfo = [];
	StartInfo.push({FirstPage : FirstPage, BreakType : BreakType});

	while ((PageNumStart < 0 || c_oAscSectionBreakType.Continuous === BreakType) && SectIndex > 0)
	{
		SectIndex--;

		FirstPage    = this.Get_SectionFirstPage(SectIndex, Page_abs);
		PageNumStart = this.SectionsInfo.Get_SectPr2(SectIndex).SectPr.Get_PageNum_Start();
		BreakType    = this.SectionsInfo.Get_SectPr2(SectIndex).SectPr.Get_Type();

		StartInfo.splice(0, 0, {FirstPage : FirstPage, BreakType : BreakType});
	}

	// Нумерация начинается с 1, если начальное значение не задано. Заметим, что в Word нумерация может начинаться и
	// со значения 0, а все отрицательные значения воспринимаются как продолжение нумерации с предыдущей секции.
	if (PageNumStart < 0)
		PageNumStart = 1;

	var InfoIndex = 0;
	var InfoCount = StartInfo.length;

	var FP     = StartInfo[0].FirstPage;
	var BT     = StartInfo[0].BreakType;
	var PrevFP = StartInfo[0].FirstPage;

	while (InfoIndex < InfoCount)
	{
		FP = StartInfo[InfoIndex].FirstPage;
		BT = StartInfo[InfoIndex].BreakType;

		PageNumStart += FP - PrevFP;
		PrevFP = FP;

		if ((c_oAscSectionBreakType.OddPage === BT && 0 === PageNumStart % 2) || (c_oAscSectionBreakType.EvenPage === BT && 1 === PageNumStart % 2))
			PageNumStart++;

		InfoIndex++;
	}

	if (FP > Page_abs)
		Page_abs = FP;

	var _FP = PageNumStart;
	var _CP = PageNumStart + Page_abs - FP;	// TODO: Здесь есть баг с рассчетом (чтобы его поправить добавил следующий комментарий,
											// но такой рассчет оказался неверным)
											// + 1 потому что FP начинает считать от 1, а Page_abs от 0

	return {FirstPage : _FP, CurPage : _CP, SectIndex : StartSectIndex};
};
CDocument.prototype.Get_SectionHdrFtr = function(Page_abs, _bFirst, _bEven)
{
	var StartIndex = this.Pages[Page_abs].Pos;
	var SectIndex  = this.SectionsInfo.Get_Index(StartIndex);
	var CurSectPr  = this.SectionsInfo.Get_SectPr2(SectIndex).SectPr;

	var bEven  = ( true === _bEven && true === EvenAndOddHeaders ? true : false );
	var bFirst = ( true === _bFirst && true === CurSectPr.TitlePage ? true : false );

	var CurSectIndex = SectIndex;

	// Ищем верхний и нижний колонтитулы. Если они не находятся в текущей секции, тогда ищем в предыдущей.
	var Header = null, Footer = null;
	while (CurSectIndex >= 0)
	{
		var SectPr = this.SectionsInfo.Get_SectPr2(CurSectIndex).SectPr;

		if (null === Header)
		{
			if (true === bFirst)
				Header = SectPr.Get_Header_First();
			else if (true === bEven)
				Header = SectPr.Get_Header_Even();
			else
				Header = SectPr.Get_Header_Default();
		}

		if (null === Footer)
		{
			if (true === bFirst)
				Footer = SectPr.Get_Footer_First();
			else if (true === bEven)
				Footer = SectPr.Get_Footer_Even();
			else
				Footer = SectPr.Get_Footer_Default();
		}

		if (null !== Header && null !== Footer)
			break;

		CurSectIndex--;
	}

	return {Header : Header, Footer : Footer, SectPr : CurSectPr};
};
CDocument.prototype.Create_SectionHdrFtr = function(Type, PageIndex)
{
	// Данная функция используется, когда у нас нет колонтитула вообще. Это значит, что его нет ни в 1 секции. Следовательно,
	// создаем колонтитул в первой секции, а в остальных он будет повторяться. По текущей секции нам надо будет
	// определить какой конкретно колонтитул мы собираемся создать.

	var SectionPageInfo = this.Get_SectionPageNumInfo(PageIndex);

	var _bFirst = SectionPageInfo.bFirst;
	var _bEven  = SectionPageInfo.bEven;

	var StartIndex = this.Pages[PageIndex].Pos;
	var SectIndex  = this.SectionsInfo.Get_Index(StartIndex);
	var CurSectPr  = this.SectionsInfo.Get_SectPr2(SectIndex).SectPr;

	var bEven  = ( true === _bEven && true === EvenAndOddHeaders ? true : false );
	var bFirst = ( true === _bFirst && true === CurSectPr.TitlePage ? true : false );

	var SectPr = this.SectionsInfo.Get_SectPr2(0).SectPr;
	var HdrFtr = new CHeaderFooter(this.HdrFtr, this, this.DrawingDocument, Type);

	if (hdrftr_Header === Type)
	{
		if (true === bFirst)
			SectPr.Set_Header_First(HdrFtr);
		else if (true === bEven)
			SectPr.Set_Header_Even(HdrFtr);
		else
			SectPr.Set_Header_Default(HdrFtr);
	}
	else
	{
		if (true === bFirst)
			SectPr.Set_Footer_First(HdrFtr);
		else if (true === bEven)
			SectPr.Set_Footer_Even(HdrFtr);
		else
			SectPr.Set_Footer_Default(HdrFtr);
	}

	return HdrFtr;
};
CDocument.prototype.On_SectionChange = function(_SectPr)
{
	var Index = this.SectionsInfo.Find(_SectPr);
	if (-1 === Index)
		return;

	var SectPr  = null;
	var HeaderF = null, HeaderD = null, HeaderE = null, FooterF = null, FooterD = null, FooterE = null;

	while (Index >= 0)
	{
		SectPr = this.SectionsInfo.Get_SectPr2(Index).SectPr;

		if (null === HeaderF)
			HeaderF = SectPr.Get_Header_First();

		if (null === HeaderD)
			HeaderD = SectPr.Get_Header_Default();

		if (null === HeaderE)
			HeaderE = SectPr.Get_Header_Even();

		if (null === FooterF)
			FooterF = SectPr.Get_Footer_First();

		if (null === FooterD)
			FooterD = SectPr.Get_Footer_Default();

		if (null === FooterE)
			FooterE = SectPr.Get_Footer_Even();

		Index--;
	}

	if (null !== HeaderF)
		HeaderF.Refresh_RecalcData_BySection(_SectPr);

	if (null !== HeaderD)
		HeaderD.Refresh_RecalcData_BySection(_SectPr);

	if (null !== HeaderE)
		HeaderE.Refresh_RecalcData_BySection(_SectPr);

	if (null !== FooterF)
		FooterF.Refresh_RecalcData_BySection(_SectPr);

	if (null !== FooterD)
		FooterD.Refresh_RecalcData_BySection(_SectPr);

	if (null !== FooterE)
		FooterE.Refresh_RecalcData_BySection(_SectPr);
};
CDocument.prototype.Create_HdrFtrWidthPageNum = function(PageIndex, AlignV, AlignH)
{
	// Определим четность страницы и является ли она первой в данной секции. Заметим, что четность страницы
	// отсчитывается от начала текущей секции и не зависит от настроек нумерации страниц для данной секции.
	var SectionPageInfo = this.Get_SectionPageNumInfo(PageIndex);

	var bFirst = SectionPageInfo.bFirst;
	var bEven  = SectionPageInfo.bEven;

	// Запросим нужный нам колонтитул
	var HdrFtr = this.Get_SectionHdrFtr(PageIndex, bFirst, bEven);

	switch (AlignV)
	{
		case hdrftr_Header :
		{
			var Header = HdrFtr.Header;

			if (null === Header)
				Header = this.Create_SectionHdrFtr(hdrftr_Header, PageIndex);

			Header.AddPageNum(AlignH);

			break;
		}

		case hdrftr_Footer :
		{
			var Footer = HdrFtr.Footer;

			if (null === Footer)
				Footer = this.Create_SectionHdrFtr(hdrftr_Footer, PageIndex);

			Footer.AddPageNum(AlignH);

			break;
		}
	}

	this.Recalculate();
};
CDocument.prototype.GetCurrentSectionPr = function()
{
	var oSectPr = this.Controller.GetCurrentSectionPr();
	if (null === oSectPr)
		return this.controller_GetCurrentSectionPr();

	return oSectPr;
};
CDocument.prototype.GetFirstElementInSection = function(SectionIndex)
{
	if (SectionIndex <= 0)
		return this.Content[0] ? this.Content[0] : null;

	var nElementPos = this.SectionsInfo.Get_SectPr2(SectionIndex - 1).Index + 1;
	return this.Content[nElementPos] ? this.Content[nElementPos] : null;
};
CDocument.prototype.GetSectionIndexByElementIndex = function(ElementIndex)
{
	return this.SectionsInfo.Get_Index(ElementIndex);
};

/**
 * Определяем использовать ли заливку текста в особых случаях, когда вызывается заливка параграфа
 * @param isUse {boolean}
 */
CDocument.prototype.SetUseTextShd = function(isUse)
{
	this.UseTextShd = isUse;
};
CDocument.prototype.RecalculateFromStart = function(bUpdateStates)
{
	var RecalculateData = {
		Inline   : {Pos : 0, PageNum : 0},
		Flow     : [],
		HdrFtr   : [],
		Drawings : {All : true, Map : {}}
	};

	this.Reset_RecalculateCache();
	this.RecalculateWithParams(RecalculateData, true);

	if (true === bUpdateStates)
	{
		this.Document_UpdateInterfaceState();
		this.Document_UpdateSelectionState();
	}
};
CDocument.prototype.Register_Field = function(oField)
{
	this.FieldsManager.Register_Field(oField);
};
CDocument.prototype.Is_MailMergePreviewResult = function()
{
	return this.MailMergePreview;
};
CDocument.prototype.Is_HighlightMailMergeFields = function()
{
	return this.MailMergeFieldsHighlight;
};
CDocument.prototype.CompareDrawingsLogicPositions = function(Drawing1, Drawing2)
{
	var ParentPara1 = Drawing1.GetParagraph();
	var ParentPara2 = Drawing2.GetParagraph();

	if (!ParentPara1 || !ParentPara2 || !ParentPara1.Parent || !ParentPara2.Parent)
		return 0;

	var TopDocument1 = ParentPara1.Parent.Is_TopDocument(true);
	var TopDocument2 = ParentPara2.Parent.Is_TopDocument(true);

	if (TopDocument1 !== TopDocument2 || !TopDocument1)
		return 0;

	var TopElement1 = ParentPara1.GetTopElement();
	var TopElement2 = ParentPara2.GetTopElement();

	if (!TopElement1 || !TopElement2)
		return 0;

	var TopIndex1 = TopElement1.Get_Index();
	var TopIndex2 = TopElement2.Get_Index();

	if (TopIndex1 < TopIndex2)
		return 1;
	else if (TopIndex1 > TopIndex2)
		return -1;

	if (undefined !== TopDocument1.Content[TopIndex1])
	{
		var CompareEngine = new CDocumentCompareDrawingsLogicPositions(Drawing1, Drawing2);
		TopDocument1.Content[TopIndex1].CompareDrawingsLogicPositions(CompareEngine);
		return CompareEngine.Result;
	}

	return 0;
};
CDocument.prototype.GetTopElement = function()
{
	return null;
};
CDocument.prototype.private_StopSelection = function()
{
	this.Selection.Start = false;
};
CDocument.prototype.private_UpdateCurPage = function()
{
	if (true === this.TurnOffRecalcCurPos)
		return;

	this.private_CheckCurPage();
};
CDocument.prototype.private_UpdateCursorXY = function(bUpdateX, bUpdateY)
{
	this.private_UpdateCurPage();

	var NewCursorPos = null;

	if (true !== this.IsSelectionUse() || true === this.IsSelectionEmpty())
	{
		this.DrawingDocument.UpdateTargetTransform(null);
		NewCursorPos = this.Controller.RecalculateCurPos(bUpdateX, bUpdateY);
		if (NewCursorPos && NewCursorPos.Transform)
		{
			var x = NewCursorPos.Transform.TransformPointX(NewCursorPos.X, NewCursorPos.Y);
			var y = NewCursorPos.Transform.TransformPointY(NewCursorPos.X, NewCursorPos.Y);

			NewCursorPos.X = x;
			NewCursorPos.Y = y;
		}
	}
	else
	{
		// Обновляем всегда по концу селекта
		var SelectionBounds = this.GetSelectionBounds();
		if (null !== SelectionBounds)
		{
			NewCursorPos = {};
			if (-1 === SelectionBounds.Direction)
			{
				NewCursorPos.X = SelectionBounds.Start.X;
				NewCursorPos.Y = SelectionBounds.Start.Y;

				if (this.CurPage < SelectionBounds.Start.Page)
					NewCursorPos.Y = this.Pages[this.CurPage].Height;
			}
			else
			{
				NewCursorPos.X = SelectionBounds.End.X + SelectionBounds.End.W;
				NewCursorPos.Y = SelectionBounds.End.Y + SelectionBounds.End.H;

				if (this.CurPage > SelectionBounds.End.Page)
					NewCursorPos.Y = 0;
			}
		}
	}

	if (null === NewCursorPos || undefined === NewCursorPos)
		return;

	if (bUpdateX)
		this.CurPos.RealX = NewCursorPos.X;

	if (bUpdateY)
		this.CurPos.RealY = NewCursorPos.Y;

	if (true === this.Selection.Use && true !== this.Selection.Start)
		this.private_OnSelectionEnd();

	this.private_CheckCursorInPlaceHolder();
};
CDocument.prototype.private_MoveCursorDown = function(StartX, StartY, AddToSelect)
{
	var StartPage = this.CurPage;
	var CurY      = StartY;

	// Если данная страница еще не успела пересчитаться, тогда не даем смещаться
	if (StartPage >= this.Pages.length)
		return true;

	var PageH = this.Pages[this.CurPage].Height;

	this.TurnOff_InterfaceEvents();
	this.CheckEmptyElementsOnSelection = false;

	var Result = false;
	while (true)
	{
		CurY += 0.1;

		if (CurY > PageH || this.CurPage > StartPage)
		{
			this.CurPage = StartPage;
			if (this.Pages.length - 1 <= this.CurPage)
			{
				Result = false;
				break;
			}
			else
			{
				this.CurPage++;
				StartY = 0;

				var NewPage = this.CurPage;
				var bBreak = false;
				while (true)
				{
					this.MoveCursorToXY(StartX, StartY, AddToSelect);
					this.private_UpdateCursorXY(false, true);

					if (this.CurPage < NewPage)
					{
						StartY += 0.1;
						if (StartY > this.Pages[NewPage].Height)
						{
							NewPage++;
							if (this.Pages.length - 1 < NewPage)
							{
								Result = false;
								break;
							}

							StartY = 0;
						}
						else
						{
							StartY += 0.1;
						}
						this.CurPage = NewPage;
					}
					else
					{
						Result = true;
						bBreak = true;
						break;
					}
				}

				if (false === Result || true === bBreak)
					break;

				CurY = StartY;
			}
		}


		this.MoveCursorToXY(StartX, CurY, AddToSelect);
		this.private_UpdateCursorXY(false, true);

		if (this.CurPos.RealY > StartY + 0.001)
		{
			Result = true;
			break;
		}
	}

	this.CheckEmptyElementsOnSelection = true;
	this.TurnOn_InterfaceEvents(true);
	return Result;
};
CDocument.prototype.private_MoveCursorUp = function(StartX, StartY, AddToSelect)
{
	var StartPage = this.CurPage;
	var CurY      = StartY;

	// Если данная страница еще не успела пересчитаться, тогда не даем смещаться
	if (StartPage >= this.Pages.length)
		return true;

	var PageH = this.Pages[this.CurPage].Height;

	this.TurnOff_InterfaceEvents();
	this.CheckEmptyElementsOnSelection = false;

	var Result = false;
	while (true)
	{
		CurY -= 0.1;

		if (CurY < 0 || this.CurPage < StartPage)
		{
			this.CurPage = StartPage;
			if (0 === this.CurPage)
			{
				Result = false;
				break;
			}
			else
			{
				this.CurPage--;
				StartY = this.Pages[this.CurPage].Height;

				var NewPage = this.CurPage;
				var bBreak  = false;
				while (true)
				{
					this.MoveCursorToXY(StartX, StartY, AddToSelect);
					this.private_UpdateCursorXY(false, true);

					if (this.CurPage > NewPage)
					{
						this.CurPage = NewPage;
						StartY -= 0.1;

						if (StartY < 0)
						{
							// Защита от полностью пустой страницы
							if (0 === this.CurPage)
							{
								Result = false;
								bBreak = true;
								break;
							}
							else
							{
								this.CurPage--;
								StartY = this.Pages[this.CurPage].Height;

								NewPage = this.CurPage;
							}
						}
					}
					else
					{
						Result = true;
						bBreak = true;
						break;
					}
				}

				if (false === Result || true === bBreak)
					break;

				CurY = StartY;
			}
		}

		this.MoveCursorToXY(StartX, CurY, AddToSelect);
		this.private_UpdateCursorXY(false, true);

		if (this.CurPos.RealY < StartY - 0.001)
		{
			Result = true;
			break;
		}
	}

	this.CheckEmptyElementsOnSelection = true;
	this.TurnOn_InterfaceEvents(true);
	return Result;
};
CDocument.prototype.MoveCursorPageDown = function(AddToSelect, NextPage)
{
	if (this.Pages.length <= 0)
		return;

	if (true === this.IsSelectionUse() && true !== AddToSelect)
		this.MoveCursorRight(false, false);

	var bStopSelection = false;
	if (true !== this.IsSelectionUse() && true === AddToSelect && true !== NextPage)
	{
		bStopSelection = true;
		this.StartSelectionFromCurPos();
	}

	this.private_UpdateCursorXY(false, true);
	var Result = this.private_MoveCursorPageDown(this.CurPos.RealX, this.CurPos.RealY, AddToSelect, NextPage);

	if (true === AddToSelect && true !== NextPage && true !== Result)
		this.MoveCursorToEndPos(true);

	if (bStopSelection)
		this.private_StopSelection();
};
CDocument.prototype.private_MoveCursorPageDown = function(StartX, StartY, AddToSelect, NextPage)
{
	if (this.Pages.length <= 0)
		return true;

	var Dy        = 0;
	var StartPage = this.CurPage;
	if (NextPage)
	{
		if (this.CurPage >= this.Pages.length - 1)
		{
			this.MoveCursorToXY(0, 0, false);
			this.private_UpdateCursorXY(false, true);
			return;
		}

		this.CurPage++;
		StartX = 0;
		StartY = 0;
	}
	else
	{
		if (this.CurPage >= this.Pages.length)
		{
			this.CurPage    = this.Pages.length - 1;
			var LastElement = this.Content[this.Pages[this.CurPage].EndPos];
			Dy              = LastElement.GetPageBounds(LastElement.GetPagesCount() - 1).Bottom;
			StartPage       = this.CurPage;
		}
		else
		{
			Dy = this.DrawingDocument.GetVisibleMMHeight();
			if (StartY + Dy > this.Get_PageLimits(this.CurPage).YLimit)
			{
				this.CurPage++;
				var PageH = this.Get_PageLimits(this.CurPage).YLimit;
				Dy -= PageH - StartY;
				StartY    = 0;
				while (Dy > PageH)
				{
					Dy -= PageH;
					this.CurPage++;
				}

				if (this.CurPage >= this.Pages.length)
				{
					this.CurPage    = this.Pages.length - 1;
					var LastElement = this.Content[this.Pages[this.CurPage].EndPos];
					Dy              = LastElement.GetPageBounds(LastElement.GetPagesCount() - 1).Bottom;
				}

				StartPage = this.CurPage;
			}
		}
	}

	this.MoveCursorToXY(StartX, StartY + Dy, AddToSelect);
	this.private_UpdateCursorXY(false, true);

	if (this.CurPage > StartPage || (this.CurPos.RealY > StartY + 0.001 && this.CurPage === StartPage))
		return true;

	return this.private_MoveCursorDown(this.CurPos.RealX, this.CurPos.RealY, AddToSelect);
};
CDocument.prototype.MoveCursorPageUp = function(AddToSelect, PrevPage)
{
	if (this.Pages.length <= 0)
		return;

	if (true === this.IsSelectionUse() && true !== AddToSelect)
		this.MoveCursorRight(false, false);

	var bStopSelection = false;
	if (true !== this.IsSelectionUse() && true === AddToSelect && true !== PrevPage)
	{
		bStopSelection = true;
		this.StartSelectionFromCurPos();
	}

	this.private_UpdateCursorXY(false, true);
	var Result = this.private_MoveCursorPageUp(this.CurPos.RealX, this.CurPos.RealY, AddToSelect, PrevPage);

	if (true === AddToSelect && true !== PrevPage && true !== Result)
		this.MoveCursorToEndPos(true);

	if (bStopSelection)
		this.private_StopSelection();
};
CDocument.prototype.private_MoveCursorPageUp = function(StartX, StartY, AddToSelect, PrevPage)
{
	if (this.Pages.length <= 0)
		return true;

	if (this.CurPage >= this.Pages.length)
	{
		this.CurPage    = this.Pages.length - 1;
		var LastElement = this.Content[this.Pages[this.CurPage].EndPos];
		StartY          = LastElement.GetPageBounds(LastElement.GetPagesCount() - 1).Bottom;
	}

	var Dy        = 0;
	var StartPage = this.CurPage;
	if (PrevPage)
	{
		if (this.CurPage <= 0)
		{
			this.MoveCursorToXY(0, 0, false);
			this.private_UpdateCursorXY(false, true);
			return;
		}

		this.CurPage--;
		StartX = 0;
		StartY = 0;
	}
	else
	{
		Dy = this.DrawingDocument.GetVisibleMMHeight();
		if (StartY - Dy < 0)
		{
			this.CurPage--;
			var PageH = this.Get_PageLimits(this.CurPage).YLimit;

			Dy -= StartY;
			StartY = PageH;
			while (Dy > PageH)
			{
				Dy -= PageH;
				this.CurPage--;
			}

			if (this.CurPage < 0)
			{
				this.CurPage = 0;
				var oElement = this.Content[0];
				Dy           = PageH - oElement.GetPageBounds(oElement.GetPagesCount() - 1).Top;
			}

			StartPage = this.CurPage;
		}
	}

	this.MoveCursorToXY(StartX, StartY - Dy, AddToSelect);
	this.private_UpdateCursorXY(false, true);

	if (this.CurPage < StartPage || (this.CurPos.RealY < StartY - 0.001 && this.CurPage === StartPage))
		return true;

	return this.private_MoveCursorUp(this.CurPos.RealX, this.CurPos.RealY, AddToSelect);
};
CDocument.prototype.private_ProcessTemplateReplacement = function(TemplateReplacementData)
{
	for (var Id in TemplateReplacementData)
	{
		this.Search(Id, {MatchCase : true}, false);
		this.SearchEngine.Replace_All(TemplateReplacementData[Id], false);
	}
};
CDocument.prototype.private_CheckCursorInPlaceHolder = function()
{
	var oPlaceHolder = this.GetPlaceHolderObject();
	if (oPlaceHolder)
	{
		if (oPlaceHolder instanceof CInlineLevelSdt || oPlaceHolder instanceof CBlockLevelSdt)
		{
			oPlaceHolder.SelectContentControl();
		}
	}
};

CDocument.prototype.Reset_WordSelection = function()
{
	this.Selection.WordSelected = false;
};
CDocument.prototype.Set_WordSelection = function()
{
	this.Selection.WordSelected = true;
};
CDocument.prototype.Is_WordSelection = function()
{
	return this.Selection.WordSelected;
};
CDocument.prototype.IsStartSelection = function()
{
	return this.Selection.Start;
};
CDocument.prototype.Get_EditingType = function()
{
	return this.EditingType;
};
CDocument.prototype.Set_EditingType = function(EditingType)
{
	this.EditingType = EditingType;
};
CDocument.prototype.IsTrackRevisions = function()
{
	return this.TrackRevisions;
};
CDocument.prototype.GetTrackRevisionsManager = function()
{
	return this.TrackRevisionsManager;
};
CDocument.prototype.Start_SilentMode = function()
{
	this.TurnOff_Recalculate();
	this.TurnOff_InterfaceEvents();
	this.TurnOff_RecalculateCurPos();
};
CDocument.prototype.End_SilentMode = function(bUpdate)
{
	this.TurnOn_Recalculate(bUpdate);
	this.TurnOn_RecalculateCurPos(bUpdate);
	this.TurnOn_InterfaceEvents(bUpdate);
};
/**
 * Начинаем селект с текущей точки. Если селект уже есть, тогда ничего не делаем.
 */
CDocument.prototype.StartSelectionFromCurPos = function()
{
	if (true === this.IsSelectionUse())
		return true;

	this.Selection.Use   = true;
	this.Selection.Start = false;

	this.Controller.StartSelectionFromCurPos();
};
CDocument.prototype.Is_TrackingDrawingObjects = function()
{
	return this.DrawingObjects.Check_TrackObjects();
};
CDocument.prototype.Add_ChangedStyle = function(arrStylesId)
{
	for (var nIndex = 0, nCount = arrStylesId.length; nIndex < nCount; nIndex++)
	{
		this.ChangedStyles[arrStylesId[nIndex]] = true;
	}
};
CDocument.prototype.Document_UpdateStylesPanel = function()
{
	if (0 !== this.TurnOffPanelStyles)
		return;

	var bNeedUpdate = false;
	for (var StyleId in this.ChangedStyles)
	{
		bNeedUpdate = true;
		break;
	}

	this.ChangedStyles = {};

	if (true === bNeedUpdate)
	{
		editor.GenerateStyles();
	}
};
CDocument.prototype.LockPanelStyles = function()
{
	this.TurnOffPanelStyles++;
};
CDocument.prototype.UnlockPanelStyles = function(isUpdate)
{
	this.TurnOffPanelStyles = Math.max(0, this.TurnOffPanelStyles - 1);

	if (true === isUpdate)
		this.Document_UpdateStylesPanel();
};
CDocument.prototype.GetAllParagraphs = function(Props, ParaArray)
{
	if (Props && true === Props.OnlyMainDocument && true === Props.All && null !== this.AllParagraphsList)
		return this.AllParagraphsList;

	if (!ParaArray)
		ParaArray = [];

	if (true === Props.OnlyMainDocument)
	{
		var Count = this.Content.length;
		for (var Index = 0; Index < Count; Index++)
		{
			var Element = this.Content[Index];
			Element.GetAllParagraphs(Props, ParaArray);
		}
	}
	else
	{
		this.SectionsInfo.GetAllParagraphs(Props, ParaArray);

		var Count = this.Content.length;
		for (var Index = 0; Index < Count; Index++)
		{
			var Element = this.Content[Index];
			Element.GetAllParagraphs(Props, ParaArray);
		}

		this.Footnotes.GetAllParagraphs(Props, ParaArray);
	}

	if (Props && true === Props.OnlyMainDocument && true === Props.All)
		this.AllParagraphsList = ParaArray;

	return ParaArray;
};
CDocument.prototype.TurnOffHistory = function()
{
	this.History.TurnOff();
	this.TableId.TurnOff();
};
CDocument.prototype.TurnOnHistory = function()
{
	this.TableId.TurnOn();
	this.History.TurnOn();
};
CDocument.prototype.Get_SectPr = function(Index)
{
	return this.SectionsInfo.Get_SectPr(Index).SectPr;
};
CDocument.prototype.Add_ToContent = function(Pos, Item, isCorrectContent)
{
	this.Internal_Content_Add(Pos, Item, isCorrectContent);
};
CDocument.prototype.Remove_FromContent = function(Pos, Count, isCorrectContent)
{
	this.Internal_Content_Remove(Pos, Count, isCorrectContent);
};
CDocument.prototype.Set_FastCollaborativeEditing = function(isOn)
{
	this.CollaborativeEditing.Set_Fast(isOn);

	if (c_oAscCollaborativeMarksShowType.LastChanges === this.Api.GetCollaborativeMarksShowType())
		this.Api.SetCollaborativeMarksShowType(c_oAscCollaborativeMarksShowType.All);
};
CDocument.prototype.Continue_FastCollaborativeEditing = function()
{
	if (true === this.CollaborativeEditing.Get_GlobalLock())
	{
		if (this.Api.forceSaveUndoRequest)
			this.Api.asc_Save(true);

		return;
	}

	if (this.Api.isLongAction())
		return;

	if (true !== this.CollaborativeEditing.Is_Fast() || true === this.CollaborativeEditing.Is_SingleUser())
		return;

	if (true === this.IsMovingTableBorder() || true === this.Api.isStartAddShape || this.DrawingObjects.checkTrackDrawings() || this.Api.isOpenedChartFrame)
		return;

	var HaveChanges = this.History.Have_Changes(true);
	if (true !== HaveChanges && (true === this.CollaborativeEditing.Have_OtherChanges() || 0 !== this.CollaborativeEditing.getOwnLocksLength()))
	{
		// Принимаем чужие изменения. Своих нет, но функцию отсылки надо вызвать, чтобы снять локи.
		this.CollaborativeEditing.Apply_Changes();
		this.CollaborativeEditing.Send_Changes();
	}
	else if (true === HaveChanges || true === this.CollaborativeEditing.Have_OtherChanges())
	{
		this.Api.asc_Save(true);
	}

	var CurTime = new Date().getTime();
	if (true === this.NeedUpdateTargetForCollaboration && (CurTime - this.LastUpdateTargetTime > 1000))
	{
		this.NeedUpdateTargetForCollaboration = false;
		if (true !== HaveChanges)
		{
			var CursorInfo = this.History.Get_DocumentPositionBinary();
			if (null !== CursorInfo)
			{
				this.Api.CoAuthoringApi.sendCursor(CursorInfo);
				this.LastUpdateTargetTime = CurTime;
			}
		}
		else
		{
			this.LastUpdateTargetTime = CurTime;
		}
	}
};
CDocument.prototype.Save_DocumentStateBeforeLoadChanges = function()
{
	var State = {};

	State.CurPos =
	{
		X     : this.CurPos.X,
		Y     : this.CurPos.Y,
		RealX : this.CurPos.RealX,
		RealY : this.CurPos.RealY,
		Type  : this.CurPos.Type
	};

	State.Selection =
	{
		Start          : this.Selection.Start,
		Use            : this.Selection.Use,
		Flag           : this.Selection.Flag,
		UpdateOnRecalc : this.Selection.UpdateOnRecalc,
		DragDrop       : {
			Flag : this.Selection.DragDrop.Flag,
			Data : null === this.Selection.DragDrop.Data ? null : {
				X       : this.Selection.DragDrop.Data.X,
				Y       : this.Selection.DragDrop.Data.Y,
				PageNum : this.Selection.DragDrop.Data.PageNum
			}
		}
	};

	State.SingleCell = this.GetSelectedElementsInfo().Get_SingleCell();
	State.Pos        = [];
	State.StartPos   = [];
	State.EndPos     = [];

	this.Controller.SaveDocumentStateBeforeLoadChanges(State);
	this.RemoveSelection();

	this.CollaborativeEditing.WatchDocumentPositionsByState(State);

	return State;
};
CDocument.prototype.Load_DocumentStateAfterLoadChanges = function(State)
{
	this.CollaborativeEditing.UpdateDocumentPositionsByState(State);

	this.RemoveSelection();

	this.CurPos.X     = State.CurPos.X;
	this.CurPos.Y     = State.CurPos.Y;
	this.CurPos.RealX = State.CurPos.RealX;
	this.CurPos.RealY = State.CurPos.RealY;
	this.SetDocPosType(State.CurPos.Type);

	this.Selection.Start          = State.Selection.Start;
	this.Selection.Use            = State.Selection.Use;
	this.Selection.Flag           = State.Selection.Flag;
	this.Selection.UpdateOnRecalc = State.Selection.UpdateOnRecalc;
	this.Selection.DragDrop.Flag  = State.Selection.DragDrop.Flag;
	this.Selection.DragDrop.Data  = State.Selection.DragDrop.Data === null ? null : {
		X       : State.Selection.DragDrop.Data.X,
		Y       : State.Selection.DragDrop.Data.Y,
		PageNum : State.Selection.DragDrop.Data.PageNum
	};

	this.Controller.RestoreDocumentStateAfterLoadChanges(State);

	if (true === this.Selection.Use && null !== State.SingleCell && undefined !== State.SingleCell)
	{
		var Cell  = State.SingleCell;
		var Table = Cell.Get_Table();
		if (Table && true === Table.Is_UseInDocument())
		{
			Table.Set_CurCell(Cell);
			Table.RemoveSelection();
			Table.SelectTable(c_oAscTableSelectionType.Cell);
		}
	}
};
CDocument.prototype.SaveDocumentState = function()
{
	return this.Save_DocumentStateBeforeLoadChanges();
};
CDocument.prototype.LoadDocumentState = function(oState)
{
	return this.Load_DocumentStateAfterLoadChanges(oState);
};
CDocument.prototype.SetContentSelection = function(StartDocPos, EndDocPos, Depth, StartFlag, EndFlag)
{
	if ((0 === StartFlag && (!StartDocPos[Depth] || this !== StartDocPos[Depth].Class)) || (0 === EndFlag && (!EndDocPos[Depth] || this !== EndDocPos[Depth].Class)))
		return;

	var StartPos = 0, EndPos = 0;
	switch (StartFlag)
	{
		case 0 :
			StartPos = StartDocPos[Depth].Position;
			break;
		case 1 :
			StartPos = 0;
			break;
		case -1:
			StartPos = this.Content.length - 1;
			break;
	}

	switch (EndFlag)
	{
		case 0 :
			EndPos = EndDocPos[Depth].Position;
			break;
		case 1 :
			EndPos = 0;
			break;
		case -1:
			EndPos = this.Content.length - 1;
			break;
	}

	var _StartDocPos = StartDocPos, _StartFlag = StartFlag;
	if (null !== StartDocPos && true === StartDocPos[Depth].Deleted)
	{
		if (StartPos < this.Content.length)
		{
			_StartDocPos = null;
			_StartFlag   = 1;
		}
		else if (StartPos > 0)
		{
			StartPos--;
			_StartDocPos = null;
			_StartFlag   = -1;
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
			_EndFlag   = 1;
		}
		else if (EndPos > 0)
		{
			EndPos--;
			_EndDocPos = null;
			_EndFlag   = -1;
		}
		else
		{
			// Такого не должно быть
			return;
		}
	}

	this.Selection.StartPos = StartPos;
	this.Selection.EndPos   = EndPos;

	if (StartPos !== EndPos)
	{
		this.Content[StartPos].SetContentSelection(_StartDocPos, null, Depth + 1, _StartFlag, StartPos > EndPos ? 1 : -1);
		this.Content[EndPos].SetContentSelection(null, _EndDocPos, Depth + 1, StartPos > EndPos ? -1 : 1, _EndFlag);

		var _StartPos = StartPos;
		var _EndPos   = EndPos;
		var Direction = 1;

		if (_StartPos > _EndPos)
		{
			_StartPos = EndPos;
			_EndPos   = StartPos;
			Direction = -1;
		}

		for (var CurPos = _StartPos + 1; CurPos < _EndPos; CurPos++)
		{
			this.Content[CurPos].SelectAll(Direction);
		}
	}
	else
	{
		this.Content[StartPos].SetContentSelection(_StartDocPos, _EndDocPos, Depth + 1, _StartFlag, _EndFlag);
	}
};
CDocument.prototype.GetContentPosition = function(bSelection, bStart, PosArray)
{
	if (undefined === PosArray)
		PosArray = [];

	var oSelection = this.private_GetSelectionPos();

	var Pos = (true === bSelection ? (true === bStart ? oSelection.Start : oSelection.End) : this.CurPos.ContentPos);
	PosArray.push({Class : this, Position : Pos});

	if (undefined !== this.Content[Pos] && this.Content[Pos].GetContentPosition)
		this.Content[Pos].GetContentPosition(bSelection, bStart, PosArray);

	return PosArray;
};
CDocument.prototype.SetContentPosition = function(DocPos, Depth, Flag)
{
	if (0 === Flag && (!DocPos[Depth] || this !== DocPos[Depth].Class))
		return;

	var Pos = 0;
	switch (Flag)
	{
		case 0 :
			Pos = DocPos[Depth].Position;
			break;
		case 1 :
			Pos = 0;
			break;
		case -1:
			Pos = this.Content.length - 1;
			break;
	}

	var _DocPos = DocPos, _Flag = Flag;
	if (null !== DocPos && true === DocPos[Depth].Deleted)
	{
		if (Pos < this.Content.length)
		{
			_DocPos = null;
			_Flag   = 1;
		}
		else if (Pos > 0)
		{
			Pos--;
			_DocPos = null;
			_Flag   = -1;
		}
		else
		{
			// Такого не должно быть
			return;
		}
	}

	this.CurPos.ContentPos = Pos;

	if (this.Content[Pos])
		this.Content[Pos].SetContentPosition(_DocPos, Depth + 1, _Flag);
};
CDocument.prototype.GetDocumentPositionFromObject = function(arrPos)
{
	if (!arrPos)
		arrPos = [];

	return arrPos;
};
CDocument.prototype.Get_CursorLogicPosition = function()
{
	var nDocPosType = this.GetDocPosType();
	if (docpostype_HdrFtr === nDocPosType)
	{
		var HdrFtr = this.HdrFtr.Get_CurHdrFtr();
		if (HdrFtr)
		{
			return this.private_GetLogicDocumentPosition(HdrFtr.Get_DocumentContent());
		}
	}
	else if (docpostype_Footnotes === nDocPosType)
	{
		var oFootnote = this.Footnotes.GetCurFootnote();
		if (oFootnote)
			return this.private_GetLogicDocumentPosition(oFootnote);
	}
	else
	{
		return this.private_GetLogicDocumentPosition(this);
	}

	return null;
};
CDocument.prototype.private_GetLogicDocumentPosition = function(LogicDocument)
{
	if (!LogicDocument)
		return null;

	if (docpostype_DrawingObjects === LogicDocument.GetDocPosType())
	{
		var ParaDrawing    = this.DrawingObjects.getMajorParaDrawing();
		var DrawingContent = this.DrawingObjects.getTargetDocContent();
		if (!ParaDrawing)
			return null;

		if (DrawingContent)
		{
			return DrawingContent.GetContentPosition(DrawingContent.IsSelectionUse(), false);
		}
		else
		{
			var Run = ParaDrawing.Get_Run();
			if (null === Run)
				return null;

			var DrawingInRunPos = Run.Get_DrawingObjectSimplePos(ParaDrawing.Get_Id());
			if (-1 === DrawingInRunPos)
				return null;

			var DocPos = [{Class : Run, Position : DrawingInRunPos}];
			Run.GetDocumentPositionFromObject(DocPos);
			return DocPos;
		}
	}
	else
	{
		return LogicDocument.GetContentPosition(LogicDocument.IsSelectionUse(), false);
	}
};
CDocument.prototype.Get_DocumentPositionInfoForCollaborative = function()
{
	var DocPos = this.Get_CursorLogicPosition();
	if (!DocPos || DocPos.length <= 0)
		return null;

	var Last = DocPos[DocPos.length - 1];
	if (!(Last.Class instanceof ParaRun))
		return null;

	return Last;
};
CDocument.prototype.Update_ForeignCursor = function(CursorInfo, UserId, Show, UserShortId)
{
	if (!this.Api.User)
		return;

	if (UserId === this.Api.CoAuthoringApi.getUserConnectionId())
		return;

	// "" - это означает, что курсор нужно удалить
	if (!CursorInfo || "" === CursorInfo)
	{
		this.Remove_ForeignCursor(UserId);
		return;
	}

	var Changes = new AscCommon.CCollaborativeChanges();
	var Reader  = Changes.GetStream(CursorInfo, 0, CursorInfo.length);

	var RunId    = Reader.GetString2();
	var InRunPos = Reader.GetLong();

	var Run = this.TableId.Get_ById(RunId);
	if (!Run)
	{
		this.Remove_ForeignCursor(UserId);
		return;
	}

	var CursorPos = [{Class : Run, Position : InRunPos}];
	Run.GetDocumentPositionFromObject(CursorPos);
	this.CollaborativeEditing.Add_ForeignCursor(UserId, CursorPos, UserShortId);

	if (true === Show)
		this.CollaborativeEditing.Update_ForeignCursorPosition(UserId, Run, InRunPos, true);
};
CDocument.prototype.Remove_ForeignCursor = function(UserId)
{
	this.CollaborativeEditing.Remove_ForeignCursor(UserId);
};
CDocument.prototype.private_UpdateTargetForCollaboration = function()
{
	this.NeedUpdateTargetForCollaboration = true;
};
CDocument.prototype.GetHdrFtr = function()
{
	return this.HdrFtr;
};
CDocument.prototype.Get_DrawingDocument = function()
{
	return this.DrawingDocument;
};
CDocument.prototype.GetDrawingDocument = function()
{
	return this.DrawingDocument;
};
CDocument.prototype.Get_Api = function()
{
	return this.Api;
};
CDocument.prototype.GetApi = function()
{
	return this.Api;
};
CDocument.prototype.Get_IdCounter = function()
{
	return this.IdCounter;
};
CDocument.prototype.Get_TableId = function()
{
	return this.TableId;
};
CDocument.prototype.GetTableId = function()
{
	return this.TableId;
};
CDocument.prototype.Get_History = function()
{
	return this.History;
};
CDocument.prototype.GetHistory = function()
{
	return this.History;
};
CDocument.prototype.Get_CollaborativeEditing = function()
{
	return this.CollaborativeEditing;
};
CDocument.prototype.GetDocumentOutline = function()
{
	return this.DocumentOutline;
};
CDocument.prototype.private_CorrectDocumentPosition = function()
{
	if (this.CurPos.ContentPos < 0 || this.CurPos.ContentPos >= this.Content.length)
	{
		this.RemoveSelection();
		if (this.CurPos.ContentPos < 0)
		{
			this.CurPos.ContentPos = 0;
			this.Content[0].MoveCursorToStartPos(false);
		}
		else
		{
			this.CurPos.ContentPos = this.Content.length - 1;
			this.Content[this.CurPos.ContentPos].MoveCursorToEndPos(false);
		}
	}
};
CDocument.prototype.private_ToggleParagraphAlignByHotkey = function(Align)
{
	var SelectedInfo = this.GetSelectedElementsInfo();
	var Math         = SelectedInfo.Get_Math();
	if (null !== Math && true !== Math.Is_Inline())
	{
		var MathAlign = Math.Get_Align();
		if (Align !== MathAlign)
		{
			if (false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content))
			{
				this.StartAction(AscDFH.historydescription_Document_SetParagraphAlignHotKey);
				Math.Set_Align(Align);
				this.Recalculate();
				this.UpdateInterface();
				this.FinalizeAction();
			}
		}
	}
	else
	{
		var ParaPr = this.GetCalculatedParaPr();
		if (null != ParaPr)
		{
			if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Properties))
			{
				this.StartAction(AscDFH.historydescription_Document_SetParagraphAlignHotKey);
				this.SetParagraphAlign(ParaPr.Jc === Align ? (Align === align_Left ? AscCommon.align_Justify : align_Left) : Align);
				this.UpdateInterface();
				this.FinalizeAction();
			}
		}
	}
};
CDocument.prototype.Is_ShowParagraphMarks = function()
{
	return this.Api.ShowParaMarks;
};
CDocument.prototype.Set_ShowParagraphMarks = function(isShow, isRedraw)
{
	this.Api.ShowParaMarks = isShow;

	if (true === isRedraw)
	{
		this.DrawingDocument.ClearCachePages();
		this.DrawingDocument.FirePaint();
	}
};
CDocument.prototype.Get_StyleNameById = function(StyleId)
{
	if (!this.Styles)
		return "";

	var Style = this.Styles.Get(StyleId);
	if (!Style)
		return "";

	return Style.Get_Name();
};
CDocument.prototype.private_GetElementPageIndex = function(ElementPos, PageIndex, ColumnIndex, ColumnsCount)
{
	var Element = this.Content[ElementPos];
	if (!Element)
		return 0;

	var StartPage   = Element.Get_StartPage_Relative();
	var StartColumn = Element.Get_StartColumn();

	return ColumnIndex - StartColumn + (PageIndex - StartPage) * ColumnsCount;
};
CDocument.prototype.private_GetElementPageIndexByXY = function(ElementPos, X, Y, PageIndex)
{
	var Element = this.Content[ElementPos];
	if (!Element)
		return 0;

	var Page = this.Pages[PageIndex];
	if (!Page)
		return 0;

	var PageSection = null;
	for (var SectionIndex = 0, SectionsCount = Page.Sections.length; SectionIndex < SectionsCount; ++SectionIndex)
	{
		if (Page.Sections[SectionIndex].Pos <= ElementPos && ElementPos <= Page.Sections[SectionIndex].EndPos)
		{
			PageSection = Page.Sections[SectionIndex];
			break;
		}
	}

	if (!PageSection)
		return 0;

	var ElementStartPage   = Element.Get_StartPage_Relative();
	var ElementStartColumn = Element.Get_StartColumn();
	var ElementPagesCount  = Element.Get_PagesCount();

	var ColumnsCount = PageSection.Columns.length;
	var StartColumn  = 0;
	var EndColumn    = ColumnsCount - 1;

	if (PageIndex === ElementStartPage)
	{
		StartColumn = Element.Get_StartColumn();
		EndColumn   = Math.min(ElementStartColumn + ElementPagesCount - 1, ColumnsCount - 1);
	}
	else
	{
		StartColumn = 0;
		EndColumn   = Math.min(ElementPagesCount - ElementStartColumn + (PageIndex - ElementStartPage) * ColumnsCount, ColumnsCount - 1);
	}

	// TODO: Разобраться с ситуацией, когда пустые колонки стоят не только в конце
	while (true === PageSection.Columns[EndColumn].Empty && EndColumn > StartColumn)
		EndColumn--;

	var ResultColumn = EndColumn;
	for (var ColumnIndex = StartColumn; ColumnIndex < EndColumn; ++ColumnIndex)
	{
		if (X < (PageSection.Columns[ColumnIndex].XLimit + PageSection.Columns[ColumnIndex + 1].X) / 2)
		{
			ResultColumn = ColumnIndex;
			break;
		}
	}

	return this.private_GetElementPageIndex(ElementPos, PageIndex, ResultColumn, ColumnsCount);
};
CDocument.prototype.Get_DocumentPagePositionByContentPosition = function(ContentPosition)
{
	if (!ContentPosition)
		return null;

	var Para    = null;
	var ParaPos = 0;
	var Count   = ContentPosition.length;
	for (; ParaPos < Count; ++ParaPos)
	{
		var Element = ContentPosition[ParaPos].Class;
		if (Element instanceof Paragraph)
		{
			Para = Element;
			break;
		}
	}

	if (!Para)
		return null;

	var ParaContentPos = new CParagraphContentPos();
	for (var Pos = ParaPos; Pos < Count; ++Pos)
	{
		ParaContentPos.Update(ContentPosition[Pos].Position, Pos - ParaPos);
	}

	var ParaPos = Para.Get_ParaPosByContentPos(ParaContentPos);
	if (!ParaPos)
		return;

	var Result    = new CDocumentPagePosition();
	Result.Page   = Para.Get_AbsolutePage(ParaPos.Page);
	Result.Column = Para.Get_AbsoluteColumn(ParaPos.Page);

	return Result;
};
CDocument.prototype.private_GetPageSectionByContentPosition = function(PageIndex, ContentPosition)
{
	var Page = this.Pages[PageIndex];
	if (!Page || !Page.Sections || Page.Sections.length <= 1)
		return 0;

	var SectionIndex = 0;
	for (var SectionsCount = Page.Sections.length; SectionIndex < SectionsCount; ++SectionIndex)
	{
		var Section = Page.Sections[SectionIndex];
		if (Section.Pos <= ContentPosition && ContentPosition <= Section.EndPos)
			break;
	}

	if (SectionIndex >= Page.Sections.length)
		return 0;

	return SectionIndex;
};
CDocument.prototype.Update_ColumnsMarkupFromRuler = function(oNewMarkup)
{
	var oSectPr = oNewMarkup.SectPr;
	if (!oSectPr)
		return;

	if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Document_SectPr))
	{
		this.StartAction(AscDFH.historydescription_Document_SetColumnsFromRuler);

		oSectPr.Set_Columns_EqualWidth(oNewMarkup.EqualWidth);

		var nLeft  = oNewMarkup.X;
		var nRight = oSectPr.GetPageWidth() - oNewMarkup.R;

		if (this.IsMirrorMargins() && 1 === oNewMarkup.PageIndex % 2)
		{
			nLeft  = oSectPr.GetPageWidth() - oNewMarkup.R;
			nRight = oNewMarkup.X;
		}

		var nGutter = oSectPr.GetGutter();
		if (nGutter > 0.001 && !this.IsGutterAtTop())
		{
			if (oSectPr.IsGutterRTL())
				nRight = Math.max(0, nRight - nGutter);
			else
				nLeft = Math.max(0, nLeft - nGutter);
		}

		oSectPr.SetPageMargins(nLeft, undefined, nRight, undefined);

		if (false === oNewMarkup.EqualWidth)
		{
			for (var Index = 0, Count = oNewMarkup.Cols.length; Index < Count; ++Index)
			{
				oSectPr.Set_Columns_Col(Index, oNewMarkup.Cols[Index].W, oNewMarkup.Cols[Index].Space);
			}
		}
		else
		{
			oSectPr.Set_Columns_Space(oNewMarkup.Space);
			oSectPr.Set_Columns_Num(oNewMarkup.Num);
		}

		this.Recalculate();
		this.UpdateSelection();
		this.UpdateInterface();
		this.UpdateRulers();
		this.FinalizeAction();
	}
};
CDocument.prototype.Set_ColumnsProps = function(ColumnsProps)
{
	if (this.IsSelectionUse())
	{
		if (docpostype_DrawingObjects === this.GetDocPosType())
			return;

		// К селекту мы применяем колонки не так как ворд.
		// Элементы попавшие в селект полностью входят в  новую секцию, даже если они выделены частично.

		var nStartPos  = this.Selection.StartPos;
		var nEndPos    = this.Selection.EndPos;
		var nDirection = 1;

		if (nEndPos < nStartPos)
		{
			nStartPos  = this.Selection.EndPos;
			nEndPos    = this.Selection.StartPos;
			nDirection = -1;
		}

		var oStartSectPr = this.SectionsInfo.Get_SectPr(nStartPos).SectPr;
		var oEndSectPr   = this.SectionsInfo.Get_SectPr(nEndPos).SectPr;
		if (!oStartSectPr || !oEndSectPr)
			return;

		if (this.Document_Is_SelectionLocked(AscCommon.changestype_Document_SectPr))
			return;

		this.StartAction(AscDFH.historydescription_Document_SetColumnsProps);

		var oEndParagraph = null;
		if (type_Paragraph !== this.Content[nEndPos].GetType())
		{
			oEndParagraph = new Paragraph(this.DrawingDocument, this);
			this.Add_ToContent(nEndPos + 1, oEndParagraph);
		}
		else
		{
			oEndParagraph = this.Content[nEndPos];
		}

		if (nStartPos > 0
			&& (type_Paragraph !== this.Content[nStartPos - 1].GetType()
			|| !this.Content[nStartPos - 1].Get_SectionPr()))
		{
			var oSectPr = new CSectionPr(this);
			oSectPr.Copy(oStartSectPr, false);

			var oStartParagraph = new Paragraph(this.DrawingDocument, this);
			this.Add_ToContent(nStartPos, oStartParagraph);
			oStartParagraph.Set_SectionPr(oSectPr, true);

			nStartPos++;
			nEndPos++;
		}

		oEndSectPr.Set_Type(c_oAscSectionBreakType.Continuous);
		var oSectPr = new CSectionPr(this);
		oSectPr.Copy(oEndSectPr, false);
		oEndParagraph.Set_SectionPr(oSectPr, true);

		oSectPr.SetColumnProps(ColumnsProps);

		for (var nIndex = nStartPos; nIndex < nEndPos; ++nIndex)
		{
			var oElement = this.Content[nIndex];
			if (type_Paragraph === oElement.GetType())
			{
				var oCurSectPr = oElement.Get_SectionPr();
				if (oCurSectPr)
					oCurSectPr.SetColumnProps(ColumnsProps);
			}
		}

		if (nDirection >= 0)
		{
			this.Selection.StartPos = nStartPos;
			this.Selection.EndPos   = nEndPos;
		}
		else
		{
			this.Selection.StartPos = nEndPos;
			this.Selection.EndPos   = nStartPos;
		}

		this.Recalculate();
		this.UpdateSelection();
		this.UpdateInterface();
		this.UpdateRulers();
		this.FinalizeAction();
	}
	else
	{
		var CurPos = this.CurPos.ContentPos;
		var SectPr = this.SectionsInfo.Get_SectPr(CurPos).SectPr;

		if (!SectPr)
			return;

		if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Document_SectPr))
		{
			this.StartAction(AscDFH.historydescription_Document_SetColumnsProps);

			SectPr.SetColumnProps(ColumnsProps);

			this.Recalculate();
			this.UpdateSelection();
			this.UpdateInterface();
			this.UpdateRulers();
			this.FinalizeAction();
		}
	}
};
CDocument.prototype.GetTopDocumentContent = function()
{
	return this;
};
CDocument.prototype.private_RecalculateNumbering = function(Elements)
{
	if (true === AscCommon.g_oIdCounter.m_bLoad)
		return;

	for (var Index = 0, Count = Elements.length; Index < Count; ++Index)
	{
		var Element = Elements[Index];
		if (type_Paragraph === Element.Get_Type())
			this.History.Add_RecalcNumPr(Element.GetNumPr());
		else if (type_Paragraph === Element.Get_Type())
		{
			var ParaArray = [];
			Element.GetAllParagraphs({All : true}, ParaArray);

			for (var ParaIndex = 0, ParasCount = ParaArray.length; ParaIndex < ParasCount; ++ParaIndex)
			{
				var Para = ParaArray[ParaIndex];
				this.History.Add_RecalcNumPr(Element.GetNumPr());
			}
		}
	}
};
CDocument.prototype.Set_SectionProps = function(Props)
{
	var CurPos = this.CurPos.ContentPos;
	var SectPr = this.SectionsInfo.Get_SectPr(CurPos).SectPr;

	if (SectPr && false === this.Document_Is_SelectionLocked(AscCommon.changestype_Document_SectPr))
	{
		this.StartAction(AscDFH.historydescription_Document_SetSectionProps);

		if (undefined !== Props.get_W() || undefined !== Props.get_H())
		{
			var PageW = undefined !== Props.get_W() ? Props.get_W() : SectPr.GetPageWidth();
			var PageH = undefined !== Props.get_H() ? Props.get_H() : SectPr.GetPageHeight();
			SectPr.SetPageSize(PageW, PageH);
		}

		if (undefined !== Props.get_LeftMargin() || undefined !== Props.get_TopMargin() || undefined !== Props.get_RightMargin() || undefined !== Props.get_BottomMargin())
		{
			// Внутри функции идет разруливания, если какое то значение undefined
			SectPr.SetPageMargins(Props.get_LeftMargin(), Props.get_TopMargin(), Props.get_RightMargin(), Props.get_BottomMargin());
		}

		if (undefined !== Props.get_HeaderDistance())
		{
			SectPr.SetPageMarginHeader(Props.get_HeaderDistance());
		}

		if (undefined !== Props.get_FooterDistance())
		{
			SectPr.SetPageMarginFooter(Props.get_FooterDistance());
		}

		if (undefined !== Props.get_Gutter())
			SectPr.SetGutter(Props.get_Gutter());

		if (undefined !== Props.get_GutterRTL())
			SectPr.SetGutterRTL(Props.get_GutterRTL());

		if (undefined !== Props.get_GutterAtTop())
			this.SetGutterAtTop(Props.get_GutterAtTop());

		if (undefined !== Props.get_MirrorMargins())
			this.SetMirrorMargins(Props.get_MirrorMargins());

		if (undefined !== Props.get_Orientation())
			SectPr.SetOrientation(Props.get_Orientation(), false);

		this.Recalculate();
		this.UpdateSelection();
		this.UpdateInterface();
		this.UpdateRulers();
		this.FinalizeAction();
	}
};
CDocument.prototype.Get_SectionProps = function()
{
	var CurPos = this.CurPos.ContentPos;
	var SectPr = this.SectionsInfo.Get_SectPr(CurPos).SectPr;

	return new Asc.CDocumentSectionProps(SectPr, this);
};
/**
 * Получаем ширину текущей колонки
 * @returns {number}
 */
CDocument.prototype.GetCurrentColumnWidth = function()
{
	var nCurPos = 0;
	if (this.Controller === this.LogicDocumentController)
		nCurPos = this.Selection.Use ? this.Selection.EndPos : this.CurPos.ContentPos;
	else
		nCurPos = this.CurPos.ContentPos;

	var oSectPr       = this.SectionsInfo.Get_SectPr(nCurPos).SectPr;
	var nColumnsCount = oSectPr.Get_ColumnsCount();

	if (nColumnsCount > 1)
	{
		var oParagraph = this.GetCurrentParagraph();
		if (!oParagraph)
			return 0;

		var nCurrentColumn = oParagraph.Get_CurrentColumn();
		return oSectPr.Get_ColumnWidth(nCurrentColumn);
	}

	return oSectPr.GetContentFrameWidth();
};
CDocument.prototype.Get_FirstParagraph = function()
{
	if (type_Paragraph == this.Content[0].GetType())
		return this.Content[0];
	else if (type_Table == this.Content[0].GetType())
		return this.Content[0].Get_FirstParagraph();

	return null;
};
/**
 * Обработчик нажатия кнопки IncreaseIndent в меню.
 */
CDocument.prototype.IncreaseIndent = function()
{
	if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Properties))
	{
		this.StartAction(AscDFH.historydescription_Document_IncParagraphIndent);
		this.IncreaseDecreaseIndent(true);
		this.UpdateSelection();
		this.UpdateInterface();
		this.Recalculate();
		this.FinalizeAction();
	}
};
/**
 * Обработчик нажатия кнопки DecreaseIndent в меню.
 */
CDocument.prototype.DecreaseIndent = function()
{
	if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Properties))
	{
		this.StartAction(AscDFH.historydescription_Document_DecParagraphIndent);
		this.IncreaseDecreaseIndent(false);
		this.UpdateSelection();
		this.UpdateInterface();
		this.Recalculate();
		this.FinalizeAction();
	}
};
/**
 * Получаем размеры текущей колонки (используется при вставке изображения).
 */
CDocument.prototype.GetColumnSize = function()
{
	return this.Controller.GetColumnSize();
};
CDocument.prototype.private_OnSelectionEnd = function()
{
	this.Api.sendEvent("asc_onSelectionEnd");
};
CDocument.prototype.AddPageCount = function()
{
	if (false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content))
	{
		this.StartAction(AscDFH.historydescription_Document_AddPageCount);
		this.AddToParagraph(new ParaPageCount(this.Pages.length));
		this.FinalizeAction();
	}
};
//----------------------------------------------------------------------------------------------------------------------
// Settings
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.GetCompatibilityMode = function()
{
	return this.Settings.CompatibilityMode;
};
CDocument.prototype.GetSdtGlobalColor = function()
{
	return this.Settings.SdtSettings.Color;
};
CDocument.prototype.SetSdtGlobalColor = function(r, g, b)
{
	var oNewColor = new CDocumentColor(r, g, b);
	if (!oNewColor.Compare(this.Settings.SdtSettings.Color))
	{
		var oNewSettings = this.Settings.SdtSettings.Copy();
		oNewSettings.Color = oNewColor;

		this.History.Add(new CChangesDocumentSdtGlobalSettings(this, this.Settings.SdtSettings, oNewSettings));
		this.Settings.SdtSettings = oNewSettings;

		this.OnChangeSdtGlobalSettings();
	}
};
CDocument.prototype.GetSdtGlobalShowHighlight = function()
{
	return this.Settings.SdtSettings.ShowHighlight;
};
CDocument.prototype.SetSdtGlobalShowHighlight = function(isShow)
{
	if (this.Settings.SdtSettings.ShowHighlight !== isShow)
	{
		var oNewSettings = this.Settings.SdtSettings.Copy();
		oNewSettings.ShowHighlight = isShow;

		this.History.Add(new CChangesDocumentSdtGlobalSettings(this, this.Settings.SdtSettings, oNewSettings));
		this.Settings.SdtSettings = oNewSettings;

		this.OnChangeSdtGlobalSettings();
	}
};
CDocument.prototype.OnChangeSdtGlobalSettings = function()
{
	this.GetApi().sync_OnChangeSdtGlobalSettings();
};
CDocument.prototype.IsSplitPageBreakAndParaMark = function()
{
	return this.Settings.SplitPageBreakAndParaMark;
};
CDocument.prototype.IsDoNotExpandShiftReturn = function()
{
	return this.Settings.DoNotExpandShiftReturn;
};
/**
 * Проверяем все ли параметры SdtSettings выставлены по умолчанию
 * @returns {boolean}
 */
CDocument.prototype.IsSdtGlobalSettingsDefault = function()
{
	return this.Settings.SdtSettings.IsDefault();
};
/**
 * Добавляем специальный контейнер в виде чекбокса
 * @param oPr {?CSdtCheckBoxPr}
 * @returns {CInlineLevelSdt | CBlockLevelSdt}
 */
CDocument.prototype.AddContentControlCheckBox = function(oPr)
{
	this.RemoveTextSelection();

	if (!oPr)
		oPr = new CSdtCheckBoxPr();

	var oTextPr = this.GetDirectTextPr();
	var oCC = this.AddContentControl(c_oAscSdtLevelType.Inline);
	if (!oCC)
		return;

	oCC.ApplyCheckBoxPr(oPr, oTextPr);
	oCC.MoveCursorToStartPos();

	this.UpdateSelection();
	this.UpdateTracks();

	return oCC;
};
/**
 * Добавляем специальный контейнер для картинок
 * @returns {CInlineLevelSdt | CBlockLevelSdt}
 */
CDocument.prototype.AddContentControlPicture = function()
{
	this.RemoveTextSelection();

	var oCC = this.AddContentControl(c_oAscSdtLevelType.Inline);
	if (!oCC)
		return null;

	oCC.ApplyPicturePr(true);
	return oCC;
};
/**
 * Добавляем контйенер с полем для спискам
 * @param oPr {?CSdtComboBoxPr}
 */
CDocument.prototype.AddContentControlComboBox = function(oPr)
{
	this.RemoveTextSelection();

	if (!oPr)
	{
		oPr = new CSdtComboBoxPr();
		oPr.AddItem(AscCommon.translateManager.getValue("Choose an item."), "");
	}

	var oCC = this.AddContentControl(c_oAscSdtLevelType.Inline);
	if (!oCC)
		return null;

	oCC.ApplyComboBoxPr(oPr);
	oCC.SelectContentControl();
	return oCC;
};
/**
 * Добавляем контейнер с выпалающим списком
 * @param oPr {?CSdtComboBoxPr}
 */
CDocument.prototype.AddContentControlDropDownList = function(oPr)
{
	this.RemoveTextSelection();

	if (!oPr)
	{
		oPr = new CSdtComboBoxPr();
		oPr.AddItem(AscCommon.translateManager.getValue("Choose an item."), "");
	}

	var oCC = this.AddContentControl(c_oAscSdtLevelType.Inline);
	if (!oCC)
		return null;

	oCC.ApplyDropDownListPr(oPr);
	oCC.SelectContentControl();
	return oCC;
};
/**
 * Добавляем специальный контейнер с выбором даты
 * @param oPr {?CSdtDatePickerPr}
 */
CDocument.prototype.AddContentControlDatePicker = function(oPr)
{
	this.RemoveTextSelection();

	if (!oPr)
		oPr = new CSdtDatePickerPr();

	var oCC = this.AddContentControl(c_oAscSdtLevelType.Inline);
	if (!oCC)
		return null;

	oCC.ApplyDatePickerPr(oPr);
	oCC.SelectContentControl();
	return oCC;
};
/**
 * Выставляем глобальный параметр, находится ли переплет наверху документа
 * @param {boolean} isGutterAtTop
 */
CDocument.prototype.SetGutterAtTop = function(isGutterAtTop)
{
	if (isGutterAtTop !== this.Settings.GutterAtTop)
	{
		this.History.Add(new CChangesDocumentSettingsGutterAtTop(this, this.Settings.GutterAtTop, isGutterAtTop));
		this.Settings.GutterAtTop = isGutterAtTop;
	}
};
/**
 * Проверяем находится ли переплет наверху документа
 * @returns {boolean}
 */
CDocument.prototype.IsGutterAtTop = function()
{
	return this.Settings.GutterAtTop;
};
/**
 * Выставляем зеркальные отступы
 * @param {boolean} isMirror
 */
CDocument.prototype.SetMirrorMargins = function(isMirror)
{
	if (isMirror !== this.Settings.MirrorMargins)
	{
		this.History.Add(new CChangesDocumentSettingsMirrorMargins(this, this.Settings.MirrorIndent, isMirror));
		this.Settings.MirrorMargins = isMirror;
	}
};
/**
 * Проверяем зеркальные ли отступы
 * @returns {boolean}
 */
CDocument.prototype.IsMirrorMargins = function()
{
	return this.Settings.MirrorMargins;
};
//----------------------------------------------------------------------------------------------------------------------
// Math
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.Set_MathProps = function(MathProps)
{
	var SelectedInfo = this.GetSelectedElementsInfo();
	if (null !== SelectedInfo.Get_Math() && false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content))
	{
		this.StartAction(AscDFH.historydescription_Document_SetMathProps);

		var ParaMath = SelectedInfo.Get_Math();
		ParaMath.Set_MenuProps(MathProps);

		this.Recalculate();
		this.UpdateSelection();
		this.UpdateInterface();
		this.FinalizeAction();
	}
};
//----------------------------------------------------------------------------------------------------------------------
// Statistics (Функции для работы со статистикой)
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.Statistics_Start = function()
{
	this.Statistics.Start();
};
CDocument.prototype.Statistics_GetParagraphsInfo = function()
{
	var Count   = this.Content.length;
	var CurPage = this.Statistics.CurPage;

	var Index    = 0;
	var CurIndex = 0;
	for (Index = this.Statistics.StartPos; Index < Count; ++Index, ++CurIndex)
	{
		var Element = this.Content[Index];
		Element.CollectDocumentStatistics(this.Statistics);

		if (CurIndex > 20)
		{
			this.Statistics.Next_ParagraphsInfo(Index + 1);
			break;
		}
	}

	if (Index >= Count)
		this.Statistics.Stop_ParagraphsInfo();
};
CDocument.prototype.Statistics_GetPagesInfo = function()
{
	this.Statistics.Update_Pages(this.Pages.length);

	if (null !== this.FullRecalc.Id)
	{
		this.Statistics.Next_PagesInfo();
	}
	else
	{
		for (var CurPage = 0, PagesCount = this.Pages.length; CurPage < PagesCount; ++CurPage)
		{
			this.DrawingObjects.documentStatistics(CurPage, this.Statistics);
		}

		this.Statistics.Stop_PagesInfo();
	}
};
CDocument.prototype.Statistics_Stop = function()
{
	this.Statistics.Stop();
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с MailMerge
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.Start_MailMerge = function(MailMergeMap, arrFields)
{
	this.EndPreview_MailMergeResult();

	this.MailMergeMap    = MailMergeMap;
	this.MailMergeFields = arrFields;
	editor.sync_HighlightMailMergeFields(this.MailMergeFieldsHighlight);
	editor.sync_StartMailMerge();
};
CDocument.prototype.Get_MailMergeReceptionsCount = function()
{
	if (null === this.MailMergeMap || !this.MailMergeMap)
		return 0;

	return this.MailMergeMap.length;
};
CDocument.prototype.Get_MailMergeFieldsNameList = function()
{
	if (this.Get_MailMergeReceptionsCount() <= 0)
		return this.MailMergeFields;

	// Предполагаем, что в первом элементе перечислены все поля
	var Element = this.MailMergeMap[0];
	var aList = [];
	for (var sId in Element)
	{
		aList.push(sId);
	}

	return aList;
};
CDocument.prototype.Add_MailMergeField = function(Name)
{
	if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Content))
	{
		this.StartAction(AscDFH.historydescription_Document_AddMailMergeField);

		var oField = new ParaField(fieldtype_MERGEFIELD, [Name], []);
		var oRun = new ParaRun();
		oRun.AddText("«" + Name + "»");
		oField.Add_ToContent(0, oRun);

		this.Register_Field(oField);
		this.AddToParagraph(oField);
		this.UpdateInterface();
		this.FinalizeAction();
	}
};
CDocument.prototype.Set_HightlighMailMergeFields = function(Value)
{
	if (Value !== this.MailMergeFieldsHighlight)
	{
		this.MailMergeFieldsHighlight = Value;
		this.DrawingDocument.ClearCachePages();
		this.DrawingDocument.FirePaint();
		this.DrawingDocument.Update_FieldTrack(false);
		editor.sync_HighlightMailMergeFields(this.MailMergeFieldsHighlight);
	}
};
CDocument.prototype.Preview_MailMergeResult = function(Index)
{
	if (null === this.MailMergeMap)
		return;

	if (true !== this.MailMergePreview)
	{
		this.MailMergePreview = true;
		this.RemoveSelection();
		AscCommon.CollaborativeEditing.Set_GlobalLock(true);
	}

	this.FieldsManager.Update_MailMergeFields(this.MailMergeMap[Index]);
	this.RecalculateFromStart(true);

	editor.sync_PreviewMailMergeResult(Index);
};
CDocument.prototype.EndPreview_MailMergeResult = function()
{
	if (null === this.MailMergeMap || true !== this.MailMergePreview)
		return;

	this.MailMergePreview = false;
	AscCommon.CollaborativeEditing.Set_GlobalLock(false);

	this.FieldsManager.Restore_MailMergeTemplate();
	this.RecalculateFromStart(true);

	editor.sync_EndPreviewMailMergeResult();
};
CDocument.prototype.Get_MailMergeReceptionsList = function()
{
	var aList = [];

	var aHeaders = [];
	var nCount = this.MailMergeMap.length;
	if (nCount <= 0)
		return [this.MailMergeFields];

	for (var sId in this.MailMergeMap[0])
		aHeaders.push(sId);

	var nHeadersCount = aHeaders.length;

	aList.push(aHeaders);
	for (var nIndex = 0; nIndex < nCount; nIndex++)
	{
		var aReception = [];
		var oReception = this.MailMergeMap[nIndex];
		for (var nHeaderIndex = 0; nHeaderIndex < nHeadersCount; nHeaderIndex++)
		{
			var sValue = oReception[aHeaders[nHeaderIndex]];
			aReception.push(sValue ? sValue : "");
		}

		aList.push(aReception);
	}

	return aList;
};
CDocument.prototype.Get_MailMergeFieldValue = function(nIndex, sName)
{
	if (null === this.MailMergeMap)
		return null;

	return this.MailMergeMap[nIndex][sName];
};
CDocument.prototype.Get_MailMergedDocument = function(_nStartIndex, _nEndIndex)
{
	var nStartIndex = (undefined !== _nStartIndex ? Math.max(0, _nStartIndex) : 0);
	var nEndIndex   = (undefined !== _nEndIndex   ? Math.min(_nEndIndex, this.MailMergeMap.length - 1) : this.MailMergeMap.length - 1);

	if (null === this.MailMergeMap || nStartIndex > nEndIndex || nStartIndex >= this.MailMergeMap.length)
		return null;

	AscCommon.History.TurnOff();
	AscCommon.g_oTableId.TurnOff();

	var LogicDocument = new CDocument(undefined, false);
	AscCommon.History.Document = this;

	// Копируем стили, они все одинаковые для всех документов
	LogicDocument.Styles = this.Styles.Copy();

	// Нумерацию придется повторить для каждого отдельного файла
	LogicDocument.Numbering.Clear();

	LogicDocument.DrawingDocument = this.DrawingDocument;

	LogicDocument.theme = this.theme.createDuplicate();
	LogicDocument.clrSchemeMap   = this.clrSchemeMap.createDuplicate();

	var FieldsManager = this.FieldsManager;

	var ContentCount = this.Content.length;
	var OverallIndex = 0;
	this.ForceCopySectPr = true;

	for (var Index = nStartIndex; Index <= nEndIndex; Index++)
	{
		// Подменяем ссылку на менеджер полей, чтобы скопированные поля регистрировались в новом классе
		this.FieldsManager = LogicDocument.FieldsManager;
		var NewNumbering = this.Numbering.CopyAllNums(LogicDocument.Numbering);

		LogicDocument.Numbering.AppendAbstractNums(NewNumbering.AbstractNum);
		LogicDocument.Numbering.AppendNums(NewNumbering.Num);

		this.CopyNumberingMap = NewNumbering.NumMap;

		for (var ContentIndex = 0; ContentIndex < ContentCount; ContentIndex++)
		{
			LogicDocument.Content[OverallIndex++] = this.Content[ContentIndex].Copy(LogicDocument, this.DrawingDocument);

			if (type_Paragraph === this.Content[ContentIndex].Get_Type())
			{
				var ParaSectPr = this.Content[ContentIndex].Get_SectionPr();
				if (ParaSectPr)
				{
					var NewParaSectPr = new CSectionPr();
					NewParaSectPr.Copy(ParaSectPr, true);
					LogicDocument.Content[OverallIndex - 1].Set_SectionPr(NewParaSectPr, false);
				}
			}
		}

		// Добавляем дополнительный параграф с окончанием секции
		var SectionPara = new Paragraph(this.DrawingDocument, this);
		var SectPr = new CSectionPr();
		SectPr.Copy(this.SectPr, true);
		SectPr.Set_Type(c_oAscSectionBreakType.NextPage);
		SectionPara.Set_SectionPr(SectPr, false);
		LogicDocument.Content[OverallIndex++] = SectionPara;

		LogicDocument.FieldsManager.Replace_MailMergeFields(this.MailMergeMap[Index]);
	}

	this.CopyNumberingMap = null;
	this.ForceCopySectPr  = false;

	// Добавляем дополнительный параграф в самом конце для последней секции документа
	var SectPara = new Paragraph(this.DrawingDocument, this);
	LogicDocument.Content[OverallIndex++] = SectPara;
	LogicDocument.SectPr.Copy(this.SectPr);
	LogicDocument.SectPr.Set_Type(c_oAscSectionBreakType.Continuous);

	for (var Index = 0, Count = LogicDocument.Content.length; Index < Count; Index++)
	{
		if (0 === Index)
			LogicDocument.Content[Index].Prev = null;
		else
			LogicDocument.Content[Index].Prev = LogicDocument.Content[Index - 1];

		if (Count - 1 === Index)
			LogicDocument.Content[Index].Next = null;
		else
			LogicDocument.Content[Index].Next = LogicDocument.Content[Index + 1];

		LogicDocument.Content[Index].Parent = LogicDocument;
	}

	this.FieldsManager = FieldsManager;
	AscCommon.g_oTableId.TurnOn();
	AscCommon.History.TurnOn();

	return LogicDocument;
};
CDocument.prototype.ContinueTrackRevisions = function()
{
	this.TrackRevisionsManager.ContinueTrackRevisions();
};
CDocument.prototype.SetTrackRevisions = function(bTrack)
{
	this.TrackRevisions = bTrack;
};
CDocument.prototype.GetNextRevisionChange = function()
{
	this.TrackRevisionsManager.ContinueTrackRevisions();
	var oChange = this.TrackRevisionsManager.GetNextChange();
	if (oChange)
	{
		this.RemoveSelection();
		this.private_SelectRevisionChange(oChange);
		this.UpdateSelection(false);
		this.UpdateInterface(true);
	}
};
CDocument.prototype.GetPrevRevisionChange = function()
{
	this.TrackRevisionsManager.ContinueTrackRevisions();
	var oChange = this.TrackRevisionsManager.GetPrevChange();
	if (oChange)
	{
		this.RemoveSelection();
		this.private_SelectRevisionChange(oChange);
		this.UpdateSelection(false);
		this.UpdateInterface(true);
	}
};
CDocument.prototype.GetRevisionsChangeElement = function(nDirection, oCurrentElement)
{
	return this.private_GetRevisionsChangeElement(nDirection, oCurrentElement).GetFoundedElement();
};
CDocument.prototype.private_GetRevisionsChangeElement = function(nDirection, oCurrentElement)
{
	var oSearchEngine = new CRevisionsChangeParagraphSearchEngine(nDirection, oCurrentElement, this.TrackRevisionsManager);
	if (null === oCurrentElement)
	{
		oCurrentElement = this.GetCurrentParagraph(false, false, {ReturnSelectedTable : true});
		if (null === oCurrentElement)
			return oSearchEngine;

		oSearchEngine.SetCurrentElement(oCurrentElement);
		oSearchEngine.SetFoundedElement(oCurrentElement);
		if (true === oSearchEngine.IsFound())
			return oSearchEngine;
	}

	var oFootnote = oCurrentElement.Parent ? oCurrentElement.Parent.GetTopDocumentContent() : null;
	if (!(oFootnote instanceof CFootEndnote))
		oFootnote = null;

	var HdrFtr = oCurrentElement.GetHdrFtr();
	if (null !== HdrFtr)
	{
		this.private_GetRevisionsChangeElementInHdrFtr(oSearchEngine, HdrFtr);

		if (nDirection > 0)
		{
			if (true !== oSearchEngine.IsFound())
				this.private_GetRevisionsChangeElementInDocument(oSearchEngine, 0);

			if (true !== oSearchEngine.IsFound())
				this.private_GetRevisionsChangeElementInFooters(oSearchEngine, null);
		}
		else
		{
			if (true !== oSearchEngine.IsFound())
				this.private_GetRevisionsChangeElementInFooters(oSearchEngine, null);

			if (true !== oSearchEngine.IsFound())
				this.private_GetRevisionsChangeElementInDocument(oSearchEngine, this.Content.length - 1);
		}


		if (true !== oSearchEngine.IsFound())
			this.private_GetRevisionsChangeElementInHdrFtr(oSearchEngine, null);
	}
	else if (oFootnote)
	{
		this.private_GetRevisionsChangeElementInFooters(oSearchEngine, oFootnote);

		if (nDirection > 0)
		{
			if (true !== oSearchEngine.IsFound())
				this.private_GetRevisionsChangeElementInHdrFtr(oSearchEngine, null);

			if (true !== oSearchEngine.IsFound())
				this.private_GetRevisionsChangeElementInDocument(oSearchEngine, 0);
		}
		else
		{
			if (true !== oSearchEngine.IsFound())
				this.private_GetRevisionsChangeElementInDocument(oSearchEngine, this.Content.length - 1);

			if (true !== oSearchEngine.IsFound())
				this.private_GetRevisionsChangeElementInHdrFtr(oSearchEngine, null);
		}

		if (true !== oSearchEngine.IsFound())
			this.private_GetRevisionsChangeElementInFooters(oSearchEngine, null);
	}
	else
	{
		var Pos = (true === this.Selection.Use && docpostype_DrawingObjects !== this.GetDocPosType() ? (this.Selection.StartPos <= this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos) : this.CurPos.ContentPos);
		this.private_GetRevisionsChangeElementInDocument(oSearchEngine, Pos);

		if (nDirection > 0)
		{
			if (true !== oSearchEngine.IsFound())
				this.private_GetRevisionsChangeElementInFooters(oSearchEngine, null);

			if (true !== oSearchEngine.IsFound())
				this.private_GetRevisionsChangeElementInHdrFtr(oSearchEngine, null);
		}
		else
		{
			if (true !== oSearchEngine.IsFound())
				this.private_GetRevisionsChangeElementInHdrFtr(oSearchEngine, null);

			if (true !== oSearchEngine.IsFound())
				this.private_GetRevisionsChangeElementInFooters(oSearchEngine, null);
		}

		if (true !== oSearchEngine.IsFound())
			this.private_GetRevisionsChangeElementInDocument(oSearchEngine, nDirection > 0 ? 0 : this.Content.length - 1);
	}

	return oSearchEngine;
};
CDocument.prototype.private_GetRevisionsChangeElementInDocument = function(SearchEngine, Pos)
{
	var Direction = SearchEngine.GetDirection();
	this.Content[Pos].GetRevisionsChangeElement(SearchEngine);
	while (true !== SearchEngine.IsFound())
	{
		Pos = (Direction > 0 ? Pos + 1 : Pos - 1);
		if (Pos >= this.Content.length || Pos < 0)
			break;

		this.Content[Pos].GetRevisionsChangeElement(SearchEngine);
	}
};
CDocument.prototype.private_GetRevisionsChangeElementInHdrFtr = function(SearchEngine, HdrFtr)
{
	var AllHdrFtrs = this.SectionsInfo.GetAllHdrFtrs();
	var Count = AllHdrFtrs.length;

	if (Count <= 0)
		return;

	var Pos = -1;
	if (null !== HdrFtr)
	{
		for (var Index = 0; Index < Count; ++Index)
		{
			if (HdrFtr === AllHdrFtrs[Index])
			{
				Pos = Index;
				break;
			}
		}
	}

	var Direction = SearchEngine.GetDirection();
	if (Pos < 0 || Pos >= Count)
	{
		if (Direction > 0)
			Pos = 0;
		else
			Pos = Count - 1;
	}

	AllHdrFtrs[Pos].GetRevisionsChangeElement(SearchEngine);
	while (true !== SearchEngine.IsFound())
	{
		Pos = (Direction > 0 ? Pos + 1 : Pos - 1);
		if (Pos >= Count || Pos < 0)
			break;

		AllHdrFtrs[Pos].GetRevisionsChangeElement(SearchEngine);
	}
};
CDocument.prototype.private_GetRevisionsChangeElementInFooters = function(SearchEngine, oFootnote)
{
	var arrFootnotes = this.GetFootnotesList(null, null);
	var nCount = arrFootnotes.length;
	if (nCount <= 0)
		return;

	var nPos = -1;
	if (oFootnote)
	{
		for (var nIndex = 0; nIndex < nCount; ++nIndex)
		{
			if (arrFootnotes[nPos] === oFootnote)
			{
				nPos = nIndex;
				break;
			}
		}
	}

	var nDirection = SearchEngine.GetDirection();
	if (nPos < 0 || nPos >= nCount)
	{
		if (nDirection > 0)
			nPos = 0;
		else
			nPos = nCount - 1;
	}

	arrFootnotes[nPos].GetRevisionsChangeElement(SearchEngine);
	while (true !== SearchEngine.IsFound())
	{
		nPos = (nDirection > 0 ? nPos + 1 : nPos - 1);
		if (nPos >= nCount || nPos < 0)
			break;

		arrFootnotes[nPos].GetRevisionsChangeElement(SearchEngine);
	}
};
CDocument.prototype.private_SelectRevisionChange = function(oChange, isSkipCompleteCheck)
{
	if (oChange && oChange.get_Paragraph())
	{
		this.RemoveSelection();

		if (oChange.IsComplexChange())
		{
			if (oChange.IsMove())
			{
				this.SelectTrackMove(oChange.GetMoveId(), oChange.IsMoveFrom(), false, false);
			}
		}
		else
		{
			var oElement = oChange.get_Paragraph();

			if (true !== isSkipCompleteCheck && this.TrackRevisionsManager.CompleteTrackChangesForElements([oElement]))
				return;

			if (oElement instanceof Paragraph)
			{
				// Текущую позицию нужно выставить до селекта
				oElement.Set_ParaContentPos(oChange.get_StartPos(), false, -1, -1);
				oElement.Selection.Use = true;
				oElement.Set_SelectionContentPos(oChange.get_StartPos(), oChange.get_EndPos(), false);
				oElement.Document_SetThisElementCurrent(false);
			}
			else if (oElement instanceof CTable)
			{
				oElement.SelectRows(oChange.get_StartPos(), oChange.get_EndPos());
				oElement.Document_SetThisElementCurrent(false);
			}
		}
	}
};
CDocument.prototype.AcceptRevisionChange = function(oChange)
{
	if (oChange)
	{
		var arrRelatedParas = this.TrackRevisionsManager.GetChangeRelatedParagraphs(oChange, true);

		if (this.TrackRevisionsManager.CompleteTrackChangesForElements(arrRelatedParas))
		{
			this.Document_UpdateInterfaceState();
			this.Document_UpdateSelectionState();
			return;
		}

		if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_None, {
			Type      : changestype_2_ElementsArray_and_Type,
			Elements  : arrRelatedParas,
			CheckType : AscCommon.changestype_Paragraph_Properties
		}))
		{
			this.StartAction(AscDFH.historydescription_Document_AcceptRevisionChange);

			var isTrackRevision = this.IsTrackRevisions();
			if (isTrackRevision)
				this.SetTrackRevisions(false);

			if (oChange.IsComplexChange())
			{
				if (oChange.IsMove())
					this.private_ProcessMoveReview(oChange, true);
			}
			else
			{
				this.private_SelectRevisionChange(oChange);
				this.AcceptRevisionChanges(oChange.GetType(), false);
			}

			if (isTrackRevision)
				this.SetTrackRevisions(isTrackRevision);

			this.FinalizeAction();
		}
	}
};
CDocument.prototype.private_ProcessMoveReview = function(oChange, isAccept)
{
	var oTrackRevisionsManager = this.GetTrackRevisionsManager();

	var sMoveId     = oChange.GetMoveId();
	var isMovedDown = oChange.IsMovedDown();

	var oThis = this;

	var oTrackMove = oTrackRevisionsManager.StartProcessReviewMove(sMoveId, oChange.GetUserId());
	function privateProcessChanges(isFrom)
	{
		oTrackMove.SetFrom(isFrom);
		oThis.SelectTrackMove(sMoveId, isFrom, false, false);

		if (isAccept)
			oThis.AcceptRevisionChanges(c_oAscRevisionsChangeType.MoveMark, false);
		else
			oThis.RejectRevisionChanges(c_oAscRevisionsChangeType.MoveMark, false);
	}

	if (isMovedDown)
	{
		privateProcessChanges(false);
		privateProcessChanges(true);
	}
	else
	{
		privateProcessChanges(true);
		privateProcessChanges(false);
	}

	oTrackRevisionsManager.EndProcessReviewMove();
};
CDocument.prototype.RejectRevisionChange = function(oChange)
{
	if (oChange)
	{
		var arrRelatedParas = this.TrackRevisionsManager.GetChangeRelatedParagraphs(oChange, false);

		if (this.TrackRevisionsManager.CompleteTrackChangesForElements(arrRelatedParas))
		{
			this.Document_UpdateInterfaceState();
			this.Document_UpdateSelectionState();
			return;
		}

		if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_None, {
			Type      : changestype_2_ElementsArray_and_Type,
			Elements  : arrRelatedParas,
			CheckType : AscCommon.changestype_Paragraph_Properties
		}))
		{
			this.StartAction(AscDFH.historydescription_Document_RejectRevisionChange);

			var isTrackRevision = this.IsTrackRevisions();
			if (isTrackRevision)
				this.SetTrackRevisions(false);

			if (oChange.IsComplexChange())
			{
				if (oChange.IsMove())
					this.private_ProcessMoveReview(oChange, false);
			}
			else
			{
				this.private_SelectRevisionChange(oChange);
				this.RejectRevisionChanges(oChange.GetType(), false);
			}

			if (isTrackRevision)
				this.SetTrackRevisions(isTrackRevision);

			this.FinalizeAction();
		}
	}
};
CDocument.prototype.AcceptRevisionChangesBySelection = function()
{
	var CurrentChange = this.TrackRevisionsManager.Get_CurrentChange();
	if (null !== CurrentChange)
	{
		this.AcceptRevisionChange(CurrentChange);
	}
	else
	{
		var sMoveId = this.CheckTrackMoveInSelection();
		if (sMoveId)
		{
			var oChange = this.TrackRevisionsManager.GetMoveMarkChange(sMoveId, true, false);
			if (oChange)
			{
				oChange = this.TrackRevisionsManager.CollectMoveChange(oChange);
				return this.AcceptRevisionChange(oChange);
			}
		}

		var SelectedParagraphs = this.GetAllParagraphs({Selected : true});
		var RelatedParas       = this.TrackRevisionsManager.Get_AllChangesRelatedParagraphsBySelectedParagraphs(SelectedParagraphs, true);
		if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_None, {
			Type      : changestype_2_ElementsArray_and_Type,
			Elements  : RelatedParas,
			CheckType : AscCommon.changestype_Paragraph_Content
		}))
		{
			this.StartAction(AscDFH.historydescription_Document_AcceptRevisionChangesBySelection);

			var isTrackRevision = this.IsTrackRevisions();
			if (isTrackRevision)
				this.SetTrackRevisions(false);

			this.AcceptRevisionChanges(undefined, false);

			if (isTrackRevision)
				this.SetTrackRevisions(isTrackRevision);

			this.FinalizeAction();
		}
	}

	this.TrackRevisionsManager.ClearCurrentChange();
	this.GetNextRevisionChange();
};
CDocument.prototype.RejectRevisionChangesBySelection = function()
{
	var CurrentChange = this.TrackRevisionsManager.Get_CurrentChange();
	if (null !== CurrentChange)
	{
		this.RejectRevisionChange(CurrentChange);
	}
	else
	{
		var sMoveId = this.CheckTrackMoveInSelection();
		if (sMoveId)
		{
			var oChange = this.TrackRevisionsManager.GetMoveMarkChange(sMoveId, true, false);
			if (oChange)
			{
				oChange = this.TrackRevisionsManager.CollectMoveChange(oChange);
				return this.RejectRevisionChange(oChange);
			}
		}

		var SelectedParagraphs = this.GetAllParagraphs({Selected : true});
		var RelatedParas       = this.TrackRevisionsManager.Get_AllChangesRelatedParagraphsBySelectedParagraphs(SelectedParagraphs, false);
		if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_None, {
			Type      : changestype_2_ElementsArray_and_Type,
			Elements  : RelatedParas,
			CheckType : AscCommon.changestype_Paragraph_Content
		}))
		{
			this.StartAction(AscDFH.historydescription_Document_AcceptRevisionChangesBySelection);

			var isTrackRevision = this.IsTrackRevisions();
			if (isTrackRevision)
				this.SetTrackRevisions(false);

			this.RejectRevisionChanges(undefined, false);

			if (isTrackRevision)
				this.SetTrackRevisions(isTrackRevision);

			this.FinalizeAction();
		}
	}

	this.TrackRevisionsManager.ClearCurrentChange();
	this.GetNextRevisionChange();
};
CDocument.prototype.AcceptAllRevisionChanges = function(isSkipCheckLock, isCheckEmptyAction)
{
	var _isCheckEmptyAction = (false !== isCheckEmptyAction);

	var RelatedParas = this.TrackRevisionsManager.Get_AllChangesRelatedParagraphs(true);
	if (true === isSkipCheckLock || false === this.IsSelectionLocked(AscCommon.changestype_None, {
			Type      : changestype_2_ElementsArray_and_Type,
			Elements  : RelatedParas,
			CheckType : AscCommon.changestype_Paragraph_Properties
		}))
	{
		this.StartAction(AscDFH.historydescription_Document_AcceptAllRevisionChanges);

		var isTrackRevision = this.IsTrackRevisions();
		if (isTrackRevision)
			this.SetTrackRevisions(false);

		var LogicDocuments = this.TrackRevisionsManager.Get_AllChangesLogicDocuments();
		for (var LogicDocId in LogicDocuments)
		{
			var LogicDoc = AscCommon.g_oTableId.Get_ById(LogicDocId);
			if (LogicDoc)
			{
				LogicDoc.AcceptRevisionChanges(undefined, true);
			}
		}

		if (isTrackRevision)
			this.SetTrackRevisions(isTrackRevision);

		if (true !== isSkipCheckLock && true === this.History.Is_LastPointEmpty())
		{
			this.FinalizeAction(_isCheckEmptyAction);
			return;
		}

		this.RemoveSelection();
		this.private_CorrectDocumentPosition();
		this.Recalculate();
		this.UpdateSelection();
		this.UpdateInterface();
		this.FinalizeAction(_isCheckEmptyAction);
	}
};
CDocument.prototype.RejectAllRevisionChanges = function(isSkipCheckLock, isCheckEmptyAction)
{
	var _isCheckEmptyAction = (false !== isCheckEmptyAction);

	var RelatedParas = this.TrackRevisionsManager.Get_AllChangesRelatedParagraphs(false);
	if (true === isSkipCheckLock || false === this.IsSelectionLocked(AscCommon.changestype_None, {
			Type      : changestype_2_ElementsArray_and_Type,
			Elements  : RelatedParas,
			CheckType : AscCommon.changestype_Paragraph_Properties
		}))
	{
		this.StartAction(AscDFH.historydescription_Document_RejectAllRevisionChanges);

		var isTrackRevision = this.IsTrackRevisions();
		if (isTrackRevision)
			this.SetTrackRevisions(false);

		this.private_RejectAllRevisionChanges();

		if (isTrackRevision)
			this.SetTrackRevisions(isTrackRevision);

		if (true !== isSkipCheckLock && true === this.History.Is_LastPointEmpty())
		{
			this.FinalizeAction(_isCheckEmptyAction);
			return;
		}

		this.RemoveSelection();
		this.private_CorrectDocumentPosition();
		this.Recalculate();
		this.UpdateSelection();
		this.UpdateInterface();
		this.FinalizeAction(_isCheckEmptyAction);
	}
};
CDocument.prototype.private_RejectAllRevisionChanges = function()
{
	var LogicDocuments = this.TrackRevisionsManager.Get_AllChangesLogicDocuments();
	for (var LogicDocId in LogicDocuments)
	{
		var LogicDoc = this.TableId.Get_ById(LogicDocId);
		if (LogicDoc)
		{
			LogicDoc.RejectRevisionChanges(undefined, true);
		}
	}
};
CDocument.prototype.AcceptRevisionChanges = function(nType, bAll)
{
	// Принимаем все изменения, которые попали в селект.
	// Принимаем изменения в следующей последовательности:
	// 1. Изменение настроек параграфа
	// 2. Изменение настроек текста
	// 3. Добавление/удаление текста
	// 4. Добавление/удаление параграфа
	if (docpostype_Content === this.CurPos.Type || true === bAll)
	{
		this.private_AcceptRevisionChanges(nType, bAll);
	}
	else if (docpostype_HdrFtr === this.CurPos.Type)
	{
		this.HdrFtr.AcceptRevisionChanges(nType, bAll);
	}
	else if (docpostype_DrawingObjects === this.CurPos.Type)
	{
		this.DrawingObjects.AcceptRevisionChanges(nType, bAll);
	}
	else if (docpostype_Footnotes === this.CurPos.Type)
	{
		this.Footnotes.AcceptRevisionChanges(nType, bAll);
	}

	if (true !== bAll)
	{
		this.Recalculate();
		this.UpdateInterface();
		this.UpdateSelection();
	}
};
CDocument.prototype.RejectRevisionChanges = function(nType, bAll)
{
	// Отменяем все изменения, которые попали в селект.
	// Отменяем изменения в следующей последовательности:
	// 1. Изменение настроек параграфа
	// 2. Изменение настроек текста
	// 3. Добавление/удаление текста
	// 4. Добавление/удаление параграфа

	if (docpostype_Content === this.CurPos.Type || true === bAll)
	{
		this.private_RejectRevisionChanges(nType, bAll);
	}
	else if (docpostype_HdrFtr === this.CurPos.Type)
	{
		this.HdrFtr.RejectRevisionChanges(nType, bAll);
	}
	else if (docpostype_DrawingObjects === this.CurPos.Type)
	{
		this.DrawingObjects.RejectRevisionChanges(nType, bAll);
	}
	else if (docpostype_Footnotes === this.CurPos.Type)
	{
		this.Footnotes.RejectRevisionChanges(nType, bAll);
	}

	if (true !== bAll)
	{
		this.Recalculate();
		this.UpdateInterface();
		this.UpdateSelection();
	}
};
CDocument.prototype.HaveRevisionChanges = function(isCheckOwnChanges)
{
	this.TrackRevisionsManager.ContinueTrackRevisions();

	if (true === isCheckOwnChanges)
		return this.TrackRevisionsManager.Have_Changes();
	else
		return this.TrackRevisionsManager.HaveOtherUsersChanges();
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с составным вводом
//----------------------------------------------------------------------------------------------------------------------
/**
 * Сообщаем о начале составного ввода текста.
 * @returns {boolean} Начался или нет составной ввод.
 */
CDocument.prototype.Begin_CompositeInput = function()
{
	var bResult = false;
	if (false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content, null, true, this.IsFormFieldEditing()))
	{
		this.StartAction(AscDFH.historydescription_Document_CompositeInput);
		this.DrawingObjects.CreateDocContent();
		this.DrawingDocument.TargetStart();
		this.DrawingDocument.TargetShow();

		if (true === this.IsSelectionUse())
		{
			if (docpostype_DrawingObjects === this.GetDocPosType() && null === this.DrawingObjects.getTargetDocContent())
				this.RemoveSelection();
			else
				this.Remove(1, true, false, true);
		}

		var oPara = this.GetCurrentParagraph();
		if (oPara)
		{
			var oRun = oPara.Get_ElementByPos(oPara.Get_ParaContentPos(false, false));
			if (oRun instanceof ParaRun)
			{
				var oTrackRun = oRun.CheckTrackRevisionsBeforeAdd();
				if (oTrackRun)
				{
					oRun = oTrackRun;
					oRun.Make_ThisElementCurrent();
				}

				this.CompositeInput = {
					Run     : oRun,
					Pos     : oRun.State.ContentPos,
					Length  : 0,
					CanUndo : true
				};

				oRun.Set_CompositeInput(this.CompositeInput);

				bResult = true;
			}
		}

		this.FinalizeAction(false);
	}

	return bResult;
};
CDocument.prototype.Replace_CompositeText = function(arrCharCodes)
{
	if (null === this.CompositeInput)
		return;

	this.StartAction(AscDFH.historydescription_Document_CompositeInputReplace);
	this.Start_SilentMode();
	this.private_RemoveCompositeText(this.CompositeInput.Length);
	for (var nIndex = 0, nCount = arrCharCodes.length; nIndex < nCount; ++nIndex)
	{
		this.private_AddCompositeText(arrCharCodes[nIndex]);
	}
	this.End_SilentMode(false);

	this.Recalculate();
	this.UpdateSelection();
	this.UpdateUndoRedo();
	this.FinalizeAction(false);

	this.private_UpdateCursorXY(true, true);

	if (!this.History.CheckUnionLastPoints())
		this.CompositeInput.CanUndo = false;
};
CDocument.prototype.Set_CursorPosInCompositeText = function(nPos)
{
	if (null === this.CompositeInput)
		return;

	var oRun = this.CompositeInput.Run;

	var nInRunPos = Math.max(Math.min(this.CompositeInput.Pos + nPos, this.CompositeInput.Pos + this.CompositeInput.Length, oRun.Content.length), this.CompositeInput.Pos);
	oRun.State.ContentPos = nInRunPos;
	this.Document_UpdateSelectionState();
};
CDocument.prototype.Get_CursorPosInCompositeText = function()
{
	if (null === this.CompositeInput)
		return 0;

	var oRun = this.CompositeInput.Run;
	var nInRunPos = oRun.State.ContentPos;
	var nPos = Math.min(this.CompositeInput.Length, Math.max(0, nInRunPos - this.CompositeInput.Pos));
	return nPos;
};
CDocument.prototype.End_CompositeInput = function()
{
	if (null === this.CompositeInput)
		return;

	var nLen = this.CompositeInput.Length;

	var oRun = this.CompositeInput.Run;
	oRun.Set_CompositeInput(null);

	if (0 === nLen && true === this.History.CanRemoveLastPoint() && true === this.CompositeInput.CanUndo)
	{
		this.Document_Undo();
		this.History.Clear_Redo();
	}

	this.CompositeInput = null;

    var oController = this.DrawingObjects;
    if(oController)
    {
        var oTargetTextObject = AscFormat.getTargetTextObject(oController);
        if(oTargetTextObject && oTargetTextObject.txWarpStructNoTransform)
        {
            oTargetTextObject.recalcInfo.recalculateTxBoxContent = true;
            oTargetTextObject.recalculateText();
        }
    }

	this.Document_UpdateInterfaceState();

    this.private_UpdateCursorXY(true, true);

	this.DrawingDocument.ClearCachePages();
	this.DrawingDocument.FirePaint();
};
CDocument.prototype.Get_MaxCursorPosInCompositeText = function()
{
	if (null === this.CompositeInput)
		return 0;

	return this.CompositeInput.Length;
};
CDocument.prototype.private_AddCompositeText = function(nCharCode)
{
	var oRun = this.CompositeInput.Run;
	var nPos = this.CompositeInput.Pos + this.CompositeInput.Length;
	var oChar;

	if (para_Math_Run === oRun.Type)
	{
		oChar = new CMathText();
		oChar.add(nCharCode);
	}
	else
	{
		if (32 == nCharCode || 12288 == nCharCode)
			oChar = new ParaSpace();
		else
			oChar = new ParaText(nCharCode);
	}

	oRun.AddToContent(nPos, oChar, true);
	this.CompositeInput.Length++;

	this.Recalculate();
	this.Document_UpdateSelectionState();
};
CDocument.prototype.private_RemoveCompositeText = function(nCount)
{
	var oRun = this.CompositeInput.Run;
	var nPos = this.CompositeInput.Pos + this.CompositeInput.Length;

	var nDelCount = Math.max(0, Math.min(nCount, this.CompositeInput.Length, oRun.Content.length, nPos));
	oRun.Remove_FromContent(nPos - nDelCount, nDelCount, true);
	this.CompositeInput.Length -= nDelCount;

	this.Recalculate();
	this.Document_UpdateSelectionState();
};
CDocument.prototype.Check_CompositeInputRun = function()
{
	if (null === this.CompositeInput)
		return;

	var oRun = this.CompositeInput.Run;
	if (true !== oRun.Is_UseInDocument())
		AscCommon.g_inputContext.externalEndCompositeInput();
};
CDocument.prototype.Is_CursorInsideCompositeText = function()
{
	if (null === this.CompositeInput)
		return false;

	var oCurrentParagraph = this.GetCurrentParagraph();
	if (!oCurrentParagraph)
		return false;

	var oParaPos   = oCurrentParagraph.Get_ParaContentPos(false, false, false);
	var arrClasses = oCurrentParagraph.Get_ClassesByPos(oParaPos);

	if (arrClasses.length <= 0 || arrClasses[arrClasses.length - 1] !== this.CompositeInput.Run)
		return false;

	var nInRunPos = oParaPos.Get(oParaPos.Get_Depth());
	if (nInRunPos >= this.CompositeInput.Pos && nInRunPos <= this.CompositeInput.Pos + this.CompositeInput.Length)
		return true;

	return false;
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы со сносками
//----------------------------------------------------------------------------------------------------------------------
/**
 * Переходим к редактированию сносок на заданной странице. Если сносок на заданной странице нет, тогда ничего не делаем.
 * @param {number} nPageIndex
 * @returns {boolean}
 */
CDocument.prototype.GotoFootnotesOnPage = function(nPageIndex)
{
	if (this.Footnotes.IsEmptyPage(nPageIndex))
		return false;

	this.SetDocPosType(docpostype_Footnotes);
	this.Footnotes.GotoPage(nPageIndex);
	this.Document_UpdateSelectionState();

	return true;
};
CDocument.prototype.AddFootnote = function(sText)
{
	var nDocPosType = this.GetDocPosType();
	if (docpostype_Content !== nDocPosType && docpostype_Footnotes !== nDocPosType)
		return;

	if (false === this.Document_Is_SelectionLocked(changestype_Paragraph_Content))
	{
		this.StartAction(AscDFH.historydescription_Document_AddFootnote);

		var nDocPosType = this.GetDocPosType();
		if (docpostype_Content === nDocPosType)
		{
			var oFootnote = this.Footnotes.CreateFootnote();
			oFootnote.AddDefaultFootnoteContent(sText);

			if (true === this.IsSelectionUse())
			{
				this.MoveCursorRight(false, false, false);
				this.RemoveSelection();
			}

			if (sText)
				this.AddToParagraph(new ParaFootnoteReference(oFootnote, sText));
			else
				this.AddToParagraph(new ParaFootnoteReference(oFootnote));

			this.SetDocPosType(docpostype_Footnotes);
			this.Footnotes.Set_CurrentElement(true, 0, oFootnote);
		}
		else if (docpostype_Footnotes === nDocPosType)
		{
			this.Footnotes.AddFootnoteRef();
			this.Recalculate();
		}
		this.FinalizeAction();
	}
};
CDocument.prototype.RemoveAllFootnotes = function()
{
	var nDocPosType = this.GetDocPosType();

	var oEngine = new CDocumentFootnotesRangeEngine(true);
	oEngine.Init(null, null);

	var arrParagraphs = this.GetAllParagraphs({OnlyMainDocument : true, All : true});
	for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
	{
		arrParagraphs[nIndex].GetFootnotesList(oEngine);
	}

	var arrFootnotes  = oEngine.GetRange();
	var arrParagraphs = oEngine.GetParagraphs();
	var arrRuns       = oEngine.GetRuns();
	var arrRefs       = oEngine.GetRefs();

	if (arrRuns.length !== arrRefs.length || arrFootnotes.length !== arrRuns.length)
		return;

	if (false === this.Document_Is_SelectionLocked(changestype_None, { Type : changestype_2_ElementsArray_and_Type, Elements : arrParagraphs, CheckType : changestype_Paragraph_Content }, true))
	{
		this.StartAction(AscDFH.historydescription_Document_RemoveAllFootnotes);

		var sDefaultStyleId = this.GetStyles().GetDefaultFootnoteReference();
		for (var nIndex = 0, nCount = arrFootnotes.length; nIndex < nCount; ++nIndex)
		{
			var oRef = arrRefs[nIndex];
			var oRun = arrRuns[nIndex];

			oRun.RemoveElement(oRef);

			if (oRun.GetRStyle() === sDefaultStyleId)
				oRun.SetRStyle(undefined);
		}

		this.Recalculate();

		if (docpostype_Footnotes === nDocPosType)
		{
			this.CurPos.Type = docpostype_Content;
			if (arrRuns.length > 0)
				arrRuns[0].Make_ThisElementCurrent();
		}
		this.FinalizeAction();
	}
};
CDocument.prototype.GotoFootnote = function(isNext)
{
	var nDocPosType = this.GetDocPosType();

	if (docpostype_Footnotes === nDocPosType)
	{
		if (isNext)
			this.Footnotes.GotoNextFootnote();
		else
			this.Footnotes.GotoPrevFootnote();

		this.Document_UpdateSelectionState();
		this.Document_UpdateInterfaceState();

		return;
	}

	if (docpostype_HdrFtr == this.CurPos.Type)
	{
		this.EndHdrFtrEditing(true);
	}
	else if (docpostype_DrawingObjects === nDocPosType)
	{
		this.DrawingObjects.resetSelection2();
		this.private_UpdateCursorXY(true, true);

		this.CurPos.Type = docpostype_Content;

		this.Document_UpdateInterfaceState();
		this.Document_UpdateSelectionState();
	}

	return this.GotoFootnoteRef(isNext, true);
};
CDocument.prototype.GetFootnotesController = function()
{
	return this.Footnotes;
};
CDocument.prototype.SetFootnotePr = function(oFootnotePr, bApplyToAll)
{
	var nNumStart   = oFootnotePr.get_NumStart();
	var nNumRestart = oFootnotePr.get_NumRestart();
	var nNumFormat  = oFootnotePr.get_NumFormat();
	var nPos        = oFootnotePr.get_Pos();
	if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Document_SectPr))
	{
		this.StartAction(AscDFH.historydescription_Document_SetFootnotePr);

		if (bApplyToAll)
		{
			for (var nIndex = 0, nCount = this.SectionsInfo.Get_SectionsCount(); nIndex < nCount; ++nIndex)
			{
				var oSectPr = this.SectionsInfo.Get_SectPr2(nIndex).SectPr;
				if (undefined !== nNumStart)
					oSectPr.SetFootnoteNumStart(nNumStart);

				if (undefined !== nNumRestart)
					oSectPr.SetFootnoteNumRestart(nNumRestart);

				if (undefined !== nNumFormat)
					oSectPr.SetFootnoteNumFormat(nNumFormat);

				if (undefined !== nPos)
					oSectPr.SetFootnotePos(nPos);
			}
		}
		else
		{
			var oSectPr = this.GetCurrentSectionPr();
			if (undefined !== nNumStart)
				oSectPr.SetFootnoteNumStart(nNumStart);

			if (undefined !== nNumRestart)
				oSectPr.SetFootnoteNumRestart(nNumRestart);

			if (undefined !== nNumFormat)
				oSectPr.SetFootnoteNumFormat(nNumFormat);

			if (undefined !== nPos)
				oSectPr.SetFootnotePos(nPos);
		}

		this.Recalculate();
		this.FinalizeAction();
	}
};
CDocument.prototype.GetFootnotePr = function()
{
	var oSectPr     = this.GetCurrentSectionPr();
	var oFootnotePr = new Asc.CAscFootnotePr();
	oFootnotePr.put_Pos(oSectPr.GetFootnotePos());
	oFootnotePr.put_NumStart(oSectPr.GetFootnoteNumStart());
	oFootnotePr.put_NumRestart(oSectPr.GetFootnoteNumRestart());
	oFootnotePr.put_NumFormat(oSectPr.GetFootnoteNumFormat());
	return oFootnotePr;
};
CDocument.prototype.IsCursorInFootnote = function()
{
	return (docpostype_Footnotes === this.GetDocPosType() ? true : false);
};
CDocument.prototype.GetFootnotesList = function(oFirstFootnote, oLastFootnote)
{
	if (null === oFirstFootnote && null === oLastFootnote && null !== this.AllFootnotesList)
		return this.AllFootnotesList;

	var arrFootnotes = CDocumentContentBase.prototype.GetFootnotesList.apply(this, arguments);

	if (null === oFirstFootnote && null === oLastFootnote)
		this.AllFootnotesList = arrFootnotes;

	return arrFootnotes;
};
CDocument.prototype.TurnOffCheckChartSelection = function()
{
	if (this.DrawingObjects)
	{
		this.DrawingObjects.TurnOffCheckChartSelection();
	}
};
CDocument.prototype.TurnOnCheckChartSelection = function()
{
	if (this.DrawingObjects)
	{
		this.DrawingObjects.TurnOnCheckChartSelection();
	}
};
//----------------------------------------------------------------------------------------------------------------------
// Функции, которые вызываются из CLogicDocumentController
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.controller_CanUpdateTarget = function()
{
	var nPos = this.private_GetSelectionPos(true).End;

	if (null != this.FullRecalc.Id && this.FullRecalc.StartIndex < this.CurPos.ContentPos)
	{
		return false;
	}
	else if (null !== this.FullRecalc.Id && this.FullRecalc.StartIndex === nPos)
	{
		var oElement     = this.Content[nPos];
		var nElementPage = this.private_GetElementPageIndex(nPos, this.FullRecalc.PageIndex, this.FullRecalc.ColumnIndex, oElement.Get_ColumnsCount());
		return oElement.CanUpdateTarget(nElementPage);
	}

	return true;
};
CDocument.prototype.controller_RecalculateCurPos = function(bUpdateX, bUpdateY)
{
	if (this.controller_CanUpdateTarget())
	{
		this.private_CheckCurPage();
		var nPos = this.private_GetSelectionPos(true).End;
		return this.Content[nPos].RecalculateCurPos(bUpdateX, bUpdateY);
	}

	return {X : 0, Y : 0, Height : 0, PageNum : 0, Internal : {Line : 0, Page : 0, Range : 0}, Transform : null};
};
CDocument.prototype.controller_GetCurPage = function()
{
	var nPos = this.private_GetSelectionPos(true).End;
	if (nPos >= 0 && (null === this.FullRecalc.Id || this.FullRecalc.StartIndex > nPos))
		return this.Content[nPos].Get_CurrentPage_Absolute();

	return -1;
};
CDocument.prototype.controller_AddNewParagraph = function(bRecalculate, bForceAdd)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	// Сначала удаляем заселекченую часть
	if (true === this.Selection.Use)
	{
		this.Remove(1, true, false, true);
	}

	// Добавляем новый параграф
	var Item = this.Content[this.CurPos.ContentPos];

	// Если мы внутри параграфа, тогда:
	// 1. Если мы в середине параграфа, разделяем данный параграф на 2.
	//    При этом полностью копируем все настройки из исходного параграфа.
	// 2. Если мы в конце данного параграфа, тогда добавляем новый пустой параграф.
	//    Стиль у него проставляем такой какой указан у текущего в Style.Next.
	//    Если при этом у нового параграфа стиль будет такой же как и у старого,
	//    в том числе если стиля нет у обоих, тогда копируем еще все прямые настройки.
	//    (Т.е. если стили разные, а у исходный параграф был параграфом со списком, тогда
	//    новый параграф будет без списка).
	if (type_Paragraph === Item.GetType())
	{
		// Если текущий параграф пустой и с нумерацией, тогда удаляем нумерацию и отступы левый и первой строки
		if (true !== bForceAdd && undefined != Item.GetNumPr() && true === Item.IsEmpty({SkipNewLine : true}) && true === Item.IsCursorAtBegin())
		{
			Item.RemoveNumPr();
			Item.Set_Ind({FirstLine : undefined, Left : undefined, Right : Item.Pr.Ind.Right}, true);
		}
		else
		{
			var ItemReviewType = Item.GetReviewType();
			// Создаем новый параграф
			var NewParagraph   = new Paragraph(this.DrawingDocument, this);

			// Проверим позицию в текущем параграфе
			if (true === Item.IsCursorAtEnd())
			{
				var StyleId = Item.Style_Get();
				var NextId  = undefined;

				if (undefined != StyleId)
				{
					NextId = this.Styles.Get_Next(StyleId);

					var oNextStyle = this.Styles.Get(NextId);
					if (!NextId || !oNextStyle || !oNextStyle.IsParagraphStyle())
						NextId = StyleId;
				}

				if (StyleId === NextId)
				{
					// Продолжаем (в плане настроек) новый параграф
					Item.Continue(NewParagraph);
				}
				else
				{
					// Простое добавление стиля, без дополнительных действий
					if (NextId === this.Styles.Get_Default_Paragraph())
						NewParagraph.Style_Remove();
					else
						NewParagraph.Style_Add(NextId, true);
				}

				var SectPr = Item.Get_SectionPr();
				if (undefined !== SectPr)
				{
					Item.Set_SectionPr(undefined);
					NewParagraph.Set_SectionPr(SectPr);
				}

				var LastRun = Item.Content[Item.Content.length - 1];
				if (LastRun && LastRun.Pr.Lang && LastRun.Pr.Lang.Val)
				{
					NewParagraph.SelectAll();
					NewParagraph.Add(new ParaTextPr({Lang : LastRun.Pr.Lang.Copy()}));
					NewParagraph.RemoveSelection();
				}
			}
			else
			{
				Item.Split(NewParagraph);
			}

			NewParagraph.Correct_Content();
			NewParagraph.MoveCursorToStartPos();

			var nContentPos = this.CurPos.ContentPos + 1;
			this.AddToContent(nContentPos, NewParagraph);
			this.CurPos.ContentPos = nContentPos;

			if (true === this.IsTrackRevisions())
			{
				Item.RemovePrChange();
				NewParagraph.SetReviewType(ItemReviewType);
				Item.SetReviewType(reviewtype_Add);
			}
			else if (reviewtype_Common !== ItemReviewType)
			{
				NewParagraph.SetReviewType(ItemReviewType);
				Item.SetReviewType(reviewtype_Common);
			}
		}
	}
	else if (type_Table === Item.GetType() || type_BlockLevelSdt === Item.GetType())
	{
		// Если мы находимся в начале первого параграфа первой ячейки, и
		// данная таблица - первый элемент, тогда добавляем параграф до таблицы.

		if (0 === this.CurPos.ContentPos && Item.IsCursorAtBegin(true))
		{
			// Создаем новый параграф
			var NewParagraph = new Paragraph(this.DrawingDocument, this);
			this.Internal_Content_Add(0, NewParagraph);
			this.CurPos.ContentPos = 0;

			if (true === this.IsTrackRevisions())
			{
				NewParagraph.RemovePrChange();
				NewParagraph.SetReviewType(reviewtype_Add);
			}
		}
		else if (this.Content.length - 1 === this.CurPos.ContentPos && Item.IsCursorAtEnd())
		{
			var oNewParagraph = new Paragraph(this.DrawingDocument, this);
			this.Internal_Content_Add(this.Content.length, oNewParagraph);
			this.CurPos.ContentPos = this.Content.length - 1;

			if (this.IsTrackRevisions())
			{
				oNewParagraph.RemovePrChange();
				oNewParagraph.SetReviewType(reviewtype_Add);
			}
		}
		else
		{
			Item.AddNewParagraph();
		}
	}
};
CDocument.prototype.controller_AddInlineImage = function(W, H, Img, Chart, bFlow)
{
	if (true == this.Selection.Use)
		this.Remove(1, true);

	var Item = this.Content[this.CurPos.ContentPos];
	if (type_Paragraph == Item.GetType())
	{
		var Drawing;
		if (!AscCommon.isRealObject(Chart))
		{
			Drawing   = new ParaDrawing(W, H, null, this.DrawingDocument, this, null);
			var Image = this.DrawingObjects.createImage(Img, 0, 0, W, H);
			Image.setParent(Drawing);
			Drawing.Set_GraphicObject(Image);
		}
		else
		{
			Drawing   = new ParaDrawing(W, H, null, this.DrawingDocument, this, null);
			var Image = this.DrawingObjects.getChartSpace2(Chart, null);
			Image.setParent(Drawing);
			Drawing.Set_GraphicObject(Image);
			Drawing.setExtent(Image.spPr.xfrm.extX, Image.spPr.xfrm.extY);
		}
		if (true === bFlow)
		{
			Drawing.Set_DrawingType(drawing_Anchor);
			Drawing.Set_WrappingType(WRAPPING_TYPE_SQUARE);
			Drawing.Set_BehindDoc(false);
			Drawing.Set_Distance(3.2, 0, 3.2, 0);
			Drawing.Set_PositionH(Asc.c_oAscRelativeFromH.Column, false, 0, false);
			Drawing.Set_PositionV(Asc.c_oAscRelativeFromV.Paragraph, false, 0, false);
		}
		this.AddToParagraph(Drawing);
		this.Select_DrawingObject(Drawing.Get_Id());
	}
	else
	{
		Item.AddInlineImage(W, H, Img, Chart, bFlow);
	}
};
CDocument.prototype.controller_AddImages = function(aImages)
{
    if (true === this.Selection.Use)
        this.Remove(1, true);

    var Item = this.Content[this.CurPos.ContentPos];
    if (type_Paragraph === Item.GetType())
    {
        var Drawing, W, H;
        var ColumnSize = this.GetColumnSize();
        for(var i = 0; i < aImages.length; ++i){

            W = Math.max(1, ColumnSize.W);
            H = Math.max(1, ColumnSize.H);

			var _image = aImages[i];
			if(_image.Image)
			{
				var __w = Math.max((_image.Image.width * AscCommon.g_dKoef_pix_to_mm), 1);
				var __h = Math.max((_image.Image.height * AscCommon.g_dKoef_pix_to_mm), 1);
				W      = Math.max(5, Math.min(W, __w));
				H      = Math.max(5, Math.min((W * __h / __w)));
				Drawing   = new ParaDrawing(W, H, null, this.DrawingDocument, this, null);
				var Image = this.DrawingObjects.createImage(_image.src, 0, 0, W, H);
				Image.setParent(Drawing);
				Drawing.Set_GraphicObject(Image);
				this.AddToParagraph(Drawing);
			}
        }
        if(aImages.length === 1)
        {
            if(Drawing)
            {
                this.Select_DrawingObject(Drawing.Get_Id());
            }
        }
    }
    else
    {
        Item.AddImages(aImages);
    }
};
CDocument.prototype.controller_AddOleObject = function(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId)
{
	if (true == this.Selection.Use)
		this.Remove(1, true);

	var Item = this.Content[this.CurPos.ContentPos];
	if (type_Paragraph == Item.GetType())
	{
		var Drawing   = new ParaDrawing(W, H, null, this.DrawingDocument, this, null);
		var Image = this.DrawingObjects.createOleObject(Data, sApplicationId, Img, 0, 0, W, H, nWidthPix, nHeightPix);
		Image.setParent(Drawing);
		Drawing.Set_GraphicObject(Image);
		this.AddToParagraph(Drawing);
		this.Select_DrawingObject(Drawing.Get_Id());
	}
	else
	{
		Item.AddOleObject(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId);
	}
};
CDocument.prototype.controller_AddTextArt = function(nStyle)
{
	var Item = this.Content[this.CurPos.ContentPos];
	if (type_Paragraph == Item.GetType())
	{
		var Drawing = new ParaDrawing(1828800 / 36000, 1828800 / 36000, null, this.DrawingDocument, this, null);
		var TextArt = this.DrawingObjects.createTextArt(nStyle, true);
		TextArt.setParent(Drawing);
		Drawing.Set_GraphicObject(TextArt);
		Drawing.Set_DrawingType(drawing_Anchor);
		Drawing.Set_WrappingType(WRAPPING_TYPE_NONE);
		Drawing.Set_BehindDoc(false);
		Drawing.Set_Distance(3.2, 0, 3.2, 0);
		Drawing.Set_PositionH(Asc.c_oAscRelativeFromH.Column, false, 0, false);
		Drawing.Set_PositionV(Asc.c_oAscRelativeFromV.Paragraph, false, 0, false);

		if (true == this.Selection.Use)
			this.Remove(1, true);

		this.AddToParagraph(Drawing);
		if (TextArt.bSelectedText)
		{
			this.Select_DrawingObject(Drawing.Get_Id());
		}
		else
		{
			var oContent = Drawing.GraphicObj.getDocContent();
			oContent.Content[0].Document_SetThisElementCurrent(false);
			this.SelectAll();
		}
	}
	else
	{
		Item.AddTextArt(nStyle);
	}
};
CDocument.prototype.controller_AddSignatureLine = function(oSignatureDrawing)
{
	var Item = this.Content[this.CurPos.ContentPos];
	if (type_Paragraph == Item.GetType())
	{
		var Drawing = oSignatureDrawing;

		if (true == this.Selection.Use)
			this.Remove(1, true);

		this.AddToParagraph(Drawing);
        this.Select_DrawingObject(Drawing.Get_Id());
	}
	else
	{
		Item.AddSignatureLine(oSignatureDrawing);
	}
};
CDocument.prototype.controller_AddInlineTable = function(nCols, nRows, nMode)
{
	if (this.CurPos.ContentPos < 0)
		return null;

	// Сначала удаляем заселекченую часть
	if (true === this.Selection.Use)
	{
		this.Remove(1, true);
	}

	// Добавляем таблицу
	var Item = this.Content[this.CurPos.ContentPos];

	// Если мы внутри параграфа, тогда разрываем его и на месте разрыва добавляем таблицу.
	// А если мы внутри таблицы, тогда добавляем таблицу внутрь текущей таблицы.
	if (Item.IsParagraph())
	{
		// Ширину таблицы делаем по минимальной ширине колонки.
		var oPage  = this.Pages[this.CurPage];
		var SectPr = this.SectionsInfo.Get_SectPr(this.CurPos.ContentPos).SectPr;

		var PageFields = this.Get_PageFields(this.CurPage);

		// Создаем новую таблицу
		var W    = (PageFields.XLimit - PageFields.X + 2 * 1.9);
		var Grid = [];

		if (SectPr.Get_ColumnsCount() > 1)
		{
			for (var CurCol = 0, ColsCount = SectPr.Get_ColumnsCount(); CurCol < ColsCount; ++CurCol)
			{
				var ColumnWidth = SectPr.Get_ColumnWidth(CurCol);
				if (W > ColumnWidth)
					W = ColumnWidth;
			}

			W += 2 * 1.9;
		}

		W = Math.max(W, nCols * 2 * 1.9);

		for (var Index = 0; Index < nCols; Index++)
			Grid[Index] = W / nCols;

		var NewTable = new CTable(this.DrawingDocument, this, true, nRows, nCols, Grid);
		NewTable.SetParagraphPrOnAdd(Item);

		var nContentPos = this.CurPos.ContentPos;
		if (true === Item.IsCursorAtBegin() && undefined === Item.Get_SectionPr())
		{
			NewTable.MoveCursorToStartPos(false);
			this.AddToContent(nContentPos, NewTable);
			this.CurPos.ContentPos = nContentPos;
		}
		else
		{
			if (nMode < 0)
			{
				NewTable.MoveCursorToStartPos(false);

				if (Item.GetCurrentParaPos().Page > 0 && oPage && nContentPos === oPage.Pos)
				{
					this.AddToContent(nContentPos + 1, NewTable);
					this.CurPos.ContentPos = nContentPos + 1;
				}
				else
				{
					this.AddToContent(nContentPos, NewTable);
					this.CurPos.ContentPos = nContentPos;
				}
			}
			else if (nMode > 0)
			{
				NewTable.MoveCursorToStartPos(false);
				this.AddToContent(nContentPos + 1, NewTable);
				this.CurPos.ContentPos = nContentPos + 1;
			}
			else
			{
				var NewParagraph = new Paragraph(this.DrawingDocument, this);
				Item.Split(NewParagraph);

				this.AddToContent(nContentPos + 1, NewParagraph);

				NewTable.MoveCursorToStartPos(false);
				this.AddToContent(nContentPos + 1, NewTable);
				this.CurPos.ContentPos = nContentPos + 1;
			}
		}

		return NewTable;
	}
	else
	{
		return Item.AddInlineTable(nCols, nRows, nMode);
	}

	this.Recalculate();

	return null;
};
CDocument.prototype.controller_ClearParagraphFormatting = function(isClearParaPr, isClearTextPr)
{
	if (true === this.Selection.Use)
	{
		if (selectionflag_Common === this.Selection.Flag)
		{
			var StartPos = this.Selection.StartPos;
			var EndPos   = this.Selection.EndPos;
			if (StartPos > EndPos)
			{
				var Temp = StartPos;
				StartPos = EndPos;
				EndPos   = Temp;
			}

			for (var Index = StartPos; Index <= EndPos; Index++)
			{
				this.Content[Index].ClearParagraphFormatting(isClearParaPr, isClearTextPr);
			}
		}
	}
	else
	{
		this.Content[this.CurPos.ContentPos].ClearParagraphFormatting(isClearParaPr, isClearTextPr);
	}
};
CDocument.prototype.controller_AddToParagraph = function(ParaItem, bRecalculate)
{
	if (true === this.Selection.Use)
	{
		var bAddSpace = this.Is_WordSelection();

		var Type = ParaItem.Get_Type();
		switch (Type)
		{
			case para_Math:
			case para_NewLine:
			case para_Text:
			case para_Space:
			case para_Tab:
			case para_PageNum:
			case para_Field:
			case para_FootnoteReference:
			case para_FootnoteRef:
			case para_Separator:
			case para_ContinuationSeparator:
			case para_InstrText:
			{
				if (ParaItem instanceof AscCommonWord.MathMenu)
				{
					var oInfo = this.GetSelectedElementsInfo();
					if (oInfo.Get_Math())
					{
						var oMath = oInfo.Get_Math();
						ParaItem.SetText(oMath.Copy(true));
					}
					else if (!oInfo.Is_MixedSelection())
					{
						ParaItem.SetText(this.GetSelectedText());
					}
				}

				// Если у нас что-то заселекчено и мы вводим текст или пробел
				// и т.д., тогда сначала удаляем весь селект.
				this.Remove(1, true, false, true);

				if (true === bAddSpace)
				{
					this.AddToParagraph(new ParaSpace());
					this.MoveCursorLeft(false, false);
				}
				break;
			}
			case para_TextPr:
			{
				switch (this.Selection.Flag)
				{
					case selectionflag_Common:
					{
						// Текстовые настройки применяем ко всем параграфам, попавшим
						// в селект.
						var StartPos = this.Selection.StartPos;
						var EndPos   = this.Selection.EndPos;
						if (EndPos < StartPos)
						{
							var Temp = StartPos;
							StartPos = EndPos;
							EndPos   = Temp;
						}

						for (var Index = StartPos; Index <= EndPos; Index++)
						{
							this.Content[Index].Add(ParaItem.Copy());
						}

						if (false != bRecalculate)
						{
							// Если в TextPr только HighLight, тогда не надо ничего пересчитывать, только перерисовываем
							if (true === ParaItem.Value.Check_NeedRecalc())
							{
								this.Recalculate();
							}
							else
							{
								// Просто перерисовываем нужные страницы
								var StartPage = this.Content[StartPos].Get_StartPage_Absolute();
								var EndPage   = this.Content[EndPos].Get_StartPage_Absolute() + this.Content[EndPos].GetPagesCount() - 1;
								this.ReDraw(StartPage, EndPage);
							}
						}

						break;
					}
					case selectionflag_Numbering:
					{
						// Текстовые настройки применяем к конкретной нумерации
						if (!this.Selection.Data || !this.Selection.Data.CurPara)
							break;

						if (undefined != ParaItem.Value.FontFamily)
						{
							var FName  = ParaItem.Value.FontFamily.Name;
							var FIndex = ParaItem.Value.FontFamily.Index;

							ParaItem.Value.RFonts          = new CRFonts();
							ParaItem.Value.RFonts.Ascii    = {Name : FName, Index : FIndex};
							ParaItem.Value.RFonts.EastAsia = {Name : FName, Index : FIndex};
							ParaItem.Value.RFonts.HAnsi    = {Name : FName, Index : FIndex};
							ParaItem.Value.RFonts.CS       = {Name : FName, Index : FIndex};
						}

						var oNumPr = this.Selection.Data.CurPara.GetNumPr();
						var oNum   = this.GetNumbering().GetNum(oNumPr.NumId);
						oNum.ApplyTextPr(oNumPr.Lvl, ParaItem.Value);
						break;
					}
				}

				this.Document_UpdateSelectionState();
				this.Document_UpdateUndoRedoState();

				return;
			}
		}
	}

	var nContentPos = this.CurPos.ContentPos;

	var Item     = this.Content[nContentPos];
	var ItemType = Item.GetType();

	if (para_NewLine === ParaItem.Type && true === ParaItem.IsPageOrColumnBreak())
	{
		if (type_Paragraph === ItemType)
		{
			if (true === Item.IsCursorAtBegin())
			{
				if (ParaItem.IsColumnBreak())
				{
					this.Content[this.CurPos.ContentPos].Add(ParaItem);
				}
				else
				{
					this.AddNewParagraph(undefined, true);

					if (this.Content[nContentPos] && this.Content[nContentPos].IsParagraph())
					{
						this.Content[nContentPos].AddToParagraph(ParaItem);
						this.Content[nContentPos].Clear_Formatting();
					}

					this.CurPos.ContentPos = nContentPos + 1;
				}
			}
			else
			{
				if (ParaItem.IsColumnBreak())
				{
					var oCurElement = this.Content[this.CurPos.ContentPos];
					if (oCurElement && type_Paragraph === oCurElement.Get_Type() && oCurElement.IsColumnBreakOnLeft())
					{
						oCurElement.AddToParagraph(ParaItem);
					}
					else
					{
						this.AddNewParagraph(undefined, true);

						nContentPos = this.CurPos.ContentPos;
						if (this.Content[nContentPos] && this.Content[nContentPos].IsParagraph())
						{
							this.Content[nContentPos].MoveCursorToStartPos(false);
							this.Content[nContentPos].AddToParagraph(ParaItem);
						}
					}
				}
				else
				{
					this.AddNewParagraph(undefined, true);
					this.CurPos.ContentPos = nContentPos + 1;
					this.Content[nContentPos + 1].MoveCursorToStartPos();
					this.AddNewParagraph(undefined, true);

					if (this.Content[nContentPos + 1] && this.Content[nContentPos + 1].IsParagraph())
					{
						this.Content[nContentPos + 1].AddToParagraph(ParaItem);
						this.Content[nContentPos + 1].Clear_Formatting();
					}

					this.CurPos.ContentPos = nContentPos + 2;
					this.Content[nContentPos + 1].MoveCursorToStartPos();
				}
			}

			if (false != bRecalculate)
			{
				this.Recalculate();

				Item.CurPos.RealX = Item.CurPos.X;
				Item.CurPos.RealY = Item.CurPos.Y;
			}
		}
		else if (type_BlockLevelSdt === Item.GetType())
		{
			Item.AddToParagraph(ParaItem);
		}
		else
		{
			// TODO: PageBreak в таблице не ставим
			return;
		}
	}
	else
	{
		Item.AddToParagraph(ParaItem);

		if (false != bRecalculate && type_Paragraph == Item.GetType())
		{
			if (para_TextPr === ParaItem.Type && false === ParaItem.Value.Check_NeedRecalc())
			{
				// Просто перерисовываем нужные страницы
				var StartPage = Item.Get_StartPage_Absolute();
				var EndPage   = StartPage + Item.Pages.length - 1;
				this.ReDraw(StartPage, EndPage);
			}
			else
			{
				this.Recalculate();
			}

			if (false === this.TurnOffRecalcCurPos)
			{
				Item.RecalculateCurPos();
				Item.CurPos.RealX = Item.CurPos.X;
				Item.CurPos.RealY = Item.CurPos.Y;
			}
		}

		this.UpdateSelection();
		this.UpdateInterface();
	}

	// Специальная заглушка для функции TextBox_Put
	if (true === this.Is_OnRecalculate())
		this.Document_UpdateUndoRedoState();
};
CDocument.prototype.controller_Remove = function(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord)
{
	this.private_Remove(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord);
};
CDocument.prototype.controller_GetCursorPosXY = function()
{
	if (true === this.Selection.Use)
	{
		if (selectionflag_Common === this.Selection.Flag)
			return this.Content[this.Selection.EndPos].GetCursorPosXY();

		return {X : 0, Y : 0};
	}
	else
	{
		return this.Content[this.CurPos.ContentPos].GetCursorPosXY();
	}
};
CDocument.prototype.controller_MoveCursorToStartPos = function(AddToSelect)
{
	if (true === AddToSelect)
	{
		var StartPos = ( true === this.Selection.Use ? this.Selection.StartPos : this.CurPos.ContentPos );
		var EndPos   = 0;

		this.Selection.Start    = false;
		this.Selection.Use      = true;
		this.Selection.StartPos = StartPos;
		this.Selection.EndPos   = EndPos;
		this.Selection.Flag     = selectionflag_Common;

		this.CurPos.ContentPos = 0;
		this.SetDocPosType(docpostype_Content);

		for (var Index = StartPos - 1; Index >= EndPos; Index--)
		{
			this.Content[Index].SelectAll(-1);
		}

		this.Content[StartPos].MoveCursorToStartPos(true);
	}
	else
	{
		this.RemoveSelection();

		this.Selection.Start    = false;
		this.Selection.Use      = false;
		this.Selection.StartPos = 0;
		this.Selection.EndPos   = 0;
		this.Selection.Flag     = selectionflag_Common;

		this.CurPos.ContentPos = 0;
		this.SetDocPosType(docpostype_Content);
		this.Content[0].MoveCursorToStartPos(false);
	}
};
CDocument.prototype.controller_MoveCursorToEndPos = function(AddToSelect)
{
	if (true === AddToSelect)
	{
		var StartPos = ( true === this.Selection.Use ? this.Selection.StartPos : this.CurPos.ContentPos );
		var EndPos   = this.Content.length - 1;

		this.Selection.Start    = false;
		this.Selection.Use      = true;
		this.Selection.StartPos = StartPos;
		this.Selection.EndPos   = EndPos;
		this.Selection.Flag     = selectionflag_Common;

		this.CurPos.ContentPos = this.Content.length - 1;
		this.SetDocPosType(docpostype_Content);

		for (var Index = StartPos + 1; Index <= EndPos; Index++)
		{
			this.Content[Index].SelectAll(1);
		}

		this.Content[StartPos].MoveCursorToEndPos(true, false);
	}
	else
	{
		this.RemoveSelection();

		this.Selection.Start    = false;
		this.Selection.Use      = false;
		this.Selection.StartPos = 0;
		this.Selection.EndPos   = 0;
		this.Selection.Flag     = selectionflag_Common;

		this.CurPos.ContentPos = this.Content.length - 1;
		this.SetDocPosType(docpostype_Content);
		this.Content[this.CurPos.ContentPos].MoveCursorToEndPos(false);
	}
};
CDocument.prototype.controller_MoveCursorLeft = function(AddToSelect, Word)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	this.RemoveNumberingSelection();
	if (true === this.Selection.Use)
	{
		if (true === AddToSelect)
		{
			if (false === this.Content[this.Selection.EndPos].MoveCursorLeft(true, Word))
			{
				if (0 !== this.Selection.EndPos)
				{
					this.Selection.EndPos--;
					this.CurPos.ContentPos = this.Selection.EndPos;

					var Item = this.Content[this.Selection.EndPos];
					Item.MoveCursorLeftWithSelectionFromEnd(Word);
				}
			}

			// Проверяем не обнулился ли селект в последнем элементе. Такое могло быть, если была
			// заселекчена одна буква в последнем параграфе, а мы убрали селект последним действием.
			if (this.Selection.EndPos != this.Selection.StartPos && false === this.Content[this.Selection.EndPos].IsSelectionUse())
			{
				// Такая ситуация возможна только при прямом селекте (сверху вниз), поэтому вычитаем
				this.Selection.EndPos--;
				this.CurPos.ContentPos = this.Selection.EndPos;
			}

			// Проверяем не обнулился ли селект (т.е. ничего не заселекчено)
			if (this.Selection.StartPos == this.Selection.EndPos && false === this.Content[this.Selection.StartPos].IsSelectionUse())
			{
				this.Selection.Use     = false;
				this.CurPos.ContentPos = this.Selection.EndPos;
			}
		}
		else
		{
			// Нам нужно переместить курсор в левый край селекта, и отменить весь селект
			var Start = this.Selection.StartPos;
			if (Start > this.Selection.EndPos)
				Start = this.Selection.EndPos;

			this.CurPos.ContentPos = Start;
			if (false === this.Content[this.CurPos.ContentPos].MoveCursorLeft(false, Word))
			{
				if (this.CurPos.ContentPos > 0)
				{
					this.CurPos.ContentPos--;
					this.Content[this.CurPos.ContentPos].MoveCursorToEndPos(false, false);
				}
			}

			this.RemoveSelection();
		}
	}
	else
	{
		if (true === AddToSelect)
		{
			this.Selection.Use      = true;
			this.Selection.StartPos = this.CurPos.ContentPos;
			this.Selection.EndPos   = this.CurPos.ContentPos;

			if (false === this.Content[this.CurPos.ContentPos].MoveCursorLeft(true, Word))
			{
				// Нужно перейти в конец предыдущего элемент
				if (0 != this.CurPos.ContentPos)
				{
					this.CurPos.ContentPos--;
					this.Selection.EndPos = this.CurPos.ContentPos;

					var Item = this.Content[this.CurPos.ContentPos];
					Item.MoveCursorLeftWithSelectionFromEnd(Word);
				}
			}

			// Проверяем не обнулился ли селект (т.е. ничего не заселекчено)
			if (this.Selection.StartPos == this.Selection.EndPos && false === this.Content[this.Selection.StartPos].IsSelectionUse())
			{
				this.Selection.Use     = false;
				this.CurPos.ContentPos = this.Selection.EndPos;
			}
		}
		else
		{
			if (false === this.Content[this.CurPos.ContentPos].MoveCursorLeft(false, Word))
			{
				// Нужно перейти в конец предыдущего элемент
				if (0 != this.CurPos.ContentPos)
				{
					this.CurPos.ContentPos--;
					this.Content[this.CurPos.ContentPos].MoveCursorToEndPos(false, false);
				}
			}
		}
	}
};
CDocument.prototype.controller_MoveCursorRight = function(AddToSelect, Word)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	this.RemoveNumberingSelection();
	if (true === this.Selection.Use)
	{
		if (true === AddToSelect)
		{
			// Добавляем к селекту
			if (false === this.Content[this.Selection.EndPos].MoveCursorRight(true, Word))
			{
				// Нужно перейти в начало следующего элемента
				if (this.Content.length - 1 != this.Selection.EndPos)
				{
					this.Selection.EndPos++;
					this.CurPos.ContentPos = this.Selection.EndPos;

					var Item = this.Content[this.Selection.EndPos];
					Item.MoveCursorRightWithSelectionFromStart(Word);
				}
			}

			// Проверяем не обнулился ли селект в последнем параграфе. Такое могло быть, если была
			// заселекчена одна буква в последнем параграфе, а мы убрали селект последним действием.
			if (this.Selection.EndPos != this.Selection.StartPos && false === this.Content[this.Selection.EndPos].IsSelectionUse())
			{
				// Такая ситуация возможна только при обратном селекте (снизу вверх), поэтому вычитаем
				this.Selection.EndPos++;
				this.CurPos.ContentPos = this.Selection.EndPos;
			}

			// Проверяем не обнулился ли селект (т.е. ничего не заселекчено)
			if (this.Selection.StartPos == this.Selection.EndPos && false === this.Content[this.Selection.StartPos].IsSelectionUse())
			{
				this.Selection.Use     = false;
				this.CurPos.ContentPos = this.Selection.EndPos;
			}
		}
		else
		{
			// Нам нужно переместить курсор в правый край селекта, и отменить весь селект
			var End = this.Selection.EndPos;
			if (End < this.Selection.StartPos)
				End = this.Selection.StartPos;

			this.CurPos.ContentPos = End;

			if (true === this.Content[this.CurPos.ContentPos].IsSelectionToEnd() && this.CurPos.ContentPos < this.Content.length - 1)
			{
				this.CurPos.ContentPos = End + 1;
				this.Content[this.CurPos.ContentPos].MoveCursorToStartPos(false);
			}
			else
			{
				this.Content[this.CurPos.ContentPos].MoveCursorRight(false, Word);
			}

			this.RemoveSelection();
		}
	}
	else
	{
		if (true === AddToSelect)
		{
			this.Selection.Use      = true;
			this.Selection.StartPos = this.CurPos.ContentPos;
			this.Selection.EndPos   = this.CurPos.ContentPos;

			if (false === this.Content[this.CurPos.ContentPos].MoveCursorRight(true, Word))
			{
				// Нужно перейти в конец предыдущего элемента
				if (this.Content.length - 1 != this.CurPos.ContentPos)
				{
					this.CurPos.ContentPos++;
					this.Selection.EndPos = this.CurPos.ContentPos;

					var Item = this.Content[this.CurPos.ContentPos];
					Item.MoveCursorRightWithSelectionFromStart(Word);
				}
			}

			// Проверяем не обнулился ли селект (т.е. ничего не заселекчено)
			if (this.Selection.StartPos == this.Selection.EndPos && false === this.Content[this.Selection.StartPos].IsSelectionUse())
			{
				this.Selection.Use     = false;
				this.CurPos.ContentPos = this.Selection.EndPos;
			}
		}
		else
		{
			if (false === this.Content[this.CurPos.ContentPos].MoveCursorRight(false, Word))
			{
				// Нужно перейти в начало следующего элемента
				if (this.Content.length - 1 != this.CurPos.ContentPos)
				{
					this.CurPos.ContentPos++;
					this.Content[this.CurPos.ContentPos].MoveCursorToStartPos(false);
				}
			}
		}
	}
};
CDocument.prototype.controller_MoveCursorUp = function(AddToSelect)
{
	if (true === this.IsSelectionUse() && true !== AddToSelect)
		this.MoveCursorLeft(false, false);

	var bStopSelection = false;
	if (true !== this.IsSelectionUse() && true === AddToSelect)
	{
		bStopSelection = true;
		this.StartSelectionFromCurPos();
	}

	this.private_UpdateCursorXY(false, true);
	var Result = this.private_MoveCursorUp(this.CurPos.RealX, this.CurPos.RealY, AddToSelect);

	// TODO: Вообще Word селектит до начала данной колонки в таком случае, а не до начала документа
	if (true === AddToSelect && true !== Result)
		this.MoveCursorToStartPos(true);

	if (bStopSelection)
		this.private_StopSelection();
};
CDocument.prototype.controller_MoveCursorDown = function(AddToSelect)
{
	if (true === this.IsSelectionUse() && true !== AddToSelect)
		this.MoveCursorRight(false, false);

	var bStopSelection = false;
	if (true !== this.IsSelectionUse() && true === AddToSelect)
	{
		bStopSelection = true;
		this.StartSelectionFromCurPos();
	}

	this.private_UpdateCursorXY(false, true);
	var Result = this.private_MoveCursorDown(this.CurPos.RealX, this.CurPos.RealY, AddToSelect);

	if (true === AddToSelect && true !== Result)
		this.MoveCursorToEndPos(true);

	if (bStopSelection)
		this.private_StopSelection();
};
CDocument.prototype.controller_MoveCursorToEndOfLine = function(AddToSelect)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	this.RemoveNumberingSelection();
	if (true === this.Selection.Use)
	{
		if (true === AddToSelect)
		{
			var Item = this.Content[this.Selection.EndPos];
			Item.MoveCursorToEndOfLine(AddToSelect);

			// Проверяем не обнулился ли селект (т.е. ничего не заселекчено)
			if (this.Selection.StartPos == this.Selection.EndPos && false === this.Content[this.Selection.StartPos].IsSelectionUse())
			{
				this.Selection.Use     = false;
				this.CurPos.ContentPos = this.Selection.EndPos;
			}
		}
		else
		{
			var Pos                = ( this.Selection.EndPos >= this.Selection.StartPos ? this.Selection.EndPos : this.Selection.StartPos );
			this.CurPos.ContentPos = Pos;

			var Item = this.Content[Pos];
			Item.MoveCursorToEndOfLine(AddToSelect);

			this.RemoveSelection();
		}
	}
	else
	{
		if (true === AddToSelect)
		{
			this.Selection.Use      = true;
			this.Selection.StartPos = this.CurPos.ContentPos;
			this.Selection.EndPos   = this.CurPos.ContentPos;

			var Item = this.Content[this.CurPos.ContentPos];
			Item.MoveCursorToEndOfLine(AddToSelect);

			// Проверяем не обнулился ли селект (т.е. ничего не заселекчено)
			if (this.Selection.StartPos == this.Selection.EndPos && false === this.Content[this.Selection.StartPos].IsSelectionUse())
			{
				this.Selection.Use     = false;
				this.CurPos.ContentPos = this.Selection.EndPos;
			}
		}
		else
		{
			var Item = this.Content[this.CurPos.ContentPos];
			Item.MoveCursorToEndOfLine(AddToSelect);
		}
	}

	this.Document_UpdateInterfaceState();
	this.private_UpdateCursorXY(true, true);
};
CDocument.prototype.controller_MoveCursorToStartOfLine = function(AddToSelect)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	this.RemoveNumberingSelection();
	if (true === this.Selection.Use)
	{
		if (true === AddToSelect)
		{
			var Item = this.Content[this.Selection.EndPos];
			Item.MoveCursorToStartOfLine(AddToSelect);

			// Проверяем не обнулился ли селект (т.е. ничего не заселекчено)
			if (this.Selection.StartPos == this.Selection.EndPos && false === this.Content[this.Selection.StartPos].IsSelectionUse())
			{
				this.Selection.Use     = false;
				this.CurPos.ContentPos = this.Selection.EndPos;
			}
		}
		else
		{
			var Pos                = ( this.Selection.StartPos <= this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos );
			this.CurPos.ContentPos = Pos;

			var Item = this.Content[Pos];
			Item.MoveCursorToStartOfLine(AddToSelect);

			this.RemoveSelection();
		}
	}
	else
	{
		if (true === AddToSelect)
		{
			this.Selection.Use      = true;
			this.Selection.StartPos = this.CurPos.ContentPos;
			this.Selection.EndPos   = this.CurPos.ContentPos;

			var Item = this.Content[this.CurPos.ContentPos];
			Item.MoveCursorToStartOfLine(AddToSelect);

			// Проверяем не обнулился ли селект (т.е. ничего не заселекчено)
			if (this.Selection.StartPos == this.Selection.EndPos && false === this.Content[this.Selection.StartPos].IsSelectionUse())
			{
				this.Selection.Use     = false;
				this.CurPos.ContentPos = this.Selection.EndPos;
			}
		}
		else
		{
			var Item = this.Content[this.CurPos.ContentPos];
			Item.MoveCursorToStartOfLine(AddToSelect);
		}
	}

	this.Document_UpdateInterfaceState();
	this.private_UpdateCursorXY(true, true);
};
CDocument.prototype.controller_MoveCursorToXY = function(X, Y, PageAbs, AddToSelect)
{
	this.CurPage = PageAbs;

	this.RemoveNumberingSelection();
	if (true === this.Selection.Use)
	{
		if (true === AddToSelect)
		{
			this.Selection_SetEnd(X, Y, true);
		}
		else
		{
			this.RemoveSelection();

			var ContentPos         = this.Internal_GetContentPosByXY(X, Y);
			this.CurPos.ContentPos = ContentPos;
			var ElementPageIndex   = this.private_GetElementPageIndexByXY(ContentPos, X, Y, PageAbs);
			this.Content[ContentPos].MoveCursorToXY(X, Y, false, false, ElementPageIndex);

			this.Document_UpdateInterfaceState();
		}
	}
	else
	{
		if (true === AddToSelect)
		{
			this.StartSelectionFromCurPos();
			var oMouseEvent  = new AscCommon.CMouseEventHandler();
			oMouseEvent.Type = AscCommon.g_mouse_event_type_up;
			this.Selection_SetEnd(X, Y, oMouseEvent);
		}
		else
		{
			var ContentPos         = this.Internal_GetContentPosByXY(X, Y);
			this.CurPos.ContentPos = ContentPos;
			var ElementPageIndex   = this.private_GetElementPageIndexByXY(ContentPos, X, Y, PageAbs);
			this.Content[ContentPos].MoveCursorToXY(X, Y, false, false, ElementPageIndex);

			this.Document_UpdateInterfaceState();
		}
	}
};
CDocument.prototype.controller_MoveCursorToCell = function(bNext)
{
	if (true === this.Selection.Use)
	{
		if (this.Selection.StartPos === this.Selection.EndPos)
			this.Content[this.Selection.StartPos].MoveCursorToCell(bNext);
	}
	else
	{
		this.Content[this.CurPos.ContentPos].MoveCursorToCell(bNext);
	}
};
CDocument.prototype.controller_SetParagraphAlign = function(Align)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (EndPos < StartPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		for (var Index = StartPos; Index <= EndPos; Index++)
		{
			var Item = this.Content[Index];
			Item.SetParagraphAlign(Align);
		}
	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		Item.SetParagraphAlign(Align);
	}
};
CDocument.prototype.controller_SetParagraphSpacing = function(Spacing)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (EndPos < StartPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		for (var Index = StartPos; Index <= EndPos; Index++)
		{
			var Item = this.Content[Index];
			Item.SetParagraphSpacing(Spacing);
		}
	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		Item.SetParagraphSpacing(Spacing);
	}
};
CDocument.prototype.controller_SetParagraphTabs = function(Tabs)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (EndPos < StartPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		for (var Index = StartPos; Index <= EndPos; Index++)
		{
			var Item = this.Content[Index];
			Item.SetParagraphTabs(Tabs);
		}
	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		Item.SetParagraphTabs(Tabs);
	}
};
CDocument.prototype.controller_SetParagraphIndent = function(Ind)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (EndPos < StartPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		for (var Index = StartPos; Index <= EndPos; Index++)
		{
			var Item = this.Content[Index];
			Item.SetParagraphIndent(Ind);
		}
	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		Item.SetParagraphIndent(Ind);
	}
};
CDocument.prototype.controller_SetParagraphShd = function(Shd)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;

		if (true === this.UseTextShd && StartPos === EndPos && type_Paragraph === this.Content[StartPos].GetType() && false === this.Content[StartPos].Selection_CheckParaEnd() && selectionflag_Common === this.Selection.Flag)
		{
			this.AddToParagraph(new ParaTextPr({Shd : Shd}));
		}
		else
		{
			if (EndPos < StartPos)
			{
				var Temp = StartPos;
				StartPos = EndPos;
				EndPos   = Temp;
			}

			for (var Index = StartPos; Index <= EndPos; Index++)
			{
				var Item = this.Content[Index];
				Item.SetParagraphShd(Shd);
			}
		}
	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		Item.SetParagraphShd(Shd);
	}
};
CDocument.prototype.controller_SetParagraphStyle = function(Name)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	if (true === this.Selection.Use)
	{
		this.RemoveNumberingSelection();

		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (EndPos < StartPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		for (var Index = StartPos; Index <= EndPos; Index++)
		{
			var Item = this.Content[Index];
			Item.SetParagraphStyle(Name);
		}
	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		Item.SetParagraphStyle(Name);
	}
};
CDocument.prototype.controller_SetParagraphContextualSpacing = function(Value)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (EndPos < StartPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		for (var Index = StartPos; Index <= EndPos; Index++)
		{
			var Item = this.Content[Index];
			Item.SetParagraphContextualSpacing(Value);
		}
	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		Item.SetParagraphContextualSpacing(Value);
	}
};
CDocument.prototype.controller_SetParagraphPageBreakBefore = function(Value)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (EndPos < StartPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		for (var Index = StartPos; Index <= EndPos; Index++)
		{
			var Item = this.Content[Index];
			Item.SetParagraphPageBreakBefore(Value);
		}
	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		Item.SetParagraphPageBreakBefore(Value);
	}
};
CDocument.prototype.controller_SetParagraphKeepLines = function(Value)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (EndPos < StartPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		for (var Index = StartPos; Index <= EndPos; Index++)
		{
			var Item = this.Content[Index];
			Item.SetParagraphKeepLines(Value);
		}
	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		Item.SetParagraphKeepLines(Value);
	}
};
CDocument.prototype.controller_SetParagraphKeepNext = function(Value)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (EndPos < StartPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		for (var Index = StartPos; Index <= EndPos; Index++)
		{
			var Item = this.Content[Index];
			Item.SetParagraphKeepNext(Value);
		}
	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		Item.SetParagraphKeepNext(Value);
	}
};
CDocument.prototype.controller_SetParagraphWidowControl = function(Value)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (EndPos < StartPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		for (var Index = StartPos; Index <= EndPos; Index++)
		{
			var Item = this.Content[Index];
			Item.SetParagraphWidowControl(Value);
		}
	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		Item.SetParagraphWidowControl(Value);
	}
};
CDocument.prototype.controller_SetParagraphBorders = function(Borders)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	if (true === this.Selection.Use)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (EndPos < StartPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		for (var Index = StartPos; Index <= EndPos; Index++)
		{
			var Item = this.Content[Index];
			Item.SetParagraphBorders(Borders);
		}
	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		if (type_Paragraph == Item.GetType())
		{
			// Мы должны выставить границу для всех параграфов, входящих в текущую группу параграфов
			// с одинаковыми границами

			var StartPos = Item.Index;
			var EndPos   = Item.Index;
			var CurBrd   = Item.Get_CompiledPr().ParaPr.Brd;

			while (true != CurBrd.First)
			{
				StartPos--;
				if (StartPos < 0)
				{
					StartPos = 0;
					break;
				}

				var TempItem = this.Content[StartPos];
				if (type_Paragraph !== TempItem.GetType())
				{
					StartPos++;
					break;
				}

				CurBrd = TempItem.Get_CompiledPr().ParaPr.Brd;
			}

			CurBrd = Item.Get_CompiledPr().ParaPr.Brd;
			while (true != CurBrd.Last)
			{
				EndPos++;
				if (EndPos >= this.Content.length)
				{
					EndPos = this.Content.length - 1;
					break;
				}

				var TempItem = this.Content[EndPos];
				if (type_Paragraph !== TempItem.GetType())
				{
					EndPos--;
					break;
				}

				CurBrd = TempItem.Get_CompiledPr().ParaPr.Brd;
			}

			for (var Index = StartPos; Index <= EndPos; Index++)
				this.Content[Index].SetParagraphBorders(Borders);
		}
		else
		{
			Item.SetParagraphBorders(Borders);
		}
	}
};
CDocument.prototype.controller_SetParagraphFramePr = function(FramePr, bDelete)
{
	if (true === this.Selection.Use)
	{
		if (this.Selection.StartPos === this.Selection.EndPos && type_Paragraph !== this.Content[this.Selection.StartPos].GetType())
		{
			this.Content[this.Selection.StartPos].SetParagraphFramePr(FramePr, bDelete);
			return;
		}

		// Проверим, если у нас все выделенные элементы - параграфы, с одинаковыми настройками
		// FramePr, тогда мы можем применить новую настройку FramePr

		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;

		if (StartPos > EndPos)
		{
			StartPos = this.Selection.EndPos;
			EndPos   = this.Selection.StartPos;
		}

		var Element = this.Content[StartPos];

		if (type_Paragraph !== Element.GetType() || undefined === Element.Get_FramePr())
			return;

		var FramePr = Element.Get_FramePr();
		for (var Pos = StartPos + 1; Pos < EndPos; Pos++)
		{
			var TempElement = this.Content[Pos];

			if (type_Paragraph !== TempElement.GetType() || undefined === TempElement.Get_FramePr() || true != FramePr.Compare(TempElement.Get_FramePr()))
				return;
		}

		// Раз дошли до сюда, значит можно у всех выделенных параграфов менять настройку рамки
		var FrameParas = this.Content[StartPos].Internal_Get_FrameParagraphs();
		var FrameCount = FrameParas.length;
		for (var Pos = 0; Pos < FrameCount; Pos++)
		{
			FrameParas[Pos].Set_FramePr(FramePr, bDelete);
		}
	}
	else
	{
		var Element = this.Content[this.CurPos.ContentPos];

		if (type_Paragraph !== Element.GetType())
		{
			Element.SetParagraphFramePr(FramePr, bDelete);
			return;
		}

		// Возможно, предыдущий элемент является буквицей
		if (undefined === Element.Get_FramePr())
		{
			var PrevElement = Element.Get_DocumentPrev();

			if (type_Paragraph !== PrevElement.GetType() || undefined === PrevElement.Get_FramePr() || undefined === PrevElement.Get_FramePr().DropCap)
				return;

			Element = PrevElement;
		}

		var FrameParas = Element.Internal_Get_FrameParagraphs();
		var FrameCount = FrameParas.length;
		for (var Pos = 0; Pos < FrameCount; Pos++)
		{
			FrameParas[Pos].Set_FramePr(FramePr, bDelete);
		}
	}
};
CDocument.prototype.controller_IncreaseDecreaseFontSize = function(bIncrease)
{
	if (this.CurPos.ContentPos < 0)
		return false;

	if (true === this.Selection.Use)
	{
		switch (this.Selection.Flag)
		{
			case selectionflag_Common:
			{
				var StartPos = this.Selection.StartPos;
				var EndPos   = this.Selection.EndPos;
				if (EndPos < StartPos)
				{
					var Temp = StartPos;
					StartPos = EndPos;
					EndPos   = Temp;
				}

				for (var Index = StartPos; Index <= EndPos; Index++)
				{
					var Item = this.Content[Index];
					Item.IncreaseDecreaseFontSize(bIncrease);
				}
				break;
			}
			case  selectionflag_Numbering:
			{
				var OldFontSize = this.GetCalculatedTextPr().FontSize;
				var NewFontSize = FontSize_IncreaseDecreaseValue(bIncrease, OldFontSize);
				var TextPr      = new CTextPr();
				TextPr.FontSize = NewFontSize;
				this.AddToParagraph(new ParaTextPr(TextPr), true);
				break;
			}
		}
	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		Item.IncreaseDecreaseFontSize(bIncrease);
	}
};
CDocument.prototype.controller_IncreaseDecreaseIndent = function(bIncrease)
{
	if (true === this.Selection.Use && selectionflag_Common === this.Selection.Flag)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (EndPos < StartPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		for (var Index = StartPos; Index <= EndPos; Index++)
		{
			this.Content[Index].IncreaseDecreaseIndent(bIncrease);
		}
	}
	else
	{
		this.Content[this.CurPos.ContentPos].IncreaseDecreaseIndent(bIncrease);
	}
};
CDocument.prototype.controller_SetImageProps = function(Props)
{
	if ((true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos && type_Table == this.Content[this.Selection.StartPos].GetType())
		|| (false == this.Selection.Use && type_Table == this.Content[this.CurPos.ContentPos].GetType()))
	{
		if (true == this.Selection.Use)
			this.Content[this.Selection.StartPos].SetImageProps(Props);
		else
			this.Content[this.CurPos.ContentPos].SetImageProps(Props);
	}
};
CDocument.prototype.controller_SetTableProps = function(Props)
{
	var Pos = -1;
	if (true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos)
		Pos = this.Selection.StartPos;
	else if (false === this.Selection.Use)
		Pos = this.CurPos.ContentPos;

	if (-1 !== Pos)
		this.Content[Pos].SetTableProps(Props);
};
CDocument.prototype.controller_GetCalculatedParaPr = function()
{
	var Result_ParaPr = new CParaPr();
	if (true === this.Selection.Use && selectionflag_Common === this.Selection.Flag)
	{
		var StartPos = this.Selection.StartPos;
		var EndPos   = this.Selection.EndPos;
		if (EndPos < StartPos)
		{
			var Temp = StartPos;
			StartPos = EndPos;
			EndPos   = Temp;
		}

		var StartPr = this.Content[StartPos].GetCalculatedParaPr();
		var Pr      = StartPr.Copy();
		Pr.Locked   = StartPr.Locked;

		for (var Index = StartPos + 1; Index <= EndPos; Index++)
		{
			var Item   = this.Content[Index];
			var TempPr = Item.GetCalculatedParaPr();
			Pr         = Pr.Compare(TempPr);
		}

		if (undefined === Pr.Ind.Left)
			Pr.Ind.Left = StartPr.Ind.Left;

		if (undefined === Pr.Ind.Right)
			Pr.Ind.Right = StartPr.Ind.Right;

		if (undefined === Pr.Ind.FirstLine)
			Pr.Ind.FirstLine = StartPr.Ind.FirstLine;

		Result_ParaPr             = Pr;
		Result_ParaPr.CanAddTable = true !== Pr.Locked;

		// Если мы находимся в рамке, тогда дополняем ее свойства настройками границы и настройкой текста (если это буквица)
		if (undefined != Result_ParaPr.FramePr && type_Paragraph === this.Content[StartPos].GetType())
		{
			this.Content[StartPos].Supplement_FramePr(Result_ParaPr.FramePr);
		}
		else if (StartPos === EndPos && StartPos > 0 && type_Paragraph === this.Content[StartPos - 1].GetType())
		{
			var PrevFrame = this.Content[StartPos - 1].Get_FramePr();
			if (undefined != PrevFrame && undefined != PrevFrame.DropCap)
			{
				Result_ParaPr.FramePr = PrevFrame.Copy();
				this.Content[StartPos - 1].Supplement_FramePr(Result_ParaPr.FramePr);
			}
		}

	}
	else
	{
		var Item = this.Content[this.CurPos.ContentPos];
		if (type_Paragraph == Item.GetType())
		{
			Result_ParaPr             = Item.GetCalculatedParaPr().Copy();
			Result_ParaPr.CanAddTable = true === Result_ParaPr.Locked ? Item.IsCursorAtEnd() : true;

			// Если мы находимся в рамке, тогда дополняем ее свойства настройками границы и настройкой текста (если это буквица)
			if (undefined != Result_ParaPr.FramePr)
			{
				Item.Supplement_FramePr(Result_ParaPr.FramePr);
			}
			else if (this.CurPos.ContentPos > 0 && type_Paragraph === this.Content[this.CurPos.ContentPos - 1].GetType())
			{
				var PrevFrame = this.Content[this.CurPos.ContentPos - 1].Get_FramePr();
				if (undefined != PrevFrame && undefined != PrevFrame.DropCap)
				{
					Result_ParaPr.FramePr = PrevFrame.Copy();
					this.Content[this.CurPos.ContentPos - 1].Supplement_FramePr(Result_ParaPr.FramePr);
				}
			}
		}
		else
		{
			Result_ParaPr = Item.GetCalculatedParaPr();
		}
	}

	if (Result_ParaPr.Shd && Result_ParaPr.Shd.Unifill)
	{
		Result_ParaPr.Shd.Unifill.check(this.theme, this.Get_ColorMap());
	}

	return Result_ParaPr;
};
CDocument.prototype.controller_GetCalculatedTextPr = function()
{
	var Result_TextPr = null;
	if (true === this.Selection.Use)
	{
		var VisTextPr;
		switch (this.Selection.Flag)
		{
			case selectionflag_Common:
			{
				var StartPos = this.Selection.StartPos;
				var EndPos   = this.Selection.EndPos;
				if (EndPos < StartPos)
				{
					var Temp = StartPos;
					StartPos = EndPos;
					EndPos   = Temp;
				}

				VisTextPr = this.Content[StartPos].GetCalculatedTextPr();

				for (var Index = StartPos + 1; Index <= EndPos; Index++)
				{
					var CurPr = this.Content[Index].GetCalculatedTextPr();
					VisTextPr = VisTextPr.Compare(CurPr);
				}

				break;
			}
			case selectionflag_Numbering:
			{
				if (!this.Selection.Data || !this.Selection.Data.CurPara)
					break;

				VisTextPr = this.Selection.Data.CurPara.GetNumberingTextPr();
				break;
			}
		}

		Result_TextPr = VisTextPr;
	}
	else
	{
		Result_TextPr = this.Content[this.CurPos.ContentPos].GetCalculatedTextPr();
	}

	return Result_TextPr;
};
CDocument.prototype.controller_GetDirectParaPr = function()
{
	var Result_ParaPr = null;

	if (true === this.Selection.Use)
	{
		switch (this.Selection.Flag)
		{
			case selectionflag_Common:
			{
				var StartPos = this.Selection.StartPos;
				if (this.Selection.EndPos < StartPos)
					StartPos = this.Selection.EndPos;

				var Item      = this.Content[StartPos];
				Result_ParaPr = Item.GetDirectParaPr();

				break;
			}
			case selectionflag_Numbering:
			{
				if (!this.Selection.Data || !this.Selection.Data.CurPara)
					break;

				var oNumPr    = this.Selection.Data.CurPara.GetNumPr();
				Result_ParaPr = this.GetNumbering().GetNum(oNumPr.NumId).GetLvl(oNumPr.Lvl).GetParaPr();

				break;
			}
		}
	}
	else
	{
		var Item      = this.Content[this.CurPos.ContentPos];
		Result_ParaPr = Item.GetDirectParaPr();
	}

	return Result_ParaPr;
};
CDocument.prototype.controller_GetDirectTextPr = function()
{
	var Result_TextPr = null;

	if (true === this.Selection.Use)
	{
		var VisTextPr;
		switch (this.Selection.Flag)
		{
			case selectionflag_Common:
			{
				var StartPos = this.Selection.StartPos;
				if (this.Selection.EndPos < StartPos)
					StartPos = this.Selection.EndPos;

				var Item  = this.Content[StartPos];
				VisTextPr = Item.GetDirectTextPr();

				break;
			}
			case selectionflag_Numbering:
			{
				if (!this.Selection.Data || !this.Selection.Data.CurPara)
					break;

				var oNumPr = this.Selection.Data.CurPara.GetNumPr();
				VisTextPr  = this.GetNumbering().GetNum(oNumPr.NumId).GetLvl(oNumPr.Lvl).GetTextPr();

				break;
			}
		}

		Result_TextPr = VisTextPr;
	}
	else
	{
		var Item      = this.Content[this.CurPos.ContentPos];
		Result_TextPr = Item.GetDirectTextPr();
	}

	return Result_TextPr;
};
CDocument.prototype.controller_RemoveSelection = function(bNoCheckDrawing)
{
	if (true === this.Selection.Use)
	{
		switch (this.Selection.Flag)
		{
			case selectionflag_Common:
			{
				var Start = this.Selection.StartPos;
				var End   = this.Selection.EndPos;

				if (Start > End)
				{
					var Temp = Start;
					Start    = End;
					End      = Temp;
				}

				Start = Math.max(0, Start);
				End   = Math.min(this.Content.length - 1, End);

				for (var Index = Start; Index <= End; Index++)
				{
					this.Content[Index].RemoveSelection();
				}

				this.Selection.Use   = false;
				this.Selection.Start = false;

				this.Selection.StartPos = 0;
				this.Selection.EndPos   = 0;

				// Убираем селект и возвращаем курсор
				this.DrawingDocument.SelectEnabled(false);
				this.DrawingDocument.TargetStart();
				this.DrawingDocument.TargetShow();

				break;
			}
			case selectionflag_Numbering:
			{
				if (!this.Selection.Data)
					break;

				for (var nIndex = 0, nCount = this.Selection.Data.Paragraphs.length; nIndex < nCount; ++nIndex)
				{
					this.Selection.Data.Paragraphs[nIndex].RemoveSelection();
				}

				if (this.Selection.Data.CurPara)
				{
					this.Selection.Data.CurPara.RemoveSelection();
					this.Selection.Data.CurPara.MoveCursorToStartPos();
				}

				var Start = this.Selection.StartPos;
				var End   = this.Selection.EndPos;

				if (Start > End)
				{
					var Temp = Start;
					Start    = End;
					End      = Temp;
				}

				Start = Math.max(0, Start);
				End   = Math.min(this.Content.length - 1, End);

				for (var Index = Start; Index <= End; Index++)
				{
					this.Content[Index].RemoveSelection();
				}

				this.Selection.Use   = false;
				this.Selection.Start = false;
				this.Selection.Flag  = selectionflag_Common;

				// Убираем селект и возвращаем курсор
				this.DrawingDocument.SelectEnabled(false);
				this.DrawingDocument.TargetStart();
				this.DrawingDocument.TargetShow();

				break;
			}
		}
	}
};
CDocument.prototype.controller_IsSelectionEmpty = function(bCheckHidden)
{
	if (true === this.Selection.Use)
	{
		if (selectionflag_Numbering == this.Selection.Flag)
			return false;
		else if (true === this.IsMovingTableBorder())
			return false;
		else
		{
			if (this.Selection.StartPos === this.Selection.EndPos)
				return this.Content[this.Selection.StartPos].IsSelectionEmpty(bCheckHidden);
			else
				return false;
		}
	}

	return true;
};
CDocument.prototype.controller_DrawSelectionOnPage = function(PageAbs)
{
	if (true !== this.Selection.Use)
		return;

	var Page = this.Pages[PageAbs];
	for (var SectionIndex = 0, SectionsCount = Page.Sections.length; SectionIndex < SectionsCount; ++SectionIndex)
	{
		var PageSection = Page.Sections[SectionIndex];
		for (var ColumnIndex = 0, ColumnsCount = PageSection.Columns.length; ColumnIndex < ColumnsCount; ++ColumnIndex)
		{
			var Pos_start = this.Pages[PageAbs].Pos;
			var Pos_end   = this.Pages[PageAbs].EndPos;

			switch (this.Selection.Flag)
			{
				case selectionflag_Common:
				{
					var Start = this.Selection.StartPos;
					var End   = this.Selection.EndPos;

					if (Start > End)
					{
						Start = this.Selection.EndPos;
						End   = this.Selection.StartPos;
					}

					var Start = Math.max(Start, Pos_start);
					var End   = Math.min(End, Pos_end);

					for (var Index = Start; Index <= End; ++Index)
					{
						var ElementPage = this.private_GetElementPageIndex(Index, PageAbs, ColumnIndex, ColumnsCount);
						this.Content[Index].DrawSelectionOnPage(ElementPage);
					}

					if (PageAbs >= 2 && End < this.Pages[PageAbs - 2].EndPos)
					{
						this.Selection.UpdateOnRecalc = false;
						this.DrawingDocument.OnSelectEnd();
					}

					break;
				}
				case selectionflag_Numbering:
				{
					if (!this.Selection.Data)
						break;

					for (var nIndex = 0, nCount = this.Selection.Data.Paragraphs.length; nIndex < nCount; ++nIndex)
					{
						var oPara = this.Selection.Data.Paragraphs[nIndex];
						if (oPara.GetNumberingPage(true) === PageAbs)
							oPara.DrawSelectionOnPage(oPara.GetNumberingPage(false));
					}

					if (PageAbs >= 2 && this.Selection.Data[this.Selection.Data.length - 1] < this.Pages[PageAbs - 2].EndPos)
					{
						this.Selection.UpdateOnRecalc = false;
						this.DrawingDocument.OnSelectEnd();
					}

					break;
				}
			}
		}
	}
};
CDocument.prototype.controller_GetSelectionBounds = function()
{
	if (true === this.Selection.Use && selectionflag_Common === this.Selection.Flag)
	{
		var Start = this.Selection.StartPos;
		var End   = this.Selection.EndPos;

		if (Start > End)
		{
			Start = this.Selection.EndPos;
			End   = this.Selection.StartPos;
		}

		if (Start === End)
			return this.Content[Start].GetSelectionBounds();
		else
		{
			var Result       = {};
			Result.Start     = this.Content[Start].GetSelectionBounds().Start;
			Result.End       = this.Content[End].GetSelectionBounds().End;
			Result.Direction = (this.Selection.StartPos > this.Selection.EndPos ? -1 : 1);
			return Result;
		}
	}
	else if (this.Content[this.CurPos.ContentPos])
	{
		return this.Content[this.CurPos.ContentPos].GetSelectionBounds();
	}

	return null;
};
CDocument.prototype.controller_IsMovingTableBorder = function()
{
	if (null != this.Selection.Data && true === this.Selection.Data.TableBorder)
		return true;

	return false;
};
CDocument.prototype.controller_CheckPosInSelection = function(X, Y, PageAbs, NearPos)
{
	if (true === this.Footnotes.CheckHitInFootnote(X, Y, PageAbs))
		return false;

	if (true === this.Selection.Use)
	{
		switch (this.Selection.Flag)
		{
			case selectionflag_Common:
			{
				var Start = this.Selection.StartPos;
				var End   = this.Selection.EndPos;

				if (Start > End)
				{
					Start = this.Selection.EndPos;
					End   = this.Selection.StartPos;
				}

				if (undefined !== NearPos)
				{
					for (var Index = Start; Index <= End; Index++)
					{
						if (true === this.Content[Index].CheckPosInSelection(0, 0, 0, NearPos))
							return true;
					}

					return false;
				}
				else
				{
					var ContentPos = this.Internal_GetContentPosByXY(X, Y, PageAbs, NearPos);
					if (ContentPos > Start && ContentPos < End)
					{
						return true;
					}
					else if (ContentPos < Start || ContentPos > End)
					{
						return false;
					}
					else
					{
						var ElementPageIndex = this.private_GetElementPageIndexByXY(ContentPos, X, Y, PageAbs);
						return this.Content[ContentPos].CheckPosInSelection(X, Y, ElementPageIndex, undefined);
					}
				}
			}
			case selectionflag_Numbering:
			{
				return false;
			}
		}

		return false;
	}

	return false;
};
CDocument.prototype.controller_SelectAll = function()
{
	if (true === this.Selection.Use)
		this.RemoveSelection();

	this.DrawingDocument.SelectEnabled(true);
	this.DrawingDocument.TargetEnd();

	this.SetDocPosType(docpostype_Content);

	this.Selection.Use   = true;
	this.Selection.Start = false;
	this.Selection.Flag  = selectionflag_Common;

	this.Selection.StartPos = 0;
	this.Selection.EndPos   = this.Content.length - 1;

	for (var Index = 0; Index < this.Content.length; Index++)
	{
		this.Content[Index].SelectAll();
	}
};
CDocument.prototype.controller_GetSelectedContent = function(oSelectedContent)
{
	if (true !== this.Selection.Use || this.Selection.Flag !== selectionflag_Common)
		return;

	var StartPos = this.Selection.StartPos;
	var EndPos   = this.Selection.EndPos;
	if (StartPos > EndPos)
	{
		StartPos = this.Selection.EndPos;
		EndPos   = this.Selection.StartPos;
	}

	for (var Index = StartPos; Index <= EndPos; Index++)
	{
		this.Content[Index].GetSelectedContent(oSelectedContent);
	}

	oSelectedContent.SetLastSection(this.SectionsInfo.Get_SectPr(EndPos).SectPr);
};
CDocument.prototype.controller_UpdateCursorType = function(X, Y, PageAbs, MouseEvent)
{
	var bInText      = (null === this.IsInText(X, Y, PageAbs) ? false : true);
	var bTableBorder = (null === this.IsTableBorder(X, Y, PageAbs) ? false : true);

	// Ничего не делаем
	if (true === this.DrawingObjects.updateCursorType(PageAbs, X, Y, MouseEvent, ( true === bInText || true === bTableBorder ? true : false )))
		return;

	var ContentPos       = this.Internal_GetContentPosByXY(X, Y, PageAbs);
	var Item             = this.Content[ContentPos];
	var ElementPageIndex = this.private_GetElementPageIndexByXY(ContentPos, X, Y, PageAbs);
	Item.UpdateCursorType(X, Y, ElementPageIndex);
};
CDocument.prototype.controller_PasteFormatting = function(TextPr, ParaPr)
{
	if (true === this.Selection.Use)
	{
		if (selectionflag_Common === this.Selection.Flag)
		{
			var Start = this.Selection.StartPos;
			var End   = this.Selection.EndPos;
			if (Start > End)
			{
				Start = this.Selection.EndPos;
				End   = this.Selection.StartPos;
			}

			for (var Pos = Start; Pos <= End; Pos++)
			{
				this.Content[Pos].PasteFormatting(TextPr, ParaPr, Start === End ? false : true);
			}
		}
	}
	else
	{
		this.Content[this.CurPos.ContentPos].PasteFormatting(TextPr, ParaPr, true);
	}
};
CDocument.prototype.controller_IsSelectionUse = function()
{
	if (true === this.Selection.Use)
		return true;

	return false;
};
CDocument.prototype.controller_IsNumberingSelection = function()
{
	return CDocumentContentBase.prototype.IsNumberingSelection.apply(this, arguments);
};
CDocument.prototype.controller_IsTextSelectionUse = function()
{
	return this.Selection.Use;
};
CDocument.prototype.controller_GetCurPosXY = function()
{
	if (true === this.Selection.Use)
	{
		if (selectionflag_Numbering === this.Selection.Flag)
			return {X : 0, Y : 0};
		else
			return this.Content[this.Selection.EndPos].GetCurPosXY();
	}
	else
	{
		return this.Content[this.CurPos.ContentPos].GetCurPosXY();
	}
};
CDocument.prototype.controller_GetSelectedText = function(bClearText, oPr)
{
	if ((true === this.Selection.Use && selectionflag_Common === this.Selection.Flag) || false === this.Selection.Use)
	{
		if (true === bClearText && this.Selection.StartPos === this.Selection.EndPos)
		{
			var Pos = ( true == this.Selection.Use ? this.Selection.StartPos : this.CurPos.ContentPos );
			return this.Content[Pos].GetSelectedText(true, oPr);
		}
		else if (false === bClearText)
		{
			var StartPos = ( true == this.Selection.Use ? Math.min(this.Selection.StartPos, this.Selection.EndPos) : this.CurPos.ContentPos );
			var EndPos   = ( true == this.Selection.Use ? Math.max(this.Selection.StartPos, this.Selection.EndPos) : this.CurPos.ContentPos );

			var ResultText = "";

			for (var Index = StartPos; Index <= EndPos; Index++)
			{
				ResultText += this.Content[Index].GetSelectedText(false, oPr);
			}

			return ResultText;
		}
	}

	return null;
};
CDocument.prototype.controller_GetCurrentParagraph = function(bIgnoreSelection, arrSelectedParagraphs, oPr)
{
	if (null !== arrSelectedParagraphs)
	{
		if (true === this.Selection.Use)
		{
			var nStartPos = this.Selection.StartPos <= this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos;
			var nEndPos   = this.Selection.StartPos <= this.Selection.EndPos ? this.Selection.EndPos : this.Selection.StartPos;
			for (var nPos = nStartPos; nPos <= nEndPos; ++nPos)
			{
				this.Content[nPos].GetCurrentParagraph(false, arrSelectedParagraphs, oPr);
			}
		}
		else
		{
			this.Content[this.CurPos.ContentPos].GetCurrentParagraph(false, arrSelectedParagraphs, oPr);
		}
	}
	else
	{
		var Pos = true === this.Selection.Use && true !== bIgnoreSelection ? this.Selection.StartPos : this.CurPos.ContentPos;
		if (Pos < 0 || Pos >= this.Content.length)
			return null;

		return this.Content[Pos].GetCurrentParagraph(bIgnoreSelection, null, oPr);
	}
};
CDocument.prototype.controller_GetSelectedElementsInfo = function(oInfo)
{
	if (true === this.Selection.Use)
	{
		if (selectionflag_Numbering === this.Selection.Flag)
		{
			if (this.Selection.Data && this.Selection.Data.CurPara)
			{
				this.Selection.Data.CurPara.GetSelectedElementsInfo(oInfo);
			}
		}
		else
		{
			if (this.Selection.StartPos !== this.Selection.EndPos)
				oInfo.Set_MixedSelection();

			if (oInfo.IsCheckAllSelection() || this.Selection.StartPos === this.Selection.EndPos)
			{
				var nStart = this.Selection.StartPos < this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos;
				var nEnd   = this.Selection.StartPos < this.Selection.EndPos ? this.Selection.EndPos : this.Selection.StartPos;

				for (var nPos = nStart; nPos <= nEnd; ++nPos)
				{
					this.Content[nPos].GetSelectedElementsInfo(oInfo);
				}
			}
		}
	}
	else
	{
		this.Content[this.CurPos.ContentPos].GetSelectedElementsInfo(oInfo);
	}
};
CDocument.prototype.controller_AddTableRow = function(bBefore)
{
	if ((true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos && type_Paragraph !== this.Content[this.Selection.StartPos].GetType())
		|| (false == this.Selection.Use && type_Paragraph !== this.Content[this.CurPos.ContentPos].GetType()))
	{
		var Pos = 0;
		if (true === this.Selection.Use)
			Pos = this.Selection.StartPos;
		else
			Pos = this.CurPos.ContentPos;

		this.Content[Pos].AddTableRow(bBefore);

		if (false === this.Selection.Use && true === this.Content[Pos].IsSelectionUse())
		{
			this.Selection.Use      = true;
			this.Selection.StartPos = Pos;
			this.Selection.EndPos   = Pos;
		}
	}
};
CDocument.prototype.controller_AddTableColumn = function(bBefore)
{
	if ((true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos && type_Paragraph !== this.Content[this.Selection.StartPos].GetType())
		|| (false == this.Selection.Use && type_Paragraph !== this.Content[this.CurPos.ContentPos].GetType()))
	{
		var Pos = 0;
		if (true === this.Selection.Use)
			Pos = this.Selection.StartPos;
		else
			Pos = this.CurPos.ContentPos;

		this.Content[Pos].AddTableColumn(bBefore);

		if (false === this.Selection.Use && true === this.Content[Pos].IsSelectionUse())
		{
			this.Selection.Use      = true;
			this.Selection.StartPos = Pos;
			this.Selection.EndPos   = Pos;
		}
	}
};
CDocument.prototype.controller_RemoveTableRow = function()
{
	if ((true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos && type_Paragraph !== this.Content[this.Selection.StartPos].GetType())
		|| (false == this.Selection.Use && type_Paragraph !== this.Content[this.CurPos.ContentPos].GetType()))
	{
		var Pos = 0;
		if (true === this.Selection.Use)
			Pos = this.Selection.StartPos;
		else
			Pos = this.CurPos.ContentPos;

		if (false === this.Content[Pos].RemoveTableRow())
			this.controller_RemoveTable();
	}
};
CDocument.prototype.controller_RemoveTableColumn = function()
{
	if ((true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos && type_Paragraph !== this.Content[this.Selection.StartPos].GetType())
		|| (false == this.Selection.Use && type_Paragraph !== this.Content[this.CurPos.ContentPos].GetType()))
	{
		var Pos = 0;
		if (true === this.Selection.Use)
			Pos = this.Selection.StartPos;
		else
			Pos = this.CurPos.ContentPos;

		if (false === this.Content[Pos].RemoveTableColumn())
			this.controller_RemoveTable();
	}
};
CDocument.prototype.controller_MergeTableCells = function()
{
	if ((true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos && type_Paragraph !== this.Content[this.Selection.StartPos].GetType())
		|| (false == this.Selection.Use && type_Paragraph !== this.Content[this.CurPos.ContentPos].GetType()))
	{
		var Pos = 0;
		if (true === this.Selection.Use)
			Pos = this.Selection.StartPos;
		else
			Pos = this.CurPos.ContentPos;

		this.Content[Pos].MergeTableCells();
	}
};
CDocument.prototype.controller_DistributeTableCells = function(isHorizontally)
{
	if ((true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos && type_Paragraph !== this.Content[this.Selection.StartPos].GetType())
		|| (false == this.Selection.Use && type_Paragraph !== this.Content[this.CurPos.ContentPos].GetType()))
	{
		var Pos = 0;
		if (true === this.Selection.Use)
			Pos = this.Selection.StartPos;
		else
			Pos = this.CurPos.ContentPos;

		return this.Content[Pos].DistributeTableCells(isHorizontally);
	}

	return false;
};
CDocument.prototype.controller_SplitTableCells = function(nCols, nRows)
{
	var nPos = true === this.Selection.Use ? this.Selection.StartPos : this.CurPos.ContentPos;
	this.Content[nPos].SplitTableCells(nCols, nRows);
};
CDocument.prototype.controller_RemoveTableCells = function()
{
	if ((true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos && !this.Content[this.Selection.StartPos].IsParagraph())
		|| (false == this.Selection.Use && !this.Content[this.CurPos.ContentPos].IsParagraph()))
	{
		var nPos = true === this.Selection.Use ? this.Selection.StartPos : this.CurPos.ContentPos;
		if (false === this.Content[nPos].RemoveTableCells())
			this.controller_RemoveTable();
	}
};
CDocument.prototype.controller_RemoveTable = function()
{
	if ((true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos && type_Paragraph !== this.Content[this.Selection.StartPos].GetType())
		|| (false == this.Selection.Use && type_Paragraph !== this.Content[this.CurPos.ContentPos].GetType()))
	{
		var Pos;
		if (true === this.Selection.Use)
			Pos = this.Selection.StartPos;
		else
			Pos = this.CurPos.ContentPos;

		var Table = this.Content[Pos];

		if (type_Table === Table.GetType())
		{
			if (true === Table.IsInnerTable())
			{
				Table.RemoveInnerTable();
			}
			else
			{
				this.RemoveSelection();
				Table.PreDelete();
				this.Internal_Content_Remove(Pos, 1);

				if (Pos >= this.Content.length - 1)
					Pos--;

				if (Pos < 0)
					Pos = 0;

				this.SetDocPosType(docpostype_Content);
				this.CurPos.ContentPos = Pos;
				this.Content[Pos].MoveCursorToStartPos();
			}
		}
		else
		{
			Table.RemoveTable();
		}
	}
};
CDocument.prototype.controller_SelectTable = function(Type)
{
	if ((true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos && type_Paragraph !== this.Content[this.Selection.StartPos].GetType())
		|| (false == this.Selection.Use && type_Paragraph !== this.Content[this.CurPos.ContentPos].GetType()))
	{
		var Pos = 0;
		if (true === this.Selection.Use)
			Pos = this.Selection.StartPos;
		else
			Pos = this.CurPos.ContentPos;

		this.Content[Pos].SelectTable(Type);
		if (false === this.Selection.Use && true === this.Content[Pos].IsSelectionUse())
		{
			this.Selection.Use      = true;
			this.Selection.StartPos = Pos;
			this.Selection.EndPos   = Pos;
		}
	}
};
CDocument.prototype.controller_CanMergeTableCells = function()
{
	if ((true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos && type_Paragraph !== this.Content[this.Selection.StartPos].GetType())
		|| (false == this.Selection.Use && type_Paragraph !== this.Content[this.CurPos.ContentPos].GetType()))
	{
		var Pos = 0;
		if (true === this.Selection.Use)
			Pos = this.Selection.StartPos;
		else
			Pos = this.CurPos.ContentPos;

		return this.Content[Pos].CanMergeTableCells();
	}

	return false;
};
CDocument.prototype.controller_CanSplitTableCells = function()
{
	var nPos = true === this.Selection.Use ? this.Selection.StartPos : this.CurPos.ContentPos;
	return this.Content[nPos].CanSplitTableCells();
};
CDocument.prototype.controller_UpdateInterfaceState = function()
{
	if ((true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos && type_Paragraph !== this.Content[this.Selection.StartPos].GetType())
		|| (false == this.Selection.Use && type_Paragraph !== this.Content[this.CurPos.ContentPos].GetType()))
	{
		this.Interface_Update_TablePr();

		if (true == this.Selection.Use)
			this.Content[this.Selection.StartPos].Document_UpdateInterfaceState();
		else
			this.Content[this.CurPos.ContentPos].Document_UpdateInterfaceState();
	}
	else
	{
		this.Interface_Update_ParaPr();
		this.Interface_Update_TextPr();

		// Если у нас в выделении находится 1 параграф, или курсор находится в параграфе
		if (docpostype_Content == this.CurPos.Type && ( ( true === this.Selection.Use && this.Selection.StartPos == this.Selection.EndPos && type_Paragraph == this.Content[this.Selection.StartPos].GetType() ) || ( false == this.Selection.Use && type_Paragraph == this.Content[this.CurPos.ContentPos].GetType() ) ))
		{
			if (true == this.Selection.Use)
				this.Content[this.Selection.StartPos].Document_UpdateInterfaceState();
			else
				this.Content[this.CurPos.ContentPos].Document_UpdateInterfaceState();
		}
	}
};
CDocument.prototype.controller_UpdateRulersState = function()
{
	this.Document_UpdateRulersStateBySection();

	if (true === this.Selection.Use)
	{
		var oSelection = this.private_GetSelectionPos(false);

		if (oSelection.Start === oSelection.End && type_Paragraph !== this.Content[oSelection.Start].GetType())
		{
			var PagePos = this.Get_DocumentPagePositionByContentPosition(this.GetContentPosition(true, true));

			var Page   = PagePos ? PagePos.Page : this.CurPage;
			var Column = PagePos ? PagePos.Column : 0;

			var ElementPos       = oSelection.Start;
			var Element          = this.Content[ElementPos];
			var ElementPageIndex = this.private_GetElementPageIndex(ElementPos, Page, Column, Element.Get_ColumnsCount());
			Element.Document_UpdateRulersState(ElementPageIndex);
		}
		else
		{
			var StartPos = oSelection.Start;
			var EndPos   = oSelection.End;

			var FramePr = undefined;

			for (var Pos = StartPos; Pos <= EndPos; Pos++)
			{
				var Element = this.Content[Pos];
				if (type_Paragraph != Element.GetType())
				{
					FramePr = undefined;
					break;
				}
				else
				{
					var TempFramePr = Element.Get_FramePr();
					if (undefined === FramePr)
					{
						if (undefined === TempFramePr)
							break;

						FramePr = TempFramePr;
					}
					else if (undefined === TempFramePr || false === FramePr.Compare(TempFramePr))
					{
						FramePr = undefined;
						break;
					}
				}
			}

			if (undefined !== FramePr)
				this.Content[StartPos].Document_UpdateRulersState();
		}
	}
	else
	{
		this.private_CheckCurPage();

		if (this.CurPos.ContentPos >= 0 && (null === this.FullRecalc.Id || this.FullRecalc.StartIndex > this.CurPos.ContentPos))
		{
			var PagePos = this.Get_DocumentPagePositionByContentPosition(this.GetContentPosition(false));

			var Page   = PagePos ? PagePos.Page : this.CurPage;
			var Column = PagePos ? PagePos.Column : 0;

			var ElementPos       = this.CurPos.ContentPos;
			var Element          = this.Content[ElementPos];
			var ElementPageIndex = this.private_GetElementPageIndex(ElementPos, Page, Column, Element.Get_ColumnsCount());
			Element.Document_UpdateRulersState(ElementPageIndex);
		}
	}
};
CDocument.prototype.controller_UpdateSelectionState = function()
{
	if (true === this.Selection.Use)
	{
		// Выделение нумерации
		if (selectionflag_Numbering == this.Selection.Flag)
		{
			this.DrawingDocument.TargetEnd();
			this.DrawingDocument.SelectEnabled(true);
			this.DrawingDocument.SelectShow();
		}
		// Обрабатываем движение границы у таблиц
		else if (true === this.IsMovingTableBorder())
		{
			// Убираем курсор, если он был
			this.DrawingDocument.TargetEnd();
			this.DrawingDocument.SetCurrentPage(this.CurPage);
		}
		else
		{
			if (false === this.IsSelectionEmpty() || !this.RemoveEmptySelection)
			{
				if (true !== this.Selection.Start)
				{
					this.private_CheckCurPage();
					this.RecalculateCurPos();
				}
				this.private_UpdateTracks(true, false);

				this.DrawingDocument.TargetEnd();
				this.DrawingDocument.SelectEnabled(true);
				this.DrawingDocument.SelectShow();
			}
			else
			{
				if (true !== this.Selection.Start)
				{
					this.RemoveSelection();
				}

				this.private_CheckCurPage();
				this.RecalculateCurPos();
				this.private_UpdateTracks(true, true);

				this.DrawingDocument.SelectEnabled(false);
				this.DrawingDocument.TargetStart();
				this.DrawingDocument.TargetShow();
			}
		}
	}
	else
	{
		this.RemoveSelection();
		this.private_CheckCurPage();
		this.RecalculateCurPos();
		this.private_UpdateTracks(false, false);

		this.DrawingDocument.SelectEnabled(false);
		this.DrawingDocument.TargetShow();
	}
};
CDocument.prototype.controller_GetSelectionState = function()
{
	var State;
	if (true === this.Selection.Use)
	{
		if (this.controller_IsNumberingSelection() || this.controller_IsMovingTableBorder())
		{
			State = [];
		}
		else
		{
			var StartPos = this.Selection.StartPos;
			var EndPos   = this.Selection.EndPos;
			if (StartPos > EndPos)
			{
				var Temp = StartPos;
				StartPos = EndPos;
				EndPos   = Temp;
			}

			State = [];

			var TempState = [];
			for (var Index = StartPos; Index <= EndPos; Index++)
			{
				TempState.push(this.Content[Index].GetSelectionState());
			}

			State.push(TempState);
		}
	}
	else
	{
		State = this.Content[this.CurPos.ContentPos].GetSelectionState();
	}

	return State;
};
CDocument.prototype.controller_SetSelectionState = function(State, StateIndex)
{
	if (true === this.Selection.Use)
	{
		// Выделение нумерации
		if (selectionflag_Numbering == this.Selection.Flag)
		{
			if (type_Paragraph === this.Content[this.Selection.StartPos].Get_Type())
			{
				var NumPr = this.Content[this.Selection.StartPos].GetNumPr();
				if (undefined !== NumPr)
					this.SelectNumbering(NumPr, this.Content[this.Selection.StartPos]);
				else
					this.RemoveSelection();
			}
			else
				this.RemoveSelection();
		}
		else
		{
			var StartPos = this.Selection.StartPos;
			var EndPos   = this.Selection.EndPos;
			if (StartPos > EndPos)
			{
				var Temp = StartPos;
				StartPos = EndPos;
				EndPos   = Temp;
			}

			var CurState = State[StateIndex];
			for (var Index = StartPos; Index <= EndPos; Index++)
			{
				this.Content[Index].SetSelectionState(CurState[Index - StartPos], CurState[Index - StartPos].length - 1);
			}
		}
	}
	else
	{
		this.Content[this.CurPos.ContentPos].SetSelectionState(State, StateIndex);
	}
};
CDocument.prototype.controller_AddHyperlink = function(Props)
{
	if (false === this.Selection.Use || this.Selection.StartPos === this.Selection.EndPos)
	{
		var Pos = ( true == this.Selection.Use ? this.Selection.StartPos : this.CurPos.ContentPos );
		this.Content[Pos].AddHyperlink(Props);
	}
};
CDocument.prototype.controller_ModifyHyperlink = function(Props)
{
	if (false == this.Selection.Use || this.Selection.StartPos == this.Selection.EndPos)
	{
		var Pos = ( true == this.Selection.Use ? this.Selection.StartPos : this.CurPos.ContentPos );
		this.Content[Pos].ModifyHyperlink(Props);
	}
};
CDocument.prototype.controller_RemoveHyperlink = function()
{
	if (false == this.Selection.Use || this.Selection.StartPos == this.Selection.EndPos)
	{
		var Pos = ( true == this.Selection.Use ? this.Selection.StartPos : this.CurPos.ContentPos );
		this.Content[Pos].RemoveHyperlink();
	}
};
CDocument.prototype.controller_CanAddHyperlink = function(bCheckInHyperlink)
{
	if (true === this.Selection.Use)
	{
		if (selectionflag_Common === this.Selection.Flag)
		{
			if (this.Selection.StartPos != this.Selection.EndPos)
				return false;

			return this.Content[this.Selection.StartPos].CanAddHyperlink(bCheckInHyperlink);
		}
	}
	else
	{
		return this.Content[this.CurPos.ContentPos].CanAddHyperlink(bCheckInHyperlink);
	}

	return false;
};
CDocument.prototype.controller_IsCursorInHyperlink = function(bCheckEnd)
{
	if (true === this.Selection.Use)
	{
		if (selectionflag_Common === this.Selection.Flag)
		{
			if (this.Selection.StartPos != this.Selection.EndPos)
				return null;

			return this.Content[this.Selection.StartPos].IsCursorInHyperlink(bCheckEnd);
		}
	}
	else
	{
		return this.Content[this.CurPos.ContentPos].IsCursorInHyperlink(bCheckEnd);
	}

	return null;
};
CDocument.prototype.controller_AddComment = function(Comment)
{
	if (selectionflag_Numbering === this.Selection.Flag)
		return;

	if (true === this.Selection.Use)
	{
		var StartPos, EndPos;
		if (this.Selection.StartPos < this.Selection.EndPos)
		{
			StartPos = this.Selection.StartPos;
			EndPos   = this.Selection.EndPos;
		}
		else
		{
			StartPos = this.Selection.EndPos;
			EndPos   = this.Selection.StartPos;
		}

		if (StartPos === EndPos)
		{
			this.Content[StartPos].AddComment(Comment, true, true);
		}
		else
		{
			this.Content[StartPos].AddComment(Comment, true, false);
			this.Content[EndPos].AddComment(Comment, false, true);
		}
	}
	else
	{
		this.Content[this.CurPos.ContentPos].AddComment(Comment, true, true);
	}
};
CDocument.prototype.controller_CanAddComment = function()
{
	if (selectionflag_Common === this.Selection.Flag)
	{
		if (true === this.Selection.Use && this.Selection.StartPos != this.Selection.EndPos)
		{
			return true;
		}
		else
		{
			var Pos     = ( this.Selection.Use === true ? this.Selection.StartPos : this.CurPos.ContentPos );
			var Element = this.Content[Pos];
			return Element.CanAddComment();
		}
	}

	return false;
};
CDocument.prototype.controller_GetSelectionAnchorPos = function()
{
	var Pos = ( true === this.Selection.Use ? ( this.Selection.StartPos < this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos ) : this.CurPos.ContentPos );
	return this.Content[Pos].GetSelectionAnchorPos();
};
CDocument.prototype.controller_StartSelectionFromCurPos = function()
{
	this.Selection.StartPos = this.CurPos.ContentPos;
	this.Selection.EndPos   = this.CurPos.ContentPos;
	this.Content[this.CurPos.ContentPos].StartSelectionFromCurPos();
};
CDocument.prototype.controller_SaveDocumentStateBeforeLoadChanges = function(State)
{
	State.Pos      = this.GetContentPosition(false, false);
	State.StartPos = this.GetContentPosition(true, true);
	State.EndPos   = this.GetContentPosition(true, false);
};
CDocument.prototype.controller_RestoreDocumentStateAfterLoadChanges = function(State)
{
	if (true === this.Selection.Use)
	{
		this.SetContentPosition(State.StartPos, 0, 0);
		this.SetContentSelection(State.StartPos, State.EndPos, 0, 0, 0);
	}
	else
	{
		this.SetContentPosition(State.Pos, 0, 0);
		this.NeedUpdateTarget = true;
	}
};
CDocument.prototype.controller_GetColumnSize = function()
{
	var nContentPos = true === this.Selection.Use ? ( this.Selection.StartPos < this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos ) : this.CurPos.ContentPos;

	var oPagePos   = this.Get_DocumentPagePositionByContentPosition(this.GetContentPosition(this.Selection.Use, false));
	var nColumnAbs = oPagePos ? oPagePos.Column : 0;
	var nPageAbs   = oPagePos ? oPagePos.Page : 0;

	var oSectPr = this.Get_SectPr(nContentPos);
	var oFrame  = oSectPr.GetContentFrame(nPageAbs);

	var Y      = oFrame.Top;
	var YLimit = oFrame.Bottom;
	var X      = oFrame.Left;
	var XLimit = oFrame.Right;

	var ColumnsCount = oSectPr.GetColumnsCount();
	for (var ColumnIndex = 0; ColumnIndex < nColumnAbs; ++ColumnIndex)
	{
		X += oSectPr.GetColumnWidth(ColumnIndex);
		X += oSectPr.GetColumnSpace(ColumnIndex);
	}

	if (ColumnsCount - 1 !== nColumnAbs)
		XLimit = X + oSectPr.GetColumnWidth(nColumnAbs);

	return {
		W : XLimit - X,
		H : YLimit - Y
	};
};
CDocument.prototype.controller_GetCurrentSectionPr = function()
{
	var nContentPos = this.CurPos.ContentPos;
	return this.SectionsInfo.Get_SectPr(nContentPos).SectPr;
};
CDocument.prototype.controller_AddContentControl = function(nContentControlType)
{
	return this.private_AddContentControl(nContentControlType);
};
CDocument.prototype.controller_GetStyleFromFormatting = function()
{
	if (true == this.Selection.Use)
	{
		if (this.Selection.StartPos > this.Selection.EndPos)
			return this.Content[this.Selection.EndPos].GetStyleFromFormatting();
		else
			return this.Content[this.Selection.StartPos].GetStyleFromFormatting();
	}
	else
	{
		return this.Content[this.CurPos.ContentPos].GetStyleFromFormatting();
	}
};
CDocument.prototype.controller_GetSimilarNumbering = function(oContinueEngine)
{
	this.GetSimilarNumbering(oContinueEngine);
};
CDocument.prototype.controller_GetPlaceHolderObject = function()
{
	var nCurPos = this.CurPos.ContentPos;
	if (this.Selection.Use)
	{
		if (this.Selection.StartPos === this.Selection.EndPos)
			nCurPos = this.Selection.StartPos;
		else
			return null;
	}

	return this.Content[nCurPos].GetPlaceHolderObject();
};
CDocument.prototype.controller_GetAllFields = function(isUseSelection, arrFields)
{
	if (!arrFields)
		arrFields = [];

	var nStartPos = isUseSelection ?
		(this.Selection.Use ?
			(this.Selection.StartPos < this.Selection.EndPos ? this.Selection.StartPos : this.Selection.EndPos)
			: this.CurPos.ContentPos)
		: 0;

	var nEndPos = isUseSelection ?
		(this.Selection.Use ?
			(this.Selection.StartPos < this.Selection.EndPos ? this.Selection.EndPos : this.Selection.StartPos)
			: this.CurPos.ContentPos)
		: this.Content.length - 1;

	for (var nIndex = nStartPos; nIndex <= nEndPos; ++nIndex)
	{
		this.Content[nIndex].GetAllFields(isUseSelection, arrFields);
	}

	return arrFields;
};
CDocument.prototype.controller_IsTableCellSelection = function()
{
	return (this.Selection.Use && this.Selection.StartPos === this.Selection.EndPos && this.Content[this.Selection.StartPos].IsTable() && this.Content[this.Selection.StartPos].IsTableCellSelection());
};
//----------------------------------------------------------------------------------------------------------------------
//
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.RemoveTextSelection = function()
{
	this.Controller.RemoveTextSelection();
};
CDocument.prototype.AddFormTextField = function(sName, sDefaultText)
{
	if (false === this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Content))
	{
		this.StartAction(AscDFH.historydescription_Document_AddMailMergeField);

		var oField = new ParaField(fieldtype_FORMTEXT);
		var oRun = new ParaRun();
		oField.SetFormFieldName(sName);
		oField.SetFormFieldDefaultText(sDefaultText);
		oRun.AddText(sDefaultText);
		oField.Add_ToContent(0, oRun);

		this.Register_Field(oField);
		this.AddToParagraph(oField);
		this.UpdateInterface();
		this.FinalizeAction();
	}
};
CDocument.prototype.GetAllFormTextFields = function()
{
	return this.FieldsManager.GetAllFieldsByType(fieldtype_FORMTEXT);
};
CDocument.prototype.IsFillingFormMode = function()
{
	return this.Api.isRestrictionForms();
};
CDocument.prototype.IsInFormField = function()
{
	var oSelectedInfo = this.GetSelectedElementsInfo();
	var oField        = oSelectedInfo.Get_Field();
	var oInlineSdt    = oSelectedInfo.GetInlineLevelSdt();
	var oBlockSdt     = oSelectedInfo.GetBlockLevelSdt();

	return (oBlockSdt || oInlineSdt || (oField && fieldtype_FORMTEXT === oField.Get_FieldType())) ? true : false;
};
CDocument.prototype.IsFormFieldEditing = function()
{
	if (true === this.IsFillingFormMode() && true === this.IsInFormField())
		return true;

	return false;
};
CDocument.prototype.MoveToFillingForm = function(isNext)
{
	var oRes = this.FindNextFillingForm(isNext, true, true);

	if (!oRes)
		oRes = this.FindNextFillingForm(isNext, true, false);

	if (oRes)
	{
		this.RemoveSelection();

		if (oRes instanceof CBlockLevelSdt || oRes instanceof CInlineLevelSdt)
		{
			oRes.SelectContentControl();
		}
		else if (oRes instanceof ParaField)
		{
			oRes.SelectThisElement();
		}
	}
};
CDocument.prototype.OnContentControlTrackEnd = function(Id, NearestPos, isCopy)
{
	return this.OnEndTextDrag(NearestPos, isCopy);
};
CDocument.prototype.AddContentControl = function(nContentControlType)
{
	if (this.IsDrawingSelected() && !this.DrawingObjects.getTargetDocContent())
	{
		var oDrawing = this.DrawingObjects.getMajorParaDrawing();
		if (oDrawing)
			oDrawing.SelectAsText();
	}

	return this.Controller.AddContentControl(nContentControlType);
};
CDocument.prototype.GetAllContentControls = function()
{
	var arrContentControls = [];

	this.SectionsInfo.GetAllContentControls(arrContentControls);

	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		this.Content[nIndex].GetAllContentControls(arrContentControls);
	}
	return arrContentControls;
};
CDocument.prototype.RemoveContentControl = function(Id)
{
	var oContentControl = this.TableId.Get_ById(Id);
	if (!oContentControl)
		return;

	if (c_oAscSdtLevelType.Block === oContentControl.GetContentControlType() && oContentControl.Parent)
	{
		this.RemoveSelection();
		var oDocContent = oContentControl.Parent;
		oDocContent.Update_ContentIndexing();
		var nIndex = oContentControl.GetIndex();

		var nCurPos = oDocContent.CurPos.ContentPos;
		oDocContent.Remove_FromContent(nIndex, 1);

		if (nIndex === nCurPos)
		{
			if (nIndex >= oDocContent.GetElementsCount())
			{
				oDocContent.MoveCursorToEndPos();
			}
			else
			{
				oDocContent.CurPos.ContentPos = Math.max(0, Math.min(oDocContent.GetElementsCount() - 1, nIndex));;
				oDocContent.Content[oDocContent.CurPos.ContentPos].MoveCursorToStartPos();
			}
		}
		else if (nIndex < nCurPos)
		{
			oDocContent.CurPos.ContentPos = Math.max(0, Math.min(oDocContent.GetElementsCount() - 1, nCurPos - 1));
		}
	}
	else if (c_oAscSdtLevelType.Inline === oContentControl.GetContentControlType())
	{
		this.SelectContentControl(Id);
		this.RemoveBeforePaste();
	}
};
CDocument.prototype.RemoveContentControlWrapper = function(Id)
{
	var oContentControl = this.TableId.Get_ById(Id);
	if (!oContentControl)
		return;

	this.StartAction();

	oContentControl.RemoveContentControlWrapper();
	this.Recalculate();
	this.UpdateInterface();
	this.UpdateSelection();
	this.FinalizeAction();
};
CDocument.prototype.GetContentControl = function(Id)
{
	if (undefined === Id)
	{
		var oInfo          = this.GetSelectedElementsInfo({SkipTOC : true});
		var oInlineControl = oInfo.GetInlineLevelSdt();
		var oBlockControl  = oInfo.GetBlockLevelSdt();

		if (oInlineControl)
			return oInlineControl;
		else if (oBlockControl)
			return oBlockControl;

		return null;
	}

	return this.TableId.Get_ById(Id);
};
CDocument.prototype.ClearContentControl = function(Id)
{
	var oContentControl = this.TableId.Get_ById(Id);
	if (!oContentControl)
		return null;

	this.RemoveSelection();

	if (oContentControl.GetContentControlType
		&& (c_oAscSdtLevelType.Block === oContentControl.GetContentControlType()
		|| c_oAscSdtLevelType.Inline === oContentControl.GetContentControlType()))
	{
		oContentControl.ClearContentControl();
		oContentControl.SetThisElementCurrent();
		oContentControl.MoveCursorToStartPos();
	}

	return oContentControl;
};
/**
 * Выделяем содержимое внутри заданного контейнера
 * @param {string} sId
 */
CDocument.prototype.SelectContentControl = function(sId)
{
	var oContentControl = this.TableId.Get_ById(sId);
	if (!oContentControl)
		return;

	if (oContentControl.GetContentControlType
		&& (c_oAscSdtLevelType.Block === oContentControl.GetContentControlType()
		|| c_oAscSdtLevelType.Inline === oContentControl.GetContentControlType()))
	{
		this.RemoveSelection();

		oContentControl.SelectContentControl();
		this.UpdateSelection();
		this.UpdateRulers();
		this.UpdateInterface();
		this.UpdateTracks();

		this.private_UpdateCursorXY(true, true);
	}
};
/**
 * Передвигаем курсор в заданный блочный элемент
 * @param {string} sId
 * @param {boolean} [isBegin=true]
 */
CDocument.prototype.MoveCursorToContentControl = function(sId, isBegin)
{
	var oContentControl = this.TableId.Get_ById(sId);
	if (!oContentControl)
		return;

	if (oContentControl.GetContentControlType
		&& (c_oAscSdtLevelType.Block === oContentControl.GetContentControlType()
		|| c_oAscSdtLevelType.Inline === oContentControl.GetContentControlType()))
	{
		this.RemoveSelection();

		if (false !== isBegin)
			isBegin = true;

		oContentControl.MoveCursorToContentControl(isBegin);
		this.UpdateSelection();
		this.UpdateRulers();
		this.UpdateInterface();
		this.UpdateTracks();

		this.private_UpdateCursorXY(true, true);
	}
};
CDocument.prototype.GetAllSignatures = function()
{
    return this.DrawingObjects.getAllSignatures();
};
CDocument.prototype.CallSignatureDblClickEvent = function(sGuid)
{
    var ret = [], allSpr = [];
    allSpr = allSpr.concat(allSpr.concat(this.DrawingObjects.getAllSignatures2(ret, this.DrawingObjects.getDrawingArray())));
    for(var i = 0; i < allSpr.length; ++i){
        if(allSpr[i].signatureLine && allSpr[i].signatureLine.id === sGuid){
            this.Api.sendEvent("asc_onSignatureDblClick", sGuid, allSpr[i].extX, allSpr[i].extY);
        }
    }
};
CDocument.prototype.SetCheckContentControlsLock = function(isLocked)
{
	this.CheckContentControlsLock = isLocked;
};
CDocument.prototype.IsCheckContentControlsLock = function()
{
	return this.CheckContentControlsLock;
};
CDocument.prototype.IsEditCommentsMode = function()
{
	return this.Api.isRestrictionComments();
};
CDocument.prototype.IsViewMode = function()
{
	return this.Api.getViewMode();
};
CDocument.prototype.IsEditSignaturesMode = function()
{
	return this.Api.isRestrictionSignatures();
};
CDocument.prototype.IsViewModeInEditor = function()
{
	return this.Api.isRestrictionView();
};
CDocument.prototype.CanEdit = function()
{
	return this.Api.canEdit();
};
CDocument.prototype.private_CheckCursorPosInFillingFormMode = function()
{
	if (this.IsFillingFormMode() && !this.IsInFormField())
	{
		this.MoveToFillingForm(true);
		this.Document_UpdateSelectionState();
		this.Document_UpdateInterfaceState();
	}
};
CDocument.prototype.OnEndLoadScript = function()
{
	this.UpdateAllSectionsInfo();
	this.Check_SectionLastParagraph();
	this.Styles.Check_StyleNumberingOnLoad(this.Numbering);

	var arrParagraphs = this.GetAllParagraphs({All : true});
	for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
	{
		arrParagraphs[nIndex].Recalc_CompiledPr();
		arrParagraphs[nIndex].Recalc_RunsCompiledPr();
	}
};
CDocument.prototype.BeginViewModeInReview = function(isResult)
{
	if (0 !== this.ViewModeInReview.mode)
		this.EndViewModeInReview();

	this.ViewModeInReview.mode = isResult ? 1 : -1;

	this.ViewModeInReview.isFastCollaboration = this.CollaborativeEditing.Is_Fast();
	this.CollaborativeEditing.Set_Fast(false);

	this.History.SaveRedoPoints();
	if (isResult)
		this.AcceptAllRevisionChanges(true, false);
	else
		this.RejectAllRevisionChanges(true, false);

	this.CollaborativeEditing.Set_GlobalLock(true);
};
CDocument.prototype.EndViewModeInReview = function()
{
	if (0 === this.ViewModeInReview.mode)
		return;

	this.CollaborativeEditing.Set_GlobalLock(false);

	this.Document_Undo();
	this.History.Clear_Redo();
	this.History.PopRedoPoints();

	if (this.ViewModeInReview.isFastCollaboration)
		this.CollaborativeEditing.Set_Fast(true);

	this.ViewModeInReview.mode = 0;
};
CDocument.prototype.StartCollaborationEditing = function()
{
	if (this.DrawingDocument)
	{
		this.DrawingDocument.Start_CollaborationEditing();
		this.EndViewModeInReview();
	}
};
CDocument.prototype.IsViewModeInReview = function()
{
	return 0 !== this.ViewModeInReview.mode ? true : false;
};
CDocument.prototype.AddField = function(nType, oPr)
{
	if (fieldtype_PAGENUM === nType)
	{
		return this.AddFieldWithInstruction("PAGE");
	}
	else if (fieldtype_TOC === nType)
	{
		return this.AddFieldWithInstruction("TOC");
	}
	else if (fieldtype_PAGEREF === nType)
	{
		return this.AddFieldWithInstruction("PAGEREF Test \\p");
	}

	return false;
};
CDocument.prototype.AddFieldWithInstruction = function(sInstruction)
{
	var oParagraph = this.GetCurrentParagraph(false, false, {ReplacePlaceHolder : true});
	if (!oParagraph)
		return null;

    var oBeginChar    = new ParaFieldChar(fldchartype_Begin, this),
        oSeparateChar = new ParaFieldChar(fldchartype_Separate, this),
        oEndChar      = new ParaFieldChar(fldchartype_End, this);

    var oRun = new ParaRun();
    oRun.AddToContent(-1, oBeginChar);
    oRun.AddInstrText(sInstruction);
    oRun.AddToContent(-1, oSeparateChar);
    oRun.AddToContent(-1, oEndChar);
    oParagraph.Add(oRun);

    oBeginChar.SetRun(oRun);
    oSeparateChar.SetRun(oRun);
    oEndChar.SetRun(oRun);

    var oComplexField = oBeginChar.GetComplexField();
    oComplexField.SetBeginChar(oBeginChar);
    oComplexField.SetInstructionLine(sInstruction);
    oComplexField.SetSeparateChar(oSeparateChar);
    oComplexField.SetEndChar(oEndChar);
    oComplexField.Update(false);
    return oComplexField;
};

CDocument.prototype.private_CreateComplexFieldRun = function(sInstruction, oParagraph)
{
    var oBeginChar    = new ParaFieldChar(fldchartype_Begin, this),
        oSeparateChar = new ParaFieldChar(fldchartype_Separate, this),
        oEndChar      = new ParaFieldChar(fldchartype_End, this);

    var oRun = new ParaRun();
    oRun.AddToContent(-1, oBeginChar);
    oRun.AddInstrText(sInstruction);
    oRun.AddToContent(-1, oSeparateChar);
    oRun.AddToContent(-1, oEndChar);
    oParagraph.Add(oRun);

    oBeginChar.SetRun(oRun);
    oSeparateChar.SetRun(oRun);
    oEndChar.SetRun(oRun);

    var oComplexField = oBeginChar.GetComplexField();
    oComplexField.SetBeginChar(oBeginChar);
    oComplexField.SetInstructionLine(sInstruction);
    oComplexField.SetSeparateChar(oSeparateChar);
    oComplexField.SetEndChar(oEndChar);
    oComplexField.Update(false);
    return oComplexField;
};
CDocument.prototype.UpdateComplexField = function(oField)
{
	if (!oField)
		return;

	oField.Update(true);
};
CDocument.prototype.GetCurrentComplexFields = function()
{
	var oParagraph = this.GetCurrentParagraph();
	if (!oParagraph)
		return [];

	return oParagraph.GetCurrentComplexFields();
};
CDocument.prototype.IsFastCollaboartionBeforeViewModeInReview = function()
{
	return this.ViewModeInReview.isFastCollaboration;
};
CDocument.prototype.CheckComplexFieldsInSelection = function()
{
	if (true !== this.Selection.Use || this.Controller !== this.LogicDocumentController)
		return;

	// Смотрим сколько полей открытых в начальной и конечной позициях.
	var oStartPos = this.GetContentPosition(true, true);
	var oEndPos   = this.GetContentPosition(true, false);

	var arrStartComplexFields = this.GetComplexFieldsByContentPos(oStartPos);
	var arrEndComplexFields   = this.GetComplexFieldsByContentPos(oEndPos);

	var arrStartFields = [];
	for (var nIndex = 0, nCount = arrStartComplexFields.length; nIndex < nCount; ++nIndex)
	{
		var bAdd = true;
		for (var nIndex2 = 0, nCount2 = arrEndComplexFields.length; nIndex2 < nCount2; ++nIndex2)
		{
			if (arrStartComplexFields[nIndex] === arrEndComplexFields[nIndex2])
			{
				bAdd = false;
				break;
			}
		}

		if (bAdd)
		{
			arrStartFields.push(arrStartComplexFields[nIndex]);
		}
	}

	var arrEndFields = [];
	for (var nIndex = 0, nCount = arrEndComplexFields.length; nIndex < nCount; ++nIndex)
	{
		var bAdd = true;
		for (var nIndex2 = 0, nCount2 = arrStartComplexFields.length; nIndex2 < nCount2; ++nIndex2)
		{
			if (arrEndComplexFields[nIndex] === arrStartComplexFields[nIndex2])
			{
				bAdd = false;
				break;
			}
		}

		if (bAdd)
		{
			arrEndFields.push(arrEndComplexFields[nIndex]);
		}
	}

	var nDirection = this.GetSelectDirection();
	if (nDirection > 0)
	{
		if (arrStartFields.length > 0 && arrStartFields[0].IsValid())
			oStartPos = arrStartFields[0].GetStartDocumentPosition();

		if (arrEndFields.length > 0 && arrEndFields[0].IsValid())
			oEndPos = arrEndFields[0].GetEndDocumentPosition();
	}
	else
	{
		if (arrStartFields.length > 0 && arrStartFields[0].IsValid())
			oStartPos = arrStartFields[0].GetEndDocumentPosition();

		if (arrEndFields.length > 0 && arrEndFields[0].IsValid())
			oEndPos = arrEndFields[0].GetStartDocumentPosition();
	}

	this.SetContentSelection(oStartPos, oEndPos, 0, 0, 0);
};
/**
 * Получаем текст, который лежит внутри заданного сложного поля. Если внутри текста есть объекты, то возвращается null.
 * @param {CComplexField} oComplexField
 * @returns {?string}
 */
CDocument.prototype.GetComplexFieldTextValue = function(oComplexField)
{
	if (!oComplexField)
		return null;

	var oState = this.SaveDocumentState();
	oComplexField.SelectFieldValue();
	var sResult = this.GetSelectedText();
	this.LoadDocumentState(oState);
	this.Document_UpdateSelectionState();

	return sResult;
};
/**
 * Получаем прямые текстовые настройки заданного сложного поля.
 * @param oComplexField
 * @returns {CTextPr}
 */
CDocument.prototype.GetComplexFieldTextPr = function(oComplexField)
{
	if (!oComplexField)
		return new CTextPr();

	var oState = this.SaveDocumentState();
	oComplexField.SelectFieldValue();
	var oTextPr = this.GetDirectTextPr();
	this.LoadDocumentState(oState);
	this.Document_UpdateSelectionState();

	return oTextPr;
};
CDocument.prototype.GetFieldsManager = function()
{
	return this.FieldsManager;
};
CDocument.prototype.GetComplexFieldsByContentPos = function(oDocPos)
{
	if (!oDocPos)
		return [];

	var oCurrentDocPos = this.GetContentPosition(false);
	this.SetContentPosition(oDocPos, 0, 0);

	var oCurrentParagraph = this.controller_GetCurrentParagraph(true, null);
	if (!oCurrentParagraph)
		return [];

	var arrComplexFields = oCurrentParagraph.GetCurrentComplexFields();
	this.SetContentPosition(oCurrentDocPos, 0, 0);

	return arrComplexFields;
};
/**
 * Получаем массив все полей в документе (простых и сложных)
 * @param {boolean} isUseSelection
 * @returns {Array}
 */
CDocument.prototype.GetAllFields = function(isUseSelection)
{
	var arrFields = [];

	if (isUseSelection)
	{
		this.Controller.GetAllFields(isUseSelection, arrFields);
	}
	else
	{
		// По сноскам и автофигурам мы пробегаемся при поиске в основной части документа

		this.LogicDocumentController.GetAllFields(false, arrFields);

		var arrHdrFtrs = this.SectionsInfo.GetAllHdrFtrs();
		for (var nIndex = 0, nCount = arrHdrFtrs.length; nIndex < nCount; ++nIndex)
		{
			arrHdrFtrs[nIndex].GetContent().GetAllFields(true, arrFields);
		}
	}

	return arrFields;
};
/**
 * Обновляем поля в документе по выледелнию или вообще все
 * @param isBySelection {boolean}
 */
CDocument.prototype.UpdateFields = function(isBySelection)
{
	var arrFields = this.GetAllFields(isBySelection);

	if (arrFields.length <= 0)
	{
		var oInfo = this.GetSelectedElementsInfo();
		arrFields = oInfo.GetComplexFields();
	}

	var oDocState = this.SaveDocumentState();

	var arrParagraphs = [];
	for (var nIndex = 0, nCount = arrFields.length; nIndex < nCount; ++nIndex)
	{
		var oField = arrFields[nIndex];
		if (oField instanceof CComplexField)
		{
			oField.SelectField();
			arrParagraphs = arrParagraphs.concat(this.GetCurrentParagraph(false, true));
		}
		else if (oField instanceof ParaField)
		{
			if (oField.GetParagraph())
				arrParagraphs.push(oField.GetParagraph());
		}
	}

	if (!this.Document_Is_SelectionLocked(changestype_None, {
			Type      : changestype_2_ElementsArray_and_Type,
			Elements  : arrParagraphs,
			CheckType : changestype_Paragraph_Content
		}))
	{
		this.StartAction(AscDFH.historydescription_Document_UpdateFields);

		for (var nIndex = 0, nCount = arrFields.length; nIndex < nCount; ++nIndex)
		{
			arrFields[nIndex].Update(false, false);
		}

		this.LoadDocumentState(oDocState);

		this.Recalculate();
		this.UpdateInterface();
		this.UpdateSelection();
		this.FinalizeAction();
	}

};
/**
 * Получаем ссылку на класс, управляющий закладками
 * @returns {CBookmarksManager}
 */
CDocument.prototype.GetBookmarksManager = function()
{
	return this.BookmarksManager;
};
CDocument.prototype.UpdateBookmarks = function()
{
	if (!this.BookmarksManager.IsNeedUpdate())
		return;

	this.BookmarksManager.BeginCollectingProcess();

	for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
	{
		this.Content[nIndex].UpdateBookmarks(this.BookmarksManager);
	}

	this.BookmarksManager.EndCollectingProcess();
};
CDocument.prototype.AddBookmark = function(sName)
{
	var arrBookmarkChars = this.BookmarksManager.GetBookmarkByName(sName);

	var oStartPara = null,
		oEndPara   = null;
	var arrParagraphs = [];
	if (true === this.IsSelectionUse())
	{
		var arrSelectedParagraphs = this.GetCurrentParagraph(false, true);
		if (arrSelectedParagraphs.length > 1)
		{
			arrParagraphs.push(arrSelectedParagraphs[0]);
			arrParagraphs.push(arrSelectedParagraphs[arrSelectedParagraphs.length - 1]);

			oStartPara = arrSelectedParagraphs[0];
			oEndPara   = arrSelectedParagraphs[arrSelectedParagraphs.length - 1];
		}
		else if (arrSelectedParagraphs.length === 1)
		{
			arrParagraphs.push(arrSelectedParagraphs[0]);

			oStartPara = arrSelectedParagraphs[0];
			oEndPara   = arrSelectedParagraphs[0];
		}
	}
	else
	{
		var oCurrentParagraph = this.GetCurrentParagraph(true);
		if (oCurrentParagraph)
		{
			arrParagraphs.push(oCurrentParagraph);
			oStartPara = oCurrentParagraph;
		}
	}

	if (arrParagraphs.length <= 0)
		return;

	if (arrBookmarkChars)
	{
		var oStartPara = arrBookmarkChars[0].GetParagraph();
		var oEndPara   = arrBookmarkChars[1].GetParagraph();

		if (oStartPara)
			arrParagraphs.push(oStartPara);

		if (oEndPara)
			arrParagraphs.push(oEndPara);
	}

	if (false === this.Document_Is_SelectionLocked(changestype_None, {Type : AscCommon.changestype_2_ElementsArray_and_Type, Elements : arrParagraphs, CheckType : changestype_Paragraph_Content}, true))
	{
		this.StartAction(AscDFH.historydescription_Document_AddBookmark);

		if (this.BookmarksManager.HaveBookmark(sName))
			this.private_RemoveBookmark(sName);

		var sBookmarkId = this.BookmarksManager.GetNewBookmarkId();

		if (true === this.IsSelectionUse())
		{
			var nDirection = this.GetSelectDirection();
			if (nDirection > 0)
			{
				oEndPara.AddBookmarkChar(new CParagraphBookmark(false, sBookmarkId, sName), true, false);
				oStartPara.AddBookmarkChar(new CParagraphBookmark(true, sBookmarkId, sName), true, true);
			}
			else
			{
				oEndPara.AddBookmarkChar(new CParagraphBookmark(false, sBookmarkId, sName), true, true);
				oStartPara.AddBookmarkChar(new CParagraphBookmark(true, sBookmarkId, sName), true, false);
			}
		}
		else
		{
			oStartPara.AddBookmarkChar(new CParagraphBookmark(false, sBookmarkId, sName), false);
			oStartPara.AddBookmarkChar(new CParagraphBookmark(true, sBookmarkId, sName), false);
		}

		// TODO: Здесь добавляются просто метки закладок, нужно сделать упрощенный пересчет
		this.Recalculate();
		this.FinalizeAction();
	}

};
CDocument.prototype.RemoveBookmark = function(sName)
{
	var arrBookmarkChars = this.BookmarksManager.GetBookmarkByName(sName);

	var arrParagraphs = [];
	if (arrBookmarkChars)
	{
		var oStartPara = arrBookmarkChars[0].GetParagraph();
		var oEndPara   = arrBookmarkChars[1].GetParagraph();

		if (oStartPara)
			arrParagraphs.push(oStartPara);

		if (oEndPara)
			arrParagraphs.push(oEndPara);
	}

	if (false === this.Document_Is_SelectionLocked(changestype_None, {Type : AscCommon.changestype_2_ElementsArray_and_Type, Elements : arrParagraphs, CheckType : changestype_Paragraph_Content}, true))
	{
		this.StartAction(AscDFH.historydescription_Document_RemoveBookmark);

		this.private_RemoveBookmark(sName);

		// TODO: Здесь добавляются просто метки закладок, нужно сделать упрощенный пересчет
		this.Recalculate();
		this.FinalizeAction();
	}
};
CDocument.prototype.GoToBookmark = function(sName, isSelect)
{
	if (isSelect)
		this.BookmarksManager.SelectBookmark(sName);
	else
		this.BookmarksManager.GoToBookmark(sName);
};
CDocument.prototype.private_RemoveBookmark = function(sName)
{
	var arrBookmarkChars = this.BookmarksManager.GetBookmarkByName(sName);
	if (!arrBookmarkChars)
		return;

	arrBookmarkChars[1].RemoveBookmark();
	arrBookmarkChars[0].RemoveBookmark();
};
CDocument.prototype.AddTableOfContents = function(sHeading, oPr, oSdt)
{
	var oStyles     = this.GetStyles();
	var nStylesType = oPr ? oPr.get_StylesType() : Asc.c_oAscTOCStylesType.Current;

	var isNeedChangeStyles = (Asc.c_oAscTOCStylesType.Current !== nStylesType && nStylesType !== oStyles.GetTOCStylesType());

	var isLocked = true;
	if (isNeedChangeStyles)
	{
		isLocked = this.IsSelectionLocked(AscCommon.changestype_Document_Content, {
			Type : AscCommon.changestype_2_AdditionalTypes, Types : [AscCommon.changestype_Document_Styles]
		});
	}
	else
	{
		isLocked = this.IsSelectionLocked(AscCommon.changestype_Document_Content)
	}

	if (!isLocked)
	{
		this.StartAction(AscDFH.historydescription_Document_AddTableOfContents);

		if (this.DrawingObjects.selectedObjects.length > 0)
		{
			var oContent = this.DrawingObjects.getTargetDocContent();
			if (!oContent || oContent.bPresentation)
			{
				this.DrawingObjects.resetInternalSelection();
			}
		}

		if (oSdt instanceof CBlockLevelSdt)
		{
			oSdt.ClearContentControl();
		}
		else
		{
			this.Remove(1, true, true, true);
			oSdt = this.AddContentControl(c_oAscSdtLevelType.Block);

			if (sHeading)
			{
				var oParagraph = oSdt.GetCurrentParagraph();
				oParagraph.Style_Add(this.Get_Styles().GetDefaultTOCHeading());
				for (var oIterator = sHeading.getUnicodeIterator(); oIterator.check(); oIterator.next())
				{
					var nCharCode = oIterator.value();
					if (0x0020 === nCharCode)
						oParagraph.Add(new ParaSpace());
					else
						oParagraph.Add(new ParaText(nCharCode));
				}
				oSdt.AddNewParagraph(false, true);
			}
		}

		oSdt.SetThisElementCurrent();

		var oComplexField = this.AddFieldWithInstruction("TOC \\o \"1-3\" \\h \\z \\u");
		oSdt.SetDocPartObj(undefined, "Table of Contents", true);

		if (oPr)
		{
			if (isNeedChangeStyles)
				oStyles.SetTOCStylesType(nStylesType);

			oComplexField.SetPr(oPr);
			oComplexField.Update();
		}

		var oNextParagraph = oSdt.GetNextParagraph();
		if (oNextParagraph)
		{
			oNextParagraph.MoveCursorToStartPos(false);
			oNextParagraph.Document_SetThisElementCurrent();
		}
		else
		{
			oSdt.MoveCursorToEndPos(false);
		}

		this.Recalculate();
		this.UpdateInterface();
		this.UpdateSelection();
		this.UpdateRulers();
		this.FinalizeAction();
	}
};
CDocument.prototype.GetPagesCount = function()
{
	return this.Pages.length;
};
/**
 * Данная функция получает первую таблицу TOC по схеме Word
 * @param {boolean} [isCurrent=false] Ищем только в текущем месте или с начала документа
 * @returns {CBlockLevelSdt | CComplexField | null}
 */
CDocument.prototype.GetTableOfContents = function(isCurrent)
{
	if (true === isCurrent)
	{
		var oSelectedInfo = this.GetSelectedElementsInfo();
		return oSelectedInfo.GetTableOfContents();
	}
	else
	{
		// 1. Ищем среди CBlockLevelSdt с параметром Unique = true
		// 2. Ищем среди CBlockLevelSdt
		// 3. Ищем потом просто в сложных полях

		for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
		{
			var oResult = this.Content[nIndex].GetTableOfContents(true, false);
			if (oResult)
				return oResult;
		}

		for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; ++nIndex)
		{
			var oResult = this.Content[nIndex].GetTableOfContents(false, true);
			if (oResult)
				return oResult;
		}
	}

	return null;
};
/**
 * Получаем текущее сложное поле
 * @returns {CComplexField | ParaPageNum | ParaPageCount | null}
 */
CDocument.prototype.GetCurrentComplexField = function()
{
	var oSelectedInfo = this.GetSelectedElementsInfo();
	var arrComplexFields = oSelectedInfo.GetComplexFields();

	if (arrComplexFields.length > 0)
		return arrComplexFields[arrComplexFields.length - 1];

	var oPageNum = oSelectedInfo.GetPageNum();
	if (oPageNum)
		return oPageNum;

	var oPagesCount = oSelectedInfo.GetPagesCount();
	if (oPagesCount)
		return oPagesCount;

	return null;
};
/**
 * Событие, которое вызывается на содании новой точки в истории
 */
CDocument.prototype.OnCreateNewHistoryPoint = function()
{
	this.AllParagraphsList = null;
	this.AllFootnotesList  = null;
};
/**
 * Получаем массив положений, к которым можно привязать гиперссылку
 * @returns {CHyperlinkAnchor[]}
 */
CDocument.prototype.GetHyperlinkAnchors = function()
{
	var arrAnchors = [];

	var arrOutline = [];
	this.GetOutlineParagraphs(arrOutline, {SkipEmptyParagraphs : true});
	var nIndex = 0, nCount = arrOutline.length;
	for (nIndex = 0; nIndex < nCount; ++nIndex)
	{
		arrAnchors.push(new CHyperlinkAnchor(c_oAscHyperlinkAnchor.Heading, arrOutline[nIndex]));
	}

	this.BookmarksManager.Update();
	nCount = this.BookmarksManager.GetCount();
	for (nIndex = 0; nIndex < nCount; ++nIndex)
	{
		var sName =  this.BookmarksManager.GetName(nIndex);
		if (!this.BookmarksManager.IsHiddenBookmark(sName) && !this.BookmarksManager.IsInternalUseBookmark(sName))
			arrAnchors.push(new CHyperlinkAnchor(c_oAscHyperlinkAnchor.Bookmark, sName));
	}

	return arrAnchors;
};
/**
 * Получаем последний примененный маркированный список
 * @returns {?CNumPr}
 */
CDocument.prototype.GetLastBulletList = function()
{
	return this.LastBulletList;
};
/**
 * Запоминаем последний примененный маркированный список
 * @param sNumId {string}
 * @param nLvl {number} 0..8
 */
CDocument.prototype.SetLastBulletList = function(sNumId, nLvl)
{
	if (!sNumId)
		this.LastBulletList = undefined;
	else
		this.LastBulletList = new CNumPr(sNumId, nLvl);
};
/**
 * Получаем последний примененный нумерованный список
 * @returns {?CNumPr}
 */
CDocument.prototype.GetLastNumberedList = function()
{
	return this.LastNumberedList;
};
/**
 * Запоминаем последний примененный нумерованный список
 * @param sNumId {string}
 * @param nLvl {number} 0..8
 */
CDocument.prototype.SetLastNumberedList = function(sNumId, nLvl)
{
	if (!sNumId)
		this.LastNumberedList = undefined;
	else
		this.LastNumberedList = new CNumPr(sNumId, nLvl);
};
/**
 * Получаем текущую выделенную нумерацию
 * @param [isCheckSelection=false] {boolean} - проверять ли по селекту
 * @returns {?CNumPr} Если выделено несколько параграфов с одним NumId, но с разными уровнями, то Lvl = null
 */
CDocument.prototype.GetSelectedNum = function(isCheckSelection)
{
	if (true === isCheckSelection)
	{
		var arrParagraphs = this.GetCurrentParagraph(false, true);
		if (arrParagraphs.length <= 0)
			return null;

		var oStartNumPr = arrParagraphs[0].GetNumPr();
		if (!oStartNumPr)
			return null;

		var oNumPr = oStartNumPr.Copy();
		for (var nIndex = 1, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
		{
			var oCurNumPr = arrParagraphs[nIndex].GetNumPr();
			if (!oCurNumPr || oCurNumPr.NumId !== oStartNumPr.NumId)
				return null;

			if (oCurNumPr.Lvl !== oStartNumPr.Lvl)
				oNumPr.Lvl = null;
		}

		return oNumPr;
	}
	else
	{
		var oCurrentPara = this.GetCurrentParagraph(true);
		if (!oCurrentPara)
			return null;

		var oDocContent = oCurrentPara.GetParent();
		if (!oDocContent)
			return null;

		var oTopDocContent = oDocContent.GetTopDocumentContent();
		if (!oTopDocContent || !oTopDocContent.IsNumberingSelection())
			return null;

		oCurrentPara = oTopDocContent.Selection.Data.CurPara;
		if (!oCurrentPara)
			return null;

		return oCurrentPara.GetNumPr();
	}
};
/**
 * Продолжаем нумерацию в текущем параграфе
 * @returns {boolean}
 */
CDocument.prototype.ContinueNumbering = function()
{
	var isNumberingSelection = this.IsNumberingSelection();

	var oParagraph = this.GetCurrentParagraph(true);
	if (!oParagraph || !oParagraph.GetNumPr() || (this.IsSelectionUse() && !isNumberingSelection))
		return false;

	var oNumPr = oParagraph.GetNumPr();

	var oEngine = new CDocumentNumberingContinueEngine(oParagraph, oNumPr, this.GetNumbering());
	this.Controller.GetSimilarNumbering(oEngine);
	var oSimilarNumPr = oEngine.GetNumPr();
	if (!oSimilarNumPr || oSimilarNumPr.NumId === oNumPr.NumId)
		return false;

	var bFind                 = false;
	var arrParagraphs         = this.GetAllParagraphsByNumbering(new CNumPr(oNumPr.NumId, null));
	var arrParagraphsToChange = [];

	var isRelated = this.GetNumbering().GetNum(oNumPr.NumId).IsHaveRelatedLvlText();

	for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
	{
		var oPara = arrParagraphs[nIndex];

		if (!bFind && oPara === oParagraph)
			bFind = true;

		if (bFind)
		{
			var oCurNumPr = oPara.GetNumPr();
			if (!oCurNumPr)
				continue;

			if (!isRelated)
			{
				if (oCurNumPr.Lvl < oNumPr.Lvl)
					break;
				else if (oCurNumPr.Lvl > oNumPr.Lvl)
					continue;
			}

			arrParagraphsToChange.push(oPara);
		}
	}

	if (!this.Document_Is_SelectionLocked(changestype_None, {
			Type      : changestype_2_ElementsArray_and_Type,
			Elements  : arrParagraphsToChange,
			CheckType : AscCommon.changestype_Paragraph_Properties
		}))
	{
		this.StartAction(AscDFH.historydescription_Document_ContinueNumbering);

		for (var nIndex = 0, nCount = arrParagraphsToChange.length; nIndex < nCount; ++nIndex)
		{
			var oPara     = arrParagraphsToChange[nIndex];
			var oCurNumPr = oPara.GetNumPr();

			oPara.SetNumPr(oSimilarNumPr.NumId, oCurNumPr.Lvl);
		}

		this.Recalculate();
		this.UpdateInterface();
		this.UpdateSelection();
		this.FinalizeAction();
	}

	return true;
};
/**
 * Начинаем нумерацию занового с текущего параграфа с заданного значения
 * @param [nRestartValue=1] {number}
 * @returns {boolean}
 */
CDocument.prototype.RestartNumbering = function(nRestartValue)
{
	if (undefined === nRestartValue || null === nRestartValue)
		nRestartValue = 1;

	var isNumberingSelection = this.IsNumberingSelection();

	var oParagraph = this.GetCurrentParagraph(true);
	if (!oParagraph || !oParagraph.GetNumPr() || (this.IsSelectionUse() && !isNumberingSelection))
		return false;

	var oNumPr = oParagraph.GetNumPr();

	var bFind                 = false;
	var nPrevLvl              = null;
	var isFirstParaOnLvl      = false;
	var arrParagraphs         = this.GetAllParagraphsByNumbering(new CNumPr(oNumPr.NumId, null));
	var arrParagraphsToChange = [];
	var isRelated             = this.Numbering.GetNum(oNumPr.NumId).IsHaveRelatedLvlText();

	for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
	{
		var oPara = arrParagraphs[nIndex];

		if (!bFind && oPara === oParagraph)
		{
			bFind = true;

			if (null === nPrevLvl || nPrevLvl < oNumPr.Lvl)
				isFirstParaOnLvl = true;
		}

		var oCurNumPr = oPara.GetNumPr();

		if (bFind)
		{
			if (!oCurNumPr)
				continue;

			if (0 !== oNumPr.Lvl && !isRelated)
			{
				if (oCurNumPr.Lvl < oNumPr.Lvl)
					break;
				else if (oCurNumPr.Lvl > oNumPr.Lvl)
					continue;
			}

			arrParagraphsToChange.push(oPara);
		}

		if (oCurNumPr)
			nPrevLvl = oCurNumPr.Lvl;
	}

	var oNum = this.Numbering.GetNum(oNumPr.NumId);
	if (isFirstParaOnLvl)
	{
		if (Asc.c_oAscNumberingFormat.Bullet === oNum.GetLvl(oNumPr.Lvl).GetFormat())
			return;

		if (!this.Document_Is_SelectionLocked(changestype_None, {
				Type      : changestype_2_ElementsArray_and_Type,
				Elements  : [oNum],
				CheckType : AscCommon.changestype_Paragraph_Properties
			}))
		{
			this.StartAction(AscDFH.historydescription_Document_RestartNumbering);

			var oLvl   = oNum.GetLvl(oNumPr.Lvl).Copy();
			oLvl.Start = nRestartValue;
			oNum.SetLvl(oLvl, oNumPr.Lvl);

			this.Recalculate();
			this.UpdateInterface();
			this.UpdateSelection();
			this.FinalizeAction();
		}
	}
	else
	{
		if (!this.Document_Is_SelectionLocked(changestype_None, {
				Type      : changestype_2_ElementsArray_and_Type,
				Elements  : arrParagraphsToChange,
				CheckType : AscCommon.changestype_Paragraph_Properties
			}))
		{
			this.StartAction(AscDFH.historydescription_Document_RestartNumbering);

			var oNewNum = oNum.Copy();
			if (Asc.c_oAscNumberingFormat.Bullet !== oNum.GetLvl(oNumPr.Lvl).GetFormat())
			{
				var oLvl   = oNewNum.GetLvl(oNumPr.Lvl).Copy();
				oLvl.Start = nRestartValue;
				oNewNum.SetLvl(oLvl, oNumPr.Lvl);
			}

			var sNewId = oNewNum.GetId();

			for (var nIndex = 0, nCount = arrParagraphsToChange.length; nIndex < nCount; ++nIndex)
			{
				var oPara     = arrParagraphsToChange[nIndex];
				var oCurNumPr = oPara.GetNumPr();

				oPara.SetNumPr(sNewId, oCurNumPr.Lvl);
			}

			if (isNumberingSelection)
				this.SelectNumbering(oParagraph.GetNumPr(), oParagraph);

			this.Recalculate();
			this.UpdateInterface();
			this.UpdateSelection();
			this.FinalizeAction();
		}
	}

	return true;
};
/**
 * Устанавливаем настройку автосоздания маркированных списков
 * @param isAuto {boolean}
 */
CDocument.prototype.SetAutomaticBulletedLists = function(isAuto)
{
	this.AutoCorrectSettings.AutomaticBulletedLists = isAuto;
};
/**
 * Запрашиваем настройку автосоздания маркированных списков
 * @returns {boolean}
 */
CDocument.prototype.IsAutomaticBulletedLists = function()
{
	return this.AutoCorrectSettings.AutomaticBulletedLists;
};
/**
 * Устанавливаем настройку автосоздания нумерованных списков
 * @param isAuto {boolean}
 */
CDocument.prototype.SetAutomaticNumberedLists = function(isAuto)
{
	this.AutoCorrectSettings.AutomaticNumberedLists = isAuto;
};
/**
 * Запрашиваем настройку автосоздания нумерованных списков
 * @returns {boolean}
 */
CDocument.prototype.IsAutomaticNumberedLists = function()
{
	return this.AutoCorrectSettings.AutomaticNumberedLists;
};
/**
 * Устанавливаем параметр автозамены: заменять ли прямые кавычки "умными"
 * @param isSmartQuotes {boolean}
 */
CDocument.prototype.SetAutoCorrectSmartQuotes = function(isSmartQuotes)
{
	this.AutoCorrectSettings.SmartQuotes = isSmartQuotes;
};
/**
 * Запрашиваем настройку автозамены: заменять ли прямые кавычки "умными"
 * @returns {boolean}
 */
CDocument.prototype.IsAutoCorrectSmartQuotes = function()
{
	return this.AutoCorrectSettings.SmartQuotes;
};
/**
 * Устанавливаем параметр автозамены двух дефисов на тире
 * @param isReplace {boolean}
 */
CDocument.prototype.SetAutoCorrectHyphensWithDash = function(isReplace)
{
	this.AutoCorrectSettings.HyphensWithDash = isReplace;
};
/**
 * Запрашиваем настройку автозамены двух дефисов на тире
 * @returns {boolean}
 */
CDocument.prototype.IsAutoCorrectHyphensWithDash = function()
{
	return this.AutoCorrectSettings.HyphensWithDash;
};
/**
 * Получаем идентификатор текущего пользователя
 * @param [isConnectionId=false] {boolean} true - Id соединения пользователя или false - Id пользователя
 * @returns {string}
 */
CDocument.prototype.GetUserId = function(isConnectionId)
{
	if (isConnectionId)
		return this.GetApi().CoAuthoringApi.getUserConnectionId();

	return this.GetApi().DocInfo.get_UserId();
};
/**
 * Получаем метки селекта, в зависимости от типа селекта
 * @param [isSaveDirection=true] {boolean} Сохраняем направление селекта, либо разворачиваем от меньшего к большему
 * @returns {{Start: number, End: number}}
 */
CDocument.prototype.private_GetSelectionPos = function(isSaveDirection)
{
	var nStartPos = 0;
	var nEndPos   = 0;

	if (!this.controller_IsSelectionUse())
	{
		nStartPos = this.CurPos.ContentPos;
		nEndPos   = this.CurPos.ContentPos;
	}
	else if (this.controller_IsMovingTableBorder())
	{
		nStartPos = this.Selection.Data.Pos;
		nEndPos   = this.Selection.Data.Pos;
	}
	else if (this.controller_IsNumberingSelection())
	{
		this.UpdateContentIndexing();

		var oTopElement = this.Selection.Data.CurPara.GetTopElement();
		if (oTopElement)
		{
			nStartPos = oTopElement.GetIndex();
			nEndPos   = nStartPos;
		}
	}
	else
	{
		nStartPos = this.Selection.StartPos;
		nEndPos   = this.Selection.EndPos;
	}

	if (false === isSaveDirection && nStartPos > nEndPos)
	{
		var nTemp = nStartPos;
		nStartPos = nEndPos;
		nEndPos   = nTemp;
	}

	return {Start : nStartPos, End : nEndPos};
};
/**
 * Получаем объект, внутри которого в данный момент используется PlaceHolder (т.е. мы там стоим курсором или он выделен целиком)
 * @returns {?object}
 */
CDocument.prototype.GetPlaceHolderObject = function()
{
	return this.Controller.GetPlaceHolderObject();
};
/**
 * Добавляем пустую страницу в текущее положение курсор
 */
CDocument.prototype.AddBlankPage = function()
{
	if (this.LogicDocumentController === this.Controller)
	{
		if (!this.Document_Is_SelectionLocked(AscCommon.changestype_Document_Content))
		{
			this.StartAction(AscDFH.historydescription_Document_AddBlankPage);

			if (this.IsSelectionUse())
			{
				this.MoveCursorLeft(false, false);
				this.RemoveSelection();
			}

			var oElement = this.Content[this.CurPos.ContentPos];
			if (oElement.IsParagraph())
			{
				if (this.CurPos.ContentPos === this.Content.length - 1 && oElement.IsCursorAtEnd())
				{
					var oBreakParagraph = oElement.Split();
					var oEmptyParagraph = oElement.Split();

					oBreakParagraph.AddToParagraph(new ParaNewLine(break_Page));
					this.AddToContent(this.CurPos.ContentPos + 1, oBreakParagraph);
					this.AddToContent(this.CurPos.ContentPos + 2, oEmptyParagraph);

					this.CurPos.ContentPos = this.CurPos.ContentPos + 2;
				}
				else
				{
					var oNext   = oElement.Split();
					var oBreak1 = oElement.Split();
					var oBreak2 = oElement.Split();
					var oEmpty  = oElement.Split();

					oBreak1.AddToParagraph(new ParaNewLine(break_Page));
					oBreak2.AddToParagraph(new ParaNewLine(break_Page));

					this.AddToContent(this.CurPos.ContentPos + 1, oNext);
					this.AddToContent(this.CurPos.ContentPos + 1, oBreak2);
					this.AddToContent(this.CurPos.ContentPos + 1, oEmpty);
					this.AddToContent(this.CurPos.ContentPos + 1, oBreak1);

					this.CurPos.ContentPos = this.CurPos.ContentPos + 2;
				}

				this.Content[this.CurPos.ContentPos].MoveCursorToStartPos(false);
			}
			else if (oElement.IsTable())
			{
				var oNewTable = oElement.Split();
				var oBreak1   = new Paragraph(this.DrawingDocument, this);
				var oEmpty    = new Paragraph(this.DrawingDocument, this);
				var oBreak2   = new Paragraph(this.DrawingDocument, this);

				oBreak1.AddToParagraph(new ParaNewLine(break_Page));
				oBreak2.AddToParagraph(new ParaNewLine(break_Page));

				if (!oNewTable)
				{
					this.AddToContent(this.CurPos.ContentPos, oBreak2);
					this.AddToContent(this.CurPos.ContentPos, oEmpty);
					this.AddToContent(this.CurPos.ContentPos, oBreak1);
					this.CurPos.ContentPos = this.CurPos.ContentPos + 1;
				}
				else
				{
					this.AddToContent(this.CurPos.ContentPos + 1, oNewTable);
					this.AddToContent(this.CurPos.ContentPos + 1, oBreak2);
					this.AddToContent(this.CurPos.ContentPos + 1, oEmpty);
					this.AddToContent(this.CurPos.ContentPos + 1, oBreak1);
					this.CurPos.ContentPos = this.CurPos.ContentPos + 2;
				}

				this.Content[this.CurPos.ContentPos].MoveCursorToStartPos(false);
			}


			this.Recalculate();
			this.UpdateInterface();
			this.UpdateSelection();
			this.FinalizeAction();
		}
	}
};
/**
 * Получаем формулу в текущей ячейке таблицы
 * {boolen} [isReturnField=false] - возвращаем само поле
 * @returns {string | CComplexField}
 */
CDocument.prototype.GetTableCellFormula = function(isReturnField)
{
	var sDefault = isReturnField ? null : "=";

	var oParagraph = this.GetCurrentParagraph();
	if (!oParagraph)
		return sDefault;

	var oParaParent = oParagraph.GetParent();
	if (!oParaParent)
		return sDefault;

	var oCell = oParaParent.IsTableCellContent(true);
	if (!oCell)
		return sDefault;

	var oCellContent = oCell.GetContent();
	var arrAllFields = oCellContent.GetAllFields(false);

	for (var nIndex = 0, nCount = arrAllFields.length; nIndex < nCount; ++nIndex)
	{
		var oField = arrAllFields[nIndex];
		if (oField instanceof CComplexField && oField.GetInstruction() && fieldtype_FORMULA === oField.GetInstruction().Type)
		{
			if (isReturnField)
				return oField;

			return oField.InstructionLine;
		}
	}

	if (isReturnField)
		return null;

	var oRow   = oCell.GetRow();
	var oTable = oCell.GetTable();

	if (!oRow || !oTable)
		return sDefault;

	var nCurCell = oCell.GetIndex();
	var nCurRow  = oRow.GetIndex();

	var isLeft = false;
	for (var nCellIndex = 0; nCellIndex < nCurCell; ++nCellIndex)
	{
		var oTempCell        = oRow.GetCell(nCellIndex);
		var oTempCellContent = oTempCell.GetContent();

		oTempCellContent.Set_ApplyToAll(true);
		var sCellText = oTempCellContent.GetSelectedText();
		oTempCellContent.Set_ApplyToAll(false);

		if (!isNaN(parseInt(sCellText)))
		{
			isLeft = true;
			break;
		}
	}

	var arrColumnCells = oCell.GetColumn();
	var isAbove = false;
	for (var nCellIndex = 0, nCellsCount = arrColumnCells.length; nCellIndex < nCellsCount; ++nCellIndex)
	{
		var oTempCell = arrColumnCells[nCellIndex];
		if (oTempCell === oCell)
			break;

		var oTempCellContent = oTempCell.GetContent();

		oTempCellContent.Set_ApplyToAll(true);
		var sCellText = oTempCellContent.GetSelectedText();
		oTempCellContent.Set_ApplyToAll(false);

		if (!isNaN(parseInt(sCellText)))
		{
			isAbove = true;
			break;
		}
	}

	if (isAbove)
		return "=SUM(ABOVE)";

	if (isLeft)
		return "=SUM(LEFT)";

	return sDefault;
};
/**
 * Добавляем формулу к текущей ячейке таблицы
 * @param {string} sFormula
 */
CDocument.prototype.AddTableCellFormula = function(sFormula)
{
	if (!sFormula || "=" !== sFormula.charAt(0))
		return;

	var oField = this.GetTableCellFormula(true);
	if (!oField)
	{
		if (!this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Content))
		{
			this.StartAction(AscDFH.historydescription_Document_AddTableFormula);

			if (this.IsSelectionUse())
			{
				if (!this.IsTableCellSelection())
					this.Remove(1, false, false, true);

				this.RemoveSelection();
			}

			this.AddFieldWithInstruction(sFormula);
			this.Recalculate();
			this.UpdateInterface();
			this.UpdateSelection();
			this.FinalizeAction();
		}
	}
	else
	{
		if (!this.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Content))
		{
			this.StartAction(AscDFH.historydescription_Document_ChangeTableFormula);
			oField.ChangeInstruction(sFormula);
			oField.Update();
			oField.MoveCursorOutsideElement(false);
			this.Recalculate();
			this.UpdateInterface();
			this.UpdateSelection();
			this.FinalizeAction();
		}
	}

};
/**
 * Разбираем sInstrLine на формулу и формат числа
 * @param {string} sInstrLine
 * @returns {Array}
 */
CDocument.prototype.ParseTableFormulaInstrLine = function(sInstrLine)
{
    var oParser = new CFieldInstructionParser();
    var oResult = oParser.GetInstructionClass(sInstrLine);
    if(oResult && oResult instanceof CFieldInstructionFORMULA)
    {
        return [oResult.Formula ? "=" + oResult.Formula : "=", oResult.Format && oResult.Format.sFormat ? oResult.Format.sFormat : ""];
    }
    return ["", ""];
};


CDocument.prototype.AddCaption = function(oPr)
{

    this.StartAction(AscDFH.historydescription_Document_AddCaption);
    var NewParagraph;
    if(this.CurPos.Type === docpostype_DrawingObjects)
    {
        if(this.DrawingObjects.selectedObjects.length === 1)
        {
            var oDrawing = this.DrawingObjects.selectedObjects[0].parent;
            if(oDrawing.Is_Inline())
            {
                NewParagraph = new Paragraph(this.DrawingDocument, oDrawing.DocumentContent);
                NewParagraph.SetParagraphStyle("Caption");
                oDrawing.DocumentContent.Internal_Content_Add(oPr.get_Before() ? oDrawing.Get_ParentParagraph().Index : (oDrawing.Get_ParentParagraph().Index + 1), NewParagraph, true);
            }
            else
            {

				var oNearestPos = this.Get_NearestPos(oDrawing.PageNum, oDrawing.X, oDrawing.Y, true, null);
				if(oNearestPos)
				{
                    var oNewDrawing = new ParaDrawing(1828800 / 36000, 1828800 / 36000, null, this.DrawingDocument, this, null);
                    var oShape = this.DrawingObjects.createTextArt(0, true, null, "");
                    oShape.setParent(oNewDrawing);
                    oNewDrawing.Set_GraphicObject(oShape);
                    oNewDrawing.Set_DrawingType(drawing_Anchor);
                    oNewDrawing.Set_WrappingType(oDrawing.wrappingType);
                    oNewDrawing.Set_BehindDoc(oDrawing.behindDoc);
                    oNewDrawing.Set_Distance(3.2, 0, 3.2, 0);
					oNearestPos.Paragraph.Check_NearestPos(oNearestPos);
					oNearestPos.Page = oDrawing.PageNum;
                    oShape.spPr.xfrm.setOffX(0.0);
                    oShape.spPr.xfrm.setOffY(0.0);
                    oShape.spPr.xfrm.setExtX(Math.max(25.4, oDrawing.Extent.W));
                    oShape.spPr.xfrm.setExtY(12.7);
                    var oBodyPr;
                    oBodyPr = oShape.getBodyPr().createDuplicate();
                    oBodyPr.wrap = AscFormat.nTWTSquare;
                    oBodyPr.lIns = 0.0;
                    oBodyPr.tIns = 0.0;
                    oBodyPr.rIns = 0.0;
                    oBodyPr.bIns = 0.0;
                    var dInset = 1.6;
                    var Y = oDrawing.Y + oDrawing.Extent.H + dInset;
                    if(oPr.get_Before())
					{
                        oBodyPr.textFit = new AscFormat.CTextFit();
                        oBodyPr.textFit.type = AscFormat.text_fit_No;
                        Y = oDrawing.Y - oShape.spPr.xfrm.extY - dInset;
					}
                    oNewDrawing.Set_XYForAdd(oDrawing.X, Y, oNearestPos, oDrawing.PageNum);
                    oShape.setBodyPr(oBodyPr);
                    oNewDrawing.Set_Parent(oNearestPos.Paragraph);
					oNewDrawing.Add_ToDocument(oNearestPos, false);
					oNewDrawing.CheckWH();
					var oContent = oShape.getDocContent();
					NewParagraph = oContent.Content[0];
                    NewParagraph.RemoveFromContent(0, NewParagraph.Content.length - 1);
                    NewParagraph.Clear_Formatting();
                    NewParagraph.SetParagraphStyle("Caption");
				}
            }
        }
    }
    else
    {
        if(this.Selection.Use)
        {
            var oTable = this.Content[this.Selection.StartPos];
            NewParagraph = new Paragraph(this.DrawingDocument, this);
            NewParagraph.SetParagraphStyle("Caption");
            this.Internal_Content_Add(oPr.get_Before() ? oTable.Index : (oTable.Index + 1), NewParagraph, true);
        }
        else
        {
            NewParagraph = new Paragraph(this.DrawingDocument, this);
            NewParagraph.SetParagraphStyle("Caption");
            this.Internal_Content_Add(oPr.get_Before() ? this.CurPos.ContentPos : (this.CurPos.ContentPos + 1), NewParagraph, true);
        }
    }
    if(NewParagraph)
    {
        var NewRun;
        var nCurPos = 0;
        var oComplexField;
        var oBeginChar, oSeparateChar, oEndChar;
        if(!oPr.get_ExcludeLabel())
        {
            var sLabel = oPr.get_Label();
            if(typeof sLabel === "string" && sLabel.length > 0)
            {
                NewRun = new ParaRun(NewParagraph, false);
                NewRun.AddText(sLabel + " ");
                NewParagraph.Internal_Content_Add(nCurPos++, NewRun, false);
            }
        }
        if(oPr.get_IncludeChapterNumber())
        {
            var nHeadingLvl = oPr.get_HeadingLvl();
            if(AscFormat.isRealNumber(nHeadingLvl))
            {
                oBeginChar    = new ParaFieldChar(fldchartype_Begin, this);
                oSeparateChar = new ParaFieldChar(fldchartype_Separate, this);
                oEndChar      = new ParaFieldChar(fldchartype_End, this);
                NewRun = new ParaRun();
                NewRun.AddToContent(-1, oBeginChar);

                var sStyleId = this.Styles.GetDefaultHeading(nHeadingLvl - 1);
                var oStyle = this.Styles.Get(sStyleId);
                NewRun.AddInstrText(" STYLEREF \"" + oStyle.GetName() + "\" \\s");
                NewRun.AddToContent(-1, oSeparateChar);
                NewRun.AddToContent(-1, oEndChar);
                oBeginChar.SetRun(NewRun);
                oSeparateChar.SetRun(NewRun);
                oEndChar.SetRun(NewRun);
                NewParagraph.Internal_Content_Add(nCurPos++, NewRun, false);
                oComplexField = oBeginChar.GetComplexField();
                oComplexField.SetBeginChar(oBeginChar);
                oComplexField.SetInstructionLine(" STYLEREF \"" + oStyle.GetName() + "\" \\s");
                oComplexField.SetSeparateChar(oSeparateChar);
                oComplexField.SetEndChar(oEndChar);
                oComplexField.Update(false, false);
            }
            var sSeparator = oPr.get_Separator();
            if(!sSeparator || sSeparator.length === 0)
            {
                sSeparator = " ";
            }
            NewRun = new ParaRun(NewParagraph, false);
            NewRun.AddText(sSeparator);
            NewParagraph.Internal_Content_Add(nCurPos++, NewRun, false);
        }

        var sInstruction = " SEQ " + oPr.get_Label() + " \\* " + oPr.get_FormatGeneral() + " ";
        if(AscFormat.isRealNumber(nHeadingLvl))
        {
            sInstruction += ("\\s " + nHeadingLvl);
        }
        oBeginChar    = new ParaFieldChar(fldchartype_Begin, this);
        oSeparateChar = new ParaFieldChar(fldchartype_Separate, this);
        oEndChar      = new ParaFieldChar(fldchartype_End, this);
        NewRun = new ParaRun();
        NewRun.AddToContent(-1, oBeginChar);
        NewRun.AddInstrText(sInstruction);
        NewRun.AddToContent(-1, oSeparateChar);
        NewRun.AddToContent(-1, oEndChar);
        oBeginChar.SetRun(NewRun);
        oSeparateChar.SetRun(NewRun);
        oEndChar.SetRun(NewRun);
        NewParagraph.Internal_Content_Add(nCurPos++, NewRun, false);
        oComplexField = oBeginChar.GetComplexField();
        oComplexField.SetBeginChar(oBeginChar);
        oComplexField.SetInstructionLine(sInstruction);
        oComplexField.SetSeparateChar(oSeparateChar);
        oComplexField.SetEndChar(oEndChar);
        var sAdditional = oPr.get_Additional();
        if(typeof sAdditional === "string" && sAdditional.length > 0)
        {
            NewRun = new ParaRun(NewParagraph, false);
            NewRun.AddText(sAdditional + " ");
            NewParagraph.Internal_Content_Add(nCurPos++, NewRun, false);
        }



        var aFields = [];

        oComplexField.Update(false, false);
        this.GetAllSeqFieldsByType(oPr.get_Label(), aFields);
        for(var i = 0; i < aFields.length; ++i)
        {
            if(aFields[i] === oComplexField)
            {
                break;
            }
        }
        aFields = aFields.slice(i, aFields.length - i);
        var arrParagraphs = [];
        for (var nIndex = 0, nCount = aFields.length; nIndex < nCount; ++nIndex)
        {
            var oField = aFields[nIndex];
            if (oField instanceof CComplexField)
            {
                oField.SelectField();
                arrParagraphs = arrParagraphs.concat(this.GetCurrentParagraph(false, true));
            }
            else if (oField instanceof ParaField)
            {
                if (oField.GetParagraph())
                    arrParagraphs.push(oField.GetParagraph());
            }
        }

        if(arrParagraphs.length > 0)
        {
            if (!this.Document_Is_SelectionLocked(changestype_None, {
                Type      : changestype_2_ElementsArray_and_Type,
                Elements  : arrParagraphs,
                CheckType : changestype_Paragraph_Content
            }))
            {
                this.StartAction(AscDFH.historydescription_Document_UpdateFields);
                for(i = 0; i < aFields.length; ++i)
                {
                    if(aFields[i].Update)
                    {
                        aFields[i].Update(false, false);
                    }
                }
                this.FinalizeAction();
            }
        }
        NewParagraph.MoveCursorToEndPos();
        NewParagraph.Document_SetThisElementCurrent(true);
    }
    this.Recalculate();
    this.FinalizeAction();
};
/**
 * Выделяем перемещенный или удаленный после перемещения текст
 * @param sMoveId {string} идентификатор переноса
 * @param isFrom {boolean} true - выделяем удаленный текст, false - выделяем перемещенный текст
 * @param [isSetCurrentChange=false] {boolean} Выставлять или нет данное изменение текущим
 * @param [isUpdateInterface=true] {boolean} Обновлять ли интерфейс
 */
CDocument.prototype.SelectTrackMove = function(sMoveId, isFrom, isSetCurrentChange, isUpdateInterface)
{
	var oManager = this.GetTrackRevisionsManager();

	function private_GetDocumentPosition(oMark)
	{
		if (!oMark.IsUseInDocument())
			return null;

		if (oMark instanceof CParaRevisionMove)
		{
			return oMark.GetDocumentPositionFromObject();
		}
		else if (oMark instanceof CRunRevisionMove && oMark.GetRun())
		{
			var oRun      = oMark.GetRun();
			var arrPos    = oRun.GetDocumentPositionFromObject();
			var nInRunPos = oRun.GetElementPosition(oMark);

			if (oMark.IsStart())
				arrPos.push({Class : oRun, Position : nInRunPos});
			else
				arrPos.push({Class : oRun, Position : nInRunPos + 1});

			return arrPos;
		}

		return null;
	}

	// TODO: Можно отказаться вообще от MoveMarks в пользу сбора изменений через функцию GetAllMoveChanges

	var oMarks = oManager.GetMoveMarks(sMoveId);
	if (oMarks)
	{
		var oStart = isFrom ? oMarks.From.Start : oMarks.To.Start;
		var oEnd   = isFrom ? oMarks.From.End : oMarks.To.End;

		if (oStart && oEnd)
		{
			var oStartDocPos = private_GetDocumentPosition(oStart);
			var oEndDocPos   = private_GetDocumentPosition(oEnd);

			if (oStartDocPos && oEndDocPos && oStartDocPos[0].Class === oEndDocPos[0].Class)
			{
				var oDocContent = oStartDocPos[0].Class;
				oDocContent.SetSelectionByContentPositions(oStartDocPos, oEndDocPos);

				if (isSetCurrentChange)
				{
					var oChange = oStart.GetReviewChange();
					if (oChange)
						oManager.SetCurrentChange(oManager.CollectMoveChange(oChange));
				}
			}
			else
			{
				this.RemoveSelection();
			}

			this.UpdateSelection();

			if (false !== isUpdateInterface)
				this.UpdateInterface(true);
		}
	}
};
/**
 * Удаляем метки переноса
 * @param sMoveId
 */
CDocument.prototype.RemoveTrackMoveMarks = function(sMoveId)
{
	if (sMoveId === this.TrackMoveId)
		return;

	var oManager = this.GetTrackRevisionsManager();
	var oMarks   = oManager.GetMoveMarks(sMoveId);

	if (!oMarks)
		return;

	var oTrackMoveProcess = oManager.GetProcessTrackMove();
	if (oTrackMoveProcess && oTrackMoveProcess.GetMoveId() === sMoveId)
		return;

	var oDocState = this.GetSelectionState();

	this.SelectTrackMove(sMoveId, true, false, false);
	this.AcceptRevisionChanges(c_oAscRevisionsChangeType.MoveMarkRemove, false);

	this.SelectTrackMove(sMoveId, false, false, false);
	this.AcceptRevisionChanges(c_oAscRevisionsChangeType.MoveMarkRemove, false);

	this.SetSelectionState(oDocState);

	if (!this.Action.Start)
		return;

	if (!this.Action.Additional.TrackMove)
		this.Action.Additional.TrackMove = {};


	if (this.Action.Additional.TrackMove[sMoveId])
		return;

	this.Action.Additional.TrackMove[sMoveId] = oMarks;
};
/**
 * Выставляем параметр для насильного запрета отрисовки рамок для ContentControl
 * @param {boolean} isHide
 */
CDocument.prototype.SetForceHideContentControlTrack = function(isHide)
{
	this.ForceHideCCTrack = isHide;
	this.UpdateTracks();
};
/**
 * Выставлен ли насильный запрет отрисовки рамок ContentControl
 * @returns {boolean}
 */
CDocument.prototype.IsForceHideContentControlTrack = function()
{
	return this.ForceHideCCTrack;
};
/**
 * Проверяем, выделен ли перенесенный текст
 * @param {?CSelectedElementsInfo} oSelectedInfo
 * @returns {string | null} id переноса
 */
CDocument.prototype.private_CheckTrackMoveSelection = function(oSelectedInfo)
{
	if (!oSelectedInfo)
		oSelectedInfo = this.GetSelectedElementsInfo({CheckAllSelection : true});

	if (oSelectedInfo.HaveNotReviewedContent() || oSelectedInfo.HaveRemovedInReview() || !oSelectedInfo.HaveAddedInReview())
		return null;

	var arrParagraphs = this.GetSelectedParagraphs();

	if (arrParagraphs.length <= 0)
		return null;

	var sMarkS = arrParagraphs[0].CheckTrackMoveMarkInSelection(true);
	var sMarkE = arrParagraphs[arrParagraphs.length - 1].CheckTrackMoveMarkInSelection(false);

	if (sMarkS === sMarkE)
		return sMarkS;

	return null;
};
/**
 * Проверяем попадает ли в выделение какой-нибудь перенос
 * @returns {string | null} id переноса
 */
CDocument.prototype.CheckTrackMoveInSelection = function()
{
	var oSelectedInfo = this.GetSelectedElementsInfo({CheckAllSelection : true});

	var arrMoveMarks = oSelectedInfo.GetTrackMoveMarks();
	if (arrMoveMarks.length > 0)
		return arrMoveMarks[0].GetMarkId();

	if (!oSelectedInfo.HaveRemovedInReview() && !oSelectedInfo.HaveAddedInReview())
		return null;

	var arrParagraphs = this.GetSelectedParagraphs();

	if (arrParagraphs.length <= 0)
		return null;

	var sMarkS = arrParagraphs[0].CheckTrackMoveMarkInSelection(true);
	var sMarkE = arrParagraphs[arrParagraphs.length - 1].CheckTrackMoveMarkInSelection(false);

	if (sMarkS && sMarkS === sMarkE)
		return sMarkS;

	sMarkS = arrParagraphs[0].CheckTrackMoveMarkInSelection(true, false);
	sMarkE = arrParagraphs[arrParagraphs.length - 1].CheckTrackMoveMarkInSelection(false, false);

	if (sMarkS && sMarkS === sMarkE)
		return sMarkS;

	return null;
};

/**
 * Функция для рисования таблицы с помощью мыши
 */
CDocument.prototype.DrawTable = function()
{
	if (!this.DrawTableMode.Draw && !this.DrawTableMode.Erase)
		return;

	if (!this.DrawTableMode.Table)
	{
		if (!this.DrawTableMode.Draw || Math.abs(this.DrawTableMode.StartX - this.DrawTableMode.EndX) < 1 || Math.abs(this.DrawTableMode.StartY - this.DrawTableMode.EndY) < 1)
			return;

		var oSelectionState = this.GetSelectionState();

		this.RemoveSelection();

		this.CurPage = this.DrawTableMode.Page;
		this.MoveCursorToXY(this.DrawTableMode.StartX, this.DrawTableMode.StartY, false);

		if (!this.IsSelectionLocked(AscCommon.changestype_Document_Content_Add))
		{
			this.StartAction(AscDFH.historydescription_Document_DrawNewTable, oSelectionState);

			var oTable = this.AddInlineTable(1, 1, -1);
			if (oTable && oTable.GetRowsCount() > 0)
			{
				oTable.Set_Inline(false);
				oTable.Set_Distance(3.2, 0, 3.2, 0);
				oTable.Set_PositionH(c_oAscHAnchor.Page, false, Math.min(this.DrawTableMode.StartX, this.DrawTableMode.EndX));
				oTable.Set_PositionV(c_oAscVAnchor.Page, false, Math.min(this.DrawTableMode.StartY, this.DrawTableMode.EndY));
				oTable.Set_TableW(tblwidth_Mm, Math.abs(this.DrawTableMode.EndX - this.DrawTableMode.StartX));
				oTable.GetRow(0).SetHeight(Math.abs(this.DrawTableMode.EndY - this.DrawTableMode.StartY), Asc.linerule_AtLeast);
			}

			this.FinalizeAction();
			this.Api.SetTableDrawMode(true);
		}

		return;
	}

	if (!this.IsSelectionLocked(changestype_None, {
			Type      : changestype_2_ElementsArray_and_Type,
			Elements  : [this.DrawTableMode.Table],
			CheckType : AscCommon.changestype_Table_Properties
		}))
	{
		var isDraw  = this.DrawTableMode.Draw;
		var isErase = this.DrawTableMode.Erase;

		var oTable = this.DrawTableMode.Table;

		this.StartAction(AscDFH.historydescription_Document_DrawTable);
		oTable.DrawTableCells(this.DrawTableMode.StartX, this.DrawTableMode.StartY, this.DrawTableMode.EndX, this.DrawTableMode.EndY, this.DrawTableMode.TablePageStart, this.DrawTableMode.TablePageEnd, isDraw);

		if (oTable.GetRowsCount() <= 0 && oTable.GetParent())
		{
			var oParentDocContent = oTable.GetParent();

			this.RemoveSelection();
			oTable.PreDelete();

			var nPos = oTable.GetIndex();
			oParentDocContent.RemoveFromContent(nPos, 1);

			oParentDocContent.SetDocPosType(docpostype_Content);

			if (nPos >= oParentDocContent.Content.length)
			{
				oParentDocContent.CurPos.ContentPos = nPos - 1;
				oParentDocContent.Content[nPos - 1].MoveCursorToEndPos();
			}
			else
			{
				if (nPos < 0)
					nPos = 0;

				oParentDocContent.CurPos.ContentPos = nPos;
				oParentDocContent.Content[nPos].MoveCursorToEndPos();
			}
		}

		this.Recalculate();
		this.FinalizeAction();

		if (isDraw)
			this.Api.SetTableDrawMode(true);
		else if (isErase)
			this.Api.SetTableEraseMode(true);
	}
};
/**
 * Добавляем текст в текущую позицию с заданными текстовыми настройками
 * @param sText {string}
 * @param oTextPr {?CTextPr}
 * @param isMoveCursorOutside {boolean} выводим ли курсор за пределы нового рана
 */
CDocument.prototype.AddTextWithPr = function(sText, oTextPr, isMoveCursorOutside)
{
	if (!this.IsSelectionLocked(AscCommon.changestype_Paragraph_AddText))
	{
		this.StartAction(AscDFH.historydescription_Document_AddTextWithProperties);

		this.RemoveBeforePaste();

		var oCurrentTextPr = this.GetDirectTextPr();

		var oParagraph = this.GetCurrentParagraph();
		if (oParagraph && oParagraph.GetParent())
		{
			var oTempPara = new Paragraph(this.GetDrawingDocument(), oParagraph.GetParent());
			var oRun      = new ParaRun(oTempPara, false);
			oRun.AddText(sText);
			oTempPara.AddToContent(0, oRun);

			oRun.SetPr(oCurrentTextPr.Copy());
			if (oTextPr)
				oRun.ApplyPr(oTextPr);

			var oAnchorPos = oParagraph.GetCurrentAnchorPosition();

			var oSelectedContent = new CSelectedContent();
			var oSelectedElement = new CSelectedElement();

			oSelectedElement.Element     = oTempPara;
			oSelectedElement.SelectedAll = false;
			oSelectedContent.Add(oSelectedElement);

			oSelectedContent.On_EndCollectElements(this, false);

			oParagraph.GetParent().InsertContent(oSelectedContent, oAnchorPos);

			if (this.IsSelectionUse())
			{
				if (isMoveCursorOutside)
				{
					this.RemoveSelection();
					oRun.MoveCursorOutsideElement(false);
				}
				else
				{
					this.MoveCursorRight(false, false, true);
				}
			}
			else if (isMoveCursorOutside)
			{
				oRun.MoveCursorOutsideElement(false);
			}
		}

		this.Recalculate();
		this.UpdateInterface();
		this.UpdateSelection();
		this.FinalizeAction();
	}
};
/**
 * Список позиций, которые мы собираемся отслеживать
 * @param arrPositions
 */
CDocument.prototype.TrackDocumentPositions = function(arrPositions)
{
	this.CollaborativeEditing.Clear_DocumentPositions();

	for (var nIndex = 0, nCount = arrPositions.length; nIndex < nCount; ++nIndex)
	{
		this.CollaborativeEditing.Add_DocumentPosition(arrPositions[nIndex]);
	}
};
/**
 * Обновляем отслеживаемые позиции
 * @param arrPositions
 */
CDocument.prototype.RefreshDocumentPositions = function(arrPositions)
{
	for (var nIndex = 0, nCount = arrPositions.length; nIndex < nCount; ++nIndex)
	{
		this.CollaborativeEditing.Update_DocumentPosition(arrPositions[nIndex]);
	}
};
/**
 * Конвертируем позицию в документе в специальную позицию NearestPos
 * @param oDocPos
 * @returns {NearestPos}
 */
CDocument.prototype.DocumentPositionToAnchorPosition = function(oDocPos)
{
	var oRun, nInRunPos = -1;
	for (var nIndex = oDocPos.length - 1; nIndex >= 0; --nIndex)
	{
		if (oDocPos[nIndex].Class instanceof ParaRun)
		{
			oRun      = oDocPos[nIndex].Class;
			nInRunPos = oDocPos[nIndex].Position;
			break;
		}
	}

	if (!oRun)
		return;

	var oParaContentPos = oRun.GetParagraphContentPosFromObject(nInRunPos);
	var oParagraph      = oRun.GetParagraph();

	if (!oParagraph || !oParaContentPos)
		return;

	return oParaContentPos.ToAnchorPos(oParagraph);
};
/**
 * Конвертируем NearesPos в позицию документа
 * @param oAnchorPos {NearestPos}
 * @returns {*}
 */
CDocument.prototype.AnchorPositionToDocumentPosition = function(oAnchorPos)
{
	var oParagraph = oAnchorPos.Paragraph;
	var oRun       = oParagraph.GetElementByPos(oAnchorPos.ContentPos);

	if (!oRun || !(oRun instanceof ParaRun))
		return null;

	var nInRunPos = oAnchorPos.ContentPos.Get(oAnchorPos.ContentPos.GetDepth());

	var oDocPos = oRun.GetDocumentPositionFromObject();
	oDocPos.push({Class : oRun, Position : nInRunPos});

	return oDocPos;
};
/**
 * Выделена ли сейчас автофигура (проверяем с учетом колонтитулов)
 * @returns {boolean}
 */
CDocument.prototype.IsDrawingSelected = function()
{
	return (docpostype_DrawingObjects === this.GetDocPosType() || (docpostype_HdrFtr === this.CurPos.Type && null != this.HdrFtr.CurHdrFtr && docpostype_DrawingObjects === this.HdrFtr.CurHdrFtr.Content.CurPos.Type));
};
/**
 * Получаем список таблицы на заданной абсолютной странице
 * @param {number} nPageAbs
 * @returns {Array}
 */
CDocument.prototype.GetAllTablesOnPage = function(nPageAbs)
{
	var arrTables = [];

	if (!this.Pages[nPageAbs])
		return [];

	if (docpostype_HdrFtr === this.GetDocPosType())
	{
		this.HdrFtr.GetAllTablesOnPage(nPageAbs, arrTables);
	}
	else
	{
		var nStartPos = this.Pages[nPageAbs].Pos;
		var nEndPos   = this.Pages[nPageAbs].EndPos;

		for (var nPos = nStartPos; nPos <= nEndPos; ++nPos)
		{
			this.Content[nPos].GetAllTablesOnPage(nPageAbs, arrTables);
		}
	}

	return arrTables;
};

function CDocumentSelectionState()
{
    this.Id        = null;
    this.Type      = docpostype_Content;
    this.Data      = {}; // Объект с текущей позицией
}

function CDocumentSectionsInfo()
{
    this.Elements = [];
}

CDocumentSectionsInfo.prototype =
{
    Add : function( SectPr, Index )
    {
        this.Elements.push( new CDocumentSectionsInfoElement( SectPr, Index ) );
    },

    Get_SectionsCount : function()
    {
        return this.Elements.length;
    },

    Clear : function()
    {
        this.Elements.length = 0;
    },

    Find_ByHdrFtr : function(HdrFtr)
    {
        var Count = this.Elements.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var SectPr = this.Elements[Index].SectPr;

            if ( HdrFtr === SectPr.Get_Header_First() || HdrFtr === SectPr.Get_Header_Default() || HdrFtr === SectPr.Get_Header_Even() ||
                 HdrFtr === SectPr.Get_Footer_First() || HdrFtr === SectPr.Get_Footer_Default() || HdrFtr === SectPr.Get_Footer_Even() )
                    return Index;
        }

        return -1;
    },

    Reset_HdrFtrRecalculateCache : function()
    {
        var Count = this.Elements.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var SectPr = this.Elements[Index].SectPr;

            if ( null != SectPr.HeaderFirst )
                SectPr.HeaderFirst.Reset_RecalculateCache();

            if ( null != SectPr.HeaderDefault )
                SectPr.HeaderDefault.Reset_RecalculateCache();

            if ( null != SectPr.HeaderEven )
                SectPr.HeaderEven.Reset_RecalculateCache();

            if ( null != SectPr.FooterFirst )
                SectPr.FooterFirst.Reset_RecalculateCache();

            if ( null != SectPr.FooterDefault )
                SectPr.FooterDefault.Reset_RecalculateCache();

            if ( null != SectPr.FooterEven )
                SectPr.FooterEven.Reset_RecalculateCache();
        }
    },

    GetAllParagraphs : function(Props, ParaArray)
    {
        var Count = this.Elements.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var SectPr = this.Elements[Index].SectPr;

            if ( null != SectPr.HeaderFirst )
                SectPr.HeaderFirst.GetAllParagraphs(Props, ParaArray);

            if ( null != SectPr.HeaderDefault )
                SectPr.HeaderDefault.GetAllParagraphs(Props, ParaArray);

            if ( null != SectPr.HeaderEven )
                SectPr.HeaderEven.GetAllParagraphs(Props, ParaArray);

            if ( null != SectPr.FooterFirst )
                SectPr.FooterFirst.GetAllParagraphs(Props, ParaArray);

            if ( null != SectPr.FooterDefault )
                SectPr.FooterDefault.GetAllParagraphs(Props, ParaArray);

            if ( null != SectPr.FooterEven )
                SectPr.FooterEven.GetAllParagraphs(Props, ParaArray);
        }
    },

	GetAllDrawingObjects : function(arrDrawings)
    {
        for (var nIndex = 0, nCount = this.Elements.length; nIndex < nCount; ++nIndex)
        {
            var SectPr = this.Elements[nIndex].SectPr;

            if (null != SectPr.HeaderFirst)
                SectPr.HeaderFirst.GetAllDrawingObjects(arrDrawings);

            if (null != SectPr.HeaderDefault)
                SectPr.HeaderDefault.GetAllDrawingObjects(arrDrawings);

            if (null != SectPr.HeaderEven)
                SectPr.HeaderEven.GetAllDrawingObjects(arrDrawings);

            if (null != SectPr.FooterFirst)
                SectPr.FooterFirst.GetAllDrawingObjects(arrDrawings);

            if (null != SectPr.FooterDefault)
                SectPr.FooterDefault.GetAllDrawingObjects(arrDrawings);

            if (null != SectPr.FooterEven)
                SectPr.FooterEven.GetAllDrawingObjects(arrDrawings);
        }
    },

    Document_CreateFontMap : function(FontMap)
    {
        var Count = this.Elements.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var SectPr = this.Elements[Index].SectPr;

            if ( null != SectPr.HeaderFirst )
                SectPr.HeaderFirst.Document_CreateFontMap(FontMap);

            if ( null != SectPr.HeaderDefault )
                SectPr.HeaderDefault.Document_CreateFontMap(FontMap);

            if ( null != SectPr.HeaderEven )
                SectPr.HeaderEven.Document_CreateFontMap(FontMap);

            if ( null != SectPr.FooterFirst )
                SectPr.FooterFirst.Document_CreateFontMap(FontMap);

            if ( null != SectPr.FooterDefault )
                SectPr.FooterDefault.Document_CreateFontMap(FontMap);

            if ( null != SectPr.FooterEven )
                SectPr.FooterEven.Document_CreateFontMap(FontMap);
        }
    },

    Document_CreateFontCharMap : function(FontCharMap)
    {
        var Count = this.Elements.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var SectPr = this.Elements[Index].SectPr;

            if ( null != SectPr.HeaderFirst )
                SectPr.HeaderFirst.Document_CreateFontCharMap(FontCharMap);

            if ( null != SectPr.HeaderDefault )
                SectPr.HeaderDefault.Document_CreateFontCharMap(FontCharMap);

            if ( null != SectPr.HeaderEven )
                SectPr.HeaderEven.Document_CreateFontCharMap(FontCharMap);

            if ( null != SectPr.FooterFirst )
                SectPr.FooterFirst.Document_CreateFontCharMap(FontCharMap);

            if ( null != SectPr.FooterDefault )
                SectPr.FooterDefault.Document_CreateFontCharMap(FontCharMap);

            if ( null != SectPr.FooterEven )
                SectPr.FooterEven.Document_CreateFontCharMap(FontCharMap);
        }
    },

    Document_Get_AllFontNames : function ( AllFonts )
    {
        var Count = this.Elements.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var SectPr = this.Elements[Index].SectPr;

            if ( null != SectPr.HeaderFirst )
                SectPr.HeaderFirst.Document_Get_AllFontNames(AllFonts);

            if ( null != SectPr.HeaderDefault )
                SectPr.HeaderDefault.Document_Get_AllFontNames(AllFonts);

            if ( null != SectPr.HeaderEven )
                SectPr.HeaderEven.Document_Get_AllFontNames(AllFonts);

            if ( null != SectPr.FooterFirst )
                SectPr.FooterFirst.Document_Get_AllFontNames(AllFonts);

            if ( null != SectPr.FooterDefault )
                SectPr.FooterDefault.Document_Get_AllFontNames(AllFonts);

            if ( null != SectPr.FooterEven )
                SectPr.FooterEven.Document_Get_AllFontNames(AllFonts);
        }
    },

    Get_Index : function(Index)
    {
        var Count = this.Elements.length;

        for ( var Pos = 0; Pos < Count; Pos++ )
        {
            if ( Index <= this.Elements[Pos].Index )
                return Pos;
        }

        // Последний элемент здесь это всегда конечная секция документа
        return (Count - 1);
    },

    Get_Count : function()
    {
        return this.Elements.length;
    },

    Get_SectPr : function(Index)
    {
        var Count = this.Elements.length;

        for ( var Pos = 0; Pos < Count; Pos++ )
        {
            if ( Index <= this.Elements[Pos].Index )
                return this.Elements[Pos];
        }

        // Последний элемент здесь это всегда конечная секция документа
        return this.Elements[Count - 1];
    },

    Get_SectPr2 : function(Index)
    {
        return this.Elements[Index];
    },

    Find : function(SectPr)
    {
        var Count = this.Elements.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var Element = this.Elements[Index];
            if ( Element.SectPr === SectPr )
                return Index;
        }

        return -1;
    },

    Update_OnAdd : function(Pos, Items)
    {
        var Count = Items.length;
        var Len = this.Elements.length;

        // Сначала обновим старые метки
        for (var Index = 0; Index < Len; Index++)
        {
            if ( this.Elements[Index].Index >= Pos )
                this.Elements[Index].Index += Count;
        }

        // Если среди новых элементов были параграфы с настройками секции, тогда добавим их здесь
        for (var Index = 0; Index < Count; Index++ )
        {
            var Item = Items[Index];
            var SectPr = ( type_Paragraph === Item.GetType() ? Item.Get_SectionPr() : undefined );

            if ( undefined !== SectPr )
            {
                var TempPos = 0;
                for ( ; TempPos < Len; TempPos++ )
                {
                    if ( Pos + Index <= this.Elements[TempPos].Index )
                        break;
                }

                this.Elements.splice( TempPos, 0, new CDocumentSectionsInfoElement( SectPr, Pos + Index ) );
                Len++;
            }
        }
    },

    Update_OnRemove : function(Pos, Count, bCheckHdrFtr)
    {
        var Len = this.Elements.length;

        for (var Index = 0; Index < Len; Index++)
        {
            var CurPos = this.Elements[Index].Index;

            if (CurPos >= Pos && CurPos < Pos + Count)
            {
                // Копируем поведение Word: Если у следующей секции не задан вообще ни один колонтитул,
                // тогда копируем ссылки на колонтитулы из удаляемой секции. Если задан хоть один колонтитул,
                // тогда этого не делаем.
                if (true === bCheckHdrFtr && Index < Len - 1)
                {
                    var CurrSectPr = this.Elements[Index].SectPr;
                    var NextSectPr = this.Elements[Index + 1].SectPr;
                    if (true === NextSectPr.IsAllHdrFtrNull() && true !== CurrSectPr.IsAllHdrFtrNull())
                    {
                        NextSectPr.Set_Header_First(CurrSectPr.Get_Header_First());
                        NextSectPr.Set_Header_Even(CurrSectPr.Get_Header_Even());
                        NextSectPr.Set_Header_Default(CurrSectPr.Get_Header_Default());
                        NextSectPr.Set_Footer_First(CurrSectPr.Get_Footer_First());
                        NextSectPr.Set_Footer_Even(CurrSectPr.Get_Footer_Even());
                        NextSectPr.Set_Footer_Default(CurrSectPr.Get_Footer_Default());
                    }
                }

                this.Elements.splice(Index, 1);
                Len--;
                Index--;


            }
            else if (CurPos >= Pos + Count)
                this.Elements[Index].Index -= Count;
        }
    }
};
/**
 * Получаем массив всех колонтитулов, используемых в данно документе
 * @returns {Array.CHeaderFooter}
 */
CDocumentSectionsInfo.prototype.GetAllHdrFtrs = function()
{
	var HdrFtrs = [];

	var Count = this.Elements.length;
	for (var Index = 0; Index < Count; Index++)
	{
		var SectPr = this.Elements[Index].SectPr;
		SectPr.GetAllHdrFtrs(HdrFtrs);
	}

	return HdrFtrs;
};
CDocumentSectionsInfo.prototype.GetAllContentControls = function(arrContentControls)
{
	for (var nIndex = 0, nCount = this.Elements.length; nIndex < nCount; ++nIndex)
	{
		var SectPr = this.Elements[nIndex].SectPr;

		if (null != SectPr.HeaderFirst)
			SectPr.HeaderFirst.GetAllContentControls(arrContentControls);

		if (null != SectPr.HeaderDefault)
			SectPr.HeaderDefault.GetAllContentControls(arrContentControls);

		if (null != SectPr.HeaderEven)
			SectPr.HeaderEven.GetAllContentControls(arrContentControls);

		if (null != SectPr.FooterFirst)
			SectPr.FooterFirst.GetAllContentControls(arrContentControls);

		if (null != SectPr.FooterDefault)
			SectPr.FooterDefault.GetAllContentControls(arrContentControls);

		if (null != SectPr.FooterEven)
			SectPr.FooterEven.GetAllContentControls(arrContentControls);
	}
};
/**
 * Обновляем заданную секцию
 * @param oSectPr {CSectionPr} - Секция, которую нужно обновить
 * @param oNewSectPr {?CSectionPr} - Либо новое значение секции, либо undefined для удалении секции
 * @param isCheckHdrFtr {boolean} - Нужно ли проверять колонтитулы при удалении секции
 * @returns {boolean} Если не смогли обновить, возвращаем false
 */
CDocumentSectionsInfo.prototype.UpdateSection = function(oSectPr, oNewSectPr, isCheckHdrFtr)
{
	if (oSectPr === oNewSectPr || !oSectPr)
		return false;

	for (var nIndex = 0, nCount = this.Elements.length; nIndex < nCount; ++nIndex)
	{
		if (oSectPr === this.Elements[nIndex].SectPr)
		{
			if (!oNewSectPr)
			{
				// Копируем поведение Word: Если у следующей секции не задан вообще ни один колонтитул,
				// тогда копируем ссылки на колонтитулы из удаляемой секции. Если задан хоть один колонтитул,
				// тогда этого не делаем.
				if (true === isCheckHdrFtr && nIndex < nCount - 1)
				{
					var oCurrSectPr = this.Elements[nIndex].SectPr;
					var oNextSectPr = this.Elements[nIndex + 1].SectPr;

					if (true === oNextSectPr.IsAllHdrFtrNull() && true !== oCurrSectPr.IsAllHdrFtrNull())
					{
						oNextSectPr.Set_Header_First(oCurrSectPr.Get_Header_First());
						oNextSectPr.Set_Header_Even(oCurrSectPr.Get_Header_Even());
						oNextSectPr.Set_Header_Default(oCurrSectPr.Get_Header_Default());
						oNextSectPr.Set_Footer_First(oCurrSectPr.Get_Footer_First());
						oNextSectPr.Set_Footer_Even(oCurrSectPr.Get_Footer_Even());
						oNextSectPr.Set_Footer_Default(oCurrSectPr.Get_Footer_Default());
					}
				}

				this.Elements.splice(nIndex, 1);
			}
			else
			{
				this.Elements[nIndex].SectPr = oNewSectPr;
			}

			return true;
		}
	}

	return false;
};

function CDocumentSectionsInfoElement(SectPr, Index)
{
    this.SectPr = SectPr;
    this.Index  = Index;
}

function CDocumentCompareDrawingsLogicPositions(Drawing1, Drawing2)
{
    this.Drawing1 = Drawing1;
    this.Drawing2 = Drawing2;
    this.Result   = 0;
}

function CTrackRevisionsManager(oLogicDocument)
{
	this.LogicDocument     = oLogicDocument;
	this.CheckElements     = {};   // Элементы, которые нужно проверить
	this.Changes           = {};   // Объект с ключом - Id параграфа, в котором лежит массив изменений
	this.ChangesOutline    = [];   // Упорядоченный массив с объектами, в которых есть изменения в рецензировании
	this.CurChange         = null; // Текущее изменение
	this.CurElement        = null; // Элемент с текущим изменением
	this.VisibleChanges    = [];   // Изменения, которые отображаются в сплывающем окне
	this.OldVisibleChanges = [];

	this.MoveId      = 1;
	this.MoveMarks   = {};
	this.ProcessMove = null;
}

/**
 * Отправляем элемент на проверку на наличие рецензирования
 * @param oElement {Paragraph | CTable}
 */
CTrackRevisionsManager.prototype.CheckElement = function(oElement)
{
	if (!(oElement instanceof Paragraph) && !(oElement instanceof CTable))
		return;

	var sElementId = oElement.GetId();

    if (!this.CheckElements[sElementId])
        this.CheckElements[sElementId] = 1;
    else
        this.CheckElements[sElementId]++;
};
/**
 * Добавляем изменение в рецензировании по Id элемента
 * @param sId {string}
 * @param oChange {CRevisionsChange}
 */
CTrackRevisionsManager.prototype.AddChange = function(sId, oChange)
{
	this.private_CheckChangeObject(sId);
    this.Changes[sId].push(oChange);
};
/**
 * Получаем массив изменений заданного элемента
 * @param sElementId
 * @returns {CRevisionsChange[]}
 */
CTrackRevisionsManager.prototype.GetElementChanges = function(sElementId)
{
    if (this.Changes[sElementId])
        return this.Changes[sElementId];

    return [];
};
CTrackRevisionsManager.prototype.ContinueTrackRevisions = function(isComplete)
{
	// За раз обрабатываем не больше 50 параграфов, чтобы не подвешивать клиент на открытии файлов
	var nMaxCounter = 50,
		nCounter    = 0;

	var bNeedUpdate = false;
	for (var sId in this.CheckElements)
	{
		if (this.private_TrackChangesForSingleElement(sId))
			bNeedUpdate = true;

		if (true !== isComplete)
		{
			++nCounter;
			if (nCounter >= nMaxCounter)
				break;
		}
	}

	if (bNeedUpdate)
		this.LogicDocument.Document_UpdateInterfaceState();
};
/**
 * Ищем следующее изменение
 * @returns {?CRevisionsChange}
 */
CTrackRevisionsManager.prototype.GetNextChange = function()
{
	if (this.CurChange && this.CurChange.IsComplexChange())
	{
		var arrChanges = this.CurChange.GetSimpleChanges();

		this.CurChange  = null;
		this.CurElement = null;

		if (arrChanges.length > 0)
		{
			this.CurChange  = arrChanges[arrChanges.length - 1];
			this.CurElement = this.CurChange.GetElement();

			if (!this.CurElement || !this.Changes[this.CurElement.GetId()])
			{
				this.CurChange  = null;
				this.CurElement = null;
			}
		}
	}

	var oChange = this.private_GetNextChange();
	if (oChange && oChange.IsMove() && !oChange.IsComplexChange())
	{
		oChange        = this.CollectMoveChange(oChange);
		this.CurChange = oChange;
	}

	return oChange;
};
CTrackRevisionsManager.prototype.private_GetNextChange = function()
{
	var oInitialCurChange  = this.CurChange;
	var oInitialCurElement = this.CurElement;

	var oNextElement = null;
	if (null !== this.CurChange && null !== this.CurElement && this.Changes[this.CurElement.GetId()])
	{
		var arrChangesArray = this.Changes[this.CurElement.GetId()];

		var nChangeIndex = -1;
		for (var nIndex = 0, nCount = arrChangesArray.length; nIndex < nCount; ++nIndex)
		{
			if (this.CurChange === arrChangesArray[nIndex])
			{
				nChangeIndex = nIndex;
				break;
			}
		}

		if (-1 !== nChangeIndex && nChangeIndex < arrChangesArray.length - 1)
		{
			this.CurChange = arrChangesArray[nChangeIndex + 1];
			return this.CurChange;
		}

		oNextElement = this.LogicDocument.GetRevisionsChangeElement(1, this.CurElement);
	}
	else
	{
		var oSearchEngine = this.LogicDocument.private_GetRevisionsChangeElement(1, null);
		oNextElement      = oSearchEngine.GetFoundedElement();
		if (null !== oNextElement && oNextElement === oSearchEngine.GetCurrentElement())
		{
			var arrNextChangesArray = this.Changes[oNextElement.GetId()];
			if (arrNextChangesArray && arrNextChangesArray.length > 0)
			{
				if (oNextElement instanceof Paragraph)
				{
					var ParaContentPos = oNextElement.Get_ParaContentPos(oNextElement.IsSelectionUse(), true);
					for (var nChangeIndex = 0, nCount = arrNextChangesArray.length; nChangeIndex < nCount; ++nChangeIndex)
					{
						var ChangeEndPos = arrNextChangesArray[nChangeIndex].get_EndPos();
						if (ParaContentPos.Compare(ChangeEndPos) <= 0)
						{
							this.CurChange  = arrNextChangesArray[nChangeIndex];
							this.CurElement = oNextElement;
							return this.CurChange;
						}
					}
				}
				else if (oNextElement instanceof CTable && oNextElement.IsCellSelection())
				{
					var arrSelectedCells = oNextElement.GetSelectionArray();
					if (arrSelectedCells.length > 0)
					{
						var nTableRow = arrSelectedCells[0].Row;
						for (var nChangeIndex = 0, nCount = arrNextChangesArray.length; nChangeIndex < nCount; ++nChangeIndex)
						{
							var nStartRow = arrNextChangesArray[nChangeIndex].get_StartPos();
							if (nTableRow <= nStartRow)
							{
								this.CurChange  = arrNextChangesArray[nChangeIndex];
								this.CurElement = oNextElement;
								return this.CurChange;
							}
						}
					}
				}

				oNextElement = this.LogicDocument.GetRevisionsChangeElement(1, oNextElement);
			}
		}
	}

	if (null !== oNextElement)
	{
		var arrNextChangesArray = this.Changes[oNextElement.GetId()];
		if (arrNextChangesArray && arrNextChangesArray.length > 0)
		{
			this.CurChange  = arrNextChangesArray[0];
			this.CurElement = oNextElement;
			return this.CurChange;
		}
	}

	if (null !== oInitialCurChange && null !== oInitialCurElement)
	{
		this.CurChange  = oInitialCurChange;
		this.CurElement = oInitialCurElement;
		return oInitialCurChange;
	}

	this.CurChange  = null;
	this.CurElement = null;
	return null;
};
/**
 * Ищем следующее изменение
 * @returns {?CRevisionsChange}
 */
CTrackRevisionsManager.prototype.GetPrevChange = function()
{
	if (this.CurChange && this.CurChange.IsComplexChange())
	{
		var arrChanges = this.CurChange.GetSimpleChanges();

		this.CurChange  = null;
		this.CurElement = null;

		if (arrChanges.length > 0)
		{
			this.CurChange  = arrChanges[0];
			this.CurElement = this.CurChange.GetElement();

			if (!this.CurElement || !this.Changes[this.CurElement.GetId()])
			{
				this.CurChange  = null;
				this.CurElement = null;
			}
		}
	}

	var oChange = this.private_GetPrevChange();
	if (oChange && oChange.IsMove() && !oChange.IsComplexChange())
	{
		oChange        = this.CollectMoveChange(oChange);
		this.CurChange = oChange;
	}

	return oChange;
};
CTrackRevisionsManager.prototype.private_GetPrevChange = function()
{
	var oInitialCurChange  = this.CurChange;
	var oInitialCurElement = this.CurElement;

	var oPrevElement = null;
	if (null !== this.CurChange && null !== this.CurElement)
	{
		var arrChangesArray = this.Changes[this.CurElement.GetId()];
		var nChangeIndex    = -1;
		for (var nIndex = 0, nCount = arrChangesArray.length; nIndex < nCount; ++nIndex)
		{
			if (this.CurChange === arrChangesArray[nIndex])
			{
				nChangeIndex = nIndex;
				break;
			}
		}

		if (-1 !== nChangeIndex && nChangeIndex > 0)
		{
			this.CurChange = arrChangesArray[nChangeIndex - 1];
			return this.CurChange;
		}

		oPrevElement = this.LogicDocument.GetRevisionsChangeElement(-1, this.CurElement);
	}
	else
	{
		var SearchEngine = this.LogicDocument.private_GetRevisionsChangeElement(-1, null);
		oPrevElement     = SearchEngine.GetFoundedElement();
		if (null !== oPrevElement && oPrevElement === SearchEngine.GetCurrentElement())
		{
			var arrPrevChangesArray = this.Changes[oPrevElement.GetId()];
			if (undefined !== arrPrevChangesArray && arrPrevChangesArray.length > 0)
			{
				if (oPrevElement instanceof Paragraph)
				{
					var ParaContentPos = oPrevElement.Get_ParaContentPos(oPrevElement.IsSelectionUse(), true);
					for (var ChangeIndex = arrPrevChangesArray.length - 1; ChangeIndex >= 0; ChangeIndex--)
					{
						var ChangeStartPos = arrPrevChangesArray[ChangeIndex].get_StartPos();
						if (ParaContentPos.Compare(ChangeStartPos) >= 0)
						{
							this.CurChange  = arrPrevChangesArray[ChangeIndex];
							this.CurElement = oPrevElement;
							return this.CurChange;
						}
					}
				}
				else if (oPrevElement instanceof CTable && oPrevElement.IsCellSelection())
				{
					var arrSelectedCells = oPrevElement.GetSelectionArray();
					if (arrSelectedCells.length > 0)
					{
						var nTableRow = arrSelectedCells[0].Row;
						for (var nChangeIndex = arrPrevChangesArray.length - 1; nChangeIndex >= 0; --nChangeIndex)
						{
							var nStartRow = arrPrevChangesArray[nChangeIndex].get_StartPos();
							if (nTableRow >= nStartRow)
							{
								this.CurChange  = arrPrevChangesArray[nChangeIndex];
								this.CurElement = oPrevElement;
								return this.CurChange;
							}
						}
					}
				}

				oPrevElement = this.LogicDocument.GetRevisionsChangeElement(-1, oPrevElement);
			}
		}
	}

	if (null !== oPrevElement)
	{
		var arrPrevChangesArray = this.Changes[oPrevElement.GetId()];
		if (undefined !== arrPrevChangesArray && arrPrevChangesArray.length > 0)
		{
			this.CurChange  = arrPrevChangesArray[arrPrevChangesArray.length - 1];
			this.CurElement = oPrevElement;
			return this.CurChange;
		}
	}

	if (null !== oInitialCurChange && null !== oInitialCurElement)
	{
		this.CurChange  = oInitialCurChange;
		this.CurElement = oInitialCurElement;
		return oInitialCurChange;
	}

	this.CurChange  = null;
	this.CurElement = null;
	return null;
};
/**
 * Проверяем есть ли непримененные изменения в документе
 * @returns {boolean}
 */
CTrackRevisionsManager.prototype.Have_Changes = function()
{
	var oTableId = this.LogicDocument ? this.LogicDocument.GetTableId() : null;

	for (var sElementId in this.Changes)
	{
		var oElement = oTableId ? oTableId.Get_ById(sElementId) : null;

		if (!oElement || !oElement.Is_UseInDocument || !oElement.Is_UseInDocument())
			continue;

		if (this.Changes[sElementId].length > 0)
			return true;
	}

	return false;
};
/**
 * Проверяем есть ли изменения, сделанные другими пользователями
 * @returns {boolean}
 */
CTrackRevisionsManager.prototype.HaveOtherUsersChanges = function()
{
	var sUserId = this.LogicDocument.GetUserId(false);
	for (var sParaId in this.Changes)
	{
		var oParagraph = AscCommon.g_oTableId.Get_ById(sParaId);
		if (!oParagraph || !oParagraph.Is_UseInDocument())
			continue;

		for (var nIndex = 0, nCount = this.Changes[sParaId].length; nIndex < nCount; ++nIndex)
		{
			var oChange = this.Changes[sParaId][nIndex];
			if (oChange.get_UserId() !== sUserId)
				return true;
		}
	}

	return false;
};
CTrackRevisionsManager.prototype.ClearCurrentChange = function()
{
    this.CurChange  = null;
    this.CurElement = null;
};
CTrackRevisionsManager.prototype.SetCurrentChange = function(oCurChange)
{
	if (oCurChange)
	{
		this.CurChange  = oCurChange;
		this.CurElement = oCurChange.GetElement();
	}
};
CTrackRevisionsManager.prototype.Get_CurrentChangeParagraph = function()
{
    return this.CurElement;
};
CTrackRevisionsManager.prototype.Get_CurrentChange = function()
{
    return this.CurChange;
};
CTrackRevisionsManager.prototype.Clear_VisibleChanges = function()
{
	if (this.VisibleChanges.length > 0)
	{
		var oEditorApi = this.LogicDocument.Get_Api();
		oEditorApi.sync_BeginCatchRevisionsChanges();
		oEditorApi.sync_EndCatchRevisionsChanges();
	}

    this.VisibleChanges = [];
};
/**
 * Добавляем изменение, видимое в текущей позиции
 * @param oChange
 */
CTrackRevisionsManager.prototype.AddVisibleChange = function(oChange)
{
	if (this.CurChange)
		return;

	if (oChange && c_oAscRevisionsChangeType.MoveMark === oChange.get_Type())
		return;

	if (oChange.IsMove() && !oChange.IsComplexChange())
		oChange = this.CollectMoveChange(oChange);

	for (var nIndex = 0, nCount = this.VisibleChanges.length; nIndex < nCount; ++nIndex)
	{
		var oVisChange = this.VisibleChanges[nIndex];
		if (oVisChange.IsComplexChange() && !oChange.IsComplexChange())
		{
			var arrSimpleChanges = oVisChange.GetSimpleChanges();
			for (var nSimpleIndex = 0, nSimpleCount = arrSimpleChanges.length; nSimpleIndex < nSimpleCount; ++nSimpleIndex)
			{
				if (arrSimpleChanges[nSimpleIndex] === oChange)
					return;
			}
		}
		else if (!oVisChange.IsComplexChange() && oChange.IsComplexChange())
		{
			var arrSimpleChanges = oChange.GetSimpleChanges();
			for (var nSimpleIndex = 0, nSimpleCount = arrSimpleChanges.length; nSimpleIndex < nSimpleCount; ++nSimpleIndex)
			{
				if (arrSimpleChanges[nSimpleIndex] === oVisChange)
				{
					this.VisibleChanges.splice(nIndex, 1);
					nCount--;
					nIndex--;
					break;
				}
			}
		}
		else if (oVisChange.IsComplexChange() && oChange.IsComplexChange())
		{
			var arrVisSC    = oVisChange.GetSimpleChanges();
			var arrChangeSC = oChange.GetSimpleChanges();

			var isEqual = false;
			if (arrVisSC.length === arrChangeSC.length)
			{
				isEqual = true;
				for (var nSimpleIndex = 0, nSimplesCount = arrVisSC.length; nSimpleIndex < nSimplesCount; ++nSimpleIndex)
				{
					if (arrVisSC[nSimpleIndex] !== arrChangeSC[nSimpleIndex])
					{
						isEqual = false;
						break;
					}
				}
			}

			if (isEqual)
				return;
		}
		else if (oChange === oVisChange)
		{
			return;
		}
	}

    this.VisibleChanges.push(oChange);
};
CTrackRevisionsManager.prototype.Get_VisibleChanges = function()
{
    return this.VisibleChanges;
};
CTrackRevisionsManager.prototype.BeginCollectChanges = function(bSaveCurrentChange)
{
    if (true === this.private_HaveParasToCheck())
        return;

	this.OldVisibleChanges = this.VisibleChanges;
	this.VisibleChanges = [];

    if (true !== bSaveCurrentChange)
	{
		this.ClearCurrentChange();
	}
	else if (this.CurElement && this.CurChange)
	{
		var oSelectionBounds = this.CurElement.GetSelectionBounds();

		var oBounds = oSelectionBounds.Direction > 0 ? oSelectionBounds.Start : oSelectionBounds.End;

		if (oBounds)
		{
			var X = this.LogicDocument.Get_PageLimits(oBounds.Page).XLimit;
			this.CurChange.put_InternalPos(X, oBounds.Y, oBounds.Page);
			this.VisibleChanges.push(this.CurChange);
		}
	}
};
CTrackRevisionsManager.prototype.EndCollectChanges = function(oEditor)
{
    if (true === this.private_HaveParasToCheck())
        return;

    if (null !== this.CurChange)
        this.VisibleChanges = [this.CurChange];

    var bMove = false;
    var bChange = false;

    var Len = this.VisibleChanges.length;
    if (this.OldVisibleChanges.length !== Len)
    {
        bChange = true;
    }
    else if (0 !== Len)
    {
        for (var ChangeIndex = 0; ChangeIndex < Len; ChangeIndex++)
        {
            if (this.OldVisibleChanges[ChangeIndex] !== this.VisibleChanges[ChangeIndex])
            {
                bChange = true;
                break;
            }
            else if (true !== this.VisibleChanges[ChangeIndex].ComparePrevPosition())
            {
                bMove = true;
            }
        }
    }

    if (true === bChange)
    {
        oEditor.sync_BeginCatchRevisionsChanges();

        if (Len > 0)
        {
            var Pos = this.private_GetVisibleChangesXY();
            for (var ChangeIndex = 0; ChangeIndex < Len; ChangeIndex++)
            {
                var Change = this.VisibleChanges[ChangeIndex];
                Change.put_XY(Pos.X, Pos.Y);
                oEditor.sync_AddRevisionsChange(Change);
            }
        }
        oEditor.sync_EndCatchRevisionsChanges();
    }
    else if (true === bMove)
    {
        this.Update_VisibleChangesPosition(oEditor);
    }
};
CTrackRevisionsManager.prototype.Update_VisibleChangesPosition = function(oEditor)
{
    if (this.VisibleChanges.length > 0)
    {
        var Pos = this.private_GetVisibleChangesXY();
        oEditor.sync_UpdateRevisionsChangesPosition(Pos.X, Pos.Y);
    }
};
CTrackRevisionsManager.prototype.private_GetVisibleChangesXY = function()
{
    if (this.VisibleChanges.length > 0)
    {
        var Change = this.VisibleChanges[0];
        var Change_X       = Change.get_InternalPosX();
        var Change_Y       = Change.get_InternalPosY();
        var Change_PageNum = Change.get_InternalPosPageNum();
        var Change_Para    = Change.get_Paragraph();
        if (Change_Para && Change_Para.DrawingDocument)
        {
            var TextTransform = (Change_Para ? Change_Para.Get_ParentTextTransform() : undefined);
            if (TextTransform)
                Change_Y = TextTransform.TransformPointY(Change_X, Change_Y);

            var Coords = Change_Para.DrawingDocument.ConvertCoordsToCursorWR(Change_X, Change_Y, Change_PageNum);
            return {X : Coords.X, Y : Coords.Y};
        }
    }

    return {X : 0, Y : 0};
};
CTrackRevisionsManager.prototype.Get_AllChangesLogicDocuments = function()
{
	this.CompleteTrackChanges();
    var LogicDocuments = {};

    for (var ParaId in this.Changes)
    {
        var Para = g_oTableId.Get_ById(ParaId);
        if (Para && Para.Get_Parent())
        {
            LogicDocuments[Para.Get_Parent().Get_Id()] = true;
        }
    }

    return LogicDocuments;
};
CTrackRevisionsManager.prototype.GetChangeRelatedParagraphs = function(oChange, bAccept)
{
	var oRelatedParas = {};

	if (oChange.IsComplexChange())
	{
		var arrSimpleChanges = oChange.GetSimpleChanges();
		for (var nIndex = 0, nCount = arrSimpleChanges.length; nIndex < nCount; ++nIndex)
		{
			this.private_GetChangeRelatedParagraphs(arrSimpleChanges[nIndex], bAccept, oRelatedParas);
		}
	}
	else
	{
		this.private_GetChangeRelatedParagraphs(oChange, bAccept, oRelatedParas);
	}

    return this.private_ConvertParagraphsObjectToArray(oRelatedParas);
};
CTrackRevisionsManager.prototype.private_GetChangeRelatedParagraphs = function(oChange, bAccept, oRelatedParas)
{
	if (oChange)
	{
		var nType    = oChange.GetType();
		var oElement = oChange.GetElement();
		if (oElement && oElement.IsUseInDocument())
		{
			oRelatedParas[oElement.GetId()] = true;
			if ((c_oAscRevisionsChangeType.ParaAdd === nType && true !== bAccept) || (c_oAscRevisionsChangeType.ParaRem === nType && true === bAccept))
			{
				var oLogicDocument = oElement.GetParent();
				var nParaIndex     = oElement.GetIndex();

				if (oLogicDocument && -1 !== nParaIndex)
				{
					if (nParaIndex < oLogicDocument.GetElementsCount() - 1)
					{
						var oNextElement = oLogicDocument.GetElement(nParaIndex + 1);
						if (oNextElement && oNextElement.IsParagraph())
							oRelatedParas[oNextElement.GetId()] = true;
					}
				}
			}
		}
	}
};
CTrackRevisionsManager.prototype.private_ConvertParagraphsObjectToArray = function(ParagraphsObject)
{
    var ParagraphsArray = [];
    for (var ParaId in ParagraphsObject)
    {
        var Para = g_oTableId.Get_ById(ParaId);
        if (null !== Para)
        {
            ParagraphsArray.push(Para);
        }
    }
    return ParagraphsArray;
};
CTrackRevisionsManager.prototype.Get_AllChangesRelatedParagraphs = function(bAccept)
{
    var RelatedParas = {};
    for (var ParaId in this.Changes)
    {
        for (var ChangeIndex = 0, ChangesCount = this.Changes[ParaId].length; ChangeIndex < ChangesCount; ++ChangeIndex)
        {
            var Change = this.Changes[ParaId][ChangeIndex];
            this.private_GetChangeRelatedParagraphs(Change, bAccept, RelatedParas);
        }
    }
    return this.private_ConvertParagraphsObjectToArray(RelatedParas);
};
CTrackRevisionsManager.prototype.Get_AllChangesRelatedParagraphsBySelectedParagraphs = function(SelectedParagraphs, bAccept)
{
    var RelatedParas = {};
    for (var ParaIndex = 0, ParasCount = SelectedParagraphs.length; ParaIndex < ParasCount; ++ParaIndex)
    {
        var Para = SelectedParagraphs[ParaIndex];
        var ParaId = Para.Get_Id();
        if (this.Changes[ParaId] && this.Changes[ParaId].length > 0)
        {
            RelatedParas[ParaId] = true;
            if (true === Para.Selection_CheckParaEnd())
            {
                var CheckNext = false;
                for (var ChangeIndex = 0, ChangesCount = this.Changes[ParaId].length; ChangeIndex < ChangesCount; ++ChangeIndex)
                {
                    var ChangeType = this.Changes[ParaId][ChangeIndex].get_Type();
                    if ((c_oAscRevisionsChangeType.ParaAdd === ChangeType && true !== bAccept) || (c_oAscRevisionsChangeType.ParaRem === ChangeType && true === bAccept))
                    {
                        CheckNext = true;
                        break;
                    }
                }

                if (true === CheckNext)
                {
                    var NextElement = Para.Get_DocumentNext();
                    if (null !== NextElement && type_Paragraph === NextElement.Get_Type())
                    {
                        RelatedParas[NextElement.Get_Id()] = true;
                    }
                }
            }
        }
    }
    return this.private_ConvertParagraphsObjectToArray(RelatedParas);
};
CTrackRevisionsManager.prototype.private_HaveParasToCheck = function()
{
    for (var sId in this.CheckElements)
    {
        var oElement = g_oTableId.Get_ById(sId);
        if (oElement && (oElement instanceof Paragraph || oElement instanceof CTable) && oElement.Is_UseInDocument())
            return true;
    }

    return false;
};
CTrackRevisionsManager.prototype.Get_AllChanges = function()
{
	this.CompleteTrackChanges();
	return this.Changes;
};
CTrackRevisionsManager.prototype.private_IsAllParagraphsChecked = function()
{
	for (var sId in this.CheckElements)
	{
		return false;
	}

	return true;
};
/**
 * Завершаем проверку всех элементов на наличие рецензирования
 */
CTrackRevisionsManager.prototype.CompleteTrackChanges = function()
{
	while (!this.private_IsAllParagraphsChecked())
		this.ContinueTrackRevisions();
};
/**
 * Завершаем проверку рецензирования для заданных элементов
 * @param arrElements
 * @returns {boolean}
 */
CTrackRevisionsManager.prototype.CompleteTrackChangesForElements = function(arrElements)
{
	var isChecked = false;
	for (var nIndex = 0, nCount = arrElements.length; nIndex < nCount; ++nIndex)
	{
		var sElementId = arrElements[nIndex].GetId();
		if (this.private_TrackChangesForSingleElement(sElementId))
			isChecked = true;
	}

	return isChecked;
};
CTrackRevisionsManager.prototype.private_TrackChangesForSingleElement = function(sId)
{
	if (this.CheckElements[sId])
	{
		delete this.CheckElements[sId];
		var oElement = g_oTableId.Get_ById(sId);
		if (oElement && (oElement instanceof Paragraph || oElement instanceof CTable) && oElement.Is_UseInDocument())
		{
			var isHaveChanges = !!this.Changes[sId];

			this.private_RemoveChangeObject(sId);
			oElement.CheckRevisionsChanges(this);

			if (!isHaveChanges && !this.Changes[sId])
				return false;

			return true;
		}
	}

	return false;
};
/**
 * При чтении файла обновляем Id перетаскиваний в рецензировании
 * @param sMoveId
 */
CTrackRevisionsManager.prototype.UpdateMoveId = function(sMoveId)
{
	if (0 === sMoveId.indexOf("move"))
	{
		var nId = parseInt(sMoveId.substring(4));
		if (!isNaN(nId))
			this.MoveId = Math.max(this.MoveId, nId);
	}
};
/**
 * Возвращаем новый идентификатор перемещений
 * @returns {string}
 */
CTrackRevisionsManager.prototype.GetNewMoveId = function()
{
	this.MoveId++;
	return "move" + this.MoveId;
};
CTrackRevisionsManager.prototype.RegisterMoveMark = function(oMark)
{
	if (this.LogicDocument && this.LogicDocument.PrintSelection)
		return;

	if (!oMark)
		return;

	var sMarkId = oMark.GetMarkId();
	var isFrom  = oMark.IsFrom();
	var isStart = oMark.IsStart();

	this.UpdateMoveId(sMarkId);

	if (!this.MoveMarks[sMarkId])
	{
		this.MoveMarks[sMarkId] = {

			From : {
				Start : null,
				End   : null
			},

			To : {
				Start : null,
				End   : null
			}
		};
	}

	if (isFrom)
	{
		if (isStart)
			this.MoveMarks[sMarkId].From.Start = oMark;
		else
			this.MoveMarks[sMarkId].From.End = oMark;
	}
	else
	{
		if (isStart)
			this.MoveMarks[sMarkId].To.Start = oMark;
		else
			this.MoveMarks[sMarkId].To.End = oMark;
	}
};
CTrackRevisionsManager.prototype.UnregisterMoveMark = function(oMark)
{
	if (this.LogicDocument && this.LogicDocument.PrintSelection)
		return;

	if (!oMark)
		return;

	var sMarkId = oMark.GetMarkId();
	delete this.MoveMarks[sMarkId];

	// TODO: Возможно тут нужно проделать дополнительные действия
};
CTrackRevisionsManager.prototype.private_CheckChangeObject = function(sId)
{
	var oElement = AscCommon.g_oTableId.Get_ById(sId);
	if (!oElement)
		return;

	if (!this.Changes[sId])
		this.Changes[sId] = [];

	var nDeletePosition = -1;
	for (var nIndex = 0, nCount = this.ChangesOutline.length; nIndex < nCount; ++nIndex)
	{
		if (this.ChangesOutline[nIndex].GetId() === sId)
		{
			nDeletePosition = nIndex;
			break;
		}
	}

	var oDocPos = oElement.GetDocumentPositionFromObject();
	if (!oDocPos)
		return;

	var nAddPosition = -1;
	for (var nIndex = 0, nCount = this.ChangesOutline.length; nIndex < nCount; ++nIndex)
	{
		var oTempDocPos = this.ChangesOutline[nIndex].GetDocumentPositionFromObject();

		if (this.private_CompareDocumentPositions(oDocPos, oTempDocPos) < 0)
		{
			nAddPosition = nIndex;
			break;
		}
	}

	if (-1 === nAddPosition)
		nAddPosition = this.ChangesOutline.length;

	if (nAddPosition === nDeletePosition || (-1 !== nAddPosition && -1 !== nDeletePosition && nDeletePosition === nAddPosition - 1))
		return;

	if (-1 !== nDeletePosition)
	{
		this.ChangesOutline.splice(nDeletePosition, 1);

		if (nAddPosition > nDeletePosition)
			nAddPosition--;
	}

	this.ChangesOutline.splice(nAddPosition, 0, oElement);
};
CTrackRevisionsManager.prototype.private_CompareDocumentPositions = function(oDocPos1, oDocPos2)
{
	if (oDocPos1.Class !== oDocPos2.Class)
	{
		// TODO: Здесь нужно доработать сравнение позиций, когда они из разных частей документа
		if (oDocPos1.Class instanceof CDocument)
			return -1;
		else if (oDocPos1.Class instanceof CDocument)
			return 1;
		else
			return 1;
	}

	for (var nIndex = 0, nCount = oDocPos1.length; nIndex < nCount; ++nIndex)
	{
		if (oDocPos2.length <= nIndex)
			return 1;

		if (oDocPos1[nIndex].Position < oDocPos2[nIndex].Position)
			return -1;
		else if (oDocPos1[nIndex].Position > oDocPos2[nIndex].Position)
			return 1;
	}

	return 0;
};
CTrackRevisionsManager.prototype.private_RemoveChangeObject = function(sId)
{
	if (this.Changes[sId])
		delete this.Changes[sId];

	for (var nIndex = 0, nCount = this.ChangesOutline.length; nIndex < nCount; ++nIndex)
	{
		if (this.ChangesOutline[nIndex].GetId() === sId)
		{
			this.ChangesOutline.splice(nIndex, 1);
			return;
		}
	}
};
/**
 * Собираем изменение связанное с переносом
 * @param {CRevisionsChange} oChange
 * @returns {CRevisionsChange}
 */
CTrackRevisionsManager.prototype.CollectMoveChange = function(oChange)
{
	var isFrom = c_oAscRevisionsChangeType.TextRem === oChange.GetType() || c_oAscRevisionsChangeType.ParaRem === oChange.GetType() || (c_oAscRevisionsChangeType.MoveMark === oChange.GetType() && oChange.GetValue().IsFrom());

	var nStartIndex  = -1;
	var oStartChange = null;

	var oElement = oChange.GetElement();
	if (!oElement)
		return oChange;

	var nDeep = 0;
	var nSearchIndex = -1;
	for (var nIndex = 0, nCount = this.ChangesOutline.length; nIndex < nCount; ++nIndex)
	{
		if (this.ChangesOutline[nIndex] === oElement)
		{
			nSearchIndex = nIndex;
			break;
		}
	}

	if (-1 === nSearchIndex)
		return oChange;

	var isStart = false;

	for (var nIndex = nSearchIndex; nIndex >= 0; --nIndex)
	{
		var arrCurChanges = this.Changes[this.ChangesOutline[nIndex].GetId()];

		if (!arrCurChanges)
		{
			isStart = true;
			continue;
		}

		for (var nChangeIndex = arrCurChanges.length - 1; nChangeIndex >= 0; --nChangeIndex)
		{
			var oCurChange = arrCurChanges[nChangeIndex];
			if (!isStart)
			{
				if (oCurChange === oChange)
					isStart = true;
			}

			if (isStart)
			{
				var nCurChangeType = oCurChange.GetType();
				if (nCurChangeType === c_oAscRevisionsChangeType.MoveMark)
				{
					var oMoveMark = oCurChange.GetValue();
					if ((isFrom && oMoveMark.IsFrom()) || (!isFrom && !oMoveMark.IsFrom()))
					{
						if (oMoveMark.IsStart())
						{
							if (nDeep > 0)
							{
								nDeep--;
							}
							else if (nDeep === 0)
							{
								nStartIndex  = nIndex;
								oStartChange = oCurChange;
								break;
							}
						}
						else if (oCurChange !== oChange)
						{
							nDeep++;
						}
					}
				}
			}
		}

		if (oStartChange)
			break;

		isStart = true;
	}

	if (!oStartChange || -1 === nStartIndex)
		return oChange;

	var sValue     = "";
	var arrChanges = [oStartChange];

	isStart = false;
	nDeep   = 0;
	var isEnd = false;
	for (var nIndex = nStartIndex, nCount = this.ChangesOutline.length; nIndex < nCount; ++nIndex)
	{
		var arrCurChanges = this.Changes[this.ChangesOutline[nIndex].GetId()];
		for (var nChangeIndex = 0, nChangesCount = arrCurChanges.length; nChangeIndex < nChangesCount; ++nChangeIndex)
		{
			var oCurChange = arrCurChanges[nChangeIndex];
			if (!isStart)
			{
				if (oCurChange === oStartChange)
					isStart = true;
			}
			else
			{
				var nCurChangeType = oCurChange.GetType();
				if (isFrom)
				{
					if (c_oAscRevisionsChangeType.TextRem === nCurChangeType || c_oAscRevisionsChangeType.ParaRem === nCurChangeType)
					{
						if (0 === nDeep)
						{
							sValue += c_oAscRevisionsChangeType.TextRem === nCurChangeType ? oCurChange.GetValue() : "\n";
							arrChanges.push(oCurChange);
						}
					}
					else if (c_oAscRevisionsChangeType.MoveMark === nCurChangeType && oCurChange.GetValue().IsFrom())
					{
						if (oCurChange.GetValue().IsStart())
						{
							nDeep++;
						}
						else if (nDeep > 0)
						{
							nDeep--;
						}
						else
						{
							arrChanges.push(oCurChange);
							isEnd = true;
							break;
						}
					}
				}
				else
				{
					if (c_oAscRevisionsChangeType.TextAdd === nCurChangeType || c_oAscRevisionsChangeType.ParaAdd === nCurChangeType)
					{
						if (0 === nDeep)
						{
							sValue += c_oAscRevisionsChangeType.TextAdd === nCurChangeType ? oCurChange.GetValue() : "\n";
							arrChanges.push(oCurChange);
						}
					}
					else if (c_oAscRevisionsChangeType.MoveMark === nCurChangeType && !oCurChange.GetValue().IsFrom())
					{
						if (oCurChange.GetValue().IsStart())
						{
							nDeep++;
						}
						else if (nDeep > 0)
						{
							nDeep--;
						}
						else
						{
							arrChanges.push(oCurChange);
							isEnd = true;
							break;
						}
					}
				}
			}
		}

		if (!isStart)
			return oChange;

		if (isEnd)
			break;
	}

	var sMoveId = oStartChange.GetValue().GetMarkId();
	var isDown  = null;

	for (var nIndex = 0, nCount = this.ChangesOutline.length; nIndex < nCount; ++nIndex)
	{
		var arrCurChanges = this.Changes[this.ChangesOutline[nIndex].GetId()];
		if (!arrCurChanges)
			continue;

		for (var nChangeIndex = 0, nChangesCount = arrCurChanges.length; nChangeIndex < nChangesCount; ++nChangeIndex)
		{
			var oCurChange = arrCurChanges[nChangeIndex];
			if (c_oAscRevisionsChangeType.MoveMark === oCurChange.GetType())
			{
				var oMark = oCurChange.GetValue();
				if (sMoveId === oMark.GetMarkId())
				{
					if (oMark.IsFrom())
						isDown = true;
					else
						isDown = false;

					break;
				}

			}
		}

		if (null !== isDown)
			break;
	}

	if (!isEnd || null === isDown)
		return oChange;

	var oMoveChange = new CRevisionsChange();
	oMoveChange.SetType(isFrom ? c_oAscRevisionsChangeType.TextRem : c_oAscRevisionsChangeType.TextAdd);
	oMoveChange.SetValue(sValue);
	oMoveChange.SetElement(oStartChange.GetElement());
	oMoveChange.SetUserId(oStartChange.GetUserId());
	oMoveChange.SetUserName(oStartChange.GetUserName());
	oMoveChange.SetDateTime(oStartChange.GetDateTime());
	oMoveChange.SetMoveType(isFrom ? Asc.c_oAscRevisionsMove.MoveFrom : Asc.c_oAscRevisionsMove.MoveTo);
	oMoveChange.SetSimpleChanges(arrChanges);
	oMoveChange.SetMoveId(sMoveId);
	oMoveChange.SetMovedDown(isDown);
	oMoveChange.SetXY(oChange.GetX(), oChange.GetY());
	oMoveChange.SetInternalPos(oChange.GetInternalPosX(), oChange.GetInternalPosY(), oChange.GetInternalPosPageNum());
	return oMoveChange;
};
/**
 * Получаем массив всех изменений связанных с заданным переносом
 * @param {string} sMoveId
 * @returns {CRevisionsChange[]}
 */
CTrackRevisionsManager.prototype.GetAllMoveChanges = function(sMoveId)
{
	var oStartFromChange = null;
	var oStartToChange   = null;

	for (var sElementId in this.Changes)
	{
		var arrElementChanges = this.Changes[sElementId];
		for (var nChangeIndex = 0, nChangesCount = arrElementChanges.length; nChangeIndex < nChangesCount; ++nChangeIndex)
		{
			var oCurChange = arrElementChanges[nChangeIndex];
			if (c_oAscRevisionsChangeType.MoveMark === oCurChange.GetType() && sMoveId === oCurChange.GetValue().GetMarkId() && oCurChange.GetValue().IsStart())
			{
				if (oCurChange.GetValue().IsFrom())
					oStartFromChange = oCurChange;
				else
					oStartToChange = oCurChange;
			}
		}

		if (oStartFromChange && oStartToChange)
			break;
	}

	if (!oStartFromChange || !oStartToChange)
		return {From : [], To : []};

	return {
		From : this.CollectMoveChange(oStartFromChange).GetSimpleChanges(),
		To   : this.CollectMoveChange(oStartToChange).GetSimpleChanges()
	};
};
/**
 * Начинаем процесс обработки(принятия или отклонения) перетаскивания текста
 * @param sMoveId {string} идентификатор перетаскивания
 * @param sUserId {string} идентификатор пользователя
 * @returns {CTrackRevisionsMoveProcessEngine}
 */
CTrackRevisionsManager.prototype.StartProcessReviewMove = function(sMoveId, sUserId)
{
	return (this.ProcessMove = new CTrackRevisionsMoveProcessEngine(sMoveId, sUserId));
};
/**
 * Завершаем процесс обработки перетаскивания текста
 */
CTrackRevisionsManager.prototype.EndProcessReviewMove = function()
{
	// TODO: Здесь нужно сделать обработку MovesToDelete

	this.ProcessMove = null;
};
/**
 * Проверям, запущен ли процесс обрабокти перетаскивания текста
 * @returns {?CTrackRevisionsMoveProcessEngine}
 */
CTrackRevisionsManager.prototype.GetProcessTrackMove = function()
{
	return this.ProcessMove;
};
/**
 * Получаем метки переноса
 * @param sMarkId
 */
CTrackRevisionsManager.prototype.GetMoveMarks = function(sMarkId)
{
	return this.MoveMarks[sMarkId];
};
/**
 * Получаем элементарное изменение связанное с заданным переносом, относящееся к метке переноса
 * @param {string} sMoveId
 * @param {boolean} isFrom
 * @param {boolean} isStart
 */
CTrackRevisionsManager.prototype.GetMoveMarkChange = function(sMoveId, isFrom, isStart)
{
	this.CompleteTrackChanges();

	var oMoveChanges = this.GetAllMoveChanges(sMoveId);
	var arrChanges   = isFrom ? oMoveChanges.From : oMoveChanges.To;

	for (var nIndex = 0, nCount = arrChanges.length; nIndex < nCount; ++nIndex)
	{
		var oChange = arrChanges[nIndex];
		if (Asc.c_oAscRevisionsChangeType.MoveMark === oChange.GetType())
		{
			var oMark = oChange.GetValue();
			if (oMark.IsFrom() === isFrom && oMark.IsStart() === isStart)
			{
				return oChange;
			}
		}
	}

	return null;
};

/**
 * Класс для обработки (принятия/отклонения) изменения связанного с переносом
 * @param sMoveId
 * @param sUserId
 * @constructor
 */
function CTrackRevisionsMoveProcessEngine(sMoveId, sUserId)
{
	this.MoveId        = sMoveId; // Идентификатор обрабаываемого переноса
	this.UserId        = sUserId; // Идентификатор пользователя, сделавшего перенос
	this.From          = false;   // Фаза обработки (обрабатываем удаленную или вставленную часть)
	this.MovesToDelete = {};      // Если в процессе обработки встретились отметки других переносов, тогда мы превратим такие переносы в обычный добавлненый/удаленный текст
}
/**
 * Меняем фазу проверки
 * @param {boolean} isFrom
 */
CTrackRevisionsMoveProcessEngine.prototype.SetFrom = function(isFrom)
{
	this.From = isFrom;
};
/**
 * Получаем индентификатор переноса
 * @returns {string}
 */
CTrackRevisionsMoveProcessEngine.prototype.GetMoveId = function()
{
	return this.MoveId;
};
/**
 * Проверяем, происходит ли сейчас обработка удаленного текста во время переноса
 * @returns {boolean}
 */
CTrackRevisionsMoveProcessEngine.prototype.IsFrom = function()
{
	return this.From;
};
/**
 * Регистрируем наличие меток другого переноса во время обработки заданного переноса
 * @param sMoveId {string}
 */
CTrackRevisionsMoveProcessEngine.prototype.RegisterOtherMove = function(sMoveId)
{
	this.MovesToDelete[sMoveId] = sMoveId;
};
/**
 * Получаем идентификатор пользователя, сделавшего перенос, который сейчас обрабатывается
 * @returns {string}
 */
CTrackRevisionsMoveProcessEngine.prototype.GetUserId = function()
{
	return this.UserId;
};


function CRevisionsChangeParagraphSearchEngine(nDirection, oCurrentElement, oTrackManager)
{
    this.TrackManager   = oTrackManager;
    this.Direction      = nDirection;
    this.CurrentElement = oCurrentElement;
    this.CurrentFound   = false;
    this.Element        = null;
}
CRevisionsChangeParagraphSearchEngine.prototype.SetCurrentFound = function()
{
    this.CurrentFound = true;
};
CRevisionsChangeParagraphSearchEngine.prototype.SetCurrentElement = function(oElement)
{
    this.CurrentElement = oElement;
};
/**
 * Нашли ли мы текущий элемент
 * @returns {boolean}
 */
CRevisionsChangeParagraphSearchEngine.prototype.IsCurrentFound = function()
{
    return this.CurrentFound;
};
CRevisionsChangeParagraphSearchEngine.prototype.GetCurrentElement = function()
{
    return this.CurrentElement;
};
CRevisionsChangeParagraphSearchEngine.prototype.SetFoundedElement = function(oElement)
{
    if (this.TrackManager.GetElementChanges(oElement.GetId()).length > 0)
        this.Element = oElement;
};
/**
 * Нашли ли мы элемент с рецензированием
 * @returns {boolean}
 */
CRevisionsChangeParagraphSearchEngine.prototype.IsFound = function()
{
    return (null !== this.Element);
};
CRevisionsChangeParagraphSearchEngine.prototype.GetFoundedElement = function()
{
    return this.Element;
};
CRevisionsChangeParagraphSearchEngine.prototype.GetDirection = function()
{
    return this.Direction;
};

function CDocumentPagePosition()
{
    this.Page   = 0;
    this.Column = 0;
}

function CDocumentNumberingInfoCounter()
{
	this.Nums    = {}; // Список Num, которые использовались. Нужно для обработки startOverride
	this.NumInfo = new Array(9);
	this.PrevLvl = -1;

	for (var nIndex = 0; nIndex < 9; ++nIndex)
		this.NumInfo[nIndex] = undefined;
}
CDocumentNumberingInfoCounter.prototype.CheckNum = function(oNum)
{
	if (this.Nums[oNum.GetId()])
		return false;

	this.Nums[oNum.GetId()] = oNum;

	return true;
};

/**
 * Класс для рассчета значение номера для нумерации заданного параграфа
 * @param oPara {Paragraph}
 * @param oNumPr {CNumPr}
 * @param oNumbering {CNumbering}
 * @constructor
 */
function CDocumentNumberingInfoEngine(oPara, oNumPr, oNumbering)
{
	this.Paragraph   = oPara;
	this.NumId       = oNumPr.NumId;
	this.Lvl         = oNumPr.Lvl !== undefined ? oNumPr.Lvl : 0;
	this.Numbering   = oNumbering;
	this.NumInfo     = new Array(this.Lvl + 1);
	this.Restart     = [-1, -1, -1, -1, -1, -1, -1, -1, -1]; // Этот параметр контролирует уровень, начиная с которого делаем рестарт для текущего уровня
	this.PrevLvl     = -1;
	this.Found       = false;
	this.AbstractNum = null;
	this.Start       = [];

	this.FinalCounter  = new CDocumentNumberingInfoCounter();
	this.SourceCounter = new CDocumentNumberingInfoCounter();

	for (var nIndex = 0; nIndex < 9; ++nIndex)
		this.NumInfo[nIndex] = undefined;

	if (!this.Numbering)
		return;

	var oNum = this.Numbering.GetNum(this.NumId);
	if (!oNum)
		return;

	var oAbstractNum = oNum.GetAbstractNum();
	if (oAbstractNum)
	{
		for (var nLvl = 0; nLvl < 9; ++nLvl)
		{
			this.Restart[nLvl] = oAbstractNum.GetLvl(nLvl).GetRestart();
			this.Start[nLvl]   = oAbstractNum.GetLvl(nLvl).GetStart() - 1;
		}
	}

	this.AbstractNum = oAbstractNum;
}

/**
 * Проверяем закончилось ли вычисление номера
 * @returns {boolean}
 * @constructor
 */
CDocumentNumberingInfoEngine.prototype.IsStop = function()
{
    return this.Found;
};
/**
 * Проверяем параграф
 * @param oPara {Paragraph}
 */
CDocumentNumberingInfoEngine.prototype.CheckParagraph = function(oPara)
{
	if (!this.Numbering)
		return;

	if (this.Paragraph === oPara)
		this.Found = true;

	var oParaNumPr     = oPara.GetNumPr();
	var oParaNumPrPrev = oPara.GetPrChangeNumPr();
	var isPrChange     = oPara.HavePrChange();

	if (undefined !== oPara.Get_SectionPr() && true === oPara.IsEmpty())
		return;

	var isEqualNumPr = false;
	if (!isPrChange
		|| (isPrChange
			&& oParaNumPr
			&& oParaNumPrPrev
			&& oParaNumPr.NumId === oParaNumPrPrev.NumId
			&& oParaNumPr.Lvl === oParaNumPrPrev.Lvl
		)
	)
	{
		isEqualNumPr = true;
	}

	if (isEqualNumPr)
	{
		if (!oParaNumPr)
			return;

		var oNum         = this.Numbering.GetNum(oParaNumPr.NumId);
		var oAbstractNum = oNum.GetAbstractNum();

		if (oAbstractNum === this.AbstractNum)
		{
			var oReviewType = oPara.GetReviewType();
			var oReviewInfo = oPara.GetReviewInfo();

			if (reviewtype_Common === oReviewType)
			{
				this.private_UpdateCounter(this.FinalCounter, oNum, oParaNumPr.Lvl);
				this.private_UpdateCounter(this.SourceCounter, oNum, oParaNumPr.Lvl);
			}
			else if (reviewtype_Add === oReviewType)
			{
				this.private_UpdateCounter(this.FinalCounter, oNum, oParaNumPr.Lvl);
			}
			else if (reviewtype_Remove === oReviewType)
			{
				if (!oReviewInfo.GetPrevAdded())
					this.private_UpdateCounter(this.SourceCounter, oNum, oParaNumPr.Lvl);
			}
		}
	}
	else
	{
		if (oParaNumPr)
		{
			var oNum         = this.Numbering.GetNum(oParaNumPr.NumId);
			var oAbstractNum = oNum.GetAbstractNum();

			if (oAbstractNum === this.AbstractNum)
			{
				var oReviewType = oPara.GetReviewType();
				var oReviewInfo = oPara.GetReviewInfo();

				if (reviewtype_Common === oReviewType)
				{
					this.private_UpdateCounter(this.FinalCounter, oNum, oParaNumPr.Lvl);
				}
				else if (reviewtype_Add === oReviewType)
				{
					this.private_UpdateCounter(this.FinalCounter, oNum, oParaNumPr.Lvl);
				}
			}
		}

		if (oParaNumPrPrev)
		{
			var oNum = this.Numbering.GetNum(oParaNumPrPrev.NumId);
			if (oNum)
			{
				var oAbstractNum = oNum.GetAbstractNum();
				if (oAbstractNum === this.AbstractNum)
				{
					var oReviewType = oPara.GetReviewType();
					var oReviewInfo = oPara.GetReviewInfo();

					if (reviewtype_Common === oReviewType)
					{
						this.private_UpdateCounter(this.SourceCounter, oNum, oParaNumPrPrev.Lvl);
					}
					else if (reviewtype_Add === oReviewType)
					{
					}
					else if (reviewtype_Remove === oReviewType)
					{
						if (!oReviewInfo.GetPrevAdded())
							this.private_UpdateCounter(this.SourceCounter, oNum, oParaNumPrPrev.Lvl);
					}
				}
			}
		}
	}
};
CDocumentNumberingInfoEngine.prototype.GetNumInfo = function(isFinal)
{
	if (false === isFinal)
		return this.SourceCounter.NumInfo;

	return this.FinalCounter.NumInfo;
};
CDocumentNumberingInfoEngine.prototype.private_UpdateCounter = function(oCounter, oNum, nParaLvl)
{
	if (-1 === oCounter.PrevLvl)
	{
		for (var nLvl = 0; nLvl < 9; ++nLvl)
		{
			oCounter.NumInfo[nLvl] = this.Start[nLvl];
		}

		for (var nLvl = oCounter.PrevLvl + 1; nLvl < nParaLvl; ++nLvl)
		{
			oCounter.NumInfo[nLvl]++;
		}
	}
	else if (nParaLvl < oCounter.PrevLvl)
	{
		for (var nLvl = 0; nLvl < 9; ++nLvl)
		{
			if (nLvl > nParaLvl && 0 !== this.Restart[nLvl] && (-1 === this.Restart[nLvl] || nParaLvl <= this.Restart[nLvl] - 1))
				oCounter.NumInfo[nLvl] = this.Start[nLvl];
		}
	}
	else if (nParaLvl > oCounter.PrevLvl)
	{
		for (var nLvl = oCounter.PrevLvl + 1; nLvl < nParaLvl; ++nLvl)
		{
			oCounter.NumInfo[nLvl]++;
		}
	}

	oCounter.NumInfo[nParaLvl]++;

	if (oCounter.CheckNum(oNum))
	{
		var nForceStart = oNum.GetStartOverride(nParaLvl);
		if (-1 !== nForceStart)
			oCounter.NumInfo[nParaLvl] = nForceStart;
	}

	for (var nIndex = nParaLvl - 1; nIndex >= 0; --nIndex)
	{
		if (undefined === oCounter.NumInfo[nIndex] || 0 === oCounter.NumInfo[nIndex])
			oCounter.NumInfo[nIndex] = 1;
	}

	oCounter.PrevLvl = nParaLvl;
};

function CDocumentFootnotesRangeEngine(bExtendedInfo)
{
	this.m_oFirstFootnote = null; // Если не задана ищем с начала
	this.m_oLastFootnote  = null; // Если не задана ищем до конца

	this.m_arrFootnotes  = [];
	this.m_bForceStop    = false;

	this.m_bExtendedInfo = (true === bExtendedInfo ? true : false);
	this.m_arrParagraphs = [];
	this.m_oCurParagraph = null;
	this.m_arrRuns       = [];
	this.m_arrRefs       = [];
}
CDocumentFootnotesRangeEngine.prototype.Init = function(oFirstFootnote, oLastFootnote)
{
	this.m_oFirstFootnote = oFirstFootnote ? oFirstFootnote : null;
	this.m_oLastFootnote  = oLastFootnote ? oLastFootnote : null;
};
CDocumentFootnotesRangeEngine.prototype.Add = function(oFootnote, oFootnoteRef, oRun)
{
	if (!oFootnote || true === this.m_bForceStop)
		return;

	if (this.m_arrFootnotes.length <= 0 && null !== this.m_oFirstFootnote)
	{
		if (this.m_oFirstFootnote === oFootnote)
			this.private_AddFootnote(oFootnote, oFootnoteRef, oRun);
		else if (this.m_oLastFootnote === oFootnote)
			this.m_bForceStop = true;
	}
	else if (this.m_arrFootnotes.length >= 1 && null !== this.m_oLastFootnote)
	{
		if (this.m_oLastFootnote !== this.m_arrFootnotes[this.m_arrFootnotes.length - 1])
			this.private_AddFootnote(oFootnote, oFootnoteRef, oRun);
	}
	else
	{
		this.private_AddFootnote(oFootnote, oFootnoteRef, oRun);
	}
};
CDocumentFootnotesRangeEngine.prototype.IsRangeFull = function()
{
	if (true === this.m_bForceStop)
		return true;

	if (null !== this.m_oLastFootnote && this.m_arrFootnotes.length >= 1 && this.m_oLastFootnote === this.m_arrFootnotes[this.m_arrFootnotes.length - 1])
		return true;

	return false;
};
CDocumentFootnotesRangeEngine.prototype.GetRange = function()
{
	return this.m_arrFootnotes;
};
CDocumentFootnotesRangeEngine.prototype.GetParagraphs = function()
{
	return this.m_arrParagraphs;
};
CDocumentFootnotesRangeEngine.prototype.SetCurrentParagraph = function(oParagraph)
{
	this.m_oCurParagraph = oParagraph;
};
CDocumentFootnotesRangeEngine.prototype.private_AddFootnote = function(oFootnote, oFootnoteRef, oRun)
{
	this.m_arrFootnotes.push(oFootnote);

	if (true === this.m_bExtendedInfo)
	{
		this.m_arrRuns.push(oRun);
		this.m_arrRefs.push(oFootnoteRef);

		// Добавляем в общий список используемых параграфов
		var nCount = this.m_arrParagraphs.length;
		if (nCount <= 0 || this.m_arrParagraphs[nCount - 1] !== this.m_oCurParagraph)
			this.m_arrParagraphs[nCount] = this.m_oCurParagraph;
	}
};
CDocumentFootnotesRangeEngine.prototype.GetRuns = function()
{
	return this.m_arrRuns;
};
CDocumentFootnotesRangeEngine.prototype.GetRefs = function()
{
	return this.m_arrRefs;
};

/**
 * Класс для поиска подходящей нумерации в документе
 * @param oParagraph {Paragraph}
 * @param oNumPr {CNumPr}
 * @param oNumbering {CNumbering}
 */
function CDocumentNumberingContinueEngine(oParagraph, oNumPr, oNumbering)
{
	this.Paragraph = oParagraph;
	this.NumPr     = oNumPr;
	this.Numbering = oNumbering;

	this.Found        = false;
	this.SimilarNumPr = null;
	this.LastNumPr    = null; // Для случая нулевого уровня, когда не получилось подобрать подходящий
}
/**
 * Проверем, дошли ли мы до заданного параграфа
 * @returns {boolean}
 */
CDocumentNumberingContinueEngine.prototype.IsFound = function()
{
	return this.Found;
};
/**
 * Проверяем параграф на совпадение нумераций
 * @param oParagraph {Paragraph}
 */
CDocumentNumberingContinueEngine.prototype.CheckParagraph = function(oParagraph)
{
	if (this.IsFound())
		return;

	if (oParagraph === this.Paragraph)
	{
		this.Found = true;
	}
	else
	{
		var oNumPr = oParagraph.GetNumPr();
		if (oNumPr && oNumPr.Lvl === this.NumPr.Lvl)
		{
			if (oNumPr.Lvl > 0)
			{
				this.SimilarNumPr = new CNumPr(oNumPr.NumId, this.NumPr.Lvl);
			}
			else
			{
				var oCurLvl = this.Numbering.GetNum(oNumPr.NumId).GetLvl(0);
				var oLvl    = this.Numbering.GetNum(this.NumPr.NumId).GetLvl(0);

				if (oCurLvl.IsSimilar(oLvl) || (oCurLvl.GetFormat() === oLvl.GetFormat() && Asc.c_oAscNumberingFormat.Bullet === oCurLvl.GetFormat()))
					this.SimilarNumPr = new CNumPr(oNumPr.NumId, 0);
			}

			this.LastNumPr = new CNumPr(oNumPr.NumId, this.NumPr.Lvl);
		}
	}
};
/**
 * Получаем подходящую нумерацию
 * @returns {?CNumPr}
 */
CDocumentNumberingContinueEngine.prototype.GetNumPr = function()
{
	return this.SimilarNumPr ? this.SimilarNumPr : this.LastNumPr;
};

//-------------------------------------------------------------export---------------------------------------------------
window['Asc'] = window['Asc'] || {};
window['AscCommon'] = window['AscCommon'] || {};
window['AscCommonWord'] = window['AscCommonWord'] || {};
window['AscCommonWord'].CDocument = CDocument;
window['AscCommonWord'].docpostype_Content        = docpostype_Content;
window['AscCommonWord'].docpostype_HdrFtr         = docpostype_HdrFtr;
window['AscCommonWord'].docpostype_DrawingObjects = docpostype_DrawingObjects;
window['AscCommonWord'].docpostype_Footnotes      = docpostype_Footnotes;

window['AscCommon'].Page_Width = Page_Width;
window['AscCommon'].Page_Height = Page_Height;
window['AscCommon'].X_Left_Margin = X_Left_Margin;
window['AscCommon'].X_Right_Margin = X_Right_Margin;
window['AscCommon'].Y_Bottom_Margin = Y_Bottom_Margin;
window['AscCommon'].Y_Top_Margin = Y_Top_Margin;
window['AscCommon'].selectionflag_Common = selectionflag_Common;
window['AscCommon'].document_compatibility_mode_Word15 = document_compatibility_mode_Word15;

CDocumentColumnProps.prototype['put_W']     = CDocumentColumnProps.prototype.put_W;
CDocumentColumnProps.prototype['get_W']     = CDocumentColumnProps.prototype.get_W;
CDocumentColumnProps.prototype['put_Space'] = CDocumentColumnProps.prototype.put_Space;
CDocumentColumnProps.prototype['get_Space'] = CDocumentColumnProps.prototype.get_Space;

window['Asc']['CDocumentColumnsProps'] = CDocumentColumnsProps;
CDocumentColumnsProps.prototype['get_EqualWidth'] = CDocumentColumnsProps.prototype.get_EqualWidth;
CDocumentColumnsProps.prototype['put_EqualWidth'] = CDocumentColumnsProps.prototype.put_EqualWidth;
CDocumentColumnsProps.prototype['get_Num']        = CDocumentColumnsProps.prototype.get_Num       ;
CDocumentColumnsProps.prototype['put_Num']        = CDocumentColumnsProps.prototype.put_Num       ;
CDocumentColumnsProps.prototype['get_Sep']        = CDocumentColumnsProps.prototype.get_Sep       ;
CDocumentColumnsProps.prototype['put_Sep']        = CDocumentColumnsProps.prototype.put_Sep       ;
CDocumentColumnsProps.prototype['get_Space']      = CDocumentColumnsProps.prototype.get_Space     ;
CDocumentColumnsProps.prototype['put_Space']      = CDocumentColumnsProps.prototype.put_Space     ;
CDocumentColumnsProps.prototype['get_ColsCount']  = CDocumentColumnsProps.prototype.get_ColsCount ;
CDocumentColumnsProps.prototype['get_Col']        = CDocumentColumnsProps.prototype.get_Col       ;
CDocumentColumnsProps.prototype['put_Col']        = CDocumentColumnsProps.prototype.put_Col       ;
CDocumentColumnsProps.prototype['put_ColByValue'] = CDocumentColumnsProps.prototype.put_ColByValue;
CDocumentColumnsProps.prototype['get_TotalWidth'] = CDocumentColumnsProps.prototype.get_TotalWidth;

window['Asc']['CDocumentSectionProps'] = window['Asc'].CDocumentSectionProps = CDocumentSectionProps;
CDocumentSectionProps.prototype["get_W"]              = CDocumentSectionProps.prototype.get_W;
CDocumentSectionProps.prototype["put_W"]              = CDocumentSectionProps.prototype.put_W;
CDocumentSectionProps.prototype["get_H"]              = CDocumentSectionProps.prototype.get_H;
CDocumentSectionProps.prototype["put_H"]              = CDocumentSectionProps.prototype.put_H;
CDocumentSectionProps.prototype["get_Orientation"]    = CDocumentSectionProps.prototype.get_Orientation;
CDocumentSectionProps.prototype["put_Orientation"]    = CDocumentSectionProps.prototype.put_Orientation;
CDocumentSectionProps.prototype["get_LeftMargin"]     = CDocumentSectionProps.prototype.get_LeftMargin;
CDocumentSectionProps.prototype["put_LeftMargin"]     = CDocumentSectionProps.prototype.put_LeftMargin;
CDocumentSectionProps.prototype["get_TopMargin"]      = CDocumentSectionProps.prototype.get_TopMargin;
CDocumentSectionProps.prototype["put_TopMargin"]      = CDocumentSectionProps.prototype.put_TopMargin;
CDocumentSectionProps.prototype["get_RightMargin"]    = CDocumentSectionProps.prototype.get_RightMargin;
CDocumentSectionProps.prototype["put_RightMargin"]    = CDocumentSectionProps.prototype.put_RightMargin;
CDocumentSectionProps.prototype["get_BottomMargin"]   = CDocumentSectionProps.prototype.get_BottomMargin;
CDocumentSectionProps.prototype["put_BottomMargin"]   = CDocumentSectionProps.prototype.put_BottomMargin;
CDocumentSectionProps.prototype["get_HeaderDistance"] = CDocumentSectionProps.prototype.get_HeaderDistance;
CDocumentSectionProps.prototype["put_HeaderDistance"] = CDocumentSectionProps.prototype.put_HeaderDistance;
CDocumentSectionProps.prototype["get_FooterDistance"] = CDocumentSectionProps.prototype.get_FooterDistance;
CDocumentSectionProps.prototype["put_FooterDistance"] = CDocumentSectionProps.prototype.put_FooterDistance;
CDocumentSectionProps.prototype["get_Gutter"]         = CDocumentSectionProps.prototype.get_Gutter;
CDocumentSectionProps.prototype["put_Gutter"]         = CDocumentSectionProps.prototype.put_Gutter;
CDocumentSectionProps.prototype["get_GutterRTL"]      = CDocumentSectionProps.prototype.get_GutterRTL;
CDocumentSectionProps.prototype["put_GutterRTL"]      = CDocumentSectionProps.prototype.put_GutterRTL;
CDocumentSectionProps.prototype["get_GutterAtTop"]    = CDocumentSectionProps.prototype.get_GutterAtTop;
CDocumentSectionProps.prototype["put_GutterAtTop"]    = CDocumentSectionProps.prototype.put_GutterAtTop;
CDocumentSectionProps.prototype["get_MirrorMargins"]  = CDocumentSectionProps.prototype.get_MirrorMargins;
CDocumentSectionProps.prototype["put_MirrorMargins"]  = CDocumentSectionProps.prototype.put_MirrorMargins;
