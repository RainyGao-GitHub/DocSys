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

//величина символа "сигма" не меняется в зависимости от аргумента
//если не выставлено в настройках
/////////////////////****//////////////////////////

function CMathNaryPr()
{
    this.chr     = undefined;
    this.chrType = NARY_INTEGRAL;
    this.grow    = false;
    this.limLoc  = undefined;
    this.subHide = false;
    this.supHide = false;
}

CMathNaryPr.prototype.Set_FromObject = function(Obj)
{
    this.chr     = Obj.chr;
    this.chrType = Obj.chrType;

    if(true === Obj.grow === true || 1 === Obj.grow)
        this.grow = true;

    if(NARY_UndOvr === Obj.limLoc || NARY_SubSup === Obj.limLoc)
        this.limLoc = Obj.limLoc;

    if(true === Obj.subHide === true || 1 === Obj.subHide)
        this.subHide = true;

    if(true === Obj.supHide === true || 1 === Obj.supHide)
        this.supHide = true;
};

CMathNaryPr.prototype.Copy = function()
{
    var NewPr = new CMathNaryPr();

    NewPr.chr     = this.chr    ;
    NewPr.chrType = this.chrType;
    NewPr.grow    = this.grow   ;
    NewPr.limLoc  = this.limLoc ;
    NewPr.subHide = this.subHide;
    NewPr.supHide = this.supHide;

    return NewPr;
};

CMathNaryPr.prototype.Write_ToBinary = function(Writer)
{
    // Long : flags

    // Long : chr
    // Long : chrType
    // Long : limLoc

    // Bool : grow
    // Bool : subHide
    // Bool : supHide

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

    if (undefined !== this.limLoc)
    {
        Writer.WriteLong(this.limLoc);
        Flags |= 4;
    }

    var EndPos = Writer.GetCurPosition();
    Writer.Seek(StartPos);
    Writer.WriteLong(Flags);
    Writer.Seek(EndPos);

    Writer.WriteBool(this.grow);
    Writer.WriteBool(this.subHide);
    Writer.WriteBool(this.supHide);
};

CMathNaryPr.prototype.Read_FromBinary = function(Reader)
{
    // Long : flags

    // Long : chr
    // Long : chrType
    // Long : limLoc

    // Bool : grow
    // Bool : subHide
    // Bool : supHide

    var Flags = Reader.GetLong();

    if (Flags & 1)
        this.chr = Reader.GetLong();
    else
        this.chr = undefined;

    if (Flags & 2)
        this.chrType = Reader.GetLong();
    else
        this.chrType = undefined;

    if (Flags & 4)
        this.limLoc = Reader.GetLong();
    else
        this.limLoc = undefined;

    this.grow    = Reader.GetBool();
    this.subHide = Reader.GetBool();
    this.supHide = Reader.GetBool();
};

/**
 *
 * @param props
 * @constructor
 * @extends {CMathBase}
 */
function CNary(props)
{
	CMathBase.call(this);

	this.Id = AscCommon.g_oIdCounter.Get_NewId();

    this.Pr = new CMathNaryPr();

    this.Base = null;
    this.Sign = null;
    this.LowerIterator = null;
    this.UpperIterator = null;
    this.Arg           = null;

    this.CurrentLimLoc = null;

    if(props !== null && props !== undefined)
        this.init(props);

    AscCommon.g_oTableId.Add( this, this.Id );
}
CNary.prototype = Object.create(CMathBase.prototype);
CNary.prototype.constructor = CNary;

CNary.prototype.ClassType = AscDFH.historyitem_type_nary;
CNary.prototype.kind      = MATH_NARY;
  
CNary.prototype.init = function(props)
{
    this.Fill_LogicalContent(3);

    this.setProperties(props);
    this.fillContent();
};
CNary.prototype.fillContent = function()
{
    this.NeedBreakContent(2);
    
    this.LowerIterator = this.Content[0];
    this.UpperIterator = this.Content[1];
    this.Arg           = this.Content[2];
};
CNary.prototype.fillBase = function(PropsInfo)
{
    this.setDimension(1, 2);

    var base;

    var Sign = PropsInfo.sign;
    var ctrPrp = this.CtrPrp.Copy();

    if(PropsInfo.limLoc === NARY_UndOvr)
    {
        if(PropsInfo.supHide && PropsInfo.subHide)
        {
            base = Sign;
        }
        else if( PropsInfo.supHide && !PropsInfo.subHide )
        {
            base = new CNaryOvr(true);
            base.setBase(Sign);
            base.setLowerIterator(this.LowerIterator);
        }
        else if( !PropsInfo.supHide && PropsInfo.subHide )
        {
            base = new CNaryUnd(true);
            base.setBase(Sign);
            base.setUpperIterator(this.UpperIterator);
        }
        else
        {
            base = new CNaryUndOvr(true);
            base.setBase(Sign);
            base.setUpperIterator(this.UpperIterator);
            base.setLowerIterator(this.LowerIterator);
        }
    }
    else
    {
        var prp;

        if( PropsInfo.supHide && !PropsInfo.subHide )
        {
            prp = {type: DEGREE_SUBSCRIPT, ctrPrp:  ctrPrp};
            base = new CDegreeBase(prp, true);
            base.setBase(Sign);
            base.setIterator(this.LowerIterator);
            base.fillContent();
        }
        else if( !PropsInfo.supHide && PropsInfo.subHide )
        {
            prp = {type: DEGREE_SUPERSCRIPT, ctrPrp: ctrPrp};
            base = new CDegreeBase(prp, true);
            base.setBase(Sign);
            base.setIterator(this.UpperIterator);

            base.fillContent();

        }
        else if(PropsInfo.supHide && PropsInfo.subHide)
        {
            base = Sign;
        }
        else
        {
            prp = {type: DEGREE_SubSup, ctrPrp: ctrPrp};
            base = new CDegreeSubSupBase(prp, true);
            base.setBase(Sign);
            base.setLowerIterator(this.LowerIterator);
            base.setUpperIterator(this.UpperIterator);
            
            base.fillContent();
        }
    }

    this.Base = base;

    this.addMCToContent( [base, this.Arg] );

};
CNary.prototype.ApplyProperties = function(RPI)
{
    var bSimpleNarySubSup = RPI.bInline == true || RPI.bDecreasedComp == true;
    var limLoc = bSimpleNarySubSup == true ? NARY_SubSup : this.private_GetLimLoc();

    if(this.RecalcInfo.bProps == true || RPI.bChangeInline == true || limLoc !== this.CurrentLimLoc)
    {
        var oSign = this.getSign(this.Pr.chr, this.Pr.chrType);

        if(bSimpleNarySubSup)
        {
            this.Sign = new CMathText(true);
            this.Sign.add(oSign.chrCode);
        }
        else
        {
            this.Sign = oSign.operator;
        }

        var PropsInfo =
        {
            limLoc :    limLoc,
            sign:       this.Sign,
            supHide:    this.Pr.supHide,
            subHide:    this.Pr.subHide
        };

        // пока оставим так, chrType сейчас нигде не используется
        this.Pr.chrType = oSign.chrType;

        this.fillBase(PropsInfo);

        this.RecalcInfo.bProps = false;
    }

    this.CurrentLimLoc = limLoc;
};
CNary.prototype.private_GetLimLoc = function()
{
    var limLoc         = this.Pr.limLoc;

    if(limLoc === null || limLoc === undefined)
    {
        var bIntegral = (this.Pr.chr > 0x222A && this.Pr.chr < 0x2231) || this.Pr.chr === null || this.Pr.chr === undefined;

        var oMathSettings = Get_WordDocumentDefaultMathSettings();
        if(bIntegral)
            limLoc = oMathSettings.Get_IntLim();
        else
            limLoc = oMathSettings.Get_NaryLim();
    }

    return limLoc;
};
CNary.prototype.PreRecalc = function(Parent, ParaMath, ArgSize, RPI, GapsInfo)
{
    var bNaryInline = RPI.bNaryInline;

    if(RPI.bInline || RPI.bDecreasedComp)
        RPI.bNaryInline = true;

    CMathBase.prototype.PreRecalc.call(this, Parent, ParaMath, ArgSize, RPI, GapsInfo);

    RPI.bNaryInline = bNaryInline;
};
CNary.prototype.getSign = function(chrCode, chrType)
{    
    var result = 
    {
        chrCode:   null,
        chrType:   null,
        operator:  null
    };

    var bChr = chrCode !== null && chrCode == chrCode + 0;

    if(chrCode == 0x222B || chrType == NARY_INTEGRAL)
    {
        result.chrCode = 0x222B;
        result.chrType = NARY_INTEGRAL;
        result.operator = new CIntegral();
    }
    else if(chrCode == 0x222C || chrType == NARY_DOUBLE_INTEGRAL)
    {
        result.chrCode = 0x222C;
        result.chrType = NARY_DOUBLE_INTEGRAL;
        result.operator = new CDoubleIntegral();
    }
    else if(chrCode == 0x222D || chrType == NARY_TRIPLE_INTEGRAL)
    {
        result.chrCode = 0x222D;
        result.chrType = NARY_TRIPLE_INTEGRAL;
        result.operator = new CTripleIntegral();
    }
    else if(chrCode == 0x222E || chrType == NARY_CONTOUR_INTEGRAL )
    {
        result.chrCode = 0x222E;
        result.chrType = NARY_CONTOUR_INTEGRAL;
        result.operator = new CContourIntegral();
    }
    else if(chrCode == 0x222F || chrType == NARY_SURFACE_INTEGRAL )
    {
        result.chrCode = 0x222F;
        result.chrType = NARY_SURFACE_INTEGRAL;
        result.operator = new CSurfaceIntegral();
    }
    else if(chrCode == 0x2230 || chrType == NARY_VOLUME_INTEGRAL)
    {
        result.chrCode = 0x2230;
        result.chrType = NARY_VOLUME_INTEGRAL;
        result.operator = new CVolumeIntegral();
    }
    else if(chrCode == 0x2211 || chrType == NARY_SIGMA)
    {
        result.chrCode = 0x2211;
        result.chrType = NARY_SIGMA;
        result.operator = new CSigma();
    }
    else if(chrCode == 0x220F || chrType == NARY_PRODUCT)
    {
        result.chrCode = 0x220F;
        result.chrType = NARY_PRODUCT;
        result.operator = new CProduct();
    }
    else if(chrCode == 0x2210 || chrType == NARY_COPRODUCT)
    {
        result.chrCode = 0x2210;
        result.chrType = NARY_COPRODUCT;
        result.operator = new CProduct(-1);
    }
    else if(chrCode == 0x22C3 || chrType == NARY_UNION)
    {
        result.chrCode = 0x22C3;
        result.chrType = NARY_UNION;
        result.operator = new CUnion();
    }
    else if(chrCode == 0x22C2 || chrType == NARY_INTERSECTION)
    {
        result.chrCode = 0x22C2;
        result.chrType = NARY_INTERSECTION;
        result.operator = new CUnion(-1);
    }
    else if(chrCode == 0x22C1 || chrType == NARY_LOGICAL_OR)
    {
        result.chrCode = 0x22C1;
        result.chrType = NARY_LOGICAL_OR;
        result.operator  = new CLogicalOr();
    }
    else if(chrCode == 0x22C0 || chrType == NARY_LOGICAL_AND)
    {
        result.chrCode = 0x22C0;
        result.chrType = NARY_LOGICAL_AND;
        result.operator  = new CLogicalOr(-1);
    }
    else if(bChr)
    {
        result.chrCode = chrCode;
        result.chrType = NARY_TEXT_OPER;
        result.operator = new CMathText(true);
        result.operator.add(chrCode);

    }
    else
    {
        result.chrCode = 0x222B;
        result.chrType = NARY_INTEGRAL;
        result.operator = new CIntegral();
    }

    return result;
};
CNary.prototype.setCtrPrp = function(txtPrp)
{
    this.CtrPrp.Merge(txtPrp); // only runPrp for paragraph
    //this.RunPrp.setTxtPrp(txtPrp);

    if(this.elements.length > 0 && !this.elements[0][0].IsJustDraw())
    {
        this.elements[0][0].setCtrPrp(this.CtrPrp);
    }
};
CNary.prototype.setDistance = function()
{
    this.dW = this.Get_TxtPrControlLetter().FontSize/36*2.45;
};
CNary.prototype.getBase = function()
{
    return this.Arg;
};
CNary.prototype.getUpperIterator = function()
{
	if (!this.Pr.supHide)
		return this.UpperIterator;
};
CNary.prototype.getLowerIterator = function()
{
	if (!this.Pr.subHide)
		return this.LowerIterator;
};
CNary.prototype.getBaseMathContent = function()
{
    return this.Arg;
};
CNary.prototype.getSupMathContent = function()
{
    return this.UpperIterator;
};
CNary.prototype.getSubMathContent = function()
{
    return this.LowerIterator;
};
CNary.prototype.Apply_MenuProps = function(Props)
{
	if (Props.Type == Asc.c_oAscMathInterfaceType.LargeOperator)
	{
		if (Props.LimLoc !== undefined && false == this.ParaMath.Is_Inline() && this.Pr.limLoc !== Props.LimLoc)
		{
			var LimLoc = Props.LimLoc == Asc.c_oAscMathInterfaceNaryLimitLocation.SubSup ? NARY_SubSup : NARY_UndOvr;
			AscCommon.History.Add(new CChangesMathNaryLimLoc(this, this.Pr.limLoc, LimLoc));
			this.raw_SetLimLoc(LimLoc);
		}

		if (Props.HideUpper !== undefined && Props.HideUpper !== this.Pr.supHide)
		{
			AscCommon.History.Add(new CChangesMathNaryUpperLimit(this, this.Pr.supHide, !this.Pr.supHide));
			this.raw_HideUpperIterator(!this.Pr.supHide);
		}

		if (Props.HideLower !== undefined && Props.HideLower !== this.Pr.subHide)
		{
			AscCommon.History.Add(new CChangesMathNaryLowerLimit(this, this.Pr.subHide, !this.Pr.subHide));
			this.raw_HideLowerIterator(!this.Pr.subHide);
		}
	}
};
CNary.prototype.Get_InterfaceProps = function()
{
    return new CMathMenuNary(this);
};
CNary.prototype.raw_SetLimLoc = function(Value)
{
    if(this.Pr.limLoc !== Value)
    {
        this.Pr.limLoc = Value;
        this.RecalcInfo.bProps = true;
    }
};
CNary.prototype.raw_HideUpperIterator = function(Value)
{
    if(this.Pr.supHide !== Value)
    {
        this.Pr.supHide = Value;
        this.RecalcInfo.bProps = true;

        this.CurPos = 2;
        this.Arg.MoveCursorToStartPos();
    }
};
CNary.prototype.raw_HideLowerIterator = function(Value)
{
    if(this.Pr.subHide !== Value)
    {
        this.Pr.subHide = Value;
        this.RecalcInfo.bProps = true;

        this.CurPos = 2;
        this.Arg.MoveCursorToStartPos();
    }
};
CNary.prototype.Is_ContentUse = function(MathContent)
{
    if (MathContent === this.getBaseMathContent())
        return true;

    if (true !== this.Pr.subHide && MathContent === this.getSubMathContent())
        return true;

    if (true !== this.Pr.supHide && MathContent === this.getSupMathContent())
        return true;

    return false;
};
CNary.prototype.Recalculate_Range = function(PRS, ParaPr, Depth)
{
    this.bOneLine = PRS.bMath_OneLine;

    if(this.bOneLine === true)
    {
        CMathBase.prototype.Recalculate_Range.call(this, PRS, ParaPr, Depth);
    }
    else
    {
        var CurLine  = PRS.Line - this.StartLine;
        var CurRange = ( 0 === CurLine ? PRS.Range - this.StartRange : PRS.Range );

        this.setDistance();

        var bContainCompareOper = PRS.bContainCompareOper;

        var RangeStartPos = this.protected_AddRange(CurLine, CurRange),
            RangeEndPos = 2;


        if(CurLine == 0 && CurRange == 0)
        {
            PRS.WordLen += this.BrGapLeft;
            var WordLen = PRS.WordLen;

            if(this.Base.IsJustDraw())
            {
                this.MeasureJustDraw(this.Base);
            }
            else
            {
                PRS.bMath_OneLine = true;
                this.Base.Recalculate_Reset(PRS.Range, PRS.Line, PRS);
                this.LowerIterator.Recalculate_Reset(PRS.Range, PRS.Line, PRS);
                this.UpperIterator.Recalculate_Reset(PRS.Range, PRS.Line, PRS);
                this.Base.Recalculate_Range(PRS, ParaPr, Depth);
            }

            PRS.WordLen = WordLen + this.Base.size.width;

            if(false === PRS.Word && false === PRS.FirstItemOnLine)
            {
                PRS.Word = true;
            }

            PRS.WordLen += this.dW;

            this.Arg.Recalculate_Reset(PRS.Range, PRS.Line, PRS); // обновим StartLine и StartRange
        }

        PRS.Update_CurPos(2, Depth); // this.Arg = this.Content[2]
        PRS.bMath_OneLine  = false;
        this.Arg.Recalculate_Range(PRS, ParaPr, Depth+1);


        if(PRS.NewRange == false)
        {
            PRS.WordLen += this.BrGapRight;
        }

        this.protected_FillRange(CurLine, CurRange, RangeStartPos, RangeEndPos);

        PRS.bMath_OneLine = false;
        PRS.bContainCompareOper = bContainCompareOper;
    }
};
CNary.prototype.Recalculate_Range_Width = function(PRSC, _CurLine, _CurRange)
{
    if(this.bOneLine == true)
    {
        CMathBase.prototype.Recalculate_Range_Width.call(this, PRSC, _CurLine, _CurRange);
    }
    else
    {
        var CurLine = _CurLine - this.StartLine;
        var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange );

        var RangeW = PRSC.Range.W;

        if(CurLine == 0 && CurRange == 0)
        {
            PRSC.Range.W += this.BrGapLeft;
            var RangeW2 = PRSC.Range.W;

            if(this.Base.IsJustDraw() == false)
            {
                this.LowerIterator.Recalculate_Range_Width(PRSC, _CurLine, _CurRange);
                this.UpperIterator.Recalculate_Range_Width(PRSC, _CurLine, _CurRange);

                this.Base.Bounds.SetWidth(CurLine, CurRange, this.Base.size.width);
            }

            PRSC.Range.W = RangeW2 + this.Base.size.width + this.dW;

        }

        this.Arg.Recalculate_Range_Width( PRSC, _CurLine, _CurRange );

        if(this.Arg.Math_Is_End( _CurLine, _CurRange))
        {
            PRSC.Range.W += this.BrGapRight;
        }

        this.Bounds.SetWidth(CurLine, CurRange, PRSC.Range.W - RangeW);
    }
};
CNary.prototype.Draw_Elements = function(PDSE)
{
    var CurLine  = PDSE.Line - this.StartLine;
    var CurRange = ( 0 === CurLine ? PDSE.Range - this.StartRange : PDSE.Range );

    if(CurLine == 0 && CurRange == 0)
    {
        if(this.Base.IsJustDraw()) // для Just-Draw элементов надо выставить Font
        {
            var ctrPrp = this.Get_TxtPrControlLetter();

            var Font =
            {
                FontSize:   ctrPrp.FontSize,
                FontFamily: {Name : ctrPrp.FontFamily.Name, Index : ctrPrp.FontFamily.Index},
                Italic:     false,
                Bold:       false //ctrPrp.Bold
            };

            PDSE.Graphics.SetFont(Font);
        }
        this.Base.Draw_Elements(PDSE);
    }

    this.Arg.Draw_Elements(PDSE);
};
CNary.prototype.UpdateBoundsPosInfo = function(PRSA, _CurLine, _CurRange, _CurPage)
{
    if(this.bOneLine == false)
    {
        var CurLine  = _CurLine - this.StartLine;
        var CurRange = ( 0 === CurLine ? _CurRange - this.StartRange : _CurRange);

        this.Bounds.SetGenPos(CurLine, CurRange, PRSA);
        this.Bounds.SetPage(CurLine, CurRange, _CurPage);

        if(false == this.Base.IsJustDraw())
        {
            this.Base.UpdateBoundsPosInfo(PRSA, _CurLine, _CurRange, _CurPage);
        }

        this.Arg.UpdateBoundsPosInfo(PRSA, _CurLine, _CurRange, _CurPage);

    }
    else
    {
        CMathBase.prototype.UpdateBoundsPosInfo.call(this, PRSA, _CurLine, _CurRange, _CurPage);
    }

};
CNary.prototype.Recalculate_LineMetrics = function(PRS, ParaPr, _CurLine, _CurRange, ContentMetrics)
{
    if(this.bOneLine)
    {
        CMathBase.prototype.Recalculate_LineMetrics.call(this, PRS, ParaPr, _CurLine, _CurRange, ContentMetrics);
    }
    else
    {
        var CurLine = _CurLine - this.StartLine;
        var CurRange = (0 === CurLine ? _CurRange - this.StartRange : _CurRange);

        if(PRS.bFastRecalculate === false)
        {
            this.Bounds.Reset(CurLine, CurRange);
        }

        // т.к. ParaNumbering привязывается к первому текстовому элементы, он может находится в аргументе
        // обновляем LineMetrics для Base после того, как обновим метрики для аргумента

        this.Arg.Recalculate_LineMetrics(PRS, ParaPr, _CurLine, _CurRange, ContentMetrics);

        var BoundArg = this.Arg.Get_LineBound(_CurLine, _CurRange);

        this.Bounds.UpdateMetrics(CurLine, CurRange, BoundArg);
        this.UpdatePRS(PRS, BoundArg);

        if(CurLine == 0 && CurRange == 0)
        {
            //this.Bounds.Reset();

            if(this.Base.IsJustDraw())
            {
                this.Bounds.UpdateMetrics(CurLine, CurRange, this.Base.size);
                ContentMetrics.UpdateMetrics(this.Base.size);
                this.UpdatePRS(PRS, this.Base.size);
            }
            else
            {
                // чтобы при вычислении метрик итераторов не были перебили метрики (например, у внутр мат объекта Asc может быть больше Asc текущего объекта)

                var NewContentMetrics = new CMathBoundsMeasures();

                this.LowerIterator.Recalculate_LineMetrics(PRS, ParaPr, _CurLine, _CurRange, NewContentMetrics);
                this.UpperIterator.Recalculate_LineMetrics(PRS, ParaPr, _CurLine, _CurRange, NewContentMetrics);

                this.Base.Recalculate_LineMetrics(PRS, ParaPr, _CurLine, _CurRange, ContentMetrics);

                this.Bounds.UpdateMetrics(CurLine, CurRange, this.Base.size);
                this.UpdatePRS(PRS, this.Base.size);
            }

        }
    }
};
CNary.prototype.setPosition = function(pos, PosInfo)
{
    if(this.bOneLine)
    {
        CMathBase.prototype.setPosition.call(this, pos, PosInfo);
    }
    else
    {
        var Line  = PosInfo.CurLine,
            Range = PosInfo.CurRange;
        var CurLine  = Line - this.StartLine;
        var CurRange = ( 0 === CurLine ? Range - this.StartRange : Range );

        this.UpdatePosBound(pos, PosInfo);

        if(CurLine == 0 && CurRange == 0)
        {
            pos.x += this.BrGapLeft;

            var PosBase = new CMathPosition();
            PosBase.x = pos.x;
            PosBase.y = pos.y - this.Base.size.ascent;

            this.Base.setPosition(PosBase, PosInfo);

            pos.x += this.Base.size.width + this.dW;
        }

        this.Arg.setPosition(pos, PosInfo);

        if(this.Arg.Math_Is_End(Line, Range))
        {
            pos.x += this.BrGapRight;
        }
    }
};
CNary.prototype.Can_ModifyArgSize = function()
{
    return this.CurPos !== 2 && false === this.Is_SelectInside();
};


/**
 *
 * @param CMathMenuNary
 * @constructor
 * @extends {CMathMenuBase}
 */
function CMathMenuNary(Nary)
{
	CMathMenuBase.call(this, Nary);

    this.Type             = Asc.c_oAscMathInterfaceType.LargeOperator;

    if (undefined !== Nary)
    {
        var HideUpper = undefined, HideLower = undefined;
        if (true === Nary.UpperIterator.IsPlaceholder())
            HideUpper = Nary.Pr.supHide == true;

        if (true === Nary.LowerIterator.IsPlaceholder())
            HideLower = Nary.Pr.subHide == true;

        this.bCanChangeLimLoc = false == Nary.ParaMath.Is_Inline();
        this.LimLoc           = Nary.Pr.limLoc === NARY_SubSup ? Asc.c_oAscMathInterfaceNaryLimitLocation.SubSup : Asc.c_oAscMathInterfaceNaryLimitLocation.UndOvr;
        this.HideUpper        = HideUpper;
        this.HideLower        = HideLower;
    }
    else
    {
        this.LimLoc    			= undefined;
        this.HideUpper 			= undefined;
        this.HideLower 			= undefined;
        this.bCanChangeLimLoc 	= false;
    }
}
CMathMenuNary.prototype = Object.create(CMathMenuBase.prototype);
CMathMenuNary.prototype.constructor = CMathMenuNary;
CMathMenuNary.prototype.can_ChangeLimitLocation = function(){ return this.bCanChangeLimLoc;};
CMathMenuNary.prototype.get_LimitLocation       = function(){return this.LimLoc;};
CMathMenuNary.prototype.put_LimitLocation       = function(LimLoc){this.LimLoc = LimLoc;};
CMathMenuNary.prototype.get_HideUpper           = function(){return this.HideUpper;};
CMathMenuNary.prototype.put_HideUpper           = function(Hide){this.HideUpper = Hide;};
CMathMenuNary.prototype.get_HideLower           = function(){return this.HideLower;};
CMathMenuNary.prototype.put_HideLower           = function(Hide){this.HideLower = Hide;};

window["CMathMenuNary"] = CMathMenuNary;
CMathMenuNary.prototype["can_ChangeLimitLocation"] = CMathMenuNary.prototype.can_ChangeLimitLocation;
CMathMenuNary.prototype["get_LimitLocation"]       = CMathMenuNary.prototype.get_LimitLocation;
CMathMenuNary.prototype["put_LimitLocation"]       = CMathMenuNary.prototype.put_LimitLocation;
CMathMenuNary.prototype["get_HideUpper"]           = CMathMenuNary.prototype.get_HideUpper;
CMathMenuNary.prototype["put_HideUpper"]           = CMathMenuNary.prototype.put_HideUpper;
CMathMenuNary.prototype["get_HideLower"]           = CMathMenuNary.prototype.get_HideLower;
CMathMenuNary.prototype["put_HideLower"]           = CMathMenuNary.prototype.put_HideLower;

/**
 *
 * @param bInside
 * @constructor
 * @extends {CMathBase}
 */
function CNaryUnd(bInside)
{
    CMathBase.call(this, bInside);

    this.setDimension(2, 1);
    //this.init();
}
CNaryUnd.prototype = Object.create(CMathBase.prototype);
CNaryUnd.prototype.constructor = CNaryUnd;
CNaryUnd.prototype.setDistance = function()
{
    var zetta = this.Get_TxtPrControlLetter().FontSize*25.4/96;
    this.dH = zetta*0.25;
};
CNaryUnd.prototype.getAscent = function()
{
    return this.elements[0][0].size.height + this.dH + this.elements[1][0].size.ascent;
};
CNaryUnd.prototype.getUpperIterator = function()
{
    return this.elements[0][0];
};
CNaryUnd.prototype.PreRecalc = function(Parent, ParaMath, ArgSize, RPI)
{
    this.Parent = Parent;
    this.ParaMath = ParaMath;

    this.Set_CompiledCtrPrp(Parent, ParaMath, RPI);

    var ArgSzUnd = ArgSize.Copy();
    ArgSzUnd.Decrease();

    this.elements[1][0].PreRecalc(this, ParaMath, ArgSize,  RPI);

    var bDecreasedComp = RPI.bDecreasedComp;
    RPI.bDecreasedComp = true;

    this.elements[0][0].PreRecalc(this, ParaMath, ArgSzUnd, RPI);

    RPI.bDecreasedComp = bDecreasedComp;
};
CNaryUnd.prototype.setBase = function(base)
{
    this.elements[1][0] = base;
};
CNaryUnd.prototype.setUpperIterator = function(iterator)
{
    this.elements[0][0] = iterator;
};

/**
 *
 * @param bInside
 * @constructor
 * @extends {CMathBase}
 */
function CNaryOvr(bInside)
{
    CMathBase.call(this, bInside);

    this.setDimension(2, 1);
}
CNaryOvr.prototype = Object.create(CMathBase.prototype);
CNaryOvr.prototype.constructor = CNaryOvr;
CNaryOvr.prototype.PreRecalc = function(Parent, ParaMath, ArgSize, RPI)
{
    this.Parent = Parent;
    this.ParaMath = ParaMath;

    this.Set_CompiledCtrPrp(Parent, ParaMath, RPI);

    var ArgSzOvr = ArgSize.Copy();
    ArgSzOvr.Decrease();

    this.elements[0][0].PreRecalc(this, ParaMath, ArgSize,  RPI);

    var bDecreasedComp = RPI.bDecreasedComp;
    RPI.bDecreasedComp = true;

    this.elements[1][0].PreRecalc(this, ParaMath, ArgSzOvr, RPI);

    RPI.bDecreasedComp = bDecreasedComp;
};
CNaryOvr.prototype.recalculateSize = function()
{
    var FontSize = this.Get_TxtPrControlLetter().FontSize;
    var zetta = FontSize*25.4/96;

    var minGapBottom = zetta*0.1,
        DownBaseline = FontSize*0.23;

    var nOper = this.elements[0][0].size,
        iter = this.elements[1][0].size;

    this.dH = DownBaseline > iter.ascent + minGapBottom ? DownBaseline - iter.ascent : minGapBottom;

    var ascent = nOper.ascent;
    var width = nOper.width > iter.width ? nOper.width : iter.width;
    width += this.GapLeft + this.GapRight;

    var height = nOper.height + this.dH + iter.height;

    this.size.height = height;
    this.size.width  = width;
    this.size.ascent = ascent;
};
CNaryOvr.prototype.getLowerIterator = function()
{
    return this.elements[1][0];
};
CNaryOvr.prototype.setBase = function(base)
{
    this.elements[0][0] = base;
};
CNaryOvr.prototype.setLowerIterator = function(iterator)
{
    this.elements[1][0] = iterator;
};

/**
 *
 * @param bInside
 * @constructor
 * @extends {CMathBase}
 */
function CNaryUndOvr(bInside)
{
    this.gapTop = 0;
    this.gapBottom = 0;
    CMathBase.call(this, bInside);

    this.setDimension(3,1);
}
CNaryUndOvr.prototype = Object.create(CMathBase.prototype);
CNaryUndOvr.prototype.constructor = CNaryUndOvr;
CNaryUndOvr.prototype.PreRecalc = function(Parent, ParaMath, ArgSize, RPI)
{
    this.Parent = Parent;
    this.ParaMath = ParaMath;

    this.Set_CompiledCtrPrp(Parent, ParaMath, RPI);

    var ArgSzIter = ArgSize.Copy();
    ArgSzIter.Decrease();

    this.elements[1][0].PreRecalc(this, ParaMath, ArgSize,  RPI);

    var bDecreasedComp = RPI.bDecreasedComp;
    RPI.bDecreasedComp = true;

    this.elements[0][0].PreRecalc(this, ParaMath, ArgSzIter, RPI);

    this.elements[2][0].PreRecalc(this, ParaMath, ArgSzIter, RPI);

    RPI.bDecreasedComp = bDecreasedComp;
};
CNaryUndOvr.prototype.recalculateSize = function()
{
    var FontSize = this.Get_TxtPrControlLetter().FontSize;
    var zetta = FontSize*25.4/96;
    this.gapTop = zetta*0.25;

    var minGapBottom = zetta*0.1,
        DownBaseline = FontSize*0.23;

    var ascLIter = this.elements[2][0].size.ascent;
    this.gapBottom = DownBaseline > ascLIter + minGapBottom ? DownBaseline - ascLIter : minGapBottom;

    var ascent = this.elements[0][0].size.height + this.gapTop + this.elements[1][0].size.ascent;

    var width = 0, height = 0;
    for(var i = 0; i < 3; i++)
    {
        width = width > this.elements[i][0].size.width ? width : this.elements[i][0].size.width;
        height += this.elements[i][0].size.height;
    }

    width += this.GapLeft + this.GapRight;
    height += this.gapTop + this.gapBottom;

    this.size.height = height;
    this.size.width  = width;
    this.size.ascent = ascent;
};
CNaryUndOvr.prototype.setPosition = function(pos, PosInfo)
{
    this.pos.x = pos.x;
    this.pos.y = pos.y;

    var UpIter  = this.elements[0][0],
        Sign    = this.elements[1][0],
        LowIter = this.elements[2][0];

    var PosUpIter = new CMathPosition();

    PosUpIter.x = pos.x + this.GapLeft + this.align(0,0).x;
    PosUpIter.y = pos.y + UpIter.size.ascent;


    var PosSign = new CMathPosition();

    PosSign.x = pos.x + this.GapLeft + this.align(1,0).x;
    PosSign.y = pos.y + UpIter.size.height + this.gapTop;


    var PosLowIter = new CMathPosition();

    PosLowIter.x = pos.x + this.GapLeft + this.align(2,0).x;
    PosLowIter.y = PosSign.y + Sign.size.height + this.gapBottom + LowIter.size.ascent;

    // такой порядок нужен для выравнивания Box по операторам
    LowIter.setPosition(PosLowIter, PosInfo);
    Sign.setPosition(PosSign, PosInfo);
    UpIter.setPosition(PosUpIter, PosInfo);
};
CNaryUndOvr.prototype.setBase = function(base)
{
    this.elements[1][0] = base;
};
CNaryUndOvr.prototype.setUpperIterator = function(iterator)
{
    this.elements[0][0] = iterator;
};
CNaryUndOvr.prototype.setLowerIterator = function(iterator)
{
    this.elements[2][0] = iterator;
};
CNaryUndOvr.prototype.getLowerIterator = function()
{
    return this.elements[2][0];
};
CNaryUndOvr.prototype.getUpperIterator = function()
{
    return this.elements[0][0];
};


function CNaryOperator(flip)
{
    this.size = new CMathSize();
    this.pos = new CMathPosition();
    this.bFlip = (flip == -1);
    this.Parent   = null;
    this.ParaMath = null;
    this.sizeGlyph = null;
}
CNaryOperator.prototype.Draw_Elements = function(PDSE)
{
    this.Parent.Make_ShdColor(PDSE, this.Parent.Get_CompiledCtrPrp());

    var PosLine = this.ParaMath.GetLinePosition(PDSE.Line, PDSE.Range);

    if(this.Type == para_Math_Text)
        this.drawTextElem(PosLine.x, PosLine.y, PDSE.Graphics);
    else
        this.drawGlyph(PosLine.x, PosLine.y, PDSE.Graphics, PDSE);
};
CNaryOperator.prototype.drawGlyph = function(x, y, pGraphics, PDSE)
{
    var coord = this.getCoord();

    var X = coord.X,
        Y = coord.Y;

    var XX = [],
        YY = [];

    var textScale = this.Get_TxtPrControlLetter().FontSize/850; // 1000 pt
    var alpha = textScale*25.4/96 /64; // коэффициент; используется для того чтобы перевести координаты в миллиметры
    // g_dKoef_px_to_mm = 25.4/96

    var a, b;
    if(this.bFlip)
    {
        a = -1;
        b = this.sizeGlyph.height;
    }
    else
    {
        a = 1;
        b = 0;
    }

    for(var i = 0 ; i < X.length; i++)
    {
        XX[i] = this.pos.x + x + X[i]*alpha;
        YY[i] = this.pos.y + y + (a*Y[i]*alpha + b);
    }

    var intGrid = pGraphics.GetIntegerGrid();
    pGraphics.SetIntegerGrid(false);

    pGraphics.p_width(0);

    pGraphics._s();

    this.drawPath(pGraphics, XX,YY);

    pGraphics.df();
    pGraphics._s();
    pGraphics.SetIntegerGrid(intGrid);
};
CNaryOperator.prototype.drawTextElem = function(x, y, pGraphics)
{
    //pGraphics.b_color1(0,0,0,255);

    var ctrPrp = this.Get_TxtPrControlLetter();

    var Font =
    {
        FontSize:   ctrPrp.FontSize,
        FontFamily: {Name : ctrPrp.FontFamily.Name, Index : ctrPrp.FontFamily.Index},
        Italic:     false,
        Bold:       false //ctrPrp.Bold
    };

    pGraphics.SetFont(Font);

    // ?????????????????????????????????????????????????????????
    // CNaryOperator.superclass.call.draw(this, x, y, pGraphics);
};
CNaryOperator.prototype.IsJustDraw = function()
{
    return true;
};
CNaryOperator.prototype.setPosition = function(pos)
{
    this.pos.x = pos.x;
    this.pos.y = pos.y;
};
CNaryOperator.prototype.recalculateSize = function()
{
    this.sizeGlyph = this.calculateSizeGlyph();

    var height = this.sizeGlyph.height,
        width =  this.sizeGlyph.width,
        ascent = this.sizeGlyph.height/2 + DIV_CENT*this.Get_TxtPrControlLetter().FontSize;

    this.size.height = height;
    this.size.width  = width;
    this.size.ascent = ascent;
};
CNaryOperator.prototype.PreRecalc = function(Parent, ParaMath, ArgSize, RPI)
{
    this.Parent = Parent;
    this.ParaMath = ParaMath;
};
CNaryOperator.prototype.Measure = function(oMeasure, RPI)
{
    this.recalculateSize(); //обычный пересчет, oMeasure не нужен
};
CNaryOperator.prototype.Get_TxtPrControlLetter = function()
{
    return this.Parent.Get_TxtPrControlLetter();
};

/**
 *
 * @constructor
 * @extends {CNaryOperator}
 */
function CSigma()
{
    CNaryOperator.call(this);
}
CSigma.prototype = Object.create(CNaryOperator.prototype);
CSigma.prototype.constructor = CSigma;
CSigma.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._l(XX[1], YY[1]);
    pGraphics._l(XX[2], YY[2]);
    pGraphics._l(XX[3], YY[3]);
    pGraphics._l(XX[4], YY[4]);
    pGraphics._c(XX[4], YY[4], XX[5], YY[5], XX[6], YY[6] );
    pGraphics._c(XX[6], YY[6], XX[7], YY[7], XX[8], YY[8] );
    pGraphics._c(XX[8], YY[8], XX[9], YY[9], XX[10], YY[10] );
    pGraphics._c(XX[10], YY[10], XX[11], YY[11], XX[12], YY[12] );
    pGraphics._c(XX[12], YY[12], XX[13], YY[13], XX[14], YY[14] );
    pGraphics._l(XX[15], YY[15]);
    pGraphics._l(XX[16], YY[16]);
    pGraphics._l(XX[17], YY[17]);
    pGraphics._l(XX[18], YY[18]);
    pGraphics._l(XX[19], YY[19]);
    pGraphics._l(XX[20], YY[20]);
    pGraphics._l(XX[21], YY[21]);
    pGraphics._l(XX[22], YY[22]);
    pGraphics._l(XX[23], YY[23]);
    pGraphics._l(XX[24], YY[24]);
    pGraphics._c(XX[24], YY[24], XX[25], YY[25], XX[26], YY[26] );
    pGraphics._c(XX[26], YY[26], XX[27], YY[27], XX[28], YY[28] );
    pGraphics._c(XX[28], YY[28], XX[29], YY[29], XX[30], YY[30] );
    pGraphics._c(XX[30], YY[30], XX[31], YY[31], XX[32], YY[32] );
    pGraphics._c(XX[32], YY[32], XX[33], YY[33], XX[34], YY[34] );
    pGraphics._l(XX[35], YY[35]);

};
CSigma.prototype.getCoord = function()
{
    var X = [],
        Y = [];

    /*X[0] = 13560; Y[0] = 4332;
     X[1] = 33847; Y[1] = 35130;
     X[2] = 33847; Y[2] = 38297;
     X[3] = 11103; Y[3] = 69548;
     X[4] = 38512; Y[4] = 69548;
     X[5] = 41095; Y[5] = 69548;
     X[6] = 42407; Y[6] = 69215;
     X[7] = 43719; Y[7] = 68882;
     X[8] = 44656; Y[8] = 68194;
     X[9] = 45594; Y[9] = 67507;
     X[10] = 46364; Y[10] = 66278;
     X[11] = 47135; Y[11] = 65049;
     X[12] = 47843; Y[12] = 62883;
     X[13] = 48552; Y[13] = 60717;
     X[14] = 49176; Y[14] = 57218;
     X[15] = 54028; Y[15] = 57218;
     X[16] = 52820; Y[16] = 77546;
     X[17] = 0; Y[17] = 77546;
     X[18] = 0; Y[18] = 75213;
     X[19] = 25766; Y[19] = 39839;
     X[20] = 1605; Y[20] = 2374;
     X[21] = 1605; Y[21] = 0;
     X[22] = 53050; Y[22] = 0;
     X[23] = 53050; Y[23] = 18543;
     X[24] = 48551; Y[24] = 18543;
     X[25] = 47509; Y[25] = 14584;
     X[26] = 46572; Y[26] = 12084;
     X[27] = 45635; Y[27] = 9583;
     X[28] = 44656; Y[28] = 8125;
     X[29] = 43677; Y[29] = 6666;
     X[30] = 42656; Y[30] = 5895;
     X[31] = 41636; Y[31] = 5124;
     X[32] = 40303; Y[32] = 4728;
     X[33] = 38970; Y[33] = 4332;
     X[34] = 36762; Y[34] = 4332;
     X[35] = 13560; Y[35] = 4332;*/

    X[0] = 16252; Y[0] = 5200;
    X[1] = 40602; Y[1] = 42154;
    X[2] = 40602; Y[2] = 45954;
    X[3] = 13302; Y[3] = 83456;
    X[4] = 46202; Y[4] = 83456;
    X[5] = 49302; Y[5] = 83456;
    X[6] = 50877; Y[6] = 83056;
    X[7] = 52452; Y[7] = 82656;
    X[8] = 53577; Y[8] = 81831;
    X[9] = 54702; Y[9] = 81006;
    X[10] = 55627; Y[10] = 79531;
    X[11] = 56552; Y[11] = 78056;
    X[12] = 57402; Y[12] = 75456;
    X[13] = 58252; Y[13] = 72856;
    X[14] = 59002; Y[14] = 68656;
    X[15] = 64850; Y[15] = 68656;
    X[16] = 63400; Y[16] = 93056;
    X[17] = 0; Y[17] = 93056;
    X[18] = 0; Y[18] = 90256;
    X[19] = 30902; Y[19] = 47804;
    X[20] = 1902; Y[20] = 2850;
    X[21] = 1902; Y[21] = 0;
    X[22] = 63652; Y[22] = 0;
    X[23] = 63652; Y[23] = 22252;
    X[24] = 58252; Y[24] = 22252;
    X[25] = 57002; Y[25] = 17501;
    X[26] = 55877; Y[26] = 14501;
    X[27] = 54752; Y[27] = 11501;
    X[28] = 53577; Y[28] = 9751;
    X[29] = 52402; Y[29] = 8000;
    X[30] = 51177; Y[30] = 7075;
    X[31] = 49952; Y[31] = 6150;
    X[32] = 48352; Y[32] = 5675;
    X[33] = 46752; Y[33] = 5200;
    X[34] = 44102; Y[34] = 5200;
    X[35] = 16252; Y[35] = 5200;


    //var textScale =  this.getTxtPrp().FontSize/850; // 1000 pt
    var textScale =  this.Get_TxtPrControlLetter().FontSize/850; // 1000 pt
    var alpha = textScale*25.4/96 /64;

    var h1 = Y[0] - Y[21],
        h2 = Y[17] - Y[3],
        h3 = Y[2] - Y[1],
        h4 = Y[20] - Y[21],
        h5 = Y[17] - Y[18];

    var H1 = this.sizeGlyph.height/alpha - h1 - h2 - h3;
    //H2 = this.size.height/alpha - h4 - h5;

    var h_middle1 = Y[3] - Y[0] - h3,
        coeff1 = (Y[1] - Y[0])/h_middle1,
        coeff2 = (Y[3] - Y[2])/h_middle1;


    var y3 = Y[3],
        y2 = Y[2];

    Y[1] = Y[0] + H1*coeff1;
    Y[2] = Y[1] + h3;
    Y[3] = Y[2] + H1*coeff2;

    Y[19] = Y[2] + Y[19] - y2;
    Y[18] = Y[3] + Y[18] - y3;

    for(var i = 4; i < 18; i++)
    {
        Y[i] = Y[3] + (Y[i] - y3);
    }

    // Width  -  X[15]

    var W = (this.sizeGlyph.width - this.gap)/alpha;

    var c1 = (X[21] - X[17])/X[15],
        c2 = (X[22] - X[21])/X[15];

    var x22 = X[22];

    X[21] = X[20] = X[17] + c1*W;
    X[22] = X[23] = X[21] + c2*W;

    for(var i = 24; i < 35; i++)
        X[i] = X[22] + X[i] - x22;

    var c3 = (X[4] - X[3])/X[15],
        c4 = (X[15] - X[16])/X[15],
        c5 = (X[15] - X[2])/X[15];

    var x15 = X[15],
        x2 = X[2];

    X[4] = X[3] + c3*W;
    X[15] = W;
    X[16] = X[15] - c4*W;

    X[2] = X[1] = X[15] - c5*W;

    X[19] = X[2] - (x2 - X[19]);

    for(var i = 5; i < 15 ; i++)
        X[i] = X[15] - (x15 - X[i]);

    return {X: X, Y: Y};
};
CSigma.prototype.calculateSizeGlyph = function()
{
    // пока размер не меняем в зависимости от высоты аргумента

    //var betta = this.getTxtPrp().FontSize/36;
    var betta = this.Get_TxtPrControlLetter().FontSize/36;

    var _width = 8.997900390624999*betta,
        _height = 11.994444444444444*betta;

    this.gap = 0.93*betta;

    var width = 1.76*_width + this.gap,
        height = 2*_height;

    return {width : width, height : height};
};

/**
 *
 * @param bFlip
 * @constructor
 * @extends {CNaryOperator}
 */
function CProduct(bFlip)
{
    CNaryOperator.call(this, bFlip);
}
CProduct.prototype = Object.create(CNaryOperator.prototype);
CProduct.prototype.constructor = CProduct;
CProduct.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._l(XX[1], YY[1]);
    pGraphics._c(XX[1], YY[1], XX[2], YY[2], XX[3], YY[3] );
    pGraphics._c(XX[3], YY[3], XX[4], YY[4], XX[5], YY[5] );
    pGraphics._c(XX[5], YY[5], XX[6], YY[6], XX[7], YY[7] );
    pGraphics._c(XX[7], YY[7], XX[8], YY[8], XX[9], YY[9] );
    pGraphics._l(XX[10], YY[10]);
    pGraphics._c(XX[10], YY[10], XX[11], YY[11], XX[12], YY[12] );
    pGraphics._c(XX[12], YY[12], XX[13], YY[13], XX[14], YY[14] );
    pGraphics._c(XX[14], YY[14], XX[15], YY[15], XX[16], YY[16] );
    pGraphics._c(XX[16], YY[16], XX[17], YY[17], XX[18], YY[18] );
    pGraphics._l(XX[19], YY[19]);
    pGraphics._l(XX[20], YY[20]);
    pGraphics._l(XX[21], YY[21]);
    pGraphics._c(XX[21], YY[21], XX[22], YY[22], XX[23], YY[23] );
    pGraphics._c(XX[23], YY[23], XX[24], YY[24], XX[25], YY[25] );
    pGraphics._c(XX[25], YY[25], XX[26], YY[26], XX[27], YY[27] );
    pGraphics._c(XX[27], YY[27], XX[28], YY[28], XX[29], YY[29] );
    pGraphics._l(XX[30], YY[30]);
    pGraphics._l(XX[31], YY[31]);
    pGraphics._l(XX[32], YY[32]);
    pGraphics._c(XX[32], YY[32], XX[33], YY[33], XX[34], YY[34] );
    pGraphics._c(XX[34], YY[34], XX[35], YY[35], XX[36], YY[36] );
    pGraphics._c(XX[36], YY[36], XX[37], YY[37], XX[38], YY[38] );
    pGraphics._c(XX[38], YY[38], XX[39], YY[39], XX[40], YY[40] );
    pGraphics._l(XX[41], YY[41]);
    pGraphics._l(XX[42], YY[42]);
    pGraphics._l(XX[43], YY[43]);
    pGraphics._c(XX[43], YY[43], XX[44], YY[44], XX[45], YY[45] );
    pGraphics._c(XX[45], YY[45], XX[46], YY[46], XX[47], YY[47] );
    pGraphics._c(XX[47], YY[47], XX[48], YY[48], XX[49], YY[49] );
    pGraphics._c(XX[49], YY[49], XX[50], YY[50], XX[51], YY[51] );
    pGraphics._l(XX[52], YY[52]);
    pGraphics._c(XX[52], YY[52], XX[53], YY[53], XX[54], YY[54] );
    pGraphics._c(XX[54], YY[54], XX[55], YY[55], XX[56], YY[56] );
    pGraphics._c(XX[56], YY[56], XX[57], YY[57], XX[58], YY[58] );
    pGraphics._c(XX[58], YY[58], XX[59], YY[59], XX[60], YY[60] );
    pGraphics._l(XX[61], YY[61]);
    pGraphics._l(XX[62], YY[62]);

};
CProduct.prototype.getCoord = function()
{
    var X = [],
        Y = [];

    X[0] = 67894; Y[0] = 0;
    X[1] = 67894; Y[1] = 2245;
    X[2] = 65100; Y[2] = 3024;
    X[3] = 63955; Y[3] = 3666;
    X[4] = 62810; Y[4] = 4307;
    X[5] = 62100; Y[5] = 5338;
    X[6] = 61390; Y[6] = 6368;
    X[7] = 61092; Y[7] = 8338;
    X[8] = 60794; Y[8] = 10308;
    X[9] = 60794; Y[9] = 14706;
    X[10] = 60794; Y[10] = 70551;
    X[11] = 60794; Y[11] = 74674;
    X[12] = 61069; Y[12] = 76666;
    X[13] = 61345; Y[13] = 78659;
    X[14] = 61987; Y[14] = 79736;
    X[15] = 62629; Y[15] = 80813;
    X[16] = 63798; Y[16] = 81523;
    X[17] = 64968; Y[17] = 82233;
    X[18] = 67904; Y[18] = 83012;
    X[19] = 67904; Y[19] = 85257;
    X[20] = 43623; Y[20] = 85257;
    X[21] = 43623; Y[21] = 83012;
    X[22] = 46368; Y[22] = 82279;
    X[23] = 47512; Y[23] = 81614;
    X[24] = 48657; Y[24] = 80950;
    X[25] = 49343; Y[25] = 79896;
    X[26] = 50029; Y[26] = 78843;
    X[27] = 50326; Y[27] = 76850;
    X[28] = 50624; Y[28] = 74857;
    X[29] = 50624; Y[29] = 70551;
    X[30] = 50624; Y[30] = 4856;
    X[31] = 17165; Y[31] = 4856;
    X[32] = 17165; Y[32] = 70551;
    X[33] = 17165; Y[33] = 74994;
    X[34] = 17463; Y[34] = 76918;
    X[35] = 17761; Y[35] = 78843;
    X[36] = 18450; Y[36] = 79873;
    X[37] = 19139; Y[37] = 80904;
    X[38] = 20332; Y[38] = 81591;
    X[39] = 21526; Y[39] = 82279;
    X[40] = 24326; Y[40] = 83012;
    X[41] = 24326; Y[41] = 85257;
    X[42] = 0; Y[42] = 85257;
    X[43] = 0; Y[43] = 83012;
    X[44] = 2743; Y[44] = 82279;
    X[45] = 3931; Y[45] = 81614;
    X[46] = 5120; Y[46] = 80950;
    X[47] = 5783; Y[47] = 79873;
    X[48] = 6446; Y[48] = 78797;
    X[49] = 6743; Y[49] = 76827;
    X[50] = 7040; Y[50] = 74857;
    X[51] = 7040; Y[51] = 70551;
    X[52] = 7040; Y[52] = 14706;
    X[53] = 7040; Y[53] = 10400;
    X[54] = 6743; Y[54] = 8430;
    X[55] = 6446; Y[55] = 6460;
    X[56] = 5806; Y[56] = 5429;
    X[57] = 5166; Y[57] = 4398;
    X[58] = 4000; Y[58] = 3711;
    X[59] = 2834; Y[59] = 3024;
    X[60] = 0; Y[60] = 2245;
    X[61] = 0; Y[61] = 0;
    X[62] = 67894; Y[62] = 0;


    //var textScale = this.getTxtPrp().FontSize/850, // 1000 pt
    var textScale = this.Get_TxtPrControlLetter().FontSize/850, // 1000 pt
        alpha = textScale*25.4/96 /64;

    var h1 = Y[9],
        h2 = Y[19] - Y[10],
        w1 = X[31];

    var Height = this.sizeGlyph.height/alpha - h1 - h2,
        Width = (this.sizeGlyph.width - this.gap)/alpha - 2*w1;

    var hh = Height - (Y[10] - Y[9]),
        ww = Width - (X[30] - X[31]);

    for(var i = 0; i < 20; i++)
    {
        Y[10 + i] += hh;
        Y[32 + i] += hh;
    }

    for(var i = 0; i < 31; i++)
        X[i] += ww;

    X[62] += ww;


    return {X: X, Y: Y};

};
CProduct.prototype.calculateSizeGlyph = function()
{
    //var betta = this.getTxtPrp().FontSize/36;
    var betta = this.Get_TxtPrControlLetter().FontSize/36;

    var _width = 10.312548828125*betta,
        _height = 11.994444444444444*betta;

    this.gap = 0.93*betta;

    var width = 1.76*_width + this.gap,
        height = 2*_height;

    //this.size = {width : width, height : height, center: height/2 };

    return {width : width, height : height};
};

/**
 *
 * @param bFlip
 * @constructor
 * @extends {CNaryOperator}
 */
function CUnion(bFlip)
{
    CNaryOperator.call(this, bFlip);
}
CUnion.prototype = Object.create(CNaryOperator.prototype);
CUnion.prototype.constructor = CUnion;
CUnion.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._c(XX[0], YY[0], XX[1], YY[1], XX[2], YY[2]);
    pGraphics._c(XX[2], YY[2], XX[3], YY[3], XX[4], YY[4]);
    pGraphics._l(XX[5], YY[5]);
    pGraphics._l(XX[6], YY[6]);
    pGraphics._l(XX[7], YY[7]);
    pGraphics._c(XX[7], YY[7], XX[8], YY[8], XX[9], YY[9]);
    pGraphics._c(XX[9], YY[9], XX[10], YY[10], XX[11], YY[11]);
    pGraphics._c(XX[11], YY[11], XX[12], YY[12], XX[13], YY[13]);
    pGraphics._c(XX[13], YY[13], XX[14], YY[14], XX[15], YY[15]);
    pGraphics._l(XX[16], YY[16]);
    pGraphics._l(XX[17], YY[17]);
    pGraphics._l(XX[18], YY[18]);
    pGraphics._c(XX[18], YY[18], XX[19], YY[19], XX[20], YY[20]);
    pGraphics._c(XX[20], YY[20], XX[21], YY[21], XX[22], YY[22]);
};
CUnion.prototype.getCoord = function()
{
    var X = [],
        Y = [];

    X[0] = 49526.184566929136; Y[0] = 127087.84;
    X[1] = 33974.37429971653; Y[1] = 127877.20000000001;
    X[2] = 25226.481024409448; Y[2] = 120034.20000000001;
    X[3] = 15996.016171708661; Y[3] = 113190.09;
    X[4] = 15301.25; Y[4] = 95025.84;
    X[5] = 15301.25; Y[5] = 0;
    X[6] = 7100; Y[6] = 0;
    X[7] = 7100; Y[7] = 94775.84;
    X[8] = 7100; Y[8] = 117815.09;
    X[9] = 21524.90275275591; Y[9] = 127165.84;
    X[10] = 31605.36420585827; Y[10] = 135801.88;
    X[11] = 49526.184566929136; Y[11] = 135775.84;
    X[12] = 67447.00492800001; Y[12] = 135801.88;
    X[13] = 77527.46638110236; Y[13] = 127165.84;
    X[14] = 91952.36913385827; Y[14] = 117815.09;
    X[15] = 91952.36913385827; Y[15] = 94775.84;
    X[16] = 91952.36913385827; Y[16] = 0;
    X[17] = 83751.11913385827; Y[17] = 0;
    X[18] = 83751.11913385827; Y[18] = 95025.84;
    X[19] = 83056.35296214961; Y[19] = 113190.09;
    X[20] = 73825.88810944883; Y[20] = 120034.20000000001;
    X[21] = 65077.99483414174; Y[21] = 127877.20000000001;
    X[22] = 49526.184566929136; Y[22] = 127087.84;

    return {X: X, Y: Y};
};
CUnion.prototype.calculateSizeGlyph = function()
{
    //var betta = this.getTxtPrp().FontSize/36;
    var betta = this.Get_TxtPrControlLetter().FontSize/36;
    this.gap = 0.93*betta;

    var _width = 9.38*betta,
        _height = 11.994444444444444*betta;

    var width = 1.76*_width + this.gap,
        height = 2*_height;

    return {width : width, height : height};
};

/**
 *
 * @param bFlip
 * @constructor
 * @extends {CNaryOperator}
 */
function CLogicalOr(bFlip)
{
    CNaryOperator.call(this, bFlip);
}
CLogicalOr.prototype = Object.create(CNaryOperator.prototype);
CLogicalOr.prototype.constructor = CLogicalOr;
CLogicalOr.prototype.drawPath = function(pGraphics, XX, YY)
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
CLogicalOr.prototype.getCoord = function()
{
    var X = [],
        Y = [];

    X[0] = 0; Y[0] = 0;
    X[1] = 34812; Y[1] = 89801;
    X[2] = 43792; Y[2] = 89801;
    X[3] = 73240; Y[3] = 0;
    X[4] = 63269; Y[4] = 0;
    X[5] = 38719; Y[5] = 77322;
    X[6] = 10613; Y[6] = 0;
    X[7] = 0; Y[7] = 0;

    //var textScale = this.getTxtPrp().FontSize/850, // 1000 pt
    var textScale = this.Get_TxtPrControlLetter().FontSize/850, // 1000 pt
        alpha = textScale*25.4/96 /64;

    var w1 = X[1],
        w2 = X[2] - X[1],
        w4 = X[5] - X[1],
        w5 = X[3] - X[4];

    var Height = this.sizeGlyph.height/alpha,
        Width = (this.sizeGlyph.width - this.gap)/alpha - w2;

    var _W = X[3] - w2,
        k1 = w1/_W;

    X[1] = k1*Width;
    X[2] = X[1] + w2;
    X[5] = X[1] + w4;

    X[3] = Width + w2;
    X[4] = Width + w2 - w5;

    var hh = Height - Y[2];

    Y[1] += hh;
    Y[2] += hh;
    Y[5] += hh;

    return {X: X, Y: Y};
};
CLogicalOr.prototype.calculateSizeGlyph = function()
{
    //var betta = this.getTxtPrp().FontSize/36;
    var betta = this.Get_TxtPrControlLetter().FontSize/36;

    var _width = 9.6159*betta,
        _height = 11.994444444444444*betta;

    this.gap = 0.55*betta;

    var width = 1.76*_width + this.gap,
        height = 2*_height;

    return {width : width, height : height};
};

/**
 *
 * @constructor
 * @extends {CNaryOperator}
 */
function CIntegral()
{
    CNaryOperator.call(this);
}
CIntegral.prototype = Object.create(CNaryOperator.prototype);
CIntegral.prototype.constructor = CIntegral;
CIntegral.prototype.getCoord = function()
{
    var X = [],
        Y = [];

    //top
    X[0] = 20407; Y[0] = 65723;
    X[1] = 20407; Y[1] = 60840;
    X[2] = 20407; Y[2] = 37013;
    X[3] = 24333; Y[3] = 18507;
    X[4] = 28260; Y[4] = 0;
    X[5] = 40590; Y[5] = 0;
    X[6] = 42142; Y[6] = 0;
    X[7] = 43604; Y[7] = 383;
    X[8] = 45067; Y[8] = 765;
    X[9] = 46215; Y[9] = 1305;
    X[10] = 45180; Y[10] = 9225;
    X[11] = 41760; Y[11] = 9225;
    X[12] = 41512; Y[12] = 7335;
    X[13] = 40724; Y[13] = 6064;
    X[14] = 39937; Y[14] = 4793;
    X[15] = 37935; Y[15] = 4793;
    X[16] = 30465; Y[16] = 4793;
    X[17] = 28406; Y[17] = 23086;
    X[18] = 26347; Y[18] = 41378;
    X[19] = 26347; Y[19] = 60840;
    X[20] = 26347; Y[20] = 65723;

    //botton
    X[22] = 26347; Y[22] = 0;
    X[23] = 26347; Y[23] = 4883;
    X[24] = 26325; Y[24] = 33368;
    X[25] = 21622; Y[25] = 49681;
    X[26] = 16920; Y[26] = 65993;
    X[27] = 5467; Y[27] = 65993;
    X[28] = 4387; Y[28] = 65993;
    X[29] = 2947; Y[29] = 65633;
    X[30] = 1507; Y[30] = 65273;
    X[31] = 0; Y[31] = 64553;
    X[32] = 1147; Y[32] = 55665;
    X[33] = 4770; Y[33] = 55665;
    X[34] = 4927; Y[34] = 58050;
    X[35] = 5782; Y[35] = 59412;
    X[36] = 6637; Y[36] = 60773;
    X[37] = 8775; Y[37] = 60773;
    X[38] = 13365; Y[38] = 60773;
    X[39] = 16886; Y[39] = 50783;
    X[40] = 20407; Y[40] = 40793;
    X[41] = 20407; Y[41] = 4883;
    X[42] = 20407; Y[42] = 0;


    var shX = X[9]*0.025;
    for(var i = 0; i < 21; i++)
    {
        X[i] +=shX;
    }

    var shY = Y[26]*0.3377;
    for(var i = 0; i < 21; i++)
    {
        Y[22+i] += shY + Y[20];
    }


    X[21] = (X[20] + X[22])/2; Y[21] = (Y[20] + Y[22])/2;
    X[44] = X[0]; Y[44] = Y[0];
    X[43] = (X[42] + X[44])/2; Y[43] = (Y[44] + Y[42])/2;

    var W = X[9],
        H = Y[27];

    return {X: X, Y: Y, W : W, H: H};
};
CIntegral.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._l(XX[1], YY[1]);
    pGraphics._c(XX[1], YY[1], XX[2], YY[2], XX[3], YY[3] );
    pGraphics._c(XX[3], YY[3], XX[4], YY[4], XX[5], YY[5] );
    pGraphics._c(XX[5], YY[5], XX[6], YY[6], XX[7], YY[7] );
    pGraphics._c(XX[7], YY[7], XX[8], YY[8], XX[9], YY[9] );
    pGraphics._l(XX[10], YY[10]);
    pGraphics._l(XX[11], YY[11]);
    pGraphics._c(XX[11], YY[11], XX[12], YY[12], XX[13], YY[13] );
    pGraphics._c(XX[13], YY[13], XX[14], YY[14], XX[15], YY[15] );
    pGraphics._c(XX[15], YY[15], XX[16], YY[16], XX[17], YY[17] );
    pGraphics._c(XX[17], YY[17], XX[18], YY[18], XX[19], YY[19] );
    pGraphics._l(XX[20], YY[20]);

    pGraphics._c(XX[20], YY[20], XX[21], YY[21], XX[22], YY[22] );

    pGraphics._l(XX[22], YY[22]);
    pGraphics._l(XX[23], YY[23]);
    pGraphics._c(XX[23], YY[23], XX[24], YY[24], XX[25], YY[25] );
    pGraphics._c(XX[25], YY[25], XX[26], YY[26], XX[27], YY[27] );
    pGraphics._c(XX[27], YY[27], XX[28], YY[28], XX[29], YY[29] );
    pGraphics._c(XX[29], YY[29], XX[30], YY[30], XX[31], YY[31] );
    pGraphics._l(XX[32], YY[32]);
    pGraphics._l(XX[33], YY[33]);
    pGraphics._c(XX[33], YY[33], XX[34], YY[34], XX[35], YY[35] );
    pGraphics._c(XX[35], YY[35], XX[36], YY[36], XX[37], YY[37] );
    pGraphics._c(XX[37], YY[37], XX[38], YY[38], XX[39], YY[39] );
    pGraphics._c(XX[39], YY[39], XX[40], YY[40], XX[41], YY[41] );
    pGraphics._l(XX[42], YY[42]);

    pGraphics._c(XX[42], YY[42], XX[43], YY[43], XX[44], YY[44] );

};
CIntegral.prototype.calculateSizeGlyph = function()
{
    //var betta = this.getTxtPrp().FontSize/36;
    var betta = this.Get_TxtPrControlLetter().FontSize/36;

    var _width =  8.624*betta,
        _height = 13.7*betta;

    this.gap = 0.93*betta;

    var width = _width + this.gap,
        height = 2*_height;

    return {width : width, height : height};
};

/**
 *
 * @constructor
 * @extends {CIntegral}
 */
function CDoubleIntegral()
{
    CIntegral.call(this);
}
CDoubleIntegral.prototype = Object.create(CIntegral.prototype);
CDoubleIntegral.prototype.constructor = CDoubleIntegral;
CDoubleIntegral.prototype.drawPath = function(pGraphics, XX, YY, Width)
{
    var XX2 = [],
        YY2 = [];

    // Width прийдрийдет для TextArt, смещение второго интеграла и для обводки, и для заливки должно быть одинаковым, чтобы корректно отрисовалась обводка
    var w = Width == undefined ? (XX[9] - XX[29])*0.6 : Width*0.36;

    for(var i = 0; i < XX.length; i++)
    {
        XX2[i] = XX[i] + w;
        YY2[i] = YY[i];
    }

	CIntegral.prototype.drawPath.call(this, pGraphics, XX, YY);
    pGraphics.df();

    pGraphics._s();
	CIntegral.prototype.drawPath.call(this, pGraphics, XX2, YY2);
};
CDoubleIntegral.prototype.calculateSizeGlyph = function()
{
    //var betta = this.getTxtPrp().FontSize/36;
    var betta = this.Get_TxtPrControlLetter().FontSize/36;

    var _width = 14.2296*betta,
        _height = 13.7*betta;

    this.gap = 0.93*betta;

    var width = _width + this.gap,
        height = 2*_height;

    return {width : width, height : height};
};

/**
 *
 * @constructor
 * @extends {CIntegral}
 */
function CTripleIntegral()
{
    CIntegral.call(this);
}
CTripleIntegral.prototype = Object.create(CIntegral.prototype);
CTripleIntegral.prototype.constructor = CTripleIntegral;
CTripleIntegral.prototype.drawPath = function(pGraphics, XX, YY, Width)
{
    var XX2 = [],
        YY2 = [];

    // Width прийдрийдет для TextArt, смещения второго и третьего интегралов и для обводки, и для заливки должны быть одинаковыми, чтобы корректно отрисовалась обводка
    var w = Width == undefined ? (XX[9] - XX[29])*0.6 : Width*0.26;

    var XX3 = [],
        YY3 = [];

    for(var i = 0; i < XX.length; i++)
    {
        XX2[i] = XX[i] + w;
        YY2[i] = YY[i];

        XX3[i] = XX[i] + 2*w;
        YY3[i] = YY[i];
    }

	CIntegral.prototype.drawPath.call(this, pGraphics, XX, YY);
    pGraphics.df();

    pGraphics._s();
	CIntegral.prototype.drawPath.call(this, pGraphics, XX2, YY2);
    pGraphics.df();

    pGraphics._s();
	CIntegral.prototype.drawPath.call(this, pGraphics, XX3, YY3);
};
CTripleIntegral.prototype.calculateSizeGlyph = function()
{
    //var betta = this.getTxtPrp().FontSize/36;
    var betta = this.Get_TxtPrControlLetter().FontSize/36;

    var _width = 18.925368*betta,
        _height = 13.7*betta;

    this.gap = 0.93*betta;

    var width = _width + this.gap,
        height = 2*_height;

    return {width : width, height : height};
};


function CCircle()
{

}
CCircle.prototype.getCoord = function()
{
    var X = [],
        Y = [];

    X[0] = 18345.98; Y[0] = 0;
    X[1] = 25288.35; Y[1] = 1008.1;
    X[2] = 27622.45; Y[2] = 2601.85;
    X[3] = 29991.4; Y[3] = 4194.75;
    X[4] = 31723.7; Y[4] = 6460.85;
    X[5] = 33456.85; Y[5] = 8726.95;
    X[6] = 34411.4; Y[6] = 11542.15;
    X[7] = 35366.8; Y[7] = 14357.35;
    X[8] = 35366.8; Y[8] = 17472.6;
    X[9] = 35366.8; Y[9] = 21155.65;
    X[10] = 34180.2; Y[10] = 24201.2;
    X[11] = 32994.45; Y[11] = 27245.9;
    X[12] = 30905.15; Y[12] = 29495;
    X[13] = 28816.7; Y[13] = 31743.25;
    X[14] = 25949.65; Y[14] = 33159.35;
    X[15] = 23294.25; Y[15] = 34469.2;
    X[16] = 17035.7; Y[16] = 34770.53;
    X[17] = 17035.7; Y[17] = 34770.53;
    X[18] = 10029.15; Y[18] = 33832.55;
    X[19] = 7655.1; Y[19] = 32203.1;
    X[20] = 5209.65; Y[20] = 30539.65;
    X[21] = 3525.8; Y[21] = 28309.25;
    X[22] = 1842.8; Y[22] = 26078;
    X[23] = 921.4; Y[23] = 23334.2;
    X[24] = 0; Y[24] = 20589.55;
    X[25] = 0; Y[25] = 17509.15;
    X[26] = 0; Y[26] = 14003.75;
    X[27] = 1133.05; Y[27] = 10959.05;
    X[28] = 2266.1; Y[28] = 7913.5;
    X[29] = 4318.85; Y[29] = 5576.85;
    X[30] = 6372.45; Y[30] = 3240.2;
    X[31] = 9275.2; Y[31] = 1752.7;
    X[32] = 11930.6; Y[32] = 407.15;
    X[33] = 18345.98; Y[33] = 0;

    var W = X[7],
        H = Y[16];

    return {X: X, Y: Y, W: W, H: H};

};
CCircle.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._c(XX[0], YY[0], XX[1], YY[1], XX[2], YY[2]);
    pGraphics._c(XX[2], YY[2], XX[3], YY[3], XX[4], YY[4]);
    pGraphics._c(XX[4], YY[4], XX[5], YY[5], XX[6], YY[6]);
    pGraphics._c(XX[6], YY[6], XX[7], YY[7], XX[8], YY[8]);
    pGraphics._c(XX[8], YY[8], XX[9], YY[9], XX[10], YY[10]);
    pGraphics._c(XX[10], YY[10], XX[11], YY[11], XX[12], YY[12]);
    pGraphics._c(XX[12], YY[12], XX[13], YY[13], XX[14], YY[14]);
    pGraphics._c(XX[14], YY[14], XX[15], YY[15], XX[16], YY[16]);

    pGraphics._c(XX[17], YY[17], XX[18], YY[18], XX[19], YY[19]);
    pGraphics._c(XX[19], YY[19], XX[20], YY[20], XX[21], YY[21]);
    pGraphics._c(XX[21], YY[21], XX[22], YY[22], XX[23], YY[23]);
    pGraphics._c(XX[23], YY[23], XX[24], YY[24], XX[25], YY[25]);
    pGraphics._c(XX[25], YY[25], XX[26], YY[26], XX[27], YY[27]);
    pGraphics._c(XX[27], YY[27], XX[28], YY[28], XX[29], YY[29]);
    pGraphics._c(XX[29], YY[29], XX[30], YY[30], XX[31], YY[31]);
    pGraphics._c(XX[31], YY[31], XX[32], YY[32], XX[33], YY[33]);
};


function CSurface()
{

}
CSurface.prototype.getCoord = function()
{
    var X = [],
        Y = [];

    X[0] = 24855.55; Y[0] = 312.82;
    X[1] = 27995.71; Y[1] = 0;
    X[2] = 31359.09; Y[2] = 0;
    X[3] = 36162.79; Y[3] = 0;
    X[4] = 40559.9; Y[4] = 694.89;
    X[5] = 43954.72; Y[5] = 1285.5;
    X[6] = 47349.55; Y[6] = 1876.11;
    X[7] = 50600.44; Y[7] = 2814.59;
    X[8] = 54054.17; Y[8] = 4639.82;
    X[9] = 57507.91; Y[9] = 6464.21;
    X[10] = 59945.63; Y[10] = 10061.28;
    X[11] = 62383.35; Y[11] = 13658.35;
    X[12] = 62383.35; Y[12] = 18871.27;
    X[13] = 62383.35; Y[13] = 24154.26;
    X[14] = 59945.63; Y[14] = 27752.16;
    X[15] = 57507.91; Y[15] = 31349.23;
    X[16] = 53481.95; Y[16] = 33468.93;
    X[17] = 49936.09; Y[17] = 35345.88;
    X[18] = 45688.68; Y[18] = 36318.56;
    X[19] = 42330.61; Y[19] = 36884.98;
    X[20] = 38972.54; Y[20] = 37451.41;
    X[21] = 34242.37; Y[21] = 37799.27;
    X[22] = 31359.98; Y[22] = 37799.27;
    X[23] = 27369.45; Y[23] = 37799.27;
    X[24] = 22565.76; Y[24] = 37347.13;
    X[25] = 19337.9; Y[25] = 36774.04;
    X[26] = 16110.04; Y[26] = 36200.94;
    X[27] = 11723.56; Y[27] = 35018.88;
    X[28] = 9068.82; Y[28] = 33663.3;
    X[29] = 6377.76; Y[29] = 32273.53;
    X[30] = 4312.96; Y[30] = 30188.03;
    X[31] = 2249.05; Y[31] = 28101.69;
    X[32] = 1124.08; Y[32] = 25286.27;
    X[33] = 0; Y[33] = 22470.84;
    X[34] = 0; Y[34] = 18959.69;
    X[35] = 0; Y[35] = 13745.94;
    X[36] = 2490.87; Y[36] = 10130.52;
    X[37] = 4982.63; Y[37] = 6515.1;
    X[38] = 8967.84; Y[38] = 4394.56;
    X[39] = 12806.01; Y[39] = 2378.3;
    X[40] = 17529.98; Y[40] = 1370.59;
    X[41] = 21192.77; Y[41] = 841.7;
    X[42] = 24855.55; Y[42] = 312.82;

    var W = X[11],
        H = Y[21];



    return {X: X, Y: Y, W: W, H: H};
};
CSurface.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._l(XX[0], YY[0]);
    pGraphics._c(XX[0], YY[0], XX[1], YY[1], XX[2], YY[2] );
    pGraphics._c(XX[2], YY[2], XX[3], YY[3], XX[4], YY[4] );
    pGraphics._c(XX[4], YY[4], XX[5], YY[5], XX[6], YY[6] );
    pGraphics._c(XX[6], YY[6], XX[7], YY[7], XX[8], YY[8] );
    pGraphics._c(XX[8], YY[8], XX[9], YY[9], XX[10], YY[10] );
    pGraphics._c(XX[10], YY[10], XX[11], YY[11], XX[12], YY[12] );
    pGraphics._c(XX[12], YY[12], XX[13], YY[13], XX[14], YY[14] );
    pGraphics._c(XX[14], YY[14], XX[15], YY[15], XX[16], YY[16] );
    pGraphics._c(XX[16], YY[16], XX[17], YY[17], XX[18], YY[18] );
    pGraphics._c(XX[18], YY[18], XX[19], YY[19], XX[20], YY[20] );
    pGraphics._c(XX[20], YY[20], XX[21], YY[21], XX[22], YY[22] );
    pGraphics._c(XX[22], YY[22], XX[23], YY[23], XX[24], YY[24] );
    pGraphics._c(XX[24], YY[24], XX[25], YY[25], XX[26], YY[26] );
    pGraphics._c(XX[26], YY[26], XX[27], YY[27], XX[28], YY[28] );
    pGraphics._c(XX[28], YY[28], XX[29], YY[29], XX[30], YY[30] );
    pGraphics._c(XX[30], YY[30], XX[31], YY[31], XX[32], YY[32] );
    pGraphics._c(XX[32], YY[32], XX[33], YY[33], XX[34], YY[34] );
    pGraphics._c(XX[34], YY[34], XX[35], YY[35], XX[36], YY[36] );
    pGraphics._c(XX[36], YY[36], XX[37], YY[37], XX[38], YY[38] );
    pGraphics._c(XX[38], YY[38], XX[39], YY[39], XX[40], YY[40] );
    pGraphics._c(XX[40], YY[40], XX[41], YY[41], XX[42], YY[42] );
};

function CVolume()
{

}
CVolume.prototype.getCoord = function()
{
    var X = [],
        Y = [];

    X[0] = 24086.6; Y[0] = 1584.99;
    X[1] = 25878.03; Y[1] = 1268.19;
    X[2] = 30642.29; Y[2] = 669.24;
    X[3] = 35139.13; Y[3] = 104.94;
    X[4] = 43028.74; Y[4] = 0;
    X[5] = 46945.61; Y[5] = 59.9;
    X[6] = 50862.49; Y[6] = 119.79;
    X[7] = 57135.73; Y[7] = 330.66;
    X[8] = 61811.92; Y[8] = 923.67;
    X[9] = 65955.41; Y[9] = 1411.74;
    X[10] = 68883.14; Y[10] = 2040.39;
    X[11] = 72891.84; Y[11] = 3159.09;
    X[12] = 76900.55; Y[12] = 4277.79;
    X[13] = 82700.15; Y[13] = 6485.49;
    X[14] = 86547.22; Y[14] = 10342.53;
    X[15] = 90394.28; Y[15] = 14199.57;
    X[16] = 90394.28; Y[16] = 19211.94;
    X[17] = 90394.28; Y[17] = 24750.99;
    X[18] = 86653.54; Y[18] = 28554.57;
    X[19] = 82913.87; Y[19] = 32358.15;
    X[20] = 79268.72; Y[20] = 33795.63;
    X[21] = 76154.12; Y[21] = 35057.88;
    X[22] = 74484.05; Y[22] = 35583.57;
    X[23] = 70409.29; Y[23] = 36523.08;
    X[24] = 66334.54; Y[24] = 37462.59;
    X[25] = 64662.32; Y[25] = 37742.76;
    X[26] = 60137.56; Y[26] = 38336.76;
    X[27] = 55689.05; Y[27] = 38896.11;
    X[28] = 47782.26; Y[28] = 39001.05;
    X[29] = 44054.41; Y[29] = 38969.37;
    X[30] = 40326.55; Y[30] = 38937.69;
    X[31] = 36744.76; Y[31] = 38832.75;
    X[32] = 32133.01; Y[32] = 38481.3;
    X[33] = 27597.5; Y[33] = 38130.84;
    X[34] = 21918.19; Y[34] = 37007.19;
    X[35] = 17870.29; Y[35] = 35901.36;
    X[36] = 13822.38; Y[36] = 34795.53;
    X[37] = 13593.62; Y[37] = 34726.23;
    X[38] = 13365.93; Y[38] = 34620.3;
    X[39] = 9226.73; Y[39] = 33113.52;
    X[40] = 6246.38; Y[40] = 30888;
    X[41] = 3266.03; Y[41] = 28662.48;
    X[42] = 1632.48; Y[42] = 25789.5;
    X[43] = 0; Y[43] = 22915.53;
    X[44] = 0; Y[44] = 19201.05;
    X[45] = 0; Y[45] = 14329.26;
    X[46] = 3746.11; Y[46] = 10456.38;
    X[47] = 7493.3; Y[47] = 6583.5;
    X[48] = 13503.4; Y[48] = 4341.15;
    X[49] = 18795; Y[49] = 2963.07;
    X[50] = 24086.6; Y[50] = 1584.99;

    var W = X[15],
        H = Y[28];


    return {X: X, Y: Y, W : W, H : H};
};
CVolume.prototype.drawPath = function(pGraphics, XX, YY)
{
    pGraphics._m(XX[0], YY[0]);
    pGraphics._c(XX[0], YY[0], XX[1], YY[1], XX[2], YY[2] );
    pGraphics._c(XX[2], YY[2], XX[3], YY[3], XX[4], YY[4] );
    pGraphics._c(XX[4], YY[4], XX[5], YY[5], XX[6], YY[6] );
    pGraphics._c(XX[6], YY[6], XX[7], YY[7], XX[8], YY[8] );
    pGraphics._c(XX[8], YY[8], XX[9], YY[9], XX[10], YY[10] );
    pGraphics._c(XX[10], YY[10], XX[11], YY[11], XX[12], YY[12] );
    pGraphics._c(XX[12], YY[12], XX[13], YY[13], XX[14], YY[14] );
    pGraphics._c(XX[14], YY[14], XX[15], YY[15], XX[16], YY[16] );
    pGraphics._c(XX[16], YY[16], XX[17], YY[17], XX[18], YY[18] );
    pGraphics._c(XX[18], YY[18], XX[19], YY[19], XX[20], YY[20] );
    pGraphics._c(XX[20], YY[20], XX[21], YY[21], XX[22], YY[22] );
    pGraphics._c(XX[22], YY[22], XX[23], YY[23], XX[24], YY[24] );
    pGraphics._c(XX[24], YY[24], XX[25], YY[25], XX[26], YY[26] );
    pGraphics._c(XX[26], YY[26], XX[27], YY[27], XX[28], YY[28] );
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
};

/**
 *
 * @constructor
 * @extends {CNaryOperator}
 */
function CClosedPathIntegral()
{
    CNaryOperator.call(this);
}
CClosedPathIntegral.prototype = Object.create(CNaryOperator.prototype);
CClosedPathIntegral.prototype.constructor = CClosedPathIntegral;
CClosedPathIntegral.prototype.drawGlyph = function(parameters)
{
    var x           = parameters.x,
        y           = parameters.y,
        Integral    = parameters.Integral,
        Circle      = parameters.Circle,
        CoeffWidth  = parameters.CoeffWidth,
        PDSE        = parameters.PDSE;

    var pGraphics   = parameters.PDSE.Graphics;


    var oCompiledPr = this.Parent.Get_CompiledCtrPrp();

    if(CoeffWidth == undefined)
        CoeffWidth = 1;

    var CoordCircle     = Circle.getCoord(),
        CoordIntegral   = Integral.getCoord();

    var CircleX = CoordCircle.X,
        CircleY = CoordCircle.Y,
        CircleW = CoordCircle.W,
        CircleH = CoordCircle.H;

    var IntegralX = CoordIntegral.X,
        IntegralY = CoordIntegral.Y,
        IntegralW = CoeffWidth*CoordIntegral.W,
        IntegralH = CoordIntegral.H;

    var FontSize  = this.Get_TxtPrControlLetter().FontSize;
    var textScale = FontSize/850;// 1000 pt
    var alpha     = textScale*0.00413; // 25.4/96 /64;

    var shX = (IntegralW - CircleW)*alpha*0.5,
        shY = (IntegralH - CircleH)*alpha*0.48;

    var ExtX    = [],  ExtY    = [],
        InsideX = [],  InsideY = [];

    for(var j = 0; j < IntegralX.length; j++)
    {
        IntegralX[j] = this.pos.x + x + IntegralX[j]*alpha;
        IntegralY[j] = this.pos.y + y + IntegralY[j]*alpha;
    }

    var CircleLng = CircleX.length;

    var intGrid = pGraphics.GetIntegerGrid();
    pGraphics.SetIntegerGrid(false);

    this.Parent.Make_ShdColor(PDSE, this.Parent.Get_CompiledCtrPrp());

    if(pGraphics.Start_Command)
    {
        for(var i = 0; i < CircleLng; i++)
        {
            ExtX[i]     = this.pos.x + x + shX + CircleX[i]*alpha*1.1 - CircleW*alpha*0.04;
            ExtY[i]     = this.pos.y + y + shY + CircleY[i]*alpha*1.1;

            InsideX[i]  = this.pos.x + x + shX + CircleX[CircleLng - i - 1]*alpha*0.9 + CircleW*alpha*0.06;
            InsideY[i]  = this.pos.y + y + shY + CircleY[CircleLng - i - 1]*alpha*0.9 + CircleH*alpha*0.1;
        }

        var oTextOutline = oCompiledPr.TextOutline;

        var oCompiledPr2 = oCompiledPr.Copy();
        oCompiledPr2.TextFill = AscFormat.CreateNoFillUniFill();
        oCompiledPr2.Unifill  = null;
        oCompiledPr2.Color    = null;
        pGraphics.SetTextPr(oCompiledPr2, PDSE.Theme);
        pGraphics._s();
        Circle.drawPath(pGraphics, ExtX, ExtY);
        pGraphics._z();
        Circle.drawPath(pGraphics, InsideX, InsideY);
        pGraphics._z();
        pGraphics.ds();
        pGraphics.df();
        pGraphics._s();
        Integral.drawPath(pGraphics, IntegralX, IntegralY, IntegralW*alpha);
        pGraphics.ds();
        pGraphics.df();

        // делаем заливку уже обводки

        var WidthLine;
        if(pGraphics.m_oTextPr.TextOutline && AscFormat.isRealNumber(pGraphics.m_oTextPr.TextOutline.w))
        {
            WidthLine = (pGraphics.m_oTextPr.TextOutline.w/36000) *0.6; // сместим заливку на половину толщины линии , чтобы не было зазоров м/ду обводкой и заливкой
        }
        else
        {
            WidthLine = 0;
        }

        // последняя точка совпадает в пути с первой, поэтому берем предпоследнюю

        var PrevX = ExtX[CircleLng - 2],
            PrevY = ExtY[CircleLng - 2];

        for(var i = 1; i < CircleLng; i++)
        {
            if(PrevY > ExtY[i])
            {
                ExtX[i]                     += WidthLine;
                InsideX[CircleLng - i - 1]  -= WidthLine;
            }
            else if(PrevY < ExtY[i])
            {
                ExtX[i]                     -= WidthLine;
                InsideX[CircleLng - i - 1]  += WidthLine;
            }

            if(PrevX > ExtX[i])
            {
                ExtY[i]                     -= WidthLine;
                InsideY[CircleLng - i - 1]  += WidthLine;
            }
            else if(PrevX < ExtX[i])
            {
                ExtY[i]                    += WidthLine;
                InsideY[CircleLng - i - 1] -= WidthLine;
            }

            PrevX = ExtX[i];
            PrevY = ExtY[i];
        }

        ExtX[0] = ExtX[CircleX.length - 1];
        ExtY[0] = ExtY[CircleX.length - 1];

        InsideY[CircleX.length - 1] = InsideY[0];
        InsideY[CircleX.length - 1] = InsideY[0];

        var IntegralLng = IntegralX.length;
        PrevX = IntegralX[IntegralLng - 2];
        PrevY = IntegralY[IntegralLng - 2];

        for(var j = 0; j < IntegralLng; j++)
        {
            var CurrentX = IntegralX[j],
                CurrentY = IntegralY[j];

            if(PrevY > IntegralY[j])
                IntegralX[j] += WidthLine;
            else if(PrevY < IntegralY[j])
                IntegralX[j] -= WidthLine;

            if(PrevX > IntegralX[j])
                IntegralY[j] -= WidthLine;
            else if(PrevX < IntegralX[j])
                IntegralY[j] += WidthLine;


            PrevX = CurrentX;
            PrevY = CurrentY;
        }


        IntegralX[0] = IntegralX[IntegralLng - 1];
        IntegralY[0] = IntegralY[IntegralLng - 1];

        // т.к. при отрисовке textArt сравниаются ссылки текстовых настроек и если они совпали, то текстовые настройки не меняются и отрисовка происходит с теми же текстовые настройками, к-ые выставлены ранее
        oCompiledPr.TextOutline  = null;

        pGraphics.SetTextPr(oCompiledPr, PDSE.Theme);

        pGraphics._s();
        Circle.drawPath(pGraphics, ExtX, ExtY);
        pGraphics._z();
        Circle.drawPath(pGraphics, InsideX, InsideY);
        pGraphics._z();
        pGraphics.ds();
        pGraphics.df();

        pGraphics._s();
        Integral.drawPath(pGraphics, IntegralX, IntegralY, IntegralW*alpha);
        pGraphics.ds();
        pGraphics.df();

        oCompiledPr.TextOutline = oTextOutline; // меняем обратно, чтобы не изменились скомпилированные текстовые настройки
    }
    else
    {
        for(var i = 0; i < CircleLng; i++)
        {
            CircleX[i] = this.pos.x + x + shX + CircleX[i]*alpha;
            CircleY[i] = this.pos.y + y + shY + CircleY[i]*alpha;
        }

        var penCircle = 750*FontSize/32;
        pGraphics.p_width(penCircle);

        pGraphics._s();
        Circle.drawPath(pGraphics, CircleX, CircleY);
        pGraphics.ds();

        pGraphics.p_width(0);

        pGraphics._s();

        Integral.drawPath(pGraphics, IntegralX, IntegralY);
        pGraphics.df();
    }

    pGraphics._s();

    pGraphics.SetIntegerGrid(intGrid);
};


/**
 *
 * @constructor
 * @extends {CClosedPathIntegral}
 */
function CContourIntegral()
{
    CClosedPathIntegral.call(this);
}
CContourIntegral.prototype = Object.create(CClosedPathIntegral.prototype);
CContourIntegral.prototype.constructor = CContourIntegral;
CContourIntegral.prototype.drawGlyph = function(x, y, pGraphics, PDSE)
{
    var parameters =
    {
        x:              x,
        y:              y,
        CoeffWidth:     1.0,
        PDSE:           PDSE,
        Integral:       new CIntegral(),
        Circle:         new CCircle()
    };

	CClosedPathIntegral.prototype.drawGlyph.call(this, parameters);
};
CContourIntegral.prototype.calculateSizeGlyph = function()
{
    var betta = this.Get_TxtPrControlLetter().FontSize/36;

    var _width =  8.624*betta,
        _height = 13.7*betta;

    this.gap = 0.93*betta;

    var width = _width + this.gap,
        height = 2*_height;

    return {width : width, height : height};
};

/**
 *
 * @constructor
 * @extends {CClosedPathIntegral}
 */
function CSurfaceIntegral()
{
    CClosedPathIntegral.call(this);
}
CSurfaceIntegral.prototype = Object.create(CClosedPathIntegral.prototype);
CSurfaceIntegral.prototype.constructor = CSurfaceIntegral;
CSurfaceIntegral.prototype.drawGlyph = function(x, y, pGraphics, PDSE)
{
    var parameters =
    {
        x:              x,
        y:              y,
        CoeffWidth:     1.6,
        PDSE:           PDSE,
        Integral:       new CDoubleIntegral(),
        Circle:         new CSurface()
    };

	CClosedPathIntegral.prototype.drawGlyph.call(this, parameters);
};
CSurfaceIntegral.prototype.calculateSizeGlyph = function()
{
    var betta = this.Get_TxtPrControlLetter().FontSize/36;

    var _width =  14.2296*betta,
        _height = 13.7*betta;

    this.gap = 0.93*betta;

    var width = _width + this.gap,
        height = 2*_height;

    return {width : width, height : height};
};

/**
 *
 * @constructor
 * @extends {CClosedPathIntegral}
 */
function CVolumeIntegral()
{
    CClosedPathIntegral.call(this);
}
CVolumeIntegral.prototype = Object.create(CClosedPathIntegral.prototype);
CVolumeIntegral.prototype.constructor = CVolumeIntegral;
CVolumeIntegral.prototype.drawGlyph = function(x, y, pGraphics, PDSE)
{
    var parameters =
    {
        x:              x,
        y:              y,
        CoeffWidth:     2.1,
        PDSE:           PDSE,
        Integral:       new CTripleIntegral(),
        Circle:         new CVolume()
    };

	CClosedPathIntegral.prototype.drawGlyph.call(this, parameters);
};
CVolumeIntegral.prototype.calculateSizeGlyph = function()
{
    var betta = this.Get_TxtPrControlLetter().FontSize/36;

    var _width =  18.925368*betta,
        _height = 13.7*betta;

    this.gap = 0.93*betta;

    var width = _width + this.gap,
        height = 2*_height;

    return {width : width, height : height};
};

//--------------------------------------------------------export----------------------------------------------------
window['AscCommonWord'] = window['AscCommonWord'] || {};
window['AscCommonWord'].CNary = CNary;
