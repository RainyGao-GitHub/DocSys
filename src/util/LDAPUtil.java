package util;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.List;

import javax.naming.AuthenticationException;
import javax.naming.CommunicationException;
import javax.naming.Context;
import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import javax.naming.directory.SearchControls;
import javax.naming.directory.SearchResult;
import javax.naming.ldap.InitialLdapContext;
import javax.naming.ldap.LdapContext;
import javax.security.auth.Subject;
import javax.security.auth.login.LoginContext;

import com.DocSystem.common.Log;
import com.DocSystem.common.URLInfo;
import com.DocSystem.common.entity.LDAPConfig;
import com.DocSystem.common.entity.LdapLoginCheckResult;
import com.DocSystem.common.entity.SystemLDAPConfig;
import com.DocSystem.controller.LdapCallbackHandler;
import com.DocSystem.controller.LdapGssAuth;
import com.DocSystem.controller.LdapJndiAction;
import com.DocSystem.entity.User;
import com.alibaba.fastjson.JSONObject;

public class LDAPUtil 
{   
	public static SystemLDAPConfig getSystemLdapConfig(String systemLdapConfigStr) 
	{
		if(systemLdapConfigStr == null || systemLdapConfigStr.isEmpty())
		{
			Log.debug("getSystemLdapConfig() systemLdapConfigStr is empty");
			return null;
		}

		SystemLDAPConfig config = new SystemLDAPConfig();		
		String [] ldapConfigStrArray = systemLdapConfigStr.split("\\|\\|"); 
		for(int i=0; i < ldapConfigStrArray.length; i++)
		{
			String ldapConfigStr = ldapConfigStrArray[i];
			Log.debug("getSystemLdapConfig() ldapConfigStr:" + ldapConfigStr);
			if(ldapConfigStr.length() > 10)
			{
				LDAPConfig ldapConfig = parseLdapConfig(ldapConfigStr);
				if(ldapConfig != null)
				{
					config.ldapConfigList.add(ldapConfig);
				}
			}
		}
		return config;	
	}
	
	public static LDAPConfig parseLdapConfig(String ldapConfigStr) 
	{
		Log.debug("parseLdapConfig() ldapConfigStr [" + ldapConfigStr + "]");			
		if(ldapConfigStr == null)
		{
			return null;
		}
		
		ldapConfigStr = ldapConfigStr.trim();
		if(ldapConfigStr.isEmpty())
		{
			return null;
		}
		
		LDAPConfig config = new LDAPConfig();
		String [] configs = ldapConfigStr.split(";");
		config.settings = LDAPUtil.getLDAPSettings(configs);		

		//获取url和basedn
		String ldapConfigUrl = configs[0].trim();
		URLInfo urlInfo = getUrlInfoFromUrl(ldapConfigUrl);
		if(urlInfo == null)
		{
			Log.debug("parseLdapConfig() ldapConfigUrl error:" + ldapConfigUrl);
			return null;
		}
		
		config.url = urlInfo.prefix + urlInfo.params[0] + "/";
		config.basedn = "";
		if(urlInfo.params.length > 1)
		{
			config.basedn = urlInfo.params[1];	//0保存的是host+port			
		}

		config.name = config.settings.getString("name");
		config.authentication = LDAPUtil.getLdapAuthentication(config.settings); //鉴权方式
		config.loginMode = LDAPUtil.getLdapLoginMode(config.settings); //用户属性标识，默认是uid	
		config.userAccount = LDAPUtil.getLdapUserAccount(config.settings); //LDAP鉴权用户（不设置则使用登录用户鉴权）				
		config.userPassword = LDAPUtil.getLdapUserPassword(config.settings);	//LDAP鉴权用户的密码			
		config.filter = LDAPUtil.getLdapBaseFilter(config.settings); //过滤条件
		buildLdapUserAttributesAndMap(config); //过滤条件

		return config;
	}
	
	protected static void buildLdapUserAttributesAndMap(LDAPConfig ldapConfig) 
	{
		ldapConfig.attributes = new String[5];
		ldapConfig.attributesMap = new HashMap<String, String>();
		
		String attributeName = LDAPUtil.getAttributeName("name", ldapConfig);
		ldapConfig.attributesMap.put("name", attributeName);
		ldapConfig.attributes[0] = attributeName;

		attributeName = LDAPUtil.getAttributeName("realName", ldapConfig);
		ldapConfig.attributesMap.put("realName", attributeName);
		ldapConfig.attributes[1] = attributeName;

		attributeName = LDAPUtil.getAttributeName("nickName", ldapConfig);
		ldapConfig.attributesMap.put("nickName", attributeName);
		ldapConfig.attributes[2] = attributeName;
		
		attributeName = LDAPUtil.getAttributeName("mail", ldapConfig);
		ldapConfig.attributesMap.put("mail", attributeName);
		ldapConfig.attributes[3] = attributeName;

		attributeName = LDAPUtil.getAttributeName("description", ldapConfig);
		ldapConfig.attributesMap.put("description", attributeName);		
		ldapConfig.attributes[4] = attributeName;
	}
	
	public static URLInfo getUrlInfoFromUrl(String url) {
		Log.info("getUrlInfoFromUrl()", "url:" + url);
		
		URLInfo urlInfo = new URLInfo();
		
	    String subStrs1[] = url.split("://");
	    if(subStrs1.length < 2)
	    {
	    	Log.info("getUrlInfoFromUrl()", "非法URL");
	    	return null;
	    }
	    
	    //set prefix
	    urlInfo.prefix = subStrs1[0] + "://";
	    String hostWithPortAndParams = subStrs1[1];	    
	    String subStrs2[] = hostWithPortAndParams.split("/");
    	urlInfo.params = subStrs2;

	    String hostWithPort = subStrs2[0];
	    
	    String subStrs3[] = hostWithPort.split(":");
	    if(subStrs3.length < 2)
	    {
	    	urlInfo.host = subStrs3[0];
	    }
	    else
	    {
	    	urlInfo.host = subStrs3[0];
	    	urlInfo.port = subStrs3[1];  	
	    }

	    Log.printObject("getUrlInfoFromUrl() urlInfo:", urlInfo);
		return urlInfo;
	}
	
	public static String getAttributeName(String userAttribute, LDAPConfig ldapConfig) 
	{
		String attributeName = null;
		if(ldapConfig.settings != null)
		{
			attributeName = ldapConfig.settings.getString( userAttribute + "Attribute");
		}
		
		switch(userAttribute)
		{
		case "name":
			attributeName = attributeName == null? ldapConfig.loginMode : attributeName;
			break;
		case "realName":
			attributeName = attributeName == null? "cn" : attributeName;
			break;
		case "nickName":
			attributeName = attributeName == null? "displayName" : attributeName;
			break;
		case "mail":
			attributeName = attributeName == null? "mail" : attributeName;
			break;
		case "description":
			attributeName = attributeName == null? "description" : attributeName;
			break;
		}
		return attributeName;
	}

	public static String getLdapAuthentication(JSONObject ldapSettings) {
		if(ldapSettings == null)
		{
			return "simple";
		}
		
		String authenticationStr = ldapSettings.getString("authentication");
		if(authenticationStr == null || authenticationStr.isEmpty())
		{
			return "simple";
		}
		
		return authenticationStr;
	}

	public Integer getLdapAuthMode(JSONObject ldapSettings) {
		if(ldapSettings == null)
		{
			return 0;	//默认不进行密码验证
		}
		
		String authModeStr = ldapSettings.getString("authMode");
		if(authModeStr == null || authModeStr.isEmpty())
		{
			return 0; //默认不进行密码验证
		}
				
		switch(authModeStr.toLowerCase())
		{
		case "0":
		case "none":
		case "disabled":
			return 0;
		case "1":
		case "plain":	
			return 1;
		case "2":
		case "md5":
			return 2;
		}
		
		return 1;
	}
	
	public static String getLdapLoginMode(JSONObject ldapSettings) {
		if(ldapSettings == null)
		{
			return "uid";	//默认使用uid
		}
		
		String loginMode = ldapSettings.getString("loginMode");
		if(loginMode == null || loginMode.isEmpty())
		{
			return "uid"; //默认使用uid
		}
				
		return loginMode;
	}
	
	public static String getLdapUserAccount(JSONObject ldapSettings) {
		if(ldapSettings == null)
		{
			return null;
		}
		
		String userAccount = ldapSettings.getString("userAccount");
		if(userAccount == null || userAccount.isEmpty())
		{
			return null;
		}
				
		return userAccount;
	}
	
	public static String getLdapUserPassword(JSONObject ldapSettings) {
		if(ldapSettings == null)
		{
			return null;
		}
		
		String userPassword = ldapSettings.getString("userPassword");
		if(userPassword == null || userPassword.isEmpty())
		{
			return null;
		}
				
		return userPassword;
	}
	
	public static String getLdapBaseFilter(JSONObject ldapSettings) {
		if(ldapSettings == null)
		{
			return "(objectClass=*)";
		}
		
		String baseFilter = ldapSettings.getString("filter");
		if(baseFilter == null || baseFilter.isEmpty())
		{
			return "(objectClass=*)";
		}
				
		return baseFilter;
	}

	public static JSONObject getLDAPSettings(String[] configs) {
		if(configs.length < 2)
		{
			return null;
		}
		
		JSONObject settings = new JSONObject();
		for(int i=1; i<configs.length; i++)
		{
			String configStr = configs[i];
			if(!configStr.isEmpty())
			{
				String [] subStr = configStr.split("=");
				if(subStr.length >= 2)
				{
					String key = subStr[0];
					String value = subStr[1];
					if(key.equals("filter") || key.equals("userAccount"))	//将等号补回来
					{
						if(subStr.length > 2)
						{
							for(int j=2; j < subStr.length -1; j++)
							{
								value = value + "=" + subStr[j];
							}
							value = value + "=" + subStr[subStr.length -1];				
						}
					}
					settings.put(key, value);
					Log.debug("getLDAPSettings() " + key + " : " + value);
				}
			}
		}
		return settings;
	}
	
	public static User ldapLoginCheck(String userName, String pwd, SystemLDAPConfig systemLdapConfig, LdapLoginCheckResult checkResult)
	{
        if(systemLdapConfig.enabled == false)
		{
			Log.info("ldapLoginCheck() systemLdapConfig.enable is " + systemLdapConfig.enabled);
			return null;
		}
        
        if(systemLdapConfig.ldapConfigList.isEmpty())
		{
        	Log.info("ldapLoginCheck() ldapConfigList is empty");
			return null;
		}
        
        //判断userName是否带域名
        String realUserName = userName;
        String domain = null;
        String[] strArray = userName.split("/");
        if(strArray.length >= 2)
        {
        	domain = strArray[0];
        	realUserName = strArray[1];
        }
        Log.debug("ldapLoginCheck() domain: " + domain + " realUserName:" + realUserName );
        
        //Mulit LDAP
        User user = null;
		if(systemLdapConfig.ldapConfigList.size() > 1)
        {
        	user  =  multiLdapLoginCheck(domain, realUserName, pwd, systemLdapConfig, checkResult);
        }
        else
        {
        	user = ldapLoginCheck(realUserName, pwd, systemLdapConfig.ldapConfigList.get(0), checkResult);
        }
		
		//TODO: 保留原始的用户名，避免多域登录时存在重名用户
        if(user != null)
        {
        	user.setName(userName);
        }
	}
	
	public static User multiLdapLoginCheck(String domain, String realUserName, String pwd, SystemLDAPConfig systemLdapConfig, LdapLoginCheckResult checkResult)
	{
		//如果找到有对应名字的LDAPServer则可以直接登录
		if(domain != null && domain.isEmpty() == false)
		{
			String domainLowCase = domain.toLowerCase();
			for(LDAPConfig config : systemLdapConfig.ldapConfigList)
			{
				if(config.name != null && config.name.toLowerCase().equals(domainLowCase))
				{
					return ldapLoginCheck(realUserName, pwd, config, checkResult);
				}
			}
		}
		
		//如果没有对应domain的LDAPsever,那么逐个登录
		User user = null;
		for(LDAPConfig config : systemLdapConfig.ldapConfigList)
		{
			user = ldapLoginCheck(realUserName, pwd, config, checkResult);
			if(user != null)
			{
				return user;
			}
			
			//登录失败要看情况，如果是密码错误，那么不允许继续			
			if(checkResult.status == LdapLoginCheckResult.PasswordError)
			{
				return null;
			}
		}
		return user;
	}

	public static User ldapLoginCheck(String userName, String pwd, LDAPConfig ldapConfig, LdapLoginCheckResult checkResult)
	{
		//使用管理员账号连接ldap服务器
		LdapContext ctx = getLDAPConnection(ldapConfig.userAccount, ldapConfig.userPassword, ldapConfig);
		if(ctx == null)
		{
			Log.debug("ldapLoginCheck() getLDAPConnection 失败"); 
			return null;
		}
		
		String filter = ldapConfig.filter;
		Log.info("getLDAPConnection() filter:" + filter);       		
		
		List<SearchResult> list = searchInLdap(ctx, ldapConfig, userName);
		
		try {
			ctx.close();
		} catch (NamingException e) {
			Log.info(e);
		}
		
		if(list == null || list.size() == 0)
		{
			Log.debug("ldapLoginCheck() 用户不存在");
			checkResult.status = -1;
			return null;
		}
		
		if(list == null || list.size() == 0)
		{
			Log.debug("ldapLoginCheck() 系统出现重名用户");
			checkResult.status = -2;
			return null;
		}
		
		
		//使用userDN进行密码校验
		SearchResult result = list.get(0);
		String userDN = result.getNameInNamespace();
		ctx = getLDAPConnection(userDN, pwd, ldapConfig);
		if(ctx == null)
		{
			Log.debug("ldapLoginCheck() 密码错误"); 
			checkResult.status = -3;
			return null;
		}
		try {
			ctx.close();
		} catch (NamingException e) {
			Log.info(e);
		}

		
		return convertToUser(result, ldapConfig);
	}
	
	//获取LDAP Server支持的SASL鉴权机制列表
    public static void getListOfSASLMechanisms(LDAPConfig ldapConfig)
    {
    	Log.info("getListOfSASLMechanisms()");
    	try {
	    	// Create initial context
	    	DirContext ctx = new InitialDirContext();
	
	    	// Read supportedSASLMechanisms from root DSE
			Attributes attrs = ctx.getAttributes(ldapConfig.url, new String[]{"supportedSASLMechanisms"});	
			
			Log.info("getListOfSASLMechanisms() supportedSASLMechanisms:" + attrs.get("supportedSASLMechanisms"));
		} catch (Exception e) {
			Log.info("getListOfSASLMechanisms() get supportedSASLMechanisms failed");
			Log.debug(e);
		}
    }
	
	/**
     * 获取默认LDAP连接     * Exception 则登录失败，ctx不为空则登录成功
     * ldapConfig中同时设置了userAccount以及userPassword，则使用userAccount和userPassword进行密码校验并获取ctx，只设置了userAccount则不进行密码校验直接获取ctx，userAccount是DN表达式
     * ldapConfig没有指定userAccount，则根据userName来进行校验和登录，userName为空则使用basedn的ctx，userName非空则使用loginMode=userName,basedn进行登录校验并获取ctx（authMode=1才校验密码，密码为pwd）
     * @return LdapContext
     */
    public static LdapContext getLDAPConnection(String PRINCIPAL, String CREDENTIALS, LDAPConfig ldapConfig) 
    {				
		String LDAP_URL = ldapConfig.url;
		if(LDAP_URL == null || LDAP_URL.isEmpty())
		{
			Log.debug("getLDAPConnection LDAP_URL is null or empty, LDAP_URL:" + LDAP_URL);
			return null;
		}
		Log.debug("getLDAPConnection LDAP_URL:" + LDAP_URL);
		
		String authentication = ldapConfig.authentication;
		if(authentication == null || authentication.isEmpty())
		{
			authentication = "simple";
		}
		Log.debug("getLDAPConnection authentication:" + authentication);
		
		switch(authentication)
		{
		case "none":
			return getLDAPConnection_Anonymous(ldapConfig);
		case "simple":
			return getLDAPConnection_Simple(PRINCIPAL, CREDENTIALS, ldapConfig);
		case "DIGEST-MD5":
			return getLDAPConnection_DigestMD5(PRINCIPAL, CREDENTIALS, ldapConfig);
		case "EXTERNAL":	
			return getLDAPConnection_External(ldapConfig);
		case "CRAM-MD5":
			return getLDAPConnection_CramMD5(PRINCIPAL, CREDENTIALS, ldapConfig);
		case "GSSAPI":
			return getLDAPConnection_Gssapi(ldapConfig);
		default:
			return getLDAPConnection_General(PRINCIPAL, CREDENTIALS, ldapConfig);
		}
    }
    
    private static LdapContext getLDAPConnection_General(String PRINCIPAL, String CREDENTIALS, LDAPConfig ldapConfig) {
        LdapContext ctx = null;
    	try {
    		Hashtable<String, Object> HashEnv = new Hashtable<String,Object>();
            HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
            
            HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
            
            HashEnv.put(Context.PROVIDER_URL, ldapConfig.url);

    		HashEnv.put(Context.SECURITY_AUTHENTICATION, ldapConfig.authentication); // LDAP访问安全级别(none,simple,strong)

    		if(PRINCIPAL != null)
    		{
	            HashEnv.put(Context.SECURITY_PRINCIPAL, PRINCIPAL);
	            if(CREDENTIALS != null)
	            {
	            	HashEnv.put(Context.SECURITY_CREDENTIALS, CREDENTIALS);
	            }
    		}            
            ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
		} catch (AuthenticationException e) {
			Log.info(e);
		} catch (CommunicationException e) {
			Log.info(e);
		} catch (Exception e) {
			Log.info(e);
		}
    	
        return ctx;
	}

	private static LdapContext getLDAPConnection_Gssapi(LDAPConfig ldapConfig) {
    	//Log in (to Kerberos)
    	LoginContext lc = LdapGssAuth.login(ldapConfig);
    	if(lc == null)
    	{
    		Log.info("getLDAPConnection_Gssapi() LdapGssAuth.login failed");
    		return null;
    	}
    	//Get ldap ctx
    	LdapJndiAction jndiAction = new LdapJndiAction(ldapConfig);
    	Subject.doAs(lc.getSubject(), jndiAction);
    	return jndiAction.ctx;
	}

	private static LdapContext getLDAPConnection_CramMD5(String PRINCIPAL, String CREDENTIALS, LDAPConfig ldapConfig) {
        LdapContext ctx = null;
    	try {
    		Hashtable<String, Object> HashEnv = new Hashtable<String,Object>();
            HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
            
            HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
            
            HashEnv.put(Context.PROVIDER_URL, ldapConfig.url);
            
            HashEnv.put(Context.SECURITY_AUTHENTICATION, "CRAM-MD5");
            
    	    LdapCallbackHandler callbackHandler = new LdapCallbackHandler();
    	    callbackHandler.userName = PRINCIPAL;
    	    callbackHandler.userPwd = CREDENTIALS;	    
    	    HashEnv.put("java.naming.security.sasl.callback", callbackHandler);

            ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
		} catch (AuthenticationException e) {
			Log.info(e);
		} catch (CommunicationException e) {
			Log.info(e);
		} catch (Exception e) {
			Log.info(e);
		}
    	
        return ctx;
	}

	private static LdapContext getLDAPConnection_External(LDAPConfig ldapConfig) {
        LdapContext ctx = null;
    	try {
    		Hashtable<String, Object> HashEnv = new Hashtable<String,Object>();
            HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
            
            HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
            
            HashEnv.put(Context.PROVIDER_URL, ldapConfig.url);

            HashEnv.put(Context.SECURITY_AUTHENTICATION, "EXTERNAL");

            HashEnv.put(Context.SECURITY_PROTOCOL, "ssl");
            
            ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
		} catch (AuthenticationException e) {
			Log.info(e);
		} catch (CommunicationException e) {
			Log.info(e);
		} catch (Exception e) {
			Log.info(e);
		}
    	
        return ctx;
	}

	private static LdapContext getLDAPConnection_DigestMD5(String PRINCIPAL, String CREDENTIALS, LDAPConfig ldapConfig) {
        LdapContext ctx = null;
    	try {
    		Hashtable<String, Object> HashEnv = new Hashtable<String,Object>();
            HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
            
            HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
            
            HashEnv.put(Context.PROVIDER_URL, ldapConfig.url);

    		HashEnv.put(Context.SECURITY_AUTHENTICATION,  "DIGEST-MD5"); // LDAP访问安全级别(none,simple,strong)

    		if(PRINCIPAL != null)
    		{
	            HashEnv.put(Context.SECURITY_PRINCIPAL, PRINCIPAL);
	            if(CREDENTIALS != null)
	            {
	            	HashEnv.put(Context.SECURITY_CREDENTIALS, CREDENTIALS);
	            }
    		}            
            ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
		} catch (AuthenticationException e) {
			Log.info(e);
		} catch (CommunicationException e) {
			Log.info(e);
		} catch (Exception e) {
			Log.info(e);
		}
    	
        return ctx;
	}

	private static LdapContext getLDAPConnection_Simple(String PRINCIPAL, String CREDENTIALS, LDAPConfig ldapConfig) {
        LdapContext ctx = null;
    	try {
    		Hashtable<String, Object> HashEnv = new Hashtable<String,Object>();
            HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
            
            HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
            
            HashEnv.put(Context.PROVIDER_URL, ldapConfig.url);

    		HashEnv.put(Context.SECURITY_AUTHENTICATION, "simple"); // LDAP访问安全级别(none,simple,strong)

    		if(PRINCIPAL != null)
    		{
	            HashEnv.put(Context.SECURITY_PRINCIPAL, PRINCIPAL);
	            if(CREDENTIALS != null)
	            {
	            	HashEnv.put(Context.SECURITY_CREDENTIALS, CREDENTIALS);
	            }
    		}            
            ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
		} catch (AuthenticationException e) {
			Log.info(e);
		} catch (CommunicationException e) {
			Log.info(e);
		} catch (Exception e) {
			Log.info(e);
		}
    	
        return ctx;
	}

    
    private static LdapContext getLDAPConnection_Anonymous(LDAPConfig ldapConfig) {
        LdapContext ctx = null;
    	try {
    		Hashtable<String, Object> HashEnv = new Hashtable<String,Object>();
            HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
            
            HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
            
            HashEnv.put(Context.PROVIDER_URL, ldapConfig.url);

    		HashEnv.put(Context.SECURITY_AUTHENTICATION, "none"); // LDAP访问安全级别(none,simple,strong)
            
            ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
		} catch (AuthenticationException e) {
			Log.info(e);
		} catch (CommunicationException e) {
			Log.info(e);
		} catch (Exception e) {
			Log.info(e);
		}
    	
        return ctx;
	}
    
	public static List<SearchResult> searchInLdap(LdapContext ctx, LDAPConfig ldapConfig, String userName)
	{
		Log.debug("searchInLdap() basedn:" + ldapConfig.basedn);
		if(ctx == null)
		{
			Log.info("searchInLdap() ctx is null");
			return null;
		}
		
		List<SearchResult> resultList = new ArrayList<SearchResult>();		
		
		try {
	        //String[] attrPersonArray = { loginMode, "userPassword", "displayName", "cn", "sn", "mail", "description", "dn"};
            SearchControls searchControls = new SearchControls();//搜索控件
            searchControls.setSearchScope(SearchControls.SUBTREE_SCOPE);//搜索范围
            searchControls.setReturningAttributes(ldapConfig.attributes);
            //1.要搜索的上下文或对象的名称；2.过滤条件，可为null，默认搜索所有信息；3.搜索控件，可为null，使用默认的搜索控件
            String filter = ldapConfig.filter;
            if(userName != null && userName.isEmpty() == false)
            {
            	filter = "(&" + ldapConfig.filter + "("+ ldapConfig.loginMode + "=" + userName + ")" + ")";
            }
            Log.debug("searchInLdap() filter:" + filter);
            
            NamingEnumeration<SearchResult> answer = ctx.search(ldapConfig.basedn, filter, searchControls);
            while (answer.hasMore()) {
                SearchResult result = (SearchResult) answer.next();
                resultList.add(result);
            }
            
            
		}catch (Exception e) {
			Log.debug("searchInLdap() 获取用户信息异常:");
			Log.info(e);
		}
		 
		return resultList;
	}
	
	private static User convertToUser(SearchResult result, LDAPConfig ldapConfig)
	{
        NamingEnumeration<? extends Attribute> attrs = result.getAttributes().getAll();
        
        Log.debug("readLdap() userInfo:");
        User lu = new User();
        try {
	        while (attrs.hasMore()) 
	        {
	            Attribute attr = (Attribute) attrs.next();
	            Log.debug("convertToUser() " + attr.getID() + " = " + attr.get().toString());
	            
	            //name
	            if(ldapConfig.attributesMap.get("name").equals(attr.getID()))
	            {
	            	lu.setName(attr.get().toString());
	            }
	            //realName
	            if(ldapConfig.attributesMap.get("realName").equals(attr.getID()))
	            {
	            	lu.setRealName(attr.get().toString());
	            }
	            //nickName
	            if(ldapConfig.attributesMap.get("nickName").equals(attr.getID()))
	            {
	            	lu.setNickName(attr.get().toString());
	            }
	            //email
	            if(ldapConfig.attributesMap.get("mail").equals(attr.getID()))
	            {
	            	lu.setEmail(attr.get().toString());
	            }
	            //description
	            if(ldapConfig.attributesMap.get("description").equals(attr.getID()))
	            {
	            	lu.setIntro(attr.get().toString());
	            }	            
	        }
	        
	        if(lu.getName() != null)
	        {
	        	return lu;
	        }
        }
	    catch(Exception e)
        {
	    	Log.error(e);
        }
		return null;
	}
}
