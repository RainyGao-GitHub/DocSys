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

function asc_menu_ReadColor(_params, _cursor) {
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
function asc_menu_WriteColor(_type, _color, _stream) {
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

function asc_menu_WriteMath(oMath, s){
    s["WriteLong"](oMath.Type);
    s["WriteLong"](oMath.Action);
    s["WriteBool"](oMath.CanIncreaseArgumentSize);
    s["WriteBool"](oMath.CanDecreaseArgumentSize);
    s["WriteBool"](oMath.CanInsertForcedBreak);
    s["WriteBool"](oMath.CanDeleteForcedBreak);
    s["WriteBool"](oMath.CanAlignToCharacter);
}

function asc_menu_ReadFontFamily(_params, _cursor){
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
function asc_menu_WriteFontFamily(_type, _family, _stream) {
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
function asc_menu_ReadAscFill_solid(_params, _cursor){
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
}
function asc_menu_WriteAscFill_solid(_type, _fill, _stream){
    if (!_fill)
        return;
    
    _stream["WriteByte"](_type);
    
    asc_menu_WriteColor(0, _fill.color, _stream);
    
    _stream["WriteByte"](255);
}
function asc_menu_ReadAscFill_patt(_params, _cursor){
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
}
function asc_menu_WriteAscFill_patt(_type, _fill, _stream){
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
}
function asc_menu_ReadAscFill_grad(_params, _cursor){
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
}
function asc_menu_WriteAscFill_grad(_type, _fill, _stream){
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
}
function asc_menu_ReadAscFill_blip(_params, _cursor){
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
}
function asc_menu_WriteAscFill_blip(_type, _fill, _stream){
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
}
function asc_menu_ReadAscFill(_params, _cursor){
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
    
}
function asc_menu_WriteAscFill(_type, _fill, _stream){
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
}
function asc_menu_ReadAscStroke(_params, _cursor){
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
}
function asc_menu_WriteAscStroke(_type, _stroke, _stream){
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
    
}
function asc_menu_ReadPaddings(_params, _cursor){
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
}
function asc_menu_WritePaddings(_type, _paddings, _stream){
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
}
function asc_menu_ReadPosition(_params, _cursor){
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
function asc_menu_WritePosition(_type, _position, _stream){
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
function asc_menu_ReadImagePosition(_params, _cursor){
    var _position = new Asc.CPosition();
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _position.RelativeFrom = _params[_cursor.pos++];
                break;
            }
            case 1:
            {
                _position.UseAlign = _params[_cursor.pos++];
                break;
            }
            case 2:
            {
                _position.Align = _params[_cursor.pos++];
                break;
            }
            case 3:
            {
                _position.Value = _params[_cursor.pos++];
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
}
function asc_menu_ReadAscValAxisSettings(_params, _cursor){
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
}
function asc_menu_WriteAscValAxisSettings(_type, _settings, _stream){
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
}
function asc_menu_ReadAscCatAxisSettings(_params, _cursor){
    var _settings = new AscCommon.asc_CatAxisSettings();
    
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _settings.putInternalBetweenTick(_params[_cursor.pos++]);
                break;
            }
            case 1:
            {
                _settings.putIntervalBetweenLabelsRule(_params[_cursor.pos++]);
                break;
            }
            case 2:
            {
                _settings.putInternalBetweenLabels(_params[_cursor.pos++]);
                break;
            }
            case 3:
            {
                _settings.putInvertCatOrder(_params[_cursor.pos++]);
                break;
            }
            case 4:
            {
                _settings.putLabelsAxisDistance(_params[_cursor.pos++]);
                break;
            }
            case 5:
            {
                _settings.putLabelsPosition(_params[_cursor.pos++]);
                break;
            }
            case 6:
            {
                _settings.putMajorTickMark(_params[_cursor.pos++]);
                break;
            }
            case 7:
            {
                _settings.putMinorTickMark(_params[_cursor.pos++]);
                break;
            }
            case 8:
            {
                _settings.putTickLabelsPos(_params[_cursor.pos++]);
                break;
            }
            case 9:
            {
                _settings.putCrossesRule(_params[_cursor.pos++]);
                break;
            }
            case 10:
            {
                _settings.putCrosses(_params[_cursor.pos++]);
                break;
            }
            case 11:
            {
                _settings.putAxisType(_params[_cursor.pos++]);
                break;
            }
            case 12:
            {
                _settings.putCrossMinVal(_params[_cursor.pos++]);
                break;
            }
            case 13:
            {
                _settings.putCrossMaxVal(_params[_cursor.pos++]);
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
function asc_menu_WriteAscCatAxisSettings(_type, _settings, _stream){
    if (!_settings)
        return;
    
    _stream["WriteByte"](_type);
    
    if (_settings.getIntervalBetweenTick() !== undefined && _settings.getIntervalBetweenTick() !== null)
    {
        _stream["WriteByte"](0);
        _stream["WriteDouble2"](_settings.getIntervalBetweenTick());
    }
    if (_settings.getIntervalBetweenLabelsRule() !== undefined && _settings.getIntervalBetweenLabelsRule() !== null)
    {
        _stream["WriteByte"](1);
        _stream["WriteLong"](_settings.getIntervalBetweenLabelsRule());
    }
    if (_settings.getIntervalBetweenLabels() !== undefined && _settings.getIntervalBetweenLabels() !== null)
    {
        _stream["WriteByte"](2);
        _stream["WriteDouble2"](_settings.getIntervalBetweenLabels());
    }
    if (_settings.getInvertCatOrder() !== undefined && _settings.getInvertCatOrder() !== null)
    {
        _stream["WriteByte"](3);
        _stream["WriteBool"](_settings.getInvertCatOrder());
    }
    if (_settings.getLabelsAxisDistance() !== undefined && _settings.getLabelsAxisDistance() !== null)
    {
        _stream["WriteByte"](4);
        _stream["WriteDouble2"](_settings.getLabelsAxisDistance());
    }
    if (_settings.getTickLabelsPos() !== undefined && _settings.getTickLabelsPos() !== null)
    {
        _stream["WriteByte"](5);
        _stream["WriteLong"](_settings.getTickLabelsPos());
    }
    if (_settings.getMajorTickMark() !== undefined && _settings.getMajorTickMark() !== null)
    {
        _stream["WriteByte"](6);
        _stream["WriteLong"](_settings.getMajorTickMark());
    }
    if (_settings.getMinorTickMark() !== undefined && _settings.getMinorTickMark() !== null)
    {
        _stream["WriteByte"](7);
        _stream["WriteLong"](_settings.getMinorTickMark());
    }
    if (_settings.getTickLabelsPos() !== undefined && _settings.getTickLabelsPos() !== null)
    {
        _stream["WriteByte"](8);
        _stream["WriteLong"](_settings.getTickLabelsPos());
    }
    if (_settings.getCrossesRule() !== undefined && _settings.getCrossesRule() !== null)
    {
        _stream["WriteByte"](9);
        _stream["WriteLong"](_settings.getCrossesRule());
    }
    if (_settings.getCrosses() !== undefined && _settings.getCrosses() !== null)
    {
        _stream["WriteByte"](10);
        _stream["WriteLong"](_settings.getCrosses());
    }
    if (_settings.getAxisType() !== undefined && _settings.getAxisType() !== null)
    {
        _stream["WriteByte"](11);
        _stream["WriteLong"](_settings.getAxisType());
    }
    if (_settings.getCrossMinVal() !== undefined && _settings.getCrossMinVal() !== null)
    {
        _stream["WriteByte"](12);
        _stream["WriteLong"](_settings.getCrossMinVal());
    }
    if (_settings.getCrossMaxVal() !== undefined && _settings.getCrossMaxVal() !== null)
    {
        _stream["WriteByte"](13);
        _stream["WriteLong"](_settings.getCrossMaxVal());
    }
    
    _stream["WriteByte"](255);
}
function asc_menu_ReadChartPr(_params, _cursor){
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
            case 23:
            {
                _settings.horAxisProps = asc_menu_ReadAscCatAxisSettings(_params, _cursor);
                break;
            }
            case 24:
            {
                _settings.vertAxisProps = asc_menu_ReadAscCatAxisSettings(_params, _cursor);
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
function asc_menu_WriteChartPr(_type, _chartPr, _stream){
    if (!_chartPr)
        return;
    
    _stream["WriteByte"](_type);
    
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
    
    if (undefined != _chartPr.horAxisProps
        && null != _chartPr.horAxisProps
        && _chartPr.horAxisProps.getAxisType() == Asc.c_oAscAxisType.val) {
        asc_menu_WriteAscValAxisSettings(16, _chartPr.horAxisProps, _stream);
    }
    
    if (undefined != _chartPr.vertAxisProps
        && null != _chartPr.vertAxisProps
        && _chartPr.vertAxisProps.getAxisType() == Asc.c_oAscAxisType.val) {
        asc_menu_WriteAscValAxisSettings(17, _chartPr.vertAxisProps, _stream);
    }
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
    
    if (undefined != _chartPr.horAxisProps
        && null != _chartPr.horAxisProps
        && _chartPr.horAxisProps.getAxisType() == Asc.c_oAscAxisType.cat) {
        asc_menu_WriteAscCatAxisSettings(23, _chartPr.horAxisProps, _stream);
    }
    
    if (undefined != _chartPr.vertAxisProps
        && null != _chartPr.vertAxisProps
        && _chartPr.vertAxisProps.getAxisType() == Asc.c_oAscAxisType.cat) {
        asc_menu_WriteAscCatAxisSettings(24, _chartPr.vertAxisProps, _stream);
    }
    
    _stream["WriteByte"](255);
}
function asc_menu_ReadShapePr(_params, _cursor){
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
}
function asc_menu_WriteShapePr(_type, _shapePr, _stream){
    if (!_shapePr)
        return;
    
    _stream["WriteByte"](_type);
    
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
}
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
}

function asc_menu_WriteParaInd(_type, _ind, _stream){
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
}
function asc_menu_WriteParaSpacing(_type, _spacing, _stream){
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
}
function asc_menu_WriteParaBorder(_type, _border, _stream){
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
}
function asc_menu_WriteParaBorders(_type, _borders, _stream){
    if (!_borders)
        return;
    
    _stream["WriteByte"](_type);
    
    asc_menu_WriteParaBorder(0, _borders.Left, _stream);
    asc_menu_WriteParaBorder(1, _borders.Top, _stream);
    asc_menu_WriteParaBorder(2, _borders.Right, _stream);
    asc_menu_WriteParaBorder(3, _borders.Bottom, _stream);
    asc_menu_WriteParaBorder(4, _borders.Between, _stream);
    
    _stream["WriteByte"](255);
}
function asc_menu_WriteParaShd(_type, _shd, _stream){
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
}
function asc_menu_WriteParaTabs(_type, _tabs, _stream){
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
function asc_menu_WriteParaFrame(_type, _frame, _stream){
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
function asc_menu_WriteParaListType(_type, _list, _stream){
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
function asc_menu_WriteParagraphPr(_paraPr, _stream) {
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

function asc_ReadCBorder(s, p) {
    var color = null;
    var style = null;
    var _continue = true;
    while (_continue)
    {
        var _attr = s[p.pos++];
        switch (_attr)
        {
            case 0:
            {
                var type = s[p.pos++];
                if (type == "thin") {
                    style = Asc.c_oAscBorderStyles.Thin;
                } else if (type == "medium") {
                    style = Asc.c_oAscBorderStyles.Medium; 
                } else if (type == "thick") {
                    style = Asc.c_oAscBorderStyles.Thick; 
                }
                break;
            }
            case 1:
            {
                color = asc_menu_ReadColor(s, p);
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
    
    if (color && style) {
        return new Asc.asc_CBorder(style, color);
    }
    
    return null;
}
function asc_ReadAdjustPrint(s, p) {
    var adjustPrint = new window["Asc"].asc_CAdjustPrint();
    
    var next = true;
    while (next)
    {
        var _attr = s[p.pos++];
        switch (_attr)
        {
            case 0:
            {
                adjustPrint.asc_setPrintType(s[p.pos++]);
                break;
            }
            case 1:
            {
                // ToDo что-то тут нужно поправить...Теперь нет asc_setLayoutPageType
                //adjustPrint.asc_setLayoutPageType(s[p.pos++]);
                break;
            }
            case 255:
            default:
            {
                next = false;
                break;
            }
        }
    }
    
    return adjustPrint;
}
function asc_ReadCPageMargins(s, p) {
    var pageMargins = new Asc.asc_CPageMargins();
    
    var next = true;
    while (next)
    {
        var _attr = s[p.pos++];
        switch (_attr)
        {
            case 0:
            {
                pageMargins.asc_setLeft(s[p.pos++]);
                break;
            }
            case 1:
            {
                pageMargins.asc_setRight(s[p.pos++]);
                break;
            }
            case 2:
            {
                pageMargins.asc_setTop(s[p.pos++]);
                break;
            }
            case 3:
            {
                pageMargins.asc_setBottom(s[p.pos++]);
                break;
            }
                
            case 255:
            default:
            {
                next = false;
                break;
            }
        }
    }
    
    return pageMargins;
}
function asc_ReadCPageSetup(s, p) {
    var pageSetup = new Asc.asc_CPageSetup();
    
    var next = true;
    while (next)
    {
        var _attr = s[p.pos++];
        switch (_attr)
        {
            case 0:
            {
                pageSetup.asc_setOrientation(s[p.pos++]);
                break;
            }
            case 1:
            {
                pageSetup.asc_setWidth(s[p.pos++]);
                break;
            }
            case 2:
            {
                pageSetup.asc_setHeight(s[p.pos++]);
                break;
            }
                
            case 255:
            default:
            {
                next = false;
                break;
            }
        }
    }
    
    return pageSetup;
}
function asc_ReadPageOptions(s, p) {
    var pageOptions = new Asc.asc_CPageOptions();
    
    var next = true;
    while (next)
    {
        var _attr = s[p.pos++];
        switch (_attr)
        {
            case 0:
            {
                pageOptions.pageIndex = s[p.pos++];
                break;
            }
            case 1:
            {
                pageOptions.asc_setPageMargins(asc_ReadCPageMargins(s,p));
                break;
            }
            case 2:
            {
                pageOptions.asc_setPageSetup(asc_ReadCPageSetup(s,p));
                break;
            }
            case 3:
            {
                pageOptions.asc_setGridLines(s[p.pos++]);
                break;
            }
            case 4:
            {
                pageOptions.asc_setHeadings(s[p.pos++]);
                break;
            }
            case 255:
            default:
            {
                next = false;
                break;
            }
        }
    }
    
    return pageOptions;
}
function asc_ReadCHyperLink(_params, _cursor) {
    var _settings = new Asc.asc_CHyperlink();
    
    var _continue = true;
    while (_continue)
    {
        var _attr = _params[_cursor.pos++];
        switch (_attr)
        {
            case 0:
            {
                _settings.asc_setType(_params[_cursor.pos++]);
                break;
            }
            case 1:
            {
                _settings.asc_setHyperlinkUrl(_params[_cursor.pos++]);
                break;
            }
            case 2:
            {
                _settings.asc_setTooltip(_params[_cursor.pos++]);
                break;
            }
            case 3:
            {
                _settings.asc_setLocation(_params[_cursor.pos++]);
                break;
            }
            case 4:
            {
                _settings.asc_setSheet(_params[_cursor.pos++]);
                break;
            }
            case 5:
            {
                _settings.asc_setRange(_params[_cursor.pos++]);
                break;
            }
            case 6:
            {
                _settings.asc_setText(_params[_cursor.pos++]);
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
function asc_ReadAddFormatTableOptions(s, p) {
    var format = new AscCommonExcel.AddFormatTableOptions();
    
    var next = true;
    while (next)
    {
        var _attr = s[p.pos++];
        switch (_attr)
        {
            case 0:
            {
                format.asc_setRange(s[p.pos++]);
                break;
            }
            case 1:
            {
                format.asc_setIsTitle(s[p.pos++]);
                break;
            }
            case 255:
            default:
            {
                next = false;
                break;
            }
        }
    }
    
    return format;
}
function asc_ReadAutoFilter(s, p) {
    var filter = {};
    
    var next = true;
    while (next)
    {
        var _attr = s[p.pos++];
        switch (_attr)
        {
            case 0:
            {
                filter.styleName = s[p.pos++];
                break;
            }
            case 1:
            {
                filter.format = asc_ReadAddFormatTableOptions(s, p);
                break;
            }
            case 2:
            {
                filter.tableName = s[p.pos++];
                break;
            }
            case 3:
            {
                filter.optionType = s[p.pos++];
                break;
            }
            case 255:
            default:
            {
                next = false;
                break;
            }
        }
    }
    
    return filter;
}
function asc_ReadAutoFilterObj(s, p) {
    var filter = new Asc.AutoFilterObj();
    
    var next = true;
    while (next)
    {
        var _attr = s[p.pos++];
        switch (_attr)
        {
            case 0:
            {
                filter.asc_setType(s[p.pos++]);
                break;
            }
                
                // TODO: color, top10,
                
            case 255:
            default:
            {
                next = false;
                break;
            }
        }
    }
    
    return filter;
}
function asc_ReadAutoFiltersOptionsElements(s, p) {
    var filter = new AscCommonExcel.AutoFiltersOptionsElements();
    
    var next = true;
    while (next)
    {
        var _attr = s[p.pos++];
        switch (_attr)
        {
            case 0:
            {
                filter.asc_setIsDateFormat(s[p.pos++]);
                break;
            }
            case 1:
            {
                filter.asc_setText(s[p.pos++]);
                break;
            }
            case 2:
            {
                filter.asc_setVal(s[p.pos++]);
                break;
            }
            case 3:
            {
                filter.asc_setVisible(s[p.pos++]);
                break;
            }
            case 255:
            default:
            {
                next = false;
                break;
            }
        }
    }
    
    return filter;
}

function asc_ReadAutoFiltersOptions(s, p) {
    var filter = new Asc.AutoFiltersOptions();
    
    var next = true;
    while (next)
    {
        var _attr = s[p.pos++];
        switch (_attr)
        {
            case 0:
            {
                filter.asc_setCellId(s[p.pos++]);
                break;
            }
            case 1:
            {
                filter.asc_setDiplayName(s[p.pos++]);
                break;
            }
            case 2:
            {
                filter.asc_setIsTextFilter(s[p.pos++]);
                break;
            }
            case 3:
            {
                filter.asc_setSortState(s[p.pos++]);
                break;
            }
            case 4:
            {
                filter.asc_setSortColor(asc_menu_ReadColor(s, p));
                break;
            }
            case 5:
            {
                filter.asc_setFilterObj(asc_ReadAutoFilterObj(s, p));
                break;
            }
            case 6:
            {
                var values = [];
                var count = s[p.pos++];
                
                for (var i = 0; i < count; ++i) {
                    p.pos++;
                    values.push(asc_ReadAutoFiltersOptionsElements(s,p));
                }
                
                filter.asc_setValues(values);
                break;
            }
            case 255:
            default:
            {
                next = false;
                break;
            }
        }
    }
    
    return filter;
}
function asc_ReadFormatTableInfo(s, p) {
    var fmt = new AscCommonExcel.asc_CFormatTableInfo();
    var isNull = true;
    var next = true;
    while (next)
    {
        var _attr = s[p.pos++];
        switch (_attr)
        {
            case 0:
            {
                fmt.tableStyleName = s[p.pos++]; isNull = false;
                break;
            }
            case 1:
            {
                fmt.tableRange = s[p.pos++]; isNull = false;
                break;
            }
            case 2:
            {
                fmt.tableStyleName = s[p.pos++]; isNull = false;
                break;
            }
            case 3:
            {
                fmt.bandHor = s[p.pos++]; isNull = false;
                break;
            }
            case 4:
            {
                fmt.bandVer = s[p.pos++]; isNull = false;
                break;
            }
            case 5:
            {
                fmt.filterButton = s[p.pos++]; isNull = false;
                break;
            }
            case 6:
            {
                fmt.firstCol = s[p.pos++]; isNull = false;
                break;
            }
            case 7:
            {
                fmt.firstRow = s[p.pos++]; isNull = false;
                break;
            }
            case 8:
            {
                fmt.isDeleteColumn = s[p.pos++]; isNull = false;
                break;
            }
            case 9:
            {
                fmt.isDeleteRow = s[p.pos++]; isNull = false;
                break;
            }
            case 10:
            {
                fmt.isDeleteTable = s[p.pos++]; isNull = false;
                break;
            }
            case 11:
            {
                fmt.isInsertColumnLeft = s[p.pos++]; isNull = false;
                break;
            }
            case 12:
            {
                fmt.isInsertColumnRight = s[p.pos++]; isNull = false;
                break;
            }
            case 13:
            {
                fmt.IsInsertRowAbove = s[p.pos++]; isNull = false;
                break;
            }
            case 14:
            {
                fmt.isInsertRowBelow = s[p.pos++]; isNull = false;
                break;
            }
            case 15:
            {
                fmt.lastCol = s[p.pos++]; isNull = false;
                break;
            }
            case 16:
            {
                fmt.lastRow = s[p.pos++]; isNull = false;
                break;
            }
                
            case 255:
            default:
            {
                next = false;
                break;
            }
        }
    }
    
    return isNull ? null : fmt;
}

function asc_WriteCBorder(i, c, s) {
    if (!c) return;
    
    s['WriteByte'](i);
    
    if (c.asc_getStyle()) {
        s['WriteByte'](0);
        s['WriteString2'](c.asc_getStyle());
    }
    
    if (c.asc_getColor()) {
        s['WriteByte'](1);
        s['WriteLong'](c.asc_getColor());
    }
    
    s['WriteByte'](255);
}
function asc_WriteCHyperLink(i, c, s) {
    if (!c) return;
    
    s['WriteByte'](i);
    
    s['WriteByte'](0);
    s['WriteLong'](c.asc_getType());
    
    if (c.asc_getHyperlinkUrl()) {
        s['WriteByte'](1);
        s['WriteString2'](c.asc_getHyperlinkUrl());
    }
    
    if (c.asc_getTooltip()) {
        s['WriteByte'](2);
        s['WriteString2'](c.asc_getTooltip());
    }
    
    if (c.asc_getLocation()) {
        s['WriteByte'](3);
        s['WriteString2'](c.asc_getLocation());
    }
    
    if (c.asc_getSheet()) {
        s['WriteByte'](4);
        s['WriteString2'](c.asc_getSheet());
    }
    
    if (c.asc_getRange()) {
        s['WriteByte'](5);
        s['WriteString2'](c.asc_getRange());
    }
    
    if (c.asc_getText()) {
        s['WriteByte'](6);
        s['WriteString2'](c.asc_getText());
    }
    
    s['WriteByte'](255);
}
function asc_WriteCFont(i, c, s) {
    if (!c) return;
    
    if (i !== -1) s['WriteByte'](i);
    
    s['WriteByte'](0);
    s['WriteString2'](c.asc_getName());
    s['WriteDouble2'](c.asc_getSize());
    s['WriteBool'](c.asc_getBold());
    s['WriteBool'](c.asc_getItalic());
    s['WriteBool'](c.asc_getUnderline());
    s['WriteBool'](c.asc_getStrikeout());
    s['WriteBool'](c.asc_getSubscript());
    s['WriteBool'](c.asc_getSuperscript());
    
    if (c.asc_getColor()) {
        asc_menu_WriteColor(1, c.asc_getColor(), s);
    }
    
    s['WriteByte'](255);
}
function asc_WriteCBorders(i, c, s) {
    if (!c) return;
    
    s['WriteByte'](i);
    
    if (c.asc_getLeft()) asc_WriteCBorder(0, c.asc_getLeft(), s);
    if (c.asc_getTop()) asc_WriteCBorder(0, c.asc_getTop(), s);
    if (c.asc_getRight()) asc_WriteCBorder(0, c.asc_getRight(), s);
    if (c.asc_getBottom()) asc_WriteCBorder(0, c.asc_getBottom(), s);
    if (c.asc_getDiagDown()) asc_WriteCBorder(0, c.asc_getDiagDown(), s);
    if (c.asc_getDiagUp()) asc_WriteCBorder(0, c.asc_getDiagUp(), s);
    
    s['WriteByte'](255);
}
function asc_WriteAutoFilterInfo(i, c, s) {
    
    if (i !== -1) s['WriteByte'](i);
    
    if (c.asc_getTableStyleName()) {
        s['WriteByte'](0);
        s['WriteString2'](c.asc_getTableStyleName());
    }
    
    if (c.asc_getTableName()) {
        s['WriteByte'](1);
        s['WriteString2'](c.asc_getTableName());
    }
    if (null !== c.asc_getIsAutoFilter()) {
        s['WriteByte'](2);
        s['WriteBool'](c.asc_getIsAutoFilter());
    }
    
    if (null !== c.asc_getIsApplyAutoFilter()) {
        s['WriteByte'](3);
        s['WriteBool'](c.asc_getIsApplyAutoFilter());
    }
    
    s['WriteByte'](255);
}
function asc_WriteFormatTableInfo(i, c, s) {
    
    if (i !== -1) s['WriteByte'](i);
    
    if (c.asc_getTableName()) {
        s['WriteByte'](0);
        s['WriteString2'](c.asc_getTableName());
    }
    
    if (c.asc_getTableRange()) {
        s['WriteByte'](1);
        s['WriteString2'](c.asc_getTableRange());
    }
    
    if (c.asc_getTableStyleName()) {
        s['WriteByte'](2);
        s['WriteString2'](c.asc_getTableStyleName());
    }
    
    if (null !== c.asc_getBandHor()) {
        s['WriteByte'](3);
        s['WriteBool'](c.asc_getBandHor());
    }
    
    if (null !== c.asc_getBandVer()) {
        s['WriteByte'](4);
        s['WriteBool'](c.asc_getBandVer());
    }
    
    if (null !== c.asc_getFilterButton()) {
        s['WriteByte'](5);
        s['WriteBool'](c.asc_getFilterButton());
    }
    
    if (null !== c.asc_getFirstCol()) {
        s['WriteByte'](6);
        s['WriteBool'](c.asc_getFirstCol());
    }
    
    if (null !== c.asc_getFirstRow()) {
        s['WriteByte'](7);
        s['WriteBool'](c.asc_getFirstRow());
    }
    
    if (null !== c.asc_getIsDeleteColumn()) {
        s['WriteByte'](8);
        s['WriteBool'](c.asc_getIsDeleteColumn());
    }
    
    if (null !== c.asc_getIsDeleteRow()) {
        s['WriteByte'](9);
        s['WriteBool'](c.asc_getIsDeleteRow());
    }
    
    if (null !== c.asc_getIsDeleteTable()) {
        s['WriteByte'](10);
        s['WriteBool'](c.asc_getIsDeleteTable());
    }
    
    if (null !== c.asc_getIsInsertColumnLeft()) {
        s['WriteByte'](11);
        s['WriteBool'](c.asc_getIsInsertColumnLeft());
    }
    
    if (null !== c.asc_getIsInsertColumnRight()) {
        s['WriteByte'](12);
        s['WriteBool'](c.asc_getIsInsertColumnRight());
    }
    
    if (null !== c.asc_getIsInsertRowAbove()) {
        s['WriteByte'](13);
        s['WriteBool'](c.asc_getIsInsertRowAbove());
    }
    
    if (null !== c.asc_getIsInsertRowBelow()) {
        s['WriteByte'](14);
        s['WriteBool'](c.asc_getIsInsertRowBelow());
    }
    
    if (null !== c.asc_getLastCol()) {
        s['WriteByte'](15);
        s['WriteBool'](c.asc_getLastCol());
    }
    
    if (null !== c.asc_getLastRow()) {
        s['WriteByte'](16);
        s['WriteBool'](c.asc_getLastRow());
    }
    
    s['WriteByte'](255);
}

function asc_WriteCCellInfo(c, s) {
    if (!c) return;
    
    if (null != c.asc_getFormula()) {
        s['WriteByte'](1);
        s['WriteString2'](c.asc_getFormula());
    }
    
    if (null !== c.asc_getText()) {
        s['WriteByte'](2);
        s['WriteString2'](c.asc_getText());
    }
    
    if (null !== c.asc_getHorAlign()) {
        s['WriteByte'](3);
        s['WriteLong'](c.asc_getHorAlign());
    }
    
    if (null !== c.asc_getVertAlign()) {
        s['WriteByte'](4);
        s['WriteLong'](c.asc_getVertAlign());
    }
    
    if (null !== c.asc_getFlags()) {
        s['WriteByte'](5);
        s['WriteBool'](c.asc_getFlags().asc_getMerge());
        s['WriteBool'](c.asc_getFlags().asc_getShrinkToFit());
        s['WriteBool'](c.asc_getFlags().asc_getWrapText());
        s['WriteLong'](c.asc_getFlags().asc_getSelectionType());
        s['WriteBool'](c.asc_getFlags().asc_getLockText());
    }
    
    asc_WriteCFont(6, c.asc_getFont(), s);
    asc_menu_WriteColor(8, c.asc_getFill().asc_getColor(), s);
    asc_WriteCBorders(9, c.asc_getBorders(), s);
    
    if (null !== c.asc_getInnerText()) {
        s['WriteByte'](15);
        s['WriteString2'](c.asc_getInnerText());
    }
    
    if (null !== c.asc_getNumFormat()) {
        s['WriteByte'](16);
        s['WriteString2'](c.asc_getNumFormat());
    }
    
    asc_WriteCHyperLink(17, c.asc_getHyperlink(), s);
    
    s['WriteByte'](18);
    s['WriteBool'](c.asc_getLocked());
    
    if (null != c.asc_getStyleName()) {
        s['WriteByte'](21);
        s['WriteString2'](c.asc_getStyleName());
    }
    
    if (null != c.asc_getNumFormatInfo()) {
        s['WriteByte'](22);
        s['WriteLong'](c.asc_getNumFormatInfo().asc_getType());
    }
    
    if (null != c.asc_getAngle()) {
        s['WriteByte'](23);
        s['WriteDouble2'](c.asc_getAngle());
    }
    
    if (c.asc_getAutoFilterInfo()) { asc_WriteAutoFilterInfo(30, c.asc_getAutoFilterInfo(), s); }
    if (c.asc_getFormatTableInfo()) { asc_WriteFormatTableInfo(31, c.asc_getFormatTableInfo(), s); }
    
    s['WriteByte'](255);
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
AscCommon.asc_WriteColorSchemes = asc_WriteColorSchemes;
function asc_WriteAddFormatTableOptions(c, s) {
    if (!c) return;
    
    if (c.asc_getRange()) {
        s['WriteByte'](0);
        s['WriteString2'](c.asc_getRange());
    }
    
    if (c.asc_getIsTitle()) {
        s['WriteByte'](1);
        s['WriteBool'](c.asc_getIsTitle());
    }
    
    s['WriteByte'](255);
}

function asc_WriteAutoFilterObj(i, c, s) {
    if (!c) return;
    
    s['WriteByte'](i);
    
    if (undefined !== c.asc_getType()) {
        s['WriteByte'](0);
        s['WriteLong'](c.asc_getType());
    }
    
    s['WriteByte'](255);
}
function asc_WriteAutoFiltersOptionsElements(i, c, s) {
    if (!c) return;
    
    s['WriteByte'](i);
    
    if (undefined !== c.asc_getIsDateFormat()) {
        s['WriteByte'](0);
        s['WriteBool'](c.asc_getIsDateFormat());
    }
    
    if (c.asc_getText()) {
        s['WriteByte'](1);
        s['WriteString2'](c.asc_getText());
    }
    
    if (c.asc_getVal()) {
        s['WriteByte'](2);
        s['WriteString2'](c.asc_getVal());
    }
    
    if (undefined !== c.asc_getVisible()) {
        s['WriteByte'](3);
        s['WriteBool'](c.asc_getVisible());
    }
    
    s['WriteByte'](255);
}
function asc_WriteAutoFiltersOptions(c, s) {
    if (!c) return;
    
    if (c.asc_getCellId()) {
        s['WriteByte'](0);
        s['WriteString2'](c.asc_getCellId());
    }
    
    if (c.asc_getDisplayName()) {
        s['WriteByte'](1);
        s['WriteString2'](c.asc_getDisplayName());
    }
    
    if (c.asc_getIsTextFilter()) {
        s['WriteByte'](2);
        s['WriteBool'](c.asc_getIsTextFilter());
    }
    
    if (c.asc_getCellCoord()) {
        s['WriteByte'](3);
        s['WriteDouble2'](c.asc_getCellCoord().asc_getX());
        s['WriteDouble2'](c.asc_getCellCoord().asc_getY());
        s['WriteDouble2'](c.asc_getCellCoord().asc_getWidth());
        s['WriteDouble2'](c.asc_getCellCoord().asc_getHeight());
    }
    
    if (c.asc_getSortColor()) {
        asc_menu_WriteColor(4, c.asc_getSortColor(), s);
    }
    
    if (c.asc_getValues() && c.asc_getValues().length > 0) {
        var count = c.asc_getValues().length
        
        s['WriteByte'](5);
        s['WriteLong'](count);
        
        for (var i = 0; i < count; ++i) {
            asc_WriteAutoFiltersOptionsElements(1, c.asc_getValues()[i], s);
        }
    }
    
    if (undefined !== c.asc_getSortState()) {
        s['WriteByte'](6);
        s['WriteLong'](c.asc_getSortState());
    }
    
    if (c.asc_getFilterObj()) {
        asc_WriteAutoFilterObj(7, c.asc_getFilterObj(), s);
    }
    
    s['WriteByte'](255);
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

//--------------------------------------------------------------------------------
// defines
//--------------------------------------------------------------------------------

var PageType = {
PageDefaultType: 0,
PageTopType: 1,
PageLeftType: 2,
PageCornerType: 3
};

var kBeginOfLine = -1;
var kBeginOfText = -2;
var kEndOfLine = -3;
var kEndOfText = -4;
var kNextChar = -5;
var kNextWord = -6;
var kNextLine = -7;
var kPrevChar = -8;
var kPrevWord = -9;
var kPrevLine = -10;
var kPosition = -11;
var kPositionLength = -12;

var deviceScale = 1;

var sdkCheck = true;

//--------------------------------------------------------------------------------
// OfflineEditor
//--------------------------------------------------------------------------------

var _api = null;
function OfflineEditor () {
    
    this.zoom = 1.0;
    this.textSelection = 0;
    this.selection = [];
    this.cellPin = 0;
    this.col0 = 0;
    this.row0 = 0;
    this.translate = null;
    this.initSettings = null;
    
    // main
    
    this.beforeOpen = function() {

        window['AscFormat'].DrawingArea.prototype.drawSelection = function(drawingDocument) {
            
            AscCommon.g_oTextMeasurer.Flush();
            
            var canvas = this.worksheet.objectRender.getDrawingCanvas();
            var shapeCtx = canvas.shapeCtx;
            var shapeOverlayCtx = canvas.shapeOverlayCtx;
            var autoShapeTrack = canvas.autoShapeTrack;
            var trackOverlay = canvas.trackOverlay;
            
            var ctx = trackOverlay.m_oContext;
            trackOverlay.Clear();
            drawingDocument.Overlay = trackOverlay;
            
            this.worksheet.overlayCtx.clear();
            this.worksheet.overlayGraphicCtx.clear();
            this.worksheet._drawCollaborativeElements(autoShapeTrack);
            
            if (!this.worksheet.objectRender.controller.selectedObjects.length && !this.api.isStartAddShape)
                this.worksheet._drawSelection();
            
            var chart;
            var controller = this.worksheet.objectRender.controller;
            var selected_objects = controller.selection.groupSelection ? controller.selection.groupSelection.selectedObjects : controller.selectedObjects;
            if(selected_objects.length === 1 && selected_objects[0].getObjectType() === AscDFH.historyitem_type_ChartSpace)
            {
                chart = selected_objects[0];
                this.worksheet.objectRender.selectDrawingObjectRange(chart);
            }
            for ( var i = 0; i < this.frozenPlaces.length; i++ ) {
                
                this.frozenPlaces[i].setTransform(shapeCtx, shapeOverlayCtx, autoShapeTrack);
                
                // Clip
                this.frozenPlaces[i].clip(shapeOverlayCtx);
                
                if (null == drawingDocument.m_oDocumentRenderer) {
                    if (drawingDocument.m_bIsSelection) {
                        drawingDocument.private_StartDrawSelection(trackOverlay);
                        this.worksheet.objectRender.controller.drawTextSelection();
                        drawingDocument.private_EndDrawSelection();
                    }
                    
                    ctx.globalAlpha = 1.0;
                    
                    this.worksheet.objectRender.controller.drawSelection(drawingDocument);
                    
                    if ( this.worksheet.objectRender.controller.needUpdateOverlay() ) {
                        trackOverlay.Show();
                        shapeOverlayCtx.put_GlobalAlpha(true, 0.5);
                        this.worksheet.objectRender.controller.drawTracks(shapeOverlayCtx);
                        shapeOverlayCtx.put_GlobalAlpha(true, 1);
                    }
                } else {
                    
                    ctx.fillStyle = "rgba(51,102,204,255)";
                    ctx.beginPath();
                    
                    for (var j = drawingDocument.m_lDrawingFirst; j <= drawingDocument.m_lDrawingEnd; j++) {
                        var drawPage = drawingDocument.m_arrPages[j].drawingPage;
                        drawingDocument.m_oDocumentRenderer.DrawSelection(j, trackOverlay, drawPage.left, drawPage.top, drawPage.right - drawPage.left, drawPage.bottom - drawPage.top);
                    }
                    
                    ctx.globalAlpha = 0.2;
                    ctx.fill();
                    ctx.beginPath();
                    ctx.globalAlpha = 1.0;
                }
                
                // Restore
                this.frozenPlaces[i].restore(shapeOverlayCtx);
            }
        };
        
        window['AscFormat'].Path.prototype.drawSmart = function(shape_drawer) {
            
            var _graphics   = shape_drawer.Graphics;
            var _full_trans = _graphics.m_oFullTransform;
            
            if (!_graphics || !_full_trans || undefined == _graphics.m_bIntegerGrid || true === shape_drawer.bIsNoSmartAttack)
                return this.draw(shape_drawer);
            
            var bIsTransformed = (_full_trans.shx == 0 && _full_trans.shy == 0) ? false : true;
            
            if (bIsTransformed)
                return this.draw(shape_drawer);
            
            var isLine = this.isSmartLine();
            var isRect = false;
            if (!isLine)
                isRect = this.isSmartRect();
            
            //if (!isLine && !isRect)   // IOS убрать
            return this.draw(shape_drawer);
            
            var _old_int = _graphics.m_bIntegerGrid;
            
            if (false == _old_int)
                _graphics.SetIntegerGrid(true);
            
            var dKoefMMToPx = Math.max(_graphics.m_oCoordTransform.sx, 0.001);
            
            var _ctx = _graphics.m_oContext;
            var bIsStroke = (shape_drawer.bIsNoStrokeAttack || (this.stroke !== true)) ? false : true;
            var bIsEven = false;
            if (bIsStroke)
            {
                var _lineWidth = Math.max((shape_drawer.StrokeWidth * dKoefMMToPx + 0.5) >> 0, 1);
                _ctx.lineWidth = _lineWidth;
                
                if ((_lineWidth & 0x01) == 0x01)
                    bIsEven = true;
            }
            
            var bIsDrawLast = false;
            var path = this.ArrPathCommand;
            shape_drawer._s();
            
            if (!isRect)
            {
                for(var j = 0, l = path.length; j < l; ++j)
                {
                    var cmd=path[j];
                    switch(cmd.id)
                    {
                        case AscFormat.moveTo:
                        {
                            bIsDrawLast = true;
                            
                            var _x = (_full_trans.TransformPointX(cmd.X, cmd.Y)) >> 0;
                            var _y = (_full_trans.TransformPointY(cmd.X, cmd.Y)) >> 0;
                            if (bIsEven)
                            {
                                _x -= 0.5;
                                _y -= 0.5;
                            }
                            _ctx.moveTo(_x, _y);
                            break;
                        }
                        case AscFormat.lineTo:
                        {
                            bIsDrawLast = true;
                            
                            var _x = (_full_trans.TransformPointX(cmd.X, cmd.Y)) >> 0;
                            var _y = (_full_trans.TransformPointY(cmd.X, cmd.Y)) >> 0;
                            if (bIsEven)
                            {
                                _x -= 0.5;
                                _y -= 0.5;
                            }
                            _ctx.lineTo(_x, _y);
                            break;
                        }
                        case AscFormat.close:
                        {
                            _ctx.closePath();
                            break;
                        }
                    }
                }
            }
            else
            {
                var minX = 100000;
                var minY = 100000;
                var maxX = -100000;
                var maxY = -100000;
                bIsDrawLast = true;
                for(var j = 0, l = path.length; j < l; ++j)
                {
                    var cmd=path[j];
                    switch(cmd.id)
                    {
                        case AscFormat.moveTo:
                        case AscFormat.lineTo:
                        {
                            if (minX > cmd.X)
                                minX = cmd.X;
                            if (minY > cmd.Y)
                                minY = cmd.Y;
                            
                            if (maxX < cmd.X)
                                maxX = cmd.X;
                            if (maxY < cmd.Y)
                                maxY = cmd.Y;
                            
                            break;
                        }
                        default:
                            break;
                    }
                }
                
                var _x1 = (_full_trans.TransformPointX(minX, minY)) >> 0;
                var _y1 = (_full_trans.TransformPointY(minX, minY)) >> 0;
                var _x2 = (_full_trans.TransformPointX(maxX, maxY)) >> 0;
                var _y2 = (_full_trans.TransformPointY(maxX, maxY)) >> 0;
                
                if (bIsEven)
                    _ctx.rect(_x1 + 0.5, _y1 + 0.5, _x2 - _x1, _y2 - _y1);
                else
                    _ctx.rect(_x1, _y1, _x2 - _x1, _y2 - _y1);
            }
            
            if (bIsDrawLast)
            {
                shape_drawer.drawFillStroke(true, this.fill, bIsStroke);
            }
            
            shape_drawer._e();
            
            if (false == _old_int)
                _graphics.SetIntegerGrid(false);
        };
        
        var asc_Range = window["Asc"].Range;

        AscCommonExcel.WorksheetView.prototype.__drawGrid = function (drawingCtx, c1, r1, c2, r2, leftFieldInPx, topFieldInPx, width, height) {
            var range = new asc_Range(c1, r1, c2, r2);
            this._prepareCellTextMetricsCache(range);
            this._drawGrid(drawingCtx, range, leftFieldInPx, topFieldInPx, width, height);
        };
        
        AscCommonExcel.WorksheetView.prototype.__drawCellsAndBorders = function (drawingCtx,  c1, r1, c2, r2, offsetXForDraw, offsetYForDraw, istoplayer) {
            var range = new asc_Range(c1, r1, c2, r2);
            
            if (false === istoplayer) {
                this._drawCellsAndBorders(drawingCtx, range, offsetXForDraw, offsetYForDraw);
                this.af_drawButtons(range, offsetXForDraw, offsetYForDraw);
            }
            
            var oldrange = this.visibleRange;
            this.visibleRange = range;
            
            var cellsLeft_Local = this.cellsLeft;
            var cellsTop_Local  = this.cellsTop;
            
            this.cellsLeft = -(offsetXForDraw - this._getColLeft(c1));
            this.cellsTop = -(offsetYForDraw - this._getRowTop(r1));
            
            // TODO: frozen places implementation native only
            if (this.drawingArea.frozenPlaces.length) {
                this.drawingArea.frozenPlaces[0].range = range;
            }
            
            window["native"]["SwitchMemoryLayer"]();
            
            AscCommon.g_oTextMeasurer.Flush();
            
            this.objectRender.showDrawingObjectsEx(false);
            
            this.cellsLeft = cellsLeft_Local;
            this.cellsTop = cellsTop_Local;
            this.visibleRange = oldrange;
        };
        
        AscCommonExcel.WorksheetView.prototype.__selection = function (c1, r1, c2, r2, isFrozen) {
            
            var selection = [];
            
            var range = undefined;
            
            this.visibleRange = new asc_Range(c1, r1, c2, r2);
            
            isFrozen = !!isFrozen;
            if (window["Asc"]["editor"].isStartAddShape || this.objectRender.selectedGraphicObjectsExists()) {
                return;
            }
            
            var offsetX = 0, offsetY = 0;
            
            offsetX = this._getColLeft(this.visibleRange.c1) - this.cellsLeft;
            offsetY = this._getRowTop(this.visibleRange.r1) - this.cellsTop;
            
            var activeCell = this.model.selectionRange.activeCell;
            
            selection.push(0);
            selection.push(0);
            selection.push(0);
            selection.push(0);
            
            selection.push(0);
            selection.push(0);
            selection.push(0);
            selection.push(0);
            
            var ranges = (this.isSelectionDialogMode ? this.copyActiveRange : this.model.selectionRange).ranges;
            var range, selectionLineType, type;
            for (var i = 0, l = ranges.length; i < l; ++i) {
                range = ranges[i].clone();
                type = range.getType();
                if (Asc.c_oAscSelectionType.RangeMax === type) {
                    range.c2 = this.nColsCount - 1;
                    range.r2 = this.nRowsCount - 1;
                } else if (Asc.c_oAscSelectionType.RangeCol === type) {
                    range.r2 = this.nRowsCount - 1;
                } else if (Asc.c_oAscSelectionType.RangeRow === type) {
                    range.c2 = this.nColsCount - 1;
                }
                
                selection.push(type);
                
                selection.push(range.c1);
                selection.push(range.c2);
                selection.push(range.r1);
                selection.push(range.r2);
                
                selection.push(this._getColLeft(range.c1) - offsetX);
                selection.push(this._getRowTop(range.r1)  - offsetY);
                selection.push(this._getColLeft(range.c2) + this._getColumnWidth(range.c2)  - this._getColLeft(range.c1));
                selection.push(this._getRowTop(range.r2)  + this._getRowHeight(range.r2) - this._getRowTop(range.r1));
                
                selectionLineType = AscCommonExcel.selectionLineType.Selection;
                if (1 === l) {
                    selectionLineType |=
                    AscCommonExcel.selectionLineType.ActiveCell | AscCommonExcel.selectionLineType.Promote;
                } else if (i === this.model.selectionRange.activeCellId) {
                    selectionLineType |= AscCommonExcel.selectionLineType.ActiveCell;
                }
                
                var isActive = AscCommonExcel.selectionLineType.ActiveCell & selectionLineType;
                if (isActive) {
                    var cell = (this.isSelectionDialogMode ? this.copyActiveRange : this.model.selectionRange).activeCell;
                    var fs = this.model.getMergedByCell(cell.row, cell.col);
                    fs = range.intersectionSimple(fs ? fs : new asc_Range(cell.col, cell.row, cell.col, cell.row));
                    if (fs) {
                        
                        selection[0] = fs.c1;
                        selection[1] = fs.c2;
                        selection[2] = fs.r1;
                        selection[3] = fs.r2;
                        
                        selection[4] = this._getColLeft(fs.c1) - offsetX;
                        selection[5] = this._getRowTop(fs.r1)  - offsetY;
                        selection[6] = this._getColLeft(fs.c2) + this._getColumnWidth(fs.c2)  - this._getColLeft(fs.c1);
                        selection[7] = this._getRowTop(fs.r2)  + this._getRowHeight(fs.r2) - this._getRowTop(fs.r1);
                    }
                }
            }
            
            var formularanges = [];
            
            if (!isFrozen && this.isFormulaEditMode) {
                if (this.arrActiveFormulaRanges.length) {
                    formularanges = this.__selectedCellRanges(this.arrActiveFormulaRanges, offsetX, offsetY);
                }
            }
            
            return {'selection': selection, 'formularanges': formularanges};
        };
        
        AscCommonExcel.WorksheetView.prototype.__changeSelectionPoint = function (x, y, isCoord, isSelectMode, isReverse) {
            
            var isChangeSelectionShape = false;
            if (isCoord) {
                isChangeSelectionShape = this._endSelectionShape();
            }
            
            var isMoveActiveCellToLeftTop = false;
            
            var selection = this._getSelection();
            var lastRange = selection.getLast();
            
            var col = selection.activeCell.col;
            var row = selection.activeCell.row;
            
            if (isReverse) {
                selection.activeCell.col = this.leftTopRange.c2;
                selection.activeCell.row = this.leftTopRange.r2;
            } else {
                selection.activeCell.col = this.leftTopRange.c1;
                selection.activeCell.row = this.leftTopRange.r1;
            }
            
            var ar = this._getSelection().getLast();
            
            var newRange = isCoord ? this._calcSelectionEndPointByXY(x, y) :
            this._calcSelectionEndPointByOffset(x, y);
            var isEqual = newRange.isEqual(ar);
            if (isEqual && !isCoord) {
                // При движении стрелками можем попасть на замерженную ячейку
            }
            if (!isEqual || isChangeSelectionShape) {
                
                if (newRange.c1 > col || newRange.c2 < col)  {
                    col = newRange.c1;
                    isMoveActiveCellToLeftTop = true;
                }
                
                if (newRange.r1 > row || newRange.r2 < row) {
                    row = newRange.r1;
                    isMoveActiveCellToLeftTop = true;
                }
                
                ar.assign2(newRange);
                
                selection.activeCell.col = col;
                selection.activeCell.row = row;
                
                if (isMoveActiveCellToLeftTop) {
                    selection.activeCell.col = newRange.c1;
                    selection.activeCell.row = newRange.r1;
                }
                
                if (!this.isCellEditMode) {
                    if (!this.isSelectionDialogMode) {
                        this.handlers.trigger("selectionNameChanged", this.getSelectionName(/*bRangeText*/true));
                        if (!isSelectMode) {
                            this.handlers.trigger("selectionChanged");
                            this.handlers.trigger("selectionMathInfoChanged", this.getSelectionMathInfo());
                        }
                    } else {
                        // Смена диапазона
                        this.handlers.trigger("selectionRangeChanged", this.getSelectionRangeValue());
                    }
                }
            } else {
                selection.activeCell.col = col;
                selection.activeCell.row = row;
            }
            
            this.model.workbook.handlers.trigger("asc_onHideComment");
            
            return isCoord ? this._calcActiveRangeOffsetIsCoord(x, y) :
            this._calcRangeOffset();
        };
        
        AscCommonExcel.WorksheetView.prototype.__chartsRanges = function(ranges) {
            
            if (ranges) {
                return this.__selectedCellRange(ranges, 0, 0, Asc.c_oAscSelectionType.RangeChart);
            }
            
            if (window["Asc"]["editor"].isStartAddShape || this.objectRender.selectedGraphicObjectsExists()) {
                if (this.isChartAreaEditMode && this.arrActiveChartRanges.length) {
                    return this.__selectedCellRanges(this.arrActiveChartRanges, 0, 0, Asc.c_oAscSelectionType.RangeChart);
                }
            }
            
            return null;
        };
        
        AscCommonExcel.WorksheetView.prototype.__selectedCellRanges = function (inputRanges, offsetX, offsetY, rangetype) {
            
            var ranges = [], j = 0, i = 0, type = 0, left = 0, right = 0, top = 0, bottom = 0;
            
            for (j = 0; j < inputRanges.length; ++j) {
                
                arrRanges = inputRanges[j].ranges;
                
                var type = 0, left = 0, right = 0, top = 0, bottom = 0;
                var addt, addl, addr, addb, colsCount = this.nColsCount - 1, rowsCount = this.nRowsCount - 1;
                var defaultRowHeight = AscCommonExcel.oDefaultMetrics.RowHeight;
                
                for (i = 0; i < arrRanges.length; ++i) {
                    type = (arrRanges[i].getType == undefined) ? 0 : arrRanges[i].getType();
                    ranges.push(undefined !== rangetype ? rangetype : type);
                    ranges.push(arrRanges[i].c1);
                    ranges.push(arrRanges[i].c2);
                    ranges.push(arrRanges[i].r1);
                    ranges.push(arrRanges[i].r2);
                    
                    addl = Math.max(arrRanges[i].c1 - colsCount,0);
                    addt = Math.max(arrRanges[i].r1 - rowsCount,0);
                    addr = Math.max(arrRanges[i].c2 - colsCount,0);
                    addb = Math.max(arrRanges[i].r2 - rowsCount,0);
                    
                    if (1 === type) { // cells or chart
                        if (addl > 0)
                            left = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addl - offsetX;
                        else
                            left = this._getColLeft(Math.max(0,arrRanges[i].c1,0)) - offsetX;
                        
                        if (addt > 0)
                            top = this._getRowTop(rowsCount - 1) + addt * defaultRowHeight - offsetY;
                        else
                            top = this._getRowTop(Math.max(0,arrRanges[i].r1,0)) - offsetY;
                        
                        if (addr > 0)
                            right = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addr - offsetX;
                        else
                            right = this._getColLeft(arrRanges[i].c2) + this._getColumnWidth(arrRanges[i].c2) - offsetX;
                        
                        if (addb > 0)
                            bottom = this._getRowTop(rowsCount - 1) + addb * defaultRowHeight - offsetY;
                        else
                            bottom = this._getRowTop(arrRanges[i].r2) + this._getRowHeight(arrRanges[i].r2) - offsetY;
                    }
                    else if (2 === type) {       // column range
                        if (addl > 0)
                            left = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addl - offsetX;
                        else
                            left = this._getColLeft(Math.max(0,arrRanges[i].c1)) - offsetX;
                        
                        if (addt > 0)
                            top = this._getRowTop(rowsCount - 1) + addt * defaultRowHeight - offsetY;
                        else
                            top = this._getRowTop(Math.max(0,arrRanges[i].r1)) - offsetY;
                        
                        if (addr > 0)
                            right = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addr - offsetX;
                        else
                            right = this._getColLeft(arrRanges[i].c2) + this._getColumnWidth(arrRanges[i].c2) - offsetX;
                        
                        bottom = 0;
                    }
                    else if (3 === type) {       // row range
                        if (addl > 0)
                            left = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addl - offsetX;
                        else
                            left = this._getColLeft(arrRanges[i].c1) - offsetX;
                        
                        if (addt > 0)
                            top = this._getRowTop(rowsCount - 1) + addt * defaultRowHeight - offsetY;
                        else
                            top = this._getRowTop(arrRanges[i].r1) - offsetY;
                        
                        right = 0;
                        
                        if (addb > 0)
                            bottom = this._getRowTop(rowsCount - 1) + addb * defaultRowHeight - offsetY;
                        else
                            bottom  = this._getRowTop(arrRanges[i].r2) + this._getRowHeight(arrRanges[i].r2) - offsetY;
                    }
                    else if (4 === type) {       // max
                        if (addl > 0)
                            left = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addl - offsetX;
                        else
                            left = this._getColLeft(arrRanges[i].c1) - offsetX;
                        
                        if (addt > 0)
                            top = this._getRowTop(rowsCount - 1) + addt * defaultRowHeight - offsetY;
                        else
                            top = this._getRowTop(arrRanges[i].r1) - offsetY;
                        
                        right = 0;
                        bottom = 0;
                    } else {
                        if (addl > 0)
                            left = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addl - offsetX;
                        else
                            left = this._getColLeft(Math.max(0,arrRanges[i].c1)) - offsetX;
                        
                        if (addt > 0)
                            top = this._getRowTop(rowsCount - 1) + addt * defaultRowHeight - offsetY;
                        else
                            top = this._getRowTop(Math.max(0,arrRanges[i].r1)) - offsetY;
                        
                        if (addr > 0)
                            right = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addr - offsetX;
                        else
                            right = this._getColLeft(Math.max(0,arrRanges[i].c2)) + this._getColumnWidth(Math.max(0,arrRanges[i].c2)) - offsetX;
                        
                        if (addb > 0)
                            bottom = this._getRowTop(rowsCount - 1) + addb * defaultRowHeight - offsetY;
                        else
                            bottom = this._getRowTop(Math.max(0,arrRanges[i].r2)) + this._getRowHeight(Math.max(0,arrRanges[i].r2)) - offsetY;
                    }
                    
                    // else if (5 === type) { // range image
                    // }
                    // else if (6 === type) { // range chart
                    // }
                    
                    ranges.push(left);
                    ranges.push(top);
                    ranges.push(right);
                    ranges.push(bottom);
                }
            }
            
            return ranges;
        };
        
        AscCommonExcel.WorksheetView.prototype.__selectedCellRange = function (arrRanges, offsetX, offsetY, rangetype) {
            
            var ranges = [], j = 0, i = 0, type = 0, left = 0, right = 0, top = 0, bottom = 0;
            
            var type = 0, left = 0, right = 0, top = 0, bottom = 0;
            var addt, addl, addr, addb, colsCount = this.nColsCount - 1, rowsCount = this.nRowsCount - 1;
            var defaultRowHeight = AscCommonExcel.oDefaultMetrics.RowHeight;
            
            for (i = 0; i < arrRanges.length; ++i) {
                type = (arrRanges[i].getType == undefined) ? 0 : arrRanges[i].getType();
                ranges.push(undefined !== rangetype ? rangetype : type);
                ranges.push(arrRanges[i].c1);
                ranges.push(arrRanges[i].c2);
                ranges.push(arrRanges[i].r1);
                ranges.push(arrRanges[i].r2);
                
                addl = Math.max(arrRanges[i].c1 - colsCount,0);
                addt = Math.max(arrRanges[i].r1 - rowsCount,0);
                addr = Math.max(arrRanges[i].c2 - colsCount,0);
                addb = Math.max(arrRanges[i].r2 - rowsCount,0);
                
                if (1 === type) { // cells or chart
                    if (addl > 0)
                        left = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addl - offsetX;
                    else
                        left = this._getColLeft(Math.max(0,arrRanges[i].c1,0)) - offsetX;
                    
                    if (addt > 0)
                        top = this._getRowTop(rowsCount - 1) + addt * defaultRowHeight - offsetY;
                    else
                        top = this._getRowTop(Math.max(0,arrRanges[i].r1,0)) - offsetY;
                    
                    if (addr > 0)
                        right = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addr - offsetX;
                    else
                        right = this._getColLeft(arrRanges[i].c2) + this._getColumnWidth(arrRanges[i].c2) - offsetX;
                    
                    if (addb > 0)
                        bottom = this._getRowTop(rowsCount - 1) + addb * defaultRowHeight - offsetY;
                    else
                        bottom = this._getRowTop(arrRanges[i].r2) + this._getRowHeight(arrRanges[i].r2) - offsetY;
                }
                else if (2 === type) {       // column range
                    if (addl > 0)
                        left = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addl - offsetX;
                    else
                        left = this._getColLeft(Math.max(0,arrRanges[i].c1)) - offsetX;
                    
                    if (addt > 0)
                        top = this._getRowTop(rowsCount - 1) + addt * defaultRowHeight - offsetY;
                    else
                        top = this._getRowTop(Math.max(0,arrRanges[i].r1)) - offsetY;
                    
                    if (addr > 0)
                        right = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addr - offsetX;
                    else
                        right = this._getColLeft(arrRanges[i].c2) + this._getColumnWidth(arrRanges[i].c2) - offsetX;
                    
                    bottom = 0;
                }
                else if (3 === type) {       // row range
                    if (addl > 0)
                        left = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addl - offsetX;
                    else
                        left = this._getColLeft(arrRanges[i].c1) - offsetX;
                    
                    if (addt > 0)
                        top = this._getRowTop(rowsCount - 1) + addt * defaultRowHeight - offsetY;
                    else
                        top = this._getRowTop(arrRanges[i].r1) - offsetY;
                    
                    right = 0;
                    
                    if (addb > 0)
                        bottom = this._getRowTop(rowsCount - 1) + addb * defaultRowHeight - offsetY;
                    else
                        bottom  = this._getRowTop(arrRanges[i].r2) + this._getRowHeight(arrRanges[i].r2) - offsetY;
                }
                else if (4 === type) {       // max
                    if (addl > 0)
                        left = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addl - offsetX;
                    else
                        left = this._getColLeft(arrRanges[i].c1) - offsetX;
                    
                    if (addt > 0)
                        top = this._getRowTop(rowsCount - 1) + addt * defaultRowHeight - offsetY;
                    else
                        top = this._getRowTop(arrRanges[i].r1) - offsetY;
                    
                    right = 0;
                    bottom = 0;
                } else {
                    if (addl > 0)
                        left = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addl - offsetX;
                    else
                        left = this._getColLeft(Math.max(0,arrRanges[i].c1)) - offsetX;
                    
                    if (addt > 0)
                        top = this._getRowTop(rowsCount - 1) + addt * defaultRowHeight - offsetY;
                    else
                        top = this._getRowTop(Math.max(0,arrRanges[i].r1)) - offsetY;
                    
                    if (addr > 0)
                        right = this._getColLeft(colsCount - 1) + this.defaultColWidthPx * addr - offsetX;
                    else
                        right = this._getColLeft(Math.max(0,arrRanges[i].c2)) + this._getColumnWidth(Math.max(0,arrRanges[i].c2)) - offsetX;
                    
                    if (addb > 0)
                        bottom = this._getRowTop(rowsCount - 1) + addb * defaultRowHeight - offsetY;
                    else
                        bottom = this._getRowTop(Math.max(0,arrRanges[i].r2)) + this._getRowHeight(Math.max(0,arrRanges[i].r2)) - offsetY;
                }
                
                // else if (5 === type) { // range image
                // }
                // else if (6 === type) { // range chart
                // }
                
                ranges.push(left);
                ranges.push(top);
                ranges.push(right);
                ranges.push(bottom);
            }
            
            return ranges;
        };
    };
    
    this.openFile = function(settings) {
        
        window["NativeSupportTimeouts"] = true;
        
        //        try
        //        {
        //            throw "OpenFile";
        //        }
        //        catch (e)
        //        {
        //
        //        }
        
        AscFonts.FontPickerByCharacter.IsUseNoSquaresMode = true;
        
        this.initSettings = settings;
        
        this.beforeOpen();
        
        deviceScale = window["native"]["GetDeviceScale"]();
        sdkCheck = settings["sdkCheck"];
        
        window.g_file_path = "native_open_file";
        window.NATIVE_DOCUMENT_TYPE = "";
  
        var translations = this.initSettings["translations"];
        if (undefined != translations && null != translations && translations.length > 0) {
            translations = JSON.parse(translations)
        } else {
            translations = "";
        }

        window["_api"] = window["API"] = _api = new window["Asc"]["spreadsheet_api"](translations);
        
        AscCommon.g_clipboardBase.Init(_api);
        
        var userInfo = new Asc.asc_CUserInfo();
        userInfo.asc_putId(this.initSettings["docUserId"]);
        userInfo.asc_putFullName(this.initSettings["docUserName"]);
        userInfo.asc_putFirstName(this.initSettings["docUserFirstName"]);
        userInfo.asc_putLastName(this.initSettings["docUserLastName"]);
        
        var docInfo = new Asc.asc_CDocInfo();
        docInfo.put_Id(this.initSettings["docKey"]);
        docInfo.put_Url(this.initSettings["docURL"]);
        docInfo.put_Format("xlsx");
        docInfo.put_UserInfo(userInfo);
        docInfo.put_Token(this.initSettings["token"]);
        
        var permissions = this.initSettings["permissions"];
        if (undefined != permissions && null != permissions && permissions.length > 0) {
            docInfo.put_Permissions(JSON.parse(permissions));
        }
        
        _api.asc_setDocInfo(docInfo);
        
        this.offline_beforeInit();
        
        this.registerEventsHandlers();
        
        if (this.initSettings["iscoauthoring"]) {
            _api.asc_setAutoSaveGap(1);
            _api._coAuthoringInit();
            _api.asc_SetFastCollaborative(true);
            
            window["native"]["onTokenJWT"](_api.CoAuthoringApi.get_jwt());
            
        } else {
            
            _api.asc_nativeOpenFile(window["native"]["GetFileString"](), undefined, true, window["native"]["GetXlsxPath"]());
            
            this.asc_WriteAllWorksheets(true);
            
            _api.sendColorThemes(_api.wbModel.theme);
            _api.asc_ApplyColorScheme(false);
            _api._applyFirstLoadChanges();
            // Go to if sent options
            var options = _api.DocInfo && _api.DocInfo.asc_getOptions();
            _api.goTo(options && options["action"]);
            
            var ws = _api.wb.getWorksheet();
            
            _api.wb.showWorksheet(undefined, true);
            ws._fixSelectionOfMergedCells();
            
            if (ws.topLeftFrozenCell) {
                this.row0 = ws.topLeftFrozenCell.getRow0();
                this.col0 = ws.topLeftFrozenCell.getCol0();
            }
            
            var chartData = this.initSettings["chartData"];
            if (chartData.length > 0) {
                var json = JSON.parse(chartData);
                if (json) {
                    
                    var nativeToEditor = 1.0 / deviceScale;
                    
                    var screenWidth = this.initSettings["screenWidth"] * nativeToEditor / 2.54 - ws.headersWidth;
                    var screenHeight = this.initSettings["screenHeight"] * nativeToEditor / 2.54 - ws.headersHeight;
                    
                    _api.asc_addChartDrawingObject(json);
                    
                    var objects = ws.objectRender.controller.drawingObjects.getDrawingObjects();
                    if (objects.length > 0) {
                        
                        var gr = objects[0].graphicObject;
                        
                        var w = gr.spPr.xfrm.extX;
                        var h = gr.spPr.xfrm.extY;
                        
                        var offX = Math.max(0, (screenWidth - w) * 0.5);
                        var offY = Math.max(screenHeight * 0.2, (screenHeight - w) * 0.5);
                        
                        gr.spPr.xfrm.setOffX(offX);
                        gr.spPr.xfrm.setOffY(offY);
                        gr.checkDrawingBaseCoords();
                        gr.recalculate();
                    }
                    
                    //console.log(JSON.stringify(json));
                }
            }
            
            // TODO: Implement frozen places
            // TODO: Implement Text Art Styles
        }
        
        this.offline_afteInit();
    };
    this.registerEventsHandlers = function () {
        
        var t = this;
        
        _api.asc_registerCallback("asc_onCanUndoChanged", function (bCanUndo) {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  stream["WriteBool"](bCanUndo);
                                  window["native"]["OnCallMenuEvent"](60, stream); // ASC_MENU_EVENT_TYPE_CAN_UNDO
                                  });
        
        _api.asc_registerCallback("asc_onCanRedoChanged", function (bCanRedo) {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  stream["WriteBool"](bCanRedo);
                                  window["native"]["OnCallMenuEvent"](61, stream); // ASC_MENU_EVENT_TYPE_CAN_REDO
                                  });
        
        _api.asc_registerCallback("asc_onDocumentModifiedChanged", function(change) {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  stream["WriteBool"](change);
                                  window["native"]["OnCallMenuEvent"](66, stream); // ASC_MENU_EVENT_TYPE_DOCUMETN_MODIFITY
                                  });
        
        _api.asc_registerCallback("asc_onActiveSheetChanged", function(index) {
                                  t.asc_WriteAllWorksheets(true, true);
                                  });
        
        _api.asc_registerCallback("asc_onRenameCellTextEnd", function(found, replaced) {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  stream["WriteLong"](found);
                                  stream["WriteLong"](replaced);
                                  window["native"]["OnCallMenuEvent"](63, stream); // ASC_MENU_EVENT_TYPE_SEARCH_REPLACETEXT
                                  });
        
        _api.asc_registerCallback("asc_onSelectionChanged", function(cellInfo) {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  asc_WriteCCellInfo(cellInfo, stream);
                                  window["native"]["OnCallMenuEvent"](2402, stream); // ASC_SPREADSHEETS_EVENT_TYPE_SELECTION_CHANGED
                                  t.onSelectionChanged(cellInfo);
                                  });
        
        _api.asc_registerCallback("asc_onSelectionNameChanged", function(name) {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  stream["WriteString2"](name);
                                  window["native"]["OnCallMenuEvent"](2310, stream); // ASC_SPREADSHEETS_EVENT_TYPE_EDITOR_SELECTION_NAME_CHANGED
                                  });
        
        _api.asc_registerCallback("asc_onEditorSelectionChanged", function(font) {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  asc_WriteCFont(-1, font, stream);
                                  window["native"]["OnCallMenuEvent"](2403, stream); // ASC_SPREADSHEETS_EVENT_TYPE_EDITOR_SELECTION_CHANGED
                                  });
        
        _api.asc_registerCallback("asc_onSendThemeColorSchemes", function(schemes) {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  asc_WriteColorSchemes(schemes, stream);
                                  window["native"]["OnCallMenuEvent"](2404, stream); // ASC_SPREADSHEETS_EVENT_TYPE_COLOR_SCHEMES
                                  });
        
        _api.asc_registerCallback("asc_onInitTablePictures",   function () {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  window["native"]["OnCallMenuEvent"](12, stream); // ASC_MENU_EVENT_TYPE_TABLE_STYLES
                                  });
        
        _api.asc_registerCallback("asc_onInitEditorStyles", function () {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  window["native"]["OnCallMenuEvent"](2405, stream); // ASC_SPREADSHEETS_EVENT_TYPE_CELL_STYLES
                                  });
        
        _api.asc_registerCallback("asc_onError", function(id, level, errData) {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  stream["WriteLong"](id);
                                  stream["WriteLong"](level);
                                  window["native"]["OnCallMenuEvent"](500, stream); // ASC_MENU_EVENT_TYPE_ON_ERROR
                                  });
        
        _api.asc_registerCallback("asc_onEditCell", function(state) {
                                  if (Asc.c_oAscCellEditorState.editStart === state) {
                                    var stream = global_memory_stream_menu;
                                    stream["ClearNoAttack"]();
                                    window["native"]["OnCallMenuEvent"](50000, stream); // ASC_SPREADSHEETS_EVENT_TYPE_AFTER_INSERT_FORMULA
                                  } else {
                                    var stream = global_memory_stream_menu;
                                    stream["ClearNoAttack"]();
                                    stream["WriteLong"](state);
                                    window["native"]["OnCallMenuEvent"](2600, stream); // ASC_SPREADSHEETS_EVENT_TYPE_ON_EDIT_CELL
                                  }
                                  });
        
        _api.asc_registerCallback("asc_onSetAFDialog", function(state) {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  asc_WriteAutoFiltersOptions(state, stream);
                                  window["native"]["OnCallMenuEvent"](3060, stream); // ASC_SPREADSHEETS_EVENT_TYPE_FILTER_DIALOG
                                  });
        
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
        
        _api.asc_registerCallback("asc_onSheetsChanged", function () {
                                  t.asc_WriteAllWorksheets(true, true);
                                  });
        
        _api.asc_registerCallback("asc_onWorkbookLocked", function(locked) {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  stream["WriteBool"](locked);
                                  window["native"]["OnCallMenuEvent"](20104, stream); // ASC_COAUTH_EVENT_TYPE_WORKBOOK_LOCKED
                                  });
        
        _api.asc_registerCallback("asc_onWorksheetLocked", function(index, locked) {
                                  var stream = global_memory_stream_menu;
                                  stream["ClearNoAttack"]();
                                  stream["WriteLong"](index);
                                  stream["WriteBool"](locked);
                                  window["native"]["OnCallMenuEvent"](20105, stream); // ASC_COAUTH_EVENT_TYPE_WORKSHEET_LOCKED
                                  });
        
        _api.asc_registerCallback("asc_onGetEditorPermissions", function(state) {
                                  var rData = {
                                  "c"             : "open",
                                  "id"            : t.initSettings["docKey"],
                                  "userid"        : t.initSettings["docUserId"],
                                  "format"        : "xlsx",
                                  "vkey"          : undefined,
                                  "url"           : t.initSettings["docURL"],
                                  "title"         : this.documentTitle,
                                  "nobase64"      : true};
                                  
                                  _api.CoAuthoringApi.auth(t.initSettings["viewmode"], rData);
                                  });
        
        _api.asc_registerCallback("asc_onDocumentUpdateVersion", function(callback) {
                                  var me = this;
                                  me.needToUpdateVersion = true;
                                  if (callback) callback.call(me);
                                  });
        
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
    };
    this.updateFrozen = function () {
        var ws = _api.wb.getWorksheet();
        if (ws.topLeftFrozenCell) {
            _s.row0 = ws.topLeftFrozenCell.getRow0();
            _s.col0 = ws.topLeftFrozenCell.getCol0();
        }
        else
        {
            _s.row0 = 0;
            _s.col0 = 0;
        }
    };
    
    // prop
    
    this.getMaxBounds = function () {
        var worksheet = _api.wb.getWorksheet();
        
        var left = worksheet._getColLeft(worksheet.nColsCount - 1);
        var top =  worksheet._getRowTop(worksheet.nRowsCount - 1);
        
        left += (AscCommon.gc_nMaxCol - worksheet.nColsCount) * worksheet.defaultColWidthPx;
        top += (AscCommon.gc_nMaxRow - worksheet.nRowsCount) * AscCommonExcel.oDefaultMetrics.RowHeight;
        
        return [left, top];
    };
    this.getSelection = function(x, y, width, height, autocorrection) {
        
        _null_object.width = width;
        _null_object.height = height;
        
        var ws = _api.wb.getWorksheet();
        var region = null;
        //var range = ws.activeRange.intersection(worksheet.visibleRange);
        
        var ranges = ws.model.selectionRange.ranges;
        var range = ws.visibleRange;
        for (var i = 0, l = ranges.length; i < l; ++i) {
            range = range.intersection(ranges[i]);
        }
        
        if ((null === range) && (ranges.length > 0)) {
            range = ranges[0];
        }
        
        if (autocorrection) {
            this._resizeWorkRegion(ws, range.c2, range.r2);
            region = {columnBeg:0, columnEnd: ws.nColsCount - 1, columnOff:0, rowBeg:0, rowEnd: ws.nRowsCount - 1, rowOff:0};
        } else {
            region = this._updateRegion(worksheet, x, y, width, height);
        }
        
        this.selection = _api.wb.getWorksheet().__selection(region.columnBeg, region.rowBeg, region.columnEnd, region.rowEnd);
        
        return this.selection;
    };
    this.getNearCellCoord = function(x, y) {
        
        //TODO: optimize search ( bin2_search )
        
        var cell = [],
        worksheet = _api.wb.getWorksheet(),
        count = 0,
        i = 0;
        
        count = worksheet.nColsCount;
        if (count) {
            if (worksheet._getColLeft(0) > x) {
                cell.push(0);
            } else {
                for (i = 0; i < count; ++i) {
                    if (worksheet._getColLeft(i) - worksheet._getColLeft(0) <= x &&
                        x < worksheet._getColLeft(i) + worksheet._getColumnWidth(i) - worksheet._getColLeft(0)) {
                        
                        if (x - worksheet._getColLeft(i) - worksheet._getColLeft(0) > worksheet._getColumnWidth(i) * 0.5) {
                            cell.push(worksheet._getColLeft(i + 1) - worksheet._getColLeft(0));
                        }
                        else {
                            cell.push(worksheet._getColLeft(i) - worksheet._getColLeft(0));
                        }
                        
                        break;
                    }
                }
            }
        }
        
        count = worksheet.nRowsCount;
        if (count) {
            if (worksheet._getRowTop(0) > y) {
                cell.push(0);
            } else {
                for (i = 0; i < count; ++i) {
                    if (worksheet._getRowTop(i) - worksheet._getRowTop(0) <= y &&
                        y < worksheet._getRowTop(i) + worksheet._getRowHeight(i) - worksheet._getRowTop(0)) {
                        if (y - worksheet._getRowTop(i) - worksheet._getRowTop(0) > worksheet._getRowHeight(i) * 0.5)
                            cell.push(worksheet._getRowTop(i + 1) - worksheet._getRowTop(0));
                        else
                            cell.push(worksheet._getRowTop(i) - worksheet._getRowTop(0));
                        
                        break;
                    }
                }
            }
        }
        
        return cell;
    };
    
    // serialize
    
    this.asc_WriteAllWorksheets = function (callEvent, isSheetChange) {
        
        var _stream = global_memory_stream_menu;
        _stream["ClearNoAttack"]();
        
        _stream["WriteByte"](0);
        _stream["WriteString2"](_api.asc_getActiveWorksheetId(i));
        
        for (var i = 0; i < _api.asc_getWorksheetsCount(); ++i) {
            
            var viewSettings = _api.wb.getWorksheet(i).getSheetViewSettings();
            
            if (_api.asc_getWorksheetTabColor(i)) {
                _stream["WriteByte"](1);
            } else {
                _stream["WriteByte"](2);
            }
            _stream["WriteLong"](i);
            _stream["WriteString2"](_api.asc_getWorksheetId(i));
            _stream["WriteString2"](_api.asc_getWorksheetName(i));
            _stream["WriteBool"](_api.asc_isWorksheetHidden(i));
            _stream["WriteBool"](_api.asc_isWorkbookLocked(i));
            _stream["WriteBool"](_api.asc_isWorksheetLockedOrDeleted(i));
            _stream["WriteBool"](viewSettings.asc_getShowGridLines());
            _stream["WriteBool"](viewSettings.asc_getShowRowColHeaders());
            _stream["WriteBool"](viewSettings.asc_getIsFreezePane());
            
            if (_api.asc_getWorksheetTabColor(i))
                asc_menu_WriteColor(0, _api.asc_getWorksheetTabColor(i), _stream);
        }
        
        _stream["WriteByte"](255);
        
        if (callEvent) {
            window["native"]["OnCallMenuEvent"](isSheetChange ? 2300 : 2130, global_memory_stream_menu); // ASC_SPREADSHEETS_EVENT_TYPE_WORKSHEETS
        }
    };
    this.asc_writeWorksheet = function(i) {
        
        var viewSettings = _api.wb.getWorksheet(i).getSheetViewSettings();
        
        var _stream = global_memory_stream_menu;
        _stream["ClearNoAttack"]();
        
        if (_api.asc_getWorksheetTabColor(i)) {
            _stream["WriteByte"](1);
        } else {
            _stream["WriteByte"](2);
        }
        _stream["WriteLong"](i);
        _stream["WriteString2"](_api.asc_getWorksheetId(i));
        _stream["WriteString2"](_api.asc_getWorksheetName(i));
        _stream["WriteBool"](_api.asc_isWorksheetHidden(i));
        _stream["WriteBool"](_api.asc_isWorkbookLocked(i));
        _stream["WriteBool"](_api.asc_isWorksheetLockedOrDeleted(i));
        _stream["WriteBool"](viewSettings.asc_getShowGridLines());
        _stream["WriteBool"](viewSettings.asc_getShowRowColHeaders());
        _stream["WriteBool"](viewSettings.asc_getIsFreezePane());
        
        if (_api.asc_getWorksheetTabColor(i)) {
            asc_menu_WriteColor(0, _api.asc_getWorksheetTabColor(i), _stream);
        }
        
        _stream["WriteByte"](255);
    };
    
    // render
    
    this.drawSheet = function (x, y, width, height, ratio, istoplayer) {
        _null_object.width = width * ratio;
        _null_object.height = height * ratio;
        
        var worksheet = _api.wb.getWorksheet();
        worksheet._recalculate();
        var region = this._updateRegion(worksheet, x, y, width * ratio, height * ratio);
        var colRowHeaders = _api.asc_getSheetViewSettings();
        
        if (colRowHeaders.asc_getShowGridLines() && false == istoplayer) {
            worksheet.__drawGrid(undefined,
                                 region.columnBeg, region.rowBeg, region.columnEnd, region.rowEnd,
                                 region.columnOff, region.rowOff,
                                 width + region.columnOff, height + region.rowOff);
        }
        
        worksheet.__drawCellsAndBorders(undefined,
                                        region.columnBeg, region.rowBeg, region.columnEnd, region.rowEnd,
                                        region.columnOff, region.rowOff, istoplayer);
    };
    this.drawHeader = function (x, y, width, height, type, ratio) {
        
        _null_object.width = width * ratio;
        _null_object.height = height * ratio;
        
        var worksheet = _api.wb.getWorksheet();
        var region = this._updateRegion(worksheet, x, y, width * ratio, height * ratio);
        
        var isColumn = type == PageType.PageTopType || type == PageType.PageCornerType;
        var isRow = type == PageType.PageLeftType || type == PageType.PageCornerType;
        
        if (!isColumn && isRow)
            worksheet._drawRowHeaders(null, region.rowBeg, region.rowEnd, undefined, 0, region.rowOff);
        else if (isColumn && !isRow)
            worksheet._drawColumnHeaders(null, region.columnBeg, region.columnEnd, undefined, region.columnOff, 0);
        else if (isColumn && isRow)
            worksheet._drawCorner();
    };
    
    // internal
    
    this._updateRegion = function (worksheet, x, y, width, height) {
        
        var i = 0;
        var nativeToEditor = 1.0 / deviceScale;
        
        // координаты в СО редактора
        
        var logicX = x * nativeToEditor + worksheet.headersWidth;
        var logicY = y * nativeToEditor + worksheet.headersHeight;
        var logicToX = ( x + width ) * nativeToEditor + worksheet.headersWidth;
        var logicToY = ( y + height ) * nativeToEditor + worksheet.headersHeight;
        
        var columnBeg = -1;
        var columnEnd = -1;
        var columnOff = 0;
        var rowBeg = -1;
        var rowEnd = -1;
        var rowOff = 0;
        var count = 0;
        
        // добавляем отсутствующие колонки ( с небольшим зазором )
        
        var logicToXMAX = logicToX;//10000 * (1 + Math.floor(logicToX / 10000));
        
        if (logicToXMAX >= worksheet._getColLeft(worksheet.nColsCount - 1)) {
            
            do {
                worksheet.nColsCount = worksheet.nColsCount + 1;
                worksheet._calcWidthColumns(AscCommonExcel.recalcType.newLines);
                
                if (logicToXMAX < worksheet._getColLeft(worksheet.nColsCount - 1)) {
                    break
                }
            } while (1);
        }
        
        
        
        if (logicX < worksheet._getColLeft(worksheet.nColsCount - 1)) {
            count = worksheet.nColsCount;
            for (i = 0; i < count; ++i) {
                if (-1 === columnBeg) {
                    if (worksheet._getColLeft(i) <= logicX && logicX < worksheet._getColLeft(i) + worksheet._getColumnWidth(i)) {
                        columnBeg = i;
                        columnOff = logicX;
                    }
                }
                
                if (worksheet._getColLeft(i) <= logicToX && logicToX < worksheet._getColLeft(i) + worksheet._getColumnWidth(i)) {
                    columnEnd = i;
                    break;
                }
            }
        }
        
        // добавляем отсутствующие строки ( с небольшим зазором )
        
        var logicToYMAX = logicToY;//10000 * (1 + Math.floor(logicToY / 10000));
        
        if (logicToYMAX >= worksheet._getRowTop(worksheet.nRowsCount - 1)) {
            
            do {
                worksheet.nRowsCount = worksheet.nRowsCount + 1;
                worksheet._calcHeightRows(AscCommonExcel.recalcType.newLines);
                
                if (logicToYMAX < worksheet._getRowTop(worksheet.nRowsCount - 1)) {
                    break
                }
            } while (1);
        }
        
        
        if (logicY < worksheet._getRowTop(worksheet.nRowsCount - 1)) {
            count = worksheet.nRowsCount;
            for (i = 0; i < count; ++i) {
                if (-1 === rowBeg) {
                    if (worksheet._getRowTop(i) <= logicY && logicY < worksheet._getRowTop(i) + worksheet._getRowHeight(i)) {
                        rowBeg = i;
                        rowOff = logicY;
                    }
                }
                
                if (worksheet._getRowTop(i) <= logicToY && logicToY < worksheet._getRowTop(i) + worksheet._getRowHeight(i)) {
                    rowEnd = i;
                    break;
                }
            }
        }
        
        return {
        columnBeg: columnBeg,
        columnEnd: columnEnd,
        columnOff: columnOff,
        rowBeg: rowBeg,
        rowEnd: rowEnd,
        rowOff: rowOff
        };
    };
    this._resizeWorkRegion = function (worksheet, col, row, isCoords) {
        
        if (undefined !== isCoords) {
            
            if (col >= worksheet._getColLeft(worksheet.nColsCount - 1)) {
                
                do {
                    worksheet.nColsCount = worksheet.nColsCount + 1;
                    worksheet._calcWidthColumns(AscCommonExcel.recalcType.newLines);
                    
                    if (col < worksheet._getColLeft(worksheet.nColsCount - 1)) {
                        break
                    }
                } while (1);
            }
            
            if (row >= worksheet._getRowTop(worksheet.nRowsCount - 1)) {
                
                do {
                    worksheet.nRowsCount = worksheet.nRowsCount + 1;
                    worksheet._calcHeightRows(AscCommonExcel.recalcType.newLines);
                    
                    if (row < worksheet._getRowTop(worksheet.nRowsCount - 1)) {
                        break
                    }
                } while (1);
            }
        }
        else
        {
            if (col >= worksheet.nColsCount) {
                do {
                    worksheet.nColsCount = worksheet.nColsCount + 1;
                    worksheet._calcWidthColumns(AscCommonExcel.recalcType.newLines);
                    
                    if (col < worksheet.nColsCount)
                        break
                        } while (1);
            }
            
            if (row >= worksheet.nRowsCount) {
                do {
                    worksheet.nRowsCount = worksheet.nRowsCount + 1;
                    worksheet._calcHeightRows(AscCommonExcel.recalcType.newLines);
                    
                    if (row < worksheet.nRowsCount)
                        break
                        } while (1);
            }
        }
    };
    this.offline_print = function(s, p) {
        var adjustPrint = asc_ReadAdjustPrint(s, p);
        var printPagesData = _api.wb.calcPagesPrint(adjustPrint);
        var pdfPrinterMemory = _api.wb.printSheets(printPagesData).DocumentRenderer.Memory;
        return pdfPrinterMemory.GetBase64Memory();
    };
    
    this.onSelectionChanged = function(info) {
        var stream = global_memory_stream_menu;
        stream["ClearNoAttack"]();
        
        var SelectedObjects = [], selectType = info.asc_getFlags().asc_getSelectionType();
        if (selectType == Asc.c_oAscSelectionType.RangeImage || selectType == Asc.c_oAscSelectionType.RangeShape ||
            selectType == Asc.c_oAscSelectionType.RangeChart || selectType == Asc.c_oAscSelectionType.RangeChartText ||
            selectType == Asc.c_oAscSelectionType.RangeShapeText)
        {
            SelectedObjects = _api.asc_getGraphicObjectProps();
            
            var count = SelectedObjects.length;
            var naturalCount = count;
            
            stream["WriteLong"](naturalCount);
            
            for (var i = 0; i < count; i++)
            {
                switch (SelectedObjects[i].asc_getObjectType())
                {
                    case Asc.c_oAscTypeSelectElement.Paragraph:
                    {
                        stream["WriteLong"](Asc.c_oAscTypeSelectElement.Paragraph);
                        asc_menu_WriteParagraphPr(SelectedObjects[i].Value, stream);
                        break;
                    }
                    case Asc.c_oAscTypeSelectElement.Image:
                    {
                        stream["WriteLong"](Asc.c_oAscTypeSelectElement.Image);
                        asc_menu_WriteImagePr(SelectedObjects[i].Value, stream);
                        break;
                    }
                    case Asc.c_oAscTypeSelectElement.Hyperlink:
                    {
                        stream["WriteLong"](Asc.c_oAscTypeSelectElement.Hyperlink);
                        asc_menu_WriteHyperPr(SelectedObjects[i].Value, stream);
                        break;
                    }
                    case Asc.c_oAscTypeSelectElement.Math:
                    {
                        stream["WriteLong"](Asc.c_oAscTypeSelectElement.Math);
                        asc_menu_WriteMath(SelectedObjects[i].Value, stream);
                        break;
                    }
                    default:
                    {
                        // none
                        break;
                    }
                }
            }
            
            if (count)
            {
                window["native"]["OnCallMenuEvent"](6, stream);
            }
        }
    };
    
    this.offline_addImageDrawingObject = function(options) {
        var worksheet = _api.wb.getWorksheet();
        var objectRender = worksheet.objectRender;
        var _this = objectRender;
        var objectId = null;
        var imageUrl = options[0];
        
        function ascCvtRatio(fromUnits, toUnits) {
            return window["Asc"].getCvtRatio(fromUnits, toUnits, objectRender.getContext().getPPIX());
        }
        function pxToMm(val) {
            return val * ascCvtRatio(0, 3);
        }
        
        if (imageUrl && objectRender.canEdit()) {
            
            var _image = new Image();
            _image.src = imageUrl
            
            var isOption = true;//options && options.cell;
            
            var calculateObjectMetrics = function (object, width, height) {
                // Обработка картинок большого разрешения
                var metricCoeff = 1;
                
                var coordsFrom = _this.calculateCoords(object.from);
                var realTopOffset = coordsFrom.y;
                var realLeftOffset = coordsFrom.x;
                
                var areaWidth = worksheet._getColLeft(worksheet.getLastVisibleCol()) - worksheet._getColLeft(worksheet.getFirstVisibleCol(true));     // по ширине
                if (areaWidth < width) {
                    metricCoeff = width / areaWidth;
                    
                    width = areaWidth;
                    height /= metricCoeff;
                }
                
                var areaHeight = worksheet._getRowTop(worksheet.getLastVisibleRow()) - worksheet._getRowTop(worksheet.getFirstVisibleRow(true));     // по высоте
                if (areaHeight < height) {
                    metricCoeff = height / areaHeight;
                    
                    height = areaHeight;
                    width /= metricCoeff;
                }
                
                var toCell = worksheet.findCellByXY(realLeftOffset + width, realTopOffset + height, true, false, false);
                object.to.col = toCell.col;
                object.to.colOff = pxToMm(toCell.colOff);
                object.to.row = toCell.row;
                object.to.rowOff = pxToMm(toCell.rowOff);
            };
            
            var addImageObject = function (_image) {
                
                var drawingObject = _this.createDrawingObject();
                drawingObject.worksheet = worksheet;
                
                var activeCell = worksheet.model.selectionRange.activeCell;
                drawingObject.from.col = activeCell.col;
                drawingObject.from.row = activeCell.row;
                
                calculateObjectMetrics(drawingObject, options[1], options[2]);
                
                var coordsFrom = _this.calculateCoords(drawingObject.from);
                var coordsTo = _this.calculateCoords(drawingObject.to);
                
                // CImage
                _this.objectLocker.reset();
                _this.objectLocker.addObjectId(AscCommon.g_oIdCounter.Get_NewId());
                _this.objectLocker.checkObjects(function (bLock) {
                                                if (bLock !== true)
                                                return;
                                                _this.controller.resetSelection();
                                                History.Create_NewPoint();
                                                _this.controller.addImageFromParams(_image.src, pxToMm(coordsFrom.x) + MOVE_DELTA, pxToMm(coordsFrom.y) + MOVE_DELTA, pxToMm(coordsTo.x - coordsFrom.x), pxToMm(coordsTo.y - coordsFrom.y));
                                                _this.controller.startRecalculate();
                                                });
                
                worksheet.setSelectionShape(true);
                
                if (_this.controller.selectedObjects.length) {
                    objectId = _this.controller.selectedObjects[0].Id;
                }
            };
            
            addImageObject(_image);
        }
        
        return objectId;
    };
    this.offline_addShapeDrawingObject = function(options) {
        var ws = _api.wb.getWorksheet();
        var objectRender = ws.objectRender;
        var objectId = null;
        var current = {pos: 0};
        
        var shapeProp = asc_menu_ReadShapePr(options["shape"], current);
        
        var left = options["l"];
        var top = options["t"];
        var right = options["r"];
        var bottom = options["b"];
        
        function ascCvtRatio(fromUnits, toUnits) {
            return window["Asc"].getCvtRatio(fromUnits, toUnits, objectRender.getContext().getPPIX());
        }
        function pxToMm(val) {
            return val * ascCvtRatio(0, 3);
        }
        
        _api.asc_startAddShape(shapeProp.type);
        
        objectRender.controller.OnMouseDown({}, pxToMm(left), pxToMm(top), 0);
        objectRender.controller.OnMouseMove({IsLocked: true}, pxToMm(right), pxToMm(bottom), 0);
        objectRender.controller.OnMouseUp({}, pxToMm(left), pxToMm(bottom), 0);
        
        _api.asc_endAddShape();
        
        if (objectRender.controller.selectedObjects.length) {
            objectId = objectRender.controller.selectedObjects[0].Id;
        }
        
        ws.setSelectionShape(true);
        
        return objectId;
    };
    this.offline_addChartDrawingObject = function(options) {
        var ws = _api.wb.getWorksheet();
        var objectRender = ws.objectRender;
        var objectId = null;
        var current = {pos: 0};
        
        var settings = asc_menu_ReadChartPr(options["chart"], current);
        
        var left = options["l"];
        var top = options["t"];
        var right = options["r"];
        var bottom = options["b"];
        
        var selectedRange = ws.getSelectedRange();
        if (selectedRange)
        {
            var box = selectedRange.getBBox0();
            settings.putInColumns(!(box.r2 - box.r1 < box.c2 - box.c1));
        }
        
        var oRangeValue = ws.getSelectionRangeValue();
        if (oRangeValue) {
            settings.putRange(oRangeValue.asc_getName());
        }
        
        settings.putStyle(2);
        settings.putTitle(Asc.c_oAscChartTitleShowSettings.noOverlay);
        settings.putShowHorAxis(true);
        settings.putShowVerAxis(true);
        var series = AscFormat.getChartSeries(ws.model, settings);
        if(series && series.series.length > 1)
        {
            settings.putLegendPos(Asc.c_oAscChartLegendShowSettings.right);
        }
        else
        {
            settings.putLegendPos(Asc.c_oAscChartLegendShowSettings.none);
        }
        settings.putHorAxisLabel(Asc.c_oAscChartHorAxisLabelShowSettings.none);
        settings.putVertAxisLabel(Asc.c_oAscChartVertAxisLabelShowSettings.none);
        settings.putDataLabelsPos(Asc.c_oAscChartDataLabelsPos.none);
        settings.putHorGridLines(Asc.c_oAscGridLinesSettings.major);
        settings.putVertGridLines(Asc.c_oAscGridLinesSettings.none);
        //settings.putInColumns(false);
        settings.putSeparator(",");
        settings.putLine(true);
        settings.putShowMarker(false);
        
        var vert_axis_settings = new AscCommon.asc_ValAxisSettings();
        settings.putVertAxisProps(vert_axis_settings);
        vert_axis_settings.setDefault();
        
        var hor_axis_settings = new AscCommon.asc_CatAxisSettings();
        settings.putHorAxisProps(hor_axis_settings);
        hor_axis_settings.setDefault();
        
        settings.left = left;
        settings.top = top;
        settings.width = right - left;
        settings.height = bottom - top;
        
        _api.asc_addChartDrawingObject(settings);
        
        if (objectRender.controller.selectedObjects.length) {
            objectId = objectRender.controller.selectedObjects[0].Id;
        }
        
        ws.setSelectionShape(true);
        
        return objectId;
    };
    
    this.offline_beforeInit = function () {

        // chat styles
        AscCommon.ChartPreviewManager.prototype.clearPreviews = function() {window["native"]["ClearCacheChartStyles"]();};
        AscCommon.ChartPreviewManager.prototype.createChartPreview = function(_graphics, type, styleIndex) {
            return AscFormat.ExecuteNoHistory(function(){
                                              
                                              if(!this.chartsByTypes[type])
                                              this.chartsByTypes[type] = this.getChartByType(type);
                                              
                                              var chart_space = this.chartsByTypes[type];
                                              AscFormat.ApplyPresetToChartSpace(chart_space, AscCommon.g_oChartPresets[type][styleIndex]);
                                              chart_space.recalcInfo.recalculateReferences = false;
                                              chart_space.recalculate();

                                              window["native"]["BeginDrawStyle"](AscCommon.c_oAscStyleImage.Default, type + '');

                                              chart_space.draw(_graphics);
                                              _graphics.ClearParams();
                                              
                                              window["native"]["EndDrawStyle"]();
                                              
                                              }, this, []);
        };
        
        AscCommon.ChartPreviewManager.prototype.getChartPreviews = function(chartType) {
            
            if (AscFormat.isRealNumber(chartType)) {
                
                var bIsCached = window["native"]["IsCachedChartStyles"](chartType);
                if (!bIsCached) {
                    
                    window["native"]["SetStylesType"](2);
                    
                    var _graphics = new CDrawingStream();
                    
                    if(AscCommon.g_oChartPresets[chartType]){
                        var nStylesCount = AscCommon.g_oChartPresets[chartType].length;
                        for(var i = 0; i < nStylesCount; ++i)
                            this.createChartPreview(_graphics, chartType, i);
                    }
                }
            }
        };
    };
    this.offline_afteInit = function () {window.AscAlwaysSaveAspectOnResizeTrack = true;};
}
var _s = new OfflineEditor();

window["native"]["offline_of"] = function(arg) {_s.openFile(arg);}
window["native"]["offline_stz"] = function(v) {_s.zoom = v; _api.asc_setZoom(v);}
window["native"]["offline_ds"] = function(x, y, width, height, ratio, istoplayer) {
    AscCommon.g_oTextMeasurer.Flush();
    
    _s.drawSheet(x, y, width, height, ratio, istoplayer);
}
window["native"]["offline_dh"] = function(x, y, width, height, ratio, type) {
    AscCommon.g_oTextMeasurer.Flush();
    
    _s.drawHeader(x, y, width, height, type, ratio);
}

window["native"]["offline_mouse_down"] = function(x, y, pin, isViewerMode, isFormulaEditMode, isRangeResize, isChartRange, 
                                                  indexRange, c1, r1, c2, r2, targetCol, targetRow,
                                                  typePin, beginX, beginY, endX, endY) {
    
    _s.isShapeAction = false;
    
    var ws = _api.wb.getWorksheet();
    var wb = _api.wb;
    
    _s._resizeWorkRegion(ws, x, y, true);
    
    var range = ws.visibleRange.clone();
    range.c1 = _s.col0;
    range.r1 = _s.row0;
    ws.visibleRange = range;

    ws._updateDrawingArea();
    var graphicsInfo = wb._onGetGraphicsInfo(x, y);
    if (graphicsInfo) {
        ws.endEditChart();
        window.AscDisableTextSelection = true;
        
        var e = {isLocked:true, Button:0, ClickCount:1, shiftKey:false, metaKey:false, ctrlKey:false};
        
        if (1 === typePin) {
            wb._onGraphicObjectMouseDown(e, beginX, beginY);
            wb._onGraphicObjectMouseUp(e, endX, endY);
            e.shiftKey = true;
        }
        
        if (-1 === typePin) {
            wb._onGraphicObjectMouseDown(e, endX, endY);
            wb._onGraphicObjectMouseUp(e, beginX, beginY);
            e.shiftKey = true;
        }
        
        wb._onGraphicObjectMouseDown(e, x, y);
        wb._onUpdateSelectionShape(true);
        
        _s.isShapeAction = true;
        ws.visibleRange = range;
        
        if (graphicsInfo.object && !graphicsInfo.object.graphicObject instanceof AscFormat.CChartSpace) {
            ws.isChartAreaEditMode = false;
        }
        
        if (!_s.enableTextSelection) {
            window.AscAlwaysSaveAspectOnResizeTrack = true;
        }
        
        var ischart = false;
        var isimage = false;
        var controller = ws.objectRender.controller;
        var selected_objects = controller.selection.groupSelection ? controller.selection.groupSelection.selectedObjects : controller.selectedObjects;
        if (selected_objects.length === 1 && selected_objects[0].getObjectType() === AscDFH.historyitem_type_ChartSpace) {
            ischart = true;
        }
        else if (selected_objects.length === 1 && selected_objects[0].getObjectType() === AscDFH.historyitem_type_Shape) {
            var shapeObj = selected_objects[0];
            if (shapeObj.spPr && shapeObj.spPr.geometry && shapeObj.spPr.geometry.preset === "line") {
                window.AscAlwaysSaveAspectOnResizeTrack = false;
            }
        }
        else if (selected_objects.length === 1 && selected_objects[0].getObjectType() === AscDFH.historyitem_type_ImageShape) {
            isimage = true;
        }
        
        return {id:graphicsInfo.id, ischart:ischart, isimage:isimage,
            'textselect':(null !== ws.objectRender.controller.selection.textSelection),
            'chartselect':(null !== ws.objectRender.controller.selection.chartSelection)
        };
    }
    
    _s.cellPin = pin;
    _s.isFormulaEditMode = isFormulaEditMode;
    
    var ct = ws.getCursorTypeFromXY(x, y);
    if (ct.target && ct.target === AscCommonExcel.c_oTargetType.FilterObject) {
        ws.af_setDialogProp(ct.idFilter);
        //var cell = offline_get_cell_in_coord(x, y);
        return {};
    }
    
    if (isRangeResize) {
        
        if (!isViewerMode) {
            
            var ct = ws.getCursorTypeFromXY(x, y);
            
            ws.startCellMoveResizeRange = null;
            
            var rangeChange = new window["Asc"].Range(c1, r1, c2, r2);
            var target = {
            formulaRange: rangeChange,
            row: ct.row,
            col: ct.col,
            target: ct.target,
            targetArr: isChartRange ? -1 : 0,
            cursor: "se-resize",
            indexFormulaRange: indexRange
            };
            ws.changeSelectionMoveResizeRangeHandle(x, y, target, wb.cellEditor);
        }
        
    } else {
        
        if (0 != _s.cellPin) {
            
            var selection = ws._getSelection();
            var lastRange = selection.getLast();
            
            ws.leftTopRange = lastRange.clone();
            
        } else {
            
            var ret = false;
            if (isFormulaEditMode) {
                ret = wb.cellEditor.canEnterCellRange();
                ret ? wb.cellEditor.activateCellRange() : true;
            }
            
            if (isFormulaEditMode && !ret) {
                _s.isFormulaEditMode = false;
                return {'action':'closeCellEditor'};
            }
            
            wb._onChangeSelection(true, x, y, true);
            
            if (isFormulaEditMode) {
                if (ret) {
                    ws.enterCellRange(wb.cellEditor);
                }
            }
        }
    }
    
    ws.visibleRange = range;
    
    return null;
}
window["native"]["offline_mouse_move"] = function(x, y, isViewerMode, isRangeResize, isChartRange, indexRange, c1, r1, c2, r2, targetCol, targetRow, textPin) {
    var ws = _api.wb.getWorksheet();
    var wb = _api.wb;
    
    var range =  ws.visibleRange.clone();
    range.c1 = _s.col0;
    range.r1 = _s.row0;
    ws.visibleRange = range;
    
    if (isRangeResize) {
        if (!isViewerMode) {
            var ct = ws.getCursorTypeFromXY(x, y);
            
            var rangeChange = new window["Asc"].Range(c1, r1, c2, r2);
            var target = {
                //formulaRange: rangeChange,
            row: isChartRange ? ct.row : targetRow,
            col: isChartRange ? ct.col : targetCol,
            target: ct.target,
            targetArr: isChartRange ? -1 : 0,
            cursor: "se-resize",
            indexFormulaRange: indexRange
            };
            ws.changeSelectionMoveResizeRangeHandle(x, y, target, wb.cellEditor);
        }
    } else {
        
        if (_s.isShapeAction) {
            if (!isViewerMode) {
                
                var e = {isLocked: true, Button: 0, ClickCount: 1, shiftKey: false, metaKey: false, ctrlKey: false};
                
                if (textPin && 0 == textPin["pin"]) {
                    wb._onGraphicObjectMouseDown(e, x, y);
                    wb._onGraphicObjectMouseUp(e, x, y);
                } else {
                    ws.objectRender.graphicObjectMouseMove(e, x, y);
                }
            }
        } else {
            if (_s.isFormulaEditMode) {
                
                var ret = false;
                ret = wb.cellEditor.canEnterCellRange();
                ret ? wb.cellEditor.activateCellRange() : true;
                
                if (!ret) {
                    _s.isFormulaEditMode = false;
                    ws.visibleRange = range;
                    return {'action':'closeCellEditor'};
                }
                
                wb._onChangeSelection(false, x, y, true);
                ws.enterCellRange(wb.cellEditor);
            } else {
                if (-1 == _s.cellPin)
                    ws.__changeSelectionPoint(x, y, true, true, true);
                else if (1 === _s.cellPin)
                    ws.__changeSelectionPoint(x, y, true, true, false);
                else {
                    wb._onChangeSelection(false, x, y, true);
                }
            }
        }
    }
    
    ws.visibleRange = range;
    
    return null;
}
window["native"]["offline_mouse_up"] = function(x, y, isViewerMode, isRangeResize, isChartRange, indexRange, c1, r1, c2, r2, targetCol, targetRow) {
    var ret = null;
    var ws = _api.wb.getWorksheet();
    var wb = _api.wb;
    
    var range =  ws.visibleRange.clone();
    range.c1 = _s.col0;
    range.r1 = _s.row0;
    ws.visibleRange = range;
    
    if (_s.isShapeAction) {
        var e = {isLocked: true, Button: 0, ClickCount: 1, shiftKey: false, metaKey: false, ctrlKey: false};
        wb._onGraphicObjectMouseUp(e, x, y);
        wb._onChangeSelectionDone(x, y);
        _s.isShapeAction = false;
        
        ret = {'isShapeAction': true};
        
    } else {
        
        if (isRangeResize) {
            if (!isViewerMode) {
                var target = {
                target: 5,
                targetArr: isChartRange ? -1 : 0,
                cursor: "se-resize",
                indexFormulaRange: indexRange
                };
                
                if (ws.moveRangeDrawingObjectTo) {
                    ws.moveRangeDrawingObjectTo.c1 = Math.max(0, ws.moveRangeDrawingObjectTo.c1);
                    ws.moveRangeDrawingObjectTo.c2 = Math.max(0, ws.moveRangeDrawingObjectTo.c2);
                    ws.moveRangeDrawingObjectTo.r1 = Math.max(0, ws.moveRangeDrawingObjectTo.r1);
                    ws.moveRangeDrawingObjectTo.r2 = Math.max(0, ws.moveRangeDrawingObjectTo.r2);
                }
                
                ws.applyMoveResizeRangeHandle(target);
                
                var controller = ws.objectRender.controller;
                controller.updateOverlay();
            }
        } else {
            
            wb._onChangeSelectionDone(-1, -1);
            _s.cellPin = 0;
            wb.getWorksheet().leftTopRange = undefined;
        }
    }
    
    ws.visibleRange = range;
    
    return ret;
}
window["native"]["offline_mouse_double_tap"] = function(x, y) {
    var ws = _api.wb.getWorksheet();
    var e = {isLocked:true, Button:0, ClickCount:2, shiftKey:false, metaKey:false, ctrlKey:false};
    
    ws.objectRender.graphicObjectMouseDown(e, x, y);
    ws.objectRender.graphicObjectMouseUp(e, x, y);
}
window["native"]["offline_shape_text_select"] = function() {
    var ws = _api.wb.getWorksheet();
    
    var controller = ws.objectRender.controller;
    
    window.AscDisableTextSelection = false;
    controller.startEditTextCurrentShape();
    
    _s.enableTextSelection = true;
}

window["native"]["offline_get_selection"] = function(x, y, width, height, autocorrection) {return _s.getSelection(x, y, width, height, autocorrection);}
window["native"]["offline_get_charts_ranges"] = function() {
    var ws = _api.wb.getWorksheet();
    
    var ranges = _api.wb.getWorksheet().__chartsRanges();
    var cattbbox = null;
    var serbbox = null;
    
    var chart;
    var controller = ws.objectRender.controller;
    var selected_objects = controller.selection.groupSelection ? controller.selection.groupSelection.selectedObjects : controller.selectedObjects;
    if (selected_objects.length === 1 && selected_objects[0].getObjectType() === AscDFH.historyitem_type_ChartSpace) {
        chart = selected_objects[0];
        ranges = ranges ? ranges : _api.wb.getWorksheet().__chartsRanges([chart.bbox.seriesBBox]);
        cattbbox = chart.bbox.catBBox ? _api.wb.getWorksheet().__chartsRanges([chart.bbox.catBBox]) : null;
        serbbox = chart.bbox.serBBox ? _api.wb.getWorksheet().__chartsRanges([chart.bbox.serBBox]) : null;
    }
    
    return {'ranges':ranges, 'cattbbox':cattbbox, 'serbbox':serbbox};
}
window["native"]["offline_get_worksheet_bounds"] = function() {return _s.getMaxBounds();}
window["native"]["offline_complete_cell"] = function(x, y) {return _s.getNearCellCoord(x, y);}
window["native"]["offline_keyboard_down"] = function(inputKeys) {
    var wb = _api.wb;
    var ws = _api.wb.getWorksheet();
    
    AscCommon.g_oTextMeasurer.Flush();
    
    var isFormulaEditMode = ws.isFormulaEditMode;
    ws.isFormulaEditMode = false;
    
    for (var i = 0; i < inputKeys.length; i += 3) {
        
        var operationCode = inputKeys[i];
        
        // TODO: commands for text in shape
        
        var codeKey = inputKeys[i + 2];
        
        if (100 == inputKeys[i + 1]) {
            
            var event = {which:codeKey,keyCode:codeKey,metaKey:false,altKey:false,ctrlKey:false,shiftKey:false, preventDefault:function(){}};
            
            if (6 === operationCode) {    // SELECT_ALL
                
                event.keyCode = 65;
                event.ctrlKey = true;
                ws.objectRender.graphicObjectKeyDown(event);
                
            } else if (3 === operationCode) {    // SELECT
                
                var content = ws.objectRender.controller.getTargetDocContent();
                
                content.MoveCursorLeft(false, true);
                content.MoveCursorRight(true, true);
                
                ws.objectRender.controller.updateSelectionState();
                ws.objectRender.controller.drawingObjects.sendGraphicObjectProps();
                
            } else {
                
                if (8 === codeKey || 13 === codeKey || 27 == codeKey) {
                    ws.objectRender.graphicObjectKeyDown(event);
                } else {
                    ws.objectRender.graphicObjectKeyPress(event);
                }
                
                if (27 == codeKey) {
                    window.AscDisableTextSelection = true;
                }
            }
        }
        else if (37 === codeKey)      // LEFT
            wb._onChangeSelection(true, -1, 0, false);
        else if (39 === codeKey)     // RIGHT
            wb._onChangeSelection(true, 1, 0, false);
        if (38 === codeKey)          // UP
            wb._onChangeSelection(true, 0, -1, false);
        else if (40 === codeKey)     // DOWN
            wb._onChangeSelection(true, 0, 1, false);
        else if (9 === codeKey)     // TAB
            wb._onChangeSelection(true, -1, 0, false);
        else if (13 === codeKey)     // ENTER
            wb._onChangeSelection(true, 0, 1, false);
    }
    
    ws.isFormulaEditMode = isFormulaEditMode;
}

window["native"]["offline_cell_editor_draw"] = function(width, height, ratio) {
    _null_object.width = width * ratio;
    _null_object.height = height * ratio;
    
    var wb = _api.wb;
    var cellEditor = _api.wb.cellEditor;
    cellEditor._draw();
    
    return [wb.cellEditor.left, wb.cellEditor.top, wb.cellEditor.right, wb.cellEditor.bottom,
            wb.cellEditor.curLeft, wb.cellEditor.curTop, wb.cellEditor.curHeight,
            cellEditor.textRender.chars.length];
}
window["native"]["offline_cell_editor_open"] = function(x, y, width, height, ratio, isSelectAll, isFormulaInsertMode, c1, r1, c2, r2)  {
    _null_object.width = width * ratio;
    _null_object.height = height * ratio;
    
    var wb = _api.wb;
    var ws = _api.wb.getWorksheet();
    
    var range =  ws.visibleRange.clone();
    ws.visibleRange.c1 = c1;
    ws.visibleRange.r1 = r1;
    ws.visibleRange.c2 = c2;
    ws.visibleRange.r2 = r2;
    
    wb.cellEditor.isSelectAll = isSelectAll;
    
    if (!isFormulaInsertMode) {
        
        var isFocus = undefined, isClearCell = undefined, isHideCursor = true, isQuickInput = false;
        
        var t = wb;
        
        var ws = t.getWorksheet();
        var activeCellRange = ws.getActiveCell(0, 0, false);
        var selectionRange = ws.model.selectionRange.clone();
        
        t.setCellEditMode(true);
        ws.setCellEditMode(true);
        ws.openCellEditor(t.cellEditor, /*cursorPos*/undefined, isFocus, isClearCell,
                          /*isHideCursor*/isHideCursor, /*isQuickInput*/isQuickInput, selectionRange);
        //t.input.disabled = false;

        t.Api.cleanSpelling();
        
        // Эвент на обновление состояния редактора
        t.cellEditor._updateEditorState();
    }
    
    ws.visibleRange = range;
}
window["native"]["offline_cell_editor_test_cells"] = function(x, y, width, height, ratio, isSelectAll, isFormulaInsertMode, c1, r1, c2, r2)  {
    _null_object.width = width * ratio;
    _null_object.height = height * ratio;
    
    var wb = _api.wb;
    var ws = _api.wb.getWorksheet();
    
    var range = ws.visibleRange.clone();
    ws.visibleRange.c1 = c1;
    ws.visibleRange.r1 = r1;
    ws.visibleRange.c2 = c2;
    ws.visibleRange.r2 = r2;
    
    wb.cellEditor.isSelectAll = isSelectAll;
    
    var editFunction = function() {
        window["native"]["openCellEditor"]();
    };
    
    var editLockCallback = function(res) {
        
        if (!res) {
            
            window["native"]["closeCellEditor"]();
            
            //t.setCellEditMode(false);
            //t.controller.setStrictClose(false);
            //t.controller.setFormulaEditMode(false);
            //ws.setCellEditMode(false);
            //ws.setFormulaEditMode(false);
            //t.input.disabled = true;
            
            // Выключаем lock для редактирования ячейки
            wb.collaborativeEditing.onStopEditCell();
            //t.cellEditor.close(false);
            wb._onWSSelectionChanged();
        }
    };
    
    // Стартуем редактировать ячейку
    wb.collaborativeEditing.onStartEditCell();
    if (ws._isLockedCells(ws.getActiveCell(0, 0, false), /*subType*/null, editLockCallback)) {
        editFunction();
    }
    
    wb.visibleRange = range;
}

window["native"]["offline_cell_editor_process_input_commands"] = function(sendArguments) {
    
    _null_object.width = width * ratio;
    _null_object.height = height * ratio;
    
    var wb = _api.wb;
    var cellEditor =  _api.wb.cellEditor;
    var operationCode, left,right, position, value, value2;
    
    var width  = sendArguments[0];
    var height = sendArguments[1];
    var ratio  = sendArguments[2];
    
    for (var i = 3; i < sendArguments.length; i += 4) {
        
        operationCode   = sendArguments[i + 0];
        value           = sendArguments[i + 1];
        value2          = sendArguments[i + 2];
        
        var event = {which:value,metaKey:undefined,ctrlKey:undefined};
        event.stopPropagation = function() {};
        event.preventDefault = function() {};
        
        switch (operationCode) {
                
                // KEY_DOWN
            case 0: {
                cellEditor._onWindowKeyDown(event);
                break;
            }
                
                // KEY_PRESS
            case 1: {
                cellEditor._onWindowKeyPress(event);
                break;
            }
                
                // MOVE
            case 2: {
                position = value;
                if (position < 0) {
                    cellEditor._moveCursor(position);
                } else {
                    cellEditor._moveCursor(kPosition, position);
                }
                break;
            }
                
                // SELECT
            case 3: {
                
                left = value;
                right = value2;
                
                cellEditor.cursorPos = left;
                cellEditor.selectionBegin = left;
                cellEditor.selectionEnd = right;
                
                break;
            }
                
                // PASTE
            case 4: {
                cellEditor.pasteText(sendArguments[i + 3]);
                break;
            }
                
                // 5 - REFRESH - noop command
                
                // SELECT_ALL
            case 6: {
                cellEditor._moveCursor(kBeginOfText);
                cellEditor._selectChars(kEndOfText);
                break;
            }
                
                // SELECT_WORD
            case 7: {
                
                cellEditor.isSelectMode = AscCommonExcel.c_oAscCellEditorSelectState.word;
                // Окончание слова
                var endWord = cellEditor.textRender.getNextWord(cellEditor.cursorPos);
                // Начало слова (ищем по окончанию, т.к. могли попасть в пробел)
                var startWord = cellEditor.textRender.getPrevWord(endWord);
                
                cellEditor._moveCursor(kPosition, startWord);
                cellEditor._selectChars(kPosition, endWord);
                
                break;
            }
                
                // DELETE_TEXT
            case 8: {
                cellEditor._removeChars(kPrevChar);
                break;
            }
        }
    }
    
    cellEditor._draw();
    
    return [cellEditor.left, cellEditor.top, cellEditor.right, cellEditor.bottom,
            cellEditor.curLeft, cellEditor.curTop, cellEditor.curHeight,
            cellEditor.textRender.chars.length];
}

window["native"]["offline_cell_editor_mouse_event"] = function(sendEvents) {
    
    var left, right;
    var cellEditor =  _api.wb.cellEditor;
    
    for (var i = 0; i < sendEvents.length; i += 5) {
        var event = {
        pageX:sendEvents[i + 1],
        pageY:sendEvents[i + 2],
        which: 1,
        shiftKey:sendEvents[i + 3],
        button:0
        };
        
        if (sendEvents[i + 3]) {
            if (-1 == sendEvents[i + 4]) {
                left = Math.min(cellEditor.selectionBegin, cellEditor.selectionEnd);
                right = Math.max(cellEditor.selectionBegin, cellEditor.selectionEnd);
                cellEditor.cursorPos = left;
                cellEditor.selectionBegin = right;
                cellEditor.selectionEnd = left;
                
                _s.textSelection = -1;
            }
            
            if (1 == sendEvents[i + 4]) {
                left = Math.min(cellEditor.selectionBegin, cellEditor.selectionEnd);
                right = Math.max(cellEditor.selectionBegin, cellEditor.selectionEnd);
                cellEditor.cursorPos = right;
                cellEditor.selectionBegin = left;
                cellEditor.selectionEnd = right;
                
                _s.textSelection = 1;
            }
        }
        
        if (0 === sendEvents[i + 0]) {
            var pos = cellEditor.cursorPos;
            left = cellEditor.selectionBegin;
            right = cellEditor.selectionEnd;
            
            cellEditor.clickCounter.clickCount = 1;
            
            cellEditor._onMouseDown(event);
            
            if (-1 === _s.textSelection) {
                cellEditor.cursorPos = Math.min(left - 1, cellEditor.cursorPos);
                cellEditor.selectionBegin = left;
                cellEditor.selectionEnd = Math.min(left - 1, cellEditor.selectionEnd);
            }
            else if (1 === _s.textSelection) {
                cellEditor.cursorPos = Math.max(left + 1, cellEditor.cursorPos);
                cellEditor.selectionBegin = left;
                cellEditor.selectionEnd = Math.max(left + 1, cellEditor.selectionEnd);
            }
            
        } else if (1 === sendEvents[i + 0]) {
            cellEditor._onMouseUp(event);
            _s.textSelection = 0;
        } else if (2 == sendEvents[i + 0]) {
            
            cellEditor._onMouseMove(event);
            
        } else if (3 == sendEvents[i + 0]) {
            cellEditor.clickCounter.clickCount = 2;
            cellEditor._onMouseDown(event);
            cellEditor._onMouseUp(event);
            cellEditor.clickCounter.clickCount = 0;
            
            _s.textSelection = 0;
        }
    }
    
    return [cellEditor.left, cellEditor.top, cellEditor.right, cellEditor.bottom,
            cellEditor.curLeft, cellEditor.curTop, cellEditor.curHeight,
            cellEditor.textRender.chars.length];
}
window["native"]["offline_cell_editor_close"] = function(x, y, width, height, ratio) {
    var e = {which: 13, shiftKey: false, metaKey: false, ctrlKey: false};
    
    var wb = _api.wb;
    var ws = _api.wb.getWorksheet();
    var cellEditor = wb.cellEditor;
    
    // TODO: SHOW POPUP
    
    var length = cellEditor.undoList.length;
    
    if (cellEditor.close(true)) {
        wb.getWorksheet().handlers.trigger('applyCloseEvent', e);
    } else {
        cellEditor.close();
        length = 0;
    }
    
    wb.collaborativeEditing.onStopEditCell();
    wb._onWSSelectionChanged()
    
    return {'undo': length};
}
window["native"]["offline_cell_editor_selection"] = function() {return _api.wb.cellEditor._drawSelection();}
window["native"]["offline_cell_editor_move_select"] = function(position) {_api.wb.cellEditor._moveCursor(kPosition, Math.min(position,cellEditor.textRender.chars.length));}
window["native"]["offline_cell_editor_select_range"] = function(from, to) {
    var cellEditor = _api.wb.cellEditor;
    
    cellEditor.cursorPos = from;
    cellEditor.selectionBegin = from;
    cellEditor.selectionEnd = to;
}

window["native"]["offline_get_cell_in_coord"] = function(x, y) {
    var worksheet = _api.wb.getWorksheet(),
    activeCell = worksheet.getActiveCell(x, y, true);
    
    return [
            activeCell.c1,
            activeCell.r1,
            activeCell.c2,
            activeCell.r2,
            worksheet._getColLeft(activeCell.c1),
            worksheet._getRowTop(activeCell.r1),
            worksheet._getColumnWidth(activeCell.c1),
            worksheet._getRowHeight(activeCell.r1) ];
}
window["native"]["offline_get_cell_coord"] = function(c, r) {
    var worksheet = _api.wb.getWorksheet();
    
    return [
            worksheet._getColLeft(c),
            worksheet._getRowTop(r),
            worksheet._getColumnWidth(c),
            worksheet._getRowHeight(r) ];
}
window["native"]["offline_get_header_sizes"] = function() {
    var worksheet = _api.wb.getWorksheet();
    return [worksheet.headersWidth, worksheet.headersHeight];
}
window["native"]["offline_get_graphics_object"] = function(x, y) {
    var ws = _api.wb.getWorksheet();
    ws._updateDrawingArea();
    
    var drawingInfo = ws.objectRender.checkCursorDrawingObject(x, y);
    if (drawingInfo) {
        return drawingInfo.id;
    }
    
    return null;
}
window["native"]["offline_get_selected_object"] = function() {
    var ws = _api.wb.getWorksheet();
    var selectedImages = ws.objectRender.getSelectedGraphicObjects();
    if (selectedImages && selectedImages.length)
        return selectedImages[0].Get_Id();
    
    return null;
}
window["native"]["offline_can_enter_cell_range"] = function() {return _api.wb.cellEditor.canEnterCellRange();}

window["native"]["offline_copy"] = function() {
    var worksheet = _api.wb.getWorksheet();
    var sBase64 = {};
    
    var dataBuffer = {};
    
    if (_api.wb.cellEditor.isOpened) {
        var v = _api.wb.cellEditor.copySelection();
        if (v) {
            dataBuffer.text = AscCommonExcel.getFragmentsText(v);
        }
    } else {
        
        var clipboard = {};
        clipboard.pushData = function(type, data) {
            
            if (AscCommon.c_oAscClipboardDataFormat.Text === type) {
                
                dataBuffer.text = data;
                
            } else if (AscCommon.c_oAscClipboardDataFormat.Internal === type) {
                
                if (null != data.drawingUrls && data.drawingUrls.length > 0) {
                    dataBuffer.drawingUrls = data.drawingUrls[0];
                }
                
                dataBuffer.sBase64 = data.sBase64;
            }
        }
        
        _api.asc_CheckCopy(clipboard, AscCommon.c_oAscClipboardDataFormat.Internal|AscCommon.c_oAscClipboardDataFormat.Text);
    }
    
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
}
window["native"]["offline_paste"] = function(params) {
    var type = params[0];
    var worksheet = _api.wb.getWorksheet();
    
    if (0 == type)
    {
        _api.asc_PasteData(AscCommon.c_oAscClipboardDataFormat.Text, params[1]);
    }
    else if (1 == type)
    {
        _s.offline_addImageDrawingObject([params[1], params[2],params[3]]);
    }
    else if (2 == type)
    {
        _api.asc_PasteData(AscCommon.c_oAscClipboardDataFormat.Internal, params[1]);
    }
}
window["native"]["offline_cut"] = function() {
    var worksheet = _api.wb.getWorksheet();
    
    var dataBuffer = {};
    
    if (_api.wb.cellEditor.isOpened) {
        var v = _api.wb.cellEditor.copySelection();
        if (v) {
            dataBuffer.text = AscCommonExcel.getFragmentsText(v);
            _api.wb.cellEditor.cutSelection();
        }
        
    } else {
        
        var clipboard = {};
        clipboard.pushData = function(type, data) {
            
            if (AscCommon.c_oAscClipboardDataFormat.Text === type) {
                
                dataBuffer.text = data;
                
            } else if (AscCommon.c_oAscClipboardDataFormat.Internal === type) {
                
                if (null != data.drawingUrls && data.drawingUrls.length > 0) {
                    dataBuffer.drawingUrls = data.drawingUrls[0];
                }
                
                dataBuffer.sBase64 = data.sBase64;
            }
        }
        
        _api.asc_CheckCopy(clipboard, AscCommon.c_oAscClipboardDataFormat.Internal|AscCommon.c_oAscClipboardDataFormat.Text);
        
        worksheet.emptySelection(Asc.c_oAscCleanOptions.All, true);
    }
    
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
}
window["native"]["offline_delete"] = function() {
    var e = {altKey: false,
    bubbles: true,
    cancelBubble: false,
    cancelable: true,
    charCode: 0,
    ctrlKey: false,
    defaultPrevented: false,
    detail: 0,
    eventPhase: 3,
    keyCode: 46,
    type: 'keydown',
    which: 46,
    preventDefault: function() {}
    };
    
    var stream = global_memory_stream_menu;
    stream["ClearNoAttack"]();
    
    var ws = _api.wb.getWorksheet();
    var graphicObjects = ws.objectRender.getSelectedGraphicObjects();
    if (graphicObjects.length) {
        if (ws.objectRender.graphicObjectKeyDown(e)) {
            stream["WriteLong"](1);    // SHAPE
            return stream;
        }
    }
    
    stream["WriteString"](0);
    
    var worksheet = _api.wb.getWorksheet();
    worksheet.emptySelection(Asc.c_oAscCleanOptions.Text);
    
    return stream;
}
window["native"]["offline_calculate_range"] = function(x, y, w, h) {
    var ws = _api.wb.getWorksheet();
    var range = _s._updateRegion(ws, x, y, w, h);
    
    range.c1 = range.columnBeg < 0 ? 0 : range.columnBeg;
    range.r1 = range.rowBeg < 0 ? 0 : range.rowBeg;
    range.c2 = range.columnEnd < 0 ? 0 : range.columnEnd;
    range.r2 = range.rowEnd < 0 ? 0 : range.rowEnd;
    
    return [1, range.c1, range.c2, range.r1, range.r2,
            ws._getColLeft(range.c1),
            ws._getRowTop(range.r1),
            ws._getColLeft(range.c2) + ws._getColumnWidth(range.c2),
            ws._getRowTop(range.r2)  + ws._getRowHeight(range.r1) ];
}
window["native"]["offline_calculate_complete_range"] = function(x, y, w, h) {
    var ws = _api.wb.getWorksheet();
    var range = _s._updateRegion(ws, x, y, w, h);
    
    range.c1 = range.columnBeg < 0 ? 0 : range.columnBeg;
    range.r1 = range.rowBeg < 0 ? 0 : range.rowBeg;
    range.c2 = range.columnEnd < 0 ? 0 : range.columnEnd;
    range.r2 = range.rowEnd < 0 ? 0 : range.rowEnd;
    
    var nativeToEditor = 1.0 / deviceScale;
    w = ( x + w ) * nativeToEditor + ws.headersWidth;
    h = ( y + h ) * nativeToEditor + ws.headersHeight;
    x = x * nativeToEditor + ws.headersWidth;
    y = y * nativeToEditor + ws.headersHeight;
    
    if (ws._getColLeft(range.c2) + ws._getColumnWidth(range.c2) > w) {
        range.c2--;
    }
    
    if (ws._getRowTop(range.r2)  + ws._getRowHeight(range.r1) > h) {
        range.r2--;
    }
    
    return [1, range.c1, range.c2, range.r1, range.r2,
            ws._getColLeft(range.c1),
            ws._getRowTop(range.r1),
            ws._getColLeft(range.c2) + ws._getColumnWidth(range.c2),
            ws._getRowTop(range.r2)  + ws._getRowHeight(range.r1)];
}

window["Asc"]["spreadsheet_api"].prototype.asc_nativeGetFileData = function() {
    var oBinaryFileWriter = new AscCommonExcel.BinaryFileWriter(this.wbModel);

    oBinaryFileWriter.Write(true);

    window["native"]["GetFileData"](
        oBinaryFileWriter.Memory.ImData.data, 
        oBinaryFileWriter.Memory.GetCurPosition());

    return true;
};

window["native"]["offline_apply_event"] = function(type,params) {
    var _borderOptions = Asc.c_oAscBorderOptions;
    var _stream = null;
    var _return = undefined;
    var _current = {pos: 0};
    var _continue = true;
    var _attr, _ret;
    
    switch (type) {
            
            // document interface
            
        case 3: // ASC_MENU_EVENT_TYPE_UNDO
        {
            AscCommon.g_oTextMeasurer.Flush();
            
            _api.asc_Undo();
            _s.asc_WriteAllWorksheets(true);
            break;
        }
        case 4: // ASC_MENU_EVENT_TYPE_REDO
        {
            AscCommon.g_oTextMeasurer.Flush();
            
            _api.asc_Redo();
            _s.asc_WriteAllWorksheets(true);
            break;
        }
            
        case 9: // ASC_MENU_EVENT_TYPE_IMAGE
        {
            var ws = _api.wb.getWorksheet();
            if (ws && ws.objectRender && ws.objectRender.controller) {
                var selectedImageProp =  ws.objectRender.controller.getGraphicObjectProps();
                
                var _imagePr =  new Asc.asc_CImgProperty();
                while (_continue)
                {
                    _attr = params[_current.pos++];
                    switch (_attr)
                    {
                        case 0:
                        {
                            _imagePr.CanBeFlow = params[_current.pos++];
                            break;
                        }
                        case 1:
                        {
                            _imagePr.Width = params[_current.pos++];
                            break;
                        }
                        case 2:
                        {
                            _imagePr.Height = params[_current.pos++];
                            break;
                        }
                        case 3:
                        {
                            _imagePr.WrappingStyle = params[_current.pos++];
                            break;
                        }
                        case 4:
                        {
                            _imagePr.Paddings = asc_menu_ReadPaddings(params, _current);
                            break;
                        }
                        case 5:
                        {
                            _imagePr.Position = asc_menu_ReadPosition(params, _current);
                            break;
                        }
                        case 6:
                        {
                            _imagePr.AllowOverlap = params[_current.pos++];
                            break;
                        }
                        case 7:
                        {
                            _imagePr.PositionH = asc_menu_ReadImagePosition(params, _current);
                            break;
                        }
                        case 8:
                        {
                            _imagePr.PositionV = asc_menu_ReadImagePosition(params, _current);
                            break;
                        }
                        case 9:
                        {
                            _imagePr.Internal_Position = params[_current.pos++];
                            break;
                        }
                        case 10:
                        {
                            _imagePr.ImageUrl = params[_current.pos++];
                            break;
                        }
                        case 11:
                        {
                            _imagePr.Locked = params[_current.pos++];
                            break;
                        }
                        case 12:
                        {
                            _imagePr.ChartProperties = asc_menu_ReadChartPr(params, _current);
                            break;
                        }
                        case 13:
                        {
                            _imagePr.ShapeProperties = asc_menu_ReadShapePr(params, _current);
                            break;
                        }
                        case 14:
                        {
                            {
                                var layer = params[_current.pos++];
                                _api.asc_setSelectedDrawingObjectLayer(layer);
                                return _return;
                            }
                            break;
                        }
                        case 15:
                        {
                            _imagePr.Group = params[_current.pos++];
                            break;
                        }
                        case 16:
                        {
                            _imagePr.fromGroup = params[_current.pos++];
                            break;
                        }
                        case 17:
                        {
                            _imagePr.severalCharts = params[_current.pos++];
                            break;
                        }
                        case 18:
                        {
                            _imagePr.severalChartTypes = params[_current.pos++];
                            break;
                        }
                        case 19:
                        {
                            _imagePr.severalChartStyles = params[_current.pos++];
                            break;
                        }
                        case 20:
                        {
                            _imagePr.verticalTextAlign = params[_current.pos++];
                            break;
                        }
                        case 21:
                        {
                            var urlSource = selectedImageProp[0].Value.ImageUrl;
                            if (urlSource) {
                                var bIsNeed = params[_current.pos++];
                                if (bIsNeed)
                                {
                                    var _originSize = window["native"]["GetOriginalImageSize"](urlSource);
                                    var _w = _originSize[0] * 25.4 / 96.0 / window["native"]["GetDeviceScale"]();
                                    var _h = _originSize[1] * 25.4 / 96.0 / window["native"]["GetDeviceScale"]();
                                    
                                    _imagePr.ImageUrl = undefined;
                                    
                                    _imagePr.Width = _w;
                                    _imagePr.Height = _h;
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
                
                ws.objectRender.controller.setGraphicObjectProps(_imagePr);
            }
            break;
        }
            
        case 12: // ASC_MENU_EVENT_TYPE_TABLESTYLES
        {
            var props = asc_ReadFormatTableInfo(params, _current);
            // console.log(JSON.stringify(props));
            
            AscCommon.AscBrowser.isRetina = true;
            AscCommon.AscBrowser.retinaPixelRatio = 2.0;
  
            window["native"]["SetStylesType"](1);
            _api.wb.getTableStyles(props);
                      
            AscCommon.AscBrowser.isRetina = false;
            AscCommon.AscBrowser.retinaPixelRatio = 1.0;
  
            break;
        }
            
        case 52: // ASC_MENU_EVENT_TYPE_INSERT_HYPERLINK
        {
            var props = asc_ReadCHyperLink(params, _current);
            _api.asc_insertHyperlink(props);
            break;
        }
        case 59: // ASC_MENU_EVENT_TYPE_REMOVE_HYPERLINK
        {
            _api.asc_removeHyperlink();
            break;
        }
            
        case 62: // ASC_MENU_EVENT_TYPE_SEARCH_FINDTEXT
        {
            var findOptions = new Asc.asc_CFindOptions();
            
            if (7 === params.length) {
                findOptions.asc_setFindWhat(params[0]);
                findOptions.asc_setScanForward(params[1]);
                findOptions.asc_setIsMatchCase(params[2]);
                findOptions.asc_setIsWholeCell(params[3]);
                findOptions.asc_setScanOnOnlySheet(params[4]);
                findOptions.asc_setScanByRows(params[5]);
                findOptions.asc_setLookIn(params[6]);
                
                _ret = _api.asc_findText(findOptions);
                _stream = global_memory_stream_menu;
                _stream["ClearNoAttack"]();
                if (_ret) {
                    _stream["WriteBool"](true);
                    _stream["WriteDouble2"](_ret[0]);
                    _stream["WriteDouble2"](_ret[1]);
                } else {
                    _stream["WriteBool"](false);
                    _stream["WriteDouble2"](0);
                    _stream["WriteDouble2"](0);
                }
                
                _return = _stream;
            }
            
            break;
        }
        case 63: // ASC_MENU_EVENT_TYPE_SEARCH_REPLACETEXT
        {
            var replaceOptions = new Asc.asc_CFindOptions();
            if (8 === params.length) {
                replaceOptions.asc_setFindWhat(params[0]);
                replaceOptions.asc_setReplaceWith(params[1]);
                replaceOptions.asc_setIsMatchCase(params[2]);
                replaceOptions.asc_setIsWholeCell(params[3]);
                replaceOptions.asc_setScanOnOnlySheet(params[4]);
                replaceOptions.asc_setScanByRows(params[5]);
                replaceOptions.asc_setLookIn(params[6]);
                replaceOptions.asc_setIsReplaceAll(params[7]);
                
                _api.asc_replaceText(replaceOptions);
            }
            break;
        }
            
        case 200: // ASC_MENU_EVENT_TYPE_DOCUMENT_BASE64
        {
            _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            _stream["WriteStringA"](_api.asc_nativeGetFileData());
            _return = _stream;
            break;
        }
        case 201: // ASC_MENU_EVENT_TYPE_DOCUMENT_CHARTSTYLES
        {
            AscCommon.AscBrowser.isRetina = true;
            AscCommon.AscBrowser.retinaPixelRatio = 2.0;
  
            _api.chartPreviewManager.getChartPreviews(parseInt(params));

            AscCommon.AscBrowser.isRetina = false;
            AscCommon.AscBrowser.retinaPixelRatio = 1.0;
  
            _return = global_memory_stream_menu;
            break;
        }
        case 202: // ASC_MENU_EVENT_TYPE_DOCUMENT_PDFBASE64
        {
            _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            _stream["WriteStringA"](_s.offline_print(params,_current));
            _return = _stream;
            break;
        }
            
        case 110: // ASC_MENU_EVENT_TYPE_CONTEXTMENU_COPY
        {
            _return = window["native"]["offline_copy"]();
            break;
        }
        case 111 : // ASC_MENU_EVENT_TYPE_CONTEXTMENU_CUT
        {
            _return = window["native"]["offline_cut"]();
            break;
        }
        case 112: // ASC_MENU_EVENT_TYPE_CONTEXTMENU_PASTE
        {
            window["native"]["offline_paste"](params);
            break;
        }
        case 113: // ASC_MENU_EVENT_TYPE_CONTEXTMENU_DELETE
        {
            _return = window["native"]["offline_delete"]();
            break;
        }
        case 114: // ASC_MENU_EVENT_TYPE_CONTEXTMENU_SELECT
        {
            //this.Call_Menu_Context_Select();
            break;
        }
            
            // add objects
            
        case 50:  // ASC_MENU_EVENT_TYPE_INSERT_IMAGE
        {
            _return = _s.offline_addImageDrawingObject(params);
            break;
        }
        case 53:  // ASC_MENU_EVENT_TYPE_INSERT_SHAPE
        {
            _return = _s.offline_addShapeDrawingObject(params);
            break;
        }
        case 400: // ASC_MENU_EVENT_TYPE_INSERT_CHART
        {
            _return = _s.offline_addChartDrawingObject(params);
            break;
        }
        case 450:   // ASC_MENU_EVENT_TYPE_GET_CHART_DATA
        {
            var chart = _api.asc_getWordChartObject();
            
            var _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            _stream["WriteStringA"](JSON.stringify(chart));
            _return = _stream;
            
            break;
        }
            
            // Cell interface
            
        case 2000: // ASC_SPREADSHEETS_EVENT_TYPE_SET_CELL_INFO
        {
            var borders = null;
            var border = null;
            var filterInfo = null;
            
            while (_continue) {
                _attr = params[_current.pos++];
                switch (_attr) {
                    case 0:
                    {
                        _api.asc_setCellAlign(params[_current.pos++]);
                        break;
                    }
                    case 1:
                    {
                        _api.asc_setCellVertAlign(params[_current.pos++]);
                        break;
                    }
                    case 2:
                    {
                        _api.asc_setCellFontName(params[_current.pos++]);
                        break;
                    }
                    case 3:
                    {
                        _api.asc_setCellFontSize(params[_current.pos++]);
                        break;
                    }
                    case 4:
                    {
                        _api.asc_setCellBold(params[_current.pos++]);
                        break;
                    }
                    case 5:
                    {
                        _api.asc_setCellItalic(params[_current.pos++]);
                        break;
                    }
                    case 6:
                    {
                        _api.asc_setCellUnderline(params[_current.pos++]);
                        break;
                    }
                    case 7:
                    {
                        _api.asc_setCellStrikeout(params[_current.pos++]);
                        break;
                    }
                    case 8:
                    {
                        _api.asc_setCellSubscript(params[_current.pos++]);
                        break;
                    }
                    case 9:
                    {
                        _api.asc_setCellSuperscript(params[_current.pos++]);
                        break;
                    }
                    case 10:
                    {
                        _api.asc_setCellTextColor(asc_menu_ReadColor(params, _current));
                        break;
                    }
                    case 11:
                    {
                        _api.asc_setCellTextWrap(params[_current.pos++]);
                        break;
                    }
                    case 12:
                    {
                        _api.asc_setCellTextShrink(params[_current.pos++]);
                        break;
                    }
                    case 13:
                    {
                        var fillColor = asc_menu_ReadColor(params, _current);
                        if (0.0 === fillColor.a) {
                            _api.asc_setCellBackgroundColor(null);
                        } else {
                            _api.asc_setCellBackgroundColor(fillColor);
                        }
                        break;
                    }
                    case 14:
                    {
                        _api.asc_setCellFormat(params[_current.pos++]);
                        break;
                    }
                    case 15:
                    {
                        _api.asc_setCellAngle(parseFloat(params[_current.pos++]));
                        break;
                    }
                    case 16:
                    {
                        _api.asc_setCellStyle(params[_current.pos++]);
                        break;
                    }
                        
                    case 20:
                    {
                        if (!borders) borders = [];
                        border = asc_ReadCBorder(params, _current);
                        if (border) {
                            borders[_borderOptions.Left] = border;
                        }
                        break;
                    }
                        
                    case 21:
                    {
                        if (!borders) borders = [];
                        border = asc_ReadCBorder(params, _current);
                        if (border && borders) {
                            borders[_borderOptions.Top] = border;
                        }
                        break;
                    }
                        
                    case 22:
                    {
                        if (!borders) borders = [];
                        border = asc_ReadCBorder(params, _current);
                        if (border && borders) {
                            borders[_borderOptions.Right] = border;
                        }
                        break;
                    }
                        
                    case 23:
                    {
                        if (!borders) borders = [];
                        border = asc_ReadCBorder(params, _current);
                        if (border && borders) {
                            borders[_borderOptions.Bottom] = border;
                        }
                        break;
                    }
                        
                    case 24:
                    {
                        if (!borders) borders = [];
                        border = asc_ReadCBorder(params, _current);
                        if (border && borders) {
                            borders[_borderOptions.DiagD] = border;
                        }
                        break;
                    }
                        
                    case 25:
                    {
                        if (!borders) borders = [];
                        border = asc_ReadCBorder(params, _current);
                        if (border && borders) {
                            borders[_borderOptions.DiagU] = border;
                        }
                        break;
                    }
                        
                    case 26:
                    {
                        if (!borders) borders = [];
                        border = asc_ReadCBorder(params, _current);
                        if (border && borders) {
                            borders[_borderOptions.InnerV] = border;
                        }
                        break;
                    }
                        
                    case 27:
                    {
                        if (!borders) borders = [];
                        border = asc_ReadCBorder(params, _current);
                        if (border && borders) {
                            borders[_borderOptions.InnerH] = border;
                        }
                        break;
                    }
                        
                    case 28:
                    {
                        _api.asc_setCellBorders([]);
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
            
            if (borders) {
                _api.asc_setCellBorders(borders);
            }
            
            break;
        }
        case 2010: // ASC_SPREADSHEETS_EVENT_TYPE_CELLS_MERGE_TEST
        {
            _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            
            var merged = _api.asc_getCellInfo().asc_getFlags().asc_getMerge();
            
            if (!merged && _api.asc_mergeCellsDataLost(params)) {
                _stream["WriteBool"](true);
            } else {
                _stream["WriteBool"](false);
            }
            
            _return = _stream;
            break;
        }
        case 2020: // ASC_SPREADSHEETS_EVENT_TYPE_CELLS_MERGE
        {
            _api.asc_mergeCells(params);
            break;
        }
        case 2030: // ASC_SPREADSHEETS_EVENT_TYPE_CELLS_FORMAT
        {
            _api.asc_setCellFormat(params);
            break;
        }
        case 2031: // ASC_SPREADSHEETS_EVENT_TYPE_CELLS_DECREASE_DIGIT_NUMBERS
        {
            _api.asc_decreaseCellDigitNumbers();
            break;
        }
        case 2032: // ASC_SPREADSHEETS_EVENT_TYPE_CELLS_ICREASE_DIGIT_NUMBERS
        {
            _api.asc_increaseCellDigitNumbers();
            break;
        }
        case 2040: // ASC_SPREADSHEETS_EVENT_TYPE_COLUMN_SORT_FILTER
        {
            if (params.length) {
                var typeF = parseInt(params[0]), cellId = '';
                if (2 === params.length)
                    cellId = params[1];
                _api.asc_sortColFilter(typeF, cellId);
            }
            break;
        }
        case 2050: // ASC_SPREADSHEETS_EVENT_TYPE_CLEAR_STYLE
        {
            _api.asc_emptyCells(params);
            break;
        }
            
            // Workbook interface
            
        case 2100: // ASC_SPREADSHEETS_EVENT_TYPE_WORKSHEETS_COUNT
        {
            _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            _stream["WriteLong"](_api.asc_getWorksheetsCount());
            _return = _stream;
            break;
        }
        case 2110: // ASC_SPREADSHEETS_EVENT_TYPE_GET_WORKSHEET
        {
            _stream = global_memory_stream_menu;
            _s.asc_writeWorksheet(params);
            _return = _stream;
            break
        }
        case 2120: // ASC_SPREADSHEETS_EVENT_TYPE_SET_WORKSHEET
        {
            var index = -1;
            while (_continue) {
                _attr = params[_current.pos++];
                switch (_attr) {
                    case 0: // index
                    {
                        index = (params[_current.pos++]);
                        break;
                    }
                    case 1: // name
                    {
                        var name = (params[_current.pos++]);
                        _api.asc_renameWorksheet(name);
                        _s.asc_WriteAllWorksheets(true);
                        break;
                    }
                    case 2: // color
                    {
                        var tabColor = asc_menu_ReadColor(params, _current);
                        _api.asc_setWorksheetTabColor(tabColor);
                        _s.asc_WriteAllWorksheets(true);
                        break;
                    }
                    case 4: // hidden
                    {
                        _api.asc_hideWorksheet();
                        _s.asc_WriteAllWorksheets(true);
                        break;
                    }
                        
                    case 5: // show gridlines
                    {
                        var isLines = _api.asc_getSheetViewSettings();
                        isLines.asc_setShowGridLines(params[_current.pos++]);
                        _api.asc_setDisplayGridlines(isLines.showGridLines);
                        _s.asc_WriteAllWorksheets(true);
                        break;
                    }
                        
                    case 6: // row col headers
                    {
                        var isHeaders = _api.asc_getSheetViewSettings();
                        isHeaders.asc_setShowRowColHeaders(params[_current.pos++]);
                        _api.asc_setDisplayHeadings(isHeaders.showRowColHeaders);
                        _s.asc_WriteAllWorksheets(true);
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
            break;
        }
        case 2130: // ASC_SPREADSHEETS_EVENT_TYPE_WORKSHEETS
        {
            _stream = global_memory_stream_menu;
            _s.asc_WriteAllWorksheets();
            _return = _stream;
            break;
        }
        case 2140: // ASC_SPREADSHEETS_EVENT_TYPE_ADD_WORKSHEET
        {
            _api.asc_addWorksheet(params);
            _s.asc_WriteAllWorksheets(true);
            break;
        }
        case 2150: // ASC_SPREADSHEETS_EVENT_TYPE_INSERT_WORKSHEET
        {
            _api.asc_insertWorksheet(params);
            _s.asc_WriteAllWorksheets(true);
            break;
        }
        case 2160: // ASC_SPREADSHEETS_EVENT_TYPE_DELETE_WORKSHEET
        {
            _api.asc_deleteWorksheet(params);
            _s.asc_WriteAllWorksheets(true);
            break;
        }
        case 2170: // ASC_SPREADSHEETS_EVENT_TYPE_COPY_WORKSHEET
        {
            if (params.length) {
                _api.asc_copyWorksheet(params[0], params[1]);  // where, newName
                _s.asc_WriteAllWorksheets(true);
            }
            
            break;
        }
        case 2180: // ASC_SPREADSHEETS_EVENT_TYPE_MOVE_WORKSHEET
        {
            _api.asc_moveWorksheet(params);
            _s.asc_WriteAllWorksheets(true);
            break;
        }
        case 2200: // ASC_SPREADSHEETS_EVENT_TYPE_SHOW_WORKSHEET
        {
            _api.asc_showWorksheet(params);
            break;
        }
        case 2201: // ASC_SPREADSHEETS_EVENT_TYPE_UNHIDE_WORKSHEET
        {
            _api.asc_showWorksheet(params);
            _s.asc_WriteAllWorksheets(true);
            break;
        }
        case 2205: // ASC_SPREADSHEETS_EVENT_TYPE_WORKSHEET_SHOW_LINES
        {
            _api.asc_setDisplayGridlines(params > 0);
            break;
        }
        case 2210: // ASC_SPREADSHEETS_EVENT_TYPE_WORKSHEET_SHOW_HEADINGS
        {
            _api.asc_setDisplayHeadings(params > 0);
            break;
        }
        case 2215: // ASC_SPREADSHEETS_EVENT_TYPE_SET_PAGE_OPTIONS
        {
            var pageOptions = asc_ReadPageOptions(params, _current);
            _api.asc_setPageOptions(pageOptions, pageOptions.pageIndex);
            break;
        }
            
        case 2400: // ASC_SPREADSHEETS_EVENT_TYPE_COMPLETE_SEARCH
        {
            _api.asc_endFindText();
            break;
        }
            
        case 2405: // ASC_SPREADSHEETS_EVENT_TYPE_CELL_STYLES
        {                    
            AscCommon.AscBrowser.isRetina = true;
            AscCommon.AscBrowser.retinaPixelRatio = 2.0;
           
            window["native"]["SetStylesType"](0);
            _api.wb.getCellStyles(92, 48);

            AscCommon.AscBrowser.isRetina = false;
            AscCommon.AscBrowser.retinaPixelRatio = 1.0;
            break;
        }
            
        case 2415: // ASC_SPREADSHEETS_EVENT_TYPE_CHANGE_COLOR_SCHEME
        {
            if (undefined !== params) {
                var indexScheme = parseInt(params);
                _api.asc_ChangeColorScheme(indexScheme);
            }
            break;
        }
            
        case 3000: // ASC_SPREADSHEETS_EVENT_TYPE_FILTER_ADD_AUTO
        {
            var filter = asc_ReadAutoFilter(params, _current);
            _api.asc_addAutoFilter(filter.styleName, filter.format);
            _api.wb.getWorksheet().handlers.trigger('selectionChanged');
            break;
        }
            
        case 3010: // ASC_SPREADSHEETS_EVENT_TYPE_AUTO_FILTER_CHANGE
        {
            var changeFilter = asc_ReadAutoFilter(params, _current);
            
            if (changeFilter && 'FALSE' === changeFilter.styleName) {
                changeFilter.styleName = false;
            }
            
            _api.asc_changeAutoFilter(changeFilter.tableName, changeFilter.optionType, changeFilter.styleName);
            _api.wb.getWorksheet().handlers.trigger('selectionChanged');
            break;
        }
            
        case 3020: // ASC_SPREADSHEETS_EVENT_TYPE_AUTO_FILTER_APPLY
        {
            var autoFilter = asc_ReadAutoFiltersOptions(params, _current);
            _api.asc_applyAutoFilter(autoFilter);
            break;
        }
            
        case 3040: // ASC_SPREADSHEETS_EVENT_TYPE_AUTO_FILTER_FORMAT_TABLE_OPTIONS
        {
            var formatOptions = _api.asc_getAddFormatTableOptions(params);
            _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            asc_WriteAddFormatTableOptions(formatOptions, _stream);
            _return = _stream;
            break;
        }
            
        case 3050: // ASC_SPREADSHEETS_EVENT_TYPE_FILTER_CLEAR
        {
            _api.asc_clearFilter();
            break;
        }
            
        case 4010: // ASC_SPREADSHEETS_EVENT_TYPE_INSERT_FORMULA
        {
            if (params && params.length && params[0]) {
                _api.asc_insertFormula(params[0], Asc.c_oAscPopUpSelectorType.Func, params[1]);
            }
            break;
        }
            
        case 4020: // ASC_SPREADSHEETS_EVENT_TYPE_GET_FORMULAS
        {
            _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            
            var info = _api.asc_getFormulasInfo();
            if (info) {
                _stream["WriteLong"](info.length);
                
                for (var i = 0; i < info.length; ++i) {
                    _stream["WriteString2"](info[i].asc_getGroupName());
                    
                    var ascFunctions = info[i].asc_getFormulasArray();
                    _stream["WriteLong"](ascFunctions.length);
                    
                    for (var j = 0; j < ascFunctions.length; ++j) {
                        _stream["WriteString2"](ascFunctions[j].asc_getName());
                        _stream["WriteString2"]("");
                    }
                }
            } else {
                _stream["WriteLong"](0);
            }
            
            if (undefined !== params) {
                var localizeData = JSON.parse(params);
                _api.asc_setLocalization(localizeData);
            }
            
            _return = _stream;
            
            break;
        }
            
        case 5000: // ASC_SPREADSHEETS_EVENT_TYPE_GO_LINK_TYPE_INTERNAL_DATA_RANGE
        {
            var cellX = params[0];
            var cellY = params[1];
            var ws = _api.wb.getWorksheet();
            var ct = ws.getCursorTypeFromXY(cellX, cellY);
            
            var curIndex = _api.asc_getActiveWorksheetIndex();
            
            if (AscCommonExcel.c_oTargetType.Hyperlink === ct.target) {
                _api._asc_setWorksheetRange(ct.hyperlink);
            }
            
            _stream = global_memory_stream_menu;
            
            _stream["ClearNoAttack"]();
            _stream["WriteBool"](!(curIndex === _api.asc_getActiveWorksheetIndex()));
            
            _return = _stream;
            break;
        }
            
        case 6000: // ASC_SPREADSHEETS_EVENT_TYPE_CONTEXTMENU_CLEAR_ALL:
        {
            _api.asc_emptyCells(Asc.c_oAscCleanOptions.All);
            break;
        }
            
        case 6010: // ASC_SPREADSHEETS_EVENT_TYPE_CONTEXTMENU_CLEAR_TEXT
        {
            _api.asc_emptyCells(Asc.c_oAscCleanOptions.Text);
            break;
        }
            
        case 6020: // ASC_SPREADSHEETS_EVENT_TYPE_CONTEXTMENU_CLEAR_FORMAT
        {
            _api.asc_emptyCells(Asc.c_oAscCleanOptions.Format);
            break;
        }
            
        case 6030: // ASC_SPREADSHEETS_EVENT_TYPE_CONTEXTMENU_CLEAR_COMMENTS
        {
            _api.asc_emptyCells(Asc.c_oAscCleanOptions.Comments);
            break;
        }
            
        case 6040: // ASC_SPREADSHEETS_EVENT_TYPE_CONTEXTMENU_CLEAR_HYPERLINKS
        {
            _api.asc_emptyCells(Asc.c_oAscCleanOptions.Hyperlinks);
            break;
        }
            
        case 6050: // ASC_SPREADSHEETS_EVENT_TYPE_CONTEXTMENU_INSERT_LEFT
        {
            _api.asc_insertCells(Asc.c_oAscInsertOptions.InsertColumns);
            break;
        }
            
        case 6060: // ASC_SPREADSHEETS_EVENT_TYPE_CONTEXTMENU_INSERT_TOP
        {
            _api.asc_insertCells(Asc.c_oAscInsertOptions.InsertRows);
            break;
        }
            
        case 6070: // ASC_SPREADSHEETS_EVENT_TYPE_CONTEXTMENU_DELETE_COLUMNES
        {
            _api.asc_deleteCells(Asc.c_oAscDeleteOptions.DeleteColumns);
            break;
        }
            
        case 6080: // ASC_SPREADSHEETS_EVENT_TYPE_CONTEXTMENU_DELETE_ROWS
        {
            _api.asc_deleteCells(Asc.c_oAscDeleteOptions.DeleteRows);
            break;
        }
            
        case 6090: // ASC_SPREADSHEETS_EVENT_TYPE_CONTEXTMENU_SHOW_COLUMNES
        {
            (0 != params) ? _api.asc_showColumns() : _api.asc_hideColumns();
            break;
        }
            
        case 6100: // ASC_SPREADSHEETS_EVENT_TYPE_CONTEXTMENU_SHOW_ROWS
        {
            (0 != params) ? _api.asc_showRows() : _api.asc_hideRows();
            break;
        }
            
        case 6190: // ASC_SPREADSHEETS_EVENT_TYPE_CONTEXTMENU_FREEZE_PANES
        {
            
            break;
        }
            
        case 7001: // ASC_SPREADSHEETS_EVENT_TYPE_CHECK_DATA_RANGE
        {
            var isValid = _api.asc_checkDataRange(parseInt(params[0]), params[1], params[2], params[3], parseInt(params[4]));
            
            _stream = global_memory_stream_menu;
            _stream["ClearNoAttack"]();
            _stream["WriteLong"](isValid);
            _return = _stream;
            break;
        }
            
        case 7005: // ASC_SPREADSHEETS_EVENT_TYPE_GET_CHART_SETTINGS
        {
            var chartSettings = _api.asc_getChartObject();
            if (chartSettings) {
                _stream = global_memory_stream_menu;
                _stream["ClearNoAttack"]();
                
                asc_menu_WriteChartPr(12, chartSettings, _stream);
                _return = _stream;
            }
            break;
        }
            
        case 7010: // ASC_SPREADSHEETS_EVENT_TYPE_SET_COLUMN_WIDTH
        {
            var width = params[0];
            var fromColumn = params[1];
            var toColumn = params[2];
            
            var ws = _api.wb.getWorksheet();
            ws.changeColumnWidth(toColumn, width, 0);
            break;
        }
            
        case 7020: // ASC_SPREADSHEETS_EVENT_TYPE_SET_ROW_HEIGHT
        {
            var height = params[0];
            var fromRow = params[1];
            var toRow = params[2];
            
            var ws = _api.wb.getWorksheet();
            ws.changeRowHeight(toRow, height, 0);
            break;
        }
            
        case 10000: // ASC_SOCKET_EVENT_TYPE_OPEN
        {
            _api.CoAuthoringApi._CoAuthoringApi._onServerOpen();
            break;
        }
            
        case 10010: // ASC_SOCKET_EVENT_TYPE_ON_CLOSE
        {
            
            break;
        }
            
        case 10020: // ASC_SOCKET_EVENT_TYPE_MESSAGE
        {
            _api.CoAuthoringApi._CoAuthoringApi._onServerMessage(params);
            break;
        }
            
        case 11010: // ASC_SOCKET_EVENT_TYPE_ON_DISCONNECT
        {
            break;
        }
            
        case 11020: // ASC_SOCKET_EVENT_TYPE_TRY_RECONNECT
        {
            _api.CoAuthoringApi._CoAuthoringApi._reconnect();
            break;
        }
            
        case 21000: // ASC_COAUTH_EVENT_TYPE_INSERT_URL_IMAGE
        {
            var urls = JSON.parse(params[0]);
            AscCommon.g_oDocumentUrls.addUrls(urls);
            var firstUrl;
            for (var i in urls) {
                if (urls.hasOwnProperty(i)) {
                    firstUrl = urls[i];
                    break;
                }
            }
            
            params[0] = firstUrl;
            _return = _s.offline_addImageDrawingObject(params);
            
            break;
        }
            
        case 22000: // ASC_MENU_EVENT_TYPE_ADVANCED_OPTIONS
        {
            var obj = JSON.parse(params);
            var type = parseInt(obj["type"]);
            var encoding = parseInt(obj["encoding"]);
            var delimiter = parseInt(obj["delimiter"]);
            
            _api.advancedOptionsAction = AscCommon.c_oAscAdvancedOptionsAction.Open;
            _api.documentFormat = "csv";
            
            _api.asc_setAdvancedOptions(type, new Asc.asc_CTextOptions(encoding, delimiter, null));
            
            break;
        }
            
        case 22001: // ASC_MENU_EVENT_TYPE_SET_PASSWORD
        {
            _api.asc_setDocumentPassword(params[0]);
            break;
        }
            
        default:
            break;
    }
    
    return _return;
}

window["Asc"]["spreadsheet_api"].prototype.asc_setDocumentPassword = function(password)
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

function testLockedObjects () {
    
    var ws = _api.wb.getWorksheet();
    var objectRender = ws.objectRender;
    var aObjects = ws.model.Drawings;
    
    var overlay = objectRender.getDrawingCanvas().autoShapeTrack;
    if (!overlay)
        return;
    var drawingArea = objectRender.drawingArea;
    overlay.Native["PD_DrawLockedObjectsBegin"]();
    
    for (var i = 0; i < aObjects.length; i++) {
        var drawingObject = aObjects[i];
        
        if (drawingObject.isGraphicObject()) {
            ws._updateDrawingArea();
            
            for (var j = 0; j < drawingArea.frozenPlaces.length; ++j) {
                if (drawingArea.frozenPlaces[j].isObjectInside(drawingObject)) {
                    
                    // Lock
                    if ( (drawingObject.graphicObject.lockType != undefined) && (drawingObject.graphicObject.lockType != AscCommon.c_oAscLockTypes.kLockTypeNone) ) {
                        overlay.transform3(drawingObject.graphicObject.transform, false, "PD_LockObjectTransform");
                        overlay.Native["PD_DrawLockObjectRect"](drawingObject.graphicObject.lockType, 0, 0, drawingObject.graphicObject.extX, drawingObject.graphicObject.extY);
                    }
                }
            }
        }
    }
    
    if ( ws.collaborativeEditing.getCollaborativeEditing() ) {
        ws._drawCollaborativeElementsMeOther(AscCommon.c_oAscLockTypes.kLockTypeMine, overlay);
        ws._drawCollaborativeElementsMeOther(AscCommon.c_oAscLockTypes.kLockTypeOther, overlay);
        ws._drawCollaborativeElementsAllLock(overlay);
    }
    
    overlay.Native["PD_DrawLockedObjectsEnd"]();
}

window["AscCommonExcel"].WorksheetView.prototype._drawCollaborativeElementsMeOther = function (type, overlay) {
    var currentSheetId = this.model.getId(), i, strokeColor, arrayCells, oCellTmp;
    
    if (!currentSheetId)
        return;
    
    if (AscCommon.c_oAscLockTypes.kLockTypeMine === type) {
        strokeColor = AscCommonExcel.c_oAscCoAuthoringMeBorderColor;
        arrayCells = this.collaborativeEditing.getLockCellsMe(currentSheetId);
        
        arrayCells = arrayCells.concat(this.collaborativeEditing.getArrayInsertColumnsBySheetId(currentSheetId));
        arrayCells = arrayCells.concat(this.collaborativeEditing.getArrayInsertRowsBySheetId(currentSheetId));
    } else {
        strokeColor = AscCommonExcel.c_oAscCoAuthoringOtherBorderColor;
        arrayCells = this.collaborativeEditing.getLockCellsOther(currentSheetId);
    }
    
    var sheetId = this.model.getId();
    if (!sheetId)
        return;
    
    for (i = 0; i < arrayCells.length; ++i) {
        
        var left = this._getColLeft(arrayCells[i].c1), top = this._getRowTop(arrayCells[i].r1);
        
        var userId = "";
        if (AscCommon.c_oAscLockTypes.kLockTypeMine !== type) {
            var lockInfo = this.collaborativeEditing.getLockInfo(AscCommonExcel.c_oAscLockTypeElem.Range,
                                                                 null,
                                                                 sheetId,
                                                                 new AscCommonExcel.asc_CCollaborativeRange(arrayCells[i].c1, arrayCells[i].c2, arrayCells[i].c2, arrayCells[i].r2));
            var isLocked = this.collaborativeEditing.getLockIntersection(lockInfo, AscCommon.c_oAscLockTypes, AscCommon.c_oAscLockTypes.kLockTypeOther, false);
            if (false !== isLocked) {
                userId = isLocked.UserId;
            }
        }
        
        overlay.Native["PD_DrawLockCell"](arrayCells[i].c1,
                                          arrayCells[i].r1,
                                          Math.min(arrayCells[i].c2, this.nColsCount - 1),
                                          Math.min(arrayCells[i].r2, this.nRowsCount - 1),
                                          left,
                                          top,
                                          this._getColumnWidth(Math.min(arrayCells[i].c2, this.nColsCount - 1)) + this._getColLeft(Math.min(arrayCells[i].c2, this.nColsCount - 1)) - left,
                                          this._getRowHeight(Math.min(arrayCells[i].r2, this.nRowsCount - 1)) + this._getRowTop(Math.min(arrayCells[i].r2, this.nRowsCount - 1)) - top,
                                          strokeColor.r,
                                          strokeColor.g,
                                          strokeColor.b,
                                          strokeColor.a,
                                          userId);
    }
};

window["AscCommonExcel"].WorksheetView.prototype._drawCollaborativeElementsAllLock = function (overlay) {
    var currentSheetId = this.model.getId();
    if (!currentSheetId)
        return;
    
    var nLockAllType = this.collaborativeEditing.isLockAllOther(currentSheetId);
    if (Asc.c_oAscMouseMoveLockedObjectType.None !== nLockAllType) {
        var isAllRange = true, strokeColor = (Asc.c_oAscMouseMoveLockedObjectType.TableProperties === nLockAllType) ?
        AscCommonExcel.c_oAscCoAuthoringLockTablePropertiesBorderColor :
        AscCommonExcel.c_oAscCoAuthoringOtherBorderColor, oAllRange = new window["Asc"].Range(0, 0, AscCommon.gc_nMaxCol0, AscCommon.gc_nMaxRow0);
        
        var left = this._getColLeft(oAllRange.c1), top = this._getRowTop(oAllRange.r1);
        
        var sheetId = this.model.getId();
        if (!sheetId)
            return;
        
        var userId = "";
        var lockInfo = this.collaborativeEditing.getLockInfo(AscCommonExcel.c_oAscLockTypeElem.Range,
                                                             null,
                                                             sheetId,
                                                             new AscCommonExcel.asc_CCollaborativeRange(oAllRange.c1, oAllRange.c2, oAllRange.c2, oAllRange.r2));
        var isLocked = this.collaborativeEditing.getLockIntersection(lockInfo, AscCommon.c_oAscLockTypes, AscCommon.c_oAscLockTypes.kLockTypeOther, false);
        if (false !== isLocked) {
            userId = isLocked.UserId;
        }
        
        overlay.Native["PD_DrawLockCell"](oAllRange.c1,
                                          oAllRange.r1,
                                          Math.min(oAllRange.c2, this.nColsCount - 1),
                                          Math.min(oAllRange.r2, this.nRowsCount - 1),
                                          left,
                                          top,
                                          this._getColumnWidth(Math.min(oAllRange.c2, this.nColsCount - 1)) + this._getColLeft(Math.min(oAllRange.c2, this.nColsCount - 1)) - left,
                                          this._getRowHeight(Math.min(oAllRange.r2, this.nRowsCount - 1)) + this._getRowTop(Math.min(oAllRange.r2, this.nRowsCount - 1)) - top,
                                          strokeColor.r,
                                          strokeColor.g,
                                          strokeColor.b,
                                          strokeColor.a,
                                          userId);
    }
};

window["AscCommonExcel"].WorksheetView.prototype._drawCollaborativeElements = function(overlay) {
    if (this.collaborativeEditing.getCollaborativeEditing()) {
        this._drawCollaborativeElementsMeOther(AscCommon.c_oAscLockTypes.kLockTypeMine, overlay);
        this._drawCollaborativeElementsMeOther(AscCommon.c_oAscLockTypes.kLockTypeOther, overlay);
        this._drawCollaborativeElementsAllLock(AscCommon.overlay);
    }
};

window["Asc"]["spreadsheet_api"].prototype.openDocument = function(file) {
    
    var t = this;
    
    setTimeout(function() {
               
               //console.log("JS - openDocument()");
               
               t._openDocument(file.data);
               
               var thenCallback = function() {
               t.wb = new AscCommonExcel.WorkbookView(t.wbModel, t.controller, t.handlers,
                                                      window["_null_object"], window["_null_object"], t,
                                                      t.collaborativeEditing, t.fontRenderingMode);
               };
               
               t.openDocumentFromZip(t.wbModel, window["native"]["GetXlsxPath"]()).then(thenCallback, thenCallback);
               
               if (!sdkCheck) {
               
               //console.log("OPEN FILE ONLINE");
               
               t.wb.showWorksheet(undefined, true);
               
               var ws = t.wb.getWorksheet();
               window["native"]["onEndLoadingFile"](ws.headersWidth, ws.headersHeight);
               
               _s.asc_WriteAllWorksheets(true);
               
               return;
               }
               
               t.asc_CheckGuiControlColors();
               t.sendColorThemes(_api.wbModel.theme);
               t.asc_ApplyColorScheme(false);
               
               t.sendStandartTextures();
               
               //console.log("JS - applyFirstLoadChanges() before");
               
               t._applyPreOpenLocks();
               // Применяем пришедшие при открытии изменения
               t._applyFirstLoadChanges();
               // Go to if sent options
               var options = t.DocInfo && t.DocInfo.asc_getOptions();
               t.goTo(options && options["action"]);

               t.isDocumentLoadComplete = true;
               
               // Меняем тип состояния (на никакое)
               t.advancedOptionsAction = AscCommon.c_oAscAdvancedOptionsAction.None;
               
               // Были ошибки при открытии, посылаем предупреждение
               if (0 < t.wbModel.openErrors.length) {
               t.sendEvent('asc_onError', c_oAscError.ID.OpenWarning, c_oAscError.Level.NoCritical);
               }
               
               //console.log("JS - applyFirstLoadChanges() after");
               
               setTimeout(function() {
                          
                          t.wb.showWorksheet(undefined, true);
                          //console.log("JS - showWorksheet()");
                          
                          var ws = t.wb.getWorksheet();
                          //console.log("JS - getWorksheet()");
                          
                          window["native"]["onEndLoadingFile"](ws.headersWidth, ws.headersHeight);
                          //console.log("JS - onEndLoadingFile()");
                          
                          _s.asc_WriteAllWorksheets(true);
                          
                          setInterval(function() {
                                      
                                      _api._autoSave();
                                      
                                      testLockedObjects();
                                      
                                      }, 100);
                          
                          //console.log("JS - openDocument()");
                          
                          }, 5);
               
               }, 5);
};

window["AscCommon"].getFullImageSrc2 = function (src) {
    
    var start = src.slice(0, 6);
    if (0 === start.indexOf('theme') && editor.ThemeLoader){
        return  editor.ThemeLoader.ThemesUrlAbs + src;
    }
    
    if (0 !== start.indexOf('http:') && 0 !== start.indexOf('data:') && 0 !== start.indexOf('https:') &&
        0 !== start.indexOf('file:') && 0 !== start.indexOf('ftp:')){
        var srcFull = AscCommon.g_oDocumentUrls.getImageUrl(src);
        if(srcFull){
            window["native"]["loadUrlImage"](srcFull, src);
            return srcFull;
        }
    }
    
    return src;
}
