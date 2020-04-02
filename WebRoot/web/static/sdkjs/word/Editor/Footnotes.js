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
 * Класс, работающий со сносками документа.
 * @param {CDocument} LogicDocument - Ссылка на главный документ.
 * @constructor
 * @extends {CDocumentControllerBase}
 */
function CFootnotesController(LogicDocument)
{
	CDocumentControllerBase.call(this, LogicDocument);

	this.Id = LogicDocument.Get_IdCounter().Get_NewId();

	this.FootnotePr = new CFootnotePr(); // Глобальные настройки для сносок
	this.FootnotePr.InitDefault();

	this.Footnote = {}; // Список всех сносок с ключом - Id.
	this.Pages    = [];

	// Специальные сноски
	this.ContinuationNoticeFootnote    = null;
	this.ContinuationSeparatorFootnote = null;
	this.SeparatorFootnote             = null;

	this.Selection = {
		Use       : false,
		Start     : {
			Footnote : null,
			Page     : 0,
			Index    : 0
		},
		End       : {
			Footnote : null,
			Page     : 0,
			Index    : 0
		},
		Footnotes : {},
		Direction : 0
	};

	this.CellLimits = []; // Для рассчета сносок, встречающихся в ячейках с минимальной или фиксированной высотой строки

	this.CurFootnote = null;

	// Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
	LogicDocument.Get_TableId().Add(this, this.Id);
}

CFootnotesController.prototype = Object.create(CDocumentControllerBase.prototype);
CFootnotesController.prototype.constructor = CFootnotesController;

/**
 * Получаем Id данного класса.
 */
CFootnotesController.prototype.Get_Id = function()
{
	return this.Id;
};
/**
 *
 * @param oLogicDocument
 * @returns {CFootnotesController}
 */
CFootnotesController.prototype.Copy = function(oLogicDocument)
{
	var oFootnotes = new CFootnotesController(oLogicDocument);

	for (var sId in this.Footnote)
	{
		oFootnotes.AddFootnote(this.Footnote[sId].Copy(oFootnotes));
	}

	oFootnotes.SetSeparator(this.SeparatorFootnote ? this.SeparatorFootnote.Copy(oFootnotes) : null);
	oFootnotes.SetContinuationSeparator(this.ContinuationSeparatorFootnote ? this.ContinuationSeparatorFootnote.Copy(oFootnotes) : null);
	oFootnotes.SetContinuationNotice(this.ContinuationNoticeFootnote ? this.ContinuationNoticeFootnote.Copy(oFootnotes) : null);

	return oFootnotes;
};
/**
 * Начальная инициализация после загрузки всех файлов.
 */
CFootnotesController.prototype.ResetSpecialFootnotes = function()
{
	var oSeparator = new CFootEndnote(this);
	oSeparator.AddToParagraph(new ParaSeparator(), false);
	var oParagraph = oSeparator.GetElement(0);
	oParagraph.Set_Spacing({After : 0, Line : 1, LineRule : Asc.linerule_Auto}, false);
	this.SetSeparator(oSeparator);

	var oContinuationSeparator = new CFootEndnote(this);
	oContinuationSeparator.AddToParagraph(new ParaContinuationSeparator(), false);
	oParagraph = oContinuationSeparator.GetElement(0);
	oParagraph.Set_Spacing({After : 0, Line : 1, LineRule : Asc.linerule_Auto}, false);
	this.SetContinuationSeparator(oContinuationSeparator);

	this.SetContinuationNotice(null);
};
/**
 * Создаем новую сноску.
 * @returns {CFootEndnote}
 */
CFootnotesController.prototype.CreateFootnote = function()
{
	var NewFootnote                     = new CFootEndnote(this);
	this.Footnote[NewFootnote.Get_Id()] = NewFootnote;

	var oHistory = this.LogicDocument.Get_History();
	oHistory.Add(new CChangesFootnotesAddFootnote(this, NewFootnote.Get_Id()));
	return NewFootnote;
};
/**
 * Добавляем сноску (функция для открытия файла)
 * @param oFootnote
 */
CFootnotesController.prototype.AddFootnote = function(oFootnote)
{
	this.Footnote[oFootnote.Get_Id()] = oFootnote;
	var oHistory                      = this.LogicDocument.Get_History();
	oHistory.Add(new CChangesFootnotesAddFootnote(this, oFootnote.Get_Id()));
};
CFootnotesController.prototype.SetSeparator = function(oFootnote)
{
	var oNewValue = oFootnote ? oFootnote : null;
	var oOldValue = this.SeparatorFootnote ? this.SeparatorFootnote : null;

	var oHistory = this.LogicDocument.Get_History();
	oHistory.Add(new CChangesFootnotesSetSeparator(this, oOldValue, oNewValue));
	this.SeparatorFootnote = oNewValue;
};
CFootnotesController.prototype.SetContinuationSeparator = function(oFootnote)
{
	var oNewValue = oFootnote ? oFootnote : null;
	var oOldValue = this.ContinuationSeparatorFootnote ? this.ContinuationSeparatorFootnote : null;

	var oHistory = this.LogicDocument.Get_History();
	oHistory.Add(new CChangesFootnotesSetContinuationSeparator(this, oOldValue, oNewValue));
	this.ContinuationSeparatorFootnote = oNewValue;
};
CFootnotesController.prototype.SetContinuationNotice = function(oFootnote)
{
	var oNewValue = oFootnote ? oFootnote : null;
	var oOldValue = this.ContinuationNoticeFootnote ? this.ContinuationNoticeFootnote : null;

	var oHistory = this.LogicDocument.Get_History();
	oHistory.Add(new CChangesFootnotesSetContinuationNotice(this, oOldValue, oNewValue));
	this.ContinuationNoticeFootnote = oNewValue;
};
CFootnotesController.prototype.SetFootnotePrNumFormat = function(nFormatType)
{
	if (undefined !== nFormatType && this.FootnotePr.NumFormat !== nFormatType)
	{
		var oHistory = this.LogicDocument.Get_History();
		oHistory.Add(new CChangesFootnotesSetFootnotePrNumFormat(this, this.FootnotePr.NumFormat, nFormatType));
		this.FootnotePr.NumFormat = nFormatType;
	}
};
CFootnotesController.prototype.SetFootnotePrPos = function(nPos)
{
	if (undefined !== nPos && this.FootnotePr.Pos !== nPos)
	{
		var oHistory = this.LogicDocument.Get_History();
		oHistory.Add(new CChangesFootnotesSetFootnotePrPos(this, this.FootnotePr.Pos, nPos));
		this.FootnotePr.Pos = nPos;
	}
};
CFootnotesController.prototype.SetFootnotePrNumStart = function(nStart)
{
	if (undefined !== nStart && this.FootnotePr.NumStart !== nStart)
	{
		var oHistory = this.LogicDocument.Get_History();
		oHistory.Add(new CChangesFootnotesSetFootnotePrNumStart(this, this.FootnotePr.NumStart, nStart));
		this.FootnotePr.NumStart = nStart;
	}
};
CFootnotesController.prototype.SetFootnotePrNumRestart = function(nRestartType)
{
	if (undefined !== nRestartType && this.FootnotePr.NumRestart !== nRestartType)
	{
		var oHistory = this.LogicDocument.Get_History();
		oHistory.Add(new CChangesFootnotesSetFootnotePrNumRestart(this, this.FootnotePr.NumRestart, nRestartType));
		this.FootnotePr.NumRestart = nRestartType;
	}
};
/**
 * Сбрасываем рассчетные данный для заданной страницы.
 * @param {number} nPageIndex
 * @param {CSectionPr} oSectPr
 */
CFootnotesController.prototype.Reset = function(nPageIndex, oSectPr)
{
	if (!this.Pages[nPageIndex])
		this.Pages[nPageIndex] = new CFootEndnotePage();

	var oPage = this.Pages[nPageIndex];
	oPage.Reset();

	var oFrame = oSectPr.GetContentFrame(nPageIndex);

	var X      = oFrame.Left;
	var XLimit = oFrame.Right;

	var nColumnsCount = oSectPr.GetColumnsCount();
	for (var nColumnIndex = 0; nColumnIndex < nColumnsCount; ++nColumnIndex)
	{
		var _X = X;
		for (var nTempColumnIndex = 0; nTempColumnIndex < nColumnIndex; ++nTempColumnIndex)
		{
			_X += oSectPr.GetColumnWidth(nTempColumnIndex);
			_X += oSectPr.GetColumnSpace(nTempColumnIndex);
		}

		var _XLimit = (nColumnsCount - 1 !== nColumnIndex ? _X + oSectPr.GetColumnWidth(nColumnIndex) : XLimit);

		var oColumn    = new CFootEndnotePageColumn();
		oColumn.X      = _X;
		oColumn.XLimit = _XLimit;
		oPage.AddColumn(oColumn);
	}

	oPage.X      = X;
	oPage.XLimit = XLimit;
};
/**
 * Рассчитываем сноски, которые перенеслись с предыдущей колонки
 * @param {number} nPageAbs
 * @param {number} nColumnAbs
 * @param {number} Y
 * @param {number} YLimit
 */
CFootnotesController.prototype.ContinueElementsFromPreviousColumn = function(nPageAbs, nColumnAbs, Y, YLimit)
{
	var oColumn = this.private_GetPageColumn(nPageAbs, nColumnAbs);
	if (!oColumn)
		return;

	var nColumnsCount = this.Pages[nPageAbs].Columns.length;

	var X      = oColumn.X;
	var XLimit = oColumn.XLimit;

	var _Y      = 0;
	var _YLimit = YLimit - Y;

	oColumn.Y      = Y;
	oColumn.YLimit = YLimit;

	oColumn.Reset();
	var oPrevColumn = (nColumnAbs > 0 ? this.Pages[nPageAbs].Columns[nColumnAbs - 1] : (nPageAbs > 0 ? this.Pages[nPageAbs - 1].Columns[this.Pages[nPageAbs - 1].Columns.length - 1] : null));
	if (null !== oPrevColumn)
	{
		var arrElements = oPrevColumn.GetContinuesElements();

		if (arrElements.length > 0 && null !== this.ContinuationSeparatorFootnote)
		{
			this.ContinuationSeparatorFootnote.PrepareRecalculateObject();
			this.ContinuationSeparatorFootnote.Reset(X, _Y, XLimit, _YLimit);
			this.ContinuationSeparatorFootnote.Set_StartPage(nPageAbs, nColumnAbs, nColumnsCount);
			this.ContinuationSeparatorFootnote.Recalculate_Page(0, true);
			oColumn.ContinuationSeparatorRecalculateObject = this.ContinuationSeparatorFootnote.SaveRecalculateObject();

			var oBounds = this.ContinuationSeparatorFootnote.Get_PageBounds(0);
			_Y += oBounds.Bottom - oBounds.Top;

			oColumn.Height = _Y;
		}

		for (var nIndex = 0, nCount = arrElements.length; nIndex < nCount; ++nIndex)
		{
			var oFootnote = arrElements[nIndex];
			if (0 !== nIndex)
			{
				oFootnote.Reset(X, _Y, XLimit, _YLimit);
				oFootnote.Set_StartPage(nPageAbs, nColumnAbs, nColumnsCount);
			}

			oColumn.Elements.push(oFootnote);

			var nRelativePage = oFootnote.GetElementPageIndex(nPageAbs, nColumnAbs);
			var nRecalcResult = oFootnote.Recalculate_Page(nRelativePage, true);

			if (recalcresult2_NextPage === nRecalcResult)
			{
				// Начиная с данной сноски мы все оставшиеся сноски заносим в массив ContinuesElements у данной колонки
				var arrContinuesElements = arrElements.slice(nIndex);
				oColumn.SetContinuesElements(arrContinuesElements);
			}
			else if (recalcresult2_CurPage === nRecalcResult)
			{
				// Такого не должно быть при расчете сносок
			}

			var oBounds = oFootnote.Get_PageBounds(nRelativePage);
			_Y += oBounds.Bottom - oBounds.Top;
			oColumn.Height = _Y;

			if (recalcresult2_NextPage === nRecalcResult)
				break;
		}
	}
};
/**
 * Рассчитываем сноски, которые перенеслись с предыдущей колонки
 * @param {number} nPageAbs
 * @param {number} nColumnAbs
 * @param {number} dY
 * @param {Array.CFootEndnote} arrFootnotes
 * @returns {boolean} true - расчиталось нормально, и перенос делать не надо, false - данные сноски перенеслись на
 *     следующую страницу
 */
CFootnotesController.prototype.RecalculateFootnotes = function(nPageAbs, nColumnAbs, dY, arrFootnotes)
{
	if (!arrFootnotes || arrFootnotes.length <= 0)
		return true;

	var oColumn = this.private_GetPageColumn(nPageAbs, nColumnAbs);
	if (!oColumn)
		return true;

	var Y = dY;
	for (var nIndex = 0, nCount = this.CellLimits.length; nIndex < nCount; ++nIndex)
	{
		if (Y < this.CellLimits[nIndex] - 0.001)
			Y = this.CellLimits[nIndex];
	}

	var isLowerY = (Y < oColumn.ReferenceY + 0.001 ? true : false);

	if (oColumn.GetContinuesElements().length > 0)
	{
		// Если уже есть элементы, которые переносятся, тогда данные сноски точно не убирутся
		// Но если пришедший Y выше нашего самого нижнего, тогда мы все пришедшие элементы добавляем в список
		// на следующую страницу. Такое возможно в таблицах, когда сноски расположены в разных ячейках одной строки,
		// причем вторая сноска выше первой.

		if (isLowerY)
		{
			oColumn.AddContinuesElements(arrFootnotes);
			return true;
		}
		else
		{
			return false;
		}
	}

	var nColumnsCount = this.Pages[nPageAbs].Columns.length;

	var X      = oColumn.X;
	var XLimit = oColumn.XLimit;

	var _Y      = oColumn.Height;
	var _YLimit = oColumn.YLimit - Y;

	if (isLowerY)
		_YLimit = oColumn.YLimit - oColumn.ReferenceY;

	if (oColumn.Elements.length <= 0 && null !== this.SeparatorFootnote)
	{
		this.SeparatorFootnote.PrepareRecalculateObject();
		this.SeparatorFootnote.Reset(X, _Y, XLimit, _YLimit);
		this.SeparatorFootnote.Set_StartPage(nPageAbs, nColumnAbs, nColumnsCount);
		this.SeparatorFootnote.Recalculate_Page(0, true);
		oColumn.SeparatorRecalculateObject = this.SeparatorFootnote.SaveRecalculateObject();

		var oBounds    = this.SeparatorFootnote.Get_PageBounds(0);
		_Y += oBounds.Bottom - oBounds.Top;
		oColumn.Height = _Y;
	}

	for (var nIndex = 0, nCount = arrFootnotes.length; nIndex < nCount; ++nIndex)
	{
		var oFootnote = arrFootnotes[nIndex];
		oFootnote.Reset(X, _Y, XLimit, _YLimit);
		oFootnote.Set_StartPage(nPageAbs, nColumnAbs, nColumnsCount);


		var nRelativePage = oFootnote.GetElementPageIndex(nPageAbs, nColumnAbs);
		var nRecalcResult = oFootnote.Recalculate_Page(nRelativePage, true);

		if (recalcresult2_NextPage === nRecalcResult)
		{
			// Если у нас первая сноска не убирается, тогда мы переносим. Есть исключение, когда мы находимся в таблице
			// и у нас уже есть сноски на странице, а ссылка на данную сноску выше чем те, которые мы уже добавили.
			if (0 === nIndex && true !== oFootnote.IsContentOnFirstPage() && (0 === oColumn.Elements.length || !isLowerY))
				return false;

			// Начиная с данной сноски мы все оставшиеся сноски заносим в массив ContinuesElements у данной колонки
			var arrContinuesElements = arrFootnotes.slice(nIndex);
			oColumn.SetContinuesElements(arrContinuesElements);
		}
		else if (recalcresult2_CurPage === nRecalcResult)
		{
			// Такого не должно быть при расчете сносок
		}

		oColumn.Elements.push(oFootnote);

		var oBounds    = oFootnote.Get_PageBounds(nRelativePage);
		_Y += oBounds.Bottom - oBounds.Top;
		oColumn.Height = _Y;

		if (recalcresult2_NextPage === nRecalcResult)
			break;
	}

	oColumn.Height = Math.min(_YLimit, oColumn.Height);

	if (!isLowerY)
		oColumn.ReferenceY = Y;

	return true;
};
/**
 * Получаем суммарную высоту, занимаемую сносками на заданной странице.
 * @param {number} nPageAbs
 * @param {number} nColumnAbs
 * @returns {number}
 */
CFootnotesController.prototype.GetHeight = function(nPageAbs, nColumnAbs)
{
	var oColumn = this.private_GetPageColumn(nPageAbs, nColumnAbs);
	if (!oColumn)
		return 0;

	return oColumn.Height;
};
/**
 * Отрисовываем сноски на заданной странице.
 * @param {number} nPageAbs
 * @param {CGraphics} pGraphics
 */
CFootnotesController.prototype.Draw = function(nPageAbs, pGraphics)
{
	var oPage = this.Pages[nPageAbs];
	if (!oPage)
		return;

	var nColumnsCount = oPage.Columns.length;
	for (var nColumnIndex = 0; nColumnIndex < nColumnsCount; ++nColumnIndex)
	{
		var oColumn = oPage.Columns[nColumnIndex];
		if (!oColumn || oColumn.Elements.length <= 0)
			continue;

		if (null !== this.ContinuationSeparatorFootnote && null !== oColumn.ContinuationSeparatorRecalculateObject)
		{
			this.ContinuationSeparatorFootnote.LoadRecalculateObject(oColumn.ContinuationSeparatorRecalculateObject);
			this.ContinuationSeparatorFootnote.Draw(nPageAbs, pGraphics);
		}
		if (null !== this.SeparatorFootnote && null !== oColumn.SeparatorRecalculateObject)
		{
			this.SeparatorFootnote.LoadRecalculateObject(oColumn.SeparatorRecalculateObject);
			this.SeparatorFootnote.Draw(nPageAbs, pGraphics);
		}

		for (var nIndex = 0, nCount = oColumn.Elements.length; nIndex < nCount; ++nIndex)
		{
			var oFootnote = oColumn.Elements[nIndex];
			var nFootnotePageIndex = oFootnote.GetElementPageIndex(nPageAbs, nColumnIndex);
			oFootnote.Draw(nFootnotePageIndex + oFootnote.StartPage, pGraphics);
		}
	}
};
/**
 * Сдвигаем все рассчитанные позиции на заданной странице.
 * @param {number} nPageAbs
 * @param {number} nColumnAbs
 * @param {number} dX
 * @param {number} dY
 */
CFootnotesController.prototype.Shift = function(nPageAbs, nColumnAbs, dX, dY)
{
	var oColumn = this.private_GetPageColumn(nPageAbs, nColumnAbs);
	if (!oColumn)
		return;

	if (null !== this.ContinuationSeparatorFootnote && null !== oColumn.ContinuationSeparatorRecalculateObject)
	{
		this.ContinuationSeparatorFootnote.LoadRecalculateObject(oColumn.ContinuationSeparatorRecalculateObject);
		this.ContinuationSeparatorFootnote.Shift(0, dX, dY);
		oColumn.ContinuationSeparatorRecalculateObject = this.ContinuationSeparatorFootnote.SaveRecalculateObject();
	}
	if (null !== this.SeparatorFootnote && null !== oColumn.SeparatorRecalculateObject)
	{
		this.SeparatorFootnote.LoadRecalculateObject(oColumn.SeparatorRecalculateObject);
		this.SeparatorFootnote.Shift(0, dX, dY);
		oColumn.SeparatorRecalculateObject = this.SeparatorFootnote.SaveRecalculateObject();
	}

	for (var nIndex = 0, nCount = oColumn.Elements.length; nIndex < nCount; ++nIndex)
	{
		var oFootnote = oColumn.Elements[nIndex];
		var nFootnotePageIndex = oFootnote.GetElementPageIndex(nPageAbs, nColumnAbs);
		oFootnote.Shift(nFootnotePageIndex, dX, dY);
	}
};
CFootnotesController.prototype.PushCellLimit = function(dY)
{
	this.CellLimits.push(dY);
};
CFootnotesController.prototype.PopCellLimit = function()
{
	this.CellLimits.length = Math.max(0, this.CellLimits.length - 1);
};
CFootnotesController.prototype.GetFootnoteNumberOnPage = function(nPageAbs, nColumnAbs, oSectPr)
{
	var nNumRestart = section_footnote_RestartEachPage;
	var nNumStart   = 1;
	if (oSectPr)
	{
		nNumRestart = oSectPr.GetFootnoteNumRestart();
		nNumStart   = oSectPr.GetFootnoteNumStart();
	}

	// NumStart никак не влияет в случаях RestartEachPage и RestartEachSect. Влияет только на случай RestartContinuous:
	// к общему количеству сносок добавляется данное значение, взятое для текущей секции, этоже значение из предыдущих
	// секций не учитывается.

	if (section_footnote_RestartEachPage === nNumRestart)
	{
		// Случай, когда своя отдельная нумерация на каждой странице
		// Мы делаем не совсем как в Word, если у нас происходит ситуация, что ссылка на сноску на одной странице, а сама
		// сноска на следующей, тогда у этих страниц нумерация общая, в Word ставится номер "1" в такой ситуации, и становится
		// непонятно, потому что есть две ссылки с номером 1 на странице, ссылающиеся на разные сноски.

		// В таблицах сами сноски могут переносится на другую колонку, а ссылки будут оставаться на данной, и они пока еще
		// не рассчитаны и никуда не добавлены, поэтому нам также надо учитывать количество переносимы сносок на следующую
		// колонку.
		var nAdditional = 0;

		for (var nColumnIndex = nColumnAbs; nColumnIndex >= 0; --nColumnIndex)
		{
			var oColumn = this.private_GetPageColumn(nPageAbs, nColumnIndex);
			if (nColumnIndex === nColumnAbs)
			{
				var arrContinuesElements = oColumn.GetContinuesElements();
				for (var nTempIndex = 1; nTempIndex < arrContinuesElements.length; ++nTempIndex)
				{
					if (!arrContinuesElements[nTempIndex].IsCustomMarkFollows())
						nAdditional++;
				}
			}

			if (oColumn.Elements.length > 0)
			{
				var oFootnote  = oColumn.Elements[oColumn.Elements.length - 1];
				var nStartPage = oFootnote.Get_StartPage_Absolute();

				if (nStartPage >= nPageAbs || (nStartPage === nPageAbs - 1 && true !== oFootnote.IsContentOnFirstPage()))
					return oFootnote.GetNumber() + 1 + nAdditional;
				else
					return 1 + nAdditional;
			}

		}
	}
	else if (section_footnote_RestartEachSect === nNumRestart)
	{
		var oColumn = this.private_GetPageColumn(nPageAbs, nColumnAbs);
		if (oColumn)
		{
			var arrContinuesElements = oColumn.GetContinuesElements();
			if (arrContinuesElements.length > 0 && oColumn.Elements.length > 0)
			{
				var oFootnote = oColumn.Elements[oColumn.Elements.length - 1];
				if (oFootnote.GetReferenceSectPr() !== oSectPr)
					return 1;

				var nAdditional = 0;
				for (var nTempIndex = 0; nTempIndex < arrContinuesElements.length; ++nTempIndex)
				{
					if (!arrContinuesElements[nTempIndex].IsCustomMarkFollows())
						nAdditional++;
				}

				// Второе условие не нужно, потому что если arrContinuesElements.length > 0, то на такой колонке
				// пусть и пустая но должна быть хоть одна сноска рассчитана

				return oColumn.Elements[oColumn.Elements.length - 1].GetNumber() + 1 + nAdditional;
			}
		}

		// Дальше мы ищем колонку, на которой была последняя сноска. Заметим, что переносы сносок мы не проверяем, т.к.
		// их не может быть вплоть до последней сноски, а что последняя сноска не переносится мы проверили выше.
		for (var nPageIndex = nPageAbs; nPageIndex >= 0; --nPageIndex)
		{
			var nColumnStartIndex = (nPageIndex === nPageAbs ? nColumnAbs : this.Pages[nPageAbs].Columns.length - 1);
			for (var nColumnIndex = nColumnStartIndex; nColumnIndex >= 0; --nColumnIndex)
			{
				oColumn = this.private_GetPageColumn(nPageIndex, nColumnIndex);
				if (oColumn && oColumn.Elements.length > 0)
				{
					var oFootnote = oColumn.Elements[oColumn.Elements.length - 1];
					if (oFootnote.GetReferenceSectPr() !== oSectPr)
						return 1;

					return oColumn.Elements[oColumn.Elements.length - 1].GetNumber() + 1;
				}
			}
		}
	}
	else// if (section_footnote_RestartContinuous === nNumRestart)
	{
		// Здесь нам надо считать, сколько сносок всего в документе до данного момента, отталкиваться от предыдущей мы
		// не можем, потому что Word считает общее количество сносок, а не продолжает нумерацию с предыдущей секции,
		// т.е. после последнего номера 4 в старой секции, в новой секции может идти уже, например, 9.
		var nFootnotesCount = 0;
		for (var nPageIndex = nPageAbs; nPageIndex >= 0; --nPageIndex)
		{
			var nColumnStartIndex = (nPageIndex === nPageAbs ? nColumnAbs : this.Pages[nPageAbs].Columns.length - 1);
			for (var nColumnIndex = nColumnStartIndex; nColumnIndex >= 0; --nColumnIndex)
			{
				oColumn = this.private_GetPageColumn(nPageIndex, nColumnIndex);
				if (oColumn && oColumn.Elements.length > 0)
				{
					for (var nFootnoteIndex = 0, nTempCount = oColumn.Elements.length; nFootnoteIndex < nTempCount; ++nFootnoteIndex)
					{
						var oFootnote = oColumn.Elements[nFootnoteIndex];
						if (oFootnote
							&& true !== oFootnote.IsCustomMarkFollows()
							&& (0 !== nFootnoteIndex
							|| oFootnote.Pages.length <= 1
							|| (0 === nFootnoteIndex && 1 === oColumn.Elements.length && nPageIndex === oFootnote.Get_StartPage_Absolute() && nColumnIndex === oFootnote.Get_StartColumn_Absolute())))
							nFootnotesCount++;
					}
				}
			}
		}

		return nFootnotesCount + nNumStart;
	}

	return 1;
};
CFootnotesController.prototype.SaveRecalculateObject = function(nPageAbs, nColumnAbs)
{
	var oColumn = this.private_GetPageColumn(nPageAbs, nColumnAbs);
	if (!oColumn)
		return null;

	return oColumn.SaveRecalculateObject();
};
CFootnotesController.prototype.LoadRecalculateObject = function(nPageAbs, nColumnAbs, oRObject)
{
	var oColumn = this.private_GetPageColumn(nPageAbs, nColumnAbs);
	if (!oColumn)
		return;

	oColumn.LoadRecalculateObject(oRObject);
};
CFootnotesController.prototype.HaveContinuesFootnotes = function(nPageAbs, nColumnAbs)
{
	var oColumn = this.private_GetPageColumn(nPageAbs, nColumnAbs);
	if (!oColumn)
		return false;

	var arrContinues = oColumn.GetContinuesElements();

	return (arrContinues.length > 0 ? true : false);
};
/**
 * Проверяем, используется заданная сноска в документе.
 * @param {string} sFootnoteId
 * @param {CFootEndnote.array} arrFootnotesList
 * @returns {boolean}
 */
CFootnotesController.prototype.Is_UseInDocument = function(sFootnoteId, arrFootnotesList)
{
	if (!arrFootnotesList)
		arrFootnotesList = this.private_GetFootnotesLogicRange(null, null);

	var oFootnote = null;
	for (var nIndex = 0, nCount = arrFootnotesList.length; nIndex < nCount; ++nIndex)
	{
		var oTempFootnote = arrFootnotesList[nIndex];
		if (oTempFootnote.Get_Id() === sFootnoteId)
		{
			oFootnote = oTempFootnote;
			break;
		}
	}

	if (this.Footnote[sFootnoteId] === oFootnote)
		return true;

	return false;
};
/**
 * Проверяем является ли данная сноска текущей.
 * @param oFootnote
 * return {boolean}
 */
CFootnotesController.prototype.Is_ThisElementCurrent = function(oFootnote)
{
	if (oFootnote === this.CurFootnote && docpostype_Footnotes === this.LogicDocument.GetDocPosType())
		return true;

	return false;
};
CFootnotesController.prototype.OnContentReDraw = function(StartPageAbs, EndPageAbs)
{
	this.LogicDocument.OnContentReDraw(StartPageAbs, EndPageAbs);
};
/**
 * Проверяем пустая ли страница.
 * @param {number} nPageIndex
 * @returns {boolean}
 */
CFootnotesController.prototype.IsEmptyPage = function(nPageIndex)
{
	var oPage = this.Pages[nPageIndex];
	if (!oPage)
		return true;

	for (var nColumnIndex = 0, nColumnsCount = oPage.Columns.length; nColumnIndex < nColumnsCount; ++nColumnIndex)
	{
		if (true !== this.IsEmptyPageColumn(nPageIndex, nColumnIndex))
			return false;
	}

	return true;
};
CFootnotesController.prototype.IsEmptyPageColumn = function(nPageIndex, nColumnIndex)
{
	var oColumn = this.private_GetPageColumn(nPageIndex, nColumnIndex);
	if (!oColumn || oColumn.Elements.length <= 0)
		return true;

	return false;
};
CFootnotesController.prototype.Refresh_RecalcData = function(Data)
{
};
CFootnotesController.prototype.Refresh_RecalcData2 = function(nRelPageIndex)
{
	var nAbsPageIndex = nRelPageIndex;
	if (this.LogicDocument.Pages[nAbsPageIndex])
	{
		var nIndex = this.LogicDocument.Pages[nAbsPageIndex].Pos;

		if (nIndex >= this.LogicDocument.Content.length)
		{
			History.RecalcData_Add({
				Type    : AscDFH.historyitem_recalctype_NotesEnd,
				PageNum : nAbsPageIndex
			});
		}
		else
		{
			this.LogicDocument.Refresh_RecalcData2(nIndex, nAbsPageIndex);
		}
	}
};
CFootnotesController.prototype.Get_PageContentStartPos = function(nPageAbs, nColumnAbs)
{
	var oColumn = this.private_GetPageColumn(nPageAbs, nColumnAbs);
	if (!oColumn)
		return {X : 0, Y : 0, XLimit : 0, YLimit : 0};

	return {X : oColumn.X, Y : oColumn.Height, XLimit : oColumn.XLimit, YLimit : oColumn.YLimit - oColumn.Y};
};
CFootnotesController.prototype.GetCurFootnote = function()
{
	return this.CurFootnote;
};
CFootnotesController.prototype.IsInDrawing = function(X, Y, PageAbs)
{
	var oResult = this.private_GetFootnoteByXY(X, Y, PageAbs);
	if (oResult)
	{
		var oFootnote = oResult.Footnote;
		return oFootnote.IsInDrawing(X, Y, oResult.FootnotePageIndex);
	}

	return false;
};
CFootnotesController.prototype.IsTableBorder = function(X, Y, PageAbs)
{
	var oResult = this.private_GetFootnoteByXY(X, Y, PageAbs);
	if (oResult)
	{
		var oFootnote = oResult.Footnote;
		return oFootnote.IsTableBorder(X, Y, oResult.FootnotePageIndex);
	}

	return null;
};
CFootnotesController.prototype.IsInText = function(X, Y, PageAbs)
{
	var oResult = this.private_GetFootnoteByXY(X, Y, PageAbs);
	if (oResult)
	{
		var oFootnote = oResult.Footnote;
		return oFootnote.IsInText(X, Y, oResult.FootnotePageIndex);
	}

	return null;
};
CFootnotesController.prototype.GetNearestPos = function(X, Y, PageAbs, bAnchor, Drawing)
{
	var oResult = this.private_GetFootnoteByXY(X, Y, PageAbs);
	if (oResult)
	{
		var oFootnote = oResult.Footnote;
		return oFootnote.Get_NearestPos(oResult.FootnotePageIndex, X, Y, bAnchor, Drawing);
	}

	return null;
};
/**
 * Проверяем попадание в сноски на заданной странице.
 * @param X
 * @param Y
 * @param nPageAbs
 * @returns {boolean}
 */
CFootnotesController.prototype.CheckHitInFootnote = function(X, Y, nPageAbs)
{
	if (true === this.IsEmptyPage(nPageAbs))
		return false;

	var oPage   = this.Pages[nPageAbs];
	var oColumn = null;
	var nFindedColumnIndex = 0, nColumnsCount = oPage.Columns.length;
	for (var nColumnIndex = 0; nColumnIndex < nColumnsCount; ++nColumnIndex)
	{
		if (nColumnIndex < nColumnsCount - 1)
		{
			if (X < (oPage.Columns[nColumnIndex].XLimit + oPage.Columns[nColumnIndex + 1].X) / 2)
			{
				oColumn            = oPage.Columns[nColumnIndex];
				nFindedColumnIndex = nColumnIndex;
				break;
			}
		}
		else
		{
			oColumn            = oPage.Columns[nColumnIndex];
			nFindedColumnIndex = nColumnIndex;
		}
	}

	if (!oColumn || nFindedColumnIndex >= nColumnsCount)
		return false;

	for (var nIndex = 0, nCount = oColumn.Elements.length; nIndex < nCount; ++nIndex)
	{
		var oFootnote          = oColumn.Elements[nIndex];
		var nFootnotePageIndex = oFootnote.GetElementPageIndex(nPageAbs, nFindedColumnIndex);
		var oBounds            = oFootnote.Get_PageBounds(nFootnotePageIndex);

		if (oBounds.Top <= Y)
			return true;
	}

	return false;
};
CFootnotesController.prototype.GetAllParagraphs = function(Props, ParaArray)
{
	for (var sId in  this.Footnote)
	{
		var oFootnote = this.Footnote[sId];
		oFootnote.GetAllParagraphs(Props, ParaArray);
	}
};
CFootnotesController.prototype.StartSelection = function(X, Y, PageAbs, MouseEvent)
{
	if (true === this.Selection.Use)
		this.RemoveSelection();

	var oResult = this.private_GetFootnoteByXY(X, Y, PageAbs);
	if (null === oResult)
	{
		// BAD
		this.Selection.Use = false;
		return;
	}

	this.Selection.Use   = true;
	this.Selection.Start = oResult;
	this.Selection.End   = oResult;

	this.Selection.Start.Footnote.Selection_SetStart(X, Y, this.Selection.Start.FootnotePageIndex, MouseEvent);

	this.CurFootnote = this.Selection.Start.Footnote;

	this.Selection.Footnotes = {};
	this.Selection.Footnotes[this.Selection.Start.Footnote.Get_Id()] = this.Selection.Start.Footnote;
	this.Selection.Direction = 0;
};
CFootnotesController.prototype.EndSelection = function(X, Y, PageAbs, MouseEvent)
{
	if (true === this.IsMovingTableBorder())
	{
		this.CurFootnote.Selection_SetEnd(X, Y, PageAbs, MouseEvent);
		return;
	}

	var oResult = this.private_GetFootnoteByXY(X, Y, PageAbs);
	if (null === oResult)
	{
		// BAD
		this.Selection.Use = false;
		return;
	}

	this.Selection.End = oResult;
	this.CurFootnote = this.Selection.End.Footnote;

	var sStartId = this.Selection.Start.Footnote.Get_Id();
	var sEndId   = this.Selection.End.Footnote.Get_Id();

	// Очищаем старый селект везде кроме начальной сноски
	for (var sFootnoteId in this.Selection.Footnotes)
	{
		if (sFootnoteId !== sStartId)
			this.Selection.Footnotes[sFootnoteId].RemoveSelection();
	}

	// Новый селект
	if (this.Selection.Start.Footnote !== this.Selection.End.Footnote)
	{
		if (this.Selection.Start.Page > this.Selection.End.Page
			|| (this.Selection.Start.Page === this.Selection.End.Page
			&& (this.Selection.Start.Column > this.Selection.End.Column
			|| (this.Selection.Start.Column === this.Selection.End.Column
			&& this.Selection.Start.Index > this.Selection.End.Index))))
		{
			this.Selection.Start.Footnote.Selection_SetEnd(-MEASUREMENT_MAX_MM_VALUE, -MEASUREMENT_MAX_MM_VALUE, 0, MouseEvent);
			this.Selection.End.Footnote.Selection_SetStart(MEASUREMENT_MAX_MM_VALUE, MEASUREMENT_MAX_MM_VALUE, this.Selection.End.Footnote.Pages.length - 1, MouseEvent);
			this.Selection.Direction = -1;
		}
		else
		{
			this.Selection.Start.Footnote.Selection_SetEnd(MEASUREMENT_MAX_MM_VALUE, MEASUREMENT_MAX_MM_VALUE, this.Selection.Start.Footnote.Pages.length - 1, MouseEvent);
			this.Selection.End.Footnote.Selection_SetStart(-MEASUREMENT_MAX_MM_VALUE, -MEASUREMENT_MAX_MM_VALUE, 0, MouseEvent);
			this.Selection.Direction = 1;
		}
		this.Selection.End.Footnote.Selection_SetEnd(X, Y, this.Selection.End.FootnotePageIndex, MouseEvent);

		var oRange = this.private_GetFootnotesRange(this.Selection.Start, this.Selection.End);
		for (var sFootnoteId in oRange)
		{
			if (sFootnoteId !== sStartId && sFootnoteId !== sEndId)
			{
				var oFootnote = oRange[sFootnoteId];
				oFootnote.SelectAll();
			}
		}
		this.Selection.Footnotes = oRange;
	}
	else
	{
		this.Selection.End.Footnote.Selection_SetEnd(X, Y, this.Selection.End.FootnotePageIndex, MouseEvent);
		this.Selection.Footnotes = {};
		this.Selection.Footnotes[this.Selection.Start.Footnote.Get_Id()] = this.Selection.Start.Footnote;
		this.Selection.Direction = 0;
	}
};
CFootnotesController.prototype.Set_CurrentElement = function(bUpdateStates, PageAbs, oFootnote)
{
	if (oFootnote instanceof CFootEndnote)
	{
		if (oFootnote.IsSelectionUse())
		{
			this.CurFootnote              = oFootnote;
			this.Selection.Use            = true;
			this.Selection.Direction      = 0;
			this.Selection.Start.Footnote = oFootnote;
			this.Selection.End.Footnote   = oFootnote;
			this.Selection.Footnotes      = {};

			this.Selection.Footnotes[oFootnote.Get_Id()] = oFootnote;
			this.LogicDocument.Selection.Use   = true;
			this.LogicDocument.Selection.Start = false;
		}
		else
		{
			this.private_SetCurrentFootnoteNoSelection(oFootnote);
			this.LogicDocument.Selection.Use   = false;
			this.LogicDocument.Selection.Start = false;
		}

		var bNeedRedraw = this.LogicDocument.GetDocPosType() === docpostype_HdrFtr;
		this.LogicDocument.SetDocPosType(docpostype_Footnotes);

		if (false != bUpdateStates)
		{
			this.LogicDocument.Document_UpdateInterfaceState();
			this.LogicDocument.Document_UpdateRulersState();
			this.LogicDocument.Document_UpdateSelectionState();
		}

		if (bNeedRedraw)
		{
			this.LogicDocument.DrawingDocument.ClearCachePages();
			this.LogicDocument.DrawingDocument.FirePaint();
		}
	}
};
CFootnotesController.prototype.AddFootnoteRef = function()
{
	if (true !== this.private_IsOnFootnoteSelected() || null === this.CurFootnote)
		return;

	var oFootnote  = this.CurFootnote;
	var oParagraph = oFootnote.Get_FirstParagraph();
	if (!oParagraph)
		return;

	var oStyles = this.LogicDocument.Get_Styles();

	var oRun = new ParaRun(oParagraph, false);
	oRun.Add_ToContent(0, new ParaFootnoteRef(oFootnote), false);
	oRun.Set_RStyle(oStyles.GetDefaultFootnoteReference());
	oParagraph.Add_ToContent(0, oRun);
};
CFootnotesController.prototype.GotoPage = function(nPageAbs)
{
	var oColumn = this.private_GetPageColumn(nPageAbs, 0);
	if (!oColumn || oColumn.Elements.length <= 0)
		return;

	var oFootnote = oColumn.Elements[0];
	this.private_SetCurrentFootnoteNoSelection(oFootnote);
	oFootnote.MoveCursorToStartPos(false);
};
CFootnotesController.prototype.CheckTableCoincidence = function(oTable)
{
	return false;
};
CFootnotesController.prototype.GotoNextFootnote = function()
{
	var oNextFootnote = this.private_GetNextFootnote(this.CurFootnote);
	if (oNextFootnote)
	{
		oNextFootnote.MoveCursorToStartPos(false);
		this.private_SetCurrentFootnoteNoSelection(oNextFootnote);
	}
};
CFootnotesController.prototype.GotoPrevFootnote = function()
{
	var oPrevFootnote = this.private_GetPrevFootnote(this.CurFootnote);
	if (oPrevFootnote)
	{
		oPrevFootnote.MoveCursorToStartPos(false);
		this.private_SetCurrentFootnoteNoSelection(oPrevFootnote);
	}
};
CFootnotesController.prototype.GetNumberingInfo = function(oPara, oNumPr, oFootnote)
{
	var arrFootnotes     = this.LogicDocument.GetFootnotesList(null, oFootnote);
	var oNumberingEngine = new CDocumentNumberingInfoEngine(oPara, oNumPr, this.Get_Numbering());
	for (var nIndex = 0, nCount = arrFootnotes.length; nIndex < nCount; ++nIndex)
	{
		arrFootnotes[nIndex].GetNumberingInfo(oNumberingEngine, oPara, oNumPr);
	}
	return oNumberingEngine.GetNumInfo();
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private area
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
CFootnotesController.prototype.private_GetPageColumn = function(nPageAbs, nColumnAbs)
{
	var oPage = this.Pages[nPageAbs];
	if (!oPage)
		return null;

	var oColumn = oPage.Columns[nColumnAbs];
	if (!oColumn)
		return null;

	return oColumn;
};
CFootnotesController.prototype.private_GetFootnoteOnPageByXY = function(X, Y, nPageAbs)
{
	if (true === this.IsEmptyPage(nPageAbs))
		return null;

	var oPage   = this.Pages[nPageAbs];
	var oColumn = null;
	var nColumnIndex = 0;
	for (var nColumnsCount = oPage.Columns.length; nColumnIndex < nColumnsCount; ++nColumnIndex)
	{
		if (nColumnIndex < nColumnsCount - 1)
		{
			if (X < (oPage.Columns[nColumnIndex].XLimit + oPage.Columns[nColumnIndex + 1].X) / 2)
			{
				oColumn = oPage.Columns[nColumnIndex];
				break;
			}
		}
		else
		{
			oColumn = oPage.Columns[nColumnIndex];
			break;
		}
	}

	if (!oColumn)
		return null;

	if (oColumn.Elements.length <= 0)
	{
		var nCurColumnIndex = nColumnIndex - 1;
		while (nCurColumnIndex >= 0)
		{
			if (oPage.Columns[nCurColumnIndex].Elements.length > 0)
			{
				oColumn      = oPage.Columns[nCurColumnIndex];
				nColumnIndex = nCurColumnIndex;
				break;
			}
			nCurColumnIndex--;
		}

		if (nCurColumnIndex < 0)
		{
			nCurColumnIndex = nColumnIndex + 1;
			while (nCurColumnIndex <= oPage.Columns.length - 1)
			{
				if (oPage.Columns[nCurColumnIndex].Elements.length > 0)
				{
					oColumn      = oPage.Columns[nCurColumnIndex];
					nColumnIndex = nCurColumnIndex;
					break;
				}
				nCurColumnIndex++;
			}
		}
	}

	if (!oColumn)
		return null;

	for (var nIndex = oColumn.Elements.length - 1; nIndex >= 0; --nIndex)
	{
		var oFootnote = oColumn.Elements[nIndex];

		var nElementPageIndex = oFootnote.GetElementPageIndex(nPageAbs, nColumnIndex);
		var oBounds           = oFootnote.Get_PageBounds(nElementPageIndex);

		if (oBounds.Top <= Y || 0 === nIndex)
			return {
				Footnote          : oFootnote,
				Index             : nIndex,
				Page              : nPageAbs,
				Column            : nColumnIndex,
				FootnotePageIndex : nElementPageIndex
			};
	}

	return null;
};
CFootnotesController.prototype.private_GetFootnoteByXY = function(X, Y, PageAbs)
{
	var oResult = this.private_GetFootnoteOnPageByXY(X, Y, PageAbs);
	if (null !== oResult)
		return oResult;

	var nCurPage = PageAbs - 1;
	while (nCurPage >= 0)
	{
		oResult = this.private_GetFootnoteOnPageByXY(MEASUREMENT_MAX_MM_VALUE, MEASUREMENT_MAX_MM_VALUE, nCurPage);
		if (null !== oResult)
			return oResult;

		nCurPage--;
	}

	nCurPage = PageAbs + 1;
	while (nCurPage < this.Pages.length)
	{
		oResult = this.private_GetFootnoteOnPageByXY(-MEASUREMENT_MAX_MM_VALUE, -MEASUREMENT_MAX_MM_VALUE, nCurPage);
		if (null !== oResult)
			return oResult;

		nCurPage++;
	}

	return null;
};
CFootnotesController.prototype.private_GetFootnotesRange = function(Start, End)
{
	var oResult = {};
	if (Start.Page > End.Page || (Start.Page === End.Page && Start.Column > End.Column) || (Start.Page === End.Page && Start.Column === End.Column && Start.Index > End.Index))
	{
		var Temp = Start;
		Start    = End;
		End      = Temp;
	}

	if (Start.Page === End.Page)
	{
		this.private_GetFootnotesOnPage(Start.Page, Start.Column, End.Column, Start.Index, End.Index, oResult);
	}
	else
	{
		this.private_GetFootnotesOnPage(Start.Page, Start.Column, -1, Start.Index, -1, oResult);

		for (var CurPage = Start.Page + 1; CurPage <= End.Page - 1; ++CurPage)
		{
			this.private_GetFootnotesOnPage(CurPage, -1, -1, -1, -1, oResult);
		}

		this.private_GetFootnotesOnPage(End.Page, -1, End.Column, -1, End.Index, oResult);
	}

	return oResult;
};
CFootnotesController.prototype.private_GetFootnotesOnPage = function(nPageAbs, nColumnStart, nColumnEnd, nStartIndex, nEndIndex, oFootnotes)
{
	var oPage = this.Pages[nPageAbs];
	if (!oPage)
		return;

	var _nColumnStart = -1 === nColumnStart ? 0 : nColumnStart;
	var _nColumnEnd   = -1 === nColumnEnd ? oPage.Columns.length - 1 : nColumnEnd;

	var _nStartIndex  = -1 === nColumnStart || -1 === nStartIndex ? 0 : nStartIndex;
	var _nEndIndex    = -1 === nColumnEnd || -1 === nEndIndex ? oPage.Columns[_nColumnEnd].Elements.length - 1 : nEndIndex;

	for (var nColIndex = _nColumnStart; nColIndex <= _nColumnEnd; ++nColIndex)
	{
		var nSIndex = nColIndex === _nColumnStart ? _nStartIndex : 0;
		var nEIndex = nColIndex === _nColumnEnd ? _nEndIndex : oPage.Columns[nColIndex].Elements.length - 1;

		this.private_GetFootnotesOnPageColumn(nPageAbs, nColIndex, nSIndex, nEIndex, oFootnotes);
	}
};
CFootnotesController.prototype.private_GetFootnotesOnPageColumn = function(nPageAbs, nColumnAbs, StartIndex, EndIndex, oFootnotes)
{
	var oColumn = this.private_GetPageColumn(nPageAbs, nColumnAbs);

	var _StartIndex = -1 === StartIndex ? 0 : StartIndex;
	var _EndIndex   = -1 === EndIndex ? oColumn.Elements.length - 1 : EndIndex;

	for (var nIndex = _StartIndex; nIndex <= _EndIndex; ++nIndex)
	{
		var oFootnote = oColumn.Elements[nIndex];
		oFootnotes[oFootnote.Get_Id()] = oFootnote;
	}
};
CFootnotesController.prototype.private_OnNotValidActionForFootnotes = function()
{
	// Пока ничего не делаем, если надо будет выдавать сообщение, то обработать нужно будет здесь.
};
CFootnotesController.prototype.private_IsOnFootnoteSelected = function()
{
	return (0 !== this.Selection.Direction ? false : true);
};
CFootnotesController.prototype.private_CheckFootnotesSelectionBeforeAction = function()
{
	if (true !== this.private_IsOnFootnoteSelected() || null === this.CurFootnote)
	{
		this.private_OnNotValidActionForFootnotes();
		return false;
	}

	return true;
};
CFootnotesController.prototype.private_SetCurrentFootnoteNoSelection = function(oFootnote)
{
	this.Selection.Use            = false;
	this.CurFootnote              = oFootnote;
	this.Selection.Start.Footnote = oFootnote;
	this.Selection.End.Footnote   = oFootnote;
	this.Selection.Direction      = 0;

	this.Selection.Footnotes                     = {};
	this.Selection.Footnotes[oFootnote.Get_Id()] = oFootnote;
};
CFootnotesController.prototype.private_GetPrevFootnote = function(oFootnote)
{
	if (!oFootnote)
		return null;

	var arrList = this.LogicDocument.GetFootnotesList(null, oFootnote);
	if (!arrList || arrList.length <= 1 || arrList[arrList.length - 1] !== oFootnote)
		return null;

	return arrList[arrList.length - 2];
};
CFootnotesController.prototype.private_GetNextFootnote = function(oFootnote)
{
	if (!oFootnote)
		return null;

	var arrList = this.LogicDocument.GetFootnotesList(oFootnote, null);
	if (!arrList || arrList.length <= 1 || arrList[0] !== oFootnote)
		return null;

	return arrList[1];
};
CFootnotesController.prototype.private_GetDirection = function(oFootnote1, oFootnote2)
{
	// Предполагается, что эти сноски обязательно есть в документе
	if (oFootnote1 == oFootnote2)
		return 0;

	var arrList = this.LogicDocument.GetFootnotesList(null, null);

	for (var nPos = 0, nCount = arrList.length; nPos < nCount; ++nPos)
	{
		if (oFootnote1 === arrList[nPos])
			return 1;
		else if (oFootnote2 === arrList[nPos])
			return -1;
	}

	return 0;
};
CFootnotesController.prototype.private_GetFootnotesLogicRange = function(oFootnote1, oFootnote2)
{
	return this.LogicDocument.GetFootnotesList(oFootnote1, oFootnote2);
};
CFootnotesController.prototype.private_GetSelectionArray = function()
{
	if (true !== this.Selection.Use || 0 === this.Selection.Direction)
		return [this.CurFootnote];

	if (1 === this.Selection.Direction)
		return this.private_GetFootnotesLogicRange(this.Selection.Start.Footnote, this.Selection.End.Footnote);
	else
		return this.private_GetFootnotesLogicRange(this.Selection.End.Footnote, this.Selection.Start.Footnote);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Controller area
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
CFootnotesController.prototype.CanUpdateTarget = function()
{
	return true;
};
CFootnotesController.prototype.RecalculateCurPos = function(bUpdateX, bUpdateY)
{
	if (null !== this.CurFootnote)
		return this.CurFootnote.RecalculateCurPos(bUpdateX, bUpdateY);

	return {X : 0, Y : 0, Height : 0, PageNum : 0, Internal : {Line : 0, Page : 0, Range : 0}, Transform : null};
};
CFootnotesController.prototype.GetCurPage = function()
{
	if (null !== this.CurFootnote)
		return this.CurFootnote.Get_StartPage_Absolute();

	return -1;
};
CFootnotesController.prototype.AddNewParagraph = function(bRecalculate, bForceAdd)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return false;

	return this.CurFootnote.AddNewParagraph(bRecalculate, bForceAdd);
};
CFootnotesController.prototype.AddInlineImage = function(nW, nH, oImage, oChart, bFlow)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return false;

	return this.CurFootnote.AddInlineImage(nW, nH, oImage, oChart, bFlow);
};
CFootnotesController.prototype.AddImages = function(aImages)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return false;

	return this.CurFootnote.AddImages(aImages);
};
CFootnotesController.prototype.AddSignatureLine = function(oSignatureDrawing)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return false;

	return this.CurFootnote.AddSignatureLine(oSignatureDrawing);
};
CFootnotesController.prototype.AddOleObject = function(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return false;

	return this.CurFootnote.AddOleObject(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId);
};
CFootnotesController.prototype.EditChart = function(Chart)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return;

	this.CurFootnote.EditChart(Chart);
};
CFootnotesController.prototype.AddInlineTable = function(nCols, nRows, nMode)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return null;

	if (null !== this.CurFootnote)
		return this.CurFootnote.AddInlineTable(nCols, nRows, nMode);

	return null;
};
CFootnotesController.prototype.ClearParagraphFormatting = function(isClearParaPr, isClearTextPr)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.ClearParagraphFormatting(isClearParaPr, isClearTextPr);
	}
};
CFootnotesController.prototype.AddToParagraph = function(oItem, bRecalculate)
{
	if (para_NewLine === oItem.Type && true === oItem.IsPageOrColumnBreak())
		return;

	if (oItem instanceof ParaTextPr)
	{
		for (var sId in this.Selection.Footnotes)
		{
			var oFootnote = this.Selection.Footnotes[sId];
			oFootnote.AddToParagraph(oItem, false);
		}

		if (false !== bRecalculate)
		{
			this.LogicDocument.Recalculate();
		}
	}
	else
	{
		if (false === this.private_CheckFootnotesSelectionBeforeAction())
			return;

		if (null !== this.CurFootnote)
			this.CurFootnote.AddToParagraph(oItem, bRecalculate);
	}
};
CFootnotesController.prototype.Remove = function(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return;

	this.CurFootnote.Remove(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord);
};
CFootnotesController.prototype.GetCursorPosXY = function()
{
	// Если есть селект, тогда конец селекта совпадает с CurFootnote
	if (null !== this.CurFootnote)
		return this.CurFootnote.GetCursorPosXY();

	return {X : 0, Y : 0}
};
CFootnotesController.prototype.MoveCursorToStartPos = function(AddToSelect)
{
	if (true !== AddToSelect)
	{
		this.LogicDocument.controller_MoveCursorToStartPos(false);
	}
	else
	{
		var oFootnote = this.CurFootnote;
		if (true === this.Selection.Use)
			oFootnote = this.Selection.Start.Footnote;

		var arrRange = this.LogicDocument.GetFootnotesList(null, oFootnote);
		if (arrRange.length <= 0)
			return;

		if (true !== this.Selection.Use)
			this.LogicDocument.StartSelectionFromCurPos();

		this.Selection.End.Footnote   = arrRange[0];
		this.Selection.Start.Footnote = oFootnote;
		this.Selection.Footnotes      = {};

		oFootnote.MoveCursorToStartPos(true);
		this.Selection.Footnotes = {};
		this.Selection.Footnotes[oFootnote.Get_Id()]  = oFootnote;
		for (var nIndex = 0, nCount = arrRange.length; nIndex < nCount; ++nIndex)
		{
			var oTempFootnote = arrRange[nIndex];
			if (oTempFootnote !== oFootnote)
			{
				oTempFootnote.SelectAll(-1);
				this.Selection.Footnotes[oTempFootnote.Get_Id()] = oTempFootnote;
			}
		}

		if (this.Selection.Start.Footnote !== this.Selection.End.Footnote)
			this.Selection.Direction = -1;
		else
			this.Selection.Direction = 0;
	}
};
CFootnotesController.prototype.MoveCursorToEndPos = function(AddToSelect)
{
	if (true !== AddToSelect)
	{
		this.LogicDocument.controller_MoveCursorToEndPos(false);
	}
	else
	{
		var oFootnote = this.CurFootnote;
		if (true === this.Selection.Use)
			oFootnote = this.Selection.Start.Footnote;

		var arrRange = this.LogicDocument.GetFootnotesList(oFootnote, null);
		if (arrRange.length <= 0)
			return;

		if (true !== this.Selection.Use)
			this.LogicDocument.StartSelectionFromCurPos();

		this.Selection.End.Footnote   = arrRange[arrRange.length - 1];
		this.Selection.Start.Footnote = oFootnote;
		this.Selection.Footnotes      = {};

		oFootnote.MoveCursorToEndPos(true);
		this.Selection.Footnotes = {};
		this.Selection.Footnotes[oFootnote.Get_Id()]  = oFootnote;
		for (var nIndex = 0, nCount = arrRange.length; nIndex < nCount; ++nIndex)
		{
			var oTempFootnote = arrRange[nIndex];
			if (oTempFootnote !== oFootnote)
			{
				oTempFootnote.SelectAll(1);
				this.Selection.Footnotes[oTempFootnote.Get_Id()] = oTempFootnote;
			}
		}

		if (this.Selection.Start.Footnote !== this.Selection.End.Footnote)
			this.Selection.Direction = 1;
		else
			this.Selection.Direction = 0;
	}
};
CFootnotesController.prototype.MoveCursorLeft = function(AddToSelect, Word)
{
	if (true === this.Selection.Use)
	{
		if (true !== AddToSelect)
		{
			var oFootnote = this.CurFootnote;
			if (0 === this.Selection.Direction)
				oFootnote = this.CurFootnote;
			else if (1 === this.Selection.Direction)
				oFootnote = this.Selection.Start.Footnote;
			else
				oFootnote = this.Selection.End.Footnote;

			for (var sId in this.Selection.Footnotes)
			{
				if (oFootnote !== this.Selection.Footnotes[sId])
					this.Selection.Footnotes[sId].RemoveSelection();
			}

			oFootnote.MoveCursorLeft(false, Word);
			oFootnote.RemoveSelection();
			this.private_SetCurrentFootnoteNoSelection(oFootnote);
		}
		else
		{
			var oFootnote = this.Selection.End.Footnote;
			if (false === oFootnote.MoveCursorLeft(true, Word))
			{
				var oPrevFootnote = this.private_GetPrevFootnote(oFootnote);
				if (null === oPrevFootnote)
					return false;

				if (1 !== this.Selection.Direction)
				{
					this.Selection.End.Footnote = oPrevFootnote;
					this.Selection.Direction    = -1;
					this.CurFootnote            = oPrevFootnote;

					this.Selection.Footnotes[oPrevFootnote.Get_Id()] = oPrevFootnote;

					oPrevFootnote.MoveCursorToEndPos(false, true);
					oPrevFootnote.MoveCursorLeft(true, Word);
				}
				else
				{
					this.Selection.End.Footnote = oPrevFootnote;
					this.CurFootnote            = oPrevFootnote;

					if (oPrevFootnote === this.Selection.Start.Footnote)
						this.Selection.Direction = 0;

					oFootnote.RemoveSelection();
					delete this.Selection.Footnotes[oFootnote.Get_Id()];

					oPrevFootnote.MoveCursorLeft(true, Word);
				}
			}
		}
	}
	else
	{
		if (true === AddToSelect)
		{
			var oFootnote = this.CurFootnote;

			this.Selection.Use            = true;
			this.Selection.Start.Footnote = oFootnote;
			this.Selection.End.Footnote   = oFootnote;
			this.Selection.Footnotes      = {};
			this.Selection.Direction      = 0;

			this.Selection.Footnotes[oFootnote.Get_Id()] = oFootnote;
			if (false === oFootnote.MoveCursorLeft(true, Word))
			{
				var oPrevFootnote = this.private_GetPrevFootnote(oFootnote);
				if (null === oPrevFootnote)
					return false;

				this.Selection.End.Footnote = oPrevFootnote;
				this.Selection.Direction    = -1;
				this.CurFootnote            = oPrevFootnote;

				this.Selection.Footnotes[oPrevFootnote.Get_Id()] = oPrevFootnote;

				oPrevFootnote.MoveCursorToEndPos(false, true);
				oPrevFootnote.MoveCursorLeft(true, Word);
			}
		}
		else
		{
			var oFootnote = this.CurFootnote;
			if (false === oFootnote.MoveCursorLeft(false, Word))
			{
				var oPrevFootnote = this.private_GetPrevFootnote(oFootnote);
				if (null === oPrevFootnote)
					return false;

				this.Selection.Start.Footnote = oPrevFootnote;
				this.Selection.End.Footnote   = oPrevFootnote;
				this.Selection.Direction      = 0;
				this.CurFootnote              = oPrevFootnote;
				this.Selection.Footnotes      = {};

				this.Selection.Footnotes[oPrevFootnote.Get_Id()] = oPrevFootnote;

				oPrevFootnote.MoveCursorToEndPos(false);
			}
		}
	}

	return true;
};
CFootnotesController.prototype.MoveCursorRight = function(AddToSelect, Word, FromPaste)
{
	if (true === this.Selection.Use)
	{
		if (true !== AddToSelect)
		{
			var oFootnote = this.CurFootnote;
			if (0 === this.Selection.Direction)
				oFootnote = this.CurFootnote;
			else if (1 === this.Selection.Direction)
				oFootnote = this.Selection.End.Footnote;
			else
				oFootnote = this.Selection.Start.Footnote;

			for (var sId in this.Selection.Footnotes)
			{
				if (oFootnote !== this.Selection.Footnotes[sId])
					this.Selection.Footnotes[sId].RemoveSelection();
			}

			oFootnote.MoveCursorRight(false, Word, FromPaste);
			oFootnote.RemoveSelection();
			this.private_SetCurrentFootnoteNoSelection(oFootnote);
		}
		else
		{
			var oFootnote = this.Selection.End.Footnote;
			if (false === oFootnote.MoveCursorRight(true, Word, FromPaste))
			{
				var oNextFootnote = this.private_GetNextFootnote(oFootnote);
				if (null === oNextFootnote)
					return false;

				if (-1 !== this.Selection.Direction)
				{
					this.Selection.End.Footnote = oNextFootnote;
					this.Selection.Direction    = 1;
					this.CurFootnote            = oNextFootnote;

					this.Selection.Footnotes[oNextFootnote.Get_Id()] = oNextFootnote;

					oNextFootnote.MoveCursorToStartPos(false);
					oNextFootnote.MoveCursorRight(true, Word, FromPaste);
				}
				else
				{
					this.Selection.End.Footnote = oNextFootnote;
					this.CurFootnote            = oNextFootnote;

					if (oNextFootnote === this.Selection.Start.Footnote)
						this.Selection.Direction = 0;

					oFootnote.RemoveSelection();
					delete this.Selection.Footnotes[oFootnote.Get_Id()];

					oNextFootnote.MoveCursorRight(true, Word, FromPaste);
				}
			}
		}
	}
	else
	{
		if (true === AddToSelect)
		{
			var oFootnote = this.CurFootnote;

			this.Selection.Use            = true;
			this.Selection.Start.Footnote = oFootnote;
			this.Selection.End.Footnote   = oFootnote;
			this.Selection.Footnotes      = {};
			this.Selection.Direction      = 0;

			this.Selection.Footnotes[oFootnote.Get_Id()] = oFootnote;
			if (false === oFootnote.MoveCursorRight(true, Word, FromPaste))
			{
				var oNextFootnote = this.private_GetNextFootnote(oFootnote);
				if (null === oNextFootnote)
					return false;

				this.Selection.End.Footnote = oNextFootnote;
				this.Selection.Direction    = 1;
				this.CurFootnote            = oNextFootnote;

				this.Selection.Footnotes[oNextFootnote.Get_Id()] = oNextFootnote;

				oNextFootnote.MoveCursorToStartPos(false);
				oNextFootnote.MoveCursorRight(true, Word, FromPaste);
			}
		}
		else
		{
			var oFootnote = this.CurFootnote;
			if (false === oFootnote.MoveCursorRight(false, Word ,FromPaste))
			{
				var oNextFootnote = this.private_GetNextFootnote(oFootnote);
				if (null === oNextFootnote)
					return false;

				this.Selection.Start.Footnote = oNextFootnote;
				this.Selection.End.Footnote   = oNextFootnote;
				this.Selection.Direction      = 0;
				this.CurFootnote              = oNextFootnote;
				this.Selection.Footnotes      = {};

				this.Selection.Footnotes[oNextFootnote.Get_Id()] = oNextFootnote;

				oNextFootnote.MoveCursorToStartPos(false);
			}
		}
	}

	return true;
};
CFootnotesController.prototype.MoveCursorUp = function(AddToSelect)
{
	if (true === this.Selection.Use)
	{
		if (true === AddToSelect)
		{
			var oFootnote = this.Selection.End.Footnote;
			var oPos = oFootnote.GetCursorPosXY();

			if (false === oFootnote.MoveCursorUp(true))
			{
				var oPrevFootnote = this.private_GetPrevFootnote(oFootnote);
				if (null === oPrevFootnote)
					return false;

				oFootnote.MoveCursorToStartPos(true);

				if (1 !== this.Selection.Direction)
				{
					this.Selection.End.Footnote = oPrevFootnote;
					this.Selection.Direction    = -1;
					this.CurFootnote            = oPrevFootnote;

					this.Selection.Footnotes[oPrevFootnote.Get_Id()] = oPrevFootnote;

					oPrevFootnote.MoveCursorUpToLastRow(oPos.X, oPos.Y, true);
				}
				else
				{
					this.Selection.End.Footnote = oPrevFootnote;
					this.CurFootnote            = oPrevFootnote;

					if (oPrevFootnote === this.Selection.Start.Footnote)
						this.Selection.Direction = 0;

					oFootnote.RemoveSelection();
					delete this.Selection.Footnotes[oFootnote.Get_Id()];

					oPrevFootnote.MoveCursorUpToLastRow(oPos.X, oPos.Y, true);
				}

			}
		}
		else
		{
			var oFootnote = this.CurFootnote;
			if (0 === this.Selection.Direction)
				oFootnote = this.CurFootnote;
			else if (1 === this.Selection.Direction)
				oFootnote = this.Selection.Start.Footnote;
			else
				oFootnote = this.Selection.End.Footnote;

			for (var sId in this.Selection.Footnotes)
			{
				if (oFootnote !== this.Selection.Footnotes[sId])
					this.Selection.Footnotes[sId].RemoveSelection();
			}

			oFootnote.MoveCursorLeft(false, false);
			oFootnote.RemoveSelection();
			this.private_SetCurrentFootnoteNoSelection(oFootnote);
		}
	}
	else
	{
		if (true === AddToSelect)
		{
			var oFootnote = this.CurFootnote;
			var oPos = oFootnote.GetCursorPosXY();
			
			this.Selection.Use            = true;
			this.Selection.Start.Footnote = oFootnote;
			this.Selection.End.Footnote   = oFootnote;
			this.Selection.Footnotes      = {};
			this.Selection.Direction      = 0;

			this.Selection.Footnotes[oFootnote.Get_Id()] = oFootnote;
			if (false === oFootnote.MoveCursorUp(true))
			{
				var oPrevFootnote = this.private_GetPrevFootnote(oFootnote);
				if (null === oPrevFootnote)
					return false;

				oFootnote.MoveCursorToStartPos(true);

				this.Selection.End.Footnote = oPrevFootnote;
				this.Selection.Direction    = -1;
				this.CurFootnote            = oPrevFootnote;

				this.Selection.Footnotes[oPrevFootnote.Get_Id()] = oPrevFootnote;

				oPrevFootnote.MoveCursorUpToLastRow(oPos.X, oPos.Y, true);
			}
		}
		else
		{
			var oFootnote = this.CurFootnote;
			var oPos = oFootnote.GetCursorPosXY();
			if (false === oFootnote.MoveCursorUp(false))
			{
				var oPrevFootnote = this.private_GetPrevFootnote(oFootnote);
				if (null === oPrevFootnote)
					return false;

				this.Selection.Start.Footnote = oPrevFootnote;
				this.Selection.End.Footnote   = oPrevFootnote;
				this.Selection.Direction      = 0;
				this.CurFootnote              = oPrevFootnote;
				this.Selection.Footnotes      = {};

				this.Selection.Footnotes[oPrevFootnote.Get_Id()] = oPrevFootnote;

				oPrevFootnote.MoveCursorUpToLastRow(oPos.X, oPos.Y, false);
			}
		}
	}

	return true;
};
CFootnotesController.prototype.MoveCursorDown = function(AddToSelect)
{
	if (true === this.Selection.Use)
	{
		if (true === AddToSelect)
		{
			var oFootnote = this.Selection.End.Footnote;
			var oPos = oFootnote.GetCursorPosXY();

			if (false === oFootnote.MoveCursorDown(true))
			{
				var oNextFootnote = this.private_GetNextFootnote(oFootnote);
				if (null === oNextFootnote)
					return false;

				oFootnote.MoveCursorToEndPos(true);

				if (-1 !== this.Selection.Direction)
				{
					this.Selection.End.Footnote = oNextFootnote;
					this.Selection.Direction    = 1;
					this.CurFootnote            = oNextFootnote;

					this.Selection.Footnotes[oNextFootnote.Get_Id()] = oNextFootnote;

					oNextFootnote.MoveCursorDownToFirstRow(oPos.X, oPos.Y, true);
				}
				else
				{
					this.Selection.End.Footnote = oNextFootnote;
					this.CurFootnote            = oNextFootnote;

					if (oNextFootnote === this.Selection.Start.Footnote)
						this.Selection.Direction = 0;

					oFootnote.RemoveSelection();
					delete this.Selection.Footnotes[oFootnote.Get_Id()];

					oNextFootnote.MoveCursorDownToFirstRow(oPos.X, oPos.Y, true);
				}

			}
		}
		else
		{
			var oFootnote = this.CurFootnote;
			if (0 === this.Selection.Direction)
				oFootnote = this.CurFootnote;
			else if (1 === this.Selection.Direction)
				oFootnote = this.Selection.End.Footnote;
			else
				oFootnote = this.Selection.Start.Footnote;

			for (var sId in this.Selection.Footnotes)
			{
				if (oFootnote !== this.Selection.Footnotes[sId])
					this.Selection.Footnotes[sId].RemoveSelection();
			}

			oFootnote.MoveCursorRight(false, false);
			oFootnote.RemoveSelection();
			this.private_SetCurrentFootnoteNoSelection(oFootnote);
		}
	}
	else
	{
		if (true === AddToSelect)
		{
			var oFootnote = this.CurFootnote;
			var oPos = oFootnote.GetCursorPosXY();

			this.Selection.Use            = true;
			this.Selection.Start.Footnote = oFootnote;
			this.Selection.End.Footnote   = oFootnote;
			this.Selection.Footnotes      = {};
			this.Selection.Direction      = 0;

			this.Selection.Footnotes[oFootnote.Get_Id()] = oFootnote;
			if (false === oFootnote.MoveCursorDown(true))
			{
				var oNextFootnote = this.private_GetNextFootnote(oFootnote);
				if (null === oNextFootnote)
					return false;

				oFootnote.MoveCursorToEndPos(true, false);

				this.Selection.End.Footnote = oNextFootnote;
				this.Selection.Direction    = 1;
				this.CurFootnote            = oNextFootnote;

				this.Selection.Footnotes[oNextFootnote.Get_Id()] = oNextFootnote;

				oNextFootnote.MoveCursorDownToFirstRow(oPos.X, oPos.Y, true);
			}
		}
		else
		{
			var oFootnote = this.CurFootnote;
			var oPos = oFootnote.GetCursorPosXY();
			if (false === oFootnote.MoveCursorDown(false))
			{
				var oNextFootnote = this.private_GetNextFootnote(oFootnote);
				if (null === oNextFootnote)
					return false;

				this.Selection.Start.Footnote = oNextFootnote;
				this.Selection.End.Footnote   = oNextFootnote;
				this.Selection.Direction      = 0;
				this.CurFootnote              = oNextFootnote;
				this.Selection.Footnotes      = {};

				this.Selection.Footnotes[oNextFootnote.Get_Id()] = oNextFootnote;

				oNextFootnote.MoveCursorDownToFirstRow(oPos.X, oPos.Y, false);
			}
		}
	}

	return true;
};
CFootnotesController.prototype.MoveCursorToEndOfLine = function(AddToSelect)
{
	if (true === this.Selection.Use)
	{
		if (true === AddToSelect)
		{
			var oFootnote = this.Selection.End.Footnote;
			oFootnote.MoveCursorToEndOfLine(true);
		}
		else
		{
			var oFootonote = null;
			if (0 === this.Selection.Direction)
				oFootnote = this.CurFootnote;
			else if (1 === this.Selection.Direction)
				oFootnote = this.Selection.End.Footnote;
			else
				oFootnote = this.Selection.Start.Footnote;

			for (var sId in this.Selection.Footnotes)
			{
				if (oFootnote !== this.Selection.Footnotes[sId])
					this.Selection.Footnotes[sId].RemoveSelection();
			}

			oFootnote.MoveCursorToEndOfLine(false);
			oFootnote.RemoveSelection();
			this.private_SetCurrentFootnoteNoSelection(oFootnote);
		}
	}
	else
	{
		if (true === AddToSelect)
		{
			var oFootnote = this.CurFootnote;

			this.Selection.Use            = true;
			this.Selection.Start.Footnote = oFootnote;
			this.Selection.End.Footnote   = oFootnote;
			this.Selection.Footnotes      = {};
			this.Selection.Direction      = 0;

			this.Selection.Footnotes[oFootnote.Get_Id()] = oFootnote;
			oFootnote.MoveCursorToEndOfLine(true);
		}
		else
		{
			this.CurFootnote.MoveCursorToEndOfLine(false);
		}
	}

	return true;
};
CFootnotesController.prototype.MoveCursorToStartOfLine = function(AddToSelect)
{
	if (true === this.Selection.Use)
	{
		if (true === AddToSelect)
		{
			var oFootnote = this.Selection.End.Footnote;
			oFootnote.MoveCursorToStartOfLine(true);
		}
		else
		{
			var oFootonote = null;
			if (0 === this.Selection.Direction)
				oFootnote = this.CurFootnote;
			else if (1 === this.Selection.Direction)
				oFootnote = this.Selection.Start.Footnote;
			else
				oFootnote = this.Selection.End.Footnote;

			for (var sId in this.Selection.Footnotes)
			{
				if (oFootnote !== this.Selection.Footnotes[sId])
					this.Selection.Footnotes[sId].RemoveSelection();
			}

			oFootnote.MoveCursorToStartOfLine(false);
			oFootnote.RemoveSelection();
			this.private_SetCurrentFootnoteNoSelection(oFootnote);
		}
	}
	else
	{
		if (true === AddToSelect)
		{
			var oFootnote = this.CurFootnote;

			this.Selection.Use            = true;
			this.Selection.Start.Footnote = oFootnote;
			this.Selection.End.Footnote   = oFootnote;
			this.Selection.Footnotes      = {};
			this.Selection.Direction      = 0;

			this.Selection.Footnotes[oFootnote.Get_Id()] = oFootnote;
			oFootnote.MoveCursorToStartOfLine(true);
		}
		else
		{
			this.CurFootnote.MoveCursorToStartOfLine(false);
		}
	}

	return true;
};
CFootnotesController.prototype.MoveCursorToXY = function(X, Y, PageAbs, AddToSelect)
{
	var oResult = this.private_GetFootnoteByXY(X, Y, PageAbs);
	if (!oResult || !oResult.Footnote)
		return;

	var oFootnote = oResult.Footnote;
	var PageRel   = oResult.FootnotePageIndex;
	if (true === AddToSelect)
	{
		var StartFootnote = null;
		if (true === this.Selection.Use)
		{
			StartFootnote = this.Selection.Start.Footnote;
			for (var sId in this.Selection.Footnotes)
			{
				if (this.Selection.Footnotes[sId] !== StartFootnote)
				{
					this.Selection.Footnotes[sId].RemoveSelection();
				}
			}
		}
		else
		{
			StartFootnote = this.CurFootnote;
		}

		var nDirection = this.private_GetDirection(StartFootnote, oFootnote);
		if (0 === nDirection)
		{
			this.Selection.Use            = true;
			this.Selection.Start.Footnote = oFootnote;
			this.Selection.End.Footnote   = oFootnote;
			this.Selection.Footnotes      = {};
			this.Selection.Direction      = 0;

			this.Selection.Footnotes[oFootnote.Get_Id()] = oFootnote;
			oFootnote.MoveCursorToXY(X, Y, true, true, PageRel);
		}
		else if (nDirection > 0)
		{
			var arrFootnotes = this.private_GetFootnotesLogicRange(StartFootnote, oFootnote);
			if (arrFootnotes.length <= 1)
				return;

			var oStartFootnote = arrFootnotes[0]; // StartFootnote
			var oEndFootnote   = arrFootnotes[arrFootnotes.length - 1]; // oFootnote

			this.Selection.Use            = true;
			this.Selection.Start.Footnote = oStartFootnote;
			this.Selection.End.Footnote   = oEndFootnote;
			this.CurFootnote              = oEndFootnote;
			this.Selection.Footnotes      = {};
			this.Selection.Direction      = 1;

			oStartFootnote.MoveCursorToEndPos(true, false);

			for (var nPos = 0, nCount = arrFootnotes.length; nPos < nCount; ++nPos)
			{
				this.Selection.Footnotes[arrFootnotes[nPos].Get_Id()] = arrFootnotes[nPos];

				if (0 !== nPos && nPos !== nCount - 1)
					arrFootnotes[nPos].SelectAll(1);
			}

			oEndFootnote.MoveCursorToStartPos(false);
			oEndFootnote.MoveCursorToXY(X, Y, true, true, PageRel);
		}
		else if (nDirection < 0)
		{
			var arrFootnotes = this.private_GetFootnotesLogicRange(oFootnote, StartFootnote);
			if (arrFootnotes.length <= 1)
				return;

			var oEndFootnote   = arrFootnotes[0]; // oFootnote
			var oStartFootnote = arrFootnotes[arrFootnotes.length - 1]; // StartFootnote

			this.Selection.Use            = true;
			this.Selection.Start.Footnote = oStartFootnote;
			this.Selection.End.Footnote   = oEndFootnote;
			this.CurFootnote              = oEndFootnote;
			this.Selection.Footnotes      = {};
			this.Selection.Direction      = -1;

			oStartFootnote.MoveCursorToStartPos(true);

			for (var nPos = 0, nCount = arrFootnotes.length; nPos < nCount; ++nPos)
			{
				this.Selection.Footnotes[arrFootnotes[nPos].Get_Id()] = arrFootnotes[nPos];

				if (0 !== nPos && nPos !== nCount - 1)
					arrFootnotes[nPos].SelectAll(-1);
			}

			oEndFootnote.MoveCursorToEndPos(false, true);
			oEndFootnote.MoveCursorToXY(X, Y, true, true, PageRel);
		}
	}
	else
	{
		if (true === this.Selection.Use)
		{
			this.RemoveSelection();
		}

		this.private_SetCurrentFootnoteNoSelection(oFootnote);
		oFootnote.MoveCursorToXY(X, Y, false, true, PageRel);
	}
};
CFootnotesController.prototype.MoveCursorToCell = function(bNext)
{
	if (true !== this.private_IsOnFootnoteSelected() || null === this.CurFootnote)
		return false;

	return this.CurFootnote.MoveCursorToCell(bNext);
};
CFootnotesController.prototype.SetParagraphAlign = function(Align)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.SetParagraphAlign(Align);
	}
};
CFootnotesController.prototype.SetParagraphSpacing = function(Spacing)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.SetParagraphSpacing(Spacing);
	}
};
CFootnotesController.prototype.SetParagraphTabs = function(Tabs)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.SetParagraphTabs(Tabs);
	}
};
CFootnotesController.prototype.SetParagraphIndent = function(Ind)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.SetParagraphIndent(Ind);
	}
};
CFootnotesController.prototype.SetParagraphShd = function(Shd)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.SetParagraphShd(Shd);
	}
};
CFootnotesController.prototype.SetParagraphStyle = function(Name)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.SetParagraphStyle(Name);
	}
};
CFootnotesController.prototype.SetParagraphContextualSpacing = function(Value)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.SetParagraphContextualSpacing(Value);
	}
};
CFootnotesController.prototype.SetParagraphPageBreakBefore = function(Value)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.SetParagraphPageBreakBefore(Value);
	}
};
CFootnotesController.prototype.SetParagraphKeepLines = function(Value)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.SetParagraphKeepLines(Value);
	}
};
CFootnotesController.prototype.SetParagraphKeepNext = function(Value)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.SetParagraphKeepNext(Value);
	}
};
CFootnotesController.prototype.SetParagraphWidowControl = function(Value)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.SetParagraphWidowControl(Value);
	}
};
CFootnotesController.prototype.SetParagraphBorders = function(Borders)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.SetParagraphBorders(Borders);
	}
};
CFootnotesController.prototype.SetParagraphFramePr = function(FramePr, bDelete)
{
	// Не позволяем делать рамки внутри сносок
};
CFootnotesController.prototype.IncreaseDecreaseFontSize = function(bIncrease)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.IncreaseDecreaseFontSize(bIncrease);
	}
};
CFootnotesController.prototype.IncreaseDecreaseIndent = function(bIncrease)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.IncreaseDecreaseIndent(bIncrease);
	}
};
CFootnotesController.prototype.SetImageProps = function(Props)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return;

	return this.CurFootnote.SetImageProps(Props);
};
CFootnotesController.prototype.SetTableProps = function(Props)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return;

	return this.CurFootnote.SetTableProps(Props);
};
CFootnotesController.prototype.GetCalculatedParaPr = function()
{
	var StartPr = this.CurFootnote.GetCalculatedParaPr();
	var Pr = StartPr.Copy();

	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		var TempPr = oFootnote.GetCalculatedParaPr();
		Pr = Pr.Compare(TempPr);
	}

	if (undefined === Pr.Ind.Left)
		Pr.Ind.Left = StartPr.Ind.Left;

	if (undefined === Pr.Ind.Right)
		Pr.Ind.Right = StartPr.Ind.Right;

	if (undefined === Pr.Ind.FirstLine)
		Pr.Ind.FirstLine = StartPr.Ind.FirstLine;

	if (true !== this.private_IsOnFootnoteSelected())
		Pr.CanAddTable = false;

	return Pr;
};
CFootnotesController.prototype.GetCalculatedTextPr = function()
{
	var StartPr = this.CurFootnote.GetCalculatedTextPr();
	var Pr = StartPr.Copy();

	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		var TempPr = oFootnote.GetCalculatedTextPr();
		Pr = Pr.Compare(TempPr);
	}

	return Pr;
};
CFootnotesController.prototype.GetDirectParaPr = function()
{
	if (null !== this.CurFootnote)
		return this.CurFootnote.GetDirectParaPr();

	return new CParaPr();
};
CFootnotesController.prototype.GetDirectTextPr = function()
{
	if (null !== this.CurFootnote)
		return this.CurFootnote.GetDirectTextPr();

	return new CTextPr();
};
CFootnotesController.prototype.RemoveSelection = function(bNoCheckDrawing)
{
	if (true === this.Selection.Use)
	{
		for (var sId in this.Selection.Footnotes)
		{
			this.Selection.Footnotes[sId].RemoveSelection(bNoCheckDrawing);
		}

		this.Selection.Use = false;
	}

	this.Selection.Footnotes = {};
	if (this.CurFootnote)
		this.Selection.Footnotes[this.CurFootnote.Get_Id()] = this.CurFootnote;
};
CFootnotesController.prototype.IsSelectionEmpty = function(bCheckHidden)
{
	if (true !== this.IsSelectionUse())
		return true;

	var oFootnote = null;
	for (var sId in this.Selection.Footnotes)
	{
		if (null === oFootnote)
			oFootnote = this.Selection.Footnotes[sId];
		else if (oFootnote !== this.Selection.Footnotes[sId])
			return false;
	}

	if (null === oFootnote)
		return true;

	return oFootnote.IsSelectionEmpty(bCheckHidden);
};
CFootnotesController.prototype.DrawSelectionOnPage = function(nPageAbs)
{
	if (true !== this.Selection.Use || true === this.IsEmptyPage(nPageAbs))
		return;

	var oPage = this.Pages[nPageAbs];
	for (var nColumnIndex = 0, nColumnsCount = oPage.Columns.length; nColumnIndex < nColumnsCount; ++nColumnIndex)
	{
		var oColumn = oPage.Columns[nColumnIndex];
		for (var nIndex = 0, nCount = oColumn.Elements.length; nIndex < nCount; ++nIndex)
		{
			var oFootnote = oColumn.Elements[nIndex];
			if (oFootnote === this.Selection.Footnotes[oFootnote.Get_Id()])
			{
				var nFootnotePageIndex = oFootnote.GetElementPageIndex(nPageAbs, nColumnIndex);
				oFootnote.DrawSelectionOnPage(nFootnotePageIndex);
			}
		}
	}
};
CFootnotesController.prototype.GetSelectionBounds = function()
{
	if (true === this.Selection.Use)
	{
		if (0 === this.Selection.Direction)
		{
			return this.CurFootnote.GetSelectionBounds();
		}
		else if (1 === this.Selection.Direction)
		{
			var StartBounds = this.Selection.Start.Footnote.GetSelectionBounds();
			var EndBounds   = this.Selection.End.Footnote.GetSelectionBounds();

			if (!StartBounds && !EndBounds)
				return null;

			var Result       = {};
			Result.Start     = StartBounds ? StartBounds.Start : EndBounds.Start;
			Result.End       = EndBounds ? EndBounds.End : StartBounds.End;
			Result.Direction = 1;
			return Result;
		}
		else
		{
			var StartBounds = this.Selection.End.Footnote.GetSelectionBounds();
			var EndBounds   = this.Selection.Start.Footnote.GetSelectionBounds();

			if (!StartBounds && !EndBounds)
				return null;

			var Result       = {};
			Result.Start     = StartBounds ? StartBounds.Start : EndBounds.Start;
			Result.End       = EndBounds ? EndBounds.End : StartBounds.End;
			Result.Direction = -1;
			return Result;
		}
	}

	return null;
};
CFootnotesController.prototype.IsMovingTableBorder = function()
{
	if (true !== this.private_IsOnFootnoteSelected())
		return false;

	return this.CurFootnote.IsMovingTableBorder();
};
CFootnotesController.prototype.CheckPosInSelection = function(X, Y, PageAbs, NearPos)
{
	var oResult = this.private_GetFootnoteByXY(X, Y, PageAbs);
	if (oResult)
	{
		var oFootnote = oResult.Footnote;
		return oFootnote.CheckPosInSelection(X, Y, oResult.FootnotePageIndex, NearPos);
	}

	return false;
};
CFootnotesController.prototype.SelectAll = function(nDirection)
{
	var arrFootnotes = this.private_GetFootnotesLogicRange(null, null);
	if (!arrFootnotes || arrFootnotes.length <= 0)
		return;

	if (1 === arrFootnotes.length)
	{
		var oFootnote = arrFootnotes[0];

		this.Selection.Use            = true;
		this.Selection.Start.Footnote = oFootnote;
		this.Selection.End.Footnote   = oFootnote;
		this.CurFootnote              = oFootnote;
		this.Selection.Footnotes      = {};
		this.Selection.Direction      = 0;

		this.Selection.Footnotes[oFootnote.Get_Id()] = oFootnote;
		oFootnote.SelectAll(nDirection);
	}
	else
	{
		var StartFootnote, EndFootnote;
		if (nDirection < 0)
		{
			StartFootnote = arrFootnotes[arrFootnotes.length - 1];
			EndFootnote   = arrFootnotes[0];
			this.Selection.Direction = -1;
		}
		else
		{
			StartFootnote = arrFootnotes[0];
			EndFootnote   = arrFootnotes[arrFootnotes.length - 1];
			this.Selection.Direction = -1;
		}

		this.Selection.Use            = true;
		this.Selection.Start.Footnote = StartFootnote;
		this.Selection.End.Footnote   = EndFootnote;
		this.CurFootnote              = EndFootnote;
		this.Selection.Footnotes      = {};

		for (var nPos = 0, nCount = arrFootnotes.length; nPos < nCount; ++nPos)
		{
			var oFootnote = arrFootnotes[nPos];
			oFootnote.SelectAll(nDirection);
			this.Selection.Footnotes[oFootnote.Get_Id()] = oFootnote;
		}
	}
};
CFootnotesController.prototype.GetSelectedContent = function(SelectedContent)
{
	if (true !== this.Selection.Use)
		return;

	if (0 === this.Selection.Direction)
	{
		this.CurFootnote.GetSelectedContent(SelectedContent);
	}
	else
	{
		var arrFootnotes = this.private_GetSelectionArray();
		for (var nPos = 0, nCount = arrFootnotes.length; nPos < nCount; ++nPos)
		{
			arrFootnotes[nPos].GetSelectedContent(SelectedContent);
		}
	}
};
CFootnotesController.prototype.UpdateCursorType = function(X, Y, PageAbs, MouseEvent)
{
	var oResult = this.private_GetFootnoteByXY(X, Y, PageAbs);
	if (oResult)
	{
		var oFootnote = oResult.Footnote;
		oFootnote.UpdateCursorType(X, Y, oResult.FootnotePageIndex, MouseEvent);
	}
};
CFootnotesController.prototype.PasteFormatting = function(TextPr, ParaPr)
{
	for (var sId in this.Selection.Footnotes)
	{
		this.Selection.Footnotes[sId].PasteFormatting(TextPr, ParaPr, true);
	}
};
CFootnotesController.prototype.IsSelectionUse = function()
{
	return this.Selection.Use;
};
CFootnotesController.prototype.IsNumberingSelection = function()
{
	if (this.CurFootnote)
		return this.CurFootnote.IsNumberingSelection();

	return false;
};
CFootnotesController.prototype.IsTextSelectionUse = function()
{
	if (true !== this.Selection.Use)
		return false;

	if (0 === this.Selection.Direction)
		return this.CurFootnote.IsTextSelectionUse();

	return true;
};
CFootnotesController.prototype.GetCurPosXY = function()
{
	if (this.CurFootnote)
		return this.CurFootnote.GetCurPosXY();

	return {X : 0, Y : 0};
};
CFootnotesController.prototype.GetSelectedText = function(bClearText, oPr)
{
	if (true === bClearText)
	{
		if (true !== this.Selection.Use || 0 !== this.Selection.Direction)
			return "";

		return this.CurFootnote.GetSelectedText(true, oPr);
	}
	else
	{
		var sResult = "";
		var arrFootnotes = this.private_GetSelectionArray();
		for (var nPos = 0, nCount = arrFootnotes.length; nPos < nCount; ++nPos)
		{
			var sTempResult = arrFootnotes[nPos].GetSelectedText(false, oPr);
			if (null == sTempResult)
				return null;

			sResult += sTempResult;
		}

		return sResult;
	}
};
CFootnotesController.prototype.GetCurrentParagraph = function(bIgnoreSelection, arrSelectedParagraphs, oPr)
{
	return this.CurFootnote.GetCurrentParagraph(bIgnoreSelection, arrSelectedParagraphs, oPr);
};
CFootnotesController.prototype.GetSelectedElementsInfo = function(oInfo)
{
	if (true !== this.private_IsOnFootnoteSelected() || null === this.CurFootnote)
		oInfo.Set_MixedSelection();
	else
		this.CurFootnote.GetSelectedElementsInfo(oInfo);
};
CFootnotesController.prototype.AddTableRow = function(bBefore)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return;

	this.CurFootnote.AddTableRow(bBefore);
};
CFootnotesController.prototype.AddTableColumn = function(bBefore)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return;

	this.CurFootnote.AddTableColumn(bBefore);
};
CFootnotesController.prototype.RemoveTableRow = function()
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return;

	this.CurFootnote.RemoveTableRow();
};
CFootnotesController.prototype.RemoveTableColumn = function()
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return;

	this.CurFootnote.RemoveTableColumn();
};
CFootnotesController.prototype.MergeTableCells = function()
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return;

	this.CurFootnote.MergeTableCells();
};
CFootnotesController.prototype.SplitTableCells = function(Cols, Rows)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return;

	this.CurFootnote.SplitTableCells(Cols, Rows);
};
CFootnotesController.prototype.RemoveTableCells = function()
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return;

	this.CurFootnote.RemoveTableCells();
};
CFootnotesController.prototype.RemoveTable = function()
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return;

	this.CurFootnote.RemoveTable();
};
CFootnotesController.prototype.SelectTable = function(Type)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return;

	this.RemoveSelection();

	this.CurFootnote.SelectTable(Type);
	if (true === this.CurFootnote.IsSelectionUse())
	{
		this.Selection.Use            = true;
		this.Selection.Start.Footnote = this.CurFootnote;
		this.Selection.End.Footnote   = this.CurFootnote;
		this.Selection.Footnotes      = {};
		this.Selection.Direction      = 0;

		this.Selection.Footnotes[this.CurFootnote.Get_Id()] = this.CurFootnote;
	}
};
CFootnotesController.prototype.CanMergeTableCells = function()
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return false;

	return this.CurFootnote.CanMergeTableCells();
};
CFootnotesController.prototype.CanSplitTableCells = function()
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return false;

	return this.CurFootnote.CanSplitTableCells();
};
CFootnotesController.prototype.DistributeTableCells = function(isHorizontally)
{
	if (false === this.private_CheckFootnotesSelectionBeforeAction())
		return false;

	return this.CurFootnote.DistributeTableCells(isHorizontally);
};
CFootnotesController.prototype.UpdateInterfaceState = function()
{
	if (true === this.private_IsOnFootnoteSelected())
	{
		this.CurFootnote.Document_UpdateInterfaceState();
	}
	else
	{
		var Api = this.LogicDocument.Get_Api();
		if (!Api)
			return;

		var ParaPr = this.GetCalculatedParaPr();

		if (undefined != ParaPr.Tabs)
			Api.Update_ParaTab(AscCommonWord.Default_Tab_Stop, ParaPr.Tabs);

		Api.UpdateParagraphProp(ParaPr);
		Api.UpdateTextPr(this.GetCalculatedTextPr());
	}
};
CFootnotesController.prototype.UpdateRulersState = function()
{
	var nPageAbs = this.CurFootnote.Get_StartPage_Absolute();
	if (this.LogicDocument.Pages[nPageAbs])
	{
		var nPos    = this.LogicDocument.Pages[nPageAbs].Pos;
		var oSectPr = this.LogicDocument.SectionsInfo.Get_SectPr(nPos).SectPr;
		var oFrame  = oSectPr.GetContentFrame(nPageAbs);

		this.DrawingDocument.Set_RulerState_Paragraph({L : oFrame.Left, T : oFrame.Top, R : oFrame.Right, B : oFrame.Bottom}, true);
	}

	if (true === this.private_IsOnFootnoteSelected())
		this.CurFootnote.Document_UpdateRulersState();
};
CFootnotesController.prototype.UpdateSelectionState = function()
{
	if (true === this.Selection.Use)
	{
		if (true === this.IsMovingTableBorder())
		{
			this.DrawingDocument.TargetEnd();
			this.DrawingDocument.SetCurrentPage(this.LogicDocument.CurPage);
		}
		else if (false === this.IsSelectionEmpty())
		{
			if (true !== this.LogicDocument.Selection.Start)
			{
				this.LogicDocument.private_CheckCurPage();
				this.RecalculateCurPos();
			}

			this.LogicDocument.private_UpdateTracks(true, false);

			this.DrawingDocument.TargetEnd();
			this.DrawingDocument.SelectEnabled(true);
			this.DrawingDocument.SelectShow();
		}
		else
		{
			if (true !== this.LogicDocument.Selection.Start)
				this.LogicDocument.RemoveSelection();

			this.LogicDocument.private_CheckCurPage();
			this.RecalculateCurPos();
			this.LogicDocument.private_UpdateTracks(true, true);

			this.DrawingDocument.SelectEnabled(false);
			this.DrawingDocument.TargetStart();
			this.DrawingDocument.TargetShow();
		}
	}
	else
	{
		this.LogicDocument.RemoveSelection();
		this.LogicDocument.private_CheckCurPage();
		this.RecalculateCurPos();
		this.LogicDocument.private_UpdateTracks(false, false);

		this.DrawingDocument.SelectEnabled(false);
		this.DrawingDocument.TargetShow();
	}
};
CFootnotesController.prototype.GetSelectionState = function()
{
	var arrResult = [];

	var oState = {
		Footnotes   : {},
		Use         : this.Selection.Use,
		Start       : this.Selection.Start.Footnote,
		End         : this.Selection.End.Footnote,
		Direction   : this.Selection.Direction,
		CurFootnote : this.CurFootnote
	};

	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oState.Footnotes[sId] =
		{
			Footnote : oFootnote,
			State    : oFootnote.GetSelectionState()
		};
	}

	arrResult.push(oState);
	return arrResult;
};
CFootnotesController.prototype.SetSelectionState = function(State, StateIndex)
{
	var oState = State[StateIndex];

	this.Selection.Use            = oState.Use;
	this.Selection.Start.Footnote = oState.Start;
	this.Selection.End.Footnote   = oState.End;
	this.Selection.Direction      = oState.Direction;
	this.CurFootnote              = oState.CurFootnote;
	this.Selection.Footnotes      = {};
	
	for (var sId in oState.Footnotes)
	{
		this.Selection.Footnotes[sId] = oState.Footnotes[sId].Footnote;
		this.Selection.Footnotes[sId].SetSelectionState(oState.Footnotes[sId].State, oState.Footnotes[sId].State.length - 1);
	}
};
CFootnotesController.prototype.AddHyperlink = function(Props)
{
	if (true !== this.IsSelectionUse() || true === this.private_IsOnFootnoteSelected())
	{
		this.CurFootnote.AddHyperlink(Props);
	}
};
CFootnotesController.prototype.ModifyHyperlink = function(Props)
{
	if (true !== this.IsSelectionUse() || true === this.private_IsOnFootnoteSelected())
	{
		this.CurFootnote.ModifyHyperlink(Props);
	}
};
CFootnotesController.prototype.RemoveHyperlink = function()
{
	if (true !== this.IsSelectionUse() || true === this.private_IsOnFootnoteSelected())
	{
		this.CurFootnote.RemoveHyperlink();
	}
};
CFootnotesController.prototype.CanAddHyperlink = function(bCheckInHyperlink)
{
	if (true !== this.IsSelectionUse() || true === this.private_IsOnFootnoteSelected())
		return this.CurFootnote.CanAddHyperlink(bCheckInHyperlink);

	return false;
};
CFootnotesController.prototype.IsCursorInHyperlink = function(bCheckEnd)
{
	if (true !== this.IsSelectionUse() || true === this.private_IsOnFootnoteSelected())
		return this.CurFootnote.IsCursorInHyperlink(bCheckEnd);

	return null;
};
CFootnotesController.prototype.AddComment = function(Comment)
{
	if (true !== this.IsSelectionUse() || true === this.private_IsOnFootnoteSelected())
	{
		this.CurFootnote.AddComment(Comment, true, true);
	}
};
CFootnotesController.prototype.CanAddComment = function()
{
	if (true !== this.IsSelectionUse() || true === this.private_IsOnFootnoteSelected())
		return this.CurFootnote.CanAddComment();

	return false;
};
CFootnotesController.prototype.GetSelectionAnchorPos = function()
{
	if (true !== this.Selection.Use || 0 === this.Selection.Direction)
		return this.CurFootnote.GetSelectionAnchorPos();
	else if (1 === this.Selection.Direction)
		return this.Selection.Start.Footnote.GetSelectionAnchorPos();
	else
		return this.Selection.End.Footnote.GetSelectionAnchorPos();
};
CFootnotesController.prototype.StartSelectionFromCurPos = function()
{
	if (true === this.Selection.Use)
		return;

	this.Selection.Use = true;
	this.Selection.Start.Footnote = this.CurFootnote;
	this.Selection.End.Footnote   = this.CurFootnote;
	this.Selection.Footnotes = {};
	this.Selection.Footnotes[this.CurFootnote.Get_Id()] = this.CurFootnote;
	this.CurFootnote.StartSelectionFromCurPos();
};
CFootnotesController.prototype.SaveDocumentStateBeforeLoadChanges   = function(State)
{
	State.FootnotesSelectDirection = this.Selection.Direction;
	State.FootnotesSelectionUse    = this.Selection.Use;

	if (0 === this.Selection.Direction || false === this.Selection.Use)
	{
		var oFootnote               = this.CurFootnote;
		State.CurFootnote           = oFootnote;
		State.CurFootnoteSelection  = oFootnote.Selection.Use;
		State.CurFootnoteDocPosType = oFootnote.GetDocPosType();

		if (docpostype_Content === oFootnote.GetDocPosType())
		{
			State.Pos      = oFootnote.GetContentPosition(false, false, undefined);
			State.StartPos = oFootnote.GetContentPosition(true, true, undefined);
			State.EndPos   = oFootnote.GetContentPosition(true, false, undefined);
		}
		else if (docpostype_DrawingObjects === oFootnote.GetDocPosType())
		{
			this.LogicDocument.DrawingObjects.Save_DocumentStateBeforeLoadChanges(State);
		}
	}
	else
	{
		State.FootnotesList  = this.private_GetSelectionArray();
		var oFootnote        = State.FootnotesList[0];
		State.FootnotesStart = {
			Pos      : oFootnote.GetContentPosition(false, false, undefined),
			StartPos : oFootnote.GetContentPosition(true, true, undefined),
			EndPos   : oFootnote.GetContentPosition(true, false, undefined)
		};

		oFootnote          = State.FootnotesList[State.FootnotesList.length - 1];
		State.FootnotesEnd = {
			Pos      : oFootnote.GetContentPosition(false, false, undefined),
			StartPos : oFootnote.GetContentPosition(true, true, undefined),
			EndPos   : oFootnote.GetContentPosition(true, false, undefined)
		};
	}
};
CFootnotesController.prototype.RestoreDocumentStateAfterLoadChanges = function(State)
{
	this.RemoveSelection();
	if (0 === State.FootnotesSelectDirection)
	{
		var oFootnote = State.CurFootnote;
		if (oFootnote && true === this.Is_UseInDocument(oFootnote.Get_Id()))
		{
			this.Selection.Start.Footnote = oFootnote;
			this.Selection.End.Footnote   = oFootnote;
			this.Selection.Direction      = 0;
			this.CurFootnote              = oFootnote;
			this.Selection.Footnotes      = {};
			this.Selection.Use            = State.FootnotesSelectionUse;

			this.Selection.Footnotes[oFootnote.Get_Id()] = oFootnote;

			if (docpostype_Content === State.CurFootnoteDocPosType)
			{
				oFootnote.SetDocPosType(docpostype_Content);
				oFootnote.Selection.Use = State.CurFootnoteSelection;
				if (true === oFootnote.Selection.Use)
				{
					oFootnote.SetContentPosition(State.StartPos, 0, 0);
					oFootnote.SetContentSelection(State.StartPos, State.EndPos, 0, 0, 0);
				}
				else
				{
					oFootnote.SetContentPosition(State.Pos, 0, 0);
					this.LogicDocument.NeedUpdateTarget = true;
				}
			}
			else if (docpostype_DrawingObjects === State.CurFootnoteDocPosType)
			{
				oFootnote.SetDocPosType(docpostype_DrawingObjects);
				if (true !== this.LogicDocument.DrawingObjects.Load_DocumentStateAfterLoadChanges(State))
				{
					oFootnote.SetDocPosType(docpostype_Content);
					this.LogicDocument.MoveCursorToXY(State.X ? State.X : 0, State.Y ? State.Y : 0, false);
				}
			}
		}
		else
		{
			this.LogicDocument.EndFootnotesEditing();
		}
	}
	else
	{
		var arrFootnotesList = State.FootnotesList;

		var StartFootnote = null;
		var EndFootnote   = null;

		var arrAllFootnotes = this.private_GetFootnotesLogicRange(null, null);

		for (var nIndex = 0, nCount = arrFootnotesList.length; nIndex < nCount; ++nIndex)
		{
			var oFootnote = arrFootnotesList[nIndex];
			if (true === this.Is_UseInDocument(oFootnote.Get_Id(), arrAllFootnotes))
			{
				if (null === StartFootnote)
					StartFootnote = oFootnote;

				EndFootnote = oFootnote;
			}
		}

		if (null === StartFootnote || null === EndFootnote)
		{
			this.LogicDocument.EndFootnotesEditing();
			return;
		}

		var arrNewFootnotesList = this.private_GetFootnotesLogicRange(StartFootnote, EndFootnote);
		if (arrNewFootnotesList.length < 1)
		{
			if (null !== EndFootnote)
			{
				EndFootnote.RemoveSelection();
				this.private_SetCurrentFootnoteNoSelection(EndFootnote);
			}
			else if (null !== StartFootnote)
			{
				StartFootnote.RemoveSelection();
				this.private_SetCurrentFootnoteNoSelection(StartFootnote);
			}
			else
			{
				this.LogicDocument.EndFootnotesEditing();
			}
		}
		else if (arrNewFootnotesList.length === 1)
		{
			this.Selection.Use            = true;
			this.Selection.Direction      = 0;
			this.Selection.Footnotes      = {};
			this.Selection.Start.Footnote = StartFootnote;
			this.Selection.End.Footnote   = StartFootnote;
			this.CurFootnote              = StartFootnote;

			this.Selection.Footnotes[StartFootnote.Get_Id()] = StartFootnote;

			if (arrFootnotesList[0] === StartFootnote)
			{
				StartFootnote.SetDocPosType(docpostype_Content);
				StartFootnote.Selection.Use = true;
				StartFootnote.SetContentPosition(State.FootnotesStart.Pos, 0, 0);
				StartFootnote.SetContentSelection(State.FootnotesStart.StartPos, State.FootnotesStart.EndPos, 0, 0, 0);
			}
			else if (arrFootnotesList[arrAllFootnotes.length - 1] === StartFootnote)
			{
				StartFootnote.SetDocPosType(docpostype_Content);
				StartFootnote.Selection.Use = true;
				StartFootnote.SetContentPosition(State.FootnotesEnd.Pos, 0, 0);
				StartFootnote.SetContentSelection(State.FootnotesEnd.StartPos, State.FootnotesEnd.EndPos, 0, 0, 0);
			}
			else
			{
				StartFootnote.SetDocPosType(docpostype_Content);
				StartFootnote.SelectAll(1);
			}
		}
		else
		{
			this.Selection.Use       = true;
			this.Selection.Direction = State.FootnotesSelectDirection;
			this.Selection.Footnotes = {};

			for (var nIndex = 1, nCount = arrNewFootnotesList.length; nIndex < nCount - 1; ++nIndex)
			{
				var oFootnote = arrNewFootnotesList[nIndex];
				oFootnote.SelectAll(this.Selection.Direction);
				this.Selection.Footnotes[oFootnote.Get_Id()] = oFootnote;
			}

			this.Selection.Footnotes[StartFootnote.Get_Id()] = StartFootnote;
			this.Selection.Footnotes[EndFootnote.Get_Id()]   = EndFootnote;


			if (arrFootnotesList[0] === StartFootnote)
			{
				StartFootnote.SetDocPosType(docpostype_Content);
				StartFootnote.Selection.Use = true;
				StartFootnote.SetContentPosition(State.FootnotesStart.Pos, 0, 0);
				StartFootnote.SetContentSelection(State.FootnotesStart.StartPos, State.FootnotesStart.EndPos, 0, 0, 0);
			}
			else
			{
				StartFootnote.SetDocPosType(docpostype_Content);
				StartFootnote.SelectAll(1);
			}

			if (arrFootnotesList[arrFootnotesList.length - 1] === EndFootnote)
			{
				EndFootnote.SetDocPosType(docpostype_Content);
				EndFootnote.Selection.Use = true;
				EndFootnote.SetContentPosition(State.FootnotesEnd.Pos, 0, 0);
				EndFootnote.SetContentSelection(State.FootnotesEnd.StartPos, State.FootnotesEnd.EndPos, 0, 0, 0);
			}
			else
			{
				EndFootnote.SetDocPosType(docpostype_Content);
				EndFootnote.SelectAll(1);
			}

			if (1 !== this.Selection.Direction)
			{
				var Temp      = StartFootnote;
				StartFootnote = EndFootnote;
				EndFootnote   = Temp;
			}

			this.Selection.Start.Footnote = StartFootnote;
			this.Selection.End.Footnote   = EndFootnote;
		}
	}
};
CFootnotesController.prototype.GetColumnSize = function()
{
	// TODO: Переделать
	var _w = Math.max(1, AscCommon.Page_Width - (AscCommon.X_Left_Margin + AscCommon.X_Right_Margin));
	var _h = Math.max(1, AscCommon.Page_Height - (AscCommon.Y_Top_Margin + AscCommon.Y_Bottom_Margin));

	return {
		W : AscCommon.Page_Width - (AscCommon.X_Left_Margin + AscCommon.X_Right_Margin),
		H : AscCommon.Page_Height - (AscCommon.Y_Top_Margin + AscCommon.Y_Bottom_Margin)
	};
};
CFootnotesController.prototype.GetCurrentSectionPr = function()
{
	return null;
};
CFootnotesController.prototype.GetColumnFields = function(nPageAbs, nColumnAbs)
{
	var oColumn = this.private_GetPageColumn(nPageAbs, nColumnAbs);
	if (!oColumn)
		return {X : 0, XLimit : 297};

	return {X : oColumn.X, XLimit : oColumn.XLimit};
};
CFootnotesController.prototype.RemoveTextSelection = function()
{
	if (true === this.Selection.Use)
	{
		for (var sId in this.Selection.Footnotes)
		{
			if (this.Selection.Footnotes[sId] !== this.CurFootnote)
				this.Selection.Footnotes[sId].RemoveSelection();
		}

		this.Selection.Use = false;
	}

	this.Selection.Footnotes = {};
	if (this.CurFootnote)
	{
		this.Selection.Footnotes[this.CurFootnote.Get_Id()] = this.CurFootnote;
		this.CurFootnote.RemoveTextSelection();
	}
};
CFootnotesController.prototype.ResetRecalculateCache = function()
{
	for (var Id in this.Footnote)
	{
		this.Footnote[Id].Reset_RecalculateCache();
	}
};
CFootnotesController.prototype.AddContentControl = function(nContentControlType)
{
	if (this.CurFootnote)
		return this.CurFootnote.AddContentControl(nContentControlType);

	return null;
};
CFootnotesController.prototype.GetStyleFromFormatting = function()
{
	if (this.CurFootnote)
		return this.CurFootnote.GetStyleFromFormatting();

	return null;
};
CFootnotesController.prototype.GetSimilarNumbering = function(oEngine)
{
	if (this.CurFootnote)
		this.CurFootnote.GetSimilarNumbering(oEngine);
};
CFootnotesController.prototype.GetPlaceHolderObject = function()
{
	if (this.CurFootnote)
		return this.CurFootnote.GetPlaceHolderObject();

	return null;
};
CFootnotesController.prototype.GetAllFields = function(isUseSelection, arrFields)
{
	// Поиск по всем сноскам должен происходить не здесь
	if (!isUseSelection || !this.CurFootnote)
		return arrFields ? arrFields : [];

	return this.CurFootnote.GetAllFields(isUseSelection, arrFields);
};
/**
 * Получаем список всех автофигур, находящихся в сносках
 * @param arrDrawings {array}
 * @returns {array}
 */
CFootnotesController.prototype.GetAllDrawingObjects = function(arrDrawings)
{
	if (undefined === arrDrawings || null === arrDrawings)
		arrDrawings = [];

	for (var sId in  this.Footnote)
	{
		var oFootnote = this.Footnote[sId];
		oFootnote.GetAllDrawingObjects(arrDrawings);
	}

	return arrDrawings;
};
CFootnotesController.prototype.IsTableCellSelection = function()
{
	if (this.CurFootnote)
		return this.CurFootnote.IsTableCellSelection();

	return false;
};
CFootnotesController.prototype.AcceptRevisionChanges = function(Type, bAll)
{
	if (null !== this.CurFootnote)
		this.CurFootnote.AcceptRevisionChanges(Type, bAll);
};
CFootnotesController.prototype.RejectRevisionChanges = function(Type, bAll)
{
	if (null !== this.CurFootnote)
		this.CurFootnote.RejectRevisionChanges(Type, bAll);
};
CFootnotesController.prototype.IsSelectionLocked = function(CheckType)
{
	for (var sId in this.Selection.Footnotes)
	{
		var oFootnote = this.Selection.Footnotes[sId];
		oFootnote.Document_Is_SelectionLocked(CheckType);
	}
};


function CFootEndnotePageColumn()
{
	this.X      = 0;
	this.Y      = 0;
	this.XLimit = 0;
	this.YLimit = 0;

	this.ReferenceY        = 0;
	this.Height            = 0;
	this.Elements          = []; // Элементы, которые пересчитаны на данной странице
	this.ContinuesElements = []; // Элементы, которые нужно пересчитывать на следующей колонке

	this.SeparatorRecalculateObject             = null;
	this.ContinuationSeparatorRecalculateObject = null;
	this.ContinuationNoticeRecalculateObject    = null;
}
CFootEndnotePageColumn.prototype.Reset = function()
{
	this.ReferenceY        = 0;
	this.Height            = 0;
	this.Elements          = [];
	this.ContinuesElements = [];

	this.SeparatorRecalculateObject             = null;
	this.ContinuationSeparatorRecalculateObject = null;
	this.ContinuationNoticeRecalculateObject    = null;
};
CFootEndnotePageColumn.prototype.GetContinuesElements = function()
{
	return this.ContinuesElements;
};
CFootEndnotePageColumn.prototype.SetContinuesElements = function(arrContinuesElements)
{
	this.ContinuesElements = arrContinuesElements;
};
CFootEndnotePageColumn.prototype.AddContinuesElements = function(arrElements)
{
	for (var nIndex = 0, nCount = arrElements.length; nIndex < nCount; ++nIndex)
	{
		this.ContinuesElements.push(arrElements[nIndex]);
	}
};
CFootEndnotePageColumn.prototype.SaveRecalculateObject = function()
{
	var oColumn = new CFootEndnotePageColumn();

	oColumn.X      = this.X;
	oColumn.Y      = this.Y;
	oColumn.XLimit = this.XLimit;
	oColumn.YLimit = this.YLimit;

	oColumn.ReferenceY = this.ReferenceY;
	oColumn.Height     = this.Height;

	for (var nIndex = 0, nCount = this.Elements.length; nIndex < nCount; ++nIndex)
	{
		oColumn.Elements[nIndex] = this.Elements[nIndex];
	}

	oColumn.ContinuesElements = this.ContinuesElements;

	oColumn.SeparatorRecalculateObject             = this.SeparatorRecalculateObject;
	oColumn.ContinuationSeparatorRecalculateObject = this.ContinuationSeparatorRecalculateObject;
	oColumn.ContinuationNoticeRecalculateObject    = this.ContinuationNoticeRecalculateObject;
	return oColumn;
};
CFootEndnotePageColumn.prototype.LoadRecalculateObject = function(oObject)
{
	this.X      = oObject.X;
	this.Y      = oObject.Y;
	this.XLimit = oObject.XLimit;
	this.YLimit = oObject.YLimit;

	this.ReferenceY = oObject.ReferenceY;
	this.Height     = oObject.Height;

	this.Elements = [];
	for (var nIndex = 0, nCount = oObject.Elements.length; nIndex < nCount; ++nIndex)
	{
		this.Elements[nIndex] = oObject.Elements[nIndex];
	}

	this.ContinuesElements = oObject.ContinuesElements;

	this.SeparatorRecalculateObject             = oObject.SeparatorRecalculateObject;
	this.ContinuationSeparatorRecalculateObject = oObject.ContinuationSeparatorRecalculateObject;
	this.ContinuationNoticeRecalculateObject    = oObject.ContinuationNoticeRecalculateObject;
};

function CFootEndnotePage()
{
	this.Columns = [];
}
CFootEndnotePage.prototype.Reset = function()
{
	this.Columns = [];
};
CFootEndnotePage.prototype.AddColumn = function(oColumn)
{
	this.Columns.push(oColumn);
};
