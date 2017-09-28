/**
 * Created by Cheney on 2017/3/10.
 */

function jsonEscape(data) {

    if ( !data ){
        return data;
    }
    var orgin;
    if ( "string" === typeof data ){
        orgin = JSON.stringify(data);
    }else{
        orgin = JSON.stringify(JSON.stringify(data));
    }
    return orgin.substring(1, orgin.length-1)
}