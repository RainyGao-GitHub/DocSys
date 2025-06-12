package util;

import com.DocSystem.common.Log;
import com.DocSystem.common.URLInfo;
import com.DocSystem.common.entity.LLMAccessCheckResult;
import com.DocSystem.common.entity.LLMConfig;
import com.DocSystem.common.entity.SystemLLMConfig;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.output.Response;

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
		
		config.url = LLMConfigUrl;
		config.name = config.settings.getString("name");
		config.modelName = config.settings.getString("modelName");
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

	public static boolean llmAccessCheck(SystemLLMConfig systemLLMConfig, LLMAccessCheckResult checkResult) 
	{
		if(systemLLMConfig.enabled == false)
		{
			checkResult.info = ("llmAccessCheck() systemLLMConfig was not enabled!");
			Log.info(checkResult.info);
			return false;
		}
		
		if(systemLLMConfig.llmConfigList == null)
		{
			checkResult.info = "llmAccessCheck() systemLLMConfig.llmConfigList is null!";
			Log.info(checkResult.info);
			return false;
		}

		for(LLMConfig llmConfig : systemLLMConfig.llmConfigList)
		{
			checkResult.info += "开始测试AI大模型[" + llmConfig.name + "] [" + llmConfig.url+ "] [" +llmConfig.apikey+ "]<br>";
			Log.debug("llmAccessCheck() start test for " + llmConfig.url + " apikey:" + llmConfig.apikey);
			String answer = AIChatTest(llmConfig.url, llmConfig.apikey, llmConfig.modelName, "你好，请简单介绍一下你自己?");
			checkResult.info += answer + "<br>";
		}				
		return true;
	}

	private static String AIChatTest(String url, String apikey, String modelName, String query) 
	{
		//String deepSeekModel = "deepseek-chat";
		//		"https://api.deepseek.com"
		//		apiKey = "sk-1c5db7f9212f474fb03f8ead78ea739d";
		
		//String llama321b = "llama3.2:1b";
		//		baseUrl = "http://localhost:11434/v1/";
		//		apiKey = "sk-";
				
        ChatLanguageModel chatModel = OpenAiChatModel.builder()
        		.baseUrl(url)
        		.apiKey(apikey)
        		.modelName(modelName)
        		.temperature(0.7)
        		.maxTokens(1000)
                .logRequests(true)
                .build();

        
        UserMessage userMessage = UserMessage.from(
                TextContent.from(query)
        );

        Response<AiMessage> chatResponse = chatModel.generate(userMessage);

        String answer = chatResponse.content().text();
        Log.debug("AIChatTest() answer:" + answer);
        return answer;
	}
}
