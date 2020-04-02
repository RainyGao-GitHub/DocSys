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

(function(window, undefined){

var prot;
// Import
var g_memory = AscFonts.g_memory;
var DecodeBase64Char = AscFonts.DecodeBase64Char;
var b64_decode = AscFonts.b64_decode;
    
var g_nodeAttributeEnd = AscCommon.g_nodeAttributeEnd;

var c_oAscShdClear = Asc.c_oAscShdClear;
var c_oAscColor = Asc.c_oAscColor;
var c_oAscFill = Asc.c_oAscFill;

var c_dScalePPTXSizes = 36000;
function IsHiddenObj(object)
{
    if (!object)
        return false;
    var _uniProps = object.nvSpPr;
    if (!_uniProps)
        _uniProps = object.nvPicPr;
    if (!_uniProps)
        _uniProps = object.nvGrpSpPr;

    if (!_uniProps)
        return false;

    if (_uniProps.cNvPr && _uniProps.cNvPr.isHidden)
        return true;

    return false;
}

function CBuilderImages(blip_fill, full_url, image_shape, sp_pr, ln, text_pr, para_text_pr, run, paragraph)
{
    this.Url = full_url;
    this.BlipFill = blip_fill;
    this.ImageShape = image_shape;
    this.SpPr = sp_pr;
    this.Ln = ln;

    this.TextPr     = text_pr;
    this.ParaTextPr = para_text_pr;
    this.Run        = run;
    this.Paragraph  = paragraph;
    this.AdditionalUrls = [];//для wmf, ole
}
CBuilderImages.prototype =
{
    SetUrl : function(url)
    {
        if(url !== "error")
        {
            var oCopyFill, oCopyBlipFill, oCopyLn;
            if(!this.Ln && this.SpPr && this.SpPr.Fill)
            {
                oCopyFill = this.SpPr.Fill.createDuplicate();
                if(oCopyFill.fill && oCopyFill.fill.type === c_oAscFill.FILL_TYPE_BLIP)
                {
                    oCopyFill.fill.setRasterImageId(url);
                    this.SpPr.setFill(oCopyFill);
                }
            }
            if(this.Ln && this.SpPr && this.SpPr === this.Ln && this.Ln.Fill && this.Ln.Fill.fill && this.Ln.Fill.fill.type === c_oAscFill.FILL_TYPE_BLIP)
            {
                oCopyLn = this.Ln.createDuplicate();
                oCopyLn.Fill.fill.setRasterImageId(url);
                this.SpPr.setLn(oCopyLn);
            }
            if(this.ImageShape && this.ImageShape.blipFill)
            {
                oCopyBlipFill = this.ImageShape.blipFill.createDuplicate();
                oCopyBlipFill.setRasterImageId(url);
                this.ImageShape.setBlipFill(oCopyBlipFill);
            }
            if(this.TextPr && !this.Ln)
            {
                if(this.Paragraph)
                {
                    var oPr = this.Paragraph.Pr;
                    if(oPr.DefaultRunPr && oPr.DefaultRunPr.Unifill && oPr.DefaultRunPr.Unifill.fill && oPr.DefaultRunPr.Unifill.fill.type === c_oAscFill.FILL_TYPE_BLIP)
                    {
                        var Pr = this.Paragraph.Pr.Copy();
                        Pr.DefaultRunPr.Unifill.fill.setRasterImageId(url);
                        this.Paragraph.Set_Pr(Pr);
                    }
                }
                else if(this.ParaTextPr || this.Run)
                {
                    if(this.ParaTextPr && this.ParaTextPr.Value && this.ParaTextPr.Value.Unifill && this.ParaTextPr.Value.Unifill.fill && this.ParaTextPr.Value.Unifill.fill.type === c_oAscFill.FILL_TYPE_BLIP)
                    {
                        oCopyFill = this.ParaTextPr.Value.Unifill.createDuplicate();
                        oCopyFill.fill.setRasterImageId(url);
                        this.ParaTextPr.Set_Unifill(oCopyFill);
                    }
                    if(this.Run && this.Run.Pr && this.Run.Pr.Unifill && this.Run.Pr.Unifill.fill && this.Run.Pr.Unifill.fill.type === c_oAscFill.FILL_TYPE_BLIP)
                    {
                        oCopyFill = this.Run.Pr.Unifill.createDuplicate();
                        oCopyFill.fill.setRasterImageId(url);
                        this.Run.Set_Unifill(oCopyFill);
                    }
                }
            }
            this.BlipFill.RasterImageId = url;
        }
    }
};

function BinaryPPTYLoader()
{
    this.stream = null;
    this.presentation = null;

    this.TempGroupObject = null;
    this.TempMainObject = null;

    this.IsThemeLoader = false;
    this.Api = null;

    this.map_table_styles = {};
    this.NextTableStyleId = 0;

    this.ImageMapChecker = null;

    this.IsUseFullUrl = false;
	this.insertDocumentUrlsData = null;
    this.RebuildImages = [];

    this.textBodyTextFit = [];
    this.aSlideLayouts = [];
    this.aThemes = [];

	this.arr_connectors = [];
	this.map_shapes_by_id = {};



	this.ClearConnectorsMaps = function(){
        this.arr_connectors.length = 0;
        this.map_shapes_by_id = {};
    };

	this.AssignConnectorsId = function () {
	    var oPr = null;
        for(var i = 0; i < this.arr_connectors.length; ++i){
            oPr = this.arr_connectors[i].nvSpPr.nvUniSpPr;
            if(AscFormat.isRealNumber(oPr.stCnxId)){
                if(AscCommon.isRealObject(this.map_shapes_by_id[oPr.stCnxId])){
                    oPr.stCnxId = this.map_shapes_by_id[oPr.stCnxId].Id;
                }
                else{
                    oPr.stCnxId = null;
                    oPr.stCnxIdx = null;
                }
            }
            if(AscFormat.isRealNumber(oPr.endCnxId)){
                if(AscCommon.isRealObject(this.map_shapes_by_id[oPr.endCnxId])){
                    oPr.endCnxId = this.map_shapes_by_id[oPr.endCnxId].Id;
                }
                else{
                    oPr.endCnxId = null;
                    oPr.endCnxIdx = null;
                }
            }
            this.arr_connectors[i].nvSpPr.setUniSpPr(oPr.copy());
        }
        this.ClearConnectorsMaps();
    };

    this.Start_UseFullUrl = function(insertDocumentUrlsData)
    {
        this.IsUseFullUrl = true;
		this.insertDocumentUrlsData = insertDocumentUrlsData;
    };

    this.End_UseFullUrl = function()
    {
        var _result = this.RebuildImages;

        this.IsUseFullUrl = false;
        this.RebuildImages = [];

        return _result;
    };

    this.Check_TextFit = function()
    {
        for(var i = 0; i < this.textBodyTextFit.length; ++i)
        {
            this.textBodyTextFit[i].checkTextFit();
        }
        this.textBodyTextFit.length = 0;
    };

    this.Load = function(base64_ppty, presentation)
    {
        this.presentation = presentation;
        this.ImageMapChecker = {};

		var isBase64 = typeof base64_ppty === 'string';
		var srcLen = isBase64 ? base64_ppty.length : base64_ppty.length;
        var nWritten = 0;

        var index = 0;
        var read_main_prop = "";
        while (true)
        {
            var _c = isBase64 ? base64_ppty.charCodeAt(index) : base64_ppty[index];
            if (_c == ";".charCodeAt(0))
                break;

            read_main_prop += String.fromCharCode(_c);
            index++;
        }
        index++;

        if ("PPTY" != read_main_prop)
            return false;

        read_main_prop = "";
        while (true)
        {
            var _c = isBase64 ? base64_ppty.charCodeAt(index) : base64_ppty[index];
            if (_c == ";".charCodeAt(0))
                break;

            read_main_prop += String.fromCharCode(_c);
            index++;
        }
        index++;

        var _version_num_str = read_main_prop.substring(1);
		var version = 1;
		if(_version_num_str.length > 0)
        {
            version = _version_num_str - 0;
        }
        read_main_prop = "";
        while (true)
        {
            var _c = isBase64 ? base64_ppty.charCodeAt(index) : base64_ppty[index];
            if (_c == ";".charCodeAt(0))
                break;

            read_main_prop += String.fromCharCode(_c);
            index++;
        }
        index++;

		if (Asc.c_nVersionNoBase64 !== version) {
			var dstLen_str = read_main_prop;

			var dstLen = parseInt(dstLen_str);

			var pointer = g_memory.Alloc(dstLen);
			this.stream = new AscCommon.FileStream(pointer.data, dstLen);
			this.stream.obj = pointer.obj;

			var dstPx = this.stream.data;

			if (window.chrome)
			{
				while (index < srcLen)
				{
					var dwCurr = 0;
					var i;
					var nBits = 0;
					for (i=0; i<4; i++)
					{
						if (index >= srcLen)
							break;
						var nCh = DecodeBase64Char(isBase64 ? base64_ppty.charCodeAt(index++) : base64_ppty[index++]);
						if (nCh == -1)
						{
							i--;
							continue;
						}
						dwCurr <<= 6;
						dwCurr |= nCh;
						nBits += 6;
					}

					dwCurr <<= 24-nBits;
					for (i=0; i<nBits/8; i++)
					{
						dstPx[nWritten++] = ((dwCurr & 0x00ff0000) >>> 16);
						dwCurr <<= 8;
					}
				}
			}
			else
			{
				var p = b64_decode;
				while (index < srcLen)
				{
					var dwCurr = 0;
					var i;
					var nBits = 0;
					for (i=0; i<4; i++)
					{
						if (index >= srcLen)
							break;
						var nCh = p[isBase64 ? base64_ppty.charCodeAt(index++) : base64_ppty[index++]];
						if (nCh == undefined)
						{
							i--;
							continue;
						}
						dwCurr <<= 6;
						dwCurr |= nCh;
						nBits += 6;
					}

					dwCurr <<= 24-nBits;
					for (i=0; i<nBits/8; i++)
					{
						dstPx[nWritten++] = ((dwCurr & 0x00ff0000) >>> 16);
						dwCurr <<= 8;
					}
				}
			}
		} else {
			this.stream = new AscCommon.FileStream();
			this.stream.obj    = null;
			this.stream.data   = base64_ppty;
			this.stream.size   = base64_ppty.length;
			//skip header
			this.stream.EnterFrame(index);
			this.stream.Seek2(index);
		}
		
        this.presentation.ImageMap = {};
        this.presentation.Fonts = [];

        if (presentation.globalTableStyles)
            this.NextTableStyleId = this.presentation.globalTableStyles.length;

        this.LoadDocument();

        AscFormat.checkPlaceholdersText();

        this.ImageMapChecker = null;
    }

    this.LoadDocument = function()
    {
        // чтение формата ppty
        var _main_tables = {};
        var s = this.stream;
        var err = 0;

        err = s.EnterFrame(5 * 30);
        if (err != 0)
            return err;

        for (var i = 0; i < 30; i++)
        {
            var _type = s.GetUChar();
            if (0 == _type)
                break;

            _main_tables["" + _type] = s.GetULong();
        }

        if (undefined != _main_tables["255"])
        {
            // signature
            s.Seek2(_main_tables["255"]);
            var _sign = s.GetString1(4);
            var _ver = s.GetULong();
        }

        if (!this.IsThemeLoader)
        {
            if (undefined != _main_tables["1"])
            {
                // app
                s.Seek2(_main_tables["1"]);

                this.presentation.App = new CApp();
                this.presentation.App.fromStream(s);
            }

            if (undefined != _main_tables["2"])
            {
                // core
                s.Seek2(_main_tables["2"]);

                this.presentation.Core = new CCore();
                this.presentation.Core.fromStream(s);
            }
        }

        if (undefined != _main_tables["3"])
        {
            // core
            s.Seek2(_main_tables["3"]);

            this.presentation.pres = new CPres();
            var pres = this.presentation.pres;

            pres.fromStream(s, this);

            if(pres.attrShowSpecialPlsOnTitleSld !== null)
            {
                this.presentation.setShowSpecialPlsOnTitleSld(pres.attrShowSpecialPlsOnTitleSld);
            }

            if(pres.attrFirstSlideNum !== null)
            {
                this.presentation.setFirstSlideNum(pres.attrFirstSlideNum);
            }

            this.presentation.defaultTextStyle = pres.defaultTextStyle;
            if(pres.SldSz)
            {
                this.presentation.Width = pres.SldSz.cx / c_dScalePPTXSizes;
                this.presentation.Height = pres.SldSz.cy / c_dScalePPTXSizes;
            }
            else
            {
                this.presentation.Width = 254;
                this.presentation.Height = 190.5;
                pres.SldSz = {};
                pres.SldSz.cx = this.presentation.Width * c_dScalePPTXSizes;
                pres.SldSz.cy = this.presentation.Height * c_dScalePPTXSizes;
            }
        }

        if (!this.IsThemeLoader)
        {
            if (undefined != _main_tables["4"])
            {
                // view props
                s.Seek2(_main_tables["4"]);
                this.presentation.ViewProps = this.ReadViewProps();
            }

            if (undefined != _main_tables["5"])
            {
                // vmldrawing
                s.Seek2(_main_tables["5"]);
                this.presentation.VmlDrawing = this.ReadVmlDrawing();
            }

            if (undefined != _main_tables["6"])
            {
                // tablestyles
                s.Seek2(_main_tables["6"]);
                this.presentation.TableStyles = this.ReadTableStyles();
            }
            if (undefined != _main_tables["7"])
            {
                // presprops
                s.Seek2(_main_tables["7"]);
                this.ReadPresProps(this.presentation);
            }
        }

        this.aThemes.length = 0;
        if (undefined != _main_tables["20"])
        {
            // themes
            s.Seek2(_main_tables["20"]);

            var _themes_count = s.GetULong();
            for (var i = 0; i < _themes_count; i++)
                this.aThemes[i] = this.ReadTheme();
        }

        if (undefined != _main_tables["22"])
        {
            // slide masters
            s.Seek2(_main_tables["22"]);

            var _sm_count = s.GetULong();
            for (var i = 0; i < _sm_count; i++)
            {
                this.presentation.slideMasters[i] = this.ReadSlideMaster();
                this.presentation.slideMasters[i].setSlideSize(this.presentation.Width, this.presentation.Height);
            }
        }

        this.aSlideLayouts.length = 0;
        if (undefined != _main_tables["23"])
        {
            // slide masters
            s.Seek2(_main_tables["23"]);

            var _sl_count = s.GetULong();
            for (var i = 0; i < _sl_count; i++)
            {
                this.aSlideLayouts[i] = this.ReadSlideLayout();
                this.aSlideLayouts[i].setSlideSize(this.presentation.Width, this.presentation.Height);
            }
        }

        if (!this.IsThemeLoader)
        {
            if (undefined != _main_tables["24"])
            {
                // slides
                s.Seek2(_main_tables["24"]);

                var _s_count = s.GetULong();
                var bOldVal;
                if(this.Api)
                {
                    bOldVal = this.Api.bNoSendComments;
                    this.Api.bNoSendComments = true;
                }
                for (var i = 0; i < _s_count; i++)
                {
                    this.presentation.insertSlide(i, this.ReadSlide(i)) ;
                    this.presentation.Slides[i].setSlideSize(this.presentation.Width, this.presentation.Height);
                }
                if(this.Api)
                {
                    this.Api.bNoSendComments = bOldVal;
                }
            }

            if (undefined != _main_tables["25"])
            {
                // slides
                s.Seek2(_main_tables["25"]);

                var _nm_count = s.GetULong();
                for (var i = 0; i < _nm_count; i++){
                    this.presentation.notesMasters[i] = this.ReadNoteMaster();
                    this.presentation.notesMasters[i].setTheme(this.aThemes[0]);//TODO: убрать после того как будут сделаны рельсы
                }
            }

            if (undefined != _main_tables["26"])
            {
                // slides
                s.Seek2(_main_tables["26"]);

                var _n_count = s.GetULong();
                for (var i = 0; i < _n_count; i++)
                    this.presentation.notes[i] = this.ReadNote();
            }
        }

        // теперь нужно прочитать используемые в презентации шрифты и картинки
        if (null == this.ImageMapChecker)
        {
            if (undefined != _main_tables["42"])
            {
                s.Seek2(_main_tables["42"]);

                var _type = s.GetUChar();
                var _len = s.GetULong();

                s.Skip2(1); // strat attr

                var _cur_ind = 0;

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    var image_id = s.GetString2();
                    if (this.IsThemeLoader)
                    {
                        image_id = "theme" + (this.Api.ThemeLoader.CurrentLoadThemeIndex + 1) + "/media/" + image_id;
                    }

                    this.presentation.ImageMap[_cur_ind++] = image_id;
                }
            }
        }
        else
        {
            var _cur_ind = 0;
            for (var k in this.ImageMapChecker)
            {
                if (this.IsThemeLoader)
                {
                    image_id = "theme" + (this.Api.ThemeLoader.CurrentLoadThemeIndex + 1) + "/media/" + k;
                }

                this.presentation.ImageMap[_cur_ind++] = k;
            }
        }

        if (undefined != _main_tables["43"])
        {
            s.Seek2(_main_tables["43"]);

            var _type = s.GetUChar();
            var _len = s.GetULong();

            s.Skip2(1); // strat attr

            var _cur_ind = 0;

            while (true)
            {
                var _at = s.GetUChar();
                if (_at == g_nodeAttributeEnd)
                    break;

                var f_name = s.GetString2();

                this.presentation.Fonts[this.presentation.Fonts.length] = new AscFonts.CFont(f_name, 0, "", 0, 0x0F);
            }
        }

        // все загружено, осталось расставить связи и загрузить картинки тем и шаблонов
        if (undefined != _main_tables["41"])
        {
            s.Seek2(_main_tables["41"]);

            s.Skip2(5); // type + len

            var _count = s.GetULong();

            for (var i = 0; i < _count; i++)
            {
                var _master_type = s.GetUChar(); // must be 0
                this.ReadMasterInfo(i);
            }
        }

        if (!this.IsThemeLoader)
        {
            if (undefined != _main_tables["40"])
            {
                s.Seek2(_main_tables["40"]);

                s.Skip2(6); // type + len + start attr

                var _slideNum = 0;
                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    var indexL = s.GetULong();
                    this.presentation.Slides[_slideNum].setLayout(this.aSlideLayouts[indexL]);
                    this.presentation.Slides[_slideNum].Master = this.aSlideLayouts[indexL].Master;
                    _slideNum++;
                }
            }
			if (undefined != _main_tables["45"])
			{
				s.Seek2(_main_tables["45"]);
				s.Skip2(6); // type + len + start attr

				var _slideNum = 0;
				while (true)
				{
					var _at = s.GetUChar();
					if (_at == g_nodeAttributeEnd)
						break;

					var indexL = s.GetLong();
					this.presentation.Slides[_slideNum].setNotes(this.presentation.notes[indexL]);
                    ++_slideNum;
				}
			}
			if (undefined != _main_tables["46"])
			{
				s.Seek2(_main_tables["46"]);
				s.Skip2(6); // type + len + start attr

				var _noteNum = 0;
				while (true)
				{
					var _at = s.GetUChar();
					if (_at == g_nodeAttributeEnd)
						break;

					var indexL = s.GetLong();
                    this.presentation.notes[_noteNum].setNotesMaster(this.presentation.notesMasters[indexL]);
					_noteNum++;
				}
			}
			if (undefined != _main_tables["47"])
			{
				s.Seek2(_main_tables["47"]);
				s.Skip2(6); // type + len + start attr

				var _noteMasterNum = 0;
				while (true)
				{
					var _at = s.GetUChar();
					if (_at == g_nodeAttributeEnd)
						break;

					var indexL = s.GetLong();
					var notesMaster = this.presentation.notesMasters[_noteMasterNum];
					var notesMasterTheme = this.aThemes[indexL];
					if (notesMaster && notesMasterTheme) {
						notesMaster.setTheme(notesMasterTheme);
					}
					_noteMasterNum++;
				}
			}
        }

        if (this.Api != null && !this.IsThemeLoader)
        {
            if (this.aThemes.length == 0)
            {
                this.aThemes[0] = AscFormat.GenerateDefaultTheme(this.presentation);
            }
            if (this.presentation.slideMasters.length == 0)
            {
                this.presentation.slideMasters[0] = AscFormat.GenerateDefaultMasterSlide(this.aThemes[0]);
                this.aSlideLayouts[0] = this.presentation.slideMasters[0].sldLayoutLst[0];
            }
            if(this.presentation.slideMasters[0].sldLayoutLst.length === 0)
            {
                this.presentation.slideMasters[0].sldLayoutLst[0] = AscFormat.GenerateDefaultSlideLayout(this.presentation.slideMasters[0]);
                this.aSlideLayouts[0] = this.presentation.slideMasters[0].sldLayoutLst[0];
            }

            if(this.presentation.notesMasters.length === 0)
            {
                this.presentation.notesMasters[0] = AscCommonSlide.CreateNotesMaster();
                var oNotesTheme = this.aThemes[0].createDuplicate();
                oNotesTheme.presentation = this.presentation;
                this.aThemes.push(oNotesTheme);
                this.presentation.notesMasters[0].setTheme(oNotesTheme);
            }
            if (this.presentation.Slides.length == 0)
            {
                //this.presentation.Slides[0] = AscFormat.GenerateDefaultSlide(this.aSlideLayouts[0]);
            }
            var _slides = this.presentation.Slides;
            var _slide;
            for(var i = 0; i < _slides.length; ++i)
            {
                _slide = _slides[i];
                if(!_slide.notes){
                    _slide.setNotes(AscCommonSlide.CreateNotes());
                    _slide.notes.setSlide(_slide);
                    _slide.notes.setNotesMaster(this.presentation.notesMasters[0]);
                }
                else{
                    if(!_slide.notes.Master){
                        _slide.notes.setNotesMaster(this.presentation.notesMasters[0]);
                    }
                }
            }
            //var _editor = this.Api;
            //_editor.sync_InitEditorThemes(_editor.ThemeLoader.Themes.EditorThemes, _editor.ThemeLoader.Themes.DocumentThemes);
        }
        else if (this.Api != null && this.IsThemeLoader)
        {
            var theme_loader = this.Api.ThemeLoader;
            var _info = theme_loader.themes_info_editor[theme_loader.CurrentLoadThemeIndex];
            _info.ImageMap = this.presentation.ImageMap;
            _info.FontMap = this.presentation.Fonts;
        }
    }

    this.ReadMasterInfo = function(indexMaster)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        var master = this.presentation.slideMasters[indexMaster];

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    var indexTh = s.GetULong();
                    master.setTheme(this.aThemes[indexTh]);
                    master.ThemeIndex = -indexTh - 1;
                    break;
                }
                case 1:
                {
                    s.GetString2A();
                    break;
                }
                default:
                    break;
            }
        }

        var _lay_count = s.GetULong();
        for (var i = 0; i < _lay_count; i++)
        {
            s.Skip2(6); // type + len

            while (true)
            {
                var _at = s.GetUChar();
                if (_at == g_nodeAttributeEnd)
                    break;

                switch (_at)
                {
                    case 0:
                    {
                        var indexL = s.GetULong();
                        master.addToSldLayoutLstToPos(master.sldLayoutLst.length, this.aSlideLayouts[indexL]);
                        this.aSlideLayouts[indexL].setMaster( master);
                        break;
                    }
                    case 1:
                    {
                        s.GetString2A();
                        break;
                    }
                    default:
                        break;
                }
            }
        }

        s.Seek2(_end_rec);

        if (this.Api != null && this.IsThemeLoader)
        {
            var theme_loader = this.Api.ThemeLoader;

            var theme_load_info = new CThemeLoadInfo();
            theme_load_info.Master = master;
            theme_load_info.Theme = master.Theme;

            var _lay_cnt = master.sldLayoutLst.length;
            for (var i = 0; i < _lay_cnt; i++)
                theme_load_info.Layouts[i] = master.sldLayoutLst[i];

            theme_loader.themes_info_editor[theme_loader.CurrentLoadThemeIndex] = theme_load_info;
        }
    }

    this.ReadViewProps = function()
    {
        return null;
    }
    this.ReadVmlDrawing = function()
    {
        return null;
    }
    this.ReadPresProps = function(presentation)
    {
        var s = this.stream;

        var _type = s.GetUChar();

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    s.SkipRecord();
                    break;
                }
                case 1:
                {
                    presentation.showPr = this.ReadShowPr();
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
    }
    this.ReadShowPr = function()
    {
        var showPr = new CShowPr();
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    showPr.loop = s.GetBool();
                    break;
                }
                case 1:
                {
                    showPr.showAnimation = s.GetBool();
                    break;
                }
                case 2:
                {
                    showPr.showNarration = s.GetBool();
                    break;
                }
                case 3:
                {
                    showPr.useTimings = s.GetBool();
                    break;
                }
                default:
                    break;
            }
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    //todo browseShowScrollbar
                    showPr.browse = true;
                    s.SkipRecord();
                    break;
                }
                case 1:
                {
                    this.ReadShowPrCustShow(showPr);
                    break;
                }
                case 2:
                {
                    this.ReadShowPrKiosk(showPr);
                    break;
                }
                case 3:
                {
                    showPr.penClr = this.ReadUniColor();
                    break;
                }
                case 4:
                {
                    showPr.present = true;
                    s.SkipRecord();
                    break;
                }
                case 5:
                {
                    if (!showPr.show){
                        showPr.show = {showAll: null, range: null, custShow: null};
                    }
                    showPr.show.showAll = true;
                    s.SkipRecord();
                    break;
                }
                case 6:
                {
                    this.ReadShowPrSldRg(showPr);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return showPr;
    }
    this.ReadShowPrCustShow = function(showPr)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    if (!showPr.show){
                        showPr.show = {showAll: null, range: null, custShow: null};
                    }
                    showPr.show.custShow = s.GetLong();
                    break;
                }
                default:
                    break;
            }
        }

        s.Seek2(_end_rec);
    }
    this.ReadShowPrKiosk = function(showPr)
    {
        showPr.kiosk = {restart: null};
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    showPr.kiosk.restart = s.GetLong();
                    break;
                }
                default:
                    break;
            }
        }

        s.Seek2(_end_rec);
    }
    this.ReadShowPrSldRg = function(showPr)
    {
        if (!showPr.show){
            showPr.show = {showAll: null, range: null, custShow: null};
        }
        showPr.show.range = {start: null, end: null};
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    showPr.show.range.start = s.GetLong();
                    break;
                }
                case 1:
                {
                    showPr.show.range.end = s.GetLong();
                    break;
                }
                default:
                    break;
            }
        }

        s.Seek2(_end_rec);
    }
    this.ReadTableStyles = function()
    {
        //var _styles = this.presentation.globalTableStyles;
        var s = this.stream;

        var _type = s.GetUChar();

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        s.Skip2(1); // start attributes

        var _old_default = this.presentation.DefaultTableStyleId;
        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    var _def = s.GetString2();
                    this.presentation.DefaultTableStyleId = _def;
                    break;
                }
                default:
                    break;
            }
        }

        var _type = s.GetUChar(); // 0!!!
        s.Skip2(4); // len


        while (s.cur < _end_rec)
        {
            s.Skip2(1);
            this.ReadTableStyle();
        }

        if(!this.presentation.globalTableStyles.Style[this.presentation.DefaultTableStyleId])
        {
            this.presentation.DefaultTableStyleId = _old_default;
        }
        s.Seek2(_end_rec);
    }

    this.ReadTableStyle = function(bNotAddStyle)
    {
        var s = this.stream;

        var _style = new CStyle("", null, null, styletype_Table);

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    var _id = s.GetString2();
                   // _style.Id = _id;
					if(AscCommon.isRealObject(this.presentation.TableStylesIdMap) && !bNotAddStyle)
						this.presentation.TableStylesIdMap[_style.Id] = true;
                    this.map_table_styles[_id] = _style;
                    break;
                }
                case 1:
                {
                    _style.Name = s.GetString2();
                    break;
                }
                default:
                    break;
            }
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    var _end_rec2 = s.cur + s.GetLong() + 4;

                    while (s.cur < _end_rec2)
                    {
                        var _at2 = s.GetUChar();
                        switch (_at2)
                        {
                            case 0:
                            {
                                var _end_rec3 = s.cur + s.GetLong() + 4;
                                while (s.cur < _end_rec3)
                                {
                                    var _at3 = s.GetUChar();
                                    switch (_at3)
                                    {
                                        case 0:
                                        {
                                            var _unifill = this.ReadUniFill();
                                            if (_unifill && _unifill.fill !== undefined && _unifill.fill != null)
                                            {
                                                if (undefined === _style.TablePr.Shd || null == _style.TablePr.Shd)
                                                {
                                                    _style.TablePr.Shd = new CDocumentShd();
                                                    _style.TablePr.Shd.Value = c_oAscShdClear;
                                                }
                                                _style.TablePr.Shd.Unifill = _unifill;
                                            }
                                        }
                                        default:
                                        {
                                            s.SkipRecord();
                                            break;
                                        }
                                    }
                                }
                                break;
                            }
                            case 1:
                            {
                                if (undefined === _style.TablePr.Shd || null == _style.TablePr.Shd)
                                {
                                    _style.TablePr.Shd = new CDocumentShd();
                                    _style.TablePr.Shd.Value = c_oAscShdClear;
                                }
                                _style.TablePr.Shd.FillRef = this.ReadStyleRef();
                                break;
                            }
                            default:
                            {
                                s.SkipRecord();
                                break;
                            }
                        }
                    }

                    s.Seek2(_end_rec2);
                    break;
                }
                case 1:
                {
                    _style.TableWholeTable = this.ReadTableStylePart();
                    break;
                }
                case 2:
                {
                    _style.TableBand1Horz = this.ReadTableStylePart();
                    break;
                }
                case 3:
                {
                    _style.TableBand2Horz = this.ReadTableStylePart();
                    break;
                }
                case 4:
                {
                    _style.TableBand1Vert = this.ReadTableStylePart();
                    break;
                }
                case 5:
                {
                    _style.TableBand2Vert = this.ReadTableStylePart();
                    break;
                }
                case 6:
                {
                    _style.TableLastCol = this.ReadTableStylePart();
                    break;
                }
                case 7:
                {
                    _style.TableFirstCol = this.ReadTableStylePart();
                    break;
                }
                case 8:
                {
                    _style.TableFirstRow = this.ReadTableStylePart();
                    break;
                }
                case 9:
                {
                    _style.TableLastRow = this.ReadTableStylePart();
                    break;
                }
                case 10:
                {
                    _style.TableBRCell = this.ReadTableStylePart();
                    break;
                }
                case 11:
                {
                    _style.TableBLCell = this.ReadTableStylePart();
                    break;
                }
                case 12:
                {
                    _style.TableTRCell = this.ReadTableStylePart();
                    break;
                }
                case 13:
                {
                    _style.TableTLCell = this.ReadTableStylePart();
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);

        if(_style.TableWholeTable.TablePr.TableBorders.InsideH)
        {
            _style.TablePr.TableBorders.InsideH = _style.TableWholeTable.TablePr.TableBorders.InsideH;
            delete _style.TableWholeTable.TablePr.TableBorders.InsideH;
        }
        if(_style.TableWholeTable.TablePr.TableBorders.InsideV)
        {
            _style.TablePr.TableBorders.InsideV = _style.TableWholeTable.TablePr.TableBorders.InsideV;
            delete _style.TableWholeTable.TablePr.TableBorders.InsideV;
        }
        if(_style.TableWholeTable.TableCellPr.TableCellBorders.Top)
        {
            _style.TablePr.TableBorders.Top = _style.TableWholeTable.TableCellPr.TableCellBorders.Top;
            delete _style.TableWholeTable.TableCellPr.TableCellBorders.Top;
        }
        if(_style.TableWholeTable.TableCellPr.TableCellBorders.Bottom)
        {
            _style.TablePr.TableBorders.Bottom = _style.TableWholeTable.TableCellPr.TableCellBorders.Bottom;
            delete _style.TableWholeTable.TableCellPr.TableCellBorders.Bottom;
        }
        if(_style.TableWholeTable.TableCellPr.TableCellBorders.Left)
        {
            _style.TablePr.TableBorders.Left = _style.TableWholeTable.TableCellPr.TableCellBorders.Left;
            delete _style.TableWholeTable.TableCellPr.TableCellBorders.Left;
        }
        if(_style.TableWholeTable.TableCellPr.TableCellBorders.Right)
        {
            _style.TablePr.TableBorders.Right = _style.TableWholeTable.TableCellPr.TableCellBorders.Right;
            delete _style.TableWholeTable.TableCellPr.TableCellBorders.Right;
        }
		if(bNotAddStyle)
		{
			return _style;
		}
		else
		{
			if(this.presentation.globalTableStyles)
				this.presentation.globalTableStyles.Add(_style);
		}
    };

    this.ReadTableStylePart = function()
    {
        var s = this.stream;

        var _part = new CTableStylePr();

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    var _end_rec2 = s.cur + s.GetLong() + 4;

                    s.Skip2(1); // start attributes

                    var _i, _b;
                    while (true)
                    {
                        var _at2 = s.GetUChar();
                        if (_at2 == g_nodeAttributeEnd)
                            break;

                        switch (_at2)
                        {
                            case 0:
                            {
                                _i = s.GetUChar();
                                break;
                            }
                            case 1:
                            {
                                _b = s.GetUChar();
                                break;
                            }
                            default:
                                break;
                        }
                    }

                    if(_i === 0)
                    {
                        _part.TextPr.Italic = true;
                    }
                    else if(_i === 1)
                    {
                        _part.TextPr.Italic = false;
                    }

                    if(_b === 0)
                    {
                        _part.TextPr.Bold = true;
                    }
                    else if(_b === 1)
                    {
                        _part.TextPr.Bold = false;
                    }

                    while (s.cur < _end_rec2)
                    {
                        var _at3 = s.GetUChar();
                        switch (_at3)
                        {
                            case 0:
                            {
                                _part.TextPr.FontRef = this.ReadFontRef();
                                break;
                            }
                            case 1:
                            {
                                var _Unicolor = this.ReadUniColor();
                                if(_Unicolor && _Unicolor.color)
                                {
                                    _part.TextPr.Unifill = new AscFormat.CUniFill();
                                    _part.TextPr.Unifill.fill = new AscFormat.CSolidFill();
                                    _part.TextPr.Unifill.fill.color = _Unicolor;
                                }
                                break;
                            }
                            default:
                            {
                                s.SkipRecord();
                                break;
                            }
                        }
                    }

                    s.Seek2(_end_rec2);
                    break;
                }
                case 1:
                {
                    var _end_rec2 = s.cur + s.GetLong() + 4;

                    while (s.cur < _end_rec2)
                    {
                        var _at2 = s.GetUChar();
                        switch (_at2)
                        {
                            case 0:
                            {
                                this.ReadTcBdr(_part);
                                break;
                            }
                            case 1:
                            {
                                if (undefined === _part.TableCellPr.Shd || null == _part.TableCellPr.Shd)
                                {
                                    _part.TableCellPr.Shd = new CDocumentShd();
                                    _part.TableCellPr.Shd.Value = c_oAscShdClear;
                                }
                                _part.TableCellPr.Shd.FillRef = this.ReadStyleRef();
                                break;
                            }
                            case 2:
                            {
                                var _end_rec3 = s.cur + s.GetLong() + 4;
                                while (s.cur < _end_rec3)
                                {
                                    var _at3 = s.GetUChar();
                                    switch (_at3)
                                    {
                                        case 0:
                                        {
                                            var _unifill = this.ReadUniFill();
                                            if (_unifill && _unifill.fill !== undefined && _unifill.fill != null)
                                            {
                                                if (undefined === _part.TableCellPr.Shd || null == _part.TableCellPr.Shd)
                                                {
                                                    _part.TableCellPr.Shd = new CDocumentShd();
                                                    _part.TableCellPr.Shd.Value = c_oAscShdClear;
                                                }
                                                _part.TableCellPr.Shd.Unifill = _unifill;
                                            }
                                            break;
                                        }
                                        default:
                                        {
                                            s.SkipRecord();
                                            break;
                                        }
                                    }
                                }
                                break;
                            }
                            case 3:
                            {
                                s.SkipRecord();
                                break;
                            }
                            default:
                            {
                                s.SkipRecord();
                                break;
                            }
                        }
                    }

                    s.Seek2(_end_rec2);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return _part;
    }

    this.ReadTcBdr = function(_part)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    _part.TableCellPr.TableCellBorders.Left = new CDocumentBorder();
                    this.ReadTableBorderLineStyle(_part.TableCellPr.TableCellBorders.Left);
                    break;
                }
                case 1:
                {
                    _part.TableCellPr.TableCellBorders.Right = new CDocumentBorder();
                    this.ReadTableBorderLineStyle(_part.TableCellPr.TableCellBorders.Right);
                    break;
                }
                case 2:
                {
                    _part.TableCellPr.TableCellBorders.Top = new CDocumentBorder();
                    this.ReadTableBorderLineStyle(_part.TableCellPr.TableCellBorders.Top);
                    break;
                }
                case 3:
                {
                    _part.TableCellPr.TableCellBorders.Bottom = new CDocumentBorder();
                    this.ReadTableBorderLineStyle(_part.TableCellPr.TableCellBorders.Bottom);
                    break;
                }
                case 4:
                {
                    _part.TablePr.TableBorders.InsideH = new CDocumentBorder();
                    this.ReadTableBorderLineStyle(_part.TablePr.TableBorders.InsideH);
                    break;
                }
                case 5:
                {
                    _part.TablePr.TableBorders.InsideV = new CDocumentBorder();
                    this.ReadTableBorderLineStyle(_part.TablePr.TableBorders.InsideV);
                    break;
                }
                case 6:
                case 7:
                {
                    s.SkipRecord();
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return _part;
    }

    this.ReadTableBorderLineStyle = function(_border)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    var ln = this.ReadLn();
                    _border.Unifill = ln.Fill;
                    _border.Size = (ln.w == null) ? 12700 : ((ln.w) >> 0);
                    _border.Size /= 36000;
                    _border.Value = border_Single;
                    break;
                }
                case 1:
                {
                    _border.LineRef = this.ReadStyleRef();
                    _border.Value = border_Single;
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
    }

    // UNICOLOR ---------------------------------

    this.ReadUniColor = function()
    {
        var s = this.stream;
        var _len = s.GetULong();
        var read_start = s.cur;
        var read_end = read_start + _len;

        var uni_color = new AscFormat.CUniColor();

        if (s.cur < read_end)
        {
            var _type = s.GetUChar();

            var _e = s.cur + s.GetULong() + 4;

            switch (_type)
            {
                case c_oAscColor.COLOR_TYPE_PRST:
                {
                    s.Skip2(2);
                    uni_color.setColor(new AscFormat.CPrstColor());
                    uni_color.color.setId(s.GetString2());
                    s.Skip2(1);

                    if (s.cur < _e)
                    {
                        if (0 == s.GetUChar())
                        {
                            uni_color.setMods(this.ReadColorMods());
                        }
                    }

                    break;
                }
                case c_oAscColor.COLOR_TYPE_SCHEME:
                {
                    s.Skip2(2);
                    uni_color.setColor(new AscFormat.CSchemeColor());
                    uni_color.color.setId(s.GetUChar());
                    s.Skip2(1);

                    if (s.cur < _e)
                    {
                        if (0 == s.GetUChar())
                        {
                            uni_color.setMods(this.ReadColorMods());
                        }
                    }

                    break;
                }
                case c_oAscColor.COLOR_TYPE_SRGB:
                {
                    var r, g, b;
                    s.Skip2(1);
                    uni_color.setColor(new AscFormat.CRGBColor());
                    s.Skip2(1);
                    r = s.GetUChar();
                    s.Skip2(1);
                    g = s.GetUChar();
                    s.Skip2(1);
                    b = s.GetUChar();
                    s.Skip2(1);
                    uni_color.color.setColor(r, g, b);
                    if (s.cur < _e)
                    {
                        if (0 == s.GetUChar())
                        {
                            uni_color.setMods(this.ReadColorMods());
                        }
                    }

                    break;
                }
                case c_oAscColor.COLOR_TYPE_SYS:
                {
                    s.Skip2(1);
                    uni_color.setColor(new AscFormat.CSysColor());

                    while (true)
                    {
                        var _at = s.GetUChar();
                        if (_at == g_nodeAttributeEnd)
                            break;

                        switch (_at)
                        {
                            case 0:
                            {
                                uni_color.color.setId(s.GetString2());
                                break;
                            }
                            case 1:
                            {
                                uni_color.color.setR(s.GetUChar());
                                break;
                            }
                            case 2:
                            {
                                uni_color.color.setG(s.GetUChar());
                                break;
                            }
                            case 3:
                            {
                                uni_color.color.setB(s.GetUChar());
                                break;
                            }
                            default:
                                break;
                        }
                    }

                    if (s.cur < _e)
                    {
                        if (0 == s.GetUChar())
                        {
                            uni_color.setMods(this.ReadColorMods());
                        }
                    }

                    break;
                }
            }
        }

        if(!uni_color.color){
            return null;
        }

        s.Seek2(read_end);
        return uni_color;
    }

    this.ReadColorMods = function()
    {
        var ret = new AscFormat.CColorModifiers();
        var _mods = this.ReadColorModifiers();
        if(_mods)
        {
            for(var i = 0; i < _mods.length; ++i)
                ret.addMod(_mods[i]);
        }
        return ret;
    };

    this.ReadColorModifiers = function()
    {
        var s = this.stream;
        var _start = s.cur;
        var _end = _start + s.GetULong() + 4;

        var _ret = null;

        var _count = s.GetULong();
        for (var i = 0; i < _count; i++)
        {
            if (s.cur > _end)
                break;

            s.Skip2(1);

            var _s1 = s.cur;
            var _e1 = _s1 + s.GetULong() + 4;

            if (_s1 < _e1)
            {
                s.Skip2(1);

                if (null == _ret)
                    _ret = [];

                var _mod = new AscFormat.CColorMod();
                _ret[_ret.length] = _mod;

                while (true)
                {
                    var _type = s.GetUChar();

                    if (0 == _type)
                    {
                        _mod.setName(s.GetString2());
                        var _find = _mod.name.indexOf(":");
                        if (_find >= 0 && _find < (_mod.name.length - 1))
                            _mod.setName(_mod.name.substring(_find + 1));
                    }
                    else if (1 == _type)
                        _mod.setVal(s.GetLong());
                    else if (g_nodeAttributeEnd == _type)
                        break;
                    else
                        break;
                }
            }

            s.Seek2(_e1);
        }

        s.Seek2(_end);
        return _ret;
    }

    // ------------------------------------------

    // UNIFILL ----------------------------------

    this.ReadRect = function(bIsMain)
    {
        var _ret = {};

        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    _ret.l = s.GetPercentage();
                    break;
                }
                case 1:
                {
                    _ret.t = s.GetPercentage();
                    break;
                }
                case 2:
                {
                    _ret.r = s.GetPercentage();
                    break;
                }
                case 3:
                {
                    _ret.b = s.GetPercentage();
                    break;
                }
                default:
                    break;
            }
        }

        s.Seek2(_end_rec);

        if (null == _ret.l && null == _ret.t && null == _ret.r && null == _ret.b)
            return null;

        if (_ret.l == null)
            _ret.l = 0;
        if (_ret.t == null)
            _ret.t = 0;
        if (_ret.r == null)
            _ret.r = 0;
        if (_ret.b == null)
            _ret.b = 0;

        if (!bIsMain)
        {
            var _absW = Math.abs(_ret.l) + Math.abs(_ret.r) + 100;
            var _absH = Math.abs(_ret.t) + Math.abs(_ret.b) + 100;

            _ret.l = -100 * _ret.l / _absW;
            _ret.t = -100 * _ret.t / _absH;
            _ret.r = -100 * _ret.r / _absW;
            _ret.b = -100 * _ret.b / _absH;
        }

        _ret.r = 100 - _ret.r;
        _ret.b = 100 - _ret.b;

        if (_ret.l > _ret.r)
        {
            var tmp = _ret.l;
            _ret.l = _ret.r;
            _ret.r = tmp;
        }
        if (_ret.t > _ret.b)
        {
            var tmp = _ret.t;
            _ret.t = _ret.b;
            _ret.b = tmp;
        }
        var ret = new AscFormat.CSrcRect();
        ret.setLTRB(_ret.l, _ret.t, _ret.r, _ret.b);
        return ret;
    }

    this.ReadGradLin = function()
    {
        var _lin = new AscFormat.GradLin();
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    _lin.setAngle(s.GetLong());
                    break;
                }
                case 1:
                {
                    _lin.setScale(s.GetBool());
                }
                default:
                    break;
            }
        }

        s.Seek2(_end_rec);
        return _lin;
    }

    this.ReadGradPath = function()
    {
        var _path = new AscFormat.GradPath();
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    _path.setPath(s.GetUChar());
                    break;
                }
                default:
                    break;
            }
        }

        s.Seek2(_end_rec);
        return _path;
    }


    this.ReadBlur = function()
    {
        var nRecStart, nRecLen, nRecEnd;
        var s = this.stream;
        s.GetULong();
        s.GetUChar();
        nRecStart = s.cur;
        nRecLen = s.GetLong();
        nRecEnd = nRecStart + nRecLen + 4;
        var oEffect = new AscFormat.CBlur();
        s.Skip2(1);

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:	oEffect.rad = s.GetULong(); break;
                case 1:	oEffect.grow = s.GetBool(); break;
            }
        }
        s.Seek2(nRecEnd);
        return oEffect;
    };

    this.ReadFillOverlay = function()
    {
        var s = this.stream;
        s.GetULong();
        s.GetUChar();
        var nRecStart, nRecLen, nRecEnd;
        nRecStart = s.cur;
        nRecLen = s.GetLong();
        nRecEnd = nRecStart + nRecLen + 4;
        var oEffect = new AscFormat.CFillOverlay();
        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (_at == 0)
                oEffect.blend = s.GetUChar();
            else break;
        }

        while (s.cur < nRecEnd)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    oEffect.fill = this.ReadUniFill();
                    break;
                }
                default:
                    break;
            }
        }
        s.Seek2(nRecEnd);
        return oEffect;
    };

    this.ReadGlow = function()
    {
        var s = this.stream;
        s.GetULong();
        s.GetUChar();
        var nRecStart = s.cur;
        var nRecLen = s.GetLong();
        var nRecEnd = nRecStart + nRecLen + 4;
        var oEffect = new AscFormat.CGlow();
        s.Skip2(1);

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (_at == 0)
                oEffect.rad = s.GetLong();
            else break;
        }
        while (s.cur < nRecEnd)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    oEffect.color = this.ReadUniColor();
                    break;
                }
                default:
                    break;
            }
        }

        s.Seek2(nRecEnd);
        return oEffect;
    };

    this.ReadInnerShdw = function()
    {
        var s = this.stream;
        s.GetULong();
        s.GetUChar();
        var nRecStart = s.cur;
        var nRecLen = s.GetLong();
        var nRecEnd = nRecStart + nRecLen + 4;
        var oEffect = new AscFormat.CInnerShdw();
        s.Skip2(1);

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:	oEffect.dir = s.GetLong(); break;
                case 1:	oEffect.dist = s.GetLong(); break;
                case 2:	oEffect.blurRad = s.GetLong(); break;
            }
        }
        while (s.cur < nRecEnd)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    oEffect.color = this.ReadUniColor();
                    break;
                }
                default:
                    break;
            }
        }


        s.Seek2(nRecEnd);
        return oEffect;
    };

    this.ReadOuterShdw = function()
    {
        var s = this.stream;
        s.GetULong();
        s.GetUChar();

        var nRecStart = s.cur;
        var nRecLen = s.GetLong();
        var nRecEnd = nRecStart + nRecLen + 4;
        var oEffect = new AscFormat.COuterShdw();
        s.Skip2(1);

        while (true)
        {
            var  _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0: oEffect.algn = s.GetUChar(); break;
                case 1:	oEffect.blurRad = s.GetLong(); break;
                case 2:	oEffect.dir		= s.GetLong(); break;
                case 3:	oEffect.dist	= s.GetLong(); break;
                case 4:	oEffect.kx		= s.GetLong(); break;
                case 5:	oEffect.ky		= s.GetLong(); break;
                case 6:	oEffect.sx		= s.GetLong(); break;
                case 7:	oEffect.sy		= s.GetLong(); break;
                case 8:	oEffect.rotWithShape = s.GetBool(); break;
            }
        }
        while (s.cur < nRecEnd)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    oEffect.color = this.ReadUniColor();
                    break;
                }
                default:
                    break;
            }
        }
        s.Seek2(nRecEnd);
        return oEffect;
    };

    this.ReadPrstShdw = function()
    {
        var s = this.stream;
        s.GetULong();
        s.GetUChar();
        var nRecStart = s.cur;
        var nRecLen = s.GetLong();
        var nRecEnd = nRecStart + nRecLen + 4;
        var oEffect = new AscFormat.CPrstShdw();
        s.Skip2(1);

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:	oEffect.dir		= s.GetLong(); break;
                case 1:	oEffect.dist	= s.GetLong(); break;
                case 2:	oEffect.prst = s.GetUChar(); break;
            }

        }
        while (s.cur < nRecEnd)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    oEffect.color = this.ReadUniColor();
                    break;
                }
                default:
                    break;
            }
        }
        s.Seek2(nRecEnd);
        return oEffect;
    };

    this.ReadReflection = function()
    {
        var s = this.stream;
        s.GetULong();
        s.GetUChar();
        var nRecStart = s.cur;
        var nRecLen = s.GetLong();
        var nRecEnd = nRecStart + nRecLen + 4;
        var oEffect = new AscFormat.CReflection();
        s.Skip2(1);

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    oEffect.algn = ( s.GetUChar());
                }break;
                case 1:	oEffect.blurRad = s.GetLong(); break;
                case 2:	oEffect.stA		= s.GetLong(); break;
                case 3:	oEffect.endA	= s.GetLong(); break;
                case 4:	oEffect.stPos	= s.GetLong(); break;
                case 5:	oEffect.endPos	= s.GetLong(); break;
                case 6:	oEffect.dir		= s.GetLong(); break;
                case 7:	oEffect.fadeDir	= s.GetLong(); break;
                case 8:	oEffect.dist	= s.GetLong(); break;
                case 9:	oEffect.kx		= s.GetLong(); break;
                case 10:oEffect.ky		= s.GetLong(); break;
                case 11:oEffect.sx		= s.GetLong(); break;
                case 12:oEffect.sy		= s.GetLong(); break;
                case 13:oEffect.rotWithShape = s.GetBool(); break;
            }
        }

        s.Seek2(nRecEnd);
        return oEffect;
    };

    this.ReadSoftEdge = function()
    {
        var s = this.stream;
        s.GetULong();
        s.GetUChar();
        var nRecStart = s.cur;
        var nRecLen = s.GetLong();
        var nRecEnd = nRecStart + nRecLen + 4;
        var oEffect = new AscFormat.CSoftEdge();
        s.Skip2(1);

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (_at == 0) oEffect.rad = s.GetULong();
            else break;
        }

        s.Seek2(nRecEnd);
        return oEffect;
    };

    this.ReadEffect = function()
    {

        var s = this.stream;
        var pos = s.cur;
        var nUniEffectLength = s.GetLong(); // len
        if(nUniEffectLength === 0)
        {
            return null;
        }
        var  nEffectType = s.GetUChar();
        s.Seek2(pos);
        var nRecStart, nRecLen, nRecEnd;
        var oEffect = null;
        switch(nEffectType)
        {
            case 0:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_NONE			=
            }
            case 1:
            {
                oEffect = this.ReadOuterShdw();
                break;//var  EFFECT_TYPE_OUTERSHDW		=
            }
            case 2:
            {
                oEffect = this.ReadGlow();
                break;//var  EFFECT_TYPE_GLOW			=
            }
            case 3:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CDuotone();
                var count = s.GetULong();
                for (var i = 0; i < count; ++i)
                {
                    s.Skip2(1); // type

                    var oUniColor = this.ReadUniColor();
                    if(oUniColor.color)
                    {
                        oEffect.colors.push(oUniColor);
                    }
                }

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_DUOTONE		=
            }
            case 4:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CXfrmEffect();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    switch (_at)
                    {
                        case 0:	oEffect.kx	= s.GetLong(); break;
                        case 1: oEffect.ky	= s.GetLong(); break;
                        case 2: oEffect.sx	= s.GetLong(); break;
                        case 3: oEffect.sy	= s.GetLong(); break;
                        case 4: oEffect.tx	= s.GetULong(); break;
                        case 5: oEffect.ty	= s.GetULong(); break;
                    }
                }

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_XFRM			=
            }
            case 5:
            {
                oEffect = this.ReadBlur();
                break;//var  EFFECT_TYPE_BLUR			=
            }
            case 6:
            {
                oEffect = this.ReadPrstShdw();
                break;//var  EFFECT_TYPE_PRSTSHDW		=
            }
            case 7:
            {
                oEffect = this.ReadInnerShdw();
                break;//var  EFFECT_TYPE_INNERSHDW		=
            }
            case 8:
            {
                oEffect = this.ReadReflection();
                break;//var  EFFECT_TYPE_REFLECTION		=
            }
            case 9:
            {
                oEffect = this.ReadSoftEdge();
                break;//var  EFFECT_TYPE_SOFTEDGE		=
            }
            case 10:
            {
                oEffect = this.ReadFillOverlay();
                break;//var  EFFECT_TYPE_FILLOVERLAY	=
            }
            case 11:
            {
                s.GetLong();
                s.GetUChar();

                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CAlphaCeiling();

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_ALPHACEILING	=
            }
            case 12:
            {
                s.GetLong();
                s.GetUChar();

                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CAlphaFloor();

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_ALPHAFLOOR		=
            }
            case 13:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CTintEffect();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    switch (_at)
                    {
                        case 0:	oEffect.amt = s.GetLong(); break;
                        case 1:	oEffect.hue = s.GetLong(); break;
                    }
                }

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_TINTEFFECT		=
            }
            case 14:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CRelOff();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    switch (_at)
                    {
                        case 0:	oEffect.tx	= s.GetLong(); break;
                        case 1:	oEffect.ty	= s.GetLong(); break;
                    }

                }

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_RELOFF			=
            }
            case 15:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CLumEffect();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    switch (_at)
                    {
                        case 0:	oEffect.bright = s.GetLong(); break;
                        case 1:	oEffect.contrast = s.GetLong(); break;
                    }
                }


                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_LUM			=
            }
            case 16:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CHslEffect();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    switch (_at)
                    {
                        case 0:
                            oEffect.hue = s.GetLong(); break;
                        case 1:
                            oEffect.lum = s.GetLong(); break;
                        case 2:
                            oEffect.sat = s.GetLong(); break;
                    }
                }

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_HSL			=
            }
            case 17:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CGrayscl();

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_GRAYSCL		=
            }
            case 18:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CEffectElement();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    if (_at == 0)
                        oEffect.ref = s.GetString2();
                    else break;
                }

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_ELEMENT		=
            }
            case 19:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CAlphaRepl();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    if (_at == 0)
                        oEffect.a = s.GetLong();
                    else break;
                }

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_ALPHAREPL		=
            }
            case 20:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CAlphaOutset();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    if (_at == 0)
                        oEffect.rad = s.GetULong();
                    else break;
                }

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_ALPHAOUTSET	=
            }
            case 21:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CAlphaModFix();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    if (_at == 0)
                        oEffect.amt = s.GetLong();
                    else break;
                }

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_ALPHAMODFIX	=
            }
            case 22:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CAlphaBiLevel();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    if (_at == 0)
                        oEffect.thresh = s.GetLong();
                    else break;
                }

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_ALPHABILEVEL	=
            }
            case 23:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CBiLevel();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    if (_at == 0)
                        oEffect.thresh = s.GetLong();
                    else break;
                }

                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_BILEVEL		=
            }
            case 24:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CEffectContainer();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    switch (_at)
                    {
                        case 0:
                            oEffect.name = s.GetString2(); break;
                        case 1:
                        {
                            oEffect.type = (s.GetUChar());
                        }break;
                    }
                }
                while (s.cur < nRecEnd)
                {
                    var _at = s.GetUChar();
                    switch (_at)
                    {
                        case 0:
                        {
                            var count_effects2 = s.GetULong();
                            for (var _eff2 = 0; _eff2 < count_effects2; ++_eff2)
                            {
                                s.Skip2(1); // type
                                var eff2 = this.ReadEffect();
                                if(!eff2)
                                {
                                    oEffect.effectList.push(eff2);
                                }
                            }
                        }break;
                        default:
                            break;
                    }
                }


                s.Seek2(nRecEnd);
                break;//var  EFFECT_TYPE_DAG			=
            }
            case 25:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CFillEffect();
                s.Skip2(1); // start attributes

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;
                }

                while (s.cur < nRecEnd)
                {
                    var _at = s.GetUChar();
                    switch (_at)
                    {
                        case 0:
                        {
                            oEffect.fill = this.ReadUniFill();
                            break;
                        }
                        default:
                            break;
                    }
                }

                s.Seek2(nRecEnd);
                break;//var EFFECT_TYPE_FILL			=
            }
            case 26:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CClrRepl();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;
                }
                while (s.cur < nRecEnd)
                {
                    var _at = s.GetUChar();
                    switch (_at)
                    {
                        case 0:
                        {
                            oEffect.color = this.ReadUniColor();
                            break;
                        }
                        default:
                            break;
                    }
                }

                s.Seek2(nRecEnd);
                break;//var EFFECT_TYPE_CLRREPL		=
            }
            case 27:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CClrChange();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    switch (_at)
                    {
                        case 0:
                            oEffect.useA = s.GetBool(); break;
                    }
                }
                while (s.cur < nRecEnd)
                {
                    var _at = s.GetUChar();
                    switch (_at)
                    {
                        case 0:
                        {
                            oEffect.clrFrom = this.ReadUniColor();
                        }break;
                        case 1:
                        {
                            oEffect.clrTo = this.ReadUniColor();
                        }break;
                        default:
                            break;
                    }
                }


                s.Seek2(nRecEnd);
                break;//var EFFECT_TYPE_CLRCHANGE		=
            }
            case 28:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CAlphaInv();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;
                }
                while (s.cur < nRecEnd)
                {
                    var _at = s.GetUChar();
                    switch (_at)
                    {
                        case 0:
                        {
                            oEffect.color = this.ReadUniColor();
                            break;
                        }
                        default:
                            break;
                    }
                }

                s.Seek2(nRecEnd);
                break;//var EFFECT_TYPE_ALPHAINV		=
            }
            case 29:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CAlphaMod();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;
                }
                while (s.cur < nRecEnd)
                {
                    var _at = s.GetUChar();
                    switch (_at)
                    {
                        case 0:
                        {
                            oEffect.cont = this.ReadEffectDag();
                            break;
                        }
                        default:
                            break;
                    }
                }

                s.Seek2(nRecEnd);
                break;//var EFFECT_TYPE_ALPHAMOD		=
            }
            case 30:
            {
                s.GetLong();
                s.GetUChar();
                nRecStart = s.cur;
                nRecLen = s.GetLong();
                nRecEnd = nRecStart + nRecLen + 4;
                oEffect = new AscFormat.CBlend();
                s.Skip2(1);

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    if (_at == 0)
                        oEffect.blend = (s.GetUChar());
                    else break;
                }
                while (s.cur < nRecEnd)
                {
                    var _at = s.GetUChar();
                    switch (_at)
                    {
                        case 0:
                        {
                            oEffect.cont = this.ReadEffectDag();
                            break;
                        }
                        default:
                            break;
                    }
                }

                s.Seek2(nRecEnd);
                break;//var EFFECT_TYPE_BLEND			=
            }
            default:
            {
                s.SkipRecord();
                break;//var
            }
        }

        return oEffect;
    };

    this.ReadEffectDag = function ()
    {
        var s = this.stream;
        s.GetULong();
        s.GetUChar();
        var _start_pos = s.cur;
        var _end_rec = _start_pos + s.GetLong() + 4;
        s.Skip(1);

        var ret = new AscFormat.CEffectContainer();
        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    ret.name = s.GetString2(); break;
                }
                case 1:
                {
                    ret.type = (s.GetUChar()); break;
                }
            }
        }
        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    var count_effects = s.GetULong();
                    for (var _eff = 0; _eff < count_effects; ++_eff)
                    {
                        s.Skip2(1); // type
                        var effect = this.ReadEffect();
                        if(effect)
                        {
                            ret.effectList.push(effect);
                        }
                    }
                }break;
                default:
                    break;
            }
        }

        s.Seek(_end_rec);
        return ret;
    };

    
    this.ReadUniFill = function(oSpPr, oImageShape, oLn)
    {
        var s = this.stream;
        var read_start = s.cur;
        var read_end = read_start + s.GetULong() + 4;

        var uni_fill = new AscFormat.CUniFill();

        if (s.cur < read_end)
        {
            var _type = s.GetUChar();
            var _e = s.cur + s.GetULong() + 4;

            switch (_type)
            {
                case c_oAscFill.FILL_TYPE_BLIP:
                {
                    s.Skip2(1);

                    uni_fill.setFill(new AscFormat.CBlipFill());

                    while (true)
                    {
                        var _at = s.GetUChar();
                        if (_at == g_nodeAttributeEnd)
                            break;

                        switch (_at)
                        {
                            case 0:
                                s.Skip2(4); // dpi
                                break;
                            case 1:
                                s.Skip2(1); // rotWithShape
                                break;
                            default:
                                break;
                        }
                    }

                    while (s.cur < _e)
                    {
                        var rec = s.GetUChar();

                        switch (rec)
                        {
                            case 0:
                            {
                                var _s2 = s.cur;
                                var _e2 = _s2 + s.GetLong() + 4;

                                s.Skip2(1);

                                while (true)
                                {
                                    var _at = s.GetUChar();
                                    if (g_nodeAttributeEnd == _at)
                                        break;

                                    if (_at == 0)
                                        s.Skip2(1);
                                }

                                while (s.cur < _e2)
                                {
                                    var _t = s.GetUChar();

                                    switch (_t)
                                    {
                                        case 0:
                                        case 1:
                                        {
                                            // id. embed / link
                                            s.Skip2(4);
                                            break;
                                        }
                                        case 10:
                                        case 11:
                                        {
                                            // id. embed / link
                                            s.GetString2();
                                            break;
                                        }
                                        case 2:
                                        {
                                            var len2 = s.GetLong();

                                            var  _end_rec_effect = s.cur + len2;

                                            var count_effects = s.GetULong();
                                            for (var _eff = 0; _eff < count_effects; ++_eff)
                                            {

                                                s.Skip2(1); // type
                                                var oEffect = this.ReadEffect();
                                                if(oEffect)
                                                {
                                                    uni_fill.fill.Effects.push(oEffect);
                                                    if(oEffect instanceof AscFormat.CAlphaModFix && AscFormat.isRealNumber(oEffect.amt))
                                                    {
                                                        uni_fill.setTransparent(255 * oEffect.amt / 100000);
                                                    }
                                                }
                                            }
                                            s.Seek2(_end_rec_effect);
                                            break;
                                        }
                                        case 3:
                                        {
                                            s.Skip2(6); // len + start attributes + type

                                            var sReadPath = s.GetString2();
											if (this.IsUseFullUrl && this.insertDocumentUrlsData && this.insertDocumentUrlsData.imageMap) {
												var sReadPathNew = this.insertDocumentUrlsData.imageMap[AscCommon.g_oDocumentUrls.mediaPrefix + sReadPath];
												if(sReadPathNew){
													sReadPath = sReadPathNew;
												}
                                            }
                                            if(this.IsUseFullUrl) {
                                                if(window["native"] && window["native"]["CopyTmpToMedia"]){
                                                    if(!(window.documentInfo && window.documentInfo["iscoauthoring"])){
                                                        var sMedia = window["native"]["CopyTmpToMedia"](sReadPath);
                                                        if(typeof sMedia === "string" && sMedia.length > 0){
                                                            sReadPath = sMedia;
                                                        }
                                                    }
                                                }
                                            }
                                            uni_fill.fill.setRasterImageId(sReadPath);

                                            // TEST version ---------------
                                            var _s = sReadPath;
                                            var indS = _s.lastIndexOf("emf");
                                            if (indS == -1)
                                                indS = _s.lastIndexOf("wmf");

                                            if (indS != -1 && (indS == (_s.length - 3)))
                                            {
                                                _s = _s.substring(0, indS);
                                                _s += "svg";
                                                sReadPath = _s;
                                                uni_fill.fill.setRasterImageId(_s);
                                            }
                                            // ----------------------------

                                            if (this.IsThemeLoader)
                                            {
                                                sReadPath = "theme" + (this.Api.ThemeLoader.CurrentLoadThemeIndex + 1) + "/media/" + sReadPath;
                                                uni_fill.fill.setRasterImageId(sReadPath);
                                            }

                                            if (this.ImageMapChecker != null)
                                                this.ImageMapChecker[sReadPath] = true;

                                            if (this.IsUseFullUrl)
                                                this.RebuildImages.push(new CBuilderImages(uni_fill.fill, sReadPath, oImageShape, oSpPr, oLn));

                                            s.Skip2(1); // end attribute
                                            break;
                                        }
                                        default:
                                        {
                                            s.SkipRecord();
                                            break;
                                        }
                                    }
                                }

                                s.Seek2(_e2);
                                break;
                            }
                            case 1:
                            {
                                uni_fill.fill.setSrcRect(this.ReadRect(true));
                                break;
                            }
                            case 2:
                            {
                                var oBlipTile = new AscFormat.CBlipFillTile();


                                var s = this.stream;

                                var _rec_start = s.cur;
                                var _end_rec = _rec_start + s.GetLong() + 4;

                                s.Skip2(1); // start attributes

                                while (true)
                                {
                                    var _at = s.GetUChar();
                                    if (_at == g_nodeAttributeEnd)
                                break;

                                    switch (_at)
                                    {
                                        case 0:
                                        {
                                            oBlipTile.sx = s.GetLong();
                                            break;
                            }
                                        case 1:
                                        {
                                            oBlipTile.sy = s.GetLong();
                                            break;
                                        }
                                        case 2:
                                        {
                                            oBlipTile.tx = s.GetLong();
                                            break;
                                        }
                            case 3:
                            {
                                            oBlipTile.ty = s.GetLong();
                                            break;
                                        }
                                        case 4:
                                        {
                                            oBlipTile.algn = s.GetUChar();
                                            break;
                                        }
                                        case 5:
                                        {
                                            oBlipTile.flip = s.GetUChar();
                                            break;
                                        }
                                        default:
                                        {
                                            break;
                                        }
                                    }
                                }
                                s.Seek2(_end_rec);
                                uni_fill.fill.setTile(oBlipTile);
                                break;
                            }
                            case 3:
                            {
                                var _e2 = s.cur + s.GetLong() + 4;

                                while (s.cur < _e2)
                                {
                                    var _t = s.GetUChar();

                                    switch (_t)
                                    {
                                        case 0:
                                        {
                                            var _srcRect = this.ReadRect(false);
                                            if (_srcRect != null)
                                                uni_fill.fill.setSrcRect(_srcRect);
                                            break;
                                        }
                                        default:
                                        {
                                            s.SkipRecord();
                                            break;
                                        }
                                    }
                                }

                                s.Seek2(_e2);
                                break;
                            }
                            case 101:
                            {
                              var oBuilderImages = this.RebuildImages[this.RebuildImages.length - 1];
                              if (this.IsUseFullUrl && oBuilderImages) {
                                s.Skip2(4);
                                var urlsCount = s.GetUChar();
                                for (var i = 0; i < urlsCount; ++i) {
                                  oBuilderImages.AdditionalUrls.push(s.GetString2());
                                }
                              } else {
                                s.SkipRecord();
                              }
                              break;
                            }
                            default:
                            {
                                // пока никаких настроек градиента нет
                                var _len = s.GetULong();
                                s.Skip2(_len);
                            }
                        }
                    }

                    break;
                }
                case c_oAscFill.FILL_TYPE_GRAD:
                {
                    s.Skip2(1);

                    uni_fill.setFill(new AscFormat.CGradFill());

                    while (true)
                    {
                        var _at = s.GetUChar();
                        if (_at == g_nodeAttributeEnd)
                            break;

                        switch (_at)
                        {
                            case 0:
                                s.Skip2(1);
                                break;
                            case 1:
                                uni_fill.fill.rotateWithShape = s.GetBool();
                                break;
                            default:
                                break;
                        }
                    }

                    while (s.cur < _e)
                    {
                        var rec = s.GetUChar();

                        switch (rec)
                        {
                            case 0:
                            {
                                var _s1 = s.cur;
                                var _e1 = _s1 + s.GetULong() + 4;

                                var _count = s.GetULong();
                                var colors_ = [];
                                for (var i = 0; i < _count; i++)
                                {
                                    if (s.cur >= _e1)
                                        break;

                                    s.Skip2(1); // type
                                    s.Skip2(4); // len

                                    var _gs = new AscFormat.CGs();

                                    s.Skip2(1); // start attr
                                    s.Skip2(1); // pos type
                                    _gs.pos = s.GetLong();
                                    s.Skip2(1); // end attr

                                    s.Skip2(1);
                                    _gs.color = this.ReadUniColor();

                                    colors_[colors_.length] = _gs;
                                }

                                s.Seek2(_e1);
                                colors_.sort(function(a,b){return a.pos- b.pos;});

                                for(var z = 0; z < colors_.length; ++z)
                                {
                                    uni_fill.fill.addColor(colors_[z]);
                                }
                                break;
                            }
                            case 1:
                            {
                                uni_fill.fill.setLin(this.ReadGradLin());
                                break;
                            }
                            case 2:
                            {
                                uni_fill.fill.setPath(this.ReadGradPath());
                                break;
                            }
                            case 3:
                            {
                                s.SkipRecord();
                                break;
                            }
                            default:
                            {
                                // пока никаких настроек градиента нет
                                var _len = s.GetULong();
                                s.Skip2(_len);
                            }
                        }


                    }
                    if (null != uni_fill.fill.lin && null != uni_fill.fill.path)
                    {
                        // ms office не открывает такие файлы.
                        uni_fill.fill.setPath(null);
                    }

                    if(uni_fill.fill.colors.length < 2)
                    {
                        if(uni_fill.fill.colors.length === 1)
                        {
                            var oUniColor = uni_fill.fill.colors[0].color;
                            uni_fill.fill = new AscFormat.CSolidFill();
                            uni_fill.fill.color = oUniColor;
                        }
                        else
                        {
                            uni_fill.fill = new AscFormat.CSolidFill();
                            uni_fill.fill.color =  AscFormat.CreateUniColorRGB(0, 0, 0);
                        }
                    }

                    break;
                }
                case c_oAscFill.FILL_TYPE_PATT:
                {
                    uni_fill.setFill(new AscFormat.CPattFill());

                    s.Skip2(1);
                    while (true)
                    {
                        var _atPF = s.GetUChar();
                        if (_atPF == g_nodeAttributeEnd)
                            break;

                        switch (_atPF)
                        {
                            case 0:
                            {
                                uni_fill.fill.setFType(s.GetUChar());
                                break;
                            }
                            default:
                                break;
                        }
                    }

                    while (s.cur < _e)
                    {
                        var rec = s.GetUChar();

                        switch (rec)
                        {
                            case 0:
                            {
                                uni_fill.fill.setFgColor(this.ReadUniColor());
                                break;
                            }
                            case 1:
                            {
                                uni_fill.fill.setBgColor(this.ReadUniColor());
                                break;
                            }
                            default:
                            {
                                // пока никаких настроек градиента нет
                                s.SkipRecord();
                            }
                        }
                    }

                    if(uni_fill.fill.fgClr && uni_fill.fill.bgClr)
                    {
                        var fAlphaVal = uni_fill.fill.fgClr.getModValue("alpha");
                        if(fAlphaVal !== null)
                        {
                            if(fAlphaVal === uni_fill.fill.bgClr.getModValue("alpha"))
                            {
                                uni_fill.setTransparent(255 * fAlphaVal / 100000)
                            }
                        }
                    }

                    break;
                }
                case c_oAscFill.FILL_TYPE_SOLID:
                {
                    s.Skip2(1); // type + len

                    uni_fill.setFill(new AscFormat.CSolidFill());
                    uni_fill.fill.setColor(this.ReadUniColor());

//                    uni_fill.fill.color.Mods = new AscFormat.CColorModifiers();
                    if(uni_fill.fill
                        && uni_fill.fill.color
                        && uni_fill.fill.color.Mods
                        && uni_fill.fill.color.Mods.Mods)
                    {
                        var mods = uni_fill.fill.color.Mods.Mods;
                        var _len = mods.length;
                        for (var i = 0; i < _len; i++)
                        {
                            if (mods[i].name == "alpha")
                            {
                                uni_fill.setTransparent(255 * mods[i].val / 100000);
                                uni_fill.fill.color.Mods.removeMod(i);
                                break;
                            }
                        }
                    }
                    else
                    {
                        if(uni_fill.fill.color){
                            uni_fill.fill.color.setMods(new AscFormat.CColorModifiers());
                        }

                    }
                    break;
                }
                case c_oAscFill.FILL_TYPE_NOFILL:
                {
                    uni_fill.setFill(new AscFormat.CNoFill());
                    break;
                }
                case c_oAscFill.FILL_TYPE_GRP:
                {
                    uni_fill.setFill(new AscFormat.CGrpFill());
                    break;
                }
            }
        }

        s.Seek2(read_end);
        if(!uni_fill.fill){
            return null;
        }
        return uni_fill;
    }

    // ------------------------------------------

    // COLOR SCHEME -----------------------------

    this.ReadExtraColorScheme = function()
    {
        var extra = new AscFormat.ExtraClrScheme();

        var s = this.stream;
        var _e = s.cur + s.GetULong() + 4;

        while (s.cur < _e)
        {
            var _rec = s.GetUChar();

            switch (_rec)
            {
                case 0:
                {
                    extra.setClrScheme(new AscFormat.ClrScheme());
                    this.ReadClrScheme(extra.clrScheme);
                    break;
                }
                case 1:
                {
                    extra.setClrMap(new AscFormat.ClrMap());
                    this.ReadClrMap(extra.clrMap);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_e);
        return extra;
    }

    this.ReadClrScheme = function(clrscheme)
    {
        var s = this.stream;
        var _e = s.cur + s.GetULong() + 4;

        s.Skip2(1); // start attribute

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                clrscheme.setName(s.GetString2());
        }

        while (s.cur < _e)
        {
            var _rec = s.GetUChar();

            clrscheme.addColor(_rec,this.ReadUniColor());
        }

        s.Seek2(_e);
    }

    this.ReadClrMap = function(clrmap)
    {
        var s = this.stream;
        var _e = s.cur + s.GetULong() + 4;

        s.Skip2(1); // start sttribute

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            clrmap.setClr(_at, s.GetUChar());
        }

        s.Seek2(_e);
    }

    this.ReadClrOverride = function()
    {
        var s = this.stream;
        var _e = s.cur + s.GetULong() + 4;

        var clr_map = null;
        if (s.cur < _e)
        {
            clr_map = new AscFormat.ClrMap();
            s.Skip2(1); // "0"-rectype
            this.ReadClrMap(clr_map);
        }

        s.Seek2(_e);
        return clr_map;
    }

    // ------------------------------------------

    // LINE PROPERTIES --------------------------

    this.ReadLn = function(spPr)
    {
        var ln = new AscFormat.CLn();

        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;


        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    ln.setAlgn(s.GetUChar());
                    break;
                }
                case 1:
                {
                    ln.setCap(s.GetUChar());
                    break;
                }
                case 2:
                {
                    ln.setCmpd(s.GetUChar());
                    break;
                }
                case 3:
                {
                    ln.setW(s.GetLong());
                    break;
                }
                default:
                    break;
            }
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    // themeElements
                    ln.setFill(this.ReadUniFill(spPr, null, ln));
                    break;
                }
                case 1:
                {
                    ln.setPrstDash(this.ReadLineDash());
                    break;
                }
                case 2:
                {
                    ln.setJoin(this.ReadLineJoin());
                    break;
                }
                case 3:
                {
                    ln.setHeadEnd(this.ReadLineEnd());
                    break;
                }
                case 4:
                {
                    ln.setTailEnd(this.ReadLineEnd());
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return ln;
    }

    this.ReadLineEnd = function()
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        var endL = new AscFormat.EndArrow();

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    endL.setType(s.GetUChar());
                    break;
                }
                case 1:
                {
                    endL.setW(s.GetUChar());
                    break;
                }
                case 2:
                {
                    endL.setLen(s.GetUChar());
                    break;
                }
                default:
                    break;
            }
        }

        s.Seek2(_end_rec);
        return endL;
    }

    this.ReadLineDash = function()
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        var _dash = 6; // solid

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    _dash = s.GetUChar();
                    break;
                }
                default:
                    break;
            }
        }

        s.Seek2(_end_rec);
        return _dash;
    }

    this.ReadLineJoin = function()
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        var join = new AscFormat.LineJoin();

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    join.setType(s.GetLong());
                    break;
                }
                case 1:
                {
                    join.setLimit(s.GetLong());
                    break;
                }
                default:
                    break;
            }
        }

        s.Seek2(_end_rec);
        return join;
    }

    // ------------------------------------------

    // SLIDE MASTER -----------------------------

    this.ReadSlideMaster = function()
    {
        var master = new MasterSlide(this.presentation, null);
        this.TempMainObject = master;

        var s = this.stream;

        s.Skip2(1); // type
        var end = s.cur + s.GetULong() + 4;

        s.Skip2(1); // attribute start
        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    master.preserve = s.GetBool();
                    break;
                }
                default:
                    break;
            }
        }

        while (s.cur < end)
        {
            var _rec = s.GetUChar();

            switch (_rec)
            {
                case 0:
                {
                    var cSld = new AscFormat.CSld();
                    this.ReadCSld(cSld);
                    for(var i = 0; i < cSld.spTree.length; ++i)
                    {
                        master.shapeAdd(i, cSld.spTree[i]);
                    }
                    if(cSld.Bg)
                    {
                        master.changeBackground(cSld.Bg);
                    }
                    master.setCSldName(cSld.name);
                    break;
                }
                case 1:
                {
                    var clrMap = new AscFormat.ClrMap();
                    this.ReadClrMap(clrMap);
                    master.setClMapOverride(clrMap);
                    break;
                }
                case 2:
                case 3:
                case 4:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
                case 5:
                {
                    master.setHF(this.ReadHF());
                    break;
                }
                case 6:
                {
                    master.setTxStyles(this.ReadTxStyles());
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(end);
        this.TempMainObject = null;
        return master;
    }

    this.ReadTxStyles = function()
    {
        var txStyles = new AscFormat.CTextStyles();

        var s = this.stream;
        var end = s.cur + s.GetULong() + 4;

        while (s.cur < end)
        {
            var _rec = s.GetUChar();

            switch (_rec)
            {
                case 0:
                {
                    txStyles.titleStyle = this.ReadTextListStyle();
                    break;
                }
                case 1:
                {
                    txStyles.bodyStyle = this.ReadTextListStyle();
                    break;
                }
                case 2:
                {
                    txStyles.otherStyle = this.ReadTextListStyle();
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(end);
        return txStyles;
    }

    // ------------------------------------------

    // SLIDE LAYOUT -----------------------------

    this.ReadSlideLayout = function()
    {
        var layout = new SlideLayout(null);
        this.TempMainObject = layout;

        var s = this.stream;

        s.Skip2(1); // type
        var end = s.cur + s.GetULong() + 4;

        s.Skip2(1); // attribute start
        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    layout.setMatchingName(s.GetString2());
                    break;
                }
                case 1:
                {
                    layout.preserve = s.GetBool();
                    break;
                }
                case 2:
                {
                    layout.setShowPhAnim(s.GetBool());
                    break;
                }
                case 3:
                {
                    layout.setShowMasterSp(s.GetBool());
                    break;
                }
                case 4:
                {
                    layout.userDrawn = s.GetBool();
                    break;
                }
                case 5:
                {
                    layout.setType(s.GetUChar());
                    break;
                }
                default:
                    break;
            }
        }

        while (s.cur < end)
        {
            var _rec = s.GetUChar();

            switch (_rec)
            {
                case 0:
                {
                    var cSld = new AscFormat.CSld();
                    this.ReadCSld(cSld);
                    for(var i = 0; i < cSld.spTree.length; ++i)
                    {
                        layout.shapeAdd(i, cSld.spTree[i]);
                    }
                    if(cSld.Bg)
                    {
                        layout.changeBackground(cSld.Bg);
                    }
                    layout.setCSldName(cSld.name);
                    break;
                }
                case 1:
                {
                    layout.setClMapOverride(this.ReadClrOverride());
                    break;
                }
                case 4:
                {
                    layout.setHF(this.ReadHF());
                    break;
                }
                default:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
            }
        }

        s.Seek2(end);
        this.TempMainObject = null;
        return layout;
    }

    // ------------------------------------------

    // SLIDE ------------------------------------

    this.ReadSlide = function(sldIndex)
    {
        var slide = new Slide(this.presentation, null, sldIndex);
        this.TempMainObject = slide;

        slide.maxId = -1;
        var s = this.stream;
        s.Skip2(1); // type
        var end = s.cur + s.GetULong() + 4;

        s.Skip2(1); // attribute start
        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                slide.setShow(s.GetBool());
            else if (1 == _at)
                slide.setShowPhAnim(s.GetBool());
            else if (2 == _at)
                slide.setShowMasterSp(s.GetBool());
        }

        while (s.cur < end)
        {
            var _rec = s.GetUChar();

            switch (_rec)
            {
                case 0:
                {
                    var cSld = new AscFormat.CSld();
                    this.ReadCSld(cSld);
                    for(var i = 0; i < cSld.spTree.length; ++i)
                    {
                        slide.shapeAdd(i, cSld.spTree[i]);
                    }
                    if(cSld.Bg)
                    {
                        slide.changeBackground(cSld.Bg);
                    }
                    slide.setCSldName(cSld.name);
                    break;
                }
                case 1:
                {
                    slide.setClMapOverride(this.ReadClrOverride());
                    break;
                }
                case 2:
                {
                    var _timing = this.ReadTransition();
                    slide.applyTiming(_timing);
                    break;
                }
                case 4:
                {
                    this.ReadComments(slide.writecomments);
                    break;
                }
                default:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
            }
        }

        slide.Load_Comments(this.presentation.CommentAuthors);

        s.Seek2(end);
        this.TempMainObject = null;
        return slide;
    }

    this.ReadComments = function(writecomments)
    {
        var s = this.stream;
        var end2 = s.cur + s.GetLong() + 4;
        while (s.cur < end2)
        {
            var _rec2 = s.GetUChar();
            switch (_rec2)
            {
                case 0:
                {
                    s.Skip2(4); // len
                    var lCount = s.GetULong();

                    for (var i = 0; i < lCount; i++)
                    {
                        s.Skip2(1);

                        var _comment = new AscCommon.CWriteCommentData();

                        var _end_rec3 = s.cur + s.GetLong() + 4;

                        s.Skip2(1); // start attributes
                        while (true)
                        {
                            var _at3 = s.GetUChar();
                            if (_at3 == g_nodeAttributeEnd)
                                break;

                            switch (_at3)
                            {
                                case 0:
                                    _comment.WriteAuthorId = s.GetLong();
                                    break;
                                case 1:
                                    _comment.WriteTime = s.GetString2();
                                    break;
                                case 2:
                                    _comment.WriteCommentId = s.GetLong();
                                    break;
                                case 3:
                                    _comment.x = s.GetLong();
                                    break;
                                case 4:
                                    _comment.y = s.GetLong();
                                    break;
                                case 5:
                                    _comment.WriteText = s.GetString2();
                                    break;
                                case 6:
                                    _comment.WriteParentAuthorId = s.GetLong();
                                    break;
                                case 7:
                                    _comment.WriteParentCommentId = s.GetLong();
                                    break;
                                case 8:
                                    _comment.AdditionalData = s.GetString2();
                                    break;
                                default:
                                    break;
                            }
                        }

                        while (s.cur < _end_rec3)
                        {
                            var _rec3 = s.GetUChar();
                            switch (_rec3)
                            {
                                case 0:
                                {
                                    var _end_rec4 = s.cur + s.GetLong() + 4;
                                    s.Skip2(1); // start attributes
                                    while (true)
                                    {
                                        var _at = s.GetUChar();
                                        if (_at == g_nodeAttributeEnd)
                                            break;

                                        switch (_at)
                                        {
                                            case 9: { _comment.timeZoneBias = s.GetLong(); break; }
                                            default:
                                                return;
                                        }
                                    }
                                    s.Seek2(_end_rec4);
                                    break;
                                }
                                default:
                                {
                                    s.SkipRecord();
                                    break;
                                }
                            }
                        }

                        s.Seek2(_end_rec3);

                        _comment.Calculate2();
                        writecomments.push(_comment);
                    }

                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(end2);
    }

    this.ReadTransition = function()
    {
        var _timing = new CAscSlideTiming();
        _timing.setDefaultParams();

        var s = this.stream;
        var end = s.cur + s.GetULong() + 4;

        if (s.cur == end)
            return _timing;

        s.Skip2(1); // attribute start
        var _presentDuration = false;
        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
            {
                _timing.SlideAdvanceOnMouseClick = s.GetBool();
            }
            else if (1 == _at)
            {
                _timing.SlideAdvanceAfter = true;
                _timing.SlideAdvanceDuration = s.GetULong();
            }
            else if (2 == _at)
            {
                _timing.TransitionDuration = s.GetULong();
                _presentDuration = true;
            }
            else if (3 == _at)
            {
                var _spd = s.GetUChar();
                if (!_presentDuration)
                {
                    _timing.TransitionDuration = 250;
                    if (_spd == 1)
                        _timing.TransitionDuration = 500;
                    else if (_spd == 2)
                        _timing.TransitionDuration = 750;
                }
            }
        }

        while (s.cur < end)
        {
            var _rec = s.GetUChar();

            switch (_rec)
            {
                case 0:
                {
                    var _type = "";
                    var _paramNames = [];
                    var _paramValues = [];

                    var _end_rec2 = s.cur + s.GetULong() + 4;

                    s.Skip2(1); // start attributes
                    while (true)
                    {
                        var _at2 = s.GetUChar();
                        if (_at2 == g_nodeAttributeEnd)
                            break;

                        switch (_at2)
                        {
                            case 0:
                            {
                                _type = s.GetString2();
                                break;
                            }
                            case 1:
                            {
                                _paramNames.push(s.GetString2());
                                break;
                            }
                            case 2:
                            {
                                _paramValues.push(s.GetString2());
                                break;
                            }
                            default:
                                break;
                        }
                    }

                    if (_paramNames.length == _paramValues.length && _type != "")
                    {
                        var _len = _paramNames.length;
                        // тут все поддерживаемые переходы
                        if ("p:fade" == _type)
                        {
                            _timing.TransitionType = c_oAscSlideTransitionTypes.Fade;
                            _timing.TransitionOption = c_oAscSlideTransitionParams.Fade_Smoothly;

                            if (1 == _len && _paramNames[0] == "thruBlk" && _paramValues[0] == "1")
                            {
                                _timing.TransitionOption = c_oAscSlideTransitionParams.Fade_Through_Black;
                            }
                        }
                        else if ("p:push" == _type)
                        {
                            _timing.TransitionType = c_oAscSlideTransitionTypes.Push;
                            _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Bottom;

                            if (1 == _len && _paramNames[0] == "dir")
                            {
                                if ("l" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Right;
                                if ("r" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Left;
                                if ("d" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Top;
                            }
                        }
                        else if ("p:wipe" == _type)
                        {
                            _timing.TransitionType = c_oAscSlideTransitionTypes.Wipe;
                            _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Right;

                            if (1 == _len && _paramNames[0] == "dir")
                            {
                                if ("u" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Bottom;
                                if ("r" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Left;
                                if ("d" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Top;
                            }
                        }
                        else if ("p:strips" == _type)
                        {
                            _timing.TransitionType = c_oAscSlideTransitionTypes.Wipe;
                            _timing.TransitionOption = c_oAscSlideTransitionParams.Param_TopRight;

                            if (1 == _len && _paramNames[0] == "dir")
                            {
                                if ("rd" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_TopLeft;
                                if ("ru" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_BottomLeft;
                                if ("lu" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_BottomRight;
                            }
                        }
                        else if ("p:cover" == _type)
                        {
                            _timing.TransitionType = c_oAscSlideTransitionTypes.Cover;
                            _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Right;

                            if (1 == _len && _paramNames[0] == "dir")
                            {
                                if ("u" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Bottom;
                                if ("r" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Left;
                                if ("d" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Top;
                                if ("rd" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_TopLeft;
                                if ("ru" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_BottomLeft;
                                if ("lu" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_BottomRight;
                                if ("ld" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_TopRight;
                            }
                        }
                        else if ("p:pull" == _type)
                        {
                            _timing.TransitionType = c_oAscSlideTransitionTypes.UnCover;
                            _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Right;

                            if (1 == _len && _paramNames[0] == "dir")
                            {
                                if ("u" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Bottom;
                                if ("r" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Left;
                                if ("d" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_Top;
                                if ("rd" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_TopLeft;
                                if ("ru" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_BottomLeft;
                                if ("lu" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_BottomRight;
                                if ("ld" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Param_TopRight;
                            }
                        }
                        else if ("p:split" == _type)
                        {
                            _timing.TransitionType = c_oAscSlideTransitionTypes.Split;

                            var _is_vert = true;
                            var _is_out = true;

                            for (var i = 0; i < _len; i++)
                            {
                                if (_paramNames[i] == "orient")
                                {
                                    _is_vert = (_paramValues[i] == "vert") ? true : false;
                                }
                                else if (_paramNames[i] == "dir")
                                {
                                    _is_out = (_paramValues[i] == "out") ? true : false;
                                }
                            }

                            if (_is_vert)
                            {
                                if (_is_out)
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Split_VerticalOut;
                                else
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Split_VerticalIn;
                            }
                            else
                            {
                                if (_is_out)
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Split_HorizontalOut;
                                else
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Split_HorizontalIn;
                            }
                        }
                        else if ("p:wheel" == _type)
                        {
                            _timing.TransitionType = c_oAscSlideTransitionTypes.Clock;
                            _timing.TransitionOption = c_oAscSlideTransitionParams.Clock_Clockwise;
                        }
                        else if ("p14:wheelReverse" == _type)
                        {
                            _timing.TransitionType = c_oAscSlideTransitionTypes.Clock;
                            _timing.TransitionOption = c_oAscSlideTransitionParams.Clock_Counterclockwise;
                        }
                        else if ("p:wedge" == _type)
                        {
                            _timing.TransitionType = c_oAscSlideTransitionTypes.Clock;
                            _timing.TransitionOption = c_oAscSlideTransitionParams.Clock_Wedge;
                        }
                        else if ("p14:warp" == _type)
                        {
                            _timing.TransitionType = c_oAscSlideTransitionTypes.Zoom;
                            _timing.TransitionOption = c_oAscSlideTransitionParams.Zoom_Out;

                            if (1 == _len && _paramNames[0] == "dir")
                            {
                                if ("in" == _paramValues[0])
                                    _timing.TransitionOption = c_oAscSlideTransitionParams.Zoom_In;
                            }
                        }
                        else if ("p:newsflash" == _type)
                        {
                            _timing.TransitionType = c_oAscSlideTransitionTypes.Zoom;
                            _timing.TransitionOption = c_oAscSlideTransitionParams.Zoom_AndRotate;
                        }
                        else if ("p:none" != _type)
                        {
                            _timing.TransitionType = c_oAscSlideTransitionTypes.Fade;
                            _timing.TransitionOption = c_oAscSlideTransitionParams.Fade_Smoothly;
                        }
                    }

                    s.Seek2(_end_rec2);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(end);
        return _timing;
    }

    this.ReadHF = function()
    {
        var hf = new AscFormat.HF();

        var s = this.stream;
        var _e = s.cur + s.GetULong() + 4;

        s.Skip2(1); // attribute start
        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                hf.setDt(s.GetBool());
            else if (1 == _at)
                hf.setFtr(s.GetBool());
            else if (2 == _at)
                hf.setHdr(s.GetBool());
            else if (3 == _at)
                hf.setSldNum(s.GetBool());
        }

        s.Seek2(_e);
        return hf;
    }

    // ------------------------------------------

    this.ReadNoteMaster = function()
    {

        var oNotesMaster = new AscCommonSlide.CNotesMaster();
        this.TempMainObject = oNotesMaster;
        this.stream.Skip2(1); // type
        var end = this.stream.cur + this.stream.GetLong() + 4;
        while(this.stream.cur < end){
            var at = this.stream.GetUChar();
            switch (at)
            {
                case 0:
                {
                    var cSld = new AscFormat.CSld();
                    this.ReadCSld(cSld);
                    for(var i = 0; i < cSld.spTree.length; ++i){
                        oNotesMaster.addToSpTreeToPos(i, cSld.spTree[i]);
                    }
                    if(cSld.Bg)
                    {
                        oNotesMaster.changeBackground(cSld.Bg);
                    }
                    oNotesMaster.setCSldName(cSld.name);
                    break;
                }
                case 1:
                {
                    this.ReadClrMap(oNotesMaster.clrMap);
                    break;
                }
                case 2:
                {
                    oNotesMaster.setHF(this.ReadHF());
                    break;
                }
                case 3:
                {

                    oNotesMaster.setNotesStyle(this.ReadTextListStyle());
                    break;
                }
                default:
                {
                    this.stream.SkipRecord();
                    break;
                }
            }
        }

        this.stream.Seek2(end);
        this.TempMainObject = null;
        return oNotesMaster;
    }

    this.ReadNote = function()
    {
        var oNotes = new AscCommonSlide.CNotes();
        this.TempMainObject = oNotes;
        var _s = this.stream;
        _s.Skip2(1); // type
        var _end = _s.cur + _s.GetLong() + 4;

        _s.Skip2(1); // attribute start
        while (true)
        {
            var _at = _s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                oNotes.setShowMasterPhAnim(_s.GetBool());
            else if (1 == _at)
                oNotes.setShowMasterSp(_s.GetBool());
        }

        while (_s.cur < _end)
        {
            var _rec = _s.GetUChar();

            switch (_rec)
            {
                case 0:
                {
                    var cSld = new AscFormat.CSld();
                    this.ReadCSld(cSld);
                    for(var i = 0; i < cSld.spTree.length; ++i){
                        oNotes.addToSpTreeToPos(i, cSld.spTree[i]);
                    }
                    if(cSld.Bg)
                    {
                        oNotes.changeBackground(cSld.Bg);
                    }
                    oNotes.setCSldName(cSld.name);
                    break;
                }
                case 1:
                {
                    oNotes.setClMapOverride(this.ReadClrOverride());
                    break;
                }
                default:
                {
                    _s.SkipRecord();
                    break;
                }
            }
        }
        this.TempMainObject = null;
        _s.Seek2(_end);
        return oNotes;
    }

    this.ReadCSld = function(csld)
    {
        var s = this.stream;
        var _end_rec = s.cur + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                csld.name = s.GetString2();
            else
                break;
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    // themeElements
                    csld.Bg = this.ReadBg();
                    break;
                }
                case 1:
                {
                    // SHAPES
                    this.ClearConnectorsMaps();
                    csld.spTree = this.ReadGroupShapeMain();
                    this.AssignConnectorsId();
                    break;
                }
                default:
                {
                    s.Seek2(_end_rec);
                    return;
                }
            }
        }

        s.Seek2(_end_rec);
    }

    this.ReadBg = function()
    {
        var bg = new AscFormat.CBg();

        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                bg.bwMode = s.GetUChar();
            else
                break;
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    // themeElements
                    bg.bgPr = this.ReadBgPr();
                    break;
                }
                case 1:
                {
                    bg.bgRef = this.ReadStyleRef();
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return bg;
    }

    this.ReadBgPr = function()
    {
        var bgpr = new AscFormat.CBgPr();

        var s = this.stream;
        var _end_rec = s.cur + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                bgpr.shadeToTitle = s.GetBool();
            else
                break;
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    // themeElements
                    bgpr.Fill = this.ReadUniFill();
                    break;
                }
                case 1:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return bgpr;
    }

    this.ReadStyleRef = function()
    {
        var ref = new AscFormat.StyleRef();

        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                ref.setIdx(s.GetLong());
            else
                break;
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    // themeElements
                    ref.setColor(this.ReadUniColor());
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return ref;
    }

    this.ReadFontRef = function()
    {
        var ref = new AscFormat.FontRef();

        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                ref.setIdx(s.GetUChar());
            else
                break;
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    // themeElements
                    ref.setColor(this.ReadUniColor());
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return ref;
    }

    // THEME ------------------------------------

    this.ReadTheme = function()
    {
        var theme = new AscFormat.CTheme();
        theme.presentation = this.presentation;

        var s = this.stream;
        var type = s.GetUChar();

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;


        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                theme.setName(s.GetString2());
            else if (1 == _at)
                theme.setIsThemeOverride(s.GetBool());
            else
                break;
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    // themeElements
                    var themeElements = new AscFormat.ThemeElements();
                    this.ReadThemeElements(themeElements);
                    theme.setFontScheme(themeElements.fontScheme);
                    theme.setFormatScheme(themeElements.fmtScheme);
                    theme.setColorScheme(themeElements.clrScheme);

                    break;
                }
                case 1:
                {
                    theme.setSpDef(this.ReadDefaultShapeProperties());
                    break;
                }
                case 2:
                {
                    theme.setLnDef(this.ReadDefaultShapeProperties());
                    break;
                }
                case 3:
                {
                    theme.setTxDef(this.ReadDefaultShapeProperties());
                    break;
                }
                case 4:
                {
                    s.Skip2(4); // len
                    var _len = s.GetULong();
                    for (var i = 0; i < _len; i++)
                    {
                        s.Skip2(1); // type
                        theme.extraClrSchemeLst[i] = this.ReadExtraColorScheme();
                    }
                }
            }
        }

        s.Seek2(_end_rec);
        return theme;
    }

    this.ReadThemeElements = function(thelems)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    this.ReadClrScheme(thelems.clrScheme);
                    break;
                }
                case 1:
                {
                    this.ReadFontScheme(thelems.fontScheme);
                    break;
                }
                case 2:
                {
                    this.ReadFmtScheme(thelems.fmtScheme);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
    }

    this.ReadFontScheme = function(fontscheme)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                fontscheme.setName(s.GetString2());
            else
                break;
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    this.ReadFontCollection(fontscheme.majorFont);
                    break;
                }
                case 1:
                {
                    this.ReadFontCollection(fontscheme.minorFont);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
    }

    this.ReadFontCollection = function(fontcolls)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    fontcolls.setLatin(this.ReadTextFontTypeface());
                    break;
                }
                case 1:
                {
                    fontcolls.setEA(this.ReadTextFontTypeface());
                    break;
                }
                case 2:
                {
                    fontcolls.setCS(this.ReadTextFontTypeface());
                    break;
                }
                case 3:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
    }

    this.ReadTextFontTypeface = function()
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        var charset = "";
        var panose = "";
        var pitchFamily = "";
        var typeface = "";

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    charset = s.GetString2();
                    break;
                }
                case 1:
                {
                    panose = s.GetString2();
                    break;
                }
                case 2:
                {
                    pitchFamily = s.GetString2();
                    break;
                }
                case 3:
                {
					typeface = s.GetString2();
                    break;
                }
                default:
                    break;
            }
        }

        s.Seek2(_end_rec);

        return typeface;
    }

    this.ReadFmtScheme = function(fmt)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                fmt.setName(s.GetString2());
            else
                break;
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    s.Skip2(4); // len
                    var _c = s.GetULong();

                    for (var i = 0; i < _c; i++)
                    {
                        s.Skip2(1); // type
                        fmt.fillStyleLst[i] = this.ReadUniFill();
                    }

                    break;
                }
                case 1:
                {
                    s.Skip2(4); // len
                    var _c = s.GetULong();

                    for (var i = 0; i < _c; i++)
                    {
                        s.Skip2(1); // type1
                        fmt.lnStyleLst[i] = this.ReadLn();
                    }
                    break;
                }
                case 2:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
                case 3:
                {
                    s.Skip2(4); // len
                    var _c = s.GetULong();

                    for (var i = 0; i < _c; i++)
                    {
                        s.Skip2(1); // type
                        fmt.bgFillStyleLst[i] = this.ReadUniFill();
                    }
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
    }

    this.ReadDefaultShapeProperties = function()
    {
        var def = new AscFormat.DefaultShapeDefinition();

        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    this.ReadSpPr(def.spPr);
                    break;
                }
                case 1:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);

                    // bodyPr
                    break;
                }
                case 2:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);

                    // textstyles
                    break;
                }
                case 3:
                {
                    def.style = this.ReadShapeStyle();
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return def;
    }

    this.ReadEffectLst = function()
    {
        var s = this.stream;
        s.GetULong();
        s.GetUChar();
        var nRecStart = s.cur;
        var nRecLen = s.GetLong();
        var nRecEnd = nRecStart + nRecLen + 4;
        var oEffectLst = new AscFormat.CEffectLst();

        while (s.cur < nRecEnd)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    oEffectLst.blur = this.ReadBlur();
                    break;
                }
                case 1:
                {
                    oEffectLst.fillOverlay = this.ReadFillOverlay();
                    break;
                }
                case 2:
                {
                    oEffectLst.glow = this.ReadGlow();
                    break;
                }
                case 3:
                {
                    oEffectLst.innerShdw = this.ReadInnerShdw();
                    break;
                }
                case 4:
                {
                    oEffectLst.outerShdw = this.ReadOuterShdw();
                    break;
                }
                case 5:
                {
                    oEffectLst.prstShdw = this.ReadPrstShdw();
                    break;
                }
                case 6:
                {
                    oEffectLst.reflection = this.ReadReflection();
                    break;
                }
                case 7:
                {
                    oEffectLst.softEdge = this.ReadSoftEdge();
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }
        s.Seek2(nRecEnd);
        return oEffectLst;
    };

    this.ReadEffectProperties = function()
    {
        var s = this.stream;
        var pos = s.cur;
        var nLength = s.GetLong();
        if(nLength === 0)
        {
            return null;
        }
        var type = s.GetUChar();
        s.Seek2(pos);
        var oEffectProperties = new AscFormat.CEffectProperties();
        if(type === 1)
        {
            oEffectProperties.EffectLst = this.ReadEffectLst();
        }
        else
        {

            oEffectProperties.EffectDag = this.ReadEffectDag();
        }
        return oEffectProperties;
    };

    this.ReadSpPr = function(spPr)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                spPr.setBwMode(s.GetUChar());
            else
                break;
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    spPr.setXfrm(this.ReadXfrm());
                    spPr.xfrm.setParent(spPr);
                    break;
                }
                case 1:
                {
                    var oGeometry = this.ReadGeometry(spPr.xfrm);
                    if(oGeometry && oGeometry.pathLst.length > 0)
                        spPr.setGeometry(oGeometry);
                    break;
                }
                case 2:
                {
                    spPr.setFill(this.ReadUniFill(spPr, null, null));
                    break;
                }
                case 3:
                {
                    spPr.setLn(this.ReadLn(spPr));
                    break;
                }
                case 4:
                {
                    spPr.setEffectPr(this.ReadEffectProperties());
                    break;
                }
                case 5:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
                case 6:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
    }

    this.ReadGrSpPr = function(spPr)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            if (0 == _at)
                spPr.setBwMode(s.GetUChar());
            else
                break;
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    spPr.setXfrm(this.ReadXfrm());
                    spPr.xfrm.setParent(spPr);
                    break;
                }
                case 1:
                {
                    spPr.setFill(this.ReadUniFill(spPr, null, null));
                    break;
                }
                case 2:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
                case 3:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
    }

    this.ReadXfrm = function()
    {
        var ret = new AscFormat.CXfrm();

        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    ret.setOffX(s.GetLong() / c_dScalePPTXSizes);
                    break;
                }
                case 1:
                {
                    ret.setOffY(s.GetLong() / c_dScalePPTXSizes);
                    break;
                }
                case 2:
                {
                    ret.setExtX(s.GetLong() / c_dScalePPTXSizes);
                    break;
                }
                case 3:
                {
                    ret.setExtY(s.GetLong() / c_dScalePPTXSizes);
                    break;
                }
                case 4:
                {
                    ret.setChOffX(s.GetLong() / c_dScalePPTXSizes);
                    break;
                }
                case 5:
                {
                    ret.setChOffY(s.GetLong() / c_dScalePPTXSizes);
                    break;
                }
                case 6:
                {
                    ret.setChExtX(s.GetLong() / c_dScalePPTXSizes);
                    break;
                }
                case 7:
                {
                    ret.setChExtY(s.GetLong() / c_dScalePPTXSizes);
                    break;
                }
                case 8:
                {
                    ret.setFlipH(s.GetBool());
                    break;
                }
                case 9:
                {
                    ret.setFlipV(s.GetBool());
                    break;
                }
                case 10:
                {
                    ret.setRot((s.GetLong()/60000)*Math.PI/180);
                    break;
                }
                default:
                    break;
            }
        }

        s.Seek2(_end_rec);
        return ret;
    }

	this.ReadSignatureLine = function()
	{
		var ret = new AscFormat.CSignatureLine();

		var s = this.stream;

		var _rec_start = s.cur;
		var _end_rec = _rec_start + s.GetULong() + 4;

		s.Skip2(1); // start attributes

		while (true)
		{
			var _at = s.GetUChar();
			if (_at == g_nodeAttributeEnd)
				break;
			switch (_at)
			{
				case 0:
				{
					s.GetString2();
					break;
				}
				case 1:
				{
					s.GetBool();
					break;
				}
				case 2:
				{
					s.GetUChar();
					break;
				}
				case 3:
				{
					ret.id = s.GetString2();
					break;
				}
				case 4:
				{
					s.GetBool();
					break;
				}
				case 5:
				{
					s.GetString2();
					break;
				}
				case 6:
				{
					s.GetBool();
					break;
				}
				case 7:
				{
					s.GetString2();
					break;
				}
				case 8:
				{
					s.GetBool();
					break;
				}
				case 9:
				{
					s.GetString2();
					break;
				}
				case 10:
				{
					ret.signer = s.GetString2();
					break;
				}
				case 11:
				{
					ret.signer2 = s.GetString2();
					break;
				}
				case 12:
				{
					ret.email = s.GetString2();
					break;
				}
				default:
					break;
			}
		}

		s.Seek2(_end_rec);
		return ret;
	}

    this.ReadShapeStyle = function()
    {
        var def = new AscFormat.CShapeStyle();

        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    def.setLnRef(this.ReadStyleRef());
                    break;
                }
                case 1:
                {
                    def.setFillRef(this.ReadStyleRef());
                    break;
                }
                case 2:
                {
                    def.setEffectRef(this.ReadStyleRef());
                    break;
                }
                case 3:
                {
                    def.setFontRef(this.ReadFontRef());
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return def;
    }

    this.ReadOleInfo = function(ole)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetLong() + 4;

        s.Skip2(1); // start attributes
        var dxaOrig = 0;
        var dyaOrig = 0;
        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    ole.setApplicationId(s.GetString2());
                    break;
                }
                case 1:
                {
                    ole.setData(s.GetString2());
                    break;
                }
                case 2:
                {
                    dxaOrig = s.GetULong();
                    break;
                }
                case 3:
                {
                    dyaOrig = s.GetULong();
                    break;
                }
                case 4:
                {
                    s.GetUChar();
                    break;
                }
                case 5:
                {
                    s.GetUChar();
                    break;
                }
                case 6:
                {
                    s.GetUChar();
                    break;
                }
                case 7:
                {
                    ole.setObjectFile(s.GetString2());
                    break;
                }
                default:
                {
                    break;
                }
            }
        }
        var oleType = null;
        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 1:
                {
                    s.GetLong();//length
                    oleType = s.GetUChar();
                    ole.setOleType(oleType);
                    break;
                }
                case 2:
                {

                    var binary_length;
                    switch(oleType)
                    {
                        case 0:
                        {
                            binary_length = s.GetULong();
                            ole.setBinaryData(s.data.slice(s.cur, s.cur + binary_length));
                            s.Seek2(s.cur + binary_length);
                            break;
                        }
                        case 1:
                        {
                            ole.setObjectFile("maskFile.docx");
                            binary_length = s.GetULong();
                            ole.setBinaryData(s.data.slice(s.cur, s.cur + binary_length));
                            s.Seek2(s.cur + binary_length);
                            break;
                        }
                        case 2:
                        {
                            ole.setObjectFile("maskFile.xlsx");
                            binary_length = s.GetULong();
                            ole.setBinaryData(s.data.slice(s.cur, s.cur + binary_length));
                            s.Seek2(s.cur + binary_length);
                            break;
                        }
                        case 4:
                        {
                            s.GetLong();//length

                            var type2 = s.GetUChar();
                            s.SkipRecord();
                            break;
                        }
                        default:
                        {
                            s.SkipRecord();
                            break;
                        }
                    }
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }


        if (dxaOrig > 0 && dyaOrig > 0) {
			var ratio = 4 / 3 / 20;//twips to px
			ole.setPixSizes(ratio * dxaOrig, ratio * dyaOrig);
		}
        s.Seek2(_end_rec);
    }

    this.ReadGeometry = function(_xfrm)
    {
        var geom = null;

        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        if (s.cur < _end_rec)
        {
            var _t = s.GetUChar();

            if (1 == _t)
            {
                // preset shape

                var _len = s.GetULong();
                var _s = s.cur;
                var _e = _s + _len;

                s.Skip2(1); // start attributes

                while (true)
                {
                    var _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    if (0 == _at)
                    {
                        var tmpStr = s.GetString2();
                        geom = AscFormat.CreateGeometry(tmpStr);
                        geom.isLine = tmpStr == "line";
                        geom.setPreset(tmpStr);
                    }

                    else
                        break;
                }

                while (s.cur < _e)
                {
                    var _at = s.GetUChar();
                    switch (_at)
                    {
                        case 0:
                        {
                            this.ReadGeomAdj(geom);
                            break;
                        }
                        default:
                        {
                            s.SkipRecord();
                            break;
                        }
                    }
                }
            }
            else if (2 == _t)
            {
                var _len = s.GetULong();
                var _s = s.cur;
                var _e = _s + _len;

                geom = AscFormat.CreateGeometry("");
                geom.preset = null;
                while (s.cur < _e)
                {
                    var _at = s.GetUChar();
                    switch (_at)
                    {
                        case 0:
                        {
                            this.ReadGeomAdj(geom);
                            break;
                        }
                        case 1:
                        {
                            this.ReadGeomGd(geom);
                            break;
                        }
                        case 2:
                        {
                            this.ReadGeomAh(geom);
                            break;
                        }
                        case 3:
                        {
                            this.ReadGeomCxn(geom);
                            break;
                        }
                        case 4:
                        {
                            this.ReadGeomPathLst(geom, _xfrm);
                            break;
                        }
                        case 5:
                        {
                            this.ReadGeomRect(geom);
                            break;
                        }
                        default:
                        {
                            s.SkipRecord();
                            break;
                        }
                    }
                }
            }
        }

        s.Seek2(_end_rec);
        return geom;
    }

    this.ReadGeomAdj = function(geom)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        var _c = s.GetULong();

        for (var i = 0; i < _c; i++)
        {
            s.Skip2(6); // type + len + start attributes

            var arr = [];
            var cp = 0;

            while (true)
            {
                var _at = s.GetUChar();
                if (_at == g_nodeAttributeEnd)
                    break;

                if (cp == 1)
                    arr[cp] = s.GetLong();
                else
                    arr[cp] = s.GetString2();
                cp++;
            }

            if (arr.length >= 3)
                geom.AddAdj(arr[0], arr[1], arr[2]);
        }

        s.Seek2(_end_rec);
    }

    this.ReadGeomGd = function(geom)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        var _c = s.GetULong();

        for (var i = 0; i < _c; i++)
        {
            s.Skip2(6); // type + len + start attributes

            var arr = [];
            var cp = 0;

            while (true)
            {
                var _at = s.GetUChar();
                if (_at == g_nodeAttributeEnd)
                    break;

                if (cp == 1)
                    arr[cp] = s.GetLong();
                else
                    arr[cp] = s.GetString2();
                cp++;
            }

            geom.AddGuide(arr[0], arr[1], arr[2], arr[3], arr[4]);
        }

        s.Seek2(_end_rec);
    }

    this.ReadGeomAh = function(geom)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        var _c = s.GetULong();

        for (var i = 0; i < _c; i++)
        {
            var _type1 = s.GetUChar();
            s.Skip2(4); // len
            var _type = s.GetUChar();
            s.Skip2(5); // len + start attributes

            var arr = [];
            while (true)
            {
                var _at = s.GetUChar();
                if (_at == g_nodeAttributeEnd)
                    break;

                arr[_at] = s.GetString2();
            }

            if (1 == _type)
                geom.AddHandlePolar(arr[2], arr[6], arr[4], arr[3], arr[7], arr[5], arr[0], arr[1]);
            else
                geom.AddHandleXY(arr[2], arr[6], arr[4], arr[3], arr[7], arr[5], arr[0], arr[1]);
        }

        s.Seek2(_end_rec);
    }

    this.ReadGeomCxn = function(geom)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        var _c = s.GetULong();

        for (var i = 0; i < _c; i++)
        {
            var _type = s.GetUChar();
            s.Skip2(5); // len + start attributes

            var arr = [];
            while (true)
            {
                var _at = s.GetUChar();
                if (_at == g_nodeAttributeEnd)
                    break;

                arr[_at] = s.GetString2();
            }

            geom.AddCnx(arr[2], arr[0], arr[1]);
        }

        s.Seek2(_end_rec);
    }

    this.ReadGeomRect = function(geom)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        var arr = [];
        arr[0] = "l";
        arr[1] = "t";
        arr[2] = "r";
        arr[3] = "b";
        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            arr[_at] = s.GetString2();
        }

        geom.AddRect(arr[0], arr[1], arr[2], arr[3]);

        s.Seek2(_end_rec);
    }

    this.ReadGeomPathLst = function(geom, _xfrm)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        var _c = s.GetULong();

        for (var i = 0; i < _c; i++)
        {
            var _type = s.GetUChar();
            var _len = s.GetULong();

            var _s = s.cur;
            var _e = _s + _len;
            s.Skip2(1); // start attributes

            var extrusionOk = false;
            var fill = 5;
            var stroke = true;
            var w = undefined;
            var h = undefined;

            while (true)
            {
                var _at = s.GetUChar();
                if (_at == g_nodeAttributeEnd)
                    break;

                switch (_at)
                {
                    case 0:
                    {
                        extrusionOk = s.GetBool();
                        break;
                    }
                    case 1:
                    {
                        fill = s.GetUChar();
                        break;
                    }
                    case 2:
                    {
                        h = s.GetLong();
                        break;
                    }
                    case 3:
                    {
                        stroke = s.GetBool();
                        break;
                    }
                    case 4:
                    {
                        w = s.GetLong();
                        break;
                    }
                    default:
                        break;
                }
            }

            geom.AddPathCommand(0, extrusionOk, (fill == 4) ? "none" : "norm", stroke, w, h);
            var isKoords = false;

            while (s.cur < _e)
            {
                var _at = s.GetUChar();
                switch (_at)
                {
                    case 0:
                    {
                        s.Skip2(4); // len

                        var _cc = s.GetULong();

                        for (var j = 0; j < _cc; j++)
                        {
                            s.Skip2(5); // type + len
                            isKoords |= this.ReadUniPath2D(geom);
                        }

                        break;
                    }
                    default:
                    {
                        s.SkipRecord();
                        break;
                    }
                }
            }

            s.Seek2(_e);
        }

        var _path = geom.pathLst[geom.pathLst.length - 1];
        if (isKoords && undefined === _path.pathW && undefined === _path.pathH)
        {
            _path.pathW = _xfrm.extX * c_dScalePPTXSizes;
            _path.pathH = _xfrm.extY * c_dScalePPTXSizes;

            if(_path.pathW != undefined)
            {
                _path.divPW = 100/_path.pathW;
                _path.divPH = 100/_path.pathH;
            }
        }

        s.Seek2(_end_rec);
    }

    this.ReadUniPath2D = function(geom)
    {
        var s = this.stream;

        var _type = s.GetUChar();
        var _len = s.GetULong();

        var _s = s.cur;
        var _e = _s + _len;

        if (3 == _type)
        {
            geom.AddPathCommand(6);
            s.Seek2(_e);
            return;
        }

        s.Skip2(1);

        var isKoord = false;

        var arr = [];
        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            arr[_at] = s.GetString2();

            if (!isKoord && !isNaN(parseInt(arr[_at])))
                isKoord = true;
        }

        switch (_type)
        {
            case 1:
            {
                geom.AddPathCommand(1, arr[0], arr[1]);
                break;
            }
            case 2:
            {
                geom.AddPathCommand(2, arr[0], arr[1]);
                break;
            }
            case 3:
            {
                geom.AddPathCommand(6);
                break;
            }
            case 4:
            {
                geom.AddPathCommand(5, arr[0], arr[1], arr[2], arr[3], arr[4], arr[5]);
                break;
            }
            case 5:
            {
                geom.AddPathCommand(3, arr[0], arr[1], arr[2], arr[3]);
                break;
            }
            case 6:
            {
                geom.AddPathCommand(4, arr[0], arr[1], arr[2], arr[3]);
                break;
            }
            default:
            {
                s.SkipRecord();
                break;
            }
        }

        s.Seek2(_e);

        return isKoord;
    }

    // ------------------------------------------

    this.ReadGraphicObject = function()
    {
        var s = this.stream;
        var _type = s.GetUChar();
        var _object = null;

        switch (_type)
        {
            case 1:
            {
                _object = this.ReadShape();
                break;
            }
            case 2://pic
            case 6://ole
            case 7://video
            case 8://audio
            {
                _object = this.ReadPic(_type);
                break;
            }
            case 3:
            {
                _object = this.ReadCxn();
                break;
            }
            case 4:
            {
                _object = this.ReadGroupShape();
                break;
            }
            case 5:
            {
                _object = this.ReadGrFrame();
                break;
            }
            default:
            {
                s.SkipRecord();
                break;
            }
        }

        return _object;
    }

    // SHAPE PROPERTIES -------------------------

    this.ReadShape = function()
    {
        var s = this.stream;

        var shape = new AscFormat.CShape(this.TempMainObject);
        if (null != this.TempGroupObject)
            shape.Container = this.TempGroupObject;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;
        shape.setBDeleted(false);
        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    shape.attrUseBgFill = s.GetBool();
                    break;
                }
                default:
                    break;
            }
        }

        var txXfrm = null;
        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    var pr = this.ReadNvUniProp(shape);
                    shape.setNvSpPr(pr);
                    if(AscFormat.isRealNumber(pr.locks))
                    {
                        shape.setLocks(pr.locks);
                    }
                    break;
                }
                case 1:
                {
                    var sp_pr = new AscFormat.CSpPr();
                    this.ReadSpPr(sp_pr);
                    shape.setSpPr(sp_pr);
                    sp_pr.setParent(shape);
                    break;
                }
                case 2:
                {
                    shape.setStyle(this.ReadShapeStyle());
                    break;
                }
                case 3:
                {
                    shape.setTxBody(this.ReadTextBody(shape));
                    shape.txBody.setParent(shape);
                    break;
                }
				case 6:
				{
                    txXfrm = this.ReadXfrm();
					break;
				}
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }
        if(txXfrm && AscFormat.isRealNumber(txXfrm.rot) && shape.txBody){
            var oCopyBodyPr;
            var rot2 = txXfrm.rot;
            while(rot2 < 0){
                rot2 += 2*Math.PI;
            }
            var nSquare = ((2.0*rot2/Math.PI + 0.5) >> 0);
            while (nSquare < 0){
                nSquare += 4;
            }
            switch (nSquare){
                case 0:
                {
                    oCopyBodyPr = shape.txBody.bodyPr ? shape.txBody.bodyPr.createDuplicate() : new AscFormat.CBodyPr();
                    oCopyBodyPr.rot = (rot2/AscFormat.cToRad + 0.5) >> 0;
                    shape.txBody.setBodyPr(oCopyBodyPr);
                    break;
                }
                case 1:
                {
                    oCopyBodyPr = shape.txBody.bodyPr ? shape.txBody.bodyPr.createDuplicate() : new AscFormat.CBodyPr();
                    oCopyBodyPr.vert = AscFormat.nVertTTvert;
                    shape.txBody.setBodyPr(oCopyBodyPr);
                    break;
                }
                case 2:
                {
                    oCopyBodyPr = shape.txBody.bodyPr ? shape.txBody.bodyPr.createDuplicate() : new AscFormat.CBodyPr();
                    oCopyBodyPr.rot = (rot2/AscFormat.cToRad + 0.5) >> 0;
                    shape.txBody.setBodyPr(oCopyBodyPr);
                    break;
                }
                case 3:
                {
                    oCopyBodyPr = shape.txBody.bodyPr ? shape.txBody.bodyPr.createDuplicate() : new AscFormat.CBodyPr();
                    oCopyBodyPr.vert = AscFormat.nVertTTvert270;
                    shape.txBody.setBodyPr(oCopyBodyPr);
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return shape;
    };

    this.CheckGroupXfrm = function(oGroup){
        if(!oGroup || !oGroup.spPr){
            return;
        }
        if(!oGroup.spPr.xfrm && oGroup.spTree.length > 0){
            var oXfrm = new AscFormat.CXfrm();
            oXfrm.setOffX(0);
            oXfrm.setOffY(0);
            oXfrm.setChOffX(0);
            oXfrm.setChOffY(0);
            oXfrm.setExtX(50);
            oXfrm.setExtY(50);
            oXfrm.setChExtX(50);
            oXfrm.setChExtY(50);
            oGroup.spPr.setXfrm(oXfrm);
            oGroup.updateCoordinatesAfterInternalResize();
            oGroup.spPr.xfrm.setParent(oGroup.spPr);
        }
    };

    this.ReadGroupShape = function(type)
    {
        var s = this.stream;

        var shape;
        if(type === 9){
            shape = new AscFormat.CLockedCanvas();
        }
        else {
            shape = new AscFormat.CGroupShape();
        }
        shape.setBDeleted(false);
        this.TempGroupObject = shape;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    var pr = this.ReadNvUniProp(shape);
                    shape.setNvSpPr(pr);
                    if(AscFormat.isRealNumber(pr.locks))
                    {
                        shape.setLocks(pr.locks);
                    }
                    break;
                }
                case 1:
                {
                    var spPr = new AscFormat.CSpPr();
                    this.ReadGrSpPr(spPr);
                    shape.setSpPr(spPr);
                    spPr.setParent(shape);
                    break;
                }
                case 2:
                {
                    s.Skip2(4); // len
                    var _c = s.GetULong();
                    for (var i = 0; i < _c; i++)
                    {
                        s.Skip2(1);
                        var __len = s.GetULong();
                        if (__len == 0)
                            continue;

                        var _type = s.GetUChar();

                        var _object = null;

                        switch (_type)
                        {
                            case 1:
                            {
                                _object = this.ReadShape();
                                if (!IsHiddenObj(_object) && _object.spPr && _object.spPr.xfrm)
                                {
                                    shape.addToSpTree(shape.spTree.length,_object);
                                    shape.spTree[shape.spTree.length-1].setGroup(shape);
                                }
                                break;
                            }
                            case 6:
                            case 2:
                            case 7:
                            case 8:
                            {
                                _object = this.ReadPic(_type);
                                if (!IsHiddenObj(_object) && _object.spPr && _object.spPr.xfrm)
                                {
                                    shape.addToSpTree(shape.spTree.length,_object);
                                    shape.spTree[shape.spTree.length-1].setGroup(shape);
                                }
                                break;
                            }
                            case 3:
                            {
                                _object = this.ReadCxn();
                                if (!IsHiddenObj(_object) && _object.spPr && _object.spPr.xfrm)
                                {
                                    shape.addToSpTree(shape.spTree.length,_object);
                                    shape.spTree[shape.spTree.length-1].setGroup(shape);
                                }
                                break;
                            }
                            case 4:
                            {
                                _object = this.ReadGroupShape();
                                if (!IsHiddenObj(_object) && _object.spPr && _object.spPr.xfrm && _object.spTree.length > 0)
                                {
                                    shape.addToSpTree(shape.spTree.length,_object);
                                    shape.spTree[shape.spTree.length-1].setGroup(shape);
                                    this.TempGroupObject = shape;
                                }
                                break;
                            }
                            case 5:
                            {
                                var _ret = null;
                                if ("undefined" != typeof(AscFormat.CGraphicFrame))
                                    _ret = this.ReadGrFrame();
                                else
                                    _ret = this.ReadChartDataInGroup(shape);
                                if (null != _ret)
                                {
                                    shape.addToSpTree(shape.spTree.length, _ret);
                                    shape.spTree[shape.spTree.length-1].setGroup(shape);
                                }
                                break;
                            }
                            default:
                            {
                                s.SkipRecord();
                                break;
                            }
                        }
                    }
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }
        this.CheckGroupXfrm(shape);
        s.Seek2(_end_rec);
        this.TempGroupObject = null;
        return shape;
    }

    this.ReadGroupShapeMain = function()
    {
        var s = this.stream;

        var shapes = [];

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(5); // type SPTREE + len

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
                case 1:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
                case 2:
                {
                    s.Skip2(4); // len
                    var _c = s.GetULong();
                    for (var i = 0; i < _c; i++)
                    {
                        s.Skip2(1);
                        var __len = s.GetULong();
                        if (__len == 0)
                            continue;

                        var _type = s.GetUChar();

                        switch (_type)
                        {
                            case 1:
                            {
                                var _object = this.ReadShape();
                                if (!IsHiddenObj(_object))
                                {
                                    shapes[shapes.length] = _object;
                                    _object.setParent2(this.TempMainObject);
                                }
                                break;
                            }
                            case 6:
                            case 2:
                            case 7:
                            case 8:
                            {
                                var _object = this.ReadPic(_type);
                                if (!IsHiddenObj(_object))
                                {
                                    shapes[shapes.length] = _object;
                                    _object.setParent2(this.TempMainObject);
                                }
                                break;
                            }
                            case 3:
                            {
                                var _object = this.ReadCxn();
                                if (!IsHiddenObj(_object))
                                {
                                    shapes[shapes.length] = _object;
                                    _object.setParent2(this.TempMainObject);
                                }
                                break;
                            }
                            case 4:
                            {
                                var _object = this.ReadGroupShape();
                                if (!IsHiddenObj(_object))
                                {
                                    shapes[shapes.length] = _object;
                                    _object.setParent2(this.TempMainObject);
                                }
                                break;
                            }
                            case 5:
                            {
                                var _ret = this.ReadGrFrame();
                                if (null != _ret)
                                {
                                    shapes[shapes.length] = _ret;
                                    _ret.setParent2(this.TempMainObject);
                                }
                                break;
                            }
                            default:
                            {
                                s.SkipRecord();
                                break;
                            }
                        }
                    }
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return shapes;
    }


    this.ReadPic = function(type)
    {
        var s = this.stream;

        var isOle = (type === 6);
        var pic = isOle ? new AscFormat.COleObject(this.TempMainObject) : new AscFormat.CImageShape(this.TempMainObject);

        pic.setBDeleted(false);

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        var sMaskFileName;
        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    var pr = this.ReadNvUniProp(pic);
                    pic.setNvSpPr(pr);
                    if(AscFormat.isRealNumber(pr.locks)){
                        pic.setLocks(pr.locks);
                    }
                    break;
                }
                case 1:
                {
                    pic.setBlipFill(this.ReadUniFill(null, pic, null).fill);
                    break;
                }
                case 2:
                {

                    var spPr = new AscFormat.CSpPr();
                    spPr.setParent(pic);
                    this.ReadSpPr(spPr);
                    pic.setSpPr(spPr);
                    break;
                }
                case 3:
                {
                    pic.setStyle(this.ReadShapeStyle());
                    break;
                }
                case 4:
                {
                    if(isOle) {
                        this.ReadOleInfo(pic);
                        // if(pic.m_sObjectFile === "maskFile.docx"
                        //     ||  pic.m_sObjectFile === "maskFile.xlsx"){
                        //     var oParent = pic.parent;
                        //     pic = AscFormat.CImageShape.prototype.copy.call(pic);
                        //     if(oParent){
                        //         pic.setParent(oParent);
                        //     }
                        // }
                    } else {
                        s.SkipRecord();
                    }
                    break;
                }
                case 5:
                {
                    if(type === 7 || type === 8){//video or audio
                        s.GetLong();
                        s.GetUChar();//start attributes

                        while(true)
                        {
                            var _at2 = s.GetUChar();
                            if (_at2 == g_nodeAttributeEnd)
                                break;
                            switch (_at2) {
                                case 0:
                                {
                                    sMaskFileName = s.GetString2();
                                    break;
                                }
                                case 1:
                                {
                                    s.GetBool();
                                    break;
                                }
                                default:
                                {
                                    break;
                                }
                            }
                        }

                    }
                    else{
                        s.SkipRecord();
                    }
                    break;
                }
                default:
                {
                    this.stream.SkipRecord();
                    break;
                }
            }
        }

        if(type === 7 || type === 8){//video or audio
            if(typeof sMaskFileName === "string" && sMaskFileName.length > 0 &&
                pic.nvPicPr && pic.nvPicPr.nvPr /*&& pic.nvPicPr.nvPr.unimedia*/){
                var oUniMedia = new AscFormat.UniMedia();
                oUniMedia.type = type;
                oUniMedia.media = sMaskFileName;
                pic.nvPicPr.nvPr.setUniMedia(oUniMedia);
            }
        }
        s.Seek2(_end_rec);
        return pic;
    }
    this.ReadCxn = function()
    {
        var s = this.stream;

        var shape = new AscFormat.CConnectionShape();
        shape.setBDeleted(false);

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    var pr = this.ReadNvUniProp(shape);
                    shape.setNvSpPr(pr);
                    if(AscFormat.isRealNumber(pr.locks)){
                        shape.setLocks(pr.locks);
                    }
                    break;
                }
                case 1:
                {
                    var spPr = new AscFormat.CSpPr();
                    spPr.setParent(shape);
                    this.ReadSpPr(spPr);
                    shape.setSpPr(spPr);

                    break;
                }
                case 2:
                {
                    shape.setStyle(this.ReadShapeStyle());
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }
        this.arr_connectors.push(shape);
        s.Seek2(_end_rec);
        return shape;
    }

    this.ReadChartDataInGroup = function(group)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        this.TempGroupObject = group;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    var spid = s.GetString2();
                    break;
                }
                default:
                    break;
            }
        }

        var _nvGraphicFramePr = null;
        var _xfrm = null;
        var _chart = null;
        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    _nvGraphicFramePr = this.ReadNvUniProp(AscFormat.ExecuteNoHistory(function () {
                        return new AscFormat.CGraphicFrame();
                    }, this, []));
                    break;
                }
                case 1:
                {
                    _xfrm = this.ReadXfrm();
                    break;
                }
                case 2:
                {
                    s.SkipRecord();
                    break;
                }
                case 3:
                {
                    var _length = s.GetLong();
                    var _pos = s.cur;

                    var _stream = new AscCommon.FT_Stream2();
                    _stream.data = s.data;
                    _stream.pos = s.pos;
                    _stream.cur = s.cur;
                    _stream.size = s.size;

                    _chart = new AscFormat.CChartSpace();
                    _chart.setBDeleted(false);
                    var oBinaryChartReader = new AscCommon.BinaryChartReader(_stream);
                    oBinaryChartReader.ExternalReadCT_ChartSpace(_length, _chart, this.presentation);
                    _chart.setBDeleted(false);
                    if(AscCommon.isRealObject(_nvGraphicFramePr) && AscFormat.isRealNumber(_nvGraphicFramePr.locks))
                    {
                        _chart.setLocks(_nvGraphicFramePr.locks);
                    }
                    if(_xfrm)
                    {
                        if(!_chart.spPr)
                        {
                            _chart.setSpPr(new AscFormat.CSpPr());
                            _chart.spPr.setParent(_chart);
                        }

                        _chart.spPr.setXfrm(_xfrm);
                        _xfrm.setParent(_chart.spPr);
                    }

                    s.Seek2(_pos + _length);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);

        this.TempGroupObject = null;
        if (_chart == null)
            return null;

        return _chart;
    }

    this.ReadGrFrame = function()
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        var _graphic_frame = new AscFormat.CGraphicFrame();
        _graphic_frame.setParent2(this.TempMainObject);
        this.TempGroupObject = _graphic_frame;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    var spid = s.GetString2();
                    break;
                }
                default:
                    break;
            }
        }

        var _nvGraphicFramePr = null;
        var _xfrm = null;
        var _table = null;
        var _chart = null;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    _nvGraphicFramePr = this.ReadNvUniProp(_graphic_frame);
                    break;
                }
                case 1:
                {
                    _xfrm = this.ReadXfrm();
                    break;
                }
                case 2:
                {
                    _table = this.ReadTable(_xfrm, _graphic_frame);
                    break;
                }
                case 3:
                {
                    var _length = s.GetLong();
                    var _pos = s.cur;

                    if(typeof AscFormat.CChartSpace !== "undefined" && _length)
                    {
                        var _stream = new AscCommon.FT_Stream2();
                        _stream.data = s.data;
                        _stream.pos = s.pos;
                        _stream.cur = s.cur;
                        _stream.size = s.size;
                        _chart = new AscFormat.CChartSpace();
                        _chart.setBDeleted(false);
                        AscCommon.pptx_content_loader.ImageMapChecker = this.ImageMapChecker;
                        AscCommon.pptx_content_loader.Reader.ImageMapChecker = this.ImageMapChecker;
                        var oBinaryChartReader = new AscCommon.BinaryChartReader(_stream);
                        oBinaryChartReader.ExternalReadCT_ChartSpace(_length, _chart, this.presentation);

                    }

                    s.Seek2(_pos + _length);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);

        this.TempGroupObject = null;
        if (_table == null && _chart == null)
            return null;

        if (_table != null)
        {
            if(!_graphic_frame.spPr)
            {
                _graphic_frame.setSpPr(new AscFormat.CSpPr());
                _graphic_frame.spPr.setParent(_graphic_frame);
            }
            if(!_xfrm){
                _xfrm = new AscFormat.CXfrm();
                _xfrm.setOffX(0);
                _xfrm.setOffY(0);
                _xfrm.setExtX(0);
                _xfrm.setExtY(0);
            }
            _graphic_frame.spPr.setXfrm(_xfrm);
            _xfrm.setParent(_graphic_frame.spPr);
            _graphic_frame.setSpPr(_graphic_frame.spPr);
            _graphic_frame.setNvSpPr(_nvGraphicFramePr);
            if(AscCommon.isRealObject(_nvGraphicFramePr) && AscFormat.isRealNumber(_nvGraphicFramePr.locks))
            {
                _graphic_frame.setLocks(_nvGraphicFramePr.locks);
            }
            _graphic_frame.setGraphicObject(_table);
            _graphic_frame.setBDeleted(false);
        }
        else if (_chart != null)
        {
            if(!_chart.spPr)
            {
                _chart.setSpPr(new AscFormat.CSpPr());
                _chart.spPr.setParent(_chart);
            }
            if(!_xfrm){
                _xfrm = new AscFormat.CXfrm();
                _xfrm.setOffX(0);
                _xfrm.setOffY(0);
                _xfrm.setExtX(0);
                _xfrm.setExtY(0);
            }
            if(AscCommon.isRealObject(_nvGraphicFramePr) )
            {
                _chart.setNvSpPr(_nvGraphicFramePr);
                if(AscFormat.isRealNumber(_nvGraphicFramePr.locks)){
                    _chart.setLocks(_nvGraphicFramePr.locks);
                }
            }
            this.map_shapes_by_id[_nvGraphicFramePr.cNvPr.id] = _chart;
            _chart.spPr.setXfrm(_xfrm);
            _xfrm.setParent(_chart.spPr);
            return _chart;
        }

        return _graphic_frame;
    }

    this.ReadNvUniProp = function(drawing)
    {
        var prop = new AscFormat.UniNvPr();

        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    this.ReadCNvPr(prop.cNvPr);
                    if(AscCommon.isRealObject(drawing))
                    {
                        this.map_shapes_by_id[prop.cNvPr.id] = drawing;
                    }
                    break;
                }
                case 1:
                {

                    var end = s.cur + s.GetULong() + 4;
                    var locks = 0;
                    if(AscCommon.isRealObject(drawing))
                    {
                        var drawingType = drawing.getObjectType();
                        switch(drawingType)
                        {
                            case AscDFH.historyitem_type_Shape:
                            {
                                s.Skip2(1); // attribute start
                                while (true)
                                {
                                    var _at2 = s.GetUChar();
                                    if (_at2 == g_nodeAttributeEnd)
                                        break;

                                    var value;
                                    switch(_at2)
                                    {
                                        case 1 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noAdjustHandles | (value ? AscFormat.LOCKS_MASKS.noAdjustHandles << 1 : 0));
                                            break;
                                        }
                                        case 2 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noChangeArrowheads | (value ? AscFormat.LOCKS_MASKS.noChangeArrowheads << 1 : 0));
                                            break;
                                        }
                                        case 3 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noChangeAspect | (value ? AscFormat.LOCKS_MASKS.noChangeAspect << 1 : 0));
                                            break;
                                        }
                                        case 4 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noChangeShapeType | (value ? AscFormat.LOCKS_MASKS.noChangeShapeType << 1 : 0));
                                            break;
                                        }
                                        case 5 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noEditPoints | (value ? AscFormat.LOCKS_MASKS.noEditPoints << 1 : 0));
                                            break;
                                        }
                                        case 6 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noGrp | (value ? AscFormat.LOCKS_MASKS.noGrp << 1 : 0));
                                            break;
                                        }
                                        case 7 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noMove | (value ? AscFormat.LOCKS_MASKS.noMove << 1 : 0));
                                            break;
                                        }
                                        case 8 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noResize | (value ? AscFormat.LOCKS_MASKS.noResize << 1 : 0));
                                            break;
                                        }
                                        case 9 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noRot | (value ? AscFormat.LOCKS_MASKS.noRot << 1 : 0));
                                            break;
                                        }
                                        case 10:{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noSelect | (value ? AscFormat.LOCKS_MASKS.noSelect << 1 : 0));
                                            break;
                                        }
                                        case 11:{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noTextEdit | (value ? AscFormat.LOCKS_MASKS.noTextEdit << 1 : 0));
                                            break;
                                        }
                                    }
                                }
                                prop.locks = locks;
                                break;
                            }
                            case AscDFH.historyitem_type_GroupShape:
                            {
                                s.Skip2(1); // attribute start
                                while (true)
                                {
                                    var _at2 = s.GetUChar();
                                    if (_at2 == g_nodeAttributeEnd)
                                        break;

                                    var value;
                                    switch(_at2)
                                    {
                                        case 0:
                                        {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noChangeAspect | (value ? AscFormat.LOCKS_MASKS.noChangeAspect << 1 : 0));
                                            break;
                                        }
                                        case 1:
                                        {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noGrp | (value ? AscFormat.LOCKS_MASKS.noGrp << 1 : 0));
                                            break;
                                        }
                                        case 2:
                                        {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noMove | (value ? AscFormat.LOCKS_MASKS.noMove << 1 : 0));
                                            break;
                                        }
                                        case 3:
                                        {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noResize | (value ? AscFormat.LOCKS_MASKS.noResize << 1 : 0));
                                            break;
                                        }
                                        case 4:
                                        {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noRot | (value ? AscFormat.LOCKS_MASKS.noRot << 1 : 0));
                                            break;
                                        }
                                        case 5:
                                        {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noSelect | (value ? AscFormat.LOCKS_MASKS.noSelect << 1 : 0));
                                            break;
                                        }
                                        case 6:
                                        {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noUngrp | (value ? AscFormat.LOCKS_MASKS.noUngrp << 1 : 0));
                                            break;
                                        }
                                    }
                                }
                                prop.locks = locks;
                                break;
                            }
                            case AscDFH.historyitem_type_ImageShape:
                            {
                                s.Skip2(1); // attribute start
                                while (true)
                                {
                                    var _at2 = s.GetUChar();
                                    if (_at2 == g_nodeAttributeEnd)
                                        break;

                                    var value;
                                    switch(_at2)
                                    {
                                        case 0 :{
                                            value = s.GetBool();
                                            break;
                                        }
                                        case 1 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noAdjustHandles | (value ? AscFormat.LOCKS_MASKS.noAdjustHandles << 1 : 0));
                                            break;
                                            }
                                        case 2 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noChangeArrowheads | (value ? AscFormat.LOCKS_MASKS.noChangeArrowheads << 1 : 0));
                                            break;
                                            }
                                        case 3 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noChangeAspect | (value ? AscFormat.LOCKS_MASKS.noChangeAspect << 1 : 0));
                                            break;
                                            }
                                        case 4 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noChangeShapeType | (value ? AscFormat.LOCKS_MASKS.noChangeShapeType << 1 : 0));
                                            break;
                                            }
                                        case 5 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noCrop | (value ? AscFormat.LOCKS_MASKS.noCrop << 1 : 0));
                                            break;
                                            }
                                        case 6 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noEditPoints | (value ? AscFormat.LOCKS_MASKS.noEditPoints << 1 : 0));
                                            break;
                                            }
                                        case 7 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noGrp | (value ? AscFormat.LOCKS_MASKS.noGrp << 1 : 0));
                                            break;
                                            }
                                        case 8 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noMove | (value ? AscFormat.LOCKS_MASKS.noMove << 1 : 0));
                                            break;
                                            }
                                        case 9 :{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noResize | (value ? AscFormat.LOCKS_MASKS.noResize << 1 : 0));
                                            break;
                                            }
                                        case 10:{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noRot | (value ? AscFormat.LOCKS_MASKS.noRot << 1 : 0));
                                            break;
                                            }
                                        case 11:{
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noSelect | (value ? AscFormat.LOCKS_MASKS.noSelect << 1 : 0));
                                            break;
                                            }
                                    }
                                }
                                prop.locks = locks;
                                break;
                            }
                            case AscDFH.historyitem_type_GraphicFrame:
                            case AscDFH.historyitem_type_ChartSpace:
                            {
                                s.Skip2(1); // attribute start
                                while (true)
                                {
                                    var _at2 = s.GetUChar();
                                    if (_at2 == g_nodeAttributeEnd)
                                        break;

                                    var value;
                                    switch(_at2)
                                    {
                                        case 0: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noChangeAspect | (value ? AscFormat.LOCKS_MASKS.noChangeAspect << 1 : 0));
                                            break;
                                        }
                                        case 1: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noDrilldown | (value ? AscFormat.LOCKS_MASKS.noDrilldown << 1 : 0));
                                            break;
                                        }
                                        case 2: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noGrp | (value ? AscFormat.LOCKS_MASKS.noGrp << 1 : 0));
                                            break;
                                        }
                                        case 3: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noMove | (value ? AscFormat.LOCKS_MASKS.noMove << 1 : 0));
                                            break;
                                        }
                                        case 4: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noResize | (value ? AscFormat.LOCKS_MASKS.noResize << 1 : 0));
                                            break;
                                        }
                                        case 5: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noSelect | (value ? AscFormat.LOCKS_MASKS.noSelect << 1 : 0));
                                            break;
                                        }
                                    }
                                }
                                prop.locks = locks;
                                break;
                            }
                            case AscDFH.historyitem_type_Cnx:{

                                s.Skip2(1); // attribute start
                                while (true)
                                {
                                    var _at2 = s.GetUChar();
                                    if (_at2 == g_nodeAttributeEnd)
                                        break;

                                    var value;
                                    switch(_at2)
                                    {
                                        case 0: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noAdjustHandles | (value ? AscFormat.LOCKS_MASKS.noAdjustHandles << 1 : 0));
                                            break;
                                        }
                                        case 1: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noChangeArrowheads | (value ? AscFormat.LOCKS_MASKS.noChangeArrowheads << 1 : 0));
                                            break;
                                        }
                                        case 2: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noChangeAspect | (value ? AscFormat.LOCKS_MASKS.noChangeAspect << 1 : 0));
                                            break;
                                        }
                                        case 3: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noChangeShapeType | (value ? AscFormat.LOCKS_MASKS.noChangeShapeType << 1 : 0));
                                            break;
                                        }
                                        case 4: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noEditPoints | (value ? AscFormat.LOCKS_MASKS.noEditPoints << 1 : 0));
                                            break;
                                        }
                                        case 5: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noGrp | (value ? AscFormat.LOCKS_MASKS.noGrp << 1 : 0));
                                            break;
                                        }
                                        case 6: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noMove | (value ? AscFormat.LOCKS_MASKS.noMove << 1 : 0));
                                            break;
                                        }
                                        case 7: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noResize | (value ? AscFormat.LOCKS_MASKS.noResize << 1 : 0));
                                            break;
                                        }
                                        case 8: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noRot | (value ? AscFormat.LOCKS_MASKS.noRot << 1 : 0));
                                            break;
                                        }
                                        case 9: {
                                            value = s.GetBool();
                                            locks |= (AscFormat.LOCKS_MASKS.noSelect | (value ? AscFormat.LOCKS_MASKS.noSelect << 1 : 0));
                                            break;
                                        }
                                        case 10:{
                                            prop.nvUniSpPr.stCnxId = s.GetULong();
                                            break;
                                        }
                                        case 11:{
                                            prop.nvUniSpPr.stCnxIdx = s.GetULong();
                                            break;
                                        }
                                        case 12:{
                                            prop.nvUniSpPr.endCnxId = s.GetULong();
                                            break;
                                        }
                                        case 13:{
                                            prop.nvUniSpPr.endCnxIdx = s.GetULong();
                                            break;
                                        }
                                    }
                                }
                                prop.locks = locks;
                                prop.setUniSpPr(prop.nvUniSpPr.copy());
                                break;
                            }
                        }
                    }
                    s.Seek2(end);
                    break;
                }
                case 2:
                {
                    this.ReadNvPr(prop.nvPr);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return prop;
    }

    this.ReadCNvPr = function(cNvPr)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    cNvPr.setId(s.GetLong());
                    if(this.TempMainObject && cNvPr.id > this.TempMainObject.maxId)
                    {
                        this.TempMainObject.maxId = cNvPr.id;
                    }
                    break;
                }
                case 1:
                {
                    cNvPr.setName(s.GetString2());
                    break;
                }
                case 2:
                {
                    cNvPr.setIsHidden((1 == s.GetUChar()) ? true : false);
                    break;
                }
                case 3:
                {
                    cNvPr.setTitle(s.GetString2());
                    break;
                }
                case 4:
                {
                    cNvPr.setDescr(s.GetString2());
                    break;
                }
                default:{
                    break;
                }
            }
        }

        while(s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch(_at){
                case 0:{
                    cNvPr.setHlinkClick(this.ReadHyperlink());
                    break;
                }
                case 1:{
                    cNvPr.setHlinkHover(this.ReadHyperlink());
                    break;
                }
                default:{
                    this.stream.SkipRecord();
                    break;
                }
            }
        }
        s.Seek2(_end_rec);
    }

    this.ReadTable = function(_xfrm, _graphic_frame)
    {
        if (_xfrm == null)
        {
            this.stream.SkipRecord();
            return null;
        }

        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        var cols = null;
        var rows = null;
        var _return_to_rows = 0;
        var props = null;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    props = this.ReadTablePr();
                    break;
                }
                case 1:
                {
                    s.Skip2(4);
                    var _len = s.GetULong();
                    cols = new Array(_len);
                    for (var i = 0; i < _len; i++)
                    {
                        s.Skip2(7); // type, len + startAttr + 0 (attrType)
                        cols[i] = s.GetULong() / 36000;
                        s.Skip2(1); // endAttr
                    }
                    break;
                }
                case 2:
                {
                    var _end_rec2 = s.cur + s.GetULong() + 4;
                    rows = s.GetULong();
                    _return_to_rows = s.cur;
                    s.Seek2(_end_rec2);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        if(cols.length === 0)
        {
            cols.push(_xfrm.extX);
        }
        var _table = new CTable(this.presentation.DrawingDocument, _graphic_frame, true, rows, cols.length, cols, true);
        _table.Reset(0, 0, _xfrm.extX, 100000, 0, 0, 1);
        if (null != props)
        {
            var style;
            if(this.map_table_styles[props.style])
            {
                _table.Set_TableStyle(this.map_table_styles[props.style].Id);
            }
            _table.Set_Pr(props.props);
            _table.Set_TableLook(props.look);
        }
        _table.SetTableLayout(tbllayout_Fixed);

        s.Seek2(_return_to_rows);

        for (var i = 0; i < rows; i++)
        {
            s.Skip2(1); // 0!
            this.ReadTableRow(_table.Content[i]);
        }

        s.Seek2(_end_rec);

        return _table;
    }

    this.ReadTableRow = function(row)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

		var fMaxTopMargin = 0, fMaxBottomMargin = 0, fMaxTopBorder = 0, fMaxBottomBorder = 0;
		
		var fRowHeight = 5;
        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
					fRowHeight = s.GetULong() / 36000;
                   
                    break;
                }
                default:
                    break;
            }
        }

        s.Skip2(5); // type + len
        var _count = s.GetULong();
        _count = Math.min(_count, row.Content.length);
		for (var i = 0; i < _count; i++)
		{
			s.Skip2(1);
			var bIsNoHMerge = this.ReadCell(row.Content[i]);
			if (bIsNoHMerge === false)
			{
				row.Remove_Cell(i);
				i--;
				_count--;
			}
			var _gridCol = 1;
			if ("number" == typeof (row.Content[i].Pr.GridSpan))
			{
				_gridCol = row.Content[i].Pr.GridSpan;
			}

			if (_gridCol > (_count - i))
			{
				_gridCol = _count - i;
				row.Content[i].Pr.GridSpan = _gridCol;
				if (1 == row.Content[i].Pr.GridSpan)
					row.Content[i].Pr.GridSpan = undefined;
			}

			_gridCol--;
			while (_gridCol > 0)
			{
				i++;
				if (i >= _count)
					break;

				s.Skip2(1);
				this.ReadCell(row.Content[i]);

				// удаляем
				row.Remove_Cell(i);
				i--;
				_count--;

				--_gridCol;
			}
		}

		if(this.presentation && Array.isArray(this.presentation.Slides)){
            var bLoadVal = AscCommon.g_oIdCounter.m_bLoad;
            var bRead = AscCommon.g_oIdCounter.m_bRead;
            AscCommon.g_oIdCounter.m_bLoad = false;
            AscCommon.g_oIdCounter.m_bRead = false;
            for(i = 0;  i < row.Content.length; ++i){
                var oCell = row.Content[i];
                var oMargins = oCell.GetMargins();
                if(oMargins.Bottom.W > fMaxBottomMargin){
                    fMaxBottomMargin = oMargins.Bottom.W;
                }
                if(oMargins.Top.W > fMaxTopMargin){
                    fMaxTopMargin = oMargins.Top.W;
                }
                var oBorders = oCell.Get_Borders();
                if(oBorders.Top.Size > fMaxTopBorder){
                    fMaxTopBorder = oBorders.Top.Size;
                }
                if(oBorders.Bottom.Size > fMaxBottomBorder){
                    fMaxBottomBorder = oBorders.Bottom.Size;
                }
            }
            AscCommon.g_oIdCounter.m_bLoad = bLoadVal;
            AscCommon.g_oIdCounter.m_bRead = bRead;
            row.Set_Height(Math.max(1, fRowHeight - fMaxTopMargin - fMaxBottomMargin - fMaxTopBorder/2 - fMaxBottomBorder/2), Asc.linerule_AtLeast);
        }
        s.Seek2(_end_rec);
    }

    this.ReadCell = function(cell)
    {
        // cell.Content.Content.splice(0, cell.Content.Content.length);
        cell.Content.Internal_Content_RemoveAll();
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    var _id = s.GetString2();
                    break;
                }
                case 1:
                {
                    var rowSpan = s.GetULong();
                    if (1 < rowSpan)
                    {
                        cell.SetVMerge(vmerge_Restart);
                    }
                    break;
                }
                case 2:
                {
                    cell.Set_GridSpan(s.GetULong());
                    break;
                }
                case 3:
                {
                    var bIsHMerge = s.GetBool();
                    if (bIsHMerge)
                    {
                        s.Seek2(_end_rec);
                        return false;
                    }
                    break;
                }
                case 4:
                {
                    var bIsVMerge = s.GetBool();
                    if (bIsVMerge && cell.Pr.VMerge != vmerge_Restart)
                    {
                        cell.SetVMerge(vmerge_Continue);
                    }
                    break;
                }
                default:
                    break;
            }
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    var props = new CTableCellPr();
                    this.ReadCellProps(props);
                    props.Merge(cell.Pr);
                    cell.Set_Pr(props);
                    break;
                }
                case 1:
                {
                    this.ReadTextBody2(cell.Content);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return true;
    }

    this.ReadCellProps = function(props)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        //props.TableCellMar = {};
        //props.TableCellMar.Top    = new CTableMeasurement(tblwidth_Mm, 1.27);
        //props.TableCellMar.Left   = new CTableMeasurement(tblwidth_Mm, 2.54);
        //props.TableCellMar.Bottom = new CTableMeasurement(tblwidth_Mm, 1.27);
        //props.TableCellMar.Right  = new CTableMeasurement(tblwidth_Mm, 2.54);

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    if(props.TableCellMar == null)
                        props.TableCellMar = {};
                    props.TableCellMar.Left   = new CTableMeasurement(tblwidth_Mm, s.GetULong() / 36000);
                    //props.TableCellMar.Left.W = s.GetULong() / 36000;
                    break;
                }
                case 1:
                {
                    if(props.TableCellMar == null)
                        props.TableCellMar = {};
                    props.TableCellMar.Top = new CTableMeasurement(tblwidth_Mm, s.GetULong() / 36000);

                    //  props.TableCellMar.Top.W = s.GetULong() / 36000;
                    break;
                }
                case 2:
                {
                    if(props.TableCellMar == null)
                        props.TableCellMar = {};
                    props.TableCellMar.Right   = new CTableMeasurement(tblwidth_Mm, s.GetULong() / 36000);
                    // props.TableCellMar.Right.W = s.GetULong() / 36000;
                    break;
                }
                case 3:
                {
                    if(props.TableCellMar == null)
                        props.TableCellMar = {};
                    props.TableCellMar.Bottom   = new CTableMeasurement(tblwidth_Mm, s.GetULong() / 36000);

                    //props.TableCellMar.Bottom.W = s.GetULong() / 36000;
                    break;
                }
                case 4:
                {
                    s.Skip2(1);
                    break;
                }
                case 5:
                {
                    var nVert = s.GetUChar();
                    switch (nVert)
                    {
                        case 0: props.TextDirection = Asc.c_oAscCellTextDirection.TBRL; break;
                        case 1: props.TextDirection = Asc.c_oAscCellTextDirection.LRTB;/*_T("horz"); */break;
                        case 2: props.TextDirection = Asc.c_oAscCellTextDirection.TBRL; break;
                        case 3: props.TextDirection = Asc.c_oAscCellTextDirection.TBRL; break;
                        case 4: props.TextDirection = Asc.c_oAscCellTextDirection.BTLR; break;
                        case 5: props.TextDirection = Asc.c_oAscCellTextDirection.BTLR; break;
                        case 6: props.TextDirection = Asc.c_oAscCellTextDirection.TBRL; break;
                        default:
                            props.TextDirection = Asc.c_oAscCellTextDirection.LRTB;
                            break;
                    }
                    break;
                }
                case 6:
                {
                    var nVertAlign = s.GetUChar();
                    switch (nVertAlign)
                    {
                        case 0://bottom
                        {
                            props.VAlign = vertalignjc_Bottom;
                            break;
                        }
                        case 1://ctr
                        case 2://dist
                        case 3: //just
                        {
                            props.VAlign = vertalignjc_Center;
                            break;
                        }
                        case 4://top
                        {
                            props.VAlign = vertalignjc_Top;
                            break;
                        }
                    }
                    //s.Skip2(1);
                    break;
                }
                case 7:
                {
                    s.Skip2(1);
                    break;
                }
                default:
                    break;
            }
        }


        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    if(!props.TableCellBorders)
                    {
                        props.TableCellBorders = {};
                    }
                    props.TableCellBorders.Left = this.ReadTableBorderLn();
                    break;
                }
                case 1:
                {
                    if(!props.TableCellBorders)
                    {
                        props.TableCellBorders = {};
                    }
                    props.TableCellBorders.Top = this.ReadTableBorderLn();
                    break;
                }
                case 2:
                {
                    if(!props.TableCellBorders)
                    {
                        props.TableCellBorders = {};
                    }
                    props.TableCellBorders.Right = this.ReadTableBorderLn();
                    break;
                }
                case 3:
                {
                    if(!props.TableCellBorders)
                    {
                        props.TableCellBorders = {};
                    }
                    props.TableCellBorders.Bottom = this.ReadTableBorderLn();
                    break;
                }
                case 4:
                {
                    s.SkipRecord();
                    break;
                }
                case 5:
                {
                    s.SkipRecord();
                    break;
                }
                case 6:
                {
                    var _unifill = this.ReadUniFill();

                    if (_unifill && _unifill.fill !== undefined && _unifill.fill != null)
                    {
                        props.Shd = new CDocumentShd();
                        props.Shd.Value = c_oAscShdClear;
                        props.Shd.Unifill = _unifill;
                    }
                    break;
                }
                case 7:
                {
                    s.SkipRecord();
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
    }

    this.ReadTableBorderLn = function()
    {
        var ln = this.ReadLn();

        var border = new CDocumentBorder();
        if(ln.Fill)
        {
            border.Unifill = ln.Fill;
        }
        border.Size = (ln.w == null) ? 12700 : ((ln.w) >> 0);
        border.Size /= 36000;

        border.Value = border_Single;

        return border;
    }

    this.ReadTablePr = function()
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        var obj = {};
        obj.props = new CTablePr();
        obj.look = new CTableLook(false, false, false, false, false, false);
        obj.style = -1;

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                   //var ind = this.map_table_styles[s.GetString2()];
                   //if (undefined !== ind)
                    obj.style = s.GetString2();
                    break;
                }
                case 1:
                {
                    s.Skip2(1);// rtl
                    break;
                }
                case 2:
                {
                    obj.look.m_bFirst_Row = s.GetBool();
                    break;
                }
                case 3:
                {
                    obj.look.m_bFirst_Col = s.GetBool();
                    break;
                }
                case 4:
                {
                    obj.look.m_bLast_Row = s.GetBool();
                    break;
                }
                case 5:
                {
                    obj.look.m_bLast_Col = s.GetBool();
                    break;
                }
                case 6:
                {
                    obj.look.m_bBand_Hor = s.GetBool();
                    break;
                }
                case 7:
                {
                    obj.look.m_bBand_Ver = s.GetBool();
                    break;
                }
                default:
                    break;
            }
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    var _unifill = this.ReadUniFill();
                    if (_unifill && _unifill.fill !== undefined && _unifill.fill != null)
                    {
                        obj.props.Shd = new CDocumentShd();
                        obj.props.Shd.Value = c_oAscShdClear;
                        obj.props.Shd.Unifill = _unifill;
                    }
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return obj;
    }

    this.ReadNvPr = function(nvPr)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    nvPr.setIsPhoto(s.GetBool());
                    break;
                }
                case 1:
                {
                    nvPr.setUserDrawn(s.GetBool());
                    break;
                }
                default:
                    break;
            }
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    nvPr.setPh(this.ReadPH());
                    break;
                }
                case 1:
                {
                    nvPr.setUniMedia(new AscFormat.UniMedia());
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
                default:
                {
                    var _len = s.GetULong();
                    s.Skip2(_len);
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
    }

    this.ReadPH = function()
    {
        var ph = new AscFormat.Ph();
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    ph.setHasCustomPrompt(s.GetBool());
                    break;
                }
                case 1:
                {
                    ph.setIdx(s.GetString2());
                    break;
                }
                case 2:
                {
                    ph.setOrient(s.GetUChar());
                    break;
                }
                case 3:
                {
                    ph.setSz(s.GetUChar());
                    break;
                }
                case 4:
                {
                    ph.setType(s.GetUChar());
                    break;
                }
                default:
                    break;
            }
        }

        s.Seek2(_end_rec);
        return ph;
    }

    // ------------------------------------------

    // TEXT PROPERTIES --------------------------

    this.ReadRunProperties = function()
    {
        var rPr = new CTextPr();

        var s = this.stream;
        var _end_rec = s.cur + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    var altLang = s.GetString2();
                    break;
                }
                case 1:
                {
                    rPr.Bold = s.GetBool();
                    break;
                }
                case 2:
                {
                    var baseline = s.GetLong();

                    if (baseline < 0)
                        rPr.VertAlign = AscCommon.vertalign_SubScript;
                    else if (baseline > 0)
                        rPr.VertAlign = AscCommon.vertalign_SuperScript;

                    break;
                }
                case 3:
                {
                    var bmk = s.GetString2();
                    break;
                }
                case 4:
                {
                    var _cap = s.GetUChar();
                    if (_cap == 0)
                    {
                        rPr.Caps = true;
                        rPr.SmallCaps = false;
                    }
                    else if (_cap == 1)
                    {
                        rPr.Caps = false;
                        rPr.SmallCaps = true;
                    }
                    else if (_cap == 2)
                    {
                        rPr.SmallCaps = false;
                        rPr.Caps = false;
                    }
                    break;
                }
                case 5:
                {
                    s.Skip2(1); // dirty
                    break;
                }
                case 6:
                {
                    s.Skip2(1); // error
                    break;
                }
                case 7:
                {
                    rPr.Italic = s.GetBool();
                    break;
                }
                case 8:
                {
                    s.Skip2(4); // kern
                    break;
                }
                case 9:
                {
                    s.Skip2(1); // kumimoji
                    break;
                }
                case 10:
                {
                    var lang = s.GetString2();
                    var nLcid = Asc.g_oLcidNameToIdMap[lang];
                    if(nLcid)
                        rPr.Lang.Val = nLcid;
                    break;
                }
                case 11:
                {
                    s.Skip2(1); // noproof
                    break;
                }
                case 12:
                {
                    s.Skip2(1); // normalizeH
                    break;
                }
                case 13:
                {
                    s.Skip2(1); // smtClean
                    break;
                }
                case 14:
                {
                    s.Skip2(4); // smtId
                    break;
                }
                case 15:
                {
                    //s.Skip2(4); // spc
                    rPr.Spacing = s.GetLong() * 25.4 / 7200;
                    break;
                }
                case 16:
                {
                    var _strike = s.GetUChar();
                    if (0 == _strike)
                    {
                        rPr.Strikeout = false;
                        rPr.DStrikeout = true;
                    }
                    else if (2 == _strike)
                    {
                        rPr.Strikeout = true;
                        rPr.DStrikeout = false;
                    }
                    else
                    {
                        rPr.Strikeout = false;
                        rPr.DStrikeout = false;
                    }
                    break;
                }
                case 17:
                {
                    var _size = s.GetLong() / 100;
                    _size = ((_size * 2) + 0.5) >> 0;
                    _size /= 2;
                    rPr.FontSize = _size;
                    break;
                }
                case 18:
                {
                    rPr.Underline = (s.GetUChar() != 12);
                    break;
                }
                default:
                    break;
            }
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    rPr.TextOutline = this.ReadLn();
                    break;
                }
                case 1:
                {
                    var oUniFill = this.ReadUniFill();
                    if(oUniFill && oUniFill.fill){
                        rPr.Unifill = oUniFill;
                    }
                    break;
                }
                case 2:
                {
                    s.SkipRecord();
                    break;
                }
                case 3:
                {
                    //latin
                    rPr.RFonts.Ascii = { Name: this.ReadTextFontTypeface(), Index : -1 };
                    rPr.RFonts.HAnsi = { Name: rPr.RFonts.Ascii.Name, Index : -1 };
                    break;
                }
                case 4:
                {
                    //ea
                    rPr.RFonts.EastAsia = { Name: this.ReadTextFontTypeface(), Index : -1 };
                    break;
                }
                case 5:
                {
                    //cs
                    rPr.RFonts.CS = { Name: this.ReadTextFontTypeface(), Index : -1 };
                    break;
                }
                case 6:
                {
                    //sym

                    s.SkipRecord();
                    //rPr.RFonts.HAnsi = { Name: this.ReadTextFontTypeface(), Index : -1 };
                    break;
                }
                case 7:
                {
                    rPr.hlink = this.ReadHyperlink();
                    if (null == rPr.hlink)
                        delete rPr.hlink;
                    break;
                }
                case 8:
                {
                    s.SkipRecord();
                    break;
                }
                case 12:
                {
                    //highlight
                    var end_rec__ = s.cur + s.GetULong() + 4;

                    s.Skip2(1); // start attributes
                    var  at__;
                    while (true)
                    {
                        at__ = s.GetUChar();
                        if (at__ === g_nodeAttributeEnd)
                            break;
                    }
                    while (s.cur < end_rec__)
                    {
                        at__ = s.GetUChar();
                        switch (at__)
                        {
                            case 0:
                            {
                                rPr.HighlightColor = this.ReadUniColor();
                                break;
                            }
                            default:
                            {
                                break;
                            }
                        }
                    }

                    s.Seek2(end_rec__);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                }
            }
        }

        s.Seek2(_end_rec);
        //checkTextPr(rPr);
        return rPr;
    }

    this.ReadHyperlink = function()
    {
        var hyper = new AscFormat.CT_Hyperlink();
        var s = this.stream;
        var _end_rec = s.cur + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    hyper.id = s.GetString2();
                    break;
                }
                case 1:
                {
                    hyper.invalidUrl = s.GetString2();
                    break;
                }
                case 2:
                {
                    hyper.action = s.GetString2();
                    break;
                }
                case 3:
                {
                    hyper.tgtFrame = s.GetString2();
                    break;
                }
                case 4:
                {
                    hyper.tooltip = s.GetString2();
                    break;
                }
                case 5:
                {
                    hyper.history = s.GetBool();
                    break;
                }
                case 6:
                {
                    hyper.highlightClick = s.GetBool();
                    break;
                }
                case 7:
                {
                    hyper.endSnd = s.GetBool();
                    break;
                }
                default:
                    break;
            }
        }

        s.Seek2(_end_rec);

        // correct hyperlink
        if (hyper.action != null && hyper.action != "")
        {
            if (hyper.action == "ppaction://hlinkshowjump?jump=firstslide")
                hyper.id = "ppaction://hlinkshowjump?jump=firstslide";
            else if (hyper.action == "ppaction://hlinkshowjump?jump=lastslide")
                hyper.id = "ppaction://hlinkshowjump?jump=lastslide";
            else if (hyper.action == "ppaction://hlinkshowjump?jump=nextslide")
                hyper.id = "ppaction://hlinkshowjump?jump=nextslide";
            else if (hyper.action == "ppaction://hlinkshowjump?jump=previousslide")
                hyper.id = "ppaction://hlinkshowjump?jump=previousslide";
            else if (hyper.action == "ppaction://hlinksldjump")
            {
                if (hyper.id != null && hyper.id.indexOf("slide") == 0)
                {
                    var _url = hyper.id.substring(5);
                    var _indexXml = _url.indexOf(".");
                    if (-1 != _indexXml)
                        _url = _url.substring(0, _indexXml);

                    var _slideNum = parseInt(_url);
                    if (isNaN(_slideNum))
                        _slideNum = 1;

                    --_slideNum;

                    hyper.id = hyper.action + "slide" + _slideNum;
                }
                else
                {
                    hyper.id = null;
                }
            }
            else
            {
                hyper.id = null;
            }
        }

        if (hyper.id == null)
            return null;

        return hyper;
    }

    this.CorrectBodyPr = function(bodyPr)
    {

        //TODO: сделать через методы
        var s = this.stream;
        var _end_rec = s.cur + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    bodyPr.flatTx = s.GetLong();
                    break;
                }
                case 1:
                {
                    bodyPr.anchor = s.GetUChar();
                    break;
                }
                case 2:
                {
                    bodyPr.anchorCtr = s.GetBool();
                    break;
                }
                case 3:
                {
                    bodyPr.bIns = s.GetLong()/36000;
                    break;
                }
                case 4:
                {
                    bodyPr.compatLnSpc = s.GetBool();
                    break;
                }
                case 5:
                {
                    bodyPr.forceAA = s.GetBool();
                    break;
                }
                case 6:
                {
                    bodyPr.fromWordArt = s.GetBool();
                    break;
                }
                case 7:
                {
                    bodyPr.horzOverflow = s.GetUChar();
                    break;
                }
                case 8:
                {
                    bodyPr.lIns = s.GetLong()/36000;
                    break;
                }
                case 9:
                {
                    bodyPr.numCol = s.GetLong();
                    break;
                }
                case 10:
                {
                    bodyPr.rIns = s.GetLong()/36000;
                    break;
                }
                case 11:
                {
                    bodyPr.rot = s.GetLong();
                    break;
                }
                case 12:
                {
                    bodyPr.rtlCol = s.GetBool();
                    break;
                }
                case 13:
                {
                    bodyPr.spcCol = s.GetLong()/36000;
                    break;
                }
                case 14:
                {
                    bodyPr.spcFirstLastPara = s.GetBool();
                    break;
                }
                case 15:
                {
                    bodyPr.tIns = s.GetLong()/36000;
                    break;
                }
                case 16:
                {
                    bodyPr.upright = s.GetBool();
                    break;
                }
                case 17:
                {
                    bodyPr.vert = s.GetUChar();
                    if(bodyPr.vert === AscFormat.nVertTTwordArtVert)
                        bodyPr.vert = AscFormat.nVertTTvert;
                    break;
                }
                case 18:
                {
                    bodyPr.vertOverflow = s.GetUChar();
                    break;
                }
                case 19:
                {
                    bodyPr.wrap = s.GetUChar();
                    break;
                }
                default:
                    break;
            }
        }

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0://prstTxWarp
                {
                    var _end_rec3 = s.cur + s.GetULong() + 4;
                    s.Skip2(1);// start attributes
                    while(true)
                    {
                        var _at2 = s.GetUChar();
                        if (_at2 == g_nodeAttributeEnd)
                            break;
                        switch (_at2) {
                            case 0:
                            {
                                var sPrst = s.GetUChar();
                                bodyPr.prstTxWarp = AscFormat.ExecuteNoHistory(function () {
                                    return AscFormat.CreatePrstTxWarpGeometry(AscFormat.getPrstByNumber(sPrst));
                                }, this, []);
                                break;
                            }
                        }
                    }
                    while (s.cur < _end_rec3)
                    {
                       var _at = s.GetUChar();
                       switch (_at)
                       {
                           case 0:
                           {
                               this.ReadGeomAdj(bodyPr.prstTxWarp );
                               break;
                           }
                           default:
                           {
                               s.SkipRecord();
                               break;
                           }
                       }
                    }
                    s.Seek2(_end_rec3);
                    break;
                }
                case 1:
                {
                    var _end_rec2 = s.cur + s.GetULong() + 4;

                    s.Skip2(1); // start attributes

                    var txFit = new AscFormat.CTextFit();
                    txFit.type = -1;

                    while (true)
                    {
                        var _at2 = s.GetUChar();
                        if (_at2 == g_nodeAttributeEnd)
                            break;

                        switch (_at2)
                        {
                            case 0:
                            {
                                txFit.type = s.GetLong() - 1;
                                break;
                            }
                            case 1:
                            {
                                txFit.fontScale = s.GetLong();
                                break;
                            }
                            case 2:
                            {
                                txFit.lnSpcReduction = s.GetLong();
                                break;
                            }
                            default:
                                break;
                        }
                    }
                    if (txFit.type != -1)
                    {
                        bodyPr.textFit = txFit;
                    }

                    s.Seek2(_end_rec2);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                }
            }
        }
        s.Seek2(_end_rec);
    }

    this.ReadBodyPr = function()
    {
        var bodyPr = new AscFormat.CBodyPr();
        this.CorrectBodyPr(bodyPr);
        return bodyPr;
    }

    this.ReadTextParagraphPr = function(par)
    {

        var para_pr = new CParaPr();
        var s = this.stream;
        var _end_rec = s.cur + s.GetULong() + 4;

        s.Skip2(1); // start attributes

        while (true)
        {
            var _at = s.GetUChar();
            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0:
                {
                    var _align = s.GetUChar();
                    switch (_align)
                    {
                        case 0: { para_pr.Jc = AscCommon.align_Center; break; }
                        case 1: { para_pr.Jc = AscCommon.align_Justify; break; }
                        case 2: { para_pr.Jc = AscCommon.align_Justify; break; }
                        case 3: { para_pr.Jc = AscCommon.align_Justify; break; }
                        case 4: { para_pr.Jc = AscCommon.align_Left; break; }
                        case 5: { para_pr.Jc = AscCommon.align_Right; break; }
                        case 6: { para_pr.Jc = AscCommon.align_Justify; break; }
                        default:
                            para_pr.Jc = AscCommon.align_Center;
                            break;
                    }
                    break;
                }
                case 1:
                {
                    para_pr.DefaultTab = s.GetLong()/36000;
                    break;
                }
                case 2:
                {
                    s.Skip2(1); // eaLnBrk
                    break;
                }
                case 3:
                {
                    s.Skip2(1); // font align
                    break;
                }
                case 4:
                {
                    s.Skip2(1); // hangingPunct
                    break;
                }
                case 5:
                {
                    para_pr.Ind.FirstLine = s.GetLong()/36000;
                    break;
                }
                case 6:
                {
                    s.Skip2(1); // latinLnBrk
                    break;
                }
                case 7:
                {
                    para_pr.Lvl = s.GetLong();
                    break;
                }
                case 8:
                {
                    para_pr.Ind.Left = s.GetLong()/36000;
                    break;
                }
                case 9:
                {
                    para_pr.Ind.Right = s.GetLong()/36000;
                    break;
                }
                case 10:
                {
                    s.Skip2(1); // rtl
                    break;
                }
                default:
                    break;
            }
        }

        var bullet = new AscFormat.CBullet();
        var b_bullet = false;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    s.Skip2(5); // len start attr

                    var Pts = null;
                    var Pct = null;
                    while (true)
                    {
                        var _at = s.GetUChar();
                        if (_at == g_nodeAttributeEnd)
                            break;

                        switch (_at)
                        {
                            case 0:
                            {
                                Pct = s.GetLong();
                                para_pr.Spacing.Line = Pct/100000;
                                para_pr.Spacing.LineRule = Asc.linerule_Auto;
                                break;
                            }
                            case 1:
                            {
                                Pts = s.GetLong();
                                para_pr.Spacing.Line = Pts*0.00352777778;
                                para_pr.Spacing.LineRule = Asc.linerule_Exact;
                                break;
                            }
                            default:
                                break;
                        }
                    }


                    // lnSpc
                    // TODO:
                    break;
                }
                case 1:
                {
                    s.Skip2(5); // len + start attr

                    var Pts = null;
                    var Pct = null;
                    while (true)
                    {
                        var _at = s.GetUChar();
                        if (_at == g_nodeAttributeEnd)
                            break;

                        switch (_at)
                        {
                            case 0:
                            {
                                Pct = s.GetLong();
                                para_pr.Spacing.After = 0;
                                para_pr.Spacing.AfterPct = Pct;
                                break;
                            }
                            case 1:
                            {
                                Pts = s.GetLong();
                                para_pr.Spacing.After = Pts*0.00352777778;
                                break;
                            }
                            default:
                                break;
                        }
                    }
                    // spcAft
                    // TODO:
                    break;
                }
                case 2:
                {
                    s.Skip2(5); // len + start attr

                    var Pts = null;
                    var Pct = null;
                    while (true)
                    {
                        var _at = s.GetUChar();
                        if (_at == g_nodeAttributeEnd)
                            break;

                        switch (_at)
                        {
                            case 0:
                            {
                                Pct = s.GetLong();
                                para_pr.Spacing.Before = 0;
                                para_pr.Spacing.BeforePct = Pct;
                                break;
                            }
                            case 1:
                            {
                                Pts = s.GetLong();
                                para_pr.Spacing.Before = Pts*0.00352777778;
                                break;
                            }
                            default:
                                break;
                        }
                    }

                    // spcBef
                    // TODO:
                    break;
                }
                case 3:
                {

                    var cur_pos = s.cur;
                    var _len = s.GetULong();
                    if (0 != _len)
                    {
                        b_bullet = true;
                        bullet.bulletColor = new AscFormat.CBulletColor();
                        bullet.bulletColor.type = s.GetUChar();

                        if (bullet.bulletColor.type == AscFormat.BULLET_TYPE_COLOR_CLRTX)
                        {
                            s.SkipRecord();
                        }
                        else
                        {
                            var _l = s.GetULong();
                            if (0 !== _l) {
                                s.Skip2(1);
                                bullet.bulletColor.UniColor = this.ReadUniColor();
                            }
                        }
                    }
                    s.Seek2(cur_pos + _len + 4);
                    break;
                }
                case 4:
                {
                    var cur_pos = s.cur;
                    var _len = s.GetULong();
                    if (0 != _len)
                    {
                        b_bullet = true;
                        bullet.bulletSize = new AscFormat.CBulletSize();

                        bullet.bulletSize.type = s.GetUChar();

                        if (bullet.bulletSize.type == AscFormat.BULLET_TYPE_SIZE_TX)
                        {
                            s.SkipRecord();
                        }
                        else
                        {
                            var _l = s.GetULong();
                            s.Skip2(2); // start attributes + type
                            bullet.bulletSize.val = s.GetLong();
                            s.Skip2(1); // end attributes
                        }
                    }
                    s.Seek2(cur_pos + _len + 4);
                    break;
                }
                case 5:
                {

                    var cur_pos = s.cur;
                    var _len = s.GetULong();
                    if (0 != _len)
                    {
                        b_bullet = true;
                        bullet.bulletTypeface = new AscFormat.CBulletTypeface();
                        bullet.bulletTypeface.type = s.GetUChar();

                        if (bullet.bulletTypeface.type == AscFormat.BULLET_TYPE_TYPEFACE_BUFONT)
                        {
                            bullet.bulletTypeface.typeface = this.ReadTextFontTypeface();
                        }
                        else
                        {
                            s.SkipRecord();
                        }
                    }
                    s.Seek2(cur_pos + _len + 4);
                    break;
                }
                case 6:
                {

                    var cur_pos = s.cur;
                    var _len = s.GetULong();
                    if (0 != _len)
                    {
                        b_bullet = true;
                        bullet.bulletType = new AscFormat.CBulletType();
                        bullet.bulletType.type = s.GetUChar();

                        if (bullet.bulletType.type == AscFormat.BULLET_TYPE_BULLET_NONE)
                        {
                            s.SkipRecord();
                        }
                        else if (bullet.bulletType.type == AscFormat.BULLET_TYPE_BULLET_BLIP)
                        {
                            s.SkipRecord();
                        }
                        else if (bullet.bulletType.type == AscFormat.BULLET_TYPE_BULLET_AUTONUM)
                        {
                            s.Skip2(5); // len + type + start attr

                            while (true)
                            {
                                var _at = s.GetUChar();
                                if (_at == g_nodeAttributeEnd)
                                    break;

                                switch (_at)
                                {
                                    case 0:
                                    {
                                        bullet.bulletType.AutoNumType = s.GetUChar();
                                        break;
                                    }
                                    case 1:
                                    {
                                        bullet.bulletType.startAt = s.GetLong();
                                        break;
                                    }
                                    default:
                                        break;
                                }
                            }
                        }
                        else if (bullet.bulletType.type == AscFormat.BULLET_TYPE_BULLET_CHAR)
                        {
                            s.Skip2(6);
                            bullet.bulletType.Char = s.GetString2();
                            AscFonts.FontPickerByCharacter.getFontsByString(bullet.bulletType.Char);
                            s.Skip2(1);
                        }
                    }
                    s.Seek2(cur_pos + _len + 4);
                    break;
                }
                case 7:
                {
                    s.Skip2(4);
                    var _c = s.GetULong();

                    if (0 != _c)
                    {
                        para_pr.Tabs = new CParaTabs();
                        var _value, _pos;
                        for (var i = 0; i < _c; i++)
                        {
                            s.Skip2(6); // type, len, start attr
                            _value = null;
                            _pos = null;
                            while (true)
                            {
                                var _at = s.GetUChar();
                                if (_at == g_nodeAttributeEnd)
                                    break;

                                switch (_at)
                                {
                                    case 0:
                                    {
                                        _value = s.GetUChar();

                                        if (_value == 0)
                                            _value = tab_Center;
                                        else if (_value == 3)
                                            _value = tab_Right;
                                        else
                                            _value = tab_Left;

                                        break;
                                    }
                                    case 1:
                                    {
                                        _pos = s.GetLong() / 36000;
                                        break;
                                    }
                                    default:
                                        break;
                                }
                            }
                            para_pr.Tabs.Add(new CParaTab(_value, _pos))
                        }
                    }
                    break;
                }
                case 8:
                {
                    var OldBlipCount = 0;

                    if (this.IsUseFullUrl && par)
                        OldBlipCount = this.RebuildImages.length;

                    var r_pr = this.ReadRunProperties();
                    if(r_pr)
                    {
                        para_pr.DefaultRunPr = new CTextPr();

                        if(r_pr.Unifill && !r_pr.Unifill.fill)
                        {
                            r_pr.Unifill = undefined;
                        }
                        para_pr.DefaultRunPr.Set_FromObject(r_pr);


                        if (this.IsUseFullUrl && par)
                        {

                            if(this.RebuildImages.length > OldBlipCount)
                            {
                                for(var _t = OldBlipCount; _t < this.RebuildImages.length; ++_t)
                                {
                                    var oTextPr = new CTextPr();
                                    oTextPr.Set_FromObject(r_pr);
                                    this.RebuildImages[_t].TextPr = oTextPr;
                                    this.RebuildImages[_t].Paragraph = par;
                                }
                            }

                        }

                    }
                    break;
                }
                default:
                {
                    s.SkipRecord();
                }
            }
        }

        if(b_bullet)
            para_pr.Bullet = bullet;
        // пока записи не поддерживаем
        s.Seek2(_end_rec);
        return para_pr;
    }

    this.ReadTextListStyle = function()
    {
        var styles = new AscFormat.TextListStyle();
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            styles.levels[_at] = this.ReadTextParagraphPr();
        }

        s.Seek2(_end_rec);
        return styles;
    }

    this.ReadTextBody = function(shape)
    {
        var txbody;

        if(shape)
        {
            if(shape.txBody)
            {
                txbody = shape.txBody;
            }
            else
            {
                txbody = new AscFormat.CTextBody();
                txbody.setParent(shape);
            }
        }
        else
        {
            txbody = new AscFormat.CTextBody();
        }
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    txbody.setBodyPr(this.ReadBodyPr());
                    if(txbody.bodyPr && txbody.bodyPr.textFit)
                    {
                        this.textBodyTextFit.push(txbody);
                    }
                    break;
                }
                case 1:
                {
                    txbody.setLstStyle(this.ReadTextListStyle());
                    break;
                }
                case 2:
                {
                    s.Skip2(4);
                    var _c = s.GetULong();
                    txbody.setContent(new AscFormat.CDrawingDocContent(txbody, this.presentation ? this.presentation.DrawingDocument : null, 0, 0, 0, 0, 0, 0, true));
                    if(_c>0)
                    {
                        txbody.content.Internal_Content_RemoveAll();
                    }
                    for (var i = 0; i < _c; i++)
                    {
                        s.Skip2(1); // type
                        var _paragraph = this.ReadParagraph(txbody.content);
                        _paragraph.Correct_Content();
                        txbody.content.Internal_Content_Add(txbody.content.Content.length, _paragraph);

                    }
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return txbody;
    }

    this.ReadTextBodyTxPr = function(shape)
    {
        var txbody;

        if(shape.txPr)
            txbody = shape.txPr;
        else
        {
            shape.txPr = new AscFormat.CTextBody();
            txbody = shape.txPr;
        }
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    shape.setBodyPr(this.ReadBodyPr());
                    break;
                }
                case 1:
                {
                    txbody.setLstStyle(this.ReadTextListStyle());
                    break;
                }
                case 2:
                {
                    s.Skip2(4);
                    var _c = s.GetULong();
                    /*if(History != null)
                     {
                     History.TurnOff();
                     }*/
                    if(!txbody.content)
                        txbody.content = new AscFormat.CDrawingDocContent(shape, this.presentation ? this.presentation.DrawingDocument : null, 0, 0, 0, 0, 0, 0, true);
                    if(_c>0)
                    {
                        txbody.content.Internal_Content_RemoveAll();
                    }

                    for (var i = 0; i < _c; i++)
                    {
                        s.Skip2(1); // type
                        var _paragraph = this.ReadParagraph(txbody.content);
                        _paragraph.Set_Parent(txbody.content);
                        txbody.content.Internal_Content_Add(txbody.content.Content.length, _paragraph);

                    }


                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
        return txbody;
    }

    this.ReadTextBody2 = function(content)
    {
        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;
        var oBodyPr;
        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    s.SkipRecord();
                    break;
                }
                case 1:
                {
                    s.SkipRecord();
                    break;
                }
                case 2:
                {
                    s.Skip2(4);
                    var _c = s.GetULong();
                    for (var i = 0; i < _c; i++)
                    {
                        s.Skip2(1); // type
                        var _paragraph = this.ReadParagraph(content);
                        content.Internal_Content_Add(content.Content.length, _paragraph);
                    }
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }

        s.Seek2(_end_rec);
    }

    this.ReadParagraph = function(DocumentContent)
    {
        var par = new Paragraph(DocumentContent.DrawingDocument, DocumentContent, true);

        var EndPos = 0;

        var s = this.stream;

        var _rec_start = s.cur;
        var _end_rec = _rec_start + s.GetULong() + 4;

        while (s.cur < _end_rec)
        {
            var _at = s.GetUChar();
            switch (_at)
            {
                case 0:
                {
                    par.Set_Pr(this.ReadTextParagraphPr(par));
                    break;
                }
                case 1:
                {
                    var OldImgCount = 0;
                    if(this.IsUseFullUrl)
                    {
                        OldImgCount = this.RebuildImages.length;
                    }
                    var endRunPr =  this.ReadRunProperties();
                    var _value_text_pr = new CTextPr();
                    if(endRunPr.Unifill && !endRunPr.Unifill.fill)
                    {
                        endRunPr.Unifill = undefined;
                    }
                    _value_text_pr.Set_FromObject(endRunPr);
                    par.TextPr.Apply_TextPr(_value_text_pr);//endRunProperties
                    var oTextPrEnd = new CTextPr();
                    oTextPrEnd.Set_FromObject(endRunPr);
                    par.Content[0].Set_Pr(oTextPrEnd);
                    if(this.IsUseFullUrl)
                    {
                        if(this.RebuildImages.length > OldImgCount)
                        {
                            for(var _t = OldImgCount; _t < this.RebuildImages.length; ++_t)
                            {
                                var _text_pr = new CTextPr();
                                _text_pr.Set_FromObject(endRunPr);
                                this.RebuildImages[_t].TextPr = _text_pr;
                                this.RebuildImages[_t].ParaTextPr = par.TextPr;
                                this.RebuildImages[_t].Run = par.Content[0];

                            }
                        }
                    }
                    break;
                }
                case 2:
                {
                    s.Skip2(4);

                    var _c = s.GetULong();
                    for (var i = 0; i < _c; i++)
                    {
                        s.Skip2(5); // type (0) + len
                        var _type = s.GetUChar();

                        switch (_type)
                        {
                            case AscFormat.PARRUN_TYPE_RUN:
                            {
                                var _end = s.cur + s.GetULong() + 4;

                                s.Skip2(1); // start attr

                                var _text = "";
                                while (true)
                                {
                                    var _at = s.GetUChar();
                                    if (_at == g_nodeAttributeEnd)
                                        break;

                                    if (0 == _at)
                                        _text = s.GetString2();
                                }

                                var OldImgCount = 0;
                                if(this.IsUseFullUrl)
                                {
                                    OldImgCount = this.RebuildImages.length;
                                }

                                var _run = null;
                                while (s.cur < _end)
                                {
                                    var _rec = s.GetUChar();

                                    if (0 == _rec)
                                        _run = this.ReadRunProperties();
                                    else
                                        s.SkipRecord();
                                }

                                s.Seek2(_end);


                                var new_run = new ParaRun(par, false), hyperlink = null;
                                if (null != _run)
                                {

                                    var text_pr = new CTextPr();
                                    if(_run.Unifill && !_run.Unifill.fill)
                                    {
                                        _run.Unifill = undefined;
                                    }
                                    if (_run.hlink !== undefined)
                                    {
                                        hyperlink = new ParaHyperlink();
                                        hyperlink.SetValue(_run.hlink.id);
                                        if (_run.hlink.tooltip) {
                                          hyperlink.SetToolTip(_run.hlink.tooltip);
                                        }
                                        // if(!_run.Unifill)
                                        // {
                                        //     _run.Unifill = AscFormat.CreateUniFillSchemeColorWidthTint(11, 0);
                                        // }
                                        _run.Underline = true;
                                    }
                                    text_pr.Set_FromObject(_run);
                                    new_run.Set_Pr(text_pr);
                                    if(this.IsUseFullUrl)
                                    {
                                        if(this.RebuildImages.length > OldImgCount)
                                        {
                                            for(var _t = OldImgCount; _t < this.RebuildImages.length; ++_t)
                                            {
                                                var _text_pr = new CTextPr();
                                                _text_pr.Set_FromObject(text_pr);
                                                this.RebuildImages[_t].TextPr = _text_pr;
                                                this.RebuildImages[_t].Run = new_run;

                                            }
                                        }
                                    }
                                }

                                new_run.AddText(_text);

                                if (hyperlink !== null)
                                {
                                    hyperlink.Add_ToContent(0, new_run, false);
                                    par.Internal_Content_Add(EndPos++, hyperlink);
                                }
                                else
                                {
                                    par.Internal_Content_Add(EndPos++, new_run);
                                }

                                break;
                            }
                            case AscFormat.PARRUN_TYPE_FLD:
                            {
                                var _end = s.cur + s.GetULong() + 4;

                                s.Skip2(1); // start attr

                                while (true)
                                {
                                    var _at = s.GetUChar();
                                    if (_at == g_nodeAttributeEnd)
                                        break;

                                    if (0 == _at)
                                        var f_id = s.GetString2();
                                    else if (1 == _at)
                                        var f_type = s.GetString2();
                                    else
                                        var f_text = s.GetString2();
                                }

                                var _rPr = null, _pPr = null;
                                while (s.cur < _end)
                                {
                                    var _at2 = s.GetUChar();
                                    switch (_at2)
                                    {
                                        case 0:
                                        {
                                            _rPr = this.ReadRunProperties();
                                            break;
                                        }
                                        case 1:
                                        {
                                            _pPr = this.ReadTextParagraphPr();
                                            break;
                                        }
                                        default:
                                        {
                                            s.SkipRecord();
                                            break;
                                        }
                                    }
                                }

                                var Fld = new AscCommonWord.CPresentationField(par);
                                if(f_id)
                                {
                                    Fld.SetGuid(f_id);
                                }
                                if(f_type)
                                {
                                    Fld.SetFieldType(f_type);
                                }
                                if(f_text)
                                {
                                    Fld.AddText(f_text);
                                }
                                if(_rPr)
                                {
                                    Fld.SetPr(_rPr);
                                }
                                if(_pPr)
                                {
                                    Fld.SetPPr(_pPr);
                                }

                                par.Internal_Content_Add(EndPos++, new ParaRun(par, false));
                                par.Internal_Content_Add(EndPos++, Fld);
                                par.Internal_Content_Add(EndPos++, new ParaRun(par, false));
                                s.Seek2(_end);
                                break;
                            }
                            case AscFormat.PARRUN_TYPE_BR:
                            {
                                var _end = s.cur + s.GetULong() + 4;

                                var _run = null;
                                while (s.cur < _end)
                                {
                                    var _rec = s.GetUChar();

                                    if (0 == _rec)
                                        _run = this.ReadRunProperties();
                                    else
                                        s.SkipRecord();
                                }

                                s.Seek2(_end);

                                var new_run = new ParaRun(par, false), hyperlink = null;
                                if (null != _run)
                                {
                                    if (_run.hlink !== undefined)
                                    {
                                        hyperlink = new ParaHyperlink();
                                        hyperlink.SetValue(_run.hlink.id);
                                        if (_run.hlink.tooltip) {
                                          hyperlink.SetToolTip(_run.hlink.tooltip);
                                        }
                                    }
                                    var text_pr = new CTextPr();
                                    if(_run.Unifill && !_run.Unifill.fill)
                                    {
                                        _run.Unifill = undefined;
                                    }
                                    text_pr.Set_FromObject(_run);
                                    new_run.Set_Pr(text_pr);
                                }
                                new_run.Add_ToContent( 0, new ParaNewLine(break_Line));
                                if (hyperlink !== null)
                                {
                                    hyperlink.Add_ToContent(0, new_run, false);
                                    par.Internal_Content_Add(EndPos++, hyperlink);
                                }
                                else
                                {
                                    par.Internal_Content_Add(EndPos++, new_run);
                                }
                                break;
                            }
							case AscFormat.PARRUN_TYPE_MATHPARA:
							case AscFormat.PARRUN_TYPE_MATH:
							{
								var _end = s.cur + s.GetULong() + 4;

								var _stream = new AscCommon.FT_Stream2();
								_stream.data = s.data;
								_stream.pos = s.pos;
								_stream.cur = s.cur;
								_stream.size = s.size;
								var parContentOld = par.Content.length;

								var oParStruct = new OpenParStruct(par, par);
                                oParStruct.cur.pos = par.Content.length - 1;
								var oReadResult = new AscCommonWord.DocReadResult(null);
								var boMathr = new Binary_oMathReader(_stream, oReadResult, null);
								var nDocLength = _stream.GetULongLE();
								if (AscFormat.PARRUN_TYPE_MATHPARA == _type) {
									var props = {};
									boMathr.bcr.Read1(nDocLength, function(t, l){
										return boMathr.ReadMathOMathPara(t,l,oParStruct, props);
									});
								} else {
									var oMath = new ParaMath();
									oParStruct.addToContent(oMath);
									boMathr.bcr.Read1(nDocLength, function(t, l){
										return boMathr.ReadMathArg(t,l,oMath.Root,oParStruct);
									});
									oMath.Root.Correct_Content(true);
								}
								s.Seek2(_end);

								EndPos += par.Content.length - parContentOld;
								break;
							}
                            default:
                            {
                                s.SkipRecord();
                                break;
                            }
                        }
                    }
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }
        s.Seek2(_end_rec);
        return par;
    }

    // ------------------------------------------
}

function CApp()
{
    this.Template = null;
    this.TotalTime = null;
    this.Words = null;
    this.Application = null;
    this.PresentationFormat = null;
    this.Paragraphs = null;
    this.Slides = null;
    this.Notes = null;
    this.HiddenSlides = null;
    this.MMClips = null;
    this.ScaleCrop = null;
    this.HeadingPairs = [];
    this.TitlesOfParts = [];
    this.Company = null;
    this.LinksUpToDate = null;
    this.SharedDoc = null;
    this.HyperlinksChanged = null;
    this.AppVersion = null;

    this.Characters = null;
    this.CharactersWithSpaces = null;
    this.DocSecurity = null;
    this.HyperlinkBase = null;
    this.Lines = null;
    this.Manager = null;
    this.Pages = null;
}
CApp.prototype.fromStream = function(s)
{
    var _type = s.GetUChar();
    var _len = s.GetULong();
    var _start_pos = s.cur;
    var _end_pos = _len + _start_pos;
    var _at;

    // attributes
    var _sa = s.GetUChar();

    while (true)
    {
        _at = s.GetUChar();

        if (_at == g_nodeAttributeEnd)
            break;

        switch (_at)
        {
            case 0: { this.Template = s.GetString2(); break; }
            case 1: { this.Application = s.GetString2(); break; }
            case 2: { this.PresentationFormat = s.GetString2(); break; }
            case 3: { this.Company = s.GetString2(); break; }
            case 4: { this.AppVersion = s.GetString2(); break; }

            case 5: { this.TotalTime = s.GetLong(); break; }
            case 6: { this.Words = s.GetLong(); break; }
            case 7: { this.Paragraphs = s.GetLong(); break; }
            case 8: { this.Slides = s.GetLong(); break; }
            case 9: { this.Notes = s.GetLong(); break; }
            case 10: { this.HiddenSlides = s.GetLong(); break; }
            case 11: { this.MMClips = s.GetLong(); break; }

            case 12: { this.ScaleCrop = s.GetBool(); break; }
            case 13: { this.LinksUpToDate = s.GetBool(); break; }
            case 14: { this.SharedDoc = s.GetBool(); break; }
            case 15: { this.HyperlinksChanged = s.GetBool(); break; }
            default:
                return;
        }
    }
    while (true)
    {
        if (s.cur >= _end_pos)
            break;

        _type = s.GetUChar();
        switch (_type)
        {
            case 0:
            {
                var _end_rec2 = s.cur + s.GetLong() + 4;
                s.Skip2(1); // start attributes
                while (true)
                {
                    _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    switch (_at)
                    {
                        case 16: { this.Characters = s.GetLong(); break; }
                        case 17: { this.CharactersWithSpaces = s.GetLong(); break; }
                        case 18: { this.DocSecurity = s.GetLong(); break; }
                        case 19: { this.HyperlinkBase = s.GetString2(); break; }
                        case 20: { this.Lines = s.GetLong(); break; }
                        case 21: { this.Manager = s.GetString2(); break; }
                        case 22: { this.Pages = s.GetLong(); break; }
                        default:
                            return;
                    }
                }
                s.Seek2(_end_rec2);
                break;
            }
            default:
            {
                s.SkipRecord();
                break;
            }
        }
    }
    s.Seek2(_end_pos);
};
CApp.prototype.toStream = function(s) {
    s.StartRecord(AscCommon.c_oMainTables.App);

    s.WriteUChar(AscCommon.g_nodeAttributeStart);

    s._WriteString2(0, this.Template);
    // just in case
    // s._WriteString2(1, this.Application);
    s._WriteString2(2, this.PresentationFormat);
    s._WriteString2(3, this.Company);
    // just in case
    // s._WriteString2(4, this.AppVersion);

    //we don't count these stats
    // s._WriteInt2(5, this.TotalTime);
    // s._WriteInt2(6, this.Words);
    // s._WriteInt2(7, this.Paragraphs);
    // s._WriteInt2(8, this.Slides);
    // s._WriteInt2(9, this.Notes);
    // s._WriteInt2(10, this.HiddenSlides);
    // s._WriteInt2(11, this.MMClips);

    s._WriteBool2(12, this.ScaleCrop);
    s._WriteBool2(13, this.LinksUpToDate);
    s._WriteBool2(14, this.SharedDoc);
    s._WriteBool2(15, this.HyperlinksChanged);

    s.WriteUChar(g_nodeAttributeEnd);

    s.StartRecord(0);

    s.WriteUChar(AscCommon.g_nodeAttributeStart);

    // s._WriteInt2(16, this.Characters);
    // s._WriteInt2(17, this.CharactersWithSpaces);
    s._WriteInt2(18, this.DocSecurity);
    s._WriteString2(19, this.HyperlinkBase);
    // s._WriteInt2(20, this.Lines);
    s._WriteString2(21, this.Manager);
    // s._WriteInt2(22, this.Pages);

    s.WriteUChar(g_nodeAttributeEnd);

    s.EndRecord();

    s.EndRecord();
};
CApp.prototype.asc_getTemplate = function(){return this.Template;};
CApp.prototype.asc_getTotalTime = function(){return this.TotalTime;};
CApp.prototype.asc_getWords = function(){return this.Words;};
CApp.prototype.asc_getApplication = function(){return this.Application;};
CApp.prototype.asc_getPresentationFormat = function(){return this.PresentationFormat;};
CApp.prototype.asc_getParagraphs = function(){return this.Paragraphs;};
CApp.prototype.asc_getSlides = function(){return this.Slides;};
CApp.prototype.asc_getNotes = function(){return this.Notes;};
CApp.prototype.asc_getHiddenSlides = function(){return this.HiddenSlides;};
CApp.prototype.asc_getMMClips = function(){return this.MMClips;};
CApp.prototype.asc_getScaleCrop = function(){return this.ScaleCrop;};
CApp.prototype.asc_getCompany = function(){return this.Company;};
CApp.prototype.asc_getLinksUpToDate = function(){return this.LinksUpToDate;};
CApp.prototype.asc_getSharedDoc = function(){return this.SharedDoc;};
CApp.prototype.asc_getHyperlinksChanged = function(){return this.HyperlinksChanged;};
CApp.prototype.asc_getAppVersion = function(){return this.AppVersion;};
CApp.prototype.asc_getCharacters = function(){return this.Characters;};
CApp.prototype.asc_getCharactersWithSpaces = function(){return this.CharactersWithSpaces;};
CApp.prototype.asc_getDocSecurity = function(){return this.DocSecurity;};
CApp.prototype.asc_getHyperlinkBase = function(){return this.HyperlinkBase;};
CApp.prototype.asc_getLines = function(){return this.Lines;};
CApp.prototype.asc_getManager = function(){return this.Manager;};
CApp.prototype.asc_getPages = function(){return this.Pages;};

    function CChangesCorePr(Class, Old, New, Color) {
        AscDFH.CChangesBase.call(this, Class, Old, New, Color);
        if(Old && New) {
            this.OldTitle = Old.title;
            this.OldCreator = Old.creator;
            this.OldDescription = Old.description;
            this.OldSubject = Old.subject;

            this.NewTitle = New.title === Old.title ? undefined : New.title;
            this.NewCreator = New.creator === Old.creator ? undefined : New.creator;
            this.NewDescription = New.description === Old.description ? undefined : New.description;
            this.NewSubject = New.subject === Old.subject ? undefined : New.subject;
        }
        else {
            this.OldTitle = undefined;
            this.OldCreator = undefined;
            this.OldDescription = undefined;
            this.OldSubject = undefined;

            this.NewTitle = undefined;
            this.NewCreator = undefined;
            this.NewDescription = undefined;
            this.NewSubject = undefined;
        }
    }
    CChangesCorePr.prototype = Object.create(AscDFH.CChangesBase.prototype);
    CChangesCorePr.prototype.constructor = CChangesCorePr;
    CChangesCorePr.prototype.Type = AscDFH.historyitem_CoreProperties;
    CChangesCorePr.prototype.Undo = function(){
        if(!this.Class) {
            return;
        }
        this.Class.title = this.OldTitle;
        this.Class.creator = this.OldCreator;
        this.Class.description = this.OldDescription;
        this.Class.subject = this.OldSubject;
    };
    CChangesCorePr.prototype.Redo = function(){
        if(!this.Class) {
            return;
        }
        if(this.NewTitle !== undefined) {
            this.Class.title = this.NewTitle;
        }
        if(this.NewCreator !== undefined) {
            this.Class.creator = this.NewCreator;
        }
        if(this.NewDescription !== undefined) {
            this.Class.description = this.NewDescription;
        }
        if(this.NewSubject !== undefined) {
            this.Class.subject = this.NewSubject;
        }
    };
    CChangesCorePr.prototype.WriteToBinary = function(Writer) {
        var nFlags = 0;
        if (undefined !== this.NewTitle) {
            nFlags |= 1;
        }
        if (undefined !== this.NewCreator) {
            nFlags |= 2;
        }
        if (undefined !== this.NewDescription) {
            nFlags |= 4;
        }
        if (undefined !== this.NewSubject) {
            nFlags |= 8;
        }

        Writer.WriteLong(nFlags);
        var bIsField;
        if(nFlags & 1) {
            bIsField = typeof this.NewTitle === "string";
            Writer.WriteBool(bIsField);
            if(bIsField) {
                Writer.WriteString2(this.NewTitle);
            }
        }
        if(nFlags & 2) {
            bIsField = typeof this.NewCreator === "string";
            Writer.WriteBool(bIsField);
            if(bIsField) {
                Writer.WriteString2(this.NewCreator);
            }
        }
        if(nFlags & 4) {
            bIsField = typeof this.NewDescription === "string";
            Writer.WriteBool(bIsField);
            if(bIsField) {
                Writer.WriteString2(this.NewDescription);
            }
        }
        if(nFlags & 8) {
            bIsField = typeof this.NewSubject === "string";
            Writer.WriteBool(bIsField);
            if(bIsField) {
                Writer.WriteString2(this.NewSubject);
            }
        }
    };

    CChangesCorePr.prototype.ReadFromBinary = function(Reader) {
        var nFlags = Reader.GetLong();
        var bIsField;
        if(nFlags & 1) {
            bIsField = Reader.GetBool();
            if(bIsField) {
                this.NewTitle = Reader.GetString2();
            }
            else {
                this.NewTitle = null;
            }
        }
        if(nFlags & 2) {
            bIsField = Reader.GetBool();
            if(bIsField) {
                this.NewCreator = Reader.GetString2();
            }
            else {
                this.NewCreator = null;
            }
        }
        if(nFlags & 4) {
            bIsField = Reader.GetBool();
            if(bIsField) {
                this.NewDescription = Reader.GetString2();
            }
            else {
                this.NewDescription = null;
            }
        }
        if(nFlags & 8) {
            bIsField = Reader.GetBool();
            if(bIsField) {
                this.NewSubject = Reader.GetString2();
            }
            else {
                this.NewSubject = null;
            }
        }
    };
    CChangesCorePr.prototype.CreateReverseChange = function(){
        var ret = new CChangesCorePr(this.Class);
        ret.OldTitle = this.NewTitle ;
        ret.OldCreator = this.NewCreator;
        ret.OldDescription = this.NewCreator;
        ret.OldSubject = this.NewSubject;
        ret.NewTitle = this.OldTitle ;
        ret.NewCreator = this.OldCreator;
        ret.NewDescription = this.OldCreator;
        ret.NewSubject = this.OldSubject;
        return ret;
    };

    AscDFH.changesFactory[AscDFH.historyitem_CoreProperties] = CChangesCorePr;

function CCore() {
    this.category = null;
    this.contentStatus = null;//Status in menu
    this.created = null;
    this.creator = null;// Authors in menu
    this.description = null;//Comments in menu
    this.identifier = null;
    this.keywords = null;
    this.language = null;
    this.lastModifiedBy = null;
    this.lastPrinted = null;
    this.modified = null;
    this.revision = null;
    this.subject = null;
    this.title = null;
    this.version = null;

    this.Id = AscCommon.g_oIdCounter.Get_NewId();
    this.Lock = new AscCommon.CLock();
    this.lockType = AscCommon.c_oAscLockTypes.kLockTypeNone;
    AscCommon.g_oTableId.Add( this, this.Id );
}
CCore.prototype.fromStream = function(s)
{
    var _type = s.GetUChar();
    var _len = s.GetULong();
    var _start_pos = s.cur;
    var _end_pos = _len + _start_pos;
    var _at;

    // attributes
    var _sa = s.GetUChar();

    while (true)
    {
        _at = s.GetUChar();

        if (_at == g_nodeAttributeEnd)
            break;

        switch (_at)
        {
            case 0: { this.title = s.GetString2(); break; }
            case 1: { this.creator = s.GetString2(); break; }
            case 2: { this.lastModifiedBy = s.GetString2(); break; }
            case 3: { this.revision = s.GetString2(); break; }
            case 4: { this.created = this.readDate(s.GetString2()); break; }
            case 5: { this.modified = this.readDate(s.GetString2()); break; }
            default:
                return;
        }
    }
    while (true)
    {
        if (s.cur >= _end_pos)
            break;

        _type = s.GetUChar();
        switch (_type)
        {
            case 0:
            {
                var _end_rec2 = s.cur + s.GetLong() + 4;
                s.Skip2(1); // start attributes
                while (true)
                {
                    _at = s.GetUChar();
                    if (_at == g_nodeAttributeEnd)
                        break;

                    switch (_at)
                    {
                        case 6: { this.category = s.GetString2(); break; }
                        case 7: { this.contentStatus = s.GetString2(); break; }
                        case 8: { this.description = s.GetString2(); break; }
                        case 9: { this.identifier = s.GetString2(); break; }
                        case 10: { this.keywords = s.GetString2(); break; }
                        case 11: { this.language = s.GetString2(); break; }
                        case 12: { this.lastPrinted = this.readDate(s.GetString2()); break; }
                        case 13: { this.subject = s.GetString2(); break; }
                        case 14: { this.version = s.GetString2(); break; }
                        default:
                            return;
                    }
                }
                s.Seek2(_end_rec2);
                break;
            }
            default:
            {
                s.SkipRecord();
                break;
            }
        }
    }
    s.Seek2(_end_pos);
};
CCore.prototype.readDate = function(val)
{
    val = new Date(val);
    return val instanceof Date && !isNaN(val) ? val : null;
};
CCore.prototype.toStream = function(s, api) {
    s.StartRecord(AscCommon.c_oMainTables.Core);

    s.WriteUChar(AscCommon.g_nodeAttributeStart);

    s._WriteString2(0, this.title);
    s._WriteString2(1, this.creator);
    if(api && api.DocInfo){
        s._WriteString2(2, api.DocInfo.get_UserName());
    }
    var revision = 0;
    if (this.revision) {
        var rev = parseInt(this.revision);
        if (!isNaN(rev)) {
            revision = rev;
        }
    }
    s._WriteString2(3, (revision + 1).toString());

    if (this.created) {
        s._WriteString2(4, this.created.toISOString().slice(0, 19) + 'Z');
    }
    s._WriteString2(5, new Date().toISOString().slice(0, 19) + 'Z');

    s.WriteUChar(g_nodeAttributeEnd);

    s.StartRecord(0);

    s.WriteUChar(AscCommon.g_nodeAttributeStart);

    s._WriteString2(6, this.category);
    s._WriteString2(7, this.contentStatus);
    s._WriteString2(8, this.description);
    s._WriteString2(9, this.identifier);
    s._WriteString2(10, this.keywords);
    s._WriteString2(11, this.language);
    // we don't track it
    // if (this.lastPrinted) {
    //     s._WriteString1(12, this.lastPrinted.toISOString().slice(0, 19) + 'Z');
    // }
    s._WriteString2(13, this.subject);
    s._WriteString2(14, this.version);

    s.WriteUChar(g_nodeAttributeEnd);

    s.EndRecord();

    s.EndRecord();
};
CCore.prototype.asc_getTitle = function(){return this.title;};
CCore.prototype.asc_getCreator = function(){return this.creator;};
CCore.prototype.asc_getLastModifiedBy = function(){return this.lastModifiedBy;};
CCore.prototype.asc_getRevision = function(){return this.revision;};
CCore.prototype.asc_getCreated = function(){return this.created;};
CCore.prototype.asc_getModified = function(){return this.modified;};
CCore.prototype.asc_getCategory = function(){return this.category;};
CCore.prototype.asc_getContentStatus = function(){return this.contentStatus;};
CCore.prototype.asc_getDescription = function(){return this.description;};
CCore.prototype.asc_getIdentifier = function(){return this.identifier;};
CCore.prototype.asc_getKeywords = function(){return this.keywords;};
CCore.prototype.asc_getLanguage = function(){return this.language;};
CCore.prototype.asc_getLastPrinted = function(){return this.lastPrinted;};
CCore.prototype.asc_getSubject = function(){return this.subject;};
CCore.prototype.asc_getVersion = function(){return this.version;};

CCore.prototype.asc_putTitle = function(v){this.title = v;};
CCore.prototype.asc_putCreator = function(v){this.creator = v;};
CCore.prototype.asc_putLastModifiedBy = function(v){this.lastModifiedBy = v;};
CCore.prototype.asc_putRevision = function(v){this.revision = v;};
CCore.prototype.asc_putCreated = function(v){this.created = v;};
CCore.prototype.asc_putModified = function(v){this.modified = v;};
CCore.prototype.asc_putCategory = function(v){this.category = v;};
CCore.prototype.asc_putContentStatus = function(v){this.contentStatus = v;};
CCore.prototype.asc_putDescription = function(v){this.description = v;};
CCore.prototype.asc_putIdentifier = function(v){this.identifier = v;};
CCore.prototype.asc_putKeywords = function(v){this.keywords = v;};
CCore.prototype.asc_putLanguage = function(v){this.language = v;};
CCore.prototype.asc_putLastPrinted = function(v){this.lastPrinted = v;};
CCore.prototype.asc_putSubject = function(v){this.subject = v;};
CCore.prototype.asc_putVersion = function(v){this.version = v;};

CCore.prototype.setProps = function(oProps){
    History.Add(new CChangesCorePr(this, this, oProps, null));
    this.title = oProps.title;
    this.creator = oProps.creator;
    this.description = oProps.description;
    this.subject = oProps.subject;
};
CCore.prototype.Get_Id = function(){
    return this.Id;
};
CCore.prototype.Refresh_RecalcData = function(){
};

CCore.prototype.Refresh_RecalcData2 = function(){
};


    CCore.prototype.getObjectType = function () {
        return AscDFH.historyitem_type_Core;
    };

    CCore.prototype.Write_ToBinary2 = function (oWriter) {
        oWriter.WriteLong(this.getObjectType());
        oWriter.WriteString2(this.Get_Id());
    };

    CCore.prototype.Read_FromBinary2 = function (oReader) {
        this.Id = oReader.GetString2();
    };


    CCore.prototype.copy = function(){
        return AscFormat.ExecuteNoHistory(function(){
            var oCopy = new CCore();
            oCopy.category = this.category;
            oCopy.contentStatus = this.contentStatus;
            oCopy.created = this.created;
            oCopy.creator = this.creator;
            oCopy.description = this.description;
            oCopy.identifier = this.identifier;
            oCopy.keywords = this.keywords;
            oCopy.language = this.language;
            oCopy.lastModifiedBy = this.lastModifiedBy;
            oCopy.lastPrinted = this.lastPrinted;
            oCopy.modified = this.modified;
            oCopy.revision = this.revision;
            oCopy.subject = this.subject;
            oCopy.title = this.title;
            oCopy.version = this.version;
            return oCopy;
        }, this, []);
    };

function CPres()
{
    this.defaultTextStyle = null;
    this.SldSz = null;
    this.NotesSz = null;

    this.attrAutoCompressPictures = null;
    this.attrBookmarkIdSeed = null;
    this.attrCompatMode = null;
    this.attrConformance = null;
    this.attrEmbedTrueTypeFonts = null;
    this.attrFirstSlideNum = null;
    this.attrRemovePersonalInfoOnSave = null;
    this.attrRtl = null;
    this.attrSaveSubsetFonts = null;
    this.attrServerZoom = null;
    this.attrShowSpecialPlsOnTitleSld = null;
    this.attrStrictFirstAndLastChars = null;

    this.fromStream = function(s, reader)
    {
        var _type = s.GetUChar();
        var _len = s.GetULong();
        var _start_pos = s.cur;
        var _end_pos = _len + _start_pos;

        // attributes
        var _sa = s.GetUChar();

        while (true)
        {
            var _at = s.GetUChar();

            if (_at == g_nodeAttributeEnd)
                break;

            switch (_at)
            {
                case 0: { this.attrAutoCompressPictures = s.GetBool(); break; }
                case 1: { this.attrBookmarkIdSeed = s.GetLong(); break; }
                case 2: { this.attrCompatMode = s.GetBool(); break; }
                case 3: { this.attrConformance = s.GetUChar(); break; }
                case 4: { this.attrEmbedTrueTypeFonts = s.GetBool(); break; }
                case 5: { this.attrFirstSlideNum = s.GetLong(); break; }
                case 6: { this.attrRemovePersonalInfoOnSave = s.GetBool(); break; }
                case 7: { this.attrRtl = s.GetBool(); break; }
                case 8: { this.attrSaveSubsetFonts = s.GetBool(); break; }
                case 9: { this.attrServerZoom = s.GetString2(); break; }
                case 10: { this.attrShowSpecialPlsOnTitleSld = s.GetBool(); break; }
                case 11: { this.attrStrictFirstAndLastChars = s.GetBool(); break; }
                default:
                    return;
            }
        }

        while (true)
        {
            if (s.cur >= _end_pos)
                break;

            _type = s.GetUChar();
            switch (_type)
            {
                case 0:
                {
                    this.defaultTextStyle = reader.ReadTextListStyle();
                    break;
                }
                case 1: { s.SkipRecord(); break; }
                case 2: { s.SkipRecord(); break; }
                case 3: { s.SkipRecord(); break; }
                case 4: { s.SkipRecord(); break; }
                case 5:
                {
                    this.SldSz = {};
                    s.Skip2(5); // len + start attributes

                    while (true)
                    {
                        var _at = s.GetUChar();

                        if (_at == g_nodeAttributeEnd)
                            break;

                        switch (_at)
                        {
                            case 0: { this.SldSz.cx = s.GetLong(); break; }
                            case 1: { this.SldSz.cy = s.GetLong(); break; }
                            case 2: { this.SldSz.type = s.GetUChar(); break; }
                            default:
                                return;
                        }
                    }

                    break;
                }
                case 6:
                {
                    var _end_rec2 = s.cur + s.GetULong() + 4;
                    while (s.cur < _end_rec2)
                    {
                        var _rec = s.GetUChar();

                        switch (_rec)
                        {
                            case 0:
                            {
                                s.Skip2(4); // len
                                var lCount = s.GetULong();

                                for (var i = 0; i < lCount; i++)
                                {
                                    s.Skip2(1);

                                    var _author = new AscCommon.CCommentAuthor();

                                    var _end_rec3 = s.cur + s.GetLong() + 4;
                                    s.Skip2(1); // start attributes

                                    while (true)
                                    {
                                        var _at2 = s.GetUChar();
                                        if (_at2 == g_nodeAttributeEnd)
                                            break;

                                        switch (_at2)
                                        {
                                            case 0:
                                                _author.Id = s.GetLong();
                                                break;
                                            case 1:
                                                _author.LastId = s.GetLong();
                                                break;
                                            case 2:
                                                var _clr_idx = s.GetLong();
                                                break;
                                            case 3:
                                                _author.Name = s.GetString2();
                                                break;
                                            case 4:
                                                _author.Initials = s.GetString2();
                                                break;
                                            default:
                                                break;
                                        }
                                    }

                                    s.Seek2(_end_rec3);

                                    reader.presentation.CommentAuthors[_author.Name] = _author;
                                }

                                break;
                            }
                            default:
                            {
                                s.SkipRecord();
                                break;
                            }
                        }
                    }

                    s.Seek2(_end_rec2);
                    break;
                }
				case 9:
				{
					var _length = s.GetULong();
					var _end_rec2 = s.cur + _length;

					reader.presentation.Api.macros.SetData(AscCommon.GetStringUtf8(s, _length));
					s.Seek2(_end_rec2);
					break;
				}
                case 10:
                {
                    reader.ReadComments(reader.presentation.writecomments);
                    break;
                }
                default:
                {
                    s.SkipRecord();
                    break;
                }
            }
        }
        if(reader.presentation.Load_Comments)
        {
            reader.presentation.Load_Comments(reader.presentation.CommentAuthors);
        }
        s.Seek2(_end_pos);
    }
}

    function CPPTXContentLoader()
    {
        this.Reader = new AscCommon.BinaryPPTYLoader();
        this.Writer = null;

        this.stream = null;
        this.TempMainObject = null;
        this.ParaDrawing = null;
        this.LogicDocument = null;
        this.BaseReader = null;

        this.ImageMapChecker = {};

        this.Start_UseFullUrl = function(insertDocumentUrlsData)
        {
            this.Reader.Start_UseFullUrl(insertDocumentUrlsData);
        }
        this.End_UseFullUrl = function()
        {
            return this.Reader.End_UseFullUrl();
        }

        this.ReadDrawing = function(reader, stream, logicDocument, paraDrawing)
        {
            if(reader){
                this.BaseReader = reader;
            }
            if (this.Reader == null)
                this.Reader = new AscCommon.BinaryPPTYLoader();

            if (null != paraDrawing)
            {
                this.ParaDrawing = paraDrawing;
                this.TempMainObject = null;
            }
            this.LogicDocument = logicDocument;

            this.Reader.ImageMapChecker = this.ImageMapChecker;

            if (null == this.stream)
            {
                this.stream = new AscCommon.FileStream();
                this.stream.obj    = stream.obj;
                this.stream.data   = stream.data;
                this.stream.size   = stream.size;
            }

            this.stream.pos    = stream.pos;
            this.stream.cur    = stream.cur;

            this.Reader.stream = this.stream;
            this.Reader.presentation = logicDocument;

            var GrObject = null;

            var s = this.stream;
            var _main_type = s.GetUChar(); // 0!!!

            var _rec_start = s.cur;
            var _end_rec = _rec_start + s.GetULong() + 4;
            if (s.cur < _end_rec){
                s.Skip2(5); // 1 + 4 byte - len

                var _type = s.GetUChar();
                switch (_type)
                {
                    case 1:
                    {
                        GrObject = this.ReadShape();
                        break;
                    }
                    case 6:
                    case 2:
                    case 7:
                    case 8:
                    {
                        GrObject = this.ReadPic(_type);
                        break;
                    }
                    case 3:
                    {
                        GrObject = this.ReadCxn();
                        break;
                    }
                    case 4:
                    {
                        GrObject = this.ReadGroupShape();
                        break;
                    }
                    case 5:
                    {
                        s.SkipRecord();
                        break;
                    }
                    case 9:
                    {
                        GrObject = this.Reader.ReadGroupShape(9);
                        if(paraDrawing){
                            GrObject.setParent(paraDrawing);
                        }
                        break;
                    }
                    default:
                    {
                        s.SkipRecord();
                        break;
                    }
                }
            }

            s.Seek2(_end_rec);
            stream.pos = s.pos;
            stream.cur = s.cur;

            return GrObject;
        }

        this.ReadGraphicObject = function(stream, presentation)
        {
            if (this.Reader == null)
                this.Reader = new AscCommon.BinaryPPTYLoader();

            if(presentation)
            {
                this.Reader.presentation = presentation;
            }
            var oLogicDocument = this.LogicDocument;
            this.LogicDocument = null;

            this.Reader.ImageMapChecker = this.ImageMapChecker;

            if (null == this.stream)
            {
                this.stream = new AscCommon.FileStream();
                this.stream.obj    = stream.obj;
                this.stream.data   = stream.data;
                this.stream.size   = stream.size;
            }

            this.stream.pos    = stream.pos;
            this.stream.cur    = stream.cur;

            this.Reader.stream = this.stream;

            var s = this.stream;
            var _main_type = s.GetUChar(); // 0!!!

            var _rec_start = s.cur;
            var _end_rec = _rec_start + s.GetULong() + 4;

            s.Skip2(5); // 1 + 4 byte - len

            var GrObject = this.Reader.ReadGraphicObject();

            s.Seek2(_end_rec);
            stream.pos = s.pos;
            stream.cur = s.cur;
            this.LogicDocument = oLogicDocument;
            return GrObject;
        }

        this.ReadTextBody = function(reader, stream, shape, presentation)
        {
            if(reader){
                this.BaseReader = reader;
            }
            if (this.Reader == null)
                this.Reader = new AscCommon.BinaryPPTYLoader();
            if(presentation)
                this.Reader.presentation = presentation;

            var oLogicDocument = this.LogicDocument;
            this.LogicDocument = null;

            this.Reader.ImageMapChecker = this.ImageMapChecker;

            if (null == this.stream)
            {
                this.stream = new AscCommon.FileStream();
                this.stream.obj    = stream.obj;
                this.stream.data   = stream.data;
                this.stream.size   = stream.size;
            }

            this.stream.pos    = stream.pos;
            this.stream.cur    = stream.cur;

            this.Reader.stream = this.stream;

            var s = this.stream;
            var _main_type = s.GetUChar(); // 0!!!

            var txBody = this.Reader.ReadTextBody(shape);

            stream.pos = s.pos;
            stream.cur = s.cur;
            this.LogicDocument = oLogicDocument;
            return txBody;
        }

        this.ReadTextBodyTxPr = function(reader, stream, shape)
        {
            if(reader){
                this.BaseReader = reader;
            }
            if (this.Reader == null)
                this.Reader = new AscCommon.BinaryPPTYLoader();

            var oLogicDocument = this.LogicDocument;
            this.LogicDocument = null;

            this.Reader.ImageMapChecker = this.ImageMapChecker;

            if (null == this.stream)
            {
                this.stream = new AscCommon.FileStream();
                this.stream.obj    = stream.obj;
                this.stream.data   = stream.data;
                this.stream.size   = stream.size;
            }

            this.stream.pos    = stream.pos;
            this.stream.cur    = stream.cur;

            this.Reader.stream = this.stream;

            var s = this.stream;
            var _main_type = s.GetUChar(); // 0!!!

            var txBody = this.Reader.ReadTextBodyTxPr(shape);

            stream.pos = s.pos;
            stream.cur = s.cur;
            this.LogicDocument = oLogicDocument;
            return txBody;
        }

        this.ReadShapeProperty = function(stream, type)
        {
            if (this.Reader == null)
                this.Reader = new AscCommon.BinaryPPTYLoader();

            var oLogicDocument = this.LogicDocument;
            this.LogicDocument = null;

            this.Reader.ImageMapChecker = this.ImageMapChecker;

            if (null == this.stream)
            {
                this.stream = new AscCommon.FileStream();
                this.stream.obj    = stream.obj;
                this.stream.data   = stream.data;
                this.stream.size   = stream.size;
            }

            this.stream.pos    = stream.pos;
            this.stream.cur    = stream.cur;

            this.Reader.stream = this.stream;

            var s = this.stream;
            var _main_type = s.GetUChar(); // 0!!!

            var oNewSpPr;
            if(0 == type){
                oNewSpPr = this.Reader.ReadLn()
            }
            else if(1 == type){
                oNewSpPr = this.Reader.ReadUniFill();
            }
            else{
                oNewSpPr = new AscFormat.CSpPr();
                this.Reader.ReadSpPr(oNewSpPr);
            }

            stream.pos = s.pos;
            stream.cur = s.cur;

            this.LogicDocument = oLogicDocument;
            return oNewSpPr;
        };
		
		this.ReadRunProperties = function(stream, type)
		{
			if (this.Reader == null)
				this.Reader = new AscCommon.BinaryPPTYLoader();

			var oLogicDocument = this.LogicDocument;
			this.LogicDocument = null;

			this.Reader.ImageMapChecker = this.ImageMapChecker;

			if (null == this.stream)
			{
				this.stream = new AscCommon.FileStream();
				this.stream.obj	= stream.obj;
				this.stream.data   = stream.data;
				this.stream.size   = stream.size;
			}

			this.stream.pos	= stream.pos;
			this.stream.cur	= stream.cur;

			this.Reader.stream = this.stream;

			var s = this.stream;
			var _main_type = s.GetUChar(); // 0!!!

			var oNewrPr = this.Reader.ReadRunProperties();

			stream.pos = s.pos;
			stream.cur = s.cur;

			this.LogicDocument = oLogicDocument;
			return oNewrPr;
		};

        this.ReadShape = function()
        {
            var s = this.stream;

            var shape = new AscFormat.CShape();
            shape.setWordShape(true);
            shape.setBDeleted(false);
            shape.setParent(this.TempMainObject == null ? this.ParaDrawing : null);
            var _rec_start = s.cur;
            var _end_rec = _rec_start + s.GetULong() + 4;

            s.Skip2(1); // start attributes

            while (true)
            {
                var _at = s.GetUChar();
                if (_at == AscCommon.g_nodeAttributeEnd)
                    break;

                switch (_at)
                {
                    case 0:
                    {
                        shape.attrUseBgFill = s.GetBool();
                        break;
                    }
                    default:
                        break;
                }
            }

            var oXFRM = null;
            while (s.cur < _end_rec)
            {
                var _at = s.GetUChar();
                switch (_at)
                {
                    case 0:
                    {
                        var pr = this.Reader.ReadNvUniProp(shape);
                        shape.setNvSpPr(pr);
                        if(AscFormat.isRealNumber(pr.locks))
                        {
                            shape.setLocks(pr.locks);
                        }
                        break;
                    }
                    case 1:
                    {
                        var spPr = new AscFormat.CSpPr();
                        this.ReadSpPr(spPr);
                        shape.setSpPr(spPr);
                        shape.spPr.setParent(shape);
                        break;
                    }
                    case 2:
                    {
                        shape.setStyle(this.Reader.ReadShapeStyle());
                        break;
                    }
                    case 3:
                    {
                        s.SkipRecord();
                        break;
                    }
                    case 4:
                    {
                        var oThis = this.BaseReader;

                        shape.setTextBoxContent(new CDocumentContent(shape, this.LogicDocument.DrawingDocument, 0, 0, 0, 0, false, false));

                        var _old_cont = shape.textBoxContent.Content[0];

                        shape.textBoxContent.Internal_Content_RemoveAll();

                        s.Skip2(4); // rec len

                        oThis.stream.pos = s.pos;
                        oThis.stream.cur = s.cur;

                        var oBinary_DocumentTableReader = new Binary_DocumentTableReader(shape.textBoxContent, oThis.oReadResult, oThis.openParams, oThis.stream, false, oThis.oComments);
                        var nDocLength = oThis.stream.GetULongLE();
                        var content_arr = [];
                        oThis.bcr.Read1(nDocLength, function(t,l){
                            return oBinary_DocumentTableReader.ReadDocumentContent(t,l, content_arr);
                        });
                        for(var i = 0, length = content_arr.length; i < length; ++i){
                            if(i == length - 1)
                                shape.textBoxContent.Internal_Content_Add(i, content_arr[i], true);
                            else
                                shape.textBoxContent.Internal_Content_Add(i, content_arr[i], false);
                        }

                        s.pos = oThis.stream.pos;
                        s.cur = oThis.stream.cur;

                        if (shape.textBoxContent.Content.length == 0)
                            shape.textBoxContent.Internal_Content_Add(0, _old_cont);

                        break;
                    }
                    case 5:
                    {
                        var bodyPr = new AscFormat.CBodyPr();
                        this.Reader.CorrectBodyPr(bodyPr);
                        shape.setBodyPr(bodyPr);
                        break;
                    }
                    case 6:
                    {
                        oXFRM = this.Reader.ReadXfrm();
                        break;
                    }
                    case 7:
                    {
                        shape.setSignature(this.Reader.ReadSignatureLine());
                        break;
                    }
                    default:
                    {
                        s.SkipRecord();
                        break;
                    }
                }
            }

            if(oXFRM)
            {
                var oRet = new AscFormat.CGroupShape();
                shape.setParent(null);
                oRet.setParent(this.TempMainObject == null ? this.ParaDrawing : null);
                oRet.setBDeleted(false);
                var oSpPr = new AscFormat.CSpPr();
                var oXfrm = new AscFormat.CXfrm();
                oXfrm.setOffX(shape.spPr.xfrm.offX);
                oXfrm.setOffY(shape.spPr.xfrm.offY);
                oXfrm.setExtX(shape.spPr.xfrm.extX);
                oXfrm.setExtY(shape.spPr.xfrm.extY);
                oXfrm.setChExtX(shape.spPr.xfrm.extX);
                oXfrm.setChExtY(shape.spPr.xfrm.extY);
                oXfrm.setChOffX(0);
                oXfrm.setChOffY(0);
                oSpPr.setXfrm(oXfrm);
                oXfrm.setParent(oSpPr);
                shape.spPr.xfrm.setOffX(0);
                shape.spPr.xfrm.setOffY(0);
                oRet.setSpPr(oSpPr);
                oSpPr.setParent(oRet);
                oRet.addToSpTree(0, shape);
                var oShape2 = new AscFormat.CShape();
                var oSpPr2 = new AscFormat.CSpPr();
                oShape2.setSpPr(oSpPr2);
                oSpPr2.setParent(oShape2);
                var oXfrm2 = oXFRM;
                oXfrm2.setParent(oSpPr2);
                oSpPr2.setXfrm(oXfrm2);
                oXfrm2.setOffX(oXfrm2.offX - oXfrm.offX);
                oXfrm2.setOffY(oXfrm2.offY - oXfrm.offY);
                oSpPr2.setFill(AscFormat.CreateNoFillUniFill());
                oSpPr2.setLn(AscFormat.CreateNoFillLine());
                oShape2.setTxBody(shape.txBody);
                shape.setTxBody(null);
                shape.setGroup(oRet);
                oShape2.setBDeleted(false);
                oShape2.setWordShape(true);
                if(shape.spPr.xfrm && AscFormat.isRealNumber(shape.spPr.xfrm.rot))
                {
                    oXfrm2.setRot((AscFormat.isRealNumber(oXfrm2.rot) ? oXfrm2.rot : 0) + shape.spPr.xfrm.rot);
                }
                if(oShape2.txBody)
                {
                    oShape2.txBody.setParent(oShape2);
                }
                if(shape.textBoxContent)
                {
                    oShape2.setTextBoxContent(shape.textBoxContent.Copy(oShape2, shape.textBoxContent.DrawingDocument));
                    shape.setTextBoxContent(null);
                }
                if(shape.bodyPr)
                {
                    oShape2.setBodyPr(shape.bodyPr);
                    shape.setBodyPr(null);
                }
                oRet.addToSpTree(1, oShape2);
                oShape2.setGroup(oRet);
                s.Seek2(_end_rec);
                return oRet;
            }
            s.Seek2(_end_rec);
            return shape;

        }
        this.ReadCxn = function()
        {
            var s = this.stream;

            var shape = new AscFormat.CConnectionShape( );
            shape.setWordShape(true);
            shape.setParent(this.TempMainObject == null ? this.ParaDrawing : null);
            var _rec_start = s.cur;
            var _end_rec = _rec_start + s.GetULong() + 4;

            while (s.cur < _end_rec)
            {
                var _at = s.GetUChar();
                switch (_at)
                {
                    case 0:
                    {
                        s.SkipRecord();
                        break;
                    }
                    case 1:
                    {
                        var spPr = new AscFormat.CSpPr();
                        this.ReadSpPr(spPr);
                        shape.setSpPr(spPr);
                        break;
                    }
                    case 2:
                    {
                        shape.setStyle(this.Reader.ReadShapeStyle());
                        break;
                    }
                    default:
                    {
                        s.SkipRecord();
                        break;
                    }
                }
            }

            s.Seek2(_end_rec);
            return shape;
        }
        this.ReadPic = function(type)
        {
            var s = this.stream;

            var isOle = (type === 6);
            var pic = isOle ? new AscFormat.COleObject() : new AscFormat.CImageShape();
            pic.setBDeleted(false);
            pic.setParent(this.TempMainObject == null ? this.ParaDrawing : null);

            var _rec_start = s.cur;
            var _end_rec = _rec_start + s.GetULong() + 4;

            var sMaskFileName = "";
            while (s.cur < _end_rec)
            {
                var _at = s.GetUChar();
                switch (_at)
                {
                    case 0:
                    {
                        var pr = this.Reader.ReadNvUniProp(pic);
                        pic.setNvSpPr(pr);
                        if(AscFormat.isRealNumber(pr.locks))
                        {
                            pic.setLocks(pr.locks);
                        }
                        break;
                    }
                    case 1:
                    {
                        var unifill = this.Reader.ReadUniFill(null, pic, null);
                        pic.setBlipFill(unifill.fill);//this.Reader.ReadUniFill();

                        //pic.spPr.Fill = new AscFormat.CUniFill();
                        //pic.spPr.Fill.fill = pic.blipFill;
                        //pic.brush = pic.spPr.Fill;

                        break;
                    }
                    case 2:
                    {
                        var spPr = new AscFormat.CSpPr();
                        this.ReadSpPr(spPr);
                        pic.setSpPr(spPr);
                        pic.spPr.setParent(pic);
                        break;
                    }
                    case 3:
                    {
                        pic.setStyle(this.Reader.ReadShapeStyle());
                        break;
                    }
                    case 4:
                    {
                        if(isOle) {
                            this.ReadOleInfo(pic);
                            // if(pic.m_sObjectFile === "maskFile.docx"
                            //     ||  pic.m_sObjectFile === "maskFile.xlsx"){
                            //     var oParent = pic.parent;
                            //     pic = AscFormat.CImageShape.prototype.copy.call(pic);
                            //     if(oParent){
                            //         pic.setParent(oParent);
                            //     }
                            // }
                        } else {
                            s.SkipRecord();
                        }
                        break;
                    }
                    case 5:
                    {
                        if(type === 7 || type === 8){//video or audio
                            s.GetLong();
                            s.GetUChar();//start attributes
                            while(true){
                                var _at2 = s.GetUChar();
                                if (_at2 == g_nodeAttributeEnd)
                                    break;
                                switch (_at2) {
                                    case 0:
                                    {
                                        sMaskFileName = s.GetString2();
                                        break;
                                    }
                                }
                            }
                        }
                        else{
                            s.SkipRecord();
                        }
                        break;
                    }
                    default:
                    {
                        s.SkipRecord();
                        break;
                    }
                }
            }

            if(type === 7 || type === 8){//video or audio
                if(typeof sMaskFileName === "string" && sMaskFileName.length > 0 &&
                    pic.nvPicPr && pic.nvPicPr.nvPr /*&& pic.nvPicPr.nvPr.unimedia*/){
                    var oUniMedia = new AscFormat.UniMedia();
                    oUniMedia.type = type;
                    oUniMedia.media = sMaskFileName;
                    pic.nvPicPr.nvPr.setUniMedia(oUniMedia);
                }
            }

            s.Seek2(_end_rec);
            return pic;
        }
        this.ReadOleInfo = function(ole)
        {
            var s = this.stream;

            var _rec_start = s.cur;
            var _end_rec = _rec_start + s.GetLong() + 4;

            s.Skip2(1); // start attributes
            var dxaOrig = 0;
            var dyaOrig = 0;
            while (true)
            {
                var _at = s.GetUChar();
                if (_at == g_nodeAttributeEnd)
                    break;

                switch (_at)
                {
                    case 0:
                    {
                        ole.setApplicationId(s.GetString2());
                        break;
                    }
                    case 1:
                    {
                        ole.setData(s.GetString2());
                        break;
                    }
                    case 2:
                    {
                        dxaOrig = s.GetULong();
                        break;
                    }
                    case 3:
                    {
                        dyaOrig = s.GetULong();
                        break;
                    }
                    case 4:
                    {
                        s.GetUChar();
                        break;
                    }
                    case 5:
                    {
                        s.GetUChar();
                        break;
                    }
                    case 6:
                    {
                        s.GetUChar();
                        break;
                    }
                    case 7:
                    {
                        ole.setObjectFile(s.GetString2());
                        break;
                    }
                    default:
                        break;
                }
            }




            var oleType = null;
            while (s.cur < _end_rec)
            {
                var _at = s.GetUChar();
                switch (_at)
                {
                    case 1:
                    {
                        s.GetLong();//length
                        oleType = s.GetUChar();
                        ole.setOleType(oleType);
                        break;
                    }
                    case 2:
                    {

                        var binary_length;
                        switch(oleType)
                        {
                            case 0:
                            {
                                binary_length = s.GetULong();
                                ole.setBinaryData(s.data.slice(s.cur, s.cur + binary_length));
                                s.Seek2(s.cur + binary_length);
                                break;
                            }
                            case 1:
                            {
                                ole.setObjectFile("maskFile.docx");
                                binary_length = s.GetULong();
                                ole.setBinaryData(s.data.slice(s.cur, s.cur + binary_length));
                                s.Seek2(s.cur + binary_length);
                                break;
                            }
                            case 2:
                            {
                                ole.setObjectFile("maskFile.xlsx");
                                binary_length = s.GetULong();
                                ole.setBinaryData(s.data.slice(s.cur, s.cur + binary_length));
                                s.Seek2(s.cur + binary_length);
                                break;
                            }
                            case 4:
                            {
                                s.GetLong();//length

                                var type2 = s.GetUChar();
                                if (c_oSer_OMathContentType.OMath === type2 && ole.parent && ole.parent.Parent)
                                {
                                    var length2 = s.GetLong();
                                    var _stream = new AscCommon.FT_Stream2();
                                    _stream.data = s.data;
                                    _stream.pos = s.pos;
                                    _stream.cur = s.cur;
                                    _stream.size = s.size;
                                    var oReadResult = this.BaseReader ? this.BaseReader.oReadResult : new AscCommonWord.DocReadResult(null);
                                    var boMathr = new Binary_oMathReader(_stream, oReadResult, null);
                                    var oMathPara = new ParaMath();
                                    ole.parent.ParaMath = oMathPara;
                                    var par = ole.parent.Parent;
                                    var oParStruct = new OpenParStruct(par, par);
                                    oParStruct.cur.pos = par.Content.length - 1;
                                    boMathr.bcr.Read1(length2, function(t, l){
                                        return boMathr.ReadMathArg(t,l,oMathPara.Root,oParStruct);
                                    });
                                    oMathPara.Root.Correct_Content(true);
                                }
                                else
                                {
                                    s.SkipRecord();
                                }
                                break;
                            }
                            default:
                            {
                                s.SkipRecord();
                                break;
                            }
                        }
                        break;
                    }
                    default:
                    {
                        s.SkipRecord();
                        break;
                    }
                }
            }




			if (dxaOrig > 0 && dyaOrig > 0) {
				var ratio = 4 / 3 / 20;//twips to px
				ole.setPixSizes(ratio * dxaOrig, ratio * dyaOrig);
			}
            s.Seek2(_end_rec);
        }
        this.ReadGroupShape = function()
        {
            var s = this.stream;

            var shape = new AscFormat.CGroupShape();

            shape.setBDeleted(false);
            shape.setParent(this.TempMainObject == null ? this.ParaDrawing : null);
            this.TempGroupObject = shape;

            var oldParaDrawing = this.ParaDrawing;
            this.ParaDrawing = null;

            var _rec_start = s.cur;
            var _end_rec = _rec_start + s.GetULong() + 4;

            while (s.cur < _end_rec)
            {
                var _at = s.GetUChar();
                switch (_at)
                {
                    case 0:
                    {
                        s.SkipRecord();
                        break;
                    }
                    case 1:
                    {
                        var spPr = new AscFormat.CSpPr();
                        this.Reader.ReadGrSpPr(spPr);
                        shape.setSpPr(spPr);
                        shape.spPr.setParent(shape);
                        break;
                    }
                    case 2:
                    {
                        s.Skip2(4); // len
                        var _c = s.GetULong();
                        for (var i = 0; i < _c; i++)
                        {
                            s.Skip2(1);
                            var __len = s.GetULong();
                            if (__len == 0)
                                continue;

                            var _type = s.GetUChar();

                            var sp;
                            switch (_type)
                            {
                                case 1:
                                {
                                    sp = this.ReadShape();
                                    if(sp.spPr && sp.spPr.xfrm){
                                        sp.setGroup(shape);
                                        shape.addToSpTree(shape.spTree.length, sp);
                                    }
                                    break;
                                }
                                case 6:
                                case 2:
                                case 7:
                                case 8:
                                {
                                    sp = this.ReadPic(_type);
                                    if(sp.spPr && sp.spPr.xfrm){
                                        sp.setGroup(shape);
                                        shape.addToSpTree(shape.spTree.length, sp);
                                    }
                                    break;
                                }
                                case 3:
                                {
                                    sp = this.ReadCxn();
                                    if(sp.spPr && sp.spPr.xfrm) {
                                        sp.setGroup(shape);
                                        shape.addToSpTree(shape.spTree.length, sp);
                                    }
                                    break;
                                }
                                case 4:
                                {
                                    sp = this.ReadGroupShape();
                                    if(sp && sp.spPr && sp.spPr.xfrm && sp.spTree.length > 0) {
                                        sp.setGroup(shape);
                                        shape.addToSpTree(shape.spTree.length, sp);
                                    }
                                    break;
                                }
                                case 5:
                                {
                                    var _chart = this.Reader.ReadChartDataInGroup(shape);
                                    if (null != _chart)
                                    {
                                        _chart.setGroup(shape);
                                        shape.addToSpTree(shape.spTree.length, _chart);
                                    }
                                    break;
                                }
                                default:
                                {
                                    s.SkipRecord();
                                    break;
                                }
                            }
                        }
                        break;
                    }
                    default:
                    {
                        s.SkipRecord();
                        break;
                    }
                }
            }

            if(oldParaDrawing && shape.spPr && !shape.spPr.xfrm){
                shape.bEmptyTransform = true;
            }
            if(!oldParaDrawing){
                this.Reader.CheckGroupXfrm(shape);
            }
            this.ParaDrawing = oldParaDrawing;
            s.Seek2(_end_rec);
            this.TempGroupObject = null;
            // if(shape.spTree.length === 0){
            //     return null;
            // }
            return shape;
        }

        this.ReadSpPr = function(spPr)
        {
            var s = this.stream;

            var _rec_start = s.cur;
            var _end_rec = _rec_start + s.GetULong() + 4;

            s.Skip2(1); // start attributes

            while (true)
            {
                var _at = s.GetUChar();
                if (_at == AscCommon.g_nodeAttributeEnd)
                    break;

                if (0 == _at)
                    spPr.bwMode = s.GetUChar();
                else
                    break;
            }

            while (s.cur < _end_rec)
            {
                var _at = s.GetUChar();
                switch (_at)
                {
                    case 0:
                    {
                        spPr.setXfrm(this.Reader.ReadXfrm());
                        spPr.xfrm.setParent(spPr);
                        //this.CorrectXfrm(spPr.xfrm);
                        break;
                    }
                    case 1:
                    {
                        var oGeometry = this.Reader.ReadGeometry(spPr.xfrm);
                        if(oGeometry && oGeometry.pathLst.length > 0)
                            spPr.setGeometry(oGeometry);
                        break;
                    }
                    case 2:
                    {
                        spPr.setFill(this.Reader.ReadUniFill(spPr, null, null));
                        break;
                    }
                    case 3:
                    {
                        spPr.setLn(this.Reader.ReadLn());
                        break;
                    }
                    case 4:
                    {
                        spPr.setEffectPr(this.Reader.ReadEffectProperties());
                        break;
                    }
                    case 5:
                    {
                        var _len = s.GetULong();
                        s.Skip2(_len);
                        break;
                    }
                    case 6:
                    {
                        var _len = s.GetULong();
                        s.Skip2(_len);
                        break;
                    }
                    default:
                    {
                        s.SkipRecord();
                        break;
                    }
                }
            }

            s.Seek2(_end_rec);
        }

        this.CorrectXfrm = function(_xfrm)
        {
            if (!_xfrm)
                return;

            if (null == _xfrm.rot)
                return;

            var nInvertRotate = 0;
            if (true === _xfrm.flipH)
                nInvertRotate += 1;
            if (true === _xfrm.flipV)
                nInvertRotate += 1;

            var _rot = _xfrm.rot;
            var _del = 2 * Math.PI;

            if (nInvertRotate)
                _rot = -_rot;

            if (_rot >= _del)
            {
                var _intD = (_rot / _del) >> 0;
                _rot = _rot - _intD * _del;
            }
            else if (_rot < 0)
            {
                var _intD = (-_rot / _del) >> 0;
                _intD = 1 + _intD;
                _rot = _rot + _intD * _del;
            }

            _xfrm.rot = _rot;
        }

        this.ReadTheme = function(reader, stream)
        {
            if(reader)
            {
                this.BaseReader = reader;
            }
            if (this.Reader == null)
                this.Reader = new AscCommon.BinaryPPTYLoader();

            if (null == this.stream)
            {
                this.stream = new AscCommon.FileStream();
                this.stream.obj    = stream.obj;
                this.stream.data   = stream.data;
                this.stream.size   = stream.size;
            }

            this.stream.pos    = stream.pos;
            this.stream.cur    = stream.cur;

            this.Reader.stream = this.stream;
            this.Reader.ImageMapChecker = this.ImageMapChecker;
            return this.Reader.ReadTheme();
        }

        this.CheckImagesNeeds = function(logicDoc)
        {
            var index = 0;
            logicDoc.ImageMap = {};
            for (var i in this.ImageMapChecker)
            {
                logicDoc.ImageMap[index++] = i;
            }
        }

        this.Clear = function(bClearStreamOnly)
        {
            //вызывается пока только перед вставкой
            this.Reader.stream = null;
            this.stream = null;
            this.BaseReader = null;
            if(!bClearStreamOnly)
                this.ImageMapChecker = {};
        }
    }

    //----------------------------------------------------------export----------------------------------------------------
    window['AscCommon'] = window['AscCommon'] || {};
    window['AscCommon'].c_dScalePPTXSizes = c_dScalePPTXSizes;
    window['AscCommon'].CBuilderImages = CBuilderImages;
    window['AscCommon'].BinaryPPTYLoader = BinaryPPTYLoader;
    window['AscCommon'].IsHiddenObj = IsHiddenObj;
    window['AscCommon'].pptx_content_loader = new CPPTXContentLoader();
    window['AscCommon'].CApp = CApp;
    prot = CApp.prototype;
    prot["asc_getTemplate"] = prot.asc_getTemplate;
    prot["asc_getTotalTime"] = prot.asc_getTotalTime;
    prot["asc_getWords"] = prot.asc_getWords;
    prot["asc_getApplication"] = prot.asc_getApplication;
    prot["asc_getPresentationFormat"] = prot.asc_getPresentationFormat;
    prot["asc_getParagraphs"] = prot.asc_getParagraphs;
    prot["asc_getSlides"] = prot.asc_getSlides;
    prot["asc_getNotes"] = prot.asc_getNotes;
    prot["asc_getHiddenSlides"] = prot.asc_getHiddenSlides;
    prot["asc_getMMClips"] = prot.asc_getMMClips;
    prot["asc_getScaleCrop"] = prot.asc_getScaleCrop;
    prot["asc_getCompany"] = prot.asc_getCompany;
    prot["asc_getLinksUpToDate"] = prot.asc_getLinksUpToDate;
    prot["asc_getSharedDoc"] = prot.asc_getSharedDoc;
    prot["asc_getHyperlinksChanged"] = prot.asc_getHyperlinksChanged;
    prot["asc_getAppVersion"] = prot.asc_getAppVersion;
    prot["asc_getCharacters"] = prot.asc_getCharacters;
    prot["asc_getCharactersWithSpaces"] = prot.asc_getCharactersWithSpaces;
    prot["asc_getDocSecurity"] = prot.asc_getDocSecurity;
    prot["asc_getHyperlinkBase"] = prot.asc_getHyperlinkBase;
    prot["asc_getLines"] = prot.asc_getLines;
    prot["asc_getManager"] = prot.asc_getManager;
    prot["asc_getPages"] = prot.asc_getPages;
    window['AscCommon'].CCore = CCore;
    prot = CCore.prototype;
    prot["asc_getTitle"] = prot.asc_getTitle;
    prot["asc_getCreator"] = prot.asc_getCreator;
    prot["asc_getLastModifiedBy"] = prot.asc_getLastModifiedBy;
    prot["asc_getRevision"] = prot.asc_getRevision;
    prot["asc_getCreated"] = prot.asc_getCreated;
    prot["asc_getModified"] = prot.asc_getModified;
    prot["asc_getCategory"] = prot.asc_getCategory;
    prot["asc_getContentStatus"] = prot.asc_getContentStatus;
    prot["asc_getDescription"] = prot.asc_getDescription;
    prot["asc_getIdentifier"] = prot.asc_getIdentifier;
    prot["asc_getKeywords"] = prot.asc_getKeywords;
    prot["asc_getLanguage"] = prot.asc_getLanguage;
    prot["asc_getLastPrinted"] = prot.asc_getLastPrinted;
    prot["asc_getSubject"] = prot.asc_getSubject;
    prot["asc_getVersion"] = prot.asc_getVersion;

    prot["asc_putTitle"] = prot.asc_putTitle;
    prot["asc_putCreator"] = prot.asc_putCreator;
    prot["asc_putLastModifiedBy"] = prot.asc_putLastModifiedBy;
    prot["asc_putRevision"] = prot.asc_putRevision;
    prot["asc_putCreated"] = prot.asc_putCreated;
    prot["asc_putModified"] = prot.asc_putModified;
    prot["asc_putCategory"] = prot.asc_putCategory;
    prot["asc_putContentStatus"] = prot.asc_putContentStatus;
    prot["asc_putDescription"] = prot.asc_putDescription;
    prot["asc_putIdentifier"] = prot.asc_putIdentifier;
    prot["asc_putKeywords"] = prot.asc_putKeywords;
    prot["asc_putLanguage"] = prot.asc_putLanguage;
    prot["asc_putLastPrinted"] = prot.asc_putLastPrinted;
    prot["asc_putSubject"] = prot.asc_putSubject;
    prot["asc_putVersion"] = prot.asc_putVersion;

})(window);
