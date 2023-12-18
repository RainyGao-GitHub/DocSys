package com.DocSystem.common;

public class MatchResult {

	public int status = 0;
	public int startIndex; //startIndex in input
	public int endIndex; //endIndex in input
	public String varsContent;
	public String replaceContent;

	public boolean skipReplace;
	
	public boolean findPrefix(
			String input, int beginIndex, 
			MatchTemplate matchTemplate) 
	{
		// TODO Auto-generated method stub
		int prefixPos = input.indexOf(matchTemplate.prefix, beginIndex);
		if(prefixPos == -1)
		{
			status = 0;
			return false;
		}
		
		startIndex = prefixPos;
		return true;
	}

	public boolean getVars(String input, MatchTemplate matchTemplate) {
		// TODO Auto-generated method stub
		endIndex = startIndex + matchTemplate.prefix.length();
		
		if(matchTemplate.vars == null)
		{
			replaceContent = matchTemplate.prefix;
			return true;
		}
		
		//prefix和(之间只允许有5个空格或tab字符
		int embace_left = -1;
		for(int i = endIndex; i< endIndex + 5; i++)
		{
			char ch = input.charAt(i);
			if(ch == '(')
			{
				embace_left = i;
				break;
			}
			if(ch == ' ' || ch == '	')	//空格或Tab
			{
				continue;
			}
		}
		
		if(embace_left == -1)
		{
			return false;
		}
		
		//try to find ), 1000个字符内必须找到
		int embace_right = -1;
		for(int i = embace_left+1; i< embace_left + 1000; i++)
		{
			char ch = input.charAt(i);
			if(ch == '(')
			{
				embace_right = i;
				break;
			}
			if(ch == ' ' || ch == '	')	//空格或Tab
			{
				continue;
			}
		}
		
		if(embace_right == -1)
		{
			return false;
		}
		
		varsContent = input.substring(embace_left + 1, embace_right).trim();
		return true;
	}
}
