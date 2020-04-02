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

//     SectPr  : Настройки секци (размеры, поля)
//               PgSz : размеры страницы
//                     W, H, Orient
//               PgMar: отступы страницы
//                      Top, Left, Right, Bottom, Header, Footer
//

// Import
var g_oTableId = AscCommon.g_oTableId;
var History = AscCommon.History;
var c_oAscSectionBreakType    = Asc.c_oAscSectionBreakType;

var section_borders_DisplayAllPages     = 0x00;
var section_borders_DisplayFirstPage    = 0x01;
var section_borders_DisplayNotFirstPage = 0x02;

var section_borders_OffsetFromPage = 0x00;
var section_borders_OffsetFromText = 0x01;

var section_borders_ZOrderBack  = 0x00;
var section_borders_ZOrderFront = 0x01;

var section_footnote_RestartContinuous = 0x00;
var section_footnote_RestartEachSect   = 0x01;
var section_footnote_RestartEachPage   = 0x02;

var section_footnote_PosBeneathText = 0x00;
var section_footnote_PosDocEnd      = 0x01;
var section_footnote_PosPageBottom  = 0x02;
var section_footnote_PosSectEnd     = 0x03;

function CSectionPr(LogicDocument)
{
    this.Id = AscCommon.g_oIdCounter.Get_NewId();

    this.Type          = 'undefined' !== typeof c_oAscSectionBreakType ? c_oAscSectionBreakType.NextPage : undefined;
    this.PageSize      = new CSectionPageSize();
    this.PageMargins   = new CSectionPageMargins();

    this.LogicDocument = LogicDocument;

    this.Borders       = new CSectionBorders();
    this.PageNumType   = new CSectionPageNumType();

    this.FooterFirst   = null;
    this.FooterEven    = null;
    this.FooterDefault = null;

    this.HeaderFirst   = null;
    this.HeaderEven    = null;
    this.HeaderDefault = null;

    this.TitlePage     = false;
	this.GutterRTL     = false;

    this.Columns       = new CSectionColumns(this);
	this.FootnotePr    = new CFootnotePr();

    // Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
    g_oTableId.Add( this, this.Id );
}

CSectionPr.prototype =
{
    Get_Id : function()
    {
        return this.Id;
    },

    Copy : function(Other, CopyHdrFtr, oCopyPr)
    {
        if (!Other)
            return;

        // Тип
        this.Set_Type( Other.Type );

		// Настройки страницы
		this.SetPageSize(Other.PageSize.W, Other.PageSize.H);
		this.SetOrientation(Other.PageSize.Orient, false);

		// Настройки отступов
		this.SetPageMargins(Other.PageMargins.Left, Other.PageMargins.Top, Other.PageMargins.Right, Other.PageMargins.Bottom);
		this.SetGutter(Other.PageMargins.Gutter);

        // Настройки границ
        this.Set_Borders_Left( Other.Borders.Left );
        this.Set_Borders_Top( Other.Borders.Top );
        this.Set_Borders_Right( Other.Borders.Right );
        this.Set_Borders_Bottom( Other.Borders.Bottom );
        this.Set_Borders_Display( Other.Borders.Display );
		this.SetBordersOffsetFrom(Other.Borders.OffsetFrom);
        this.Set_Borders_ZOrder( Other.Borders.ZOrder );
        this.Set_TitlePage(Other.TitlePage);
        this.SetGutterRTL(Other.GutterRTL);

        // Колонтитулы
        if (true === CopyHdrFtr)
        {
            if (Other.HeaderFirst)
                this.Set_Header_First(Other.HeaderFirst.Copy(this.LogicDocument, oCopyPr));
            else
                this.Set_Header_First(null);

            if (Other.HeaderEven)
                this.Set_Header_Even(Other.HeaderEven.Copy(this.LogicDocument, oCopyPr));
            else
                this.Set_Header_Even(null);

            if (Other.HeaderDefault)
                this.Set_Header_Default(Other.HeaderDefault.Copy(this.LogicDocument, oCopyPr));
            else
                this.Set_Header_Default(null);

            if (Other.FooterFirst)
                this.Set_Footer_First(Other.FooterFirst.Copy(this.LogicDocument, oCopyPr));
            else
                this.Set_Footer_First(null);

            if (Other.FooterEven)
                this.Set_Footer_Even(Other.FooterEven.Copy(this.LogicDocument, oCopyPr));
            else
                this.Set_Footer_Even(null);

            if (Other.FooterDefault)
                this.Set_Footer_Default(Other.FooterDefault.Copy(this.LogicDocument, oCopyPr));
            else
                this.Set_Footer_Default(null);
        }
        else
        {
            this.Set_Header_First(Other.HeaderFirst);
            this.Set_Header_Even(Other.HeaderEven);
            this.Set_Header_Default(Other.HeaderDefault);
            this.Set_Footer_First(Other.FooterFirst);
            this.Set_Footer_Even(Other.FooterEven);
            this.Set_Footer_Default(Other.FooterDefault);
        }

        this.Set_PageNum_Start( Other.PageNumType.Start );

        this.Set_Columns_EqualWidth(Other.Columns.EqualWidth);
        this.Set_Columns_Num(Other.Columns.Num);
        this.Set_Columns_Sep(Other.Columns.Sep);
        this.Set_Columns_Space(Other.Columns.Space);
        for (var ColumnIndex = 0, ColumnsCount = Other.Columns.Cols.length; ColumnIndex < ColumnsCount; ++ColumnIndex)
        {
            var Column = Other.Columns.Cols[ColumnIndex];
            this.Set_Columns_Col(ColumnIndex, Column.W, Column.Space);
        }

        this.SetFootnotePos(Other.FootnotePr.Pos);
        this.SetFootnoteNumStart(Other.FootnotePr.NumStart);
        this.SetFootnoteNumRestart(Other.FootnotePr.NumRestart);
        this.SetFootnoteNumFormat(Other.FootnotePr.NumFormat);
    },
    
    Clear_AllHdrFtr : function()
    {
        this.Set_Header_First(null);
        this.Set_Header_Even(null);
        this.Set_Header_Default(null);
        this.Set_Footer_First(null);
        this.Set_Footer_Even(null);
        this.Set_Footer_Default(null);
    },

	GetAllHdrFtrs : function(HdrFtrs)
    {
        if (!HdrFtrs)
            HdrFtrs = [];

        if (null !== this.HeaderFirst) HdrFtrs.push(this.HeaderFirst);
        if (null !== this.HeaderEven) HdrFtrs.push(this.HeaderEven);
        if (null !== this.HeaderDefault) HdrFtrs.push(this.HeaderDefault);

        if (null !== this.FooterFirst) HdrFtrs.push(this.FooterFirst);
        if (null !== this.FooterEven) HdrFtrs.push(this.FooterEven);
        if (null !== this.FooterDefault) HdrFtrs.push(this.FooterDefault);

        return HdrFtrs;
    },

    Compare_PageSize : function(OtherSectionPr)
    {
        var ThisPS = this.PageSize;
        var OtherPS = OtherSectionPr.PageSize;

        if ( Math.abs( ThisPS.W - OtherPS.W ) > 0.001 || Math.abs( ThisPS.H - OtherPS.H ) > 0.001 || ThisPS.Orient !== OtherPS.Orient )
            return false;

        return true;
    },

	Set_Type : function(Type)
	{
		if (this.Type !== Type)
		{
			History.Add(new CChangesSectionType(this, this.Type, Type));
			this.Type = Type;
		}
	},

    Get_Type : function()
    {
        return this.Type;
    },

	Set_Borders_Left : function(Border)
	{
		if (true !== this.Borders.Left.Compare(Border))
		{
			History.Add(new CChangesSectionBordersLeft(this, this.Borders.Left, Border));
			this.Borders.Left = Border;
		}
	},

    Get_Borders_Left : function()
    {
        return this.Borders.Left;
    },

	Set_Borders_Top : function(Border)
	{
		if (true !== this.Borders.Top.Compare(Border))
		{
			History.Add(new CChangesSectionBordersTop(this, this.Borders.Top, Border));
			this.Borders.Top = Border;
		}
	},

    Get_Borders_Top : function()
    {
        return this.Borders.Top;
    },

	Set_Borders_Right : function(Border)
	{
		if (true !== this.Borders.Right.Compare(Border))
		{
			History.Add(new CChangesSectionBordersRight(this, this.Borders.Right, Border));
			this.Borders.Right = Border;
		}
	},

    Get_Borders_Right : function()
    {
        return this.Borders.Right;
    },

	Set_Borders_Bottom : function(Border)
	{
		if (true !== this.Borders.Bottom.Compare(Border))
		{
			History.Add(new CChangesSectionBordersBottom(this, this.Borders.Bottom, Border));
			this.Borders.Bottom = Border;
		}
	},

    Get_Borders_Bottom : function()
    {
        return this.Borders.Bottom;
    },

	Set_Borders_Display : function(Display)
	{
		if (Display !== this.Borders.Display)
		{
			History.Add(new CChangesSectionBordersDisplay(this, this.Borders.Display, Display));
			this.Borders.Display = Display;
		}
	},

    Get_Borders_Display : function()
    {
        return this.Borders.Display;
    },

	Set_Borders_ZOrder : function(ZOrder)
	{
		if (ZOrder !== this.Borders.ZOrder)
		{
			History.Add(new CChangesSectionBordersZOrder(this, this.Borders.ZOrder, ZOrder));
			this.Borders.ZOrder = ZOrder;
		}
	},

    Get_Borders_ZOrder : function()
    {
        return this.Borders.ZOrder;
    },

	Set_Footer_First : function(Footer)
	{
		if (Footer !== this.FooterFirst)
		{
			History.Add(new CChangesSectionFooterFirst(this, this.FooterFirst, Footer));
			this.FooterFirst = Footer;
		}
	},
    
    Get_Footer_First : function()
    {
        return this.FooterFirst;
    },

	Set_Footer_Even : function(Footer)
	{
		if (Footer !== this.FooterEven)
		{
			History.Add(new CChangesSectionFooterEven(this, this.FooterEven, Footer));
			this.FooterEven = Footer;
		}
	},

    Get_Footer_Even : function()
    {
        return this.FooterEven;
    },

	Set_Footer_Default : function(Footer)
	{
		if (Footer !== this.FooterDefault)
		{
			History.Add(new CChangesSectionFooterDefault(this, this.FooterDefault, Footer));
			this.FooterDefault = Footer;
		}
	},

    Get_Footer_Default : function()
    {
        return this.FooterDefault;
    },

	Set_Header_First : function(Header)
	{
		if (Header !== this.HeaderFirst)
		{
			History.Add(new CChangesSectionHeaderFirst(this, this.HeaderFirst, Header));
			this.HeaderFirst = Header;
		}
	},

    Get_Header_First : function()
    {
        return this.HeaderFirst;
    },

	Set_Header_Even : function(Header)
	{
		if (Header !== this.HeaderEven)
		{
			History.Add(new CChangesSectionHeaderEven(this, this.HeaderEven, Header));
			this.HeaderEven = Header;
		}
	},

    Get_Header_Even : function()
    {
        return this.HeaderEven;
    },

	Set_Header_Default : function(Header)
	{
		if (Header !== this.HeaderDefault)
		{
			History.Add(new CChangesSectionHeaderDefault(this, this.HeaderDefault, Header));
			this.HeaderDefault = Header;
		}
	},

    Get_Header_Default : function()
    {
        return this.HeaderDefault;
    },

	Set_TitlePage : function(Value)
	{
		if (Value !== this.TitlePage)
		{
			History.Add(new CChangesSectionTitlePage(this, this.TitlePage, Value));
			this.TitlePage = Value;
		}
	},
    
    Get_TitlePage : function()
    {
        return this.TitlePage;
    },
    
    GetHdrFtr : function(bHeader, bFirst, bEven)
    {
        if ( true === bHeader )
        {
            if ( true === bFirst )
                return this.HeaderFirst;
            else if ( true === bEven )
                return this.HeaderEven;
            else
                return this.HeaderDefault;
        }
        else
        {
            if ( true === bFirst )
                return this.FooterFirst;
            else if ( true === bEven )
                return this.FooterEven;
            else
                return this.FooterDefault;
        }
    },
    
    Set_HdrFtr : function(bHeader, bFirst, bEven, HdrFtr)
    {
        if ( true === bHeader )
        {
            if ( true === bFirst )
                return this.Set_Header_First( HdrFtr );
            else if ( true === bEven )
                return this.Set_Header_Even( HdrFtr );
            else
                return this.Set_Header_Default( HdrFtr );
        }
        else
        {
            if ( true === bFirst )
                return this.Set_Footer_First( HdrFtr );
            else if ( true === bEven )
                return this.Set_Footer_Even( HdrFtr );
            else
                return this.Set_Footer_Default( HdrFtr );
        }
    },
    
    GetHdrFtrInfo : function(HdrFtr)
    {
        if  ( HdrFtr === this.HeaderFirst )
            return { Header : true, First : true, Even : false };
        else if ( HdrFtr === this.HeaderEven )
            return { Header : true, First : false, Even : true };
        else if ( HdrFtr === this.HeaderDefault )
            return { Header : true, First : false, Even : false };
        else if ( HdrFtr === this.FooterFirst )
            return { Header : false, First : true, Even : false };
        else if ( HdrFtr === this.FooterEven )
            return { Header : false, First : false, Even : true };
        else if ( HdrFtr === this.FooterDefault )
            return { Header : false, First : false, Even : false };

        return null;
    },

	Set_PageNum_Start : function(Start)
	{
		if (Start !== this.PageNumType.Start)
		{
			History.Add(new CChangesSectionPageNumTypeStart(this, this.PageNumType.Start, Start));
			this.PageNumType.Start = Start;
		}
	},
    
    Get_PageNum_Start : function()
    {
        return this.PageNumType.Start;
    },

    Get_ColumnsCount : function()
    {
        return this.Columns.Get_Count();
    },

    Get_ColumnWidth : function(ColIndex)
    {
        return this.Columns.Get_ColumnWidth(ColIndex);
    },

    Get_ColumnSpace : function(ColIndex)
    {
        return this.Columns.Get_ColumnSpace(ColIndex);
    },

	Get_ColumnsSep : function()
	{
		return this.Columns.Sep;
	},

	Set_Columns_EqualWidth : function(Equal)
	{
		if (Equal !== this.Columns.Equal)
		{
			History.Add(new CChangesSectionColumnsEqualWidth(this, this.Columns.EqualWidth, Equal));
			this.Columns.EqualWidth = Equal;
		}
	},

	Set_Columns_Space : function(Space)
	{
		if (Space !== this.Columns.Space)
		{
			History.Add(new CChangesSectionColumnsSpace(this, this.Columns.Space, Space));
			this.Columns.Space = Space;
		}
	},

	Set_Columns_Num : function(_Num)
	{
		var Num = Math.max(_Num, 1);

		if (Num !== this.Columns.Num)
		{
			History.Add(new CChangesSectionColumnsNum(this, this.Columns.Num, Num));
			this.Columns.Num = Num;
		}
	},

	Set_Columns_Sep : function(Sep)
	{
		if (Sep !== this.Columns.Sep)
		{
			History.Add(new CChangesSectionColumnsSep(this, this.Columns.Sep, Sep));
			this.Columns.Sep = Sep;
		}
	},

	Set_Columns_Cols : function(Cols)
	{
		History.Add(new CChangesSectionColumnsSetCols(this, this.Columns.Cols, Cols));
		this.Columns.Cols = Cols;
	},

	Set_Columns_Col : function(Index, W, Space)
	{
		var OldCol = this.Columns.Cols[Index];

		if (undefined === OldCol || OldCol.Space !== Space || OldCol.W !== W)
		{
			var NewCol   = new CSectionColumn();
			NewCol.W     = W;
			NewCol.Space = Space;

			History.Add(new CChangesSectionColumnsCol(this, OldCol, NewCol, Index));
			this.Columns.Cols[Index] = NewCol;
		}
	},
    
    Get_LayoutInfo : function()
    {
        // Получаем информацию о колонках в данной секции
        
        var Margins = this.PageMargins;
        var H       = this.PageSize.H;
        var _W      = this.PageSize.W;
        var W       = _W - Margins.Left - Margins.Right;
        
        // Если так случилось, что правое и левое поля в сумме больше ширины, тогда оставляем для документа 1 см ширины.
        if ( W < 0 )
            W = 10;
        
        var Columns = this.Columns;
        
        var Layout = new CSectionLayoutInfo(Margins.Left, Margins.Top, _W - Margins.Right, H - Margins.Bottom);
        var ColumnsInfo = Layout.Columns;
        
        if ( true === Columns.EqualWidth )
        {
            var Num   = Math.max( Columns.Num, 1 );
            var Space = Columns.Space;
            
            var ColW  = (W - Space * ( Num - 1 )) / Num;
            
            // Если так случилось, что под колонки места не осталось, тогда делаем колонки шириной 0.3 мм, оставшееся 
            // свободное место распределяем под Space, но если и оставшегося места не осталось, тогда Space делаем 0, а
            // колонки пусть выходят за пределы W.
            if ( ColW < 0 )
            {
                ColW = 0.3;
                
                var __W = W - ColW * Num;
                
                if ( _W > 0 && Num > 1 )
                    Space = _W / ( Num - 1 );
                else
                    Space = 0;
            }
            
            var X = Margins.Left;
            for ( var Pos = 0; Pos < Num; Pos++ )
            {
                var X0 = X;
                var X1 = X + ColW;
                
                ColumnsInfo.push( new CSectionLayoutColumnInfo(X0, X1) );
                
                X += ColW + Space;
            }
        }
        else
        {
            var Num = Columns.Cols.length;
            
            // Когда задаются колонки не равномерно, то Word плюет на поля, заданные в документа и ориентируется только
            // по размеру колонок дальше. (если ни 1 колонка не задана, тогда Word добавляет 1 колонку шириной 17.09 см)
            
            if ( Num <= 0 )
            {
                ColumnsInfo.push( new CSectionLayoutColumnInfo(Margins.Left, Margins.Left + 170.9) );
            }
            else
            {
                var X = Margins.Left;
                for ( var Pos = 0; Pos < Num; Pos++ )
                {
                    var Col = this.Columns.Cols[Pos];
                    var X0 = X;
                    var X1 = X + Col.W;

                    ColumnsInfo.push( new CSectionLayoutColumnInfo(X0, X1) );
                    
                    X += Col.W + Col.Space;
                }
            }
        }       
        
        return Layout;
    },
//----------------------------------------------------------------------------------------------------------------------
// Undo/Redo функции
//----------------------------------------------------------------------------------------------------------------------
    Refresh_RecalcData : function(Data)
    {
        // Найдем данную секцию в документе
        var Index = this.LogicDocument.SectionsInfo.Find( this );

        if ( -1 === Index )
            return;

        // Здесь есть 1 исключение: когда мы добавляем колонтитул для первой страницы, может так получиться, что 
        // у данной секции флаг TitlePage = False, а значит пересчет надо запускать с места где данный колонтитул
        // первый раз начнет использоваться, а не с текущей секции.

        if ( (AscDFH.historyitem_Section_Header_First === Data.Type || AscDFH.historyitem_Section_Footer_First === Data.Type) && false === this.TitlePage )
        {
            var bHeader = AscDFH.historyitem_Section_Header_First === Data.Type ? true : false
            var SectionsCount = this.LogicDocument.SectionsInfo.Get_SectionsCount();
            while ( Index < SectionsCount - 1 )
            {
                Index++;

                var TempSectPr = this.LogicDocument.SectionsInfo.Get_SectPr2(Index).SectPr;

                // Если в следующей секции свой колонтитул, тогда наш добавленный колонтитул вообще ни на что не влияет
                if ( (true === bHeader && null !== TempSectPr.Get_Header_First()) || (true !== bHeader && null !== TempSectPr.Get_Footer_First()) )
                    break;

                // Если в следующей секции есть титульная страница, значит мы нашли нужную секцию
                if ( true === TempSectPr.Get_TitlePage() )
                {
                    if ( 0 === Index )
                    {
                        this.LogicDocument.Refresh_RecalcData2(0, 0);
                    }
                    else
                    {
                        var DocIndex = this.LogicDocument.SectionsInfo.Elements[Index - 1].Index + 1;
                        this.LogicDocument.Refresh_RecalcData2( DocIndex, 0 );
                    }
                }
            }
        }
        else
        {
            if ( 0 === Index )
            {
                // Первая секция, значит мы должны пересчитать начиная с самого начала документа
                this.LogicDocument.Refresh_RecalcData2(0, 0);
            }
            else
            {
                // Ищем номер элемента, на котором закончилась предыдущая секция, начиная со следующего после него элемента
                // и пересчитываем документ. 
                var DocIndex = this.LogicDocument.SectionsInfo.Elements[Index - 1].Index + 1;
                this.LogicDocument.Refresh_RecalcData2( DocIndex, 0 );
            }
        }
        
        // Дополнительно кроме этого мы должны обновить пересчет в колонтитулах, причем только начиная с данной секции
        this.LogicDocument.On_SectionChange( this );
    },
//----------------------------------------------------------------------------------------------------------------------
// Функции совместного редактирования
//----------------------------------------------------------------------------------------------------------------------
    Write_ToBinary2 : function(Writer)
    {
        Writer.WriteLong( AscDFH.historyitem_type_Section );

        // String2  : Id
        // String2  : Id LogicDocument
        // Variable : PageSize
        // Variable : PageMargins
        // Byte     : Type
        // Variable : Borders        
        // Колонтитулы не пишем в бинарник, при созданиии класса они всегда null, а TitlePage = false
        // Variable : PageNumType
        // Variable : CSectionColumns
		// Variable : CFootnotePr
		// Bool     : GutterRTL

        Writer.WriteString2( "" + this.Id );
        Writer.WriteString2( "" + this.LogicDocument.Get_Id() );
        this.PageSize.Write_ToBinary( Writer );
        this.PageMargins.Write_ToBinary( Writer );
        Writer.WriteByte( this.Type );
        this.Borders.Write_ToBinary( Writer );
        this.PageNumType.Write_ToBinary( Writer );
        this.Columns.Write_ToBinary(Writer);
		this.FootnotePr.WriteToBinary(Writer);
		Writer.WriteBool(this.GutterRTL);
    },

    Read_FromBinary2 : function(Reader)
    {
        // String2  : Id
        // String2  : Id LogicDocument
        // Variable : PageSize
        // Variable : PageMargins
        // Byte     : Type
        // Variable : Borders
        // Колонтитулы не пишем в бинарник, при созданиии класса они всегда null, а TitlePage = false
        // Variable : PageNumType
        // Variable : CSectionColumns
		// Variable : CFootnotePr
		// Bool     : GutterRTL

        this.Id = Reader.GetString2();
        this.LogicDocument = g_oTableId.Get_ById( Reader.GetString2() );
        this.PageSize.Read_FromBinary( Reader );
        this.PageMargins.Read_FromBinary( Reader );
        this.Type = Reader.GetByte();
        this.Borders.Read_FromBinary( Reader );
        this.PageNumType.Read_FromBinary( Reader );
        this.Columns.Read_FromBinary(Reader);
		this.FootnotePr.ReadFromBinary(Reader);
		this.GutterRTL = Reader.GetBool();
    }
};
/**
 * Проверяем, есть ли хоть один колонтитул в данной секции
 * @returns {boolean}
 */
CSectionPr.prototype.IsAllHdrFtrNull = function()
{
	if (null !== this.FooterFirst
		|| null !== this.HeaderFirst
		|| null !== this.FooterDefault
		|| null !== this.HeaderDefault
		|| null !== this.FooterEven
		|| null !== this.HeaderEven)
		return false;

	return true;
};
CSectionPr.prototype.GetFootnotePr = function()
{
	return this.FootnotePr;
};
CSectionPr.prototype.SetFootnotePos = function(nPos)
{
	if (this.FootnotePr.Pos !== nPos)
	{
		History.Add(new CChangesSectionFootnotePos(this, this.FootnotePr.Pos, nPos));
		this.FootnotePr.Pos = nPos;
	}
};
CSectionPr.prototype.GetFootnotePos = function()
{
	if (undefined === this.FootnotePr.Pos)
		return section_footnote_PosPageBottom;

	return this.FootnotePr.Pos;
};
CSectionPr.prototype.SetFootnoteNumStart = function(nStart)
{
	if (this.FootnotePr.NumStart !== nStart)
	{
		History.Add(new CChangesSectionFootnoteNumStart(this, this.FootnotePr.NumStart, nStart));
		this.FootnotePr.NumStart = nStart;
	}
};
CSectionPr.prototype.GetFootnoteNumStart = function()
{
	if (undefined === this.FootnotePr.NumStart)
		return 1;

	return this.FootnotePr.NumStart;
};
CSectionPr.prototype.SetFootnoteNumRestart = function(nRestartType)
{
	if (this.FootnotePr.NumRestart !== nRestartType)
	{
		History.Add(new CChangesSectionFootnoteNumRestart(this, this.FootnotePr.NumRestart, nRestartType));
		this.FootnotePr.NumRestart = nRestartType;
	}
};
CSectionPr.prototype.GetFootnoteNumRestart = function()
{
	if (undefined === this.FootnotePr.NumRestart)
		return this.private_GetDocumentWideFootnotePr().NumRestart;

	return this.FootnotePr.NumRestart;
};
CSectionPr.prototype.SetFootnoteNumFormat = function(nFormatType)
{
	if (this.FootnotePr.NumFormat !== nFormatType)
	{
		History.Add(new CChangesSectionFootnoteNumFormat(this, this.FootnotePr.NumFormat, nFormatType));
		this.FootnotePr.NumFormat = nFormatType;
	}
};
CSectionPr.prototype.GetFootnoteNumFormat = function()
{
	if (undefined === this.FootnotePr.NumFormat)
		return this.private_GetDocumentWideFootnotePr().NumFormat;

	return this.FootnotePr.NumFormat;
};
CSectionPr.prototype.private_GetDocumentWideFootnotePr = function()
{
	return this.LogicDocument.Footnotes.FootnotePr;
};
CSectionPr.prototype.SetColumnProps = function(oColumnsProps)
{
	var EqualWidth = oColumnsProps.get_EqualWidth();
	this.Set_Columns_EqualWidth(oColumnsProps.get_EqualWidth());
	if (false === EqualWidth)
	{
		var X      = 0;
		var XLimit = this.GetContentFrameWidth();

		var Cols          = [];
		var SectionColumn = null;
		var Count         = oColumnsProps.get_ColsCount();
		for (var Index = 0; Index < Count; ++Index)
		{
			var Col             = oColumnsProps.get_Col(Index);
			SectionColumn       = new CSectionColumn();
			SectionColumn.W     = Col.get_W();
			SectionColumn.Space = Col.get_Space();

			if (X + SectionColumn.W > XLimit)
			{
				SectionColumn.W = XLimit - X;
				Cols.push(SectionColumn);
				X += SectionColumn.W;
				break;
			}

			X += SectionColumn.W;
			if (Index != Count - 1)
				X += SectionColumn.Space;

			Cols.push(SectionColumn);
		}

		if (SectionColumn && X < XLimit - 0.001)
		{
			SectionColumn.W += XLimit - X;
		}

		this.Set_Columns_Cols(Cols);
		this.Set_Columns_Num(Count);
	}
	else
	{
		this.Set_Columns_Num(oColumnsProps.get_Num());
		this.Set_Columns_Space(oColumnsProps.get_Space());
	}

	this.Set_Columns_Sep(oColumnsProps.get_Sep());
};
CSectionPr.prototype.SetGutter = function(nGutter)
{
	if (Math.abs(nGutter - this.PageMargins.Gutter) > 0.001)
	{
		History.Add(new CChangesSectionPageMarginsGutter(this, this.PageMargins.Gutter, nGutter));
		this.PageMargins.Gutter = nGutter;
	}
};
CSectionPr.prototype.GetGutter = function()
{
	return this.PageMargins.Gutter;
};
CSectionPr.prototype.SetGutterRTL = function(isRTL)
{
	if (isRTL !== this.GutterRTL)
	{
		History.Add(new CChangesSectionGutterRTL(this, this.GutterRTL, isRTL));
		this.GutterRTL = isRTL;
	}
};
CSectionPr.prototype.IsGutterRTL = function()
{
	return this.GutterRTL;
};
CSectionPr.prototype.SetPageMargins = function(_L, _T, _R, _B)
{
	// Значения могут прийти как undefined, в этом случае мы поля со значением undefined не меняем
	var L = ( undefined !== _L ? _L : this.PageMargins.Left );
	var T = ( undefined !== _T ? _T : this.PageMargins.Top );
	var R = ( undefined !== _R ? _R : this.PageMargins.Right );
	var B = ( undefined !== _B ? _B : this.PageMargins.Bottom );

	if (Math.abs(L - this.PageMargins.Left) > 0.001 || Math.abs(T - this.PageMargins.Top) > 0.001 || Math.abs(R - this.PageMargins.Right) > 0.001 || Math.abs(B - this.PageMargins.Bottom) > 0.001)
	{
		History.Add(new CChangesSectionPageMargins(this, {
			L : this.PageMargins.Left,
			T : this.PageMargins.Top,
			R : this.PageMargins.Right,
			B : this.PageMargins.Bottom
		}, {L : L, T : T, R : R, B : B}));

		this.PageMargins.Left   = L;
		this.PageMargins.Top    = T;
		this.PageMargins.Right  = R;
		this.PageMargins.Bottom = B;
	}
};
CSectionPr.prototype.GetPageMarginLeft = function()
{
	return this.PageMargins.Left;
};
CSectionPr.prototype.GetPageMarginRight = function()
{
	return this.PageMargins.Right;
};
CSectionPr.prototype.GetPageMarginTop = function()
{
	return this.PageMargins.Top;
};
CSectionPr.prototype.GetPageMarginBottom = function()
{
	return this.PageMargins.Bottom;
};
CSectionPr.prototype.SetPageSize = function(W, H)
{
	if (Math.abs(W - this.PageSize.W) > 0.001 || Math.abs(H - this.PageSize.H) > 0.001)
	{
		H = Math.max(2.6, H);
		W = Math.max(12.7, W);

		History.Add(new CChangesSectionPageSize(this, {W : this.PageSize.W, H : this.PageSize.H}, {W : W, H : H}));

		this.PageSize.W = W;
		this.PageSize.H = H;
	}
};
CSectionPr.prototype.GetPageWidth = function()
{
	return this.PageSize.W;
};
CSectionPr.prototype.GetPageHeight = function()
{
	return this.PageSize.H;
};
CSectionPr.prototype.SetOrientation = function(Orient, ApplySize)
{
	var _Orient = this.GetOrientation();
	if (_Orient !== Orient)
	{
		History.Add(new CChangesSectionPageOrient(this, this.PageSize.Orient, Orient));
		this.PageSize.Orient = Orient;

		if (true === ApplySize)
		{
			// При смене ориентации меняем местами высоту и ширину страницы и изменяем отступы

			var W = this.PageSize.W;
			var H = this.PageSize.H;

			var L = this.PageMargins.Left;
			var R = this.PageMargins.Right;
			var T = this.PageMargins.Top;
			var B = this.PageMargins.Bottom;

			this.SetPageSize(H, W);

			if (Asc.c_oAscPageOrientation.PagePortrait === Orient)
				this.SetPageMargins(T, R, B, L);
			else
				this.SetPageMargins(B, L, T, R);
		}
	}
};
CSectionPr.prototype.GetOrientation = function()
{
	if (this.PageSize.W > this.PageSize.H)
		return Asc.c_oAscPageOrientation.PageLandscape;

	return Asc.c_oAscPageOrientation.PagePortrait;
};
CSectionPr.prototype.GetColumnsCount = function()
{
	return this.Columns.Get_Count();
};
CSectionPr.prototype.GetColumnWidth = function(nColIndex)
{
	return this.Columns.Get_ColumnWidth(nColIndex);
};
CSectionPr.prototype.GetColumnSpace = function(nColIndex)
{
	return this.Columns.Get_ColumnSpace(nColIndex);
};
CSectionPr.prototype.GetColumnSep = function()
{
	return this.Columns.Sep;
};
CSectionPr.prototype.SetBordersOffsetFrom = function(nOffsetFrom)
{
	if (nOffsetFrom !== this.Borders.OffsetFrom)
	{
		History.Add(new CChangesSectionBordersOffsetFrom(this, this.Borders.OffsetFrom, nOffsetFrom));
		this.Borders.OffsetFrom = nOffsetFrom;
	}
};
CSectionPr.prototype.GetBordersOffsetFrom = function()
{
	return this.Borders.OffsetFrom;
};
CSectionPr.prototype.SetPageMarginHeader = function(nHeader)
{
	if (nHeader !== this.PageMargins.Header)
	{
		History.Add(new CChangesSectionPageMarginsHeader(this, this.PageMargins.Header, nHeader));
		this.PageMargins.Header = nHeader;
	}
};
CSectionPr.prototype.GetPageMarginHeader = function()
{
	return this.PageMargins.Header;
};
CSectionPr.prototype.SetPageMarginFooter = function(nFooter)
{
	if (nFooter !== this.PageMargins.Footer)
	{
		History.Add(new CChangesSectionPageMarginsFooter(this, this.PageMargins.Footer, nFooter));
		this.PageMargins.Footer = nFooter;
	}
};
CSectionPr.prototype.GetPageMarginFooter = function()
{
	return this.PageMargins.Footer;
};
/**
 * Получаем границы для расположения содержимого документа на заданной страницы
 * @param nPageAbs {number}
 * @returns {{Left: number, Top: number, Right: number, Bottom: number}}
 */
CSectionPr.prototype.GetContentFrame = function(nPageAbs)
{
	var nT = this.GetPageMarginTop();
	var nB = this.GetPageHeight() - this.GetPageMarginBottom();
	var nL = this.GetPageMarginLeft();
	var nR = this.GetPageWidth() - this.GetPageMarginRight();

	if (this.LogicDocument && this.LogicDocument.IsMirrorMargins() && 1 === nPageAbs % 2)
	{
		nL = this.GetPageMarginRight();
		nR = this.GetPageWidth() - this.GetPageMarginLeft();
	}

	var nGutter = this.GetGutter();
	if (nGutter > 0.001)
	{
		if (this.LogicDocument && this.LogicDocument.IsGutterAtTop())
		{
			nT += nGutter;
		}
		else
		{
			if (this.LogicDocument && this.LogicDocument.IsMirrorMargins() && 1 === nPageAbs % 2)
			{
				if (this.IsGutterRTL())
					nL += nGutter;
				else
					nR -= nGutter;
			}
			else
			{
				if (this.IsGutterRTL())
					nR -= nGutter;
				else
					nL += nGutter;
			}
		}
	}

	return {
		Left   : nL,
		Top    : nT,
		Right  : nR,
		Bottom : nB
	};
};
/**
 * Получаем ширину области для расположения содержимого документа
 * @returns {number}
 */
CSectionPr.prototype.GetContentFrameWidth = function()
{
	var nFrameWidth = this.GetPageWidth() - this.GetPageMarginLeft() - this.GetPageMarginRight();

	var nGutter = this.GetGutter();
	if (nGutter > 0.001 && !(this.LogicDocument && this.LogicDocument.IsGutterAtTop()))
		nFrameWidth -= nGutter;

	return nFrameWidth;
};
/**
 * Получаем высоту области для расположения содержимого документа
 * @returns {number}
 */
CSectionPr.prototype.GetContentFrameHeight = function()
{
	var nFrameHeight = this.GetPageHeight() - this.GetPageMarginTop() - this.GetPageMarginBottom();

	var nGutter = this.GetGutter();
	if (nGutter > 0.001 && this.LogicDocument && this.LogicDocument.IsGutterAtTop())
		nFrameHeight -= nGutter;

	return nFrameHeight;
};

function CSectionPageSize()
{
    this.W      = 210;
    this.H      = 297;
    this.Orient = Asc.c_oAscPageOrientation.PagePortrait;
}

CSectionPageSize.prototype =
{
    Write_ToBinary : function(Writer)
    {
        // Double : W
        // Double : H
        // Byte   : Orient

        Writer.WriteDouble( this.W );
        Writer.WriteDouble( this.H );
        Writer.WriteByte( this.Orient );
    },

    Read_FromBinary : function(Reader)
    {
        // Double : W
        // Double : H
        // Byte   : Orient

        this.W      = Reader.GetDouble();
        this.H      = Reader.GetDouble();
        this.Orient = Reader.GetByte();
    }
};

function CSectionPageMargins()
{
    this.Left   = 30; // 3 cm
    this.Top    = 20; // 2 cm
    this.Right  = 15; // 1.5 cm
    this.Bottom = 20; // 2 cm
	this.Gutter = 0;  // 0 cm
    
    this.Header = 12.5; // 1.25 cm
    this.Footer = 12.5; // 1.25 cm
}

CSectionPageMargins.prototype.Write_ToBinary = function(Writer)
{
	// Double : Left
	// Double : Top
	// Double : Right
	// Double : Bottom
	// Double : Header
	// Double : Footer

	Writer.WriteDouble(this.Left);
	Writer.WriteDouble(this.Top);
	Writer.WriteDouble(this.Right);
	Writer.WriteDouble(this.Bottom);
	Writer.WriteDouble(this.Header);
	Writer.WriteDouble(this.Footer);
	Writer.WriteDouble(this.Gutter);
};
CSectionPageMargins.prototype.Read_FromBinary = function(Reader)
{
	// Double : Left
	// Double : Top
	// Double : Right
	// Double : Bottom
	// Double : Header
	// Double : Footer
	// Double : Gutter

	this.Left   = Reader.GetDouble();
	this.Top    = Reader.GetDouble();
	this.Right  = Reader.GetDouble();
	this.Bottom = Reader.GetDouble();
	this.Header = Reader.GetDouble();
	this.Footer = Reader.GetDouble();
	this.Gutter = Reader.GetDouble();
};

function CSectionBorders()
{
    this.Top        = new CDocumentBorder();
    this.Bottom     = new CDocumentBorder();
    this.Left       = new CDocumentBorder();
    this.Right      = new CDocumentBorder();
    
    this.Display    = section_borders_DisplayAllPages;
    this.OffsetFrom = section_borders_OffsetFromText;
    this.ZOrder     = section_borders_ZOrderFront;
}

CSectionBorders.prototype =
{
    Write_ToBinary : function(Writer)
    {
        // Variable : Left
        // Variable : Top
        // Variable : Right
        // Variable : Bottom
        // Byte     : Display
        // Byte     : OffsetFrom
        // Byte     : ZOrder

        this.Left.Write_ToBinary(Writer);
        this.Top.Write_ToBinary(Writer);
        this.Right.Write_ToBinary(Writer);
        this.Bottom.Write_ToBinary(Writer);
        Writer.WriteByte(this.Display);
        Writer.WriteByte(this.OffsetFrom);
        Writer.WriteByte(this.ZOrder);
    },

    Read_FromBinary : function(Reader)
    {
        // Variable : Left
        // Variable : Top
        // Variable : Right
        // Variable : Bottom
        // Byte     : Display
        // Byte     : OffsetFrom
        // Byte     : ZOrder

        this.Left.Read_FromBinary(Reader);
        this.Top.Read_FromBinary(Reader);
        this.Right.Read_FromBinary(Reader);
        this.Bottom.Read_FromBinary(Reader);

        this.Display    = Reader.GetByte();
        this.OffsetFrom = Reader.GetByte();
        this.ZOrder     = Reader.GetByte();
    }
};
CSectionBorders.prototype.IsEmptyBorders = function()
{
	if (this.Top.IsNone() && this.Bottom.IsNone() && this.Left.IsNone() && this.Right.IsNone())
		return true;

	return false;
};

function CSectionPageNumType()
{
    this.Start = -1;
}

CSectionPageNumType.prototype = 
{
    Write_ToBinary : function(Writer)
    {
        // Long : Start
        
        Writer.WriteLong( this.Start );
    },
    
    Read_FromBinary : function(Reader)
    {
        // Long : Start

        this.Start = Reader.GetLong();
    }    
};


function CSectionPageNumInfo(FP, CP, bFirst, bEven, PageNum)
{
    this.FirstPage = FP;
    this.CurPage   = CP;
    this.bFirst    = bFirst;
    this.bEven     = bEven;
    
    this.PageNum   = PageNum;
}

CSectionPageNumInfo.prototype =
{
    Compare : function(Other)
    {
        if ( undefined === Other || null === Other || this.CurPage !== Other.CurPage || this.bFirst !== Other.bFirst || this.bEven !== Other.bEven || this.PageNum !== Other.PageNum )
            return false;
        
        return true;
    }
};

function CSectionColumn()
{
	this.W     = 0;
	this.Space = 0;
}

CSectionColumn.prototype.Write_ToBinary  = function(Writer)
{
	// Double : W
	// Double : Space

	Writer.WriteDouble(this.W);
	Writer.WriteDouble(this.Space);
};
CSectionColumn.prototype.Read_FromBinary = function(Reader)
{
	// Double : W
	// Double : Space

	this.W     = Reader.GetDouble();
	this.Space = Reader.GetDouble();
};

function CSectionColumns(SectPr)
{
	this.SectPr     = SectPr;
	this.EqualWidth = true;
	this.Num        = 1;
	this.Sep        = false;
	this.Space      = 30;

	this.Cols = [];
}

CSectionColumns.prototype.Write_ToBinary  = function(Writer)
{
	// Bool   : Equal
	// Long   : Num
	// Bool   : Sep
	// Double : Space

	// Long   : Количество колонок
	// Variable : Сами колонки

	Writer.WriteBool(this.EqualWidth);
	Writer.WriteLong(this.Num);
	Writer.WriteBool(this.Sep);
	Writer.WriteDouble(this.Space);

	var Count = this.Cols.length;
	Writer.WriteLong(Count);

	for (var Pos = 0; Pos < Count; Pos++)
	{
		this.Cols[Pos].Write_ToBinary(Writer);
	}
};
CSectionColumns.prototype.Read_FromBinary = function(Reader)
{
	// Bool   : Equal
	// Long   : Num
	// Bool   : Sep
	// Double : Space

	// Long   : Количество колонок
	// Variable : Сами колонки

	this.EqualWidth = Reader.GetBool();
	this.Num        = Reader.GetLong();
	this.Sep        = Reader.GetBool();
	this.Space      = Reader.GetDouble();

	var Count = Reader.GetLong();
	this.Cols = [];

	for (var Pos = 0; Pos < Count; Pos++)
	{
		this.Cols[Pos] = new CSectionColumn();
		this.Cols[Pos].Read_FromBinary(Reader);
	}
};
CSectionColumns.prototype.Get_Count       = function()
{
	if (true === this.EqualWidth)
	{
		return this.Num;
	}
	else
	{
		if (this.Cols.length <= 0)
			return 1;

		return this.Cols.length;
	}
};
CSectionColumns.prototype.Get_ColumnWidth = function(ColIndex)
{
	if (true === this.EqualWidth)
	{
		var nFrameW = this.SectPr.GetContentFrameWidth();
		return this.Num > 0 ? (nFrameW - this.Space * (this.Num - 1)) / this.Num : nFrameW;
	}
	else
	{
		if (this.Cols.length <= 0)
			return 0;

		ColIndex = Math.max(0, Math.min(this.Cols.length - 1, ColIndex));
		if (ColIndex < 0)
			return 0;

		return this.Cols[ColIndex].W;
	}
};
CSectionColumns.prototype.Get_ColumnSpace = function(ColIndex)
{
	if (true === this.EqualWidth)
	{
		return this.Space;
	}
	else
	{
		if (this.Cols.length <= 0)
			return this.Space;

		ColIndex = Math.max(0, Math.min(this.Cols.length - 1, ColIndex));
		if (ColIndex < 0)
			return this.Space;

		return this.Cols[ColIndex].Space;
	}
};

function CSectionLayoutColumnInfo(X, XLimit)
{
    this.X      = X;
    this.XLimit = XLimit;
    
    this.Pos    = 0;
    this.EndPos = 0;
}

function CSectionLayoutInfo(X, Y, XLimit, YLimit)
{
    this.X       = X;
    this.Y       = Y;
    this.XLimit  = XLimit;
    this.YLimit  = YLimit;
    this.Columns = [];
}

function CFootnotePr()
{
	this.NumRestart = undefined;
	this.NumFormat  = undefined;
	this.NumStart   = undefined;
	this.Pos        = undefined;
}
CFootnotePr.prototype.InitDefault = function()
{
	this.NumFormat  = Asc.c_oAscNumberingFormat.Decimal;
	this.NumRestart = section_footnote_RestartContinuous;
	this.NumStart   = 1;
	this.Pos        = section_footnote_PosPageBottom;
};
CFootnotePr.prototype.WriteToBinary = function(Writer)
{
	var StartPos = Writer.GetCurPosition();
	Writer.Skip(4);
	var Flags = 0;

	if (undefined !== this.NumFormat)
	{
		Writer.WriteLong(this.NumFormat);
		Flags |= 1;
	}

	if (undefined !== this.NumRestart)
	{
		Writer.WriteLong(this.NumRestart);
		Flags |= 2;
	}

	if (undefined !== this.NumStart)
	{
		Writer.WriteLong(this.NumStart);
		Flags |= 4;
	}

	if (undefined !== this.Pos)
	{
		Writer.WriteLong(this.Pos);
		Flags |= 8;
	}

	var EndPos = Writer.GetCurPosition();
	Writer.Seek(StartPos);
	Writer.WriteLong(Flags);
	Writer.Seek(EndPos);
};
CFootnotePr.prototype.ReadFromBinary = function(Reader)
{
	var Flags = Reader.GetLong();

	if (Flags & 1)
		this.NumFormat = Reader.GetLong();
	else
		this.NumFormat = undefined;

	if (Flags & 2)
		this.NumRestart = Reader.GetLong();
	else
		this.NumRestart = undefined;

	if (Flags & 4)
		this.NumStart = Reader.GetLong();
	else
		this.NumStart = undefined;

	if (Flags & 8)
		this.Pos = Reader.GetLong();
	else
		this.Pos = undefined;
};


//--------------------------------------------------------export----------------------------------------------------
window['AscCommonWord'] = window['AscCommonWord'] || {};
window['AscCommonWord'].CSectionPr = CSectionPr;
