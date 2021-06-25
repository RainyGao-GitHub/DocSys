package com.DocSystem.test;

import java.util.Hashtable;

import javax.naming.AuthenticationException;
import javax.naming.CommunicationException;
import javax.naming.Context;
import javax.naming.ldap.InitialLdapContext;
import javax.naming.ldap.LdapContext;

import com.DocSystem.common.Log;

public class LDAPTest {
    public static void main(String[] args)    
    {  
    	LDAPConnectionTest();
    }
    
    public static void LDAPConnectionTest() {
    	try {
			LdapContext ctx = getLDAPConnection();
			if(ctx == null)
			{
				Log.println("LDAPConnectionTest() ctx is null"); 
			}
			else
			{
				Log.printObject("LDAPConnectionTest() ctx", ctx);
			}
		} catch (AuthenticationException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (CommunicationException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
    }
	/**
     * 获取默认LDAP连接     * Exception 则登录失败，ctx不为空则登录成功
     * @return void
     */
    public static LdapContext getLDAPConnection() throws AuthenticationException, CommunicationException,Exception {
        LdapContext ctx = null;

        //LDAP 连接地址 ldap://IP:PORT (default port 389)
        String LDAP_URL = "ldap://ed-p-gl.emea.nsn-net.net:389/o=NSN";

        //LDAP SSL连接地址 ldaps://IP:PORT (default port 636)
        //(这个用起来比较麻烦，目前知道管理员改密码必须使用SSL)
        //String LDAP_SSL_URL = "";

        //用户名
        String userAccount = "";

        //管理员密码
        String userPassword = "";


//      方式1
//      基于姓名（cn）,此cn为Display Name,部门有同名就麻烦了
//        userAccount = "cn=xxx,OU=xxx,DC=xxx,DC=com";
        
//        方式2
//        基于Account User Logon name:
        userAccount = "ragao";
        
//        方式3
//        基于Account User Logon name(pre-windows 2000):
//        userAccount = "domain\\xxx"
        
//      基于登录名（uid （User ID）与 unix 的 uid 完全不同）（请注意objectSID,此处尝试失败）
//      uid=abc123, ou=xxxx, dc=xxxx, dc=com


        userPassword = "Rain_121902";
        Hashtable<String,String> HashEnv = new Hashtable<String,String>();
        HashEnv.put(Context.SECURITY_AUTHENTICATION, "simple"); // LDAP访问安全级别(none,simple,strong)
        HashEnv.put(Context.SECURITY_PRINCIPAL, userAccount); //AD的用户名
        HashEnv.put(Context.SECURITY_CREDENTIALS, userPassword); //AD的密码
        HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
        HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
        HashEnv.put(Context.PROVIDER_URL, LDAP_URL);

        ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文
        return ctx;
    }	
}

