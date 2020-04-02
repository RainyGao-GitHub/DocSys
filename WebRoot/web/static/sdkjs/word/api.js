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

(function(window, document)
{

	// Import
	var g_fontApplication = null;

	var c_oAscAdvancedOptionsAction      = AscCommon.c_oAscAdvancedOptionsAction;
	var DownloadType                     = AscCommon.DownloadType;
	var c_oAscFormatPainterState         = AscCommon.c_oAscFormatPainterState;
	var locktype_None                    = AscCommon.locktype_None;
	var locktype_Mine                    = AscCommon.locktype_Mine;
	var locktype_Other                   = AscCommon.locktype_Other;
	var locktype_Other2                  = AscCommon.locktype_Other2;
	var locktype_Other3                  = AscCommon.locktype_Other3;
	var changestype_None                 = AscCommon.changestype_None;
	var changestype_Paragraph_Content    = AscCommon.changestype_Paragraph_Content;
	var changestype_Paragraph_Properties = AscCommon.changestype_Paragraph_Properties;
	var changestype_Table_Properties     = AscCommon.changestype_Table_Properties;
	var changestype_Table_RemoveCells    = AscCommon.changestype_Table_RemoveCells;
	var changestype_HdrFtr               = AscCommon.changestype_HdrFtr;
	var asc_CTextFontFamily              = AscCommon.asc_CTextFontFamily;
	var asc_CSelectedObject              = AscCommon.asc_CSelectedObject;
	var g_oDocumentUrls                  = AscCommon.g_oDocumentUrls;
	var sendCommand                      = AscCommon.sendCommand;
	var g_oIdCounter                     = AscCommon.g_oIdCounter;
	var g_oTableId                       = AscCommon.g_oTableId;
	var PasteElementsId                  = null;
	var global_mouseEvent                = null;
	var History                          = null;

	var c_oAscError                 = Asc.c_oAscError;
	var c_oAscFileType              = Asc.c_oAscFileType;
	var c_oAscAsyncAction           = Asc.c_oAscAsyncAction;
	var c_oAscAdvancedOptionsID     = Asc.c_oAscAdvancedOptionsID;
	var c_oAscFontRenderingModeType = Asc.c_oAscFontRenderingModeType;
	var c_oAscAsyncActionType       = Asc.c_oAscAsyncActionType;
	var c_oAscTypeSelectElement     = Asc.c_oAscTypeSelectElement;
	var c_oAscFill                  = Asc.c_oAscFill;
	var asc_CImgProperty            = Asc.asc_CImgProperty;
	var asc_CShapeFill              = Asc.asc_CShapeFill;
	var asc_CFillBlip               = Asc.asc_CFillBlip;
	var c_oAscSdtLockType           = Asc.c_oAscSdtLockType;

	function CAscSection()
	{
		this.PageWidth  = 0;
		this.PageHeight = 0;

		this.MarginLeft   = 0;
		this.MarginRight  = 0;
		this.MarginTop    = 0;
		this.MarginBottom = 0;
	}

	CAscSection.prototype.get_PageWidth    = function()
	{
		return this.PageWidth;
	};
	CAscSection.prototype.get_PageHeight   = function()
	{
		return this.PageHeight;
	};
	CAscSection.prototype.get_MarginLeft   = function()
	{
		return this.MarginLeft;
	};
	CAscSection.prototype.get_MarginRight  = function()
	{
		return this.MarginRight;
	};
	CAscSection.prototype.get_MarginTop    = function()
	{
		return this.MarginTop;
	};
	CAscSection.prototype.get_MarginBottom = function()
	{
		return this.MarginBottom;
	};

	function CHeaderProp(obj)
	{
		/*{
		 Type : hdrftr_Footer (hdrftr_Header),
		 Position : 12.5,
		 DifferentFirst : true/false,
		 DifferentEvenOdd : true/false,
		 }*/
		if (obj)
		{
			this.Type             = (undefined != obj.Type) ? obj.Type : null;
			this.Position         = (undefined != obj.Position) ? obj.Position : null;
			this.DifferentFirst   = (undefined != obj.DifferentFirst) ? obj.DifferentFirst : null;
			this.DifferentEvenOdd = (undefined != obj.DifferentEvenOdd) ? obj.DifferentEvenOdd : null;
			this.LinkToPrevious   = (undefined != obj.LinkToPrevious) ? obj.LinkToPrevious : null;
			this.Locked           = (undefined != obj.Locked) ? obj.Locked : false;
			this.StartPageNumber  = (undefined != obj.StartPageNumber) ? obj.StartPageNumber : -1;
		}
		else
		{
			this.Type             = AscCommon.hdrftr_Footer;
			this.Position         = 12.5;
			this.DifferentFirst   = false;
			this.DifferentEvenOdd = false;
			this.LinkToPrevious   = null;
			this.Locked           = false;
			this.StartPageNumber  = -1;
		}
	}

	CHeaderProp.prototype.get_Type             = function()
	{
		return this.Type;
	};
	CHeaderProp.prototype.put_Type             = function(v)
	{
		this.Type = v;
	};
	CHeaderProp.prototype.get_Position         = function()
	{
		return this.Position;
	};
	CHeaderProp.prototype.put_Position         = function(v)
	{
		this.Position = v;
	};
	CHeaderProp.prototype.get_DifferentFirst   = function()
	{
		return this.DifferentFirst;
	};
	CHeaderProp.prototype.put_DifferentFirst   = function(v)
	{
		this.DifferentFirst = v;
	};
	CHeaderProp.prototype.get_DifferentEvenOdd = function()
	{
		return this.DifferentEvenOdd;
	};
	CHeaderProp.prototype.put_DifferentEvenOdd = function(v)
	{
		this.DifferentEvenOdd = v;
	};
	CHeaderProp.prototype.get_LinkToPrevious   = function()
	{
		return this.LinkToPrevious;
	};
	CHeaderProp.prototype.get_Locked           = function()
	{
		return this.Locked;
	};
	CHeaderProp.prototype.get_StartPageNumber = function()
	{
		return this.StartPageNumber;
	};
	CHeaderProp.prototype.put_StartPageNumber = function(nStartPage)
	{
		this.StartPageNumber = nStartPage;
	};

	var DocumentPageSize = new function()
	{
		this.oSizes    = [{name : "US Letter", w_mm : 215.9, h_mm : 279.4, w_tw : 12240, h_tw : 15840},
			{name : "US Legal", w_mm : 215.9, h_mm : 355.6, w_tw : 12240, h_tw : 20160},
			{name : "A4", w_mm : 210, h_mm : 297, w_tw : 11907, h_tw : 16839},
			{name : "A5", w_mm : 148.1, h_mm : 209.9, w_tw : 8391, h_tw : 11907},
			{name : "B5", w_mm : 176, h_mm : 250.1, w_tw : 9979, h_tw : 14175},
			{name : "Envelope #10", w_mm : 104.8, h_mm : 241.3, w_tw : 5940, h_tw : 13680},
			{name : "Envelope DL", w_mm : 110.1, h_mm : 220.1, w_tw : 6237, h_tw : 12474},
			{name : "Tabloid", w_mm : 279.4, h_mm : 431.7, w_tw : 15842, h_tw : 24477},
			{name : "A3", w_mm : 297, h_mm : 420.1, w_tw : 16840, h_tw : 23820},
			{name : "Tabloid Oversize", w_mm : 304.8, h_mm : 457.1, w_tw : 17282, h_tw : 25918},
			{name : "ROC 16K", w_mm : 196.8, h_mm : 273, w_tw : 11164, h_tw : 15485},
			{name : "Envelope Coukei 3", w_mm : 119.9, h_mm : 234.9, w_tw : 6798, h_tw : 13319},
			{name : "Super B/A3", w_mm : 330.2, h_mm : 482.5, w_tw : 18722, h_tw : 27358}
		];
		this.sizeEpsMM = 0.5;
		this.getSize   = function(widthMm, heightMm)
		{
			for (var index in this.oSizes)
			{
				var item = this.oSizes[index];
				if (Math.abs(widthMm - item.w_mm) < this.sizeEpsMM && Math.abs(heightMm - item.h_mm) < this.sizeEpsMM)
					return item;
			}
			return {w_mm : widthMm, h_mm : heightMm};
		};
	};

	function CMailMergeSendData(obj)
	{
		if (obj)
		{
			if (typeof obj.from != 'undefined')
			{
				this["from"] = obj.from;
			}
			if (typeof obj.to != 'undefined')
			{
				this["to"] = obj.to;
			}
			if (typeof obj.subject != 'undefined')
			{
				this["subject"] = obj.subject;
			}
			if (typeof obj.mailFormat != 'undefined')
			{
				this["mailFormat"] = obj.mailFormat;
			}
			if (typeof obj.fileName != 'undefined')
			{
				this["fileName"] = obj.fileName;
			}
			if (typeof obj.message != 'undefined')
			{
				this["message"] = obj.message;
			}
			if (typeof obj.recordFrom != 'undefined')
			{
				this["recordFrom"] = obj.recordFrom;
			}
			if (typeof obj.recordTo != 'undefined')
			{
				this["recordTo"] = obj.recordTo;
			}
			if (typeof obj.isJson != 'undefined')
			{
				this["isJson"] = obj.isJson;
			}
		}
		else
		{
			this["from"]        = null;
			this["to"]          = null;
			this["subject"]     = null;
			this["mailFormat"]  = null;
			this["fileName"]    = null;
			this["message"]     = null;
			this["recordFrom"]  = null;
			this["recordTo"]    = null;
			this["recordCount"] = null;
			this["userId"]      = null;
			this["isJson"]      = null;
		}
	}

	CMailMergeSendData.prototype.get_From        = function()
	{
		return this["from"]
	};
	CMailMergeSendData.prototype.put_From        = function(v)
	{
		this["from"] = v;
	};
	CMailMergeSendData.prototype.get_To          = function()
	{
		return this["to"]
	};
	CMailMergeSendData.prototype.put_To          = function(v)
	{
		this["to"] = v;
	};
	CMailMergeSendData.prototype.get_Subject     = function()
	{
		return this["subject"]
	};
	CMailMergeSendData.prototype.put_Subject     = function(v)
	{
		this["subject"] = v;
	};
	CMailMergeSendData.prototype.get_MailFormat  = function()
	{
		return this["mailFormat"]
	};
	CMailMergeSendData.prototype.put_MailFormat  = function(v)
	{
		this["mailFormat"] = v;
	};
	CMailMergeSendData.prototype.get_FileName    = function()
	{
		return this["fileName"]
	};
	CMailMergeSendData.prototype.put_FileName    = function(v)
	{
		this["fileName"] = v;
	};
	CMailMergeSendData.prototype.get_Message     = function()
	{
		return this["message"]
	};
	CMailMergeSendData.prototype.put_Message     = function(v)
	{
		this["message"] = v;
	};
	CMailMergeSendData.prototype.get_RecordFrom  = function()
	{
		return this["recordFrom"]
	};
	CMailMergeSendData.prototype.put_RecordFrom  = function(v)
	{
		this["recordFrom"] = v;
	};
	CMailMergeSendData.prototype.get_RecordTo    = function()
	{
		return this["recordTo"]
	};
	CMailMergeSendData.prototype.put_RecordTo    = function(v)
	{
		this["recordTo"] = v;
	};
	CMailMergeSendData.prototype.get_RecordCount = function()
	{
		return this["recordCount"]
	};
	CMailMergeSendData.prototype.put_RecordCount = function(v)
	{
		this["recordCount"] = v;
	};
	CMailMergeSendData.prototype.get_UserId      = function()
	{
		return this["userId"]
	};
	CMailMergeSendData.prototype.put_UserId      = function(v)
	{
		this["userId"] = v;
	};
	CMailMergeSendData.prototype.get_IsJson      = function()
	{
		return this["isJson"]
	};
	CMailMergeSendData.prototype.put_IsJson      = function(v)
	{
		this["isJson"] = v;
	};

	function CAscFootnotePr(obj)
	{
		this.NumRestart = undefined;
		this.NumFormat  = undefined;
		this.NumStart   = undefined;
		this.Pos        = undefined;

		if (obj)
		{
			this.NumRestart = obj.NumRestart;
			this.NumFormat  = obj.NumFormat;
			this.NumStart   = obj.NumStart;
			this.Pos        = obj.Pos;
		}
	}
	CAscFootnotePr.prototype.get_Pos = function()
	{
		return this.Pos;
	};
	CAscFootnotePr.prototype.put_Pos = function(v)
	{
		this.Pos = v;
	};
	CAscFootnotePr.prototype.get_NumStart = function()
	{
		return this.NumStart;
	};
	CAscFootnotePr.prototype.put_NumStart = function(v)
	{
		this.NumStart = v;
	};
	CAscFootnotePr.prototype.get_NumFormat = function()
	{
		return this.NumFormat;
	};
	CAscFootnotePr.prototype.put_NumFormat = function(v)
	{
		this.NumFormat = v;
	};
	CAscFootnotePr.prototype.get_NumRestart = function()
	{
		return this.NumRestart;
	};
	CAscFootnotePr.prototype.put_NumRestart = function(v)
	{
		this.NumRestart = v;
	};

	function CContentControlPluginWorker(_api, _docs)
	{
		this.api = _api;
		this.documents = _docs;
		this.returnDocuments = [];
		this.current = -1;
		this.guid = "";

		this.start = function()
		{
			// save worker in api
			this.api.__content_control_worker = this;
			this.api.incrementCounterLongAction();

			if (window.g_asc_plugins)
				this.guid = window.g_asc_plugins.setPluginMethodReturnAsync();

			this.run();
		};
		this.end = function()
		{
			if (window.g_asc_plugins)
				window.g_asc_plugins.onPluginMethodReturn(this.guid, this.returnDocuments);

			delete this.api.__content_control_worker;
			this.api.decrementCounterLongAction();

			this.api.WordControl.m_oLogicDocument.FinalizeAction();
		};

		this.run = function()
		{
			++this.current;

			var LogicDocument = this.api.WordControl.m_oLogicDocument;
			if (0 == this.current)
				LogicDocument.StartAction(AscDFH.historydescription_Document_InsertDocumentsByUrls);

			if (this.current >= this.documents.length)
			{
				this.end();
				return;
			}

			var _obj = null;

			while (this.current < this.documents.length) // no recursion
			{
				var _current = this.documents[this.current];
				if (undefined === _current["Props"])
					_current["Props"] = {};

				var _isLocked = false;
				if ((_current["Url"] !== undefined || _current["Script"] !== undefined) && undefined !== _current["Props"]["InternalId"])
				{
					var _internalId     = _current["Props"]["InternalId"];
					var _contentControl = g_oTableId.Get_ById(_internalId);
					_isLocked = LogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
						Type      : AscCommon.changestype_2_ElementsArray_and_Type,
						Elements  : [_contentControl],
						CheckType : AscCommon.changestype_Document_Content_Add
					});
				}
				else
				{
					_isLocked = LogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Document_Content_Add);
				}

				if (false === _isLocked)
				{
					var _content_control_pr;
					var _blockStd;
					var _isReplaced = false;

					if (_current["Url"] !== undefined || _current["Script"] !== undefined)
					{
						_blockStd = null;
						if (undefined !== _current["Props"]["InternalId"])
						{
							_blockStd   = LogicDocument.ClearContentControl(_current["Props"]["InternalId"]);
							_isReplaced = true;
						}

						_content_control_pr = new AscCommon.CContentControlPr();
						_content_control_pr.Id = _current["Props"]["Id"];
						_content_control_pr.Tag = _current["Props"]["Tag"];
						_content_control_pr.Lock = c_oAscSdtLockType.Unlocked;
						_content_control_pr.InternalId = _current["Props"]["InternalId"];
                        _content_control_pr.Alias = _current["Props"]["Alias"];

                        if (undefined !== _current["Props"]["Appearance"])
                            _content_control_pr.Appearance = _current["Props"]["Appearance"];

                        if (undefined !== _current["Props"]["Color"])
                            _content_control_pr.Color = new Asc.asc_CColor(_current["Props"]["Color"]["R"], _current["Props"]["Color"]["G"], _current["Props"]["Color"]["B"]);

						if (null === _blockStd)
						{
							var oCurPara = LogicDocument.GetCurrentParagraph();
							if (oCurPara && !oCurPara.IsCursorAtBegin())
								LogicDocument.AddNewParagraph(false, true);

							_blockStd = LogicDocument.AddContentControl(c_oAscSdtLevelType.Block);
						}

						_blockStd.SetContentControlPr(_content_control_pr);

						_obj = _blockStd.GetContentControlPr();
						this.returnDocuments.push({"Tag" : _obj.Tag, "Id" : _obj.Id, "Lock" : _obj.Lock, "InternalId" : _obj.InternalId, "Alias" : _obj.Alias, "Appearance" : _obj.Appearance });
					}

					if (_current["Url"] !== undefined)
					{
						// insert/replace document
						this.api.insertDocumentUrlsData = {imageMap: null, documents: [{url : _current["Url"], format: _current["Format"], token: _current["Token"]}], convertCallback: function(_api, url) {
							_api.insertDocumentUrlsData.imageMap = url;
							AscCommon.loadFileContent(url['output.bin'], function(httpRequest) {
								var stream;
								if (null === httpRequest || !(stream = AscCommon.initStreamFromResponse(httpRequest))) {
									_api.endInsertDocumentUrls();
									_api.sendEvent("asc_onError", c_oAscError.ID.DirectUrl,
										c_oAscError.Level.NoCritical);
									return;
								}
								_api.asc_PasteData(AscCommon.c_oAscClipboardDataFormat.Internal, stream, undefined,
									undefined, true, function() {
										_api.WordControl.m_oLogicDocument.MoveCursorRight(false, false, true);
										_api.WordControl.m_oLogicDocument.Recalculate();

										if (_api.insertDocumentUrlsData.documents.length > 0) {
											var options = new Asc.asc_CDownloadOptions(Asc.c_oAscFileType.CANVAS_WORD);
											options.isNaturalDownload = true;
											_api.asc_DownloadAs(options);
										} else {
											_api.endInsertDocumentUrls();
										}
									});
							}, "arraybuffer");
						}, endCallback : function(_api) {
							_blockStd.Content.Remove_FromContent(_blockStd.Content.GetElementsCount() - 1 , 1);
							_blockStd.MoveCursorToEndPos(false, false);

							var _worker = _api.__content_control_worker;
							if (_worker.documents[_worker.current]["Props"])
								_blockStd.SetContentControlPr({ Lock : _worker.documents[_worker.current]["Props"]["Lock"] });
							_worker = null;

							_blockStd = null;

							window.g_asc_plugins.api.asc_Recalculate(true);

							setTimeout(function() {
								window.g_asc_plugins.api.__content_control_worker.run();
							}, 1);
						}};
						var options = new Asc.asc_CDownloadOptions(Asc.c_oAscFileType.CANVAS_WORD);
						options.isNaturalDownload = true;
						this.api.asc_DownloadAs(options);
						return;
					}
					else if (_current["Script"] !== undefined)
					{
						// insert/replace script
						var _script = "(function(){ var Api = window.g_asc_plugins.api;\n" + _current["Script"] + "\n})();";
						eval(_script);

						if (c_oAscSdtLevelType.Block === _blockStd.GetContentControlType())
						{
							if (_isReplaced)
							{
								if (_blockStd.Content.GetElementsCount() > 1)
									_blockStd.Content.Remove_FromContent(_blockStd.Content.GetElementsCount() - 1, 1);

								_blockStd.MoveCursorToStartPos(false);
							}
							else
							{
								if (_blockStd.Content.GetElementsCount() > 1)
								{
									_blockStd.Content.Remove_FromContent(_blockStd.Content.GetElementsCount() - 1, 1);
									_blockStd.MoveCursorToEndPos(false, false);
								}
								LogicDocument.MoveCursorRight(false, false, true);
							}
						}
						else
						{
							if (_isReplaced)
							{
								if (_blockStd.GetElementsCount() > 1)
									_blockStd.Remove_FromContent(_blockStd.GetElementsCount() - 1, 1);

								_blockStd.MoveCursorToStartPos();
								_blockStd.SetThisElementCurrent();
							}
							else
							{
								if (_blockStd.Content.GetElementsCount() > 1)
								{
									_blockStd.Remove_FromContent(_blockStd.GetElementsCount() - 1, 1);
									_blockStd.MoveCursorToEndPos();
									_blockStd.SetThisElementCurrent();
								}
								LogicDocument.MoveCursorRight(false, false, true);
							}
						}

						var _worker = _api.__content_control_worker;
						if (_worker.documents[_worker.current]["Props"])
							_blockStd.SetContentControlPr({ Lock : _worker.documents[_worker.current]["Props"]["Lock"] });
						_worker = null;

						var _fonts         = LogicDocument.Document_Get_AllFontNames();
						var _imagesArray   = LogicDocument.Get_AllImageUrls();
						var _images        = {};
						for (var i = 0; i < _imagesArray.length; i++)
						{
							_images[_imagesArray[i]] = _imagesArray[i];
						}

						window.g_asc_plugins.images_rename = _images;
						AscCommon.Check_LoadingDataBeforePrepaste(window.g_asc_plugins.api, _fonts, _images,
							function()
							{
								var _api = window.g_asc_plugins.api;

								delete window.g_asc_plugins.images_rename;
								_api.asc_Recalculate(true);
								_api.WordControl.m_oLogicDocument.UnlockPanelStyles(true);

								setTimeout(function() {
									window.g_asc_plugins.api.__content_control_worker.run();
								}, 1);
							});

						return;
					}
					else if (_current["Props"])
					{
						// change properties
						var _blockStd = LogicDocument.GetContentControl(_current["Props"]["InternalId"]);

						if (_blockStd)
						{
							_content_control_pr = new AscCommon.CContentControlPr();
							_content_control_pr.Id = _current["Props"]["Id"];
							_content_control_pr.Tag = _current["Props"]["Tag"];
							_content_control_pr.Lock = _current["Props"]["Lock"];
							_content_control_pr.InternalId = _current["Props"]["InternalId"];
                            _content_control_pr.Alias = _current["Props"]["Alias"];

                            if (undefined !== _current["Props"]["Appearance"])
                                _content_control_pr.Appearance = _current["Props"]["Appearance"];

                            if (undefined !== _current["Props"]["Color"])
                                _content_control_pr.Color = new Asc.asc_CColor(_current["Props"]["Color"]["R"], _current["Props"]["Color"]["G"], _current["Props"]["Color"]["B"]);

							_blockStd.SetContentControlPr(_content_control_pr);

							_obj = _blockStd.GetContentControlPr();
							this.returnDocuments.push({
								"Tag":        _obj.Tag,
								"Id":         _obj.Id,
								"Lock":       _obj.Lock,
								"InternalId": _obj.InternalId,
								"Alias": _obj.Alias,
								"Appearance": _obj.Appearance
							});
						}
					}
				}
				else
				{
					if (false === LogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_ContentControl_Properties))
					{
						var _current = this.documents[this.current];
						if (_current["Props"] && _current["Url"] === undefined && _current["Script"] === undefined)
						{
							// change properties
							var _blockStd = LogicDocument.GetContentControl(_current["Props"]["InternalId"]);

							if (_blockStd)
							{
								_content_control_pr = new AscCommon.CContentControlPr();
								_content_control_pr.Id = _current["Props"]["Id"];
								_content_control_pr.Tag = _current["Props"]["Tag"];
								_content_control_pr.Lock = _current["Props"]["Lock"];
								_content_control_pr.InternalId = _current["Props"]["InternalId"];
                                _content_control_pr.Alias = _current["Props"]["Alias"];

                                if (undefined !== _current["Props"]["Appearance"])
                                    _content_control_pr.Appearance = _current["Props"]["Appearance"];

                                if (undefined !== _current["Props"]["Color"])
                                    _content_control_pr.Color = new Asc.asc_CColor(_current["Props"]["Color"]["R"], _current["Props"]["Color"]["G"], _current["Props"]["Color"]["B"]);

								_blockStd.SetContentControlPr(_content_control_pr);

								_obj = _blockStd.GetContentControlPr();
								this.returnDocuments.push({
									"Tag":        _obj.Tag,
									"Id":         _obj.Id,
									"Lock":       _obj.Lock,
									"InternalId": _obj.InternalId,
                                    "Alias": _obj.Alias,
                                    "Appearance": _obj.Appearance
								});
							}
						}
					}
				}

				++this.current;
			}

			if (this.current >= this.documents.length)
			{
				this.end();
				return;
			}
		};

		this.delete = function()
		{
			var LogicDocument = this.api.WordControl.m_oLogicDocument;

			var arrContentControl = [];
			for (var i = 0; i < this.documents.length; i++)
			{
				var oContentControl = g_oTableId.Get_ById(this.documents[i]["InternalId"]);
				if (oContentControl
					&& (oContentControl instanceof AscCommonWord.CBlockLevelSdt
					|| oContentControl instanceof AscCommonWord.CInlineLevelSdt))
					arrContentControl.push(g_oTableId.Get_ById(this.documents[i]["InternalId"]));
			}

			LogicDocument.SetCheckContentControlsLock(false);
			if (false === LogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
					Type      : AscCommon.changestype_2_ElementsArray_and_Type,
					Elements  : arrContentControl,
					CheckType : AscCommon.changestype_Remove
				}))
			{
				LogicDocument.StartAction(AscDFH.historydescription_Document_InsertDocumentsByUrls);
				for (var i = 0; i < this.documents.length; i++)
				{
					LogicDocument.RemoveContentControl(this.documents[i]["InternalId"]);
				}
				LogicDocument.FinalizeAction();
			}
			LogicDocument.SetCheckContentControlsLock(true);
			this.api.asc_Recalculate(true);
			delete this.api.__content_control_worker;
		};
	}

    AscCommon.CContentControlPluginWorker = CContentControlPluginWorker;

	// пользоваться так:
	// подрубить его последним из скриптов к страничке
	// и вызвать, после подгрузки (конец метода OnInit <- Drawing/HtmlPage.js)
	// var _api = new asc_docs_api();
	// _api.init(oWordControl);

	/**
	 *
	 * @param config
	 * @constructor
	 * @extends {AscCommon.baseEditorsApi}
	 */
	function asc_docs_api(config)
	{
		AscCommon.baseEditorsApi.call(this, config, AscCommon.c_oEditorId.Word);

		/************ private!!! **************/
		this.WordControl = null;

		this.documentFormatSave = c_oAscFileType.DOCX;

		//todo убрать из native, copypaste, chart, loadfont
		this.InterfaceLocale = null;

		this.ShowParaMarks        = false;
		this.ShowSnapLines        = true;
		this.isAddSpaceBetweenPrg = false;
		this.isPageBreakBefore    = false;
		this.isKeepLinesTogether  = false;

		this.isPaintFormat              = c_oAscFormatPainterState.kOff;
		this.isMarkerFormat             = false;
		this.isStartAddShape            = false;
		this.isDrawTablePen				= false;
        this.isDrawTableErase			= false;
		this.addShapePreset             = "";
		this.isShowTableEmptyLine       = true;
		this.isShowTableEmptyLineAttack = false;

		this.isApplyChangesOnOpen        = false;

		this.IsSpellCheckCurrentWord = false;

		this.mailMergeFileData = null;
		this.insertDocumentUrlsData = null;

		this.isCoMarksDraw  = false;
		this.tmpCoMarksDraw = false;
		this.tmpViewRulers  = null;
		this.tmpZoomType    = null;
		this.tmpDocumentUnits = null;

		// это чтобы сразу показать ридер, без возможности вернуться в редактор/вьюер
		this.isOnlyReaderMode = false;

		/**************************************/

		this.bInit_word_control = false;
		this.isDocumentModify   = false;

		this.tmpFontRenderingMode = null;
		this.FontAsyncLoadType    = 0;
		this.FontAsyncLoadParam   = null;

		this.isPasteFonts_Images = false;

		this.pasteCallback       = null;
		this.pasteImageMap       = null;
		this.EndActionLoadImages = 0;

		this.isSaveFonts_Images = false;
		this.saveImageMap       = null;

		this.isLoadImagesCustom = false;
		this.loadCustomImageMap = null;

		this.ServerImagesWaitComplete = false;

		this.DocumentOrientation = false;

		this.SelectedObjectsStack = [];

		this.nCurPointItemsLength = -1;
		this.isDocumentEditor     = true;

		this.CurrentTranslate = null;

		this.CollaborativeMarksShowType = c_oAscCollaborativeMarksShowType.All;

		// объекты, нужные для отправки в тулбар (шрифты, стили)
		this._gui_control_colors = null;

		this.DocumentReaderMode = null;

		if (window.editor == undefined)
		{
			window.editor = this;
			window['editor'] = window.editor;

			if (window["NATIVE_EDITOR_ENJINE"])
				editor = window.editor;
		}

		this.RevisionChangesStack = [];

		//g_clipboardBase.Init(this);

		this._init();
	}

	asc_docs_api.prototype = Object.create(AscCommon.baseEditorsApi.prototype);
	asc_docs_api.prototype.constructor = asc_docs_api;

	asc_docs_api.prototype.sendEvent           = function()
	{
		this.sendInternalEvent.apply(this, arguments);
		var name = arguments[0];
		if (_callbacks.hasOwnProperty(name))
		{
			for (var i = 0; i < _callbacks[name].length; ++i)
			{
				_callbacks[name][i].apply(this || window, Array.prototype.slice.call(arguments, 1));
			}
			return true;
		}
		return false;
	};
	// Просмотр PDF
	asc_docs_api.prototype.isPdfViewer         = function()
	{
		return (null === this.WordControl.m_oLogicDocument);
	};

	asc_docs_api.prototype.SetCollaborativeMarksShowType = function(Type)
	{
		if (c_oAscCollaborativeMarksShowType.None !== this.CollaborativeMarksShowType && c_oAscCollaborativeMarksShowType.None === Type && this.WordControl && this.WordControl.m_oLogicDocument)
		{
			this.CollaborativeMarksShowType = Type;
			AscCommon.CollaborativeEditing.Clear_CollaborativeMarks(true);
		}
		else
		{
			this.CollaborativeMarksShowType = Type;
		}
	};

	asc_docs_api.prototype.GetCollaborativeMarksShowType = function(Type)
	{
		return this.CollaborativeMarksShowType;
	};
	/**
	 * @returns {?CDocument}
	 */
	asc_docs_api.prototype.private_GetLogicDocument = function()
	{
		if (!this.WordControl || !this.WordControl.m_oLogicDocument)
			return null;

		return this.WordControl.m_oLogicDocument;
	};

	asc_docs_api.prototype.isLongAction = function()
	{
		if (this.WordControl.m_oLogicDocument)
			return (0 !== this.IsLongActionCurrent || this.WordControl.m_oLogicDocument.IsActionInProgress());

		return (0 !== this.IsLongActionCurrent);
	};

	asc_docs_api.prototype.Clear_CollaborativeMarks = function()
	{
		AscCommon.CollaborativeEditing.Clear_CollaborativeMarks(true);
	};

	asc_docs_api.prototype.SetLanguage = function(langId)
	{
		langId = langId.toLowerCase();
		if (undefined !== AscCommonWord.translations_map[langId])
			this.CurrentTranslate = AscCommonWord.translations_map[langId];
	};

	asc_docs_api.prototype.TranslateStyleName   = function(style_name)
	{
		var ret = this.CurrentTranslate.DefaultStyles[style_name];

		if (ret !== undefined)
			return ret;

		return style_name;
	};
	asc_docs_api.prototype.CheckChangedDocument = function()
	{
		if (true === History.Have_Changes())
		{
			// дублирование евента. когда будет undo-redo - тогда
			// эти евенты начнут отличаться
			this.SetDocumentModified(true);
		}
		else
		{
			this.SetDocumentModified(false);
		}

		this._onUpdateDocumentCanSave();
	};
	asc_docs_api.prototype.SetUnchangedDocument = function()
	{
		this.SetDocumentModified(false);
		this._onUpdateDocumentCanSave();
	};

	asc_docs_api.prototype.SetDocumentModified = function(bValue)
	{
		this.isDocumentModify = bValue;
		this.sendEvent("asc_onDocumentModifiedChanged");

		if (undefined !== window["AscDesktopEditor"])
		{
			window["AscDesktopEditor"]["onDocumentModifiedChanged"](bValue);
		}
	};

	asc_docs_api.prototype.isDocumentModified = function()
	{
		if (!this.canSave)
		{
			// Пока идет сохранение, мы не закрываем документ
			return true;
		}
		return this.isDocumentModify;
	};

	asc_docs_api.prototype.sync_BeginCatchSelectedElements = function()
	{
		if (0 != this.SelectedObjectsStack.length)
			this.SelectedObjectsStack.splice(0, this.SelectedObjectsStack.length);

		if (this.WordControl && this.WordControl.m_oDrawingDocument)
			this.WordControl.m_oDrawingDocument.StartTableStylesCheck();
	};
	asc_docs_api.prototype.sync_EndCatchSelectedElements   = function()
	{
		if (this.WordControl && this.WordControl.m_oDrawingDocument)
			this.WordControl.m_oDrawingDocument.EndTableStylesCheck();

		this.sendEvent("asc_onFocusObject", this.SelectedObjectsStack);
	};
	asc_docs_api.prototype.getSelectedElements             = function(bUpdate)
	{
		if (true === bUpdate)
			this.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();

		return this.SelectedObjectsStack;
	};
	asc_docs_api.prototype.sync_ChangeLastSelectedElement  = function(type, obj)
	{
		var oUnkTypeObj = null;

		switch (type)
		{
			case c_oAscTypeSelectElement.Paragraph:
				oUnkTypeObj = new Asc.asc_CParagraphProperty(obj);
				break;
			case c_oAscTypeSelectElement.Image:
				oUnkTypeObj = new asc_CImgProperty(obj);
				break;
			case c_oAscTypeSelectElement.Table:
				oUnkTypeObj = new Asc.CTableProp(obj);
				break;
			case c_oAscTypeSelectElement.Header:
				oUnkTypeObj = new CHeaderProp(obj);
				break;
		}

		var _i       = this.SelectedObjectsStack.length - 1;
		var bIsFound = false;
		while (_i >= 0)
		{
			if (this.SelectedObjectsStack[_i].Type == type)
			{

				this.SelectedObjectsStack[_i].Value = oUnkTypeObj;
				bIsFound                            = true;
				break;
			}
			_i--;
		}

		if (!bIsFound)
		{
			this.SelectedObjectsStack[this.SelectedObjectsStack.length] = new asc_CSelectedObject(type, oUnkTypeObj);
		}
	};

	asc_docs_api.prototype.Init = function()
	{
		this.WordControl.Init();
	};

	asc_docs_api.prototype.asc_setLocale = function(val)
	{
		this.InterfaceLocale = val;
	};

	asc_docs_api.prototype.asc_getLocale = function()
	{
		return this.InterfaceLocale;
	};

	asc_docs_api.prototype.ChangeReaderMode  = function()
	{
		return this.WordControl.ChangeReaderMode();
	};
	asc_docs_api.prototype.SetReaderModeOnly = function()
	{
		this.isOnlyReaderMode                       = true;
		if (this.ImageLoader)
			this.ImageLoader.bIsAsyncLoadDocumentImages = false;
	};

	asc_docs_api.prototype.IncreaseReaderFontSize = function()
	{
		return this.WordControl.IncreaseReaderFontSize();
	};
	asc_docs_api.prototype.DecreaseReaderFontSize = function()
	{
		return this.WordControl.DecreaseReaderFontSize();
	};

	asc_docs_api.prototype.CreateCSS = function()
	{
		if (window["flat_desine"] === true)
		{
			AscCommonWord.updateGlobalSkin(AscCommonWord.GlobalSkinFlat2);
		}

		var _head = document.getElementsByTagName('head')[0];

		var style0       = document.createElement('style');
		style0.type      = 'text/css';
		style0.innerHTML = ".block_elem { position:absolute;padding:0;margin:0; }";
		_head.appendChild(style0);

		var style2       = document.createElement('style');
		style2.type      = 'text/css';
		style2.innerHTML = ".buttonRuler {\
background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAwCAYAAAAYX/pXAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTAw9HKhAAABhElEQVRIS62Uwa6CMBBF/VQNQcOCBS5caOICApEt3+Wv+AcmfQ7pbdreqY+CJifTdjpng727aZrMFmbB+/3erYEE+/3egMPhMPP57QR/EJCgKAoTs1hQlqURjsdjAESyPp1O7pwEVVWZ1+s1VyB7DemRoK5rN+CvNaRPgqZpgqHz+UwSnEklweVyCQbivX8mlQTX65UGfG63m+vLXRLc7/ekQHoAexK0bWs0uq5TKwli8Afq+94Mw+CQPe78K5D6eDzMOI4GVcCdr4IlOMEWfiP4fJpVkEDLA38ghgR+DgB/ICYQ5OYBCez7d1mAvQZ6gcBmAK010A8ENg8c9u2rZ6iBwL51R7z3z1ADgc2DJDYPZnA3ENi3rhLlgauBAO8/JpUHJEih5QF6iwRaHqC3SPANJ9jCbwTP53MVJNDywB+IIYGfA8AfiAkEqTyQDEAO+HlAgtw8IEFuHpAgNw9IkJsHJMjNAxLk5gEJ8P5jUnlAghRaHqC3SKDlAXqLBN9wgvVM5g/dFuEU6U2wnAAAAABJRU5ErkJggg==);\
background-position: 0px 0px;\
background-repeat: no-repeat;\
}";
		_head.appendChild(style2);

		var style3       = document.createElement('style');
		style3.type      = 'text/css';
		style3.innerHTML = ".buttonPrevPage {\
background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAABgBAMAAADm/++TAAAABGdBTUEAALGPC/xhBQAAABJQTFRFAAAA////UVNVu77Cenp62Nrc3x8hMQAAAAF0Uk5TAEDm2GYAAABySURBVCjPY2AgETDBGEoKUAElJcJSxANjKGAwDQWDYAKMIBhDSRXCCFJSIixF0GS4M+AMExcwcCbAcIQxBEUgDEdBQcJSBE2GO4PU6IJHASxS4NGER4p28YWIAlikwKMJjxTt4gsRBbBIgUcTHini4wsAwMmIvYZODL0AAAAASUVORK5CYII=);\
background-position: 0px 0px;\
background-repeat: no-repeat;\
}";
		_head.appendChild(style3);

		var style4       = document.createElement('style');
		style4.type      = 'text/css';
		style4.innerHTML = ".buttonNextPage {\
background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAABgBAMAAADm/++TAAAABGdBTUEAALGPC/xhBQAAABJQTFRFAAAA////UVNVu77Cenp62Nrc3x8hMQAAAAF0Uk5TAEDm2GYAAABySURBVCjPY2AgETDBGEoKUAElJcJSxANjKGAwDQWDYAKMIBhDSRXCCFJSIixF0GS4M+AMExcwcCbAcIQxBEUgDEdBQcJSBE2GO4PU6IJHASxS4NGER4p28YWIAlikwKMJjxTt4gsRBbBIgUcTHini4wsAwMmIvYZODL0AAAAASUVORK5CYII=);\
background-position: 0px -48px;\
background-repeat: no-repeat;\
}";
		_head.appendChild(style4);
	};

	asc_docs_api.prototype.CreateComponents = function()
	{
		this.CreateCSS();

		if (this.HtmlElement != null)
			this.HtmlElement.innerHTML = ("<div id=\"id_main\" class=\"block_elem\" style=\"touch-action:none;-ms-touch-action: none;-moz-user-select:none;-khtml-user-select:none;user-select:none;background-color:" + AscCommonWord.GlobalSkin.BackgroundColor + ";overflow:hidden;\" UNSELECTABLE=\"on\">\
								<div id=\"id_panel_left\" class=\"block_elem\">\
									<canvas id=\"id_buttonTabs\" class=\"block_elem\"></canvas>\
									<canvas id=\"id_vert_ruler\" class=\"block_elem\"></canvas>\
								</div>\
									<div id=\"id_panel_top\" class=\"block_elem\">\
									<canvas id=\"id_hor_ruler\" class=\"block_elem\"></canvas>\
									</div>\
                                    <div id=\"id_main_view\" class=\"block_elem\" style=\"touch-action:none;overflow:hidden\">\
                                        <canvas id=\"id_viewer\" class=\"block_elem\" style=\"touch-action:none;-ms-touch-action: none;-webkit-user-select: none; background-color:" + AscCommonWord.GlobalSkin.BackgroundColor + ";z-index:1\"></canvas>\
									    <canvas id=\"id_viewer_overlay\" class=\"block_elem\" style=\"touch-action:none;-ms-touch-action: none;-webkit-user-select: none; z-index:2\"></canvas>\
									    <canvas id=\"id_target_cursor\" class=\"block_elem\" width=\"1\" height=\"1\" style=\"touch-action:none;-ms-touch-action: none;-webkit-user-select: none;width:2px;height:13px;z-index:4;\"></canvas>\
                                    </div>\
								</div>\
									<div id=\"id_panel_right\" class=\"block_elem\" style=\"touch-action:none;margin-right:1px;background-color:" + AscCommonWord.GlobalSkin.BackgroundScroll + ";\">\
									<div id=\"id_buttonRulers\" class=\"block_elem buttonRuler\"></div>\
									<div id=\"id_vertical_scroll\" style=\"left:0;top:0px;width:14px;overflow:hidden;position:absolute;\">\
									<div id=\"panel_right_scroll\" class=\"block_elem\" style=\"left:0;top:0;width:1px;height:6000px;\"></div>\
									</div>\
									<div id=\"id_buttonPrevPage\" class=\"block_elem buttonPrevPage\"></div>\
									<div id=\"id_buttonNextPage\" class=\"block_elem buttonNextPage\"></div>\
								</div>\
									<div id=\"id_horscrollpanel\" class=\"block_elem\" style=\"touch-action:none;margin-bottom:1px;background-color:" + AscCommonWord.GlobalSkin.BackgroundScroll + ";\">\
									<div id=\"id_horizontal_scroll\" style=\"left:0px;top:0;height:14px;overflow:hidden;position:absolute;width:100%;\">\
										<div id=\"panel_hor_scroll\" class=\"block_elem\" style=\"left:0;top:0;width:6000px;height:1px;\"></div>\
									</div>\
									</div>" + this.HtmlElement.innerHTML);
	};

	asc_docs_api.prototype.GetCopyPasteDivId = function()
	{
		if (this.isMobileVersion)
			return this.WordControl.Name;
		return "";
	};

	asc_docs_api.prototype.ContentToHTML = function(bIsRet)
	{
		this.DocumentReaderMode            = new AscCommon.CDocumentReaderMode();

		this.WordControl.m_oLogicDocument.SelectAll();
		var text_data = {
			data : "",
			pushData : function(format, value) { this.data = value; }
		};

		this.asc_CheckCopy(text_data, 2);
		this.WordControl.m_oLogicDocument.RemoveSelection();

		return text_data.data;
	};

	asc_docs_api.prototype.InitEditor = function()
	{
		this.WordControl.m_oLogicDocument                    = new AscCommonWord.CDocument(this.WordControl.m_oDrawingDocument);
		this.WordControl.m_oDrawingDocument.m_oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!this.isSpellCheckEnable)
			this.WordControl.m_oLogicDocument.TurnOff_CheckSpelling();

		if (this.WordControl.MobileTouchManager)
			this.WordControl.MobileTouchManager.delegate.LogicDocument = this.WordControl.m_oLogicDocument;

		if (this.isRestrictionForms() || this.isRestrictionComments())
		{
			this.ShowParaMarks = false;
			this.WordControl.HideRulers();
		}
	};

	asc_docs_api.prototype.InitViewer = function()
	{
		this.WordControl.m_oDrawingDocument.m_oDocumentRenderer = new AscCommonWord.CDocMeta();
        this.WordControl.m_oDrawingDocument.m_oDocumentRenderer.Init();
		this.WordControl.m_oDrawingDocument.showTarget(false);
		this.WordControl.HideRulers();
	};

	asc_docs_api.prototype.OpenDocument = function(url, gObject)
	{
		this.isOnlyReaderMode = false;
		this.InitViewer();
		this.LoadedObject         = null;
		this.DocumentType         = 1;
		this.ServerIdWaitComplete = true;

		this.WordControl.m_oDrawingDocument.m_oDocumentRenderer.Load(url, gObject);
		this.FontLoader.LoadDocumentFonts(this.WordControl.m_oDrawingDocument.m_oDocumentRenderer.Fonts, true);
	};

	asc_docs_api.prototype.OpenDocument2 = function(url, gObject)
	{
		this.InitEditor();
		this.DocumentType   = 2;
		this.LoadedObjectDS = this.WordControl.m_oLogicDocument.CopyStyle();

		g_oIdCounter.Set_Load(true);
		AscFonts.IsCheckSymbols = true;

		var openParams        = {checkFileSize : /*this.isMobileVersion*/false, charCount : 0, parCount : 0};
		var oBinaryFileReader = new AscCommonWord.BinaryFileReader(this.WordControl.m_oLogicDocument, openParams);
		if (oBinaryFileReader.Read(gObject))
		{
			if (History && History.Update_FileDescription)
				History.Update_FileDescription(oBinaryFileReader.stream);

			g_oIdCounter.Set_Load(false);
			this.LoadedObject = 1;

			// проверяем какие шрифты нужны
            var StylesPainter = new AscCommonWord.CStylesPainter();
            StylesPainter.CheckStylesNames(this, this.LoadedObjectDS);

			this.WordControl.m_oDrawingDocument.CheckFontNeeds();
			AscCommon.pptx_content_loader.CheckImagesNeeds(this.WordControl.m_oLogicDocument);

			this.FontLoader.LoadDocumentFonts(this.WordControl.m_oLogicDocument.Fonts, false);
		}
		else
			editor.sendEvent("asc_onError", c_oAscError.ID.MobileUnexpectedCharCount, c_oAscError.Level.Critical);

		AscFonts.IsCheckSymbols = false;

		//callback
		editor.DocumentOrientation = (null == editor.WordControl.m_oLogicDocument) ? true : !editor.WordControl.m_oLogicDocument.Orientation;
		var sizeMM;
		if (editor.DocumentOrientation)
			sizeMM = DocumentPageSize.getSize(AscCommon.Page_Width, AscCommon.Page_Height);
		else
			sizeMM = DocumentPageSize.getSize(AscCommon.Page_Height, AscCommon.Page_Width);
		editor.sync_DocSizeCallback(sizeMM.w_mm, sizeMM.h_mm);
		editor.sync_PageOrientCallback(editor.get_DocumentOrientation());

		if (this.isMobileVersion)
		{
			AscCommon.AscBrowser.isSafariMacOs   = false;
			PasteElementsId.PASTE_ELEMENT_ID     = "wrd_pastebin";
			PasteElementsId.ELEMENT_DISPAY_STYLE = "none";
		}
	};
	// Callbacks
	/* все имена callback'оф начинаются с On. Пока сделаны:
	 OnBold,
	 OnItalic,
	 OnUnderline,
	 OnTextPrBaseline(возвращается расположение строки - supstring, superstring, baseline),
	 OnPrAlign(выравнивание по ширине, правому краю, левому краю, по центру),
	 OnListType( возвращается AscCommon.asc_CListType )

	 фейк-функции ожидающие TODO:
	 Print,Undo,Redo,Copy,Cut,Paste,Share,Save,Download & callbacks
	 OnFontName, OnFontSize, OnLineSpacing

	 OnFocusObject( возвращается массив asc_CSelectedObject )
	 OnInitEditorStyles( возвращается CStylesPainter )
	 OnSearchFound( возвращается CSearchResult );
	 OnParaSpacingLine( возвращается AscCommon.asc_CParagraphSpacing )
	 OnLineSpacing( не используется? )
	 OnTextColor( возвращается AscCommon.CColor )
	 OnTextHighLight( возвращается AscCommon.CColor )
	 OnInitEditorFonts( возвращается массив объектов СFont )
	 OnFontFamily( возвращается asc_CTextFontFamily )
	 */
	var _callbacks = {};

	asc_docs_api.prototype.asc_registerCallback = function(name, callback)
	{
		if (!_callbacks.hasOwnProperty(name))
			_callbacks[name] = [];
		_callbacks[name].push(callback);
	};

	asc_docs_api.prototype.asc_unregisterCallback = function(name, callback)
	{
		if (_callbacks.hasOwnProperty(name))
		{
			for (var i = _callbacks[name].length - 1; i >= 0; --i)
			{
				if (_callbacks[name][i] == callback)
					_callbacks[name].splice(i, 1);
			}
		}
	};

	asc_docs_api.prototype.asc_checkNeedCallback = function(name)
	{
		return _callbacks.hasOwnProperty(name);
	};

	// тут методы, замены евентов
	asc_docs_api.prototype.get_PropertyThemeColors       = function()
	{
		return [this._gui_control_colors.Colors, this._gui_control_colors.StandartColors];
	};
	// -------

	// GoTo
	asc_docs_api.prototype.goTo = function(action)
	{
		if (this.WordControl && this.WordControl.m_oLogicDocument && action)
		{
			switch (action["type"])
			{
				case "bookmark":
				{
					this.WordControl.m_oLogicDocument.GoToBookmark(action["data"], true);
					break;
				}
				case "comment":
				{
					var commentId = this.WordControl.m_oLogicDocument.Comments.GetCommentIdByGuid(action["data"]);
					if (commentId) {
						this.asc_selectComment(commentId);
						this.asc_showComment(commentId);
					}
					break;
				}
				default:
					break;
			}
		}
	};

	/////////////////////////////////////////////////////////////////////////
	///////////////////CoAuthoring and Chat api//////////////////////////////
	/////////////////////////////////////////////////////////////////////////
	// Init CoAuthoring
	asc_docs_api.prototype._coAuthoringSetChange = function(change, oColor)
	{
		var oChange = new AscCommon.CCollaborativeChanges();
		oChange.Set_Data(change);
		oChange.Set_Color(oColor);
		AscCommon.CollaborativeEditing.Add_Changes(oChange);
	};

	asc_docs_api.prototype._coAuthoringSetChanges = function(e, oColor)
	{
		var Count = e.length;
		for (var Index = 0; Index < Count; ++Index)
			this._coAuthoringSetChange(e[Index], oColor);
	};

	asc_docs_api.prototype._coAuthoringInitEnd = function()
	{
		var t                                        = this;
		this.CoAuthoringApi.onCursor                 = function(e)
		{
			if (true === AscCommon.CollaborativeEditing.Is_Fast())
			{
				t.WordControl.m_oLogicDocument.Update_ForeignCursor(e[e.length - 1]['cursor'], e[e.length - 1]['user'], true, e[e.length - 1]['useridoriginal']);
			}
		};
		this.CoAuthoringApi.onConnectionStateChanged = function(e)
		{
			if (true === AscCommon.CollaborativeEditing.Is_Fast() && false === e['state'])
			{
				t.WordControl.m_oLogicDocument.Remove_ForeignCursor(e['id']);
			}
			t.sendEvent("asc_onConnectionStateChanged", e);
		};
		this.CoAuthoringApi.onLocksAcquired          = function(e)
		{
			if (t._coAuthoringCheckEndOpenDocument(t.CoAuthoringApi.onLocksAcquired, e))
			{
				return;
			}

			if (2 != e["state"])
			{
				var Id    = e["block"];
				var Class = g_oTableId.Get_ById(Id);
				if (null != Class)
				{
					var Lock = Class.Lock;

					// Выставляем ID пользователя, залочившего данный элемент
					Lock.Set_UserId(e["user"]);

					var OldType = Class.Lock.Get_Type();
					if (locktype_Other2 === OldType || locktype_Other3 === OldType)
					{
						Lock.Set_Type(locktype_Other3, true);
					}
					else
					{
						Lock.Set_Type(locktype_Other, true);
					}

					if (Class instanceof AscCommonWord.CHeaderFooterController)
					{
						t.sync_LockHeaderFooters();
					}
					else if (Class instanceof AscCommonWord.CDocument)
					{
						t.sync_LockDocumentProps();
					}
					else if (Class instanceof AscCommon.CComment)
					{
						t.sync_LockComment(Class.Get_Id(), e["user"]);
					}
					else if (Class instanceof AscCommonWord.CGraphicObjects)
					{
						t.sync_LockDocumentSchema();
					}
					else if(Class instanceof AscCommon.CCore)
                    {
                        editor.sendEvent("asc_onLockCore", true);
                    }
					// Теперь обновлять состояние необходимо, чтобы обновить локи в режиме рецензирования.
					t.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();
				}
				else
				{
					AscCommon.CollaborativeEditing.Add_NeedLock(Id, e["user"]);
				}
			}
		};
		this.CoAuthoringApi.onLocksReleased          = function(e, bChanges)
		{
			if (t._coAuthoringCheckEndOpenDocument(t.CoAuthoringApi.onLocksReleased, e, bChanges))
			{
				return;
			}

			var Id    = e["block"];
			var Class = g_oTableId.Get_ById(Id);
			if (null != Class)
			{
				var Lock = Class.Lock;
				if ("undefined" != typeof(Lock))
				{
					var CurType = Lock.Get_Type();

					var NewType = locktype_None;

					if (CurType === locktype_Other)
					{
						if (true != bChanges)
						{
							NewType = locktype_None;
						}
						else
						{
							NewType = locktype_Other2;
							AscCommon.CollaborativeEditing.Add_Unlock(Class);
						}
					}
					else if (CurType === locktype_Mine)
					{
						// Такого быть не должно
						NewType = locktype_Mine;
					}
					else if (CurType === locktype_Other2 || CurType === locktype_Other3)
					{
						NewType = locktype_Other2;
					}

					Lock.Set_Type(NewType, true);

					// Теперь обновлять состояние необходимо, чтобы обновить локи в режиме рецензирования.
					t.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();

					if (Class instanceof AscCommonWord.CHeaderFooterController)
					{
						if (NewType !== locktype_Mine && NewType !== locktype_None)
						{
							t.sync_LockHeaderFooters();
						}
						else
						{
							t.sync_UnLockHeaderFooters();
						}
					}
					else if (Class instanceof AscCommonWord.CDocument)
					{
						if (NewType !== locktype_Mine && NewType !== locktype_None)
						{
							t.sync_LockDocumentProps();
						}
						else
						{
							t.sync_UnLockDocumentProps();
						}
					}
					else if (Class instanceof AscCommon.CComment)
					{
						if (NewType !== locktype_Mine && NewType !== locktype_None)
						{
							t.sync_LockComment(Class.Get_Id(), e["user"]);
						}
						else
						{
							t.sync_UnLockComment(Class.Get_Id());
						}
					}
					else if (Class instanceof AscCommonWord.CGraphicObjects)
					{
						if (NewType !== locktype_Mine && NewType !== locktype_None)
						{
							t.sync_LockDocumentSchema();
						}
						else
						{
							t.sync_UnLockDocumentSchema();
						}
					}
					else if(Class instanceof AscCommon.CCore)
					{
						if (NewType !== locktype_Mine && NewType !== locktype_None)
						{
							editor.sendEvent("asc_onLockCore", true);
						}
						else
						{
							editor.sendEvent("asc_onLockCore", false);
						}
					}
				}
			}
			else
			{
				AscCommon.CollaborativeEditing.Remove_NeedLock(Id);
			}
		};
		this.CoAuthoringApi.onSaveChanges            = function(e, userId, bFirstLoad)
		{
			var bUseColor;
			if (bFirstLoad)
			{
				bUseColor = -1 === AscCommon.CollaborativeEditing.m_nUseType;
			}
			if (t.CollaborativeMarksShowType === c_oAscCollaborativeMarksShowType.None)
			{
				bUseColor = false;
			}

			var oCommonColor = AscCommon.getUserColorById(userId, null, false, false);
			var oColor       = false === bUseColor ? null : oCommonColor;
			t._coAuthoringSetChange(e, oColor);
			// т.е. если bSendEvent не задан, то посылаем  сообщение + когда загрузился документ
			if (!bFirstLoad && t.bInit_word_control)
			{
				t.sync_CollaborativeChanges();
			}
		};
		this.CoAuthoringApi.onRecalcLocks            = function(e)
		{
			if (e && true === AscCommon.CollaborativeEditing.Is_Fast())
			{
				var CursorInfo = JSON.parse(e);
				AscCommon.CollaborativeEditing.Add_ForeignCursorToUpdate(CursorInfo.UserId, CursorInfo.CursorInfo, CursorInfo.UserShortId);
			}
		};
	};

	asc_docs_api.prototype.startCollaborationEditing = function()
		{
		AscCommon.CollaborativeEditing.Start_CollaborationEditing();
		if (this.WordControl && this.WordControl.m_oLogicDocument)
		{
			this.WordControl.m_oLogicDocument.StartCollaborationEditing();
			}
		this.asc_setDrawCollaborationMarks(true);
		if(window['AscCommon'].g_specialPasteHelper && AscCommon.CollaborativeEditing.m_bFast)
		{
						window['AscCommon'].g_specialPasteHelper.SpecialPasteButton_Hide();
					}
		};
	asc_docs_api.prototype.endCollaborationEditing = function()
		{
		AscCommon.CollaborativeEditing.End_CollaborationEditing();
		this.asc_setDrawCollaborationMarks(false);
		};

	//----------------------------------------------------------------------------------------------------------------------
	// SpellCheck_CallBack
	//          Функция ответа от сервера.
	//----------------------------------------------------------------------------------------------------------------------
	asc_docs_api.prototype.SpellCheck_CallBack = function(Obj)
	{
		if (undefined != Obj && undefined != Obj["ParagraphId"])
		{
			var ParaId    = Obj["ParagraphId"];
			var Paragraph = g_oTableId.Get_ById(ParaId);
			var Type      = Obj["type"];
			if (null != Paragraph)
			{
				if ("spell" === Type)
				{
					Paragraph.SpellChecker.Check_CallBack(Obj["RecalcId"], Obj["usrCorrect"]);
					Paragraph.ReDraw();
				}
				else if ("suggest" === Type)
				{
					Paragraph.SpellChecker.Check_CallBack2(Obj["RecalcId"], Obj["ElementId"], Obj["usrSuggest"]);
					this.sync_SpellCheckVariantsFound();
				}
			}
		}
	};

	asc_docs_api.prototype._spellCheckDisconnect   = function()
	{
		if (this.WordControl.m_oLogicDocument)
			this.WordControl.m_oLogicDocument.TurnOff_CheckSpelling();
	};
	asc_docs_api.prototype._onUpdateDocumentCanSave   = function()
	{
		var CollEditing = AscCommon.CollaborativeEditing;

		// Можно модифицировать это условие на более быстрое (менять самим состояние в аргументах, а не запрашивать каждый раз)
		var isCanSave = this.isDocumentModified() || (true !== CollEditing.Is_SingleUser() && 0 !== CollEditing.getOwnLocksLength());

		if (true === CollEditing.Is_Fast() && true !== CollEditing.Is_SingleUser())
			isCanSave = false;

		if (isCanSave !== this.isDocumentCanSave)
		{
			this.isDocumentCanSave = isCanSave;
			this.sendEvent('asc_onDocumentCanSaveChanged', this.isDocumentCanSave);
		}
	};
	asc_docs_api.prototype._onUpdateDocumentCanUndoRedo = function ()
	{
		if (this.WordControl && this.WordControl.m_oLogicDocument)
			this.WordControl.m_oLogicDocument.Document_UpdateUndoRedoState();
	};

	// get functions
	// Возвращает
	//{
	// ParaPr :
	// {
	//    ContextualSpacing : false,            // Удалять ли интервал между параграфами одинакового стиля
	//
	//    Ind :
	//    {
	//        Left      : 0,                    // Левый отступ
	//        Right     : 0,                    // Правый отступ
	//        FirstLine : 0                     // Первая строка
	//    },
	//
	//    Jc : align_Left,                      // Прилегание параграфа
	//
	//    KeepLines : false,                    // переносить параграф на новую страницу,
	//                                          // если на текущей он целиком не убирается
	//    KeepNext  : false,                    // переносить параграф вместе со следующим параграфом
	//
	//    PageBreakBefore : false,              // начинать параграф с новой страницы
	//
	//    Spacing :
	//    {
	//        Line     : 1.15,                  // Расстояние между строками внутри абзаца
	//        LineRule : linerule_Auto,         // Тип расстрояния между строками
	//        Before   : 0,                     // Дополнительное расстояние до абзаца
	//        After    : 10 * g_dKoef_pt_to_mm  // Дополнительное расстояние после абзаца
	//    },
	//
	//    Shd :
	//    {
	//        Value : shd_Nil,
	//        Color :
	//        {
	//            r : 255,
	//            g : 255,
	//            b : 255
	//        }
	//    },
	//
	//    WidowControl : true,                  // Запрет висячих строк
	//
	//    Tabs : []
	// },
	//
	// TextPr :
	// {
	//    Bold       : false,
	//    Italic     : false,
	//    Underline  : false,
	//    Strikeout  : false,
	//    FontFamily :
	//    {
	//        Name  : "Times New Roman",
	//        Index : -1
	//    },
	//    FontSize   : 12,
	//    Color      :
	//    {
	//        r : 0,
	//        g : 0,
	//        b : 0
	//    },
	//    VertAlign : vertalign_Baseline,
	//    HighLight : highlight_None
	// }
	//}


	asc_docs_api.prototype.put_FramePr = function(Obj)
	{
		if (undefined != Obj.FontFamily)
		{
			var loader     = AscCommon.g_font_loader;
			var fontinfo   = g_fontApplication.GetFontInfo(Obj.FontFamily);
			var isasync    = loader.LoadFont(fontinfo, editor.asyncFontEndLoaded_DropCap, Obj);
			Obj.FontFamily = new asc_CTextFontFamily({Name : fontinfo.Name, Index : -1});

			if (false === isasync)
			{
				if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
				{
					this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetFramePrWithFontFamily);
					this.WordControl.m_oLogicDocument.SetParagraphFramePr(Obj);
					this.WordControl.m_oLogicDocument.FinalizeAction();
				}
			}
		}
		else
		{
			if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
			{
				this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetFramePr);
				this.WordControl.m_oLogicDocument.SetParagraphFramePr(Obj);
				this.WordControl.m_oLogicDocument.FinalizeAction();
			}
		}
	};



	asc_docs_api.prototype.asyncFontEndLoaded_DropCap = function(Obj)
	{
		this.sync_EndAction(c_oAscAsyncActionType.Information, c_oAscAsyncAction.LoadFont);
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetFramePrWithFontFamilyLong);
			this.WordControl.m_oLogicDocument.SetParagraphFramePr(Obj);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
		// отжать заморозку меню
	};

	asc_docs_api.prototype.asc_addDropCap = function(bInText)
	{
		this.WordControl.m_oLogicDocument.AddDropCap(bInText);
	};

	asc_docs_api.prototype.removeDropcap = function(bDropCap)
	{
		this.WordControl.m_oLogicDocument.RemoveDropCap(bDropCap);
	};

	asc_docs_api.prototype.get_TextProps = function()
	{
		var Doc    = this.WordControl.m_oLogicDocument;
		var ParaPr = Doc.GetCalculatedParaPr();
		var TextPr = Doc.GetCalculatedTextPr();

		// return { ParaPr: ParaPr, TextPr : TextPr };
		return new Asc.CParagraphAndTextProp(ParaPr, TextPr);	// uncomment if this method will be used externally. 20/03/2012 uncommented for testers
	};

	// -------
	asc_docs_api.prototype.GetJSONLogicDocument = function()
	{
		return JSON.stringify(this.WordControl.m_oLogicDocument);
	};

	asc_docs_api.prototype.get_ContentCount = function()
	{
		return this.WordControl.m_oLogicDocument.Content.length;
	};

	asc_docs_api.prototype.select_Element = function(Index)
	{
		var Document = this.WordControl.m_oLogicDocument;

		if (true === Document.Selection.Use)
			Document.RemoveSelection();

		Document.DrawingDocument.SelectEnabled(true);
		Document.DrawingDocument.TargetEnd();

		Document.Selection.Use   = true;
		Document.Selection.Start = false;
		Document.Selection.Flag  = AscCommon.selectionflag_Common;

		Document.Selection.StartPos = Index;
		Document.Selection.EndPos   = Index;

		Document.Content[Index].Selection.Use      = true;
		Document.Content[Index].Selection.StartPos = Document.Content[Index].Internal_GetStartPos();
		Document.Content[Index].Selection.EndPos   = Document.Content[Index].Content.length - 1;

		Document.Selection_Draw();
	};

	asc_docs_api.prototype.UpdateTextPr        = function(TextPr)
	{
		if ("undefined" != typeof(TextPr))
		{
			this.sync_BoldCallBack(TextPr.Bold);
			this.sync_ItalicCallBack(TextPr.Italic);
			this.sync_UnderlineCallBack(TextPr.Underline);
			this.sync_StrikeoutCallBack(TextPr.Strikeout);
			this.sync_TextPrFontSizeCallBack(TextPr.FontSize);
			this.sync_TextPrFontFamilyCallBack(TextPr.FontFamily);
			this.sync_VerticalAlign(TextPr.VertAlign);
			this.sync_TextHighLight(TextPr.HighLight);
			this.sync_TextSpacing(TextPr.Spacing);
			this.sync_TextDStrikeout(TextPr.DStrikeout);
			this.sync_TextCaps(TextPr.Caps);
			this.sync_TextSmallCaps(TextPr.SmallCaps);
			this.sync_TextPosition(TextPr.Position);
			this.sync_TextLangCallBack(TextPr.Lang);
			this.sync_TextColor(TextPr);

			if (this.isMobileVersion)
				this.sendEvent("asc_onTextShd", new Asc.asc_CParagraphShd(TextPr.Shd));
		}
	};
	asc_docs_api.prototype.UpdateParagraphProp = function(ParaPr)
	{
		//if ( true === CollaborativeEditing.Get_GlobalLock() )
		//{
		//    ParaPr.Locked      = true;
		//    ParaPr.CanAddTable = false;
		//}

		// var prgrhPr = this.get_TextProps();
		// var prProp = {};
		// prProp.Ind = prgrhPr.ParaPr.Ind;
		// prProp.ContextualSpacing = prgrhPr.ParaPr.ContextualSpacing;
		// prProp.Spacing = prgrhPr.ParaPr.Spacing;
		// prProp.PageBreakBefore = prgrhPr.ParaPr.PageBreakBefore;
		// prProp.KeepLines = prgrhPr.ParaPr.KeepLines;

		// {
		//    ContextualSpacing : false,            // Удалять ли интервал между параграфами одинакового стиля
		//
		//    Ind :
		//    {
		//        Left      : 0,                    // Левый отступ
		//        Right     : 0,                    // Правый отступ
		//        FirstLine : 0                     // Первая строка
		//    },
		//    Jc : align_Left,                      // Прилегание параграфа
		//    KeepLines : false,                    // переносить параграф на новую страницу,
		//                                          // если на текущей он целиком не убирается
		//    PageBreakBefore : false,              // начинать параграф с новой страницы
		//
		//    Spacing :
		//    {
		//        Line     : 1.15,                  // Расстояние между строками внутри абзаца
		//        LineRule : linerule_Auto,         // Тип расстрояния между строками
		//        Before   : 0,                     // Дополнительное расстояние до абзаца
		//        After    : 10 * g_dKoef_pt_to_mm  // Дополнительное расстояние после абзаца
		//    }
		//	}

		// TODO: как только разъединят настройки параграфа и текста переделать тут
		var TextPr         = editor.WordControl.m_oLogicDocument.GetCalculatedTextPr();
		ParaPr.Subscript   = TextPr.VertAlign === AscCommon.vertalign_SubScript;
		ParaPr.Superscript = TextPr.VertAlign === AscCommon.vertalign_SuperScript;
		ParaPr.Strikeout   = TextPr.Strikeout;
		ParaPr.DStrikeout  = TextPr.DStrikeout;
		ParaPr.AllCaps     = TextPr.Caps;
		ParaPr.SmallCaps   = TextPr.SmallCaps;
		ParaPr.TextSpacing = TextPr.Spacing;
		ParaPr.Position    = TextPr.Position;
		//-----------------------------------------------------------------------------

		if (true === ParaPr.Spacing.AfterAutoSpacing)
			ParaPr.Spacing.After = AscCommonWord.spacing_Auto;
		else if (undefined === ParaPr.Spacing.AfterAutoSpacing)
			ParaPr.Spacing.After = AscCommonWord.UnknownValue;

		if (true === ParaPr.Spacing.BeforeAutoSpacing)
			ParaPr.Spacing.Before = AscCommonWord.spacing_Auto;
		else if (undefined === ParaPr.Spacing.BeforeAutoSpacing)
			ParaPr.Spacing.Before = AscCommonWord.UnknownValue;

		if (-1 === ParaPr.PStyle)
			ParaPr.StyleName = "";
		else if (undefined === ParaPr.PStyle || undefined === this.WordControl.m_oLogicDocument.Styles.Style[ParaPr.PStyle])
			ParaPr.StyleName = this.WordControl.m_oLogicDocument.Styles.Style[this.WordControl.m_oLogicDocument.Styles.Get_Default_Paragraph()].Name;
		else
			ParaPr.StyleName = this.WordControl.m_oLogicDocument.Styles.Style[ParaPr.PStyle].Name;

		var NumType    = -1;
		var NumSubType = -1;
		if (!(null == ParaPr.NumPr || 0 === ParaPr.NumPr.NumId || "0" === ParaPr.NumPr.NumId))
		{
			var oNum = this.WordControl.m_oLogicDocument.GetNumbering().GetNum(ParaPr.NumPr.NumId);

			if (oNum && oNum.GetLvl(ParaPr.NumPr.Lvl))
			{
				var res    = oNum.GetLvl(ParaPr.NumPr.Lvl).GetPresetType();
				NumType    = res.Type;
				NumSubType = res.SubType;
			}
		}

		ParaPr.ListType = {Type : NumType, SubType : NumSubType};

		if (undefined !== ParaPr.FramePr && undefined !== ParaPr.FramePr.Wrap)
		{
			if (AscCommonWord.wrap_NotBeside === ParaPr.FramePr.Wrap)
				ParaPr.FramePr.Wrap = false;
			else if (AscCommonWord.wrap_Around === ParaPr.FramePr.Wrap)
				ParaPr.FramePr.Wrap = true;
			else
				ParaPr.FramePr.Wrap = undefined;
		}

		this.sync_ParaSpacingLine(ParaPr.Spacing);
		this.Update_ParaInd(ParaPr.Ind);
		this.sync_PrAlignCallBack(ParaPr.Jc);
		this.sync_ParaStyleName(ParaPr.StyleName);
		this.sync_ListType(ParaPr.ListType);
		this.sync_PrPropCallback(ParaPr);
	};

	/*----------------------------------------------------------------*/
	/*functions for working with clipboard, document*/
	asc_docs_api.prototype._printDesktop = function (options)
	{
		if (null != this.WordControl.m_oDrawingDocument.m_oDocumentRenderer)
		{
			if (window["AscDesktopEditor"]["IsSupportNativePrint"](this.DocumentUrl) === true)
			{
				window["AscDesktopEditor"]["Print"]();
				return true;
			}
		}
		else
		{
			var opt = {};
			if (options && options.advancedOptions && options.advancedOptions && (Asc.c_oAscPrintType.Selection === options.advancedOptions.asc_getPrintType()))
			{
				opt["printOptions"] = { "selection" : 1 };
			}

			window["AscDesktopEditor"]["Print"](JSON.stringify(opt));
			return true;
		}
		return true;
	};
	asc_docs_api.prototype.Undo           = function()
	{
		this.WordControl.m_oLogicDocument.Document_Undo();
	};
	asc_docs_api.prototype.Redo           = function()
	{
		this.WordControl.m_oLogicDocument.Document_Redo();
	};
	asc_docs_api.prototype.Copy           = function()
	{
		if (window["AscDesktopEditor"])
		{
		    window["asc_desktop_copypaste"](this, "Copy");
			return true;
		}
		return AscCommon.g_clipboardBase.Button_Copy();
	};
	asc_docs_api.prototype.Update_ParaTab = function(Default_Tab, ParaTabs)
	{
		this.WordControl.m_oDrawingDocument.Update_ParaTab(Default_Tab, ParaTabs);
	};
	asc_docs_api.prototype.Cut            = function()
	{
		if (window["AscDesktopEditor"])
		{
		    window["asc_desktop_copypaste"](this, "Cut");
			return true;
		}
		return AscCommon.g_clipboardBase.Button_Cut();
	};
	asc_docs_api.prototype.Paste          = function()
	{
		if (window["AscDesktopEditor"])
		{
		    window["asc_desktop_copypaste"](this, "Paste");
			return true;
		}
		if (!this.WordControl.m_oLogicDocument)
			return false;

		if (AscCommon.g_clipboardBase.IsWorking())
			return false;

		return AscCommon.g_clipboardBase.Button_Paste();
	};

	asc_docs_api.prototype.Share = function()
	{

	};

	asc_docs_api.prototype.asc_CheckCopy = function(_clipboard /* CClipboardData */, _formats)
	{
		if (!this.WordControl.m_oLogicDocument)
		{
			var _text_object = (AscCommon.c_oAscClipboardDataFormat.Text & _formats) ? {Text : ""} : null;
			var _html_data   = this.WordControl.m_oDrawingDocument.m_oDocumentRenderer.Copy(_text_object);

			//TEXT
			if (AscCommon.c_oAscClipboardDataFormat.Text & _formats)
			{
				_clipboard.pushData(AscCommon.c_oAscClipboardDataFormat.Text, _text_object.Text);
			}
			//HTML
			if (AscCommon.c_oAscClipboardDataFormat.Html & _formats)
			{
				_clipboard.pushData(AscCommon.c_oAscClipboardDataFormat.Html, _html_data);
			}
			return;
		}

		var sBase64 = null, _data;
		var checkData = function(data) {
			return 	"" === data ? null : data;
		};

		//TEXT
		if (AscCommon.c_oAscClipboardDataFormat.Text & _formats)
		{
			_data = this.WordControl.m_oLogicDocument.GetSelectedText(false, {NewLineParagraph : true});
			_clipboard.pushData(AscCommon.c_oAscClipboardDataFormat.Text, checkData(_data))
		}
		//HTML
		if (AscCommon.c_oAscClipboardDataFormat.Html & _formats)
		{
			var oCopyProcessor = new AscCommon.CopyProcessor(this);
			sBase64            = oCopyProcessor.Start();
			_data              = oCopyProcessor.getInnerHtml();

			_clipboard.pushData(AscCommon.c_oAscClipboardDataFormat.Html, checkData(_data))
		}
		//INTERNAL
		if (AscCommon.c_oAscClipboardDataFormat.Internal & _formats)
		{
			if (sBase64 === null)
			{
				if(window["NATIVE_EDITOR_ENJINE"])
				{
					var oCopyProcessor = new AscCommon.CopyProcessor(this, true);
					sBase64 = oCopyProcessor.getSelectedBinary();
				}
				else
				{
					var oCopyProcessor = new AscCommon.CopyProcessor(this);
					sBase64 = oCopyProcessor.Start();
				}
			}

			_data = sBase64;
			_clipboard.pushData(AscCommon.c_oAscClipboardDataFormat.Internal, checkData(_data))
		}
	};

	asc_docs_api.prototype.asc_SelectionCut = function()
	{
	    if (AscCommon.CollaborativeEditing.Get_GlobalLock())
    	    return;

		var _logicDoc = this.WordControl.m_oLogicDocument;
		if (!_logicDoc || _logicDoc.IsSelectionEmpty(true))
			return;

		if (false === _logicDoc.Document_Is_SelectionLocked(AscCommon.changestype_Remove))
		{
			_logicDoc.StartAction(AscDFH.historydescription_Cut);
			_logicDoc.Remove(-1, true, true); // -1 - нормальное удаление  (например, для таблиц)
			_logicDoc.UpdateSelection();
			_logicDoc.FinalizeAction();
		}
	};

	asc_docs_api.prototype.asc_PasteData = function(_format, data1, data2, text_data, useCurrentPoint, callback)
	{
	    if (AscCommon.CollaborativeEditing.Get_GlobalLock())
	        return;

		var _logicDoc = this.WordControl.m_oLogicDocument;
		if (!_logicDoc)
			return;

		if (false === _logicDoc.Document_Is_SelectionLocked(changestype_Paragraph_Content, null, true, false))
		{
			window['AscCommon'].g_specialPasteHelper.Paste_Process_Start(arguments[5]);
			
			if (!useCurrentPoint) {
				_logicDoc.StartAction(AscDFH.historydescription_Document_PasteHotKey);
			}

			AscCommon.Editor_Paste_Exec(this, _format, data1, data2, text_data, undefined, callback);

			if (!useCurrentPoint) {
				//_logicDoc.FinalizeAction();
			}
		}
	};

	asc_docs_api.prototype._finalizeAction = function()
	{
		var _logicDoc = this.WordControl.m_oLogicDocument;
		if (!_logicDoc){
			return;
		}
		_logicDoc.FinalizeAction();
	};
	
	asc_docs_api.prototype.asc_SpecialPaste = function(props) 
	{
		return AscCommon.g_specialPasteHelper.Special_Paste(props);
	};
	
	asc_docs_api.prototype.asc_SpecialPasteData = function(props) 
	{
		if (AscCommon.CollaborativeEditing.Get_GlobalLock())
	        return;

		var _logicDoc = this.WordControl.m_oLogicDocument;
		if (!_logicDoc)
			return;
		
		//TODO пересмотреть проверку лока и добавление новой точки(AscDFH.historydescription_Document_PasteHotKey)
		if (false === _logicDoc.Document_Is_SelectionLocked(changestype_Paragraph_Content, null, true, false))
		{
			window['AscCommon'].g_specialPasteHelper.Paste_Process_Start();
			window['AscCommon'].g_specialPasteHelper.Special_Paste_Start();
			
			//undo previous action
			this.WordControl.m_oLogicDocument.Document_Undo();
			
			_logicDoc.StartAction(AscDFH.historydescription_Document_PasteHotKey);
			AscCommon.Editor_Paste_Exec(this, null, null, null, null, props);
			_logicDoc.FinalizeAction();
		}
	};
	
	asc_docs_api.prototype.asc_specialPasteShowButton = function()
	{
		var specialPasteHelper = window['AscCommon'].g_specialPasteHelper;
		//при быстром совместном редактировании отключаем возможность специальной вставки
		if(!specialPasteHelper || specialPasteHelper.CheckFastCoEditing())
		{
			return;
		}

		var specialPasteShowOptions = specialPasteHelper.buttonInfo ? specialPasteHelper.buttonInfo : null;
		if(specialPasteShowOptions && null !== specialPasteHelper.showButtonIdParagraph)
		{
			var isUpdate = specialPasteShowOptions.cellCoord;
			var id       = specialPasteHelper.showButtonIdParagraph;
			var elem     = g_oTableId.Get_ById(id);

			var _X       = elem.X;
			var _Y       = elem.Y;
			var _PageNum = elem.GetCurrentPageAbsolute();
			var oBounds  = elem.GetSelectionBounds(true);
			if (oBounds && oBounds.End)
			{
				_X       = oBounds.End.X + oBounds.End.W;
				_Y       = oBounds.End.Y + oBounds.End.H;
				_PageNum = oBounds.End.Page;
			}

			var oTransform = elem.Get_ParentTextTransform();
			if (oTransform)
			{
				var __X = oTransform.TransformPointX(_X, _Y);
				var __Y = oTransform.TransformPointY(_X, _Y);

				_X = __X;
				_Y = __Y;
			}

			specialPasteHelper.buttonInfo.fixPosition = {x : _X, y : _Y, pageNum : _PageNum};

			var _coord   = this.WordControl.m_oLogicDocument.DrawingDocument.ConvertCoordsToCursorWR(_X, _Y, _PageNum);
			var curCoord = new AscCommon.asc_CRect(_coord.X, _coord.Y, 0, 0);
			specialPasteShowOptions.asc_setCellCoord(curCoord);

			if (isUpdate)
			{
				specialPasteShowOptions.options = [];
				this.asc_UpdateSpecialPasteButton(specialPasteShowOptions);
			}
			else
			{
				this.asc_ShowSpecialPasteButton(specialPasteShowOptions);
			}
		}

		specialPasteHelper.showButtonIdParagraph = null;
		return true;
	};

	asc_docs_api.prototype.asc_ShowSpecialPasteButton = function(props)
	{
		this.sendEvent("asc_onShowSpecialPasteOptions", props);
	};
	
	asc_docs_api.prototype.asc_HideSpecialPasteButton = function() 
	{
		this.sendEvent("asc_onHideSpecialPasteOptions");
	};
	
	asc_docs_api.prototype.asc_UpdateSpecialPasteButton = function()
	{
		var pasteHepler = AscCommon.g_specialPasteHelper;
		if(!pasteHepler)
		{
			return;
		}

		var props;
		if(pasteHepler.buttonInfo && pasteHepler.buttonInfo.fixPosition)
		{
			props = pasteHepler.buttonInfo;

			var _Y = props.fixPosition.y;
			var _X = props.fixPosition.x;
			var _PageNum = props.fixPosition.pageNum;

			var _coord = this.WordControl.m_oLogicDocument.DrawingDocument.ConvertCoordsToCursorWR(_X, _Y, _PageNum);
			var curCoord = new AscCommon.asc_CRect( _coord.X, _coord.Y, 0, 0 );
			props.asc_setCellCoord(curCoord);
		}

		if(props)
		{
			this.sendEvent("asc_onShowSpecialPasteOptions", props);
		}
	};

    asc_docs_api.prototype.beginInlineDropTarget = function(e)
    {
    	if (this.WordControl.m_oLogicDocument && this.WordControl.m_oDrawingDocument)
		{
			this.WordControl.m_oDrawingDocument.StartTrackText();
            this.WordControl.StartUpdateOverlay();
			this.WordControl.onMouseMove(e);
            this.WordControl.EndUpdateOverlay();
		}
    };
    asc_docs_api.prototype.endInlineDropTarget = function(e)
    {
        if (this.WordControl.m_oLogicDocument && this.WordControl.m_oDrawingDocument)
        {
            this.WordControl.m_oDrawingDocument.EndTrackText(true);
        }
    };
	
	asc_docs_api.prototype._onSaveCallbackInner = function()
	{
		var t = this;
		History.CheckUnionLastPoints();
		if (c_oAscCollaborativeMarksShowType.LastChanges === this.CollaborativeMarksShowType)
		{
			AscCommon.CollaborativeEditing.Clear_CollaborativeMarks();
		}

		// Принимаем чужие изменения
		var HaveOtherChanges = AscCommon.CollaborativeEditing.Have_OtherChanges();
		AscCommon.CollaborativeEditing.Apply_Changes();

		this.CoAuthoringApi.onUnSaveLock = function()
		{
			t.CoAuthoringApi.onUnSaveLock = null;
			if (t.isForceSaveOnUserSave && t.IsUserSave) {
				t.forceSaveButtonContinue = t.forceSave();
			}

			// Выставляем, что документ не модифицирован
			t.CheckChangedDocument();
			t.canSave    = true;
			t.IsUserSave = false;
			if (!t.forceSaveButtonContinue) {
				t.sync_EndAction(c_oAscAsyncActionType.Information, c_oAscAsyncAction.Save);
			}

			// Обновляем состояние возможности сохранения документа
			t._onUpdateDocumentCanSave();

			if (undefined !== window["AscDesktopEditor"])
			{
				window["AscDesktopEditor"]["OnSave"]();
			}
			if (t.disconnectOnSave) {
				t.CoAuthoringApi.disconnect(t.disconnectOnSave.code, t.disconnectOnSave.reason);
				t.disconnectOnSave = null;
			}
			if(AscCommon.g_specialPasteHelper && !AscCommon.CollaborativeEditing.Is_SingleUser()){
				AscCommon.g_specialPasteHelper.SpecialPasteButton_Hide();
			}

			if (t.canUnlockDocument) {
				t._unlockDocument();
			}
		};

		var CursorInfo = null;
		if (true === AscCommon.CollaborativeEditing.Is_Fast())
		{
			CursorInfo = History.Get_DocumentPositionBinary();
		}

		if (this.forceSaveUndoRequest)
		{
			AscCommon.CollaborativeEditing.Set_GlobalLock(false);
			AscCommon.CollaborativeEditing.Undo();
			this.forceSaveUndoRequest = false;
		}
		else
		{
			// Пересылаем свои изменения
			AscCommon.CollaborativeEditing.Send_Changes(this.IsUserSave, {
				UserId      : this.CoAuthoringApi.getUserConnectionId(),
				UserShortId : this.DocInfo.get_UserId(),
				CursorInfo  : CursorInfo
			}, HaveOtherChanges, true);
		}
	};
	asc_docs_api.prototype._autoSaveInner = function () {
		var _curTime = new Date();
		if (null === this.lastSaveTime) {
			this.lastSaveTime = _curTime;
		}

		if (AscCommon.CollaborativeEditing.Is_Fast() && !AscCommon.CollaborativeEditing.Is_SingleUser()) {
			this.WordControl.m_oLogicDocument.Continue_FastCollaborativeEditing();
		} else {
			var _bIsWaitScheme = false;
			if (History.Points && History.Index >= 0 && History.Index < History.Points.length) {
				if ((_curTime - History.Points[History.Index].Time) < this.intervalWaitAutoSave) {
					_bIsWaitScheme = true;
				}
			}

			if (!_bIsWaitScheme) {
				var _interval = (AscCommon.CollaborativeEditing.m_nUseType <= 0) ? this.autoSaveGapSlow :
					this.autoSaveGapFast;

				if ((_curTime - this.lastSaveTime) > _interval) {
					if (History.Have_Changes(true) == true) {
						this.asc_Save(true);
					}
					this.lastSaveTime = _curTime;
				}
			}
		}
	};
	asc_docs_api.prototype._saveCheck = function() {
		return !this.isLongAction() &&
			!(this.WordControl.m_oLogicDocument && this.WordControl.m_oLogicDocument.IsViewModeInReview());
	};
	asc_docs_api.prototype._haveOtherChanges = function () {
		return AscCommon.CollaborativeEditing.Have_OtherChanges();
	};
	asc_docs_api.prototype.asc_DownloadOrigin = function(bIsDownloadEvent)
	{
		//скачивание оригинального pdf, djvu, xps
		var downloadType = bIsDownloadEvent ? DownloadType.Download : DownloadType.None;
		var rData        = {
			"c"     : 'pathurl',
			"title" : this.documentTitle,
			"data"  : 'origin.' + this.documentFormat
		};
		var t            = this;
		t.fCurCallback   = function(input)
		{
			if (null != input && "pathurl" == input["type"])
			{
				if ('ok' == input["status"])
				{
					var url = input["data"];
					if (url)
					{
						t.processSavedFile(url, downloadType);
					}
					else
					{
						t.handlers.trigger("asc_onError", c_oAscError.ID.Unknown, c_oAscError.Level.NoCritical);
					}
				}
				else
				{
					t.handlers.trigger("asc_onError", AscCommon.mapAscServerErrorToAscError(parseInt(input["data"])),
						c_oAscError.Level.NoCritical);
				}
			}
			else
			{
				t.handlers.trigger("asc_onError", c_oAscError.ID.Unknown, c_oAscError.Level.NoCritical);
			}
		};
		sendCommand(this, null, rData);
	};
	asc_docs_api.prototype.asc_DownloadAs     = function(options)
	{
		var actionType = this.mailMergeFileData ? c_oAscAsyncAction.MailMergeLoadFile : c_oAscAsyncAction.DownloadAs;
		this.downloadAs(actionType, options);
	};
	asc_docs_api.prototype.asc_DownloadAsMailMerge         = function(typeFile, StartIndex, EndIndex, bIsDownload)
	{
		var oDocumentMailMerge = this.WordControl.m_oLogicDocument.Get_MailMergedDocument(StartIndex, EndIndex);
		if (null != oDocumentMailMerge)
		{
			var actionType = null;
			var options = new Asc.asc_CDownloadOptions(typeFile, true);
			options.oDocumentMailMerge = oDocumentMailMerge;
			options.errorDirect = c_oAscError.ID.MailMergeSaveFile;
			if (bIsDownload) {
				actionType = Asc.c_oAscAsyncAction.DownloadMerge;
				options.isDownloadEvent = false;
			}
			this.downloadAs(actionType, options);
		}
		return null != oDocumentMailMerge;
	};
	asc_docs_api.prototype.Resize             = function()
	{
		if (false === this.bInit_word_control)
			return;
		this.WordControl.OnResize(false);
	};
	asc_docs_api.prototype.AddURL             = function(url)
	{

	};
	asc_docs_api.prototype.Help               = function()
	{

	};
	/*
	 idOption идентификатор дополнительного параметра, c_oAscAdvancedOptionsID.TXT.
	 option - какие свойства применить, пока массив. для TXT объект asc_CTextOptions(codepage)
	 exp:	asc_setAdvancedOptions(c_oAscAdvancedOptionsID.TXT, new Asc.asc_CTextOptions(1200) );
	 */
	asc_docs_api.prototype.asc_setAdvancedOptions       = function(idOption, option)
	{
		// Проверяем тип состояния в данный момент
		if (this.advancedOptionsAction !== c_oAscAdvancedOptionsAction.Open) {
			return;
		}
        if (AscCommon.EncryptionWorker.asc_setAdvancedOptions(this, idOption, option))
            return;

		switch (idOption)
		{
			case c_oAscAdvancedOptionsID.TXT:
				var rData = {
					"id"            : this.documentId,
					"userid"        : this.documentUserId,
					"format"        : this.documentFormat,
					"c"             : "reopen",
					"title"         : this.documentTitle,
					"codepage"      : option.asc_getCodePage(),
					"nobase64"      : true
				};
				sendCommand(this, null, rData);
				break;
			case c_oAscAdvancedOptionsID.DRM:
				var v = {
					"id": this.documentId,
					"userid": this.documentUserId,
					"format": this.documentFormat,
					"c": "reopen",
					"title": this.documentTitle,
					"password": option.asc_getPassword(),
					"nobase64": true
				};
				sendCommand(this, null, v);
				break;
		}
	};
	asc_docs_api.prototype.SetFontRenderingMode         = function(mode)
	{
		if (!this.isLoadFullApi)
		{
			this.tmpFontRenderingMode = mode;
			return;
		}

		if (c_oAscFontRenderingModeType.noHinting === mode)
            AscCommon.g_fontManager.SetHintsProps(false, false);
		else if (c_oAscFontRenderingModeType.hinting === mode)
            AscCommon.g_fontManager.SetHintsProps(true, false);
		else if (c_oAscFontRenderingModeType.hintingAndSubpixeling === mode)
            AscCommon.g_fontManager.SetHintsProps(true, true);

		this.WordControl.m_oDrawingDocument.ClearCachePages();

		if (AscCommon.g_fontManager2 !== undefined && AscCommon.g_fontManager2 !== null)
            AscCommon.g_fontManager2.ClearFontsRasterCache();

		if (this.bInit_word_control)
			this.WordControl.OnScroll();
	};
	asc_docs_api.prototype.processSavedFile             = function(url, downloadType)
	{
		var t = this;
		if (this.mailMergeFileData)
		{
			this.mailMergeFileData = null;
			AscCommon.loadFileContent(url, function(httpRequest)
			{
				if (null === httpRequest)
				{
					t.sendEvent("asc_onError", c_oAscError.ID.MailMergeLoadFile, c_oAscError.Level.NoCritical);
					return;
				}
				try
				{
					t.asc_StartMailMergeByList(JSON.parse(httpRequest.responseText));
				} catch (e)
				{
					t.sendEvent("asc_onError", c_oAscError.ID.MailMergeLoadFile, c_oAscError.Level.NoCritical);
				}
			});
		}
		else if (this.insertDocumentUrlsData && this.insertDocumentUrlsData.convertCallback)
		{
			this.insertDocumentUrlsData.convertCallback(this, url);
		}
		else
		{
			AscCommon.baseEditorsApi.prototype.processSavedFile.call(this, url, downloadType);
		}
	};
	asc_docs_api.prototype.endInsertDocumentUrls = function()
	{
		if (this.insertDocumentUrlsData) {
			this.insertDocumentUrlsData.endCallback(this);
			this.insertDocumentUrlsData = null;
			//this.sync_EndAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.DownloadAs);
		}
	};
	asc_docs_api.prototype.startGetDocInfo              = function()
	{
		/*
		 Возвращаем объект следующего вида:
		 {
		 PageCount: 12,
		 WordsCount: 2321,
		 ParagraphCount: 45,
		 SymbolsCount: 232345,
		 SymbolsWSCount: 34356
		 }
		 */
		this.sync_GetDocInfoStartCallback();

		if (null != this.WordControl.m_oDrawingDocument.m_oDocumentRenderer)
		{
			var _render = this.WordControl.m_oDrawingDocument.m_oDocumentRenderer;

			var obj = {
				PageCount      : _render.PagesCount,
				WordsCount     : _render.CountWords,
				ParagraphCount : _render.CountParagraphs,
				SymbolsCount   : _render.CountSymbols,
				SymbolsWSCount : (_render.CountSymbols + _render.CountSpaces)
			};

			this.sendEvent("asc_onDocInfo", new CDocInfoProp(obj));

			this.sync_GetDocInfoEndCallback();
		}
		else
		{
			this.WordControl.m_oLogicDocument.Statistics_Start();
		}
	};
	asc_docs_api.prototype.stopGetDocInfo               = function()
	{
		this.sync_GetDocInfoStopCallback();

		if (null != this.WordControl.m_oLogicDocument)
			this.WordControl.m_oLogicDocument.Statistics_Stop();
	};
	asc_docs_api.prototype.sync_DocInfoCallback         = function(obj)
	{
		this.sendEvent("asc_onDocInfo", new CDocInfoProp(obj));
	};
	asc_docs_api.prototype.sync_GetDocInfoStartCallback = function()
	{
		this.sendEvent("asc_onGetDocInfoStart");
	};
	asc_docs_api.prototype.sync_GetDocInfoStopCallback  = function()
	{
		this.sendEvent("asc_onGetDocInfoStop");
	};
	asc_docs_api.prototype.sync_GetDocInfoEndCallback   = function()
	{
		this.sendEvent("asc_onGetDocInfoEnd");
	};
	asc_docs_api.prototype.sync_CanUndoCallback         = function(bCanUndo)
	{
		this.sendEvent("asc_onCanUndo", bCanUndo);
	};
	asc_docs_api.prototype.sync_CanRedoCallback         = function(bCanRedo)
	{
		if (true === AscCommon.CollaborativeEditing.Is_Fast() && true !== AscCommon.CollaborativeEditing.Is_SingleUser())
			bCanRedo = false;

		this.sendEvent("asc_onCanRedo", bCanRedo);
	};

	asc_docs_api.prototype.can_CopyCut = function()
	{
		return this.WordControl.m_oLogicDocument.Can_CopyCut();
	};

	asc_docs_api.prototype.sync_CanCopyCutCallback = function(bCanCopyCut)
	{
		this.sendEvent("asc_onCanCopyCut", bCanCopyCut);
	};

	asc_docs_api.prototype.setStartPointHistory = function()
	{
		this.noCreatePoint  = true;
		this.exucuteHistory = true;
		this.incrementCounterLongAction();
		this.WordControl.m_oLogicDocument.TurnOff_InterfaceEvents();
	};
	asc_docs_api.prototype.setEndPointHistory   = function()
	{
		this.noCreatePoint     = false;
		this.exucuteHistoryEnd = true;
		this.decrementCounterLongAction();
		this.WordControl.m_oLogicDocument.TurnOn_InterfaceEvents();
	};

	function CDocInfoProp(obj)
	{
		if (obj)
		{
			this.PageCount      = obj.PageCount;
			this.WordsCount     = obj.WordsCount;
			this.ParagraphCount = obj.ParagraphCount;
			this.SymbolsCount   = obj.SymbolsCount;
			this.SymbolsWSCount = obj.SymbolsWSCount;
		}
		else
		{
			this.PageCount      = -1;
			this.WordsCount     = -1;
			this.ParagraphCount = -1;
			this.SymbolsCount   = -1;
			this.SymbolsWSCount = -1;
		}
	}

	CDocInfoProp.prototype.get_PageCount      = function()
	{
		return this.PageCount;
	};
	CDocInfoProp.prototype.put_PageCount      = function(v)
	{
		this.PageCount = v;
	};
	CDocInfoProp.prototype.get_WordsCount     = function()
	{
		return this.WordsCount;
	};
	CDocInfoProp.prototype.put_WordsCount     = function(v)
	{
		this.WordsCount = v;
	};
	CDocInfoProp.prototype.get_ParagraphCount = function()
	{
		return this.ParagraphCount;
	};
	CDocInfoProp.prototype.put_ParagraphCount = function(v)
	{
		this.ParagraphCount = v;
	};
	CDocInfoProp.prototype.get_SymbolsCount   = function()
	{
		return this.SymbolsCount;
	};
	CDocInfoProp.prototype.put_SymbolsCount   = function(v)
	{
		this.SymbolsCount = v;
	};
	CDocInfoProp.prototype.get_SymbolsWSCount = function()
	{
		return this.SymbolsWSCount;
	};
	CDocInfoProp.prototype.put_SymbolsWSCount = function(v)
	{
		this.SymbolsWSCount = v;
	};

	/*callbacks*/
	/*asc_docs_api.prototype.sync_CursorLockCallBack = function(isLock){
	 this.sendEvent("asc_onCursorLock",isLock);
	 }*/
	asc_docs_api.prototype.sync_UndoCallBack       = function()
	{
		this.sendEvent("asc_onUndo");
	};
	asc_docs_api.prototype.sync_RedoCallBack       = function()
	{
		this.sendEvent("asc_onRedo");
	};
	asc_docs_api.prototype.sync_CopyCallBack       = function()
	{
		this.sendEvent("asc_onCopy");
	};
	asc_docs_api.prototype.sync_CutCallBack        = function()
	{
		this.sendEvent("asc_onCut");
	};
	asc_docs_api.prototype.sync_PasteCallBack      = function()
	{
		this.sendEvent("asc_onPaste");
	};
	asc_docs_api.prototype.sync_ShareCallBack      = function()
	{
		this.sendEvent("asc_onShare");
	};
	asc_docs_api.prototype.sync_SaveCallBack       = function()
	{
		this.sendEvent("asc_onSave");
	};
	asc_docs_api.prototype.sync_DownloadAsCallBack = function()
	{
		this.sendEvent("asc_onDownload");
	};

	asc_docs_api.prototype.sync_AddURLCallback  = function()
	{
		this.sendEvent("asc_onAddURL");
	};
	asc_docs_api.prototype.sync_ErrorCallback   = function(errorID, errorLevel)
	{
		this.sendEvent("asc_onError", errorID, errorLevel);
	};
	asc_docs_api.prototype.sync_HelpCallback    = function(url)
	{
		this.sendEvent("asc_onHelp", url);
	};
	asc_docs_api.prototype.sync_UpdateZoom      = function(zoom)
	{
		this.sendEvent("asc_onZoom", zoom);
	};
	asc_docs_api.prototype.ClearPropObjCallback = function(prop)
	{//колбэк предшествующий приходу свойств объекта, prop а всякий случай
		this.sendEvent("asc_onClearPropObj", prop);
	};

	// mobile version methods:
	asc_docs_api.prototype.asc_GetDefaultTableStyles = function()
	{
		if (!this.WordControl.m_oLogicDocument)
			return;




		this.WordControl.m_oDrawingDocument.StartTableStylesCheck();
		this.WordControl.m_oDrawingDocument.TableStylesCheckLook = new Asc.CTablePropLook();
		this.WordControl.m_oDrawingDocument.TableStylesCheckLook.FirstCol = true;
		this.WordControl.m_oDrawingDocument.TableStylesCheckLook.FirstRow = true;
		this.WordControl.m_oDrawingDocument.TableStylesCheckLook.BandHor  = true;
		this.WordControl.m_oDrawingDocument.EndTableStylesCheck();
	};

	asc_docs_api.prototype.CollectHeaders                  = function()
	{
		this.sync_ReturnHeadersCallback([]);
	};
	asc_docs_api.prototype.GetActiveHeader                 = function()
	{

	};
	asc_docs_api.prototype.gotoHeader                      = function(page, X, Y)
	{
		this.goToPage(page);
	};
	asc_docs_api.prototype.sync_ChangeActiveHeaderCallback = function(position, header)
	{
		this.sendEvent("asc_onChangeActiveHeader", position, new Asc.CHeader(header));
	};
	asc_docs_api.prototype.sync_ReturnHeadersCallback      = function(headers)
	{
		var _headers = [];
		for (var i = 0; i < headers.length; i++)
		{
			_headers[i] = new Asc.CHeader(headers[i]);
		}

		this.sendEvent("asc_onReturnHeaders", _headers);
	};
	/*----------------------------------------------------------------*/
	/*functions for working with search*/
	/*
	 структура поиска, предварительно, выглядит так
	 {
	 text: "...<b>слово поиска</b>...",
	 pageNumber: 0, //содержит номер страницы, где находится искомая последовательность
	 X: 0,//координаты по OX начала последовательности на данной страницы
	 Y: 0//координаты по OY начала последовательности на данной страницы
	 }
	 */

	asc_docs_api.prototype.asc_searchEnabled = function(bIsEnabled)
	{
		if (null != this.WordControl.m_oDrawingDocument.m_oDocumentRenderer)
		{
			this.WordControl.m_oDrawingDocument.m_oDocumentRenderer.SearchResults.IsSearch = false;
			this.WordControl.OnUpdateOverlay();
		}
	};

	asc_docs_api.prototype.asc_findText = function(text, isNext, isMatchCase)
	{
		if (null != this.WordControl.m_oDrawingDocument.m_oDocumentRenderer)
		{
			this.WordControl.m_oDrawingDocument.m_oDocumentRenderer.findText(text, isMatchCase, isNext);
			return this.WordControl.m_oDrawingDocument.m_oDocumentRenderer.SearchResults.Count;
		}

		var SearchEngine = editor.WordControl.m_oLogicDocument.Search(text, {MatchCase : isMatchCase});

		var Id = this.WordControl.m_oLogicDocument.Search_GetId(isNext);

		if (null != Id)
			this.WordControl.m_oLogicDocument.Search_Select(Id);

		return SearchEngine.Count;
	};

	asc_docs_api.prototype.asc_replaceText = function(text, replaceWith, isReplaceAll, isMatchCase)
	{
		if (null == this.WordControl.m_oLogicDocument)
			return;

		this.WordControl.m_oLogicDocument.Search(text, {MatchCase : isMatchCase});

		if (true === isReplaceAll)
			this.WordControl.m_oLogicDocument.Search_Replace(replaceWith, true, -1);
		else
		{
			var CurId      = this.WordControl.m_oLogicDocument.SearchEngine.CurId;
			var bDirection = this.WordControl.m_oLogicDocument.SearchEngine.Direction;
			if (-1 != CurId)
				this.WordControl.m_oLogicDocument.Search_Replace(replaceWith, false, CurId);

			var Id = this.WordControl.m_oLogicDocument.Search_GetId(bDirection);

			if (null != Id)
			{
				this.WordControl.m_oLogicDocument.Search_Select(Id);
				return true;
			}

			return false;
		}
	};

	asc_docs_api.prototype._selectSearchingResults = function(bShow)
	{
		if (null != this.WordControl.m_oDrawingDocument.m_oDocumentRenderer)
		{
			this.WordControl.m_oDrawingDocument.m_oDocumentRenderer.SearchResults.Show = bShow;
			this.WordControl.OnUpdateOverlay();
			return;
		}
		this.WordControl.m_oLogicDocument.Search_Set_Selection(bShow);
	};

	asc_docs_api.prototype.asc_isSelectSearchingResults = function()
	{
		if (null != this.WordControl.m_oDrawingDocument.m_oDocumentRenderer)
		{
			return this.WordControl.m_oDrawingDocument.m_oDocumentRenderer.SearchResults.Show;
		}
		return this.WordControl.m_oLogicDocument.Search_Get_Selection();
	};

	asc_docs_api.prototype.sync_ReplaceAllCallback = function(ReplaceCount, OverallCount)
	{
		this.sendEvent("asc_onReplaceAll", OverallCount, ReplaceCount);
	};

	asc_docs_api.prototype.sync_SearchEndCallback = function()
	{
		this.sendEvent("asc_onSearchEnd");
	};
	/*----------------------------------------------------------------*/
	/*functions for working with font*/
	/*setters*/
	asc_docs_api.prototype.put_TextPrFontName = function(name)
	{
		var loader   = AscCommon.g_font_loader;
		var fontinfo = g_fontApplication.GetFontInfo(name);
		var isasync  = loader.LoadFont(fontinfo);
		if (false === isasync)
		{
			if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
			{
				this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextFontName);
				this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({
					FontFamily : {
						Name  : name,
						Index : -1
					}
				}));

				this.WordControl.m_oLogicDocument.Recalculate();
				this.WordControl.m_oLogicDocument.UpdateInterface();
				this.WordControl.m_oLogicDocument.FinalizeAction();
			}
		}
	};
	asc_docs_api.prototype.put_TextPrFontSize = function(size)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextFontSize);
			this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({FontSize : Math.min(size, 100)}));
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.put_TextPrBold       = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextBold);
			this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({Bold : value}));
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.put_TextPrItalic     = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextItalic);
			this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({Italic : value}));
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.put_TextPrUnderline  = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextUnderline);
			this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({Underline : value}));
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.put_TextPrStrikeout  = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextStrikeout);
			this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({
				Strikeout  : value,
				DStrikeout : false
			}));
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.put_TextPrDStrikeout = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextDStrikeout);
			this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({
				DStrikeout : value,
				Strikeout  : false
			}));
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.put_TextPrSpacing    = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextSpacing);
			this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({Spacing : value}));
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.put_TextPrCaps = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextCaps);
			this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({
				Caps      : value,
				SmallCaps : false
			}));
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.put_TextPrSmallCaps = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextSmallCaps);
			this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({
				SmallCaps : value,
				Caps      : false
			}));
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};


	asc_docs_api.prototype.put_TextPrPosition = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextPosition);
			this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({Position : value}));
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.put_TextPrLang = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextLang);
			this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({Lang : {Val : value}}));
			this.WordControl.m_oLogicDocument.Spelling.Check_CurParas();
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};


	asc_docs_api.prototype.put_PrLineSpacing          = function(Type, Value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphLineSpacing);
			this.WordControl.m_oLogicDocument.SetParagraphSpacing({LineRule : Type, Line : Value});
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.put_LineSpacingBeforeAfter = function(type, value)//"type == 0" means "Before", "type == 1" means "After"
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphLineSpacingBeforeAfter);
			switch (type)
			{
				case 0:
				{
					if (AscCommonWord.spacing_Auto === value)
						this.WordControl.m_oLogicDocument.SetParagraphSpacing({BeforeAutoSpacing : true});
					else
						this.WordControl.m_oLogicDocument.SetParagraphSpacing({
							Before            : value,
							BeforeAutoSpacing : false
						});

					break;
				}
				case 1:
				{
					if (AscCommonWord.spacing_Auto === value)
						this.WordControl.m_oLogicDocument.SetParagraphSpacing({AfterAutoSpacing : true});
					else
						this.WordControl.m_oLogicDocument.SetParagraphSpacing({
							After            : value,
							AfterAutoSpacing : false
						});

					break;
				}
			}
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.FontSizeIn                 = function()
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_IncFontSize);
			this.WordControl.m_oLogicDocument.IncreaseDecreaseFontSize(true);
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.FontSizeOut                = function()
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_DecFontSize);
			this.WordControl.m_oLogicDocument.IncreaseDecreaseFontSize(false);
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	// Object:
	// {
	//    Bottom :
	//    {
	//        Color : { r : 0, g : 0, b : 0 },
	//        Value : border_Single,
	//        Size  : 0.5 * g_dKoef_pt_to_mm
	//        Space : 0
	//    },
	//    Left :
	//    {
	//        ....
	//    }
	//    Right :
	//    {
	//        ....
	//    }
	//    Top :
	//    {
	//        ....
	//    }
	//    },
	//    Between :
	//    {
	//        ....
	//    }
	// }


	asc_docs_api.prototype.put_Borders = function(Obj)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphBorders);
			this.WordControl.m_oLogicDocument.SetParagraphBorders(Obj);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	/*callbacks*/
	asc_docs_api.prototype.sync_BoldCallBack             = function(isBold)
	{
		this.sendEvent("asc_onBold", isBold);
	};
	asc_docs_api.prototype.sync_ItalicCallBack           = function(isItalic)
	{
		this.sendEvent("asc_onItalic", isItalic);
	};
	asc_docs_api.prototype.sync_UnderlineCallBack        = function(isUnderline)
	{
		this.sendEvent("asc_onUnderline", isUnderline);
	};
	asc_docs_api.prototype.sync_StrikeoutCallBack        = function(isStrikeout)
	{
		this.sendEvent("asc_onStrikeout", isStrikeout);
	};
	asc_docs_api.prototype.sync_TextPrFontFamilyCallBack = function(FontFamily)
	{
		if (undefined != FontFamily)
			this.sendEvent("asc_onFontFamily", new asc_CTextFontFamily(FontFamily));
		else
			this.sendEvent("asc_onFontFamily", new asc_CTextFontFamily({Name : "", Index : -1}));
	};
	asc_docs_api.prototype.sync_TextPrFontSizeCallBack   = function(FontSize)
	{
		this.sendEvent("asc_onFontSize", FontSize);
	};
	asc_docs_api.prototype.sync_PrLineSpacingCallBack    = function(LineSpacing)
	{
		this.sendEvent("asc_onLineSpacing", new Asc.asc_CParagraphInd(LineSpacing));
	};
	asc_docs_api.prototype.sync_InitEditorStyles         = function(styles_painter)
	{
		if (!this.isViewMode) {
			this.sendEvent("asc_onInitEditorStyles", styles_painter);
		}
	};
	asc_docs_api.prototype.sync_InitEditorTableStyles    = function(styles, is_retina_enabled)
	{
		if (!this.isViewMode) {
			this.sendEvent("asc_onInitTableTemplates", styles, is_retina_enabled);
		}
	};


	/*----------------------------------------------------------------*/
	/*functions for working with paragraph*/
	/*setters*/
	// Right = 0; Left = 1; Center = 2; Justify = 3; or using enum that written above

	/* структура для параграфа
	 Ind :
	 {
	 Left      : 0,                    // Левый отступ
	 Right     : 0,                    // Правый отступ
	 FirstLine : 0                     // Первая строка
	 }
	 Spacing :
	 {
	 Line     : 1.15,                  // Расстояние между строками внутри абзаца
	 LineRule : linerule_Auto,         // Тип расстрояния между строками
	 Before   : 0,                     // Дополнительное расстояние до абзаца
	 After    : 10 * g_dKoef_pt_to_mm  // Дополнительное расстояние после абзаца
	 },
	 KeepLines : false,                    // переносить параграф на новую страницу,
	 // если на текущей он целиком не убирается
	 PageBreakBefore : false
	 */

	asc_docs_api.prototype.paraApply = function(Props)
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return;

		var arrAdditional = [];
		if (undefined != Props.DefaultTab)
		{
			arrAdditional.push({
				Type      : AscCommon.changestype_2_Element_and_Type,
				Element   : oLogicDocument,
				CheckType : AscCommon.changestype_Document_SectPr
			});
		}

		if (undefined !== Props.Subscript
			|| undefined !== Props.Strikeout
			|| undefined !== Props.DStrikeout
			|| undefined !== Props.SmallCaps
			|| undefined !== Props.AllCaps
			|| undefined !== Props.TextSpacing
			|| undefined !== Props.Position)
		{
			arrAdditional.push({
				Type  : AscCommon.changestype_2_AdditionalTypes,
				Types : [AscCommon.changestype_Paragraph_TextProperties]
			});
		}

		if (!oLogicDocument.IsSelectionLocked(changestype_Paragraph_Properties, arrAdditional))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphPr);

			if ("undefined" != typeof(Props.ContextualSpacing) && null != Props.ContextualSpacing)
				this.WordControl.m_oLogicDocument.SetParagraphContextualSpacing(Props.ContextualSpacing);

			if ("undefined" != typeof(Props.Ind) && null != Props.Ind)
				this.WordControl.m_oLogicDocument.SetParagraphIndent(Props.Ind);

			if ("undefined" != typeof(Props.Jc) && null != Props.Jc)
				this.WordControl.m_oLogicDocument.SetParagraphAlign(Props.Jc);

			if ("undefined" != typeof(Props.KeepLines) && null != Props.KeepLines)
				this.WordControl.m_oLogicDocument.SetParagraphKeepLines(Props.KeepLines);

			if (undefined != Props.KeepNext && null != Props.KeepNext)
				this.WordControl.m_oLogicDocument.SetParagraphKeepNext(Props.KeepNext);

			if (undefined != Props.WidowControl && null != Props.WidowControl)
				this.WordControl.m_oLogicDocument.SetParagraphWidowControl(Props.WidowControl);

			if ("undefined" != typeof(Props.PageBreakBefore) && null != Props.PageBreakBefore)
				this.WordControl.m_oLogicDocument.SetParagraphPageBreakBefore(Props.PageBreakBefore);

			if ("undefined" != typeof(Props.Spacing) && null != Props.Spacing)
				this.WordControl.m_oLogicDocument.SetParagraphSpacing(Props.Spacing);

			if (undefined !== Props.OutlineLvl)
				this.WordControl.m_oLogicDocument.SetParagraphOutlineLvl(Props.OutlineLvl);

			if ("undefined" != typeof(Props.Shd) && null != Props.Shd)
			{
				var Unifill        = new AscFormat.CUniFill();
				Unifill.fill       = new AscFormat.CSolidFill();
				Unifill.fill.color = AscFormat.CorrectUniColor(Props.Shd.Color, Unifill.fill.color, 1);
				this.WordControl.m_oLogicDocument.SetParagraphShd(
					{
						Value   : Props.Shd.Value,
						Color   : {
							r : Props.Shd.Color.asc_getR(),
							g : Props.Shd.Color.asc_getG(),
							b : Props.Shd.Color.asc_getB()
						},
						Unifill : Unifill
					});
			}

			if ("undefined" != typeof(Props.Brd) && null != Props.Brd)
			{
				if (Props.Brd.Left && Props.Brd.Left.Color)
				{
					Props.Brd.Left.Unifill = AscFormat.CreateUnifillFromAscColor(Props.Brd.Left.Color, 1);
				}
				if (Props.Brd.Top && Props.Brd.Top.Color)
				{
					Props.Brd.Top.Unifill = AscFormat.CreateUnifillFromAscColor(Props.Brd.Top.Color, 1);
				}
				if (Props.Brd.Right && Props.Brd.Right.Color)
				{
					Props.Brd.Right.Unifill = AscFormat.CreateUnifillFromAscColor(Props.Brd.Right.Color, 1);
				}
				if (Props.Brd.Bottom && Props.Brd.Bottom.Color)
				{
					Props.Brd.Bottom.Unifill = AscFormat.CreateUnifillFromAscColor(Props.Brd.Bottom.Color, 1);
				}
				if (Props.Brd.InsideH && Props.Brd.InsideH.Color)
				{
					Props.Brd.InsideH.Unifill = AscFormat.CreateUnifillFromAscColor(Props.Brd.InsideH.Color, 1);
				}
				if (Props.Brd.InsideV && Props.Brd.InsideV.Color)
				{
					Props.Brd.InsideV.Unifill = AscFormat.CreateUnifillFromAscColor(Props.Brd.InsideV.Color, 1);
				}

				this.WordControl.m_oLogicDocument.SetParagraphBorders(Props.Brd);
			}

			if (undefined != Props.Tabs)
			{
				var Tabs = new AscCommonWord.CParaTabs();
				Tabs.Set_FromObject(Props.Tabs.Tabs);
				this.WordControl.m_oLogicDocument.SetParagraphTabs(Tabs);
			}

			if (undefined != Props.DefaultTab)
			{
				this.WordControl.m_oLogicDocument.Set_DocumentDefaultTab(Props.DefaultTab);
			}


			// TODO: как только разъединят настройки параграфа и текста переделать тут
			var TextPr = new AscCommonWord.CTextPr();

			if (true === Props.Subscript)
				TextPr.VertAlign = AscCommon.vertalign_SubScript;
			else if (true === Props.Superscript)
				TextPr.VertAlign = AscCommon.vertalign_SuperScript;
			else if (false === Props.Superscript || false === Props.Subscript)
				TextPr.VertAlign = AscCommon.vertalign_Baseline;

			if (undefined != Props.Strikeout)
			{
				TextPr.Strikeout  = Props.Strikeout;
				TextPr.DStrikeout = false;
			}

			if (undefined != Props.DStrikeout)
			{
				TextPr.DStrikeout = Props.DStrikeout;
				if (true === TextPr.DStrikeout)
					TextPr.Strikeout = false;
			}

			if (undefined != Props.SmallCaps)
			{
				TextPr.SmallCaps = Props.SmallCaps;
				TextPr.AllCaps   = false;
			}

			if (undefined != Props.AllCaps)
			{
				TextPr.Caps = Props.AllCaps;
				if (true === TextPr.AllCaps)
					TextPr.SmallCaps = false;
			}

			if (undefined != Props.TextSpacing)
				TextPr.Spacing = Props.TextSpacing;

			if (undefined != Props.Position)
				TextPr.Position = Props.Position;

			oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr(TextPr));
			oLogicDocument.Recalculate();
			oLogicDocument.UpdateInterface();
			oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.put_PrAlign        = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphAlign);
			this.WordControl.m_oLogicDocument.SetParagraphAlign(value);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	// 0- baseline, 2-subscript, 1-superscript
	asc_docs_api.prototype.put_TextPrBaseline = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextVertAlign);
			this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({VertAlign : value}));
			this.UpdateInterfaceState();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	/*
	 Во всех случаях SubType = 0 означает, что нажали просто на кнопку
	 c выбором типа списка, без выбора подтипа.

	 Маркированный список Type = 0
	 нет          - SubType = -1
	 черная точка - SubType = 1
	 круг         - SubType = 2
	 квадрат      - SubType = 3
	 картинка     - SubType = -1
	 4 ромба      - SubType = 4
	 ч/б стрелка  - SubType = 5
	 галка        - SubType = 6
	 ромб         - SubType = 7

	 Нумерованный список Type = 1
	 нет - SubType = -1
	 1.  - SubType = 1
	 1)  - SubType = 2
	 I.  - SubType = 3
	 A.  - SubType = 4
	 a)  - SubType = 5
	 a.  - SubType = 6
	 i.  - SubType = 7

	 Многоуровневый список Type = 2
	 нет           - SubType = -1
	 1)a)i)        - SubType = 1
	 1.1.1         - SubType = 2
	 маркированный - SubType = 3
	 */
	asc_docs_api.prototype.put_ListType = function(type, subtype)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		var fCallback = function()
		{
			if (false === oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
			{
				var NumberInfo =
				{
					Type    : 0,
					SubType : -1
				};

				NumberInfo.Type    = type;
				NumberInfo.SubType = subtype;
				oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphNumbering);
				oLogicDocument.SetParagraphNumbering(NumberInfo);
				oLogicDocument.FinalizeAction();
			}
		};
		var sBullet = "";
		if(type === 0)
		{
			switch (subtype)
			{
				case 1:
				{
					sBullet = String.fromCharCode(0x00B7);
					break;
				}
				case 2:
				{
					sBullet = "o";
					break;
				}
				case 3:
				{
					sBullet = String.fromCharCode(0x00A7);
					break;
				}
				case 4:
				{
					sBullet = String.fromCharCode(0x0076);
					break;
				}
				case 5:
				{
					sBullet = String.fromCharCode(0x00D8);
					break;
				}
				case 6:
				{
					sBullet = String.fromCharCode(0x00FC);
					break;
				}
				case 7:
				{
					sBullet = String.fromCharCode(0x00A8);
					break;
				}
				case 8:
				{
					sBullet = String.fromCharCode(0x2013);
					break;
				}
			}
		}
		if(sBullet.length > 0)
		{
			AscFonts.FontPickerByCharacter.checkText(sBullet, this, fCallback);
		}
		else
		{
			fCallback();
		}
	};
	asc_docs_api.prototype.asc_ContinueNumbering = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		oLogicDocument.ContinueNumbering();
	};
	asc_docs_api.prototype.asc_RestartNumbering = function(nRestartValue)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		oLogicDocument.RestartNumbering(nRestartValue);
	};
	asc_docs_api.prototype.asc_GetCurrentNumberingId = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return null;

		var oNumPr = oLogicDocument.GetSelectedNum(true);
		if (!oNumPr)
			return null;

		var oNum = oLogicDocument.GetNumbering().GetNum(oNumPr.NumId);
		if (!oNum)
			return null;

		return oNumPr.NumId;
	};
	asc_docs_api.prototype.asc_GetCurrentNumberingLvl = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return -1;

		var oNumPr = oLogicDocument.GetSelectedNum(true);
		if (!oNumPr || undefined === oNumPr.Lvl || null === oNumPr.Lvl)
			return -1;

		return oNumPr.Lvl;
	};
	asc_docs_api.prototype.asc_GetCalculatedNumberingValue = function()
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return -1;

		var oParagraph = oLogicDocument.GetCurrentParagraph(true);
		if (!oParagraph)
			return -1;

		return oParagraph.GetNumberingCalculatedValue();
	};
	asc_docs_api.prototype.asc_GetNumberingPr = function(sNumId)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return null;

		var oNum = oLogicDocument.GetNumbering().GetNum(sNumId);
		if (!oNum)
			return null;

		var oAscNumbering = new Asc.CAscNumbering();
		oNum.FillToAscNum(oAscNumbering);
		return oAscNumbering;
	};
	asc_docs_api.prototype.asc_AddNewNumbering = function(oAscNumbering, isApply)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return null;

		var arrParagraphs;
		if (isApply)
		{
			arrParagraphs = oLogicDocument.GetSelectedParagraphs();

			if (oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
					Type      : AscCommon.changestype_2_ElementsArray_and_Type,
					Elements  : arrParagraphs,
					CheckType : AscCommon.changestype_Paragraph_Properties
				}))
			{
				return null;
			}
		}

		oLogicDocument.StartAction(AscDFH.historydescription_Document_CreateNum);
		var oNumbering = oLogicDocument.GetNumbering();
		var oNum = oNumbering.CreateNum();
		oNum.FillFromAscNum(oAscNumbering);
		var sNumId = oNum.GetId();

		if (arrParagraphs)
		{
			for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
			{
				var oPara = arrParagraphs[nIndex];
				var oNumPr = oPara.GetNumPr();
				if (!oNumPr)
					oPara.ApplyNumPr(sNumId, 0);
				else
					oPara.ApplyNumPr(sNumId, oNumPr.Lvl);
			}

			oLogicDocument.Recalculate();
			oLogicDocument.UpdateInterface();
			oLogicDocument.UpdateSelection();
		}

		oLogicDocument.FinalizeAction();
	};
	asc_docs_api.prototype.asc_ChangeNumberingLvl = function(sNumId, oAscNumberingLvl, nLvl)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		var oNum = oLogicDocument.GetNumbering().GetNum(sNumId);
		if (!oNum)
			return;

		if (!oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
				Type      : AscCommon.changestype_2_ElementsArray_and_Type,
				Elements  : [oNum],
				CheckType : AscCommon.changestype_Paragraph_Properties
			}))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_ChangeNumLvl);

			if (oAscNumberingLvl instanceof Asc.CAscNumberingLvl)
			{
				oNum.SetAscLvl(oAscNumberingLvl, nLvl);
			}
			else if (undefined !== oAscNumberingLvl.length && oAscNumberingLvl.length === nLvl.length)
			{
				for (var nIndex = 0, nCount = oAscNumberingLvl.length; nIndex < nCount; ++nIndex)
				{
					oNum.SetAscLvl(oAscNumberingLvl[nIndex], nLvl[nIndex]);
				}
			}

			oLogicDocument.Recalculate();
			oLogicDocument.UpdateInterface();
			oLogicDocument.UpdateSelection();
			oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.put_Style    = function(sName)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphStyle);
			this.WordControl.m_oLogicDocument.SetParagraphStyle(sName, true);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.SetDeviceInputHelperId = function(idKeyboard)
	{
		if (window.ID_KEYBOARD_AREA === undefined && this.WordControl.m_oMainView != null)
		{
			window.ID_KEYBOARD_AREA = document.getElementById(idKeyboard);

			window.ID_KEYBOARD_AREA.onkeypress = function(e)
			{
				if (false === editor.WordControl.IsFocus)
				{
					editor.WordControl.IsFocus = true;
					var ret                    = editor.WordControl.onKeyPress(e);
					editor.WordControl.IsFocus = false;
					return ret;
				}
			}
			window.ID_KEYBOARD_AREA.onkeydown  = function(e)
			{
				if (false === editor.WordControl.IsFocus)
				{
					editor.WordControl.IsFocus = true;
					var ret                    = editor.WordControl.onKeyDown(e);
					editor.WordControl.IsFocus = false;
					return ret;
				}
			}
		}
	};

	asc_docs_api.prototype.put_ShowSnapLines = function(isShow)
	{
		this.ShowSnapLines = isShow;
	};
	asc_docs_api.prototype.get_ShowSnapLines = function()
	{
		return this.ShowSnapLines;
	};

	asc_docs_api.prototype.put_ShowParaMarks      = function(isShow)
	{
		/*
		 if (window.IsAddDiv === undefined && this.WordControl.m_oMainView != null)
		 {
		 window.IsAddDiv = true;

		 var _div = this.WordControl.m_oMainView.HtmlElement;

		 var test = document.createElement('textarea');
		 test.id = "area_id";

		 test.setAttribute("style", "font-family:arial;font-size:12pt;position:absolute;resize:none;padding:2px;margin:0px;font-weight:normal;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;z-index:1000");
		 test.style.border = "2px solid #4363A4";

		 test.style.width = "100px";
		 //this.TextBoxInput.style.height = "40px";
		 test.rows = 1;

		 _div.appendChild(test);

		 test.onkeypress = function(e){
		 return editor.WordControl.onKeyPress(e);
		 }
		 test.onkeydown = function(e){
		 return editor.WordControl.onKeyDown(e);
		 }
		 }
		 */

		if (this.isRestrictionForms() || this.isRestrictionComments())
			isShow = false;

		this.ShowParaMarks = isShow;
		this.WordControl.OnRePaintAttack();

		if (true === this.isMarkerFormat)
			this.sync_MarkerFormatCallback(false);

		return this.ShowParaMarks;
	};
	asc_docs_api.prototype.get_ShowParaMarks      = function()
	{
		return this.ShowParaMarks;
	};
	asc_docs_api.prototype.sync_ShowParaMarks     = function()
	{
		this.sendEvent("asc_onShowParaMarks", this.get_ShowParaMarks());
	};
	asc_docs_api.prototype.put_ShowTableEmptyLine = function(isShow)
	{
		this.isShowTableEmptyLine = isShow;
		this.WordControl.OnRePaintAttack();

		if (true === this.isMarkerFormat)
			this.sync_MarkerFormatCallback(false);

		return this.isShowTableEmptyLine;
	};
	asc_docs_api.prototype.get_ShowTableEmptyLine = function()
	{
		return this.isShowTableEmptyLine;
	};
	asc_docs_api.prototype.put_PageBreak          = function(isBreak)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.isPageBreakBefore = isBreak;
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphPageBreakBefore);
			this.WordControl.m_oLogicDocument.SetParagraphPageBreakBefore(isBreak);
			this.sync_PageBreakCallback(isBreak);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.put_WidowControl = function(bValue)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphWidowControl);
			this.WordControl.m_oLogicDocument.SetParagraphWidowControl(bValue);
			this.sync_WidowControlCallback(bValue);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.put_KeepLines = function(isKeepLines)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.isKeepLinesTogether = isKeepLines;
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphKeepLines);
			this.WordControl.m_oLogicDocument.SetParagraphKeepLines(isKeepLines);
			this.sync_KeepLinesCallback(isKeepLines);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.put_KeepNext = function(isKeepNext)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphKeepNext);
			this.WordControl.m_oLogicDocument.SetParagraphKeepNext(isKeepNext);
			this.sync_KeepNextCallback(isKeepNext);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.put_AddSpaceBetweenPrg = function(isSpacePrg)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.isAddSpaceBetweenPrg = isSpacePrg;
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphContextualSpacing);
			this.WordControl.m_oLogicDocument.SetParagraphContextualSpacing(isSpacePrg);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.put_LineHighLight      = function(is_flag, r, g, b)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			if (false === is_flag)
			{
				this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextHighlightNone);
				this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({HighLight : AscCommonWord.highlight_None}));
				this.WordControl.m_oLogicDocument.FinalizeAction();
			}
			else
			{
				this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextHighlightColor);
				this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({
					HighLight : {
						r : r,
						g : g,
						b : b
					}
				}));
				this.WordControl.m_oLogicDocument.FinalizeAction();
			}
		}
	};
	asc_docs_api.prototype.put_TextColor          = function(color)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextColor);

			if (true === color.Auto)
			{
				this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({
					Color      : {
						Auto : true,
						r    : 0,
						g    : 0,
						b    : 0
					}, Unifill : undefined
				}));
			}
			else
			{
				var Unifill        = new AscFormat.CUniFill();
				Unifill.fill       = new AscFormat.CSolidFill();
				Unifill.fill.color = AscFormat.CorrectUniColor(color, Unifill.fill.color, 1);
				this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({Unifill : Unifill}));
			}

			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.put_ParagraphShade     = function(is_flag, color, isOnlyPara)
	{
		if (!this.WordControl.m_oLogicDocument.IsSelectionLocked(AscCommon.changestype_Paragraph_Properties, {
			Type  : AscCommon.changestype_2_AdditionalTypes,
			Types : [AscCommon.changestype_Paragraph_TextProperties]
		}))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphShd);

			if (true === isOnlyPara)
				this.WordControl.m_oLogicDocument.SetUseTextShd(false);

			if (false === is_flag)
				this.WordControl.m_oLogicDocument.SetParagraphShd({Value : Asc.c_oAscShdNil});
			else
			{
				var Unifill        = new AscFormat.CUniFill();
				Unifill.fill       = new AscFormat.CSolidFill();
				Unifill.fill.color = AscFormat.CorrectUniColor(color, Unifill.fill.color, 1);
				this.WordControl.m_oLogicDocument.SetParagraphShd({
					Value   : Asc.c_oAscShdClear,
					Color   : {
						r : color.asc_getR(),
						g : color.asc_getG(),
						b : color.asc_getB()
					},
					Unifill : Unifill
				});
			}

			this.WordControl.m_oLogicDocument.SetUseTextShd(true);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.put_PrIndent           = function(value, levelValue)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphIndent);
			this.WordControl.m_oLogicDocument.SetParagraphIndent({Left : value, ChangeLevel : levelValue});
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.put_ParagraphOutlineLvl = function(nLvl)
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return;

		if (false === oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphOutlineLvl);
			oLogicDocument.SetParagraphOutlineLvl(nLvl);
			oLogicDocument.FinalizeAction();
			oLogicDocument.UpdateDocumentOutlinePosition();
		}
	};

	// signatures
	asc_docs_api.prototype.asc_addSignatureLine = function (sGuid, sSigner, sSigner2, sEmail, Width, Height, sImgUrl) {
        if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Document_Content_Add))
        {
            this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_InsertSignatureLine);

            var oSignature = AscFormat.fCreateSignatureShape(sGuid, sSigner, sSigner2, sEmail, true, null, Width, Height, sImgUrl);
            var Drawing   = new AscCommonWord.ParaDrawing(oSignature.spPr.xfrm.extX, oSignature.spPr.xfrm.extY, null, this.WordControl.m_oDrawingDocument, null, null);
            oSignature.setParent(Drawing);
            Drawing.Set_GraphicObject(oSignature);
            this.WordControl.m_oLogicDocument.AddSignatureLine(Drawing);
            this.sendEvent("asc_onAddSignature", sGuid);
			this.WordControl.m_oLogicDocument.FinalizeAction();
        }
    };

    asc_docs_api.prototype.asc_getAllSignatures = function(){
    	if (!this.WordControl.m_oLogicDocument)
    		return [];
    	return this.WordControl.m_oLogicDocument.GetAllSignatures();
	};


    asc_docs_api.prototype.asc_CallSignatureDblClickEvent = function(sGuid){
        return this.WordControl.m_oLogicDocument.CallSignatureDblClickEvent(sGuid);
    };
    asc_docs_api.prototype.asc_MoveCursorToSignature = function(sGuid){
        return this.WordControl.m_oLogicDocument.MoveCursorToSignature(sGuid);
    };
    //////////////////////////////////////////////////////////////////////////

	asc_docs_api.prototype.IncreaseIndent         = function()
	{
		this.WordControl.m_oLogicDocument.IncreaseIndent();
	};
	asc_docs_api.prototype.DecreaseIndent         = function()
	{
		this.WordControl.m_oLogicDocument.DecreaseIndent();
	};
	asc_docs_api.prototype.put_PrIndentRight      = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphIndentRight);
			this.WordControl.m_oLogicDocument.SetParagraphIndent({Right : value});
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.put_PrFirstLineIndent  = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetParagraphIndentFirstLine);
			this.WordControl.m_oLogicDocument.SetParagraphIndent({FirstLine : value});
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.put_Margins            = function(left, top, right, bottom)
	{
		this.WordControl.m_oLogicDocument.SetDocumentMargin({Left : left, Top : top, Right : right, Bottom : bottom});
	};
	asc_docs_api.prototype.getFocusObject         = function()
	{//возвратит тип элемента - параграф c_oAscTypeSelectElement.Paragraph, изображение c_oAscTypeSelectElement.Image, таблица c_oAscTypeSelectElement.Table, колонтитул c_oAscTypeSelectElement.Header.

	};

	/*callbacks*/
	asc_docs_api.prototype.sync_VerticalAlign     = function(typeBaseline)
	{
		this.sendEvent("asc_onVerticalAlign", typeBaseline);
	};
	asc_docs_api.prototype.sync_PrAlignCallBack   = function(value)
	{
		this.sendEvent("asc_onPrAlign", value);
	};
	asc_docs_api.prototype.sync_ListType          = function(NumPr)
	{
		this.sendEvent("asc_onListType", new AscCommon.asc_CListType(NumPr));
	};
	asc_docs_api.prototype.sync_TextColor         = function(TextPr)
	{
		if (TextPr.Unifill && TextPr.Unifill.fill && TextPr.Unifill.fill.type === c_oAscFill.FILL_TYPE_SOLID && TextPr.Unifill.fill.color)
		{
			this.sendEvent("asc_onTextColor", AscCommon.CreateAscColor(TextPr.Unifill.fill.color));
		}
		else if (undefined != TextPr.Color)
		{
			this.sendEvent("asc_onTextColor", AscCommon.CreateAscColorCustom(TextPr.Color.r, TextPr.Color.g, TextPr.Color.b, TextPr.Color.Auto));
		}
	};
	asc_docs_api.prototype.sync_TextHighLight     = function(HighLight)
	{
		if (undefined != HighLight)
			this.sendEvent("asc_onTextHighLight", new AscCommon.CColor(HighLight.r, HighLight.g, HighLight.b));
	};
	asc_docs_api.prototype.sync_TextSpacing       = function(Spacing)
	{
		this.sendEvent("asc_onTextSpacing", Spacing);
	};
	asc_docs_api.prototype.sync_TextDStrikeout    = function(Value)
	{
		this.sendEvent("asc_onTextDStrikeout", Value);
	};
	asc_docs_api.prototype.sync_TextCaps          = function(Value)
	{
		this.sendEvent("asc_onTextCaps", Value);
	};
	asc_docs_api.prototype.sync_TextSmallCaps     = function(Value)
	{
		this.sendEvent("asc_onTextSmallCaps", Value);
	};
	asc_docs_api.prototype.sync_TextPosition      = function(Value)
	{
		this.sendEvent("asc_onTextPosition", Value);
	};
	asc_docs_api.prototype.sync_TextLangCallBack  = function(Lang)
	{
		this.sendEvent("asc_onTextLanguage", Lang.Val);
	};
	asc_docs_api.prototype.sync_ParaStyleName     = function(Name)
	{
		this.sendEvent("asc_onParaStyleName", Name);
	};
	asc_docs_api.prototype.sync_ParaSpacingLine   = function(SpacingLine)
	{
		if (true === SpacingLine.AfterAutoSpacing)
			SpacingLine.After = AscCommonWord.spacing_Auto;
		else if (undefined === SpacingLine.AfterAutoSpacing)
			SpacingLine.After = AscCommonWord.UnknownValue;

		if (true === SpacingLine.BeforeAutoSpacing)
			SpacingLine.Before = AscCommonWord.spacing_Auto;
		else if (undefined === SpacingLine.BeforeAutoSpacing)
			SpacingLine.Before = AscCommonWord.UnknownValue;

		this.sendEvent("asc_onParaSpacingLine", new AscCommon.asc_CParagraphSpacing(SpacingLine));
	};
	asc_docs_api.prototype.sync_PageBreakCallback = function(isBreak)
	{
		this.sendEvent("asc_onPageBreak", isBreak);
	};

	asc_docs_api.prototype.sync_WidowControlCallback = function(bValue)
	{
		this.sendEvent("asc_onWidowControl", bValue);
	};

	asc_docs_api.prototype.sync_KeepNextCallback = function(bValue)
	{
		this.sendEvent("asc_onKeepNext", bValue);
	};

	asc_docs_api.prototype.sync_KeepLinesCallback       = function(isKeepLines)
	{
		this.sendEvent("asc_onKeepLines", isKeepLines);
	};
	asc_docs_api.prototype.sync_ShowParaMarksCallback   = function()
	{
		this.sendEvent("asc_onShowParaMarks");
	};
	asc_docs_api.prototype.sync_SpaceBetweenPrgCallback = function()
	{
		this.sendEvent("asc_onSpaceBetweenPrg");
	};
	asc_docs_api.prototype.sync_PrPropCallback          = function(prProp)
	{
		var _len = this.SelectedObjectsStack.length;
		if (_len > 0)
		{
			if (this.SelectedObjectsStack[_len - 1].Type == c_oAscTypeSelectElement.Paragraph)
			{
				this.SelectedObjectsStack[_len - 1].Value = new Asc.asc_CParagraphProperty(prProp);
				return;
			}
		}

		this.SelectedObjectsStack[this.SelectedObjectsStack.length] = new asc_CSelectedObject(c_oAscTypeSelectElement.Paragraph, new Asc.asc_CParagraphProperty(prProp));
	};

	asc_docs_api.prototype.sync_MathPropCallback = function(MathProp)
	{
		this.SelectedObjectsStack[this.SelectedObjectsStack.length] = new asc_CSelectedObject(c_oAscTypeSelectElement.Math, MathProp);
	};

	asc_docs_api.prototype.sync_EndAddShape = function()
	{
		editor.sendEvent("asc_onEndAddShape");
		if (this.WordControl.m_oDrawingDocument.m_sLockedCursorType == "crosshair")
		{
			this.WordControl.m_oDrawingDocument.UnlockCursorType();
		}
	};

	asc_docs_api.prototype.SetDrawingFreeze = function(bIsFreeze)
	{
		if (!this.WordControl)
			return;

		this.WordControl.DrawingFreeze = bIsFreeze;

		var _elem1 = document.getElementById("id_main");
		if (_elem1)
		{
			var _elem2 = document.getElementById("id_horscrollpanel");
			var _elem3 = document.getElementById("id_panel_right");
			if (bIsFreeze)
			{
				_elem1.style.display = "none";
				_elem2.style.display = "none";
				_elem3.style.display = "none";
			}
			else
			{
				_elem1.style.display = "block";
				_elem2.style.display = "block";
				_elem3.style.display = "block";
			}
		}

		if (!bIsFreeze)
			this.WordControl.OnScroll();
	};

	//----------------------------------------------------------------------------------------------------------------------
	// Работаем с формулами
	//----------------------------------------------------------------------------------------------------------------------
	asc_docs_api.prototype.asc_SetMathProps = function(MathProps)
	{
		this.WordControl.m_oLogicDocument.Set_MathProps(MathProps);
	};

	asc_docs_api.prototype["asc_SetMathProps"] = asc_docs_api.prototype.asc_SetMathProps;
	//----------------------------------------------------------------------------------------------------------------------
	// Работаем с настройками секции
	//----------------------------------------------------------------------------------------------------------------------
	asc_docs_api.prototype.change_PageOrient       = function(isPortrait)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Document_SectPr))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetPageOrientation);
			if (isPortrait)
			{
				this.WordControl.m_oLogicDocument.Set_DocumentOrientation(Asc.c_oAscPageOrientation.PagePortrait);
				this.DocumentOrientation = isPortrait;
			}
			else
			{
				this.WordControl.m_oLogicDocument.Set_DocumentOrientation(Asc.c_oAscPageOrientation.PageLandscape);
				this.DocumentOrientation = isPortrait;
			}
			this.sync_PageOrientCallback(editor.get_DocumentOrientation());
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.get_DocumentOrientation = function()
	{
		return this.DocumentOrientation;
	};
	asc_docs_api.prototype.change_DocSize          = function(width, height)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Document_SectPr))
		{
			if (this.isMobileVersion && this.WordControl.MobileTouchManager)
				this.WordControl.MobileTouchManager.BeginZoomCheck();

			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetPageSize);
			if (this.DocumentOrientation)
				this.WordControl.m_oLogicDocument.Set_DocumentPageSize(width, height);
			else
				this.WordControl.m_oLogicDocument.Set_DocumentPageSize(height, width);

			this.WordControl.m_oLogicDocument.FinalizeAction();

			if (this.isMobileVersion && this.WordControl.MobileTouchManager)
				this.WordControl.MobileTouchManager.EndZoomCheck();
		}
	};

	asc_docs_api.prototype.get_DocumentWidth = function()
	{
		return AscCommon.Page_Width;
	};

	asc_docs_api.prototype.get_DocumentHeight = function()
	{
		return AscCommon.Page_Height;
	};

	asc_docs_api.prototype.asc_SetSectionProps       = function(Props)
	{
		this.WordControl.m_oLogicDocument.Set_SectionProps(Props);
	};
	asc_docs_api.prototype.asc_GetSectionProps       = function()
	{
		return this.WordControl.m_oLogicDocument.Get_SectionProps();
	};
	asc_docs_api.prototype.asc_GetCurrentColumnWidth = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return 0;

		return oLogicDocument.GetCurrentColumnWidth();
	};
	asc_docs_api.prototype.sync_SectionPropsCallback = function(Props)
	{
		this.sendEvent("asc_onSectionProps", Props);
	};
	asc_docs_api.prototype["asc_SetSectionProps"]       = asc_docs_api.prototype.asc_SetSectionProps;
	asc_docs_api.prototype["asc_GetSectionProps"]       = asc_docs_api.prototype.asc_GetSectionProps;
	asc_docs_api.prototype["asc_GetCurrentColumnWidth"] = asc_docs_api.prototype.asc_GetCurrentColumnWidth;

	asc_docs_api.prototype.asc_SetColumnsProps       = function(ColumnsProps)
	{
		this.WordControl.m_oLogicDocument.Set_ColumnsProps(ColumnsProps);
	};
	asc_docs_api.prototype.asc_GetColumnsProps       = function()
	{
		return this.WordControl.m_oLogicDocument.Get_ColumnsProps();
	};
	asc_docs_api.prototype["asc_SetColumnsProps"]    = asc_docs_api.prototype.asc_SetColumnsProps;
	asc_docs_api.prototype["asc_GetColumnsProps"]    = asc_docs_api.prototype.asc_GetColumnsProps;

	asc_docs_api.prototype.asc_GetWatermarkProps = function()
	{
		return this.WordControl.m_oLogicDocument.GetWatermarkProps();
	};

	asc_docs_api.prototype.asc_SetWatermarkProps = function(oProps)
	{
		var oTextPr = oProps.get_TextPr();
		var oApi = this;
		if(oTextPr)
		{
			var oFontFamily = oTextPr.get_FontFamily();
			if(oFontFamily && typeof oFontFamily.get_Name() === "string")
			{
				if(!g_fontApplication)
				{
					return;
				}
				var oLoader     = AscCommon.g_font_loader;
				var oFontInfo   = g_fontApplication.GetFontInfo(oFontFamily.get_Name());
				oFontFamily.put_Name(oFontInfo.Name);
				var bAsync    = oLoader.LoadFont(oFontInfo, function () {
					this.sync_EndAction(c_oAscAsyncActionType.Information, c_oAscAsyncAction.LoadFont);
					oApi.asc_SetWatermarkProps(oProps);
				}, null);
				if(bAsync)
				{
					return;
				}
			}
		}
		return this.WordControl.m_oLogicDocument.SetWatermarkProps(oProps);
	};
	asc_docs_api.prototype.asc_WatermarkRemove = function(oProps)
	{
		var oProps = new Asc.CAscWatermarkProperties();
		oProps.put_Type(Asc.c_oAscWatermarkType.None);
		return this.WordControl.m_oLogicDocument.SetWatermarkProps(oProps);
	};

	asc_docs_api.prototype.sync_ColumnsPropsCallback = function(ColumnsProps)
	{
		this.sendEvent("asc_onColumnsProps", ColumnsProps);
	};
	asc_docs_api.prototype.asc_SetFootnoteProps = function(oFootnotePr, bApplyToAll)
	{
		this.WordControl.m_oLogicDocument.SetFootnotePr(oFootnotePr, bApplyToAll);
	};
	asc_docs_api.prototype.asc_GetFootnoteProps = function()
	{
		return this.WordControl.m_oLogicDocument.GetFootnotePr();
	};
	asc_docs_api.prototype.asc_AddFootnote = function(sText)
	{
		return this.WordControl.m_oLogicDocument.AddFootnote(sText);
	};
	asc_docs_api.prototype.asc_RemoveAllFootnotes = function()
	{
		this.WordControl.m_oLogicDocument.RemoveAllFootnotes();
	};
	asc_docs_api.prototype.asc_GotoFootnote = function(isNext)
	{
		this.WordControl.m_oLogicDocument.GotoFootnote(isNext);
	};
	asc_docs_api.prototype.asc_IsCursorInFootnote = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (oLogicDocument && true === oLogicDocument.IsCursorInFootnote())
			return true;

		return false;
	};
	asc_docs_api.prototype["asc_AddFootnote"]        = asc_docs_api.prototype.asc_AddFootnote;
	asc_docs_api.prototype["asc_RemoveAllFootnotes"] = asc_docs_api.prototype.asc_RemoveAllFootnotes;
	asc_docs_api.prototype["asc_GetFootnoteProps"]   = asc_docs_api.prototype.asc_GetFootnoteProps;
	asc_docs_api.prototype["asc_SetFootnoteProps"]   = asc_docs_api.prototype.asc_SetFootnoteProps;
	asc_docs_api.prototype["asc_GotoFootnote"]       = asc_docs_api.prototype.asc_GotoFootnote;
	asc_docs_api.prototype["asc_IsCursorInFootnote"] = asc_docs_api.prototype.asc_IsCursorInFootnote;

	asc_docs_api.prototype.put_AddPageBreak              = function()
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content))
		{
			var Document = this.WordControl.m_oLogicDocument;

			if (null === Document.IsCursorInHyperlink(false))
			{
				this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddPageBreak);
				this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaNewLine(AscCommonWord.break_Page));
				this.WordControl.m_oLogicDocument.FinalizeAction();
			}
		}
	};
	asc_docs_api.prototype.put_AddColumnBreak            = function()
	{
		var Document = this.WordControl.m_oLogicDocument;
		if (false === Document.Document_Is_SelectionLocked(changestype_Paragraph_Content))
		{
			if (null === Document.IsCursorInHyperlink(false))
			{
				this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddPageBreak);
				this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaNewLine(AscCommonWord.break_Column));
				this.WordControl.m_oLogicDocument.FinalizeAction();
			}
		}
	};
	asc_docs_api.prototype.Update_ParaInd                = function(Ind)
	{
		var FirstLine = 0,
			Left      = 0,
			Right     = 0;
		if ("undefined" != typeof(Ind))
		{
			if ("undefined" != typeof(Ind.FirstLine))
			{
				FirstLine = Ind.FirstLine;
			}
			if ("undefined" != typeof(Ind.Left))
			{
				Left = Ind.Left;
			}
			if ("undefined" != typeof(Ind.Right))
			{
				Right = Ind.Right;
			}
		}

		var bIsUpdate = false;
		var _ruler    = this.WordControl.m_oHorRuler;
		if (_ruler.m_dIndentLeft != Left)
		{
			_ruler.m_dIndentLeft = Left;
			bIsUpdate            = true;
		}
		if (_ruler != (FirstLine + Left))
		{
			_ruler.m_dIndentLeftFirst = (FirstLine + Left);
			bIsUpdate                 = true;
		}
		if (_ruler.m_dIndentRight != Right)
		{
			_ruler.m_dIndentRight = Right;
			bIsUpdate             = true;
		}
		if (bIsUpdate)
			this.WordControl.UpdateHorRuler();
	};
	asc_docs_api.prototype.Internal_Update_Ind_FirstLine = function(FirstLine, Left)
	{
		if (this.WordControl.m_oHorRuler.m_dIndentLeftFirst != (FirstLine + Left))
		{
			this.WordControl.m_oHorRuler.m_dIndentLeftFirst = (FirstLine + Left);
			this.WordControl.UpdateHorRuler();
		}
	};
	asc_docs_api.prototype.Internal_Update_Ind_Left      = function(Left)
	{
		if (this.WordControl.m_oHorRuler.m_dIndentLeft != Left)
		{
			this.WordControl.m_oHorRuler.m_dIndentLeft = Left;
			this.WordControl.UpdateHorRuler();
		}
	};
	asc_docs_api.prototype.Internal_Update_Ind_Right     = function(Right)
	{
		if (this.WordControl.m_oHorRuler.m_dIndentRight != Right)
		{
			this.WordControl.m_oHorRuler.m_dIndentRight = Right;
			this.WordControl.UpdateHorRuler();
		}
	};

	// "where" где нижний или верхний, align выравнивание
	asc_docs_api.prototype.put_PageNum = function(where, align)
	{
		if (where >= 0)
		{
			if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_None, {Type : AscCommon.changestype_2_HdrFtr}))
			{
				this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddPageNumToHdrFtr);
				this.WordControl.m_oLogicDocument.Document_AddPageNum(where, align);
				this.WordControl.m_oLogicDocument.FinalizeAction();
			}
		}
		else
		{
			if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content))
			{
				this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddPageNumToCurrentPos);
				this.WordControl.m_oLogicDocument.Document_AddPageNum(where, align);
				this.WordControl.m_oLogicDocument.FinalizeAction();
			}
		}
	};

	asc_docs_api.prototype.put_HeadersAndFootersDistance = function(value)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_HdrFtr))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetHdrFtrDistance);
			this.WordControl.m_oLogicDocument.Document_SetHdrFtrDistance(value);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.HeadersAndFooters_DifferentFirstPage = function(isOn)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_HdrFtr))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetHdrFtrFirstPage);
			this.WordControl.m_oLogicDocument.Document_SetHdrFtrFirstPage(isOn);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.HeadersAndFooters_DifferentOddandEvenPage = function(isOn)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_HdrFtr))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetHdrFtrEvenAndOdd);
			this.WordControl.m_oLogicDocument.Document_SetHdrFtrEvenAndOddHeaders(isOn);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.HeadersAndFooters_LinkToPrevious = function(isOn)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_HdrFtr))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetHdrFtrLink);
			this.WordControl.m_oLogicDocument.Document_SetHdrFtrLink(isOn);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.asc_SetSectionStartPage = function(nStartPage)
	{
		if (isNaN(nStartPage))
			return;

		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		if (false === oLogicDocument.Document_Is_SelectionLocked())
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_SectionStartPage);
			oLogicDocument.SetSectionStartPage(nStartPage);
			oLogicDocument.FinalizeAction();
		}
	};

	/*структура для передачи настроек колонтитулов
	 {
	 Type : hdrftr_Footer (hdrftr_Header),
	 Position : 12.5,
	 DifferentFirst : true/false,
	 DifferentEvenOdd : true/false,
	 }
	 */
	/*callback*/
	asc_docs_api.prototype.sync_DocSizeCallback               = function(width, height)
	{
		this.sendEvent("asc_onDocSize", width, height);
	};
	asc_docs_api.prototype.sync_PageOrientCallback            = function(isPortrait)
	{
		this.sendEvent("asc_onPageOrient", isPortrait);
	};
	asc_docs_api.prototype.sync_HeadersAndFootersPropCallback = function(hafProp)
	{
		if (true === hafProp)
			hafProp.Locked = true;

		this.SelectedObjectsStack[this.SelectedObjectsStack.length] = new asc_CSelectedObject(c_oAscTypeSelectElement.Header, new CHeaderProp(hafProp));
	};

	/*----------------------------------------------------------------*/
	/*functions for working with table*/
	asc_docs_api.prototype.put_Table               = function(col, row)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Document_Content_Add))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddTable);
			this.WordControl.m_oLogicDocument.AddInlineTable(col, row);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.addRowAbove             = function(count)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Table_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_TableAddRowAbove);
			this.WordControl.m_oLogicDocument.AddTableRow(true);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.addRowBelow             = function(count)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Table_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_TableAddRowBelow);
			this.WordControl.m_oLogicDocument.AddTableRow(false);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.addColumnLeft           = function(count)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Table_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_TableAddColumnLeft);
			this.WordControl.m_oLogicDocument.AddTableColumn(true);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.addColumnRight          = function(count)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Table_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_TableAddColumnRight);
			this.WordControl.m_oLogicDocument.AddTableColumn(false);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.remRow                  = function()
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return false;

		oLogicDocument.SelectTable(c_oAscTableSelectionType.Row);

		if (!oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Remove))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_TableRemoveRow);
			oLogicDocument.RemoveTableRow();
			oLogicDocument.FinalizeAction();

			return true;
		}
		else
		{
			return false;
		}
	};
	asc_docs_api.prototype.remColumn               = function()
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return false;

		oLogicDocument.SelectTable(c_oAscTableSelectionType.Column);

		if (!oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Remove))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_TableRemoveColumn);
			oLogicDocument.RemoveTableColumn();
			oLogicDocument.FinalizeAction();

			return true;
		}
		else
		{
			return false;
		}
	};
	asc_docs_api.prototype.remTable                = function()
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return false;

		oLogicDocument.SelectTable(c_oAscTableSelectionType.Table);

		if (!oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Remove))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_RemoveTable);
			oLogicDocument.RemoveTable();
			oLogicDocument.FinalizeAction();

			return true;
		}
		else
		{
			return false;
		}
	};
	asc_docs_api.prototype.selectRow               = function()
	{
		this.WordControl.m_oLogicDocument.SelectTable(c_oAscTableSelectionType.Row);
	};
	asc_docs_api.prototype.selectColumn            = function()
	{
		this.WordControl.m_oLogicDocument.SelectTable(c_oAscTableSelectionType.Column);
	};
	asc_docs_api.prototype.selectCell              = function()
	{
		this.WordControl.m_oLogicDocument.SelectTable(c_oAscTableSelectionType.Cell);
	};
	asc_docs_api.prototype.selectTable             = function()
	{
		this.WordControl.m_oLogicDocument.SelectTable(c_oAscTableSelectionType.Table);
	};
	asc_docs_api.prototype.setColumnWidth          = function(width)
	{

	};
	asc_docs_api.prototype.setRowHeight            = function(height)
	{

	};
	asc_docs_api.prototype.set_TblDistanceFromText = function(left, top, right, bottom)
	{

	};
	asc_docs_api.prototype.CheckBeforeMergeCells   = function()
	{
		return this.WordControl.m_oLogicDocument.CanMergeTableCells();
	};
	asc_docs_api.prototype.CheckBeforeSplitCells   = function()
	{
		return this.WordControl.m_oLogicDocument.CanSplitTableCells();
	};
	asc_docs_api.prototype.MergeCells              = function()
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Table_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_MergeTableCells);
			this.WordControl.m_oLogicDocument.MergeTableCells();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.SplitCell               = function(Cols, Rows)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Table_Properties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SplitTableCells);
			this.WordControl.m_oLogicDocument.SplitTableCells(Cols, Rows);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.asc_DistributeTableCells = function(isHorizontally)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		var bResult = false;

		if (false === oLogicDocument.Document_Is_SelectionLocked(changestype_Table_Properties))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_DistributeTableCells);
			bResult = oLogicDocument.DistributeTableCells(isHorizontally);
			oLogicDocument.FinalizeAction();
		}

		return bResult;
	};
	asc_docs_api.prototype.asc_RemoveTableCells    = function()
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return false;

		if (!oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Remove))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_RemoveTableCells);
			oLogicDocument.RemoveTableCells();
			oLogicDocument.FinalizeAction();

			return true;
		}
		else
		{
			return false;
		}
	};
	asc_docs_api.prototype.widthTable              = function(width)
	{

	};
	asc_docs_api.prototype.put_CellsMargin         = function(left, top, right, bottom)
	{

	};
	asc_docs_api.prototype.set_TblWrap             = function(type)
	{

	};
	asc_docs_api.prototype.set_TblIndentLeft       = function(spacing)
	{

	};
	asc_docs_api.prototype.set_Borders             = function(typeBorders, size, Color)
	{//если size == 0 то границы нет.

	};
	asc_docs_api.prototype.set_TableBackground     = function(Color)
	{

	};
	asc_docs_api.prototype.set_AlignCell           = function(align)
	{// c_oAscAlignType.RIGHT, c_oAscAlignType.LEFT, c_oAscAlignType.CENTER
		switch (align)
		{
			case c_oAscAlignType.LEFT :
				break;
			case c_oAscAlignType.CENTER :
				break;
			case c_oAscAlignType.RIGHT :
				break;
		}
	};
	asc_docs_api.prototype.set_TblAlign            = function(align)
	{// c_oAscAlignType.RIGHT, c_oAscAlignType.LEFT, c_oAscAlignType.CENTER
		switch (align)
		{
			case c_oAscAlignType.LEFT :
				break;
			case c_oAscAlignType.CENTER :
				break;
			case c_oAscAlignType.RIGHT :
				break;
		}
	};
	asc_docs_api.prototype.set_SpacingBetweenCells = function(isOn, spacing)
	{// c_oAscAlignType.RIGHT, c_oAscAlignType.LEFT, c_oAscAlignType.CENTER
		if (isOn)
		{

		}
	};
	asc_docs_api.prototype.tblApply = function(obj)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Table_Properties))
		{
			if (obj.CellBorders)
			{
				if (obj.CellBorders.Left && obj.CellBorders.Left.Color)
				{
					obj.CellBorders.Left.Unifill = AscFormat.CreateUnifillFromAscColor(obj.CellBorders.Left.Color, 1);
				}
				if (obj.CellBorders.Top && obj.CellBorders.Top.Color)
				{
					obj.CellBorders.Top.Unifill = AscFormat.CreateUnifillFromAscColor(obj.CellBorders.Top.Color, 1);
				}
				if (obj.CellBorders.Right && obj.CellBorders.Right.Color)
				{
					obj.CellBorders.Right.Unifill = AscFormat.CreateUnifillFromAscColor(obj.CellBorders.Right.Color, 1);
				}
				if (obj.CellBorders.Bottom && obj.CellBorders.Bottom.Color)
				{
					obj.CellBorders.Bottom.Unifill = AscFormat.CreateUnifillFromAscColor(obj.CellBorders.Bottom.Color, 1);
				}
				if (obj.CellBorders.InsideH && obj.CellBorders.InsideH.Color)
				{
					obj.CellBorders.InsideH.Unifill = AscFormat.CreateUnifillFromAscColor(obj.CellBorders.InsideH.Color, 1);
				}
				if (obj.CellBorders.InsideV && obj.CellBorders.InsideV.Color)
				{
					obj.CellBorders.InsideV.Unifill = AscFormat.CreateUnifillFromAscColor(obj.CellBorders.InsideV.Color, 1);
				}
			}
			if (obj.CellsBackground && obj.CellsBackground.Color)
			{
				obj.CellsBackground.Unifill = AscFormat.CreateUnifillFromAscColor(obj.CellsBackground.Color, 1);
			}

			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_ApplyTablePr);
			this.WordControl.m_oLogicDocument.SetTableProps(obj);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	/*callbacks*/
	asc_docs_api.prototype.sync_AddTableCallback            = function()
	{
		this.sendEvent("asc_onAddTable");
	};
	asc_docs_api.prototype.sync_AlignCellCallback           = function(align)
	{
		this.sendEvent("asc_onAlignCell", align);
	};
	asc_docs_api.prototype.sync_TblPropCallback             = function(tblProp)
	{
		//if ( true === CollaborativeEditing.Get_GlobalLock() )
		//    tblProp.Locked = true;

		// TODO: вызвать функцию asc_onInitTableTemplatesв зависимости от TableLook
		if (tblProp.CellsBackground && tblProp.CellsBackground.Unifill)
		{
			var LogicDocument = this.WordControl.m_oLogicDocument;
			tblProp.CellsBackground.Unifill.check(LogicDocument.Get_Theme(), LogicDocument.Get_ColorMap());
			var RGBA                      = tblProp.CellsBackground.Unifill.getRGBAColor();
			tblProp.CellsBackground.Color = new AscCommonWord.CDocumentColor(RGBA.R, RGBA.G, RGBA.B, false);
		}
		this.SelectedObjectsStack[this.SelectedObjectsStack.length] = new asc_CSelectedObject(c_oAscTypeSelectElement.Table, new Asc.CTableProp(tblProp));
	};
	asc_docs_api.prototype.sync_TblWrapStyleChangedCallback = function(style)
	{
		this.sendEvent("asc_onTblWrapStyleChanged", style);
	};
	asc_docs_api.prototype.sync_TblAlignChangedCallback     = function(style)
	{
		this.sendEvent("asc_onTblAlignChanged", style);
	};

	/*----------------------------------------------------------------*/
	/*functions for working with images*/
	asc_docs_api.prototype.ChangeImageFromFile      = function()
	{
		this.asc_addImage({isImageChangeUrl: true});
	};
	asc_docs_api.prototype.ChangeShapeImageFromFile = function(type)
	{
		this.asc_addImage({isShapeImageChangeUrl: true, textureType: type});
	};

	asc_docs_api.prototype.AddImage     = function()
	{
		this.asc_addImage();
	};
	asc_docs_api.prototype.AddImageUrl2 = function(url)
	{
		this.AddImageUrl(AscCommon.getFullImageSrc2(url));
	};

	asc_docs_api.prototype._addImageUrl      = function(urls, obj)
	{
        if(obj && (obj.isImageChangeUrl || obj.isShapeImageChangeUrl || obj["obj"])){
            this.AddImageUrl(urls[0], undefined, undefined, obj);
        }
        else{
            if(this.ImageLoader){
                var oApi = this;
                this.ImageLoader.LoadImagesWithCallback(urls, function(){
                    if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content)){
                        var aImages = [];
                        for(var i = 0; i < urls.length; ++i){
                            var _image = oApi.ImageLoader.LoadImage(urls[i], 1);
                            if(_image){
                                aImages.push(_image);
                            }
                        }
                        if(aImages.length){
							oApi.WordControl.m_oLogicDocument.StartAction();
							oApi.WordControl.m_oLogicDocument.TurnOff_InterfaceEvents();
                            oApi.WordControl.m_oLogicDocument.AddImages(aImages);
							oApi.WordControl.m_oLogicDocument.TurnOn_InterfaceEvents(true);
							oApi.WordControl.m_oLogicDocument.FinalizeAction();
						}

                    }
                }, []);
            }
        }
	};
	asc_docs_api.prototype.AddImageUrl       = function(url, imgProp, token, obj)
	{
		if (g_oDocumentUrls.getLocal(url))
		{
			this.AddImageUrlAction(url, imgProp, obj);
		}
		else
		{
		    var t = this;
			AscCommon.sendImgUrls(this, [url], function(data) {

                if (data && data[0])
                    t.AddImageUrlAction(data[0].url, imgProp, obj);

            }, false, undefined, token);
		}
	};
	asc_docs_api.prototype.AddImageUrlAction = function(url, imgProp, obj)
	{
		var _image = this.ImageLoader.LoadImage(url, 1);
		if (null != _image)
		{
			var ColumnSize = this.WordControl.m_oLogicDocument.GetColumnSize();

			var _w = Math.max(1, ColumnSize.W);
			var _h = Math.max(1, ColumnSize.H);
			if (_image.Image != null)
			{
				var __w = Math.max((_image.Image.width * AscCommon.g_dKoef_pix_to_mm), 1);
				var __h = Math.max((_image.Image.height * AscCommon.g_dKoef_pix_to_mm), 1);
				_w      = Math.max(5, Math.min(_w, __w));
				_h      = Math.max(5, Math.min((_w * __h / __w)));
			}

			var src = _image.src;
			if (obj && obj.isShapeImageChangeUrl)
			{
				var AscShapeProp       = new Asc.asc_CShapeProperty();
				AscShapeProp.fill      = new asc_CShapeFill();
				AscShapeProp.fill.type = c_oAscFill.FILL_TYPE_BLIP;
				AscShapeProp.fill.fill = new asc_CFillBlip();
				AscShapeProp.fill.fill.asc_putUrl(src);
				if(obj.textureType !== null && obj.textureType !== undefined){
                    AscShapeProp.fill.fill.asc_putType(obj.textureType);
				}
				this.ImgApply(new asc_CImgProperty({ShapeProperties : AscShapeProp}));
			}
			else if (obj && obj.isImageChangeUrl)
			{
				var AscImageProp      = new asc_CImgProperty();
				AscImageProp.ImageUrl = src;
				this.ImgApply(AscImageProp);
			}
			else if (obj && obj["obj"] && obj["obj"].Get_Id)
			{
				this.asc_SetContentControlPictureUrl(src, obj["obj"].Get_Id());
			}
			else
			{
				if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content))
				{
					var imageLocal = g_oDocumentUrls.getImageLocal(src);
					if (imageLocal)
					{
						src = imageLocal;
					}

					this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddImageUrl);
					if (undefined === imgProp || undefined === imgProp.WrappingStyle || 0 == imgProp.WrappingStyle)
						this.WordControl.m_oLogicDocument.AddInlineImage(_w, _h, src);
					else
						this.WordControl.m_oLogicDocument.AddInlineImage(_w, _h, src, null, true);
					this.WordControl.m_oLogicDocument.FinalizeAction();
				}
			}
		}
		else
		{
			this.sync_StartAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadImage);
			this.asyncImageEndLoaded2 = function(_image)
			{
				var ColumnSize = this.WordControl.m_oLogicDocument.GetColumnSize();

				var _w = Math.max(1, ColumnSize.W);
				var _h = Math.max(1, ColumnSize.H);
				if (_image.Image != null)
				{
					var __w = Math.max((_image.Image.width * AscCommon.g_dKoef_pix_to_mm), 1);
					var __h = Math.max((_image.Image.height * AscCommon.g_dKoef_pix_to_mm), 1);
					_w      = Math.max(5, Math.min(_w, __w));
					_h      = Math.max(5, Math.min((_w * __h / __w)));
				}
				var src = _image.src;

				if (obj && obj.isShapeImageChangeUrl)
				{
					var AscShapeProp       = new Asc.asc_CShapeProperty();
					AscShapeProp.fill      = new asc_CShapeFill();
					AscShapeProp.fill.type = c_oAscFill.FILL_TYPE_BLIP;
					AscShapeProp.fill.fill = new asc_CFillBlip();
					AscShapeProp.fill.fill.asc_putUrl(src);

                    if(obj.textureType !== null && obj.textureType !== undefined){
                        AscShapeProp.fill.fill.asc_putType(obj.textureType);
                    }
					this.ImgApply(new asc_CImgProperty({ShapeProperties : AscShapeProp}));
				}
				else if (obj && obj.isImageChangeUrl)
				{
					var AscImageProp      = new asc_CImgProperty();
					AscImageProp.ImageUrl = src;
					this.ImgApply(AscImageProp);
				}
				else if (obj && obj["obj"] && obj["obj"].Get_Id)
				{
					this.asc_SetContentControlPictureUrl(src, obj["obj"].Get_Id());
				}
				else
				{

					if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content))
					{
						var imageLocal = g_oDocumentUrls.getImageLocal(src);
						if (imageLocal)
						{
							src = imageLocal;
						}
						this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddImageUrlLong);
						if (undefined === imgProp || undefined === imgProp.WrappingStyle || 0 == imgProp.WrappingStyle)
							this.WordControl.m_oLogicDocument.AddInlineImage(_w, _h, src);
						else
							this.WordControl.m_oLogicDocument.AddInlineImage(_w, _h, src, null, true);
						this.WordControl.m_oLogicDocument.FinalizeAction();
					}
				}
				this.sync_EndAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadImage);

				this.asyncImageEndLoaded2 = null;
			}
		}
	};
	/*
	 Добавляем картинку на заданную страницу. Преполагаем, что картинка уже доступна по ссылке.
	 */
	asc_docs_api.prototype.AddImageToPage = function(sUrl, nPageIndex, dX, dY, dW, dH)
	{
		var LogicDocument = this.WordControl.m_oLogicDocument;

		var oldClickCount            = global_mouseEvent.ClickCount;
		global_mouseEvent.Button     = 0;
		global_mouseEvent.ClickCount = 1;
		LogicDocument.OnMouseDown(global_mouseEvent, dX, dY, nPageIndex);
		LogicDocument.OnMouseUp(global_mouseEvent, dX, dY, nPageIndex);
		LogicDocument.OnMouseMove(global_mouseEvent, dX, dY, nPageIndex);
		global_mouseEvent.ClickCount = oldClickCount;

		if (false === LogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content))
		{
			var oPosH = new Asc.CImagePositionH();
			oPosH.put_RelativeFrom(Asc.c_oAscRelativeFromH.Page);
			oPosH.put_Align(false);
			oPosH.put_Value(dX);
			var oPosV = new Asc.CImagePositionV();
			oPosV.put_RelativeFrom(Asc.c_oAscRelativeFromV.Page);
			oPosV.put_Align(false);
			oPosV.put_Value(dY);
			var oImageProps = new asc_CImgProperty();
			oImageProps.asc_putWrappingStyle(c_oAscWrapStyle2.Square);
			oImageProps.asc_putPositionH(oPosH);
			oImageProps.asc_putPositionV(oPosV);

			// TODO: Убрать SilentMode, когда переделаются функции AddInlineImage, SetImageProps (в них нужно передалать пересчет и обновляения согласно схеме Actions)
			LogicDocument.StartAction(AscDFH.historydescription_Document_AddImageToPage);
			LogicDocument.Start_SilentMode();
			LogicDocument.AddInlineImage(dW, dH, sUrl);
			LogicDocument.SetImageProps(oImageProps);
			LogicDocument.End_SilentMode(true);
			LogicDocument.FinalizeAction();
		}
	};
	/* В качестве параметра  передается объект класса Asc.asc_CImgProperty, он же приходит на OnImgProp
	 Asc.asc_CImgProperty заменяет пережнюю структуру:
	 если параметр не имеет значения то передвать следует null, напримере inline-картинок: в качестве left,top,bottom,right,X,Y,ImageUrl необходимо передавать null.
	 {
	 Width: 0,
	 Height: 0,
	 WrappingStyle: 0,
	 Paddings: { Left : 0, Top : 0, Bottom: 0, Right: 0 },
	 Position : {X : 0, Y : 0},
	 ImageUrl : ""
	 }
	 */

	asc_docs_api.prototype.asc_getSelectedDrawingObjectsCount = function()
	{
		if(!this.WordControl)
		{
			return 0;
		}
		if(!this.WordControl.m_oLogicDocument)
		{
			return 0;
		}
		return this.WordControl.m_oLogicDocument.GetSelectedDrawingObjectsCount();
	};


	asc_docs_api.prototype.put_ShapesAlign = function(type, alignType)
	{
		if(!this.WordControl)
		{
			return;
		}
		if(!this.WordControl.m_oLogicDocument)
		{
			return;
		}
		if(!AscFormat.isRealNumber(alignType))
		{
			alignType = Asc.c_oAscObjectsAlignType.Slide;
		}
		this.WordControl.m_oLogicDocument.PutShapesAlign(type, alignType);

	};
	asc_docs_api.prototype.DistributeHorizontally = function(alignType)
	{
		if(!AscFormat.isRealNumber(alignType))
		{
			alignType = Asc.c_oAscObjectsAlignType.Margin;
		}
		this.WordControl.m_oLogicDocument.DistributeDrawingsHorizontally(alignType);
	};
	asc_docs_api.prototype.DistributeVertically   = function(alignType)
	{
		if(!AscFormat.isRealNumber(alignType))
		{
			alignType = Asc.c_oAscObjectsAlignType.Margin;
		}
		this.WordControl.m_oLogicDocument.DistributeDrawingsVertically(alignType);
	};

	asc_docs_api.prototype.ImgApply                = function(obj)
	{

		if (!AscCommon.isRealObject(obj))
			return;
		var ImagePr = obj, AdditionalData, LogicDocument = this.WordControl.m_oLogicDocument;

		/*проверка корректности данных для биржевой диаграммы*/
		if (obj.ChartProperties && obj.ChartProperties.type === Asc.c_oAscChartTypeSettings.stock)
		{
			if (!AscFormat.CheckStockChart(this.WordControl.m_oLogicDocument.DrawingObjects, this))
			{
				return;
			}
		}

		/*изменение z-индекса*/
		if (AscFormat.isRealNumber(ImagePr.ChangeLevel))
		{
			switch (ImagePr.ChangeLevel)
			{
				case 0:
				{
					this.WordControl.m_oLogicDocument.DrawingObjects.bringToFront();
					break;
				}
				case 1:
				{
					this.WordControl.m_oLogicDocument.DrawingObjects.bringForward();
					break;
				}
				case 2:
				{
					this.WordControl.m_oLogicDocument.DrawingObjects.sendToBack();
					break;
				}
				case 3:
				{
					this.WordControl.m_oLogicDocument.DrawingObjects.bringBackward();
				}
			}
			return;
		}

		/*параграфы в которых лежат выделенные ParaDrawing*/
		var aParagraphs = [], aSelectedObjects = this.WordControl.m_oLogicDocument.DrawingObjects.selectedObjects, i, j, oParentParagraph;
		for (i = 0; i < aSelectedObjects.length; ++i)
		{
			oParentParagraph = aSelectedObjects[i].parent.Get_ParentParagraph();
			AscFormat.checkObjectInArray(aParagraphs, oParentParagraph);
		}


		AdditionalData = {
			Type      : AscCommon.changestype_2_ElementsArray_and_Type,
			Elements  : aParagraphs,
			CheckType : changestype_Paragraph_Content
		};
		/*группировка и разгруппировка*/
		if (ImagePr.Group === 1 || ImagePr.Group === -1)
		{
			if (false == this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Drawing_Props, AdditionalData))
			{
				this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_GroupUnGroup);
				if (ImagePr.Group === 1)
				{
					this.WordControl.m_oLogicDocument.DrawingObjects.groupSelectedObjects();
				}
				else
				{
					this.WordControl.m_oLogicDocument.DrawingObjects.unGroupSelectedObjects();
				}
				this.WordControl.m_oLogicDocument.FinalizeAction();
			}
			return;
		}


		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Drawing_Props))
		{
			if (ImagePr.ShapeProperties)
				ImagePr.ImageUrl = "";


			var sImageUrl = null, fReplaceCallback = null, bImageUrl = false, sImageToDownLoad = "";
			if (!AscCommon.isNullOrEmptyString(ImagePr.ImageUrl))
			{
				if (!g_oDocumentUrls.getImageLocal(ImagePr.ImageUrl))
				{
					sImageUrl        = ImagePr.ImageUrl;
					fReplaceCallback = function(sUrl)
					{
						ImagePr.ImageUrl = sUrl;
						sImageToDownLoad = sUrl;
					}
				}
				sImageToDownLoad = ImagePr.ImageUrl;
			}
			else if (ImagePr.ShapeProperties && ImagePr.ShapeProperties.fill &&
				ImagePr.ShapeProperties.fill.fill && !AscCommon.isNullOrEmptyString(ImagePr.ShapeProperties.fill.fill.url))
			{
				if (!g_oDocumentUrls.getImageLocal(ImagePr.ShapeProperties.fill.fill.url))
				{
					sImageUrl        = ImagePr.ShapeProperties.fill.fill.url;
					fReplaceCallback = function(sUrl)
					{
						ImagePr.ShapeProperties.fill.fill.url = sUrl;
						sImageToDownLoad                      = sUrl;
					}
				}
				sImageToDownLoad = ImagePr.ShapeProperties.fill.fill.url;
			}

			var oApi = this;

			if (!AscCommon.isNullOrEmptyString(sImageToDownLoad))
			{

				var fApplyCallback = function()
				{
					var _img = oApi.ImageLoader.LoadImage(sImageToDownLoad, 1);
					if (null != _img)
					{
						oApi.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_ApplyImagePrWithUrl);
						oApi.WordControl.m_oLogicDocument.SetImageProps(ImagePr);
						oApi.WordControl.m_oLogicDocument.UpdateInterface();
						oApi.WordControl.m_oLogicDocument.UpdateSelection();
						oApi.WordControl.m_oLogicDocument.FinalizeAction();
					}
					else
					{
						oApi.asyncImageEndLoaded2 = function(_image)
						{
							oApi.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_ApplyImagePrWithUrlLong);
							oApi.WordControl.m_oLogicDocument.SetImageProps(ImagePr);
							oApi.WordControl.m_oLogicDocument.UpdateInterface();
							oApi.WordControl.m_oLogicDocument.UpdateSelection();
							oApi.WordControl.m_oLogicDocument.FinalizeAction();
						}
					}
				};

				if (sImageUrl)
				{

					if (window["AscDesktopEditor"])
					{
						var _url = window["AscDesktopEditor"]["LocalFileGetImageUrl"](sImageToDownLoad);
						_url     = g_oDocumentUrls.getImageUrl(_url);
						fReplaceCallback(_url);
						fApplyCallback();
						return;
					}

                    AscCommon.sendImgUrls(this, [sImageToDownLoad], function(data) {

                        if (data && data[0])
                        {
                            fReplaceCallback(data[0].url);
                            fApplyCallback();
                        }

                    }, false);
				}
				else
				{
					fApplyCallback();
				}
			}
			else
			{
				ImagePr.ImageUrl = null;
				if (!this.noCreatePoint || this.exucuteHistory)
				{
					if (!this.noCreatePoint && !this.exucuteHistory && this.exucuteHistoryEnd)
					{
						if (-1 !== this.nCurPointItemsLength)
						{
							History.UndoLastPoint();
						}
						else
						{
							this.WordControl.m_oLogicDocument.Create_NewHistoryPoint(AscDFH.historydescription_Document_ApplyImagePr);
						}
						this.WordControl.m_oLogicDocument.SetImageProps(ImagePr);
						this.exucuteHistoryEnd    = false;
						this.nCurPointItemsLength = -1;
					}
					else
					{
						this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_ApplyImagePr);
						this.WordControl.m_oLogicDocument.SetImageProps(ImagePr);
						this.WordControl.m_oLogicDocument.UpdateInterface();
						this.WordControl.m_oLogicDocument.UpdateSelection();
						this.WordControl.m_oLogicDocument.FinalizeAction();
					}
					if (this.exucuteHistory)
					{
						this.exucuteHistory = false;
						var oPoint          = History.Points[History.Index];
						if (oPoint)
						{
							this.nCurPointItemsLength = oPoint.Items.length;
						}
					}
				}
				else
				{
					var bNeedCheckChangesCount = false;
					if (-1 !== this.nCurPointItemsLength)
					{
						History.UndoLastPoint();
					}
					else
					{
						bNeedCheckChangesCount = true;
						this.WordControl.m_oLogicDocument.Create_NewHistoryPoint(AscDFH.historydescription_Document_ApplyImagePr);
					}
					this.WordControl.m_oLogicDocument.SetImageProps(ImagePr);
					if (bNeedCheckChangesCount)
					{
						var oPoint = History.Points[History.Index];
						if (oPoint)
						{
							this.nCurPointItemsLength = oPoint.Items.length;
						}
					}
				}
                this.exucuteHistoryEnd = false;
			}
		}
	};
	asc_docs_api.prototype.set_Size                = function(width, height)
	{

	};
	asc_docs_api.prototype.set_ConstProportions    = function(isOn)
	{
		if (isOn)
		{

		}
		else
		{

		}
	};
	asc_docs_api.prototype.set_WrapStyle           = function(type)
	{

	};
	asc_docs_api.prototype.deleteImage             = function()
	{

	};
	asc_docs_api.prototype.set_ImgDistanceFromText = function(left, top, right, bottom)
	{

	};
	asc_docs_api.prototype.set_PositionOnPage      = function(X, Y)
	{//расположение от начала страницы

	};
	asc_docs_api.prototype.get_OriginalSizeImage   = function()
	{
        for(var i = 0; i < this.SelectedObjectsStack.length; ++i){
            if(this.SelectedObjectsStack[i].Type == c_oAscTypeSelectElement.Image && this.SelectedObjectsStack[i].Value && this.SelectedObjectsStack[i].Value.ImageUrl){
                return this.SelectedObjectsStack[i].Value.asc_getOriginSize(this);
            }
        }
        return null;
	};

	asc_docs_api.prototype.ShapeApply = function(shapeProps)
	{
		// нужно определить, картинка это или нет
		var image_url = "";
		if (shapeProps.fill != null)
		{
			if (shapeProps.fill.fill != null && shapeProps.fill.type == c_oAscFill.FILL_TYPE_BLIP)
			{
				image_url = shapeProps.fill.fill.asc_getUrl();

				var _tx_id = shapeProps.fill.fill.asc_getTextureId();
				if (null != _tx_id && 0 <= _tx_id && _tx_id < AscCommon.g_oUserTexturePresets.length)
				{
					image_url = AscCommon.g_oUserTexturePresets[_tx_id];
				}
			}
		}
		if (image_url != "")
		{
			var _image = this.ImageLoader.LoadImage(image_url, 1);

			var imageLocal = g_oDocumentUrls.getImageLocal(image_url);
			if (imageLocal)
			{
				shapeProps.fill.fill.asc_putUrl(imageLocal); // erase documentUrl
			}

			if (null != _image)
			{
				this.WordControl.m_oLogicDocument.ShapeApply(shapeProps);
				this.WordControl.m_oDrawingDocument.DrawImageTextureFillShape(image_url);
			}
			else
			{
				this.sync_StartAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadImage);

				var oProp                 = shapeProps;
				this.asyncImageEndLoaded2 = function(_image)
				{
					this.WordControl.m_oLogicDocument.ShapeApply(oProp);
					this.WordControl.m_oDrawingDocument.DrawImageTextureFillShape(image_url);

					this.sync_EndAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadImage);
					this.asyncImageEndLoaded2 = null;
				}
			}
		}
		else
		{
			this.WordControl.m_oLogicDocument.ShapeApply(shapeProps);
		}
	};
	/*callbacks*/
	asc_docs_api.prototype.sync_AddImageCallback            = function()
	{
		this.sendEvent("asc_onAddImage");
	};
	asc_docs_api.prototype.sync_ImgPropCallback             = function(imgProp)
	{
		//if ( true === CollaborativeEditing.Get_GlobalLock() )
		//    imgProp.Locked = true;

		this.SelectedObjectsStack[this.SelectedObjectsStack.length] = new asc_CSelectedObject(c_oAscTypeSelectElement.Image, new asc_CImgProperty(imgProp));
	};
	asc_docs_api.prototype.sync_ImgWrapStyleChangedCallback = function(style)
	{
		this.sendEvent("asc_onImgWrapStyleChanged", style);
	};


	asc_docs_api.prototype.asc_addOleObjectAction = function(sLocalUrl, sData, sApplicationId, fWidth, fHeight, nWidthPix, nHeightPix)
	{
		var _image = this.ImageLoader.LoadImage(AscCommon.getFullImageSrc2(sLocalUrl), 1);
		if (null != _image)//картинка уже должна быть загружена
		{
            this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_PasteHotKey);
			this.WordControl.m_oLogicDocument.AddOleObject(fWidth, fHeight, nWidthPix, nHeightPix, sLocalUrl, sData, sApplicationId);
            this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.asc_editOleObjectAction = function(bResize, oOleObject, sImageUrl, sData, nPixWidth, nPixHeight)
	{
		if (oOleObject)
		{
            this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_PasteHotKey);
			this.WordControl.m_oLogicDocument.EditOleObject(oOleObject, sData, sImageUrl, nPixWidth, nPixHeight);
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();
            this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

    asc_docs_api.prototype.asc_startEditCurrentOleObject = function(){
		this.WordControl.m_oLogicDocument.DrawingObjects.startEditCurrentOleObject();
    };
	//-----------------------------------------------------------------
	// События контекстного меню
	//-----------------------------------------------------------------

	function CContextMenuData(obj)
	{
		if (obj)
		{
			this.Type  = ( undefined != obj.Type ) ? obj.Type : Asc.c_oAscContextMenuTypes.Common;
			this.X_abs = ( undefined != obj.X_abs ) ? obj.X_abs : 0;
			this.Y_abs = ( undefined != obj.Y_abs ) ? obj.Y_abs : 0;

			switch (this.Type)
			{
				case Asc.c_oAscContextMenuTypes.ChangeHdrFtr :
				{
					this.PageNum = ( undefined != obj.PageNum ) ? obj.PageNum : 0;
					this.Header  = ( undefined != obj.Header  ) ? obj.Header : true;

					break;
				}
			}
		}
		else
		{
			this.Type  = Asc.c_oAscContextMenuTypes.Common;
			this.X_abs = 0;
			this.Y_abs = 0;
		}
	}

	CContextMenuData.prototype.get_Type    = function()
	{
		return this.Type;
	};
	CContextMenuData.prototype.get_X       = function()
	{
		return this.X_abs;
	};
	CContextMenuData.prototype.get_Y       = function()
	{
		return this.Y_abs;
	};
	CContextMenuData.prototype.get_PageNum = function()
	{
		return this.PageNum;
	};
	CContextMenuData.prototype.is_Header   = function()
	{
		return this.Header;
	};

	asc_docs_api.prototype.sync_ContextMenuCallback = function(Data)
	{
		this.sendEvent("asc_onContextMenu", new CContextMenuData(Data));
	};


	asc_docs_api.prototype.sync_MouseMoveStartCallback = function()
	{
		this.sendEvent("asc_onMouseMoveStart");
	};

	asc_docs_api.prototype.sync_MouseMoveEndCallback = function()
	{
		this.sendEvent("asc_onMouseMoveEnd");
	};

	asc_docs_api.prototype.sync_MouseMoveCallback = function(Data)
	{
		this.sendEvent("asc_onMouseMove", Data);
	};

	asc_docs_api.prototype.sync_ShowForeignCursorLabel = function(UserId, X, Y, Color)
	{
		this.sendEvent("asc_onShowForeignCursorLabel", UserId, X, Y, new AscCommon.CColor(Color.r, Color.g, Color.b, 255));
	};
	asc_docs_api.prototype.sync_HideForeignCursorLabel = function(UserId)
	{
		this.sendEvent("asc_onHideForeignCursorLabel", UserId);
	};

	//-----------------------------------------------------------------
	// Функции для работы с гиперссылками
	//-----------------------------------------------------------------
	asc_docs_api.prototype.can_AddHyperlink = function()
	{
		//if ( true === CollaborativeEditing.Get_GlobalLock() )
		//    return false;

		var bCanAdd = this.WordControl.m_oLogicDocument.CanAddHyperlink(true);
		if (true === bCanAdd)
			return this.WordControl.m_oLogicDocument.GetSelectedText(true);

		return false;
	};
	/**
	 * Добавляем гиперссылку
	 * @param {CHyperlinkProperty} oHyperProps
	 */
	asc_docs_api.prototype.add_Hyperlink = function(oHyperProps)
	{
		var sBookmarkName = this.private_CheckHeadingHyperlinkProps(oHyperProps);

		if (null !== oHyperProps.Text && undefined !== oHyperProps.Text)
		{
			AscFonts.FontPickerByCharacter.checkText(oHyperProps.Text, this,
				function()
				{
					this.private_AddHyperlink(oHyperProps, sBookmarkName);
				});
		}
		else
		{
			this.private_AddHyperlink(oHyperProps, sBookmarkName);
		}
	};
	asc_docs_api.prototype.private_CheckHeadingHyperlinkProps = function(oHyperProps)
	{
		var oHeading      = oHyperProps.get_Heading();
		var sBookmarkName = null;

		if (oHeading)
		{
			var oBookmarksManager = this.WordControl.m_oLogicDocument.GetBookmarksManager();
			sBookmarkName         = oBookmarksManager.GetNameForHeadingBookmark(oHeading);
			var oBookmark         = oBookmarksManager.GetBookmarkByName(sBookmarkName);

			if (oBookmark && oBookmark[0].GetParagraph() === oHeading)
			{
				oHyperProps.put_Heading(null);
				oHyperProps.put_Bookmark(sBookmarkName);
				sBookmarkName = null;
			}
			else
			{
				if (oBookmark)
				{
					var nCounter = 1;
					while (oBookmarksManager.GetBookmarkByName(sBookmarkName + "_" + nCounter))
					{
						nCounter++;
					}

					sBookmarkName += "_" + nCounter;
				}

				oHyperProps.put_Bookmark(sBookmarkName);
			}
		}

		return sBookmarkName;
	};
	asc_docs_api.prototype.private_AddHyperlink = function(oHyperProps, sBookmarkName, oParagraph)
	{
		var isLocked = false;
		if (sBookmarkName)
		{
			isLocked = this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content, {
				Type      : AscCommon.changestype_2_Element_and_Type,
				Element   : oHyperProps.get_Heading(),
				CheckType : changestype_Paragraph_Content
			});
		}
		else
		{
			isLocked = this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content);
		}

		if (!isLocked)
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddHyperlink);

			if (sBookmarkName && oHyperProps.get_Heading())
				oHyperProps.get_Heading().AddBookmarkAtBegin(sBookmarkName);

			this.WordControl.m_oLogicDocument.AddHyperlink(oHyperProps);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}

	};
	/**
	 * Изменяем гиперссылку
	 * @param {CHyperlinkProperty} oHyperProps
	 */
	asc_docs_api.prototype.change_Hyperlink = function(oHyperProps)
	{
		if (!oHyperProps || !oHyperProps.get_InternalHyperlink())
			return;

		var sBookmarkName = this.private_CheckHeadingHyperlinkProps(oHyperProps);

		if (null !== oHyperProps.Text && undefined !== oHyperProps.Text)
		{
			AscFonts.FontPickerByCharacter.checkText(oHyperProps.Text, this,
				function()
				{
					this.private_ChangeHyperlink(oHyperProps, sBookmarkName);
				});
		}
		else
		{
			this.private_ChangeHyperlink(oHyperProps, sBookmarkName);
		}
	};
	asc_docs_api.prototype.private_ChangeHyperlink = function(oHyperProps, sBookmarkName)
	{
		var isLocked = false;
		if (sBookmarkName)
		{
			isLocked = this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content, {
				Type      : AscCommon.changestype_2_Element_and_Type,
				Element   : oHyperProps.get_Heading(),
				CheckType : changestype_Paragraph_Content
			});
		}
		else
		{
			isLocked = this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content);
		}

		if (!isLocked)
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_ChangeHyperlink);

			if (sBookmarkName && oHyperProps.get_Heading())
				oHyperProps.get_Heading().AddBookmarkAtBegin(sBookmarkName);

			this.WordControl.m_oLogicDocument.ModifyHyperlink(oHyperProps);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	/**
	 * Удаляем гиперссылку
	 * @param {CHyperlinkProperty} oHyperProps
	 */
	asc_docs_api.prototype.remove_Hyperlink = function(oHyperProps)
	{
		if (!oHyperProps || !oHyperProps.get_InternalHyperlink())
			return;

		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_RemoveHyperlink);
			this.WordControl.m_oLogicDocument.RemoveHyperlink(oHyperProps);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.asc_GetHyperlinkAnchors = function()
	{
		if (!this.WordControl || !this.WordControl.m_oLogicDocument)
			return [];

		return this.WordControl.m_oLogicDocument.GetHyperlinkAnchors();
	};



	asc_docs_api.prototype.sync_HyperlinkPropCallback = function(hyperProp)
	{
		this.SelectedObjectsStack[this.SelectedObjectsStack.length] = new asc_CSelectedObject(c_oAscTypeSelectElement.Hyperlink, new Asc.CHyperlinkProperty(hyperProp));
	};

	asc_docs_api.prototype.sync_HyperlinkClickCallback = function(Url)
	{
		this.sendEvent("asc_onHyperlinkClick", Url);
	};

	asc_docs_api.prototype.sync_CanAddHyperlinkCallback = function(bCanAdd)
	{
		//if ( true === CollaborativeEditing.Get_GlobalLock() )
		//    this.sendEvent("asc_onCanAddHyperlink", false);
		//else
		this.sendEvent("asc_onCanAddHyperlink", bCanAdd);
	};

	asc_docs_api.prototype.sync_DialogAddHyperlink = function()
	{
		this.sendEvent("asc_onDialogAddHyperlink");
	};

	asc_docs_api.prototype.sync_DialogAddHyperlink = function()
	{
		this.sendEvent("asc_onDialogAddHyperlink");
	};

	//-----------------------------------------------------------------
	// Функции для работы с орфографией
	//-----------------------------------------------------------------
	asc_docs_api.prototype.sync_SpellCheckCallback = function(Word, Checked, Variants, ParaId, Element)
	{
		this.SelectedObjectsStack[this.SelectedObjectsStack.length] = new asc_CSelectedObject(c_oAscTypeSelectElement.SpellCheck, new AscCommon.asc_CSpellCheckProperty(Word, Checked, Variants, ParaId, Element));
	};

	asc_docs_api.prototype.sync_SpellCheckVariantsFound = function()
	{
		this.sendEvent("asc_onSpellCheckVariantsFound");
	};

	asc_docs_api.prototype.asc_replaceMisspelledWord = function(Word, SpellCheckProperty)
	{
		var ParaId = SpellCheckProperty.ParaId;

		var Paragraph = g_oTableId.Get_ById(ParaId);
		if (null != Paragraph && false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_None, {
				Type      : AscCommon.changestype_2_Element_and_Type,
				Element   : Paragraph,
				CheckType : changestype_Paragraph_Content
			}))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_ReplaceMisspelledWord);
			Paragraph.ReplaceMisspelledWord(Word, SpellCheckProperty.Element);
			Paragraph.Document_SetThisElementCurrent(true);
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.UpdateSelection();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.asc_ignoreMisspelledWord = function(SpellCheckProperty, bAll)
	{
		if (false === bAll)
		{
			var ParaId = SpellCheckProperty.ParaId;

			var Paragraph = g_oTableId.Get_ById(ParaId);
			if (null != Paragraph)
			{
				Paragraph.IgnoreMisspelledWord(SpellCheckProperty.Element);
			}
		}
		else
		{
			var LogicDocument = editor.WordControl.m_oLogicDocument;
			LogicDocument.Spelling.Add_Word(SpellCheckProperty.Word);
			LogicDocument.DrawingDocument.ClearCachePages();
			LogicDocument.DrawingDocument.FirePaint();
		}
	};

    asc_docs_api.prototype._spellCheckRestart = function(word)
    {
		var LogicDocument = this.WordControl.m_oLogicDocument;
		if (LogicDocument)
		{
			// TODO: сделать нормальный сброс слова
			var oldWordStatus = LogicDocument.Spelling.Check_Word(word);
			if (true !== oldWordStatus)
			{
				LogicDocument.Spelling.Add_Word(word);
				LogicDocument.DrawingDocument.ClearCachePages();
				LogicDocument.DrawingDocument.FirePaint();
				delete LogicDocument.Spelling.Words[word];
			}
		}
    };
    asc_docs_api.prototype.asc_spellCheckClearDictionary = function()
    {
        if (window["AscDesktopEditor"])
            window["AscDesktopEditor"]["SpellCheck"]("{\"type\":\"clear\"}");
    };

	asc_docs_api.prototype.asc_setDefaultLanguage = function(Lang)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Document_SectPr))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetDefaultLanguage);
			this.WordControl.m_oLogicDocument.Set_DefaultLanguage(Lang);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.asc_getDefaultLanguage = function()
	{
		return editor.WordControl.m_oLogicDocument.Get_DefaultLanguage();
	};

	asc_docs_api.prototype.asc_getKeyboardLanguage = function()
	{
		if (undefined !== window["asc_current_keyboard_layout"])
			return window["asc_current_keyboard_layout"];
		return -1;
	};

	asc_docs_api.prototype.asc_setSpellCheck = function(isOn)
	{
		if (editor.WordControl.m_oLogicDocument)
		{
			editor.WordControl.m_oLogicDocument.Spelling.Use = isOn;
			editor.WordControl.m_oDrawingDocument.ClearCachePages();
			editor.WordControl.m_oDrawingDocument.FirePaint();
		}
	};

	//-----------------------------------------------------------------
	// Функции для работы с комментариями
	//-----------------------------------------------------------------
	function asc_CCommentDataWord(obj)
	{
		if (obj)
		{
			this.m_bGlobal    = (undefined != obj.m_bGlobal   ) ? obj.m_bGlobal : false;
			this.m_sText      = (undefined != obj.m_sText     ) ? obj.m_sText : "";
			this.m_sTime      = (undefined != obj.m_sTime     ) ? obj.m_sTime : "";
			this.m_sOOTime    = (undefined != obj.m_sOOTime   ) ? obj.m_sOOTime : "";
			this.m_sUserId    = (undefined != obj.m_sUserId   ) ? obj.m_sUserId : "";
			this.m_sProviderId= (undefined != obj.m_sProviderId) ? obj.m_sProviderId : "";
			this.m_sQuoteText = (undefined != obj.m_sQuoteText) ? obj.m_sQuoteText : null;
			this.m_bSolved    = (undefined != obj.m_bSolved   ) ? obj.m_bSolved : false;
			this.m_sUserName  = (undefined != obj.m_sUserName ) ? obj.m_sUserName : "";
			this.m_sInitials  = (undefined != obj.m_sInitials ) ? obj.m_sInitials : this.asc_makeInitials(this.m_sUserName);
			this.m_nDurableId = (undefined != obj.m_nDurableId) ? obj.m_nDurableId : AscCommon.CreateUInt32();
			this.m_aReplies   = [];
			if (undefined != obj.m_aReplies)
			{
				var Count = obj.m_aReplies.length;
				for (var Index = 0; Index < Count; Index++)
				{
					var Reply = new asc_CCommentDataWord(obj.m_aReplies[Index]);
					this.m_aReplies.push(Reply);
				}
			}
		}
		else
		{
			this.m_bGlobal    = false;
			this.m_sText      = "";
			this.m_sTime      = "";
			this.m_sOOTime    = "";
			this.m_sUserId    = "";
			this.m_sProviderId= "";
			this.m_sQuoteText = null;
			this.m_bSolved    = false;
			this.m_sUserName  = "";
			this.m_sInitials  = "";
			this.m_nDurableId = AscCommon.CreateUInt32();
			this.m_aReplies   = [];
		}
	}

	asc_CCommentDataWord.prototype.asc_getText         = function()
	{
		return this.m_sText;
	};
	asc_CCommentDataWord.prototype.asc_putText         = function(v)
	{
		this.m_sText = v ? v.slice(0, Asc.c_oAscMaxCellOrCommentLength) : v;
	};
	asc_CCommentDataWord.prototype.asc_getTime         = function()
	{
		return this.m_sTime;
	};
	asc_CCommentDataWord.prototype.asc_putTime         = function(v)
	{
		this.m_sTime = v;
	};
	asc_CCommentDataWord.prototype.asc_getOnlyOfficeTime         = function()
	{
		return this.m_sOOTime;
	};
	asc_CCommentDataWord.prototype.asc_putOnlyOfficeTime         = function(v)
	{
		this.m_sOOTime = v;
	};
	asc_CCommentDataWord.prototype.asc_getUserId       = function()
	{
		return this.m_sUserId;
	};
	asc_CCommentDataWord.prototype.asc_putUserId       = function(v)
	{
		this.m_sUserId = v;
		this.m_sProviderId = "Teamlab";
	};
	asc_CCommentDataWord.prototype.asc_getProviderId       = function()
	{
		return this.m_sProviderId;
	};
	asc_CCommentDataWord.prototype.asc_putProviderId       = function(v)
	{
		this.m_sProviderId = v;
	};
	asc_CCommentDataWord.prototype.asc_getUserName     = function()
	{
		return this.m_sUserName;
	};
	asc_CCommentDataWord.prototype.asc_putUserName     = function(v)
	{
		this.m_sUserName = v;
		this.m_sInitials = this.asc_makeInitials(this.m_sUserName);
	};
	asc_CCommentDataWord.prototype.asc_getInitials       = function()
	{
		return this.m_sInitials;
	};
	asc_CCommentDataWord.prototype.asc_putInitials       = function(v)
	{
		this.m_sInitials = v;
	};
	asc_CCommentDataWord.prototype.asc_getQuoteText    = function()
	{
		return this.m_sQuoteText;
	};
	asc_CCommentDataWord.prototype.asc_putQuoteText    = function(v)
	{
		this.m_sQuoteText = v;
	};
	asc_CCommentDataWord.prototype.asc_getSolved       = function()
	{
		return this.m_bSolved;
	};
	asc_CCommentDataWord.prototype.asc_putSolved       = function(v)
	{
		this.m_bSolved = v;
	};
	asc_CCommentDataWord.prototype.asc_getGuid       = function()
	{
		return this.m_nDurableId.toString(16).padStart(8, "0");
	};
	asc_CCommentDataWord.prototype.asc_putGuid       = function(v)
	{
		this.m_nDurableId = parseInt(v, 16);
	};
	asc_CCommentDataWord.prototype.asc_getDurableId       = function()
	{
		return this.m_nDurableId;
	};
	asc_CCommentDataWord.prototype.asc_getReply        = function(i)
	{
		return this.m_aReplies[i];
	};
	asc_CCommentDataWord.prototype.asc_addReply        = function(v)
	{
		this.m_aReplies.push(v);
	};
	asc_CCommentDataWord.prototype.asc_getRepliesCount = function(v)
	{
		return this.m_aReplies.length;
	};
	asc_CCommentDataWord.prototype.asc_putDocumentFlag = function(val)
	{
		this.m_bGlobal = val;
	};
	asc_CCommentDataWord.prototype.asc_getDocumentFlag = function()
	{
		return this.m_bGlobal;
	};
	asc_CCommentDataWord.prototype.asc_makeInitials = function(name)
	{
		var initials = "";
		if(name){
			name.split(" ").forEach(function(elem) {
				if (elem.length > 0) {
					initials += elem[0];
				}
			});
		}
		return initials;
	};



	asc_docs_api.prototype.asc_showComments = function(isShowSolved)
	{
		if (null == this.WordControl.m_oLogicDocument)
			return;

		this.WordControl.m_oLogicDocument.ShowComments(isShowSolved);
	};

	asc_docs_api.prototype.asc_hideComments = function()
	{
		if (null == this.WordControl.m_oLogicDocument)
			return;

		this.WordControl.m_oLogicDocument.HideComments();
		editor.sync_HideComment();
	};

	asc_docs_api.prototype.asc_addComment = function(AscCommentData)
	{
		if (true === AscCommon.CollaborativeEditing.Get_GlobalLock())
			return;

		var oLogicDocument = this.WordControl.m_oLogicDocument;

		if (!oLogicDocument)
			return;

		// Комментарий без цитаты позволяем добавить всегда
		if (true !== this.can_AddQuotedComment() || false === oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Content, null, true, oLogicDocument.IsEditCommentsMode()))
		{
			var CommentData = new AscCommon.CCommentData();
			CommentData.Read_FromAscCommentData(AscCommentData);

			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddComment);
			var Comment = this.WordControl.m_oLogicDocument.AddComment(CommentData, AscCommentData.asc_getDocumentFlag());
			if (null != Comment)
			{
				this.sync_AddComment(Comment.Get_Id(), CommentData);
			}

			this.WordControl.m_oLogicDocument.FinalizeAction();

			return Comment.Get_Id();
		}
	};

	asc_docs_api.prototype.asc_removeComment = function(Id)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		if (false === oLogicDocument.Document_Is_SelectionLocked(changestype_None, {
				Type : AscCommon.changestype_2_Comment,
				Id   : Id
			}, false, oLogicDocument.IsEditCommentsMode()))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_RemoveComment);
			oLogicDocument.RemoveComment(Id, true, true);
			oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.asc_changeComment = function(Id, AscCommentData)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		if (false === oLogicDocument.Document_Is_SelectionLocked(changestype_None, {
				Type : AscCommon.changestype_2_Comment,
				Id   : Id
			}, false, oLogicDocument.IsEditCommentsMode()))
		{
			var CommentData = new AscCommon.CCommentData();
			CommentData.Read_FromAscCommentData(AscCommentData);

			oLogicDocument.StartAction(AscDFH.historydescription_Document_ChangeComment);
			oLogicDocument.EditComment(Id, CommentData);
			oLogicDocument.FinalizeAction();

			this.sync_ChangeCommentData(Id, CommentData);
		}
	};

	asc_docs_api.prototype.asc_selectComment = function(Id)
	{
		if (null == this.WordControl.m_oLogicDocument)
			return;

		this.WordControl.m_oLogicDocument.SelectComment(Id, true);
	};

	asc_docs_api.prototype.asc_showComment = function(Id)
	{
		if (Id instanceof Array)
			this.WordControl.m_oLogicDocument.ShowComment(Id);
		else
			this.WordControl.m_oLogicDocument.ShowComment([Id]);
	};

	asc_docs_api.prototype.asc_GetCommentsReportByAuthors = function()
	{
		var oReport = {};

		function privateProcessCommentData(isTopComment, oCommentData)
		{
			var sUserName = oCommentData.GetUserName();
			var nDateTime = oCommentData.GetDateTime();

			if (!oReport[sUserName])
				oReport[sUserName] = [];

			var arrUserComments = oReport[sUserName];

			var nPos = 0;
			var nLen = arrUserComments.length;
			while (nPos < nLen)
			{
				if (nDateTime < arrUserComments[nPos].Data.GetDateTime())
					break;

				nPos++;
			}

			arrUserComments.splice(nPos, 0, {Top : isTopComment, Data : oCommentData});

			for (var nIndex = 0, nCount = oCommentData.GetRepliesCount(); nIndex < nCount; ++nIndex)
			{
				privateProcessCommentData(false, oCommentData.GetReply(nIndex))
			}
		}

		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return oReport;

		var oAllComments = oLogicDocument.Comments.GetAllComments();
		for (var sId in oAllComments)
		{
			var oComment = oAllComments[sId];
			privateProcessCommentData(true, oComment.GetData());
		}

		return oReport;
	};

	asc_docs_api.prototype.can_AddQuotedComment = function()
	{
		//if ( true === CollaborativeEditing.Get_GlobalLock() )
		//    return false;

		return this.WordControl.m_oLogicDocument.CanAddComment();
	};

	asc_docs_api.prototype.sync_RemoveComment = function(Id)
	{
		this.sendEvent("asc_onRemoveComment", Id);
	};

	asc_docs_api.prototype.sync_AddComment = function(Id, CommentData)
	{
		var AscCommentData = new asc_CCommentDataWord(CommentData);
		this.sendEvent("asc_onAddComment", Id, AscCommentData);
	};

	asc_docs_api.prototype.sync_ShowComment = function(arrId, X, Y)
	{
		this.sendEvent("asc_onShowComment", arrId, X, Y);
	};

	asc_docs_api.prototype.sync_HideComment = function()
	{
		this.sendEvent("asc_onHideComment");
	};

	asc_docs_api.prototype.sync_UpdateCommentPosition = function(Id, X, Y)
	{
		// TODO: Переделать на нормальный массив
		this.sendEvent("asc_onUpdateCommentPosition", [Id], X, Y);
	};

	asc_docs_api.prototype.sync_ChangeCommentData = function(Id, CommentData)
	{
		var AscCommentData = new asc_CCommentDataWord(CommentData);
		this.sendEvent("asc_onChangeCommentData", Id, AscCommentData);
	};

	asc_docs_api.prototype.sync_LockComment = function(Id, UserId)
	{
		this.sendEvent("asc_onLockComment", Id, UserId);
	};

	asc_docs_api.prototype.sync_UnLockComment = function(Id)
	{
		this.sendEvent("asc_onUnLockComment", Id);
	};
	asc_docs_api.prototype.asc_RemoveAllComments = function(isMine, isCurrent)
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return;

		var arrCommentsId = oLogicDocument.GetAllComments(isMine, isCurrent);

		if (!oLogicDocument.IsSelectionLocked(changestype_None, {
				Type : AscCommon.changestype_2_Comment,
				Id   : arrCommentsId
			}, false, oLogicDocument.IsEditCommentsMode()))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_RemoveAllComments);

			for (var nIndex = 0, nCount = arrCommentsId.length; nIndex < nCount; ++nIndex)
			{
				oLogicDocument.RemoveComment(arrCommentsId[nIndex], true, false);
			}

			oLogicDocument.Recalculate();
			oLogicDocument.UpdateInterface();
			oLogicDocument.FinalizeAction();
		}
	};

	//-----------------------------------------------------------------
	asc_docs_api.prototype.sync_LockHeaderFooters = function()
	{
		this.sendEvent("asc_onLockHeaderFooters");
	};

	asc_docs_api.prototype.sync_LockDocumentProps = function()
	{
		this.sendEvent("asc_onLockDocumentProps");
	};

	asc_docs_api.prototype.sync_UnLockHeaderFooters = function()
	{
		this.sendEvent("asc_onUnLockHeaderFooters");
	};

	asc_docs_api.prototype.sync_UnLockDocumentProps = function()
	{
		this.sendEvent("asc_onUnLockDocumentProps");
	};

	asc_docs_api.prototype.sync_CollaborativeChanges = function()
	{
		if (true !== AscCommon.CollaborativeEditing.Is_Fast() && (true !== this.WordControl.m_oLogicDocument.IsViewModeInReview() || true !== this.WordControl.m_oLogicDocument.IsFastCollaboartionBeforeViewModeInReview()))
			this.sendEvent("asc_onCollaborativeChanges");
	};

	asc_docs_api.prototype.sync_LockDocumentSchema = function()
	{
		this.sendEvent("asc_onLockDocumentSchema");
	};

	asc_docs_api.prototype.sync_UnLockDocumentSchema = function()
	{
		this.sendEvent("asc_onUnLockDocumentSchema");
	};


	/*----------------------------------------------------------------*/
	/*functions for working with zoom & navigation*/
	asc_docs_api.prototype.zoomIn         = function()
	{
		this.WordControl.zoom_In();
	};
	asc_docs_api.prototype.zoomOut        = function()
	{
		this.WordControl.zoom_Out();
	};
	asc_docs_api.prototype.zoomFitToPage  = function()
	{
		if (!this.isLoadFullApi)
		{
			this.tmpZoomType = AscCommon.c_oZoomType.FitToPage;
			return;
		}
		this.WordControl.zoom_FitToPage();
	};
	asc_docs_api.prototype.zoomFitToWidth = function()
	{
		if (!this.isLoadFullApi)
		{
			this.tmpZoomType = AscCommon.c_oZoomType.FitToWidth;
			return;
		}
		this.WordControl.zoom_FitToWidth();
	};
	asc_docs_api.prototype.zoomCustomMode = function()
	{
		if (!this.isLoadFullApi)
		{
			this.tmpZoomType = AscCommon.c_oZoomType.CustomMode;
			return;
		}
		this.WordControl.m_nZoomType = 0;
		this.WordControl.zoom_Fire(0, this.WordControl.m_nZoomValue);
	};
	asc_docs_api.prototype.zoom100        = function()
	{
		this.zoom(100);
	};
	asc_docs_api.prototype.zoom           = function(percent)
	{
		var _old_val                  = this.WordControl.m_nZoomValue;
		this.WordControl.m_nZoomValue = percent;
		this.WordControl.m_nZoomType  = 0;
		this.WordControl.zoom_Fire(0, _old_val);
	};
	asc_docs_api.prototype.goToPage       = function(number)
	{
		this.WordControl.GoToPage(number);
	};
	asc_docs_api.prototype.getCountPages  = function()
	{
		return this.WordControl.m_oDrawingDocument.m_lPagesCount;
	};
	asc_docs_api.prototype.getCurrentPage = function()
	{
		return this.WordControl.m_oDrawingDocument.m_lCurrentPage;
	};
	/*callbacks*/
	asc_docs_api.prototype.sync_zoomChangeCallback  = function(percent, type)
	{	//c_oAscZoomType.Current, c_oAscZoomType.FitWidth, c_oAscZoomType.FitPage
		this.sendEvent("asc_onZoomChange", percent, type);
	};
	asc_docs_api.prototype.sync_countPagesCallback  = function(count)
	{
		this.sendEvent("asc_onCountPages", count);
	};
	asc_docs_api.prototype.sync_currentPageCallback = function(number)
	{
		this.sendEvent("asc_onCurrentPage", number);
	};

	/*----------------------------------------------------------------*/
	asc_docs_api.prototype.asc_enableKeyEvents = function(value, isFromInput)
	{
		if (!this.isLoadFullApi)
		{
			this.tmpFocus = value;
			return;
		}

		if (this.WordControl && this.WordControl.IsFocus != value)
		{
			this.WordControl.IsFocus = value;

			if (this.WordControl.IsFocus && null != this.WordControl.TextBoxInput)
				this.WordControl.TextBoxInput.focus();

			this.sendEvent("asc_onEnableKeyEventsChanged", value);
		}

		if (isFromInput !== true && AscCommon.g_inputContext)
			AscCommon.g_inputContext.setInterfaceEnableKeyEvents(value);
	};
	asc_docs_api.prototype.asc_IsFocus         = function(bIsNaturalFocus)
	{
		var _ret = false;
		if (this.WordControl.IsFocus)
			_ret = true;
		if (_ret && bIsNaturalFocus && this.WordControl.TextBoxInputFocus)
			_ret = false;
		return _ret;
	};

	// работа с шрифтами
	asc_docs_api.prototype.asyncFontsDocumentStartLoaded = function()
	{
		// здесь прокинуть евент о заморозке меню
		// и нужно вывести информацию в статус бар
		if (this.isPasteFonts_Images)
			this.sync_StartAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadFont);
		else if (this.isSaveFonts_Images)
			this.sync_StartAction(c_oAscAsyncActionType.Information, c_oAscAsyncAction.LoadFont);
		else
		{
			this.sync_StartAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadDocumentFonts);

            if (undefined !== this.asyncMethodCallback)
            	return;

			// заполним прогресс
			var _progress         = this.OpenDocumentProgress;
			_progress.Type        = c_oAscAsyncAction.LoadDocumentFonts;
			_progress.FontsCount  = this.FontLoader.fonts_loading.length;
			_progress.CurrentFont = 0;

			var _loader_object = this.WordControl.m_oLogicDocument;
			var _count         = 0;
			if (_loader_object !== undefined && _loader_object != null)
			{
				for (var i in _loader_object.ImageMap)
				{
					if (this.DocInfo.get_OfflineApp())
					{
						var localUrl = _loader_object.ImageMap[i];
						g_oDocumentUrls.addImageUrl(localUrl, this.documentUrl + 'media/' + localUrl);
					}
					++_count;
				}
			}

			_progress.ImagesCount  = _count;
			_progress.CurrentImage = 0;
		}
	};
	asc_docs_api.prototype.GenerateStyles                = function()
	{
		if (window["NATIVE_EDITOR_ENJINE"] === true)
		{
			if (!this.asc_checkNeedCallback("asc_onInitEditorStyles"))
				return;
		}

		var StylesPainter = new AscCommonWord.CStylesPainter();
		var LogicDocument = this.WordControl.m_oLogicDocument;
		if (LogicDocument)
		{
			var isTrackRevision = LogicDocument.IsTrackRevisions();
			var isShowParaMarks = LogicDocument.Is_ShowParagraphMarks();

			if (true === isTrackRevision)
				LogicDocument.SetTrackRevisions(false);

			if (true === isShowParaMarks)
				LogicDocument.Set_ShowParagraphMarks(false, false);

			StylesPainter.GenerateStyles(this, (null == this.LoadedObject) ? this.WordControl.m_oLogicDocument.Get_Styles().Style : this.LoadedObjectDS);

			if (true === isTrackRevision)
				LogicDocument.SetTrackRevisions(true);

			if (true === isShowParaMarks)
				LogicDocument.Set_ShowParagraphMarks(true, false);
		}
	};
	asc_docs_api.prototype.asyncFontsDocumentEndLoaded   = function()
	{
		// все, шрифты загружены. Теперь нужно подгрузить картинки
		if (this.isPasteFonts_Images)
			this.sync_EndAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadFont);
		else if (this.isSaveFonts_Images)
			this.sync_EndAction(c_oAscAsyncActionType.Information, c_oAscAsyncAction.LoadFont);
		else
			this.sync_EndAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadDocumentFonts);

        if (undefined !== this.asyncMethodCallback)
        {
            this.asyncMethodCallback();
            this.asyncMethodCallback = undefined;
            return;
        }

		this.EndActionLoadImages = 0;
		if (this.isPasteFonts_Images)
		{
			var _count = 0;
			for (var i in this.pasteImageMap)
				++_count;

			if (_count > 0)
			{
				this.EndActionLoadImages = 2;
				this.sync_StartAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadImage);
			}

			var _oldAsyncLoadImages                     = this.ImageLoader.bIsAsyncLoadDocumentImages;
			this.ImageLoader.bIsAsyncLoadDocumentImages = false;
			this.ImageLoader.LoadDocumentImages(this.pasteImageMap);
			this.ImageLoader.bIsAsyncLoadDocumentImages = true;
			return;
		}
		else if (this.isSaveFonts_Images)
		{
			var _count = 0;
			for (var i in this.saveImageMap)
				++_count;

			if (_count > 0)
			{
				this.EndActionLoadImages = 2;
				this.sync_StartAction(c_oAscAsyncActionType.Information, c_oAscAsyncAction.LoadImage);
			}

			this.ImageLoader.LoadDocumentImages(this.saveImageMap);
			return;
		}

		this.GenerateStyles();

		if (null != this.WordControl.m_oLogicDocument)
		{
			this.WordControl.m_oDrawingDocument.CheckGuiControlColors();
			this.sendColorThemes(this.WordControl.m_oLogicDocument.theme);
			this.sendEvent("asc_onUpdateChartStyles");
		}

		// открытие после загрузки документа

		var _loader_object = this.WordControl.m_oLogicDocument;
		if (null == _loader_object)
			_loader_object = this.WordControl.m_oDrawingDocument.m_oDocumentRenderer;

		var _count = 0;
		for (var i in _loader_object.ImageMap)
			++_count;

		if (!this.isOnlyReaderMode)
		{
			// add const textures
			var _st_count = AscCommon.g_oUserTexturePresets.length;
			for (var i = 0; i < _st_count; i++)
				_loader_object.ImageMap[_count + i] = AscCommon.g_oUserTexturePresets[i];

			if (this.OpenDocumentProgress && !this.ImageLoader.bIsAsyncLoadDocumentImages)
			{
				this.OpenDocumentProgress.ImagesCount += _st_count;
			}
		}

		if (_count > 0)
		{
			this.EndActionLoadImages = 1;
			this.sync_StartAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadDocumentImages);
		}

		this.ImageLoader.bIsLoadDocumentFirst = true;
		this.ImageLoader.LoadDocumentImages(_loader_object.ImageMap);
	};

	asc_docs_api.prototype.CreateFontsCharMap = function()
	{
		var _info = new CFontsCharMap();
		_info.StartWork();

		this.WordControl.m_oLogicDocument.Document_CreateFontCharMap(_info);

		return _info.EndWork();
	};

	asc_docs_api.prototype.sync_SendThemeColors       = function(colors, standart_colors)
	{
		this._gui_control_colors = {Colors : colors, StandartColors : standart_colors};
		this.sendEvent("asc_onSendThemeColors", colors, standart_colors);
	};


	asc_docs_api.prototype.getCurrentTheme = function ()
	{
		if (null == this.WordControl.m_oLogicDocument)
			return null;

		return this.WordControl.m_oLogicDocument.theme;
	};

	asc_docs_api.prototype.ChangeColorScheme            = function(sSchemeName)
	{
		if (null == this.WordControl.m_oLogicDocument)
			return;

		var _changer = this.WordControl.m_oLogicDocument.DrawingObjects;
		if (null == _changer)
			return;

		var theme = this.WordControl.m_oLogicDocument.theme;
		var scheme = AscCommon.getColorSchemeByName(sSchemeName);
		if (!scheme)
		{
			scheme = theme.getExtraClrScheme(sSchemeName);
		}
		if(!scheme)
		{
			return;
		}
		if (this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_ColorScheme) === false)
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_ChangeColorScheme);
			theme.changeColorScheme(scheme);
			this.WordControl.m_oDrawingDocument.CheckGuiControlColors();
			this.chartPreviewManager.clearPreviews();
			this.textArtPreviewManager.clear();
			this.sendEvent("asc_onUpdateChartStyles");
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.FinalizeAction();


			// TODO:
			this.WordControl.m_oDrawingDocument.ClearCachePages();
			this.WordControl.OnScroll();

			this.WordControl.m_oDrawingDocument.CheckGuiControlColors();
			this.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();
		}

	};
	asc_docs_api.prototype.asc_ChangeColorSchemeByIdx            = function(nIdx)
	{
		if (null == this.WordControl.m_oLogicDocument)
			return;

		var _changer = this.WordControl.m_oLogicDocument.DrawingObjects;
		if (null == _changer)
			return;

		var theme = this.getCurrentTheme();
		if(!theme)
		{
			return;
		}
		var scheme = this.getColorSchemeByIdx(nIdx);
		if(!scheme)
		{
			return;
		}
		if (this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_ColorScheme) === false)
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_ChangeColorScheme);
			theme.changeColorScheme(scheme);
			this.WordControl.m_oDrawingDocument.CheckGuiControlColors();
			this.chartPreviewManager.clearPreviews();
			this.textArtPreviewManager.clear();
			this.sendEvent("asc_onUpdateChartStyles");
			this.WordControl.m_oLogicDocument.Recalculate();
			this.WordControl.m_oLogicDocument.FinalizeAction();


			// TODO:
			this.WordControl.m_oDrawingDocument.ClearCachePages();
			this.WordControl.OnScroll();

			this.WordControl.m_oDrawingDocument.CheckGuiControlColors();
			this.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();
		}

	};
	asc_docs_api.prototype.asyncImagesDocumentEndLoaded = function()
	{
		this.ImageLoader.bIsLoadDocumentFirst = false;
		var _bIsOldPaste                      = this.isPasteFonts_Images;

		if (null != this.WordControl.m_oDrawingDocument.m_oDocumentRenderer)
		{
			if (this.EndActionLoadImages == 1)
			{
				this.sync_EndAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadDocumentImages);
			}
			else if (this.EndActionLoadImages == 2)
			{
				if (this.isPasteFonts_Images)
					this.sync_EndAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadImage);
				else
					this.sync_EndAction(c_oAscAsyncActionType.Information, c_oAscAsyncAction.LoadImage);
			}
			this.EndActionLoadImages = 0;

			this.WordControl.m_oDrawingDocument.OpenDocument();

			this.LoadedObject = null;

			this.bInit_word_control = true;

			if (false === this.isPasteFonts_Images)
				this.onDocumentContentReady();

			this.WordControl.InitControl();

			if (this.isViewMode)
				this.asc_setViewMode(true);
			return;
		}

		// на методе _openDocumentEndCallback может поменяться this.EndActionLoadImages
		if (this.EndActionLoadImages == 1)
		{
			this.sync_EndAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadDocumentImages);
		}
		else if (this.EndActionLoadImages == 2)
		{
			if (_bIsOldPaste)
				this.sync_EndAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadImage);
			else
				this.sync_EndAction(c_oAscAsyncActionType.Information, c_oAscAsyncAction.LoadImage);
		}
		this.EndActionLoadImages = 0;

		// размораживаем меню... и начинаем считать документ
		if (false === this.isPasteFonts_Images && false === this.isSaveFonts_Images && false === this.isLoadImagesCustom)
		{
			this.ServerImagesWaitComplete = true;
			this._openDocumentEndCallback();
		}
		else
		{
			if (this.isPasteFonts_Images)
			{
				this.isPasteFonts_Images = false;
				this.pasteImageMap       = null;
				this.pasteCallback();
				this.pasteCallback            = null;
				this.decrementCounterLongAction();
			}
			else if (this.isSaveFonts_Images)
			{
				this.isSaveFonts_Images = false;
				this.saveImageMap       = null;
				this.pre_SaveCallback();

				if (this.bInit_word_control === false)
				{
					this.bInit_word_control = true;
					this.onDocumentContentReady();
				}
			}
			else if (this.isLoadImagesCustom)
			{
				this.isLoadImagesCustom = false;
				this.loadCustomImageMap = null;

				if (!this.ImageLoader.bIsAsyncLoadDocumentImages)
					this.SyncLoadImages_callback();
			}
		}
	};

	asc_docs_api.prototype._openDocumentEndCallback = function()
	{
		if (this.isDocumentLoadComplete || !this.ServerImagesWaitComplete || !this.ServerIdWaitComplete || !this.WordControl || !this.WordControl.m_oLogicDocument)
			return;

		var isSendOnReady = false;

		if (0 == this.DocumentType)
			this.WordControl.m_oLogicDocument.LoadEmptyDocument();
		else if (1 == this.DocumentType)
		{
			this.WordControl.m_oLogicDocument.LoadTestDocument();
		}
		else
		{
			if (this.LoadedObject)
			{
				var Document = this.WordControl.m_oLogicDocument;

				if (this.isApplyChangesOnOpenEnabled)
				{
					if (AscCommon.EncryptionWorker)
					{
						AscCommon.EncryptionWorker.init();
						if (!AscCommon.EncryptionWorker.isChangesHandled)
							return AscCommon.EncryptionWorker.handleChanges(AscCommon.CollaborativeEditing.m_aChanges, this, this._openDocumentEndCallback);
					}

                    if (false === this.isSaveFonts_Images && !isSendOnReady)
                    {
                        isSendOnReady = true;
                        this.bInit_word_control = true;
                        Document.Start_SilentMode();
                    }

					this.isApplyChangesOnOpenEnabled = false;
					this._applyPreOpenLocks();
					AscCommon.CollaborativeEditing.Apply_Changes();
					AscCommon.CollaborativeEditing.Release_Locks();

					this.isApplyChangesOnOpen = true;
				}

                if (false === this.isSaveFonts_Images && !isSendOnReady)
                {
                    isSendOnReady = true;
                    this.bInit_word_control = true;
                    Document.Start_SilentMode();
                }

				//Recalculate для Document
				Document.MoveCursorToStartPos(false);

				if (isSendOnReady)
				{
					this.onDocumentContentReady();
					Document.End_SilentMode(false);
				}

				if (!this.isOnlyReaderMode)
				{
					if (false === this.isSaveFonts_Images)
						Document.RecalculateFromStart();

					this.WordControl.m_oDrawingDocument.TargetStart();
				}
				else
				{
					Document.RecalculateAllTables();
					var data = {All : true};
					Document.DrawingObjects.recalculate_(data);
					Document.DrawingObjects.recalculateText_(data);

					if (!this.WordControl.IsReaderMode())
						this.ChangeReaderMode();
					else
						this.WordControl.UpdateReaderContent();
				}
			}
		}

		if (false === this.isSaveFonts_Images && !isSendOnReady)
		{
            isSendOnReady = true;
			this.bInit_word_control = true;
			this.onDocumentContentReady();
		}

		this.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();
		//this.WordControl.m_oLogicDocument.Document_UpdateRulersState();
		this.WordControl.m_oLogicDocument.Document_UpdateSelectionState();
		this.LoadedObject = null;

		this.WordControl.InitControl();

		if (!this.isViewMode)
		{
			this.sendStandartTextures();
			this.sendMathToMenu();

			if (this.shapeElementId)
			{
				this.WordControl.m_oDrawingDocument.InitGuiCanvasShape(this.shapeElementId);
			}
		}

		if (this.isViewMode)
			this.asc_setViewMode(true);

		// Меняем тип состояния (на никакое)
		this.advancedOptionsAction = c_oAscAdvancedOptionsAction.None;
	};

	asc_docs_api.prototype.UpdateInterfaceState = function()
	{
		if (this.WordControl.m_oLogicDocument != null)
			this.WordControl.m_oLogicDocument.UpdateInterface();
	};

	asc_docs_api.prototype.asyncFontEndLoaded = function(fontinfo)
	{
		this.sync_EndAction(c_oAscAsyncActionType.Information, c_oAscAsyncAction.LoadFont);

		if (undefined !== this.asyncMethodCallback)
		{
			this.asyncMethodCallback();
			this.asyncMethodCallback = undefined;
			return;
		}

		var _fontSelections = g_fontApplication.g_fontSelections;
		if (_fontSelections.CurrentLoadedObj != null)
		{
			var _rfonts = _fontSelections.getSetupRFonts(_fontSelections.CurrentLoadedObj);
			this.WordControl.m_oLogicDocument.TextBox_Put(_fontSelections.CurrentLoadedObj.text, _rfonts);
			this.WordControl.ReinitTB();

			_fontSelections.CurrentLoadedObj = null;
			this.sync_EndAction(c_oAscAsyncActionType.BlockInteraction, c_oAscAsyncAction.LoadFont);
			return;
		}

		if (this.FontAsyncLoadType == 1)
		{
			this.FontAsyncLoadType = 0;
			this.asc_AddMath2(this.FontAsyncLoadParam);
			this.FontAsyncLoadParam = null;
			return;
		}

		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_SetTextFontNameLong);
			this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr({
				FontFamily : {
					Name  : fontinfo.Name,
					Index : -1
				}
			}));
			this.WordControl.m_oLogicDocument.UpdateInterface();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
		// отжать заморозку меню
	};

	asc_docs_api.prototype.asc_replaceLoadImageCallback = function(fCallback)
	{
		this.asyncImageEndLoaded2 = fCallback;
	};

	asc_docs_api.prototype.asyncImageEndLoaded = function(_image)
	{
		// отжать заморозку меню
		if (this.asyncImageEndLoaded2)
			this.asyncImageEndLoaded2(_image);
		else
		{
			if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content))
			{
				this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddImage);
				this.WordControl.m_oLogicDocument.AddInlineImage(50, 50, _image.src);
				this.WordControl.m_oLogicDocument.FinalizeAction();
			}
		}
	};

	asc_docs_api.prototype.openDocument = function(file)
	{
		if (file.changes && this.VersionHistory)
		{
			this.VersionHistory.changes = file.changes;
			this.VersionHistory.applyChanges(this);
		}

		if (file.bSerFormat)
			this.OpenDocument2(file.url, file.data);
		else
			this.OpenDocument(file.url, file.data);
	};

	asc_docs_api.prototype.asyncImageEndLoadedBackground = function(_image)
	{
		this.WordControl.m_oDrawingDocument.CheckRasterImageOnScreen(_image.src);
		if (this.WordControl.m_oDrawingDocument.LastDrawingUrl == _image.src)
		{
			this.WordControl.m_oDrawingDocument.LastDrawingUrl = "";
			this.UpdateInterfaceState();
		}
	};
	asc_docs_api.prototype.IsAsyncOpenDocumentImages     = function()
	{
		return true;
	};

	asc_docs_api.prototype.pre_Paste = function(_fonts, _images, callback)
	{
		if (undefined !== window["Native"] && undefined !== window["Native"]["GetImageUrl"])
		{
			callback();
			return;
		}
		if(window['IS_NATIVE_EDITOR'])
		{
			callback();
			return;
		}
		this.pasteCallback = callback;
		this.pasteImageMap = _images;

		var _count = 0;
		for (var i in this.pasteImageMap)
			++_count;

        AscFonts.FontPickerByCharacter.extendFonts(_fonts);
		if (0 == _count && false === this.FontLoader.CheckFontsNeedLoading(_fonts))
		{
			// никаких евентов. ничего грузить не нужно. сделано для сафари под макОс.
			// там при LongActions теряется фокус и вставляются пробелы
			this.pasteCallback();
			this.pasteCallback            = null;

			return;
		}

		this.incrementCounterLongAction();
		this.isPasteFonts_Images = true;
		this.FontLoader.LoadDocumentFonts2(_fonts);
	};

	asc_docs_api.prototype.pre_Save = function(_images)
	{
		this.isSaveFonts_Images = true;
		this.saveImageMap       = _images;
		this.WordControl.m_oDrawingDocument.CheckFontNeeds();
		this.FontLoader.LoadDocumentFonts2(this.WordControl.m_oLogicDocument.Fonts);
	};

	asc_docs_api.prototype.SyncLoadImages          = function(_images)
	{
		this.isLoadImagesCustom = true;
		this.loadCustomImageMap = _images;

		var _count  = 0;
		var _loaded = this.ImageLoader.map_image_index;

		var _new_len = this.loadCustomImageMap.length;
		for (var i = 0; i < _new_len; i++)
		{
			if (undefined !== _loaded[this.loadCustomImageMap[i]])
			{
				this.loadCustomImageMap.splice(i, 1);
				i--;
				_new_len--;
				continue;
			}
			++_count;
		}

		if (_count > 0)
		{
			this.EndActionLoadImages = 2;
			this.sync_StartAction(c_oAscAsyncActionType.Information, c_oAscAsyncAction.LoadImage);
		}

		this.ImageLoader.LoadDocumentImages(this.loadCustomImageMap);
	};
	asc_docs_api.prototype.SyncLoadImages_callback = function()
	{
		this.WordControl.OnRePaintAttack();
	};

	asc_docs_api.prototype.pre_SaveCallback = function()
	{
		AscCommon.CollaborativeEditing.OnEnd_Load_Objects();

		if (this.isApplyChangesOnOpen)
		{
			this.isApplyChangesOnOpen = false;
			this._openDocumentEndCallback();
		}
	};

	asc_docs_api.prototype.initEvents2MobileAdvances = function()
	{
		//this.WordControl.initEvents2MobileAdvances();
	};
	asc_docs_api.prototype.ViewScrollToX             = function(x)
	{
		this.WordControl.m_oScrollHorApi.scrollToX(x);
	};
	asc_docs_api.prototype.ViewScrollToY             = function(y)
	{
		this.WordControl.m_oScrollVerApi.scrollToY(y);
	};
	asc_docs_api.prototype.GetDocWidthPx             = function()
	{
		return this.WordControl.m_dDocumentWidth;
	};
	asc_docs_api.prototype.GetDocHeightPx            = function()
	{
		return this.WordControl.m_dDocumentHeight;
	};
	asc_docs_api.prototype.ClearSearch               = function()
	{
		return this.WordControl.m_oDrawingDocument.EndSearch(true);
	};
	asc_docs_api.prototype.GetCurrentVisiblePage     = function()
	{
		var lPage1 = this.WordControl.m_oDrawingDocument.m_lDrawingFirst;
		var lPage2 = lPage1 + 1;

		if (lPage2 > this.WordControl.m_oDrawingDocument.m_lDrawingEnd)
			return lPage1;

		var lWindHeight = this.WordControl.m_oEditor.HtmlElement.height;
		var arPages     = this.WordControl.m_oDrawingDocument.m_arrPages;

		var dist1 = arPages[lPage1].drawingPage.bottom;
		var dist2 = lWindHeight - arPages[lPage2].drawingPage.top;

		if (dist1 > dist2)
			return lPage1;

		return lPage2;
	};

	asc_docs_api.prototype.asc_SetDocumentPlaceChangedEnabled = function(bEnabled)
	{
		if (this.WordControl)
			this.WordControl.m_bDocumentPlaceChangedEnabled = bEnabled;
	};

	asc_docs_api.prototype.asc_SetViewRulers       = function(bRulers)
	{
		//if (false === this.bInit_word_control || true === this.isViewMode)
		//    return;

		if (!this.isLoadFullApi)
		{
			this.tmpViewRulers = bRulers;
			return;
		}

		if (this.WordControl.m_bIsRuler != bRulers)
		{
			this.WordControl.m_bIsRuler = bRulers;
			this.WordControl.checkNeedRules();
			this.WordControl.OnResize(true);
		}
	};
	asc_docs_api.prototype.asc_SetViewRulersChange = function()
	{
		//if (false === this.bInit_word_control || true === this.isViewMode)
		//    return;

		this.WordControl.m_bIsRuler = !this.WordControl.m_bIsRuler;
		this.WordControl.checkNeedRules();
		this.WordControl.OnResize(true);
		return this.WordControl.m_bIsRuler;
	};
	asc_docs_api.prototype.asc_GetViewRulers       = function()
	{
		return this.WordControl.m_bIsRuler;
	};

	asc_docs_api.prototype.asc_SetDocumentUnits = function(_units)
	{
		if (this.WordControl && this.WordControl.m_oHorRuler && this.WordControl.m_oVerRuler)
		{
			this.WordControl.m_oHorRuler.Units = _units;
			this.WordControl.m_oVerRuler.Units = _units;
			this.WordControl.UpdateHorRulerBack(true);
			this.WordControl.UpdateVerRulerBack(true);
		}
		else
		{
            this.tmpDocumentUnits = _units;
		}
	};

	asc_docs_api.prototype.GoToHeader = function(pageNumber)
	{
		if (this.WordControl.m_oDrawingDocument.IsFreezePage(pageNumber))
			return;

		var bForceRedraw  = false;
		var LogicDocument = this.WordControl.m_oLogicDocument;
		if (AscCommonWord.docpostype_HdrFtr !== LogicDocument.GetDocPosType())
		{
			LogicDocument.SetDocPosType(AscCommonWord.docpostype_HdrFtr);
			bForceRedraw = true;
		}

		var oldClickCount            = global_mouseEvent.ClickCount;
		global_mouseEvent.Button     = 0;
		global_mouseEvent.ClickCount = 1;

		LogicDocument.OnMouseDown(global_mouseEvent, 0, 0, pageNumber);
		LogicDocument.OnMouseUp(global_mouseEvent, 0, 0, pageNumber);
		LogicDocument.OnMouseMove(global_mouseEvent, 0, 0, pageNumber);
		LogicDocument.MoveCursorLeft();
		LogicDocument.UpdateInterface();
		LogicDocument.UpdateSelection();

		global_mouseEvent.ClickCount = oldClickCount;

		if (true === bForceRedraw)
		{
			this.WordControl.m_oDrawingDocument.ClearCachePages();
			this.WordControl.m_oDrawingDocument.FirePaint();
		}
	};

	asc_docs_api.prototype.GoToFooter = function(pageNumber)
	{
		if (this.WordControl.m_oDrawingDocument.IsFreezePage(pageNumber))
			return;

		var bForceRedraw  = false;
		var LogicDocument = this.WordControl.m_oLogicDocument;
		if (AscCommonWord.docpostype_HdrFtr !== LogicDocument.GetDocPosType())
		{
			LogicDocument.SetDocPosType(AscCommonWord.docpostype_HdrFtr);
			bForceRedraw = true;
		}

		var oldClickCount            = global_mouseEvent.ClickCount;
		global_mouseEvent.Button     = 0;
		global_mouseEvent.ClickCount = 1;

		LogicDocument.OnMouseDown(global_mouseEvent, 0, AscCommon.Page_Height, pageNumber);
		LogicDocument.OnMouseUp(global_mouseEvent, 0, AscCommon.Page_Height, pageNumber);
		LogicDocument.OnMouseMove(global_mouseEvent, 0, 0, pageNumber);
		LogicDocument.MoveCursorLeft();
		LogicDocument.UpdateInterface();
		LogicDocument.UpdateSelection();

		global_mouseEvent.ClickCount = oldClickCount;

		if (true === bForceRedraw)
		{
			this.WordControl.m_oDrawingDocument.ClearCachePages();
			this.WordControl.m_oDrawingDocument.FirePaint();
		}
	};

	asc_docs_api.prototype.ExitHeader_Footer = function(pageNumber)
	{
		if (this.WordControl.m_oDrawingDocument.IsFreezePage(pageNumber))
			return;

		var oldClickCount            = global_mouseEvent.ClickCount;
		global_mouseEvent.ClickCount = 2;
		this.WordControl.m_oLogicDocument.OnMouseDown(global_mouseEvent, 0, AscCommon.Page_Height / 2, pageNumber);
		this.WordControl.m_oLogicDocument.OnMouseUp(global_mouseEvent, 0, AscCommon.Page_Height / 2, pageNumber);

		this.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();

		global_mouseEvent.ClickCount = oldClickCount;
	};

	asc_docs_api.prototype.GetCurrentPixOffsetY = function()
	{
		return this.WordControl.m_dScrollY;
	};

	asc_docs_api.prototype.SetPaintFormat = function(_value)
	{
		var value = ( true === _value ? c_oAscFormatPainterState.kOn : ( false === _value ? c_oAscFormatPainterState.kOff : _value ) );

		this.isPaintFormat = value;

		if (c_oAscFormatPainterState.kOff !== value)
			this.WordControl.m_oLogicDocument.Document_Format_Copy();
	};

	asc_docs_api.prototype.ChangeShapeType = function(value)
	{
		this.ImgApply(new asc_CImgProperty({ShapeProperties : {type : value}}));
	};

	asc_docs_api.prototype.sync_PaintFormatCallback = function(_value)
	{
		var value = ( true === _value ? c_oAscFormatPainterState.kOn : ( false === _value ? c_oAscFormatPainterState.kOff : _value ) );

		this.isPaintFormat = value;
		return this.sendEvent("asc_onPaintFormatChanged", value);
	};
	asc_docs_api.prototype.SetMarkerFormat          = function(value, is_flag, r, g, b)
	{
		this.isMarkerFormat = value;

		if (this.isMarkerFormat)
		{
			this.WordControl.m_oLogicDocument.Paragraph_SetHighlight(is_flag, r, g, b);
			this.WordControl.m_oLogicDocument.Document_Format_Copy();
		}
	};

    asc_docs_api.prototype.sync_MarkerFormatCallback = function(value)
    {
        this.isMarkerFormat = value;
        return this.sendEvent("asc_onMarkerFormatChanged", value);
    };

    asc_docs_api.prototype.SetTableDrawMode = function(value)
    {
    	if (!this.WordControl || !this.WordControl.m_oLogicDocument)
    		return;

        this.isDrawTablePen = value;
        this.WordControl.m_oLogicDocument.DrawTableMode.Draw = value;

        if (this.isDrawTablePen && this.isDrawTableErase)
			this.SetTableEraseMode(false);

        this.WordControl.m_oDrawingDocument.UnlockCursorType();
        if (this.isDrawTablePen)
            this.WordControl.m_oDrawingDocument.LockCursorType("de-tablepen");
    };
    asc_docs_api.prototype.sync_TableDrawModeCallback = function(value)
    {
        this.isDrawTablePen = value;
        this.WordControl.m_oLogicDocument.DrawTableMode.Draw = value;
        if (!this.isDrawTablePen)
		{
			this.WordControl.m_oLogicDocument.DrawTableMode.Start = false;
			this.WordControl.m_oDrawingDocument.UnlockCursorType();
		}

        return this.sendEvent("asc_onTableDrawModeChanged", value);
    };
    asc_docs_api.prototype.SetTableEraseMode = function(value)
    {
        if (!this.WordControl || !this.WordControl.m_oLogicDocument)
            return;

        this.isDrawTableErase = value;
        this.WordControl.m_oLogicDocument.DrawTableMode.Erase = value;

        if (this.isDrawTableErase && this.isDrawTablePen)
            this.SetTableDrawMode(false);

        this.WordControl.m_oDrawingDocument.UnlockCursorType();
        if (this.isDrawTableErase)
            this.WordControl.m_oDrawingDocument.LockCursorType("de-tableeraser");
    };
    asc_docs_api.prototype.sync_TableEraseModeCallback = function(value)
    {
        this.isDrawTableErase = value;
        this.WordControl.m_oLogicDocument.DrawTableMode.Erase = value;
        if (!this.isDrawTableErase)
		{
			this.WordControl.m_oLogicDocument.DrawTableMode.Start = false;
			this.WordControl.m_oDrawingDocument.UnlockCursorType();
		}

        return this.sendEvent("asc_onTableEraseModeChanged", value);
    };

	asc_docs_api.prototype.StartAddShape = function(sPreset, is_apply)
	{
		if (this.isDrawTablePen)
		{
			this.sync_TableDrawModeCallback(false);
        }
        if (this.isDrawTableErase)
		{
            this.sync_TableEraseModeCallback(false);
        }

		this.isStartAddShape = true;
		this.addShapePreset  = sPreset;
		if (is_apply)
		{
			this.WordControl.m_oDrawingDocument.LockCursorType("crosshair");
		}
		else
		{
			editor.sync_EndAddShape();
			editor.sync_StartAddShapeCallback(false);
		}
	};

	asc_docs_api.prototype.AddShapeOnCurrentPage = function(_type)
	{
		if (!this.WordControl.m_oLogicDocument)
			return;

		var _pageNum = this.GetCurrentVisiblePage();
		// получаем размеры страницы
		var _sectionPr = this.WordControl.m_oLogicDocument.Get_PageLimits(_pageNum);

		var _min = Math.min(_sectionPr.XLimit / 2, _sectionPr.YLimit / 2);

		this.WordControl.m_oLogicDocument.DrawingObjects.addShapeOnPage(_type, _pageNum,
			_sectionPr.X + _sectionPr.XLimit / 4,
			_sectionPr.Y + _sectionPr.YLimit / 4,
			_min,
			_min);
	};


	asc_docs_api.prototype.asc_canEditCrop = function()
	{
		return this.WordControl.m_oLogicDocument.DrawingObjects.canStartImageCrop();
	};

	asc_docs_api.prototype.asc_startEditCrop = function()
	{
		return this.WordControl.m_oLogicDocument.DrawingObjects.startImageCrop();
	};

	asc_docs_api.prototype.asc_endEditCrop = function()
	{
		return this.WordControl.m_oLogicDocument.DrawingObjects.endImageCrop();
	};

	asc_docs_api.prototype.asc_cropFit = function()
	{
		return this.WordControl.m_oLogicDocument.DrawingObjects.cropFit();
	};

	asc_docs_api.prototype.asc_cropFill = function()
	{
		return this.WordControl.m_oLogicDocument.DrawingObjects.cropFill();
	};

	asc_docs_api.prototype.AddTextArt = function(nStyle)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddTextArt);
			this.WordControl.m_oLogicDocument.AddTextArt(nStyle);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};


	asc_docs_api.prototype.sync_StartAddShapeCallback = function(value)
	{
		this.isStartAddShape = value;
		return this.sendEvent("asc_onStartAddShapeChanged", value);
	};

	asc_docs_api.prototype.CanGroup = function()
	{
		return this.WordControl.m_oLogicDocument.CanGroup();
	};

	asc_docs_api.prototype.CanUnGroup = function()
	{
		return this.WordControl.m_oLogicDocument.CanUnGroup();
	};

	asc_docs_api.prototype.CanChangeWrapPolygon = function()
	{
		return this.WordControl.m_oLogicDocument.CanChangeWrapPolygon();
	};

	asc_docs_api.prototype.StartChangeWrapPolygon = function()
	{
		return this.WordControl.m_oLogicDocument.StartChangeWrapPolygon();
	};


	asc_docs_api.prototype.ClearFormating = function()
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_TextProperties))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_ClearFormatting);
			this.WordControl.m_oLogicDocument.ClearParagraphFormatting();
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.GetSectionInfo = function()
	{
		var obj = new CAscSection();

		// TODO: Переделать данную функцию, если она вообще нужна
		obj.PageWidth  = 297;
		obj.PageHeight = 210;

		obj.MarginLeft   = 30;
		obj.MarginRight  = 15;
		obj.MarginTop    = 20;
		obj.MarginBottom = 20;

		return obj;
	};

	asc_docs_api.prototype.add_SectionBreak = function(_Type)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddSectionBreak);
			this.WordControl.m_oLogicDocument.Add_SectionBreak(_Type);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};

	asc_docs_api.prototype.asc_setViewMode = function(isViewMode)
	{
		this.isViewMode = !!isViewMode;
		if (!this.isLoadFullApi)
		{
			return;
		}

		if (isViewMode)
		{
			this.asc_SpellCheckDisconnect();

			this.ShowParaMarks                           = false;
			AscCommon.CollaborativeEditing.Set_GlobalLock(true);
			//this.isShowTableEmptyLine = false;
			//this.WordControl.m_bIsRuler = true;

			if (null == this.WordControl.m_oDrawingDocument.m_oDocumentRenderer)
			{
				this.WordControl.m_oDrawingDocument.ClearCachePages();
				this.WordControl.HideRulers();
			}
			else
			{
				this.WordControl.HideRulers();
				this.WordControl.OnScroll();
			}
		}
		else
		{
			//this.WordControl.m_bIsRuler = true;
			this.WordControl.checkNeedRules();
			this.WordControl.m_oDrawingDocument.ClearCachePages();
			this.WordControl.OnResize(true);
		}
	};

	asc_docs_api.prototype.OnMouseUp = function(x, y)
	{
		this.WordControl.onMouseUpExternal(x, y);
	};

	asc_docs_api.prototype.asyncImageEndLoaded2       = null;

	asc_docs_api.prototype.SetDrawImagePlaceParagraph = function(element_id, props)
	{
		this.WordControl.m_oDrawingDocument.InitGuiCanvasTextProps(element_id);
		this.WordControl.m_oDrawingDocument.DrawGuiCanvasTextProps(props);
	};

	asc_docs_api.prototype.asc_getMasterCommentId = function()
	{
		return -1;
	};

	asc_docs_api.prototype.asc_getAnchorPosition = function()
	{
		var AnchorPos = this.WordControl.m_oLogicDocument.GetSelectionAnchorPos();
		return new AscCommon.asc_CRect(AnchorPos.X0, AnchorPos.Y, AnchorPos.X1 - AnchorPos.X0, 0);
	};

	asc_docs_api.prototype._onNeedParams  = function(data, opt_isPassword)
	{
		var t = this;
		if (opt_isPassword) {
			if (this.asc_checkNeedCallback("asc_onAdvancedOptions")) {
				t.sendEvent("asc_onAdvancedOptions", c_oAscAdvancedOptionsID.DRM);
			} else {
				t.sendEvent("asc_onError", c_oAscError.ID.ConvertationPassword, c_oAscError.Level.Critical);
			}
		} else {
			if (this.asc_checkNeedCallback("asc_onAdvancedOptions")) {
				var cp = {'codepage': AscCommon.c_oAscCodePageUtf8, 'encodings': AscCommon.getEncodingParams()};
				if (data && typeof Blob !== 'undefined' && typeof FileReader !== 'undefined') {
					AscCommon.getJSZipUtils().getBinaryContent(data, function(err, data) {
						if (err) {
							t.sendEvent("asc_onError", c_oAscError.ID.Unknown, c_oAscError.Level.Critical);
						} else {
							cp['data'] = data;
							t.sendEvent("asc_onAdvancedOptions", c_oAscAdvancedOptionsID.TXT, new AscCommon.asc_CAdvancedOptions(cp));
						}
					});
				} else {
					t.sendEvent("asc_onAdvancedOptions", c_oAscAdvancedOptionsID.TXT, new AscCommon.asc_CAdvancedOptions(cp));
				}
			} else {
				this.asc_setAdvancedOptions(c_oAscAdvancedOptionsID.TXT, new Asc.asc_CTextOptions(AscCommon.c_oAscCodePageUtf8));
			}
		}
	};
	asc_docs_api.prototype._waitPrint    = function(actionType, options)
	{
		if (this.WordControl && this.WordControl.m_oDrawingDocument &&
			(c_oAscFileType.PDF === options.fileType || c_oAscFileType.PDFA === options.fileType))
		{
			return this.WordControl.m_oDrawingDocument.CheckPrint([actionType, options]);
		}
		return false;
	};
	asc_docs_api.prototype._downloadAs    = function(actionType, options, oAdditionalData, dataContainer)
	{
		var t = this;
		var fileType = options.fileType;
		if (c_oAscAsyncAction.SendMailMerge === actionType)
		{
			oAdditionalData["c"] = 'sendmm';
			oAdditionalData["userindex"] = this.CoAuthoringApi.get_indexUser();
		}
		else if (!this.WordControl.m_oLogicDocument)
		{
			oAdditionalData["c"] = 'savefromorigin';
		}

		if ('savefromorigin' === oAdditionalData["c"])
		{
			oAdditionalData["format"] = this.documentFormat;
		}
		else if (null == options.oDocumentMailMerge && (c_oAscFileType.PDF === fileType || c_oAscFileType.PDFA === fileType))
		{
            var isSelection = false;
            if (options.advancedOptions && options.advancedOptions && (Asc.c_oAscPrintType.Selection === options.advancedOptions.asc_getPrintType()))
                isSelection = true;

			var dd             = this.WordControl.m_oDrawingDocument;
			if (isSelection)
				dd.GenerateSelectionPrint();

			dataContainer.data = dd.ToRendererPart(oAdditionalData["nobase64"], isSelection);
			//console.log(oAdditionalData["data"]);
		}
		else if (c_oAscFileType.JSON === fileType)
		{
			oAdditionalData['url'] = this.mailMergeFileData['url'];
			oAdditionalData['format'] = this.mailMergeFileData['fileType'];
			if (this.mailMergeFileData['token']) {
				oAdditionalData['tokenDownload'] = this.mailMergeFileData['token'];
				//remove to reduce message size
				oAdditionalData['tokenSession'] = undefined;
			}
			// ToDo select csv params
			oAdditionalData['codepage']  = AscCommon.c_oAscCodePageUtf8;
			oAdditionalData['delimiter'] = AscCommon.c_oAscCsvDelimiter.Comma;
		}
		else if (this.insertDocumentUrlsData)
		{
			var last = this.insertDocumentUrlsData.documents.shift();
			oAdditionalData['url'] = last.url;
			oAdditionalData['format'] = last.format;
			if (last.token) {
				oAdditionalData['tokenDownload'] = last.token;
				//remove to reduce message size
				oAdditionalData['tokenSession'] = undefined;
			}
			oAdditionalData['outputurls']= true;
			// ToDo select txt params
			oAdditionalData["codepage"] = AscCommon.c_oAscCodePageUtf8;
			dataContainer.data = last.data;
		}
		else if (c_oAscFileType.HTML === fileType && null == options.oDocumentMailMerge && null == options.oMailMergeSendData)
		{
			//в asc_nativeGetHtml будет вызван select all, чтобы выделился документ должны выйти из колонтитулов и автофигур
			var _e     = new AscCommon.CKeyboardEvent();
			_e.CtrlKey = false;
			_e.KeyCode = 27;
			this.WordControl.m_oLogicDocument.OnKeyDown(_e);
			//сделано через сервер, потому что нет простого механизма сохранения на клиенте
			dataContainer.data = '\ufeff' + window["asc_docs_api"].prototype["asc_nativeGetHtml"].call(this);
		}
		else
		{
			if (options.advancedOptions instanceof Asc.asc_CTextOptions)
			{
				oAdditionalData["codepage"] = options.advancedOptions.asc_getCodePage();
			}
			var oLogicDocument;
			if (null != options.oDocumentMailMerge)
				oLogicDocument = options.oDocumentMailMerge;
			else
				oLogicDocument = this.WordControl.m_oLogicDocument;
			var oBinaryFileWriter;
			if (null != options.oMailMergeSendData && c_oAscFileType.HTML === options.oMailMergeSendData.get_MailFormat())
				oBinaryFileWriter = new AscCommonWord.BinaryFileWriter(oLogicDocument, false, true, options.compatible);
			else
				oBinaryFileWriter = new AscCommonWord.BinaryFileWriter(oLogicDocument, undefined, undefined, options.compatible);
			dataContainer.data = oBinaryFileWriter.Write(oAdditionalData["nobase64"]);
		}
		if (null != options.oMailMergeSendData)
		{
			oAdditionalData["mailmergesend"] = options.oMailMergeSendData;
			var MailMergeMap                 = this.WordControl.m_oLogicDocument.MailMergeMap;
			var aJsonOut                     = [];
			if (MailMergeMap)
			{
				if (MailMergeMap.length > 0)
				{
					var oFirstRow = MailMergeMap[0];
					var aRowOut   = [];
					for (var i in oFirstRow)
						aRowOut.push(i);
					aJsonOut.push(aRowOut);
				}
				//todo может надо запоминать порядок for in в первом столбце, если for in будет по-разному обходить строки
				for (var i = 0; i < MailMergeMap.length; ++i)
				{
					var oRow    = MailMergeMap[i];
					var aRowOut = [];
					for (var j in oRow)
						aRowOut.push(oRow[j]);
					aJsonOut.push(aRowOut);
				}
			}
			var editorData = dataContainer.data;
			dataContainer.data = JSON.stringify(aJsonOut);
			options.oMailMergeSendData.put_IsJson(true);
			//save Editor.bin after json
			var callback = options.callback;
			options.callback = function (incomeObject) {
				oAdditionalData["savekey"] = incomeObject["data"];
				var _dataContainer = {data : editorData, part : null, index : 0, count : 0};
				options.oMailMergeSendData.put_IsJson(false);

				AscCommon.saveWithParts(function(fCallback1, oAdditionalData1, dataContainer1) {
					sendCommand(t, fCallback1, oAdditionalData1, dataContainer1);
				}, t.fCurCallback, callback, oAdditionalData, _dataContainer);
			}
		}

        if (window.isCloudCryptoDownloadAs)
        {
            var sParamXml = ("<m_nCsvTxtEncoding>" + oAdditionalData["codepage"] + "</m_nCsvTxtEncoding>");
            window["AscDesktopEditor"]["CryptoDownloadAs"](dataContainer.data, fileType, sParamXml);
			return true;
        }
	};

	// Вставка диаграмм
	asc_docs_api.prototype.asc_getChartObject = function(type)
	{
		this.isChartEditor = true;		// Для совместного редактирования
		if (!AscFormat.isRealNumber(type))
		{
			this.asc_onOpenChartFrame();
			this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Drawing_Props);
		}

		return this.WordControl.m_oLogicDocument.GetChartObject(type);
	};

	asc_docs_api.prototype.asc_addChartDrawingObject = function(options)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddChart);
			AscFonts.IsCheckSymbols = true;
			this.asc_SetSilentMode(true);
			this.WordControl.m_oLogicDocument.AddInlineImage(null, null, null, options);
			AscFonts.IsCheckSymbols = false;

			var oThis = this;
			AscFonts.FontPickerByCharacter.checkText("", this, function() {
				this.asc_SetSilentMode(false, true);
				oThis.WordControl.m_oLogicDocument.FinalizeAction();
			}, false, false, false);
		}
	};
	asc_docs_api.prototype.asc_doubleClickOnChart    = function(obj)
	{
		this.isChartEditor = true;	// Для совместного редактирования
		this.asc_onOpenChartFrame();
		
		if(!window['IS_NATIVE_EDITOR']) {
			this.WordControl.onMouseUpMainSimple();
		}
		
		this.sendEvent("asc_doubleClickOnChart", obj);
	};

	asc_docs_api.prototype.asc_onCloseChartFrame               = function()
	{
		AscCommon.baseEditorsApi.prototype.asc_onCloseChartFrame.call(this);
		this.WordControl.m_bIsMouseLock = false;
	};

	asc_docs_api.prototype.asc_editChartDrawingObject = function(chartBinary)
	{
		/**/

		// Находим выделенную диаграмму и накатываем бинарник
		if (AscFormat.isObject(chartBinary))
		{
			if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content))
			{
				this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_EditChart);
				this.WordControl.m_oLogicDocument.EditChart(chartBinary);
				this.WordControl.m_oLogicDocument.FinalizeAction();
			}
		}
	};

	asc_docs_api.prototype.sync_closeChartEditor = function()
	{
		this.sendEvent("asc_onCloseChartEditor");
	};

	asc_docs_api.prototype.asc_setDrawCollaborationMarks = function(bDraw)
	{
		this.tmpCoMarksDraw = bDraw;
		if (!this.isLoadFullApi)
		{
			return;
		}

		if (bDraw !== this.isCoMarksDraw)
		{
			this.isCoMarksDraw = bDraw;
			this.WordControl.m_oDrawingDocument.ClearCachePages();
			this.WordControl.m_oDrawingDocument.FirePaint();
		}
	};

	asc_docs_api.prototype.asc_AddMath = function(Type)
	{
		var loader   = AscCommon.g_font_loader;
		var fontinfo = g_fontApplication.GetFontInfo("Cambria Math");
		var isasync  = loader.LoadFont(fontinfo);
		if (false === isasync)
		{
			return this.asc_AddMath2(Type);
		}
		else
		{
			this.FontAsyncLoadType  = 1;
			this.FontAsyncLoadParam = Type;
		}
	};

	asc_docs_api.prototype.asc_AddMath2 = function(Type)
	{
		if (false === this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content))
		{
			this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_AddMath);
			var MathElement = new AscCommonWord.MathMenu(Type);
			this.WordControl.m_oLogicDocument.AddToParagraph(MathElement);
			this.WordControl.m_oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.asc_AddPageCount = function()
	{
		this.WordControl.m_oLogicDocument.AddPageCount();
	};
	//----------------------------------------------------------------------------------------------------------------------
	// Функции для работы с MailMerge
	//----------------------------------------------------------------------------------------------------------------------
	asc_docs_api.prototype.asc_StartMailMerge              = function(oData)
	{
		this.mailMergeFileData = oData;
		this.asc_DownloadAs(new Asc.asc_CDownloadOptions(Asc.c_oAscFileType.JSON));
	};
	asc_docs_api.prototype.asc_StartMailMergeByList        = function(aList)
	{
		if (!aList || !aList.length || aList.length <= 0)
			aList = [[]];

		var aFields = aList[0];
		if (!aFields || !aFields.length || aFields.length <= 0)
			aFields = [];

		// Пробегаемся по названиям полей и делаем следующее:
		// Если название пустой, тогда задем ему имя "F<номер столбца>"
		// Если название совпадает, тогда добавляем ему число, чтобы имя стало уникальным.

		var UsedNames = {};
		for (var Pos = 0, Count = aFields.length; Pos < Count; Pos++)
		{
			if ("" === aFields[Pos])
				aFields[Pos] = "F" + (Pos + 1);

			if (undefined !== UsedNames[aFields[Pos]])
			{
				var Add = 1;
				var NewName = aFields[Pos] + Add;
				while (undefined !== UsedNames[NewName])
				{
					Add++;
					NewName = aFields[Pos] + Add;
				}
				aFields[Pos] = NewName;
			}

			UsedNames[aFields[Pos]] = 1;
		}

		var DstList = [];
		var FieldsCount = aFields.length;
		for (var Index = 1, Count = aList.length; Index < Count; Index++)
		{
			var oSrcElement = aList[Index];
			var oDstElement = {};
			for (var FieldIndex = 0; FieldIndex < FieldsCount; FieldIndex++)
			{
				var sFieldName = aFields[FieldIndex];
				oDstElement[sFieldName] = oSrcElement[FieldIndex];
			}

			DstList.push(oDstElement);
		}

		this.WordControl.m_oLogicDocument.Start_MailMerge(DstList, aFields);
	};
	asc_docs_api.prototype.asc_GetReceptionsCount          = function()
	{
		return this.WordControl.m_oLogicDocument.Get_MailMergeReceptionsCount();
	};
	asc_docs_api.prototype.asc_GetMailMergeFieldsNameList  = function()
	{
		return this.WordControl.m_oLogicDocument.Get_MailMergeFieldsNameList();
	};
	asc_docs_api.prototype.asc_AddMailMergeField           = function(Name)
	{
		this.WordControl.m_oLogicDocument.Add_MailMergeField(Name);
	};
	asc_docs_api.prototype.asc_SetHighlightMailMergeFields = function(Value)
	{
		this.WordControl.m_oLogicDocument.Set_HightlighMailMergeFields(Value);
	};
	asc_docs_api.prototype.asc_PreviewMailMergeResult      = function(Index)
	{
		this.WordControl.m_oLogicDocument.Preview_MailMergeResult(Index);
	};
	asc_docs_api.prototype.asc_EndPreviewMailMergeResult   = function()
	{
		this.WordControl.m_oLogicDocument.EndPreview_MailMergeResult();
	};
	asc_docs_api.prototype.sync_StartMailMerge             = function()
	{
		this.sendEvent("asc_onStartMailMerge");
	};
	asc_docs_api.prototype.sync_PreviewMailMergeResult     = function(Index)
	{
		this.sendEvent("asc_onPreviewMailMergeResult", Index);
	};
	asc_docs_api.prototype.sync_EndPreviewMailMergeResult  = function()
	{
		this.sendEvent("asc_onEndPreviewMailMergeResult");
	};
	asc_docs_api.prototype.sync_HighlightMailMergeFields   = function(Value)
	{
		this.sendEvent("asc_onHighlightMailMergeFields", Value);
	};
	asc_docs_api.prototype.asc_getMailMergeData            = function()
	{
		return this.WordControl.m_oLogicDocument.Get_MailMergeReceptionsList();
	};
	asc_docs_api.prototype.asc_setMailMergeData            = function(aList)
	{
		this.asc_StartMailMergeByList(aList);
	};
	asc_docs_api.prototype.asc_sendMailMergeData           = function(oData)
	{
		var t = this;
		var actionType = Asc.c_oAscAsyncAction.SendMailMerge;
		oData.put_UserId(this.documentUserId);
		oData.put_RecordCount(oData.get_RecordTo() - oData.get_RecordFrom() + 1);
		var options = new Asc.asc_CDownloadOptions(Asc.c_oAscFileType.TXT);
		options.oMailMergeSendData = oData;
		options.callback = function(input) {
			if (null != input && "sendmm" === input["type"])
			{
				if ("ok" != input["status"])
				{
					t.sendEvent("asc_onError", AscCommon.mapAscServerErrorToAscError(parseInt(input["data"])),
						c_oAscError.Level.NoCritical);
				}
			}
			else
			{
				t.sendEvent("asc_onError", c_oAscError.ID.Unknown, c_oAscError.Level.NoCritical);
			}
			t.sync_EndAction(Asc.c_oAscAsyncActionType.BlockInteraction, actionType);
		};
		this.downloadAs(actionType, options);
	};
	asc_docs_api.prototype.asc_GetMailMergeFiledValue      = function(nIndex, sName)
	{
		return this.WordControl.m_oLogicDocument.Get_MailMergeFieldValue(nIndex, sName);
	};
	//----------------------------------------------------------------------------------------------------------------------
	// Работаем со стилями
	//----------------------------------------------------------------------------------------------------------------------
	asc_docs_api.prototype.asc_GetStyleFromFormatting = function()
	{
		return this.WordControl.m_oLogicDocument.GetStyleFromFormatting();
	};
	asc_docs_api.prototype.asc_AddNewStyle            = function(oStyle)
	{
		this.WordControl.m_oLogicDocument.Add_NewStyle(oStyle);
	};
	asc_docs_api.prototype.asc_RemoveStyle            = function(sName)
	{
		this.WordControl.m_oLogicDocument.Remove_Style(sName);
	};
	asc_docs_api.prototype.asc_RemoveAllCustomStyles  = function()
	{
		this.WordControl.m_oLogicDocument.Remove_AllCustomStyles();
	};
	asc_docs_api.prototype.asc_IsStyleDefault         = function(sName)
	{
		return this.WordControl.m_oLogicDocument.Is_StyleDefault(sName);
	};
	asc_docs_api.prototype.asc_IsDefaultStyleChanged  = function(sName)
	{
		return this.WordControl.m_oLogicDocument.Is_DefaultStyleChanged(sName);
	};
	asc_docs_api.prototype.asc_GetStyleNameById       = function(StyleId)
	{
		return this.WordControl.m_oLogicDocument.Get_StyleNameById(StyleId);
	};
	//----------------------------------------------------------------------------------------------------------------------
	// Работаем с рецензированием
	//----------------------------------------------------------------------------------------------------------------------
	asc_docs_api.prototype.asc_SetTrackRevisions               = function(bTrack)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		return oLogicDocument.SetTrackRevisions(bTrack);
	};
	asc_docs_api.prototype.asc_IsTrackRevisions                = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return false;

		return oLogicDocument.IsTrackRevisions();
	};
	asc_docs_api.prototype.sync_BeginCatchRevisionsChanges     = function()
	{
		this.RevisionChangesStack = [];
	};
	asc_docs_api.prototype.sync_EndCatchRevisionsChanges       = function()
	{
		this.sendEvent("asc_onShowRevisionsChange", this.RevisionChangesStack);
	};
	asc_docs_api.prototype.asc_GetRevisionsChangesStack        = function()
	{
		return this.RevisionChangesStack;
	};
	asc_docs_api.prototype.sync_AddRevisionsChange             = function(Change)
	{
		this.RevisionChangesStack.push(Change);
	};
	asc_docs_api.prototype.asc_AcceptChanges                   = function(oChange)
	{
		if (oChange)
			this.WordControl.m_oLogicDocument.AcceptRevisionChange(oChange);
		else
			this.WordControl.m_oLogicDocument.AcceptRevisionChangesBySelection();
	};
	asc_docs_api.prototype.asc_RejectChanges                   = function(oChange)
	{
		if (oChange)
			this.WordControl.m_oLogicDocument.RejectRevisionChange(oChange);
		else
			this.WordControl.m_oLogicDocument.RejectRevisionChangesBySelection();
	};
	asc_docs_api.prototype.asc_HaveRevisionsChanges            = function(isCheckOwnChanges)
	{
		if (!this.WordControl.m_oLogicDocument)
			return false;
		return this.WordControl.m_oLogicDocument.HaveRevisionChanges(isCheckOwnChanges);
	};
	asc_docs_api.prototype.asc_HaveNewRevisionsChanges         = function()
	{
		return this.asc_HaveRevisionsChanges();
	};
	asc_docs_api.prototype.asc_GetNextRevisionsChange          = function()
	{
		return this.WordControl.m_oLogicDocument.GetNextRevisionChange();
	};
	asc_docs_api.prototype.asc_GetPrevRevisionsChange          = function()
	{
		return this.WordControl.m_oLogicDocument.GetPrevRevisionChange();
	};
	asc_docs_api.prototype.sync_UpdateRevisionsChangesPosition = function(X, Y)
	{
		this.sendEvent("asc_onUpdateRevisionsChangesPosition", X, Y);
	};
	asc_docs_api.prototype.asc_AcceptAllChanges                = function()
	{
		this.WordControl.m_oLogicDocument.AcceptAllRevisionChanges();
	};
	asc_docs_api.prototype.asc_RejectAllChanges                = function()
	{
		this.WordControl.m_oLogicDocument.RejectAllRevisionChanges();
	};
	asc_docs_api.prototype.asc_GetTrackRevisionsReportByAuthors= function()
	{
		var oResult = {};
		var oAllChanges = this.WordControl.m_oLogicDocument.TrackRevisionsManager.Get_AllChanges();
		for (var ParaId in oAllChanges)
		{
			var arrChanges = oAllChanges[ParaId];
			for (var nIndex = 0, nCount = arrChanges.length; nIndex < nCount; ++nIndex)
			{
				var oChange   = arrChanges[nIndex];
				var sUserName = oChange.get_UserName();
				var nDateTime = oChange.get_DateTime();

				if (!oResult[sUserName])
					oResult[sUserName] = [];

				var arrUserChanges = oResult[sUserName];

				var nPos = 0;
				var nLen = arrUserChanges.length;
				while (nPos < nLen)
				{
					if (nDateTime < arrUserChanges[nPos].get_DateTime())
						break;

					nPos++;
				}

				arrUserChanges.splice(nPos, 0, oChange);
			}
		}

		return oResult;
	};
	asc_docs_api.prototype.asc_FollowRevisionMove = function(oChange)
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return;

		var sMoveId = oChange.GetMoveId();
		var isFrom  = oChange.GetMoveType() === Asc.c_oAscRevisionsMove.MoveTo;
		oLogicDocument.SelectTrackMove(sMoveId, isFrom, true, true);
	};

	asc_docs_api.prototype.asc_undoAllChanges       = function()
	{
		this.WordControl.m_oLogicDocument.Document_Undo({All : true});
	};
	asc_docs_api.prototype.asc_CloseFile            = function()
	{
		History.Clear();
		g_oIdCounter.Clear();
		g_oTableId.Clear();
		AscCommon.CollaborativeEditing.Clear();
		this.isApplyChangesOnOpenEnabled = true;
		this.isDocumentLoadComplete = false;

		var oLogicDocument = this.WordControl.m_oLogicDocument;
		oLogicDocument.StopRecalculate();
		oLogicDocument.Stop_CheckSpelling();
		AscCommon.pptx_content_loader.ImageMapChecker = {};

		this.WordControl.m_oDrawingDocument.CloseFile();
	};
	asc_docs_api.prototype.asc_SetFastCollaborative = function(isOn)
	{
		if (!this.WordControl || !this.WordControl.m_oLogicDocument)
			return;
		if (AscCommon.CollaborativeEditing){
			AscCommon.CollaborativeEditing.Set_Fast(isOn);
			if(window['AscCommon'].g_specialPasteHelper && isOn && !AscCommon.CollaborativeEditing.Is_SingleUser()){
				window['AscCommon'].g_specialPasteHelper.SpecialPasteButton_Hide();
			}
		}
	};

	asc_docs_api.prototype._onEndLoadSdk = function()
	{
		AscCommon.baseEditorsApi.prototype._onEndLoadSdk.call(this);

		History           = AscCommon.History;
		g_fontApplication = AscFonts.g_fontApplication;
		PasteElementsId   = AscCommon.PasteElementsId;
		global_mouseEvent = AscCommon.global_mouseEvent;

		this.WordControl      = new AscCommonWord.CEditorPage(this);
		this.WordControl.Name = this.HtmlElementName;

		this.CurrentTranslate = AscCommonWord.translations_map["en"];

		//выставляем тип copypaste
		PasteElementsId.g_bIsDocumentCopyPaste = true;

		this.CreateComponents();
		this.WordControl.Init();

		if (this.tmpFontRenderingMode)
		{
			this.SetFontRenderingMode(this.tmpFontRenderingMode);
		}
		if (null !== this.tmpViewRulers)
		{
			this.asc_SetViewRulers(this.tmpViewRulers);
		}
		if (null !== this.tmpZoomType)
		{
			switch (this.tmpZoomType)
			{
				case AscCommon.c_oZoomType.FitToPage:
					this.zoomFitToPage();
					break;
				case AscCommon.c_oZoomType.FitToWidth:
					this.zoomFitToWidth();
					break;
				case AscCommon.c_oZoomType.CustomMode:
					this.zoomCustomMode();
					break;
			}
		}
		if (null != this.tmpDocumentUnits)
		{
			this.asc_SetDocumentUnits(this.tmpDocumentUnits);
			this.tmpDocumentUnits = null;
		}

		this.asc_setViewMode(this.isViewMode);
		this.asc_setDrawCollaborationMarks(this.tmpCoMarksDraw);

		if (this.isOnlyReaderMode)
			this.ImageLoader.bIsAsyncLoadDocumentImages = false;

        if (this.openFileCryptBinary)
        {
            this.openFileCryptCallback(this.openFileCryptBinary);
        }
	};

	asc_docs_api.prototype.asc_Recalculate = function(bIsUpdateInterface)
	{
		if (!this.WordControl.m_oLogicDocument)
			return;

		return this.WordControl.m_oLogicDocument.RecalculateFromStart(bIsUpdateInterface);
	};

	asc_docs_api.prototype.asc_canPaste = function()
	{
		if (!this.WordControl ||
			!this.WordControl.m_oLogicDocument ||
			this.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(changestype_Paragraph_Content))
			return false;

		this.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_PasteHotKey);
		return true;
	};
	//----------------------------------------------------------------------------------------------------------------------
	// Работаем с полями
	//----------------------------------------------------------------------------------------------------------------------
	asc_docs_api.prototype.asc_GetBlockChainData = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return [];

		var arrFields = oLogicDocument.GetAllFormTextFields();
		var arrResult = [];
		for (var nIndex = 0, nCount = arrFields.length; nIndex < nCount; ++nIndex)
		{
			var oField = arrFields[nIndex];
			arrResult.push(oField.GetValue());
		}
		return arrResult;
	};
	asc_docs_api.prototype.asc_SetBlockChainData = function(arrData)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return [];

		var arrFields = oLogicDocument.GetAllFormTextFields();
		var arrResult = [];
		for (var nIndex = 0, nCount = arrFields.length; nIndex < nCount; ++nIndex)
		{
			var oField = arrFields[nIndex];
			oField.SetValue(arrData[nIndex] ? arrData[nIndex] : "");
		}

		if (!this.isLongAction())
			oLogicDocument.RecalculateFromStart();
	};
	//----------------------------------------------------------------------------------------------------------------------
	// Работаем с ContentControl
	//----------------------------------------------------------------------------------------------------------------------
	asc_docs_api.prototype.asc_RemoveContentControl = function(Id)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		var isLocked        = true;
		var oContentControl = null;
		if (undefined === Id)
		{
			var oInfo          = oLogicDocument.GetSelectedElementsInfo({SkipTOC : true});
			var oInlineControl = oInfo.GetInlineLevelSdt();
			var oBlockControl  = oInfo.GetBlockLevelSdt();

			if (oInlineControl)
				oContentControl = oInlineControl;
			else if (oBlockControl)
				oContentControl = oBlockControl;
		}
		else
		{
			oContentControl = AscCommon.g_oTableId.Get_ById(Id);
		}

		if (oContentControl && oContentControl.GetContentControlType)
		{
			if (c_oAscSdtLevelType.Block === oContentControl.GetContentControlType())
			{
				isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
					Type      : AscCommon.changestype_2_ElementsArray_and_Type,
					Elements  : [oContentControl],
					CheckType : AscCommon.changestype_ContentControl_Remove
				});
			}
			else if (c_oAscSdtLevelType.Inline === oContentControl.GetContentControlType())
			{
				var oParagraph = oContentControl.GetParagraph();
				if (oParagraph)
				{
					isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
						Type      : AscCommon.changestype_2_ElementsArray_and_Type,
						Elements  : [oParagraph],
						CheckType : AscCommon.changestype_Paragraph_Content
					});
				}
			}

			Id = oContentControl.GetId();
		}

		if (false === isLocked)
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_RemoveContentControl);
			oLogicDocument.RemoveContentControl(Id);
			oLogicDocument.Recalculate();
			oLogicDocument.UpdateInterface();
			oLogicDocument.UpdateSelection();
			oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.asc_RemoveContentControlWrapper = function(Id)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		var isLocked        = true;
		var oContentControl = oLogicDocument.GetContentControl(Id);

		if (oContentControl && oContentControl.GetContentControlType)
		{
			if (c_oAscSdtLevelType.Block === oContentControl.GetContentControlType())
			{
				isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
					Type      : AscCommon.changestype_2_ElementsArray_and_Type,
					Elements  : [oContentControl],
					CheckType : AscCommon.changestype_ContentControl_Remove
				});
			}
			else if (c_oAscSdtLevelType.Inline === oContentControl.GetContentControlType())
			{
				var oParagraph = oContentControl.GetParagraph();
				if (oParagraph)
				{
					var oState = oLogicDocument.SaveDocumentState();
					oContentControl.SelectContentControl();

					isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
						Type      : AscCommon.changestype_2_ElementsArray_and_Type,
						Elements  : [oParagraph],
						CheckType : AscCommon.changestype_Remove
					});

					oLogicDocument.LoadDocumentState(oState);
				}
			}

			Id = oContentControl.GetId();
		}

		if (false === isLocked)
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_RemoveContentControlWrapper);
			oLogicDocument.RemoveContentControlWrapper(Id);
			oLogicDocument.Recalculate();
			oLogicDocument.UpdateInterface();
			oLogicDocument.UpdateSelection();
			oLogicDocument.FinalizeAction();
			return true;
		}
		return false;
	};
	asc_docs_api.prototype.asc_SetContentControlProperties = function(oContentControlPr, Id, isApplyToAll)
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return;

		function preSetup() {
			oLogicDocument.StartAction(AscDFH.historydescription_Document_ChangeContentControlProperties);
			AscFonts.IsCheckSymbols = true;
		}
		function postSetup() {
			AscFonts.IsCheckSymbols = false;
			AscFonts.FontPickerByCharacter.checkText("", oLogicDocument, function() {
				this.Recalculate();
				this.UpdateInterface();
				this.UpdateSelection();
				this.FinalizeAction();
			}, false, false, false);
		}

		if (true === isApplyToAll)
		{
			var arrContentControls = oLogicDocument.GetAllContentControls();

			var arrCheckElements = [], arrCheckTypes = [];
			for (var nIndex = 0, nCount = arrContentControls.length; nIndex < nCount; ++nIndex)
			{
				var oContentControl = arrContentControls[nIndex];
				if (c_oAscSdtLevelType.Block === oContentControl.GetContentControlType())
				{
					arrCheckElements.push(oContentControl);
					arrCheckTypes.push(AscCommon.changestype_ContentControl_Properties);
				}
				else if (c_oAscSdtLevelType.Inline === oContentControl.GetContentControlType())
				{
					var oParagraph = oContentControl.GetParagraph();
					if (oParagraph)
					{
						arrCheckElements.push(oParagraph);
						arrCheckTypes.push(AscCommon.changestype_Paragraph_Properties);
					}
				}
			}

			if (false === oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
				Type       : AscCommon.changestype_2_Element_and_Type_Array,
				Elements   : arrCheckElements,
				CheckTypes : arrCheckTypes
			}))
			{
				preSetup();

				for (var nIndex = 0, nCount = arrContentControls.length; nIndex < nCount; ++nIndex)
				{
					arrContentControls[nIndex].SetContentControlPr(oContentControlPr);
				}

				postSetup();
			}
		}
		else
		{
			var isLocked        = true;
			var oContentControl = oLogicDocument.GetContentControl(Id);

			if (oContentControl && oContentControl.GetContentControlType)
			{
				if ((Asc.c_oAscSdtLockType.ContentLocked === oContentControl.GetContentControlLock()
					|| Asc.c_oAscSdtLockType.SdtContentLocked === oContentControl.GetContentControlLock())
					&& oContentControlPr
					&& Asc.c_oAscSdtLockType.Unlocked !== oContentControlPr.GetLock()
					&& Asc.c_oAscSdtLockType.SdtLocked !== oContentControlPr.GetLock())
				{
					if (oContentControl.IsDatePicker() && !oContentControl.GetDatePickerPr().IsEqual(oContentControlPr.DateTimePr))
					{
						oContentControlPr.DateTimePr = oContentControl.GetDatePickerPr().Copy();
					}
				}

				if (c_oAscSdtLevelType.Block === oContentControl.GetContentControlType())
				{
					isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
						Type      : AscCommon.changestype_2_ElementsArray_and_Type,
						Elements  : [oContentControl],
						CheckType : AscCommon.changestype_ContentControl_Properties
					});
				}
				else if (c_oAscSdtLevelType.Inline === oContentControl.GetContentControlType())
				{
					var oParagraph = oContentControl.GetParagraph();
					if (oParagraph)
					{
						isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
							Type      : AscCommon.changestype_2_ElementsArray_and_Type,
							Elements  : [oParagraph],
							CheckType : AscCommon.changestype_Paragraph_Properties
						});
					}
				}
			}

			if (false === isLocked)
			{
				preSetup();
				oContentControl.SetContentControlPr(oContentControlPr);
				postSetup();
			}
		}
	};
	asc_docs_api.prototype.asc_IsContentControl = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return false;

		return (!!oLogicDocument.GetContentControl());
	};
	asc_docs_api.prototype.asc_GetContentControlProperties = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return null;

		var oContentControl = oLogicDocument.GetContentControl();

		return oContentControl ? oContentControl.GetContentControlPr() : null;
	};
	asc_docs_api.prototype.asc_GetCurrentContentControl = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return null;

		var oContentControl = oLogicDocument.GetContentControl();
		return oContentControl ? oContentControl.GetId() : null;
	};
	asc_docs_api.prototype.sync_ContentControlCallback = function(oContentControlPr)
	{
		this.SelectedObjectsStack[this.SelectedObjectsStack.length] = new asc_CSelectedObject(c_oAscTypeSelectElement.ContentControl, oContentControlPr);
	};
	asc_docs_api.prototype.asc_SetGlobalContentControlHighlightColor = function(r, g, b)
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return;

		// Если цвет не задан
		if (undefined === r || null == r)
		{
			r = 220;
			g = 220;
			b = 220;
		}

		// Лок можно не проверять, такие изменения нормально мержаться
		oLogicDocument.StartAction(AscDFH.historydescription_Document_SetGlobalSdtHighlightColor);
		oLogicDocument.SetSdtGlobalColor(r, g, b);

		oLogicDocument.GetDrawingDocument().ClearCachePages();
		oLogicDocument.GetDrawingDocument().FirePaint();
		oLogicDocument.FinalizeAction();
	};
	asc_docs_api.prototype.sync_OnChangeSdtGlobalSettings = function()
	{
		this.sendEvent("asc_onChangeSdtGlobalSettings");
	};
	asc_docs_api.prototype.asc_GetGlobalContentControlHighlightColor = function(isDefault)
	{
		if (true === isDefault)
			return new Asc.asc_CColor(220, 220, 220);

		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return new Asc.asc_CColor(0, 0, 0);

		var oColor = oLogicDocument.GetSdtGlobalColor();
		return new Asc.asc_CColor(oColor.r, oColor.g, oColor.b);
	};
	asc_docs_api.prototype.asc_SetGlobalContentControlShowHighlight = function(isShow, r, g, b)
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return;

		// Лок можно не проверять, таким изменения нормально мержаться
		oLogicDocument.StartAction(AscDFH.historydescription_Document_SetGlobalSdtShowHighlight);
		oLogicDocument.SetSdtGlobalShowHighlight(isShow);

		if (undefined !== r && undefined !== g && undefined !== b)
			oLogicDocument.SetSdtGlobalColor(r, g, b);

		oLogicDocument.Redraw();
		oLogicDocument.FinalizeAction();
	};
	asc_docs_api.prototype.asc_GetGlobalContentControlShowHighlight = function()
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return false;

		return oLogicDocument.GetSdtGlobalShowHighlight();
	};
	asc_docs_api.prototype.asc_SetContentControlCheckBoxPr = function(oPr)
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument || !oPr)
			return;

		var oContentControl = oLogicDocument.GetContentControl();
		if (!oContentControl || !oContentControl.IsCheckBox())
			return;

		if (oPr.CheckedSymbol)
			AscFonts.FontPickerByCharacter.getFontBySymbol(oPr.CheckedSymbol);

		if (oPr.UncheckedSymbol)
			AscFonts.FontPickerByCharacter.getFontBySymbol(oPr.UncheckedSymbol);

		var oFonts = {};
		if (oPr.CheckedFont)
			oFonts[oPr.CheckedFont] = true;

		if (oPr.UncheckedFont)
			oFonts[oPr.UncheckedFont] = true;

		AscCommon.Check_LoadingDataBeforePrepaste(this, oFonts, {}, function()
		{
			var oParagraph = oContentControl.GetParagraph();
			if (oParagraph && !oLogicDocument.IsSelectionLocked(AscCommon.changestype_None, {
					Type      : AscCommon.changestype_2_ElementsArray_and_Type,
					Elements  : [oParagraph],
					CheckType : AscCommon.changestype_Paragraph_Properties
				}))
			{
				oLogicDocument.StartAction(AscDFH.historydescription_Document_SetContentControlCheckBoxPr);
				oContentControl.ApplyCheckBoxPr(oPr);
				oLogicDocument.Recalculate();
				oLogicDocument.UpdateTracks();
				oLogicDocument.FinalizeAction();
			}
		});
	};
	asc_docs_api.prototype.asc_SetContentControlPictureUrl = function(sUrl, sId)
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument || AscCommon.isNullOrEmptyString(sUrl))
			return;

		var oCC = oLogicDocument.GetContentControl(sId);
		oCC.SkipSpecialContentControlLock(true);
		if (!oCC || !oCC.IsPicture() || !oCC.SelectPicture() || !oCC.CanBeEdited())
		{
			oCC.SkipSpecialContentControlLock(false);
			return;
		}

		if (!oLogicDocument.IsSelectionLocked(AscCommon.changestype_Image_Properties, undefined, false, oLogicDocument.IsFormFieldEditing()))
		{
			oCC.SkipSpecialContentControlLock(false);

			var oImagePr = {
				ImageUrl : sUrl
			};

			var sImageUrl = null, fReplaceCallback = null, sImageToDownLoad = "";

			if (!g_oDocumentUrls.getImageLocal(sUrl))
			{
				sImageUrl        = sUrl;
				fReplaceCallback = function(sUrl)
				{
					oImagePr.ImageUrl = sUrl;
					sImageToDownLoad  = sUrl;
				}
			}

			sImageToDownLoad = sUrl;

			var oApi = this;
			var fApplyCallback = function()
			{
				var fPropsCallback = function(_img)
				{
					if(_img && _img.Image && oImagePr)
					{
						var oDrawingObjects = oApi.WordControl.m_oLogicDocument.DrawingObjects;
						if(oDrawingObjects && oDrawingObjects.selectedObjects[0])
						{
							var dWidth = oDrawingObjects.selectedObjects[0].extX;
							var dHeight = oDrawingObjects.selectedObjects[0].extY;
							var __w = Math.max((_img.Image.width * AscCommon.g_dKoef_pix_to_mm), 1);
							var __h = Math.max((_img.Image.height * AscCommon.g_dKoef_pix_to_mm), 1);
							var fKoeff = 1.0/Math.max(__w/dWidth, __h/dHeight);
							var _w      = Math.max(5, __w*fKoeff);
							var _h      = Math.max(5, __h*fKoeff);
							oImagePr.Width = _w;
							oImagePr.Height = _h;
						}
					}
					oApi.WordControl.m_oLogicDocument.StartAction(AscDFH.historydescription_Document_ApplyImagePrWithUrl);
					oApi.WordControl.m_oLogicDocument.SetImageProps(oImagePr);
					oApi.WordControl.m_oLogicDocument.UpdateTracks();
					oApi.WordControl.m_oLogicDocument.FinalizeAction();
				};
				var _img = oApi.ImageLoader.LoadImage(sImageToDownLoad, 1);
				if (null != _img)
				{
					fPropsCallback(_img);
				}
				else
				{
					oApi.asyncImageEndLoaded2 = function(_img)
					{
						fPropsCallback(_img);
					}
				}
			};

			if (sImageUrl)
			{
				if (window["AscDesktopEditor"])
				{
					var _url = window["AscDesktopEditor"]["LocalFileGetImageUrl"](sImageToDownLoad);
					_url     = g_oDocumentUrls.getImageUrl(_url);
					fReplaceCallback(_url);
					fApplyCallback();
					return;
				}

				AscCommon.sendImgUrls(this, [sImageToDownLoad], function(data)
				{
					if (data && data[0])
					{
						fReplaceCallback(data[0].url);
						fApplyCallback();
					}
				}, false);
			}
			else
			{
				fApplyCallback();
			}
		}
		else
		{
			oCC.SkipSpecialContentControlLock(false);
		}
	};
	asc_docs_api.prototype.asc_SetContentControlListPr = function(oPr, sId)
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return;

		var isLocked        = true;
		var oContentControl = oLogicDocument.GetContentControl(sId);
		if (!oContentControl || (!oContentControl.IsComboBox() && !oContentControl.DropDownList()))
			return;

		if (c_oAscSdtLevelType.Block === oContentControl.GetContentControlType())
		{
			isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
				Type      : AscCommon.changestype_2_ElementsArray_and_Type,
				Elements  : [oContentControl],
				CheckType : AscCommon.changestype_ContentControl_Properties
			});
		}
		else if (c_oAscSdtLevelType.Inline === oContentControl.GetContentControlType())
		{
			var oParagraph = oContentControl.GetParagraph();
			if (oParagraph)
			{
				isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
					Type      : AscCommon.changestype_2_ElementsArray_and_Type,
					Elements  : [oParagraph],
					CheckType : AscCommon.changestype_Paragraph_Properties
				});
			}
		}

		if (false === isLocked)
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_SetContentControlListPr);

			if (oContentControl.IsComboBox())
				oContentControl.SetComboBoxPr(oPr);
			else
				oContentControl.SetDropDownListPr(oPr);

			oLogicDocument.UpdateInterface();
			oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.asc_SelectContentControlListItem = function(sValue, sId)
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return;

		var oContentControl = oLogicDocument.GetContentControl(sId);
		if (!oContentControl || (!oContentControl.IsComboBox() && !oContentControl.IsDropDownList()))
			return;

		oContentControl.SkipSpecialContentControlLock(true);

		if (!oContentControl.CanBeEdited())
		{
			oContentControl.SkipSpecialContentControlLock(false);
			return;
		}

		var isLocked = false;
		if (c_oAscSdtLevelType.Block === oContentControl.GetContentControlType())
		{
			isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
				Type      : AscCommon.changestype_2_ElementsArray_and_Type,
				Elements  : [oContentControl],
				CheckType : AscCommon.changestype_Paragraph_AddText
			}, false, oLogicDocument.IsFormFieldEditing());
		}
		else if (c_oAscSdtLevelType.Inline === oContentControl.GetContentControlType())
		{
			var oParagraph = oContentControl.GetParagraph();
			if (oParagraph)
			{
				var oState = oLogicDocument.SaveDocumentState();
				oContentControl.SelectContentControl();

				isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
					Type      : AscCommon.changestype_2_ElementsArray_and_Type,
					Elements  : [oParagraph],
					CheckType : AscCommon.changestype_Paragraph_AddText
				}, false, oLogicDocument.IsFormFieldEditing());

				oLogicDocument.LoadDocumentState(oState);
			}
		}
		oContentControl.SkipSpecialContentControlLock(false);

		if (!isLocked)
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_SelectContentControlListItem);
			oContentControl.SelectListItem(sValue);
			oLogicDocument.RemoveSelection();
			oContentControl.MoveCursorToContentControl(true);
			oLogicDocument.Recalculate();
			oLogicDocument.UpdateInterface();
			oLogicDocument.UpdateTracks();
			oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.asc_SetContentControlDatePickerPr = function(oPr, sId)
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return;

		var isLocked        = true;
		var oContentControl = oLogicDocument.GetContentControl(sId);
		if (!oContentControl || !oContentControl.IsDatePicker())
			return;

		if (c_oAscSdtLevelType.Block === oContentControl.GetContentControlType())
		{
			isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
				Type      : AscCommon.changestype_2_ElementsArray_and_Type,
				Elements  : [oContentControl],
				CheckType : AscCommon.changestype_ContentControl_Properties
			}, false, oLogicDocument.IsFormFieldEditing());
		}
		else if (c_oAscSdtLevelType.Inline === oContentControl.GetContentControlType())
		{
			var oParagraph = oContentControl.GetParagraph();
			if (oParagraph)
			{
				isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
					Type      : AscCommon.changestype_2_ElementsArray_and_Type,
					Elements  : [oParagraph],
					CheckType : AscCommon.changestype_Paragraph_Properties
				}, false, oLogicDocument.IsFormFieldEditing());
			}
		}

		if (false === isLocked)
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_SetContentControlListPr);
			oContentControl.ApplyDatePickerPr(oPr);
			oLogicDocument.Recalculate();
			oLogicDocument.UpdateInterface();
			oLogicDocument.UpdateTracks();
			oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.asc_SetContentControlDatePickerDate = function(oPr, sId)
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return;

		var oContentControl = oLogicDocument.GetContentControl(sId);
		if (!oContentControl || !oContentControl.IsDatePicker() || !oContentControl.CanBeEdited())
			return;

		this.asc_SetContentControlDatePickerPr(oPr, sId);
	};

	asc_docs_api.prototype.asc_UncheckContentControlButtons = function()
	{
		var _controls = (this.WordControl && this.WordControl.m_oDrawingDocument && this.WordControl.m_oDrawingDocument.contentControls) ? this.WordControl.m_oDrawingDocument.contentControls.ContentControlObjects : [];
		for (var i = 0; i < _controls.length; i++)
		{
			_controls[i].ActiveButtonIndex = -2;
		}

		this.WordControl.ShowOverlay();
		this.WordControl.StartUpdateOverlay();
		this.WordControl.OnUpdateOverlay();
		this.WordControl.EndUpdateOverlay();
	};

	asc_docs_api.prototype.asc_BeginViewModeInReview = function(isFinal)
	{
		this.WordControl.m_oLogicDocument.BeginViewModeInReview(isFinal);
	};
	asc_docs_api.prototype.asc_EndViewModeInReview = function()
	{
		this.WordControl.m_oLogicDocument.EndViewModeInReview();
	};

	asc_docs_api.prototype.asc_ShowDocumentOutline = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		oLogicDocument.DocumentOutline.SetUse(true);
		return oLogicDocument.DocumentOutline;
	};
	asc_docs_api.prototype.asc_HideDocumentOutline = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		oLogicDocument.DocumentOutline.SetUse(false);
	};
	asc_docs_api.prototype.sync_OnDocumentOutlineUpdate = function()
	{
		this.sendEvent("asc_onDocumentOutlineUpdate");
	};
	asc_docs_api.prototype.sync_OnDocumentOutlineCurrentPosition = function(nIndex)
	{
		this.sendEvent("asc_onDocumentOutlineCurrentPosition", nIndex);
	};
	asc_docs_api.prototype.sync_OnDocumentOutlineUpdateAdd = function(nIndex)
	{
		this.sendEvent("asc_onDocumentOutlineUpdateAdd", nIndex);
	};
	asc_docs_api.prototype.sync_OnDocumentOutlineUpdateChange = function(nIndex)
	{
		this.sendEvent("asc_onDocumentOutlineUpdateChange", nIndex);
	};
	asc_docs_api.prototype.sync_OnDocumentOutlineUpdateRemove = function(nIndex)
	{
		this.sendEvent("asc_onDocumentOutlineUpdateRemove", nIndex);
	};

	asc_docs_api.prototype.asc_AddTableOfContents = function(sHeading, oPr)
	{
        var sReplacementText = AscCommon.translateManager.getValue("No table of contents entries found.");
		AscFonts.FontPickerByCharacter.checkText(sHeading + sReplacementText, this, function() {

			var oLogicDocument = this.WordControl.m_oLogicDocument;
			if (!oLogicDocument)
				return;

			var oTOC = oLogicDocument.GetTableOfContents();
			if (oTOC instanceof AscCommonWord.CBlockLevelSdt && oTOC.IsBuiltInUnique())
			{
				if (oPr)
					this.asc_SetTableOfContentsPr(oPr);

				return;
			}

			this.WordControl.m_oLogicDocument.AddTableOfContents(sHeading, oPr);

		});
	};
	asc_docs_api.prototype.asc_RemoveTableOfContents = function(oTOC)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		if (!oTOC)
		{
			oTOC = oLogicDocument.GetTableOfContents();
			if (!oTOC)
				return;
		}

		if (oTOC instanceof AscCommonWord.CBlockLevelSdt)
		{
			this.asc_RemoveContentControl(oTOC.GetId());
		}
		else if (oTOC instanceof AscCommonWord.CComplexField)
		{
			this.asc_RemoveComplexField(oTOC);
		}
	};
	asc_docs_api.prototype.asc_GetTableOfContentsPr = function(isCurrent)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		var oTOC = oLogicDocument.GetTableOfContents(isCurrent);
		if (!oTOC)
			return;

		if (oTOC instanceof AscCommonWord.CBlockLevelSdt)
		{
			var oInnerTOC = oTOC.GetInnerTableOfContents();

			if (!(oInnerTOC instanceof AscCommonWord.CComplexField))
			{
				// Специальнный случай, когда у нас есть контейнер помеченный как TOC, но самого TOC внутри нет
				// посылаем в интерфейс класс так, чтобы с ним все равно можно было работать (например, удалить его)
				var oPr = new Asc.CTableOfContentsPr();
				oPr.InitFromSdtTOC(oTOC);
				return oPr;
			}

			oTOC = oInnerTOC;
		}

		if (oTOC instanceof AscCommonWord.CComplexField)
		{
			var oPr = new Asc.CTableOfContentsPr();
			oPr.InitFromTOCInstruction(oTOC);
			oPr.CheckStylesType(oLogicDocument.GetStyles());
			return oPr;
		}

		return null;
	};
	asc_docs_api.prototype.asc_SetTableOfContentsPr = function(oPr)
	{
		if (!(oPr instanceof Asc.CTableOfContentsPr))
			return;

		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		var oTOC = oPr.ComplexField;
		if (!oTOC)
		{
			oTOC = oLogicDocument.GetTableOfContents();
			if (!oTOC)
				return;
		}

		if (oTOC instanceof AscCommonWord.CBlockLevelSdt)
		{
			var oInnerTOC = oTOC.GetInnerTableOfContents();
			if (!oInnerTOC)
			{
				oLogicDocument.AddTableOfContents(null, oPr, oTOC);
				return;
			}

			oTOC = oInnerTOC;
		}

		if (!oTOC)
			return;

		var oStyles     = oLogicDocument.GetStyles();
		var nStylesType = oPr.get_StylesType();

		var isNeedChangeStyles = (Asc.c_oAscTOCStylesType.Current !== nStylesType && nStylesType !== oStyles.GetTOCStylesType());

		oTOC.SelectField();

		var isLocked = true;
		if (isNeedChangeStyles)
		{
			isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Content, {
				Type : AscCommon.changestype_2_AdditionalTypes, Types : [AscCommon.changestype_Document_Styles]
			});
		}
		else
		{
			isLocked = oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Content)
		}

		if (!isLocked)
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_SetComplexFieldPr);

			if (isNeedChangeStyles)
				oStyles.SetTOCStylesType(nStylesType);

			oTOC.SetPr(oPr);
			oTOC.Update();

			oLogicDocument.Recalculate();
			oLogicDocument.UpdateInterface();
			oLogicDocument.UpdateSelection();
			oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.asc_UpdateTableOfContents = function(isUpdatePageNumbers, oTOC)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		if (!oTOC)
		{
			oTOC = oLogicDocument.GetTableOfContents();
			if (!oTOC)
				return;
		}

		if (oTOC instanceof AscCommonWord.CBlockLevelSdt)
			oTOC = oTOC.GetInnerTableOfContents();

		if (!oTOC)
			return;

		var oState = oLogicDocument.SaveDocumentState();

		oTOC.SelectField();
		if (isUpdatePageNumbers)
		{
			if (false === oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Content))
			{
				oLogicDocument.StartAction(AscDFH.historydescription_Document_UpdateTableOfContents);

				var arrParagraphs = oLogicDocument.GetCurrentParagraph(false, true);

				for (var nParaIndex = 0, nParasCount = arrParagraphs.length; nParaIndex < nParasCount; ++nParaIndex)
				{
					var arrPageNumbers = arrParagraphs[nParaIndex].GetComplexFieldsArrayByType(AscCommonWord.fieldtype_PAGEREF);
					for (var nRefIndex = 0, nRefsCount = arrPageNumbers.length; nRefIndex < nRefsCount; ++nRefIndex)
					{
						arrPageNumbers[nRefIndex].Update();
					}
				}

				oLogicDocument.LoadDocumentState(oState);
				oLogicDocument.Recalculate();
				oLogicDocument.UpdateInterface();
				oLogicDocument.UpdateSelection();
				oLogicDocument.FinalizeAction();
			}
		}
		else
		{
			if (false === oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Document_Content))
			{
				oLogicDocument.StartAction(AscDFH.historydescription_Document_UpdateTableOfContents);

				oTOC.Update();

				oLogicDocument.LoadDocumentState(oState);
				oLogicDocument.Recalculate();
				oLogicDocument.UpdateInterface();
				oLogicDocument.UpdateSelection();
				oLogicDocument.FinalizeAction();
			}
		}

	};

	asc_docs_api.prototype.asc_GetCurrentComplexField = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		return oLogicDocument.GetCurrentComplexField();
	};
	asc_docs_api.prototype.asc_UpdateComplexField = function(oComplexField)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument || !(oComplexField instanceof AscCommonWord.CComplexField || oComplexField instanceof AscCommonWord.ParaPageNum || oComplexField instanceof AscCommonWord.ParaPageCount))
			return;

		if (oComplexField instanceof AscCommonWord.ParaPageNum || oComplexField instanceof AscCommonWord.ParaPageCount)
		{
			var oRun = oComplexField.GetParent();
			if (!oRun)
				return;

			var nInRunPos = oRun.GetElementPosition(oComplexField);
			if (-1 === nInRunPos)
				return;

			var oParagraph = oRun.GetParagraph();
			if (!oParagraph)
				return;

			if (false === oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
					Type      : AscCommon.changestype_2_ElementsArray_and_Type,
					Elements  : [oParagraph],
					CheckType : AscCommon.changestype_Paragraph_Content
				}))
			{
				oLogicDocument.StartAction(AscDFH.historydescription_Document_SetComplexFieldPr);

				oRun.RemoveFromContent(nInRunPos, 1);
				oRun.AddToContent(nInRunPos, oComplexField instanceof AscCommonWord.ParaPageNum ? new AscCommonWord.ParaPageNum() : new AscCommonWord.ParaPageCount(oLogicDocument.GetPagesCount()));

				oLogicDocument.Recalculate();
				oLogicDocument.UpdateInterface();
				oLogicDocument.UpdateSelection();
				oLogicDocument.FinalizeAction();
			}
		}
		else
		{
			oComplexField.SelectField();
			if (false === oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Content))
			{
				oLogicDocument.StartAction(AscDFH.historydescription_Document_SetComplexFieldPr);

				oComplexField.Update();

				oLogicDocument.Recalculate();
				oLogicDocument.UpdateInterface();
				oLogicDocument.UpdateSelection();
				oLogicDocument.FinalizeAction();
			}
		}
	};
	asc_docs_api.prototype.asc_RemoveComplexField = function(oComplexField)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oComplexField || !oLogicDocument)
			return;

		if (oComplexField instanceof AscCommonWord.ParaPageNum || oComplexField instanceof AscCommonWord.ParaPageCount)
		{
			var oRun = oComplexField.GetParent();
			if (!oRun)
				return;

			var nInRunPos = oRun.GetElementPosition(oComplexField);
			if (-1 === nInRunPos)
				return;

			var oParagraph = oRun.GetParagraph();
			if (!oParagraph)
				return;

			if (false === oLogicDocument.Document_Is_SelectionLocked({
					Type      : AscCommon.changestype_2_ElementsArray_and_Type,
					Elements  : [oParagraph],
					CheckType : AscCommon.changestype_Paragraph_Content
				}))
			{
				oLogicDocument.StartAction(AscDFH.historydescription_Document_SetComplexFieldPr);

				oRun.RemoveFromContent(nInRunPos, 1);

				oLogicDocument.Recalculate();
				oLogicDocument.UpdateInterface();
				oLogicDocument.UpdateSelection();
				oLogicDocument.FinalizeAction();
			}
		}
		else
		{
			oComplexField.SelectField();
			if (false === oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Remove))
			{
				oLogicDocument.StartAction(AscDFH.historydescription_Document_RemoveComplexField);

				oComplexField.RemoveField();

				oLogicDocument.Recalculate();
				oLogicDocument.UpdateInterface();
				oLogicDocument.UpdateSelection();
				oLogicDocument.FinalizeAction();
			}
		}
	};
	asc_docs_api.prototype.asc_SetComplexFieldPr = function(oComplexField, oPr, isUpdate)
	{

		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument || !oPr || !(oComplexField instanceof AscCommonWord.CComplexField || oComplexField instanceof AscCommonWord.ParaPageNum || oComplexField instanceof AscCommonWord.ParaPageCount))
			return;

		if (oComplexField instanceof AscCommonWord.ParaPageNum || oComplexField instanceof AscCommonWord.ParaPageCount)
			return;

		oComplexField.SelectField();
		if (false === oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Paragraph_Content))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_SetComplexFieldPr);

			oComplexField.SetPr(oPr);
			if (isUpdate)
				oComplexField.Update();

			oLogicDocument.Recalculate();
			oLogicDocument.UpdateInterface();
			oLogicDocument.UpdateSelection();
			oLogicDocument.FinalizeAction();
		}
	};
	asc_docs_api.prototype.asc_AddTableFormula = function(sFormula)
	{
		var oLogicDocument = this.private_GetLogicDocument();

		if (!oLogicDocument)
			return;

		oLogicDocument.AddTableCellFormula(sFormula);
	};
	asc_docs_api.prototype.asc_GetTableFormula = function()
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return "=";

		return oLogicDocument.GetTableCellFormula();
	};
	asc_docs_api.prototype.asc_GetTableFormulaFormats = function()
	{
		return ["#,##0", "#,##0.00", "$#,##0.00;($#,##0.00)", "0", "0%", "0.00", "0.00%"];
	};

	asc_docs_api.prototype.asc_ParseTableFormulaInstrLine = function(sInstrLine)
	{
		return this.WordControl.m_oLogicDocument.ParseTableFormulaInstrLine(sInstrLine);
	};

	asc_docs_api.prototype.asc_CreateInstructionLine = function(sFormula, sFormat)
	{
		var sRet = sFormula;
		if(typeof sFormat === "string" && sFormat.length > 0){
			sRet += " \\# \"" + sFormat + "\"";
		}
		return sRet;
	};

	asc_docs_api.prototype.asc_AddObjectCaption = function(oPr)
	{
		var oLogicDocument = this.private_GetLogicDocument();

		if (!oLogicDocument)
			return;

		oLogicDocument.AddCaption(oPr);
	};

	asc_docs_api.prototype.asc_GetBookmarksManager = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return null;

		var oManager = oLogicDocument.GetBookmarksManager();
		oManager.Update();
		return oManager;
	};
	asc_docs_api.prototype.asc_OnBookmarksUpdate = function()
	{
		this.sendEvent("asc_onBookmarksUpdate");
	};

	asc_docs_api.prototype.asc_GetHeadingLevel = function(sStyleName)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument || !sStyleName)
			return -1;

		return oLogicDocument.GetStyles().GetHeadingLevelByName(sStyleName);
	};
	asc_docs_api.prototype.asc_GetStylesArray = function()
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return [];

		return oLogicDocument.GetStyles().GetAscStylesArray();
	};

	asc_docs_api.prototype.asc_SetAutomaticBulletedLists = function(isAuto)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		return oLogicDocument.SetAutomaticBulletedLists(isAuto);
	};
	asc_docs_api.prototype.asc_SetAutomaticNumberedLists = function(isAuto)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		return oLogicDocument.SetAutomaticNumberedLists(isAuto);
	};
	asc_docs_api.prototype.asc_SetAutoCorrectSmartQuotes = function(isSmartQuotes)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		return oLogicDocument.SetAutoCorrectSmartQuotes(isSmartQuotes);
	};
	asc_docs_api.prototype.asc_SetAutoCorrectHyphensWithDash = function(isReplace)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return;

		return oLogicDocument.SetAutoCorrectHyphensWithDash(isReplace);
	};

	asc_docs_api.prototype.asc_GetSelectedText = function()
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return null;

		return oLogicDocument.GetSelectedText(false);
	};
	asc_docs_api.prototype.asc_AddBlankPage = function()
	{
		var oLogicDocument = this.private_GetLogicDocument();
		if (!oLogicDocument)
			return null;

		oLogicDocument.AddBlankPage();
	};

	// input
	asc_docs_api.prototype.Begin_CompositeInput = function()
	{
		if (this.WordControl.m_oLogicDocument)
			return this.WordControl.m_oLogicDocument.Begin_CompositeInput();
		return null;
	};
	asc_docs_api.prototype.Add_CompositeText = function(nCharCode)
	{
		if (this.WordControl.m_oLogicDocument)
			return this.WordControl.m_oLogicDocument.Add_CompositeText(nCharCode);
		return null;
	};
	asc_docs_api.prototype.Remove_CompositeText = function(nCount)
	{
		if (this.WordControl.m_oLogicDocument)
			return this.WordControl.m_oLogicDocument.Remove_CompositeText(nCount);
		return null;
	};
	asc_docs_api.prototype.Replace_CompositeText = function(arrCharCodes)
	{
		if (this.WordControl.m_oLogicDocument)
			return this.WordControl.m_oLogicDocument.Replace_CompositeText(arrCharCodes);
		return null;
	};
	asc_docs_api.prototype.Set_CursorPosInCompositeText = function(nPos)
	{
		if (this.WordControl.m_oLogicDocument)
			return this.WordControl.m_oLogicDocument.Set_CursorPosInCompositeText(nPos);
		return null;
	};
	asc_docs_api.prototype.Get_CursorPosInCompositeText = function()
	{
		if (this.WordControl.m_oLogicDocument)
			return this.WordControl.m_oLogicDocument.Get_CursorPosInCompositeText();
		return 0;
	};
	asc_docs_api.prototype.End_CompositeInput = function()
	{
		if (this.WordControl.m_oLogicDocument)
			return this.WordControl.m_oLogicDocument.End_CompositeInput();
		return null;
	};
	asc_docs_api.prototype.Get_MaxCursorPosInCompositeText = function()
	{
		if (this.WordControl.m_oLogicDocument)
			return this.WordControl.m_oLogicDocument.Get_MaxCursorPosInCompositeText();
		return 0;
	};
	asc_docs_api.prototype.Input_UpdatePos = function()
	{
		if (this.WordControl.m_oLogicDocument)
			this.WordControl.m_oDrawingDocument.MoveTargetInInputContext();
	};

	asc_docs_api.prototype.onKeyDown = function(e)
	{
		return this.WordControl.onKeyDown(e);
	};
	asc_docs_api.prototype.onKeyPress = function(e)
	{
		return this.WordControl.onKeyPress(e);
	};
	asc_docs_api.prototype.onKeyUp = function(e)
	{
		return this.WordControl.onKeyUp(e);
	};
	asc_docs_api.prototype.getAddedTextOnKeyDown = function(e)
	{
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if (!oLogicDocument)
			return [];

		return oLogicDocument.GetAddedTextOnKeyDown(e);
	};

	window["asc_docs_api"]                                      = asc_docs_api;
	window["asc_docs_api"].prototype["asc_nativeOpenFile"]      = function(base64File, version)
	{
		this.SpellCheckUrl = '';

		this.User = new AscCommon.asc_CUser();
		this.User.setId("TM");
		this.User.setUserName("native");

		this.WordControl.m_bIsRuler = false;
		this.WordControl.Init();

		this.InitEditor();
		this.DocumentType   = 2;
		this.LoadedObjectDS = this.WordControl.m_oLogicDocument.CopyStyle();

		g_oIdCounter.Set_Load(true);

		var openParams        = {checkFileSize : /*this.isMobileVersion*/false, charCount : 0, parCount : 0};
		var oBinaryFileReader = new AscCommonWord.BinaryFileReader(this.WordControl.m_oLogicDocument, openParams);

		if (undefined !== version)
			AscCommon.CurFileVersion = version;
		
		if (oBinaryFileReader.Read(base64File))
		{
			g_oIdCounter.Set_Load(false);
			this.LoadedObject = 1;
		}
		else
			this.sendEvent("asc_onError", c_oAscError.ID.MobileUnexpectedCharCount, c_oAscError.Level.Critical);

		if (window["NATIVE_EDITOR_ENJINE"] === true && undefined != window["native"])
		{
			AscCommon.CDocsCoApi.prototype.askSaveChanges = function(callback)
			{
				callback({"saveLock" : false});
			};
			AscCommon.CDocsCoApi.prototype.saveChanges    = function(arrayChanges, deleteIndex, excelAdditionalInfo)
			{
				if (window["native"]["SaveChanges"])
					window["native"]["SaveChanges"](arrayChanges.join("\",\""), deleteIndex, arrayChanges.length);
			};
		}

		if (undefined != window["Native"])
			return;

		//callback
		this.DocumentOrientation = (null == editor.WordControl.m_oLogicDocument) ? true : !editor.WordControl.m_oLogicDocument.Orientation;
		var sizeMM;
		if (this.DocumentOrientation)
			sizeMM = DocumentPageSize.getSize(AscCommon.Page_Width, AscCommon.Page_Height);
		else
			sizeMM = DocumentPageSize.getSize(AscCommon.Page_Height, AscCommon.Page_Width);
		this.sync_DocSizeCallback(sizeMM.w_mm, sizeMM.h_mm);
		this.sync_PageOrientCallback(editor.get_DocumentOrientation());

		if (this.GenerateNativeStyles !== undefined)
		{
			this.GenerateNativeStyles();

			if (this.WordControl.m_oDrawingDocument.CheckTableStylesOne !== undefined)
				this.WordControl.m_oDrawingDocument.CheckTableStylesOne();
		}
	};
	window["asc_docs_api"].prototype["asc_nativeCalculateFile"] = function()
	{
		if (null == this.WordControl.m_oLogicDocument)
			return;

		var Document = this.WordControl.m_oLogicDocument;

		if ((window["NATIVE_EDITOR_ENJINE"] === undefined) && this.isApplyChangesOnOpenEnabled)
		{
			this.isApplyChangesOnOpenEnabled = false;
			if (1 === AscCommon.CollaborativeEditing.m_nUseType)
			{
				this.isApplyChangesOnOpen = true;
				AscCommon.CollaborativeEditing.Apply_Changes();
				AscCommon.CollaborativeEditing.Release_Locks();
				return;
			}
		}

		Document.MoveCursorToStartPos();
		Document.RecalculateFromStart();

		Document.Document_UpdateInterfaceState();
		//Document.Document_UpdateRulersState();
		Document.Document_UpdateSelectionState();

		this.ShowParaMarks = false;
	};

	window["asc_docs_api"].prototype["asc_nativeApplyChanges"] = function(changes)
	{
		this._coAuthoringSetChanges(changes, new AscCommonWord.CDocumentColor(191, 255, 199));
		AscCommon.CollaborativeEditing.Apply_OtherChanges();
	};

	window["asc_docs_api"].prototype.asc_SetSilentMode = function(bEnabled, bAddition)
	{
		if (!this.WordControl.m_oLogicDocument)
			return;
		if (bEnabled)
			this.WordControl.m_oLogicDocument.Start_SilentMode();
		else
			this.WordControl.m_oLogicDocument.End_SilentMode(bAddition);
	};

	window["asc_docs_api"].prototype["asc_nativeApplyChanges2"] = function(data, isFull)
	{
		// Чтобы заново созданные параграфы не отображались залоченными
		g_oIdCounter.Set_Load(true);

		var stream = new AscCommon.FT_Stream2(data, data.length);
		stream.obj = null;
		var _color = new AscCommonWord.CDocumentColor(191, 255, 199);

		// Применяем изменения, пока они есть
		var _count = stream.GetLong();

		var _pos = 4;
		for (var i = 0; i < _count; i++)
		{
			if (window["NATIVE_EDITOR_ENJINE"] === true && window["native"]["CheckNextChange"])
			{
				if (!window["native"]["CheckNextChange"]())
					break;
			}

			var nChangeLen = stream.GetLong();
			_pos += 4;
			stream.size = _pos + nChangeLen;

			var ClassId = stream.GetString2();
			var Class   = AscCommon.g_oTableId.Get_ById(ClassId);

			var nReaderPos  = stream.GetCurPos();
			var nChangeType = stream.GetLong();

			if (Class)
			{
				var fChangesClass = AscDFH.changesFactory[nChangeType];
				if (fChangesClass)
				{
					var oChange = new fChangesClass(Class);
					oChange.ReadFromBinary(stream);

					if (true === AscCommon.CollaborativeEditing.private_AddOverallChange(oChange, false))
						oChange.Load(_color);
				}
				else
				{
					AscCommon.CollaborativeEditing.private_AddOverallChange(data, false);

					stream.Seek(nReaderPos);
					stream.Seek2(nReaderPos);

					Class.Load_Changes(stream, null, _color);
				}
			}

			_pos += nChangeLen;
			stream.Seek2(_pos);
			stream.size = data.length;
		}

		if (isFull)
		{
			AscCommon.CollaborativeEditing.m_aChanges = [];

			// У новых элементов выставляем указатели на другие классы
			AscCommon.CollaborativeEditing.Apply_LinkData();

			// Делаем проверки корректности новых изменений
			AscCommon.CollaborativeEditing.Check_MergeData();

			AscCommon.CollaborativeEditing.OnEnd_ReadForeignChanges();

			if (window["NATIVE_EDITOR_ENJINE"] === true && window["native"]["AddImageInChanges"])
			{
				var _new_images     = AscCommon.CollaborativeEditing.m_aNewImages;
				var _new_images_len = _new_images.length;

				for (var nImage = 0; nImage < _new_images_len; nImage++)
					window["native"]["AddImageInChanges"](_new_images[nImage]);
			}
		}

		g_oIdCounter.Set_Load(false);
	};

	window["asc_docs_api"].prototype["asc_nativeGetFile"] = function()
	{
		var oBinaryFileWriter = new AscCommonWord.BinaryFileWriter(this.WordControl.m_oLogicDocument);
		return oBinaryFileWriter.Write();
	};
	window["asc_docs_api"].prototype["asc_nativeGetFile2"] = function()
	{
		var oBinaryFileWriter = new AscCommonWord.BinaryFileWriter(this.WordControl.m_oLogicDocument);
		return oBinaryFileWriter.Write(true, true);

	};
    window["asc_docs_api"].prototype.asc_nativeGetFile3 = function()
    {
        var oBinaryFileWriter = new AscCommonWord.BinaryFileWriter(this.WordControl.m_oLogicDocument);
        return { data: oBinaryFileWriter.Write(true, true), header: (AscCommon.c_oSerFormat.Signature + ";v" + Asc.c_nVersionNoBase64 + ";" + oBinaryFileWriter.memory.GetCurPosition() + ";") };
    };

	window["asc_docs_api"].prototype["asc_nativeGetFileData"] = function()
	{
		var oBinaryFileWriter = new AscCommonWord.BinaryFileWriter(this.WordControl.m_oLogicDocument);
		var _memory           = oBinaryFileWriter.memory;

		oBinaryFileWriter.Write(true);

		var _header = AscCommon.c_oSerFormat.Signature + ";v" + Asc.c_nVersionNoBase64 + ";" + _memory.GetCurPosition() + ";";
		window["native"]["Save_End"](_header, _memory.GetCurPosition());

		return _memory.ImData.data;
	};

	window["asc_docs_api"].prototype["asc_nativeGetHtml"] = function()
	{
		var _old                           = PasteElementsId.copyPasteUseBinary;
		PasteElementsId.copyPasteUseBinary = false;
		this.WordControl.m_oLogicDocument.SelectAll();
		var oCopyProcessor = new AscCommon.CopyProcessor(this);
		oCopyProcessor.Start();
		var _ret = "<html><head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" /></head><body>" + oCopyProcessor.getInnerHtml() + "</body></html>";
		this.WordControl.m_oLogicDocument.RemoveSelection();
		PasteElementsId.copyPasteUseBinary = _old;
		return _ret;
	};

	window["asc_docs_api"].prototype["asc_AddHtml"] = function(_iframeId)
	{
		var ifr = document.getElementById(_iframeId);

		var frameWindow = window.frames[_iframeId];
		if (frameWindow)
		{
			if (null != frameWindow.document && null != frameWindow.document.body)
			{
				ifr.style.display = "block";
				this.WordControl.m_oLogicDocument.StartAction();
				this.asc_SetSilentMode(true);
				AscCommon.Editor_Paste_Exec(this, AscCommon.c_oAscClipboardDataFormat.HtmlElement, frameWindow.document.body, ifr);
				this.WordControl.m_oLogicDocument.FinalizeAction();
				this.asc_SetSilentMode(false);
			}
		}

		if (ifr)
			document.body.removeChild(ifr);
	};

	window["asc_docs_api"].prototype["asc_nativeCalculate"] = function()
	{
	};

	window["asc_docs_api"].prototype["asc_nativePrint"] = function(_printer, _page, _options)
	{
		if (undefined === _printer && _page === undefined)
		{
			if (undefined !== window["AscDesktopEditor"])
			{
                var isSelection = (_options && _options["printOptions"] && _options["printOptions"]["selection"]) ? true : false;
				var _drawing_document = this.WordControl.m_oDrawingDocument;
                if (isSelection)
                	_drawing_document.GenerateSelectionPrint();

                var _drawing_document_print = _drawing_document.printedDocument ? _drawing_document.printedDocument.DrawingDocument : _drawing_document;
				var pagescount        = Math.min(_drawing_document_print.m_lPagesCount, _drawing_document_print.m_lCountCalculatePages);

				window["AscDesktopEditor"]["Print_Start"](this.DocumentUrl, pagescount, "", _drawing_document.printedDocument ? 0 : this.getCurrentPage());

				var oDocRenderer                  = new AscCommon.CDocumentRenderer();
                oDocRenderer.InitPicker(AscCommon.g_oTextMeasurer.m_oManager);
				oDocRenderer.VectorMemoryForPrint = new AscCommon.CMemory();
				var bOldShowMarks                 = this.ShowParaMarks;
				this.ShowParaMarks                = false;

				for (var i = 0; i < pagescount; i++)
				{
					oDocRenderer.Memory.Seek(0);
					oDocRenderer.VectorMemoryForPrint.ClearNoAttack();

					var page = _drawing_document_print.m_arrPages[i];
					oDocRenderer.BeginPage(page.width_mm, page.height_mm);
                    _drawing_document_print.m_oLogicDocument.DrawPage(i, oDocRenderer);
					oDocRenderer.EndPage();

					window["AscDesktopEditor"]["Print_Page"](oDocRenderer.Memory.GetBase64Memory(), page.width_mm, page.height_mm);
				}

				this.ShowParaMarks = bOldShowMarks;

                _drawing_document.printedDocument = null;
				window["AscDesktopEditor"]["Print_End"]();
			}
			return;
		}

		var page = this.WordControl.m_oDrawingDocument.m_arrPages[_page];
		_printer.BeginPage(page.width_mm, page.height_mm);
		this.WordControl.m_oLogicDocument.DrawPage(_page, _printer);
		_printer.EndPage();
	};

	window["asc_docs_api"].prototype["asc_nativePrintPagesCount"] = function()
	{
		return this.WordControl.m_oDrawingDocument.m_lPagesCount;
	};

	window["asc_docs_api"].prototype["asc_nativeGetPDF"] = function(options)
	{
		var pagescount = this["asc_nativePrintPagesCount"]();
		if (options && options["printOptions"] && options["printOptions"]["onlyFirstPage"])
            pagescount = 1;

		var _renderer                  = new AscCommon.CDocumentRenderer();
        _renderer.InitPicker(AscCommon.g_oTextMeasurer.m_oManager);
		_renderer.VectorMemoryForPrint = new AscCommon.CMemory();
		var _bOldShowMarks             = this.ShowParaMarks;
		this.ShowParaMarks             = false;

		for (var i = 0; i < pagescount; i++)
		{
			this["asc_nativePrint"](_renderer, i, options);
		}

		this.ShowParaMarks = _bOldShowMarks;

		window["native"]["Save_End"]("", _renderer.Memory.GetCurPosition());

		return _renderer.Memory.data;
	};

	// cool api (autotests)
	window["asc_docs_api"].prototype["Add_Text"]                     = function(_text)
	{
		this.WordControl.m_oLogicDocument.TextBox_Put(_text);
	};
	window["asc_docs_api"].prototype["Add_NewParagraph"]             = function()
	{
		var LogicDocument = this.WordControl.m_oLogicDocument;
		if (false === LogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Document_Content_Add))
		{
			LogicDocument.StartAction(AscDFH.historydescription_Document_EnterButton);
			LogicDocument.AddNewParagraph(true);
			LogicDocument.FinalizeAction();
		}
	};
	window["asc_docs_api"].prototype["Cursor_MoveLeft"]              = function()
	{
		this.WordControl.m_oLogicDocument.MoveCursorLeft();
	};
	window["asc_docs_api"].prototype["Cursor_MoveRight"]             = function()
	{
		this.WordControl.m_oLogicDocument.MoveCursorRight();
	};
	window["asc_docs_api"].prototype["Cursor_MoveUp"]                = function()
	{
		this.WordControl.m_oLogicDocument.MoveCursorUp();
	};
	window["asc_docs_api"].prototype["Cursor_MoveDown"]              = function()
	{
		this.WordControl.m_oLogicDocument.MoveCursorDown();
	};
	window["asc_docs_api"].prototype["Get_DocumentRecalcId"]         = function()
	{
		return this.WordControl.m_oLogicDocument.RecalcId;
	};
	window["asc_docs_api"].prototype["asc_IsSpellCheckCurrentWord"]  = function()
	{
		return this.IsSpellCheckCurrentWord;
	};
	window["asc_docs_api"].prototype["asc_putSpellCheckCurrentWord"] = function(value)
	{
		this.IsSpellCheckCurrentWord = value;
	};
	window["asc_docs_api"].prototype["asc_setParagraphStylesSizes"] = function(width, height)
	{
		if (window["AscCommonWord"] && window["AscCommonWord"].GlobalSkin)
		{
			AscCommonWord.GlobalSkin.STYLE_THUMBNAIL_WIDTH = width;
			AscCommonWord.GlobalSkin.STYLE_THUMBNAIL_HEIGHT = height;
		}
		else
		{
			AscCommon.TEMP_STYLE_THUMBNAIL_WIDTH = width;
			AscCommon.TEMP_STYLE_THUMBNAIL_HEIGHT = height;
		}
	};

	asc_docs_api.prototype.SetDrawImagePlaceContents = function(id, props)
	{
		if (this.WordControl.m_oDrawingDocument)
			this.WordControl.m_oDrawingDocument.SetDrawImagePlaceContents(id, props);
	};

    asc_docs_api.prototype.SetDrawImagePreviewMargins = function(id, props)
    {
        if (this.WordControl.m_oDrawingDocument)
            this.WordControl.m_oDrawingDocument.SetDrawImagePreviewMargins(id, props);
    };

    asc_docs_api.prototype.SetDrawImagePreviewBullet = function(id, props, level, is_multi_level)
    {
        if (this.WordControl.m_oDrawingDocument)
            this.WordControl.m_oDrawingDocument.SetDrawImagePreviewBullet(id, props, level, is_multi_level);
    };

	asc_docs_api.prototype.asc_OnHideContextMenu = function()
	{
		if (this.WordControl.MobileTouchManager)
		{
			this.WordControl.checkBodyOffset();
			this.WordControl.MobileTouchManager.showKeyboard();
		}
	};
	asc_docs_api.prototype.asc_OnShowContextMenu = function()
	{
		if (this.WordControl.MobileTouchManager)
		{
			this.WordControl.checkBodyOffset();
		}
	};

	asc_docs_api.prototype.getDefaultFontFamily = function () {
		//TODO переделать и отдавать дефолтовый шрифт
		var defaultFont = "Arial";
		return defaultFont;
	};

	asc_docs_api.prototype.getDefaultFontSize = function () {
		//TODO переделать и отдавать дефолтовый шрифт
		var defaultSize = 11;
		return defaultSize;
	};

	asc_docs_api.prototype.asc_getAppProps = function()
	{
		return this.WordControl && this.WordControl.m_oLogicDocument && this.WordControl.m_oLogicDocument.App || null;
	};

	asc_docs_api.prototype.getInternalCoreProps = function()
	{
		return this.WordControl && this.WordControl.m_oLogicDocument && this.WordControl.m_oLogicDocument.Core;
	};

	asc_docs_api.prototype.asc_setCoreProps = function(oProps)
	{
		var oCore = this.getInternalCoreProps();
		if(!oCore)
		{
			return;
		}
		var oLogicDocument = this.WordControl.m_oLogicDocument;
		if(false === oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_CorePr, null))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_SetCoreproperties);
			oCore.setProps(oProps);
			this.UpdateInterfaceState();
			oLogicDocument.FinalizeAction(true);
		}
	};
	asc_docs_api.prototype.asc_isCompatibilityMode = function()
	{
		if (null !== this.WordControl.m_oLogicDocument)
		{
			return AscCommon.document_compatibility_mode_Word15 !== this.WordControl.m_oLogicDocument.GetCompatibilityMode();
		}
		return false;
	};
	//-------------------------------------------------------------export---------------------------------------------------
	window['Asc']                                                       = window['Asc'] || {};
	CAscSection.prototype['get_PageWidth']                              = CAscSection.prototype.get_PageWidth;
	CAscSection.prototype['get_PageHeight']                             = CAscSection.prototype.get_PageHeight;
	CAscSection.prototype['get_MarginLeft']                             = CAscSection.prototype.get_MarginLeft;
	CAscSection.prototype['get_MarginRight']                            = CAscSection.prototype.get_MarginRight;
	CAscSection.prototype['get_MarginTop']                              = CAscSection.prototype.get_MarginTop;
	CAscSection.prototype['get_MarginBottom']                           = CAscSection.prototype.get_MarginBottom;
	CHeaderProp.prototype['get_Type']                                   = CHeaderProp.prototype.get_Type;
	CHeaderProp.prototype['put_Type']                                   = CHeaderProp.prototype.put_Type;
	CHeaderProp.prototype['get_Position']                               = CHeaderProp.prototype.get_Position;
	CHeaderProp.prototype['put_Position']                               = CHeaderProp.prototype.put_Position;
	CHeaderProp.prototype['get_DifferentFirst']                         = CHeaderProp.prototype.get_DifferentFirst;
	CHeaderProp.prototype['put_DifferentFirst']                         = CHeaderProp.prototype.put_DifferentFirst;
	CHeaderProp.prototype['get_DifferentEvenOdd']                       = CHeaderProp.prototype.get_DifferentEvenOdd;
	CHeaderProp.prototype['put_DifferentEvenOdd']                       = CHeaderProp.prototype.put_DifferentEvenOdd;
	CHeaderProp.prototype['get_LinkToPrevious']                         = CHeaderProp.prototype.get_LinkToPrevious;
	CHeaderProp.prototype['get_Locked']                                 = CHeaderProp.prototype.get_Locked;
	CHeaderProp.prototype['get_StartPageNumber']                        = CHeaderProp.prototype.get_StartPageNumber;
	CHeaderProp.prototype['put_StartPageNumber']                        = CHeaderProp.prototype.put_StartPageNumber;
	window['Asc']['CMailMergeSendData'] = window['Asc'].CMailMergeSendData = CMailMergeSendData;
	CMailMergeSendData.prototype['get_From']                            = CMailMergeSendData.prototype.get_From;
	CMailMergeSendData.prototype['put_From']                            = CMailMergeSendData.prototype.put_From;
	CMailMergeSendData.prototype['get_To']                              = CMailMergeSendData.prototype.get_To;
	CMailMergeSendData.prototype['put_To']                              = CMailMergeSendData.prototype.put_To;
	CMailMergeSendData.prototype['get_Subject']                         = CMailMergeSendData.prototype.get_Subject;
	CMailMergeSendData.prototype['put_Subject']                         = CMailMergeSendData.prototype.put_Subject;
	CMailMergeSendData.prototype['get_MailFormat']                      = CMailMergeSendData.prototype.get_MailFormat;
	CMailMergeSendData.prototype['put_MailFormat']                      = CMailMergeSendData.prototype.put_MailFormat;
	CMailMergeSendData.prototype['get_FileName']                        = CMailMergeSendData.prototype.get_FileName;
	CMailMergeSendData.prototype['put_FileName']                        = CMailMergeSendData.prototype.put_FileName;
	CMailMergeSendData.prototype['get_Message']                         = CMailMergeSendData.prototype.get_Message;
	CMailMergeSendData.prototype['put_Message']                         = CMailMergeSendData.prototype.put_Message;
	CMailMergeSendData.prototype['get_RecordFrom']                      = CMailMergeSendData.prototype.get_RecordFrom;
	CMailMergeSendData.prototype['put_RecordFrom']                      = CMailMergeSendData.prototype.put_RecordFrom;
	CMailMergeSendData.prototype['get_RecordTo']                        = CMailMergeSendData.prototype.get_RecordTo;
	CMailMergeSendData.prototype['put_RecordTo']                        = CMailMergeSendData.prototype.put_RecordTo;
	CMailMergeSendData.prototype['get_RecordCount']                     = CMailMergeSendData.prototype.get_RecordCount;
	CMailMergeSendData.prototype['put_RecordCount']                     = CMailMergeSendData.prototype.put_RecordCount;
	CMailMergeSendData.prototype['get_UserId']                          = CMailMergeSendData.prototype.get_UserId;
	CMailMergeSendData.prototype['put_UserId']                          = CMailMergeSendData.prototype.put_UserId;
	window['Asc']['CAscFootnotePr'] = window['Asc'].CAscFootnotePr = CAscFootnotePr;
	CAscFootnotePr.prototype['get_Pos']                                 = CAscFootnotePr.prototype.get_Pos;
	CAscFootnotePr.prototype['put_Pos']                                 = CAscFootnotePr.prototype.put_Pos;
	CAscFootnotePr.prototype['get_NumStart']                            = CAscFootnotePr.prototype.get_NumStart;
	CAscFootnotePr.prototype['put_NumStart']                            = CAscFootnotePr.prototype.put_NumStart;
	CAscFootnotePr.prototype['get_NumFormat']                           = CAscFootnotePr.prototype.get_NumFormat;
	CAscFootnotePr.prototype['put_NumFormat']                           = CAscFootnotePr.prototype.put_NumFormat;
	CAscFootnotePr.prototype['get_NumRestart']                          = CAscFootnotePr.prototype.get_NumRestart;
	CAscFootnotePr.prototype['put_NumRestart']                          = CAscFootnotePr.prototype.put_NumRestart;
	window['Asc']['asc_docs_api']                                       = asc_docs_api;
	asc_docs_api.prototype['SetCollaborativeMarksShowType']             = asc_docs_api.prototype.SetCollaborativeMarksShowType;
	asc_docs_api.prototype['GetCollaborativeMarksShowType']             = asc_docs_api.prototype.GetCollaborativeMarksShowType;
	asc_docs_api.prototype['Clear_CollaborativeMarks']                  = asc_docs_api.prototype.Clear_CollaborativeMarks;
	asc_docs_api.prototype['SetLanguage']                               = asc_docs_api.prototype.SetLanguage;
	asc_docs_api.prototype['asc_GetFontThumbnailsPath']                 = asc_docs_api.prototype.asc_GetFontThumbnailsPath;
	asc_docs_api.prototype['TranslateStyleName']                        = asc_docs_api.prototype.TranslateStyleName;
	asc_docs_api.prototype['CheckChangedDocument']                      = asc_docs_api.prototype.CheckChangedDocument;
	asc_docs_api.prototype['SetUnchangedDocument']                      = asc_docs_api.prototype.SetUnchangedDocument;
	asc_docs_api.prototype['SetDocumentModified']                       = asc_docs_api.prototype.SetDocumentModified;
	asc_docs_api.prototype['isDocumentModified']                        = asc_docs_api.prototype.isDocumentModified;
	asc_docs_api.prototype['asc_isDocumentCanSave']                     = asc_docs_api.prototype.asc_isDocumentCanSave;
	asc_docs_api.prototype['asc_getCanUndo']                            = asc_docs_api.prototype.asc_getCanUndo;
	asc_docs_api.prototype['asc_getCanRedo']                            = asc_docs_api.prototype.asc_getCanRedo;
	asc_docs_api.prototype['sync_BeginCatchSelectedElements']           = asc_docs_api.prototype.sync_BeginCatchSelectedElements;
	asc_docs_api.prototype['sync_EndCatchSelectedElements']             = asc_docs_api.prototype.sync_EndCatchSelectedElements;
	asc_docs_api.prototype['getSelectedElements']                       = asc_docs_api.prototype.getSelectedElements;
	asc_docs_api.prototype['sync_ChangeLastSelectedElement']            = asc_docs_api.prototype.sync_ChangeLastSelectedElement;
	asc_docs_api.prototype['asc_getEditorPermissions']                  = asc_docs_api.prototype.asc_getEditorPermissions;
	asc_docs_api.prototype['asc_setDocInfo']                            = asc_docs_api.prototype.asc_setDocInfo;
	asc_docs_api.prototype['asc_setLocale']                             = asc_docs_api.prototype.asc_setLocale;
	asc_docs_api.prototype['asc_getLocale']                             = asc_docs_api.prototype.asc_getLocale;
	asc_docs_api.prototype['asc_LoadDocument']                          = asc_docs_api.prototype.asc_LoadDocument;
	asc_docs_api.prototype['SetTextBoxInputMode']                       = asc_docs_api.prototype.SetTextBoxInputMode;
	asc_docs_api.prototype['GetTextBoxInputMode']                       = asc_docs_api.prototype.GetTextBoxInputMode;
	asc_docs_api.prototype['ChangeReaderMode']                          = asc_docs_api.prototype.ChangeReaderMode;
	asc_docs_api.prototype['SetReaderModeOnly']                         = asc_docs_api.prototype.SetReaderModeOnly;
	asc_docs_api.prototype['IncreaseReaderFontSize']                    = asc_docs_api.prototype.IncreaseReaderFontSize;
	asc_docs_api.prototype['DecreaseReaderFontSize']                    = asc_docs_api.prototype.DecreaseReaderFontSize;
	asc_docs_api.prototype['CreateCSS']                                 = asc_docs_api.prototype.CreateCSS;
	asc_docs_api.prototype['GetCopyPasteDivId']                         = asc_docs_api.prototype.GetCopyPasteDivId;
	asc_docs_api.prototype['ContentToHTML']                             = asc_docs_api.prototype.ContentToHTML;
	asc_docs_api.prototype['InitEditor']                                = asc_docs_api.prototype.InitEditor;
	asc_docs_api.prototype['InitViewer']                                = asc_docs_api.prototype.InitViewer;
	asc_docs_api.prototype['OpenDocument']                              = asc_docs_api.prototype.OpenDocument;
	asc_docs_api.prototype['OpenDocument2']                             = asc_docs_api.prototype.OpenDocument2;
	asc_docs_api.prototype['asc_getDocumentName']                       = asc_docs_api.prototype.asc_getDocumentName;
	asc_docs_api.prototype['asc_getAppProps']                           = asc_docs_api.prototype.asc_getAppProps;
	asc_docs_api.prototype['asc_getCoreProps']                          = asc_docs_api.prototype.asc_getCoreProps;
	asc_docs_api.prototype['asc_setCoreProps']                          = asc_docs_api.prototype.asc_setCoreProps;
	asc_docs_api.prototype['asc_isCompatibilityMode']                   = asc_docs_api.prototype.asc_isCompatibilityMode;
	asc_docs_api.prototype['asc_registerCallback']                      = asc_docs_api.prototype.asc_registerCallback;
	asc_docs_api.prototype['asc_unregisterCallback']                    = asc_docs_api.prototype.asc_unregisterCallback;
	asc_docs_api.prototype['asc_checkNeedCallback']                     = asc_docs_api.prototype.asc_checkNeedCallback;
	asc_docs_api.prototype['asc_getPropertyEditorShapes']               = asc_docs_api.prototype.asc_getPropertyEditorShapes;
	asc_docs_api.prototype['asc_getPropertyEditorTextArts']             = asc_docs_api.prototype.asc_getPropertyEditorTextArts;
	asc_docs_api.prototype['get_PropertyThemeColors']                   = asc_docs_api.prototype.get_PropertyThemeColors;
	asc_docs_api.prototype['_coAuthoringSetChange']                     = asc_docs_api.prototype._coAuthoringSetChange;
	asc_docs_api.prototype['_coAuthoringSetChanges']                    = asc_docs_api.prototype._coAuthoringSetChanges;
	asc_docs_api.prototype['asc_coAuthoringChatSendMessage']            = asc_docs_api.prototype.asc_coAuthoringChatSendMessage;
	asc_docs_api.prototype['asc_coAuthoringChatGetMessages']            = asc_docs_api.prototype.asc_coAuthoringChatGetMessages;
	asc_docs_api.prototype['asc_coAuthoringGetUsers']                   = asc_docs_api.prototype.asc_coAuthoringGetUsers;
	asc_docs_api.prototype['asc_coAuthoringDisconnect']                 = asc_docs_api.prototype.asc_coAuthoringDisconnect;
	asc_docs_api.prototype['asc_SpellCheckDisconnect']                  = asc_docs_api.prototype.asc_SpellCheckDisconnect;
	asc_docs_api.prototype['_onUpdateDocumentCanSave']                  = asc_docs_api.prototype._onUpdateDocumentCanSave;
	asc_docs_api.prototype['put_FramePr']                               = asc_docs_api.prototype.put_FramePr;
	asc_docs_api.prototype['asyncFontEndLoaded_MathDraw']               = asc_docs_api.prototype.asyncFontEndLoaded_MathDraw;
	asc_docs_api.prototype['sendMathTypesToMenu']                       = asc_docs_api.prototype.sendMathTypesToMenu;
	asc_docs_api.prototype['asyncFontEndLoaded_DropCap']                = asc_docs_api.prototype.asyncFontEndLoaded_DropCap;
	asc_docs_api.prototype['asc_addDropCap']                            = asc_docs_api.prototype.asc_addDropCap;
	asc_docs_api.prototype['removeDropcap']                             = asc_docs_api.prototype.removeDropcap;
	asc_docs_api.prototype['get_TextProps']                             = asc_docs_api.prototype.get_TextProps;
	asc_docs_api.prototype['GetJSONLogicDocument']                      = asc_docs_api.prototype.GetJSONLogicDocument;
	asc_docs_api.prototype['get_ContentCount']                          = asc_docs_api.prototype.get_ContentCount;
	asc_docs_api.prototype['select_Element']                            = asc_docs_api.prototype.select_Element;
	asc_docs_api.prototype['UpdateTextPr']                              = asc_docs_api.prototype.UpdateTextPr;
	asc_docs_api.prototype['UpdateParagraphProp']                       = asc_docs_api.prototype.UpdateParagraphProp;
	asc_docs_api.prototype['Undo']                                      = asc_docs_api.prototype.Undo;
	asc_docs_api.prototype['Redo']                                      = asc_docs_api.prototype.Redo;
	asc_docs_api.prototype['Copy']                                      = asc_docs_api.prototype.Copy;
	asc_docs_api.prototype['Update_ParaTab']                            = asc_docs_api.prototype.Update_ParaTab;
	asc_docs_api.prototype['Cut']                                       = asc_docs_api.prototype.Cut;
	asc_docs_api.prototype['Paste']                                     = asc_docs_api.prototype.Paste;
	asc_docs_api.prototype['Share']                                     = asc_docs_api.prototype.Share;
	asc_docs_api.prototype['asc_Save']                                  = asc_docs_api.prototype.asc_Save;
	asc_docs_api.prototype['forceSave']                                 = asc_docs_api.prototype.forceSave;
	asc_docs_api.prototype['asc_setIsForceSaveOnUserSave']              = asc_docs_api.prototype.asc_setIsForceSaveOnUserSave;
	asc_docs_api.prototype['asc_DownloadAs']                            = asc_docs_api.prototype.asc_DownloadAs;
	asc_docs_api.prototype['asc_DownloadAsMailMerge']                   = asc_docs_api.prototype.asc_DownloadAsMailMerge;
	asc_docs_api.prototype['asc_DownloadOrigin']                        = asc_docs_api.prototype.asc_DownloadOrigin;
	asc_docs_api.prototype['Resize']                                    = asc_docs_api.prototype.Resize;
	asc_docs_api.prototype['AddURL']                                    = asc_docs_api.prototype.AddURL;
	asc_docs_api.prototype['Help']                                      = asc_docs_api.prototype.Help;
	asc_docs_api.prototype['asc_setAdvancedOptions']                    = asc_docs_api.prototype.asc_setAdvancedOptions;
	asc_docs_api.prototype['asc_decodeBuffer']                    		= asc_docs_api.prototype.asc_decodeBuffer;
	asc_docs_api.prototype['SetFontRenderingMode']                      = asc_docs_api.prototype.SetFontRenderingMode;
	asc_docs_api.prototype['startGetDocInfo']                           = asc_docs_api.prototype.startGetDocInfo;
	asc_docs_api.prototype['stopGetDocInfo']                            = asc_docs_api.prototype.stopGetDocInfo;
	asc_docs_api.prototype['sync_DocInfoCallback']                      = asc_docs_api.prototype.sync_DocInfoCallback;
	asc_docs_api.prototype['sync_GetDocInfoStartCallback']              = asc_docs_api.prototype.sync_GetDocInfoStartCallback;
	asc_docs_api.prototype['sync_GetDocInfoStopCallback']               = asc_docs_api.prototype.sync_GetDocInfoStopCallback;
	asc_docs_api.prototype['sync_GetDocInfoEndCallback']                = asc_docs_api.prototype.sync_GetDocInfoEndCallback;
	asc_docs_api.prototype['sync_CanUndoCallback']                      = asc_docs_api.prototype.sync_CanUndoCallback;
	asc_docs_api.prototype['sync_CanRedoCallback']                      = asc_docs_api.prototype.sync_CanRedoCallback;
	asc_docs_api.prototype['can_CopyCut']                               = asc_docs_api.prototype.can_CopyCut;
	asc_docs_api.prototype['sync_CanCopyCutCallback']                   = asc_docs_api.prototype.sync_CanCopyCutCallback;
	asc_docs_api.prototype['setStartPointHistory']                      = asc_docs_api.prototype.setStartPointHistory;
	asc_docs_api.prototype['setEndPointHistory']                        = asc_docs_api.prototype.setEndPointHistory;
	asc_docs_api.prototype['sync_CursorLockCallBack']                   = asc_docs_api.prototype.sync_CursorLockCallBack;
	asc_docs_api.prototype['sync_UndoCallBack']                         = asc_docs_api.prototype.sync_UndoCallBack;
	asc_docs_api.prototype['sync_RedoCallBack']                         = asc_docs_api.prototype.sync_RedoCallBack;
	asc_docs_api.prototype['sync_CopyCallBack']                         = asc_docs_api.prototype.sync_CopyCallBack;
	asc_docs_api.prototype['sync_CutCallBack']                          = asc_docs_api.prototype.sync_CutCallBack;
	asc_docs_api.prototype['sync_PasteCallBack']                        = asc_docs_api.prototype.sync_PasteCallBack;
	asc_docs_api.prototype['sync_ShareCallBack']                        = asc_docs_api.prototype.sync_ShareCallBack;
	asc_docs_api.prototype['sync_SaveCallBack']                         = asc_docs_api.prototype.sync_SaveCallBack;
	asc_docs_api.prototype['sync_DownloadAsCallBack']                   = asc_docs_api.prototype.sync_DownloadAsCallBack;
	asc_docs_api.prototype['sync_StartAction']                          = asc_docs_api.prototype.sync_StartAction;
	asc_docs_api.prototype['sync_EndAction']                            = asc_docs_api.prototype.sync_EndAction;
	asc_docs_api.prototype['sync_AddURLCallback']                       = asc_docs_api.prototype.sync_AddURLCallback;
	asc_docs_api.prototype['sync_ErrorCallback']                        = asc_docs_api.prototype.sync_ErrorCallback;
	asc_docs_api.prototype['sync_HelpCallback']                         = asc_docs_api.prototype.sync_HelpCallback;
	asc_docs_api.prototype['sync_UpdateZoom']                           = asc_docs_api.prototype.sync_UpdateZoom;
	asc_docs_api.prototype['ClearPropObjCallback']                      = asc_docs_api.prototype.ClearPropObjCallback;
	asc_docs_api.prototype['CollectHeaders']                            = asc_docs_api.prototype.CollectHeaders;
	asc_docs_api.prototype['GetActiveHeader']                           = asc_docs_api.prototype.GetActiveHeader;
	asc_docs_api.prototype['gotoHeader']                                = asc_docs_api.prototype.gotoHeader;
	asc_docs_api.prototype['sync_ChangeActiveHeaderCallback']           = asc_docs_api.prototype.sync_ChangeActiveHeaderCallback;
	asc_docs_api.prototype['sync_ReturnHeadersCallback']                = asc_docs_api.prototype.sync_ReturnHeadersCallback;
	asc_docs_api.prototype['asc_searchEnabled']                         = asc_docs_api.prototype.asc_searchEnabled;
	asc_docs_api.prototype['asc_findText']                              = asc_docs_api.prototype.asc_findText;
	asc_docs_api.prototype['asc_replaceText']                           = asc_docs_api.prototype.asc_replaceText;
	asc_docs_api.prototype['asc_isSelectSearchingResults']              = asc_docs_api.prototype.asc_isSelectSearchingResults;
	asc_docs_api.prototype['sync_ReplaceAllCallback']                   = asc_docs_api.prototype.sync_ReplaceAllCallback;
	asc_docs_api.prototype['sync_SearchEndCallback']                    = asc_docs_api.prototype.sync_SearchEndCallback;
	asc_docs_api.prototype['put_TextPrFontName']                        = asc_docs_api.prototype.put_TextPrFontName;
	asc_docs_api.prototype['put_TextPrFontSize']                        = asc_docs_api.prototype.put_TextPrFontSize;
	asc_docs_api.prototype['put_TextPrBold']                            = asc_docs_api.prototype.put_TextPrBold;
	asc_docs_api.prototype['put_TextPrItalic']                          = asc_docs_api.prototype.put_TextPrItalic;
	asc_docs_api.prototype['put_TextPrUnderline']                       = asc_docs_api.prototype.put_TextPrUnderline;
	asc_docs_api.prototype['put_TextPrStrikeout']                       = asc_docs_api.prototype.put_TextPrStrikeout;
	asc_docs_api.prototype['put_TextPrDStrikeout']                      = asc_docs_api.prototype.put_TextPrDStrikeout;
	asc_docs_api.prototype['put_TextPrSpacing']                         = asc_docs_api.prototype.put_TextPrSpacing;
	asc_docs_api.prototype['put_TextPrCaps']                            = asc_docs_api.prototype.put_TextPrCaps;
	asc_docs_api.prototype['put_TextPrSmallCaps']                       = asc_docs_api.prototype.put_TextPrSmallCaps;
	asc_docs_api.prototype['put_TextPrPosition']                        = asc_docs_api.prototype.put_TextPrPosition;
	asc_docs_api.prototype['put_TextPrLang']                            = asc_docs_api.prototype.put_TextPrLang;
	asc_docs_api.prototype['put_PrLineSpacing']                         = asc_docs_api.prototype.put_PrLineSpacing;
	asc_docs_api.prototype['put_LineSpacingBeforeAfter']                = asc_docs_api.prototype.put_LineSpacingBeforeAfter;
	asc_docs_api.prototype['FontSizeIn']                                = asc_docs_api.prototype.FontSizeIn;
	asc_docs_api.prototype['FontSizeOut']                               = asc_docs_api.prototype.FontSizeOut;
	asc_docs_api.prototype['put_Borders']                               = asc_docs_api.prototype.put_Borders;
	asc_docs_api.prototype['sync_BoldCallBack']                         = asc_docs_api.prototype.sync_BoldCallBack;
	asc_docs_api.prototype['sync_ItalicCallBack']                       = asc_docs_api.prototype.sync_ItalicCallBack;
	asc_docs_api.prototype['sync_UnderlineCallBack']                    = asc_docs_api.prototype.sync_UnderlineCallBack;
	asc_docs_api.prototype['sync_StrikeoutCallBack']                    = asc_docs_api.prototype.sync_StrikeoutCallBack;
	asc_docs_api.prototype['sync_TextPrFontFamilyCallBack']             = asc_docs_api.prototype.sync_TextPrFontFamilyCallBack;
	asc_docs_api.prototype['sync_TextPrFontSizeCallBack']               = asc_docs_api.prototype.sync_TextPrFontSizeCallBack;
	asc_docs_api.prototype['sync_PrLineSpacingCallBack']                = asc_docs_api.prototype.sync_PrLineSpacingCallBack;
	asc_docs_api.prototype['paraApply']                                 = asc_docs_api.prototype.paraApply;
	asc_docs_api.prototype['put_PrAlign']                               = asc_docs_api.prototype.put_PrAlign;
	asc_docs_api.prototype['put_TextPrBaseline']                        = asc_docs_api.prototype.put_TextPrBaseline;
	asc_docs_api.prototype['put_ListType']                              = asc_docs_api.prototype.put_ListType;
	asc_docs_api.prototype['asc_ContinueNumbering']                     = asc_docs_api.prototype.asc_ContinueNumbering;
	asc_docs_api.prototype['asc_RestartNumbering']                      = asc_docs_api.prototype.asc_RestartNumbering;
	asc_docs_api.prototype['asc_GetCurrentNumberingId']                 = asc_docs_api.prototype.asc_GetCurrentNumberingId;
	asc_docs_api.prototype['asc_GetCurrentNumberingLvl']                = asc_docs_api.prototype.asc_GetCurrentNumberingLvl;
	asc_docs_api.prototype['asc_GetCalculatedNumberingValue']           = asc_docs_api.prototype.asc_GetCalculatedNumberingValue;
	asc_docs_api.prototype['asc_GetNumberingPr']                        = asc_docs_api.prototype.asc_GetNumberingPr;
	asc_docs_api.prototype['asc_AddNewNumbering']                       = asc_docs_api.prototype.asc_AddNewNumbering;
	asc_docs_api.prototype['asc_ChangeNumberingLvl']                    = asc_docs_api.prototype.asc_ChangeNumberingLvl;
	asc_docs_api.prototype['put_Style']                                 = asc_docs_api.prototype.put_Style;
	asc_docs_api.prototype['SetDeviceInputHelperId']                    = asc_docs_api.prototype.SetDeviceInputHelperId;
	asc_docs_api.prototype['put_ShowSnapLines']                         = asc_docs_api.prototype.put_ShowSnapLines;
	asc_docs_api.prototype['get_ShowSnapLines']                         = asc_docs_api.prototype.get_ShowSnapLines;
	asc_docs_api.prototype['put_ShowParaMarks']                         = asc_docs_api.prototype.put_ShowParaMarks;
	asc_docs_api.prototype['get_ShowParaMarks']                         = asc_docs_api.prototype.get_ShowParaMarks;
	asc_docs_api.prototype['put_ShowTableEmptyLine']                    = asc_docs_api.prototype.put_ShowTableEmptyLine;
	asc_docs_api.prototype['get_ShowTableEmptyLine']                    = asc_docs_api.prototype.get_ShowTableEmptyLine;
	asc_docs_api.prototype['put_PageBreak']                             = asc_docs_api.prototype.put_PageBreak;
	asc_docs_api.prototype['put_WidowControl']                          = asc_docs_api.prototype.put_WidowControl;
	asc_docs_api.prototype['put_KeepLines']                             = asc_docs_api.prototype.put_KeepLines;
	asc_docs_api.prototype['put_KeepNext']                              = asc_docs_api.prototype.put_KeepNext;
	asc_docs_api.prototype['put_AddSpaceBetweenPrg']                    = asc_docs_api.prototype.put_AddSpaceBetweenPrg;
	asc_docs_api.prototype['put_LineHighLight']                         = asc_docs_api.prototype.put_LineHighLight;
	asc_docs_api.prototype['put_TextColor']                             = asc_docs_api.prototype.put_TextColor;
	asc_docs_api.prototype['put_ParagraphShade']                        = asc_docs_api.prototype.put_ParagraphShade;
	asc_docs_api.prototype['put_PrIndent']                              = asc_docs_api.prototype.put_PrIndent;
	asc_docs_api.prototype['put_ParagraphOutlineLvl']                   = asc_docs_api.prototype.put_ParagraphOutlineLvl;
	asc_docs_api.prototype['IncreaseIndent']                            = asc_docs_api.prototype.IncreaseIndent;
	asc_docs_api.prototype['DecreaseIndent']                            = asc_docs_api.prototype.DecreaseIndent;
	asc_docs_api.prototype['put_PrIndentRight']                         = asc_docs_api.prototype.put_PrIndentRight;
	asc_docs_api.prototype['put_PrFirstLineIndent']                     = asc_docs_api.prototype.put_PrFirstLineIndent;
	asc_docs_api.prototype['put_Margins']                               = asc_docs_api.prototype.put_Margins;
	asc_docs_api.prototype['getFocusObject']                            = asc_docs_api.prototype.getFocusObject;
	asc_docs_api.prototype['sync_VerticalAlign']                        = asc_docs_api.prototype.sync_VerticalAlign;
	asc_docs_api.prototype['sync_PrAlignCallBack']                      = asc_docs_api.prototype.sync_PrAlignCallBack;
	asc_docs_api.prototype['sync_ListType']                             = asc_docs_api.prototype.sync_ListType;
	asc_docs_api.prototype['sync_TextColor']                            = asc_docs_api.prototype.sync_TextColor;
	asc_docs_api.prototype['sync_TextHighLight']                        = asc_docs_api.prototype.sync_TextHighLight;
	asc_docs_api.prototype['sync_TextSpacing']                          = asc_docs_api.prototype.sync_TextSpacing;
	asc_docs_api.prototype['sync_TextDStrikeout']                       = asc_docs_api.prototype.sync_TextDStrikeout;
	asc_docs_api.prototype['sync_TextCaps']                             = asc_docs_api.prototype.sync_TextCaps;
	asc_docs_api.prototype['sync_TextSmallCaps']                        = asc_docs_api.prototype.sync_TextSmallCaps;
	asc_docs_api.prototype['sync_TextPosition']                         = asc_docs_api.prototype.sync_TextPosition;
	asc_docs_api.prototype['sync_TextLangCallBack']                     = asc_docs_api.prototype.sync_TextLangCallBack;
	asc_docs_api.prototype['sync_ParaStyleName']                        = asc_docs_api.prototype.sync_ParaStyleName;
	asc_docs_api.prototype['sync_ParaSpacingLine']                      = asc_docs_api.prototype.sync_ParaSpacingLine;
	asc_docs_api.prototype['sync_PageBreakCallback']                    = asc_docs_api.prototype.sync_PageBreakCallback;
	asc_docs_api.prototype['sync_WidowControlCallback']                 = asc_docs_api.prototype.sync_WidowControlCallback;
	asc_docs_api.prototype['sync_KeepNextCallback']                     = asc_docs_api.prototype.sync_KeepNextCallback;
	asc_docs_api.prototype['sync_KeepLinesCallback']                    = asc_docs_api.prototype.sync_KeepLinesCallback;
	asc_docs_api.prototype['sync_ShowParaMarksCallback']                = asc_docs_api.prototype.sync_ShowParaMarksCallback;
	asc_docs_api.prototype['sync_SpaceBetweenPrgCallback']              = asc_docs_api.prototype.sync_SpaceBetweenPrgCallback;
	asc_docs_api.prototype['sync_PrPropCallback']                       = asc_docs_api.prototype.sync_PrPropCallback;
	asc_docs_api.prototype['sync_MathPropCallback']                     = asc_docs_api.prototype.sync_MathPropCallback;
	asc_docs_api.prototype['sync_EndAddShape']                          = asc_docs_api.prototype.sync_EndAddShape;
	asc_docs_api.prototype['SetDrawingFreeze']                          = asc_docs_api.prototype.SetDrawingFreeze;
	asc_docs_api.prototype['change_PageOrient']                         = asc_docs_api.prototype.change_PageOrient;
	asc_docs_api.prototype['get_DocumentOrientation']                   = asc_docs_api.prototype.get_DocumentOrientation;
	asc_docs_api.prototype['change_DocSize']                            = asc_docs_api.prototype.change_DocSize;
	asc_docs_api.prototype['get_DocumentWidth']                         = asc_docs_api.prototype.get_DocumentWidth;
	asc_docs_api.prototype['get_DocumentHeight']                        = asc_docs_api.prototype.get_DocumentHeight;
	asc_docs_api.prototype['put_AddPageBreak']                          = asc_docs_api.prototype.put_AddPageBreak;
	asc_docs_api.prototype['put_AddColumnBreak']                        = asc_docs_api.prototype.put_AddColumnBreak;
	asc_docs_api.prototype['Update_ParaInd']                            = asc_docs_api.prototype.Update_ParaInd;
	asc_docs_api.prototype['Internal_Update_Ind_FirstLine']             = asc_docs_api.prototype.Internal_Update_Ind_FirstLine;
	asc_docs_api.prototype['Internal_Update_Ind_Left']                  = asc_docs_api.prototype.Internal_Update_Ind_Left;
	asc_docs_api.prototype['Internal_Update_Ind_Right']                 = asc_docs_api.prototype.Internal_Update_Ind_Right;
	asc_docs_api.prototype['put_PageNum']                               = asc_docs_api.prototype.put_PageNum;
	asc_docs_api.prototype['put_HeadersAndFootersDistance']             = asc_docs_api.prototype.put_HeadersAndFootersDistance;
	asc_docs_api.prototype['HeadersAndFooters_DifferentFirstPage']      = asc_docs_api.prototype.HeadersAndFooters_DifferentFirstPage;
	asc_docs_api.prototype['HeadersAndFooters_DifferentOddandEvenPage'] = asc_docs_api.prototype.HeadersAndFooters_DifferentOddandEvenPage;
	asc_docs_api.prototype['HeadersAndFooters_LinkToPrevious']          = asc_docs_api.prototype.HeadersAndFooters_LinkToPrevious;
	asc_docs_api.prototype['asc_SetSectionStartPage']                   = asc_docs_api.prototype.asc_SetSectionStartPage;
	asc_docs_api.prototype['sync_DocSizeCallback']                      = asc_docs_api.prototype.sync_DocSizeCallback;
	asc_docs_api.prototype['sync_PageOrientCallback']                   = asc_docs_api.prototype.sync_PageOrientCallback;
	asc_docs_api.prototype['sync_HeadersAndFootersPropCallback']        = asc_docs_api.prototype.sync_HeadersAndFootersPropCallback;
	asc_docs_api.prototype['put_Table']                                 = asc_docs_api.prototype.put_Table;
	asc_docs_api.prototype['addRowAbove']                               = asc_docs_api.prototype.addRowAbove;
	asc_docs_api.prototype['addRowBelow']                               = asc_docs_api.prototype.addRowBelow;
	asc_docs_api.prototype['addColumnLeft']                             = asc_docs_api.prototype.addColumnLeft;
	asc_docs_api.prototype['addColumnRight']                            = asc_docs_api.prototype.addColumnRight;
	asc_docs_api.prototype['remRow']                                    = asc_docs_api.prototype.remRow;
	asc_docs_api.prototype['remColumn']                                 = asc_docs_api.prototype.remColumn;
	asc_docs_api.prototype['remTable']                                  = asc_docs_api.prototype.remTable;
	asc_docs_api.prototype['selectRow']                                 = asc_docs_api.prototype.selectRow;
	asc_docs_api.prototype['selectColumn']                              = asc_docs_api.prototype.selectColumn;
	asc_docs_api.prototype['selectCell']                                = asc_docs_api.prototype.selectCell;
	asc_docs_api.prototype['selectTable']                               = asc_docs_api.prototype.selectTable;
	asc_docs_api.prototype['setColumnWidth']                            = asc_docs_api.prototype.setColumnWidth;
	asc_docs_api.prototype['setRowHeight']                              = asc_docs_api.prototype.setRowHeight;
	asc_docs_api.prototype['set_TblDistanceFromText']                   = asc_docs_api.prototype.set_TblDistanceFromText;
	asc_docs_api.prototype['CheckBeforeMergeCells']                     = asc_docs_api.prototype.CheckBeforeMergeCells;
	asc_docs_api.prototype['CheckBeforeSplitCells']                     = asc_docs_api.prototype.CheckBeforeSplitCells;
	asc_docs_api.prototype['MergeCells']                                = asc_docs_api.prototype.MergeCells;
	asc_docs_api.prototype['SplitCell']                                 = asc_docs_api.prototype.SplitCell;
	asc_docs_api.prototype['asc_DistributeTableCells']                  = asc_docs_api.prototype.asc_DistributeTableCells;
	asc_docs_api.prototype['asc_RemoveTableCells']                      = asc_docs_api.prototype.asc_RemoveTableCells;
	asc_docs_api.prototype['widthTable']                                = asc_docs_api.prototype.widthTable;
	asc_docs_api.prototype['put_CellsMargin']                           = asc_docs_api.prototype.put_CellsMargin;
	asc_docs_api.prototype['set_TblWrap']                               = asc_docs_api.prototype.set_TblWrap;
	asc_docs_api.prototype['set_TblIndentLeft']                         = asc_docs_api.prototype.set_TblIndentLeft;
	asc_docs_api.prototype['set_Borders']                               = asc_docs_api.prototype.set_Borders;
	asc_docs_api.prototype['set_TableBackground']                       = asc_docs_api.prototype.set_TableBackground;
	asc_docs_api.prototype['set_AlignCell']                             = asc_docs_api.prototype.set_AlignCell;
	asc_docs_api.prototype['set_TblAlign']                              = asc_docs_api.prototype.set_TblAlign;
	asc_docs_api.prototype['set_SpacingBetweenCells']                   = asc_docs_api.prototype.set_SpacingBetweenCells;
	asc_docs_api.prototype['tblApply']                                  = asc_docs_api.prototype.tblApply;
	asc_docs_api.prototype['sync_AddTableCallback']                     = asc_docs_api.prototype.sync_AddTableCallback;
	asc_docs_api.prototype['sync_AlignCellCallback']                    = asc_docs_api.prototype.sync_AlignCellCallback;
	asc_docs_api.prototype['sync_TblPropCallback']                      = asc_docs_api.prototype.sync_TblPropCallback;
	asc_docs_api.prototype['sync_TblWrapStyleChangedCallback']          = asc_docs_api.prototype.sync_TblWrapStyleChangedCallback;
	asc_docs_api.prototype['sync_TblAlignChangedCallback']              = asc_docs_api.prototype.sync_TblAlignChangedCallback;
	asc_docs_api.prototype['ChangeImageFromFile']                       = asc_docs_api.prototype.ChangeImageFromFile;
	asc_docs_api.prototype['ChangeShapeImageFromFile']                  = asc_docs_api.prototype.ChangeShapeImageFromFile;
	asc_docs_api.prototype['AddImage']                                  = asc_docs_api.prototype.AddImage;
	asc_docs_api.prototype['asc_addImage']                              = asc_docs_api.prototype.asc_addImage;
	asc_docs_api.prototype['AddImageUrl2']                              = asc_docs_api.prototype.AddImageUrl2;
	asc_docs_api.prototype['AddImageUrl']                               = asc_docs_api.prototype.AddImageUrl;
	asc_docs_api.prototype['AddImageUrlAction']                         = asc_docs_api.prototype.AddImageUrlAction;
	asc_docs_api.prototype['AddImageToPage']                            = asc_docs_api.prototype.AddImageToPage;
	asc_docs_api.prototype['asc_getSelectedDrawingObjectsCount']        = asc_docs_api.prototype.asc_getSelectedDrawingObjectsCount;
	asc_docs_api.prototype['put_ShapesAlign']                           = asc_docs_api.prototype.put_ShapesAlign;
	asc_docs_api.prototype['DistributeHorizontally']                    = asc_docs_api.prototype.DistributeHorizontally;
	asc_docs_api.prototype['DistributeVertically']                      = asc_docs_api.prototype.DistributeVertically;
	asc_docs_api.prototype['ImgApply']                                  = asc_docs_api.prototype.ImgApply;
	asc_docs_api.prototype['set_Size']                                  = asc_docs_api.prototype.set_Size;
	asc_docs_api.prototype['set_ConstProportions']                      = asc_docs_api.prototype.set_ConstProportions;
	asc_docs_api.prototype['set_WrapStyle']                             = asc_docs_api.prototype.set_WrapStyle;
	asc_docs_api.prototype['deleteImage']                               = asc_docs_api.prototype.deleteImage;
	asc_docs_api.prototype['set_ImgDistanceFromText']                   = asc_docs_api.prototype.set_ImgDistanceFromText;
	asc_docs_api.prototype['set_PositionOnPage']                        = asc_docs_api.prototype.set_PositionOnPage;
	asc_docs_api.prototype['get_OriginalSizeImage']                     = asc_docs_api.prototype.get_OriginalSizeImage;
	asc_docs_api.prototype['ShapeApply']                                = asc_docs_api.prototype.ShapeApply;
	asc_docs_api.prototype['sync_AddImageCallback']                     = asc_docs_api.prototype.sync_AddImageCallback;
	asc_docs_api.prototype['sync_ImgPropCallback']                      = asc_docs_api.prototype.sync_ImgPropCallback;
	asc_docs_api.prototype['sync_ImgWrapStyleChangedCallback']          = asc_docs_api.prototype.sync_ImgWrapStyleChangedCallback;
	asc_docs_api.prototype['sync_ContextMenuCallback']                  = asc_docs_api.prototype.sync_ContextMenuCallback;
	asc_docs_api.prototype['sync_MouseMoveStartCallback']               = asc_docs_api.prototype.sync_MouseMoveStartCallback;
	asc_docs_api.prototype['sync_MouseMoveEndCallback']                 = asc_docs_api.prototype.sync_MouseMoveEndCallback;
	asc_docs_api.prototype['sync_MouseMoveCallback']                    = asc_docs_api.prototype.sync_MouseMoveCallback;
	asc_docs_api.prototype['can_AddHyperlink']                          = asc_docs_api.prototype.can_AddHyperlink;
	asc_docs_api.prototype['add_Hyperlink']                             = asc_docs_api.prototype.add_Hyperlink;
	asc_docs_api.prototype['change_Hyperlink']                          = asc_docs_api.prototype.change_Hyperlink;
	asc_docs_api.prototype['remove_Hyperlink']                          = asc_docs_api.prototype.remove_Hyperlink;
	asc_docs_api.prototype['asc_GetHyperlinkAnchors']                   = asc_docs_api.prototype.asc_GetHyperlinkAnchors;
	asc_docs_api.prototype['sync_HyperlinkPropCallback']                = asc_docs_api.prototype.sync_HyperlinkPropCallback;
	asc_docs_api.prototype['sync_HyperlinkClickCallback']               = asc_docs_api.prototype.sync_HyperlinkClickCallback;
	asc_docs_api.prototype['sync_CanAddHyperlinkCallback']              = asc_docs_api.prototype.sync_CanAddHyperlinkCallback;
	asc_docs_api.prototype['sync_DialogAddHyperlink']                   = asc_docs_api.prototype.sync_DialogAddHyperlink;
	asc_docs_api.prototype['sync_DialogAddHyperlink']                   = asc_docs_api.prototype.sync_DialogAddHyperlink;
	asc_docs_api.prototype['sync_SpellCheckCallback']                   = asc_docs_api.prototype.sync_SpellCheckCallback;
	asc_docs_api.prototype['sync_SpellCheckVariantsFound']              = asc_docs_api.prototype.sync_SpellCheckVariantsFound;
	asc_docs_api.prototype['asc_replaceMisspelledWord']                 = asc_docs_api.prototype.asc_replaceMisspelledWord;
	asc_docs_api.prototype['asc_ignoreMisspelledWord']                  = asc_docs_api.prototype.asc_ignoreMisspelledWord;
    asc_docs_api.prototype['asc_spellCheckAddToDictionary']       		= asc_docs_api.prototype.asc_spellCheckAddToDictionary;
    asc_docs_api.prototype['asc_spellCheckClearDictionary']       		= asc_docs_api.prototype.asc_spellCheckClearDictionary;
	asc_docs_api.prototype['asc_setDefaultLanguage']                    = asc_docs_api.prototype.asc_setDefaultLanguage;
	asc_docs_api.prototype['asc_getDefaultLanguage']                    = asc_docs_api.prototype.asc_getDefaultLanguage;
	asc_docs_api.prototype['asc_getKeyboardLanguage']                   = asc_docs_api.prototype.asc_getKeyboardLanguage;
	asc_docs_api.prototype['asc_setSpellCheck']                         = asc_docs_api.prototype.asc_setSpellCheck;
	asc_docs_api.prototype['asc_showComments']                          = asc_docs_api.prototype.asc_showComments;
	asc_docs_api.prototype['asc_hideComments']                          = asc_docs_api.prototype.asc_hideComments;
	asc_docs_api.prototype['asc_addComment']                            = asc_docs_api.prototype.asc_addComment;
	asc_docs_api.prototype['asc_removeComment']                         = asc_docs_api.prototype.asc_removeComment;
	asc_docs_api.prototype['asc_changeComment']                         = asc_docs_api.prototype.asc_changeComment;
	asc_docs_api.prototype['asc_selectComment']                         = asc_docs_api.prototype.asc_selectComment;
	asc_docs_api.prototype['asc_showComment']                           = asc_docs_api.prototype.asc_showComment;
	asc_docs_api.prototype['asc_GetCommentsReportByAuthors']            = asc_docs_api.prototype.asc_GetCommentsReportByAuthors;
	asc_docs_api.prototype['can_AddQuotedComment']                      = asc_docs_api.prototype.can_AddQuotedComment;
	asc_docs_api.prototype['sync_RemoveComment']                        = asc_docs_api.prototype.sync_RemoveComment;
	asc_docs_api.prototype['sync_AddComment']                           = asc_docs_api.prototype.sync_AddComment;
	asc_docs_api.prototype['sync_ShowComment']                          = asc_docs_api.prototype.sync_ShowComment;
	asc_docs_api.prototype['sync_HideComment']                          = asc_docs_api.prototype.sync_HideComment;
	asc_docs_api.prototype['sync_UpdateCommentPosition']                = asc_docs_api.prototype.sync_UpdateCommentPosition;
	asc_docs_api.prototype['sync_ChangeCommentData']                    = asc_docs_api.prototype.sync_ChangeCommentData;
	asc_docs_api.prototype['sync_LockComment']                          = asc_docs_api.prototype.sync_LockComment;
	asc_docs_api.prototype['sync_UnLockComment']                        = asc_docs_api.prototype.sync_UnLockComment;
	asc_docs_api.prototype['asc_RemoveAllComments']                     = asc_docs_api.prototype.asc_RemoveAllComments;
	asc_docs_api.prototype['sync_LockHeaderFooters']                    = asc_docs_api.prototype.sync_LockHeaderFooters;
	asc_docs_api.prototype['sync_LockDocumentProps']                    = asc_docs_api.prototype.sync_LockDocumentProps;
	asc_docs_api.prototype['sync_UnLockHeaderFooters']                  = asc_docs_api.prototype.sync_UnLockHeaderFooters;
	asc_docs_api.prototype['sync_UnLockDocumentProps']                  = asc_docs_api.prototype.sync_UnLockDocumentProps;
	asc_docs_api.prototype['sync_CollaborativeChanges']                 = asc_docs_api.prototype.sync_CollaborativeChanges;
	asc_docs_api.prototype['sync_LockDocumentSchema']                   = asc_docs_api.prototype.sync_LockDocumentSchema;
	asc_docs_api.prototype['sync_UnLockDocumentSchema']                 = asc_docs_api.prototype.sync_UnLockDocumentSchema;
	asc_docs_api.prototype['zoomIn']                                    = asc_docs_api.prototype.zoomIn;
	asc_docs_api.prototype['zoomOut']                                   = asc_docs_api.prototype.zoomOut;
	asc_docs_api.prototype['zoomFitToPage']                             = asc_docs_api.prototype.zoomFitToPage;
	asc_docs_api.prototype['zoomFitToWidth']                            = asc_docs_api.prototype.zoomFitToWidth;
	asc_docs_api.prototype['zoomCustomMode']                            = asc_docs_api.prototype.zoomCustomMode;
	asc_docs_api.prototype['zoom100']                                   = asc_docs_api.prototype.zoom100;
	asc_docs_api.prototype['zoom']                                      = asc_docs_api.prototype.zoom;
	asc_docs_api.prototype['goToPage']                                  = asc_docs_api.prototype.goToPage;
	asc_docs_api.prototype['getCountPages']                             = asc_docs_api.prototype.getCountPages;
	asc_docs_api.prototype['getCurrentPage']                            = asc_docs_api.prototype.getCurrentPage;
	asc_docs_api.prototype['sync_countPagesCallback']                   = asc_docs_api.prototype.sync_countPagesCallback;
	asc_docs_api.prototype['sync_currentPageCallback']                  = asc_docs_api.prototype.sync_currentPageCallback;
	asc_docs_api.prototype['asc_enableKeyEvents']                       = asc_docs_api.prototype.asc_enableKeyEvents;
	asc_docs_api.prototype['GenerateStyles']                            = asc_docs_api.prototype.GenerateStyles;
	asc_docs_api.prototype['asyncFontsDocumentEndLoaded']               = asc_docs_api.prototype.asyncFontsDocumentEndLoaded;
	asc_docs_api.prototype['CreateFontsCharMap']                        = asc_docs_api.prototype.CreateFontsCharMap;
	asc_docs_api.prototype['sync_SendThemeColors']                      = asc_docs_api.prototype.sync_SendThemeColors;
	asc_docs_api.prototype['ChangeColorScheme']                         = asc_docs_api.prototype.ChangeColorScheme;
	asc_docs_api.prototype['asc_ChangeColorSchemeByIdx']                = asc_docs_api.prototype.asc_ChangeColorSchemeByIdx;
	asc_docs_api.prototype['UpdateInterfaceState']                      = asc_docs_api.prototype.UpdateInterfaceState;
	asc_docs_api.prototype['asyncFontEndLoaded']                        = asc_docs_api.prototype.asyncFontEndLoaded;
	asc_docs_api.prototype['asyncImageEndLoaded']                       = asc_docs_api.prototype.asyncImageEndLoaded;
	asc_docs_api.prototype['asyncImageEndLoadedBackground']             = asc_docs_api.prototype.asyncImageEndLoadedBackground;
	asc_docs_api.prototype['IsAsyncOpenDocumentImages']                 = asc_docs_api.prototype.IsAsyncOpenDocumentImages;
	asc_docs_api.prototype['pre_Paste']                                 = asc_docs_api.prototype.pre_Paste;
	asc_docs_api.prototype['pre_Save']                                  = asc_docs_api.prototype.pre_Save;
	asc_docs_api.prototype['SyncLoadImages']                            = asc_docs_api.prototype.SyncLoadImages;
	asc_docs_api.prototype['SyncLoadImages_callback']                   = asc_docs_api.prototype.SyncLoadImages_callback;
	asc_docs_api.prototype['initEvents2MobileAdvances']                 = asc_docs_api.prototype.initEvents2MobileAdvances;
	asc_docs_api.prototype['ViewScrollToX']                             = asc_docs_api.prototype.ViewScrollToX;
	asc_docs_api.prototype['ViewScrollToY']                             = asc_docs_api.prototype.ViewScrollToY;
	asc_docs_api.prototype['GetDocWidthPx']                             = asc_docs_api.prototype.GetDocWidthPx;
	asc_docs_api.prototype['GetDocHeightPx']                            = asc_docs_api.prototype.GetDocHeightPx;
	asc_docs_api.prototype['ClearSearch']                               = asc_docs_api.prototype.ClearSearch;
	asc_docs_api.prototype['GetCurrentVisiblePage']                     = asc_docs_api.prototype.GetCurrentVisiblePage;
	asc_docs_api.prototype['asc_setAutoSaveGap']                        = asc_docs_api.prototype.asc_setAutoSaveGap;
	asc_docs_api.prototype['asc_SetDocumentPlaceChangedEnabled']        = asc_docs_api.prototype.asc_SetDocumentPlaceChangedEnabled;
	asc_docs_api.prototype['asc_SetViewRulers']                         = asc_docs_api.prototype.asc_SetViewRulers;
	asc_docs_api.prototype['asc_SetViewRulersChange']                   = asc_docs_api.prototype.asc_SetViewRulersChange;
	asc_docs_api.prototype['asc_GetViewRulers']                         = asc_docs_api.prototype.asc_GetViewRulers;
	asc_docs_api.prototype['asc_SetDocumentUnits']                      = asc_docs_api.prototype.asc_SetDocumentUnits;
	asc_docs_api.prototype['GoToHeader']                                = asc_docs_api.prototype.GoToHeader;
	asc_docs_api.prototype['GoToFooter']                                = asc_docs_api.prototype.GoToFooter;
	asc_docs_api.prototype['ExitHeader_Footer']                         = asc_docs_api.prototype.ExitHeader_Footer;
	asc_docs_api.prototype['GetCurrentPixOffsetY']                      = asc_docs_api.prototype.GetCurrentPixOffsetY;
	asc_docs_api.prototype['SetPaintFormat']                            = asc_docs_api.prototype.SetPaintFormat;
	asc_docs_api.prototype['ChangeShapeType']                           = asc_docs_api.prototype.ChangeShapeType;
	asc_docs_api.prototype['sync_PaintFormatCallback']                  = asc_docs_api.prototype.sync_PaintFormatCallback;
	asc_docs_api.prototype['SetMarkerFormat']                           = asc_docs_api.prototype.SetMarkerFormat;
	asc_docs_api.prototype['sync_MarkerFormatCallback']                 = asc_docs_api.prototype.sync_MarkerFormatCallback;
	asc_docs_api.prototype['StartAddShape']                             = asc_docs_api.prototype.StartAddShape;
	asc_docs_api.prototype['AddShapeOnCurrentPage']                     = asc_docs_api.prototype.AddShapeOnCurrentPage;
	asc_docs_api.prototype['AddTextArt']                                = asc_docs_api.prototype.AddTextArt;
	asc_docs_api.prototype['asc_canEditCrop']                           = asc_docs_api.prototype.asc_canEditCrop;
	asc_docs_api.prototype['asc_startEditCrop']                         = asc_docs_api.prototype.asc_startEditCrop;
	asc_docs_api.prototype['asc_endEditCrop']                           = asc_docs_api.prototype.asc_endEditCrop;
	asc_docs_api.prototype['asc_cropFit']                               = asc_docs_api.prototype.asc_cropFit;
	asc_docs_api.prototype['asc_cropFill']                              = asc_docs_api.prototype.asc_cropFill;
	asc_docs_api.prototype["asc_GetWatermarkProps"]                     = asc_docs_api.prototype.asc_GetWatermarkProps;
	asc_docs_api.prototype["asc_SetWatermarkProps"]                     = asc_docs_api.prototype.asc_SetWatermarkProps;
	asc_docs_api.prototype["asc_WatermarkRemove"]                       = asc_docs_api.prototype.asc_WatermarkRemove;

	asc_docs_api.prototype['sync_StartAddShapeCallback']                = asc_docs_api.prototype.sync_StartAddShapeCallback;
	asc_docs_api.prototype['CanGroup']                                  = asc_docs_api.prototype.CanGroup;
	asc_docs_api.prototype['CanUnGroup']                                = asc_docs_api.prototype.CanUnGroup;
	asc_docs_api.prototype['CanChangeWrapPolygon']                      = asc_docs_api.prototype.CanChangeWrapPolygon;
	asc_docs_api.prototype['StartChangeWrapPolygon']                    = asc_docs_api.prototype.StartChangeWrapPolygon;
	asc_docs_api.prototype['ClearFormating']                            = asc_docs_api.prototype.ClearFormating;
	asc_docs_api.prototype['GetSectionInfo']                            = asc_docs_api.prototype.GetSectionInfo;
	asc_docs_api.prototype['add_SectionBreak']                          = asc_docs_api.prototype.add_SectionBreak;
	asc_docs_api.prototype['asc_setViewMode']                           = asc_docs_api.prototype.asc_setViewMode;
	asc_docs_api.prototype['asc_setRestriction']                        = asc_docs_api.prototype.asc_setRestriction;
	asc_docs_api.prototype['OnMouseUp']                                 = asc_docs_api.prototype.OnMouseUp;
	asc_docs_api.prototype['asyncImageEndLoaded2']                      = asc_docs_api.prototype.asyncImageEndLoaded2;
	asc_docs_api.prototype['SetDrawImagePlaceParagraph']                = asc_docs_api.prototype.SetDrawImagePlaceParagraph;
	asc_docs_api.prototype['asc_getMasterCommentId']                    = asc_docs_api.prototype.asc_getMasterCommentId;
	asc_docs_api.prototype['asc_getAnchorPosition']                     = asc_docs_api.prototype.asc_getAnchorPosition;
	asc_docs_api.prototype['asc_getChartObject']                        = asc_docs_api.prototype.asc_getChartObject;
	asc_docs_api.prototype['asc_addChartDrawingObject']                 = asc_docs_api.prototype.asc_addChartDrawingObject;
	asc_docs_api.prototype['asc_doubleClickOnChart']                    = asc_docs_api.prototype.asc_doubleClickOnChart;
	asc_docs_api.prototype['asc_onCloseChartFrame']                     = asc_docs_api.prototype.asc_onCloseChartFrame;
	asc_docs_api.prototype['asc_editChartDrawingObject']                = asc_docs_api.prototype.asc_editChartDrawingObject;
	asc_docs_api.prototype['asc_getChartPreviews']                      = asc_docs_api.prototype.asc_getChartPreviews;
	asc_docs_api.prototype['asc_getTextArtPreviews']                    = asc_docs_api.prototype.asc_getTextArtPreviews;
	asc_docs_api.prototype['sync_closeChartEditor']                     = asc_docs_api.prototype.sync_closeChartEditor;
	asc_docs_api.prototype['asc_setDrawCollaborationMarks']             = asc_docs_api.prototype.asc_setDrawCollaborationMarks;
	asc_docs_api.prototype['asc_AddMath']                               = asc_docs_api.prototype.asc_AddMath;
	asc_docs_api.prototype['asc_AddMath2']                              = asc_docs_api.prototype.asc_AddMath2;
	asc_docs_api.prototype['asc_AddPageCount']                          = asc_docs_api.prototype.asc_AddPageCount;
	asc_docs_api.prototype['asc_StartMailMerge']                        = asc_docs_api.prototype.asc_StartMailMerge;
	asc_docs_api.prototype['asc_StartMailMergeByList']                  = asc_docs_api.prototype.asc_StartMailMergeByList;
	asc_docs_api.prototype['asc_GetReceptionsCount']                    = asc_docs_api.prototype.asc_GetReceptionsCount;
	asc_docs_api.prototype['asc_GetMailMergeFieldsNameList']            = asc_docs_api.prototype.asc_GetMailMergeFieldsNameList;
	asc_docs_api.prototype['asc_AddMailMergeField']                     = asc_docs_api.prototype.asc_AddMailMergeField;
	asc_docs_api.prototype['asc_SetHighlightMailMergeFields']           = asc_docs_api.prototype.asc_SetHighlightMailMergeFields;
	asc_docs_api.prototype['asc_PreviewMailMergeResult']                = asc_docs_api.prototype.asc_PreviewMailMergeResult;
	asc_docs_api.prototype['asc_EndPreviewMailMergeResult']             = asc_docs_api.prototype.asc_EndPreviewMailMergeResult;
	asc_docs_api.prototype['sync_StartMailMerge']                       = asc_docs_api.prototype.sync_StartMailMerge;
	asc_docs_api.prototype['sync_PreviewMailMergeResult']               = asc_docs_api.prototype.sync_PreviewMailMergeResult;
	asc_docs_api.prototype['sync_EndPreviewMailMergeResult']            = asc_docs_api.prototype.sync_EndPreviewMailMergeResult;
	asc_docs_api.prototype['sync_HighlightMailMergeFields']             = asc_docs_api.prototype.sync_HighlightMailMergeFields;
	asc_docs_api.prototype['asc_getMailMergeData']                      = asc_docs_api.prototype.asc_getMailMergeData;
	asc_docs_api.prototype['asc_setMailMergeData']                      = asc_docs_api.prototype.asc_setMailMergeData;
	asc_docs_api.prototype['asc_sendMailMergeData']                     = asc_docs_api.prototype.asc_sendMailMergeData;
	asc_docs_api.prototype['asc_GetMailMergeFiledValue']                = asc_docs_api.prototype.asc_GetMailMergeFiledValue;
	asc_docs_api.prototype['asc_GetStyleFromFormatting']                = asc_docs_api.prototype.asc_GetStyleFromFormatting;
	asc_docs_api.prototype['asc_AddNewStyle']                           = asc_docs_api.prototype.asc_AddNewStyle;
	asc_docs_api.prototype['asc_RemoveStyle']                           = asc_docs_api.prototype.asc_RemoveStyle;
	asc_docs_api.prototype['asc_RemoveAllCustomStyles']                 = asc_docs_api.prototype.asc_RemoveAllCustomStyles;
	asc_docs_api.prototype['asc_IsStyleDefault']                        = asc_docs_api.prototype.asc_IsStyleDefault;
	asc_docs_api.prototype['asc_IsDefaultStyleChanged']                 = asc_docs_api.prototype.asc_IsDefaultStyleChanged;
	asc_docs_api.prototype['asc_GetStyleNameById']                      = asc_docs_api.prototype.asc_GetStyleNameById;
	asc_docs_api.prototype['asc_SetTrackRevisions']                     = asc_docs_api.prototype.asc_SetTrackRevisions;
	asc_docs_api.prototype['asc_IsTrackRevisions']                      = asc_docs_api.prototype.asc_IsTrackRevisions;
	asc_docs_api.prototype['sync_BeginCatchRevisionsChanges']           = asc_docs_api.prototype.sync_BeginCatchRevisionsChanges;
	asc_docs_api.prototype['sync_EndCatchRevisionsChanges']             = asc_docs_api.prototype.sync_EndCatchRevisionsChanges;
	asc_docs_api.prototype['asc_GetRevisionsChangesStack']              = asc_docs_api.prototype.asc_GetRevisionsChangesStack;
	asc_docs_api.prototype['sync_AddRevisionsChange']                   = asc_docs_api.prototype.sync_AddRevisionsChange;
	asc_docs_api.prototype['asc_AcceptChanges']                         = asc_docs_api.prototype.asc_AcceptChanges;
	asc_docs_api.prototype['asc_RejectChanges']                         = asc_docs_api.prototype.asc_RejectChanges;
	asc_docs_api.prototype['asc_HaveRevisionsChanges']                  = asc_docs_api.prototype.asc_HaveRevisionsChanges;
	asc_docs_api.prototype['asc_HaveNewRevisionsChanges']               = asc_docs_api.prototype.asc_HaveNewRevisionsChanges;
	asc_docs_api.prototype['asc_GetNextRevisionsChange']                = asc_docs_api.prototype.asc_GetNextRevisionsChange;
	asc_docs_api.prototype['asc_GetPrevRevisionsChange']                = asc_docs_api.prototype.asc_GetPrevRevisionsChange;
	asc_docs_api.prototype['sync_UpdateRevisionsChangesPosition']       = asc_docs_api.prototype.sync_UpdateRevisionsChangesPosition;
	asc_docs_api.prototype['asc_AcceptAllChanges']                      = asc_docs_api.prototype.asc_AcceptAllChanges;
	asc_docs_api.prototype['asc_RejectAllChanges']                      = asc_docs_api.prototype.asc_RejectAllChanges;
	asc_docs_api.prototype['asc_GetTrackRevisionsReportByAuthors']      = asc_docs_api.prototype.asc_GetTrackRevisionsReportByAuthors;
	asc_docs_api.prototype['asc_FollowRevisionMove']                    = asc_docs_api.prototype.asc_FollowRevisionMove;
	asc_docs_api.prototype['asc_stopSaving']                            = asc_docs_api.prototype.asc_stopSaving;
	asc_docs_api.prototype['asc_continueSaving']                        = asc_docs_api.prototype.asc_continueSaving;
	asc_docs_api.prototype['asc_undoAllChanges']                        = asc_docs_api.prototype.asc_undoAllChanges;
	asc_docs_api.prototype['asc_CloseFile']                             = asc_docs_api.prototype.asc_CloseFile;
	asc_docs_api.prototype['asc_SetFastCollaborative']                  = asc_docs_api.prototype.asc_SetFastCollaborative;
	asc_docs_api.prototype['asc_isOffline']                             = asc_docs_api.prototype.asc_isOffline;
	asc_docs_api.prototype['asc_getUrlType']                            = asc_docs_api.prototype.asc_getUrlType;
	asc_docs_api.prototype['asc_getSessionToken']                 		= asc_docs_api.prototype.asc_getSessionToken;
	asc_docs_api.prototype["asc_setInterfaceDrawImagePlaceShape"]       = asc_docs_api.prototype.asc_setInterfaceDrawImagePlaceShape;
	asc_docs_api.prototype["asc_pluginsRegister"]                       = asc_docs_api.prototype.asc_pluginsRegister;
	asc_docs_api.prototype["asc_pluginRun"]                             = asc_docs_api.prototype.asc_pluginRun;
	asc_docs_api.prototype["asc_pluginResize"]                          = asc_docs_api.prototype.asc_pluginResize;
	asc_docs_api.prototype["asc_pluginButtonClick"]                     = asc_docs_api.prototype.asc_pluginButtonClick;
	asc_docs_api.prototype["asc_pluginEnableMouseEvents"]         		= asc_docs_api.prototype.asc_pluginEnableMouseEvents;

	asc_docs_api.prototype["asc_nativeInitBuilder"]                     = asc_docs_api.prototype.asc_nativeInitBuilder;
	asc_docs_api.prototype["asc_SetSilentMode"]                         = asc_docs_api.prototype.asc_SetSilentMode;
	asc_docs_api.prototype["asc_startEditCurrentOleObject"]             = asc_docs_api.prototype.asc_startEditCurrentOleObject;
	asc_docs_api.prototype["asc_InputClearKeyboardElement"]             = asc_docs_api.prototype.asc_InputClearKeyboardElement;
	asc_docs_api.prototype["asc_SpecialPaste"]                          = asc_docs_api.prototype.asc_SpecialPaste;

	asc_docs_api.prototype["SetDrawImagePlaceContents"]					= asc_docs_api.prototype.SetDrawImagePlaceContents;
    asc_docs_api.prototype["SetDrawImagePreviewMargins"]				= asc_docs_api.prototype.SetDrawImagePreviewMargins;
    asc_docs_api.prototype["SetDrawImagePreviewBullet"]					= asc_docs_api.prototype.SetDrawImagePreviewBullet;

	asc_docs_api.prototype["asc_RemoveContentControl"]                  = asc_docs_api.prototype.asc_RemoveContentControl;
	asc_docs_api.prototype["asc_RemoveContentControlWrapper"]           = asc_docs_api.prototype.asc_RemoveContentControlWrapper;
	asc_docs_api.prototype["asc_SetContentControlProperties"]           = asc_docs_api.prototype.asc_SetContentControlProperties;
	asc_docs_api.prototype["asc_IsContentControl"]                      = asc_docs_api.prototype.asc_IsContentControl;
	asc_docs_api.prototype["asc_GetContentControlProperties"]           = asc_docs_api.prototype.asc_GetContentControlProperties;
	asc_docs_api.prototype["asc_GetCurrentContentControl"]              = asc_docs_api.prototype.asc_GetCurrentContentControl;
	asc_docs_api.prototype["asc_UncheckContentControlButtons"]          = asc_docs_api.prototype.asc_UncheckContentControlButtons;
	asc_docs_api.prototype['asc_SetGlobalContentControlHighlightColor'] = asc_docs_api.prototype.asc_SetGlobalContentControlHighlightColor;
	asc_docs_api.prototype['asc_GetGlobalContentControlHighlightColor'] = asc_docs_api.prototype.asc_GetGlobalContentControlHighlightColor;
	asc_docs_api.prototype['asc_SetGlobalContentControlShowHighlight']  = asc_docs_api.prototype.asc_SetGlobalContentControlShowHighlight;
	asc_docs_api.prototype['asc_GetGlobalContentControlShowHighlight']  = asc_docs_api.prototype.asc_GetGlobalContentControlShowHighlight;
	asc_docs_api.prototype['asc_SetContentControlCheckBoxPr']           = asc_docs_api.prototype.asc_SetContentControlCheckBoxPr;
	asc_docs_api.prototype['asc_SetContentControlPictureUrl']           = asc_docs_api.prototype.asc_SetContentControlPictureUrl;
	asc_docs_api.prototype['asc_SetContentControlListPr']               = asc_docs_api.prototype.asc_SetContentControlListPr;
	asc_docs_api.prototype['asc_SelectContentControlListItem']          = asc_docs_api.prototype.asc_SelectContentControlListItem;
	asc_docs_api.prototype['asc_SetContentControlDatePickerPr']         = asc_docs_api.prototype.asc_SetContentControlDatePickerPr;
	asc_docs_api.prototype['asc_SetContentControlDatePickerDate']       = asc_docs_api.prototype.asc_SetContentControlDatePickerDate;

	asc_docs_api.prototype['asc_BeginViewModeInReview']                 = asc_docs_api.prototype.asc_BeginViewModeInReview;
	asc_docs_api.prototype['asc_EndViewModeInReview']                   = asc_docs_api.prototype.asc_EndViewModeInReview;

	asc_docs_api.prototype['asc_ShowDocumentOutline']                   = asc_docs_api.prototype.asc_ShowDocumentOutline;
	asc_docs_api.prototype['asc_HideDocumentOutline']                   = asc_docs_api.prototype.asc_HideDocumentOutline;
	asc_docs_api.prototype['sync_OnDocumentOutlineUpdate']              = asc_docs_api.prototype.sync_OnDocumentOutlineUpdate;
	asc_docs_api.prototype['sync_OnDocumentOutlineCurrentPosition']     = asc_docs_api.prototype.sync_OnDocumentOutlineCurrentPosition;

	asc_docs_api.prototype['asc_AddTableOfContents']                    = asc_docs_api.prototype.asc_AddTableOfContents;
	asc_docs_api.prototype['asc_RemoveTableOfContents']                 = asc_docs_api.prototype.asc_RemoveTableOfContents;
	asc_docs_api.prototype['asc_GetTableOfContentsPr']                  = asc_docs_api.prototype.asc_GetTableOfContentsPr;
	asc_docs_api.prototype['asc_SetTableOfContentsPr']                  = asc_docs_api.prototype.asc_SetTableOfContentsPr;
	asc_docs_api.prototype['asc_UpdateTableOfContents']                 = asc_docs_api.prototype.asc_UpdateTableOfContents;

	asc_docs_api.prototype['asc_GetCurrentComplexField']                = asc_docs_api.prototype.asc_GetCurrentComplexField;
	asc_docs_api.prototype['asc_UpdateComplexField']                    = asc_docs_api.prototype.asc_UpdateComplexField;
	asc_docs_api.prototype['asc_RemoveComplexField']                    = asc_docs_api.prototype.asc_RemoveComplexField;
	asc_docs_api.prototype['asc_SetComplexFieldPr']                     = asc_docs_api.prototype.asc_SetComplexFieldPr;
	asc_docs_api.prototype['asc_AddTableFormula']                       = asc_docs_api.prototype.asc_AddTableFormula;
	asc_docs_api.prototype['asc_GetTableFormula']                       = asc_docs_api.prototype.asc_GetTableFormula;
	asc_docs_api.prototype['asc_GetTableFormulaFormats']                = asc_docs_api.prototype.asc_GetTableFormulaFormats;
	asc_docs_api.prototype['asc_ParseTableFormulaInstrLine']            = asc_docs_api.prototype.asc_ParseTableFormulaInstrLine;
	asc_docs_api.prototype['asc_CreateInstructionLine']                 = asc_docs_api.prototype.asc_CreateInstructionLine;


	asc_docs_api.prototype['asc_AddObjectCaption']                      = asc_docs_api.prototype.asc_AddObjectCaption;

	asc_docs_api.prototype['asc_GetBookmarksManager']                   = asc_docs_api.prototype.asc_GetBookmarksManager;
	asc_docs_api.prototype['asc_OnBookmarksUpdate']                     = asc_docs_api.prototype.asc_OnBookmarksUpdate;

	asc_docs_api.prototype['asc_GetHeadingLevel']                       = asc_docs_api.prototype.asc_GetHeadingLevel;
	asc_docs_api.prototype['asc_GetStylesArray']                        = asc_docs_api.prototype.asc_GetStylesArray;

	asc_docs_api.prototype['asc_SetAutomaticBulletedLists']             = asc_docs_api.prototype.asc_SetAutomaticBulletedLists;
	asc_docs_api.prototype['asc_SetAutomaticNumberedLists']             = asc_docs_api.prototype.asc_SetAutomaticNumberedLists;
	asc_docs_api.prototype['asc_SetAutoCorrectSmartQuotes']             = asc_docs_api.prototype.asc_SetAutoCorrectSmartQuotes;
	asc_docs_api.prototype['asc_SetAutoCorrectHyphensWithDash']         = asc_docs_api.prototype.asc_SetAutoCorrectHyphensWithDash;

	asc_docs_api.prototype['asc_GetSelectedText']                       = asc_docs_api.prototype.asc_GetSelectedText;
	asc_docs_api.prototype['asc_AddBlankPage']                          = asc_docs_api.prototype.asc_AddBlankPage;
    asc_docs_api.prototype['sendEvent']         						= asc_docs_api.prototype.sendEvent;

    asc_docs_api.prototype['SetTableDrawMode']         					= asc_docs_api.prototype.SetTableDrawMode;
    asc_docs_api.prototype['SetTableEraseMode']         				= asc_docs_api.prototype.SetTableEraseMode;

	// mobile
	asc_docs_api.prototype["asc_GetDefaultTableStyles"]             	= asc_docs_api.prototype.asc_GetDefaultTableStyles;
	asc_docs_api.prototype["asc_Remove"]             					= asc_docs_api.prototype.asc_Remove;
	asc_docs_api.prototype["asc_OnHideContextMenu"] 					= asc_docs_api.prototype.asc_OnHideContextMenu;
	asc_docs_api.prototype["asc_OnShowContextMenu"] 					= asc_docs_api.prototype.asc_OnShowContextMenu;

	// signatures
	asc_docs_api.prototype["asc_addSignatureLine"] 						= asc_docs_api.prototype.asc_addSignatureLine;
	asc_docs_api.prototype["asc_CallSignatureDblClickEvent"]			= asc_docs_api.prototype.asc_CallSignatureDblClickEvent;
	asc_docs_api.prototype["asc_getRequestSignatures"] 					= asc_docs_api.prototype.asc_getRequestSignatures;
	asc_docs_api.prototype["asc_AddSignatureLine2"]             		= asc_docs_api.prototype.asc_AddSignatureLine2;
	asc_docs_api.prototype["asc_MoveCursorToSignature"]           		= asc_docs_api.prototype.asc_MoveCursorToSignature;
	asc_docs_api.prototype["asc_Sign"]             						= asc_docs_api.prototype.asc_Sign;
	asc_docs_api.prototype["asc_RequestSign"]             				= asc_docs_api.prototype.asc_RequestSign;
	asc_docs_api.prototype["asc_ViewCertificate"] 						= asc_docs_api.prototype.asc_ViewCertificate;
	asc_docs_api.prototype["asc_SelectCertificate"] 					= asc_docs_api.prototype.asc_SelectCertificate;
	asc_docs_api.prototype["asc_GetDefaultCertificate"] 				= asc_docs_api.prototype.asc_GetDefaultCertificate;
	asc_docs_api.prototype["asc_getSignatures"] 						= asc_docs_api.prototype.asc_getSignatures;
	asc_docs_api.prototype["asc_isSignaturesSupport"] 					= asc_docs_api.prototype.asc_isSignaturesSupport;
    asc_docs_api.prototype["asc_isProtectionSupport"] 					= asc_docs_api.prototype.asc_isProtectionSupport;
	asc_docs_api.prototype["asc_RemoveSignature"] 						= asc_docs_api.prototype.asc_RemoveSignature;
	asc_docs_api.prototype["asc_RemoveAllSignatures"] 					= asc_docs_api.prototype.asc_RemoveAllSignatures;
	asc_docs_api.prototype["asc_gotoSignature"] 						= asc_docs_api.prototype.asc_gotoSignature;
	asc_docs_api.prototype["asc_getSignatureSetup"] 					= asc_docs_api.prototype.asc_getSignatureSetup;

	// passwords
	asc_docs_api.prototype["asc_setCurrentPassword"] 					= asc_docs_api.prototype.asc_setCurrentPassword;
	asc_docs_api.prototype["asc_resetPassword"] 						= asc_docs_api.prototype.asc_resetPassword;

	CDocInfoProp.prototype['get_PageCount']             = CDocInfoProp.prototype.get_PageCount;
	CDocInfoProp.prototype['put_PageCount']             = CDocInfoProp.prototype.put_PageCount;
	CDocInfoProp.prototype['get_WordsCount']            = CDocInfoProp.prototype.get_WordsCount;
	CDocInfoProp.prototype['put_WordsCount']            = CDocInfoProp.prototype.put_WordsCount;
	CDocInfoProp.prototype['get_ParagraphCount']        = CDocInfoProp.prototype.get_ParagraphCount;
	CDocInfoProp.prototype['put_ParagraphCount']        = CDocInfoProp.prototype.put_ParagraphCount;
	CDocInfoProp.prototype['get_SymbolsCount']          = CDocInfoProp.prototype.get_SymbolsCount;
	CDocInfoProp.prototype['put_SymbolsCount']          = CDocInfoProp.prototype.put_SymbolsCount;
	CDocInfoProp.prototype['get_SymbolsWSCount']        = CDocInfoProp.prototype.get_SymbolsWSCount;
	CDocInfoProp.prototype['put_SymbolsWSCount']        = CDocInfoProp.prototype.put_SymbolsWSCount;
	CContextMenuData.prototype['get_Type']    = CContextMenuData.prototype.get_Type;
	CContextMenuData.prototype['get_X']       = CContextMenuData.prototype.get_X;
	CContextMenuData.prototype['get_Y']       = CContextMenuData.prototype.get_Y;
	CContextMenuData.prototype['get_PageNum'] = CContextMenuData.prototype.get_PageNum;
	CContextMenuData.prototype['is_Header']   = CContextMenuData.prototype.is_Header;
	window['Asc']['asc_CCommentDataWord']                 = asc_CCommentDataWord;
	asc_CCommentDataWord.prototype['asc_getText']         = asc_CCommentDataWord.prototype.asc_getText;
	asc_CCommentDataWord.prototype['asc_putText']         = asc_CCommentDataWord.prototype.asc_putText;
	asc_CCommentDataWord.prototype['asc_getTime']         = asc_CCommentDataWord.prototype.asc_getTime;
	asc_CCommentDataWord.prototype['asc_putTime']         = asc_CCommentDataWord.prototype.asc_putTime;
	asc_CCommentDataWord.prototype['asc_getOnlyOfficeTime']         = asc_CCommentDataWord.prototype.asc_getOnlyOfficeTime;
	asc_CCommentDataWord.prototype['asc_putOnlyOfficeTime']         = asc_CCommentDataWord.prototype.asc_putOnlyOfficeTime;
	asc_CCommentDataWord.prototype['asc_getUserId']       = asc_CCommentDataWord.prototype.asc_getUserId;
	asc_CCommentDataWord.prototype['asc_putUserId']       = asc_CCommentDataWord.prototype.asc_putUserId;
	asc_CCommentDataWord.prototype['asc_getProviderId']   = asc_CCommentDataWord.prototype.asc_getProviderId;
	asc_CCommentDataWord.prototype['asc_putProviderId']   = asc_CCommentDataWord.prototype.asc_putProviderId;
	asc_CCommentDataWord.prototype['asc_getUserName']     = asc_CCommentDataWord.prototype.asc_getUserName;
	asc_CCommentDataWord.prototype['asc_putUserName']     = asc_CCommentDataWord.prototype.asc_putUserName;
	asc_CCommentDataWord.prototype['asc_getInitials']     = asc_CCommentDataWord.prototype.asc_getInitials;
	asc_CCommentDataWord.prototype['asc_putInitials']     = asc_CCommentDataWord.prototype.asc_putInitials;
	asc_CCommentDataWord.prototype['asc_getQuoteText']    = asc_CCommentDataWord.prototype.asc_getQuoteText;
	asc_CCommentDataWord.prototype['asc_putQuoteText']    = asc_CCommentDataWord.prototype.asc_putQuoteText;
	asc_CCommentDataWord.prototype['asc_getSolved']       = asc_CCommentDataWord.prototype.asc_getSolved;
	asc_CCommentDataWord.prototype['asc_putSolved']       = asc_CCommentDataWord.prototype.asc_putSolved;
	asc_CCommentDataWord.prototype['asc_getGuid']         = asc_CCommentDataWord.prototype.asc_getGuid;
	asc_CCommentDataWord.prototype['asc_putGuid']         = asc_CCommentDataWord.prototype.asc_putGuid;
	asc_CCommentDataWord.prototype['asc_getReply']        = asc_CCommentDataWord.prototype.asc_getReply;
	asc_CCommentDataWord.prototype['asc_addReply']        = asc_CCommentDataWord.prototype.asc_addReply;
	asc_CCommentDataWord.prototype['asc_getRepliesCount'] = asc_CCommentDataWord.prototype.asc_getRepliesCount;
	asc_CCommentDataWord.prototype['asc_getDocumentFlag'] = asc_CCommentDataWord.prototype.asc_getDocumentFlag;
	asc_CCommentDataWord.prototype['asc_putDocumentFlag'] = asc_CCommentDataWord.prototype.asc_putDocumentFlag;

	AscCommon.setUpAllFonts = function()
	{
		var testFontCurrent = 0;
		var testFontsInterval = 0;

		var _fonts = [];
		for (var i = 0; i < AscFonts.g_font_infos.length; i++)
			_fonts.push(new AscFonts.CFont(AscFonts.g_font_infos[i].Name, 0, "", 0, null));

		console.log("start...");

		function logFont(font, name)
		{
			var face = font.m_pFace;
			if (!face.os2 || face.os2.version == 0xFFFF)
				return;

			var isTypo = ((face.os2.fsSelection & 128) != 0);
			//if (!isTypo)
			//	return;

			if (isTypo && (face.height != (face.os2.sTypoAscender - face.os2.sTypoDescender + face.os2.sTypoLineGap)))
			{
			    console.log("[" + face.family_name + "] typo");
				console.log(face.ascender + ", " + face.descender + ", " + face.height);
                console.log(face.os2.sTypoAscender + ", " + face.os2.sTypoDescender + ", " + (face.os2.sTypoAscender - face.os2.sTypoDescender + face.os2.sTypoLineGap));
			}

            if (!isTypo && (face.height != (face.os2.usWinAscent + face.os2.usWinDescent)))
            {
                console.log("[" + face.family_name + "] win");
                console.log(face.ascender + ", " + face.descender + ", " + face.height);
                console.log(face.os2.usWinAscent + ", " + face.os2.usWinDescent + ", " + (face.os2.usWinAscent + face.os2.usWinDescent));
            }
		}

        editor.asyncMethodCallback = function() {

            testFontsInterval = setInterval(function(){
                if (testFontCurrent >= AscFonts.g_font_infos.length)
                {
                    clearInterval(testFontsInterval);
                    console.log("end");
                    return;
                }

                var _info = AscFonts.g_font_infos[testFontCurrent++];

                if (_info.indexR != -1)
				{
					var fontfile = AscCommon.g_font_loader.fontFiles[_info.indexR];
                    var pFontFile = AscCommon.g_fontManager.LoadFont(fontfile, _info.faceIndexR, 12, false, false, false, false, true);

					logFont(pFontFile, "regular");
                }

                if (_info.indexB != -1)
                {
                    var fontfile = AscCommon.g_font_loader.fontFiles[_info.indexB];
                    var pFontFile = AscCommon.g_fontManager.LoadFont(fontfile, _info.faceIndexB, 12, true, false, false, false, true);

                    logFont(pFontFile, "bold");
                }

                if (_info.indexI != -1)
                {
                    var fontfile = AscCommon.g_font_loader.fontFiles[_info.indexI];
                    var pFontFile = AscCommon.g_fontManager.LoadFont(fontfile, _info.faceIndexI, 12, false, true, false, false, true);

                    logFont(pFontFile, "italic");
                }

                if (_info.indexBI != -1)
                {
                    var fontfile = AscCommon.g_font_loader.fontFiles[_info.indexBI];
                    var pFontFile = AscCommon.g_fontManager.LoadFont(fontfile, _info.faceIndexBI, 12, true, true, false, false, true);

                    logFont(pFontFile, "bold italic");
                }

            }, 10);

        };

        AscCommon.g_font_loader.LoadDocumentFonts2(_fonts);
	};

})(window, window.document);
