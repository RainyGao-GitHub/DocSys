package com.DocSystem.common.entity;

public class LdapLoginCheckResult 
{
	public static final int UserNotExist 	= -1;
	public static final int DuplicatedUser 	= -2;
	public static final int PasswordError 	= -3;
	public static final int DomainNotExist 	= -4;
		
	public int status;	
}
