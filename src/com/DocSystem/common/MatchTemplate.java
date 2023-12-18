package com.DocSystem.common;

public class MatchTemplate {

	public String prefix;
	public String [] vars;
	
	public MatchTemplate(String matchRule) {
		//Step1: 分析 matchRule prefix(Var1,Var2, Var3)
		//获取templatePrefix
		//获取templateVars = Var1 , Var2 ... null表示字符串直接替换, size = 0 表示没有参数,  否则表示参数列表
		//String [] TemplateVars = getTemplateVars(matchRule, prefix);
		prefix = getPrefix(matchRule);
		vars = getVars(matchRule, prefix);
	}

	static String getPrefix(String matchRule)
	{
		return null;		
	}
	
	static String[] getVars(String matchRule, String prefix)
	{
		return null;
	}
}
