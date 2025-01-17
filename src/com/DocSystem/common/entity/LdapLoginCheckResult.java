package com.DocSystem.common.entity;

public class LdapLoginCheckResult 
{
	public static final int Success = 0;

	public static final int UnknownError 	= -1;	
	public static final int UserNotExist 	= -2;
	public static final int DuplicatedUser 	= -3;
	public static final int PasswordError 	= -4;
	public static final int DomainNotExist 	= -5;
		
	public int status = UnknownError;
	public String info;
}
