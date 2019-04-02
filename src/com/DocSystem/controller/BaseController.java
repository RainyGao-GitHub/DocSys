package com.DocSystem.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.net.URLEncoder;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.regex.Pattern;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.tools.ant.Project;
import org.apache.tools.ant.taskdefs.Zip;
import org.apache.tools.ant.types.FileSet;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.context.ContextLoader;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.multipart.MultipartFile;
import org.tmatesoft.svn.core.SVNDirEntry;
import org.tmatesoft.svn.core.SVNNodeKind;

import util.CompressPic;
import util.DateFormat;
import util.LuceneUtil2;
import util.ReadProperties;
import util.ReturnAjax;
import util.UUid;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.entity.User;
import com.DocSystem.entity.UserGroup;
import com.DocSystem.service.impl.ReposServiceImpl;
import com.DocSystem.service.impl.UserServiceImpl;
import com.alibaba.fastjson.JSON;

import util.Base64File;
import util.Encrypt.MD5;
import util.GitUtil.GITUtil;
import util.SvnUtil.CommitAction;
import util.SvnUtil.SVNUtil;
@SuppressWarnings("rawtypes")
public class BaseController{
	@Autowired
	protected ReposServiceImpl reposService;
	@Autowired
	protected UserServiceImpl userService;
	//线程锁
	protected static final Object syncLock = new Object(); 
	
	protected Map session;
	protected static String SUCCESS = "success";
	protected static String FAIL = "fail";
	protected static String BASE_PAGE_PATH = "web";
//	protected String rows;// 每页显示的记录数
//	protected String page;// 当前第几页
	
	protected static String[] IMGALLOWDTYPES = {"JPG","JPEG","PNG","GIF","BMP"};
	
	public static String uploadBasePath = "";


	/***************************Basic Functions For Application Level  **************************/
	//To print the obj by convert it to json format
	protected void printObject(String Head,Object obj)
	{
		String json = JSON.toJSONStringWithDateFormat(obj, "yyy-MM-dd HH:mm:ss");
		System.out.println(Head + json);		
	}
	
	//获取默认的仓库根路径
	protected String getDefaultReposRootPath() {
		String path = null;
		
		path = ReadProperties.read("docSysConfig.properties", "defaultReposRootPath");
	    if(path == null || "".equals(path))
	    {
		    String os = System.getProperty("os.name");  
			System.out.println("OS:"+ os);  
			if(os.toLowerCase().startsWith("win")){  
				path = "C:/DocSysReposes/";
			}
			else
			{
				path = "/data/DocSysReposes/";	//Linux系统放在  /data	
			}
	    }
	    
		File dir = new File(path);
		if(dir.exists() == false)
		{
			System.out.println("getDefaultReposRootPath() defaultReposRootPath:" + path + " not exists, do create it!");
			if(dir.mkdirs() == false)
			{
				System.out.println("getDefaultReposRootPath() Failed to create dir:" + path);
			}
		}	 
	    
		return path;
	}
	
	//正确格式化仓库根路径
	protected String dirPathFormat(String path) {
		//如果传入的Path没有带/,给他加一个
		if(path.isEmpty())
		{
			return path;
		}
		
		String endChar = path.substring(path.length()-1, path.length());
		if(!endChar.equals("/"))	
		{
			path = path + "/";
		}
		return path;
	}

	//系统日志所在的目录
	protected String getSystemLogParentPath() {
		String path = "";		
		path = ReadProperties.read("docSysConfig.properties", "SystemLogParentPath");
	    if(path == null || "".equals(path))
	    {
			String os = System.getProperty("os.name");  
			System.out.println("OS:"+ os);  
			if(os.toLowerCase().startsWith("win")){  
				path = "C:/xampp/tomcat/logs/";
			}
			else
			{
				path = "/var/lib/tomcat7/logs/";	//Linux系统放在  /data	
			}
	    }    
		return path;
	}
	
	//系统日志的名字，可以是目录或文件
	protected String getSystemLogFileName() {
		String name = "";
		
		name = ReadProperties.read("docSysConfig.properties", "SystemLogFileName");
	    if(name == null || "".equals(name))
	    {
			name = "catalina.log";
	    }	    
		return name;
	}
	
	//获取仓库的实文件的本地存储根路径
	protected String getReposRealPath(Repos repos)
	{
		if(repos.getType() == 1)
		{
			return repos.getPath();
		}
		String reposRPath = repos.getPath() + repos.getId() + "/data/rdata/";	//实文件系统的存储数据放在data目录下 
		System.out.println("getReposRealPath() " + reposRPath);
		return reposRPath;
	}
	
	//获取仓库的虚拟文件的本地存储根路径
	protected String getReposVirtualPath(Repos repos)
	{
		String reposVPath = repos.getPath() + repos.getId() + "/data/vdata/";	//实文件系统的存储数据放在data目录下 
		System.out.println("getReposVirtualPath() " + reposVPath);
		return reposVPath;
	}

	
	//获取Parentpath: 如果是File则返回其parentPath，如果是Directory则返回全路径
	protected String getParentPath(Integer id)
	{
		String parentPath = "";
		Doc doc = reposService.getDocInfo(id); //获取当前doc的信息
		if(doc != null)
		{
			if(doc.getType() == 2)
			{
				parentPath = getParentPath(doc.getPid()) + doc.getName() + "/";
			}
			else
			{
				parentPath = getParentPath(doc.getPid());				
			}
		}
		return parentPath;
	}	
	
	protected String getDocVPath(String parentPath, String docName) 
	{
		String VPath = MD5.md5(parentPath) + "_" + docName;
		System.out.println("getDocVPath() " + VPath + " for " + parentPath + docName);
		return VPath;
	}
	
	//UserTmp Path on every repos, it was recommended to use, that have good copy performance
	protected String getReposUserTmpPath(Repos repos, User login_user) {
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/" + login_user.getId() + "/";
		createDir(userTmpDir);
		return userTmpDir;
	}
	
	//WebTmpPath was accessable for web
	protected String getWebUserTmpPath(User login_user) {
        WebApplicationContext wac = ContextLoader.getCurrentWebApplicationContext();
        
        String webUserTmpPath =  wac.getServletContext().getRealPath("/").replaceAll("/",File.separator) +  "/tmp/" + login_user.getId() + "/";
        System.out.println("getWebUserTmpPath() webUserTmpPath" + webUserTmpPath);
		return webUserTmpPath;
	}
	
	//WebTmpPath was 
	protected String getWebTmpPath() {
        WebApplicationContext wac = ContextLoader.getCurrentWebApplicationContext();
        
        String webTmpPath =  wac.getServletContext().getRealPath("/").replaceAll("/",File.separator) +  "/tmp/";
        System.out.println("getWebTmpPath() webTmpPath" + webTmpPath);
		return webTmpPath;
	}
	
	//获取本地仓库默认存储位置（相对于仓库的存储路径）
	protected String getDefaultLocalVerReposPath(String path) {
		String localSvnPath = path + "DocSysVerReposes/";
		return localSvnPath;
	}
	
	protected String getLocalVerReposURI(Repos repos, boolean isRealDoc) {
		String localVerReposURI = null;

		Integer verCtrl = null;
		String localSvnPath = null;

		if(isRealDoc)
		{
			verCtrl = repos.getVerCtrl();
			localSvnPath = repos.getLocalSvnPath();
		}
		else
		{
			verCtrl = repos.getVerCtrl1();
			localSvnPath = repos.getLocalSvnPath1();
		}	

		String reposName = getVerReposName(repos,isRealDoc);
		
		if(verCtrl == 1)
		{
			localVerReposURI = "file:///" + localSvnPath + reposName;
		}
		else
		{
			localVerReposURI = null;
			
		}
		return localVerReposURI;
	}
	
	protected String getLocalVerReposPath(Repos repos, boolean isRealDoc) {
		String localVerReposPath = null;
		
		String localSvnPath = null;
		if(isRealDoc)
		{
			localSvnPath = repos.getLocalSvnPath();
		}
		else
		{
			localSvnPath = repos.getLocalSvnPath1();
		}	
		
		localSvnPath = dirPathFormat(localSvnPath);

		String reposName = getVerReposName(repos,isRealDoc);
		
		localVerReposPath = localSvnPath + reposName + "/";
		return localVerReposPath;
	}

	protected String getVerReposName(Repos repos,boolean isRealDoc) {
		String reposName = null;
		
		Integer id = repos.getId();
		if(isRealDoc)
		{
			Integer verCtrl = repos.getVerCtrl();
			if(verCtrl == 1)
			{
				reposName = id + "_SVN_RRepos";
			}
			else if(verCtrl == 2)
			{ 
				if(repos.getIsRemote() == 0)
				{
					reposName = id + "_GIT_RRepos";
				}
				else
				{
					reposName = id + "_GIT_RRepos_Remote";					
				}
			}
		}
		else
		{
			Integer verCtrl = repos.getVerCtrl1();			
			if(verCtrl == 1)
			{
				reposName = id + "_SVN_VRepos";
			}
			else if(verCtrl == 2)
			{
				if(repos.getIsRemote1() == 0)
				{
					reposName = id + "_GIT_VRepos";
				}
				else
				{
					reposName = id + "_GIT_VRepos_Remote";					
				}
			}
		}
		return reposName;
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
	
	private void xorReposAuth(ReposAuth auth, ReposAuth tmpAuth) {
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
	
	private void xorDocAuth(DocAuth auth, DocAuth tmpAuth) {
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
	
	
	protected boolean isAdminOfDoc(User login_user, Integer docId, Integer reposId) {
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			System.out.println("超级管理员");
			return true;
		}
		
		DocAuth userDocAuth = getUserDocAuth(login_user.getId(), docId, reposId);
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
	protected DocAuth getGroupDispDocAuth(Integer groupId,Integer docId, Integer reposId) {
		System.out.println("getGroupDispDocAuth() groupId:"+groupId);
		DocAuth docAuth = getGroupDocAuth(groupId,docId,reposId);	//获取用户真实的权限
		
		 String groupName = getGroupName(groupId);
		 Doc doc = getDocInfo(docId);
		//转换成可显示的权限
		if(docAuth == null)
		{
			docAuth = new DocAuth();
			docAuth.setGroupId(groupId);
			docAuth.setGroupName(groupName);
			docAuth.setDocId(docId);
			if(doc != null)
			{
				docAuth.setDocName(doc.getName());
				docAuth.setDocPath(doc.getPath());
			}
			docAuth.setReposId(reposId);
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
			if(doc != null)
			{
				docAuth.setDocName(doc.getName());
				docAuth.setDocPath(doc.getPath());
			}
			docAuth.setReposId(reposId);
		}
		return docAuth;
	}

	protected Doc getDocInfo(Integer docId) {
		if(docId == 0)
		{
			return null;
		}
		return reposService.getDocInfo(docId);
	}

	//获取用户的用于显示的docAuth
	public DocAuth getUserDispDocAuth(Integer UserID,Integer DocID,Integer ReposID)
	{
		System.out.println("getUserDispDocAuth() UserID:"+UserID);
		DocAuth docAuth = getUserDocAuth(UserID,DocID,ReposID);	//获取用户真实的权限
		printObject("getUserDispDocAuth() docAuth:",docAuth);
		
		//Get UserName
		String UserName = getUserName(UserID);
		Doc doc = getDocInfo(DocID);
		
		//转换成可显示的权限
		if(docAuth == null)
		{
			docAuth = new DocAuth();
			docAuth.setUserId(UserID);
			docAuth.setUserName(UserName);
			docAuth.setDocId(DocID);
			if(doc != null)
			{
				docAuth.setDocName(doc.getName());
				docAuth.setDocPath(doc.getPath());
			}
			docAuth.setReposId(ReposID);
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
			if(doc != null)
			{
				docAuth.setDocName(doc.getName());
				docAuth.setDocPath(doc.getPath());
			}
			docAuth.setReposId(ReposID);
		}
		return docAuth;
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

	protected DocAuth getGroupDocAuth(Integer groupId,Integer docId, Integer reposId)
	{
		return getRealDocAuth(null, groupId, docId, reposId);
	}
	
	protected DocAuth getUserDocAuth(Integer userId,Integer docId, Integer reposId) 
	{
		return getRealDocAuth(userId, null, docId, reposId);
	}
	
	//Function:getUserDocAuth
	protected DocAuth getRealDocAuth(Integer userId,Integer groupId,Integer docId, Integer reposId) 
	{
		System.out.println("getRealDocAuth() userId:"+userId + " groupId:"+ groupId + " docId:"+docId  + " reposId:"+reposId);
		
		//获取从docId到rootDoc的全路径，put it to docPathList
		List<Integer> docIdList = new ArrayList<Integer>();
		docIdList = getDocIdList(docId,docIdList);
		if(docIdList == null || docIdList.size() == 0)
		{
			return null;
		}
		printObject("getRealDocAuth() docIdList:",docIdList); 
		
		//Get UserDocAuthHashMap
		HashMap<Integer,DocAuth> docAuthHashMap = null;
		if(userId != null)
		{
			docAuthHashMap = getUserDocAuthHashMap(userId,reposId);
		}
		else
		{
			docAuthHashMap = getGroupDocAuthHashMap(groupId,reposId);
		}
		
		//go throug the docIdList to get the UserDocAuthFromHashMap
		DocAuth parentDocAuth = null;
		DocAuth docAuth = null;
		int docPathDeepth = docIdList.size();
		for(int i=(docPathDeepth-1);i>=0;i--)
		{
			Integer curDocId = docIdList.get(i);
			System.out.println("getRealDocAuth() curDocId[" + i+ "]:" + curDocId); 
			docAuth = getDocAuthFromHashMap(curDocId,parentDocAuth,docAuthHashMap);
			parentDocAuth = docAuth;
		}		
		return docAuth;
	}

	protected List<Integer> getDocIdList(Integer docId,List<Integer> docIdList) {
		if(docId == null || docId == 0)
		{
			docIdList.add(0);
			return docIdList;
		}
		
		//If the doc exist
		Doc doc = reposService.getDocInfo(docId);
		if(doc != null)
		{
			docIdList.add(docId);
			return getDocIdList(doc.getPid(),docIdList);
		}
		
		System.out.println("getDocIdList() docId:" + docId + " is null");
		return docIdList;
	}

	//这是一个非常重要的底层接口，每个doc的权限都是使用这个接口获取的
	protected DocAuth getDocAuthFromHashMap(int docId, DocAuth parentDocAuth,HashMap<Integer,DocAuth> docAuthHashMap)
	{
		//System.out.println("getDocAuthFromHashMap() docId:" + docId);
		if(docAuthHashMap == null)
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
					return null;
				}
				return parentDocAuth;
			}
		}
	}
	
	protected HashMap<Integer,DocAuth> getUserDocAuthHashMap(Integer UserID,Integer reposID) 
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
		
		HashMap<Integer,DocAuth> hashMap = BuildHashMapByDocAuthList(docAuthList);
		printObject("getUserDocAuthHashMap() "+ "userID:" + UserID + " hashMap:", hashMap);
		return hashMap;
	}
	
	//获取组在仓库上所有doc的权限设置: 仅用于显示group的权限
	protected HashMap<Integer,DocAuth> getGroupDocAuthHashMap(Integer GroupID,Integer reposID) 
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
		
		HashMap<Integer,DocAuth> hashMap = BuildHashMapByDocAuthList(docAuthList);
		printObject("getGroupDocAuthHashMap() GroupID[" + GroupID +"] hashMap:", hashMap);
		return hashMap;
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
	
	private HashMap<Integer,DocAuth> BuildHashMapByDocAuthList(List<DocAuth> docAuthList) {
		//去重并将参数放入HashMap
		HashMap<Integer,DocAuth> hashMap = new HashMap<Integer,DocAuth>();
		for(int i=0;i<docAuthList.size();i++)
		{
			DocAuth docAuth = docAuthList.get(i);
			Integer docId = docAuth.getDocId();
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
		
	/***************************Basic Functions For Driver Level  **************************/
	protected boolean addLog(String logContent, String logCode) {
		
		return true;
	}
	
	protected boolean isLogined() {
		return false;
	}
	
	//获取当前登录用户信息
	protected User getCurrentUser(HttpSession session){
		User user = (User) session.getAttribute("login_user");
		System.out.println("get sessionId:"+session.getId());
		return user;
		
	}
	
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
	
	/**
	 * 向页面返回json信息
	 * @param obj
	 * @param response
	 */
	protected void writeJson(Object obj,HttpServletResponse response) {
		
		try {
			response.setCharacterEncoding("UTF-8");
			String json = JSON.toJSONStringWithDateFormat(obj, "yyy-MM-dd HH:mm:ss");
			PrintWriter pw = response.getWriter();
			response.setContentType("application/javascript");
			pw.write(json);
			pw.flush();
			pw.close();
		} catch (IOException e) {
			System.out.println("BaseController>writeJson  ERROR!");
			e.printStackTrace();
		}
		
	}
	
	/**
	 * 设置cookie
	 * @param response
	 * @param name  cookie名字
	 * @param value cookie值
	 * @param maxAge cookie生命周期  以秒为单位
	 */
	public static void addCookie(HttpServletResponse response,String name,String value,int maxAge){
	    Cookie cookie = new Cookie(name,value);
	    cookie.setPath("/");
	    if(maxAge>0)  cookie.setMaxAge(maxAge);
	    response.addCookie(cookie);
	}
	
	/**
	 * 根据名字获取cookie
	 * @param request
	 * @param name cookie名字
	 * @return
	 */
	public static Cookie getCookieByName(HttpServletRequest request,String name){
	    Map<String,Cookie> cookieMap = ReadCookieMap(request);
	    if(cookieMap.containsKey(name)){
	        Cookie cookie = (Cookie)cookieMap.get(name);
	        return cookie;
	    }else{
	        return null;
	    }   
	}
	
	/**
	 * 将cookie封装到Map里面
	 * @param request
	 * @return
	 */
	private static Map<String,Cookie> ReadCookieMap(HttpServletRequest request){  
	    Map<String,Cookie> cookieMap = new HashMap<String,Cookie>();
	    Cookie[] cookies = request.getCookies();
	    if(null!=cookies){
	        for(Cookie cookie : cookies){
	            cookieMap.put(cookie.getName(), cookie);
	        }
	    }
	    return cookieMap;
	}
	
	/**
	 * 保存前台传回的图片
	 * @param imgFile
	 * @param path 保存地址
	 * @oaram compressPath 压缩图片地址
	 * @return 上传文件名称
	 */
	public String saveImg(MultipartFile imgFile,String path,String compressPath,boolean limitType)throws Exception{
		String imgName = imgFile.getOriginalFilename();
		String ext = imgName.substring(imgName.lastIndexOf('.')+1);
		ext = ext.toLowerCase();
		//可以上传的图片类型
		//定义一个数组，用于保存可上传的文件类型
		
		
		long fileSize = imgFile.getSize();
		if(fileSize==0){
			return null;
		}
		System.out.println("文件大小：" + Math.floor(fileSize/1024));
		if(limitType){
			if(fileSize>200*1024*1024){
				throw new FileUploadException("上传文件过大");
			}
			List<String> fileTypes = new ArrayList<String>();
			fileTypes.add("jpg");
			fileTypes.add("jpeg");
			fileTypes.add("bmp");
			fileTypes.add("gif");
			fileTypes.add("png");
			if(!fileTypes.contains(ext)){
				throw new Exception("上传文件格式不支持");
			}
		}else{
			if(fileSize>20*1024*1024){
				throw new FileUploadException("上传图片过大");
			}
		}
		File _imgFile = null;
		String _fileName = "";
		
		if(imgName!=null&&!"".equals(imgName)){
			File forder1 = new File(path);
			if(forder1.exists()){
			}else{
				forder1.mkdirs();
			}
			_fileName = generateDateAndRadom() + "." + ext;
			_imgFile = new File(path,_fileName);
			try {
				imgFile.transferTo(_imgFile);
				//压缩图片到smallPic目录
				if(limitType&&path!=null&&!path.equals("")&&compressPath!=null&&!compressPath.equals("")){
					CompressPic cp = new CompressPic();
					cp.setInputDir(path);
					cp.setOutputDir(compressPath);
					cp.setInputFileName(_imgFile.getName());
					cp.setOutputFileName(_imgFile.getName());
					cp.compressPic();
				}
			} catch (Exception e) {
				throw new Exception("上传图片保存本地图片失败，源文件名：" + imgName);
			}
		}
		return _fileName;
	}
	
	public ReturnAjax saveImgAjax(String folder,String file,String fileName,String compressPath,boolean limitType)throws Exception{
		ReturnAjax rt = new ReturnAjax();
		String ext = fileName.substring(fileName.lastIndexOf("."));
		long fileSize = file.length();
		System.out.println("文件大小：" + Math.floor(fileSize/1024));
		if(fileSize==0){
			return null;
		}
		if(limitType){
			if(fileSize>20*1024*1024){
				throw new FileUploadException("上传文件过大");
			}
			List<String> fileTypes = new ArrayList<String>();
			fileTypes.add("jpg");
			fileTypes.add("jpeg");
			fileTypes.add("bmp");
			fileTypes.add("gif");
			fileTypes.add("png");
			if(!fileTypes.contains(ext)){
				throw new Exception("上传文件格式不支持");
			}
		}else{
			if(fileSize>200*1024*1024){
				throw new FileUploadException("上传图片过大");
			}
		}
		try {
			String _fileName = generateDateAndRadom() + ext;
			Base64File.decode(file, folder + File.separator, _fileName);
			System.out.println("上传路径："+folder+";上传名称：" + _fileName);
			//压缩图片到smallPic目录
			if(limitType&&folder!=null&&!folder.equals("")&&compressPath!=null&&!compressPath.equals("")){
				CompressPic cp = new CompressPic();
				cp.setInputDir(folder);
				cp.setOutputDir(compressPath);
				cp.setInputFileName(_fileName);
				cp.setOutputFileName(_fileName);
				cp.compressPic();
			}
			rt.setData(_fileName);
		} catch (Exception e) {
			e.printStackTrace();
			rt.setError("上传图片失败。");
			rt.setData("上传图片失败。");
		}
		return rt;
	}
	
	protected String generateDateAndRadom(){
		Date date = new Date();
		String dateStr = DateFormat.dateTimeFormat2(date);
		String r = Math.round(Math.random()*100000)+"";
		System.out.println(dateStr+";"+r);
		return "freeteam"+dateStr+"_"+r;
	}
	
	protected boolean checkImgType(String type) {
		String upperType = type.toUpperCase();
		for(String s: IMGALLOWDTYPES){
			if(upperType.equals(s)||upperType.endsWith(s)){
				return true;
			}
		}
		return false;
	}
	
	/**
	 * 时间戳+随机数订单ID
	 * @return
	 */
	public String getUUID(String idstr){
		return UUid.getUUID(idstr);
	}
	//============================ getters and setters ========================================

	public Map getSession() {
		return session;
	}

	public void setSession(Map session) {
		this.session = session;
	}

	
	/*Local Functions*/
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
	
	//File Operation Functions
    public boolean compressExe(String srcPathName,String finalFile) {
    	File zipFile = new File(finalFile);	//finalFile
    	
        File srcdir = new File(srcPathName); //srcFile or Dir
        if (!srcdir.exists()){
        	System.out.println(srcPathName + "不存在！");
        	return false;
        }   
            
        Project prj = new Project();    
        Zip zip = new Zip();    
        zip.setProject(prj);    
        zip.setDestFile(zipFile);    
        FileSet fileSet = new FileSet();    
        fileSet.setProject(prj);    
        fileSet.setDir(srcdir);    
        //fileSet.setIncludes("**/*.java"); //包括哪些文件或文件夹 eg:zip.setIncludes("*.java");    
        //fileSet.setExcludes(...); //排除哪些文件或文件夹    
        zip.addFileset(fileSet);    
        zip.execute();  
		
        if(zipFile.exists())
        {
        	return true;
        }
        return false;
    }
    
    public boolean copyFile(String srcFilePath,String dstFilePath,boolean cover){
        File dstFile=new File(dstFilePath);
        if(dstFile.exists())
        {
        	if(cover == false)
        	{
        		//不允许覆盖
        		System.out.println("copyFile() " + dstFilePath + " exists!");
        		return false;
        	}        	
        }
//        else
//        {
//        	try {
//				dstFile.createNewFile();
//			} catch (IOException e) {
//				// TODO Auto-generated catch block
//				System.out.println("copyFile() Failed to createNewFile");
//				e.printStackTrace();
//				return false;
//			}
//        }
        
        try {
	        //Copy by Channel
	        FileInputStream in=new FileInputStream(srcFilePath);
	        FileOutputStream out=new FileOutputStream(dstFilePath);
	        FileChannel inputChannel = in.getChannel();    
	        FileChannel outputChannel = out.getChannel();   
	        outputChannel.transferFrom(inputChannel, 0, inputChannel.size());
		   	inputChannel.close();
		    outputChannel.close();
		    in.close();
		    out.close();
        }
    	catch (Exception e) { 
    		System.out.println("copyFile() copy file Exception"); 
    		e.printStackTrace(); 
    		return false;
    	}
    	return true;
    }
    
    public boolean copyDir(String srcPath, String dstPath, boolean cover) 
    {
	    try {
	    	//Check the newPath
	    	File dstDir = new File(dstPath);
	    	if(dstDir.exists())
	    	{
	    		if(cover == false)
	    		{
	    			System.out.println("copyDir() dstPath exists:"+dstPath);
	    			return false;	    			
	    		}
	    	}
	    	else
	    	{
	    		//mkdirs will create the no exists parent dir, so I use the mkdir
	    		if(dstDir.mkdir() == false)
	    		{
	    			System.out.println("copyDir() Failed to create dir:"+dstPath);
	    			return false;
	    		}
	    	}
	    	
	    	//Check the srcDir
	    	File srcDir = new File(srcPath); 
		    String[] file=srcDir.list(); 
		    File temp=null; 
		    for (int i = 0; i < file.length; i++) 
		    { 
		    	String subSrcFilePath = null;
		    	String subDstFilePath = null;
		    	if(srcPath.endsWith(File.separator))
		    	{ 
		    		subSrcFilePath = srcPath+file[i];
		    		subDstFilePath = dstPath + file[i];
		    	} 
		    	else
		    	{ 
		    		subSrcFilePath = srcPath+File.separator+file[i];
		    		subDstFilePath = dstPath+File.separator+file[i];
		    	} 

	    		temp=new File(subSrcFilePath); 
		    	if(temp.isFile())
		    	{ 
		    		copyFile(subSrcFilePath, subDstFilePath, cover);
		    	}
		    	else //if(temp.isDirectory()) //如果是子文件夹
		    	{ 
		    		copyDir(subSrcFilePath, subDstFilePath, cover); 
		    	} 
		    } 
	    } 
	    catch (Exception e) 
	    { 
	    	System.out.println("copyDir 异常"); 
	    	e.printStackTrace(); 
	    	return false;
	    }
	    return true;
    }
    
    //Copy FileOrDir
    public boolean copyFileOrDir(String srcPath, String dstPath,boolean cover){
	    //Check the newPath
	    File dstDir = new File(dstPath);
	    if(dstDir.exists())
	    {
	    	if(cover == false)
	    	{
	    		System.out.println("copyFileOrDir() dstPath exists:"+dstPath);
	    		return false;	    			
	    	}
	    }
	    
	    File srcDir = new File(srcPath);
	    if(srcDir.isFile())
	    {
	    	if(false == copyFile(srcPath, dstPath, cover))
	    	{
	    		System.out.println("copyFileOrDir() copyFile Failed:"+dstPath);
		    	return false;
	    	}
	    }
	    else
	    {
	    	if(false == copyDir(srcPath, dstPath, cover))
	    	{
	    		System.out.println("copyFileOrDir() copyDir Failed:"+dstPath);
		    	return false;
	    	}
	    }
	    return true;
	}
    
    //将dstDirPath同步成srcDirPath
	protected boolean syncUpFolder(String srcParentPath,String srcName, String dstParentPath, String dstName,boolean modifyEnable) 
	{
		String srcPath =  srcParentPath + srcName;
		String dstPath =  dstParentPath + dstName;
		
		//If the dstDirPath 不存在则，直接复制整个目录
		File dstFolder = new File(dstPath);
		if(!dstFolder.exists())
		{
			return copyDir(srcPath,dstPath,true);
		}
	
		if(dstFolder.isFile())
		{
			System.out.println(dstPath + " 不是目录！");
			return false;
		}

		try {
			
			//SyncUpForDelete
			syncUpForDelete(srcParentPath,srcName,dstParentPath,dstName);
			
			//SyncUpForAddAndModify
			if(modifyEnable)
			{
				syncUpForAddAndModify(srcParentPath,srcName,dstParentPath,dstName);
			}
			else
			{
				syncUpForAdd(srcParentPath,srcName,dstParentPath,dstName);
			}
		} catch (IOException e) {
			System.out.println("syncUpFolder() Exception!");
			e.printStackTrace();
			return false;
		}
		return true;
	}
    
    private void syncUpForAdd(String srcParentPath,String srcName, String dstParentPath, String dstName) throws IOException {
    	System.out.println("syncUpForAddAndModify() srcParentPath:" + srcParentPath + " srcName:" + srcName + " dstParentPath:" + dstParentPath + " dstName:" + dstName );
    	String srcPath = srcParentPath + srcName;
    	String dstPath = dstParentPath + dstName;
    	
    	File srcFile = new File(srcPath);
    	File dstFile = new File(dstPath);
        if(srcFile.exists())
        {
        	if(!dstFile.exists())
        	{
        		if(srcFile.isDirectory())
        		{
        			dstFile.mkdir();	//新建目录
        		}
        		else
        		{
        			copyFile(srcPath,dstPath,false);
        		}
        	}
        	
            //Go through the subEntries
        	if(srcFile.isDirectory())
        	{
    			File[] tmp=srcFile.listFiles();
        		for(int i=0;i<tmp.length;i++)
        		{
        			String subEntryName = tmp[i].getName();
        			syncUpForAdd(srcPath+"/", subEntryName, dstPath + "/", subEntryName);
                }
            }
       }	
	}

	private void syncUpForAddAndModify(String srcParentPath,String srcName, String dstParentPath, String dstName) throws IOException {
    	System.out.println("syncUpForAddAndModify() srcParentPath:" + srcParentPath + " srcName:" + srcName + " dstParentPath:" + dstParentPath + " dstName:" + dstName );
    	String srcPath = srcParentPath + srcName;
    	String dstPath = dstParentPath + dstName;
    	
    	File srcFile = new File(srcPath);
    	File dstFile = new File(dstPath);
        if(srcFile.exists())
        {
        	if(!dstFile.exists())
        	{
        		if(srcFile.isDirectory())
        		{
        			dstFile.mkdir();	//新建目录
        		}
        		else
        		{
        			copyFile(srcPath,dstPath,false);
        		}
        	}
        	else
        	{
        		if(srcFile.isFile())
        		{
        			copyFile(srcPath,dstPath,true);
        		}
        	}
        	
            //Go through the subEntries
        	if(srcFile.isDirectory())
        	{
    			File[] tmp=srcFile.listFiles();
        		for(int i=0;i<tmp.length;i++)
        		{
        			String subEntryName = tmp[i].getName();
        			syncUpForAddAndModify(srcPath+"/", subEntryName, dstPath + "/", subEntryName);
                }
            }
       }	
	}

	private void syncUpForDelete(String srcParentPath, String srcName, String dstParentPath, String dstName) {
    	System.out.println("syncUpForDelete() srcParentPath:" + srcParentPath + " srcName:" + srcName + " dstParentPath:" + dstParentPath + " dstName:" + dstName );
    	String srcPath = srcParentPath + srcName;
    	String dstPath = dstParentPath + dstName;
    	
    	File srcFile = new File(srcPath);
    	File dstFile = new File(dstPath);
        if(dstFile.exists())
        {
        	if(!srcFile.exists())
        	{
        		delDir(dstPath);	//删除目录或文件
        		return;
        	}
        	else
        	{
        		if(dstFile.isDirectory() != srcFile.isDirectory())	//类型不同
        		{
        			delDir(dstPath); //删除目录或文件
            		return;
        		}
        	}
        	
            //Go through the subEntries
        	if(dstFile.isDirectory())
        	{
    			File[] tmp=dstFile.listFiles();
        		for(int i=0;i<tmp.length;i++)
        		{
        			String subEntryName = tmp[i].getName();
        			syncUpForDelete(srcPath+"/", subEntryName, dstPath + "/", subEntryName);
                }
            }
       }
	}
	
    //Move FileOrDir
    public boolean moveFileOrDir(String oldpath,String oldName,String newpath,String newName,boolean cover){
    	
    	String oldFilePath = oldpath + oldName;
    	String newFilePath = newpath + newName;
    	
    	if(!oldFilePath.equals(newFilePath))
        {
            File oldfile=new File(oldFilePath);
            if(oldfile.exists() == false)
            {
            	System.out.println("moveFile() oldFilePath:" + oldFilePath + " does not exist");
            	return false;
            }
            
            File newfile=new File(newFilePath);
            if(newfile.exists()) //若在待转移目录下，已经存在待转移文件
            {
            	System.out.println("moveFile() newFilePath:" + newFilePath + " already exists");
            	if(cover)//覆盖
                {
                	System.out.println("moveFile() 强制覆盖！");
                    return oldfile.renameTo(newfile);
                }
                else
                {
                    return false;
                }
            }
            else
            {
            	return oldfile.renameTo(newfile);
            }
        }
        else
        {
        	System.out.println("moveFile() newFilePath:" + newFilePath + " is same to oldFilePath:" + oldFilePath);
        	return true;
        }
    }
    
    //Create Directory
    public boolean createDir(String path){
        File dir=new File(path);
        if(!dir.exists())
        {
            return dir.mkdir();
        }
        else
        {
        	return true;
        }
    }
    
    //Create File
    public boolean createFile(String path,String filename){
        File dir = new File(path);
        if(!dir.exists())
        {
        	return false;
        }
        
    	File file=new File(path+"/"+filename);
        if(!file.exists())
        {    
        	try {
				return file.createNewFile();
			} catch (IOException e) {
				e.printStackTrace();
				return false;
			}
        }
        else
        {
        	return true;
        }
    }
    //Delete File
    public boolean delFile(String path){
        File file=new File(path);
        if(file.exists())
        {
        	if(file.isFile())
        	{
        		return file.delete();	
        	}
        	else
        	{
        		return false;
        	}
        }
        return true;
    }
    
    //Delete Directory, path must be dir path
    public boolean delDir(String path){
        File dir=new File(path);
        if(dir.exists())
        {
            File[] tmp=dir.listFiles();            
            for(int i=0;i<tmp.length;i++)
            {
            	String subDirPath = path+"/"+tmp[i].getName();
                if(tmp[i].isDirectory())
                {
                    if(delDir(subDirPath) == false)
                    {
                    	System.out.println("delDir() delete subDir Failed:" + subDirPath);
                    	return false;
                    }
                }
                else
                {
                    if(tmp[i].delete() == false)
                    {
                    	System.out.println("delDir() delete subFile Failed:" + subDirPath);
                    	return false;
                    }
                }
            }
            if(dir.delete() == false)
            {
            	System.out.println("delDir() delete Dir Failed:" + path);
                return false;
            }
        }
        return true;
    }
	
    //Delete Directory or File
    public boolean delFileOrDir(String path){
        File file=new File(path);
        if(file.exists())
        {
            if(file.isDirectory())
            {
	            File[] tmp=file.listFiles();            
	            for(int i=0;i<tmp.length;i++)
	            {
	            	String subDirPath = path+"/"+tmp[i].getName();
	                if(delFileOrDir(subDirPath) == false)
	                {
	                	System.out.println("delFileOrDir() delete subDir Failed:" + subDirPath);
	                    return false;
	                }
	            }
            }
            
            if(file.delete() == false)
            {
            	System.out.println("delFileOrDir() delete Dir Failed:" + path);
                return false;
            }
        }
        return true;
    }
    //检查文件是否存在
    public boolean isFileExist(String path){
    	File file=new File(path);
        return file.exists();
    }
    
	public String saveFile(MultipartFile srcFile,String path,String fileName)throws Exception{		
		if(fileName==null || "".equals(fileName))
		{
			System.out.println("saveFile() fileName is empty!");
			return null;
		}
		
		//底层接口不能主动创建上层目录，不存在上层目录则直接报错
		File forder1 = new File(path);
		if(!forder1.exists())
		{
			System.out.println("saveFile() path:" + path + " not exists!");
			//forder1.mkdirs(); //创建目录
			return null;
		}
		
		File dstFile = new File(path,fileName);
		try {
			srcFile.transferTo(dstFile);
		} catch (Exception e) {
			throw new Exception("文件保存到本地失败，源文件名：" + fileName);
		}
		return fileName;
	}

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
	
	private int getLocalEntryType(String localParentPath, String entryName) {
		
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
	
	protected void sendTargetToWebPage(String localParentPath, String targetName, String tmpDir, ReturnAjax rt,HttpServletResponse response, HttpServletRequest request) throws Exception {
		
		int entryType = getLocalEntryType(localParentPath,targetName);

		//For dir 
		if(entryType == 2) //目录
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

	private boolean doCompressDir(String srcParentPath, String dirName, String dstParentPath, String zipFileName,ReturnAjax rt) {
		
		//if dstDir not exists create it
		File dstDir = new File(dstParentPath);
		if(!dstDir.exists())
		{
			if(createDir(dstParentPath) == false)
			{
				System.out.println("doCompressDir() Failed to create:" + dstParentPath);	
				rt.setMsgData("创建目录 " + dstParentPath + " 失败");
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
			rt.setMsgData("压缩  " + srcParentPath + dirName + "to" + dstParentPath + zipFileName  +" 失败");
			return false;
		}
		
		return true;
	}

	/***************Commont Interfaces for verRepos ***************/
	protected void insertAddFileAction(List<CommitAction> actionList,
			String parentPath, String entryName, String localPath, boolean isSubAction) {
    	CommitAction action = new CommitAction();
    	action.setAction(1);
    	action.setEntryType(1);
    	action.setEntryParentPath(parentPath);
    	action.setEntryName(entryName);
    	action.setEntryPath(parentPath + entryName);
    	action.setLocalPath(localPath);
    	action.isSubAction = isSubAction;
    	actionList.add(action);
		
	}
    
	protected void insertAddDirAction(List<CommitAction> actionList,
			String parentPath, String entryName, boolean isSubAction, boolean hasSubList, List<CommitAction> subActionList) {
    	CommitAction action = new CommitAction();
    	action.setAction(1);
    	action.setEntryType(2);
    	action.setEntryParentPath(parentPath);
    	action.setEntryName(entryName);
    	action.setEntryPath(parentPath + entryName);
    	action.isSubAction = isSubAction;
    	action.hasSubList = hasSubList;
    	action.setSubActionList(subActionList);
    	actionList.add(action);
    	
	}
	
	protected void insertDeleteAction(List<CommitAction> actionList,String parentPath, String entryName) {
    	CommitAction action = new CommitAction();
    	action.setAction(2);
    	action.setEntryParentPath(parentPath);
    	action.setEntryName(entryName);
    	action.setEntryPath(parentPath + entryName);
    	actionList.add(action);
	}
    
	protected void insertModifyFile(List<CommitAction> actionList, String parentPath, String entryName, String localPath, String localRefPath) {
    	CommitAction action = new CommitAction();
    	action.setAction(3);
    	action.setEntryParentPath(parentPath);
    	action.setEntryName(entryName);
    	action.setEntryPath(parentPath + entryName);
    	action.setLocalPath(localPath);
    	action.setLocalRefPath(localRefPath);
    	actionList.add(action);	
	}
	
	/********************************** Functions For Application Layer ****************************************/
	//底层addDoc接口
	protected Integer addDoc(String name, String content, Integer type, MultipartFile uploadFile, Integer fileSize, String checkSum,Integer reposId,Integer parentId, 
			Integer chunkNum, Integer chunkSize, String chunkParentPath, String commitMsg,String commitUser,User login_user, ReturnAjax rt) {
		Repos repos = reposService.getRepos(reposId);
		//get parentPath
		String parentPath = getParentPath(parentId);
		String reposRPath = getReposRealPath(repos);
		String localDocRPath = reposRPath + parentPath + name;
		
		//判断目录下是否有同名节点 
		Doc tempDoc = getDocByName(name,parentId,reposId);
		if(tempDoc != null)
		{
			if(type == 2)	//如果是则目录直接成功
			{
				rt.setMsg("Node: " + name +" 已存在！", "dirExists");
				rt.setData(tempDoc);
			}
			else
			{
				rt.setError("Node: " + name +" 已存在！");
				System.out.println("addDoc() " + name + " 已存在");
			}
			return null;		
		}
		
		//以下代码不可重入，使用syncLock进行同步
		Doc doc = new Doc();
		synchronized(syncLock)
		{
			//Check if parentDoc was absolutely locked (LockState == 2)
			if(isParentDocLocked(parentId,null,rt))
			{	
				unlock(); //线程锁
				rt.setError("ParentNode: " + parentId +" is locked！");	
				System.out.println("ParentNode: " + parentId +" is locked！");
				return null;			
			}
				
			//新建doc记录,并锁定
			doc.setName(name);
			doc.setType(type);
			doc.setSize(fileSize);
			doc.setCheckSum(checkSum);
			doc.setContent(content);
			doc.setPath(parentPath);
			doc.setVid(reposId);
			doc.setPid(parentId);
			doc.setCreator(login_user.getId());
			//set createTime
			long nowTimeStamp = new Date().getTime();//获取当前系统时间戳
			doc.setCreateTime(nowTimeStamp);
			doc.setLatestEditTime(nowTimeStamp);
			doc.setLatestEditor(login_user.getId());
			doc.setState(2);	//doc的状态为不可用
			doc.setLockBy(login_user.getId());	//LockBy login_user, it was used with state
			long lockTime = nowTimeStamp + 24*60*60*1000;
			doc.setLockTime(lockTime);	//Set lockTime
			if(reposService.addDoc(doc) == 0)
			{			
				unlock();
				rt.setError("Add Node: " + name +" Failed！");
				System.out.println("addDoc() addDoc to db failed");
				return null;
			}
			unlock();
		}
		
		System.out.println("id: " + doc.getId());
		
		if(uploadFile == null)
		{
			if(createRealDoc(reposRPath,parentPath,name,type, rt) == false)
			{		
				String MsgInfo = "createRealDoc " + name +" Failed";
				rt.setError(MsgInfo);
				System.out.println("createRealDoc Failed");
				//删除新建的doc,我需要假设总是会成功,如果失败了也只是在Log中提示失败
				if(reposService.deleteDoc(doc.getId()) == 0)	
				{
					MsgInfo += " and delete Node Failed";
					System.out.println("Delete Node: " + doc.getId() +" failed!");
					rt.setError(MsgInfo);
				}
				return null;
			}
		}
		else
		{
			if(updateRealDoc(reposRPath,parentPath,name,doc.getType(),fileSize,checkSum,uploadFile,chunkNum,chunkSize,chunkParentPath,rt) == false)
			{		
				String MsgInfo = "updateRealDoc " + name +" Failed";
				rt.setError(MsgInfo);
				System.out.println("updateRealDoc Failed");
				//删除新建的doc,我需要假设总是会成功,如果失败了也只是在Log中提示失败
				if(reposService.deleteDoc(doc.getId()) == 0)	
				{
					MsgInfo += " and delete Node Failed";
					System.out.println("Delete Node: " + doc.getId() +" failed!");
					rt.setError(MsgInfo);
				}
				return null;
			}
		}
		//commit to history db
		if(verReposRealDocAdd(repos,parentPath,name,type,commitMsg,commitUser,rt) == false)
		{
			System.out.println("verReposRealDocAdd Failed");
			String MsgInfo = "verReposRealDocAdd Failed";
			//我们总是假设rollback总是会成功，失败了也是返回错误信息，方便分析
			if(delFile(localDocRPath) == false)
			{						
				MsgInfo += " and deleteFile Failed";
			}
			if(reposService.deleteDoc(doc.getId()) == 0)
			{
				MsgInfo += " and delete Node Failed";						
			}
			rt.setError(MsgInfo);
			return null;
		}
		
		Integer docId = doc.getId();
		if(type == 1)
		{
			//Update Lucene Index
			updateIndexForRDoc(docId, localDocRPath);
		}
		
		//只有在content非空的时候才创建VDOC
		if(null != content && !"".equals(content))
		{
			String reposVPath = getReposVirtualPath(repos);
			String docVName = getDocVPath(parentPath,doc.getName());
			if(createVirtualDoc(reposVPath,docVName,content,rt) == true)
			{
				if(verReposVirtualDocAdd(repos, docVName, commitMsg, commitUser,rt) ==false)
				{
					System.out.println("addDoc() svnVirtualDocAdd Failed " + docVName);
					rt.setMsgInfo("svnVirtualDocAdd Failed");			
				}
			}
			else
			{
				System.out.println("addDoc() createVirtualDoc Failed " + reposVPath + docVName);
				rt.setMsgInfo("createVirtualDoc Failed");
			}
			//Add Lucene Index For Vdoc
			addIndexForVDoc(docId,content);
		}
		
		//启用doc
		if(unlockDoc(docId,login_user,null) == false)
		{
			rt.setError("unlockDoc Failed");
			return null;
		}
		rt.setMsg("新增成功", "isNewNode");
		rt.setData(doc);
		
		return docId;
	}
	
	//释放线程锁
	protected void unlock() {
		unlockSyncLock(syncLock);
	}	
	private void unlockSyncLock(Object syncLock) {
		syncLock.notifyAll();//唤醒等待线程
		//下面这段代码是因为参考了网上的一个Demo说wait是释放锁，我勒了个区去，留着作纪念
		//try {
		//	syncLock.wait();	//线程睡眠，等待syncLock.notify/notifyAll唤醒
		//} catch (InterruptedException e) {
		//	e.printStackTrace();
		//}
	}  

	//底层deleteDoc接口
	//isSubDelete: true: 文件已删除，只负责删除VDOC、LuceneIndex、previewFile、DBRecord
	protected boolean deleteDoc(Repos repos, Integer docId, Integer parentId, 
			String commitMsg,String commitUser,User login_user, ReturnAjax rt,boolean isSubDelete, boolean skipRealDocCommit) 
	{
		Doc doc = null;
		if(isSubDelete)	//Do not lock
		{
			doc = reposService.getDoc(docId);
			if(doc == null)
			{
				System.out.println("deleteDoc() " + docId + " not exists");
				return true;			
			}
			System.out.println("deleteDoc() " + docId + " " + doc.getName() + " isSubDelete");
		}
		else
		{
			synchronized(syncLock)
			{							
				//Try to lock the Doc
				doc = lockDoc(docId,2, 7200000,login_user,rt,true);	//lock 2 Hours 2*60*60*1000
				if(doc == null)
				{
					unlock(); //线程锁
					System.out.println("deleteDoc() Failed to lock Doc: " + docId);
					return false;			
				}
				unlock(); //线程锁
			}
			System.out.println("deleteDoc() " + docId + " " + doc.getName() + " Lock OK");
			
			//get parentPath
			String parentPath = getParentPath(parentId);		
			//get RealDoc Full ParentPath
			String reposRPath = getReposRealPath(repos);
			
			//删除实体文件
			String name = doc.getName();
			
			if(deleteRealDoc(reposRPath,parentPath,name, doc.getType(),rt) == false)
			{
				String MsgInfo = parentPath + name + " 删除失败！";
				if(unlockDoc(docId,login_user,doc) == false)
				{
					MsgInfo += " and unlockDoc Failed";						
				}
				rt.setError(MsgInfo);
				return false;
			}
			
			if(skipRealDocCommit)	//忽略版本仓库，用于使用版本仓库同步时调用（相当于已经commit过了）
			{
				//需要将文件Commit到verRepos上去
				if(verReposRealDocDelete(repos,parentPath,name,doc.getType(),commitMsg,commitUser,rt) == false)
				{
					System.out.println("verReposRealDocDelete Failed");
					String MsgInfo = "verReposRealDocDelete Failed";
					//我们总是假设rollback总是会成功，失败了也是返回错误信息，方便分析
					if(verReposRevertRealDoc(repos,parentPath,name,doc.getType(),rt) == false)
					{						
						MsgInfo += " and revertFile Failed";
					}
					
					if(unlockDoc(docId,login_user,doc) == false)
					{
						MsgInfo += " and unlockDoc Failed";						
					}
					rt.setError(MsgInfo);
					return false;
				}
			}
		}
		
		//Delete Lucene index For RDoc and VDoc
		deleteIndexForDoc(docId,"doc");
		//Delete previewFile (previewFile use checksum as name)
		deletePreviewFile(doc.getCheckSum());
		
		//删除虚拟文件
		String reposVPath = getReposVirtualPath(repos);
		String parentPath = getParentPath(doc.getPid());
		String docVName = getDocVPath(parentPath ,doc.getName());
		String localDocVPath = reposVPath + docVName;
		if(deleteVirtualDoc(reposVPath,docVName,rt) == false)
		{
			System.out.println("deleteDoc() delDir Failed " + localDocVPath);
			rt.setMsgInfo("Delete Virtual Doc Failed:" + localDocVPath);
		}
		else
		{
			if(verReposVirtualDocDelete(repos,docVName,commitMsg,commitUser,rt) == false)
			{
				System.out.println("deleteDoc() delDir Failed " + localDocVPath);
				rt.setMsgInfo("Delete Virtual Doc Failed:" + localDocVPath);
				verReposRevertVirtualDoc(repos,docVName);
			}
		}

		//Delete SubDocs
		if(false == deleteSubDocs(repos, docId, commitMsg,commitUser,login_user,rt))
		{
			System.out.println("deleteDoc() deleteSubDocs Failed ");
		}
						
		//Delete DataBase Record
		if(reposService.deleteDoc(docId) == 0)
		{	
			rt.setError("不可恢复系统错误：deleteDoc Failed");
			return false;
		}
		rt.setData(doc);
		return true;
	}

	//删除预览文件
	private void deletePreviewFile(String checkSum) {
		String dstName = checkSum + ".pdf";
		String dstPath = getWebTmpPath() + "preview/" + dstName;
		delFileOrDir(dstPath);
	}

	private boolean deleteSubDocs(Repos repos, Integer docId, String commitMsg, String commitUser, User login_user, ReturnAjax rt) {
		Doc doc = new Doc();
		doc.setPid(docId);
		List<Doc> subDocList = reposService.getDocList(doc);
		for(int i=0; i< subDocList.size(); i++)
		{
			Doc subDoc = subDocList.get(i);
			deleteDoc(repos, subDoc.getId(), docId,commitMsg,commitUser,login_user,rt,true,false);
		}
		return true;
	}

	//底层updateDoc接口
	protected void updateDoc(Integer docId, MultipartFile uploadFile,Integer fileSize,String checkSum,Integer reposId,Integer parentId, 
			Integer chunkNum, Integer chunkSize, String chunkParentPath, String commitMsg,String commitUser,User login_user, ReturnAjax rt) {

		Doc doc = null;
		synchronized(syncLock)
		{
			//Try to lock the doc
			doc = lockDoc(docId, 1, 7200000, login_user, rt,false); //lock 2 Hours 2*60*60*1000
			if(doc == null)
			{
				unlock(); //线程锁
	
				System.out.println("updateDoc() lockDoc " + docId +" Failed！");
				return;
			}
			unlock(); //线程锁
			
		}
		
		//Save oldCheckSum
		String oldCheckSum = doc.getCheckSum();
		
		//为了避免执行到SVNcommit成功但数据库操作失败，所以先将checkSum更新掉
		doc.setCheckSum(checkSum);
		if(reposService.updateDoc(doc) == 0)
		{
			rt.setError("系统异常：操作数据库失败");
			rt.setMsgData("updateDoc() update Doc CheckSum Failed");
			return;
		}
		
		Repos repos = reposService.getRepos(reposId);
		//get RealDoc Full ParentPath
		String reposRPath =  getReposRealPath(repos);
		//get parentPath
		String parentPath = getParentPath(parentId);		
		//Get the file name
		String name = doc.getName();
		System.out.println("updateDoc() name:" + name);

		//保存文件信息
		if(updateRealDoc(reposRPath,parentPath,name,doc.getType(),fileSize,checkSum,uploadFile,chunkNum,chunkSize,chunkParentPath,rt) == false)
		{
			if(unlockDoc(docId,login_user,doc) == false)
			{
				System.out.println("updateDoc() saveFile " + docId +" Failed and unlockDoc Failed");
				rt.setError("Failed to updateRealDoc " + name + " and unlock Doc");
			}
			else
			{	
				System.out.println("updateDoc() saveFile " + docId +" Failed, unlockDoc Ok");
				rt.setError("Failed to updateRealDoc " + name + ", unlockDoc Ok");
			}
			return;
		}
		
		//需要将文件Commit到版本仓库上去
		if(verReposRealDocCommit(repos,parentPath,name,doc.getType(),commitMsg,commitUser,rt) == false)
		{
			System.out.println("updateDoc() verReposRealDocCommit Failed:" + parentPath + name);
			String MsgInfo = "verReposRealDocCommit Failed";
			//我们总是假设rollback总是会成功，失败了也是返回错误信息，方便分析
			if(verReposRevertRealDoc(repos,parentPath,name,doc.getType(),rt) == false)
			{						
				MsgInfo += " and revertFile Failed";
			}
			//还原doc记录的状态
			if(unlockDoc(docId,login_user,doc) == false)
			{
				MsgInfo += " and unlockDoc Failed";						
			}
			rt.setError(MsgInfo);	
			return;
		}
		
		//Update Lucene Index
		String localDocRPath = reposRPath + parentPath + name;
		updateIndexForRDoc(docId, localDocRPath);
		
		//Delete PreviewFile
		deletePreviewFile(oldCheckSum);
		
		//updateDoc Info and unlock
		doc.setSize(fileSize);
		doc.setCheckSum(checkSum);
		//set lastEditTime
		long nowTimeStamp = new Date().getTime();//获取当前系统时间戳
		doc.setLatestEditTime(nowTimeStamp);
		doc.setLatestEditor(login_user.getId());
		
		if(reposService.updateDoc(doc) == 0)
		{
			rt.setError("不可恢复系统错误：updateAndunlockDoc Failed");
			return;
		}

	}

	//底层renameDoc接口
	protected void renameDoc(Integer docId, String newname,Integer reposId,Integer parentId, 
			String commitMsg,String commitUser,User login_user, ReturnAjax rt) {
		
		Doc doc = null;
		synchronized(syncLock)
		{
			//Try to lockDoc
			doc = lockDoc(docId,2, 7200000,login_user,rt,true);
			if(doc == null)
			{
				unlock(); //线程锁
				
				System.out.println("renameDoc() lockDoc " + docId +" Failed！");
				return;
			}
			unlock(); //线程锁
		}
		
		Repos repos = reposService.getRepos(reposId);
		String reposRPath = getReposRealPath(repos);
		String parentPath = getParentPath(parentId);
		String oldname = doc.getName();
		
		//修改实文件名字	
		if(moveRealDoc(reposRPath,parentPath,oldname,parentPath,newname,doc.getType(),rt) == false)
		{
			if(unlockDoc(docId,login_user,doc) == false)
			{
				rt.setError(oldname + " renameRealDoc失败！ and unlockDoc " + docId +" Failed！");
				return;
			}
			else
			{
				rt.setError(oldname + " renameRealDoc失败！");
				return;
			}
		}
		else
		{
			//commit to history db
			if(verReposRealDocMove(repos,parentPath,oldname,parentPath,newname,doc.getType(),commitMsg,commitUser,rt) == false)
			{
				//我们假定版本提交总是会成功，因此报错不处理
				System.out.println("renameDoc() svnRealDocMove Failed");
				String MsgInfo = "svnRealDocMove Failed";
				
				if(moveRealDoc(reposRPath,parentPath,newname,parentPath,oldname,doc.getType(),rt) == false)
				{
					MsgInfo += " and moveRealDoc Back Failed";
				}
				if(unlockDoc(docId,login_user,doc) == false)
				{
					MsgInfo += " and unlockDoc Failed";						
				}
				rt.setError(MsgInfo);
				return;
			}	
		}
		
		//更新doc name
		Doc tempDoc = new Doc();
		tempDoc.setId(docId);
		tempDoc.setName(newname);
		//set lastEditTime
		long nowTimeStamp = new Date().getTime();//获取当前系统时间戳
		tempDoc.setLatestEditTime(nowTimeStamp);
		tempDoc.setLatestEditor(login_user.getId());
		if(reposService.updateDoc(tempDoc) == 0)
		{
			rt.setError("不可恢复系统错误：Failed to update doc name");
			return;
		}
		
		//更新DocVPath
		String reposVPath = getReposVirtualPath(repos);
		updateDocVPath(repos, doc, reposVPath, parentPath, oldname, parentPath, newname, commitMsg, commitUser, rt);
		
		//unlock doc
		if(unlockDoc(docId,login_user,doc) == false)
		{
			rt.setError("unlockDoc failed");	
		}
		return;
	}
	
	//更新Doc和其SubDoc的VirtualDocPath（Only For rename and move of Dir）
	void updateDocVPath(Repos repos, Doc doc, String reposVPath, String srcParentPath, String oldName, String dstParentPath, String newName, String commitMsg,String commitUser, ReturnAjax rt)
	{
		System.out.println("moveVirtualDoc move " + srcParentPath+oldName + " to " + dstParentPath + newName);
		
		String srcDocVPath = getDocVPath(srcParentPath, oldName);
		String dstDocVPath = getDocVPath(dstParentPath, newName);
		if(!srcDocVPath.equals(dstDocVPath))
		{
			//修改虚拟文件的目录名称 when VDoc exists
			File srcEntry = new File(reposVPath, srcDocVPath);
			if(srcEntry.exists())
			{
				if(moveVirtualDoc(reposVPath,srcDocVPath, dstDocVPath,rt) == true)
				{
					if(verReposVirtualDocMove(repos, srcDocVPath, dstDocVPath, commitMsg, commitUser,rt) == false)
					{
						System.out.println("moveVirtualDoc() svnVirtualDocMove Failed");
					}
				}
			}
		}
		
		//Get all subDocs of Doc( and Update Their VDoc Path)
		Doc queryConditon = new Doc();
		queryConditon.setPid(doc.getId());
		List <Doc> list = reposService.getDocList(queryConditon);
		if(list != null)
		{
			for(int i = 0 ; i < list.size() ; i++) {
				Doc subDoc = list.get(i);
				updateDocVPath(repos,subDoc,reposVPath, srcParentPath + newName+"/", subDoc.getName() ,dstParentPath + newName+"/", subDoc.getName(), commitMsg,commitUser,rt);
			}
		}
	}
	
	//底层moveDoc接口
	protected void moveDoc(Integer docId, Integer reposId,Integer parentId,Integer dstPid,  
			String commitMsg,String commitUser,User login_user, ReturnAjax rt) {

		Doc doc = null;
		Doc dstPDoc = null;
		synchronized(syncLock)
		{
			doc = lockDoc(docId,2, 7200000, login_user,rt,true);
			if(doc == null)
			{
				unlock(); //线程锁
	
				System.out.println("lockDoc " + docId +" Failed！");
				return;
			}
			
			//Try to lock dstPid
			if(dstPid !=0)
			{
				dstPDoc = lockDoc(dstPid,2, 7200000, login_user,rt,false);
				if(dstPDoc== null)
				{
					unlock(); //线程锁
	
					System.out.println("moveDoc() fail to lock dstPid" + dstPid);
					unlockDoc(docId,login_user,doc);	//Try to unlock the doc
					return;
				}
			}
			unlock(); //线程锁
		}
		
		//移动当前节点
		Integer orgPid = doc.getPid();
		System.out.println("moveDoc id:" + docId + " orgPid: " + orgPid + " dstPid: " + dstPid);
		
		String srcParentPath = getParentPath(orgPid);		
		String dstParentPath = getParentPath(dstPid);
		
		Repos repos = reposService.getRepos(reposId);
		String reposRPath = getReposRealPath(repos);
		
		String filename = doc.getName();
		String srcDocRPath = srcParentPath + filename;
		String dstDocRPath = dstParentPath + filename;
		System.out.println("srcDocRPath: " + srcDocRPath + " dstDocRPath: " + dstDocRPath);
		
		//只有当orgPid != dstPid 不同时才进行文件移动，否则文件已在正确位置，只需要更新Doc记录
		if(!orgPid.equals(dstPid))
		{
			System.out.println("moveDoc() docId:" + docId + " orgPid: " + orgPid + " dstPid: " + dstPid);
			if(moveRealDoc(reposRPath,srcParentPath,filename,dstParentPath,filename,doc.getType(),rt) == false)
			{
				String MsgInfo = "文件移动失败！";
				System.out.println("moveDoc() 文件: " + filename + " 移动失败");
				if(unlockDoc(docId,login_user,doc) == false)
				{
					MsgInfo += " and unlockDoc " + docId+ " failed ";
				}
				if(dstPid !=0 && unlockDoc(dstPid,login_user,dstPDoc) == false)
				{
					MsgInfo += " and unlockDoc " + dstPid+ " failed ";
				}
				rt.setError(MsgInfo);
				return;
			}
			
			//需要将文件Commit到SVN上去：先执行svn的移动
			if(verReposRealDocMove(repos, srcParentPath,filename, dstParentPath, filename,doc.getType(),commitMsg, commitUser,rt) == false)
			{
				System.out.println("moveDoc() svnRealDocMove Failed");
				String MsgInfo = "svnRealDocMove Failed";
				if(moveRealDoc(reposRPath,dstParentPath,filename,srcParentPath,filename,doc.getType(),rt) == false)
				{
					MsgInfo += "and changeDirectory Failed";
				}
				
				if(unlockDoc(docId,login_user,doc) == false)
				{
					MsgInfo += " and unlockDoc " + docId+ " failed ";
				}
				if(dstPid !=0 && unlockDoc(dstPid,login_user,dstPDoc) == false)
				{
					MsgInfo += " and unlockDoc " + dstPid+ " failed ";
				}
				rt.setError(MsgInfo);
				return;					
			}
		}
		
		//更新doc pid and path
		Doc tempDoc = new Doc();
		tempDoc.setId(docId);
		tempDoc.setPath(dstParentPath);
		tempDoc.setPid(dstPid);
		//set lastEditTime
		long nowTimeStamp = new Date().getTime();//获取当前系统时间戳
		tempDoc.setLatestEditTime(nowTimeStamp);
		tempDoc.setLatestEditor(login_user.getId());
		if(reposService.updateDoc(tempDoc) == 0)
		{
			rt.setError("不可恢复系统错误：Failed to update doc pid and path");
			return;				
		}
		
		//更新DocVPath
		String reposVPath = getReposVirtualPath(repos);
		updateDocVPath(repos, doc, reposVPath, srcParentPath, filename, dstParentPath, filename, commitMsg, commitUser, rt);
		
		//Unlock Docs
		String MsgInfo = null; 
		if(unlockDoc(docId,login_user,doc) == false)
		{
			MsgInfo = "unlockDoc " + docId+ " failed ";
		}
		if(dstPid !=0 && unlockDoc(dstPid,login_user,dstPDoc) == false)
		{
			MsgInfo += " and unlockDoc " + dstPid+ " failed ";
		}
		if(MsgInfo!=null)
		{
			rt.setError(MsgInfo);
		}
		return;
	}
	
	//底层copyDoc接口
	//isSubCopy: true no need to do lock check and lock
	protected boolean copyDoc(Integer docId,String srcName,String dstName, Integer type, Integer reposId,Integer parentId, Integer dstPid,
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, boolean isSubCopy) {
		
		Repos repos = reposService.getRepos(reposId);
		String reposRPath =  getReposRealPath(repos);

		//get parentPath
		String srcParentPath = getParentPath(parentId);		
		//目标路径
		String dstParentPath = getParentPath(dstPid);

		if(isSubCopy)
		{
			System.out.println("copyDoc() copy " +docId+ " " + srcParentPath+srcName + " to " + dstParentPath+dstName + " isSubCopy");
		}
		else
		{
			System.out.println("copyDoc() copy " +docId+ " " + srcParentPath+srcName + " to " + dstParentPath+dstName);
			
			//判断节点是否已存在
			if(isNodeExist(dstName,dstPid,reposId) == true)
			{
				rt.setError("Node: " + dstName +" 已存在！");
				return false;
			}
		}

		Doc srcDoc = null;
		Doc dstDoc = null;
		synchronized(syncLock)
		{
			if(isSubCopy)
			{
				srcDoc = reposService.getDoc(docId);
			}
			else
			{
				//Try to lock the srcDoc
				srcDoc = lockDoc(docId,1, 7200000,login_user,rt,true);
				if(srcDoc == null)
				{
					unlock(); //线程锁
		
					System.out.println("copyDoc lock " + docId + " Failed");
					return false;
				}
			}
			
			//新建doc记录，并锁定（if isSubCopy is false）
			dstDoc = new Doc();
			dstDoc.setId(null);	//置空id,以便新建一个doc
			dstDoc.setName(dstName);
			dstDoc.setType(type);
			dstDoc.setContent(srcDoc.getContent());
			dstDoc.setPath(dstParentPath);
			dstDoc.setVid(reposId);
			dstDoc.setPid(dstPid);
			dstDoc.setCreator(login_user.getId());
			//set createTime
			long nowTimeStamp = new Date().getTime(); //当前时间的时间戳
			dstDoc.setCreateTime(nowTimeStamp);
			//set lastEditTime
			dstDoc.setLatestEditTime(nowTimeStamp);
			dstDoc.setLatestEditor(login_user.getId());
			if(false == isSubCopy)
			{
				dstDoc.setState(2);	//doc的状态为不可用
				dstDoc.setLockBy(login_user.getId());	//set LockBy
				long lockTime = nowTimeStamp + 24*60*60*1000;
				dstDoc.setLockTime(lockTime);	//Set lockTime
			}
			else
			{
				dstDoc.setState(0);	//doc的状态为不可用
				dstDoc.setLockBy(0);	//set LockBy
				dstDoc.setLockTime((long)0);	//Set lockTime				
			}
			
			if(reposService.addDoc(dstDoc) == 0)
			{
				unlock(); //线程锁
	
				rt.setError("Add Node: " + dstName +" Failed！");
				
				//unlock SrcDoc
				unlockDoc(docId,login_user,srcDoc);
				return false;
			}
			unlock(); //线程锁
		}
		
		Integer dstDocId =  dstDoc.getId();
		System.out.println("dstDoc id: " + dstDoc.getId());
		
		//复制文件或目录，注意这个接口只会复制单个文件
		if(copyRealDoc(reposRPath,srcParentPath,srcName,dstParentPath,dstName,type,rt) == false)
		{
			System.out.println("copy " + srcName + " to " + dstName + " 失败");
			String MsgInfo = "copyRealDoc from " + srcName + " to " + dstName + "Failed";
			//删除新建的doc,我需要假设总是会成功,如果失败了也只是在Log中提示失败
			if(reposService.deleteDoc(dstDocId) == 0)	
			{
				System.out.println("Delete Node: " + dstDocId +" failed!");
				MsgInfo += " and delete dstDoc " + dstDocId + "Failed";
			}
			if(unlockDoc(docId,login_user,srcDoc) == false)
			{
				System.out.println("unlock srcDoc: " + docId +" failed!");
				MsgInfo += " and unlock srcDoc " + docId +" Failed";	
			}
			rt.setError(MsgInfo);
			return false;
		}
			
		//需要将文件Commit到SVN上去
		boolean ret = false;
		String MsgInfo = "";
		if(type == 1) 
		{
			ret = verReposRealDocCopy(repos,srcParentPath,srcName,dstParentPath,dstName,type,commitMsg, commitUser,rt);
			MsgInfo = "verReposRealDocCopy Failed";
		}
		else //目录则在版本仓库新建，因为复制操作每次只复制一个节点，直接调用copy会导致目录下的所有节点都被复制
		{
			ret = verReposRealDocAdd(repos,dstParentPath,dstName,type,commitMsg,commitUser,rt);
			MsgInfo = "verReposRealDocAdd Failed";
		}			
			
		if(ret == false)
		{
			System.out.println("copyDoc() " + MsgInfo);
			//我们总是假设rollback总是会成功，失败了也是返回错误信息，方便分析
			if(deleteRealDoc(reposRPath,srcParentPath,dstName,type,rt) == false)
			{						
				MsgInfo += " and deleteFile Failed";
			}
			if(reposService.deleteDoc(dstDocId) == 0)
			{
				MsgInfo += " and delete dstDoc " + dstDocId + " Failed";						
			}
			if(unlockDoc(docId,login_user,srcDoc) == false)
			{
				MsgInfo += " and unlock srcDoc " + docId +" Failed";	
			}
			rt.setError(MsgInfo);
			return false;
		}				
		
		if(type == 1)
		{
			//Update Lucene Index
			String localDocRPath = reposRPath + dstParentPath + dstName;
			updateIndexForRDoc(dstDocId,localDocRPath);
		}
		
		//content非空时才去创建虚拟文件目录
		if(null != dstDoc.getContent() && !"".equals(dstDoc.getContent()))
		{
			String reposVPath = getReposVirtualPath(repos);
			String srcDocVName = getDocVPath(srcParentPath, srcDoc.getName());
			String dstDocVName = getDocVPath(dstParentPath, dstDoc.getName());
			if(copyVirtualDoc(reposVPath,srcDocVName,dstDocVName,rt) == true)
			{
				if(verReposVirtualDocCopy(repos,srcDocVName,dstDocVName, commitMsg, commitUser,rt) == false)
				{
					System.out.println("copyDoc() svnVirtualDocCopy " + srcDocVName + " to " + dstDocVName + " Failed");							
				}
			}
			else
			{
				System.out.println("copyDoc() copyVirtualDoc " + srcDocVName + " to " + dstDocVName + " Failed");						
			}
			addIndexForVDoc(dstDocId,dstDoc.getContent());
		}
				
		//copySubDocs
		copySubDocs(docId, reposId, dstDocId,commitMsg,commitUser,login_user,rt); 
		
		if(false == isSubCopy)
		{
			//启用doc
			MsgInfo = null;
			if(unlockDoc(dstDoc.getId(),login_user,null) == false)
			{	
				MsgInfo ="unlockDoc " +dstDoc.getId() + " Failed";;
			}
			//Unlock srcDoc 
			if(unlockDoc(docId,login_user,null) == false)
			{
				MsgInfo += " and unlock " + docId +" Failed";	
			}
			if(MsgInfo != null)
			{
				rt.setError(MsgInfo);
			}
	
			//只返回最上层的doc记录
			rt.setData(dstDoc);				
		}	
		return true;
	}

	private boolean copySubDocs(Integer docId, Integer reposId, Integer dstParentId,
			String commitMsg, String commitUser, User login_user, ReturnAjax rt) {
		boolean ret = true;
		Doc doc = new Doc();
		doc.setPid(docId);
		List<Doc> subDocList = reposService.getDocList(doc);
		for(int i=0; i< subDocList.size(); i++)
		{
			Doc subDoc = subDocList.get(i);
			String subDocName = subDoc.getName();
			if(false == copyDoc(subDoc.getId(),subDocName,subDocName, subDoc.getType(), reposId, docId, dstParentId,commitMsg,commitUser,login_user,rt,true))
			{
				ret = false;
			}
		}
		return ret;
	}

	protected void updateDocContent(Integer id,String content, String commitMsg, String commitUser, User login_user,ReturnAjax rt) {
		Doc doc = null;
		synchronized(syncLock)
		{
			//Try to lock Doc
			doc = lockDoc(id,1, 3600000, login_user,rt,false);
			if(doc== null)
			{
				unlock(); //线程锁
	
				System.out.println("updateDocContent() lockDoc Failed");
				return;
			}
			unlock(); //线程锁
		}
		
		Repos repos = reposService.getRepos(doc.getVid());
		
		//只更新内容部分
		Doc newDoc = new Doc();
		newDoc.setId(id);
		newDoc.setContent(content);
		//System.out.println("before: " + content);
		if(reposService.updateDoc(newDoc) == 0)
		{
			rt.setError("更新文件失败");
			return;			
		}	
		
		//Save the content to virtual file
		String reposVPath = getReposVirtualPath(repos);
		String parentPath = getParentPath(doc.getPid());
		String docVName = getDocVPath(parentPath, doc.getName());
		String localVDocPath = reposVPath + docVName;
		
		System.out.println("updateDocContent() localVDocPath: " + localVDocPath);
		if(isFileExist(localVDocPath) == true)
		{
			if(saveVirtualDocContent(reposVPath,docVName, content,rt) == true)
			{
				verReposVirtualDocCommit(repos, docVName, commitMsg, commitUser,rt);
			}
		}
		else
		{	
			//创建虚拟文件目录：用户编辑保存时再考虑创建
			if(createVirtualDoc(reposVPath,docVName,content,rt) == true)
			{
				verReposVirtualDocCommit(repos, docVName, commitMsg, commitUser,rt);
			}
		}
		
		//Update Index For VDoc
		updateIndexForVDoc(id,content);
		
		//Delete tmp saved doc content
		String userTmpDir = getReposUserTmpPath(repos,login_user);
		delFileOrDir(userTmpDir+docVName);
		
		if(unlockDoc(id,login_user,doc) == false)
		{
			rt.setError("unlockDoc failed");	
		}		
	}
	
	/*********************Functions For DocLock *******************************/
	//Lock Repos
	protected Repos lockRepos(Integer reposId,Integer lockType, long lockDuration, User login_user, ReturnAjax rt, boolean docLockCheckFlag) 
	{
		System.out.println("lockRepos() reposId:" + reposId + " lockType:" + lockType + " by " + login_user.getName() + " docLockCheckFlag:" + docLockCheckFlag);
		//确定Repos是否可用
		Repos repos = reposService.getRepos(reposId);
		if(repos == null)
		{
			rt.setError("repos " + reposId +" 不存在！");
			System.out.println("lockDoc() Repos: " + reposId +" 不存在！");
			return null;
		}
		
		//Check if repos was locked
		if(isReposLocked(repos, login_user,rt))
		{
			System.out.println("lockDoc() Repos:" + repos.getId() +" was locked！");				
			return null;			
		}
		
		//
		//Set the query condition to get the SubDocList of DocId
		Doc qDoc = new Doc();
		qDoc.setVid(reposId);
		qDoc.setState(1); //Force Locked Doc
		List<Doc> lockedDocList = reposService.getDocList(qDoc);
		long curTime = new Date().getTime();
		for(int i=0;i<lockedDocList.size();i++)
		{
			Doc subDoc =lockedDocList.get(i);
			long lockTime = subDoc.getLockTime();	//time for lock release
			//System.out.println("isSubDocLocked() curTime:"+curTime+" lockTime:"+lockTime);
			if(curTime < lockTime)
			{
				rt.setError("subDoc " + subDoc.getId() + "[" +  subDoc.getName() + "] is locked:" + subDoc.getState());
				System.out.println("isSubDocLocked() " + subDoc.getId() + " is locked!");
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
	protected Doc lockDoc(Integer docId,Integer lockType, long lockDuration, User login_user, ReturnAjax rt, boolean subDocCheckFlag) {
		System.out.println("lockDoc() docId:" + docId + " lockType:" + lockType + " by " + login_user.getName() + " subDocCheckFlag:" + subDocCheckFlag);
				
		//确定文件节点是否可用
		Doc doc = reposService.getDoc(docId);
		if(doc == null)
		{
			rt.setError("Doc " + docId +" 不存在！");
			System.out.println("lockDoc() Doc: " + docId +" 不存在！");
			return null;
		}
		
		//check if the doc was locked (State!=0 && lockTime - curTime > 1 day)
		if(isDocLocked(doc,login_user,rt))
		{
			System.out.println("lockDoc() Doc " + docId +" was locked");
			return null;
		}
		
		//Check if repos was locked
		Repos repos = reposService.getRepos(doc.getVid());
		if(repos == null)
		{
			rt.setError("仓库 " + doc.getVid() +" 不存在！");
			System.out.println("lockDoc() Repos: " + doc.getVid() +" 不存在！");
			return null;
		}
		if(isReposLocked(repos, login_user,rt))
		{
			System.out.println("lockDoc() Repos:" + repos.getId() +" was locked！");				
			return null;			
		}
		
		//检查其父节点是否强制锁定
		if(isParentDocLocked(doc.getPid(),login_user,rt))
		{
			System.out.println("lockDoc() Parent Doc of " + docId +" was locked！");				
			return null;
		}
		
		//Check If SubDoc was locked
		if(subDocCheckFlag)
		{
			if(isSubDocLocked(docId,rt) == true)
			{
				System.out.println("lockDoc() subDoc of " + docId +" was locked！");
				return null;
			}
		}
		
		//lockTime is the time to release lock 
		Doc lockDoc= new Doc();
		lockDoc.setId(docId);
		lockDoc.setState(lockType);	//doc的状态为不可用
		lockDoc.setLockBy(login_user.getId());
		long lockTime = new Date().getTime() + lockDuration; //24*60*60*1000;
		lockDoc.setLockTime(lockTime);	//Set lockTime
		if(reposService.updateDoc(lockDoc) == 0)
		{
			rt.setError("lock Doc:" + docId +"[" + doc.getName() +"]  failed");
			return null;
		}
		System.out.println("lockDoc() success docId:" + docId + " lockType:" + lockType + " by " + login_user.getName());
		return doc;
	}
	
	//确定仓库是否被锁定
	private boolean isReposLocked(Repos repos, User login_user, ReturnAjax rt) {
		int lockState = repos.getState();	//0: not locked  1: locked	
		if(lockState != 0)
		{
			if(isLockOutOfDate(repos.getLockTime()) == false)
			{	
				User lockBy = userService.getUser(repos.getLockBy());
				rt.setError("仓库 " + repos.getName() +" was locked by " + lockBy.getName());
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

	//确定当前doc是否被锁定
	private boolean isDocLocked(Doc doc,User login_user,ReturnAjax rt) {
		int lockState = doc.getState();	//0: not locked 2: 表示强制锁定（实文件正在新增、更新、删除），不允许被自己解锁；1: 表示RDoc处于CheckOut 3:表示正在编辑VDoc
		if(lockState != 0)
		{
			//Not force locked (user can access it by himself)
			if(lockState != 2)
			{
				if(doc.getLockBy() == login_user.getId())	//locked by login_user
				{
					System.out.println("Doc: " + doc.getId() +" was locked by user:" + doc.getLockBy() +" login_user:" + login_user.getId());
					return false;
				}
			}
			
			if(isLockOutOfDate(doc.getLockTime()) == false)
			{	
				User lockBy = userService.getUser(doc.getLockBy());
				rt.setError(doc.getName() +" was locked by " + lockBy.getName());
				System.out.println("Doc " + doc.getId()+ "[" + doc.getName() +"] was locked by " + doc.getLockBy() + " lockState:"+ doc.getState());
				return true;						
			}
			else 
			{
				System.out.println("doc " + doc.getId()+ " " + doc.getName()  +" lock was out of date！");
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
	private boolean isParentDocLocked(Integer parentDocId, User login_user,ReturnAjax rt) {
		if(parentDocId == 0)
		{
			return false;	//已经到了最上层
		}
		
		Doc doc = reposService.getDoc(parentDocId);
		if(doc == null)
		{
			System.out.println("isParentDocLocked() doc is null for parentDocId=" + parentDocId);
			return false;
		}
		
		Integer lockState = doc.getState();
		
		if(lockState == 2)	//Force Locked
		{	
			long curTime = new Date().getTime();
			long lockTime = doc.getLockTime();	//time for lock release
			System.out.println("isParentDocLocked() curTime:"+curTime+" lockTime:"+lockTime);
			if(curTime < lockTime)
			{
				rt.setError("parentDoc " + parentDocId + "[" + doc.getName() + "] was locked:" + lockState);
				System.out.println("getParentLockState() " + parentDocId + " is locked!");
				return true;
			}
		}
		return isParentDocLocked(doc.getPid(),login_user,rt);
	}
	
	//docId目录下是否有锁定的doc(包括所有锁定状态)
	//Check if any subDoc under docId was locked, you need to check it when you want to rename/move/copy/delete the Directory
	private boolean isSubDocLocked(Integer docId, ReturnAjax rt)
	{
		//Set the query condition to get the SubDocList of DocId
		Doc qDoc = new Doc();
		qDoc.setPid(docId);

		//get the subDocList 
		List<Doc> SubDocList = reposService.getDocList(qDoc);
		for(int i=0;i<SubDocList.size();i++)
		{
			Doc subDoc =SubDocList.get(i);
			if(subDoc.getState() != 0)
			{
				long curTime = new Date().getTime();
				long lockTime = subDoc.getLockTime();	//time for lock release
				System.out.println("isSubDocLocked() curTime:"+curTime+" lockTime:"+lockTime);
				if(curTime < lockTime)
				{
					rt.setError("subDoc " + subDoc.getId() + "[" +  subDoc.getName() + "] is locked:" + subDoc.getState());
					System.out.println("isSubDocLocked() " + subDoc.getId() + " is locked!");
					return true;
				}
				return false;
			}
		}
		
		//If there is subDoc which is directory, we need to go into the subDoc to check the lockSatate of subSubDoc
		for(int i=0;i<SubDocList.size();i++)
		{
			Doc subDoc =SubDocList.get(i);
			if(subDoc.getType() == 2)
			{
				if(isSubDocLocked(subDoc.getId(),rt) == true)
				{
					return true;
				}
			}
		}
				
		return false;
	}
	

	//Unlock Doc
	private boolean unlockDoc(Integer docId, User login_user, Doc preLockInfo) {
		Doc curDoc = reposService.getDocInfo(docId);
		if(curDoc == null)
		{
			System.out.println("unlockDoc() doc is null " + docId);
			return false;
		}
		
		if(curDoc.getState() == 0)
		{
			System.out.println("unlockDoc() doc was not locked:" + curDoc.getState());			
			return true;
		}
		
		Integer lockBy = curDoc.getLockBy();
		if(lockBy != null && lockBy == login_user.getId())
		{
			Doc revertDoc = new Doc();
			revertDoc.setId(docId);	
			
			if(preLockInfo == null)	//Unlock
			{
				revertDoc.setState(0);	//
				revertDoc.setLockBy(0);	//
				revertDoc.setLockTime((long)0);	//Set lockTime
			}
			else	//Revert to preLockState
			{
				revertDoc.setState(preLockInfo.getState());	//
				revertDoc.setLockBy(preLockInfo.getLockBy());	//
				revertDoc.setLockTime(preLockInfo.getLockTime());	//Set lockTime
			}
			
			if(reposService.updateDoc(revertDoc) == 0)
			{
				System.out.println("unlockDoc() updateDoc Failed!");
				return false;
			}
		}
		else
		{
			System.out.println("unlockDoc() doc was not locked by " + login_user.getName());
			return false;
		}
		
		System.out.println("unlockDoc() success:" + docId);
		return true;
	}
	
	/*************************** Functions For Real and Virtual Doc Operation ***********************************/
	//create Real Doc
	private boolean createRealDoc(String reposRPath,String parentPath, String name, Integer type, ReturnAjax rt) {
		//获取 doc parentPath
		String localParentPath =  reposRPath + parentPath;
		String localDocPath = localParentPath + name;
		System.out.println("createRealDoc() localParentPath:" + localParentPath);
		
		if(type == 2) //目录
		{
			if(isFileExist(localDocPath) == true)
			{
				System.out.println("createRealDoc() 目录 " +localDocPath + "　已存在！");
				rt.setMsgData("createRealDoc() 目录 " +localDocPath + "　已存在！");
				return false;
			}
			
			if(false == createDir(localDocPath))
			{
				System.out.println("createRealDoc() 目录 " +localDocPath + " 创建失败！");
				rt.setMsgData("createRealDoc() 目录 " +localDocPath + " 创建失败！");
				return false;
			}				
		}
		else
		{
			if(isFileExist(localDocPath) == true)
			{
				System.out.println("createRealDoc() 文件 " +localDocPath + " 已存在！");
				rt.setMsgData("createRealDoc() 文件 " +localDocPath + " 已存在！");
				return false;
			}
			
			if(false == createFile(localParentPath,name))
			{
				System.out.println("createRealDoc() 文件 " + localDocPath + "创建失败！");
				rt.setMsgData("createRealDoc() createFile 文件 " + localDocPath + "创建失败！");
				return false;					
			}
		}
		return true;
	}
	
	private boolean deleteRealDoc(String reposRPath, String parentPath, String name, Integer type, ReturnAjax rt) {
		String localDocPath = reposRPath + parentPath + name;

		if(delFileOrDir(localDocPath) == false)
		{
			System.out.println("deleteRealDoc() delFileOrDir " + localDocPath + "删除失败！");
			rt.setMsgData("deleteRealDoc() delFileOrDir " + localDocPath + "删除失败！");
			return false;
		}
		
		return true;
	}
	
	private boolean updateRealDoc(String reposRPath,String parentPath,String name,Integer type, Integer fileSize, String fileCheckSum,
			MultipartFile uploadFile, Integer chunkNum, Integer chunkSize, String chunkParentPath, ReturnAjax rt) {
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
			e.printStackTrace();
			rt.setMsgData(e);
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
	
	private String combineChunks(String targetParentPath,String fileName, Integer chunkNum,Integer cutSize, String chunkParentPath) {
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
	
	private boolean checkFileSizeAndCheckSum(String localDocParentPath, String name, Integer fileSize,
			String fileCheckSum) {
		File file = new File(localDocParentPath,name);
		if(fileSize != file.length())
		{
			System.out.println("checkFileSizeAndCheckSum() fileSize " + file.length() + "not match with ExpectedSize" + fileSize);
			return false;
		}
		return true;
	}

	private boolean moveRealDoc(String reposRPath, String srcParentPath, String srcName, String dstParentPath,String dstName,Integer type, ReturnAjax rt) 
	{
		System.out.println("moveRealDoc() " + " reposRPath:"+reposRPath + " srcParentPath:"+srcParentPath + " srcName:"+srcName + " dstParentPath:"+dstParentPath + " dstName:"+dstName);
		String localOldParentPath = reposRPath + srcParentPath;
		String oldFilePath = localOldParentPath+ srcName;
		String localNewParentPath = reposRPath + dstParentPath;
		String newFilePath = localNewParentPath + dstName;
		//检查orgFile是否存在
		if(isFileExist(oldFilePath) == false)
		{
			System.out.println("moveRealDoc() " + oldFilePath + " not exists");
			rt.setMsgData("moveRealDoc() " + oldFilePath + " not exists");
			return false;
		}
		
		//检查dstFile是否存在
		if(isFileExist(newFilePath) == true)
		{
			System.out.println("moveRealDoc() " + newFilePath + " already exists");
			rt.setMsgData("moveRealDoc() " + newFilePath + " already exists");
			return false;
		}
	
		/*移动文件或目录*/		
		if(moveFileOrDir(localOldParentPath,srcName,localNewParentPath,dstName,false) == false)	//强制覆盖
		{
			System.out.println("moveRealDoc() move " + oldFilePath + " to "+ newFilePath + " Failed");
			rt.setMsgData("moveRealDoc() move " + oldFilePath + " to "+ newFilePath + " Failed");
			return false;
		}
		return true;
	}
	
	private boolean copyRealDoc(String reposRPath, String srcParentPath,String srcName,String dstParentPath,String dstName, Integer type, ReturnAjax rt) {
		String srcDocPath = reposRPath + srcParentPath + srcName;
		String dstDocPath = reposRPath + dstParentPath + dstName;

		if(isFileExist(srcDocPath) == false)
		{
			System.out.println("copyRealDoc() 文件: " + srcDocPath + " 不存在");
			rt.setMsgData("文件: " + srcDocPath + " 不存在");
			return false;
		}
		
		if(isFileExist(dstDocPath) == true)
		{
			System.out.println("copyRealDoc() 文件: " + dstDocPath + " 已存在");
			rt.setMsgData("文件: " + dstDocPath + " 已存在");
			return false;
		}
		
		if(type == 2)	//如果是目录则创建目录
		{
			if(false == createDir(dstDocPath))
			{
				System.out.println("copyRealDoc() 目录: " + dstDocPath + " 创建失败");
				rt.setMsgData("目录: " + dstDocPath + " 创建失败");
				return false;
			}
		}
		else	//如果是文件则复制文件
		{
			if(copyFile(srcDocPath,dstDocPath,false) == false)	//强制覆盖
			{
				System.out.println("copyRealDoc() 文件: " + srcDocPath + " 复制失败");
				rt.setMsgData("文件: " + srcDocPath + " 复制失败");
				return false;
			}
		}
		return true;
	}

	//create Virtual Doc
	private boolean createVirtualDoc(String reposVPath, String docVName,String content, ReturnAjax rt) {
		String vDocPath = reposVPath + docVName;
		System.out.println("vDocPath: " + vDocPath);
		if(isFileExist(vDocPath) == true)
		{
			System.out.println("目录 " +vDocPath + "　已存在！");
			rt.setMsgData("目录 " +vDocPath + "　已存在！");
			return false;
		}
			
		if(false == createDir(vDocPath))
		{
			System.out.println("目录 " + vDocPath + " 创建失败！");
			rt.setMsgData("目录 " + vDocPath + " 创建失败！");
			return false;
		}
		if(createDir(vDocPath + "/res") == false)
		{
			System.out.println("目录 " + vDocPath + "/res" + " 创建失败！");
			rt.setMsgData("目录 " + vDocPath + "/res" + " 创建失败！");
			return false;
		}
		if(createFile(vDocPath,"content.md") == false)
		{
			System.out.println("目录 " + vDocPath + "/content.md" + " 创建失败！");
			rt.setMsgData("目录 " + vDocPath + "/content.md" + " 创建失败！");
			return false;			
		}
		if(content !=null && !"".equals(content))
		{
			saveVirtualDocContent(reposVPath,docVName, content,rt);
		}
		
		return true;
	}
	
	private boolean deleteVirtualDoc(String reposVPath, String docVName, ReturnAjax rt) {
		String localDocVPath = reposVPath + docVName;
		if(delDir(localDocVPath) == false)
		{
			rt.setMsgData("deleteVirtualDoc() delDir失败 " + localDocVPath);
			return false;
		}
		return true;
	}
	
	private boolean moveVirtualDoc(String reposVPath, String srcDocVName,String dstDocVName, ReturnAjax rt) {
		if(moveFileOrDir(reposVPath, srcDocVName, reposVPath, dstDocVName, false) == false)
		{
			rt.setMsgData("moveVirtualDoc() moveFile " + " reposVPath:" + reposVPath + " srcDocVName:" + srcDocVName+ " dstDocVName:" + dstDocVName);
			return false;
		}
		return true;
	}
	
	private boolean copyVirtualDoc(String reposVPath, String srcDocVName, String dstDocVName, ReturnAjax rt) {
		String srcDocFullVPath = reposVPath + srcDocVName;
		String dstDocFullVPath = reposVPath + dstDocVName;
		if(copyDir(srcDocFullVPath,dstDocFullVPath,false) == false)
		{
			rt.setMsgData("copyVirtualDoc() copyDir " + " srcDocFullVPath:" + srcDocFullVPath +  " dstDocFullVPath:" + dstDocFullVPath );
			return false;
		}
		return true;
	}

	protected boolean saveVirtualDocContent(String localParentPath, String docVName, String content, ReturnAjax rt) {
		String vDocPath = localParentPath + docVName + "/";
		File folder = new File(vDocPath);
		if(!folder.exists())
		{
			System.out.println("saveVirtualDocContent() vDocPath:" + vDocPath + " not exists!");
			if(folder.mkdir() == false)
			{
				System.out.println("saveVirtualDocContent() mkdir vDocPath:" + vDocPath + " Failed!");
				rt.setMsgData("saveVirtualDocContent() mkdir vDocPath:" + vDocPath + " Failed!");
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
			e.printStackTrace();
			rt.setMsgData(e);
			return false;
		}
		try {
			out.write(content.getBytes(), 0, content.length());
			//关闭输出流
			out.close();
		} catch (IOException e) {
			System.out.println("saveVirtualDocContent() out.write exception");
			e.printStackTrace();
			rt.setMsgData(e);
			return false;
		}
		return true;
	}
	
	protected Integer getMaxFileSize() {
		// TODO Auto-generated method stub
		return null;
	}

	private boolean isNodeExist(String name, Integer parentId, Integer reposId) {
		Doc qdoc = new Doc();
		qdoc.setName(name);
		qdoc.setPid(parentId);
		qdoc.setVid(reposId);
		List <Doc> docList = reposService.getDocList(qdoc);
		if(docList != null && docList.size() > 0)
		{
			return true;
		}
		return false;
	}
	
	Doc getDocByName(String name, Integer parentId, Integer reposId)
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

	//0：虚拟文件系统  1：实文件系统 
	boolean isRealFS(Integer type)
	{
		if(type == 0)
		{
			return false;
		}
		return true;
	}
	
	/********************* Functions For User Opertion Right****************************/
	//检查用户的新增权限
	protected boolean checkUserAddRight(ReturnAjax rt, Integer userId,
			Integer parentId, Integer reposId) {
		DocAuth docUserAuth = getUserDocAuth(userId,parentId,reposId);
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

	protected boolean checkUserDeleteRight(ReturnAjax rt, Integer userId,
			Integer parentId, Integer reposId) {
		DocAuth docUserAuth = getUserDocAuth(userId,parentId,reposId);
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
	
	protected boolean checkUserEditRight(ReturnAjax rt, Integer userId, Integer docId,
			Integer reposId) {
		DocAuth docUserAuth = getUserDocAuth(userId,docId,reposId);
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
	
	protected boolean checkUseAccessRight(ReturnAjax rt, Integer userId, Integer docId,
			Integer reposId) {
		DocAuth docAuth = getUserDocAuth(userId,docId,reposId);
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
	
	
	/*************** Functions For verRepos *********************/
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
	
	private List<LogEntry> gitGetHistory(Repos repos, boolean isRealDoc, String docPath, int maxLogNum) {
		GITUtil gitUtil = new GITUtil();
		if(false == gitUtil.Init(repos, isRealDoc, null))
		{
			System.out.println("gitGetHistory() gitUtil.Init Failed");
			return null;
		}
		return gitUtil.getHistoryLogs(docPath, null, null, maxLogNum);
	}
	
	private List<LogEntry> svnGetHistory(Repos repos,boolean isRealDoc, String docPath, int maxLogNum) {

		SVNUtil svnUtil = new SVNUtil();
		if(false == svnUtil.Init(repos, isRealDoc, null))
		{
			System.out.println("svnGetHistory() svnUtil.Init Failed");
			return null;
		}
		return svnUtil.getHistoryLogs(docPath, 0, -1, maxLogNum);
	}
	
	private boolean verReposRealDocAdd(Repos repos, String parentPath,String entryName,Integer type,String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(commitMsg == null)
		{
			commitMsg = "Add " + parentPath +  entryName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(commitMsg, commitUser);
			return svnRealDocCommit(repos,parentPath,entryName,type,commitMsg,commitUser,rt);
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocAdd(repos,parentPath,entryName,type,commitMsg,commitUser,rt);
		}
		return true;
	}

	private boolean svnRealDocCommit(Repos repos, String parentPath,String entryName,Integer type,String commitMsg, String commitUser, ReturnAjax rt) 
	{
		String remotePath = parentPath + entryName;
		String reposRPath = getReposRealPath(repos);
		
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("svnRealDocCommit() " + remotePath + " svnUtil.Init失败！");	
			return false;
		}
		
		Integer entryType = svnUtil.getEntryType(remotePath, -1);
		if(entryType == 0)	//检查文件是否已经存在于仓库中
		{
			if(type == 1)
			{
				String localFilePath = reposRPath + remotePath;
				if(svnUtil.svnAddFile(parentPath,entryName,localFilePath,commitMsg,commitUser) == false)
				{
					System.out.println("svnRealDocCommit() " + remotePath + " svnUtil.svnAddFile失败！");	
					rt.setMsgData("svnRealDocCommit() " + remotePath + " svnUtil.svnAddFile失败！");	
					return false;
				}
			}
			else
			{
				if(svnUtil.svnAddDir(parentPath,entryName,commitMsg,commitUser) == false)
				{
					System.out.println("svnRealDocCommit() " + remotePath + " svnUtil.svnAddDir失败！");	
					rt.setMsgData("svnRealDocCommit() " + remotePath + " svnUtil.svnAddDir失败！");
					return false;
				}
			}
		}
		else //如果已经存在（需要检查Entry类型是否相同）
		{
			if(type != entryType)
			{
				System.out.println("svnRealDocCommit() remoteEntry 与 localEntry 类型不同: remoteType=" + entryType + " localType=" + type);
				rt.setMsgData("svnRealDocCommit() remoteEntry 与 localEntry 类型不同: remoteType=" + entryType + " localType=" + type);
				return true;	
			}
			
			if(type == 1)
			{				
				String localFilePath = reposRPath + remotePath;
				if(svnUtil.svnModifyFile(parentPath,entryName,null, localFilePath, commitMsg,commitUser) == false)
				{
					System.out.println("svnRealDocCommit() " + remotePath + " remoteModifyFile失败！");
					System.out.println("svnRealDocCommit() svnUtil.svnModifyFile " + " parentPath:" + parentPath  + " name:" + entryName + " localFilePath:" + localFilePath);
					return false;
				}
			}
			else	//For Dir
			{
				System.out.println("svnRealDocCommit() " + remotePath + " 已存在！");
				return true;
			}
		}
		
		return true;
	}
	
	private boolean gitRealDocAdd(Repos repos, String parentPath, String entryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		if(entryName == null || entryName.isEmpty())
		{
			System.out.println("gitRealDocAdd() entryName can not be empty");
			return false;
		}
		
		//Do Commit
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitRealDocAdd() GITUtil Init failed");
			return false;
		}

		//Add to Doc to WorkingDirectory
		String docPath = getReposRealPath(repos) + parentPath + entryName;
		String wcDocPath = getLocalVerReposPath(repos, true) + parentPath + entryName;
		if(type == 1)
		{
			if(copyFile(docPath, wcDocPath, false) == false)
			{
				System.out.println("gitRealDocAdd() add File to WD error");					
				return false;
			}
		}
		else
		{
			//Add Dir
			File dir = new File(wcDocPath);
			if(dir.mkdir() == false)
			{
				System.out.println("gitRealDocAdd() add Dir to WD error");										
				return false;
			}
		}			
		
		//Commit will roll back WC if there is error
		if(gitUtil.gitAdd(parentPath, entryName,commitMsg, commitUser) == false)
		{
			System.out.println("gitRealDocAdd() GITUtil Commit failed");
			return false;
		}
		
		return true;
	}
	
	private boolean verReposRealDocDelete(Repos repos, String parentPath, String entryName,Integer type,
			String commitMsg, String commitUser, ReturnAjax rt) {	
		if(commitMsg == null)
		{
			commitMsg = "Delete " + parentPath + entryName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(commitMsg, commitUser);
			return svnRealDocDelete(repos, parentPath, entryName, type, commitMsg, commitUser, rt);
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocDelete(repos, parentPath, entryName, type, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean svnRealDocDelete(Repos repos, String parentPath, String name,Integer type,
			String commitMsg, String commitUser, ReturnAjax rt) {
		System.out.println("svnRealDocDelete() parentPath:" + parentPath + " name:" + name);

		String docRPath = parentPath + name;
		SVNUtil svnUtil = new SVNUtil();
		
		if(false == svnUtil.Init(repos, true, commitUser))
		{
			System.out.println("svnRealDocDelete() svnUtil.Init 失败！");
			return false;
		}
		
		if(svnUtil.doCheckPath(docRPath,-1) == true)	//如果仓库中该文件已经不存在，则不需要进行svnDeleteCommit
		{
			if(svnUtil.svnDelete(parentPath,name,commitMsg,commitUser) == false)
			{
				System.out.println("svnRealDocDelete() " + docRPath + " remoteDeleteEntry失败！");
				rt.setMsgData("svnRealDocDelete() svnUtil.svnDelete失败" + " docRPath:" + docRPath + " name:" + name);
				return false;
			}
		}
		
		return true;
	}

	private boolean verReposRealDocCommit(Repos repos, String parentPath, String entryName,Integer type,
			String commitMsg, String commitUser, ReturnAjax rt) {
		
		if(commitMsg == null)
		{
			commitMsg = "Commit " + parentPath + entryName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(commitMsg, commitUser);
			return svnRealDocCommit(repos, parentPath, entryName, type, commitMsg, commitUser, rt);
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocCommit(repos, parentPath, entryName, type, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean verReposRealDocMove(Repos repos, String srcParentPath,String srcEntryName,
			String dstParentPath, String dstEntryName,Integer type, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(commitMsg == null)
		{
			commitMsg = "Move " + srcParentPath + srcEntryName + " to " + dstParentPath + dstEntryName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(commitMsg, commitUser);
			return svnRealDocMove(repos, srcParentPath, srcEntryName, dstParentPath, dstEntryName, type, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocMove(repos, srcParentPath, srcEntryName, dstParentPath, dstEntryName, type, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean verReposRealDocCopy(Repos repos, String srcParentPath, String srcEntryName,
			String dstParentPath, String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(commitMsg == null)
		{
			commitMsg = "Copy " + srcParentPath + srcEntryName + " to " + dstParentPath + dstEntryName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(commitMsg, commitUser);
			return svnRealDocCopy(repos, srcParentPath, srcEntryName, dstParentPath, dstEntryName, type, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRealDocCopy(repos, srcParentPath, srcEntryName, dstParentPath, dstEntryName, type, commitMsg, commitUser, rt);
		}
		return true;
	}
	
	protected boolean verReposCheckOut(Repos repos, boolean isRealDoc, String parentPath, String entryName, String localParentPath, String targetName, String commitId) {
		if(repos.getVerCtrl() == 1)
		{
			long revision = Long.parseLong(commitId);
			return svnCheckOut(repos, isRealDoc, parentPath, entryName, localParentPath, targetName, revision);		
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitCheckOut(repos, isRealDoc, parentPath, entryName, localParentPath, targetName, commitId);
		}
		return true;
	}
	
	private boolean verReposRevertRealDoc(Repos repos, String parentPath,String entryName, Integer type, ReturnAjax rt) 
	{
		if(repos.getVerCtrl() == 1)
		{
			return svnRevertRealDoc(repos, parentPath, entryName, type, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRevertRealDoc(repos, parentPath, entryName, type, rt);
		}
		return true;
	}
	
	private boolean verReposVirtualDocAdd(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) 
	{	
		if(commitMsg == null)
		{
			commitMsg = "Add " + docVName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(commitMsg, commitUser);
			return svnVirtualDocAdd(repos, docVName, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocAdd(repos, docVName, commitMsg, commitUser, rt);
		}
		return true;
	}
	
	private boolean verReposVirtualDocDelete(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(commitMsg == null)
		{
			commitMsg = "Delete " + docVName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(commitMsg, commitUser);
			return svnVirtualDocDelete(repos, docVName, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocDelete(repos, docVName, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean verReposVirtualDocCommit(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) {
		if(commitMsg == null)
		{
			commitMsg = "Commit " + docVName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(commitMsg, commitUser);
			return svnVirtualDocCommit(repos, docVName, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocCommit(repos, docVName, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean verReposVirtualDocMove(Repos repos, String srcDocVName,String dstDocVName, String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(commitMsg == null)
		{
			commitMsg = "Move " + srcDocVName + " to " + dstDocVName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(commitMsg, commitUser);
			return svnVirtualDocMove(repos, srcDocVName,dstDocVName, commitMsg, commitUser, rt);			
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocMove(repos, srcDocVName,dstDocVName, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean verReposVirtualDocCopy(Repos repos,String srcDocVName,String dstDocVName,String commitMsg, String commitUser, ReturnAjax rt) 
	{
		if(commitMsg == null)
		{
			commitMsg = "Copy " + srcDocVName + " to " + dstDocVName;
		}
		
		if(repos.getVerCtrl() == 1)
		{
			commitMsg = commitMsgFormat(commitMsg, commitUser);
			return svnVirtualDocCopy(repos, srcDocVName, dstDocVName, commitMsg, commitUser, rt);		
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitVirtualDocCopy(repos, srcDocVName, dstDocVName, commitMsg, commitUser, rt);
		}
		return true;
	}

	private boolean verReposRevertVirtualDoc(Repos repos, String docVName) {
		if(repos.getVerCtrl() == 1)
		{
			return svnRevertVirtualDoc(repos, docVName);		
		}
		else if(repos.getVerCtrl() == 2)
		{
			return gitRevertVirtualDoc(repos, docVName);
		}
		return true;
	}
	
	/********************** Functions For git *************************************/
	private boolean gitRealDocDelete(Repos repos, String parentPath, String entryName, Integer type, String commitMsg,String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		if(entryName == null || entryName.isEmpty())
		{
			System.out.println("gitRealDocDelete() entryName can not be empty");
			return false;
		}

		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitRealDocDelete() GITUtil Init failed");
			return false;
		}
		
		//Add to Doc to WorkingDirectory
		String wcDocPath = getLocalVerReposPath(repos, true) + parentPath + entryName;
		if(delFileOrDir(wcDocPath) == false)
		{
			System.out.println("gitRealDocDelete() delete working copy failed");
		}
			
		if(gitUtil.Commit(parentPath, entryName,commitMsg, commitUser)== false)
		{
			System.out.println("gitRealDocDelete() GITUtil Commit failed");
			return false;
		}
		
		return true;
	}
	
	private boolean gitRealDocCommit(Repos repos, String parentPath, String entryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		if(entryName == null || entryName.isEmpty())
		{
			System.out.println("gitRealDocCommit() entryName can not be empty");
			return false;
		}

		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitRealDocCommit() GITUtil Init failed");
			return false;
		}
	
		//Copy to Doc to WorkingDirectory
		String docPath = getReposRealPath(repos) + parentPath + entryName;
		String wcDocPath = getLocalVerReposPath(repos, true) + parentPath + entryName;
		if(type == 1)
		{
			if(copyFile(docPath, wcDocPath, true) == false)
			{
				System.out.println("gitRealDocCommit() copy File to working directory failed");					
				return false;
			}
		}
		else
		{
			System.out.println("gitRealDocCommit() dir can not modify");
			return false;
		}			
				
		//Commit will roll back WC if there is error
		if(gitUtil.Commit(parentPath, entryName,commitMsg, commitUser) == false)
		{
			System.out.println("gitRealDocCommit() GITUtil Commit failed");
			return false;
		}
		
		return true;	
	}
	
	private boolean gitRealDocMove(Repos repos, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {	
		
		return gitDocMove(repos, true, srcParentPath, srcEntryName, dstParentPath,dstEntryName, commitMsg, commitUser, rt);
	}
	
	private boolean gitRealDocCopy(Repos repos, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
		return  gitDocCopy(repos, true, srcParentPath, srcEntryName, dstParentPath, dstEntryName,  commitMsg, commitUser, rt);
	}
	
	private boolean gitDocMove(Repos repos, boolean isRealDoc, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, String commitMsg, String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		System.out.println("gitDocMove() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
		if(srcEntryName == null || srcEntryName.isEmpty())
		{
			System.out.println("gitDocMove() srcEntryName can not be empty");
			return false;
		}
		
		if(dstEntryName == null || dstEntryName.isEmpty())
		{
			System.out.println("gitDocMove() dstEntryName can not be empty");
			return false;
		}
		
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitDocMove() GITUtil Init failed");
			return false;
		}
	
		//Do move at Working Directory
		String wcSrcDocParentPath = getLocalVerReposPath(repos, isRealDoc) + srcParentPath;
		String wcDstParentDocPath = getLocalVerReposPath(repos, isRealDoc) + dstParentPath;	
		if(moveFileOrDir(wcSrcDocParentPath, srcEntryName,wcDstParentDocPath, dstEntryName,false) == false)
		{
			System.out.println("gitDocMove() moveFileOrDir Failed");					
			return false;
		}
				
		//Commit will roll back WC if there is error
		if(gitUtil.gitMove(srcParentPath, srcEntryName, dstParentPath, dstEntryName, commitMsg, commitUser) == false)
		{
			System.out.println("gitDocMove() GITUtil Commit failed");
			return false;
		}
		
		return true;	
	}
	
	private boolean gitDocCopy(Repos repos, boolean isRealDoc, String srcParentPath, String srcEntryName, String dstParentPath,
			String dstEntryName, String commitMsg, String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		System.out.println("gitDocCopy() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
		if(srcEntryName == null || srcEntryName.isEmpty())
		{
			System.out.println("gitDocCopy() srcEntryName can not be empty");
			return false;
		}

		if(dstEntryName == null || dstEntryName.isEmpty())
		{
			System.out.println("gitDocCopy() dstEntryName can not be empty");
			return false;
		}
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, commitUser) == false)
		{
			System.out.println("gitDocCopy() GITUtil Init failed");
			return false;
		}
	
		//Do move at Working Directory
		String wcSrcDocParentPath = getLocalVerReposPath(repos, isRealDoc) + srcParentPath;
		String wcDstParentDocPath = getLocalVerReposPath(repos, isRealDoc) + dstParentPath;	
		if(copyFileOrDir(wcSrcDocParentPath+srcEntryName,wcDstParentDocPath+dstEntryName,false) == false)
		{
			System.out.println("gitDocCopy() moveFileOrDir Failed");					
			return false;
		}
				
		//Commit will roll back WC if there is error
		if(gitUtil.gitCopy(srcParentPath, srcEntryName, dstParentPath, dstEntryName, commitMsg, commitUser) == false)
		{
			System.out.println("gitDocCopy() GITUtil Commit failed");
			return false;
		}
		
		return true;	
	}

	private boolean gitCheckOut(Repos repos, boolean isRealDoc, String parentPath, String entryName, String localParentPath, String targetName, String revision) {
		// TODO Auto-generated method stub
		System.out.println("gitCheckOut() parentPath:" + parentPath + " entryName:" + entryName + " localParentPath:" + localParentPath + " revision:" + revision);
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, true, null) == false)
		{
			System.out.println("gitCheckOut() GITUtil Init failed");
			return false;
		}
		
		return gitUtil.getEntry(parentPath, entryName, localParentPath, targetName, revision);
	}
	
	private boolean gitRevertRealDoc(Repos repos, String parentPath, String entryName, Integer type, ReturnAjax rt) {
		// TODO Auto-generated method stub
		System.out.println("gitRevertRealDoc() parentPath:" + parentPath + " entryName:" + entryName);
		String localParentPath = getReposRealPath(repos) + parentPath;

		//revert from svn server
		return gitCheckOut(repos, true, parentPath, entryName, localParentPath, entryName,null);
	}
		
	private boolean gitVirtualDocAdd(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		if(docVName == null || docVName.isEmpty())
		{
			System.out.println("gitVirtualDocAdd() entryName can not be empty");
			return false;
		}
		
		//Do Commit
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, false, commitUser) == false)
		{
			System.out.println("gitVirtualDocAdd() GITUtil Init failed");
			return false;
		}

		//Commit will roll back WC if there is error
		String localPath = getReposVirtualPath(repos);		
		if(gitUtil.doAutoCommit("", docVName, localPath,commitMsg, commitUser, true, null) == false)
		{
			System.out.println("gitVirtualDocAdd() GITUtil Commit failed");
			return false;
		}
		
		return true;
	}
	
	private boolean gitVirtualDocDelete(Repos repos, String docVName, String commitMsg, String commitUser,
			ReturnAjax rt) {
		// TODO Auto-generated method stub
		if(docVName == null || docVName.isEmpty())
		{
			System.out.println("gitVirtualDocDelete() docVName can not be empty");
			return false;
		}

		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, false, commitUser) == false)
		{
			System.out.println("gitVirtualDocDelete() GITUtil Init failed");
			return false;
		}
		
		//Add to Doc to WorkingDirectory
		String wcDocPath = getLocalVerReposPath(repos, false) + docVName;
		if(delDir(wcDocPath) == false)
		{
			System.out.println("gitVirtualDocDelete() delete working copy failed");
		}
			
		if(gitUtil.Commit("", docVName,commitMsg, commitUser)== false)
		{
			System.out.println("gitVirtualDocDelete() GITUtil Commit failed");
			return false;
		}
		
		return true;
	}
	
	private boolean gitVirtualDocCommit(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		if(docVName == null || docVName.isEmpty())
		{
			System.out.println("gitRealDocCommit() entryName can not be empty");
			return false;
		}

		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, false, commitUser) == false)
		{
			System.out.println("gitRealDocAdd() GITUtil Init failed");
			return false;
		}
	
				
		//Commit will roll back WC if there is error
		String localPath = getReposVirtualPath(repos);		
		if(gitUtil.doAutoCommit("", docVName, localPath,commitMsg, commitUser, true, null) == false)
		{
			System.out.println("gitRealDocCommit() GITUtil Commit failed");
			return false;
		}
		
		return true;
	}

	private boolean gitVirtualDocMove(Repos repos, String srcDocVName, String dstDocVName, String commitMsg,
			String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		return gitDocMove(repos, false, "", srcDocVName, "", dstDocVName, commitMsg, commitUser, rt);
	}
	
	private boolean gitVirtualDocCopy(Repos repos, String srcDocVName, String dstDocVName, String commitMsg,
			String commitUser, ReturnAjax rt) {
		// TODO Auto-generated method stub
		return  gitDocCopy(repos, false, "", srcDocVName, "", dstDocVName,  commitMsg, commitUser, rt);
	}
	
	private boolean gitRevertVirtualDoc(Repos repos, String docVName) {
		// TODO Auto-generated method stub
		System.out.println("svnRevertRealDoc() docVName:" + docVName);
		String localParentPath = getReposVirtualPath(repos);

		//revert from svn server
		return gitCheckOut(repos, false, "", docVName, localParentPath, docVName,null);
	}
	
	/********************** Functions for SVN ***************************/
	private boolean svnRealDocMove(Repos repos, String srcParentPath,String srcEntryName,
			String dstParentPath, String dstEntryName,Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
		
		System.out.println("svnRealDocMove() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
		if(svnMove(repos, true, srcParentPath,srcEntryName,dstParentPath,dstEntryName,commitMsg, commitUser, rt) == false)
		{
			System.out.println("svnRealDocMove() svnMove Failed！");
			rt.setMsgData("svnMove Failed！");
			return false;
		}
			
		return true;
	}
	
	private boolean svnCopy(Repos repos, boolean isRealDoc, String srcParentPath, String srcEntryName, String dstParentPath,String dstEntryName, 
			String commitMsg, String commitUser, ReturnAjax rt) 
	{
		SVNUtil svnUtil = new SVNUtil();
		if(false == svnUtil.Init(repos, isRealDoc, commitUser))
		{
			System.out.println("svnCopy() svnUtil.Init Failed: srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath+ " dstEntryName:" + dstEntryName);
			return false;
		}
		
		if(svnUtil.svnCopy(srcParentPath, srcEntryName, dstParentPath, dstEntryName, commitMsg, commitUser, false) == false)
		{
			System.out.println("svnCopy() svnUtil.svnCopy Failed: " + " srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath+ " dstEntryName:" + dstEntryName);
			rt.setMsgData("svnCopy() svnUtil.svnCopy " + " srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath+ " dstEntryName:" + dstEntryName);
			return false;
		}
		return true;
	}
	
	private boolean svnMove(Repos repos, boolean isRealDoc, String srcParentPath,String srcEntryName, String dstParentPath,String dstEntryName, 
			String commitMsg, String commitUser, ReturnAjax rt)  
	{
		SVNUtil svnUtil = new SVNUtil();
		if(false == svnUtil.Init(repos, isRealDoc, commitUser))
		{
			System.out.println("svnMove() svnUtil.Init Failed: srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath+ " dstEntryName:" + dstEntryName);
			return false;
		}
		
		if(svnUtil.svnCopy(srcParentPath, srcEntryName, dstParentPath,dstEntryName, commitMsg,commitUser,true) == false)
		{
			System.out.println("svnMove() svnUtil.svnCopy Failed: " + " srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath+ " dstEntryName:" + dstEntryName);
			rt.setMsgData("svnMove() svnUtil.svnCopy " + " srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath+ " dstEntryName:" + dstEntryName);
			return false;
		}
		return true;
	}

	private boolean svnRealDocCopy(Repos repos, String srcParentPath, String srcEntryName,
			String dstParentPath, String dstEntryName, Integer type, String commitMsg, String commitUser, ReturnAjax rt) {
		
		System.out.println("svnRealDocCopy() srcParentPath:" + srcParentPath + " srcEntryName:" + srcEntryName + " dstParentPath:" + dstParentPath + " dstEntryName:" + dstEntryName);
			
		if(svnCopy(repos, true, srcParentPath,srcEntryName,dstParentPath,dstEntryName,commitMsg,commitUser,rt) == false)
		{
			System.out.println("文件: " + srcEntryName + " svnCopy失败");
			return false;
		}
		return true;
	}

	private boolean svnCheckOut(Repos repos, boolean isRealDoc, String parentPath,String entryName, String localParentPath,String targetName,long revision) 
	{
		System.out.println("svnCheckOut() parentPath:" + parentPath + " entryName:" + entryName + " localParentPath:" + localParentPath + " revision:" + revision);
		
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, isRealDoc, null) == false)
		{
			System.out.println("svnCheckOut() svnUtil Init Failed");
			return false;
		}

		return svnUtil.getEntry(parentPath, entryName, localParentPath, targetName, revision);
	}

	private boolean svnRevertRealDoc(Repos repos, String parentPath,String entryName, Integer type, ReturnAjax rt) 
	{
		System.out.println("svnRevertRealDoc() parentPath:" + parentPath + " entryName:" + entryName);
		String localParentPath = getReposRealPath(repos) + parentPath;

		//revert from svn server
		return svnCheckOut(repos, true, parentPath, entryName, localParentPath, entryName,-1);
	}

	private boolean svnVirtualDocAdd(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) {
		
		System.out.println("svnVirtualDocAdd() docVName:" + docVName);
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, false, commitUser) == false)
		{
			System.out.println("svnVirtualDocAdd() svnUtil Init Failed!");
			rt.setMsgData("svnVirtualDocAdd() svnUtil Init Failed!");
			return false;
		}
		
		String reposVPath =  getReposVirtualPath(repos);
		
		//modifyEnable set to false
		if(svnUtil.doAutoCommit("",docVName,reposVPath,commitMsg,commitUser,false,null) == false)
		{
			System.out.println(docVName + " doAutoCommit失败！");
			rt.setMsgData("doAutoCommit失败！" + " docVName:" + docVName + " reposVPath:" + reposVPath);
			return false;
		}
		return true;
	}

	private boolean svnVirtualDocDelete(Repos repos, String docVName, String commitMsg, String commitUser, ReturnAjax rt) {
		System.out.println("svnVirtualDocDelete() docVName:" + docVName);
		SVNUtil svnUtil = new SVNUtil();
		if(false == svnUtil.Init(repos, false, commitUser))
		{
			System.out.println("svnVirtualDocDelete()  svnUtil.Init 失败！");
			return false;
		}
		
		if(svnUtil.doCheckPath(docVName,-1) == true)	//如果仓库中该文件已经不存在，则不需要进行svnDeleteCommit
		{
			if(svnUtil.svnDelete("",docVName,commitMsg,commitUser) == false)
			{
				System.out.println("svnVirtualDocDelete() " + docVName + " remoteDeleteEntry失败！");
				rt.setMsgData("svnVirtualDocDelete() svnUtil.svnDelete "  + docVName +" 失败 ");
				return false;
			}
		}
		return true;
	}

	private boolean svnVirtualDocCommit(Repos repos, String docVName,String commitMsg, String commitUser, ReturnAjax rt) {
		System.out.println("svnVirtualDocCommit() docVName:" + docVName);
		String reposVPath =  getReposVirtualPath(repos);
		
		SVNUtil svnUtil = new SVNUtil();
		if(false == svnUtil.Init(repos, false, commitUser))
		{
			System.out.println("svnVirtualDocCommit() svnUtil.Init 失败！");
			return false;
		}
		
		if(svnUtil.doAutoCommit("",docVName,reposVPath,commitMsg,commitUser,true,null) == false)
		{
			System.out.println("svnVirtualDocCommit() " + docVName + " doCommit失败！");
			rt.setMsgData(" doCommit失败！" + " docVName:" + docVName + " reposVPath:" + reposVPath);
			return false;
		}
		
		return true;
	}

	private boolean svnVirtualDocMove(Repos repos, String srcDocVName,String dstDocVName, String commitMsg, String commitUser, ReturnAjax rt) {
		System.out.println("svnVirtualDocMove() srcDocVName:" + srcDocVName + " dstDocVName:" + dstDocVName);
		if(svnMove(repos, false,"",srcDocVName,"",dstDocVName,commitMsg,commitUser, rt) == false)
		{
			System.out.println("svnMove Failed！");
			rt.setMsgData("svnVirtualDocMove() svnMove Failed！");
			return false;
		}
		return true;
	}

	private boolean svnVirtualDocCopy(Repos repos,String srcDocVName,String dstDocVName,String commitMsg, String commitUser, ReturnAjax rt) {

		System.out.println("svnVirtualDocCopy() srcDocVName:" + srcDocVName + " dstDocVName:" + dstDocVName);			
		if(svnCopy(repos, false, "",srcDocVName,"",dstDocVName,commitMsg,commitUser,rt) == false)
		{
			System.out.println("文件: " + srcDocVName + " svnCopy失败");
			return false;
		}
		return true;
	}

	private boolean svnRevertVirtualDoc(Repos repos, String docVName) {
		System.out.println("svnRevertVirtualDoc() docVName:" + docVName);
		
		String localDocVParentPath = getReposVirtualPath(repos);

		return svnCheckOut(repos, false, "", docVName, localDocVParentPath, docVName,-1);
	}
	
	private String commitMsgFormat(String commitMsg, String commitUser) {
		commitMsg = commitMsg + " by [" + commitUser + "] ";
		return commitMsg;
	}
	
	//Add Index For VDoc
	private void addIndexForVDoc(Integer docId, String content) {
		if(content == null || "".equals(content))
		{
			return;
		}
		
		try {
			System.out.println("addIndexForVDoc() add index in lucne: docId " + docId + " content:" + content);
			//Add Index For Content
			LuceneUtil2.addIndex(docId + "-0", docId,content, "doc");
		} catch (Exception e) {
			System.out.println("addIndexForVDoc() Failed to update lucene Index");
			e.printStackTrace();
		}
	}
	
	private void updateIndexForVDoc(Integer id, String content) {
		try {
			System.out.println("updateIndexForVDoc() updateIndexForVDoc in lucene: docId " + id);
			LuceneUtil2.updateIndexForVDoc(id,content,"doc");
		} catch (Exception e) {
			System.out.println("updateIndexForVDoc() Failed to update lucene Index");
			e.printStackTrace();
		}
	}
	
	private void updateIndexForRDoc(Integer docId, String localDocRPath) {
		//Add the doc to lucene Index
		try {
			System.out.println("updateIndexForRDoc() add index in lucne: docId " + docId);
			//Add Index For File
			LuceneUtil2.updateIndexForRDoc(docId,localDocRPath, "doc");
		} catch (Exception e) {
			System.out.println("updateIndexForRDoc() Failed to update lucene Index");
			e.printStackTrace();
		}
	}
	
	private void deleteIndexForDoc(Integer docId, String string) {
		try {
			System.out.println("DeleteDoc() delete index in lucne: docId " + docId);
			LuceneUtil2.deleteIndexForDoc(docId,"doc");
		} catch (Exception e) {
			System.out.println("DeleteDoc() Failed to delete lucene Index");
			e.printStackTrace();
		}
	}
	
	//SyncUp DB/LocalEntry/RemoteEntry with entryNode in verRepos For display
	//Attention:	(1)this function should be called after SyncUpDBWithVerRepos 
	//				(2)这个函数会调用add/delete/update接口来同步，因此相当于从远程上传
	private int SyncUpWithMirror(Repos repos, Doc parentDoc, String parentPath, List<Doc> subDocList,User login_user,ReturnAjax rt)
	{
		//TODO: 
		return 0;
	}
	
	//SyncUp docNode in DataBase with entryNode in verRepos For display
	//Attention: localEntryNode will also be deleted or added but will not be updated
	protected int SyncUpWithVerRepos(Repos repos, Integer pid, Doc parentDoc, String parentPath, String localParentPath, String commitId,List<Doc> subDocList,User login_user,ReturnAjax rt, boolean recurEnable, boolean skipRealDocAdd)
	{	
		System.out.println("SyncUpWithVerRepos() pid:" + pid + " parentPath:" + parentPath + " localParentPath:" + localParentPath + " commitId:" + commitId + " recurEnable:" + recurEnable + " skipRealDocAdd:" + skipRealDocAdd); 
		//Do SyncUp
		if(repos.getVerCtrl() == 1)
		{
			SVNUtil svnUtil = new SVNUtil();
			if(false == svnUtil.Init(repos, true, null))
			{
				System.out.println("initReposWithSvnRepos() svnUtil.Init Failed");
				return -1;
			}

			List<Doc> subDoclist = getSubDocListFromDB(repos, pid);
			
			long revision = -1;
			if(commitId != null)
			{
				revision = Long.parseLong(commitId);
			}
			int ret = SyncUpWithSvnRepos(svnUtil, repos, pid, parentDoc, parentPath, localParentPath, revision, subDoclist, login_user, rt, recurEnable, skipRealDocAdd);
			System.out.println("SyncUpWithSvnRepos() count=" + ret); 
			return ret;
		}
		else if(repos.getVerCtrl() == 2)
		{
			return SyncUpWithGitRepos(repos, parentDoc, parentPath, subDocList, login_user, rt);
		}
		return 0;
	}
	

	private int SyncUpWithGitRepos(Repos repos, Doc parentDoc, String parentPath, List<Doc> subDocList,User login_user,ReturnAjax rt) {
		// TODO Auto-generated method stub
		return 0;
	}

	//与版本仓库进行同步
	private int SyncUpWithSvnRepos(SVNUtil svnUtil, Repos repos,Integer pid, Doc parentDoc, String parentPath, String localParentPath, long revision,List<Doc> subDocList, 
			User login_user,ReturnAjax rt, boolean recurEnable, boolean skipRealDocAdd) {	
		System.out.println("SyncUpWithSvnRepos() reposId:" + repos.getId() + " pid:" + pid + " parentPath:" + parentPath + " localParentPath:" + localParentPath + " recurEnable:" + recurEnable + " skipRealDocAdd:" + skipRealDocAdd); 
		
		if(pid != 0)
		{
			if(parentDoc == null)
			{
				System.out.println("SyncUpWithSvnRepos() parentDoc 不存在无法同步"); 
				return 0;
			}
		}
		
		int count = 0;
		//Schedule For Delete
		HashMap<String,Doc> docHashMap = new HashMap<String,Doc>();	//用来存放已经Schedule For Delete 之后的Docs
		if(subDocList != null)
		{
			for(int i=0; i < subDocList.size(); i++)
			{
				Doc subDoc = subDocList.get(i);
				String subDocName = subDoc.getName();
				
				int entryType =	svnUtil.getEntryType(parentPath+subDocName, revision);
				if(0 == entryType)
				{	
					System.out.println("SyncUpWithSvnRepos() deleteDoc:" + subDoc.getId() + " and localEntry:" +localParentPath +subDocName); 
					//deleteDoc(skipRealDocCommit), so we do not need the commitMsg and commitUser, but virtualDoc delete will be done by using default commitMsg and commitUser
					if(true == deleteDoc(repos,subDoc.getId(), pid, null, null, login_user, rt, false, true))
					{
						count++;
					}
					else
					{
						docHashMap.put(subDocName, subDoc);	//Add to docHashMap
					}
				}
				else
				{
					docHashMap.put(subDocName, subDoc);	//Add to docHashMap
				}
			}
		}
		
		//Schedule For Add
		//Get list from verRepos
		List<SVNDirEntry> subEntryList =  svnUtil.getSubEntries(parentPath, revision); 
		for(int i=0; i < subEntryList.size(); i++)
		{
			SVNDirEntry subEntry = subEntryList.get(i);
			String subEntryName = subEntry.getName();
			Integer subEntryType = convertSVNNodeKindToEntryType(subEntry.getKind());
			//SyncUp with localDir
			Doc subDoc = docHashMap.get(subEntryName);
			if(null == subDoc)
			{
				System.out.println("SyncUpWithSvnRepos() addDoc:" + subEntryName + " and localEntry:" +localParentPath +subEntryName); 
				Doc newSubDoc = addDocFromSvnEntry(repos, svnUtil, subEntry, parentDoc, parentPath, localParentPath, login_user, skipRealDocAdd);
				if(newSubDoc != null)
				{
					count++;
					if(recurEnable)
					{
						if(subEntryType == 2)
						{
							count += SyncUpWithSvnRepos(svnUtil, repos, newSubDoc.getId(), newSubDoc, parentPath + subEntryName +"/", localParentPath + subEntryName + "/", revision, null, login_user, rt, recurEnable, skipRealDocAdd);
						}
						
					}
				}
			}
			else
			{
				//If the type is not matched, do delete and add back
				if(subDoc.getType() != subEntryType)
				{
					System.out.println("SyncUpWithSvnRepos() Doc type:" + subDoc.getType() + " not matched with remoteEntry type:" + subEntryType); 
					System.out.println("SyncUpWithSvnRepos() deleteDoc:" + subDoc.getId() + " and localEntry:" +localParentPath +subDoc.getName()); 
					if(true == deleteDoc(repos,subDoc.getId(), pid, null, null, login_user, rt, false, true))
					{
						System.out.println("SyncUpWithSvnRepos() addDoc:" + subEntryName + " and localEntry:" +localParentPath +subEntryName); 
						Doc newSubDoc = addDocFromSvnEntry(repos, svnUtil, subEntry, parentDoc, parentPath, localParentPath, login_user, false);
						if(newSubDoc != null)
						{
							count++;
							if(recurEnable)
							{
								if(subEntryType == 2)
								{
									count += SyncUpWithSvnRepos(svnUtil, repos, newSubDoc.getId(), newSubDoc, parentPath + subEntryName +"/", localParentPath + subEntryName + "/",revision, null, login_user, rt, recurEnable, false);
								}
							}
						}
					}
				}
				else
				{
					if(recurEnable)
					{
						if(subEntryType == 2)
						{
							List<Doc> doclist = getSubDocListFromDB(repos, subDoc.getId());
							count += SyncUpWithSvnRepos(svnUtil, repos, subDoc.getId(), subDoc, parentPath + subEntryName +"/", localParentPath + subEntryName + "/", revision, doclist, login_user, rt, recurEnable, skipRealDocAdd);
						}
					}
				}
			}
		}
		return count;
	}
	
	private Integer convertSVNNodeKindToEntryType(SVNNodeKind nodeKind) {
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

	private Doc addDocFromSvnEntry(Repos repos, SVNUtil svnUtil, SVNDirEntry remoteEntry, Doc parentDoc, String parentPath, String localParentPath, User login_user, boolean skipRealDocAdd) {
		//Do add File or add Dir
		boolean ret = false;
		Integer entryType = null;
		String entryName = remoteEntry.getName();

		if(skipRealDocAdd)
		{
			ret = true;
		}
		else
		{
			File localEntry = new File(localParentPath, entryName);
			if(remoteEntry.getKind() == SVNNodeKind.DIR)
			{
				ret = localEntry.mkdir();
				entryType = 2;
			}
			else
			{
				ret = svnUtil.getEntry(parentPath, entryName, localParentPath, entryName, -1);
				entryType = 1;
			}
		}
		
		//Add DB Node
		if(true == ret)
		{
			//新建doc记录
			Integer pid = 0;
			if(parentDoc != null)
			{
				pid = parentDoc.getId();
			}
			Doc subDoc = new Doc();
			subDoc.setName(entryName);
			subDoc.setType(entryType);
			subDoc.setSize((int) remoteEntry.getSize());
			subDoc.setCheckSum("");
			subDoc.setVid(repos.getId());
			subDoc.setPid(pid);
			//set createTime
			long nowTimeStamp = remoteEntry.getDate().getTime();	//get subEntry latestModify Time
			subDoc.setCreateTime(nowTimeStamp);
			subDoc.setCreator(login_user.getId());
			subDoc.setLatestEditTime(nowTimeStamp);
			subDoc.setLatestEditor(login_user.getId());
			if(reposService.addDoc(subDoc) == 0)
			{
				return subDoc;					
			}
		}
		return null;
	}
	
	//获取子节点List in DataBase
	protected List <Doc> getSubDocListFromDB(Repos repos, Integer pid)
	{
		Doc doc = new Doc();
		doc.setPid(pid);
		doc.setVid(repos.getId());
		return reposService.getDocList(doc);
	}
	
	//获取目录parentPath下的所有子节点
	protected List <Doc> getSubDocListFromFS(Repos repos, Integer pid, Integer pLevel, String parentPath, User login_user, ReturnAjax rt)
	{
		String localParentPath = getReposRealPath(repos) + parentPath;
		File dir = new File(localParentPath);
    	if(false == dir.exists())
    	{
    		System.out.println("getSubDocList() " + parentPath + " 不存在！");
    		rt.setError( parentPath + " 不存在！");
    		return null;
    	}
    	
        //Go through the subEntries
    	if(false == dir.isDirectory())
    	{
    		System.out.println("getSubDocList() " + parentPath + " 不是目录！");
    		rt.setError( parentPath + " 不是目录！");
    		return null;
    	}
 	
        //Get fileList and add it to docList
    	List<Doc> docList = new ArrayList<Doc>();
    	File[] tmp=dir.listFiles();
    	for(int i=0;i<tmp.length;i++)
    	{
    		File subEntry = tmp[i];
    		int subEntryType = subEntry.isDirectory()? 2: 1;
    		
    		//Create Doc to save subEntry Info
    		Doc subDoc = new Doc();
    		int subDocId = pLevel*1000000 + i + 1;	//单层目录支持100万个文件节点
    		subDoc.setVid(repos.getId());
    		subDoc.setPid(pid);
       		subDoc.setId(subDocId);
    		subDoc.setName(subEntry.getName());
    		subDoc.setType(subEntryType);
    		docList.add(subDoc);
    	}
    	return docList;
	}
	
	
	protected boolean verReposAutoCommit(Repos repos,boolean isRealDoc,String parentPath, String entryName, String localParentPath, String localEntryName, 
			String commitMsg, String commitUser,boolean modifyEnable,String localRefPath) {
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
			return svnAutoCommit(repos,isRealDoc,parentPath, entryName, localParentPath, localEntryName, commitMsg,commitUser,modifyEnable,localRefPath);
		}
		else if(verCtrl == 2)
		{
			return gitAutoCommit(repos,isRealDoc,parentPath, entryName, localParentPath, localEntryName, commitMsg,commitUser,modifyEnable,localRefPath);			
		}
		return false;
	}
	
	private boolean gitAutoCommit(Repos repos,boolean isRealDoc,String parentPath, String entryName, String localParentPath, String localEntryName, 
			String commitMsg, String commitUser, boolean modifyEnable, String localRefPath) {
		// TODO Auto-generated method stub
		GITUtil gitUtil = new GITUtil();
		//svn初始化
		if(gitUtil.Init(repos, isRealDoc, commitUser) == false)
		{
			System.out.println("do Init Failed");
			return false;
		}
		
		return gitUtil.doAutoCommit(parentPath,entryName,localParentPath+localEntryName,commitMsg,commitUser,modifyEnable,localRefPath);
	}

	//Commit the localPath to svnPath
	boolean svnAutoCommit(Repos repos,boolean isRealDoc,String parentPath, String entryName, String localParentPath, String localEntryName, 
			String commitMsg, String commitUser,boolean modifyEnable,String localRefPath)
	{			
		SVNUtil svnUtil = new SVNUtil();
		//svn初始化
		if(svnUtil.Init(repos,isRealDoc,commitUser) == false)
		{
			System.out.println("do Init Failed");
			return false;
		}
		
		return svnUtil.doAutoCommit(parentPath,entryName,localParentPath+localEntryName,commitMsg,commitUser,modifyEnable,localRefPath);		
	}
	
}
