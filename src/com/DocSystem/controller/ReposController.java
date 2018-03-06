package com.DocSystem.controller;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
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
import com.DocSystem.entity.UserDocAuth;

import com.DocSystem.service.UserService;
import com.DocSystem.service.impl.ReposServiceImpl;
import com.DocSystem.service.impl.UserServiceImpl;

import com.DocSystem.controller.BaseController;
import com.alibaba.fastjson.JSON;

@Controller
@RequestMapping("/Repos")
public class ReposController extends BaseController{
	@Autowired
	private ReposServiceImpl reposService;
	@Autowired
	private UserServiceImpl userService;
	
	/****------ Ajax Interfaces For Repository Controller ------------------***/ 
	/****************** get Repository List **************/
	@RequestMapping("/getReposList.do")
	public void getReposList(HttpSession session,HttpServletResponse response){
		System.out.println("getReposList");
		ReturnAjax rt = new ReturnAjax();
		
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() == 2)	//超级管理员
		{
			List<Repos> reposList = reposService.getAllReposList();
			rt.setData(reposList);
		}
		else
		{
			Integer UserId = login_user.getId();
			System.out.println("UserId:" + UserId);
			List<Repos> authedReposList = reposService.getAuthedReposList(UserId);
			rt.setData(authedReposList);
		}
		writeJson(rt, response);
	}
	
	/****************** get Repository **************/
	@RequestMapping("/getRepos.do")
	public void getRepos(Integer vid,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("getRepos vid: " + vid);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		Repos repos = reposService.getRepos(vid);
		rt.setData(repos);
		writeJson(rt, response);
	}

	/****************   add a Repository ******************/
	@RequestMapping("/addRepos.do")
	public void addRepos(String name,String info, Integer type, String path, Integer verCtrl, String svnPath,String svnUser,String svnPwd, 
			Integer verCtrl1, String svnPath1,String svnUser1,String svnPwd1, String createTime,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("addRepos name: " + name + " info: " + info + " type: " + type + " path: " + path + " verCtrl: " + verCtrl  + " svnPath: " + svnPath + " svnUser: " + svnUser + " svnPwd: " + svnPwd + " verCtrl1: " + verCtrl1  + " svnPath1: " + svnPath1 + " svnUser1: " + svnUser1 + " svnPwd1: " + svnPwd1);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		if(login_user.getType() == 0)
		{
			rt.setError("普通用户不支持新建仓库！");
			writeJson(rt, response);			
			return;
		}
		
		//检查传入的参数
		if((name == null) || name.equals(""))
		{
			rt.setError("仓库名不能为空！");
			writeJson(rt, response);			
			return;
		}
		if((info == null) || info.equals(""))
		{
			rt.setError("仓库描述不能为空！");
			writeJson(rt, response);			
			return;
		}
		if((path == null) || path.equals(""))
		{
			path = getDefaultReposRootPath();
		}
		else
		{
			//检查path的格式并修正：必须以/结尾
			path = reposRootPathFormat(path);
		}

		//确定是否存在相同路径的仓库
		Repos tmpRepos = new Repos();
		tmpRepos.setName(name);
		tmpRepos.setPath(path);
		List<Repos> list = reposService.getReposList(tmpRepos);
		if((list != null) && (list.size() > 0))
		{
			rt.setError("仓库已存在:" + path + name);
			writeJson(rt, response);	
			return;
		}
		
		//add a new repos
		Repos repos = new Repos();
		repos.setName(name);
		repos.setInfo(info);
		repos.setType(type);
		repos.setPath(path);
		repos.setOwner(login_user.getId());
		repos.setCreateTime(createTime);
		if(reposService.addRepos(repos) == 0)
		{
			rt.setError("新增仓库记录失败");
			writeJson(rt, response);		
			return;
		}
		System.out.println("new ReposId" + repos.getId());
		
		//如果RealDoc是带版本控制的话，路径不能为空
		if(verCtrl == 1)	//目前只处理svn
		{
			if((svnPath == null) || svnPath.equals(""))
			{
				//Create a local SVN Repos
				String localReposPath = getDefaultSvnLocalReposPath();
				String reposName = repos.getId() + "";
				File dir = new File(localReposPath,reposName);
				if(dir.exists())
				{
					rt.setError("SVN仓库:"+localReposPath+reposName + "已存在，请直接设置！");
					writeJson(rt, response);	
					return;
				}
				
				svnPath = SVNUtil.CreateRepos(reposName,localReposPath);
				if(svnPath == null)
				{
					rt.setError("SVN仓库的创建失败");
					writeJson(rt, response);	
					return;
				}
				repos.setSvnPath(svnPath);
				svnUser = "";
				svnPwd = "";
			}
				
			/* svnUser和svnPwd可以不设置，有些svn或git仓库不需要鉴权信息
			if((svnUser == null) || svnUser.equals(""))
			{
				rt.setError("svnUser不能为空");
				writeJson(rt, response);	
				return;
			}
			if((svnPwd == null) || svnPwd.equals(""))
			{
				rt.setError("svnPwd不能为空");
				writeJson(rt, response);	
				return;
			}
			*/
			
			//检查SVN路径是否已使用
			Repos tmpRepos1 = new Repos();
			tmpRepos1.setSvnPath(svnPath);
			List<Repos> list1= reposService.getReposList(tmpRepos1);
			if((list1 != null) && (list1.size() > 0))
			{
				rt.setError("仓库的SvnPath已使用:" + svnPath);
				writeJson(rt, response);	
				return;
			}
			
			repos.setVerCtrl(verCtrl);
			repos.setSvnPath(svnPath);
			repos.setSvnUser(svnUser);
			repos.setSvnPwd(svnPwd);
		}
		
		//如果VirtualDoc是带版本控制的话，路径不能为空
		if(verCtrl1 == 1)	//目前只处理svn
		{
			if((svnPath1 == null) || svnPath1.equals(""))
			{
				//Create a local SVN Repos
				String localReposPath = getDefaultSvnLocalReposPath();
				String reposName = repos.getId() + "_VRepos";
				File dir = new File(localReposPath,reposName);
				if(dir.exists())
				{
					rt.setError("SVN仓库:"+localReposPath+reposName + "已存在，请直接设置！");
					writeJson(rt, response);	
					return;
				}
				
				svnPath1 = SVNUtil.CreateRepos(reposName,localReposPath);
				if(svnPath1 == null)
				{
					rt.setError("SVN仓库的创建失败");
					writeJson(rt, response);	
					return;
				}
				repos.setSvnPath1(svnPath1);
				svnUser1 = "";
				svnPwd1 = "";
			}
				
			/* svnUser和svnPwd可以不设置，有些svn或git仓库不需要鉴权信息
			if((svnUser1 == null) || svnUser1.equals(""))
			{
				rt.setError("svnUser1不能为空");
				writeJson(rt, response);	
				return;
			}
			if((svnPwd1 == null) || svnPwd1.equals(""))
			{
				rt.setError("svnPwd1不能为空");
				writeJson(rt, response);	
				return;
			}
			*/
			
			//检查SVN路径是否已使用
			Repos tmpRepos1 = new Repos();
			tmpRepos1.setSvnPath1(svnPath1);
			List<Repos> list1= reposService.getReposList(tmpRepos1);
			if((list1 != null) && (list1.size() > 0))
			{
				rt.setError("仓库的SvnPath1已使用:" + svnPath1);
				writeJson(rt, response);	
				return;
			}
			
			repos.setVerCtrl1(verCtrl1);
			repos.setSvnPath1(svnPath1);
			repos.setSvnUser1(svnUser1);
			repos.setSvnPwd1(svnPwd1);
		}
		
		//新建目录
		String reposDir = path + repos.getId();
		if(createDir(reposDir) == true)
		{
			if(createDir(reposDir+"/data") == false)
			{
				rt.setError("创建data目录失败");
				writeJson(rt, response);	
				return;
				
			}
			else
			{
				if(createDir(reposDir+"/data/rdata") == false)
				{
					rt.setError("创建rdata目录失败");
					writeJson(rt, response);	
					return;
				}
				if(createDir(reposDir+"/data/vdata") == false)
				{
					rt.setError("创建vdata目录失败");
					writeJson(rt, response);	
					return;
				}
			}
			
			if(createDir(reposDir+"/refData") == false)
			{
				rt.setError("创建refData目录失败");
				writeJson(rt, response);	
				return;
				
			}
			else
			{
				if(createDir(reposDir+"/refData/rdata") == false)
				{
					rt.setError("创建refData/rdata目录失败");
					writeJson(rt, response);	
					return;
				}
				if(createDir(reposDir+"/refData/vdata") == false)
				{
					rt.setError("创建refData/vdata目录失败");
					writeJson(rt, response);	
					return;
				}
			}
			
			if(createDir(reposDir+"/tmp") == false)
			{
				rt.setError("创建tmp目录失败");
				writeJson(rt, response);	
				return;
			}
			if(createDir(reposDir+"/backup") == false)
			{
				rt.setError("创建backup目录失败");
				writeJson(rt, response);	
				return;
			}			
			//Real Doc 带版本控制，则需要同步本地和版本仓库
			if(verCtrl == 1)
			{					
				String reposRPath = getReposRealPath(repos);
				String commitUser = login_user.getName();
				String commitMsg = "RealDoc版本仓库初始化";
				if(svnAutoCommit(svnPath,svnUser,svnPwd,reposRPath,commitMsg,commitUser,false,null) == false)
				{
					rt.setError("RealDoc版本仓库初始化失败");
					writeJson(rt, response);	
					return;
				}
			}
			
			//Virtual Doc 带版本控制，则需要同步本地和版本仓库
			if(verCtrl1 == 1)
			{					
				String reposVPath = getReposVirtualPath(repos);
				String commitUser = login_user.getName();
				String commitMsg = "VirtualDoc版本仓库初始化";
				if(svnAutoCommit(svnPath1,svnUser1,svnPwd1,reposVPath,commitMsg,commitUser,false,null) == false)
				{
					rt.setError("VirtualDoc版本仓库初始化失败");
					writeJson(rt, response);	
					return;
				}
			}
			
			//更新仓库的信息: svnPath 和 path
			if(reposService.updateRepos(repos) == 0)
			{
				rt.setError("新增仓库记录失败");
				writeJson(rt, response);		
				return;
			}
			
			//将当前用户加入到仓库的访问权限列表中
			ReposAuth reposAuth = new ReposAuth();
			reposAuth.setReposId(repos.getId());
			reposAuth.setUserId(login_user.getId());
			reposAuth.setIsAdmin(1); //设置为管理员，可以管理仓库，修改描述、设置密码、设置用户访问权限
			reposAuth.setAccess(1);	//0：不可访问  1：可访问
			//当用户操作仓库下的文件时，首先检查当前用户对当前文件的操作权限，否则继承其父节点的访问权限，如果所有的父节点都没有设置的话，则沿用仓库的访问权限
			reposAuth.setEditEn(1);	//可以修改仓库中的文件和目录
			reposAuth.setAddEn(1);		//可以往仓库中增加文件或目录
			reposAuth.setDeleteEn(1);	//可以删除仓库中的文件或目录
			int ret = reposService.addReposAuth(reposAuth);
			System.out.println("addReposAuth return:" + ret);
			if(ret == 0)
			{
				System.out.println("设置用户仓库权限失败");
			}
		}
		else
		{
			System.out.println("创建仓库根目录失败");
			rt.setError("创建仓库根目录失败");
			writeJson(rt, response);	
			return;
		}		
		
		writeJson(rt, response);	
	}
	
	//本地SVN仓库的默认存放位置：后续考虑通过配置来确定
	private String getDefaultSvnLocalReposPath() {
		String localReposPath = "";
		String os = System.getProperty("os.name");  
		System.out.println("OS:"+ os);  
		if(os.toLowerCase().startsWith("win")){  
			localReposPath = "D:/DocSysSvnReposes/";
		}
		else
		{
			localReposPath = "/data/DocSysSvnReposes/";	//Linux系统放在  /data	
		}
		return localReposPath;
	}

	//正确格式化仓库根路径
	private String reposRootPathFormat(String path) {
		//如果传入的Path没有带/,给他加一个
		String endChar = path.substring(path.length()-1, path.length());
		if(!endChar.equals("/"))	
		{
			path = path + "/";
		}
		return path;
	}

	//获取默认的仓库根路径
	private String getDefaultReposRootPath() {
		String path = null;
		String os = System.getProperty("os.name");  
		System.out.println("OS:"+ os);  
		if(os.toLowerCase().startsWith("win")){  
			path = "D:/DocSysReposes/";
		}
		else
		{
			path = "/data/DocSysReposes/";	//Linux系统放在  /data	
		}
		return path;
	}


	//Commit the localPath to svnPath
	boolean svnAutoCommit(String svnPath,String svnUser, String svnPwd, String localPath,String commitMsg, String commitUser,boolean modifyEnable,String localRefPath)
	{	
		//If the svnUser was not set, use the commitUser
		if(svnUser == null || "".equals(svnUser))
		{
			svnUser = commitUser;
		}
		
		SVNUtil svnUtil = new SVNUtil();
		//svn初始化
		if(svnUtil.Init(svnPath, svnUser, svnPwd) == false)
		{
			System.out.println("do Init Failed");
			return false;
		}
		
		return svnUtil.doAutoCommit("","",localPath,commitMsg,modifyEnable,localRefPath);		
	}
	
	/****************   delete a Repository ******************/
	@RequestMapping("/deleteRepos.do")
	public void deleteRepos(Integer vid,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("deleteRepos vid: " + vid);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//检查是否是超级管理员或者仓库owner
		if(login_user.getType() != 2)	//超级管理员 或 仓库的拥有者可以删除仓库
		{
			//getRepos
			Repos repos = new Repos();
			repos.setId(vid);
			repos.setOwner(login_user.getId());	//拥有人
			List <Repos> list = reposService.getReposList(repos);
			if(list == null || list.size() != 1)	//仓库拥有人
			{
				rt.setError("您无权删除该仓库!");				
				writeJson(rt, response);	
				return;
			}
		}
		
		//为了避免直接删除仓库数据，系统删除仓库将只删除仓库记录，仓库数据需要用户手动删除
		if(reposService.deleteRepos(vid) == 0)
		{
			rt.setError("仓库删除失败！");
		}
		
		writeJson(rt, response);	
	}
	
	/****************   set a Repository ******************/
	@RequestMapping("/updateReposInfo.do")
	public void updateReposInfo(Integer reposId, String name,String info, Integer type,String path, Integer verCtrl,String svnPath,String svnUser,String svnPwd,
			Integer verCtrl1,String svnPath1,String svnUser1,String svnPwd1,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("updateReposInfo reposId:" + reposId + " name: " + name + " info: " + info + " type: " + type  + " path: " + path + " verCtrl: " + verCtrl + " svnPath: " + svnPath + " svnUser: " + svnUser + " svnPwd: " + svnPwd + " verCtrl1: " + verCtrl1 + " svnPath1: " + svnPath1 + " svnUser1: " + svnUser1 + " svnPwd1: " + svnPwd1);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//检查是否是超级管理员或者仓库owner
		if(login_user.getType() != 2)	//超级管理员 或 仓库的拥有者可以修改仓库
		{
			//getRepos
			Repos repos = new Repos();
			repos.setId(reposId);
			repos.setOwner(login_user.getId());	//拥有人
			List <Repos> list = reposService.getReposList(repos);
			if(list == null || list.size() != 1)	//仓库拥有人
			{
				rt.setError("您无权修改该仓库!");				
				writeJson(rt, response);	
				return;
			}
		}
		
		//检查传入的参数
		//update repos
		if(reposId == null)
		{
			rt.setError("仓库ID不能为空!");				
			writeJson(rt, response);	
			return;
		}
		
		/*通过判断需要内容进行不同的操作，另外需要分阶段更新，优先更新与存储无关的参数*/
		//修改仓库描述
		if(info != null && !info.isEmpty())
		{
			if(UpdateReposInfo(reposId,info,rt) == false)
			{
				writeJson(rt, response);
				return;
			}
		}
		
		//rename仓库
		if(name != null && !name.isEmpty())
		{
			if(UpdateReposName(reposId,name,rt) == false)
			{
				writeJson(rt, response);
				return;
			}
		}
		
		if(svnUser != null)
		{
			if(UpdateReposSvnUser(reposId,svnUser,rt) == false)
			{
				writeJson(rt, response);
				return;
			}
		}
		
		if(svnPwd != null)
		{
			if(UpdateReposSvnPwd(reposId,svnPwd,rt) == false)
			{
				writeJson(rt, response);
				return;
			}
		}

		if(svnUser1 != null)
		{
			if(UpdateReposSvnUser1(reposId,svnUser1,rt) == false)
			{
				writeJson(rt, response);
				return;
			}
		}
		
		if(svnPwd1 != null)
		{
			if(UpdateReposSvnPwd1(reposId,svnPwd1,rt) == false)
			{
				writeJson(rt, response);
				return;
			}
		}
		
		//move仓库
		if(path != null && !path.isEmpty())
		{
			if(UpdateReposPath(reposId,path,login_user,rt) == false)
			{
				writeJson(rt, response);
				return;
			}
		}
		
		//move svn仓库
		if(verCtrl == null)
		{
			//用户没有切换版本控制类型，do nothing
		}
		else if(verCtrl == 1)
		{
			if(UpdateReposVerCtrl(reposId,verCtrl,svnPath,login_user,rt) == false)
			{
				writeJson(rt, response);
				return;
			}
		}
		else //if(verCtrl == 0 || verCtrl == 2)	
		{
			//不要修改原来的仓库路径、用户名和密码信息
			Repos newReposInfo = new Repos();
			newReposInfo.setId(reposId);
			newReposInfo.setVerCtrl(verCtrl);
			if(reposService.updateRepos(newReposInfo) == 0)
			{
				System.out.println("仓库信息更新失败");
				//恢复working copy
				rt.setError("仓库信息更新失败！");
				writeJson(rt, response);
				return;			
			}
		}
		
		//move svn仓库
		if(verCtrl1 == null)
		{
			//用户没有切换版本控制类型，do nothing
		}
		else if(verCtrl1 == 1)
		{
			if(UpdateReposVerCtrl1(reposId,verCtrl1,svnPath1,login_user,rt) == false)
			{
				writeJson(rt, response);
				return;
			}
		}
		else //if(verCtrl1 == 0 || verCtrl1 == 2)	
		{
			//不要修改原来的仓库路径、用户名和密码信息
			Repos newReposInfo = new Repos();
			newReposInfo.setId(reposId);
			newReposInfo.setVerCtrl1(verCtrl1);
			if(reposService.updateRepos(newReposInfo) == 0)
			{
				System.out.println("仓库信息更新失败");
				//恢复working copy
				rt.setError("仓库信息更新失败！");
				writeJson(rt, response);
				return;			
			}
		}
		
		writeJson(rt, response);	
	}

	private boolean UpdateReposVerCtrl1(Integer reposId, Integer verCtrl1,
			String svnPath1, User login_user, ReturnAjax rt) {
		//变更版本管理时,如果svnPath为空，表示需要新建一个仓库
		if((svnPath1 == null) || svnPath1.equals(""))
		{
			//Create a local SVN Repos
			String localReposPath = "";
			String os = System.getProperty("os.name");  
			System.out.println("OS:"+ os);  
			if(os.toLowerCase().startsWith("win")){  
				localReposPath = "D:/DocSysSvnReposes/";
			}
			else
			{
				localReposPath = "/data/DocSysSvnReposes/";	//Linux系统放在  /data	
			}
			
			//get old ReposInfo
			Repos oldReposInfo = reposService.getRepos(reposId);
			if(oldReposInfo == null)
			{
				rt.setError("仓库 " +reposId +" 不存在!");				
				//writeJson(rt, response);
				return false;
			}
			String reposName = oldReposInfo.getId() + "_VRepos";
			File dir = new File(localReposPath,reposName);
			if(dir.exists())
			{
				rt.setError("SVN仓库:"+localReposPath+reposName + "已存在，请直接设置！");
				//writeJson(rt, response);	
				return false;
			}
			
			svnPath1 = SVNUtil.CreateRepos(reposName,localReposPath);
			if(svnPath1 == null)
			{
				rt.setError("SVN仓库的创建失败");
				//writeJson(rt, response);	
				return false;
			}
		}			
		
		//get old ReposInfo
		Repos oldReposInfo = reposService.getRepos(reposId);
		if(oldReposInfo == null)
		{
			rt.setError("仓库 " +reposId +" 不存在!");				
			//writeJson(rt, response);
			return false;
		}
		
		//如果VirtualDoc版本控制设置切换、svnPath1都需要重新同步本地目录和仓库(SVNUser、svnPwd修改不用管，直接改即可)
		if(oldReposInfo.getVerCtrl1() != verCtrl1 || !svnPath1.equals(oldReposInfo.getSvnPath1()))
		{
			//new ReposInfo
			Repos newReposInfo = new Repos();
			newReposInfo.setId(reposId);
			newReposInfo.setVerCtrl1(verCtrl1);
			newReposInfo.setSvnPath1(svnPath1);
			
			//Get the repos virtual data Path
			String reposVPath = getReposVirtualPath(oldReposInfo);
			String commitUser = login_user.getName();
			String commitMsg = "Virtual Doc SvnRepository Init svnPath:" + svnPath1 + " reposRPath:" + reposVPath;
			String svnUser1 = oldReposInfo.getSvnUser1();
			String svnPwd1 = oldReposInfo.getSvnPwd1();
			
			
			if(svnAutoCommit(svnPath1, svnUser1, svnPwd1, reposVPath, commitMsg, commitUser, false, null) == false)
			{
				System.out.println("仓库的SVN初始化失败");
				rt.setError("仓库的SVN初始化失败，请检查svnPath1、svnUser1、svnPwd1 " + svnPath1 + " " + svnUser1 + " " + svnPwd1);
				//writeJson(rt, response);	
				return false;
			}
			
			if(reposService.updateRepos(newReposInfo) == 0)
			{
				System.out.println("仓库信息更新失败");
				rt.setError("仓库信息更新失败！");
				//writeJson(rt, response);
				return false;			
			}
		}
		return true;
	}

	private boolean UpdateReposVerCtrl(Integer reposId, Integer verCtrl,String svnPath,User login_user, ReturnAjax rt) {
		//变更版本管理时,如果svnPath为空，表示需要新建一个仓库
		if((svnPath == null) || svnPath.equals(""))
		{
			//Create a local SVN Repos
			String localReposPath = "";
			String os = System.getProperty("os.name");  
			System.out.println("OS:"+ os);  
			if(os.toLowerCase().startsWith("win")){  
				localReposPath = "D:/DocSysSvnReposes/";
			}
			else
			{
				localReposPath = "/data/DocSysSvnReposes/";	//Linux系统放在  /data	
			}
			
			//get old ReposInfo
			Repos oldReposInfo = reposService.getRepos(reposId);
			if(oldReposInfo == null)
			{
				rt.setError("仓库 " +reposId +" 不存在!");				
				//writeJson(rt, response);
				return false;
			}
			
			String reposName = oldReposInfo.getId()+"";
			File dir = new File(localReposPath,reposName);
			if(dir.exists())
			{
				rt.setError("SVN仓库:"+localReposPath+reposName + "已存在，请直接设置！");
				//writeJson(rt, response);	
				return false;
			}
			
			svnPath = SVNUtil.CreateRepos(reposName,localReposPath);
			if(svnPath == null)
			{
				rt.setError("SVN仓库的创建失败");
				//writeJson(rt, response);	
				return false;
			}
		}			
		
		//get old ReposInfo
		Repos oldReposInfo = reposService.getRepos(reposId);
		if(oldReposInfo == null)
		{
			rt.setError("仓库 " +reposId +" 不存在!");				
			//writeJson(rt, response);
			return false;
		}
		
		//如果版本控制设置切换、svnPath、SVNUser、svnPwd修改都需要重新同步本地目录和仓库
		if(oldReposInfo.getVerCtrl() != verCtrl || !svnPath.equals(oldReposInfo.getSvnPath()))
		{
			//new ReposInfo
			Repos newReposInfo = new Repos();
			newReposInfo.setId(reposId);
			newReposInfo.setVerCtrl(verCtrl);
			newReposInfo.setSvnPath(svnPath);
			
			//Init the svn Repository
			String reposRPath = getReposRealPath(oldReposInfo);			
			String commitUser = login_user.getName();
			String commitMsg = "Real Doc SvnRepository Init svnPath:" + svnPath + " reposRPath:" + reposRPath;
			String svnUser = oldReposInfo.getSvnUser();
			String svnPwd = oldReposInfo.getSvnPwd();					
			if(svnAutoCommit(svnPath,svnUser,svnPwd,reposRPath,commitMsg,commitUser,false,null) == false)
			{
				System.out.println("仓库的SVN初始化失败");
				rt.setError("仓库的SVN初始化失败，请检查svnPath、svnUser、svnPwd"+ svnPath + " " + svnUser + " " + svnPwd);
				//writeJson(rt, response);	
				return false;
			}
			
			if(reposService.updateRepos(newReposInfo) == 0)
			{
				System.out.println("仓库信息更新失败");	//这个其实还不是特别严重，只要重新设置一次即可
				rt.setError("仓库信息更新失败！");
				//writeJson(rt, response);
				return false;
			}
		}
		return true;
	}

	private boolean UpdateReposPath(Integer reposId, String path,User login_user,ReturnAjax rt) {
		//如果传入的Path没有带/,给他加一个
		String endChar = path.substring(path.length()-1, path.length());
		if(!endChar.equals("/"))	
		{
			path = path + "/";
		}
		
		//get old ReposInfo
		Repos oldReposInfo = reposService.getRepos(reposId);
		if(oldReposInfo == null)
		{
			rt.setError("仓库 " +reposId +" 不存在!");				
			//writeJson(rt, response);
			return false;
		}
		
		if(!path.equals(oldReposInfo.getPath()))
		{
			if(login_user.getType() != 2)
			{
				System.out.println("普通用户无权修改仓库存储位置，请联系管理员！");
				rt.setError("普通用户无权修改仓库存储位置，请联系管理员！");
				//writeJson(rt, response);
				return false;							
			}
			
			//
			String oldReposDir = oldReposInfo.getPath();
			String newReposDir = path;
			String reposName = oldReposInfo.getId()+"";
			if(moveFile(oldReposDir, reposName,newReposDir,reposName,false) == false)
			{
				System.out.println("仓库目录迁移失败！");
				rt.setError("修改仓库位置失败！");					
				return false;
			}
			
			//new ReposInfo
			Repos newReposInfo = new Repos();
			newReposInfo.setId(reposId);
			newReposInfo.setPath(path);
			if(reposService.updateRepos(newReposInfo) == 0)
			{
				//删除新建的仓库目录
				System.out.println("updateRepos for path failed");
				moveFile(newReposDir,reposName, oldReposDir,reposName,false);	//还原回去
				rt.setError("设置仓库path失败！");
				//writeJson(rt, response);
				return false;			
			}
		}
		return true;
	}

	//更新repos的svnUser信息
	private boolean UpdateReposSvnUser(Integer reposId, String svnUser,ReturnAjax rt) {
		//get old ReposInfo
		Repos oldReposInfo = reposService.getRepos(reposId);
		if(oldReposInfo == null)
		{
			rt.setError("仓库 " +reposId +" 不存在!");				
			//writeJson(rt, response);
			return false;
		}
		
		if(!svnUser.equals(oldReposInfo.getSvnUser()))
		{								
			//new ReposInfo
			Repos newReposInfo = new Repos();
			newReposInfo.setId(reposId);
			newReposInfo.setSvnUser(svnUser);
			if(reposService.updateRepos(newReposInfo) == 0)
			{
				System.out.println("updateRepos for svnUser failed");
				rt.setError("设置仓库svnUser失败！");
				//writeJson(rt, response);
				return false;			
			}
		}
		return true;
	}
	
	private boolean UpdateReposSvnPwd(Integer reposId, String svnPwd,
			ReturnAjax rt) {
		//get old ReposInfo
		Repos oldReposInfo = reposService.getRepos(reposId);
		if(oldReposInfo == null)
		{
			rt.setError("仓库 " +reposId +" 不存在!");				
			//writeJson(rt, response);
			return false;
		}
		
		if(!svnPwd.equals(oldReposInfo.getSvnPwd()))
		{								
			//new ReposInfo
			Repos newReposInfo = new Repos();
			newReposInfo.setId(reposId);
			newReposInfo.setSvnPwd(svnPwd);
			if(reposService.updateRepos(newReposInfo) == 0)
			{
				System.out.println("updateRepos for svnPwd failed");
				rt.setError("设置仓库svnPwd失败！");
				//writeJson(rt, response);
				return false;			
			}
		}
		return true;
	}
	
	//更新repos的svnUser信息
	private boolean UpdateReposSvnUser1(Integer reposId, String svnUser1,ReturnAjax rt) {
		System.out.println("UpdateReposSvnPwd1() reposId:" + reposId + " svnUser1:" + svnUser1);

		//get old ReposInfo
		Repos oldReposInfo = reposService.getRepos(reposId);
		if(oldReposInfo == null)
		{
			rt.setError("仓库 " +reposId +" 不存在!");				
			//writeJson(rt, response);
			return false;
		}
		
		if(!svnUser1.equals(oldReposInfo.getSvnUser1()))
		{								
			//new ReposInfo
			Repos newReposInfo = new Repos();
			newReposInfo.setId(reposId);
			newReposInfo.setSvnUser1(svnUser1);
			if(reposService.updateRepos(newReposInfo) == 0)
			{
				System.out.println("updateRepos for svnUser1 failed");
				rt.setError("设置仓库svnUser1失败！");
				//writeJson(rt, response);
				return false;			
			}
		}
		return true;
	}
	
	private boolean UpdateReposSvnPwd1(Integer reposId, String svnPwd1,ReturnAjax rt) {
		System.out.println("UpdateReposSvnPwd1() reposId:" + reposId + " svnPwd1:" + svnPwd1);
		//get old ReposInfo
		Repos oldReposInfo = reposService.getRepos(reposId);
		if(oldReposInfo == null)
		{
			rt.setError("仓库 " +reposId +" 不存在!");				
			//writeJson(rt, response);
			return false;
		}
		
		if(!svnPwd1.equals(oldReposInfo.getSvnPwd1()))
		{								
			//new ReposInfo
			Repos newReposInfo = new Repos();
			newReposInfo.setId(reposId);
			newReposInfo.setSvnPwd1(svnPwd1);
			if(reposService.updateRepos(newReposInfo) == 0)
			{
				System.out.println("updateRepos for svnPwd1 failed");
				rt.setError("设置仓库svnPwd1失败！");
				//writeJson(rt, response);
				return false;			
			}
		}
		return true;
	}

	private boolean UpdateReposName(Integer reposId, String name, ReturnAjax rt) {
		//get old ReposInfo
		Repos oldReposInfo = reposService.getRepos(reposId);
		if(oldReposInfo == null)
		{
			rt.setError("仓库 " +reposId +" 不存在!");				
			//writeJson(rt, response);
			return false;
		}
		
		if(!name.equals(oldReposInfo.getName()))
		{								
			//new ReposInfo
			Repos newReposInfo = new Repos();
			newReposInfo.setId(reposId);
			newReposInfo.setName(name);
			if(reposService.updateRepos(newReposInfo) == 0)
			{
				System.out.println("updateRepos for name failed");
				rt.setError("设置仓库name失败！");
				//writeJson(rt, response);
				return false;			
			}
		}
		return true;
	}

	private boolean UpdateReposInfo(Integer reposId, String info, ReturnAjax rt) {
		//get old ReposInfo
		Repos oldReposInfo = reposService.getRepos(reposId);
		if(oldReposInfo == null)
		{
			rt.setError("仓库 " +reposId +" 不存在!");				
			//writeJson(rt, response);
			return false;
		}
		
		if(!info.equals(oldReposInfo.getInfo()))
		{
			//new ReposInfo
			Repos newReposInfo = new Repos();
			newReposInfo.setId(reposId);
			newReposInfo.setInfo(info);
			if(reposService.updateRepos(newReposInfo) == 0)
			{
				System.out.println("updateRepos for info failed");
				rt.setError("设置仓库info失败！");
				//writeJson(rt, response);
				return false;			
			}
		}
		return true;
	}


	private boolean CopyReposDir(String oldReposDir, String newReposDir) {
		System.out.println("CopyReposDir oldReposDir " + oldReposDir +" newReposDir " + newReposDir);
        if(!oldReposDir.equals(newReposDir))
        {
            //File oldfile=new File(oldReposDir);
            File newfile=new File(newReposDir);
            if(newfile.exists()) //若在待转移目录下，已经存在待转移文件
            {
            	System.out.println(newReposDir + " 仓库已存在");
            	return false;
            }
            else
            {
            	System.out.println("迁移仓库");
            	return copyFolder(oldReposDir, newReposDir);
            }
        }
        else
        {
        	System.out.println("仓库根目录未变化");
        	return false;	//同一个目录下不需要
        }
	}
	
	private boolean DeleteReposDir(String reposDir) {
		System.out.println("DeleteReposDir reposDir " + reposDir);
        File file = new File(reposDir);
        if(file.exists()) 
        {
        	return delDir(reposDir);
        }
        else
        {
        	System.out.println(reposDir + "目录不存在!");
        }
        return true;
	}
	
	/****************   get Repository Menu Info (Directory structure) ******************/
	@RequestMapping("/getReposMenu.do")
	public void getReposMenu(Integer vid,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("getReposMenu vid: " + vid);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//获取用户可访问文件列表
		List <Doc> docList = getReposMenu(vid,login_user);
		if(docList == null)
		{
			rt.setData("");
		}
		else
		{
			rt.setData(docList);	
		}
		writeJson(rt, response);
	}
	
	//获取用户的仓库权限
	public DocAuth getReposAuth(Integer UserID,Integer ReposID)
	{
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setReposId(ReposID);
		qReposAuth.setUserId(UserID);
		ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
		if(reposAuth == null)
		{
			return null;
		}
		//Convert reposAuth to docAuth
		DocAuth docAuth = new DocAuth();
		docAuth.setUserId(UserID);
		docAuth.setReposId(ReposID);
		docAuth.setIsAdmin(reposAuth.getIsAdmin());
		docAuth.setAccess(reposAuth.getAccess());
		docAuth.setEditEn(reposAuth.getEditEn());
		docAuth.setAddEn(reposAuth.getAddEn());
		docAuth.setDeleteEn(reposAuth.getDeleteEn());
		docAuth.setHeritable(reposAuth.getHeritable());
		return docAuth;
	}
	
	//This function will get DocAuth from the bottom to top
	//这个函数只能获取真实存在的doc的权限，docId = 0（根目录是虚拟的doc）实际上就是仓库的权限，跟是否继承无关 
	private DocAuth recurGetDocAuth(Integer docId, DocAuth reposAuth,List<DocAuth> userDocAuthList) {
		//docId表示已经递归到了最上层
		if(docId == null || docId == 0)
		{
			if(reposAuth != null && reposAuth.getHeritable() == 1)
			{					
				return reposAuth;
			}
		}
		
		DocAuth docAuth = getDocAuthByDocId(docId,userDocAuthList);
		if(docAuth == null)
		{
			Doc doc = reposService.getDoc(docId);
			if(doc == null)
			{
				System.out.println("recurGetDocAuth: doc with ID " + docId + "不存在！");
				return null;
			}
			Integer pDocId = doc.getPid();
			return recurGetDocAuth(pDocId,reposAuth,userDocAuthList);
		}
		return docAuth;
	}
	
	//This function will get DocAuth from top to bottom
	public DocAuth getDocAuth(Integer DocID,DocAuth parentDocAuth,List<DocAuth> userDocAuthList)
	{
		if((DocID == null) || (DocID == 0))	//根目录直接取parentDocAuth的属性
		{
			if(parentDocAuth.getHeritable() == 0)	//不让继承的话，则返回null
			{
				return null;
			}
			return parentDocAuth;
		}
		
		//从用户的权限列表中读取DocAuth
		DocAuth docAuth = getDocAuthByDocId(DocID, userDocAuthList);
		if(docAuth == null)
		{
			if(parentDocAuth.getHeritable() == 0)	//不让继承的话，则返回null
			{
				return null;
			}
			return parentDocAuth;
		}
		return docAuth;
	}
	
	//这是个递归调用函数
	List <Doc> getAuthedDocList(Integer userId,Integer pid,Integer vid,DocAuth pDocAuth, List<DocAuth> userDocAuthList, List<DocAuth> groupDocAuthList, List<DocAuth> anyUserDocAuthList)
	{
		System.out.println("getAuthedDocList() userId:" + userId + " pid:" + pid + " vid:" + vid);
		//获取pid目录下User能访问的所有doc
		List <Doc> docList = getAuthedSubDocList(userId,pid,vid,pDocAuth);
		if(docList != null)
		{
			//copy docList the resultList
			List <Doc> resultList = new ArrayList<Doc>();
			resultList.addAll(docList); 
			
			//遍历docList,如果是目录的则递归获取该目录下User能访问的所有doc
			for(int i = 0 ; i < docList.size() ; i++) 
			{
				Doc subDoc = docList.get(i);
				Integer subDocId = subDoc.getId();
				if(subDoc.getType() == 2)	//只有目录才需要查询
				{
					DocAuth subDocAuth = getDocAuthFromList(subDocId,pDocAuth,userDocAuthList,groupDocAuthList,anyUserDocAuthList);
					//目录可访问，则进行访问
					if(subDocAuth != null)
					{
						List <Doc> subDocList = getAuthedDocList(userId,subDocId,vid,subDocAuth,userDocAuthList,groupDocAuthList,anyUserDocAuthList);
						if(subDocList != null)
						{
							resultList.addAll(subDocList);
						}
					}
					
				}
			}
			return resultList;
		}
		return null;
	}

	//获取目录pid下的子节点（且当前用户有权限访问的文件）
	List <Doc> getAuthedSubDocList(Integer userId,Integer pDocId,Integer reposId,DocAuth pDocAuth)
	{
		List <Doc> docList = null;
		Integer pDocAuthType = pDocAuth.getDocAuthType();
		if(pDocAuth.getHeritable() == 1)
		{
			if(pDocAuthType == 1) 
			{
				//获取所有User's DocAuth.access=1或 DocAuth==null的节点
				docList = reposService.getAuthedDocListHeritable(null,pDocId,reposId,userId);	
			}
			else if(pDocAuthType == 2)
			{
				//获取所有User's DocAuth.access=1或SubDocAuth==null 或者 Group's DocAuth.access=1或DocAuth==null的节点；
				//docList = reposService.getAuthedDocListHeritable2(null,pDocId,reposId,userId);
			}
			else
			{
				//获取所有User's DocAuth.access=1或DocAuth==null 或者 Group's DocAuth.access=1或DocAuth==null 或者AnyUser's DocAuth.access=1或DocAuth==null的节点；
				//docList = reposService.getAuthedDocListHeritable3(null,pDocId,reposId,userId);			
			}
		}
		else
		{
			if(pDocAuthType == 1) 
			{
				//获取所有User's DocAuth.access=1的节点
				docList = reposService.getAuthedDocList(null,pDocId,reposId,userId);
				//docList = reposService.getAuthedDocList1(null,pDocId,reposId,userId);			
			}
			else if(pDocAuthType == 2)
			{
				//获取所有User's DocAuth.access=1  或者  Group's DocAuth.access=1的节点；
				//docList = reposService.getAuthedDocList2(null,pDocId,reposId,userId);
			}
			else
			{
				//获取所有User's DocAuth.access=1 或者 Group's DocAuth.access=1或DocAuth==null 或者AnyUser's DocAuth.access=1的节点；
				//docList = reposService.getAuthedDocList3(null,pDocId,reposId,userId);
			}
		}
		
		//String json = JSON.toJSONStringWithDateFormat(docList, "yyy-MM-dd HH:mm:ss");
		//System.out.println("docList["+ pDocId +"] " + json);
		return docList;
	}
	
	//根据DocId从docAuthList中找出对应的docAuth
	private DocAuth getDocAuthByDocId(Integer docId,List<DocAuth> docAuthList) {
		if(docAuthList == null)
		{
			return null;
		}
		
		for(int i = 0 ; i < docAuthList.size() ; i++) 
		{
			DocAuth docAuth = docAuthList.get(i);
			if(docId.equals(docAuth.getDocId()))
			{
				//如果需要优化的话，可以考虑把已经找到的docAuth从docAuthList中删除，从而提高下一个doc的筛选速度
				return docAuth;
			}
		}
		return null;
	}

	//获取目录pid下的子节点
	List <Doc> getSubDocList(Integer pid,Integer vid,DocAuth pDocAuth)
	{
		Doc doc = new Doc();
		doc.setPid(pid);
		doc.setVid(vid);
		if(pDocAuth != null && pDocAuth.getAccess() != null && pDocAuth.getAccess() == 1)
		{
			return reposService.getDocList(doc);
		}
		return null;
	}
	
	/****************   get Repository Menu Info (Directory structure) ******************/
	@RequestMapping("/getReposManagerMenu.do")
	public void getReposManagerMenu(Integer vid,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("getReposManagerMenu vid: " + vid);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//获取的仓库权限
		//获取整个仓库的目录结构，包括仓库本身（作为ID=0的存在）
		//获取仓库信息，并转换成rootDoc
		Repos repos = reposService.getRepos(vid);
		Doc rootDoc = new Doc();
		rootDoc.setId(0);
		rootDoc.setName(repos.getName());
		rootDoc.setType(2);
		rootDoc.setPid(0);	//设置成自己
		
		//获取用户可见仓库文件列表
		List <Doc> docList = getReposMenu(vid,login_user);
		
		//合并列表
		docList.add(rootDoc);
		rt.setData(docList);
		writeJson(rt, response);
	}
	
	private List<Doc> getReposMenu(Integer vid, User login_user) {
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
			//get the data from doc
			Doc doc = new Doc();
			doc.setVid(vid);
			List <Doc> docList = reposService.getDocList(doc);
			//rt.setData(docList);
			return docList;

		}
		else
		{
			System.out.println("普通用户");
			//获取用户仓库权限
			Integer userID = login_user.getId();
			List <Doc> authedDocList = getAccessableDocList(userID,vid);
			return authedDocList;
		}
	}
	
	//获取仓库下用户可访问的doclist
	private List<Doc> getAccessableDocList(Integer userID, Integer vid) {		
		System.out.println("getAccessableDocList() userId:" + userID + " vid:" + vid);
		
		//获取user在仓库下的所有权限设置，避免后续多次查询数据库
		List <DocAuth> userDocAuthList = reposService.getUserDocAuthList(userID,null,null,vid);
		//get groupDocAuthList
		List <DocAuth> groupDocAuthList = getGroupDocAuthList(userID,null,null,vid);
		//Get AnyUserDocAuthList
		List <DocAuth> anyUserDocAuthList = reposService.getUserDocAuthList(0,null,null,vid);
		
		if(userDocAuthList == null && groupDocAuthList == null && anyUserDocAuthList == null)
		{
			System.out.println("getAccessableDocList() 用户无权访问该仓库的所有文件");
			return null;
		}
		
		
		//get the rootDocAuth and set rootDocAuthType
		DocAuth rootDocAuth = getDocAuthFromList(0,null,userDocAuthList,groupDocAuthList,anyUserDocAuthList);
		if(rootDocAuth == null)
		{
			System.out.println("getAccessableDocList() 用户根目录权限未设置");
			return null;
		}
		
		//用户在仓库中有权限设置，需要一层一层递归来获取文件列表
		System.out.println("getAccessableDocList() rootDocAuth access:" + rootDocAuth.getAccess() + " docAuthType:" + rootDocAuth.getDocAuthType() + " heritable:" + rootDocAuth.getHeritable());
				
		//get authedDocList: 需要从根目录开始递归往下查询目录权限		
		List <Doc> authedDocList = getAuthedDocList(userID,0,vid,rootDocAuth,userDocAuthList,groupDocAuthList,anyUserDocAuthList);
		return authedDocList;
	}

	private DocAuth getDocAuthFromList(int docId, DocAuth parentDocAuth,
			List<DocAuth> userDocAuthList, List<DocAuth> groupDocAuthList,List<DocAuth> anyUserDocAuthList) {
		
		System.out.println("getDocAuthFromList() docId:" + docId);
		
		DocAuth docAuth = null;
		//root Doc
		if(docId == 0)
		{
			docAuth = getDocAuthByDocId(docId,userDocAuthList);
			if(docAuth != null)
			{
				docAuth.setDocAuthType(1);
			}
			else
			{
				docAuth = getDocAuthByDocId(docId,groupDocAuthList);
				if(docAuth != null)
				{
					docAuth.setDocAuthType(2);					
				}
				else
				{
					docAuth = getDocAuthByDocId(docId,anyUserDocAuthList);
					if(docAuth != null)
					{
						docAuth.setDocAuthType(2);					
					}
				}
			}
			return docAuth;
		}
		
		//Not root Doc, if parentDocAuth is null, return null
		if(parentDocAuth == null)
		{
			System.out.println("getDocAuthFromList() docId:" + docId + " parentDocAuth is null");
			return null;
		}
		
		//Not root Doc and parentDocAuth is set
		docAuth = null;
		Integer pDocAuthType = parentDocAuth.getDocAuthType();
		if(pDocAuthType == 1)
		{
			docAuth = getDocAuthByDocId(docId,userDocAuthList);
			if(docAuth != null)
			{
				docAuth.setDocAuthType(1);
			}
			else if(docAuth == null && parentDocAuth.getHeritable() == 1)
			{
				docAuth = parentDocAuth;
			}
		}
		else if(pDocAuthType == 2)
		{
			docAuth = getDocAuthByDocId(docId,userDocAuthList);
			if(docAuth != null)
			{
				docAuth.setDocAuthType(1);
			}
			else
			{
				docAuth = getDocAuthByDocId(docId,groupDocAuthList);
				if(docAuth != null)
				{
					docAuth.setDocAuthType(2);
				}
				else if(docAuth == null && parentDocAuth.getHeritable() == 1)
				{
					docAuth = parentDocAuth;
				}
			}
		}
		else if(pDocAuthType == 3)
		{
			docAuth = getDocAuthByDocId(docId,userDocAuthList);
			if(docAuth != null)
			{
				docAuth.setDocAuthType(1);
			}
			else
			{
				docAuth = getDocAuthByDocId(docId,groupDocAuthList);
				if(docAuth != null)
				{
					docAuth.setDocAuthType(2);
				}
				else
				{
					docAuth = getDocAuthByDocId(docId,groupDocAuthList);
					if(docAuth != null)
					{
						docAuth.setDocAuthType(3);
					}					
					else if(docAuth == null && parentDocAuth.getHeritable() == 1)
					{
						docAuth = parentDocAuth;
					}
				}
			}
		}
		return docAuth;
	}

	//getGroupDocAuthList 用于获取用户的组权限(用户组权限所有所在组的并集)
	//docId parentDocId reposId是查询的限制条件
	private List<DocAuth> getGroupDocAuthList(Integer userID, Integer docId,Integer parentDocId, Integer reposId) {
		//TODO: Auto-generated method stub
		//Get GroupList
		//Go through the GroupList to get the GroupDocAuthList[] one by one
		//Combine all GroupAuthList to unique groupDocAuthList by docId
		return null;
	}

	/********** 获取系统所有用户和任意用户 ：前台用于给仓库添加访问用户***************/
	@RequestMapping("/getReposAllUsers.do")
	public void getReposAllUsers(Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getReposAllUsers vid: " + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//获取All UserList
		List <UserDocAuth> UserList = getReposAllUserList(reposId);
		String json = JSON.toJSONStringWithDateFormat(UserList, "yyy-MM-dd HH:mm:ss");
		System.out.println("UserList:" + json);
		rt.setData(UserList);
		writeJson(rt, response);
		
	}
	
	private List<UserDocAuth> getReposAllUserList(Integer reposId) {
		List <UserDocAuth> UserList = reposService.getReposAllUsers(reposId);	//取出系统所有用户
		//获取任意用户的DocAuth
		UserDocAuth anyUserReposAuth = getAnyUserReposAuth(reposId); //获取任意用户的权限表
		if(anyUserReposAuth == null)	//用户未设置，则将任意用户加入到用户未授权用户列表中去
		{
			anyUserReposAuth = new UserDocAuth();
			anyUserReposAuth.setUserId(0);
			anyUserReposAuth.setUserName("任意用户");			
			UserList.add(anyUserReposAuth);	//将任意用户插入到ReposUserList
		}
		else
		{
			UserList.add(anyUserReposAuth);	//将任意用户插入到ReposUserList			
		}
		return UserList;
	}

	/****************  get ReposAuthList and DocAuthList of Repos  ******************/
	@RequestMapping("/getReposAuthList.do")
	public void getReposAuthList(Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getReposAuthList reposId: " + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(isAdminOfRepos(login_user,reposId) == false)
		{
			rt.setError("您不是该仓库的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		//获取ReposAuthList
		List <UserDocAuth> ReposAuthList = getReposAuthList(reposId);
		if(ReposAuthList == null)
		{
			ReposAuthList = getDocAuthList(0,reposId);	//docId=0,表示获取仓库下所有Doc的DocAuth
		}
		else
		{
			List <UserDocAuth> DocAuthList = getDocAuthList(0,reposId);	//docId=0,表示获取仓库下所有Doc的DocAuth
			if(DocAuthList != null)
			{
				ReposAuthList.addAll(DocAuthList);
			}
		}
		String json = JSON.toJSONStringWithDateFormat(ReposAuthList, "yyy-MM-dd HH:mm:ss");
		System.out.println("ReposAuthList:" + json);
		rt.setData(ReposAuthList);
		writeJson(rt, response);
		
	}
	
	private boolean isAdminOfRepos(User login_user,Integer reposId) {
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
			return true;
		}
		else 
		{
			DocAuth reposAuth = getReposAuth(login_user.getId(),reposId);
			if(reposAuth != null && reposAuth.getIsAdmin() != null && reposAuth.getIsAdmin() == 1)
			{
				return true;
			}			
		}
		return false;
	}

	private List<UserDocAuth> getDocAuthList(Integer docId, Integer reposId) {
		if(docId == null || docId == 0)
		{
			//获取仓库的所有doc的docAuth
			return reposService.getDocAuthList(0,reposId);
		}
		else
		{
			return reposService.getDocAuthList(docId,reposId);
		}
	}

	private List<UserDocAuth> getReposAuthList(Integer reposId) {
		List <UserDocAuth> ReposAuthList = reposService.getReposAuthList(reposId);	//注意已经包括了任意用户
		return ReposAuthList;
	}
	
	/****************   get DocAuthList of Doc 包括继承的权限 ******************/
	@RequestMapping("/getDocAuthList.do")
	public void getDocAuthList(Integer docId, Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getDocAuthList docId: " + docId + " reposId:" + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(isAdminOfDoc(login_user,docId,reposId) == false)
		{
			rt.setError("您不是该目录/文件的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		//获取DocAuthedUserList
		List <UserDocAuth> docAuthList = getAllDocAuthList(docId,reposId);
		String json = JSON.toJSONStringWithDateFormat(docAuthList, "yyy-MM-dd HH:mm:ss");
		System.out.println("docAuthList:" + json);
		rt.setData(docAuthList);
		writeJson(rt, response);
	}
	
	private boolean isAdminOfDoc(User login_user, Integer docId, Integer reposId) {
		//任意用户的管理员权限无效，避免混乱
		DocAuth docAuth = getUserDocAuth(login_user.getId(), docId, reposId);
		if(docAuth != null && docAuth.getIsAdmin() == 1)
		{
			return true;
		}
		return false;
	}

	//获取当前Doc的权限列表
	List <UserDocAuth> getAllDocAuthList(Integer docId, Integer vid)
	{
		//获取该仓库的所有用户列表
		List <UserDocAuth> ReposAuthList = reposService.getReposAuthList(vid);
		
		//Get DocName and DocPath
		String docName = "";
		String docPath = "";
		Doc doc = null;
		if(docId == null || docId == 0)
		{
			System.out.println("docId 未设置");
			return null;
		}
		else
		{
			doc = reposService.getDoc(docId);
			if(doc == null)
			{
				System.out.println("doc not exists");
				return null;
			}
			docName = doc.getName();
			docPath = doc.getPath();
		}
		
		
		//遍历仓库的用户的docAuth，如果非空则设置其  docAuthId，并修改其权限
		for(int i = 0 ; i < ReposAuthList.size() ; i++) 
		{
			UserDocAuth user = ReposAuthList.get(i);
			//更新文件路径和文件名字信息
			user.setDocName(docName);
			user.setDocPath(docPath);
			
			//获取该用户关于docId的直接权限
			DocAuth qDocAuth = new DocAuth();
			qDocAuth.setUserId(user.getUserId());
			qDocAuth.setDocId(docId);
			qDocAuth.setReposId(vid);
			DocAuth docAuth = reposService.getDocAuth(qDocAuth);
			if(docAuth != null)
			{
				//设置docAuthId并更新权限
				user.setDocAuthId(docAuth.getId());
				user.setIsAdmin(docAuth.getIsAdmin());
				user.setAccess(docAuth.getAccess());
				user.setEditEn(docAuth.getEditEn());
				user.setAddEn(docAuth.getAddEn());
				user.setDeleteEn(docAuth.getDeleteEn());
				user.setHeritable(docAuth.getHeritable());

			}
			else	//没有直接的文件权限设置则获取其继承权限
			{
				//递归获取继承权限，继承过来的权限不要设置docAuthId,只更新权限
				docAuth = getUserDocAuth(user.getUserId(),doc.getPid(),vid);
				if(docAuth != null)	//递归获取其父节点的属性
				{
					user.setIsAdmin(docAuth.getIsAdmin());
					user.setAccess(docAuth.getAccess());
					user.setEditEn(docAuth.getEditEn());
					user.setAddEn(docAuth.getAddEn());
					user.setDeleteEn(docAuth.getDeleteEn());
					user.setHeritable(docAuth.getHeritable());
				}
				else
				{
					//继承仓库权限
					if(user.getHeritable() == 0)	//不让继承，则清空其权限
					{
						user.setIsAdmin(0);
						user.setAccess(0);
						user.setEditEn(0);
						user.setAddEn(0);
						user.setDeleteEn(0);
						user.setHeritable(0);
					}
				}
			}
		}		
		return ReposAuthList;
	}
	
	private UserDocAuth getAnyUserReposAuth(Integer vid) {
		//需要查询该仓库是否设置了对userID=0的访问权限，也就是对任意用户的权限（任意用户是一个虚拟的用户，没有用户实体）
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setReposId(vid);
		qReposAuth.setUserId(0);
		ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
		if(reposAuth != null)	//仓库设置了任意用户的访问权限
		{
			//将任意用户加入到用户列表中
			UserDocAuth userDocAuth = new UserDocAuth();
			userDocAuth.setReposAuthId(reposAuth.getId());	//仓库权限记录ID
			userDocAuth.setReposId(vid);
			userDocAuth.setUserId(0);	//任意用户使用虚拟的userID
			userDocAuth.setUserName("任意用户");
			userDocAuth.setAccess(reposAuth.getAccess());
			userDocAuth.setAddEn(reposAuth.getAddEn());
			userDocAuth.setDeleteEn(reposAuth.getDeleteEn());
			userDocAuth.setEditEn(reposAuth.getEditEn());
			return userDocAuth;
		}
		return null;
	}

	//递归获取用户的目录访问权限
	DocAuth getUserDocAuth(Integer userID,Integer docId, Integer vid)
	{
		Integer userType = 0;
		if(userID == null)
		{
			System.out.println("getUserDocAuth() userID is null");
			return null;
		}
	
		//虚拟用户：任意用户
		if(userID != 0)
		{
			User user = userService.getUser(userID);
			if(user == null)
			{
				System.out.println("getUserDocAuth() 用户" + userID +"不存在");
				return null;
			
			}
			userType = user.getType();
		}
		
		//超级管理员可以访问所有目录
		if(userType == 2)
		{
			System.out.println("超级管理员" + userID);
			DocAuth docAuth = new DocAuth();
			docAuth.setAccess(1);
			docAuth.setAddEn(1);
			docAuth.setDeleteEn(1);
			docAuth.setEditEn(1);
			docAuth.setHeritable(1);
			docAuth.setIsAdmin(1);
			return docAuth;
		}
		else
		{
			System.out.println("普通用户" + userID);
			//获取用户仓库权限
			DocAuth reposAuth = getReposAuth(userID,vid);
			if(reposAuth == null)
			{
				System.out.println("用户无权访问该仓库");
				return null;
			}
			System.out.println("reposAuth.access " + reposAuth.getAccess() + " reposAuth.heritable " + reposAuth.getHeritable());
			
			if(docId == 0)	//根目录权限直接使用仓库权限
			{
				System.out.println("根目录权限直接使用仓库权限");
				return reposAuth;
			}
			
			//获取用户的仓库的所有权限列表，后续的目录权限将从该列表中读取，避免每次查询数据库
			List <DocAuth> userDocAuthList = reposService.getUserDocAuthList(userID,null,null,vid);
			if(userDocAuthList == null)
			{
				System.out.println("userDocAuthList is NULL for " + userID);
				//用户在该仓库下没有设置权限，需要根据仓库的权限设置来确定访问范围
				if(reposAuth != null && reposAuth.getHeritable() == 1)
				{					
					return reposAuth;
				}
				
				System.out.println("用户无权访问该仓库的所有文件");
				return null;
			}

			//从docId开始递归往上获取用户权限
			DocAuth userDocAuth = recurGetDocAuth(docId,reposAuth,userDocAuthList);
			return userDocAuth;
		}
	}

	/****************   Add User ReposAuth ******************/
	@RequestMapping("/addUserReposAuth.do")
	public void addUserReposAuth(Integer userId, Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("addUserAuth userId: " + userId  + " reposId:" + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查是否是仓库的管理员
		if(isAdminOfRepos(login_user,reposId) == false)
		{
			//检查是否在仓库下的目录拥有管理员权限
			if(hasAdminUnderRepos(login_user,reposId) == false)
			{
				rt.setError("您没有该仓库的管理权限，无法添加用户 ！");
				writeJson(rt, response);			
				return;
			}
		}
		
		//检查该用户是否设置了仓库权限
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setUserId(userId);
		qReposAuth.setReposId(reposId);
		ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
		if(reposAuth == null)
		{
			if(reposService.addReposAuth(qReposAuth) == 0)
			{
				rt.setError("用户仓库权限新增失败！");
				writeJson(rt, response);			
				return;
			}	
			
		}
		writeJson(rt, response);			
	}
	
	private boolean hasAdminUnderRepos(User login_user, Integer reposId) {
		
		Integer userID = login_user.getId();
		Integer userType = login_user.getType();
		
		//超级管理员可以访问所有目录
		if(userType == 2)
		{
			System.out.println("hasAdminUnderRepos() 超级管理员 " + userID);
			return true;
		}
		else
		{
			System.out.println("hasAdminUnderRepos()  普通用户 " + userID);
			//获取用户的仓库的所有权限列表，后续的目录权限将从该列表中读取，避免每次查询数据库
			List <DocAuth> userDocAuthList = reposService.getUserDocAuthList(userID,null,null,reposId);
			if(userDocAuthList == null)
			{
				System.out.println("hasAdminUnderRepos() userDocAuthList is NULL for " + userID);
				return false;
			}
			
			//go through the userDocAuthList
			for(int i = 0 ; i < userDocAuthList.size() ; i++) 
			{
				DocAuth docAuth = userDocAuthList.get(i);
				if(docAuth.getIsAdmin() == 1)
				{
					return true;
				}
			}
		}
		return false;
	}

	/****************   delete User ReposAuth ******************/
	@RequestMapping("/deleteUserReposAuth.do")
	public void deleteUserReposAuth(Integer reposAuthId,Integer userId, Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("deleteUserReposAuth reposAuthId:"  + reposAuthId + " userId: " + userId  + " reposId:" + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(isAdminOfRepos(login_user,reposId) == false)
		{
			rt.setError("您不是该仓库的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		//检查该用户是否设置了仓库权限
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setId(reposAuthId);
		qReposAuth.setUserId(userId);
		qReposAuth.setReposId(reposId);
		ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
		if(reposAuth != null)
		{
			if(reposService.deleteReposAuth(reposAuthId) == 0)
			{
				rt.setError("用户仓库权限删除失败！");
				writeJson(rt, response);			
				return;
			}	

			//删除该用户在该仓库的所有的目录权限设置
			//DocAuth docAuth = new DocAuth();
			//docAuth.setUserId(userId);
			//docAuth.setReposId(reposId);
			//reposService.deleteDocAuthSelective(docAuth);	
		}
		writeJson(rt, response);			
	}
	
	/****************   delete User ReposAuth ******************/
	@RequestMapping("/deleteUserDocAuth.do")
	public void deleteUserDocAuth(Integer docAuthId,Integer userId,Integer docId, Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("deleteUserReposAuth docAuthId:"  + docAuthId + " userId: " + userId  + " docId: " + docId  + " reposId:" + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(isAdminOfDoc(login_user,docId,reposId) == false)
		{
			rt.setError("您不是该仓库的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		//检查该用户是否设置了目录权限
		DocAuth qDocAuth = new DocAuth();
		qDocAuth.setId(docAuthId);
		qDocAuth.setUserId(userId);
		qDocAuth.setDocId(docId);
		qDocAuth.setReposId(reposId);
		DocAuth docAuth = reposService.getDocAuth(qDocAuth);
		if(docAuth != null)
		{
			if(reposService.deleteDocAuth(docAuthId) == 0)
			{
				rt.setError("用户的目录权限设置删除失败！");
				writeJson(rt, response);			
				return;
			}	
		}
		writeJson(rt, response);			
	}
	
	/****************   config User Auth ******************/
	@RequestMapping("/configUserAuth.do")
	public void configUserAuth(Integer userId, Integer docId, Integer reposId,Integer isAdmin, Integer access, Integer editEn,Integer addEn,Integer deleteEn,Integer heritable,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("configUserAuth userId: " + userId + " docId:" + docId + " reposId:" + reposId + " isAdmin:" + isAdmin + " access:" + access + " editEn:" + editEn + " addEn:" + addEn  + " deleteEn:" + deleteEn + " heritable:" + heritable);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		DocAuth adminDocAuth = getUserDocAuth(login_user.getId(), docId, reposId);
		if(adminDocAuth == null ||adminDocAuth.getIsAdmin()==null || adminDocAuth.getIsAdmin() == 0)
		{
			System.out.println("您不是该目录/文件的管理员，请联系管理员开通权限 ！");
			rt.setError("您不是该目录/文件的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		//login_user不得设置超过自己的权限：超过了则无效
		if(isUserAuthExpanded(isAdmin,access,editEn,addEn,deleteEn,heritable,adminDocAuth,rt) == true)
		{
			System.out.println("超过设置者的权限 ！");
			writeJson(rt, response);			
			return;			
		}
		
		System.out.println("检查设置的用户是否是仓库的访问用户 ");
		//检查该用户是否设置了仓库权限
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setUserId(userId);
		qReposAuth.setReposId(reposId);
		ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
		if(reposAuth == null)
		{
			rt.setError("请先添加该用户为仓库的访问用户！");
			writeJson(rt, response);			
			return;
		}
		
		//获取DocAuthedUserList
		if(docId == 0)
		{
			reposAuth.setIsAdmin(isAdmin);
			reposAuth.setAccess(access);
			reposAuth.setEditEn(editEn);
			reposAuth.setAddEn(addEn);
			reposAuth.setDeleteEn(deleteEn);
			reposAuth.setHeritable(heritable);
			if(reposService.setReposAuth(reposAuth) == 0)
			{
				rt.setError("用户仓库权限更新失败");
				writeJson(rt, response);			
				return;
			}			
		}
		else
		{
			DocAuth qDocAuth = new DocAuth();
			qDocAuth.setUserId(userId);
			qDocAuth.setDocId(docId);
			qDocAuth.setReposId(reposId);
			DocAuth docAuth = reposService.getDocAuth(qDocAuth);
			if(docAuth == null)
			{
				qDocAuth.setIsAdmin(isAdmin);
				qDocAuth.setAccess(access);
				qDocAuth.setEditEn(editEn);
				qDocAuth.setAddEn(addEn);
				qDocAuth.setDeleteEn(deleteEn);
				qDocAuth.setHeritable(heritable);
				if(reposService.addDocAuth(qDocAuth) == 0)
				{
					rt.setError("用户文件权限增加失败");
					writeJson(rt, response);			
					return;
				}
			}
			else
			{
				docAuth.setIsAdmin(isAdmin);
				docAuth.setAccess(access);
				docAuth.setEditEn(editEn);
				docAuth.setAddEn(addEn);
				docAuth.setDeleteEn(deleteEn);
				docAuth.setHeritable(heritable);
				if(reposService.updateDocAuth(docAuth) == 0)
				{
					rt.setError("用户文件权限增加失败");
					writeJson(rt, response);			
					return;
				}
			}
		}
		
		writeJson(rt, response);
	}

	private boolean isUserAuthExpanded(Integer isAdmin, Integer access,
			Integer editEn, Integer addEn, Integer deleteEn, Integer heritable,
			DocAuth adminDocAuth, ReturnAjax rt) {
		if(isAdmin > adminDocAuth.getIsAdmin())
		{
			rt.setError("您无权设置管理员权限");
			return true;
		}
		if(access > adminDocAuth.getAccess())
		{
			rt.setError("您无权设置读权限");
			return true;
		}
		if(editEn > adminDocAuth.getEditEn())
		{
			rt.setError("您无权设置写权限");
			return true;
		}
		if(addEn > adminDocAuth.getAddEn())
		{
			rt.setError("您无权设置新增权限");
			return true;
		}
		if(deleteEn > adminDocAuth.getDeleteEn())
		{
			rt.setError("您无权设置删除权限");
			return true;
		}
		if(heritable > adminDocAuth.getHeritable())
		{
			rt.setError("您无权设置权限继承");
			return true;
		}
		
		return false;
	}

	/****************   update Repository Menu Info (Directory structure) ******************/
	@RequestMapping("/updateReposMenu.do")
	public void updateReposMenu(Integer vid,String menu,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("updateReposMenu vid: " + vid);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		Repos repos = new Repos();
		repos.setId(vid);
		repos.setMenu(menu);
		reposService.updateRepos(repos);

		writeJson(rt, response);
	}
}
