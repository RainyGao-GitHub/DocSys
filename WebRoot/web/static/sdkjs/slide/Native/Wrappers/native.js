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


Asc['asc_docs_api'].prototype.sync_CanUndoCallback = function(bCanUndo)
{
    var _stream = global_memory_stream_menu;
    _stream["ClearNoAttack"]();
    _stream["WriteBool"](bCanUndo);
    window["native"]["OnCallMenuEvent"](60, _stream); // ASC_MENU_EVENT_TYPE_CAN_UNDO
};

Asc['asc_docs_api'].prototype.sync_CanRedoCallback = function(bCanRedo)
{
    var _stream = global_memory_stream_menu;
    _stream["ClearNoAttack"]();
    _stream["WriteBool"](bCanRedo);
    window["native"]["OnCallMenuEvent"](61, _stream); // ASC_MENU_EVENT_TYPE_CAN_REDO
};

Asc['asc_docs_api'].prototype.SetDocumentModified = function(bValue)
{
    this.isDocumentModify = bValue;

    var _stream = global_memory_stream_menu;
    _stream["ClearNoAttack"]();
    _stream["WriteBool"](this.isDocumentModify);
    window["native"]["OnCallMenuEvent"](66, _stream); // ASC_MENU_EVENT_TYPE_DOCUMETN_MODIFITY
};

Asc['asc_docs_api'].prototype.sync_EndCatchSelectedElements = function()
{
    var _stream = global_memory_stream_menu;
    _stream["ClearNoAttack"]();

    var _count = this.SelectedObjectsStack.length;
    var _naturalCount = 0;

    for (var i = 0; i < _count; i++)
    {
        switch (this.SelectedObjectsStack[i].Type)
        {
            case Asc.c_oAscTypeSelectElement.Paragraph:
            case Asc.c_oAscTypeSelectElement.Table:
            case Asc.c_oAscTypeSelectElement.Image:
            case Asc.c_oAscTypeSelectElement.Hyperlink:
            case Asc.c_oAscTypeSelectElement.Slide:
            case Asc.c_oAscTypeSelectElement.Shape:  
            case Asc.c_oAscTypeSelectElement.Chart:    
            case Asc.c_oAscTypeSelectElement.Math:     
            {
                ++_naturalCount;
                break;
            }
            default:
                break;
        }
    }

    _stream["WriteLong"](_naturalCount);

    for (var i = 0; i < _count; i++)
    {
        switch (this.SelectedObjectsStack[i].Type)
        {
            case Asc.c_oAscTypeSelectElement.Slide:
            {
                //console.log("StackObjects -> Slide");
                _stream["WriteLong"](Asc.c_oAscTypeSelectElement.Slide);
                asc_menu_WriteSlidePr(this.SelectedObjectsStack[i].Value, _stream);
                break;
            }
          
            case Asc.c_oAscTypeSelectElement.Shape:
            {
                //console.log("StackObjects -> Shape");
                _stream["WriteLong"](Asc.c_oAscTypeSelectElement.Shape);
                asc_menu_WriteShapePr(undefined, this.SelectedObjectsStack[i].Value, _stream); 
                break;
            }

            case Asc.c_oAscTypeSelectElement.Chart:
            {
                //console.log("StackObjects -> Chart");
                _stream["WriteLong"](Asc.c_oAscTypeSelectElement.Chart);
                asc_menu_WriteChartPr(undefined, this.SelectedObjectsStack[i].Value.ChartProperties, _stream); 
                break;
            }

            case Asc.c_oAscTypeSelectElement.Paragraph:
            {
                //console.log("StackObjects -> Paragraph");
                _stream["WriteLong"](Asc.c_oAscTypeSelectElement.Paragraph);
                asc_menu_WriteParagraphPr(this.SelectedObjectsStack[i].Value, _stream);
                break;
            }

            case Asc.c_oAscTypeSelectElement.Table:
            {
                //console.log("StackObjects -> Table");
                _stream["WriteLong"](Asc.c_oAscTypeSelectElement.Table);
                asc_menu_WriteTablePr(this.SelectedObjectsStack[i].Value, _stream);
                break;
            }
            case Asc.c_oAscTypeSelectElement.Image:
            {
                //console.log("StackObjects -> Image");
                _stream["WriteLong"](Asc.c_oAscTypeSelectElement.Image);
                asc_menu_WriteImagePr(this.SelectedObjectsStack[i].Value, _stream);
                break;
            }
            case Asc.c_oAscTypeSelectElement.Hyperlink:
            {
                //console.log("StackObjects -> Hyperlink");
                _stream["WriteLong"](Asc.c_oAscTypeSelectElement.Hyperlink);
                asc_menu_WriteHyperPr(this.SelectedObjectsStack[i].Value, _stream);
                break;
            }
            case Asc.c_oAscTypeSelectElement.Math:
            {
                _stream["WriteLong"](Asc.c_oAscTypeSelectElement.Math);
                asc_menu_WriteMath(this.SelectedObjectsStack[i].Value, _stream);
                break;
            }
            default:
            {
                // none
                break;
            }
        }
    }

    window["native"]["OnCallMenuEvent"](6, global_memory_stream_menu);
};

// chat styles
AscCommon.ChartPreviewManager.prototype.clearPreviews = function()
{
    window["native"]["ClearCacheChartStyles"]();
};

AscCommon.ChartPreviewManager.prototype.createChartPreview = function(_graphics, type, styleIndex)
{
    return AscFormat.ExecuteNoHistory(function(){
      if(!this.chartsByTypes[type])
          this.chartsByTypes[type] = this.getChartByType(type);

      var chart_space = this.chartsByTypes[type];
      AscFormat.ApplyPresetToChartSpace(chart_space, AscCommon.g_oChartPresets[type][styleIndex]);
      chart_space.recalcInfo.recalculateReferences = false;
      chart_space.recalculate();

      // sizes for imageView
      window["native"]["DD_StartNativeDraw"](85 * 2, 85 * 2, 75, 75);

      chart_space.draw(_graphics);
      _graphics.ClearParams();

      var _stream = global_memory_stream_menu;
      _stream["ClearNoAttack"]();
      _stream["WriteByte"](4);
      _stream["WriteLong"](type);
      _stream["WriteLong"](styleIndex);
      window["native"]["DD_EndNativeDraw"](_stream);

      }, this, []);
};

AscCommon.ChartPreviewManager.prototype.getChartPreviews = function(chartType)
{
    if (AscFormat.isRealNumber(chartType))
    {
        var bIsCached = window["native"]["IsCachedChartStyles"](chartType);
        if (!bIsCached)
        {
            window["native"]["DD_PrepareNativeDraw"]();

            var _graphics = new CDrawingStream();

            if(AscCommon.g_oChartPresets[chartType]){
                var nStylesCount = AscCommon.g_oChartPresets[chartType].length;
                for(var i = 0; i < nStylesCount; ++i)
                    this.createChartPreview(_graphics, chartType, i);
            }

            var _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            _stream["WriteByte"](5);
            _api.WordControl.m_oDrawingDocument.Native["DD_EndNativeDraw"](_stream);
        }
    }
};

window["AscCommon"].getFullImageSrc2 = function (src) {

    var start = src.slice(0, 6);
    if (0 === start.indexOf('theme') && editor.ThemeLoader){
        return  editor.ThemeLoader.ThemesUrlAbs + src;
    }

    if (0 !== start.indexOf('http:') && 0 !== start.indexOf('data:') && 0 !== start.indexOf('https:') &&
        0 !== start.indexOf('file:') && 0 !== start.indexOf('ftp:')){
            var srcFull = AscCommon.g_oDocumentUrls.getImageUrl(src);
            var srcFull2 = srcFull;
            if(src.indexOf(".svg") === src.length - 4){
                var sName = src.slice(0, src.length - 3);

                src = sName + 'wmf';
                srcFull = AscCommon.g_oDocumentUrls.getImageUrl(src);
                if(!srcFull){
                    src = sName + 'emf';
                    srcFull = AscCommon.g_oDocumentUrls.getImageUrl(src);
                }
            }
        
        if(srcFull){
            window["native"]["loadUrlImage"](srcFull, src);
            return srcFull2;
        }
    }
    return src;
};

Asc['asc_docs_api'].prototype["Call_Menu_Event"] = function(type, _params)
{
    var _return = undefined;
    var _current = { pos : 0 };
    var _continue = true;

    switch (type)
    {
        case 1: // ASC_MENU_EVENT_TYPE_TEXTPR
        {
            var _textPr = new AscCommonWord.CTextPr();
            while (_continue)
            {
                var _attr = _params[_current.pos++];
                switch (_attr)
                {
                    case 0:
                    {
                        _textPr.Bold = _params[_current.pos++];
                        break;
                    }
                    case 1:
                    {
                        _textPr.Italic = _params[_current.pos++];
                        break;
                    }
                    case 2:
                    {
                        _textPr.Underline = _params[_current.pos++];
                        break;
                    }
                    case 3:
                    {
                        _textPr.Strikeout = _params[_current.pos++];
                        break;
                    }
                    case 4:
                    {
                        _textPr.FontFamily = asc_menu_ReadFontFamily(_params, _current);
                        break;
                    }
                    case 5:
                    {
                        _textPr.FontSize = _params[_current.pos++];
                        break;
                    }
                    case 6:
                    {
                        var Unifill = new AscFormat.CUniFill();
                        Unifill.fill = new AscFormat.CSolidFill();
                        var color = asc_menu_ReadColor(_params, _current);
                        Unifill.fill.color = AscFormat.CorrectUniColor(color, Unifill.fill.color, 1);
                        _textPr.Unifill = Unifill;
                        break;
                    }
                    case 7:
                    {
                        _textPr.VertAlign = _params[_current.pos++];
                        break;
                    }
                    case 8:
                    {
                        var color = asc_menu_ReadColor(_params, _current);
                        _textPr.HighLight = { r: color.r, g: color.g, b: color.b };
                        break;
                    }
                    case 9:
                    {
                        _textPr.DStrikeout = _params[_current.pos++];
                        break;
                    }
                    case 10:
                    {
                        _textPr.Caps = _params[_current.pos++];
                        break;
                    }
                    case 11:
                    {
                        _textPr.SmallCaps = _params[_current.pos++];
                        break;
                    }
                    case 12:
                    {
                        _textPr.HighLight = AscCommonWord.highlight_None;
                        break;
                    }
                    case 13:
                    {
                        _textPr.Spacing = _params[_current.pos++];
                        break;
                    }
                    case 255:
                    default:
                    {
                        _continue = false;
                        break;
                    }
                }
            }

            this.WordControl.m_oLogicDocument.Create_NewHistoryPoint();
            this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr(_textPr));
            this.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();

            break;
        }

        case 2: // ASC_MENU_EVENT_TYPE_PARAPR
        {
            var _textPr = undefined;

            this.WordControl.m_oLogicDocument.Create_NewHistoryPoint();

            while (_continue)
            {
                var _attr = _params[_current.pos++];
                switch (_attr)
                {
                    case 0:
                    {
                        this.WordControl.m_oLogicDocument.SetParagraphContextualSpacing( _params[_current.pos++] );
                        break;
                    }
                    case 1:
                    {
                        var _ind = asc_menu_ReadParaInd(_params, _current);
                        this.WordControl.m_oLogicDocument.SetParagraphIndent( _ind );
                        break;
                    }
                    case 2:
                    {
                        this.WordControl.m_oLogicDocument.SetParagraphKeepLines( _params[_current.pos++] );
                        break;
                    }
                    case 3:
                    {
                        this.WordControl.m_oLogicDocument.SetParagraphKeepNext( _params[_current.pos++] );
                        break;
                    }
                    case 4:
                    {
                        this.WordControl.m_oLogicDocument.SetParagraphWidowControl( _params[_current.pos++] );
                        break;
                    }
                    case 5:
                    {
                        this.WordControl.m_oLogicDocument.SetParagraphPageBreakBefore( _params[_current.pos++] );
                        break;
                    }
                    case 6:
                    {
                        var _spacing = asc_menu_ReadParaSpacing(_params, _current);
                        this.WordControl.m_oLogicDocument.SetParagraphSpacing( _spacing );
                        break;
                    }
                    case 7:
                    {
                        // TODO:
                        var _brds = asc_menu_ReadParaBorders(_params, _current);

                        if (_brds.Left && _brds.Left.Color)
                        {
                            _brds.Left.Unifill = AscFormat.CreateUnifillFromAscColor(_brds.Left.Color);
                        }
                        if (_brds.Top && _brds.Top.Color)
                        {
                            _brds.Top.Unifill = AscFormat.CreateUnifillFromAscColor(_brds.Top.Color);
                        }
                        if (_brds.Right && _brds.Right.Color)
                        {
                            _brds.Right.Unifill = AscFormat.CreateUnifillFromAscColor(_brds.Right.Color);
                        }
                        if (_brds.Bottom && _brds.Bottom.Color)
                        {
                            _brds.Bottom.Unifill = AscFormat.CreateUnifillFromAscColor(_brds.Bottom.Color);
                        }

                        this.WordControl.m_oLogicDocument.SetParagraphBorders( _brds );
                        break;
                    }
                    case 8:
                    {
                        var _shd = asc_menu_ReadParaShd(_params, _current);
                        this.WordControl.m_oLogicDocument.SetParagraphShd( _shd );
                        break;
                    }
                    case 9:
                    case 10:
                    case 11:
                    {
                        // nothing
                        _current.pos++;
                        break;
                    }
                    case 12:
                    {
                        this.WordControl.m_oLogicDocument.Set_DocumentDefaultTab( _params[_current.pos++] );
                        break;
                    }
                    case 13:
                    {
                        var _tabs = asc_menu_ReadParaTabs(_params, _current);
                        // TODO:
                        this.WordControl.m_oLogicDocument.SetParagraphTabs( _tabs.Tabs );
                        break;
                    }
                    case 14:
                    {
                        var _framePr = asc_menu_ReadParaFrame(_params, _current);
                        this.WordControl.m_oLogicDocument.SetParagraphFramePr( _framePr );
                        break;
                    }
                    case 15:
                    {
                        if (_textPr === undefined)
                            _textPr = new AscCommonWord.CTextPr();
                        if (true == _params[_current.pos++])
                            _textPr.VertAlign = AscCommon.vertalign_SubScript;
                        else
                            _textPr.VertAlign = AscCommon.vertalign_Baseline;
                        break;
                    }
                    case 16:
                    {
                        if (_textPr === undefined)
                            _textPr = new AscCommonWord.CTextPr();
                        if (true == _params[_current.pos++])
                            _textPr.VertAlign = AscCommon.vertalign_SuperScript;
                        else
                            _textPr.VertAlign = AscCommon.vertalign_Baseline;
                        break;
                    }
                    case 17:
                    {
                        if (_textPr === undefined)
                            _textPr = new AscCommonWord.CTextPr();
                        _textPr.SmallCaps = _params[_current.pos++];
                        _textPr.Caps   = false;
                        break;
                    }
                    case 18:
                    {
                        if (_textPr === undefined)
                            _textPr = new AscCommonWord.CTextPr();
                        _textPr.Caps = _params[_current.pos++];
                        if (true == _textPr.Caps)
                            _textPr.SmallCaps = false;
                        break;
                    }
                    case 19:
                    {
                        if (_textPr === undefined)
                            _textPr = new AscCommonWord.CTextPr();
                        _textPr.Strikeout  = _params[_current.pos++];
                        _textPr.DStrikeout = false;
                        break;
                    }
                    case 20:
                    {
                        if (_textPr === undefined)
                            _textPr = new AscCommonWord.CTextPr();
                        _textPr.DStrikeout  = _params[_current.pos++];
                        if (true == _textPr.DStrikeout)
                            _textPr.Strikeout = false;
                        break;
                    }
                    case 21:
                    {
                        if (_textPr === undefined)
                            _textPr = new AscCommonWord.CTextPr();
                        _textPr.TextSpacing = _params[_current.pos++];
                        break;
                    }
                    case 22:
                    {
                        if (_textPr === undefined)
                            _textPr = new AscCommonWord.CTextPr();
                        _textPr.Position = _params[_current.pos++];
                        break;
                    }
                    case 23:
                    {
                        var _listType = asc_menu_ReadParaListType(_params, _current);
                        this.WordControl.m_oLogicDocument.SetParagraphNumbering( _listType );
                        break;
                    }
                    case 24:
                    {
                        this.WordControl.m_oLogicDocument.SetParagraphStyle( _params[_current.pos++] );
                        break;
                    }
                    case 25:
                    {
                        this.WordControl.m_oLogicDocument.SetParagraphAlign( _params[_current.pos++] );
                        break;
                    }
                    case 255:
                    default:
                    {
                        _continue = false;
                        break;
                    }
                }
            }

            if (undefined !== _textPr)
                this.WordControl.m_oLogicDocument.AddToParagraph(new AscCommonWord.ParaTextPr(_textPr));

            this.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();
            break;
        }
        case 22003: //ASC_MENU_EVENT_TYPE_ON_EDIT_TEXT
        {
            var oController = this.WordControl.m_oLogicDocument.GetCurrentController();
            if(oController)
            {
                oController.startEditTextCurrentShape();
            }
            break;
        }
        case 3: // ASC_MENU_EVENT_TYPE_UNDO
        {
            this.WordControl.m_oLogicDocument.Document_Undo();
            break;
        }
        
        case 4: // ASC_MENU_EVENT_TYPE_REDO
        {
            this.WordControl.m_oLogicDocument.Document_Redo();
            break;
        }

        case 8: // ASC_MENU_EVENT_TYPE_HYPERLINK
        {
            var props = asc_menu_ReadHyperPr(_params, _current);
            this.change_Hyperlink(props);
            break;
        }

        case 9 : // ASC_MENU_EVENT_TYPE_IMAGE
        {
            var _imagePr = new Asc.asc_CImgProperty();
            while (_continue)
            {
                var _attr = _params[_current.pos++];
                switch (_attr)
                {
                    case 0:
                    {
                        _imagePr.CanBeFlow = _params[_current.pos++];
                        break;
                    }
                    case 1:
                    {
                        _imagePr.Width = _params[_current.pos++];
                        break;
                    }
                    case 2:
                    {
                        _imagePr.Height = _params[_current.pos++];
                        break;
                    }
                    case 3:
                    {
                        _imagePr.WrappingStyle = _params[_current.pos++];
                        break;
                    }
                    case 4:
                    {
                        _imagePr.Paddings = asc_menu_ReadPaddings(_params, _current);
                        break;
                    }
                    case 5:
                    {
                        _imagePr.Position = asc_menu_ReadPosition(_params, _current);
                        break;
                    }
                    case 6:
                    {
                        _imagePr.AllowOverlap = _params[_current.pos++];
                        break;
                    }
                    case 7:
                    {
                        _imagePr.PositionH = asc_menu_ReadImagePosition(_params, _current);
                        break;
                    }
                    case 8:
                    {
                        _imagePr.PositionV = asc_menu_ReadImagePosition(_params, _current);
                        break;
                    }
                    case 9:
                    {
                        _imagePr.Internal_Position = _params[_current.pos++];
                        break;
                    }
                    case 10:
                    {
                        _imagePr.ImageUrl = _params[_current.pos++];
                        break;
                    }
                    case 11:
                    {
                        _imagePr.Locked = _params[_current.pos++];
                        break;
                    }
                    case 12:
                    {
                        _imagePr.ChartProperties = asc_menu_ReadChartPr(_params, _current);
                        break;
                    }
                    case 13:
                    {
                        _imagePr.ShapeProperties = asc_menu_ReadShapePr(_params, _current);
                        break;
                    }
                    case 14:
                    {
                        _imagePr.ChangeLevel = _params[_current.pos++];
                        break;
                    }
                    case 15:
                    {
                        _imagePr.Group = _params[_current.pos++];
                        break;
                    }
                    case 16:
                    {
                        _imagePr.fromGroup = _params[_current.pos++];
                        break;
                    }
                    case 17:
                    {
                        _imagePr.severalCharts = _params[_current.pos++];
                        break;
                    }
                    case 18:
                    {
                        _imagePr.severalChartTypes = _params[_current.pos++];
                        break;
                    }
                    case 19:
                    {
                        _imagePr.severalChartStyles = _params[_current.pos++];
                        break;
                    }
                    case 20:
                    {
                        _imagePr.verticalTextAlign = _params[_current.pos++];
                        break;
                    }
                    case 21:
                    {
                        var bIsNeed = _params[_current.pos++];

                        if (bIsNeed)
                        {
                           var url = this.WordControl.m_oLogicDocument.GetCurrentController().getDrawingProps().imageProps.ImageUrl;
                           if (url != undefined) {
                                var sizes = this.WordControl.m_oDrawingDocument.Native["DD_GetOriginalImageSize"](url);

                                var w = sizes[0];
                                var h = sizes[1];

                                _imagePr.Width = (undefined !== w) ? Math.max(w * AscCommon.g_dKoef_pix_to_mm, 1) : 1;
                                _imagePr.Height = (undefined !== h) ? Math.max(h * AscCommon.g_dKoef_pix_to_mm, 1) : 1;
                           }
                        }

                        break;
                    }
                    case 255:
                    default:
                    {
                        _continue = false;
                        break;
                    }
                }
            }

            this.ImgApply(_imagePr);
            this.WordControl.m_oLogicDocument.Recalculate();
 
            break;
        }

        case 10: // ASC_MENU_EVENT_TYPE_TABLE
        {
            var _tablePr = new Asc.CTableProp();
            while (_continue)
            {
                var _attr = _params[_current.pos++];
                switch (_attr)
                {
                    case 0:
                    {
                        _tablePr.CanBeFlow = _params[_current.pos++];
                        break;
                    }
                    case 1:
                    {
                        _tablePr.CellSelect = _params[_current.pos++];
                        break;
                    }
                    case 2:
                    {
                        _tablePr.TableWidth = _params[_current.pos++];
                        break;
                    }
                    case 3:
                    {
                        _tablePr.TableSpacing = _params[_current.pos++];
                        break;
                    }
                    case 4:
                    {
                        _tablePr.TableDefaultMargins = asc_menu_ReadPaddings(_params, _current);
                        break;
                    }
                    case 5:
                    {
                        _tablePr.CellMargins = asc_menu_ReadCellMargins(_params, _current);
                        break;
                    }
                    case 6:
                    {
                        _tablePr.TableAlignment = _params[_current.pos++];
                        break;
                    }
                    case 7:
                    {
                        _tablePr.TableIndent = _params[_current.pos++];
                        break;
                    }
                    case 8:
                    {
                        _tablePr.TableWrappingStyle = _params[_current.pos++];
                        break;
                    }
                    case 9:
                    {
                        _tablePr.TablePaddings = asc_menu_ReadPaddings(_params, _current);
                        break;
                    }
                    case 10:
                    {
                        _tablePr.TableBorders = asc_menu_ReadCellBorders(_params, _current);
                        break;
                    }
                    case 11:
                    {
                        _tablePr.CellBorders = asc_menu_ReadCellBorders(_params, _current);
                        break;
                    }
                    case 12:
                    {
                        _tablePr.TableBackground = asc_menu_ReadCellBackground(_params, _current);
                        break;
                    }
                    case 13:
                    {
                        _tablePr.CellsBackground = asc_menu_ReadCellBackground(_params, _current);
                        break;
                    }
                    case 14:
                    {
                        _tablePr.Position = asc_menu_ReadPosition(_params, _current);
                        break;
                    }
                    case 15:
                    {
                        _tablePr.PositionH = asc_menu_ReadImagePosition(_params, _current);
                        break;
                    }
                    case 16:
                    {
                        _tablePr.PositionV = asc_menu_ReadImagePosition(_params, _current);
                        break;
                    }
                    case 17:
                    {
                        _tablePr.Internal_Position = asc_menu_ReadTableAnchorPosition(_params, _current);
                        break;
                    }
                    case 18:
                    {
                        _tablePr.ForSelectedCells = _params[_current.pos++];
                        break;
                    }
                    case 19:
                    {
                        _tablePr.TableStyle = _params[_current.pos++];
                        break;
                    }
                    case 20:
                    {
                        _tablePr.TableLook = asc_menu_ReadTableLook(_params, _current);
                        break;
                    }
                    case 21:
                    {
                        _tablePr.RowsInHeader = _params[_current.pos++];
                        break;
                    }
                    case 22:
                    {
                        _tablePr.CellsVAlign = _params[_current.pos++];
                        break;
                    }
                    case 23:
                    {
                        _tablePr.AllowOverlap = _params[_current.pos++];
                        break;
                    }
                    case 24:
                    {
                        _tablePr.TableLayout = _params[_current.pos++];
                        break;
                    }
                    case 25:
                    {
                        _tablePr.Locked = _params[_current.pos++];
                        break;
                    }
                    case 255:
                    default:
                    {
                        _continue = false;
                        break;
                    }
                }
            }

            this.tblApply(_tablePr);
            this.WordControl.m_oLogicDocument.Recalculate();
            
            break;
        }

        case 12: // ASC_MENU_EVENT_TYPE_TABLESTYLES 
        {

        }

        case 13: // ASC_MENU_EVENT_TYPE_INCREASEPARAINDENT
        {
            this.IncreaseIndent();
            break;
        }
        case 14: // ASC_MENU_EVENT_TYPE_DECREASEPARAINDENT
        {
            this.DecreaseIndent();
            break;
        }

        case 18: // ASC_MENU_EVENT_TYPE_SHAPE
        {
            var shapeProp = asc_menu_ReadShapePr(_params, _current);           
            this.ShapeApply(shapeProp);
            this.WordControl.m_oLogicDocument.Recalculate();
            break;
        }

        case 20: // ASC_MENU_EVENT_TYPE_SLIDE
        {
            var props = asc_menu_ReadSlidePr(_params, _current);
            this.SetSlideProps(props);
            break;
        }

        case 21: // ASC_MENU_EVENT_TYPE_CHART
        {
            var chartProp = asc_menu_ReadChartPr(_params, _current);
            var prop = new Asc.CAscChartProp();
            prop.put_ChartProperties(chartProp);
            prop.put_SeveralCharts(false);
            this.ChartApply(prop);
            this.WordControl.m_oLogicDocument.Recalculate();
        	break;
        }
        
        case 50: // ASC_MENU_EVENT_TYPE_INSERT_IMAGE
        {
            var oImageObject = {};
            oImageObject.src = _params[0];
            oImageObject.Image = {};
            oImageObject.Image.width = _params[1];
            oImageObject.Image.height = _params[2];
            this.WordControl.m_oLogicDocument.addImages([oImageObject]);
            break;
        }

        case 51: // ASC_MENU_EVENT_TYPE_INSERT_TABLE
        {
            var rows = 2;
            var cols = 2;
            var style = null;

            while (_continue)
            {
                var _attr = _params[_current.pos++];
                switch (_attr)
                {
                    case 0:
                    {
                        rows = _params[_current.pos++];
                        break;
                    }
                    case 1:
                    {
                        cols = _params[_current.pos++];
                        break;
                    }
                    case 2:
                    {
                        style = _params[_current.pos++];
                        break;
                    }
                    case 255:
                    default:
                    {
                        _continue = false;
                        break;
                    }
                }
            }
            
            this.put_Table(cols, rows);
                                       
            var properties = new Asc.CTableProp();
            properties.put_TableStyle(style);

            this.tblApply(properties);

            break;
        }

        case 52: // ASC_MENU_EVENT_TYPE_INSERT_HYPERLINK
        {
            var props = asc_menu_ReadHyperPr(_params, _current);
            this.add_Hyperlink(props);
            break;
        }
      
        case 53: // ASC_MENU_EVENT_TYPE_INSERT_SHAPE
        {
            var shapeProp = asc_menu_ReadShapePr(_params["shape"], _current);
            var aspect = parseFloat(_params["aspect"]);

            var logicDocument = this.WordControl.m_oLogicDocument;

            if (logicDocument && logicDocument.Slides[logicDocument.CurPage]) {                  
                var oDrawingObjects = logicDocument.Slides[logicDocument.CurPage].graphicObjects;
                oDrawingObjects.changeCurrentState(new AscFormat.StartAddNewShape(oDrawingObjects, shapeProp.type));
                    
                var dsx = logicDocument.Height / 2.5 * aspect
                var dsy = logicDocument.Height / 2.5                 
                var dx  = logicDocument.Width * 0.5 - dsx * 0.5
                var dy  = logicDocument.Height * 0.5 - dsy * 0.5

                logicDocument.OnMouseDown({}, dx, dy, logicDocument.CurPage);
                logicDocument.OnMouseMove({IsLocked: true}, dx + dsx, dy + dsy, logicDocument.CurPage);
                logicDocument.OnMouseUp({}, dx, dy, logicDocument.CurPage);
                logicDocument.Document_UpdateInterfaceState();
                logicDocument.Document_UpdateRulersState();
                logicDocument.Document_UpdateSelectionState();
            }
            break;
        }
        
        case 58: // ASC_MENU_EVENT_TYPE_CAN_ADD_HYPERLINK
        {
            var canAdd = this.can_AddHyperlink();

            var _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();

            if (canAdd !== false) {
                var _text = this.WordControl.m_oLogicDocument.GetSelectedText(true);
                if (null != _text) {
                    _stream["WriteString2"](_text);
                }
            }

            _return = _stream;
            break;
        }

        case 59: // ASC_MENU_EVENT_TYPE_REMOVE_HYPERLINK
        {
            this.remove_Hyperlink();
            break;
        }

        case 62: //ASC_MENU_EVENT_TYPE_SEARCH_FINDTEXT
        {
            var SearchEngine = this.WordControl.m_oLogicDocument.Search(_params[0], {MatchCase : _params[2]});
            var Id = this.WordControl.m_oLogicDocument.Search_GetId(_params[1]);
            if (null != Id)
                this.WordControl.m_oLogicDocument.Search_Select(Id);

            var _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            _stream["WriteLong"](SearchEngine.Count);
            _return = _stream;
            break;
        }

        case 63: // ASC_MENU_EVENT_TYPE_SEARCH_REPLACETEXT
        {
            var _ret = this.asc_replaceText(_params[0], _params[1], _params[2], _params[3]);
            var _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            _stream["WriteBool"](_ret);
            _return = _stream;
            break;
        }

        case 71: // ASC_MENU_EVENT_TYPE_TABLE_INSERTDELETE_ROWCOLUMN
        {
            var _type = 0;
            var _is_add = true;
            var _is_above = true;
            while (_continue)
            {
                var _attr = _params[_current.pos++];
                switch (_attr)
                {
                    case 0:
                    {
                        _type = _params[_current.pos++];
                        break;
                    }
                    case 1:
                    {
                        _is_add = _params[_current.pos++];
                        break;
                    }
                    case 2:
                    {
                        _is_above = _params[_current.pos++];
                        break;
                    }
                    case 255:
                    default:
                    {
                        _continue = false;
                        break;
                    }
                }
            }

            if (1 == _type) {
                if (_is_add) {
                    _is_above ? this.addColumnLeft() : this.addColumnRight();
                } else {
                    this.remColumn();
                }
            } else if (2 == _type) {
                if (_is_add) {
                    _is_above ? this.addRowAbove() : this.addRowBelow(); 
                } else {
                    this.remRow();
                }
            } else if (3 == _type) {
                this.remTable();
            }

            break;
        }
        
        case 110: // ASC_MENU_EVENT_TYPE_CONTEXTMENU_COPY
        {
            _return = this.Call_Menu_Context_Copy();
            break;
        }
        
        case 111 : // ASC_MENU_EVENT_TYPE_CONTEXTMENU_CUT
        {
            _return = this.Call_Menu_Context_Cut();
            break;
        }
        case 112: // ASC_MENU_EVENT_TYPE_CONTEXTMENU_PASTE
        {
            if(undefined !== _params)
            {
                this.Call_Menu_Context_Paste(_params[0], _params[1]);
            }
            break;
        }
        case 113: // ASC_MENU_EVENT_TYPE_CONTEXTMENU_DELETE
        {
            this.Call_Menu_Context_Delete();
            break;
        }
       
        case 114: // ASC_MENU_EVENT_TYPE_CONTEXTMENU_SELECT
        {
            this.Call_Menu_Context_Select();
            break;
        }
        
        case 115: // ASC_MENU_EVENT_TYPE_CONTEXTMENU_SELECTALL
        {
            this.Call_Menu_Context_SelectAll();
            break;
        }

        case 200: // ASC_MENU_EVENT_TYPE_DOCUMENT_BASE64
        {
            var _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            _stream["WriteStringA"](this["asc_nativeGetFileData"]());
            _return = _stream;
            break;
        }

        case 201: // ASC_MENU_EVENT_TYPE_DOCUMENT_CHARTSTYLES
        {
            var typeChart = _params[0];
            this.chartPreviewManager.getChartPreviews(typeChart);
            _return = global_memory_stream_menu;
            break;
        }

        case 202: // ASC_MENU_EVENT_TYPE_DOCUMENT_PDFBASE64
        {
            var _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            _stream["WriteStringA"](this.WordControl.m_oDrawingDocument.ToRenderer());
            _return = _stream;
            break;
        }

        case 400:   // ASC_MENU_EVENT_TYPE_INSERT_CHART
        {

            break;
        }  

        case 440:   // ASC_MENU_EVENT_TYPE_ADD_CHART_DATA
        {
            if (undefined !== _params) {
                var chartData = _params[0];
                if (chartData && chartData.length > 0) {
                    var json = JSON.parse(chartData);
                    if (json) {
                        _api.asc_addChartDrawingObject(json);
                    }
                }
            }
            break;
        } 

        case 450:   // ASC_MENU_EVENT_TYPE_GET_CHART_DATA
        {
            var index = null;
            if (undefined !== _params) {
                index = parseInt(_params);
            }

            var chart = _api.asc_getChartObject(index);
            
            var _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            _stream["WriteStringA"](JSON.stringify(new Asc.asc_CChartBinary(chart)));
            _return = _stream;
            
            break;
        }
        
        case 460:   // ASC_MENU_EVENT_TYPE_SET_CHART_DATA
        {
            if (undefined !== _params) {
                var chartData = _params[0];
                if (chartData && chartData.length > 0) {
                    var json = JSON.parse(chartData);
                    if (json) {
                        _api.asc_editChartDrawingObject(json);
                    }
                }
            }
            break;
        }

        case 2415: // ASC_MENU_EVENT_TYPE_CHANGE_COLOR_SCHEME
        {
            if (undefined !== _params) {
                var indexScheme = parseInt(_params);
                this.ChangeColorScheme(indexScheme);
            }
            break;
        }


        case 8001: //ASC_PRESENTATIONS_EVENT_TYPE_ALL_TRANSITIONS
        {
            var aTimings = [];
            var slides = this.WordControl.m_oLogicDocument.Slides;
            for(var i = 0; i < slides.length; ++i){
                aTimings.push(slides[i].timing.ToArray());
            }
            _return = aTimings;
            break;
        }

        case 8111: // ASC_PRESENTATIONS_EVENT_TYPE_ADD_SLIDE
        {
            var index = parseInt(_params);
            this.AddSlide(index);
            this.WordControl.m_oDrawingDocument.UpdateThumbnailsAttack();
            break;
        }

        case 8112: // ASC_PRESENTATIONS_EVENT_TYPE_DELETE_SLIDE           
        {
            var oLogicDocument = this.WordControl.m_oLogicDocument;
            var oCurSlide = oLogicDocument.Slides[oLogicDocument.CurPage];
            if(oCurSlide && oCurSlide.Layout && oCurSlide.Layout.Master)
            {
                oLogicDocument.lastMaster = oCurSlide.Layout.Master;
            }
            this.WordControl.m_oLogicDocument.deleteSlides(_params);
            break;
        }

        case 8113: // ASC_PRESENTATIONS_EVENT_TYPE_DUBLICATE_SLIDE        
        {
            this.WordControl.m_oLogicDocument.shiftSlides(Math.max.apply(Math, _params) + 1, _params, true);
            break;
        }

        case 8114: // ASC_PRESENTATIONS_EVENT_TYPE_MOVE_SLIDE             
        {
            var _stream = global_memory_stream_menu;
            var nPos = _params[0];
            var aMoveArray = _params.slice(1);
            this.WordControl.m_oDrawingDocument.LockEvents = true;
            this.WordControl.m_oLogicDocument.CurPage = this.WordControl.m_oLogicDocument.shiftSlides(nPos, aMoveArray, false);
            this.WordControl.m_oDrawingDocument.LockEvents = false;
            this.WordControl.m_oDrawingDocument.UpdateThumbnailsAttack();
            _return = _stream;
            break;
        }

        case 8115: // ASC_PRESENTATIONS_EVENT_TYPE_HIDE_SLIDE             
        {
            var bIsHide = this.WordControl.m_oLogicDocument.Slides[_params[0]].isVisible();
            var aHideArray = _params;
            this.WordControl.m_oLogicDocument.hideSlides(bIsHide, aHideArray);
            break;
        }

        case 8116: //ASC_PRESENTATIONS_EVENT_TYPE_CHANGE_LAYOUT
        {
            this.ChangeLayout(parseInt(_params))
            break;
        }
        case 8117: //ASC_PRESENTATIONS_EVENT_TYPE_CHANGE_THEME
        {
            this.ChangeTheme(parseInt(_params), false);
            break;
        }

        case 8120: // ASC_PRESENTATIONS_EVENT_TYPE_CHANGE_LEVEL           
        {
            var level = parseInt(_params);
            
            if (level == Asc.c_oAscDrawingLayerType.BringToFront) {
                this.shapes_bringToFront();
            } else if (level == Asc.c_oAscDrawingLayerType.SendToBack) {
                this.shapes_bringToBack();
            } else if (level == Asc.c_oAscDrawingLayerType.BringForward) {
                this.shapes_bringForward();
            } else if (level == Asc.c_oAscDrawingLayerType.SendBackward) {
                this.shapes_bringBackward();
            }

            break;
        }

        case 8121: // ASC_PRESENTATIONS_EVENT_TYPE_SHAPE_ALIGN
        {
            var level = parseInt(_params);

            if (c_oAscAlignShapeType.ALIGN_LEFT == level) {
                this.put_ShapesAlign(c_oAscAlignShapeType.ALIGN_LEFT);
            } else if (c_oAscAlignShapeType.ALIGN_CENTER == level) {
                this.put_ShapesAlign(c_oAscAlignShapeType.ALIGN_CENTER);
            } else if (c_oAscAlignShapeType.ALIGN_RIGHT == level) {
                this.put_ShapesAlign(c_oAscAlignShapeType.ALIGN_RIGHT);
            } else if (c_oAscAlignShapeType.ALIGN_TOP == level) {
                this.put_ShapesAlign(c_oAscAlignShapeType.ALIGN_TOP);
            } else if (c_oAscAlignShapeType.ALIGN_MIDDLE == level) {
                this.put_ShapesAlign(c_oAscAlignShapeType.ALIGN_MIDDLE);
            } else if (c_oAscAlignShapeType.ALIGN_BOTTOM == level) {
                this.put_ShapesAlign(c_oAscAlignShapeType.ALIGN_BOTTOM);
            } else if (6 == level) {
                this.DistributeHorizontally();
            } else if (7 == level) {
                this.DistributeVertically();
            } 

            break;
        }

        case 8124: // ASC_PRESENTATIONS_EVENT_TYPE_SLIDE_TIMIN_GALL
        {
            this.SlideTimingApplyToAll();
            break;
        }

        case 8125: //ASC_PRESENTATIONS_EVENT_TYPE_PASTE_CONTENT_TYPE
        {
            if(_params[0]){
                var oPasteProcessor = new AscCommon.PasteProcessor(this, false, false, false);
                var aContent = AscFormat.ExecuteNoHistory(function(){
                    return oPasteProcessor._readPresentationSelectedContent2(_params[0]);
                }, this, []);
                if(Array.isArray(aContent) && aContent.length > 0){
                    _return = aContent[0].getContentType();               
                }
            }
            _return = 0;
            break;
        }

        case 5000: // ASC_MENU_EVENT_TYPE_GO_TO_INTERNAL_LINK 
        {

            var aStack = this.SelectedObjectsStack;
            for(var  i = 0; i < aStack.length; ++i){
                if(aStack[i].Type === Asc.c_oAscTypeSelectElement.Hyperlink){
                    var value = aStack[i].Value && aStack[i].Value.Value;
                    if(value){
                        this.sync_HyperlinkClickCallback(value);
                    }
                    break;
                }
            }
            break;
        }

        case 10000: // ASC_SOCKET_EVENT_TYPE_OPEN
        {
            this.CoAuthoringApi._CoAuthoringApi._onServerOpen();
            break;
        }

        case 10010: // ASC_SOCKET_EVENT_TYPE_ON_CLOSE
        {

            break;
        }

        case 10020: // ASC_SOCKET_EVENT_TYPE_MESSAGE
        {
            this.CoAuthoringApi._CoAuthoringApi._onServerMessage(_params);
            break;
        }

        case 11010: // ASC_SOCKET_EVENT_TYPE_ON_DISCONNECT
        {
            break;
        }

        case 11020: // ASC_SOCKET_EVENT_TYPE_TRY_RECONNECT
        {
            this.CoAuthoringApi._CoAuthoringApi._reconnect();
            break;
        }
        case 21000: // ASC_COAUTH_EVENT_TYPE_INSERT_URL_IMAGE
        {
            var urls = JSON.parse(_params[0]);
            AscCommon.g_oDocumentUrls.addUrls(urls);
            var firstUrl;
            for (var i in urls) {
                if (urls.hasOwnProperty(i)) {
                    firstUrl = urls[i];
                    break;
                }
            }
            var oImageObject = {};
            oImageObject.src = firstUrl;
            oImageObject.Image = {};
            oImageObject.Image.width = _params[1];
            oImageObject.Image.height = _params[2];
            this.WordControl.m_oLogicDocument.addImages([oImageObject]);
            break;
        }


        case 21001: // ASC_COAUTH_EVENT_TYPE_LOAD_URL_IMAGE
        {
            if(this.RedrawTimer != null){
                clearTimeout(this.RedrawTimer);
            }
            var oThis = this;
            this.RedrawTimer = setTimeout(function(){
                oThis.WordControl.m_oDrawingDocument.ClearCachePages();
                oThis.WordControl.m_oDrawingDocument.FirePaint();
                oThis.WordControl.m_oDrawingDocument.UpdateThumbnailsAttack();
                oThis.WordControl.m_oDrawingDocument.CheckThemes();
                oThis.WordControl.CheckLayouts(true);
                oThis.RedrawTimer = null;
            }, 1000);
            break;
        }

        case 22001: // ASC_MENU_EVENT_TYPE_SET_PASSWORD
        {
            this.asc_setDocumentPassword(_params[0]);
            break;
        }
      
        case 22004: // ASC_EVENT_TYPE_SPELLCHECK_MESSAGE
        {
            var json = JSON.parse(_params[0]);
            if (json && json["spellCheckData"]) {
                if (this.SpellCheckApi) {
                    this.SpellCheckApi.onSpellCheck(json["spellCheckData"]);
                }
            }
            break;
        }

        case 22005: // ASC_EVENT_TYPE_SPELLCHECK_TURN_ON
        {
            var status = parseInt(_params[0]);
            if (status !== undefined) {
                this.asc_setSpellCheck(status == 0 ? false : true);
            } 
        }

        default:
            break;
    }

    return _return;
};
