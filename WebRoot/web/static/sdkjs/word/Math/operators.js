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
var History = AscCommon.History;

function CGlyphOperator()
{
    this.loc =  null;
    this.turn = null;

    this.size = new CMathSize();
    this.stretch = 0;
    this.bStretch = true;

    this.penW = 1; // px
}
CGlyphOperator.prototype.init = function(props)
{
    // location

    // 0 - up
    // 1 - down
    // 2 - left
    // 3 - right

    // turn

    // 0 - 0
    // 1 - Pi
    // 2 - Pi/2
    // 3 - 3*Pi/2

    this.loc = props.location;
    this.turn = props.turn;
    this.bStretch = (props.bStretch == true || props.bStretch == false) ? props.bStretch : true;

};
CGlyphOperator.prototype.fixSize = function(stretch)
{
    var sizeGlyph = this.calcSize(stretch);
    var width, height, ascent;

    //var betta = this.getTxtPrp().FontSize/36;
    var bHor = this.loc == LOCATION_TOP || this.loc  == LOCATION_BOT;

    if(bHor)
    {
        width = sizeGlyph.width;
        height = sizeGlyph.height;

        ascent = height/2;
        //
        if(this.bStretch)
            this.stretch = stretch > width ? stretch : width;
        else
            this.stretch = width;

    }
    else
    {
        width = sizeGlyph.height;
        height = sizeGlyph.width;

        // baseLine смещен чуть вверх, чтобы текст при вставке в скобки располагался по центру, относительно высоты скобок
        // плейсхолдер из-за этого располагается чуть выше, как в Ворде
        //center = height/2 - 1.234722222222222*betta;
        ascent = height/2;
        this.stretch = stretch > height ? stretch : height;
    }

    this.size.width  = width;
    this.size.ascent = ascent;
    this.size.height = height;
};
CGlyphOperator.prototype.getCoordinateGlyph = function()
{
    var coord = this.calcCoord(this.stretch);

    var X = coord.XX, Y = coord.YY,
        W =  this.size.width, H =  this.size.height;

    var bHor = this.loc == LOCATION_TOP || this.loc  == LOCATION_BOT;
    var glW = 0, glH = 0;

     if(bHor)
     {
         glW = coord.W;
         glH = coord.H;
     }
     else
     {
         glW = coord.H;
         glH = coord.W;
     }

     /*var shW = (W - glW)/ 2, // выравниваем глиф по длине
         shH = (H - glH)/2; // при повороте на 90 градусовы*/

    // A*x + B*y + C = 0

    var bLine = this.Parent.typeOper == DELIMITER_LINE || this.Parent.typeOper == DELIMITER_DOUBLE_LINE, // если оператор линия, то размещаем оператор по середине
        bArrow = this.Parent.typeOper == ARROW_LEFT || this.Parent.typeOper == ARROW_RIGHT || this.Parent.typeOper == ARROW_LR,
        bDoubleArrow = this.Parent.typeOper == DOUBLE_LEFT_ARROW || this.Parent.typeOper == DOUBLE_RIGHT_ARROW || this.Parent.typeOper == DOUBLE_ARROW_LR;

    var a1, a2, b1, b2, c1, c2;

    if(bLine)
    {
        if(this.loc == LOCATION_TOP)
        {
            a1 = 1; b1 = 0; c1 = 0;
            a2 = 0; b2 = 1; c2 = (H - glH)/2;
        }
        else if(this.loc == LOCATION_BOT)
        {
            a1 = 1; b1 = 0; c1 = 0;
            a2 = 0; b2 = 1; c2 = (H - glH)/2;

        }
        else if(this.loc == LOCATION_LEFT)
        {
            a1 = 0; b1 = 1; c1 = (W - glW)/2;
            a2 = 1; b2 = 0; c2 = 0;
        }
        else if(this.loc == LOCATION_RIGHT)
        {

            a1 = 0; b1 = 1; c1 = (W - glW)/2;
            a2 = 1; b2 = 0; c2 = 0;
        }
        else if(this.loc == LOCATION_SEP)
        {
            a1 = 0; b1 = 1; c1 = (W - glW)/2;
            a2 = 1; b2 = 0; c2 = 0;
        }
    }
    else
    {
        if(this.loc == LOCATION_TOP)
        {
            a1 = 1; b1 = 0; c1 = 0;
            a2 = 0; b2 = 1; c2 = 0;
        }
        else if(this.loc == LOCATION_BOT)
        {
            a1 = 1; b1 = 0; c1 = 0;
            a2 = 0; b2 = 1; c2 = H - glH;

        }
        else if(this.loc == LOCATION_LEFT)
        {
            a1 = 0; b1 = 1; c1 = 0;
            a2 = 1; b2 = 0; c2 = 0;
        }
        else if(this.loc == LOCATION_RIGHT)
        {

            a1 = 0; b1 = 1; c1 = W - glW;
            a2 = 1; b2 = 0; c2 = 0;
        }
        else if(this.loc == LOCATION_SEP)
        {
            a1 = 0; b1 = 1; c1 = 0;
            a2 = 1; b2 = 0; c2 = 0;
        }
    }

    if(this.turn == 1)
    {
        a1 *= -1; b1 *= -1; c1 += glW;
    }
    else if(this.turn == 2)
    {
        a2 *= -1; b2 *= -1; c2 += glH;
    }
    else if(this.turn == 3)
    {
        a1 *= -1; b1 *= -1; c1 += glW;
        a2 *= -1; b2 *= -1; c2 += glH;
    }

    var gpX = 0,
        gpY = 0;

    if(this.loc == 3)
        gpX = - this.penW*25.4/96;

    var XX = [],
        YY = [];

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*a1 + Y[i]*b1 + c1 + gpX;
        YY[i] = X[i]*a2 + Y[i]*b2 + c2 + gpY;
    }

    return {XX: XX, YY: YY, Width: glW, Height: glH};
};
CGlyphOperator.prototype.draw = function(pGraphics, XX, YY, PDSE)
{
    this.Parent.Make_ShdColor(PDSE);

    var intGrid = pGraphics.GetIntegerGrid();
    pGraphics.SetIntegerGrid(false);

    pGraphics.p_width(this.penW*1000);
    pGraphics._s();

    this.drawPath(pGraphics, XX, YY, PDSE);

    pGraphics.df();
    pGraphics._s();
    pGraphics.SetIntegerGrid(intGrid);
};
CGlyphOperator.prototype.drawOnlyLines = function(x, y, pGraphics, PDSE)
{
    this.Parent.Make_ShdColor(PDSE);

    this.draw(x, y, pGraphics);
};
CGlyphOperator.prototype.getCtrPrp = function()
{
    return this.Parent.Get_TxtPrControlLetter();
};
CGlyphOperator.prototype.PreRecalc = function(Parent)
{
    this.Parent = Parent;
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function COperatorBracket()
{
    CGlyphOperator.call(this);
}
COperatorBracket.prototype = Object.create(CGlyphOperator.prototype);
COperatorBracket.prototype.constructor = COperatorBracket;
COperatorBracket.prototype.calcSize = function( stretch )
{
    var betta = this.getCtrPrp().FontSize/36;

    var heightBr, widthBr;
    var minBoxH = 4.917529296874999 *betta; //width of 0x28

    if(this.Parent.type == OPER_GROUP_CHAR)
    {
        // перевернутая скобка
        widthBr = 7.347222222222221*betta;
        heightBr = minBoxH;
    }
    else
    {
        // перевернутая скобка
        widthBr = 12.347222222222221*betta;
        var maxBoxH;

        var rx = stretch / widthBr;
        if(rx < 1)
            rx = 1;

        if(rx < 2.1)
            maxBoxH = minBoxH * 1.37;
        else if(rx < 3.22)
            maxBoxH = minBoxH * 1.06;
        else
            maxBoxH =   8.74 *betta;

        var delta = maxBoxH - minBoxH;

        heightBr = delta/4.3 * (rx - 1) + minBoxH;
        heightBr = heightBr >  maxBoxH ? maxBoxH : heightBr;
    }

    return {width: widthBr, height: heightBr};
};
COperatorBracket.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    X[0] = 26467; Y[0] = 18871;
    X[1] = 25967; Y[1] = 18871;
    X[2] = 25384; Y[2] = 16830;
    X[3] = 24737; Y[3] = 15476;
    X[4] = 24091; Y[4] = 14122;
    X[5] = 23341; Y[5] = 13309;
    X[6] = 22591; Y[6] = 12497;
    X[7] = 21778; Y[7] = 12164;
    X[8] = 20965; Y[8] = 11831;
    X[9] = 20089; Y[9] = 11831;
    X[10] = 19214; Y[10] = 11831;
    X[11] = 18317; Y[11] = 12083;
    X[12] = 17421; Y[12] = 12336;
    X[13] = 16441; Y[13] = 12652;
    X[14] = 15462; Y[14] = 12969;
    X[15] = 14357; Y[15] = 13243;
    X[16] = 13253; Y[16] = 13518;
    X[17] = 11961; Y[17] = 13518;
    X[18] = 9835; Y[18] = 13518;
    X[19] = 8292; Y[19] = 12621;
    X[20] = 6750; Y[20] = 11724;
    X[21] = 5750; Y[21] = 10055;
    X[22] = 4750; Y[22] = 8386;
    X[23] = 4270; Y[23] = 5987;
    X[24] = 3791; Y[24] = 3589;
    X[25] = 3791; Y[25] = 626;
    X[26] = 3791; Y[26] = 0;
    X[27] = 0; Y[27] = 0;
    X[28] = 0; Y[28] = 1084;
    X[29] = 83; Y[29] = 5963;
    X[30] = 1021; Y[30] = 9612;
    X[31] = 1959; Y[31] = 13261;
    X[32] = 3543; Y[32] = 15700;
    X[33] = 5127; Y[33] = 18139;
    X[34] = 7232; Y[34] = 19369;
    X[35] = 9337; Y[35] = 20599;
    X[36] = 11796; Y[36] = 20599;
    X[37] = 13338; Y[37] = 20599;
    X[38] = 14588; Y[38] = 20283;
    X[39] = 15839; Y[39] = 19968;
    X[40] = 16860; Y[40] = 19610;
    X[41] = 17882; Y[41] = 19252;
    X[42] = 18736; Y[42] = 18936;
    X[43] = 19590; Y[43] = 18621;
    X[44] = 20340; Y[44] = 18621;
    X[45] = 21091; Y[45] = 18621;
    X[46] = 21820; Y[46] = 18995;
    X[47] = 22550; Y[47] = 19370;
    X[48] = 23133; Y[48] = 20266;
    X[49] = 23717; Y[49] = 21162;
    X[50] = 24092; Y[50] = 22703;
    X[51] = 24467; Y[51] = 24245;
    X[52] = 24551; Y[52] = 26578;
    X[53] = 28133; Y[53] = 26578;

    //TODO
    // X[1] > X[52]

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var augm = stretch/((X[52] + (X[0] - X[1])/2 + X[1] - X[52])*alpha*2);

    if(augm < 1)
        augm = 1;

    var YY = [],
        XX = [];

    var hh1 = [],
        hh2 = [];

    var c1 = [],
        c2 = [];

    var delta = augm < 7 ? augm : 7;

    if(augm < 7)
    {
        var RX = [],
            RX1, RX2;

        if(delta < 5.1)
        {
            hh1[0] = 1.89;
            hh2[0] = 2.58;

            hh1[1] = 1.55;
            hh2[1] = 1.72;

            hh1[2] = 1.5;
            hh2[2] = 1.64;

            hh1[3] = 1.92;
            hh2[3] = 1.97;

            // (!)
            hh1[4] = 1;
            hh2[4] = 1;
            //

            hh1[5] = 2.5;
            hh2[5] = 2.5;

            hh1[6] = 2.1;
            hh2[6] = 2.1;

            hh1[7] = 1;
            hh2[7] = 1;

            RX1 = 0.033*delta + 0.967;
            RX2 = 0.033*delta + 0.967;

        }
        else
        {
            hh1[0] = 1.82;
            hh2[0] = 2.09;

            hh1[1] = 1.64;
            hh2[1] = 1.65;

            hh1[2] = 1.57;
            hh2[2] = 1.92;

            hh1[3] = 1.48;
            hh2[3] = 2.16;

            // (!)
            hh1[4] = 1;
            hh2[4] = 1;
            //

            hh1[5] = 2.5;
            hh2[5] = 2.5;

            hh1[6] = 2.1;
            hh2[6] = 2.1;

            hh1[7] = 1;
            hh2[7] = 1;


            RX1 = 0.22*delta + 0.78;
            RX2 = 0.17*delta + 0.83;

        }

        for(var i = 0; i < 27; i++)
            RX[i] = RX1;

        for(var i = 27; i < 54; i++)
            RX[i] = RX2;

        RX[1] = (Y[52]*RX[52] - (Y[52] - Y[1]) )/Y[1];
        RX[0] = RX[1]*Y[1]/Y[0];

        RX[27] = 1;
        RX[26] = 1;

        for(var i = 0; i < 8; i++ )
            RX[26-i] = 1 + i*((RX2+RX1)/2 - 1)/7;


        for(var i = 0; i < 4; i++)
        {
            c1[i] = X[30 + 2*i] - X[28 + 2*i];
            c2[i] = X[23 - 2*i] - X[25 - 2*i];
        }

        c1[5] = X[48] - X[44];
        c2[5] = X[5] - X[9];


        c1[6] = X[52] - X[48];
        c2[6] = X[1] - X[5];


        c1[7] = (X[0] - X[1])/2 + X[1] - X[52];
        c2[7] = (X[0] - X[1])/2;

        c1[4] = X[44] - X[36];
        c2[4] = X[9] - X[17];

        var rest1 = 0,
            rest2 = 0;

        for(var i = 0; i < 8; i++)
        {
            if(i == 4)
                continue;
            hh1[i] = (hh1[i] - 1)*(delta - 1) + 1;
            hh2[i] = (hh2[i] - 1)*(delta - 1) + 1;

            rest1 += hh1[i]*c1[i];
            rest2 += hh2[i]*c2[i];
        }

        var H1 = delta*(X[52] + c1[7]),
            H2 =  H1 - (X[26] - X[27]) ;

        hh1[4] = (H1 - rest1)/c1[4];
        hh2[4] = (H2 - rest2)/c2[4];

        XX[27] = X[27];
        XX[26] = X[26];

        XX[28] = X[27];
        XX[25] = X[26];

        for(var i = 0; i < 4; i++)
        {
            for(var j = 1; j < 3; j ++)
            {
                var t = j + i*2;
                XX[28 + t] = XX[27 + t] + (X[28+t] - X[27+t])*hh1[i];
                XX[25 - t] = XX[26 - t] + (X[25-t] - X[26-t])*hh2[i];
            }
        }

        //переопределяем 36 и 17
        for(var i = 1; i < 9; i++)
        {
            XX[36 + i] = XX[35+i] + (X[36+i] - X[35+i])*hh1[4];
            XX[17 - i] = XX[18-i] + (X[17-i] - X[18-i])*hh2[4];
        }

        for(var i = 0; i < 4; i++)
        {
            XX[45+i] = XX[44+i] + ( X[45+i] - X[44+i])*hh1[5];
            XX[8-i]  = XX[9-i] + (X[8-i] -X[9-i])*hh2[5];
        }

        for(var i = 0; i < 4; i++)
        {
            XX[49+i] = XX[48+i] + (X[49+i] - X[48+i])*hh1[6];
            XX[4-i]  = XX[5-i]  + (X[4-i] - X[5-i] )*hh2[6];
        }

        XX[53] = XX[52] + 2*c1[7]*hh1[7];
        XX[0]  = XX[1]  + 2*c2[7]*hh2[7];

    }
    else
    {
        hh1[0] = 1.75;
        hh2[0] = 2.55;

        hh1[1] = 1.62;
        hh2[1] = 1.96;

        hh1[2] = 1.97;
        hh2[2] = 1.94;

        hh1[3] = 1.53;
        hh2[3] = 1.0;

        hh1[4] = 2.04;
        hh2[4] = 3.17;

        hh1[5] = 2.0;
        hh2[5] = 2.58;

        hh1[6] = 2.3;
        hh2[6] = 1.9;

        hh1[7] = 2.3;
        hh2[7] = 1.9;

        // (!)
        hh1[8] = 1;
        hh2[8] = 1;
        //

        hh1[9] = 2.5;
        hh2[9] = 2.5;

        hh1[10] = 2.1;
        hh2[10] = 2.1;

        hh1[11] = 1;
        hh2[11] = 1;

        var rest1 = 0,
            rest2 = 0;

        for(var i=0; i<8; i++)
        {
            c1[i] = X[30+i] - X[29+i];
            c2[i] = X[24-i] - X[25-i];
        }

        c1[9] = X[48] - X[44];
        c2[9] = X[5] - X[9];

        c1[10] = X[52] - X[48];
        c2[10] = X[1] - X[5];


        c1[11] = (X[0] - X[1])/2 + X[1] - X[52];
        c2[11] = (X[0] - X[1])/2;

        c1[8] = X[44] - X[36];
        c2[8] = X[9] - X[17];


        for(var i = 0; i < 12; i++)
        {
            if(i == 8)
                continue;
            hh1[i] = (hh1[i] - 1)*(delta - 1) + 1;
            hh2[i] = (hh2[i] - 1)*(delta - 1) + 1;

            rest1 += hh1[i]*c1[i];
            rest2 += hh2[i]*c2[i];
        }

        var H1 = delta*(X[52] + c1[11]),
            H2 =  H1 - (X[26] - X[27]) ;

        hh1[8] = (H1 - rest1)/c1[8];
        hh2[8] = (H2 - rest2)/c2[8];

        XX[27] = X[27];
        XX[26] = X[26];

        XX[28] = X[27];
        XX[25] = X[26];

        for(var i = 0; i < 9; i++)
        {
            XX[28 + i] = XX[27 + i] + (X[28+i] - X[27+i])*hh1[i];
            XX[25 - i] = XX[26 - i] + (X[25-i] - X[26-i])*hh2[i];
        }

        //переопределяем 36 и 17
        for(var i = 1; i < 9; i++)
        {
            XX[36 + i] = XX[35+i] + (X[36+i] - X[35+i])*hh1[8];
            XX[17 - i] = XX[18-i] + (X[17-i] - X[18-i])*hh2[8];
        }

        // TODO
        // переделать
        for(var i = 0; i < 4; i++)
        {
            XX[45+i] = XX[44+i] + ( X[45+i] - X[44+i])*hh1[9];
            XX[8-i]  = XX[9-i] + (X[8-i] -X[9-i])*hh2[9];
        }

        for(var i = 0; i < 4; i++)
        {
            XX[49+i] = XX[48+i] + (X[49+i] - X[48+i])*hh1[10];
            XX[4-i]  = XX[5-i]  + (X[4-i] - X[5-i] )*hh2[10];
        }

        XX[53] = XX[52] + 2*c1[11]*hh1[11];
        XX[0]  = XX[1]  + 2*c2[11]*hh2[11];

        var RX = [];

        for(var i = 0; i < 27; i++)
            RX[i] = 0.182*delta + 0.818;

        for(var i = 27; i < 54; i++)
            RX[i] = 0.145*delta + 0.855;

        RX[1] = (Y[52]*RX[52] - (Y[52] - Y[1]) )/Y[1];
        RX[0] = RX[1]*Y[1]/Y[0];

        RX[27] = 1;
        RX[26] = 1;

        for(var i = 0; i < 7; i++ )
            RX[28-i] = 1 + i*(0.145*delta + 0.855 - 1)/8;

        var w = Y[33]*RX[33],
            w2 = Y[9]*RX[9] + 0.15*(Y[9]*RX[9] - Y[19]*RX[19]);

        for(var i = 0; i < 11; i++)
        {
            RX[34+i] = w/Y[34+i];
            RX[19-i] = w2/Y[19-i];
        }

        var _H1 = augm*(X[52] + c1[11]),
            _H2 =  _H1 - (X[26] - X[27]);

        var w3 = _H1 - (XX[52] + c1[11]),
            w4 = _H2 - (XX[1] - XX[26] + c2[11]);

        for(var i = 0; i < 10; i++)
        {
            XX[53 - i] = XX[53 - i] + w3;
            XX[i] = XX[i] + w4;
        }

    }


    for(var i = 0; i < 54; i++)
    {
        //YY[i] =  (H - Y[i]*RX[i])*alpha;
        if(this.Parent.type == OPER_GROUP_CHAR)
            YY[i] = (Y[53] - Y[i])*alpha;
        else
            YY[i] = (Y[53]*RX[53] - Y[i]*RX[i])*alpha;

        XX[i] =  XX[i]*alpha;
    }


    for(var i = 0; i < 50; i++)
        YY[54 + i] = YY[51 - i];

    for(var i = 0; i < 50; i++)
        XX[54 + i] =  XX[53] + XX[52] - XX[51-i];

    var W = XX[77], // ширина глифа
        H = YY[26]; // высота глифа

    return {XX: XX, YY: YY, W: W, H: H};
};
COperatorBracket.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._l(XX[1], YY[1]);
    pGraphics._c(XX[1], YY[1], XX[2], YY[2], XX[3], YY[3] );
    pGraphics._c(XX[3], YY[3], XX[4], YY[4], XX[5], YY[5] );
    pGraphics._c(XX[5], YY[5], XX[6], YY[6], XX[7], YY[7] );
    pGraphics._c(XX[7], YY[7], XX[8], YY[8], XX[9], YY[9] );
    pGraphics._c(XX[9], YY[9], XX[10], YY[10], XX[11], YY[11] );
    pGraphics._c(XX[11], YY[11], XX[12], YY[12], XX[13], YY[13] );
    pGraphics._c(XX[13], YY[13], XX[14], YY[14], XX[15], YY[15] );
    pGraphics._c(XX[15], YY[15], XX[16], YY[16], XX[17], YY[17] );
    pGraphics._c(XX[17], YY[17], XX[18], YY[18], XX[19], YY[19] );
    pGraphics._c(XX[19], YY[19], XX[20], YY[20], XX[21], YY[21] );
    pGraphics._c(XX[21], YY[21], XX[22], YY[22], XX[23], YY[23] );
    pGraphics._c(XX[23], YY[23], XX[24], YY[24], XX[25], YY[25] );
    pGraphics._l(XX[26], YY[26]);
    pGraphics._l(XX[27], YY[27]);
    pGraphics._l(XX[28], YY[28]);
    pGraphics._c(XX[28], YY[28], XX[29], YY[29], XX[30], YY[30] );
    pGraphics._c(XX[30], YY[30], XX[31], YY[31], XX[32], YY[32] );
    pGraphics._c(XX[32], YY[32], XX[33], YY[33], XX[34], YY[34] );
    pGraphics._c(XX[34], YY[34], XX[35], YY[35], XX[36], YY[36] );
    pGraphics._c(XX[36], YY[36], XX[37], YY[37], XX[38], YY[38] );
    pGraphics._c(XX[38], YY[38], XX[39], YY[39], XX[40], YY[40] );
    pGraphics._c(XX[40], YY[40], XX[41], YY[41], XX[42], YY[42] );
    pGraphics._c(XX[42], YY[42], XX[43], YY[43], XX[44], YY[44] );
    pGraphics._c(XX[44], YY[44], XX[45], YY[45], XX[46], YY[46] );
    pGraphics._c(XX[46], YY[46], XX[47], YY[47], XX[48], YY[48] );
    pGraphics._c(XX[48], YY[48], XX[49], YY[49], XX[50], YY[50] );
    pGraphics._c(XX[50], YY[50], XX[51], YY[51], XX[52], YY[52] );
    pGraphics._l(XX[53], YY[53]);

    pGraphics._c(XX[53], YY[53], XX[54], YY[54], XX[55], YY[55] );
    pGraphics._c(XX[55], YY[55], XX[56], YY[56], XX[57], YY[57] );
    pGraphics._c(XX[57], YY[57], XX[58], YY[58], XX[59], YY[59] );
    pGraphics._c(XX[59], YY[59], XX[60], YY[60], XX[61], YY[61] );
    pGraphics._c(XX[61], YY[61], XX[62], YY[62], XX[63], YY[63] );
    pGraphics._c(XX[63], YY[63], XX[64], YY[64], XX[65], YY[65] );
    pGraphics._c(XX[65], YY[65], XX[66], YY[66], XX[67], YY[67] );
    pGraphics._c(XX[67], YY[67], XX[68], YY[68], XX[69], YY[69] );
    pGraphics._c(XX[69], YY[69], XX[70], YY[70], XX[71], YY[71] );
    pGraphics._c(XX[71], YY[71], XX[72], YY[72], XX[73], YY[73] );
    pGraphics._c(XX[73], YY[73], XX[74], YY[74], XX[75], YY[75] );
    pGraphics._c(XX[75], YY[75], XX[76], YY[76], XX[77], YY[77] );
    pGraphics._l(XX[78], YY[78]);
    pGraphics._l(XX[79], YY[79]);
    pGraphics._l(XX[80], YY[80]);
    pGraphics._c(XX[80], YY[80], XX[81], YY[81], XX[82], YY[82] );
    pGraphics._c(XX[82], YY[82], XX[83], YY[83], XX[84], YY[84] );
    pGraphics._c(XX[84], YY[84], XX[85], YY[85], XX[86], YY[86] );
    pGraphics._c(XX[86], YY[86], XX[87], YY[87], XX[88], YY[88] );
    pGraphics._c(XX[88], YY[88], XX[89], YY[89], XX[90], YY[90] );
    pGraphics._c(XX[90], YY[90], XX[91], YY[91], XX[92], YY[92] );
    pGraphics._c(XX[92], YY[92], XX[93], YY[93], XX[94], YY[94] );
    pGraphics._c(XX[94], YY[94], XX[95], YY[95], XX[96], YY[96] );
    pGraphics._c(XX[96], YY[96], XX[97], YY[97], XX[98], YY[98] );
    pGraphics._c(XX[98], YY[98], XX[99], YY[99], XX[100], YY[100] );
    pGraphics._c(XX[100], YY[100], XX[101], YY[101], XX[102], YY[102]);
    pGraphics._c(XX[102], YY[102], XX[103], YY[103], XX[0], YY[0]);
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function COperatorParenthesis()
{
    CGlyphOperator.call(this);
}
COperatorParenthesis.prototype = Object.create(CGlyphOperator.prototype);
COperatorParenthesis.prototype.constructor = COperatorParenthesis;
COperatorParenthesis.prototype.calcSize = function(stretch)
{
    var betta = this.getCtrPrp().FontSize/36;

    var heightBr, widthBr;
    var minBoxH =   5.27099609375 *betta; //width of 0x28


    if(this.Parent.type == OPER_GROUP_CHAR)
    {
        // перевернутая скобка
        widthBr = 6.99444444444*betta;
        heightBr = minBoxH;
    }
    else
    {
        var maxBoxH =   9.63041992187 *betta; //9.63 width of 0x239D
        widthBr = 11.99444444444 *betta;


        var ry = stretch / widthBr,
            delta = maxBoxH - minBoxH;

        heightBr = delta/4.3 * (ry - 1) + minBoxH;
        heightBr = heightBr >  maxBoxH ? maxBoxH : heightBr;
    }


    return {height: heightBr, width : widthBr};
};
COperatorParenthesis.prototype.calcCoord = function(stretch)
{
    //cкобка перевернутая на 90 градусов

    var X = [],
        Y = [];

    X[0] = 39887; Y[0] = 18995;
    X[1] = 25314; Y[1] = 18995;
    X[2] = 15863; Y[2] = 14309;
    X[3] = 6412; Y[3] = 9623;
    X[4] = 3206; Y[4] = 0;
    X[5] = 0; Y[5] = 1000;
    X[6] = 3206; Y[6] = 13217;
    X[7] = 13802; Y[7] = 19722;
    X[8] = 24398; Y[8] = 26227;
    X[9] = 39470; Y[9] = 26227;

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var aug = stretch/(X[9]*alpha)/2; //Y[9]*alpha - высота скобки
    var RX, RY;

    var MIN_AUG = this.Parent.type == OPER_GROUP_CHAR ? 0.5 : 1;

    if(aug > 6.53)
    {
        RX = 6.53;
        RY = 2.05;
    }
    else if(aug < MIN_AUG)
    {
        RX = MIN_AUG;
        RY = MIN_AUG;
    }
    else
    {
        RX = aug;
        RY = 1 + (aug - 1)*0.19;
    }

    if(this.Parent.type !== OPER_GROUP_CHAR)
    {
        var DistH = [];
        for(var i= 0; i< 5; i++)
            DistH[i] = Y[9-i] - Y[i];

        for(var i = 5; i < 10; i++)
        {
            Y[i] = Y[i]*RY;               //точки правой дуги
            Y[9-i] = Y[i] - DistH[9-i];   //точки левой дуги
        }
    }

    // X
    var DistW = X[4] - X[5];

    for(var i=5; i<10; i++ )
    {
        X[i] = X[i]*RX;
        X[9-i] = X[i] + DistW;
    }

    var XX = [],
        YY = [];

    var shiftY =  1.1*Y[9]*alpha;

    // YY[0]  - YY[9]  - нижняя часть скобки
    // YY[9]  - YY[10] - отрезок прямой
    // YY[11] - YY[19] - верхняя часть скобки
    // YY[19] - YY[20] - отрезок прямой

    for(var i = 0; i < 10; i++)
    {

        YY[19 - i] = shiftY - Y[i]*alpha;
        YY[i] =  shiftY - Y[i]*alpha;

        XX[19 - i] =  X[i]*alpha;
        XX[i] = stretch - X[i]*alpha;
    }

    YY[20] = YY[0];
    XX[20] = XX[0];

    var W = XX[5],
        H = YY[4];

    return {XX: XX, YY: YY, W: W, H: H };
};
COperatorParenthesis.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]); //mm
    pGraphics._c(XX[0], YY[0], XX[1], YY[1], XX[2], YY[2]);
    pGraphics._c(XX[2], YY[2], XX[3], YY[3], XX[4], YY[4]);
    pGraphics._l(XX[5], YY[5]);
    pGraphics._c(XX[5], YY[5], XX[6], YY[6], XX[7], YY[7]);
    pGraphics._c(XX[7], YY[7], XX[8], YY[8], XX[9], YY[9]);
    pGraphics._l(XX[10], YY[10]);
    pGraphics._c(XX[10], YY[10], XX[11], YY[11], XX[12], YY[12]);
    pGraphics._c(XX[12], YY[12], XX[13], YY[13], XX[14], YY[14]);
    pGraphics._l(XX[15], YY[15]);
    pGraphics._c(XX[15], YY[15], XX[16], YY[16], XX[17], YY[17]);
    pGraphics._c(XX[17], YY[17], XX[18], YY[18], XX[19], YY[19]);
    pGraphics._l(XX[20], YY[20]);
};

// TODO
// установить минимальный размер стрелок
/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function COperatorAngleBracket()
{
    CGlyphOperator.call(this);
}
COperatorAngleBracket.prototype = Object.create(CGlyphOperator.prototype);
COperatorAngleBracket.prototype.constructor = COperatorAngleBracket;
COperatorAngleBracket.prototype.calcSize = function(stretch)
{
    //скобка перевернутая

    var betta = this.getCtrPrp().FontSize/36;
    var widthBr = 11.994444444444444*betta;
    var heightBr;

    if( stretch/widthBr > 3.768 )
        heightBr = 5.3578125*betta;
    else
        heightBr = 4.828645833333333*betta;

    return {width : widthBr, height: heightBr};
};
COperatorAngleBracket.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    X[0] = 38990; Y[0] = 7665;
    X[1] = 1583; Y[1] = 21036;
    X[2] = 0; Y[2] = 16621;
    X[3] = 37449; Y[3] = 0;
    X[4] = 40531; Y[4] = 0;
    X[5] = 77938; Y[5] = 16621;
    X[6] = 76439; Y[6] = 21036;
    X[7] = 38990; Y[7] = 7665;

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var augm = stretch/(X[5]*alpha);

    if(augm < 1)
        augm = 1;
    else if(augm > 4.7)
        augm = 4.7;

    var c1 = 1, c2 = 1;

    var ww1 = Y[0] - Y[3],
        ww2 = Y[1] - Y[2],
        ww3 = Y[1] - Y[0],
        ww4 = Y[2] - Y[3];

    if(augm > 3.768)
    {
        var WW = (Y[1] - Y[3])*1.3;
        c1 = (WW - ww1)/ww3;
        c2 = (WW - ww2)/ww4
    }

    Y[1] = Y[6] = Y[0] + ww3*c1;
    Y[2] = Y[5] = Y[3] + ww4*c2;


    var k1 = 0.01*augm;

    var hh1 = (X[0] - X[3])*k1,
        hh2 = X[1] - X[2],
        hh3 = X[3] - X[2],
        hh4 = X[0] - X[1],
        //HH = augm*(X[0] - X[2]);
        HH = augm*X[5]/2;

    var k2 = (HH -  hh1)/hh3,
        k3 = (HH - hh2)/hh4;

    X[7] = X[0] = X[1] + k3*hh4;
    X[3] = X[2] + k2*hh3;

    for(var i = 0; i < 3; i++)
    {
        X[4 + i] = 2*HH - X[3 - i];
    }

    /*var hh1 = 0.1*augm,
     hh2 = (augm*X[0] - X[])*/

    var XX = [],
        YY = [];

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha;
        YY[i] = Y[i]*alpha;
    }

    var W = XX[5],
        H = YY[1];

    return {XX: XX, YY: YY, W: W, H: H};
};
COperatorAngleBracket.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._l(XX[1], YY[1]);
    pGraphics._l(XX[2], YY[2]);
    pGraphics._l(XX[3], YY[3]);
    pGraphics._l(XX[4], YY[4]);
    pGraphics._l(XX[5], YY[5]);
    pGraphics._l(XX[6], YY[6]);
    pGraphics._l(XX[7], YY[7]);
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CSquareBracket()
{
    CGlyphOperator.call(this);
}
CSquareBracket.prototype = Object.create(CGlyphOperator.prototype);
CSquareBracket.prototype.constructor = CSquareBracket;
CSquareBracket.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    X[0] = 3200;  Y[0] = 6912;
    X[1] = 3200;  Y[1] = 18592;
    X[2] = 0;     Y[2] = 18592;
    X[3] = 0;     Y[3] = 0;
    X[4] = 79424; Y[4] = 0;
    X[5] = 79424; Y[5] = 18592;
    X[6] = 76224; Y[6] = 18592;
    X[7] = 76224; Y[7] = 6912;
    X[8] = 3200;  Y[8] = 6912;

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var lng = stretch/alpha - X[4] - 2*X[0];

    if(lng < 0)
        lng = 0;

    for(var i = 0; i < 4; i++)
        X[4+i] += lng;


    var XX = [],
        YY = [];

    var shY =  Y[0]*alpha;

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha;
        YY[i] = Y[i]*alpha + shY;
    }

    var W = XX[4],
        H = YY[1];

    return {XX: XX, YY: YY, W: W, H: H};
};
CSquareBracket.prototype.drawPath = function(pGraphics, XX, YY)
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
};
CSquareBracket.prototype.calcSize = function()
{
    var betta = this.getCtrPrp().FontSize/36;

    var height = 4.446240234375*betta;
    //var width = 12.0*this.betta;
    var width = 12.347222222222221*betta;

    return {width: width, height: height};
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CHalfSquareBracket()
{
    CGlyphOperator.call(this);
}
CHalfSquareBracket.prototype = Object.create(CGlyphOperator.prototype);
CHalfSquareBracket.prototype.constructor = CHalfSquareBracket;
CHalfSquareBracket.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    X[0] = 0; Y[0] = 0;
    X[1] = 0; Y[1] = 7000;
    X[2] = 74106; Y[2] = 7000;
    X[3] = 74106; Y[3] = 18578;
    X[4] = 77522; Y[4] = 18578;
    X[5] = 77522; Y[5] = 0;
    X[6] = 0; Y[6] = 0;

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var w1 = X[4],
        w2 = X[4] - X[3];
    var lng = stretch/alpha - w1 - w2;

    if(lng < 0)
        lng = 0;

    for(var i = 0; i < 4; i++)
        X[2+i] += lng;

    var XX = [],
        YY = [];

    var shY = Y[1]*alpha;

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha;
        YY[i] = Y[i]*alpha + shY;
    }

    var W = XX[4],
        H = YY[4];

    return {XX: XX, YY: YY, W: W, H: H};
};
CHalfSquareBracket.prototype.calcSize = function()
{
    var betta = this.getCtrPrp().FontSize/36;

    var height = 4.446240234375*betta;
    var width = 11.99444444444*betta;

    return {width: width, height: height};
};
CHalfSquareBracket.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._l(XX[1], YY[1]);
    pGraphics._l(XX[2], YY[2]);
    pGraphics._l(XX[3], YY[3]);
    pGraphics._l(XX[4], YY[4]);
    pGraphics._l(XX[5], YY[5]);
    pGraphics._l(XX[6], YY[6]);
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function COperatorLine()
{
    CGlyphOperator.call(this);
}
COperatorLine.prototype = Object.create(CGlyphOperator.prototype);
COperatorLine.prototype.constructor = COperatorLine;
COperatorLine.prototype.calcSize = function()
{
    var betta = this.getCtrPrp().FontSize/36;

    var height = 4.018359374999999*betta;
    var width = 11.99444444444*betta;

    return {width: width, height: height};
};
COperatorLine.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    X[0] = 0;     Y[0] = 0;
    X[1] = 0;     Y[1] = 5520;
    X[2] = 77504; Y[2] = 5520;
    X[3] = 77504; Y[3] = 0;
    X[4] = 0;     Y[4] = 0;

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var XX = [],
        YY = [];

    var shY = 0;

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha;
        YY[i] = Y[i]*alpha + shY;
    }

    var lng = stretch - X[2]*alpha;

    if(lng < 0)
        lng = 0;

    XX[2] += lng;
    XX[3] += lng;


    var W = XX[2],
        H = YY[2] + shY;

    return {XX: XX, YY: YY, W: W, H: H};

};
COperatorLine.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._l(XX[1], YY[1]);
    pGraphics._l(XX[2], YY[2]);
    pGraphics._l(XX[3], YY[3]);
    pGraphics._l(XX[4], YY[4]);
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CWhiteSquareBracket()
{
    CGlyphOperator.call(this);
}
CWhiteSquareBracket.prototype = Object.create(CGlyphOperator.prototype);
CWhiteSquareBracket.prototype.constructor = CWhiteSquareBracket;
CWhiteSquareBracket.prototype.calcSize = function()
{
    var betta = this.getCtrPrp().FontSize/36;

    var height = 5.5872558593749995*betta;
    var width = 11.99444444444*betta;

    return {width: width, height: height};
};
CWhiteSquareBracket.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    /*X[0] = 77529; Y[0] = 26219;
     X[1] = 77529; Y[1] = 0;
     X[2] = 0; Y[2] = 0;
     X[3] = 0; Y[3] = 26219;
     X[4] = 4249; Y[4] = 26219;
     X[5] = 4249; Y[5] = 17055;
     X[6] = 73280; Y[6] = 17055;
     X[7] = 73280; Y[7] = 26219;
     X[8] = 77529; Y[8] = 26219;
     X[9] = 73280; Y[9] = 12431;
     X[10] = 4249; Y[10] = 12431;
     X[11] = 4249; Y[11] = 4623;
     X[12] = 73280; Y[12] = 4623;
     X[13] = 73280; Y[13] = 12431;*/

    X[0] = 3225;  Y[0] = 17055;
    X[1] = 3225;  Y[1] = 26219;
    X[2] = 0;     Y[2] = 26219;
    X[3] = 0;     Y[3] = 0;
    X[4] = 77529; Y[4] = 0;
    X[5] = 77529; Y[5] = 26219;
    X[6] = 74304; Y[6] = 26219;
    X[7] = 74304; Y[7] = 17055;
    X[8] = 3225;  Y[8] = 17055;

    X[9] = 74304; Y[9] = 12700;
    X[10] = 3225; Y[10] = 12700;
    X[11] = 3225; Y[11] = 4600;
    X[12] = 74304; Y[12] = 4600;
    X[13] = 74304; Y[13] = 12700;

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var XX = [],
        YY = [];

    var shY = (Y[1] - Y[0])*alpha;

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha;
        YY[i] = Y[i]*alpha + shY;
    }

    var lngY = stretch - X[4]*alpha;

    for(var i = 0; i < 4; i++)
        XX[4+i] += lngY;

    XX[12] += lngY;
    XX[13] += lngY;

    var W = XX[4],
        H = YY[3];

    return {XX: XX, YY: YY, W: W, H: H};
};
CWhiteSquareBracket.prototype.drawPath = function(pGraphics, XX, YY, PDSE)
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
    pGraphics.df();

    var BgColor = this.Parent.Make_ShdColor(PDSE);
    pGraphics.b_color1(BgColor.r , BgColor.g , BgColor.b , 255);
    pGraphics._s();
    pGraphics._m(XX[9], YY[9]);
    pGraphics._l(XX[10], YY[10]);
    pGraphics._l(XX[11], YY[11]);
    pGraphics._l(XX[12], YY[12]);
    pGraphics._l(XX[13], YY[13]);
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function COperatorDoubleLine()
{
    CGlyphOperator.call(this);
}
COperatorDoubleLine.prototype = Object.create(CGlyphOperator.prototype);
COperatorDoubleLine.prototype.constructor = COperatorDoubleLine;
COperatorDoubleLine.prototype.calcSize = function()
{
    var betta = this.getCtrPrp().FontSize/36;

    var height = 6.715869140624999*betta,
        width = 11.99444444444*betta;

    return {width: width, height: height};
};
COperatorDoubleLine.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    //X[0] = 77504; Y[0] = 6400;

    X[0] = 0;     Y[0] = 0;
    X[1] = 0;     Y[1] = 5900;
    X[2] = 77504; Y[2] = 5900;
    X[3] = 77504; Y[3] = 0;
    X[4] = 0;     Y[4] = 0;

    X[5] = 0;     Y[5] = 18112;
    X[6] = 0;     Y[6] = 24012;
    X[7] = 77504; Y[7] = 24012;
    X[8] = 77504; Y[8] = 18112;
    X[9] = 0;     Y[9] = 18112;

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var XX = [],
        YY = [];

    //var shY = 1.5*Y[1]*alpha;
    var shY = 0;

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha;
        YY[i] = Y[i]*alpha + shY;
    }

    for(var i = 0; i < 2; i++)
    {
        XX[2+i] = stretch;
        XX[7+i] = stretch;
    }

    var W = XX[7],
        H = YY[7];

    return {XX: XX, YY: YY, W: W, H: H};
};
COperatorDoubleLine.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._l(XX[1], YY[1]);
    pGraphics._l(XX[2], YY[2]);
    pGraphics._l(XX[3], YY[3]);
    pGraphics._l(XX[4], YY[4]);
    pGraphics.df();

    pGraphics._s();
    pGraphics._m(XX[5], YY[5]);
    pGraphics._l(XX[6], YY[6]);
    pGraphics._l(XX[7], YY[7]);
    pGraphics._l(XX[8], YY[8]);
    pGraphics._l(XX[9], YY[9]);
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CSingleArrow()
{
    CGlyphOperator.call(this);
}
CSingleArrow.prototype = Object.create(CGlyphOperator.prototype);
CSingleArrow.prototype.constructor = CSingleArrow;
CSingleArrow.prototype.calcSize = function()
{
    var betta = this.getCtrPrp().FontSize/36;
    var height = 5.946923828125*betta;
    var width = 10.641210937499999*betta;

    return {width: width, height: height};
};
CSingleArrow.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    X[0] = 56138; Y[0] = 12300;
    X[1] = 8363; Y[1] = 12300;
    X[2] = 16313; Y[2] = 2212;
    X[3] = 13950; Y[3] = 0;
    X[4] = 0; Y[4] = 13650;
    X[5] = 0; Y[5] = 16238;
    X[6] = 13950; Y[6] = 29925;
    X[7] = 16313; Y[7] = 27712;
    X[8] = 8363; Y[8] = 17625;
    X[9] = 56138; Y[9] = 17625;
    X[10] = 56138; Y[10] = 12300;

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var XX = [],
        YY = [];

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha;
        YY[i] = Y[i]*alpha;
    }

    //var lng = stretch - 10000*alpha;
    var lng = stretch;

    if(lng > XX[9])
    {
        XX[0]  = lng;
        XX[9]  = lng;
        XX[10] = lng;
    }

    var W = XX[9],
        H = YY[6];

    return {XX: XX, YY: YY, W: W, H: H};
};
CSingleArrow.prototype.drawPath = function(pGraphics, XX, YY)
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
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CLeftRightArrow()
{
    CGlyphOperator.call(this);
}
CLeftRightArrow.prototype = Object.create(CGlyphOperator.prototype);
CLeftRightArrow.prototype.constructor = CLeftRightArrow;
CLeftRightArrow.prototype.calcSize = function()
{
    var betta = this.getCtrPrp().FontSize/36;

    var height = 5.946923828125*betta;
    var width = 11.695410156249999*betta;

    return {width: width, height: height};
};
CLeftRightArrow.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    X[0] = 16950; Y[0] = 28912;
    X[1] = 14738; Y[1] = 30975;
    X[2] = 0; Y[2] = 16687;
    X[3] = 0; Y[3] = 14287;
    X[4] = 14738; Y[4] = 0;
    X[5] = 16950; Y[5] = 2062;
    X[6] = 8363; Y[6] = 12975;
    X[7] = 53738; Y[7] = 12975;
    X[8] = 45150; Y[8] = 2062;
    X[9] = 47363; Y[9] = 0;
    X[10] = 62100; Y[10] = 14287;
    X[11] = 62100; Y[11] = 16687;
    X[12] = 47363; Y[12] = 30975;
    X[13] = 45150; Y[13] = 28912;
    X[14] = 53738; Y[14] = 17962;
    X[15] = 8363; Y[15] = 17962;
    X[16] = 16950; Y[16] = 28912;

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var XX = [],
        YY = [];

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha;
        YY[i] = Y[i]*alpha;
    }

    var w = X[10]*alpha;

    var lng = stretch - w;

    if(lng > 0)
        for(var i = 0; i < 8; i++)
            XX[7+i] += lng;


    var W = XX[10],
        H = YY[1];

    return {XX: XX, YY: YY, W: W, H: H};
};
CLeftRightArrow.prototype.drawPath = function(pGraphics, XX, YY)
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
    pGraphics._l(XX[12], YY[12]);
    pGraphics._l(XX[13], YY[13]);
    pGraphics._l(XX[14], YY[14]);
    pGraphics._l(XX[15], YY[15]);
    pGraphics._l(XX[16], YY[16]);

};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CDoubleArrow()
{
    CGlyphOperator.call(this);
}
CDoubleArrow.prototype = Object.create(CGlyphOperator.prototype);
CDoubleArrow.prototype.constructor = CDoubleArrow;
CDoubleArrow.prototype.calcSize = function()
{
    var betta = this.getCtrPrp().FontSize/36;

    var height = 6.7027777777777775*betta;
    var width = 10.994677734375*betta;

    return {width: width, height: height};
};
CDoubleArrow.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    X[0] = 14738;  Y[0] = 29764;
    X[1] = 20775;  Y[1] = 37002;
    X[2] = 18338;  Y[2] = 39064;
    X[3] = 0;      Y[3] = 20731;
    X[4] = 0;      Y[4] = 18334;
    X[5] = 18338;  Y[5] = 0;
    X[6] = 20775;  Y[6] = 2063;
    X[7] = 14775;  Y[7] = 9225;
    X[8] = 57600;  Y[8] = 9225;
    X[9] = 57600;  Y[9] = 14213;
    X[10] = 10950; Y[10] = 14213;
    X[11] = 6638;  Y[11] = 19532;
    X[12] = 10875; Y[12] = 24777;
    X[13] = 57600; Y[13] = 24777;
    X[14] = 57600; Y[14] = 29764;
    X[15] = 14738; Y[15] = 29764;

    X[16] = 58950; Y[16] = 19495;
    X[17] = 58950; Y[17] = 19495;

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var XX = [],
        YY = [];

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha;
        YY[i] = Y[i]*alpha;
    }

    var lng = stretch - 10000*alpha;

    if(lng > XX[16])
    {
        XX[8] = lng;
        XX[9] = lng;

        XX[13] = lng;
        XX[14] = lng;

        XX[16] = lng;
        XX[17] = lng;
    }

    var W = XX[16],
        H = YY[2];

    return {XX: XX, YY: YY, W: W, H: H};
};
CDoubleArrow.prototype.drawPath = function(pGraphics, XX, YY)
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
    pGraphics._l(XX[12], YY[12]);
    pGraphics._l(XX[13], YY[13]);
    pGraphics._l(XX[14], YY[14]);
    pGraphics._l(XX[15], YY[15]);
    pGraphics.df();

    pGraphics._s();
    pGraphics._m(XX[16], YY[16]);
    pGraphics._l(XX[17], YY[17]);
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CLR_DoubleArrow()
{
    CGlyphOperator.call(this);
}
CLR_DoubleArrow.prototype = Object.create(CGlyphOperator.prototype);
CLR_DoubleArrow.prototype.constructor = CLR_DoubleArrow;
CLR_DoubleArrow.prototype.calcSize = function()
{
    var betta = this.getCtrPrp().FontSize/36;

    var height = 6.7027777777777775*betta;
    var width = 13.146484375*betta;

    return {width: width, height: height};
};
CLR_DoubleArrow.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    X[0] = 14775; Y[0] = 9225;
    X[1] = 56063; Y[1] = 9225;
    X[2] = 50100; Y[2] = 2063;
    X[3] = 52538; Y[3] = 0;
    X[4] = 70875; Y[4] = 18334;
    X[5] = 70875; Y[5] = 20731;
    X[6] = 52538; Y[6] = 39064;
    X[7] = 50100; Y[7] = 37002;
    X[8] = 56138; Y[8] = 29764;
    X[9] = 14738; Y[9] = 29764;
    X[10] = 20775; Y[10] = 37002;
    X[11] = 18338; Y[11] = 39064;
    X[12] = 0; Y[12] = 20731;
    X[13] = 0; Y[13] = 18334;
    X[14] = 18338; Y[14] = 0;
    X[15] = 20775; Y[15] = 2063;
    X[16] = 14775; Y[16] = 9225;

    X[17] = 10950; Y[17] = 14213;
    X[18] = 6638;  Y[18] = 19532;
    X[19] = 10875; Y[19] = 24777;
    X[20] = 59963; Y[20] = 24777;
    X[21] = 64238; Y[21] = 19532;
    X[22] = 59925; Y[22] = 14213;
    X[23] = 59925; Y[23] = 14213;
    X[24] = 10950; Y[24] = 14213;

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64;

    var XX = [],
        YY = [];

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha;
        YY[i] = Y[i]*alpha;
    }

    var w = XX[4];
    var lng = stretch - 10000*alpha - w;

    for(var i = 1; i < 9; i++)
        XX[i] += lng;

    for(var i = 0; i < 3; i++)
    {
        XX[20 + i] += lng;
    }

    var W = XX[4],
        H = YY[11];

    return {XX: XX, YY: YY, W: W, H: H};
};
CLR_DoubleArrow.prototype.drawPath = function(pGraphics, XX, YY, PDSE)
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
    pGraphics._l(XX[12], YY[12]);
    pGraphics._l(XX[13], YY[13]);
    pGraphics._l(XX[14], YY[14]);
    pGraphics._l(XX[15], YY[15]);
    pGraphics._l(XX[16], YY[16]);
    pGraphics._z();

    pGraphics._m(XX[17], YY[17]);
    pGraphics._l(XX[18], YY[18]);
    pGraphics._l(XX[19], YY[19]);
    pGraphics._l(XX[20], YY[20]);
    pGraphics._l(XX[21], YY[21]);
    pGraphics._l(XX[22], YY[22]);
    pGraphics._l(XX[23], YY[23]);
	pGraphics._l(XX[24], YY[24]);

    pGraphics._z();
    //pGraphics.ds();
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CCombiningArrow()
{
    CGlyphOperator.call(this);
}
CCombiningArrow.prototype = Object.create(CGlyphOperator.prototype);
CCombiningArrow.prototype.constructor = CCombiningArrow;
CCombiningArrow.prototype.calcSize = function()
{
    var betta = this.getCtrPrp().FontSize/36;

    var height = 3.9*betta;
    var width = 4.938*betta;

    return {width: width, height: height};
};
CCombiningArrow.prototype.calcCoord = function(stretch)
{
    // px                       mm
    // XX[..]                   width
    // YY[..]                   height
    // penW

    var X = [],
        Y = [];

    X[0] = 0; Y[0] = 8137;
    X[1] = 9413; Y[1] = 0;
    X[2] = 11400; Y[2] = 2250;
    X[3] = 5400; Y[3] = 7462;
    X[4] = 28275; Y[4] = 7462;
    X[5] = 28275; Y[5] = 10987;
    X[6] = 5400; Y[6] = 10987;
    X[7] = 11400; Y[7] = 16200;
    X[8] = 9413; Y[8] = 18450;
    X[9] = 0; Y[9] = 10312;
    X[10] = 0; Y[10] = 8137;

    var textScale =  this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var XX = [],
        YY = [];

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha;
        YY[i] = Y[i]*alpha;
    }

    XX[4] = XX[5] = stretch;

    var W = XX[4],
        H = YY[8];

    return {XX: XX, YY: YY, W: W, H: H};
};
CCombiningArrow.prototype.drawPath = function(pGraphics, XX, YY)
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
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CCombiningHalfArrow()
{
    CGlyphOperator.call(this);
}
CCombiningHalfArrow.prototype = Object.create(CGlyphOperator.prototype);
CCombiningHalfArrow.prototype.constructor = CCombiningHalfArrow;
CCombiningHalfArrow.prototype.calcSize = function()
{
    var betta = this.getCtrPrp().FontSize/36;

    // 0x21BC half, down

    var height = 3.88*betta;
    var width = 4.938*betta;

    return {width: width, height: height};
};
CCombiningHalfArrow.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._l(XX[1], YY[1]);
    pGraphics._l(XX[2], YY[2]);
    pGraphics._l(XX[3], YY[3]);
    pGraphics._l(XX[4], YY[4]);
    pGraphics._l(XX[5], YY[5]);
    pGraphics._l(XX[6], YY[6]);
    pGraphics._l(XX[7], YY[7]);
};
CCombiningHalfArrow.prototype.calcCoord = function(stretch)
{
    // px                       mm
    // XX[..]                   width
    // YY[..]                   height
    // penW

    var X = [],
        Y = [];

    X[0] = 0; Y[0] = 8137;
    X[1] = 9413; Y[1] = 0;
    X[2] = 11400; Y[2] = 2250;
    X[3] = 5400; Y[3] = 7462;
    X[4] = 28275; Y[4] = 7462;
    X[5] = 28275; Y[5] = 10987;
    X[6] = 0; Y[6] = 10987;
    X[7] = 0; Y[7] = 8137;

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var XX = [],
        YY = [];

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha;
        YY[i] = Y[i]*alpha;
    }

    XX[4] = XX[5] = stretch;

    var W = XX[4],
        H = YY[5];

    return {XX: XX, YY: YY, W: W, H: H};
};

/**
 *
 * @constructor
 * @extends {CGlyphOperator}
 */
function CCombining_LR_Arrow()
{
    CGlyphOperator.call(this);
}
CCombining_LR_Arrow.prototype = Object.create(CGlyphOperator.prototype);
CCombining_LR_Arrow.prototype.constructor = CCombining_LR_Arrow;
CCombining_LR_Arrow.prototype.calcSize = function()
{
    var betta = this.getCtrPrp().FontSize/36;

    var height = 3.88*betta;
    var width = 4.938*betta;

    return {width: width, height: height};
};
CCombining_LR_Arrow.prototype.drawPath = function(pGraphics, XX, YY)
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
    pGraphics._l(XX[12], YY[12]);
    pGraphics._l(XX[13], YY[13]);
    pGraphics._l(XX[14], YY[14]);
    pGraphics._l(XX[15], YY[15]);
    pGraphics._l(XX[16], YY[16]);

};
CCombining_LR_Arrow.prototype.calcCoord = function(stretch)
{
    var X = [],
        Y = [];

    X[0] = 0; Y[0] = 8137;
    X[1] = 9413; Y[1] = 0;
    X[2] = 11400; Y[2] = 2250;
    X[3] = 5400; Y[3] = 7462;
    X[4] = 42225; Y[4] = 7462;
    X[5] = 36225; Y[5] = 2250;
    X[6] = 38213; Y[6] = 0;
    X[7] = 47625; Y[7] = 8137;
    X[8] = 47625; Y[8] = 10312;
    X[9] = 38213; Y[9] = 18450;
    X[10] = 36225; Y[10] = 16200;
    X[11] = 42225; Y[11] = 10987;
    X[12] = 5400; Y[12] = 10987;
    X[13] = 11400; Y[13] = 16200;
    X[14] = 9413; Y[14] = 18450;
    X[15] = 0; Y[15] = 10312;
    X[16] = 0; Y[16] = 8137;

    var textScale = this.getCtrPrp().FontSize/1000; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент используется для того, чтобы перевести координаты в миллиметры

    var XX = [],
        YY = [];

    for(var i = 0; i < X.length; i++)
    {
        XX[i] = X[i]*alpha;
        YY[i] = Y[i]*alpha;
    }

    var lng = stretch - XX[7];

    for(var i = 0; i < 8; i++)
    {
        XX[4+i] += lng;
    }

    var W = XX[7],
        H = YY[9];

    return {XX: XX, YY: YY, W: W, H: H};

};


function COperator(type)
{
    this.ParaMath = null;

    this.type = type; // delimiter, separator, group character, accent
    this.operator = null;

    this.code = null;
    this.typeOper = null;   // тип скобки : круглая и т.п.
    this.defaultType = null;
    this.grow       = true;

    this.pos = new CMathPosition();

    this.coordGlyph = null;

    this.size = new CMathSize();
}
COperator.prototype.mergeProperties = function(properties, defaultProps)   // props (chr, type, location), defaultProps (chr, location)
{
    var props = this.getProps(properties, defaultProps);

    this.grow = properties.grow;

    var operator = null,
        typeOper = null,
        codeChr  = null;

    var type = props.type,
        location = props.loc,
        code = props.code;

    var prp = {};

    //////////    delimiters    //////////

    if( code === 0x28 || type === PARENTHESIS_LEFT)
    {
        codeChr = 0x28;
        typeOper = PARENTHESIS_LEFT;

        operator = new COperatorParenthesis();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x29 || type === PARENTHESIS_RIGHT)
    {
        codeChr = 0x29;
        typeOper = PARENTHESIS_RIGHT;

        operator = new COperatorParenthesis();
        prp =
        {
            location:   location,
            turn:       TURN_180
        };
        operator.init(prp);
    }
    else if(code == 0x7B || type === BRACKET_CURLY_LEFT)
    {
        codeChr = 0x7B;
        typeOper = BRACKET_CURLY_LEFT;

        operator = new COperatorBracket();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x7D || type === BRACKET_CURLY_RIGHT)
    {
        codeChr = 0x7D;
        typeOper = BRACKET_CURLY_RIGHT;

        operator = new COperatorBracket();
        prp =
        {
            location:   location,
            turn:       TURN_180
        };
        operator.init(prp);
    }
    else if(code === 0x5B || type === BRACKET_SQUARE_LEFT)
    {
        codeChr = 0x5B;
        typeOper = BRACKET_SQUARE_LEFT;

        operator = new CSquareBracket();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x5D || type === BRACKET_SQUARE_RIGHT)
    {
        codeChr = 0x5D;
        typeOper = BRACKET_SQUARE_RIGHT;

        operator = new CSquareBracket();
        prp =
        {
            location:   location,
            turn:       TURN_180
        };
        operator.init(prp);
    }
    else if(code === 0x27E8 || type === BRACKET_ANGLE_LEFT) // 0x3C => 0x27E8
    {
        codeChr = 0x27E8;
        typeOper = BRACKET_ANGLE_LEFT;

        operator = new COperatorAngleBracket();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x27E9 || type === BRACKET_ANGLE_RIGHT) // 0x3E => 0x27E9
    {
        codeChr = 0x27E9;
        typeOper = BRACKET_ANGLE_RIGHT;

        operator = new COperatorAngleBracket();
        prp =
        {
            location:   location,
            turn:       TURN_180
        };
        operator.init(prp);
    }
    else if(code === 0x7C || type === DELIMITER_LINE)
    {
        codeChr = 0x7C;
        typeOper = DELIMITER_LINE;

        operator = new COperatorLine();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x230A || type === HALF_SQUARE_LEFT)
    {
        codeChr = 0x230A;
        typeOper = HALF_SQUARE_LEFT;

        operator = new CHalfSquareBracket();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x230B || type == HALF_SQUARE_RIGHT)
    {
        codeChr = 0x230B;
        typeOper = HALF_SQUARE_RIGHT;

        operator = new CHalfSquareBracket();
        prp =
        {
            location:   location,
            turn:       TURN_180
        };
        operator.init(prp);
    }
    else if(code === 0x2308 || type == HALF_SQUARE_LEFT_UPPER)
    {
        codeChr = 0x2308;
        typeOper = HALF_SQUARE_LEFT_UPPER;

        operator = new CHalfSquareBracket();
        prp =
        {
            location:   location,
            turn:       TURN_MIRROR_0
        };
        operator.init(prp);
    }
    else if(code === 0x2309 || type == HALF_SQUARE_RIGHT_UPPER)
    {
        codeChr = 0x2309;
        typeOper = HALF_SQUARE_RIGHT_UPPER;

        operator = new CHalfSquareBracket();
        prp =
        {
            location:   location,
            turn:       TURN_MIRROR_180
        };
        operator.init(prp);
    }
    else if(code === 0x2016 || type == DELIMITER_DOUBLE_LINE)
    {
        codeChr = 0x2016;
        typeOper = DELIMITER_DOUBLE_LINE;

        operator = new COperatorDoubleLine();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x27E6 || type == WHITE_SQUARE_LEFT)
    {
        codeChr = 0x27E6;
        typeOper = WHITE_SQUARE_LEFT;

        operator = new CWhiteSquareBracket();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x27E7 || type == WHITE_SQUARE_RIGHT)
    {
        codeChr = 0x27E7;
        typeOper = WHITE_SQUARE_RIGHT;

        operator = new CWhiteSquareBracket();
        prp =
        {
            location:   location,
            turn:       TURN_180
        };
        operator.init(prp);
    }
    else if(type === OPERATOR_EMPTY)
    {
        typeOper = OPERATOR_EMPTY;
        operator = -1;
    }

    //////////////////////////////////////////

    ////////////     accents     /////////////

    /////// only arrows /////

    else if(code === 0x20D6 || type === ACCENT_ARROW_LEFT)
    {
        codeChr = 0x20D6;
        typeOper = ACCENT_ARROW_LEFT;

        operator = new CCombiningArrow();
        prp =
        {
            location:   LOCATION_TOP,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x20D7 || type === ACCENT_ARROW_RIGHT)
    {
        typeOper = ACCENT_ARROW_RIGHT;
        codeChr = 0x20D7;

        operator = new CCombiningArrow();
        prp =
        {
            location:   LOCATION_TOP,
            turn:       TURN_180
        };
        operator.init(prp);
    }
    else if(code === 0x20E1 || type === ACCENT_ARROW_LR)
    {
        typeOper = ACCENT_ARROW_LR;
        codeChr = 0x20E1;

        operator = new CCombining_LR_Arrow();
        prp =
        {
            location:   LOCATION_TOP,
            turn:       TURN_0
        };

        operator.init(prp);
    }
    else if(code === 0x20D0 || type === ACCENT_HALF_ARROW_LEFT)
    {
        typeOper = ACCENT_HALF_ARROW_LEFT;
        codeChr = 0x20D0;

        operator = new CCombiningHalfArrow();
        prp =
        {
            location:   LOCATION_TOP,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x20D1 || type ===  ACCENT_HALF_ARROW_RIGHT)
    {
        typeOper = ACCENT_HALF_ARROW_RIGHT;
        codeChr = 0x20D1;

        operator = new CCombiningHalfArrow();
        prp =
        {
            location:   LOCATION_TOP,
            turn:       TURN_180
        };
        operator.init(prp);
    }

    ///////////////////////////////

    else if(code === 0x302 || type === ACCENT_CIRCUMFLEX)
    {
        typeOper = ACCENT_CIRCUMFLEX;
        codeChr = 0x302;

        //operator = new CCircumflex();
        operator = new CAccentCircumflex();

        prp =
        {
            location:   LOCATION_TOP,
            turn:       TURN_MIRROR_0,
            bStretch:   false

        };
        operator.init(prp);

    }
    else if(code === 0x30C || type === ACCENT_COMB_CARON)
    {
        typeOper = ACCENT_COMB_CARON;
        codeChr = 0x30C;

        operator = new CAccentCircumflex();
        prp =
        {
            location:   LOCATION_TOP,
            turn:   TURN_0,
            bStretch:   false
        };
        operator.init(prp);

    }
    else if(code === 0x305 || type === ACCENT_LINE)
    {
        typeOper = ACCENT_LINE;
        codeChr = 0x305;

        operator = new CAccentLine();
        prp =
        {
            location:   LOCATION_TOP,
            turn:   TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x33F || type === ACCENT_DOUBLE_LINE)
    {
        typeOper = ACCENT_DOUBLE_LINE;
        codeChr = 0x33F;

        operator = new CAccentDoubleLine();
        prp =
        {
            location:   LOCATION_TOP,
            turn:   TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x303 || type === ACCENT_TILDE)
    {
        typeOper = ACCENT_TILDE;
        codeChr = 0x303;

        operator = new CAccentTilde();
        prp =
        {
            location:   LOCATION_TOP,
            turn:   TURN_0,
            bStretch:   false
        };
        operator.init(prp);
    }
    else if(code === 0x306 || type === ACCENT_BREVE)
    {
        typeOper = ACCENT_BREVE;
        codeChr = 0x306;

        operator = new CAccentBreve();
        prp =
        {
            location:   LOCATION_TOP,
            turn:   TURN_MIRROR_0,
            bStretch:   false
        };
        operator.init(prp);

    }
    else if(code == 0x311 || type == ACCENT_INVERT_BREVE)
    {
        typeOper = ACCENT_INVERT_BREVE;
        codeChr = 0x311;

        operator = new CAccentBreve();
        prp =
        {
            location:   LOCATION_TOP,
            turn:   TURN_0,
            bStretch:   false
        };
        operator.init(prp);

    }

    //////////////////////////////////////////////////////

    /*else if(code === 0x302 || type === ACCENT_CIRCUMFLEX)
     {
     typeOper = ACCENT_CIRCUMFLEX;
     codeChr = 0x302;

     operator = new CCircumflex();
     var props =
     {
     turn:   TURN_0
     };
     operator.init(props);
     }
     else if(code === 0x30C || type === ACCENT_COMB_CARON)
     {
     typeOper = ACCENT_COMB_CARON;
     codeChr = 0x30C;

     operator = new CCircumflex();
     var props =
     {
     turn:   TURN_MIRROR_0
     };
     operator.init(props);
     }
     else if(code === 0x332 || type === ACCENT_LINE)
     {
     typeOper = ACCENT_LINE;
     codeChr = 0x332;

     operator = new CLine();
     }
     else if(code === 0x333 || type === ACCENT_DOUBLE_LINE)
     {
     typeOper = ACCENT_DOUBLE_LINE;
     codeChr = 0x333;

     operator = new CDoubleLine();

     }
     else if(code === 0x303 || type === ACCENT_TILDE)
     {
     typeOper = ACCENT_TILDE;
     codeChr = 0x303;

     operator = new CTilde();
     }
     else if(code === 0x306 || type === ACCENT_BREVE)
     {
     typeOper = ACCENT_BREVE;
     codeChr = 0x306;

     operator = new CBreve();
     var props =
     {
     turn:   TURN_MIRROR_0
     };
     operator.init(props);
     }
     else if(code == 0x311 || type == ACCENT_INVERT_BREVE)
     {
     typeOper = ACCENT_INVERT_BREVE;
     codeChr = 0x311;

     operator = new CBreve();
     var props =
     {
     turn:   TURN_0
     };
     operator.init(props);
     }
     else if(code === 0x20D6 || type === ACCENT_ARROW_LEFT)
     {
     typeOper = ACCENT_ARROW_LEFT;
     codeChr = 0x20D6;

     operator = new CCombiningArrow();
     var props =
     {
     location:   LOCATION_TOP,
     turn:       TURN_0
     };
     operator.init(props);
     }
     else if(code === 0x20D7 || type === ACCENT_ARROW_RIGHT)
     {
     typeOper = ACCENT_ARROW_RIGHT;
     codeChr = 0x20D7;

     operator = new CCombiningArrow();
     var props =
     {
     location:   LOCATION_TOP,
     turn:       TURN_180
     };
     operator.init(props);
     }
     else if(code === 0x20E1 || type === ACCENT_ARROW_LR)
     {
     typeOper = ACCENT_ARROW_LR;
     codeChr = 0x20E1;

     operator = new CCombining_LR_Arrow();
     var props =
     {
     location:   LOCATION_TOP,
     turn:       TURN_0
     };
     operator.init(props);
     }
     else if(code === 0x20D0 || type === ACCENT_HALF_ARROW_LEFT)
     {
     typeOper = ACCENT_HALF_ARROW_LEFT;
     codeChr = 0x20D0;

     operator = new CCombiningHalfArrow();
     var props =
     {
     location:   LOCATION_TOP,
     turn:       TURN_0
     };
     operator.init(props);
     }
     else if(code === 0x20D1 || type ===  ACCENT_HALF_ARROW_RIGHT)
     {
     typeOper = ACCENT_HALF_ARROW_RIGHT;
     codeChr = 0x20D1;

     operator = new CCombiningHalfArrow();
     var props =
     {
     location:   LOCATION_TOP,
     turn:       TURN_180
     };
     operator.init(props);
     }*/

    //////////////////////////////////////////

    //////////   group characters   //////////

    else if(code === 0x23DE || type == BRACKET_CURLY_TOP)
    {
        codeChr = 0x23DE;
        typeOper = BRACKET_CURLY_TOP;

        operator = new COperatorBracket();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x23DF || type === BRACKET_CURLY_BOTTOM)
    {
        codeChr =  0x23DF;
        typeOper = BRACKET_CURLY_BOTTOM;

        operator = new COperatorBracket();
        prp =
        {
            location:   location,
            turn:       TURN_MIRROR_0
        };
        operator.init(prp);
    }
    else if(code === 0x23DC || type === PARENTHESIS_TOP)
    {
        codeChr = 0x23DC;
        typeOper = PARENTHESIS_TOP;

        operator = new COperatorParenthesis();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x23DD || type === PARENTHESIS_BOTTOM)
    {
        codeChr = 0x23DD;
        typeOper = PARENTHESIS_BOTTOM;

        operator = new COperatorParenthesis();
        prp =
        {
            location:   location,
            turn:       TURN_MIRROR_0
        };
        operator.init(prp);
    }
    else if(code === 0x23E0 || type === BRACKET_SQUARE_TOP)
    {
        codeChr = 0x23E0;
        typeOper = BRACKET_SQUARE_TOP;

        operator = new CSquareBracket();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x2190 || type === ARROW_LEFT)
    {
        codeChr =  0x2190;
        typeOper = ARROW_LEFT;

        operator = new CSingleArrow();

        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x2192 || type === ARROW_RIGHT)
    {
        codeChr =  0x2192;
        typeOper = ARROW_RIGHT;

        operator = new CSingleArrow();
        prp =
        {
            location:   location,
            turn:       TURN_180
        };
        operator.init(prp);
    }
    else if(code === 0x2194 || type === ARROW_LR)
    {
        codeChr =  0x2194;
        typeOper = ARROW_LR;

        operator = new CLeftRightArrow();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x21D0 || type === DOUBLE_LEFT_ARROW)
    {
        codeChr =  0x21D0;
        typeOper = DOUBLE_LEFT_ARROW;

        operator = new CDoubleArrow();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }
    else if(code === 0x21D2 || type === DOUBLE_RIGHT_ARROW)
    {
        codeChr =  0x21D2;
        typeOper = DOUBLE_RIGHT_ARROW;

        operator = new CDoubleArrow();
        prp =
        {
            location:   location,
            turn:       TURN_180
        };
        operator.init(prp);
    }
    else if(code === 0x21D4 || type === DOUBLE_ARROW_LR)
    {
        codeChr =  0x21D4;
        typeOper = DOUBLE_ARROW_LR;

        operator = new CLR_DoubleArrow();
        prp =
        {
            location:   location,
            turn:       TURN_0
        };
        operator.init(prp);
    }

    //////////////////////////////////////////////////////

    else if(code !== null)
    {
        codeChr  = code;
        typeOper = OPERATOR_TEXT;

        operator = new CMathText(true);
        operator.add(code);
    }
    else
        operator = -1;

    this.operator = operator;
    this.code = codeChr;
    this.typeOper = typeOper;
};
COperator.prototype.getProps = function(props, defaultProps)
{
    var location = props.loc,
        chr = props.chr,
        type = props.type;

    var code = props.chr;

    this.defaultType = defaultProps.type;

    var bDelimiter  = this.type == OPER_DELIMITER || this.type == OPER_SEPARATOR,
        bNotType    = props.type === undefined ||  props.type === null,
        bUnicodeChr = props.chr !== null && props.chr+0 === props.chr;


    if(bDelimiter && props.chr == -1) // empty operator
    {
        type = OPERATOR_EMPTY;
    }
    else if(bNotType && !bUnicodeChr)   // default operator
    {
        type = defaultProps.type;
    }

    var bLoc        = props.loc !== null && props.loc !== undefined;
    var bDefaultLoc = defaultProps.loc !== null && defaultProps.loc !==  undefined;


    if(!bLoc && bDefaultLoc)
        location = defaultProps.loc;

    return  {loc: location, type: type, code: code};
};
COperator.prototype.draw = function(x, y, pGraphics, PDSE)
{
    var XX = this.pos.x + x,
        YY = this.pos.y + y;

    if(this.typeOper === OPERATOR_TEXT)
    {
        this.drawText(x, y, pGraphics, PDSE);
    }
    else if(this.IsLineGlyph())
    {
        this.drawLines(XX, YY, pGraphics, PDSE);
    }
    else
    {
        this.drawOperator(XX, YY, pGraphics, PDSE);
    }
};
COperator.prototype.setPosition = function(_pos)
{
    this.pos.x = _pos.x;
    this.pos.y = _pos.y;

    if(this.typeOper === OPERATOR_TEXT)
    {
        this.operator.setPosition(_pos);
    }
};
COperator.prototype.Make_ShdColor = function(PDSE)
{
    return this.Parent.Make_ShdColor(PDSE, this.Parent.Get_CompiledCtrPrp());
};
COperator.prototype.drawText = function(absX, absY, pGraphics, PDSE)
{
    this.Make_ShdColor(PDSE);

    var ctrPrp =  this.Get_TxtPrControlLetter();

    var Font =
    {
        FontSize:   ctrPrp.FontSize,
        FontFamily: {Name : ctrPrp.FontFamily.Name, Index : ctrPrp.FontFamily.Index},
        Italic:     false,
        Bold:       false
    };

    pGraphics.SetFont(Font);

    ////////////////////////////////////////////////

    this.operator.Draw(absX, absY, pGraphics, PDSE);
};
COperator.prototype.drawOperator = function(absX, absY, pGraphics, PDSE)
{
    if(this.typeOper !== OPERATOR_EMPTY)
    {
        var lng = this.coordGlyph.XX.length;

        var X = [],
            Y = [];

        for(var j = 0; j < lng; j++)
        {
            X.push(absX + this.coordGlyph.XX[j]);
            Y.push(absY + this.coordGlyph.YY[j]);
        }

        this.operator.draw(pGraphics, X, Y, PDSE);
    }
};
COperator.prototype.drawLines = function(absX, absY, pGraphics, PDSE)
{
    if(this.typeOper !== OPERATOR_EMPTY)
    {
        this.operator.drawOnlyLines(absX, absY, pGraphics, PDSE);
    }
};
COperator.prototype.IsLineGlyph = function()
{
    return this.typeOper == ACCENT_LINE || this.typeOper == ACCENT_DOUBLE_LINE;
};
COperator.prototype.fixSize = function(oMeasure, stretch)
{
    if(this.typeOper !== OPERATOR_EMPTY)
    {
        var width, height, ascent;
        var dims;

        var ctrPrp =  this.Get_TxtPrControlLetter();

        var Font =
        {
            FontSize:   ctrPrp.FontSize,
            FontFamily: {Name : ctrPrp.FontFamily.Name, Index : ctrPrp.FontFamily.Index},
            Italic:     false,
            Bold:       false //ctrPrp.Bold
        };

        oMeasure.SetFont(Font);

        var bLine = this.IsLineGlyph();

        var bTopBot = this.operator.loc == LOCATION_TOP || this.operator.loc == LOCATION_BOT;

        // Width
        if(this.typeOper == OPERATOR_TEXT) // отдельный случай для текста в качестве оператора
        {
            this.operator.Measure(oMeasure, ctrPrp);
            width  = this.operator.size.width;
        }
        else
        {
            if(bLine)
            {
                this.operator.fixSize(stretch);
                width = this.operator.size.width;
            }
            else
            {
                var bNotStretchDelim = (this.type == OPER_DELIMITER || this.type == OPER_SEPARATOR) && this.grow == false;

                var StretchLng = bNotStretchDelim ? 0 : stretch;

                this.operator.fixSize(StretchLng);
                dims = this.operator.getCoordinateGlyph();
                this.coordGlyph = {XX: dims.XX, YY: dims.YY};

                width = bTopBot ? dims.Width : this.operator.size.width;
            }
        }

        var mgCtrPrp = this.Parent.Get_TxtPrControlLetter();
        var shCenter = this.ParaMath.GetShiftCenter(oMeasure, mgCtrPrp);

        // Height, Ascent

        if(this.type === OPER_ACCENT)
        {
            var letterOperator = new CMathText(true);
            letterOperator.add(this.code);
            letterOperator.Measure(oMeasure, ctrPrp);

            var letterX = new CMathText(true);
            letterX.add(0x78);
            letterX.Measure(oMeasure, ctrPrp);

            height = letterOperator.size.ascent - letterX.size.ascent;

            ascent = height/2 + shCenter;

        }
        else
        {
            if(this.typeOper == OPERATOR_TEXT)
                height = this.operator.size.height;
            else
            {
                if(bTopBot)
                    height = this.operator.size.height;
                else
                    height = dims.Height;
            }

            if(!bLine && this.operator.loc == LOCATION_TOP)
                ascent = dims.Height;
            else if(!bLine && this.operator.loc == LOCATION_BOT)
                ascent = this.operator.size.height;
            else
                ascent = height/2 + shCenter;
        }



        this.size.width  = width;
        this.size.height = height;
        this.size.ascent = ascent;
    }
};
COperator.prototype.IsJustDraw = function()
{
    return true;
};
COperator.prototype.Resize = function(oMeasure)
{
    if(this.typeOper !== OPERATOR_EMPTY)
    {
        var bHor = this.operator.loc == LOCATION_TOP || this.operator.loc  == LOCATION_BOT;

        if(bHor)
            this.fixSize(oMeasure, this.size.width);
        else
            this.fixSize(oMeasure, this.size.height);
    }
};
COperator.prototype.PreRecalc = function(Parent, ParaMath)
{
    this.Parent   = Parent;
    this.ParaMath = ParaMath;
    if(this.typeOper !== OPERATOR_EMPTY)
        this.operator.PreRecalc(this); // в данном случае mathText нужен только один параметр
};
COperator.prototype.Get_TxtPrControlLetter = function()
{
    return this.Parent.Get_TxtPrControlLetter();
};
COperator.prototype.Is_Empty = function()
{
    return this.typeOper == OPERATOR_EMPTY;
};
COperator.prototype.Get_CodeChr = function()
{
    /*var chr = null; //если operator не определен, то this.code = null

    if(this.code !== null)
        chr = this.typeOper === this.defaultType ? null : String.fromCharCode(this.code);
	if (this.operator == OPERATOR_EMPTY)
		chr = "";*/

    return this.code;
};
COperator.prototype.Get_Type = function()
{
    return this.typeOper;
};
COperator.prototype.IsArrow = function()
{
    //return this.operator.IsArrow();

    var bArrow = this.typeOper == ARROW_LEFT || this.typeOper == ARROW_RIGHT || this.typeOper == ARROW_LR,
        bDoubleArrow = this.typeOper == DOUBLE_LEFT_ARROW || this.typeOper == DOUBLE_RIGHT_ARROW || this.typeOper == DOUBLE_ARROW_LR,
        bAccentArrow = this.typeOper == ACCENT_ARROW_LEFT || this.typeOper == ACCENT_ARROW_RIGHT || this.typeOper == ACCENT_ARROW_LR || this.typeOper == ACCENT_HALF_ARROW_LEFT || this.typeOper == ACCENT_HALF_ARROW_RIGHT;

    return bArrow || bDoubleArrow;
};

function CMathDelimiterPr()
{
    this.begChr     = undefined;
    this.begChrType = undefined;
    this.endChr     = undefined;
    this.endChrType = undefined;
    this.sepChr     = undefined;
    this.sepChrType = undefined;
    this.shp        = DELIMITER_SHAPE_CENTERED;
    this.grow       = true;

    this.column     = 0;
}

CMathDelimiterPr.prototype.Set_Column = function(Value)
{
    this.column = Value;
};

CMathDelimiterPr.prototype.Set_FromObject = function(Obj)
{
    this.begChr     = Obj.begChr;
    this.begChrType = Obj.begChrType;
    this.endChr     = Obj.endChr;
    this.endChrType = Obj.endChrType;
    this.sepChr     = Obj.sepChr;
    this.sepChrType = Obj.sepChrType;

    if(DELIMITER_SHAPE_MATCH === Obj.shp || DELIMITER_SHAPE_CENTERED === Obj.shp)
        this.shp = Obj.shp;

    if(false === Obj.grow || 0 === Obj.grow)
        this.grow = false;

    if(undefined !== Obj.column && null !== Obj.column)
        this.column = Obj.column;
    else
        this.column = 1;
};

CMathDelimiterPr.prototype.Copy = function()
{
    var NewPr = new CMathDelimiterPr();

    NewPr.begChr     = this.begChr    ;
    NewPr.begChrType = this.begChrType;
    NewPr.endChr     = this.endChr    ;
    NewPr.endChrType = this.endChrType;
    NewPr.sepChr     = this.sepChr    ;
    NewPr.sepChrType = this.sepChrType;
    NewPr.shp        = this.shp       ;
    NewPr.grow       = this.grow      ;
    NewPr.column     = this.column    ;

    return NewPr;
};

CMathDelimiterPr.prototype.Write_ToBinary = function(Writer)
{
    // Long : Flag

    // Long : begChr
    // Long : begChrType
    // Long : endChr
    // Long : endChrType
    // Long : sepChr
    // Long : sepChrType

    // Long : shp
    // Bool : grow
    // Long : column

    var StartPos = Writer.GetCurPosition();
    Writer.Skip(4);
    var Flags = 0;

    if (undefined !== this.begChr && this.begChr !== null)
    {
        Writer.WriteLong(this.begChr);
        Flags |= 1;
    }

    if (undefined !== this.begChrType && this.begChrType !== null)
    {
        Writer.WriteLong(this.begChrType);
        Flags |= 2;
    }

    if (undefined !== this.endChr && this.endChr !== null)
    {
        Writer.WriteLong(this.endChr);
        Flags |= 4;
    }

    if (undefined !== this.endChrType && this.endChrType !== null)
    {
        Writer.WriteLong(this.endChrType);
        Flags |= 8;
    }

    if (undefined !== this.sepChr && this.sepChr !== null)
    {
        Writer.WriteLong(this.sepChr);
        Flags |= 16;
    }

    if (undefined !== this.sepChrType && this.sepChrType !== null)
    {
        Writer.WriteLong(this.sepChrType);
        Flags |= 32;
    }

    var EndPos = Writer.GetCurPosition();
    Writer.Seek(StartPos);
    Writer.WriteLong(Flags);
    Writer.Seek(EndPos);

    Writer.WriteLong(this.shp);
    Writer.WriteBool(this.grow);
    Writer.WriteLong(this.column);
};

CMathDelimiterPr.prototype.Read_FromBinary = function(Reader)
{
    // Long : Flags

    // Long : begChr
    // Long : begChrType
    // Long : endChr
    // Long : endChrType
    // Long : sepChr
    // Long : sepChrType

    // Long : shp
    // Bool : grow
    // Long : column

    var Flags = Reader.GetLong();

    if (Flags & 1)
        this.begChr = Reader.GetLong();
    else
        this.begChr = undefined;

    if (Flags & 2)
        this.begChrType = Reader.GetLong();
    else
        this.begChrType = undefined;

    if (Flags & 4)
        this.endChr = Reader.GetLong();
    else
        this.endChr = undefined;

    if (Flags & 8)
        this.endChrType = Reader.GetLong();
    else
        this.endChrType = undefined;

    if (Flags & 16)
        this.sepChr = Reader.GetLong();
    else
        this.sepChr = undefined;

    if (Flags & 32)
        this.sepChrType = Reader.GetLong();
    else
        this.sepChrType = undefined;

    this.shp        = Reader.GetLong();
    this.grow       = Reader.GetBool();
    this.column     = Reader.GetLong();
};

/**
 *
 * @param props
 * @constructor
 * @extends {CMathBase}
 */
function CDelimiter(props)
{
	CMathBase.call(this);

	this.Id = AscCommon.g_oIdCounter.Get_NewId();

    this.GeneralMetrics = new CMathSize();

    this.begOper = new COperator (OPER_DELIMITER);
    this.endOper = new COperator (OPER_DELIMITER);
    this.sepOper = new COperator (OPER_SEPARATOR);

    this.Pr = new CMathDelimiterPr();
    this.TextInContent = true;

    if(props !== null && props !== undefined)
        this.init(props);

    AscCommon.g_oTableId.Add( this, this.Id );
}
CDelimiter.prototype = Object.create(CMathBase.prototype);
CDelimiter.prototype.constructor = CDelimiter;

CDelimiter.prototype.ClassType = AscDFH.historyitem_type_delimiter;
CDelimiter.prototype.kind      = MATH_DELIMITER;

CDelimiter.prototype.init = function(props)
{
    this.setProperties(props);

    this.Fill_LogicalContent(this.getColumnsCount());

    this.fillContent();
};
CDelimiter.prototype.getColumnsCount = function()
{
    return this.Pr.column;
};
CDelimiter.prototype.fillContent = function()
{
    this.NeedBreakContent(0);

    var nColumnsCount = this.Content.length;

    this.setDimension(1, nColumnsCount);

    for (var nIndex = 0; nIndex < nColumnsCount; nIndex++)
        this.elements[0][nIndex] = this.Content[nIndex];
};
CDelimiter.prototype.ApplyProperties = function(RPI)
{
    if(this.RecalcInfo.bProps == true)
    {
        var begPrp =
        {
            chr:    this.Pr.begChr,
            type:   this.Pr.begChrType,
            grow:   this.Pr.grow,
            loc:    LOCATION_LEFT
        };
        var begDefaultPrp =
        {
            type:  PARENTHESIS_LEFT,
            chr:   0x28
        };
        this.begOper.mergeProperties(begPrp, begDefaultPrp);

        var endPrp =
        {
            chr:    this.Pr.endChr,
            type:   this.Pr.endChrType,
            grow:   this.Pr.grow,
            loc:    LOCATION_RIGHT
        };
        var endDefaultPrp =
        {
            type:  PARENTHESIS_RIGHT,
            chr:  0x29
        };

        this.endOper.mergeProperties(endPrp, endDefaultPrp);

        var sepPrp =
        {
            chr:    this.Pr.sepChr,
            type:   this.Pr.sepChrType,
            grow:   this.Pr.grow,
            loc:    LOCATION_SEP
        };
        var sepDefaultPrp =
        {
            type:  DELIMITER_LINE,
            chr:  0x7C
        };

        if(this.Pr.column == 1 )
            sepPrp.type = OPERATOR_EMPTY;

        this.sepOper.mergeProperties(sepPrp, sepDefaultPrp);

        this.RecalcInfo.bProps = false;
    }
};
CDelimiter.prototype.PreRecalc = function(Parent, ParaMath, ArgSize, RPI, GapsInfo)
{
    this.ApplyProperties(RPI);

    this.begOper.PreRecalc(this, ParaMath);
    this.endOper.PreRecalc(this, ParaMath);
    this.sepOper.PreRecalc(this, ParaMath);

    CMathBase.prototype.PreRecalc.call(this, Parent, ParaMath, ArgSize, RPI, GapsInfo);
};
CDelimiter.prototype.Recalculate_Range = function(PRS, ParaPr, Depth)
{
    this.bOneLine = PRS.bMath_OneLine == true || this.Content.length > 1; // this.Content.length > 1 - несколько контентов, разделенные сепараторами

    if(this.bOneLine == false)
    {
        var CurLine  = PRS.Line - this.StartLine;
        var CurRange = ( 0 === CurLine ? PRS.Range - this.StartRange : PRS.Range );
        var bContainCompareOper = PRS.bContainCompareOper;

        this.protected_AddRange(CurLine, CurRange);

        this.NumBreakContent = 0;

        var Content = this.Content[0];

        if(CurLine == 0 && CurRange == 0)
        {
            // посчитаем контент как одностроковый для вычисления размера скобок
            // далее будем считать объект как многостроковый на Recalculate_Range
            PRS.bMath_OneLine = true;

            var WordLen  = PRS.WordLen,
                SpaceLen = PRS.SpaceLen;

            //
            Content.Recalculate_Reset(PRS.Range, PRS.Line, PRS);

            Content.Recalculate_Range(PRS, ParaPr, Depth + 1);
            this.RecalculateGeneralSize(g_oTextMeasurer, Content.size.height, Content.size.ascent);

            // вычисляем до изменения PRS.WordLen
            this.BrGapLeft  = this.GapLeft  + this.begOper.size.width;
            this.BrGapRight = this.GapRight + this.endOper.size.width;

            PRS.WordLen  = WordLen + this.BrGapLeft;
            PRS.SpaceLen = SpaceLen;
        }
        PRS.bMath_OneLine = false;
        PRS.Update_CurPos(0, Depth);
        Content.Recalculate_Range(PRS, ParaPr, Depth + 1);

        if(PRS.NewRange == false)
        {
            PRS.WordLen += this.BrGapRight;
        }

        this.protected_FillRange(CurLine, CurRange, 0, 0);

        PRS.bMath_OneLine = false;
        PRS.bContainCompareOper = bContainCompareOper;
    }
    else
    {
        PRS.bMath_OneLine = true;
        this.NumBreakContent = -1;

        CMathBase.prototype.Recalculate_Range.call(this, PRS, ParaPr, Depth);

        this.BrGapLeft  = this.GapLeft  + this.begOper.size.width;
        this.BrGapRight = this.GapRight + this.endOper.size.width;
    }
};
CDelimiter.prototype.RecalculateMinMaxContentWidth = function(MinMax)
{
    this.BrGapLeft  = this.GapLeft  + this.begOper.size.width;
    this.BrGapRight = this.GapRight + this.endOper.size.width;

    CMathBase.prototype.RecalculateMinMaxContentWidth.call(this, MinMax);
};
CDelimiter.prototype.Is_EmptyGaps = function()
{
    var Height = g_oTextMeasurer.GetHeight();
    var result = this.GeneralMetrics.height < Height;

    return result;
};
CDelimiter.prototype.Recalculate_LineMetrics = function(PRS, ParaPr, _CurLine, _CurRange, ContentMetrics)
{
    var CurLine = _CurLine - this.StartLine;
    var CurRange = (0 === CurLine ? _CurRange - this.StartRange : _CurRange);

    CMathBase.prototype.Recalculate_LineMetrics.call(this, PRS, ParaPr, _CurLine, _CurRange, ContentMetrics);

    if(CurLine == 0 && CurRange == 0)
    {
        var BegHeight  = this.begOper.size.height;
        var BegAscent  = this.GetAscentOperator(this.begOper),
            BegDescent =  BegHeight - BegAscent;

        if(PRS.LineAscent < BegAscent)
            PRS.LineAscent = BegAscent;

        if ( PRS.LineDescent < BegDescent )
            PRS.LineDescent = BegDescent;

        // метрики скобок не зависят от выравнивания внутренних объектов(например, матриц mbaseJc = top || mbaseJc = bottom )
        var Size_BeggingOper = new CMathSize();
        Size_BeggingOper.ascent = BegAscent;
        Size_BeggingOper.height = BegAscent + BegDescent;

        ContentMetrics.UpdateMetrics(Size_BeggingOper);
    }

    var bEnd = this.Content[0].Math_Is_End(_CurLine, _CurRange);

    if(bEnd)
    {
        var EndHeight  = this.endOper.size.height;
        var EndAscent  = this.GetAscentOperator(this.endOper),
            EndDescent =  EndHeight - EndAscent;

        if(PRS.LineAscent < EndAscent)
            PRS.LineAscent = EndAscent;

        if ( PRS.LineDescent < EndDescent )
            PRS.LineDescent = EndDescent;

        var Size_EndOper = new CMathSize();
        Size_EndOper.ascent = EndAscent;
        Size_EndOper.height = EndAscent + EndDescent;

        ContentMetrics.UpdateMetrics(Size_EndOper);
    }
};
CDelimiter.prototype.RecalculateGeneralSize = function(oMeasure, height, ascent) // здесь пересчитываем скобки, общий максимальный размер delimiters
{
    var descent = height - ascent;
    var mgCtrPrp = this.Get_TxtPrControlLetter();
    var ShCenter = this.ParaMath.GetShiftCenter(oMeasure, mgCtrPrp);
    var maxAD    = ascent - ShCenter  > descent + ShCenter ? ascent - ShCenter: descent + ShCenter;

    var plH = this.ParaMath.GetPlh(oMeasure, mgCtrPrp);
    this.TextInContent = ascent < 1.01*plH && descent < 0.4*plH; // для текста операторы в случае центрирования не увеличиваем

    var bCentered = this.Pr.shp == DELIMITER_SHAPE_CENTERED,
        b2Max = bCentered && (2*maxAD - height > 0.001);

    var heightStretch = b2Max && !this.TextInContent ? 2*maxAD : height;

    this.begOper.fixSize(oMeasure, heightStretch);
    this.endOper.fixSize(oMeasure, heightStretch);
    this.sepOper.fixSize(oMeasure, heightStretch);

    var HeigthMaxOper = Math.max(this.begOper.size.height, this.endOper.size.height, this.sepOper.size.height);
    var AscentMaxOper = HeigthMaxOper/2 + ShCenter;

    g_oTextMeasurer.SetFont(mgCtrPrp);
    var Height = g_oTextMeasurer.GetHeight();

    if(this.Pr.shp == DELIMITER_SHAPE_CENTERED)
    {
        var deltaHeight = height - HeigthMaxOper;
        if(deltaHeight < 0)
            deltaHeight = -deltaHeight;

        /*var deltaMaxAD = maxAD - HeigthMaxOper/2;
        if(deltaMaxAD < 0)
            deltaMaxAD = -deltaMaxAD;

        var deltaMinAD = (height - maxAD) - HeigthMaxOper/2;*/

        var bEqualOper = deltaHeight < 0.001,
            bLText = height < Height;

        var DimHeight, DimAscent;

        if(bEqualOper)
        {
            DimHeight = 2*maxAD;
            DimAscent = maxAD + ShCenter;
        }
        else if(bLText)
        {
            DimAscent = ascent > AscentMaxOper ? ascent : AscentMaxOper;
            DimHeight = HeigthMaxOper;
        }
        else // для случаев когда скобку можно расстянуть не по всей высоте (угловые скобки, аскент >> дескента)
        {
            DimHeight = HeigthMaxOper/2 + maxAD > height ? HeigthMaxOper/2 + maxAD : height;
            DimAscent = ascent > AscentMaxOper? ascent : AscentMaxOper;
        }
    }
    else
    {
        if(height < Height)
        {
            DimAscent = ascent > AscentMaxOper ? ascent : AscentMaxOper;
            DimHeight = HeigthMaxOper;
        }
        else
        {
            DimAscent = ascent;
            DimHeight = height;
        }
    }

    this.GeneralMetrics.ascent = DimAscent;
    this.GeneralMetrics.height = DimHeight;

};
CDelimiter.prototype.recalculateSize = function(oMeasure)
{
    // размеры аргумента
    var widthG = 0,
        ascentG = 0, descentG = 0;

    for(var j = 0; j < this.Pr.column; j++)
    {
        var content = this.elements[0][j].size;
        widthG += content.width;
        ascentG = content.ascent > ascentG ? content.ascent : ascentG;
        descentG = content.height - content.ascent > descentG ? content.height - content.ascent: descentG;
    }

    this.RecalculateGeneralSize(oMeasure, ascentG + descentG, ascentG);

    // Общая ширина
    var width = widthG + this.begOper.size.width + this.endOper.size.width + (this.Pr.column - 1)*this.sepOper.size.width;
    width += this.GapLeft + this.GapRight;


    this.size.ascent = this.GeneralMetrics.ascent;
    this.size.height = this.GeneralMetrics.height;

    this.size.width = width;
};
CDelimiter.prototype.GetAscentOperator = function(operator) // в качестве аргумента передаем высоту оператора
{
    var GeneralAscent = this.GeneralMetrics.ascent,
        GeneralHeight = this.GeneralMetrics.height;

    var OperHeight = operator.size.height,
        OperAscent = operator.size.ascent;

    var Ascent;

    if(this.Pr.shp == DELIMITER_SHAPE_CENTERED)
    {
        Ascent = OperAscent;
    }
    else
    {
        var shCenter = OperAscent - OperHeight/2; // так получаем shCenter, иначе соотношение м/ду ascent и descent будет неверное

        var k = (GeneralAscent - shCenter)/GeneralHeight;

        Ascent = (k*OperHeight + shCenter);
    }

    return Ascent;
};
CDelimiter.prototype.setPosition = function(pos, PosInfo)
{
    this.UpdatePosBound(pos, PosInfo);
    var Line  = PosInfo.CurLine,
        Range = PosInfo.CurRange;

    if(this.bOneLine == false)
    {
        var PosOper = new CMathPosition();

        if(true === this.IsStartRange(Line, Range))
        {
            PosOper.x = pos.x;
            PosOper.y = pos.y - this.begOper.size.ascent;

            this.UpdatePosOperBeg(pos, Line);
        }

        this.Content[0].setPosition(pos, PosInfo);

        // пересчет еще не закончился, поэтому на LastRange не можем проверить
        if(true === this.Content[0].Math_Is_End(Line, Range))
        {
            PosOper.x = pos.x;
            PosOper.y = pos.y - this.endOper.size.ascent;

            this.UpdatePosOperEnd(pos, Line);
        }
    }
    else
    {
        this.pos.x = pos.x;
        this.pos.y = pos.y - this.size.ascent;

        var CurrPos = new CMathPosition();
        CurrPos.x = pos.x;
        CurrPos.y = pos.y;

        this.UpdatePosOperBeg(CurrPos, Line);

        this.Content[0].setPosition(CurrPos, PosInfo); // CMathContent

        var PosSep = new CMathPosition();
        PosSep.x = CurrPos.x;
        //PosSep.y = CurrPos.y + this.alignOperator(this.sepOper, Line);
        PosSep.y = CurrPos.y - this.GetAscentOperator(this.sepOper);

        this.sepOper.setPosition(PosSep);

        for(var j = 1 ; j < this.Pr.column; j++)
        {
            CurrPos.x += this.sepOper.size.width;

            this.Content[j].setPosition(CurrPos, PosInfo);
            pos.x += this.Content[j].size.width;
        }

        this.UpdatePosOperEnd(CurrPos, Line);

        pos.x = CurrPos.x;
    }
};
CDelimiter.prototype.Draw_Elements = function(PDSE)
{
    var PosLine = this.ParaMath.GetLinePosition(PDSE.Line, PDSE.Range);

    if(this.bOneLine == false)
    {
        if(true === this.IsStartRange(PDSE.Line, PDSE.Range))
        {
            this.begOper.draw(PosLine.x, PosLine.y, PDSE.Graphics, PDSE);
            PDSE.X += this.BrGapLeft;
        }

        this.Content[0].Draw_Elements(PDSE);

        if(true === this.IsLastRange(PDSE.Line, PDSE.Range))
        {
            this.endOper.draw(PosLine.x, PosLine.y, PDSE.Graphics, PDSE);
            PDSE.X += this.BrGapRight;
        }
    }
    else
    {
        this.begOper.draw(PosLine.x, PosLine.y, PDSE.Graphics, PDSE);
        PDSE.X += this.BrGapLeft;

        this.Content[0].Draw_Elements(PDSE);

        var X = PosLine.x;

        for(var j = 1; j < this.Pr.column; j++)
        {
            this.sepOper.draw(X, PosLine.y, PDSE.Graphics, PDSE);

            PDSE.X += this.sepOper.size.width;
            this.Content[j].Draw_Elements(PDSE);

            X += this.sepOper.size.width + this.Content[j].size.width;
        }

        this.endOper.draw(PosLine.x, PosLine.y, PDSE.Graphics, PDSE);
        PDSE.X += this.BrGapRight;
    }
};
CDelimiter.prototype.UpdatePosOperBeg = function(pos, Line)
{
    var PosBegOper = new CMathPosition();
    PosBegOper.x = pos.x + this.GapLeft;
    //PosBegOper.y = pos.y + this.alignOperator(this.begOper, Line);
    PosBegOper.y = pos.y - this.GetAscentOperator(this.begOper);

    this.begOper.setPosition(PosBegOper);

    pos.x += this.BrGapLeft; // BrGapLeft = GapLeft + size of beginning Operator
};
CDelimiter.prototype.UpdatePosOperEnd = function(pos, Line)
{
    var PosEndOper = new CMathPosition();
    PosEndOper.x = pos.x;
    //PosEndOper.y = pos.y + this.alignOperator(this.endOper, Line);
    PosEndOper.y = pos.y - this.GetAscentOperator(this.endOper);

    this.endOper.setPosition(PosEndOper);

    pos.x += this.BrGapRight; // BrGapRight = GapRight + size of ending Operator
};
CDelimiter.prototype.getBase = function(numb)
{
    if(numb !== numb - 0)
        numb = 0;

    return this.elements[0][numb];
};
CDelimiter.prototype.getElementMathContent = function(Index)
{
    return this.Content[Index];
};
CDelimiter.prototype.Apply_MenuProps = function(Props)
{
	var NewContent;

	if (Props.Type == Asc.c_oAscMathInterfaceType.Delimiter)
	{
		if (Props.HideBegOper !== undefined && Props.HideBegOper !== this.begOper.Is_Empty())
		{
			var BegOper = this.private_GetLeftOperator(Props.HideBegOper);

			History.Add(new CChangesMathDelimBegOper(this, this.Pr.begChr, BegOper));
			this.raw_HideBegOperator(BegOper);
		}

		if (Props.HideEndOper !== undefined && Props.HideEndOper !== this.endOper.Is_Empty())
		{
			var EndOper = this.private_GetRightOperator(Props.HideEndOper);

			History.Add(new CChangesMathDelimEndOper(this, this.Pr.endChr, EndOper));
			this.raw_HideEndOperator(EndOper);
		}

		if (Props.Grow !== undefined && Props.Grow !== this.Pr.grow)
		{
			History.Add(new CChangesMathDelimiterGrow(this, this.Pr.grow, Props.Grow));
			this.raw_SetGrow(Props.Grow);
		}

		if (Props.MatchBrackets !== undefined && this.Pr.grow == true)
		{
			var Shp = Props.MatchBrackets == true ? DELIMITER_SHAPE_MATCH : DELIMITER_SHAPE_CENTERED;

			if (Shp !== this.Pr.shp)
			{
				History.Add(new CChangesMathDelimiterShape(this, this.Pr.shp, Shp));
				this.raw_SetShape(Shp);
			}
		}

		if (Props.Action & c_oMathMenuAction.DeleteDelimiterArgument)
		{
			if (this.Pr.column > 1)
			{
				History.Add(new CChangesMathDelimiterSetColumn(this, this.Pr.column, this.Pr.column - 1));
				this.raw_SetColumn(this.Pr.column - 1);

				this.protected_RemoveItems(this.CurPos, [this.Content[this.CurPos]], true);
			}
		}

		if (Props.Action & c_oMathMenuAction.InsertDelimiterArgument)
		{
			if (Props.Action & c_oMathMenuAction.InsertBefore)
			{
				History.Add(new CChangesMathDelimiterSetColumn(this, this.Pr.column, this.Pr.column + 1));
				this.raw_SetColumn(this.Pr.column + 1);

				NewContent = new CMathContent();
				NewContent.Correct_Content(true);
				this.protected_AddToContent(this.CurPos, [NewContent], true);
			}
			else
			{
				History.Add(new CChangesMathDelimiterSetColumn(this, this.Pr.column, this.Pr.column + 1));
				this.raw_SetColumn(this.Pr.column + 1);

				NewContent = new CMathContent();
				NewContent.Correct_Content(true);
				this.protected_AddToContent(this.CurPos + 1, [NewContent], true);
			}
		}
	}
};
CDelimiter.prototype.Get_InterfaceProps = function()
{
    return new CMathMenuDelimiter(this);
};
CDelimiter.prototype.raw_SetGrow = function(Value)
{
    this.Pr.grow = Value;
    this.RecalcInfo.bProps = true;
    this.ApplyProperties();
};
CDelimiter.prototype.raw_SetShape = function(Value)
{
    if(this.Pr.grow == true && (Value == DELIMITER_SHAPE_MATCH || Value == DELIMITER_SHAPE_CENTERED))
    {
        this.Pr.shp = Value;
        this.RecalcInfo.bProps = true;
        this.ApplyProperties();
    }
};
CDelimiter.prototype.raw_SetColumn = function(Value)
{
    if((this.Pr.column == 1 && Value > 1) || (Value == 1 && this.Pr.column > 1)) // выставим сепаратор
    {
        this.Pr.Set_Column(Value);
        this.sepOper = new COperator (OPER_SEPARATOR);
        this.RecalcInfo.bProps = true;
        this.ApplyProperties();
    }
    else
    {
        this.Pr.Set_Column(Value);
    }
};
CDelimiter.prototype.raw_HideBegOperator = function(Value)
{
    this.Pr.begChr = Value;
    this.begOper = new COperator (OPER_DELIMITER);
    this.RecalcInfo.bProps = true;
    this.ApplyProperties();
};
CDelimiter.prototype.raw_HideEndOperator = function(Value)
{
    this.Pr.endChr = Value;
    this.endOper = new COperator (OPER_DELIMITER);
    this.RecalcInfo.bProps = true;
    this.ApplyProperties();
};
CDelimiter.prototype.Get_DeletedItemsThroughInterface = function()
{
    var DeletedItems = null;

    if(this.Content.length > 0)
    {
        DeletedItems = this.Content[0].Content;

        for(var Pos = 1; Pos < this.Content.length; Pos++)
        {
            var NewSpace = new CMathText(false);
            NewSpace.add(0x20);

            var CtrPrp = this.Get_CtrPrp();
            var NewRun = new ParaRun(this.ParaMath.Paragraph, true);
            NewRun.Apply_Pr(CtrPrp);
            NewRun.ConcatToContent( [NewSpace] );

            DeletedItems = DeletedItems.concat(NewRun);

            var Items = this.Content[Pos].Content;
            DeletedItems = DeletedItems.concat(Items);
        }
    }

    return DeletedItems;
};
CDelimiter.prototype.GetLastElement = function()
{
    var Result;

    var IsEndOper = this.endOper.typeOper !== OPERATOR_EMPTY;
    var growLast  = IsEndOper && this.Pr.grow == true && this.TextInContent,
        smallLast = IsEndOper && this.Pr.grow == false;

    if(growLast || smallLast || this.endOper.typeOper == OPERATOR_TEXT)
    {
        Result = this.endOper;
    }
    else
        Result = this;

    return Result;
};
CDelimiter.prototype.GetFirstElement = function()
{
    var Result;

    var IsStrartOper = this.begOper.typeOper !== OPERATOR_EMPTY;
    var growLast  = IsStrartOper && this.Pr.grow == true && this.TextInContent,
        smallLast = IsStrartOper && this.Pr.grow == false;

    if(growLast || smallLast || this.begOper.typeOper == OPERATOR_TEXT)
    {
        Result = this.begOper;
    }
    else
        Result = this;

    return Result;
};
CDelimiter.prototype.private_GetLeftOperator = function(bHide)
{
    var NewBegCode = -1;

    if(bHide == true)
    {
        NewBegCode = -1;
    }
    else if(true == this.endOper.Is_Empty())
    {
        NewBegCode = 0x28; // PARENTHESIS_LEFT
    }
    else
    {
        var TypeEndOper = this.endOper.Get_Type();

        var bSymmetricDiffTwo = TypeEndOper == BRACKET_CURLY_RIGHT || TypeEndOper == BRACKET_SQUARE_RIGHT;
        var bSymmetricDiff    = TypeEndOper == PARENTHESIS_RIGHT || TypeEndOper == BRACKET_ANGLE_RIGHT || TypeEndOper == HALF_SQUARE_RIGHT || TypeEndOper == HALF_SQUARE_RIGHT_UPPER || TypeEndOper == WHITE_SQUARE_RIGHT;

        var EndCodeChr = this.endOper.Get_CodeChr();

        if(bSymmetricDiff)
        {
            NewBegCode = EndCodeChr - 1;
        }
        else if(bSymmetricDiffTwo)
        {
            NewBegCode = EndCodeChr - 2;
        }
        else
        {
            NewBegCode = EndCodeChr;
        }
    }

    return NewBegCode;
};
CDelimiter.prototype.private_GetRightOperator = function(bHide)
{
    var NewEndCode = -1;

    if(bHide == true)
    {
        NewEndCode = -1;
    }
    else if(true == this.begOper.Is_Empty())
    {
        NewEndCode = 0x29; // PARENTHESIS_RIGHT
    }
    else
    {
        var TypeBegOper = this.begOper.Get_Type();

        var bSymmetricDiffTwo = TypeBegOper == BRACKET_CURLY_LEFT || TypeBegOper == BRACKET_SQUARE_LEFT;
        var bSymmetricDiff    = TypeBegOper == PARENTHESIS_LEFT || TypeBegOper == BRACKET_ANGLE_LEFT || TypeBegOper == HALF_SQUARE_LEFT || TypeBegOper == HALF_SQUARE_LEFT_UPPER || TypeBegOper == WHITE_SQUARE_LEFT;

        var BegCodeChr = this.begOper.Get_CodeChr();

        if(bSymmetricDiff)
        {
            NewEndCode = BegCodeChr + 1;
        }
        else if(bSymmetricDiffTwo)
        {
            NewEndCode = BegCodeChr + 2;
        }
        else
        {
            NewEndCode = BegCodeChr;
        }
    }

    return NewEndCode;
};

/**
 *
 * @param CMathMenuDelimiter
 * @constructor
 * @extends {CMathMenuBase}
 */
function CMathMenuDelimiter(Delimiter)
{
	CMathMenuBase.call(this, Delimiter);

    this.Type         = Asc.c_oAscMathInterfaceType.Delimiter;

    if (Delimiter)
    {
        this.HideBegOper        = Delimiter.begOper.Is_Empty();
        this.HideEndOper        = Delimiter.endOper.Is_Empty();
        this.Grow               = Delimiter.Pr.grow;
        this.MatchBrackets      = Delimiter.Pr.shp == DELIMITER_SHAPE_MATCH;
        this.bSingleArgument    = Delimiter.Pr.column == 1;
    }
    else
    {
        this.HideBegOper        = undefined;
        this.HideEndOper        = undefined;
        this.Grow               = undefined;
        this.MatchBrackets       = undefined;
        this.bSingleArgument    = true;
    }
}
CMathMenuDelimiter.prototype = Object.create(CMathMenuBase.prototype);
CMathMenuDelimiter.prototype.constructor = CMathMenuDelimiter;
CMathMenuDelimiter.prototype.get_HideOpeningBracket = function(){return this.HideBegOper;};
CMathMenuDelimiter.prototype.put_HideOpeningBracket = function(Hide){this.HideBegOper = Hide;};
CMathMenuDelimiter.prototype.get_HideClosingBracket = function(){return this.HideEndOper;};
CMathMenuDelimiter.prototype.put_HideClosingBracket = function(Hide){this.HideEndOper = Hide;};
CMathMenuDelimiter.prototype.get_StretchBrackets    = function(){return this.Grow;};
CMathMenuDelimiter.prototype.put_StretchBrackets    = function(Stretch){this.Grow = Stretch;};
CMathMenuDelimiter.prototype.get_MatchBrackets      = function(){return this.MatchBrackets;};
CMathMenuDelimiter.prototype.put_MatchBrackets      = function(Match){this.MatchBrackets = Match;};
CMathMenuDelimiter.prototype.can_DeleteArgument     = function(){return this.bSingleArgument == false;};
CMathMenuDelimiter.prototype.has_Separators         = function(){return this.bSingleArgument == false;};

window["CMathMenuDelimiter"]                           = CMathMenuDelimiter;
CMathMenuDelimiter.prototype["get_HideOpeningBracket"] = CMathMenuDelimiter.prototype.get_HideOpeningBracket;
CMathMenuDelimiter.prototype["put_HideOpeningBracket"] = CMathMenuDelimiter.prototype.put_HideOpeningBracket;
CMathMenuDelimiter.prototype["get_HideClosingBracket"] = CMathMenuDelimiter.prototype.get_HideClosingBracket;
CMathMenuDelimiter.prototype["put_HideClosingBracket"] = CMathMenuDelimiter.prototype.put_HideClosingBracket;
CMathMenuDelimiter.prototype["get_StretchBrackets"]    = CMathMenuDelimiter.prototype.get_StretchBrackets;
CMathMenuDelimiter.prototype["put_StretchBrackets"]    = CMathMenuDelimiter.prototype.put_StretchBrackets;
CMathMenuDelimiter.prototype["get_MatchBrackets"]      = CMathMenuDelimiter.prototype.get_MatchBrackets;
CMathMenuDelimiter.prototype["put_MatchBrackets"]      = CMathMenuDelimiter.prototype.put_MatchBrackets;
CMathMenuDelimiter.prototype["can_DeleteArgument"]     = CMathMenuDelimiter.prototype.can_DeleteArgument;
CMathMenuDelimiter.prototype["has_Separators"]         = CMathMenuDelimiter.prototype.has_Separators;

/**
 *
 * @constructor
 * @extends {CMathBase}
 */
function CCharacter()
{
    this.operator = new COperator(OPER_GROUP_CHAR);
    CMathBase.call(this);
}
CCharacter.prototype = Object.create(CMathBase.prototype);
CCharacter.prototype.constructor = CCharacter;
CCharacter.prototype.setCharacter = function(props, defaultProps)
{
    this.operator.mergeProperties(props, defaultProps);
};
CCharacter.prototype.recalculateSize = function(oMeasure)
{
    var Base = this.elements[0][0];

    this.operator.fixSize(oMeasure, Base.size.width);

    var width  = Base.size.width > this.operator.size.width ? Base.size.width : this.operator.size.width,
        height = Base.size.height + this.operator.size.height,
        ascent = this.getAscent(oMeasure);

    width += this.GapLeft + this.GapRight;

    this.size.height = height;
    this.size.width  = width;
    this.size.ascent = ascent;
};
CCharacter.prototype.setPosition = function(pos, PosInfo)
{
    this.pos.x = pos.x;
    this.pos.y = pos.y - this.size.ascent;

    this.UpdatePosBound(pos, PosInfo);

    var width = this.size.width - this.GapLeft - this.GapRight;

    var alignOp  = (width - this.operator.size.width)/2,
        alignCnt = (width - this.elements[0][0].size.width)/2;

    var PosOper = new CMathPosition(),
        PosBase = new CMathPosition();

    var Base = this.elements[0][0];

    if(this.Pr.pos === LOCATION_TOP)
    {
        PosOper.x = this.pos.x + this.GapLeft + alignOp;
        PosOper.y = this.pos.y;

        PosBase.x = this.pos.x + this.GapLeft + alignCnt;
        PosBase.y = this.pos.y + this.operator.size.height;

    }
    else if(this.Pr.pos === LOCATION_BOT)
    {
        PosBase.x = this.pos.x + this.GapLeft + alignCnt;
        PosBase.y = this.pos.y;

        //Base.setPosition(PosBase, PosInfo);

        PosOper.x = this.pos.x + this.GapLeft + alignOp;
        PosOper.y = this.pos.y + Base.size.height;

        //this.operator.setPosition(PosOper);
    }

    this.operator.setPosition(PosOper);

    if(Base.Type == para_Math_Content)
        PosBase.y += Base.size.ascent;

    Base.setPosition(PosBase, PosInfo);

    pos.x += this.size.width;
};
CCharacter.prototype.Draw_Elements = function(PDSE)
{
    var X = PDSE.X;

    this.Content[0].Draw_Elements(PDSE);

    var ctrPrp =  this.Get_TxtPrControlLetter();

    var Font =
    {
        FontSize:   ctrPrp.FontSize,
        FontFamily: {Name : ctrPrp.FontFamily.Name, Index : ctrPrp.FontFamily.Index},
        Italic:     false,
        Bold:       false
    };


    PDSE.Graphics.SetFont(Font);

    var PosLine = this.ParaMath.GetLinePosition(PDSE.Line, PDSE.Range);

    this.operator.draw(PosLine.x, PosLine.y, PDSE.Graphics, PDSE);

    PDSE.X = X + this.size.width;
};
CCharacter.prototype.getBase = function()
{
    return this.elements[0][0];
};

function CMathGroupChrPr()
{
    this.chr     = undefined;
    this.chrType = undefined;
    this.pos     = LOCATION_BOT;
    this.vertJc  = VJUST_TOP;

}
CMathGroupChrPr.prototype.Set = function(Pr)
{
    this.chr     = Pr.chr;
    this.chrType = Pr.chrType;
    this.pos     = Pr.pos;
    this.vertJc  = Pr.vertJc;
};
CMathGroupChrPr.prototype.Set_FromObject = function(Obj)
{
    this.chr     = Obj.chr;
    this.chrType = Obj.chrType;

    if(VJUST_TOP === Obj.vertJc || VJUST_BOT === Obj.vertJc)
        this.vertJc = Obj.vertJc;

    if(LOCATION_TOP === Obj.pos || LOCATION_BOT === Obj.pos)
        this.pos = Obj.pos;
};
CMathGroupChrPr.prototype.Copy = function()
{
    var NewPr = new CMathGroupChrPr();

    NewPr.chr     = this.chr    ;
    NewPr.chrType = this.chrType;
    NewPr.vertJc  = this.vertJc ;
    NewPr.pos     = this.pos    ;

    return NewPr;
};
CMathGroupChrPr.prototype.Write_ToBinary = function(Writer)
{
    // Long : Flag

    // Long : chr
    // Long : chrType

    // Long : vertJc
    // Long : pos

    var StartPos = Writer.GetCurPosition();
    Writer.Skip(4);
    var Flags = 0;

    if (undefined !== this.chr)
    {
        Writer.WriteLong(this.chr);
        Flags |= 1;
    }

    if (undefined !== this.chrType)
    {
        Writer.WriteLong(this.chrType);
        Flags |= 2;
    }

    var EndPos = Writer.GetCurPosition();
    Writer.Seek(StartPos);
    Writer.WriteLong(Flags);
    Writer.Seek(EndPos);

    Writer.WriteLong(this.vertJc);
    Writer.WriteLong(this.pos);
};
CMathGroupChrPr.prototype.Read_FromBinary = function(Reader)
{
    // Long : Flag

    // Long : chr
    // Long : chrType

    // Long : vertJc
    // Long : pos

    var Flags = Reader.GetLong();

    if (Flags & 1)
        this.chr = Reader.GetLong();
    else
        this.chr = undefined;

    if (Flags & 2)
        this.chrType = Reader.GetLong();
    else
        this.chrType = undefined;

    this.vertJc  = Reader.GetLong();
    this.pos     = Reader.GetLong();
};

/**
 *
 * @param props
 * @constructor
 * @extends {CCharacter}
 */
function CGroupCharacter(props)
{
	CCharacter.call(this);

	this.Id   = AscCommon.g_oIdCounter.Get_NewId();

    this.Pr = new CMathGroupChrPr();

    if(props !== null && props !== undefined)
        this.init(props);

    /// вызов этой функции обязательно в конце
    AscCommon.g_oTableId.Add( this, this.Id );
}
CGroupCharacter.prototype = Object.create(CCharacter.prototype);
CGroupCharacter.prototype.constructor = CGroupCharacter;
CGroupCharacter.prototype.ClassType = AscDFH.historyitem_type_groupChr;
CGroupCharacter.prototype.kind      = MATH_GROUP_CHARACTER;
CGroupCharacter.prototype.init = function(props)
{
    this.Fill_LogicalContent(1);

    this.setProperties(props);
    this.fillContent();
};
CGroupCharacter.prototype.ApplyProperties = function(RPI)
{
    if(this.RecalcInfo.bProps == true)
    {
        var operDefaultPrp =
        {
            type:   BRACKET_CURLY_BOTTOM,
            loc:    LOCATION_BOT
        };

        var operProps =
        {
            type:   this.Pr.chrType,
            chr:    this.Pr.chr,
            loc:    this.Pr.pos
        };

        this.setCharacter(operProps, operDefaultPrp);

        this.RecalcInfo.bProps = false;

        if(this.Pr.pos == this.Pr.vertJc)
        {
            var Iterator;

            if(this.Pr.pos == LOCATION_TOP)
                Iterator = new CDenominator(this.getBase());
            else
                Iterator = new CNumerator(this.getBase());

            this.elements[0][0] = Iterator;
        }
        else
            this.elements[0][0] = this.getBase();

    }
};
CGroupCharacter.prototype.PreRecalc = function(Parent, ParaMath, ArgSize, RPI, GapsInfo)
{
    this.ApplyProperties(RPI);

    this.operator.PreRecalc(this, ParaMath);

    var ArgSz = ArgSize.Copy();

    if(this.Pr.pos == this.Pr.vertJc)
        ArgSz.Decrease();

	CCharacter.prototype.PreRecalc.call(this, Parent, ParaMath, ArgSz, RPI, GapsInfo);
};
CGroupCharacter.prototype.getBase = function()
{
    return this.Content[0];
};
CGroupCharacter.prototype.fillContent = function()
{
    this.setDimension(1, 1);
    this.elements[0][0] = this.getBase();
};
CGroupCharacter.prototype.getAscent = function(oMeasure)
{
    var ascent;

    var ctrPrp = this.Get_TxtPrControlLetter();
    var shCent = this.ParaMath.GetShiftCenter(oMeasure, ctrPrp);

    if(this.Pr.vertJc === VJUST_TOP && this.Pr.pos === LOCATION_TOP)
        ascent =  this.operator.size.ascent;
    else if(this.Pr.vertJc === VJUST_BOT && this.Pr.pos === LOCATION_TOP )
        ascent = this.operator.size.height + this.elements[0][0].size.ascent;
    else if(this.Pr.vertJc === VJUST_TOP && this.Pr.pos === LOCATION_BOT )
        ascent = this.elements[0][0].size.ascent;
    else if(this.Pr.vertJc === VJUST_BOT && this.Pr.pos === LOCATION_BOT )
        ascent = this.elements[0][0].size.height + this.operator.size.height;

    return ascent;
};
CGroupCharacter.prototype.Apply_MenuProps = function(Props)
{
    if(Props.Type == Asc.c_oAscMathInterfaceType.GroupChar)
    {
        if(Props.Pos !== undefined && true == this.Can_ChangePos())
        {
            var Pos = Props.Pos == Asc.c_oAscMathInterfaceGroupCharPos.Bottom ? LOCATION_BOT : LOCATION_TOP;

            if(Pos !== this.Pr.pos)
                this.private_InversePr();
        }
    }
};
CGroupCharacter.prototype.private_GetInversePr = function(Pr)
{
    var InversePr = new CMathGroupChrPr();
    if(Pr.pos == LOCATION_TOP)
    {
        InversePr.pos     = LOCATION_BOT;
        InversePr.vertJc  = VJUST_TOP;

        if(Pr.chr == 0x23DC || Pr.chr == 0x23DD)
        {
            InversePr.chr = 0x23DD;
        }
        else if(Pr.chr == 0x23DE || Pr.chr == 0x23DF)
        {
            InversePr.chr = 0x23DF;
        }
        else
        {
            InversePr.chr = Pr.chr;
        }
    }
    else
    {
        InversePr.pos     = LOCATION_TOP;
        InversePr.vertJc  = VJUST_BOT;

        if(Pr.chr == 0x23DC || Pr.chr == 0x23DD)
        {
            InversePr.chr = 0x23DC;
        }
        else if(Pr.chr == 0x23DE || Pr.chr == 0x23DF)
        {
            InversePr.chr = 0x23DE;
        }
        else
        {
            InversePr.chr = Pr.chr;
        }
    }

    return InversePr;
};
CGroupCharacter.prototype.private_InversePr = function()
{
    var NewPr = this.private_GetInversePr(this.Pr);
    var OldPr = this.Pr.Copy();
    History.Add(new CChangesMathGroupCharPr(this, OldPr, NewPr));
    this.raw_SetPr(NewPr);
};
CGroupCharacter.prototype.raw_SetPr = function(Pr)
{
    this.Pr.Set(Pr);

    this.RecalcInfo.bProps = true;
    this.ApplyProperties();
};
CGroupCharacter.prototype.Get_InterfaceProps = function()
{
    return new CMathMenuGroupCharacter(this);
};
CGroupCharacter.prototype.Can_ModifyArgSize = function()
{
    return false === this.Is_SelectInside();
};
CGroupCharacter.prototype.Can_ChangePos = function()
{
    return this.Pr.chr == 0x23DC || this.Pr.chr == 0x23DD || this.Pr.chr == 0x23DE || this.Pr.chr == 0x23DF;
};

/**
 *
 * @param CMathMenuGroupCharacter
 * @constructor
 * @extends {CMathMenuBase}
 */
function CMathMenuGroupCharacter(GroupChr)
{
	CMathMenuBase.call(this, GroupChr);

    this.Type          = Asc.c_oAscMathInterfaceType.GroupChar;

    if (undefined !== GroupChr)
    {
        this.Pos           = GroupChr.Pr.pos == LOCATION_BOT ? Asc.c_oAscMathInterfaceGroupCharPos.Bottom : Asc.c_oAscMathInterfaceGroupCharPos.Top;
        this.bCanChangePos = GroupChr.Can_ChangePos();
    }
    else
    {
        this.Pos           = undefined;
        this.bCanChangePos = undefined;
    }
}
CMathMenuGroupCharacter.prototype = Object.create(CMathMenuBase.prototype);
CMathMenuGroupCharacter.prototype.constructor = CMathMenuGroupCharacter;
CMathMenuGroupCharacter.prototype.get_Pos         = function(){return this.Pos;};
CMathMenuGroupCharacter.prototype.put_Pos         = function(Pos){this.Pos = Pos;};
CMathMenuGroupCharacter.prototype.can_ChangePos   = function(){return this.bCanChangePos;};

//--------------------------------------------------------export----------------------------------------------------
window['AscCommonWord'] = window['AscCommonWord'] || {};
window['AscCommonWord'].CDelimiter = CDelimiter;
window['AscCommonWord'].CGroupCharacter = CGroupCharacter;

window["CMathMenuGroupCharacter"] = CMathMenuGroupCharacter;
CMathMenuGroupCharacter.prototype["get_Pos"]         = CMathMenuGroupCharacter.prototype.get_Pos;
CMathMenuGroupCharacter.prototype["put_Pos"]         = CMathMenuGroupCharacter.prototype.put_Pos;
CMathMenuGroupCharacter.prototype["can_ChangePos"]   = CMathMenuGroupCharacter.prototype.can_ChangePos;
