package com.DocSystem.common;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileUploadException;
import org.apache.tools.ant.Project;
import org.apache.tools.ant.taskdefs.Zip;
import org.apache.tools.ant.types.FileSet;
import org.springframework.web.context.ContextLoader;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.multipart.MultipartFile;

import util.DateFormat;
import util.ReadProperties;
import util.ReturnAjax;
import util.Encrypt.Base64File;
import util.Encrypt.MD5;
import util.FileUtil.CompressPic;

import com.DocSystem.entity.Doc;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.User;
import com.alibaba.fastjson.JSON;

import info.monitorenter.cpdetector.io.ASCIIDetector;
import info.monitorenter.cpdetector.io.CodepageDetectorProxy;
import info.monitorenter.cpdetector.io.JChardetFacade;
import info.monitorenter.cpdetector.io.ParsingDetector;
import info.monitorenter.cpdetector.io.UnicodeDetector;

@SuppressWarnings("rawtypes")
public class BaseFunction{
	protected String ROWS_PER_PAGE;// 每页显示的记录数
	protected String curPage;// 当前第几页

	/******************************** Basic Interface for docSys *************************************/
	protected void docSysDebugLog(String logStr, ReturnAjax rt) {
		System.out.println(logStr);
		if(rt != null)
		{
			rt.setDebugLog(logStr);
		}
	}

	protected void docSysWarningLog(String logStr, ReturnAjax rt) {
		System.out.println(logStr);
		if(rt != null)
		{
			rt.setWarningMsg(logStr);
		}
	}

	protected void docSysErrorLog(String logStr, ReturnAjax rt) {
		System.out.println(logStr);
		if(rt != null)
		{
			rt.setError(logStr);
		}
	}
	
	/******************************** Basic Interface for CommonAction *************************************/
	//CommonAction 主要用于异步行为
	protected void insertSyncUpAction(List<CommonAction> actionList, Repos repos, Doc doc, Integer actionId, Integer actionType, Integer docType, List<CommonAction> subActionList) {
		actionId = 5; //AutoSyncUp

		CommonAction action = new CommonAction();
		action.setType(actionId); //5: AutoSyncUp
		action.setAction(actionType); //3: localModify
		action.setDocType(docType); //1: local Doc Changed
		action.setRepos(repos);
		action.setDoc(doc);
		
		action.setSubActionList(subActionList);
		
		actionList.add(action);
	}
	
	protected void insertAddAction(List<CommonAction> actionList, Repos repos, Doc doc, String commitMsg,String commitUser, Integer actionId, Integer actionType, Integer docType, List<CommonAction> subActionList) 
	{
		actionType = 1;	//Add
		
		CommonAction action = new CommonAction();
		action.setType(actionId);		
		action.setAction(actionType);
		action.setDocType(docType);
		
		action.setRepos(repos);
		action.setDoc(doc);
		
		action.setCommitMsg(commitMsg);
		action.setCommitUser(commitUser);
		
		action.setSubActionList(subActionList);
		
		actionList.add(action);
	}
	
	protected void insertDeleteAction(List<CommonAction> actionList, Repos repos, Doc doc, String commitMsg,String commitUser, Integer actionId, Integer actionType, Integer docType, List<CommonAction> subActionList) {
		actionType = 2;	//Delete
		
		CommonAction action = new CommonAction();
		action.setType(actionId);		
		action.setAction(actionType);
		action.setDocType(docType);
		
		action.setRepos(repos);
		action.setDoc(doc);
		
		action.setCommitMsg(commitMsg);
		action.setCommitUser(commitUser);
		
		action.setSubActionList(subActionList);

		actionList.add(action);
	}
	
	protected void insertUpdateAction(List<CommonAction> actionList, Repos repos, Doc doc, String commitMsg,String commitUser, Integer actionId, Integer actionType, Integer docType, List<CommonAction> subActionList) {
		actionType = 3;	//Update
		
		CommonAction action = new CommonAction();
		action.setType(actionId);		
		action.setAction(actionType);
		action.setDocType(docType);
		
		action.setRepos(repos);
		action.setDoc(doc);
		
		action.setCommitMsg(commitMsg);
		action.setCommitUser(commitUser);
		
		action.setSubActionList(subActionList);
		
		actionList.add(action);
	}
	
	protected void insertMoveAction(List<CommonAction> actionList, Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, Integer actionId, Integer actionType, Integer docType, List<CommonAction> subActionList) 
	{
		actionType = 4; //Move
		
		CommonAction action = new CommonAction();
		action.setType(actionId);		
		action.setAction(actionType);
		action.setDocType(docType);
		
		action.setRepos(repos);
		action.setDoc(srcDoc);
		action.setNewDoc(dstDoc);
		
		action.setCommitMsg(commitMsg);
		action.setCommitUser(commitUser);
		
		action.setSubActionList(subActionList);
		
		actionList.add(action);
	}

	protected void insertCopyAction(List<CommonAction> actionList, Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, Integer actionId, Integer actionType, Integer docType, List<CommonAction> subActionList) 
	{
		actionType = 5; //Copy
		
		CommonAction action = new CommonAction();
		action.setType(actionId);		
		action.setAction(actionType);
		action.setDocType(docType);
		
		action.setRepos(repos);
		action.setDoc(srcDoc);
		action.setNewDoc(dstDoc);
		
		action.setCommitMsg(commitMsg);
		action.setCommitUser(commitUser);
		
		action.setSubActionList(subActionList);
		
		actionList.add(action);
	}
	
	/******************************** Basic Interface for CommitAction *************************************/
	//版本仓库底层通用接口
	protected void insertAddFileAction(List<CommitAction> actionList, Doc doc, boolean isSubAction) {
    	CommitAction action = new CommitAction();
    	action.setAction(1);
    	action.setDoc(doc);
    	action.isSubAction = isSubAction;
    	actionList.add(action);
	}
    
	protected void insertAddDirAction(List<CommitAction> actionList,Doc doc, boolean isSubAction) 
	{
		String localParentPath = doc.getLocalRootPath() + doc.getPath();
		File dir = new File(localParentPath, doc.getName());
		File[] tmp = dir.listFiles();
		
		//there is not subNodes under dir
		if(tmp == null || tmp.length == 0)
		{
	    	CommitAction action = new CommitAction();
	    	action.setAction(1);
	    	action.setDoc(doc);
	    	action.isSubAction = isSubAction;
	    	action.setSubActionList(null);
	    	actionList.add(action);
	    	return;
		}
		
		//Build subActionList
    	String subParentPath = doc.getPath() + doc.getName() + "/";
    	if(doc.getName().isEmpty())
    	{
    		subParentPath = doc.getPath();
    	}
    	int subDocLevel = doc.getLevel() + 1;
    	
		List<CommitAction> subActionList = new ArrayList<CommitAction>();
	    for(int i=0;i<tmp.length;i++)
	    {
	    	File localEntry = tmp[i];
	    	int subDocType = localEntry.isFile()? 1: 2;
	    	Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), subParentPath, localEntry.getName(), subDocLevel, subDocType, doc.getIsRealDoc(), doc.getLocalRootPath());
	    	if(localEntry.isDirectory())
	    	{	
	    		insertAddDirAction(subActionList,subDoc,true);
	    	}
	    	else
	    	{
	    		insertAddFileAction(subActionList,subDoc,true);
	    	}
	 	}
		
    	CommitAction action = new CommitAction();
    	action.setAction(1);
    	action.setDoc(doc);
    	action.isSubAction = isSubAction;
    	action.setSubActionList(subActionList);
    	actionList.add(action);    	
	}
	
	protected void insertDeleteAction(List<CommitAction> actionList, Doc doc) {
    	CommitAction action = new CommitAction();
    	action.setAction(2);
    	action.setDoc(doc);
    	actionList.add(action);
	}
    
	protected void insertModifyFile(List<CommitAction> actionList, Doc doc) {
    	CommitAction action = new CommitAction();
    	action.setAction(3);
    	action.setDoc(doc);
    	actionList.add(action);	
	}
	
	/******************************* 路径相关接口  
	 * @param isRealDoc 
	 * @param localRootPath *******************************/
	protected Doc buildBasicDoc(Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, boolean isRealDoc, String localRootPath) 
	{
		//Format path and name
		if(path == null)
		{
			path = "";
		}
		if(name == null)
		{
			name = "";
		}
		
		Doc doc = new Doc();
		
		//Build vDoc
		if(isRealDoc == false)
		{
			doc.setVid(reposId);
			doc.setPath(path);
			doc.setName(name);
			doc.setLevel(level);
			doc.setType(type);
			doc.setIsRealDoc(false);
			return doc;
		}
		
		//To support user call the interface by entryPath
		if(name.isEmpty())
		{
			if(!path.isEmpty())
			{
				String[] temp = new String[2]; 
				seperatePathAndName(path, temp);
				path = temp[0];
				name = temp[1];			
			}
		}
		
		if(name.isEmpty())	//rootDoc
		{
			level = -1;
			docId = 0L;
			pid = -1L;
		}
		
		if(level == null)
		{
			level = getLevelByParentPath(path);
		}
		
		if(docId == null)
		{
			docId = buildDocIdByName(level, path, name);
		}
		
		if(pid == null)
		{
			pid = buildDocIdByName(level-1, path, "");
		}

		doc.setVid(reposId);
		doc.setDocId(docId);
		doc.setPid(pid);
		doc.setPath(path);
		doc.setName(name);
		doc.setLevel(level);
		doc.setType(type);
		doc.setIsRealDoc(true);
		doc.setLocalRootPath(localRootPath);
		//printObject("buildBasicDoc() doc:", doc);
		return doc;
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

	protected void seperatePathAndName(String entryPath, String [] result) {
		String [] paths = entryPath.split("/");
		
		int deepth = paths.length;
		System.out.println("seperatePathAndName() deepth:" + deepth); 
		
		String  path = "";
		String name = "";
		
		//Get Name and pathEndPos
		int pathEndPos = 0;
		for(int i=deepth-1; i>=0; i--)
		{
			name = paths[i];
			if(name.isEmpty())
			{
				continue;
			}
			pathEndPos = i;
			break;
		}
		
		//Get Path
		for(int i=0; i<pathEndPos; i++)
		{
			String tempName = paths[i];
			if(tempName.isEmpty())
			{
				continue;
			}	
			
			path = path + tempName + "/";
		}
		
		result[0] = path;
		result[1] = name;
	}
	
	//获取默认的仓库根路径
	protected String getDefaultReposRootPath() {
		String path = null;
		
		path = ReadProperties.read("docSysConfig.properties", "defaultReposRootPath");
	    if(path == null || "".equals(path))
	    {
			if(isWinOS())
			{  
				path = "C:/DocSysReposes/";
			}
			else
			{
				path = "/DocSysReposes/";
			}
	    }
	    else
	    {
	    	path = localDirPathFormat(path);
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

	//格式化本地路径
	protected String localDirPathFormat(String path) {
		if(path.isEmpty())
		{
			return path;
		}

		path = path.replace('\\','/');
		
		String [] paths = path.split("/");
		
		char startChar = path.charAt(0);
		if(startChar == '/')	
		{
			if(isWinOS())
			{
				path = "C:/" + buildPath(paths);
			}
			else
			{
				path = "/" + buildPath(paths);
			}
		}
		else
		{
			if(isWinOS())
			{
				if(isWinDiskStr(paths[0]))
				{
					paths[0] = paths[0].toUpperCase();
					path = buildPath(paths);					
				}
				else
				{
					path = "C:/" + buildPath(paths);
				}
			}
			else
			{
				path = "/" + buildPath(paths);
			}
		}	

		return path;
	}
	
	private String buildPath(String[] paths) {
		String path = "";
		for(int i=0; i<paths.length; i++)
		{
			String subPath = paths[i];
			if(!subPath.isEmpty())
			{
				path = path + subPath + "/";
			}
		}
		return path;
	}
	
	//系统日志所在的目录
	protected String getSystemLogParentPath() {
		String path = "";		
		path = ReadProperties.read("docSysConfig.properties", "SystemLogParentPath");
	    if(path == null || "".equals(path))
	    {
			if(isWinOS()){  
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
	
	protected static String getReposPath(Repos repos) {
		String path = repos.getPath();
		return path + repos.getId() + "/";
	}
	
	//获取仓库的实文件的本地存储根路径
	protected static String getReposRealPath(Repos repos)
	{
		String reposRPath =  repos.getRealDocPath();
		if(reposRPath == null || reposRPath.isEmpty())
		{
			reposRPath = getReposPath(repos) + "data/rdata/";	//实文件系统的存储数据放在data目录下 
		}
		//System.out.println("getReposRealPath() " + reposRPath);
		return reposRPath;
	}
	
	//获取仓库的虚拟文件的本地存储根路径
	protected static String getReposVirtualPath(Repos repos)
	{
		String reposVPath = getReposPath(repos) + "data/vdata/";	//实文件系统的存储数据放在data目录下 
		//System.out.println("getReposVirtualPath() " + reposVPath);
		return reposVPath;
	}
	
	protected String getVDocName(Doc doc) 
	{
		//return doc.getVid() + "_" + doc.getDocId() + "_" + doc.getName();
		return doc.getDocId() + "";
	}
	
	protected static String getHashId(String path) 
	{
		String hashId = MD5.md5(path);
		System.out.println("getHashId() " + hashId + " for " + path);
		return hashId;
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
        
        String webUserTmpPath =  wac.getServletContext().getRealPath("/") +  "tmp/" + login_user.getId() + "/";
        webUserTmpPath = localDirPathFormat(webUserTmpPath);
        System.out.println("getWebUserTmpPath() webUserTmpPath:" + webUserTmpPath);
		return webUserTmpPath;
	}
	
	//WebTmpPath was 
	protected String getWebTmpPath() {
        WebApplicationContext wac = ContextLoader.getCurrentWebApplicationContext();
        
        String webTmpPath =  wac.getServletContext().getRealPath("/") +  "tmp/";
        webTmpPath = localDirPathFormat(webTmpPath);
        System.out.println("getWebTmpPath() webTmpPath:" + webTmpPath);
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
	
	//Build DocId by DocName
	protected Long buildDocIdByName(Integer level, String parentPath, String docName) 
	{
		String docPath = parentPath + docName;
		Long docId = level*100000000000L + docPath.hashCode() + 102147483647L;	//为了避免文件重复使用level*100000000 + docName的hashCode
		return docId;
	}
	
	protected Long buildPidByPath(int level, String path) 
	{
		if(path == null || path.isEmpty())
		{
			return 0L;
		}
		
		char lastChar = path.charAt(path.length()-1);
		if(lastChar == '/')
		{
			path = path.substring(0,path.length()-1);
		}
		
		Long pid = buildDocIdByName(level-1, path, "");
		return pid;
	}
	
	protected String getDocPath(Doc doc) 
	{
		String path = doc.getPath();
		if(path == null)
		{
			return doc.getName();
		}

		return path + doc.getName();
	}
	/***********************  全文搜索接口 
	 * @param weight *******************************************/
	protected static void AddHitDocToSearchResult(HashMap<String, HitDoc> searchResult, HitDoc hitDoc, String keyWord, int weight) 
	{
		System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " searchWord:" + keyWord);
		HitDoc tempHitDoc = searchResult.get(hitDoc.getDocPath());

		if(tempHitDoc == null)
		{
			System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " is the first hit result for searchWord:" + keyWord);	
			Doc doc = hitDoc.getDoc();
			
			//Create hitIfo
			HashMap<String, Integer> hitInfo = new HashMap<String, Integer>();
			hitInfo.put(keyWord,1);
			
			int sortIndex = weight*100 + 1;
			doc.setSortIndex(sortIndex);
			
			//Set HitDoc
			hitDoc.setDoc(doc);
			hitDoc.setHitInfo(hitInfo);
			searchResult.put(hitDoc.getDocPath(), hitDoc);
		}
		else
		{			
			HashMap<String, Integer> hitInfo = tempHitDoc.getHitInfo();
			Doc doc = tempHitDoc.getDoc();

			
			//Caculate sortIndex
			Integer hitCount = hitInfo.get(keyWord);
			int sortIndex = doc.getSortIndex();
			if(hitCount == null)
			{
				System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " is the first hit result for searchWord:" + keyWord);	
				hitInfo.put(keyWord, 1);
				sortIndex = sortIndex + weight*100 + 1;
				doc.setSortIndex(sortIndex);
			}
			else
			{
				hitCount++;	//hitCount++
				System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " is "+ hitCount +"th hit result for searchWord:" + keyWord);	
				hitInfo.put(keyWord, hitCount+1);
				sortIndex = sortIndex + 1;
				doc.setSortIndex(sortIndex);
			}
			System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " sortIndex:" + doc.getSortIndex());	

			//Java默认是引用，所以下面的操作是不需要的
			//tempHitDoc.setHitInfo(hitInfo);
			//tempHitDoc.setDoc(doc);
			//searchResult.put(hitDoc.getDocPath(), tempHitDoc);	//Update searchResult
		}
	}
	
	/***************************** json相关接口 ***************************/
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
	
	
	/***************************图片上传相关接口*****************************/
	protected static String[] IMGALLOWDTYPES = {"JPG","JPEG","PNG","GIF","BMP"};
	
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
	
	/************************ session相关接口 **************************************/
	protected Map session;
	
	public Map getSession() {
		return session;
	}

	public void setSession(Map session) {
		this.session = session;
	}
	
	/****************************** 文件操作相关接口 ***********************************/
	/**
	 * 获取文件编码格式
	 * @param filePath
	 * @return UTF-8/Unicode/UTF-16BE/GBK
	 * @throws Exception
	 */
	public static String getFileEncode(String filePath) throws Exception {
        String charsetName = null;
        try {
            File file = new File(filePath);
            CodepageDetectorProxy detector = CodepageDetectorProxy.getInstance();
            detector.add(new ParsingDetector(false));
            detector.add(JChardetFacade.getInstance());
            detector.add(ASCIIDetector.getInstance());
            detector.add(UnicodeDetector.getInstance());
            java.nio.charset.Charset charset = null;
            charset = detector.detectCodepage(file.toURI().toURL());
            if (charset != null) {
                charsetName = charset.name();
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            return null;
        }
        return charsetName;
	}
	
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
    
	public boolean isEmptyDir(String dirPath) 
	{
		File dir = new File(dirPath);
    	if(false == dir.exists())
    	{
    		return true;
    	}
    	
    	if(dir.isFile())
    	{
    		return true;
    	}

    	File[] fileList = dir.listFiles();
    	
    	if(fileList.length > 0)
    	{
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
    public static boolean delFileOrDir(String path){
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
		
		srcFile.transferTo(dstFile);
		return fileName;
	}
	
    public static String getFileSuffix(String filePath)
    {
    	String suffix = filePath.substring(filePath.lastIndexOf(".") + 1);
    	System.out.println("getFileSuffix() " + suffix);
    	return suffix.toLowerCase();
    }
    
	public static boolean isOfficeFile(String fileSuffix) 
	{
		switch(fileSuffix)
		{
		case "doc":
		case "docx":
		case "xls":
		case "xlsx":
		case "ppt":
		case "pptx":
			return true;
		}
		return false;
	}
	
	/****************** 线程锁接口 *********************************************/
	protected static final Object syncLock = new Object(); 
	//释放线程锁
	protected void unlock() {
		unlockSyncLock(syncLock);
	}
	
	protected void unlockSyncLock(Object syncLock) {
		syncLock.notifyAll();//唤醒等待线程
		//下面这段代码是因为参考了网上的一个Demo说wait是释放锁，我勒了个区去，留着作纪念
		//try {
		//	syncLock.wait();	//线程睡眠，等待syncLock.notify/notifyAll唤醒
		//} catch (InterruptedException e) {
		//	e.printStackTrace();
		//}
	}  
	
	/**************************** 其他通用接口 ******************************/
	//To print the obj by convert it to json format
	protected static void printObject(String Head,Object obj)
	{
		String json = JSON.toJSONStringWithDateFormat(obj, "yyy-MM-dd HH:mm:ss");
		System.out.println(Head + json);		
	}

	protected static boolean isWinOS() {
		String os = System.getProperty("os.name"); 
		System.out.println("OS:"+ os);  
		if(os.toLowerCase().startsWith("win")){
			return true;
		}
		return false;
	}

	protected boolean isWinDiskStr(String Str) 
	{
		if(Str.length() != 2)
		{
			return false;
		}
		
		char endChar = Str.charAt(1);
		if(endChar != ':')
		{
			return false;
		}
		
		char diskChar = Str.charAt(0);
		if((diskChar >= 'C' && diskChar <= 'Z') ||(diskChar >= 'c' && diskChar <= 'z') ) 
		{
			return true;
		}
		return false;
	}
	
}
