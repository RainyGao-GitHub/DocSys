package com.DocSystem.controller;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import util.ReturnAjax;

import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.User;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.entity.UserDocAuth;

import com.DocSystem.service.impl.ReposServiceImpl;

import com.DocSystem.controller.BaseController;
import com.alibaba.fastjson.JSON;

@Controller
@RequestMapping("/Repos")
public class ReposController extends BaseController{
	@Autowired
	private ReposServiceImpl reposService;

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
	/****************   set a Repository ******************/
	@RequestMapping("/updateReposInfo.do")
	public void updateReposInfo(Integer reposId, String name,String info, Integer type,String path,String svnPath,String svnUser,String svnPwd,
							HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("updateReposInfo reposId:" + reposId + " name: " + name + " info: " + info + " type: " + type  + " path: " + path + " svnPath: " + svnPath + " svnUser: " + svnUser + " svnPwd: " + svnPwd);
		
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
		
		//get old ReposInfo
		Repos oldReposInfo = reposService.getRepos(reposId);
		if(oldReposInfo == null)
		{
			rt.setError("仓库 " +reposId +" 不存在!");				
			writeJson(rt, response);
			return;
		}
		
		//new ReposInfo
		Repos newReposInfo = new Repos();
		newReposInfo.setId(reposId);
		if(info != null && !info.isEmpty())
		{
			newReposInfo.setInfo(info);
		}	
		
		if(path != null && !path.isEmpty())
		{
			if(login_user.getType() != 2)
			{
				System.out.println("普通用户无权修改仓库存储位置，请联系管理员！");
				rt.setError("普通用户无权修改仓库存储位置，请联系管理员！");
				writeJson(rt, response);
				return;							
			}
			//如果传入的Path没有带/,给他加一个
			String endChar = path.substring(path.length()-1, path.length());
			if(!endChar.equals("/"))	
			{
				path = path + "/";
			}
			newReposInfo.setPath(path);
		}
		
		if(reposService.updateRepos(newReposInfo) == 0)
		{
			System.out.println("仓库信息更新失败");
			rt.setError("仓库信息更新失败！");
			writeJson(rt, response);
			return;			
		}
		
		//ReposMove
		if(ReposMove(oldReposInfo.getName(), oldReposInfo.getPath(),path) == false)
		{
			System.out.println("仓库目录迁移失败,请手动迁移仓库！");
			rt.setError("仓库目录迁移失败,请手动迁移仓库！");
		}
		writeJson(rt, response);	
	}

	
	
	private boolean ReposMove(String reposName, String oldReposRootPath, String newReposRootPath) {
		// TODO Auto-generated method stub
        if(!oldReposRootPath.equals(newReposRootPath))
        {
            File oldfile=new File(oldReposRootPath+reposName);
            File newfile=new File(newReposRootPath+reposName);
            System.out.println(oldReposRootPath+reposName);
            System.out.println(newReposRootPath+reposName);
            if(newfile.exists()) //若在待转移目录下，已经存在待转移文件
            {
            	System.out.println(newReposRootPath+reposName + " 仓库已存在");
            	return false;
            }
            else
            {
            	System.out.println("迁移仓库");
            	return oldfile.renameTo(newfile);
            }
        }
        else
        {
        	System.out.println("仓库根目录未变化");
        	return true;	//同一个目录下不需要move
        }
	}

	/****************   add a Repository ******************/
	@RequestMapping("/addRepos.do")
	public void addRepos(String name,String info, Integer type,String path,String svnPath,String svnUser,String svnPwd, String createTime,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("addRepos name: " + name + " info: " + info + " type: " + type  + " path: " + path + " svnPath: " + svnPath + " svnUser: " + svnUser + " svnPwd: " + svnPwd);
		
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
			String os = System.getProperty("os.name");  
			System.out.println("OS:"+ os);  
			if(os.toLowerCase().startsWith("win")){  
				path = "D:/DocSysReposes/";
			}
			else
			{
				path = "/data/DocSysReposes/";	//Linux系统放在  /data	
			}
		}
		else
		{
			//如果传入的Path没有带/,给他加一个
			String endChar = path.substring(path.length()-1, path.length());
			if(!endChar.equals("/"))	
			{
				path = path + "/";
			}
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
		
		//带svn版本控制的仓库，还需要检查svn设置
		if((type == 2) || (type ==3))
		{
			if((svnPath == null) || svnPath.equals(""))
			{
				rt.setError("svnPath不能为空");
				writeJson(rt, response);	
				return;
			}
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
			
			repos.setSvnPath(svnPath);
			repos.setSvnUser(svnUser);
			repos.setSvnPwd(svnPwd);
		}
		
		//新建目录
		if(createDir(path + name) == true)
		{
			if(createDir(path+name+"/data") == false)
			{
				rt.setError("创建data目录失败");
				writeJson(rt, response);	
				return;
				
			}
			else
			{
				if(createDir(path+name+"/data/rdata") == false)
				{
					rt.setError("创建rdata目录失败");
					writeJson(rt, response);	
					return;
				}
				if(createDir(path+name+"/data/vdata") == false)
				{
					rt.setError("创建vdata目录失败");
					writeJson(rt, response);	
					return;
				}
			}
			if(createDir(path+name+"/tmp") == false)
			{
				rt.setError("创建tmp目录失败");
				writeJson(rt, response);	
				return;
			}
			
			//如果是带版本控制的仓库，那么还需要将.svn check out 到根目录下
			if((type == 2) || (type == 3))
			{	
				if(doSvnInit(path+name,svnPath,svnUser,svnPwd) == false)
				{
					rt.setError("仓库的SVN初始化失败");
					writeJson(rt, response);	
					return;
				}
			}
			
			//repos.setCreateTime(createTime);
			if(reposService.addRepos(repos) == 0)
			{
				rt.setError("新增仓库记录失败");
				writeJson(rt, response);		
				return;
			}
			System.out.println("new ReposId" + repos.getId());
			
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
			rt.setError("创建仓库根目录失败");
		}		
		
		writeJson(rt, response);	
	}
	
	//初始化SVN信息
	boolean doSvnInit(String localPath,String svnPath,String svnUser,String svnPwd)
	{
		return false;
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
		
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
			//get the data from doc
			Doc doc = new Doc();
			doc.setVid(vid);
			List <Doc> docList = reposService.getDocList(doc);
			rt.setData(docList);
		}
		else
		{
			System.out.println("普通用户");
			//从根目录开始
			Integer pid = 0;
			DocAuth reposAuth = getReposAuth(login_user.getId(),vid);
			System.out.println("reposAuth access:" + reposAuth.getAccess());

			DocAuth pDocAuth = getDocAuth(login_user.getId(),pid,vid,reposAuth);			
			System.out.println("pDocAuth access:" + pDocAuth.getAccess());

			//get authedDocList: 需要从根目录开始递归往下查询目录权限
			List <Doc> authedDocList = getAuthedDocList(login_user.getId(),pid,vid,pDocAuth);
			String json = JSON.toJSONStringWithDateFormat(authedDocList, "yyy-MM-dd HH:mm:ss");
			System.out.println("authedDocList:" + json);
			rt.setData(authedDocList);
			
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
			qReposAuth.setUserId(0);	//获取仓库的公开属性
			reposAuth = reposService.getReposAuth(qReposAuth);	
		}

		if(reposAuth == null)
		{
			return null;
		}
		//Convert reposAuth to docAuth
		DocAuth docAuth = new DocAuth();
		docAuth.setUserId(UserID);
		docAuth.setReposId(ReposID);
		docAuth.setAccess(reposAuth.getAccess());
		docAuth.setEditEn(reposAuth.getEditEn());
		docAuth.setAddEn(reposAuth.getAddEn());
		docAuth.setDeleteEn(reposAuth.getDeleteEn());
		return docAuth;
	}
	
	//获取用户的文件权限
	public DocAuth getDocAuth(Integer UserID,Integer DocID,Integer ReposID,DocAuth parentDocAuth)
	{
		if((DocID == null) || (DocID == 0))	//根目录直接取parentDocAuth的属性
		{
			return parentDocAuth;
		}
		
		//Convert reposAuth to docAuth
		DocAuth qDocAuth = new DocAuth();
		qDocAuth.setUserId(UserID);
		qDocAuth.setReposId(ReposID);
		qDocAuth.setDocId(DocID);
		DocAuth docAuth = reposService.getDocAuth(qDocAuth);
		if(docAuth == null)	//没有设置的话默认使用父节点的权限
		{
			qDocAuth.setUserId(0);	//取目录公有权限设置
			docAuth = reposService.getDocAuth(qDocAuth);
			if(docAuth == null)
			{
				return parentDocAuth;
			}
		}
		return docAuth;
	}
	
	//这是个递归调用函数
	List <Doc> getAuthedDocList(Integer userId,Integer pid,Integer vid,DocAuth pDocAuth)
	{
		List <Doc> docList = getAuthedSubDocList(userId,pid,vid,pDocAuth);
		if(docList != null)
		{
			//copy docList the resultList
			List <Doc> resultList = new ArrayList<Doc>();
			resultList.addAll(docList); 
			
			for(int i = 0 ; i < docList.size() ; i++) 
			{
				Doc subDoc = docList.get(i);
				Integer subDocId = subDoc.getId();
				if(subDoc.getType() == 2)	//只有目录才需要查询
				{
					DocAuth subDocAuth = getDocAuth(userId,subDocId,vid,pDocAuth);
					List <Doc> subDocList = getAuthedDocList(userId,subDocId,vid,subDocAuth);
					if(subDocList != null)
					{
						resultList.addAll(subDocList);
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
		//当前父节点的权限检查
		if(pDocAuth != null && pDocAuth.getAccess() != null && pDocAuth.getAccess() == 1)
		{
			//get All doclist under pDocId in reposId
			Doc doc = new Doc();
			doc.setPid(pDocId);
			doc.setVid(reposId);
			List <Doc> docList = reposService.getDocList(doc);	
			if(docList != null)
			{
				//get the DocAuthList for current user and public user of docs under pDocId
				List <DocAuth> userDocAuthList = reposService.getDocAuthListForUser(userId,pDocId,reposId);
				List <DocAuth> publicDocAuthList = reposService.getDocAuthListForUser(0,pDocId,reposId);
				if(userDocAuthList == null && publicDocAuthList == null)
				{
					return docList;	//如果没有设置直接沿用父节点权限，因此全部可以访问
				}
				
				//pickup the docs which can be accessed
				List <Doc> resultList = new ArrayList<Doc>();
				for(int i = 0 ; i < docList.size() ; i++) 
				{
					Doc subDoc = docList.get(i);
					Integer subDocId = subDoc.getId();
					Integer access = 1;	//默认是可以访问
					DocAuth subUserDocAuth = getDocAuthById(subDocId,userDocAuthList);
					if(subUserDocAuth != null)	//优先有用户权限确定
					{
						Integer userAccess = subUserDocAuth.getAccess();
						if(userAccess == null || userAccess == 0) 
						{
							access = 0;
						}
					}	
					else
					{
						DocAuth subPublicDocAuth = getDocAuthById(subDocId,publicDocAuthList);
						if(subPublicDocAuth != null)	//优先有用户权限确定
						{
							Integer PublicAccess = subPublicDocAuth.getAccess();
							if(PublicAccess == null || PublicAccess == 0)
							{
								access = 0;
							}
						}
					}
					
					//if the subDoc can be accessed, then add it to the list
					if(access == 1)
					{
						resultList.add(subDoc);
					}
				}
				return resultList;
			}
		}
		return null;
	}
	
	private DocAuth getDocAuthById(Integer subDocId,List<DocAuth> docAuthList) {
		// TODO Auto-generated method stub
		for(int i = 0 ; i < docAuthList.size() ; i++) 
		{
			DocAuth docAuth = docAuthList.get(i);
			if(subDocId.equals(docAuth.getDocId()))
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
		System.out.println("getReposMenu vid: " + vid);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
		}
		else 
		{			
			DocAuth reposAuth = getReposAuth(login_user.getId(),vid);
			System.out.println("reposAuth access:" + reposAuth.getAccess());
			if(reposAuth.getIsAdmin() != 1)
			{
				rt.setError("您不是该仓库的管理员，请联系管理员开通权限 ！");
				writeJson(rt, response);			
				return;
			}
		}
		
		//获取整个仓库的目录结构，包括仓库本身（作为ID=0的存在）
		//获取仓库信息，并转换成rootDoc
		Repos repos = reposService.getRepos(vid);
		Doc rootDoc = new Doc();
		rootDoc.setId(0);
		rootDoc.setName(repos.getName());
		rootDoc.setType(2);
		rootDoc.setPid(0);	//设置成自己
		
		//获取仓库文件列表
		Doc doc = new Doc();
		doc.setVid(vid);
		List <Doc> docList = reposService.getDocList(doc);

		//合并列表
		docList.add(rootDoc);
		rt.setData(docList);
		writeJson(rt, response);
	}
	
	/****************   get Repos Authed Users  ******************/
	@RequestMapping("/getReposAuthedUsers.do")
	public void getReposAuthedUsers(Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getReposAuthedUsers vid: " + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
		}
		else 
		{
			DocAuth reposAuth = getReposAuth(login_user.getId(),reposId);
			System.out.println("reposAuth isAdmin:" + reposAuth.getIsAdmin());
			if(reposAuth == null || reposAuth.getIsAdmin() == null || reposAuth.getIsAdmin() == 0)
			{
				rt.setError("您不是该仓库的管理员，请联系管理员开通权限 ！");
				writeJson(rt, response);			
				return;
			}			
		}
		
		//获取DocAuthedUserList
		List <UserDocAuth> UserList = getReposAuthedUserList(reposId);
		String json = JSON.toJSONStringWithDateFormat(UserList, "yyy-MM-dd HH:mm:ss");
		System.out.println("UserList:" + json);
		rt.setData(UserList);
		writeJson(rt, response);
		
	}
	private List<UserDocAuth> getReposAuthedUserList(Integer reposId) {
		// TODO Auto-generated method stub
		List <UserDocAuth> ReposUserList = reposService.getReposAuthedUserList(reposId);
		return ReposUserList;
	}
	
	/****************   get Repos Not Authed Users  ******************/
	@RequestMapping("/getReposNotAuthedUsers.do")
	public void getReposNotAuthedUsers(Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getReposNotAuthedUsers vid: " + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
		}
		else 
		{
			DocAuth reposAuth = getReposAuth(login_user.getId(),reposId);
			System.out.println("reposAuth isAdmin:" + reposAuth.getIsAdmin());
			if(reposAuth == null || reposAuth.getIsAdmin() == null || reposAuth.getIsAdmin() == 0)
			{
				rt.setError("您不是该仓库的管理员，请联系管理员开通权限 ！");
				writeJson(rt, response);			
				return;
			}			
		}
		
		//获取DocAuthedUserList
		List <UserDocAuth> UserList = getReposNotAuthedUserList(reposId);
		String json = JSON.toJSONStringWithDateFormat(UserList, "yyy-MM-dd HH:mm:ss");
		System.out.println("UserList:" + json);
		rt.setData(UserList);
		writeJson(rt, response);
		
	}

	private List<UserDocAuth> getReposNotAuthedUserList(Integer reposId) {
		// TODO Auto-generated method stub
		List <UserDocAuth> UserList = reposService.getReposAllUsers(reposId);	//取出系统所有用户
		List <UserDocAuth> ReposUserList = reposService.getReposAuthedUserList(reposId);
		UserList.removeAll(ReposUserList); //删除授权部分的用户
		return UserList;
	}

	/****************   get Doc Auth UserList  ******************/
	@RequestMapping("/getDocAuthedUsers.do")
	public void getDocAuthedUsers(Integer docId, Integer vid,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getDocAuthedUsers vid: " + vid + " docId:" + docId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
		}
		else 
		{
			DocAuth reposAuth = getReposAuth(login_user.getId(),vid);
			System.out.println("reposAuth isAdmin:" + reposAuth.getIsAdmin());
			if(reposAuth == null || reposAuth.getIsAdmin() == null || reposAuth.getIsAdmin() == 0)
			{
				rt.setError("您不是该仓库的管理员，请联系管理员开通权限 ！");
				writeJson(rt, response);			
				return;
			}			
		}
		
		//获取DocAuthedUserList
		List <UserDocAuth> UserList = getDocAuthedUserList(docId,vid);
		String json = JSON.toJSONStringWithDateFormat(UserList, "yyy-MM-dd HH:mm:ss");
		System.out.println("UserList:" + json);
		rt.setData(UserList);
		writeJson(rt, response);
	}
	
	//获取当前Doc的用户列表 with DocAuth Info
	List <UserDocAuth> getDocAuthedUserList(Integer docId, Integer vid)
	{
		//获取该仓库的所有用户列表
		List <UserDocAuth> ReposUserList = reposService.getReposAuthedUserList(vid);
		if(docId == null || docId == 0)	//表示要获取仓库的权限用户
		{
			System.out.println("docId = 0");
			return ReposUserList;
		}
		
		//遍历仓库的用户（如果docID==0则不需要修改，对应的docID有相应 的设置DocAuth来更新ReposUser中的DocAuth部分，否则需要取该用户针对该docId父节点的属性）
		for(int i = 0 ; i < ReposUserList.size() ; i++) 
		{
			UserDocAuth user = ReposUserList.get(i);
			DocAuth docAuth = getUserDocAuth(user.getId(),docId,vid);
			if(docAuth != null)	//递归获取其父节点的属性
			{
				user.setIsAdmin(docAuth.getIsAdmin());
				user.setAccess(docAuth.getAccess());
				user.setEditEn(docAuth.getEditEn());
				user.setAddEn(docAuth.getAddEn());
				user.setDeleteEn(docAuth.getDeleteEn());
			}
		}		
		return ReposUserList;
	}
	
	DocAuth getUserDocAuth(Integer userId, Integer docId, Integer vid)
	{
		if(docId == 0)	//表示已经遍历所有节点
		{
			return null;
		}
		
		DocAuth qDocAuth = new DocAuth();
		qDocAuth.setUserId(userId);
		qDocAuth.setDocId(docId);
		qDocAuth.setReposId(vid);
		DocAuth docAuth = reposService.getDocAuth(qDocAuth);
		if(docAuth == null)
		{
			Doc doc = reposService.getDocInfo(docId);
			Integer pDocId = doc.getPid();
			if(pDocId > 0)
			{
				return getUserDocAuth(userId, pDocId, vid);
			}
			return null;
		}
		return docAuth;
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

		//检查当前用户的权限
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
		}
		else 
		{
			DocAuth reposAuth = getReposAuth(login_user.getId(),reposId);
			System.out.println("reposAuth isAdmin:" + reposAuth.getIsAdmin());
			if(reposAuth == null || reposAuth.getIsAdmin() == null || reposAuth.getIsAdmin() == 0)
			{
				rt.setError("您不是该仓库的管理员，请联系管理员开通权限 ！");
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
	
	/****************   delete User ReposAuth ******************/
	@RequestMapping("/deleteUserReposAuth.do")
	public void deleteUserReposAuth(Integer userId, Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("deleteUserReposAuth userId: " + userId  + " reposId:" + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
		}
		else 
		{
			DocAuth reposAuth = getReposAuth(login_user.getId(),reposId);
			System.out.println("reposAuth isAdmin:" + reposAuth.getIsAdmin());
			if(reposAuth == null || reposAuth.getIsAdmin() == null || reposAuth.getIsAdmin() == 0)
			{
				rt.setError("您不是该仓库的管理员，请联系管理员开通权限 ！");
				writeJson(rt, response);			
				return;
			}			
		}
		
		//检查该用户是否设置了仓库权限
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setUserId(userId);
		qReposAuth.setReposId(reposId);
		ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
		if(reposAuth != null)
		{
			if(reposService.deleteReposAuth(reposAuth.getId()) == 0)
			{
				rt.setError("用户仓库权限删除失败！");
				writeJson(rt, response);			
				return;
			}	

			DocAuth docAuth = new DocAuth();
			docAuth.setUserId(userId);
			docAuth.setReposId(reposId);
			reposService.deleteDocAuthSelective(docAuth);	
		}
		writeJson(rt, response);			
	}
	
	/****************   config User Auth ******************/
	@RequestMapping("/configUserAuth.do")
	public void configUserAuth(Integer userId, Integer docId, Integer reposId,Integer isAdmin, Integer access, Integer editEn,Integer addEn,Integer deleteEn,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("configUserAuth userId: " + userId + " docId:" + docId + " reposId:" + reposId + " isAdmin:" + isAdmin + " access:" + access + " editEn:" + editEn + " addEn:" + addEn  + " deleteEn:" + deleteEn);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
		}
		else 
		{
			DocAuth reposAuth = getReposAuth(login_user.getId(),reposId);
			System.out.println("reposAuth isAdmin:" + reposAuth.getIsAdmin());
			if(reposAuth == null || reposAuth.getIsAdmin() == null || reposAuth.getIsAdmin() == 0)
			{
				rt.setError("您不是该仓库的管理员，请联系管理员开通权限 ！");
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
	
	
	/****************   getReposSetting for doc or repos ******************/
	@RequestMapping("/getReposSetting.do")
	public void getReposSetting(Integer docId, Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getReposSetting docId: " + docId + " reposId:" + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
		}
		else 
		{
			DocAuth reposAuth = getReposAuth(login_user.getId(),reposId);
			System.out.println("reposAuth isAdmin:" + reposAuth.getIsAdmin());
			if(reposAuth == null || reposAuth.getIsAdmin() == null || reposAuth.getIsAdmin() == 0)
			{
				rt.setError("您不是该仓库的管理员，请联系管理员开通权限 ！");
				writeJson(rt, response);			
				return;
			}			
		}
		
		DocAuth docAuth = getPublicDocAuth(docId,reposId);
		rt.setData(docAuth);
		writeJson(rt, response);
	}
	
	//获取公有权限设置，反向递归到最上层
	DocAuth getPublicDocAuth(Integer docId,Integer reposId)
	{
		if(docId == null || docId == 0)
		{
			ReposAuth qReposAuth = new ReposAuth();
			qReposAuth.setUserId(0);
			qReposAuth.setReposId(reposId);
			ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
			if(reposAuth == null)
			{
				return null;
			}
			//Convert the reposAuth to docAuth
			DocAuth tempDocAuth = new DocAuth();
			tempDocAuth.setAccess(reposAuth.getAccess());
			tempDocAuth.setEditEn(reposAuth.getEditEn());
			tempDocAuth.setAddEn(reposAuth.getAddEn());
			tempDocAuth.setDeleteEn(reposAuth.getDeleteEn());
			return tempDocAuth;
		}
		
		DocAuth qDocAuth = new DocAuth();
		qDocAuth.setUserId(0);	//取目录公有权限设置
		qDocAuth.setReposId(reposId);
		qDocAuth.setDocId(docId);
		DocAuth docAuth = reposService.getDocAuth(qDocAuth);
		if(docAuth == null)
		{
			Doc doc = reposService.getDoc(docId);
			docAuth = getPublicDocAuth(doc.getPid(),reposId);
		}
		return docAuth;
	}
	
	/****************   configReposSetting for doc or repos ******************/
	@RequestMapping("/configReposSetting.do")
	public void configReposSetting(Integer docId, Integer reposId,Integer isPublic,Integer isAdmin, Integer access, Integer editEn,Integer addEn,Integer deleteEn,
			HttpSession session,HttpServletRequest request,HttpServletResponse response, Integer ReturnAjax)
	{
		System.out.println("configReposSetting docId: " + docId + " reposId:" + reposId + " isPublic:" + isPublic + " isAdmin:" + isAdmin + " access:" + access + " editEn:" + editEn + " addEn:" + addEn  + " deleteEn:" + deleteEn);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
		}
		else 
		{
			DocAuth reposAuth = getReposAuth(login_user.getId(),reposId);
			System.out.println("reposAuth isAdmin:" + reposAuth.getIsAdmin());
			if(reposAuth == null || reposAuth.getIsAdmin() == null || reposAuth.getIsAdmin() == 0)
			{
				rt.setError("您不是该仓库的管理员，请联系管理员开通权限 ！");
				writeJson(rt, response);			
				return;
			}			
		}
		
		if(docId == 0)	//获取仓库公开设置，
		{
			if(setReposPublicAuth(reposId,isPublic,isAdmin,access,editEn,addEn,deleteEn) == false)
			{
				rt.setError("设置仓库公有权限失败");
				writeJson(rt, response);			
				return;
			}
		}
		else
		{
			if(setDocPublicAuth(docId,reposId,isPublic,isAdmin,access,editEn,addEn,deleteEn) == false)
			{
				rt.setError("设置目录公有权限失败");
				writeJson(rt, response);			
				return;
			}
		}
		writeJson(rt, response);
	}
	
	private boolean setDocPublicAuth(Integer docId,  Integer reposId, Integer isPublic,
			Integer isAdmin, Integer access, Integer editEn, Integer addEn,
			Integer deleteEn) {
		// TODO Auto-generated method stub
		DocAuth docAuth = getPublicDocAuth(docId,reposId);
		if(isPublic == 0)	//直接删除会导致继承父节点权限，因此如果父节点有权限的情况下不能直接删除，而是设置一个不能访问的公有权限
		{
			isAdmin = 0;
			access = 0;
			editEn = 0;
			addEn = 0;
			deleteEn = 0;
		}
		
		//获取节点的直接权限
		DocAuth qDocAuth = new DocAuth();
		qDocAuth.setUserId(0); //userId == 0的表示是公有设置参数
		qDocAuth.setReposId(reposId);
		qDocAuth.setDocId(docId);
		DocAuth selfDocAuth = reposService.getDocAuth(qDocAuth);
		if(selfDocAuth == null)	//新增一个，否则更新参数
		{
			qDocAuth.setIsAdmin(isAdmin);
			qDocAuth.setAccess(access);
			qDocAuth.setEditEn(editEn);
			qDocAuth.setAddEn(addEn);
			qDocAuth.setDeleteEn(deleteEn);
			if(reposService.addDocAuth(qDocAuth) == 0)
			{
				System.out.println("addDocAuth failed");
				return false;
			}
			return true;
		}
		else	//更新设置
		{
			selfDocAuth.setIsAdmin(isAdmin);
			selfDocAuth.setAccess(access);
			selfDocAuth.setEditEn(editEn);
			selfDocAuth.setAddEn(addEn);
			selfDocAuth.setDeleteEn(deleteEn);
			if(reposService.updateDocAuth(selfDocAuth) == 0)
			{
				System.out.println("updateDocAuth failed");
				return false;
			}
			return true;
		}
	}

	private boolean setReposPublicAuth(Integer reposId, Integer isPublic,
			Integer isAdmin, Integer access, Integer editEn, Integer addEn,
			Integer deleteEn) {
		// TODO Auto-generated method stub
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setUserId(0); //userId == 0的表示是公有设置参数
		qReposAuth.setReposId(reposId);
		ReposAuth reposAuth = reposService.getReposAuth(qReposAuth);
		if(isPublic == 0)	//私有的话删除该公有设置即可
		{
			if(reposAuth != null)
			{
				if(reposService.deleteReposAuth(reposAuth.getId()) == 0)
				{
					System.out.println("deleteReposAuth failed");
					return false;
				}
			}
			return true;
		}
		
		//公有的话：如果不存在则新增，否则更新
		if(reposAuth == null)	//新增一个，否则更新参数
		{
			qReposAuth.setIsAdmin(isAdmin);
			qReposAuth.setAccess(access);
			qReposAuth.setEditEn(editEn);
			qReposAuth.setAddEn(addEn);
			qReposAuth.setDeleteEn(deleteEn);
			if(reposService.addReposAuth(qReposAuth) == 0)
			{
				System.out.println("addReposAuth failed");
				return false;
			}
			return true;
		}
		else	//更新设置
		{
			reposAuth.setIsAdmin(isAdmin);
			reposAuth.setAccess(access);
			reposAuth.setEditEn(editEn);
			reposAuth.setAddEn(addEn);
			reposAuth.setDeleteEn(deleteEn);
			if(reposService.updateReposAuth(reposAuth) == 0)
			{
				System.out.println("updateReposAuth failed");
				return false;
			}
			return true;
		}
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
