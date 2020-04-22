package com.DocSystem.controller;

import javax.servlet.ServletRequest;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import com.DocSystem.entity.User;

/** 
 * @ClassName: MyInterceptor 
 * @Description: 系统拦截器
 * @author zhanjp zhanjp@sunyard.com
 * @date 2015-8-12 下午3:10:55 
 * @version V1.0   
 */
public class MyInterceptor extends HandlerInterceptorAdapter{

	//被允许的url
	private String[] allowedUrl = 
	{
		//登录	
		"login",
		"logout",
		//注册
		"register",
		"sendVerifyCode",
		//意见反馈
		"feeback",
		//系统管理
		"Manage/getSystemLog", 
		"Manage/importDBData",
		"Manage/docSysInit",
		"Manage/getBannerConfig",
		//文件分享
		"Doc/getDocShare",
		"Repos/getRepos",
		"Repos/getReposInitMenu",
		"Repos/getSubDocList",		
		"Doc/getDoc",
		"Doc/addDoc",
		"Doc/deleteDoc",
		"Doc/uploadDoc",
		"Doc/copyDoc",
		"Doc/moveDoc",
		"Doc/renameDoc",
		"Doc/downloadDocPrepare",
		"Doc/downloadHistoryDocPrepare",
		"Doc/downloadDoc",
		"Doc/saveDoc",
		"Doc/doGetTmpFile",
		"Doc/DocToPDF",
		"Doc/lockDoc",
		"Doc/checkDocInfo",
		"Doc/checkChunkUploaded",
		"Doc/getDocContent",
		"Doc/updateDocContent",
		"Doc/uploadMarkdownPic",
		"Doc/tmpSaveDocContent",
		"Doc/getTmpSavedDocContent",
		"Doc/deleteTmpSavedDocContent",
		"Doc/getDocHistory",
		"Doc/getHistoryDetail",
		"Doc/revertDocHistory",
		"Doc/searchDoc",
		"Doc/refreshDoc",
		"web/static/doc",
	};
	
	
	@Override
	public void afterCompletion(HttpServletRequest request,
			HttpServletResponse response, Object handler, Exception ex)
			throws Exception {
		// TODO Auto-generated method stub
		super.afterCompletion(request, response, handler, ex);
	}

	@Override
	public void afterConcurrentHandlingStarted(HttpServletRequest request,
			HttpServletResponse response, Object handler) throws Exception {
		// TODO Auto-generated method stub
		super.afterConcurrentHandlingStarted(request, response, handler);
	}

	@Override
	public void postHandle(HttpServletRequest request,
			HttpServletResponse response, Object handler,
			ModelAndView modelAndView) throws Exception {
		// TODO Auto-generated method stub
		super.postHandle(request, response, handler, modelAndView);
	}

	/**
	 * 请求到达controller之前调用此方法
	 */
	@Override
	public boolean preHandle(HttpServletRequest request,
			HttpServletResponse response, Object handler) throws Exception {
		
		String uri = request.getRequestURI();
		String params = request.getQueryString();
		User user;
		
		HttpSession session = request.getSession();
		System.out.println(uri);
		user = (User) session.getAttribute("login_user");
		
		if(isAjaxRequest(request)){
			return true;
		}
		if(user!=null){
			return true;
		}
		
		for(String s:allowedUrl){
			if(uri.contains(s)){
				return true;
			}
			if(params!=null&&params.contains(s)){
				return true;
			}
		}
		
		// TODO Auto-generated method stub
		response.sendRedirect("tologin.do?option=reload");
		return false;
	}

	/**
	 * 判断请求是否为ajax请求
	 * @param req
	 * @return
	 */
	public boolean isAjaxRequest(ServletRequest req){
		HttpServletRequest request = (HttpServletRequest)req;
		String requestType = request.getHeader("X-Requested-With");
        if (requestType != null && requestType.equals("XMLHttpRequest")) {
            return true;
        } else {
            return false;
        }
	}
	
}
