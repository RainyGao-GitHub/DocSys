package com.DocSystem.controller;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
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

	/****------ fetch Interfaces For RAG Controller ------------------***/
	/****************** add DocSysRagMesage **************/
	@RequestMapping("/addDocSysRagMessage.do")
	public ResponseBodyEmitter addDocSysRagMessage(String modelName, String query, String apiKey, HttpSession session,HttpServletRequest request,HttpServletResponse response){
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
		StreamingChatLanguageModel chatModel = OpenAiStreamingChatModel.builder()
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

        ResponseBodyEmitter emitter = new ResponseBodyEmitter();
        chatModel.generate(userMessage, new StreamingResponseHandler<AiMessage>() {
            @Override
            public void onNext(String token) {
                System.out.println("onNext(): " + token);
                try {
					emitter.send(token);
				} catch (IOException e) {
					e.printStackTrace();
				}
            }

            @Override
            public void onComplete(Response<AiMessage> resp) {
                System.out.println("onComplete(): " + resp);
				emitter.complete();
            }

            @Override
            public void onError(Throwable error) {
                error.printStackTrace();
                emitter.completeWithError(error);
            }
        });
        return emitter;

	}
}
