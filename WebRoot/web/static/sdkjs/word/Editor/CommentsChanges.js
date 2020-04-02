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
 * User: Ilja.Kirillov
 * Date: 08.11.2016
 * Time: 15:59
 */

AscDFH.changesFactory[AscDFH.historyitem_Comment_Change]   = CChangesCommentChange;
AscDFH.changesFactory[AscDFH.historyitem_Comment_TypeInfo] = CChangesCommentTypeInfo;

AscDFH.changesFactory[AscDFH.historyitem_Comments_Add]    = CChangesCommentsAdd;
AscDFH.changesFactory[AscDFH.historyitem_Comments_Remove] = CChangesCommentsRemove;

AscDFH.changesFactory[AscDFH.historyitem_ParaComment_CommentId] = CChangesParaCommentCommentId;

//----------------------------------------------------------------------------------------------------------------------
// Карта зависимости изменений
//----------------------------------------------------------------------------------------------------------------------
AscDFH.changesRelationMap[AscDFH.historyitem_Comment_Change]        = [AscDFH.historyitem_Comment_Change];
AscDFH.changesRelationMap[AscDFH.historyitem_Comment_TypeInfo]      = [AscDFH.historyitem_Comment_TypeInfo];
AscDFH.changesRelationMap[AscDFH.historyitem_Comments_Add]          = [
	AscDFH.historyitem_Comments_Add,
	AscDFH.historyitem_Comments_Remove
];
AscDFH.changesRelationMap[AscDFH.historyitem_Comments_Remove]       = [
	AscDFH.historyitem_Comments_Add,
	AscDFH.historyitem_Comments_Remove
];
AscDFH.changesRelationMap[AscDFH.historyitem_ParaComment_CommentId] = [AscDFH.historyitem_ParaComment_CommentId];
//----------------------------------------------------------------------------------------------------------------------

/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesCommentChange(Class, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
}
CChangesCommentChange.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesCommentChange.prototype.constructor = CChangesCommentChange;
CChangesCommentChange.prototype.Type = AscDFH.historyitem_Comment_Change;
CChangesCommentChange.prototype.WriteToBinary = function(Writer)
{
	// Variable : New data
	// Variable : Old data

	this.New.Write_ToBinary2(Writer);
	this.Old.Write_ToBinary2(Writer);
};
CChangesCommentChange.prototype.ReadFromBinary = function(Reader)
{
	// Variable : New data
	// Variable : Old data

	this.New = new AscCommon.CCommentData();
	this.Old = new AscCommon.CCommentData();
	this.New.Read_FromBinary2(Reader);
	this.Old.Read_FromBinary2(Reader);
};
CChangesCommentChange.prototype.private_SetValue = function(Value)
{
	this.Class.Data = Value;
	editor.sync_ChangeCommentData(this.Class.Id, Value);
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesCommentTypeInfo(Class, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
}
CChangesCommentTypeInfo.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesCommentTypeInfo.prototype.constructor = CChangesCommentTypeInfo;
CChangesCommentTypeInfo.prototype.Type = AscDFH.historyitem_Comment_TypeInfo;
CChangesCommentTypeInfo.prototype.WriteToBinary = function(Writer)
{
	// Variable : New data
	// Variable : Old data

	Writer.WriteLong(this.New.Type);
	if (AscCommon.comment_type_HdrFtr === this.New.Type)
		Writer.WriteString2(this.New.Data.Get_Id());

	Writer.WriteLong(this.Old.Type);
	if (AscCommon.comment_type_HdrFtr === this.Old.Type)
		Writer.WriteString2(this.Old.Data.Get_Id());
};
CChangesCommentTypeInfo.prototype.ReadFromBinary = function(Reader)
{
	// Variable : New data
	// Variable : Old data

	this.New = {
		Type : 0,
		Data : null
	};

	this.Old = {
		Type : 0,
		Data : null
	};

	this.New.Type = Reader.GetLong();
	if (AscCommon.comment_type_HdrFtr === this.New.Type)
		this.New.Data = AscCommon.g_oTableId.Get_ById(Reader.GetString2());

	this.Old.Type = Reader.GetLong();
	if (AscCommon.comment_type_HdrFtr === this.Old.Type)
		this.Old.Data = AscCommon.g_oTableId.Get_ById(Reader.GetString2());
};
CChangesCommentTypeInfo.prototype.private_SetValue = function(Value)
{
	this.Class.m_oTypeInfo = Value;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBase}
 */
function CChangesCommentsAdd(Class, Id, Comment)
{
	AscDFH.CChangesBase.call(this, Class);

	this.Id      = Id;
	this.Comment = Comment;
}
CChangesCommentsAdd.prototype = Object.create(AscDFH.CChangesBase.prototype);
CChangesCommentsAdd.prototype.constructor = CChangesCommentsAdd;
CChangesCommentsAdd.prototype.Type = AscDFH.historyitem_Comments_Add;
CChangesCommentsAdd.prototype.Undo = function()
{
	var oComments = this.Class;
	delete oComments.m_aComments[this.Id];
	editor.sync_RemoveComment(this.Id);
};
CChangesCommentsAdd.prototype.Redo = function()
{
	this.Class.m_aComments[this.Id] = this.Comment;
	editor.sync_AddComment(this.Id, this.Comment.Data);
};
CChangesCommentsAdd.prototype.WriteToBinary = function(Writer)
{
	// String : Id комментария
	Writer.WriteString2(this.Id);
};
CChangesCommentsAdd.prototype.ReadFromBinary = function(Reader)
{
	// String : Id комментария
	this.Id      = Reader.GetString2();
	this.Comment = AscCommon.g_oTableId.Get_ById(this.Id);
};
CChangesCommentsAdd.prototype.CreateReverseChange = function()
{
	return new CChangesCommentsRemove(this.Class, this.Id, this.Comment);
};
CChangesCommentsAdd.prototype.Merge = function(oChange)
{
	if (this.Class !== oChange.Class)
		return true;

	if ((AscDFH.historyitem_Comments_Add === oChange.Type || AscDFH.historyitem_Comments_Remove === oChange.Type) && this.Id === oChange.Id)
		return false;

	return true;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBase}
 */
function CChangesCommentsRemove(Class, Id, Comment)
{
	AscDFH.CChangesBase.call(this, Class);

	this.Id      = Id;
	this.Comment = Comment;
}
CChangesCommentsRemove.prototype = Object.create(AscDFH.CChangesBase.prototype);
CChangesCommentsRemove.prototype.constructor = CChangesCommentsRemove;
CChangesCommentsRemove.prototype.Type = AscDFH.historyitem_Comments_Remove;
CChangesCommentsRemove.prototype.Undo = function()
{
	this.Class.m_aComments[this.Id] = this.Comment;
	editor.sync_AddComment(this.Id, this.Comment.Data);
};
CChangesCommentsRemove.prototype.Redo = function()
{
	delete this.Class.m_aComments[this.Id];
	editor.sync_RemoveComment(this.Id);
};
CChangesCommentsRemove.prototype.WriteToBinary = function(Writer)
{
	// String : Id комментария
	Writer.WriteString2(this.Id);
};
CChangesCommentsRemove.prototype.ReadFromBinary = function(Reader)
{
	// String : Id комментария
	this.Id      = Reader.GetString2();
	this.Comment = AscCommon.g_oTableId.Get_ById(this.Id);
};
CChangesCommentsRemove.prototype.CreateReverseChange = function()
{
	return new CChangesCommentsAdd(this.Class, this.Id, this.Comment);
};
CChangesCommentsRemove.prototype.Merge = function(oChange)
{
	if (this.Class !== oChange.Class)
		return true;

	if ((AscDFH.historyitem_Comments_Add === oChange.Type || AscDFH.historyitem_Comments_Remove === oChange.Type) && this.Id === oChange.Id)
		return false;

	return true;
};
/**
 * @constructor
 * @extends {AscDFH.CChangesBaseProperty}
 */
function CChangesParaCommentCommentId(Class, Old, New)
{
	AscDFH.CChangesBaseProperty.call(this, Class, Old, New);
}
CChangesParaCommentCommentId.prototype = Object.create(AscDFH.CChangesBaseProperty.prototype);
CChangesParaCommentCommentId.prototype.constructor = CChangesParaCommentCommentId;
CChangesParaCommentCommentId.prototype.Type = AscDFH.historyitem_ParaComment_CommentId;
CChangesParaCommentCommentId.prototype.WriteToBinary = function(Writer)
{
	// String : New Id
	// String : Old Id
	Writer.WriteString2(this.New);
	Writer.WriteString2(this.Old);
};
CChangesParaCommentCommentId.prototype.ReadFromBinary = function(Reader)
{
	// String : New Id
	// String : Old Id

	this.New = Reader.GetString2();
	this.Old = Reader.GetString2();
};
CChangesParaCommentCommentId.prototype.private_SetValue = function(Value)
{
	this.Class.CommentId = Value;
};
CChangesParaCommentCommentId.prototype.Load = function()
{
	this.Redo();

	var Comment = AscCommon.g_oTableId.Get_ById(this.New);
	if (null !== this.Class.Paragraph && null !== Comment && Comment instanceof AscCommon.CComment)
	{
		if (true === this.Class.Start)
			Comment.Set_StartId(this.Class.Paragraph.Get_Id());
		else
			Comment.Set_EndId(this.Class.Paragraph.Get_Id());
	}
};
