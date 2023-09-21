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
	var translateMap = 
	{
		"注册失败"	: "Sign Up Failed",			
		"登录失败"	: "Sign In Failed",
		"退出登录失败" : "Sign Out Failed",
		"服务器异常" : "Server Exception",			
	};
	
	var newStr = langTypeMap[str];
	if ( undefined == newStr )
	{
		return str;
	}
	
	return newStr;
}