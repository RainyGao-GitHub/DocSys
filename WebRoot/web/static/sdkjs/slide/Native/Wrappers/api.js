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

var global_memory_stream_menu = CreateNativeMemoryStream();

var _api = null;

var sdkCheck = true;
var spellCheck = true;

// endsectionPr -----------------------------------------------------------------------------------------

window['SockJS'] = createSockJS();

// font engine -------------------------------------
var FontStyle =
{
    FontStyleRegular:    0,
    FontStyleBold:       1,
    FontStyleItalic:     2,
    FontStyleBoldItalic: 3,
    FontStyleUnderline:  4,
    FontStyleStrikeout:  8
};

window["use_native_fonts_only"] = true;
// -------------------------------------------------

// declarate unused methods and objects
window["ftm"] = FT_Memory;

// ASCCOLOR
function asc_menu_ReadColor(_params, _cursor)
{
    var _color = new Asc.asc_CColor();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _color.type = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _color.r = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _color.g = _params[_cursor.pos++];
                break;
            }
            case 3:
            {
                _color.b = _params[_cursor.pos++];
                break;
            }
            case 4:
            {
                _color.a = _params[_cursor.pos++];
                break;
            }
            case 5:
            {
                _color.Auto = _params[_cursor.pos++];
                break;
            }
            case 6:
            {
                _color.value = _params[_cursor.pos++];
                break;
            }
            case 7:
            {
                _color.ColorSchemeId = _params[_cursor.pos++];
                break;
            }
            case 8:
            {
                var _count = _params[_cursor.pos++];
                for (var i = 0; i < _count; i++)
                {
                    var _mod = new AscFormat.CColorMod();
                    _mod.name = _params[_cursor.pos++];
                    _mod.val = _params[_cursor.pos++];
                    _color.Mods.push(_mod);
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
    return _color;
}
function asc_menu_WriteColor(_type, _color, _stream)
{
    if (!_color)
        return;

    _stream["WriteByte"](_type);

    if (_color.type !== undefined && _color.type !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteLong"](_color.type);
    }
    if (_color.r !== undefined && _color.r !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteByte"](_color.r);
    }
    if (_color.g !== undefined && _color.g !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteByte"](_color.g);
    }
    if (_color.b !== undefined && _color.b !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteByte"](_color.b);
    }
    if (_color.a !== undefined && _color.a !== null)
    {
        _stream["WriteByte"](4);
        _stream["WriteByte"](_color.a);
    }
    if (_color.Auto !== undefined && _color.Auto !== null)
    {
        _stream["WriteByte"](5);
        _stream["WriteBool"](_color.Auto);
    }
    if (_color.value !== undefined && _color.value !== null)
    {
        _stream["WriteByte"](6);
        _stream["WriteLong"](_color.value);
    }
    if (_color.ColorSchemeId !== undefined && _color.ColorSchemeId !== null)
    {
        _stream["WriteByte"](7);
        _stream["WriteLong"](_color.ColorSchemeId);
    }
    if (_color.Mods !== undefined && _color.Mods !== null)
    {
        _stream["WriteByte"](8);

        var _len = _color.Mods.length;
        _stream["WriteLong"](_len);

        for (var i = 0; i < _len; i++)
        {
            _stream["WriteString1"](_color.Mods[i].name);
            _stream["WriteLong"](_color.Mods[i].val);
        }
    }

    _stream["WriteByte"](255);
}

function asc_WriteUsers(c, s) {
    if (!c) return;

    var len = 0, name, user;
    for (name in c) {
        if (undefined !== name) {
            len++;
        }
    }

    s["WriteLong"](len);

    for (name in c) {
        if (undefined !== name) {
            user = c[name];
            if (user) {
                s['WriteString2'](user.asc_getId());
                s['WriteString2'](user.asc_getFirstName() === undefined ? "" : user.asc_getFirstName());
                s['WriteString2'](user.asc_getLastName() === undefined ? "" : user.asc_getLastName());
                s['WriteString2'](user.asc_getUserName() === undefined ? "" : user.asc_getUserName());
                s['WriteBool'](user.asc_getView());

                var color = new Asc.asc_CColor();

                color.r = (user.color >> 16) & 255;
                color.g = (user.color >> 8 ) & 255;
                color.b = (user.color      ) & 255;

                asc_menu_WriteColor(0, color, s);
            }
        }
    }
}

function asc_WriteColorSchemes(schemas, s) {

    s["WriteLong"](schemas.length);

    for (var i = 0; i < schemas.length; ++i) {
        s["WriteString2"](schemas[i].get_name());

        var colors = schemas[i].get_colors();
        s["WriteLong"](colors.length);

        for (var j = 0; j < colors.length; ++j) {
            asc_menu_WriteColor(0, colors[j], s);
        }
    }
}

function asc_menu_ReadFontFamily(_params, _cursor)
{
    var _fontfamily = { Name : undefined, Index : -1 };
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _fontfamily.Name = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _fontfamily.Index = _params[_cursor.pos++];
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
    return _fontfamily;
}

function asc_menu_ReadAscValAxisSettings(_params, _cursor)
{
    var _settings = new AscCommon.asc_ValAxisSettings();

    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _settings.minValRule = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _settings.minVal = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _settings.maxValRule = _params[_cursor.pos++];
                break;
            }
            case 3:
            {
                _settings.maxVal = _params[_cursor.pos++];
                break;
            }
            case 4:
            {
                _settings.invertValOrder = _params[_cursor.pos++];
                break;
            }
            case 5:
            {
                _settings.logScale = _params[_cursor.pos++];
                break;
            }
            case 6:
            {
                _settings.logBase = _params[_cursor.pos++];
                break;
            }
            case 7:
            {
                _settings.dispUnitsRule = _params[_cursor.pos++];
                break;
            }
            case 8:
            {
                _settings.units = _params[_cursor.pos++];
                break;
            }
            case 9:
            {
                _settings.showUnitsOnChart = _params[_cursor.pos++];
                break;
            }
            case 10:
            {
                _settings.majorTickMark = _params[_cursor.pos++];
                break;
            }
            case 11:
            {
                _settings.minorTickMark = _params[_cursor.pos++];
                break;
            }
            case 12:
            {
                _settings.tickLabelsPos = _params[_cursor.pos++];
                break;
            }
            case 13:
            {
                _settings.crossesRule = _params[_cursor.pos++];
                break;
            }
            case 14:
            {
                _settings.crosses = _params[_cursor.pos++];
                break;
            }
            case 15:
            {
                _settings.axisType = _params[_cursor.pos++];
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

    return _settings;
};
function asc_menu_WriteAscValAxisSettings(_type, _settings, _stream)
{
    if (!_settings)
        return;

    _stream["WriteByte"](_type);

    if (_settings.minValRule !== undefined && _settings.minValRule !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteLong"](_settings.minValRule);
    }
    if (_settings.minVal !== undefined && _settings.minVal !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteLong"](_settings.minVal);
    }
    if (_settings.maxValRule !== undefined && _settings.maxValRule !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteLong"](_settings.maxValRule);
    }
    if (_settings.maxVal !== undefined && _settings.maxVal !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteLong"](_settings.maxVal);
    }
    if (_settings.invertValOrder !== undefined && _settings.invertValOrder !== null)
    {
        _stream["WriteByte"](4);
        _stream["WriteBool"](_settings.invertValOrder);
    }
    if (_settings.logScale !== undefined && _settings.logScale !== null)
    {
        _stream["WriteByte"](5);
        _stream["WriteBool"](_settings.logScale);
    }
    if (_settings.logBase !== undefined && _settings.logBase !== null)
    {
        _stream["WriteByte"](6);
        _stream["WriteLong"](_settings.logBase);
    }
    if (_settings.dispUnitsRule !== undefined && _settings.dispUnitsRule !== null)
    {
        _stream["WriteByte"](7);
        _stream["WriteLong"](_settings.dispUnitsRule);
    }
    if (_settings.units !== undefined && _settings.units !== null)
    {
        _stream["WriteByte"](8);
        _stream["WriteLong"](_settings.units);
    }
    if (_settings.showUnitsOnChart !== undefined && _settings.showUnitsOnChart !== null)
    {
        _stream["WriteByte"](9);
        _stream["WriteBool"](_settings.showUnitsOnChart);
    }
    if (_settings.majorTickMark !== undefined && _settings.majorTickMark !== null)
    {
        _stream["WriteByte"](10);
        _stream["WriteLong"](_settings.majorTickMark);
    }
    if (_settings.minorTickMark !== undefined && _settings.minorTickMark !== null)
    {
        _stream["WriteByte"](11);
        _stream["WriteLong"](_settings.minorTickMark);
    }
    if (_settings.tickLabelsPos !== undefined && _settings.tickLabelsPos !== null)
    {
        _stream["WriteByte"](12);
        _stream["WriteLong"](_settings.tickLabelsPos);
    }
    if (_settings.crossesRule !== undefined && _settings.crossesRule !== null)
    {
        _stream["WriteByte"](13);
        _stream["WriteLong"](_settings.crossesRule);
    }
    if (_settings.crosses !== undefined && _settings.crosses !== null)
    {
        _stream["WriteByte"](14);
        _stream["WriteLong"](_settings.crosses);
    }
    if (_settings.axisType !== undefined && _settings.axisType !== null)
    {
        _stream["WriteByte"](15);
        _stream["WriteLong"](_settings.axisType);
    }

    _stream["WriteByte"](255);
};

function asc_menu_ReadChartPr(_params, _cursor)
{
    var _settings = new Asc.asc_ChartSettings();

    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _settings.style = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _settings.title = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _settings.rowCols = _params[_cursor.pos++];
                break;
            }
            case 3:
            {
                _settings.horAxisLabel = _params[_cursor.pos++];
                break;
            }
            case 4:
            {
                _settings.vertAxisLabel = _params[_cursor.pos++];
                break;
            }
            case 5:
            {
                _settings.legendPos = _params[_cursor.pos++];
                break;
            }
            case 6:
            {
                _settings.dataLabelsPos = _params[_cursor.pos++];
                break;
            }
            case 7:
            {
                _settings.horAx = _params[_cursor.pos++];
                break;
            }
            case 8:
            {
                _settings.vertAx = _params[_cursor.pos++];
                break;
            }
            case 9:
            {
                _settings.horGridLines = _params[_cursor.pos++];
                break;
            }
            case 10:
            {
                _settings.vertGridLines = _params[_cursor.pos++];
                break;
            }
            case 11:
            {
                _settings.type = _params[_cursor.pos++];
                break;
            }
            case 12:
            {
                _settings.showSerName = _params[_cursor.pos++];
                break;
            }
            case 13:
            {
                _settings.showCatName = _params[_cursor.pos++];
                break;
            }
            case 14:
            {
                _settings.showVal = _params[_cursor.pos++];
                break;
            }
            case 15:
            {
                _settings.separator = _params[_cursor.pos++];
                break;
            }
            case 16:
            {
                _settings.horAxisProps = asc_menu_ReadAscValAxisSettings(_params, _cursor);
                break;
            }
            case 17:
            {
                _settings.vertAxisProps = asc_menu_ReadAscValAxisSettings(_params, _cursor);
                break;
            }
            case 18:
            {
                _settings.putRange(_params[_cursor.pos++]);
                break;
            }
            case 19:
            {
                _settings.inColumns = _params[_cursor.pos++];
                break;
            }
            case 20:
            {
                _settings.showMarker = _params[_cursor.pos++];
                break;
            }
            case 21:
            {
                _settings.bLine = _params[_cursor.pos++];
                break;
            }
            case 22:
            {
                _settings.smooth = _params[_cursor.pos++];
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

    return _settings;
};
function asc_menu_WriteChartPr(_type, _chartPr, _stream)
{
    if (!_chartPr)
        return;

    if(_type !== undefined)
    {
        _stream["WriteByte"](_type);
    }
    

    if (_chartPr.style !== undefined && _chartPr.style !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteLong"](_chartPr.style);
    }
    if (_chartPr.title !== undefined && _chartPr.title !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteLong"](_chartPr.title);
    }
    if (_chartPr.rowCols !== undefined && _chartPr.rowCols !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteLong"](_chartPr.rowCols);
    }
    if (_chartPr.horAxisLabel !== undefined && _chartPr.horAxisLabel !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteLong"](_chartPr.horAxisLabel);
    }
    if (_chartPr.vertAxisLabel !== undefined && _chartPr.vertAxisLabel !== null)
    {
        _stream["WriteByte"](4);
        _stream["WriteLong"](_chartPr.vertAxisLabel);
    }
    if (_chartPr.legendPos !== undefined && _chartPr.legendPos !== null)
    {
        _stream["WriteByte"](5);
        _stream["WriteLong"](_chartPr.legendPos);
    }
    if (_chartPr.dataLabelsPos !== undefined && _chartPr.dataLabelsPos !== null)
    {
        _stream["WriteByte"](6);
        _stream["WriteLong"](_chartPr.dataLabelsPos);
    }
    if (_chartPr.horAx !== undefined && _chartPr.horAx !== null)
    {
        _stream["WriteByte"](7);
        _stream["WriteLong"](_chartPr.horAx);
    }
    if (_chartPr.vertAx !== undefined && _chartPr.vertAx !== null)
    {
        _stream["WriteByte"](8);
        _stream["WriteLong"](_chartPr.vertAx);
    }
    if (_chartPr.horGridLines !== undefined && _chartPr.horGridLines !== null)
    {
        _stream["WriteByte"](9);
        _stream["WriteLong"](_chartPr.horGridLines);
    }
    if (_chartPr.vertGridLines !== undefined && _chartPr.vertGridLines !== null)
    {
        _stream["WriteByte"](10);
        _stream["WriteLong"](_chartPr.vertGridLines);
    }
    if (_chartPr.type !== undefined && _chartPr.type !== null)
    {
        _stream["WriteByte"](11);
        _stream["WriteLong"](_chartPr.type);
    }

    if (_chartPr.showSerName !== undefined && _chartPr.showSerName !== null)
    {
        _stream["WriteByte"](12);
        _stream["WriteBool"](_chartPr.showSerName);
    }
    if (_chartPr.showCatName !== undefined && _chartPr.showCatName !== null)
    {
        _stream["WriteByte"](13);
        _stream["WriteBool"](_chartPr.showCatName);
    }
    if (_chartPr.showVal !== undefined && _chartPr.showVal !== null)
    {
        _stream["WriteByte"](14);
        _stream["WriteBool"](_chartPr.showVal);
    }

    if (_chartPr.separator !== undefined && _chartPr.separator !== null)
    {
        _stream["WriteByte"](15);
        _stream["WriteString2"](_chartPr.separator);
    }

    asc_menu_WriteAscValAxisSettings(16, _chartPr.horAxisProps, _stream);
    asc_menu_WriteAscValAxisSettings(17, _chartPr.vertAxisProps, _stream);

    var sRange = _chartPr.getRange();
    if (sRange !== undefined && sRange !== null)
    {
        _stream["WriteByte"](18);
        _stream["WriteString2"](sRange);
    }

    if (_chartPr.inColumns !== undefined && _chartPr.inColumns !== null)
    {
        _stream["WriteByte"](19);
        _stream["WriteBool"](_chartPr.inColumns);
    }
    if (_chartPr.showMarker !== undefined && _chartPr.showMarker !== null)
    {
        _stream["WriteByte"](20);
        _stream["WriteBool"](_chartPr.showMarker);
    }
    if (_chartPr.bLine !== undefined && _chartPr.bLine !== null)
    {
        _stream["WriteByte"](21);
        _stream["WriteBool"](_chartPr.bLine);
    }
    if (_chartPr.smooth !== undefined && _chartPr.smooth !== null)
    {
        _stream["WriteByte"](22);
        _stream["WriteBool"](_chartPr.showVal);
    }

    _stream["WriteByte"](255);
};

function asc_menu_ReadAscFill_solid(_params, _cursor)
{
    var _fill = new Asc.asc_CFillSolid();

    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _fill.color = asc_menu_ReadColor(_params, _cursor);
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

    return _fill;
};
function asc_menu_WriteAscFill_solid(_type, _fill, _stream)
{
    if (!_fill)
        return;

    _stream["WriteByte"](_type);

    asc_menu_WriteColor(0, _fill.color, _stream);

    _stream["WriteByte"](255);
};
function asc_menu_ReadAscFill_patt(_params, _cursor)
{
    var _fill = new Asc.asc_CFillHatch();

    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _fill.PatternType = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _fill.bgClr = asc_menu_ReadColor(_params, _cursor);
                break;
            }
            case 2:
            {
                _fill.fgClr = asc_menu_ReadColor(_params, _cursor);
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

    return _fill;
};
function asc_menu_WriteAscFill_patt(_type, _fill, _stream)
{
    if (!_fill)
        return;

    _stream["WriteByte"](_type);

    if (_fill.PatternType !== undefined && _fill.PatternType !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteLong"](_fill.PatternType);
    }

    asc_menu_WriteColor(1, _fill.bgClr, _stream);
    asc_menu_WriteColor(2, _fill.fgClr, _stream);

    _stream["WriteByte"](255);
};
function asc_menu_ReadAscFill_grad(_params, _cursor)
{
    var _fill = new Asc.asc_CFillGrad();

    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _fill.GradType = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _fill.LinearAngle = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _fill.LinearScale = _params[_cursor.pos++];
                break;
            }
            case 3:
            {
                _fill.PathType = _params[_cursor.pos++];
                break;
            }
            case 4:
            {
                var _count = _params[_cursor.pos++];

                if (_count > 0)
                {
                    _fill.Colors = [];
                    _fill.Positions = [];
                }
                for (var i = 0; i < _count; i++)
                {
                    _fill.Colors[i] = null;
                    _fill.Positions[i] = null;

                    var _continue2 = true;
                    while (_continue2)
                    {
                        var _attr2 = _params[_cursor.pos++];
                        switch (_attr2)
                        {
                            case 0:
                            {
                                _fill.Colors[i] = asc_menu_ReadColor(_params, _cursor);
                                break;
                            }
                            case 1:
                            {
                                _fill.Positions[i] = _params[_cursor.pos++];
                                break;
                            }
                            case 255:
                            default:
                            {
                                _continue2 = false;
                                break;
                            }
                        }
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

    return _fill;
};
function asc_menu_WriteAscFill_grad(_type, _fill, _stream)
{
    if (!_fill)
        return;

    _stream["WriteByte"](_type);

    if (_fill.GradType !== undefined && _fill.GradType !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteLong"](_fill.GradType);
    }

    if (_fill.LinearAngle !== undefined && _fill.LinearAngle !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteDouble2"](_fill.LinearAngle);
    }

    if (_fill.LinearScale !== undefined && _fill.LinearScale !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteBool"](_fill.LinearScale);
    }

    if (_fill.PathType !== undefined && _fill.PathType !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteLong"](_fill.PathType);
    }

    if (_fill.Colors !== null && _fill.Colors !== undefined && _fill.Positions !== null && _fill.Positions !== undefined)
    {
        if (_fill.Colors.length == _fill.Positions.length)
        {
            var _count = _fill.Colors.length;
            _stream["WriteByte"](4);
            _stream["WriteLong"](_count);

            for (var i = 0; i < _count; i++)
            {
                asc_menu_WriteColor(0, _fill.Colors[i], _stream);

                if (_fill.Positions[i] !== undefined && _fill.Positions[i] !== null)
                {
                    _stream["WriteByte"](1);
                    _stream["WriteLong"](_fill.Positions[i]);
                }

                _stream["WriteByte"](255);
            }
        }
    }

    _stream["WriteByte"](255);
};
function asc_menu_ReadAscFill_blip(_params, _cursor)
{
    var _fill = new Asc.asc_CFillBlip();

    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _fill.type = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _fill.url = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _fill.texture_id = _params[_cursor.pos++];
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

    return _fill;
};
function asc_menu_WriteAscFill_blip(_type, _fill, _stream)
{
    if (!_fill)
        return;

    _stream["WriteByte"](_type);

    if (_fill.type !== undefined && _fill.type !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteLong"](_fill.type);
    }

    if (_fill.url !== undefined && _fill.url !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteString2"](_fill.url);
    }

    if (_fill.texture_id !== undefined && _fill.texture_id !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteLong"](_fill.texture_id);
    }

    _stream["WriteByte"](255);
};

function asc_menu_ReadAscFill(_params, _cursor)
{
    var _fill = new Asc.asc_CShapeFill();

    //_fill.type = c_oAscFill.FILL_TYPE_NOFILL;
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _fill.type = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                switch (_fill.type)
                {
                    case Asc.c_oAscFill.FILL_TYPE_SOLID:
                    {
                        _fill.fill = asc_menu_ReadAscFill_solid(_params, _cursor);
                        break;
                    }
                    case Asc.c_oAscFill.FILL_TYPE_PATT:
                    {
                        _fill.fill = asc_menu_ReadAscFill_patt(_params, _cursor);
                        break;
                    }
                    case Asc.c_oAscFill.FILL_TYPE_GRAD:
                    {
                        _fill.fill = asc_menu_ReadAscFill_grad(_params, _cursor);
                        break;
                    }
                    case Asc.c_oAscFill.FILL_TYPE_BLIP:
                    {
                        _fill.fill = asc_menu_ReadAscFill_blip(_params, _cursor);
                        break;
                    }
                    default:
                        break;
                }
                break;
            }
            case 2:
            {
                _fill.transparent = _params[_cursor.pos++];
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

    return _fill;

};
function asc_menu_WriteAscFill(_type, _fill, _stream)
{
    if (!_fill)
        return;

    _stream["WriteByte"](_type);

    if (_fill.type !== undefined && _fill.type !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteLong"](_fill.type);
    }

    if (_fill.fill !== undefined && _fill.fill !== null)
    {
        switch (_fill.type)
        {
            case Asc.c_oAscFill.FILL_TYPE_SOLID:
            {
                _fill.fill = asc_menu_WriteAscFill_solid(1, _fill.fill, _stream);
                break;
            }
            case Asc.c_oAscFill.FILL_TYPE_PATT:
            {
                _fill.fill = asc_menu_WriteAscFill_patt(1, _fill.fill, _stream);
                break;
            }
            case Asc.c_oAscFill.FILL_TYPE_GRAD:
            {
                _fill.fill = asc_menu_WriteAscFill_grad(1, _fill.fill, _stream);
                break;
            }
            case Asc.c_oAscFill.FILL_TYPE_BLIP:
            {
                _fill.fill = asc_menu_WriteAscFill_blip(1, _fill.fill, _stream);
                break;
            }
            default:
                break;
        }
    }

    if (_fill.transparent !== undefined && _fill.transparent !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteLong"](_fill.transparent);
    }

    _stream["WriteByte"](255);
};

function asc_menu_ReadAscStroke(_params, _cursor)
{
    var _stroke = new Asc.asc_CStroke();

    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _stroke.type = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _stroke.width = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _stroke.color = asc_menu_ReadColor(_params, _cursor);
                break;
            }
            case 3:
            {
                _stroke.LineJoin = _params[_cursor.pos++];
                break;
            }
            case 4:
            {
                _stroke.LineCap = _params[_cursor.pos++];
                break;
            }
            case 5:
            {
                _stroke.LineBeginStyle = _params[_cursor.pos++];
                break;
            }
            case 6:
            {
                _stroke.LineBeginSize = _params[_cursor.pos++];
                break;
            }
            case 7:
            {
                _stroke.LineEndStyle = _params[_cursor.pos++];
                break;
            }
            case 8:
            {
                _stroke.LineEndSize = _params[_cursor.pos++];
                break;
            }
            case 9:
            {
                _stroke.canChangeArrows = _params[_cursor.pos++];
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

    return _stroke;
};

function asc_menu_WriteAscStroke(_type, _stroke, _stream)
{
    if (!_stroke)
        return;

    _stream["WriteByte"](_type);

    if (_stroke.type !== undefined && _stroke.type !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteLong"](_stroke.type);
    }
    if (_stroke.width !== undefined && _stroke.width !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteDouble2"](_stroke.width);
    }

    asc_menu_WriteColor(2, _stroke.color, _stream);

    if (_stroke.LineJoin !== undefined && _stroke.LineJoin !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteByte"](_stroke.LineJoin);
    }
    if (_stroke.LineCap !== undefined && _stroke.LineCap !== null)
    {
        _stream["WriteByte"](4);
        _stream["WriteByte"](_stroke.LineCap);
    }
    if (_stroke.LineBeginStyle !== undefined && _stroke.LineBeginStyle !== null)
    {
        _stream["WriteByte"](5);
        _stream["WriteByte"](_stroke.LineBeginStyle);
    }
    if (_stroke.LineBeginSize !== undefined && _stroke.LineBeginSize !== null)
    {
        _stream["WriteByte"](6);
        _stream["WriteByte"](_stroke.LineBeginSize);
    }
    if (_stroke.LineEndStyle !== undefined && _stroke.LineEndStyle !== null)
    {
        _stream["WriteByte"](7);
        _stream["WriteByte"](_stroke.LineEndStyle);
    }
    if (_stroke.LineEndSize !== undefined && _stroke.LineEndSize !== null)
    {
        _stream["WriteByte"](8);
        _stream["WriteByte"](_stroke.LineEndSize);
    }

    if (_stroke.canChangeArrows !== undefined && _stroke.canChangeArrows !== null)
    {
        _stream["WriteByte"](9);
        _stream["WriteBool"](_stroke.canChangeArrows);
    }

    _stream["WriteByte"](255);
};

function asc_menu_ReadParaInd(_params, _cursor)
{
    var _ind = new CParaInd();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _ind.Left = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _ind.Right = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _ind.FirstLine = _params[_cursor.pos++];
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
    return _ind;
};

function asc_menu_WriteParaInd(_type, _ind, _stream)
{
    if (!_ind)
        return;

    _stream["WriteByte"](_type);

    if (_ind.Left !== undefined && _ind.Left !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteDouble2"](_ind.Left);
    }
    if (_ind.Right !== undefined && _ind.Right !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteDouble2"](_ind.Right);
    }
    if (_ind.FirstLine !== undefined && _ind.FirstLine !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteDouble2"](_ind.FirstLine);
    }

    _stream["WriteByte"](255);
};

function asc_menu_ReadParaSpacing(_params, _cursor)
{
    var _spacing = new CParaSpacing();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _spacing.Line = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _spacing.LineRule = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _spacing.Before = _params[_cursor.pos++];
                break;
            }
            case 3:
            {
                _spacing.BeforeAutoSpacing = _params[_cursor.pos++];
                break;
            }
            case 4:
            {
                _spacing.After = _params[_cursor.pos++];
                break;
            }
            case 5:
            {
                _spacing.AfterAutoSpacing = _params[_cursor.pos++];
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
    return _spacing;
};

function asc_menu_WriteParaSpacing(_type, _spacing, _stream)
{
    if (!_spacing)
        return;

    _stream["WriteByte"](_type);

    if (_spacing.Line !== undefined && _spacing.Line !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteDouble2"](_spacing.Line);
    }
    if (_spacing.LineRule !== undefined && _spacing.LineRule !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteLong"](_spacing.LineRule);
    }
    if (_spacing.Before !== undefined && _spacing.Before !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteDouble2"](_spacing.Before);
    }
    if (_spacing.BeforeAutoSpacing !== undefined && _spacing.BeforeAutoSpacing !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteBool"](_spacing.BeforeAutoSpacing);
    }
    if (_spacing.After !== undefined && _spacing.After !== null)
    {
        _stream["WriteByte"](4);
        _stream["WriteDouble2"](_spacing.After);
    }
    if (_spacing.AfterAutoSpacing !== undefined && _spacing.AfterAutoSpacing !== null)
    {
        _stream["WriteByte"](5);
        _stream["WriteBool"](_spacing.AfterAutoSpacing);
    }

    _stream["WriteByte"](255);
};

function asc_menu_ReadParaBorder(_params, _cursor)
{
    var _border = new Asc.asc_CTextBorder();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _border.Color = asc_menu_ReadColor(_params, _cursor);
                break;
            }
            case 1:
            {
                _border.Size = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _border.Value = _params[_cursor.pos++];
                break;
            }
            case 3:
            {
                _border.Space = _params[_cursor.pos++];
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
    return _border;
};

function asc_menu_WriteParaBorder(_type, _border, _stream)
{
    if (!_border)
        return;

    _stream["WriteByte"](_type);

    asc_menu_WriteColor(0, _border.Color, _stream);

    if (_border.Size !== undefined && _border.Size !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteDouble2"](_border.Size);
    }
    if (_border.Value !== undefined && _border.Value !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteLong"](_border.Value);
    }
    if (_border.Space !== undefined && _border.Space !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteDouble2"](_border.Space);
    }

    _stream["WriteByte"](255);
};

function asc_menu_ReadParaBorders(_params, _cursor)
{
    var _border = new Asc.asc_CParagraphBorders();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _border.Left = asc_menu_ReadParaBorder(_params, _cursor);
                break;
            }
            case 1:
            {
                _border.Top = asc_menu_ReadParaBorder(_params, _cursor);
                break;
            }
            case 2:
            {
                _border.Right = asc_menu_ReadParaBorder(_params, _cursor);
                break;
            }
            case 3:
            {
                _border.Bottom = asc_menu_ReadParaBorder(_params, _cursor);
                break;
            }
            case 4:
            {
                _border.Between = asc_menu_ReadParaBorder(_params, _cursor);
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
    return _border;
};

function asc_menu_WriteParaBorders(_type, _borders, _stream)
{
    if (!_borders)
        return;

    _stream["WriteByte"](_type);

    asc_menu_WriteParaBorder(0, _borders.Left, _stream);
    asc_menu_WriteParaBorder(1, _borders.Top, _stream);
    asc_menu_WriteParaBorder(2, _borders.Right, _stream);
    asc_menu_WriteParaBorder(3, _borders.Bottom, _stream);
    asc_menu_WriteParaBorder(4, _borders.Between, _stream);

    _stream["WriteByte"](255);
};

function asc_menu_ReadParaShd(_params, _cursor)
{
    var _shd = new Asc.asc_CParagraphShd();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _shd.Value = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _shd.Color = asc_menu_ReadColor(_params, _cursor);
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
    return _shd;
};

function asc_menu_WriteParaShd(_type, _shd, _stream)
{
    if (!_shd)
        return;

    _stream["WriteByte"](_type);

    if (_shd.Value !== undefined && _shd.Value !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteLong"](_shd.Value);
    }

    asc_menu_WriteColor(1, _shd.Color, _stream);

    _stream["WriteByte"](255);
};

function asc_menu_ReadCellMargins(_params, _cursor)
{
    var _paddings = new Asc.CMargins();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _paddings.Left = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _paddings.Top = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _paddings.Right = _params[_cursor.pos++];
                break;
            }
            case 3:
            {
                _paddings.Bottom = _params[_cursor.pos++];
                break;
            }
            case 4:
            {
                _paddings.Flag = _params[_cursor.pos++];
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
    return _paddings;
};

function asc_menu_WriteCellMargins(_type, _margins, _stream)
{
    if (!_margins)
        return;

    _stream["WriteByte"](_type);

    if (_margins.Left !== undefined && _margins.Left !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteDouble2"](_margins.Left);
    }
    if (_margins.Top !== undefined && _margins.Top !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteDouble2"](_margins.Top);
    }
    if (_margins.Right !== undefined && _margins.Right !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteDouble2"](_margins.Right);
    }
    if (_margins.Bottom !== undefined && _margins.Bottom !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteDouble2"](_margins.Bottom);
    }
    if (_margins.Flag !== undefined && _margins.Flag !== null)
    {
        _stream["WriteByte"](4);
        _stream["WriteLong"](_margins.Flag);
    }

    _stream["WriteByte"](255);
};

function asc_menu_ReadCellBorders(_params, _cursor)
{
    var _borders = new Asc.CBorders();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _borders.Left = asc_menu_ReadParaBorder(_params, _cursor);
                break;
            }
            case 1:
            {
                _borders.Top = asc_menu_ReadParaBorder(_params, _cursor);
                break;
            }
            case 2:
            {
                _borders.Right = asc_menu_ReadParaBorder(_params, _cursor);
                break;
            }
            case 3:
            {
                _borders.Bottom = asc_menu_ReadParaBorder(_params, _cursor);
                break;
            }
            case 4:
            {
                _borders.InsideH = asc_menu_ReadParaBorder(_params, _cursor);
                break;
            }
            case 5:
            {
                _borders.InsideV = asc_menu_ReadParaBorder(_params, _cursor);
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
    return _borders;
};

function asc_menu_WriteCellBorders(_type, _borders, _stream)
{
    if (!_borders)
        return;

    _stream["WriteByte"](_type);

    asc_menu_WriteParaBorder(0, _borders.Left, _stream);
    asc_menu_WriteParaBorder(1, _borders.Top, _stream);
    asc_menu_WriteParaBorder(2, _borders.Right, _stream);
    asc_menu_WriteParaBorder(3, _borders.Bottom, _stream);
    asc_menu_WriteParaBorder(4, _borders.InsideH, _stream);
    asc_menu_WriteParaBorder(5, _borders.InsideV, _stream);

    _stream["WriteByte"](255);
};

function asc_menu_ReadCellBackground(_params, _cursor)
{
    var _background = new Asc.CBackground();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _background.Color = asc_menu_ReadColor(_params, _cursor);
                break;
            }
            case 1:
            {
                _background.Value = _params[_cursor.pos++];
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
    return _background;
};

function asc_menu_WriteCellBackground(_type, _background, _stream)
{
    if (!_background)
        return;

    _stream["WriteByte"](_type);

    asc_menu_WriteColor(0, _background.Color, _stream);

    if (_background.Value !== undefined && _background.Value !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteLong"](_background.Value);
    }

    _stream["WriteByte"](255);
};

function asc_menu_ReadPosition(_params, _cursor) {
    var _position = new Asc.CPosition();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _position.X = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _position.Y = _params[_cursor.pos++];
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
    return _position;
}

function asc_menu_WritePosition(_type, _position, _stream) {
    if (!_position)
        return;

    _stream["WriteByte"](_type);

    if (_position.X !== undefined && _position.X !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteDouble2"](_position.X);
    }
    if (_position.Y !== undefined && _position.Y !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteDouble2"](_position.Y);
    }

    _stream["WriteByte"](255);
}

function asc_menu_WriteParaTabs(_type, _tabs, _stream)
{
    if (!_tabs)
        return;

    _stream["WriteByte"](_type);

    var _len = _tabs.Tabs.length;
    _stream["WriteLong"](_len);

    for (var i = 0; i < _len; i++)
    {
        if (_tabs.Tabs[i].Pos !== undefined && _tabs.Tabs[i].Pos !== null)
        {
            _stream["WriteByte"](0);
            _stream["WriteDouble2"](_tabs.Tabs[i].Pos);
        }
        if (_tabs.Tabs[i].Value !== undefined && _tabs.Tabs[i].Value !== null)
        {
            _stream["WriteByte"](1);
            _stream["WriteLong"](_tabs.Tabs[i].Value);
        }
        _stream["WriteByte"](255);
    }
}

function asc_menu_WriteFontFamily(_type, _family, _stream)
{
    if (!_family)
        return;

    _stream["WriteByte"](_type);

    if (_family.Name !== undefined && _family.Name !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteString2"](_family.Name);
    }
    if (_family.Index !== undefined && _family.Index !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteLong"](_family.Index);
    }

    _stream["WriteByte"](255);
}

function asc_menu_WriteParaFrame(_type, _frame, _stream)
{
    if (!_frame)
        return;

    _stream["WriteByte"](_type);

    if (_frame.FromDropCapMenu !== undefined && _frame.FromDropCapMenu !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteBool"](_frame.FromDropCapMenu);
    }
    if (_frame.DropCap !== undefined && _frame.DropCap !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteLong"](_frame.DropCap);
    }
    if (_frame.W !== undefined && _frame.W !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteDouble2"](_frame.W);
    }
    if (_frame.H !== undefined && _frame.H !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteDouble2"](_frame.H);
    }
    if (_frame.HAlign !== undefined && _frame.HAlign !== null)
    {
        _stream["WriteByte"](4);
        _stream["WriteLong"](_frame.HAlign);
    }
    if (_frame.HRule !== undefined && _frame.HRule !== null)
    {
        _stream["WriteByte"](5);
        _stream["WriteLong"](_frame.HRule);
    }
    if (_frame.HSpace !== undefined && _frame.HSpace !== null)
    {
        _stream["WriteByte"](6);
        _stream["WriteDouble2"](_frame.HSpace);
    }
    if (_frame.VAnchor !== undefined && _frame.VAnchor !== null)
    {
        _stream["WriteByte"](7);
        _stream["WriteLong"](_frame.VAnchor);
    }
    if (_frame.VSpace !== undefined && _frame.VSpace !== null)
    {
        _stream["WriteByte"](8);
        _stream["WriteDouble2"](_frame.VSpace);
    }
    if (_frame.X !== undefined && _frame.X !== null)
    {
        _stream["WriteByte"](9);
        _stream["WriteDouble2"](_frame.X);
    }
    if (_frame.Y !== undefined && _frame.Y !== null)
    {
        _stream["WriteByte"](10);
        _stream["WriteDouble2"](_frame.Y);
    }
    if (_frame.XAlign !== undefined && _frame.XAlign !== null)
    {
        _stream["WriteByte"](11);
        _stream["WriteLong"](_frame.XAlign);
    }
    if (_frame.YAlign !== undefined && _frame.YAlign !== null)
    {
        _stream["WriteByte"](12);
        _stream["WriteLong"](_frame.YAlign);
    }
    if (_frame.Lines !== undefined && _frame.Lines !== null)
    {
        _stream["WriteByte"](13);
        _stream["WriteLong"](_frame.Lines);
    }
    if (_frame.Wrap !== undefined && _frame.Wrap !== null)
    {
        _stream["WriteByte"](14);
        _stream["WriteLong"](_frame.Wrap);
    }

    asc_menu_WriteParaBorders(15, _frame.Brd, _stream);
    asc_menu_WriteParaShd(16, _frame.Shd, _stream);
    asc_menu_WriteFontFamily(17, _frame.FontFamily, _stream);

    _stream["WriteByte"](255);
}

function asc_menu_WriteParaListType(_type, _list, _stream)
{
    if (!_list)
        return;

    _stream["WriteByte"](_type);

    if (_list.Type !== undefined && _list.Type !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteLong"](_list.Type);
    }
    if (_list.SubType !== undefined && _list.SubType !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteLong"](_list.SubType);
    }

    _stream["WriteByte"](255);
}

function asc_menu_WriteParagraphPr(_paraPr, _stream)
{
    if (_paraPr.ContextualSpacing !== undefined && _paraPr.ContextualSpacing !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteBool"](_paraPr.ContextualSpacing);
    }
    asc_menu_WriteParaInd(1, _paraPr.Ind, _stream);

    if (_paraPr.KeepLines !== undefined && _paraPr.KeepLines !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteBool"](_paraPr.KeepLines);
    }
    if (_paraPr.KeepNext !== undefined && _paraPr.KeepNext !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteBool"](_paraPr.KeepNext);
    }
    if (_paraPr.WidowControl !== undefined && _paraPr.WidowControl !== null)
    {
        _stream["WriteByte"](4);
        _stream["WriteBool"](_paraPr.WidowControl);
    }
    if (_paraPr.PageBreakBefore !== undefined && _paraPr.PageBreakBefore !== null)
    {
        _stream["WriteByte"](5);
        _stream["WriteBool"](_paraPr.PageBreakBefore);
    }

    asc_menu_WriteParaSpacing(6, _paraPr.Spacing, _stream);
    asc_menu_WriteParaBorders(7, _paraPr.Brd, _stream);
    asc_menu_WriteParaShd(8, _paraPr.Shd, _stream);

    if (_paraPr.Locked !== undefined && _paraPr.Locked !== null)
    {
        _stream["WriteByte"](9);
        _stream["WriteBool"](_paraPr.Locked);
    }
    if (_paraPr.CanAddTable !== undefined && _paraPr.CanAddTable !== null)
    {
        _stream["WriteByte"](10);
        _stream["WriteBool"](_paraPr.CanAddTable);
    }
    if (_paraPr.CanAddDropCap !== undefined && _paraPr.CanAddDropCap !== null)
    {
        _stream["WriteByte"](11);
        _stream["WriteBool"](_paraPr.CanAddDropCap);
    }

    if (_paraPr.DefaultTab !== undefined && _paraPr.DefaultTab !== null)
    {
        _stream["WriteByte"](12);
        _stream["WriteDouble2"](_paraPr.DefaultTab);
    }

    asc_menu_WriteParaTabs(13, _paraPr.Tabs, _stream);
    asc_menu_WriteParaFrame(14, _paraPr.FramePr, _stream);

    if (_paraPr.Subscript !== undefined && _paraPr.Subscript !== null)
    {
        _stream["WriteByte"](15);
        _stream["WriteBool"](_paraPr.Subscript);
    }
    if (_paraPr.Superscript !== undefined && _paraPr.Superscript !== null)
    {
        _stream["WriteByte"](16);
        _stream["WriteBool"](_paraPr.Superscript);
    }
    if (_paraPr.SmallCaps !== undefined && _paraPr.SmallCaps !== null)
    {
        _stream["WriteByte"](17);
        _stream["WriteBool"](_paraPr.SmallCaps);
    }
    if (_paraPr.AllCaps !== undefined && _paraPr.AllCaps !== null)
    {
        _stream["WriteByte"](18);
        _stream["WriteBool"](_paraPr.AllCaps);
    }
    if (_paraPr.Strikeout !== undefined && _paraPr.Strikeout !== null)
    {
        _stream["WriteByte"](19);
        _stream["WriteBool"](_paraPr.Strikeout);
    }
    if (_paraPr.DStrikeout !== undefined && _paraPr.DStrikeout !== null)
    {
        _stream["WriteByte"](20);
        _stream["WriteBool"](_paraPr.DStrikeout);
    }

    if (_paraPr.TextSpacing !== undefined && _paraPr.TextSpacing !== null)
    {
        _stream["WriteByte"](21);
        _stream["WriteDouble2"](_paraPr.TextSpacing);
    }
    if (_paraPr.Position !== undefined && _paraPr.Position !== null)
    {
        _stream["WriteByte"](22);
        _stream["WriteDouble2"](_paraPr.Position);
    }

    asc_menu_WriteParaListType(23, _paraPr.ListType, _stream);

    if (_paraPr.StyleName !== undefined && _paraPr.StyleName !== null)
    {
        _stream["WriteByte"](24);
        _stream["WriteString2"](_paraPr.StyleName);
    }

    if (_paraPr.Jc !== undefined && _paraPr.Jc !== null)
    {
        _stream["WriteByte"](25);
        _stream["WriteLong"](_paraPr.Jc);
    }

    _stream["WriteByte"](255);
}

function asc_menu_ReadPaddings(_params, _cursor) {
    var _paddings = new Asc.asc_CPaddings();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _paddings.Left = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _paddings.Top = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _paddings.Right = _params[_cursor.pos++];
                break;
            }
            case 3:
            {
                _paddings.Bottom = _params[_cursor.pos++];
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
    return _paddings;
};

function asc_menu_WritePaddings(_type, _paddings, _stream) {
    if (!_paddings)
        return;

    _stream["WriteByte"](_type);

    if (_paddings.Left !== undefined && _paddings.Left !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteDouble2"](_paddings.Left);
    }
    if (_paddings.Top !== undefined && _paddings.Top !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteDouble2"](_paddings.Top);
    }
    if (_paddings.Right !== undefined && _paddings.Right !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteDouble2"](_paddings.Right);
    }
    if (_paddings.Bottom !== undefined && _paddings.Bottom !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteDouble2"](_paddings.Bottom);
    }

    _stream["WriteByte"](255);
};

function asc_menu_WriteImagePosition(_type, _position, _stream){
    if (!_position)
        return;

    _stream["WriteByte"](_type);

    if (_position.RelativeFrom !== undefined && _position.RelativeFrom !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteLong"](_position.RelativeFrom);
    }
    if (_position.UseAlign !== undefined && _position.UseAlign !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteBool"](_position.UseAlign);
    }
    if (_position.Align !== undefined && _position.Align !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteLong"](_position.Align);
    }
    if (_position.Value !== undefined && _position.Value !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteLong"](_position.Value);
    }

    _stream["WriteByte"](255);
};

function asc_menu_ReadTableAnchorPosition(_params, _cursor)
{
    var _position = new CTableAnchorPosition();

    _position.CalcX = _params[_cursor.pos++];
    _position.CalcY = _params[_cursor.pos++];
    _position.W = _params[_cursor.pos++];
    _position.H = _params[_cursor.pos++];
    _position.X = _params[_cursor.pos++];
    _position.Y = _params[_cursor.pos++];
    _position.Left_Margin = _params[_cursor.pos++];
    _position.Right_Margin = _params[_cursor.pos++];
    _position.Top_Margin = _params[_cursor.pos++];
    _position.Bottom_Margin = _params[_cursor.pos++];
    _position.Page_W = _params[_cursor.pos++];
    _position.Page_H = _params[_cursor.pos++];
    _position.X_min = _params[_cursor.pos++];
    _position.Y_min = _params[_cursor.pos++];
    _position.X_max = _params[_cursor.pos++];
    _position.Y_max = _params[_cursor.pos++];

    _cursor.pos++;
}
function asc_menu_WriteTableAnchorPosition(_type, _position, _stream)
{
    if (!_position)
        return;

    _stream["WriteByte"](_type);

    _stream["WriteDouble2"](_position.CalcX);
    _stream["WriteDouble2"](_position.CalcY);
    _stream["WriteDouble2"](_position.W);
    _stream["WriteDouble2"](_position.H);
    _stream["WriteDouble2"](_position.X);
    _stream["WriteDouble2"](_position.Y);
    _stream["WriteDouble2"](_position.Left_Margin);
    _stream["WriteDouble2"](_position.Right_Margin);
    _stream["WriteDouble2"](_position.Top_Margin);
    _stream["WriteDouble2"](_position.Bottom_Margin);
    _stream["WriteDouble2"](_position.Page_W);
    _stream["WriteDouble2"](_position.Page_H);
    _stream["WriteDouble2"](_position.X_min);
    _stream["WriteDouble2"](_position.Y_min);
    _stream["WriteDouble2"](_position.X_max);
    _stream["WriteDouble2"](_position.Y_max);

    _stream["WriteByte"](255);
}

function asc_menu_ReadTableLook(_params, _cursor)
{
    var _position = new CTableLook();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _position.FirstCol = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _position.FirstRow = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _position.LastCol = _params[_cursor.pos++];
                break;
            }
            case 3:
            {
                _position.LastRow = _params[_cursor.pos++];
                break;
            }
            case 4:
            {
                _position.BandHor = _params[_cursor.pos++];
                break;
            }
            case 5:
            {
                _position.BandVer = _params[_cursor.pos++];
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
    return _position;
}
function asc_menu_WriteTableLook(_type, _look, _stream)
{
    if (!_look)
        return;

    _stream["WriteByte"](_type);

    if (_look.FirstCol !== undefined && _look.FirstCol !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteBool"](_look.FirstCol);
    }
    if (_look.FirstRow !== undefined && _look.FirstRow !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteBool"](_look.FirstRow);
    }
    if (_look.LastCol !== undefined && _look.LastCol !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteBool"](_look.LastCol);
    }
    if (_look.LastRow !== undefined && _look.LastRow !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteBool"](_look.LastRow);
    }
    if (_look.BandHor !== undefined && _look.BandHor !== null)
    {
        _stream["WriteByte"](4);
        _stream["WriteBool"](_look.BandHor);
    }
    if (_look.BandVer !== undefined && _look.BandVer !== null)
    {
        _stream["WriteByte"](5);
        _stream["WriteBool"](_look.BandVer);
    }

    _stream["WriteByte"](255);
}

function asc_menu_WriteTablePr(_tablePr, _stream)
{
    if (_tablePr.CanBeFlow !== undefined && _tablePr.CanBeFlow !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteBool"](_tablePr.CanBeFlow);
    }
    if (_tablePr.CellSelect !== undefined && _tablePr.CellSelect !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteBool"](_tablePr.CellSelect);
    }
    if (_tablePr.TableWidth !== undefined && _tablePr.TableWidth !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteDouble2"](_tablePr.TableWidth);
    }
    if (_tablePr.TableSpacing !== undefined && _tablePr.TableSpacing !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteDouble2"](_tablePr.TableSpacing);
    }

    asc_menu_WritePaddings(4, _tablePr.TableDefaultMargins, _stream);
    asc_menu_WriteCellMargins(5, _tablePr.CellMargins, _stream);

    if (_tablePr.TableAlignment !== undefined && _tablePr.TableAlignment !== null)
    {
        _stream["WriteByte"](6);
        _stream["WriteLong"](_tablePr.TableAlignment);
    }
    if (_tablePr.TableIndent !== undefined && _tablePr.TableIndent !== null)
    {
        _stream["WriteByte"](7);
        _stream["WriteDouble2"](_tablePr.TableIndent);
    }
    if (_tablePr.TableWrappingStyle !== undefined && _tablePr.TableWrappingStyle !== null)
    {
        _stream["WriteByte"](8);
        _stream["WriteLong"](_tablePr.TableWrappingStyle);
    }

    asc_menu_WritePaddings(9, _tablePr.TablePaddings, _stream);

    asc_menu_WriteCellBorders(10, _tablePr.TableBorders, _stream);
    asc_menu_WriteCellBorders(11, _tablePr.CellBorders, _stream);

    asc_menu_WriteCellBackground(12, _tablePr.TableBackground, _stream);
    asc_menu_WriteCellBackground(13, _tablePr.CellsBackground, _stream);

    asc_menu_WritePosition(14, _tablePr.Position, _stream);
    asc_menu_WriteImagePosition(15, _tablePr.PositionH, _stream);
    asc_menu_WriteImagePosition(16, _tablePr.PositionV, _stream);

    asc_menu_WriteTableAnchorPosition(17, _tablePr.Internal_Position, _stream);

    if (_tablePr.ForSelectedCells !== undefined && _tablePr.ForSelectedCells !== null)
    {
        _stream["WriteByte"](18);
        _stream["WriteBool"](_tablePr.ForSelectedCells);
    }
    if (_tablePr.TableStyle !== undefined && _tablePr.TableStyle !== null)
    {
        _stream["WriteByte"](19);
        _stream["WriteString2"](_tablePr.TableStyle);
    }

    asc_menu_WriteTableLook(20, _tablePr.TableLook, _stream);

    if (_tablePr.RowsInHeader !== undefined && _tablePr.RowsInHeader !== null)
    {
        _stream["WriteByte"](21);
        _stream["WriteLong"](_tablePr.RowsInHeader);
    }
    if (_tablePr.CellsVAlign !== undefined && _tablePr.CellsVAlign !== null)
    {
        _stream["WriteByte"](22);
        _stream["WriteLong"](_tablePr.CellsVAlign);
    }
    if (_tablePr.AllowOverlap !== undefined && _tablePr.AllowOverlap !== null)
    {
        _stream["WriteByte"](23);
        _stream["WriteBool"](_tablePr.AllowOverlap);
    }
    if (_tablePr.TableLayout !== undefined && _tablePr.TableLayout !== null)
    {
        _stream["WriteByte"](24);
        _stream["WriteLong"](_tablePr.TableLayout);
    }
    if (_tablePr.Locked !== undefined && _tablePr.Locked !== null)
    {
        _stream["WriteByte"](25);
        _stream["WriteBool"](_tablePr.Locked);
    }

    _stream["WriteByte"](255);
};

function asc_menu_ReadShapePr(_params, _cursor)
{
    var _settings = new Asc.asc_CShapeProperty();

    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _settings.type = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _settings.fill = asc_menu_ReadAscFill(_params, _cursor);
                break;
            }
            case 2:
            {
                _settings.stroke = asc_menu_ReadAscStroke(_params, _cursor);
                break;
            }
            case 3:
            {
                _settings.paddings = asc_menu_ReadPaddings(_params, _cursor);
                break;
            }
            case 4:
            {
                _settings.canFill = _params[_cursor.pos++];
                break;
            }
            case 5:
            {
                _settings.bFromChart = _params[_cursor.pos++];
                break;
            }
            case 6:
            {
                _settings.InsertPageNum = _params[_cursor.pos++];
            }
            case 255:
            default:
            {
                _continue = false;
                break;
            }
        }
    }

    return _settings;
};

function asc_menu_WriteShapePr(_type, _shapePr, _stream) {
    if (!_shapePr)
        return;

    if (_type !== undefined) {
        _stream["WriteByte"](_type);
    }

    if (_shapePr.type !== undefined && _shapePr.type !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteString2"](_shapePr.type);
    }

    asc_menu_WriteAscFill(1, _shapePr.fill, _stream);
    asc_menu_WriteAscStroke(2, _shapePr.stroke, _stream);
    asc_menu_WritePaddings(3, _shapePr.paddings, _stream);

    if (_shapePr.canFill !== undefined && _shapePr.canFill !== null)
    {
        _stream["WriteByte"](4);
        _stream["WriteBool"](_shapePr.canFill);
    }
    if (_shapePr.bFromChart !== undefined && _shapePr.bFromChart !== null)
    {
        _stream["WriteByte"](5);
        _stream["WriteBool"](_shapePr.bFromChart);
    }

    _stream["WriteByte"](255);
};

function asc_menu_WriteImagePr(_imagePr, _stream){
    if (_imagePr.CanBeFlow !== undefined && _imagePr.CanBeFlow !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteBool"](_imagePr.CanBeFlow);
    }
    if (_imagePr.Width !== undefined && _imagePr.Width !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteDouble2"](_imagePr.Width);
    }
    if (_imagePr.Height !== undefined && _imagePr.Height !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteDouble2"](_imagePr.Height);
    }
    if (_imagePr.WrappingStyle !== undefined && _imagePr.WrappingStyle !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteLong"](_imagePr.WrappingStyle);
    }

    asc_menu_WritePaddings(4, _imagePr.Paddings, _stream);
    asc_menu_WritePosition(5, _imagePr.Position, _stream);

    if (_imagePr.AllowOverlap !== undefined && _imagePr.AllowOverlap !== null)
    {
        _stream["WriteByte"](6);
        _stream["WriteBool"](_imagePr.AllowOverlap);
    }

    asc_menu_WriteImagePosition(7, _imagePr.PositionH, _stream);
    asc_menu_WriteImagePosition(8, _imagePr.PositionV, _stream);

    if (_imagePr.Internal_Position !== undefined && _imagePr.Internal_Position !== null)
    {
        _stream["WriteByte"](9);
        _stream["WriteLong"](_imagePr.Internal_Position);
    }

    if (_imagePr.ImageUrl !== undefined && _imagePr.ImageUrl !== null)
    {
        _stream["WriteByte"](10);
        _stream["WriteString2"](_imagePr.ImageUrl);
    }

    if (_imagePr.Locked !== undefined && _imagePr.Locked !== null)
    {
        _stream["WriteByte"](11);
        _stream["WriteBool"](_imagePr.Locked);
    }

    asc_menu_WriteChartPr(12, _imagePr.ChartProperties, _stream);
    asc_menu_WriteShapePr(13, _imagePr.ShapeProperties, _stream);

    if (_imagePr.ChangeLevel !== undefined && _imagePr.ChangeLevel !== null)
    {
        _stream["WriteByte"](14);
        _stream["WriteLong"](_imagePr.ChangeLevel);
    }

    if (_imagePr.Group !== undefined && _imagePr.Group !== null)
    {
        _stream["WriteByte"](15);
        _stream["WriteLong"](_imagePr.Group);
    }

    if (_imagePr.fromGroup !== undefined && _imagePr.fromGroup !== null)
    {
        _stream["WriteByte"](16);
        _stream["WriteBool"](_imagePr.fromGroup);
    }
    if (_imagePr.severalCharts !== undefined && _imagePr.severalCharts !== null)
    {
        _stream["WriteByte"](17);
        _stream["WriteBool"](_imagePr.severalCharts);
    }

    if (_imagePr.severalChartTypes !== undefined && _imagePr.severalChartTypes !== null)
    {
        _stream["WriteByte"](18);
        _stream["WriteLong"](_imagePr.severalChartTypes);
    }
    if (_imagePr.severalChartStyles !== undefined && _imagePr.severalChartStyles !== null)
    {
        _stream["WriteByte"](19);
        _stream["WriteLong"](_imagePr.severalChartStyles);
    }
    if (_imagePr.verticalTextAlign !== undefined && _imagePr.verticalTextAlign !== null)
    {
        _stream["WriteByte"](20);
        _stream["WriteLong"](_imagePr.verticalTextAlign);
    }

    _stream["WriteByte"](255);
};

function asc_menu_WriteSlidePr(_slidePr, _stream){
    asc_menu_WriteAscFill(0, _slidePr.Background, _stream);
    asc_menu_WriteTiming(1, _slidePr.Timing, _stream);
    if(AscFormat.isRealNumber(_slidePr.LayoutIndex)){
        _stream["WriteByte"](2);
        _stream["WriteLong"](_slidePr.LayoutIndex);
    }
    if(AscFormat.isRealBool(_slidePr.isHidden)){
        _stream["WriteByte"](3);
        _stream["WriteBool"](_slidePr.isHidden);
    }
    if(AscFormat.isRealBool(_slidePr.lockBackground)){
        _stream["WriteByte"](4);
        _stream["WriteBool"](_slidePr.lockBackground);
    }
    if(AscFormat.isRealBool(_slidePr.lockDelete)){
        _stream["WriteByte"](5);
        _stream["WriteBool"](_slidePr.lockDelete);
    }
    if(AscFormat.isRealBool(_slidePr.lockLayout)){
        _stream["WriteByte"](6);
        _stream["WriteBool"](_slidePr.lockLayout);
    }
    if(AscFormat.isRealBool(_slidePr.lockRemove)){
        _stream["WriteByte"](7);
        _stream["WriteBool"](_slidePr.lockRemove);
    }
    if(AscFormat.isRealBool(_slidePr.lockTiming)){
        _stream["WriteByte"](8);
        _stream["WriteBool"](_slidePr.lockTiming);
    }
    if(AscFormat.isRealBool(_slidePr.lockTranzition)){
        _stream["WriteByte"](9);
        _stream["WriteBool"](_slidePr.lockTranzition);
    }
    _stream["WriteByte"](255);
}

function asc_menu_ReadSlidePr(_params, _cursor){
    var _settings = new Asc.CAscSlideProps();

    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _settings.Background = asc_menu_ReadAscFill(_params, _cursor);
                break;
            }
            case 1:
            {
                _settings.Timing = asc_menu_ReadTiming(_params, _cursor);
                break;
            }
            case 2:
            {
                _settings.LayoutIndex = _params[_cursor.pos++];
                break;
            }
            case 3:
            {
                _settings.isHidden = _params[_cursor.pos++];
                break;
            }
            case 4:
            {
                _settings.lockBackground = _params[_cursor.pos++];
                break;
            }
            case 5:
            {
                _settings.lockDelete = _params[_cursor.pos++];
                break;
            }
            case 6:
            {
                _settings.lockLayout = _params[_cursor.pos++];
                break;
            }
            case 7:
            {
                _settings.lockRemove = _params[_cursor.pos++];
                break;
            }
            case 8:
            {
                _settings.lockTiming = _params[_cursor.pos++];
                break;
            }
            case 9:
            {
                _settings.lockTranzition = _params[_cursor.pos++];
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
    return _settings;
}

function asc_menu_WriteTiming(type, _timing, _stream){

    _stream["WriteByte"](type);
    if(AscFormat.isRealNumber(_timing.TransitionType)){
        _stream["WriteByte"](0);
        _stream["WriteLong"](_timing.TransitionType);
    }
    if(AscFormat.isRealNumber(_timing.TransitionOption)){
        _stream["WriteByte"](1);
        _stream["WriteLong"](_timing.TransitionOption);
    }
    if(AscFormat.isRealNumber(_timing.TransitionDuration)){
        _stream["WriteByte"](2);
        _stream["WriteLong"](_timing.TransitionDuration);
    }
    if(AscFormat.isRealBool(_timing.SlideAdvanceOnMouseClick)){
        _stream["WriteByte"](3);
        _stream["WriteBool"](_timing.SlideAdvanceOnMouseClick);
    }
    if(AscFormat.isRealBool(_timing.SlideAdvanceAfter)){
        _stream["WriteByte"](4);
        _stream["WriteBool"](_timing.SlideAdvanceAfter);
    }
    if(AscFormat.isRealBool(_timing.ShowLoop)){
        _stream["WriteByte"](5);
        _stream["WriteBool"](_timing.ShowLoop);
    }
    if(AscFormat.isRealNumber(_timing.SlideAdvanceDuration)){
        _stream["WriteByte"](6);
        _stream["WriteLong"](_timing.SlideAdvanceDuration);
    }

    _stream["WriteByte"](255);
}

function asc_menu_ReadTiming(_params, _cursor)
{
    var _settings = new Asc.CAscSlideTiming();

    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _settings.TransitionType = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _settings.TransitionOption = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _settings.TransitionDuration = _params[_cursor.pos++];
                break;
            }
            case 3:
            {
                _settings.SlideAdvanceOnMouseClick = _params[_cursor.pos++];
                break;
            }
            case 4:
            {
                _settings.SlideAdvanceAfter = _params[_cursor.pos++];
                break;
            }
            case 5:
            {
                _settings.ShowLoop = _params[_cursor.pos++];
                break;
            }
            case 6:
            {
                _settings.SlideAdvanceDuration = _params[_cursor.pos++];
            }
            case 255:
            default:
            {
                _continue = false;
                break;
            }
        }
    }

    return _settings;
};

function asc_menu_ReadParaListType(_params, _cursor)
{
    var _list = new AscCommon.asc_CListType();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _list.Type = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _list.SubType = _params[_cursor.pos++];
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
    return _list;
}

function asc_menu_ReadHyperPr(_params, _cursor)
{
    var _settings = new Asc.CHyperlinkProperty();

    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _settings.Text = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _settings.Value = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _settings.ToolTip = _params[_cursor.pos++];
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

    return _settings;
};

function asc_menu_WriteHyperPr(_hyperPr, _stream)
{
    if (_hyperPr.Text !== undefined && _hyperPr.Text !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteString2"](_hyperPr.Text);
    }

    if (_hyperPr.Value !== undefined && _hyperPr.Value !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteString2"](_hyperPr.Value);
    }

    if (_hyperPr.ToolTip !== undefined && _hyperPr.ToolTip !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteString2"](_hyperPr.ToolTip);
    }

    _stream["WriteByte"](255);
};

function asc_menu_WriteMath(oMath, s){
    s["WriteLong"](oMath.Type);
    s["WriteLong"](oMath.Action);
    s["WriteBool"](oMath.CanIncreaseArgumentSize);
    s["WriteBool"](oMath.CanDecreaseArgumentSize);
    s["WriteBool"](oMath.CanInsertForcedBreak);
    s["WriteBool"](oMath.CanDeleteForcedBreak);
    s["WriteBool"](oMath.CanAlignToCharacter);
}

function initSpellCheckApi() {
    
    _api.SpellCheckApi = new AscCommon.CSpellCheckApi();
    _api.isSpellCheckEnable = true;

    _api.SpellCheckApi.spellCheck = function (spellData) {
        window["native"]["SpellCheck"](JSON.stringify(spellData));
    };
    
    _api.SpellCheckApi.disconnect = function () {};

    _api.sendEvent('asc_onSpellCheckInit', [
        "1026",
        "1027",
        "1029",
        "1030",
        "1031",
        "1032",
        "1033",
        "1036",
        "1038",
        "1040",
        "1042",
        "1043",
        "1044",
        "1045",
        "1046",
        "1048",
        "1049",
        "1050",
        "1051",
        "1053",
        "1055",
        "1057",
        "1058",
        "1060",
        "1062",
        "1063",
        "1066",
        "1068",
        "1069",
        "1087",
        "1104",
        "1110",
        "1134",
        "2051",
        "2055",
        "2057",
        "2068",
        "2070",
        "3079",
        "3081",
        "3082",
        "4105",
        "7177",
        "9242",
        "10266"
    ]);

    _api.SpellCheckApi.onInit = function (e) {
        _api.sendEvent('asc_onSpellCheckInit', e);
    };

    _api.SpellCheckApi.onSpellCheck = function (e) {
        _api.SpellCheck_CallBack(e);
    };

    _api.SpellCheckApi.init(_api.documentId);

    _api.asc_setSpellCheck(spellCheck);

}

function NativeOpenFileP(_params, documentInfo){
    window["CreateMainTextMeasurerWrapper"]();
    window.g_file_path = "native_open_file";
    window.NATIVE_DOCUMENT_TYPE = window["native"]["GetEditorType"]();
    var doc_bin = window["native"]["GetFileString"](window.g_file_path);
    if ("presentation" !== window.NATIVE_DOCUMENT_TYPE){
        return;
    }

    sdkCheck = documentInfo["sdkCheck"];
    spellCheck = documentInfo["spellCheck"];

    var translations = documentInfo["translations"];
    if (undefined != translations && null != translations && translations.length > 0) {
        translations = JSON.parse(translations)
    } else {
        translations = "";
    }

    window["_api"] = window["API"] = _api = new window["Asc"]["asc_docs_api"](translations);
    window["_editor"] = window.editor;

    AscCommon.g_clipboardBase.Init(_api);
    _api["Native_Editor_Initialize_Settings"](_params);
    window.documentInfo = documentInfo;
    var userInfo = new Asc.asc_CUserInfo();
    userInfo.asc_putId(window.documentInfo["docUserId"]);
    userInfo.asc_putFullName(window.documentInfo["docUserName"]);
    userInfo.asc_putFirstName(window.documentInfo["docUserFirstName"]);
    userInfo.asc_putLastName(window.documentInfo["docUserLastName"]);

    var docInfo = new Asc.asc_CDocInfo();
    docInfo.put_Id(window.documentInfo["docKey"]);
    docInfo.put_Url(window.documentInfo["docURL"]);
    docInfo.put_Format("pptx");
    docInfo.put_UserInfo(userInfo);
    docInfo.put_Token(window.documentInfo["token"]);

    var permissions = window.documentInfo["permissions"];
    if (undefined != permissions && null != permissions && permissions.length > 0) {
        docInfo.put_Permissions(JSON.parse(permissions));
    }
    _api.asc_setDocInfo(docInfo);
    
    _api.asc_registerCallback("asc_onAdvancedOptions", function(type, options) {
        var stream = global_memory_stream_menu;
        if (options === undefined) {
            options = {};
        }
        options["optionId"] = type;
        stream["ClearNoAttack"]();
        stream["WriteString2"](JSON.stringify(options));
        window["native"]["OnCallMenuEvent"](22000, stream); // ASC_MENU_EVENT_TYPE_ADVANCED_OPTIONS
    });
    
    _api.asc_registerCallback("asc_onSendThemeColorSchemes", function(schemes) {
        var stream = global_memory_stream_menu;
        stream["ClearNoAttack"]();
        asc_WriteColorSchemes(schemes, stream);
        window["native"]["OnCallMenuEvent"](2404, stream); // ASC_SPREADSHEETS_EVENT_TYPE_COLOR_SCHEMES
    });

    _api.asc_registerCallback("asc_onUpdateThemeIndex", function(nIndex) {
        var stream = global_memory_stream_menu;
        stream["ClearNoAttack"]();
        stream["WriteLong"](nIndex);
        window["native"]["OnCallMenuEvent"](8093, stream); // ASC_PRESENTATIONS_EVENT_TYPE_THEME_INDEX
    });


    if (window.documentInfo["iscoauthoring"]) {
        _api.isSpellCheckEnable = false;
        _api.asc_setAutoSaveGap(1);
        _api._coAuthoringInit();
        _api.asc_SetFastCollaborative(true);
        _api.SetCollaborativeMarksShowType(Asc.c_oAscCollaborativeMarksShowType.None);
        window["native"]["onTokenJWT"](_api.CoAuthoringApi.get_jwt());

        _api.asc_registerCallback("asc_onAuthParticipantsChanged", function(users) {
            var stream = global_memory_stream_menu;
            stream["ClearNoAttack"]();
            asc_WriteUsers(users, stream);
            window["native"]["OnCallMenuEvent"](20101, stream); // ASC_COAUTH_EVENT_TYPE_PARTICIPANTS_CHANGED
        });

        _api.asc_registerCallback("asc_onParticipantsChanged", function(users) {
            var stream = global_memory_stream_menu;
            stream["ClearNoAttack"]();
            asc_WriteUsers(users, stream);
            window["native"]["OnCallMenuEvent"](20101, stream); // ASC_COAUTH_EVENT_TYPE_PARTICIPANTS_CHANGED
        });

        _api.asc_registerCallback("asc_onGetEditorPermissions", function(state) {

            var rData = {
                "c"             : "open",
                "id"            : window.documentInfo["docKey"],
                "userid"        : window.documentInfo["docUserId"],
                "format"        : "pptx",
                "vkey"          : undefined,
                "url"           : window.documentInfo["docURL"],
                "title"         : this.documentTitle,
                "nobase64"      : true};

            _api.CoAuthoringApi.auth(window.documentInfo["viewmode"], rData);
        });

        _api.asc_registerCallback("asc_onDocumentUpdateVersion", function(callback) {
            var me = this;
            me.needToUpdateVersion = true;
            if (callback) callback.call(me);
        });
    } else {
        _api["asc_nativeOpenFile"](doc_bin);
        _api.documentId = "1";
        _api.WordControl.m_oDrawingDocument.AfterLoad();
        window["_api"] = window["API"] = Api = _api;
        window["_editor"] = window.editor;
        if (window.documentInfo["viewmode"]) {
            _api.ShowParaMarks = false;
            AscCommon.CollaborativeEditing.Set_GlobalLock(true);
            _api.isViewMode = true;
            _api.WordControl.m_oDrawingDocument.IsViewMode = true;
          }
        var _presentation = _api.WordControl.m_oLogicDocument;

        var nSlidesCount = _presentation.Slides.length;
        var dPresentationWidth = _presentation.Width;
        var dPresentationHeight = _presentation.Height;

        var aTimings = [];
        var slides = _presentation.Slides;
        // for(var i = 0; i < slides.length; ++i){
        //     aTimings.push(slides[i].timing.ToArray());
        // }

        _api.asc_GetDefaultTableStyles();
	    _presentation.Recalculate({Drawings:{All:true, Map:{}}});
	    _presentation.CurPage = Math.min(0, _presentation.Slides.length - 1);
        _presentation.Document_UpdateInterfaceState();
        _presentation.DrawingDocument.CheckThemes();
        _api.WordControl.CheckLayouts();

        initSpellCheckApi();

        return [nSlidesCount, dPresentationWidth, dPresentationHeight, aTimings];
    }
}

Asc['asc_docs_api'].prototype.UpdateTextPr = function(TextPr)
{
    if (!TextPr)
        return;

    var _stream = global_memory_stream_menu;
    _stream["ClearNoAttack"]();

    if (TextPr.Bold !== undefined)
    {
        _stream["WriteByte"](0);
        _stream["WriteBool"](TextPr.Bold);
    }
    if (TextPr.Italic !== undefined)
    {
        _stream["WriteByte"](1);
        _stream["WriteBool"](TextPr.Italic);
    }
    if (TextPr.Underline !== undefined)
    {
        _stream["WriteByte"](2);
        _stream["WriteBool"](TextPr.Underline);
    }
    if (TextPr.Strikeout !== undefined)
    {
        _stream["WriteByte"](3);
        _stream["WriteBool"](TextPr.Strikeout);
    }

    asc_menu_WriteFontFamily(4, TextPr.FontFamily, _stream);

    if (TextPr.FontSize !== undefined)
    {
        _stream["WriteByte"](5);
        _stream["WriteDouble2"](TextPr.FontSize);
    }

    if(TextPr.Unifill && TextPr.Unifill.fill && TextPr.Unifill.fill.type === Asc.c_oAscFill.FILL_TYPE_SOLID && TextPr.Unifill.fill.color)
    {
        var _color = AscCommon.CreateAscColor(TextPr.Unifill.fill.color);
        asc_menu_WriteColor(6, AscCommon.CreateAscColorCustom(_color.r, _color.g, _color.b, false), _stream);
    }
    else if (TextPr.Color !== undefined)
    {
        asc_menu_WriteColor(6, AscCommon.CreateAscColorCustom(TextPr.Color.r, TextPr.Color.g, TextPr.Color.b, TextPr.Color.Auto), _stream);
    }

    if (TextPr.VertAlign !== undefined)
    {
        _stream["WriteByte"](7);
        _stream["WriteLong"](TextPr.VertAlign);
    }

    if (TextPr.HighLight !== undefined)
    {
        if (TextPr.HighLight === AscCommonWord.highlight_None)
        {
            _stream["WriteByte"](12);
        }
        else
        {
            asc_menu_WriteColor(8, AscCommon.CreateAscColorCustom(TextPr.HighLight.r, TextPr.HighLight.g, TextPr.HighLight.b), _stream);
        }
    }

    if (TextPr.DStrikeout !== undefined)
    {
        _stream["WriteByte"](9);
        _stream["WriteBool"](TextPr.DStrikeout);
    }
    if (TextPr.Caps !== undefined)
    {
        _stream["WriteByte"](10);
        _stream["WriteBool"](TextPr.Caps);
    }
    if (TextPr.SmallCaps !== undefined)
    {
        _stream["WriteByte"](11);
        _stream["WriteBool"](TextPr.SmallCaps);
    }
    if (TextPr.Spacing !== undefined)
    {
        _stream["WriteByte"](13);
        _stream["WriteDouble2"](TextPr.Spacing);
    }

    _stream["WriteByte"](255);

    window["native"]["OnCallMenuEvent"](1, _stream);
};

Asc['asc_docs_api'].prototype["Native_Editor_Initialize_Settings"] = function(_params)
{
    window["NativeSupportTimeouts"] = true;

    if (!_params)
        return;

    var _current = { pos : 0 };
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_current.pos++];
        switch (_attr)
        {
            case 0:
            {
                AscCommonSlide.GlobalSkin.STYLE_THUMBNAIL_WIDTH = _params[_current.pos++];
                break;
            }
            case 1:
            {
                AscCommonSlide.GlobalSkin.STYLE_THUMBNAIL_HEIGHT = _params[_current.pos++];
                break;
            }
            case 2:
            {
                TABLE_STYLE_WIDTH_PIX = _params[_current.pos++];
                break;
            }
            case 3:
            {
                TABLE_STYLE_HEIGHT_PIX = _params[_current.pos++];
                break;
            }
            case 4:
            {
                this.chartPreviewManager.CHART_PREVIEW_WIDTH_PIX = _params[_current.pos++];
                break;
            }
            case 5:
            {
                this.chartPreviewManager.CHART_PREVIEW_HEIGHT_PIX = _params[_current.pos++];
                break;
            }
            case 6:
            {
                var _val = _params[_current.pos++];
                if (_val === true)
                {
                    this.ShowParaMarks = false;
                    AscCommon.CollaborativeEditing.Set_GlobalLock(true);

                    this.isViewMode = true;
                    this.WordControl.m_oDrawingDocument.IsViewMode = true;
                }
                break;
            }
            case 100:
            {
                this.WordControl.m_oDrawingDocument.IsRetina = _params[_current.pos++];
                break;
            }
            case 101:
            {
                this.WordControl.m_oDrawingDocument.IsMobile = _params[_current.pos++];
                window.AscAlwaysSaveAspectOnResizeTrack = true;
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

    AscCommon.AscBrowser.isRetina = this.WordControl.m_oDrawingDocument.IsRetina;
};


Asc['asc_docs_api'].prototype["CheckSlideBounds"] = function(nSlideIndex){
    var oBoundsChecker = new AscFormat.CSlideBoundsChecker();
    this.WordControl.m_oLogicDocument.Draw(nSlideIndex, oBoundsChecker);
    var oBounds = oBoundsChecker.Bounds;
    return [
        oBounds.min_x, oBounds.max_x, oBounds.min_y, oBounds.max_y
    ]
}

Asc['asc_docs_api'].prototype["GetNativePageMeta"] = function(pageIndex, bTh, bIsPlayMode)
{
    this.WordControl.m_oDrawingDocument.RenderPage(pageIndex, bTh, bIsPlayMode);
};


window["asc_docs_api"].prototype["asc_nativeOpenFile2"] = function(base64File, version)
{
    this.SpellCheckUrl = '';

    this.WordControl.m_bIsRuler = false;
    this.WordControl.Init();

    this.InitEditor();

    this.DocumentType   = 2;

    AscCommon.g_oIdCounter.Set_Load(true);

    var _loader = new AscCommon.BinaryPPTYLoader();
    _loader.Api = this;

    _loader.Load(base64File, this.WordControl.m_oLogicDocument);
    _loader.Check_TextFit();
    this.LoadedObject = 1;
    AscCommon.g_oIdCounter.Set_Load(false);
};

Asc['asc_docs_api'].prototype.openDocument = function(file)
{
    _api.asc_nativeOpenFile2(file.data);


    var _presentation = _api.WordControl.m_oLogicDocument;

    var nSlidesCount = _presentation.Slides.length;
    var dPresentationWidth = _presentation.Width;
    var dPresentationHeight = _presentation.Height;

    var aTimings = [];
    var slides = _presentation.Slides;
    // for(var i = 0; i < slides.length; ++i){
    //     aTimings.push(slides[i].timing.ToArray());
    // }
    var _result =  [nSlidesCount, dPresentationWidth, dPresentationHeight, aTimings];
    var oTheme = null;

    if (null != slides[0])
    {
        oTheme = slides[0].getTheme();
    }
    if (false) {

        this.WordControl.m_oDrawingDocument.AfterLoad();

        
        this.ImageLoader.bIsLoadDocumentFirst = true;

        if (oTheme)
        {
            _api.sendColorThemes(oTheme);
        }

        window["native"]["onEndLoadingFile"](_result);
        this.asc_nativeCalculateFile();

        return;
    }

    this.WordControl.m_oDrawingDocument.AfterLoad();

    //console.log("ImageMap : " + JSON.stringify(this.WordControl.m_oLogicDocument));

    this.ImageLoader.bIsLoadDocumentFirst = true;
    this.ImageLoader.LoadDocumentImages(this.WordControl.m_oLogicDocument.ImageMap);

    this.WordControl.m_oLogicDocument.Continue_FastCollaborativeEditing();

    //this.asyncFontsDocumentEndLoaded();
    //
    // if (oTheme)
    // {
    //     _api.sendColorThemes(oTheme);
    // }

    window["native"]["onEndLoadingFile"](_result);
    this.asc_nativeCalculateFile();

    this.WordControl.m_oDrawingDocument.Collaborative_TargetsUpdate(true);

    _api.asc_GetDefaultTableStyles();

    initSpellCheckApi();

    var t = this;
    setInterval(function() {
        t._autoSave();
    }, 40);
};


Asc['asc_docs_api'].prototype.Update_ParaInd = function( Ind )
{
   // this.WordControl.m_oDrawingDocument.Update_ParaInd(Ind);
};

Asc['asc_docs_api'].prototype.Internal_Update_Ind_Left = function(Left)
{
};

Asc['asc_docs_api'].prototype.Internal_Update_Ind_Right = function(Right)
{
};

Asc['asc_docs_api'].prototype.IsAsyncOpenDocumentImages = function()
{
    return true;
};

Asc['asc_docs_api'].prototype.asyncImageEndLoadedBackground = function(_image)
{
};



/***************************** COPY|PASTE *******************************/

Asc['asc_docs_api'].prototype.Call_Menu_Context_Copy = function()
{
    var dataBuffer = {};

    var clipboard = {};
    clipboard.pushData = function(type, data) {

        if (AscCommon.c_oAscClipboardDataFormat.Text === type) {

            dataBuffer.text = data;

        } else if (AscCommon.c_oAscClipboardDataFormat.Internal === type) {

            if (null != data.drawingUrls && data.drawingUrls.length > 0) {
                dataBuffer.drawingUrls = data.drawingUrls[0];
            }

            dataBuffer.sBase64 = data;
        }
    };

    this.asc_CheckCopy(clipboard, AscCommon.c_oAscClipboardDataFormat.Internal|AscCommon.c_oAscClipboardDataFormat.Text);

    var _stream = global_memory_stream_menu;
    _stream["ClearNoAttack"]();

    if (dataBuffer.text) {
        _stream["WriteByte"](0);
        _stream["WriteString2"](dataBuffer.text);
    }

    if (dataBuffer.drawingUrls) {
        _stream["WriteByte"](1);
        _stream["WriteStringA"](dataBuffer.drawingUrls);
    }

    if (dataBuffer.sBase64) {
        _stream["WriteByte"](2);
        _stream["WriteStringA"](dataBuffer.sBase64);
    }

    _stream["WriteByte"](255);

    return _stream;
};
Asc['asc_docs_api'].prototype.Call_Menu_Context_Cut = function()
{
    var dataBuffer = {};

    var clipboard = {};
    clipboard.pushData = function(type, data) {

        if (AscCommon.c_oAscClipboardDataFormat.Text === type) {

            dataBuffer.text = data;

        } else if (AscCommon.c_oAscClipboardDataFormat.Internal === type) {

            if (null != data.drawingUrls && data.drawingUrls.length > 0) {
                dataBuffer.drawingUrls = data.drawingUrls[0];
            }

            dataBuffer.sBase64 = data;
        }
    }

    this.asc_CheckCopy(clipboard, AscCommon.c_oAscClipboardDataFormat.Internal|AscCommon.c_oAscClipboardDataFormat.Text);

    this.asc_SelectionCut();

    var _stream = global_memory_stream_menu;
    _stream["ClearNoAttack"]();

    if (dataBuffer.text) {
        _stream["WriteByte"](0);
        _stream["WriteString2"](dataBuffer.text);
    }

    if (dataBuffer.drawingUrls) {
        _stream["WriteByte"](1);
        _stream["WriteStringA"](dataBuffer.drawingUrls);
    }

    if (dataBuffer.sBase64) {
        _stream["WriteByte"](2);
        _stream["WriteStringA"](dataBuffer.sBase64);
    }

    _stream["WriteByte"](255);

    return _stream;
};

Asc['asc_docs_api'].prototype.Call_Menu_Context_Paste = function(type, param)
{
    if (0 == type)
    {
        this.asc_PasteData(AscCommon.c_oAscClipboardDataFormat.Text, param);
    }
    else if (1 == type)
    {
        this.AddImageUrlNative(param, 200, 200);
    }
    else if (2 == type)
    {
        this.asc_PasteData(AscCommon.c_oAscClipboardDataFormat.Internal, param);
    }
};

Asc['asc_docs_api'].prototype.Call_Menu_Context_Select = function()
{
    this.WordControl.m_oLogicDocument.MoveCursorLeft(false, true);
    this.WordControl.m_oLogicDocument.MoveCursorRight(true, true);
    this.WordControl.m_oLogicDocument.Document_UpdateSelectionState();
};

Asc['asc_docs_api'].prototype.Call_Menu_Context_Delete = function()
{
    this.WordControl.m_oLogicDocument.Remove(-1);
};

Asc['asc_docs_api'].prototype.Call_Menu_Context_SelectAll = function()
{
    this.WordControl.m_oLogicDocument.SelectAll();
};

Asc['asc_docs_api'].prototype.asc_setDocumentPassword = function(password)
{
    var v = {
        "id": this.documentId,
        "userid": this.documentUserId,
        "format": this.documentFormat,
        "c": "reopen",
        "title": this.documentTitle,
        "password": password
    };

    AscCommon.sendCommand(this, null, v);
};

Asc["asc_docs_api"].prototype["asc_nativeGetFileData"] = function()
{
    var oBinaryFileWriter = new AscCommon.CBinaryFileWriter();
    this.WordControl.m_oLogicDocument.CalculateComments();
    oBinaryFileWriter.WriteDocument3(this.WordControl.m_oLogicDocument);

    window["native"]["GetFileData"](oBinaryFileWriter.ImData.data, oBinaryFileWriter.GetCurPosition());

    return true;
};

Asc['asc_docs_api'].prototype.asc_setSpellCheck = function(isOn)
{
    if (editor.WordControl.m_oLogicDocument)
    {
        var _presentation = editor.WordControl.m_oLogicDocument;
        _presentation.Spelling.Use = isOn;
        var _drawing_document = editor.WordControl.m_oDrawingDocument;
        if(isOn)
        {
            this.spellCheckTimerId = setInterval(function(){_presentation.ContinueCheckSpelling();}, 500);
        }
        else
        {
            if(this.spellCheckTimerId)
            {
               clearInterval(this.spellCheckTimerId);
            }
        }
        var oCurSlide = _presentation.Slides[_presentation.CurPage];

        if(oCurSlide)
        {
            _drawing_document.OnStartRecalculate(_presentation.Slides.length);
            _drawing_document.OnRecalculatePage(_presentation.CurPage, oCurSlide);
            _drawing_document.OnEndRecalculate();
        }
    }
};

if(!window.native){
	if(_private_NativeObject){
		window.native = _private_NativeObject();
	}	
}

if (window["native"]) {
	window["native"]["Call_CheckSlideBounds"] = function(nIndex){
        if (window.editor) {
            return window.editor["CheckSlideBounds"](nIndex);
        }
	};
	
	window["native"]["Call_GetPageMeta"] = function(nIndex, bTh, bIsPlayMode){
        if (window.editor) {
            return window.editor["GetNativePageMeta"](nIndex, bTh, bIsPlayMode);
        }
	};

    window["native"]["Call_OnMouseDown"] = function(e) {
        if (window.editor) {
          return window.editor.WordControl.m_oDrawingDocument.OnMouseDown(e);
        }
        return -1;
      };

    window["native"]["Call_OnMouseUp"] = function(e) {
        if(window.editor) {
            return window.editor.WordControl.m_oDrawingDocument.OnMouseUp(e);
        }

        return [];
    };

    window["native"]["Call_OnMouseMove"] = function(e) {
        if(window.editor) {
            window.editor.WordControl.m_oDrawingDocument.OnMouseMove(e);
        }
    };

    window["native"]["Call_OnKeyboardEvent"] = function(e) {
        return window.editor.WordControl.m_oDrawingDocument.OnKeyboardEvent(e);
    };

    window["native"]["Call_OnCheckMouseDown"] = function(e) {
        return window.editor.WordControl.m_oDrawingDocument.OnCheckMouseDown(e);
    };

    window["native"]["Call_ResetSelection"] = function() {
        window.editor.WordControl.m_oLogicDocument.RemoveSelection(false);
        window.editor.WordControl.m_oLogicDocument.Document_UpdateSelectionState();
        window.editor.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();
    };

    window["native"]["Call_OnUpdateOverlay"] = function(param) {
        if (window.editor) {
            window.editor.WordControl.OnUpdateOverlay(param);
        }
    };
    window["native"]["Call_SetCurrentPage"] = function(param){
        if (window.editor) {
            var oWC = window.editor.WordControl;
            oWC.m_oLogicDocument.Set_CurPage(param);
            if(oWC.m_oDrawingDocument)
            {
                oWC.m_oDrawingDocument.SlidesCount = oWC.m_oLogicDocument.Slides.length;
                oWC.m_oDrawingDocument.SlideCurrent = oWC.m_oLogicDocument.CurPage;
            }
            oWC.CheckLayouts(false);
        }
    };
}

window["native"]["Call_Menu_Event"] = function (type, _params)
{
    return _api["Call_Menu_Event"](type, _params);
};


window["AscCommon"] = window["AscCommon"] || {};
window["AscCommon"].sendImgUrls = function(api, images, callback)
{
	var _data = [];
	callback(_data);
};

window["native"]["offline_of"] = function(_params, documentInfo) { return NativeOpenFileP(_params, documentInfo); };

