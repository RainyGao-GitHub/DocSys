/*
 * English Support
 * */

function _Lang(str1, connectStr , str2)
{
	if(connectStr == undefined)
	{
		return lang(str1);
	}
	
	return lang(str1) + connectStr + lang(str2);
}

function lang(str)
{
	var translateMap = {
		"成功" : "success",
		"失败" : "fail",
		"正确" : "ok",
		"错误" : "error",
		"异常" : "exception",
	};
	
	var newStr = langTypeMap[str];
	if ( undefined == newStr )
	{
		return str;
	}
	
	return newStr;
}