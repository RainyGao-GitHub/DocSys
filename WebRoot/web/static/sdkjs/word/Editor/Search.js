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
// CParagraphSearchElement
//         Найденные элементы в параграфе. Записаны в массиве Paragraph.SearchResults
//----------------------------------------------------------------------------------------------------------------------
function CParagraphSearchElement(StartPos, EndPos, Type, Id)
{
    this.StartPos  = StartPos;
    this.EndPos    = EndPos;
    this.Type      = Type;
    this.ResultStr = "";
    this.Id        = Id;

    this.ClassesS = [];
    this.ClassesE = [];
}

//----------------------------------------------------------------------------------------------------------------------
// CDocumentSearch
//         Механизм поиска. Хранит параграфы с найденной строкой
//----------------------------------------------------------------------------------------------------------------------
function CDocumentSearch()
{
    this.Text          = "";
    this.MatchCase     = false;

    this.Id            = 0;
    this.Count         = 0;
    this.Elements      = [];
    this.CurId         = -1;
    this.Direction     = true; // направление true - вперед, false - назад
    this.ClearOnRecalc = true; // Флаг, говорящий о том, запустился ли пересчет из-за Replace
    this.Selection     = false;
    this.Footnotes     = [];
}

CDocumentSearch.prototype =
{
    Set : function(Text, Props)
    {
        this.Text      = Text;
        this.MatchCase = Props.MatchCase;
    },

    Reset : function()
    {
        this.Text          = "";
        this.MatchCase     = false;
    },

    Compare : function(Text, Props)
    {
        if ( this.Text === Text && this.MatchCase === Props.MatchCase )
            return true;

        return false;
    },

    Clear : function()
    {
        this.Text        = "";
        this.MatchCase   = false;

        // Очищаем предыдущие элементы поиска
        for (var Id in this.Elements)
        {
            var Paragraph = this.Elements[Id];
            Paragraph.Clear_SearchResults();
        }

        this.Id        = 0;
        this.Count     = 0;
        this.Elements  = {};
        this.CurId     = -1;
        this.Direction = true;
    },

    Add : function(Paragraph)
    {
        this.Count++;
        this.Id++;
        this.Elements[this.Id] = Paragraph;
        return this.Id;
    },

    Select : function(Id, bUpdateStates)
    {
        var Paragraph = this.Elements[Id];
        if ( undefined != Paragraph )
        {
            var SearchElement = Paragraph.SearchResults[Id];
            if ( undefined != SearchElement )
            {
                Paragraph.Selection.Use      = true;
                Paragraph.Selection.Start    = false;

                Paragraph.Set_SelectionContentPos(SearchElement.StartPos, SearchElement.EndPos);
                Paragraph.Set_ParaContentPos(SearchElement.StartPos, false, -1, -1);

                Paragraph.Document_SetThisElementCurrent(false !== bUpdateStates ? true : false);
            }

            this.CurId = Id;
        }
    },

    Reset_Current : function()
    {
        this.CurId = -1;
    },

    Replace : function(sReplaceString, Id, bRestorePos)
	{
		var oPara = this.Elements[Id];
		if (oPara)
		{
			var oLogicDocument   = oPara.LogicDocument;
			var isTrackRevisions = oLogicDocument ? oLogicDocument.IsTrackRevisions() : false;

			var SearchElement = oPara.SearchResults[Id];
			if (undefined != SearchElement)
			{
				var ContentPos, StartPos, EndPos, bSelection;
				if (true === bRestorePos)
				{
					// Сохраняем позицию состояние параграфа, чтобы курсор остался в том же месте и после замены.
					bSelection = oPara.IsSelectionUse();
					ContentPos = oPara.Get_ParaContentPos(false, false);
					StartPos   = oPara.Get_ParaContentPos(true, true);
					EndPos     = oPara.Get_ParaContentPos(true, false);

					oPara.Check_NearestPos({ContentPos : ContentPos});
					oPara.Check_NearestPos({ContentPos : StartPos});
					oPara.Check_NearestPos({ContentPos : EndPos});
				}

				if (isTrackRevisions)
				{
					// Встанем в конечную позицию поиска и добавим новый текст
					var oEndContentPos = SearchElement.EndPos;
					var oEndRun        = SearchElement.ClassesE[SearchElement.ClassesE.length - 1];

					var nRunPos = oEndContentPos.Get(SearchElement.ClassesE.length - 1);

					if (reviewtype_Add === oEndRun.GetReviewType() && oEndRun.GetReviewInfo().IsCurrentUser())
					{
						oEndRun.AddText(sReplaceString, nRunPos);
					}
					else
					{
						var oRunParent      = oEndRun.GetParent();
						var nRunPosInParent = oEndRun.GetPosInParent(oRunParent);
						var oReplaceRun     = oEndRun.Split2(nRunPos, oRunParent, nRunPosInParent);

						if (!oReplaceRun.IsEmpty())
							oReplaceRun.Split2(0, oRunParent, nRunPosInParent + 1);

						oReplaceRun.AddText(sReplaceString, 0);
						oReplaceRun.SetReviewType(reviewtype_Add);

						// Выделяем старый объект поиска и удаляем его
						oPara.Selection.Use = true;
						oPara.Set_SelectionContentPos(SearchElement.StartPos, SearchElement.EndPos);
						oPara.Remove();
					}
				}
				else
				{
					// Сначала в начальную позицию поиска добавляем новый текст
					var StartContentPos = SearchElement.StartPos;
					var StartRun        = SearchElement.ClassesS[SearchElement.ClassesS.length - 1];

					var RunPos = StartContentPos.Get(SearchElement.ClassesS.length - 1);
					StartRun.AddText(sReplaceString, RunPos);
				}

				// Выделяем старый объект поиска и удаляем его
				oPara.Selection.Use = true;
				oPara.Set_SelectionContentPos(SearchElement.StartPos, SearchElement.EndPos);
				oPara.Remove();

				// Перемещаем курсор в конец поиска
				oPara.RemoveSelection();
				oPara.Set_ParaContentPos(SearchElement.StartPos, true, -1, -1);

				// Удаляем запись о данном элементе
				this.Count--;

				oPara.Remove_SearchResult(Id);
				delete this.Elements[Id];

				if (true === bRestorePos)
				{
					oPara.Set_SelectionContentPos(StartPos, EndPos);
					oPara.Set_ParaContentPos(ContentPos, true, -1, -1);
					oPara.Selection.Use = bSelection;
					oPara.Clear_NearestPosArray();
				}
			}
		}
	},

    Replace_All : function(NewStr, bUpdateStates)
    {
        for (var Id = this.Id; Id >= 0; --Id)
        {
            if (this.Elements[Id])
                this.Replace(NewStr, Id, true);
        }

        this.Clear();
    },

    Set_Direction : function(bDirection)
    {
        this.Direction = bDirection;
    }
};
CDocumentSearch.prototype.SetFootnotes = function(arrFootnotes)
{
	this.Footnotes = arrFootnotes;
};
CDocumentSearch.prototype.GetFootnotes = function()
{
	return this.Footnotes;
};
CDocumentSearch.prototype.GetDirection = function()
{
	return this.Direction;
};
CDocumentSearch.prototype.SetDirection = function(bDirection)
{
	this.Direction = bDirection;
};
//----------------------------------------------------------------------------------------------------------------------
// CDocument
//----------------------------------------------------------------------------------------------------------------------
CDocument.prototype.Search = function(Str, Props, bDraw)
{
    //var StartTime = new Date().getTime();

    if ( true === this.SearchEngine.Compare( Str, Props ) )
        return this.SearchEngine;

    this.SearchEngine.Clear();
    this.SearchEngine.Set( Str, Props );

    // Поиск в основном документе
    var Count = this.Content.length;
    for ( var Index = 0; Index < Count; Index++ )
    {
        this.Content[Index].Search( Str, Props, this.SearchEngine, search_Common );
    }

    // Поиск в колонтитулах
    this.SectionsInfo.Search( Str, Props, this.SearchEngine );

    // Ищем в сносках
	var arrFootnotes = this.GetFootnotesList(null, null);
	this.SearchEngine.SetFootnotes(arrFootnotes);
	for (var nIndex = 0, nCount = arrFootnotes.length; nIndex < nCount; ++nIndex)
	{
		var oFootnote = arrFootnotes[nIndex];
		oFootnote.Search(Str, Props, this.SearchEngine, search_Footnote);
	}

    if (false !== bDraw)
    {
        this.DrawingDocument.ClearCachePages();
        this.DrawingDocument.FirePaint();
    }

    //console.log( "Search logic: " + ((new Date().getTime() - StartTime) / 1000) + " s"  );

    return this.SearchEngine;
};
CDocument.prototype.Search_Select = function(Id)
{
    this.RemoveSelection();
    this.SearchEngine.Select(Id, true);
    this.RecalculateCurPos();

    this.Document_UpdateInterfaceState();
    this.Document_UpdateSelectionState();
    this.Document_UpdateRulersState();
};
CDocument.prototype.Search_Replace = function(NewStr, bAll, Id, bInterfaceEvent)
{
    var bResult = false;

    var oState = this.SaveDocumentState();

    var arrReplaceId = [];
    if (bAll)
	{
		if (this.StartSelectionLockCheck())
		{
			for (var sElementId in this.SearchEngine.Elements)
			{
				this.Search_Select(sElementId);
				if (!this.ProcessSelectionLockCheck(AscCommon.changestype_Paragraph_Content, true))
					arrReplaceId.push(sElementId);
			}

			if (this.EndSelectionLockCheck())
				arrReplaceId.length = 0;
		}
	}
	else
	{
		this.Search_Select(Id);

		if (this.StartSelectionLockCheck())
		{
			this.ProcessSelectionLockCheck(AscCommon.changestype_Paragraph_Content);
			if (!this.EndSelectionLockCheck())
				arrReplaceId.push(Id);
		}
	}

	var nOverallCount  = this.SearchEngine.Count;
	var nReplacedCount = arrReplaceId.length;

	if (nReplacedCount > 0)
	{
		this.StartAction(bAll ? AscDFH.historydescription_Document_ReplaceAll : AscDFH.historydescription_Document_ReplaceSingle);

		for (var nIndex = 0; nIndex < nReplacedCount; ++nIndex)
		{
			this.SearchEngine.Replace(NewStr, arrReplaceId[nIndex], false);
		}

		this.SearchEngine.ClearOnRecalc = false;
		this.Recalculate(true);
		this.SearchEngine.ClearOnRecalc = true;
		this.FinalizeAction();
	}

	if (bAll && false !== bInterfaceEvent)
		this.Api.sync_ReplaceAllCallback(nReplacedCount, nOverallCount);

	if (nReplacedCount)
		bResult = true;

	this.LoadDocumentState(oState);

    this.Document_UpdateInterfaceState();
    this.Document_UpdateSelectionState();
    this.Document_UpdateRulersState();

    return bResult;
};
CDocument.prototype.Search_GetId = function(bNext)
{
	var Id = null;

	this.SearchEngine.SetDirection(bNext);

	if (docpostype_DrawingObjects === this.CurPos.Type)
	{
		var ParaDrawing = this.DrawingObjects.getMajorParaDrawing();

		Id = ParaDrawing.Search_GetId(bNext, true);
		if (null != Id)
			return Id;

		this.DrawingObjects.resetSelection();
		ParaDrawing.GoTo_Text(true === bNext ? false : true, false);
	}

	if (docpostype_Content === this.CurPos.Type)
	{
		Id = this.private_GetSearchIdInMainDocument(true);

		if (null === Id)
			Id = this.private_GetSearchIdInFootnotes(false);

		if (null === Id)
			Id = this.private_GetSearchIdInHdrFtr(false);

		if (null === Id)
			Id = this.private_GetSearchIdInMainDocument(false);
	}
	else if (docpostype_HdrFtr === this.CurPos.Type)
	{
		Id = this.private_GetSearchIdInHdrFtr(true);

		if (null === Id)
			Id = this.private_GetSearchIdInMainDocument(false);

		if (null === Id)
			Id = this.private_GetSearchIdInFootnotes(false);

		if (null === Id)
			Id = this.private_GetSearchIdInHdrFtr(false);
	}
	else if (docpostype_Footnotes === this.CurPos.Type)
	{
		Id = this.private_GetSearchIdInFootnotes(true);

		if (null === Id)
			Id = this.private_GetSearchIdInHdrFtr(false);

		if (null === Id)
			Id = this.private_GetSearchIdInMainDocument(false);

		if (null === Id)
			Id = this.private_GetSearchIdInFootnotes(false);
	}

	return Id;
};
CDocument.prototype.Search_Set_Selection = function(bSelection)
{
    var OldValue = this.SearchEngine.Selection;
    if ( OldValue === bSelection )
        return;

    this.SearchEngine.Selection = bSelection;
    this.DrawingDocument.ClearCachePages();
    this.DrawingDocument.FirePaint();
};
CDocument.prototype.Search_Get_Selection = function()
{
    return this.SearchEngine.Selection;
};
CDocument.prototype.private_GetSearchIdInMainDocument = function(isCurrent)
{
	var Id    = null;
	var bNext = this.SearchEngine.GetDirection();
	var Pos   = this.CurPos.ContentPos;
	if (true === this.Selection.Use && selectionflag_Common === this.Selection.Flag)
		Pos = bNext ? Math.max(this.Selection.StartPos, this.Selection.EndPos) : Math.min(this.Selection.StartPos, this.Selection.EndPos);

	if (true !== isCurrent)
		Pos = bNext ? 0 : this.Content.length - 1;

	if (true === bNext)
	{
		Id = this.Content[Pos].Search_GetId(true, isCurrent);

		if (null != Id)
			return Id;

		Pos++;

		var Count = this.Content.length;
		while (Pos < Count)
		{
			Id = this.Content[Pos].Search_GetId(true, false);

			if (null != Id)
				return Id;

			Pos++;
		}
	}
	else
	{
		Id = this.Content[Pos].Search_GetId(false, isCurrent);

		if (null != Id)
			return Id;

		Pos--;

		while (Pos >= 0)
		{
			Id = this.Content[Pos].Search_GetId(false, false);

			if (null != Id)
				return Id;

			Pos--;
		}
	}

	return Id;
};
CDocument.prototype.private_GetSearchIdInHdrFtr = function(isCurrent)
{
	return this.SectionsInfo.Search_GetId(this.SearchEngine.GetDirection(), isCurrent ? this.HdrFtr.CurHdrFtr : null);
};
CDocument.prototype.private_GetSearchIdInFootnotes = function(isCurrent)
{
	var bNext        = this.SearchEngine.GetDirection();
	var oCurFootnote = this.Footnotes.CurFootnote;

	var arrFootnotes = this.SearchEngine.GetFootnotes();
	var nCurPos      = -1;
	var nCount       = arrFootnotes.length;

	if (nCount <= 0)
		return null;

	if (isCurrent)
	{
		for (var nIndex = 0; nIndex < nCount; ++nIndex)
		{
			if (arrFootnotes[nIndex] === oCurFootnote)
			{
				nCurPos = nIndex;
				break;
			}
		}
	}

	if (-1 == nCurPos)
	{
		nCurPos      = bNext ? 0 : nCount - 1;
		oCurFootnote = arrFootnotes[nCurPos];
		isCurrent    = false;
	}

	var Id = oCurFootnote.Search_GetId(bNext, isCurrent);
	if (null !== Id)
		return Id;

	if (true === bNext)
	{
		for (var nIndex = nCurPos + 1; nIndex < nCount; ++nIndex)
		{
			Id = arrFootnotes[nIndex].Search_GetId(bNext, false);
			if (null != Id)
				return Id;
		}
	}
	else
	{
		for (var nIndex = nCurPos - 1; nIndex >= 0; --nIndex)
		{
			Id = arrFootnotes[nIndex].Search_GetId(bNext, false);
			if (null != Id)
				return Id;
		}
	}

	return null;
};
//----------------------------------------------------------------------------------------------------------------------
// CDocumentContent
//----------------------------------------------------------------------------------------------------------------------
CDocumentContent.prototype.Search = function(Str, Props, SearchEngine, Type)
{
    // Поиск в основном документе
    var Count = this.Content.length;
    for ( var Index = 0; Index < Count; Index++ )
    {
        this.Content[Index].Search( Str, Props, SearchEngine, Type );
    }
};

CDocumentContent.prototype.Search_GetId = function(bNext, bCurrent)
{
    // Получим Id найденного элемента
    var Id = null;

    if ( true === bCurrent )
    {
        if ( docpostype_DrawingObjects === this.CurPos.Type )
        {
            var ParaDrawing = this.DrawingObjects.getMajorParaDrawing();

            Id = ParaDrawing.Search_GetId( bNext, true );
            if ( null != Id )
                return Id;

            ParaDrawing.GoTo_Text( true === bNext ? false : true, false );
        }

        var Pos = this.CurPos.ContentPos;
        if ( true === this.Selection.Use && selectionflag_Common === this.Selection.Flag )
            Pos = ( true === bNext ? Math.max(this.Selection.StartPos, this.Selection.EndPos) : Math.min(this.Selection.StartPos, this.Selection.EndPos) );

        if ( true === bNext )
        {
            Id = this.Content[Pos].Search_GetId(true, true);

            if ( null != Id )
                return Id;

            Pos++;

            var Count = this.Content.length;
            while ( Pos < Count )
            {
                Id = this.Content[Pos].Search_GetId(true, false);
                if ( null != Id )
                    return Id;

                Pos++;
            }
        }
        else
        {
            Id = this.Content[Pos].Search_GetId(false, true);

            if ( null != Id )
                return Id;

            Pos--;

            while ( Pos >= 0 )
            {
                Id = this.Content[Pos].Search_GetId(false, false);
                if ( null != Id )
                    return Id;

                Pos--;
            }
        }
    }
    else
    {
        var Count = this.Content.length;
        if ( true === bNext )
        {
            var Pos = 0;
            while ( Pos < Count )
            {
                Id = this.Content[Pos].Search_GetId(true, false);
                if ( null != Id )
                    return Id;

                Pos++;
            }
        }
        else
        {
            var Pos = Count - 1;
            while ( Pos >= 0 )
            {
                Id = this.Content[Pos].Search_GetId(false, false);
                if ( null != Id )
                    return Id;

                Pos--;
            }
        }
    }

    return null;
};

//----------------------------------------------------------------------------------------------------------------------
// CHeaderFooter
//----------------------------------------------------------------------------------------------------------------------
CHeaderFooter.prototype.Search = function(Str, Props, SearchEngine, Type)
{
    this.Content.Search( Str, Props, SearchEngine, Type );
};

CHeaderFooter.prototype.Search_GetId = function(bNext, bCurrent)
{
    return this.Content.Search_GetId( bNext, bCurrent );
};

//----------------------------------------------------------------------------------------------------------------------
// CDocumentSectionsInfo
//----------------------------------------------------------------------------------------------------------------------
CDocumentSectionsInfo.prototype.Search = function(Str, Props, SearchEngine)
{
    var bEvenOdd = EvenAndOddHeaders;
    var Count = this.Elements.length;
    for ( var Index = 0; Index < Count; Index++ )
    {
        var SectPr = this.Elements[Index].SectPr;
        var bFirst = SectPr.Get_TitlePage();
        
        if ( null != SectPr.HeaderFirst && true === bFirst )
            SectPr.HeaderFirst.Search( Str, Props, SearchEngine, search_Header );

        if ( null != SectPr.HeaderEven && true === bEvenOdd )
            SectPr.HeaderEven.Search( Str, Props, SearchEngine, search_Header );

        if ( null != SectPr.HeaderDefault )
            SectPr.HeaderDefault.Search( Str, Props, SearchEngine, search_Header );

        if ( null != SectPr.FooterFirst && true === bFirst )
            SectPr.FooterFirst.Search( Str, Props, SearchEngine, search_Footer );

        if ( null != SectPr.FooterEven && true === bEvenOdd )
            SectPr.FooterEven.Search( Str, Props, SearchEngine, search_Footer );

        if ( null != SectPr.FooterDefault )
            SectPr.FooterDefault.Search( Str, Props, SearchEngine, search_Footer );                
    }            
};

CDocumentSectionsInfo.prototype.Search_GetId = function(bNext, CurHdrFtr)
{
	var HdrFtrs = [];
	var CurPos  = -1;

	var bEvenOdd = EvenAndOddHeaders;
	var Count    = this.Elements.length;
	for (var Index = 0; Index < Count; Index++)
	{
		var SectPr = this.Elements[Index].SectPr;
		var bFirst = SectPr.Get_TitlePage();

		if (null != SectPr.HeaderFirst && true === bFirst)
		{
			HdrFtrs.push(SectPr.HeaderFirst);

			if (CurHdrFtr === SectPr.HeaderFirst)
				CurPos = HdrFtrs.length - 1;
		}

		if (null != SectPr.HeaderEven && true === bEvenOdd)
		{
			HdrFtrs.push(SectPr.HeaderEven);

			if (CurHdrFtr === SectPr.HeaderEven)
				CurPos = HdrFtrs.length - 1;
		}

		if (null != SectPr.HeaderDefault)
		{
			HdrFtrs.push(SectPr.HeaderDefault);

			if (CurHdrFtr === SectPr.HeaderDefault)
				CurPos = HdrFtrs.length - 1;
		}

		if (null != SectPr.FooterFirst && true === bFirst)
		{
			HdrFtrs.push(SectPr.FooterFirst);

			if (CurHdrFtr === SectPr.FooterFirst)
				CurPos = HdrFtrs.length - 1;
		}

		if (null != SectPr.FooterEven && true === bEvenOdd)
		{
			HdrFtrs.push(SectPr.FooterEven);

			if (CurHdrFtr === SectPr.FooterEven)
				CurPos = HdrFtrs.length - 1;
		}

		if (null != SectPr.FooterDefault)
		{
			HdrFtrs.push(SectPr.FooterDefault);

			if (CurHdrFtr === SectPr.FooterDefault)
				CurPos = HdrFtrs.length - 1;
		}
	}

	var Count = HdrFtrs.length;

	var isCurrent = true;
	if (-1 === CurPos)
	{
		isCurrent = false;
		CurPos    = bNext ? 0 : HdrFtrs.length - 1;
		if (HdrFtrs[CurPos])
			CurHdrFtr = HdrFtrs[CurPos];
	}

	if (CurPos >= 0 && CurPos <= HdrFtrs.length - 1)
	{
		var Id = CurHdrFtr.Search_GetId(bNext, isCurrent);
		if (null != Id)
			return Id;

		if (true === bNext)
		{
			for (var Index = CurPos + 1; Index < Count; Index++)
			{
				Id = HdrFtrs[Index].Search_GetId(bNext, false);

				if (null != Id)
					return Id;
			}
		}
		else
		{
			for (var Index = CurPos - 1; Index >= 0; Index--)
			{
				Id = HdrFtrs[Index].Search_GetId(bNext, false);

				if (null != Id)
					return Id;
			}
		}
	}

	return null;
};
//----------------------------------------------------------------------------------------------------------------------
// CTable
//----------------------------------------------------------------------------------------------------------------------
CTable.prototype.Search = function(Str, Props, SearchEngine, Type)
{
    for ( var CurRow = 0; CurRow < this.Content.length; CurRow++ )
    {
        var Row = this.Content[CurRow];
        var CellsCount = Row.Get_CellsCount();

        for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
        {
            Row.Get_Cell( CurCell ).Content.Search( Str, Props, SearchEngine, Type );
        }
    }
};

CTable.prototype.Search_GetId = function(bNext, bCurrent)
{
    if ( true === bCurrent )
    {
        var Id = null;
        var CurRow  = 0;
        var CurCell = 0;
        if ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type )
        {
            var Pos = ( true === bNext ? this.Selection.Data[this.Selection.Data.length - 1] : this.Selection.Data[0] );
            CurRow  = Pos.Row;
            CurCell = Pos.CurCell;
        }
        else
        {
            Id = this.CurCell.Content.Search_GetId(bNext, true);
            if ( Id != null )
                return Id;

            CurRow  = this.CurCell.Row.Index;
            CurCell = this.CurCell.Index;
        }

        var Rows_Count = this.Content.length;
        if ( true === bNext )
        {
            for ( var _CurRow = CurRow; _CurRow < Rows_Count; _CurRow++ )
            {
                var Row = this.Content[_CurRow];
                var Cells_Count = Row.Get_CellsCount();
                var StartCell = ( _CurRow === CurRow ? CurCell + 1 : 0 );
                for ( var _CurCell = StartCell; _CurCell < Cells_Count; _CurCell++ )
                {
                    var Cell = Row.Get_Cell(_CurCell);
                    Id = Cell.Content.Search_GetId( true, false );
                    if ( null != Id )
                        return Id;
                }
            }
        }
        else
        {
            for ( var _CurRow = CurRow; _CurRow >= 0; _CurRow-- )
            {
                var Row = this.Content[_CurRow];
                var Cells_Count = Row.Get_CellsCount();
                var StartCell = ( _CurRow === CurRow ? CurCell - 1 : Cells_Count - 1 );
                for ( var _CurCell = StartCell; _CurCell >= 0; _CurCell-- )
                {
                    var Cell = Row.Get_Cell(_CurCell);
                    Id = Cell.Content.Search_GetId( false, false );
                    if ( null != Id )
                        return Id;
                }
            }

        }
    }
    else
    {
        var Rows_Count = this.Content.length;
        if ( true === bNext )
        {
            for ( var _CurRow = 0; _CurRow < Rows_Count; _CurRow++ )
            {
                var Row = this.Content[_CurRow];
                var Cells_Count = Row.Get_CellsCount();
                for ( var _CurCell = 0; _CurCell < Cells_Count; _CurCell++ )
                {
                    var Cell = Row.Get_Cell(_CurCell);
                    Id = Cell.Content.Search_GetId( true, false );
                    if ( null != Id )
                        return Id;
                }
            }
        }
        else
        {
            for ( var _CurRow = Rows_Count - 1; _CurRow >= 0; _CurRow-- )
            {
                var Row = this.Content[_CurRow];
                var Cells_Count = Row.Get_CellsCount();
                for ( var _CurCell = Cells_Count - 1; _CurCell >= 0; _CurCell-- )
                {
                    var Cell = Row.Get_Cell(_CurCell);
                    Id = Cell.Content.Search_GetId( false, false );
                    if ( null != Id )
                        return Id;
                }
            }

        }
    }

    return Id;
};
//----------------------------------------------------------------------------------------------------------------------
// Paragraph
//----------------------------------------------------------------------------------------------------------------------
Paragraph.prototype.Search = function(Str, Props, SearchEngine, Type)
{
    var bMatchCase = Props.MatchCase;
    var ParaSearch = new CParagraphSearch(this, Str, Props, SearchEngine, Type);
    var ContentLen = this.Content.length;
    for ( var CurPos = 0; CurPos < ContentLen; CurPos++ )
    {
        var Element = this.Content[CurPos];

        ParaSearch.ContentPos.Update( CurPos, 0 );

        Element.Search( ParaSearch, 1 );
    }

    var MaxShowValue = 100;
    for ( var FoundId in this.SearchResults )
    {
        var StartPos = this.SearchResults[FoundId].StartPos;
        var EndPos   = this.SearchResults[FoundId].EndPos;
        var ResultStr = new String();

        var _Str = Str;

        // Теперь мы должны сформировать строку
        if ( _Str.length >= MaxShowValue )
        {
            ResultStr = "\<b\>";
            for ( var Index = 0; Index < MaxShowValue - 1; Index++ )
                ResultStr += _Str[Index];

            ResultStr += "\</b\>...";
        }
        else
        {
            ResultStr = "\<b\>" + _Str + "\</b\>";

            var LeaveCount = MaxShowValue - _Str.length;
            var RunElementsAfter  = new CParagraphRunElements(EndPos, LeaveCount, [para_Text, para_Space, para_Tab]);
            var RunElementsBefore = new CParagraphRunElements(StartPos, LeaveCount, [para_Text, para_Space, para_Tab]);

            this.GetNextRunElements(RunElementsAfter);
            this.GetPrevRunElements(RunElementsBefore);

            var LeaveCount_2 = LeaveCount / 2;

            if ( RunElementsAfter.Elements.length >= LeaveCount_2 && RunElementsBefore.Elements.length >= LeaveCount_2 )
            {
                for ( var Index = 0; Index < LeaveCount_2; Index++ )
                {
                    var ItemB = RunElementsBefore.Elements[Index];
                    var ItemA = RunElementsAfter.Elements[Index];

                    ResultStr = (para_Text === ItemB.Type ? ItemB.Value : " ") + ResultStr + (para_Text === ItemA.Type ? ItemA.Value : " ");
                }
            }
            else if ( RunElementsAfter.Elements.length < LeaveCount_2 )
            {
                var TempCount = RunElementsAfter.Elements.length;
                for ( var Index = 0; Index < TempCount; Index++ )
                {
                    var ItemA = RunElementsAfter.Elements[Index];
                    ResultStr = ResultStr + (para_Text === ItemA.Type ? ItemA.Value : " ");
                }

                var TempCount = Math.min( 2 * LeaveCount_2 - RunElementsAfter.Elements.length, RunElementsBefore.Elements.length );
                for ( var Index = 0; Index < TempCount; Index++ )
                {
                    var ItemB = RunElementsBefore.Elements[Index];
                    ResultStr = (para_Text === ItemB.Type ? ItemB.Value : " ") + ResultStr;
                }
            }
            else
            {
                var TempCount = RunElementsAfter.Elements.length;
                for ( var Index = 0; Index < TempCount; Index++ )
                {
                    var ItemA = RunElementsAfter.Elements[Index];
                    ResultStr = ResultStr + (para_Text === ItemA.Type ? ItemA.Value : " ");
                }

                var TempCount = RunElementsBefore.Elements.length;
                for ( var Index = 0; Index < TempCount; Index++ )
                {
                    var ItemB = RunElementsBefore.Elements[Index];
                    ResultStr = (para_Text === ItemB.Type ? ItemB.Value : " ") + ResultStr;
                }
            }
        }

        this.SearchResults[FoundId].ResultStr = ResultStr;
    }
};

Paragraph.prototype.Search_GetId = function(bNext, bCurrent)
{
    // Определим позицию, начиная с которой мы будем искать ближайший найденный элемент
    var ContentPos = null;

    if ( true === bCurrent )
    {
        if ( true === this.Selection.Use )
        {
            var SSelContentPos = this.Get_ParaContentPos( true, true );
            var ESelContentPos = this.Get_ParaContentPos( true, false );

            if ( SSelContentPos.Compare( ESelContentPos ) > 0 )
            {
                var Temp = ESelContentPos;
                ESelContentPos = SSelContentPos;
                SSelContentPos = Temp;
            }

            if ( true === bNext )
                ContentPos = ESelContentPos;
            else
                ContentPos = SSelContentPos;
        }
        else
            ContentPos = this.Get_ParaContentPos( false, false );
    }
    else
    {
        if ( true === bNext )
            ContentPos = this.Get_StartPos();
        else
            ContentPos = this.Get_EndPos( false );
    }

    // Производим поиск ближайшего элемента
    if ( true === bNext )
    {
        var StartPos = ContentPos.Get(0);
        var ContentLen = this.Content.length;

        for ( var CurPos = StartPos; CurPos < ContentLen; CurPos++ )
        {
            var ElementId = this.Content[CurPos].Search_GetId( true, CurPos === StartPos ? true : false, ContentPos, 1 );
            if ( null !== ElementId )
                return ElementId;
        }
    }
    else
    {
        var StartPos = ContentPos.Get(0);
        var ContentLen = this.Content.length;

        for ( var CurPos = StartPos; CurPos >= 0; CurPos-- )
        {
            var ElementId = this.Content[CurPos].Search_GetId( false, CurPos === StartPos ? true : false, ContentPos, 1 );
            if ( null !== ElementId )
                return ElementId;
        }
    }

    return null;
};

Paragraph.prototype.Add_SearchResult = function(Id, StartContentPos, EndContentPos, Type)
{
    var SearchResult = new CParagraphSearchElement( StartContentPos, EndContentPos, Type, Id );

    this.SearchResults[Id] = SearchResult;

    SearchResult.ClassesS.push( this );
    SearchResult.ClassesE.push( this );

    this.Content[StartContentPos.Get(0)].Add_SearchResult( SearchResult, true, StartContentPos, 1 );
    this.Content[EndContentPos.Get(0)].Add_SearchResult( SearchResult, false, EndContentPos, 1 );
};

Paragraph.prototype.Clear_SearchResults = function()
{
    for ( var Id in this.SearchResults )
    {
        var SearchResult = this.SearchResults[Id];

        var ClassesCount = SearchResult.ClassesS.length;
        for ( var Pos = 1; Pos < ClassesCount; Pos++ )
        {
            SearchResult.ClassesS[Pos].Clear_SearchResults();
        }

        var ClassesCount = SearchResult.ClassesE.length;
        for ( var Pos = 1; Pos < ClassesCount; Pos++ )
        {
            SearchResult.ClassesE[Pos].Clear_SearchResults();
        }
    }

    this.SearchResults = {};
};

Paragraph.prototype.Remove_SearchResult = function(Id)
{
    var SearchResult = this.SearchResults[Id];
    if ( undefined !== SearchResult )
    {
        var ClassesCount = SearchResult.ClassesS.length;
        for ( var Pos = 1; Pos < ClassesCount; Pos++ )
        {
            SearchResult.ClassesS[Pos].Remove_SearchResult(SearchResult);
        }

        var ClassesCount = SearchResult.ClassesE.length;
        for ( var Pos = 1; Pos < ClassesCount; Pos++ )
        {
            SearchResult.ClassesE[Pos].Remove_SearchResult(SearchResult);
        }

        delete this.SearchResults[Id];
    }
};

//----------------------------------------------------------------------------------------------------------------------
// ParaRun
//----------------------------------------------------------------------------------------------------------------------
ParaRun.prototype.Search = function(ParaSearch, Depth)
{
    this.SearchMarks = [];

    var Para         = ParaSearch.Paragraph;
    var Str          = ParaSearch.Str;
    var Props        = ParaSearch.Props;
    var SearchEngine = ParaSearch.SearchEngine;
    var Type         = ParaSearch.Type;

    var MatchCase    = Props.MatchCase;

    var ContentLen = this.Content.length;

    for ( var Pos = 0; Pos < ContentLen; Pos++ )
    {
        var Item = this.Content[Pos];

        if ( para_Drawing === Item.Type )
        {
            Item.Search( Str, Props, SearchEngine, Type );
            ParaSearch.Reset();
        }

        if ( (" " === Str[ParaSearch.SearchIndex] && para_Space === Item.Type)|| (para_Math_Text == Item.Type && Item.value === Str.charCodeAt(ParaSearch.SearchIndex)) || ( para_Text === Item.Type && (  ( true != MatchCase && (String.fromCharCode(Item.Value)).toLowerCase() === Str[ParaSearch.SearchIndex].toLowerCase() ) || ( true === MatchCase && Item.Value === Str.charCodeAt(ParaSearch.SearchIndex) ) ) ) )
        {
            if ( 0 === ParaSearch.SearchIndex )
            {
                var StartContentPos = ParaSearch.ContentPos.Copy();
                StartContentPos.Update( Pos, Depth );
                ParaSearch.StartPos = StartContentPos;
            }

            ParaSearch.SearchIndex++;

            if ( ParaSearch.SearchIndex === Str.length )
            {
                var EndContentPos = ParaSearch.ContentPos.Copy();
                EndContentPos.Update( Pos + 1, Depth );

                var Id = SearchEngine.Add( Para );
                Para.Add_SearchResult( Id, ParaSearch.StartPos, EndContentPos, Type );

                // Обнуляем поиск
                ParaSearch.Reset();
            }
        }
        else if ( 0 !== ParaSearch.SearchIndex )
        {
            // Обнуляем поиск
            ParaSearch.Reset();
        }
    }
};

ParaRun.prototype.Add_SearchResult = function(SearchResult, Start, ContentPos, Depth)
{
    if ( true === Start )
        SearchResult.ClassesS.push( this );
    else
        SearchResult.ClassesE.push( this );

    this.SearchMarks.push( new CParagraphSearchMark( SearchResult, Start, Depth ) );
};

ParaRun.prototype.Clear_SearchResults = function()
{
    this.SearchMarks = [];
};

ParaRun.prototype.Remove_SearchResult = function(SearchResult)
{
    var MarksCount = this.SearchMarks.length;
    for ( var Index = 0; Index < MarksCount; Index++ )
    {
        var Mark = this.SearchMarks[Index];
        if ( SearchResult === Mark.SearchResult )
        {
            this.SearchMarks.splice( Index, 1 );
            Index--;
            MarksCount--;
        }
    }
};

ParaRun.prototype.Search_GetId = function(bNext, bUseContentPos, ContentPos, Depth)
{
    var StartPos = 0;

    if ( true === bUseContentPos )
    {
        StartPos = ContentPos.Get( Depth );
    }
    else
    {
        if ( true === bNext )
        {
            StartPos = 0;
        }
        else
        {
            StartPos = this.Content.length;
        }
    }

    var NearElementId = null;

    if ( true === bNext )
    {
        var NearPos = this.Content.length;

        var SearchMarksCount = this.SearchMarks.length;
        for ( var SPos = 0; SPos < SearchMarksCount; SPos++)
        {
            var Mark = this.SearchMarks[SPos];
            var MarkPos = Mark.SearchResult.StartPos.Get(Mark.Depth);

            if (Mark.SearchResult.ClassesS.length > 0 && this === Mark.SearchResult.ClassesS[Mark.SearchResult.ClassesS.length - 1] && MarkPos >= StartPos && MarkPos < NearPos)
            {
                NearElementId = Mark.SearchResult.Id;
                NearPos       = MarkPos;
            }
        }

        for ( var CurPos = StartPos; CurPos < NearPos; CurPos++ )
        {
            var Item = this.Content[CurPos];
            if ( para_Drawing === Item.Type )
            {
                var TempElementId = Item.Search_GetId( true, false );
                if ( null != TempElementId )
                    return TempElementId;
            }
        }
    }
    else
    {
        var NearPos = -1;

        var SearchMarksCount = this.SearchMarks.length;
        for ( var SPos = 0; SPos < SearchMarksCount; SPos++)
        {
            var Mark = this.SearchMarks[SPos];
            var MarkPos = Mark.SearchResult.StartPos.Get(Mark.Depth);

            if (Mark.SearchResult.ClassesS.length > 0 && this === Mark.SearchResult.ClassesS[Mark.SearchResult.ClassesS.length - 1] && MarkPos < StartPos && MarkPos > NearPos)
            {
                NearElementId = Mark.SearchResult.Id;
                NearPos       = MarkPos;
            }
        }

        StartPos = Math.min( this.Content.length - 1, StartPos - 1 );
        for ( var CurPos = StartPos; CurPos > NearPos; CurPos-- )
        {
            var Item = this.Content[CurPos];
            if ( para_Drawing === Item.Type )
            {
                var TempElementId = Item.Search_GetId( false, false );
                if ( null != TempElementId )
                    return TempElementId;
            }
        }

    }

    return NearElementId;
};
//----------------------------------------------------------------------------------------------------------------------
// ParaMath
//----------------------------------------------------------------------------------------------------------------------
ParaMath.prototype.Search = function(ParaSearch, Depth)
{
    // Обнуляем поиск
    //ParaSearch.Reset();

    this.SearchMarks = [];
    this.Root.Search(ParaSearch, Depth);


};

ParaMath.prototype.Add_SearchResult = function(SearchResult, Start, ContentPos, Depth)
{
    this.Root.Add_SearchResult(SearchResult, Start, ContentPos, Depth);
};

ParaMath.prototype.Clear_SearchResults = function()
{
    this.Root.Clear_SearchResults();
};

ParaMath.prototype.Remove_SearchResult = function(SearchResult)
{
    this.Root.Remove_SearchResult(SearchResult);
};

ParaMath.prototype.Search_GetId = function(bNext, bUseContentPos, ContentPos, Depth)
{
    return this.Root.Search_GetId(bNext, bUseContentPos, ContentPos, Depth);
    //return null;
};
//----------------------------------------------------------------------------------------------------------------------
// CBLockLevelSdt
//----------------------------------------------------------------------------------------------------------------------
CBlockLevelSdt.prototype.Search = function(Str, Props, SearchEngine, Type)
{
	this.Content.Search(Str, Props, SearchEngine, Type);
};
CBlockLevelSdt.prototype.Search_GetId = function(bNext, bCurrent)
{
	return this.Content.Search_GetId(bNext, bCurrent);
};

//----------------------------------------------------------------------------------------------------------------------
// Вспомогательные классы для поиска внутри параграфа
//----------------------------------------------------------------------------------------------------------------------
function CParagraphSearch(Paragraph, Str, Props, SearchEngine, Type)
{
    this.Paragraph    = Paragraph;
    this.Str          = Str;
    this.Props        = Props;
    this.SearchEngine = SearchEngine;
    this.Type         = Type;

    this.ContentPos   = new CParagraphContentPos();

    this.StartPos     = null; // Запоминаем здесь стартовую позицию поиска
    this.SearchIndex  = 0;    // Номер символа, с которым мы проверяем совпадение
}

CParagraphSearch.prototype =
{
    Reset : function()
    {
        this.StartPos    = null;
        this.SearchIndex = 0;
    }
};

function CParagraphSearchMark(SearchResult, Start, Depth)
{
    this.SearchResult = SearchResult;
    this.Start        = Start;
    this.Depth        = Depth;
}
