package com.DocSystem.controller;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.output.Response;

import com.DocSystem.common.Log;
import com.alibaba.fastjson.JSONObject;

import util.ReturnAjax;



/*
Something you need to know
 */

@Controller
@RequestMapping("/Query")
public class QueryController extends BaseController{

	/****------ Ajax Interfaces For RAG Controller ------------------***/ 
	/****************** add DocSysRagMesage **************/
	@RequestMapping("/addDocSysRagMessage.do")
	public void addDocSysRagMessage(String modelName, String query, String apiKey, HttpSession session,HttpServletRequest request,HttpServletResponse response){
		Log.infoHead("******************addDocSysRagMessage.do ***********************");
		Log.infoHead("modelName: " + modelName + " query: " + query);
		ReturnAjax rt = new ReturnAjax();		
		JSONObject config = new JSONObject();
		String baseUrl = new String("");
		String deepSeekModel = "deepseek-chat";
		String llama321b = "llama3.2:1b";
		
		if (modelName.equals(deepSeekModel)) {
			baseUrl = "https://api.deepseek.com";
					
		}
		if (modelName.equals(llama321b)) {
			baseUrl = "http://localhost:11434/v1/";
			apiKey = "sk-";
			
		}	
		Log.infoHead("modelName: " + modelName + " query: " + query + " baseUrl:" + baseUrl + " apiKy: " + apiKey);
        ChatLanguageModel chatModel = OpenAiChatModel.builder()
        		.baseUrl(baseUrl)
        		.apiKey(apiKey)
        		.modelName(modelName)
        		.temperature(0.7)
        		.maxTokens(1000)
                .logRequests(true)
                .build();

        
        UserMessage userMessage = UserMessage.from(
                TextContent.from(query)
        );

        Response<AiMessage> chatResponse = chatModel.generate(userMessage);

        System.out.println(chatResponse);
        String answer = chatResponse.content().text();
		config.put("answer", answer);
		rt.setData(config);
		writeJson(rt, response);
	}
}
