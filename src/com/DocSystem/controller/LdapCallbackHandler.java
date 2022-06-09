package com.DocSystem.controller;

import javax.security.auth.callback.Callback;
import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.callback.NameCallback;
import javax.security.auth.callback.PasswordCallback;
import javax.security.auth.callback.UnsupportedCallbackException;

import com.DocSystem.common.Log;

public class LdapCallbackHandler implements CallbackHandler {
	public String userName = null;
	public String userPwd = null;
	
    public void handle(Callback[] callbacks) throws java.io.IOException, UnsupportedCallbackException {
	    for (int i = 0; i < callbacks.length; i++) {
			if (callbacks[i] instanceof NameCallback) {
			    NameCallback cb = (NameCallback)callbacks[i];
			    Log.debug("LdapCallbackHandler() userName:" + userName);
			    if(userName == null)
			    {
			    	cb.setName("");
			    }
			    else
			    {
			    	cb.setName(userName);		    	
			    }
			} else if (callbacks[i] instanceof PasswordCallback) {
			    PasswordCallback cb = (PasswordCallback)callbacks[i];
			    Log.debug("LdapCallbackHandler() userPwd:" + userPwd);
			    String pw = userPwd;
			    if(pw == null)
			    {
			    	pw = "";
			    }
			    char[] passwd = new char[pw.length()];
			    pw.getChars(0, passwd.length, passwd, 0);
	
			    cb.setPassword(passwd);
			} else {
			    throw new UnsupportedCallbackException(callbacks[i]);
			}
	    }
    }
}
