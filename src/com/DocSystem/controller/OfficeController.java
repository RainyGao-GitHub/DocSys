package com.DocSystem.controller;

import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

@Controller
@RequestMapping("/web/static/office-editor/doc")
public class OfficeController extends BaseController{
	// get请求
	@RequestMapping(value="/{key}/c/info", method=RequestMethod.GET, produces="application/json;charset=UTF-8")
	//@RequestMapping(value="/{key}/c/info", method=RequestMethod.GET)
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
	
//	// post请求
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