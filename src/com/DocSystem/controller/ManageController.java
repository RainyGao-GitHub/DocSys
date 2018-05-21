package com.DocSystem.controller;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.tmatesoft.svn.core.SVNException;

import util.ReturnAjax;
import util.SvnUtil.SVNUtil;

import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.User;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.entity.UserGroup;

import com.DocSystem.service.UserService;
import com.DocSystem.service.impl.ReposServiceImpl;
import com.DocSystem.service.impl.UserServiceImpl;

import com.DocSystem.controller.BaseController;
import com.alibaba.fastjson.JSON;

@Controller
@RequestMapping("/Manage")
public class ManageController extends BaseController{
	@Autowired
	private UserServiceImpl userService;
	
	/********** 获取用户列表 ***************/
	@RequestMapping("/getUserList.do")
	public void getUserList(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getUserList()");
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//获取All UserList
		List <User> UserList = getAllUsers();
		
		rt.setData(UserList);
		writeJson(rt, response);
	}

	private List<User> getAllUsers() {
		List <User> UserList = userService.geAllUsers();
		return UserList;
	}

	/********** 获取用户组列表 ***************/
	@RequestMapping("/getGroupList.do")
	public void getGroupList(HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getGroupList()");
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//获取All UserList
		List <UserGroup> GroupList = getAllGroups();
		
		rt.setData(GroupList);
		writeJson(rt, response);
	}

	private List<UserGroup> getAllGroups() {
		List <UserGroup> GroupList = userService.geAllGroups();
		return GroupList;
	}

}
