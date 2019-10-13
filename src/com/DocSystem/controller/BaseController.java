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
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Properties;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.digest.DigestUtils;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;
import org.tmatesoft.svn.core.SVNDirEntry;
import org.tmatesoft.svn.core.SVNNodeKind;

import util.ReturnAjax;

import com.DocSystem.common.BaseFunction;
import com.DocSystem.common.CommitAction;
import com.DocSystem.common.CommonAction;
import com.DocSystem.common.HitDoc;
import com.DocSystem.common.UniqueAction;
import com.DocSystem.entity.ChangedItem;
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
	protected List<Doc> getAccessableSubDocList(Repos repos, Doc doc, DocAuth docAuth, HashMap<Long, DocAuth> docAuthHashMap, ReturnAjax rt, List<CommonAction> actionList) 
	{	
		System.out.println("getAccessableSubDocList() " + doc.getDocId() + " " + doc.getPath() + doc.getName() );
						
		List<Doc> docList = getAuthedSubDocList(repos, doc, docAuth, docAuthHashMap, rt, actionList);
	
		if(docList != null)
		{
			Collections.sort(docList);
		
			printObject("getAccessableSubDocList() docList:", docList);
		}
		
		addDocToSyncUpList(actionList, repos, doc);
		
		return docList;
	}
	
	protected boolean checkDocLocked(Integer reposId, Doc doc, User login_user, boolean subDocCheckFlag) 
	{	
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
	protected List<Doc> getAuthedSubDocList(Repos repos, Doc doc, DocAuth pDocAuth, HashMap<Long, DocAuth> docAuthHashMap, ReturnAjax rt, List<CommonAction> actionList)
	{
		List<Doc> docList = new ArrayList<Doc>();
		List<Doc> tmpDocList = docSysGetSubDocList(repos, doc);

		if(tmpDocList != null)
    	{
	    	for(int i=0;i<tmpDocList.size();i++)
	    	{
	    		Doc dbDoc = tmpDocList.get(i);
	    		
	    		DocAuth docAuth = getDocAuthFromHashMap(dbDoc.getDocId(), pDocAuth,docAuthHashMap);
				if(docAuth != null && docAuth.getAccess()!=null && docAuth.getAccess() == 1)
				{
		    		//Add to docList
		    		docList.add(dbDoc);
				}
	    	}
    	}
		return docList;
	}

	private List<Doc> getDBEntryList(Repos repos, Doc doc) {
		Doc qDoc = new Doc();
		qDoc.setVid(repos.getId());
		qDoc.setPid(doc.getDocId());
		return reposService.getDocList(qDoc);
	}

	private List<Doc> getLocalEntryList(Repos repos, Doc doc) 
	{
		//System.out.println("getLocalEntryList() " + doc.getDocId() + " " + doc.getPath() + doc.getName());
    	
		String localRootPath = getReposRealPath(repos);
		String localVRootPath = getReposVirtualPath(repos);
		
		String docName = doc.getName();
		if(doc.getDocId() == 0)
		{
			docName = "";
		}

		File dir = new File(localRootPath + doc.getPath() + docName);
    	if(false == dir.exists())
    	{
    		System.out.println("getLocalEntryList() " + doc.getPath() + docName + " 不存在！");
    		return null;
    	}
    	
    	if(dir.isFile())
    	{
    		System.out.println("getLocalEntryList() " + doc.getPath() + docName + " 不是目录！");
    		return null;
    	}

		String subDocParentPath = doc.getPath() + docName + "/";
		if(docName.isEmpty())
		{
			subDocParentPath = doc.getPath();
		}
		
		Integer subDocLevel = getSubDocLevel(doc);
    	
        //Go through the subEntries
    	List <Doc> subEntryList =  new ArrayList<Doc>();
    	
    	File[] localFileList = dir.listFiles();
    	for(int i=0;i<localFileList.length;i++)
    	{
    		File file = localFileList[i];
    		
    		int type = file.isDirectory()? 2:1;
    		String name = file.getName();
    		//System.out.println("getLocalEntryList subFile:" + name);

    		Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(), subDocParentPath, name, subDocLevel, type, true, localRootPath, localVRootPath, file.length(), "");
    		subDoc.setSize(file.length());
    		subDoc.setLatestEditTime(file.lastModified());
    		subDoc.setCreateTime(file.lastModified());
    		subEntryList.add(subDoc);
    	}
    	return subEntryList;
	}
    	

	private Integer getSubDocLevel(Doc doc) {
		if(doc.getLevel() == null)
		{
			return null;
		}
		return doc.getLevel() + 1;
	}

	private Integer getParentDocLevel(Doc doc) {
		if(doc.getLevel() == null)
		{
			return null;
		}
		return doc.getLevel() - 1;
	}

	private List<Doc> getRemoteEntryList(Repos repos, Doc doc) {
		//System.out.println("getRemoteEntryList() " + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "]");

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
			return svnUtil.getDocList(repos, doc, svnRevision); 
		case 2:	//GIT
			
			GITUtil gitUtil = new GITUtil();
			if(false == gitUtil.Init(repos, true, null))
			{
				System.out.println("getRemoteEntryList() gitUtil.Init Failed");
				return null;
			}
			
			String gitRevision = null;
			
			//Get list from verRepos
			return gitUtil.getDocList(repos, doc, gitRevision); 
		}
		return null;
	}

	protected boolean isDirLocalChanged(Repos repos, Doc doc) 
	{
		HashMap<String, Doc> docHashMap = new HashMap<String, Doc>();	//the doc already scanned
		
		Doc subDoc = null;
		List<Doc> dbDocList = getDBEntryList(repos, doc);
		printObject("isDirLocalChanged() dbEntryList:", dbDocList);
	   	if(dbDocList != null)
    	{
	    	for(int i=0;i<dbDocList.size();i++)
	    	{
	    		subDoc = dbDocList.get(i);
	    		docHashMap.put(subDoc.getName(), subDoc);
	    		
	    		Doc subLocalEntry = fsGetDoc(repos, doc);
	    		printObject("isDirLocalChanged() localEntry: ", subLocalEntry);
	    		if(subLocalEntry.getType() == 0)
	    		{
	    			System.out.println("isDirLocalChanged() local Doc Deleted: " + subDoc.getDocId() + " " + doc.getPath() + doc.getName());
	    			return true;
	    		}
	    		
	    		if(!subLocalEntry.getType().equals(subDoc.getType()))
	    		{
	    			System.out.println("isDirLocalChanged() local Doc Type Changed: " + subDoc.getDocId() + " " + doc.getPath() + doc.getName());
	    			return true;
	    		}
	    		
	    		if(subDoc.getType() == 2)
	    		{
	    			if(isDirLocalChanged(repos, subDoc))
	    			{
	    				return true;
	    			}
	    			continue;
	    		}
	    		
	    		if(isDocLocalChanged(subDoc, subLocalEntry))
	    		{
	    			System.out.println("isDirLocalChanged() local Doc Content Changed: " + subDoc.getDocId() + " " + doc.getPath() + doc.getName());
	    			return true;
	    		}
	    	}
    	}

    	List<Doc> localEntryList = getLocalEntryList(repos, doc);
		printObject("isDirLocalChanged() localEntryList:", localEntryList);
		if(localEntryList != null)
    	{
	    	for(int i=0;i<localEntryList.size();i++)
	    	{
	    		subDoc = localEntryList.get(i);
	    		if(docHashMap.get(subDoc.getName()) != null)
	    		{
	    			//already scanned
	    			continue;	
	    		}
	    		
	    		//local Added
    			System.out.println("isDirLocalChanged() local Doc Added: " + subDoc.getDocId() + " " + doc.getPath() + doc.getName());
	    		return true;
	    	}
    	}
		
		return false;
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
	
	private boolean isDocRemoteChanged(Repos repos, Doc doc, Doc remoteEntry) 
	{
		if(repos.getVerCtrl() == 0)
		{
			return false;
		}
		
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
	protected List<Doc> getDocListFromRootToDoc(Repos repos, Doc doc, DocAuth rootDocAuth,  HashMap<Long, DocAuth> docAuthHashMap, ReturnAjax rt, List<CommonAction> actionList)
	{
		System.out.println("getDocListFromRootToDoc() reposId:" + repos.getId() + " parentPath:" + doc.getPath() +" docName:" + doc.getName());
		
		Doc rootDoc = buildBasicDoc(repos.getId(), 0L, -1L, "", "", 0, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
		
		List<Doc> resultList = getAccessableSubDocList(repos, rootDoc, rootDocAuth, docAuthHashMap, rt, actionList);	//get subDocList under root
		addDocToSyncUpList(actionList, repos, rootDoc);
		if(resultList == null || resultList.size() == 0)
		{
			System.out.println("getDocListFromRootToDoc() docList under root is empty");			
			return null;
		}
		
		String [] paths = doc.getPath().split("/");
		int deepth = paths.length;
		System.out.println("getDocListFromRootToDoc() deepth:" + deepth); 
		if(deepth < 1)
		{
			return resultList;
		}
		
		Integer reposId = repos.getId();
		Long pid = 0L;
		String  path = "";
		int level = 0;
		DocAuth pDocAuth = rootDocAuth;
		for(int i=0; i<deepth; i++)
		{
			String name = paths[i];
			if(name.isEmpty())
			{
				continue;
			}	
			
			Doc tempDoc = buildBasicDoc(reposId, null, pid, path, name, level, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
			DocAuth docAuth = getDocAuthFromHashMap(doc.getDocId(), pDocAuth, docAuthHashMap);
			
			List<Doc> subDocList = getAccessableSubDocList(repos, tempDoc, docAuth, docAuthHashMap, rt, actionList);
			addDocToSyncUpList(actionList, repos, tempDoc);
			if(subDocList == null || subDocList.size() == 0)
			{
				docSysDebugLog("getDocListFromRootToDoc() Failed to get the subDocList under doc: " + path+name, rt);
				break;
			}
			resultList.addAll(subDocList);
			
			path = path + name + "/";
			pid = tempDoc.getPid();
			pDocAuth = docAuth;
			level++;
		}
		
		return resultList;
	}
	
	protected void addDocToSyncUpList(List<CommonAction> actionList, Repos repos, Doc doc) {
		if(repos.getType() != 1)
		{
			return;
		}

		User autoSync = new User();
		autoSync.setId(0);
		autoSync.setName("AutoSync");
		if(false == checkDocLocked(repos.getId(), doc, autoSync, false))
		{
			//insertSyncUpAction(actionList,repos,doc,5,3,2, null);
			insertCommonAction(actionList,repos,doc, null, null, null, 5,3,2, null);
		}
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
		if(path1.length() >= path2.length())
		{
			if(path1.indexOf(path2) == 0)
			{
				System.out.print("isPathConflict() :" + path1 + " is under " + path2);
				return true;
			}
		}
		else
		{
			if(path2.indexOf(path1) == 0)
			{
				System.out.print("isPathConflict() :" + path2 + " is under " + path1);
				return true;
			}
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

		if(true == isReposPathBeUsed(repos,rt))
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
		
		if(true == isReposRealDocPathBeUsed(repos, rt))
		{
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
			
			if(true == isReposPathBeUsed(newReposInfo, rt))
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
			if(true == isReposRealDocPathBeUsed(newReposInfo,rt))
			{
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
					if(deleteClonedRepos(repos, isRealDoc) == false)
					{
						System.out.println("删除版本仓库失败");
						rt.setError("删除版本仓库失败");	
						return false;						
					}
						
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

	private boolean deleteClonedRepos(Repos repos, boolean isRealDoc) {
		String clonedReposPath = getLocalVerReposPath(repos, isRealDoc);
		File localRepos = new File(clonedReposPath);
		if(localRepos.exists())
		{
			return delFileOrDir(clonedReposPath);
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
	
	private boolean isReposPathBeUsed(Repos newRepos, ReturnAjax rt) {
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
					if(path.indexOf(reposPath) == 0)	//不能把仓库放到其他仓库下面
					{					
						docSysErrorLog(path + " 已被 " + repos.getName() + "  使用", rt); 
						docSysDebugLog("newReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " reposPath=" + reposPath, rt); 
						return true;
					}
				}
				
				String realDocPath = repos.getRealDocPath();
				if(realDocPath != null && !realDocPath.isEmpty())
				{
					realDocPath = localDirPathFormat(realDocPath);
					if(path.indexOf(realDocPath) == 0)	//不能把仓库放到其他仓库的文件存储目录
					{					
						docSysErrorLog(path + " 已被 " + repos.getName() + "  使用", rt); 
						docSysDebugLog("newRealDocPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " realDocPath=" + realDocPath, rt); 
						return true;
					}
				}
			}
		}
		return false;
	}
	
	private boolean isReposRealDocPathBeUsed(Repos newRepos, ReturnAjax rt) {
		
		String newRealDocPath = newRepos.getRealDocPath();
		
		List<Repos> reposList = reposService.getAllReposList();
		for(int i=0; i< reposList.size(); i++)
		{
			Repos repos = reposList.get(i);
			
			//文件存储路径不得使用仓库的存储路径(避免对仓库的存储目录或者仓库的结构造成破坏)
			String reposPath = repos.getPath();
			if(reposPath != null && !reposPath.isEmpty())
			{
				reposPath = localDirPathFormat(reposPath);
				if(isPathConflict(reposPath,newRealDocPath))
				{					
					docSysErrorLog("文件存储目录：" + newRealDocPath + "已被  " + repos.getName() + " 使用", rt); 
					docSysDebugLog("newRealDocPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " reposPath=" + reposPath,rt); 
					return true;
				}
			}
			
			//不同仓库可以使用相同的文件存储路径(不同仓库可以对相同的目录进行不同的管理方式)
//			//检查是否与其他的仓库realDocPath冲突
//			Integer reposId = newRepos.getId();
//			if(reposId == null || repos.getId() != reposId)	//用来区分是否是当前仓库
//			{
//				String realDocPath = repos.getRealDocPath();
//				if(realDocPath != null && !realDocPath.isEmpty())
//				{
//					realDocPath = localDirPathFormat(realDocPath);
//					if(isPathConflict(realDocPath,newRealDocPath))
//					{					
//						docSysErrorLog("文件存储目录：" + newRealDocPath + "已被  " + repos.getName() + " 使用", rt); 
//						docSysDebugLog("newRealDocPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " realDocPath=" + realDocPath, rt); 
//						return true;
//					}
//				}
//			}		
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
			
//			//检查远程版本仓库是否已被使用
//			String verReposURI = repos.getSvnPath();
//			if(verReposURI != null && !verReposURI.isEmpty())
//			{
//				if(isPathConflict(verReposURI,newVerReposPath))
//				{					
//					System.out.println("该版本仓库连接已被使用:" + newVerReposPath); 
//					System.out.println("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " verReposPath=" + verReposURI); 
//					return true;
//				}
//			}
//			
//			String verReposURI1 = repos.getSvnPath1();
//			if(verReposURI1 != null && !verReposURI1.isEmpty())
//			{
//				if(isPathConflict(verReposURI1,newVerReposPath))
//				{					
//					System.out.println("该版本仓库连接已被使用:" + newVerReposPath); 
//					System.out.println("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " verReposPath1=" + verReposURI1); 
//					return true;
//				}
//			}
			
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
		
		String reposRealDocDir = repos.getRealDocPath();
		if(reposRealDocDir != null && !reposRealDocDir.isEmpty())
		{
			if(createDir(reposRealDocDir) == false)
			{
				rt.setError("创建文件存储目录失败："+reposRealDocDir);
				return false;
			}
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
    	LuceneUtil2.deleteIndexLib(getIndexLibPath(repos,0));
		LuceneUtil2.deleteIndexLib(getIndexLibPath(repos,1));
    	LuceneUtil2.deleteIndexLib(getIndexLibPath(repos,2));
		
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
			
			if(!path.equals(oldPath))
			{
				//Do move the repos
				String reposName = previousReposInfo.getId()+"";
				if(previousReposInfo.getType() == 2)
				{
					reposName = "";
				}
				else
				{
					if(path.indexOf(oldPath) == 0)
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
			docSysErrorLog("文件 " + localParentPath + targetName + " 不存在！", rt);
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
				docSysErrorLog("压缩目录失败：" + localParentPath + targetName, rt);
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
		if(!file.exists())
		{	
			docSysErrorLog("文件  "+ dstPath + " 不存在！", rt);
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

		//读取要下载的文件，保存到文件输入流
		FileInputStream in = null;
		//创建输出流
		OutputStream out = null;
		try {
			//读取要下载的文件，保存到文件输入流
			in = new FileInputStream(dstPath);
			//创建输出流
			out = response.getOutputStream();
			//创建缓冲区
			byte buffer[] = new byte[1024];
			int len = 0;
			//循环将输入流中的内容读取到缓冲区当中
			while((len=in.read(buffer))>0){
				//输出缓冲区的内容到浏览器，实现文件下载
				out.write(buffer, 0, len);
			}
		}catch (Exception e) {
			if(in != null)
			{
				in.close();
			}
			if(out != null)
			{
				out.close();						
			}
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
	
	/********************************** Functions For Application Layer 
	 * @param downloadList ****************************************/
	protected String revertDocHistory(Repos repos, Doc doc, String commitId, String commitMsg, String commitUser, User login_user, ReturnAjax rt, HashMap<String, String> downloadList) 
	{		
		if(commitMsg == null)
		{
			commitMsg = doc.getPath() + doc.getName() + " 回退至版本:" + commitId;
		}

		//Checkout to localParentPath
		String localRootPath = doc.getLocalRootPath();
		String localParentPath = localRootPath + doc.getPath();
		
		//Do checkout the entry to
		List<Doc> successDocList = verReposCheckOut(repos, doc, localParentPath, doc.getName(), commitId, false, true, downloadList);	//不取本地已存在的 
		if(successDocList == null || successDocList.size() == 0)
		{
			docSysErrorLog("未找到需要恢复的文件（只恢复当前不存在的文件）！",rt);
			return null;
		}
		
		printObject("revertDocHistory checkOut successDocList:", successDocList);
		
		//Do commit to verRepos		
		String revision = verReposDocCommit(repos, doc.getIsRealDoc(), doc, commitMsg, commitUser, rt, true, null, 2);
		if(revision == null)
		{			
			docSysDebugLog("revertDocHistory()  verReposAutoCommit 失败", rt);
			return null;
		}
		
		if(doc.getIsRealDoc())
		{
			//Force update docInfo
			//printObject("revertDocHistory() successDocList:", successDocList);
			for(int i=0; i< successDocList.size(); i++)
			{
				Doc successDoc = successDocList.get(i);
				System.out.println("revertDocHistory() " + successDoc.getDocId() + " [" + doc.getPath() + doc.getName() + "] 恢复成功");
					
				successDoc.setRevision(revision);
				successDoc.setCreator(login_user.getId());
				successDoc.setLatestEditor(login_user.getId());
				dbUpdateDoc(repos, successDoc, true);
				dbCheckAddUpdateParentDoc(repos, successDoc, null);
			}
		}
		return revision;
	}
	
	//底层addDoc接口
	protected boolean addDoc(Repos repos, Doc doc, 
			MultipartFile uploadFile, //For upload
			Integer chunkNum, Integer chunkSize, String chunkParentPath, //For chunked upload combination
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		System.out.println("addDoc() docId:" + doc.getDocId() + " pid:" + doc.getPid() + " parentPath:" + doc.getPath() + " docName:" + doc.getName());
	
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return addDoc_FSM(repos, doc,	//Add a empty file
					uploadFile, //For upload
					chunkNum, chunkSize, chunkParentPath, //For chunked upload combination
					commitMsg, commitUser, login_user, rt, actionList);
			
		}
		return false;
	}

	protected boolean addDoc_FSM(Repos repos, Doc doc,	//Add a empty file
			MultipartFile uploadFile, //For upload
			Integer chunkNum, Integer chunkSize, String chunkParentPath, //For chunked upload combination
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		System.out.println("addDoc_FSM()  docId:" + doc.getDocId() + " pid:" + doc.getPid() + " parentPath:" + doc.getPath() + " docName:" + doc.getName() + " type:" + doc.getType());
		
		//add doc detail info
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
				System.out.println("addDoc() lockDoc " + doc.getName() + " Failed!");
				return false;
			}
		}
		
		String localParentPath =  doc.getLocalRootPath() + doc.getPath();
		String localDocPath = localParentPath + doc.getName();
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
				
				String MsgInfo = "createRealDoc " + doc.getName() +" Failed";
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
				
				String MsgInfo = "updateRealDoc " + doc.getName() +" Failed";
				rt.setError(MsgInfo);
				System.out.println("updateRealDoc Failed");
				return false;
			}
		}
		
		//Update the latestEditTime
		Doc fsDoc = fsGetDoc(repos, doc);
		doc.setCreateTime(fsDoc.getLatestEditTime());
		doc.setLatestEditTime(fsDoc.getLatestEditTime());
		
		String revision = verReposDocCommit(repos, true, doc,commitMsg,commitUser,rt, false, null, 2);
		if(revision == null)
		{
			docSysWarningLog("verReposDocCommit Failed", rt);
		}
		else
		{
			//only do dbAddDoc when commit success, otherwise the added doc will not be commit when do syncup (because dbDoc is same to localDoc) 
			doc.setRevision(revision);
			if(dbAddDoc(repos, doc, false, false) == false)
			{	
				docSysWarningLog("Add Node: " + doc.getName() +" Failed！", rt);
			}
		}
		
		//检查dbParentDoc是否已添加
		List <Doc> addedParentDocList = new ArrayList<Doc>();
		dbCheckAddUpdateParentDoc(repos, doc, addedParentDocList);
		if(addedParentDocList.size() > 0)
		{
			rt.setDataEx(addedParentDocList);
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

	
	private boolean dbUpdateDocRevision(Repos repos, Doc doc, String revision) {
		System.out.println("dbUpdateDocRevision " + revision + " doc " + doc.getDocId() + " [" +doc.getPath() + doc.getName());

		Doc dbDoc = dbGetDoc(repos, doc, false);
		if(dbDoc == null)
		{
			System.out.println("dbUpdateDocRevision dbDoc " + doc.getDocId() + " [" +doc.getPath() + doc.getName() + "] 不存在");
			doc.setRevision(revision);
			return dbAddDoc(repos,doc, false, false);
		}
		
		if(dbDoc.getRevision() == null || !dbDoc.getRevision().equals(revision))
		{
			dbDoc.setRevision(revision);
			if(dbUpdateDoc(repos, dbDoc, false) == false)
			{
				System.out.println("dbUpdateDocRevision 更新节点版本号失败: " + doc.getDocId() + " [" +doc.getPath() + doc.getName() + "]");	
				return false;
			}
			return true;
		}
		
		return true;
	}
	
	//该接口用于更新父节点的信息: 仓库有commit成功的操作时必须调用
	private void dbCheckAddUpdateParentDoc(Repos repos, Doc doc, List<Doc> parentDocList) 
	{
		if(repos.getType() != 1)
		{
			//For Non FSM type repos, dbNode is not need
			return;
		}
		
		System.out.println("checkAddUpdateParentDoc " + doc.getDocId() + " " +doc.getPath() + doc.getName());
		
		if(doc.getDocId() == 0)
		{
			return;
		}
		
		System.out.println("checkAddUpdateParentDoc pid:" + doc.getPid());
		
		Doc parentDoc = buildBasicDoc(doc.getVid(), doc.getPid(), null, doc.getPath(), "", null, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), 0L, "");
		parentDoc.setRevision(doc.getRevision());

		printObject("checkAddUpdateParentDoc parentDoc:", parentDoc);
		
		Doc dbParentDoc = dbGetDoc(repos, parentDoc, false);
		if(dbParentDoc == null)
		{
			if(parentDocList == null)
			{
				parentDocList = new ArrayList<Doc>();
			}

			if(dbAddDoc(repos, parentDoc, false, false) == true)
			{
				System.out.println("checkAddUpdateParentDoc 新增目录: " + parentDoc.getDocId() + " " + parentDoc.getPath() + parentDoc.getName());

				parentDocList.add(0,parentDoc);	//always add to the top
				dbCheckAddUpdateParentDoc(repos, parentDoc, parentDocList);
			}
		}
		else
		{
			if(dbParentDoc.getRevision() == null || !dbParentDoc.getRevision().equals(doc.getRevision()))
			{
				parentDoc.setId(dbParentDoc.getId());
				if(dbUpdateDoc(repos, parentDoc, false) == false)
				{
					System.out.println("checkAddUpdateParentDoc 更新父节点版本号失败: " + parentDoc.getDocId() + " " + parentDoc.getPath() + parentDoc.getName());	
				}
			}
		}
	}

	//底层deleteDoc接口
	protected String deleteDoc(Repos repos, Doc doc, String commitMsg,String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return deleteDoc_FSM(repos, doc, commitMsg, commitUser, login_user,  rt, actionList);			
		}
		return null;
	}

	protected String deleteDoc_FSM(Repos repos, Doc doc,	String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		Long docId = doc.getDocId();
		if(docId == 0)
		{
			//由于前台是根据docId和pid来组织目录结构的，所以前台可以删除docId=0的节点，表示数据库中存在一个docId=0的非法节点，直接删除掉
			docSysDebugLog("deleteDoc_FSM() 这是一个非法节点docId = 0", rt);
			dbDeleteDoc(repos, doc, false);
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
				docSysDebugLog("deleteDoc_FSM() Failed to lock Doc: " + docId, rt);
				return null;			
			}
			unlock(); //线程锁
		}
		System.out.println("deleteDoc_FSM() " + docId + " " + doc.getName() + " Lock OK");
		
		if(repos.getType() != 1)	//For FSM AsyncActionList will be created at dbDeleteDocEx
		{
			//Build ActionList for RDocIndex/VDoc/VDocIndex/VDocVerRepos delete
			BuildMultiActionListForDocDelete(actionList, repos, doc, commitMsg, commitUser,true);
		}
		
		//get RealDoc Full ParentPath
		if(deleteRealDoc(repos,doc,rt) == false)
		{
			unlockDoc(doc,login_user,docLock);
			
			docSysDebugLog("deleteDoc_FSM() deleteRealDoc Failed", rt);
			docSysErrorLog(doc.getName() + " 删除失败！", rt);
			return null;
		}
		

		String revision = verReposDocCommit(repos, true, doc, commitMsg,commitUser,rt, true, null, 2);
		if(revision == null)
		{
			docSysDebugLog("deleteDoc_FSM() verReposRealDocDelete Failed", rt);
			docSysWarningLog("verReposRealDocDelete Failed", rt);
		}
		else
		{
			//Delete DataBase Record and Build AsynActions For delete 
			if(dbDeleteDocEx(actionList, repos, doc, commitMsg, commitUser, true) == false)
			{	
				docSysWarningLog("不可恢复系统错误：dbDeleteDoc Failed", rt);
			}
			
			dbCheckAddUpdateParentDoc(repos, doc, null);
		}
		
		unlockDoc(doc,login_user,null);
		
		rt.setData(doc);
		return revision;
	}
	
	private void BuildMultiActionListForDocAdd(List<CommonAction> actionList, Repos repos, Doc doc, String commitMsg, String commitUser) 
	{
		if(repos.getType() != 1)
		{
			//Insert index add action for RDoc Name
			insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, 4, 1, 0, null);
		}	
		//Insert index add action for RDoc
		insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, 4, 1, 1, null);
		
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
			insertCommonAction(subActionList, repos, doc, null, commitMsg, commitUser, 2, 1, 2, null); //verRepos commit
		}
		insertCommonAction(subActionList, repos, doc, null, commitMsg, commitUser, 4, 1, 2, null);	//Add Index For VDoc
		
		//Insert add action for VDoc
		insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, 1, 1, 2, subActionList);			
	}

	protected void BuildMultiActionListForDocDelete(List<CommonAction> actionList, Repos repos, Doc doc, String commitMsg, String commitUser, boolean deleteSubDocs) 
	{	
		if(deleteSubDocs == true)
		{
			List<Doc> subDocList = docSysGetSubDocList(repos, doc);
			if(subDocList != null)
			{
				for(int i=0; i<subDocList.size(); i++)
				{
					Doc subDoc = subDocList.get(i);
					BuildMultiActionListForDocDelete(actionList, repos, subDoc, commitMsg, commitUser, deleteSubDocs);
				}
			}
		}	

		//Insert index add action for RDoc Name
		if(repos.getType() != 1)
		{
			insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, 4, 2, 0, null);
		}
		//Insert index delete action for RDoc
		insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, 4, 2, 1, null);

		//Insert delete action for VDoc
		//insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, 1, 2, 2, null);
		//Insert delete action for VDoc Index
		insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, 4, 2, 2, null);
		//Insert delete action for VDoc verRepos 
		//insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, 2, 2, 2, null);
	}
	
	private List<Doc> docSysGetSubDocList(Repos repos, Doc doc) 
	{
		switch(repos.getType())
		{
		case 1:
			//return getDBEntryList(repos, doc);			
			return getLocalEntryList(repos, doc);
		case 2:
			return getLocalEntryList(repos, doc);
		case 3:
		case 4:
			return getRemoteEntryList(repos, doc);
		}
		
		return null;
	}

	void BuildMultiActionListForDocUpdate(List<CommonAction> actionList, Repos repos, Doc doc, String reposRPath) 
	{		
		//Insert index update action for RDoc
		insertCommonAction(actionList, repos, doc, null, null, null, 4, 3, 1, null);
	}
	
	private void BuildMultiActionListForDocCopy(List<CommonAction> actionList, Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, boolean isMove)
	{	
		if(dstDoc.getName().isEmpty())
		{
			System.out.println("BuildMultiActionListForDocCopy() dstDoc.name is empty:" + dstDoc.getDocId() + " path:" + dstDoc.getPath() + " name:" +dstDoc.getName());
			return;
		}
		
		int ActionType = 5;
		if(isMove)
		{
			ActionType = 4;
		}
		
		//Check if dstLocalEntry exists
		String dstLocalEntryPath = dstDoc.getLocalRootPath() + dstDoc.getPath() + dstDoc.getName(); 
		File dstLocalEntry = new File(dstLocalEntryPath);
		if(dstLocalEntry.exists())
		{		
			//ActionId 1:FS 2:VerRepos 3:DB 4:Index  5:AutoSyncUp
			//ActionType 1:add 2:delete 3:update 4:move 5:copy
		    //DocType 0:DocName 1:RealDoc 2:VirtualDoc   AutoSyncUp(1: localDocChanged  2: remoteDocChanged)
			
			//Insert IndexAction For RealDoc Name Copy or Move (对于目录则会进行递归)
			if(repos.getType() != 1)
			{
				if(isMove)
				{
					insertCommonAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, 4, 3, 0, null);
				}
				else	//对于copy操作则新增对该docName的索引
				{
					insertCommonAction(actionList, repos, dstDoc, null, commitMsg, commitUser, 4, 1, 0, null);				
				}
			}
			
			//Insert IndexAction For RealDoc Copy or Move (对于目录则会进行递归)
			insertCommonAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, 4, ActionType, 1, null);
			//Copy VDoc (包括VDoc VerRepos and Index)
			insertCommonAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, 1, ActionType, 2, null);
			insertCommonAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, 2, ActionType, 2, null);
			insertCommonAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, 4, ActionType, 2, null);
		}
		
		if(dstLocalEntry.isDirectory())
		{			
			//遍历本地目录，构建CommonAction
			String dstSubDocParentPath = dstDoc.getPath() + dstDoc.getName() +"/";
			String srcSubDocParentPath = srcDoc.getPath() + srcDoc.getName() +"/";
			int dstSubDocLevel = dstDoc.getLevel() + 1;
			int srcSubDocLevel = srcDoc.getLevel() + 1;
			String localRootPath = dstDoc.getLocalRootPath();
			String localVRootPath = dstDoc.getLocalVRootPath();
			
			File[] localFileList = dstLocalEntry.listFiles();
	    	for(int i=0;i<localFileList.length;i++)
	    	{
	    		File file = localFileList[i];
	    		int type = file.isDirectory()? 2:1;
	    		long size = file.length();
	    		String name = file.getName();
	    		System.out.println("BuildMultiActionListForDocCopy subFile:" + name);

	    		Doc dstSubDoc = buildBasicDoc(repos.getId(), null, dstDoc.getDocId(), dstSubDocParentPath, name, dstSubDocLevel, type, true, localRootPath, localVRootPath, size, "");
	    		dstSubDoc.setCreateTime(dstLocalEntry.lastModified());
	    		dstSubDoc.setLatestEditTime(dstLocalEntry.lastModified());
	    		
	    		Doc srcSubDoc = buildBasicDoc(repos.getId(), null, srcDoc.getDocId(), srcSubDocParentPath, name, srcSubDocLevel, type, true, localRootPath, localVRootPath, size, "");
	    		BuildMultiActionListForDocCopy(actionList, repos, srcSubDoc, dstSubDoc, commitMsg, commitUser, isMove);
	    	}
		}		
	}
		
	protected boolean executeCommonActionList(List<CommonAction> actionList, ReturnAjax rt) 
	{
		if(actionList == null || actionList.size() == 0)
		{
			return true;
		}
		
		int size = actionList.size();
		System.out.println("executeCommonActionList size:" + size);
		
		int count = 0;

		for(int i=0; i< size; i++)
		{
			CommonAction action = actionList.get(i);
						
			if(executeCommonAction(action, rt) == true)
			{
				//Execute SubActionList
				executeCommonActionList(action.getSubActionList(), rt);
				count++;
			}
		}
		
		if(count != size)
		{
			System.out.println("executeCommonActionList() failed actions:" + (size - count));	
			return false;
		}
		
		return true;
	}
	
	private boolean executeCommonAction(CommonAction action, ReturnAjax rt) {
		
		boolean ret = false;
		
		Doc srcDoc = action.getDoc();
		
		System.out.println("executeCommonAction actionType:" + action.getAction() + " docType:" + action.getDocType() + " actionId:" + action.getType() + " doc:"+ srcDoc.getDocId() + " " + srcDoc.getPath() + srcDoc.getName());

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
		
		return ret;
	}

	protected boolean executeUniqueCommonActionList(List<CommonAction> actionList, ReturnAjax rt) 
	{
		System.out.println("********** executeUniqueCommonActionList ***********");

		
		//Inset ActionList to uniqueCommonAction
		for(int i=0; i<actionList.size(); i++)
		{
			insertUniqueCommonAction(actionList.get(i));
		}
		
		//注意：ActionList中的doc必须都是同一个仓库下的，否则下面的逻辑会有问题
		Integer reposId = actionList.get(0).getDoc().getVid(); //get the reposId from the first doc in action list
		System.out.println("executeUniqueCommonActionList reposId:" + reposId);
		
		UniqueAction uniqueAction = uniqueActionHashMap.get(reposId);
		if(uniqueAction == null)
		{
			System.out.println("executeUniqueCommonActionList uniqueAction for " + reposId+ " is null");
			return false;
		}
		
		ConcurrentHashMap<Long, CommonAction> uniqueCommonActionHashMap = uniqueAction.getUniqueCommonActionHashMap();
		List<CommonAction> uniqueCommonActionList = uniqueAction.getUniqueCommonActionList();	
		Long expireTime = uniqueAction.getExpireTimeStamp();
		boolean uniqueCommonActionIsRunning = uniqueAction.getIsRunning();
		if(uniqueCommonActionIsRunning)
		{
			System.out.println("executeUniqueCommonActionList uniqueCommonAction for " + reposId+ " is Running");
			if(expireTime == null)
			{
				return true;
			}
			
			//检查是否运行超时
			long curTime = new Date().getTime();
			if(curTime < expireTime)	//
			{
				return true;
			}
			
			System.out.println("executeUniqueCommonActionList uniqueCommonAction for " + reposId+ " Running timeout, clear uniqueAction");
			
			//清空uniqueAction
			uniqueAction.setIsRunning(false);
			uniqueAction.setExpireTimeStamp(null);
			uniqueCommonActionList.clear();
			uniqueCommonActionHashMap.clear();
			return false;
		}

		uniqueAction.setIsRunning(true);
		while(uniqueCommonActionHashMap.size() > 0)
		{
			if(uniqueCommonActionList.size() > 0)
			{
				CommonAction action = uniqueCommonActionList.get(0);
				long docId = action.getDoc().getDocId();
				executeCommonAction(action, rt);
				uniqueCommonActionList.remove(0);
				uniqueCommonActionHashMap.remove(docId);
			}
			else
			{
				System.out.println("executeUniqueCommonActionList() hashMap 和 list不同步，强制清除 uniqueCommonActionHashMap");
				uniqueCommonActionHashMap.clear();
			}
		}
		
		uniqueCommonActionIsRunning = false;
		return true;
	}	
	
	private boolean executeSyncUpAction(CommonAction action, ReturnAjax rt) {
		printObject("executeSyncUpAction() action:",action);
		return syncupForDocChange(action, rt);
	}

	//这个接口要保证只有一次Commit操作
	private boolean syncupForDocChange(CommonAction action, ReturnAjax rt) {		
		Doc doc = action.getDoc();
		if(doc == null)
		{
			return false;
		}
		printObject("**************************** 启动自动同步  syncupForDocChange() doc:",doc);
		
		User login_user = new User();
		login_user.setId(0); //系统自动同步用户 AutoSync
		login_user.setName("AutoSync");
		
		//Check the localDocChange behavior
		Repos repos = action.getRepos();
		
		//文件管理系统
		HashMap<Long, CommitAction> commitHashMap = new HashMap<Long, CommitAction>();
		boolean ret = SyncUpSubDocs_FSM(repos, doc, login_user, rt, commitHashMap, 1);
		System.out.println("syncupForDocChange() SyncUpSubDocs_FSM ret:" + ret);
		if(commitHashMap.size() == 0)
		{
			System.out.println("**************************** 结束自动同步 syncupForDocChange() 本地没有改动");
			return true;
		}
		
		//本地有改动需要提交
		System.out.println("syncupForDocChange() 本地有改动: [" + doc.getPath()+doc.getName() + "], do Commit");
		String commitMsg = "自动同步 ./" +  doc.getPath()+doc.getName();
		//LockDoc
		DocLock docLock = null;
		synchronized(syncLock)
		{
			//Try to lock the Doc
			docLock = lockDoc(doc,2,1*60*60*1000,login_user,rt,true); //2 Hours 2*60*60*1000 = 86400,000
			if(docLock == null)
			{
				unlock(); //线程锁
				docSysDebugLog("syncupForDocChange() Failed to lock Doc: " + doc.getName(), rt);
				System.out.println("**************************** 结束自动同步 syncupForDocChange() 文件已被锁定:" + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "]");
				return false;
			}
			unlock(); //线程锁
		}
		
		String revision = verReposDocCommit(repos, doc.getIsRealDoc(), doc, commitMsg, login_user.getName(), rt, true, commitHashMap, 1);
		if(revision == null)
		{
			System.out.println("**************************** 结束自动同步 syncupForDocChange() 本地改动Commit失败:" + revision);
			unlockDoc(doc, login_user, docLock);
			return false;
		}
		
		//更新数据库信息
		for(CommitAction commitAction: commitHashMap.values())
	    {
			Doc commitDoc = commitAction.getDoc();
			printObject("syncupForDocChange() dbUpdateDoc commitDoc: ", commitDoc);						
			//需要根据commitAction的行为来决定相应的操作
			commitDoc.setRevision(revision);
			commitDoc.setLatestEditorName(login_user.getName());
			dbUpdateDoc(repos, commitDoc, true);
			dbCheckAddUpdateParentDoc(repos, commitDoc, null);
		}
		dbUpdateDocRevision(repos, doc, revision);
		System.out.println("**************************** 结束自动同步 syncupForDocChange() 本地改动已更新:" + revision);
		unlockDoc(doc, login_user, docLock);
		return true;
	}

	private boolean syncupForDocChange_NoFS(Repos repos, Doc doc, User login_user, ReturnAjax rt, int subDocSyncFlag) 
	{
		Doc remoteEntry = verReposGetDoc(repos, doc, null);
		if(remoteEntry == null)
		{
			docSysDebugLog("syncupForDocChange_NoFS() remoteEntry is null for " + doc.getPath()+doc.getName() + ", 无法同步！", rt);
			return true;
		}
		
		printObject("syncupForDocChange_NoFS() remoteEntry: ", remoteEntry);
		
		Doc dbDoc = dbGetDoc(repos, doc, false);
		printObject("syncupForDocChange_NoFS() dbDoc: ", dbDoc);

		
		int remoteChangeType = getRemoteChangeType(repos, dbDoc, remoteEntry);
		if(remoteChangeType != 0)
		{
			//LockDoc
			DocLock docLock = null;
			synchronized(syncLock)
			{
				//Try to lock the Doc
				docLock = lockDoc(doc,2,1*60*60*1000,login_user,rt,true); //2 Hours 2*60*60*1000 = 86400,000
				if(docLock == null)
				{
					unlock(); //线程锁
					docSysDebugLog("syncupForDocChange() Failed to lock Doc: " + doc.getName(), rt);
					return false;
				}
				unlock(); //线程锁
			}
			boolean ret = syncUpForRemoteChange_NoFS(repos, dbDoc, remoteEntry, login_user, rt, remoteChangeType);
			unlockDoc(doc, login_user, docLock);
			return ret;
		}
		
		return SyncUpSubDocs_NoFS(repos, doc, login_user, rt, subDocSyncFlag);
	}
	
	
	private boolean SyncUpSubDocs_NoFS(Repos repos, Doc doc, User login_user, ReturnAjax rt, int subDocSyncFlag) 
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
		
		if(isRemoteDocChanged(repos, doc) == false)
		{
			//No Change
			return true;
		}

		HashMap<String, Doc> docHashMap = new HashMap<String, Doc>();	//the doc already syncUped
		
		Doc subDoc = null;
		List<Doc> dbDocList = getDBEntryList(repos, doc);
	   	if(dbDocList != null)
    	{
	    	for(int i=0;i<dbDocList.size();i++)
	    	{
	    		subDoc = dbDocList.get(i);
	    		docHashMap.put(subDoc.getName(), subDoc);
	    		syncupForDocChange_NoFS(repos, subDoc, login_user, rt, subDocSyncFlag);
	    	}
    	}
	    
	    List<Doc> remoteEntryList = getRemoteEntryList(repos, doc);
	    //printObject("SyncUpSubDocs_FSM() remoteEntryList:", remoteEntryList);
	    if(remoteEntryList != null)
    	{
	    	for(int i=0;i<remoteEntryList.size();i++)
		    {
	    		subDoc = remoteEntryList.get(i);
	    		if(docHashMap.get(subDoc.getName()) != null)
	    		{
	    			//already syncuped
	    			continue;	
	    		}
	    		
	    		docHashMap.put(subDoc.getName(), subDoc);
	    		syncupForDocChange_NoFS(repos, subDoc, login_user, rt, subDocSyncFlag);
		    }
    	}
	    
	    return true;
	}
	
	private boolean isRemoteDocChanged(Repos repos, Doc doc) 
	{
		Doc dbDoc = dbGetDoc(repos, doc, false);
    	if(dbDoc == null || dbDoc.getRevision() == null)
    	{
    		return true;
    	}
    	
    	String latestRevision = verReposGetLatestRevision(repos, doc);
        System.out.println("isRemoteDocChanged() latestRevision:" + latestRevision + " doc:" + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "]");
        System.out.println("isRemoteDocChanged() previoRevision:" + dbDoc.getRevision());
        
        if(latestRevision == null || dbDoc.getRevision().equals(latestRevision) == false)
        {
        	return true;
        }
    	
    	return false;
	}

	private boolean syncUpForRemoteChange_NoFS(Repos repos, Doc doc, Doc remoteEntry, User login_user, ReturnAjax rt, int remoteChangeType) 
	{
		switch(remoteChangeType)
		{
		case 1:
			System.out.println("syncUpForRemoteChange_NoFS() remote Added: " + doc.getPath()+doc.getName());
			return dbAddDoc(repos, remoteEntry, false, false);
		case 2:
			System.out.println("syncUpForRemoteChange_NoFS() remote Type Changed: " + doc.getPath()+doc.getName());
			dbDeleteDoc(repos, doc,true);
			return dbAddDoc(repos, remoteEntry, true, false);
		case 3:
			System.out.println("syncUpForRemoteChange_NoFS() remote File Changed: " + doc.getPath()+doc.getName());
			doc.setRevision(remoteEntry.getRevision());
			return dbUpdateDoc(repos, doc, true);
		case 4:
			//Remote Deleted
			System.out.println("syncUpForRemoteChange_NoFS() remote Deleted: " + doc.getPath()+doc.getName());
			return dbDeleteDoc(repos, doc, true);
		}
		
		return true;
	}
	
	private boolean syncupForDocChange_FSM(Repos repos, Doc doc, HashMap<Long, Doc> dbDocHashMap, HashMap<Long, Doc> localDocHashMap, HashMap<Long, Doc> remoteDocHashMap, User login_user, ReturnAjax rt, HashMap<Long, CommitAction> commitHashMap, int subDocSyncFlag) 
	{
		//printObject("syncupForDocChange_FSM() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " ", doc);

		if(doc.getDocId() == 0)	//For root dir, go syncUpSubDocs
		{
			System.out.println("syncupForDocChange_FSM() it is root doc");			
			return SyncUpSubDocs_FSM(repos, doc, login_user, rt, commitHashMap, subDocSyncFlag);
		}
		
		Doc dbDoc = null;
		Doc localEntry = null;
		Doc remoteEntry = null;
		
		dbDoc = getDocFromList(doc, dbDocHashMap);
		//printObject("syncupForDocChange_FSM() dbDoc: ", dbDoc);

		localEntry = getDocFromList(doc, localDocHashMap);
		//printObject("syncupForDocChange_FSM() localEntry: ", localEntry);
		
		remoteEntry = getDocFromList(doc, remoteDocHashMap);
		//printObject("syncupForDocChange_FSM() remoteEntry: ", remoteEntry);
		
		int docChangeType = getDocChangeType_FSM(repos, doc, dbDoc, localEntry, remoteEntry);
		//System.out.println("syncupForDocChange_FSM() docChangeType: " + docChangeType);

		Integer commitActionType = null;
		switch(docChangeType)
		{
		case 11:	//localAdd
			commitActionType = 1;
		case 12: 	//localDelete
			commitActionType = 2;
		case 13: 	//localFileChanged
			commitActionType = 3;
		case 14:	//localTypeChanged(From File to Dir)
			commitActionType = 6;
		case 15:	//localTypeChanged(From Dir to File)
			commitActionType = 7;
			CommitAction commitAction = new CommitAction();
			commitAction.setDoc(doc);
			commitAction.setAction(commitActionType);
			commitHashMap.put(doc.getDocId(), commitAction);
			break;
		
		//由于远程同步需要直接修改或删除本地文件，一旦误删无法恢复，因此只处理远程新增
		case 21:	//remoteAdd
//		case 22:	//remoteDelete
//		case 23:	//localFileChanged
//		case 24:	//remoteTypeChanged(From File To Dir)
//		case 25:	//remoteTypeChanged(From Dir To File)
			//LockDoc
			DocLock docLock = null;
			synchronized(syncLock)
			{
				//Try to lock the Doc
				docLock = lockDoc(doc,2,1*60*60*1000,login_user,rt,true); //2 Hours 2*60*60*1000 = 86400,000
				if(docLock == null)
				{
					unlock(); //线程锁
					docSysDebugLog("syncupForDocChange() Failed to lock Doc: " + doc.getName(), rt);
					return false;
				}
				unlock(); //线程锁
			}
			boolean ret = syncUpRemoteChange_FSM(repos, dbDoc, remoteEntry, login_user, rt, docChangeType);
			unlockDoc(doc, login_user, docLock);
			return ret;
		case 0:		//no change
			break;
		case -1:	//Unknown localEntryType
			return false;
		}
		
		return true;
	}
	
	private int getDocChangeType_FSM(Repos repos,Doc doc, Doc dbDoc, Doc localEntry, Doc remoteEntry) 
	{						
		//dbDoc不存在，localDoc存在
		if(dbDoc == null)
		{
			System.out.println("getDocChangeType_FSM() dbDoc 不存在");

			if(localEntry != null)
			{
				//本地新增文件/目录
				System.out.println("getDocChangeType_FSM() 本地新增:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
				return 11;
			}
			
			if(remoteEntry != null)
			{
				//远程文件/目录新增
				System.out.println("getDocChangeType_FSM() 远程新增:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
				return 21;
			}
			
			//未变更
			//System.out.println("getDocChangeType_FSM() 未变更(dbDoc不存在/localDoc不存在/remoteDoc不存在):" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return 0;
		}
		
		//dbDoc存在，localDoc不存在
		if(localEntry == null)
		{
			int remoteChangeType = getRemoteChangeType(repos, dbDoc, remoteEntry);
			if(remoteChangeType == 0)
			{
				//本地文件/目录删除
				System.out.println("getDocChangeType_FSM() 本地删除:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
				return 12;
			}
			
			//远程文件/目录 类型变化、内容修改、删除
			System.out.println("getDocChangeType_FSM() 远程类型变化/内容修改/删除:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return remoteChangeType;
		}
		
		//dbDoc存在，localDoc存在且是文件
		if(localEntry.getType() == 1)
		{
			if(dbDoc.getType() == 2)
			{
				//本地目录 类型变化 （目录删除后新增同名文件）
				System.out.println("getDocChangeType_FSM() 本地类型变化（目录->文件）:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
				return 14;
			}
			
			if(isDocLocalChanged(dbDoc, localEntry))
			{
				//本地文件 内容修改
				System.out.println("getDocChangeType_FSM() 本地内容修改:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
				return 13;
			}
			
			if(remoteEntry == null)
			{
				//远程删除
				System.out.println("getDocChangeType_FSM() 远程删除:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
				return 22;
			}
			
			if(remoteEntry.getType() == 2)
			{
				//远程文件 类型变化（文件被删除并增加了同名目录）
				System.out.println("getDocChangeType_FSM() 远程类型改变（文件->目录）:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
				return 25;
			}
			
			if(isDocRemoteChanged(repos, dbDoc, remoteEntry))
			{
				//远程文件 内容修改
				System.out.println("getDocChangeType_FSM() 远程内容修改:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
				return 23;
			}
			
			//未变更
			//System.out.println("getDocChangeType_FSM() 未变更(dbDoc存在/localDoc是文件/remoteDoc是文件):" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return 0;
		}
		
		//dbDoc存在，localDoc存在且是目录
		if(localEntry.getType() == 2)
		{
			if(dbDoc.getType() == 1)
			{
				//本地文件 类型变化 （文件删除后新增同名文件）
				System.out.println("getDocChangeType_FSM() 本地类型改变（文件->目录）:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
				return 15;
			}
			
			if(remoteEntry == null)
			{
				if(isDirLocalChanged(repos, dbDoc))
				{
					//远程删除，但同时本地目录有修改
					System.out.println("getDocChangeType_FSM() 远程删除，但本地目录有改动:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
					return 13;
				}
				
				
				if(repos.getVerCtrl() == 2)	//For Git Repos
				{
					//远程删除
					System.out.println("getDocChangeType_FSM() 远程删除(因GIT无法识别空目录，对于目录的远程删除不处理):" + doc.getDocId() + " " + doc.getPath() + doc.getName());
					return 0;
				}
				//远程删除
				System.out.println("getDocChangeType_FSM() 远程删除:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
				return 22;
			}
			
			if(remoteEntry.getType() == 1)
			{
				if(isDirLocalChanged(repos, dbDoc))
				{
					//远程目录 类型变化（目录被删除并增加了同名文件），但同时本地目录有修改
					System.out.println("getDocChangeType_FSM() 远程类型改变（目录->文件），但本地目录有改动:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
					return 13;
				}
				
				//远程目录 类型变化（目录被删除并增加了同名文件）
				System.out.println("getDocChangeType_FSM() 远程类型改变（目录->文件）:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
				return 24;
			}
			
			//未变更
			//System.out.println("getDocChangeType_FSM() 未变更(dbDoc存在/localDoc是目录/remoteDoc是目录):" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return 0;
		}
		
		//未知文件类型(localDoc.type !=1/2)
		System.out.println("getDocChangeType_FSM() 本地未知文件类型(" + localEntry.getType()+ "):" + doc.getDocId() + " " + doc.getPath() + doc.getName());
		return -1;
	}

	private Doc getDocFromList(Doc doc, HashMap<Long, Doc> dbDocHashMap) 
	{
		if(dbDocHashMap == null || dbDocHashMap.size() == 0)
		{
			return null;
		}
		
		return dbDocHashMap.get(doc.getDocId());
	}

	private boolean SyncUpSubDocs_FSM(Repos repos, Doc doc, User login_user, ReturnAjax rt, HashMap<Long, CommitAction> commitHashMap, int subDocSyncFlag) 
	{
		//System.out.println("************************ SyncUpSubDocs_FSM()  " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " subDocSyncFlag:" + subDocSyncFlag);

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
		
		HashMap<Long, Doc> dbDocHashMap = null;	
		HashMap<Long, Doc> localDocHashMap =  null;	
		HashMap<Long, Doc> remoteDocHashMap = null;		

				
		List<Doc> localEntryList = getLocalEntryList(repos, doc);
		//printObject("SyncUpSubDocs_FSM() localEntryList:", localEntryList);
    	if(localEntryList == null)
    	{
    		System.out.println("SyncUpSubDocs_FSM() localEntryList 获取异常:");
        	return false;
    	}

		List<Doc> dbDocList = getDBEntryList(repos, doc);
		//printObject("SyncUpSubDocs_FSM() dbEntryList:", dbDocList);

		List<Doc> remoteEntryList = null;
    	boolean isRemoteDocChanged = false;
    	if(repos.getVerCtrl() != null && repos.getVerCtrl() != 0)
    	{	
    		isRemoteDocChanged = isRemoteDocChanged(repos, doc);
    	}
    	
    	if(isRemoteDocChanged)
		{
    		remoteEntryList = getRemoteEntryList(repos, doc);
    	    //printObject("SyncUpSubDocs_FSM() remoteEntryList:", remoteEntryList);
        	if(remoteEntryList == null)
        	{
        		System.out.println("SyncUpSubDocs_FSM() remoteEntryList 获取异常:");
            	return false;
        	}        	
		}

		localDocHashMap =  ConvertDocListToHashMap(localEntryList);	
		dbDocHashMap = ConvertDocListToHashMap(dbDocList);	
		if(isRemoteDocChanged)
		{
			remoteDocHashMap = ConvertDocListToHashMap(remoteEntryList);					
		}
		else
		{
			remoteDocHashMap = dbDocHashMap;
		}

		
		HashMap<String, Doc> docHashMap = new HashMap<String, Doc>();	//the doc already syncUped		
		Doc subDoc = null;
	    
		//注意必须先进行远程同步，因为需要知道远程的改动是否都全部成功，如果成功了，需要dbDoc和remoteDoc的revision进行同步
    	if(isRemoteDocChanged)
    	{
    		boolean remoteSyncFlag = true;
	    	for(int i=0;i<remoteEntryList.size();i++)
		    {
	    		subDoc = remoteEntryList.get(i);
	    		//System.out.println("SyncUpSubDocs_FSM() subDoc:" + subDoc.getDocId() + " " + subDoc.getPath() + subDoc.getName());
	    		if(docHashMap.get(subDoc.getName()) != null)
	    		{
	    			//already syncuped
	    			continue;	
	    		}
	    		
	    		docHashMap.put(subDoc.getName(), subDoc);
	    		if(syncupForDocChange_FSM(repos, subDoc, dbDocHashMap, localDocHashMap, remoteDocHashMap, login_user, rt, commitHashMap, subDocSyncFlag) == false)
	    		{
	    			remoteSyncFlag = false;
	    		}
		    }
	    	
	    	//当前目录无改动需要将dbDoc和remoteDoc的revision进行一次同步
	    	if(remoteSyncFlag == true)
	    	{
	    		String latestDocRevision = verReposGetLatestRevision(repos, doc);
	    		dbUpdateDocRevision(repos, doc, latestDocRevision);
	    	}
    	}
		
    	for(int i=0;i<localEntryList.size();i++)
    	{
    		subDoc = localEntryList.get(i);
    		//System.out.println("SyncUpSubDocs_FSM() subDoc:" + subDoc.getDocId() + " " + subDoc.getPath() + subDoc.getName());
    		if(docHashMap.get(subDoc.getName()) != null)
    		{
    			//already syncuped
    			continue;	
    		}
    		
    		docHashMap.put(subDoc.getName(), subDoc);
    		syncupForDocChange_FSM(repos, subDoc, dbDocHashMap, localDocHashMap, remoteDocHashMap, login_user, rt, commitHashMap, subDocSyncFlag);
    	}
    	
		if(dbDocList != null)
    	{
	    	for(int i=0;i<dbDocList.size();i++)
	    	{
	    		subDoc = dbDocList.get(i);
	    		docHashMap.put(subDoc.getName(), subDoc);
	    		syncupForDocChange_FSM(repos, subDoc, dbDocHashMap, localDocHashMap, remoteDocHashMap, login_user, rt, commitHashMap, subDocSyncFlag);
	    	}
    	}
    	
    	return true;
    }
	
	private HashMap<Long, Doc> ConvertDocListToHashMap(List<Doc> docList) {
		if(docList == null)
    	{
			return null;
    	}

		HashMap<Long, Doc> docHashMap = new HashMap<Long, Doc>();

		for(int i=0;i< docList.size(); i++)
	    {
	    		Doc doc = docList.get(i);
	    		docHashMap .put(doc.getDocId(), doc);
	    }
		return docHashMap;
	}

	//localEntry and dbDoc was same
	private boolean syncUpRemoteChange_FSM(Repos repos, Doc doc, Doc remoteEntry, User login_user, ReturnAjax rt, int remoteChangeType) 
	{	
		
		String localParentPath = null;
		List<Doc> successDocList = null;
		
		switch(remoteChangeType)
		{
		case 21:		//Remote Added
			System.out.println("syncUpRemoteChange_FSM() remote Added: " + remoteEntry.getPath()+remoteEntry.getName());	
			localParentPath = getReposRealPath(repos) + remoteEntry.getPath();
			successDocList = verReposCheckOut(repos, remoteEntry, localParentPath, remoteEntry.getName(), null, true, false, null);
			if(successDocList != null)
			{
				dbAddDoc(repos, remoteEntry, true, false);
				return true;
			}
			return false;
		case 22: //Remote Deleted
			System.out.println("syncUpRemoteChange_FSM() local and remote deleted: " + doc.getPath()+doc.getName());
			if(deleteRealDoc(repos, doc, rt) == true)
			{
				dbDeleteDoc(repos, doc,true);
			}	
			return true;
		case 23: //Remote File Changed
			System.out.println("syncUpRemoteChange_FSM() remote Changed: " + doc.getPath()+doc.getName());
			
			localParentPath = getReposRealPath(repos) + remoteEntry.getPath();
			successDocList = verReposCheckOut(repos, remoteEntry, localParentPath, remoteEntry.getName(), null, true, false, null);
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
		case 24: //Remote Type Changed
		case 25:
			System.out.println("syncUpRemoteChange_FSM() remote Type Changed: " + doc.getPath()+doc.getName());
			if(deleteRealDoc(repos, doc, rt) == true)
			{
				dbDeleteDoc(repos, doc,true);
				
				//checkOut
				localParentPath = getReposRealPath(repos) + remoteEntry.getPath();
				successDocList = verReposCheckOut(repos, remoteEntry, localParentPath, remoteEntry.getName(), null, true, false, null);
				if(successDocList != null)
				{
					dbAddDoc(repos, remoteEntry, true, false);
					return true;						
				}
				return false;						
			}
			else
			{
				return false;
			}

		}
		return false;
	}

	private int getRemoteChangeType(Repos repos, Doc dbDoc, Doc remoteEntry) 
	{
		if(repos.getVerCtrl() == null || repos.getVerCtrl() == 0)
		{
			System.out.println("getRemoteChangeType() no verCtrl");
			return 0;
		}
		
		if(dbDoc == null)
		{
			if(remoteEntry != null)
			{
				System.out.println("getRemoteChangeType() 远程文件/目录新增:"+remoteEntry.getName());
				return 21;				
			}
			System.out.println("getRemoteChangeType() 远程文件未变更");
			return 0;
		}
		
		if(remoteEntry == null)
		{
			System.out.println("getRemoteChangeType() 远程文件删除:"+dbDoc.getName());
			return 22;
		}
		
		switch(remoteEntry.getType())
		{
		case 1:
			if(dbDoc.getType() == null || dbDoc.getType() != 1)
			{
				System.out.println("getRemoteChangeType() 远程文件类型改变(目录->文件):"+remoteEntry.getName());
				return 24; //local Type Changed
			}
			
			if(isDocRemoteChanged(repos, dbDoc, remoteEntry))
			{
				System.out.println("getRemoteChangeType() 远程文件内容修改:"+remoteEntry.getName());
				return 23;
			}
			
			System.out.println("getRemoteChangeType() 远程文件未变更:"+remoteEntry.getName());
			return 0;
		case 2:
			if(dbDoc.getType() == null || dbDoc.getType() != 2)
			{
				System.out.println("getRemoteChangeType() 远程文件类型改变(文件->目录):"+remoteEntry.getName());
				return 25; //local Type Changed
			}

			System.out.println("getRemoteChangeType() 远程目录未变更:"+remoteEntry.getName());
			return 0;
		}
		
		System.out.println("getRemoteChangeType() 远程文件类型未知:"+dbDoc.getName());
		return -1;
	}

	protected Doc fsGetDoc(Repos repos, Doc doc) 
	{
		Doc localDoc = new Doc();
		localDoc.setVid(repos.getId());
		localDoc.setDocId(doc.getDocId());
		localDoc.setPid(doc.getPid());
		localDoc.setPath(doc.getPath());
		localDoc.setName(doc.getName());
		localDoc.setType(0);	//不存在
	
		String localParentPath = getReposRealPath(repos) + doc.getPath();
		File localEntry = new File(localParentPath,doc.getName());
		if(localEntry.exists())
		{
			localDoc.setSize(localEntry.length());
			localDoc.setLatestEditTime(localEntry.lastModified());
			localDoc.setType(localEntry.isDirectory()? 2 : 1);
		}
		return localDoc;
	}
	
	private String verReposGetLatestRevision(Repos repos, Doc doc) {
		if(repos.getVerCtrl() == 1)
		{
			return svnGetDocLatestRevision(repos, doc);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitGetDocLatestRevision(repos, doc);	
		}
		return null;
	}

	private String svnGetDocLatestRevision(Repos repos, Doc doc) {
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, true, "") == false)
		{
			System.out.println("svnGetDoc() svnUtil.Init失败！");	
			return null;
		}

		return svnUtil.getLatestRevision(doc);		
	}
	
	private String gitGetDocLatestRevision(Repos repos, Doc doc) {
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, "") == false)
		{
			System.out.println("gitRealDocCommit() GITUtil Init failed");
			return null;
		}
		
		return gitUtil.getLatestRevision(doc);		
	}


	protected Doc verReposGetDoc(Repos repos, Doc doc, String revision)
	{
		if(repos.getVerCtrl() == 1)
		{
			return svnGetDoc(repos, doc, revision);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitGetDoc(repos, doc, revision);	
		}
		return null;
	}

	private Doc svnGetDoc(Repos repos, Doc doc, String strRevision) {
		//System.out.println("svnGetDoc() reposId:" + repos.getId() + " parentPath:" + parentPath + " entryName:" + entryName);
		
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

		Doc remoteEntry = svnUtil.getDoc(doc, revision);		
		return remoteEntry;
	}

	private Doc gitGetDoc(Repos repos, Doc doc, String revision) 
	{
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, "") == false)
		{
			System.out.println("gitRealDocCommit() GITUtil Init failed");
			return null;
		}
		
		Doc remoteDoc = gitUtil.getDoc(doc, revision);
		return remoteDoc;
	}

	protected Doc dbGetDoc(Repos repos, Doc doc, boolean dupCheck) 
	{	
		Doc qDoc = new Doc();
		qDoc.setVid(doc.getVid());
		qDoc.setDocId(doc.getDocId());
		
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
				System.out.println("dbGetDoc() 数据库存在多个DOC记录(" + doc.getName() + ")，自动清理"); 
				for(int i=0; i <list.size(); i++)
				{
					//delete Doc directly
					reposService.deleteDoc(list.get(i).getId());
				}
				return null;
			}
		}
	
		Doc dbDoc = list.get(0);		
		return dbDoc;
	}

	private boolean dbAddDoc(Repos repos, Doc doc, boolean addSubDocs, boolean parentDocCheck) 
	{
		if(repos.getType() != 1)
		{
			return true;
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
			List<Doc> subDocList = null;
			if(repos.getType() == 1 || repos.getType() == 2)
			{
				subDocList = getLocalEntryList(repos, doc);	
			}
			else
			{
				subDocList = getRemoteEntryList(repos, doc);	
			}
			
			if(subDocList != null)
			{
				for(int i=0; i<subDocList.size(); i++)
				{
					Doc subDoc = subDocList.get(i);
					subDoc.setCreator(doc.getCreator());
					subDoc.setLatestEditor(doc.getLatestEditor());
					subDoc.setRevision(doc.getRevision());
					dbAddDoc(repos, subDoc, addSubDocs, false);
				}
			}
		}
		return true;
	}
	
	private boolean dbDeleteDoc(Repos repos, Doc doc, boolean deleteSubDocs) 
	{
		if(repos.getType() != 1)
		{
			return true;
		}

		if(deleteSubDocs)
		{
			String subDocParentPath = doc.getPath() + doc.getName() + "/";
			if(doc.getName().isEmpty())
			{
				subDocParentPath = doc.getPath();
			}
			Doc qSubDoc = new Doc();
			qSubDoc.setVid(doc.getVid());
			qSubDoc.setPath(subDocParentPath);
			List<Doc> subDocList = reposService.getDocList(qSubDoc);
			if(subDocList != null)
			{
				for(int i=0; i<subDocList.size(); i++)
				{
					Doc subDoc = subDocList.get(i);
					if(subDoc.getName().isEmpty())
					{
						System.out.println("dbDeleteDoc() 系统错误: subDoc name is empty" + subDoc.getDocId());
						printObject("dbDeleteDoc() doc:", doc);
						printObject("dbDeleteDoc() subDoc:", subDoc);
						continue;
					}
					dbDeleteDoc(repos, subDoc, true);
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

	//autoDetect: 自动检测是新增还是更新或者非法
	private boolean dbUpdateDoc(Repos repos, Doc doc, boolean autoDetect) 
	{	
		if(repos.getType() != 1)
		{
			return true;
		}

		if(autoDetect == false)
		{
			if(reposService.updateDoc(doc) == 0)
			{
				return false;
			}		
			return true;
		}	
		
		
		Long docId = buildDocId(doc.getPath(), doc.getName());
		if(!doc.getDocId().equals(docId))
		{
			System.out.println("dbUpdateDoc() 非法docId，删除该数据库记录:" + doc.getDocId()  + " " + doc.getPath() + doc.getName());
			dbDeleteDoc(repos, doc, false);
			return true;
		}
		
		Doc localEntry = fsGetDoc(repos, doc);
		if(localEntry == null)
		{
			System.out.println("dbUpdateDoc() get localEntry 异常 for " + doc.getDocId()  + " " + doc.getPath() + doc.getName());
			return false;
		}
		
		if(localEntry.getType() == 0)
		{
			//这次commit是一个删除操作
			System.out.println("dbUpdateDoc() 本地文件/目录删除:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
			return dbDeleteDoc(repos, doc, true);
		}
		
		//根据localEntry来设置文件类型
		doc.setType(localEntry.getType());
		
		//dbDoc not exists, do add it
		Doc dbDoc = dbGetDoc(repos, doc, false);
		if(dbDoc == null)
		{
			if(localEntry.getType() != 0)
			{
				System.out.println("dbUpdateDoc() 本地新增文件/目录:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
				return dbAddDoc(repos, doc, true, true);
			}
			return true;
		}
		
		//type not matched, do delete it and add it
		if(dbDoc.getType() != localEntry.getType())
		{
			System.out.println("dbUpdateDoc() 本地文件/目录类型改变:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
			if(dbDeleteDoc(repos, dbDoc, true) == false)
			{
				System.out.println("dbUpdateDoc() 删除dbDoc失败:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
				return false;
			}
			return  dbAddDoc(repos, doc, true, false);	
		}
		
		if(dbDoc.getType() == 1)
		{
			System.out.println("dbUpdateDoc() 本地文件内容修改:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
			//Update the size/lastEditTime/revision for doc
			doc.setId(dbDoc.getId());
			doc.setSize(localEntry.getSize());
			doc.setLatestEditTime(localEntry.getLatestEditTime());
			if(reposService.updateDoc(doc) == 0)
			{
				return false;
			}		
			return true;
		}
		
		System.out.println("dbUpdateDoc() 本地目录内容修改（目录不需要修改数据库）:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
		return true;
	}

	private Long buildDocId(String path, String name) 
	{
		int level = getLevelByParentPath(path);
		return buildDocIdByName(level, path, name);
	}

	private boolean dbMoveDoc(Repos repos, Doc srcDoc, Doc dstDoc) 
	{
		if(repos.getType() != 1)
		{
			return true;
		}
		
		dbDeleteDoc(repos, srcDoc,true);
		return dbAddDoc(repos, dstDoc, true, false);
	}
	
	private boolean dbCopyDoc(Repos repos, Doc srcDoc, Doc dstDoc, User login_user, ReturnAjax rt) {
		if(repos.getType() != 1)
		{
			return true;
		}

		return dbAddDoc(repos, dstDoc, true, false);
	}
	
	private boolean dbDeleteDocEx(List<CommonAction> actionList, Repos repos, Doc doc, String commitMsg, String commitUser, boolean deleteSubDocs) 
	{
		if(repos.getType() != 1)
		{
			return true;
		}

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
					dbDeleteDocEx(actionList, repos, subDoc, commitMsg, commitUser, true);
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
		BuildMultiActionListForDocDelete(actionList, repos, doc, commitMsg, commitUser, false);

		return true;
	}

	private boolean executeDBAction(CommonAction action, ReturnAjax rt) 
	{
		printObject("executeDBAction() action:",action);
		Repos repos = action.getRepos();
		Doc doc = action.getDoc();
		System.out.println("executeDBAction() 实文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());

		switch(action.getAction())
		{
		case 1:	//Add Doc
			return dbAddDoc(repos, doc, false, true);
		case 2: //Delete Doc
			return dbDeleteDoc(repos, doc, true);
		case 3: //Update Doc
			return dbUpdateDoc(repos, doc, true);
		}
		return false;
	}
	
	private boolean executeIndexAction(CommonAction action, ReturnAjax rt) 
	{
		printObject("executeIndexAction() action:",action);
		Doc doc = action.getDoc();
		switch(action.getDocType())
		{
		case 0:	//DocName
			System.out.println("executeIndexAction() 文件名:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
    		return executeIndexActionForDocName(action, rt);
    	case 1: //RDoc
			System.out.println("executeIndexAction() 实文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
    		return executeIndexActionForRDoc(action, rt);
		case 2: //VDoc
			System.out.println("executeIndexAction() 虚文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
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
		case 1:	//Add Doc Name
			return addIndexForDocName(repos, doc, rt);
		case 2: //Delete Doc Name
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
		case 4: //Move Doc
			deleteIndexForRDoc(repos, doc);
			return addIndexForRDoc(repos, action.getNewDoc());		
		case 5: //Copy Doc
			return addIndexForRDoc(repos, action.getNewDoc());
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
		case 4: //Move Doc
			deleteIndexForVDoc(repos, doc);
			return addIndexForVDoc(repos, action.getNewDoc());		
		case 5: //Copy Doc
			return addIndexForVDoc(repos, action.getNewDoc());
		}
		return false;
	}
	
	private boolean executeFSAction(CommonAction action, ReturnAjax rt) {
		printObject("executeFSAction() action:",action);
		Doc doc = action.getDoc();
		switch(action.getDocType())
		{
		case 1:	//RDoc
			System.out.println("executeFSAction() 实文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return executeLocalActionForRDoc(action, rt);
		case 2: //VDoc
			System.out.println("executeFSAction() 虚文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
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
			return saveVirtualDocContent(repos, doc, rt);
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
		
		boolean isRealDoc = true;
		if(action.getDocType() == 2)
		{
			isRealDoc = false;
		}
		
		switch(action.getType())
		{
		case 1: //add
		case 2:	//delete
		case 3: //update
			return verReposDocCommit(repos, isRealDoc, doc, action.getCommitMsg(), action.getCommitUser(), rt, true, null, 2);
		case 4:	//move
			return verReposDocMove(repos, isRealDoc, doc,action.getNewDoc(), action.getCommitMsg(), action.getCommitUser(), rt);
		case 5: //copy
			return verReposDocCopy(repos, isRealDoc, doc, action.getNewDoc(), action.getCommitMsg(), action.getCommitUser(), rt);				
		}
		return null;
	}
	
	//底层updateDoc接口
	protected boolean updateDoc(Repos repos, Doc doc,
								MultipartFile uploadFile,
								Integer chunkNum, Integer chunkSize, String chunkParentPath, 
								String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return updateDoc_FSM(repos, doc,
					uploadFile,
					chunkNum, chunkSize, chunkParentPath, 
					commitMsg, commitUser, login_user, rt, actionList);
		}
		return false;
	}

	protected boolean updateDoc_FSM(Repos repos, Doc doc,
				MultipartFile uploadFile,
				Integer chunkNum, Integer chunkSize, String chunkParentPath, 
				String commitMsg,String commitUser,User login_user, ReturnAjax rt,
				List<CommonAction> actionList) 
	{	
		DocLock docLock = null;
		synchronized(syncLock)
		{
			//Try to lock the doc
			docLock = lockDoc(doc, 1, 2*60*60*1000, login_user, rt,false); //lock 2 Hours 2*60*60*1000
			if(docLock == null)
			{
				unlock(); //线程锁
	
				System.out.println("updateDoc() lockDoc " + doc.getName() +" Failed！");
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

			System.out.println("updateDoc() saveFile " + doc.getName() +" Failed, unlockDoc Ok");
			rt.setError("Failed to updateRealDoc " + doc.getName());
			return false;
		}
		
		doc.setLatestEditor(login_user.getId());
		doc.setLatestEditorName(login_user.getName());
		
		//Get latestEditTime
		Doc fsDoc = fsGetDoc(repos, doc);
		doc.setLatestEditTime(fsDoc.getLatestEditTime());

		//需要将文件Commit到版本仓库上去
		String revision = verReposDocCommit(repos, true, doc, commitMsg,commitUser,rt, true, null, 2);
		if(revision == null)
		{
			docSysDebugLog("updateDoc() verReposRealDocCommit Failed:" + doc.getPath() + doc.getName(), rt);
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
			dbCheckAddUpdateParentDoc(repos, doc, null);
		}
		
		//Build DocUpdate action
		BuildMultiActionListForDocUpdate(actionList, repos, doc, reposRPath);
		
		unlockDoc(doc,login_user,docLock);
		
		return true;
	}
	
	protected boolean renameDoc(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList) {
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return 	moveDoc_FSM(repos, srcDoc, dstDoc, commitMsg, commitUser, login_user, rt, actionList);
		}
		return false;
	}
	

	protected boolean moveDoc(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList) {
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return 	moveDoc_FSM(repos, srcDoc, dstDoc, commitMsg, commitUser, login_user, rt, actionList);
		}
		return false;
	}

	private boolean moveDoc_FSM(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, User login_user,
			ReturnAjax rt, List<CommonAction> actionList) 
	{
		DocLock srcDocLock = null;
		DocLock dstDocLock = null;
		synchronized(syncLock)
		{
			//Try to lock the srcDoc
			srcDocLock = lockDoc(srcDoc,1, 2*60*60*1000,login_user,rt,true);
			if(srcDocLock == null)
			{
				unlock(); //线程锁
		
				docSysDebugLog("moveDoc_FSM() lock srcDoc " + srcDoc.getName() + " Failed", rt);
				return false;
			}
			
			dstDocLock = lockDoc(dstDoc,1, 2*60*60*1000,login_user,rt,true);
			if(dstDocLock == null)
			{
				unlock(); //线程锁
				docSysDebugLog("moveDoc_FSM() lock dstDoc " + dstDoc.getName() + " Failed", rt);

				unlockDoc(srcDoc, login_user, srcDocLock);
				return false;
			}
			
			unlock(); //线程锁
		}
		
		if(moveRealDoc(repos, srcDoc, dstDoc, rt) == false)
		{
			unlockDoc(srcDoc, login_user, srcDocLock);
			unlockDoc(dstDoc, login_user, dstDocLock);

			docSysDebugLog("moveDoc_FSM() moveRealDoc " + srcDoc.getName() + " to " + dstDoc.getName() + " 失败", rt);
			return false;
		}
		
		String revision = verReposDocMove(repos, true, srcDoc, dstDoc,commitMsg, commitUser,rt);
		if(revision == null)
		{
			docSysWarningLog("moveDoc_FSM() verReposRealDocMove Failed", rt);
		}
		else
		{
			dstDoc.setRevision(revision);
			if(dbMoveDoc(repos, srcDoc, dstDoc) == false)
			{
				docSysWarningLog("moveDoc_FSM() dbMoveDoc failed", rt);			
			}
			dbCheckAddUpdateParentDoc(repos, dstDoc, null);
		}
		
		//Build Async Actions For RealDocIndex\VDoc\VDocIndex Add
		BuildMultiActionListForDocCopy(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, true);
		
		unlockDoc(srcDoc,login_user,srcDocLock);
		unlockDoc(dstDoc,login_user,dstDocLock);
		
		rt.setData(dstDoc);
		return true;
	}
	
	//底层copyDoc接口
	protected boolean copyDoc(Repos repos, Doc srcDoc, Doc dstDoc, 
			String commitMsg,String commitUser,User login_user, ReturnAjax rt,List<CommonAction> actionList) 
	{
		switch(repos.getType())
		{
		case 1:
		case 2:
		case 3:
		case 4:
			return 	copyDoc_FSM(repos, srcDoc, dstDoc,
					commitMsg, commitUser, login_user, rt, actionList);
		}
		return false;
	}

	protected boolean copyDoc_FSM(Repos repos, Doc srcDoc, Doc dstDoc,
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList)
	{				
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

			System.out.println("copy " + srcDoc.getName() + " to " + dstDoc.getName() + " 失败");
			rt.setError("copyRealDoc copy " + srcDoc.getName() + " to " + dstDoc.getName() + "Failed");
			return false;
		}
			
		//需要将文件Commit到VerRepos上去
		String revision = verReposDocCopy(repos, true, srcDoc, dstDoc,commitMsg, commitUser,rt);
		if(revision == null)
		{
			docSysWarningLog("copyDoc() verReposRealDocCopy failed", rt);
		}
		else
		{
			dstDoc.setRevision(revision);
			if(dbCopyDoc(repos, srcDoc, dstDoc, login_user, rt) == false)
			{
				docSysWarningLog("copyDoc() dbCopyDoc failed", rt);			
			}
			dbCheckAddUpdateParentDoc(repos, dstDoc, null);
		}
		
		//Build Async Actions For RealDocIndex\VDoc\VDocIndex Add
		BuildMultiActionListForDocCopy(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, false);
		
		unlockDoc(srcDoc,login_user,srcDocLock);
		unlockDoc(dstDoc,login_user,dstDocLock);
		
		//只返回最上层的doc记录
		rt.setData(dstDoc);
		return true;
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
		
		boolean ret = updateDocContent_FSM(repos, doc, commitMsg, commitUser, login_user, rt, actionList);
		
		//revert the lockStatus
		unlockDoc(doc, login_user, docLock);
				
		return ret;
	}

	private boolean updateDocContent_FSM(Repos repos, Doc doc,
			String commitMsg, String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		
		//Save the content to virtual file
		if(isVDocExist(repos, doc) == true)
		{
			if(saveVirtualDocContent(repos, doc, rt) == true)
			{
				verReposDocCommit(repos, false, doc, commitMsg, commitUser,rt, true, null, 2);

				//Insert index add action for VDoc
				insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, 4, 3, 2, null);
				return true;
			}
		}
		else
		{	
			//创建虚拟文件目录：用户编辑保存时再考虑创建
			if(createVirtualDoc(repos, doc, rt) == true)
			{
				verReposDocCommit(repos, false, doc, commitMsg, commitUser,rt, true, null, 2);

				//Insert index update action for VDoc
				insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, 4, 1, 2, null);
				return true;
			}
		}
				
		return false;
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

		if(doc.getType() == null)
		{
			System.out.println("lockDoc() Doc type is null for " + doc.getDocId() + " " + doc.getPath() + doc.getName() );				
		}
		
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
			newDocLock.setId(docLock.getId());
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
			
			//If SubDocLock is for directory or unknown type, need to check its subDocLocks
			if(subDocLock.getType() == null || subDocLock.getType() == 2)
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
	protected boolean unlockDoc(Doc doc, User login_user, DocLock preDocLock) 
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
	protected boolean checkUserAddRight(Repos repos, Integer userId, Doc doc, ReturnAjax rt) 
	{		
		DocAuth docUserAuth = getUserDocAuth(repos, userId, doc);
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

	protected boolean checkUserDeleteRight(Repos repos, Integer userId, Doc doc, ReturnAjax rt)
	{	
		DocAuth docUserAuth = getUserDocAuth(repos, userId, doc);
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
	
	protected boolean checkUserEditRight(Repos repos, Integer userId, Doc doc, ReturnAjax rt)
	{
		DocAuth docUserAuth = getUserDocAuth(repos, userId, doc);
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
	
	protected boolean checkUseAccessRight(Repos repos, Integer userId, Doc doc, ReturnAjax rt)
	{
		DocAuth docAuth = getUserDocAuth(repos, userId, doc);
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
	
	protected boolean isAdminOfDoc(Repos repos, User login_user, Doc doc) 
	{
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
			return true;
		}
		
		DocAuth userDocAuth = getUserDocAuth(repos, login_user.getId(), doc);
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
	protected DocAuth getGroupDispDocAuth(Repos repos, Integer groupId, Doc doc) 
	{
		System.out.println("getGroupDispDocAuth() groupId:"+groupId);
		
		DocAuth docAuth = getGroupDocAuth(repos, groupId, doc);	//获取用户真实的权限
		
		 String groupName = getGroupName(groupId);
		 
		 //转换成可显示的权限
		if(docAuth == null)
		{
			docAuth = new DocAuth();
			docAuth.setGroupId(groupId);
			docAuth.setGroupName(groupName);
			docAuth.setDocId(doc.getDocId());
			docAuth.setDocName(doc.getName());
			docAuth.setDocPath(doc.getPath());
			docAuth.setReposId(repos.getId());
		}
		else	//如果docAuth非空，需要判断是否是直接权限，如果不是需要对docAuth进行修改
		{
			if(docAuth.getUserId() != null || !docAuth.getGroupId().equals(groupId) || !docAuth.getDocId().equals(doc.getDocId()))
			{
				System.out.println("getGroupDispDocAuth() docAuth为继承的权限,需要删除reposAuthId并设置groupId、groupName");
				docAuth.setId(null);	//clear reposAuthID, so that we know this setting was not on user directly
			}
			//修改信息
			docAuth.setGroupId(groupId);
			docAuth.setGroupName(groupName);
			docAuth.setDocId(doc.getDocId());
			docAuth.setDocName(doc.getName());
			docAuth.setDocPath(doc.getPath());
			docAuth.setReposId(repos.getId());
		}
		return docAuth;
	}
	
	//获取用户的用于显示的docAuth
	public DocAuth getUserDispDocAuth(Repos repos, Integer UserID, Doc doc)
	{
		System.out.println("getUserDispDocAuth() UserID:"+UserID);
		
		DocAuth docAuth = getUserDocAuth(repos, UserID, doc);	//获取用户真实的权限
		printObject("getUserDispDocAuth() docAuth:",docAuth);
		
		//Get UserName
		String UserName = getUserName(UserID);
		
		//转换成可显示的权限
		if(docAuth == null)
		{
			docAuth = new DocAuth();
			docAuth.setUserId(UserID);
			docAuth.setUserName(UserName);
			docAuth.setDocId(doc.getDocId());
			docAuth.setDocName(doc.getName());
			docAuth.setDocPath(doc.getPath());
			docAuth.setReposId(repos.getId());
		}
		else	//如果docAuth非空，需要判断是否是直接权限，如果不是需要对docAuth进行修改
		{
			printObject("getUserDispDocAuth() docAuth:",docAuth);
			if(docAuth.getUserId() == null || !docAuth.getUserId().equals(UserID) || !docAuth.getDocId().equals(doc.getDocId()))
			{
				System.out.println("getUserDispDocAuth() docAuth为继承的权限,需要删除reposAuthId并设置userID、UserName");
				docAuth.setId(null);	//clear docAuthID, so that we know this setting was not on user directly
			}
			
			docAuth.setUserId(UserID);
			docAuth.setUserName(UserName);
			docAuth.setDocId(doc.getDocId());
			docAuth.setDocName(doc.getName());
			docAuth.setDocPath(doc.getPath());
			docAuth.setReposId(repos.getId());
		}
		return docAuth;
	}

	protected DocAuth getGroupDocAuth(Repos repos, Integer groupId, Doc doc)
	{
		return getRealDocAuth(repos, null, groupId, doc);
	}
	
	protected DocAuth getUserDocAuth(Repos repos, Integer userId, Doc doc) 
	{
		return getRealDocAuth(repos, userId, null, doc);
	}
	
	//Function:getUserDocAuth
	protected DocAuth getRealDocAuth(Repos repos, Integer userId,Integer groupId, Doc doc) 
	{
		System.out.println("getRealDocAuth()  reposId:"+ repos.getId() + " userId:" + userId + " groupId:"+ groupId + " docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " docName:" + doc.getName());
		
		//获取从docId到rootDoc的全路径，put it to docPathList
		List<Long> docIdList = new ArrayList<Long>();
		docIdList = getDocIdList(repos, doc, docIdList);
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

	protected List<Long> getDocIdList(Repos repos, Doc doc, List<Long> docIdList) 
	{
		if(doc.getDocId() == 0)
		{
			docIdList.add(0L);
			return docIdList;
		}
		
		String docPath = doc.getPath() + doc.getName();
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
		System.out.println("createRealDoc() localRootPath:" + doc.getLocalRootPath() + " path:" + doc.getPath() + " name:" + doc.getName());
		
		String name = doc.getName();
		int type = doc.getType();
		
		//获取 doc parentPath
		String localParentPath =  doc.getLocalRootPath() + doc.getPath();

		String localDocPath = localParentPath + name;
		
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
			e.printStackTrace();
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

	private boolean isVDocExist(Repos repos, Doc doc) {
		
		String vDocName = getVDocName(doc);
		return isFileExist(doc.getLocalVRootPath() + vDocName);
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
				
		String docVName = getVDocName(doc);
		
		String vDocPath = doc.getLocalVRootPath() + docVName;
		System.out.println("vDocPath: " + vDocPath);
			
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
		
		return saveVirtualDocContent(repos, doc, rt);
	}
	
	protected boolean saveVirtualDocContent(Repos repos, Doc doc, ReturnAjax rt) 
	{	
		String content = doc.getContent();
		if(content == null)
		{
			System.out.println("saveVirtualDocContent() content is null");
			return false;
		}

		String docVName = getVDocName(doc);
		
		String vDocPath = doc.getLocalVRootPath() + docVName + "/";
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
			byte[] buff = content.getBytes();
			out.write(buff, 0, buff.length);
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
			//System.out.println("fileSize:[" + fileSize + "]");

			byte buffer[] = new byte[fileSize];
	
			FileInputStream in;
			in = new FileInputStream(mdFilePath);
			in.read(buffer, 0, fileSize);
			in.close();	
							
			String content = new String(buffer);
			//System.out.println("content:[" + content + "]");
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
		int verCtrl = repos.getVerCtrl();
		if(isRealDoc == false)
		{
			verCtrl = repos.getVerCtrl1();
		}
		
		if(verCtrl == 1)
		{
			return svnGetHistory(repos, isRealDoc, entryPath, maxLogNum);
		}
		else if(verCtrl == 2)
		{
			return gitGetHistory(repos, isRealDoc, entryPath, maxLogNum);
		}
		return null;
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
	
	protected List<LogEntry> gitGetHistory(Repos repos, boolean isRealDoc, String docPath, int maxLogNum) {
		GITUtil gitUtil = new GITUtil();
		if(false == gitUtil.Init(repos, isRealDoc, null))
		{
			System.out.println("gitGetHistory() gitUtil.Init Failed");
			return null;
		}
		return gitUtil.getHistoryLogs(docPath, null, null, maxLogNum);
	}

	
	//Get History Detail
	protected List<ChangedItem> verReposGetHistoryDetail(Repos repos,boolean isRealDoc, Doc doc, String commitId) 
	{
		int verCtrl = repos.getVerCtrl();
		if(isRealDoc == false)
		{
			//Convert doc to vDoc
			doc = buildVDoc(doc);
			verCtrl = repos.getVerCtrl1();
		}
		
		if(verCtrl == 1)
		{
			return svnGetHistoryDetail(repos, isRealDoc, doc, commitId);
		}
		else if(verCtrl == 2)
		{
			return gitGetHistoryDetail(repos, isRealDoc, doc, commitId);
		}
		return null;
	}
	
	protected List<ChangedItem> svnGetHistoryDetail(Repos repos,boolean isRealDoc, Doc doc, String commitId) 
	{
		SVNUtil svnUtil = new SVNUtil();
		if(false == svnUtil.Init(repos, isRealDoc, null))
		{
			System.out.println("svnGetHistory() svnUtil.Init Failed");
			return null;
		}
		
		return svnUtil.getHistoryDetail(doc, commitId); 
	}
	
	protected List<ChangedItem> gitGetHistoryDetail(Repos repos, boolean isRealDoc, Doc doc, String commitId) 
	{
		GITUtil gitUtil = new GITUtil();
		if(false == gitUtil.Init(repos, isRealDoc, null))
		{
			System.out.println("gitGetHistory() gitUtil.Init Failed");
			return null;
		}
		
		return gitUtil.getHistoryDetail(doc, commitId);
	}
	
	protected String verReposDocCommit(Repos repos, boolean isRealDoc, Doc doc, String commitMsg, String commitUser, ReturnAjax rt, boolean modifyEnable, HashMap<Long, CommitAction> commitHashMap, int subDocCommitFlag) 
	{	
		int verCtrl = repos.getVerCtrl();
		if(isRealDoc == false)
		{
			//Convert doc to vDoc
			doc = buildVDoc(doc);
			verCtrl = repos.getVerCtrl1();
		}

		System.out.println("verReposDocCommit verCtrl:"+verCtrl);
		if(verCtrl == 1)
		{
			commitMsg = commitMsgFormat(repos, doc.getIsRealDoc(), commitMsg, commitUser);
			return svnDocCommit(repos, doc, commitMsg, commitUser, rt, modifyEnable, commitHashMap, subDocCommitFlag);
		}
		else if(verCtrl == 2)
		{
			return gitDocCommit(repos, doc, commitMsg, commitUser, rt, modifyEnable, commitHashMap, subDocCommitFlag);
		}
		
		return "";
	}
	
	protected String svnDocCommit(Repos repos, Doc doc, String commitMsg, String commitUser, ReturnAjax rt, boolean modifyEnable, HashMap<Long, CommitAction> commitHashMap, int subDocCommitFlag)
	{			
		boolean isRealDoc = doc.getIsRealDoc();
		
		SVNUtil verReposUtil = new SVNUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, commitUser))
		{
			return null;
		}

		return verReposUtil.doAutoCommit(doc, commitMsg,commitUser,modifyEnable, commitHashMap, subDocCommitFlag);
	}
	
	protected String gitDocCommit(Repos repos, Doc doc,	String commitMsg, String commitUser, ReturnAjax rt, boolean modifyEnable, HashMap<Long, CommitAction> commitHashMap, int subDocCommitFlag) 
	{
		boolean isRealDoc = doc.getIsRealDoc();
		
		GITUtil verReposUtil = new GITUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, commitUser))
		{
			return null;
		}
		
		if(false == verReposUtil.doFetch())
		{
			return null;
		}
		
		return verReposUtil.doAutoCommit(doc, commitMsg,commitUser,modifyEnable, commitHashMap, subDocCommitFlag);
	}

	/*
	 * verReposCheckOut
	 * 参数：
	 * 	force: 如果本地target文件存在，false则跳过，否则强制替换
	 *  auto: 如果CommitId对应的是删除操作，自动checkOut上删除前的版本（通过checkPath来确定是否是删除操作，但也有可能只是通过移动和复制的相关历史，那么往前追溯可能是有问题的） 
	 */
	protected List<Doc> verReposCheckOut(Repos repos, Doc doc, String localParentPath, String targetName, String commitId, boolean force, boolean auto, HashMap<String,String> downloadList) 
	{
		int verCtrl = repos.getVerCtrl();
		if(doc.getIsRealDoc() == false)
		{
			//Convert doc to vDoc
			doc = buildVDoc(doc);
			verCtrl = repos.getVerCtrl1();
		}
		
		if(verCtrl == 1)
		{
			long revision = -1;
			if(commitId != null)
			{
				revision = Long.parseLong(commitId);
			}
			return svnCheckOut(repos, doc, localParentPath, targetName, revision, force, auto, downloadList);		
		}
		else if(verCtrl == 2)
		{
			return gitCheckOut(repos, doc, localParentPath, targetName, commitId, force, auto, downloadList);
		}
		return null;
	}
	
	protected List<Doc> svnCheckOut(Repos repos, Doc doc, String localParentPath,String targetName,long revision, boolean force, boolean auto, HashMap<String, String> downloadList)
	{
		boolean isRealDoc = doc.getIsRealDoc();
		
		SVNUtil verReposUtil = new SVNUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, ""))
		{
			return null;
		}

		String entryPath = doc.getPath() + doc.getName();
		Integer type = verReposUtil.checkPath(entryPath, revision);
    	if(type == null)
    	{
    		System.out.println("svnCheckOut() checkPath for " + entryPath + " 异常");
    		return null;
    	}
    	else if(type == 0)
    	{
    		System.out.println("svnCheckOut() " + entryPath + " not exists for revision:" + revision);
    		if(auto == false)
    		{
        		return null;
    		}

    		Long preCommitId = verReposUtil.getPreviousCommmitId(revision);
    		if(preCommitId == null)
    		{
        		System.out.println("svnCheckOut() getPreviousCommmitId for revision:" + revision + " 异常");
    			return null;
    		}
    		revision = preCommitId;
    		System.out.println("svnCheckOut() try to chekout " + entryPath + " at revision:" + revision);
    	}
    	else
    	{
	    	if(doc.getName().isEmpty())
	    	{
	    		System.out.println("svnCheckOut() it is root doc, if there is no any subEntries means all items be deleted, we need to get preCommitId");
	    		Collection<SVNDirEntry> subEntries = verReposUtil.getSubEntries("", revision);
	    		if(verReposUtil.subEntriesIsEmpty(subEntries))
	    		{
	    	    	System.out.println("svnCheckOut() 根目录下没有文件 at revision:" + revision);
	        		if(auto == false)
	        		{
	        			return null;
	        		}
	        		
	    	    	Long preCommitId = verReposUtil.getPreviousCommmitId(revision);
	    	    	if(preCommitId == null)
	    	    	{
	    	        	System.out.println("svnCheckOut() getPreviousCommmitId for revision:" + revision + " 异常");
	    	    		return null;
	    	    	}
	    	    	revision = preCommitId;
	    	    	System.out.println("svnCheckOut() try to chekout 根目录 at revision:" + revision);
	    		}
	    	}
    	}	
		return verReposUtil.getEntry(doc, localParentPath, targetName, revision, force, downloadList);
	}
	
	protected List<Doc> gitCheckOut(Repos repos, Doc doc, String localParentPath, String targetName, String revision, boolean force, boolean auto, HashMap<String, String> downloadList) 
	{
		boolean isRealDoc = doc.getIsRealDoc();
		
		GITUtil verReposUtil = new GITUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, ""))
		{
			return null;
		}
		
		String entryPath = doc.getPath() + doc.getName();
		Integer type = verReposUtil.checkPath(entryPath, revision);
    	if(type == null)
    	{
    		System.out.println("gitCheckOut() checkPath for " + entryPath + " 异常");
    		return null;
    	}
    	else if(type == 0)
    	{
    		System.out.println("svnCheckOut() " + entryPath + " not exists for revision:" + revision);
    		if(auto == false)
    		{
        		return null;
    		}

    		String preCommitId = verReposUtil.getPreviousCommmitId(revision);
    		if(preCommitId == null)
    		{
        		System.out.println("svnCheckOut() getPreviousCommmitId for revision:" + revision + " 异常");
    			return null;
    		}
    		revision = preCommitId;
    		System.out.println("svnCheckOut() try to chekout " + entryPath + " at revision:" + revision);
    	}
    	else
    	{
	    	if(doc.getName().isEmpty())
	    	{
	    		System.out.println("gitCheckOut() it is root doc, if there is no any subEntries means all items be deleted, we need to get preCommitId");
	    		TreeWalk subEntries = verReposUtil.getSubEntries("", revision);
	    		if(verReposUtil.subEntriesIsEmpty(subEntries))
	    		{
	    	    	System.out.println("svnCheckOut() 根目录下没有文件 at revision:" + revision);
	        		if(auto == false)
	        		{
	        			return null;
	        		}
	        		
	    	    	String preCommitId = verReposUtil.getPreviousCommmitId(revision);
	    	    	if(preCommitId == null)
	    	    	{
	    	        	System.out.println("svnCheckOut() getPreviousCommmitId for revision:" + revision + " 异常");
	    	    		return null;
	    	    	}
	    	    	revision = preCommitId;
	    	    	System.out.println("svnCheckOut() try to chekout 根目录 at revision:" + revision);
	    		}
	    	}
    	}

		return verReposUtil.getEntry(doc, localParentPath, targetName, revision, force, downloadList);
	}

	protected String verReposDocMove(Repos repos,  boolean isRealDoc, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		int verCtrl = repos.getVerCtrl();
		if(isRealDoc == false)
		{
			//Convert doc to vDoc
			srcDoc = buildVDoc(srcDoc);
			dstDoc = buildVDoc(dstDoc);
			verCtrl = repos.getVerCtrl1();
		}
				
		if(verCtrl == 1)
		{
			commitMsg = commitMsgFormat(repos, srcDoc.getIsRealDoc(), commitMsg, commitUser);
			return svnDocMove(repos, srcDoc, dstDoc, commitMsg, commitUser, rt);			
		}
		else if(verCtrl == 2)
		{
			return gitDocMove(repos, srcDoc, dstDoc, commitMsg, commitUser, rt);
		}
		return null;
	}
	
	private String svnDocMove(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, ReturnAjax rt) {
		boolean isRealDoc = srcDoc.getIsRealDoc();
		
		SVNUtil verReposUtil = new SVNUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, ""))
		{
			return null;
		}

		return verReposUtil.copyDoc(srcDoc, dstDoc, commitMsg, commitUser, true);
	}

	protected String gitDocMove(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		boolean isRealDoc = srcDoc.getIsRealDoc();
		
		GITUtil verReposUtil = new GITUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, ""))
		{
			return null;
		}

		return verReposUtil.copyDoc(srcDoc, dstDoc, commitMsg, commitUser,true);
	}
	
	protected String verReposDocCopy(Repos repos, boolean isRealDoc, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		int verCtrl = repos.getVerCtrl();
		if(isRealDoc == false)
		{
			//Convert doc to vDoc
			srcDoc = buildVDoc(srcDoc);
			dstDoc = buildVDoc(dstDoc);
			verCtrl = repos.getVerCtrl1();
		}
		
		if(verCtrl == 1)
		{
			commitMsg = commitMsgFormat(repos, srcDoc.getIsRealDoc(), commitMsg, commitUser);
			return svnDocCopy(repos, srcDoc, dstDoc, commitMsg, commitUser, rt);		
		}
		else if(verCtrl == 2)
		{
			return gitDocCopy(repos, srcDoc, dstDoc, commitMsg, commitUser, rt);
		}
		return null;
	}
	
	
	private String svnDocCopy(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, ReturnAjax rt) {
		boolean isRealDoc = srcDoc.getIsRealDoc();
		
		SVNUtil verReposUtil = new SVNUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, ""))
		{
			return null;
		}

		return verReposUtil.copyDoc(srcDoc, dstDoc, commitMsg, commitUser, false);
	}

	protected String gitDocCopy(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		boolean isRealDoc = srcDoc.getIsRealDoc();
		
		GITUtil verReposUtil = new GITUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, ""))
		{
			return null;
		}
		
		return verReposUtil.copyDoc(srcDoc, dstDoc, commitMsg, commitUser, false);
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
	
    /************************* DocSys全文搜索操作接口 ***********************************/
	protected static String getIndexLibPath(Repos repos, int indexLibType) 
	{
		String lucenePath = repos.getPath() + "DocSysLucene/";
		
		String indexLib = null;
		switch(indexLibType)
		{
		case 0:
			indexLib = "repos_" + repos.getId() + "_DocName";
			break;
		case 1:
			indexLib = "repos_" + repos.getId() + "_RDoc";
			break;
		case 2:
			indexLib = "repos_" + repos.getId() + "_VDoc";
			break;
		}
		
		return lucenePath + indexLib;
	}
	
	//Add Index For DocName
	public boolean addIndexForDocName(Repos repos, Doc doc, ReturnAjax rt)
	{
		System.out.println("addIndexForDocName() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		String indexLib = getIndexLibPath(repos,0);

		return LuceneUtil2.addIndex(doc, getDocPath(doc), indexLib);
	}

	//Delete Indexs For DocName
	public static boolean deleteIndexForDocName(Repos repos, Doc doc, ReturnAjax rt)
	{
		System.out.println("deleteIndexForDocName() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		String indexLib = getIndexLibPath(repos,0);

		return LuceneUtil2.deleteIndex(doc, indexLib);
	}
		
	//Update Index For DocName
	public static boolean updateIndexForDocName(Repos repos, Doc doc, Doc newDoc, ReturnAjax rt)
	{
		System.out.println("updateIndexForDocName() docId:" +  doc.getDocId() + " parentPath:" +  doc.getPath()  + " name:" + doc.getName()  + " newParentPath:" + newDoc.getPath() + " newName:" + newDoc.getName() + " repos:" + repos.getName());

		String indexLib = getIndexLibPath(repos,0);

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
		
		String indexLib = getIndexLibPath(repos,2);

		if(content == null || content.isEmpty())
		{
			System.out.println("addIndexForVDoc() content is null or empty, do delete Index");
			return LuceneUtil2.deleteIndex(doc, indexLib);			
		}
		
		return LuceneUtil2.addIndex(doc, content.toString().trim(), indexLib);
	}
	
	//Delete Indexs For VDoc
	public static boolean deleteIndexForVDoc(Repos repos, Doc doc)
	{
		System.out.println("deleteIndexForVDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		String indexLib = getIndexLibPath(repos,2);
		
		return LuceneUtil2.deleteIndex(doc, indexLib);
	}
	
	//Update Index For VDoc
	public boolean updateIndexForVDoc(Repos repos, Doc doc)
	{
		System.out.println("updateIndexForVDoc() docId:" +  doc.getDocId() + " parentPath:" +  doc.getPath()  + " name:" + doc.getName() + " repos:" + repos.getName());

		String indexLib = getIndexLibPath(repos,2);
		
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
		
		String indexLib = getIndexLibPath(repos, 1);

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
			System.out.println("addIndexForRDoc() fileSize is 0, do delete index");
			return LuceneUtil2.deleteIndex(doc,indexLib);
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

		System.out.println("addIndexForRDoc() 未知文件类型不支持索引");
		return false;
	}

	public static boolean deleteIndexForRDoc(Repos repos, Doc doc)
	{
		System.out.println("deleteIndexForRDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		String indexLib = getIndexLibPath(repos, 1);
			
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
