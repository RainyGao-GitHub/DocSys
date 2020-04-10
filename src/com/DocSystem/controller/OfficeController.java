package com.DocSystem.controller;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/web/static/doc")
public class OfficeController extends BaseController{
	@RequestMapping(value = "/{id}", method = RequestMethod.GET)
    public @ResponseBody String show(@PathVariable Integer id, HttpServletRequest request,
            HttpServletResponse response) {
		System.out.println("show id:" + id);
		return "test";
    }

	
	// get请求
	//@RequestMapping(value="/{key}/c/info", method=RequestMethod.GET, produces="application/json;charset=UTF-8")
	@RequestMapping(value="/{key}/c/info", method=RequestMethod.GET)
	@ResponseBody
	public String getInfo(@PathVariable("key") String key, HttpServletResponse response) {
		
		System.out.println("getInfo key:" + key);

		String ret = "{\"websocket\":true,\"origins\":[\"*:*\"],\"cookie_needed\":false,\"entropy\":2782586626}";
		//writeText(ret, response);
		return ret;
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