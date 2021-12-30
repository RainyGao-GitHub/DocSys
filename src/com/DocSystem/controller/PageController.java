package com.DocSystem.controller;

import java.net.URL;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;

import com.DocSystem.common.Log;

@Controller
public class PageController extends BaseController{
	
	@RequestMapping(value="pageTo")
	public String pageTo(HttpServletRequest request,HttpSession session,URL url,String p,ModelMap model){
		Log.info("pageTo: " + p);
		return p;
	}
}
