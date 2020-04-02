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

//----------------------------------------------------------------------------------------------------------------------
// CDocumentSpelling
//         Проверка орфографии в документе. Здесь будут хранится параграфы, которые надо проверить. Параграфы, в
//         которых уже есть неверно набранные слова, а также набор слов, которые игнорируются при проверке.
//----------------------------------------------------------------------------------------------------------------------
  
// Import
var g_oTableId = AscCommon.g_oTableId;

var DOCUMENT_SPELLING_MAX_PARAGRAPHS = 50;  // максимальное количество параграфов, которые мы проверяем в таймере
var DOCUMENT_SPELLING_MAX_ERRORS     = 2000; // максимальное количество ошибок, которые отрисовываются

var DOCUMENT_SPELLING_EXCEPTIONAL_WORDS =
{
    "Teamlab" : true,  "teamlab" : true, "OnlyOffice" : true, "ONLYOFFICE" : true, "API" : true
};


function CDocumentSpelling()
{
    this.Use          = true;
    this.TurnOn       = 1;
    this.ErrorsExceed = false;
    this.Paragraphs  = {}; // Параграфы, в которых есть ошибки в орфографии (объект с ключом - Id параграфа)
    this.Words       = {}; // Слова, которые пользователь решил пропустить(нажал "пропустить все") при проверке орфографии
    this.CheckPara   = {}; // Параграфы, в которых нужно запустить проверку орфографии
    this.CurPara     = {}; // Параграфы, в которых мы не проверили некотырые слова, из-за того что в них стоял курсор
    
    this.WaitingParagraphs      = {}; // Параграфы, которые ждут ответа от сервера
    this.WaitingParagraphsCount = 0; 

    // Заполним начальный список исключений
    this.Words = DOCUMENT_SPELLING_EXCEPTIONAL_WORDS;
}

CDocumentSpelling.prototype =
{
    TurnOff : function()
    {
        this.TurnOn -= 1;
    },

    TurnOn : function()
    {
        this.TurnOn += 1;
    },

    Add_Paragraph : function(Id, Para)
    {
        this.Paragraphs[Id] = Para;
    },

    Remove_Paragraph : function(Id)
    {
        delete this.Paragraphs[Id];
    },
    
    Reset : function() 
    {
        this.Paragraphs = {};
        this.CheckPara  = {};
        this.CurPara    = {};

        this.WaitingParagraphs      = {};
        this.WaitingParagraphsCount = 0;
        
        this.ErrorsExceed = false;
    },    

    Check_Word : function(Word)
    {
        if ( undefined != this.Words[Word] )
            return true;

        return false;
    },

    Add_Word : function(Word)
    {
        this.Words[Word] = true;

        for ( var Id in this.Paragraphs )
        {
            var Para = this.Paragraphs[Id];
            Para.SpellChecker.Ignore( Word );
        }
    },

    Add_ParagraphToCheck : function(Id, Para)
    {
        this.CheckPara[Id] = Para;
    },
    
    GetErrorsCount : function()
    {
        var Count = 0;
        for (var Id in this.Paragraphs)
        {
            var Para = this.Paragraphs[Id];
            Count += Para.SpellChecker.GetErrorsCount();
        }     
        
        return Count;
    },

    ContinueCheckSpelling : function()
    {
        if (0 == this.TurnOn)
            return;

        if (true === this.ErrorsExceed)
            return;
        
        // Пока не обработались предыдущие параграфы, новые не стартуем
        if (this.WaitingParagraphsCount <= 0)
		{
			// Эта функция запускается в таймере, поэтому здесь сразу все параграфы не проверяем, чтобы не было
			// притормоза большого, а запускаем по несколько штук.

			var nCounter = 0;
			for (var sId in this.CheckPara)
			{
				var oParagraph = this.CheckPara[sId];

				if (oParagraph.IsUseInDocument() && !oParagraph.ContinueCheckSpelling(false))
					break;

				delete this.CheckPara[sId];
				nCounter++;

				if (nCounter > DOCUMENT_SPELLING_MAX_PARAGRAPHS)
					break;
			}

			// TODO: Послать сообщение
			if (this.GetErrorsCount() > DOCUMENT_SPELLING_MAX_ERRORS)
				this.ErrorsExceed = true;
		}

        for ( var Id in this.CurPara )
        {
            var Para = this.CurPara[Id];
            delete this.CurPara[Id];
            Para.SpellChecker.Reset_ElementsWithCurPos();
            Para.SpellChecker.Check();
        }
    },

    Add_CurPara : function(Id, Para)
    {
        this.CurPara[Id] = Para;
    },

    Check_CurParas : function()
    {
        for ( var Id in this.CheckPara )
        {
            var Para = this.CheckPara[Id];
            Para.ContinueCheckSpelling(true);
            delete this.CheckPara[Id];
        }

        for ( var Id in this.CurPara )
        {
            var Para = this.CurPara[Id];
            delete this.CurPara[Id];
            Para.SpellChecker.Reset_ElementsWithCurPos();
            Para.SpellChecker.Check(undefined, true);
        }
    },
    
    Add_WaitingParagraph : function(Para, RecalcId, Words, Langs)
    {
        var ParaId = Para.Get_Id();
        var WPara = this.WaitingParagraphs[ParaId];
        if (undefined === WPara || RecalcId !== WPara.RecalcId || true !== this.private_CompareWordsAndLangs(WPara.Words, Words, WPara.Langs, Langs))
        {
            this.WaitingParagraphs[ParaId] = {Words : Words, Langs : Langs, RecalcId : RecalcId};
            this.WaitingParagraphsCount++;

            return true;
        }

        return false;
    },

    Check_WaitingParagraph : function(Para)
    {
        var ParaId = Para.Get_Id();
        if (undefined === this.WaitingParagraphs[ParaId])
            return false;

        return true;
    },
    
    Remove_WaitingParagraph : function(Para)
    {
        var ParaId = Para.Get_Id();
        if (undefined !== this.WaitingParagraphs[ParaId])
        {
            delete this.WaitingParagraphs[ParaId];
            this.WaitingParagraphsCount--;
        }
    },

    private_CompareWordsAndLangs : function(Words1, Words2, Langs1, Langs2)
    {
        if (undefined === Words1
            || undefined === Words2
            || undefined === Langs1
            || undefined === Langs2
            || Words1.length !== Words2.length
            || Words1.length !== Langs1.length
            || Words1.length !== Langs2.length)
            return false;

        for (var nIndex = 0, nCount = Words1.length; nIndex < nCount; nIndex++)
        {
            if (Words1[nIndex] !== Words2[nIndex] || Langs1[nIndex] !== Langs2[nIndex])
                return false;
        }

        return true;
    }
};

//----------------------------------------------------------------------------------------------------------------------
// CParaSpellChecker
//         Проверка орфографии внутри одного параграфа. Тут хранится массив всех слов(CParaSpellCheckerElement) в
//         параграфе.
//----------------------------------------------------------------------------------------------------------------------
function CParaSpellChecker(Paragraph)
{
    this.Elements  = [];
    this.RecalcId  = -1;
    this.ParaId    = -1;
    this.Paragraph = Paragraph;
    
    this.Words     = {};

    this.Engine    = null;
}

CParaSpellChecker.prototype =
{
    Clear : function()
    {
        var Count = this.Elements.length;

        for (var Index = 0; Index < Count; Index++)
        {
            var Element = this.Elements[Index];
            
            if (Element.StartRun !== Element.EndRun)
            {
                Element.StartRun.Clear_SpellingMarks();
                Element.EndRun.Clear_SpellingMarks();
            }
            else
            {
                Element.StartRun.Clear_SpellingMarks();
            }

//            var Count2 = Element.ClassesS.length;
//            for ( var Index2 = 1; Index2 < Count2; Index2++ )
//            {
//                Element.ClassesS[Index2].Clear_SpellingMarks();
//            }
//
//            Count2 = Element.ClassesE.length;
//            for ( var Index2 = 1; Index2 < Count2; Index2++ )
//            {
//                Element.ClassesE[Index2].Clear_SpellingMarks();
//            }
        }

        this.Elements = [];
        this.Words    = {};
    },

    Add : function(StartPos, EndPos, Word, Lang, isEndDot)
    {
    	if (Word.length > 0)
		{
			if (Word.charAt(Word.length - 1) == '\'')
				Word = Word.substr(0, Word.length - 1);
			if (Word.charAt(0) == '\'')
				Word = Word.substr(1);
		}

        var SpellCheckerEl = new CParaSpellCheckerElement(StartPos, EndPos, Word, Lang, isEndDot);
        this.Paragraph.Add_SpellCheckerElement( SpellCheckerEl );
        this.Elements.push( SpellCheckerEl );
    },
    
    GetErrorsCount : function()
    {
        var ErrorsCount = 0;
        var ElementsCount = this.Elements.length;
        for (var Index = 0; Index < ElementsCount; Index++)
        {
            var Element = this.Elements[Index];
            if (false === Element.Checked)
                ErrorsCount++;
        }
        
        return ErrorsCount;
    },

    Check : function(ParagraphForceRedraw, _bForceCheckCur)
    {
        var bForceCheckCur = ( true != _bForceCheckCur ? false : true )
        var Paragraph = g_oTableId.Get_ById( this.ParaId );
        var bCurrent = ( true === bForceCheckCur ? false : Paragraph.Is_ThisElementCurrent() );

        var CurPos = -1;

        if ( true === bCurrent && false === Paragraph.Selection.Use )
            CurPos = Paragraph.Get_ParaContentPos( false, false );

        var usrWords = [];
        var usrLang  = [];

        var Count = this.Elements.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var Element = this.Elements[Index];
            Element.CurPos = false;

            if (1 >= Element.Word.length || this.private_IsAbbreviation(Element.Word))
			{
				Element.Checked = true;
			}
            else if ( editor.asc_IsSpellCheckCurrentWord() !== true && null === Element.Checked && -1 != CurPos && Element.EndPos.Compare( CurPos ) >= 0 && Element.StartPos.Compare( CurPos ) <= 0 )
            {
                Element.Checked = true;
                Element.CurPos  = true;
                editor.WordControl.m_oLogicDocument.Spelling.Add_CurPara( this.ParaId, g_oTableId.Get_ById( this.ParaId ) );
            }

            if ( null === Element.Checked && editor.SpellCheckApi.checkDictionary(this.Elements[Index].Lang) )
            {
                usrWords.push(this.Elements[Index].Word);
                usrLang.push(this.Elements[Index].Lang);

                if (this.Elements[Index].IsEndDot())
				{
					usrWords.push(this.Elements[Index].Word + ".");
					usrLang.push(this.Elements[Index].Lang);
				}
            }
        }

        if ( 0 < usrWords.length )        
        {
            if (true === editor.WordControl.m_oLogicDocument.Spelling.Add_WaitingParagraph(this.Paragraph, this.RecalcId, usrWords, usrLang))
            {
                editor.SpellCheckApi.spellCheck({"type" : "spell", "ParagraphId" : this.ParaId, "RecalcId" : this.RecalcId, "ElementId" : 0, "usrWords" : usrWords, "usrLang" : usrLang });
            }
            else
            {
                // Значит данный параграф с таким запросом уже обрабатывается
            }
        }
        else if ( undefined != ParagraphForceRedraw )
            ParagraphForceRedraw.ReDraw();
    },

    Check_CallBack : function(RecalcId, UsrCorrect)
    {
        if ( RecalcId == this.RecalcId )
        {
            var DocumentSpelling = editor.WordControl.m_oLogicDocument.Spelling;
            var Count = this.Elements.length;
            var Index2 = 0;
            for ( var Index = 0; Index < Count; Index++ )
            {
                var Element = this.Elements[Index];

                if ( null === Element.Checked && true != Element.Checked )
                {
                    // Если слово есть в локальном словаре, не проверяем его
                    if ( true === DocumentSpelling.Check_Word( Element.Word ) )
					{
						Element.Checked = true;
					}
					else if (Element.IsEndDot())
					{
						Element.Checked = UsrCorrect[Index2] || UsrCorrect[Index2 + 1];
						Index2++;
					}
                    else
					{
						Element.Checked = UsrCorrect[Index2];
					}

                    Index2++;
                }
            }
            
            this.Update_WordsList();
            this.Remove_RightWords();
            
            this.Internal_UpdateParagraphState();
        }

        editor.WordControl.m_oLogicDocument.Spelling.Remove_WaitingParagraph(this.Paragraph);
    },

    Internal_UpdateParagraphState : function()
    {
        var DocumentSpelling = editor.WordControl.m_oLogicDocument.Spelling;

        var bMisspeled = false;
        var Count = this.Elements.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            // Если есть хоть одно неправильное слово, запоминаем этот параграф
            if ( false === this.Elements[Index].Checked )
                bMisspeled = true;
        }

        if ( true === bMisspeled )
            DocumentSpelling.Add_Paragraph( this.ParaId, g_oTableId.Get_ById( this.ParaId ) );
        else
            DocumentSpelling.Remove_Paragraph( this.ParaId );
    },

    Check_Spelling : function(Pos)
    {
        var Count = this.Elements.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var Element = this.Elements[Index];
            if ( Element.StartPos > Pos )
                break;
            else if ( Element.EndPos < Pos )
                continue;
            else
            {
                return (Element.Checked === null ? true : Element.Checked);
            }
        }

        return true;
    },

    Document_UpdateInterfaceState : function(StartPos, EndPos)
	{
		// Надо определить, попадает ли какое-либо неверно набранное слово в заданный промежуток, и одно ли оно
		var Count        = this.Elements.length;
		var FoundElement = null;
		var FoundIndex   = -1;
		for (var Index = 0; Index < Count; Index++)
		{
			var Element = this.Elements[Index];
			if (Element.StartPos.Compare(EndPos) <= 0 && Element.EndPos.Compare(StartPos) >= 0 && false === Element.Checked)
			{
				if (null != FoundElement)
				{
					FoundElement = null;
					break;
				}
				else
				{
					FoundIndex   = Index;
					FoundElement = Element;
				}
			}
		}

		var Word     = "";
		var Variants = null;
		var Checked  = null;

		if (null != FoundElement)
		{
			Word     = FoundElement.Word;
			Variants = FoundElement.Variants;
			Checked  = FoundElement.Checked;

			if (null === Variants && false === editor.WordControl.m_oLogicDocument.Spelling.Check_WaitingParagraph(this.Paragraph) && editor.SpellCheckApi.checkDictionary(FoundElement.Lang))
			{
				editor.SpellCheckApi.spellCheck({
					"type"        : "suggest",
					"ParagraphId" : this.ParaId,
					"RecalcId"    : this.RecalcId,
					"ElementId"   : FoundIndex,
					"usrWords"    : [Word],
					"usrLang"     : [FoundElement.Lang]
				});
			}
		}

		// Неопределенное слово посылаем как хорошее в интерфейс
		if (null === Checked)
			Checked = true;

		editor.sync_SpellCheckCallback(Word, Checked, Variants, this.ParaId, FoundElement);
	},

    Check_CallBack2: function(RecalcId, ElementId, usrVariants)
    {
        if (RecalcId == this.RecalcId && undefined !== this.Elements[ElementId])
        {
            this.Elements[ElementId].Variants = usrVariants[0];
            
            var Count = DOCUMENT_SPELLING_EASTEGGS.length;
            for (var Index = 0; Index < Count; Index++)
            {
                if (DOCUMENT_SPELLING_EASTEGGS[Index] === this.Elements[ElementId].Word)
                {
                    this.Elements[ElementId].Variants = DOCUMENT_SPELLING_EASTEGGS_VARIANTS[Index];
                }
            }

            var Element = this.Elements[ElementId];
            if (undefined !== this.Words[Element.Word] && undefined !== this.Words[Element.Word][Element.LangId])
                this.Words[Element.Word][Element.LangId] = Element.Variants;
        }
    },

    Ignore : function(Word)
    {
        var Count = this.Elements.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var Element = this.Elements[Index];
            if ( false === Element.Checked && Word === Element.Word )
                Element.Checked = true;
        }

        if (undefined !== this.Words[Word])
            delete this.Words[Word];

        this.Internal_UpdateParagraphState();
    },

    Update_OnAdd : function(Paragraph, Pos, Item)
    {
        var RecalcInfo = ( undefined !== Paragraph.Paragraph ? Paragraph.Paragraph.RecalcInfo : Paragraph.RecalcInfo );
        RecalcInfo.Set_Type_0_Spell( pararecalc_0_Spell_All );
    },

    Update_OnRemove : function(Paragraph, Pos, Count)
    {
        var RecalcInfo = ( undefined !== Paragraph.Paragraph ? Paragraph.Paragraph.RecalcInfo : Paragraph.RecalcInfo );
        RecalcInfo.Set_Type_0_Spell( pararecalc_0_Spell_All );
    },

    Reset_ElementsWithCurPos : function()
    {
        var Count = this.Elements.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var Element = this.Elements[Index];
            if ( true === Element.CurPos )
                Element.Checked = null;
        }
    },

    Compare_WithPrevious : function()
    {
        var ElementsCount = this.Elements.length;

        for (var Index = 0; Index < ElementsCount; Index++)
        {
            var Element = this.Elements[Index];

            var Word = Element.Word;
            var Lang = Element.Lang;
            
            if (undefined !== this.Words[Word])
            {
                if (undefined === this.Words[Word][Lang] || this.Words[Word].EndDot !== Element.IsEndDot())
                {
                    Element.Checked  = null;
                    Element.Variants = null;
                }
				else if (true === this.Words[Word][Lang])
				{
					Element.Checked  = true;
					Element.Variants = null;
				}
                else
                {
                    Element.Checked  = false;
                    Element.Variants = this.Words[Word][Lang];
                }
            }
        }
        
        this.Clear_WordsList();
        this.Update_WordsList();
        this.Remove_RightWords();       
    },
    
    Clear_WordsList : function()
    {
        this.Words = {};
    },
    
    Update_WordsList : function()
    {
        var Count = this.Elements.length;
        for (var Index = Count - 1; Index >= 0; Index--)
        {
            var Element = this.Elements[Index];

            if (true === Element.Checked && true !== Element.CurPos)
            {
                if (undefined == this.Words[Element.Word])
				{
					this.Words[Element.Word] = {EndDot : Element.IsEndDot()};
				}

                if (undefined === this.Words[Element.Word][Element.Lang])
					this.Words[Element.Word][Element.Lang] = true;
            }
            else if (false === Element.Checked)
            {
                if (undefined == this.Words[Element.Word])
                    this.Words[Element.Word] = {EndDot : Element.IsEndDot()};

                if (undefined === this.Words[Element.Word][Element.Lang])
                    this.Words[Element.Word][Element.Lang] = Element.Variants;
            }
        }        
    },

	Remove_RightWords : function()
	{
		var Count = this.Elements.length;
		for (var Index = Count - 1; Index >= 0; Index--)
		{
			var Element = this.Elements[Index];

			if (true === Element.Checked && true !== Element.CurPos)
			{
				if (Element.StartRun !== Element.EndRun)
				{
					Element.StartRun.Remove_SpellCheckerElement(Element);
					Element.EndRun.Remove_SpellCheckerElement(Element);
				}
				else
					Element.EndRun.Remove_SpellCheckerElement(Element);

				this.Elements.splice(Index, 1);
			}
		}
	}
};
/**
 * Получаем количество элементов проверки орфографии
 * @returns {Number}
 */
CParaSpellChecker.prototype.GetElementsCount = function()
{
	return this.Elements.length;
};
/**
 * Получаем элемент проверки орфографии по номеру
 * @param nIndex
 * @returns {CParaSpellCheckerElement}
 */
CParaSpellChecker.prototype.GetElement = function(nIndex)
{
	return this.Elements[nIndex];
};
/**
 * Приостанавливаем проверку орфографии, если параграф слишком большой
 * @param {CParagraphSpellCheckerEngine} oEngine
 */
CParaSpellChecker.prototype.Pause = function(oEngine)
{
	this.Engine = oEngine;
};
/**
 * Проверяем приостановлена ли проверка в данном параграфе
 * @return {boolean}
 */
CParaSpellChecker.prototype.IsPaused = function()
{
	return !!(this.Engine);
};
/**
 * Получаем класс для проверки орфографии внутри параграфа, на котором была сделана остановка
 * @return {null|CParagraphSpellCheckerEngine}
 */
CParaSpellChecker.prototype.GetPausedEngine = function()
{
	return this.Engine;
};
/**
 * Очищаем остановленное состояние
 */
CParaSpellChecker.prototype.ClearPausedEngine = function()
{
	this.Engine = null;
};
/**
 * Проверяем является ли заданное слово аббревиатурой
 * @param {string} sWord
 * @returns {boolean}
 */
CParaSpellChecker.prototype.private_IsAbbreviation = function(sWord)
{
	if (sWord.toUpperCase() === sWord)
	{
		// Корейские символы считаются символами в верхнем регистре, но при этом мы не должны считать их аббревиатурой
		for (var nPos = 0, nLen = sWord.length; nPos < nLen; ++nPos)
		{
			var nCharCode = sWord.charCodeAt(nPos);
			if ((0xAC00 <= nCharCode && nCharCode <= 0xD7A3)
				|| (0x1100 <= nCharCode && nCharCode <= 0x11FF)
				|| (0x3130 <= nCharCode && nCharCode <= 0x318F)
				|| (0xA960 <= nCharCode && nCharCode <= 0xA97F)
				|| (0xD7B0 <= nCharCode && nCharCode <= 0xD7FF))
				return false;
		}

		return true;
	}

	return false;
};

//----------------------------------------------------------------------------------------------------------------------
// CParaSpellCheckerElement
//----------------------------------------------------------------------------------------------------------------------
function CParaSpellCheckerElement(StartPos, EndPos, Word, Lang, isEndDot)
{
    this.StartPos = StartPos;
    this.EndPos   = EndPos;
    this.Word     = Word;
    this.Lang     = Lang;
    this.EndDot   = isEndDot; // Данный флаг появился в связи с багом 41954
    this.Checked  = null; // null - неизвестно, true - правильное слово, false - неправильное слово
    this.CurPos   = false;
    this.Variants = null;

    this.StartRun = null;
    this.EndRun   = null;
}

CParaSpellCheckerElement.prototype.GetStartPos = function()
{
	return this.StartPos;
};
CParaSpellCheckerElement.prototype.GetEndPos = function()
{
	return this.EndPos;
};
CParaSpellCheckerElement.prototype.IsEndDot = function()
{
	return this.EndDot;
};

//----------------------------------------------------------------------------------------------------------------------
// CDocument
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.Set_DefaultLanguage = function(NewLangId)
{    
    // Устанавливаем словарь по умолчанию
    var Styles = this.Styles;    
    var OldLangId = Styles.Default.TextPr.Lang.Val;
    this.History.Add(new CChangesDocumentDefaultLanguage(this, OldLangId, NewLangId));
    Styles.Default.TextPr.Lang.Val = NewLangId;

    // Нужно заново запустить проверку орфографии
    this.Restart_CheckSpelling();
    
    this.Document_UpdateInterfaceState();
};

CDocument.prototype.Get_DefaultLanguage = function()
{
    var Styles = this.Styles;
    return Styles.Default.TextPr.Lang.Val;
};

CDocument.prototype.Restart_CheckSpelling = function()
{
    this.Spelling.Reset();
    
    // TODO: добавить обработку в автофигурах
    this.SectionsInfo.Restart_CheckSpelling();

    var Count = this.Content.length;
    for ( var Index = 0; Index < Count; Index++ )
    {
        this.Content[Index].Restart_CheckSpelling();
    }
};

CDocument.prototype.Stop_CheckSpelling = function()
{
    this.Spelling.Reset();
};

CDocument.prototype.ContinueCheckSpelling = function()
{
    this.Spelling.ContinueCheckSpelling();
};

CDocument.prototype.TurnOff_CheckSpelling = function()
{
    this.Spelling.TurnOff();
};
CDocument.prototype.TurnOn_CheckSpelling = function()
{
    this.Spelling.TurnOn();
};

//----------------------------------------------------------------------------------------------------------------------
// CDocumentContent
//----------------------------------------------------------------------------------------------------------------------
CDocumentContent.prototype.Restart_CheckSpelling = function()
{
    var Count = this.Content.length;
    for ( var Index = 0; Index < Count; Index++ )
    {
        this.Content[Index].Restart_CheckSpelling();
    }
};

//----------------------------------------------------------------------------------------------------------------------
// CHeaderFooter
//----------------------------------------------------------------------------------------------------------------------
CHeaderFooter.prototype.Restart_CheckSpelling = function()
{
    this.Content.Restart_CheckSpelling();
};

//----------------------------------------------------------------------------------------------------------------------
// CDocumentSectionsInfo
//----------------------------------------------------------------------------------------------------------------------
CDocumentSectionsInfo.prototype.Restart_CheckSpelling = function()
{
    var bEvenOdd = EvenAndOddHeaders;
    var Count = this.Elements.length;
    for ( var Index = 0; Index < Count; Index++ )
    {
        var SectPr = this.Elements[Index].SectPr;
        var bFirst = SectPr.Get_TitlePage();

        if ( null != SectPr.HeaderFirst && true === bFirst )
            SectPr.HeaderFirst.Restart_CheckSpelling();

        if ( null != SectPr.HeaderEven && true === bEvenOdd )
            SectPr.HeaderEven.Restart_CheckSpelling();

        if ( null != SectPr.HeaderDefault )
            SectPr.HeaderDefault.Restart_CheckSpelling();

        if ( null != SectPr.FooterFirst && true === bFirst )
            SectPr.FooterFirst.Restart_CheckSpelling();

        if ( null != SectPr.FooterEven && true === bEvenOdd )
            SectPr.FooterEven.Restart_CheckSpelling();

        if ( null != SectPr.FooterDefault )
            SectPr.FooterDefault.Restart_CheckSpelling();
    }
};

//----------------------------------------------------------------------------------------------------------------------
// CTable
//----------------------------------------------------------------------------------------------------------------------
CTable.prototype.Restart_CheckSpelling = function()
{
    this.Recalc_CompiledPr();

    var RowsCount = this.Content.length;
    for ( var CurRow = 0; CurRow < RowsCount; CurRow++ )
    {
        var Row = this.Content[CurRow];
        Row.Recalc_CompiledPr();
        var CellsCount = Row.Get_CellsCount();

        for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
        {
            var Cell = Row.Get_Cell(CurCell);
            Cell.Recalc_CompiledPr();
            Cell.Content.Restart_CheckSpelling();
        }
    }
};

//----------------------------------------------------------------------------------------------------------------------
// Paragraph
//----------------------------------------------------------------------------------------------------------------------
Paragraph.prototype.Restart_CheckSpelling = function()
{
    this.RecalcInfo.Set_Type_0_Spell( pararecalc_0_Spell_All );
    
    // Пересчитываем скомпилированный стиль для самого параграфа и для всех ранов в данном параграфе
    this.Recalc_CompiledPr();

    for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; nIndex++)
    {
        this.Content[nIndex].Restart_CheckSpelling();
    }

    this.LogicDocument.Spelling.Add_ParagraphToCheck(this.Get_Id(), this);
};

Paragraph.prototype.Internal_CheckPunctuationBreak = function(_Pos)
{
    // В позиции Pos у нас стоит знак пунктуации, проверяем, идет ли за ним сразу текст

    var Count = this.Content.length;
    for ( var Pos = _Pos + 1; Pos < Count; Pos++ )
    {
        var Item = this.Content[Pos];

        if ( para_Text === Item.Type &&  false === Item.IsPunctuation() && false === Item.Is_NBSP() && false === Item.Is_Number() && false === Item.Is_SpecialSymbol() )
        {
            return true;
        }
        else if ( para_CollaborativeChangesEnd === Item.Type || para_CollaborativeChangesStart === Item.Type )
            continue;
        else
        {
            return false;
        }
    }

};

Paragraph.prototype.Internal_CheckSpelling = function()
{
    if ( pararecalc_0_Spell_None !== this.RecalcInfo.Recalc_0_Spell.Type )
    {
        if (this === g_oTableId.Get_ById(this.Get_Id()))
            this.LogicDocument && this.LogicDocument.Spelling.Add_ParagraphToCheck(this.Get_Id(), this);
    }
};

/**
 * Производим проверку орфографии.
 * @param isForceFullCheck {boolean} принуждаем параграф проверить целиком, даже если он большой
 * @return {boolean} true - проверка прошла до конца, false - параграф слишком большой и за один раз проверка не выполнилась
 */
Paragraph.prototype.ContinueCheckSpelling = function(isForceFullCheck)
{
    var ParaForceRedraw = undefined;
    var CheckLang = false;
    if ( pararecalc_0_Spell_None === this.RecalcInfo.Recalc_0_Spell.Type )
        return true;
    else
    {
        var OldElements = this.SpellChecker.Elements;

		var oSpellCheckerEngine,
			nStartPos = 0;
        if (this.SpellChecker.IsPaused())
		{
			oSpellCheckerEngine = this.SpellChecker.GetPausedEngine();
			oSpellCheckerEngine.SetFindStart(true);
			oSpellCheckerEngine.ResetCheckedCounter();

			nStartPos = oSpellCheckerEngine.GetPos(0);
		}
		else
		{
			oSpellCheckerEngine = new CParagraphSpellCheckerEngine(this.SpellChecker, isForceFullCheck);

			this.SpellChecker.Elements = [];
		}

		for (var nPos = nStartPos, nCount = this.Content.length; nPos < nCount; ++nPos)
		{
			var oItem = this.Content[nPos];

			oSpellCheckerEngine.UpdatePos(nPos, 0);
			oItem.CheckSpelling(oSpellCheckerEngine, 1);

			if (oSpellCheckerEngine.IsExceedLimit())
				break;
		}

		if (oSpellCheckerEngine.IsExceedLimit())
		{
			this.SpellChecker.Pause(oSpellCheckerEngine);
			return false;
		}

        //if ( true === this.SpellChecker.Compare_WithPrevious( OldElements ) )
        //    ParaForceRedraw = this;

        // TODO: Мы не можем здесь проверить надо ли перерисовывать параграф или нет, потому что возможно у нас в
        //       параграф вставили/удалили элемент, который не повлиял на орфографию, т.е. фактически ни 1 слова не
        //       изменилось, но при этом изменились метки начала и конца подчеркивания орфографии. Если можно это 
        //       отследить, тогда можно будет вернуться к предыдущему варианту.
        this.SpellChecker.Compare_WithPrevious( OldElements );
        ParaForceRedraw = this;

        // Не надо проверять отдельно языки
        CheckLang = false;
    }

    // Специальная проверка на наличие буквицы в предыдущем параграфе. Если она есть, то первое слово мы не проверяем
    var PrevPara = this.Get_DocumentPrev();
    if ( null != PrevPara && type_Paragraph === PrevPara.GetType() && undefined != PrevPara.Get_FramePr() && undefined != PrevPara.Get_FramePr().DropCap )
    {
        if ( this.SpellChecker.Elements.length > 0 )
        {
            var bDontCheckFirstWord = true;
            var Element = this.SpellChecker.Elements[0];
            var StartPos = Element.StartPos;
            for ( var TempPos = 0; TempPos < StartPos; TempPos++  )
            {
                var Item = this.Content[TempPos];
                if ( para_Space === Item.Type )
                {
                    bDontCheckFirstWord = false;
                    break;
                }
            }

            if ( true === bDontCheckFirstWord && true != Element.Checked )
            {
                Element.Checked = true;
                ParaForceRedraw = this;
            }
        }
    }

    if ( true === CheckLang )
    {
        // Пройдемся по всем словам и проверим словарь, в котором должно проверяться слово (если словарь поменялся,
        // тогда слово отправляет на проверку)
        var WordsCount = this.SpellChecker.Elements.length;
        for ( var ElemId = 0; ElemId < WordsCount; ElemId++ )
        {
            var Element = this.SpellChecker.Elements[ElemId];
            var CurLang = Element.Lang;
            var Lang = this.Internal_GetLang( Element.EndPos );
            if ( CurLang != Lang.Val )
            {
                Element.Lang     = Lang.Val;
                Element.Checked  = null;
                Element.Variants = null;
            }
        }
    }

    // Если у нас осталось одно слово в параграфе, состоящее из одной буквы, тогда надо перерисовать данный параграф,
    // чтобы избавиться от подчеркивания.
    if ( 1 === this.SpellChecker.Elements.length && 1 === this.SpellChecker.Elements[0].Word.length )
        ParaForceRedraw = this;

    this.SpellChecker.RecalcId = this.LogicDocument.RecalcId;
    this.SpellChecker.ParaId   = this.Get_Id();
    this.SpellChecker.Check(ParaForceRedraw );

    this.RecalcInfo.Recalc_0_Spell.Type = pararecalc_0_Spell_None;

    return true;
};

Paragraph.prototype.Add_SpellCheckerElement = function(Element)
{   
//    Element.ClassesS.push( this );
//    Element.ClassesE.push( this );
//
    var StartPos = Element.StartPos.Get(0);
    var EndPos   = Element.EndPos.Get(0);

    this.Content[StartPos].Add_SpellCheckerElement( Element, true, 1 );
    this.Content[EndPos].Add_SpellCheckerElement( Element, false, 1 );
};
//----------------------------------------------------------------------------------------------------------------------
// ParaRun
//----------------------------------------------------------------------------------------------------------------------
ParaRun.prototype.Restart_CheckSpelling = function()
{
    this.Recalc_CompiledPr(false);

    for (var nIndex = 0, nCount = this.Content.length; nIndex < nCount; nIndex++)
    {
        var Item = this.Content[nIndex];

        if (para_Drawing === Item.Type)
            Item.Restart_CheckSpelling();
    }
};

ParaRun.prototype.CheckSpelling = function(oSpellCheckerEngine, nDepth)
{
	if (oSpellCheckerEngine.IsExceedLimit())
		return;

	var nStartPos = 0;

	var bWord        = oSpellCheckerEngine.bWord;
	var sWord        = oSpellCheckerEngine.sWord;
	var CurLcid      = oSpellCheckerEngine.CurLcid;
	var SpellChecker = oSpellCheckerEngine.SpellChecker;
	var ContentPos   = oSpellCheckerEngine.ContentPos;

	if (reviewtype_Remove === this.GetReviewType())
	{
		if (true === bWord)
		{
			SpellChecker.Add(oSpellCheckerEngine.StartPos, oSpellCheckerEngine.EndPos, sWord, CurLcid, false);

			oSpellCheckerEngine.bWord   = false;
			oSpellCheckerEngine.sWord   = "";
			oSpellCheckerEngine.CurLcid = CurLcid;
		}
		return;
	}

	var oCurTextPr = this.Get_CompiledPr(false);

	if (oSpellCheckerEngine.IsFindStart())
	{
		nStartPos = oSpellCheckerEngine.GetPos(nDepth);
		oSpellCheckerEngine.SetFindStart(false);
	}
	else
	{
		this.SpellingMarks = [];

		if (true === this.IsEmpty())
			return;

		if (true === bWord && CurLcid !== oCurTextPr.Lang.Val)
		{
			bWord = false;
			SpellChecker.Add(oSpellCheckerEngine.StartPos, oSpellCheckerEngine.EndPos, sWord, CurLcid, false);
		}

		CurLcid = oCurTextPr.Lang.Val;
	}

    for (var nPos = nStartPos, nContentLen = this.Content.length; nPos < nContentLen; ++nPos)
	{
		if (oSpellCheckerEngine.IsExceedLimit())
		{
			oSpellCheckerEngine.UpdatePos(nPos, nDepth);
			break;
		}

		var oItem = this.Content[nPos];

		//if ( para_Text === oItem.Type && ( false === oItem.IsPunctuation() || ( true === bWord && true === this.Internal_CheckPunctuationBreak( nPos ) ) ) && false === oItem.Is_NBSP() && false === oItem.Is_Number() && false === oItem.Is_SpecialSymbol() )
		if (para_Text === oItem.Get_Type() && false === oItem.IsPunctuation() && false === oItem.Is_NBSP() && false === oItem.Is_Number() && false === oItem.Is_SpecialSymbol())
		{
			if (false === bWord)
			{
				var StartPos = ContentPos.Copy();
				var EndPos   = ContentPos.Copy();

				StartPos.Update(nPos, nDepth);
				EndPos.Update(nPos + 1, nDepth);

				bWord = true;

				sWord = oItem.GetCharForSpellCheck(oCurTextPr.Caps);

				oSpellCheckerEngine.StartPos = StartPos;
				oSpellCheckerEngine.EndPos   = EndPos;
			}
			else
			{
				sWord += oItem.GetCharForSpellCheck(oCurTextPr.Caps);

				var EndPos = ContentPos.Copy();
				EndPos.Update(nPos + 1, nDepth);

				oSpellCheckerEngine.EndPos = EndPos;
			}
		}
		else
		{
			if (true === bWord)
			{
				bWord = false;
				SpellChecker.Add(oSpellCheckerEngine.StartPos, oSpellCheckerEngine.EndPos, sWord, CurLcid, oItem.IsDot());
			}
		}

		oSpellCheckerEngine.IncreaseCheckedCounter();
	}

	oSpellCheckerEngine.bWord   = bWord;
	oSpellCheckerEngine.sWord   = sWord;
	oSpellCheckerEngine.CurLcid = CurLcid;
};

ParaRun.prototype.Add_SpellCheckerElement = function(Element, Start, Depth)
{
//    if ( true === Start )
//        Element.ClassesS.push(this);
//    else
//        Element.ClassesE.push(this);

    if ( true === Start )
        Element.StartRun = this;
    else
        Element.EndRun = this;

    this.SpellingMarks.push( new CParagraphSpellingMark( Element, Start, Depth ) );
};

ParaRun.prototype.Remove_SpellCheckerElement = function(Element)
{
    var Count = this.SpellingMarks.length;
    for (var Pos = Count - 1; Pos >= 0; Pos--)
    {
        var SpellingMark = this.SpellingMarks[Pos];
        if (Element === SpellingMark.Element)
        {
            this.SpellingMarks.splice(Pos, 1);
        }
    }    
};

ParaRun.prototype.Clear_SpellingMarks = function()
{
    this.SpellingMarks = [];
};
//----------------------------------------------------------------------------------------------------------------------
// AscCommon.ParaComment
//----------------------------------------------------------------------------------------------------------------------
AscCommon.ParaComment.prototype.Restart_CheckSpelling = function()
{
};

AscCommon.ParaComment.prototype.Add_SpellCheckerElement = function(Element, Start, Depth)
{
};

AscCommon.ParaComment.prototype.Remove_SpellCheckerElement = function(Element)
{
};

AscCommon.ParaComment.prototype.Clear_SpellingMarks = function()
{
};
//----------------------------------------------------------------------------------------------------------------------
// ParaMath
//----------------------------------------------------------------------------------------------------------------------
ParaMath.prototype.Restart_CheckSpelling = function()
{
};

ParaMath.prototype.CheckSpelling = function(oSpellCheckerEngine, nDepth)
{
	if (oSpellCheckerEngine.IsExceedLimit())
		return;

	if (true === oSpellCheckerEngine.bWord)
	{
		oSpellCheckerEngine.bWord = false;
		oSpellCheckerEngine.SpellChecker.Add(oSpellCheckerEngine.StartPos, oSpellCheckerEngine.EndPos, oSpellCheckerEngine.sWord, oSpellCheckerEngine.CurLcid, false);
	}
};

ParaMath.prototype.Add_SpellCheckerElement = function(Element, Start, Depth)
{
};

ParaMath.prototype.Remove_SpellCheckerElement = function(Element)
{
};

ParaMath.prototype.Clear_SpellingMarks = function()
{
};
//----------------------------------------------------------------------------------------------------------------------
// ParaField
//----------------------------------------------------------------------------------------------------------------------
ParaField.prototype.Restart_CheckSpelling = function()
{
};

ParaField.prototype.CheckSpelling = function(oSpellCheckerEngine, nDepth)
{
	if (oSpellCheckerEngine.IsExceedLimit())
		return;

	if (true === oSpellCheckerEngine.bWord)
	{
		oSpellCheckerEngine.bWord = false;
		oSpellCheckerEngine.SpellChecker.Add(oSpellCheckerEngine.StartPos, oSpellCheckerEngine.EndPos, oSpellCheckerEngine.sWord, oSpellCheckerEngine.CurLcid, false);
	}
};

ParaField.prototype.Add_SpellCheckerElement = function(Element, Start, Depth)
{
};

ParaField.prototype.Remove_SpellCheckerElement = function(Element)
{
};

ParaField.prototype.Clear_SpellingMarks = function()
{
};



function CParagraphSpellCheckerEngine(oSpellChecker, isForceFullCheck)
{
    this.ContentPos   = new CParagraphContentPos();
    this.SpellChecker = oSpellChecker;

    this.CurLcid    = -1;
    this.bWord      = false;
    this.sWord      = "";
    this.StartPos   = null; // CParagraphContentPos
    this.EndPos     = null; // CParagraphContentPos


	// Защита от проверки орфографии в большом параграфе
	this.CheckedCounter = 0;
	this.CheckedLimit   = 2000;
	this.FindStart      = false;
	this.ForceFullCheck = !!isForceFullCheck;
}
/**
 * Обновляем текущую позицию на заданной глубине
 * @param nPos {number}
 * @param nDepth {number}
 */
CParagraphSpellCheckerEngine.prototype.UpdatePos = function(nPos, nDepth)
{
	this.ContentPos.Update(nPos, nDepth);
};
/**
 * Получаем текущую позицию на заданном уровне
 * @param nDepth
 * @return {number}
 */
CParagraphSpellCheckerEngine.prototype.GetPos = function(nDepth)
{
	return this.ContentPos.Get(nDepth);
};
/**
 * Проверяем превышен ли лимит возможнных проверок в параграфе за один проход таймера
 * @return {boolean}
 */
CParagraphSpellCheckerEngine.prototype.IsExceedLimit = function()
{
	return (!this.ForceFullCheck && this.CheckedCounter >= this.CheckedLimit);
};
/**
 * Увеличиваем счетчик проверенных элементов
 */
CParagraphSpellCheckerEngine.prototype.IncreaseCheckedCounter = function()
{
	this.CheckedCounter++;
};
/**
 * Перестартовываем счетчик
 */
CParagraphSpellCheckerEngine.prototype.ResetCheckedCounter = function()
{
	this.CheckedCounter = 0;
};
/**
 * Если проверка была приостановлена и сейчас мы ищем начальную позицию
 * @return {boolean}
 */
CParagraphSpellCheckerEngine.prototype.IsFindStart = function()
{
	return this.FindStart;
};
/**
 * Выставляем ищем ли мы место, где закончили проверку прошлый раз
 * @param isFind {boolean}
 */
CParagraphSpellCheckerEngine.prototype.SetFindStart = function(isFind)
{
	this.FindStart = isFind;
};

function CParagraphSpellingMark(SpellCheckerElement, Start, Depth)
{
    this.Element = SpellCheckerElement;
    this.Start   = Start;
    this.Depth   = Depth;
}

var DOCUMENT_SPELLING_EASTEGGS          = [String.fromCharCode(0x4b, 0x69, 0x72, 0x69, 0x6c, 0x6c, 0x6f, 0x76, 0x49, 0x6c, 0x79, 0x61), String.fromCharCode(0x4b, 0x69, 0x72, 0x69, 0x6c, 0x6c, 0x6f, 0x76, 0x53, 0x65, 0x72, 0x67, 0x65, 0x79)];
var DOCUMENT_SPELLING_EASTEGGS_VARIANTS = [[String.fromCharCode(0x4b, 0x69, 0x72, 0x69, 0x6c, 0x6c, 0x6f, 0x76, 0x20, 0x49, 0x6c, 0x79, 0x61), String.fromCharCode(0x47, 0x6f, 0x6f, 0x64, 0x20, 0x6d, 0x61, 0x6e), String.fromCharCode(0x46, 0x6f, 0x75, 0x6e, 0x64, 0x69, 0x6e, 0x67, 0x20, 0x66, 0x61, 0x74, 0x68, 0x65, 0x72, 0x20, 0x6f, 0x66, 0x20, 0x74, 0x68, 0x69, 0x73, 0x20, 0x45, 0x64, 0x69, 0x74, 0x6f, 0x72, 0x21)], [String.fromCharCode(0x4b, 0x69, 0x72, 0x69, 0x6c, 0x6c, 0x6f, 0x76, 0x20, 0x53, 0x65, 0x72, 0x67, 0x65, 0x79, 0x20, 0x41, 0x6c, 0x62, 0x65, 0x72, 0x74, 0x6f, 0x76, 0x69, 0x63, 0x68), String.fromCharCode(0x4f, 0x6c, 0x64, 0x20, 0x77, 0x6f, 0x6c, 0x66), String.fromCharCode(0x46, 0x6f, 0x75, 0x6e, 0x64, 0x65, 0x72, 0x20, 0x66, 0x61, 0x74, 0x68, 0x65, 0x72, 0x27, 0x73, 0x20, 0x66, 0x61, 0x74, 0x68, 0x65, 0x72)]];
