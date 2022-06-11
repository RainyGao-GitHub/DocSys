package com.DocSystem.controller;

import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.login.LoginContext;
import javax.security.auth.login.LoginException;

import com.DocSystem.common.Log;
import com.DocSystem.common.entity.LDAPConfig;

public class LdapGssAuth {
	private static LoginContext loginContex = null;
	
	public static LoginContext login(LDAPConfig ldapConfig) {
		if(loginContex != null)
		{
			return loginContex;
		}
		
    	try {
    		LoginContext lc = null;
    	    LdapCallbackHandler callbackHandler = new LdapCallbackHandler();
    	    callbackHandler.userName = ldapConfig.userAccount;
    	    callbackHandler.userPwd = ldapConfig.userPassword;	     	    
    	    lc = new LoginContext(LdapGssAuth.class.getName(), (CallbackHandler)callbackHandler);
    	    lc.login();
    	    loginContex = lc;
    	} catch (Exception e) {
			Log.error("LdapGssAuth login failed");
			Log.error(e);
			loginContex = null;
    	}		
		return loginContex;
	}
	
	public static void logout()
	{
		if(loginContex != null)
		{
			try {
				loginContex.logout();
			} catch (LoginException e) {
				Log.error("LdapGssAuth logout failed");
				Log.error(e);
			}
		}
	}
}
