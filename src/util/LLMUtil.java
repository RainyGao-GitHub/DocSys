package util;

import com.DocSystem.common.Log;
import com.DocSystem.common.URLInfo;
import com.DocSystem.common.entity.LLMAccessCheckResult;
import com.DocSystem.common.entity.LLMConfig;
import com.DocSystem.common.entity.SystemLLMConfig;

public class LLMUtil {

	public static SystemLLMConfig getSystemLLMConfig(String systemLLMConfigStr) 
	{
		SystemLLMConfig config = new SystemLLMConfig();		
		if(systemLLMConfigStr == null || systemLLMConfigStr.isEmpty())
		{
			Log.debug("getSystemLLMConfig() systemLLMConfigStr is empty");
			return config;
		}

		String [] LLMConfigStrArray = systemLLMConfigStr.split("\\|\\|"); 
		for(int i=0; i < LLMConfigStrArray.length; i++)
		{
			String LLMConfigStr = LLMConfigStrArray[i];
			Log.debug("getSystemLLMConfig() LLMConfigStr:" + LLMConfigStr);
			if(LLMConfigStr.length() > 10)
			{
				LLMConfig LLMConfig = parseLLMConfig(LLMConfigStr);
				if(LLMConfig != null)
				{
					config.llmConfigList.add(LLMConfig);
				}
			}
		}
		return config;	
	}
	
	public static LLMConfig parseLLMConfig(String LLMConfigStr) 
	{
		Log.debug("parseLLMConfig() LLMConfigStr [" + LLMConfigStr + "]");			
		if(LLMConfigStr == null)
		{
			return null;
		}
		
		LLMConfigStr = LLMConfigStr.trim();
		if(LLMConfigStr.isEmpty())
		{
			return null;
		}
		
		LLMConfig config = new LLMConfig();
		String [] configs = LLMConfigStr.split(";");
		config.settings = LDAPUtil.getLDAPSettings(configs);		

		//获取url和basedn
		String LLMConfigUrl = configs[0].trim();
		URLInfo urlInfo = getUrlInfoFromUrl(LLMConfigUrl);
		if(urlInfo == null)
		{
			Log.debug("parseLLMConfig() LLMConfigUrl error:" + LLMConfigUrl);
			return null;
		}
		
		config.url = urlInfo.prefix + urlInfo.params[0] + "/";
		config.name = config.settings.getString("name");
		config.apikey = config.settings.getString("apikey");
		return config;
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

	public static boolean llmAccessCheck(String url, String apikey, LLMConfig llmConfig, LLMAccessCheckResult checkResult) 
	{
		Log.info("llmAccessCheck() AI接入测试未实现");
		return false;
	}
}
