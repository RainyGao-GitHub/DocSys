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

function CCommentData()
{
    this.m_sText      = "";
    this.m_sTime      = "";
	this.m_sOOTime      = "";
    this.m_sUserId    = "";
	this.m_sProviderId= "";
    this.m_sUserName  = "";
	this.m_sInitials  = "";
    this.m_sQuoteText = null;
    this.m_bSolved    = false;
	this.m_nDurableId = null;
    this.m_aReplies   = [];
    
    this.Copy = function()
    {
        var NewData = new CCommentData();
        
        NewData.m_sText      = this.m_sText;
        NewData.m_sTime      = this.m_sTime;
		NewData.m_sOOTime    = this.m_sOOTime;
        NewData.m_sUserId    = this.m_sUserId;
		NewData.m_sProviderId= this.m_sProviderId;
        NewData.m_sUserName  = this.m_sUserName;
		NewData.m_sInitials  = this.m_sInitials;
        NewData.m_sQuoteText = this.m_sQuoteText;
        NewData.m_bSolved    = this.m_bSolved;
		NewData.m_nDurableId = this.m_nDurableId;
        
        var Count = this.m_aReplies.length;
        for (var Pos = 0; Pos < Count; Pos++)
        {
            NewData.m_aReplies.push(this.m_aReplies[Pos].Copy());
        }

        return NewData;
    };

    this.Add_Reply = function(CommentData)
    {
        this.m_aReplies.push( CommentData );
    };

    this.Set_Text = function(Text)
    {
        this.m_sText = Text;
    };

    this.Get_Text = function()
    {
        return this.m_sText;
    };

    this.Get_QuoteText = function()
    {
        return this.m_sQuoteText;
    };

    this.Set_QuoteText = function(Quote)
    {
        this.m_sQuoteText = Quote;
    };

    this.Get_Solved = function()
    {
        return this.m_bSolved;
    };

    this.Set_Solved = function(Solved)
    {
        this.m_bSolved = Solved;
    };

    this.Set_Name = function(Name)
    {
        this.m_sUserName = Name;
    };

    this.Get_Name = function()
    {
        return this.m_sUserName;
    };

    this.Get_RepliesCount = function()
    {
        return this.m_aReplies.length;
    };

    this.Get_Reply = function(Index)
    {
        if ( Index < 0 || Index >= this.m_aReplies.length )
            return null;

        return this.m_aReplies[Index];
    };

    this.Read_FromAscCommentData = function(AscCommentData)
    {
        this.m_sText      = AscCommentData.asc_getText();
        this.m_sTime      = AscCommentData.asc_getTime();
		this.m_sOOTime    = AscCommentData.asc_getOnlyOfficeTime();
        this.m_sUserId    = AscCommentData.asc_getUserId();
		this.m_sProviderId= AscCommentData.asc_getProviderId();
        this.m_sQuoteText = AscCommentData.asc_getQuoteText();
        this.m_bSolved    = AscCommentData.asc_getSolved();
        this.m_sUserName  = AscCommentData.asc_getUserName();
		this.m_sInitials  = AscCommentData.asc_getInitials();
		this.m_nDurableId = AscCommentData.asc_getDurableId();

        var RepliesCount  = AscCommentData.asc_getRepliesCount();
        for ( var Index = 0; Index < RepliesCount; Index++ )
        {
            var Reply = new CCommentData();
            Reply.Read_FromAscCommentData( AscCommentData.asc_getReply(Index) );
            this.m_aReplies.push( Reply );
        }
    };

    this.Write_ToBinary2 = function(Writer)
    {
        // String            : m_sText
        // String            : m_sTime
		// String            : m_sOOTime
        // String            : m_sUserId
		// String            : m_sProviderId
        // String            : m_sUserName
		// String            : m_sInitials
		// Bool              : Null ли DurableId
		// ULong             : m_nDurableId
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
		Writer.WriteString2( this.m_sProviderId );
        Writer.WriteString2( this.m_sUserName );
		Writer.WriteString2( this.m_sInitials );

		if ( null === this.m_nDurableId )
			Writer.WriteBool( true );
		else
		{
			Writer.WriteBool( false );
			Writer.WriteULong( this.m_nDurableId );
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
    };

    this.Read_FromBinary2 = function(Reader)
    {
        // String            : m_sText
        // String            : m_sTime
		// String            : m_sOOTime
        // String            : m_sUserId
        // Bool              : Null ли QuoteText
        // String            : (Если предыдущий параметр false) QuoteText
        // Bool              : Solved
        // Long              : Количество отетов
        // Array of Variable : Ответы

        this.m_sText     = Reader.GetString2();
        this.m_sTime     = Reader.GetString2();
		this.m_sOOTime   = Reader.GetString2();
        this.m_sUserId   = Reader.GetString2();
		this.m_sProviderId = Reader.GetString2();
        this.m_sUserName = Reader.GetString2();
		this.m_sInitials = Reader.GetString2();

		if ( true != Reader.GetBool() )
			this.m_nDurableId = Reader.GetULong();
		else
			this.m_nDurableId = null;
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
    };
}
CCommentData.prototype.GetUserName = function()
{
	return this.m_sUserName;
};
CCommentData.prototype.SetUserName = function(sUserName)
{
	this.m_sUserName = sUserName;
};
CCommentData.prototype.GetDateTime = function()
{
	var nTime = parseInt(this.m_sTime);
	if (isNaN(nTime))
		nTime = 0;

	return nTime;
};
CCommentData.prototype.GetRepliesCount = function()
{
	return this.Get_RepliesCount();
};
CCommentData.prototype.GetReply = function(nIndex)
{
	return this.Get_Reply(nIndex);
};
CCommentData.prototype.GetText = function()
{
	return this.Get_Text();
};
CCommentData.prototype.SetText = function(sText)
{
	this.m_sText = sText;
};
CCommentData.prototype.GetQuoteText = function()
{
	return this.Get_QuoteText();
};
CCommentData.prototype.IsSolved = function()
{
	return this.m_bSolved;
};
CCommentData.prototype.CreateNewCommentsGuid = function()
{
	this.m_nDurableId = AscCommon.CreateUInt32();
	for (var Pos = 0; Pos < this.m_aReplies.length; Pos++)
	{
		this.m_aReplies[Pos].CreateNewCommentsGuid();
	}
};

function CCommentDrawingRect(X, Y, W, H, CommentId, InvertTransform)
{
    this.X = X;
    this.Y = Y;
    this.H = H;
    this.W = W;
    this.CommentId = CommentId;
    this.InvertTransform = InvertTransform;
}

var comment_type_Common = 1; // Комментарий к обычному тексу
var comment_type_HdrFtr = 2; // Комментарий к колонтитулу

function CComment(Parent, Data)
{
    this.Id     = AscCommon.g_oIdCounter.Get_NewId();

    this.Parent = Parent;
    this.Data   = Data;

    this.m_oTypeInfo =
    {
        Type : comment_type_Common,
        Data : null
    };
    
    this.StartId = null; // Id объекта, в содержимом которого идет начало комментария
    this.EndId   = null; // Id объекта, в содержимом которого идет конец комментария

    this.m_oStartInfo =
    {
        X       : 0,
        Y       : 0,
        H       : 0,
        PageNum : 0
    };

    this.Lock = new AscCommon.CLock(); // Зажат ли комментарий другим пользователем
    if ( false === AscCommon.g_oIdCounter.m_bLoad )
    {
        this.Lock.Set_Type( AscCommon.locktype_Mine, false );
        AscCommon.CollaborativeEditing.Add_Unlock2( this );
    }
    
    this.Copy = function()
    {
        return new CComment(this.Parent, this.Data.Copy());
    };
    
    this.Set_StartId = function(ObjId)
    {
        this.StartId = ObjId;        
    };
    
    this.Set_EndId = function(ObjId)
    {
        this.EndId = ObjId;
    };
    
    this.Set_StartInfo = function(PageNum, X, Y, H)
    {
        this.m_oStartInfo.X       = X;
        this.m_oStartInfo.Y       = Y;
        this.m_oStartInfo.H       = H;
        this.m_oStartInfo.PageNum = PageNum;        
    };

	this.Set_Data = function(Data)
	{
		History.Add(new CChangesCommentChange(this, this.Data, Data));
		this.Data = Data;
	};

    this.Remove_Marks = function()
    {
        var ObjStart = g_oTableId.Get_ById(this.StartId);
        var ObjEnd   = g_oTableId.Get_ById(this.EndId);

        if ( ObjStart === ObjEnd )
        {
            if ( null != ObjStart )
                ObjStart.RemoveCommentMarks( this.Id );
        }
        else
        {
            if ( null != ObjStart )
                ObjStart.RemoveCommentMarks( this.Id );

            if ( null != ObjEnd )
                ObjEnd.RemoveCommentMarks( this.Id );
        }
    };

    this.Set_TypeInfo = function(Type, Data)
    {
        var New =
        {
            Type : Type,
            Data : Data
        };

        History.Add(new CChangesCommentTypeInfo(this, this.m_oTypeInfo, New));

        this.m_oTypeInfo = New;

        if ( comment_type_HdrFtr === Type )
        {
            // Проставим начальные значения страниц (это текущий номер страницы, на котором произошло добавление комментария)
            var PageNum = Data.Content.Get_StartPage_Absolute();
            this.m_oStartInfo.PageNum = PageNum;
        }
    };

    this.Get_TypeInfo = function()
    {
        return this.m_oTypeInfo;
    };
//-----------------------------------------------------------------------------------
// Undo/Redo функции
//-----------------------------------------------------------------------------------
    this.Refresh_RecalcData = function(Data)
    {
        // Ничего не делаем (если что просто будет перерисовка)
    };
//-----------------------------------------------------------------------------------
// Функции для работы с совместным редактированием
//-----------------------------------------------------------------------------------
    this.Get_Id = function()
    {
        return this.Id;
    };

    this.Write_ToBinary2 = function(Writer)
    {
        Writer.WriteLong( AscDFH.historyitem_type_Comment );

        // String   : Id
        // Variable : Data
        // Long     : m_oTypeInfo.Type
        //          : m_oTypeInfo.Data
        //    Если comment_type_HdrFtr
        //    String : Id колонтитула

        Writer.WriteString2( this.Id );
        this.Data.Write_ToBinary2(Writer);
        Writer.WriteLong( this.m_oTypeInfo.Type );

        if ( comment_type_HdrFtr === this.m_oTypeInfo.Type )
            Writer.WriteString2( this.m_oTypeInfo.Data.Get_Id() );
    };

    this.Read_FromBinary2 = function(Reader)
    {
        // String   : Id
        // Variable : Data
        // Long     : m_oTypeInfo.Type
        //          : m_oTypeInfo.Data
        //    Если comment_type_HdrFtr
        //    String : Id колонтитула

        this.Id = Reader.GetString2();
        this.Data = new CCommentData();
        this.Data.Read_FromBinary2(Reader);
        this.m_oTypeInfo.Type = Reader.GetLong();
        if ( comment_type_HdrFtr === this.m_oTypeInfo.Type )
            this.m_oTypeInfo.Data = g_oTableId.Get_ById( Reader.GetString2() );
    };

    this.Check_MergeData = function(arrAllParagraphs)
    {
        // Проверяем, не удалили ли мы параграф, к которому был сделан данный комментарий
        // Делаем это в самом конце, а не сразу, чтобы заполнились данные о начальном и
        // конечном параграфах.

		this.Set_StartId(null);
		this.Set_EndId(null);

		var bStartSet = false, bEndSet = false;
        for (var nIndex = 0, nCount = arrAllParagraphs.length; nIndex < nCount; ++nIndex)
		{
			var oPara   = arrAllParagraphs[nIndex];
			var oResult = oPara.CheckCommentStartEnd(this.Id);
			if (true === oResult.Start)
			{
				this.Set_StartId(oPara.Get_Id());
				bStartSet = true;
			}

			if (true === oResult.End)
			{
				this.Set_EndId(oPara.Get_Id());
				bEndSet = true;
			}

			if (bStartSet && bEndSet)
				break;
		}

		var bUse = true;
		if (null != this.StartId)
		{
			var ObjStart = g_oTableId.Get_ById(this.StartId);

			if (true != ObjStart.Is_UseInDocument())
				bUse = false;
		}

		if (true === bUse && null != this.EndId)
		{
			var ObjEnd = g_oTableId.Get_ById(this.EndId);

			if (true != ObjEnd.Is_UseInDocument())
				bUse = false;
		}

        if ( false === bUse )
            editor.WordControl.m_oLogicDocument.RemoveComment( this.Id, true, false );
    };

    // Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
    g_oTableId.Add( this, this.Id );
}
CComment.prototype.GetId = function()
{
	return this.Id;
};
CComment.prototype.GetData = function()
{
	return this.Data;
};
CComment.prototype.IsSolved = function()
{
	if (this.Data)
		return this.Data.IsSolved();

	return false;
};
CComment.prototype.IsGlobalComment = function()
{
	return (!this.Data || null === this.Data.GetQuoteText());
};
CComment.prototype.GetDurableId = function()
{
	if (this.Data)
		return this.Data.m_nDurableId;

	return -1;
};
CComment.prototype.CreateNewCommentsGuid = function() {
	this.Data && this.Data.CreateNewCommentsGuid();
};
/**
 * Является ли текущий пользователем автором комментария
 * @returns {boolean}
 */
CComment.prototype.IsCurrentUser = function()
{
	var oEditor = editor;
	if (oEditor && oEditor.DocInfo && this.Data)
	{
		var sUserId = oEditor.DocInfo.get_UserId();
		return (sUserId === this.Data.m_sUserId);
	}

	return true;
};

var comments_NoComment        = 0;
var comments_NonActiveComment = 1;
var comments_ActiveComment    = 2;

function CComments()
{
    this.Id     = AscCommon.g_oIdCounter.Get_NewId();

    this.m_bUse       = false; // Используются ли комментарии
	this.m_bUseSolved = false; // Использовать ли разрешенные комментарии

    this.m_aComments    = {};    // ассоциативный  массив
    this.m_sCurrent     = null;  // текущий комментарий
    
    this.Pages = [];

    this.Get_Id = function()
    {
        return this.Id;
    };

    this.Set_Use = function(Use)
    {
        this.m_bUse = Use;
    };

    this.Is_Use = function()
    {
        return this.m_bUse;
    };

	this.Add = function(Comment)
	{
		var Id = Comment.Get_Id();

		History.Add(new CChangesCommentsAdd(this, Id, Comment));
		this.m_aComments[Id] = Comment;
	};

    this.Get_ById = function(Id)
    {
        if ( "undefined" != typeof(this.m_aComments[Id]) )
            return this.m_aComments[Id];

        return null;
    };

    this.Remove_ById = function(Id)
    {
        if ( "undefined" != typeof(this.m_aComments[Id]) )
        {
            History.Add(new CChangesCommentsRemove(this, Id, this.m_aComments[Id]));

            // Сначала удаляем комментарий из списка комментариев, чтобы данная функция не зацикливалась на вызове Remove_Marks
            var Comment = this.m_aComments[Id];
            delete this.m_aComments[Id];
            Comment.Remove_Marks();
            return true;
        }

        return false;
    };

    this.Reset_Drawing = function(PageNum)
    {
        this.Pages[PageNum] = [];
    };

    this.Add_DrawingRect = function(X, Y, W, H, PageNum, arrCommentId, InvertTransform)
    {
        this.Pages[PageNum].push( new CCommentDrawingRect(X, Y, W, H, arrCommentId, InvertTransform) );
    };

    this.Set_Current = function(Id)
    {
        this.m_sCurrent = Id;
    };

    this.Get_ByXY = function(PageNum, X, Y)
	{
		var Page = this.Pages[PageNum], _X, _Y;
		if (undefined !== Page)
		{
			var Count = Page.length;
			for (var Pos = 0; Pos < Count; Pos++)
			{
				var DrawingRect = Page[Pos];
				if (!DrawingRect.InvertTransform)
				{
					_X = X;
					_Y = Y;
				}
				else
				{
					_X = DrawingRect.InvertTransform.TransformPointX(X, Y);
					_Y = DrawingRect.InvertTransform.TransformPointY(X, Y);
				}
				if (_X >= DrawingRect.X && _X <= DrawingRect.X + DrawingRect.W && _Y >= DrawingRect.Y && _Y <= DrawingRect.Y + DrawingRect.H)
				{
					var arrComments = [];
					for (var nCommentIndex = 0, nCommentsCount = DrawingRect.CommentId.length; nCommentIndex < nCommentsCount; ++nCommentIndex)
					{
						var oComment = this.Get_ById(DrawingRect.CommentId[nCommentIndex]);
						if (oComment)
							arrComments.push(oComment);
					}

					return arrComments;
				}
			}
		}

		return [];
	};

    this.Get_Current = function()
    {
        if ( null != this.m_sCurrent )
        {
            var Comment = this.Get_ById( this.m_sCurrent );
            if ( null != Comment )
                return Comment;
        }

        return null;
    };

    this.Get_CurrentId = function()
    {
        return this.m_sCurrent;
    };

    this.Set_CommentData = function(Id, CommentData)
    {
        var Comment = this.Get_ById( Id );
        if ( null != Comment )
            Comment.Set_Data( CommentData );
    };

    this.Check_MergeData = function()
    {
    	var arrAllParagraphs = null;

        for (var Id in this.m_aComments)
        {
        	if (!arrAllParagraphs && editor && editor.WordControl.m_oLogicDocument)
        		arrAllParagraphs = editor.WordControl.m_oLogicDocument.GetAllParagraphs({All : true});

            this.m_aComments[Id].Check_MergeData(arrAllParagraphs);
        }
    };

//-----------------------------------------------------------------------------------
// Undo/Redo функции
//-----------------------------------------------------------------------------------
    this.Refresh_RecalcData = function(Data)
    {
        // Ничего не делаем, т.к. изменение комментариев не влияет на пересчет
    };

    // Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
    g_oTableId.Add( this, this.Id );
}
CComments.prototype.GetAllComments = function()
{
	return this.m_aComments;
};
CComments.prototype.SetUseSolved = function(isUse)
{
	this.m_bUseSolved = isUse;
};
CComments.prototype.IsUseSolved = function()
{
	return this.m_bUseSolved;
};
CComments.prototype.GetCommentIdByGuid = function(sGuid)
{
	var nDurableId = parseInt(sGuid, 16);
	for (var sId in this.m_aComments)
	{
		if (this.m_aComments[sId].GetDurableId() === nDurableId)
			return sId;
	}

	return "";
};
CComments.prototype.Document_Is_SelectionLocked = function(Id)
{
	if (Id instanceof Array)
	{
		for (var nIndex = 0, nCount = Id.length; nIndex < nCount; ++nIndex)
		{
			var sId = Id[nIndex];
			var oComment = this.Get_ById(sId);
			if (oComment)
				oComment.Lock.Check(oComment.GetId());
		}
	}
	else
	{
		var oComment = this.Get_ById(Id);
		if (oComment)
			oComment.Lock.Check(oComment.GetId());
	}
};
CComments.prototype.GetById = function(sId)
{
	if (this.m_aComments[sId])
		return this.m_aComments[sId];

	return null;
};

/**
 * Класс для элемента начала/конца комментария в параграфе
 * @constructor
 * @extends {CParagraphContentBase}
 */
function ParaComment(Start, Id)
{
	CParagraphContentBase.call(this);
    this.Id = AscCommon.g_oIdCounter.Get_NewId();

    this.Paragraph = null;

    this.Start     = Start;
    this.CommentId = Id;

    this.Type  = para_Comment;

    this.StartLine  = 0;
    this.StartRange = 0;

    this.Lines = [];
    this.LinesLength = 0;

    // Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
    g_oTableId.Add( this, this.Id );
}

ParaComment.prototype = Object.create(CParagraphContentBase.prototype);
ParaComment.prototype.constructor = ParaComment;

ParaComment.prototype.Get_Id = function()
{
	return this.Id;
};
ParaComment.prototype.GetId = function()
{
	return this.Get_Id();
};
ParaComment.prototype.Copy = function(Selected)
{
	return new ParaComment(this.Start, this.CommentId);
};
ParaComment.prototype.Recalculate_Range_Spaces = function(PRSA, CurLine, CurRange, CurPage)
{
	var Para             = PRSA.Paragraph;
	var DocumentComments = Para.LogicDocument.Comments;
	var Comment          = DocumentComments.Get_ById(this.CommentId);
	if (null === Comment)
		return;

	var X    = PRSA.X;
	var Y    = Para.Pages[CurPage].Y + Para.Lines[CurLine].Y - Para.Lines[CurLine].Metrics.Ascent;
	var H    = Para.Lines[CurLine].Metrics.Ascent + Para.Lines[CurLine].Metrics.Descent;
	var Page = Para.GetAbsolutePage(CurPage);

	if (comment_type_HdrFtr === Comment.m_oTypeInfo.Type)
	{
		var HdrFtr = Comment.m_oTypeInfo.Data;

		if (-1 !== HdrFtr.RecalcInfo.CurPage)
			Page = HdrFtr.RecalcInfo.CurPage;
	}

	if (Para && Para === AscCommon.g_oTableId.Get_ById(Para.Get_Id()))
	{
		// Заглушка для повторяющегося заголовка в таблицах
		if (true === this.Start)
		{
			Comment.Set_StartId(Para.Get_Id());
			Comment.Set_StartInfo(Page, X, Y, H);
		}
		else
		{
			Comment.Set_EndId(Para.Get_Id());
		}
	}
};
ParaComment.prototype.Recalculate_PageEndInfo = function(PRSI, _CurLine, _CurRange)
{
	if (true === this.Start)
		PRSI.AddComment(this.CommentId);
	else
		PRSI.RemoveComment(this.CommentId);
};
ParaComment.prototype.SaveRecalculateObject = function(Copy)
{
	var RecalcObj = new CRunRecalculateObject(this.StartLine, this.StartRange);
	return RecalcObj;
};
ParaComment.prototype.LoadRecalculateObject = function(RecalcObj, Parent)
{
	this.StartLine  = RecalcObj.StartLine;
	this.StartRange = RecalcObj.StartRange;

	var PageNum = Parent.Get_StartPage_Absolute();

	var DocumentComments = editor.WordControl.m_oLogicDocument.Comments;
	var Comment          = DocumentComments.Get_ById(this.CommentId);

	Comment.m_oStartInfo.PageNum = PageNum;
};
ParaComment.prototype.PrepareRecalculateObject = function()
{
};
ParaComment.prototype.Shift_Range = function(Dx, Dy, _CurLine, _CurRange)
{
	var DocumentComments = editor.WordControl.m_oLogicDocument.Comments;
	var Comment          = DocumentComments.Get_ById(this.CommentId);
	if (null === Comment)
		return;

	if (true === this.Start)
	{
		Comment.m_oStartInfo.X += Dx;
		Comment.m_oStartInfo.Y += Dy;
	}
};
ParaComment.prototype.Draw_HighLights = function(PDSH)
{
	if (true === this.Start)
		PDSH.AddComment(this.CommentId);
	else
		PDSH.RemoveComment(this.CommentId);
};
ParaComment.prototype.Refresh_RecalcData = function()
{
};
ParaComment.prototype.Write_ToBinary2 = function(Writer)
{
	Writer.WriteLong(AscDFH.historyitem_type_CommentMark);

	// String   : Id
	// String   : Id комментария
	// Bool     : Start

	Writer.WriteString2("" + this.Id);
	Writer.WriteString2("" + this.CommentId);
	Writer.WriteBool(this.Start);
};
ParaComment.prototype.Read_FromBinary2 = function(Reader)
{
	this.Id        = Reader.GetString2();
	this.CommentId = Reader.GetString2();
	this.Start     = Reader.GetBool();
};
ParaComment.prototype.SetCommentId = function(sCommentId)
{
	if (this.CommentId !== sCommentId)
	{
		History.Add(new CChangesParaCommentCommentId(this, this.CommentId, sCommentId));
		this.CommentId = sCommentId;
	}
};
ParaComment.prototype.GetCommentId = function()
{
	return this.CommentId;
};
ParaComment.prototype.IsCommentStart = function()
{
	return this.Start;
};
ParaComment.prototype.CheckRunContent = function(fCheck)
{
    return fCheck(this);
};
//--------------------------------------------------------export----------------------------------------------------
window['AscCommon'] = window['AscCommon'] || {};

window['AscCommon'].comments_NoComment = comments_NoComment;
window['AscCommon'].comments_NonActiveComment = comments_NonActiveComment;
window['AscCommon'].comments_ActiveComment = comments_ActiveComment;

window['AscCommon'].comment_type_Common = comment_type_Common;
window['AscCommon'].comment_type_HdrFtr = comment_type_HdrFtr;

window['AscCommon'].CCommentData = CCommentData;
window['AscCommon'].CComments    = CComments;
window['AscCommon'].CComment     = CComment;
window['AscCommon'].ParaComment  = ParaComment;

})(window);
