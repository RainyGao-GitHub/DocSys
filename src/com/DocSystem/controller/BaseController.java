package com.DocSystem.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.channels.FileChannel;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map.Entry;
import java.util.Properties;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;
import org.tmatesoft.svn.core.SVNNodeKind;

import util.ReturnAjax;

import com.DocSystem.common.BaseFunction;
import com.DocSystem.common.CommitAction;
import com.DocSystem.common.CommonAction;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.entity.User;
import com.DocSystem.entity.UserGroup;
import com.DocSystem.service.impl.ReposServiceImpl;
import com.DocSystem.service.impl.UserServiceImpl;

import util.GitUtil.GITUtil;
import util.LuceneUtil.LuceneUtil2;
import util.SvnUtil.SVNUtil;

public class BaseController  extends BaseFunction{
	@Autowired
	protected ReposServiceImpl reposService;
	@Autowired
	protected UserServiceImpl userService;

	
	/****************************** DocSys Doc列表获取接口 **********************************************/
	//getAccessableSubDocList
	protected List<Doc> getAccessableSubDocList(Repos repos, Long docId, String parentPath, String docName, DocAuth docAuth, HashMap<Long, DocAuth> docAuthHashMap, ReturnAjax rt, List<CommonAction> actionList) 
	{	
		System.out.println("getAccessableSubDocList()  reposId:" + repos.getId() + " docId:" + docId + " parentPath:" + parentPath + " docName:" + docName);
				
		String dirPath = parentPath+docName+"/";
		if(docName.isEmpty())
		{
			dirPath = parentPath;
		}
		
		int level = getLevelByParentPath(dirPath);
				
		List<Doc> docList = getAuthedSubDocList(repos, docId, dirPath, level, docAuth, docAuthHashMap, rt, actionList);
	
		if(docList != null)
		{
			Collections.sort(docList);
		
			printObject("getAccessableSubDocList() docList:", docList);
		}
		
		//Add doc for SyncUp
		Doc doc = new Doc();
		doc.setDocId(docId);
		doc.setPath(parentPath);
		doc.setName(docName);			
		insertSyncUpAction(actionList,repos,doc,5,3,2, null);
		
		return docList;
	}
	
	private boolean checkDocLocked(Integer reposId, String parentPath, String docName, User login_user, boolean subDocCheckFlag) 
	{
		Doc doc = new Doc();
		doc.setVid(reposId);
		doc.setPath(parentPath);
		doc.setName(docName);
		
		//check if the doc was locked (State!=0 && lockTime - curTime > 1 day)
		DocLock docLock = getDocLock(doc);
		ReturnAjax rt = new ReturnAjax();
		if(docLock != null && isDocLocked(docLock,login_user,rt ))
		{
			System.out.println("lockDoc() Doc " + doc.getName() +" was locked");
			return true;
		}
		
		//检查其父节点是否强制锁定
		if(isParentDocLocked(doc,login_user,rt))
		{
			System.out.println("lockDoc() Parent Doc of " + doc.getName() +" was locked！");				
			return true;
		}
		
		//Check If SubDoc was locked
		if(subDocCheckFlag)
		{
			if(isSubDocLocked(doc,login_user, rt) == true)
			{
				System.out.println("lockDoc() subDoc of " + doc.getName() +" was locked！");
				return true;
			}
		}
		
		return false;
	}

	//getSubDocHashMap will do get HashMap for subDocList under pid,
	protected List<Doc> getAuthedSubDocList(Repos repos, Long pid, String path, int level, DocAuth pDocAuth, HashMap<Long, DocAuth> docAuthHashMap, ReturnAjax rt, List<CommonAction> actionList)
	{
		System.out.println("getAuthedSubDocList()  reposId:" + repos.getId() + " pid:" + pid + " path:" + path);

		List<Doc> docList = new ArrayList<Doc>();
		List<Doc> dbDocList = getDBEntryList(repos, pid, path, level);
		if(dbDocList != null)
    	{
	    	for(int i=0;i<dbDocList.size();i++)
	    	{
	    		Doc dbDoc = dbDocList.get(i);
	    		
	    		DocAuth docAuth = getDocAuthFromHashMap(dbDoc.getDocId(), pDocAuth,docAuthHashMap);
				if(docAuth != null && docAuth.getAccess()!=null && docAuth.getAccess() == 1)
				{
		    		//Add to docList
					dbDoc.setPid(pid);
		    		docList.add(dbDoc);
				}
	    	}
    	}
		return docList;
	}

	private List<Doc> getDBEntryList(Repos repos, Long pid, String path, int level) {
		Doc qDoc = new Doc();
		qDoc.setVid(repos.getId());
		//qDoc.setPath(path);
		qDoc.setPid(pid);
		return reposService.getDocList(qDoc);
	}

	private List<Doc> getLocalEntryList(Repos repos, Long pid, String path, int level) {
		String localParentPath = getReposRealPath(repos) + path;
		File dir = new File(localParentPath);
    	if(false == dir.exists())
    	{
    		System.out.println("getLocalEntryList() " + localParentPath + " 不存在！");
    		return null;
    	}
    	
    	if(dir.isFile())
    	{
    		//System.out.println("getLocalEntryList() " + localParentPath + " 不是目录！");
    		return null;
    	}

        //Go through the subEntries
    	List <Doc> subEntryList =  new ArrayList<Doc>();
    	
    	File[] localFileList = dir.listFiles();
    	for(int i=0;i<localFileList.length;i++)
    	{
    		File file = localFileList[i];
    		
    		int type = file.isDirectory()? 2:1;

    		String name = file.getName();
    		Doc subEntry = new Doc();
    		subEntry.setVid(repos.getId());
    		subEntry.setPid(pid);
    		subEntry.setPath(path);
    		subEntry.setDocId(buildDocIdByName(level, path, name));
    		subEntry.setName(name);
    		subEntry.setType(type);    		
    		subEntry.setSize(file.length());
    		subEntry.setCreateTime(file.lastModified());
    		subEntry.setLatestEditTime(file.lastModified());
    		subEntryList.add(subEntry);
    	}
    	return subEntryList;
	}
    	

	private List<Doc> getRemoteEntryList(Repos repos, Long pid, String path, int level) {
		switch(repos.getVerCtrl())
		{
		case 1:	//SVN
			SVNUtil svnUtil = new SVNUtil();
			if(false == svnUtil.Init(repos, true, null))
			{
				System.out.println("getRemoteEntryList() svnUtil.Init Failed");
				return null;
			}
			
			long svnRevision = -1;
			
			//Get list from verRepos
			return svnUtil.getDocList(repos, pid, path, level, svnRevision); 
		case 2:	//GIT
			
			GITUtil gitUtil = new GITUtil();
			if(false == gitUtil.Init(repos, true, null))
			{
				System.out.println("getRemoteEntryList() gitUtil.Init Failed");
				return null;
			}
			
			String gitRevision = null;
			
			//Get list from verRepos
			return gitUtil.getDocList(repos, pid, path, level, gitRevision); 
		}
		return null;
	}

	protected boolean isDocLocalChanged(Doc doc, File localEntry) 
	{
		if(doc == null)
		{
			if(!localEntry.exists())
			{
				return false;
			}
			
			System.out.println("isDocLocalChanged() doc is null"); 
			return true;
		}
		
		if(!localEntry.exists())
		{
			System.out.println("isDocLocalChanged() localEntry not exist"); 
			return true;
		}
		
		if(doc.getLatestEditTime().equals(localEntry.lastModified()) && doc.getSize().equals(localEntry.length()))
		{
			return false;
		}
		
		System.out.println("isDocLocalChanged() lastEditTime and size not matched");
		printObject("isDocLocalChanged() doc:",doc);
		printObject("isDocLocalChanged() localEntry:",localEntry);
		return true;
	}

	protected boolean isDocLocalChanged(Doc doc, Doc localEntry) 
	{
		//For File
		if(doc.getLatestEditTime().equals(localEntry.getLatestEditTime()) && doc.getSize().equals(localEntry.getSize()))
		{
			return false;
		}	

		System.out.println("isDocLocalChanged() local changed: dbDoc.lastEditTime:" + doc.getLatestEditTime() + " localEntry.lastEditTime:" + localEntry.getLatestEditTime()); 
		System.out.println("isDocLocalChanged() local changed: dbDoc.size:" + doc.getSize() + " localEntry.size:" + localEntry.getSize()); 

		//printObject("isDocLocalChanged() doc:",doc);
		//printObject("isDocLocalChanged() localEntry:",localEntry);
		return true;
	}
	
	private boolean isDocRemoteChanged(Doc doc, Doc remoteEntry) 
	{
		if(doc.getRevision() != null && !doc.getRevision().isEmpty() && doc.getRevision().equals(remoteEntry.getRevision()))
		{
			return false;
		}
		
		System.out.println("isDocRemoteChanged() remote changed: dbDoc.revision:" + doc.getRevision() + " remoteEntry.revision:" + remoteEntry.getRevision()); 
		//printObject("isDocRemoteChanged() doc:",doc);
		//printObject("isDocRemoteChanged() remoteEntry:",remoteEntry);
		return true;
	}

	private HashMap<String, Doc> getIndexHashMap(Repos repos, Long pid, String path) 
	{
		System.out.println("getIndexHashMap() path:" + path); 
		List<Doc> docList = null;
		Doc doc = new Doc();
		doc.setPath(path);
		doc.setVid(repos.getId());
		docList = reposService.getDocList(doc);
		
		return BuildHashMapByDocList(docList, pid, path);
	}
	
	protected HashMap<String, Doc> BuildHashMapByDocList(List<Doc> docList, Long pid, String path) 
	{
		if(docList == null)
		{
			return null;
		}
		
		HashMap<String,Doc> hashMap = new HashMap<String,Doc>();
    	for(int i=0;i<docList.size();i++)
    	{
			Doc doc = docList.get(i);
			doc.setPid(pid);			
			hashMap.put(doc.getName(), doc);
		}		
		return hashMap;
	}
	
	//
	protected List<Doc> getDocListFromRootToDoc(Repos repos, Long rootDocId, DocAuth rootDocAuth,  HashMap<Long, DocAuth> docAuthHashMap, String parentPath, String docName, ReturnAjax rt, List<CommonAction> actionList)
	{
		System.out.println("getDocListFromRootToDoc() reposId:" + repos.getId() + " rootDocId:" + rootDocId + " parentPath:" + parentPath +" docName:" + docName);
		
		List<Doc> resultList = getAccessableSubDocList(repos, rootDocId, "", "", rootDocAuth, docAuthHashMap, rt, actionList);	//get subDocList under root
		if(resultList == null || resultList.size() == 0)
		{
			System.out.println("getDocListFromRootToDoc() docList under root is empty");			
			return null;
		}
		
		String [] paths = parentPath.split("/");
		int deepth = paths.length;
		System.out.println("getDocListFromRootToDoc() deepth:" + deepth); 
		if(deepth < 1)
		{
			return resultList;
		}
		
		String  path = "";
		DocAuth pDocAuth = rootDocAuth;
		int level = 0;
		for(int i=0; i<deepth; i++)
		{
			String name = paths[i];
			if(name.isEmpty())
			{
				continue;
			}	
			
			Long docId = buildDocIdByName(level, path, name);
			System.out.println("docId:" + docId);
			DocAuth docAuth = getDocAuthFromHashMap(docId, pDocAuth, docAuthHashMap);
			
			List<Doc> subDocList = getAccessableSubDocList(repos, docId, path, name, docAuth, docAuthHashMap, rt, actionList);
			if(subDocList == null || subDocList.size() == 0)
			{
				docSysDebugLog("getDocListFromRootToDoc() Failed to get the subDocList under doc: " + path+name, rt);
				break;
			}
			resultList.addAll(subDocList);
			
			path = path + name + "/";
			pDocAuth = docAuth;
			level++;
		}
		
		return resultList;
	}
	
	protected List<Repos> getAccessableReposList(Integer userId) {
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
	
	/****************************** 仓库操作接口 ***************************************************/
	//检查path1和path2是否互相包含
	protected boolean isPathConflict(String path1, String path2) 
	{
		if(path1 == null || path1.isEmpty())
		{
			return false;
		}
		if(path2 == null || path2.isEmpty())
		{
			return false;
		}
		
		path1 = dirPathFormat(path1);
		path2 = dirPathFormat(path2);
		if(path1.contains(path2) || path2.contains(path1))
		{
			return true;
		}
		return false;
	}

	protected boolean checkReposInfoForAdd(Repos repos, ReturnAjax rt) {
		//检查传入的参数
		String name = repos.getName();
		if((name == null) || name.isEmpty())
		{
			System.out.println("仓库名不能为空！");
			rt.setError("仓库名不能为空！");			
			return false;
		}

		if(true == isReposPathBeUsed(repos))
		{
			System.out.println("仓库存储目录 " + repos.getPath() + " 已被使用！");
			rt.setError("仓库存储目录 " + repos.getPath() + " 已被使用！");		
			return false;
		}
		
		//文件系统前置，必须有realDocPath
		if(repos.getType() == 2)
		{
			if(repos.getRealDocPath() == null || repos.getRealDocPath().isEmpty())
			{
				rt.setError("文件存储目录不能为空！");						
				return false;
			}
		}
		
		if(true == isReposRealDocPathBeUsed(repos))
		{
			rt.setError("文件存储目录 " + repos.getRealDocPath() + " 已被使用！");		
			return false;
		}
			
		//svnPath and svnPath1 duplicate check
		String verReposURI = repos.getSvnPath();
		String verReposURI1 = repos.getSvnPath1();
		if(verReposURI != null && verReposURI1 != null)
		{
			if(!verReposURI.isEmpty() && !verReposURI1.isEmpty())
			{
				verReposURI = dirPathFormat(verReposURI);
				verReposURI1 = dirPathFormat(verReposURI1);
				if(isPathConflict(verReposURI,verReposURI))
				{
					rt.setError("不能使用相同的版本仓库链接！");			
					return false;
				}
			}
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
					if(isVerReposPathBeUsed(repos.getId(),svnPath) == true)
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

	protected boolean checkReposInfoForUpdate(Repos newReposInfo, Repos previousReposInfo, ReturnAjax rt) {
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
			
			if(true == isReposPathBeUsed(newReposInfo))
			{
				rt.setError("仓库存储目录 " + newReposInfo.getPath() + " 已被使用！");	
				return false;
			}
		}
		
		String realDocPath = newReposInfo.getRealDocPath();
		if(realDocPath != null && !realDocPath.isEmpty())
		{
			realDocPath = dirPathFormat(realDocPath);
			newReposInfo.setRealDocPath(realDocPath);
			if(true == isReposRealDocPathBeUsed(newReposInfo))
			{
				rt.setError("文件存储目录 " + realDocPath + " 已被使用！");		
				return false;
			}
		}
		else
		{
			//文件系统前置，必须有realDocPath
			if(newReposInfo.getType() == 2)
			{
				if(realDocPath != null && realDocPath.isEmpty())
				{
					rt.setError("文件存储目录不能为空！");						
					return false;
				}
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
	
	protected boolean isVerReposInfoChanged(Repos newReposInfo, Repos previousReposInfo, boolean isRealDoc) {
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

	protected boolean initVerRepos(Repos repos, boolean isRealDoc, ReturnAjax rt) {
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

	protected void InitReposAuthInfo(Repos repos, User login_user, ReturnAjax rt) {
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
			docSysDebugLog("addRepos() addReposAuth return:" + ret, rt);
			System.out.println("新增用户仓库权限失败");
		}
				
		//设置当前用户仓库根目录的访问权限
		DocAuth docAuth = new DocAuth();
		docAuth.setReposId(repos.getId());		//仓库：新增仓库id
		docAuth.setUserId(login_user.getId());	//访问用户：当前登录用户	
		docAuth.setDocId((long) 0); 		//目录：根目录
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
			docSysDebugLog("addRepos() addReposAuth return:" + ret, rt);
			System.out.println("新增用户仓库根目录权限失败");
		}		
	}
	
	private boolean isReposPathBeUsed(Repos newRepos) {
		Integer reposId = newRepos.getId();
		String path = newRepos.getPath();
		
		List<Repos> reposList = reposService.getAllReposList();
		for(int i=0; i< reposList.size(); i++)
		{
			Repos repos = reposList.get(i);
			if(reposId == null || !reposId.equals(repos.getId()))
			{
				String reposPath = getReposPath(repos);
				if(reposPath != null && !reposPath.isEmpty())
				{
					reposPath = localDirPathFormat(reposPath);
					if(path.contains(reposPath))	//不能把仓库放到其他仓库下面
					{					
						System.out.println(path + " 已被使用"); 
						System.out.println("newReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " reposPath=" + reposPath); 
						return true;
					}
				}
				
				String realDocPath = repos.getRealDocPath();
				if(realDocPath != null && !realDocPath.isEmpty())
				{
					realDocPath = localDirPathFormat(realDocPath);
					if(path.contains(realDocPath))	//不能把仓库放到其他仓库的文件存储目录
					{					
						System.out.println(path + " 已被使用"); 
						System.out.println("newRealDocPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " realDocPath=" + realDocPath); 
						return true;
					}
				}
			}
		}
		return false;
	}
	
	private boolean isReposRealDocPathBeUsed(Repos newRepos) {
		
		Integer reposId = newRepos.getId();
		String newRealDocPath = newRepos.getRealDocPath();
		
		List<Repos> reposList = reposService.getAllReposList();
		for(int i=0; i< reposList.size(); i++)
		{
			Repos repos = reposList.get(i);
			
			//检查是否与仓库的存储路径冲突（包括本仓库）
			String reposPath = getReposPath(repos);
			if(reposPath != null && !reposPath.isEmpty())
			{
				reposPath = localDirPathFormat(reposPath);
				if(isPathConflict(reposPath,newRealDocPath))
				{					
					System.out.println("文件存储目录：" + newRealDocPath + " 已被使用"); 
					System.out.println("newRealDocPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " reposPath=" + reposPath); 
					return true;
				}
			}
			
			//检查是否与其他的仓库realDocPath冲突
			if(reposId == null || repos.getId() != reposId)
			{
				String realDocPath = repos.getRealDocPath();
				if(realDocPath != null && !realDocPath.isEmpty())
				{
					realDocPath = localDirPathFormat(realDocPath);
					if(isPathConflict(realDocPath,newRealDocPath))
					{					
						System.out.println("文件存储目录：" + newRealDocPath + " 已被使用"); 
						System.out.println("newRealDocPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " realDocPath=" + realDocPath); 
						return true;
					}
				}
			}		
		}
		return false;
	}

	private boolean isVerReposPathBeUsed(Integer reposId, String newVerReposPath) {
		
		List<Repos> reposList = reposService.getAllReposList();
				
		for(int i=0; i< reposList.size(); i++)
		{
			Repos repos = reposList.get(i);
			if(repos.getId() == reposId)
			{
				continue;
			}
			
			String verReposURI = repos.getSvnPath();
			if(verReposURI != null && !verReposURI.isEmpty())
			{
				if(isPathConflict(verReposURI,newVerReposPath))
				{					
					System.out.println("该版本仓库连接已被使用:" + newVerReposPath); 
					System.out.println("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " verReposPath=" + verReposURI); 
					return true;
				}
			}
			
			String verReposURI1 = repos.getSvnPath1();
			if(verReposURI1 != null && !verReposURI1.isEmpty())
			{
				if(isPathConflict(verReposURI1,newVerReposPath))
				{					
					System.out.println("该版本仓库连接已被使用:" + newVerReposPath); 
					System.out.println("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " verReposPath1=" + verReposURI1); 
					return true;
				}
			}
			
			//检查是否与本地仓库使用了相同的URI
			String localVerReposURI = getLocalVerReposURI(repos,true);
			if(localVerReposURI != null && !localVerReposURI.isEmpty())
			{
				if(isPathConflict(localVerReposURI,newVerReposPath))
				{					
					System.out.println("该版本仓库连接已被使用:" + newVerReposPath); 
					System.out.println("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " localVerReposPath=" + localVerReposURI); 
					return true;
				}
			}
			
			String localVerReposURI1 = getLocalVerReposURI(repos,false);
			if(localVerReposURI1 != null && !localVerReposURI1.isEmpty())
			{
				if(isPathConflict(localVerReposURI1,newVerReposPath))
				{					
					System.out.println("该版本仓库连接已被使用:" + newVerReposPath); 
					System.out.println("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " localVerReposURI1=" + localVerReposURI1); 
					return true;
				}
			}
			
		}
		return false;
	}

	protected boolean createReposLocalDir(Repos repos, ReturnAjax rt) {
		String path = repos.getPath();		
		File reposRootDir = new File(path);
		if(reposRootDir.exists() == false)
		{
			System.out.println("addRepos() path:" + path + " not exists, do create it!");
			if(reposRootDir.mkdirs() == false)
			{
				rt.setError("创建仓库目录失败:" + path);
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
		
		if(repos.getType() == 2)
		{
			String reposRealDocDir = repos.getRealDocPath();
			if(createDir(reposRealDocDir) == false)
			{
				rt.setError("创建文件存储目录失败："+reposRealDocDir);
				return false;
			}
			return true;
		}
		return true;
	}

	protected boolean deleteRepos(Repos repos) {
		//Delete Repos in DB
		reposService.deleteRepos(repos.getId());
		
		//Delete Repos LocalDir
		deleteReposLocalDir(repos);
		
		//Delete Repos LocalVerRepos
		deleteLocalVerRepos(repos,true);
		deleteLocalVerRepos(repos,false);

		//Delete IndexLib
    	LuceneUtil2.deleteIndexLib(getIndexLibName(repos.getId(),0));
		LuceneUtil2.deleteIndexLib(getIndexLibName(repos.getId(),1));
    	LuceneUtil2.deleteIndexLib(getIndexLibName(repos.getId(),2));
		
		return true;
	}

	protected void deleteReposLocalDir(Repos repos) {
		String reposDir = getReposPath(repos);
		delDir(reposDir);
	}

	protected void deleteLocalVerRepos(Repos repos, boolean isRealDoc) {
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
	
	public String createGitLocalRepos(Repos repos, boolean isRealDoc, ReturnAjax rt) {
		System.out.println("createGitLocalRepos isRealDoc:"+isRealDoc);	

		String localVerRepos = getLocalVerReposPath(repos, isRealDoc);
		File dir = new File(localVerRepos);
		if(dir.exists())
		{
			docSysDebugLog("GIT仓库:"+localVerRepos + "已存在，已直接设置！", rt);
			return localVerRepos;
		}
		
		GITUtil gitUtil = new GITUtil();
		gitUtil.Init(repos, isRealDoc, "");
		String gitPath = gitUtil.CreateRepos();
		return gitPath;
	}

	protected String createSvnLocalRepos(Repos repos, boolean isRealDoc, ReturnAjax rt) {
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
			docSysDebugLog("SVN仓库:"+localPath+reposName + "已存在，已直接设置！", rt);
			return "file:///" + localPath + reposName;
		}
		
		String svnPath = SVNUtil.CreateRepos(reposName,localPath);
		return svnPath;
	}
	
	protected boolean ChangeReposRealDocPath(Repos newReposInfo, Repos reposInfo, User login_user, ReturnAjax rt) {
		String path = getReposRealPath(newReposInfo);
		String oldPath = getReposRealPath(reposInfo);
		if(!path.equals(oldPath))
		{
			if(path.isEmpty())
			{
				path = getReposRealPath(newReposInfo);
			}
			System.out.println("ChangeReposRealDocPath oldPath:" + oldPath + " newPath:" + path);
			
			if(login_user.getType() != 2)
			{
				System.out.println("普通用户无权修改仓库存储位置，请联系管理员！");
				rt.setError("普通用户无权修改仓库存储位置，请联系管理员！");
				return false;							
			}
			
			//如果目标目录已存在则不复制
			File newDir = new File(path);
			if(!newDir.exists())
			{
				if(copyFileOrDir(oldPath, path,true) == false)
				{
					System.out.println("文件目录迁移失败！");
					rt.setError("修改仓库文件目录失败！");					
					return false;
				}
			}
		}
		return true;
	}

	protected boolean ChangeReposPath(Repos newReposInfo, Repos previousReposInfo, User login_user,ReturnAjax rt) {
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
			if(previousReposInfo.getType() == 2)
			{
				reposName = "";
			}
			else
			{
				if(path.contains(oldPath))
				{
					System.out.println("禁止将仓库目录迁移到仓库的子目录中！");
					rt.setError("修改仓库位置失败：禁止迁移到本仓库的子目录");	
					return false;
				}
			}

			if(copyFileOrDir(oldPath+reposName, path+reposName,true) == false)
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
	
	/******************************* 文件下载接口 *********************************************/
	protected void sendDataToWebPage(String file_name, byte[] data, HttpServletResponse response, HttpServletRequest request)  throws Exception{ 
		//解决中文编码问题: https://blog.csdn.net/u012117531/article/details/54808960
		String userAgent = request.getHeader("User-Agent").toUpperCase();
		if(userAgent.indexOf("MSIE")>0 || userAgent.indexOf("LIKE GECKO")>0)	//LIKE GECKO is for IE10
		{  
			file_name = URLEncoder.encode(file_name, "UTF-8");  
		}else{  
			file_name = new String(file_name.getBytes("UTF-8"),"ISO8859-1");  
		}  
		System.out.println("doGet file_name:" + file_name);
		//解决空格问题
		response.setHeader("content-disposition", "attachment;filename=\"" + file_name +"\"");
		
		try {
			//创建输出流
			OutputStream out = response.getOutputStream();
			out.write(data, 0, data.length);		
			//关闭输出流
			out.close();	
		}catch (Exception e) {
			e.printStackTrace();
			System.out.println("sendDataToWebPage() Exception");
		}
	}
	
	protected int getLocalEntryType(String localParentPath, String entryName) {
		
		File entry = new File(localParentPath,entryName);
		if(!entry.exists())
		{
			System.out.println("getLocalEntryType() Failed: " + localParentPath + entryName + " 不存在 ！");
			return -1;
		}	
		
		if(entry.isFile())
		{
			return 1;
		}
		else if(entry.isDirectory())
		{
			return 2;
		}

		System.out.println("getLocalEntryType() Failed: 未知文件类型！");
		return -1;
	}
	
	protected void sendTargetToWebPage(String localParentPath, String targetName, String tmpDir, ReturnAjax rt,HttpServletResponse response, HttpServletRequest request, boolean deleteEnable) throws Exception 
	{
		File localEntry = new File(localParentPath,targetName);
		if(false == localEntry.exists())
		{
			rt.setError("文件 " + localParentPath + targetName + " 不存在！");
			writeJson(rt, response);
			return;
		}

		//For dir 
		if(localEntry.isDirectory()) //目录
		{
			//doCompressDir and save the zip File under userTmpDir
			String zipFileName = targetName + ".zip";
			if(doCompressDir(localParentPath, targetName, tmpDir, zipFileName, rt) == false)
			{
				rt.setError("压缩目录失败！");
				writeJson(rt, response);
				return;
			}
			
			sendFileToWebPage(tmpDir,zipFileName,rt,response, request); 
			
			//Delete zip file
			delFile(tmpDir+zipFileName);
		}
		else	//for File
		{
			//Send the file to webPage
			sendFileToWebPage(localParentPath,targetName,rt, response, request); 			
		}
		
		if(deleteEnable)
		{
			//Delete target file or dir
			delFileOrDir(localParentPath+targetName);
		}
	}
	
	protected void sendFileToWebPage(String localParentPath, String file_name,  ReturnAjax rt,HttpServletResponse response,HttpServletRequest request) throws Exception{
		
		String dstPath = localParentPath + file_name;

		//检查文件是否存在
		File file = new File(dstPath);
		if(!file.exists()){
			System.out.println("doGet() " + dstPath + " 不存在！");	
			//request.setAttribute("message", "您要下载的资源已被删除！！");
			//request.getRequestDispatcher("/message.jsp").forward(request, response);
			rt.setError(dstPath + " 不存在！");
			writeJson(rt, response);
			return;
		}
		
		System.out.println("sendFileToWebPage() file_name befor convert:" + file_name);
		
		//解决中文编码问题
		String userAgent = request.getHeader("User-Agent").toUpperCase();
		if(userAgent.indexOf("MSIE")>0 || userAgent.indexOf("LIKE GECKO")>0)	//LIKE GECKO is for IE10
		{  
			file_name = URLEncoder.encode(file_name, "UTF-8");  
			System.out.println("sendFileToWebPage() file_name after URL Encode:" + file_name);
		}else{  
			file_name = new String(file_name.getBytes("UTF-8"),"ISO8859-1");  
			
			
			System.out.println("sendFileToWebPage() file_name after convert to ISO8859-1:" + file_name);
		}
		//解决空格问题（空格变加号和兼容性问题）
		file_name = file_name.replaceAll("\\+", "%20").replaceAll("%28", "\\(").replaceAll("%29", "\\)").replaceAll("%3B", ";").replaceAll("%40", "@").replaceAll("%23", "\\#").replaceAll("%26", "\\&");
		System.out.println("sendFileToWebPage() file_name:" + file_name);
		
		response.setHeader("content-disposition", "attachment;filename=\"" + file_name +"\"");

		try {
			//读取要下载的文件，保存到文件输入流
			FileInputStream in = new FileInputStream(dstPath);
			//创建输出流
			OutputStream out = response.getOutputStream();
			//创建缓冲区
			byte buffer[] = new byte[1024];
			int len = 0;
			//循环将输入流中的内容读取到缓冲区当中
			while((len=in.read(buffer))>0){
				//输出缓冲区的内容到浏览器，实现文件下载
				out.write(buffer, 0, len);
			}
			//关闭文件输入流
			in.close();
			//关闭输出流
			out.close();
		}catch (Exception e) {
			e.printStackTrace();
			System.out.println("sendFileToWebPage() Exception");
		}
	}

	protected boolean doCompressDir(String srcParentPath, String dirName, String dstParentPath, String zipFileName,ReturnAjax rt) {
		
		//if dstDir not exists create it
		File dstDir = new File(dstParentPath);
		if(!dstDir.exists())
		{
			if(createDir(dstParentPath) == false)
			{
				docSysDebugLog("doCompressDir() Failed to create:" + dstParentPath, rt);
				return false;
			}
		}
		//开始压缩
		if(compressExe(srcParentPath + dirName,dstParentPath + zipFileName) == true)
		{
			System.out.println("压缩完成！");	
		}
		else
		{
			System.out.println("doCompressDir()  压缩失败！");
			docSysDebugLog("压缩  " + srcParentPath + dirName + "to" + dstParentPath + zipFileName  +" 失败", rt);
			return false;
		}
		
		return true;
	}
		
	/***************************Basic Functions For Driver Level  **************************/
	public List<User> getUserList(String userName,String pwd) {
		User tmp_user = new User();
		//检查用户名是否为空
		if(userName==null||"".equals(userName))
		{
			return null;
		}
		
		tmp_user.setName(userName);
		tmp_user.setPwd(pwd);
		List<User> uList = userService.queryUserExt(tmp_user);
		if(uList == null || uList.size() == 0)
		{
			return null;
		}
		return uList;
	}
	
	public boolean isUserRegistered(String name)
	{
		List <User> uList = getUserList(name,null);
		if(uList == null || uList.size() == 0)
		{
			return false;
		}
		
		return true;
	}
	/********************************** Functions For Application Layer ****************************************/
	protected String revertVirtualDocHistory(Repos repos, Long docId, String parentPath, String docName, String commitId, String commitMsg, String commitUser, User login_user, ReturnAjax rt) 
	{	
		Integer reposId = repos.getId();
		
		//Build doc
		Doc doc = new Doc();								
		doc.setVid(reposId);
		doc.setDocId(docId);
		doc.setPath(parentPath);
		doc.setName(docName);
		
		DocLock docLock = null;
		synchronized(syncLock)
		{
			//LockDoc
			docLock = lockDoc(doc, 2,  2*60*60*1000, login_user, rt, false);
			if(docLock == null)
			{
				unlock(); //线程锁
				System.out.println("addDoc() lockDoc " + docName + " Failed!");
				return null;
			}
		}
		
		String vDocName = getVDocName(doc);
		String vParentPath = "";
		
		//Checkout to localParentPath
		String localRootPath = getReposVirtualPath(repos);
		String localParentPath = localRootPath;
		
		//Do checkout the entry to 
		if(verReposCheckOut(repos, false, vParentPath, vDocName, localParentPath, vDocName, commitId, true) == null)
		{
			unlockDoc(doc,login_user,docLock);
			System.out.println("revertVirtualDocHistory() verReposCheckOut Failed!");
			rt.setError("verReposCheckOut Failed vParentPath:" + vParentPath + " vDocName:" + vDocName + " localVirtualRootPath:" + localParentPath + " targetName:" + vDocName);
			return null;
		}
		
		//Do commit to verRepos
		if(commitMsg == null)
		{
			commitMsg = "Revert " + parentPath+docName + " to revision:" + commitId;
		}
		
		String revision = verReposAutoCommit(repos, false, parentPath, docName, localRootPath, commitMsg,commitUser,true,null);
		unlockDoc(doc,login_user,docLock);
		
		if(revision == null)
		{			
			docSysDebugLog("verReposAutoCommit 失败", rt);
		}
		return revision;
	}

	protected String revertRealDocHistory(Repos repos, Long docId, String parentPath, String docName, String commitId, String commitMsg, String commitUser, User login_user, ReturnAjax rt) {
		System.out.println("revertRealDocHistory commitId:" + commitId + " reposId:" + repos.getId() + " docId:" + docId + " docPath:" + parentPath+docName);
		
		Integer reposId = repos.getId();
		
		//Build doc
		Doc doc = new Doc();								
		doc.setVid(reposId);
		doc.setDocId(docId);
		doc.setPath(parentPath);
		doc.setName(docName);
		
		DocLock docLock = null;
		synchronized(syncLock)
		{
			//LockDoc
			docLock = lockDoc(doc, 2,  2*60*60*1000, login_user, rt, false);
			if(docLock == null)
			{
				unlock(); //线程锁
				System.out.println("addDoc() lockDoc " + docName + " Failed!");
				return null;
			}
		}
		
	
		//Checkout to localParentPath
		String localRootPath = getReposRealPath(repos);
		String localParentPath = localRootPath + parentPath;
		
		//Do checkout the entry to
		List<Doc> successDocList = verReposCheckOut(repos, true, parentPath, docName, localParentPath, docName, commitId, true); 
		if(successDocList == null)
		{
			unlockDoc(doc,login_user,docLock);
			System.out.println("revertRealDocHistory() verReposCheckOut Failed!");
			rt.setError("verReposCheckOut Failed parentPath:" + parentPath + " entryName:" + docName + " localParentPath:" + localParentPath + " targetName:" + docName);
			return null;
		}
		
		//Do commit to verRepos
		if(commitMsg == null)
		{
			commitMsg = "Revert " + parentPath+docName + " to revision:" + commitId;
		}
		
		String revision = verReposAutoCommit(repos, true, parentPath, docName, localRootPath, commitMsg,commitUser,true,null);
		
		//Force update docInfo
		printObject("revertRealDocHistory() successDocList:", successDocList);
		for(int i=0; i< successDocList.size(); i++)
		{
			Doc successDoc = successDocList.get(i);
			successDoc.setRevision(revision);
			successDoc.setCreator(login_user.getId());
			successDoc.setLatestEditor(login_user.getId());
			dbUpdateDoc(repos, successDoc, true);
		}		
		
		unlockDoc(doc,login_user,docLock);
		if(revision == null)
		{			
			docSysDebugLog("verReposAutoCommit 失败", rt);
		}
		
		return revision;
	}
	
	//底层addDoc接口
	protected boolean addDoc(Repos repos, Integer type,  Long docId, Long parentId, String parentPath, String docName, 
			String content,	//VDoc Content
			MultipartFile uploadFile, Long fileSize, String checkSum, //For upload
			Integer chunkNum, Integer chunkSize, String chunkParentPath, //For chunked upload combination
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		System.out.println("addDoc() docId:" + docId + " pid:" + parentId + " parentPath:" + parentPath + " docName:" + docName);
	
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return addDoc_FS(repos, type, docId, parentId, parentPath, docName, content,	//Add a empty file
					uploadFile, fileSize, checkSum, //For upload
					chunkNum, chunkSize, chunkParentPath, //For chunked upload combination
					commitMsg, commitUser, login_user, rt, actionList);
			
		}
		return false;
	}

	protected boolean addDoc_FS(Repos repos, Integer type, Long docId, Long parentId, String parentPath, String docName, String content,	//Add a empty file
			MultipartFile uploadFile, Long fileSize, String checkSum, //For upload
			Integer chunkNum, Integer chunkSize, String chunkParentPath, //For chunked upload combination
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		System.out.println("addDoc_FS()  type:" + type + " pid:" + parentId + " parentPath:" + parentPath + " docName:" + docName);

		String reposRPath = getReposRealPath(repos);
		String localParentPath =  reposRPath + parentPath;
		String localDocPath = localParentPath + docName;
		
		Integer reposId = repos.getId();
		
		//Build doc
		Doc doc = new Doc();								
		doc.setVid(reposId);
		doc.setPid(parentId);
		doc.setDocId(docId);
		doc.setPath(parentPath);
		doc.setName(docName);
		doc.setType(type);
		doc.setSize(fileSize);
		doc.setCheckSum(checkSum);
		doc.setContent(content);
		
		//set createTime
		//long nowTimeStamp = new Date().getTime();//获取当前系统时间戳
		//doc.setCreateTime(nowTimeStamp);
		doc.setCreator(login_user.getId());
		doc.setCreatorName(login_user.getName());
		doc.setLatestEditor(login_user.getId());
		doc.setLatestEditorName(login_user.getName());
		
		DocLock docLock = null;
		synchronized(syncLock)
		{
			//LockDoc
			docLock = lockDoc(doc, 2,  2*60*60*1000, login_user, rt, false);
			if(docLock == null)
			{
				unlock(); //线程锁
				System.out.println("addDoc() lockDoc " + docName + " Failed!");
				return false;
			}
		}
		
		File localEntry = new File(localDocPath);
		if(localEntry.exists())
		{	
			unlockDoc(doc, login_user, docLock);
			docSysDebugLog("addDoc() " +localDocPath + "　已存在！", rt);
			return false;
		}
		
		if(uploadFile == null)
		{	
			//File must not exists
			if(createRealDoc(repos, doc, rt) == false)
			{	
				unlockDoc(doc, login_user, docLock);
				
				String MsgInfo = "createRealDoc " + docName +" Failed";
				rt.setError(MsgInfo);
				System.out.println("createRealDoc Failed");
				return false;
			}
		}
		else
		{
			if(updateRealDoc(repos, doc, uploadFile,chunkNum,chunkSize,chunkParentPath,rt) == false)
			{	
				unlockDoc(doc, login_user, null);
				
				String MsgInfo = "updateRealDoc " + docName +" Failed";
				rt.setError(MsgInfo);
				System.out.println("updateRealDoc Failed");
				return false;
			}
		}
		
		//Update the latestEditTime
		Doc fsDoc = fsGetDoc(repos, docId, parentId, parentPath, docName);
		doc.setCreateTime(fsDoc.getLatestEditTime());
		doc.setLatestEditTime(fsDoc.getLatestEditTime());
		
		//commit to history db
		String revision = verReposRealDocAdd(repos,parentPath,docName,type,commitMsg,commitUser,rt);
		if(revision == null)
		{
			docSysWarningLog("verReposRealDocAdd Failed", rt);
		}
		
		doc.setRevision(revision);
		if(dbAddDoc(repos, doc, false) == false)
		{	
			docSysWarningLog("Add Node: " + docName +" Failed！", rt);
		}
		
		//BuildMultiActionListForDocAdd();
		BuildMultiActionListForDocAdd(actionList, repos, doc, commitMsg, commitUser);
		
		if(unlockDoc(doc,login_user,null) == false)
		{
			docSysWarningLog("unlockDoc Failed", rt);
		}
		
		rt.setData(doc);
		rt.setMsgData("isNewNode");
		docSysDebugLog("新增成功", rt); 
		
		return true;
	}

	private boolean dbAddDoc(Repos repos, Doc doc, boolean addSubDocs) {
		if(doc.getPath() == null)
		{
			doc.setPath("");
		}
		
		String reposRPath = getReposRealPath(repos);
		String docPath = reposRPath + doc.getPath() + doc.getName();
		File localEntry = new File(docPath);
		if(!localEntry.exists())
		{
			return false;
		}
		doc.setSize(localEntry.length());
		doc.setCreateTime(localEntry.lastModified());
		doc.setLatestEditTime(localEntry.lastModified());
		if(reposService.addDoc(doc) == 0)
		{
			System.out.println("dbAddDoc() addDoc to db failed");		
			return false;
		}
		
		if(addSubDocs)
		{
			int level = getLevelByParentPath(doc.getPath());
			List<Doc> subDocList = null;
			if(repos.getType() == 3 || repos.getType() == 4)
			{
				subDocList = getLocalEntryList(repos, doc.getDocId(), doc.getPath() + doc.getName()+"/", level+1);	
			}
			else
			{
				subDocList = getRemoteEntryList(repos, doc.getDocId(), doc.getPath() + doc.getName()+"/", level+1);	
			}
			
			if(subDocList != null)
			{
				for(int i=0; i<subDocList.size(); i++)
				{
					Doc subDoc = subDocList.get(i);
					subDoc.setCreator(doc.getCreator());
					subDoc.setLatestEditor(doc.getLatestEditor());
					subDoc.setRevision(doc.getRevision());
					dbAddDoc(repos, subDoc, addSubDocs);
				}
			}
		}
		return true;
	}

	//底层deleteDoc接口
	protected String deleteDoc(Repos repos, Long docId, String parentPath, String docName, 
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return deleteDoc_FS(repos, docId, parentPath, docName, commitMsg, commitUser, login_user,  rt, actionList);			
		}
		return null;
	}

	protected String deleteDoc_FS(Repos repos, Long docId, String parentPath, String docName, 
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		Doc doc = new Doc();								
		doc.setVid(repos.getId());
		doc.setDocId(docId);
		doc.setPath(parentPath);
		doc.setName(docName);
		
		if(docId == 0)
		{
			//由于前台是根据docId和pid来组织目录结构的，所以前台可以删除docId=0的节点，表示数据库中存在一个docId=0的非法节点，直接删除掉
			docSysDebugLog("deleteDoc_FS() 这是一个非法节点docId = 0", rt);
			dbDeleteDoc(doc, false);
			return null;
		}
		
		DocLock docLock = null;
		synchronized(syncLock)
		{							
			//Try to lock the Doc
			docLock = lockDoc(doc,2, 2*60*60*1000,login_user,rt,true);	//lock 2 Hours 2*60*60*1000
			if(docLock == null)
			{
				unlock(); //线程锁
				docSysDebugLog("deleteDoc_FS() Failed to lock Doc: " + docId, rt);
				return null;			
			}
			unlock(); //线程锁
		}
		System.out.println("deleteDoc_FS() " + docId + " " + doc.getName() + " Lock OK");
				
		//get RealDoc Full ParentPath
		if(deleteRealDoc(repos,doc,rt) == false)
		{
			unlockDoc(doc,login_user,docLock);
			
			docSysDebugLog("deleteDoc_FS() deleteRealDoc Failed", rt);
			docSysErrorLog(parentPath + docName + " 删除失败！", rt);
			return null;
		}
		

		String revision = verReposRealDocDelete(repos,parentPath,docName,doc.getType(),commitMsg,commitUser,rt);
		if(revision == null)
		{
			docSysDebugLog("deleteDoc_FS() verReposRealDocDelete Failed", rt);
			docSysWarningLog("verReposRealDocDelete Failed", rt);
		}
		else
		{
			//Delete DataBase Record and Build AsynActions For delete 
			if(dbDeleteDocEx(actionList, repos, doc, true, commitMsg, commitUser) == false)
			{	
				docSysWarningLog("不可恢复系统错误：dbDeleteDoc Failed", rt);
			}
		}
		
		unlockDoc(doc,login_user,null);
		
		rt.setData(doc);
		return revision;
	}
	
	private void BuildMultiActionListForDocAdd(List<CommonAction> actionList, Repos repos, Doc doc, String commitMsg, String commitUser) 
	{
		//Insert index add action for RDoc
		insertAddAction(actionList, repos, doc, commitMsg, commitUser, 4, 1, 1, null);
		
		String content = doc.getContent();
		if(content == null || content.isEmpty())
		{
			return;
		}
		
		//Insert add action for VDoc
		//Build subActionList
		List<CommonAction> subActionList = new ArrayList<CommonAction>();
		if(repos.getVerCtrl1() > 0)
		{
			insertAddAction(subActionList, repos, doc, commitMsg, commitUser, 2, 1, 2, null); //verRepos commit
		}
		insertAddAction(subActionList, repos, doc, commitMsg, commitUser, 4, 1, 2, null);	//Add Index For VDoc
		
		//Insert add action for VDoc
		insertAddAction(actionList, repos, doc, commitMsg, commitUser, 1, 1, 2, subActionList);			
	}

	protected void BuildMultiActionListForDocDelete(List<CommonAction> actionList, Repos repos, Doc doc, String commitMsg, String commitUser) 
	{	
		//Insert index delete action for RDoc
		insertDeleteAction(actionList, repos, doc, commitMsg, commitUser, 4, 2, 1, null);

		//Insert delete action for VDoc
		insertDeleteAction(actionList, repos, doc, commitMsg, commitUser, 1, 2, 2, null);
		//Insert delete action for VDoc Index
		insertDeleteAction(actionList, repos, doc, commitMsg, commitUser, 4, 2, 2, null);
		//Insert delete action for VDoc verRepos 
		insertDeleteAction(actionList, repos, doc, commitMsg, commitUser, 2, 2, 2, null);
	}
	
	void BuildMultiActionListForDocUpdate(List<CommonAction> actionList, Repos repos, Doc doc, String reposRPath) 
	{		
		//Insert index delete action for RDoc
		insertUpdateAction(actionList, repos, doc, null, null, 4, 3, 1, null);
	}
	
	private void BuildCommonActionListForDocContentUpdate(List<CommonAction> actionList,Repos repos, Doc doc, User login_user,  String commitMsg, String commitUser) 
	{
		//Insert index update action for VDoc
		insertUpdateAction(actionList, repos, doc, commitMsg, commitUser, 1, 3, 2, null);
		//Insert update action for VDoc Index
		insertUpdateAction(actionList, repos, doc, commitMsg, commitUser, 4, 3, 2, null);
		//Insert update action for VDoc verRepos 
		insertUpdateAction(actionList, repos, doc, commitMsg, commitUser, 2, 3, 2, null);
	}

	protected int getLevelByParentPath(String path) 
	{
		if(path == null || path.isEmpty())
		{
			return 0;
		}
		
		String [] paths = path.split("/");
		return paths.length;
	}
	
	protected boolean executeCommonActionList(List<CommonAction> actionList, ReturnAjax rt) 
	{
		if(actionList == null || actionList.size() == 0)
		{
			return true;
		}
		
		int size = actionList.size();
		System.out.println("executeActionList size:" + size);
		
		int count = 0;

		for(int i=0; i< actionList.size(); i++)
		{
			boolean ret = false;
			CommonAction action = actionList.get(i);
			switch(action.getType())
			{
			case 1:
				ret = executeFSAction(action, rt);
				break;
			case 2:
				String revision = executeVerReposAction(action, rt);
				if(revision != null)
				{
					action.getDoc().setRevision(revision);
					ret = true;
				}
				break;
			case 3:
				ret = executeDBAction(action, rt);
				break;			
			case 4:
				ret = executeIndexAction(action, rt);
				break;
			case 5: //AutoSyncUp
				ret = executeSyncUpAction(action, rt);
				break;
			}
			
			if(ret == true)
			{
				//Execute SubActionList
				executeCommonActionList(action.getSubActionList(), rt);
				count++;
			}
		}
		
		if(count != size)
		{
			System.out.println("executeActionList() failed actions:" + (size - count));	
			return false;
		}
		
		return true;
	}
	
	
	private boolean executeSyncUpAction(CommonAction action, ReturnAjax rt) {
		printObject("executeSyncUpAction() action:",action);
		return syncupForDocChanged(action, rt);
	}

	//这个接口要保证只有一次Commit操作，也就是说需要用commitActionList来实现commit操作
	//最后根据commitSuccessList更新对应的dbDoc
	private boolean syncupForDocChanged(CommonAction action, ReturnAjax rt) {		
		Doc doc = action.getDoc();
		if(doc == null)
		{
			return false;
		}
		printObject("syncupForDocChanged() doc:",doc);
		
		User login_user = new User();
		login_user.setId(0); //系统自动同步用户 AutoSync
		login_user.setName("AutoSync");
		
		//LockDoc
		DocLock docLock = null;
		synchronized(syncLock)
		{
			//Try to lock the Doc
			docLock = lockDoc(doc,2,1*60*60*1000,login_user,rt,true); //2 Hours 2*60*60*1000 = 86400,000
			if(docLock == null)
			{
				unlock(); //线程锁
				docSysDebugLog("syncupForDocChanged() Failed to lock Doc: " + doc.getName(), rt);
				return false;
			}
			unlock(); //线程锁
		}
		
		//Check the localDocChange behavior
		Repos repos = action.getRepos();
		
		if(repos.getType() == 3 || repos.getType() == 4)
		{
			boolean ret = syncupForDocChanged_NoFS(repos, doc, login_user, rt);
			unlockDoc(doc, login_user, docLock);
			return ret;
		}
		else
		{
			boolean ret = syncupForDocChanged_FS(repos, doc, login_user, rt);
			System.out.println("syncupForDirChange_FS() local Changed: " + doc.getPath()+doc.getName());
			commitMsg = "更新 " +  doc.getPath()+doc.getName();
			String revision = verReposRealDocCommit(repos, doc.getPath(), doc.getName(), doc.getType(), commitMsg, commitUser, rt);
			if(revision != null)
			{
				dbDoc.setSize(localEntry.getSize());
				dbDoc.setLatestEditTime(localEntry.getLatestEditTime());
				dbDoc.setRevision(revision);
				dbDoc.setLatestEditorName(login_user.getName());
				dbUpdateDoc(repos, dbDoc, true);
				return true;
			}
			return false;
			
			unlockDoc(doc, login_user, docLock);
			return ret;
		}
	}
	
	private boolean syncupForDocChanged_NoFS(Repos repos, Doc doc, User login_user, ReturnAjax rt) 
	{
		Doc remoteEntry = verReposGetDoc(repos, doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName(), null);
		if(remoteEntry == null)
		{
			docSysDebugLog("syncupForDocChanged() remoteEntry is null for " + doc.getPath()+doc.getName() + ", 无法同步！", rt);
			return true;
		}
		
		printObject("syncupForDocChanged() remoteEntry: ", remoteEntry);
		
		Doc dbDoc = dbGetDoc(repos, doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName(), true);
		printObject("syncupForDocChanged() dbDoc: ", dbDoc);

		if(remoteEntry.getType() == 1) 
		{
			boolean ret = syncupForFileChange_NoFS(repos, doc, dbDoc, remoteEntry, login_user, rt);

			return ret;
		}
		else if(remoteEntry.getType() == 2) 
		{
			boolean ret = syncupForDirChange_NoFS(repos, doc, dbDoc,remoteEntry, login_user, rt, true);
			return ret;
		}
		else
		{
			boolean ret = syncupForRemoteChange_NoFS(repos, doc, dbDoc, remoteEntry, login_user, rt);
			return ret;
		}
	}
	
	private boolean syncupForRemoteChange_NoFS(Repos repos, Doc doc, Doc dbDoc, Doc remoteEntry, User login_user, ReturnAjax rt) {
		if(dbDoc == null)
		{
			//已同步
			return true;
		}
				
		//Remote Deleted
		System.out.println("syncupForDocChanged() remote Deleted: " + doc.getPath()+doc.getName());
		return dbDeleteDoc(doc, true);
	}

	private boolean syncupForDirChange_NoFS(Repos repos, Doc doc, Doc dbDoc, Doc remoteEntry, User login_user, ReturnAjax rt, boolean enableSubDocSync) {
		//远程新增目录
		if(dbDoc == null)	//remoteAdded
		{
			System.out.println("syncupForDocChanged() remoteAdded Added: " + doc.getPath()+doc.getName());
			return dbAddDoc(repos, remoteEntry, true);
		}
		
		//远程有改动（文件变更为目录）
		if(dbDoc.getType() == null || dbDoc.getType() == 1)
		{
			System.out.println("syncupForDocChanged() remote Changed: " + doc.getPath()+doc.getName());
			dbDoc.setType(2);
			return dbUpdateDoc(repos, dbDoc, true);
		}
		
		//远程目录被删除
		if(remoteEntry.getType() == 0)
		{
			System.out.println("syncupForDocChanged() remote Deleted:" + doc.getPath()+doc.getName());
			return dbDeleteDoc(doc,true);
		}
		
		//远程有改动（目录变更为文件）
		if(remoteEntry.getType() != 2)
		{
			System.out.println("syncupForDocChanged() remoteEntry Changed: " + doc.getPath()+doc.getName());
			dbDeleteDoc(doc,true);
			return dbAddDoc(repos, remoteEntry, true);
		}
		
		//都是目录则检查子目录下是否有改动
		if(enableSubDocSync)
		{
			String path = null;
			if(doc.getName().isEmpty())
			{
				path = doc.getPath();
			}
			else
			{
				path = doc.getPath() + doc.getName() + "/";
			}
			int level = getLevelByParentPath(path);
			SyncUpSubDocs_NoFS(repos, doc.getDocId(), path, level, rt, login_user);
		}
		
		//目录已同步
		return true;
	}

	private boolean syncupForFileChange_NoFS(Repos repos, Doc doc, Doc dbDoc, Doc remoteEntry, User login_user, ReturnAjax rt) {
		if(dbDoc == null)
		{
			if(remoteEntry.getType() != 0)	//Remote Added
			{
				System.out.println("syncupForFileChange_NoFS() remote Added: " + doc.getPath()+doc.getName());
				dbAddDoc(repos, remoteEntry, false);
			}
			return true;
		}
		
		if(dbDoc.getType() == null || dbDoc.getType() != 1 || isDocRemoteChanged(dbDoc, remoteEntry))
		{
			System.out.println("syncupForFileChange_NoFS() remote Changed: " + doc.getPath()+doc.getName());
			dbDoc.setRevision(remoteEntry.getRevision());
			dbUpdateDoc(repos, dbDoc, true);
			return true;
		}
		return false;
	}
	
	private boolean SyncUpSubDocs_NoFS(Repos repos, Long pid, String path, int level, ReturnAjax rt, User login_user) 
	{
    	HashMap<String, Doc> indexHashMap = getIndexHashMap(repos, pid, path);
    	printObject("SyncUpSubDocs_NoFS() indexHashMap:", indexHashMap);
    	
	    List<Doc> remoteEntryList = null;
	    remoteEntryList = getRemoteEntryList(repos, pid, path, level);
	    printObject("SyncUpSubDocs_NoFS() remoteEntryList:", remoteEntryList);
	    
		if(repos.getType() == 3 || repos.getType() == 4)
		{
	    	if(remoteEntryList != null)
	    	{	
	    		for(int i=0; i<remoteEntryList.size(); i++)
		    	{
		    		Doc remoteEntry = remoteEntryList.get(i);
		    		Doc dbDoc = indexHashMap.get(remoteEntry.getName());
	    			
		    		if(dbDoc == null)
		    		{
		    			if(remoteEntry.getType() != 0)	//Remote Added
		    			{
		    				System.out.println("syncupForDocChanged() remote Added: " + path);
		    				dbAddDoc(repos, remoteEntry, false);
		    			}
		    		}
		    		else if(isDocRemoteChanged(dbDoc, remoteEntry))
		    		{
		    			System.out.println("syncupForDocChanged() remote Changed: " + path);
		    			dbDoc.setRevision(remoteEntry.getRevision());
		    			dbUpdateDoc(repos, dbDoc, true);
		    		}
		    	}
	    	}
		}
		return true;
	}
	
	private boolean syncupForDocChanged_FS(Repos repos, Doc doc, User login_user, ReturnAjax rt) 
	{	
		Doc localEntry = fsGetDoc(repos, doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName());
		printObject("syncupForDocChanged() localEntry: ", localEntry);

		if(localEntry == null)
		{
			docSysDebugLog("syncupForDocChanged() localEntry is null for " + doc.getPath()+doc.getName() + ", 无法同步！", rt);
			return false;
		}
		
		Doc dbDoc = dbGetDoc(repos, doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName(), true);
		printObject("syncupForDirChange_FS() dbDoc: ", dbDoc);

		Doc remoteEntry = null;
		switch(localEntry.getType())
		{
		case 0: //not exists
			remoteEntry = verReposGetDoc(repos, doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName(), null);
			printObject("syncupForDirChange_FS() remoteEntry: ", remoteEntry);

			if(remoteEntry == null)
			{
				//connect to verRepos failed or not verCtrl
				return false;
			}

			if(dbDoc == null)
			{				
				if(remoteEntry.getType() == 0)
				{
					return true;
				}
				else	//remote Added
				{
					return syncUpRemoteChange_FS(dbDoc, remoteEntry);
				}
			}
			else
			{
				int remoteChangeType = getRemoteChangeType(dbDoc, remoteEntry);
				if(remoteChangeType != 0)	//remote Changed
				{
					return syncUpRemoteChange_FS(dbDoc, remoteEntry);					
				}
				else	//localDeleted
				{
					commitHashMap.put(dbDoc.getDocId(), dbDoc);
					return true;
				}				
			}
			break;
		case 1:	//File
			if(dbDoc == null)	//localAdded
			{				
				commitHashMap.put(localEntry.getDocId(), localEntry);
			}
			else
			{
				int localChangeType = getLocalChangeType(dbDoc, localEntry);
				if(localChangeType != 0)	//local Changed
				{
					commitHashMap.put(localEntry.getDocId(), localEntry);					
				}
				else
				{
					int remoteChangeType = getRemoteChangeType(dbDoc, remoteEntry);
					if(remoteChangeType != 0)	//remote Changed
					{
						return syncUpRemoteChange_FS(dbDoc, remoteEntry);					
					}
					return true;
				}				
			}
			break;
		case 2: //Dir
			if(dbDoc == null)	//localAdded
			{				
				commitHashMap.put(localEntry.getDocId(), localEntry);
			}
			else
			{
				int localChangeType = getLocalChangeType(dbDoc, localEntry);
				if(localChangeType != 0)	//local Changed
				{
					commitHashMap.put(localEntry.getDocId(), localEntry);					
				}
				else
				{
					int remoteChangeType = getRemoteChangeType(dbDoc, remoteEntry);
					if(remoteChangeType != 0)	//remote Changed
					{
						return syncUpRemoteChange_FS(dbDoc, remoteEntry);					
					}
					
					return SyncUpSubDocs_FS(subDocSyncFlag);
				}				
			}
			break;
		}
		return false;
	}
	
	
	private boolean SyncUpSubDocs_FS(Repos repos, Long pid, String path, int level, ReturnAjax rt, User login_user, HashMap<Long, Doc> commitHashMap, int subDocSyncFlag) 
	{
		//子目录不递归
		if(subDocSyncFlag == 0)
		{
			return true;
		}
		
		//子目录递归不继承
		if(subDocSyncFlag == 1)
		{
			subDocSyncFlag = 0;
		}
		
		HashMap<String, Doc> docHashMap = null;	//the doc already syncUped
	
		Doc subDoc = null;
		
		List<Doc> dbDocList = getDBEntryList();
	   	if(dbDocList != null)
    	{
	    	for(int i=0;i<dbDocList.size();i++)
	    	{
	    		subDoc = dbDocList.get(i);
	    		docHashMap.put(subDoc.getName(), subDoc);
	    		syncupForDocChanged_FS(subDocSyncFlag);
	    	}
    	}

    	List<Doc> localEntryList = getLocalEntryList(repos, pid, path, level);
		printObject("SyncUpSubDocs_FS() localEntryList:", localEntryList);
		if(localEntryList != null)
    	{
	    	for(int i=0;i<localEntryList.size();i++)
	    	{
	    		subDoc = localEntryList.get(i);
	    		docHashMap.put(subDoc.getName(), subDoc);
	    		syncupForDocChanged_FS(subDocSyncFlag);
	    	}
    	}
	    
	    List<Doc> remoteEntryList = getRemoteEntryList(repos, pid, path, level);
	    printObject("SyncUpSubDocs_FS() remoteEntryList:", remoteEntryList);
	    if(remoteEntryList != null)
    	{
	    	for(int i=0;i<remoteEntryList.size();i++)
		    {
	    		subDoc = remoteEntryList.get(i);
	    		docHashMap.put(subDoc.getName(), subDoc);
	    		syncupForDocChanged_FS(subDocSyncFlag);
		    }
    	}
	    
	    return true;
    }

	//localEntry and dbDoc was same
	private boolean syncupForRemoteChange_FS(Repos repos, Doc doc, Doc remoteEntry, User login_user, ReturnAjax rt, int remoteChangeType) 
	{	
		switch(remoteChangeType)
		{
		case 1:		//Remote Added
			System.out.println("syncupForRemoteChange_FS() remote Added: " + doc.getPath()+doc.getName());	
			String localParentPath = getReposRealPath(repos) + remoteEntry.getPath();
			List<Doc> successDocList = verReposCheckOut(repos, true,remoteEntry.getPath(), remoteEntry.getName(), localParentPath, remoteEntry.getName(), null, true);
			if(successDocList != null)
			{
				dbAddDoc(repos, remoteEntry, true);
				return true;
			}
			return false;
		case 2: //Remote Type Changed
			System.out.println("syncupForDirChange_FS() remote Type Changed: " + doc.getPath()+doc.getName());
			if(deleteRealDoc(repos, doc, rt) == true)
			{
				dbDeleteDoc(doc,true);
				
				//checkOut
				String localParentPath = getReposRealPath(repos) + remoteEntry.getPath();
				List<Doc> successDocList = verReposCheckOut(repos, true,remoteEntry.getPath(), remoteEntry.getName(), localParentPath, remoteEntry.getName(), null, true);
				if(successDocList != null)
				{
					dbAddDoc(repos, remoteEntry, true);
					return true;						
				}
				return false;						
			}
			else
			{
				return false;
			}
		case 3: //Remote File Changed
			System.out.println("syncupForFileChange_FS() remote Changed: " + doc.getPath()+doc.getName());
			
			String localParentPath = getReposRealPath(repos) + remoteEntry.getPath();
			List<Doc> successDocList = verReposCheckOut(repos, true,remoteEntry.getPath(), remoteEntry.getName(), localParentPath, remoteEntry.getName(), null, true);
			if(successDocList != null)
			{
				//SuccessDocList中的doc包括了revision信息
				for(int i=0; i<successDocList.size(); i++)
				{
					dbUpdateDoc(repos, successDocList.get(i), true);
				}
				return true;
			}
			return false;
		case 4: //Remote Deleted
			System.out.println("syncupForDocChanged() local and remote deleted: " + doc.getPath()+doc.getName());
			dbDeleteDoc(doc, true);
			return true;
		}
		
		return false;
	}
	
	private boolean syncupForDirChange_FS(Repos repos, Doc doc, Doc localEntry, User login_user, ReturnAjax rt, boolean enableSubDocSync) {
		String commitMsg = "同步目录 " +  doc.getPath()+doc.getName();
		String commitUser = "AutoSync";
		
		//根目录
		if(doc.getDocId() == 0)
		{
			if(localEntry.getType() != 2)
			{
				docSysErrorLog("syncupForDirChange_FS() 本地根节点不是目录 " + doc.getPath()+doc.getName() + ", 无法同步！", rt);
				return false;
			}
		}
		else
		{
			Doc dbDoc = dbGetDoc(repos, doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName(), true);
			printObject("syncupForDirChange_FS() dbDoc: ", dbDoc);
			
			//本地新增目录
			if(dbDoc == null)	//localAdded
			{
				System.out.println("syncupForDirChange_FS() local Added: " + doc.getPath()+doc.getName());
				commitMsg = "增加 " +  doc.getPath()+doc.getName();
				String revision = verReposRealDocAdd(repos, doc.getPath(), doc.getName(), doc.getType(), commitMsg, commitUser, rt);
				if(revision != null)
				{
					localEntry.setRevision(revision);
					localEntry.setLatestEditorName(login_user.getName());
					dbAddDoc(repos, localEntry, true);
					return true;
				}
				return false;	
			}
			
			//本地有改动（文件变更为目录）
			if(dbDoc.getType() == null || dbDoc.getType().equals(localEntry.getType()))
			{

			}
	
			//本地目录没有改动
			Doc remoteEntry = verReposGetDoc(repos, doc.getDocId(), doc.getPid(), doc.getPath(), doc.getName(), null);
			printObject("syncupForDirChange_FS() remoteEntry: ", remoteEntry);
			if(remoteEntry == null)
			{
				docSysDebugLog("syncupForDirChange_FS() remoteEntry is null for " + doc.getPath()+doc.getName() + ", 无法远程同步！", rt);
				return true;
			}
			
			//远程目录被删除
			if(remoteEntry.getType() == 0)
			{
				System.out.println("syncupForDirChange_FS() remote Deleted:" + doc.getPath()+doc.getName());
				if(deleteRealDoc(repos, doc, rt) == true)
				{
					dbDeleteDoc(doc,true);
					return false;
				}
				return false;
			}
			
			//远程有改动（目录变更为文件）
			if(remoteEntry.getType() != 2)
			{
				System.out.println("syncupForDirChange_FS() remoteEntry Changed: " + doc.getPath()+doc.getName());
				if(deleteRealDoc(repos, doc, rt) == true)
				{
					dbDeleteDoc(doc,true);
					
					//checkOut
					String localParentPath = getReposRealPath(repos) + remoteEntry.getPath();
					List<Doc> successDocList = verReposCheckOut(repos, true,remoteEntry.getPath(), remoteEntry.getName(), localParentPath, remoteEntry.getName(), null, true);
					if(successDocList != null)
					{
						dbAddDoc(repos, remoteEntry, true);
						return true;						
					}
					return false;						
				}
				else
				{
					return false;
				}
			}
		}
		//目录已同步
		return true;
	}
	
	//获取真实的DocInfo，返回null表示获取异常（表示localEntry和remoteEntry都无法获取）
	protected Doc docSysGetDoc(Repos repos, Long docId, Long pid, String parentPath, String docName, User login_user) {		
		System.out.println("docSysGetDoc() parentPath:" + parentPath + " docName:" + docName);
				
		boolean isDocLocked = checkDocLocked(repos.getId(), parentPath, docName, login_user, false);
		
		Doc doc = new Doc();
		doc.setPath(parentPath);
		doc.setName(docName);
		
		Doc dbDoc = null;
		if(isDocLocked)
		{
			dbDoc = dbGetDoc(repos, docId, pid, parentPath, docName, true);
			return dbDoc;
		}
		
		dbDoc = dbGetDoc(repos, docId, pid, parentPath, docName, true);
		printObject("docSysGetDoc() dbDoc: ", dbDoc);
		
		Doc localEntry = fsGetDoc(repos, docId, pid, parentPath, docName);
		printObject("docSysGetDoc() localEntry: ", localEntry);
			
		Doc remoteEntry = verReposGetDoc(repos, docId, pid, parentPath, docName, null);
		printObject("docSysGetDoc() remoteEntry: ", remoteEntry);

		if(repos.getType() == 3 || repos.getType() == 4)
		{
			if(dbDoc == null)
			{
				if(remoteEntry != null)	//Remote Added
				{
					System.out.println("docSysGetDoc() remote Added: " + doc.getPath()+doc.getName());
					return remoteEntry;
				}
				return null;
			}
			
			if(remoteEntry == null)
			{
				System.out.println("docSysGetDoc() remote deleted: " + doc.getPath()+doc.getName());
				return null;
			}
			
			if(isDocRemoteChanged(dbDoc, remoteEntry))
			{
				System.out.println("docSysGetDoc() remote Changed: " + doc.getPath()+doc.getName());
				dbDoc.setRevision(remoteEntry.getRevision());
				return dbDoc;
			}
			return dbDoc;
		}
		else
		{
			if(localEntry == null)
			{
				//get localEntry 异常
				System.out.println("docSysGetDoc() get localEntry 异常: " + doc.getPath()+doc.getName());
				return null;
			}
			
			if(localEntry.getType() != 0)
			{
				if(dbDoc == null)	//localAdded
				{
					System.out.println("docSysGetDoc() local Added: " + doc.getPath()+doc.getName());
					return localEntry;
				}
				
				if(isDocLocalChanged(dbDoc,localEntry))	//localChanged (force commit)
				{
					System.out.println("docSysGetDoc() local Changed: " + doc.getPath()+doc.getName());
					return localEntry;
				}
	
				if(remoteEntry == null)
				{
					System.out.println("docSysGetDoc() get remoteEntry 异常:" + doc.getPath()+doc.getName() + " regard doc not changed");
					return dbDoc;
				}
	
				if(remoteEntry.getType() != 0)
				{
					System.out.println("docSysGetDoc() remote Deleted" + doc.getPath()+doc.getName());
					return remoteEntry;
				}
				
				if(dbDoc.getType() != remoteEntry.getType())
				{
					System.out.println("docSysGetDoc() remoteEntry Type Changed: " + doc.getPath()+doc.getName());
					return remoteEntry;						
				}
				
				if(isDocRemoteChanged(dbDoc, remoteEntry))
				{
					System.out.println("docSysGetDoc() remote Changed: " + doc.getPath()+doc.getName());					
					return remoteEntry;
				}
				return dbDoc;
			}
			
			if(dbDoc == null)
			{
				if(remoteEntry == null)
				{
					System.out.println("docSysGetDoc() get remoteEntry 异常:" + doc.getPath()+doc.getName() + " regard doc not changed");
					return dbDoc;
				}

				if(remoteEntry.getType() == 0)	//Remote Deleted
				{
					System.out.println("docSysGetDoc() remote Deleted: " + doc.getPath()+doc.getName());
					return remoteEntry;
				}

				if(remoteEntry.getType() != 0)	//Remote Added
				{
					System.out.println("docSysGetDoc() remote Added: " + doc.getPath()+doc.getName());
					return remoteEntry;
				}				
			}
			
			if(remoteEntry == null)
			{
				System.out.println("docSysGetDoc() get remoteEntry 异常:" + doc.getPath()+doc.getName() + " regard doc not changed");
				return dbDoc;
			}
			
			//localDeleted and remoteDeleted so just delete dbDoc
			if(remoteEntry.getType() == 0)
			{
				System.out.println("docSysGetDoc() local and remote deleted: " + doc.getPath()+doc.getName());
				return remoteEntry;				
			}
			
			System.out.println("docSysGetDoc() local deleted: " + doc.getPath()+doc.getName());
			return localEntry;
		}
	}

	protected Doc fsGetDoc(Repos repos, Long docId, Long pid, String parentPath, String name) 
	{
		Doc doc = new Doc();
		doc.setVid(repos.getId());
		doc.setDocId(docId);
		doc.setPid(pid);
		doc.setPath(parentPath);
		doc.setName(name);
		doc.setType(0);	//不存在
	
		String localParentPath = getReposRealPath(repos) + parentPath;
		File localEntry = new File(localParentPath,name);
		if(localEntry.exists())
		{
			doc.setSize(localEntry.length());
			doc.setLatestEditTime(localEntry.lastModified());
			doc.setType(localEntry.isDirectory()? 2: 1);
		}
		return doc;
	}
	
	private Doc verReposGetDoc(Repos repos, Long docId, Long pid, String parentPath, String name, String revision)
	{
		if(repos.getVerCtrl() == 1)
		{
			return svnGetDoc(repos, docId, pid, parentPath,name, revision);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitGetDoc(repos, docId, pid, parentPath,name, revision);	
		}
		return null;
	}

	private Doc svnGetDoc(Repos repos, Long docId, Long pid, String parentPath, String entryName, String strRevision) {
		System.out.println("svnGetDoc() reposId:" + repos.getId() + " parentPath:" + parentPath + " entryName:" + entryName);
		if(parentPath == null)
		{
			System.out.println("svnGetDoc() parentPath is null");
			return null;			
		}
		
		if(entryName == null || entryName.isEmpty())
		{
			System.out.println("svnGetDoc() entryName can not be empty");
			return null;
		}
		
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, true, "") == false)
		{
			System.out.println("svnGetDoc() svnUtil.Init失败！");	
			return null;
		}

		Long revision = (long) -1;
		if(strRevision != null)
		{
			revision = Long.parseLong(strRevision);
		}

		Doc doc = svnUtil.getDoc(parentPath+entryName, revision);
		if(doc == null)
		{
			doc = new Doc();
			//Set doc BasicInfo
			doc.setVid(repos.getId());
			doc.setDocId(docId);
			doc.setPid(pid);
			doc.setPath(parentPath);
			doc.setName(entryName);
			doc.setType(0);
			return doc;
		}
		
		//Set doc BasicInfo
		doc.setVid(repos.getId());
		doc.setDocId(docId);
		doc.setPid(pid);
		doc.setPath(parentPath);
		doc.setName(entryName);
		doc.setSize(0L);
		return doc;
	}

	private Doc gitGetDoc(Repos repos, Long docId, Long pid, String parentPath, String entryName, String revision) {
		//System.out.println("gitGetDoc() reposId:" + repos.getId() + " parentPath:" + parentPath + " entryName:" + entryName);
		if(entryName == null || entryName.isEmpty())
		{
			System.out.println("gitGetDoc() entryName can not be empty");
			return null;
		}

		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, "") == false)
		{
			System.out.println("gitRealDocCommit() GITUtil Init failed");
			return null;
		}
		
		Doc doc = gitUtil.getDoc(parentPath+entryName, revision);
		if(doc == null)
		{
			return null;
		}
		
		doc.setVid(repos.getId());
		doc.setDocId(docId);
		doc.setPid(pid);
		doc.setPath(parentPath);
		doc.setName(entryName);
		doc.setSize(0L);
		return doc;
	}

	protected Doc dbGetDoc(Repos repos, Long docId, Long pid, String parentPath, String docName, boolean dupCheck) 
	{	
		Doc qDoc = new Doc();
		qDoc.setVid(repos.getId());
		qDoc.setPath(parentPath);
		qDoc.setName(docName);
		
		List<Doc> list = reposService.getDocList(qDoc);
		//printObject("dbGetDoc() list:", list);
		
		if(list == null || list.size() == 0)
		{
			return null;
		}
		
		if(dupCheck)
		{
			if(list.size() > 1)
			{
				System.out.println("dbGetDoc() 数据库存在多个DOC记录，自动清理"); 
				for(int i=0; i <list.size(); i++)
				{
					dbDeleteDoc(list.get(i), true);
				}
				return null;
			}
		}
	
		Doc doc = list.get(0);
		doc.setVid(repos.getId());
		doc.setDocId(docId);
		doc.setPid(pid);
		doc.setPath(parentPath);
		doc.setName(docName);		
		return doc;
	}
	
	private boolean dbDeleteDoc(Doc doc, boolean deleteSubDocs) {

		if(deleteSubDocs)
		{
			Doc qSubDoc = new Doc();
			qSubDoc.setVid(doc.getVid());
			qSubDoc.setPath(doc.getPath() + doc.getName() + "/");
			List<Doc> subDocList = reposService.getDocList(qSubDoc);
			if(subDocList != null)
			{
				for(int i=0; i<subDocList.size(); i++)
				{
					Doc subDoc = subDocList.get(i);
					dbDeleteDoc(subDoc, true);
				}
			}
		}
		
		Doc qDoc = new Doc();
		qDoc.setVid(doc.getVid());
		qDoc.setName(doc.getName());
		qDoc.setPath(doc.getPath());
		if(reposService.deleteDoc(qDoc) == 0)
		{
			return false;
		}
		return true;
	}

	private boolean dbUpdateDoc(Repos repos, Doc doc, boolean force) 
	{
		if(force == false)
		{
			if(reposService.updateDoc(doc) == 0)
			{
				return false;
			}		
			return true;
		}	
		
		//强制更新
		Doc qDoc = new Doc();
		qDoc.setVid(repos.getId());
		qDoc.setPath(doc.getPath());
		qDoc.setName(doc.getName());
				
		List<Doc> list = reposService.getDocList(qDoc);
				
		//dbDoc not exists, do add it
		if(list == null || list.size() == 0)
		{
			System.out.println("dbUpdateDoc() dbDoc not exists,do add it"); 
			return dbAddDoc(repos, doc, true);
		}
		
		//there is duplicated nodes, do delete it and add it
		if(list.size() > 1)
		{
			System.out.println("dbUpdateDoc() there is duplicated nodes, do delete it and add it"); 
			for(int i=0; i <list.size(); i++)
			{
				if(dbDeleteDoc(list.get(i), true) == false)
				{
					return false;
				}
			}
					
			return  dbAddDoc(repos, doc, true);	
		}	
		
		//type not matched, do delete it and add it
		Doc dbDoc = list.get(0);
		if(dbDoc.getType() != doc.getType())
		{
			System.out.println("dbUpdateDoc() docType not matched, do delete and add it"); 
			if(dbDeleteDoc(dbDoc, true) == false)
			{
				return false;
			}
			return  dbAddDoc(repos, doc, true);	
		}	
		
		if(reposService.updateDoc(doc) == 0)
		{
			return false;
		}		
		return true;
	}
	
	private boolean dbDeleteDocEx(List<CommonAction> actionList, Repos repos, Doc doc, boolean deleteSubDocs, String commitMsg, String commitUser) {

		if(deleteSubDocs)
		{
			Doc qSubDoc = new Doc();
			qSubDoc.setVid(doc.getVid());
			qSubDoc.setPath(doc.getPath() + doc.getName() + "/");
			List<Doc> subDocList = reposService.getDocList(qSubDoc);
			if(subDocList != null)
			{
				for(int i=0; i<subDocList.size(); i++)
				{
					Doc subDoc = subDocList.get(i);
					dbDeleteDocEx(actionList, repos, subDoc, true, commitMsg, commitUser);
				}
			}
		}
		
		Doc qDoc = new Doc();
		qDoc.setVid(doc.getVid());
		qDoc.setName(doc.getName());
		qDoc.setPath(doc.getPath());
		if(reposService.deleteDoc(qDoc) == 0)
		{
			return false;
		}
		
		//Build ActionList for RDocIndex/VDoc/VDocIndex/VDocVerRepos delete
		BuildMultiActionListForDocDelete(actionList, repos, doc, commitMsg, commitUser);

		return true;
	}

	private boolean executeDBAction(CommonAction action, ReturnAjax rt) 
	{
		printObject("executeDBAction() action:",action);
		switch(action.getAction())
		{
		case 1:	//Add Doc
			return dbAddDoc(action.getRepos(), action.getDoc(), false);
		case 2: //Delete Doc
			return dbDeleteDoc(action.getDoc(), true);
		case 3: //Update Doc
			return dbUpdateDoc(action.getRepos(), action.getDoc(), true);
		}
		return false;
	}
	
	private boolean executeIndexAction(CommonAction action, ReturnAjax rt) 
	{
		printObject("executeIndexAction() action:",action);
		switch(action.getDocType())
		{
		case 0:	//DocName
    		return executeIndexActionForDocName(action, rt);
    	case 1: //RDoc
			return executeIndexActionForRDoc(action, rt);
		case 2: //VDoc
			return executeIndexActionForVDoc(action, rt);
		}
		return false;
	}
	
	private boolean executeIndexActionForDocName(CommonAction action, ReturnAjax rt) 
	{
		Repos repos = action.getRepos();
		Doc doc = action.getDoc();
		
		switch(action.getAction())
		{
		case 1:	//Add Doc
			return addIndexForDocName(repos, doc, rt);
		case 2: //Delete Doc
			return deleteIndexForDocName(repos, doc, rt);
		case 3: //Update Doc
			Doc newDoc = action.getNewDoc();
			return updateIndexForDocName(repos, doc, newDoc, rt);			
		}
		return false;
	}

	private boolean executeIndexActionForRDoc(CommonAction action, ReturnAjax rt) 
	{
		Doc doc = action.getDoc();
		Repos repos = action.getRepos();
		
		switch(action.getAction())
		{
		case 1:	//Add Doc
			return addIndexForRDoc(repos, doc);
		case 2: //Delete Doc
			return deleteIndexForRDoc(repos, doc);
		case 3: //Update Doc
			return updateIndexForRDoc(repos, doc);		
		}
		return false;
	}
	
	private boolean executeIndexActionForVDoc(CommonAction action, ReturnAjax rt) 
	{
		Repos repos = action.getRepos();
		Doc doc = action.getDoc();
		
		switch(action.getAction())
		{
		case 1:	//Add Doc
			return addIndexForVDoc(repos, doc);
		case 2: //Delete Doc
			return deleteIndexForVDoc(repos, doc);
		case 3: //Update Doc
			return updateIndexForVDoc(repos, doc);		
		}
		return false;
	}
	
	private boolean executeFSAction(CommonAction action, ReturnAjax rt) {
		printObject("executeFSAction() action:",action);
		switch(action.getDocType())
		{
		case 1:	//RDoc
			return executeLocalActionForRDoc(action, rt);
		case 2: //VDoc
			return executeLocalActionForVDoc(action, rt); 
		}
		return false;
	}
	
	private boolean executeLocalActionForRDoc(CommonAction action, ReturnAjax rt)
	{		
		Doc doc = action.getDoc();
		Doc newDoc = action.getNewDoc();
		
		Repos repos = action.getRepos();
		
		switch(action.getAction())
		{
		case 1:	//Add Doc
			return createRealDoc(repos, doc, rt);
		case 2: //Delete Doc
			return deleteRealDoc(repos, doc, rt);
		case 3: //Update Doc
			MultipartFile uploadFile = action.getUploadFile();
			Integer chunkNum = action.getChunkNum();
			Integer chunkSize = action.getChunkSize();
			String chunkParentPath = action.getChunkParentPath();
			return updateRealDoc(repos, doc, uploadFile, chunkNum, chunkSize, chunkParentPath, rt);
		case 4: //Move Doc
			return moveRealDoc(repos, doc, newDoc, rt);
		case 5: //Copy Doc
			return copyRealDoc(repos, doc, newDoc, rt);
		}
		return false;
	}
	
	private boolean executeLocalActionForVDoc(CommonAction action, ReturnAjax rt)
	{	
		Doc doc = action.getDoc();
		Doc newDoc = action.getNewDoc();
		
		Repos repos = action.getRepos();
		
		switch(action.getAction())
		{
		case 1:	//Add Doc
			return createVirtualDoc(repos, doc, rt);
		case 2: //Delete Doc
			return deleteVirtualDoc(repos, doc, rt);
		case 3: //Update Doc
			return saveVirtualDocContent(getReposVirtualPath(repos), doc, rt);
		case 4: //Move Doc
			return moveVirtualDoc(repos, doc, newDoc, rt);
		case 5: //Copy Doc
			return copyVirtualDoc(repos, doc, newDoc, rt);
		}
		return false;
	}

	private String executeVerReposAction(CommonAction action, ReturnAjax rt) 
	{
		printObject("executeVerReposAction() action:",action);
		Repos repos = action.getRepos();
		Doc doc = action.getDoc();
		switch(action.getDocType())
		{
		case 1:	//RDoc autoCommit
			String localRealRootPath = getReposRealPath(repos);
			return verReposAutoCommit(repos, true, doc.getPath(), doc.getName(), localRealRootPath, action.getCommitMsg(), action.getCommitUser(), true, null);
		case 2: //VDoc autoCommit
			String localVirtualRootPath = getReposVirtualPath(repos);
			String vDocName = getVDocName(doc);			
			return verReposAutoCommit(repos, false, "", vDocName, localVirtualRootPath, action.getCommitMsg(), action.getCommitUser(), true, null);
		}
		return null;
	}

	//底层updateDoc接口
	protected boolean updateDoc(Repos repos, Long docId, Long parentId, String parentPath, String docName,
								MultipartFile uploadFile,Long fileSize,String checkSum, 
								Integer chunkNum, Integer chunkSize, String chunkParentPath, 
								String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return updateDoc_FS(repos, docId, parentId, parentPath, docName,
					uploadFile, fileSize, checkSum, 
					chunkNum, chunkSize, chunkParentPath, 
					commitMsg, commitUser, login_user, rt, actionList);
		}
		return false;
	}

	protected boolean updateDoc_FS(Repos repos, Long docId, Long parentId, String parentPath, String docName,
				MultipartFile uploadFile,Long fileSize,String checkSum, 
				Integer chunkNum, Integer chunkSize, String chunkParentPath, 
				String commitMsg,String commitUser,User login_user, ReturnAjax rt,
				List<CommonAction> actionList) 
	{	
		Doc doc = new Doc();
		doc.setVid(repos.getId());
		doc.setDocId(docId);
		doc.setPid(parentId);
		doc.setPath(parentPath);
		doc.setName(docName);
		doc.setType(1);
		doc.setSize(fileSize);
		doc.setCheckSum(checkSum);
		
		DocLock docLock = null;
		synchronized(syncLock)
		{
			//Try to lock the doc
			docLock = lockDoc(doc, 1, 2*60*60*1000, login_user, rt,false); //lock 2 Hours 2*60*60*1000
			if(docLock == null)
			{
				unlock(); //线程锁
	
				System.out.println("updateDoc() lockDoc " + docName +" Failed！");
				return false;
			}
			unlock(); //线程锁
		}

		//get RealDoc Full ParentPath
		String reposRPath =  getReposRealPath(repos);		

		//保存文件信息
		if(updateRealDoc(repos, doc, uploadFile,chunkNum,chunkSize,chunkParentPath,rt) == false)
		{
			unlockDoc(doc,login_user,docLock);

			System.out.println("updateDoc() saveFile " + docId +" Failed, unlockDoc Ok");
			rt.setError("Failed to updateRealDoc " + docName);
			return false;
		}
		
		doc.setLatestEditor(login_user.getId());
		doc.setLatestEditorName(login_user.getName());
		
		//Get latestEditTime
		Doc fsDoc = fsGetDoc(repos, docId, parentId, parentPath, docName);
		doc.setLatestEditTime(fsDoc.getLatestEditTime());

		//需要将文件Commit到版本仓库上去
		String revision = verReposRealDocCommit(repos,parentPath,docName,doc.getType(),commitMsg,commitUser,rt);
		if(revision == null)
		{
			docSysDebugLog("updateDoc() verReposRealDocCommit Failed:" + parentPath + docName, rt);
			docSysWarningLog("verReposRealDocCommit Failed", rt);	
		}
		else
		{
			//updateDoc Info
			doc.setRevision(revision);
			if(dbUpdateDoc(repos, doc, true) == false)
			{
				docSysWarningLog("updateDoc() updateDocInfo Failed", rt);
			}
		}
		
		//Build DocUpdate action
		BuildMultiActionListForDocUpdate(actionList, repos, doc, reposRPath);
		
		unlockDoc(doc,login_user,docLock);
		
		return true;
	}
	
	protected boolean renameDoc(Repos repos, Long docId, Long srcPid, Integer type, String srcParentPath,
			String srcName, String dstName, String commitMsg, String commitUser, User login_user, ReturnAjax rt,
			List<CommonAction> actionList) {
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return 	moveDoc_FS(repos, docId, srcPid, srcPid, type, srcParentPath, srcName, srcParentPath, dstName,
					commitMsg, commitUser, login_user, rt, actionList);
		}
		return false;
	}
	

	protected boolean moveDoc(Repos repos, Long docId, Long srcPid, Long dstPid, Integer type, String srcParentPath,
			String srcName, String dstParentPath, String dstName, String commitMsg, String commitUser,
			User login_user, ReturnAjax rt, List<CommonAction> actionList) {
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return 	moveDoc_FS(repos, docId, srcPid, dstPid, type, srcParentPath, srcName, dstParentPath, dstName,
					commitMsg, commitUser, login_user, rt, actionList);
		}
		return false;
	}

	private boolean moveDoc_FS(Repos repos, Long docId, Long srcPid, Long dstPid, Integer type, String srcParentPath,
			String srcName, String dstParentPath, String dstName, String commitMsg, String commitUser, User login_user,
			ReturnAjax rt, List<CommonAction> actionList) {

		System.out.println("moveDoc_FS() move " +docId+ " " + srcParentPath+srcName + " to " + dstParentPath+dstName);			
		
		Integer reposId = repos.getId();

		Doc srcDoc = new Doc();
		srcDoc.setVid(reposId);
		srcDoc.setDocId(docId);
		srcDoc.setPid(srcPid);
		srcDoc.setType(type);
		srcDoc.setPath(srcParentPath);
		srcDoc.setName(srcName);
		
		Doc dstDoc = new Doc();
		int dstLevel = getLevelByParentPath(dstParentPath);
		dstDoc.setVid(reposId);
		dstDoc.setDocId(buildDocIdByName(dstLevel, dstParentPath, dstName));
		dstDoc.setPid(dstPid);
		dstDoc.setType(type);
		dstDoc.setPath(dstParentPath);
		dstDoc.setName(dstName);
		
		DocLock srcDocLock = null;
		DocLock dstDocLock = null;
		synchronized(syncLock)
		{
			//Try to lock the srcDoc
			srcDocLock = lockDoc(srcDoc,1, 2*60*60*1000,login_user,rt,true);
			if(srcDocLock == null)
			{
				unlock(); //线程锁
		
				docSysDebugLog("moveDoc_FS() lock srcDoc " + srcDoc.getName() + " Failed", rt);
				return false;
			}
			
			dstDocLock = lockDoc(dstDoc,1, 2*60*60*1000,login_user,rt,true);
			if(dstDocLock == null)
			{
				unlock(); //线程锁
				docSysDebugLog("moveDoc_FS() lock dstDoc " + dstDoc.getName() + " Failed", rt);

				unlockDoc(srcDoc, login_user, srcDocLock);
				return false;
			}
			
			unlock(); //线程锁
		}
		
		if(moveRealDoc(repos, srcDoc, dstDoc, rt) == false)
		{
			unlockDoc(srcDoc, login_user, srcDocLock);
			unlockDoc(dstDoc, login_user, dstDocLock);

			docSysDebugLog("moveDoc_FS() moveRealDoc " + srcName + " to " + dstName + " 失败", rt);
			return false;
		}
		
		String revision = verReposRealDocMove(repos, srcParentPath,srcName, dstParentPath, dstName,type,commitMsg, commitUser,rt);
		if(revision == null)
		{
			docSysWarningLog("moveDoc_FS() verReposRealDocMove Failed", rt);
		}
		else
		{
			dstDoc.setRevision(revision);
			if(dbMoveDoc(srcDoc, dstDoc, login_user, rt) == false)
			{
				docSysWarningLog("moveDoc_FS() dbMoveDoc failed", rt);			
			}
		}
		
		unlockDoc(srcDoc,login_user,srcDocLock);
		unlockDoc(dstDoc,login_user,dstDocLock);
		
		rt.setData(dstDoc);
		return true;
	}


	private boolean dbMoveDoc(Doc srcDoc, Doc dstDoc, User login_user, ReturnAjax rt) {
		// TODO Auto-generated method stub
		return false;
	}

	//底层copyDoc接口
	protected boolean copyDoc(Repos repos, Long docId, Long srcPid, Long dstPid, Integer type, String srcParentPath, String srcName, String dstParentPath, String dstName,
			String commitMsg,String commitUser,User login_user, ReturnAjax rt,List<CommonAction> actionList) 
	{
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return 	copyDoc_FS(repos, docId, srcPid, dstPid, type, srcParentPath, srcName, dstParentPath, dstName,
					commitMsg, commitUser, login_user, rt, actionList);
		}
		return false;
	}

	protected boolean copyDoc_FS(Repos repos, Long docId, Long srcPid, Long dstPid, Integer type, String srcParentPath, String srcName, String dstParentPath, String dstName,
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList)
	{
		System.out.println("copyDoc() copy " +docId+ " " + srcParentPath+srcName + " to " + dstParentPath+dstName);			
		
		Integer reposId = repos.getId();

		Doc srcDoc = new Doc();
		srcDoc.setVid(reposId);
		srcDoc.setDocId(docId);
		srcDoc.setPid(srcPid);
		srcDoc.setType(type);
		srcDoc.setPath(srcParentPath);
		srcDoc.setName(srcName);
		
		Doc dstDoc = new Doc();
		int dstLevel = getLevelByParentPath(dstParentPath);
		dstDoc.setVid(reposId);
		dstDoc.setDocId(buildDocIdByName(dstLevel, dstParentPath, dstName));
		dstDoc.setPid(dstPid);
		dstDoc.setType(type);
		dstDoc.setPath(dstParentPath);
		dstDoc.setName(dstName);
		
		DocLock srcDocLock = null;
		DocLock dstDocLock = null;
		synchronized(syncLock)
		{
			//Try to lock the srcDoc
			srcDocLock = lockDoc(srcDoc,1, 2*60*60*1000,login_user,rt,true);
			if(srcDocLock == null)
			{
				unlock(); //线程锁
		
				System.out.println("copyDoc lock srcDoc " + srcDoc.getName() + " Failed");
				return false;
			}
			
			dstDocLock = lockDoc(dstDoc,1, 2*60*60*1000,login_user,rt,true);
			if(dstDocLock == null)
			{
				unlock(); //线程锁
				System.out.println("copyDoc lock dstcDoc " + dstDoc.getName() + " Failed");
				
				unlockDoc(srcDoc, login_user, srcDocLock);
				
				return false;
			}
			
			unlock(); //线程锁
		}
						
		//复制文件或目录
		if(copyRealDoc(repos, srcDoc, dstDoc, rt) == false)
		{
			unlockDoc(srcDoc,login_user,null);
			unlockDoc(dstDoc,login_user,null);

			System.out.println("copy " + srcName + " to " + dstName + " 失败");
			rt.setError("copyRealDoc copy " + srcName + " to " + dstName + "Failed");
			return false;
		}
			
		//需要将文件Commit到VerRepos上去
		String revision = verReposRealDocCopy(repos,srcParentPath,srcName,dstParentPath,dstName,type,commitMsg, commitUser,rt);
		if(revision == null)
		{
			docSysWarningLog("copyDoc() verReposRealDocCopy failed", rt);
		}
		else
		{
			dstDoc.setRevision(revision);
			if(dbCopyDoc(srcDoc, dstDoc, login_user, rt) == false)
			{
				docSysWarningLog("copyDoc() dbCopyDoc failed", rt);			
			}
		}
		
		//Build Async Actions For RealDocIndex\VDoc\VDocIndex Add
		BuildMultiActionListForDocCopy(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser);
		
		unlockDoc(srcDoc,login_user,srcDocLock);
		unlockDoc(dstDoc,login_user,dstDocLock);
		
		//只返回最上层的doc记录
		rt.setData(dstDoc);
		return true;
	}

	private boolean dbCopyDoc(Doc srcDoc, Doc dstDoc, User login_user, ReturnAjax rt) {
		// TODO Auto-generated method stub
		return false;
	}

	private void BuildMultiActionListForDocCopy(List<CommonAction> actionList, Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser) 
	{	
	    //ActionId 1:FS 2:VerRepos 3:DB 4:Index  5:AutoSyncUp
		//ActionType 1:add 2:delete 3:update 4:move 5:copy
	    //DocType 0:DocName 1:RealDoc 2:VirtualDoc   AutoSyncUp(1: localDocChanged  2: remoteDocChanged)
		
		//Insert copy Action For RealDoc Index Copy (对于目录则会进行递归)
		insertCopyAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, 4, 5, 1, null);
		
		//Copy VDoc (包括VDoc VerRepos and Index)
		insertCopyAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, 1, 5, 2, null);
	}

	protected boolean updateDocContent(Repos repos, Doc doc, 
			String commitMsg, String commitUser, User login_user,ReturnAjax rt, List<CommonAction> actionList) 
	{		
		DocLock docLock = null;
		synchronized(syncLock)
		{
			//Try to lock Doc
			docLock = lockDoc(doc,2, 1*60*60*1000, login_user,rt,false);
			if(docLock == null)
			{
				unlock(); //线程锁
	
				System.out.println("updateDocContent() lockDoc Failed");
				return false;
			}
			unlock(); //线程锁
		}
		
		updateDocContent_FS(repos, doc, commitMsg, commitUser, login_user, rt, actionList);
		
		//revert the lockStatus
		unlockDoc(doc, login_user, docLock);
				
		return true;
	}

	private boolean updateDocContent_FS(Repos repos, Doc doc,
			String commitMsg, String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		//Save the content to virtual file
		String reposVPath = getReposVirtualPath(repos);
		String docVName = getVDocName(doc);
		String localVDocPath = reposVPath + docVName;
		
		System.out.println("updateDocContent_FS() localVDocPath: " + localVDocPath);
		if(isFileExist(localVDocPath) == true)
		{
			if(saveVirtualDocContent(reposVPath, doc, rt) == true)
			{
				verReposVirtualDocCommit(repos, docVName, commitMsg, commitUser,rt);
			}
		}
		else
		{	
			//创建虚拟文件目录：用户编辑保存时再考虑创建
			if(createVirtualDoc(repos, doc, rt) == true)
			{
				verReposVirtualDocCommit(repos, docVName, commitMsg, commitUser,rt);
			}
		}
		
		//updateIndexForVDoc(repos.getId(), docId, parentPath, docName, content);
		BuildCommonActionListForDocContentUpdate(actionList, repos, doc, login_user, commitMsg, commitUser);
		
		return true;
	}

	/************************ DocSys仓库与文件锁定接口 *******************************/
	//Lock Repos
	protected Repos lockRepos(Integer reposId,Integer lockType, long lockDuration, User login_user, ReturnAjax rt, boolean docLockCheckFlag) 
	{
		System.out.println("lockRepos() reposId:" + reposId + " lockType:" + lockType + " by " + login_user.getName() + " docLockCheckFlag:" + docLockCheckFlag);
		//确定Repos是否可用
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("repos " + reposId +" 不存在！");
			System.out.println("lockRepos() Repos: " + reposId +" 不存在！");
			return null;
		}
		
		//Check if repos was locked
		if(isReposLocked(repos, login_user,rt))
		{
			System.out.println("lockRepos() Repos:" + repos.getId() +" was locked！");				
			return null;			
		}
		
		if(docLockCheckFlag)
		{
			Doc doc = new Doc();
			doc.setVid(reposId);
			doc.setDocId((long) 0);
			if(isSubDocLocked(doc,login_user, rt) == true)
			{
				System.out.println("lockRepos() doc was locked！");
				return null;
			}
		}
		
		//lockTime is the time to release lock 
		Repos lockRepos= new Repos();
		lockRepos.setId(reposId);
		lockRepos.setState(lockType);
		lockRepos.setLockBy(login_user.getId());
		long lockTime = new Date().getTime() + lockDuration; //24*60*60*1000;
		lockRepos.setLockTime(lockTime);	//Set lockTime
		if(reposService.updateRepos(lockRepos) == 0)
		{
			rt.setError("lock Repos:" + reposId +"[" + repos.getName() +"]  failed");
			return null;
		}
		System.out.println("lockRepos() success reposId:" + reposId + " lockType:" + lockType + " by " + login_user.getName());
		return repos;	
	}
	

	//确定仓库是否被锁定
	private boolean isReposLocked(Repos repos, User login_user, ReturnAjax rt) {
		int lockState = repos.getState();	//0: not locked  1: locked	
		if(lockState != 0)
		{
			if(isLockOutOfDate(repos.getLockTime()) == false)
			{	
				User lockBy = getLocker(repos.getLockBy());
				String lockTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(repos.getLockTime());
				
				rt.setError("仓库 " + repos.getName() +" was locked by [" + repos.getLockBy() + "] "+ lockBy.getName() + " till " + lockTime);
				System.out.println("Repos " + repos.getId()+ "[" + repos.getName() +"] was locked by " + repos.getLockBy() + " lockState:"+ repos.getState());;
				return true;						
			}
			else 
			{
				System.out.println("Repos " + repos.getId()+ " " + repos.getName()  +" lock was out of date！");
				return false;
			}
		}
		return false;
	}
	
	//Unlock Doc
	protected boolean unlockRepos(Integer reposId, User login_user, Repos preLockInfo) {
		Repos curRepos = reposService.getRepos(reposId);
		if(curRepos == null)
		{
			System.out.println("unlockRepos() curRepos is null " + reposId);
			return false;
		}
		
		if(curRepos.getState() == 0)
		{
			System.out.println("unlockRepos() repos was not locked:" + curRepos.getState());			
			return true;
		}
		
		Integer lockBy = curRepos.getLockBy();
		if(lockBy != null && lockBy == login_user.getId())
		{
			Repos revertRepos = new Repos();
			revertRepos.setId(reposId);	
			
			if(preLockInfo == null)	//Unlock
			{
				revertRepos.setState(0);	//
				revertRepos.setLockBy(0);	//
				revertRepos.setLockTime((long)0);	//Set lockTime
			}
			else	//Revert to preLockState
			{
				revertRepos.setState(preLockInfo.getState());	//
				revertRepos.setLockBy(preLockInfo.getLockBy());	//
				revertRepos.setLockTime(preLockInfo.getLockTime());	//Set lockTime
			}
			
			if(reposService.updateRepos(revertRepos) == 0)
			{
				System.out.println("unlockRepos() updateRepos Failed!");
				return false;
			}
		}
		else
		{
			System.out.println("unlockRepos() repos was not locked by " + login_user.getName());
			return false;
		}
		
		System.out.println("unlockRepos() success:" + reposId);
		return true;
	}
	
	//Lock Doc
	protected DocLock lockDoc(Doc doc,Integer lockType, long lockDuration, User login_user, ReturnAjax rt, boolean subDocCheckFlag) {
		System.out.println("lockDoc() doc:" + doc.getName() + " lockType:" + lockType + " login_user:" + login_user.getName() + " subDocCheckFlag:" + subDocCheckFlag);

		//check if the doc was locked (State!=0 && lockTime - curTime > 1 day)
		DocLock docLock = getDocLock(doc);
		if(docLock != null && isDocLocked(docLock,login_user,rt))
		{
			System.out.println("lockDoc() Doc " + doc.getName() +" was locked");
			return null;
		}
		
		//检查其父节点是否强制锁定
		if(isParentDocLocked(doc,login_user,rt))
		{
			System.out.println("lockDoc() Parent Doc of " + doc.getName() +" was locked！");				
			return null;
		}
		
		//Check If SubDoc was locked
		if(subDocCheckFlag)
		{
			if(isSubDocLocked(doc,login_user, rt) == true)
			{
				System.out.println("lockDoc() subDoc of " + doc.getName() +" was locked！");
				return null;
			}
		}
		
		//Do Lock
		//lockTime is the time to release lock 
		long lockTime = new Date().getTime() + lockDuration;
		
		if(docLock == null)
		{
			docLock = new DocLock();
			docLock.setVid(doc.getVid());
			docLock.setPid(doc.getPid());			
			docLock.setDocId(doc.getDocId());
			docLock.setPath(doc.getPath());			
			docLock.setName(doc.getName());			
			docLock.setType(doc.getType());
			
			docLock.setState(lockType);	//doc的状态为不可用
			docLock.setLocker(login_user.getName());
			docLock.setLockBy(login_user.getId());
			docLock.setLockTime(lockTime);	//Set lockTime
			if(reposService.addDocLock(docLock) == 0)
			{
				rt.setError("lock Doc [" + doc.getName() +"]  failed");
				return null;
			}
			
			//Set LockState = 0, which will be used for unlockDoc
			docLock.setState(0);
		}
		else
		{
			DocLock newDocLock = new DocLock();
			docLock.setId(docLock.getId());
			newDocLock.setState(lockType);	//doc的状态为不可用
			newDocLock.setLocker(login_user.getName());
			newDocLock.setLockBy(login_user.getId());
			newDocLock.setLockTime(lockTime);	//Set lockTime
			if(reposService.updateDocLock(newDocLock) == 0)
			{
				rt.setError("lock Doc [" + doc.getName() +"]  failed");
				return null;
			}
		}
		
		System.out.println("lockDoc() " + doc.getName() + " success lockType:" + lockType + " by " + login_user.getName());
		return docLock;
	}
	
	private DocLock getDocLock(Doc doc) {
		DocLock qDocLock = new DocLock();
		qDocLock.setVid(doc.getVid());
		qDocLock.setPath(doc.getPath());
		qDocLock.setName(doc.getName());
		
		List<DocLock> list = reposService.getDocLockList(qDocLock);
		if(list == null || list.size() == 0)
		{
			return null;
		}
		
		return list.get(0);
	}

	private User getLocker(Integer userId) {
		User user = new User();
		if(userId == 0)	//AutoSync
		{
			user.setId(0);
			user.setName("AutoSync");
			return user;
		}

		user = userService.getUser(userId);
		return user;
	}

	//确定当前doc是否被锁定
	private boolean isDocLocked(DocLock docLock,User login_user,ReturnAjax rt) {
		if(docLock == null)
		{
			return false;
		}
		
		int lockState = docLock.getState();	//0: not locked 2: 表示强制锁定（实文件正在新增、更新、删除），不允许被自己解锁；1: 表示RDoc处于CheckOut 3:表示正在编辑VDoc
		if(lockState != 0)
		{
			//Not force locked (user can access it by himself)
			if(lockState != 2)
			{
				if(docLock.getLockBy() == login_user.getId())	//locked by login_user
				{
					System.out.println("Doc: " + docLock.getName() +" was locked by user:" + docLock.getLockBy() +" login_user:" + login_user.getId());
					return false;
				}
			}
			
			if(isLockOutOfDate(docLock.getLockTime()) == false)
			{	
				String lockTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(docLock.getLockTime());

				rt.setError(docLock.getName() +" was locked by [" + docLock.getLockBy() + "] " +docLock.getLocker() + " till " + lockTime);
				
				System.out.println("Doc [" + docLock.getName() +"] was locked by " + docLock.getLocker() + " lockState:"+ docLock.getState());
				return true;						
			}
			else 
			{
				System.out.println("doc " + docLock.getId()+ " " + docLock.getName()  +" lock was out of date！");
				return false;
			}
		}
		return false;
	}

	private boolean isLockOutOfDate(long lockTime) {
		//check if the lock was out of date
		long curTime = new Date().getTime();
		//System.out.println("isLockOutOfDate() curTime:"+curTime+" lockTime:"+lockTime);
		if(curTime < lockTime)	//
		{
			return false;
		}

		//Lock 自动失效
		return true;
	}

	//确定parentDoc is Force Locked
	private boolean isParentDocLocked(Doc doc, User login_user,ReturnAjax rt) 
	{
		//Check if the rootDoc locked
		Integer reposId = doc.getVid();
		Doc tempDoc = new Doc();
		tempDoc.setVid(reposId);
		tempDoc.setPath("");
		tempDoc.setName("");
		DocLock lock = getDocLock(doc);
		if(isDocLocked(lock, login_user, rt))
		{
			return true;
		}
		
		//Check parentDoc locked
		String parentPath = doc.getPath();
		if(parentPath == null || parentPath.isEmpty())
		{
			return false;
		}
				
		String [] paths = parentPath.split("/");

		String path = "";		
		for(int i=0; i< paths.length; i++)
		{
			String name = paths[i];
			if(name.isEmpty())
			{
				continue;
			}
			
			tempDoc.setPath(path);
			tempDoc.setName(name);
			lock = getDocLock(doc);
			if(isDocLocked(lock, login_user, rt))
			{
				return true;
			}
			path = path + name +"/";
		}
		return false;
	}
	
	//docId目录下是否有锁定的doc(包括所有锁定状态)
	//Check if any subDoc under docId was locked, you need to check it when you want to rename/move/copy/delete the Directory
	private boolean isSubDocLocked(Doc doc, User login_user, ReturnAjax rt)
	{
		Integer reposId = doc.getVid();
		
		//Set the query condition to get the SubDocList of DocId
		DocLock qDocLock = new DocLock();
		qDocLock.setVid(doc.getVid());
		qDocLock.setPath(doc.getPath() + doc.getName() + "/");
		List<DocLock> SubDocLockList = reposService.getDocLockList(qDocLock);

		for(int i=0;i<SubDocLockList.size();i++)
		{
			DocLock subDocLock =SubDocLockList.get(i);
			if(isDocLocked(subDocLock, login_user, rt))
			{
				rt.setError("subDoc [" +  subDocLock.getName() + "] is locked:" + subDocLock.getState());
				System.out.println("isSubDocLocked() " + subDocLock.getName() + " is locked!");
				return true;
			}
			
			//If SubDocLock is for directory, need to check its subDocLocks
			if(subDocLock.getType() == 2)
			{
				Doc subDoc = new Doc();
				subDoc.setVid(reposId);
				subDoc.setPath(subDocLock.getPath());
				subDoc.setName(subDocLock.getName());
				if(isSubDocLocked(subDoc, login_user, rt))
				{
					return true;
				}
			}
		}
		return false;
	}
	
	//Unlock Doc
	private boolean unlockDoc(Doc doc, User login_user, DocLock preDocLock) 
	{
		DocLock curDocLock = getDocLock(doc);
		if(curDocLock == null)
		{
			System.out.println("unlockDoc() curDocLock is null ");
			return true;
		}
		
		if(curDocLock.getState() == 0)
		{
			System.out.println("unlockDoc() doc was not locked:" + curDocLock.getState());			
			return true;
		}
		
		if(preDocLock != null && preDocLock.getState() != 0)	//Revert to preDocLock
		{
			if(reposService.updateDocLock(preDocLock) == 0)
			{
				System.out.println("unlockDoc() updateDocLock Failed!");
				return false;
			}
		}
		
		if(reposService.deleteDocLock(curDocLock) == 0)
		{
			System.out.println("unlockDoc() deleteDocLock Failed!");
			return false;
		}
		
		System.out.println("unlockDoc() success:" + doc.getName());
		return true;
	}	
	/********************* DocSys权限相关接口 ****************************/
	//检查用户的新增权限
	protected boolean checkUserAddRight(Repos repos, Integer userId, Long parentId, String parentPath, String docName, ReturnAjax rt) 
	{		
		DocAuth docUserAuth = getUserDocAuth(repos, userId, parentId, parentPath, docName);
		if(docUserAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			return false;
		}
		else
		{
			if(docUserAuth.getAccess() == 0)
			{
				rt.setError("您无权访问该目录，请联系管理员");
				return false;
			}
			else if(docUserAuth.getAddEn() != 1)
			{
				rt.setError("您没有该目录的新增权限，请联系管理员");
				return false;				
			}
		}
		return true;
	}

	protected boolean checkUserDeleteRight(Repos repos, Integer userId, Long docId, String parentPath, String docName, ReturnAjax rt)
	{	
		DocAuth docUserAuth = getUserDocAuth(repos, userId, docId, parentPath, docName);
		if(docUserAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			return false;
		}
		else
		{
			if(docUserAuth.getAccess() == 0)
			{
				rt.setError("您无权访问该目录，请联系管理员");
				return false;
			}
			else if(docUserAuth.getDeleteEn() != 1)
			{
				rt.setError("您没有该目录的删除权限，请联系管理员");
				return false;				
			}
		}
		return true;
	}
	
	protected boolean checkUserEditRight(Repos repos, Integer userId, Long docId, String parentPath, String docName, ReturnAjax rt)
	{
		DocAuth docUserAuth = getUserDocAuth(repos, userId, docId, parentPath, docName);
		if(docUserAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			return false;
		}
		else
		{
			if(docUserAuth.getAccess() == 0)
			{
				rt.setError("您无权访问该文件，请联系管理员");
				return false;
			}
			else if(docUserAuth.getEditEn() != 1)
			{
				rt.setError("您没有该文件的编辑权限，请联系管理员");
				return false;				
			}
		}
		return true;
	}
	
	protected boolean checkUseAccessRight(Repos repos, Integer userId, Long docId, String parentPath, String docName, ReturnAjax rt)
	{
		DocAuth docAuth = getUserDocAuth(repos, userId, docId, parentPath, docName);
		if(docAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			return false;
		}
		else
		{
			Integer access = docAuth.getAccess();
			if(access == null || access.equals(0))
			{
				rt.setError("您无权访问该文件，请联系管理员");
				return false;
			}
		}
		return true;
	}
	
	protected String getUserName(Integer userId) {
		if(userId == null)
		{
			return "";
		}	
		else if(userId == 0)
		{
			return "任意用户";
		}
		else
		{
			//GetUserInfo
			User user = reposService.getUserInfo(userId);
			if(user == null)
			{
				System.out.println("getUserName() user:" +userId+ "not exists");
				return null;
			}
			return user.getName();
		}
	}

	
	private String getGroupName(Integer groupId) {
		UserGroup group = reposService.getGroupInfo(groupId);
		if(group == null)
		{
			System.out.println("getGroupName() Group:" +groupId+ "not exists");
			return null;
		}
		return group.getName();
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
	
	protected boolean isAdminOfDoc(Repos repos, User login_user, Long docId, String parentPath, String docName) 
	{
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
			return true;
		}
		
		DocAuth userDocAuth = getUserDocAuth(repos, login_user.getId(), docId, parentPath, docName);
		if(userDocAuth != null && userDocAuth.getIsAdmin() != null && userDocAuth.getIsAdmin() == 1)
		{
			return true;
		}
		return false;
	}
	
	protected boolean isAdminOfRepos(User login_user,Integer reposId) {
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
			return true;
		}
		
		ReposAuth reposAuth = getUserReposAuth(login_user.getId(),reposId);
		if(reposAuth != null && reposAuth.getIsAdmin() != null && reposAuth.getIsAdmin() == 1)
		{
			return true;
		}			
		return false;
	}
	
	//获取用户真正的仓库权限(已考虑了所在组以及任意用户权限)
	public ReposAuth getUserDispReposAuth(Integer UserID,Integer ReposID)
	{
		ReposAuth reposAuth = getUserReposAuth(UserID,ReposID);
		
		String userName = getUserName(UserID);
		if(reposAuth!=null)
		{
			reposAuth.setUserName(userName);
		}
		else
		{
			reposAuth = new ReposAuth();
			//reposAuth.setUserId(UserID);
			reposAuth.setUserName(userName);
			//reposAuth.setReposId(ReposID);
			//reposAuth.setIsAdmin(0);
			//reposAuth.setAccess(0);
			//reposAuth.setEditEn(0);
			//reposAuth.setAddEn(0);
			//reposAuth.setDeleteEn(0);
			//reposAuth.setHeritable(0);	
		}
		return reposAuth;
	}
	
	public ReposAuth getUserReposAuth(Integer UserID,Integer ReposID)
	{
		System.out.println("getUserReposAuth() UserID:"+UserID);
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setUserId(UserID);
		qReposAuth.setReposId(ReposID);
		List<ReposAuth> reposAuthList = reposService.getReposAuthListForUser(qReposAuth);
		if(reposAuthList == null || reposAuthList.size() == 0)
		{
			return null;
		}
		
		//reposAuth Init
		ReposAuth reposAuth = reposAuthList.get(0);
		Integer oldPriority = reposAuth.getPriority();
		for(int i=1;i<reposAuthList.size();i++){
			//Find the reposAuth with highest priority
			ReposAuth tmpReposAuth = reposAuthList.get(i);
			Integer newPriority = tmpReposAuth.getPriority();
			if(newPriority > oldPriority)
			{
				reposAuth = tmpReposAuth;
			}
			else if(newPriority == oldPriority)
			{
				xorReposAuth(reposAuth,tmpReposAuth);
			}
		}
		return reposAuth;
	}
	
	
	//应该考虑将获取Group、User的合并到一起
	protected DocAuth getGroupDispDocAuth(Repos repos, Integer groupId,Long docId, String parentPath, String docName) 
	{
		System.out.println("getGroupDispDocAuth() groupId:"+groupId);
		//For rootDoc
		if(docId == null || docId == 0)
		{
			parentPath = "";
			docName = "";
		}
		
		DocAuth docAuth = getGroupDocAuth(repos, groupId, docId, parentPath, docName);	//获取用户真实的权限
		
		 String groupName = getGroupName(groupId);
		 
		 //转换成可显示的权限
		if(docAuth == null)
		{
			docAuth = new DocAuth();
			docAuth.setGroupId(groupId);
			docAuth.setGroupName(groupName);
			docAuth.setDocId(docId);
			docAuth.setDocName(docName);
			docAuth.setDocPath(parentPath);
			docAuth.setReposId(repos.getId());
		}
		else	//如果docAuth非空，需要判断是否是直接权限，如果不是需要对docAuth进行修改
		{
			if(docAuth.getUserId() != null || !docAuth.getGroupId().equals(groupId) || !docAuth.getDocId().equals(docId))
			{
				System.out.println("getGroupDispDocAuth() docAuth为继承的权限,需要删除reposAuthId并设置groupId、groupName");
				docAuth.setId(null);	//clear reposAuthID, so that we know this setting was not on user directly
			}
			//修改信息
			docAuth.setGroupId(groupId);
			docAuth.setGroupName(groupName);
			docAuth.setDocId(docId);
			docAuth.setDocName(docName);
			docAuth.setDocPath(parentPath);
			docAuth.setReposId(repos.getId());
		}
		return docAuth;
	}
	
	//获取用户的用于显示的docAuth
	public DocAuth getUserDispDocAuth(Repos repos, Integer UserID,Long DocID,String parentPath, String docName)
	{
		System.out.println("getUserDispDocAuth() UserID:"+UserID);
		//For rootDoc
		if(DocID == null || DocID == 0)
		{
			parentPath = "";
			docName = "";
		}
		
		DocAuth docAuth = getUserDocAuth(repos, UserID, DocID, parentPath, docName);	//获取用户真实的权限
		printObject("getUserDispDocAuth() docAuth:",docAuth);
		
		//Get UserName
		String UserName = getUserName(UserID);
		
		//转换成可显示的权限
		if(docAuth == null)
		{
			docAuth = new DocAuth();
			docAuth.setUserId(UserID);
			docAuth.setUserName(UserName);
			docAuth.setDocId(DocID);
			docAuth.setDocName(docName);
			docAuth.setDocPath(parentPath);
			docAuth.setReposId(repos.getId());
		}
		else	//如果docAuth非空，需要判断是否是直接权限，如果不是需要对docAuth进行修改
		{
			printObject("getUserDispDocAuth() docAuth:",docAuth);
			if(docAuth.getUserId() == null || !docAuth.getUserId().equals(UserID) || !docAuth.getDocId().equals(DocID))
			{
				System.out.println("getUserDispDocAuth() docAuth为继承的权限,需要删除reposAuthId并设置userID、UserName");
				docAuth.setId(null);	//clear docAuthID, so that we know this setting was not on user directly
			}
			
			docAuth.setUserId(UserID);
			docAuth.setUserName(UserName);
			docAuth.setDocId(DocID);
			docAuth.setDocName(docName);
			docAuth.setDocPath(parentPath);
			docAuth.setReposId(repos.getId());
		}
		return docAuth;
	}

	protected DocAuth getGroupDocAuth(Repos repos, Integer groupId,Long docId, String parentPath, String docName)
	{
		return getRealDocAuth(repos, null, groupId, docId, parentPath, docName);
	}
	
	protected DocAuth getUserDocAuth(Repos repos, Integer userId,Long parentId, String parentPath, String docName) 
	{
		return getRealDocAuth(repos, userId, null, parentId,  parentPath, docName);
	}
	
	//Function:getUserDocAuth
	protected DocAuth getRealDocAuth(Repos repos, Integer userId,Integer groupId,Long parentId, String parentPath, String docName) 
	{
		System.out.println("getRealDocAuth()  reposId:"+ repos.getId() + " userId:" + userId + " groupId:"+ groupId + " docId:" + parentId + " parentPath:" + parentPath + " docName:" + docName);
		
		//获取从docId到rootDoc的全路径，put it to docPathList
		List<Long> docIdList = new ArrayList<Long>();
		docIdList = getDocIdList(repos, parentId,parentPath, docName, docIdList);
		if(docIdList == null || docIdList.size() == 0)
		{
			return null;
		}
		printObject("getRealDocAuth() docIdList:",docIdList); 
		
		//Get UserDocAuthHashMap
		HashMap<Long, DocAuth> docAuthHashMap = null;
		if(userId != null)
		{
			docAuthHashMap = getUserDocAuthHashMap(userId,repos.getId());
		}
		else
		{
			docAuthHashMap = getGroupDocAuthHashMap(groupId,repos.getId());
		}
		
		//go throug the docIdList to get the UserDocAuthFromHashMap
		DocAuth parentDocAuth = null;
		DocAuth docAuth = null;
		int docPathDeepth = docIdList.size();
		for(int i= 0; i < docPathDeepth; i++)
		{
			Long curDocId = docIdList.get(i);
			System.out.println("getRealDocAuth() curDocId[" + i+ "]:" + curDocId); 
			docAuth = getDocAuthFromHashMap(curDocId,parentDocAuth,docAuthHashMap);
			parentDocAuth = docAuth;
		}		
		return docAuth;
	}

	protected List<Long> getDocIdList(Repos repos, Long parentId, String parentPath, String docName, List<Long> docIdList) 
	{
		if(parentId == null || parentId == 0)
		{
			docIdList.add(0L);
			return docIdList;
		}
		
		String docPath = parentPath + docName;
		String [] paths = docPath.split("/");
		int docPathDeepth = paths.length;

		//RootDocId
		docIdList.add(0L);
		
		String tmpPath = "";
		String tmpName = "";
		for(int i=0; i<docPathDeepth; i++)
		{
			tmpName = paths[i];
			if(tmpName.isEmpty())
			{
				continue;
			}
			
			Long tempDocId = buildDocIdByName(i, tmpPath, tmpName);
			docIdList.add(tempDocId);
			
			tmpPath = tmpPath + tmpName + "/";
		}
		
		return docIdList;
	}
	
	protected HashMap<Long,DocAuth> getUserDocAuthHashMap(Integer UserID,Integer reposID) 
	{
		DocAuth docAuth = new DocAuth();
		docAuth.setUserId(UserID);			
		docAuth.setReposId(reposID);
	
		List <DocAuth> docAuthList = null;
		if(UserID == 0)
		{
			docAuthList = reposService.getDocAuthForAnyUser(docAuth);
		}
		else
		{
			docAuthList = reposService.getDocAuthForUser(docAuth);
		}
		printObject("getUserDocAuthHashMap() "+ "userID:" + UserID + " docAuthList:", docAuthList);
		
		if(docAuthList == null || docAuthList.size() == 0)
		{
			return null;
		}
		
		HashMap<Long,DocAuth> hashMap = BuildHashMapByDocAuthList(docAuthList);
		printObject("getUserDocAuthHashMap() "+ "userID:" + UserID + " hashMap:", hashMap);
		return hashMap;
	}
	
	//获取组在仓库上所有doc的权限设置: 仅用于显示group的权限
	protected HashMap<Long, DocAuth> getGroupDocAuthHashMap(Integer GroupID,Integer reposID) 
	{
		DocAuth docAuth = new DocAuth();
		docAuth.setGroupId(GroupID);
		docAuth.setReposId(reposID);
		List <DocAuth> docAuthList = reposService.getDocAuthForGroup(docAuth);
		printObject("getGroupDocAuthHashMap() GroupID[" + GroupID +"] docAuthList:", docAuthList);
		
		if(docAuthList == null || docAuthList.size() == 0)
		{
			return null;
		}
		
		HashMap<Long, DocAuth> hashMap = BuildHashMapByDocAuthList(docAuthList);
		printObject("getGroupDocAuthHashMap() GroupID[" + GroupID +"] hashMap:", hashMap);
		return hashMap;
	}
	
	protected Integer getAuthType(Integer userId, Integer groupId) {

		if(userId == null)
		{
			if(groupId != null)
			{
				return 2;
			}
			else
			{
				return null;
			}
		}
		else if(userId > 0)
		{
			return 3; //权限类型：用户权限
		}
		else
		{
			if(groupId != null)
			{
				return 2;
			}
			return 1; //权限类型：任意用户权限
		}
	}
	
	protected Integer getPriorityByAuthType(Integer type) {
		if(type == 3)
		{
			return 10;
		}
		else if(type == 2)
		{
			return 1;
		}
		else if(type ==1)
		{
			return 0;
		}
		return null;
	}
	
	protected void xorReposAuth(ReposAuth auth, ReposAuth tmpAuth) {
		if(tmpAuth.getIsAdmin()!=null && tmpAuth.getIsAdmin().equals(1))
		{
			auth.setIsAdmin(1);
		}
		if(tmpAuth.getAccess()!=null && tmpAuth.getAccess().equals(1))
		{
			auth.setAccess(1);
		}
		if(tmpAuth.getAddEn()!=null && tmpAuth.getAddEn().equals(1))
		{
			auth.setAddEn(1);
		}
		if(tmpAuth.getDeleteEn()!=null && tmpAuth.getDeleteEn().equals(1))
		{
			auth.setDeleteEn(1);
		}
		if(tmpAuth.getEditEn()!=null && tmpAuth.getEditEn().equals(1))
		{
			auth.setEditEn(1);
		}
		if(tmpAuth.getHeritable()!=null && tmpAuth.getHeritable().equals(1))
		{
			auth.setHeritable(1);
		}	
	}
	
	protected void xorDocAuth(DocAuth auth, DocAuth tmpAuth) {
		if(tmpAuth.getIsAdmin()!=null && tmpAuth.getIsAdmin().equals(1))
		{
			auth.setIsAdmin(1);
		}
		if(tmpAuth.getAccess()!=null && tmpAuth.getAccess().equals(1))
		{
			auth.setAccess(1);
		}
		if(tmpAuth.getAddEn()!=null && tmpAuth.getAddEn().equals(1))
		{
			auth.setAddEn(1);
		}
		if(tmpAuth.getDeleteEn()!=null && tmpAuth.getDeleteEn().equals(1))
		{
			auth.setDeleteEn(1);
		}
		if(tmpAuth.getEditEn()!=null && tmpAuth.getEditEn().equals(1))
		{
			auth.setEditEn(1);
		}
		if(tmpAuth.getHeritable()!=null && tmpAuth.getHeritable().equals(1))
		{
			auth.setHeritable(1);
		}	
	}
	
	//这是一个非常重要的底层接口，每个doc的权限都是使用这个接口获取的
	protected DocAuth getDocAuthFromHashMap(Long docId, DocAuth parentDocAuth,HashMap<Long,DocAuth> docAuthHashMap)
	{
		//System.out.println("getDocAuthFromHashMap() docId:" + docId);
		if(docAuthHashMap == null)
		{
			return null;
		}
		
		if(docId == null)
		{
			return null;
		}
		
		//For rootDoc parentDocAuth is useless
		if(docId == 0)
		{
			DocAuth docAuth = docAuthHashMap.get(docId);
			return docAuth;
		}
		
		//Not root Doc, if parentDocAuth is null, return null
		if(parentDocAuth == null)
		{
			System.out.println("getDocAuthFromHashMap() docId:" + docId + " parentDocAuth is null");
			return null;
		}
		
		//Not root Doc and parentDocAuth is set
		Integer parentPriority = parentDocAuth.getPriority();
		Integer parentHeritable = parentDocAuth.getHeritable();
		DocAuth docAuth = docAuthHashMap.get(docId);
		if(docAuth == null)
		{
			//设置为空，继承父节点权限
			if(parentHeritable == null || parentHeritable == 0)
			{
				//不可继承
				System.out.println("getDocAuthFromHashMap() docId:" + docId + "docAuth is null and parentHeritable is null or 0");
				return null;
			}
			return parentDocAuth;
		}
		else
		{
			if(docAuth.getPriority() >= parentPriority)
			{
				//Use the docAuth
				return docAuth;
			}
			else
			{
				//无效设置，则继承父节点权限
				if(parentHeritable == null || parentHeritable == 0)
				{
					//不可继承
					System.out.println("getDocAuthFromHashMap() docId:" + docId + " docAuth priority < parentPriority and parentHeritable is null or 0");
					return null;
				}
				return parentDocAuth;
			}
		}
	}
		
	protected HashMap<Integer,ReposAuth> BuildHashMapByReposAuthList(List<ReposAuth> reposAuthList) {
		//去重并将参数放入HashMap
		HashMap<Integer,ReposAuth> hashMap = new HashMap<Integer,ReposAuth>();
		for(int i=0;i<reposAuthList.size();i++)
		{
			ReposAuth reposAuth = reposAuthList.get(i);
			Integer reposId = reposAuth.getReposId();
			ReposAuth hashEntry = hashMap.get(reposId);
			if(hashEntry == null)
			{
				hashMap.put(reposId, reposAuth);
			}
			else
			{
				Integer oldPriority = hashEntry.getPriority();
				Integer newPriority = reposAuth.getPriority();
				if(newPriority > oldPriority)
				{
					//Update to new ReposAuth
					hashMap.put(reposId, reposAuth);
				}
				else if(newPriority == oldPriority)
				{
					xorReposAuth(hashEntry,reposAuth);
				}
			}
			
		}		
		return hashMap;
	}
	
	protected HashMap<Long,DocAuth> BuildHashMapByDocAuthList(List<DocAuth> docAuthList) {
		//去重并将参数放入HashMap
		HashMap<Long,DocAuth> hashMap = new HashMap<Long,DocAuth>();
		for(int i=0;i<docAuthList.size();i++)
		{
			DocAuth docAuth = docAuthList.get(i);
			Long docId = docAuth.getDocId();
			DocAuth hashEntry = hashMap.get(docId);
			if(hashEntry == null)
			{
				hashMap.put(docId, docAuth);
			}
			else
			{
				Integer oldPriority = hashEntry.getPriority();
				Integer newPriority = docAuth.getPriority();
				if(newPriority > oldPriority)
				{
					//Update to new DocAuth
					hashMap.put(docId, docAuth);
				}
				else if(newPriority == oldPriority)
				{
					xorDocAuth(hashEntry,docAuth);
				}
			}
			
		}		
		return hashMap;
	}

	
	/*************************** DocSys文件操作接口 ***********************************/
	//create Real Doc
	protected boolean createRealDoc(Repos repos, Doc doc, ReturnAjax rt) {
		String name = doc.getName();
		int type = doc.getType();
		
		String reposRPath = getReposRealPath(repos);
		//获取 doc parentPath
		String localParentPath =  reposRPath + doc.getPath();

		String localDocPath = localParentPath + name;

		System.out.println("createRealDoc() localParentPath:" + localParentPath);
		
		if(type == 2) //目录
		{
			if(false == createDir(localDocPath))
			{
				docSysDebugLog("createRealDoc() 目录 " +localDocPath + " 创建失败！", rt);
				return false;
			}				
		}
		else
		{
			if(false == createFile(localParentPath,name))
			{
				docSysDebugLog("createRealDoc() createFile 文件 " + localDocPath + "创建失败！", rt);
				return false;					
			}
		}
		return true;
	}
	
	protected boolean deleteRealDoc(Repos repos, Doc doc, ReturnAjax rt) {
		
		String reposRPath = getReposRealPath(repos);
		String parentPath = doc.getPath();
		String name = doc.getName();
		String localDocPath = reposRPath + parentPath + name;

		if(delFileOrDir(localDocPath) == false)
		{
			docSysDebugLog("deleteRealDoc() delFileOrDir " + localDocPath + "删除失败！", rt);
			return false;
		}
		
		return true;
	}
	
	protected boolean updateRealDoc(Repos repos, Doc doc, MultipartFile uploadFile, Integer chunkNum, Integer chunkSize, String chunkParentPath, ReturnAjax rt) 
	{
		String parentPath = doc.getPath();
		String name = doc.getName();
		Long fileSize = doc.getSize();
		String fileCheckSum = doc.getCheckSum();
		
		String reposRPath = getReposRealPath(repos);
		
		String localDocParentPath = reposRPath + parentPath;
		String retName = null;
		try {
			if(null == chunkNum)	//非分片上传
			{
				retName = saveFile(uploadFile, localDocParentPath,name);
			}
			else
			{
				retName = combineChunks(localDocParentPath,name,chunkNum,chunkSize,chunkParentPath);
			}
			//Verify the size and FileCheckSum
			if(false == checkFileSizeAndCheckSum(localDocParentPath,name,fileSize,fileCheckSum))
			{
				System.out.println("updateRealDoc() checkFileSizeAndCheckSum Error");
				return false;
			}
			
		} catch (Exception e) {
			System.out.println("updateRealDoc() saveFile " + name +" 异常！");
			docSysDebugLog(e.toString(), rt);
			return false;
		}
		
		System.out.println("updateRealDoc() saveFile return: " + retName);
		if(retName == null  || !retName.equals(name))
		{
			System.out.println("updateRealDoc() saveFile " + name +" Failed！");
			return false;
		}
		return true;
	}
	
	protected String combineChunks(String targetParentPath,String fileName, Integer chunkNum,Integer cutSize, String chunkParentPath) {
		try {
			String targetFilePath = targetParentPath + fileName;
			FileOutputStream out;

			out = new FileOutputStream(targetFilePath);
	        FileChannel outputChannel = out.getChannel();   

        	long offset = 0;
	        for(int chunkIndex = 0; chunkIndex < chunkNum; chunkIndex ++)
	        {
	        	String chunkFilePath = chunkParentPath + fileName + "_" + chunkIndex;
	        	FileInputStream in=new FileInputStream(chunkFilePath);
	            FileChannel inputChannel = in.getChannel();    
	            outputChannel.transferFrom(inputChannel, offset, inputChannel.size());
	        	offset += inputChannel.size();	        			
	    	   	inputChannel.close();
	    	   	in.close();
	    	}
	        outputChannel.close();
		    out.close();
		    return fileName;
		} catch (Exception e) {
			System.out.println("combineChunks() Failed to combine the chunks");
			e.printStackTrace();
			return null;
		}        
	}
	
	protected void deleteChunks(String name, Integer chunkIndex, Integer chunkNum, String chunkParentPath) {
		System.out.println("deleteChunks() name:" + name + " chunkIndex:" + chunkIndex  + " chunkNum:" + chunkNum + " chunkParentPath:" + chunkParentPath);
		
		if(null == chunkIndex || chunkIndex < (chunkNum-1))
		{
			return;
		}
		
		System.out.println("deleteChunks() name:" + name + " chunkIndex:" + chunkIndex  + " chunkNum:" + chunkNum + " chunkParentPath:" + chunkParentPath);
		try {
	        for(int i = 0; i < chunkNum; i ++)
	        {
	        	String chunkFilePath = chunkParentPath + name + "_" + i;
	        	delFile(chunkFilePath);
	    	}
		} catch (Exception e) {
			System.out.println("deleteChunks() Failed to combine the chunks");
			e.printStackTrace();
		}  
	}

	protected boolean isChunkMatched(String chunkFilePath, String chunkHash) {
		//检查文件是否存在
		File f = new File(chunkFilePath);
		if(!f.exists()){
			return false;
		}

		//Check if chunkHash is same
		try {
			FileInputStream file = new FileInputStream(chunkFilePath);
			String hash=DigestUtils.md5Hex(file);
			file.close();
			if(hash.equals(chunkHash))
			{
				return true;
			}
		} catch (Exception e) {
			System.out.println("isChunkMatched() Exception"); 
			e.printStackTrace();
			return false;
		}

		return false;
	}
	
	protected boolean checkFileSizeAndCheckSum(String localDocParentPath, String name, Long fileSize,
			String fileCheckSum) {
		File file = new File(localDocParentPath,name);
		if(fileSize != file.length())
		{
			System.out.println("checkFileSizeAndCheckSum() fileSize " + file.length() + "not match with ExpectedSize" + fileSize);
			return false;
		}
		return true;
	}
	
	protected boolean moveRealDoc(Repos repos, Doc srcDoc, Doc dstDoc, ReturnAjax rt) 
	{
		String reposRPath = getReposRealPath(repos);
		String srcParentPath = srcDoc.getPath();
		String srcName = srcDoc.getName();
		String dstParentPath = dstDoc.getPath();
		String dstName = dstDoc.getName();
		
		String srcDocPath = reposRPath + srcParentPath + srcName;
		String dstDocPath = reposRPath + dstParentPath + dstName;

		if(isFileExist(srcDocPath) == false)
		{
			docSysDebugLog("moveRealDoc() 文件: " + srcDocPath + " 不存在", rt);
			return false;
		}
		
		if(isFileExist(dstDocPath) == true)
		{
			docSysDebugLog("moveRealDoc() 文件: " + dstDocPath + " 已存在", rt);
			return false;
		}
		
		if(moveFileOrDir(reposRPath + srcParentPath,srcName,reposRPath + dstParentPath,dstName,true) == false)	//强制覆盖
		{
			docSysDebugLog("moveRealDoc() move " + srcDocPath + " to "+ dstDocPath + " Failed", rt);
			return false;
		}
		return true;
	}
	
	protected boolean copyRealDoc(Repos repos, Doc srcDoc, Doc dstDoc, ReturnAjax rt) 
	{
		String reposRPath = getReposRealPath(repos);
		String srcParentPath = srcDoc.getPath();
		String srcName = srcDoc.getName();
		String dstParentPath = dstDoc.getPath();
		String dstName = dstDoc.getName();
		
		String srcDocPath = reposRPath + srcParentPath + srcName;
		String dstDocPath = reposRPath + dstParentPath + dstName;

		if(isFileExist(srcDocPath) == false)
		{
			docSysDebugLog("copyRealDoc() 文件: " + srcDocPath + " 不存在", rt);
			return false;
		}
		
		if(isFileExist(dstDocPath) == true)
		{
			docSysDebugLog("copyRealDoc() 文件: " + dstDocPath + " 已存在", rt);
			return false;
		}
		

		if(false == copyFileOrDir(srcDocPath, dstDocPath, true))
		{
			docSysDebugLog("copyRealDoc copy " + srcDocPath + " to " + dstDocPath + " 失败", rt);
			return false;
		}
		return true;
	}

	//create Virtual Doc
	protected boolean createVirtualDoc(Repos repos, Doc doc, ReturnAjax rt) 
	{
		String content = doc.getContent();
		if(content == null || content.isEmpty())
		{
			System.out.println("createVirtualDoc() content is empty");
			return false;
		}
		
		String reposVPath = getReposVirtualPath(repos);
		
		String docVName = getVDocName(doc);
		
		String vDocPath = reposVPath + docVName;
		System.out.println("vDocPath: " + vDocPath);
		if(isFileExist(vDocPath) == true)
		{
			System.out.println("目录 " +vDocPath + "　已存在！");
			docSysDebugLog("目录 " +vDocPath + "　已存在！", rt);
			return false;
		}
			
		if(false == createDir(vDocPath))
		{
			docSysDebugLog("目录 " + vDocPath + " 创建失败！", rt);
			return false;
		}
		if(createDir(vDocPath + "/res") == false)
		{
			docSysDebugLog("目录 " + vDocPath + "/res" + " 创建失败！", rt);
			return false;
		}
		if(createFile(vDocPath,"content.md") == false)
		{
			docSysDebugLog("目录 " + vDocPath + "/content.md" + " 创建失败！", rt);
			return false;			
		}
		
		saveVirtualDocContent(reposVPath, doc, rt);
		return true;
	}
	
	protected boolean saveVirtualDocContent(String localParentPath, Doc doc, ReturnAjax rt) 
	{	
		String content = doc.getContent();
		if(content == null)
		{
			System.out.println("saveVirtualDocContent() content is null");
			return false;
		}

		String docVName = getVDocName(doc);
		
		String vDocPath = localParentPath + docVName + "/";
		File folder = new File(vDocPath);
		if(!folder.exists())
		{
			System.out.println("saveVirtualDocContent() vDocPath:" + vDocPath + " not exists!");
			if(folder.mkdir() == false)
			{
				docSysDebugLog("saveVirtualDocContent() mkdir vDocPath:" + vDocPath + " Failed!", rt);
				return false;
			}
		}
				
		//set the md file Path
		String mdFilePath = vDocPath + "content.md";
		//创建文件输入流
		FileOutputStream out = null;
		try {
			out = new FileOutputStream(mdFilePath);
		} catch (FileNotFoundException e) {
			System.out.println("saveVirtualDocContent() new FileOutputStream failed");
			docSysDebugLog(e.toString(), rt);
			return false;
		}
		try {
			out.write(content.getBytes(), 0, content.length());
			//关闭输出流
			out.close();
		} catch (IOException e) {
			System.out.println("saveVirtualDocContent() out.write exception");
			docSysDebugLog(e.toString(), rt);
			return false;
		}
		return true;
	}
	
	protected String readVirtualDocContent(String localParentPath, String vDocName) {
		
		String vDocPath = localParentPath + vDocName + "/";
		String mdFilePath = vDocPath + "content.md";

		try 
		{
				
			File file = new File(mdFilePath);
			if(!file.exists())
			{
				return null;
			}
			
			int fileSize = (int) file.length();
			byte buffer[] = new byte[fileSize];
	
			FileInputStream in;
				in = new FileInputStream(mdFilePath);
				in.read(buffer, 0, fileSize);
				in.close();
	
			
			String content = new String(buffer);
			return content;
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
	
	protected boolean deleteVirtualDoc(Repos repos, Doc doc, ReturnAjax rt) {
		String reposVPath = getReposVirtualPath(repos);
		String docVName = getVDocName(doc);
		
		String localDocVPath = reposVPath + docVName;
		if(delDir(localDocVPath) == false)
		{
			docSysDebugLog("deleteVirtualDoc() delDir失败 " + localDocVPath, rt);
			return false;
		}
		return true;
	}
	
	protected boolean moveVirtualDoc(Repos repos, Doc doc,Doc newDoc, ReturnAjax rt) 
	{
		String reposVPath = getReposVirtualPath(repos);
		
		String vDocName = getVDocName(doc);
		
		String newVDocName = getVDocName(newDoc);
				
		if(moveFileOrDir(reposVPath, vDocName, reposVPath, newVDocName, false) == false)
		{
			docSysDebugLog("moveVirtualDoc() moveFile " + reposVPath + vDocName+ " to " + reposVPath + newVDocName + " Failed", rt);
			return false;
		}
		return true;
	}
	
	protected boolean copyVirtualDoc(Repos repos, Doc doc,Doc newDoc, ReturnAjax rt) 
	{
		String reposVPath = getReposVirtualPath(repos);
		
		String vDocName = getVDocName(doc);
		
		String newVDocName = getVDocName(newDoc);
		
		String srcDocFullVPath = reposVPath + vDocName;
		String dstDocFullVPath = reposVPath + newVDocName;
		if(copyDir(srcDocFullVPath,dstDocFullVPath,false) == false)
		{
			docSysDebugLog("copyVirtualDoc() copyDir " + srcDocFullVPath +  " to " + dstDocFullVPath + " Failed", rt);
			return false;
		}
		return true;
	}
	
	//删除预览文件
	protected void deletePreviewFile(Doc doc) 
	{
		if(doc == null || doc.getCheckSum() == null)
		{
			return;
		}
		
		String dstName = doc.getVid() + "_" + doc.getDocId() + ".pdf";
		String dstPath = getWebTmpPath() + "preview/" + dstName;
		delFileOrDir(dstPath);
	}
	
	/*************** DocSys verRepos操作接口 *********************/
	protected List<LogEntry> verReposGetHistory(Repos repos,boolean isRealDoc, String entryPath, int maxLogNum) {
		if(repos.getVerCtrl() == 1)
		{
			return svnGetHistory(repos, isRealDoc, entryPath, maxLogNum);
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitGetHistory(repos, isRealDoc, entryPath, maxLogNum);
		}
		return null;
	}
	
	protected List<LogEntry> gitGetHistory(Repos repos, boolean isRealDoc, String docPath, int maxLogNum) {
		GITUtil gitUtil = new GITUtil();
		if(false == gitUtil.Init(repos, isRealDoc, null))
		{
			System.out.println("gitGetHistory() gitUtil.Init Failed");
			return null;
		}
		return gitUtil.getHistoryLogs(docPath, null, null, maxLogNum);
	}
	
	protected List<LogEntry> svnGetHistory(Repos repos,boolean isRealDoc, String docPath, int maxLogNum) {

		SVNUtil svnUtil = new SVNUtil();
		if(false == svnUtil.Init(repos, isRealDoc, null))
		{
			System.out.println("svnGetHistory() svnUtil.Init Failed");
			return null;
		}
		return svnUtil.getHistoryLogs(docPath, 0, -1, maxLogNum);
	}
	
	protected String verReposRealDocAdd(Repos repos, String parentPath,String entryName,Integer type,String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(commitMsg == null)
		{
			//commitMsg = "Add " + parentPath +  entryName;
			commitMsg = "新增 " + parentPath +  entryName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(repos, true, commitMsg, commitUser);
			return svnRealDocCommit(repos,parentPath,entryName,type,commitMsg,commitUser,rt);
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocAdd(repos,parentPath,entryName,type,commitMsg,commitUser,rt);
		}
		return null;
	}

	protected String svnRealDocCommit(Repos repos, String parentPath,String entryName,Integer type,String commitMsg, String commitUser, ReturnAjax rt) 
	{
		String remotePath = parentPath + entryName;
		String reposRPath = getReposRealPath(repos);
		
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("svnRealDocCommit() " + remotePath + " svnUtil.Init失败！");	
			return null;
		}
		
		return svnUtil.doAutoCommit(parentPath,entryName,reposRPath+parentPath,commitMsg,commitUser,true, null);
	}
	
	protected String gitRealDocAdd(Repos repos, String parentPath, String entryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		System.out.println("gitRealDocAdd() reposId:" + repos.getId() + " parentPath:" + parentPath + " entryName:" + entryName);
		if(entryName == null || entryName.isEmpty())
		{
			System.out.println("gitRealDocAdd() entryName can not be empty");
			return null;
		}
		
		//Do Commit
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitRealDocAdd() GITUtil Init failed");
			return null;
		}

		//Add to Doc to WorkingDirectory
		String docPath = getReposRealPath(repos) + parentPath + entryName;
		String wcDocPath = getLocalVerReposPath(repos, true) + parentPath + entryName;
		if(type == 1)
		{
			if(copyFile(docPath, wcDocPath, false) == false)
			{
				System.out.println("gitRealDocAdd() add File to WD error");					
				return null;
			}
		}
		else
		{
			//Add Dir
			File dir = new File(wcDocPath);
			if(dir.mkdir() == false)
			{
				System.out.println("gitRealDocAdd() add Dir to WD error");										
				return null;
			}
		}			
		
		//Commit will roll back WC if there is error
		return gitUtil.gitAdd(parentPath, entryName,commitMsg, commitUser);
	}
	
	protected String verReposRealDocDelete(Repos repos, String parentPath, String entryName,Integer type,
			String commitMsg, String commitUser, ReturnAjax rt) {	
		if(commitMsg == null)
		{
			//commitMsg = "Delete " + parentPath + entryName;
			commitMsg = "删除 " + parentPath + entryName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(repos, true, commitMsg, commitUser);
			return svnRealDocDelete(repos, parentPath, entryName, type, commitMsg, commitUser, rt);
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocDelete(repos, parentPath, entryName, type, commitMsg, commitUser, rt);
		}
		return null;
	}

	private String svnRealDocDelete(Repos repos, String parentPath, String name,Integer type,
			String commitMsg, String commitUser, ReturnAjax rt) {
		System.out.println("svnRealDocDelete() parentPath:" + parentPath + " name:" + name);

		String docRPath = parentPath + name;
		SVNUtil svnUtil = new SVNUtil();
		
		if(false == svnUtil.Init(repos, true, commitUser))
		{
			System.out.println("svnRealDocDelete() svnUtil.Init 失败！");
			return null;
		}
		
		if(svnUtil.doCheckPath(docRPath,-1) == true)	//如果仓库中该文件已经不存在，则不需要进行svnDeleteCommit
		{
			return svnUtil.svnDelete(parentPath,name,commitMsg,commitUser);
		}
		
		return "";
	}

	protected String verReposRealDocCommit(Repos repos, String parentPath, String entryName,Integer type,
			String commitMsg, String commitUser, ReturnAjax rt) {
		
		if(commitMsg == null)
		{
			//commitMsg = "Commit " + parentPath + entryName;
			commitMsg = "更新 " + parentPath + entryName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(repos, true, commitMsg, commitUser);
			return svnRealDocCommit(repos, parentPath, entryName, type, commitMsg, commitUser, rt);
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocCommit(repos, parentPath, entryName, type, commitMsg, commitUser, rt);
		}
		return null;
	}

	protected String verReposRealDocMove(Repos repos, String srcParentPath,String srcEntryName,
			String dstParentPath, String dstEntryName,Integer type, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(commitMsg == null)
		{
			//commitMsg = "Move " + srcParentPath + srcEntryName + " to " + dstParentPath + dstEntryName;
			commitMsg = "移动 " + srcParentPath + srcEntryName + " 到 " + dstParentPath + dstEntryName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(repos, true, commitMsg, commitUser);
			return svnRealDocCopy(repos, srcParentPath, srcEntryName, dstParentPath, dstEntryName, type, commitMsg, commitUser, rt, true);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocCopy(repos, srcParentPath, srcEntryName, dstParentPath, dstEntryName, type, commitMsg, commitUser, rt, true);
		}
		return null;
	}

	protected String verReposRealDocCopy(Repos repos, String srcParentPath, String srcEntryName,
			String dstParentPath, String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(commitMsg == null)
		{
			//commitMsg = "Copy " + srcParentPath + srcEntryName + " to " + dstParentPath + dstEntryName;
			commitMsg = "复制 " + srcParentPath + srcEntryName + " 到 " + dstParentPath + dstEntryName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(repos, true, commitMsg, commitUser);
			return svnRealDocCopy(repos, srcParentPath, srcEntryName, dstParentPath, dstEntryName, type, commitMsg, commitUser, rt, false);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocCopy(repos, srcParentPath, srcEntryName, dstParentPath, dstEntryName, type, commitMsg, commitUser, rt, false);
		}
		return null;
	}
	
	protected List<Doc> verReposCheckOut(Repos repos, boolean isRealDoc, String parentPath, String entryName, String localParentPath, String targetName, String commitId, boolean force) {
		Doc doc = new Doc();
		doc.setVid(repos.getId());
		doc.setPath(parentPath);
		doc.setName(entryName);
		if(repos.getVerCtrl() == 1)
		{
			long revision = -1;
			if(commitId != null)
			{
				revision = Long.parseLong(commitId);
			}
			return svnCheckOut(repos, isRealDoc, doc, localParentPath, targetName, revision, force);		
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitCheckOut(repos, isRealDoc, doc, localParentPath, targetName, commitId);
		}
		return null;
	}
	
	protected String verReposVirtualDocAdd(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) 
	{	
		if(commitMsg == null)
		{
			//commitMsg = "Add " + docVName;
			commitMsg = "新增 " + docVName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(repos, false, commitMsg, commitUser);
			return svnVirtualDocAdd(repos, docVName, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocAdd(repos, docVName, commitMsg, commitUser, rt);
		}
		return null;
	}
	
	protected String verReposVirtualDocDelete(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(commitMsg == null)
		{
			//commitMsg = "Delete " + docVName;
			commitMsg = "删除 " + docVName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(repos, false, commitMsg, commitUser);
			return svnVirtualDocDelete(repos, docVName, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocDelete(repos, docVName, commitMsg, commitUser, rt);
		}
		return null;
	}

	protected String verReposVirtualDocCommit(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) {
		if(commitMsg == null)
		{
			//commitMsg = "Commit " + docVName;
			commitMsg = "更新 " + docVName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(repos, false, commitMsg, commitUser);
			return svnVirtualDocCommit(repos, docVName, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocCommit(repos, docVName, commitMsg, commitUser, rt);
		}
		return null;
	}

	protected String verReposVirtualDocMove(Repos repos, String srcDocVName,String dstDocVName, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(commitMsg == null)
		{
			//commitMsg = "Move " + srcDocVName + " to " + dstDocVName;
			commitMsg = "移动 " + srcDocVName + " 到 " + dstDocVName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(repos, false, commitMsg, commitUser);
			return svnVirtualDocMove(repos, srcDocVName,dstDocVName, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocMove(repos, srcDocVName,dstDocVName, commitMsg, commitUser, rt);
		}
		return null;
	}

	protected String verReposVirtualDocCopy(Repos repos,String srcDocVName,String dstDocVName,String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(commitMsg == null)
		{
			//commitMsg = "Copy " + srcDocVName + " to " + dstDocVName;
			commitMsg = "复制 " + srcDocVName + " 到 " + dstDocVName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(repos, false, commitMsg, commitUser);
			return svnVirtualDocCopy(repos, srcDocVName, dstDocVName, commitMsg, commitUser, rt);		
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocCopy(repos, srcDocVName, dstDocVName, commitMsg, commitUser, rt);
		}
		return null;
	}
	
	//Git realDoc Delete
	protected String gitRealDocDelete(Repos repos, String parentPath, String entryName, Integer type, String commitMsg,String commitUser, ReturnAjax rt) 
	{
		System.out.println("gitRealDocDelete() reposId:" + repos.getId() + " parentPath:" + parentPath + " entryName:" + entryName);
		if(entryName == null || entryName.isEmpty())
		{
			System.out.println("gitRealDocDelete() entryName can not be empty");
			return null;
		}

		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitRealDocDelete() GITUtil Init failed");
			return null;
		}
		
		//Add to Doc to WorkingDirectory
		String wcDocPath = getLocalVerReposPath(repos, true) + parentPath + entryName;
		if(delFileOrDir(wcDocPath) == false)
		{
			System.out.println("gitRealDocDelete() delete working copy failed");
			return null;
		}
			
		return gitUtil.Commit(parentPath, entryName,commitMsg, commitUser);
	}
	
	protected String gitRealDocCommit(Repos repos, String parentPath, String entryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		System.out.println("gitRealDocCommit() reposId:" + repos.getId() + " parentPath:" + parentPath + " entryName:" + entryName);
		if(entryName == null || entryName.isEmpty())
		{
			System.out.println("gitRealDocCommit() entryName can not be empty");
			return null;
		}

		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitRealDocCommit() GITUtil Init failed");
			return null;
		}
	
		//Copy to Doc to WorkingDirectory
		String docPath = getReposRealPath(repos) + parentPath + entryName;
		String wcDocPath = getLocalVerReposPath(repos, true) + parentPath + entryName;
		if(type == 1)
		{
			if(copyFile(docPath, wcDocPath, true) == false)
			{
				System.out.println("gitRealDocCommit() copy File to working directory failed");					
				return null;
			}
		}
		else
		{
			System.out.println("gitRealDocCommit() dir can not modify");
			return null;
		}			
				
		//Commit will roll back WC if there is error
		return gitUtil.Commit(parentPath, entryName,commitMsg, commitUser);
	}
	
	protected String gitRealDocCopy(Repos repos, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt, boolean isMove) {
		
		if(isMove)
		{
			return gitDocMove(repos, true, srcParentPath, srcEntryName, dstParentPath, dstEntryName,  commitMsg, commitUser, rt);
		}
		
		return  gitDocCopy(repos, true, srcParentPath, srcEntryName, dstParentPath, dstEntryName,  commitMsg, commitUser, rt);
	}
	
	protected String gitDocMove(Repos repos, boolean isRealDoc, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		System.out.println("gitDocMove() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
		
		if(srcEntryName == null || srcEntryName.isEmpty())
		{
			System.out.println("gitDocMove() srcEntryName can not be empty");
			return null;
		}
		
		if(dstEntryName == null || dstEntryName.isEmpty())
		{
			System.out.println("gitDocMove() dstEntryName can not be empty");
			return null;
		}
		
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitDocMove() GITUtil Init failed");
			return null;
		}
	
		//Do move at Working Directory
		String wcSrcDocParentPath = getLocalVerReposPath(repos, isRealDoc) + srcParentPath;
		String wcDstParentDocPath = getLocalVerReposPath(repos, isRealDoc) + dstParentPath;	
		if(moveFileOrDir(wcSrcDocParentPath, srcEntryName,wcDstParentDocPath, dstEntryName,false) == false)
		{
			System.out.println("gitDocMove() moveFileOrDir Failed");					
			return null;
		}
				
		//Commit will roll back WC if there is error
		return gitUtil.gitMove(srcParentPath, srcEntryName, dstParentPath, dstEntryName, commitMsg, commitUser);
	}
	
	protected String gitDocCopy(Repos repos, boolean isRealDoc, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		System.out.println("gitDocCopy() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
		
		if(srcEntryName == null || srcEntryName.isEmpty())
		{
			System.out.println("gitDocCopy() srcEntryName can not be empty");
			return null;
		}

		if(dstEntryName == null || dstEntryName.isEmpty())
		{
			System.out.println("gitDocCopy() dstEntryName can not be empty");
			return null;
		}
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitDocCopy() GITUtil Init failed");
			return null;
		}
	
		//Do move at Working Directory
		String wcSrcDocParentPath = getLocalVerReposPath(repos, isRealDoc) + srcParentPath;
		String wcDstParentDocPath = getLocalVerReposPath(repos, isRealDoc) + dstParentPath;	
		if(copyFileOrDir(wcSrcDocParentPath+srcEntryName,wcDstParentDocPath+dstEntryName,false) == false)
		{
			System.out.println("gitDocCopy() moveFileOrDir Failed");					
			return null;
		}
				
		//Commit will roll back WC if there is error
		return gitUtil.gitCopy(srcParentPath, srcEntryName, dstParentPath, dstEntryName, commitMsg, commitUser);
	}

	protected List<Doc> gitCheckOut(Repos repos, boolean isRealDoc, Doc doc, String localParentPath, String targetName, String revision) 
	{
		String parentPath = doc.getPath();
		String entryName = doc.getName();
		
		System.out.println("gitCheckOut() parentPath:" + parentPath + " entryName:" + entryName + " localParentPath:" + localParentPath + " revision:" + revision);
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, null) == false)
		{
			System.out.println("gitCheckOut() GITUtil Init failed");
			return null;
		}
		
		return gitUtil.getEntry(doc, localParentPath, targetName, revision);
	}
		
	protected String gitVirtualDocAdd(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(docVName == null || docVName.isEmpty())
		{
			System.out.println("gitVirtualDocAdd() entryName can not be empty");
			return null;
		}
		
		//Do Commit
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, false, commitUser) == false)
		{
			System.out.println("gitVirtualDocAdd() GITUtil Init failed");
			return null;
		}

		//Commit will roll back WC if there is error
		String localPath = getReposVirtualPath(repos);		
		return gitUtil.doAutoCommit("", docVName, localPath,commitMsg, commitUser, true, null);
	}
	
	protected String gitVirtualDocDelete(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(docVName == null || docVName.isEmpty())
		{
			System.out.println("gitVirtualDocDelete() docVName can not be empty");
			return null;
		}

		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, false, commitUser) == false)
		{
			System.out.println("gitVirtualDocDelete() GITUtil Init failed");
			return null;
		}
		
		//Add to Doc to WorkingDirectory
		String wcDocPath = getLocalVerReposPath(repos, false) + docVName;
		if(delDir(wcDocPath) == false)
		{
			System.out.println("gitVirtualDocDelete() delete working copy failed");
			return null;
		}
			
		return gitUtil.Commit("", docVName,commitMsg, commitUser);
	}
	
	protected String gitVirtualDocCommit(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		System.out.println("gitVirtualDocCommit() reposId:" + repos.getId() + " docVName:" + docVName);

		if(docVName == null || docVName.isEmpty())
		{
			System.out.println("gitVirtualDocCommit() entryName can not be empty");
			return null;
		}

		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, false, commitUser) == false)
		{
			System.out.println("gitVirtualDocCommit() GITUtil Init failed");
			return null;
		}
	
				
		//Commit will roll back WC if there is error
		String localPath = getReposVirtualPath(repos);		
		return gitUtil.doAutoCommit("", docVName, localPath,commitMsg, commitUser, true, null);
	}

	protected String gitVirtualDocMove(Repos repos, String srcDocVName, String dstDocVName, String commitMsg,String commitUser, ReturnAjax rt) 
	{
		return gitDocMove(repos, false, "", srcDocVName, "", dstDocVName, commitMsg, commitUser, rt);
	}
	
	protected String gitVirtualDocCopy(Repos repos, String srcDocVName, String dstDocVName, String commitMsg,String commitUser, ReturnAjax rt) 
	{
		return  gitDocCopy(repos, false, "", srcDocVName, "", dstDocVName,  commitMsg, commitUser, rt);
	}
	
	protected String svnCopy(Repos repos, boolean isRealDoc, String srcParentPath, String srcEntryName, String dstParentPath,String dstEntryName, 
			String commitMsg, String commitUser, ReturnAjax rt, boolean isMove) 
	{
		SVNUtil svnUtil = new SVNUtil();
		if(false == svnUtil.Init(repos, isRealDoc, commitUser))
		{
			System.out.println("svnCopy() svnUtil.Init Failed: srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath+ " dstEntryName:" + dstEntryName);
			return null;
		}
		
		String revision = svnUtil.svnCopy(srcParentPath, srcEntryName, dstParentPath, dstEntryName, commitMsg, commitUser, isMove);
		if(revision == null)
		{
			docSysDebugLog("svnCopy() svnUtil.svnCopy Failed: " + " srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath+ " dstEntryName:" + dstEntryName, rt);
		}
		return revision;
	}

	protected String svnRealDocCopy(Repos repos, String srcParentPath, String srcEntryName,
			String dstParentPath, String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt, boolean isMove) {
		
		System.out.println("svnRealDocCopy() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
			
		String revision = svnCopy(repos, true, srcParentPath,srcEntryName,dstParentPath,dstEntryName,commitMsg,commitUser,rt, isMove);
		
		if(revision == null)
		{
			System.out.println("文件: " + srcEntryName + " svnCopy失败");
		}
		return revision;
	}

	protected List<Doc> svnCheckOut(Repos repos, boolean isRealDoc, Doc doc, String localParentPath,String targetName,long revision, boolean force) 
	{
		System.out.println("svnCheckOut() parentPath:" + doc.getPath() + " entryName:" + doc.getName() + " localParentPath:" + localParentPath + " revision:" + revision);
		
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, isRealDoc, null) == false)
		{
			System.out.println("svnCheckOut() svnUtil Init Failed");
			return null;
		}

		int level = getLevelByParentPath(doc.getPath());
		return svnUtil.getEntry(doc, level, localParentPath, targetName, revision, force);
	}
	

	protected String svnVirtualDocAdd(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) {
		
		System.out.println("svnVirtualDocAdd() docVName:" + docVName);
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, false, commitUser) == false)
		{
			docSysDebugLog("svnVirtualDocAdd() svnUtil Init Failed!", rt);
			return null;
		}
		
		String reposVPath =  getReposVirtualPath(repos);
		
		//modifyEnable set to false
		String revision = svnUtil.doAutoCommit("",docVName,reposVPath,commitMsg,commitUser,false,null);
		if(revision == null)
		{
			docSysDebugLog("doAutoCommit失败！" + " docVName:" + docVName + " reposVPath:" + reposVPath, rt);
		}
		return revision;
	}

	protected String svnVirtualDocDelete(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) {
		System.out.println("svnVirtualDocDelete() docVName:" + docVName);
		SVNUtil svnUtil = new SVNUtil();
		if(false == svnUtil.Init(repos, false, commitUser))
		{
			docSysDebugLog("svnVirtualDocDelete()  svnUtil.Init 失败！", rt);
			return null;
		}
		
		if(svnUtil.doCheckPath(docVName,-1) == true)	//如果仓库中该文件已经不存在，则不需要进行svnDeleteCommit
		{
			String revision = svnUtil.svnDelete("",docVName,commitMsg,commitUser);
			if(revision == null)
			{
				docSysDebugLog("svnVirtualDocDelete() svnUtil.svnDelete "  + docVName +" 失败 ", rt);
			}
			return revision;
		}
		return null;
	}

	protected String svnVirtualDocCommit(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) {
		System.out.println("svnVirtualDocCommit() docVName:" + docVName);
		String reposVPath =  getReposVirtualPath(repos);
		
		SVNUtil svnUtil = new SVNUtil();
		if(false == svnUtil.Init(repos, false, commitUser))
		{
			docSysDebugLog("svnVirtualDocCommit()  svnUtil.Init 失败！", rt);
			return null;
		}
		
		String revision = svnUtil.doAutoCommit("",docVName,reposVPath,commitMsg,commitUser,true,null);
		if(revision == null)
		{
			System.out.println("svnVirtualDocCommit() " + docVName + " doCommit失败！");
			docSysDebugLog(" doCommit失败！" + " docVName:" + docVName + " reposVPath:" + reposVPath, rt);
			return null;
		}
		
		return revision;
	}

	protected String svnVirtualDocMove(Repos repos, String srcDocVName,String dstDocVName, String commitMsg, String commitUser, ReturnAjax rt) {
		System.out.println("svnVirtualDocMove() srcDocVName:" + srcDocVName + " dstDocVName:" + dstDocVName);
		String revision = svnCopy(repos, false,"",srcDocVName,"",dstDocVName,commitMsg,commitUser, rt, true);
		
		if(revision == null)
		{
			docSysDebugLog("svnVirtualDocMove() svnMove Failed！", rt);
		}
		return revision;
	}

	protected String svnVirtualDocCopy(Repos repos,String srcDocVName,String dstDocVName,String commitMsg, String commitUser, ReturnAjax rt) {

		System.out.println("svnVirtualDocCopy() srcDocVName:" + srcDocVName + " dstDocVName:" + dstDocVName);			
		return svnCopy(repos, false, "",srcDocVName,"",dstDocVName,commitMsg,commitUser,rt, false);
	}
	
	protected String commitMsgFormat(Repos repos, boolean isRealDoc, String commitMsg, String commitUser) 
	{
		if(isRealDoc)
		{
			if(repos.getSvnUser() == null || repos.getSvnUser().isEmpty())
			{
				return commitMsg;
			}
		}
		else
		{
			if(repos.getSvnUser1() == null  || repos.getSvnUser1().isEmpty())
			{
				return commitMsg;
			}	
		}
		
		commitMsg = commitMsg + " [" + commitUser + "] ";
		return commitMsg;
	}
	
	protected Integer convertSVNNodeKindToEntryType(SVNNodeKind nodeKind) {
		if(nodeKind == SVNNodeKind.NONE) 
		{
			return 0;
		}
		else if(nodeKind == SVNNodeKind.FILE)
		{
			return 1;
		}
		else if(nodeKind == SVNNodeKind.DIR)
		{
			return 2;
		}
		return -1;
	}

	protected HashMap<String,Doc> BuildHashMapByDocList(List<Doc> docList) {
		HashMap<String,Doc> hashMap = new HashMap<String,Doc>();
		for(int i=0;i<docList.size();i++)
		{
			Doc doc = docList.get(i);
			String docName = doc.getName();
			hashMap.put(docName, doc);			
		}		
		return hashMap;
	}
	
	protected String verReposAutoCommit(Repos repos,boolean isRealDoc,String parentPath, String entryName, String localRootPath, 
			String commitMsg, String commitUser,boolean modifyEnable,String localRefRootPath) 
	{
		System.out.println("verReposAutoCommit() isRealDoc:" + isRealDoc + " parentPath:" + parentPath + " entryName:" + entryName + " localRootPath:" + localRootPath);
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
			return svnAutoCommit(repos,isRealDoc,parentPath, entryName, localRootPath, commitMsg,commitUser,modifyEnable,localRefRootPath);
		}
		else if(verCtrl == 2)
		{
			
			return gitAutoCommit(repos,isRealDoc,parentPath, entryName, localRootPath, commitMsg,commitUser,modifyEnable,localRefRootPath);			
		}
		return null;
	}
	
	protected String gitAutoCommit(Repos repos,boolean isRealDoc,String parentPath, String entryName, String localRootPath, 
			String commitMsg, String commitUser, boolean modifyEnable, String localRefRootPath) 
	{
		System.out.println("gitAutoCommit() reposId:" + repos.getId() + " isRealDoc:" + isRealDoc + " parentPath:" + parentPath + " entryName:" + entryName);
		
		GITUtil gitUtil = new GITUtil();
		//svn初始化
		if(gitUtil.Init(repos, isRealDoc, commitUser) == false)
		{
			System.out.println("gitAutoCommit() do Init Failed");
			return null;
		}
		
		return gitUtil.doAutoCommit(parentPath,entryName,localRootPath,commitMsg,commitUser,modifyEnable,localRefRootPath);
	}

	//Commit the localPath to svnPath
	protected String svnAutoCommit(Repos repos,boolean isRealDoc,String parentPath, String entryName, String localRootPath, 
			String commitMsg, String commitUser,boolean modifyEnable,String localRefRootPath)
	{			
		SVNUtil svnUtil = new SVNUtil();
		//svn初始化
		if(svnUtil.Init(repos,isRealDoc,commitUser) == false)
		{
			System.out.println("do Init Failed");
			return null;
		}
		
		return svnUtil.doAutoCommit(parentPath,entryName,localRootPath,commitMsg,commitUser,modifyEnable,localRefRootPath);
	}

    /************************* DocSys全文搜索操作接口 ***********************************/
	protected static String getIndexLibName(Integer reposId, int indexLibType) 
	{
		String indexLib = null;
		switch(indexLibType)
		{
		case 0:
			indexLib = "repos_" + reposId + "_DocName";
			break;
		case 1:
			indexLib = "repos_" + reposId + "_RDoc";
			break;
		case 2:
			indexLib = "repos_" + reposId + "_VDoc";
			break;
		}
		return indexLib;
	}
	
	//Add Index For DocName
	public boolean addIndexForDocName(Repos repos, Doc doc, ReturnAjax rt)
	{
		System.out.println("addIndexForDocName() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		String indexLib = getIndexLibName(repos.getId(),0);

		return LuceneUtil2.addIndex(doc, getDocPath(doc), indexLib);
	}

	//Delete Indexs For DocName
	public static boolean deleteIndexForDocName(Repos repos, Doc doc, ReturnAjax rt)
	{
		System.out.println("deleteIndexForDocName() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		String indexLib = getIndexLibName(repos.getId(),0);

		return LuceneUtil2.deleteIndex(doc, indexLib);
	}
		
	//Update Index For DocName
	public static boolean updateIndexForDocName(Repos repos, Doc doc, Doc newDoc, ReturnAjax rt)
	{
		System.out.println("updateIndexForDocName() docId:" +  doc.getDocId() + " parentPath:" +  doc.getPath()  + " name:" + doc.getName()  + " newParentPath:" + newDoc.getPath() + " newName:" + newDoc.getName() + " repos:" + repos.getName());

		String indexLib = getIndexLibName(repos.getId(),0);

		String name = doc.getName();
		String newName = newDoc.getName();
		String parentPath = doc.getPath();
		String newParentPath = newDoc.getPath();
		if(name.equals(newName) && parentPath.equals(newParentPath))
		{
			System.out.println("updateIndexForDocName() Doc not Changed docId:" + doc.getDocId() + " parentPath:" + parentPath + " name:" + name + " newParentPath:" + newParentPath + " newName:" + newName);			
			return true;
		}
		
		LuceneUtil2.deleteIndex(doc, indexLib);

		String content = newParentPath + newName;
		return LuceneUtil2.addIndex(newDoc, content.trim(), indexLib);
	}

	//Add Index For VDoc
	public boolean addIndexForVDoc(Repos repos, Doc doc)
	{
		System.out.println("addIndexForVDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());

		String content = doc.getContent();
		if(content == null)
		{
			String reposVPath = getReposVirtualPath(repos);
			String VDocName = getVDocName(doc);
			content = readVirtualDocContent(reposVPath, VDocName);
		}
		
		String indexLib = getIndexLibName(repos.getId(),2);
		
		return LuceneUtil2.addIndex(doc, content.toString().trim(), indexLib);
	}
	
	//Delete Indexs For VDoc
	public static boolean deleteIndexForVDoc(Repos repos, Doc doc)
	{
		System.out.println("deleteIndexForVDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		String indexLib = getIndexLibName(repos.getId(),2);
		
		return LuceneUtil2.deleteIndex(doc, indexLib);
	}
	
	//Update Index For VDoc
	public boolean updateIndexForVDoc(Repos repos, Doc doc)
	{
		System.out.println("updateIndexForVDoc() docId:" +  doc.getDocId() + " parentPath:" +  doc.getPath()  + " name:" + doc.getName() + " repos:" + repos.getName());

		String indexLib = getIndexLibName(repos.getId(),2);
		
		String content = doc.getContent();
		if(content == null)
		{
			String reposVPath = getReposVirtualPath(repos);
			String VDocName = getVDocName(doc);
			content = readVirtualDocContent(reposVPath, VDocName);
		}		
		
		LuceneUtil2.deleteIndex(doc, indexLib);

		return LuceneUtil2.addIndex(doc, content.trim(), indexLib);
	}
		
	//Add Index For RDoc
	public static boolean addIndexForRDoc(Repos repos, Doc doc)
	{		
		System.out.println("addIndexForRDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		String indexLib = getIndexLibName(repos.getId(), 1);

		String localRootPath = getReposRealPath(repos);
		String localParentPath = localRootPath + doc.getPath();
		String filePath = localParentPath + doc.getName();
				
		File file =new File(filePath);
		if(!file.exists())
		{
			System.out.println("addIndexForRDoc() " + filePath + " 不存在");
			return false;
		}
		
		if(file.isDirectory())
		{
			System.out.println("addIndexForRDoc() isDirectory");
			return false; //LuceneUtil2.addIndex(LuceneUtil2.buildDocumentId(hashId,0), reposId, docId, parentPath, name, hashId, "", indexLib);
		}
		
		if(file.length() == 0)
		{
			System.out.println("addIndexForRDoc() fileSize is 0");
			return false; //LuceneUtil2.addIndex(LuceneUtil2.buildDocumentId(hashId,0), reposId, docId, parentPath, name, hashId, "", indexLib);
		}
		
		//According the fileSuffix to confirm if it is Word/Execl/ppt/pdf
		String fileSuffix = getFileSuffix(doc.getName());
		if(fileSuffix != null)
		{
			switch(fileSuffix)
			{
			case "doc":
				return LuceneUtil2.addIndexForWord(filePath, doc, indexLib);
			case "docx":
				return LuceneUtil2.addIndexForWord2007(filePath, doc, indexLib);
			case "xls":
				return LuceneUtil2.addIndexForExcel(filePath, doc, indexLib);
			case "xlsx":
				return LuceneUtil2.addIndexForExcel2007(filePath, doc, indexLib);
			case "ppt":
				return LuceneUtil2.addIndexForPPT(filePath, doc, indexLib);
			case "pptx":
				return LuceneUtil2.addIndexForPPT2007(filePath, doc, indexLib);
			case "pdf":
				return LuceneUtil2.addIndexForPdf(filePath, doc, indexLib);
			case "txt":
			case "log":
			case "md":
				return LuceneUtil2.addIndexForFile(filePath, doc, indexLib);
			}
		}
		return false;
	}

	public static boolean deleteIndexForRDoc(Repos repos, Doc doc)
	{
		System.out.println("deleteIndexForRDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		String indexLib = getIndexLibName(repos.getId(), 1);
			
		return LuceneUtil2.deleteIndex(doc,indexLib);
	}
	
	//Update Index For RDoc
	public static boolean updateIndexForRDoc(Repos repos, Doc doc)
	{
		System.out.println("updateIndexForRDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());		
		deleteIndexForRDoc(repos, doc);
		return addIndexForRDoc(repos, doc);
	}
	
	/****************************DocSys其他接口 *********************************/
	protected Integer getMaxFileSize() {
		// TODO Auto-generated method stub
		return null;
	}
	
	//获取当前登录用户信息
	protected User getCurrentUser(HttpSession session){
		User user = (User) session.getAttribute("login_user");
		System.out.println("get sessionId:"+session.getId());
		return user;
	}
	
	public static String getEmailProps(Object obj,String pName){
		Properties props = new Properties();
		String basePath = obj.getClass().getClassLoader().getResource("/").getPath();
		File config = new File(basePath+"emailConfig.properties");
		try {
			InputStream in = new FileInputStream(config);
			props.load(in);
			String pValue = (String) props.get(pName);
			return pValue;
		} catch (Exception e) {
			System.out.println("获取emailConfig.properties失败");
			return null;
		}	
	}
	
	Doc getDocByName(String name, Long parentId, Integer reposId)
	{
		Doc qdoc = new Doc();
		qdoc.setName(name);
		qdoc.setPid(parentId);
		qdoc.setVid(reposId);
		List <Doc> docList = reposService.getDocList(qdoc);
		if(docList != null && docList.size() > 0)
		{
			return docList.get(0);
		}
		return null;
	}
}
