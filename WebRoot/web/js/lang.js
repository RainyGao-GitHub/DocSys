/*
 * 多国语言支持
 * */
const defaultLangType = 1;

//获取语言类型
function getLangType(lang)
{
	if(lang == undefined || lang == "")
	{
		return defaultLangType;	//
	}
	var langTypeMap = {
			ch : 1,
			en : 2,
		 	jp : 3,
		};
	
	var type = langTypeMap[lang];
	if ( undefined == type )
	{
		return defaultLangType;
	}
	
	return type;
}


function translate(str, lang)
{
	if(lang == undefined)
	{
		return str;
	}
	
	switch(lang)
	{
	case "ch":	//默认语言不需要转换
		return translateToChinese(str);
	case "en":
		return translateToEnglish(str);
	case "jp":
		return translateToJapnese(str);
	}
	
	return str;
}

function translateToChinese(str)
{
	var translateMap = {
		"success" : "成功",
		"fail" : "失败",
		"ok" : "正确",
		"error" : "错误",
		"exception" : "异常",
	};
	
	var newStr = langTypeMap[str];
	if ( undefined == newStr )
	{
		return str;
	}
	
	return newStr;
}

function translateToEnglish(str)
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