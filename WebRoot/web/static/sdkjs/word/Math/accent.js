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

// Import
var g_oTextMeasurer = AscCommon.g_oTextMeasurer;

// 0x300  accent grave
// 0x301  accent acute
// 0x307  one dot
// 0x308  two dots
// 0x20DB three dots
// 0x332  single line
// 0x333  double line
// 0x303  tilde
// 0x302  circumflex
// 0x306  breve
// 0x20D6 left arrow
// 0x20D7 right arrow
// 0x20D0 half left arrow (harpoon)
// 0x20D1 half right arrow (harpoon)

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CAccentCircumflex()
{
    CGlyphOperator.call(this);
}
CAccentCircumflex.prototype = Object.create(CGlyphOperator.prototype);
CAccentCircumflex.prototype.constructor = CAccentCircumflex;
CAccentCircumflex.prototype.calcSize = function(stretch)
{
    var alpha = this.Parent.Get_TxtPrControlLetter().FontSize/36;

    var width = 3.88*alpha;
    var height = 3.175*alpha;

    var augm = 0.8*stretch/width;

    if(augm < 1)
        augm = 1;
    else if (augm > 5)
        augm = 5;

    width *= augm;

    return {width: width, height: height};
};
CAccentCircumflex.prototype.calcCoord = function(stretch)
{
    var fontSize = this.Parent.Get_TxtPrControlLetter().FontSize;
    //var penW = fontSize*g_dKoef_pt_to_mm*this.PEN_W;
    //penW *= 96/25.4;

    // g_dKoef_px_to_mm = 25.4/96


    var textScale = fontSize/1000, // 1000 pt
        alpha = textScale*25.4/96 /64;

    var X = [],
        Y = [];

    X[0] = 0; Y[0] = 2373;
    X[1] = 9331; Y[1] = 15494;
    X[2] = 14913; Y[2] = 15494;
    X[3] = 23869; Y[3] = 2373;
    X[4] = 20953; Y[4] = 0;
    X[5] = 12122; Y[5] = 10118;
    X[6] = 11664; Y[6] = 10118;
    X[7] = 2833; Y[7] = 0;
    X[8] = 0; Y[8] = 2373;


    var XX = [],
        YY = [];

    var W = stretch/alpha;

    var a1 = X[3] - X[0], b1 = W,            c1 = X[2] - X[1],
        a2 = X[4] - X[7], b2 = W - 2*X[7],   c2 = X[5] - X[6] ; //X[8] = 0


    var RX = [];
    for(var i = 0; i < X.length; i++)
        RX[i] = 1;

    RX[0] = RX[2] = (b1 - c1)/(a1-c1);
    RX[4] = RX[6] =  (b2 - c2)/(a2-c2);


    XX[0] = XX[8] = X[0];
    YY[0] = YY[8] = Y[0];

    for(var i = 0; i< 4; i++)
    {
        XX[1 + i] = XX[i] + RX[i]*(X[1+i] - X[i]);
        XX[7-i]   = XX[8 - i] + RX[7-i]*(X[7-i] - X[8-i]);
        YY[1+i] = Y[1+i];
        YY[7-i] = Y[7-i];
    }

    for(var i = 0; i < XX.length; i++)
    {
        XX[i] = XX[i]*alpha ;
        YY[i] = YY[i]*alpha;
    }

    var H = YY[1];
    W = XX[3];

    return {XX: XX, YY: YY, W: W, H: H};
};
CAccentCircumflex.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._l(XX[1], YY[1]);
    pGraphics._l(XX[2], YY[2]);
    pGraphics._l(XX[3], YY[3]);
    pGraphics._l(XX[4], YY[4]);
    pGraphics._l(XX[5], YY[5]);
    pGraphics._l(XX[6], YY[6]);
    pGraphics._l(XX[7], YY[7]);
    pGraphics._l(XX[8], YY[8]);
    pGraphics._l(XX[9], YY[9]);
    pGraphics._l(XX[10], YY[10]);
    pGraphics._l(XX[11], YY[11]);
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CAccentLine()
{
    CGlyphOperator.call(this);
}
CAccentLine.prototype = Object.create(CGlyphOperator.prototype);
CAccentLine.prototype.constructor = CAccentLine;
CAccentLine.prototype.calcSize = function(stretch)
{
    var alpha = this.Parent.Get_TxtPrControlLetter().FontSize/36;

    var height = 1.68*alpha;
    var width  = 4.938*alpha;

    width = stretch > width ? stretch : width;

    return {width: width, height: height};
};
CAccentLine.prototype.draw = function(x, y, pGraphics)
{
    var fontSize = this.Parent.Get_TxtPrControlLetter().FontSize;

    var penW = fontSize*0.0166;
    var x1 = x + 0.26458,
        x2 = x +  this.stretch - 0.26458;

    pGraphics.drawHorLine(0, y, x1, x2, penW);
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CAccentDoubleLine()
{
    CGlyphOperator.call(this);
}
CAccentDoubleLine.prototype = Object.create(CGlyphOperator.prototype);
CAccentDoubleLine.prototype.constructor = CAccentDoubleLine;
CAccentDoubleLine.prototype.calcSize = function(stretch)
{
    var alpha = this.Parent.Get_TxtPrControlLetter().FontSize/36;

    var height = 2.843*alpha;
    var width  = 4.938*alpha;

    width = stretch > width ? stretch : width;

    var Line = new CMathText(true);
    Line.add(0x305);
    Line.Measure(g_oTextMeasurer);

    var DoubleLine = new CMathText(true);
    DoubleLine.add(0x33F);
    DoubleLine.Measure(g_oTextMeasurer);

    return {width: width, height: height};
};
CAccentDoubleLine.prototype.draw = function(x, y, pGraphics)
{
    var fontSize = this.Parent.Get_TxtPrControlLetter().FontSize;

    var diff = fontSize*0.05;

    var penW = fontSize*0.0166;

    var x1 = x + 0.26458,
        x2 = x +  this.stretch - 0.26458,
        y1 = y,
        y2 = y + diff;

    pGraphics.drawHorLine(0, y1, x1, x2, penW);

    pGraphics.drawHorLine(0, y2, x1, x2, penW);
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CAccentTilde()
{
    CGlyphOperator.call(this);
}
CAccentTilde.prototype = Object.create(CGlyphOperator.prototype);
CAccentTilde.prototype.constructor = CAccentTilde;
CAccentTilde.prototype.calcSize = function(stretch)
{
    var betta = this.Parent.Get_TxtPrControlLetter().FontSize/36;

    var width = 9.047509765625*betta; // реальная на отрисовке width 7.495282031249999
    var height = 2.469444444444444*betta;

    var augm = 0.9*stretch/width;

    if(augm < 1)
        augm = 1;
    else if (augm > 2)
        augm = 2;

    width *= augm;

    return {width: width, height: height};
};
CAccentTilde.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    X[0] = 0; Y[0] = 3066;
    X[1] = 2125; Y[1] = 7984;
    X[2] = 5624; Y[2] = 11256;
    X[3] = 9123; Y[3] = 14528;
    X[4] = 13913; Y[4] = 14528;
    X[5] = 18912; Y[5] = 14528;
    X[6] = 25827; Y[6] = 10144;
    X[7] = 32742; Y[7] = 5760;
    X[8] = 36324; Y[8] = 5760;
    X[9] = 39865; Y[9] = 5760;
    X[10] = 42239; Y[10] = 7641;
    X[11] = 44614; Y[11] = 9522;
    X[12] = 47030; Y[12] = 13492;
    X[13] = 50362; Y[13] = 11254;
    X[14] = 48571; Y[14] = 7544;
    X[15] = 44697; Y[15] = 3772;
    X[16] = 40823; Y[16] = 0;
    X[17] = 35283; Y[17] = 0;
    X[18] = 29951; Y[18] = 0;
    X[19] = 23098; Y[19] = 4384;
    X[20] = 16246; Y[20] = 8768;
    X[21] = 12622; Y[21] = 8768;
    X[22] = 9581; Y[22] = 8768;
    X[23] = 7290; Y[23] = 6845;
    X[24] = 4999; Y[24] = 4922;
    X[25] = 3249; Y[25] = 1243;
    X[26] = 0; Y[26] = 3066;


    var XX = [],
        YY = [];

    var fontSize = this.Parent.Get_TxtPrControlLetter().FontSize;
    var textScale = fontSize/1000, // 1000 pt
        alpha = textScale*25.4/96 /64 ; // g_dKoef_px_to_mm = 25.4/96

    var Width = stretch/alpha;
    var augm = Width/X[13] * 0.5;


    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha*augm;
        YY[i] = (Y[5] - Y[i])*alpha*0.65; // сжали !
    }

    var H = YY[5];
    var W = XX[13];


    return {XX: XX, YY: YY, W: W, H: H};
};
CAccentTilde.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._c(XX[0], YY[0], XX[1], YY[1], XX[2], YY[2] );
    pGraphics._c(XX[2], YY[2], XX[3], YY[3], XX[4], YY[4] );
    pGraphics._c(XX[4], YY[4], XX[5], YY[5], XX[6], YY[6] );
    pGraphics._c(XX[6], YY[6], XX[7], YY[7], XX[8], YY[8] );
    pGraphics._c(XX[8], YY[8], XX[9], YY[9], XX[10], YY[10] );
    pGraphics._c(XX[10], YY[10], XX[11], YY[11], XX[12], YY[12] );
    pGraphics._l(XX[13], YY[13]);
    pGraphics._c(XX[13], YY[13], XX[14], YY[14], XX[15], YY[15] );
    pGraphics._c(XX[15], YY[15], XX[16], YY[16], XX[17], YY[17] );
    pGraphics._c(XX[17], YY[17], XX[18], YY[18], XX[19], YY[19] );
    pGraphics._c(XX[19], YY[19], XX[20], YY[20], XX[21], YY[21] );
    pGraphics._c(XX[21], YY[21], XX[22], YY[22], XX[23], YY[23] );
    pGraphics._c(XX[23], YY[23], XX[24], YY[24], XX[25], YY[25] );
    pGraphics._l(XX[26], YY[26]);
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CAccentBreve()
{
    CGlyphOperator.call(this);
}
CAccentBreve.prototype = Object.create(CGlyphOperator.prototype);
CAccentBreve.prototype.constructor = CAccentBreve;
CAccentBreve.prototype.calcSize = function(stretch)
{
    var betta = this.Parent.Get_TxtPrControlLetter().FontSize/36;

    var width =  4.2333333333333325*betta;
    var height = 2.469444444444445*betta;

    return {width: width, height: height};
};
CAccentBreve.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    X[0] = 25161; Y[0] = 11372;
    X[1] = 24077; Y[1] = 5749;
    X[2] = 20932; Y[2] = 2875;
    X[3] = 17787; Y[3] = 0;
    X[4] = 12247; Y[4] = 0;
    X[5] = 7082; Y[5] = 0;
    X[6] = 4083; Y[6] = 2854;
    X[7] = 1083; Y[7] = 5707;
    X[8] = 0; Y[8] = 11372;
    X[9] = 3208; Y[9] = 12371;
    X[10] = 4249; Y[10] = 9623;
    X[11] = 5561; Y[11] = 8083;
    X[12] = 6873; Y[12] = 6542;
    X[13] = 8456; Y[13] = 5959;
    X[14] = 10039; Y[14] = 5376;
    X[15] = 12414; Y[15] = 5376;
    X[16] = 14746; Y[16] = 5376;
    X[17] = 16454; Y[17] = 5980;
    X[18] = 18162; Y[18] = 6583;
    X[19] = 19558; Y[19] = 8124;
    X[20] = 20953; Y[20] = 9665;
    X[21] = 21953; Y[21] = 12371;
    X[22] = 25161; Y[22] = 11372;


    var XX = [],
        YY = [];

    var fontSize = this.Parent.Get_TxtPrControlLetter().FontSize;
    var textScale = fontSize/1000, // 1000 pt
        alpha = textScale*25.4/96 /64 ; // g_dKoef_px_to_mm = 25.4/96

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha ;
        YY[i] = Y[i]*alpha ;
    }

    var H = YY[9],
        W = XX[0];

    return {XX: XX, YY: YY, W: W, H: H};
};
CAccentBreve.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._c(XX[0], YY[0], XX[1], YY[1], XX[2], YY[2] );
    pGraphics._c(XX[2], YY[2], XX[3], YY[3], XX[4], YY[4] );
    pGraphics._c(XX[4], YY[4], XX[5], YY[5], XX[6], YY[6] );
    pGraphics._c(XX[6], YY[6], XX[7], YY[7], XX[8], YY[8] );
    pGraphics._l(XX[9], YY[9]);
    pGraphics._c(XX[9], YY[9], XX[10], YY[10], XX[11], YY[11] );
    pGraphics._c(XX[11], YY[11], XX[12], YY[12], XX[13], YY[13] );
    pGraphics._c(XX[13], YY[13], XX[14], YY[14], XX[15], YY[15] );
    pGraphics._c(XX[15], YY[15], XX[16], YY[16], XX[17], YY[17] );
    pGraphics._c(XX[17], YY[17], XX[18], YY[18], XX[19], YY[19] );
    pGraphics._c(XX[19], YY[19], XX[20], YY[20], XX[21], YY[21] );
    pGraphics._l(XX[22], YY[22]);
};

function CMathAccentPr()
{
    this.chr     = null;
    this.chrType = null;
}
CMathAccentPr.prototype.Set_FromObject = function(Obj)
{
    if (undefined !== Obj.chr && null !== Obj.chr)
        this.chr = Obj.chr;
    else
        this.chr = null;

    if (undefined !== Obj.chrType && null !== Obj.chrType)
        this.chrType = Obj.chrType;
    else
        this.chrType = null;
};
CMathAccentPr.prototype.Copy = function()
{
    var NewPr = new CMathAccentPr();

    NewPr.chr     = this.chr;
    NewPr.chrType = this.chrType;

    return NewPr;
};
CMathAccentPr.prototype.Write_ToBinary = function(Writer)
{
    // Long : chr     (-1 : null)
    // Long : chrType (-1 : null)

    Writer.WriteLong(null === this.chr ? -1 : this.chr);
    Writer.WriteLong(null === this.chrType ? -1 : this.chrType);
};
CMathAccentPr.prototype.Read_FromBinary = function(Reader)
{
    // Long : chr     (-1 : null)
    // Long : chrType (-1 : null)

    var chr     = Reader.GetLong();
    var chrType = Reader.GetLong();

    this.chr     = -1 === chr ? null : chr;
    this.chrType = -1 === chrType ? null : chrType;
};

/**
 *
 * @param props
 * @constructor
 * @extends {CMathBase}
 */
function CAccent(props)
{
	CMathBase.call(this);

    this.Id = AscCommon.g_oIdCounter.Get_NewId();

    //// Properties
    this.Pr = new CMathAccentPr();

    this.gap = 0;

    /////////////////

    this.operator = new COperator(OPER_ACCENT);

    if(props !== null && typeof(props) !== "undefined")
        this.init(props);

    AscCommon.g_oTableId.Add( this, this.Id );	
}
CAccent.prototype = Object.create(CMathBase.prototype);
CAccent.prototype.constructor = CAccent;

CAccent.prototype.ClassType = AscDFH.historyitem_type_acc;
CAccent.prototype.kind      = MATH_ACCENT;

CAccent.prototype.init = function(props)
{
    this.Fill_LogicalContent(1);

    this.setProperties(props);
    this.fillContent();
};
CAccent.prototype.getBase = function()
{
    return this.Content[0];
};
CAccent.prototype.fillContent = function()
{
    this.setDimension(1, 1);
    this.elements[0][0] = this.getBase();
};
CAccent.prototype.IsAccent = function()
{
    return true;
};
CAccent.prototype.setPosition = function(pos, PosInfo)
{
    this.pos.x = pos.x;
    this.pos.y = pos.y - this.size.ascent;

    this.UpdatePosBound(pos, PosInfo);

    var width = this.size.width - this.GapLeft - this.GapRight;
    var oBase = this.Content[0];

    var alignOp  =  (width - this.operator.size.width)/2,
        alignCnt =  (width - oBase.size.width)/2;

    var PosOper = new CMathPosition();

    PosOper.x = this.pos.x + this.GapLeft  + alignOp;
    PosOper.y = this.pos.y;

    this.operator.setPosition(PosOper);

    var PosBase = new CMathPosition();

    PosBase.x = this.pos.x + this.GapLeft + alignCnt;
    PosBase.y = this.pos.y + this.operator.size.height + oBase.size.ascent;

    oBase.setPosition(PosBase, PosInfo);

    pos.x += this.size.width;
};
CAccent.prototype.ApplyProperties = function(RPI)
{
    if(this.RecalcInfo.bProps == true)
    {
        var prp =
        {
            type:   this.Pr.chrType,
            chr:    this.Pr.chr,
            loc:    LOCATION_TOP
        };

        var defaultPrp = {type:   ACCENT_CIRCUMFLEX };

        this.operator.mergeProperties(prp, defaultPrp);

        this.RecalcInfo.bProps = false;
    }
};
CAccent.prototype.PreRecalc = function(Parent, ParaMath, ArgSize, RPI, GapsInfo)
{
    this.ApplyProperties(RPI);
    this.operator.PreRecalc(this, ParaMath);

	CMathBase.prototype.PreRecalc.call(this, Parent, ParaMath, ArgSize, RPI, GapsInfo);
};
CAccent.prototype.Resize = function(oMeasure, RPI)
{
    var base = this.getBase();
    base.Resize(oMeasure, RPI);

    this.operator.fixSize(oMeasure, base.size.width);

    var width  = base.size.width, // (!)
        height = base.size.height + this.operator.size.height,
        ascent = this.operator.size.height + this.elements[0][0].size.ascent;

    width += this.GapLeft + this.GapRight;

    this.size.height = height;
    this.size.width  = width;
    this.size.ascent = ascent;
};
CAccent.prototype.Recalculate_Range = function(PRS, ParaPr, Depth)
{
    var bMath_OneLine = PRS.bMath_OneLine;
    var WordLen = PRS.WordLen; // запоминаем, чтобы внутр мат объекты не увеличили WordLen

    PRS.bMath_OneLine = true;

    var oBase = this.getBase();
    oBase.Recalculate_Reset(PRS.Range, PRS.Line, PRS ); // обновим StartLine и StartRange
    oBase.Recalculate_Range(PRS, ParaPr, Depth);

    this.operator.fixSize(g_oTextMeasurer, oBase.size.width);

    this.size.width  = oBase.size.width + this.GapLeft + this.GapRight; // (!)
    this.size.height = oBase.size.height + this.operator.size.height;
    this.size.ascent = this.operator.size.height + oBase.size.ascent;

    PRS.bMath_OneLine = bMath_OneLine;

    this.UpdatePRS_OneLine(PRS, WordLen);
};
CAccent.prototype.draw = function(x, y, pGraphics, PDSE)
{
    var base = this.elements[0][0];
    base.draw(x, y, pGraphics, PDSE);

    var Info =
    {
        Result:     true,
        sty:        null,
        scr:        null,
        Latin:      false,
        Greek:      false
    };

    base.getInfoLetter(Info);

    if(Info.Result == true)
    {
        var bAlphabet    = Info.Latin || Info.Greek;
        var bRomanSerif  = (Info.sty == STY_BI || Info.sty == STY_ITALIC) && (Info.scr == TXT_ROMAN || Info.scr == TXT_SANS_SERIF),
            bScript      = Info.scr == TXT_SCRIPT;

        if(bAlphabet && (bRomanSerif || bScript))
        {
            if(this.Pr.chr != 0x305 && this.Pr.chr >= 0x300 && this.Pr.chr <= 0x315 || this.Pr.chr == 0x20DB)
            {
                var ascent = this.elements[0][0].size.ascent;
                x += ascent*0.1;
            }
        }
    }

    this.operator.draw(x, y, pGraphics, PDSE);
};
CAccent.prototype.Draw_Elements = function(PDSE)
{
    var X = PDSE.X;

    var oBase = this.Content[0];
    oBase.Draw_Elements(PDSE);

    var PosLine = this.ParaMath.GetLinePosition(PDSE.Line, PDSE.Range);

    var x = PosLine.x,
        y = PosLine.y;

    //var x = PDSE.X,
    //    y = PDSE.Y;

    if(oBase.Is_InclineLetter())
    {
        if(this.Pr.chr != 0x305 && this.Pr.chr >= 0x300 && this.Pr.chr <= 0x315 || this.Pr.chr == 0x20DB)
        {
            var ascent = this.elements[0][0].size.ascent;
            x += ascent*0.1;
        }
    }

    this.operator.draw(x, y, PDSE.Graphics, PDSE);

    PDSE.X = X + this.size.width;
};
CAccent.prototype.GetLastElement = function()
{
    return this.Content[0].GetLastElement();
};
CAccent.prototype.Get_InterfaceProps = function()
{
    return new CMathMenuAccent(this);
};

/**
 *
 * @param CMathMenuAccent
 * @constructor
 * @extends {CMathMenuBase}
 */
function CMathMenuAccent(Accent)
{
	CMathMenuBase.call(this, Accent);

    this.Type   = Asc.c_oAscMathInterfaceType.Accent;
}
CMathMenuAccent.prototype = Object.create(CMathMenuBase.prototype);
CMathMenuAccent.prototype.constructor = CMathMenuAccent;

//--------------------------------------------------------export----------------------------------------------------
window['AscCommonWord'] = window['AscCommonWord'] || {};
window['AscCommonWord'].CAccent = CAccent;

window["CMathMenuAccent"] = CMathMenuAccent;
