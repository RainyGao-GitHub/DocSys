package com.DocSystem.controller;

import java.security.PrivilegedAction;
import java.util.Hashtable;

import javax.naming.AuthenticationException;
import javax.naming.CommunicationException;
import javax.naming.Context;
import javax.naming.ldap.InitialLdapContext;
import javax.naming.ldap.LdapContext;

import com.DocSystem.common.Log;
import com.DocSystem.common.entity.LDAPConfig;

public class LdapJndiAction implements PrivilegedAction {
	public LDAPConfig config  = null;
	public LdapContext ctx = null;

    public LdapJndiAction(LDAPConfig ldapConifg) {
    	this.config = ldapConifg;
    }

    public Object run() {
		performJndiOperation(config);
		return null;
    }

    private void performJndiOperation(LDAPConfig ldapConifg) 
    {
        LdapContext ctx = null;
     	try {
     		Hashtable<String, Object> HashEnv = new Hashtable<String,Object>();
             HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
             
             HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
             
             HashEnv.put(Context.PROVIDER_URL, ldapConifg.url);

             HashEnv.put(Context.SECURITY_AUTHENTICATION, "GSSAPI");
             
             ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
 		} catch (AuthenticationException e) {
 			Log.info(e);
 		} catch (CommunicationException e) {
 			Log.info(e);
 		} catch (Exception e) {
 			Log.info(e);
 		}
     	this.ctx = ctx;
	}
}
