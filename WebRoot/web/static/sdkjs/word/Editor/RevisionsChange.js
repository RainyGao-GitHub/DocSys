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
 * Date: 05.04.2017
 * Time: 14:41
 */

/**
 * Класс для отображения изменения сделанного в режиме рецензирования
 * @constructor
 */
var c_oAscRevisionsChangeType = Asc.c_oAscRevisionsChangeType;
function CRevisionsChange()
{
	this.Type      = c_oAscRevisionsChangeType.Unknown;
	this.X         = 0;
	this.Y         = 0;
	this.Value     = "";
	this.MoveType  = Asc.c_oAscRevisionsMove.NoMove;
	this.MoveId    = "";
	this.MoveDown  = false;

	this.UserName  = "";
	this.UserId    = "";
	this.DateTime  = "";
	this.UserColor = new AscCommon.CColor(0, 0, 0, 255);

	this.Element   = null;
	this.StartPos  = null;
	this.EndPos    = null;

	this._X       = 0;
	this._Y       = 0;
	this._PageNum = 0;
	this._PosChanged = false;

	this.SimpleChanges = [];
}
CRevisionsChange.prototype.get_UserId = function(){return this.UserId;};
CRevisionsChange.prototype.put_UserId = function(UserId)
{
	this.UserId = UserId;
	this.private_UpdateUserColor();
};
CRevisionsChange.prototype.get_UserName = function(){return this.UserName;};
CRevisionsChange.prototype.put_UserName = function(UserName)
{
	this.UserName = UserName;
	this.private_UpdateUserColor();
};
CRevisionsChange.prototype.get_DateTime = function(){return this.DateTime};
CRevisionsChange.prototype.put_DateTime = function(DateTime){this.DateTime = DateTime};
CRevisionsChange.prototype.get_UserColor = function(){return this.UserColor;};
CRevisionsChange.prototype.get_StartPos = function(){return this.StartPos};
CRevisionsChange.prototype.put_StartPos = function(StartPos){this.StartPos = StartPos;};
CRevisionsChange.prototype.get_EndPos = function(){return this.EndPos};
CRevisionsChange.prototype.put_EndPos = function(EndPos){this.EndPos = EndPos;};
CRevisionsChange.prototype.get_Type  = function(){return this.Type;};
CRevisionsChange.prototype.get_X     = function(){return this.X;};
CRevisionsChange.prototype.get_Y     = function(){return this.Y;};
CRevisionsChange.prototype.get_Value = function(){return this.Value;};
CRevisionsChange.prototype.put_Type  = function(Type){this.Type = Type;};
CRevisionsChange.prototype.put_XY    = function(X, Y){this.X = X; this.Y = Y;};
CRevisionsChange.prototype.put_Value = function(Value){this.Value = Value;};
CRevisionsChange.prototype.put_Paragraph = function(Para){this.Element = Para;};
CRevisionsChange.prototype.get_Paragraph = function(){return this.Element;};
CRevisionsChange.prototype.get_LockUserId = function()
{
	if (this.Paragraph)
	{
		var Lock = this.Paragraph.GetLock();
		var LockType = Lock.Get_Type();

		if (AscCommon.locktype_Mine !== LockType && AscCommon.locktype_None !== LockType)
			return Lock.Get_UserId();
	}

	return null;
};
CRevisionsChange.prototype.put_InternalPos = function(x, y, pageNum)
{
	if (this._PageNum !== pageNum
		|| Math.abs(this._X - x) > 0.001
		|| Math.abs(this._Y - y) > 0.001)
	{
		this._X = x;
		this._Y = y;
		this._PageNum = pageNum;
		this._PosChanged = true;
	}
	else
	{
		this._PosChanged = false;
	}
};
CRevisionsChange.prototype.get_InternalPosX = function()
{
	return this._X;
};
CRevisionsChange.prototype.get_InternalPosY = function()
{
	return this._Y;
};
CRevisionsChange.prototype.get_InternalPosPageNum = function()
{
	return this._PageNum;
};
CRevisionsChange.prototype.ComparePrevPosition = function()
{
	if (true === this._PosChanged)
		return false;

	return true;
};
CRevisionsChange.prototype.private_UpdateUserColor = function()
{
	this.UserColor = AscCommon.getUserColorById(this.UserId, this.UserName, true, false);
};
CRevisionsChange.prototype.IsMove = function()
{
	return (((c_oAscRevisionsChangeType.TextAdd === this.Type
		|| c_oAscRevisionsChangeType.TextRem === this.Type
		|| c_oAscRevisionsChangeType.ParaAdd === this.Type
		|| c_oAscRevisionsChangeType.ParaRem === this.Type)
		&& Asc.c_oAscRevisionsMove.NoMove !== this.MoveType)
		|| Asc.c_oAscRevisionsChangeType.MoveMark === this.Type);
};
CRevisionsChange.prototype.IsMoveFrom = function()
{
	return (this.MoveType === Asc.c_oAscRevisionsMove.MoveFrom);
};
CRevisionsChange.prototype.SetType = function(nType)
{
	this.Type = nType;
};
CRevisionsChange.prototype.GetType = function()
{
	return this.Type;
};
CRevisionsChange.prototype.SetElement = function(oElement)
{
	this.Element = oElement;
};
CRevisionsChange.prototype.GetElement = function()
{
	return this.Element;
};
CRevisionsChange.prototype.SetValue = function(oValue)
{
	this.Value = oValue;
};
CRevisionsChange.prototype.GetValue = function()
{
	return this.Value;
};
CRevisionsChange.prototype.SetUserId = function(sUserId)
{
	this.UserId = sUserId;
	this.private_UpdateUserColor();
};
CRevisionsChange.prototype.GetUserId = function()
{
	return this.UserId;
};
CRevisionsChange.prototype.SetUserName = function(sUserName)
{
	this.UserName = sUserName;
	this.private_UpdateUserColor();
};
CRevisionsChange.prototype.GetUserName = function()
{
	return this.UserName;
};
CRevisionsChange.prototype.SetDateTime = function(sDateTime)
{
	this.DateTime = sDateTime;
};
CRevisionsChange.prototype.GetDateTime = function()
{
	return this.DateTime;
};
CRevisionsChange.prototype.SetMoveType = function(nMoveType)
{
	this.MoveType = nMoveType;
};
CRevisionsChange.prototype.GetMoveType = function()
{
	return this.MoveType;
};
CRevisionsChange.prototype.IsComplexChange = function()
{
	return this.SimpleChanges.length !== 0;
};
CRevisionsChange.prototype.SetSimpleChanges = function(arrChanges)
{
	this.SimpleChanges = arrChanges;
};
CRevisionsChange.prototype.GetSimpleChanges = function()
{
	return this.SimpleChanges;
};
CRevisionsChange.prototype.SetMoveId = function(sMoveId)
{
	this.MoveId = sMoveId;
};
CRevisionsChange.prototype.GetMoveId = function()
{
	return this.MoveId;
};
CRevisionsChange.prototype.IsMovedDown = function()
{
	return this.MoveDown;
};
CRevisionsChange.prototype.SetMovedDown = function(isMovedDown)
{
	this.MoveDown = isMovedDown;
};
CRevisionsChange.prototype.GetX = function()
{
	return this.X;
};
CRevisionsChange.prototype.GetY = function()
{
	return this.Y;
};
CRevisionsChange.prototype.SetXY = function(X, Y)
{
	this.X = X; 
	this.Y = Y;
};
CRevisionsChange.prototype.SetInternalPos = function(dX, dY, nPageNum)
{
	if (this._PageNum !== nPageNum
		|| Math.abs(this._X - dX) > 0.001
		|| Math.abs(this._Y - dY) > 0.001)
	{
		this._X = dX;
		this._Y = dY;
		this._PageNum = nPageNum;
		this._PosChanged = true;
	}
	else
	{
		this._PosChanged = false;
	}
};
CRevisionsChange.prototype.GetInternalPosX = function()
{
	return this._X;
};
CRevisionsChange.prototype.GetInternalPosY = function()
{
	return this._Y;
};
CRevisionsChange.prototype.GetInternalPosPageNum = function()
{
	return this._PageNum;
};
CRevisionsChange.prototype.GetStartPos = function()
{
	return this.StartPos
};
CRevisionsChange.prototype.SetStartPos = function(oStartPos)
{
	this.StartPos = oStartPos;
};
CRevisionsChange.prototype.GetEndPos = function()
{
	return this.EndPos
};
CRevisionsChange.prototype.SetEndPos = function(oEndPos)
{
	this.EndPos = oEndPos;
};

//--------------------------------------------------------export--------------------------------------------------------
CRevisionsChange.prototype['get_UserId'] = CRevisionsChange.prototype.GetUserId;
CRevisionsChange.prototype['put_UserId'] = CRevisionsChange.prototype.SetUserId;
CRevisionsChange.prototype['get_UserName'] = CRevisionsChange.prototype.GetUserName;
CRevisionsChange.prototype['put_UserName'] = CRevisionsChange.prototype.SetUserName;
CRevisionsChange.prototype['get_DateTime'] = CRevisionsChange.prototype.GetDateTime;
CRevisionsChange.prototype['put_DateTime'] = CRevisionsChange.prototype.SetDateTime;
CRevisionsChange.prototype['get_UserColor'] = CRevisionsChange.prototype.get_UserColor;
CRevisionsChange.prototype['get_StartPos'] = CRevisionsChange.prototype.GetStartPos;
CRevisionsChange.prototype['put_StartPos'] = CRevisionsChange.prototype.SetStartPos;
CRevisionsChange.prototype['get_EndPos'] = CRevisionsChange.prototype.GetEndPos;
CRevisionsChange.prototype['put_EndPos'] = CRevisionsChange.prototype.SetEndPos;
CRevisionsChange.prototype['get_Type'] = CRevisionsChange.prototype.GetType;
CRevisionsChange.prototype['get_X'] = CRevisionsChange.prototype.GetX;
CRevisionsChange.prototype['get_Y'] = CRevisionsChange.prototype.GetY;
CRevisionsChange.prototype['get_Value'] = CRevisionsChange.prototype.GetValue;
CRevisionsChange.prototype['put_Type'] = CRevisionsChange.prototype.SetType;
CRevisionsChange.prototype['put_XY'] = CRevisionsChange.prototype.SetXY;
CRevisionsChange.prototype['put_Value'] = CRevisionsChange.prototype.SetValue;
CRevisionsChange.prototype['get_LockUserId'] = CRevisionsChange.prototype.get_LockUserId;
CRevisionsChange.prototype['put_MoveType'] = CRevisionsChange.prototype.SetMoveType;
CRevisionsChange.prototype['get_MoveType'] = CRevisionsChange.prototype.GetMoveType;
CRevisionsChange.prototype['get_MoveId'] = CRevisionsChange.prototype.GetMoveId;
CRevisionsChange.prototype['is_MovedDown'] = CRevisionsChange.prototype.IsMovedDown;
