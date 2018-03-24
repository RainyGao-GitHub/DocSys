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
			List <Repos> accessableReposList = getAccessableReposList(UserId);
			rt.setData(accessableReposList);
		}
		writeJson(rt, response);
	}
	
	private List<Repos> getAccessableReposList(Integer userId) {
		System.out.println("getAccessableReposList() userId:" + userId);
		
		//取出用户在系统上的所有仓库权限列表
		//将仓库权限列表转换成HashMap,方便快速从列表中取出仓库的用户权限
		HashMap<Integer,ReposAuth> reposAuthHashMap = getUserReposAuthHashMap(userId);
		printObject("reposAuthHashMap",reposAuthHashMap);
		
		//get all reposAuthList to pick up the accessable List
		List<Repos> resultList = new ArrayList<Repos>();
		List<Repos> reposList = reposService.getAllReposList();
		for(int i=0;i<reposList.size();i++)
		{
			Repos repos = reposList.get(i);
			printObject("repos",repos);
			ReposAuth reposAuth = reposAuthHashMap.get(repos.getId());
			if(reposAuth != null && reposAuth.getAccess().equals(1))
			{
				resultList.add(repos);
			}
		}
		
		return resultList;
	}
	
	//获取用户的仓库权限设置
	private HashMap<Integer, ReposAuth> getUserReposAuthHashMap(Integer userId) {
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setUserId(userId);
		List <ReposAuth> reposAuthList = reposService.getReposAuthListForUser(qReposAuth);
		printObject("getUserReposAuthHashMap() userID[" + userId +"] reposAuthList:", reposAuthList);
		
		if(reposAuthList == null || reposAuthList.size() == 0)
		{
			return null;
		}
		
		HashMap<Integer,ReposAuth> hashMap = BuildHashMapByReposAuthList(reposAuthList);
		return hashMap;
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
			reposAuth.setType(1); //权限类型：用户权限
			reposAuth.setPriority(10); //将用户的权限优先级为10(group是1-9),anyUser是0
			reposAuth.setIsAdmin(1); //设置为管理员，可以管理仓库，修改描述、设置密码、设置用户访问权限
			reposAuth.setAccess(1);	//0：不可访问  1：可访问
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
			Integer userID = login_user.getId();
			List <Doc> docList = getAccessableDocList(userID,vid);
			return docList;
		}
	}
	
	//获取仓库下用户可访问的doclist
	//已被证实一口气获取所有文件列表是不现实的，因此采用目录动态加载的方式，该接口将不再使用
	private List<Doc> getAccessableDocList(Integer userID, Integer vid) {		
		System.out.println("getAccessableDocList() userId:" + userID + " vid:" + vid);
		
		//Get the userDocAuthHashMap
		HashMap<Integer,DocAuth> docAuthHashMap = getUserDocAuthHashMap(userID,vid);
		
		//get the rootDocAuth
		DocAuth rootDocAuth = getDocAuthFromHashMap(0,null,docAuthHashMap);
		if(rootDocAuth == null)
		{
			System.out.println("getAccessableDocList() 用户根目录权限未设置");
			return null;
		}
		
		//用户在仓库中有权限设置，需要一层一层递归来获取文件列表
		System.out.println("getAccessableDocList() rootDocAuth access:" + rootDocAuth.getAccess() + " docAuthType:" + rootDocAuth.getType() + " heritable:" + rootDocAuth.getHeritable());
				
		//get authedDocList: 需要从根目录开始递归往下查询目录权限		
		List <Doc> docList = new ArrayList<Doc>();
		return recurGetAuthedDocList(0,vid,rootDocAuth,docAuthHashMap,docList);
	}
	
	//这是个递归调用函数
	private List <Doc> recurGetAuthedDocList(Integer pid,Integer vid,DocAuth pDocAuth, HashMap<Integer,DocAuth> docAuthHashMap, List<Doc> resultList)
	{
		System.out.println("getAuthedDocList()" + " pid:" + pid + " vid:" + vid);
		if(pDocAuth == null || pDocAuth.getAccess() == null || pDocAuth.getAccess() == 0)
		{
			return resultList;
		}
		
		//获取子目录所有文件
		List <Doc> docList = getSubDocList(pid,vid);
		if(docList == null || docList.size() == 0)
		{
			return resultList;
		}
		
		//Go through the docList if the doc can be access, add it to resultList
		for(int i=0;i<docList.size();i++)
		{
			Doc doc = docList.get(i);
			Integer docId = doc.getId();
			DocAuth docAuth = docAuthHashMap.get(docId);
			if(docAuth.getAccess() == 1)
			{
				resultList.add(doc);
				if(doc.getType() == 2)
				{
					recurGetAuthedDocList(docId,vid,docAuth,docAuthHashMap,resultList);
				}
			}
		}
		return resultList;
	}

	//获取目录pid下的子节点
	private List <Doc> getSubDocList(Integer pid,Integer vid)
	{
		Doc doc = new Doc();
		doc.setPid(pid);
		doc.setVid(vid);
		return reposService.getDocList(doc);
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

	/********** 获取系统所有用户和任意用户 ：前台用于给仓库添加访问用户，返回的结果实际上是reposAuth列表***************/
	@RequestMapping("/getReposAllUsers.do")
	public void getReposAllUsers(Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getReposAllUsers reposId: " + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//获取All UserList
		List <ReposAuth> UserList = getReposAllUserList(reposId);
		printObject("UserList:",UserList);
		
		rt.setData(UserList);
		writeJson(rt, response);
		
	}
	
	private List<ReposAuth> getReposAllUserList(Integer reposId) {
		//获取user表（通过reposId来joint reposAuht表，以确定用户的仓库权限），结果实际是reposAuth列表
		List <ReposAuth> UserList = reposService.getReposAllUsers(reposId);	
		
		//获取任意用户的ReposAuth，因为任意用户是虚拟用户在数据库中不存在，因此需要单独获取
		ReposAuth anyUserReposAuth = getAnyUserDispReposAuth(reposId); //获取任意用户的权限表
		if(anyUserReposAuth == null)	//用户未设置，则将任意用户加入到用户未授权用户列表中去
		{
			anyUserReposAuth = new ReposAuth();
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

	//获取任意用户的reposAuth
	private ReposAuth getAnyUserDispReposAuth(Integer vid) {
		ReposAuth reposAuth =getAnyUserReposAuth(vid);
		if(reposAuth != null)	//仓库设置了任意用户的访问权限
		{
			//将任意用户加入到用户列表中
			reposAuth.setUserName("任意用户");
			return reposAuth;
		}
		return null;
	}
	
	//获取任意用户的reposAuth
	private ReposAuth getAnyUserReposAuth(Integer vid) {
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setUserId(0);
		qReposAuth.setReposId(vid);
		ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
		return reposAuth;
	}
	
	/**************** 获取 doc 所有的 用户/用户组权限  ******************/
	@RequestMapping("/getDocAuthList.do")
	public void getDocAuthList(Integer docId, Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getDocAuthList docId: " + docId + " reposId:" + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			System.out.println("getDocAuthList() 用户未登录，请先登录！");
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(isAdminOfDoc(login_user,docId,reposId) == false)
		{
			System.out.println("getDocAuthList() isAdminOfDoc return false");
			rt.setError("您不是该目录/文件的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		//获取DocAuthList
		//Step1: get reposAuthList (包含了user和group)
		List <ReposAuth> reposAuthList = getReposAuthList(reposId);
		System.out.println("getDocAuthList() reposAuthList size is "+ reposAuthList.size());
		printObject("reposAuthList:", reposAuthList);
		
		//Step2: go through the reposAuthList and get the docAuth for the user or group on doc one by one
		List <DocAuth> docAuthList = new ArrayList<DocAuth>();
		for(int i=0;i<reposAuthList.size();i++)
		{
			ReposAuth reposAuth = reposAuthList.get(i);
			Integer userId = reposAuth.getUserId();
			Integer groupId = reposAuth.getGroupId();

			System.out.println("getDocAuthList() userId:" + userId + " groupId:" + groupId);
			DocAuth docAuth = null;
			if(userId!= null)	//It is user
			{
				if(userId == 0)
				{
					docAuth = getAnyUserDispDocAuth(docId,reposId);
				}
				else
				{
					docAuth = getUserDispDocAuth(userId,reposAuth.getUserName(),docId,reposId);	
				}
			}
			else if(groupId != null)
			{
				docAuth = getGroupDispDocAuth(groupId,reposAuth.getGroupName(),docId,reposId);
			}

			if(docAuth !=null)
			{
				docAuthList.add(docAuth);
			}	
		}
		
		//如果是根目录，则将仓库下其他所有的值直接设置显示出来
		if(docId == null || docId == 0)
		{
			DocAuth docAuth = new DocAuth();
			docAuth.setReposId(reposId);
			List <DocAuth> allDocAuthList = reposService.getDocAuthList(docAuth);
			if(allDocAuthList != null)
			{
				//add the docAuth to docAuthList which docId is not 0
				for(int i=0;i<allDocAuthList.size();i++)
				{
					DocAuth tmpDocAuth = allDocAuthList.get(i);
					if(!tmpDocAuth.getDocId().equals(0))
					{
						docAuthList.add(tmpDocAuth);						
					}
				}
			}
		}
		printObject("docAuthList:",docAuthList);

		rt.setData(docAuthList);
		writeJson(rt, response);
	}
	
	private DocAuth getGroupDispDocAuth(Integer groupId, String groupName,
			Integer docId, Integer reposId) {
		// TODO Auto-generated method stub
		return null;
	}

	private DocAuth getAnyUserDispDocAuth(Integer docId, Integer reposId) {
		// TODO Auto-generated method stub
		return null;
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
	
	private boolean isAdminOfRepos(User login_user,Integer reposId) {
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
			return true;
		}
		else 
		{
			ReposAuth reposAuth = getUserReposAuth(login_user.getId(),reposId);
			if(reposAuth != null && reposAuth.getIsAdmin() != null && reposAuth.getIsAdmin() == 1)
			{
				return true;
			}			
		}
		return false;
	}

	private List<ReposAuth> getReposAuthList(Integer reposId) {
		System.out.println("getReposAuthList() reposId:" + reposId);
		ReposAuth reposAuth = new ReposAuth();
		reposAuth.setReposId(reposId);
		List <ReposAuth> ReposAuthList = reposService.getReposAuthList(reposAuth);	//注意已经包括了任意用户
		return ReposAuthList;
	}
	
	/****************   Config User or Group or anyUser ReposAuth ******************/
	@RequestMapping("/configReposAuth.do")
	public void configReposAuth(Integer userId,Integer groupId, Integer reposId,
			Integer isAdmin, Integer access, Integer editEn,Integer addEn,Integer deleteEn,Integer heritable,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("configReposAuth userId: " + userId  + " groupId:" + groupId + " reposId:" + reposId + " isAdmin:" + isAdmin + " access:" + access + " editEn:" + editEn + " addEn:" + addEn  + " deleteEn:" + deleteEn + " heritable:" + heritable);
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
			rt.setError("您没有该仓库的管理权限，无法添加用户 ！");
			writeJson(rt, response);			
			return;
		}
		
		
		//Confirm the ReposAuth Type and Priority
		Integer type = getAuthType(userId,groupId);
		Integer priority = getPriorityByAuthType(type);
		
		//检查该用户是否设置了仓库权限
		ReposAuth qReposAuth = new ReposAuth();
		if(type == 2)
		{
			qReposAuth.setUserId(groupId);		
		}
		else
		{
			qReposAuth.setUserId(userId);
		}
		qReposAuth.setReposId(reposId);
		ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
		if(reposAuth == null)
		{
			qReposAuth.setType(type);
			qReposAuth.setPriority(priority);
			qReposAuth.setIsAdmin(isAdmin);
			qReposAuth.setAccess(access);
			qReposAuth.setEditEn(editEn);
			qReposAuth.setAddEn(addEn);
			qReposAuth.setDeleteEn(deleteEn);
			qReposAuth.setHeritable(heritable);
			if(reposService.addReposAuth(qReposAuth) == 0)
			{
				rt.setError("用户仓库权限新增失败！");
				writeJson(rt, response);			
				return;
			}	
			
		}
		else
		{
			reposAuth.setIsAdmin(isAdmin);
			reposAuth.setAccess(access);
			reposAuth.setEditEn(editEn);
			reposAuth.setAddEn(addEn);
			reposAuth.setDeleteEn(deleteEn);
			reposAuth.setHeritable(heritable);
			if(reposService.updateReposAuth(reposAuth) == 0)
			{
				rt.setError("用户仓库权限更新失败");
				writeJson(rt, response);			
				return;
			}
		}
		writeJson(rt, response);			
	}
	
	/****************  Config User or Group or anyUser DocAuth ******************/
	@RequestMapping("/configDocAuth.do")
	public void configUserAuth(Integer userId, Integer groupId, Integer docId, Integer reposId,
			Integer isAdmin, Integer access, Integer editEn,Integer addEn,Integer deleteEn,Integer heritable,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("configUserAuth userId: " + userId +" groupId: " + groupId+ " docId:" + docId + " reposId:" + reposId + " isAdmin:" + isAdmin + " access:" + access + " editEn:" + editEn + " addEn:" + addEn  + " deleteEn:" + deleteEn + " heritable:" + heritable);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		DocAuth userDocAuth = getUserDocAuth(login_user.getId(), docId, reposId);
		if(userDocAuth == null ||userDocAuth.getIsAdmin()==null || userDocAuth.getIsAdmin() == 0)
		{
			System.out.println("您不是该目录/文件的管理员，请联系管理员开通权限 ！");
			rt.setError("您不是该目录/文件的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		//login_user不得设置超过自己的权限：超过了则无效
		if(isUserAuthExpanded(isAdmin,access,editEn,addEn,deleteEn,heritable,userDocAuth,rt) == true)
		{
			System.out.println("超过设置者的权限 ！");
			writeJson(rt, response);			
			return;			
		}
		
		
		Integer type = getAuthType(userId,groupId);
		Integer priority = getPriorityByAuthType(type);
		
		//获取用户的权限设置，如果不存在则增加，否则修改
		DocAuth qDocAuth = new DocAuth();
		if(type == 2)
		{
			qDocAuth.setGroupId(groupId);	
		}
		else
		{
			qDocAuth.setUserId(userId);
		}
		qDocAuth.setDocId(docId);
		qDocAuth.setReposId(reposId);
		DocAuth docAuth = reposService.getDocAuth(qDocAuth);
		if(docAuth == null)
		{
			qDocAuth.setType(type);
			qDocAuth.setPriority(priority);
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
				rt.setError("用户文件权限更新失败");
				writeJson(rt, response);			
				return;
			}
		}
		
		writeJson(rt, response);
	}

	/****************   delete User or Group or anyUser ReposAuth ******************/
	@RequestMapping("/deleteReposAuth.do")
	public void deleteUserReposAuth(Integer reposAuthId,Integer userId, Integer groupId, Integer reposId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("deleteUserReposAuth reposAuthId:"  + reposAuthId + " userId: " + userId  + " groupId: " + groupId  + " reposId:" + reposId);
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
		
		if(reposService.deleteReposAuth(reposAuthId) == 0)
		{
			rt.setError("用户仓库权限删除失败！");
			writeJson(rt, response);			
			return;
		}
		
		//删除该用户在该仓库的所有的目录权限设置
		Integer type = getAuthType(userId,groupId);
		if(type != null)
		{
			DocAuth docAuth = new DocAuth();
			if(type == 2)
			{
				docAuth.setUserId(groupId);		
			}
			else
			{
				docAuth.setUserId(userId);
			}
			docAuth.setReposId(reposId);
			reposService.deleteDocAuthSelective(docAuth);
		}
		writeJson(rt, response);
	}
		
	/****************   delete User or Group or anyUser  DocAuth ******************/
	@RequestMapping("/deleteDocAuth.do")
	public void deleteUserDocAuth(Integer docAuthId,Integer userId, Integer groupId, Integer docId, Integer reposId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("deleteUserReposAuth docAuthId:"  + docAuthId + " userId: " + userId  + " groupId: " + groupId  + " docId: " + docId  + " reposId:" + reposId);
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
			rt.setError("您不是该仓库/文件的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		//检查该用户是否设置了目录权限
		if(reposService.deleteDocAuth(docAuthId) == 0)
		{
			rt.setError("用户的目录权限设置删除失败！");
			writeJson(rt, response);			
			return;	
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

}
