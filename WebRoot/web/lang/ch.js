/*
 * Chinese Support
 * */
var langType = "ch";
var langExt = "";

function _Lang(str1, connectStr , str2)
{
	if(connectStr == undefined)
	{
		return str1;
	}
	
	return str1 + connectStr + str2;
}

function buildStatistics(totalNum, successNum)
{
	if(successNum == undefined)
	{
		return "共 "+ totalNum + " 个";		
	}
	return "共 "+ totalNum +" 个，失败 " + (totalNum - successNum) + " 个";
}