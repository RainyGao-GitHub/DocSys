package com.DocSystem.controller;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import util.LuceneUtil2;
import util.ReturnAjax;
import util.GitUtil.GITUtil;
import util.SvnUtil.SVNUtil;

import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.User;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.controller.BaseController;

@Controller
@RequestMapping("/Repos")
public class ReposController extends BaseController{
	
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
		
		Integer UserId = login_user.getId();
		System.out.println("UserId:" + UserId);
		List <Repos> accessableReposList = getAccessableReposList(UserId);
		printObject("getReposList() accessableReposList",accessableReposList);
		rt.setData(accessableReposList);
		writeJson(rt, response);
	}
	
	@RequestMapping("/getManagerReposList.do")
	public void getManagerReposList(HttpSession session,HttpServletResponse response){
		System.out.println("getManagerReposList");
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
	public void addRepos(String name,String info, Integer type, String path, String realDocPath, Integer verCtrl, Integer isRemote, String localSvnPath, String svnPath,String svnUser,String svnPwd, 
			Integer verCtrl1, Integer isRemote1, String localSvnPath1, String svnPath1,String svnUser1,String svnPwd1, Long createTime,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("addRepos name: " + name + " info: " + info + " type: " + type + " path: " + path  + " realDocPath: " + realDocPath + " verCtrl: " + verCtrl  + " isRemote:" +isRemote + " localSvnPath:" + localSvnPath + " svnPath: " + svnPath + " svnUser: " + svnUser + " svnPwd: " + svnPwd + " verCtrl1: " + verCtrl1  + " isRemote1:" +isRemote1 + " localSvnPath1:" + localSvnPath1 + " svnPath1: " + svnPath1 + " svnUser1: " + svnUser1 + " svnPwd1: " + svnPwd1);
		
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
		
		//格式化参数
		if((path == null) || path.equals(""))
		{
			path = getDefaultReposRootPath();
		}
		else
		{
			path = localDirPathFormat(path);
		}
		if(realDocPath != null && !realDocPath.isEmpty())
		{
			realDocPath = localDirPathFormat(realDocPath);
		}
		if(localSvnPath != null && !localSvnPath.isEmpty())
		{
			localSvnPath = localDirPathFormat(localSvnPath);
		}
		if(localSvnPath1 != null && !localSvnPath1.isEmpty())
		{
			localSvnPath1 = localDirPathFormat(localSvnPath1);
		}
		
		//如果去除realDocPath的限制，文件系统前置将具备非常大的灵活性和破坏性（可以查看和删除后台的所有文件）
		//仓库位置与RealDoc存储位置不能重复
		if(isPathConflict(path,realDocPath))
		{
			System.out.println("addRepos() 仓库存储路径与文件存储路径冲突");
			String ErrMsg = "仓库存储路径:" + path + " 与文件存储路径:" + realDocPath + " 冲突";
			rt.setError(ErrMsg);
			writeJson(rt, response);		
			return;	
		}
		
		//Set reposInfo
		Repos repos = new Repos();
		repos.setName(name);
		repos.setInfo(info);
		repos.setType(type);
		repos.setPath(path);
		repos.setRealDocPath(realDocPath);
		repos.setOwner(login_user.getId());
		long nowTimeStamp = new Date().getTime();//获取当前系统时间戳
		repos.setCreateTime(nowTimeStamp);
		//RealDoc VerCtrlInfo
		repos.setVerCtrl(verCtrl);
		repos.setIsRemote(isRemote);
		repos.setLocalSvnPath(localSvnPath);
		repos.setSvnPath(svnPath);
		repos.setSvnUser(svnUser);
		repos.setSvnPwd(svnPwd);
		//VirtualDoc VerCtrlInfo		
		repos.setVerCtrl1(verCtrl1);
		repos.setIsRemote1(isRemote1);
		repos.setLocalSvnPath1(localSvnPath1);
		repos.setSvnPath1(svnPath1);
		repos.setSvnUser1(svnUser1);
		repos.setSvnPwd1(svnPwd1);
		//Lock the repos
		repos.setState(1);
		repos.setLockBy(login_user.getId());
		long lockTime = nowTimeStamp + 4*60*60*1000;
		repos.setLockTime(lockTime);
		
		//由于仓库还未创建，因此无法确定仓库路径是否存在冲突
		if(checkReposInfoForAdd(repos, rt) == false)
		{
			System.out.println("checkReposInfoForAdd() failed");
			writeJson(rt, response);		
			return;			
		}
		
		if(reposService.addRepos(repos) == 0)
		{
			rt.setError("新增仓库记录失败");
			writeJson(rt, response);		
			return;
		}
		Integer reposId = repos.getId();
		System.out.println("new ReposId" + reposId);
		
		if(createReposLocalDir(repos,rt) == false)
		{
			deleteRepos(repos);			
			writeJson(rt, response);	
			return;
		}
		
		//Init verRepos for RealDoc
		if(initVerRepos(repos,true,rt) == false)
		{
			deleteRepos(repos);
			writeJson(rt, response);	
			return;			
		}

		//Init verRepos for VirtualDoc
		if(initVerRepos(repos, false, rt) == false)
		{
			deleteRepos(repos);
			writeJson(rt, response);	
			return;			
		}

		String reposRPath = getReposRealPath(repos);
		int ret = SyncUpWithVerRepos(repos, 0, null, "", reposRPath, null, null, login_user, rt, true, true);
		if(ret < 0)
		{
			deleteRepos(repos);
			writeJson(rt, response);	
			return;
		}
		
		InitReposAuthInfo(repos,login_user,rt);		
		
		//UnLock Repos
		Repos tempRepos = new Repos();
		tempRepos.setId(reposId);
		tempRepos.setState(0);	//
		tempRepos.setLockBy(0);	//
		tempRepos.setLockTime((long)0);	//Set lockTime	
		if(reposService.updateRepos(tempRepos) == 0)
		{
			rt.setError("更新仓库记录失败");
			writeJson(rt, response);		
			return;
		}
		
		writeJson(rt, response);	
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
		
		Repos repos = reposService.getRepos(vid);
		
		if(reposService.deleteRepos(vid) == 0)
		{
			rt.setError("仓库删除失败！");
			writeJson(rt, response);	
			return;
		}
		else
		{
			//Delete related doc auth Setting
			DocAuth docAuth = new DocAuth();
			docAuth.setReposId(vid);			
			reposService.deleteDocAuthSelective(docAuth);

			//Delete related repos auth Setting
			ReposAuth reposAuth = new ReposAuth();
			reposAuth.setReposId(vid);			
			reposService.deleteReposAuthSelective(reposAuth);

			//Delete Repos LocalDir
			deleteReposLocalDir(repos);
			
			//Delete Repos LocalVerRepos
			deleteLocalVerRepos(repos, true);
			deleteLocalVerRepos(repos, false);
			
			//Delete IndexLib
	    	LuceneUtil2.deleteIndexLib(getIndexLibName(repos.getId(),0));
			LuceneUtil2.deleteIndexLib(getIndexLibName(repos.getId(),1));
	    	LuceneUtil2.deleteIndexLib(getIndexLibName(repos.getId(),2));
		}
		
		
		writeJson(rt, response);	
	}
	
	/****************   set a Repository ******************/
	@RequestMapping("/updateReposInfo.do")
	public void updateReposInfo(Integer reposId, String name,String info, Integer type,String path, String realDocPath, Integer verCtrl, Integer isRemote, String localSvnPath, String svnPath,String svnUser,String svnPwd,
			Integer verCtrl1, Integer isRemote1, String localSvnPath1, String svnPath1,String svnUser1,String svnPwd1,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("updateReposInfo reposId:" + reposId + " name: " + name + " info: " + info + " type: " + type  + " path: " + path + " realDocPath:" + realDocPath +" verCtrl: " + verCtrl + " isRemote:" + isRemote + " localSvnPath:" + localSvnPath + " svnPath: " + svnPath + " svnUser: " + svnUser + " svnPwd: " + svnPwd + " verCtrl1: " + verCtrl1 + " isRemote1:"+ isRemote1 + " localSvnPath1:" + localSvnPath1 + " svnPath1: " + svnPath1 + " svnUser1: " + svnUser1 + " svnPwd1: " + svnPwd1);
		
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
		
		//参数格式化
		if(path != null && !path.isEmpty())
		{
			path = localDirPathFormat(path);
		}
		if(realDocPath != null && !realDocPath.isEmpty())
		{
			realDocPath = localDirPathFormat(realDocPath);
		}
		if(localSvnPath != null && !localSvnPath.isEmpty())
		{
			localSvnPath = localDirPathFormat(localSvnPath);
		}
		if(localSvnPath1 != null && !localSvnPath1.isEmpty())
		{
			localSvnPath1 = localDirPathFormat(localSvnPath1);
		}
		
		//Set new ReposInfo
		Repos newReposInfo = new Repos();
		newReposInfo.setId(reposId);
		newReposInfo.setName(name);
		newReposInfo.setInfo(info);
		newReposInfo.setPath(path);
		newReposInfo.setRealDocPath(realDocPath);
		newReposInfo.setVerCtrl(verCtrl);
		newReposInfo.setIsRemote(isRemote);
		newReposInfo.setLocalSvnPath(localSvnPath);
		newReposInfo.setSvnPath(svnPath);
		newReposInfo.setSvnUser(svnUser);
		newReposInfo.setSvnPwd(svnPwd);
		newReposInfo.setVerCtrl1(verCtrl1);
		newReposInfo.setIsRemote1(isRemote1);
		newReposInfo.setLocalSvnPath1(localSvnPath1);
		newReposInfo.setSvnPath1(svnPath1);
		newReposInfo.setSvnUser1(svnUser1);
		newReposInfo.setSvnPwd1(svnPwd1);	
		
		//Get reposInfo (It will be used to revert the reposInfo)
		Repos reposInfo = reposService.getRepos(reposId);
		
		newReposInfo.setType(reposInfo.getType());
		if(checkReposInfoForUpdate(newReposInfo, reposInfo, rt) == false)
		{
			writeJson(rt, response);	
			return;
		}
		
		//Update ReposInfo
		if(reposService.updateRepos(newReposInfo) == 0)
		{
			System.out.println("仓库信息更新失败");	//这个其实还不是特别严重，只要重新设置一次即可
			rt.setError("仓库信息更新失败！");
			writeJson(rt, response);	
			return;
		}
		
		if(ChangeReposPath(newReposInfo, reposInfo, login_user, rt) == false)
		{
			reposService.updateRepos(reposInfo);	//Revert reposInfo
			System.out.println("仓库目录修改失败");
			writeJson(rt, response);	
			return;
		}
		
		if(ChangeReposRealDocPath(newReposInfo, reposInfo, login_user, rt) == false)
		{
			reposService.updateRepos(reposInfo);	//Revert reposInfo
			System.out.println("仓库RealDoc目录修改失败");
			writeJson(rt, response);	
			return;
		}
		
		//To get updated reposInfo
		Repos repos = reposService.getRepos(reposId);
		if(isVerReposInfoChanged(newReposInfo, reposInfo, true))
		{
			if(initVerRepos(repos, true, rt) == false)
			{
				reposService.updateRepos(reposInfo);	//Revert reposInfo
				System.out.println("版本仓库初始化失败");	//这个其实还不是特别严重，只要重新设置一次即可
				rt.setError("版本仓库初始化失败！");
				writeJson(rt, response);	
				return;
			}
		}
		
		if(isVerReposInfoChanged(newReposInfo, reposInfo, false))
		{
			if(initVerRepos(repos, false, rt) == false)
			{
				reposService.updateRepos(reposInfo);	//Revert reposInfo
				System.out.println("版本仓库初始化失败");	//这个其实还不是特别严重，只要重新设置一次即可
				rt.setError("版本仓库初始化失败！");
				writeJson(rt, response);	
				return;
			}
		}
		
		syncupWithLocalEntry(repos,login_user,rt);
		
		writeJson(rt, response);	
	}
	
	/****************   get Repository Menu so that we can touch the docId******************/
	@RequestMapping("/getReposInitMenu.do")
	public void getReposMenu(Integer reposId,Integer docId, String parentPath, String docName, HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("getReposInitMenu reposId: " + reposId + " docId: " + docId + " parentPath:" + parentPath + " docName:" + docName);
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//Get Repos
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("仓库 " + reposId + " 不存在！");
			writeJson(rt, response);			
			return;
		}
		
		List <Doc> docList = null;
		if(docId == null || docId == 0)
		{
			docList = getAccessableSubDocList(repos, 0, 0, "", login_user, rt);
		}
		else
		{
			//获取用户可访问文件列表(From Root to Doc)
			docList = getDocListFromRootToDoc(repos, docId, parentPath, docName, login_user ,rt);
		}

		if(docList == null)
		{
			rt.setData("");
		}
		else
		{
			rt.setData(docList);	
		}
		writeJson(rt, response);
		return;		
	}
	
	/* 
	 * get subDocList under parentPath
	 * 
	 * 注意：该接口的参数是前台自动填充的，因此请勿修改参数名字，否则将导致接口错误	
	 *   
	 */
	@RequestMapping("/getSubDocList.do")
	public void getSubDocList(Integer vid, Integer id,Integer level, String path, String name, HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getSubDocList reposId: " + vid + " pid: " + id  + " pLevel:" + level + " path:" + path + " name:"+ name );
		Integer pid = id;
		if(pid == null || pid == 0)
		{
			pid = 0;
			level = 0;
			path = "";
		}
		else
		{
			level = level + 1;
		}
		
		String parentPath = "";
		if(name != null && !name.isEmpty())
		{
			parentPath = path + name +"/";
		}
		else
		{
			parentPath = path;
		}
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}		
		
		//Get Repos
		Repos repos = reposService.getRepos(vid);
		//获取用户可访问文件列表
		List <Doc> docList = getAccessableSubDocList(repos, pid, level, parentPath, login_user, rt);

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
	
	/****************   get Repository Menu Info (Directory structure) ******************/
	@RequestMapping("/getReposManagerMenu.do")
	public void getReposManagerMenu(Integer vid,Integer docId, String parentPath, String docName, HttpSession session,HttpServletRequest request,HttpServletResponse response){
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
		//获取用户可访问文件列表(From Root to docId)
		List <Doc> docList =  null;
		
		//对于前置类型因为文件节点不存在因此只能设置根目录权限
		if(docId == null || docId == 0)
		{
			docList = getAccessableSubDocList(repos, 0, 0, "", login_user, rt);
		}
		else
		{
			docList = getDocListFromRootToDoc(repos, docId, parentPath, docName, login_user ,rt);
		}	
		
		//合并列表
		if(docList == null)
		{
			docList = new ArrayList<Doc>();
		}
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
		List <ReposAuth> UserList = getReposAllUsers(reposId);
		
		rt.setData(UserList);
		writeJson(rt, response);
		
	}
	
	private List<ReposAuth> getReposAllUsers(Integer reposId) {
		//获取user表（通过reposId来joint reposAuht表，以确定用户的仓t库权限），结果实际是reposAuth列表
		List <ReposAuth> UserList = reposService.getReposAllUsers(reposId);	
		printObject("UserList:",UserList);
		
		//获取任意用户的ReposAuth，因为任意用户是虚拟用户在数据库中不存在，因此需要单独获取
		ReposAuth anyUserReposAuth = getUserReposAuth(0,reposId); //获取任意用户的权限表
		if(anyUserReposAuth == null)	//用户未设置，则将任意用户加入到用户未授权用户列表中去
		{
			anyUserReposAuth = new ReposAuth();
			anyUserReposAuth.setUserId(0);
			anyUserReposAuth.setUserName("任意用户");
		}
		else
		{
			anyUserReposAuth.setUserName("任意用户");
		}
		UserList.add(anyUserReposAuth);	//将任意用户插入到ReposUserList			
		return UserList;
	}	
	
	/********** 获取系统所有用户组 ：前台用于给仓库添加访问用户组，返回的结果实际上是reposAuth列表***************/
	@RequestMapping("/getReposAllGroups.do")
	public void getReposAllGroups(Integer reposId,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getReposAllGroups reposId: " + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//获取All GroupList
		List <ReposAuth> List = reposService.getReposAllGroups(reposId);	
		
		rt.setData(List);
		writeJson(rt, response);
		
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
				docAuth = getUserDispDocAuth(userId,docId,reposId);
			}
			else if(groupId != null)
			{
				docAuth = getGroupDispDocAuth(groupId,docId,reposId);
			}
			printObject("docAuth:", docAuth);
			
			if(docAuth !=null)
			{
				docAuthList.add(docAuth);
			}	
		}
		
		//如果是根目录，则将仓库下其他所有的值直接设置显示出来
		if(docId == null || docId == 0)
		{
			List <DocAuth> allDocAuthList = reposService.getAllDocAuthList(reposId);
			if(allDocAuthList != null)
			{
				//add the docAuth to docAuthList which docId is not 0
				for(int i=0;i<allDocAuthList.size();i++)
				{
					DocAuth tmpDocAuth = allDocAuthList.get(i);
					Integer tmpDocId = tmpDocAuth.getDocId();
					if(!tmpDocId.equals(0))
					{
						/* userName groupName should be query directly in get allDocAuth sql 
						String userName = getUserName(tmpDocAuth.getUserId());
						tmpDocAuth.setUserName(userName);
						*/
						Doc doc = getDocInfo(tmpDocId);
						if(doc != null)
						{
							tmpDocAuth.setDocName(doc.getName());
							tmpDocAuth.setDocPath(doc.getPath());
						}
						docAuthList.add(tmpDocAuth);						
					}
				}
			}
		}
		printObject("docAuthList:",docAuthList);

		rt.setData(docAuthList);
		writeJson(rt, response);
	}

	private List<ReposAuth> getReposAuthList(Integer reposId) {
		System.out.println("getReposAuthList() reposId:" + reposId);
		List <ReposAuth> ReposAuthList = reposService.getReposAuthList(reposId);	//注意已经包括了任意用户
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
			qReposAuth.setGroupId(groupId);		
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
				if(type == 2)
				{
					rt.setError("用户组仓库权限新增失败");
				}
				else
				{
					rt.setError("用户仓库权限新增失败");
				}
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
				if(type == 2)
				{
					rt.setError("用户组仓库权限更新失败");
				}
				else
				{
					rt.setError("用户仓库权限更新失败");
				}
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
		System.out.println("configDocAuth userId: " + userId +" groupId: " + groupId+ " docId:" + docId + " reposId:" + reposId + " isAdmin:" + isAdmin + " access:" + access + " editEn:" + editEn + " addEn:" + addEn  + " deleteEn:" + deleteEn + " heritable:" + heritable);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}

		//检查当前用户的权限
		if(isAdminOfDoc(login_user, docId, reposId) == false)
		{
			System.out.println("您不是该目录/文件的管理员，请联系管理员开通权限 ！");
			rt.setError("您不是该目录/文件的管理员，请联系管理员开通权限 ！");
			writeJson(rt, response);			
			return;
		}
		
		//login_user不得设置超过自己的权限：超过了则无效
		if(isUserAuthExpanded(login_user,docId,reposId,isAdmin,access,editEn,addEn,deleteEn,heritable,rt) == true)
		{
			System.out.println("超过设置者的权限 ！");
			writeJson(rt, response);			
			return;			
		}
		
		
		Integer type = getAuthType(userId,groupId);
		if(type == null)
		{
			System.out.println("getAuthType failed");
			rt.setError("getAuthType Failed");
			writeJson(rt, response);			
			return;
		}
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
				if(type == 2)
				{
					rt.setError("用户组文件权限增加失败");					
				}
				else
				{
					rt.setError("用户文件权限增加失败");					
				}
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
				if(type == 2)
				{
					rt.setError("用户组文件权限更新失败");					
				}
				else
				{
					rt.setError("用户文件权限更新失败");
				}
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

	private boolean isUserAuthExpanded(User login_user,Integer docId,Integer reposId, Integer isAdmin, Integer access,
			Integer editEn, Integer addEn, Integer deleteEn, Integer heritable,ReturnAjax rt) {
		
		if(login_user.getType() == 2)
		{
			System.out.println("超级管理员");
			return false;
		}
		
		
		DocAuth docAuth = getUserDocAuth(login_user.getId(),docId,reposId); 
		if(docAuth == null)
		{
			rt.setError("您没有该目录/文件的权限");
			return true;
		}
		
		if(docAuth.getIsAdmin()==null || isAdmin > docAuth.getIsAdmin())
		{
			rt.setError("您无权设置管理员权限");
			return true;
		}
		if(docAuth.getAccess()==null || access > docAuth.getAccess())
		{
			rt.setError("您无权设置读权限");
			return true;
		}
		if(docAuth.getEditEn()==null || editEn > docAuth.getEditEn())
		{
			rt.setError("您无权设置写权限");
			return true;
		}
		if(docAuth.getAddEn()==null || addEn > docAuth.getAddEn())
		{
			rt.setError("您无权设置新增权限");
			return true;
		}
		if(docAuth.getDeleteEn()==null || deleteEn > docAuth.getDeleteEn())
		{
			rt.setError("您无权设置删除权限");
			return true;
		}
		if(docAuth.getHeritable()==null || heritable > docAuth.getHeritable())
		{
			rt.setError("您无权设置权限继承");
			return true;
		}
		
		return false;
	}
	
	/********************* get UserDocAuth ******************************/
	@RequestMapping("/getUserDocAuth.do")
	public void getUserDocAuth(Integer docId, Integer reposId,
			HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("getUserDocAuth "  + " docId: " + docId  + " reposId:" + reposId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//检查该用户是否设置了目录权限
		DocAuth docAuth = getUserDispDocAuth(login_user.getId(),docId,reposId); 
		if(docAuth == null)
		{
			rt.setError("您没有该目录/文件的权限");
			return;
		}
		
		rt.setData(docAuth);
		writeJson(rt, response);			
	}

}
