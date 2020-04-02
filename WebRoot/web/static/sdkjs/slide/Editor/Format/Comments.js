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
(/**
 * @param {Window} window
 * @param {undefined} undefined
 */
    function (window, undefined) {

// Import
var g_oTableId = AscCommon.g_oTableId;
var History = AscCommon.History;

var comments_NoComment        = 0;
var comments_NonActiveComment = 1;
var comments_ActiveComment    = 2;



    AscDFH.changesFactory[AscDFH.historyitem_Comment_Position] =   AscDFH.CChangesDrawingsObjectNoId;
    AscDFH.changesFactory[AscDFH.historyitem_Comment_Change]   = AscDFH.CChangesDrawingsObjectNoId;
    AscDFH.changesFactory[AscDFH.historyitem_Comment_TypeInfo] =   AscDFH.CChangesDrawingsLong;


AscDFH.drawingsConstructorsMap[AscDFH.historyitem_Comment_Position] = AscFormat.CDrawingBaseCoordsWritable;
AscDFH.drawingsConstructorsMap[AscDFH.historyitem_Comment_Change] = CCommentData;


AscDFH.drawingsChangesMap[AscDFH.historyitem_Comment_Position] = function(oClass, value){oClass.x = value.a; oClass.y = value.b;};
AscDFH.drawingsChangesMap[AscDFH.historyitem_Comment_Change]   = function(oClass, value){
    oClass.Data = value;
    if(value){
        editor.sync_ChangeCommentData(oClass.Id, value);
    }
};
AscDFH.drawingsChangesMap[AscDFH.historyitem_Comment_TypeInfo] = function(oClass, value){oClass.m_oTypeInfo = value;};

function ParaComment(Start, Id)
{
    this.Id = AscCommon.g_oIdCounter.Get_NewId();

    this.Paragraph = null;

    this.Start     = Start;
    this.CommentId = Id;

    this.Type  = para_Comment;

    this.StartLine  = 0;
    this.StartRange = 0;

    this.Lines = [];
    this.LinesLength = 0;
}

ParaComment.prototype =
{
    Get_Id : function()
    {
        return this.Id;
    },

    SetCommentId : function(NewCommentId)
    {
    },

    Is_Empty : function()
    {
        return true;
    },

    Is_CheckingNearestPos : function()
    {
        return false;
    },

    Get_CompiledTextPr : function()
    {
        return null;
    },

    Clear_TextPr : function()
    {

    },

    Remove : function()
    {
        return false;
    },

    Get_DrawingObjectRun : function(Id)
    {
        return null;
    },

    Get_DrawingObjectContentPos : function(Id, ContentPos, Depth)
    {
        return false;
    },

    Get_Layout : function(DrawingLayout, UseContentPos, ContentPos, Depth)
    {
    },

    GetNextRunElements : function(RunElements, UseContentPos, Depth)
    {
    },

    GetPrevRunElements : function(RunElements, UseContentPos, Depth)
    {
    },

	CollectDocumentStatistics : function(ParaStats)
    {
    },

    Create_FontMap : function(Map)
    {
    },

    Get_AllFontNames : function(AllFonts)
    {
    },

	GetSelectedText : function(bAll, bClearText)
    {
        return "";
    },

	GetSelectDirection : function()
    {
        return 1;
    },

    Clear_TextFormatting : function( DefHyper )
    {
    },

    CanAddDropCap : function()
    {
        return null;
    },

	CheckSelectionForDropCap : function(isUsePos, oEndPos, nDepth)
	{
		return true;
	},

	Get_TextForDropCap : function(DropCapText, UseContentPos, ContentPos, Depth)
    {
    },

    Get_StartTabsCount : function(TabsCounter)
    {
        return true;
    },

    Remove_StartTabs : function(TabsCounter)
    {
        return true;
    },

    Copy : function(Selected)
    {
        return new ParaComment(this.Start, this.CommentId);
    },

    CopyContent : function(Selected)
    {
        return [];
    },

    Split : function()
    {
        return new ParaRun();
    },

    Apply_TextPr : function()
    {
    },

    CheckRevisionsChanges : function(Checker, ContentPos, Depth)
    {
    },

    Get_ParaPosByContentPos : function(ContentPos, Depth)
    {
        return new CParaPos(this.StartRange, this.StartLine, 0, 0);
    },
//-----------------------------------------------------------------------------------
// Функции пересчета
//-----------------------------------------------------------------------------------

    Recalculate_Reset : function(StartRange, StartLine)
    {
        this.StartLine   = StartLine;
        this.StartRange  = StartRange;
    },

    Recalculate_Range : function(PRS, ParaPr)
    {
    },

    Recalculate_Set_RangeEndPos : function(PRS, PRP, Depth)
    {
    },

    Recalculate_LineMetrics : function(PRS, ParaPr, _CurLine, _CurRange)
    {
    },

    Recalculate_Range_Width : function(PRSC, _CurLine, _CurRange)
    {
    },

    Recalculate_Range_Spaces : function(PRSA, CurLine, CurRange, CurPage)
    {
    },

    Recalculate_PageEndInfo : function(PRSI, _CurLine, _CurRange)
    {
    },

    SaveRecalculateObject : function(Copy)
    {
    },

    LoadRecalculateObject : function(RecalcObj, Parent)
    {
    },

    PrepareRecalculateObject : function()
    {
    },

    IsEmptyRange : function(_CurLine, _CurRange)
    {
        return true;
    },

    Check_Range_OnlyMath : function(Checker, CurRange, CurLine)
    {
    },

    Check_MathPara : function(Checker)
    {
    },

    Check_PageBreak : function()
    {
        return false;
    },

    CheckSplitPageOnPageBreak : function(oPBChecker)
    {
        return false;
    },

    Recalculate_CurPos : function(X, Y, CurrentRun, _CurRange, _CurLine, CurPage, UpdateCurPos, UpdateTarget, ReturnTarget)
    {
        return { X : X };
    },

	RecalculateMinMaxContentWidth : function()
    {

    },

    Get_Range_VisibleWidth : function(RangeW, _CurLine, _CurRange)
    {
    },

    Shift_Range : function(Dx, Dy, _CurLine, _CurRange)
    {
    },
//-----------------------------------------------------------------------------------
// Функции отрисовки
//-----------------------------------------------------------------------------------
    Draw_HighLights : function(PDSH)
    {
    },

    Draw_Elements : function(PDSE)
    {
    },

    Draw_Lines : function(PDSL)
    {
    },
//-----------------------------------------------------------------------------------
// Функции для работы с курсором
//-----------------------------------------------------------------------------------
    IsCursorPlaceable : function()
    {
        return false;
    },

    Cursor_Is_Start : function()
    {
        return true;
    },

    Cursor_Is_NeededCorrectPos : function()
    {
        return true;
    },

    Cursor_Is_End : function()
    {
        return true;
    },

	MoveCursorToStartPos : function()
    {
    },

	MoveCursorToEndPos : function(SelectFromEnd)
    {
    },

    Get_ParaContentPosByXY : function(SearchPos, Depth, _CurLine, _CurRange, StepEnd)
    {
        return false;
    },

    Get_ParaContentPos : function(bSelection, bStart, ContentPos, bUseCorrection)
    {
    },

    Set_ParaContentPos : function(ContentPos, Depth)
    {
    },

    Get_PosByElement : function(Class, ContentPos, Depth, UseRange, Range, Line)
    {
        if ( this === Class )
            return true;

        return false;
    },

    Get_ElementByPos : function(ContentPos, Depth)
    {
        return this;
    },

    Get_ClassesByPos : function(Classes, ContentPos, Depth)
    {
        Classes.push(this);
    },

    Get_PosByDrawing : function(Id, ContentPos, Depth)
    {
        return false;
    },

    Get_RunElementByPos : function(ContentPos, Depth)
    {
        return null;
    },

    Get_LastRunInRange : function(_CurLine, _CurRange)
    {
        return null;
    },

    Get_LeftPos : function(SearchPos, ContentPos, Depth, UseContentPos)
    {
    },

    Get_RightPos : function(SearchPos, ContentPos, Depth, UseContentPos, StepEnd)
    {
    },

    Get_WordStartPos : function(SearchPos, ContentPos, Depth, UseContentPos)
    {
    },

    Get_WordEndPos : function(SearchPos, ContentPos, Depth, UseContentPos, StepEnd)
    {
    },

    Get_EndRangePos : function(_CurLine, _CurRange, SearchPos, Depth)
    {
        return false;
    },

    Get_StartRangePos : function(_CurLine, _CurRange, SearchPos, Depth)
    {
        return false;
    },

    Get_StartRangePos2 : function(_CurLine, _CurRange, ContentPos, Depth)
    {
    },

	Get_EndRangePos2 : function(_CurLine, _CurRange, ContentPos, Depth)
	{
	},

    Get_StartPos : function(ContentPos, Depth)
    {
    },

    Get_EndPos : function(BehindEnd, ContentPos, Depth)
    {
    },
//-----------------------------------------------------------------------------------
// Функции для работы с селектом
//-----------------------------------------------------------------------------------
    Set_SelectionContentPos : function(StartContentPos, EndContentPos, Depth, StartFlag, EndFlag)
    {
    },

	RemoveSelection : function()
    {
    },

	SelectAll : function(Direction)
    {
    },

    Selection_DrawRange : function(_CurLine, _CurRange, SelectionDraw)
    {
    },

	IsSelectionEmpty : function(CheckEnd)
    {
        return true;
    },

    Selection_CheckParaEnd : function()
    {
        return false;
    },

	IsSelectedAll : function(Props)
    {
        return true;
    },

	SkipAnchorsAtSelectionStart : function(nDirection)
    {
        return true;
    },

    Selection_CheckParaContentPos : function(ContentPos)
    {
        return true;
    },


    Refresh_RecalcData : function()
    {
    },

    Write_ToBinary2 : function(Writer)
    {
    },

    Read_FromBinary2 : function(Reader)
    {
    }
};
ParaComment.prototype.SetParagraph = function(Paragraph)
{
	this.Paragraph = Paragraph;
};
ParaComment.prototype.GetCurrentParaPos = function()
{
    return new CParaPos(this.StartRange, this.StartLine, 0, 0);
};
ParaComment.prototype.Get_TextPr = function(ContentPos, Depth)
{
    return new CTextPr();
};
//----------------------------------------------------------------------------------------------------------------------
// Разное
//----------------------------------------------------------------------------------------------------------------------
ParaComment.prototype.SetReviewType = function(ReviewType, RemovePrChange){};
ParaComment.prototype.SetReviewTypeWithInfo = function(ReviewType, ReviewInfo){};
ParaComment.prototype.CheckRevisionsChanges = function(Checker, ContentPos, Depth){};
ParaComment.prototype.AcceptRevisionChanges = function(Type, bAll){};
ParaComment.prototype.RejectRevisionChanges = function(Type, bAll){};

function CWriteCommentData()
{
    this.Data = null; // CCommentData

    this.WriteAuthorId = 0;
    this.WriteCommentId = 0;
    this.WriteParentAuthorId = 0;
    this.WriteParentCommentId = 0;
    this.WriteTime = "";
    this.WriteText = "";

    this.AdditionalData = "";
    this.timeZoneBias = null;

    this.x = 0;
    this.y = 0;
}
CWriteCommentData.prototype =
{
    Calculate : function()
    {
        this.WriteTime = new Date(this.Data.m_sTime - 0).toISOString().slice(0, 19) + 'Z';
        this.timeZoneBias = this.Data.m_nTimeZoneBias;

        this.CalculateAdditionalData();
    },

    Calculate2 : function()
    {
        var dateMs = AscCommon.getTimeISO8601(this.WriteTime);
        if(!isNaN(dateMs)){
            this.WriteTime = dateMs + "";
        } else {
            this.WriteTime = "1";
        }
    },

    CalculateAdditionalData : function()
    {
        if (null == this.Data)
            this.AdditionalData = "";
        else
        {
            this.AdditionalData = "teamlab_data:";
            this.AdditionalData += ("0;" + this.Data.m_sUserId.length + ";" + this.Data.m_sUserId + ";" );
            this.AdditionalData += ("1;" + this.Data.m_sUserName.length + ";" + this.Data.m_sUserName + ";" );
            this.AdditionalData += ("2;1;" + (this.Data.m_bSolved ? "1;" : "0;"));
            if (this.Data.m_sOOTime)
            {
                var WriteOOTime = new Date(this.Data.m_sOOTime - 0).toISOString().slice(0, 19) + 'Z';
                this.AdditionalData += ("3;" + WriteOOTime.length + ";" + WriteOOTime + ";");
            }
            if (this.Data.m_sGuid)
            {
                this.AdditionalData += "4;" + this.Data.m_sGuid.length + ";" + this.Data.m_sGuid + ";";
            }
        }
    },

    ReadNextInteger : function(_parsed)
    {
        var _len = _parsed.data.length;
        var _found = -1;

        var _Found = ";".charCodeAt(0);
        for (var i = _parsed.pos; i < _len; i++)
        {
            if (_Found == _parsed.data.charCodeAt(i))
            {
                _found = i;
                break;
            }
        }

        if (-1 == _found)
            return -1;

        var _ret = parseInt(_parsed.data.substr(_parsed.pos, _found - _parsed.pos));
        if (isNaN(_ret))
            return -1;

        _parsed.pos = _found + 1;
        return _ret;
    },

    ParceAdditionalData : function(_comment_data)
    {
        if (this.AdditionalData.indexOf("teamlab_data:") != 0)
            return;

        var _parsed = { data : this.AdditionalData, pos : "teamlab_data:".length };

        while (true)
        {
            var _attr = this.ReadNextInteger(_parsed);
            if (-1 == _attr)
                break;

            var _len = this.ReadNextInteger(_parsed);
            if (-1 == _len)
                break;

            var _value = _parsed.data.substr(_parsed.pos, _len);
            _parsed.pos += (_len + 1);

            if (0 == _attr)
                _comment_data.m_sUserId = _value;
            else if (1 == _attr)
                _comment_data.m_sUserName = _value;
            else if (2 == _attr)
                _comment_data.m_bSolved = ("1" == _value) ? true : false;
            else if (3 == _attr)
            {
                var dateMs = AscCommon.getTimeISO8601(_value);
                if(!isNaN(dateMs))
                    _comment_data.m_sOOTime = dateMs + "";
			}
            else if (4 == _attr)
                _comment_data.m_sGuid = _value;
        }
    }
};

function CCommentAuthor()
{
    this.Name = "";
    this.Id = 0;
    this.LastId = 0;
    this.Initials = "";
}
CCommentAuthor.prototype =
{
    Calculate : function()
    {
        var arr = this.Name.split(" ");
        this.Initials = "";
        for (var i = 0; i < arr.length; i++)
        {
            if (arr[i].length > 0)
                this.Initials += (arr[i].substring(0, 1));
        }
    }
};


function CCommentData()
{
    this.m_sText      = "";
    this.m_sTime      = "";
    this.m_sOOTime      = "";
    this.m_sUserId    = "";
    this.m_sUserName  = "";
    this.m_sGuid  = "";
    this.m_sQuoteText = null;
    this.m_bSolved    = false;
    this.m_nTimeZoneBias = null;
    this.m_aReplies   = [];
}

CCommentData.prototype =
{

    createDuplicate: function(bNewGuid){
        var ret = new CCommentData();
        ret.m_sText = this.m_sText;
        ret.m_sTime = this.m_sTime;
        ret.m_sOOTime = this.m_sOOTime;
        ret.m_sUserId = this.m_sUserId;
        ret.m_sUserName = this.m_sUserName;
        ret.m_sGuid =  bNewGuid ? AscCommon.CreateGUID() : this.m_sGuid;
        ret.m_sQuoteText = this.m_sQuoteText;
        ret.m_bSolved = this.m_bSolved;
        ret.m_nTimeZoneBias = this.m_nTimeZoneBias;
        for(var i = 0; i < this.m_aReplies.length; ++i){
            ret.m_aReplies.push(this.m_aReplies[i].createDuplicate(bNewGuid));
        }
        return ret;
    },

    Add_Reply: function(CommentData)
    {
        this.m_aReplies.push( CommentData );
    },

    Set_Text: function(Text)
    {
        this.m_sText = Text;
    },

    Get_Text: function()
    {
        return this.m_sText;
    },

    Get_QuoteText: function()
    {
        return this.m_sQuoteText;
    },

    Set_QuoteText: function(Quote)
    {
        this.m_sQuoteText = Quote;
    },

    Get_Solved: function()
    {
        return this.m_bSolved;
    },

    Set_Solved: function(Solved)
    {
        this.m_bSolved = Solved;
    },

    Set_Name: function(Name)
    {
        this.m_sUserName = Name;
    },

    Get_Name: function()
    {
        return this.m_sUserName;
    },

    Set_Guid: function(Guid)
    {
        this.m_sGuid = Guid;
    },

    Get_Guid: function()
    {
        return this.m_sGuid;
    },

    Set_TimeZoneBias: function(timeZoneBias)
    {
        this.m_nTimeZoneBias = timeZoneBias;
    },

    Get_TimeZoneBias: function()
    {
        return this.m_nTimeZoneBias;
    },

    Get_RepliesCount: function()
    {
        return this.m_aReplies.length;
    },

    Get_Reply: function(Index)
    {
        if ( Index < 0 || Index >= this.m_aReplies.length )
            return null;

        return this.m_aReplies[Index];
    },

    Read_FromAscCommentData: function(AscCommentData)
    {
        this.m_sText      = AscCommentData.asc_getText();
        this.m_sTime      = AscCommentData.asc_getTime();
        this.m_sOOTime    = AscCommentData.asc_getOnlyOfficeTime();
        this.m_sUserId    = AscCommentData.asc_getUserId();
        this.m_sQuoteText = AscCommentData.asc_getQuoteText();
        this.m_bSolved    = AscCommentData.asc_getSolved();
        this.m_sUserName  = AscCommentData.asc_getUserName();
        this.m_sGuid      = AscCommentData.asc_getGuid();
        this.m_nTimeZoneBias= AscCommentData.asc_getTimeZoneBias();

        var RepliesCount  = AscCommentData.asc_getRepliesCount();
        for ( var Index = 0; Index < RepliesCount; Index++ )
        {
            var Reply = new CCommentData();
            Reply.Read_FromAscCommentData( AscCommentData.asc_getReply(Index) );
            this.m_aReplies.push( Reply );
        }
    },

    Write_ToBinary2: function(Writer)
    {
        // String            : m_sText
        // String            : m_sTime
        // String            : m_sOOTime
        // String            : m_sUserId
        // String            : m_sUserName
        // String            : m_sGuid
        // Bool              : Null ли TimeZoneBias
        // Long              : TimeZoneBias
        // Bool              : Null ли QuoteText
        // String            : (Если предыдущий параметр false) QuoteText
        // Bool              : Solved
        // Long              : Количество отетов
        // Array of Variable : Ответы

        var Count = this.m_aReplies.length;
        Writer.WriteString2( this.m_sText );
        Writer.WriteString2( this.m_sTime );
        Writer.WriteString2( this.m_sOOTime );
        Writer.WriteString2( this.m_sUserId );
        Writer.WriteString2( this.m_sUserName );
        Writer.WriteString2( this.m_sGuid );

        if ( null === this.m_nTimeZoneBias )
            Writer.WriteBool( true );
        else
        {
            Writer.WriteBool( false );
            Writer.WriteLong( this.m_nTimeZoneBias );
        }
        if ( null === this.m_sQuoteText )
            Writer.WriteBool( true );
        else
        {
            Writer.WriteBool( false );
            Writer.WriteString2( this.m_sQuoteText );
        }
        Writer.WriteBool( this.m_bSolved );
        Writer.WriteLong( Count );

        for ( var Index = 0; Index < Count; Index++ )
        {
            this.m_aReplies[Index].Write_ToBinary2(Writer);
        }
    },

    Read_FromBinary2: function(Reader)
    {
        // String            : m_sText
        // String            : m_sTime
        // String            : m_sOOTime
        // String            : m_sUserId
        // String            : m_sGuid
        // Bool              : Null ли TimeZoneBias
        // Long              : TimeZoneBias
        // Bool              : Null ли QuoteText
        // String            : (Если предыдущий параметр false) QuoteText
        // Bool              : Solved
        // Long              : Количество отетов
        // Array of Variable : Ответы

        this.m_sText     = Reader.GetString2();
        this.m_sTime     = Reader.GetString2();
        this.m_sOOTime   = Reader.GetString2();
        this.m_sUserId   = Reader.GetString2();
        this.m_sUserName = Reader.GetString2();
        this.m_sGuid     = Reader.GetString2();

        if ( true != Reader.GetBool()  )
            this.m_nTimeZoneBias = Reader.GetLong();
        else
            this.m_nTimeZoneBias = null;
        var bNullQuote = Reader.GetBool();
        if ( true != bNullQuote  )
            this.m_sQuoteText = Reader.GetString2();
        else
            this.m_sQuoteText = null;

        this.m_bSolved = Reader.GetBool();

        var Count = Reader.GetLong();
        this.m_aReplies.length = 0;
        for ( var Index = 0; Index < Count; Index++ )
        {
            var oReply = new CCommentData();
            oReply.Read_FromBinary2( Reader );
            this.m_aReplies.push( oReply );
        }
    },

    Write_ToBinary: function(Writer)
    {
        this.Write_ToBinary2(Writer);
    },

    Read_FromBinary: function(Reader)
    {
        this.Read_FromBinary2(Reader);
    }
};

var comment_type_Common = 1; // Комментарий к обычному тексу
var comment_type_HdrFtr = 2; // Комментарий к колонтитулу

function CComment(Parent, Data)
{
    this.Id     = AscCommon.g_oIdCounter.Get_NewId();

    this.Parent = Parent;
    this.Data   = Data;

    this.x = null;
    this.y = null;
    this.selected = false;
    this.m_oTypeInfo =
    {
        Type : comment_type_Common,
        Data : null
    };

    this.m_oStartInfo =
    {
        X       : 0,
        Y       : 0,
        H       : 0,
        PageNum : 0,
        ParaId  : null
    };

    this.m_oEndInfo =
    {
        X       : 0,
        Y       : 0,
        H       : 0,
        PageNum : 0,
        ParaId  : null
    };

    this.Lock = new AscCommon.CLock(); // Зажат ли комментарий другим пользователем
    if ( false === AscCommon.g_oIdCounter.m_bLoad )
    {
        this.Lock.Set_Type( AscCommon.locktype_Mine, false );
        AscCommon.CollaborativeEditing.Add_Unlock2( this );
    }

    // Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
    g_oTableId.Add( this, this.Id );
}

CComment.prototype =
{
    getObjectType: function()
    {
        return AscDFH.historyitem_type_Comment;
    },

    createDuplicate: function(Parent, bNewGuid){
        var oData = this.Data ? this.Data.createDuplicate(bNewGuid) : null;
        var ret = new CComment(Parent, oData);
        ret.setPosition(this.x, this.y);
        return ret;
    },

    hit: function(x, y)
    {
        var Flags = 0;
        if(this.selected)
        {
            Flags |= 1;
        }
        if(this.Data.m_aReplies.length > 0)
        {
            Flags |= 2;
        }
        var dd = editor.WordControl.m_oDrawingDocument;
        return x > this.x && x < this.x + dd.GetCommentWidth(Flags)
            && y > this.y && y < this.y + dd.GetCommentHeight(Flags);
    },

    setPosition: function(x, y)
    {
        History.Add(new AscDFH.CChangesDrawingsObjectNoId(this, AscDFH.historyitem_Comment_Position, new AscFormat.CDrawingBaseCoordsWritable(this.x, this.y), new AscFormat.CDrawingBaseCoordsWritable(x, y)));
        this.x = x;
        this.y = y;
    },

    draw: function(graphics)
    {
        var Flags = 0;
        if(this.selected)
        {
            Flags |= 1;
        }
        if(this.Data.m_aReplies.length > 0)
        {
            Flags |= 2;
        }
        var dd = editor.WordControl.m_oDrawingDocument;
        var w = dd.GetCommentWidth();
        var h = dd.GetCommentHeight();
        graphics.DrawPresentationComment(Flags, this.x, this.y, w, h);

        var oLock = this.Lock;
        if(oLock && AscCommon.locktype_None !== oLock.Get_Type())
        {
            var bCoMarksDraw = true;
            var oApi = editor || Asc['editor'];
            if(oApi){
                bCoMarksDraw = (!AscCommon.CollaborativeEditing.Is_Fast() || AscCommon.locktype_Mine !== oLock.Get_Type());
            }
            if(bCoMarksDraw){
                graphics.DrawLockObjectRect(oLock.Get_Type(), this.x, this.y, w, h);
                return true;
            }
        }
    },

    Set_StartInfo: function(PageNum, X, Y, H, ParaId)
    {
        this.m_oStartInfo.X       = X;
        this.m_oStartInfo.Y       = Y;
        this.m_oStartInfo.H       = H;
        this.m_oStartInfo.ParaId  = ParaId;

        // Если у нас комментарий в колонтитуле, то номер страницы обновляется при нажатии на комментарий
        if ( comment_type_Common === this.m_oTypeInfo.Type )
            this.m_oStartInfo.PageNum = PageNum;
    },

    Set_EndInfo: function(PageNum, X, Y, H, ParaId)
    {
        this.m_oEndInfo.X       = X;
        this.m_oEndInfo.Y       = Y;
        this.m_oEndInfo.H       = H;
        this.m_oEndInfo.ParaId  = ParaId;

        if ( comment_type_Common === this.m_oTypeInfo.Type )
            this.m_oEndInfo.PageNum = PageNum;
    },

    Check_ByXY: function(PageNum, X, Y, Type)
    {
        if ( this.m_oTypeInfo.Type != Type )
            return false;

        if ( comment_type_Common === Type )
        {
            if ( PageNum < this.m_oStartInfo.PageNum || PageNum > this.m_oEndInfo.PageNum )
                return false;

            if ( PageNum === this.m_oStartInfo.PageNum && ( Y < this.m_oStartInfo.Y || ( Y < (this.m_oStartInfo.Y + this.m_oStartInfo.H) && X < this.m_oStartInfo.X ) ) )
                return false;

            if ( PageNum === this.m_oEndInfo.PageNum && ( Y > this.m_oEndInfo.Y + this.m_oEndInfo.H || ( Y > this.m_oEndInfo.Y && X > this.m_oEndInfo.X ) ) )
                return false;
        }
        else if ( comment_type_HdrFtr === Type )
        {
            var HdrFtr = this.m_oTypeInfo.Data;

            if ( null === HdrFtr || false === HdrFtr.Check_Page(PageNum) )
                return false;

            if ( Y < this.m_oStartInfo.Y || ( Y < (this.m_oStartInfo.Y + this.m_oStartInfo.H) && X < this.m_oStartInfo.X ) )
                return false;

            if ( Y > this.m_oEndInfo.Y + this.m_oEndInfo.H || ( Y > this.m_oEndInfo.Y && X > this.m_oEndInfo.X ) )
                return false;

            this.m_oStartInfo.PageNum = PageNum;
            this.m_oEndInfo.PageNum   = PageNum;
        }

        return true;
    },

    Set_Data: function(Data)
    {
        History.Add(new AscDFH.CChangesDrawingsObjectNoId(this, AscDFH.historyitem_Comment_Change, this.Data, Data));
        this.Data = Data;
    },

    Remove_Marks: function()
    {
        var Para_start = g_oTableId.Get_ById(this.m_oStartInfo.ParaId);
        var Para_end   = g_oTableId.Get_ById(this.m_oEndInfo.ParaId);

        if ( Para_start === Para_end )
        {
            if ( null != Para_start )
                Para_start.RemoveCommentMarks( this.Id );
        }
        else
        {
            if ( null != Para_start )
                Para_start.RemoveCommentMarks( this.Id );

            if ( null != Para_end )
                Para_end.RemoveCommentMarks( this.Id );
        }
    },

    Set_TypeInfo: function(Type, Data)
    {
        var New =
        {
            Type : Type,
            Data : Data
        };

        History.Add(new AscDFH.CChangesDrawingsLong(this, AscDFH.historyitem_Comment_TypeInfo, this.m_oTypeInfo, New) );

        this.m_oTypeInfo = New;
    },

    Get_TypeInfo: function()
    {
        return this.m_oTypeInfo;
    },


    Refresh_RecalcData: function(Data)
    {
        if(this.slideComments)
        {
            this.slideComments.Refresh_RecalcData();
        }
    },

    recalculate: function()
    {},
    //-----------------------------------------------------------------------------------
    // Функции для работы с совместным редактированием
    //-----------------------------------------------------------------------------------
    Get_Id: function()
    {
        return this.Id;
    },

    Write_ToBinary2: function(Writer)
    {
        Writer.WriteLong( AscDFH.historyitem_type_Comment );

        // String   : Id
        // Variable : Data
        // Long     : m_oTypeInfo.Type
        //          : m_oTypeInfo.Data
        //    Если comment_type_HdrFtr
        //    String : Id колонтитула

        Writer.WriteString2( this.Id );
        AscFormat.writeObject(Writer, this.Parent);
        this.Data.Write_ToBinary2(Writer);
        Writer.WriteLong( this.m_oTypeInfo.Type );

        if ( comment_type_HdrFtr === this.m_oTypeInfo.Type )
            Writer.WriteString2( this.m_oTypeInfo.Data.Get_Id() );
    },

    Read_FromBinary2: function(Reader)
    {
        // String   : Id
        // Variable : Data
        // Long     : m_oTypeInfo.Type
        //          : m_oTypeInfo.Data
        //    Если comment_type_HdrFtr
        //    String : Id колонтитула

        this.Id = Reader.GetString2();
        this.Parent = AscFormat.readObject(Reader);
        this.Data = new CCommentData();
        this.Data.Read_FromBinary2(Reader);
        this.m_oTypeInfo.Type = Reader.GetLong();
        if ( comment_type_HdrFtr === this.m_oTypeInfo.Type )
            this.m_oTypeInfo.Data = g_oTableId.Get_ById( Reader.GetString2() );
    },

    Check_MergeData: function()
    {
        // Проверяем, не удалили ли мы параграф, к которому был сделан данный комментарий
        // Делаем это в самом конце, а не сразу, чтобы заполнились данные о начальном и
        // конечном параграфах.

        var bUse = true;

        if ( null != this.m_oStartInfo.ParaId )
        {
            var Para_start = g_oTableId.Get_ById( this.m_oStartInfo.ParaId );

            if ( true != Para_start.Is_UseInDocument() )
                bUse = false;
        }

        if ( true === bUse && null != this.m_oEndInfo.ParaId )
        {
            var Para_end = g_oTableId.Get_ById( this.m_oEndInfo.ParaId );

            if ( true != Para_end.Is_UseInDocument() )
                bUse = false;
        }

        if ( false === bUse )
            editor.WordControl.m_oLogicDocument.RemoveComment( this.Id, true );
    }
};

//--------------------------------------------------------export----------------------------------------------------
window['AscCommon'] = window['AscCommon'] || {};

window['AscCommon'].comments_NoComment = comments_NoComment;
window['AscCommon'].comments_NonActiveComment = comments_NonActiveComment;
window['AscCommon'].comments_ActiveComment = comments_ActiveComment;

window['AscCommon'].comment_type_Common = comment_type_Common;
window['AscCommon'].comment_type_HdrFtr = comment_type_HdrFtr;

window['AscCommon'].CCommentData = CCommentData;
window['AscCommon'].CComment = CComment;
window['AscCommon'].ParaComment = ParaComment;
window['AscCommon'].CCommentAuthor = CCommentAuthor;
window['AscCommon'].CWriteCommentData = CWriteCommentData;

})(window);
