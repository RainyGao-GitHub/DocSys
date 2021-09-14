package com.DocSystem.test;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;

import javax.naming.AuthenticationException;
import javax.naming.CommunicationException;
import javax.naming.Context;
import javax.naming.NamingEnumeration;
import javax.naming.directory.Attribute;
import javax.naming.directory.SearchControls;
import javax.naming.directory.SearchResult;
import javax.naming.ldap.InitialLdapContext;
import javax.naming.ldap.LdapContext;

import com.DocSystem.common.Log;
import com.DocSystem.entity.User;

import util.Encrypt.MD5;
	
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
				Log.debug("LDAPConnectionTest() ctx is null"); 
			}
			else
			{
				List<User> list = readLdap(ctx, "", "ragao");
				Log.printObject("LDAPConnectionTest() list", list);				
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

        String LDAP_URL = "ldap://localhost:389/";
        String basedn = "ou=xxx,dc=xxx,dc=com";
        String userId = "test";
        String userAccount = "uid=" + userId + "," + basedn;     
        String userPassword = "123456";
        Hashtable<String,String> HashEnv = new Hashtable<String,String>();
        HashEnv.put(Context.SECURITY_AUTHENTICATION, "simple"); // LDAP访问安全级别(none,simple,strong)
        HashEnv.put(Context.SECURITY_PRINCIPAL, userAccount);
        HashEnv.put(Context.SECURITY_CREDENTIALS, userPassword);
        HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
        HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
        HashEnv.put(Context.PROVIDER_URL, LDAP_URL);

        ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文

        return ctx;
    }
    
    public static List<User> readLdap(LdapContext ctx,String basedn, String userId){
		
		List<User> lm=new ArrayList<User>();
		try {
			 if(ctx!=null){
				//过滤条件
	            //String filter = "(&(objectClass=*)(uid=*))";
	            String filter = "(&(objectClass=*)(uid=" +userId+ "))";
				
	            String[] attrPersonArray = { "uid", "userPassword", "displayName", "cn", "sn", "mail", "description" };
	            SearchControls searchControls = new SearchControls();//搜索控件
	            searchControls.setSearchScope(2);//搜索范围
	            searchControls.setReturningAttributes(attrPersonArray);
	            //1.要搜索的上下文或对象的名称；2.过滤条件，可为null，默认搜索所有信息；3.搜索控件，可为null，使用默认的搜索控件
	            NamingEnumeration<SearchResult> answer = ctx.search(basedn, filter.toString(),searchControls);
	            while (answer.hasMore()) {
	                SearchResult result = (SearchResult) answer.next();
	                NamingEnumeration<? extends Attribute> attrs = result.getAttributes().getAll();
	                User lu=new User();
	                while (attrs.hasMore()) {
	                    Attribute attr = (Attribute) attrs.next();
	                    if("userPassword".equals(attr.getID())){
	                    	Object value = attr.get();
	                    	lu.setPwd(new String((byte [])value));
	                    }else if("uid".equals(attr.getID())){
	                    	lu.setName(attr.get().toString());
	                    }else if("displayName".equals(attr.getID())){
	                    	lu.setRealName(attr.get().toString());
	                    }
	                    //else if("cn".equals(attr.getID())){
	                    //	lu.cn = attr.get().toString();
	                    //}else if("sn".equals(attr.getID())){
	                    //	lu.sn = attr.get().toString();
	                    //}
	                    else if("mail".equals(attr.getID())){
	                    	lu.setEmail(attr.get().toString());
	                    }else if("description".equals(attr.getID())){
	                    	lu.setIntro(attr.get().toString());
	                    }
	                }
	                if(lu.getName() != null)
	                {
	                	lm.add(lu);
	                }
                    
	            }
			 }
		}catch (Exception e) {
			System.out.println("获取用户信息异常:");
			e.printStackTrace();
		}
		 
		return lm;
	}
}

