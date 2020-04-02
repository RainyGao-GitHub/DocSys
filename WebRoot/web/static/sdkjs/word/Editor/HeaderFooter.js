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
var hdrftr_Header = AscCommon.hdrftr_Header;
var hdrftr_Footer = AscCommon.hdrftr_Footer;
var g_oTableId = AscCommon.g_oTableId;
var History = AscCommon.History;

//-----------------------------------------------------------------------------------
// Класс работающий с одним колонтитулом
//-----------------------------------------------------------------------------------
function CHeaderFooter(Parent, LogicDocument, DrawingDocument, Type)
{
    this.Id = AscCommon.g_oIdCounter.Get_NewId();

    this.Parent          = Parent;
    this.DrawingDocument = DrawingDocument;
    this.LogicDocument   = LogicDocument;

    // Содержимое колонтитула

    if ( "undefined" != typeof(LogicDocument) && null != LogicDocument )
    {
        if ( Type === hdrftr_Header )
        {
            this.Content = new CDocumentContent( this, DrawingDocument, 0, 0, 0, 0, false, true );
            this.Content.Content[0].Style_Add( this.Get_Styles().Get_Default_Header() );
        }
        else
        {
            this.Content = new CDocumentContent( this, DrawingDocument, 0, 0, 0, 0, false, true );
            this.Content.Content[0].Style_Add( this.Get_Styles().Get_Default_Footer() );
        }
    }

    this.Type = Type;

    this.RecalcInfo =
    {
        CurPage       : -1, // Текущий выставленный номер страницы
        RecalcObj     : {}, // Постраничные объекты пересчета данного колонтитула
        NeedRecalc    : {}, // Объект с ключом - номером страницы, нужно ли пересчитывать данную страницу
        PageNumInfo   : {}, // Объект с ключом - номером страницы, значением - информация о нумерации
        SectPr        : {}  // Объект с ключом - номером страницы и полем - ссылкой на секцию
    };

	this.PageCountElements = [];

    // Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
    g_oTableId.Add( this, this.Id );
}

CHeaderFooter.prototype =
{
    Get_Id : function()
    {
        return this.Id;
    },


    Get_Theme: function()
    {
        return this.LogicDocument.Get_Theme();
    },

    Get_ColorMap: function()
    {
        return this.LogicDocument.Get_ColorMap();
    },
    
    Copy : function(oLogicDocument, oCopyPr)
	{
		if (!oLogicDocument)
			oLogicDocument = this.LogicDocument;

		var oNewHdrFtr = new CHeaderFooter(oLogicDocument.GetHdrFtr(), oLogicDocument, oLogicDocument.GetDrawingDocument(), this.Type);
		oNewHdrFtr.Content.Copy2(this.Content, oCopyPr);
		return oNewHdrFtr;
	},

    Set_Page : function(Page_abs)
    {
        if (Page_abs !== this.RecalcInfo.CurPage && undefined !== this.LogicDocument.Pages[Page_abs])
        {
            // Возможна ситуация, когда у нас колонтитул был рассчитан для заданной страницы, но на ней сейчас данный
            // колонтитул не используется. Запрещаем менять у данного колонтитула текущую страницу на заданную.
            var HdrFtrController = this.Parent;
            var HdrFtrPage = this.Parent.Pages[Page_abs];
            if ( undefined === HdrFtrPage || ( this !== HdrFtrPage.Header && this !== HdrFtrPage.Footer ) )
                return;
            
            var RecalcObj = this.RecalcInfo.RecalcObj[Page_abs];
            if ( undefined !== RecalcObj )
            {
                this.RecalcInfo.CurPage = Page_abs;
                this.Content.LoadRecalculateObject( RecalcObj );
            }            
        }        
    },

	Is_NeedRecalculate : function(PageAbs)
	{
		var PageNumInfo = this.LogicDocument.Get_SectionPageNumInfo(PageAbs);

		if (true !== this.RecalcInfo.NeedRecalc[PageAbs] && true === PageNumInfo.Compare(this.RecalcInfo.PageNumInfo[PageAbs]) && undefined !== this.RecalcInfo.RecalcObj[PageAbs])
			return false;

		return true;
	},

    Recalculate : function(Page_abs, SectPr)
    {
        // Логика пересчета колонтитулов следующая:
        // 1. При пересчете страницы каждый раз пересчитывается колонтитул (всмысле заходим в функцию Recalculate,т.е. сюда)
        // 2. Далее мы смотрим, нужно ли вообще пересчитывать данную страницу RecalcInfo.NeedRecalc[Page_abs] если это значение
        //    не false, тогда пересчитывать нужно, а если нет, тогда выходим
        // 3. Если нужно пересчитывать, пересчитываем заново и смотрим, изменились ли границы пересчета и позиции плавающих
        //    картинок, и выставляем RecalcInfo.NeedRecalc[Page_abs] = false.
        
        var bChanges = false;                
        var RecalcObj = this.RecalcInfo.RecalcObj[Page_abs];
        
        var OldSumH    = 0;
        var OldBounds  = null;
        var OldFlowPos = [];
            
        if ( undefined === RecalcObj )
            bChanges = true;
        else
        {
            OldSumH   = RecalcObj.GetSummaryHeight();
            OldBounds = RecalcObj.Get_PageBounds(0);
            RecalcObj.Get_DrawingFlowPos( OldFlowPos );
        }
        
        // Пересчитаем заново данный колонтитул        
        this.Content.Set_StartPage( Page_abs );
        this.Content.PrepareRecalculateObject();

		this.Clear_PageCountElements();

        var CurPage = 0;
        var RecalcResult = recalcresult2_NextPage;
        while ( recalcresult2_End != RecalcResult  )
            RecalcResult = this.Content.Recalculate_Page( CurPage++, true );
        
        this.RecalcInfo.RecalcObj[Page_abs]   = this.Content.SaveRecalculateObject();
        this.RecalcInfo.PageNumInfo[Page_abs] = this.LogicDocument.Get_SectionPageNumInfo(Page_abs);
        this.RecalcInfo.SectPr[Page_abs]      = SectPr;
		this.RecalcInfo.NeedRecalc[Page_abs]  = false;
        
        // Если у нас до этого был какой-то пересчет, тогда сравним его с текущим.
        // 1. Сравним границы: у верхнего колонтитула смотрим на изменение нижней границы, а нижнего - верхней
        // 2. Сравним положение и размер Flow-объектов

        if ( false === bChanges )
        {
            var NewBounds = this.Content.Get_PageBounds( 0 );
            if ( ( Math.abs(NewBounds.Bottom - OldBounds.Bottom) > 0.001 && hdrftr_Header === this.Type ) || ( Math.abs(NewBounds.Top - OldBounds.Top) > 0.001 && hdrftr_Footer === this.Type ) )
                bChanges = true;
        }

        if ( false === bChanges )
        {
            var NewFlowPos = [];
            var AllDrawingObjects = this.Content.GetAllDrawingObjects();
            var Count = AllDrawingObjects.length;

            for ( var Index = 0; Index < Count; Index++ )
            {
                var Obj = AllDrawingObjects[Index];
                if ( drawing_Anchor === Obj.Get_DrawingType() && true === Obj.Use_TextWrap() )
                {
                    var oDistance = Obj.Get_Distance();
                    var FlowPos =
                    {
                        X : Obj.X - oDistance.L,
                        Y : Obj.Y - oDistance.T,
                        W : Obj.Width + oDistance.R,
                        H : Obj.Height + oDistance.B
                    };

                    NewFlowPos.push( FlowPos );
                }
            }

            Count = NewFlowPos.length;
            if ( Count != OldFlowPos.length )
                bChanges = true;
            else
            {
                for ( var Index = 0; Index < Count; Index++ )
                {
                    var OldObj = OldFlowPos[Index];
                    var NewObj = NewFlowPos[Index];
                    if ( Math.abs(OldObj.X - NewObj.X) > 0.001 || Math.abs(OldObj.Y - NewObj.Y) > 0.001 || Math.abs(OldObj.H - NewObj.H) > 0.001 || Math.abs(OldObj.W - NewObj.W) > 0.001 )
                    {
                        bChanges = true;
                        break;
                    }
                }
            }
        }

        if ( false === bChanges )
        {
            var NewSumH = this.Content.GetSummaryHeight();
            if ( Math.abs( OldSumH - NewSumH ) > 0.001 )
                bChanges = true;
        }
        
        // Ежели текущая страница не задана, тогда выставляем ту, которая оказалась пересчитанной первой. В противном
        // случае, выставляем рассчет страницы, которая была до этого.
        if ( -1 === this.RecalcInfo.CurPage || false === this.LogicDocument.Get_SectionPageNumInfo(this.RecalcInfo.CurPage).Compare( this.RecalcInfo.PageNumInfo[this.RecalcInfo.CurPage] ) )
        {
            this.RecalcInfo.CurPage = Page_abs;
            
            if ( docpostype_HdrFtr === this.LogicDocument.GetDocPosType() )
            {
                // Обновляем интерфейс, чтобы обновить настройки колонтитула, т.к. мы могли попасть в новую секцию
                this.LogicDocument.Document_UpdateSelectionState();
                this.LogicDocument.Document_UpdateInterfaceState();
            }
        }
        else            
        {
            var RecalcObj = this.RecalcInfo.RecalcObj[this.RecalcInfo.CurPage];
            this.Content.LoadRecalculateObject( RecalcObj );
        }

        return bChanges;
    },
    
    Recalculate2 : function(Page_abs)
    {
        this.Content.Set_StartPage( Page_abs );
        this.Content.PrepareRecalculateObject();

        var CurPage = 0;
        var RecalcResult = recalcresult2_NextPage;
        while ( recalcresult2_End != RecalcResult  )
            RecalcResult = this.Content.Recalculate_Page( CurPage++, true );
    },

    Reset_RecalculateCache : function()
    {
        this.Refresh_RecalcData2();
        this.Content.Reset_RecalculateCache();
    },

    Get_Styles : function()
    {
        return this.LogicDocument.Get_Styles();
    },

    Get_TableStyleForPara : function()
    {
        return null;
    },

    Get_ShapeStyleForPara: function()
    {
        return null;
    },


    Get_TextBackGroundColor : function()
    {
        return undefined;
    },

    Get_PageContentStartPos : function ()
    {
        return { X : this.Content.X, Y : 0, XLimit : this.Content.XLimit, YLimit : 0 };
    },

    Set_CurrentElement : function(bUpdateStates, PageAbs)
    {
        var PageIndex = -1;

        if (undefined !== PageAbs && null !== PageAbs && this.Parent.Pages[PageAbs])
		{
			if ((this === this.Parent.Pages[PageAbs].Header || this === this.Parent.Pages[PageAbs].Footer))
				PageIndex = PageAbs;
		}

		if (-1 === PageIndex)
		{
			for (var Key in this.Parent.Pages)
			{
				var PIndex = Key | 0;
				if ((this === this.Parent.Pages[PIndex].Header || this === this.Parent.Pages[PIndex].Footer) && (-1 === PageIndex || PageIndex > PIndex))
					PageIndex = PIndex;
			}
		}

        this.Parent.CurHdrFtr = this;
        this.Parent.WaitMouseDown = true;
        this.Parent.CurPage = PageIndex;

        if (-1 === PageIndex)
            this.RecalcInfo.CurPage = -1;

        var OldDocPosType = this.LogicDocument.GetDocPosType();
        this.LogicDocument.SetDocPosType(docpostype_HdrFtr);

        if (true === bUpdateStates && -1 !== PageIndex)
        {
            this.Set_Page(PageIndex);

            this.LogicDocument.Document_UpdateInterfaceState();
            this.LogicDocument.Document_UpdateRulersState();
            this.LogicDocument.Document_UpdateSelectionState();
        }

        if (docpostype_HdrFtr !== OldDocPosType)
        {
            this.DrawingDocument.ClearCachePages();
            this.DrawingDocument.FirePaint();
        }
    },

    Is_ThisElementCurrent : function()
    {
        if (this === this.Parent.CurHdrFtr && docpostype_HdrFtr === this.LogicDocument.GetDocPosType())
            return true;

        return false;
    },

    Reset : function(X,Y, XLimit, YLimit)
    {
        this.Content.Reset( X, Y, XLimit, YLimit );
    },

    Draw : function(nPageIndex, pGraphics)
    {
        this.Content.Draw( nPageIndex, pGraphics );
    },

    // Пришло сообщение о том, что контент изменился и пересчитался
    OnContentRecalculate : function(bChange, bForceRecalc)
    {
        return;
    },

    OnContentReDraw : function(StartPage, EndPage)
    {
        this.DrawingDocument.ClearCachePages();
        this.DrawingDocument.FirePaint();
    },

    RecalculateCurPos : function()
    {
        if (-1 !== this.RecalcInfo.CurPage)
            return this.Content.RecalculateCurPos();

        this.DrawingDocument.UpdateTarget(0, 0, this.Content.Get_StartPage_Absolute());
        return null;
    },

    Get_NearestPos : function(X, Y, bAnchor, Drawing)
    {
        return this.Content.Get_NearestPos(0, X, Y, bAnchor, Drawing);
    },

    Get_Numbering : function()
    {
        return this.LogicDocument.Get_Numbering();
    },

    Get_Bounds : function()
    {
        return this.Content.Get_PageBounds(0);
    },
    
    Get_DividingLine : function(PageIndex)
    {
        var OldPage = this.RecalcInfo.CurPage;
        
        this.Set_Page( PageIndex );
        var Bounds = this.Get_Bounds();
        
        if ( -1 !== OldPage )
            this.Set_Page( OldPage );
        
        if ( hdrftr_Footer === this.Type )
            return Bounds.Top;
        else
            return Bounds.Bottom;
    },

    Is_PointInDrawingObjects : function(X, Y)
    {
        return this.Content.Is_PointInDrawingObjects( X, Y, this.Content.Get_StartPage_Absolute() );
    },

	Is_PointInFlowTable : function(X, Y)
	{
		return this.Content.Is_PointInFlowTable(X, Y, this.Content.Get_StartPage_Absolute());
	},

    CheckRange : function(X0, Y0, X1, Y1, _Y0, _Y1, X_lf, X_rf, bMathWrap)
    {
        return this.Content.CheckRange( X0, Y0, X1, Y1, _Y0, _Y1, X_lf, X_rf, 0, false, bMathWrap );
    },

    AddPageNum : function(nAlign)
	{
		var StyleId = null;
		if (this.Type === hdrftr_Header)
			StyleId = this.Get_Styles().Get_Default_Header();
		else
			StyleId = this.Get_Styles().Get_Default_Footer();

		this.Content.SetHdrFtrPageNum(nAlign, StyleId);
	},

    IsCell : function(isReturnCell)
    {
    	if (true === isReturnCell)
    		return null;

        return false;
    },

    Check_AutoFit : function()
    {
        return false;
    },

    IsHdrFtr : function(bReturnHdrFtr)
	{
		if (true === bReturnHdrFtr)
			return this;

		return true;
	},

	IsFootnote : function(bReturnFootnote)
	{
		return (bReturnFootnote ? null : false);
	},

    Get_ParentTextTransform : function()
    {
        return null;
    },

    Is_DrawingShape : function(bRetShape)
    {
        if(bRetShape === true)
        {
            return null;
        }
        return false;
    },

    Is_TopDocument : function(bReturnTopDocument)
    {
        if ( true === bReturnTopDocument )
            return this.Content;

        return true;
    },

    Is_InTable : function(bReturnTopTable)
    {
        if ( true === bReturnTopTable )
            return null;

        return false;
    },

	IsSelectionUse : function()
	{
		return this.Content.IsSelectionUse();
	},

	IsNumberingSelection : function()
	{
		return this.Content.IsNumberingSelection();
	},

	IsTextSelectionUse : function()
	{
		return this.Content.IsTextSelectionUse();
	},

    Is_UseInDocument : function(Id)
    {
        if ( null != this.Parent )
            return this.Parent.Is_UseInDocument(this.Get_Id());

        return false;
    },

    Check_Page : function(PageIndex)
    {
        return this.Parent.Check_Page( this, PageIndex );
    },

	GetCurPosXY : function()
	{
		return this.Content.GetCurPosXY();
	},

	GetSelectedText : function(bClearText, oPr)
	{
		return this.Content.GetSelectedText(bClearText, oPr);
	},

	GetSelectedElementsInfo : function(Info)
	{
		this.Content.GetSelectedElementsInfo(Info);
	},

	GetSelectedContent : function(SelectedContent)
	{
		this.Content.GetSelectedContent(SelectedContent);
	},

	UpdateCursorType : function(X, Y, PageAbs)
    {
        if (PageAbs != this.Content.Get_StartPage_Absolute())
            this.DrawingDocument.SetCursorType("text", new AscCommon.CMouseMoveData());
        else
            return this.Content.UpdateCursorType(X, Y, 0);
    },

	IsTableBorder : function(X, Y, PageAbs)
    {
        this.Set_Page(PageAbs);
        return this.Content.IsTableBorder(X, Y, 0);
    },

	IsInText : function(X, Y, PageAbs)
    {
        this.Set_Page(PageAbs);
        return this.Content.IsInText(X, Y, 0);
    },

	IsInDrawing : function(X, Y, PageAbs)
    {
        this.Set_Page(PageAbs);
        return this.Content.IsInDrawing(X, Y, 0);
    },

    Document_UpdateInterfaceState : function()
    {
        this.Content.Document_UpdateInterfaceState();
    },

    Document_UpdateRulersState : function()
    {
        if ( -1 === this.RecalcInfo.CurPage )
            return;
        
        var Index  = this.LogicDocument.Pages[this.RecalcInfo.CurPage].Pos; 
        var SectPr = this.LogicDocument.SectionsInfo.Get_SectPr(Index).SectPr;
        var Bounds = this.Get_Bounds();
        
        // нужно обновить линейку
        if ( this.Type === hdrftr_Header )
        {
            this.DrawingDocument.Set_RulerState_HdrFtr( true, Bounds.Top, Math.max( Bounds.Bottom, SectPr.GetPageMarginTop() ) );
        }
        else
        {
            this.DrawingDocument.Set_RulerState_HdrFtr( false, Bounds.Top, SectPr.GetPageHeight() );
        }

        this.Content.Document_UpdateRulersState( this.Content.Get_StartPage_Absolute() );
    },

    Document_UpdateSelectionState : function()
    {
        if (-1 === this.RecalcInfo.CurPage)
        {
            // Если колонтитул не рассчитан, либо данный колонтитул неиспользуется, тогда смещаемся к первой странице
            this.DrawingDocument.TargetEnd();
            this.DrawingDocument.SelectEnabled(false);
            this.LogicDocument.NeedUpdateTarget = true;
            return;
        }

        if ( docpostype_DrawingObjects == this.Content.CurPos.Type )
        {
            return this.LogicDocument.DrawingObjects.documentUpdateSelectionState();
        }
        else //if ( docpostype_Content === this.Content.CurPos.Type )
        {
            // Если у нас есть выделение, тогда убираем курсор и рисуем выделение.
            // Если никакого выделения нет, тогда убираем его и восстанавливаем курсор.
            if ( true === this.Content.IsSelectionUse() )
            {
                // Выделение нумерации
                if ( selectionflag_Numbering == this.Content.Selection.Flag )
                {
                    this.DrawingDocument.TargetEnd();
                    this.DrawingDocument.SelectEnabled(true);
                    this.DrawingDocument.SelectClear();
                    this.DrawingDocument.SelectShow();
                }
                // Обрабатываем движение границы у таблиц
                else if ( null != this.Content.Selection.Data && true === this.Content.Selection.Data.TableBorder && type_Table == this.Content.Content[this.Content.Selection.Data.Pos].GetType() )
                {
                    // Убираем курсор, если он был
                    this.DrawingDocument.TargetEnd();
                }
                else
                {
                    if ( false === this.Content.IsSelectionEmpty() )
                    {
                        if (true !== this.Content.Selection.Start)
                            this.RecalculateCurPos();

                        this.DrawingDocument.TargetEnd();
                        this.DrawingDocument.SelectEnabled(true);
                        this.DrawingDocument.SelectClear();
                        this.DrawingDocument.SelectShow();
                    }
                    else
                    {
                        this.DrawingDocument.SelectEnabled(false);
                        this.RecalculateCurPos();

                        this.DrawingDocument.TargetStart();
                        this.DrawingDocument.TargetShow();
                    }
                }
            }
            else
            {
                this.DrawingDocument.SelectEnabled(false);
                this.RecalculateCurPos();

                this.DrawingDocument.TargetStart();
                this.DrawingDocument.TargetShow();
            }
        }
    },

//-----------------------------------------------------------------------------------
// Функции для работы с контентом
//-----------------------------------------------------------------------------------
	AddNewParagraph : function()
	{
		this.Content.AddNewParagraph();
	},

	AddInlineImage : function(W, H, Img, Chart, bFlow)
    {
        this.Content.AddInlineImage(W,H,Img, Chart, bFlow);
    },
	AddImages : function(aImages)
    {
        this.Content.AddImages(aImages);
    },
    AddSignatureLine : function(oSignatureDrawing)
    {
        this.Content.AddSignatureLine(oSignatureDrawing);
    },

	AddOleObject : function(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId)
    {
        this.Content.AddOleObject(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId);
    },

	AddTextArt : function(nStyle)
    {
        this.Content.AddTextArt(nStyle);
    },

	EditChart : function(Chart)
    {
        this.Content.EditChart( Chart );
    },

	AddInlineTable : function(nCols, nRows, nMode)
	{
		return this.Content.AddInlineTable(nCols, nRows, nMode);
	},

	AddToParagraph : function(ParaItem, bRecalculate)
	{
		this.Content.AddToParagraph(ParaItem, bRecalculate);
	},

	ClearParagraphFormatting : function(isClearParaPr, isClearTextPr)
	{
		this.Content.ClearParagraphFormatting(isClearParaPr, isClearTextPr);
	},

	PasteFormatting : function(TextPr, ParaPr, ApplyPara)
	{
		this.Content.PasteFormatting(TextPr, ParaPr, ApplyPara);
	},

    Remove : function(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord)
    {
        this.Content.Remove(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord);
    },

	GetCursorPosXY : function()
	{
		return this.Content.GetCursorPosXY();
	},

	MoveCursorLeft : function(AddToSelect, Word)
	{
		var bRetValue = this.Content.MoveCursorLeft(AddToSelect, Word);

		this.Document_UpdateInterfaceState();
		this.Document_UpdateRulersState();

		return bRetValue;
	},

	MoveCursorRight : function(AddToSelect, Word)
	{
		var bRetValue = this.Content.MoveCursorRight(AddToSelect, Word);

		this.Document_UpdateInterfaceState();
		this.Document_UpdateRulersState();

		return bRetValue;
	},

	MoveCursorUp : function(AddToSelect)
	{
		var bRetValue = this.Content.MoveCursorUp(AddToSelect);

		this.Document_UpdateInterfaceState();
		this.Document_UpdateRulersState();

		return bRetValue;
	},

	MoveCursorDown : function(AddToSelect)
	{
		var bRetValue = this.Content.MoveCursorDown(AddToSelect);

		this.Document_UpdateInterfaceState();
		this.Document_UpdateRulersState();

		return bRetValue;
	},

	MoveCursorToEndOfLine : function(AddToSelect)
	{
		var bRetValue = this.Content.MoveCursorToEndOfLine(AddToSelect);

		this.Document_UpdateInterfaceState();
		this.Document_UpdateRulersState();

		return bRetValue;
	},

	MoveCursorToStartOfLine : function(AddToSelect)
	{
		var bRetValue = this.Content.MoveCursorToStartOfLine(AddToSelect);

		this.Document_UpdateInterfaceState();
		this.Document_UpdateRulersState();

		return bRetValue;
	},

	MoveCursorToStartPos : function(AddToSelect)
	{
		var bRetValue = this.Content.MoveCursorToStartPos(AddToSelect);

		this.Document_UpdateInterfaceState();
		this.Document_UpdateRulersState();

		return bRetValue;
	},

	MoveCursorToEndPos : function(AddToSelect)
	{
		var bRetValue = this.Content.MoveCursorToEndPos(AddToSelect);

		this.Document_UpdateInterfaceState();
		this.Document_UpdateRulersState();

		return bRetValue;
	},

	MoveCursorToXY : function(X, Y, PageIndex, AddToSelect, bRemoveOldSelection)
	{
		this.Set_Page(PageIndex);
		return this.Content.MoveCursorToXY(X, Y, AddToSelect, bRemoveOldSelection, PageIndex);
	},

	MoveCursorToCell : function(bNext)
	{
		this.Content.MoveCursorToCell(bNext);
	},

	SetParagraphAlign : function(Align)
	{
		return this.Content.SetParagraphAlign(Align);
	},

	SetParagraphSpacing : function(Spacing)
	{
		return this.Content.SetParagraphSpacing(Spacing);
	},

	SetParagraphIndent : function(Ind)
	{
		return this.Content.SetParagraphIndent(Ind);
	},

	SetParagraphShd : function(Shd)
	{
		return this.Content.SetParagraphShd(Shd);
	},

	SetParagraphStyle : function(Name)
	{
		return this.Content.SetParagraphStyle(Name);
	},

	SetParagraphTabs : function(Tabs)
	{
		return this.Content.SetParagraphTabs(Tabs);
	},

	SetParagraphContextualSpacing : function(Value)
	{
		return this.Content.SetParagraphContextualSpacing(Value);
	},

	SetParagraphPageBreakBefore : function(Value)
	{
		return this.Content.SetParagraphPageBreakBefore(Value);
	},

	SetParagraphKeepLines : function(Value)
	{
		return this.Content.SetParagraphKeepLines(Value);
	},

	SetParagraphKeepNext : function(Value)
	{
		return this.Content.SetParagraphKeepNext(Value);
	},

	SetParagraphWidowControl : function(Value)
	{
		return this.Content.SetParagraphWidowControl(Value);
	},

	SetParagraphBorders : function(Value)
	{
		return this.Content.SetParagraphBorders(Value);
	},

	IncreaseDecreaseFontSize : function(bIncrease)
	{
		return this.Content.IncreaseDecreaseFontSize(bIncrease);
	},

	IncreaseDecreaseIndent : function(bIncrease)
	{
		return this.Content.IncreaseDecreaseIndent(bIncrease);
	},

	SetImageProps : function(Props)
	{
		return this.Content.SetImageProps(Props);
	},

	SetTableProps : function(Props)
	{
		return this.Content.SetTableProps(Props);
	},

	GetCalculatedParaPr : function()
	{
		return this.Content.GetCalculatedParaPr();
	},

	GetCalculatedTextPr : function()
	{
		return this.Content.GetCalculatedTextPr();
	},

	GetDirectTextPr : function()
	{
		return this.Content.GetDirectTextPr();
	},

	GetDirectParaPr : function()
	{
		return this.Content.GetDirectParaPr();
	},

    GetAllParagraphs : function(Props, ParaArray)
    {
        return this.Content.GetAllParagraphs(Props, ParaArray);
    },

	GetAllDrawingObjects : function(arrDrawings)
	{
		return this.Content.GetAllDrawingObjects(arrDrawings);
	},

	GetPrevElementEndInfo : function(CurElement)
    {
        return null;
    },

	RemoveSelection : function(bNoCheckDrawing)
	{
		return this.Content.RemoveSelection(bNoCheckDrawing);
	},

	DrawSelectionOnPage : function(CurPage)
    {
        return this.Content.DrawSelectionOnPage(0, true, true);
    },

    Selection_SetStart : function(X,Y, PageIndex, MouseEvent)
    {
        this.Set_Page( PageIndex );

        if ( true === editor.isStartAddShape )
        {
            this.Content.SetDocPosType(docpostype_DrawingObjects);
            this.Content.Selection.Use   = true;
            this.Content.Selection.Start = true;

            if ( true != this.LogicDocument.DrawingObjects.isPolylineAddition() )
                this.LogicDocument.DrawingObjects.startAddShape( editor.addShapePreset );

            this.LogicDocument.DrawingObjects.OnMouseDown(MouseEvent, X, Y, PageIndex);
        }
        else
		{
			return this.Content.Selection_SetStart(X, Y, 0, MouseEvent);
		}
    },

    Selection_SetEnd : function(X, Y, PageIndex, MouseEvent)
    {
        this.Set_Page( PageIndex );
        return this.Content.Selection_SetEnd(X, Y, 0, MouseEvent);
    },

	IsMovingTableBorder : function()
    {
        return this.Content.IsMovingTableBorder();
    },

	CheckPosInSelection : function(X, Y, PageAbs, NearPos)
	{
		if (-1 === this.RecalcInfo.CurPage)
			return false;

		var HdrFtrPage = this.Content.Get_StartPage_Absolute();
		if (undefined !== NearPos || HdrFtrPage === PageAbs)
			return this.Content.CheckPosInSelection(X, Y, 0, NearPos);

		return false;
	},

	SelectAll : function()
	{
		return this.Content.SelectAll();
	},

	GetCurrentParagraph : function(bIgnoreSelection, arrSelectedParagraphs)
	{
		return this.Content.GetCurrentParagraph(bIgnoreSelection, arrSelectedParagraphs);
	},

	StartSelectionFromCurPos : function()
	{
		this.Content.StartSelectionFromCurPos();
	},
//-----------------------------------------------------------------------------------
// Функции для работы с номерами страниц
//-----------------------------------------------------------------------------------
    Get_StartPage_Absolute : function()
    {
        return 0;
    },

    Get_StartPage_Relative : function()
    {
        return 0;
    },

    Get_AbsolutePage : function(CurPage)
    {
        return CurPage;
    },

    Get_AbsoluteColumn : function(CurPage)
    {
        return 0;
    },
//-----------------------------------------------------------------------------------
// Функции для работы с таблицами
//-----------------------------------------------------------------------------------
	AddTableRow : function(bBefore)
	{
		this.Content.AddTableRow(bBefore);
	},

	AddTableColumn : function(bBefore)
    {
        this.Content.AddTableColumn( bBefore );
    },

	RemoveTableRow : function()
	{
		this.Content.RemoveTableRow();
	},

	RemoveTableColumn : function()
	{
		this.Content.RemoveTableColumn();
	},

	MergeTableCells : function()
	{
		this.Content.MergeTableCells();
	},

	SplitTableCells : function(Cols, Rows)
	{
		this.Content.SplitTableCells(Cols, Rows);
	},

	RemoveTableCells : function()
	{
		this.Content.RemoveTableCells();
	},

	RemoveTable : function()
	{
		this.Content.RemoveTable();
	},

	SelectTable : function(Type)
	{
		this.Content.SelectTable(Type);
	},

	CanMergeTableCells : function()
	{
		return this.Content.CanMergeTableCells();
	},

	CanSplitTableCells : function()
	{
		return this.Content.CanSplitTableCells();
	},

	CheckTableCoincidence : function(Table)
    {
        return false;
    },

	DistributeTableCells : function(isHorizontally)
	{
		return this.Content.DistributeTableCells(isHorizontally);
	},
//-----------------------------------------------------------------------------------
// Undo/Redo функции
//-----------------------------------------------------------------------------------    
    Get_ParentObject_or_DocumentPos : function()
    {
        return { Type : AscDFH.historyitem_recalctype_HdrFtr, Data : this };
    },

    Refresh_RecalcData : function(Data)
    {
        this.Refresh_RecalcData2();
    },

    Refresh_RecalcData2 : function()
    {
        // Сохраняем пересчитаные страницы в старый пересчет, а текущий обнуляем
        this.RecalcInfo.PageNumInfo = {};
        this.RecalcInfo.SectPr      = {};
        this.RecalcInfo.CurPage     = -1;
		this.RecalcInfo.NeedRecalc  = {};
        
        History.RecalcData_Add( { Type : AscDFH.historyitem_recalctype_HdrFtr, Data : this } );
    },
    
    Refresh_RecalcData_BySection : function(SectPr)
    {
        // Найдем среди пересчитанных страниц те, которые пересчитывались в заданной секции,
        // и среди них найдем ключ с наименьшим номером. Далее, отметим все страницы с номером большим, чем найденный,
        // как не пересчитанные.
        
        var MinPageIndex = -1;
        for ( var PageIndex in this.RecalcInfo.PageNumInfo )
        {
            if ( SectPr === this.RecalcInfo.SectPr[PageIndex] && ( -1 === MinPageIndex || PageIndex < MinPageIndex ) )
                MinPageIndex = PageIndex;                
        }
        
        for ( var PageIndex in this.RecalcInfo.PageNumInfo )
        {
            if ( PageIndex >= MinPageIndex )
            {
                delete this.RecalcInfo.PageNumInfo[PageIndex];
                delete this.RecalcInfo.SectPr[PageIndex];
				delete this.RecalcInfo.NeedRecalc[PageIndex];
            }
        }
    },
//-----------------------------------------------------------------------------------
// Функции для работы с гиперссылками
//-----------------------------------------------------------------------------------
	AddHyperlink : function(HyperProps)
	{
		this.Content.AddHyperlink(HyperProps);
	},

	ModifyHyperlink : function(HyperProps)
	{
		this.Content.ModifyHyperlink(HyperProps);
	},

	RemoveHyperlink : function()
	{
		this.Content.RemoveHyperlink();
	},

	CanAddHyperlink : function(bCheckInHyperlink)
	{
		return this.Content.CanAddHyperlink(bCheckInHyperlink);
	},

	IsCursorInHyperlink : function(bCheckEnd)
	{
		return this.Content.IsCursorInHyperlink(bCheckEnd);
	},
//-----------------------------------------------------------------------------------
// Функции для работы с генерацией карты шрифтов
//-----------------------------------------------------------------------------------
    Document_CreateFontMap : function(FontMap)
    {
        this.Content.Document_CreateFontMap(FontMap);
    },

    Document_CrateFontCharMap : function(FontCharMap)
    {
        this.Content.Document_CreateFontCharMap( FontCharMap );
    },

    Document_Get_AllFontNames : function(AllFonts)
    {
        this.Content.Document_Get_AllFontNames(AllFonts);
    },
//-----------------------------------------------------------------------------------
// Функции для работы с совместным редактирования
//-----------------------------------------------------------------------------------
    Write_ToBinary2 : function(Writer)
    {
        Writer.WriteLong( AscDFH.historyitem_type_HdrFtr );

        // String   : Id
        // Long     : Type
        // String   : Content Id

        Writer.WriteString2( this.Id );
        Writer.WriteLong( this.Type );
        Writer.WriteString2( this.Content.Get_Id() );
    },

    Read_FromBinary2 : function(Reader)
    {
        // String   : Id
        // Long     : Type
        // String   : Content Id

        var LogicDocument = editor.WordControl.m_oLogicDocument;

        this.Parent          = LogicDocument.HdrFtr;
        this.DrawingDocument = LogicDocument.DrawingDocument;
        this.LogicDocument   = LogicDocument;

        this.Id      = Reader.GetString2();
        this.Type    = Reader.GetLong();

        this.Content = g_oTableId.Get_ById( Reader.GetString2() );        
    },
//-----------------------------------------------------------------------------------
// Функции для работы с комментариями
//-----------------------------------------------------------------------------------
	AddComment : function(Comment)
	{
		this.Content.AddComment(Comment, true, true);
	},

	CanAddComment : function()
	{
		return this.Content.CanAddComment();
	}
};
CHeaderFooter.prototype.Get_SectPr = function()
{
    if (this.LogicDocument)
    {
        var SectionsInfo = this.LogicDocument.SectionsInfo;
        var Index = SectionsInfo.Find_ByHdrFtr(this);
        if (-1 !== Index)
            return SectionsInfo.Get_SectPr2(Index).SectPr;
    }

    return null;
};
CHeaderFooter.prototype.SetParagraphFramePr = function(FramePr, bDelete)
{
    return this.Content.SetParagraphFramePr(FramePr, bDelete);
};
CHeaderFooter.prototype.GetRevisionsChangeElement = function(SearchEngine)
{
    return this.Content.GetRevisionsChangeElement(SearchEngine);
};
CHeaderFooter.prototype.GetSelectionBounds = function()
{
	if (-1 !== this.RecalcInfo.CurPage)
		return this.Content.GetSelectionBounds();

	return null;
};
CHeaderFooter.prototype.Get_DocumentContent = function()
{
    return this.Content;
};
CHeaderFooter.prototype.Add_PageCountElement = function(oElement)
{
	for (var nIndex = 0, nCount = this.PageCountElements.length; nIndex < nCount; ++nIndex)
	{
		if (oElement == this.PageCountElements[nIndex])
			return;
	}

	this.PageCountElements.push(oElement);
};
CHeaderFooter.prototype.Have_PageCountElement = function()
{
	return this.PageCountElements.length > 0 ? true : false;
};
CHeaderFooter.prototype.Clear_PageCountElements = function()
{
	this.PageCountElements = [];
};
CHeaderFooter.prototype.Update_PageCountElements = function(nPageCount)
{
	for (var nIndex = 0, nCount = this.PageCountElements.length; nIndex < nCount; ++nIndex)
	{
		this.PageCountElements[nIndex].SetNumValue(nPageCount);
	}
};
CHeaderFooter.prototype.ForceRecalculate = function(nPageAbs)
{
	this.RecalcInfo.NeedRecalc[nPageAbs] = true;
};
CHeaderFooter.prototype.GetAllContentControls = function(arrContentControls)
{
	return this.Content.GetAllContentControls(arrContentControls);
};
/**
 * * Получаем класс, управляющий содержимым колонтитула
 * @returns {CDocumentContent}
 */
CHeaderFooter.prototype.GetContent = function()
{
	return this.Content;
};

CHeaderFooter.prototype.FindWatermark = function()
{
    var aAllDrawings = this.Content.GetAllDrawingObjects();
    var oCandidate = null, oDrawing;
    for(var i = aAllDrawings.length - 1; i > -1; --i)
    {
        oDrawing = aAllDrawings[i];
        if(oDrawing.IsWatermark())
        {
            if(null === oCandidate)
            {
                oCandidate = oDrawing;
            }
            else
            {
                if(oCandidate.getDrawingArrayType() < oDrawing.getDrawingArrayType() || ComparisonByZIndexSimple(oDrawing, oCandidate))
                {
                    oCandidate = oDrawing;
                }
            }
        }
    }
    return oCandidate;
};
CHeaderFooter.prototype.GetAllTablesOnPage = function(nPageAbs, arrTables)
{
	this.Set_Page(nPageAbs);
	return this.Content.GetAllTablesOnPage(nPageAbs, arrTables);
};

//-----------------------------------------------------------------------------------
// Класс для работы с колонтитулами
//-----------------------------------------------------------------------------------
function CHeaderFooterController(LogicDocument, DrawingDocument)
{
    this.Id = AscCommon.g_oIdCounter.Get_NewId();

    this.DrawingDocument = DrawingDocument;
    this.LogicDocument   = LogicDocument;

    // Текущий колонтитул
    this.CurHdrFtr = null;

    this.Pages   = {};
    this.CurPage = 0;
    this.ChangeCurPageOnEnd = true;

    this.WaitMouseDown = true;

    this.Lock = new AscCommon.CLock();   

    // Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
    g_oTableId.Add( this, this.Id );
}

CHeaderFooterController.prototype =
{
    Get_Id : function()
    {
        return this.Id;
    },
//-----------------------------------------------------------------------------------
// Функции для работы с колонтитулами
//-----------------------------------------------------------------------------------        
    GoTo_NextHdrFtr : function()
    {
        var CurHdrFtr = this.CurHdrFtr;
        if (null === CurHdrFtr || -1 === CurHdrFtr.RecalcInfo.CurPage)
            return;

        var CurPage = CurHdrFtr.RecalcInfo.CurPage;
        var Pages = this.Pages;

        if (hdrftr_Header === CurHdrFtr.Type && undefined !== Pages[CurPage].Footer)
            CurHdrFtr = Pages[CurPage].Footer;
        else
            CurHdrFtr = null;

        while (null === CurHdrFtr)
        {
            CurPage++;

            if (undefined === Pages[CurPage])
                break;
            else if (undefined !== Pages[CurPage].Header && null !== Pages[CurPage].Header)
                CurHdrFtr = Pages[CurPage].Header;
            else if (undefined !== Pages[CurPage].Footer && null !== Pages[CurPage].Footer)
                CurHdrFtr = Pages[CurPage].Footer;
        }

        if (null !== CurHdrFtr)
        {
            this.CurHdrFtr = CurHdrFtr;
            CurHdrFtr.Set_Page(CurPage);
            CurHdrFtr.Content.MoveCursorToStartPos(false);

            return true;
        }
        
        return false;
    },
    
    GoTo_PrevHdrFtr : function()
    {
        var CurHdrFtr = this.CurHdrFtr;
        if (null === CurHdrFtr || -1 === CurHdrFtr.RecalcInfo.CurPage)
            return;
        
        var CurPage = CurHdrFtr.RecalcInfo.CurPage;
        var Pages = this.Pages;
        
        if (hdrftr_Footer === CurHdrFtr.Type && undefined !== Pages[CurPage].Header)
            CurHdrFtr = Pages[CurPage].Header;
        else
            CurHdrFtr = null;
        
        while (null === CurHdrFtr)
        {
            CurPage--;
            
            if (undefined === Pages[CurPage])
                return;
            else if (undefined !== Pages[CurPage].Footer && null !== Pages[CurPage].Footer)
                CurHdrFtr = Pages[CurPage].Footer;
            else if (undefined !== Pages[CurPage].Header && null !== Pages[CurPage].Header)
                CurHdrFtr = Pages[CurPage].Header;
        }
        
        if (null !== CurHdrFtr)
        {
            this.CurHdrFtr = CurHdrFtr;
            CurHdrFtr.Set_Page(CurPage);
            CurHdrFtr.Content.MoveCursorToStartPos(false);
            
            return true;
        }
        
        return false;
    },
    
    Get_CurPage : function()
    {
        if ( null != this.CurHdrFtr )
            return this.CurHdrFtr.Content.Get_StartPage_Absolute();

        return 0;
    },

    // Получаем своства колонтитула для интерфейса
    Get_Props : function()
    {
        if ( null != this.CurHdrFtr && -1 !== this.CurHdrFtr.RecalcInfo.CurPage )
        {
            var Pr = {};
            Pr.Type = this.CurHdrFtr.Type;
            
            if ( undefined === this.LogicDocument.Pages[this.CurHdrFtr.RecalcInfo.CurPage] )
                return Pr;
            
            var Index  = this.LogicDocument.Pages[this.CurHdrFtr.RecalcInfo.CurPage].Pos;            
            var SectPr = this.LogicDocument.SectionsInfo.Get_SectPr(Index).SectPr;

            if ( hdrftr_Footer === Pr.Type )
                Pr.Position = SectPr.GetPageMarginFooter();
            else
                Pr.Position = SectPr.GetPageMarginHeader();
            
            Pr.DifferentFirst   = SectPr.Get_TitlePage();
            Pr.DifferentEvenOdd = EvenAndOddHeaders;
            
            if ( SectPr === this.LogicDocument.SectionsInfo.Get_SectPr2(0).SectPr )
            {
                // У первой секции не может быть повторяющихся колонтитулов. Посылаем особое значение (null) в меню
                Pr.LinkToPrevious = null;
            }
            else
            {
                // Определим тип колонтитула, в котором мы находимся
                var PageIndex = this.CurHdrFtr.RecalcInfo.CurPage;
                var SectionPageInfo = this.LogicDocument.Get_SectionPageNumInfo( PageIndex );

                var bFirst  = ( true === SectionPageInfo.bFirst && true === SectPr.Get_TitlePage() ? true : false );
                var bEven   = ( true === SectionPageInfo.bEven  && true === EvenAndOddHeaders      ? true : false );
                var bHeader = ( hdrftr_Header === this.CurHdrFtr.Type ? true : false );

                Pr.LinkToPrevious = ( null === SectPr.GetHdrFtr( bHeader, bFirst, bEven ) ? true : false );
            }

            Pr.Locked = this.Lock.Is_Locked();

			Pr.StartPageNumber = SectPr.Get_PageNum_Start();

            return Pr;
        }
        else
            return null;
    },

    Set_CurHdrFtr_ById : function(Id)
    {
        var HdrFtr = g_oTableId.Get_ById( Id );
        if ( -1 === this.LogicDocument.SectionsInfo.Find_ByHdrFtr( HdrFtr ) )
            return false;
        
        this.CurHdrFtr = HdrFtr;
        HdrFtr.Content.MoveCursorToStartPos();
              
        return true;
    },
//-----------------------------------------------------------------------------------
//
//-----------------------------------------------------------------------------------   
    RecalculateCurPos : function(bUpdateX, bUpdateY)
	{
		if (this.CurHdrFtr)
			return this.CurHdrFtr.RecalculateCurPos(bUpdateX, bUpdateY);

		return null;
	},

    Recalculate : function(PageIndex)
    {
        // Определим четность страницы и является ли она первой в данной секции. Заметим, что четность страницы 
        // отсчитывается от начала текущей секции и не зависит от настроек нумерации страниц для данной секции.
        var SectionPageInfo = this.LogicDocument.Get_SectionPageNumInfo( PageIndex );
        
        var bFirst = SectionPageInfo.bFirst;
        var bEven  = SectionPageInfo.bEven;
        
        // Запросим нужный нам колонтитул 
        var HdrFtr = this.LogicDocument.Get_SectionHdrFtr( PageIndex, bFirst, bEven );
        
        var Header = HdrFtr.Header;
        var Footer = HdrFtr.Footer;
        var SectPr = HdrFtr.SectPr;

        this.Pages[PageIndex] = new CHdrFtrPage();
        this.Pages[PageIndex].Header = Header;
        this.Pages[PageIndex].Footer = Footer;

        var oFrame = SectPr.GetContentFrame(PageIndex);
        var X      = oFrame.Left;
        var XLimit = oFrame.Right;

        var bRecalcHeader = false;

        var HeaderDrawings, HeaderTables, FooterDrawings, FooterTables;
        // Рассчитываем верхний колонтитул
        if ( null !== Header )
        {
            if ( true === Header.Is_NeedRecalculate( PageIndex ) )
            {
                var Y      = SectPr.GetPageMarginHeader();
                var YLimit = SectPr.GetPageHeight() / 2;

                Header.Reset( X, Y, XLimit, YLimit );
                bRecalcHeader = Header.Recalculate(PageIndex, SectPr);
            }
            else
            {
               if ( -1 === Header.RecalcInfo.CurPage )
                    Header.Set_Page(PageIndex);
            }
            HeaderDrawings = Header.Content.GetAllDrawingObjects([]);
            HeaderTables = Header.Content.GetAllFloatElements();
        }
        
        var bRecalcFooter = false;
        
        // Рассчитываем нижний колонтитул
        if ( null !== Footer )
        {
            if ( true === Footer.Is_NeedRecalculate( PageIndex ) )
            {
                // Нижний колонтитул рассчитываем 2 раза. Сначала, с 0 позиции, чтобы рассчитать суммарную высоту колонитула.
                // Исходя из уже известной высоты располагаем и рассчитываем колонтитул.

                var Y      = 0;
                var YLimit = SectPr.GetPageHeight();

                Footer.Reset( X, Y, XLimit, YLimit );
                Footer.Recalculate2(PageIndex);

                var SummaryHeight = Footer.Content.GetSummaryHeight();
                Y = Math.max( 2 * YLimit / 3, YLimit - SectPr.GetPageMarginFooter() - SummaryHeight );

                Footer.Reset( X, Y, XLimit, YLimit );
                bRecalcFooter = Footer.Recalculate(PageIndex, SectPr);
            }
            else
            {
                if ( -1 === Footer.RecalcInfo.CurPage )
                    Footer.Set_Page(PageIndex);
            }
            FooterDrawings = Footer.Content.GetAllDrawingObjects([]);
            FooterTables = Footer.Content.GetAllFloatElements();
        }

        // Подправляем позиции автофигур с учетом возможно изменившихся границ колонтитулов. Делаем это для всех автофигур,
        // потому что колонтитулы рассчитываются первыми на странице и внутри них нет обтекания.
        var PageLimits = this.LogicDocument.Get_PageContentStartPos(PageIndex);
        this.private_UpdateDrawingVerticalPositions(HeaderDrawings, PageLimits.Y, PageLimits.YLimit);
        this.private_UpdateDrawingVerticalPositions(FooterDrawings, PageLimits.Y, PageLimits.YLimit);

        this.private_MergeFlowObjectsFromHeaderAndFooter(PageIndex, HeaderDrawings, HeaderTables, FooterDrawings, FooterTables);

        if ( true === bRecalcHeader || true === bRecalcFooter )
            return true;
        
        return false;
    },

    private_UpdateDrawingVerticalPositions : function(Drawings, HeaderY, FooterY)
    {
        if (Drawings)
        {
            for (var Index = 0, Count = Drawings.length; Index < Count; ++Index)
            {
                var Drawing = Drawings[Index];
                Drawing.Update_PositionYHeaderFooter(HeaderY, FooterY);
            }
        }
    },

    private_MergeFlowObjectsFromHeaderAndFooter : function(nPageIndex, arrHeaderDrawings, arrHeaderTables, arrFooterDrawings, arrFooterTables)
    {
        var oHeader = this.Pages[nPageIndex].Header;
        var oFooter = this.Pages[nPageIndex].Footer;

        var nOldHeaderCurPage = null;
        var nOldFooterCurPage = null;

        if (oHeader)
        {
            nOldHeaderCurPage = oHeader.RecalcInfo.CurPage;
            oHeader.Set_Page(nPageIndex);
        }

        if (oFooter)
        {
            nOldFooterCurPage = oFooter.RecalcInfo.CurPage;
            oFooter.Set_Page(nPageIndex);
        }

        this.LogicDocument.DrawingObjects.mergeDrawings(nPageIndex, arrHeaderDrawings, arrHeaderTables, arrFooterDrawings, arrFooterTables);

        if (null !== nOldHeaderCurPage)
            oHeader.Set_Page(nOldHeaderCurPage);

        if (null !== nOldFooterCurPage)
            oFooter.Set_Page(nOldFooterCurPage);
    },

    // Отрисовка колонтитулов на данной странице
    Draw : function(nPageIndex, pGraphics)
    {
        var oHeader = this.Pages[nPageIndex].Header;
        var oFooter = this.Pages[nPageIndex].Footer;

        var nOldHeaderCurPage = null;
        var nOldFooterCurPage = null;

        if (oHeader)
        {
            nOldHeaderCurPage = oHeader.RecalcInfo.CurPage;
            oHeader.Set_Page(nPageIndex);
        }

        if (oFooter)
        {
            nOldFooterCurPage = oFooter.RecalcInfo.CurPage;
            oFooter.Set_Page(nPageIndex);
        }

        this.LogicDocument.DrawingObjects.drawBehindDocHdrFtr(nPageIndex, pGraphics);

        if (oHeader)
            oHeader.Draw(nPageIndex, pGraphics);

        if (oFooter)
            oFooter.Draw(nPageIndex, pGraphics);

        this.LogicDocument.DrawingObjects.drawBeforeObjectsHdrFtr(nPageIndex, pGraphics);

        if (null !== nOldHeaderCurPage)
            oHeader.Set_Page(nOldHeaderCurPage);

        if (null !== nOldFooterCurPage)
            oFooter.Set_Page(nOldFooterCurPage);
    },

    CheckRange : function(X0, Y0, X1, Y1, _Y0, _Y1, X_lf, X_rf, PageIndex, bMathWrap)
    {
        if (undefined === this.Pages[PageIndex])
            return [];

        var Header = this.Pages[PageIndex].Header;
        var Footer = this.Pages[PageIndex].Footer;              

        var HeaderRange = [];
        var FooterRange = [];

        if ( null != Header )
            HeaderRange = Header.CheckRange( X0, Y0, X1, Y1, _Y0, _Y1, X_lf, X_rf, bMathWrap );

        if ( null != Footer )
            FooterRange = Footer.CheckRange( X0, Y0, X1, Y1, _Y0, _Y1, X_lf, X_rf, bMathWrap );

        return HeaderRange.concat( FooterRange );
    },

    // Запрашиваем низ у верхнего колонтитула для данной страницы
    GetHdrFtrLines : function(PageIndex)
    {
        var Header = null;
        var Footer = null;
        
        if ( undefined !== this.Pages[PageIndex] )
        {
            Header = this.Pages[PageIndex].Header;
            Footer = this.Pages[PageIndex].Footer;
        }
        
        var Top = null; 
        if ( null !== Header )
            Top = Header.Get_DividingLine(PageIndex);
        
        var Bottom = null;
        if ( null !== Footer )
            Bottom = Footer.Get_DividingLine(PageIndex);
        
        return { Top : Top, Bottom : Bottom };
    },

	UpdateCursorType : function( X, Y, PageNum_Abs )
    {
        if ( true === this.Lock.Is_Locked() )
        {
            var PageLimits = this.LogicDocument.Get_PageContentStartPos( PageNum_Abs );

            var MMData_header = new AscCommon.CMouseMoveData();
            var Coords = this.DrawingDocument.ConvertCoordsToCursorWR( PageLimits.X, PageLimits.Y, PageNum_Abs );
            MMData_header.X_abs            = Coords.X;
            MMData_header.Y_abs            = Coords.Y + 2;
            MMData_header.Type             = AscCommon.c_oAscMouseMoveDataTypes.LockedObject;
            MMData_header.UserId           = this.Lock.Get_UserId();
            MMData_header.HaveChanges      = this.Lock.Have_Changes();
            MMData_header.LockedObjectType = c_oAscMouseMoveLockedObjectType.Header;
            editor.sync_MouseMoveCallback( MMData_header );

            var MMData_footer = new AscCommon.CMouseMoveData();
            Coords = this.DrawingDocument.ConvertCoordsToCursorWR( PageLimits.X, PageLimits.YLimit, PageNum_Abs );
            MMData_footer.X_abs            = Coords.X;
            MMData_footer.Y_abs            = Coords.Y - 2;
            MMData_footer.Type             = AscCommon.c_oAscMouseMoveDataTypes.LockedObject;
            MMData_footer.UserId           = this.Lock.Get_UserId();
            MMData_footer.HaveChanges      = this.Lock.Have_Changes();
            MMData_footer.LockedObjectType = c_oAscMouseMoveLockedObjectType.Footer;
            editor.sync_MouseMoveCallback( MMData_footer );
        }

        // TODO: Сделать выбор в зависимости колонтитула от номера страница PageNum_Abs
        if ( null != this.CurHdrFtr )
        {
            // Если мы попадаем в заселекченную автофигуру, пусть она даже выходит за пределы
            if ( true === this.LogicDocument.DrawingObjects.pointInSelectedObject(X, Y, PageNum_Abs) )
            {
                var NewPos = this.DrawingDocument.ConvertCoordsToAnotherPage(X, Y, PageNum_Abs, this.CurPage);
                var _X = NewPos.X;
                var _Y = NewPos.Y;
                return this.CurHdrFtr.UpdateCursorType( _X, _Y, this.CurPage );
            }
            else
                return this.CurHdrFtr.UpdateCursorType( X, Y, PageNum_Abs );
        }
    },

	IsTableBorder : function( X, Y, PageNum_Abs )
    {
        var HdrFtr = this.Internal_GetContentByXY( X, Y, PageNum_Abs );
        if ( null != HdrFtr )
            return HdrFtr.IsTableBorder( X, Y, PageNum_Abs );

        return null;
    },

	IsInText : function(X,Y, PageNum_Abs)
    {
        var HdrFtr = this.Internal_GetContentByXY( X, Y, PageNum_Abs );
        if ( null != HdrFtr )
            return HdrFtr.IsInText( X, Y, PageNum_Abs );

        return null;
    },

	IsInDrawing : function(X,Y, PageNum_Abs)
    {
        var HdrFtr = this.Internal_GetContentByXY( X, Y, PageNum_Abs );
        if ( null != HdrFtr )
            return HdrFtr.IsInDrawing( X, Y, PageNum_Abs );

        return null;
    },

    Document_UpdateInterfaceState : function()
    {
        if ( null != this.CurHdrFtr )
            this.CurHdrFtr.Document_UpdateInterfaceState();
    },

    Document_UpdateRulersState : function(CurPage)
    {
        if ( null != this.CurHdrFtr )
            this.CurHdrFtr.Document_UpdateRulersState(CurPage);
    },

    Document_UpdateSelectionState : function()
    {
        if (null != this.CurHdrFtr)
            this.CurHdrFtr.Document_UpdateSelectionState();
    },

	IsSelectionUse : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.IsSelectionUse();

		return false;
	},

	IsNumberingSelection : function()
	{
		if (this.CurHdrFtr)
			return this.CurHdrFtr.IsNumberingSelection();

		return false;
	},

	IsTextSelectionUse : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.IsTextSelectionUse();

		return false;
	},

	Is_UseInDocument : function(Id)
	{
		var HdrFtr = g_oTableId.Get_ById(Id);
		if (-1 === this.LogicDocument.SectionsInfo.Find_ByHdrFtr(HdrFtr))
			return false;

		return true;
	},

    Check_Page : function(HdrFtr, PageIndex)
    {
        var Header = this.Pages[PageIndex].Header;
        var Footer = this.Pages[PageIndex].Footer;

        if ( HdrFtr === Header || HdrFtr === Footer )
            return true;

        return false;
    },

	GetCurPosXY : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.GetCurPosXY();

		return {X : 0, Y : 0};
	},

	GetSelectedText : function(bClearText, oPr)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.GetSelectedText(bClearText, oPr);

		return null;
	},

	GetSelectedElementsInfo : function(Info)
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.GetSelectedElementsInfo(Info);
	},

	GetSelectedContent : function(SelectedContent)
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.GetSelectedContent(SelectedContent);
	},
//-----------------------------------------------------------------------------------
// Функции для работы с контентом
//-----------------------------------------------------------------------------------
	AddNewParagraph : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.AddNewParagraph();
	},

	AddInlineImage : function(W, H, Img, Chart, bFlow)
    {
        if ( null != this.CurHdrFtr )
            return this.CurHdrFtr.AddInlineImage(W,H,Img, Chart, bFlow);
    },
	AddImages : function(aImages)
    {
        if ( null != this.CurHdrFtr )
            return this.CurHdrFtr.AddImages(aImages);
    },
    AddSignatureLine : function(oSignatureDrawing)
    {
        if ( null != this.CurHdrFtr )
            return this.CurHdrFtr.AddSignatureLine(oSignatureDrawing);
    },

	AddOleObject: function(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId)
    {
        if ( null != this.CurHdrFtr )
            return this.CurHdrFtr.AddOleObject(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId);
    },

	AddTextArt : function(nStyle)
    {
        if ( null != this.CurHdrFtr )
            return this.CurHdrFtr.AddTextArt(nStyle);
    },

	EditChart : function(Chart)
    {
        if ( null != this.CurHdrFtr )
            return this.CurHdrFtr.EditChart( Chart );
    },

	AddInlineTable : function(nCols, nRows, nMode)
	{
		if (this.CurHdrFtr)
			return this.CurHdrFtr.AddInlineTable(nCols, nRows, nMode);

		return null;
	},

	AddToParagraph : function(ParaItem, bRecalculate)
	{
		if (para_NewLine === ParaItem.Type && true === ParaItem.IsPageOrColumnBreak())
			return;

		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.AddToParagraph(ParaItem, bRecalculate);
	},

	ClearParagraphFormatting : function(isClearParaPr, isClearTextPr)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.ClearParagraphFormatting();
	},

	PasteFormatting : function(TextPr, ParaPr, ApplyPara)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.PasteFormatting(TextPr, ParaPr, ApplyPara);
	},

    Remove : function(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord)
    {
        if ( null != this.CurHdrFtr )
            return this.CurHdrFtr.Remove(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord);
    },

	GetCursorPosXY : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.GetCursorPosXY();
	},

	MoveCursorLeft : function(AddToSelect, Word)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.MoveCursorLeft(AddToSelect, Word);
	},

	MoveCursorRight : function(AddToSelect, Word)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.MoveCursorRight(AddToSelect, Word);
	},

	MoveCursorUp : function(AddToSelect)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.MoveCursorUp(AddToSelect);
	},

	MoveCursorDown : function(AddToSelect)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.MoveCursorDown(AddToSelect);
	},

	MoveCursorToEndOfLine : function(AddToSelect)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.MoveCursorToEndOfLine(AddToSelect);
	},

	MoveCursorToStartOfLine : function(AddToSelect)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.MoveCursorToStartOfLine(AddToSelect);
	},

	MoveCursorToXY : function(X, Y, PageIndex, AddToSelect)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.MoveCursorToXY(X, Y, PageIndex, AddToSelect);
	},

	MoveCursorToStartPos : function(AddToSelect)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.MoveCursorToStartPos(AddToSelect);
	},

	MoveCursorToEndPos : function(AddToSelect)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.MoveCursorToEndPos(AddToSelect);
	},

	MoveCursorToCell : function(bNext)
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.MoveCursorToCell(bNext);
	},

	SetParagraphAlign : function(Align)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetParagraphAlign(Align);
	},

	SetParagraphSpacing : function(Spacing)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetParagraphSpacing(Spacing);
	},

	SetParagraphIndent : function(Ind)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetParagraphIndent(Ind);
	},

	SetParagraphShd : function(Shd)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetParagraphShd(Shd);
	},

	SetParagraphStyle : function(Name)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetParagraphStyle(Name);
	},

	SetParagraphTabs : function(Tabs)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetParagraphTabs(Tabs);
	},

	SetParagraphContextualSpacing : function(Value)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetParagraphContextualSpacing(Value);
	},

	SetParagraphPageBreakBefore : function(Value)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetParagraphPageBreakBefore(Value);
	},

	SetParagraphKeepLines : function(Value)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetParagraphKeepLines(Value);
	},

	SetParagraphKeepNext : function(Value)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetParagraphKeepNext(Value);
	},

	SetParagraphWidowControl : function(Value)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetParagraphWidowControl(Value);
	},

	SetParagraphBorders : function(Value)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetParagraphBorders(Value);
	},

	IncreaseDecreaseFontSize : function(bIncrease)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.IncreaseDecreaseFontSize(bIncrease);
	},

	IncreaseDecreaseIndent : function(bIncrease)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.IncreaseDecreaseIndent(bIncrease);
	},

	SetImageProps : function(Props)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetImageProps(Props);
	},

	SetTableProps : function(Props)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SetTableProps(Props);
	},

	GetCalculatedParaPr : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.GetCalculatedParaPr();
	},

	GetCalculatedTextPr : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.GetCalculatedTextPr();
	},

	GetDirectTextPr : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.GetDirectTextPr();

		return null;
	},

	GetDirectParaPr : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.GetDirectParaPr();

		return null;
	},

	RemoveSelection : function(bNoCheckDrawing)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.RemoveSelection(bNoCheckDrawing);
	},

	DrawSelectionOnPage : function(CurPage)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.DrawSelectionOnPage(CurPage);
	},

    Selection_SetStart : function(X,Y, PageIndex, MouseEvent, bActivate)
    {
		var TempHdrFtr = null;
		// Если мы попадаем в заселекченную автофигуру, пусть она даже выходит за пределы
		if (true === this.LogicDocument.DrawingObjects.pointInSelectedObject(X, Y, PageIndex)
			|| (null !== (TempHdrFtr = this.Pages[PageIndex].Header) && true === TempHdrFtr.Is_PointInFlowTable(X, Y))
			|| (null !== (TempHdrFtr = this.Pages[PageIndex].Footer) && true === TempHdrFtr.Is_PointInFlowTable(X, Y)))
		{
			if (this.CurHdrFtr && ((null !== TempHdrFtr && TempHdrFtr !== this.CurHdrFtr) || this.CurPage !== PageIndex))
				this.CurHdrFtr.RemoveSelection();

			if (null !== TempHdrFtr)
				this.CurHdrFtr = TempHdrFtr;

			this.CurPage = PageIndex;
			this.CurHdrFtr.Selection_SetStart(X, Y, PageIndex, MouseEvent);
            this.ChangeCurPageOnEnd = false;

            this.WaitMouseDown = false;

            return true;
        }

        this.ChangeCurPageOnEnd = true;

        var OldPage = this.CurPage;

        // Сначала проверяем, не попали ли мы в контент документа. Если да, тогда надо
        // активировать работу с самим документом (просто вернуть false здесь)

        var PageMetrics = this.LogicDocument.Get_PageContentStartPos( PageIndex );
        
        if ( MouseEvent.ClickCount >= 2 && true != editor.isStartAddShape &&
            !( Y <= PageMetrics.Y      || ( null !== ( TempHdrFtr = this.Pages[PageIndex].Header ) && true === TempHdrFtr.Is_PointInDrawingObjects( X, Y ) ) ) &&
            !( Y >= PageMetrics.YLimit || ( null !== ( TempHdrFtr = this.Pages[PageIndex].Footer ) && true === TempHdrFtr.Is_PointInDrawingObjects( X, Y ) ) ) )
        {
            // Убираем селект, если он был
            if ( null != this.CurHdrFtr )
            {
                this.CurHdrFtr.RemoveSelection();
            }

            MouseEvent.ClickCount = 1;
            return false;
        }

        this.CurPage = PageIndex;

        var HdrFtr = null;

        // Проверяем попали ли мы в колонтитул, если он есть. Если мы попали в
        // область колонтитула, а его там нет, тогда добавим новый колонтитул.
        if ( Y <= PageMetrics.Y || ( null !== ( TempHdrFtr = this.Pages[PageIndex].Header ) && true === TempHdrFtr.Is_PointInDrawingObjects( X, Y ) ) || true === editor.isStartAddShape )
        {
            if ( null === this.Pages[PageIndex].Header )
            {
                if ( false === editor.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_HdrFtr) )
                {
                    // Меняем старый режим редактирования, чтобы при Undo/Redo возвращаться в режим редактирования документа
                    this.LogicDocument.SetDocPosType(docpostype_Content);
                    this.LogicDocument.StartAction(AscDFH.historydescription_Document_AddHeader);
                    this.LogicDocument.SetDocPosType(docpostype_HdrFtr);
                    HdrFtr = this.LogicDocument.Create_SectionHdrFtr( hdrftr_Header, PageIndex );

                    if (this.CurHdrFtr)
                    	this.CurHdrFtr.RemoveSelection();

                    this.CurHdrFtr = HdrFtr;

                    this.LogicDocument.Recalculate();
                    this.LogicDocument.FinalizeAction();
                }
                else
                    return false;
            }
            else
                HdrFtr = this.Pages[PageIndex].Header;
        }
        else if ( Y >= PageMetrics.YLimit || ( null !== ( TempHdrFtr = this.Pages[PageIndex].Footer ) && true === TempHdrFtr.Is_PointInDrawingObjects( X, Y ) ) )
        {
            if ( null === this.Pages[PageIndex].Footer )
            {
                if ( false === editor.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_HdrFtr) )
                {
                    // Меняем старый режим редактирования, чтобы при Undo/Redo возвращаться в режим редактирования документа
                    this.LogicDocument.SetDocPosType(docpostype_Content);
                    this.LogicDocument.StartAction(AscDFH.historydescription_Document_AddFooter);
                    this.LogicDocument.SetDocPosType(docpostype_HdrFtr);
                    HdrFtr = this.LogicDocument.Create_SectionHdrFtr( hdrftr_Footer, PageIndex );

					if (this.CurHdrFtr)
						this.CurHdrFtr.RemoveSelection();

					this.CurHdrFtr = HdrFtr;

                    this.LogicDocument.Recalculate();
                    this.LogicDocument.FinalizeAction();
                }
                else
                    return false;
            }
            else
                HdrFtr = this.Pages[PageIndex].Footer;
        }

        if ( null === HdrFtr )
        {
            // Ничего не делаем и отключаем дальнейшую обработку MouseUp и MouseMove
            this.WaitMouseDown = true;

            return true;
        }
        else
        {
            this.WaitMouseDown = false;
        }

        // В зависимости от страницы и позиции на странице мы активируем(делаем текущим)
        // соответствующий колонтитул
        var oPrevHdrFtr = this.CurHdrFtr;

		// Очищаем селект, если он был в предыдущем колонтитуле
		if (oPrevHdrFtr && (oPrevHdrFtr !== HdrFtr || OldPage != this.CurPage))
		{
			oPrevHdrFtr.RemoveSelection();
		}

		this.CurHdrFtr = HdrFtr;

		if ( null != this.CurHdrFtr )
        {
            this.CurHdrFtr.Selection_SetStart( X, Y, PageIndex, MouseEvent );
            if ( true === bActivate )
            {
                var NewMouseEvent = {};
                NewMouseEvent.Type       = AscCommon.g_mouse_event_type_up;
                NewMouseEvent.ClickCount = 1;
                this.CurHdrFtr.Selection_SetEnd( X, Y, PageIndex, NewMouseEvent );
                this.CurHdrFtr.Content.MoveCursorToStartPos(false);
            }
        }

        return true;
    },

    Selection_SetEnd : function(X, Y, PageIndex, MouseEvent)
    {
        if ( true === this.WaitMouseDown )
            return;

        if ( null != this.CurHdrFtr )
        {
            // Селект может происходить только внутри одного колонтитула, а колонтитул
            // не может быть разбит на несколько страниц
            var ResY = Y;

            if (docpostype_DrawingObjects != this.CurHdrFtr.Content.GetDocPosType())
            {
                if ( PageIndex > this.CurPage )
                    ResY = this.LogicDocument.Get_PageLimits(this.CurPage).YLimit + 10;
                else if ( PageIndex < this.CurPage )
                    ResY = -10;

                PageIndex = this.CurPage;
            }

            this.CurHdrFtr.Selection_SetEnd(X, ResY, PageIndex, MouseEvent);

            if ( false === this.ChangeCurPageOnEnd )
            {
                this.CurHdrFtr.Set_Page( this.CurPage );
            }
        }
    },

	IsMovingTableBorder : function()
    {
        if ( null != this.CurHdrFtr )
            return this.CurHdrFtr.IsMovingTableBorder();

        return false;
    },

	CheckPosInSelection : function(X, Y, PageAbs, NearPos)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.CheckPosInSelection(X, Y, PageAbs, NearPos);
	},

	IsSelectionEmpty : function(bCheckHidden)
	{
		if (null !== this.CurHdrFtr)
			return this.CurHdrFtr.Content.IsSelectionEmpty(bCheckHidden);

		return true;
	},

	SelectAll : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.SelectAll();
	},

    Get_NearestPos : function(PageNum, X, Y, bAnchor, Drawing)
    {
        var HdrFtr = (true === editor.isStartAddShape ? this.CurHdrFtr : this.Internal_GetContentByXY( X, Y, PageNum ));
        
        if ( null != HdrFtr )
            return HdrFtr.Get_NearestPos( X, Y, bAnchor, Drawing );
        else
            return { X : -1, Y : -1, Height : -1 };
    },

	GetCurrentParagraph : function(bIgnoreSelection, arrSelectedParagraphs, oPr)
	{
		return this.CurHdrFtr.GetCurrentParagraph(bIgnoreSelection, arrSelectedParagraphs, oPr);
	},

	StartSelectionFromCurPos : function()
	{
		if (null !== this.CurHdrFtr)
			this.CurHdrFtr.StartSelectionFromCurPos();
	},
//-----------------------------------------------------------------------------------
// Внутренние(вспомогательные) функции
//-----------------------------------------------------------------------------------

    // Возвращаем колонтитул по данной позиции
    Internal_GetContentByXY : function( X, Y, PageIndex )
    {
        var Header = null;
        var Footer = null;

        if ( undefined !== this.Pages[PageIndex] )
        {
            Header = this.Pages[PageIndex].Header;
            Footer = this.Pages[PageIndex].Footer;
        }
        
        var PageH = this.LogicDocument.Get_PageLimits( PageIndex).YLimit;

        if ( Y <= PageH / 2 && null != Header )
            return Header;
        else if ( Y >= PageH / 2 && null != Footer )
            return Footer;
        else if ( null != Header )
            return Header;
        else
            return Footer;

        return null;
    },

//-----------------------------------------------------------------------------------
// Функции для работы с таблицами
//-----------------------------------------------------------------------------------
	AddTableRow : function(bBefore)
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.AddTableRow(bBefore);
	},

	AddTableColumn : function(bBefore)
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.AddTableColumn(bBefore);
	},

	RemoveTableRow : function()
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.RemoveTableRow();
	},

	RemoveTableColumn : function()
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.RemoveTableColumn();
	},

	MergeTableCells : function()
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.MergeTableCells();
	},

	SplitTableCells : function(Cols, Rows)
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.SplitTableCells(Cols, Rows);
	},

	RemoveTableCells : function()
	{
		if (this.CurHdrFtr)
			this.CurHdrFtr.RemoveTableCells();
	},

	RemoveTable : function()
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.RemoveTable();
	},

	SelectTable : function(Type)
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.SelectTable(Type);
	},

	CanMergeTableCells : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.CanMergeTableCells();
	},

	CanSplitTableCells : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.CanSplitTableCells();
	},

	DistributeTableCells : function(isHorizontally)
	{
		if (this.CurHdrFtr)
			return this.CurHdrFtr.DistributeTableCells(isHorizontally);

		return false;
	},

//-----------------------------------------------------------------------------------
// Undo/Redo функции
//-----------------------------------------------------------------------------------
	GetSelectionState : function()
	{
		var HdrFtrState       = {};
		HdrFtrState.CurHdrFtr = this.CurHdrFtr;

		var State = null;
		if (null != this.CurHdrFtr)
			State = this.CurHdrFtr.Content.GetSelectionState();
		else
			State = [];

		State.push(HdrFtrState);

		return State;
	},

	SetSelectionState : function(State, StateIndex)
	{
		if (State.length <= 0)
			return;

		var HdrFtrState = State[StateIndex];
		this.CurHdrFtr  = HdrFtrState.CurHdrFtr;

		if (null != this.CurHdrFtr)
			this.CurHdrFtr.Content.SetSelectionState(State, StateIndex - 1);
	},
//-----------------------------------------------------------------------------------
// Функции для работы с гиперссылками
//-----------------------------------------------------------------------------------
	AddHyperlink : function(HyperProps)
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.AddHyperlink(HyperProps);
	},

	ModifyHyperlink : function(HyperProps)
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.ModifyHyperlink(HyperProps);
	},

	RemoveHyperlink : function()
	{
		if (null != this.CurHdrFtr)
			this.CurHdrFtr.RemoveHyperlink();
	},

	CanAddHyperlink : function(bCheckInHyperlink)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.CanAddHyperlink(bCheckInHyperlink);

		return false;
	},

	IsCursorInHyperlink : function(bCheckEnd)
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.IsCursorInHyperlink(bCheckEnd);

		return null;
	},
//-----------------------------------------------------------------------------------
// Функции для работы с комментариями
//-----------------------------------------------------------------------------------
	AddComment : function(Comment)
	{
		if (null != this.CurHdrFtr)
		{
			// Отмечаем, что данный комментарий добавлен к колонтитулу
			Comment.Set_TypeInfo(AscCommon.comment_type_HdrFtr, this.CurHdrFtr);
			this.CurHdrFtr.AddComment(Comment);
		}
	},

	CanAddComment : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.CanAddComment();

		return false;
	},

	GetSelectionAnchorPos : function()
	{
		if (null != this.CurHdrFtr)
			return this.CurHdrFtr.Content.GetSelectionAnchorPos();

		return {X : 0, Y : 0, Page : 0};
	}
};
CHeaderFooterController.prototype.GetStyleFromFormatting = function()
{
    if (null != this.CurHdrFtr)
        return this.CurHdrFtr.Content.GetStyleFromFormatting();

    return null;
};
CHeaderFooterController.prototype.GetSimilarNumbering = function(oEngine)
{
	if (this.CurHdrFtr)
		this.CurHdrFtr.Content.GetSimilarNumbering(oEngine)
};
CHeaderFooterController.prototype.GetPlaceHolderObject = function()
{
	if (this.CurHdrFtr)
		return this.CurHdrFtr.Content.GetPlaceHolderObject();

	return null;
};
CHeaderFooterController.prototype.SetParagraphFramePr = function(FramePr, bDelete)
{
    if (null !== this.CurHdrFtr)
        this.CurHdrFtr.SetParagraphFramePr(FramePr, bDelete);
};
CHeaderFooterController.prototype.GetSelectionBounds = function()
{
	if (null !== this.CurHdrFtr)
		return this.CurHdrFtr.GetSelectionBounds();

	return null;
};
CHeaderFooterController.prototype.Get_CurHdrFtr = function()
{
    return this.CurHdrFtr;
};
CHeaderFooterController.prototype.Set_CurHdrFtr = function(HdrFtr)
{
    if (null !== this.CurHdrFtr)
        this.CurHdrFtr.RemoveSelection();

    this.CurHdrFtr = HdrFtr;
};
CHeaderFooterController.prototype.RecalculatePageCountUpdate = function(nPageAbs, nPageCount)
{
	var oPage = this.Pages[nPageAbs];
	if (!oPage)
		return false;
	
	var oHeader = oPage.Header;
	var oFooter = oPage.Footer;

	var bNeedRecalc = false;
	if (oHeader && oHeader.Have_PageCountElement())
	{
		oHeader.Update_PageCountElements(nPageCount);
		bNeedRecalc = true;
	}

	if (false === bNeedRecalc && oFooter && oFooter.Have_PageCountElement())
	{
		oFooter.Update_PageCountElements(nPageCount);
		bNeedRecalc = true;
	}

	if (true === bNeedRecalc)
		return this.Recalculate(nPageAbs);

	return null;
};
CHeaderFooterController.prototype.HavePageCountElement = function()
{
	var nStartPage = -1;
	var nPagesCount = this.LogicDocument.Pages.length;
	for (var nPageAbs = 0; nPageAbs < nPagesCount; ++nPageAbs)
	{
		var oPage = this.Pages[nPageAbs];
		if (!oPage)
			continue;

		var oHeader = oPage.Header;
		var oFooter = oPage.Footer;

		if (oHeader && oHeader.Have_PageCountElement())
		{
			oHeader.ForceRecalculate(nPageAbs);
			if (-1 === nStartPage)
				nStartPage = nPageAbs;
		}

		if (oFooter && oFooter.Have_PageCountElement())
		{
			oFooter.ForceRecalculate(nPageAbs);
			if (-1 === nStartPage)
				nStartPage = nPageAbs;
		}
	}

	return nStartPage;
};
CHeaderFooterController.prototype.GetAllFields = function(isUseSelection, arrFields)
{
	if (this.CurHdrFtr)
		return this.CurHdrFtr.GetContent().GetAllFields(isUseSelection, arrFields);

	return arrFields ? arrFields : [];
};
CHeaderFooterController.prototype.IsTableCellSelection = function()
{
	if (this.CurHdrFtr)
		return this.CurHdrFtr.GetContent().IsTableCellSelection();

	return false;
};
CHeaderFooterController.prototype.AcceptRevisionChanges = function(Type, bAll)
{
    if (null !== this.CurHdrFtr)
        this.CurHdrFtr.Content.AcceptRevisionChanges(Type, bAll);
};
CHeaderFooterController.prototype.RejectRevisionChanges = function(Type, bAll)
{
    if (null !== this.CurHdrFtr)
        this.CurHdrFtr.Content.RejectRevisionChanges(Type, bAll);
};
CHeaderFooterController.prototype.Document_Is_SelectionLocked = function(nCheckType)
{
    // Любое действие внутри колонтитула лочит его
    this.Lock.Check(this.Get_Id());

    // Нужно запускать проверку дальше, чтобы проверить залоченность Sdt
    if (this.CurHdrFtr)
        this.CurHdrFtr.GetContent().Document_Is_SelectionLocked(nCheckType);
};
CHeaderFooterController.prototype.GetAllTablesOnPage = function(nPageAbs, arrTables)
{
	var oPage = this.Pages[nPageAbs];
	if (!oPage)
		return arrTables;

	if (oPage.Header)
		oPage.Header.GetAllTablesOnPage(nPageAbs, arrTables);

	if (oPage.Footer)
		oPage.Footer.GetAllTablesOnPage(nPageAbs, arrTables);

	return arrTables;
};


function CHdrFtrPage()
{
    this.Header = null;
    this.Footer = null;
}

//--------------------------------------------------------export----------------------------------------------------
window['AscCommonWord'] = window['AscCommonWord'] || {};
window['AscCommonWord'].CHeaderFooter = CHeaderFooter;
window['AscCommonWord'].CHeaderFooterController = CHeaderFooterController;
