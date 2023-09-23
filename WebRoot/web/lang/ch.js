/*
 * Chinese Support
 * */

function _Lang(str1, connectStr , str2)
{
	if(connectStr == undefined)
	{
		return str1;
	}
	
	return str1 + connectStr + str2;
}