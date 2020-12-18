package com.DocSystem.controller;

import java.util.Enumeration;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

@Controller
@RequestMapping("/web/static/office-editor")
public class OfficeController extends BaseController{
	// get请求
	@RequestMapping(value="/doc/{key}/c/info", method=RequestMethod.GET, produces="application/json;charset=UTF-8")
	public void getInfo(@PathVariable("key") String key, HttpServletResponse response) {
		
		System.out.println("getInfo key:" + key);
		JSONObject jobj = new JSONObject();
		jobj.put("websocket", true);
		jobj.put("origins", "*:*");
		jobj.put("cookie_needed", false);
		jobj.put("entropy", "2782586626");
		writeJson(jobj, response);
		//{"websocket":true,"origins":["*:*"],"cookie_needed":false,"entropy":3999383772} //前端期望的返回		
    }
	
	// get请求
	@RequestMapping(value="/spellchecker/doc/{key}/c/info", method=RequestMethod.GET, produces="application/json;charset=UTF-8")
	public void getSpellCheckerInfo(@PathVariable("key") String key, HttpServletResponse response) {
		
		System.out.println("getSpellCheckerInfo key:" + key);
		JSONObject jobj = new JSONObject();
		jobj.put("websocket", true);
		jobj.put("origins", "*:*");
		jobj.put("cookie_needed", false);
		jobj.put("entropy", "2782586626");
		writeJson(jobj, response);
		//{"websocket":true,"origins":["*:*"],"cookie_needed":false,"entropy":3999383772} //前端期望的返回		
    }
	
	// get请求
	@RequestMapping(value="/{key}/c/{val1}/{val2}/jsonp", method=RequestMethod.GET, produces="application/json;charset=UTF-8")
	public void jsonp(@PathVariable("key") String key, HttpServletResponse response) {
		
		System.out.println("jsonp key:" + key);
		JSONObject jobj = new JSONObject();
		jobj.put("websocket", true);
		jobj.put("origins", "*:*");
		jobj.put("cookie_needed", false);
		jobj.put("entropy", "2782586626");
		writeJson(jobj, response);
    }
	
	// get请求
	@RequestMapping(value="/{key}/c/iframe.html", method=RequestMethod.GET, produces="application/json;charset=UTF-8")
	public void getIframe(@PathVariable("key") String key, HttpServletResponse response) {
		
		System.out.println("getIframe key:" + key);
		JSONObject jobj = new JSONObject();
		jobj.put("websocket", true);
		jobj.put("origins", "*:*");
		jobj.put("cookie_needed", false);
		jobj.put("entropy", "2782586626");
		writeJson(jobj, response);
    }

    // post请求
	@RequestMapping(value="/{key}/c/{val1}/{val2}/xhr", method=RequestMethod.POST, produces="application/json;charset=UTF-8")
	public void xhr(@PathVariable("key") String key, HttpServletResponse response) {
		System.out.println("xhr key:" + key);
		JSONObject jobj = new JSONObject();
		jobj.put("websocket", true);
		jobj.put("origins", "*:*");
		jobj.put("cookie_needed", false);
		jobj.put("entropy", "2782586626");
		writeJson(jobj, response);
    }
	
    // post请求
	@RequestMapping(value="/downloadas/{key}", method=RequestMethod.POST, produces="application/json;charset=UTF-8")
	public void downloadas(@PathVariable("key") String key, 
		HttpSession session, HttpServletRequest request, HttpServletResponse response) {
		System.out.println("downloadas key:" + key);
		printRequestParams(request);
		
		JSONObject jobj = new JSONObject();
		jobj.put("websocket", true);
		jobj.put("origins", "*:*");
		jobj.put("cookie_needed", false);
		jobj.put("entropy", "2782586626");
		writeJson(jobj, response);
    }

	private void printRequestParams(HttpServletRequest request) {
		//Print All request params
		System.out.println("printRequestParams request params:");  
		Enumeration<String> enu=request.getParameterNames();  
		while(enu.hasMoreElements()){  
			String paraName=(String)enu.nextElement();  
			System.out.println(paraName+": "+request.getParameter(paraName));  
		}
	}
	
//	@RequestMapping(value="/restfulUser", method=RequestMethod.POST, produces="application/json;charset=UTF-8")
//	public String postUser(String name, Integer age) {
//	    return "接收到POST："+name+" "+age;
//        }
// 
//	// DELETE请求
//	@RequestMapping(value="/restfulUser", method=RequestMethod.DELETE, produces="application/json;charset=UTF-8")
//	public String deleteUser(String name, Integer age) {
//	    return "接收到DELETE："+name+" "+age;
//	}
// 
//	// put请求
//	@RequestMapping(value="/restfulUser", method=RequestMethod.PUT, produces="application/json;charset=UTF-8")
//	public String putUser(String name, Integer age) {
//	    return "接收到PUT："+name+" "+age;
//	}	
}