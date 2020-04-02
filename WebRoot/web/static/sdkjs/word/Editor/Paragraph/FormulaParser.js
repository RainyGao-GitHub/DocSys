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

//var window = {};
(function (undefined) {

    var sIdentifier = '(\u0009\|\u0000A\|\u0000D\|[\u0020-\uD7FF]\|[\uE000-\uFFFD]\|[\u10000-\u10FFFF])+';
    var sComparison = '<=\|<>\|>=\|=\|<\|>';
    var sOperator =  "<>\|<=\|>=\|>\|<\|-\|\\^\|\\*\|/\|\\\%|\\+\|=";
    var sColumnName = '([A-Z]){1,2}';
    var sDecimalDigit = '[0-9]';
    var sRowName = sDecimalDigit + '+';
    var sColon = ':';
    var sComma = ',';
    var sFullStop = '\\.';
    var sWholeNumberPart = '([0-9]+)((,[0-9]{3})+[0-9]+)*';
    var sFractionalPart = sDecimalDigit + '+';

    var sConstant =  sWholeNumberPart + sFullStop + sFractionalPart + '\|' + '(' + sWholeNumberPart + '(' + sFullStop +')*)' + '\|(' + sFullStop + sFractionalPart + ')';
    var sCellName = sColumnName + sRowName;
    var sCellCellRange = sCellName + sColon + sCellName;
    var sRowRange = sRowName + sColon + sRowName;
    var sColumnRange = sColumnName + sColon + sColumnName;
    var sCellRange = '(' + sCellCellRange + ')\|(' + sRowRange + ')\|(' + sColumnRange + ')';
    var sCellReference = '(' + sCellRange + ')\|(' + sCellName + ')';
    var sBookmark = "[_A-Z]([A-Z0-9]{0,39})";//TODO: not only latin
    var sBookmarkCellRef = sBookmark + '( +(' + sCellReference + '))*';
    var sFunctions = "(ABS\|AND\|AVERAGE\|COUNT\|DEFINED\|FALSE\|INT\|MAX\|MIN\|MOD\|NOT\|OR\|PRODUCT\|ROUND\|SIGN\|SUM\|TRUE)" ;

    var oComparisonOpRegExp = new RegExp(sComparison, 'g');
    var oColumnNameRegExp = new RegExp(sColumnName, 'g');
    var oCellNameRegExp = new RegExp(sCellName, 'g');
    var oRowNameRegExp = new RegExp(sRowName, 'g');
    var oCellRangeRegExp = new RegExp(sCellRange, 'g');
    var oCellCellRangeRegExp = new RegExp(sCellCellRange, 'g');
    var oRowRangeRegExp = new RegExp(sRowRange, 'g');
    var oColRangeRegExp = new RegExp(sColumnRange, 'g');
    var oCellReferenceRegExp = new RegExp(sCellReference, 'g');
    var oIdentifierRegExp = new RegExp(sIdentifier, 'g');
    var oBookmarkNameRegExp = new RegExp(sBookmark, 'g');
    var oBookmarkCellRefRegExp = new RegExp(sBookmarkCellRef, 'g');
    var oConstantRegExp = new RegExp(sConstant, 'g');
    var oOperatorRegExp = new RegExp(sOperator, 'g');
    var oFunctionsRegExp = new RegExp(sFunctions, 'g');


    var oLettersMap = {};
    oLettersMap['A'] = 1;
    oLettersMap['B'] = 2;
    oLettersMap['C'] = 3;
    oLettersMap['D'] = 4;
    oLettersMap['E'] = 5;
    oLettersMap['F'] = 6;
    oLettersMap['G'] = 7;
    oLettersMap['H'] = 8;
    oLettersMap['I'] = 9;
    oLettersMap['J'] = 10;
    oLettersMap['K'] = 11;
    oLettersMap['L'] = 12;
    oLettersMap['M'] = 13;
    oLettersMap['N'] = 14;
    oLettersMap['O'] = 15;
    oLettersMap['P'] = 16;
    oLettersMap['Q'] = 17;
    oLettersMap['R'] = 18;
    oLettersMap['S'] = 19;
    oLettersMap['T'] = 20;
    oLettersMap['U'] = 21;
    oLettersMap['V'] = 22;
    oLettersMap['W'] = 23;
    oLettersMap['X'] = 24;
    oLettersMap['Y'] = 25;
    oLettersMap['Z'] = 26;


  var oDigitMap = {};
    oDigitMap['0'] = 0;
    oDigitMap['1'] = 1;
    oDigitMap['2'] = 2;
    oDigitMap['3'] = 3;
    oDigitMap['4'] = 4;
    oDigitMap['5'] = 5;
    oDigitMap['6'] = 6;
    oDigitMap['7'] = 7;
    oDigitMap['8'] = 8;
    oDigitMap['9'] = 9;


    function CFormulaNode(parseQueue) {
        this.document = null;
        this.result = null;
        this.error = null;
        this.parseQueue = parseQueue;
        this.parent = null;
    }
    CFormulaNode.prototype.argumentsCount = 0;
    CFormulaNode.prototype.supportErrorArgs = function(){
        return false;
    };
    CFormulaNode.prototype.inFunction = function(){
        if(this.isFunction()){
            return this;
        }
        if(!this.parent){
            return this.parent;
        }
        return this.parent.inFunction();
    };

    CFormulaNode.prototype.isCell = function(){
        return false;
    };


    CFormulaNode.prototype.checkSizeFormated = function(_result){
        if(_result.length > 63){
            this.setError((ERROR_TYPE_LARGE_NUMBER), null);
        }
    };
    CFormulaNode.prototype.checkRoundNumber = function(number){
        return fRoundNumber(number, 2);
    };

    CFormulaNode.prototype.checkBraces = function(_result){
        return _result;
    };

    CFormulaNode.prototype.formatResult = function(){
        var sResult = null;
        if(AscFormat.isRealNumber(this.result)){
            var _result = this.result;
            if(_result === Infinity){
                _result = 1.0;
            }
            if(_result === -Infinity){
                _result = -1.0;
            }
            if(this.parseQueue.format){
                return this.parseQueue.format.formatToWord(_result, 14);
            }
            sResult = "";
            if(_result < 0){
                _result = -_result;
            }
            _result = this.checkRoundNumber(_result);
            var i;
            var sRes = _result.toExponential(13);
            var aDigits = sRes.split('e');
            var nPow = parseInt(aDigits[1]);
            var sNum = aDigits[0];
            var t = sNum.split('.');
            if(nPow < 0){
                for(i = t[1].length - 1; i > -1; --i){
                    if(t[1][i] !== '0'){
                        break;
                    }
                }
                if(i > -1){
                    sResult += t[1].slice(0, i + 1);
                }
                sResult = t[0] + sResult;
                nPow = -nPow - 1;
                for(i = 0; i < nPow; ++i){
                    sResult = "0" + sResult;
                }
                sResult = ("0" + this.digitSeparator + sResult);
            }
            else{
                sResult += t[0];

                for(i = 0; i < nPow; ++i){
                    if(t[1] && i < t[1].length){
                        sResult += t[1][i];
                    }
                    else{
                        sResult += '0';
                    }
                }
                if(t[1] && nPow < t[1].length){
                    for(i = t[1].length - 1; i >= nPow; --i){
                        if(t[1][i] !== '0'){
                            break;
                        }
                    }
                    var sStr = "";
                    for(; i >= nPow; --i){
                        sStr = t[1][i] + sStr;
                    }
                    if(sStr !== ""){
                        sResult += (this.digitSeparator + sStr);
                    }
                }
            }
            this.checkSizeFormated(sResult);
            if(this.result < 0){
                sResult = '-' + sResult;
            }
            sResult = this.checkBraces(sResult);
        }
        return sResult;
    };

    CFormulaNode.prototype.calculate = function () {
        this.error = null;
        this.result = null;
        if(!this.parseQueue){
            this.setError(ERROR_TYPE_ERROR, null);
            return;
        }
        var aArgs = [];
        for(var i = 0; i < this.argumentsCount; ++i){
            var oArg = this.parseQueue.getNext();
            if(!oArg){
                this.setError(ERROR_TYPE_MISSING_ARGUMENT, null);
                return;
            }
            oArg.parent = this;
            oArg.calculate();

            aArgs.push(oArg);
        }
        if(!this.supportErrorArgs()){
            for(i = aArgs.length - 1; i > -1; --i){
                oArg = aArgs[i];
                if(oArg.error){
                    this.error = oArg.error;
                    return;
                }
            }
        }
        if(this.isOperator()){

        }
        this._calculate(aArgs);
    };

    CFormulaNode.prototype._calculate = function(aArgs){
        this.setError(ERROR_TYPE_ERROR, null);//not implemented
    };

    CFormulaNode.prototype.isFunction = function () {
        return false;
    };
    CFormulaNode.prototype.isOperator = function () {
        return false;
    };
    CFormulaNode.prototype.setError = function (Type, Data) {
        this.error = new CError(Type, Data);
    };
    CFormulaNode.prototype.setParseQueue = function(oQueue){
        this.parseQueue = oQueue;
    };

    CFormulaNode.prototype.argumentsCount = 0;

    function CNumberNode(parseQueue) {
        CFormulaNode.call(this, parseQueue);
        this.value = null;
    }
    CNumberNode.prototype = Object.create(CFormulaNode.prototype);
    CNumberNode.prototype.precedence = 15;
    CNumberNode.prototype.checkBraces = function(_result){
        var sFormula = this.parseQueue.formula;
        if(sFormula[0] === '(' && sFormula[sFormula.length - 1] === ')'){
            return '(' + _result + ')';
        }
        return _result;
    };
    CNumberNode.prototype.checkSizeFormated = function(_result){
        var sFormula = this.parseQueue.formula;
        if(sFormula[0] === '(' && sFormula[sFormula.length - 1] === ')'){
            CFormulaNode.prototype.checkSizeFormated.call(this, _result);
        }
    };
    CNumberNode.prototype.checkRoundNumber = function(number){
        return number;
    };
    CNumberNode.prototype._calculate = function () {
        if(AscFormat.isRealNumber(this.value)){
            this.result = this.value;
        }
        else{
            this.setError(ERROR_TYPE_ERROR, null);//not a number
        }
        return this.error;
    };

    function CListSeparatorNode(parseQueue) {
        CFormulaNode.call(this, parseQueue);
    }
    CListSeparatorNode.prototype = Object.create(CFormulaNode.prototype);
    CListSeparatorNode.prototype.precedence = 15;

    function COperatorNode(parseQueue){
        CFormulaNode.call(this, parseQueue);
    }

    COperatorNode.prototype = Object.create(CFormulaNode.prototype);
    COperatorNode.prototype.precedence = 0;
    COperatorNode.prototype.argumentsCount = 2;
    COperatorNode.prototype.isOperator = function(){
        return true;
    };
    COperatorNode.prototype.checkCellInFunction = function (aArgs) {
        var i, oArg;
        if(this.parent && this.parent.isFunction() && this.parent.listSupport()){
            for(i = aArgs.length - 1; i > -1; --i){
                oArg = aArgs[i];
                if(oArg.isCell()){
                    this.setError(ERROR_TYPE_SYNTAX_ERROR, oArg.getOwnCellName());
                    return;
                }
            }
        }
    };

    function CUnaryMinusOperatorNode(parseQueue){
        COperatorNode.call(this, parseQueue);
    }

    CUnaryMinusOperatorNode.prototype = Object.create(COperatorNode.prototype);
    CUnaryMinusOperatorNode.prototype.precedence = 13;
    CUnaryMinusOperatorNode.prototype.argumentsCount = 1;
    CUnaryMinusOperatorNode.prototype._calculate = function (aArgs) {
        this.checkCellInFunction(aArgs);
        if(this.error){
            return;
        }
        this.result = -aArgs[0].result;
    };

    function CPowersAndRootsOperatorNode(parseQueue){
        COperatorNode.call(this, parseQueue);
    }

    CPowersAndRootsOperatorNode.prototype = Object.create(COperatorNode.prototype);
    CPowersAndRootsOperatorNode.prototype.precedence = 12;
    CPowersAndRootsOperatorNode.prototype._calculate = function (aArgs) {
        this.checkCellInFunction(aArgs);
        if(this.error){
            return;
        }
        this.result = Math.pow(aArgs[1].result, aArgs[0].result);
    };
    function CMultiplicationOperatorNode(parseQueue){
        COperatorNode.call(this, parseQueue);
    }

    CMultiplicationOperatorNode.prototype = Object.create(COperatorNode.prototype);
    CMultiplicationOperatorNode.prototype.precedence = 11;
    CMultiplicationOperatorNode.prototype._calculate = function (aArgs) {
        this.checkCellInFunction(aArgs);
        if(this.error){
            return;
        }
        this.result = aArgs[0].result * aArgs[1].result;
    };

    function CDivisionOperatorNode(parseQueue){
        COperatorNode.call(this, parseQueue);
    }

    CDivisionOperatorNode.prototype = Object.create(COperatorNode.prototype);
    CDivisionOperatorNode.prototype.precedence = 11;
    CDivisionOperatorNode.prototype._calculate = function (aArgs) {
        this.checkCellInFunction(aArgs);
        if(this.error){
            return;
        }
        if(AscFormat.fApproxEqual(0.0, aArgs[0].result)){
            this.setError(ERROR_TYPE_ZERO_DIVIDE, null);
            return;
        }
        this.result = aArgs[1].result/aArgs[0].result;
    };

    function CPercentageOperatorNode(parseQueue){
        COperatorNode.call(this, parseQueue);
    }

    CPercentageOperatorNode.prototype = Object.create(COperatorNode.prototype);
    CPercentageOperatorNode.prototype.precedence = 8;
    CPercentageOperatorNode.prototype.argumentsCount = 1;
    CPercentageOperatorNode.prototype._calculate = function (aArgs) {
        this.checkCellInFunction(aArgs);
        if(this.error){
            return;
        }
        if(aArgs[0].error){
            this.setError(ERROR_TYPE_SYNTAX_ERROR, "%");
            return;
        }
        this.result = aArgs[0].result / 100.0;
    };
    CPercentageOperatorNode.prototype.supportErrorArgs = function () {
        return true;
    };

    function CAdditionOperatorNode(parseQueue){
        COperatorNode.call(this, parseQueue);
    }

    CAdditionOperatorNode.prototype = Object.create(COperatorNode.prototype);
    CAdditionOperatorNode.prototype.precedence = 7;
    CAdditionOperatorNode.prototype._calculate = function (aArgs) {
        this.checkCellInFunction(aArgs);
        if(this.error){
            return;
        }
        this.result = aArgs[1].result + aArgs[0].result;
    };

    function CSubtractionOperatorNode(parseQueue){
        COperatorNode.call(this, parseQueue);
    }

    CSubtractionOperatorNode.prototype = Object.create(COperatorNode.prototype);
    CSubtractionOperatorNode.prototype.precedence = 7;
    CSubtractionOperatorNode.prototype._calculate = function (aArgs) {
        this.checkCellInFunction(aArgs);
        if(this.error){
            return;
        }
        this.result = aArgs[1].result - aArgs[0].result;
    };

    function CEqualToOperatorNode(parseQueue){
        COperatorNode.call(this, parseQueue);
    }

    CEqualToOperatorNode.prototype = Object.create(COperatorNode.prototype);
    CEqualToOperatorNode.prototype.precedence = 6;
    CEqualToOperatorNode.prototype._calculate = function (aArgs) {
        this.checkCellInFunction(aArgs);
        if(this.error){
            return;
        }
        this.result = AscFormat.fApproxEqual(aArgs[1].result, aArgs[0].result) ? 1.0 : 0.0;
    };

    function CNotEqualToOperatorNode(parseQueue){
        COperatorNode.call(this, parseQueue);
    }

    CNotEqualToOperatorNode.prototype = Object.create(COperatorNode.prototype);
    CNotEqualToOperatorNode.prototype.precedence = 5;
    CNotEqualToOperatorNode.prototype._calculate = function (aArgs) {
        this.checkCellInFunction(aArgs);
        if(this.error){
            return;
        }
        this.result = AscFormat.fApproxEqual(aArgs[1].result, aArgs[0].result) ? 0.0 : 1.0;
    };
    function CLessThanOperatorNode(parseQueue){
        COperatorNode.call(this, parseQueue);
    }

    CLessThanOperatorNode.prototype = Object.create(COperatorNode.prototype);
    CLessThanOperatorNode.prototype.precedence = 4;
    CLessThanOperatorNode.prototype._calculate = function (aArgs) {
        this.checkCellInFunction(aArgs);
        if(this.error){
            return;
        }
        this.result = (aArgs[1].result < aArgs[0].result) ? 1.0 : 0.0;
    };
    function CLessThanOrEqualToOperatorNode(parseQueue){
        COperatorNode.call(this, parseQueue);
    }

    CLessThanOrEqualToOperatorNode.prototype = Object.create(COperatorNode.prototype);
    CLessThanOrEqualToOperatorNode.prototype.precedence = 3;
    CLessThanOrEqualToOperatorNode.prototype._calculate = function (aArgs) {
        this.checkCellInFunction(aArgs);
        if(this.error){
            return;
        }
        this.result = (aArgs[1].result <= aArgs[0].result) ? 1.0 : 0.0;
    };
    function CGreaterThanOperatorNode(parseQueue){
        COperatorNode.call(this, parseQueue);
    }

    CGreaterThanOperatorNode.prototype = Object.create(COperatorNode.prototype);
    CGreaterThanOperatorNode.prototype.precedence = 2;
    CGreaterThanOperatorNode.prototype._calculate = function (aArgs) {
        this.checkCellInFunction(aArgs);
        if(this.error){
            return;
        }
        this.result = (aArgs[1].result > aArgs[0].result) ? 1.0 : 0.0;
    };
    function CGreaterThanOrEqualOperatorNode(parseQueue){
        COperatorNode.call(this, parseQueue);
    }

    CGreaterThanOrEqualOperatorNode.prototype = Object.create(COperatorNode.prototype);
    CGreaterThanOrEqualOperatorNode.prototype.precedence = 1;
    CGreaterThanOrEqualOperatorNode.prototype._calculate = function (aArgs) {
        this.checkCellInFunction(aArgs);
        if(this.error){
            return;
        }
        this.result = (aArgs[1].result >= aArgs[0].result) ? 1.0 : 0.0;
    };



    function CLeftParenOperatorNode(parseQueue){
        CFormulaNode.call(this, parseQueue);
    }

    CLeftParenOperatorNode.prototype = Object.create(CFormulaNode.prototype);
    CLeftParenOperatorNode.prototype.precedence = 1;
    // CLeftParenOperatorNode.prototype._calculate = function (aArgs) {
    // };

    function CRightParenOperatorNode(parseQueue){
        CFormulaNode.call(this, parseQueue);
    }

    CRightParenOperatorNode.prototype = Object.create(CFormulaNode.prototype);
    CRightParenOperatorNode.prototype.precedence = 1;
    // CRightParenOperatorNode.prototype._calculate = function (aArgs) {
    // };

    function CLineSeparatorOperatorNode(parseQueue){
        CFormulaNode.call(this, parseQueue);
    }

    CLineSeparatorOperatorNode.prototype = Object.create(CFormulaNode.prototype);
    CLineSeparatorOperatorNode.prototype.precedence = 1;
    // CRightParenOperatorNode.prototype._calculate = function (aArgs) {
    // };

    var oOperatorsMap = {};
    oOperatorsMap["-"] = CUnaryMinusOperatorNode;
    oOperatorsMap["^"] = CPowersAndRootsOperatorNode;
    oOperatorsMap["*"] = CMultiplicationOperatorNode;
    oOperatorsMap["/"] = CDivisionOperatorNode;
    oOperatorsMap["%"] = CPercentageOperatorNode;
    oOperatorsMap["+"] = CAdditionOperatorNode;
    oOperatorsMap["-"] = CSubtractionOperatorNode;
    oOperatorsMap["="] = CEqualToOperatorNode;
    oOperatorsMap["<>"]= CNotEqualToOperatorNode;
    oOperatorsMap["<"] = CLessThanOperatorNode;
    oOperatorsMap["<="]= CLessThanOrEqualToOperatorNode;
    oOperatorsMap[">"] = CGreaterThanOperatorNode;
    oOperatorsMap[">="] = CGreaterThanOrEqualOperatorNode;
    oOperatorsMap["("] = CLeftParenOperatorNode;
    oOperatorsMap[")"] = CRightParenOperatorNode;


    var LEFT = 0;
    var RIGHT = 1;
    var ABOVE = 2;
    var BELOW = 3;

    var sLetters = "ZABCDEFGHIJKLMNOPQRSTUVWXY";
    var sDigits = "0123456789";

    function CCellRangeNode(parseQueue){
        CFormulaNode.call(this, parseQueue);
        this.bookmarkName = null;
        this.c1 = null;
        this.r1 = null;
        this.c2 = null;
        this.r2 = null;
        this.dir = null;
    }
    CCellRangeNode.prototype = Object.create(CFormulaNode.prototype);
    CCellRangeNode.prototype.argumentsCount = 0;

    CCellRangeNode.prototype.getCellName = function(c, r){
        var _c = c + 1 ;
        var _r = r + 1;

        var sColName = sLetters[(_c % 26)];
        _c = ((_c / 26) >> 0);
        while(_c !== 0){
            sColName = sLetters[(_c % 26)] + sColName;
            _c = ((_c / 26) >> 0);
        }
        var sRowName = sDigits[(_r % 10)];
        _r = ((_r / 10) >> 0);
        while(_r!== 0){
            sRowName = sDigits[(_r % 10)] + sRowName;
            _r = ((_r / 10) >> 0);
        }
        return sColName + sRowName;
    };
    CCellRangeNode.prototype.getOwnCellName = function(c, r){
        return this.getCellName(this.c1, this.r1);
    };

    CCellRangeNode.prototype.parseText = function(sText){
        var oParser = new CTextParser(',', this.digitSeparator);
        oParser.setFlag(PARSER_MASK_CLEAN, true);
        oParser.parse(Asc.trim(sText));
        if(oParser.parseQueue){
            oParser.parseQueue.flags = oParser.flags;
            oParser.parseQueue.calculate(false);
            if(!AscFormat.isRealNumber(oParser.parseQueue.result) || oParser.parseQueue.pos > 0){
                var aQueue = oParser.parseQueue.queue;
                var fSumm = 0.0;
                if(aQueue.length > 0){
                    for(var i = 0; i < aQueue.length; ++i){
                        if(aQueue[i] instanceof CNumberNode){
                            fSumm += aQueue[i].value;
                        }
                        else if(aQueue[i] instanceof CLineSeparatorOperatorNode){
                            continue;
                        }
                        else{
                            break;
                        }
                    }
                    if(aQueue.length === i){
                        oParser.parseQueue.result = fSumm;
                    }
                }
            }
        }
        return oParser.parseQueue;
    };

    CCellRangeNode.prototype.getContentValue = function(oContent){
        var sString;
        oContent.Set_ApplyToAll(true);
        sString = oContent.GetSelectedText(false, {NewLineParagraph : true, NewLine : true});
        oContent.Set_ApplyToAll(false);
        return this.parseText(sString);
    };

    CCellRangeNode.prototype.getCell = function(oTable, nRow, nCol){
        var Row = oTable.Get_Row(nRow);
        if (!Row)
            return null;

        return Row.Get_Cell(nCol);
    };

    CCellRangeNode.prototype.calculateInRow = function(oTable, nRowIndex, nStart, nEnd){
        var oRow = oTable.GetRow(nRowIndex);
        if(!oRow){
            return;
        }
        var nCellsCount = oRow.Get_CellsCount();
        for(var i = nStart; i <= nEnd && i < nCellsCount; ++i){
            var oCurCell = oRow.Get_Cell(i);
            if(oCurCell){
                var res = this.getContentValue(oCurCell.GetContent());
                if(res && AscFormat.isRealNumber(res.result)){
                    this.result.push(res.result);
                }
                // else{
                //     this.result.push(0);
                // }
            }
        }
    };

    CCellRangeNode.prototype.calculateInCol = function(oTable, nColIndex, nStart, nEnd){
        var nRowsCount = oTable.Get_RowsCount();
        for(var i = nStart; i <= nEnd && i < nRowsCount; ++i){
            var oRow = oTable.Get_Row(i);
            if(oRow){
                var oCurCell = oRow.Get_Cell(nColIndex);
                if(oCurCell){
                    var res = this.getContentValue(oCurCell.GetContent());
                    if(res && AscFormat.isRealNumber(res.result)){
                        this.result.push(res.result);
                    }
                    // else{
                    //     this.result.push(0);
                    // }
                }
            }
        }
    };

    CCellRangeNode.prototype.calculateCellRange = function(oTable){
        this.result = [];

        var nStartCol, nEndCol, nStartRow, nEndRow;
        if(this.c1 !== null && this.c2 !== null){
            nStartCol = this.c1;
            nEndCol = this.c2;
        }
        else{
            nStartCol = 0;
            nEndCol = +Infinity;
        }
        if(this.r1 !== null && this.r2 !== null){
            nStartRow = this.r1;
            nEndRow = this.r2;
        }
        else{
            nStartRow = 0;
            nEndRow = oTable.Get_RowsCount() - 1;
        }
        for(var i = nStartRow; i <= nEndRow; ++i){
            this.calculateInRow(oTable, i, nStartCol, nEndCol);
        }
    };

    CCellRangeNode.prototype.calculateCell = function(oTable){
        var oCell, oContent;
        oCell = this.getCell(oTable, this.r1, this.c1);
        if(!oCell){
            var oFunction = this.inFunction();
            if(!oFunction){
                this.setError(this.getCellName(this.c1, this.r1) + " " + AscCommon.translateManager.getValue(ERROR_TYPE_IS_NOT_IN_TABLE), null);
            }
            else{
                if(this.c1 > 63 && oFunction.listSupport()){
                    this.setError(ERROR_TYPE_INDEX_TOO_LARGE, null);
                }
                else{
                    this.setError(this.getCellName(this.c1, this.r1) + " " + AscCommon.translateManager.getValue(ERROR_TYPE_IS_NOT_IN_TABLE), null);
                }
            }
            return;
        }
        oContent = oCell.GetContent();
        if(!oContent){
            this.result = 0.0;
            return;
        }
        var oRes = this.getContentValue(oContent);
        if(oRes && !AscFormat.isRealNumber(oRes.result)){
            this.result = 0.0;
        }
        else{
            this.result = oRes.result;
        }
    };


    CCellRangeNode.prototype._parseCellVal = function (oCurCell, oRes) {
        if(oCurCell){
            var res = this.getContentValue(oCurCell.GetContent());
            if(!res || !(res.flags & PARSER_MASK_CLEAN)){
                if(oRes.bClean === true && this.result.length > 0){
                    oRes.bBreak = true;
                }
                else{
                    oRes.bClean = false;
                    if(res && res.result !== null){
                        this.result.push(res.result);
                    }
                }
            }
            else{
                if(res.result !== null){
                    this.result.push(res.result);
                }
            }
        }
    };

    CCellRangeNode.prototype._calculate = function(){
        var oTable, oCell, oContent, oRow, i, oCurCell, oCurRow, nCellCount;
        if(this.isCell()){
            oTable = this.parseQueue.getParentTable();
            if(!oTable){
                this.result = 0.0;
                return
            }
            this.calculateCell(oTable);
        }
        else if(this.isDir()){
            oTable = this.parseQueue.getParentTable();
            if(!oTable){
                this.setError(ERROR_TYPE_FORMULA_NOT_IN_TABLE, null);
                return
            }
            oCell = this.parseQueue.getParentCell();
            if(!oCell){
                this.setError(ERROR_TYPE_FORMULA_NOT_IN_TABLE, null);
                return
            }
            oRow = oCell.GetRow();
            if(!oRow){
                this.setError(ERROR_TYPE_FORMULA_NOT_IN_TABLE, null);
                return
            }
            var oResult = {bClean: true, bBreak: false};
            if(this.dir === LEFT){
                if(oCell.Index === 0){
                    this.setError(ERROR_TYPE_INDEX_ZERO, null);
                    return;
                }
                this.result = [];
                for(i = oCell.Index - 1; i > -1; --i){
                    oCurCell = oRow.Get_Cell(i);
                    this._parseCellVal(oCurCell, oResult);
                    if(oResult.bBreak){
                        break;
                    }
                }
            }
            else if(this.dir === ABOVE){
                if(oRow.Index === 0){
                    this.setError(ERROR_TYPE_INDEX_ZERO, null);
                    return;
                }
                this.result = [];
                for(i = oRow.Index - 1; i > -1; --i){
                    oCurRow = oTable.Get_Row(i);
                    oCurCell = oCurRow.Get_Cell(oCell.Index);
                    this._parseCellVal(oCurCell, oResult);
                    if(oResult.bBreak){
                        break;
                    }
                }
            }
            else if(this.dir === RIGHT){
                this.result = [];
                nCellCount = oRow.Get_CellsCount();
                for(i = oCell.Index + 1; i < nCellCount; ++i){
                    oCurCell = oRow.Get_Cell(i);
                    this._parseCellVal(oCurCell, oResult);
                    if(oResult.bBreak){
                        break;
                    }
                }
            }
            else if(this.dir === BELOW){
                this.result = [];
                nCellCount = oTable.Get_RowsCount();
                for(i = oRow.Index + 1; i < nCellCount; ++i){
                    oCurRow = oTable.Get_Row(i);
                    oCurCell = oCurRow.Get_Cell(oCell.Index);
                    this._parseCellVal(oCurCell, oResult);
                    if(oResult.bBreak){
                        break;
                    }
                }
            }
            return;
        }
        else if(this.isCellRange()){
            this.calculateCellRange(this.parseQueue.getParentTable());
        }
        else if(this.isBookmark() || this.isBookmarkCell() || this.isBookmarkCellRange()){
            var oDocument = this.parseQueue.document;
            if(!oDocument || !oDocument.BookmarksManager){
                this.setError(ERROR_TYPE_ERROR, null);
                return;
            }
            oDocument.TurnOff_InterfaceEvents();
            var oSelectionState = oDocument.GetSelectionState();
            if(oDocument.BookmarksManager.SelectBookmark(this.bookmarkName)){
                var oCurrentParagraph = oDocument.GetCurrentParagraph();
                if(oCurrentParagraph.Parent){
                    oCell = oCurrentParagraph.Parent.IsTableCellContent(true);
                    if(oCell){
                        oRow = oCell.GetRow();
                        if(oRow){
                            oTable = oRow.GetTable();
                        }
                    }
                    if(oTable && !oTable.IsCellSelection()){
                        oTable = null;
                    }
                    if(this.isBookmark()){
                        if(!oTable){
                            var sString = oDocument.GetSelectedText(false, {NewLineParagraph : true, NewLine : true});
                            var oRes = this.parseText(sString);
                            if(oRes && !AscFormat.isRealNumber(oRes.result)){
                                this.result = 0.0;
                            }
                            else{
                                this.result = oRes.result;
                            }
                        }
                        else {
                            this.r1 = 0;
                            this.r2 = oTable.Get_RowsCount() - 1;
                            this.calculateCellRange(oTable);
                            this.r1 = null;
                            this.r2 = null;
                            var dResult = 0;
                            for(i = 0; i < this.result.length; ++i){
                                dResult += this.result[i];
                            }
                            this.result = dResult;
                        }
                    }
                    else{
                        if(oTable){
                            if(this.isBookmarkCell()){
                                this.calculateCell(oTable);
                            }
                            else {
                                this.calculateCellRange(oTable);
                            }
                        }
                        else{
                            var sData = "";
                            if(this.isBookmarkCell()){
                                sData = this.getCellName(this.c1, this.r1);
                            }
                            else {
                                if(this.c1 !== null && this.r1 !== null){
                                    sData = this.getCellName(this.c1, this.r1);
                                }
                                else{
                                    sData = ":"
                                }
                            }
                            this.setError(ERROR_TYPE_SYNTAX_ERROR, sData);
                        }
                    }
                }
                else {
                    this.setError(ERROR_TYPE_ERROR, null);
                }
            }
            else{
                this.setError(ERROR_TYPE_UNDEFINED_BOOKMARK, this.bookmarkName);
            }
            oDocument.SetSelectionState(oSelectionState);
            oDocument.TurnOn_InterfaceEvents(false);
        }
        else{
            this.setError(ERROR_TYPE_ERROR, null);
        }
    };

    CCellRangeNode.prototype.isCell = function(){
        return this.bookmarkName === null && this.c1 !== null && this.r1 !== null && this.c2 === null && this.r2 === null;
    };
    CCellRangeNode.prototype.isDir = function(){
        return this.dir !== null;
    };
    CCellRangeNode.prototype.isBookmarkCellRange = function(){
        return this.bookmarkName !== null && (this.c1 !== null || this.r1 !== null) && (this.c2 !== null || this.r2 !== null);
    };
    CCellRangeNode.prototype.isCellRange = function(){
        return this.bookmarkName === null && (this.c1 !== null || this.r1 !== null) && (this.c2 !== null || this.r2 !== null);
    };

    CCellRangeNode.prototype.isBookmarkCell = function(){
        return this.bookmarkName !== null && this.c1 !== null && this.r1 !== null && this.c2 === null && this.r2 === null;
    };
    CCellRangeNode.prototype.isBookmarkCellRange = function(){
        return this.bookmarkName !== null && (this.c1 !== null || this.r1 !== null) && (this.c2 !== null || this.r2 !== null);
    };
    CCellRangeNode.prototype.isBookmark = function(){
        return this.bookmarkName !== null && this.c1 === null && this.r1 === null && this.c2 === null && this.r2 === null;
    };

    function CFunctionNode(parseQueue){
        CFormulaNode.call(this, parseQueue);
        this.operands = [];
    }

    CFunctionNode.prototype = Object.create(CFormulaNode.prototype);
    CFunctionNode.prototype.precedence = 14;
    CFunctionNode.prototype.minArgumentsCount = 0;
    CFunctionNode.prototype.maxArgumentsCount = 0;
    CFunctionNode.prototype.isFunction = function () {
        return true;
    };
    CFunctionNode.prototype.listSupport = function () {
        return false;
    };

    function CABSFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CABSFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CABSFunctionNode.prototype.minArgumentsCount = 1;
    CABSFunctionNode.prototype.maxArgumentsCount = 1;
    CABSFunctionNode.prototype._calculate = function (aArgs) {
        this.result = Math.abs(aArgs[0].result);
    };

    function CANDFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CANDFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CANDFunctionNode.prototype.minArgumentsCount = 2;
    CANDFunctionNode.prototype.maxArgumentsCount = 2;
    CANDFunctionNode.prototype._calculate = function (aArgs) {
        this.result = (AscFormat.fApproxEqual(aArgs[1].result, 0.0) || AscFormat.fApproxEqual(aArgs[0].result, 0.0)) ? 0.0 : 1.0;
    };

    function CAVERAGEFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CAVERAGEFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CAVERAGEFunctionNode.prototype.minArgumentsCount = 2;
    CAVERAGEFunctionNode.prototype.maxArgumentsCount = +Infinity;
    CAVERAGEFunctionNode.prototype.listSupport = function () {
        return true;
    };
    CAVERAGEFunctionNode.prototype._calculate = function (aArgs) {
        var summ = 0.0;
        var count = 0;
        var result;
        for(var i = 0; i < aArgs.length; ++i){
            result = aArgs[i].result;
            if(Array.isArray(result)){
                for(var j = 0; j < result.length; ++j){
                    summ += result[j];
                }
                count += result.length;
            }
            else {
                summ += result;
                ++count;
            }
        }
        this.result = summ/count;
    };

    function CCOUNTFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CCOUNTFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CCOUNTFunctionNode.prototype.minArgumentsCount = 2;
    CCOUNTFunctionNode.prototype.maxArgumentsCount = +Infinity;
    CCOUNTFunctionNode.prototype.listSupport = function () {
        return true;
    };
    CCOUNTFunctionNode.prototype._calculate = function (aArgs) {
        var count = 0;
        var result;
        for(var i = 0; i < aArgs.length; ++i){
            result = aArgs[i].result;
            if(Array.isArray(result)){
                count += result.length;
            }
            else {
                ++count;
            }
        }
        this.result = count;
    };


    function CDEFINEDFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CDEFINEDFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CDEFINEDFunctionNode.prototype.minArgumentsCount = 1;
    CDEFINEDFunctionNode.prototype.maxArgumentsCount = 1;
    CDEFINEDFunctionNode.prototype.supportErrorArgs = function () {
        return true;
    };
    CDEFINEDFunctionNode.prototype._calculate = function (aArgs) {
        if(aArgs[0].error){
            this.result = 0.0;
        }
        else{
            this.result = 1.0;
        }
    };

    function CFALSEFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CFALSEFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CFALSEFunctionNode.prototype.minArgumentsCount = 0;
    CFALSEFunctionNode.prototype.maxArgumentsCount = 0;
    CFALSEFunctionNode.prototype._calculate = function (aArgs) {
        this.result = 0.0;
    };
    function CTRUEFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CTRUEFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CTRUEFunctionNode.prototype.minArgumentsCount = 0;
    CTRUEFunctionNode.prototype.maxArgumentsCount = 0;
    CTRUEFunctionNode.prototype._calculate = function (aArgs) {
        this.result = 1.0;
    };

    function CINTFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CINTFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CINTFunctionNode.prototype.minArgumentsCount = 1;
    CINTFunctionNode.prototype.maxArgumentsCount = 1;
    CINTFunctionNode.prototype._calculate = function (aArgs) {
        this.result = (aArgs[0].result >> 0);
    };
    function CIFFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CIFFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CIFFunctionNode.prototype.minArgumentsCount = 3;
    CIFFunctionNode.prototype.maxArgumentsCount = 3;
    CIFFunctionNode.prototype._calculate = function (aArgs) {
        this.result = ((aArgs[2].result !== 0.0) ? aArgs[1] : aArgs[0]);
    };
    function CMAXFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CMAXFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CMAXFunctionNode.prototype.minArgumentsCount = 2;
    CMAXFunctionNode.prototype.maxArgumentsCount = +Infinity;
    CMAXFunctionNode.prototype.listSupport = function () {
        return true;
    };
    CMAXFunctionNode.prototype._calculate = function (aArgs) {
        var ret = null;
        for(var i = 0; i < aArgs.length; ++i){
            if(!aArgs[i].error){
                if(!Array.isArray(aArgs[i].result)){
                    if(ret === null){
                        ret = aArgs[i].result;
                    }
                    else{
                        ret = Math.max(ret, aArgs[i].result);
                    }
                }
                else{
                    for(var j = 0; j < aArgs[i].result.length; ++j){
                        if(ret === null){
                            ret = aArgs[i].result[j];
                        }
                        else{
                            ret = Math.max(ret, aArgs[i].result[j]);
                        }
                    }
                }
            }
        }
        if(ret !== null){
            this.result = ret;
        }
        else{
            this.result = 0.0;
        }
    };

    function CMINFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CMINFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CMINFunctionNode.prototype.minArgumentsCount = 2;
    CMINFunctionNode.prototype.maxArgumentsCount = +Infinity;
    CMINFunctionNode.prototype.listSupport = function () {
        return true;
    };
    CMINFunctionNode.prototype._calculate = function (aArgs) {
        var ret = null;
        for(var i = 0; i < aArgs.length; ++i){
            if(!aArgs[i].error){
                if(!Array.isArray(aArgs[i].result)){
                    if(ret === null){
                        ret = aArgs[i].result;
                    }
                    else{
                        ret = Math.min(ret, aArgs[i].result);
                    }
                }
                else{
                    for(var j = 0; j < aArgs[i].result.length; ++j){
                        if(ret === null){
                            ret = aArgs[i].result[j];
                        }
                        else{
                            ret = Math.min(ret, aArgs[i].result[j]);
                        }
                    }
                }
            }
        }
        if(ret !== null){
            this.result = ret;
        }
        else{
            this.result = 0.0;
        }
    };

    function CMODFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CMODFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CMODFunctionNode.prototype.minArgumentsCount = 2;
    CMODFunctionNode.prototype.maxArgumentsCount = 2;
    CMODFunctionNode.prototype._calculate = function (aArgs) {
        this.result = (aArgs[1].result % aArgs[0].result);
    };

    function CNOTFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CNOTFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CNOTFunctionNode.prototype.minArgumentsCount = 1;
    CNOTFunctionNode.prototype.maxArgumentsCount = 1;
    CNOTFunctionNode.prototype._calculate = function (aArgs) {
        this.result = AscFormat.fApproxEqual(aArgs[0].result, 0.0) ? 1 : 0;
    };

    function CORFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CORFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CORFunctionNode.prototype.minArgumentsCount = 2;
    CORFunctionNode.prototype.maxArgumentsCount = 2;
    CORFunctionNode.prototype._calculate = function (aArgs) {
        this.result = (!AscFormat.fApproxEqual(aArgs[1].result, 0.0) || !AscFormat.fApproxEqual(aArgs[0].result, 0.0)) ? 1.0 : 0.0;
    };

    function CPRODUCTFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CPRODUCTFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CPRODUCTFunctionNode.prototype.minArgumentsCount = 2;
    CPRODUCTFunctionNode.prototype.maxArgumentsCount = +Infinity;
    CPRODUCTFunctionNode.prototype.listSupport = function () {
        return true;
    };
    CPRODUCTFunctionNode.prototype._calculate = function (aArgs) {
        if(aArgs.length === 0){
            return 0.0;
        }
        var ret = null;
        for(var i = 0; i < aArgs.length; ++i){
            if(!aArgs[i].error){
                if(!Array.isArray(aArgs[i].result)){
                    if(ret === null){
                        ret = aArgs[i].result;
                    }
                    else{
                        ret *= aArgs[i].result;
                    }
                }
                else{
                    for(var j = 0; j < aArgs[i].result.length; ++j){
                        if(ret === null){
                            ret = aArgs[i].result[j];
                        }
                        else{
                            ret *= aArgs[i].result[j];
                        }
                    }
                }
            }
        }
        if(ret !== null){
            this.result = ret;
        }
        else{
            this.result = 0.0;
        }
    };

    function fRoundNumber(number, precision){
        if (precision == 0) {
            return Math.round(number);
        }
        var sign = 1;
        if (number < 0) {
            sign = -1;
            number = Math.abs(number);
        }
        number = number.toString().split('e');
        number = Math.round(+(number[0] + 'e' + (number[1] ? (+number[1] + precision) : precision)));
        number = number.toString().split('e');
        return (+(number[0] + 'e' + (number[1] ? (+number[1] - precision) : -precision)) * sign);
    }

    function CROUNDFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CROUNDFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CROUNDFunctionNode.prototype.minArgumentsCount = 2;
    CROUNDFunctionNode.prototype.maxArgumentsCount = 2;
    CROUNDFunctionNode.prototype._calculate = function (aArgs) {
        this.result = fRoundNumber(aArgs[1].result, (aArgs[0].result >> 0));
    };

    function CSIGNFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CSIGNFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CSIGNFunctionNode.prototype.minArgumentsCount = 1;
    CSIGNFunctionNode.prototype.maxArgumentsCount = 1;
    CSIGNFunctionNode.prototype._calculate = function (aArgs) {
        if(aArgs[0].result < 0.0){
            this.result = -1.0;
        }
        else if(aArgs[0].result > 0.0){
            this.result = 1.0;
        }
        else{
            this.result = 0.0;
        }
    };

    function CSUMFunctionNode(parseQueue){
        CFunctionNode.call(this, parseQueue);
    }
    CSUMFunctionNode.prototype = Object.create(CFunctionNode.prototype);
    CSUMFunctionNode.prototype.minArgumentsCount = 2;
    CSUMFunctionNode.prototype.maxArgumentsCount = +Infinity;
    CSUMFunctionNode.prototype.listSupport = function () {
        return true;
    };

    CSUMFunctionNode.prototype._calculate = function (aArgs) {
        if(aArgs.length === 0){
            return 0.0;
        }
        var ret = null;
        for(var i = 0; i < aArgs.length; ++i){
            if(!aArgs[i].error){
                if(!Array.isArray(aArgs[i].result)){
                    if(ret === null){
                        ret = aArgs[i].result;
                    }
                    else{
                        ret += aArgs[i].result;
                    }
                }
                else{
                    for(var j = 0; j < aArgs[i].result.length; ++j){
                        if(ret === null){
                            ret = aArgs[i].result[j];
                        }
                        else{
                            ret += aArgs[i].result[j];
                        }
                    }
                }
            }
        }
        if(ret !== null){
            this.result = ret;
        }
        else{
            this.result = 0.0;
        }
    };

    function CParseQueue() {
        this.queue = [];
        this.result = null;
        this.resultS = null;
        this.format = null;
        this.digitSeparator = null;
        this.pos = -1;
        this.formula = null;
        this.ParentContent = null;
        this.Document = null;
    }
    CParseQueue.prototype.add = function(oToken){
        oToken.setParseQueue(this);
        oToken.digitSeparator = this.digitSeparator;
        this.queue.push(oToken);
        this.pos = this.queue.length - 1;
    };
    CParseQueue.prototype.last = function(){
        return this.queue[this.queue.length - 1];
    };
    CParseQueue.prototype.getNext = function(){
        if(this.pos > -1){
            return this.queue[--this.pos];
        }
        return null;
    };

    CParseQueue.prototype.getParentTable = function(){
        var oCell = this.getParentCell();
        if(oCell){
            var oRow = oCell.Row;
            if(oRow){
                return oRow.Table;
            }
        }
        return null;
    };

    CParseQueue.prototype.getParentCell = function(){
        var oCell = this.ParentContent && this.ParentContent.IsTableCellContent(true);
        if(oCell){
            return oCell;
        }
        return null;
    };
    CParseQueue.prototype.setError = function(Type, Data){
        this.error = new CError(Type, Data);
    };
    CParseQueue.prototype.calculate = function(bFormat){
        this.pos = this.queue.length - 1;

        this.error = null;
        this.result = null;
        if(this.pos < 0){
            this.setError(ERROR_TYPE_ERROR, null);
            return this.error;
        }
        var oLastToken = this.queue[this.pos];
        oLastToken.calculate();
        if(bFormat !== false){
            this.resultS = oLastToken.formatResult();
        }
        this.error = oLastToken.error;
        this.result = oLastToken.result;
        return this.error;
    };
    function CError(Type, Data){
        this.Type = AscCommon.translateManager.getValue(Type);
        this.Data = Data;
    }


    var oFuncMap = {};
    oFuncMap['ABS'] = CABSFunctionNode;
    oFuncMap['AND'] = CANDFunctionNode;
    oFuncMap['AVERAGE'] = CAVERAGEFunctionNode;
    oFuncMap['COUNT'] = CCOUNTFunctionNode;
    oFuncMap['DEFINED'] = CDEFINEDFunctionNode;
    oFuncMap['FALSE'] = CFALSEFunctionNode;
    oFuncMap['INT'] = CINTFunctionNode;
    oFuncMap['MAX'] = CMAXFunctionNode;
    oFuncMap['MIN'] = CMINFunctionNode;
    oFuncMap['MOD'] = CMODFunctionNode;
    oFuncMap['NOT'] = CNOTFunctionNode;
    oFuncMap['OR'] = CORFunctionNode;
    oFuncMap['PRODUCT'] = CPRODUCTFunctionNode;
    oFuncMap['ROUND'] = CROUNDFunctionNode;
    oFuncMap['SIGN'] = CSIGNFunctionNode;
    oFuncMap['SUM'] = CSUMFunctionNode;
    oFuncMap['TRUE'] = CTRUEFunctionNode;

    var PARSER_MASK_LEFT_PAREN      = 1;
    var PARSER_MASK_RIGHT_PAREN     = 2;
    var PARSER_MASK_LIST_SEPARATOR  = 4;
    var PARSER_MASK_BINARY_OPERATOR = 8;
    var PARSER_MASK_UNARY_OPERATOR  = 16;
    var PARSER_MASK_NUMBER          = 32;
    var PARSER_MASK_FUNCTION        = 64;
    var PARSER_MASK_CELL_NAME       = 128;
    var PARSER_MASK_CELL_RANGE      = 256;
    var PARSER_MASK_BOOKMARK        = 512;
    var PARSER_MASK_BOOKMARK_CELL_REF = 1024;
    var PARSER_MASK_CLEAN = 2048;

    var ERROR_TYPE_SYNTAX_ERROR = "Syntax Error";
    var ERROR_TYPE_MISSING_OPERATOR = "Missing Operator";
    var ERROR_TYPE_MISSING_ARGUMENT = "Missing Argument";
    var ERROR_TYPE_LARGE_NUMBER = "Number Too Large To Format";
    var ERROR_TYPE_ZERO_DIVIDE = "Zero Divide";
    var ERROR_TYPE_IS_NOT_IN_TABLE = "Is Not In Table";
    var ERROR_TYPE_INDEX_TOO_LARGE = "Index Too Large";
    var ERROR_TYPE_FORMULA_NOT_IN_TABLE = "The Formula Not In Table";
    var ERROR_TYPE_INDEX_ZERO = "Table Index Cannot be Zero";
    var ERROR_TYPE_UNDEFINED_BOOKMARK = "Undefined Bookmark";
    var ERROR_TYPE_UNEXPECTED_END = "Unexpected End of Formula";
    var ERROR_TYPE_ERROR = "ERROR";

    function CFormulaParser(sListSeparator, sDigitSeparator){
        this.listSeparator = sListSeparator;
        this.digitSeparator = sDigitSeparator;

        this.formula = null;
        this.pos = 0;
        this.parseQueue = null;
        this.error = null;
        this.flags = 0;//[unary opearor, binary operator,]
    }

    CFormulaParser.prototype.setFlag = function(nMask, bVal){
        if(bVal){
            this.flags |= nMask;
        }
        else{
            this.flags &= (~nMask);
        }
    };

    CFormulaParser.prototype.checkExpression = function(oRegExp, fCallback){
        oRegExp.lastIndex = this.pos;
        var oRes = oRegExp.exec(this.formula);
        if(oRes && oRes.index === this.pos){
            var ret = fCallback.call(this, this.pos, oRegExp.lastIndex);
            this.pos = oRegExp.lastIndex;
            return ret;
        }
        return null;
    };


    CFormulaParser.prototype.parseNumber = function(nStartPos, nEndPos){
        var sNum = this.formula.slice(nStartPos, nEndPos);
        sNum = sNum.replace(sComma, '');
        var number = parseFloat(sNum);
        if(AscFormat.isRealNumber(number)){
            var ret = new CNumberNode(this.parseQueue);
            ret.value = number;
            return ret;
        }
        return null;
    };


    CFormulaParser.prototype.parseCoord = function(nStartPos, nEndPos, oMap, nBase){
        var nRet = 0;
        var nMultiplicator = 1;
        for(var i = nEndPos - 1; i >= nStartPos; --i){
            nRet += oMap[this.formula[i]]*nMultiplicator;
            nMultiplicator *= nBase;
        }
        return nRet;
    };

    CFormulaParser.prototype.parseCol = function(nStartPos, nEndPos){
        return this.parseCoord(nStartPos, nEndPos, oLettersMap, 26) - 1;
    };

    CFormulaParser.prototype.parseRow = function(nStartPos, nEndPos){
        return this.parseCoord(nStartPos, nEndPos, oDigitMap, 10) - 1;
    };

    CFormulaParser.prototype.parseCellName = function(){
        var c, r;
        c = this.checkExpression(oColumnNameRegExp, this.parseCol);
        if(c === null){
            return null;
        }
        r = this.checkExpression(oRowNameRegExp, this.parseRow);
        if(r === null){
            return null;
        }
        var oRet = new CCellRangeNode(this.parseQueue);
        oRet.c1 = c;
        oRet.r1 = r;
        return oRet;
    };

    CFormulaParser.prototype.parseCellCellRange = function (nStart, nEndPos) {

        var oFirstCell, oSecondCell;
        oFirstCell = this.checkExpression(oCellNameRegExp, this.parseCellName);
        if(oFirstCell === null){
            return null;
        }
        while (this.formula[this.pos] === ' '){
            ++this.pos;
        }
        ++this.pos;
        while (this.formula[this.pos] === ' '){
            ++this.pos;
        }
        oSecondCell = this.checkExpression(oCellNameRegExp, this.parseCellName);
        if(oSecondCell === null){
            return null;
        }
        var r1, r2, c1, c2;
        r1 = Math.min(oFirstCell.r1, oSecondCell.r1);
        r2 = Math.max(oFirstCell.r1, oSecondCell.r1);
        c1 = Math.min(oFirstCell.c1, oSecondCell.c1);
        c2 = Math.max(oFirstCell.c1, oSecondCell.c1);
        oFirstCell.r1 = r1;
        oFirstCell.r2 = r2;
        oFirstCell.c1 = c1;
        oFirstCell.c2 = c2;
        return oFirstCell;
    };

    CFormulaParser.prototype.parseRowRange = function(nStartPos, nEndPos){
        var r1, r2;
        r1 = this.checkExpression(oRowNameRegExp, this.parseRow);
        if(r1 === null){
            return null;
        }
        while (this.formula[this.pos] === ' '){
            ++this.pos;
        }
        ++this.pos;
        while (this.formula[this.pos] === ' '){
            ++this.pos;
        }
        r2 = this.checkExpression(oRowNameRegExp, this.parseRow);
        if(r2 === null){
            return null;
        }
        var oRet = new CCellRangeNode(this.parseQueue);
        oRet.r1 = Math.min(r1, r2);
        oRet.r2 = Math.max(r1, r2);
        return oRet;
    };

    CFormulaParser.prototype.parseColRange = function(nStartPos, nEndPos){
        var c1, c2;
        c1 = this.checkExpression(oColumnNameRegExp, this.parseCol);
        if(c1 === null){
            return null;
        }
        while (this.formula[this.pos] === ' '){
            ++this.pos;
        }
        ++this.pos;
        while (this.formula[this.pos] === ' '){
            ++this.pos;
        }
        c2 = this.checkExpression(oColumnNameRegExp, this.parseCol);
        if(c2 === null){
            return null;
        }
        var oRet = new CCellRangeNode(this.parseQueue);
        oRet.c1 = Math.min(c1, c2);
        oRet.c2 = Math.max(c1, c2);
        return oRet;
    };

    CFormulaParser.prototype.parseCellRange = function (nStartPos, nEndPos) {
        var oRet;
        oRet = this.checkExpression(oCellCellRangeRegExp, this.parseCellCellRange);
        if(oRet){
            return oRet;
        }
        oRet = this.checkExpression(oRowRangeRegExp, this.parseRowRange);
        if(oRet){
            return oRet;
        }
        oRet = this.checkExpression(oColRangeRegExp, this.parseColRange);
        if(oRet){
            return oRet;
        }
        return null;
    };

    CFormulaParser.prototype.parseCellRef = function(nStartPos, nEndPos){
        var oRet;
        oRet = this.checkExpression(oCellRangeRegExp, this.parseCellRange);
        if(oRet){
            return oRet;
        }
        oRet = this.checkExpression(oCellNameRegExp, this.parseCellName);
        if(oRet){
            return oRet;
        }
        return null;
    };

    CFormulaParser.prototype.parseBookmark = function (nStartPos, nEndPos) {
        var oRet = new CCellRangeNode(this.parseQueue);
        oRet.bookmarkName = this.formula.slice(nStartPos, nEndPos);
        return oRet;
    };

    CFormulaParser.prototype.parseBookmarkCellRef = function(nStartPos, nEndPos){

        var oResult = this.checkExpression(oBookmarkNameRegExp, this.parseBookmark);
        if(oResult === null){
            return null;
        }
        if(this.pos < nEndPos){
            while(this.formula[this.pos] === ' '){
                ++this.pos;
            }
            var oRes = this.checkExpression(oCellReferenceRegExp, this.parseCellRef);
            if(oRes){
                oRes.bookmarkName = oResult.bookmarkName;
                return oRes;
            }
        }
        return oResult;
    };


    CFormulaParser.prototype.parseOperator = function(nStartPos, nEndPos){
        var sOperator = this.formula.slice(nStartPos, nEndPos);
        if(sOperator === '-'){
            if(this.flags & PARSER_MASK_UNARY_OPERATOR){
                return new CUnaryMinusOperatorNode(this.parseQueue);
            }
            return new CSubtractionOperatorNode(this.parseQueue);
        }
        if(oOperatorsMap[sOperator]){
            return new oOperatorsMap[sOperator]();
        }
        return null;
    };

    CFormulaParser.prototype.parseFunction = function(nStartPos, nEndPos){
        var sFunction = this.formula.slice(nStartPos, nEndPos).toUpperCase();
        if(oFuncMap[sFunction]){
            return new oFuncMap[sFunction]();
        }
        return null;
    };

    CFormulaParser.prototype.parseCurrent = function () {
        //TODO: R1C1
        while(this.formula[this.pos] === ' '){
            ++this.pos;
        }
        if(this.pos >= this.formula.length){
            return null;
        }
        //check parentheses
        if(this.formula[this.pos] === '('){
            ++this.pos;
            return new CLeftParenOperatorNode(this.parseQueue);
        }
        if(this.formula[this.pos] === ')'){
            ++this.pos;
            return new CRightParenOperatorNode(this.parseQueue);
        }
        if(this.formula[this.pos] === this.listSeparator){
            ++this.pos;
            return new CListSeparatorNode(this.parseQueue);
        }
        var oRet;
        //check operators
        oRet = this.checkExpression(oOperatorRegExp, this.parseOperator);
        if(oRet){
            return oRet;
        }
        //check function
        oRet = this.checkExpression(oFunctionsRegExp, this.parseFunction);
        if(oRet){
            return oRet;
        }
        //directions
        if(this.formula.indexOf('LEFT', this.pos) === this.pos){
            this.pos += 'LEFT'.length;
            oRet = new CCellRangeNode(this.parseQueue);
            oRet.dir = LEFT;
            return oRet;
        }
        if(this.formula.indexOf('ABOVE', this.pos) === this.pos){
            this.pos += 'ABOVE'.length;
            oRet = new CCellRangeNode(this.parseQueue);
            oRet.dir = ABOVE;
            return oRet;
        }
        if(this.formula.indexOf('BELOW', this.pos) === this.pos){
            this.pos += 'BELOW'.length;
            oRet = new CCellRangeNode(this.parseQueue);
            oRet.dir = BELOW;
            return oRet;
        }
        if(this.formula.indexOf('RIGHT', this.pos) === this.pos){
            this.pos += 'RIGHT'.length;
            oRet = new CCellRangeNode(this.parseQueue);
            oRet.dir = RIGHT;
            return oRet;
        }
        //check cell reference
        var oRes = this.checkExpression(oCellReferenceRegExp, this.parseCellRef);
        if(oRes){
            return oRes;
        }
        //check number
        oRet = this.checkExpression(oConstantRegExp, this.parseNumber);
        if(oRet){
            return oRet;
        }
        //check bookmark
        oRet = this.checkExpression(oBookmarkCellRefRegExp, this.parseBookmarkCellRef);
        if(oRet){
            return oRet;
        }
        return null;
    };

    CFormulaParser.prototype.setError = function(Type, Data){
        this.parseQueue = null;
        this.error = new CError(Type, Data);
    };

    CFormulaParser.prototype.getErrorString = function(startPos, endPos){
        var nStartPos = startPos;
        while (nStartPos < this.formula.length){
            if(this.formula[nStartPos] === ' '){
                nStartPos++;
            }
            else{
                break;
            }
        }
        if(nStartPos < endPos){
            return this.formula.slice(nStartPos, endPos);
        }
        return "";
    };

    CFormulaParser.prototype.checkSingularToken = function(oToken){
        if(oToken instanceof CNumberNode || oToken instanceof CCellRangeNode
            || oToken instanceof CRightParenOperatorNode || oToken instanceof CFALSEFunctionNode
            || oToken instanceof CTRUEFunctionNode || oToken instanceof CPercentageOperatorNode){
            return true;
        }
        return false;
    };

    CFormulaParser.prototype.parse = function(sFormula, oParentContent){
        if(typeof sFormula !== "string"){
            this.setError(ERROR_TYPE_ERROR, null);
            return;
        }
        this.pos = 0;
        this.formula = sFormula.toUpperCase();
        this.parseQueue = null;
        this.error = null;


        this.parseQueue = new CParseQueue();
        this.parseQueue.formula = this.formula;
        this.parseQueue.digitSeparator = this.digitSeparator;
        this.parseQueue.ParentContent = oParentContent;
        this.parseQueue.document = editor.WordControl.m_oLogicDocument;
        var oCurToken;
        var aStack = [];
        var aFunctionsStack = [];
        var oLastToken = null;
        var oLastFunction = null;
        var oToken;
        this.setFlag(PARSER_MASK_LEFT_PAREN, true);
        this.setFlag(PARSER_MASK_RIGHT_PAREN, false);
        this.setFlag(PARSER_MASK_LIST_SEPARATOR, false);
        this.setFlag(PARSER_MASK_BINARY_OPERATOR, false);
        this.setFlag(PARSER_MASK_UNARY_OPERATOR, true);
        this.setFlag(PARSER_MASK_NUMBER, true);
        this.setFlag(PARSER_MASK_FUNCTION, true);
        this.setFlag(PARSER_MASK_CELL_NAME, true);
        this.setFlag(PARSER_MASK_CELL_RANGE, false);
        this.setFlag(PARSER_MASK_BOOKMARK, true);
        this.setFlag(PARSER_MASK_BOOKMARK_CELL_REF, false);
        var nStartPos = this.pos;
        if(sFormula === ''){
            this.setFlag(PARSER_MASK_CLEAN, false);
        }
        while (oCurToken = this.parseCurrent()){
            if(oCurToken instanceof CNumberNode || oCurToken instanceof CFALSEFunctionNode || oCurToken instanceof CTRUEFunctionNode){
                if(this.checkSingularToken(oLastToken)){
                    if(oCurToken instanceof CNumberNode && oLastToken instanceof CNumberNode){
                        this.setError(ERROR_TYPE_MISSING_OPERATOR, null);
                    }
                    else{
                        this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                    }
                    return;
                }
                if(this.flags & PARSER_MASK_NUMBER){
                    this.parseQueue.add(oCurToken);
                    oCurToken.calculate();
                    if(oCurToken.error){
                        this.error = oCurToken.error;
                        return;
                    }
                    this.setFlag(PARSER_MASK_NUMBER, true);
                    this.setFlag(PARSER_MASK_UNARY_OPERATOR, false);
                    this.setFlag(PARSER_MASK_LEFT_PAREN, false);
                    this.setFlag(PARSER_MASK_RIGHT_PAREN, true);
                    this.setFlag(PARSER_MASK_BINARY_OPERATOR, true);
                    this.setFlag(PARSER_MASK_FUNCTION, false);
                    this.setFlag(PARSER_MASK_LIST_SEPARATOR, aFunctionsStack.length > 0);
                    this.setFlag(PARSER_MASK_CELL_NAME, false);
                    this.setFlag(PARSER_MASK_CELL_RANGE, false);
                    this.setFlag(PARSER_MASK_BOOKMARK, true);
                    this.setFlag(PARSER_MASK_BOOKMARK_CELL_REF, false);
                }
                else{
                    this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                    return;
                }
            }
            else if(oCurToken instanceof CCellRangeNode){
                if((oCurToken.isDir() || oCurToken.isCellRange()) && !(this.flags & PARSER_MASK_CELL_RANGE)){
                    this.setError(ERROR_TYPE_SYNTAX_ERROR, ':');
                    return;
                }
                if(oCurToken.isBookmarkCellRange() && !(this.flags & PARSER_MASK_BOOKMARK_CELL_REF)){
                    this.setError(ERROR_TYPE_SYNTAX_ERROR, ':');
                    return;
                }

                if((oCurToken.isCell() || oCurToken.isBookmark()) && this.checkSingularToken(oLastToken)){
                    if(oLastToken instanceof CPercentageOperatorNode){
                        this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                    }
                    else{
                        this.setError(ERROR_TYPE_MISSING_OPERATOR, null);
                    }
                    return;
                }
                this.parseQueue.add(oCurToken);

                if(aFunctionsStack.length === 0){
                    oCurToken.calculate();

                    if(oCurToken.error){
                        this.error = oCurToken.error;
                        return;
                    }
                }
                else{
                    // var oFunction = aFunctionsStack[aFunctionsStack.length - 1];
                    // if(oCurToken.isCell() && !oFunction.listSupport()){
                    //     oCurToken.calculate();
                    //     if(oCurToken.error){
                    //         this.error = oCurToken.error;
                    //         return;
                    //     }
                    // }
                }
                this.setFlag(PARSER_MASK_NUMBER, true);
                this.setFlag(PARSER_MASK_UNARY_OPERATOR, false);
                this.setFlag(PARSER_MASK_LEFT_PAREN, false);
                this.setFlag(PARSER_MASK_RIGHT_PAREN, true);
                this.setFlag(PARSER_MASK_BINARY_OPERATOR, oCurToken.isCell() || oCurToken.isBookmark());
                this.setFlag(PARSER_MASK_FUNCTION, false);
                this.setFlag(PARSER_MASK_LIST_SEPARATOR, aFunctionsStack.length > 0);
                this.setFlag(PARSER_MASK_CELL_NAME, false);
                this.setFlag(PARSER_MASK_CELL_RANGE, false);
                this.setFlag(PARSER_MASK_BOOKMARK, false);
                this.setFlag(PARSER_MASK_BOOKMARK_CELL_REF, false);
            }
            else if(oCurToken.isFunction()){
                if(this.flags & PARSER_MASK_FUNCTION){
                    aStack.push(oCurToken);
                    this.setFlag(PARSER_MASK_RIGHT_PAREN, false);
                    if(oCurToken.maxArgumentsCount < 1){
                        this.setFlag(PARSER_MASK_LEFT_PAREN, false);
                    }
                    else{
                        this.setFlag(PARSER_MASK_LEFT_PAREN, true);
                        this.setFlag(PARSER_MASK_RIGHT_PAREN, false);
                        this.setFlag(PARSER_MASK_LIST_SEPARATOR, false);
                        this.setFlag(PARSER_MASK_BINARY_OPERATOR, false);
                        this.setFlag(PARSER_MASK_UNARY_OPERATOR, false);
                        this.setFlag(PARSER_MASK_NUMBER, false);
                        this.setFlag(PARSER_MASK_FUNCTION, false);
                        this.setFlag(PARSER_MASK_CELL_NAME, false);
                        this.setFlag(PARSER_MASK_CELL_RANGE, false);
                        this.setFlag(PARSER_MASK_BOOKMARK, false);
                        this.setFlag(PARSER_MASK_BOOKMARK_CELL_REF, false);
                    }
                }
                else{
                    this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                    return;
                }
            }
            else if(oCurToken instanceof CListSeparatorNode){
                if(!(this.flags & PARSER_MASK_LIST_SEPARATOR)){
                    this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                    return;
                }
                else{
                    if(aFunctionsStack.length > 0){

                        while(aStack.length > 0 && !(aStack[aStack.length-1] instanceof CLeftParenOperatorNode)){
                            oToken = aStack.pop();

                            this.parseQueue.add(oToken);
                            oToken.calculate();
                            if(oToken.error){
                                this.error = oToken.error;
                                return;
                            }
                        }
                        if(aStack.length === 0){
                            this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                            return;
                        }
                        aFunctionsStack[aFunctionsStack.length-1].operands.push(this.parseQueue.last());
                        if(aFunctionsStack[aFunctionsStack.length-1].operands.length >= aFunctionsStack[aFunctionsStack.length-1].maxArgumentsCount){
                            this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                            return;
                        }
                    }
                    else{
                        this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                        return;
                    }

                    this.setFlag(PARSER_MASK_LEFT_PAREN, true);
                    this.setFlag(PARSER_MASK_RIGHT_PAREN, false);
                    this.setFlag(PARSER_MASK_LIST_SEPARATOR, false);
                    this.setFlag(PARSER_MASK_BINARY_OPERATOR, false);
                    this.setFlag(PARSER_MASK_UNARY_OPERATOR, true);
                    this.setFlag(PARSER_MASK_NUMBER, true);
                    this.setFlag(PARSER_MASK_FUNCTION, true);
                    this.setFlag(PARSER_MASK_CELL_NAME, true);
                    this.setFlag(PARSER_MASK_CELL_RANGE, aFunctionsStack.length > 0 && aFunctionsStack[aFunctionsStack.length-1].listSupport());
                    this.setFlag(PARSER_MASK_BOOKMARK, true);
                    this.setFlag(PARSER_MASK_BOOKMARK_CELL_REF, aFunctionsStack.length > 0 && aFunctionsStack[aFunctionsStack.length-1].listSupport());
                }
            }
            else if(oCurToken instanceof CLeftParenOperatorNode){
                if(this.flags && PARSER_MASK_LEFT_PAREN){
                    if(oLastToken && oLastToken.isFunction(oLastToken)){
                        aFunctionsStack.push(oLastToken);
                    }
                    this.setFlag(PARSER_MASK_LEFT_PAREN, true);
                    this.setFlag(PARSER_MASK_RIGHT_PAREN, true);
                    this.setFlag(PARSER_MASK_LIST_SEPARATOR, false);
                    this.setFlag(PARSER_MASK_BINARY_OPERATOR, false);
                    this.setFlag(PARSER_MASK_UNARY_OPERATOR, true);
                    this.setFlag(PARSER_MASK_NUMBER, true);
                    this.setFlag(PARSER_MASK_FUNCTION, true);
                    this.setFlag(PARSER_MASK_CELL_NAME, true);
                    this.setFlag(PARSER_MASK_CELL_RANGE, aFunctionsStack.length > 0 && aFunctionsStack[aFunctionsStack.length-1].listSupport());
                    this.setFlag(PARSER_MASK_BOOKMARK, false);
                    this.setFlag(PARSER_MASK_BOOKMARK_CELL_REF, aFunctionsStack.length > 0 && aFunctionsStack[aFunctionsStack.length-1].listSupport());
                }
                else{
                    this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                    return;
                }
                aStack.push(oCurToken);
            }
            else if(oCurToken instanceof CRightParenOperatorNode){
                while(aStack.length > 0 && !(aStack[aStack.length-1] instanceof CLeftParenOperatorNode)){
                    oToken = aStack.pop();
                    this.parseQueue.add(oToken);
                    oToken.calculate();
                    if(oToken.error){
                        this.error = oToken.error;
                        return;
                    }
                }

                if(aStack.length === 0){
                    this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                    return;
                }
                aStack.pop();//remove left paren
                if(aStack[aStack.length-1] && aStack[aStack.length-1].isFunction()){
                    aFunctionsStack.pop();
                    aStack[aStack.length-1].operands.push(this.parseQueue.last());
                    oLastFunction = aStack[aStack.length-1];
                    if(oLastFunction.operands.length > oLastFunction.maxArgumentsCount){
                        this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                        return;
                    }
                    if(oLastFunction.operands.length < oLastFunction.minArgumentsCount){
                        if(!oLastFunction.listSupport()){
                            this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                            return;
                        }
                        else{
                            for(var i = 0; i < oLastFunction.operands.length; ++i){
                                if(oLastFunction.operands[i] instanceof CCellRangeNode){
                                    if(oLastFunction.operands[i].isCellRange() || oLastFunction.operands[i].isBookmarkCellRange() || oLastFunction.operands[i].isDir()){
                                        break;
                                    }
                                }
                            }
                            if(i === oLastFunction.operands.length){
                                this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                                return;
                            }
                        }
                    }
                    oLastFunction.argumentsCount = oLastFunction.operands.length;
                    oToken = aStack.pop();
                    this.parseQueue.add(oToken);
                    oToken.calculate();
                    if(oToken.error){
                        this.error = oToken.error;
                        return;
                    }
                }
                this.setFlag(PARSER_MASK_NUMBER, true);
                this.setFlag(PARSER_MASK_UNARY_OPERATOR, false);
                this.setFlag(PARSER_MASK_LEFT_PAREN, false);
                this.setFlag(PARSER_MASK_RIGHT_PAREN, true);
                this.setFlag(PARSER_MASK_BINARY_OPERATOR, true);
                this.setFlag(PARSER_MASK_FUNCTION, false);
                this.setFlag(PARSER_MASK_LIST_SEPARATOR, aFunctionsStack.length > 0);
                this.setFlag(PARSER_MASK_CELL_NAME, false);
                this.setFlag(PARSER_MASK_CELL_RANGE, false);
                this.setFlag(PARSER_MASK_BOOKMARK, false);
                this.setFlag(PARSER_MASK_BOOKMARK_CELL_REF, false);
            }
            else if(oCurToken.isOperator()){
                if(oCurToken instanceof CUnaryMinusOperatorNode){
                    if(!(this.flags & PARSER_MASK_UNARY_OPERATOR)){
                        this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                        return;
                    }
                    this.setFlag(PARSER_MASK_UNARY_OPERATOR, false);
                }
                else{
                    if(!(this.flags & PARSER_MASK_BINARY_OPERATOR)){
                        this.setError(ERROR_TYPE_SYNTAX_ERROR, this.getErrorString(nStartPos, this.pos));
                        return;
                    }

                    this.setFlag(PARSER_MASK_UNARY_OPERATOR, true);
                }
                while(aStack.length > 0 && (!(aStack[aStack.length-1] instanceof CLeftParenOperatorNode) && aStack[aStack.length-1].precedence >= oCurToken.precedence)){
                    oToken = aStack.pop();
                    this.parseQueue.add(oToken);
                    oToken.calculate();
                    if(oToken.error){
                        this.error = oToken.error;
                        return;
                    }
                }
                if(oCurToken instanceof CPercentageOperatorNode){
                    this.parseQueue.add(oCurToken);
                    oCurToken.calculate();
                    if(oCurToken.error){
                        this.error = oCurToken.error;
                        return;
                    }
                    this.setFlag(PARSER_MASK_NUMBER, true);
                    this.setFlag(PARSER_MASK_UNARY_OPERATOR, false);
                    this.setFlag(PARSER_MASK_LEFT_PAREN, false);
                    this.setFlag(PARSER_MASK_RIGHT_PAREN, true);
                    this.setFlag(PARSER_MASK_BINARY_OPERATOR, true);
                    this.setFlag(PARSER_MASK_FUNCTION, false);
                    this.setFlag(PARSER_MASK_LIST_SEPARATOR, aFunctionsStack.length > 0);
                    this.setFlag(PARSER_MASK_CELL_NAME, false);
                    this.setFlag(PARSER_MASK_CELL_RANGE, false);
                    this.setFlag(PARSER_MASK_BOOKMARK, true);
                    this.setFlag(PARSER_MASK_BOOKMARK_CELL_REF, false);
                }
                else{
                    this.setFlag(PARSER_MASK_NUMBER, true);
                    this.setFlag(PARSER_MASK_LEFT_PAREN, true);
                    this.setFlag(PARSER_MASK_RIGHT_PAREN, false);
                    this.setFlag(PARSER_MASK_BINARY_OPERATOR, false);
                    this.setFlag(PARSER_MASK_FUNCTION, true);
                    this.setFlag(PARSER_MASK_LIST_SEPARATOR, false);
                    this.setFlag(PARSER_MASK_CELL_NAME, true);
                    this.setFlag(PARSER_MASK_CELL_RANGE, false);
                    this.setFlag(PARSER_MASK_BOOKMARK, true);
                    this.setFlag(PARSER_MASK_BOOKMARK_CELL_REF, false);
                    aStack.push(oCurToken);
                }
            }
            if(!(oCurToken instanceof CLineSeparatorOperatorNode)){
                oLastToken = oCurToken;
            }
            nStartPos = this.pos;
        }
        if(this.pos < this.formula.length){
            this.setFlag(PARSER_MASK_CLEAN, false);
            this.error = new CError(ERROR_TYPE_SYNTAX_ERROR, this.formula[this.pos]);
            return;
        }
        while (aStack.length > 0){
            oCurToken = aStack.pop();
            if(oCurToken instanceof CLeftParenOperatorNode){
                this.setError(ERROR_TYPE_UNEXPECTED_END, null);
                return;
            } else
            if(oCurToken instanceof CRightParenOperatorNode){
                this.setError(ERROR_TYPE_SYNTAX_ERROR, '');
                return;
            }
            this.parseQueue.add(oCurToken);
            oCurToken.calculate();
            if(oCurToken.error){
                this.error = oCurToken.error;
                return;
            }
        }
    };
    window['AscCommonWord'] = window['AscCommonWord'] || {};
    window['AscCommonWord'].CFormulaParser = CFormulaParser;


    function CTextParser(sListSeparator, sDigitSeparator){
        CFormulaParser.call(this, sListSeparator, sDigitSeparator);//TODO: take list separator and digits separator from settings
        this.clean =  true;
    }
    CTextParser.prototype = Object.create(CFormulaParser.prototype);
    CTextParser.prototype.checkSingularToken = function(oToken){
        return false;
    };

    CTextParser.prototype.parseCurrent = function () {
        while(this.formula[this.pos] === ' '){
            ++this.pos;
            this.setFlag(PARSER_MASK_CLEAN, false);
        }
        if(this.pos >= this.formula.length){
            return null;
        }
        //check parentheses
        if(this.formula[this.pos] === '('){
            ++this.pos;
            this.setFlag(PARSER_MASK_CLEAN, false);
            return new CLeftParenOperatorNode(this.parseQueue);
        }
        if(this.formula[this.pos] === ')'){
            ++this.pos;
            this.setFlag(PARSER_MASK_CLEAN, false);
            return new CRightParenOperatorNode(this.parseQueue);
        }
        if(this.formula[this.pos] === '\n' || this.formula[this.pos] === '\t' || this.formula[this.pos] === '\r'){
            ++this.pos;
            this.setFlag(PARSER_MASK_CLEAN, false);
            return new CLineSeparatorOperatorNode(this.parseQueue);
        }
        var oRet;
        //check operators
        oRet = this.checkExpression(oOperatorRegExp, this.parseOperator);
        if(oRet){
            if(!(oRet instanceof CUnaryMinusOperatorNode)){
                this.setFlag(PARSER_MASK_CLEAN, false);
            }
            return oRet;
        }

        //check bookmark
        oRet = this.checkExpression(oBookmarkCellRefRegExp, this.parseBookmarkCellRef);
        if(oRet){
            this.setFlag(PARSER_MASK_CLEAN, false);
            return new CLineSeparatorOperatorNode(this.parseQueue);
        }

        //check number
        oRet = this.checkExpression(oConstantRegExp, this.parseNumber);
        var oRes;
        if(oRet){
            return oRet;
        }
        return null;
    };
})();
//window['AscCommonWord'].createExpression();
