package com.DocSystem.common;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.RandomAccessFile;
import java.io.UnsupportedEncodingException;
import java.lang.reflect.Method;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import javax.servlet.ServletContextEvent;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.io.FileUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hslf.extractor.PowerPointExtractor;
import org.apache.poi.hssf.extractor.ExcelExtractor;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.usermodel.Paragraph;
import org.apache.poi.hwpf.usermodel.Range;
import org.apache.poi.poifs.filesystem.POIFSFileSystem;
import org.apache.poi.xslf.extractor.XSLFPowerPointExtractor;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xssf.extractor.XSSFExcelExtractor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
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
import util.FileUtil.FileUtils2;

import com.DocSystem.common.CommitAction.CommitType;
import com.DocSystem.commonService.ProxyThread;
import com.DocSystem.commonService.ShareThread;
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

	/******************************** 获取服务器、访问者IP地址 *************************************/
	protected static String getIpAddress() {
		String IP = null;
		try {
			InetAddress ip4 = Inet4Address.getLocalHost();
			IP = ip4.getHostAddress();
			System.out.println(ip4.getHostAddress());
		} catch (Exception e) {
			e.printStackTrace();
		}	
		return IP;
	}
	
	protected String getIpAddress(HttpServletRequest request) {
		String ip = request.getHeader("x-forwarded-for");
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
		ip = request.getHeader("Proxy-Client-IP");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
		ip = request.getHeader("WL-Proxy-Client-IP");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
		ip = request.getHeader("HTTP_CLIENT_IP");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
		ip = request.getHeader("HTTP_X_FORWARDED_FOR");
		}
		if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
		ip = request.getRemoteAddr();
		}
		return ip;
	}

	/******************************** Basic Interface for docSys *************************************/
	protected void docSysDebugLog(String logStr, ReturnAjax rt) {
		System.out.println(logStr);
		if(rt != null)
		{
			rt.setDebugLog(logStr);
		}
	}

	protected void docSysWarningLog(String logStr, ReturnAjax rt) {
		System.err.println(logStr);
		if(rt != null)
		{
			rt.setWarningMsg(logStr);
		}
	}

	protected void docSysErrorLog(String logStr, ReturnAjax rt) {
		System.err.println(logStr);
		if(rt != null)
		{
			rt.setError(logStr);
		}
	}
	
	/******************************** Basic Interface for CommonAction *************************************/
	//CommonAction 主要用于异步行为
    //ActionId 1:FS 2:VerRepos 3:DB 4:Index  5:AutoSyncUp
	//ActionType 1:add 2:delete 3:update 4:move 5:copy
    //DocType 0:DocName 1:RealDoc 2:VirtualDoc   AutoSyncUp(1: localDocChanged  2: remoteDocChanged)
	protected void insertCommonAction(List<CommonAction> actionList, Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg,String commitUser, CommonAction.ActionType actionId, CommonAction.Action actionType, CommonAction.DocType docType, List<CommonAction> subActionList, User user) 
	{	
		CommonAction action = new CommonAction();
		action.setType(actionId);		
		action.setAction(actionType);
		action.setDocType(docType);

		//System.out.println("insertCommonAction actionType:" + action.getAction() + " docType:" + action.getDocType() + " actionId:" + action.getType() + " doc:"+ srcDoc.getDocId() + " " + srcDoc.getPath() + srcDoc.getName());
		
		action.setRepos(repos);
		action.setDoc(srcDoc);
		action.setNewDoc(dstDoc);
		
		action.setUser(user);
		action.setCommitMsg(commitMsg);
		action.setCommitUser(commitUser);
		
		action.setSubActionList(subActionList);
		
		actionList.add(action);
	}
	
	//分享代理服务线程（一个服务器只允许启动一个）
	protected static ProxyThread proxyThread = null;
	//远程分享服务线程（一个服务器只允许启动一个）
	protected static ShareThread shareThread = null;
	
	
	protected static ConcurrentHashMap<Integer, UniqueAction> uniqueActionHashMap = new ConcurrentHashMap<Integer, UniqueAction>();
	protected boolean insertUniqueCommonAction(CommonAction action)
	{
		Doc srcDoc = action.getDoc();
		if(srcDoc == null)
		{
			return false;
		}
		
		Integer reposId = srcDoc.getVid();
		UniqueAction uniqueAction = uniqueActionHashMap.get(reposId);
		if(uniqueAction == null)
		{
			//System.out.println("insertUniqueCommonAction create uniqueAction for repos:" + reposId);
			UniqueAction newUniqueAction = new UniqueAction();
			uniqueActionHashMap.put(reposId, newUniqueAction);
			uniqueAction = newUniqueAction;
		}
		
		ConcurrentHashMap<Long, CommonAction> uniqueCommonActionHashMap = uniqueAction.getUniqueCommonActionHashMap();
		List<CommonAction> uniqueCommonActionList = uniqueAction.getUniqueCommonActionList();		

		//System.out.println("insertUniqueCommonAction actionType:" + action.getAction() + " docType:" + action.getDocType() + " actionId:" + action.getType() + " doc:"+ srcDoc.getDocId() + " " + srcDoc.getPath() + srcDoc.getName());
		CommonAction tempAction = uniqueCommonActionHashMap.get(srcDoc.getDocId());
		if(tempAction != null && tempAction.getType() == action.getType() && tempAction.getAction() == action.getAction() && tempAction.getDocType() == action.getDocType())
		{
			//System.out.println("insertUniqueCommonAction action for doc:"+ srcDoc.getDocId() + " [" + srcDoc.getPath() + srcDoc.getName() + "] alreay in uniqueActionList");
			return false;
		}
		
		uniqueCommonActionHashMap.put(srcDoc.getDocId(), action);
		uniqueCommonActionList.add(action);
		System.out.println("insertUniqueCommonAction actionType:" + action.getAction() + " docType:" + action.getDocType() + " actionId:" + action.getType() + " doc:"+ srcDoc.getDocId() + " " + srcDoc.getPath() + srcDoc.getName());
		return true;
	}
	
	/******************************** Basic Interface for CommitAction *************************************/
	//版本仓库底层通用接口
	protected void insertAddFileAction(List<CommitAction> actionList, Doc doc, boolean isSubAction, boolean isGit) {
		if(isGit && doc.getName().equals(".git"))
		{
			return;
		}
		//printObject("insertAddFileAction:", doc);
		
    	CommitAction action = new CommitAction();
    	action.setAction(CommitType.ADD);
    	action.setDoc(doc);
    	action.isSubAction = isSubAction;
    	actionList.add(action);
	}
    
	protected void insertAddDirAction(List<CommitAction> actionList,Doc doc, boolean isSubAction, boolean isGit) 
	{
		if(isGit && doc.getName().equals(".git"))
		{
			return;
		}
		//printObject("insertAddDirAction:", doc);
		System.out.println("insertAddDirAction() " + doc.getPath() + doc.getName());

		String localParentPath = doc.getLocalRootPath() + doc.getPath();
		File dir = new File(localParentPath, doc.getName());
		File[] tmp = dir.listFiles();
		
		//there is not subNodes under dir
		if(tmp == null || tmp.length == 0)
		{
	    	CommitAction action = new CommitAction();
	    	action.setAction(CommitType.ADD);
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
	    	Doc subDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(), subParentPath, localEntry.getName(), subDocLevel, subDocType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), localEntry.length(), "");
	    	if(localEntry.isDirectory())
	    	{	
	    		insertAddDirAction(subActionList,subDoc,true, isGit);
	    	}
	    	else
	    	{
	    		insertAddFileAction(subActionList,subDoc,true, isGit);
	    	}
	 	}
		
    	CommitAction action = new CommitAction();
    	action.setAction(CommitType.ADD);
    	action.setDoc(doc);
    	action.isSubAction = isSubAction;
    	action.setSubActionList(subActionList);
    	actionList.add(action);    	
	}
	
	protected void insertDeleteAction(List<CommitAction> actionList, Doc doc, boolean isGit) {
		if(isGit && doc.getName().equals(".git"))
		{
			return;
		}

		//printObject("insertDeleteAction:", doc);
		
		System.out.println("insertDeleteAction() " + doc.getPath() + doc.getName());

    	CommitAction action = new CommitAction();
    	action.setAction(CommitType.DELETE);
    	action.setDoc(doc);
    	actionList.add(action);
	}
    
	protected void insertModifyAction(List<CommitAction> actionList, Doc doc, boolean isGit) {
		if(isGit && doc.getName().equals(".git"))
		{
			return;
		}

		//printObject("insertModifyAction:", doc);
		System.out.println("insertModifyAction() " + doc.getPath() + doc.getName());

		CommitAction action = new CommitAction();
    	action.setAction(CommitType.MODIFY);
    	action.setDoc(doc);
    	actionList.add(action);	
	}
	
	protected void insertAction(List<CommitAction> actionList, Doc doc, CommitType actionType, boolean isGit) {
		if(isGit && doc.getName().equals(".git"))
		{
			return;
		}

		//printObject("insertAction:", doc);
		System.out.println("insertAction() actionType:" + actionType + " doc:" + doc.getPath() + doc.getName());

		CommitAction action = new CommitAction();
    	action.setAction(actionType);
    	action.setDoc(doc);
    	actionList.add(action);	
	}	
	/******************************* 路径相关接口  
	 * @param isRealDoc 
	 * @param localRootPath *******************************/
	protected Doc buildBasicDoc(Integer reposId, Long docId, Long pid, String path, String name, Integer level, Integer type, boolean isRealDoc, String localRootPath, String localVRootPath, Long size, String checkSum) 
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
		
		//To support user call the interface by entryPath
		if(name.isEmpty())
		{
			if(!path.isEmpty())
			{
				String[] temp = new String[2]; 
				level = seperatePathAndName(path, temp);
				path = temp[0];
				name = temp[1];			
			}
		}
		
		//在仓库管理界面，为了能够返回然根节点信息带有仓库名字，导致传入的Name不为空，这是一个错误的决定
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
		
		Doc doc = new Doc();
		doc.setVid(reposId);
		doc.setPath(path);
		doc.setName(name);
		doc.setLevel(level);
		doc.setType(type);
		doc.setLocalRootPath(localRootPath);
		doc.setLocalVRootPath(localVRootPath);
		doc.setSize(size);
		doc.setCheckSum(checkSum);
		
		doc.setIsRealDoc(isRealDoc);
		
		if(isRealDoc)
		{
			if(docId == null)
			{
				docId = buildDocIdByName(level, path, name);
			}
			
			if(pid == null)
			{
				if(path.isEmpty())
				{
					pid = 0L;
				}
				else
				{
					pid = buildDocIdByName(level-1, path, "");
				}
			}
		}

		doc.setDocId(docId);
		doc.setPid(pid);
		return doc;
	}
	
	protected Doc buildRootDoc(Repos repos, String localRootPath, String localVRootPath) 
	{
		//String localRootPath = getReposRealPath(repos);
		//String localVRootPath = getReposVirtualPath(repos);
		return buildBasicDoc(repos.getId(), 0L, -1L, "", "", 0, 2, true, localRootPath, localVRootPath, null, null);
	}
	
	//VirtualDoc 的vid docId pid level都是和RealDoc一样的
	protected Doc buildVDoc(Doc doc) 
	{
		if(doc.getIsRealDoc())
		{
			Doc vDoc = buildBasicDoc(doc.getVid(), doc.getDocId(), doc.getPid(), "", getVDocName(doc), 0, 2, false, doc.getLocalVRootPath(), doc.getLocalVRootPath(), null, null); 
			vDoc.setContent(doc.getContent());
			return vDoc;
		}
		
		System.out.println("buildVDoc() doc already is VDoc");
		return doc;
	}
	
	//path必须是标准格式
	protected static int getLevelByParentPath(String path) 
	{
		if(path == null || path.isEmpty())
		{
			return 0;
		}
		
		String [] paths = path.split("/");
		return paths.length;
	}

	protected int seperatePathAndName(String entryPath, String [] result) {
		if(entryPath.isEmpty())
		{
			//It it rootDoc
			return -1;
		}
		
		String [] paths = entryPath.split("/");
		
		int deepth = paths.length;
		//System.out.println("seperatePathAndName() deepth:" + deepth); 
		
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

		int level = paths.length -1;
		return level;
	}
	
	//获取默认的仓库根路径
	protected String getDefaultReposRootPath() {
		String path = ReadProperties.read("docSysConfig.properties", "defaultReposStorePath");
		if(isWinOS())
		{
			if(path == null || path.isEmpty())
			{
				path = "C:/DocSysReposes/";
			}
			else
			{
				path = localDirPathFormat(path);
			}
	    }	
		else
		{
			if(path == null || path.isEmpty())
			{
				path = "/DocSysReposes/";
			}
			else
			{
				path = localDirPathFormat(path);
			}
		}	    
		return path;
	}
	
	
	//获取JavaHome
    public String getJavaHome() {
    	String path = null;
        path = ReadProperties.read("docSysConfig.properties", "javaHome");
        if(path != null && !path.isEmpty())
        {
        	return localDirPathFormat(path);
        }
        return null;
    }
	
	//获取Tomcat的安装路径
    public String getTomcatPath() {
    	//get Tomcat Path From Config File
    	String path = null;
        path = ReadProperties.read("docSysConfig.properties", "tomcatPath");
        if(path != null && !path.isEmpty())
        {
        	return localDirPathFormat(path);
        }

        String osName = System.getProperty("os.name");
        if (Pattern.matches("Linux.*", osName)) 
        {
        	path = "/var/lib/tomcat7/";
            return path;
        } 
        
        if (Pattern.matches("Windows.*", osName)) 
        {
        	path = "C:/xampp/tomcat/";
            return path;
        } 
        
        if (Pattern.matches("Mac.*", osName)) 
        {
        	path = "/Library/tomcat/";
            return path;
        }
        
        return null;
    }
	
	//获取OpenOffice的安装路径
    public String getOpenOfficePath() {
    	//get OpenOffice Home From Config File
    	String path = null;
    	path = ReadProperties.read("docSysConfig.properties", "openOfficePath");
        if(path != null && !path.isEmpty())
        {
        	return localDirPathFormat(path);
        }

        String osName = System.getProperty("os.name");
        //System.out.println("操作系统名称:" + osName);
        
        if (Pattern.matches("Linux.*", osName)) 
        {
        	path = "/opt/openoffice.org4/";
            return path;
        } 
        
        if (Pattern.matches("Windows.*", osName)) 
        {
        	path = "C:/Program Files (x86)/OpenOffice 4/";
            return path;
        } 
        
        if (Pattern.matches("Mac.*", osName)) 
        {
        	path = "/Applications/OpenOffice.org.app/Contents/";
            return path;
        }
        
        return null;
    }
    
	//获取OfficeEditorApi的配置
	protected static String getOfficeEditorApi() {
		String officeEditorApi = ReadProperties.read("docSysConfig.properties", "officeEditorApi");
		if(officeEditorApi != null && !officeEditorApi.isEmpty())
		{
			return officeEditorApi.replace("\\", "/");
		}
		return officeEditorApi;
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
	protected static String localDirPathFormat(String path) {
		if(path == null || path.isEmpty())
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
	
	private static String buildPath(String[] paths) {
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
	
	//获取仓库的密码文件的存储路径
	protected static String getReposPwdPath(Repos repos)
	{
		String reposPwdPath = getReposPath(repos) + "data/pwd/";	//实文件系统的存储数据放在data目录下 
		//System.out.println("getReposPwdPath() " + reposPwdPath);
		return reposPwdPath;
	}
	
	protected String getVDocName(Doc doc) 
	{
		return doc.getDocId() + "_" + doc.getName();
	}
	
	protected static String getHashId(String path) 
	{
		String hashId = MD5.md5(path);
		System.out.println("getHashId() " + hashId + " for " + path);
		return hashId;
	}
	
	//仓库文件缓存根目录
	protected String getReposTmpPath(Repos repos) {
		String tmpDir = repos.getPath() + repos.getId() +  "/tmp/";
		return tmpDir;
	}
	
	//历史文件缓存目录，需要区分RDoc和VDoc
	protected String getReposTmpPathForHistory(Repos repos, String commitId, boolean isRealDoc) {
		if(isRealDoc)
		{	
			String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/History/rdata/" + commitId + "/";
			createDir(userTmpDir);
			return userTmpDir;
		}
		
		//is VDoc
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/History/vdata/" + commitId + "/";
		createDir(userTmpDir);
		return userTmpDir;
	}
	
	//压缩文件解压缓存目录
	protected String getReposTmpPathForUnzip(Repos repos, User login_user) {
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/Unzip/";
		createDir(userTmpDir);
		return userTmpDir;
	}
	
	//用户的仓库临时目录
	protected String getReposTmpPathForUser(Repos repos, User login_user) {
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/User/" + login_user.getId() + "/";
		createDir(userTmpDir);
		return userTmpDir;
	}

	protected String getReposTmpPathForOfficeText(Repos repos, Doc doc) {
		String docLocalPath = doc.getLocalRootPath() + doc.getPath() + doc.getName();
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/OfficeText/" + docLocalPath.hashCode() + "_" + doc.getName() + "/";
		createDir(userTmpDir);
		return userTmpDir;
	}
	
	protected String getOfficeTextFileName(Doc doc) {
		File file = new File(doc.getLocalRootPath() + doc.getPath() + doc.getName());
		return "officeText_" + file.length() + "_" + file.lastModified() + ".txt";
	}
	
	protected String getReposTmpPathForDoc(Repos repos, Doc doc) {
		String tmpDir = repos.getPath() + repos.getId() +  "/tmp/doc/" +  doc.getDocId() + "_" + doc.getName() + "/";
		createDir(tmpDir);
		return tmpDir;
	}
	
	protected String getReposTmpPathForPreview(Repos repos, Doc doc) {
		String docLocalPath = doc.getLocalRootPath() + doc.getPath() + doc.getName();
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/preview/" +  docLocalPath.hashCode() + "_" + doc.getName() + "/";
		createDir(userTmpDir);
		return userTmpDir;
	}
	
	protected String getPreviewFileName(Doc doc) {
		File file = new File(doc.getLocalRootPath() + doc.getPath() + doc.getName());
		return "preview_" + file.length() + "_" + file.lastModified() + ".pdf";
	}
	
	protected String getReposTmpPathForTextEdit(Repos repos, User login_user, boolean isRealDoc) {
		if(isRealDoc)
		{
			String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/TextEdit/" + login_user.getId() + "/RDOC/";
			createDir(userTmpDir);
		}
		
		//VDoc
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/TextEdit/" + login_user.getId() + "/VDOC/";
		createDir(userTmpDir);
		return userTmpDir;
	}
	
	protected String getReposTmpPathForDownload(Repos repos, User login_user) {
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/download/" + login_user.getId() + "/";
		createDir(userTmpDir);
		return userTmpDir;
	}
	
	protected String getReposTmpPathForUpload(Repos repos, User login_user) {
		String userTmpDir = repos.getPath() + repos.getId() +  "/tmp/upload/" + login_user.getId() + "/";
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

	//WebPath was 
	protected String getWebAppPath() {
		String webPath = getWebPath();
        webPath = localDirPathFormat(webPath);
        String webParentPath = webPath + "../";
        System.out.println("getWebAppPath() webParentPath:" + webParentPath);
		return webPath;
	}
	
	//WebPath was 
	protected static String getWebPath() {
        WebApplicationContext wac = ContextLoader.getCurrentWebApplicationContext();
        
        String webPath =  wac.getServletContext().getRealPath("/");
        webPath = localDirPathFormat(webPath);
        System.out.println("getWebPath() webPath:" + webPath);
		return webPath;
	}
	
	//WebTmpPath was 
	protected String getWebUploadPath() {
		WebApplicationContext wac = ContextLoader.getCurrentWebApplicationContext();
	        
	    String webTmpPath =  wac.getServletContext().getRealPath("/") +  "uploads/";
	    webTmpPath = localDirPathFormat(webTmpPath);
	    System.out.println("getWebUploadPath() webTmpPath:" + webTmpPath);
		return webTmpPath;
	}
	
	//WebTmpPath was 
	protected String getWebTmpPath() {
        WebApplicationContext wac = ContextLoader.getCurrentWebApplicationContext();
        
        String webTmpPath =  wac.getServletContext().getRealPath("/") +  "tmp/";
        webTmpPath = localDirPathFormat(webTmpPath);
        System.out.println("getWebTmpPath() webTmpPath:" + webTmpPath);
		return webTmpPath;
	}
	
	protected String getWebTmpPathForPreview() {
        WebApplicationContext wac = ContextLoader.getCurrentWebApplicationContext();
        
        String webTmpPath =  wac.getServletContext().getRealPath("/") +  "tmp/preview/";
        webTmpPath = localDirPathFormat(webTmpPath);
        System.out.println("getWebTmpPathForPreview() webTmpPath:" + webTmpPath);
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
				if(repos.getIsRemote() == 1)
				{
					reposName = id + "_GIT_RRepos_Remote";					
				}
				else
				{

					reposName = id + "_GIT_RRepos";
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
				if(repos.getIsRemote1() == 1)
				{

					reposName = id + "_GIT_VRepos_Remote";					
				}
				else
				{
					reposName = id + "_GIT_VRepos";
				}
			}
		}
		return reposName;
	}
	
	//Build DocId by DocName
	protected static Long buildDocIdByName(Integer level, String parentPath, String docName) 
	{
		String docPath = parentPath + docName;
		if(docName.isEmpty())
		{
			if(parentPath.isEmpty())
			{
				return 0L;
			}
			
			docPath = parentPath.substring(0, parentPath.length()-1);	//remove the last char '/'
		}
		
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
	protected static void AddHitDocToSearchResult(HashMap<String, HitDoc> searchResult, HitDoc hitDoc, String keyWord, int weight, int hitType) 
	{
		//System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " searchWord:" + keyWord);
		HitDoc tempHitDoc = searchResult.get(hitDoc.getDocPath());

		if(tempHitDoc == null)
		{
			//System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " is the first hit result for searchWord:" + keyWord);	
			Doc doc = hitDoc.getDoc();
			
			//Create hitIfo
			HashMap<String, Integer> hitInfo = new HashMap<String, Integer>();
			hitInfo.put(keyWord,1);
			
			int sortIndex = weight*100 + 1;
			doc.setSortIndex(sortIndex);
			
			//Set HitDoc
			hitDoc.setDoc(doc);
			hitDoc.setHitInfo(hitInfo);
			hitDoc.settHitType(hitType); //设置hitType
			searchResult.put(hitDoc.getDocPath(), hitDoc);
			tempHitDoc = hitDoc;
		}
		else
		{	
			tempHitDoc.settHitType(tempHitDoc.getHitType() | hitType);	//增加hitType
			
			HashMap<String, Integer> hitInfo = tempHitDoc.getHitInfo();
			Doc doc = tempHitDoc.getDoc();
			
			//Caculate sortIndex
			Integer hitCount = hitInfo.get(keyWord);
			int sortIndex = doc.getSortIndex();
			if(hitCount == null)
			{
				//System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " is the first hit result for searchWord:" + keyWord);	
				hitInfo.put(keyWord, 1);
				sortIndex += weight*100 + 1;
				doc.setSortIndex(sortIndex);
			}
			else
			{
				hitCount++;	//hitCount++
				//System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " is "+ hitCount +"th hit result for searchWord:" + keyWord);	
				hitInfo.put(keyWord, hitCount+1);
				sortIndex += weight*100 + 1;
				doc.setSortIndex(sortIndex);
			}
			//System.out.println("AddHitDocToSearchResult() docPath:" + hitDoc.getDocPath() + " sortIndex:" + doc.getSortIndex());	
		}
		
		//System.out.println("AddHitDocToSearchResult() hitType:" + tempHitDoc.getHitType());	
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
	 * 向页面返回Text信息
	 * @param obj
	 * @param response
	 */
	
	protected void writeText(String text,HttpServletResponse response) {
		
		try {
			response.setCharacterEncoding("UTF-8");
			PrintWriter pw = response.getWriter();
			response.setContentType("application/javascript");
			pw.write(text);
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
	
	/***************************文件排序接口*****************************/
	protected List<Doc> sortDocList(List<Doc> docList, String sort) 
	{
		Collections.sort(docList,
				new Comparator<Doc>() {
					HashMap<Integer,String> sortMap = buildSortMap(sort);
			
					public int compare(Doc u1, Doc u2) {
						long diff = getSortDiff(u1, u2, sortMap);	//
						if (diff > 0) 
						{
							return 1;
						}
						else if (diff < 0) 
						{
							return -1;
						}
						return 0;
					}

					private long getSortDiff(Doc u1, Doc u2, HashMap<Integer, String> sortMap) {
						long diff = 0;
						for(int i=0; i< sortMap.size(); i++)
						{
							String sortType = sortMap.get(i);
							System.out.println("sortType:" + sortType);
							if(sortType != null)
							{
								diff = getSortDiffBySortType(u1, u2, sortType);
								if(diff != 0)
								{
									return diff;
								}
							}
						}
						return diff;
					}

					private long getSortDiffBySortType(Doc u1, Doc u2, String sortType) {
						switch(sortType)
						{
						case "type":
							return u1.getType() - u2.getType();
						case "typeR":
							return u2.getType() - u1.getType();
						case "name":
							return u1.getName().compareTo(u2.getName());
						case "nameR":
							return u2.getName().compareTo(u1.getName());
						case "size":
							return u1.getSize() - u2.getSize();
						case "sizeR":
							return u2.getSize() - u1.getSize();
						case "modifyTime":
							return u1.getLatestEditTime() - u2.getLatestEditTime();
						case "modifyTimeR":
							return u2.getLatestEditTime() - u1.getLatestEditTime();
						case "createTime":
							return u1.getCreateTime() - u2.getCreateTime();
						case "createTimeR":
							return u2.getCreateTime() - u1.getCreateTime();
						}
						return 0;
					}
					
					private HashMap<Integer, String> buildSortMap(String sort) 
					{
						String [] sortStrs = sort.split(" ");
						HashMap<Integer, String> sortMap = new HashMap<Integer, String>();
						for(int i=0 ; i< sortStrs.length; i++)
						{
							String sortStr = sortStrs[i];
							System.out.println("sortStr:" + sortStr);
							if(sortStr != null && !sortStr.isEmpty())
							{
								sortMap.put(i, sortStr);
							}
						}
						
						return sortMap;
					}
				}
		);
		
		return docList;
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
	
	/************************ base64Encode相关接口 **************************************/
	protected String base64Encode(String str) 
	{
		if(str == null || str.isEmpty())
		{
			return str;
		}
		
		try {
			byte[] textByte = str.getBytes("UTF-8");
			//编码
			String base64Str = Base64.encodeBase64String(textByte);
			return base64Str;
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		}		
	}
	
	protected String base64EncodeURLSafe(String str) 
	{
		if(str == null || str.isEmpty())
		{
			return str;
		}
		
		try {
			byte[] textByte = str.getBytes("UTF-8");
			//编码
			String base64Str = Base64.encodeBase64URLSafeString(textByte);
			return base64Str;
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		}		
	}
	
	protected String base64Decode(String base64Str) 
	{
		//misc库
		//BASE64Decoder decoder = new BASE64Decoder();
		//return new String(decoder.decodeBuffer(base64Str),"UTF-8");
		
		//apache库
		byte [] data = Base64.decodeBase64(base64Str);
		try {
			String str =  new String(data,"UTF-8");
			return str;
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			System.out.println("base64Decode new String Error");
			e.printStackTrace();
			return null;
		}
		
		//java8自带库，据说速度最快
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
	public static String getFileEncode(String filePath)
	{
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
	
	public static boolean checkEncoding(byte[] bytes, String encode) 
	{   
		String str;
		try {
			str = new String(bytes, encode);
			System.out.println("checkEncoding() str:" + str);
	        if(Arrays.equals(str.getBytes(), bytes)) 
			{   
	        	return true;    
	        }
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
        return false;
	}

	static String getEncoding(byte[] bytes)
	{
		String [] encodeCheckList = {
				 "UTF-8",
				 "GBK",
				 "GB2312",
				 "ISO-8859-1",
				 "ASCII",
				 "UTF-16",
				 "GB18030",
		};
		for(int i=0; i<encodeCheckList.length; i++)
		{
			if(checkEncoding(bytes, encodeCheckList[i]) == true)
			{
				return encodeCheckList[i];
			}
		}
		return null;
    }
	
	//This interface was supplied by 寞寞柒柒
	public static String getCharset(String path) {
		String charset = "GBK";
		byte[] first3Bytes = new byte[3];
		try {
			boolean checked = false;
			BufferedInputStream bis = new BufferedInputStream(new FileInputStream(path));
			bis.mark(0); // 注： bis.mark(0);修改为 bis.mark(100);我用过这段代码，需要修改上面标出的地方。
			// 注：不过暂时使用正常，遂不改之
			int read = bis.read(first3Bytes, 0, 3);
			if (read == -1) {
				bis.close();
				return charset; // 文件编码为 ANSI
			} else if (first3Bytes[0] == (byte) 0xFF && first3Bytes[1] == (byte) 0xFE) {
				charset = "UTF-16LE"; // 文件编码为 Unicode
				checked = true;
			} else if (first3Bytes[0] == (byte) 0xFE && first3Bytes[1] == (byte) 0xFF) {
				charset = "UTF-16BE"; // 文件编码为 Unicode big endian
				checked = true;
			} else if (first3Bytes[0] == (byte) 0xEF && first3Bytes[1] == (byte) 0xBB && first3Bytes[2] == (byte) 0xBF) {
				charset = "UTF-8"; // 文件编码为 UTF-8
				checked = true;
			}
			bis.reset();
			if (!checked) {
				while ((read = bis.read()) != -1) {
					if (read >= 0xF0)
						break;
					if (0x80 <= read && read <= 0xBF) // 单独出现BF以下的，也算是GBK
						break;
					if (0xC0 <= read && read <= 0xDF) {
						read = bis.read();
						if (0x80 <= read && read <= 0xBF) // 双字节 (0xC0 - 0xDF)
							// (0x80 - 0xBF),也可能在GB编码内
							continue;
						else
							break;
					} else if (0xE0 <= read && read <= 0xEF) { // 也有可能出错，但是几率较小
						read = bis.read();
						if (0x80 <= read && read <= 0xBF) {
							read = bis.read();
							if (0x80 <= read && read <= 0xBF) {
								charset = "UTF-8";
								break;
							} else
								break;
						} else
							break;
					}
				}
			}
			bis.close();
		} catch (Exception e) {
			e.printStackTrace();
		}
		System.out.println("charset:" + charset);
		return charset;
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
    
	protected static boolean saveDocContentToFile(String content, String path, String name,  String encode)
	{	
		if(content == null)
		{
			System.out.println("saveDocContentToFile() content is null");
			return false;
		}
		
		File folder = new File(path);
		if(!folder.exists())
		{
			//System.out.println("saveDocContentToFile() path:" + path + " not exists!");
			if(folder.mkdirs() == false)
			{
				System.out.println("saveDocContentToFile() mkdir path:" + path + " Failed!");
				return false;
			}
		}
		
		//创建文件输入流
		String filePath = path + name;
		FileOutputStream out = null;
		try {
			out = new FileOutputStream(filePath);
		} catch (FileNotFoundException e) {
			System.out.println("saveVirtualDocContent() new FileOutputStream failed");
			e.printStackTrace();
			return false;
		}
		try {
			byte[] buff = null;
			System.out.println("saveDocContentToFile " +path+ " encode:" + encode);	

			if(encode == null)
			{
				buff = content.getBytes();
			}
			else
			{
				buff = content.getBytes(encode); //将String转成指定charset的字节内容
			}
			
			out.write(buff, 0, buff.length);
			//关闭输出流
			out.close();
		} catch (IOException e) {
			System.out.println("saveDocContentToFile() out.write exception");
			e.printStackTrace();
			return false;
		}		
		return true;
		
	}
	
	protected static String readDocContentFromFile(String path, String name, boolean encodeDetectEnable) 
	{	
		String filePath = path + name;
		try 
		{			
			File file = new File(filePath);
			if(!file.exists() || !file.isFile())
			{
				//System.out.println("readDocContentFromFile " +filePath+ " 不存在或不是文件");
				return null;
			}
			
			int fileSize = (int) file.length();
			//System.out.println("fileSize:[" + fileSize + "]");
			if(fileSize  <= 0)
			{
				return null;
			}
			
			String encode = null;
	
			byte buffer[] = new byte[fileSize];
			FileInputStream in;
			in = new FileInputStream(filePath);
			in.read(buffer, 0, fileSize);
			in.close();	

			String content = null;
			if(encodeDetectEnable)
			{
				//encode = getEncodeOfBuffer(buffer, fileSize);
				encode = getCharset(filePath);
				System.out.println("readDocContentFromFile " +filePath+ " encode:" + encode);
			}	
			if(encode == null)
			{
				content = new String(buffer);
			}
			else
			{
				content = new String(buffer, encode);
			}
			//System.out.println("content:[" + content + "]");
			return content;
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
	
	protected static String readDocContentFromFile(String path, String name, boolean encodeDetectEnable, int offset, int size) 
	{	
		String filePath = path + name;
		try 
		{			
			File file = new File(filePath);
			if(!file.exists() || !file.isFile())
			{
				//System.out.println("readDocContentFromFile " +filePath+ " 不存在或不是文件");
				return null;
			}
			
			int fileSize = (int) file.length();
			//System.out.println("fileSize:[" + fileSize + "]");
			if(fileSize  <= 0)
			{
				return null;
			}
			
			int readSize = fileSize > (offset + size) ? size: (fileSize - offset);
					
			String encode = null;
	
			byte buffer[] = new byte[readSize];
			FileInputStream in;
			in = new FileInputStream(filePath);
			in.read(buffer, offset, readSize);
			in.close();	

			String content = null;
			if(encodeDetectEnable)
			{
				//encode = getEncodeOfBuffer(buffer, fileSize);
				encode = getCharset(filePath);
				System.out.println("readDocContentFromFile " +filePath+ " encode:" + encode);
			}	
			if(encode == null)
			{
				content = new String(buffer);
			}
			else
			{
				content = new String(buffer, encode);
			}
			//System.out.println("content:[" + content + "]");
			return content;
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
    
    private static String getEncodeOfBuffer(byte[] buffer, int size) {
		// TODO Auto-generated method stub
		int encodeDetectBufLen = 0;
		byte [] encodeDetectBuf = null;

		if(size < 2)
		{
			return null;
		}
		
		if(size < 600)
		{
			encodeDetectBufLen = size;
			encodeDetectBuf = new byte[encodeDetectBufLen];
		}
		else
		{
			encodeDetectBufLen = 600;
			encodeDetectBuf = new byte[encodeDetectBufLen];
		}
		System.arraycopy(buffer, 0, encodeDetectBuf, 0, encodeDetectBufLen);
		String encode = getEncoding(encodeDetectBuf);
		System.out.println("getEncodeOfBuffer encode:[" + encode + "]");	

		return encode;
	}

	public static boolean copyFile(String srcFilePath,String dstFilePath,boolean cover){
        File srcFile=new File(srcFilePath);
        if(srcFile.exists() == false)
        {
    		System.err.println("copyFile() srcFilePath:" + srcFilePath + " not exists!");
    		return false;
        }

    	File dstFile=new File(dstFilePath);
    	if(cover == false && dstFile.exists())
    	{
        	//不允许覆盖
        	System.err.println("copyFile() " + dstFilePath + " exists!");
        	return false;
        }
        
    	boolean ret = false;
        FileInputStream in=null;
        FileOutputStream out=null;
        FileChannel inputChannel = null;    
        FileChannel outputChannel = null;   
    
        try {
	        //Copy by Channel
	        in=new FileInputStream(srcFilePath);
	        out=new FileOutputStream(dstFilePath);
	        inputChannel = in.getChannel();    
	        outputChannel = out.getChannel();   
	        outputChannel.transferFrom(inputChannel, 0, inputChannel.size());
	        inputChannel.close();
		    outputChannel.close();
		    in.close();
		    out.close();
		    ret = true;
        }
    	catch (Exception e) { 
    		System.err.println("copyFile() from " + srcFilePath + " to " + dstFilePath + " Exception"); 
    		e.printStackTrace(); 
    	} finally {
			try {
	    		if(inputChannel != null)
	    		{
	    			inputChannel.close();
	    		}
	    		if(outputChannel != null)
	    		{
					outputChannel.close();
	    		}
	    		if(in != null)
	    		{
	    			in.close();
	    		}
	    		if(out != null)
	    		{
	    			out.close();
	    		}
			} catch (Exception e) {
				e.printStackTrace();
			}

    	}
    	return ret;
    }
    
    //strict: true there is not file and dir, false: there is no file
	public boolean isEmptyDir(String dirPath, boolean strict) 
	{
		//System.out.println("isEmptyDir() dirPath:" + dirPath);
		File dir = new File(dirPath);
		if(isEmptyDir(dir, strict) == true)
		{
			//System.out.println("isEmptyDir() " + dirPath + " 本地是空目录");
			return true;
		}
		return false;
	}
	
    //strict: true there is not file and dir, false: there is no file
	public boolean isEmptyDir(File dir, boolean strict) 
	{
    	if(!dir.exists())
    	{
    		return true;
    	}
    	    	
    	File[] fileList = dir.listFiles();
    	if(fileList != null && fileList.length > 0)
    	{
    		if(strict)
    		{
    			return false;
    		}
    		
    		for(int i=0; i< fileList.length; i++)
    		{
    			if(fileList[i].isFile())
    			{
    				return false;
    			}
    			
    			if(isEmptyDir(fileList[i], strict) == false)
    			{
    				return false;
    			}
    		}
    	}    	
		return true;
	}

    public boolean copyDir(String srcPath, String dstPath, boolean cover) 
    {
	    try {
	    	//Check the srcDir
	    	File srcDir = new File(srcPath); 
	    	if(srcDir.exists() == false)
	    	{
    			System.err.println("copyDir() srcPath not exists:"+srcPath);
    			return false;	    				    		
	    	}
	    	
	    	//Check the newPath
	    	File dstDir = new File(dstPath);
	    	if(dstDir.exists())
	    	{
	    		if(cover == false)
	    		{
	    			System.err.println("copyDir() dstPath exists:"+dstPath);
	    			return false;	    			
	    		}
	    	}
	    	else
	    	{
	    		//mkdirs will create the no exists parent dir, so I use the mkdir
	    		if(dstDir.mkdir() == false)
	    		{
	    			System.err.println("copyDir() Failed to create dir:"+dstPath);
	    			return false;
	    		}
	    	}
	    	
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
	    	System.err.println("copyDir from " + srcPath  + " to " + dstPath + " 异常"); 
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
    
	protected boolean checkAddLocalDirectory(String localParentPath) {
		File parentDir = new File(localParentPath);
		if(parentDir.exists() == false)
		{
			return parentDir.mkdirs();
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
	
    protected long getFileOrDirSize(File file, boolean isFile) {
		if(isFile)
		{
			return file.length();
		}
		
		return getFolderSize(file);
	}

    protected long getFolderSize(File file) {
		return FileUtils.sizeOfDirectory(file);
	}
	
    //Create Directory
    public boolean createDir(String path){
        File dir=new File(path);
        if(!dir.exists())
        {
            return dir.mkdirs();
        }
        else
        {
        	return true;
        }
    }
    
    //Create File
    public static boolean createFile(String path,String filename){
        File dir = new File(path);
        if(!dir.exists())
        {
        	if(dir.mkdirs() == false)
        	{
        		return false;
        	}
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
    public static boolean delFile(String path){
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
    
    //Clear Directory
    public static boolean clearDir(String path){
        File file=new File(path);
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
        return true;
    }
    
    //检查文件是否存在
    public static boolean isFileExist(String path){
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
			forder1.mkdirs(); //创建目录
		}
		
		File dstFile = new File(path,fileName);
		
		srcFile.transferTo(dstFile);
		return fileName;
	}
	
	//向文件末尾追加内容
    public static void appendContentToFile(String filePath, String content) {
        try {
            // 打开一个随机访问文件流，按读写方式
            RandomAccessFile randomFile = new RandomAccessFile(filePath, "rw");
            // 文件长度，字节数
            long fileLength = randomFile.length();
            //将写文件指针移到文件尾。
            randomFile.seek(fileLength);
            randomFile.writeBytes(content);
            randomFile.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    public static String getFileSuffix(String filePath)
    {
    	String suffix = filePath.substring(filePath.lastIndexOf(".") + 1);
    	//System.out.println("getFileSuffix() " + suffix);
    	return suffix.toLowerCase();
    }
    
	public static boolean isOfficeFile(String name) 
	{
		String fileSuffix = getFileSuffix(name);
		return isOffice(fileSuffix);
	}
	
	protected static boolean isTextFile(String name) {
		String fileSuffix = getFileSuffix(name);
		return isText(fileSuffix);
	}
	
	protected boolean isTxzFile(String name) {
		int pos = name.toLowerCase().lastIndexOf(".txz") + 4;
		if(pos == name.length())
		{
			return true;
		}
		
		pos = name.toLowerCase().lastIndexOf(".tar.xz") + 7;
		return pos == name.length();
	}

	protected boolean isTgzFile(String name) {
		int pos = name.toLowerCase().lastIndexOf(".tgz") + 4;
		if(pos == name.length())
		{
			return true;
		}	
		
		pos = name.toLowerCase().lastIndexOf(".tar.gz") + 7;
		return pos == name.length();
	}

	protected boolean isTarBz2File(String name) {
		int pos = name.toLowerCase().lastIndexOf(".tbz2") + 5;
		if(pos == name.length())
		{
			return true;
		}
		
		pos = name.toLowerCase().lastIndexOf(".tar.bz2") + 8;
		return pos == name.length();
	}

	protected boolean isTarFile(String name) {
		int pos = name.toLowerCase().lastIndexOf(".tar") + 4;
		return pos == name.length();
	}
	
	protected boolean isBz2File(String name) {
		int pos = name.toLowerCase().lastIndexOf(".bz2") + 4;
		return pos == name.length();
	}
	
	protected boolean isXzFile(String name) {
		int pos = name.toLowerCase().lastIndexOf(".xz") + 3;
		return pos == name.length();
	}
	
	protected boolean isGzFile(String name) {
		int pos = name.toLowerCase().lastIndexOf(".gz") + 3;
		return pos == name.length();
	}

	protected boolean is7zFile(String name) {
		int pos = name.toLowerCase().lastIndexOf(".7z") + 3;
		return pos == name.length();
	}

	protected boolean isRarFile(String name) {
		int pos = name.toLowerCase().lastIndexOf(".rar") + 4;
		return pos == name.length();
	}
	
	protected boolean isZipFile(String name) {
		int pos = name.toLowerCase().lastIndexOf(".zip") + 4;
		return pos == name.length();
	}
	
	protected boolean isWarFile(String name) {
		int pos = name.toLowerCase().lastIndexOf(".war") + 4;
		return pos == name.length();
	}
	
	protected boolean isCompressFile(String name) {
		String fileSuffix = getFileSuffix(name);
		return isZip(fileSuffix);
	}
	
	protected String getCompressFileType(String name)
	{
		String fileSuffix = getFileSuffix(name);
		if(fileSuffix == null)
		{
			//"未知文件类型"
			return null;
		}
		
		switch(fileSuffix)
		{
		case "zip":
		case "war":
		case "rar":
		case "7z":
		case "tar":
		case "tgz":
		case "txz":
		case "tbz2":
			return fileSuffix;
		case "gz":
			int pos = name.toLowerCase().lastIndexOf(".tgz") + 4;
			if(pos == name.length())
			{
				return "tgz";
			}	
			pos = name.toLowerCase().lastIndexOf(".tar.gz") + 7;
			if(pos == name.length())
			{
				return "tar.gz";
			}
			return fileSuffix;
		case "xz":
			int pos1 = name.toLowerCase().lastIndexOf(".txz") + 4;
			if(pos1 == name.length())
			{
				return "txz";
			}	
			pos1 = name.toLowerCase().lastIndexOf(".tar.xz") + 7;
			if(pos1 == name.length())
			{
				return "tar.xz";
			}
			return fileSuffix;
		case "bz2":
			int pos2 = name.toLowerCase().lastIndexOf(".tbz2") + 5;
			if(pos2 == name.length())
			{
				return "tgz";
			}	
			pos2 = name.toLowerCase().lastIndexOf(".tar.bz2") + 8;
			if(pos2 == name.length())
			{
				return "tar.bz2";
			}
			return fileSuffix;
		default:
			return null;
		}
	}
	
	protected static boolean isZip(String fileSuffix) {
		if(fileSuffix == null)
		{
			//"未知文件类型"
			return false;
		}

		switch(fileSuffix)
		{
		case "zip":
		case "war":
		case "rar":
		case "7z":
		case "tar":
		case "tgz":
		case "gz":
		case "txz":
		case "xz":
		case "bz2":
		case "tbz2":
			return true;
		default:
			break;
		}
		return false;
	}
	
	protected boolean isPdf(String fileSuffix) {
		if(fileSuffix == null)
		{
			//"未知文件类型"
			return false;
		}

		switch(fileSuffix)
		{
		case "pdf":
			return true;
		default:
			break;
		}
		return false;
	}

	protected static boolean isText(String fileSuffix) {
		if(fileSuffix == null)
		{
			//"未知文件类型"
			return false;
		}

		switch(fileSuffix)
		{
		case "txt":
		case "log":	
		case "md":	
		case "py":
		case "java":
		case "cpp":
		case "hpp":
		case "c":
		case "h":
		case "json":
		case "xml":
		case "html":
		case "sql":
		case "js":
		case "css":
		case "jsp":
		case "php":
		case "properties":
		case "conf":
		case "out":
		case "sh":
		case "bat":
		case "msg":
		case "cmake":
			return true;
		default:
			break;
		}
		return false;
	}
	protected boolean isPicture(String fileSuffix) {
		if(fileSuffix == null)
		{
			//"未知文件类型"
			return false;
		}
		
		switch(fileSuffix)
		{
		case "jpg":
		case "jpeg":
		case "png":
		case "gif":
		case "bmp":
		case "mpg":
			return true;
		default:
			break;
		}
		return false;
	}
	
	protected boolean isVideo(String fileSuffix) {
		if(fileSuffix == null)
		{
			//"未知文件类型"
			return false;
		}
		
		switch(fileSuffix)
		{
		case "avi":
		case "mov":
		case "mpeg":
		case "mpg":
		case "mp4":
		case "rmvb":
		case "asf":
		case "flv":
		case "ogg":
			return true;
		default:
			break;
		}
		return false;
	}
	
	protected static boolean isOffice(String fileSuffix) {
		if(fileSuffix == null)
		{
			//"未知文件类型"
			return false;
		}
		
		switch(fileSuffix)
		{
		case "doc":
		case "docx":
		case "xls":
		case "xlsx":
		case "ppt":
		case "pptx":
			return true;
		default:
			break;
		}
		return false;
	}	
	/****************** Office文件解析接口 *********************************************/
	public static boolean extractToFileForWord(String filePath, String path, String name)
	{
    	HWPFDocument doc1 = null;
    	FileInputStream fis = null;
    	
		try {
			StringBuffer content = new StringBuffer("");// 文档内容
	    	fis = new FileInputStream(filePath);
    	
    		doc1 = new HWPFDocument(fis);

    		Range range = doc1.getRange();
    	    int paragraphCount = range.numParagraphs();// 段落
    	    for (int i = 0; i < paragraphCount; i++) {// 遍历段落读取数据
    	    	Paragraph pp = range.getParagraph(i);
    	    	content.append(pp.text());
    	    }
    	    
    		doc1.close();
    		doc1 = null;
    	    fis.close();
    	    fis = null;
    		
    	    return saveDocContentToFile(content.toString().trim(), path, name, null);
		} catch (Exception e) {
			if(doc1 != null)
			{
				try {
					doc1.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			if(fis != null)
			{
				try {
					fis.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
    		e.printStackTrace();
    		return false;
    	}
	}

	public static boolean extractToFileForWord2007(String filePath, String path, String name)
	{
    	FileInputStream fis = null;
    	XWPFDocument xdoc = null;
    	XWPFWordExtractor extractor = null;
    	
		try {
	    	
			File file = new File(filePath);
	    	String str = "";
	    	fis = new FileInputStream(file);
	    	xdoc = new XWPFDocument(fis);
    		extractor = new XWPFWordExtractor(xdoc);
        	
    		str = extractor.getText();
        	
        	extractor.close();
        	extractor = null;
        	xdoc.close();
        	xdoc = null;
        	fis.close();
        	fis = null;
        	
    	    return saveDocContentToFile(str.toString().trim(), path, name, null);
		} catch (Exception e) {			
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			if(xdoc != null)
			{
				try {
					xdoc.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
		
			if(fis != null)
			{
				try {
					fis.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			e.printStackTrace();
			return false;
		}
	}

	public static boolean extractToFileForExcel(String filePath, String path, String name)
	{
		InputStream is = null;  
        HSSFWorkbook workBook = null;  
        ExcelExtractor extractor = null; 
        
        try {  
	
			is = new FileInputStream(filePath);  
			workBook = new HSSFWorkbook(new POIFSFileSystem(is));  

            extractor=new ExcelExtractor(workBook);  
            extractor.setFormulasNotResults(false);  
            extractor.setIncludeSheetNames(true);  
            String text = extractor.getText();  
            
            extractor.close();
            extractor = null;
            workBook.close();
            workBook = null;
            is.close();
            is = null;
              
            return saveDocContentToFile( text.toString().trim(), path, name, null);
        } catch(Exception e) {
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			if(workBook != null)
			{
				try {
					workBook.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
		
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
        	
            e.printStackTrace();
            return false;
        }
	}

	public static boolean extractToFileForExcel2007(String filePath, String path, String name)
	{
        InputStream is = null;
        XSSFWorkbook workBook = null;  
        XSSFExcelExtractor extractor = null;
        
		try {  
	        is = new FileInputStream(filePath);
        	workBook = new XSSFWorkbook(is);  
            extractor = new XSSFExcelExtractor(workBook);  
            String text = extractor.getText();  

            extractor.close();
            extractor = null;
            workBook.close();
            workBook = null;
            is.close();
            is = null;
            
            return saveDocContentToFile( text.toString().trim(), path, name, null);
		} catch (Exception e) { 
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			if(workBook != null)
			{
				try {
					workBook.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
		
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
        	e.printStackTrace();  
        	return false;
        }       
	}

	public static boolean extractToFileForPPT(String filePath, String path, String name)
	{
		InputStream is = null;
        PowerPointExtractor extractor = null;  
        
		try {
			is = new FileInputStream(filePath);
            extractor = new PowerPointExtractor(is);  
            String text=extractor.getText();  
            
            extractor.close();
            extractor = null;
            is.close();      
            is = null;
            
            return saveDocContentToFile( text.toString().trim(), path, name, null);
		} catch (Exception e) {  
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
		
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
            e.printStackTrace(); 
            return false;
        }          
	}

	public static boolean extractToFileForPPT2007(String filePath, String path, String name)
	{
		InputStream is = null; 
        XMLSlideShow slide = null;
        XSLFPowerPointExtractor extractor = null;  
        
        try {  
			is = new FileInputStream(filePath); 
	        slide = new XMLSlideShow(is);
            extractor=new XSLFPowerPointExtractor(slide);  
            String text=extractor.getText();  
            
            extractor.close();
            extractor = null;
            slide.close();
            slide = null;
            is.close();
            is = null;
            
            return saveDocContentToFile( text.toString().trim(), path, name, null);
        } catch (Exception e) {  
			if(extractor != null)
			{
				try {
					extractor.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
			
			if(slide != null)
			{
				try {
					slide.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
		
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}
        	e.printStackTrace(); 
            return false;
        }
	}
	
	public static boolean extractToFileForPdf(String filePath, String path, String name)
	{
		PDDocument document = null;
				
		try
		{
			File pdfFile=new File(filePath);			
			document=PDDocument.load(pdfFile);
			int pages = document.getNumberOfPages();
			// 读文本内容
			PDFTextStripper stripper=new PDFTextStripper();
			// 设置按顺序输出
			stripper.setSortByPosition(true);
			stripper.setStartPage(1);
			stripper.setEndPage(pages);
			String content = stripper.getText(document);
			
			document.close();
			document = null;
			
            return saveDocContentToFile( content.toString().trim(), path, name, null);
	   }
	   catch(Exception e)
	   {
			if(document != null)
			{
				try {
					document.close();
				} catch (IOException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
			}			
			e.printStackTrace();
			return false;
	   }
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

	protected static boolean isWinDiskStr(String Str) 
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
	
	protected static boolean isWinDiskChar(String Str) 
	{
		if(Str.length() != 1)
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
	
	/*根据变量名对变量进行设置*/
	public static boolean setFieldValue(Object object,String field,Object value){
	    boolean ret = false;
		char[] chars = field.trim().toCharArray();
	    chars[0] -= 32;//将field的首字母转为大写，因为set方法后跟的是首字母大写的属性
	    try {
	        Method method = object.getClass().getMethod("set" + String.valueOf(chars), value.getClass());
	        method.invoke(object, value);
	        return true;
	    } catch (Exception e) {
	        e.printStackTrace();
	    }
	    return ret;
	}
	
	public static Object getFieldValue(Object object,String field){
	    char[] chars = field.trim().toCharArray();
	    chars[0] -= 32;//将field的首字母转为大写，因为set方法后跟的是首字母大写的属性
	    try {
	        Method method = object.getClass().getMethod("get" + String.valueOf(chars));
	        return method.invoke(object);
	    } catch (Exception e) {
	        e.printStackTrace();
	    }
	    return null;
	}
}
