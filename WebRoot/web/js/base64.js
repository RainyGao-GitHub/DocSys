/**
 * Created by SLICE_30_K on 2017/5/22.
 *
 * 支持一般Base64的编码和解码
 * 支持符合RFC_4648标准中"URL and Filename Safe Alphabet"的URL安全Base64编解码
 * 支持中文字符的编解码(Unicode编码)
 */
var Base64 = (function () {
    var BASE64_MAPPING = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
        'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
        'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
        'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
        'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
        'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
        'w', 'x', 'y', 'z', '0', '1', '2', '3',
        '4', '5', '6', '7', '8', '9', '+', '/'
    ];
    var URLSAFE_BASE64_MAPPING = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
        'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
        'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
        'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
        'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
        'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
        'w', 'x', 'y', 'z', '0', '1', '2', '3',
        '4', '5', '6', '7', '8', '9', '-', '_'
    ];

    var _toBinary = function (ascii) {
        var binary = [];
        while (ascii > 0) {
            var b = ascii % 2;
            ascii = Math.floor(ascii / 2);
            binary.push(b);
        }
        binary.reverse();
        return binary;
    };

    var _toDecimal = function (binary) {
        var dec = 0;
        var p = 0;
        for (var i = binary.length - 1; i >= 0; --i) {
            var b = binary[i];
            if (b == 1) {
                dec += Math.pow(2, p);
            }
            ++p;
        }
        return dec;
    };

    var _toUTF8Binary = function (c, binaryArray) {
        var mustLen = (8 - (c + 1)) + ((c - 1) * 6);
        var fatLen = binaryArray.length;
        var diff = mustLen - fatLen;
        while (--diff >= 0) {
            binaryArray.unshift(0);
        }
        var binary = [];
        var _c = c;
        while (--_c >= 0) {
            binary.push(1);
        }
        binary.push(0);
        var i = 0, len = 8 - (c + 1);
        for (; i < len; ++i) {
            binary.push(binaryArray[i]);
        }

        for (var j = 0; j < c - 1; ++j) {
            binary.push(1);
            binary.push(0);
            var sum = 6;
            while (--sum >= 0) {
                binary.push(binaryArray[i++]);
            }
        }
        return binary;
    };

    var _toBinaryArray = function (str) {
        var binaryArray = [];
        for (var i = 0, len = str.length; i < len; ++i) {
            var unicode = str.charCodeAt(i);
            var _tmpBinary = _toBinary(unicode);
            if (unicode < 0x80) {
                var _tmpdiff = 8 - _tmpBinary.length;
                while (--_tmpdiff >= 0) {
                    _tmpBinary.unshift(0);
                }
                binaryArray = binaryArray.concat(_tmpBinary);
            } else if (unicode >= 0x80 && unicode <= 0x7FF) {
                binaryArray = binaryArray.concat(_toUTF8Binary(2, _tmpBinary));
            } else if (unicode >= 0x800 && unicode <= 0xFFFF) {//UTF-8 3byte
                binaryArray = binaryArray.concat(_toUTF8Binary(3, _tmpBinary));
            } else if (unicode >= 0x10000 && unicode <= 0x1FFFFF) {//UTF-8 4byte
                binaryArray = binaryArray.concat(_toUTF8Binary(4, _tmpBinary));
            } else if (unicode >= 0x200000 && unicode <= 0x3FFFFFF) {//UTF-8 5byte
                binaryArray = binaryArray.concat(_toUTF8Binary(5, _tmpBinary));
            } else if (unicode >= 4000000 && unicode <= 0x7FFFFFFF) {//UTF-8 6byte
                binaryArray = binaryArray.concat(_toUTF8Binary(6, _tmpBinary));
            }
        }
        return binaryArray;
    };

    var _toUnicodeStr = function (binaryArray) {
        var unicode;
        var unicodeBinary = [];
        var str = "";
        for (var i = 0, len = binaryArray.length; i < len;) {
            if (binaryArray[i] == 0) {
                unicode = _toDecimal(binaryArray.slice(i, i + 8));
                str += String.fromCharCode(unicode);
                i += 8;
            } else {
                var sum = 0;
                while (i < len) {
                    if (binaryArray[i] == 1) {
                        ++sum;
                    } else {
                        break;
                    }
                    ++i;
                }
                unicodeBinary = unicodeBinary.concat(binaryArray.slice(i + 1, i + 8 - sum));
                i += 8 - sum;
                while (sum > 1) {
                    unicodeBinary = unicodeBinary.concat(binaryArray.slice(i + 2, i + 8));
                    i += 8;
                    --sum;
                }
                unicode = _toDecimal(unicodeBinary);
                str += String.fromCharCode(unicode);
                unicodeBinary = [];
            }
        }
        return str;
    };

    var _encode = function (str, url_safe) {
        var base64_Index = [];
        var binaryArray = _toBinaryArray(str);
        var dictionary = url_safe ? URLSAFE_BASE64_MAPPING : BASE64_MAPPING;

        var extra_Zero_Count = 0;
        for (var i = 0, len = binaryArray.length; i < len; i += 6) {
            var diff = (i + 6) - len;
            if (diff == 2) {
                extra_Zero_Count = 2;
            } else if (diff == 4) {
                extra_Zero_Count = 4;
            }
            var _tmpExtra_Zero_Count = extra_Zero_Count;
            while (--_tmpExtra_Zero_Count >= 0) {
                binaryArray.push(0);
            }
            base64_Index.push(_toDecimal(binaryArray.slice(i, i + 6)));
        }

        var base64 = '';
        for (var i = 0, len = base64_Index.length; i < len; ++i) {
            base64 += dictionary[base64_Index[i]];
        }

        for (var i = 0, len = extra_Zero_Count / 2; i < len; ++i) {
            base64 += '=';
        }
        return base64;
    };

    var _decode = function (_base64Str, url_safe) {
        var _len = _base64Str.length;
        var extra_Zero_Count = 0;
        var dictionary = url_safe ? URLSAFE_BASE64_MAPPING : BASE64_MAPPING;

        if (_base64Str.charAt(_len - 1) == '=') {
            if (_base64Str.charAt(_len - 2) == '=') {//两个等号说明补了4个0
                extra_Zero_Count = 4;
                _base64Str = _base64Str.substring(0, _len - 2);
            } else {//一个等号说明补了2个0
                extra_Zero_Count = 2;
                _base64Str = _base64Str.substring(0, _len - 1);
            }
        }

        var binaryArray = [];
        for (var i = 0, len = _base64Str.length; i < len; ++i) {
            var c = _base64Str.charAt(i);
            for (var j = 0, size = dictionary.length; j < size; ++j) {
                if (c == dictionary[j]) {
                    var _tmp = _toBinary(j);
                    /*不足6位的补0*/
                    var _tmpLen = _tmp.length;
                    if (6 - _tmpLen > 0) {
                        for (var k = 6 - _tmpLen; k > 0; --k) {
                            _tmp.unshift(0);
                        }
                    }
                    binaryArray = binaryArray.concat(_tmp);
                    break;
                }
            }
        }
        if (extra_Zero_Count > 0) {
            binaryArray = binaryArray.slice(0, binaryArray.length - extra_Zero_Count);
        }
        var str = _toUnicodeStr(binaryArray);
        return str;
    };

	//开放给外部的调用接口
    return {
        encode: function (str) {
            return _encode(str, false);
        },
        decode: function (base64Str) {
            return _decode(base64Str, false);
        },
        urlsafe_encode: function (str) {
            return _encode(str, true);
        },
        urlsafe_decode: function (base64Str) {
            return _decode(base64Str, true);
        }
    };
})();

function base64_encode(str)
{
	if(str)
	{
		return Base64.encode(str);
	}
	return "";
}

function base64_decode(str)
{
	if(str)
	{
		return Base64.decode(str);
	}
	return "";
}

function base64_urlsafe_encode(str)
{
	if(str)
	{
		return Base64.urlsafe_encode(str);
	}
	return "";
}

function base64_urlsafe_decode(str)
{
	if(str)
	{
		return Base64.urlsafe_decode(str);
	}
	return "";
}