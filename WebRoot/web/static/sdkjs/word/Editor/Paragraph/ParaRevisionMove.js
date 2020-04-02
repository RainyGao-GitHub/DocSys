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
 * Date: 05.04.2019
 * Time: 16:02
 */

/**
 * Класс для обозначения элемента начала/конца переноса текста во время рецензирования внутри параграфа
 * @constructor
 * @extends {CParagraphContentBase}
 */
function CParaRevisionMove(isStart, isFrom, sName, oInfo)
{
	CParagraphContentBase.call(this);
	this.Id = AscCommon.g_oIdCounter.Get_NewId();

	this.Start = isStart;
	this.From  = isFrom;
	this.Name  = sName;

	this.Type = para_RevisionMove;

	this.ReviewInfo = null;
	if (oInfo)
	{
		this.ReviewInfo = oInfo;
	}
	else
	{
		this.ReviewInfo = new CReviewInfo();
		this.ReviewInfo.Update();
	}

	// Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
	g_oTableId.Add(this, this.Id);
}

CParaRevisionMove.prototype = Object.create(CParagraphContentBase.prototype);
CParaRevisionMove.prototype.constructor = CParaRevisionMove;

CParaRevisionMove.prototype.Get_Id = function()
{
	return this.Id;
};
CParaRevisionMove.prototype.GetId = function()
{
	return this.Get_Id();
};
CParaRevisionMove.prototype.Copy = function(Selected)
{
	return new CParaRevisionMove(this.Start, this.From, this.Name);
};
CParaRevisionMove.prototype.Refresh_RecalcData = function()
{
};
CParaRevisionMove.prototype.Write_ToBinary2 = function(oWriter)
{
	oWriter.WriteLong(AscDFH.historyitem_type_ParaRevisionMove);

	// String      : Id
	// Bool        : is Start
	// Bool        : is From
	// String      : Name
	// CReviewInfo : Info

	oWriter.WriteString2("" + this.Id);
	oWriter.WriteBool(this.Start);
	oWriter.WriteBool(this.From);
	oWriter.WriteString2("" + this.Name);
	this.ReviewInfo.WriteToBinary(oWriter);
};
CParaRevisionMove.prototype.Read_FromBinary2 = function(oReader)
{
	// String  : Id
	// Bool    : is Start
	// Bool    : is From
	// String  : Name

	this.Id    = oReader.GetString2();
	this.Start = oReader.GetBool();
	this.From  = oReader.GetBool();
	this.Name  = oReader.GetString2();

	this.ReviewInfo = new CReviewInfo();
	this.ReviewInfo.ReadFromBinary(oReader);
};
CParaRevisionMove.prototype.SetParagraph = function(oParagraph)
{
	if (!editor || !editor.WordControl || !editor.WordControl.m_oLogicDocument || !editor.WordControl.m_oLogicDocument.GetTrackRevisionsManager())
		return;

	var oManager = editor.WordControl.m_oLogicDocument.GetTrackRevisionsManager();

	if (oParagraph)
	{
		this.Paragraph = oParagraph;
		oManager.RegisterMoveMark(this);
	}
	else
	{
		this.Paragraph = null;
		oManager.UnregisterMoveMark(this);
	}
};
CParaRevisionMove.prototype.GetMarkId = function()
{
	return this.Name;
};
CParaRevisionMove.prototype.IsFrom = function()
{
	return this.From;
};
CParaRevisionMove.prototype.IsStart = function()
{
	return this.Start;
};
CParaRevisionMove.prototype.CheckRevisionsChanges = function(oChecker, oContentPos, nDepth)
{
	oChecker.FlushAddRemoveChange();
	oChecker.FlushTextPrChange();
	oChecker.AddReviewMoveMark(this, oContentPos.Copy());
};
CParaRevisionMove.prototype.GetReviewInfo = function()
{
	return this.ReviewInfo;
};
CParaRevisionMove.prototype.PreDelete = function()
{
	var oParagraph = this.GetParagraph();
	if (oParagraph && oParagraph.LogicDocument)
		oParagraph.LogicDocument.RemoveTrackMoveMarks(this.GetMarkId());
};
CParaRevisionMove.prototype.IsUseInDocument = function()
{
	var oParagraph = this.GetParagraph();

	if (!oParagraph || !this.Paragraph.Get_PosByElement(this))
		return false;

	return oParagraph.Is_UseInDocument();
};
CParaRevisionMove.prototype.GetReviewChange = function()
{
	var oParagraph     = this.GetParagraph();
	var oLogicDocument = oParagraph ? oParagraph.LogicDocument : null;
	if (oLogicDocument)
	{
		var oTrackManager = oLogicDocument.GetTrackRevisionsManager();
		return oTrackManager.GetMoveMarkChange(this.GetMarkId(), this.IsFrom(), this.IsStart());
	}

	return null;
};
CParaRevisionMove.prototype.Is_Empty = function()
{
	return false;
};
CParaRevisionMove.prototype.RemoveThisMarkFromDocument = function()
{
	var oParagraph = this.GetParagraph();
	if (oParagraph)
		oParagraph.RemoveElement(this);
};
CParaRevisionMove.prototype.GetSelectedElementsInfo = function(oInfo)
{
	if (oInfo && oInfo.IsCheckAllSelection())
	{
		oInfo.RegisterTrackMoveMark(this);
	}
};

/**
 * Класс для обозначения элемента начала/конца переноса текста во время рецензирования внутри рана
 * @constructor
 * @extends {CRunElementBase}
 */
function CRunRevisionMove(isStart, isFrom, sName, oInfo)
{
	CRunElementBase.call(this);

	this.Start = isStart;
	this.From  = isFrom;
	this.Name  = sName;

	this.Run   = null;

	this.ReviewInfo = null;
	if (oInfo)
	{
		this.ReviewInfo = oInfo;
	}
	else
	{
		this.ReviewInfo = new CReviewInfo();
		this.ReviewInfo.Update();
	}
}

CRunRevisionMove.prototype = Object.create(CRunElementBase.prototype);
CRunRevisionMove.prototype.constructor = CRunRevisionMove;
CRunRevisionMove.prototype.Type = para_RevisionMove;

CRunRevisionMove.prototype.Copy = function()
{
	return new CRunRevisionMove(this.Start, this.From, this.Name);
};
CRunRevisionMove.prototype.Write_ToBinary  = function(oWriter)
{
	oWriter.WriteLong(this.Type);

	// Bool        : Start
	// Bool        : From
	// String      : Name
	// CReviewInfo : Info

	oWriter.WriteBool(this.Start);
	oWriter.WriteBool(this.From);
	oWriter.WriteString2("" + this.Name);
	this.ReviewInfo.WriteToBinary(oWriter);
};
CRunRevisionMove.prototype.Read_FromBinary = function(oReader)
{
	// Bool        : Start
	// Bool        : From
	// String      : Name
	// CReviewInfo : Info

	this.Start = oReader.GetBool();
	this.From  = oReader.GetBool();
	this.Name  = oReader.GetString2();

	this.ReviewInfo = new CReviewInfo();
	this.ReviewInfo.ReadFromBinary(oReader);
};
CRunRevisionMove.prototype.SetParent = function(oParent)
{
	if (!editor || !editor.WordControl || !editor.WordControl.m_oLogicDocument || !editor.WordControl.m_oLogicDocument.GetTrackRevisionsManager())
		return;

	var oManager = editor.WordControl.m_oLogicDocument.GetTrackRevisionsManager();

	if (oParent)
	{
		this.Run = oParent;
		oManager.RegisterMoveMark(this);
	}
	else
	{
		this.Run = null;
		oManager
	}
};
CRunRevisionMove.prototype.GetMarkId = function()
{
	return this.Name;
};
CRunRevisionMove.prototype.IsFrom = function()
{
	return this.From;
};
CRunRevisionMove.prototype.IsStart = function()
{
	return this.Start;
};
CRunRevisionMove.prototype.GetRun = function()
{
	return this.Run;
};
CRunRevisionMove.prototype.GetReviewInfo = function()
{
	return this.ReviewInfo;
};
CRunRevisionMove.prototype.PreDelete = function()
{
	var oRun = this.GetRun();
	var oParagraph = oRun ? oRun.GetParagraph() : null;
	var oLogicDocument = oParagraph ? oParagraph.LogicDocument : null;

	if (oLogicDocument)
		oLogicDocument.RemoveTrackMoveMarks(this.GetMarkId());
};
CRunRevisionMove.prototype.IsUseInDocument = function()
{
	var oRun = this.GetRun();
	return (oRun && -1 !== oRun.GetElementPosition(this) && oRun.Is_UseInDocument());
};
CRunRevisionMove.prototype.GetReviewChange = function()
{
	var oRun           = this.GetRun();
	var oParagraph     = oRun ? oRun.GetParagraph() : null;
	var oLogicDocument = oParagraph ? oParagraph.LogicDocument : null;
	if (oLogicDocument)
	{
		var oTrackManager = oLogicDocument.GetTrackRevisionsManager();
		return oTrackManager.GetMoveMarkChange(this.GetMarkId(), this.IsFrom(), this.IsStart());
	}

	return null;
};
CRunRevisionMove.prototype.RemoveThisMarkFromDocument = function()
{
	var oRun = this.GetRun();
	if (oRun)
		oRun.RemoveElement(this);
};

//--------------------------------------------------------export----------------------------------------------------
window['AscCommon'] = window['AscCommon'] || {};

window['AscCommon'].CParaRevisionMove = CParaRevisionMove;
window['AscCommon'].CRunRevisionMove  = CRunRevisionMove;
