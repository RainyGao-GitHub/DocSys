package com.DocSystem.common;

public class OS {
	public final static int UNKOWN = 0;		
	public final static int Windows = 1;
	public final static int Linux = 2;
	public final static int MacOS = 3;

	public static boolean isWinOS(Integer OSType) {
		if(OSType == OS.Windows){
			return true;
		}
		return false;
	}	
	
	protected static boolean isWinDiskStr(String Str) 
	{
		if(Str.length() != 2)
		{
			return false;
		}
		
		char endChar = Str.charAt(1);
		if(endChar != ':')
		{
			return false;
		}
		
		char diskChar = Str.charAt(0);
		if((diskChar >= 'C' && diskChar <= 'Z') ||(diskChar >= 'c' && diskChar <= 'z') ) 
		{
			return true;
		}
		return false;
	}
	
	public static boolean isWinDiskChar(String Str) 
	{
		if(Str.length() != 1)
		{
			return false;
		}

		char diskChar = Str.charAt(0);
		if((diskChar >= 'C' && diskChar <= 'Z') ||(diskChar >= 'c' && diskChar <= 'z') ) 
		{
			return true;
		}
		return false;
	}

}