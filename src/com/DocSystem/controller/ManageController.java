package com.DocSystem.controller;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.tmatesoft.svn.core.SVNException;

import util.RegularUtil;
import util.ReturnAjax;
import util.SvnUtil.SVNUtil;

import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.GroupMember;
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

	@Autowired
	private ReposServiceImpl reposService;
	
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
		
		if(login_user.getType() < 1)
		{
			rt.setError("非管理员用户，请联系统管理员！");
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

	
	@RequestMapping(value="addUser")
	public void addUser(User user, HttpSession session,HttpServletResponse response)
	{
		System.out.println("addUser");
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		if(login_user.getType() < 1)
		{
			rt.setError("非管理员用户，请联系统管理员！");
			writeJson(rt, response);			
			return;
		}
		
		String userName = user.getName();
		String pwd = user.getPwd();
		Integer type = user.getType();

		System.out.println("userName:"+userName + " pwd:"+pwd + "type:" + type);
		
		//检查是否越权设置
		if(type > login_user.getType())
		{
			rt.setError("danger#越权操作！");
			writeJson(rt, response);
			return;
		}
		
		//检查用户名是否为空
		if(userName ==null||"".equals(userName))
		{
			rt.setError("danger#账号不能为空！");
			writeJson(rt, response);
			return;
		}
		
		
		if(RegularUtil.isEmail(userName))	//邮箱注册
		{
			if(isUserRegistered(userName) == true)
			{
				rt.setError("error#该邮箱已注册！");
				writeJson(rt, response);
				return;
			}
		}
		else if(RegularUtil.IsMobliePhone(userName))
		{
			if(isUserRegistered(userName) == true)
			{
				rt.setError("error#该手机已注册！");
				writeJson(rt, response);
				return;
			}
		}
		else
		{
			if(isUserRegistered(userName) == true)
			{
				rt.setError("error#该用户名已注册！");
				writeJson(rt, response);
				return;
			}
		}
		
		//检查密码是否为空
		if(pwd==null||"".equals(pwd))
		{
			rt.setError("danger#密码不能为空！");
			writeJson(rt, response);
			return;
		}
		
		user.setCreateType(2);	//用户为管理员添加
		//set createTime
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
		String createTime = df.format(new Date());// new Date()为获取当前系统时间
		user.setCreateTime(createTime);	//设置川剧时间

		if(userService.addUser(user) == 0)
		{
			rt.setError("Failed to add new User in DB");
		}
		
		writeJson(rt, response);
		return;
	}
	
	@RequestMapping(value="editUser")
	public void editUser(User user, HttpSession session,HttpServletResponse response)
	{
		System.out.println("editUser");
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			rt.setError("非管理员用户，请联系统管理员！");
			writeJson(rt, response);			
			return;
		}
		
		Integer userId = user.getId();
		String userName = user.getName();
		Integer type = user.getType();
		String pwd = user.getPwd();
		
		System.out.println("userName:"+userName + "type:" + type  + " pwd:" + pwd);
		
		//检查是否越权设置
		if(type > login_user.getType())
		{
			rt.setError("danger#越权操作！");
			writeJson(rt, response);
			return;
		}
		
		//不得修改同级别或高级别用户的信息
		User tempUser  = userService.getUser(userId);
		if(tempUser.getType() >= login_user.getType())
		{
			rt.setError("danger#越权操作！");
			writeJson(rt, response);
			return;			
		}
		
		if(userId == null)
		{
			rt.setError("用户ID不能为空");
			writeJson(rt, response);
			return;
		}
		
		if(userService.editUser(user) == 0)
		{
			rt.setError("更新数据库失败");
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
		return;
	}
	
	@RequestMapping(value="resetPwd")
	public void resetPwd(User user, HttpSession session,HttpServletResponse response)
	{
		System.out.println("resetPwd");
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			rt.setError("非管理员用户，请联系统管理员！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 2)
		{
			rt.setError("您无权进行此操作！");
			writeJson(rt, response);
			return;			
		}
		
		Integer userId = user.getId();
		String pwd = user.getPwd();
		
		System.out.println("userId:" +userId + " pwd:" + pwd);
	
		if(userId == null)
		{
			rt.setError("用户ID不能为空");
			writeJson(rt, response);
			return;
		}
		
		//不得修改同级别或高级别用户的信息
		if(userId != login_user.getId())
		{
			User tempUser  = userService.getUser(userId);
			if(tempUser.getType() >= login_user.getType())
			{
				rt.setError("danger#越权操作！");
				writeJson(rt, response);
				return;			
			}
		}	
				
		
		if(userService.editUser(user) == 0)
		{
			rt.setError("更新数据库失败");
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
		return;
	}

	
	@RequestMapping(value="delUser")
	public void delUser(Integer userId, HttpSession session,HttpServletResponse response)
	{
		System.out.println("delUser " + userId);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			rt.setError("非管理员用户，请联系统管理员！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 2)
		{
			rt.setError("您无权进行此操作！");
			writeJson(rt, response);
			return;			
		}
		
		if(userService.delUser(userId) == 0)
		{
			rt.setError("Failed to delete User in DB");
			writeJson(rt, response);
			return;		
		}
		else
		{
			//Delete all related ReposAuth \ DocAuth \GroupMember Infos
			DocAuth docAuth = new DocAuth();
			docAuth.setUserId(userId);
			reposService.deleteDocAuthSelective(docAuth);

			ReposAuth reposAuth = new ReposAuth();
			reposAuth.setUserId(userId);
			reposService.deleteReposAuthSelective(reposAuth);
			
			GroupMember groupMember = new GroupMember();
			groupMember.setUserId(userId);
			userService.deleteGroupMemberSelective(groupMember);
		}
		
		writeJson(rt, response);
		return;		
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
		
		if(login_user.getType() < 1)
		{
			rt.setError("非管理员用户，请联系统管理员！");
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
	
	@RequestMapping(value="addGroup")
	public void addGroup(UserGroup group, HttpSession session,HttpServletResponse response)
	{
		System.out.println("addGroup");
		String name = group.getName();
		String info = group.getInfo();
		
		System.out.println("name:"+name + " info:"+info);
		ReturnAjax rt = new ReturnAjax();
		
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			rt.setError("非管理员用户，请联系统管理员！");
			writeJson(rt, response);			
			return;
		}
		
		//检查用户名是否为空
		if(name ==null||"".equals(name))
		{
			rt.setError("组名不能为空！");
			writeJson(rt, response);
			return;
		}
		
		if(isGroupExist(name) == true)
		{
			rt.setError("用户组 " + name + " 已存在！");
			writeJson(rt, response);
			return;
		}
	
		//set createTime
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
		String createTime = df.format(new Date());// new Date()为获取当前系统时间
		group.setCreateTime(createTime);	//设置川剧时间

		if(userService.addGroup(group) == 0)
		{
			rt.setError("Failed to add new Group in DB");
		}
		
		writeJson(rt, response);
		return;
	}

	private boolean isGroupExist(String name) {
		UserGroup qGroup = new UserGroup();
		//检查用户名是否为空
		if(name==null||"".equals(name))
		{
			return true;
		}
			
		qGroup.setName(name);
		List<UserGroup> list = userService.getGroupListByGroupInfo(qGroup);
		if(list == null || list.size() == 0)
		{
			return false;
		}
		return true;
	}
	
	@RequestMapping(value="delGroup")
	public void delGroup(Integer id, HttpSession session,HttpServletResponse response)
	{
		System.out.println("delGroup " + id);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			rt.setError("非管理员用户，请联系统管理员！");
			writeJson(rt, response);			
			return;
		}
		
		if(userService.delGroup(id) == 0)
		{
			rt.setError("Failed to delete Group from DB");
			writeJson(rt, response);
			return;		
		}
		else
		{
			//Delete all related ReposAuth \ DocAuth \GroupMember Infos
			DocAuth docAuth = new DocAuth();
			docAuth.setGroupId(id);
			reposService.deleteDocAuthSelective(docAuth);
	
			ReposAuth reposAuth = new ReposAuth();
			reposAuth.setGroupId(id);
			reposService.deleteReposAuthSelective(reposAuth);
			
			GroupMember groupMember = new GroupMember();
			groupMember.setGroupId(id);
			userService.deleteGroupMemberSelective(groupMember);
		}
		
		writeJson(rt, response);
		return;		
	}
	
	@RequestMapping(value="editGroup")
	public void editGroup(UserGroup group, HttpSession session,HttpServletResponse response)
	{
		System.out.println("editGroup");

		Integer groupId = group.getId();
		String name = group.getName();
		String info = group.getInfo();

		System.out.println("name:"+name + " info:"+info);
	
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			rt.setError("非管理员用户，请联系统管理员！");
			writeJson(rt, response);			
			return;
		}
		
		if(groupId == null || "".equals(groupId))
		{
			rt.setError("用户组ID不能为空");
			writeJson(rt, response);
			return;
		}
		
		if(userService.editGroup(group) == 0)
		{
			rt.setError("更新数据库失败");
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
		return;
	}
	
	/********** 获取系统所有用户 ：前台用于给group添加访问用户，返回的结果实际上是groupMember列表***************/
	@RequestMapping("/getGroupAllUsers.do")
	public void getGroupAllUsers(Integer groupId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getGroupAllUsers groupId: " + groupId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			rt.setError("非管理员用户，请联系统管理员！");
			writeJson(rt, response);			
			return;
		}
		
		List <GroupMember> UserList = userService.getGroupAllUsers(groupId);	
		printObject("UserList:",UserList);
		
		rt.setData(UserList);
		writeJson(rt, response);
	}
	
	@RequestMapping(value="addGroupMember")
	public void addGroupMember(Integer groupId,Integer userId, HttpSession session,HttpServletResponse response)
	{
		System.out.println("addGroupMember groupId:" + groupId + " userId:" + userId);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			rt.setError("非管理员用户，请联系统管理员！");
			writeJson(rt, response);			
			return;
		}
		
		//检查GroupId是否为空
		if(groupId ==null||"".equals(groupId))
		{
			rt.setError("组ID不能为空！");
			writeJson(rt, response);
			return;
		}
		
		//检查用户ID是否为空
		if(userId ==null||"".equals(userId))
		{
			rt.setError("用户ID不能为空！");
			writeJson(rt, response);
			return;
		}
		GroupMember groupMember = new GroupMember();
		groupMember.setGroupId(groupId);
		groupMember.setUserId(userId);
		
		if(isGroupMemberExist(groupMember) == true)
		{
			System.out.println("addGroupMember() 用户 " + userId + " 已是该组成员！");
			rt.setError("用户 " + userId + " 已是该组成员！");
			writeJson(rt, response);
			return;
		}
	
		if(userService.addGroupMember(groupMember) == 0)
		{
			System.out.println("addGroupMember() Failed to add groupMember");
			rt.setError("Failed to add new GroupMember in DB");
			writeJson(rt, response);
			return;
		}
		
		writeJson(rt, response);
		return;
	}

	private boolean isGroupMemberExist(GroupMember groupMember) {
		List<UserGroup> list = userService.getGroupMemberListByGroupMemberInfo(groupMember);
		if(list == null || list.size() == 0)
		{
			return false;
		}
		return true;
	}
	
	@RequestMapping(value="delGroupMember")
	public void delGroupMember(Integer id, HttpSession session,HttpServletResponse response)
	{
		System.out.println("delGroupMember " + id);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			rt.setError("非管理员用户，请联系统管理员！");
			writeJson(rt, response);			
			return;
		}
		
		if(userService.delGroupMember(id) == 0)
		{
			rt.setError("Failed to delete GroupMember from DB");
		}
		
		writeJson(rt, response);
		return;		
	}
	
	@RequestMapping(value="getSystemLog")
	public void getSystemLog(String fileName,HttpSession session,HttpServletRequest request,HttpServletResponse response) throws Exception{
		System.out.println("getSystemLog: " + fileName);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() < 1)
		{
			rt.setError("非管理员用户，请联系统管理员！");
			writeJson(rt, response);			
			return;
		}
		
		String localParentPath = getSystemLogParentPath();
		if(fileName == null || "".equals(fileName))
		{
			fileName = getSystemLogFileName();
		}
		
		sendTargetToWebPage(localParentPath,fileName, localParentPath, rt, response, request, false);
		return;		
	}
	

}
