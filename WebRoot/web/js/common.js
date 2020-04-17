/*这里定义了通用的函数接口（与业务、页面无依赖）*/

//从 url 中获取参数
function getQueryString(name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}

//根据参数列表构造Url请求
function makeUrl(params) {
    var href = window.location.href;
    var i = href.indexOf("?");
    if ( i< 0 ){
        i = href.length;
    }

    href = href.substring(0,i);

    var str = ""
    for( k in params ){
        if ( params[k]){ //params[k]
          str += "&" + k + "=" + params[k];
        }
    }

    return href + "?" + str.substr(1);
}

//从url中获取第一个参数
function getParam(){
    var url = location.search; // 获取url中"?"符后的字串
    if (url.indexOf("?") != -1) { // 判断是否有参数
        var str = url.substr(1); // 从第一个字符开始 因为第0个是?号 获取所有除问号的所有符串
        var strs = str.split("="); // 用等号进行分隔 （因为知道只有一个参数 所以直接用等号进分隔 如果有多个参数 要用&号分隔
        return strs[1]; // 返回第一个参数值
    }

}

//从url中获取参数列表
var getUrlParams = function() {
    "use strict";
    var url = location.search;
    var params = {};
    var strs;
    var _strs;
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        if (str.indexOf("&") != -1) {
            strs = str.split("&");
            for ( var i = 0; i < strs.length; i++) {
                _strs = strs[i].split("=");
                params[_strs[0]] = _strs[1];
            }
        } else {
            strs = str.split("=");
            params[strs[0]] = strs[1];
        }
    }
    return params;
}


//动态修改url参数值
function setUrlParam(para_name, para_value) {
    var strNewUrl = new String();
    var strUrl = new String();
    var url = new String();
    url= window.location.href;
    strUrl = window.location.href;

    if (strUrl.indexOf("?") != -1) {
        strUrl = strUrl.substr(strUrl.indexOf("?") + 1);

        if (strUrl.toLowerCase().indexOf(para_name.toLowerCase()) == -1) {
            strNewUrl = url + "&" + para_name + "=" + para_value;
            window.location = strNewUrl;
            //return strNewUrl;
        } else {
            var aParam = strUrl.split("&");
         
            for (var i = 0; i < aParam.length; i++) {
                if (aParam[i].substr(0, aParam[i].indexOf("=")).toLowerCase() == para_name.toLowerCase()) {
                    aParam[i] = aParam[i].substr(0, aParam[i].indexOf("=")) + "=" + para_value;
                }
            }
            strNewUrl = url.substr(0, url.indexOf("?") + 1) + aParam.join("&");
            
            window.location = strNewUrl;
            //return strNewUrl;
        }
    } else {
        strUrl += "?" + para_name + "=" + para_value;
       
        window.location=strUrl;
    }
}

//获取日期字符串
function getDate(tm){
    var tt = new Date(tm).toLocaleString();
    return tt;
}

//json obj compare
function isObj(object) {
    return object && typeof(object) == 'object' && Object.prototype.toString.call(object).toLowerCase() == "[object object]";
}

function isArray(object) {
    return object && typeof(object) == 'object' && object.constructor == Array;
}

function getLength(object) {
    var count = 0;
    for(var i in object) count++;
    return count;
}

function Compare(objA, objB) {
    if(!isObj(objA) || !isObj(objB)) 
    {
    	console.log("类型不符");
    	return false; //判断类型是否正确
    }
    if(getLength(objA) != getLength(objB)) 
    {
    	console.log("长度不符");
    	return false; //判断长度是否一致
    }
    return CompareObj(objA, objB, true); //默认为true
}

function CompareObj(objA, objB, flag) {
    for(var key in objA) {
        if(!flag) //跳出整个循环
            break;
        if(!objB.hasOwnProperty(key)) {
            flag = false;
            break;
        }
        if(!isArray(objA[key])) { //子级不是数组时,比较属性值
            if(objB[key] != objA[key]) {
                flag = false;
                break;
            }
        } else {
            if(!isArray(objB[key])) {
                flag = false;
                break;
            }
            var oA = objA[key],
                oB = objB[key];
            if(oA.length != oB.length) {
                flag = false;
                break;
            }
            for(var k in oA) {
                if(!flag) //这里跳出循环是为了不让递归继续
                    break;
                flag = CompareObj(oA[k], oB[k], flag);
            }
        }
    }
    return flag;
}