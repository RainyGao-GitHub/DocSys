package com.DocSystem.controller;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import util.ReturnAjax;
import util.GitUtil.GITUtil;
import util.SvnUtil.SVNUtil;

import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.User;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.service.impl.ReposServiceImpl;
import com.DocSystem.controller.BaseController;

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
	
	private List<Repos> getAccessableReposList(Integer userId) {
		System.out.println("getAccessableReposList() userId:" + userId);
		
		//取出用户在系统上的所有仓库权限列表
		//将仓库权限列表转换成HashMap,方便快速从列表中取出仓库的用户权限
		HashMap<Integer,ReposAuth> reposAuthHashMap = getUserReposAuthHashMap(userId);
		printObject("reposAuthHashMap:",reposAuthHashMap);
		if(reposAuthHashMap == null || reposAuthHashMap.size() == 0)
		{
			return null;
		}
		
		//get all reposAuthList to pick up the accessable List
		List<Repos> resultList = new ArrayList<Repos>();
		List<Repos> reposList = reposService.getAllReposList();
		for(int i=0;i<reposList.size();i++)
		{
			Repos repos = reposList.get(i);
			printObject("repos",repos);
			ReposAuth reposAuth = reposAuthHashMap.get(repos.getId());
			printObject("reposAuth",reposAuth);
			if(reposAuth != null && reposAuth.getAccess()!=null && reposAuth.getAccess().equals(1))
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
	public void addRepos(String name,String info, Integer type, String path, Integer verCtrl, Integer isRemote, String localSvnPath, String svnPath,String svnUser,String svnPwd, 
			Integer verCtrl1, Integer isRemote1, String localSvnPath1, String svnPath1,String svnUser1,String svnPwd1, Long createTime,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("addRepos name: " + name + " info: " + info + " type: " + type + " path: " + path + " verCtrl: " + verCtrl  + " isRemote:" +isRemote + " localSvnPath:" + localSvnPath + " svnPath: " + svnPath + " svnUser: " + svnUser + " svnPwd: " + svnPwd + " verCtrl1: " + verCtrl1  + " isRemote1:" +isRemote1 + " localSvnPath1:" + localSvnPath1 + " svnPath1: " + svnPath1 + " svnUser1: " + svnUser1 + " svnPwd1: " + svnPwd1);
		
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
		
		//Set reposInfo
		Repos repos = new Repos();
		repos.setName(name);
		repos.setInfo(info);
		repos.setType(type);
		repos.setPath(path);
		repos.setOwner(login_user.getId());
		repos.setCreateTime(createTime);
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
		
		InitReposAuthInfo(repos,login_user,rt);		
		
		syncupVerRepos(repos,login_user,rt);

		writeJson(rt, response);	
	}

	
	private boolean checkReposInfoForAdd(Repos repos, ReturnAjax rt) {
		//检查传入的参数
		String name = repos.getName();
		if((name == null) || name.isEmpty())
		{
			rt.setError("仓库名不能为空！");			
			return false;
		}

		//修正path参数
		String path = repos.getPath();
		if((path == null) || path.equals(""))
		{
			path = getDefaultReposRootPath();
		}
		else
		{
			//检查path的格式并修正：必须以/结尾
			path = dirPathFormat(path);
		}
		repos.setPath(path);

		//确定是否存在相同路径的仓库
		Repos tmpRepos = new Repos();
		tmpRepos.setName(name);
		tmpRepos.setPath(path);
		List<Repos> list = reposService.getReposList(tmpRepos);
		if((list != null) && (list.size() > 0))
		{
			rt.setError("仓库已存在:" + path + name);
			return false;
		}
		
		//RealDoc verRepos Settings check
		if(checkVerReposInfo(repos, null, true, rt) == false)
		{
			return false;
		}

		//VirtualDoc verRepos Settings check
		if(checkVerReposInfo(repos, null, false, rt) == false)
		{
			return false;
		}

		return true;
	}

	private boolean checkVerReposInfo(Repos repos,  Repos oldRepos, boolean isRealDoc,ReturnAjax rt) {
		//Check RealDoc VerRepos Settings
		Integer verCtrl = null;
		Integer isRemote = null;
		String localSvnPath = null;
		String svnPath = null;
		String oldSvnPath = null;
		
		if(isRealDoc)
		{
			verCtrl = repos.getVerCtrl();
			isRemote = repos.getIsRemote();
			localSvnPath = repos.getLocalSvnPath();
			svnPath = repos.getSvnPath();
			if(oldRepos != null)
			{
				oldSvnPath = oldRepos.getSvnPath();
			}
		}
		else
		{
			verCtrl = repos.getVerCtrl1();
			isRemote = repos.getIsRemote1();
			localSvnPath = repos.getLocalSvnPath1();
			svnPath = repos.getSvnPath1();	
			if(oldRepos != null)
			{
				oldSvnPath = oldRepos.getSvnPath1();
			}
		}
		
		if(verCtrl != 0 )
		{
			if(isRemote == 0)	//本地版本仓库
			{
				//修正localVerReposPath
				if(localSvnPath == null || localSvnPath.isEmpty())
				{
					if(isRealDoc)
					{
						repos.setLocalSvnPath(getDefaultLocalVerReposPath(repos.getPath()));
					}
					else
					{
						repos.setLocalSvnPath1(getDefaultLocalVerReposPath(repos.getPath()));						
					}
				}			
			}	
			else	//远程版本仓库
			{
				if(svnPath == null || svnPath.isEmpty())
				{
					System.out.println("版本仓库链接不能为空");	//这个其实还不是特别严重，只要重新设置一次即可
					rt.setError("版本仓库链接不能为空！");
					return false;
				}
				
				if(oldSvnPath == null || !svnPath.equals(oldSvnPath))
				{
					//检查版本仓库地址是否已使用
					if(isVerReposPathBeUsed(svnPath) == true)
					{
						System.out.println("版本仓库地址已使用:" + svnPath);	//这个其实还不是特别严重，只要重新设置一次即可
						rt.setError("版本仓库地址已使用:" + svnPath);
						return false;	
					}
				}
				
				//localVerReposPath setting
				if(verCtrl == 2)
				{
					//修正localVerReposPath
					if(localSvnPath == null || localSvnPath.isEmpty())
					{
						if(isRealDoc)
						{
							repos.setLocalSvnPath(getDefaultLocalVerReposPath(repos.getPath()));
						}
						else
						{
							repos.setLocalSvnPath1(getDefaultLocalVerReposPath(repos.getPath()));							
						}
					}
				}
			}
		}
		return true;
	}

	private boolean checkReposInfoForUpdate(Repos newReposInfo, Repos previousReposInfo, ReturnAjax rt) {
		//update repos
		if(newReposInfo.getId() == null)
		{
			rt.setError("仓库ID不能为空!");							
			return false;
		}
				
		//rename仓库
		if(newReposInfo.getName() != null)
		{
			if(newReposInfo.getName().isEmpty())
			{
				rt.setError("名字不能为空！");
				return false;
			}
		}
	
		//Change Path
		if(newReposInfo.getPath() != null)
		{
			if(newReposInfo.getPath().isEmpty())
			{
				rt.setError("位置不能为空！");
				return false;
			}
		}
		
		if(isVerReposInfoChanged(newReposInfo, previousReposInfo, true))
		{
			if(checkVerReposInfo(newReposInfo, previousReposInfo, true, rt) == false)
			{
				return false;
			}
		}
		
		if(isVerReposInfoChanged(newReposInfo, previousReposInfo, false))
		{
			if(checkVerReposInfo(newReposInfo,previousReposInfo, false, rt) == false)
			{
				return false;
			}
		}
		return true;
	}
	
	private boolean isVerReposInfoChanged(Repos newReposInfo, Repos previousReposInfo, boolean isRealDoc) {
		Integer verCtrl = null;
		Integer isRemote = null;
		String localSvnPath = null;
		String svnPath = null;	
		
		Integer preVerCtrl = null;
		Integer preIsRemote = null;
		String preLocalSvnPath = null;
		String preSvnPath = null;	
		
		if(isRealDoc)
		{
			verCtrl = newReposInfo.getVerCtrl();
			isRemote = newReposInfo.getIsRemote();
			localSvnPath = newReposInfo.getLocalSvnPath();
			svnPath = newReposInfo.getSvnPath();	
			
			preVerCtrl = previousReposInfo.getVerCtrl();
			preIsRemote = previousReposInfo.getIsRemote();
			preLocalSvnPath = previousReposInfo.getLocalSvnPath();
			preSvnPath = previousReposInfo.getSvnPath();
		}
		else
		{
			verCtrl = newReposInfo.getVerCtrl1();
			isRemote = newReposInfo.getIsRemote1();
			localSvnPath = newReposInfo.getLocalSvnPath1();
			svnPath = newReposInfo.getSvnPath1();	
			
			preVerCtrl = previousReposInfo.getVerCtrl1();
			preIsRemote = previousReposInfo.getIsRemote1();
			preLocalSvnPath = previousReposInfo.getLocalSvnPath1();
			preSvnPath = previousReposInfo.getSvnPath1();
		}
		
		if(verCtrl != null && verCtrl != preVerCtrl)
		{
			return true;
		}
		
		if(isRemote != null && isRemote != preIsRemote)
		{
			return true;
		}
		
		if(localSvnPath != null && localSvnPath != preLocalSvnPath)
		{
			return true;
		}
		
		if(svnPath != null && svnPath != preSvnPath)
		{
			return true;
		}

		return false;
	}

	private boolean initVerRepos(Repos repos, boolean isRealDoc, ReturnAjax rt) {
		Integer verCtrl = null;
		Integer isRemote = null;
		if(isRealDoc)
		{
			verCtrl = repos.getVerCtrl();
			isRemote = repos.getIsRemote();
		}
		else
		{
			verCtrl = repos.getVerCtrl1();
			isRemote = repos.getIsRemote1();
		}
		
		if(verCtrl != 0)
		{
			if(isRemote == 0)
			{	
				//Create a localVersionRepos
				if(createLocalVerRepos(repos, isRealDoc, rt) == null)
				{
					System.out.println("版本仓库创建失败");	//这个其实还不是特别严重，只要重新设置一次即可
					rt.setError("版本仓库的创建失败");	
					return false;
				}
			}
			else
			{
				//If VerRepos is Git, We need to do clone the Repository
				if(verCtrl == 2)
				{
					//Clone the Repository
					if(cloneGitRepos(repos, isRealDoc, rt) == null)
					{
						System.out.println("版本仓库Clone失败");	//这个其实还不是特别严重，只要重新设置一次即可
						rt.setError("版本仓库Clone失败");	
						return false;
					}
				}
				
			}	
		}
		return true;
	}

	private String cloneGitRepos(Repos repos, boolean isRealDoc, ReturnAjax rt) {
		GITUtil gitUtil = new GITUtil();
        
        gitUtil.Init(repos, isRealDoc, "");
        return gitUtil.CloneRepos();
	}

	private void InitReposAuthInfo(Repos repos, User login_user, ReturnAjax rt) {
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
		System.out.println("addRepos() addReposAuth return:" + ret);
		if(ret == 0)
		{
			rt.setMsgData("addRepos() addReposAuth return:" + ret);
			System.out.println("新增用户仓库权限失败");
		}
				
		//设置当前用户仓库根目录的访问权限
		DocAuth docAuth = new DocAuth();
		docAuth.setReposId(repos.getId());		//仓库：新增仓库id
		docAuth.setUserId(login_user.getId());	//访问用户：当前登录用户	
		docAuth.setDocId(0); 		//目录：根目录
		docAuth.setType(1); 		//权限类型：用户权限
		docAuth.setPriority(10); 	//权限优先级：user是10, group是1-9,anyUser是0
		docAuth.setIsAdmin(1); 		//管理员：可以管理仓库，修改描述、设置密码、设置用户访问权限
		docAuth.setAccess(1);		//访问权限：0：不可访问  1：可访问
		docAuth.setEditEn(1);		//修改权限：可以修改仓库中的文件和目录
		docAuth.setAddEn(1);		//增加权限：可以往仓库中增加文件或目录
		docAuth.setDeleteEn(1);		//删除权限：可以删除仓库中的文件或目录
		docAuth.setHeritable(1);;	//权限继承：0：不可继承  1：可继承
		ret = reposService.addDocAuth(docAuth);
		System.out.println("addRepos() addDocAuth return:" + ret);
		if(ret == 0)
		{
			rt.setMsgData("addRepos() addReposAuth return:" + ret);
			System.out.println("新增用户仓库根目录权限失败");
		}		
	}

	private boolean isVerReposPathBeUsed(String svnPath) {
		//Check if svnPath used by RealDoc
		Repos tmpRepos = new Repos();
		tmpRepos.setSvnPath(svnPath);
		List<Repos> list= reposService.getReposList(tmpRepos);
		if((list != null) && (list.size() > 0))
		{
			Repos repos = list.get(0);
			System.out.println("SvnPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " svnPath=" + repos.getPath() + " svnPath1=" + repos.getSvnPath1()); 
			return true;
		}
		
		//Check if svnPath used by VirtualDoc
		Repos tmpRepos1 = new Repos();
		tmpRepos1.setSvnPath1(svnPath);
		List<Repos> list1 = reposService.getReposList(tmpRepos1);
		if((list1 != null) && (list1.size() > 0))
		{
			Repos repos = list1.get(0);
			System.out.println("SvnPath1 duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " svnPath=" + repos.getPath() + " svnPath1=" + repos.getSvnPath1()); 
			return true;
		}
		
		return false;
	}

	private boolean createReposLocalDir(Repos repos, ReturnAjax rt) {
		String path = repos.getPath();		
		File reposRootDir = new File(path);
		if(reposRootDir.exists() == false)
		{
			System.out.println("addRepos() path:" + path + " not exists, do create it!");
			if(reposRootDir.mkdirs() == false)
			{
				rt.setError("创建reposRootDir目录失败:" + path);
				return false;	
			}
		}
		
		String reposDir = getReposPath(repos);
		if(createDir(reposDir) == true)
		{
			if(createDir(reposDir+"data/") == false)
			{
				rt.setError("创建data目录失败");
				return false;
			}
			else
			{
				if(createDir(reposDir+"data/rdata/") == false)
				{
					rt.setError("创建rdata目录失败");
					return false;
				}
				if(createDir(reposDir+"data/vdata/") == false)
				{
					rt.setError("创建vdata目录失败");
					return false;
				}
			}
			
			if(createDir(reposDir+"refData/") == false)
			{
				rt.setError("创建refData目录失败");
				return false;
			}
			else
			{
				if(createDir(reposDir+"refData/rdata/") == false)
				{
					rt.setError("创建refData/rdata目录失败");
					return false;
				}
				if(createDir(reposDir+"refData/vdata/") == false)
				{
					rt.setError("创建refData/vdata目录失败");
					return false;
				}
			}
			
			if(createDir(reposDir+"tmp/") == false)
			{
				rt.setError("创建tmp目录失败");
				return false;
			}
		}	
		else
		{
			rt.setError("创建仓库目录失败："+reposDir);
			return false;
		}
		return true;
	}

	private String getReposPath(Repos repos) {
		return repos.getPath() + repos.getId() + "/";
	}

	private boolean deleteRepos(Repos repos) {
		//Delete Repos in DB
		reposService.deleteRepos(repos.getId());
		//Delete Repos LocalDir
		deleteReposLocalDir(repos);
		//Delete Repos LocalVerRepos
		deleteLocalVerRepos(repos);
		return true;
	}

	private void deleteReposLocalDir(Repos repos) {
		String reposDir = getReposPath(repos);
		delDir(reposDir);
	}

	private void deleteLocalVerRepos(Repos repos, boolean isRealDoc) {
		//Delete LocalVerRepos
		Integer verCtrl = null;
		Integer isRemote = null;
		String localVerReposPath = null;

		if(isRealDoc)
		{
			verCtrl = repos.getVerCtrl();
			isRemote = repos.getIsRemote();
			localVerReposPath = repos.getLocalSvnPath();
		}
		else
		{
			verCtrl = repos.getVerCtrl1();
			isRemote = repos.getIsRemote1();
			localVerReposPath = repos.getLocalSvnPath1();			
		}
		
		if(verCtrl == null || isRemote == null || isRemote != 0 || localVerReposPath == null || localVerReposPath.isEmpty())
		{
			return;
		}
		
		if(verCtrl != 0 && isRemote == 0)
		{
			String localVerReposDir = localVerReposPath + getVerReposName(repos,isRealDoc);
			delDir(localVerReposDir);
		}
		
	}
	
	private String createLocalVerRepos(Repos repos, boolean isRealDoc, ReturnAjax rt) {
		System.out.println("createLocalVerRepos isRealDoc:"+isRealDoc);	
		Integer verCtrl = 0;
		if(isRealDoc)
		{
			verCtrl = repos.getVerCtrl();
		}
		else
		{
			verCtrl = repos.getVerCtrl1();
		}
		
		if(verCtrl == 1)
		{
			return createSvnLocalRepos(repos,isRealDoc, rt);
		}
		else if(verCtrl == 2)
		{
			return createGitLocalRepos(repos, isRealDoc, rt);
		}
		return null;
	}
	
	private String createGitLocalRepos(Repos repos, boolean isRealDoc, ReturnAjax rt) {
		System.out.println("createGitLocalRepos isRealDoc:"+isRealDoc);	

		String localVerRepos = getLocalVerReposPath(repos, isRealDoc);
		File dir = new File(localVerRepos);
		if(dir.exists())
		{
			System.out.println("GIT仓库:"+localVerRepos + "已存在，请直接设置！");	
			rt.setMsgData("GIT仓库:"+localVerRepos + "已存在，已直接设置！");
			return localVerRepos;
		}
		
		GITUtil gitUtil = new GITUtil();
		gitUtil.Init(repos, isRealDoc, "");
		String gitPath = gitUtil.CreateRepos();
		return gitPath;
	}

	private String createSvnLocalRepos(Repos repos, boolean isRealDoc, ReturnAjax rt) {
		System.out.println("createSvnLocalRepos isRealDoc:"+isRealDoc);	
		
		String path = repos.getPath();
		String localPath = null;
		if(isRealDoc)
		{
			localPath = repos.getLocalSvnPath();
		}
		else
		{
			localPath = repos.getLocalSvnPath1();
		}
		
		
		//If use localVerRepos, empty path mean use the the directory: path+/DocSysSvnReposes
		if((localPath == null) || localPath.equals(""))
		{
			localPath = getDefaultLocalVerReposPath(path);
		}
	
		String reposName = getVerReposName(repos,isRealDoc);
		
		File dir = new File(localPath,reposName);
		if(dir.exists())
		{
			System.out.println("SVN仓库:"+localPath+reposName + "已存在，请直接设置！");	
			rt.setMsgData("SVN仓库:"+localPath+reposName + "已存在，已直接设置！");
			return "file:///" + localPath + reposName;
		}
		
		String svnPath = SVNUtil.CreateRepos(reposName,localPath);
		return svnPath;
	}

	private void syncupVerRepos(Repos repos, User login_user, ReturnAjax rt) {
		System.out.println("syncupVerRepos()");
		
		//Real Doc 带版本控制，则需要同步本地和版本仓库
		Integer verCtrl = repos.getVerCtrl();
		if(verCtrl != 0)
		{	
			String reposRPath = getReposRealPath(repos);
			String commitUser = login_user.getName();
			String commitMsg = "RealDoc版本仓库初始化";
			if(verReposAutoCommit(repos, true, reposRPath,commitMsg,commitUser,false,null) == false)
			{
				System.out.println("RealDoc版本仓库初始化失败:");
				rt.setMsgData("RealDoc版本仓库初始化失败");
			}
		}
		
		//Virtual Doc 带版本控制，则需要同步本地和版本仓库
		Integer verCtrl1 = repos.getVerCtrl1();
		if(verCtrl1 != 0)
		{					
			String reposVPath = getReposVirtualPath(repos);
			String commitUser = login_user.getName();
			String commitMsg = "VirtualDoc版本仓库初始化";
			if(verReposAutoCommit(repos, false, reposVPath, commitMsg,commitUser,false,null) == false)
			{
				System.out.println("VirtualDoc版本仓库初始化失败:");
				rt.setMsgData("VirtualDoc版本仓库初始化失败");
			}
		}	
	}
	
	private boolean verReposAutoCommit(Repos repos,boolean isRealDoc, String localPath,String commitMsg, String commitUser,boolean modifyEnable,String localRefPath) {
		Integer verCtrl = null;
		if(isRealDoc)
		{
			verCtrl = repos.getVerCtrl();
		}	
		else
		{
			verCtrl = repos.getVerCtrl1();
		}
			
		if(verCtrl == 1)
		{
			return svnAutoCommit(repos,isRealDoc,localPath,commitMsg,commitUser,modifyEnable,localRefPath);
		}
		else if(verCtrl == 2)
		{
			return gitAutoCommit(repos,isRealDoc,localPath,commitMsg,commitUser,modifyEnable,localRefPath);			
		}
		return false;
	}
	
	private boolean gitAutoCommit(Repos repos,boolean isRealDoc, String localPath, String commitMsg, String commitUser, boolean modifyEnable, String localRefPath) {
		// TODO Auto-generated method stub
		GITUtil gitUtil = new GITUtil();
		//svn初始化
		if(gitUtil.Init(repos, isRealDoc, commitUser) == false)
		{
			System.out.println("do Init Failed");
			return false;
		}
		return gitUtil.doAutoCommit("","",localPath,commitMsg,commitUser,modifyEnable,localRefPath);
	}

	//Commit the localPath to svnPath
	boolean svnAutoCommit(Repos repos,boolean isRealDoc,String localPath,String commitMsg, String commitUser,boolean modifyEnable,String localRefPath)
	{			
		SVNUtil svnUtil = new SVNUtil();
		//svn初始化
		if(svnUtil.Init(repos,isRealDoc,commitUser) == false)
		{
			System.out.println("do Init Failed");
			return false;
		}
		
		return svnUtil.doAutoCommit("","",localPath,commitMsg,commitUser,modifyEnable,localRefPath);		
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
		
		//为了避免直接删除仓库数据，系统删除仓库将只删除仓库记录，仓库数据需要用户手动删除
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
		}
		
		
		writeJson(rt, response);	
	}
	
	/****************   set a Repository ******************/
	@RequestMapping("/updateReposInfo.do")
	public void updateReposInfo(Integer reposId, String name,String info, Integer type,String path, Integer verCtrl, Integer isRemote, String localSvnPath, String svnPath,String svnUser,String svnPwd,
			Integer verCtrl1, Integer isRemote1, String localSvnPath1, String svnPath1,String svnUser1,String svnPwd1,HttpSession session,HttpServletRequest request,HttpServletResponse response)
	{
		System.out.println("updateReposInfo reposId:" + reposId + " name: " + name + " info: " + info + " type: " + type  + " path: " + path + " verCtrl: " + verCtrl + " isRemote:" + isRemote + " localSvnPath:" + localSvnPath + " svnPath: " + svnPath + " svnUser: " + svnUser + " svnPwd: " + svnPwd + " verCtrl1: " + verCtrl1 + " isRemote1:"+ isRemote1 + " localSvnPath1:" + localSvnPath1 + " svnPath1: " + svnPath1 + " svnUser1: " + svnUser1 + " svnPwd1: " + svnPwd1);
		
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
		
		//Path re
		if(path != null && !path.isEmpty())
		{
			path = dirPathFormat(path);
		}
		if(localSvnPath != null && !localSvnPath.isEmpty())
		{
			localSvnPath = dirPathFormat(localSvnPath);
		}
		if(localSvnPath1 != null && !localSvnPath1.isEmpty())
		{
			localSvnPath1 = dirPathFormat(localSvnPath1);
		}
		
		//Set new ReposInfo
		Repos newReposInfo = new Repos();
		newReposInfo.setId(reposId);
		newReposInfo.setName(name);
		newReposInfo.setInfo(info);
		newReposInfo.setPath(path);
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
		
		syncupVerRepos(repos,login_user,rt);
		
		writeJson(rt, response);	
	}


	private boolean ChangeReposPath(Repos newReposInfo, Repos previousReposInfo, User login_user,ReturnAjax rt) {
		String path = newReposInfo.getPath();
		String oldPath = previousReposInfo.getPath();
		if(path != null && !path.equals(oldPath))
		{
			System.out.println("ChangeReposPath oldPath:" + oldPath + " newPath:" + path);
			
			if(login_user.getType() != 2)
			{
				System.out.println("普通用户无权修改仓库存储位置，请联系管理员！");
				rt.setError("普通用户无权修改仓库存储位置，请联系管理员！");
				return false;							
			}
			
			//newReposRootDir	
			File newReposRootDir = new File(path);
			if(newReposRootDir.exists() == false)
			{
				System.out.println("ChangeReposPath() path:" + path + " not exists, do create it!");
				if(newReposRootDir.mkdirs() == false)
				{
					rt.setError("创建reposRootDir目录失败:" + path);
					return false;	
				}
			}
			
			//Do move the repos
			String reposName = previousReposInfo.getId()+"";
			if(copyFileOrDir(oldPath+reposName, path+reposName,false) == false)
			{
				System.out.println("仓库目录迁移失败！");
				rt.setError("修改仓库位置失败！");					
				return false;
			}
			else
			{
				delFileOrDir(oldPath+reposName);
			}
		}
		return true;
	}	
	/****************   get Repository Menu so that we can touch the docId******************/
	@RequestMapping("/getReposInitMenu.do")
	public void getReposMenu(Integer vid,Integer docId,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("getReposInitMenu vid: " + vid + " docId: " + docId);
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户登录，请先登录！");
			writeJson(rt, response);			
			return;
		}
		
		//获取用户可访问文件列表(From Root to docId)
		List <Doc> docList = null;
		if(docId == null || docId == 0)
		{
			docList = getAccessableSubDocList(login_user.getId(),0,vid);
		}
		else
		{
			docList = getDocListFromRootToDoc(vid,docId,login_user.getId());
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
	
	private List<Doc> getDocListFromRootToDoc(Integer vid, Integer docId, Integer UserId) {
		
		System.out.println("getDocListFromRootToDoc() userId:" + UserId + " vid:" + vid  + " docId:" + docId);
		
		//Get the userDocAuthHashMap
		HashMap<Integer,DocAuth> docAuthHashMap = getUserDocAuthHashMap(UserId,vid);

		//获取从docId到rootDoc的全路径，put it to docPathList
		List<Integer> docIdList = new ArrayList<Integer>();
		docIdList = getDocIdList(docId,docIdList);
		
		//size <=2，表明docId位于rootDoc下或不存在，都只取出根目录下的subDocs
		if(docIdList.size() <= 2)
		{
			DocAuth docAuth = getDocAuthFromHashMap(0,null,docAuthHashMap);
			List<Doc> docList = getAuthedSubDocList(0,vid,docAuth,docAuthHashMap);
			return docList;
		}
		
		//go throug the docIdList to get the UserDocAuthFromHashMap
		List<Doc> resultList = new ArrayList<Doc>();
		DocAuth parentDocAuth = null;
		int docPathDeepth = docIdList.size();
		for(int i=(docPathDeepth-1);i>0;i--)	//We should not to get subDocList with index 0 (which is the docId) 
		{
			Integer curDocId = docIdList.get(i);
			System.out.println("getDocListFromRootToDoc() curDocId[" + i+ "]:" + curDocId); 
			DocAuth docAuth = getDocAuthFromHashMap(curDocId,parentDocAuth,docAuthHashMap);
			List<Doc> subDocList = getAuthedSubDocList(curDocId,vid,docAuth,docAuthHashMap);
			if(subDocList != null && subDocList.size() > 0)
			{
				resultList.addAll(subDocList);
			}
			parentDocAuth = docAuth;
		}		
		return resultList;
	}
	
	//获取pid下的SubDocList
	private List <Doc> getAuthedSubDocList(Integer pid,Integer vid,DocAuth pDocAuth, HashMap<Integer,DocAuth> docAuthHashMap)
	{
		System.out.println("getAuthedDocList()" + " pid:" + pid + " vid:" + vid);
		if(pDocAuth == null || pDocAuth.getAccess() == null || pDocAuth.getAccess() == 0)
		{
			return null;
		}
		//printObject("getAuthedDocList() parentDocAuth:",pDocAuth);
		
		//获取子目录所有文件
		List <Doc> docList = getSubDocList(pid,vid);
		if(docList == null || docList.size() == 0)
		{
			return null;
		}
		
		//get the rootDocAuth
		DocAuth rootDocAuth = getDocAuthFromHashMap(0,null,docAuthHashMap);
		if(rootDocAuth == null)
		{
			System.out.println("getAuthedSubDocList() 用户根目录权限未设置");
			return null;
		}
		
		//Go through the docList if the doc can be access, add it to resultList
		List <Doc> resultList = new ArrayList<Doc>();
		for(int i=0;i<docList.size();i++)
		{
			Doc doc = docList.get(i);
			Integer docId = doc.getId();
			DocAuth docAuth = getDocAuthFromHashMap(docId,pDocAuth,docAuthHashMap);
			//System.out.println("getAuthedSubDocList() docId:"+docId + " docName:" + doc.getName());
			//printObject("getAuthedSubDocList() docAuth:",docAuth);
			if(docAuth != null && docAuth.getAccess()!=null && docAuth.getAccess() == 1)
			{
				resultList.add(doc);
			}
		}
		return resultList;
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
		return recurGetAuthedSubDocList(0,vid,rootDocAuth,docAuthHashMap,docList);
	}

	//这是个递归调用函数
	private List <Doc> recurGetAuthedSubDocList(Integer pid,Integer vid,DocAuth pDocAuth, HashMap<Integer,DocAuth> docAuthHashMap, List<Doc> resultList)
	{
		//System.out.println("recurGetAuthedDocList()" + " pid:" + pid + " vid:" + vid);
		if(pDocAuth == null || pDocAuth.getAccess() == null || pDocAuth.getAccess() == 0)
		{
			return resultList;
		}
		//printObject("recurGetAuthedDocList() parentDocAuth:",pDocAuth);
		
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
			DocAuth docAuth = getDocAuthFromHashMap(docId,pDocAuth,docAuthHashMap);
			//System.out.println("recurGetAuthedDocList() docId:"+docId + " docName:" + doc.getName());
			//printObject("recurGetAuthedDocList() docAuth:",docAuth);
			if(docAuth != null && docAuth.getAccess()!=null && docAuth.getAccess() == 1)
			{
				resultList.add(doc);
				if(doc.getType() == 2)
				{
					recurGetAuthedSubDocList(docId,vid,docAuth,docAuthHashMap,resultList);
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
	
	/****************   get subDocList under pid ******************/
	@RequestMapping("/getSubDocList.do")
	public void getSubDocList(Integer id,Integer vid,HttpSession session,HttpServletRequest request,HttpServletResponse response){
		System.out.println("getSubDocList pid: " + id + " vid: " + vid);
		Integer pid = id;
		if(pid == null)
		{
			pid = 0;
		}
		
		ReturnAjax rt = new ReturnAjax();
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			rt.setError("用户未登录，请先登录！");
			writeJson(rt, response);			
			return;
		}		
		
		//获取用户可访问文件列表
		List <Doc> docList = getAccessableSubDocList(login_user.getId(),pid,vid);
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
	
	//getAccessableSubDocList
	private List<Doc> getAccessableSubDocList(Integer userID, Integer pid,Integer vid) {		
		System.out.println("getAccessableSubDocList() userId:" + userID + " pid:" + pid + " vid:" + vid);
		
		//Get the userDocAuthHashMap
		HashMap<Integer,DocAuth> docAuthHashMap = getUserDocAuthHashMap(userID,vid);
		
		//get the rootDocAuth
		DocAuth pDocAuth = getUserDispDocAuth(userID,pid,vid);
		if(pDocAuth == null || pDocAuth.getAccess() == null || pDocAuth.getAccess() == 0)
		{
			System.out.println("getAccessableSubDocList() 用户没有该目录的权限");
			return null;
		}
		
		//获取子目录所有authed subDocs
		List <Doc> resultList = getAuthedSubDocList(pid, vid, pDocAuth, docAuthHashMap);
		return resultList;
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
		List <Doc> docList = getReposManagerMenu(vid,login_user);
		
		//合并列表
		docList.add(rootDoc);
		rt.setData(docList);
		writeJson(rt, response);
	}
	
	private List<Doc> getReposManagerMenu(Integer vid, User login_user) {
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
			//get the data from doc
			Doc doc = new Doc();
			doc.setVid(vid);
			List <Doc> docList = reposService.getDocList(doc);
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
