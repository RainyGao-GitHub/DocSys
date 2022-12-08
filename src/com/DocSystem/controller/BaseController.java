package com.DocSystem.controller;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintStream;
import java.io.RandomAccessFile;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.channels.FileChannel;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.Properties;
import java.util.Scanner;
import java.util.Vector;
import java.util.Map.Entry;

import javax.naming.AuthenticationException;
import javax.naming.CommunicationException;
import javax.naming.Context;
import javax.naming.NamingEnumeration;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import javax.naming.directory.SearchControls;
import javax.naming.directory.SearchResult;
import javax.naming.ldap.InitialLdapContext;
import javax.naming.ldap.LdapContext;
import javax.security.auth.Subject;
import javax.security.auth.login.LoginContext;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.compress.archivers.sevenz.SevenZArchiveEntry;
import org.apache.commons.compress.archivers.sevenz.SevenZFile;
import org.apache.commons.compress.archivers.sevenz.SevenZOutputFile;
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream;
import org.apache.commons.httpclient.util.HttpURLConnection;
import org.apache.commons.net.ftp.FTPFile;
import org.apache.ibatis.jdbc.ScriptRunner;
import org.apache.tools.ant.Project;
import org.apache.tools.ant.taskdefs.Zip;
import org.apache.tools.ant.types.FileSet;
import org.apache.tools.tar.TarEntry;
import org.apache.tools.tar.TarInputStream;
import org.apache.tools.zip.ZipEntry;
import org.apache.tools.zip.ZipFile;
import org.eclipse.jgit.lib.FileMode;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.treewalk.TreeWalk;
import org.redisson.Redisson;
import org.redisson.api.RBucket;
import org.redisson.api.RMap;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;
import org.tmatesoft.svn.core.SVNDirEntry;
import org.tmatesoft.svn.core.SVNNodeKind;
import org.tukaani.xz.XZInputStream;

import util.DateFormat;
import util.ReadProperties;
import util.RegularUtil;
import util.ReturnAjax;
import util.Encrypt.MD5;

import com.DocSystem.common.Base64Util;
import com.DocSystem.common.BaseFunction;
import com.DocSystem.common.DocChange;
import com.DocSystem.common.DocChangeType;
import com.DocSystem.common.FileUtil;
import com.DocSystem.common.IPUtil;
import com.DocSystem.common.Log;
import com.DocSystem.common.MyExtractCallback;
import com.DocSystem.common.OS;
import com.DocSystem.common.Path;
import com.DocSystem.common.Reflect;
import com.DocSystem.common.ReposData;
import com.DocSystem.common.RunResult;
import com.DocSystem.common.ScanOption;
import com.DocSystem.common.SyncLock;
import com.DocSystem.commonService.EmailService;
import com.DocSystem.commonService.JavaSmsApi;
import com.DocSystem.commonService.SmsService;
import com.DocSystem.common.UniqueAction;
import com.DocSystem.common.constants;
import com.DocSystem.common.CommitAction.CommitAction;
import com.DocSystem.common.CommitAction.CommitType;
import com.DocSystem.common.CommonAction.Action;
import com.DocSystem.common.CommonAction.ActionType;
import com.DocSystem.common.CommonAction.CommonAction;
import com.DocSystem.common.CommonAction.DocType;
import com.DocSystem.common.channels.Channel;
import com.DocSystem.common.channels.ChannelFactory;
import com.DocSystem.common.entity.AuthCode;
import com.DocSystem.common.entity.BackupConfig;
import com.DocSystem.common.entity.BackupTask;
import com.DocSystem.common.entity.DocPullResult;
import com.DocSystem.common.entity.DocPushResult;
import com.DocSystem.common.entity.DownloadPrepareTask;
import com.DocSystem.common.entity.EncryptConfig;
import com.DocSystem.common.entity.LDAPConfig;
import com.DocSystem.common.entity.QueryResult;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.ReposAccess;
import com.DocSystem.common.entity.ReposBackupConfig;
import com.DocSystem.common.entity.ReposFullBackupTask;
import com.DocSystem.common.entity.SyncupTask;
import com.DocSystem.common.remoteStorage.FtpUtil;
import com.DocSystem.common.remoteStorage.GitUtil;
import com.DocSystem.common.remoteStorage.MxsDocUtil;
import com.DocSystem.common.remoteStorage.RemoteStorageSession;
import com.DocSystem.common.remoteStorage.SFTPUtil;
import com.DocSystem.common.remoteStorage.SmbUtil;
import com.DocSystem.common.remoteStorage.SvnUtil;
import com.DocSystem.entity.ChangedItem;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocAuth;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.DocShare;
import com.DocSystem.entity.GroupMember;
import com.DocSystem.entity.LogEntry;
import com.DocSystem.entity.RemoteStorageLock;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.ReposAuth;
import com.DocSystem.entity.Role;
import com.DocSystem.entity.SysConfig;
import com.DocSystem.entity.User;
import com.DocSystem.entity.UserGroup;
import com.DocSystem.service.impl.ReposServiceImpl;
import com.DocSystem.service.impl.UserServiceImpl;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.github.junrar.Archive;
import com.github.junrar.rarfile.FileHeader;
import com.jcraft.jsch.ChannelSftp.LsEntry;
import com.jcraft.jzlib.GZIPInputStream;

import jcifs.smb.SmbException;
import jcifs.smb.SmbFile;
import net.sf.sevenzipjbinding.IInArchive;
import net.sf.sevenzipjbinding.PropID;
import net.sf.sevenzipjbinding.SevenZip;
import net.sf.sevenzipjbinding.SevenZipException;
import net.sf.sevenzipjbinding.impl.RandomAccessFileInStream;
import util.GitUtil.GITUtil;
import util.LuceneUtil.LuceneUtil2;
import util.SvnUtil.SVNUtil;

public class BaseController  extends BaseFunction{
	@Autowired
	protected ReposServiceImpl reposService;
	@Autowired
	protected UserServiceImpl userService;
	@Autowired
	protected SmsService smsService;
	@Autowired
	protected EmailService emailService;
	
    static {		
		initLogLevel();
		initDocSysDataPath();
		initRedis();
    }
    
	protected static boolean initRedis() {
		Log.debug("initRedis() redisEn:" + redisEn);
		
		boolean preRedisEn = redisEn;
		String preClusterServerUrl = clusterServerUrl;
		String preRedisUrl = redisUrl;

		int isRedisEn = getRedisEn();
		Log.debug("initRedis() isRedisEn:" + isRedisEn);
			
		if(isRedisEn == 1)
		{
			clusterServerUrl = getClusterServerUrl();
			if(clusterServerUrl == null || clusterServerUrl.isEmpty())
			{
				errorLog("initRedis() clusterServerUrl not configured");
				redisEn = false;
				globalClusterDeployCheckResult = false;
			    globalClusterDeployCheckResultInfo = "集群失败: 集群服务器地址未设置";
			    return false;
			}
				
			redisUrl = getRedisUrl();
			if(redisUrl == null || redisUrl.isEmpty())
			{
				redisEn = false;
				errorLog("initRedis() redisUrl not configured");
				globalClusterDeployCheckResult = false;
			    globalClusterDeployCheckResultInfo = "集群失败: Redis服务器地址未设置";
				return false;
			}
			else
			{
		        Config config = new Config();
		        config.useSingleServer().setAddress(redisUrl);
		        redisClient = Redisson.create(config);
		        if(redisClient == null)
		        {
		        	redisEn = false;
		        	Log.error("initRedis() failed to connect to redisServer:" + redisUrl);
					globalClusterDeployCheckResult = false;
				    globalClusterDeployCheckResultInfo = "集群失败: Redis服务器连接失败";
				    return false;
		        }
		        else
		        {
		        	redisEn = true;
		        }
			}
		}
		else
		{
			redisEn = false;
		}
		
		//check if needRestartClusterServer
		if(redisEn)
		{		
			if(preRedisEn != redisEn)
			{
				//needRestartClusterServer
				Log.info("initRedis() redisEn changed form [" + preRedisEn + "] to [" + redisEn + "]");
				return true;
			}
			
			if(preRedisUrl == null || !preRedisUrl.equals(redisUrl))
			{
				Log.info("initRedis() redisUrl changed form [" + preRedisUrl + "] to [" + redisUrl + "]");
				return true;
			}
				
			if(preClusterServerUrl == null || !preClusterServerUrl.equals(clusterServerUrl))
			{
				Log.info("initRedis() clusterServerUrl changed form [" + preClusterServerUrl + "] to [" + clusterServerUrl + "]");
				return true;
			}
		}
		
		//注意从集群转到非集群不需要重新初始化
		return false;
	}

	private static void initLogLevel() {
		//初始化调试等级
		Log.debug("initLogLevel");
		Log.logLevel = getLogLevelFromFile();
		Log.debug("initLogLevel Log.logLevel:" + Log.logLevel);

		String logFilePath = getLogFileFromFile();
		Log.logFileConfig = logFilePath;
		initLogFile(logFilePath);
		
		//Log.logMask = Log.allowAll;
		//Log.logFile = Path.getSystemLogParentPath(docSysWebPath); 
		//Log.debug("initLogLevel Log.logFile:" + Log.logFile);
	}
	
	protected static void initLogFile(String logFilePath) 
	{
	    Log.debug("initLogFile() logFilePath:" + logFilePath);
		if(logFilePath != null)
		{
			Log.logFile = logFilePath;
		}
		
		if(Log.logFile != null)
		{
			File file = new File(Log.logFile);
	        if(file.exists() == false)
	        {
	        	try {
						
		        	File parentFile = file.getParentFile();
		        	if(parentFile.exists() == false)
		        	{
		        		parentFile.mkdirs();
		        	}
		        	
	        		if(file.createNewFile() == false)
	        		{
	        			Log.logFile = null;
	        		}
	        	} catch (IOException e) {
	        		Log.logFile = null;
					Log.debug("initLogFile() Failed to create logFile:" + logFilePath);
					Log.info(e);
				}
			}
		}
	    Log.debug("initLogFile() Log.logFile:" + Log.logFile);
	}
	
	protected static void initDocSysDataPath() {
		Log.info("initDocSysDataPath()");
		docSysDataPath = Path.getDataStorePath(OSType);
		if(docSysDataPath != null)
		{
			File file = new File(docSysDataPath);
	        if(file.exists() == false)
	        {
	        	try {
	        		file.mkdirs();
	        	} catch (Exception e) {
	        		docSysDataPath = null;
					Log.info("initDocSysDataPath() Failed to create docSysData folder:" + docSysDataPath);
					Log.info(e);
				}
			}
		}
		
		Log.info("initDocSysDataPath docSysDataPath:" + docSysDataPath);
	}

	protected boolean checkSystemUsersCount(ReturnAjax rt) {
		if(systemLicenseInfoCheck(rt) == false)
		{
			return false;
		}
		
		if(systemLicenseInfo.usersCount != null)
		{
			List<User> userList = userService.geAllUsers();
			if(userList.size() > systemLicenseInfo.usersCount)
			{
				Log.debug("checkSystemUsersCount() 用户数量已达到上限，请购买商业授权证书！");
				rt.setError("用户数量已达到上限，请购买专业版或企业版证书！");
				return false;
			}
		}
		return true;
	}

	protected static User buildAdminUser() {
		User user = new User();
		user.setName("Admin");
		user.setNickName("超级管理员");
		user.setPwd(MD5.md5("Admin"));
		user.setCreateType(0);	//系统自动创建
		//set createTime
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
		String createTime = df.format(new Date());// new Date()为获取当前系统时间
		user.setCreateTime(createTime);	//设置时间
		user.setType(2);
		return user;
	}


	protected boolean addAdminUser() {
		User user = buildAdminUser();
		if(userService.addUser(user) == 0)
		{
			return false;
		}
		return true;
	}
	
	//*** AuthCode
	protected String getAuthCodeForOfficeEditor(Doc doc, ReposAccess reposAccess) {
		//add authCode to authCodeMap
		AuthCode authCode = generateAuthCode("officeEditor", 1*CONST_DAY, 1000, reposAccess);
		return authCode.getCode();
	}
	
	protected String addDocDownloadAuthCode() {
		AuthCode authCode = generateAuthCode("docDownload", 3*CONST_DAY, 100, null);
		return authCode.getCode();
	}
	
	static void addDocSysInitAuthCode() {
		AuthCode authCode = generateAuthCode("docSysInit", 7*CONST_DAY, 1000, null);
		docSysInitAuthCode = authCode.getCode();
	}
	
	protected boolean checkAuthCode(String code, String expUsage) {
		Log.debug("checkAuthCode() authCode:" + code);
		AuthCode authCode = getAuthCode(code);
		if(authCode == null)
		{
			Log.debug("checkAuthCode() 无效授权码: authCode for [" + code + "] is null");
			return false;
		}

		if(authCode.getUsage() == null)
		{
			Log.debug("checkAuthCode() 无效授权码: authCode usage is null");
			return false;
		}

		if(authCode.getExpTime() == null || authCode.getRemainCount() == null)
		{
			Log.debug("checkAuthCode() 无效授权码: authCode expireTime is null");
			return false;
		}

		if(authCode.getRemainCount() == null)
		{
			Log.debug("checkAuthCode() 无效授权码: authCode remainCount is null");
			return false;
		}

		if(expUsage != null)
		{
			Log.debug("checkAuthCode() usage:" + authCode.getUsage() + " expUsage:" + expUsage);				
			if(!expUsage.equals(authCode.getUsage()))
			{
				Log.debug("checkAuthCode() auhtCode usage not matched");				
				return false;
			}			
		}
		
		
		Integer remainCount = authCode.getRemainCount();
		if(remainCount == 0)
		{
			Log.debug("checkAuthCode() 授权码使用次数为0");
			deleteAuthCode(code);
			return false;	
		}
		
		long curTime = new Date().getTime();
		if(curTime > authCode.getExpTime())
		{
			Log.debug("checkAuthCode() 授权码已过期");
			deleteAuthCode(code);
			return false;			
		}
		
		//update the remainCount
		authCode.setRemainCount(remainCount-1);				
		return true;
	}
	
	/****************************** DocSys manage 页面权限检查接口  **********************************************/
	protected boolean superAdminAccessCheck(String authCode, String expUsage, HttpSession session, ReturnAjax rt) {
		return mamageAccessCheck(authCode, expUsage, 2, session, rt);
	}
	protected boolean adminAccessCheck(String authCode, String expUsage, HttpSession session, ReturnAjax rt) {
		return mamageAccessCheck(authCode, expUsage, 1, session, rt);
	}

	
	//role: 0 普通用户、1 管理员、2超级管理员
	protected boolean mamageAccessCheck(String authCode, String expUsage, int role, HttpSession session, ReturnAjax rt) {
		if(authCode != null)
		{
			if(checkAuthCode(authCode, expUsage) == true)
			{
				return true;
			}
			docSysErrorLog("无效授权码或授权码已过期！", rt);
			return false;
		}
		
		User login_user = (User) session.getAttribute("login_user");
		if(login_user == null)
		{
			docSysErrorLog("用户未登录，请先登录！", rt);
			return false;
		}
				
		if(login_user.getType() < role)
		{
			docSysErrorLog("您无权进行此操作，请联系系统管理员！", rt);
			return false;
		}
		
		return true;
		
	}
	
	/****************************** DocSys 文件访问密码接口 **********************************************/
	protected String getDocPwd(Repos repos, Doc doc) {
		String reposPwdPath = Path.getReposPwdPath(repos);
		String pwdFileName = doc.getDocId() + ".pwd";
		if(FileUtil.isFileExist(reposPwdPath + pwdFileName) == false)
		{
			return null;
		}
		
		String docPwd = FileUtil.readDocContentFromFile(reposPwdPath, pwdFileName, "UTF-8");
		return docPwd;
	}
	
	/****************************** DocSys Doc列表获取接口 **********************************************/
	//getAccessableSubDocList
	protected List<Doc> getAccessableSubDocList(Repos repos, Doc doc, DocAuth docAuth, HashMap<Long, DocAuth> docAuthHashMap, ReturnAjax rt) 
	{	
		Log.debug("getAccessableSubDocList() docId:" + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "]");				
		List<Doc> docList = getAuthedSubDocList(repos, doc, docAuth, docAuthHashMap, true, rt);
	
		if(docList != null)
		{
			Collections.sort(docList);
		
			//Log.printObject("getAccessableSubDocList() docList:", docList);
		}		
		return docList;
	}

	//getSubDocHashMap will do get HashMap for subDocList under pid,
	protected List<Doc> getAuthedSubDocList(Repos repos, Doc doc, DocAuth pDocAuth, HashMap<Long, DocAuth> docAuthHashMap, boolean remoteStorageEn, ReturnAjax rt)
	{
		List<Doc> docList = new ArrayList<Doc>();
		List<Doc> tmpDocList = docSysGetDocList(repos, doc, remoteStorageEn);

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

	protected List<Doc> docSysGetDocList(Repos repos, Doc doc, boolean remoteStorageEn) 
	{
		Log.debug("docSysGetDocList() docId:" + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "]");
		//文件管理系统
		if(isFSM(repos))
		{
			if(remoteStorageEn)
			{
				return docSysGetDocListWithChangeType(repos, doc);
			}
			return getLocalEntryList(repos, doc);
		}
		
		//文件服务器前置
		return getRemoteServerEntryList(repos, doc);
	}
	
	private List<Doc> docSysGetDocListWithChangeType(Repos repos, Doc doc) {
		List<Doc> localList = getLocalEntryList(repos, doc);
		RemoteStorageConfig remote = repos.remoteStorageConfig;
		if(remote == null)
		{
			Log.debug("docSysGetDocListWithChangeType remote is null");
			return localList;
		}
		List<Doc> remoteList = getRemoteStorageEntryList(repos, doc, remote, null);
		if(remoteList == null)
		{
			Log.debug("docSysGetDocListWithChangeType remoteList is null");
			return localList;
		}
		Log.printObject("docSysGetDocListWithChangeType remoteList:", remoteList);
		return combineLocalListWithRemoteList(repos, doc, localList, remoteList);
	}

	private List<Doc> combineLocalListWithRemoteList(Repos repos, Doc doc, List<Doc> localList, List<Doc> remoteList) {
		Log.debug("combineLocalListWithRemoteList");

		List<Doc> result = new ArrayList<Doc>();
		
		//dbHashMap（可以用于标记本地文件和远程存储文件的新增、删除、修改）
		HashMap<String, Doc> dbHashMap = getRemoteStorageDBHashMap(repos, doc);
		
		//to mark the doc have been add to result
		HashMap<String, Doc> docHashMap = new HashMap<String, Doc>();	//the doc already scanned
		
		//遍历localList并放入 hashMap
		if(localList != null)
		{
			for(int i=0; i<localList.size(); i++)
			{
				Doc localDoc = localList.get(i);
				if(dbHashMap != null)
				{
					localDoc.localChangeType = getLocalChangeType(dbHashMap, localDoc);
				}
				docHashMap.put(localDoc.getName(), localDoc);
				result.add(localDoc);
			}
		}
		
		//遍历remoteList并放入 hashMap
		if(remoteList != null)
		{
			for(int i=0; i<remoteList.size(); i++)
			{
				Doc remoteDoc = remoteList.get(i);
	    		
				Doc tmpDoc = docHashMap.get(remoteDoc.getName());
	    		if(tmpDoc == null)
	    		{
		    		if(dbHashMap != null)
					{
		    			remoteDoc.remoteChangeType = getRemoteChangeType(dbHashMap, remoteDoc);
					}
	    			docHashMap.put(remoteDoc.getName(), remoteDoc);
	        		result.add(remoteDoc);
	    		}
	    		else
	    		{
		    		if(dbHashMap != null)
					{
						tmpDoc.remoteChangeType = getRemoteChangeType(dbHashMap, remoteDoc);
					}
	    		}
			}
		}
		return result;
	}
	

	protected static Doc getRemoteStorageEntry(Repos repos, Doc doc, RemoteStorageConfig remote) {
        return remoteStorageGetEntry(null, remote, repos, doc, null);
	}

	private DocChangeType getRemoteChangeType(HashMap<String, Doc> dbHashMap, Doc remoteDoc) {
		Doc dbDoc = dbHashMap.get(remoteDoc.getName());
		return getRemoteDocChangeType(dbDoc, remoteDoc);
	}

	private DocChangeType getLocalChangeType(HashMap<String, Doc> dbHashMap, Doc localDoc) {
		Doc dbDoc = dbHashMap.get(localDoc.getName());
		return getLocalDocChangeType(dbDoc, localDoc);
	}

	@SuppressWarnings("unused")
	private List<Doc> getRemoteStorageDBEntryList(Repos repos, Doc doc) {
        return remoteStorageGetDBEntryList(repos.remoteStorageConfig, repos, doc);
	}
	
	private HashMap<String, Doc> getRemoteStorageDBHashMap(Repos repos, Doc doc) {
        return remoteStorageGetDBHashMap(repos.remoteStorageConfig, repos, doc);
	}
	
	private List<Doc> getRemoteStorageEntryList(Repos repos, Doc doc, RemoteStorageConfig remote, String commitId) {
		List<Doc> list = remoteStorageGetEntryList(null, remote, repos, doc, commitId);
        return list;
	}
	
	private List<Doc> getDBEntryList(Repos repos, Doc doc) {
		Doc qDoc = new Doc();
		qDoc.setVid(repos.getId());
		qDoc.setPid(doc.getDocId());
    	List <Doc> subEntryList =  reposService.getDocList(qDoc);
    	for(int i=0;i<subEntryList.size();i++)
    	{
    		Doc subDoc = subEntryList.get(i);
    		subDoc.setLocalRootPath(doc.getLocalRootPath());
    		subDoc.setLocalVRootPath(doc.getLocalVRootPath());
    	}
    	return subEntryList;
	}
	
	//注意：该接口调用前doc的localRootPath和LocalVRootPath必须正确设置
	protected List<Doc> getLocalEntryList(Repos repos, Doc doc) 
	{
		//Log.debug("getLocalEntryList() " + doc.getDocId() + " " + doc.getPath() + doc.getName());
    	try {
    		String reposPath = Path.getReposPath(repos);
    		//由于该接口可以被重用于获取非仓库相对路径的目录，所以需要冲doc中获取rootpath
			String localRootPath = doc.getLocalRootPath();
			String localVRootPath = doc.getLocalVRootPath();
			
			String docName = doc.getName();
			if(doc.getDocId() == 0)
			{
				docName = "";
			}
	
			File dir = new File(localRootPath + doc.getPath() + docName);
	    	if(false == dir.exists())
	    	{
	    		//Log.debug("getLocalEntryList() " + doc.getPath() + docName + " 不存在！");
	    		return null;
	    	}
	    	
	    	if(dir.isFile())
	    	{
	    		//Log.debug("getLocalEntryList() " + doc.getPath() + docName + " 不是目录！");
	    		return null;
	    	}
	
			String subDocParentPath = getSubDocParentPath(doc);
			Integer subDocLevel = getSubDocLevel(doc);
	    	
	        //Go through the subEntries
	    	List <Doc> subEntryList =  new ArrayList<Doc>();
	    	
	    	File[] localFileList = dir.listFiles();
	    	for(int i=0;i<localFileList.length;i++)
	    	{
	    		File file = localFileList[i];
	    		
	    		int type = 1;
	    		if(file.isDirectory())
	    		{
	    			type = 2;
	    		}
	    		
	    		//getDirSize的性能太低下，不建议使用
	    		//long size = getFileOrDirSize(file, file.isFile());
	    		long size = file.length();
	    				
	    		String name = file.getName();
	    		//Log.debug("getLocalEntryList subFile:" + name);
	
	    		Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(), reposPath, subDocParentPath, name, subDocLevel, type, true, localRootPath, localVRootPath, size, "", doc.offsetPath);
	    		subDoc.setLatestEditTime(file.lastModified());
	    		subDoc.setCreateTime(file.lastModified());
	    		subEntryList.add(subDoc);
	    	}
	    	return subEntryList;
    	}catch(Exception e){
    		Log.debug("getLocalEntryList() Excepiton for " + doc.getDocId() + " " + doc.getPath() + doc.getName());    		
    		Log.info(e);
    		return null;
    	}
	}
	
	protected HashMap<String, Doc> getLocalEntryHashMap(Repos repos, Doc doc) 
	{
    	try {
    		String reposPath = Path.getReposPath(repos);
			String localRootPath = Path.getReposRealPath(repos);
			String localVRootPath = Path.getReposVirtualPath(repos);
			
			String docName = doc.getName();
			if(doc.getDocId() == 0)
			{
				docName = "";
			}
	
			File dir = new File(localRootPath + doc.getPath() + docName);
	    	if(false == dir.exists())
	    	{
	    		//Log.debug("getLocalEntryList() " + doc.getPath() + docName + " 不存在！");
	    		return null;
	    	}
	    	
	    	if(dir.isFile())
	    	{
	    		//Log.debug("getLocalEntryList() " + doc.getPath() + docName + " 不是目录！");
	    		return null;
	    	}
	
			String subDocParentPath = getSubDocParentPath(doc);
			
			Integer subDocLevel = getSubDocLevel(doc);
	    	
	        //Go through the subEntries
	    	HashMap <String, Doc> subEntryHashMap =  new HashMap<String, Doc>();
	    	
	    	File[] localFileList = dir.listFiles();
	    	for(int i=0;i<localFileList.length;i++)
	    	{
	    		File file = localFileList[i];
	    		
	    		int type = 1;
	    		if(file.isDirectory())
	    		{
	    			type = 2;
	    		}
	    		
	    		//getDirSize的性能太低下，不建议使用
	    		//long size = getFileOrDirSize(file, file.isFile());
	    		long size = file.length();
	    				
	    		String name = file.getName();
	    		//Log.debug("getLocalEntryList subFile:" + name);
	
	    		Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(), reposPath, subDocParentPath, name, subDocLevel, type, true, localRootPath, localVRootPath, size, "", doc.offsetPath);
	    		subDoc.setLatestEditTime(file.lastModified());
	    		subDoc.setCreateTime(file.lastModified());
	    		subEntryHashMap.put(subDoc.getName(), subDoc);
	    	}
	    	return subEntryHashMap;
    	}catch(Exception e){
    		Log.debug("getLocalEntryHashMap() Excepiton for " + doc.getDocId() + " " + doc.getPath() + doc.getName());    		
    		Log.info(e);
    		return null;
    	}
	}

	protected static Integer getSubDocLevel(Doc doc) {
		if(doc.getLevel() == null)
		{
			//根目录level = -1, 否则就是doc.path的目录级数
			if(doc.getName().isEmpty())
			{
				doc.setLevel(-1);
			}
			else
			{
				doc.setLevel(Path.getLevelByParentPath(doc.getPath()));
			}
			
			//理论上这里的打印不应该出现（一般情况下doc的level都已经计算好的）
			Log.debug("getSubDocLevel() ["+ doc.getPath() + doc.getName() + "] level:" + doc.getLevel());
		}
		return doc.getLevel() + 1;
	}

	private List<Doc> getVerReposEntryList(Repos repos, Doc doc) {
		//Log.debug("getVerReposEntryList() " + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "]");

		switch(repos.getVerCtrl())
		{
		case 1:	//SVN
			SVNUtil svnUtil = new SVNUtil();
			if(false == svnUtil.Init(repos, true, null))
			{
				Log.debug("getVerReposEntryList() svnUtil.Init Failed");
				return null;
			}
			
			//Get list from verRepos
			return svnUtil.getDocList(repos, doc, null); 
		case 2:	//GIT
			
			GITUtil gitUtil = new GITUtil();
			if(false == gitUtil.Init(repos, true, null))
			{
				Log.debug("getVerReposEntryList() gitUtil.Init Failed");
				return null;
			}
			
			//Get list from verRepos
			return gitUtil.getDocList(repos, doc, null); 
		}
		return null;
	}
	
	private List<Doc> getRemoteServerEntryList(Repos repos, Doc doc) {
		RemoteStorageConfig remote = repos.remoteServerConfig;
		if(remote == null)
		{
			Log.debug("getRemoteServerEntryList remoteServerConfig is null");
			return null;
		}
		List<Doc> remoteList = getRemoteStorageEntryList(repos, doc, remote, null);
		if(remoteList == null)
		{
			Log.debug("getRemoteServerEntryList remoteList is null");
			return null;
		}
		Log.printObject("getRemoteServerEntryList remoteList:", remoteList);
		return remoteList;
	}

	protected boolean isDirLocalChanged(Repos repos, Doc doc) 
	{
		HashMap<String, Doc> docHashMap = new HashMap<String, Doc>();	//the doc already scanned
		
		Doc subDoc = null;
		List<Doc> dbDocList = getDBEntryList(repos, doc);
		//Log.printObject("isDirLocalChanged() dbEntryList:", dbDocList);
	   	if(dbDocList != null)
    	{
	    	for(int i=0;i<dbDocList.size();i++)
	    	{
	    		subDoc = dbDocList.get(i);
	    		docHashMap.put(subDoc.getName(), subDoc);
	    		//Log.printObject("isDirLocalChanged() dbDoc:", subDoc);
	    	   	
	    		Doc subLocalEntry = fsGetDoc(repos, subDoc);
	    		//Log.printObject("isDirLocalChanged() localEntry: ", subLocalEntry);
	    		if(subLocalEntry.getType() == 0)
	    		{
	    			//Log.debug("isDirLocalChanged() 本地文件删除: " + subDoc.getDocId() + " " + subDoc.getPath() + subDoc.getName());
	    			return true;
	    		}
	    		
	    		if(!subLocalEntry.getType().equals(subDoc.getType()))
	    		{
	    			//Log.debug("isDirLocalChanged() 本地文件类型变化: " + subDoc.getDocId() + " " + subDoc.getPath() + subDoc.getName());
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
	    		
	    		if(isDocLocalChanged(repos, subDoc, subLocalEntry))
	    		{
	    			//Log.debug("isDirLocalChanged() 本地文件内容修改: " + subDoc.getDocId() + " " + subDoc.getPath() + subDoc.getName());
	    			return true;
	    		}
	    	}
    	}

    	List<Doc> localEntryList = getLocalEntryList(repos, doc);
		//Log.printObject("isDirLocalChanged() localEntryList:", localEntryList);
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
    			//Log.debug("isDirLocalChanged() local Doc Added: " + subDoc.getDocId() + " " + subDoc.getPath() + subDoc.getName());
	    		return true;
	    	}
    	}
		
		return false;
	}

	protected boolean isDocLocalChanged(Repos repos, Doc dbDoc, Doc localEntry) 
	{
		//dbDoc不存在，无发确认本地是否修改，因此总是认为有修改
		if(dbDoc == null)
		{
			Log.debug("isDocLocalChanged() dbDoc is null"); 			
			return true;
		}
		
		//文件大小变化了则一定是变化了
		if(!dbDoc.getSize().equals(localEntry.getSize()))
		{
			Log.debug("isDocLocalChanged() local changed: dbDoc.size:" + dbDoc.getSize() + " localEntry.size:" + localEntry.getSize()); 
			return true;			
		}
				
		//如果日期和大小都没变表示文件没有改变
		if(!dbDoc.getLatestEditTime().equals(localEntry.getLatestEditTime()))
		{
			
			Log.debug("isDocLocalChanged() local changed: dbDoc.lastEditTime:" + dbDoc.getLatestEditTime() + " localEntry.lastEditTime:" + localEntry.getLatestEditTime()); 
			return true;
		}
		
		//如果仓库带有版本管理，那么revision未设置则认为文件本地有修改
		if(repos.getVerCtrl() == 1 || repos.getVerCtrl() == 2)
		{
			if(dbDoc.getRevision() == null || dbDoc.getRevision().isEmpty())
			{
				Log.debug("isDocLocalChanged() local changed: dbDoc.revision is null or empty:" + dbDoc.getRevision()); 
				return true;
			}
		}
		
		return false;
	}
	
	protected boolean isDocRemoteChanged(Repos repos, Doc dbDoc, Doc remoteEntry) 
	{
		//dbDoc不存在，无法确认远程是否修改，此时总是认为有改动
		if(dbDoc == null)
		{
			return true;
		}
		
		if(repos.getVerCtrl() == 0)
		{
			return false;
		}
		
		if(dbDoc.getRevision() != null && !dbDoc.getRevision().isEmpty() && dbDoc.getRevision().equals(remoteEntry.getRevision()))
		{
			return false;
		}
		
		//Log.debug("isDocRemoteChanged() remote changed: dbDoc.revision:" + dbDoc.getRevision() + " remoteEntry.revision:" + remoteEntry.getRevision()); 
		//Log.printObject("isDocRemoteChanged() doc:",dbDoc);
		//Log.printObject("isDocRemoteChanged() remoteEntry:",remoteEntry);
		return true;
	}

	protected HashMap<String, Doc> getIndexHashMap(Repos repos, Long pid, String path) 
	{
		Log.debug("getIndexHashMap() path:" + path); 
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
	protected List<Doc> getDocListFromRootToDoc(Repos repos, Doc doc, DocAuth rootDocAuth,  Doc rootDoc, HashMap<Long, DocAuth> docAuthHashMap, ReturnAjax rt)
	{
		//Log.debug("getDocListFromRootToDoc() reposId:" + repos.getId() + " parentPath:" + doc.getPath() +" docName:" + doc.getName());
				
		List<Doc> resultList = getAccessableSubDocList(repos, rootDoc, rootDocAuth, docAuthHashMap, rt);	//get subDocList under root
		if(resultList == null || resultList.size() == 0)
		{
			//Log.debug("getDocListFromRootToDoc() docList under root is empty");			
			return null;
		}
		
		String relativePath = getRelativePath(doc, rootDoc);
		Log.debug("getDocListFromRootToDoc() relativePath:" + relativePath);		
		if(relativePath == null || relativePath.isEmpty())
		{
			return resultList;
		}
		
		String [] paths = relativePath.split("/");
		int deepth = paths.length;
		//Log.debug("getDocListFromRootToDoc() deepth:" + deepth); 
		if(deepth < 1)
		{
			return resultList;
		}
		
		Integer reposId = repos.getId();
		Long pid = rootDoc.getDocId();
		String pPath = rootDoc.getPath() + rootDoc.getName() + "/";
		if(rootDoc.getName().isEmpty())
		{
			pPath = rootDoc.getPath();
		}
		int pLevel = rootDoc.getLevel();
		DocAuth pDocAuth = rootDocAuth;
		
		for(int i=0; i<deepth; i++)
		{
			String name = paths[i];
			Log.debug("name:" + name);
			if(name.isEmpty())
			{
				continue;
			}	
			
			Doc tempDoc = buildBasicDoc(reposId, null, pid, doc.getReposPath(), pPath, name, pLevel+1, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null);
			DocAuth docAuth = getDocAuthFromHashMap(doc.getDocId(), pDocAuth, docAuthHashMap);
			
			List<Doc> subDocList = getAccessableSubDocList(repos, tempDoc, docAuth, docAuthHashMap, rt);
			if(subDocList == null || subDocList.size() == 0)
			{
				docSysDebugLog("getDocListFromRootToDoc() Failed to get the subDocList under doc: " + pPath+name, rt);
				break;
			}
			resultList.addAll(subDocList);
			
			pPath = pPath + name + "/";
			pid = tempDoc.getPid();
			pDocAuth = docAuth;
			pLevel++;
		}
		
		return resultList;
	}
	
	private String getRelativePath(Doc doc, Doc rootDoc) {
		String docPath = doc.getPath() + doc.getName();
		String rootDocPath = rootDoc.getPath() + rootDoc.getName();
		if(docPath.equals(rootDocPath))
		{
			return "";
		}
		
		if(docPath.indexOf(rootDocPath) != 0)
		{
			return null;
		}
		
		String relativePath =  docPath.substring(rootDocPath.length());
		Log.debug("getRelativePath() relativePath:" + relativePath);
		return relativePath;
	}

	protected void addDocToSyncUpList(List<CommonAction> actionList, Repos repos, Doc doc, Action syncType, User user, String commitMsg, boolean checkLock) 
	{
		Log.printObject("addDocToSyncUpList() syncType:" + syncType + " doc:", doc);
		if(user == null)
		{
			user = systemUser;
		}
		
		if(checkLock == false || false == checkDocLocked(doc, DocLock.LOCK_TYPE_FORCE, user, false))
		{
			CommonAction.insertCommonAction(actionList,repos,doc, null, commitMsg, user.getName(), ActionType.AUTOSYNCUP, syncType, DocType.REALDOC, null, user, false);
		}
	}
	
	protected List<Repos> getAccessableReposList(Integer userId) {
		Log.debug("getAccessableReposList() userId:" + userId);
		
		//取出用户在系统上的所有仓库权限列表
		//将仓库权限列表转换成HashMap,方便快速从列表中取出仓库的用户权限
		HashMap<Integer,ReposAuth> reposAuthHashMap = getUserReposAuthHashMap(userId);
		//Log.printObject("reposAuthHashMap:",reposAuthHashMap);
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
			//Log.printObject("repos",repos);
			ReposAuth reposAuth = reposAuthHashMap.get(repos.getId());
			//Log.printObject("reposAuth",reposAuth);
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
		
		path1 = Path.dirPathFormat(path1);
		path2 = Path.dirPathFormat(path2);
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
			Log.debug("仓库名不能为空！");
			rt.setError("仓库名不能为空！");			
			return false;
		}

		if(true == isReposPathBeUsed(repos,rt))
		{
			Log.debug("仓库存储目录 " + repos.getPath() + " 已被使用！");
			rt.setError("仓库存储目录 " + repos.getPath() + " 已被使用！");		
			return false;
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
				verReposURI = Path.dirPathFormat(verReposURI);
				verReposURI1 = Path.dirPathFormat(verReposURI1);
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
		
		if(verCtrl !=null && verCtrl != 0 )
		{
			if(isRemote == 0)	//本地版本仓库
			{
				//修正localVerReposPath
				if(localSvnPath == null || localSvnPath.isEmpty())
				{
					if(isRealDoc)
					{
						repos.setLocalSvnPath(Path.getDefaultLocalVerReposPath(repos.getPath()));
					}
					else
					{
						repos.setLocalSvnPath1(Path.getDefaultLocalVerReposPath(repos.getPath()));						
					}
				}			
			}	
			else	//远程版本仓库
			{
				if(svnPath == null || svnPath.isEmpty())
				{
					Log.debug("版本仓库链接不能为空");	//这个其实还不是特别严重，只要重新设置一次即可
					rt.setError("版本仓库链接不能为空！");
					return false;
				}
				
				if(oldSvnPath == null || !svnPath.equals(oldSvnPath))
				{
					//检查版本仓库地址是否已使用
					if(isVerReposPathBeUsed(repos.getId(),svnPath) == true)
					{
						Log.debug("版本仓库地址已使用:" + svnPath);	//这个其实还不是特别严重，只要重新设置一次即可
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
							repos.setLocalSvnPath(Path.getDefaultLocalVerReposPath(repos.getPath()));
						}
						else
						{
							repos.setLocalSvnPath1(Path.getDefaultLocalVerReposPath(repos.getPath()));							
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
			realDocPath = Path.dirPathFormat(realDocPath);
			newReposInfo.setRealDocPath(realDocPath);
			if(true == isReposRealDocPathBeUsed(newReposInfo,rt))
			{
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
		
		if(verCtrl != null && verCtrl != 0)
		{
			if(isRemote == 0)
			{	
				//Create a localVersionRepos
				if(createLocalVerRepos(repos, isRealDoc, rt) == null)
				{
					Log.debug("版本仓库创建失败");	//这个其实还不是特别严重，只要重新设置一次即可
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
						Log.debug("删除版本仓库失败");
						rt.setError("删除版本仓库失败");	
						return false;						
					}
						
					//Clone the Repository
					if(cloneGitRepos(repos, isRealDoc, rt) == null)
					{
						Log.debug("版本仓库Clone失败");	//这个其实还不是特别严重，只要重新设置一次即可
						rt.setError("版本仓库Clone失败");	
						return false;
					}
				}
				
			}	
		}
		return true;
	}

	public boolean deleteClonedRepos(Repos repos, boolean isRealDoc) {
		String clonedReposPath = Path.getLocalVerReposPath(repos, isRealDoc);
		File localRepos = new File(clonedReposPath);
		if(localRepos.exists())
		{
			return FileUtil.delFileOrDir(clonedReposPath);
		}
		return true;
	}

	protected String cloneGitRepos(Repos repos, boolean isRealDoc, ReturnAjax rt) {
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
		reposAuth.setDownloadEn(1);	//可以下载仓库中的文件或目录
		
		int ret = reposService.addReposAuth(reposAuth);
		Log.debug("addRepos() addReposAuth return:" + ret);
		if(ret == 0)
		{
			docSysDebugLog("addRepos() addReposAuth return:" + ret, rt);
			Log.debug("新增用户仓库权限失败");
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
		docAuth.setDownloadEn(1);;	//下载权限：可以下载仓库中的文件或目录
		docAuth.setHeritable(1);;	//权限继承：0：不可继承  1：可继承
		docAuth.setUploadSize(Long.MAX_VALUE);	//上传限制：最大值
		
		ret = reposService.addDocAuth(docAuth);
		Log.debug("addRepos() addDocAuth return:" + ret);
		if(ret == 0)
		{
			docSysDebugLog("addRepos() addReposAuth return:" + ret, rt);
			Log.debug("新增用户仓库根目录权限失败");
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
				String reposPath = Path.getReposPath(repos);
				if(reposPath != null && !reposPath.isEmpty())
				{
					reposPath = Path.localDirPathFormat(reposPath, OSType);
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
					realDocPath = Path.localDirPathFormat(realDocPath, OSType);
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
				reposPath = Path.localDirPathFormat(reposPath, OSType);
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
//					realDocPath = Path.localDirPathFormat(realDocPath);
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
//					Log.debug("该版本仓库连接已被使用:" + newVerReposPath); 
//					Log.debug("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " verReposPath=" + verReposURI); 
//					return true;
//				}
//			}
//			
//			String verReposURI1 = repos.getSvnPath1();
//			if(verReposURI1 != null && !verReposURI1.isEmpty())
//			{
//				if(isPathConflict(verReposURI1,newVerReposPath))
//				{					
//					Log.debug("该版本仓库连接已被使用:" + newVerReposPath); 
//					Log.debug("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " verReposPath1=" + verReposURI1); 
//					return true;
//				}
//			}
			
			//检查是否与本地仓库使用了相同的URI
			String localVerReposURI = Path.getLocalVerReposPath(repos,true);
			if(localVerReposURI != null && !localVerReposURI.isEmpty())
			{
				if(isPathConflict(localVerReposURI,newVerReposPath))
				{					
					Log.debug("该版本仓库连接已被使用:" + newVerReposPath); 
					Log.debug("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " localVerReposPath=" + localVerReposURI); 
					return true;
				}
			}
			
			String localVerReposURI1 = Path.getLocalVerReposPath(repos,false);
			if(localVerReposURI1 != null && !localVerReposURI1.isEmpty())
			{
				if(isPathConflict(localVerReposURI1,newVerReposPath))
				{					
					Log.debug("该版本仓库连接已被使用:" + newVerReposPath); 
					Log.debug("newVerReposPath duplicated: repos id="+repos.getId() + " name="+ repos.getName() + " localVerReposURI1=" + localVerReposURI1); 
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
			Log.debug("addRepos() path:" + path + " not exists, do create it!");
			if(reposRootDir.mkdirs() == false)
			{
				rt.setError("创建仓库目录失败:" + path);
				return false;	
			}
		}
		
		String reposDir = Path.getReposPath(repos);
		if(FileUtil.createDir(reposDir) == true)
		{
			if(FileUtil.createDir(reposDir+"data/") == false)
			{
				rt.setError("创建data目录失败");
				return false;
			}
			else
			{
				if(FileUtil.createDir(reposDir+"data/rdata/") == false)
				{
					rt.setError("创建rdata目录失败");
					return false;
				}
				if(FileUtil.createDir(reposDir+"data/vdata/") == false)
				{
					rt.setError("创建vdata目录失败");
					return false;
				}
			}
			
			if(FileUtil.createDir(reposDir+"refData/") == false)
			{
				rt.setError("创建refData目录失败");
				return false;
			}
			else
			{
				if(FileUtil.createDir(reposDir+"refData/rdata/") == false)
				{
					rt.setError("创建refData/rdata目录失败");
					return false;
				}
				if(FileUtil.createDir(reposDir+"refData/vdata/") == false)
				{
					rt.setError("创建refData/vdata目录失败");
					return false;
				}
			}
			
			if(FileUtil.createDir(reposDir+"tmp/") == false)
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
			if(FileUtil.createDir(reposRealDocDir) == false)
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
    	deleteIndexLib(repos,0);
		deleteIndexLib(repos,1);
    	deleteIndexLib(repos,2);
		
		return true;
	}

	protected void deleteReposLocalDir(Repos repos) {
		String reposDir = Path.getReposPath(repos);
		FileUtil.delDir(reposDir);
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
			String localVerReposDir = localVerReposPath + Path.getVerReposName(repos,isRealDoc);
			FileUtil.delDir(localVerReposDir);
		}
		
	}
	
	private String createLocalVerRepos(Repos repos, boolean isRealDoc, ReturnAjax rt) {
		Log.debug("createLocalVerRepos isRealDoc:"+isRealDoc);	
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
		Log.debug("createGitLocalRepos isRealDoc:"+isRealDoc);	

		String localVerRepos = Path.getLocalVerReposPath(repos, isRealDoc);
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
		Log.debug("createSvnLocalRepos isRealDoc:"+isRealDoc);	
		
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
			localPath = Path.getDefaultLocalVerReposPath(path);
		}
	
		String reposName = Path.getVerReposName(repos,isRealDoc);
		
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
		String path = Path.getReposRealPath(newReposInfo);
		String oldPath = Path.getReposRealPath(reposInfo);
		if(!path.equals(oldPath))
		{
			if(path.isEmpty())
			{
				path = Path.getReposRealPath(newReposInfo);
			}
			Log.debug("ChangeReposRealDocPath oldPath:" + oldPath + " newPath:" + path);
			
			if(login_user.getType() != 2)
			{
				Log.debug("普通用户无权修改仓库存储位置，请联系管理员！");
				rt.setError("普通用户无权修改仓库存储位置，请联系管理员！");
				return false;							
			}
			
			//如果目标目录已存在则不复制
			File newDir = new File(path);
			if(!newDir.exists())
			{
				if(FileUtil.copyFileOrDir(oldPath, path,true) == false)
				{
					Log.debug("文件目录迁移失败！");
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
			Log.debug("ChangeReposPath oldPath:" + oldPath + " newPath:" + path);
			
			if(login_user.getType() != 2)
			{
				Log.debug("普通用户无权修改仓库存储位置，请联系管理员！");
				rt.setError("普通用户无权修改仓库存储位置，请联系管理员！");
				return false;							
			}
			
			//newReposRootDir	
			File newReposRootDir = new File(path);
			if(newReposRootDir.exists() == false)
			{
				Log.debug("ChangeReposPath() path:" + path + " not exists, do create it!");
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
				if(path.indexOf(oldPath) == 0)
				{
					Log.debug("禁止将仓库目录迁移到仓库的子目录中！");
					rt.setError("修改仓库位置失败：禁止迁移到本仓库的子目录");	
					return false;
				}
				
				//注意：即使目录已存在也会被强制覆盖
				if(FileUtil.copyFileOrDir(oldPath+reposName, path+reposName,true) == false)
				{
					Log.debug("仓库目录迁移失败！");
					rt.setError("仓库目录迁移失败！");					
					return false;
				}
				else
				{
					FileUtil.delFileOrDir(oldPath+reposName);
				}
				
				//迁移版本仓库目录
				FileUtil.createDir(path + "DocSysVerReposes");
				String oldVerReposPath = oldPath + "DocSysVerReposes/" + reposName + "_GIT_RRepos";
				String newVerReposPath = path + "DocSysVerReposes/" + reposName + "_GIT_RRepos";				
				if(FileUtil.copyFileOrDir(oldVerReposPath, newVerReposPath, false) == false)
				{
					Log.info("仓库版本目录迁移失败: oldVerReposPath:" + oldVerReposPath + " newVerReposPath:" + newVerReposPath);
					rt.setDebugLog("仓库版本目录迁移失败: oldVerReposPath:" + oldVerReposPath + " newVerReposPath:" + newVerReposPath);					
				}
				oldVerReposPath = oldPath + "DocSysVerReposes/" + reposName + "_GIT_VRepos";
				newVerReposPath = path + "DocSysVerReposes/" + reposName + "_GIT_VRepos";				
				if(FileUtil.copyFileOrDir(oldVerReposPath, newVerReposPath, false) == false)
				{
					Log.info("仓库版本目录迁移失败: oldVerReposPath:" + oldVerReposPath + " newVerReposPath:" + newVerReposPath);
					rt.setDebugLog("仓库版本目录迁移失败: oldVerReposPath:" + oldVerReposPath + " newVerReposPath:" + newVerReposPath);					
				}
				oldVerReposPath = oldPath + "DocSysVerReposes/" + reposName + "_SVN_RRepos";
				newVerReposPath = path + "DocSysVerReposes/" + reposName + "_SVN_RRepos";				
				if(FileUtil.copyFileOrDir(oldVerReposPath, newVerReposPath, false) == false)
				{
					Log.info("仓库版本目录迁移失败: oldVerReposPath:" + oldVerReposPath + " newVerReposPath:" + newVerReposPath);
					rt.setDebugLog("仓库版本目录迁移失败: oldVerReposPath:" + oldVerReposPath + " newVerReposPath:" + newVerReposPath);					
				}
				oldVerReposPath = oldPath + "DocSysVerReposes/" + reposName + "_SVN_VRepos";
				newVerReposPath = path + "DocSysVerReposes/" + reposName + "_SVN_VRepos";				
				if(FileUtil.copyFileOrDir(oldVerReposPath, newVerReposPath, false) == false)
				{
					Log.info("仓库版本目录迁移失败: oldVerReposPath:" + oldVerReposPath + " newVerReposPath:" + newVerReposPath);
					rt.setDebugLog("仓库版本目录迁移失败: oldVerReposPath:" + oldVerReposPath + " newVerReposPath:" + newVerReposPath);					
				}
				
				//迁移远程存储GIT目录
				oldVerReposPath = oldPath + "DocSysVerReposes/" + reposName + "_GIT_RemoteStorage";
				newVerReposPath = path + "DocSysVerReposes/" + reposName + "_GIT_RemoteStorage";				
				if(FileUtil.copyFileOrDir(oldVerReposPath, newVerReposPath, false) == false)
				{
					Log.info("仓库版本目录迁移失败: oldVerReposPath:" + oldVerReposPath + " newVerReposPath:" + newVerReposPath);
					rt.setDebugLog("仓库版本目录迁移失败: oldVerReposPath:" + oldVerReposPath + " newVerReposPath:" + newVerReposPath);					
				}
				
				//迁移远程备份GIT目录
				oldVerReposPath = oldPath + "DocSysVerReposes/" + reposName + "_GIT_RemoteBackup";
				newVerReposPath = path + "DocSysVerReposes/" + reposName + "_GIT_RemoteBackup";				
				if(FileUtil.copyFileOrDir(oldVerReposPath, newVerReposPath, false) == false)
				{
					Log.info("仓库版本目录迁移失败: oldVerReposPath:" + oldVerReposPath + " newVerReposPath:" + newVerReposPath);
					rt.setDebugLog("仓库版本目录迁移失败: oldVerReposPath:" + oldVerReposPath + " newVerReposPath:" + newVerReposPath);					
				}
				
				//迁移索引仓库
				FileUtil.createDir(path + "DocSysLucene");
				String oldIndexLibPath = oldPath + "DocSysLucene/" + "repos_" + reposName + "_DocName";
				String newIndexLibPath = path + "DocSysLucene/"  + "repos_" + reposName + "_DocName";				
				if(FileUtil.copyFileOrDir(oldVerReposPath, newVerReposPath, false) == false)
				{
					Log.info("仓库索引目录迁移失败: oldIndexLibPath:" + oldIndexLibPath + " newIndexLibPath:" + newIndexLibPath);
					rt.setDebugLog("仓库索引目录迁移失败: oldIndexLibPath:" + oldIndexLibPath + " newIndexLibPath:" + newIndexLibPath);					
				}
				oldIndexLibPath = oldPath + "DocSysLucene/" + "repos_" + reposName + "_RDoc";
				newIndexLibPath = path + "DocSysLucene/"  + "repos_" + reposName + "_RDoc";				
				if(FileUtil.copyFileOrDir(oldVerReposPath, newVerReposPath, false) == false)
				{
					Log.info("仓库索引目录迁移失败: oldIndexLibPath:" + oldIndexLibPath + " newIndexLibPath:" + newIndexLibPath);
					rt.setDebugLog("仓库索引目录迁移失败: oldIndexLibPath:" + oldIndexLibPath + " newIndexLibPath:" + newIndexLibPath);					
				}
				oldIndexLibPath = oldPath + "DocSysLucene/" + "repos_" + reposName + "_VDoc";
				newIndexLibPath = path + "DocSysLucene/"  + "repos_" + reposName + "_VDoc";				
				if(FileUtil.copyFileOrDir(oldVerReposPath, newVerReposPath, false) == false)
				{
					Log.info("仓库索引目录迁移失败: oldIndexLibPath:" + oldIndexLibPath + " newIndexLibPath:" + newIndexLibPath);
					rt.setDebugLog("仓库索引目录迁移失败: oldIndexLibPath:" + oldIndexLibPath + " newIndexLibPath:" + newIndexLibPath);					
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
		Log.debug("doGet file_name:" + file_name);
		//解决空格问题
		response.setHeader("content-disposition", "attachment;filename=\"" + file_name +"\"");
		
		try {
			//创建输出流
			OutputStream out = response.getOutputStream();
			out.write(data, 0, data.length);		
			//关闭输出流
			out.close();	
		}catch (Exception e) {
			Log.info(e);
			Log.debug("sendDataToWebPage() Exception");
		}
	}
	
	protected int getLocalEntryType(String localParentPath, String entryName) {
		
		File entry = new File(localParentPath,entryName);
		if(!entry.exists())
		{
			Log.debug("getLocalEntryType() Failed: " + localParentPath + entryName + " 不存在 ！");
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

		Log.debug("getLocalEntryType() Failed: 未知文件类型！");
		return -1;
	}
	
	protected void sendTargetToWebPageEx(Repos repos, String targetPath, String targetName, ReturnAjax rt,HttpServletResponse response, HttpServletRequest request, Integer deleteFlag, String disposition) throws Exception 
	{	
		if(repos == null)	//表明这是一个虚拟仓库，targetPath可以直接作为临时目录
		{
			sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false, null);				
		}
		else
		{
			if(repos.encryptType == null || repos.encryptType == 0)
			{
				String tmpDir = targetPath;
				if(deleteFlag == null || deleteFlag == 0)	//targetPath不是临时目录，不能用于目录压缩
				{
					tmpDir = Path.getReposTmpPathForDownload(repos);			
				}
				sendTargetToWebPage(targetPath, targetName, tmpDir, rt, response, request,false, null);
			}
			else
			{
				if(deleteFlag != null && deleteFlag == 1)	//临时文件和目录可以直接加密
				{
					decryptFileOrDir(repos, targetPath, targetName);					
					sendTargetToWebPage(targetPath, targetName, targetPath, rt, response, request,false, null);
				}
				else
				{
					String tmpTargetPath = Path.getReposTmpPathForDecrypt(repos);
					String tmpTargetName = targetName;
					if(tmpTargetName == null || tmpTargetName.isEmpty())
					{
						tmpTargetName = repos.getName(); //用仓库名作为下载名字
					}
					FileUtil.copyFileOrDir(targetPath + targetName,  tmpTargetPath + tmpTargetName, true);
					decryptFileOrDir(repos, tmpTargetPath, tmpTargetName);
					sendTargetToWebPage(tmpTargetPath, tmpTargetName, tmpTargetPath, rt, response, request,false, null);
					//tmpDirForDecrypt need to delete
					FileUtil.delDir(tmpTargetPath);
				}
			}
		}
		
		if(deleteFlag != null && deleteFlag == 1)
		{
			FileUtil.delFileOrDir(targetPath+targetName);
		}
	}
	
	protected void sendTargetToWebPage(String localParentPath, String targetName, String tmpDir, ReturnAjax rt,HttpServletResponse response, HttpServletRequest request, boolean deleteEnable, String disposition) throws Exception 
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
			
			sendFileToWebPage(tmpDir,zipFileName,rt,response, request, disposition); 
			
			//Delete zip file
			FileUtil.delFile(tmpDir+zipFileName);
		}
		else	//for File
		{
			//Send the file to webPage
			sendFileToWebPage(localParentPath,targetName,rt, response, request, disposition); 			
		}
		
		if(deleteEnable)
		{
			//Delete target file or dir
			FileUtil.delFileOrDir(localParentPath+targetName);
		}
	}
	
	protected void sendFileToWebPage(String localParentPath, String file_name,  ReturnAjax rt,HttpServletResponse response,HttpServletRequest request, String disposition) throws Exception{
		String suffix = FileUtil.getFileSuffix(file_name);
		switch(suffix)
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
		case "mp3":
			sendVideoFileToWebPage(localParentPath, file_name, file_name, suffix, rt, response, request, disposition);
			break;
		case "svg":
			sendSvgFileToWebPage(localParentPath, file_name, file_name, rt, response, request, disposition);
			break;
		default:
			sendFileToWebPage(localParentPath, file_name, file_name, rt, response, request, disposition);
			break;
		}
	}
	
	protected void sendSvgFileToWebPage(String localParentPath, String fileName, String showName, ReturnAjax rt,HttpServletResponse response,HttpServletRequest request, String disposition) throws Exception{	
		String dstPath = localParentPath + fileName;

		//检查文件是否存在
		File file = new File(dstPath);
		if(!file.exists())
		{	
			docSysErrorLog("文件  "+ dstPath + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}

		response.setHeader("Accept-Ranges", "bytes");
		
		Log.debug("sendFileToWebPage() showName befor convert:" + showName);
		showName = getFileNameForWeb(request, showName);
		if(disposition == null || disposition.isEmpty())
		{
			response.setHeader("content-disposition", "attachment;filename=\"" + showName +"\"");
		}
		else
		{
			response.setHeader("content-disposition", disposition + ";filename=\"" + showName +"\"");			
		}
		
		response.setContentType("image/svg+xml");

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
			
			in.close();
			in = null;
			out.close();
			out = null;
		}catch (Exception e) {
			if(in != null)
			{
				in.close();
			}
			if(out != null)
			{
				out.close();						
			}
			Log.info(e);
			Log.debug("sendFileToWebPage() Exception");
		}
	}

	
	protected void sendFileToWebPage(String localParentPath, String fileName, String showName, ReturnAjax rt,HttpServletResponse response,HttpServletRequest request, String disposition) throws Exception{
		
		String dstPath = localParentPath + fileName;

		//检查文件是否存在
		File file = new File(dstPath);
		if(!file.exists())
		{	
			docSysErrorLog("文件  "+ dstPath + " 不存在！", rt);
			writeJson(rt, response);
			return;
		}
		
		Log.debug("sendFileToWebPage() showName befor convert:" + showName);
		showName = getFileNameForWeb(request, showName);
		
		if(disposition == null || disposition.isEmpty())
		{
			response.setHeader("content-disposition", "attachment;filename=\"" + showName +"\"");
		}
		else
		{
			response.setHeader("content-disposition", disposition + ";filename=\"" + showName +"\"");			
		}

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
			
			in.close();
			in = null;
			out.close();
			out = null;
		}catch (Exception e) {
			if(in != null)
			{
				in.close();
			}
			if(out != null)
			{
				out.close();						
			}
			Log.info(e);
			Log.debug("sendFileToWebPage() Exception");
		}
	}
	
    //获取UserAgent接口，即判断目前用户使用了哪种浏览器
	private String getFileNameForWeb(HttpServletRequest request, String showName) throws UnsupportedEncodingException {
		//解决中文编码问题
		String userAgent = getUA(request);
		switch(userAgent)
		{
		case "ie":
		case "safari":
			showName = URLEncoder.encode(showName, "UTF-8");  
			Log.debug("sendFileToWebPage() showName after URL Encode:" + showName);
			break;
		default:
			showName = new String(showName.getBytes("UTF-8"),"ISO8859-1");  
			Log.debug("sendFileToWebPage() showName after convert to ISO8859-1:" + showName);
			break;
		}

		//解决空格问题（空格变加号和兼容性问题）
		//showName = showName.replaceAll("\\+", "%20").replaceAll("%28", "\\(").replaceAll("%29", "\\)").replaceAll("%3B", ";").replaceAll("%40", "@").replaceAll("%23", "\\#").replaceAll("%26", "\\&");
		showName = showName.replaceAll("%28", "\\(").replaceAll("%29", "\\)").replaceAll("%3B", ";").replaceAll("%40", "@").replaceAll("%23", "\\#").replaceAll("%26", "\\&");
		Log.debug("sendFileToWebPage() showName:" + showName);
		return showName;
	}

	protected String getUA(HttpServletRequest request){
	     String scan = request.getHeader("User-Agent").toLowerCase();
	     //document.write(scan);
	     if(scan.indexOf("MSIE") > -1 || scan.indexOf("LIKE GECKO") > -1 || scan.indexOf("/Trident/i") > -1)
	         return "ie"; //判断是否是ie浏览器，包括最新的ie11浏览器
	     else if(scan.indexOf("Chrome") > -1 )
	         return "chrome";//Chrome Browser
	     else if(scan.indexOf("iPhone") > -1 || scan.indexOf("Mac") > -1 || 
	             scan.indexOf("iPad") > -1)
	         return "safari";//safari Browser
	     else if(scan.indexOf("vivo") > -1)
	         return "vivo";
	     else if(scan.indexOf("XiaoMi") > -1)
	         return "xiaomi";
	     else if(scan.indexOf("Edge") > -1)
	         return "edge";
	     else if(scan.indexOf("Opera") > -1)
	         return "opera";
	     else if(scan.indexOf("Firefox") > -1)
	         return "firefox";
	     else 
	         return "other";
	 }
		
	protected void sendVideoFileToWebPage(String localParentPath, String fileName, String showName, String videoType, 
			ReturnAjax rt,
			HttpServletResponse response,HttpServletRequest request, 
			String disposition) throws Exception{
		String dstPath = localParentPath + fileName;
		BufferedInputStream bis = null;
		try {
			//检查文件是否存在
			File file = new File(dstPath);
			if (file.exists()) {
				long p = 0L;
				long toLength = 0L;
				long contentLength = 0L;
				int rangeSwitch = 0; // 0,从头开始的全文下载；1,从某字节开始的下载（bytes=27000-）；2,从某字节开始到某字节结束的下载（bytes=27000-39000）
				long fileLength;
				String rangBytes = "";
				fileLength = file.length();
 
				// get file content
				InputStream ins = new FileInputStream(file);
				bis = new BufferedInputStream(ins);
 
				// tell the client to allow accept-ranges
				response.reset();
				response.setHeader("Accept-Ranges", "bytes");
 
				// client requests a file block download start byte
				String range = request.getHeader("Range");
				if (range != null && range.trim().length() > 0 && !"null".equals(range)) {
					response.setStatus(javax.servlet.http.HttpServletResponse.SC_PARTIAL_CONTENT);
					rangBytes = range.replaceAll("bytes=", "");
					if (rangBytes.endsWith("-")) { // bytes=270000-
						rangeSwitch = 1;
						p = Long.parseLong(rangBytes.substring(0, rangBytes.indexOf("-")));
						contentLength = fileLength - p; // 客户端请求的是270000之后的字节（包括bytes下标索引为270000的字节）
					} else { // bytes=270000-320000
						rangeSwitch = 2;
						String temp1 = rangBytes.substring(0, rangBytes.indexOf("-"));
						String temp2 = rangBytes.substring(rangBytes.indexOf("-") + 1, rangBytes.length());
						p = Long.parseLong(temp1);
						toLength = Long.parseLong(temp2);
						contentLength = toLength - p + 1; // 客户端请求的是 270000-320000 之间的字节
					}
				} else {
					contentLength = fileLength;
				}
 
				// 如果设设置了Content-Length，则客户端会自动进行多线程下载。如果不希望支持多线程，则不要设置这个参数。
				// Content-Length: [文件的总大小] - [客户端请求的下载的文件块的开始字节]
				response.setHeader("Content-Length", new Long(contentLength).toString());
 
				// 断点开始
				// 响应的格式是:
				// Content-Range: bytes [文件块的开始字节]-[文件的总大小 - 1]/[文件的总大小]
				if (rangeSwitch == 1) {
					String contentRange = new StringBuffer("bytes ").append(new Long(p).toString()).append("-")
							.append(new Long(fileLength - 1).toString()).append("/")
							.append(new Long(fileLength).toString()).toString();
					response.setHeader("Content-Range", contentRange);
					bis.skip(p);
				} else if (rangeSwitch == 2) {
					String contentRange = range.replaceAll("=", " ") + "/" + new Long(fileLength).toString();
					response.setHeader("Content-Range", contentRange);
					bis.skip(p);
				} else {
					String contentRange = new StringBuffer("bytes ").append("0-").append(fileLength - 1).append("/")
							.append(fileLength).toString();
					response.setHeader("Content-Range", contentRange);
				}
 
				//response.setContentType("application/octet-stream");
				response.setContentType("video/" + videoType);
				showName = getFileNameForWeb(request, showName);
				response.addHeader("Content-Disposition", "attachment;filename=" + showName);
 
				OutputStream out = response.getOutputStream();
				int n = 0;
				long readLength = 0;
				int bsize = 1024;
				byte[] bytes = new byte[bsize];
				if (rangeSwitch == 2) {
					// 针对 bytes=27000-39000 的请求，从27000开始写数据
					while (readLength <= contentLength - bsize) {
						n = bis.read(bytes);
						readLength += n;
						out.write(bytes, 0, n);
					}
					if (readLength <= contentLength) {
						n = bis.read(bytes, 0, (int) (contentLength - readLength));
						out.write(bytes, 0, n);
					}
				} else {
					while ((n = bis.read(bytes)) != -1) {
						out.write(bytes, 0, n);
					}
				}
				out.flush();
				out.close();
				bis.close();
			}
		} catch (IOException ie) {
			// 忽略 ClientAbortException 之类的异常
		} catch (Exception e) {
			Log.info(e);
		}
	}

	protected boolean doCompressDir(String srcParentPath, String dirName, String dstParentPath, String zipFileName,ReturnAjax rt) {
		
		//if dstDir not exists create it
		File dstDir = new File(dstParentPath);
		if(!dstDir.exists())
		{
			if(FileUtil.createDir(dstParentPath) == false)
			{
				docSysDebugLog("doCompressDir() Failed to create:" + dstParentPath, rt);
				return false;
			}
		}
		//开始压缩
		if(FileUtil.compressWithZip(srcParentPath + dirName,dstParentPath + zipFileName) == true)
		{
			Log.debug("压缩完成！");	
		}
		else
		{
			Log.debug("doCompressDir()  压缩失败！");
			docSysDebugLog("压缩  " + srcParentPath + dirName + "to" + dstParentPath + zipFileName  +" 失败", rt);
			return false;
		}
		
		return true;
	}
		
	/***************************Basic Functions For Driver Level  **************************/
	public User getLoginUser(HttpSession session, HttpServletRequest request, HttpServletResponse response, ReturnAjax rt)
	{
		User user = (User) session.getAttribute("login_user");
		if(user == null)
		{
			//尝试自动登录
			Cookie c1 = getCookieByName(request, "dsuser");
			Cookie c2 = getCookieByName(request, "dstoken");
			if(c1 != null && c2 !=null && c1.getValue()!= null && c2.getValue() != null && !c1.getValue().isEmpty() && !c2.getValue().isEmpty())
			{
				Log.debug("自动登录");
				String userName = URLDecode(c1.getValue());
				String pwd = c2.getValue();

				User loginUser = loginCheck(userName, pwd, request, session, response, rt);
				if(loginUser == null)
				{
					Log.debug("自动登录失败");
					rt.setMsgData("自动登陆失败");
					writeJson(rt, response);
					return null;
				}
				
				Log.debug("自动登录成功");
				//Set session
				session.setAttribute("login_user", loginUser);
				//延长cookie的有效期
				String encUserName = URLEncode(userName);
				addCookie(response, "dsuser", encUserName, 7*24*60*60);//一周内免登录
				addCookie(response, "dstoken", pwd, 7*24*60*60);
				Log.debug("用户cookie保存成功");
				Log.debug("SESSION ID:" + session.getId());

				rt.setData(loginUser);	//将数据库取出的用户信息返回至前台
				writeJson(rt, response);
				return null;
			}
			else
			{
				rt.setError("用户未登录");
				writeJson(rt, response);
				return null;
			}
		}
		return user;
	}
	
	protected String URLEncode(String str) 
	{
		if(str == null || str.isEmpty())
		{
			return str;
		}
		
		String encStr = null;
		try {
			encStr = URLEncoder.encode(str, "utf-8");
		} catch (UnsupportedEncodingException e) {
			errorLog(e);
		}
		return encStr;
	}
	
	protected String URLDecode(String encStr) 
	{
		if(encStr == null || encStr.isEmpty())
		{
			return encStr;
		}
		
		String str = null;
		try {
			str = URLDecoder.decode(encStr, "utf-8");
		} catch (UnsupportedEncodingException e) {
			errorLog(e);
		}
		return str;
	}
	
	protected User loginCheck(String userName, String pwd, HttpServletRequest request, HttpSession session, HttpServletResponse response, ReturnAjax rt) {
		User tmp_user = new User();
		tmp_user.setName(userName);
		String decodedPwd = Base64Util.base64Decode(pwd);
		Log.debug("loginCheck decodedPwd:" + decodedPwd);
		String md5Pwd = MD5.md5(decodedPwd);
		tmp_user.setPwd(pwd);
		
		if(systemLdapConfig.enabled == false || systemLdapConfig.url == null || systemLdapConfig.url.isEmpty())
		{
			List<User> uLists = getUserList(userName,md5Pwd);
			boolean ret = loginCheck(rt, tmp_user, uLists, session,response);
			if(ret == false)
			{
				Log.info("loginCheck() 登录失败");
				return null;
			}
			return uLists.get(0);
		}
		
		//LDAP模式
		Log.info("loginCheck() LDAP Mode"); 
		User ldapLoginUser = ldapLoginCheck(userName, decodedPwd);
		if(ldapLoginUser == null) //LDAP 登录失败（尝试用数据库方式登录）
		{
			Log.info("loginCheck() ldapLoginCheck login failed, try traditional mode");
			List<User> uLists = getUserList(userName,md5Pwd);
			boolean ret = loginCheck(rt, tmp_user, uLists, session,response);
			if(ret == false)
			{
				Log.info("loginCheck() 登录失败");
				return null;
			}
			return uLists.get(0);
		}
		
		//获取数据库用户
		User dbUser = getUserByName(userName);
		if(dbUser == null)
		{
			//Add LDAP User into DB
			if(checkSystemUsersCount(rt) == false)
			{
				Log.info("loginCheck() checkSystemUsersCount Failed!");	
				return null;			
			}
			
			//For User added by LDAP login no need to check tel and email
			if(userCheck(ldapLoginUser, false, false, rt) == false)
			{
				Log.info("loginCheck() userCheck Failed!");			
				return null;			
			}

			ldapLoginUser.setPwd(md5Pwd); //密码也存入DB
			ldapLoginUser.setCreateType(10);	//用户为LDAP登录添加

			//set createTime
			SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
			String createTime = df.format(new Date());// new Date()为获取当前系统时间
			ldapLoginUser.setCreateTime(createTime);	//设置川剧时间

			if(userService.addUser(ldapLoginUser) == 0)
			{
				docSysErrorLog("Failed to add new User in DB", rt);
			}
			return ldapLoginUser;
		}
		
		//登录的用户名字和邮箱总是以LDAP的为准
		dbUser.setRealName(ldapLoginUser.getRealName());
		dbUser.setEmail(ldapLoginUser.getEmail());
		return dbUser;
	}
	
	public User getUserByName(String name)
	{
		User user = new User();
		user.setName(name);
		List<User> uList = userService.getUserListByUserInfo(user);
		if(uList == null || uList.size() == 0)
		{
			return null;
		}
		
		return uList.get(0);
	}
	
	public User ldapLoginCheck(String userName, String pwd)
	{
		LdapContext ctx = getLDAPConnection(userName, pwd, systemLdapConfig);
		if(ctx == null)
		{
			Log.debug("ldapLoginCheck() getLDAPConnection 失败"); 
			return null;
		}
		
		String filter = systemLdapConfig.filter;
		Log.info("getLDAPConnection() filter:" + filter);       		
		
		List<User> list = readLdap(ctx, systemLdapConfig.basedn, filter, systemLdapConfig.loginMode, userName);
		
		try {
			ctx.close();
		} catch (NamingException e) {
			Log.info(e);
		}
		
		Log.printObject("ldapLoginCheck() list:", list);
		if(list == null || list.size() != 1)
		{
			Log.debug("ldapLoginCheck() readLdap 失败"); 			
			return null;
		}
		
		return list.get(0);
	}
	
	//获取LDAP Server支持的SASL鉴权机制列表
    public static void getListOfSASLMechanisms(LDAPConfig ldapConfig)
    {
    	Log.info("getListOfSASLMechanisms()");
    	try {
	    	// Create initial context
	    	DirContext ctx = new InitialDirContext();
	
	    	// Read supportedSASLMechanisms from root DSE
			Attributes attrs = ctx.getAttributes(ldapConfig.url, new String[]{"supportedSASLMechanisms"});	
			
			Log.info("getListOfSASLMechanisms() supportedSASLMechanisms:" + attrs.get("supportedSASLMechanisms"));
		} catch (Exception e) {
			Log.info("getListOfSASLMechanisms() get supportedSASLMechanisms failed");
			Log.debug(e);
		}
    }
	
	/**
     * 获取默认LDAP连接     * Exception 则登录失败，ctx不为空则登录成功
     * ldapConfig中同时设置了userAccount以及userPassword，则使用userAccount和userPassword进行密码校验并获取ctx，只设置了userAccount则不进行密码校验直接获取ctx，userAccount是DN表达式
     * ldapConfig没有指定userAccount，则根据userName来进行校验和登录，userName为空则使用basedn的ctx，userName非空则使用loginMode=userName,basedn进行登录校验并获取ctx（authMode=1才校验密码，密码为pwd）
     * @return LdapContext
     */
    public LdapContext getLDAPConnection(String userName, String pwd, LDAPConfig ldapConfig) 
    {
        if(ldapConfig.enabled == null || ldapConfig.enabled == false)
		{
			errorLog("getLDAPConnection() ldapConfig.enable is " + ldapConfig.enabled);
			return null;
		}
				
		String LDAP_URL = ldapConfig.url;
		if(LDAP_URL == null || LDAP_URL.isEmpty())
		{
			Log.debug("getLDAPConnection LDAP_URL is null or empty, LDAP_URL:" + LDAP_URL);
			return null;
		}
		Log.debug("getLDAPConnection LDAP_URL:" + LDAP_URL);
		
		String authentication = ldapConfig.authentication;
		if(authentication == null || authentication.isEmpty())
		{
			authentication = "simple";
		}
		Log.debug("getLDAPConnection authentication:" + authentication);
		
		String PRINCIPAL = null;
		String CREDENTIALS = null;
        if(ldapConfig.userAccount != null && ldapConfig.userAccount.isEmpty() == false)
        {
        	PRINCIPAL = ldapConfig.userAccount;
        	if(ldapConfig.userPassword != null && ldapConfig.userPassword.isEmpty() == false)
        	{
        		CREDENTIALS = ldapConfig.userPassword;
        	}
        }
        else
        {
        	String basedn = ldapConfig.basedn;
    		Log.info("getLDAPConnection() basedn:" + basedn);    		
            
    		String loginMode = ldapConfig.loginMode;
    		Log.info("getLDAPConnection() loginMode:" + loginMode);   
    		
    		//userName为空则只获取LDAP basedn的ctx，不进行用户校验
            if(userName == null || userName.isEmpty())
    		{
            	PRINCIPAL = basedn;
    		}
            else
            {
            	PRINCIPAL = loginMode + "=" + userName + "," + basedn;     
            	Log.debug("getLDAPConnection() PRINCIPAL:" + PRINCIPAL);    			
            	
            	Log.debug("getLDAPConnection() authMode:" + ldapConfig.authMode); 
    			if(ldapConfig.authMode != null && ldapConfig.authMode != 0)
    			{
    				CREDENTIALS = pwd;
    			}
    		}	
        }
		
		switch(authentication)
		{
		case "none":
			return getLDAPConnection_Anonymous(ldapConfig);
		case "simple":
			return getLDAPConnection_Simple(PRINCIPAL, CREDENTIALS, ldapConfig);
		case "DIGEST-MD5":
			return getLDAPConnection_DigestMD5(PRINCIPAL, CREDENTIALS, ldapConfig);
		case "EXTERNAL":	
			return getLDAPConnection_External(ldapConfig);
		case "CRAM-MD5":
			return getLDAPConnection_CramMD5(PRINCIPAL, CREDENTIALS, ldapConfig);
		case "GSSAPI":
			return getLDAPConnection_Gssapi(ldapConfig);
		default:
			return getLDAPConnection_General(PRINCIPAL, CREDENTIALS, ldapConfig);
		}
    }
    
    private LdapContext getLDAPConnection_General(String PRINCIPAL, String CREDENTIALS, LDAPConfig ldapConfig) {
        LdapContext ctx = null;
    	try {
    		Hashtable<String, Object> HashEnv = new Hashtable<String,Object>();
            HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
            
            HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
            
            HashEnv.put(Context.PROVIDER_URL, ldapConfig.url);

    		HashEnv.put(Context.SECURITY_AUTHENTICATION, ldapConfig.authentication); // LDAP访问安全级别(none,simple,strong)

            HashEnv.put(Context.SECURITY_PRINCIPAL, PRINCIPAL);
            if(CREDENTIALS != null)
            {
            	HashEnv.put(Context.SECURITY_CREDENTIALS, CREDENTIALS);
            }
            
            ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
		} catch (AuthenticationException e) {
			Log.info(e);
		} catch (CommunicationException e) {
			Log.info(e);
		} catch (Exception e) {
			Log.info(e);
		}
    	
        return ctx;
	}

	private LdapContext getLDAPConnection_Gssapi(LDAPConfig ldapConfig) {
    	//Log in (to Kerberos)
    	LoginContext lc = LdapGssAuth.login(ldapConfig);
    	if(lc == null)
    	{
    		Log.info("getLDAPConnection_Gssapi() LdapGssAuth.login failed");
    		return null;
    	}
    	//Get ldap ctx
    	LdapJndiAction jndiAction = new LdapJndiAction(ldapConfig);
    	Subject.doAs(lc.getSubject(), jndiAction);
    	return jndiAction.ctx;
	}

	private LdapContext getLDAPConnection_CramMD5(String PRINCIPAL, String CREDENTIALS, LDAPConfig ldapConfig) {
        LdapContext ctx = null;
    	try {
    		Hashtable<String, Object> HashEnv = new Hashtable<String,Object>();
            HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
            
            HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
            
            HashEnv.put(Context.PROVIDER_URL, ldapConfig.url);
            
            HashEnv.put(Context.SECURITY_AUTHENTICATION, "CRAM-MD5");
            
    	    LdapCallbackHandler callbackHandler = new LdapCallbackHandler();
    	    callbackHandler.userName = PRINCIPAL;
    	    callbackHandler.userPwd = CREDENTIALS;	    
    	    HashEnv.put("java.naming.security.sasl.callback", callbackHandler);

            ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
		} catch (AuthenticationException e) {
			Log.info(e);
		} catch (CommunicationException e) {
			Log.info(e);
		} catch (Exception e) {
			Log.info(e);
		}
    	
        return ctx;
	}

	private LdapContext getLDAPConnection_External(LDAPConfig ldapConfig) {
        LdapContext ctx = null;
    	try {
    		Hashtable<String, Object> HashEnv = new Hashtable<String,Object>();
            HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
            
            HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
            
            HashEnv.put(Context.PROVIDER_URL, ldapConfig.url);

            HashEnv.put(Context.SECURITY_AUTHENTICATION, "EXTERNAL");

            HashEnv.put(Context.SECURITY_PROTOCOL, "ssl");
            
            ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
		} catch (AuthenticationException e) {
			Log.info(e);
		} catch (CommunicationException e) {
			Log.info(e);
		} catch (Exception e) {
			Log.info(e);
		}
    	
        return ctx;
	}

	private LdapContext getLDAPConnection_DigestMD5(String PRINCIPAL, String CREDENTIALS, LDAPConfig ldapConfig) {
        LdapContext ctx = null;
    	try {
    		Hashtable<String, Object> HashEnv = new Hashtable<String,Object>();
            HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
            
            HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
            
            HashEnv.put(Context.PROVIDER_URL, ldapConfig.url);

    		HashEnv.put(Context.SECURITY_AUTHENTICATION,  "DIGEST-MD5"); // LDAP访问安全级别(none,simple,strong)

            HashEnv.put(Context.SECURITY_PRINCIPAL, PRINCIPAL);
            if(CREDENTIALS != null)
            {
            	HashEnv.put(Context.SECURITY_CREDENTIALS, CREDENTIALS);
            }
            
            ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
		} catch (AuthenticationException e) {
			Log.info(e);
		} catch (CommunicationException e) {
			Log.info(e);
		} catch (Exception e) {
			Log.info(e);
		}
    	
        return ctx;
	}

	private LdapContext getLDAPConnection_Simple(String PRINCIPAL, String CREDENTIALS, LDAPConfig ldapConfig) {
        LdapContext ctx = null;
    	try {
    		Hashtable<String, Object> HashEnv = new Hashtable<String,Object>();
            HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
            
            HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
            
            HashEnv.put(Context.PROVIDER_URL, ldapConfig.url);

    		HashEnv.put(Context.SECURITY_AUTHENTICATION, "simple"); // LDAP访问安全级别(none,simple,strong)

            HashEnv.put(Context.SECURITY_PRINCIPAL, PRINCIPAL);
            if(CREDENTIALS != null)
            {
            	HashEnv.put(Context.SECURITY_CREDENTIALS, CREDENTIALS);
            }
            
            ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
		} catch (AuthenticationException e) {
			Log.info(e);
		} catch (CommunicationException e) {
			Log.info(e);
		} catch (Exception e) {
			Log.info(e);
		}
    	
        return ctx;
	}

    
    private LdapContext getLDAPConnection_Anonymous(LDAPConfig ldapConfig) {
        LdapContext ctx = null;
    	try {
    		Hashtable<String, Object> HashEnv = new Hashtable<String,Object>();
            HashEnv.put(Context.INITIAL_CONTEXT_FACTORY,"com.sun.jndi.ldap.LdapCtxFactory"); // LDAP工厂类
            
            HashEnv.put("com.sun.jndi.ldap.connect.timeout", "3000");//连接超时设置为3秒
            
            HashEnv.put(Context.PROVIDER_URL, ldapConfig.url);

    		HashEnv.put(Context.SECURITY_AUTHENTICATION, "none"); // LDAP访问安全级别(none,simple,strong)
            
            ctx =  new InitialLdapContext(HashEnv, null);//new InitialDirContext(HashEnv);// 初始化上下文	
		} catch (AuthenticationException e) {
			Log.info(e);
		} catch (CommunicationException e) {
			Log.info(e);
		} catch (Exception e) {
			Log.info(e);
		}
    	
        return ctx;
	}
    
	public List<User> readLdap(LdapContext ctx, String basedn, String filter, String loginMode, String userName){
		Log.debug("readLdap() basedn:" + basedn);
		if(ctx == null)
		{
			Log.info("readLdap() ctx is null");
			return null;
		}
		
		List<User> lm=new ArrayList<User>();
		try {
	        String[] attrPersonArray = { loginMode, "userPassword", "displayName", "cn", "sn", "mail", "description"};
            SearchControls searchControls = new SearchControls();//搜索控件
            searchControls.setSearchScope(SearchControls.SUBTREE_SCOPE);//搜索范围
            searchControls.setReturningAttributes(attrPersonArray);
            //1.要搜索的上下文或对象的名称；2.过滤条件，可为null，默认搜索所有信息；3.搜索控件，可为null，使用默认的搜索控件
            if(userName != null && userName.isEmpty() == false)
            {
            	filter = "(&" + filter + "("+ loginMode + "=" + userName + ")" + ")";
            }
            Log.debug("readLdap() filter:" + filter);
            
            NamingEnumeration<SearchResult> answer = ctx.search(basedn, filter, searchControls);
            while (answer.hasMore()) {
                SearchResult result = (SearchResult) answer.next();
                NamingEnumeration<? extends Attribute> attrs = result.getAttributes().getAll();
                
                Log.debug("readLdap() userInfo:");
                User lu=new User();
                while (attrs.hasMore()) 
                {
                    Attribute attr = (Attribute) attrs.next();
                    Log.debug("readLdap() " + attr.getID() + " = " + attr.get().toString());
                    
                    if(loginMode.equals(attr.getID())){
                    	lu.setName(attr.get().toString());
                    } 
                    else if("userPassword".equals(attr.getID()))
                    {
                    	Object value = attr.get();
                    	lu.setPwd(new String((byte [])value));
                    }
                    //else if("displayName".equals(attr.getID())){
                    	//lu.setRealName(attr.get().toString());
                    //}
                    else if("cn".equals(attr.getID())){
                    	lu.setRealName(attr.get().toString());
                    }
                	//else if("sn".equals(attr.getID())){
                	//	//	lu.sn = attr.get().toString();
                	//}
                    else if("mail".equals(attr.getID())){
                    	lu.setEmail(attr.get().toString());
                    }
                    else if("description".equals(attr.getID())){
                    	lu.setIntro(attr.get().toString());
                    }
                }
                
                if(lu.getName() != null)
                {
                	lm.add(lu);
                }
            }
		}catch (Exception e) {
			Log.debug("获取用户信息异常:");
			Log.info(e);
		}
		 
		return lm;
	}
    
	/**
	 * 用户数据校验
	 * @param uLists 根据条件从数据库中查出的user列表
	 * @param rt 返回ajax信息的类
	 * @param session 
	 * @param localUser 前台传回的user信息，或者cookies中保存的用户信息
	 * @return
	 */
	public boolean loginCheck(ReturnAjax rt,User localUser, List<User> uLists,HttpSession session,HttpServletResponse response)
	{	
		if(uLists == null)
		{
			Log.debug("loginCheck() uLists is null");
			rt.setError("用户名或密码错误！");
			return false;	
		}
		else if(uLists.size()<1){
			Log.debug("loginCheck() uLists size < 1");
			rt.setError("用户名或密码错误！");
			return false;
		}
		
		Log.debug("loginCheck() uLists size:" + uLists.size());
		int systemUserCount = 0;
		for(int i = 0; i < uLists.size(); i++)
		{
			if(uLists.get(i).getCreateType() < 10)
			{
				systemUserCount ++;
				if(systemUserCount > 1)
				{
					break;
				}
			}
		}
		
		if(systemUserCount != 1)
		{
			Log.debug("loginCheck() 系统存在多个相同用户 systemUserCount:" + systemUserCount);
			rt.setError("用户名或密码错误！");
			//rt.setError("登录失败！");
			return false;
		}
		
		return true;
	}
	
	public boolean isFirstUserExists()
	{
		List<User> uList = userService.geAllUsers();
		if(uList == null || uList.size() == 0)
		{
			return false;
		}
		return true;
	}
	
	public boolean isFirstAdminUserExists()
	{
		User qUser = new User();
		qUser.setType(2); //超级管理员
		List<User> uList = userService.getUserListByUserInfo(qUser);
		if(uList == null || uList.size() == 0)
		{
			return false;
		}
		return true;
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
	
	protected List<User> getUserListOnPage(User user, Integer pageIndex, Integer pageSize, QueryResult queryResult) {
		HashMap<String, String> param = buildQueryParamForObj(user, pageIndex, pageSize);
		
		List <User> list = null;
		if(user != null)
		{
			Integer total = userService.getCountWithParamLike(param);
			queryResult.total = total;
			list = userService.getUserListWithParamLike(param);		
		}
		else
		{
			Integer total = userService.getCountWithParam(param);
			queryResult.total = total;
			list = userService.getUserListWithParam(param);
		}
		queryResult.result = list;
		return list;
	}
	
	protected List<User> getUserList(User user) {
		HashMap<String, String> param = buildQueryParamForObj(user, null, null);
		
		List <User> list = null;
		if(user != null)
		{
			list = userService.getUserListWithParamLike(param);		
		}
		else
		{
			list = userService.getUserListWithParam(param);
		}
		return list;
	}
	
	public boolean isUserNameUsed(String name)
	{
		User qUser = new User();
		qUser.setName(name);
		List <User> uList =  userService.getUserListByUserInfo(qUser);
		if(uList == null || uList.size() == 0)
		{
			return false;
		}
		return true;
	}
	
	public boolean isTelUsed(String tel)
	{
		User qUser = new User();
		qUser.setTel(tel);
		List <User> uList =  userService.getUserListByUserInfo(qUser);
		if(uList == null || uList.size() == 0)
		{
			return false;
		}
		
		for(int i=0; i < uList.size(); i++)
		{
			User user = uList.get(i);
			//创建类型<10为系统用户（10： LDAP登录添加的用户， 11：第三方登录添加的用户）
			if(user.getCreateType() < 10)
			{
				return true;
			}
		}
		
		return false;
	}
	
	public boolean isEmailUsed(String email)
	{
		User qUser = new User();
		qUser.setEmail(email);
		List <User> uList =  userService.getUserListByUserInfo(qUser);
		if(uList == null || uList.size() == 0)
		{
			return false;
		}
		
		for(int i=0; i < uList.size(); i++)
		{
			User user = uList.get(i);
			//创建类型<10为系统用户（10： LDAP登录添加的用户， 11：第三方登录添加的用户）
			if(user.getCreateType() < 10)
			{
				return true;
			}
		}
		
		return false;
	}
	
	protected boolean userCheck(User user, boolean emailCheckEn, boolean telCheckEn, ReturnAjax rt) {
		String userName = user.getName();
		String pwd = user.getPwd();
		String tel = user.getTel();
		String email = user.getEmail();
		Integer type = user.getType();
		
		Log.debug("userName:"+userName + " pwd:"+pwd + " type:" + type + " tel:" + user.getTel() + " email:" + user.getEmail());
		
		//检查用户名是否为空
		if(userName ==null||"".equals(userName))
		{
			docSysErrorLog("用户名不能为空！", rt);
			return false;
		}
		
		//用户是否已存在
		if(isUserNameUsed(userName) == true)
		{
			docSysErrorLog("该用户已存在！", rt);
			return false;
		}
		
		if(telCheckEn)
		{
			//如果用户使用手机号则需要检查手机号
			if(RegularUtil.IsMobliePhone(userName) == true)
			{
				if(isTelUsed(userName) == true)
				{
					docSysErrorLog("该手机已被使用！", rt);
					return false;				
				}
			}
		}
		
		if(emailCheckEn)
		{
			//如果用户使用邮箱则需要检查邮箱
			if(RegularUtil.isEmail(userName) == true)
			{
				if(isEmailUsed(userName) == true)
				{
					docSysErrorLog("该邮箱已被使用！", rt);
					return false;				
				}
			}	
		}
		
		if(telCheckEn)
		{
			if(tel != null && !tel.isEmpty())
			{
				if(RegularUtil.IsMobliePhone(tel) == false)
				{
					docSysErrorLog("手机格式错误！", rt);
					return false;
				}
				
				if(isTelUsed(tel) == true)
				{
					docSysErrorLog("该手机已被使用！", rt);
					return false;				
				}
				user.setTelValid(1);
			}
		}
		
		if(emailCheckEn)
		{
			if(email != null && !email.isEmpty())
			{
				if(RegularUtil.isEmail(email) == false)
				{
					docSysErrorLog("邮箱格式错误！", rt);
					return false;
				}
				
				if(isEmailUsed(email) == true)
				{
					docSysErrorLog("该邮箱已被使用！", rt);
					return false;				
				}
				user.setEmailValid(1);
			}
		}
		return true;
	}
	
	protected boolean userEditCheck(User user, ReturnAjax rt) {
		String userName = user.getName();
		String pwd = user.getPwd();
		String tel = user.getTel();
		String email = user.getEmail();
		Integer type = user.getType();
		
		Log.debug("userName:"+userName + " pwd:"+pwd + " type:" + type + " tel:" + user.getTel() + " email:" + user.getEmail());
		
		//检查用户名是否改动
		if(userName != null && !userName.isEmpty())
		{
			if(isUserNameUsed(userName) == true)
			{
				docSysErrorLog("该用户已存在！", rt);
				return false;
			}
			
			//如果用户使用手机号则需要检查手机号
			if(RegularUtil.IsMobliePhone(userName) == true)
			{
				if(isTelUsed(userName) == true)
				{
					docSysErrorLog("该手机已被使用！", rt);
					return false;				
				}
			}
			
			//如果用户使用邮箱则需要检查邮箱
			if(RegularUtil.isEmail(userName) == true)
			{
				if(isEmailUsed(userName) == true)
				{
					docSysErrorLog("该邮箱已被使用！", rt);
					return false;				
				}
			}			
		}
		
		if(tel != null && !tel.isEmpty())
		{
			if(RegularUtil.IsMobliePhone(tel) == false)
			{
				docSysErrorLog("手机格式错误！", rt);
				return false;
			}
			
			if(isTelUsed(tel) == true)
			{
				docSysErrorLog("该手机已被使用！", rt);
				return false;				
			}
			user.setTelValid(1);
		}
		
		if(email != null && !email.isEmpty())
		{
			if(RegularUtil.isEmail(email) == false)
			{
				docSysErrorLog("邮箱格式错误！", rt);
				return false;
			}
			
			if(isEmailUsed(email) == true)
			{
				docSysErrorLog("该邮箱已被使用！", rt);
				return false;				
			}
			user.setEmailValid(1);
		}
		return true;
	}

	protected boolean verifyTelAndEmail(User user, ReturnAjax rt) {
		
		String email = user.getEmail();
		if(email != null && !email.isEmpty())
		{
			if(verifyEmail(email) == false)
			{
				docSysErrorLog("邮箱验证失败", rt);
				return false;			
			}
		}
		
		String tel = user.getTel();
		if(tel != null && !tel.isEmpty())
		{
			if(verifyTelephone(tel) == false)
			{
				docSysErrorLog("手机验证失败", rt);
				return false;			
			}
		}	
		return true;
	}
	
	protected boolean verifyEmail(String email) {
		ReturnAjax rt = new ReturnAjax();
		return emailService.sendEmail(rt, email , "这是来自MxsDoc的邮箱验证邮件！");
	}

	protected boolean verifyTelephone(String tel) {
		ReturnAjax rt = new ReturnAjax();
		String smsSendUri = getSmsSendUri();
		String smsApikey = getSmsApikey();
		String smdTplid = getSmsTplid();
		
		return smsService.sendSms(rt, tel, smsSendUri, smsApikey, smdTplid, "Verify", null, null);
	}
		
    public String getSmsSendUri() {
    	String value = ReadProperties.read("docSysConfig.properties", "smsServer");
    	if(value == null || value.isEmpty())
    	{
    		value = JavaSmsApi.URI_TPL_SEND_SMS;
    	}
    	return value;
    }
    
    public String getSmsApikey() {
    	String value = ReadProperties.read("docSysConfig.properties", "smsApikey");
    	if(value == null || value.isEmpty())
    	{
    		value = JavaSmsApi.apikey;
    	}
    	return value;
    }
  
	protected String getSmsTplid() {
		String value = ReadProperties.read("docSysConfig.properties", "smsTplid");
    	if(value == null || value.isEmpty())
    	{
    		value = "1341175";
    	}
    	return value;
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
		List<Doc> successDocList = null;
		
		if(isFSM(repos) || doc.getIsRealDoc() == false) //文件管理系统或者VDOC
		{
			successDocList = verReposCheckOut(repos, false, doc, localParentPath, doc.getName(), commitId, true, true, downloadList);
		}
		else
		{
			successDocList = remoteServerCheckOut(repos, doc, null, null, null, commitId, true, true, downloadList);
		}
		
		if(successDocList == null || successDocList.size() == 0)
		{
			docSysErrorLog("未找到需要恢复的文件！",rt);
			return null;
		}
		
		Log.printObject("revertDocHistory checkOut successDocList:", successDocList);
		
		//Do commit to verRepos		
		String revision = null;
		if(isFSM(repos) || doc.getIsRealDoc() == false) //文件管理系统或者VDOC
		{
			revision = verReposDocCommitEx(repos, false, doc, commitMsg, commitUser, rt, true, null, 2, null);
			if(revision == null)
			{			
				docSysDebugLog("revertDocHistory()  verReposAutoCommit 失败", rt);
				return null;
			}
			Log.info("revertDocHistory()  verReposDocCommit return revision:" + revision);
			
			//推送至远程仓库
			verReposPullPush(repos, doc.getIsRealDoc(), rt);
			
			if(doc.getIsRealDoc())
			{
				//Force update docInfo
				//get changeItemList
				List<ChangedItem> changItemList = verReposGetHistoryDetail(repos, false, doc, revision);
				HashMap<String, ChangedItem> changItemHashMap = convertChangeItemListToHashMap(changItemList);
						
				//Log.printObject("revertDocHistory() successDocList:", successDocList);
				for(int i=0; i< successDocList.size(); i++)
				{
					Doc successDoc = successDocList.get(i);
					Log.debug("revertDocHistory() " + successDoc.getDocId() + " [" + successDoc.getPath() + successDoc.getName() + "] 恢复成功");
					String realRevision = getRealRevision(repos, successDoc, changItemHashMap, revision);
					successDoc.setRevision(realRevision);
					successDoc.setCreator(login_user.getId());
					successDoc.setLatestEditor(login_user.getId());
					dbUpdateDoc(repos, successDoc, true);
					dbCheckAddUpdateParentDoc(repos, successDoc, null, null);
				}

				realTimeRemoteStoragePush(repos, doc, null, login_user, commitMsg, rt, "revertDocHistory");
				realTimeBackup(repos, doc, null, login_user, commitMsg, rt, "revertDocHistory");
			}			
		}
		else
		{
			revision = remoteServerDocCommit(repos, doc, commitMsg, login_user, rt, true, 2);
		}		
		return revision;
	}
	
	private HashMap<String, ChangedItem> convertChangeItemListToHashMap(List<ChangedItem> changItemList) {
		HashMap<String, ChangedItem> hashMap = new HashMap<String, ChangedItem>();
		if(changItemList == null)
		{
			return hashMap;
		}
		for(int i=0; i < changItemList.size(); i++)
		{
			ChangedItem item = changItemList.get(i);
			hashMap.put(item.getEntryPath(), item);
		}
		return hashMap;
	}

	private String getRealRevision(Repos repos, Doc successDoc, HashMap<String, ChangedItem> changItemHashMap, String revision) {
		if(changItemHashMap.get(successDoc.getPath() + successDoc.getName()) == null)
		{
			return verReposGetLatestRevision(repos, false, successDoc);
		}
		return revision;
	}

	//底层addDoc接口
	//uploadFile: null为新建文件，否则为文件上传（新增）
	protected boolean addDoc(Repos repos, Doc doc, 
			MultipartFile uploadFile, //For upload
			Integer chunkNum, Long chunkSize, String chunkParentPath, //For chunked upload combination
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		Log.debug("addDoc() docId:" + doc.getDocId() + " pid:" + doc.getPid() + " parentPath:" + doc.getPath() + " docName:" + doc.getName());
	
		return addDoc_FSM(repos, doc,	//Add a empty file
					uploadFile, //For upload
					chunkNum, chunkSize, chunkParentPath, //For chunked upload combination
					commitMsg, commitUser, login_user, rt, actionList);
	}
	
	//底层addDoc接口
	//docData: null为新建文件或者是目录，否则为文件上传（新增）
	protected boolean addDocEx(Repos repos, Doc doc, 
			byte[] docData,
			Integer chunkNum, Long chunkSize, String chunkParentPath, //For chunked upload combination
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		Log.debug("addDoc() docId:" + doc.getDocId() + " pid:" + doc.getPid() + " parentPath:" + doc.getPath() + " docName:" + doc.getName());
	
		return addDocEx_FSM(repos, doc,	//Add a empty file
					docData, //For upload
					chunkNum, chunkSize, chunkParentPath, //For chunked upload combination
					commitMsg, commitUser, login_user, rt, actionList);
	}

	protected boolean addDoc_FSM(Repos repos, Doc doc,	//Add a empty file
			MultipartFile uploadFile, //For upload
			Integer chunkNum, Long chunkSize, String chunkParentPath, //For chunked upload combination
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		Log.debug("addDoc_FSM()  docId:" + doc.getDocId() + " pid:" + doc.getPid() + " parentPath:" + doc.getPath() + " docName:" + doc.getName() + " type:" + doc.getType());
		
		//add doc detail info
		doc.setCreator(login_user.getId());
		doc.setCreatorName(login_user.getName());
		doc.setLatestEditor(login_user.getId());
		doc.setLatestEditorName(login_user.getName());
		
		DocLock docLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		String lockInfo = "addDoc_FSM() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
		docLock = lockDoc(doc, lockType,  2*60*60*1000, login_user, rt, false, lockInfo);
		
		if(docLock == null)
		{
			Log.debug("addDoc_FSM() lockDoc " + doc.getName() + " Failed!");
			return false;
		}
		
		String localParentPath =  doc.getLocalRootPath() + doc.getPath();
		String localDocPath = localParentPath + doc.getName();
		File localEntry = new File(localDocPath);
		if(localEntry.exists())
		{	
			unlockDoc(doc, lockType, login_user);
			docSysDebugLog("addDoc_FSM() " +localDocPath + "　已存在！", rt);
		}
		
		//addDoc接口用uploadFile以及chunkNum同时为空来判定是新建文件或上传了空文件
		//TODO: 这个接口做的事情似乎有点太多了，后面有机会需要进行优化
		if(uploadFile == null && chunkNum == null)
		{	
			//File must not exists
			if(createRealDoc(repos, doc, rt) == false)
			{	
				unlockDoc(doc, lockType, login_user);
				String MsgInfo = "createRealDoc " + doc.getName() +" Failed";
				rt.setError(MsgInfo);
				Log.debug("addDoc_FSM() createRealDoc Failed");
				return false;
			}
		}
		else
		{
			if(updateRealDoc(repos, doc, uploadFile,chunkNum,chunkSize,chunkParentPath,rt) == false)
			{	
				unlockDoc(doc, lockType, login_user);
				String MsgInfo = "updateRealDoc " + doc.getName() +" Failed";
				rt.setError(MsgInfo);
				Log.debug("addDoc_FSM() updateRealDoc Failed");
				return false;
			}
		}
		
		//Update the latestEditTime
		Doc fsDoc = fsGetDoc(repos, doc);
		doc.setCreateTime(fsDoc.getLatestEditTime());
		doc.setLatestEditTime(fsDoc.getLatestEditTime());
		
		if(isFSM(repos))
		{
			String revision = verReposDocCommit(repos, false, doc,commitMsg,commitUser,rt, false, null, 2, null);
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
				
				//Insert Push Action
				CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.PUSH, DocType.REALDOC, null, login_user, false);
			}
			
			//检查dbParentDoc是否已添加
			List <Doc> addedParentDocList = new ArrayList<Doc>();
			dbCheckAddUpdateParentDoc(repos, doc, addedParentDocList, actionList);
			if(addedParentDocList.size() > 0)
			{
				rt.setDataEx(addedParentDocList);
			}
			
			realTimeRemoteStoragePush(repos, doc, null, login_user, commitMsg, rt, "addDoc");
			realTimeBackup(repos, doc, null, login_user, commitMsg, rt, "addDoc");
		}
		else
		{
			if(remoteServerDocCommit(repos, doc, commitMsg, login_user, rt, false, 2) == null)
			{
				unlockDoc(doc, lockType, login_user);
				Log.debug("addDoc_FSM() remoteServerDocCommit Failed");
				//rt.setError("远程推送失败"); //remoteServerDocCommit already set the errorinfo
				return false;
			}
		}
				
		//BuildMultiActionListForDocAdd();
		BuildMultiActionListForDocAdd(actionList, repos, doc, commitMsg, commitUser);
		
		unlockDoc(doc, lockType, login_user);
		
		rt.setData(doc);
		rt.setMsgData("isNewNode");
		docSysDebugLog("新增成功", rt); 
		
		return true;
	}

	protected boolean addDocEx_FSM(Repos repos, Doc doc,	//Add a empty file
			byte[] docData,
			Integer chunkNum, Long chunkSize, String chunkParentPath, //For chunked upload combination
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		Log.debug("addDocEx_FSM()  docId:" + doc.getDocId() + " pid:" + doc.getPid() + " parentPath:" + doc.getPath() + " docName:" + doc.getName() + " type:" + doc.getType());
		
		//add doc detail info
		doc.setCreator(login_user.getId());
		doc.setCreatorName(login_user.getName());
		doc.setLatestEditor(login_user.getId());
		doc.setLatestEditorName(login_user.getName());
		
		DocLock docLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		String lockInfo = "addDocEx_FSM() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
		//LockDoc
		docLock = lockDoc(doc, lockType,  2*60*60*1000, login_user, rt, false, lockInfo);
		
		if(docLock == null)
		{
			Log.debug("addDocEx_FSM() lockDoc " + doc.getName() + " Failed!");
			return false;
		}
		
		String localParentPath =  doc.getLocalRootPath() + doc.getPath();
		String localDocPath = localParentPath + doc.getName();
		File localEntry = new File(localDocPath);
		if(localEntry.exists())
		{	
			unlockDoc(doc, lockType, login_user);
			docSysDebugLog("addDocEx_FSM() " +localDocPath + "　已存在！", rt);
		}
		
		//addDoc接口用uploadFile是否为空来区分新建文件还是上传文件
		if(docData == null)
		{	
			//File must not exists
			if(createRealDoc(repos, doc, rt) == false)
			{	
				unlockDoc(doc, lockType, login_user);
				String MsgInfo = "createRealDoc " + doc.getName() +" Failed";
				rt.setError(MsgInfo);
				Log.debug("addDocEx_FSM() createRealDoc Failed");
				return false;
			}
		}
		else
		{
			if(updateRealDoc(repos, doc, docData,chunkNum,chunkSize,chunkParentPath,rt) == false)
			{	
				unlockDoc(doc, lockType, login_user);
				String MsgInfo = "updateRealDoc " + doc.getName() +" Failed";
				rt.setError(MsgInfo);
				Log.debug("addDocEx_FSM() updateRealDoc Failed");
				return false;
			}
		}
		
		//Update the latestEditTime
		Doc fsDoc = fsGetDoc(repos, doc);
		doc.setCreateTime(fsDoc.getLatestEditTime());
		doc.setLatestEditTime(fsDoc.getLatestEditTime());
		
		if(isFSM(repos))
		{
			String revision = verReposDocCommit(repos, false, doc,commitMsg,commitUser,rt, false, null, 2, null);
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
				
				//Insert Push Action
				CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.PUSH, DocType.REALDOC, null, login_user, false);
			}
		}
		else
		{
			if(remoteServerDocCommit(repos, doc,commitMsg,login_user,rt, false, 2) == null)
			{
				unlockDoc(doc, lockType, login_user);
				docSysWarningLog("addDocEx_FSM remoteServerDocCommit Failed", rt);
				//rt.setError("远程推送失败"); //remoteServerDocCommit already set the errorinfo
				return false;
			}			
		}
		
		//检查dbParentDoc是否已添加
		List <Doc> addedParentDocList = new ArrayList<Doc>();
		dbCheckAddUpdateParentDoc(repos, doc, addedParentDocList, actionList);
		if(addedParentDocList.size() > 0)
		{
			rt.setDataEx(addedParentDocList);
		}
				
		//BuildMultiActionListForDocAdd();
		BuildMultiActionListForDocAdd(actionList, repos, doc, commitMsg, commitUser);
		
		unlockDoc(doc, lockType, login_user);
		
		rt.setData(doc);
		rt.setMsgData("isNewNode");
		docSysDebugLog("新增成功", rt); 
		
		return true;
	}

	private boolean dbUpdateDocRevision(Repos repos, Doc doc, String revision) {
		Log.debug("dbUpdateDocRevision " + revision + " doc " + doc.getDocId() + " [" +doc.getPath() + doc.getName() + "]");

		Doc dbDoc = dbGetDoc(repos, doc, false);
		if(dbDoc == null)
		{
			Log.debug("dbUpdateDocRevision dbDoc " + doc.getDocId() + " [" +doc.getPath() + doc.getName() + "] 不存在");
			doc.setRevision(revision);
			return dbAddDoc(repos,doc, false, false);
		}
		
		if(dbDoc.getRevision() == null || !dbDoc.getRevision().equals(revision))
		{
			dbDoc.setRevision(revision);
			if(dbUpdateDoc(repos, dbDoc, false) == false)
			{
				Log.debug("dbUpdateDocRevision 更新节点版本号失败: " + doc.getDocId() + " [" +doc.getPath() + doc.getName() + "]");	
				return false;
			}
			return true;
		}
		
		return true;
	}
	
	//该接口用于更新父节点的信息: 仓库有commit成功的操作时必须调用
	private void dbCheckAddUpdateParentDoc(Repos repos, Doc doc, List<Doc> parentDocList, List<CommonAction> actionList) 
	{
		if(isFSM(repos) == false)
		{
			return;
		}		
		
		Log.debug("checkAddUpdateParentDoc " + doc.getDocId() + " " +doc.getPath() + doc.getName());
		
		if(doc.getDocId() == 0)
		{
			return;
		}
		
		Log.debug("checkAddUpdateParentDoc pid:" + doc.getPid());
		
		Doc parentDoc = buildBasicDoc(doc.getVid(), doc.getPid(), null, doc.getReposPath(), doc.getPath(), "", null, 2, true, doc.getLocalRootPath(), doc.getLocalVRootPath(), 0L, "");
		parentDoc.setRevision(doc.getRevision());

		Log.printObject("checkAddUpdateParentDoc parentDoc:", parentDoc);
		
		Doc dbParentDoc = dbGetDoc(repos, parentDoc, false);
		if(dbParentDoc == null)
		{
			if(parentDocList == null)
			{
				parentDocList = new ArrayList<Doc>();
			}

			if(dbAddDoc(repos, parentDoc, false, false) == true)
			{
				Log.debug("checkAddUpdateParentDoc 新增目录: " + parentDoc.getDocId() + " " + parentDoc.getPath() + parentDoc.getName());
				
				//Insert Index Add Action For addedParentDoc
				if(actionList != null)	//异步方式添加Index
				{
					CommonAction.insertCommonAction(actionList, repos, parentDoc, null, null, null, ActionType.INDEX, Action.ADD, DocType.DOCNAME, null, null, false);
				}
				else //直接添加Index
				{
					addIndexForDocName(repos, parentDoc);
				}	

				parentDocList.add(0,parentDoc);	//always add to the top
				dbCheckAddUpdateParentDoc(repos, parentDoc, parentDocList, actionList);
			}
		}
		else
		{
			if(dbParentDoc.getRevision() == null || !dbParentDoc.getRevision().equals(doc.getRevision()))
			{
				parentDoc.setId(dbParentDoc.getId());
				if(dbUpdateDoc(repos, parentDoc, false) == false)
				{
					Log.debug("checkAddUpdateParentDoc 更新父节点版本号失败: " + parentDoc.getDocId() + " " + parentDoc.getPath() + parentDoc.getName());	
				}
			}
		}
	}

	//底层deleteDoc接口
	protected String deleteDoc(Repos repos, Doc doc, String commitMsg,String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		return deleteDoc_FSM(repos, doc, commitMsg, commitUser, login_user,  rt, actionList);			
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
		int lockType = DocLock.LOCK_TYPE_FORCE;
		String lockInfo = "deleteDoc_FSM() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
		docLock = lockDoc(doc, lockType, 2*60*60*1000, login_user, rt, true, lockInfo);	//lock 2 Hours 2*60*60*1000
		
		if(docLock == null)
		{
			docSysDebugLog("deleteDoc_FSM() Failed to lock Doc: " + docId, rt);
			return null;			
		}
		
		Log.info("deleteDoc_FSM() " + docId + " " + doc.getPath() + doc.getName() + " Lock OK");		
		
		//get RealDoc Full ParentPath
		if(deleteRealDoc(repos,doc,rt) == false)
		{
			unlockDoc(doc, lockType, login_user);
			
			docSysDebugLog("deleteDoc_FSM() deleteRealDoc Failed", rt);
			docSysErrorLog(doc.getName() + " 删除失败！", rt);
			return null;
		}
		Log.info("deleteDoc_FSM() local doc:[" + doc.getPath() + doc.getName() + "] 删除成功");

		String revision = null;
		if(isFSM(repos))
		{
			revision = verReposDocCommit(repos, false, doc, commitMsg,commitUser,rt, true, null, 2, null);
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
				
				//delete操作需要自动增加ParentDoc???
				//dbCheckAddUpdateParentDoc(repos, doc, null, actionList);
				
				//异步推送远程版本仓库：Insert Push Action
				CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.PUSH, DocType.REALDOC, null, login_user, false);
			}
			
			realTimeRemoteStoragePush(repos, doc, null, login_user, commitMsg, rt, "deleteDoc");
			realTimeBackup(repos, doc, null, login_user, commitMsg, rt, "deleteDoc");
		}
		else
		{
			revision = remoteServerDocCommit(repos, doc, commitMsg,login_user,rt, true, 2);
			if(revision == null)
			{
				Log.debug("deleteDoc_FSM() remoteServerDocCommit Failed");
				//rt.setError("远程推送失败"); //remoteServerDocCommit already set the errorinfo
			}
		}
		
		//Build ActionList for RDocIndex/VDoc/VDocIndex/VDocVerRepos delete
		BuildMultiActionListForDocDelete(actionList, repos, doc, commitMsg, commitUser,true);
		
		unlockDoc(doc, lockType, login_user);
		
		rt.setData(doc);
		return revision;
	}
	
	private void BuildMultiActionListForDocAdd(List<CommonAction> actionList, Repos repos, Doc doc, String commitMsg, String commitUser) 
	{
		//Insert index add action for RDoc Name
		CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.INDEX, Action.ADD, DocType.DOCNAME, null, null, false);
		//Insert index add action for RDoc
		CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.INDEX, Action.ADD, DocType.REALDOC, null, null, false);

		
		//Insert add action for VDoc
		String content = doc.getContent();
		if(content == null || content.isEmpty())
		{
			return;
		}
		//Build subActionList
		List<CommonAction> subActionList = new ArrayList<CommonAction>();
		if(repos.getVerCtrl1() > 0)
		{
			CommonAction.insertCommonAction(subActionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.ADD, DocType.VIRTURALDOC, null, null, false); //verRepos commit
		}
		CommonAction.insertCommonAction(subActionList, repos, doc, null, commitMsg, commitUser, ActionType.INDEX, Action.ADD, DocType.VIRTURALDOC, null, null, false);	//Add Index For VDoc
		
		//Insert add action for VDoc
		CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.FS, Action.ADD, DocType.VIRTURALDOC, subActionList, null, false);			
	}

	protected void BuildMultiActionListForDocDelete(List<CommonAction> actionList, Repos repos, Doc doc, String commitMsg, String commitUser, boolean deleteSubDocs) 
	{
		//注意：删除操作的VirtualDoc是不删除的
		
		//Insert index delete action for All( DocName / RDoc /VDoc )
		CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.INDEX, Action.DELETE, DocType.ALL, null, null, false);
	}

	void BuildMultiActionListForDocUpdate(List<CommonAction> actionList, Repos repos, Doc doc, String reposRPath) 
	{		
		//Insert index update action for RDoc
		CommonAction.insertCommonAction(actionList, repos, doc, null, null, null, com.DocSystem.common.CommonAction.ActionType.INDEX, com.DocSystem.common.CommonAction.Action.UPDATE, com.DocSystem.common.CommonAction.DocType.REALDOC, null, null, false);
	}
	
	private void BuildMultiActionListForDocCopy(List<CommonAction> actionList, Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, boolean isMove)
	{	
		if(dstDoc.getName().isEmpty())
		{
			Log.debug("BuildMultiActionListForDocCopy() dstDoc.name is empty:" + dstDoc.getDocId() + " path:" + dstDoc.getPath() + " name:" +dstDoc.getName());
			return;
		}
		
		Action actionId = com.DocSystem.common.CommonAction.Action.COPY;
		if(isMove)
		{
			actionId = com.DocSystem.common.CommonAction.Action.MOVE;
		}
		
		//Check if dstLocalEntry exists
		String dstLocalEntryPath = dstDoc.getLocalRootPath() + dstDoc.getPath() + dstDoc.getName(); 
		File dstLocalEntry = new File(dstLocalEntryPath);
		if(dstLocalEntry.exists())
		{								
			//Doc的VirtualDoc的移动或复制操作（目录的话会移动或复制其子目录的VirtualDoc）
			//注意：copy和move操作的VirtualDoc是不进行版本提交的
			CommonAction.insertCommonAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, com.DocSystem.common.CommonAction.ActionType.VFS, actionId, DocType.VIRTURALDOC, null, null, true);
			
			//Insert IndexAction For Copy or Move
			if(isMove)  //UPDATE all index (DocName /RDoc /VDoc)
			{
				CommonAction.insertCommonAction(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, com.DocSystem.common.CommonAction.ActionType.INDEX, com.DocSystem.common.CommonAction.Action.UPDATE, com.DocSystem.common.CommonAction.DocType.ALL, null, null, true);
			}
			else	//ADD all index for (DocName /RDoc /VDoc)
			{
				CommonAction.insertCommonAction(actionList, repos, dstDoc, null, commitMsg, commitUser, com.DocSystem.common.CommonAction.ActionType.INDEX, com.DocSystem.common.CommonAction.Action.ADD, com.DocSystem.common.CommonAction.DocType.ALL, null, null, true);				
			}
		}	
	}
		
	public boolean executeCommonActionList(List<CommonAction> actionList, ReturnAjax rt) 
	{
		if(actionList == null || actionList.size() == 0)
		{
			return true;
		}
		
		int size = actionList.size();
		Log.debug("\n*********** executeCommonActionList()  size:" + size + " ********");
		
		int count = 0;

		for(int i=0; i< size; i++)
		{
			CommonAction action = actionList.get(i);
			
			//根据action的类型确定是否要递归执行
			if(executeCommonAction(action, rt) == true)
			{
				//Execute SubActionList
				executeCommonActionList(action.getSubActionList(), rt);
				count++;
			}
		}
		
		if(count != size)
		{
			Log.debug("executeCommonActionList() failed actions:" + (size - count));	
			return false;
		}
		
		return true;
	}
	
	private boolean executeCommonAction(CommonAction action, ReturnAjax rt) {
		
		boolean ret = false;
		
		Doc srcDoc = action.getDoc();
		
		Log.debug("executeCommonAction actionType:" + action.getAction() + " docType:" + action.getDocType() + " actionId:" + action.getType() + " doc:"+ srcDoc.getDocId() + " " + srcDoc.getPath() + srcDoc.getName());

		switch(action.getType())
		{
		case FS:
			ret = executeFSAction(action, rt);
			break;
		case VERREPOS:
			String revision = executeVerReposAction(action, rt);
			if(revision != null)
			{
				action.getDoc().setRevision(revision);
				ret = true;
			}
			break;
		case DB:
			ret = executeDBAction(action, rt);
			break;			
		case INDEX:
			ret = executeIndexAction(action, rt);
			break;
		case AUTOSYNCUP: //AutoSyncUp
			ret = executeSyncUpAction(action, rt);
			break;
		case VFS:
			ret = executeVFSAction(action, rt);
			break;
		default:
			break;
		}
		
		if(ret == false)
		{
			return ret;
		}
		
		//对子目录执行相同的action
		if(action.recursion == true)
		{
			executeCommonActionForSubDir(action);
		}
		return ret;
	}

	private boolean executeCommonActionForSubDir(CommonAction action) {
		Repos repos = action.getRepos();
		Doc doc = action.getDoc(); 
		Doc newDoc = action.getNewDoc();
		String commitMsg = action.getCommitMsg();
		String commitUser = action.getCommitUser();
		Action actionId = action.getAction();
		switch(actionId)
		{
		case COPY:
			executeDocCopyCommonActionForSubDir(action, repos, doc, newDoc, commitMsg, commitUser, false);
			break;
		case MOVE:
			executeDocCopyCommonActionForSubDir(action, repos, doc, newDoc, commitMsg, commitUser, true);
			break;
		default:
			break;
		}
		
		return false;
	}

	private void executeDocCopyCommonActionForSubDir(CommonAction action, Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, boolean isMove) {

		List<CommonAction> actionList = new ArrayList<CommonAction>();

		String dstLocalEntryPath = dstDoc.getLocalRootPath() + dstDoc.getPath() + dstDoc.getName(); 
		File dstLocalEntry = new File(dstLocalEntryPath);
		if(dstLocalEntry.isDirectory())
		{			
			//遍历本地目录，构建CommonAction
			String dstSubDocParentPath = getSubDocParentPath(dstDoc);
			String srcSubDocParentPath = getSubDocParentPath(srcDoc);
			int dstSubDocLevel = getSubDocLevel(dstDoc);
			int srcSubDocLevel = getSubDocLevel(srcDoc);
			String localRootPath = dstDoc.getLocalRootPath();
			String localVRootPath = dstDoc.getLocalVRootPath();
			
			File[] localFileList = dstLocalEntry.listFiles();
	    	for(int i=0;i<localFileList.length;i++)
	    	{
	    		File file = localFileList[i];
	    		int type = file.isDirectory()? 2:1;
	    		long size = file.length();
	    		String name = file.getName();
	    		Log.debug("executeDocCopyCommonActionForSubDir() BuildMultiActionListForDocCopy subFile:" + name);

	    		Doc dstSubDoc = buildBasicDoc(repos.getId(), null, dstDoc.getDocId(), dstDoc.getReposPath(), dstSubDocParentPath, name, dstSubDocLevel, type, true, localRootPath, localVRootPath, size, "");
	    		dstSubDoc.setCreateTime(dstLocalEntry.lastModified());
	    		dstSubDoc.setLatestEditTime(dstLocalEntry.lastModified());
	    		
	    		Doc srcSubDoc = buildBasicDoc(repos.getId(), null, srcDoc.getDocId(), srcDoc.getReposPath(), srcSubDocParentPath, name, srcSubDocLevel, type, true, localRootPath, localVRootPath, size, "");
	    		BuildMultiActionListForDocCopy(actionList, repos, srcSubDoc, dstSubDoc, commitMsg, commitUser, isMove);
	    	}
		}
		
		ReturnAjax rt = new ReturnAjax();
		executeCommonActionList(actionList, rt);
	}
	
	protected boolean insertActionListToUniqueActionList(List<CommonAction> actionList, ReturnAjax rt) 
	{
		Log.info("********** insertActionListToUniqueActionList ***********");
		if(actionList.size() <= 0)
		{
			Log.info("********** insertActionListToUniqueActionList actionList is empty ***********");			
			return false;
		}
		
		//Inset ActionList to uniqueCommonAction
		int successCount = 0;
		for(int i=0; i<actionList.size(); i++)
		{
			if(insertUniqueCommonAction(actionList.get(i)) == true)
			{
				successCount++;
			}
		}
		
		if(successCount > 0)
		{
			return true;
		}
		return false;
	}
	
	protected boolean executeUniqueActionList(Integer reposId, ReturnAjax rt) 
	{
		//注意：ActionList中的doc必须都是同一个仓库下的，否则下面的逻辑会有问题
		Log.info("executeUniqueActionList reposId:" + reposId);
		
		UniqueAction uniqueAction = uniqueActionHashMap.get(reposId);
		if(uniqueAction == null)
		{
			Log.info("executeUniqueCommonActionList uniqueAction for " + reposId+ " is null");
			return false;
		}
		
		//unqiueAction是保证每个仓库只有一个任务在执行
		if(uniqueAction.getIsRunning())
		{
			Log.info("executeUniqueCommonActionList uniqueCommonAction for " + reposId+ " is Running");
			Long expireTime = uniqueAction.getExpireTimeStamp();
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
			
			Log.info("executeUniqueCommonActionList uniqueCommonAction for " + reposId+ " Running timeout, clear uniqueAction");
			
			//清空uniqueAction
			uniqueAction.setIsRunning(false);
			uniqueAction.setExpireTimeStamp(null);
			uniqueAction.getUniqueCommonActionHashMap().clear();
			uniqueAction.getUniqueCommonActionList().clear();	
			return false;
		}

		boolean ret = false;
		try {
			long curTime = new Date().getTime();
			uniqueAction.setExpireTimeStamp(curTime + 43200000); //12 Hours 12*60*60*1000 = 43200,000
			uniqueAction.setIsRunning(true);
			ConcurrentHashMap<String, CommonAction> hashMap = uniqueAction.getUniqueCommonActionHashMap();
			List<CommonAction> list = uniqueAction.getUniqueCommonActionList();
			Log.info("executeUniqueCommonActionList() reposId:" + reposId+ " UniqueCommonActionHashMap Size:" + hashMap.size() + " UniqueCommonActionList size:" + list.size());
			while(hashMap.size() > 0)
			{
				if(list.size() > 0)
				{
					CommonAction action = list.get(0);
					String unqueActionId = getUniqueActionId(action);
					Log.info("executeUniqueCommonActionList() execute uniqueCommonAction unqueActionId:" + unqueActionId + " reposId:" + reposId+ " doc:[" + action.getDoc().getPath() + action.getDoc().getName() + "] Start");
					executeCommonAction(action, rt);
					Log.info("executeUniqueCommonActionList() execute uniqueCommonAction unqueActionId:" + unqueActionId + " reposId:" + reposId+ " doc:[" + action.getDoc().getPath() + action.getDoc().getName() + "] End");
					list.remove(0);
					hashMap.remove(unqueActionId);
				}
				else
				{
					Log.info("executeUniqueCommonActionList() hashMap 和 list不同步，强制清除 actionHashMap");
				}
			}
			//清空uniqueAction
			uniqueAction.setIsRunning(false);
			uniqueAction.setExpireTimeStamp(null);
			uniqueAction.getUniqueCommonActionHashMap().clear();
			uniqueAction.getUniqueCommonActionList().clear();	
			Log.info("executeUniqueCommonActionList completed for repos: " + reposId);			
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		} finally {
			if(uniqueAction.getIsRunning())
			{
				//清空uniqueAction
				uniqueAction.setIsRunning(false);
				uniqueAction.setExpireTimeStamp(null);
				uniqueAction.getUniqueCommonActionHashMap().clear();
				uniqueAction.getUniqueCommonActionList().clear();	
			}
		}
		return ret;
	}	
	
	protected boolean executeUniqueCommonActionList(List<CommonAction> actionList, ReturnAjax rt) 
	{
		Log.info("********** executeUniqueCommonActionList ***********");
		if(actionList.size() <= 0)
		{
			Log.info("********** executeUniqueCommonActionList actionList is empty ***********");			
			return false;
		}
		
		//Inset ActionList to uniqueCommonAction
		insertActionListToUniqueActionList(actionList, rt);
		
		//注意：ActionList中的doc必须都是同一个仓库下的，否则下面的逻辑会有问题
		Integer reposId = actionList.get(0).getDoc().getVid(); //get the reposId from the first doc in action list
		Log.info("executeUniqueCommonActionList reposId:" + reposId);
		return executeUniqueActionList(reposId, rt);
	}	
	
	private boolean executeSyncUpAction(CommonAction action, ReturnAjax rt) {
		Log.printObject("executeSyncUpAction() action:",action);
		return syncupForDocChange(action, true, rt);
	}
	
	protected boolean doSyncupForDocChange(Repos repos, Doc doc, User user, String commitMsg, boolean recurcive) {
		CommonAction action = new CommonAction();
		action.setType(ActionType.AUTOSYNCUP);		
		action.setAction(Action.UNDEFINED);	//只同步有改动的文件
		action.setDocType( DocType.REALDOC);
		action.setRepos(repos);
		action.setDoc(doc);
		action.setNewDoc(null);
		action.setUser(user);
		action.setCommitMsg(commitMsg);
		action.setCommitUser(user.getName());
		action.setSubActionList(null);
		action.recursion = recurcive;		
		
		ReturnAjax rt = new ReturnAjax();
		return syncupForDocChange(action, false, rt );
	}

    /**
     * This function will execute following actions:
     * 1. Push local change to remote storage sever / Pull remote change from remote storage server
     * pre-condition: 
     * (1) remoteStorageEnable == true and repos.remoteStorageConfig was configured
     * (2) action.type is SYNC / FORCESYNC / SYNCVerRepos subDocs will be push and pull
     * 
     * 2. SyncUp Local Entry with VerRepos Entry (always treat remote change as local change)
     *    if action.type is SYNC / FORCESYNC / SYNCVerRepos current doc and all subEntries under doc is local or remote changed will be syncuped, 
     *    otherwise only current doc and subEntries just under current doc is local changed will be syncuped
     * 3. Check and Update Index 
     * 	  if action.type is SYNC / FORCESYNC then Index of current doc and all subEntries under current doc will be updated
     *    if action.type is UNDEFINED only Index of changed entries(the result of Step2) will be updated
     *    if action.type is SYNCVerRepos or unknown, then nothing will be done
     * 
     * @param  action      			 SyncUp Action
     * 								 if action.type is SYNC or FORCESYNC    
     * @param  remoteStorageEnable   if true then enable push to or pull from remote storage server
     * @param  rt  					 SyncUpResult
     * @return              		 true or false
    */
	protected boolean syncupForDocChange(CommonAction action, boolean remoteStorageEnable ,ReturnAjax rt) {		
		Log.info("syncupForDocChange() **************************** 启动自动同步 ********************************");
		Log.info("syncupForDocChange() actionType: [" + action.getAction() + "] ");
		
		Repos repos =  action.getRepos();
		Log.printObject("syncupForDocChange() repos:",repos);
		if(isFSM(repos) == false)
		{
			Log.info("syncupForDocChange() 前置类型仓库不需要同步:" + repos.getType());
			Log.info("syncupForDocChange() ************************ 结束自动同步 ****************************");
			return true;
		}

		Doc doc = action.getDoc();
		if(doc == null)
		{
			Log.info("syncupForDocChange() doc is null");
			Log.info("syncupForDocChange() ************************ 结束自动同步 ****************************");
			return false;
		}
		Log.printObject("syncupForDocChange() doc:",doc);
		
		User login_user = action.getUser();
		if(login_user == null)
		{
			login_user = systemUser;
		}
		
		//set syncup options for RemoteStorage / VersionRepos / IndexLib 
		Integer subDocSyncupFlag = 1;
		boolean syncLocalChangeOnly = true;
		switch(action.getAction())
		{
		case SYNC:			
		case SYNCFORCE:
			subDocSyncupFlag = 2;
			syncLocalChangeOnly = false;
			break;
		case SYNCVerRepos:
			subDocSyncupFlag = 2;
			syncLocalChangeOnly = false;
			break;
		case UNDEFINED:
			break;
		default:
			break;
		}
		
		Log.info("syncupForDocChange() [" + doc.getPath() + doc.getName() + "] subDocSyncupFlag:" + subDocSyncupFlag + " syncLocalChangeOnly:" + syncLocalChangeOnly);
		
		if(remoteStorageEnable)
		{
			//远程存储自动拉取/推送
			RemoteStorageConfig remote = repos.remoteStorageConfig;
			if(remote != null && ((remote.autoPull != null && remote.autoPull == 1) || (remote.autoPush != null && remote.autoPush == 1)))
			{
		    	Channel channel = ChannelFactory.getByChannelName("businessChannel");
				if(channel != null)
		        {	
					
					DocLock docLock = null;
					int lockType = DocLock.LOCK_TYPE_FORCE;
					String lockInfo = "syncupForDocChange() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
			    	docLock = lockDoc(doc, lockType, 2*60*60*1000, login_user, rt, true, lockInfo);	//lock 2 Hours 2*60*60*1000
					
					if(docLock == null)
					{
						docSysDebugLog("remoteStoragePush() Failed to lock Doc: " + doc.getDocId(), rt);
					}
					else
					{
						if(remote.autoPush != null && remote.autoPush == 1)
						{
							Log.info("syncupForDocChange() 远程存储自动推送  remote.autoPush:" + remote.autoPush + "  remote.autoPushForce:" +  remote.autoPushForce);
							channel.remoteStoragePush(remote, repos, doc, login_user,  "远程存储自动推送", subDocSyncupFlag == 2, remote.autoPushForce == 1, 4, rt);
						}					
						if(remote.autoPull != null && remote.autoPull == 1)
						{
							Log.info("syncupForDocChange() 远程存储自动拉取  remote.autoPull:" + remote.autoPull + "  remote.autoPullForce:" +  remote.autoPullForce);
							channel.remoteStoragePull(remote, repos, doc, login_user, null, subDocSyncupFlag == 2, remote.autoPullForce == 1, rt);
						}
						
						unlockDoc(doc, lockType,  login_user);
					}
				}
			}
		}		
				
		boolean realDocSyncResult = false;
		if(repos.getIsRemote() == 1)
		{
			//Sync Up local VerRepos with remote VerRepos
			Log.info("syncupForDocChange() 同步远程版本仓库");
			verReposPullPush(repos, true, null);
		}
			
		//文件管理系统
		HashMap<Long, DocChange> localChanges = new HashMap<Long, DocChange>();
		HashMap<Long, DocChange> remoteChanges = new HashMap<Long, DocChange>();
		Log.info("syncupForDocChange() 同步版本管理");
		ScanOption scanOption = new ScanOption();
		scanOption.scanType = 2;	//localChange and treatRevisionNullAsLocalChange
		scanOption.scanTime = new Date().getTime();
		scanOption.localChangesRootPath = Path.getReposTmpPath(repos) + "reposSyncupScanResult/syncupForDocChange-localChanges-" + scanOption.scanTime + "/";
		scanOption.remoteChangesRootPath = Path.getReposTmpPath(repos) + "reposSyncupScanResult/syncupForDocChange-remoteChanges-" + scanOption.scanTime + "/";
		
		realDocSyncResult = syncUpLocalWithVerRepos(repos, doc, action, localChanges, remoteChanges, subDocSyncupFlag, scanOption, login_user, rt); 

		Log.info("syncupForDocChange() 刷新文件索引");
		checkAndUpdateIndex(repos, doc, action, localChanges, remoteChanges, subDocSyncupFlag, scanOption, rt);

		Log.info("syncupForDocChange() clean tmp files");
		cleanSyncUpTmpFiles(scanOption);
		
		Log.info("syncupForDocChange() ************************ 结束自动同步 ****************************");
		return realDocSyncResult;
	}
	
	private void cleanSyncUpTmpFiles(ScanOption scanOption) {
		if(scanOption.localChangesRootPath != null)
		{
			FileUtil.delDir(scanOption.localChangesRootPath);
		}

		if(scanOption.remoteChangesRootPath != null)
		{
			FileUtil.delDir(scanOption.remoteChangesRootPath);
		}

	}

	private boolean syncUpLocalWithVerRepos(Repos repos, Doc doc, CommonAction action, HashMap<Long, DocChange> localChanges, HashMap<Long, DocChange> remoteChanges, 
			Integer subDocSyncupFlag, ScanOption scanOption,
			User login_user, ReturnAjax rt) {
		//对本地文件和版本仓库进行同步
		Log.info("syncUpLocalWithVerRepos() 开始版本管理同步");
		Log.info("syncUpLocalWithVerRepos() docId:" + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "]");

		Doc localEntry = fsGetDoc(repos, doc);
		if(localEntry == null)
		{
			Log.info("syncUpLocalWithVerRepos() 本地文件信息获取异常:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			Log.info("syncUpLocalWithVerRepos() ************************ 结束版本管理同步 ****************************");
			return false;
		}
		Doc remoteEntry = verReposGetDoc(repos, doc, null);
		if(remoteEntry == null)
		{
			Log.info("syncUpLocalWithVerRepos() 远程文件信息获取异常:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			Log.info("syncUpLocalWithVerRepos() ************************ 结束版本管理同步  ****************************");
			return false;
		}
		
		Doc dbDoc = dbGetDoc(repos, doc, false);
		
		boolean ret = syncupScanForDoc_FSM(repos, doc, dbDoc, localEntry, remoteEntry, login_user, rt, remoteChanges, localChanges, subDocSyncupFlag, scanOption);

		Log.info("syncUpLocalWithVerRepos() syncupScanForDoc_FSM ret:" + ret);
		if(isRemoteChanged(remoteChanges, scanOption) == false)
		{
			Log.info("syncUpLocalWithVerRepos() 远程没有改动");
		}
		else
		{
			Log.info("syncUpLocalWithVerRepos() 远程有改动，同步到本地");
			//Do Remote SyncUp			
			if(scanOption.remoteChangesRootPath == null)
			{
				syncupRemoteChanges_FSM(repos, login_user, remoteChanges, rt);
			}
			else
			{
				syncupRemoteChangesEx_FSM(repos, login_user, doc, scanOption.remoteChangesRootPath, rt);				
			}
		}
		
		if(isLocalChanged(localChanges, scanOption) == false)
		{
			Log.info("syncUpLocalWithVerRepos() 本地没有改动");
			return true;
		}
		
		if(action.getAction() == Action.UNDEFINED)
		{
			Log.info("syncUpLocalWithVerRepos() Action:" + action.getAction() + " 本地有改动不进行同步 ");			
			return true;
		}
		
		if(scanOption.localChangesRootPath == null)
		{
			return syncupLocalChanges_FSM(repos, doc, action.getCommitMsg(), action.getCommitUser(), login_user, localChanges, subDocSyncupFlag, rt);
		}
		else
		{
			return syncupLocalChangesEx_FSM(repos, doc, action.getCommitMsg(), action.getCommitUser(), login_user, scanOption.localChangesRootPath, subDocSyncupFlag, rt);			
		}
	}
	
	
	protected boolean isLocalChanged(HashMap<Long, DocChange> localChanges, ScanOption scanOption) {
		if(scanOption.localChangesRootPath == null)
		{
			Log.debug("isLocalChanged() localChanges size:" + localChanges.size());		
			return localChanges.size() > 0;
		}
		
		Log.debug("isLocalChanged() scanOption.localChangesRootPath:" + scanOption.localChangesRootPath);
		File dir = new File(scanOption.localChangesRootPath);
		if(dir.exists() == false)
		{
			Log.debug("isLocalChanged() no localChanges:" + scanOption.localChangesRootPath + " not exists");		
			return false;
		}
		
		Log.debug("isLocalChanged() localChanges count:" + dir.listFiles().length + " under " + scanOption.localChangesRootPath);		
		return dir.listFiles().length > 0;
	}
	
	protected boolean isRemoteChanged(HashMap<Long, DocChange> remoteChanges, ScanOption scanOption) {
		if(scanOption.remoteChangesRootPath == null)
		{
			Log.debug("isRemoteChanged() remoteChanges size:" + remoteChanges.size());		
			return remoteChanges.size() > 0;
		}
		
		//Log.debug("isRemoteChanged() scanOption.remoteChangesRootPath:" + scanOption.remoteChangesRootPath);
		File dir = new File(scanOption.remoteChangesRootPath);
		if(dir.exists() == false)
		{
			Log.debug("isRemoteChanged() no remoteChanges:" + scanOption.remoteChangesRootPath + " not exists");		
			return false;
		}

		Log.debug("isRemoteChanged() remoteChanges count:" + dir.listFiles().length + " under " + scanOption.remoteChangesRootPath);		
		return dir.listFiles().length > 0;
	}

	private void checkAndUpdateIndex(Repos repos, Doc doc, CommonAction action, HashMap<Long, DocChange> localChanges, HashMap<Long, DocChange> remoteChanges, Integer subDocSyncupFlag, ScanOption scanOption, ReturnAjax rt) {
		//用户手动刷新：总是会触发索引刷新操作
		if(action.getAction() == null)
		{
			Log.info("**************************** checkAndUpdateIndex() action is null for " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " subDocSyncupFlag:" + subDocSyncupFlag);
			return;
		}	
		
		switch(action.getAction())
		{
		case SYNCFORCE:
			Log.info("**************************** checkAndUpdateIndex() 强制刷新Index for: " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " subDocSyncupFlag:" + subDocSyncupFlag);
			if(docDetect(repos, doc))
			{
				if(doc.getDocId() == 0)
				{
					//Delete All Index Lib
					Log.info("checkAndUpdateIndex() delete all index lib");
					deleteDocNameIndexLib(repos);
					deleteRDocIndexLib(repos);
					deleteVDocIndexLib(repos);
					//Build All Index For Doc
					Log.info("checkAndUpdateIndex() buildIndexForDoc");
					buildIndexForDoc(repos, doc, null, null, rt, 2, true);
				}
				else
				{
					//deleteAllIndexUnderDoc
					Log.info("checkAndUpdateIndex() delete all index for doc");
					deleteAllIndexForDoc(repos, doc, 2);
					//buildAllIndexForDoc
					Log.info("checkAndUpdateIndex() buildIndexForDoc");
					buildIndexForDoc(repos, doc, null, null, rt, 2, true);
				}
			}
			Log.info("**************************** checkAndUpdateIndex() 结束强制刷新Index for: " + doc.getDocId()  + " " + doc.getPath() + doc.getName() + " subDocSyncupFlag:" + subDocSyncupFlag);
			break;
		case SYNC:	    //只同步有改动的文件	
		case UNDEFINED:	//只同步有改动的文件
			if(scanOption.localChangesRootPath == null)
			{
				if(localChanges.size() > 0 || remoteChanges.size() > 0)
				{
					Log.info("**************************** checkAndUpdateIndex() 开始刷新Index for: " + doc.getDocId()  + " " + doc.getPath() + doc.getName() + " subDocSyncupFlag:" + subDocSyncupFlag);
					if(docDetect(repos, doc))
					{	
						HashMap<Long, Doc> doneList = new HashMap<Long, Doc>();
						Log.info("checkAndUpdateIndex() rebuildIndexForDoc");					
						rebuildIndexForDoc(repos, doc, remoteChanges, localChanges, doneList, rt, subDocSyncupFlag, false);	
					}
					Log.info("**************************** checkAndUpdateIndex() 结束刷新Index for: " + doc.getDocId()  + " " + doc.getPath() + doc.getName() + " subDocSyncupFlag:" + subDocSyncupFlag);
				}
			}
			else
			{
				if(isLocalChanged(localChanges, scanOption))
				{
					rebuildIndexForDocEx(repos, doc, scanOption.localChangesRootPath, rt);	
				}
			}
			break;
		case SYNCVerRepos:	//只同步版本仓库
			break;
		default:	//未知同步类型
			break;
		}
	}

	private boolean docDetect(Repos repos, Doc doc) {
		Log.debug("docDetect()");
		List<Doc> entryList =  docSysGetDocList(repos, doc, false);
		if(entryList != null)
		{
			return true;
		}
		return false;
	}
	
	private boolean deleteAllIndexForDoc(Repos repos, Doc doc) 
	{
		if(doc.getDocId() == 0)
		{
			deleteDocNameIndexLib(repos);
			deleteRDocIndexLib(repos);
			deleteVDocIndexLib(repos);
		}
		else
		{
			deleteAllIndexForDoc(repos, doc, 2);
		}
		return true;
	}
	
	private void deleteAllIndexForDoc(Repos repos, Doc doc, int deleteFlag) 
	{
		deleteIndexForDocName(repos, doc, deleteFlag);
		deleteIndexForRDoc(repos, doc, deleteFlag);
		deleteIndexForVDoc(repos, doc, deleteFlag);
	}

	public boolean buildIndexForDoc(Repos repos, Doc doc, HashMap<Long, DocChange> remoteChanges,
			HashMap<Long, DocChange> localChanges, ReturnAjax rt, Integer subDocSyncupFlag, boolean force) 
	{	
		if(force == false)
		{
			//强行添加Index
			addIndexForDocName(repos, doc);
			addIndexForRDoc(repos, doc);
			addIndexForVDoc(repos, doc);
			return true;
		}	
		
		//强行添加Index
		addIndexForDocName(repos, doc);
		addIndexForRDoc(repos, doc);
		addIndexForVDoc(repos, doc);			
		
		if(doc.getType() == null || doc.getType() != 2)
		{
			return true;
		}
		
		//子目录不递归
		if(subDocSyncupFlag == 0)
		{
			return true;
		}

		//子目录递归不继承
		if(subDocSyncupFlag == 1)
		{
			subDocSyncupFlag = 0;
		}
		
		List<Doc> entryList = docSysGetDocList(repos, doc, false);		
		if(entryList == null)
    	{
    		Log.debug("buildIndexForDoc() entryList 获取异常:");
        	return false;
    	}
    	
    	for(int i=0; i< entryList.size(); i++)
    	{
    		Doc subDoc = entryList.get(i);
    		subDoc.isRealDocTextSearchEnabled = doc.isRealDocTextSearchEnabled;
    		buildIndexForDoc(repos, subDoc, remoteChanges, localChanges, rt, subDocSyncupFlag, force);
    	}
		return true;
	}
	
	private boolean rebuildIndexForDoc(Repos repos, Doc doc, HashMap<Long, DocChange> remoteChanges,
			HashMap<Long, DocChange> localChanges, HashMap<Long, Doc> doneList, ReturnAjax rt, Integer subDocSyncupFlag, boolean force) 
	{	
		//Log.debug("rebuildIndexForDoc() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " subDocSyncupFlag:" + subDocSyncupFlag + " force:" + force);
		if(isDocInChangeList(doc, remoteChanges) || isDocInChangeList(doc, remoteChanges))
		{
			if(isDocInDoneList(doc, doneList))
			{
				return true;
			}
			
			Doc localDoc = docSysGetDoc(repos, doc, false);
			Doc indexDoc = indexGetDoc(repos, doc, INDEX_DOC_NAME, false);
			if(localDoc == null || localDoc.getType() == 0) //文件不存在则删除索引
			{
				//文件已被删除
				if(indexDoc == null)
				{
					Log.debug("rebuildIndexForDoc() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " 文件不存在，索引不存在");					
				}
				else
				{
					Log.debug("rebuildIndexForDoc() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " 文件不存在，索引存在，删除索引");
					deleteAllIndexForDoc(repos, doc, 2);
				}
			}
			else	//文件存在
			{
				//update the size and editTime
				doc.setType(localDoc.getType());
				doc.setSize(localDoc.getSize());
				doc.setLatestEditTime(localDoc.getLatestEditTime());

				if(indexDoc == null)	//索引不存在则添加索引
				{
					Log.debug("rebuildIndexForDoc() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " 文件存在，索引不存在，添加索引");
					addIndexForDocName(repos, doc);
					addIndexForRDoc(repos, doc);
					addIndexForVDoc(repos, doc);
					subDocSyncupFlag = 2;	//如果index不存在则强制修改索引递归标记
				}
				else if(force || isDocChanged(localDoc, indexDoc))
				{
					Log.debug("rebuildIndexForDoc() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " 文件变更，更新索引");
					deleteAllIndexForDoc(repos, doc, 1);								
					addIndexForDocName(repos, doc);
					addIndexForRDoc(repos, doc);
					addIndexForVDoc(repos, doc);
				}
			}
			addToDoneList(doc, doneList);
			
			if(localDoc.getType() != null && localDoc.getType() == 1)
			{
				//Log.debug("rebuildIndexForDoc() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " 是文件！");
				return true;
			}
			
		}
		
		//子目录不递归
		if(subDocSyncupFlag == 0)
		{
			//不递归的情况下只处理index不存在的清空
			if(localChanges != null)
			{
				//遍历localChanges，对LocalAdd进行建Index操作
				for (HashMap.Entry<Long, DocChange> entry : localChanges.entrySet()) 
				{
					DocChange docChange = entry.getValue();
					Doc localChangeDoc = docChange.getDoc();
					rebuildIndexForDoc(repos,localChangeDoc, null, null, doneList, rt, subDocSyncupFlag, force);
				}
			}
			if(remoteChanges != null)
			{
				//遍历remoteChanges，对LocalAdd进行建Index操作
				for (HashMap.Entry<Long, DocChange> entry : remoteChanges.entrySet()) 
				{
					DocChange docChange = entry.getValue();
					Doc remoteChangeDoc = docChange.getDoc();
					rebuildIndexForDoc(repos,remoteChangeDoc, null, null, doneList, rt, subDocSyncupFlag, force);
				}
			}	
			return true;
		}

		//子目录递归不继承
		if(subDocSyncupFlag == 1)
		{
			subDocSyncupFlag = 0;
		}
		
		//check if realDocTextSearchEnabled
		if(doc.isRealDocTextSearchEnabled == null)	//未知状态
		{
			doc.isRealDocTextSearchEnabled = isRealDocTextSearchEnabled(repos, doc, null);
		}
				
		List<Doc> entryList = docSysGetDocList(repos, doc, false);
		if(entryList == null)
    	{
    		Log.debug("refreshIndexForDoc() localEntryList 获取异常:");
        	return false;
    	}
    	
    	for(int i=0; i< entryList.size(); i++)
    	{
    		Doc subDoc = entryList.get(i);
    		subDoc.isRealDocTextSearchEnabled = isRealDocTextSearchEnabled(repos, subDoc, doc);
    		rebuildIndexForDoc(repos, subDoc, remoteChanges, localChanges, doneList, rt, subDocSyncupFlag, force);
    	}
		return true;
	}
	
	private void rebuildIndexForDocEx(Repos repos, Doc doc, String localChangesRootPath, ReturnAjax rt) {
		File file = new File(localChangesRootPath + doc.getPath() + doc.getName());
		rebuildIndexForDocEx(repos, doc, file, rt);
	}

	private void rebuildIndexForDocEx(Repos repos, Doc doc, File file, ReturnAjax rt) {
		if(doc.getDocId() != 0)
		{	
			Doc localDoc = fsGetDoc(repos, doc);
			if(localDoc == null)
			{
				Log.info("rebuildIndexForDocEx() failed to get localDoc");
				return;
			}
			
			if(localDoc.getType() == 0)
			{
				Log.debug("rebuildIndexForDocEx() localDoc not exists, do delete all index for doc:" + doc.getPath() + doc.getName());
				deleteAllIndexForDoc(repos, doc, 2);
				return;
			}
			
			Doc indexDoc = indexGetDoc(repos, doc, INDEX_DOC_NAME, false);
			if(indexDoc == null)
			{
				//delete and rebuild all index
				Log.debug("rebuildIndexForDocEx() indexDoc == null, do rebuild all index for doc:" + doc.getPath() + doc.getName());
				deleteAllIndexForDoc(repos, doc, 2);
				buildIndexForDoc(repos, doc, null, null, rt, 2, true);
				return;
			}
			
			if(indexDoc.getType() != localDoc.getType())
			{
				//delete and rebuild all index
				Log.debug("rebuildIndexForDocEx() docType changed, do rebuild all index for doc:" + doc.getPath() + doc.getName());
				deleteAllIndexForDoc(repos, doc, 2);
				buildIndexForDoc(repos, doc, null, null, rt, 2, true);
				return;
			}
				
			//if it is file do update
			if(localDoc.getType() != 2)
			{
				Log.debug("rebuildIndexForDocEx() doc Changed, do rebuild all index for doc:" + doc.getPath() + doc.getName());
				deleteAllIndexForDoc(repos, doc, 2);
				buildIndexForDoc(repos, doc, null, null, rt, 2, true);
				return;
			}
		}
		
		//Update the subDocs
		String reposPath = Path.getReposPath(repos);
		String localRootPath = doc.getLocalRootPath();
		String localVRootPath = doc.getLocalVRootPath();
		String subDocParentPath = getSubDocParentPath(doc);
		Integer subDocLevel = getSubDocLevel(doc);

		File[] list = file.listFiles();
		for(int i=0; i<list.length; i++)
		{
			File subFile = list[i];
			Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(), reposPath, subDocParentPath, subFile.getName(), subDocLevel, null, true, localRootPath, localVRootPath, null, "", doc.offsetPath);
			rebuildIndexForDocEx(repos, subDoc, subFile, rt);
		}
	}

	private boolean isDocChanged(Doc localDoc, Doc indexDoc) {
		if(localDoc == null || indexDoc == null)
		{
			return false;
		}
		
		if(localDoc.getType() == null || localDoc.getSize() == null || localDoc.getLatestEditTime() == null)
		{
			//无效localDoc信息
			return false;
		}
		
		if(localDoc.getType() != 1)
		{
			//只有文件才检查是否改动
			return false;
		}
		
		if(indexDoc.getType() == null || indexDoc.getSize() == null || indexDoc.getLatestEditTime() == null)
		{
			//index信息无效
			return true;
		}
		
		
		if(indexDoc.getType() != localDoc.getType() || !indexDoc.getSize().equals(localDoc.getSize()) ||  !indexDoc.getLatestEditTime().equals(localDoc.getLatestEditTime()))
		{
			//文件有改动
			return true;
		}
		
		return false;
	}

	private void addToDoneList(Doc doc, HashMap<Long, Doc> doneList) {
		if(doneList == null)
		{
			return;
		}
		
		doneList.put(doc.getDocId(), doc);
	}

	private boolean isDocInDoneList(Doc doc, HashMap<Long, Doc> doneList) {
		if(doneList == null)
		{
			return true;
		}
		
		if(doneList.get(doc.getDocId()) != null)
		{
			return true;	
		}
		return false;
	}

	private boolean isDocInChangeList(Doc doc, HashMap<Long, DocChange> docChanges) 
	{
		if(docChanges == null)
		{
			return true;
		}
		
		if(docChanges.get(doc.getDocId()) != null)
		{
			return true;	
		}
		return false;
	}

	private boolean syncupRemoteChanges_FSM(Repos repos, User login_user, HashMap<Long, DocChange> remoteChanges, ReturnAjax rt) 
	{
		for(DocChange docChange: remoteChanges.values())
	    {
			syncUpRemoteChange_FSM(repos, docChange, login_user, rt);
	    }
		return true;
	}
	
	private boolean syncupRemoteChangesEx_FSM(Repos repos, User login_user, Doc doc, String remoteChangesRootPath, ReturnAjax rt) 
	{
		File file = new File(remoteChangesRootPath + doc.getPath() + doc.getName());
		syncUpRemoteChangeEx_FSM(repos, doc, file, login_user, rt);
		return true;
	}

	private void syncUpRemoteChangeEx_FSM(Repos repos, Doc doc, File file, User login_user, ReturnAjax rt) {
		if(doc.getDocId() != 0)
		{
    		Doc localDoc = fsGetDoc(repos, doc);
			Doc remoteDoc = verReposGetDoc(repos, doc, null);
			DocChange docChange = new DocChange();
			
			//localDoc not exists
			if(localDoc == null || localDoc.getType() == 0)
			{
				if(remoteDoc == null || remoteDoc.getType() == 0)
				{
					//There is no change
					return;
				}
				
				docChange.setType(DocChangeType.REMOTEADD);
				docChange.setDoc(remoteDoc);
				docChange.setLocalEntry(localDoc);
				docChange.setRemoteEntry(remoteDoc);
				syncUpRemoteChange_FSM(repos, docChange, login_user, rt);
				return;
			}
			
			//localDoc exists
			if(remoteDoc == null || remoteDoc.getType() == 0)
			{
				docChange.setType(DocChangeType.REMOTEDELETE);
				docChange.setDoc(localDoc);
				docChange.setLocalEntry(localDoc);
				docChange.setRemoteEntry(remoteDoc);
				syncUpRemoteChange_FSM(repos, docChange, login_user, rt);
				return;			
			}
			
			//localDoc is File and remoteDoc exists 
			if(localDoc.getType() == 1)
			{
				if(remoteDoc.getType() == 1)
				{
					docChange.setType(DocChangeType.REMOTECHANGE);
					docChange.setDoc(localDoc);
					docChange.setLocalEntry(localDoc);
					docChange.setRemoteEntry(remoteDoc);
					syncUpRemoteChange_FSM(repos, docChange, login_user, rt);
					return;
				}
				
				docChange.setType(DocChangeType.REMOTEFILETODIR);
				docChange.setDoc(localDoc);
				docChange.setLocalEntry(localDoc);
				docChange.setRemoteEntry(remoteDoc);
				syncUpRemoteChange_FSM(repos, docChange, login_user, rt);
				return;
			}
			
			//localDoc is Folder and remoteDoc is File
			if(remoteDoc.getType() == 1)
			{
				docChange.setType(DocChangeType.REMOTEDIRTOFILE);
				docChange.setDoc(localDoc);
				docChange.setLocalEntry(localDoc);
				docChange.setRemoteEntry(remoteDoc);
				syncUpRemoteChange_FSM(repos, docChange, login_user, rt);
				return;
			}
		}
		
		String reposPath = Path.getReposPath(repos);
		String localRootPath = doc.getLocalRootPath();
		String localVRootPath = doc.getLocalVRootPath();
		String subDocParentPath = getSubDocParentPath(doc);
		Integer subDocLevel = getSubDocLevel(doc);

		File[] list = file.listFiles();
		for(int i=0; i<list.length; i++)
		{
			File subEntry = list[i];
			Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(), reposPath, subDocParentPath, subEntry.getName(), subDocLevel, null, true, localRootPath, localVRootPath, null, "", doc.offsetPath);
			syncUpRemoteChangeEx_FSM(repos, subDoc, subEntry, login_user, rt);
		}
	}

	private boolean syncupLocalChanges_FSM(Repos repos, Doc doc, String commitMsg, String commitUser, User login_user, HashMap<Long, DocChange> localChanges, Integer subDocSyncupFlag, ReturnAjax rt) 
	{
		//本地有改动需要提交
		Log.info("syncupLocalChanges_FSM() 本地有改动: [" + doc.getPath()+doc.getName() + "], do Commit");
		if(commitMsg == null)
		{
			commitMsg = "自动同步 ./" +  doc.getPath()+doc.getName();
		}
		if(commitUser == null)
		{
			commitUser = login_user.getName();
		}
		
		//LockDoc
		DocLock docLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		String lockInfo = "syncupLocalChanges_FSM() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
		docLock = lockDoc(doc, lockType, 1*60*60*1000,login_user,rt,true,lockInfo); //2 Hours 2*60*60*1000 = 86400,000
		
		if(docLock == null)
		{
			docSysDebugLog("syncupLocalChanges_FSM() Failed to lock Doc: " + doc.getName(), rt);
			Log.info("syncupLocalChanges_FSM() 文件已被锁定:" + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "]");
			return false;
		}
		
		List<CommitAction> commitActionList = new ArrayList<CommitAction>();
		String revision = verReposDocCommit(repos, false, doc, commitMsg, commitUser, rt, true, localChanges, subDocSyncupFlag, commitActionList);
		if(revision == null)
		{
			Log.info("syncupLocalChanges_FSM() 本地改动Commit失败:" + revision);
			unlockDoc(doc, lockType, login_user);
			return false;
		}
		//推送到远程仓库
		verReposPullPush(repos, true, rt);
		
		if(commitActionList.size() > 0)
		{
			for(int i=0; i<commitActionList.size(); i++)
			{
				CommitAction commitAction = commitActionList.get(i);
				if(commitAction.getResult())
				{
					Doc commitDoc = commitActionList.get(i).getDoc();
					Log.printObject("syncupLocalChanges_FSM() dbUpdateDoc commitDoc: ", commitDoc);						
					//需要根据commitAction的行为来决定相应的操作
					commitDoc.setRevision(revision);
					commitDoc.setLatestEditorName(login_user.getName());
					dbUpdateDoc(repos, commitDoc, true);				
					dbCheckAddUpdateParentDoc(repos, commitDoc, null, null);
				}
			}			
			dbUpdateDocRevision(repos, doc, revision);
		}
		
		//将localChanges中的版本号更新为文件的最新版本
		updateLocalChangesRevision(repos, localChanges);
		
		Log.info("syncupLocalChanges_FSM() 本地改动更新完成:" + revision);
		unlockDoc(doc, lockType, login_user);
		
		return true;	
	}
	

	private void updateLocalChangesRevision(Repos repos, HashMap<Long, DocChange> localChanges) {
		if(localChanges != null)
		{
			for (HashMap.Entry<Long, DocChange> entry : localChanges.entrySet())
			{
				DocChange docChange = entry.getValue();
				Doc localChangeDoc = docChange.getDoc();
				String latestRevison = verReposGetLatestRevision(repos, true, localChangeDoc);
				localChangeDoc.setRevision(latestRevison);
				dbUpdateDoc(repos, localChangeDoc, true);
			}
		}
	}
	
	private boolean syncupLocalChangesEx_FSM(Repos repos, Doc doc, String commitMsg, String commitUser, User login_user, String localChangesRootPath, Integer subDocSyncupFlag, ReturnAjax rt) 
	{
		//本地有改动需要提交
		Log.info("syncupLocalChanges_FSM() 本地有改动: [" + doc.getPath()+doc.getName() + "], do Commit");
		if(commitMsg == null)
		{
			commitMsg = "自动同步 ./" +  doc.getPath()+doc.getName();
		}
		if(commitUser == null)
		{
			commitUser = login_user.getName();
		}
		
		//LockDoc
		DocLock docLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		String lockInfo = "syncupLocalChangesEx_FSM() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
		docLock = lockDoc(doc, lockType, 1*60*60*1000,login_user,rt,true,lockInfo); //2 Hours 2*60*60*1000 = 86400,000
		
		if(docLock == null)
		{
			docSysDebugLog("syncupLocalChangesEx_FSM() Failed to lock Doc: " + doc.getName(), rt);
			Log.info("syncupLocalChangesEx_FSM() 文件已被锁定:" + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "]");
			return false;
		}
		
		List<CommitAction> commitActionList = new ArrayList<CommitAction>();
		String revision = verReposDocCommitEx(repos, false, doc, commitMsg, commitUser, rt, true, localChangesRootPath, subDocSyncupFlag, commitActionList);
		if(revision == null)
		{
			Log.info("syncupLocalChangesEx_FSM() 本地改动Commit失败:" + revision);
			unlockDoc(doc, lockType, login_user);
			return false;
		}
		//推送到远程仓库
		verReposPullPush(repos, true, rt);
		
		if(commitActionList.size() > 0)
		{
			for(int i=0; i<commitActionList.size(); i++)
			{
				CommitAction commitAction = commitActionList.get(i);
				if(commitAction.getResult())
				{
					Doc commitDoc = commitActionList.get(i).getDoc();
					Log.printObject("syncupLocalChangesEx_FSM() dbUpdateDoc commitDoc: ", commitDoc);						
					//需要根据commitAction的行为来决定相应的操作
					commitDoc.setRevision(revision);
					commitDoc.setLatestEditorName(login_user.getName());
					dbUpdateDoc(repos, commitDoc, true);				
					dbCheckAddUpdateParentDoc(repos, commitDoc, null, null);
				}
			}			
			dbUpdateDocRevision(repos, doc, revision);
		}
		
		//将localChanges中的版本号更新为文件的最新版本
		updateLocalChangesRevisionEx(repos, doc, localChangesRootPath);
		
		Log.info("syncupLocalChangesEx_FSM() 本地改动更新完成:" + revision);
		unlockDoc(doc, lockType, login_user);
		
		return true;	
	}

	private void updateLocalChangesRevisionEx(Repos repos, Doc doc, String localChangesRootPath) {
		File file = new File(localChangesRootPath + doc.getPath() + doc.getName());
		updateLocalChangesRevisionEx(repos, doc, file);
	}
	
	private void updateLocalChangesRevisionEx(Repos repos, Doc doc, File file) {
		if(doc.getDocId() != 0)
		{
			Doc localDoc = fsGetDoc(repos, doc);
			if(localDoc == null)
			{
				Log.info("updateLocalChangesRevisionEx() localDoc is null:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
				return;
			}
		
			if(localDoc.getType() == 0)
			{
				//这次commit是一个删除操作
				Log.debug("updateLocalChangesRevisionEx() localDoc was deleted:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
				dbDeleteDoc(repos, doc, true);
				return;
			}
		
			String latestRevison = verReposGetLatestRevision(repos, true, localDoc);
			localDoc.setRevision(latestRevison);
		
			Doc dbDoc = dbGetDoc(repos, doc, false);
			if(dbDoc == null)
			{
				Log.debug("updateLocalChangesRevisionEx() localDoc was added:" + localDoc.getDocId() + " " + localDoc.getPath() + localDoc.getName()); 
				dbAddDoc(repos, localDoc, true, true);
				return;
			}
		
			if(dbDoc.getType() != localDoc.getType())
			{
				Log.debug("updateLocalChangesRevisionEx() docType was changed:" + localDoc.getDocId() + " " + localDoc.getPath() + localDoc.getName()); 
				if(dbDeleteDoc(repos, dbDoc, true) == false)
				{
					Log.debug("updateLocalChangesRevisionEx() failed to delete dbDoc:" + localDoc.getDocId() + " " + localDoc.getPath() + localDoc.getName()); 
					return;
				}
				dbAddDoc(repos, localDoc, true, false);
				return;
			}
			
			if(localDoc.getType() != 2)
			{
				dbUpdateDoc(repos, localDoc, false);
				return;
			}
		}

		//update subDocs
		String reposPath = Path.getReposPath(repos);
		String localRootPath = doc.getLocalRootPath();
		String localVRootPath = doc.getLocalVRootPath();
		String subDocParentPath = getSubDocParentPath(doc);
		Integer subDocLevel = getSubDocLevel(doc);

		File[] list = file.listFiles();
		for(int i=0; i<list.length; i++)
		{
			File subEntry = list[i];
			Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(), reposPath, subDocParentPath, subEntry.getName(), subDocLevel, null, true, localRootPath, localVRootPath, null, "", doc.offsetPath);
			updateLocalChangesRevisionEx(repos, subDoc, subEntry);
		}
	}

	private boolean syncupForDocChange_NoFS(Repos repos, Doc doc, User login_user, ReturnAjax rt, int subDocSyncFlag) 
	{
		Doc remoteEntry = verReposGetDoc(repos, doc, null);
		if(remoteEntry == null)
		{
			docSysDebugLog("syncupForDocChange_NoFS() remoteEntry is null for " + doc.getPath()+doc.getName() + ", 无法同步！", rt);
			return true;
		}
		
		Log.printObject("syncupForDocChange_NoFS() remoteEntry: ", remoteEntry);
		
		Doc dbDoc = dbGetDoc(repos, doc, false);
		Log.printObject("syncupForDocChange_NoFS() dbDoc: ", dbDoc);

		
		DocChangeType remoteChangeType = getRemoteChangeType(repos, doc, dbDoc, remoteEntry);
		if(remoteChangeType != DocChangeType.NOCHANGE)
		{
			//LockDoc
			DocLock docLock = null;
			int lockType = DocLock.LOCK_TYPE_FORCE;
			String lockInfo = "syncupForDocChange() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
			docLock = lockDoc(doc, lockType, 1*60*60*1000,login_user,rt,true,lockInfo); //2 Hours 2*60*60*1000 = 86400,000
			
			if(docLock == null)
			{
				docSysDebugLog("syncupForDocChange() Failed to lock Doc: " + doc.getName(), rt);
				return false;
			}
			
			boolean ret = syncUpForRemoteChange_NoFS(repos, dbDoc, remoteEntry, login_user, rt, remoteChangeType);
			unlockDoc(doc, lockType, login_user);
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
	    
	    List<Doc> remoteEntryList = getVerReposEntryList(repos, doc);
	    //Log.printObject("SyncUpSubDocs_FSM() remoteEntryList:", remoteEntryList);
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
    	
    	String latestRevision = verReposGetLatestRevision(repos, false, doc);
        Log.debug("isRemoteDocChanged() latestRevision:" + latestRevision + " doc:" + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "]");
        Log.debug("isRemoteDocChanged() previoRevision:" + dbDoc.getRevision());
        
        if(latestRevision == null || dbDoc.getRevision().equals(latestRevision) == false)
        {
        	return true;
        }
    	
    	return false;
	}

	private boolean syncUpForRemoteChange_NoFS(Repos repos, Doc doc, Doc remoteEntry, User login_user, ReturnAjax rt, DocChangeType remoteChangeType) 
	{
		switch(remoteChangeType)
		{
		case REMOTEADD:
			Log.debug("syncUpForRemoteChange_NoFS() remote Added: " + doc.getPath()+doc.getName());
			return dbAddDoc(repos, remoteEntry, false, false);
		case REMOTEFILETODIR:
		case REMOTEDIRTOFILE:
			Log.debug("syncUpForRemoteChange_NoFS() remote Type Changed: " + doc.getPath()+doc.getName());
			dbDeleteDoc(repos, doc,true);
			return dbAddDoc(repos, remoteEntry, true, false);
		case REMOTECHANGE:
			Log.debug("syncUpForRemoteChange_NoFS() remote File Changed: " + doc.getPath()+doc.getName());
			doc.setRevision(remoteEntry.getRevision());
			return dbUpdateDoc(repos, doc, true);
		case REMOTEDELETE:
			//Remote Deleted
			Log.debug("syncUpForRemoteChange_NoFS() remote Deleted: " + doc.getPath()+doc.getName());
			return dbDeleteDoc(repos, doc, true);
		default:
			break;
		}
		
		return true;
	}
	
	protected String buildChangeInfo(HashMap<Long, DocChange> ChangeList) 
	{
		String changeInfo = "";
		if(ChangeList == null || ChangeList.size() == 0)
		{
			return "";
		}

		for(DocChange docChange: ChangeList.values())
	    {
			Doc doc = docChange.getDoc();
			switch(docChange.getType())
			{
			case LOCALADD:	//localAdd
				changeInfo += "本地新增 " + doc.getPath() + doc.getName() + "</br>";
				break;
			case LOCALDELETE: 	//localDelete
				changeInfo += "本地删除 " + doc.getPath() + doc.getName() + "</br>";
				break;
			case LOCALCHANGE: 	//localFileChanged
				changeInfo += "本地修改 " + doc.getPath() + doc.getName() + "</br>";
				break;
			case LOCALFILETODIR:	//localTypeChanged(From File to Dir)
				changeInfo += "本地文件类型变动(文件->目录) " + doc.getPath() + doc.getName() + "</br>";
				break;
			case LOCALDIRTOFILE:	//localTypeChanged(From Dir to File)
				changeInfo += "本地文件类型变动(目录->文件) " + doc.getPath() + doc.getName() + "</br>";
				break;
			//由于远程同步需要直接修改或删除本地文件，一旦误操作将无法恢复，必须保证删除修改操作的文件的历史已经在版本仓库中
			case REMOTEDELETE:	//remoteDelete
				changeInfo += "远程删除 " + doc.getPath() + doc.getName() + "</br>";
				break;
			case REMOTECHANGE:	//remoteFileChanged
				changeInfo += "远程修改 " + doc.getPath() + doc.getName() + "</br>";
				break;
			case REMOTEFILETODIR:	//remoteTypeChanged(From File To Dir)
				changeInfo += "远程文件类型变动(文件->目录) " + doc.getPath() + doc.getName() + "</br>";
				break;
			case REMOTEDIRTOFILE:	//remoteTypeChanged(From Dir To File)
				changeInfo += "远程文件类型变动(目录->文件) " + doc.getPath() + doc.getName() + "</br>";
				break;
			case REMOTEADD:	//remoteAdd
				changeInfo += "远程新增 " + doc.getPath() + doc.getName() + "</br>";
			case NOCHANGE:		//no change
				break;
			default:
				changeInfo += "未知变动(" +docChange.getType() + ") "  + doc.getPath() + doc.getName() + "</br>";
				break;
			}		
		}
		return changeInfo;
	}
	
	protected String buildChangeReminderInfo(HashMap<Long, DocChange> ChangeList) 
	{
		String changeInfo = "";
		if(ChangeList == null || ChangeList.size() == 0)
		{
			return "";
		}

		int count = ChangeList.size();
		for(DocChange docChange: ChangeList.values())
	    {
			Doc doc = docChange.getDoc();
			if(count == 1)
			{
				changeInfo = doc.getPath() + doc.getName() + " 有改动！";
			}
			else
			{
				changeInfo = doc.getPath() + doc.getName() + " 等" + count +"个文件有改动！";				
			}		
			break;
		}
		
		return changeInfo;
	}
	
	protected boolean syncupScanForDoc_FSM(Repos repos, Doc doc, Doc dbDoc, Doc localEntry, Doc remoteEntry, User login_user, ReturnAjax rt, 
			HashMap<Long, DocChange> remoteChanges, HashMap<Long, DocChange> localChanges, 
			int subDocSyncFlag, 
			ScanOption scanOption) 
	{
		//Log.printObject("syncupScanForDoc_FSM() " + doc.getDocId() + " " + doc.getPath() + doc.getName() + " ", doc);

		if(doc.getDocId() == 0)	//For root dir, go syncUpSubDocs
		{
			Log.debug("syncupScanForDoc_FSM() 扫描根目录 subDocSyncFlag:" + subDocSyncFlag + " scanType:" + scanOption.scanType);			
			return syncupScanForSubDocs_FSM(repos, doc, login_user, rt, remoteChanges, localChanges, subDocSyncFlag, scanOption);
		}
		
		if(repos.getVerCtrl() == 2)
		{
			if(doc.getName().equals(".git"))
			{
				Log.debug("syncupScanForDoc_FSM() .git was ignored");		
				return true;
			}
		}
		
		if(isVersionIgnored(repos, doc, false) == true)
		{
			Log.debug("syncupScanForDoc_FSM() version was ignored for doc:" + doc.getPath() + doc.getName());		
			return true;
		}
		
		DocChangeType docChangeType = DocChangeType.UNDEFINED;
		switch(scanOption.scanType)
		{
		case 1: //syncLocalChangeOnly
			docChangeType = getLocalDocChangeType(dbDoc, localEntry);
			break;
		case 2: //syncLocalChangeOnly
			docChangeType = getLocalDocChangeType(dbDoc, localEntry);
			//treatRevisionNullAsLocalChange
			if(docChangeType == DocChangeType.NOCHANGE)
			{
				if(dbDoc != null && (dbDoc.getRevision() == null || dbDoc.getRevision().isEmpty()))
				{
					docChangeType = DocChangeType.LOCALCHANGE;
				}
			}
			break;
		case 3: //标准模式
			docChangeType = getDocChangeType_FSM(repos, doc, dbDoc, localEntry, remoteEntry);
			break;
		case 4:
			docChangeType = getDocChangeType_FSM(repos, doc, dbDoc, localEntry, remoteEntry);
			//treatRemoteChangesAsLocalChange
			switch(docChangeType)
			{
			case REMOTEADD:	//remoteAdd
			case REMOTEDELETE:	//remoteDelete
			case REMOTECHANGE:	//remoteFileChanged
			case REMOTEFILETODIR:	//remoteTypeChanged(From File To Dir)
			case REMOTEDIRTOFILE:	//remoteTypeChanged(From Dir To File)
				docChangeType = getLocalDocChangeTypeWithRemoteDoc(localEntry, remoteEntry);
				break;
			default:
				break;
			}
			break;
		}
		
		switch(docChangeType)
		{
		case LOCALADD:	//localAdd
		case LOCALDELETE: 	//localDelete
		case LOCALCHANGE: 	//localFileChanged
		case LOCALFILETODIR:	//localTypeChanged(From File to Dir)
		case LOCALDIRTOFILE:	//localTypeChanged(From Dir to File)
			DocChange localChange = new DocChange();
			localChange.setDoc(doc);
			localChange.setDbDoc(dbDoc);
			localChange.setLocalEntry(localEntry);
			localChange.setRemoteEntry(remoteEntry);
			localChange.setType(docChangeType);
			insertLocalChange(doc, localChanges, localChange, scanOption);
			//Log.debug("syncupScanForDoc_FSM() docChangeType: " + localChange.getType() + " docId:" + doc.getDocId() + " docPath:" +doc.getPath() + doc.getName());
			return true;
		//由于远程同步需要直接修改或删除本地文件，一旦误操作将无法恢复，必须保证删除修改操作的文件的历史已经在版本仓库中
		case REMOTEDELETE:	//remoteDelete
		case REMOTECHANGE:	//remoteFileChanged
		case REMOTEFILETODIR:	//remoteTypeChanged(From File To Dir)
		case REMOTEDIRTOFILE:	//remoteTypeChanged(From Dir To File)
			//对应的commit上如果并没有对应的文件，那么实际上并不是远程删除操作，而是本地有改动
			if(isDocInVerRepos(repos, doc, dbDoc.getRevision()) == false)
			{
				//Log.debug("syncupForDocChange_FSM() " + doc.getPath()+doc.getName() + " not exists in verRepos at revision:" + dbDoc.getRevision() + " treat it as LOCALCHANGE");
				DocChange localChange1 = new DocChange();
				localChange1.setDoc(doc);
				localChange1.setDbDoc(dbDoc);
				localChange1.setLocalEntry(localEntry);
				localChange1.setRemoteEntry(remoteEntry);
				localChange1.setType(DocChangeType.LOCALCHANGE);	//LOCALCHANGE才能保证在AutoCommit的时候正常工作
				insertLocalChange(dbDoc, localChanges, localChange1, scanOption);
				//Log.debug("syncupScanForDoc_FSM() docChangeType: " + localChange1.getType() + " docId:" + doc.getDocId() + " docPath:" +doc.getPath() + doc.getName());
				return true;
			}
			DocChange remoteChange = new DocChange();
			remoteChange.setDoc(doc);
			remoteChange.setDbDoc(dbDoc);
			remoteChange.setLocalEntry(localEntry);
			remoteChange.setRemoteEntry(remoteEntry);
			remoteChange.setType(docChangeType);
			remoteChanges.put(doc.getDocId(), remoteChange);
			insertRemoteChange(doc, remoteChanges, remoteChange, scanOption);
			//Log.debug("syncupScanForDoc_FSM() docChangeType: " + remoteChange.getType() + " docId:" + doc.getDocId() + " docPath:" +doc.getPath() + doc.getName());
			return true;
		case REMOTEADD:	//remoteAdd
			DocChange remoteChange1 = new DocChange();
			remoteChange1.setDoc(doc);
			remoteChange1.setDbDoc(dbDoc);
			remoteChange1.setLocalEntry(localEntry);
			remoteChange1.setRemoteEntry(remoteEntry);
			remoteChange1.setType(docChangeType);
			remoteChanges.put(doc.getDocId(), remoteChange1);
			insertRemoteChange(doc, remoteChanges, remoteChange1, scanOption);
			//Log.debug("syncupScanForDoc_FSM() docChangeType: " + remoteChange.getType() + " docId:" + doc.getDocId() + " docPath:" +doc.getPath() + doc.getName());
			return true;
		case NOCHANGE:		//no change
			if(dbDoc != null && dbDoc.getType() == 2)
			{
				return syncupScanForSubDocs_FSM(repos, doc, login_user, rt, remoteChanges, localChanges, subDocSyncFlag, scanOption);
			}
			return true;
		default:
			break;
		}		
		return false;
	}

	private boolean isVersionIgnored(Repos repos, Doc doc, boolean parentCheck) {
		if(repos.versionIgnoreConfig.versionIgnoreHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			Log.debug("isVersionIgnored() version was ignored for [/" + doc.getPath() + doc.getName() + "]");
			return true;
		}
		
		if(parentCheck == false)
		{
			return false;
		}
		
		//check if version ignore for root doc
		if(repos.versionIgnoreConfig.versionIgnoreHashMap.get("/") != null)
		{
			Log.debug("isVersionIgnored() version was ignored for [/]");
			return true;
		}
		
		//check if parent was version ignored 
		if(doc.getPath() != null)
		{
			String [] paths = doc.getPath().split("/");
			String path = "/" + paths[0];
			if(repos.versionIgnoreConfig.versionIgnoreHashMap.get(path) != null)
			{
				Log.debug("isVersionIgnored() version was ignored:" + path);
				return true;
			}
			
			for(int i = 1; i < paths.length; i++)
			{
				path = path + "/" + paths[i];
				if(repos.versionIgnoreConfig.versionIgnoreHashMap.get(path) != null)
				{
					Log.debug("isVersionIgnored() version was ignored:" + path);
					return true;
				}
			}			
		}
		return false;
	}

	private void insertLocalChange(Doc doc, HashMap<Long, DocChange> localChanges, DocChange localChange, ScanOption scanOption) {
		if(scanOption.localChangesRootPath == null)
		{
			localChanges.put(doc.getDocId(), localChange);
		}
		else
		{
			File node = new File(scanOption.localChangesRootPath + doc.getPath() + doc.getName());
			node.mkdirs();
		}	
	}
	
	private void insertRemoteChange(Doc doc, HashMap<Long, DocChange> remoteChanges, DocChange remoteChange, ScanOption scanOption) {
		if(scanOption.remoteChangesRootPath == null)
		{
			remoteChanges.put(doc.getDocId(), remoteChange);
		}
		else
		{
			File node = new File(scanOption.remoteChangesRootPath + doc.getPath() + doc.getName());
			node.mkdirs();
		}	
	}

	private boolean isDocInVerRepos(Repos repos, Doc doc, String commitId) {
		
		if(commitId == null || commitId.isEmpty())
		{
			return false;
		}
				
		Integer type = verReposCheckPath(repos, false, doc, commitId);
		if(type == null || type <= 0)
		{
			return false;
		}
		
		return true;
	}
	
	//确定Doc localChangeType
	protected static DocChangeType getLocalDocChangeType(Doc dbDoc, Doc localEntry) 
	{						
		if(dbDoc == null)
		{
			if(localEntry == null || localEntry.getType() == null || localEntry.getType() == 0)
			{
				//Log.debug("getLocalDocChangeType " + DocChangeType.NOCHANGE); 
				return DocChangeType.NOCHANGE;
			}
			
			if(localEntry.getType() == 1 || localEntry.getType() == 2)
			{
				Log.debug("getLocalDocChangeType " + localEntry.getPath() + localEntry.getName() + " " + DocChangeType.LOCALADD); 
				return DocChangeType.LOCALADD;
			}

			Log.debug("getLocalDocChangeType " + localEntry.getPath() + localEntry.getName() + " " +DocChangeType.UNDEFINED); 
			return DocChangeType.UNDEFINED;
		}
		
		//dbDoc存在，localEntry不存在
		if(localEntry == null || localEntry.getType() == null || localEntry.getType() == 0)
		{
			Log.debug("getLocalDocChangeType " + dbDoc.getPath() + dbDoc.getName() + " " +DocChangeType.LOCALDELETE); 
			return DocChangeType.LOCALDELETE;
		}
		
		//dbDoc存在，localEntry存在且是文件
		if(localEntry.getType() == 1)
		{
			if(dbDoc.getType() == 2)
			{
				Log.debug("getLocalDocChangeType " +  localEntry.getPath() + localEntry.getName() + " " + DocChangeType.LOCALDIRTOFILE); 
				return DocChangeType.LOCALDIRTOFILE;
			}
			
			if(dbDoc.getSize() == null || localEntry.getSize() == null || !dbDoc.getSize().equals(localEntry.getSize()) ||
				dbDoc.getLatestEditTime() == null || localEntry.getLatestEditTime() == null ||!dbDoc.getLatestEditTime().equals(localEntry.getLatestEditTime()))
			{
				Log.debug("getLocalDocChangeType " +  localEntry.getPath() + localEntry.getName() + " " + DocChangeType.LOCALCHANGE); 
				return DocChangeType.LOCALCHANGE;
			}	
			//Log.debug("getLocalDocChangeType "  + localEntry.getPath() + localEntry.getName() + " " + DocChangeType.NOCHANGE); 
			return DocChangeType.NOCHANGE;
		}
		
		//dbDoc存在，localDoc存在且是目录
		if(localEntry.getType() == 2)
		{
			if(dbDoc.getType() == 1)
			{
				Log.debug("getLocalDocChangeType "  + localEntry.getPath() + localEntry.getName() + " " + DocChangeType.LOCALFILETODIR); 
				return DocChangeType.LOCALFILETODIR;
			}		
			//Log.debug("getLocalDocChangeType "  + localEntry.getPath() + localEntry.getName() + " " + DocChangeType.NOCHANGE); 
			return DocChangeType.NOCHANGE;
		}
		
		//未知文件类型(localDoc.type !=1/2)
		Log.debug("getLocalDocChangeType "  + localEntry.getPath() + localEntry.getName() + " " + DocChangeType.UNDEFINED); 
		return DocChangeType.UNDEFINED;
	}
	
	/* Function: 
	 * 		According lcoalEntry and remoteEntry info to determine the Doc localChangeType
	 * Attention: 
	 * 		This interface can not realy decide the file modification case, so it should be called after there is really remtoteChanged 
	*/
	protected static DocChangeType getLocalDocChangeTypeWithRemoteDoc(Doc localEntry, Doc remoteDoc) 
	{						
		//remoteDoc不存在
		if(remoteDoc == null || remoteDoc.getType() == null || remoteDoc.getType() == 0)
		{
			if(localEntry == null || localEntry.getType() == null || localEntry.getType() == 0)
			{
				Log.debug("getLocalDocChangeTypeWithRemoteDoc " + DocChangeType.NOCHANGE); 
				return DocChangeType.NOCHANGE;
			}
			
			if(localEntry.getType() == 1 || localEntry.getType() == 2)
			{
				Log.debug("getLocalDocChangeTypeWithRemoteDoc " + localEntry.getPath() + localEntry.getName() + " " + DocChangeType.LOCALADD); 
				return DocChangeType.LOCALADD;
			}

			Log.debug("getLocalDocChangeTypeWithRemoteDoc " + localEntry.getPath() + localEntry.getName() + " " +DocChangeType.UNDEFINED); 
			return DocChangeType.UNDEFINED;
		}
		
		//remoteDoc存在，localEntry不存在
		if(localEntry == null || localEntry.getType() == null || localEntry.getType() == 0)
		{
			Log.debug("getLocalDocChangeTypeWithRemoteDoc " + remoteDoc.getPath() + remoteDoc.getName() + " " +DocChangeType.LOCALDELETE); 
			return DocChangeType.LOCALDELETE;
		}
		
		//remoteDoc存在，localEntry存在且是文件
		if(localEntry.getType() == 1)
		{
			if(remoteDoc.getType() == 2)
			{
				Log.debug("getLocalDocChangeTypeWithRemoteDoc " +  localEntry.getPath() + localEntry.getName() + " " + DocChangeType.LOCALDIRTOFILE); 
				return DocChangeType.LOCALDIRTOFILE;
			}
			//localDoc和remoteDoc文件信息无法比较，直接指定未本地修改
			Log.debug("getLocalDocChangeTypeWithRemoteDoc " +  localEntry.getPath() + localEntry.getName() + " " + DocChangeType.LOCALCHANGE); 
				return DocChangeType.LOCALCHANGE;
		}
		
		//remoteDoc存在，localDoc存在且是目录
		if(localEntry.getType() == 2)
		{
			if(remoteDoc.getType() == 1)
			{
				Log.debug("getLocalDocChangeTypeWithRemoteDoc "  + localEntry.getPath() + localEntry.getName() + " " + DocChangeType.LOCALFILETODIR); 
				return DocChangeType.LOCALFILETODIR;
			}		
			Log.debug("getLocalDocChangeTypeWithRemoteDoc "  + localEntry.getPath() + localEntry.getName() + " " + DocChangeType.NOCHANGE); 
			return DocChangeType.NOCHANGE;
		}
		
		//未知文件类型(localDoc.type !=1/2)
		Log.debug("getLocalDocChangeTypeWithRemoteDoc "  + localEntry.getPath() + localEntry.getName() + " " + DocChangeType.UNDEFINED); 
		return DocChangeType.UNDEFINED;
	}
	
	protected static DocChangeType getRemoteDocChangeType(Doc dbDoc, Doc remoteEntry) 
	{						
		//dbDoc不存在
		if(dbDoc == null)
		{
			if(remoteEntry == null || remoteEntry.getType() == null || remoteEntry.getType() == 0)
			{
				Log.debug("getRemoteDocChangeType " + DocChangeType.NOCHANGE); 
				return DocChangeType.NOCHANGE;				
			}	
			
			if(remoteEntry.getType() == 1 || remoteEntry.getType() == 2)
			{
				Log.debug("getRemoteDocChangeType "  + remoteEntry.getPath() + remoteEntry.getName() + " " + DocChangeType.REMOTEADD); 
				return DocChangeType.REMOTEADD;
			}

			Log.debug("getRemoteDocChangeType " + remoteEntry.getPath() + remoteEntry.getName() + " " + DocChangeType.UNDEFINED); 
			return DocChangeType.UNDEFINED;
		}
		
		//dbDoc存在，remoteEntry不存在
		if(remoteEntry == null || remoteEntry.getType() == null || remoteEntry.getType() == 0)
		{
			Log.debug("getRemoteDocChangeType " + dbDoc.getPath() + dbDoc.getName() + " " + DocChangeType.REMOTEDELETE); 
			return DocChangeType.REMOTEDELETE;
		}
		
		//dbDoc存在，remoteEntry存在且是文件
		if(remoteEntry.getType() == 1)
		{
			if(dbDoc.getType() == 2)
			{
				Log.debug("getRemoteDocChangeType " + remoteEntry.getPath() + remoteEntry.getName() + " " +  DocChangeType.REMOTEDIRTOFILE); 
				return DocChangeType.REMOTEDIRTOFILE;
			}
			
			Log.debug("getRemoteDocChangeType old revision:" + dbDoc.getRevision() + " new revision:" + remoteEntry.getRevision()); 
			if(dbDoc.getRevision() == null || remoteEntry.getRevision() == null || !dbDoc.getRevision().equals(remoteEntry.getRevision()))
			{
				Log.debug("getRemoteDocChangeType " + remoteEntry.getPath() + remoteEntry.getName() + " " + DocChangeType.REMOTECHANGE); 
				return DocChangeType.REMOTECHANGE;
			}			
			Log.debug("getRemoteDocChangeType " + remoteEntry.getPath() + remoteEntry.getName() + " " + DocChangeType.NOCHANGE); 
			return DocChangeType.NOCHANGE;
		}
		
		//dbDoc存在，remoteEntry存在且是目录
		if(remoteEntry.getType() == 2)
		{
			if(dbDoc.getType() == 1)
			{
				Log.debug("getRemoteDocChangeType " + remoteEntry.getPath() + remoteEntry.getName() + " " + DocChangeType.REMOTEFILETODIR); 
				return DocChangeType.REMOTEFILETODIR;
			}
			Log.debug("getRemoteDocChangeType " + remoteEntry.getPath() + remoteEntry.getName() + " " + DocChangeType.NOCHANGE); 
			return DocChangeType.NOCHANGE;
		}
		
		//未知文件类型(remoteEntry.type !=1/2)
		Log.debug("getRemoteDocChangeType " + remoteEntry.getPath() + remoteEntry.getName() + " " + DocChangeType.UNDEFINED); 
		return DocChangeType.UNDEFINED;
	}
	
	protected static DocChangeType getRemoteDocChangeTypeWithLocalDoc(Doc remoteEntry, Doc localDoc) 
	{						
		//localDoc不存在
		if(localDoc == null)
		{
			if(remoteEntry == null || remoteEntry.getType() == null || remoteEntry.getType() == 0)
			{
				Log.debug("getRemoteDocChangeTypeWithLocalDoc " + DocChangeType.NOCHANGE); 
				return DocChangeType.NOCHANGE;				
			}	
			
			if(remoteEntry.getType() == 1 || remoteEntry.getType() == 2)
			{
				Log.debug("getRemoteDocChangeTypeWithLocalDoc "  + remoteEntry.getPath() + remoteEntry.getName() + " " + DocChangeType.REMOTEADD); 
				return DocChangeType.REMOTEADD;
			}

			Log.debug("getRemoteDocChangeTypeWithLocalDoc " + remoteEntry.getPath() + remoteEntry.getName() + " " + DocChangeType.UNDEFINED); 
			return DocChangeType.UNDEFINED;
		}
		
		//dbDoc存在，remoteEntry不存在
		if(remoteEntry == null || remoteEntry.getType() == null || remoteEntry.getType() == 0)
		{
			Log.debug("getRemoteDocChangeTypeWithLocalDoc " + localDoc.getPath() + localDoc.getName() + " " + DocChangeType.REMOTEDELETE); 
			return DocChangeType.REMOTEDELETE;
		}
		
		//dbDoc存在，remoteEntry存在且是文件
		if(remoteEntry.getType() == 1)
		{
			if(localDoc.getType() == 2)
			{
				Log.debug("getRemoteDocChangeTypeWithLocalDoc " + remoteEntry.getPath() + remoteEntry.getName() + " " +  DocChangeType.REMOTEDIRTOFILE); 
				return DocChangeType.REMOTEDIRTOFILE;
			}
			
			//无法确定本地和远程的区别
			Log.debug("getRemoteDocChangeTypeWithLocalDoc " + remoteEntry.getPath() + remoteEntry.getName() + " " + DocChangeType.REMOTECHANGE); 
			return DocChangeType.REMOTECHANGE;
		}
		
		//localDoc存在，remoteEntry存在且是目录
		if(remoteEntry.getType() == 2)
		{
			if(localDoc.getType() == 1)
			{
				Log.debug("getRemoteDocChangeTypeWithLocalDoc " + remoteEntry.getPath() + remoteEntry.getName() + " " + DocChangeType.REMOTEFILETODIR); 
				return DocChangeType.REMOTEFILETODIR;
			}
			Log.debug("getRemoteDocChangeTypeWithLocalDoc " + remoteEntry.getPath() + remoteEntry.getName() + " " + DocChangeType.NOCHANGE); 
			return DocChangeType.NOCHANGE;
		}
		
		//未知文件类型(remoteEntry.type !=1/2)
		Log.debug("getRemoteDocChangeTypeWithLocalDoc " + remoteEntry.getPath() + remoteEntry.getName() + " " + DocChangeType.UNDEFINED); 
		return DocChangeType.UNDEFINED;
	}
	
	protected DocChangeType getDocChangeType_FSM(Repos repos,Doc doc, Doc dbDoc, Doc localEntry, Doc remoteEntry) 
	{	
		Log.debug("getDocChangeType_FSM [" +doc.getPath() + doc.getName()+ "]");
		DocChangeType localChangeType = getLocalDocChangeType(dbDoc, localEntry);
		DocChangeType remoteChangeType = getRemoteDocChangeType(dbDoc, remoteEntry);
		Log.debug("getDocChangeType_FSM " +doc.getPath() + doc.getName()+ " localChangeType:" + localChangeType + " remoteChangeType:" + remoteChangeType);
		
		switch(localChangeType)
		{
		case NOCHANGE:	//本地没有改动
			return remoteChangeType;
		case LOCALADD:
		case LOCALDIRTOFILE:
		case LOCALFILETODIR:
		case LOCALCHANGE:
			return localChangeType;
		case LOCALDELETE:
			if(remoteChangeType == DocChangeType.NOCHANGE || remoteChangeType == DocChangeType.REMOTEDELETE)
			{
				return DocChangeType.LOCALDELETE;
			}
			return remoteChangeType;
		default:
			break;
		}				
		return DocChangeType.UNDEFINED;
	}

	private Doc getDocFromList(Doc doc, HashMap<Long, Doc> dbDocHashMap) 
	{
		if(dbDocHashMap == null || dbDocHashMap.size() == 0)
		{
			return null;
		}
		
		return dbDocHashMap.get(doc.getDocId());
	}

	/***
	 * Function: syncupScanForSubDocs_FSM
	 * 
	 * Description:
	 * 
	 * Parameters:
	 * scanType:
	 * 	1: check localDoc/dbDoc/remoteDoc, only check if localChanged
	 *  2: check localDoc/dbDoc, check localChanged and remoteChanged(dbDoc's revision is null), treatRemoteChangeAsLocalChange
	 *  3: check localDoc/dbDoc/remoteDoc, treatRemoteChangeAsLocalChange
	 ***/
	protected boolean syncupScanForSubDocs_FSM(Repos repos, Doc doc, User login_user, ReturnAjax rt, 
			HashMap<Long, DocChange> remoteChanges, HashMap<Long, DocChange> localChanges, 
			int subDocSyncFlag, 
			ScanOption scanOption) 
	{
		Log.debug("************************ syncupScanForSubDocs_FSM()  docId:" + doc.getDocId() + " [" + doc.getPath() + doc.getName() + "] subDocSyncFlag:" + subDocSyncFlag + " scanType:" + scanOption.scanType);

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
		HashMap<Long, Doc> verReposDocHashMap = null;		

				
		List<Doc> localEntryList = getLocalEntryList(repos, doc);
		//Log.printObject("syncupScanForSubDocs_FSM() localEntryList:", localEntryList);
    	if(localEntryList == null)
    	{
    		Log.debug("syncupScanForSubDocs_FSM() localEntryList 获取异常:");
        	return false;
    	}

		List<Doc> dbDocList = getDBEntryList(repos, doc);
		//Log.printObject("syncupScanForSubDocs_FSM() dbEntryList:", dbDocList);

		//注意: 如果仓库没有版本仓库则不需要远程同步
		List<Doc> verReposEntryList = null;
		boolean isVerReposSyncUpNeed = false;
		
		if(scanOption.scanType == 3 || scanOption.scanType == 4)
		{
	    	isVerReposSyncUpNeed = isVerReposSyncupNeed(repos);
		}
		
    	if(isVerReposSyncUpNeed)
		{
    		verReposEntryList = getVerReposEntryList(repos, doc);
    	    //Log.printObject("SyncUpSubDocs_FSM() remoteEntryList:", remoteEntryList);
        	if(verReposEntryList == null)
        	{
        		Log.debug("syncupScanForSubDocs_FSM() remoteEntryList 获取异常:");
            	return false;
        	}        	
		}
		
    	//将dbDocList\localEntryList\remoteEntryList转成HashMap
		localDocHashMap =  ConvertDocListToHashMap(localEntryList);	
		dbDocHashMap = ConvertDocListToHashMap(dbDocList);	
		if(isVerReposSyncUpNeed)	//如果不需要远程同步则直接将remoteHashMap设置成dbHashMap来避免远程同步
		{
			verReposDocHashMap = ConvertDocListToHashMap(verReposEntryList);					
		}
		else
		{
			verReposDocHashMap = dbDocHashMap;
		}

		
		HashMap<String, Doc> docHashMap = new HashMap<String, Doc>();	//the doc already syncUped		
		//Log.debug("syncupScanForSubDocs_FSM() syncupScanForDocList_FSM for remoteEntryList");
        syncupScanForDocList_FSM(verReposEntryList, docHashMap, repos, dbDocHashMap, localDocHashMap, verReposDocHashMap, login_user, rt, remoteChanges, localChanges, subDocSyncFlag, scanOption);
		
        //Log.debug("syncupScanForSubDocs_FSM() syncupScanForDocList_FSM for localEntryList");
        syncupScanForDocList_FSM(localEntryList, docHashMap, repos, dbDocHashMap, localDocHashMap, verReposDocHashMap, login_user, rt, remoteChanges, localChanges, subDocSyncFlag, scanOption);
		
        //Log.debug("syncupScanForSubDocs_FSM() syncupScanForDocList_FSM for dbDocList");
        syncupScanForDocList_FSM(dbDocList, docHashMap, repos, dbDocHashMap, localDocHashMap, verReposDocHashMap, login_user, rt, remoteChanges, localChanges, subDocSyncFlag, scanOption);

		return true;
    }
	
	private boolean isVerReposSyncupNeed(Repos repos) {
		if(repos.getVerCtrl() == null)
		{
			return false;
		}
		
		
		if(repos.getVerCtrl() == 0)
		{	
			return false;
		}
		
//		if(repos.getIsRemote() == null)
//		{
//			return false;
//		}
//		
//		//RemoteSyncup only for the repos with remoteVerRepos
//		if(repos.getIsRemote() != 1)
//		{
//			return false;
//		}	

		return true;
	}

	boolean syncupScanForDocList_FSM(List<Doc> docList, HashMap<String, Doc> docHashMap, Repos repos, HashMap<Long, Doc> dbDocHashMap, HashMap<Long, Doc> localDocHashMap, HashMap<Long, Doc> remoteDocHashMap, User login_user, ReturnAjax rt, 
			HashMap<Long, DocChange> remoteChanges, HashMap<Long, DocChange> localChanges, int subDocSyncFlag, ScanOption scanOption)
	{
		if(docList == null)
		{
			return true;
		}
		
	    for(int i=0;i<docList.size();i++)
	    {
    		Doc subDoc = docList.get(i);
    		//Log.debug("syncupDocChangeForDocList_FSM() subDoc:" + subDoc.getDocId() + " " + subDoc.getPath() + subDoc.getName());
    		
    		if(docHashMap.get(subDoc.getName()) != null)
    		{
    			//already syncuped
    			continue;	
    		}
    		
    		Doc dbDoc = getDocFromList(subDoc, dbDocHashMap);
    		//Log.printObject("syncupForDocChange_FSM() dbDoc: ", dbDoc);

    		Doc localEntry = getDocFromList(subDoc, localDocHashMap);
    		//Log.printObject("syncupForDocChange_FSM() localEntry: ", localEntry);
    		
    		Doc remoteEntry = getDocFromList(subDoc, remoteDocHashMap);
    		//Log.printObject("syncupForDocChange_FSM() remoteEntry: ", remoteEntry);
    		docHashMap.put(subDoc.getName(), subDoc);
    		
    		syncupScanForDoc_FSM(repos, subDoc, dbDoc, localEntry, remoteEntry, login_user, rt, remoteChanges, localChanges, subDocSyncFlag, scanOption);
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

	private boolean syncUpRemoteChange_FSM(Repos repos, DocChange docChange, User login_user, ReturnAjax rt) 
	{	
		Doc doc = docChange.getDoc();
		Doc remoteEntry = docChange.getRemoteEntry();
		DocChangeType docChangeType = docChange.getType();
		
		String localParentPath = null;
		List<Doc> successDocList = null;
		
		switch(docChangeType)
		{
		case REMOTEADD:		//Remote Added
			Log.debug("syncUpRemoteChange_FSM() remote Added: " + remoteEntry.getPath()+remoteEntry.getName());	
			localParentPath = Path.getReposRealPath(repos) + remoteEntry.getPath();
			successDocList = verReposCheckOut(repos, false, remoteEntry, localParentPath, remoteEntry.getName(), null, true, false, null);
			if(successDocList != null)
			{
				dbAddDoc(repos, remoteEntry, true, false);
				return true;
			}
			return false;
		case REMOTEDELETE: //Remote Deleted
			Log.debug("syncUpRemoteChange_FSM() remote deleted: " + doc.getPath()+doc.getName());
			if(repos.getVerCtrl() == 1 || doc.getType() == 1) 
			{
				if(deleteRealDoc(repos, doc, rt) == true)
				{
					dbDeleteDoc(repos, doc,true);
				}
				return true;
			}
			
			if(doc.getType() == 2)	//对于GIT仓库无法区分空目录，因此只删除子目录
			{
				Log.debug("syncUpRemoteChange_FSM() Git仓库无法识别空目录，因此只删除子目录: " + doc.getPath()+doc.getName());
				deleteSubDoc(repos, doc, rt);			
			}	
			return true;
		case REMOTECHANGE: //Remote File Changed
			Log.debug("syncUpRemoteChange_FSM() remote Changed: " + doc.getPath()+doc.getName());
			
			localParentPath = Path.getReposRealPath(repos) + remoteEntry.getPath();
			successDocList = verReposCheckOut(repos, false, remoteEntry, localParentPath, remoteEntry.getName(), null, true, false, null);
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
		case REMOTEFILETODIR: //Remote Type Changed
		case REMOTEDIRTOFILE:
			Log.debug("syncUpRemoteChange_FSM() remote Type Changed: " + doc.getPath()+doc.getName());
			if(deleteRealDoc(repos, doc, rt) == true)
			{
				dbDeleteDoc(repos, doc,true);
				
				//checkOut
				localParentPath = Path.getReposRealPath(repos) + remoteEntry.getPath();
				successDocList = verReposCheckOut(repos, false, remoteEntry, localParentPath, remoteEntry.getName(), null, true, false, null);
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
		default:
			break;

		}
		return false;
	}

	private boolean deleteSubDoc(Repos repos, Doc doc, ReturnAjax rt) {
		List<Doc> subDocList = getLocalEntryList(repos, doc);
		for(int i=0; i< subDocList.size(); i++)
		{
			Doc subDoc = subDocList.get(i);
			if(deleteRealDoc(repos, subDoc, rt) == true)
			{
				dbDeleteDoc(repos, subDoc,true);
			}
		}
		return true;
	}

	private DocChangeType getRemoteChangeType(Repos repos, Doc doc, Doc dbDoc, Doc remoteEntry) 
	{
		if(repos.getVerCtrl() == null || repos.getVerCtrl() == 0)
		{
			//Log.debug("getRemoteChangeType() no verCtrl");
			return DocChangeType.NOCHANGE;
		}
		
		if(dbDoc == null)
		{
			if(remoteEntry != null && remoteEntry.getType() != 0)
			{
				//Log.debug("getRemoteChangeType() 远程文件/目录新增:"+remoteEntry.getName());
				return DocChangeType.REMOTEADD;				
			}
			//Log.debug("getRemoteChangeType() 远程文件未变更");
			return DocChangeType.NOCHANGE;
		}
		
		if(remoteEntry == null ||remoteEntry.getType() == 0)
		{
			//Log.debug("getRemoteChangeType() 远程文件删除:"+dbDoc.getName());
			if(repos.getVerCtrl() == 2)
			{
				//Log.debug("FileUtil.isEmptyDir() dirPath:" + dirPath);
				File file = new File(doc.getLocalRootPath() + doc.getPath() + doc.getName());
				if(!file.exists())
				{
					return DocChangeType.NOCHANGE;
				}
				
				//需要根据dbDoc中的revision确定版本仓库是否已经包含了该文件的历史才能最后确认为删除操作				
				if(file.isFile())
				{
					return DocChangeType.REMOTEDELETE;			
				}

				//GIT 仓库无法识别空目录，因此如果是空目录则认为没有改变
				if(FileUtil.isEmptyDir(file, false) == true)
				{
					return DocChangeType.NOCHANGE;
				}
			}		
			return DocChangeType.REMOTEDELETE;
		}
		
		switch(remoteEntry.getType())
		{
		case 1:
			if(dbDoc.getType() == null || dbDoc.getType() != 1)
			{
				//Log.debug("getRemoteChangeType() 远程文件类型改变(目录->文件):"+remoteEntry.getName());
				return DocChangeType.REMOTEDIRTOFILE;
			}
			
			if(isDocRemoteChanged(repos, dbDoc, remoteEntry))
			{
				//Log.debug("getRemoteChangeType() 远程文件内容修改:"+remoteEntry.getName());
				return DocChangeType.REMOTECHANGE;
			}
			
			//Log.debug("getRemoteChangeType() 远程文件未变更:"+remoteEntry.getName());
			return DocChangeType.NOCHANGE;
		case 2:
			if(dbDoc.getType() == null || dbDoc.getType() != 2)
			{
				//Log.debug("getRemoteChangeType() 远程文件类型改变(文件->目录):"+remoteEntry.getName());
				return DocChangeType.REMOTEFILETODIR;
			}

			//Log.debug("getRemoteChangeType() 远程目录未变更:"+remoteEntry.getName());
			return DocChangeType.NOCHANGE;
		}
		
		//Log.debug("getRemoteChangeType() 远程文件类型未知:"+dbDoc.getName());
		return DocChangeType.UNDEFINED;
	}

	protected static Doc fsGetDoc(Repos repos, Doc doc) 
	{
		Doc localDoc = new Doc();
		localDoc.setVid(repos.getId());
		localDoc.setDocId(doc.getDocId());
		localDoc.setPid(doc.getPid());
		localDoc.setReposPath(doc.getReposPath());
		localDoc.setLocalRootPath(doc.getLocalRootPath());
		localDoc.setLocalVRootPath(doc.getLocalVRootPath());
		localDoc.setPath(doc.getPath());
		localDoc.setName(doc.getName());
		localDoc.setType(0);	//不存在
		localDoc.offsetPath = doc.offsetPath;
	
		String localParentPath = doc.getLocalRootPath() + doc.getPath();
		File localEntry = new File(localParentPath,doc.getName());
		if(localEntry.exists())
		{
			localDoc.setSize(localEntry.length());
			localDoc.setLatestEditTime(localEntry.lastModified());
			localDoc.setCreateTime(localEntry.lastModified());			
			localDoc.setType(localEntry.isDirectory()? 2 : 1);
		}
		return localDoc;
	}
	
	protected Doc docSysGetDoc(Repos repos, Doc doc, boolean remoteStorageEn) 
	{
		Log.debug("docSysGetDoc() doc:[" + doc.getPath() + doc.getName() + "]");
		//文件管理系统
		if(isFSM(repos))
		{	
			if(remoteStorageEn)
			{
				return docSysGetDocWithChangeType(repos, doc);
			}
			return fsGetDoc(repos, doc);
		}
		
		//文件服务器前置
		return remoteServerGetDoc(repos, doc, null);
	}
	
	protected Doc docSysGetDocWithChangeType(Repos repos, Doc doc) {
		Doc localDoc = fsGetDoc(repos, doc);
		RemoteStorageConfig remote = repos.remoteStorageConfig;
		if(remote == null)
		{
			Log.debug("docSysGetDocListWithChangeType remote is null");
			return localDoc;
		}

		Doc remoteDoc = getRemoteStorageEntry(repos, doc, remote);
		if(remoteDoc == null)
		{
			Log.debug("docSysGetDocListWithChangeType remoteList is null");
			return localDoc;
		}
		
		return combineLocalDocWithRemoteDoc(repos, localDoc, remoteDoc);
	}

	private Doc combineLocalDocWithRemoteDoc(Repos repos, Doc localDoc, Doc remoteDoc) {
		Log.debug("combineLocalDocWithRemoteDoc");

		if(localDoc == null || localDoc.getType() == 0)
		{
			return remoteDoc;
		}
		
		//dbHashMap（可以用于标记本地文件和远程存储文件的新增、删除、修改）
		Doc dbDoc = getRemoteStorageDBEntry(repos, localDoc);
		localDoc.localChangeType = getLocalDocChangeType(dbDoc, remoteDoc);
		localDoc.remoteChangeType = getRemoteDocChangeType(dbDoc, remoteDoc);
		return localDoc;
	}
	
	

	private Doc getRemoteStorageDBEntry(Repos repos, Doc doc) {
        return remoteStorageGetDBEntry(repos.remoteStorageConfig, repos, doc);
	}

	protected boolean verReposPullPush(Repos repos, boolean isRealDoc, ReturnAjax rt)
	{
		Integer isRemote = repos.getIsRemote();
		Integer verCtrl = repos.getVerCtrl();
		if(!isRealDoc)
		{
			verCtrl = repos.getVerCtrl1();
			isRemote = repos.getIsRemote1();
		}
		Log.debug("verReposPullPush() verCtrl:" + verCtrl + " isRemote:" + isRemote);
		
		if(verCtrl != 2 || isRemote != 1)
		{
			Log.debug("verReposPullPush() 非GIT远程仓库无需PullPush");
			return true;
		}
		
		return gitPullPush(repos, isRealDoc);
	}
	
	private boolean gitPullPush(Repos repos, boolean isRealDoc) {
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, isRealDoc, "") == false)
		{
			Log.debug("gitPull() GITUtil Init failed");
			return false;
		}

		if(gitUtil.doPullEx())
		{
			return gitUtil.doPushEx();
		}
		return false;
	}

	protected String verReposGetLatestRevision(Repos repos, boolean convert, Doc doc) 
	{
		doc = docConvert(doc, convert);
		
		int verCtrl = getVerCtrl(repos, doc);
		if(verCtrl == 1)
		{
			return svnGetDocLatestRevision(repos, doc);			
		}
		else if(verCtrl == 2)
		{
			return gitGetDocLatestRevision(repos, doc);	
		}
		return null;
	}

	private String svnGetDocLatestRevision(Repos repos, Doc doc) {
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, doc.getIsRealDoc(), "") == false)
		{
			Log.debug("svnGetDoc() svnUtil.Init失败！");	
			return null;
		}

		return svnUtil.getLatestRevision(doc);		
	}
	
	private String gitGetDocLatestRevision(Repos repos, Doc doc) {
		//GitUtil Init
		GITUtil gitUtil = new GITUtil();
		if(gitUtil.Init(repos, doc.getIsRealDoc(), "") == false)
		{
			Log.debug("gitRealDocCommit() GITUtil Init failed");
			return null;
		}
		
		return gitUtil.getLatestRevision(doc);		
	}

	
	protected Doc remoteServerGetDoc(Repos repos, Doc doc, String revision) {
		return getRemoteStorageEntry(repos, doc, repos.remoteServerConfig);
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
		return doc;
	}

	private Doc svnGetDoc(Repos repos, Doc doc, String revision) {
		//Log.debug("svnGetDoc() reposId:" + repos.getId() + " parentPath:" + parentPath + " entryName:" + entryName);
		
		SVNUtil svnUtil = new SVNUtil();
		if(svnUtil.Init(repos, true, "") == false)
		{
			Log.debug("svnGetDoc() svnUtil.Init失败！");	
			return null;
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
			Log.debug("gitRealDocCommit() GITUtil Init failed");
			return null;
		}
		
		Doc remoteDoc = gitUtil.getDoc(doc, revision);
		return remoteDoc;
	}
	
	protected Doc indexGetDoc(Repos repos, Doc doc, Integer IndexLibType, boolean dupCheck) 
	{
		Doc qDoc = new Doc();
		qDoc.setVid(doc.getVid());
		qDoc.setDocId(doc.getDocId());
		
		String indexLib = getIndexLibPath(repos, IndexLibType);
		List<Doc> list = LuceneUtil2.getDocList(repos, qDoc, indexLib, 100);
		if(list == null || list.size() == 0)
		{
			return null;
		}
		
		if(dupCheck)
		{
			if(list.size() > 1)
			{
				Log.debug("indexGetDoc() indexLib存在多个DOC记录(" + doc.getName() + ")，自动清理"); 
				for(int i=0; i <list.size(); i++)
				{
					//delete Doc directly
					LuceneUtil2.deleteDoc(list.get(i), indexLib);
				}
				return null;
			}
		}
		
		return list.get(0);
	}

	protected Doc dbGetDoc(Repos repos, Doc doc, boolean dupCheck) 
	{	
		Doc qDoc = new Doc();
		qDoc.setVid(doc.getVid());
		qDoc.setDocId(doc.getDocId());
		
		List<Doc> list = reposService.getDocList(qDoc);
		//Log.printObject("dbGetDoc() list:", list);
		
		if(list == null || list.size() == 0)
		{
			return null;
		}
		
		if(dupCheck)
		{
			if(list.size() > 1)
			{
				Log.debug("dbGetDoc() 数据库存在多个DOC记录(" + doc.getName() + ")，自动清理"); 
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
		if(isFSM(repos) == false)
		{
			return true;
		}		
		
		String reposRPath = Path.getReposRealPath(repos);
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
			Log.debug("dbAddDoc() addDoc to db failed");		
			return false;
		}
    	
		if(addSubDocs)
		{
			List<Doc> subDocList = docSysGetDocList(repos, doc, false);			
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
		if(isFSM(repos) == false)
		{
			return true;
		}		
		
		if(deleteSubDocs)
		{
			String subDocParentPath = getSubDocParentPath(doc);
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
						Log.debug("dbDeleteDoc() 系统错误: subDoc name is empty" + subDoc.getDocId());
						Log.printObject("dbDeleteDoc() doc:", doc);
						Log.printObject("dbDeleteDoc() subDoc:", subDoc);
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
		if(isFSM(repos) == false)
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
			Log.debug("dbUpdateDoc() 非法docId，删除该数据库记录:" + doc.getDocId()  + " " + doc.getPath() + doc.getName());
			dbDeleteDoc(repos, doc, false);
			return true;
		}
		
		Doc localEntry = fsGetDoc(repos, doc);
		if(localEntry == null)
		{
			Log.debug("dbUpdateDoc() get localEntry 异常 for " + doc.getDocId()  + " " + doc.getPath() + doc.getName());
			return false;
		}
		
		if(localEntry.getType() == 0)
		{
			//这次commit是一个删除操作
			Log.debug("dbUpdateDoc() 本地文件/目录删除:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
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
				Log.debug("dbUpdateDoc() 本地新增文件/目录:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
				return dbAddDoc(repos, doc, true, true);
			}
			return true;
		}
		
		//type not matched, do delete it and add it
		if(dbDoc.getType() != localEntry.getType())
		{
			Log.debug("dbUpdateDoc() 本地文件/目录类型改变:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
			if(dbDeleteDoc(repos, dbDoc, true) == false)
			{
				Log.debug("dbUpdateDoc() 删除dbDoc失败:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
				return false;
			}
			return  dbAddDoc(repos, doc, true, false);	
		}
		
		if(localEntry.getType() == 1 || localEntry.getType() == 2)
		{
			Log.debug("dbUpdateDoc() 本地文件/目录修改:" + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
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
		
		Log.debug("dbUpdateDoc() 未知文件类型:" + doc.getType() + doc.getDocId() + " " + doc.getPath() + doc.getName()); 
		return false;
	}

	private static Long buildDocId(String path, String name) 
	{
		int level = Path.getLevelByParentPath(path);
		return Path.buildDocIdByName(level, path, name);
	}

	private boolean dbMoveDoc(Repos repos, Doc srcDoc, Doc dstDoc) 
	{
		if(isFSM(repos) == false)
		{
			return true;
		}	
		
		dbDeleteDoc(repos, srcDoc,true);
		return dbAddDoc(repos, dstDoc, true, false);
	}
	
	private boolean dbCopyDoc(Repos repos, Doc srcDoc, Doc dstDoc, User login_user, ReturnAjax rt) {
		if(isFSM(repos) == false)
		{
			return true;
		}		
		
		return dbAddDoc(repos, dstDoc, true, false);
	}
	
	private boolean dbDeleteDocEx(List<CommonAction> actionList, Repos repos, Doc doc, String commitMsg, String commitUser, boolean deleteSubDocs) 
	{
		if(isFSM(repos) == false)
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
		
		return true;
	}
	
	public DocShare getDocShare(Integer shareId) {
		DocShare qDocShare = new DocShare();
		qDocShare.setShareId(shareId);
		List<DocShare> results = reposService.getDocShareList(qDocShare);
		if(results == null || results.size() < 1)
		{
			return null;
		}
		return results.get(0);
	}
	
	protected ReposAccess checkAndGetAccessInfo(
			Integer shareId, 
			HttpSession session, HttpServletRequest request, HttpServletResponse response, 
			Integer reposId, String path, String name, boolean forceCheck,
			ReturnAjax rt) 
	{
		Log.debug("checkAndGetAccessInfo() reposId:" + reposId + " path:" + path + " name:" + name + " shareId:" + shareId);
		ReposAccess reposAccess = null;
		if(shareId != null)
		{
			DocShare docShare = getDocShare(shareId);
			if(verifyDocShare(docShare, rt) == false)
			{
				return null;				
			}
			
			if(reposId != null)
			{
				if(!reposId.equals(docShare.getVid()))
				{
					Log.info("checkAndGetAccessInfo() reposId not matched, reposId:" + reposId + " docShare.vid:" + docShare.getVid());
					rt.setError("非法仓库访问");
					return null;
				}
			}
			
			//文件非法访问检查: 不能访问分享文件的上层目录或者同层的其他文件
			Log.debug("checkAndGetAccessInfo() forceCheck:" + forceCheck);
			if(forceCheck) //强制检查则无论path是否为空都要检查
			{
				if(path == null)
				{
					path = "";
				}
				if(name == null)
				{
					name = "";
				}
			}
			
			if(path != null)
			{
				String accessPath = path + name;
				
				String sharedPath = docShare.getPath() + docShare.getName();
				if(!sharedPath.isEmpty())	//分享的不是根目录，则需要检查是否进行了非法访问
				{
					if(accessPath.indexOf(sharedPath) != 0) //分享的文件本身或者子目录才可以访问
					{
						Log.info("checkAndGetAccessInfo() 非法访问路径 accessPath:" + accessPath);
						rt.setError("非法文件访问");
						return null;
					}
				}
			}
			
			reposAccess = new ReposAccess();
			reposAccess.setAccessUserId(docShare.getSharedBy());
			User accessUser = new User();
			accessUser.setId(docShare.getSharedBy());
			reposAccess.setAccessUser(accessUser);
			reposAccess.setDocShare(docShare);
			reposAccess.setRootDocPath(docShare.getPath());
			reposAccess.setRootDocName(docShare.getName());
			DocAuth authMask = getShareAuth(docShare);
			reposAccess.setAuthMask(authMask);
		}
		else
		{
			User login_user = getLoginUser(session, request, response, rt);
			if(login_user == null)
			{
				rt.setError("用户未登录，请先登录！");
				return null;
			}
			reposAccess = new ReposAccess();
			reposAccess.setAccessUserId(login_user.getId());
			reposAccess.setAccessUser(login_user);
		}
		return reposAccess;
	}

	private DocAuth getShareAuth(DocShare docShare) {
		DocAuth docAuth = new DocAuth();
		docAuth.setAccess(1);
		docAuth.setDownloadEn(0);
		docAuth.setAddEn(0);		
		docAuth.setEditEn(0);
		docAuth.setHeritable(1);
		
		if(docShare == null)
		{
			Log.debug("getShareAuth() docShare is null！");
			return null;
		}
		
		String shareAuth = docShare.getShareAuth();
		if(shareAuth == null || shareAuth.isEmpty())
		{
			Log.debug("getShareAuth() docShareAuth 未设置！");
			return null;
		}
		
		Log.debug("getShareAuth() shareAuth:" + shareAuth);

		//解析JsonString
		JSONObject jobj = JSON.parseObject(shareAuth);
		docAuth = (DocAuth) convertJsonObjToObj(jobj, docAuth, DOCSYS_DOC_AUTH);	
		
		Log.printObject("getShareAuth() docAuth:",docAuth);
		return docAuth;
	}
	
	protected boolean verifyDocShare(DocShare docShare, ReturnAjax rt) 
	{
		if(docShare == null)
		{
			Log.debug("verifyDocShare() docShare is null");
			rt.setError("无效文件分享");
			return false;
		}
		
		if(docShare.getVid() == null)
		{
			Log.debug("verifyDocShare() docShare.vid is null");
			rt.setError("无效文件分享");
			deleteDocShare(docShare);
			return false;
		}
		
		if(docShare.getDocId() == null)
		{
			Log.debug("verifyDocShare() docShare.docId is null");
			rt.setError("无效文件分享");
			deleteDocShare(docShare);
			return false;
		}

		if(docShare.getPath() == null)
		{
			Log.debug("verifyDocShare() docShare.path is null");
			rt.setError("无效文件分享");
			deleteDocShare(docShare);
			return false;
		}

		if(docShare.getName() == null)
		{
			Log.debug("verifyDocShare() docShare.name is null");
			rt.setError("无效文件分享");
			deleteDocShare(docShare);
			return false;
		}
		
		if(docShare.getSharedBy() == null)
		{
			Log.debug("verifyDocShare() docShare.sharedBy is null");
			rt.setError("无效文件分享");
			deleteDocShare(docShare);
			return false;
		}
		
		Long expireTime = docShare.getExpireTime();
		if(expireTime != null)
		{
			long curTime = new Date().getTime();
			if(curTime > expireTime)	//
			{
				Log.debug("verifyDocShare() docShare is expired");
				rt.setError("文件分享已过期");
				return false;
			}
		}		
		return true;
	}

	private boolean deleteDocShare(DocShare docShare) {
		
		if(reposService.deleteDocShare(docShare.getId()) == 0)
		{
			return false;
		}
		return true;
	}

	private boolean executeDBAction(CommonAction action, ReturnAjax rt) 
	{
		Log.printObject("executeDBAction() action:",action);
		Repos repos = action.getRepos();
		Doc doc = action.getDoc();
		Log.debug("executeDBAction() 实文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());

		switch(action.getAction())
		{
		case ADD:	//Add Doc
			return dbAddDoc(repos, doc, false, true);
		case DELETE: //Delete Doc
			return dbDeleteDoc(repos, doc, true);
		case UPDATE: //Update Doc
			return dbUpdateDoc(repos, doc, true);
		default:
			break;
		}
		return false;
	}
	
	private boolean executeIndexAction(CommonAction action, ReturnAjax rt) 
	{
		Log.printObject("executeIndexAction() action:",action);
		Doc doc = action.getDoc();
		switch(action.getDocType())
		{
		case DOCNAME:	//DocName
			Log.debug("executeIndexAction() 文件名:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
    		return executeIndexActionForDocName(action, rt);
    	case REALDOC: //RDoc
			Log.debug("executeIndexAction() 实文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
    		return executeIndexActionForRDoc(action, rt);
		case VIRTURALDOC: //VDoc
			Log.debug("executeIndexAction() 虚文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return executeIndexActionForVDoc(action, rt);
		case ALL:
			return executeIndexActionForAll(action, rt);
		default:
			break;
		}
		return false;
	}
	
	private boolean executeIndexActionForAll(CommonAction action, ReturnAjax rt) 
	{
		Repos repos = action.getRepos();
		Doc doc = action.getDoc();
		
		switch(action.getAction())
		{
		case ADD:
			return buildIndexForDoc(repos, doc, null, null, rt, 2, true);
		case DELETE:
			return deleteAllIndexForDoc(repos, doc);
		case UPDATE:
			deleteAllIndexForDoc(repos, doc);
			Doc newDoc = action.getNewDoc();
			return buildIndexForDoc(repos, newDoc, null, null, rt, 2, true);
		default:
			break;			
		}
		return false;
	}
	
	private boolean executeIndexActionForDocName(CommonAction action, ReturnAjax rt) 
	{
		Repos repos = action.getRepos();
		Doc doc = action.getDoc();
		
		switch(action.getAction())
		{
		case ADD:	//Add Doc Name
			return addIndexForDocName(repos, doc);
		case DELETE: //Delete Doc Name
			return deleteIndexForDocName(repos, doc, 1);
		case UPDATE: //Update Doc
			Doc newDoc = action.getNewDoc();
			return updateIndexForDocName(repos, doc, newDoc, rt);
		default:
			break;			
		}
		return false;
	}

	private boolean executeIndexActionForRDoc(CommonAction action, ReturnAjax rt) 
	{
		Doc doc = action.getDoc();
		Repos repos = action.getRepos();
		
		switch(action.getAction())
		{
		case ADD:	//Add Doc
			return addIndexForRDoc(repos, doc);
		case DELETE: //Delete Doc
			return deleteIndexForRDoc(repos, doc, 1);
		case UPDATE: //Update Doc
			return updateIndexForRDoc(repos, doc);		
		case MOVE: //Move Doc
			deleteIndexForRDoc(repos, doc, 1);
			return addIndexForRDoc(repos, action.getNewDoc());		
		case COPY: //Copy Doc
			return addIndexForRDoc(repos, action.getNewDoc());
		default:
			break;
		}
		return false;
	}
	
	private boolean executeIndexActionForVDoc(CommonAction action, ReturnAjax rt) 
	{
		Repos repos = action.getRepos();
		Doc doc = action.getDoc();
		
		switch(action.getAction())
		{
		case ADD:	//Add Doc
			return addIndexForVDoc(repos, doc);
		case DELETE: //Delete Doc
			return deleteIndexForVDoc(repos, doc, 1);
		case UPDATE: //Update Doc
			return updateIndexForVDoc(repos, doc);	
		case MOVE: //Move Doc
			deleteIndexForVDoc(repos, doc, 1);
			return addIndexForVDoc(repos, action.getNewDoc());		
		case COPY: //Copy Doc
			return addIndexForVDoc(repos, action.getNewDoc());
		default:
			break;
		}
		return false;
	}
	
	private boolean executeFSAction(CommonAction action, ReturnAjax rt) {
		Log.printObject("executeFSAction() action:",action);
		Doc doc = action.getDoc();
		switch(action.getDocType())
		{
		case REALDOC:	//RDoc
			Log.debug("executeFSAction() 实文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return executeLocalActionForRDoc(action, rt);
		case VIRTURALDOC: //VDoc
			Log.debug("executeFSAction() 虚文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			return executeLocalActionForVDoc(action, 0, rt);
		default:
			break; 
		}
		return false;
	}
	
	private boolean executeVFSAction(CommonAction action, ReturnAjax rt) {
		Log.printObject("executeVFSAction() action:",action);
		Doc doc = action.getDoc();
		switch(action.getDocType())
		{
		case VIRTURALDOC: //VDoc
			Log.debug("executeVFSAction() 虚文件:" + doc.getDocId() + " " + doc.getPath() + doc.getName());
			if(executeLocalActionForVDoc(action, 2, rt) == false)
			{
				return false;				
			}
			
			//注意: virtualDoc在copy和move的时候不commit 
			return true;
		default:
			break; 
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
		case ADD:	//Add Doc
			return createRealDoc(repos, doc, rt);
		case DELETE: //Delete Doc
			return deleteRealDoc(repos, doc, rt);
		case UPDATE: //Update Doc
			MultipartFile uploadFile = action.getUploadFile();
			Integer chunkNum = action.getChunkNum();
			Long chunkSize = action.getChunkSize();
			String chunkParentPath = action.getChunkParentPath();
			return updateRealDoc(repos, doc, uploadFile, chunkNum, chunkSize, chunkParentPath, rt);
		case MOVE: //Move Doc
			return moveRealDoc(repos, doc, newDoc, rt);
		case COPY: //Copy Doc
			return copyRealDoc(repos, doc, newDoc, rt);
		default:
			break;
		}
		return false;
	}
	
	private boolean executeLocalActionForVDoc(CommonAction action, int subDocFlag, ReturnAjax rt)
	{	
		Doc doc = action.getDoc();
		Doc newDoc = action.getNewDoc();
		
		Repos repos = action.getRepos();
		
		switch(action.getAction())
		{
		case ADD:	//Add Doc
			return createVirtualDoc(repos, doc, rt);
		case DELETE: //Delete Doc
			return deleteVirtualDoc(repos, doc, rt);
		case UPDATE: //Update Doc
			return saveVirtualDocContent(repos, doc, rt);
		case MOVE: //Move Doc
			return moveVirtualDoc(repos, doc, newDoc, subDocFlag, rt);
		case COPY: //Copy Doc
			return copyVirtualDoc(repos, doc, newDoc, subDocFlag, rt);
		default:
			break;
		}
		return false;
	}

	private String executeVerReposAction(CommonAction action, ReturnAjax rt) 
	{
		Log.printObject("executeVerReposAction() action:",action);
		Repos repos = action.getRepos();
		Doc doc = action.getDoc();
		
		Doc inputDoc = doc;
		Doc inputDstDoc = action.getNewDoc();

		boolean isRealDoc = true;
		if(action.getDocType() == DocType.VIRTURALDOC)
		{
			isRealDoc = false;
			inputDoc = buildVDoc(doc);
			
			if(inputDstDoc != null)
			{
				inputDstDoc = buildVDoc(action.getNewDoc());
			}
		}
		
		String ret;
		switch(action.getAction())
		{
		case ADD: //add
		case DELETE:	//delete
		case UPDATE: //update
			ret = verReposDocCommit(repos, false, inputDoc, action.getCommitMsg(), action.getCommitUser(), rt, true, null, 2, null);
			verReposPullPush(repos, isRealDoc, rt);
			return ret;
		case MOVE:	//move
			ret = verReposDocMove(repos, false, inputDoc, inputDstDoc, action.getCommitMsg(), action.getCommitUser(), rt, null);
			verReposPullPush(repos, isRealDoc, rt);
			return ret;
		case COPY: //copy
			ret = verReposDocCopy(repos, false, inputDoc, inputDstDoc, action.getCommitMsg(), action.getCommitUser(), rt, null);
			verReposPullPush(repos, isRealDoc, rt);
			return ret;
		case PUSH: //pull
			if(verReposPullPush(repos, isRealDoc, rt) == false)
			{
				return null;
			}
			return "PUSHOK";
		default:
			break;				
		}
		return null;
	}

	//底层updateDoc接口
	public boolean updateDoc(Repos repos, Doc doc,
								MultipartFile uploadFile,
								Integer chunkNum, Long chunkSize, String chunkParentPath, 
								String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		return updateDoc_FSM(repos, doc,
					uploadFile,
					chunkNum, chunkSize, chunkParentPath, 
					commitMsg, commitUser, login_user, rt, actionList);
	}
	
	//底层updateDoc接口
	public boolean updateDocEx(Repos repos, Doc doc,
								byte [] docData,
								Integer chunkNum, Long chunkSize, String chunkParentPath, 
								String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		return updateDocEx_FSM(repos, doc,
					docData,
					chunkNum, chunkSize, chunkParentPath, 
					commitMsg, commitUser, login_user, rt, actionList);
	}

	protected boolean updateDoc_FSM(Repos repos, Doc doc,
				MultipartFile uploadFile,
				Integer chunkNum, Long chunkSize, String chunkParentPath, 
				String commitMsg,String commitUser,User login_user, ReturnAjax rt,
				List<CommonAction> actionList) 
	{	
		DocLock docLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		String lockInfo = "updateDoc_FSM() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
		docLock = lockDoc(doc, lockType, 2*60*60*1000, login_user, rt,false,lockInfo); //lock 2 Hours 2*60*60*1000
		
		if(docLock == null)
		{
			Log.info("updateDoc_FSM() lockDoc " + doc.getName() +" Failed！");
			return false;
		}
		
		//get RealDoc Full ParentPath
		String reposRPath =  Path.getReposRealPath(repos);		

		//保存文件信息
		if(updateRealDoc(repos, doc, uploadFile,chunkNum,chunkSize,chunkParentPath,rt) == false)
		{
			unlockDoc(doc, lockType, login_user);

			Log.info("updateDoc_FSM() FileUtil.saveFile " + doc.getName() +" Failed, unlockDoc Ok");
			rt.setError("Failed to updateRealDoc " + doc.getName());
			return false;
		}
		
		doc.setLatestEditor(login_user.getId());
		doc.setLatestEditorName(login_user.getName());
		
		//Get latestEditTime
		Doc fsDoc = fsGetDoc(repos, doc);
		doc.setLatestEditTime(fsDoc.getLatestEditTime());

		//需要将文件Commit到版本仓库上去
		if(isFSM(repos))
		{
			String revision = verReposDocCommit(repos, false, doc, commitMsg,commitUser,rt, true, null, 2, null);
			if(revision == null)
			{
				docSysDebugLog("updateDoc_FSM() verReposRealDocCommit Failed:" + doc.getPath() + doc.getName(), rt);
				docSysWarningLog("verReposRealDocCommit Failed", rt);	
			}
			else
			{
				//updateDoc Info
				doc.setRevision(revision);
				if(dbUpdateDoc(repos, doc, true) == false)
				{
					docSysWarningLog("updateDoc_FSM() updateDocInfo Failed", rt);
				}
				dbCheckAddUpdateParentDoc(repos, doc, null, actionList);
				
				//Insert Push Action
				CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.PUSH, DocType.REALDOC, null, login_user, false);
			}
			
			realTimeRemoteStoragePush(repos, doc, null, login_user, commitMsg, rt, "updateDoc");
			realTimeBackup(repos, doc, null, login_user, commitMsg, rt, "updateDoc");
		}
		else
		{
			if(remoteServerDocCommit(repos, doc, commitMsg, login_user, rt, true, 2) == null)
			{
				unlockDoc(doc, lockType, login_user);
				Log.info("updateDoc_FSM() remoteServerDocCommit Failed");
				//rt.setError("远程推送失败"); //remoteServerDocCommit already set the errorinfo
				return false;
			}
		}
		
		//Build DocUpdate action
		BuildMultiActionListForDocUpdate(actionList, repos, doc, reposRPath);
		
		unlockDoc(doc, lockType, login_user);
		
		return true;
	}
	
	protected boolean updateDocEx_FSM(Repos repos, Doc doc,
			byte[] docData,
			Integer chunkNum, Long chunkSize, String chunkParentPath, 
			String commitMsg,String commitUser,User login_user, ReturnAjax rt,
			List<CommonAction> actionList) 
	{	
		DocLock docLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		String lockInfo = "updateDocEx_FSM() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
		docLock = lockDoc(doc, lockType, 2*60*60*1000, login_user, rt,false,lockInfo); //lock 2 Hours 2*60*60*1000
		
		if(docLock == null)
		{
			Log.info("updateDocEx_FSM() lockDoc " + doc.getName() +" Failed！");
			return false;
		}
	
		//get RealDoc Full ParentPath
		String reposRPath =  Path.getReposRealPath(repos);		
	
		//保存文件信息
		if(updateRealDoc(repos, doc, docData,chunkNum,chunkSize,chunkParentPath,rt) == false)
		{
			unlockDoc(doc, lockType, login_user);
	
			Log.info("updateDocEx_FSM() FileUtil.saveFile " + doc.getName() +" Failed, unlockDoc Ok");
			rt.setError("Failed to updateRealDoc " + doc.getName());
			return false;
		}
		
		doc.setLatestEditor(login_user.getId());
		doc.setLatestEditorName(login_user.getName());
		
		//Get latestEditTime
		Doc fsDoc = fsGetDoc(repos, doc);
		doc.setLatestEditTime(fsDoc.getLatestEditTime());
	
		if(isFSM(repos))
		{
			//需要将文件Commit到版本仓库上去
			String revision = verReposDocCommit(repos, false, doc, commitMsg,commitUser,rt, true, null, 2, null);
			if(revision == null)
			{
				docSysDebugLog("updateDocEx_FSM() verReposRealDocCommit Failed:" + doc.getPath() + doc.getName(), rt);
				docSysWarningLog("verReposRealDocCommit Failed", rt);	
			}
			else
			{
				//updateDoc Info
				doc.setRevision(revision);
				if(dbUpdateDoc(repos, doc, true) == false)
				{
					docSysWarningLog("updateDocEx_FSM() updateDocInfo Failed", rt);
				}
				dbCheckAddUpdateParentDoc(repos, doc, null, actionList);
				
				//Insert Push Action
				CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.PUSH, DocType.REALDOC, null, login_user, false);
			}
		}
		else
		{
			if(remoteServerDocCommit(repos, doc, commitMsg,login_user,rt, true, 2) == null)
			{
				unlockDoc(doc, lockType, login_user);
				Log.info("updateDocEx_FSM() remoteServerDocCommit Failed");
				//rt.setError("远程推送失败"); //remoteServerDocCommit already set the errorinfo
				return false;
			}
		}
		
		//Build DocUpdate action
		BuildMultiActionListForDocUpdate(actionList, repos, doc, reposRPath);
		
		unlockDoc(doc, lockType, login_user);
		
		return true;
	}
		
	protected boolean renameDoc(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList) {
		return 	moveDoc_FSM(repos, srcDoc, dstDoc, commitMsg, commitUser, login_user, rt, actionList);
	}
	

	protected boolean moveDoc(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList) {
		return 	moveDoc_FSM(repos, srcDoc, dstDoc, commitMsg, commitUser, login_user, rt, actionList);
	}

	private boolean moveDoc_FSM(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, User login_user,
			ReturnAjax rt, List<CommonAction> actionList) 
	{
		DocLock srcDocLock = null;
		DocLock dstDocLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		String lockInfo = "moveDoc_FSM() syncLock [" + srcDoc.getPath() + srcDoc.getName() + "] at repos[" + repos.getName() + "]";
		srcDocLock = lockDoc(srcDoc, lockType, 2*60*60*1000,login_user,rt,true,lockInfo);
		if(srcDocLock == null)
		{
			docSysDebugLog("moveDoc_FSM() lock srcDoc " + srcDoc.getName() + " Failed", rt);
			return false;
		}

		String lockInfo2 = "moveDoc_FSM() syncLock [" + dstDoc.getPath() + dstDoc.getName() + "] at repos[" + repos.getName() + "]";
		dstDocLock = lockDoc(dstDoc, lockType, 2*60*60*1000,login_user,rt,true,lockInfo2);
		if(dstDocLock == null)
		{
			docSysDebugLog("moveDoc_FSM() lock dstDoc " + dstDoc.getName() + " Failed", rt);		
			unlockDoc(srcDoc, lockType, login_user);
			return false;
		}
		
		if(moveRealDoc(repos, srcDoc, dstDoc, rt) == false)
		{
			unlockDoc(srcDoc, lockType, login_user);
			unlockDoc(dstDoc, lockType, login_user);

			docSysErrorLog("moveDoc_FSM() moveRealDoc " + srcDoc.getName() + " to " + dstDoc.getName() + " 失败", rt);
			return false;
		}
		
		if(isFSM(repos))
		{
			String revision = verReposDocMove(repos, true, srcDoc, dstDoc,commitMsg, commitUser,rt, null);
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
				dbCheckAddUpdateParentDoc(repos, dstDoc, null, actionList);
			}
			
			realTimeRemoteStoragePush(repos, srcDoc, dstDoc, login_user, commitMsg, rt, "moveDoc");
			realTimeBackup(repos, srcDoc, dstDoc, login_user, commitMsg, rt, "moveDoc");
		}
		else
		{
			if(remoteServerDocCopy(repos, srcDoc, dstDoc, commitMsg, login_user, rt, true) == null)
			{
				rt.setError("远程推送失败！");
				return false;
			}
		}
		
		
		//Build Async Actions For RealDocIndex\VDoc\VDocIndex Add
		BuildMultiActionListForDocCopy(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, true);
		
		unlockDoc(srcDoc, lockType, login_user);
		unlockDoc(dstDoc, lockType, login_user);
		
		Doc fsDoc = fsGetDoc(repos, dstDoc);
		dstDoc.setLatestEditTime(fsDoc.getLatestEditTime());
		
		rt.setData(dstDoc);
		return true;
	}

	//底层copyDoc接口
	protected boolean copyDoc(Repos repos, Doc srcDoc, Doc dstDoc, 
			String commitMsg,String commitUser,User login_user, ReturnAjax rt,List<CommonAction> actionList) 
	{
		return 	copyDoc_FSM(repos, srcDoc, dstDoc,
					commitMsg, commitUser, login_user, rt, actionList);
	}

	protected boolean copyDoc_FSM(Repos repos, Doc srcDoc, Doc dstDoc,
			String commitMsg,String commitUser,User login_user, ReturnAjax rt, List<CommonAction> actionList)
	{	
		Log.debug("copyDoc_FSM() srcDoc [" + srcDoc.getPath() + srcDoc.getName() + "] to dstDoc [" +  dstDoc.getPath() + dstDoc.getName() + "]");
		//Set the doc Creator and LasteEditor
		dstDoc.setCreator(login_user.getId());
		dstDoc.setCreatorName(login_user.getName());
		dstDoc.setLatestEditor(login_user.getId());
		dstDoc.setLatestEditorName(login_user.getName());
		
		Log.debug("copyDoc_FSM() lockDoc");		
		DocLock srcDocLock = null;
		DocLock dstDocLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		String lockInfo = "copyDoc_FSM() syncLock [" + srcDoc.getPath() + srcDoc.getName() + "] at repos[" + repos.getName() + "]";
		//Try to lock the srcDoc
		srcDocLock = lockDoc(srcDoc, lockType, 2*60*60*1000,login_user,rt,true, lockInfo);
		if(srcDocLock == null)
		{
			Log.debug("copyDoc_FSM() lock srcDoc " + srcDoc.getName() + " Failed");
			return false;
		}
		
		String lockInfo2 = "copyDoc_FSM() syncLock [" + dstDoc.getPath() + dstDoc.getName() + "] at repos[" + repos.getName() + "]";
		dstDocLock = lockDoc(dstDoc, lockType, 2*60*60*1000,login_user,rt,true, lockInfo2);
		if(dstDocLock == null)
		{
			Log.debug("copyDoc_FSM() lock dstcDoc " + dstDoc.getName() + " Failed");				
			unlockDoc(srcDoc, lockType, login_user);				
			return false;
		}
						
		//复制文件或目录
		Log.debug("copyDoc_FSM() copyRealDoc");		
		if(copyRealDoc(repos, srcDoc, dstDoc, rt) == false)
		{
			unlockDoc(srcDoc, lockType, login_user);
			unlockDoc(dstDoc, lockType, login_user);

			Log.debug("copyDoc_FSM() copy " + srcDoc.getName() + " to " + dstDoc.getName() + " 失败");
			rt.setError("copyRealDoc copy " + srcDoc.getName() + " to " + dstDoc.getName() + "Failed");
			return false;
		}
		
		if(isFSM(repos))
		{
			Log.debug("copyDoc_FSM() verReposDocCopy");		
			//需要将文件Commit到VerRepos上去
			String revision = verReposDocCopy(repos, true, srcDoc, dstDoc,commitMsg, commitUser,rt, null);
			if(revision == null)
			{
				docSysWarningLog("copyDoc_FSM() verReposRealDocCopy failed", rt);
			}
			else
			{
				dstDoc.setRevision(revision);
				if(dbCopyDoc(repos, srcDoc, dstDoc, login_user, rt) == false)
				{
					docSysWarningLog("copyDoc_FSM() dbCopyDoc failed", rt);			
				}
				dbCheckAddUpdateParentDoc(repos, dstDoc, null, actionList);
			}
			
			realTimeRemoteStoragePush(repos, srcDoc, dstDoc, login_user, commitMsg, rt, "copyDoc");
			realTimeBackup(repos, srcDoc, dstDoc, login_user, commitMsg, rt, "copyDoc");
		}
		else
		{
			Log.debug("copyDoc_FSM() remoteServerDocCopy");		
			if(remoteServerDocCopy(repos, srcDoc, dstDoc, commitMsg, login_user, rt, false) == null)
			{
				unlockDoc(srcDoc, lockType, login_user);
				unlockDoc(dstDoc, lockType, login_user);
	
				Log.debug("文件复制失败！");
				rt.setError("远程推送失败！");
				return false;
			}
		}
		
		
		//Build Async Actions For RealDocIndex\VDoc\VDocIndex Add
		Log.debug("copyDoc_FSM() BuildMultiActionListForDocCopy");		
		BuildMultiActionListForDocCopy(actionList, repos, srcDoc, dstDoc, commitMsg, commitUser, false);

		Log.debug("copyDoc_FSM() unlockDoc");		
		unlockDoc(srcDoc, lockType, login_user);
		unlockDoc(dstDoc, lockType, login_user);
		
		//只返回最上层的doc记录
		rt.setData(dstDoc);
		return true;
	}

	protected boolean updateRealDocContent(Repos repos, Doc doc, 
			String commitMsg, String commitUser, User login_user,ReturnAjax rt, List<CommonAction> actionList) 
	{		
		DocLock docLock = null;
		int lockType = DocLock.LOCK_TYPE_FORCE;
		String lockInfo = "updateRealDocContent() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
		docLock = lockDoc(doc, lockType, 1*60*60*1000, login_user,rt,false,lockInfo);
		
		if(docLock == null)
		{
			Log.debug("updateRealDocContent() lockDoc Failed");
			return false;
		}		
		
		boolean ret = updateRealDocContent_FSM(repos, doc, commitMsg, commitUser, login_user, rt, actionList);
		
		//revert the lockStatus
		unlockDoc(doc, lockType, login_user);
				
		return ret;
	}
	
	private boolean updateRealDocContent_FSM(Repos repos, Doc doc,
			String commitMsg, String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		//get RealDoc Full ParentPath
		String reposRPath =  Path.getReposRealPath(repos);	
		
		if(saveRealDocContentEx(repos, doc, rt) == true)
		{
			doc.setLatestEditor(login_user.getId());
			doc.setLatestEditorName(login_user.getName());
			
			//Get latestEditTime
			Doc fsDoc = fsGetDoc(repos, doc);
			doc.setLatestEditTime(fsDoc.getLatestEditTime());

			if(isFSM(repos))
			{
				//需要将文件Commit到版本仓库上去
				String revision = verReposDocCommit(repos, false, doc, commitMsg, commitUser,rt, true, null, 2, null);
				if(revision == null)
				{
					docSysDebugLog("updateRealDocContent_FSM() verReposRealDocCommit Failed:" + doc.getPath() + doc.getName(), rt);
					docSysWarningLog("verReposRealDocCommit Failed", rt);	
				}
				else
				{
					//updateDoc Info
					doc.setRevision(revision);
					doc.setContent(null); //实体文件的内容不能放入数据库
					if(dbUpdateDoc(repos, doc, true) == false)
					{
						docSysWarningLog("updateRealDocContent_FSM() updateDocInfo Failed", rt);
					}
					dbCheckAddUpdateParentDoc(repos, doc, null, actionList);
					//Insert Push Action
					CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.PUSH, DocType.REALDOC, null, login_user, false);
				}
					
				realTimeRemoteStoragePush(repos, doc, null, login_user, commitMsg, rt, "updateDocContent");
				realTimeBackup(repos, doc, null, login_user, commitMsg, rt, "updateDocContent");
			}
			else
			{
				if(remoteServerDocCommit(repos, doc, commitMsg, login_user, rt, true, 2) == null)
				{
					Log.info("updateRealDocContent_FSM() remoteServerDocCommit Failed");
					//rt.setError("远程推送失败"); //remoteServerDocCommit already set the errorinfo
					return false;
				}
			}
			//Build DocUpdate action
			BuildMultiActionListForDocUpdate(actionList, repos, doc, reposRPath);
			return true;
		}
		return false;
	}
	
	protected boolean updateVirualDocContent(Repos repos, Doc doc, 
			String commitMsg, String commitUser, User login_user,ReturnAjax rt, List<CommonAction> actionList) 
	{		
		DocLock docLock = null;
		int lockType = DocLock.LOCK_TYPE_VFORCE;
		String lockInfo = "updateVirualDocContent() syncLock [" + doc.getPath() + doc.getName() + "] at repos[" + repos.getName() + "]";
		docLock = lockDoc(doc, lockType, 1*60*60*1000, login_user,rt,false,lockInfo);
		
		if(docLock == null)
		{	
			Log.debug("updateVirualDocContent() lockDoc Failed");
			return false;
		}
		
		boolean ret = updateVirualDocContent_FSM(repos, doc, commitMsg, commitUser, login_user, rt, actionList);
		
		//revert the lockStatus
		unlockDoc(doc, lockType, login_user);
				
		return ret;
	}
	
	protected boolean commitVirualDoc(Repos repos, Doc doc, 
			String commitMsg, String commitUser, User login_user,ReturnAjax rt, List<CommonAction> actionList) 
	{
		Doc vDoc = buildVDoc(doc);
		verReposDocCommit(repos, false, vDoc, commitMsg, commitUser,rt, true, null, 2, null);

		//Insert Push Action
		CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.PUSH, DocType.VIRTURALDOC, null, login_user, false);

		//Insert index add action for VDoc
		CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.INDEX, Action.UPDATE, DocType.VIRTURALDOC, null, login_user, false);
		return true;
	}
	
	protected void deleteTmpVirtualDocContent(Repos repos, Doc doc, User accessUser) {
		
		String docVName = Path.getVDocName(doc);
		
		String userTmpDir = Path.getReposTmpPathForTextEdit(repos, accessUser, false);
		
		String vDocPath = userTmpDir + docVName + "/";
		
		FileUtil.delFileOrDir(vDocPath);
	}
	
	protected void deleteTmpRealDocContent(Repos repos, Doc doc, User accessUser) 
	{
		String userTmpDir = Path.getReposTmpPathForTextEdit(repos, accessUser, true);
		String mdFilePath = userTmpDir + doc.getDocId() + "_" + doc.getName();
		FileUtil.delFileOrDir(mdFilePath);
	}
	

	private boolean updateVirualDocContent_FSM(Repos repos, Doc doc,
			String commitMsg, String commitUser, User login_user, ReturnAjax rt, List<CommonAction> actionList) 
	{
		//Save the content to virtual file
		if(isVDocExist(repos, doc) == true)
		{
			if(saveVirtualDocContent(repos, doc, rt) == true)
			{
				Doc vDoc = buildVDoc(doc);
				verReposDocCommit(repos, false, vDoc, commitMsg, commitUser,rt, true, null, 2, null);

				//Insert Push Action
				CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.PUSH, DocType.VIRTURALDOC, null, login_user, false);

				//Insert index add action for VDoc
				CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.INDEX, Action.UPDATE, DocType.VIRTURALDOC, null, login_user, false);
				return true;
			}
		}
		else
		{	
			//创建虚拟文件目录：用户编辑保存时再考虑创建
			if(createVirtualDoc(repos, doc, rt) == true)
			{
				Doc vDoc = buildVDoc(doc);
				verReposDocCommit(repos, false, vDoc, commitMsg, commitUser,rt, true, null, 2, null);

				//Insert Push Action
				CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.VERREPOS, Action.PUSH, DocType.VIRTURALDOC, null, login_user, false);

				//Insert index update action for VDoc
				CommonAction.insertCommonAction(actionList, repos, doc, null, commitMsg, commitUser, ActionType.INDEX, Action.ADD, DocType.VIRTURALDOC, null, login_user, false);
				return true;
			}
		}
				
		return false;
	}

	/********************* DocSys权限相关接口 ****************************/
	//检查用户的新增权限
	protected boolean checkUserAddRight(Repos repos, Integer userId, Doc doc,  DocAuth authMask, ReturnAjax rt) 
	{		
		DocAuth docUserAuth = getUserDocAuthWithMask(repos, userId, doc, authMask);
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
			else if(docUserAuth.getAddEn() == null || docUserAuth.getAddEn() != 1)
			{
				rt.setError("您没有该目录的新增权限，请联系管理员");
				return false;				
			}
		}
		return true;
	}

	protected boolean checkUserDeleteRight(Repos repos, Integer userId, Doc doc,  DocAuth authMask, ReturnAjax rt)
	{	
		DocAuth docUserAuth = getUserDocAuthWithMask(repos, userId, doc, authMask);
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
			else if(docUserAuth.getDeleteEn() == null || docUserAuth.getDeleteEn() != 1)
			{
				rt.setError("您没有该目录的删除权限，请联系管理员");
				return false;				
			}
		}
		return true;
	}
	
	protected boolean checkUserEditRight(Repos repos, Integer userId, Doc doc,  DocAuth authMask, ReturnAjax rt)
	{
		DocAuth docUserAuth = getUserDocAuthWithMask(repos, userId, doc, authMask);
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
			else if(docUserAuth.getEditEn() == null || docUserAuth.getEditEn() != 1)
			{
				rt.setError("您没有该文件的编辑权限，请联系管理员");
				return false;				
			}
		}
		return true;
	}
	
	protected boolean checkUseAccessRight(Repos repos, Integer userId, Doc doc, DocAuth authMask, ReturnAjax rt)
	{
		DocAuth docAuth = getUserDocAuthWithMask(repos, userId, doc, authMask);
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
	
	protected boolean checkUserAdminRight(Repos repos, Integer userId, Doc doc,  DocAuth authMask, ReturnAjax rt) 
	{		
		DocAuth docUserAuth = getUserDocAuthWithMask(repos, userId, doc, authMask);
		if(docUserAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			return false;
		}
		else
		{
			if(docUserAuth.getIsAdmin() == 0)
			{
				rt.setError("您无权管理该目录，请联系管理员");
				return false;
			}
			else if(docUserAuth.getIsAdmin() == null || docUserAuth.getIsAdmin() != 1)
			{
				rt.setError("您没有该目录的管理权限，请联系管理员");
				return false;				
			}
		}
		return true;
	}
	
	protected boolean checkUserDownloadRight(Repos repos, Integer userId, Doc doc, DocAuth authMask, ReturnAjax rt)
	{
		DocAuth docAuth = getUserDocAuthWithMask(repos, userId, doc, authMask);
		if(docAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			return false;
		}
		else
		{
			Integer downloadEn = docAuth.getDownloadEn();
			if(downloadEn == null || downloadEn.equals(0))
			{
				rt.setError("您无权下载该文件，请联系管理员");
				return false;
			}
		}
		return true;
	}

	protected boolean checkUserShareRight(Repos repos, Integer userId, Doc doc, DocAuth authMask, ReturnAjax rt)
	{
		DocAuth docAuth = getUserDocAuthWithMask(repos, userId, doc, authMask);
		if(docAuth == null)
		{
			rt.setError("您无此操作权限，请联系管理员");
			return false;
		}
		else
		{
			Integer downloadEn = docAuth.getDownloadEn();
			if(downloadEn == null || downloadEn.equals(0))
			{
				rt.setError("您无权分享该文件，请联系管理员");
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
				Log.debug("getUserName() user:" +userId+ "not exists");
				return null;
			}
			return user.getName();
		}
	}

	
	private String getGroupName(Integer groupId) {
		UserGroup group = reposService.getGroupInfo(groupId);
		if(group == null)
		{
			Log.debug("getGroupName() Group:" +groupId+ "not exists");
			return null;
		}
		return group.getName();
	}
	

	//获取用户的仓库权限设置
	private HashMap<Integer, ReposAuth> getUserReposAuthHashMap(Integer userId) {
		ReposAuth qReposAuth = new ReposAuth();
		qReposAuth.setUserId(userId);
		List <ReposAuth> reposAuthList = reposService.getReposAuthListForUser(qReposAuth);
		//Log.printObject("getUserReposAuthHashMap() userID[" + userId +"] reposAuthList:", reposAuthList);
		
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
			Log.debug("超级管理员");
			return true;
		}
		
		DocAuth userDocAuth = getUserDocAuth(repos, login_user.getId(), doc);
		if(userDocAuth != null && userDocAuth.getIsAdmin() != null && userDocAuth.getIsAdmin() == 1)
		{
			return true;
		}
		return false;
	}
	
	protected boolean isAdminOfRootDoc(Repos repos, User login_user) 
	{
		Doc doc = buildRootDoc(repos, null, null);
		if(login_user.getType() == 2)	//超级管理员可以访问所有目录
		{
			Log.debug("超级管理员");
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
			Log.debug("超级管理员");
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
		Log.debug("getUserReposAuth() UserID:"+UserID);
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
		Log.debug("getGroupDispDocAuth() groupId:"+groupId);
		
		DocAuth docAuth = getGroupDocAuth(repos, groupId, doc);	//获取用户真实的权限
		
		if(groupId == 0)
		{
			Log.debug("getGroupDispDocAuth() groupId:"+groupId + " 无效的group权限");
			return null;
		}
		
		String groupName = getGroupName(groupId);
		if(groupName == null)
		{
			Log.debug("getGroupDispDocAuth() groupId:"+groupId + " 不存在，删除reposAuth和docAuth");
			 //删除无效权限设置
			DocAuth qDocAuth = new DocAuth();
			qDocAuth.setGroupId(groupId);		
			qDocAuth.setReposId(repos.getId());		
			reposService.deleteDocAuthSelective(qDocAuth);
			
			//删除无效组的所有仓库权限
			ReposAuth qReposAuth = new ReposAuth();
			qReposAuth.setGroupId(groupId);		
			qReposAuth.setReposId(repos.getId());		
			reposService.deleteReposAuthSelective(qReposAuth);
			return null;
		}
			 
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
				Log.debug("getGroupDispDocAuth() docAuth为继承的权限,需要删除reposAuthId并设置groupId、groupName");
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
		Log.debug("getUserDispDocAuth() UserID:"+UserID);
		
		DocAuth docAuth = getUserDocAuth(repos, UserID, doc);	//获取用户真实的权限
		Log.printObject("getUserDispDocAuth() docAuth:",docAuth);
		
		//Get UserName
		String UserName = getUserName(UserID);
		if(UserName == null)
		{
			Log.debug("getUserDispDocAuth() UserID:"+UserID + " 不存在，删除reposAuth和docAuth");
			//删除无效用户的所有文件权限
			DocAuth qDocAuth = new DocAuth();
			qDocAuth.setUserId(UserID);
			qDocAuth.setReposId(repos.getId());
			reposService.deleteDocAuthSelective(qDocAuth);
			
			//删除无效用户的所有仓库权限
			ReposAuth qReposAuth = new ReposAuth();
			qReposAuth.setUserId(UserID);		
			qReposAuth.setReposId(repos.getId());		
			reposService.deleteReposAuthSelective(qReposAuth);
			return null;
		}
		
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
			Log.printObject("getUserDispDocAuth() docAuth:",docAuth);
			if(docAuth.getUserId() == null || !docAuth.getUserId().equals(UserID) || !docAuth.getDocId().equals(doc.getDocId()))
			{
				Log.debug("getUserDispDocAuth() docAuth为继承的权限,需要删除reposAuthId并设置userID、UserName");
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
	
	protected DocAuth getUserDocAuthWithMask(Repos repos, Integer userId, Doc doc, DocAuth authMask) 
	{
		DocAuth docAuth = getUserDocAuth(repos, userId, doc);
		if(docAuth == null || authMask == null)
		{
			return docAuth;
		}
		
		updateDocAuthWithMask(docAuth, authMask);
		return docAuth;
	}
	
	protected void updateDocAuthWithMask(DocAuth docAuth, DocAuth authMask)
	{
		if(authMask.getAccess() == null || authMask.getAccess() == 0)
		{
			docAuth.setAccess(0);
		}
		
		if(authMask.getAddEn() == null || authMask.getAddEn() == 0)
		{
			docAuth.setAddEn(0);
		}

		if(authMask.getDeleteEn() == null || authMask.getDeleteEn() == 0)
		{
			docAuth.setDeleteEn(0);
		}
		
		if(authMask.getEditEn() == null || authMask.getEditEn() == 0)
		{
			docAuth.setEditEn(0);
		}

		if(authMask.getHeritable() == null || authMask.getHeritable() == 0)
		{
			docAuth.setHeritable(0);
		}
		
		if(authMask.getDownloadEn() == null || authMask.getDownloadEn() == 0)
		{
			docAuth.setDownloadEn(0);
		}
	}
	
	protected DocAuth getUserDocAuth(Repos repos, Integer userId, Doc doc) 
	{
		return getRealDocAuth(repos, userId, null, doc);
	}
	
	//Function:getUserDocAuth
	protected DocAuth getRealDocAuth(Repos repos, Integer userId,Integer groupId, Doc doc) 
	{
		//Log.debug("getRealDocAuth()  reposId:"+ repos.getId() + " userId:" + userId + " groupId:"+ groupId + " docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " docName:" + doc.getName());
		
		//获取从docId到rootDoc的全路径，put it to docPathList
		List<Long> docIdList = new ArrayList<Long>();
		docIdList = getDocIdList(repos, doc, docIdList);
		if(docIdList == null || docIdList.size() == 0)
		{
			return null;
		}
		//Log.printObject("getRealDocAuth() docIdList:",docIdList); 
		
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
			//Log.debug("getRealDocAuth() curDocId[" + i+ "]:" + curDocId); 
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
			
			Long tempDocId = Path.buildDocIdByName(i, tmpPath, tmpName);
			docIdList.add(tempDocId);
			
			tmpPath = tmpPath + tmpName + "/";
		}
		
		return docIdList;
	}

	protected HashMap<Long,DocAuth> getUserDocAuthHashMapWithMask(Integer UserID,Integer reposID, DocAuth authMask) 
	{
		HashMap<Long,DocAuth> hashMap = getUserDocAuthHashMap(UserID, reposID);
		if(hashMap == null || authMask == null)
		{
			return hashMap;
		}
		
		for (HashMap.Entry<Long, DocAuth> entry : hashMap.entrySet()) 
		{
			DocAuth docAuth = entry.getValue();
			updateDocAuthWithMask(docAuth, authMask);
		}
		return hashMap;
	}
	
	protected HashMap<Long,DocAuth> getUserDocAuthHashMap(Integer UserID,Integer reposID) 
	{
		List <DocAuth> anyUserDocAuthList = getAuthListForAnyUser(reposID);
		Log.printObject("getUserDocAuthHashMap() "+ "userID[" + UserID + "] anyUserDocAuthList:", anyUserDocAuthList);
		
		List <DocAuth> docAuthList = null;
		if(UserID != 0)
		{
			DocAuth docAuth = new DocAuth();
			docAuth.setUserId(UserID);			
			docAuth.setReposId(reposID);
			docAuthList = reposService.getDocAuthForUser(docAuth);
			Log.printObject("getUserDocAuthHashMap() "+ "userID[" + UserID + "] docAuthList:", docAuthList);
		}
		docAuthList = appendAnyUserAuthList(docAuthList, anyUserDocAuthList);	
		Log.printObject("getUserDocAuthHashMap() "+ "userID[" + UserID + "] combined docAuthList:", docAuthList);
		
		if(docAuthList == null || docAuthList.size() == 0)
		{
			return null;
		}
		
		HashMap<Long,DocAuth> hashMap = BuildHashMapByDocAuthList(docAuthList);
		//Log.printObject("getUserDocAuthHashMap() "+ "userID:" + UserID + " hashMap:", hashMap);
		return hashMap;
	}

	//获取组在仓库上所有doc的权限设置: 仅用于显示group的权限
	protected HashMap<Long, DocAuth> getGroupDocAuthHashMap(Integer GroupID,Integer reposID) 
	{
		List <DocAuth> anyUserDocAuthList = getAuthListForAnyUser(reposID);
		Log.printObject("getGroupDocAuthHashMap() GroupID[" + GroupID +"] anyUserDocAuthList:", anyUserDocAuthList);

		DocAuth docAuth = new DocAuth();
		docAuth.setGroupId(GroupID);
		docAuth.setReposId(reposID);
		List <DocAuth> docAuthList = reposService.getDocAuthForGroup(docAuth);
		Log.printObject("getGroupDocAuthHashMap() GroupID[" + GroupID +"] docAuthList:", docAuthList);

		docAuthList = appendAnyUserAuthList(docAuthList, anyUserDocAuthList);	
		Log.printObject("getGroupDocAuthHashMap() GroupID[" + GroupID +"] combined docAuthList:", docAuthList);
		
		if(docAuthList == null || docAuthList.size() == 0)
		{
			return null;
		}
		
		HashMap<Long, DocAuth> hashMap = BuildHashMapByDocAuthList(docAuthList);
		//Log.printObject("getGroupDocAuthHashMap() GroupID[" + GroupID +"] hashMap:", hashMap);
		return hashMap;
	}
	
	
	private List<DocAuth> appendAnyUserAuthList(List<DocAuth> docAuthList, List<DocAuth> anyUserDocAuthList) {
		if(anyUserDocAuthList == null || anyUserDocAuthList.size() == 0)
		{
			return docAuthList;
		}
		
		if(docAuthList == null)
		{
			docAuthList = new ArrayList<DocAuth>();
		}
		
		for(int i=0; i<anyUserDocAuthList.size(); i++)
		{
			DocAuth anyUserDocAuth = anyUserDocAuthList.get(i);
			if(isValidAnyUserDocAuth(anyUserDocAuth))
			{
				docAuthList.add(anyUserDocAuth);
			}
		}		
		return docAuthList;
	}

	private boolean isValidAnyUserDocAuth(DocAuth anyUserDocAuth) {
		if(anyUserDocAuth.getGroupId() == null || anyUserDocAuth.getGroupId() == 0)
		{
			return true;
		}
		return false;
	}

	private List<DocAuth> getAuthListForAnyUser(Integer reposID) {
		DocAuth docAuth = new DocAuth();
		docAuth.setUserId(0);			
		docAuth.setReposId(reposID);
		List<DocAuth> list = reposService.getDocAuthForAnyUser(docAuth);
		return list;
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
		if(tmpAuth.getDownloadEn()!=null && tmpAuth.getDownloadEn().equals(1))
		{
			auth.setDownloadEn(1);
		}
		if(tmpAuth.getUploadSize() == null || (auth.getUploadSize() != null && tmpAuth.getUploadSize() > auth.getUploadSize()))
		{
			auth.setUploadSize(tmpAuth.getUploadSize());
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
		if(tmpAuth.getDownloadEn()!=null && tmpAuth.getDownloadEn().equals(1))
		{
			auth.setDownloadEn(1);
		}
		if(tmpAuth.getHeritable()!=null && tmpAuth.getHeritable().equals(1))
		{
			auth.setHeritable(1);
		}
		
		//如果tmpAuth的uploadSize大于auth那么取tmpAuth的值
		Long tmpMaxUploadSize = tmpAuth.getUploadSize(); 
		if(tmpMaxUploadSize != null && tmpMaxUploadSize > 0)
		{
			if(isUploadSizeExceeded(tmpMaxUploadSize, auth.getUploadSize()))
			{
				auth.setUploadSize(tmpAuth.getUploadSize());
			}
		}
		else
		{
			auth.setUploadSize(Long.MAX_VALUE);
		}
	}
	
	//接口的第一个参数不能为空
	protected boolean isUploadSizeExceeded(Long size, Long maxUploadSize) {
		//注意：最大上传限制值小于等于0将被作为不限制处理		
		if(maxUploadSize != null && maxUploadSize > 0 && size > maxUploadSize)
		{
			return true;
		}
		return false;
	}
	
	//这是一个非常重要的底层接口，每个doc的权限都是使用这个接口获取的
	protected DocAuth getDocAuthFromHashMap(Long docId, DocAuth parentDocAuth,HashMap<Long,DocAuth> docAuthHashMap)
	{
		//Log.debug("getDocAuthFromHashMap() docId:" + docId);
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
			Log.debug("getDocAuthFromHashMap() docId:" + docId + " parentDocAuth is null");
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
				Log.debug("getDocAuthFromHashMap() docId:" + docId + "docAuth is null and parentHeritable is null or 0");
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
					Log.debug("getDocAuthFromHashMap() docId:" + docId + " docAuth priority < parentPriority and parentHeritable is null or 0");
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
		Log.debug("createRealDoc() localRootPath:" + doc.getLocalRootPath() + " path:" + doc.getPath() + " name:" + doc.getName());
		
		String name = doc.getName();
		Integer type = doc.getType();
		
		//获取 doc parentPath
		String localParentPath =  doc.getLocalRootPath() + doc.getPath();

		String localDocPath = localParentPath + name;
		
		if(type == null || type == 1)
		{
			if(false == FileUtil.createFile(localParentPath,name))
			{
				docSysDebugLog("createRealDoc() FileUtil.createFile 文件 " + localDocPath + "创建失败！", rt);
				return false;					
			}
		}
		else //if(type == 2) //目录
		{
			if(false == FileUtil.createDir(localDocPath))
			{
				docSysDebugLog("createRealDoc() 目录 " +localDocPath + " 创建失败！", rt);
				return false;
			}				
		}

		return true;
	}
	
	protected boolean deleteRealDoc(Repos repos, Doc doc, ReturnAjax rt) {
		
		String reposRPath = Path.getReposRealPath(repos);
		String parentPath = doc.getPath();
		String name = doc.getName();
		String localDocPath = reposRPath + parentPath + name;

		if(FileUtil.delFileOrDir(localDocPath) == false)
		{
			docSysDebugLog("deleteRealDoc() FileUtil.FileUtil.delFileOrDir " + localDocPath + "删除失败！", rt);
			return false;
		}
		
		return true;
	}
	
	//Function: updateRealDoc
	//Pramams:
	//chunkNum: null:非分片上传(直接用uploadFile存为文件)  1: 单文件或单分片文件  >1:多分片文件（需要进行合并）
	protected boolean updateRealDoc(Repos repos, Doc doc, MultipartFile uploadFile, Integer chunkNum, Long chunkSize, String chunkParentPath, ReturnAjax rt) 
	{
		String parentPath = doc.getPath();
		String name = doc.getName();
		Long fileSize = doc.getSize();
		String fileCheckSum = doc.getCheckSum();
		
		String reposRPath = Path.getReposRealPath(repos);
		
		String localDocParentPath = reposRPath + parentPath;
		String retName = null;
		try {
			if(null == chunkNum)	//非分片上传
			{
				retName = FileUtil.saveFile(uploadFile, localDocParentPath,name);
			}
			else if(chunkNum == 1)	//单个文件直接复制
			{
				String chunk0Path = chunkParentPath + name + "_0";
				if(new File(chunk0Path).exists() == false)
				{
					chunk0Path =  chunkParentPath + name;
				}
				if(FileUtil.copyFile(chunk0Path, localDocParentPath+name, true) == false)
				{
					return false;
				}
				retName = name;
			}
			else	//多个则需要进行合并
			{
				retName = combineChunks(localDocParentPath,name,chunkNum,chunkSize,chunkParentPath);
			}
			//Verify the size and FileCheckSum
			if(false == checkFileSizeAndCheckSum(localDocParentPath,name,fileSize,fileCheckSum))
			{
				Log.debug("updateRealDoc() checkFileSizeAndCheckSum Error");
				return false;
			}			
		} catch (Exception e) {
			Log.debug("updateRealDoc() FileUtil.saveFile " + name +" 异常！");
			docSysDebugLog(e.toString(), rt);
			Log.info(e);
			return false;
		}
		
		Log.debug("updateRealDoc() FileUtil.saveFile return: " + retName);
		if(retName == null  || !retName.equals(name))
		{
			Log.debug("updateRealDoc() FileUtil.saveFile " + name +" Failed！");
			return false;
		}
		
		encryptFile(repos, localDocParentPath, name);
		return true;
	}
	
	//文件加密
	private void encryptFile(Repos repos, String localPath, String name) {
		if(repos.encryptType != null && repos.encryptType != 0)
		{
	    	Channel channel = ChannelFactory.getByChannelName("businessChannel");
			if(channel != null)
	        {	
				channel.encryptFile(repos, localPath, name);
	        }
		}
	}
	
	private byte[] encryptData(Repos repos, byte[] data) {
		if(repos.encryptType != null && repos.encryptType != 0)
		{
	    	Channel channel = ChannelFactory.getByChannelName("businessChannel");
			if(channel != null)
	        {	
				return channel.encryptData(repos, data);
	        }
		}
		return data;
	}
	
	//文件解密
	protected void decryptFile(Repos repos, String path, String name) {
		if(repos.encryptType != null && repos.encryptType != 0)
		{
	    	Channel channel = ChannelFactory.getByChannelName("businessChannel");
			if(channel != null)
	        {	
				channel.decryptFile(repos, path, name);
	        }
		}
	}

	private byte[] decryptData(Repos repos, byte [] data) {
		if(repos.encryptType != null && repos.encryptType != 0)
		{
	    	Channel channel = ChannelFactory.getByChannelName("businessChannel");
			if(channel != null)
	        {	
				return channel.decryptData(repos, data);
	        }
		}
		return data;
	}

	protected void decryptFileOrDir(Repos repos, String path, String name) {
		Channel channel = null;
		if(repos.encryptType == null || repos.encryptType == 0)
		{
			return;
		}
	    channel = ChannelFactory.getByChannelName("businessChannel");
		if(channel == null)
	    {	
			return;
		}
		
		if(name == null || name.isEmpty())
		{
			decryptDir(channel, repos, path);	
			return;
		}
	
		File file = new File(path, name);
		if(file.isFile())
		{
			decryptFile(channel, repos, path, name);
		}
		else
		{
			decryptDir(channel, repos, path + name + "/");
		}
	}

	private void decryptDir(Channel channel, Repos repos, String dirPath) {
		File dir = new File(dirPath);
		File[] list = dir.listFiles();
		if(list != null)
		{
			for(int i=0; i<list.length; i++)
			{
				File subFile = list[i];
				if(subFile.isFile())
				{
					decryptFile(channel, repos, dirPath, subFile.getName());
				}
				else
				{
					decryptDir(channel, repos, dirPath + subFile.getName() + "/");
				}
			}
		}
	}

	//文件解密
	protected void decryptFile(Channel channel, Repos repos, String path, String name) {
		channel.decryptFile(repos, path, name);
	}
	
	//压缩文件解密
	protected Doc decryptRootZipDoc(Repos repos, Doc rootZipDoc) {
		Doc tempRootDoc = rootZipDoc;
		if(repos.encryptType != null && repos.encryptType != 0)
		{
			//TODO: getReposTmpPathForZipDecrypt 返回的路径没有区分用户，也就是说用户将共用解压后的zip文件，这里没有上锁，所以存在风险
			String zipDocDecryptPath = Path.getReposTmpPathForZipDecrypt(repos, rootZipDoc);
			File rootFile = new File(rootZipDoc.getLocalRootPath() + rootZipDoc.getPath(), rootZipDoc.getName());
			String tmpLocalRootPathForZipDoc = zipDocDecryptPath + rootFile.lastModified() + "/";
			if(FileUtil.isFileExist(tmpLocalRootPathForZipDoc + rootZipDoc.getPath() + rootZipDoc.getName()) == false)
			{
				FileUtil.clearDir(tmpLocalRootPathForZipDoc);	//删除旧的临时文件
				FileUtil.createDir(tmpLocalRootPathForZipDoc);
				FileUtil.copyFile(rootZipDoc.getLocalRootPath() + rootZipDoc.getPath() + rootZipDoc.getName(), tmpLocalRootPathForZipDoc + rootZipDoc.getPath() + rootZipDoc.getName(), true);
				decryptFile(repos, tmpLocalRootPathForZipDoc + rootZipDoc.getPath(), rootZipDoc.getName());
			}
			tempRootDoc = buildBasicDoc(rootZipDoc.getVid(), null, null, rootZipDoc.getReposPath(), rootZipDoc.getPath(), rootZipDoc.getName(), null, 1, true, tmpLocalRootPathForZipDoc, null, null, null);
		}
		return tempRootDoc;
	}
	
	//Function: updateRealDoc
	//Pramams:
	//chunkNum: null:非分片上传(直接用uploadFile存为文件)  1: 单文件或单分片文件  >1:多分片文件（需要进行合并）
	protected boolean updateRealDoc(Repos repos, Doc doc, byte[] docData, Integer chunkNum, Long chunkSize, String chunkParentPath, ReturnAjax rt) 
	{
		String parentPath = doc.getPath();
		String name = doc.getName();
		Long fileSize = doc.getSize();
		String fileCheckSum = doc.getCheckSum();
		
		String reposRPath = Path.getReposRealPath(repos);
		
		String localDocParentPath = reposRPath + parentPath;
		String retName = null;
		try {
			if(null == chunkNum)	//非分片上传
			{
				if(false == checkFileSizeAndCheckSum((long)docData.length, null, doc.getSize(), fileCheckSum))
				{
					Log.debug("updateRealDoc() checkFileSizeAndCheckSum Error1");
					return false;
				}
				if(FileUtil.saveDataToFile(docData, localDocParentPath,name))
				{
					retName = name;
				}
			}
			else if(chunkNum == 1)	//单个文件直接复制
			{
				String chunk0Path = chunkParentPath + name + "_0";
				if(new File(chunk0Path).exists() == false)
				{
					chunk0Path =  chunkParentPath + name;
				}
				
				//Verify the size and FileCheckSum
				if(false == checkFileSizeAndCheckSum(new File(chunk0Path).length(), null, fileSize,fileCheckSum))
				{
					Log.debug("updateRealDoc() checkFileSizeAndCheckSum Error2");
					return false;
				}
				
				if(FileUtil.copyFile(chunk0Path, localDocParentPath+name, true) == false)
				{
					return false;
				}
				retName = name;
			}
			else	//多个则需要进行合并
			{
				long size = 0;
				for(int chunkIndex = 0; chunkIndex < chunkNum; chunkIndex ++)
		        {
					File chunkFile =  new File(chunkParentPath + name + "_" + chunkIndex);
		        	size += chunkFile.length();
		        }
				//Verify the size and FileCheckSum
				if(false == checkFileSizeAndCheckSum(size, null, fileSize,fileCheckSum))
				{
					Log.debug("updateRealDoc() checkFileSizeAndCheckSum Error3");
					return false;
				}
				
				retName = combineChunks(localDocParentPath,name,chunkNum,chunkSize,chunkParentPath);
			}			
		} catch (Exception e) {
			Log.debug("updateRealDoc() FileUtil.saveFile " + name +" 异常！");
			docSysDebugLog(e.toString(), rt);
			Log.info(e);
			return false;
		}
		
		Log.debug("updateRealDoc() FileUtil.saveFile return: " + retName);
		if(retName == null  || !retName.equals(name))
		{
			Log.debug("updateRealDoc() FileUtil.saveFile " + name +" Failed！");
			return false;
		}
		
		encryptFile(repos, localDocParentPath, name);
		return true;
	}
	
	protected String combineChunks(String targetParentPath,String fileName, Integer chunkNum,Long chunkSize, String chunkParentPath) {
		FileOutputStream out = null;
		FileInputStream in = null;	
		FileChannel outputChannel = null;
		FileChannel inputChannel = null;
		String ret = null;
		try {
			String targetFilePath = targetParentPath + fileName;
		
			out = new FileOutputStream(targetFilePath);
	        outputChannel = out.getChannel();   

        	long offset = 0;
	        for(int chunkIndex = 0; chunkIndex < chunkNum; chunkIndex ++)
	        {
	        	String chunkFilePath = chunkParentPath + fileName + "_" + chunkIndex;
	        	in=new FileInputStream(chunkFilePath);
	            inputChannel = in.getChannel();    
	            outputChannel.transferFrom(inputChannel, offset, inputChannel.size());
	        	offset += inputChannel.size();	        			
	    	   	inputChannel.close();
	    	   	inputChannel = null;
	    	   	in.close();
	    	   	in = null;
	    	}
		    ret = fileName;
		} catch (Exception e) {
			Log.debug("combineChunks() Failed to combine the chunks");
			Log.info(e);
		} finally {
			if(inputChannel != null)
			{
				try {
					inputChannel.close();
				} catch (IOException e) {
					Log.info(e);
				}
			}
			if(in != null)
			{
				try {
					in.close();
				} catch (Exception e) {
					Log.info(e);
				}
			}
			if(outputChannel != null)
			{
				try {
					outputChannel.close();
				} catch (IOException e) {
					Log.info(e);
				}
			}
			if(out != null)
			{	
				try {
					out.close();
				} catch (IOException e) {
					Log.info(e);
				}
			}		
		}
		return ret;
	}
	
	public void deleteChunks(String name, Integer chunkIndex, Integer chunkNum, String chunkParentPath) {
		Log.debug("deleteChunks() name:" + name + " chunkIndex:" + chunkIndex  + " chunkNum:" + chunkNum + " chunkParentPath:" + chunkParentPath);
		
		if(null == chunkNum || chunkIndex < (chunkNum-1))
		{
			return;
		}
		
		Log.debug("deleteChunks() name:" + name + " chunkIndex:" + chunkIndex  + " chunkNum:" + chunkNum + " chunkParentPath:" + chunkParentPath);
		try {
	        for(int i = 0; i < chunkNum; i ++)
	        {
	        	String chunkFilePath = chunkParentPath + name + "_" + i;
	        	FileUtil.delFile(chunkFilePath);
	    	}
		} catch (Exception e) {
			Log.debug("deleteChunks() Failed to combine the chunks");
			Log.info(e);
		}  
	}
	
	protected static String getFileCheckSum(String filePath) {
		String checkSum = null;
		
		//检查文件是否存在
		File f = new File(filePath);
		if(!f.exists()){
			return null;
		}

		FileInputStream in = null;
		try {
			in = new FileInputStream(filePath);
			checkSum=DigestUtils.md5Hex(in);
			in.close();
		} catch (Exception e) {
			Log.debug("isChunkMatched() Exception"); 
			Log.info(e);
		} finally {
			if(in != null)
			{
				try {
					in.close();
				} catch (Exception e) {
					Log.info(e);
				}
			}
		}

		return checkSum;
	}
	
	protected boolean isChunkMatched(String chunkFilePath, String chunkHash) {
		
		String checkSum = getFileCheckSum(chunkFilePath);
		if(checkSum == null)
		{
			return false;
		}

		if(checkSum.equals(chunkHash))
		{
			return true;
		}
		return false;
	}
	
	protected boolean checkFileSizeAndCheckSum(String localDocParentPath, String name, Long fileSize,
			String fileCheckSum) {
		File file = new File(localDocParentPath,name);
		return checkFileSizeAndCheckSum(file.length(), null, fileSize, fileCheckSum);
	}
	
	protected boolean checkFileSizeAndCheckSum(Long size, String checkSum, Long expSize, String expCheckSum) {
		if(!size.equals(expSize))
		{
			Log.debug("checkFileSizeAndCheckSum() size:" + size + " is not match with ExpectedSize:" + expSize);
			return false;
		}
		return true;
	}
	
	protected boolean moveRealDoc(Repos repos, Doc srcDoc, Doc dstDoc, ReturnAjax rt) 
	{
		if(isFSM(repos) == false)
		{
			Log.debug("moveRealDoc 前置仓库不需要本地移动");
			return true;
		}	
		
		String reposRPath = Path.getReposRealPath(repos);
		String srcParentPath = srcDoc.getPath();
		String srcName = srcDoc.getName();
		String dstParentPath = dstDoc.getPath();
		String dstName = dstDoc.getName();
		
		String srcDocPath = reposRPath + srcParentPath + srcName;
		String dstDocPath = reposRPath + dstParentPath + dstName;

		if(FileUtil.isFileExist(srcDocPath) == false)
		{
			docSysDebugLog("moveRealDoc() 文件: " + srcDocPath + " 不存在", rt);
			return false;
		}
		
		if(FileUtil.isFileExist(dstDocPath) == true)
		{
			docSysDebugLog("moveRealDoc() 文件: " + dstDocPath + " 已存在", rt);
			return false;
		}
		
		if(FileUtil.moveFileOrDir(reposRPath + srcParentPath,srcName,reposRPath + dstParentPath,dstName,true) == false)	//强制覆盖
		{
			docSysDebugLog("moveRealDoc() move " + srcDocPath + " to "+ dstDocPath + " Failed", rt);
			return false;
		}
		return true;
	}
	
	protected boolean copyRealDoc(Repos repos, Doc srcDoc, Doc dstDoc, ReturnAjax rt) 
	{
		if(isFSM(repos) == false)
		{
			Log.debug("copyRealDoc 前置仓库不需要本地复制");
			return true;
		}	
		
		String reposRPath = Path.getReposRealPath(repos);
		String srcParentPath = srcDoc.getPath();
		String srcName = srcDoc.getName();
		String dstParentPath = dstDoc.getPath();
		String dstName = dstDoc.getName();
		
		String srcDocPath = reposRPath + srcParentPath + srcName;
		String dstDocPath = reposRPath + dstParentPath + dstName;

		if(FileUtil.isFileExist(srcDocPath) == false)
		{
			docSysDebugLog("copyRealDoc() 文件: " + srcDocPath + " 不存在", rt);
			return false;
		}
		
		if(FileUtil.isFileExist(dstDocPath) == true)
		{
			docSysDebugLog("copyRealDoc() 文件: " + dstDocPath + " 已存在", rt);
			return false;
		}
		

		if(false == FileUtil.copyFileOrDir(srcDocPath, dstDocPath, true))
		{
			docSysDebugLog("copyRealDoc copy " + srcDocPath + " to " + dstDocPath + " 失败", rt);
			return false;
		}
		return true;
	}

	private boolean isVDocExist(Repos repos, Doc doc) {
		
		String vDocName = Path.getVDocName(doc);
		return FileUtil.isFileExist(doc.getLocalVRootPath() + vDocName);
	}
	
	//create Virtual Doc
	protected boolean createVirtualDoc(Repos repos, Doc doc, ReturnAjax rt) 
	{
		String content = doc.getContent();
		if(content == null || content.isEmpty())
		{
			Log.debug("createVirtualDoc() content is empty");
			return false;
		}
				
		String docVName = Path.getVDocName(doc);
		
		String vDocPath = doc.getLocalVRootPath() + docVName;
		Log.debug("vDocPath: " + vDocPath);
			
		if(false == FileUtil.createDir(vDocPath))
		{
			docSysDebugLog("目录 " + vDocPath + " 创建失败！", rt);
			return false;
		}
		if(FileUtil.createDir(vDocPath + "/res") == false)
		{
			docSysDebugLog("目录 " + vDocPath + "/res" + " 创建失败！", rt);
			return false;
		}
		if(FileUtil.createFile(vDocPath,"content.md") == false)
		{
			docSysDebugLog("目录 " + vDocPath + "/content.md" + " 创建失败！", rt);
			return false;			
		}
		doc.setCharset("UTF-8");
		return saveVirtualDocContent(repos, doc, rt);
	}
	
	//从OfficeText文本文件中读取文本内容
	protected String readOfficeContent(Repos repos, Doc doc)
	{
		String userTmpDir = Path.getReposTmpPathForOfficeText(repos, doc);
		String officeTextFileName = Path.getOfficeTextFileName(doc);
		return FileUtil.readDocContentFromFile(userTmpDir, officeTextFileName);
	}
	
	//从OfficeText文本文件中读取文本内容
	protected String readOfficeContent(Repos repos, Doc doc, int offset, int size)
	{
		String userTmpDir = Path.getReposTmpPathForOfficeText(repos, doc);
		String officeTextFileName = Path.getOfficeTextFileName(doc);
		return FileUtil.readDocContentFromFile(userTmpDir, officeTextFileName, (long) offset, size);
	}
	
	//RealDoc读取采用自动检测的方案，在线编辑时返回给前端时必须全部转换成UTF-8格式
	protected boolean saveRealDocContent(Repos repos, Doc doc, ReturnAjax rt) 
	{	
		byte [] buff = null;
		if(doc.getCharset() == null && doc.autoCharsetDetect)
		{
			String charset = FileUtil.getCharset(doc.getLocalRootPath() + doc.getPath() + doc.getName());
			buff = FileUtil.getBytes(doc.getContent(), charset);
		}
		else
		{
			buff = FileUtil.getBytes(doc.getContent(), doc.getCharset());	
		}
		
		if(buff == null)
		{
			return false;
		}
		
		return FileUtil.saveDataToFile(buff, doc.getLocalRootPath() + doc.getPath(), doc.getName());
	}
	
	//支持加密文件的内容保存
	protected boolean saveRealDocContentEx(Repos repos, Doc doc, ReturnAjax rt) 
	{	
		byte [] buff = null;
		if(doc.getCharset() == null && doc.autoCharsetDetect)
		{
			String charset = getEncryptFileCharset(repos, doc.getLocalRootPath() + doc.getPath(), doc.getName());
			buff = FileUtil.getBytes(doc.getContent(), charset);
		}
		else
		{
			buff = FileUtil.getBytes(doc.getContent(), doc.getCharset());	
		}
		
		if(buff == null)
		{
			return false;
		}
		
		//数据加密
		buff = encryptData(repos, buff);
		return FileUtil.saveDataToFile(buff, doc.getLocalRootPath() + doc.getPath(), doc.getName());
	}

	protected String readRealDocContent(Repos repos, Doc doc) 
	{
		byte [] buff = FileUtil.readBufferFromFile(doc.getLocalRootPath() + doc.getPath(), doc.getName());
		if(buff == null)
		{
			return "";
		}
		
		if(doc.getCharset() == null && doc.autoCharsetDetect)
		{
			String charset = FileUtil.getCharset(doc.getLocalRootPath() + doc.getPath() + doc.getName());
			return FileUtil.getString(buff, charset);
		}
		return FileUtil.getString(buff, doc.getCharset());
	}
	
	//支持加密文件的内容读取
	protected String readRealDocContentEx(Repos repos, Doc doc) 
	{
		byte [] buff = FileUtil.readBufferFromFile(doc.getLocalRootPath() + doc.getPath(), doc.getName());
		if(buff == null)
		{
			return "";
		}
		
		decryptData(repos, buff);
		
		if(doc.getCharset() == null && doc.autoCharsetDetect)
		{
			String charset = FileUtil.getCharset(buff);
			return FileUtil.getString(buff, charset);
		}
		return FileUtil.getString(buff, doc.getCharset());
	}
	
	private String getEncryptFileCharset(Repos repos, String path, String name) {
		byte[] buff = FileUtil.readBufferFromFile(path, name, (long)0, 20*1024);	//最大只读取20M的内容用于确定字符集
		if(buff == null)
		{
			return null;
		}
		decryptData(repos, buff);
		return FileUtil.getCharset(buff);
	}

	//读取文件部分数据无法解密
	protected String readRealDocContent(Repos repos, Doc doc, int offset, int size) 
	{
		if(doc.getCharset() == null  && doc.autoCharsetDetect)
		{
			return FileUtil.readDocContentFromFile(doc.getLocalRootPath() + doc.getPath(), doc.getName(), (long) offset, size);
		}
		return FileUtil.readDocContentFromFile(doc.getLocalRootPath() + doc.getPath(), doc.getName(), doc.getCharset(), (long) offset, size);
	}
	
	protected boolean saveTmpRealDocContent(Repos repos, Doc doc, User login_user, ReturnAjax rt) 
	{	
		String userTmpDir = Path.getReposTmpPathForTextEdit(repos,login_user, true);
		if(doc.getCharset() == null  && doc.autoCharsetDetect)
		{
			return FileUtil.saveDocContentToFile(doc.getContent(), userTmpDir, doc.getDocId() + "_" + doc.getName());			
		}
		return FileUtil.saveDocContentToFile(doc.getContent(), userTmpDir, doc.getDocId() + "_" + doc.getName(), doc.getCharset());
	}

	protected String readTmpRealDocContent(Repos repos, Doc doc, User login_user) 
	{
		String userTmpDir = Path.getReposTmpPathForTextEdit(repos,login_user, true);
		if(doc.getCharset() == null  && doc.autoCharsetDetect)
		{		
			return FileUtil.readDocContentFromFile(userTmpDir, doc.getDocId() + "_" + doc.getName());
		}
		return FileUtil.readDocContentFromFile(userTmpDir, doc.getDocId() + "_" + doc.getName(), doc.getCharset());
	}
	
	//virtualDoc 使用UTF-8格式字符串
	protected boolean saveVirtualDocContent(Repos repos, Doc doc, ReturnAjax rt) 
	{	
		String docVName = Path.getVDocName(doc);
		
		String encode = doc.getCharset();
		if(encode == null && doc.autoCharsetDetect)
		{
			encode = FileUtil.getCharset(doc.getLocalVRootPath() + docVName + "/" + "content.md");
			if(encode == null)
			{
				encode = "UTF-8";
			}
		}
		return FileUtil.saveDocContentToFile(doc.getContent(), doc.getLocalVRootPath() + docVName + "/", "content.md", encode);
	}
	protected String readVirtualDocContent(Repos repos, Doc doc) 
	{
		String docVName = Path.getVDocName(doc);		
		String encode = doc.getCharset();
		if(encode == null && doc.autoCharsetDetect)
		{
			encode = FileUtil.getCharset(doc.getLocalVRootPath() + docVName + "/" + "content.md");
			if(encode == null)
			{
				encode = "UTF-8";
			}
		}
		return FileUtil.readDocContentFromFile(doc.getLocalVRootPath() + docVName + "/", "content.md", encode);
	}
	
	protected String readVirtualDocContent(Repos repos, Doc doc, int offset, int size) 
	{
		String docVName = Path.getVDocName(doc);
		String localVRootPath = doc.getLocalVRootPath();
		if(localVRootPath == null || localVRootPath.isEmpty())
		{
			localVRootPath = Path.getReposVirtualPath(repos);
		}

		String encode = doc.getCharset();
		if(encode == null && doc.autoCharsetDetect)
		{
			encode = FileUtil.getCharset(localVRootPath + docVName + "/" + "content.md");
			if(encode == null)
			{
				encode = "UTF-8";
			}
		}
		return FileUtil.readDocContentFromFile(localVRootPath + docVName + "/", "content.md", encode, (long) offset, size);
	}

	protected boolean saveTmpVirtualDocContent(Repos repos, Doc doc, User login_user, ReturnAjax rt) 
	{	
		String docVName = Path.getVDocName(doc);
		String userTmpDir = Path.getReposTmpPathForTextEdit(repos,login_user, false);
		return FileUtil.saveDocContentToFile(doc.getContent(),  userTmpDir + docVName + "/", "content.md", "UTF-8");
	}
	protected String readTmpVirtualDocContent(Repos repos, Doc doc, User login_user) 
	{
		String docVName = Path.getVDocName(doc);		
		String userTmpDir = Path.getReposTmpPathForTextEdit(repos,login_user, false);
		return FileUtil.readDocContentFromFile(userTmpDir + docVName + "/", "content.md", "UTF-8");
	}
	
	protected boolean deleteVirtualDoc(Repos repos, Doc doc, ReturnAjax rt) {
		String reposVPath = Path.getReposVirtualPath(repos);
		String docVName = Path.getVDocName(doc);
		
		String localDocVPath = reposVPath + docVName;
		if(FileUtil.delDir(localDocVPath) == false)
		{
			docSysDebugLog("deleteVirtualDoc() FileUtil.delDir失败 " + localDocVPath, rt);
			return false;
		}
		return true;
	}
	
	protected boolean moveVirtualDoc(Repos repos, Doc doc,Doc newDoc, int subDocFlag, ReturnAjax rt) 
	{
		String reposVPath = Path.getReposVirtualPath(repos);
		
		String vDocName = Path.getVDocName(doc);
		
		String newVDocName = Path.getVDocName(newDoc);
				
		if(FileUtil.moveFileOrDir(reposVPath, vDocName, reposVPath, newVDocName, true) == false)
		{
			docSysDebugLog("moveVirtualDoc() moveFile " + reposVPath + vDocName+ " to " + reposVPath + newVDocName + " Failed", rt);
			return false;
		}
		
		if(subDocFlag == 2 && doc.getType() == 2)
		{
			moveVirtualDocForSubDocs(repos, doc, newDoc, subDocFlag, rt);
		}
		
		return true;
	}
	
	private void moveVirtualDocForSubDocs(Repos repos, Doc doc, Doc newDoc, int subDocFlag, ReturnAjax rt) {
		List<Doc> list = getLocalEntryList(repos, newDoc);
		if(list.size() > 0)
		{
			String subDocParentPath = getSubDocParentPath(doc);
			for(int i=0; i<list.size(); i++)
	        {
				Doc dstSubDoc = list.get(i);
	        	Doc srcSubDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, dstSubDoc.getName(), dstSubDoc.getLevel(), dstSubDoc.getType(), doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), dstSubDoc.getSize(), "");
	        	moveVirtualDoc(repos, srcSubDoc, dstSubDoc, subDocFlag, rt);
	        }
		}
	}

	protected boolean copyVirtualDoc(Repos repos, Doc doc,Doc newDoc, int subDocFlag, ReturnAjax rt) 
	{
		String reposVPath = Path.getReposVirtualPath(repos);
		
		String vDocName = Path.getVDocName(doc);
		
		String newVDocName = Path.getVDocName(newDoc);
		
		String srcDocFullVPath = reposVPath + vDocName;
		String dstDocFullVPath = reposVPath + newVDocName;
		if(FileUtil.copyDir(srcDocFullVPath,dstDocFullVPath,true) == false)
		{
			docSysDebugLog("copyVirtualDoc() FileUtil.copyDir " + srcDocFullVPath +  " to " + dstDocFullVPath + " Failed", rt);
			return false;
		}
		
		
		if(subDocFlag == 2 && doc.getType() == 2)
		{
			copyVirtualDocForSubDocs(repos, doc, newDoc, subDocFlag, rt);
		}
		
		return true;
	}
	
	private void copyVirtualDocForSubDocs(Repos repos, Doc doc, Doc newDoc, int subDocFlag, ReturnAjax rt) {
		List<Doc> list = getLocalEntryList(repos, newDoc);
		if(list.size() > 0)
		{
			String subDocParentPath = getSubDocParentPath(doc);
			for(int i=0; i<list.size(); i++)
	        {
				Doc dstSubDoc = list.get(i);
	        	Doc srcSubDoc = buildBasicDoc(doc.getVid(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, dstSubDoc.getName(), dstSubDoc.getLevel(), dstSubDoc.getType(), doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), dstSubDoc.getSize(), "");
	        	copyVirtualDoc(repos, srcSubDoc, dstSubDoc, subDocFlag, rt);
	        }
		}
	}
	
	//删除预览文件
	public void deletePreviewFile(Doc doc) 
	{
		if(doc == null || doc.getCheckSum() == null)
		{
			return;
		}
		
		String dstName = doc.getVid() + "_" + doc.getDocId() + ".pdf";
		String dstPath = getWebTmpPathForPreview() + dstName;
		FileUtil.delFileOrDir(dstPath);
	}
	
	/*************** DocSys verRepos操作接口 *********************/	
	protected List<LogEntry> verReposGetHistory(Repos repos,boolean convert, Doc doc, int maxLogNum) 
	{
		doc = docConvert(doc, convert);
		
		int verCtrl = getVerCtrl(repos, doc);
		if(verCtrl == 1)
		{
			return svnGetHistory(repos, doc, maxLogNum);
		}
		else if(verCtrl == 2)
		{
			return gitGetHistory(repos, doc, maxLogNum);
		}
		return null;
	}
	
	protected List<LogEntry> svnGetHistory(Repos repos, Doc doc, int maxLogNum) {

		SVNUtil svnUtil = new SVNUtil();
		if(false == svnUtil.Init(repos, doc.getIsRealDoc(), null))
		{
			Log.debug("svnGetHistory() svnUtil.Init Failed");
			return null;
		}
		return svnUtil.getHistoryLogs(doc.getPath() + doc.getName(), 0, -1, maxLogNum);
	}
	
	protected List<LogEntry> gitGetHistory(Repos repos, Doc doc, int maxLogNum) {
		GITUtil gitUtil = new GITUtil();
		if(false == gitUtil.Init(repos, doc.getIsRealDoc(), null))
		{
			Log.debug("gitGetHistory() gitUtil.Init Failed");
			return null;
		}
		return gitUtil.getHistoryLogs(doc.getPath() + doc.getName(), null, null, maxLogNum);
	}

	
	//Get History Detail
	protected List<ChangedItem> verReposGetHistoryDetail(Repos repos,boolean convert, Doc doc, String commitId) 
	{
		doc = docConvert(doc, convert);

		int verCtrl = getVerCtrl(repos, doc);
		if(verCtrl == 1)
		{
			return svnGetHistoryDetail(repos, doc, commitId);
		}
		else if(verCtrl == 2)
		{
			return gitGetHistoryDetail(repos, doc, commitId);
		}
		return null;
	}
	
	protected List<ChangedItem> svnGetHistoryDetail(Repos repos, Doc doc, String commitId) 
	{
		SVNUtil svnUtil = new SVNUtil();
		if(false == svnUtil.Init(repos, doc.getIsRealDoc(), null))
		{
			Log.debug("svnGetHistory() svnUtil.Init Failed");
			return null;
		}
		
		return svnUtil.getHistoryDetail(doc, commitId); 
	}
	
	protected List<ChangedItem> gitGetHistoryDetail(Repos repos, Doc doc, String commitId) 
	{
		GITUtil gitUtil = new GITUtil();
		if(false == gitUtil.Init(repos, doc.getIsRealDoc(), null))
		{
			Log.debug("gitGetHistory() gitUtil.Init Failed");
			return null;
		}
		
		return gitUtil.getHistoryDetail(doc, commitId);
	}
	
	private String remoteServerDocCommit(Repos repos, Doc doc, String commitMsg, User accessUser, ReturnAjax rt, boolean modifyEnable, int subDocCommitFlag) {
    	Log.debug("remoteServerDocCommit() for doc:[" + doc.getPath() + doc.getName() + "]");

		RemoteStorageConfig remote = repos.remoteServerConfig;
		if(remote == null)
		{
			Log.debug("remoteServerDocCommit() repos.remoteServerConfig 未设置");
			rt.setError("文件服务器设置错误！");
			return null;
		}
		
        RemoteStorageSession session = doRemoteStorageLogin(repos, remote);
        if(session == null)
        {
        	//再尝试三次
        	for(int i=0; i < 3; i++)
        	{
        		//Try Again
        		session = doRemoteStorageLogin(repos, remote);
        		if(session != null)
        		{
        			break;
        		}
        	}
        }
        
        if(session == null)
        {
        	Log.info("remoteServerDocCommit() 文件服务器登录失败！");
    		rt.setError("文件服务器登录失败！");
    		return null;			
    	}	
        
        if(doPushToRemoteStorage(session, remote, repos, doc, accessUser, commitMsg, subDocCommitFlag == 2, 4, rt) == false)
        {
            doRemoteStorageLogout(session);            
        	Log.info("remoteServerDocCommit() 文件推送失败！");
    		rt.setError("文件推送失败！");
        	return null;
        }
        doRemoteStorageLogout(session);            
		
        DocPushResult pushResult = (DocPushResult) rt.getDataEx();
        if(pushResult == null || pushResult.revision == null)
        {
        	Log.info("remoteServerDocCommit() pushResult or pushResult.revision is null");
    		rt.setError("文件远程推送失败！");
    		return null;			        	
        }
        
        return pushResult.revision;
	}
	

	private String remoteServerDocCopy(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, User accessUser, ReturnAjax rt, boolean isMove) {
		RemoteStorageConfig remote = repos.remoteServerConfig;
		if(remote == null)
		{
			Log.debug("remoteServerDocCopy() repos.remoteServerConfig 未设置");
			rt.setError("文件服务器设置错误！");
			return null;
		}
		
        RemoteStorageSession session = doRemoteStorageLogin(repos, remote);
        if(session == null)
        {
        	//再尝试三次
        	for(int i=0; i < 3; i++)
        	{
        		//Try Again
        		session = doRemoteStorageLogin(repos, remote);
        		if(session != null)
        		{
        			break;
        		}
        	}
        }
        
        if(session == null)
        {
        	Log.debug("remoteServerDocCopy() 文件服务器登录失败！");
    		rt.setError("文件服务器登录失败！");
    		return null;			
    	}	
        
        remoteStorageCopyEntry(session, remote, repos, srcDoc, dstDoc, accessUser, commitMsg, rt, isMove);
        doRemoteStorageLogout(session);            
		
        DocPushResult pushResult = (DocPushResult) rt.getDataEx();
        if(pushResult == null || pushResult.revision == null)
        {
        	Log.debug("remoteServerDocCopy() 远程移动失败！");
    		rt.setError("文件远程移动失败！");
    		return null;			        	
        }
        
        return pushResult.revision;
	}

	//localChanges : 指定需要commit的改动文件
	//commitActionList : 改动扫描结果，非空表示该列表需要被外部使用（只用于自动同步接口）
	protected String verReposDocCommit(Repos repos, boolean convert, Doc doc, String commitMsg, String commitUser, ReturnAjax rt, boolean modifyEnable, HashMap<Long, DocChange> localChanges, int subDocCommitFlag, List<CommitAction> commitActionList) 
	{	
		Log.debug("verReposDocCommit() for doc:[" + doc.getPath() + doc.getName() + "]");

		doc = docConvert(doc, convert);
		
		int verCtrl = getVerCtrl(repos, doc);
		
		Log.debug("verReposDocCommit verCtrl:"+verCtrl);
		if(verCtrl == 1)
		{
			commitMsg = commitMsgFormat(repos, doc.getIsRealDoc(), commitMsg, commitUser);
			return svnDocCommit(repos, doc, commitMsg, commitUser, rt, modifyEnable, localChanges, subDocCommitFlag, commitActionList);
		}
		else if(verCtrl == 2)
		{
			return gitDocCommit(repos, doc, commitMsg, commitUser, rt, modifyEnable, localChanges, subDocCommitFlag, commitActionList);
		}
		
		//对于没有版本管理的仓库，需要认为所有的LocalChanges都会commit成功
		if(localChanges != null)
		{
			if(commitActionList == null)
			{
				commitActionList = new ArrayList<CommitAction>();
			}
	        for (HashMap.Entry<Long, DocChange> entry : localChanges.entrySet()) {
	            DocChange val = entry.getValue();
	            CommitType commitType = CommitType.UNDEFINED;
				switch(val.getType())
	            {
	            case LOCALADD:
	            	commitType  = CommitType.ADD;
	            	break;
	            case LOCALDELETE:
	            	commitType = CommitType.DELETE;
	            	break;
	            case LOCALCHANGE:
	            	commitType = CommitType.MODIFY;
	            	break;
	            case LOCALFILETODIR:
	            	commitType = CommitType.FILETODIR;
	            	break;
	            case LOCALDIRTOFILE:
	            	commitType = CommitType.DIRTOFILE;
	            	break;
				default:
					continue;
	            }
	            CommitAction.insertAction(commitActionList, val.getDoc(), commitType, verCtrl==2);
	        }
		}
		return "";
	}
	
	protected String verReposDocCommitEx(Repos repos, boolean convert, Doc doc, String commitMsg, String commitUser, ReturnAjax rt, boolean modifyEnable, String localChangesRootPath, int subDocCommitFlag, List<CommitAction> commitActionList) 
	{	
		Log.debug("verReposDocCommitEx() for doc:[" + doc.getPath() + doc.getName() + "]");

		doc = docConvert(doc, convert);
		
		int verCtrl = getVerCtrl(repos, doc);
		
		Log.debug("verReposDocCommitEx() verCtrl:"+verCtrl);
		if(verCtrl == 1)
		{
			commitMsg = commitMsgFormat(repos, doc.getIsRealDoc(), commitMsg, commitUser);
			return svnDocCommitEx(repos, doc, commitMsg, commitUser, rt, modifyEnable, localChangesRootPath, subDocCommitFlag, commitActionList);
		}
		else if(verCtrl == 2)
		{
			return gitDocCommitEx(repos, doc, commitMsg, commitUser, rt, modifyEnable, localChangesRootPath, subDocCommitFlag, commitActionList);
		}
		
		//对于没有版本管理的仓库，需要认为所有的LocalChanges都会commit成功
		return "";
	}
	
	private int getVerCtrl(Repos repos, Doc doc) {
		int verCtrl = repos.getVerCtrl();
		if(doc.getIsRealDoc() == false)
		{
			verCtrl = repos.getVerCtrl1();
		}
		return verCtrl;
	}

	protected String svnDocCommit(Repos repos, Doc doc, String commitMsg, String commitUser, ReturnAjax rt, boolean modifyEnable, HashMap<Long, DocChange> localChanges, int subDocCommitFlag, List<CommitAction> commitActionList)
	{			
		boolean isRealDoc = doc.getIsRealDoc();

		SVNUtil verReposUtil = new SVNUtil();		
		String revision = null;
		
		ReposData reposData = getReposData(repos);
		
		String lockInfo = "svnDocCommit() reposData.syncLockForSvnCommit";
		String lockName = "reposData.syncLockForSvnCommit" + repos.getId();

		Date date1 = new Date();
		synchronized(reposData.syncLockForSvnCommit)
		{
			redisSyncLockEx(lockName, lockInfo);
			
			if(false == verReposUtil.Init(repos, isRealDoc, commitUser))
			{
				Log.debug("svnDocCommit() verReposInit Failed");
			}
			else
			{
				revision = verReposUtil.doAutoCommit(repos, doc, commitMsg,commitUser,modifyEnable, localChanges, subDocCommitFlag, commitActionList);
			}
			
			redisSyncUnlockEx(lockName, lockInfo, reposData.syncLockForSvnCommit);
		}
		Date date2 = new Date();
		Log.debug("版本提交耗时:" + (date2.getTime() - date1.getTime()) + "ms svnDocCommit() for [" +doc.getPath() + doc.getName()+ "] \n");

		return revision;
	}
	
	protected String svnDocCommitEx(Repos repos, Doc doc, String commitMsg, String commitUser, ReturnAjax rt, boolean modifyEnable, String localChangesRootPath, int subDocCommitFlag, List<CommitAction> commitActionList)
	{			
		boolean isRealDoc = doc.getIsRealDoc();
		
		SVNUtil verReposUtil = new SVNUtil();		
		String revision = null;
		
		ReposData reposData = getReposData(repos);

		String lockInfo = "svnDocCommitEx() reposData.syncLockForSvnCommit";
		String lockName = "reposData.syncLockForSvnCommit" + repos.getId();
		
		Date date1 = new Date();
		synchronized(reposData.syncLockForSvnCommit)
		{
			redisSyncLockEx(lockName, lockInfo);
			
			if(false == verReposUtil.Init(repos, isRealDoc, commitUser))
			{
				Log.debug("svnDocCommitEx() verReposInit Failed");
			}
			else
			{
				revision = verReposUtil.doAutoCommitEx(repos, doc, commitMsg,commitUser,modifyEnable, localChangesRootPath, subDocCommitFlag, commitActionList);
			}
			
			redisSyncUnlockEx(lockName, lockInfo, reposData.syncLockForSvnCommit);
		}
		Date date2 = new Date();
		Log.debug("版本提交耗时:" + (date2.getTime() - date1.getTime()) + "ms svnDocCommitEx() for [" +doc.getPath() + doc.getName()+ "] \n");
		return revision;
	}
	
	protected String gitDocCommit(Repos repos, Doc doc,	String commitMsg, String commitUser, ReturnAjax rt, boolean modifyEnable, HashMap<Long, DocChange> localChanges, int subDocCommitFlag, List<CommitAction> commitActionList) 
	{
		boolean isRealDoc = doc.getIsRealDoc();
		
		GITUtil verReposUtil = new GITUtil();
		String revision = null;
		
		ReposData reposData = getReposData(repos);

		Date date1 = new Date();

		String lockInfo = "gitDocCommit() reposData.syncLockForGitCommit";
		String lockName = "reposData.syncLockForGitCommit" + repos.getId();
		synchronized(reposData.syncLockForGitCommit)
		{
			redisSyncLockEx(lockName, lockInfo);
			
			if(false == verReposUtil.Init(repos, isRealDoc, commitUser))
			{
				Log.debug("gitDocCommit() verReposInit Failed");
			}
			else
			{
				if(verReposUtil.checkAndClearnBranch(true) == false)
				{
					Log.debug("gitDocCommit() master branch is dirty and failed to clean");
				}
				else
				{
					revision =  verReposUtil.doAutoCommit(repos, doc, commitMsg,commitUser,modifyEnable, localChanges, subDocCommitFlag, commitActionList);
				}
			}
			
			redisSyncUnlockEx(lockName, lockInfo, reposData.syncLockForGitCommit);
		}
		Date date2 = new Date();
		Log.debug("版本提交耗时:" + (date2.getTime() - date1.getTime()) + "ms gitDocCommit() for [" +doc.getPath() + doc.getName()+ "] \n");

		return revision;
	}
	
	protected String gitDocCommitEx(Repos repos, Doc doc,	String commitMsg, String commitUser, ReturnAjax rt, boolean modifyEnable, String localChangesRootPath, int subDocCommitFlag, List<CommitAction> commitActionList) 
	{
		boolean isRealDoc = doc.getIsRealDoc();
		
		GITUtil verReposUtil = new GITUtil();
		String revision = null;
		
		ReposData reposData = getReposData(repos);

		String lockInfo = "gitDocCommitEx() reposData.syncLockForGitCommit";
		String lockName = "reposData.syncLockForGitCommit" + repos.getId();
		
		Date date1 = new Date();
		synchronized(reposData.syncLockForGitCommit)
		{
			redisSyncLockEx(lockName, lockInfo);
			
			if(false == verReposUtil.Init(repos, isRealDoc, commitUser))
			{
				redisSyncUnlockEx(lockName, lockInfo, reposData.syncLockForGitCommit);
				return null;
			}
		
			if(verReposUtil.checkAndClearnBranch(true) == false)
			{
				Log.debug("gitDocCommitEx() master branch is dirty and failed to clean");
				redisSyncUnlockEx(lockName, lockInfo, reposData.syncLockForGitCommit);
				return null;
			}
		
			revision =  verReposUtil.doAutoCommitEx(repos, doc, commitMsg,commitUser,modifyEnable, localChangesRootPath, subDocCommitFlag, commitActionList);

			redisSyncUnlockEx(lockName, lockInfo, reposData.syncLockForGitCommit);
		}
		Date date2 = new Date();
		Log.debug("版本提交耗时:" + (date2.getTime() - date1.getTime()) + "ms gitDocCommitEx() for [" +doc.getPath() + doc.getName()+ "] \n");		
		
		return revision;
	}
	
	private Integer verReposCheckPath(Repos repos, boolean convert, Doc doc, String commitId) 
	{	
		doc = docConvert(doc, convert);
		
		int verCtrl = getVerCtrl(repos, doc);		
		if(verCtrl == 1)
		{
			return svnCheckPath(repos, doc, commitId);		
		}
		else if(verCtrl == 2)
		{
			return gitCheckPath(repos, doc, commitId);
		}
		return null;
	}

	private Integer gitCheckPath(Repos repos, Doc doc, String commitId) {
		boolean isRealDoc = doc.getIsRealDoc();
		
		GITUtil verReposUtil = new GITUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, ""))
		{
			return null;
		}
		
		String entryPath = doc.getPath() + doc.getName();
		return verReposUtil.checkPath(entryPath, commitId);
	}

	private Integer svnCheckPath(Repos repos, Doc doc, String commitId) {
		boolean isRealDoc = doc.getIsRealDoc();
		
		SVNUtil verReposUtil = new SVNUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, ""))
		{
			return null;
		}

		String entryPath = doc.getPath() + doc.getName();
		return verReposUtil.checkPath(entryPath, commitId);
	}

	protected List<Doc> remoteServerCheckOut(Repos repos, Doc doc, String tempLocalRootPath, String localParentPath, String targetName, String commitId, boolean force, boolean auto, HashMap<String,String> downloadList) {
		
		Log.debug("remoteServerCheckOut()");
		
		List<Doc> list = null;
		Doc tmpDoc = doc;
		if(tempLocalRootPath != null)	//如果需要将文件存放到临时目录，那么需要copyDoc到tmpDoc中
		{
			tmpDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(), doc.getReposName(), doc.getPath(), doc.getName(), doc.getLevel(), 1, true, tempLocalRootPath, doc.getLocalVRootPath(), doc.getSize(), doc.getCheckSum(), doc.offsetPath);					
		}
		
		RemoteStorageConfig remote = repos.remoteServerConfig;
		if(remote == null)
		{
			Log.debug("remoteServerCheckOut() remote is null");
			return null;
		}
		
		ReturnAjax rt = new ReturnAjax();
		RemoteStorageSession session = doRemoteStorageLogin(repos, remote);
        if(session == null)
        {
        	//再尝试三次
        	for(int i=0; i < 3; i++)
        	{
        		//Try Again
        		session = doRemoteStorageLogin(repos, remote);
        		if(session != null)
        		{
        			break;
        		}
        	}
        }
        
        if(session != null)
        {
        	//如果checkOut到临时目录，则不能更新index
        	if(tempLocalRootPath != null)
        	{
        		session.indexUpdateEn = false;
        	}
        	
        	doPullFromRemoteStorage(session, remote, repos, tmpDoc, commitId, true, force, rt );
        	doRemoteStorageLogout(session);
        }
        
        DocPullResult pullResult = (DocPullResult) rt.getDataEx();
        if(pullResult != null)
        {
        	list = pullResult.successDocList;
        	if(localParentPath != null)
        	{
        		FileUtil.moveFileOrDir(tmpDoc.getLocalRootPath() + tmpDoc.getPath(), tmpDoc.getName(), localParentPath, targetName, true);
        	}        	
        }
        return list;
	}
	
	protected List<Doc> remoteServerCheckOutForDownload(Repos repos, Doc doc, ReposAccess reposAccess, String tempLocalRootPath, String localParentPath, String targetName, String commitId, boolean force, boolean auto, HashMap<String,String> downloadList) {
		
		Log.debug("remoteServerCheckOutForDownload()");
		
		List<Doc> list = null;
		Doc tmpDoc = doc;
		if(tempLocalRootPath != null)	//如果需要将文件存放到临时目录，那么需要copyDoc到tmpDoc中
		{
			tmpDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(), doc.getReposName(), doc.getPath(), doc.getName(), doc.getLevel(), 1, true, tempLocalRootPath, doc.getLocalVRootPath(), doc.getSize(), doc.getCheckSum(), doc.offsetPath);					
		}
		
		RemoteStorageConfig remote = repos.remoteServerConfig;
		if(remote == null)
		{
			Log.debug("remoteServerCheckOutForDownload() remote is null");
			return null;
		}
		
		ReturnAjax rt = new ReturnAjax();
		RemoteStorageSession session = doRemoteStorageLogin(repos, remote);
        if(session == null)
        {
        	//再尝试三次
        	for(int i=0; i < 3; i++)
        	{
        		//Try Again
        		session = doRemoteStorageLogin(repos, remote);
        		if(session != null)
        		{
        			break;
        		}
        	}
        }
        
        if(session != null)
        {
    		DocAuth curDocAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask());
    		HashMap<Long, DocAuth> docAuthHashMap = getUserDocAuthHashMapWithMask(reposAccess.getAccessUser().getId(), repos.getId(), reposAccess.getAuthMask());
        	
        	//如果checkOut到临时目录，则不能更新index
        	if(tempLocalRootPath != null)
        	{
        		session.indexUpdateEn = false;
        	}
        	
        	doPullFromRemoteStorageForDownload(session, remote, repos, tmpDoc, commitId, true, force, curDocAuth, docAuthHashMap, rt);
        	doRemoteStorageLogout(session);
        }
        
        DocPullResult pullResult = (DocPullResult) rt.getDataEx();
        if(pullResult != null)
        {
        	list = pullResult.successDocList;
        	if(localParentPath != null)
        	{
        		FileUtil.moveFileOrDir(tmpDoc.getLocalRootPath() + tmpDoc.getPath(), tmpDoc.getName(), localParentPath, targetName, true);
        	}        	
        }
        return list;
	}
	
	protected List<LogEntry> remoteServerGetHistory(Repos repos, Doc doc, int maxLogNum) {
		Log.debug("remoteServerGetHistory()");

		List<LogEntry> list = null;
		
		RemoteStorageConfig remote = repos.remoteServerConfig;
		if(remote == null)
		{
			Log.debug("remoteServerGetHistory() remote is null");
			return null;
		}
		
		RemoteStorageSession session = doRemoteStorageLogin(repos, remote);
        if(session == null)
        {
        	//再尝试三次
        	for(int i=0; i < 3; i++)
        	{
        		//Try Again
        		session = doRemoteStorageLogin(repos, remote);
        		if(session != null)
        		{
        			break;
        		}
        	}
        }
        
        if(session != null)
        {
        	list = remoteStorageGetHistory(session, remote, repos, doc, maxLogNum);
        	doRemoteStorageLogout(session);
        }
        
        return list;
	}
	
	protected List<ChangedItem> remoteServerGetHistoryDetail(Repos repos, Doc doc, String commitId) {
		Log.debug("remoteServerGetHistoryDetail()");

		List<ChangedItem> list = null;
		
		RemoteStorageConfig remote = repos.remoteServerConfig;
		if(remote == null)
		{
			Log.debug("remoteServerGetHistory() remote is null");
			return null;
		}
		
		RemoteStorageSession session = doRemoteStorageLogin(repos, remote);
        if(session == null)
        {
        	//再尝试三次
        	for(int i=0; i < 3; i++)
        	{
        		//Try Again
        		session = doRemoteStorageLogin(repos, remote);
        		if(session != null)
        		{
        			break;
        		}
        	}
        }
        
        if(session != null)
        {
        	list = remoteStorageGetHistoryDetail(session, remote, repos, doc, commitId);
        	doRemoteStorageLogout(session);
        }
        
        return list;
	}

	/*
	 * verReposCheckOut
	 * 参数：
	 * 	force: 如果本地target文件存在，false则跳过，否则强制替换
	 *  auto: 如果CommitId对应的是删除操作，自动checkOut上删除前的版本（通过checkPath来确定是否是删除操作，但也有可能只是通过移动和复制的相关历史，那么往前追溯可能是有问题的） 
	 */
	protected List<Doc> verReposCheckOut(Repos repos, boolean convert, Doc doc, String localParentPath, String targetName, String commitId, boolean force, boolean auto, HashMap<String,String> downloadList) 
	{
		doc = docConvert(doc, convert);
		
		int verCtrl = getVerCtrl(repos, doc);
		if(verCtrl == 1)
		{
			return svnCheckOut(repos, doc, localParentPath, targetName, commitId, force, auto, downloadList);		
		}
		else if(verCtrl == 2)
		{
			return gitCheckOut(repos, doc, localParentPath, targetName, commitId, force, auto, downloadList);
		}
		return null;
	}
	
	protected List<Doc> verReposCheckOutForDownload(Repos repos, Doc doc, ReposAccess reposAccess, String localParentPath, String targetName, String commitId, boolean force, boolean auto, HashMap<String,String> downloadList) 
	{
		Log.debug("verReposCheckOutForDownload() doc:[" + doc.getPath() + doc.getName() + "] commitId:" + commitId);
		DocAuth curDocAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask());
		HashMap<Long, DocAuth> docAuthHashMap = getUserDocAuthHashMapWithMask(reposAccess.getAccessUser().getId(), repos.getId(), reposAccess.getAuthMask());

		Log.printObject("verReposCheckOutForDownload() doc:[" + doc.getPath() + doc.getName() + "] curDocAuth:", curDocAuth);

		int verCtrl = getVerCtrl(repos, doc);
		if(verCtrl == 1)
		{
			return svnCheckOutForDownload(repos, doc, localParentPath, targetName, commitId, force, auto, curDocAuth, docAuthHashMap, downloadList);		
		}
		else if(verCtrl == 2)
		{
			return gitCheckOutForDownload(repos, doc, localParentPath, targetName, commitId, force, auto,  curDocAuth, docAuthHashMap, downloadList);
		}
		return null;
	}
	
	protected Doc docConvert(Doc doc, boolean convert) 
	{
		if(convert)
		{
			if(doc.getIsRealDoc() == false)
			{
				//Convert doc to vDoc
				doc = buildVDoc(doc);
			}
		}
		return doc;
	}

	protected List<Doc> svnCheckOut(Repos repos, Doc doc, String localParentPath,String targetName,String revision, boolean force, boolean auto, HashMap<String, String> downloadList)
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
    		Log.debug("svnCheckOut() checkPath for " + entryPath + " 异常");
    		return null;
    	}
    	else if(type == 0)
    	{
    		Log.debug("svnCheckOut() " + entryPath + " not exists for revision:" + revision);
    		if(auto == false)
    		{
        		return null;
    		}

    		String preCommitId = verReposUtil.getReposPreviousCommmitId(revision);
    		if(preCommitId == null)
    		{
        		Log.debug("svnCheckOut() getPreviousCommmitId for revision:" + revision + " 异常");
    			return null;
    		}
    		revision = preCommitId;
    		Log.debug("svnCheckOut() try to chekout " + entryPath + " at revision:" + revision);
    	}
    	else
    	{
	    	if(doc.getName().isEmpty())
	    	{
	    		Log.debug("svnCheckOut() it is root doc, if there is no any subEntries means all items be deleted, we need to get preCommitId");
	    		Collection<SVNDirEntry> subEntries = verReposUtil.getSubEntries("", revision);
	    		if(verReposUtil.subEntriesIsEmpty(subEntries))
	    		{
	    	    	Log.debug("svnCheckOut() 根目录下没有文件 at revision:" + revision);
	        		if(auto == false)
	        		{
	        			return null;
	        		}
	        		
	    	    	String preCommitId = verReposUtil.getReposPreviousCommmitId(revision);
	    	    	if(preCommitId == null)
	    	    	{
	    	        	Log.debug("svnCheckOut() getPreviousCommmitId for revision:" + revision + " 异常");
	    	    		return null;
	    	    	}
	    	    	revision = preCommitId;
	    	    	Log.debug("svnCheckOut() try to chekout 根目录 at revision:" + revision);
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
    		Log.debug("gitCheckOut() checkPath for " + entryPath + " 异常");
    		return null;
    	}
    	else if(type == 0)
    	{
    		Log.debug("gitCheckOut() " + entryPath + " not exists for revision:" + revision);
    		if(auto == false)
    		{
        		return null;
    		}

    		String preCommitId = verReposUtil.getReposPreviousCommmitId(revision);
    		if(preCommitId == null)
    		{
        		Log.debug("gitCheckOut() getPreviousCommmitId for revision:" + revision + " 异常");
    			return null;
    		}
    		revision = preCommitId;
    		Log.debug("gitCheckOut() try to chekout " + entryPath + " at revision:" + revision);
    	}
    	else
    	{
	    	if(doc.getName().isEmpty())
	    	{
	    		Log.debug("gitCheckOut() it is root doc, if there is no any subEntries means all items be deleted, we need to get preCommitId");
	    		TreeWalk subEntries = verReposUtil.getSubEntries("", revision);
	    		if(verReposUtil.subEntriesIsEmpty(subEntries))
	    		{
	    	    	Log.debug("gitCheckOut() 根目录下没有文件 at revision:" + revision);
	        		if(auto == false)
	        		{
	        			return null;
	        		}
	        		
	    	    	String preCommitId = verReposUtil.getReposPreviousCommmitId(revision);
	    	    	if(preCommitId == null)
	    	    	{
	    	        	Log.debug("gitCheckOut() getPreviousCommmitId for revision:" + revision + " 异常");
	    	    		return null;
	    	    	}
	    	    	revision = preCommitId;
	    	    	Log.debug("gitCheckOut() try to chekout 根目录 at revision:" + revision);
	    		}
	    	}
    	}

		return verReposUtil.getEntry(doc, localParentPath, targetName, revision, force, downloadList);
	}
	protected List<Doc> svnCheckOutForDownload(Repos repos, Doc doc, String localParentPath,String targetName,String revision, boolean force, boolean auto, 
			DocAuth curDocAuth, HashMap<Long, DocAuth> docAuthHashMap, 
			HashMap<String, String> downloadList)
	{
		Log.debug("svnCheckOutForDownload() doc:[" + doc.getPath() + doc.getName() + "] commitId:" + revision);
		Log.printObject("svnCheckOutForDownload() doc:[" + doc.getPath() + doc.getName() + "] curDocAuth:", curDocAuth);

		if(curDocAuth == null || curDocAuth.getDownloadEn() == null || curDocAuth.getDownloadEn() != 1)
		{
			Log.debug("svnCheckOutForDownload() have no right to download [" + doc.getPath() + doc.getName() + "]");
			return null;
		}
		
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
    		Log.debug("svnCheckOutForDownload() checkPath for " + entryPath + " 异常");
    		return null;
    	}
    	else if(type == 0)
    	{
    		Log.debug("svnCheckOutForDownload() " + entryPath + " not exists for revision:" + revision);
    		if(auto == false)
    		{
        		return null;
    		}

    		String preCommitId = verReposUtil.getReposPreviousCommmitId(revision);
    		if(preCommitId == null)
    		{
        		Log.debug("svnCheckOutForDownload() getPreviousCommmitId for revision:" + revision + " 异常");
    			return null;
    		}
    		revision = preCommitId;
    		Log.debug("svnCheckOutForDownload() try to chekout " + entryPath + " at revision:" + revision);
    	}
    	else
    	{
	    	if(doc.getName().isEmpty())
	    	{
	    		Log.debug("svnCheckOutForDownload() it is root doc, if there is no any subEntries means all items be deleted, we need to get preCommitId");
	    		Collection<SVNDirEntry> subEntries = verReposUtil.getSubEntries("", revision);
	    		if(verReposUtil.subEntriesIsEmpty(subEntries))
	    		{
	    	    	Log.debug("svnCheckOutForDownload() 根目录下没有文件 at revision:" + revision);
	        		if(auto == false)
	        		{
	        			return null;
	        		}
	        		
	    	    	String preCommitId = verReposUtil.getReposPreviousCommmitId(revision);
	    	    	if(preCommitId == null)
	    	    	{
	    	        	Log.debug("svnCheckOutForDownload() getPreviousCommmitId for revision:" + revision + " 异常");
	    	    		return null;
	    	    	}
	    	    	revision = preCommitId;
	    	    	Log.debug("svnCheckOutForDownload() try to chekout 根目录 at revision:" + revision);
	    		}
	    	}
    	}	
		return verReposUtil.getAuthedEntryForDownload(doc, localParentPath, targetName, revision, force, curDocAuth, docAuthHashMap, downloadList);
	}
	
	protected List<Doc> gitCheckOutForDownload(Repos repos, Doc doc, String localParentPath, String targetName, String revision, boolean force, boolean auto, 
			DocAuth curDocAuth, HashMap<Long, DocAuth> docAuthHashMap, 
			HashMap<String, String> downloadList) 
	{
		Log.debug("gitCheckOutForDownload() doc:[" + doc.getPath() + doc.getName() + "] commitId:" + revision);
		Log.printObject("gitCheckOutForDownload() doc:[" + doc.getPath() + doc.getName() + "] curDocAuth:", curDocAuth);

		if(curDocAuth == null || curDocAuth.getDownloadEn() == null || curDocAuth.getDownloadEn() != 1)
		{
			Log.debug("gitCheckOutForDownload() have no right to download [" + doc.getPath() + doc.getName() + "]");
			return null;
		}
				
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
    		Log.debug("gitCheckOutForDownload() checkPath for " + entryPath + " 异常");
    		return null;
    	}
    	else if(type == 0)
    	{
    		Log.debug("gitCheckOutForDownload() " + entryPath + " not exists for revision:" + revision);
    		if(auto == false)
    		{
        		return null;
    		}

    		String preCommitId = verReposUtil.getReposPreviousCommmitId(revision);
    		if(preCommitId == null)
    		{
        		Log.debug("gitCheckOutForDownload() getPreviousCommmitId for revision:" + revision + " 异常");
    			return null;
    		}
    		revision = preCommitId;
    		Log.debug("gitCheckOutForDownload() try to chekout " + entryPath + " at revision:" + revision);
    	}
    	else
    	{
	    	if(doc.getName().isEmpty())
	    	{
	    		Log.debug("gitCheckOutForDownload() it is root doc, if there is no any subEntries means all items be deleted, we need to get preCommitId");
	    		TreeWalk subEntries = verReposUtil.getSubEntries("", revision);
	    		if(verReposUtil.subEntriesIsEmpty(subEntries))
	    		{
	    	    	Log.debug("gitCheckOutForDownload() 根目录下没有文件 at revision:" + revision);
	        		if(auto == false)
	        		{
	        			return null;
	        		}
	        		
	    	    	String preCommitId = verReposUtil.getReposPreviousCommmitId(revision);
	    	    	if(preCommitId == null)
	    	    	{
	    	        	Log.debug("gitCheckOutForDownload() getPreviousCommmitId for revision:" + revision + " 异常");
	    	    		return null;
	    	    	}
	    	    	revision = preCommitId;
	    	    	Log.debug("gitCheckOutForDownload() try to chekout 根目录 at revision:" + revision);
	    		}
	    	}
    	}

		return verReposUtil.getAuthedEntryForDownload(doc, localParentPath, targetName, revision, force, curDocAuth, docAuthHashMap, downloadList);
	}

	protected String verReposDocMove(Repos repos,  boolean convert, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, ReturnAjax rt, List<CommitAction> commitActionList) 
	{
		srcDoc = docConvert(srcDoc, convert);
		dstDoc = docConvert(dstDoc, convert);
		
		int verCtrl = getVerCtrl(repos, srcDoc);
		if(verCtrl == 1)
		{
			commitMsg = commitMsgFormat(repos, srcDoc.getIsRealDoc(), commitMsg, commitUser);
			return svnDocMove(repos, srcDoc, dstDoc, commitMsg, commitUser, rt, commitActionList);			
		}
		else if(verCtrl == 2)
		{
			return gitDocMove(repos, srcDoc, dstDoc, commitMsg, commitUser, rt, commitActionList);
		}
		return null;
	}
	
	private String svnDocMove(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, ReturnAjax rt, List<CommitAction> commitActionList) {
		boolean isRealDoc = srcDoc.getIsRealDoc();
		
		SVNUtil verReposUtil = new SVNUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, ""))
		{
			return null;
		}

		return verReposUtil.copyDoc(srcDoc, dstDoc, commitMsg, commitUser, true, commitActionList);
	}

	protected String gitDocMove(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, ReturnAjax rt, List<CommitAction> commitActionList) 
	{
		boolean isRealDoc = srcDoc.getIsRealDoc();
		
		GITUtil verReposUtil = new GITUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, ""))
		{
			return null;
		}

		return verReposUtil.copyDoc(srcDoc, dstDoc, commitMsg, commitUser,true, commitActionList);
	}
	
	protected String verReposDocCopy(Repos repos, boolean convert, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, ReturnAjax rt, List<CommitAction> commitActionList) 
	{
		srcDoc = docConvert(srcDoc, convert);
		dstDoc = docConvert(dstDoc, convert);
		
		int verCtrl = getVerCtrl(repos, srcDoc);
		if(verCtrl == 1)
		{
			commitMsg = commitMsgFormat(repos, srcDoc.getIsRealDoc(), commitMsg, commitUser);
			return svnDocCopy(repos, srcDoc, dstDoc, commitMsg, commitUser, rt, commitActionList);		
		}
		else if(verCtrl == 2)
		{
			return gitDocCopy(repos, srcDoc, dstDoc, commitMsg, commitUser, rt, commitActionList);
		}
		
		//If there is no verCtl, return ""
		return "";
	}
	
	
	private String svnDocCopy(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, ReturnAjax rt, List<CommitAction> commitActionList) {
		boolean isRealDoc = srcDoc.getIsRealDoc();
		
		SVNUtil verReposUtil = new SVNUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, ""))
		{
			return null;
		}

		return verReposUtil.copyDoc(srcDoc, dstDoc, commitMsg, commitUser, false, commitActionList);
	}

	protected String gitDocCopy(Repos repos, Doc srcDoc, Doc dstDoc, String commitMsg, String commitUser, ReturnAjax rt, List<CommitAction> commitActionList) 
	{
		boolean isRealDoc = srcDoc.getIsRealDoc();
		
		GITUtil verReposUtil = new GITUtil();
		if(false == verReposUtil.Init(repos, isRealDoc, ""))
		{
			return null;
		}
		
		return verReposUtil.copyDoc(srcDoc, dstDoc, commitMsg, commitUser, false, commitActionList);
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
    //indexLibType
    protected final static int INDEX_DOC_NAME	=0;
    protected final static int INDEX_R_DOC		=1;
    protected final static int INDEX_V_DOC		=2;
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
	
	protected boolean deleteIndexLib(Repos repos, int indexLibType)
	{
		String libPath = getIndexLibPath(repos, indexLibType);
		Log.debug("deleteIndexLib() libPath:" + libPath);
		return LuceneUtil2.deleteIndexLib(libPath);
	}
	
	boolean deleteDocNameIndexLib(Repos repos)
	{
		boolean ret = false;
		ret = deleteIndexLib(repos, 0);
		return ret;

	}
	
	boolean deleteRDocIndexLib(Repos repos)
	{
		boolean ret = false;
		ret = deleteIndexLib(repos, 1);
		return ret;
	}

	boolean deleteVDocIndexLib(Repos repos)
	{
		boolean ret = false;
		ret = deleteIndexLib(repos, 2);
		return ret;
	}

	//Add Index For DocName
	public boolean addIndexForDocName(Repos repos, Doc doc)
	{
		Log.debug("addIndexForDocName() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		String indexLib = getIndexLibPath(repos,0);
		boolean ret = false;
		ret = LuceneUtil2.addIndex(doc, doc.getName(), indexLib);
		return ret;
	}

	//Delete Indexs For DocName
	public static boolean deleteIndexForDocName(Repos repos, Doc doc, int deleteFlag)
	{
		Log.debug("deleteIndexForDocName() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		String indexLib = getIndexLibPath(repos,0);
		boolean ret = false;
		ret = LuceneUtil2.deleteIndexEx(doc, indexLib, deleteFlag);
		return ret;
	}
		
	//Update Index For DocName
	public static boolean updateIndexForDocName(Repos repos, Doc doc, Doc newDoc, ReturnAjax rt)
	{
		Log.debug("updateIndexForDocName() docId:" +  doc.getDocId() + " parentPath:" +  doc.getPath()  + " name:" + doc.getName()  + " newParentPath:" + newDoc.getPath() + " newName:" + newDoc.getName() + " repos:" + repos.getName());

		String indexLib = getIndexLibPath(repos,0);

		String name = doc.getName();
		String newName = newDoc.getName();
		String parentPath = doc.getPath();
		String newParentPath = newDoc.getPath();
		if(name.equals(newName) && parentPath.equals(newParentPath))
		{
			Log.debug("updateIndexForDocName() Doc not Changed docId:" + doc.getDocId() + " parentPath:" + parentPath + " name:" + name + " newParentPath:" + newParentPath + " newName:" + newName);			
			return true;
		}
		
		boolean ret = false;		
		LuceneUtil2.deleteIndex(doc, indexLib);
		String content = newParentPath + newName;
		ret = LuceneUtil2.addIndex(newDoc, content.trim(), indexLib);
		return ret;
	}

	//Add Index For VDoc
	public boolean addIndexForVDoc(Repos repos, Doc doc)
	{
		Log.debug("addIndexForVDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());

		String content = doc.getContent();
		if(content == null)
		{
			content = readVirtualDocContent(repos, doc);
		}
		
		String indexLib = getIndexLibPath(repos,2);

		boolean ret = false;
		if(content == null || content.isEmpty())
		{
			//Log.debug("addIndexForVDoc() content is null or empty, do delete Index");
			ret = LuceneUtil2.deleteIndex(doc, indexLib);			
			return ret;
		}
			
		ret = LuceneUtil2.addIndex(doc, content.toString().trim(), indexLib);
		return ret;	
	}
	
	//Delete Indexs For VDoc
	public static boolean deleteIndexForVDoc(Repos repos, Doc doc, int deleteFlag)
	{
		Log.debug("deleteIndexForVDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		String indexLib = getIndexLibPath(repos,2);
		
		boolean ret = false;
		ret = LuceneUtil2.deleteIndexEx(doc, indexLib, deleteFlag);
		return ret;
	}
	
	//Update Index For VDoc
	public boolean updateIndexForVDoc(Repos repos, Doc doc)
	{
		Log.debug("updateIndexForVDoc() docId:" +  doc.getDocId() + " parentPath:" +  doc.getPath()  + " name:" + doc.getName() + " repos:" + repos.getName());
		
		if(isVirtuallDocTextSearchDisabled(repos, doc))
		{
			Log.debug("updateIndexForVDoc() VirtualDocTextSearchDisabled");
			return false;
		}
		
		String indexLib = getIndexLibPath(repos,2);
		
		String content = doc.getContent();
		if(content == null)
		{
			content = readVirtualDocContent(repos, doc);
		}		
		
		boolean ret = false;
		LuceneUtil2.deleteIndex(doc, indexLib);
		ret = LuceneUtil2.addIndex(doc, content.trim(), indexLib);
		return ret;
	}
	
	private static boolean isVirtuallDocTextSearchDisabled(Repos repos, Doc doc) {
		String parentPath = Path.getReposTextSearchConfigPath(repos);
		String fileName = doc.getDocId() + ".disableVirtualDocTextSearch";
		if(FileUtil.isFileExist(parentPath + fileName))
		{
			return true;
		}
		
		return false;
	}
		
	//Add Index For RDoc
	public static boolean addIndexForRDoc(Repos repos, Doc doc)
	{		
		Log.debug("addIndexForRDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		if(doc.isRealDocTextSearchEnabled == null)	//未知状态
		{
			doc.isRealDocTextSearchEnabled = isRealDocTextSearchEnabled(repos, doc, null);
		}
		
    	if(doc.isRealDocTextSearchEnabled == 0)
		{
			Log.debug("addIndexForRDoc() RealDoc TextSearch was Disabled for [" + doc.getPath() + doc.getName() + "]");
			return false;
		}
    	
    	//add Index For doc
		String indexLib = getIndexLibPath(repos, 1);

		String localRootPath = Path.getReposRealPath(repos);
		String localParentPath = localRootPath + doc.getPath();
		String filePath = localParentPath + doc.getName();
				
		File file =new File(filePath);
		if(!file.exists())
		{
			Log.info("addIndexForRDoc() " + filePath + " 不存在");
			return false;
		}
		
		if(file.isDirectory())
		{
			Log.debug("addIndexForRDoc() isDirectory");
			return false; //LuceneUtil2.addIndex(LuceneUtil2.buildDocumentId(hashId,0), reposId, docId, parentPath, name, hashId, "", indexLib);
		}
				
		if(file.length() == 0)
		{
			Log.debug("addIndexForRDoc() fileSize is 0, do delete index");
			return LuceneUtil2.deleteIndex(doc,indexLib);
		}
		
		//缓存文件不对内容索引
		String fileName = doc.getName();
		if(fileName.startsWith("~") == true) //~开头的文件是缓存文件
		{
			Log.debug("addIndexForRDoc() " + fileName + " 是缓存文件，不做索引");
			return false;
		}
		
		//According the fileSuffix to confirm if it is Word/Execl/ppt/pdf
		String fileSuffix = FileUtil.getFileSuffix(fileName);
		if(fileSuffix == null)
		{
			Log.debug("addIndexForRDoc() 未知文件类型不支持索引");
			return false;
		}

		Log.debug("addIndexForRDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		boolean ret = false;			
		switch(fileSuffix)
		{
		case "doc":
			if(LuceneUtil2.addIndexForWord(filePath, doc, indexLib))
			{
				ret = true;
				break;
			}
			ret = LuceneUtil2.addIndexForWord2007(filePath, doc, indexLib);
			break;
		case "docx":
			if(LuceneUtil2.addIndexForWord2007(filePath, doc, indexLib))
			{
				ret = true;
				break;
			}
			ret = LuceneUtil2.addIndexForWord(filePath, doc, indexLib);
			break;
		case "xls":
			if(LuceneUtil2.addIndexForExcel(filePath, doc, indexLib))
			{
				ret = true;
				break;
			}
			ret = LuceneUtil2.addIndexForExcel2007(filePath, doc, indexLib);
			break;
		case "xlsx":
			if(LuceneUtil2.addIndexForExcel2007(filePath, doc, indexLib))
			{
				ret = true;
				break;
			}
			ret = LuceneUtil2.addIndexForExcel(filePath, doc, indexLib);
			break;
		case "ppt":
			if(LuceneUtil2.addIndexForPPT(filePath, doc, indexLib))
			{
				ret = true;
				break;
			}
			ret = LuceneUtil2.addIndexForPPT2007(filePath, doc, indexLib);
			break;
		case "pptx":
			if(LuceneUtil2.addIndexForPPT2007(filePath, doc, indexLib))
			{
				ret = true;
				break;
			}
			ret = LuceneUtil2.addIndexForPPT(filePath, doc, indexLib);
			break;
		case "pdf":
			ret = LuceneUtil2.addIndexForPdf(filePath, doc, indexLib);
			break;
		default:
			if(FileUtil.isText(fileSuffix))
			{
				ret = LuceneUtil2.addIndexForFile(filePath, doc, indexLib);
				break;
			}
			Log.debug("addIndexForRDoc() 非文本文件，不支持索引");
			break;
		}

		return ret;
	}
	
	private static Integer isRealDocTextSearchEnabled(Repos repos, Doc doc, Doc parentDoc) {
		if(parentDoc == null || parentDoc.isRealDocTextSearchEnabled == null)
		{
			return isRealDocTextSearchIgnored(repos, doc, true) == true? 0:1;			
		}
		
		if(parentDoc.isRealDocTextSearchEnabled == 0)
		{
			return 0;
		}
		
		if(repos.textSearchConfig.realDocTextSearchDisableHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			Log.debug("isRealDocTextSearchEnabled() RealDoc TextSearch was ignored for [/" + doc.getPath() + doc.getName() + "]");
			return 0;
		}
		
		return 1;
	}

	protected static Integer isReposTextSearchEnabled(Repos repos) {
		if(repos.textSearchConfig != null && repos.textSearchConfig.enable != null && repos.textSearchConfig.enable == true)
		{
			return 1;
		}
		return 0;
	}
	
	private static boolean isRealDocTextSearchIgnored(Repos repos, Doc doc, boolean parentCheck) {
		//版本倉庫和索引倉庫禁止建立索引
		if(doc.getName().equals("DocSysVerReposes") || doc.getName().equals("DocSysLucene"))
    	{
			Log.debug("isRealDocTextSearchIgnored() RealDoc TextSearch was ignored for [/" + doc.getPath() + doc.getName() + "]");
    		return true;
    	}
		
		if(repos.textSearchConfig == null || repos.textSearchConfig.enable == false)
		{
			return true;
		}
		
		if(repos.textSearchConfig.realDocTextSearchDisableHashMap == null)
		{
			return false;
		}
		
		if(repos.textSearchConfig.realDocTextSearchDisableHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			Log.debug("isRealDocTextSearchIgnored() RealDoc TextSearch was ignored for [/" + doc.getPath() + doc.getName() + "]");
			return true;
		}
		
		if(parentCheck == false)
		{
			return false;
		}
		
		//check if textSearch was ignored for root doc
		if(repos.textSearchConfig.realDocTextSearchDisableHashMap.get("/") != null)
		{
			Log.debug("isRealDocTextSearchIgnored() RealDoc TextSearch was ignored for [/]");
			return true;
		}
		
		//check if textSearch was was ignored for parent doc
		if(doc.getPath() != null)
		{
			String [] paths = doc.getPath().split("/");
			String path = "/" + paths[0];
			Log.debug("isRealDocTextSearchIgnored() path:" + path);
			if(repos.textSearchConfig.realDocTextSearchDisableHashMap.get(path) != null)
			{
				Log.debug("isRealDocTextSearchIgnored() RealDoc TextSearch was ignored:" + path);
				return true;
			}
			
			for(int i = 1; i < paths.length; i++)
			{
				path = path + "/" + paths[i];
				if(repos.textSearchConfig.realDocTextSearchDisableHashMap.get(path) != null)
				{
					Log.debug("isRealDocTextSearchIgnored() RealDoc TextSearch was ignored:" + path);
					return true;
				}
			}			
		}
		return false;
	}
	

	public static boolean deleteIndexForRDoc(Repos repos, Doc doc, int deleteFlag)
	{
		Log.debug("deleteIndexForRDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());
		
		String indexLib = getIndexLibPath(repos, 1);
		
		boolean ret = false;
		ret = LuceneUtil2.deleteIndexEx(doc,indexLib, deleteFlag);
		return ret;
	}
	
	//Update Index For RDoc
	public static boolean updateIndexForRDoc(Repos repos, Doc doc)
	{
		Log.debug("updateIndexForRDoc() docId:" + doc.getDocId() + " parentPath:" + doc.getPath() + " name:" + doc.getName() + " repos:" + repos.getName());		

		deleteIndexForRDoc(repos, doc, 1);
		return addIndexForRDoc(repos, doc);
	}
	
	/****************************DocSys系统初始化接口 *********************************/
	//static String JDBC_DRIVER = "org.sqlite.JDBC";
    //static String DB_TYPE = "sqlite";
	//static String DB_URL = "jdbc:sqlite:${catalina.home}/DocSystem.db"; //classess目录下在eclipse下会导致重启 
	//static String DB_USER = "";
    //static String DB_PASS = "";
    
	static String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";  
    protected static String DB_TYPE = "mysql";
    protected static String DB_URL = "jdbc:mysql://localhost:3306/DocSystem?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC";
    protected static String DB_USER = "root";
    protected static String DB_PASS = "";
    protected static String officeEditorApi = null;

    //定义数据库的ObjType
    protected final static int DOCSYS_REPOS			=0;
    protected final static int DOCSYS_REPOS_AUTH	=1;
    protected final static int DOCSYS_DOC			=2;
	protected final static int DOCSYS_DOC_AUTH		=3;
	protected final static int DOCSYS_DOC_LOCK		=4;
	protected final static int DOCSYS_USER			=5;
	protected final static int DOCSYS_ROLE			=6;
	protected final static int DOCSYS_USER_GROUP	=7;
	protected final static int DOCSYS_GROUP_MEMBER	=8;
	protected final static int DOCSYS_SYS_CONFIG	=9;
	protected final static int DOCSYS_DOC_SHARE		=10;
	protected final static String [] DBTabNameMap = {
			"repos",
			"repos_auth",
			"doc",
			"doc_auth",
			"doc_lock",
			"user",
			"role",
			"user_group",
			"group_member",
			"sys_config",
			"doc_share",
	};
	static JSONArray[] ObjMemberListMap = {null,null,null,null,null,null,null,null,null,null,null};
	
	//index.jsp页面将根据该标志来确定	跳转到install还是index.html
	protected static Integer docSysIniState = -1;
	protected static String docSysInitAuthCode = null;
	
	public static Integer getDocSysInitState()
	{
		return docSysIniState;
	}
	
	//This interface will be called by jsp
	public static Boolean isBussienss()
	{
		return docSysType > 0;
	}
	
	public static String getOfficeEditor(HttpServletRequest request)
	{
		String officeEditor = officeEditorApi;
		if(officeEditor == null || officeEditor.isEmpty())
		{
			if(docSysType == constants.DocSys_Community_Edition)
			{
				Log.debug("getOfficeEditor() officeEditor not cofigured");				
				return null;
			}
			
			String localOfficeApiPath = docSysWebPath + "web/static/office-editor/web-apps/apps/api/documents/api.js";
			File file = new File(localOfficeApiPath);
			if(file.exists() == false)
			{
				Log.debug("getOfficeEditor() officeEditor not installed");								
				return null;
			}
			
			Log.debug("getOfficeEditor() url:" + request.getRequestURL());
			String url = getHostAndPortFromUrl(request.getRequestURL());
			officeEditor = url + "/DocSystem/web/static/office-editor/web-apps/apps/api/documents/api.js";
			//business edition
			return officeEditor;
		}
		
		Log.debug("getOfficeEditor() officeEditor:" + officeEditor);
		if(testUrlWithTimeOut(officeEditor,3000) == false)
		{	
			Log.debug("getOfficeEditor() test officeEditor connection failed");
			return null;
		}		
		Log.debug("getOfficeEditor() officeEditor is ok");
		return officeEditor;
	}
	
	protected static String getHostAndPortFromUrl(StringBuffer requestURL) {
		return requestURL.substring(0, requestURL.indexOf("/DocSystem"));
	}

	public void setOfficeEditor(String editor) {
		officeEditorApi = editor;
	}

	public static String getServerIP()
	{
		return serverIP;
	}
	
	public static String getDocSysInitAuthCode()
	{
		return docSysInitAuthCode;
	}
	
	protected String docSysInit(boolean force) 
	{	
		Log.info("*************** docSysInit force:" + force + " *****************");
		Log.info("docSysInit() docSysIniPath:" + docSysIniPath);

		if(officeEditorApi == null)
		{
			officeEditorApi = Path.getOfficeEditorApi();
		}
		officeType = getOfficeType(officeEditorApi);
		Log.info("docSysInit() officeEditorApi:" + officeEditorApi);
		
		serverIP = IPUtil.getIpAddress();
		serverMAC = IPUtil.getMacAddress();
		Log.info("docSysInit() serverIP:" + serverIP + " serverMAC:" + serverMAC);
						
		//检查并更新数据库配置文件
		String JDBCSettingPath = docSysWebPath + "WEB-INF/classes/jdbc.properties";
		String UserJDBCSettingPath = docSysIniPath + "jdbc.properties";
		if(FileUtil.isFileExist(UserJDBCSettingPath))
		{
			Log.info("docSysInit() 用户自定义 数据库 配置文件存在！");
			String checkSum1 = getFileCheckSum(UserJDBCSettingPath);
			String checkSum2 = getFileCheckSum(JDBCSettingPath);
			//检查UserJDBCSettingPath是否与JDBCSettingPath是否一致，如果不一致则更新应用的数据库配置，等待用户重启服务器
			if(checkSum1 == null || checkSum2 == null || !checkSum1.equals(checkSum2))
			{
				Log.info("docSysInit() 用户自定义 数据库 配置文件与默认配置文件不一致，等待重启生效！");
				//如果之前的版本号低于V2.0.47则需要更新数据库的驱动和链接
				UserJDBCSettingUpgrade(UserJDBCSettingPath);
				FileUtil.copyFile(UserJDBCSettingPath, JDBCSettingPath, true);
				return "needRestart";
			}
		}
		
		//检查并更新DocSys配置文件
		String docSysConfigPath = docSysWebPath + "WEB-INF/classes/docSysConfig.properties";
		String userDocSysConfigPath = docSysIniPath + "docSysConfig.properties";
		if(FileUtil.isFileExist(userDocSysConfigPath))
		{
			Log.info("docSysInit() 用户自定义 系统 配置文件存在！");
			//检查userDocSysConfigPath是否与docSysConfigPath一致，如果不一致则更新
			String checkSum1 = getFileCheckSum(userDocSysConfigPath);
			String checkSum2 = getFileCheckSum(docSysConfigPath);
			if(checkSum1 == null || checkSum2 == null || !checkSum1.equals(checkSum2))
			{
				Log.info("docSysInit() 用户自定义 系统 配置文件与默认配置文件不一致，更新文件！");
				FileUtil.copyFile(userDocSysConfigPath, docSysConfigPath, true);
				//重新初始化docSysConfig.properties相关的全局变量
				initDocSysDataPath();
				initRedis();		
				initLdapConfig();
				clusterServerUrl = getClusterServerUrl();
				
			}
		}
		
		getAndSetDBInfoFromFile(JDBCSettingPath);
		Log.info("docSysInit() DB_TYPE:" + DB_TYPE + " DB_URL:" + DB_URL);
				
		//Get dbName from the DB URL
		String dbName = getDBNameFromUrl(DB_TYPE, DB_URL);
		Log.info("docSysInit() dbName:" + dbName);
		
		File docSysIniDir = new File(docSysIniPath);
		if(docSysIniDir.exists() == false)
		{
			//docSysIniDir不存在有两种可能，首次安装或者旧版本版本过低
			docSysIniDir.mkdirs();	
		}
		
		//初始化数据库表对象（注意：不能简单使用反射，因为变化的字段未必是数据库表的成员）
		if(initObjMemberListMap() == false)
		{
			Log.info("docSysInit() initObjMemberListMap Faield!");
			return "ERROR_initObjMemberListMapFailed";			
		}
		Log.info("docSysInit() initObjMemberListMap done!");
				
		//测试数据库连接
		if(testDB(DB_TYPE, DB_URL, DB_USER, DB_PASS) == false)	//数据库不存在
		{
			Log.info("docSysInit() 数据库连接测试失败 force:" + force);
			if(force == false)
			{
				Log.info("docSysInit() 数据库连接测试失败 (SytemtStart triggered docSysInit)");
				//系统启动时的初始化force要设置成false,否则数据库初始化时间过长会导致服务器重启
				Log.info("docSysInit() 数据库无法连接（数据库不存在或用户名密码错误），进入用户自定义安装页面!");				
				return "ERROR_DBNotExists";
			}
			else
			{
				Log.info("docSysInit() 数据库连接测试失败 (User triggered docSysInit)，尝试创建数据库并初始化！");
				
				//自动创建数据库
				createDB(DB_TYPE, dbName, DB_URL, DB_USER, DB_PASS);
				Log.info("docSysInit() createDB done");

				if(initDB(DB_TYPE, DB_URL, DB_USER, DB_PASS) == false)
				{
					Log.info("docSysInit() initDB failed");
					return "ERROR_intiDBFailed";
				}
				Log.info("docSysInit() initDB done");
								
				//更新版本号
				FileUtil.copyFile(docSysWebPath + "version", docSysIniPath + "version", true);	
				Log.info("docSysInit() updateVersion done");
				
				if(redisEn)
				{
					//clear redis cache
					clearRedisCache();
					if(clusterDeployCheckGlobal(force) == true)
					{
						RMap<String, Long> clusterServersMap = redisClient.getMap("clusterServersMap");
						clusterServersMap.put(clusterServerUrl, new Date().getTime());
						addClusterHeartBeatDelayTask();
					}
				}
				
				initReposExtentionConfigEx();
				
				//start DataBase auto backup thread
				addDelayTaskForDBBackup(10, 300L); //5分钟后开始备份数据库
				
				return "ok";
			}
		}
		
		//数据库已存在
		Log.info("docSysInit() checkAndUpdateDB start");
		String ret = "ok";
		if(redisEn == false)
		{
			//集群情况下禁止进行数据库升级（必须假定数据库是兼容的）
			ret = checkAndUpdateDB(true);
		}
		
		if(ret.equals("ok"))
		{
			if(redisEn)
			{
				//clear redis cache
				clearRedisCache();
				if(clusterDeployCheckGlobal(force) == true)
				{
					RMap<String, Long> clusterServersMap = redisClient.getMap("clusterServersMap");
					clusterServersMap.put(clusterServerUrl, new Date().getTime());
					addClusterHeartBeatDelayTask();
				}
			}
			
			initReposExtentionConfigEx();
			
			//start DataBase auto backup thread
			addDelayTaskForDBBackup(10, 300L); //5分钟后开始备份数据库
		}
		
		return ret;
	}
	
	protected void restartClusterServer() {
		Log.info("restartClusterServer() [" + clusterServerUrl+ "]");
		if(redisEn)
		{
			//clear redis cache
			clearRedisCache();
			if(clusterDeployCheckGlobal(true) == true)
			{
				RMap<String, Long> clusterServersMap = redisClient.getMap("clusterServersMap");
				clusterServersMap.put(clusterServerUrl, new Date().getTime());
				addClusterHeartBeatDelayTask();
			}
		}

		initReposExtentionConfigEx();
	}
	
	protected String getClusterInfo() {
		Log.info("getClusterInfo()");
		
		Integer isRedisEn = getRedisEn();
		if(isRedisEn == 0)
		{
			return "集群未开启";
		}
		
		if(redisEn == false)
		{
			return "集群失败:" + globalClusterDeployCheckResultInfo;
		}
		
		//Go throuhg clusterServersMap
		String clusterInfo = "";
	    RMap<String, Long> clusterServersMap = redisClient.getMap("clusterServersMap");
	    
	    Iterator<Entry<String, Long>> iterator = clusterServersMap.entrySet().iterator();
	    long curTime = new Date().getTime();
	    while (iterator.hasNext()) 
	    {
	    	Entry<String, Long> entry = iterator.next();
	        if(entry != null)
	        {   
	        	String clusterServerUrl = entry.getKey();
	    		Log.debug("getClusterInfo() clusterServer [" + clusterServerUrl + "]");
	            
	        	Long beatTime = entry.getValue();
	        	if(beatTime == null)
	            {
	            	Log.debug("clearRedisCache() clusterServer:" + clusterServerUrl + " beatTime is null");
	            	clusterInfo += "[" + clusterServerUrl + "] 已停止，无效激活时间\n";	            	
	            }
	        	else
	        	{
		            if((curTime - beatTime) > clusterHeartBeatStopTime)	//heart beating have stopped for 30 minutes
		            {
		            	Log.info("clearRedisCache() clusterServer:" + clusterServerUrl + " heart beating have stopped " + (curTime - beatTime)/1000 + " minutes");
		            	clusterInfo += "[" + clusterServerUrl + "] 已停止，上次激活时间 [" + DateFormat.dateTimeFormat(new Date(beatTime)) + "]\n";
		            }
		            else
		            {
		            	clusterInfo += "[" + clusterServerUrl + "] 已激活，上次激活时间 [" + DateFormat.dateTimeFormat(new Date(beatTime)) + "]\n";	            
		            }
	        	}
	        }
	    }
	    Log.debug("集群信息:");
	    Log.debug(clusterInfo);
	    return clusterInfo;
	}
	
	private void clearRedisCache() {
		Log.info("clearRedisCache()");
		
		//注意: 没有把当前clusterServerUrl直接加到deadList的原因，在于用户可能把clusterServerUrl设置错了，所以不能直接删除
		//只能清除已经明确死亡的服务器，换句话说，重新加入集群需要30分钟之后（当然可以考虑缩短集群心跳间隔）
		
		//Go throuhg clusterServersMap
	    List<String> deleteList = new ArrayList<String>();
	    RMap<String, Long> clusterServersMap = redisClient.getMap("clusterServersMap");
	    
	    Iterator<Entry<String, Long>> iterator = clusterServersMap.entrySet().iterator();
	    long curTime = new Date().getTime();
	    while (iterator.hasNext()) 
	    {
	    	Entry<String, Long> entry = iterator.next();
	        if(entry != null)
	        {   
	        	String clusterServerUrl = entry.getKey();
	    		Log.info("clearRedisCache() clusterServer [" + clusterServerUrl + "]");
	            
	        	Long beatTime = entry.getValue();
	        	if(beatTime == null)
	            {
	            	Log.info("clearRedisCache() clusterServer:" + clusterServerUrl + " beatTime is null");
	            	deleteList.add(clusterServerUrl);
	            }
	        	else
	        	{
		            if((curTime - beatTime) > clusterHeartBeatStopTime)	//heart beating have stopped for 30 minutes
		            {
		            	Log.info("clearRedisCache() clusterServer:" + clusterServerUrl + " heart beating have stopped " + (curTime - beatTime)/1000 + " minutes");
		            	deleteList.add(clusterServerUrl);			            	
		            
		            }
	        	}
	        }
	    }
	    
	    for(int i=0; i< deleteList.size(); i++)
	    {
	    	clusterServersMap.remove(deleteList.get(i));
	    }
		
		if(clusterServersMap.size() == 0)
		{
			Log.debug("clearRedisCache() clusterServersMap is empty, do clean all redis data");
			clearGlobalRedisData();
			clearAllRemoteStorageLocksMap(null);
			clearAllReposRedisData(null);
			clearAllOfficeRedisData(null);
		}
		else
		{
		    for(int i=0; i< deleteList.size(); i++)
		    {
		    	String deleteServerUrl = deleteList.get(i);
				Log.debug("clearRedisCache() clear redis cache for clusterServer [" + deleteServerUrl + "]");
				clearAllRemoteStorageLocksMap(deleteServerUrl);
				clearAllReposRedisData(deleteServerUrl);
				clearAllOfficeRedisData(deleteServerUrl);
		    }
		}
		
		return;
	}

	private void addClusterHeartBeatDelayTask() {
		Log.debug("addClusterHeartBeatDelayTask() add beating delay task at " + DateFormat.dateFormat(new Date()));
		ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
        executor.schedule(
        		new Runnable() {
                    @Override
                    public void run() {
                        try {
	                        Long beatTime = new Date().getTime();
	                        Log.info("\n******** ClusterHeartBeatDelayTask beatTime [" + beatTime + "]");
	                       
	                        if(redisEn == false)
	                        {
	                        	Log.info("[" + clusterServerUrl + "] 已退出集群");
	                        }
	                        else
	                        {
		                        RMap<Object, Object> clusterServersMap = redisClient.getMap("clusterServersMap");
		                        clusterServersMap.put(clusterServerUrl, beatTime);
		                        addClusterHeartBeatDelayTask();                    
	                        }
                        	Log.info("******** ClusterHeartBeatDelayTask 执行结束\n");		                        
                        } catch(Exception e) {
                        	Log.info("******** ClusterHeartBeatDelayTask 执行异常\n");
                        	Log.info(e);                        	
                        }
                        
                    }
                },
        		clusterHeartBeatInterval,	//beat per 10 minutes(600 seconds)
                TimeUnit.SECONDS);
	}

	private void clearAllOfficeRedisData(String targetServerUrl) {
		Channel channel = ChannelFactory.getByChannelName("businessChannel");
		if(channel == null)
	    {
			Log.debug("clearAllOfficeData 非商业版本不支持Office编辑");
			return;
	    }
		
		channel.clearAllOfficeData(targetServerUrl);
	}

	private void clearAllRemoteStorageLocksMap(String targetServerUrl) {
		//遍历reposLocksMap, and unlock the locks locked by serverUrl
		RMap<Object, Object> remoteStorageLocksMap = redisClient.getMap("remoteStorageLocksMap");
		List<RemoteStorageLock> deleteList = new ArrayList<RemoteStorageLock>();
    	try {
	        if (remoteStorageLocksMap != null) {
				Iterator<Entry<Object, Object>> iterator = remoteStorageLocksMap.entrySet().iterator();
		        while (iterator.hasNext()) 
		        {
		        	Entry<Object, Object> entry = iterator.next();
		            if(entry != null)
		        	{
		            	RemoteStorageLock lock = (RemoteStorageLock) entry.getValue();
		            	Integer curState = lock.state;
	            		Log.debug("clearAllRemoteStorageLocksMap() lock[" + lock.name + "] state:" + curState);
		            	if(curState == 0)
		            	{
		            		deleteList.add(lock);
		            	}
		            	else
		            	{
		            		
		            		if(targetServerUrl == null || lock.server == null || lock.server.equals(targetServerUrl))
		            		{
		            			deleteList.add(lock);
		            		}
		            	}
		        	}
		        }
	        }	        
	        
	        //remove the remoteStorageLock
	        for(int i=0; i<deleteList.size(); i++)
	        {
	        	RemoteStorageLock remoteStorageLock = deleteList.get(i);
	        	remoteStorageLocksMap.remove(remoteStorageLock.name);
	        	//redisSyncUnlock("remoteStorageSyncLock" + remoteStorageLock.name, "clearAllRemoteStorageLocksMap()");
	        }
        } catch (Exception e) {
            errorLog(e);
        }
	}

	private void clearReposLocksMap(String targetServerUrl) {
		RMap<Object, Object> reposLocksMap = redisClient.getMap("reposLocksMap");
		if(targetServerUrl == null)
		{
			Log.info("clearReposLocksMap() clear whole map");
			reposLocksMap.clear();
			return;
		}
		
		//遍历reposLocksMap, and unlock the locks locked by serverUrl
		List<DocLock> deleteList = new ArrayList<DocLock>();
    	try {
	        if (reposLocksMap != null) {
				Iterator<Entry<Object, Object>> iterator = reposLocksMap.entrySet().iterator();
		        while (iterator.hasNext()) 
		        {
		        	Entry<Object, Object> entry = iterator.next();
		            if(entry != null)
		        	{
		            	DocLock lock = (DocLock) entry.getValue();
		            	Integer curState = lock.getState();
	            		Log.debug("clearReposDocLocksMap() lock[" + lock.lockId + "] state:" + curState);
		            	if(curState == 0)
		            	{
		            		deleteList.add(lock);
		            	}
		            	else
		            	{
		            		if(lock.server[DocLock.LOCK_STATE_FORCE] == null || lock.server[DocLock.LOCK_STATE_FORCE].equals(targetServerUrl))
		            		{
		            			deleteList.add(lock);
		            		}
		            	}
		        	}
		        }
	        }	        
	        
	        //remove the reposLocks
	        for(int i=0; i<deleteList.size(); i++)
	        {
	        	DocLock reposLock = deleteList.get(i);
	        	reposLocksMap.remove(reposLock.getVid());
	        	Log.info("clearReposLocksMap() clear reposLock:" + reposLock.getVid());
	        }
        } catch (Exception e) {
            errorLog(e);
        }
	}
	

	private void clearAllReposRedisData(String targetServerUrl) {
		//clear ReposLocksMap
		clearReposLocksMap(targetServerUrl);
		
		//clear Repos RedisData one by one
		try {
			List <Repos> list = reposService.getAllReposList();
			if(list == null)
			{
				Log.debug("clearAllReposRedisData there is no repos");
				return;
			}
			
			for(int i=0; i<list.size(); i++)
			{
				Repos repos = list.get(i);
				Log.debug("\n++++++++++ clearAllReposRedisData Start for repos [" + repos.getId() + " " + repos.getName() + "] ++++++++++");
				
				//clear ReposDocLocksMap
				clearReposDocLocksMap(repos, targetServerUrl);
				
				//clearReposExtentionConfigRedisData
				clearReposExtentionConfigRedisData(repos, targetServerUrl);
				
				//syncLock can not unlock by other thread, so we should set timeout when do lock
				//if(targetServerUrl == null)
				//{
				//	clearReposRedisSyncLocks(repos);
				//}
				
				Log.debug("------------ clearAllReposRedisData End for repos [" + repos.getId() + " " + repos.getName() + "] -----------\n");
				
			}
	    } catch (Exception e) {
	        Log.info("initReposExtentionConfigEx 异常");
	        Log.info(e);
		}	
	}

	private void clearReposRedisSyncLocks(Repos repos) {
		//clear reposExtConfigSyncLock
		String lockInfo = "clearReposRedisSyncLocks for repos [" + repos.getId() + " " + repos.getName() + "]";

		//clear clusterDeployCheck SyncLock
		String lockName = "clusterDeployCheck" + repos.getId();
		redisSyncUnlock(lockName, lockInfo);

		lockName = "reposExtConfigSyncLock" + repos.getId();
		redisSyncUnlock(lockName, lockInfo);	
				
		//clear syncLockForGitCommit
		lockName = "reposData.syncLockForGitCommit" + repos.getId();
		redisSyncUnlock(lockName, lockInfo);
		
		//clear syncLockForGitCommit
		lockName = "reposData.syncLockForSvnCommit" + repos.getId();
		redisSyncUnlock(lockName, lockInfo);
		
		//clear repos related indexLibSyncLocks
		lockName = "indexLibSyncLock" + getIndexLibPath(repos, 0);	//indexLib for docName
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" + getIndexLibPath(repos, 1);	//indexLib for realDoc
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" + getIndexLibPath(repos, 2);	//indexLib for virtualDoc
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos) + "RemoteStorage/Doc";		//RemoteStorage
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos)  + "RemoteServer/Doc";		//RemoteServer
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos) + "LocalBackup/Doc";				//LocalBackup
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos) + "LocalBackup/Doc-RealTime";		//LocalBackup
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos) + "LocalBackup/VDoc";				//LocalBackup
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos) + "LocalBackup/VDoc-RealTime";	//LocalBackup
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos) + "RemoteBackup/Doc";				//RemoteBackup
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos) + "RemoteBackup/Doc-RealTime";	//RemoteBackup
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos) + "RemoteBackup/VDoc";			//RemoteBackup
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos) + "RemoteBackup/VDoc-RealTime";	//RemoteBackup
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos) + "PushRepos/ReposRoot";				//PushRepos
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos)  + "PushRepos/ReposRealDoc";			//PushRepos
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos) + "PushRepos/ReposRealDocVerRepos";	//PushRepos
		redisSyncUnlock(lockName, lockInfo);
		lockName = "indexLibSyncLock" +  Path.getReposIndexLibPath(repos) + "PushRepos/ReposVirtualDocVerRepos";//PushRepos
		redisSyncUnlock(lockName, lockInfo);
	}

	private void clearReposExtentionConfigRedisData(Repos repos, String targetServerUrl) {
		if(targetServerUrl == null)
		{
			Log.info("clearReposExtentionConfigRedisData() for repos [" + repos.getId() + " " + repos.getName() + "]");
			//delete reposExtConfigDigest and configs
			RBucket<Object> reposExtConfigDigest = redisClient.getBucket("reposExtConfigDigest" + repos.getId());
			reposExtConfigDigest.delete();
			
			RMap<Object, Object> reposRemoteStorageHashMap = redisClient.getMap("reposRemoteStorageHashMap");
			reposRemoteStorageHashMap.remove(repos.getId());
			RMap<Object, Object> reposRemoteServerHashMap = redisClient.getMap("reposRemoteServerHashMap");
			reposRemoteServerHashMap.remove(repos.getId());
			RMap<Object, Object> reposBackupConfigHashMap = redisClient.getMap("reposBackupConfigHashMap");
			reposBackupConfigHashMap.remove(repos.getId());
			RMap<Object, Object> reposTextSearchConfigHashMap = redisClient.getMap("reposTextSearchConfigHashMap");
			reposTextSearchConfigHashMap.remove(repos.getId());
			RMap<Object, Object> reposVersionIgnoreConfigHashMap = redisClient.getMap("reposVersionIgnoreConfigHashMap");
			reposVersionIgnoreConfigHashMap.remove(repos.getId());
			RMap<Object, Object> reposEncryptConfigHashMap = redisClient.getMap("reposEncryptConfigHashMap");
			reposEncryptConfigHashMap.remove(repos.getId());
			
		}
	}

	private void clearReposDocLocksMap(Repos repos, String targetServerUrl) {
		RMap<Object, Object> reposDocLocskMap = redisClient.getMap("reposDocLocskMap" + repos.getId());
		if(targetServerUrl == null)
		{
			Log.info("clearReposDocLocksMap() for repos [" + repos.getId() + " " + repos.getName() + "]");
			reposDocLocskMap.clear();
			return;
		}
		
		//遍历reposDocLocskMap, and unlock the locks locked by serverUrl
		List<DocLock> updateList = new ArrayList<DocLock>();
    	try {
	        if (reposDocLocskMap != null) {
				Iterator<Entry<Object, Object>> iterator = reposDocLocskMap.entrySet().iterator();
		        while (iterator.hasNext()) 
		        {
		        	Entry<Object, Object> entry = iterator.next();
		            if(entry != null)
		        	{
		            	DocLock lock = (DocLock) entry.getValue();
		            	Integer curState = lock.getState();
		            	boolean needUpdate = false;
	            		Log.debug("clearReposDocLocksMap() lock[" + lock.lockId + "] state:" + curState);
		            	if(curState == 0)
		            	{
		            		needUpdate = true;
		            	}
		            	else
		            	{
		            		if(lock.server[DocLock.LOCK_STATE_FORCE] == null || lock.server[DocLock.LOCK_STATE_FORCE].equals(targetServerUrl))
		            		{
		            			curState = curState & DocLock.LOCK_STATE_FORCE;
		            			lock.setState(curState);
		            			needUpdate = true;
		            		}
		            		
		            		if(lock.server[DocLock.LOCK_STATE_NORMAL] == null || lock.server[DocLock.LOCK_STATE_NORMAL].equals(targetServerUrl))
		            		{
		            			curState = curState & DocLock.LOCK_STATE_NORMAL;
		            			lock.setState(curState);
		            			needUpdate = true;
		            		}
		            		
		            		if(lock.server[DocLock.LOCK_STATE_COEDIT] == null || lock.server[DocLock.LOCK_STATE_COEDIT].equals(targetServerUrl))
		            		{
		            			curState = curState & DocLock.LOCK_STATE_COEDIT;
		            			lock.setState(curState);
		            			needUpdate = true;
		            		}
		            	}
		            	
		            	if(needUpdate)
		            	{
		            		updateList.add(lock);
		            	}
		        	}
		        }
		        
		        //update the reposDocLocks
		        for(int i=0; i<updateList.size(); i++)
		        {
		        	DocLock docLock = updateList.get(i);
		        	if(docLock.getState() == 0)
		        	{
			        	reposDocLocskMap.remove(docLock.lockId);	
			        	Log.info("clearReposLocksMap() remove docLock:" + docLock.lockId);
		        	}
		        	else
		        	{
		        		reposDocLocskMap.put(docLock.lockId, docLock);
			        	Log.info("clearReposLocksMap() update docLock:" + docLock.lockId + " to state:" + docLock.getState());
		        	}
		        }
	        }	        	        
        } catch (Exception e) {
            errorLog(e);
        }
	}

	private Integer getOfficeType(String officeEditorApi) {
		if(officeEditorApi == null || officeEditorApi.isEmpty())
		{
			return 0;
		}
		return 1;
	}

	private static int getLogLevelFromFile() {
		File file = new File(docSysIniPath + "debugLogLevel");
		if(file.exists())
		{
			String logLevelStr = FileUtil.readDocContentFromFile(docSysIniPath, "debugLogLevel", "UTF-8");
			if(logLevelStr == null || logLevelStr.isEmpty())
			{
				return Log.info;
			}
			switch(logLevelStr.trim())
			{
			case "0":
				return Log.debug;
			case "1":
				return Log.info;
			case "2":
				return Log.warn;
			case "3":
				return Log.error;
			}
		}
		return Log.info;
	}
	
	protected static void setLogLevelToFile(Integer logLevel) {
		FileUtil.saveDocContentToFile(logLevel + "", docSysIniPath, "debugLogLevel", "UTF-8");
	}
	
	private static String getLogFileFromFile() {
		File file = new File(docSysIniPath + "debugLogFile");
		if(file.exists())
		{
			String logFile = FileUtil.readDocContentFromFile(docSysIniPath, "debugLogFile", "UTF-8");
			if(logFile == null)
			{
				return null;
			}
			
			
			logFile = logFile.trim();
			if(logFile.isEmpty())
			{
				return null;
			}
			
			return logFile;
		}
		return null;
	}

	protected static void setLogFileToFile(String logFile) {
		if(logFile == null)
		{
			logFile = "";
		}
		
		FileUtil.saveDocContentToFile(logFile, docSysIniPath, "debugLogFile", "UTF-8");
	}

	protected void initReposExtentionConfigEx() {
		Log.debug("initReposExtentionConfigEx for All Repos");
		
		try {
			List <Repos> list = reposService.getAllReposList();
			if(list == null)
			{
				Log.debug("initReposExtentionConfigEx there is no repos");
				return;
			}
			
			for(int i=0; i<list.size(); i++)
			{
				Repos repos = list.get(i);
				Log.debug("\n++++++++++ initReposExtentionConfigEx Start for repos [" + repos.getId() + " " + repos.getName() + "] ++++++++++");
				
				ReposData reposData = initReposData(repos);
				initReposExtentionConfigEx(repos, reposData);
				
				Log.debug("------------ initReposExtentionConfigEx End for repos [" + repos.getId() + " " + repos.getName() + "] -----------\n");
				
			}
	    } catch (Exception e) {
	        Log.info("initReposExtentionConfigEx 异常");
	        Log.info(e);
		}
	}
	
	private void clearGlobalRedisData() {
		RBucket<String> buket = redisClient.getBucket("DB_URL");
		buket.delete();

		buket = redisClient.getBucket("ldapConfig");
		buket.delete();
		
		buket = redisClient.getBucket("OfficeEditor");
		buket.delete();
	}
	
	private boolean clusterDeployCheckGlobal(boolean clusterServerCheckEn) {
		boolean ret = false;
		
		String lockName = "clusterDeployCheckGlobal";
		String lockInfo = "Cluster Deploy Check Global";
		redisSyncLock(lockName, lockInfo);

		try {			
			if(clusterDeployCheckGlobal_DuplicateCheck() == false)
			{
				redisSyncUnlock(lockName, lockInfo);
				return false;
			}
			
			//Check DB URL
			if(clusterDeployCheckGlobal_ConfigCheck("DB_URL", DB_URL) == false)
			{
				redisSyncUnlock(lockName, lockInfo);				
				return false;
			}
			
			//Check LDAP
			String ldapConfig = getLdapConfig();
			if(clusterDeployCheckGlobal_ConfigCheck("ldapConfig", ldapConfig) == false)
			{
				redisSyncUnlock(lockName, lockInfo);				
				return false;
			}
			
			//Check OfficeEditor
			if(clusterDeployCheckGlobal_ConfigCheck("OfficeEditor", officeEditorApi) == false)
			{
				redisSyncUnlock(lockName, lockInfo);				
				return false;
			}
			
			//clusterServerCheckEn参数是为了避免系统没启动完成，无法进行回环测试
			//TODO: 当然这里留下了一个漏洞:serverUrl设置错误时直接重启可以跳过回环测试
			if(clusterServerCheckEn)
			{
				if(clusterDeployCheckGlobal_ClusterServerCheck() == false)
				{
					redisSyncUnlock(lockName, lockInfo);				
					return false;
				}
			}
			
			globalClusterDeployCheckResult = true;
			ret = true;			
	    } catch (Exception e) {
	        Log.info("clusterDeployCheckGlobal 异常");
	        Log.info(e);
		}
		
		redisSyncUnlock(lockName, lockInfo);		
		return ret;
	}
	
	private boolean clusterDeployCheckGlobal_ClusterServerCheck() {
		//TODO: Send Test Http Request to clusterServerUrl
		//If the request come back that means this serverUrl is for myself, else it is a error serverUrl
		if(clusterServerUrl == null || clusterServerUrl.isEmpty())
		{
			globalClusterDeployCheckResult = false;
		    globalClusterDeployCheckResultInfo = "集群检测失败: 集群服务器地址未设置";
			return false;
		}
		
		if(clusterServerLoopbackTest(clusterServerUrl) == false)
		{
			globalClusterDeployCheckResult = false;
		    globalClusterDeployCheckResultInfo = "集群检测失败: 集群服务器 [" + clusterServerUrl + "] 回环测试失败";
			return false;
		}
		
		return true;
	}
	
	public static boolean clusterServerLoopbackTest(String serverUrl) {
		Log.info("clusterServerLoopbackTest() current clusterServerLoopbackMsg [" + clusterServerLoopbackMsg + "]");

		String loopbackMsg = new Date().getTime() +"";
		String authCode = generateAuthCodeLocal("clusterServerLoopbackTest", 5*CONST_MINUTE, 3, null).getCode();
		
		Log.info("clusterServerLoopbackTest() msg [" + loopbackMsg + "] authCode:[" + authCode + "]");
		
		boolean result = false;
        try {
    		String requestUrl = serverUrl + "/DocSystem/Manage/clusterServerLoopbackTest.do";
    		Log.debug("clusterServerLoopbackTest() requestUrl:" + requestUrl);
    		HashMap<String, String> reqParams = new HashMap<String, String>();
    		reqParams.put("msg", loopbackMsg);
    		reqParams.put("authCode", authCode);
    		postFileStreamAndJsonObj(requestUrl, null, null, reqParams, true);
    		Log.info("clusterServerLoopbackTest() latest clusterServerLoopbackMsg [" + clusterServerLoopbackMsg + "]");
    		if(clusterServerLoopbackMsg != null && clusterServerLoopbackMsg.equals(loopbackMsg))
    		{
    			result = true;
    		}
        } catch (Exception e) {
            errorLog(e);
        }
        
        deleteAuthCodeLocal(authCode);
        
        return result;		
	}

	private boolean clusterDeployCheckGlobal_DuplicateCheck() {
		RMap<String, Long> clusterServersMap = redisClient.getMap("clusterServersMap");
		if(clusterServersMap.get(clusterServerUrl) == null)
		{
			return true;
		}
		
		globalClusterDeployCheckResult = false;
	    globalClusterDeployCheckResultInfo = "集群检测失败: [" + clusterServerUrl + "] 已在集群列表中";
	    return false;
	}
    
	private boolean clusterDeployCheckGlobal_ConfigCheck(String configName, String localValue) {
		RBucket<String> buket = redisClient.getBucket(configName);
		String redisValue = buket.get();
		if(redisValue == null)
		{
			if(localValue == null)
			{
				buket.set("");
			}
			else
			{
				buket.set(localValue);
			}
			return true;
		}

		if(localValue == null)
		{
			if(redisValue.isEmpty())
			{
				return true;
			}

			globalClusterDeployCheckResult = false;
		    globalClusterDeployCheckResultInfo = "集群检测失败:[" + configName + "] 配置不一致 [" + localValue + "] [" + redisValue + "]";
		    return false;
		}

		if(redisValue.equals(localValue))
		{
			return true;
		}

		globalClusterDeployCheckResult = false;
	    globalClusterDeployCheckResultInfo = "集群检测失败:[" + configName + "] 配置不一致 [" + localValue + "] [" + redisValue + "]";
	    return false;
	}

	private void initReposExtentionConfigEx(Repos repos, ReposData reposData) {
		Log.debug("++++++++++ initReposExtentionConfigEx() clusterDeployCheck Start ++++++");
		if(clusterDeployCheck(repos, reposData) == false)
		{
			//reposData.disabled = "集群检测失败，请检查该仓库的存储路径是否符合集群条件！";					
			Log.debug("----------- initReposExtentionConfigEx() clusterDeployCheck Failed ----");
			return;
		}
		Log.debug("----------- initReposExtentionConfigEx() clusterDeployCheck Success ----");
		
		repos.reposExtConfigDigest = getReposExtConfigDigest(repos);
		Log.printObject("initReposExtentionConfigEx() reposExtConfigDigest:", repos.reposExtConfigDigest);

				
		/*** Init ReposExtConfig Start ***/
		boolean updateRedis = redisEn && repos.reposExtConfigDigest == null;
		//Init RemoteStorageConfig		
		Log.debug("++++++++++ initReposExtentionConfigEx() initReposRemoteStorageConfigEx Start +++++");
		initReposRemoteStorageConfigEx(repos, repos.getRemoteStorage(), updateRedis);
		Log.debug("----------- initReposExtentionConfigEx() initReposRemoteStorageConfigEx End ------");
		
		//Init RemoteServerConifg
		Log.debug("++++++++++ initReposExtentionConfigEx() initReposRemoteServerConfigEx Start +++++");
		String remoteServer = getReposRemoteServer(repos);
		repos.remoteServer = remoteServer;
		initReposRemoteServerConfigEx(repos, remoteServer, updateRedis);
		Log.debug("----------- initReposExtentionConfigEx() initReposRemoteServerConfigEx End ------");
		
		//Init ReposAutoBackupConfig
		Log.debug("++++++++++ initReposExtentionConfigEx() initReposAutoBackupConfigEx Start +++++");
		String autoBackup = getReposAutoBackup(repos);
		repos.setAutoBackup(autoBackup);
		initReposAutoBackupConfigEx(repos, autoBackup, updateRedis);
		Log.debug("----------- initReposExtentionConfigEx() initReposAutoBackupConfigEx End ------");
				
		//Init ReposTextSearchConfig
		Log.debug("++++++++++ initReposExtentionConfigEx() initReposTextSearchConfigEx Start +++++");
		String textSearch = getReposTextSearch(repos);
		repos.setTextSearch(textSearch);
		initReposTextSearchConfigEx(repos, textSearch, updateRedis);					
		Log.debug("----------- initReposExtentionConfigEx() initReposTextSearchConfigEx End ------");
		
		//Init ReposVersionIgnoreConfig
		Log.debug("++++++++++ initReposExtentionConfigEx() initReposVersionIgnoreConfigEx Start +++++");
		initReposVersionIgnoreConfigEx(repos, updateRedis);
		Log.debug("----------- initReposExtentionConfigEx() initReposVersionIgnoreConfigEx End ------");
		
		//Init ReposEncryptConfig
		Log.debug("++++++++++ initReposExtentionConfigEx() initReposEncryptConfigEx Start +++++");
		initReposEncryptConfigEx(repos, updateRedis);
		Log.debug("----------- initReposExtentionConfigEx() initReposEncryptConfigEx End ------");
		/*** Init ReposExtConfig End ***/
		
		/*** Init Repos related Async Tasks Start ***/
		Log.debug("+++++++++++ initReposExtentionConfigEx() init repos related Async Tasks Start +++++++++");		
		//每个仓库都必须有对应的备份任务和同步任务，新建的仓库必须在新建仓库时创建任务
		reposLocalBackupTaskHashMap.put(repos.getId(), new ConcurrentHashMap<String, BackupTask>());
		reposRemoteBackupTaskHashMap.put(repos.getId(), new ConcurrentHashMap<String, BackupTask>());	
		reposSyncupTaskHashMap.put(repos.getId(), new ConcurrentHashMap<Long, SyncupTask>());

		//启动定时备份任务
		if(repos.autoBackupConfig != null)
		{
			addDelayTaskForLocalBackup(repos, repos.autoBackupConfig.localBackupConfig, 10, null, true); //3600L);	//1小时后开始本地备份
			addDelayTaskForRemoteBackup(repos, repos.autoBackupConfig.remoteBackupConfig, 10, null, true); //7200L); //2小时后开始远程备份
		}
		
		//启动定时同步任务
		if(repos.getVerCtrl() != null && repos.getVerCtrl() != 0)
		{
			addDelayTaskForReposSyncUp(repos, 10, 9800L);	//3小时后开始仓库同步
		}
		Log.debug("------------ initReposExtentionConfigEx() init repos related Async Tasks End ---------");		
		/*** Init Repos related Async Tasks End ***/
	}

	private boolean clusterDeployCheck(Repos repos, ReposData reposData) {
		if(redisEn == false)
		{
			return true;
		}
		
		if(globalClusterDeployCheckResult == false)
		{
			reposData.disabled = globalClusterDeployCheckResultInfo;
			return false;
		}
		
		String lockName = "clusterDeployCheck" + repos.getId();
		String lockInfo = "[" + repos.getId() + " " + repos.getName() + "] Cluster Deploy Check";
		redisSyncLock(lockName, lockInfo);
		
		boolean ret = false;
		RBucket<Object> bucket = redisClient.getBucket("clusterDeployCheckSum" + repos.getId());
		String checkSum = (String) bucket.get();
		if(checkSum == null)
		{
			Log.debug("clusterDeployCheck() remoteCheckSum is null, do init remote and local CheckSum");
			checkSum = "clusterDeployCheckSum-" + repos.getId() + " " + repos.getName(); 
			bucket.set(checkSum);
			setReposClusterDeployLocalCheckSum(repos, checkSum);
			ret =  true;
		}
		else
		{
			String localCheckSum = getReposClusterDeployLocalCheckSum(repos);
			Log.debug("clusterDeployCheck() remoteCheckSum:" + checkSum + " localCheckSum:" + localCheckSum);
			if(localCheckSum == null || !localCheckSum.equals(checkSum))
			{
				reposData.disabled = "集群检测失败，仓库的存储路径不一致";
				Log.info("clusterDeployCheck() " + repos.getId() + " " + repos.getName() + " cluster deploy check failed: remoteCheckSum:" + checkSum + " localCheckSum:" + localCheckSum);
				ret = false;
			}
			else
			{
				ret = true;
			}
		}
		
		redisSyncUnlock(lockName, lockInfo);

		Log.debug("clusterDeployCheck() check result:" + ret);
		return ret;
	}
	
	protected boolean setReposClusterDeployLocalCheckSum(Repos repos, String checkSum) {
		String path = Path.getReposClusterDeployConfigPath(repos);
		String name = "checkSum.txt";
			
		if(FileUtil.saveDocContentToFile(checkSum, path, name, "UTF-8") == false)
    	{
    		Log.info("setReposClusterDeployLocalCheckSum() checkSum保存失败");
    		return false;
    	}
		
		return true;
	}
	
	protected String getReposClusterDeployLocalCheckSum(Repos repos) {
		String path = Path.getReposClusterDeployConfigPath(repos);
		String name = "checkSum.txt";
			
		String checkSum = FileUtil.readDocContentFromFile(path, name, "UTF-8");
		Log.info("setReposClusterDeployLocalCheckSum() checkSum:" + checkSum);
		return checkSum;
	}

	protected void initReposExtentionConfig() {
		Log.debug("initReposExtentionConfig for All Repos");
		
		try {
			List <Repos> list = reposService.getAllReposList();
			if(list == null)
			{
				Log.debug("initReposExtentionConfig there is no repos");
				return;
			}
			
			for(int i=0; i<list.size(); i++)
			{
				Repos repos = list.get(i);
				Log.debug("\n************* initReposExtentionConfig Start for repos:" + repos.getId() + " " + repos.getName() + " *******");
				
				initReposData(repos);

				repos.reposExtConfigDigest = getReposExtConfigDigest(repos);
				Log.printObject("initReposExtentionConfig() reposExtConfigDigest:", repos.reposExtConfigDigest);
						
				/*** Init ReposExtConfig Start ***/
				//Init RemoteStorageConfig
				initReposRemoteStorageConfig(repos, repos.getRemoteStorage());
				
				//Init RemoteServerConifg
				String remoteServer = getReposRemoteServer(repos);
				repos.remoteServer = remoteServer;
				initReposRemoteServerConfig(repos, remoteServer);
				
				//Init ReposAutoBackupConfig
				String autoBackup = getReposAutoBackup(repos);
				repos.setAutoBackup(autoBackup);
				initReposAutoBackupConfig(repos, autoBackup);
				
				//Init ReposTextSearchConfig
				String textSearch = getReposTextSearch(repos);
				repos.setTextSearch(textSearch);
				initReposTextSearchConfig(repos, textSearch);
				
				//Init ReposVersionIgnoreConfig
				initReposVersionIgnoreConfig(repos);
				
				//Init ReposEncryptConfig
				initReposEncryptConfig(repos);
				
				/*** Init ReposExtConfig End ***/
				
				/*** Init Repos related Async Tasks Start ***/
				//每个仓库都必须有对应的备份任务和同步任务，新建的仓库必须在新建仓库时创建任务
				reposLocalBackupTaskHashMap.put(repos.getId(), new ConcurrentHashMap<String, BackupTask>());
				reposRemoteBackupTaskHashMap.put(repos.getId(), new ConcurrentHashMap<String, BackupTask>());	
				reposSyncupTaskHashMap.put(repos.getId(), new ConcurrentHashMap<Long, SyncupTask>());

				//启动定时备份任务
				if(repos.autoBackupConfig != null)
				{
					addDelayTaskForLocalBackup(repos, repos.autoBackupConfig.localBackupConfig, 10, null, true); //3600L);	//1小时后开始本地备份
					addDelayTaskForRemoteBackup(repos, repos.autoBackupConfig.remoteBackupConfig, 10, null, true); //7200L); //2小时后开始远程备份
				}
				
				//启动定时同步任务
				if(repos.getVerCtrl() != null && repos.getVerCtrl() != 0)
				{
					addDelayTaskForReposSyncUp(repos, 10, 9800L);	//3小时后开始仓库同步
				}
				/*** Init Repos related Async Tasks End ***/
				
				Log.debug("************* initReposExtentionConfig End for repos:" + repos.getId() + " " + repos.getName() + " *******\n");				
			}
	    } catch (Exception e) {
	        Log.info("initReposExtentionConfig 异常");
	        Log.info(e);
		}
	}
	
	protected boolean realTimeRemoteStoragePush(Repos repos, Doc doc, Doc dstDoc, User accessUser, String commitMsg, ReturnAjax rt, String action) {
		Log.debug("\n********* realTimeRemoteStoragPush() ***********");
		
		boolean ret = false;
		
		RemoteStorageConfig remote = repos.remoteStorageConfig;
		if(remote == null || remote.autoPush == null || remote.autoPush != 1)
		{
			Log.debug("realTimeRemoteStoragPush() remoteStorageConfig autoPush not configured");			
			return false;
		}
		
		Channel channel = ChannelFactory.getByChannelName("businessChannel");
		if(channel == null)
	    {
			Log.debug("realTimeRemoteStoragPush 非商业版本不支持远程存储");
			return false;
	    }
		
		Log.info("********* realTimeRemoteStoragPush() [" + doc.getPath() + doc.getName() + "] ***********");
		//push Options
		boolean recurcive = true;
		boolean force = remote.autoPushForce == 1;
		int pushType = 4;
		
		switch(action)
		{
		case "copyDoc":
			Log.info("********* realTimeRemoteStoragPush() copyDoc [" + doc.getPath() + doc.getName() + "] to [" + dstDoc.getPath() + dstDoc.getName() + "] ***********");
			ret = channel.remoteStoragePush(remote, repos, dstDoc, accessUser, commitMsg, recurcive, force, pushType, rt);
			break;
		case "moveDoc":
			Log.info("********* realTimeRemoteStoragPush() moveDoc [" + doc.getPath() + doc.getName() + "] to [" + dstDoc.getPath() + dstDoc.getName() + "] ***********");
			channel.remoteStoragePush(remote, repos, doc, accessUser, commitMsg, recurcive, force, pushType, rt);
			ret = channel.remoteStoragePush(remote, repos, dstDoc, accessUser, commitMsg, recurcive, force, pushType, rt);
			break;
		case "renameDoc":
			Log.info("********* realTimeRemoteStoragPush() renameDoc [" + doc.getPath() + doc.getName() + "] to [" + dstDoc.getPath() + dstDoc.getName() + "] ***********");
			channel.remoteStoragePush(remote, repos, doc, accessUser, commitMsg, recurcive, force, pushType, rt);
			ret = channel.remoteStoragePush(remote, repos, dstDoc, accessUser, commitMsg, recurcive, force, pushType, rt);
			break;
		//case "addDoc":
		//case "deleteDoc":
		//case "updateDocContent":
		//case "uploadDoc":
		//case "uploadDocRS":
		//case "revertDocHistory":
		default:
			Log.info("********* realTimeRemoteStoragPush() " + action + " [" + doc.getPath() + doc.getName() + "] ***********");
			ret = channel.remoteStoragePush(remote, repos, doc, accessUser, commitMsg, recurcive, force, pushType, rt);
			break;
		}			
		return ret;
	}

	protected boolean realTimeBackup(Repos repos, Doc doc, Doc dstDoc, User accessUser, String commitMsg, ReturnAjax rt, String action) 
	{
		Log.debug("\n********* realTimeBackup() ***********");

		ReposBackupConfig backupConfig = repos.autoBackupConfig;
		if(backupConfig == null)
		{
			Log.debug("realTimeBackup() backupConfig not configured");			
			return false;
		}
				
		realTimeLocalBackup(repos, doc, dstDoc, accessUser, commitMsg, rt, action);
		realTimeRemoteBackup(repos, doc, dstDoc, accessUser, commitMsg, rt, action);
		return true;
	}

	private boolean realTimeRemoteBackup(Repos repos, Doc doc, Doc dstDoc, User accessUser, String commitMsg, ReturnAjax rt, String action) {
		Log.debug("********* realTimeRemoteBackup() ***********");

		boolean ret = false;
		
		BackupConfig remoteBackupConfig = repos.autoBackupConfig.remoteBackupConfig;
		if(remoteBackupConfig == null || remoteBackupConfig.realTimeBackup == null || remoteBackupConfig.realTimeBackup == 0)
		{
			Log.debug("realTimeRemoteBackup() remoteBackupConfig realTimeBackup not configured");			
			return false;
		}
		
		RemoteStorageConfig remote = remoteBackupConfig.remoteStorageConfig;
		if(remote == null)
		{
			Log.debug("realTimeRemoteBackup() remoteStorageConfig not configured");			
			return false;
		}
		
		Channel channel = ChannelFactory.getByChannelName("businessChannel");
		if(channel == null)
	    {
			Log.debug("realTimeRemoteBackup 非商业版本不支持远程备份");
			return false;
	    }
		
		Log.info("********* realTimeRemoteBackup() [" + doc.getPath() + doc.getName() + "] ***********");
		//实时备份是不备份备注文件的
		remote.remoteStorageIndexLib = getRealTimeBackupIndexLibForRealDoc(remoteBackupConfig, remote);		
		String offsetPath = getRealTimeBackupOffsetPathForRealDoc(repos, remote, new Date());
		doc.offsetPath = offsetPath;
		if(dstDoc != null)
		{
			dstDoc.offsetPath = offsetPath;
		}
		Log.info("realTimeRemoteBackup() offsetPath [" + offsetPath + "]");			
		
		//push Options
		boolean recurcive = true;
		boolean force = true;
		int pushType = 1;
		if(remote.isVerRepos)
		{
			pushType = 4;
		}

		
		switch(action)
		{
		case "copyDoc":
			Log.info("********* realTimeRemoteBackup() copyDoc [" + doc.getPath() + doc.getName() + "] to [" + dstDoc.getPath() + dstDoc.getName() + "] ***********");
			ret = channel.remoteStoragePush(remote, repos, dstDoc, accessUser, commitMsg, recurcive, force, pushType, rt);
			break;
		case "moveDoc":
			Log.info("********* realTimeRemoteBackup() moveDoc [" + doc.getPath() + doc.getName() + "] to [" + dstDoc.getPath() + dstDoc.getName() + "] ***********");
			channel.remoteStoragePush(remote, repos, doc, accessUser, commitMsg, recurcive, force, pushType,  rt);
			channel.remoteStoragePush(remote, repos, dstDoc, accessUser, commitMsg, recurcive, force, pushType,  rt);
			break;
		case "renameDoc":
			Log.info("********* realTimeRemoteBackup() renameDoc [" + doc.getPath() + doc.getName() + "] to [" + dstDoc.getPath() + dstDoc.getName() + "] ***********");
			channel.remoteStoragePush(remote, repos, doc, accessUser, commitMsg, recurcive, force, pushType,  rt);
			ret = channel.remoteStoragePush(remote, repos, dstDoc, accessUser, commitMsg, recurcive, force, pushType,  rt);
			break;
		//case "addDoc":
		//case "deleteDoc":
		//case "updateDocContent":
		//case "uploadDoc":
		//case "uploadDocRS":
		//case "revertDocHistory":
		//	channel.remoteStoragePush(repos, doc, accessUser, commitMsg, true, true, true, rt);
		//	break;
		default:
			Log.info("********* realTimeRemoteBackup() " + action + " [" + doc.getPath() + doc.getName() + "] ***********");
			ret = channel.remoteStoragePush(remote, repos, doc, accessUser, commitMsg, recurcive, force, pushType, rt);
			break;
		}	
		return ret;
	}

	private boolean realTimeLocalBackup(Repos repos, Doc doc, Doc dstDoc, User accessUser, String commitMsg, ReturnAjax rt, String action) {
		Log.debug("********* realTimeLocalBackup() ****************");

		boolean ret = false;
		
		BackupConfig localBackupConfig = repos.autoBackupConfig.localBackupConfig;
		if(localBackupConfig == null || localBackupConfig.realTimeBackup == null || localBackupConfig.realTimeBackup == 0)
		{
			Log.debug("realTimeLocalBackup() localBackupConfig realTimeBackup not configured");			
			return false;
		}
		
		RemoteStorageConfig remote = localBackupConfig.remoteStorageConfig;
		if(remote == null)
		{
			Log.debug("realTimeLocalBackup() remoteStorageConfig not configured");			
			return false;
		}
		
		Channel channel = ChannelFactory.getByChannelName("businessChannel");
		if(channel == null)
	    {
			Log.debug("realTimeLocalBackup 非商业版本不支持本地备份");
			return false;
	    }
		
		Log.info("********* realTimeLocalBackup() [" + doc.getPath() + doc.getName() + "] ***********");
		remote.remoteStorageIndexLib = getRealTimeBackupIndexLibForRealDoc(localBackupConfig, remote);		
		//set offsetPath 
		String offsetPath = getRealTimeBackupOffsetPathForRealDoc(repos, remote, new Date());		
		doc.offsetPath = offsetPath;		
		if(dstDoc != null)
		{
			dstDoc.offsetPath = offsetPath;
		}
		Log.info("realTimeLocalBackup() offsetPath [" + offsetPath + "]");			
			
		//push options
		boolean recurcive = true;
		boolean force = true;
		int pushType = 1;
		if(remote.isVerRepos)
		{
			pushType = 4;
		}
		
		switch(action)
		{
		case "copyDoc":
			Log.info("********* realTimeLocalBackup() copyDoc [" + doc.getPath() + doc.getName() + "] to [" + dstDoc.getPath() + dstDoc.getName() + "] ***********");
			ret = channel.remoteStoragePush(remote, repos, dstDoc, accessUser, commitMsg, recurcive, force, pushType, rt);
			break;
		case "moveDoc":
			Log.info("********* realTimeLocalBackup() moveDoc [" + doc.getPath() + doc.getName() + "] to [" + dstDoc.getPath() + dstDoc.getName() + "] ***********");
			channel.remoteStoragePush(remote, repos, doc, accessUser, commitMsg, recurcive, force, pushType, rt);
			ret = channel.remoteStoragePush(remote, repos, dstDoc, accessUser, commitMsg, recurcive, force, pushType, rt);
			break;
		case "renameDoc":
			Log.info("********* realTimeLocalBackup() renameDoc [" + doc.getPath() + doc.getName() + "] to [" + dstDoc.getPath() + dstDoc.getName() + "] ***********");
			channel.remoteStoragePush(remote, repos, doc, accessUser, commitMsg, recurcive, force, pushType, rt);
			ret = channel.remoteStoragePush(remote, repos, dstDoc, accessUser, commitMsg, recurcive, force, pushType, rt);
			break;
		//case "addDoc":
		//case "deleteDoc":
		//case "updateDocContent":
		//case "uploadDoc":
		//case "uploadDocRS":
		//case "revertDocHistory":
		default:
			Log.info("********* realTimeLocalBackup() " + action + " [" + doc.getPath() + doc.getName() + "] ***********");
			ret = channel.remoteStoragePush(remote, repos, doc, accessUser, commitMsg, recurcive, force, pushType, rt);
			break;
		}			
		return ret;
	}
	
	public void addDelayTaskForDBBackup(int offsetMinute, Long forceStartDelay) {
		Long delayTime = getDelayTimeForNextDBBackupTask(offsetMinute);
		if(delayTime == null)
		{
			Log.info("addDelayTaskForDBBackup delayTime is null");			
			return;
		}
		
		if(forceStartDelay != null)
		{
			Log.info("addDelayTaskForDBBackup forceStartDelay:" + forceStartDelay + " 秒后强制开始备份！" );											
			delayTime = forceStartDelay; //1分钟后执行第一次备份
		}
		Log.info("addDelayTaskForDBBackup delayTime:" + delayTime + " 秒后开始备份！" );		
		
		//备份线程可能被多次启动，避免出现多次备份，每次启动一个新备份线程都需要先关闭旧的备份线程
		if(dbBackupTaskHashMap == null)
		{
			Log.info("addDelayTaskForDBBackup dbBackupTaskHashMap 未初始化");
			return;
		}
		
		long curTime = new Date().getTime();
        Log.info("addDelayTaskForDBBackup() curTime:" + curTime);        
		
		//stopReposBackUpTasks
		//go through all backupTask and close all task
		for (BackupTask value : dbBackupTaskHashMap.values()) {
			Log.debug("addDelayTaskForDBBackup() stop backupTask:" + value.createTime);			
			value.stopFlag = true;
		}
		
		//startReposBackupTask
		BackupTask backupTask = new BackupTask();
		backupTask.createTime = curTime;
		dbBackupTaskHashMap.put(curTime, backupTask);

		ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
        executor.schedule(
        		new Runnable() {
        			long createTime = curTime;
                    @Override
                    public void run() {
                        try {
	                        Log.info("\n******** DBBackupDelayTask [" + createTime + "] for DataBase");
	                        
	                        //检查备份任务是否已被停止
	                		BackupTask backupTask = dbBackupTaskHashMap.get(curTime);
	                		if(backupTask == null)
	                		{
	                			Log.info("DBBackupDelayTask() there is no running backup task for [" + curTime + "]");						
	                			return;
	                		}
	                		if(backupTask.stopFlag == true)
	                		{
	                			Log.info("DBBackupDelayTask() stop DelayTask:[" + curTime + "]");
	                			return;
	                		}	
	                        
	                        //将自己从任务备份任务表中删除
	                		dbBackupTaskHashMap.remove(createTime);	                        
	                        
	                        //开始备份数据库
	                		Date date = new Date();
	                		String backUpTime = DateFormat.dateTimeFormat2(date);
	                		String backUpPath = docSysIniPath + "backup/" + backUpTime + "/";
	                		boolean ret = backupDatabase(backUpPath, DB_TYPE, DB_URL, DB_USER, DB_PASS, true);
	                        if(ret == false)
	                        {
	                        	Log.info("******** DBBackupDelayTask [" + createTime + "] for DataBase 执行失败\n");		                        
	                        	//当前任务刚执行完，可能执行了一分钟不到，所以需要加上偏移时间
	                        	addDelayTaskForDBBackup(5, null);                      
	                        	//注意: 数据库自动备份失败就等待下一次备份，不重试
	                        	//Log.debug("******** DBBackupDelayTask start backup 5 minuts later\n");
		                        //addDelayTaskForDBBackup(5, 300L); //5分钟后强制开始备份                      	                        	                     	
	                        }
	                        else
	                        {
		                        Log.info("******** DBBackupDelayTask [" + createTime + "] for DataBase 执行成功\n");
	                        	//当前任务刚执行完，可能执行了一分钟不到，所以需要加上偏移时间
	                        	addDelayTaskForDBBackup(5, null);                      
	                        }
                        	Log.info("******** DBBackupDelayTask [" + createTime + "] for DataBase 执行结束\n");		                        
                        } catch(Exception e) {
                        	Log.info("******** DBBackupDelayTask [" + createTime + "] for DataBase 执行异常\n");
                        	Log.info(e);                        	
                        }
                        
                    }
                },
                delayTime,
                TimeUnit.SECONDS);
	}
	
	protected void addDelayTaskForReposSyncUp(Repos repos, int offsetMinute, Long forceStartDelay) {
		Long delayTime = getDelayTimeForNextReposSyncupTask(offsetMinute);
		if(delayTime == null)
		{
			Log.info("addDelayTaskForReposSyncUp delayTime is null");			
			return;
		}
		
		if(forceStartDelay != null)
		{
			Log.info("addDelayTaskForReposSyncUp forceStartDelay:" + forceStartDelay + " 秒后强制开始同步仓库 ["  + repos.getId() + " " + repos.getName() + "]");											
			delayTime = forceStartDelay; //1分钟后执行第一次备份
		}
		
		delayTime = delayTime + repos.getId() * 10; //根据仓库ID增加偏移时间，避免同时开始
		Log.info("addDelayTaskForReposSyncUp delayTime:" + delayTime + " 秒后开始同步仓库 ["  + repos.getId() + " " + repos.getName() + "]");		
		
		ConcurrentHashMap<Long, SyncupTask> syncupTaskHashMap = reposSyncupTaskHashMap.get(repos.getId());
		if(syncupTaskHashMap == null)
		{
			Log.info("addDelayTaskForReposSyncUp syncupTaskHashMap 未初始化");
			return;
		}
		
		long curTime = new Date().getTime();
        Log.debug("addDelayTaskForReposSyncUp() curTime:" + curTime);        
		
		//stopReposSyncupTasks
		//go through all syncupTask and close all task
		for (SyncupTask value : syncupTaskHashMap.values()) {
			Log.info("addDelayTaskForReposSyncUp() stop syncupTask:" + value.createTime);			
			value.stopFlag = true;
		}
		
		//startReposSyncupTask
		SyncupTask syncupTask = new SyncupTask();
		syncupTask.createTime = curTime;
		syncupTaskHashMap.put(curTime, syncupTask);

		ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);		
		executor.schedule(
        		new Runnable() {
        			long createTime = curTime;
        			int reposId = repos.getId();
                    @Override
                    public void run() {
                        try {
	                        Log.info("******** ReposSyncupDelayTask [" + createTime + "] for repos:" + reposId);
	                        
	                        //读取最新的仓库配置信息
	                		Repos latestReposInfo = getReposEx(reposId);

	                        ConcurrentHashMap<Long, SyncupTask> latestSyncupTask = reposSyncupTaskHashMap.get(reposId);
	                        if(latestSyncupTask == null)
	                        {
		                        Log.info("ReposSyncupDelayTask latestSyncupTask is null");	                        	
	                        	return;
	                        }
	
	                        if(isSyncupTaskNeedToStop(latestReposInfo, latestSyncupTask, createTime))
	                        {
	                			//移除备份任务	                        	
	                        	latestSyncupTask.remove(createTime);
		                        Log.info("ReposSyncupDelayTask [" + createTime + "] for repos:" + reposId + " 任务已取消");	                        	
	                			return;
	                        }
	                        	                        
	                        ReturnAjax rt = new ReturnAjax();
	                        
	        				//启动自动同步
	        				List<CommonAction> actionList = new ArrayList<CommonAction>();	//For AsyncActions
	        				String localRootPath = Path.getReposRealPath(latestReposInfo);
	        				String localVRootPath = Path.getReposVirtualPath(latestReposInfo);		
	        				Doc rootDoc = buildRootDoc(latestReposInfo, localRootPath, localVRootPath);

	        				if(redisEn)
        					{	
	        					//TODO: 检查任务是否已经正在被其他服务器执行或执行过了，如果已经被其他服务器添加过了则不需要添加
		        				String uniqueTaskId = "ReposAutoSyncupTask" + repos.getId();
	        					JSONObject uniqueTask = checkStartUniqueTaskRedis(uniqueTaskId);
		        				if(uniqueTask != null)
		        				{
		        					//执行仓库同步
		        					addDocToSyncUpList(actionList, latestReposInfo, rootDoc, Action.SYNCVerRepos, null, "定时自动同步", true);
		        					executeUniqueCommonActionList(actionList, rt);
			                              					
		        					stopUniqueTaskRedis(uniqueTaskId, uniqueTask);
		        				}
        					}
	        				else
	        				{
	        					addDocToSyncUpList(actionList, latestReposInfo, rootDoc, Action.SYNCVerRepos, null, "定时自动同步", true);
	        					executeUniqueCommonActionList(actionList, rt);	        					
	        				}
	        				
	                        //将自己从任务备份任务表中删除
	                        latestSyncupTask.remove(createTime);
	                        
	                        //当前任务刚执行完，可能执行了一分钟不到，所以需要加上偏移时间
	                        addDelayTaskForReposSyncUp(latestReposInfo, 5, null);         
                        	
                        	Log.info("******** ReposSyncupDelayTask [" + createTime + "] for repos:" + reposId + " 执行结束\n");		                        
                        } catch(Exception e) {
                        	Log.info("******** ReposSyncupDelayTask [" + createTime + "] for repos:" + reposId + " 执行异常\n");
                        	Log.info(e);
                        	
                        }
                        
                    }

                },
                delayTime,
                TimeUnit.SECONDS);
	}
	
	protected boolean isSyncupTaskNeedToStop(Repos latestReposInfo, ConcurrentHashMap<Long, SyncupTask> latestSyncupTask, long createTime) {
		if(latestReposInfo == null)
		{
			Log.debug("isSyncupTaskNeedToStop() latestReposInfo is null");			
			return true;
		}
		
		if(latestReposInfo.getVerCtrl() == null || latestReposInfo.getVerCtrl() == 0)
		{
			Log.debug("isSyncupTaskNeedToStop() VerCtrl is disabled for repos:" + latestReposInfo.getName());			
			return true;
		}
				
		if(latestSyncupTask == null)
		{
			Log.debug("isSyncupTaskNeedToStop() latestSyncupTask is null");			
			return true;			
		}
		
		SyncupTask syncupTask = latestSyncupTask.get(createTime);
		if(syncupTask == null)
		{
			Log.debug("isSyncupTaskNeedToStop() there is no running backup task for [" + createTime + "]");						
			return true;
		}
		
		if(syncupTask.stopFlag == true)
		{
			Log.debug("isSyncupTaskNeedToStop() stop DelayTask:[" + createTime + "]");
			return true;
		}	
		
		return false;
	}

	private Long getDelayTimeForNextReposSyncupTask(int offsetMinute) {
		//每天凌晨2:00同步
		BackupConfig backupConfig = new BackupConfig();
		backupConfig.backupTime = 120; //2:00
		
		backupConfig.weekDay1 = 1;
		backupConfig.weekDay2 = 1;
		backupConfig.weekDay3 = 1;
		backupConfig.weekDay4 = 1;
		backupConfig.weekDay5 = 1;
		backupConfig.weekDay6 = 1;
		backupConfig.weekDay7 = 1;
		return getDelayTimeForNextBackupTask(backupConfig, offsetMinute);
	}

	public BackupTask addDelayTaskForLocalBackup(Repos repos, BackupConfig localBackupConfig, int offsetMinute, Long forceStartDelay, boolean forceStart) {
		if(localBackupConfig == null)
		{
			return null;
		}
	
		Long delayTime = null;
		if(forceStartDelay != null)
		{
			Log.info("addDelayTaskForLocalBackup forceStartDelay:" + forceStartDelay + " 秒后强制开始备份仓库 ["  + repos.getId() + " " + repos.getName() + "]");											
			delayTime = forceStartDelay; //1分钟后执行第一次备份
		}
		else
		{
			delayTime = getDelayTimeForNextBackupTask(localBackupConfig, offsetMinute);
			if(delayTime == null)
			{
				Log.info("addDelayTaskForLocalBackup delayTime is null");			
				return null;
			}
		}
		
		Log.info("addDelayTaskForLocalBackup delayTime:" + delayTime + " 秒后开始备份仓库 ["  + repos.getId() + " " + repos.getName() + "]");											
				
		Channel channel = ChannelFactory.getByChannelName("businessChannel");
		if(channel == null)
	    {
			Log.info("addDelayTaskForLocalBackup 非商业版本不支持自动备份");
			return null;
	    }
		
		ConcurrentHashMap<String, BackupTask> backUpTaskHashMap = reposLocalBackupTaskHashMap.get(repos.getId());
		if(backUpTaskHashMap == null)
		{
			Log.info("addDelayTaskForLocalBackup backUpTaskHashMap 未初始化");
			return null;
		}
		        
        if(forceStart)
        {
        	stopReposBackUpTasks(repos, localBackupConfig, backUpTaskHashMap);
        }
        else
        {
        	if(isBackupTaskupTaskRunning(backUpTaskHashMap))
        	{
        		Log.info("addDelayTaskForLocalBackup() repos localBackupTask is running");
        		return null;
        	}
        }
        
		long curTime = new Date().getTime();
        Log.info("addDelayTaskForLocalBackup() curTime:" + curTime);
        BackupTask backupTask = startReposBackupTask(repos, localBackupConfig, backUpTaskHashMap, curTime);
        if(backupTask == null)
        {
    		Log.info("addDelayTaskForLocalBackup() failed to start localBackupTask");
        	return null;
        }
		
		ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
        
		executor.schedule(
        		new Runnable() {
        			String taskId = backupTask.id;
        			int reposId = repos.getId();
        			Repos reposInfo = repos;
                    @Override
                    public void run() {
                        try {
	                        Log.info("******** LocalBackupDelayTask [" + taskId + "] for repos:" + reposId);
	                        
	                		//线程中读取数据库有些时候会报错，因此直接只更新配置相关部分的内容
	                		Repos latestReposInfo = getReposEx(reposInfo);
	                        ReposBackupConfig latestBackupConfig = latestReposInfo.autoBackupConfig;
	                        if(latestBackupConfig == null)
	                        {
		                        Log.info("LocalBackupDelayTask latestBackupConfig is null");	                        	
	                        	return;
	                        }
	                        BackupConfig latestLocalBackupConfig = latestBackupConfig.localBackupConfig;     
	                        
	                        ConcurrentHashMap<String, BackupTask> latestBackupTaskHashMap = reposLocalBackupTaskHashMap.get(reposId);
	                        if(latestBackupTaskHashMap == null)
	                        {
		                        Log.info("LocalBackupDelayTask latestBackupTaskHashMap is null for repos:" + reposId);	                        	
	                        	return;
	                        }
	                        
	                        BackupTask lastestBackupTask = latestBackupTaskHashMap.get(taskId);
	                        if(lastestBackupTask == null)
	                        {
	                        	Log.info("LocalBackupDelayTask lastestBackupTask is null for task:" + taskId);	  
	                        	return;
	                        }

	                		if(lastestBackupTask.stopFlag == true)
	                		{
		                        Log.info("LocalBackupDelayTask [" + taskId + "] for repos:" + reposId + " 任务已取消");	                        	
	                			//移除备份任务	                        	
	                			latestBackupTaskHashMap.remove(taskId);
	                			return;
	                        }
	                        	                        
	                        ReturnAjax rt = new ReturnAjax();
	                        String localRootPath = Path.getReposRealPath(latestReposInfo);
	                        String localVRootPath = Path.getReposVirtualPath(latestReposInfo);
	                        
	                        //DocUtil在系统初始化时，似乎还不能被调用，但又不是每次都发生
	                        lastestBackupTask.status = 1; //backup is running
	                        lastestBackupTask.info = "本地自动备份中...";                      
	                        Doc rootDoc = buildRootDoc(latestReposInfo, localRootPath, localVRootPath);
        					
	                        //LockDoc
	                        DocLock docLock = null;
        					int lockType = DocLock.LOCK_TYPE_FORCE;
        			    	String lockInfo = "LocalBackupDelayTask() syncLock [" + rootDoc.getPath() + rootDoc.getName() + "] at repos[" + repos.getName() + "]";    	
        			    	docLock = lockDoc(rootDoc, lockType, 2*60*60*1000, systemUser,rt,true,lockInfo);	//lock 2 Hours 2*60*60*1000
        					if(docLock == null)
        					{
        						docSysDebugLog("LocalBackupDelayTask() Failed to lock Doc: " + rootDoc.getDocId(), rt);
        						rt.setError("LockDocFailed");
        					}
        					else
        					{
	        					
		        				if(redisEn)
	        					{	
		        					//TODO: 检查该任务是否已经正在被其他服务器执行或执行过了，如果已经被其他服务器添加过了则不需要添加
			        				String uniqueTaskId = "ReposLocalBackupTask" + repos.getId();
		        					
			        				JSONObject uniqueTask = checkStartUniqueTaskRedis(uniqueTaskId);
			        				if(uniqueTask != null)
			        				{
			        					//执行仓库本地备份
			        					channel.reposBackUp(latestLocalBackupConfig, latestReposInfo, rootDoc, systemUser, "本地定时备份", true, true, rt );
			        					stopUniqueTaskRedis(uniqueTaskId, uniqueTask);
			        				}
	        					}
		        				else
		        				{
		        					//执行仓库本地备份
		        					channel.reposBackUp(latestLocalBackupConfig, latestReposInfo, rootDoc, systemUser, "本地定时备份", true, true, rt );
		        				}
	        					unlockDoc(rootDoc, lockType,  systemUser);
        					}
        					
	                        //将自己从任务备份任务表中删除
	                        lastestBackupTask.stopFlag = true;
	                        if(rt.getStatus().equals("ok"))
	                        {
	                        	lastestBackupTask.status = 2;
	                        	lastestBackupTask.info = "本地备份成功";
	                        }
	                        else
	                        {
	                        	lastestBackupTask.status = 3;
	                        	lastestBackupTask.info = "本地备份失败:" + rt.getMsgInfo();
	                        }
	                        addDelayTaskForReposLocalBackupTaskDelete(lastestBackupTask, 600L); //10分钟后删除任务
	                        
	                        String msgInfo = (String) rt.getMsgInfo();
	                        if(msgInfo != null && msgInfo.equals("LockDocFailed"))  //TODO: 目前只考虑锁定失败的情况
	                        {
	                        	Log.info("******** LocalBackupDelayTask [" + taskId + "] for repos:" + reposId + " 执行失败\n");		                        
	                        	Log.info("******** LocalBackupDelayTask repos is busy, start backup 5 minuts later\n");
	                        	addDelayTaskForLocalBackup(latestReposInfo, latestLocalBackupConfig, 5, 300L, true); //5分钟后强制开始备份                      	                        	
	                        }
	                        else
	                        {
		                        Log.info("******** LocalBackupDelayTask [" + taskId + "] for repos:" + reposId + " 执行完成\n");
	                        	//当前任务刚执行完，可能执行了一分钟不到，所以需要加上偏移时间
	                        	addDelayTaskForLocalBackup(latestReposInfo, latestLocalBackupConfig, 5, null, true);                      
	                        }
                        	Log.info("******** LocalBackupDelayTask [" + taskId + "] for repos:" + reposId + " 执行结束\n");		                        
                        } catch(Exception e) {
                        	Log.info("******** LocalBackupDelayTask [" + taskId + "] for repos:" + reposId + " 执行异常\n");
                        	Log.info(e);
                        	
                        }
                        
                    }
                },
                delayTime,
                TimeUnit.SECONDS);
		
		return backupTask;
	}
		
	public BackupTask addDelayTaskForRemoteBackup(Repos repos, BackupConfig remoteBackupConfig, int offsetMinute, Long forceStartDelay, boolean forceStart) {
		if(remoteBackupConfig == null)
		{
			return null;
		}
		
		Long delayTime = getDelayTimeForNextBackupTask(remoteBackupConfig, offsetMinute);
		if(delayTime == null)
		{
			Log.info("addDelayTaskForRemoteBackup delayTime is null");			
			return null;
		}
		
		if(forceStartDelay != null)
		{
			Log.info("addDelayTaskForRemoteBackup forceStartDelay:" + forceStartDelay + " 秒后强制开始备份仓库 ["  + repos.getId() + " " + repos.getName() + "]");											
			delayTime = forceStartDelay; //1分钟后执行第一次备份

		}
		Log.info("addDelayTaskForRemoteBackup delayTime:" + delayTime + " 秒后开始备份仓库 ["  + repos.getId() + " " + repos.getName() + "]");											
		
		Channel channel = ChannelFactory.getByChannelName("businessChannel");
		if(channel == null)
	    {
			Log.info("addDelayTaskForRemoteBackup 非商业版本不支持自动备份");
			return null;
	    }
		
        ConcurrentHashMap<String, BackupTask> backupTaskHashMap = reposRemoteBackupTaskHashMap.get(repos.getId());
        if(backupTaskHashMap == null)
        {
        	return null;
        }
        
        if(forceStart)
        {
        	stopReposBackUpTasks(repos, remoteBackupConfig, backupTaskHashMap);
        }
        else
        {
        	if(isBackupTaskupTaskRunning(backupTaskHashMap))
        	{
        		Log.info("addDelayTaskForRemoteBackup() repos remoteBackupTask is running");
        		return null;
        	}
        }
		
		long curTime = new Date().getTime();
        Log.info("addDelayTaskForRemoteBackup() curTime:" + curTime);        
		
		ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
        BackupTask backupTask = startReposBackupTask(repos, remoteBackupConfig, backupTaskHashMap, curTime);
        if(backupTask == null)
        {
    		Log.info("addDelayTaskForLocalBackup() failed to start remoteBackupTask");
        	return null;
        }
        
		executor.schedule(
        		new Runnable() {
        			String taskId = backupTask.id;
        			int reposId = repos.getId();
        			Repos reposInfo = repos;
                    @Override
                    public void run() {                        
                        try {
                        	Log.info("******** RemoteBackupDelayTask [" + taskId + "] for repos:" + reposId);
                            
	                		//线程中读取从数据库读取有些时候会报错，因此直接只更新更新掉的部分
                        	Repos latestReposInfo = getReposEx(reposInfo);
	                        ReposBackupConfig latestBackupConfig = latestReposInfo.autoBackupConfig;
	                        if(latestBackupConfig == null)
	                        {
		                        Log.info("RemoteBackupDelayTask latestBackupConfig is null");	                        	
	                        	return;
	                        }
	                        BackupConfig latestRemoteBackupConfig = latestBackupConfig.remoteBackupConfig;
	                        
	                        ConcurrentHashMap<String, BackupTask> latestBackupTaskHashMap = reposRemoteBackupTaskHashMap.get(reposId);
	                        if(latestBackupTaskHashMap == null)
	                        {
		                        Log.info("RemoteBackupDelayTask latestBackupTaskHashMap is null");	                        	
	                        	return;
	                        }
	                        
	                        BackupTask lastestBackupTask = latestBackupTaskHashMap.get(taskId);
	                        if(lastestBackupTask == null)
	                        {
	                        	Log.info("RemoteBackupDelayTask lastestBackupTask is null for task:" + taskId);	  
	                        	return;
	                        }

	                		if(lastestBackupTask.stopFlag == true)
	                		{
		                        Log.info("RemoteBackupDelayTask [" + taskId + "] for repos:" + reposId + " 任务已取消");	                        	
	                			//移除备份任务	                        	
	                			latestBackupTaskHashMap.remove(taskId);
	                			return;
	                        }
	                        
	                        ReturnAjax rt = new ReturnAjax();
	                        String localRootPath = Path.getReposRealPath(latestReposInfo);
	                        String localVRootPath = Path.getReposVirtualPath(latestReposInfo);
	                        
	                        lastestBackupTask.status = 1;
	                        lastestBackupTask.info = "异地自动备份中...";                      
	                    	Doc rootDoc = buildRootDoc(latestReposInfo, localRootPath, localVRootPath);
	                        //LockDoc
	                        DocLock docLock = null;
        					int lockType = DocLock.LOCK_TYPE_FORCE;
        			    	String lockInfo = "RemoteBackupDelayTask() syncLock [" + rootDoc.getPath() + rootDoc.getName() + "] at repos[" + repos.getName() + "]";    	
        			    	docLock = lockDoc(rootDoc, lockType, 2*60*60*1000, systemUser,rt,true,lockInfo);	//lock 2 Hours 2*60*60*1000
        					if(docLock == null)
        					{
        						docSysDebugLog("RemoteBackupDelayTask() Failed to lock Doc: " + rootDoc.getDocId(), rt);
        						rt.setError("LockDocFailed");
        					}
        					else
        					{
		        				if(redisEn)
	        					{	
		        					//TODO: 检查任务是否已经正在被其他服务器执行或执行过了，如果已经被其他服务器添加过了则不需要添加
			        				String uniqueTaskId = "ReposRemoteBackupTask" + repos.getId();
		        					JSONObject uniqueTask = checkStartUniqueTaskRedis(uniqueTaskId);
			        				if(uniqueTask != null)
			        				{			        				
				        				channel.reposBackUp(latestRemoteBackupConfig, latestReposInfo, rootDoc, systemUser, "异地定时备份", true, true, rt );
				            			stopUniqueTaskRedis(uniqueTaskId, uniqueTask);
			        				}
	        					}
		        				else
		        				{
			                    	channel.reposBackUp(latestRemoteBackupConfig, latestReposInfo, rootDoc, systemUser, "异地定时备份", true, true, rt );
		        				}
		        				unlockDoc(rootDoc, lockType,  systemUser);
        					}
        					
	                        //将自己从任务备份任务表中删除
	                        lastestBackupTask.stopFlag = true;
	                        if(rt.getStatus().equals("ok"))
	                        {
	                        	lastestBackupTask.status = 2;
	                        	lastestBackupTask.info = "异地自动备份成功";
	                        }
	                        else
	                        {
	                        	lastestBackupTask.status = 3;
	                        	lastestBackupTask.info = "异地自动备份失败:" + rt.getMsgInfo();
	                        }
	                        addDelayTaskForReposRemoteBackupTaskDelete(lastestBackupTask, 600L); //10分钟后删除任务
	                        
	                        String msgInfo = (String) rt.getMsgInfo();
	                        if(msgInfo != null && msgInfo.equals("LockDocFailed")) //TODO: 目前只考虑锁定失败的情况
	                        {
	                        	Log.info("******** RemoteBackupDelayTask [" + taskId + "] for repos:" + reposId + " 执行失败\n");
		                        
	                        	Log.info("******** RemoteBackupDelayTask repos is busy, start backup 5 minuts later\n");
		                        addDelayTaskForRemoteBackup(latestReposInfo, latestRemoteBackupConfig, 5, 300L, true);                      
	                        }
	                        else
	                        {
	                            Log.info("******** RemoteBackupDelayTask [" + taskId + "] for repos:" + reposId + " 执行完成\n");
		                        //当前任务刚执行完，可能执行了一分钟不到，所以需要加上偏移时间
		                        addDelayTaskForRemoteBackup(latestReposInfo, latestRemoteBackupConfig, 5, null, true);                      
	                        }
                            Log.info("******** RemoteBackupDelayTask [" + taskId + "] for repos:" + reposId + " 执行结束\n");
                        } catch(Exception e) {
                        	Log.info("******** RemoteBackupDelayTask [" + taskId + "] for repos:" + reposId + " 执行异常\n");
                        	Log.info(e);
                        }
                    }
                },
                delayTime,
                TimeUnit.SECONDS);
		
		return backupTask;
	}
	
	public void addDelayTaskForReposLocalBackupTaskDelete(BackupTask task, Long deleteDelayTime) {
		if(deleteDelayTime == null)
		{
			Log.info("addDelayTaskForReposLocalBackupTaskDelete delayTime is null");			
			return;
		}
		Log.info("addDelayTaskForReposLocalBackupTaskDelete delayTime:" + deleteDelayTime + " 秒后开始删除！" );		
		
		long curTime = new Date().getTime();
        Log.info("addDelayTaskForReposLocalBackupTaskDelete() curTime:" + curTime);        
		
		ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
        executor.schedule(
        		new Runnable() {
        			String taskId = task.id;
        			Integer reposId = task.reposId;
                    @Override
                    public void run() {
                        try {
	                        Log.info("******** ReposLocalBackupTaskDeleteDelayTask *****");
	                        
	                        ConcurrentHashMap<String, BackupTask> latestBackupTaskHashMap = reposLocalBackupTaskHashMap.get(reposId);
	                        if(latestBackupTaskHashMap == null)
	                        {
		                        Log.info("ReposLocalBackupTaskDeleteDelayTask latestBackupTaskHashMap is null for repos:" + reposId);	                        	
	                        	return;
	                        }
	                		
	                        latestBackupTaskHashMap.remove(taskId);
	                		
	                		Log.info("******** ReposLocalBackupTaskDeleteDelayTask 本地自动备份任务 [" + taskId + "] 删除完成\n");		                        
                        } catch(Exception e) {
	                		Log.info("******** ReposLocalBackupTaskDeleteDelayTask 本地自动备份任务 [" + taskId + "] 删除异常\n");		                        
                        	Log.info(e);                        	
                        }
                        
                    }
                },
                deleteDelayTime,
                TimeUnit.SECONDS);
	}
	
	public void addDelayTaskForReposRemoteBackupTaskDelete(BackupTask task, Long deleteDelayTime) {
		if(deleteDelayTime == null)
		{
			Log.info("addDelayTaskForReposRemoteBackupTaskDelete delayTime is null");			
			return;
		}
		Log.info("addDelayTaskForReposRemoteBackupTaskDelete delayTime:" + deleteDelayTime + " 秒后开始删除！" );		
		
		long curTime = new Date().getTime();
        Log.info("addDelayTaskForReposRemoteBackupTaskDelete() curTime:" + curTime);        
		
		ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
        executor.schedule(
        		new Runnable() {
        			String taskId = task.id;
        			Integer reposId = task.reposId;
                    @Override
                    public void run() {
                        try {
	                        Log.info("******** ReposRemoteBackupTaskDeleteDelayTask *****");
	                        
	                        ConcurrentHashMap<String, BackupTask> latestBackupTaskHashMap = reposRemoteBackupTaskHashMap.get(reposId);
	                        if(latestBackupTaskHashMap == null)
	                        {
		                        Log.info("ReposRemoteBackupTaskDeleteDelayTask latestBackupTaskHashMap is null for repos:" + reposId);	                        	
	                        	return;
	                        }
	                		
	                        latestBackupTaskHashMap.remove(taskId);
	                		
	                		Log.info("******** ReposRemoteBackupTaskDeleteDelayTask 异地自动备份任务 [" + taskId + "] 删除完成\n");		                        
                        } catch(Exception e) {
	                		Log.info("******** ReposRemoteBackupTaskDeleteDelayTask 异地自动备份任务 [" + taskId + "] 删除异常\n");		                        
                        	Log.info(e);                        	
                        }
                        
                    }
                },
                deleteDelayTime,
                TimeUnit.SECONDS);
	}
	
	private BackupTask startReposBackupTask(Repos repos, BackupConfig backupConfig, ConcurrentHashMap<String, BackupTask> backUpTaskHashMap, long curTime) {
		if(backupConfig == null)
		{
			Log.debug("startReposBackupTask() backupConfig is null");			
			return null;
		}
		
		if(backUpTaskHashMap == null)
		{
			Log.debug("startReposBackupTask() backTaskHashMap is null");			
			return null;			
		}
		
		BackupTask backupTask = new BackupTask();
		backupTask.createTime = curTime;
		String taskId = repos.getId() + "-" + curTime;
		backupTask.id = taskId;
		backupTask.reposId = repos.getId();
		backupTask.status = 0;
		backupTask.info = "备份任务待启动";
		backUpTaskHashMap.put(taskId, backupTask);
		Log.debug("startReposBackupTask() start backupTask:" + backupTask.createTime + " taskId:" + taskId);			
		return backupTask;
	}
	
	private boolean stopReposBackUpTasks(Repos repos, BackupConfig backupConfig, ConcurrentHashMap<String, BackupTask> backUpTaskHashMap) {
		if(backupConfig == null)
		{
			Log.debug("stopReposBackUpTasks() backupConfig is null");			
			return false;
		}
		
		if(backUpTaskHashMap == null)
		{
			Log.debug("stopReposBackUpTasks() backTaskHashMap is null");			
			return false;			
		}
		
		//go through all backupTask and close all task
		for (BackupTask value : backUpTaskHashMap.values()) {
			Log.debug("stopReposBackUpTasks() stop backupTask:" + value.createTime);			
			value.stopFlag = true;
		}		
		return true;
	}
	
	private boolean isBackupTaskupTaskRunning(ConcurrentHashMap<String, BackupTask> backUpTaskHashMap) {
		//go through all backupTask
		for (BackupTask value : backUpTaskHashMap.values()) {
			if(value.stopFlag == false && value.status == 1)
			{
				return true;
			}
		}		
		return false;
	}


	protected boolean isBackUpTaskNeedToStop(Repos repos, BackupConfig backupConfig, ConcurrentHashMap<String, BackupTask> latestBackupTaskHashMap, String taskId) {
		if(backupConfig == null)
		{
			Log.debug("isBackUpTaskNeedToStop() backupConfig is null");			
			return true;
		}
		
		if(latestBackupTaskHashMap == null)
		{
			Log.debug("isBackUpTaskNeedToStop() backupTaskHashMap is null");			
			return true;			
		}
		
		BackupTask backupTask = latestBackupTaskHashMap.get(taskId);
		if(backupTask == null)
		{
			Log.debug("isBackUpTaskNeedToStop() there is no running backup task for [" + taskId + "]");						
			return true;
		}
		
		if(backupTask.stopFlag == true)
		{
			Log.debug("isBackUpTaskNeedToStop() stop DelayTask:[" + taskId + "]");
			return true;
		}	
		
		return false;
	}
	
	private Long getDelayTimeForNextDBBackupTask(int offsetMinute)
	{
		//每天凌晨1:40备份
		BackupConfig backupConfig = new BackupConfig();
		backupConfig.backupTime = 60; //1:00
		backupConfig.weekDay1 = 1;
		backupConfig.weekDay2 = 1;
		backupConfig.weekDay3 = 1;
		backupConfig.weekDay4 = 1;
		backupConfig.weekDay5 = 1;
		backupConfig.weekDay6 = 1;
		backupConfig.weekDay7 = 1;
		return getDelayTimeForNextBackupTask(backupConfig, offsetMinute);
	}
	
	private Long getDelayTimeForNextBackupTask(BackupConfig backupConfig, int offsetMinute) {
		//初始化weekDayBackupEnTab
		int weekDayBackupEnTab[] = new int[7];
		weekDayBackupEnTab[1] = backupConfig.weekDay1;
		weekDayBackupEnTab[2] = backupConfig.weekDay2;
		weekDayBackupEnTab[3] = backupConfig.weekDay3;
		weekDayBackupEnTab[4] = backupConfig.weekDay4;
		weekDayBackupEnTab[5] = backupConfig.weekDay5;
		weekDayBackupEnTab[6] = backupConfig.weekDay6;
		weekDayBackupEnTab[0] = backupConfig.weekDay7;
		
		Calendar calendar = Calendar.getInstance();
		int curHour = calendar.get(Calendar.HOUR_OF_DAY);
		int curMinute = calendar.get(Calendar.MINUTE);
		int curWeekDay = calendar.get(Calendar.DAY_OF_WEEK) - 1;
		int curMinuteOfDay = curHour*60 + curMinute;		
		Log.debug("getDelayTimeForNextBackupTask() curWeekDay:" + curWeekDay + " curHour:" + curHour + " curMinute:" + curMinute + 
				" curMinuteOfDay:" + curMinuteOfDay + " backupTime:" + backupConfig.backupTime);
		
		Long delayTime  = getNextBackupDelayTime(curWeekDay, curMinuteOfDay, offsetMinute, backupConfig.backupTime, weekDayBackupEnTab);
		return delayTime;
	}
	
	private Long getNextBackupDelayTime(int curWeekDay, int curMinuteOfDay, int offsetMinute, Integer backupMinuteOfDay, int[] weekDayBackupEnTab) 
	{
		//获取备份日期
		Integer backupWeekDay = getNextBackupWeekDay(curWeekDay, curMinuteOfDay + offsetMinute, backupMinuteOfDay, weekDayBackupEnTab);
		if(backupWeekDay == null)
		{
			Log.debug("getNextBackupDelayTime() 未找到备份任务");
			return null;	
		}
		
		Log.debug("getNextBackupDelayTime() backupWeekDay:" + backupWeekDay);
		Integer delayDays = 0;
		if(backupWeekDay < curWeekDay)
		{
			delayDays = 7 - (curWeekDay - backupWeekDay);			
		}
		else
		{
			delayDays = backupWeekDay - curWeekDay;
		}
		Log.debug("getNextBackupDelayTime() delayDays:" + delayDays);
		
		Long delayTime = null;
		//delayDays == 0 是一种特殊情况
		if(delayDays == 0)
		{
			if(backupMinuteOfDay > curMinuteOfDay)
			{
				delayTime = (long) ((backupMinuteOfDay - curMinuteOfDay) * 60);
			}
			else //I think there must be some mistake, push the task to next day
			{
				delayTime = (long) (24*60*60 + (backupMinuteOfDay - curMinuteOfDay) * 60);				
			}
		}
		
		delayTime = (long) (delayDays*24*60*60 + (backupMinuteOfDay - curMinuteOfDay) * 60);
		Log.debug("getNextBackupDelayTime() delayTime:" + delayTime);
		return delayTime;
	}

	private Integer getNextBackupWeekDay(int curWeekDay, int curMinuteOfDay, Integer backupMinuteOfDay, int[] weekDayBackupEnTab) {
		Integer backupWeekDay = null;
		
		//当前时间已经过了备份时间，从明天开始检查是否有备份任务
		int index = curWeekDay;
		if(curMinuteOfDay > backupMinuteOfDay)
		{
			index += 1;
		}
		Log.debug("getDelayTimeForNextBackupTask() index:" + index);		
		
		for(int i = 0; i < 7; i++)
		{
			if(weekDayBackupEnTab[index % 7] == 1)
			{
				Log.debug("getDelayTimeForNextBackupTask() weekDay:" + index % 7 + " backup enabled");
				backupWeekDay = index;
				Log.debug("getDelayTimeForNextBackupTask() backupWeekDay:" + backupWeekDay);
				break;
			}
			index++;
		}
		
		return backupWeekDay;
	}
	
	protected ReposData initReposData(Repos repos) {
		ReposData reposData = new ReposData();
		reposData.reposId = repos.getId();
		reposData.syncLockForSvnCommit = new Object();
		reposData.syncLockForGitCommit = new Object();
		
		reposDataHashMap.put(repos.getId(), reposData);
		return reposData;
	}
	
	protected ReposData getReposData(Repos repos) {
		ReposData reposData = reposDataHashMap.get(repos.getId());
		if(reposData != null)
		{
			if(redisEn)
			{
				reposData.isBusy = getReposIsBusyRedis(repos.getId());
			}
		}
		return reposData;
	}

	protected void collectDocSysInstallationInfo(String serverIP, HttpServletRequest request) 
	{
		String clientIP = IPUtil.getIpAddress(request);
		Date accessDate = new Date();
		
		JSONObject accessInfo = new JSONObject();
		accessInfo.put("serverIP", serverIP);
		accessInfo.put("clientIP", clientIP);
		accessInfo.put("TimeStamp", accessDate.getTime());
		accessInfo.put("Time", accessDate.toString());
		String accessInfoStr = "{" + JSON.toJSONStringWithDateFormat(accessInfo, "yyy-MM-dd HH:mm:ss") + "},\r\n";		
		String filePath = docSysIniPath + "access.log";
		FileUtil.appendContentToFile(filePath, accessInfoStr, "UTF-8");
	}
	
	private static void UserJDBCSettingUpgrade(String userJDBCSettingPath) 
	{
		Integer oldVersion = getVersionFromFile(docSysIniPath , "version");
		Log.debug("UserJDBCSettingUpgrade() oldVersion:" + oldVersion);
		if(oldVersion != null && oldVersion > 20147)
		{
			Log.debug("UserJDBCSettingUpgrade() oldVersion larger than 20147, no need upgrage userJDBCSetting");
			return;
		}
		
		//更新DBUrl
		String url = ReadProperties.getValue(userJDBCSettingPath, "db.url");
		String[] urlParts = url.split("\\?");
		if(urlParts == null || urlParts.length == 0)
		{
			return;
		}
		String baseUrl = urlParts[0];
		String newUrl = baseUrl + "?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC";
		Log.debug("UserJDBCSettingUpgrade() newUrl:" + newUrl);
		ReadProperties.setValue(userJDBCSettingPath, "db.url", newUrl);
		
		//更新DBDriver
		//ReadProperties.setValue(userJDBCSettingPath, "db.driver", "com.mysql.cj.jdbc.Driver");
	}

	//目前方案暂时不用自动创建管理员用户，但请勿删除
	protected static boolean checkAndAddFirstUser() {
		//获取用户列表
		List<Object> list = dbQuery(null, DOCSYS_USER, DB_TYPE, DB_URL, DB_USER, DB_PASS);
		if(list == null) //数据库异常
		{
			Log.debug("checkAndAddFirstUser() 异常");
			return false;
		}
		
		if(list.size() == 0)
		{
			//Add admin User
			User adminUser = buildAdminUser();
			dbInsert(adminUser, DOCSYS_USER, DB_TYPE, DB_URL, DB_USER, DB_PASS);
			if(dbQuery(null, DOCSYS_USER, DB_TYPE, DB_URL, DB_USER, DB_PASS) == null)
			{
				Log.debug("checkAndAddFirstUser() 新增用户失败");
				return false;
			}
		}
		return true;
	}

	private static String checkAndUpdateDB(boolean skipDocTab) {
		//根据里面的版本号信息更新数据库
		Integer newVersion = getVersionFromFile(docSysWebPath, "version");
		Log.debug("checkAndUpdateDB() newVersion:" + newVersion);
		if(newVersion == null)
		{
			Log.debug("checkAndUpdateDB() newVersion is null");
			return "ERROR_newVersionIsNull";
		}
		
		Integer oldVersion = getVersionFromFile(docSysIniPath , "version");
		Log.debug("checkAndUpdateDB() oldVersion:" + oldVersion);
		if(oldVersion == null)
		{
			Log.debug("checkAndUpdateDB() oldVersion is null, 默认为0");
			oldVersion = 0;
		}
		
		if(newVersion.equals(oldVersion))
		{
			Log.debug("checkAndUpdateDB() newVersion is same with oldVersion");
			return "ok";		
		}
		
		Log.debug("checkAndUpdateDB() from " + oldVersion + " to " + newVersion);		
		if(DBUpgrade(oldVersion, newVersion, DB_TYPE, DB_URL, DB_USER, DB_PASS, skipDocTab) == false)
		{
			Log.debug("checkAndUpdateDB() DBUpgrade failed!");					
			return "ERROR_DBUpgradeFailed";
		}
		Log.debug("checkAndUpdateDB() DBUpgrade done!");					
		
		//更新版本号，避免重复升级数据库
		FileUtil.copyFile(docSysWebPath + "version", docSysIniPath + "version", true);
		Log.debug("checkAndUpdateDB() updateVersion done!");					
		return "ok";
	}
	
    protected static boolean executeSqlScript(String filePath, String type, String url, String user, String pwd) 
    {
    	boolean ret = false;
    	Connection conn = null;
    	ScriptRunner runner = null;
    	InputStream in = null;
        Reader read = null;
    	
        try {
        	Class.forName(getJdbcDriverName(type));
        	conn = getDBConnection(type, url,user,pwd);
            runner = new ScriptRunner(conn);
			//runner.setAutoCommit(true);//自动提交
			//runner.setFullLineDelimiter(false);
			//runner.setDelimiter(";");////每条命令间的分隔符
			//runner.setSendFullScript(false);
			//runner.setStopOnError(false);
			//runner.setLogWriter(null);//设置是否输出日志

			// 从class目录下直接读取
			in = new FileInputStream(filePath);
			read = new InputStreamReader(in, "UTF-8"); //设置字符集,不然中文乱码插入错误

			runner.runScript(read);

			runner.closeConnection();
            Log.debug("sql脚本执行完毕");
            ret = true;
        } catch (Exception e) {
            Log.debug("sql脚本执行发生异常");
            Log.info(e);
        }finally{
	        // 关闭资源
	        try{
	            if(runner!=null) runner.closeConnection();
	            if(conn!=null) conn.close();
	            if(in!=null) in.close();
	            if(read!=null) read.close();
	        }catch(Exception se){
	            Log.info(se);
	        }
	    }
        
		return ret;
	}

	/**
	 * sqlite表结构初始化
	 * @param pwd 
	 * @param user 
	 * @param url 
	 * @param type 
	 * @param conn 数据库连接
	 * @return 
	 * @throws Exception e
	 */
	private static boolean initDBTables(String type, String url, String user, String pwd) {
    	boolean ret = false;
    	Connection conn = null;
    	ScriptRunner runner = null;
    	InputStream in = null;
        Reader read = null;
    	
        try {
        	Class.forName(getJdbcDriverName(type));
        	conn = getDBConnection(type, url,user,pwd);
            runner = new ScriptRunner(conn);
			//runner.setAutoCommit(true);//自动提交
			//runner.setFullLineDelimiter(false);
			//runner.setDelimiter(";");////每条命令间的分隔符
			//runner.setSendFullScript(false);
			//runner.setStopOnError(false);
			//runner.setLogWriter(null);//设置是否输出日志

			// 从class目录下直接读取
    		
    		Statement statement = conn.createStatement();
    		initDBTable("doc", statement, type);
    		initDBTable("doc_auth", statement, type);
    		initDBTable("doc_share", statement, type);
    		initDBTable("doc_lock", statement, type);
    		initDBTable("group_member", statement, type);
    		initDBTable("repos", statement, type);
    		initDBTable("repos_auth", statement, type);
    		initDBTable("role", statement, type);
    		initDBTable("sys_config", statement, type);
    		initDBTable("user", statement, type);
    		initDBTable("user_group", statement, type);
            ret = true;
        } catch (Exception e) {
            Log.debug("initDBTables 数据库表初始化发生异常");
            Log.info(e);
        }finally{
	        // 关闭资源
	        try{
	            if(runner!=null) runner.closeConnection();
	            if(conn!=null) conn.close();
	            if(in!=null) in.close();
	            if(read!=null) read.close();
	        }catch(Exception se){
	            Log.info(se);
	        }
	    }
        
		return ret;
	}
	
	private static void initDBTable(String tabName, Statement statement, String type) throws Exception {
		String sqlCmd = "";
		switch(tabName)
    	{
    	case "doc":
    		sqlCmd = "CREATE TABLE `doc` (\n";
			if(type.equals("sqlite"))
			{
	    		sqlCmd += "  `ID` integer primary key,\n";				
			}
			else
			{
	    		sqlCmd += "  `ID` integer primary key NOT NULL AUTO_INCREMENT,\n";
			}
			sqlCmd +=
			"  `NAME` varchar(300) DEFAULT NULL,\n" +
			"  `TYPE` int(10) DEFAULT NULL,\n" +
			"  `SIZE` bigint(20) NOT NULL DEFAULT '0',\n" +
			"  `CHECK_SUM` varchar(32) DEFAULT NULL,\n" +
			"  `REVISION` varchar(100) DEFAULT NULL,\n" +
			"  `CONTENT` varchar(10000) default null,\n" +
			"  `PATH` varchar(6000) NOT NULL DEFAULT '',\n" +
			"  `DOC_ID` bigint(20) DEFAULT NULL,\n" +
			"  `PID` bigint(20) NOT NULL DEFAULT '0',\n" +
			"  `VID` int(11) DEFAULT NULL,\n" +
			"  `PWD` varchar(20) DEFAULT NULL,\n" +
			"  `CREATOR` int(11) DEFAULT NULL,\n" +
			"  `CREATE_TIME` bigint(20) NOT NULL DEFAULT '0',\n" +
			"  `LATEST_EDITOR` int(11) DEFAULT NULL,\n" +
			"  `LATEST_EDIT_TIME` bigint(20) DEFAULT '0'\n" +
			")";
			if(type.equals("sqlite") == false)
			{
	    		sqlCmd += " ENGINE=InnoDB DEFAULT CHARSET=utf8";				
			}
    		//statement.execute("drop table if exists doc");
			statement.execute(sqlCmd);
    		break;
    	case "doc_auth":
    		sqlCmd = "CREATE TABLE `doc_auth` (\n";
    		if(type.equals("sqlite"))
			{
	    		sqlCmd += "  `ID` integer primary key,\n";				
			}
			else
			{
	    		sqlCmd += "  `ID` integer primary key NOT NULL AUTO_INCREMENT,\n";
			}
			sqlCmd +=
			"  `USER_ID` int(11) DEFAULT NULL,\n" +
			"  `GROUP_ID` int(11) DEFAULT NULL,\n" +
			"  `TYPE` int(1) DEFAULT NULL,\n" +
			"  `PRIORITY` int(1) NOT NULL DEFAULT '0',\n" +
			"  `DOC_ID` bigint(20) DEFAULT NULL,\n" +
			"  `REPOS_ID` int(11) NOT NULL DEFAULT '0',\n" +
			"  `IS_ADMIN` int(1) DEFAULT NULL,\n" +
			"  `ACCESS` int(1) NOT NULL DEFAULT '0',\n" +
			"  `EDIT_EN` int(1) DEFAULT NULL,\n" +
			"  `ADD_EN` int(1) DEFAULT NULL,\n" +
			"  `DELETE_EN` int(1) DEFAULT NULL,\n" +
			"  `DOWNLOAD_EN` int(1) DEFAULT NULL,\n" +
			"  `UPLOAD_SIZE` bigint(20) DEFAULT NULL,\n" +
			"  `HERITABLE` int(1) NOT NULL DEFAULT '0',\n" +
			"  `DOC_PATH` varchar(6000) DEFAULT NULL,\n" +
			"  `DOC_NAME` varchar(300) DEFAULT NULL\n" +
			")";
			if(type.equals("sqlite") == false)
			{
	    		sqlCmd += " ENGINE=InnoDB DEFAULT CHARSET=utf8";				
			}
					
    		//statement.execute("drop table if exists doc_auth");
    		statement.execute(sqlCmd);
    		break;
    	case "doc_share":	
    		sqlCmd = "CREATE TABLE `doc_share` (\n";
    		if(type.equals("sqlite"))
			{
	    		sqlCmd += "  `ID` integer primary key,\n";				
			}
			else
			{
	    		sqlCmd += "  `ID` integer primary key NOT NULL AUTO_INCREMENT,\n";
			}
			sqlCmd +=
			"  `SHARE_ID` int(11) NOT NULL,\n" +
			"  `NAME` varchar(300) DEFAULT NULL,\n" +
			"  `PATH` varchar(6000) NOT NULL DEFAULT '',\n" +
			"  `DOC_ID` bigint(20) DEFAULT NULL,\n" +
			"  `VID` int(11) DEFAULT NULL,\n" +
			"  `SHARE_AUTH` varchar(2000) DEFAULT NULL,\n" +
			"  `SHARE_PWD` varchar(20) DEFAULT NULL,\n" +
			"  `SHARED_BY` int(11) DEFAULT NULL,\n" +
			"  `EXPIRE_TIME` bigint(20) NOT NULL DEFAULT '0'\n" +
			")";
			if(type.equals("sqlite") == false)
			{
	    		sqlCmd += " ENGINE=InnoDB DEFAULT CHARSET=utf8";				
			}				
    		//statement.execute("drop table if exists doc_share");
    		statement.execute(sqlCmd);
    		break;
    	case "doc_lock":
    		sqlCmd = "CREATE TABLE `doc_lock` (\n";
    		if(type.equals("sqlite"))
			{
	    		sqlCmd += "  `ID` integer primary key,\n";				
			}
			else
			{
	    		sqlCmd += "  `ID` integer primary key NOT NULL AUTO_INCREMENT,\n";
			}
			sqlCmd +=    		
    		"  `TYPE` int(10) DEFAULT NULL,\n" +
			"  `NAME` varchar(300) DEFAULT NULL,\n" +
			"  `PATH` varchar(6000) NOT NULL DEFAULT '/',\n" +
			"  `DOC_ID` bigint(20) DEFAULT NULL,\n" +
			"  `PID` bigint(20) DEFAULT NULL,\n" +
			"  `VID` int(10) DEFAULT NULL,\n" +
			"  `STATE` int(1) NOT NULL DEFAULT '1',\n" +
			"  `LOCKER` varchar(200) DEFAULT NULL,\n" +
			"  `LOCK_BY` int(11) DEFAULT NULL,\n" +
			"  `LOCK_TIME` bigint(20) NOT NULL DEFAULT '0'\n" +
			")";
			if(type.equals("sqlite") == false)
			{
	    		sqlCmd += " ENGINE=InnoDB DEFAULT CHARSET=utf8";				
			}
    		//statement.execute("drop table if exists doc_lock");
    		statement.execute(sqlCmd);
    		break;
    	case "group_member":
    		sqlCmd = "CREATE TABLE `group_member` (\n";
    		if(type.equals("sqlite"))
			{
	    		sqlCmd += "  `ID` integer primary key,\n";				
			}
			else
			{
	    		sqlCmd += "  `ID` integer primary key NOT NULL AUTO_INCREMENT,\n";
			}
			sqlCmd +=
    		"  `GROUP_ID` int(11) DEFAULT NULL,\n" +
			"  `USER_ID` int(11) DEFAULT NULL\n" +
			")";
			if(type.equals("sqlite") == false)
			{
	    		sqlCmd += " ENGINE=InnoDB DEFAULT CHARSET=utf8";				
			}
    		//statement.execute("drop table if exists group_member");
    		statement.execute(sqlCmd);
    		break;
    	case "repos":
    		sqlCmd = "CREATE TABLE `repos` (\n";
    		if(type.equals("sqlite"))
			{
	    		sqlCmd += "  `ID` integer primary key,\n";				
			}
			else
			{
	    		sqlCmd += "  `ID` integer primary key NOT NULL AUTO_INCREMENT,\n";
			}
			sqlCmd +=
			"  `NAME` varchar(255) DEFAULT NULL,\n" +
			"  `TYPE` int(10) DEFAULT '1',\n" +
			"  `PATH` varchar(2000) NOT NULL DEFAULT 'D:/DocSysReposes',\n" +
			"  `REAL_DOC_PATH` varchar(2000) DEFAULT NULL,\n" +
			"  `REMOTE_STORAGE` varchar(5000) DEFAULT NULL,\n" +
			"  `VER_CTRL` int(2) NOT NULL DEFAULT '0',\n" +
			"  `IS_REMOTE` int(1) NOT NULL DEFAULT '1',\n" +
			"  `LOCAL_SVN_PATH` varchar(2000) DEFAULT NULL,\n" +
			"  `SVN_PATH` varchar(2000) DEFAULT NULL,\n" +
			"  `SVN_USER` varchar(50) DEFAULT NULL,\n" +
			"  `SVN_PWD` varchar(20) DEFAULT NULL,\n" +
			"  `REVISION` varchar(100) DEFAULT NULL,\n" +
			"  `VER_CTRL1` int(2) NOT NULL DEFAULT '0',\n" +
			"  `IS_REMOTE1` int(1) NOT NULL DEFAULT '1',\n" +
			"  `LOCAL_SVN_PATH1` varchar(2000) DEFAULT NULL,\n" +
			"  `SVN_PATH1` varchar(2000) DEFAULT NULL,\n" +
			"  `SVN_USER1` varchar(50) DEFAULT NULL,\n" +
			"  `SVN_PWD1` varchar(20) DEFAULT NULL,\n" +
			"  `REVISION1` varchar(100) DEFAULT NULL,\n" +
			"  `INFO` varchar(1000) DEFAULT NULL,\n" +
			"  `PWD` varchar(20) DEFAULT NULL,\n" +
			"  `OWNER` int(11) DEFAULT NULL,\n" +
			"  `CREATE_TIME` bigint(20) DEFAULT '0',\n" +
			"  `STATE` int(1) NOT NULL DEFAULT '0',\n" +
			"  `LOCK_BY` int(11) DEFAULT NULL,\n" +
			"  `LOCK_TIME` bigint(20) NOT NULL DEFAULT '0'\n" +
			")";
			if(type.equals("sqlite") == false)
			{
	    		sqlCmd += " ENGINE=InnoDB DEFAULT CHARSET=utf8";				
			}
    		//statement.execute("drop table if exists repos");
    		statement.execute(sqlCmd);
    		break;
    	case "repos_auth":
    		sqlCmd = "CREATE TABLE `repos_auth` (\n";
    		if(type.equals("sqlite"))
			{
	    		sqlCmd += "  `ID` integer primary key,\n";				
			}
			else
			{
	    		sqlCmd += "  `ID` integer primary key NOT NULL AUTO_INCREMENT,\n";
			}
			sqlCmd +=
			"  `USER_ID` int(11) DEFAULT NULL,\n" +
			"  `GROUP_ID` int(11) DEFAULT NULL,\n" +
			"  `TYPE` int(1) DEFAULT '0',\n" +
			"  `PRIORITY` int(1) DEFAULT '0',\n" +
			"  `REPOS_ID` int(11) DEFAULT NULL,\n" +
			"  `IS_ADMIN` int(1) DEFAULT NULL,\n" +
			"  `ACCESS` int(1) DEFAULT NULL,\n" +
			"  `EDIT_EN` int(1) DEFAULT NULL,\n" +
			"  `ADD_EN` int(1) DEFAULT NULL,\n" +
			"  `DELETE_EN` int(1) DEFAULT NULL,\n" +
			"  `DOWNLOAD_EN` int(1) DEFAULT NULL,\n" +
			"  `UPLOAD_SIZE` bigint(20) DEFAULT NULL,\n" +
			"  `HERITABLE` int(1) NOT NULL DEFAULT '0'\n" +
			")";
			if(type.equals("sqlite") == false)
			{
	    		sqlCmd += " ENGINE=InnoDB DEFAULT CHARSET=utf8";				
			}
			//statement.execute("drop table if exists repos_auth");
    		statement.execute(sqlCmd);
    		break;
    	case "role":
    		sqlCmd = "CREATE TABLE `role` (\n";
    		if(type.equals("sqlite"))
			{
	    		sqlCmd += "  `ID` integer primary key,\n";				
			}
			else
			{
	    		sqlCmd += "  `ID` integer primary key NOT NULL AUTO_INCREMENT,\n";
			}
			sqlCmd +=
		    "  `NAME` varchar(50) NOT NULL,\n" +
		    "  `ROLE_ID` int(11) NOT NULL\n" +
			")";
			if(type.equals("sqlite") == false)
			{
	    		sqlCmd += " ENGINE=InnoDB DEFAULT CHARSET=utf8";				
			}				
    		//statement.execute("drop table if exists role;");
    		statement.execute(sqlCmd);
    		break;
    	case "sys_config":
    		sqlCmd = "CREATE TABLE `sys_config` (\n";
    		if(type.equals("sqlite"))
			{
	    		sqlCmd += "  `ID` integer primary key,\n";				
			}
			else
			{
	    		sqlCmd += "  `ID` integer primary key NOT NULL AUTO_INCREMENT,\n";
			}
			sqlCmd +=
			"  `REG_ENABLE` int(2) NOT NULL DEFAULT '1',\n" +
			"  `PRIVATE_REPOS_ENABLE` int(2) NOT NULL DEFAULT '1'\n" +
			")";
			if(type.equals("sqlite") == false)
			{
	    		sqlCmd += " ENGINE=InnoDB DEFAULT CHARSET=utf8";				
			}
			//statement.execute("drop table if exists sys_config");
    		statement.execute(sqlCmd);
    		break;
    	case "user":
    		sqlCmd = "CREATE TABLE `user` (\n";
    		if(type.equals("sqlite"))
			{
	    		sqlCmd += "  `ID` integer primary key,\n";				
			}
			else
			{
	    		sqlCmd += "  `ID` integer primary key NOT NULL AUTO_INCREMENT,\n";
			}
			sqlCmd +=    				
			"    NAME            VARCHAR (40)  DEFAULT NULL,\n" +
			"    PWD             VARCHAR (40)  NOT NULL,\n" +
			"    TYPE            INT (1)       NOT NULL\n" +
			"                                  DEFAULT '0',\n" +
			"    ROLE            INT (11)      DEFAULT NULL,\n" +
			"    REAL_NAME       VARCHAR (50)  DEFAULT NULL,\n" +
			"    NICK_NAME       VARCHAR (50)  DEFAULT NULL,\n" +
			"    INTRO           VARCHAR (10000) DEFAULT NULL,\n" +
			"    IMG             VARCHAR (200) DEFAULT NULL,\n" +
			"    EMAIL           VARCHAR (50)  DEFAULT '',\n" +
			"    EMAIL_VALID     INT (1)       NOT NULL\n" +
			"                                  DEFAULT '0',\n" +
			"    TEL             VARCHAR (20)  DEFAULT NULL,\n" +
			"    TEL_VALID       INT (1)       NOT NULL\n" +
			"                                  DEFAULT '0',\n" +
			"    LAST_LOGIN_TIME VARCHAR (50)  DEFAULT NULL,\n" +
			"    LAST_LOGIN_IP   VARCHAR (50)  DEFAULT NULL,\n" +
			"    LAST_LOGIN_CITY VARCHAR (100) DEFAULT NULL,\n" +
			"    CREATE_TYPE     INT (1)       NOT NULL\n" +
			"                                  DEFAULT '0',\n" +
			"    CREATE_TIME     VARCHAR (50)  DEFAULT NULL\n" +
			")";
			if(type.equals("sqlite") == false)
			{
	    		sqlCmd += " ENGINE=InnoDB DEFAULT CHARSET=utf8";				
			}
    		//statement.execute("drop table if exists user");
    		statement.execute(sqlCmd);
    		break;
    	case "user_group":
    		sqlCmd = "CREATE TABLE `user_group` (\n";
    		if(type.equals("sqlite"))
			{
	    		sqlCmd += "  `ID` integer primary key,\n";				
			}
			else
			{
	    		sqlCmd += "  `ID` integer primary key NOT NULL AUTO_INCREMENT,\n";
			}
			sqlCmd +=    
			"  `NAME` varchar(200) DEFAULT NULL,\n" +
			"  `TYPE` int(1) DEFAULT NULL,\n" +
			"  `INFO` varchar(1000) DEFAULT NULL,\n" +
			"  `IMG` varchar(200) DEFAULT NULL,\n" +
			"  `PRIORITY` int(2) DEFAULT NULL,\n" +
			"  `CREATE_TIME` varchar(50) DEFAULT NULL\n" +
			")";
			if(type.equals("sqlite") == false)
			{
	    		sqlCmd += " ENGINE=InnoDB DEFAULT CHARSET=utf8";				
			}
			//statement.execute("drop table if exists user_group");
    		statement.execute(sqlCmd);
    		break;
    	}
	}
	
	protected static boolean createDB(String dbType, String dbName,String url, String user, String pwd) 
    {
        try {
			Class.forName(getJdbcDriverName(dbType));
		} catch (ClassNotFoundException e) {
			Log.info(e);
			return false;
		}
        
        switch(dbType)
        {
        case "mysql":
        	return createDBForMysql(dbType, dbName, url, user, pwd);
        case "sqlite":
        	return createDBForSqlite(dbType, dbName, url, user, pwd);
        }
        return false;
	}
	
	private static boolean createDBForSqlite(String dbType, String dbName, String url, String user, String pwd) {
		
		String dbPath = getDbPathFromUrl(url);
		File dbFile = new File(dbPath, dbName);
		if(dbFile.exists())
		{
			return true;
		}
		return FileUtil.createFile(dbPath, dbName);
	}

	private static String getAbsoluteSqliteUrl(String jdbcUrl) {
		String dbPath = getDbPathFromUrl(jdbcUrl);
		String dbName = getDBNameFromUrl("sqlite", jdbcUrl);
		String absSqliteUrl = "jdbc:sqlite:"+ dbPath + dbName;
		Log.debug("getAbsoluteSqliteUrl absSqliteUrl:" + absSqliteUrl);
		return absSqliteUrl;
	}
	
	private static String getDbPathFromUrl(String url) {
		Log.debug("getDbPathFromUrl url:" + url);
		String[] urlParts = url.split(":");
		if(urlParts == null || urlParts.length == 0)
		{
			return null;
		}
		
		String prefix = "";
		if(urlParts.length > 2)
		{
			prefix = urlParts[2];
		}
		
		String rootPath = "";
		if(prefix.equals("classpath") || (prefix.equals("resource")))
		{
			rootPath = docSysWebPath;
		}
		else if(OS.isWinDiskChar(prefix))
		{
			rootPath = prefix + ":/";
		}

		String dbFilePath = urlParts[urlParts.length-1];
		Log.debug("getDbPathFromUrl dbFilePath:" + dbFilePath);
		
		String[] subStrs = dbFilePath.split("/");
		String relativePath = "";
		//Log.debug("getDbPathFromUrl subStrs[0]:" + subStrs[0]);
		boolean firstFlag = true;	
		for(int i=0; i< subStrs.length-1; i++)
		{	
			Log.debug("getDbPathFromUrl subStrs[" + i + "]: " + subStrs[i]);
			if(subStrs[i].isEmpty())
			{
				continue;
			}
			
			if(firstFlag)
			{
				firstFlag = false;
				if(subStrs[i].equals("${catalina.home}"))
				{
					relativePath = System.getProperty("catalina.home");
					relativePath = relativePath.replace('\\','/') + "/";
				}
				else
				{
					relativePath = subStrs[i] + "/";
				}
			}	
			else
			{
				relativePath = relativePath + subStrs[i] + "/";
			}
		}
		
		
		String dbPath = rootPath + relativePath;
		Log.debug("getDbPathFromUrl dbPath:" + dbPath);		
		return dbPath;
	}

	private static boolean createDBForMysql(String dbType, String dbName, String url, String user, String pwd) {
        String defaultDBUrl = getDefaultDBUrl(dbType, dbName, url, user, pwd);
        
		boolean ret = false;
		Connection conn = null;
        Statement stmt = null;
        try{        
            conn = getDBConnection(dbType, defaultDBUrl,user,pwd);        
            stmt = (Statement) conn.createStatement();
            String checkdatabase="show databases like \"" + dbName+ "\""; //判断数据库是否存在
	    	String createdatabase="create  database  " + dbName;	//创建数据库     
	    	ResultSet resultSet = stmt.executeQuery(checkdatabase);
	    	if (resultSet.next()) 
	    	{
	    		//若数据库存在
	    		Log.debug("createDB " + dbName + " exist!");
	    		stmt.close();
	    		conn.close();
	    		return true;
	    	}

	    	if(stmt.executeUpdate(createdatabase) != 0)		 
	    	{
	    		Log.debug("create table success!");
	    		stmt.close();
	    		conn.close();
	    		return true;
	    	}   
	    	
            // 完成后关闭
            stmt.close();
            conn.close();
        }catch(SQLException se){
            // 处理 JDBC 错误
            Log.info(se);
        }catch(Exception e){
            // 处理 Class.forName 错误
            Log.info(e);
        }finally{
            // 关闭资源
            try{
                if(stmt!=null) stmt.close();
            }catch(SQLException se2){
            }// 什么都不做
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                Log.info(se);
            }
        }
		return ret;
	}

	private static String getDefaultDBUrl(String dbType, String dbName, String url, String user, String pwd) {
		switch(dbType)
		{
		case "mysql":
			String defaultDBUrl = url.replace(dbName, "test");
			if(testDB(dbType, defaultDBUrl, user, pwd) == false)
			{
			    defaultDBUrl = url.replace(dbName, "sys");
			    if(testDB(dbType, defaultDBUrl, user, pwd) == false)
			    {
			    	defaultDBUrl = url.replace(dbName, "mysql");
			    }
			}
			return defaultDBUrl;
		case "sqlite":
			return "jdbc:sqlite::resource:data/sql.db";
		}
		return null;
	}

	protected static boolean deleteDB(String dbType, String dbName, String url, String user, String pwd) 
    {
        try {
			Class.forName(getJdbcDriverName(dbType));
		} catch (ClassNotFoundException e) {
			Log.info(e);
			return false;
		}
        
        switch(dbType)
        {
        case "mysql":
        	return deleteDBForMysql(dbType, dbName, url, user, pwd);
        case "sqlite":
        	return deleteDBForSqlite(dbType, dbName, url, user, pwd);
        }
        return false;
	}


	private static boolean deleteDBForSqlite(String dbType, String dbName, String url, String user, String pwd) {
		String dbPath = getDbPathFromUrl(url);
		File dbFile = new File(dbPath, dbName);
		if(!dbFile.exists())
		{
			return true;
		}
		
		return FileUtil.delFile(dbPath + "/" + dbName);
	}

	private static boolean deleteDBForMysql(String dbType, String dbName, String url, String user, String pwd) {
        String defaultDBUrl = getDefaultDBUrl(dbType, dbName, url, user, pwd);
        
		boolean ret = false;
		Connection conn = null;
        Statement stmt = null;
        try{        
            //利用系统默认的数据库进行删除操作
            conn = getDBConnection(dbType, defaultDBUrl ,user, pwd);
        
            stmt = (Statement) conn.createStatement();
            String checkdatabase="show databases like \"" + dbName+ "\""; //判断数据库是否存在
	    	String deletedatabase="drop  database  " + dbName;	//创建数据库     
	    	ResultSet resultSet = stmt.executeQuery(checkdatabase);
	    	if (resultSet.next()) 
	    	{
	    		//若数据库存在
	    		Log.debug("deleteDB " + dbName + " exist!");
		    	if(stmt.executeUpdate(deletedatabase) != 0)		 
		    	{
		    		Log.debug("delete table success!");
		    		ret = true;
		    	}   
	    		stmt.close();
	    		conn.close();
	    	}
	    	else
	    	{
	    		Log.debug("deleteDB " + dbName + " not exist!");
	    		ret = true;
	    	}
	    	// 完成后关闭
            stmt.close();
            conn.close();
        }catch(SQLException se){
            // 处理 JDBC 错误
            Log.info(se);
        }catch(Exception e){
            // 处理 Class.forName 错误
            Log.info(e);
        }finally{
            // 关闭资源
            try{
                if(stmt!=null) stmt.close();
            }catch(SQLException se2){
            }// 什么都不做
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                Log.info(se);
            }
        }
		return ret;
	}

	protected static String getDBNameFromUrl(String type, String url) 
	{
		if(type == null)
		{
			type = "mysql";
		}
		
		String[] urlParts = null;
		String[] subStrs = null;

		switch(type)
		{
		case "mysql":
			urlParts = url.split("\\?");
			if(urlParts == null || urlParts.length == 0)
			{
				return null;
			}
			
			String baseUrl = urlParts[0];
			subStrs = baseUrl.split("/");
			if(subStrs == null || subStrs.length < 2)
			{
				return null;
			}
			
			return subStrs[subStrs.length-1];
		case "sqlite":
			urlParts = url.split(":");
			if(urlParts == null || urlParts.length == 0)
			{
				return null;
			}
			
			
			String dbPath = urlParts[urlParts.length-1];
			subStrs = dbPath.split("/");
			return subStrs[subStrs.length-1];
		}
		return null;
	}

	public static boolean testDB(String type, String url, String user, String pwd)
    {
		if(type == null)
		{
			type = "mysql";
		}
		
		switch(type)
		{
		case "mysql":
			return testDBStandard(type, url, user, pwd);
		case "sqlite":
			return testDBForSqlite(type, url, user, pwd);
		}
		return false;
    }	
	
	private static boolean testDBForSqlite(String type, String url, String user, String pwd) {
		String dbPath = getDbPathFromUrl(url);
		String dbName = getDBNameFromUrl(type, url);
		File dbFile = new File(dbPath, dbName);
		if(dbFile.exists() && dbFile.length() > 0)
		{
			return testDBStandard(type, url, user, pwd);
		}
		return false;
	}

	public static boolean testDBStandard(String type, String url, String user, String pwd)
	{
        Connection conn = null;
        try {
			Class.forName(getJdbcDriverName(type));
			
		} catch (ClassNotFoundException e) {
			Log.info(e);
			return false;
		}
    
        // 打开链接
        boolean ret = false;
        Log.debug("连接数据库...");
        try {
			conn = getDBConnection(type, url, user, pwd);
			if(conn != null)
			{
				Log.debug("连接数据库成功");
				ret = true;
			}
		} catch (Exception e) {
			Log.debug("连接数据库失败");
			Log.info(e);
		} finally{
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                Log.info(se);
            }
        }
        return ret;        
    }

	private static Connection getDBConnection(String type, String url, String user, String pwd) {
		String dbUrl = url;
		if(type != null && type.equals("sqlite"))
		{
			dbUrl = getAbsoluteSqliteUrl(url);
		}
		Log.debug("getDBConnection() dbUrl:" + dbUrl);

		
		try {
			return DriverManager.getConnection(dbUrl, user, pwd);
		} catch (SQLException e) {
			Log.info(e);
		}
		return null;
	}

	protected static String getJdbcDriverName(String type) {
		if(type == null)
		{
			return "org.sqlite.JDBC"; //默认用sqlite
		}
		switch(type)
		{
		case "sqlite":
			return "org.sqlite.JDBC";
		case "mysql":
			return "com.mysql.cj.jdbc.Driver";
		}
		
		return JDBC_DRIVER;
	}

	private static boolean getAndSetDBInfoFromFile(String JDBCSettingPath) {
		Log.debug("getAndSetDBInfoFromFile " + JDBCSettingPath );
		
		String dbType = ReadProperties.getValue(JDBCSettingPath, "db.type");
		if(dbType == null || "".equals(dbType))
		{
			dbType = "mysql";
		}
		DB_TYPE = dbType;
		JDBC_DRIVER = getJdbcDriverName(dbType);
		
		String jdbcUrl = ReadProperties.getValue(JDBCSettingPath, "db.url");
		if(jdbcUrl == null || "".equals(jdbcUrl))
		{
			return false;
		}
		DB_URL = jdbcUrl;
		
		String jdbcUser = ReadProperties.getValue(JDBCSettingPath, "db.username");
		if(jdbcUser != null)
		{
			DB_USER = jdbcUser;
		}
		
		String jdbcPwd = ReadProperties.getValue(JDBCSettingPath, "db.password");
		if(jdbcPwd != null)
		{
			DB_PASS = jdbcPwd;
		}
		Log.debug("getAndSetDBInfoFromFile JDBC_DRIVER:" + JDBC_DRIVER + " DB_TYPE:" + DB_TYPE + " DB_URL:" + DB_URL + " DB_USER:" + DB_USER + " DB_PASS:" + DB_PASS);
		return true;
	}

	protected static Integer getVersionFromFile(String path, String name) 
	{
		Log.debug("getVersionFromFile() file:" + path + name);

		String versionStr = FileUtil.readDocContentFromFile(path, name, "UTF-8");
		Log.debug("getVersionFromFile() versionStr:" + versionStr);

		if(versionStr == null || versionStr.isEmpty())
		{
			return null;
		}
		
		versionStr = versionStr.trim();
		
		int version = 0;
		String [] versions = versionStr.split("\\."); //.需要转义
		//Log.debug("getVersionFromFile() versions.length:" + versions.length); 
		
		for(int i=0; i<versions.length; i++)
		{
			//xx.xx.xx超过3级的忽略
			if(i > 2)
			{
				break;
			}
			
			String tmp = versions[i];
			//Log.debug("getVersionFromFile() tmp:" + tmp);

			if(tmp.isEmpty())
			{
				//非法版本号
				return null;
			}
			
			int tmpVersion = Integer.parseInt(tmp);
			//Log.debug("getVersionFromFile() tmpVersion:" + tmpVersion);
			if(tmpVersion > 99)
			{
				//非法版本号
				return null;
			}
			
			if(i == 0)
			{
				tmpVersion = tmpVersion*10000;
			}
			else if(i == 1)
			{
				tmpVersion = tmpVersion*100;				
			}
			//Log.debug("getVersionFromFile() tmpVersion:" + tmpVersion);
			
			version += tmpVersion;
		}
		
		Log.debug("getVersionFromFile() version:" + version);
		return version;
	}

	protected static boolean DBUpgrade(Integer oldVersion, Integer newVersion, String type, String url, String user, String pwd, boolean skipDocTab)
	{
		Log.debug("DBUpgrade() from " + oldVersion + " to " + newVersion);
		List<Integer> dbTabsNeedToUpgrade = getDBTabListForUpgarde(oldVersion, newVersion);
		if(dbTabsNeedToUpgrade == null || dbTabsNeedToUpgrade.size() == 0)
		{
			Log.debug("DBUpgrade() no DB Table need to upgrade from " + oldVersion + " to " + newVersion);
			return true;
		}
		
		//backupDB
		Date date = new Date();
		String backUpTime = DateFormat.dateTimeFormat2(date);
		String backUpPath = docSysIniPath + "backup/" + backUpTime + "/";
		if(backupDatabase(backUpPath, type, url, user, pwd, skipDocTab) == false)
		{
			Log.debug("DBUpgrade() 数据库备份失败!");
			return true;
		}
		
		//更新数据库表结构
		for(int i=0; i< dbTabsNeedToUpgrade.size(); i++)
		{
			int dbTabId = dbTabsNeedToUpgrade.get(i);
			String dbTabName = getNameByObjType(dbTabId);			
			resetDBTable(dbTabName, type, url, user, pwd);
		}
		
		//导入数据
		importDatabaseFromJsonFile(dbTabsNeedToUpgrade, backUpPath, "docsystem_data.json", type, url, user, pwd);
		return true;
	}
	
	private static boolean resetDBTable(String dbTabName, String type, String url, String user, String pwd) {
    	boolean ret = false;
    	Connection conn = null;
    	ScriptRunner runner = null;
    	InputStream in = null;
        Reader read = null;
    	
        try {
        	Class.forName(getJdbcDriverName(type));
        	conn = getDBConnection(type, url,user,pwd);
            runner = new ScriptRunner(conn);
	    		
    		
            Statement statement = conn.createStatement();
    		//delete db tab
            statement.execute("drop table if exists " + dbTabName);
    		//init db tab
            initDBTable(dbTabName, statement, type);
    	    ret = true;
        } catch (Exception e) {
            Log.debug("initDBTables 数据库表初始化发生异常");
            Log.info(e);
        }finally{
	        // 关闭资源
	        try{
	            if(runner!=null) runner.closeConnection();
	            if(conn!=null) conn.close();
	            if(in!=null) in.close();
	            if(read!=null) read.close();
	        }catch(Exception se){
	            Log.info(se);
	        }
	    }
        
		return ret;
	}

	public static void resetDBTableWithSqlFile(String dbTabName, String type, String url, String user, String pwd) {
		//更新数据库表结构
		//check if init script exists
		String dbTabInitSqlScriptName = "docsystem_" + dbTabName.toUpperCase() + ".sql";
		String sqlScriptPath = docSysWebPath + "WEB-INF/classes/config/" + dbTabInitSqlScriptName;
		if(FileUtil.isFileExist(sqlScriptPath) == false)
		{
			Log.debug("DBUpgrade() sqlScriptPath:" + sqlScriptPath + " 不存在");
			return;
		}
		//delete tab
		deleteDBTab(dbTabName, type, url, user, pwd);
		//init tab
		executeSqlScript(sqlScriptPath, type, url, user, pwd);
	}

	private static List<Integer> buildBackUpTabList(boolean skipDocTab) {
		List<Integer> tabList = new ArrayList<Integer>();
		for(int i=0; i< DBTabNameMap.length; i++)
		{
			if(skipDocTab && i==DOCSYS_DOC)
			{
				continue;
			}
			tabList.add(i);
		}		
		return tabList;
	}
	
	protected static boolean backupDatabase(String backUpPath, String type, String url, String user, String pwd, boolean skipDocTab) {		
		List<Integer> backupTabList = buildBackUpTabList(skipDocTab);
		
		String backUpName = "docsystem_data";
		
		if(exportDatabaseAsSql(backupTabList, backUpPath, backUpName + ".sql", "UTF-8", type, url, user, pwd) == false)
		{
			Log.debug("DBUpgrade() 数据库备份失败!");
			return true;
		}
		
		Integer newVersion = getVersionFromFile(docSysWebPath, "version");
		Integer oldVersion = getVersionFromFile(docSysIniPath , "version");
		return exportDatabaseAsJson(backupTabList, backUpPath, backUpName + ".json", oldVersion, newVersion, type, url, user, pwd);
	}

	protected static boolean createDBTab(String tabName, String type, String url, String user, String pwd) {
		boolean ret = false;
		Connection conn = null;
        Statement stmt = null;
        try{
            // 注册 JDBC 驱动
            Class.forName(getJdbcDriverName(type));
        
            // 打开链接
            //Log.debug("连接数据库...");
            conn = getDBConnection(type, url,user,pwd);
        
            // 执行查询
            //Log.debug(" 实例化Statement对象...");
            stmt = (Statement) conn.createStatement();
            
            String sql = "CREATE TABLE " + tabName + "(ID INT PRIMARY KEY      NOT NULL)";
            Log.debug("sql:" + sql);
            ret = stmt.execute(sql);
            Log.debug("ret:" + ret);
 
            ret = true;
        }catch(SQLException se){
            // 处理 JDBC 错误
            Log.info(se);
        }catch(Exception e){
            // 处理 Class.forName 错误
            Log.info(e);
        }finally{
            // 关闭资源
            try{
                if(stmt!=null) stmt.close();
            }catch(SQLException se2){
            }// 什么都不做
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                Log.info(se);
            }
        }
		return ret;
		
	}
	
	private static boolean deleteDBTab(String tabName, String type, String url, String user, String pwd) {
		boolean ret = false;
		Connection conn = null;
        Statement stmt = null;
        try{
            // 注册 JDBC 驱动
            Class.forName(getJdbcDriverName(type));
        
            // 打开链接
            //Log.debug("连接数据库...");
            conn = getDBConnection(type, url,user,pwd);
        
            // 执行查询
            //Log.debug(" 实例化Statement对象...");
            stmt = (Statement) conn.createStatement();
            
            String sql = "DROP TABLE IF EXISTS " + tabName;
            Log.debug("sql:" + sql);
            ret = stmt.execute(sql);
            Log.debug("ret:" + ret);
            ret = true;
        }catch(SQLException se){
            // 处理 JDBC 错误
            Log.info(se);
        }catch(Exception e){
            // 处理 Class.forName 错误
            Log.info(e);
        }finally{
            // 关闭资源
            try{
                if(stmt!=null) stmt.close();
            }catch(SQLException se2){
            }// 什么都不做
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                Log.info(se);
            }
        }
		return ret;
		
	}
	
	protected static boolean exportDatabaseAsSql(List<Integer> exportTabList, String path, String name, String encode, String type, String url, String user, String pwd) 
	{
		Log.debug("backupDB() encode:" + encode + " backup to file:" + path+name);
		
		String sqlStr = "";
		for(int i=0; i< exportTabList.size(); i++)
		{
			int objId = exportTabList.get(i);
			List<Object> list = dbQuery(null, objId, type, url, user, pwd);
			if(list != null)
			{
				sqlStr += convertListToInertSqls(objId, list, null); //统一进行编码转换写入
			}
		}
		boolean ret = FileUtil.saveDocContentToFile(sqlStr, path, name, encode);
		Log.debug("backupDB() End with ret:" + ret);
		return ret;
	}
	
	private static String convertListToInertSqls(int objId, List<Object> list, String encode) {
		String sqlStr = "";
		for(int i=0; i< list.size(); i++)
		{
			Object obj = list.get(i);
			String sql = buildInsertSqlForObject(obj, objId, encode);
			sqlStr += sql + ";\r\n";
		}
		sqlStr += "\r\n";	//换行
		return sqlStr;
	}
	
	protected static boolean exportDatabaseAsJson(List<Integer> exportTabList, String filePath, String fileName, Integer srcVersion, Integer dstVersion, String type, String url, String user, String pwd) 
	{
		Log.debug("exportDatabaseAsJson() " + " filePath:" + filePath + " srcVersion:" + srcVersion + " dstVersion:" + dstVersion);

		String jsonStr = "{";
		for(int i=0; i< exportTabList.size(); i++)
		{
			int objType = exportTabList.get(i);
			List<Object> list = null;
			if(objType == DOCSYS_DOC_AUTH)
	    	{
	    		list = queryDocAuth(null, srcVersion, dstVersion, type, url, user, pwd);
	    	}
			else
			{	
				list = dbQuery(null, objType, type, url, user, pwd);
			}
			
			//Convert list to jsonStr
			String tmpJsonStr = JSON.toJSONString(list);
			if(tmpJsonStr == null)
			{
				Log.debug("exportDatabaseAsJson() jsonStr is null");
				return false;
			}			
			String name = getNameByObjType(objType);
			jsonStr += name + ":" + tmpJsonStr + ",\r\n";		
		}
		jsonStr += "}";
		return FileUtil.saveDocContentToFile(jsonStr, filePath, fileName, "UTF-8");
	}

	protected static boolean importDatabase(List<Integer> importTabList, String importType, String filePath, String fileName, String type, String url, String user, String pwd)
	{
		Log.debug("importDatabase() importType:" + importType);
		if(importTabList == null)
		{
			importTabList = new ArrayList<Integer>();
			for(int i=0; i< DBTabNameMap.length; i++)
			{
				importTabList.add(i);
			}			
		}
		
		if(importType.equals("sql"))
		{
			return importDatabaseFromSqlFile(importTabList, filePath, fileName, type, url, user, pwd);
		}
		else if(importType.equals("json"))
		{
			return importDatabaseFromJsonFile(importTabList, filePath, fileName, type, url, user, pwd);
		}
		return false;
	}
	
	protected static boolean importDatabaseFromSqlFile(List<Integer> importTabList, String filePath, String fileName,
			String type, String url, String user, String pwd) {
		return executeSqlScript(filePath+fileName, type, url, user, pwd);
	}

	protected static boolean importDatabaseFromJsonFile(List<Integer> importTabList, String filePath, String fileName, String type, String url, String user, String pwd)
	{
		Log.debug("importDatabaseFromJsonFile() filePath:" + filePath + " fileName:" + fileName);

		String s = FileUtil.readDocContentFromFile(filePath, fileName,  "UTF-8");
		JSONObject jobj = JSON.parseObject(s);
		
		for(int i=0; i<importTabList.size(); i++)
		{
			int objType = importTabList.get(i);
			String name = getNameByObjType(objType);
	        JSONArray list = jobj.getJSONArray(name);
	        if(list == null || list.size() == 0)
	        {
	        	Log.debug("importDatabaseFromJsonFile() list is empty for " + name);
	        	continue;
	        }
	
	        importJsonObjListToDataBase(objType, list, type, url, user, pwd);
	    	Log.debug("importObjectListFromJsonFile() import OK");
		}
		return true;
	}
	
	private static void importJsonObjListToDataBase(int objType, JSONArray list, String type, String url, String user, String pwd) {
        for (int i = 0 ; i < list.size();i++)
        {
            JSONObject jsonObj = (JSONObject)list.get(i);
            
            Object obj = buildObjectFromJsonObj(jsonObj, objType);
            
            dbInsert(obj, objType, type, url, user, pwd);
        }
	}

	protected static boolean deleteDBTabs(String type, String url, String user, String pwd) 
	{
		Log.debug("deleteDBTabs()");

		for(int i=0; i< DBTabNameMap.length; i++)
		{
			deleteDBTab(DBTabNameMap[i], type, url, user, pwd);
		}	
		return true;
	}
	
	//删除数据库表（包括小写的）
	protected static boolean deleteDBTabsEx(String type, String url, String user, String pwd) 
	{
		Log.debug("deleteDBTabs()");

		for(int i=0; i< DBTabNameMap.length; i++)
		{
			deleteDBTab(DBTabNameMap[i].toUpperCase(), type, url, user, pwd);
			deleteDBTab(DBTabNameMap[i].toLowerCase(), type, url, user, pwd); //删除小写的数据库			
		}	
		return true;
	}

	protected static boolean initDB(String type, String url, String user, String pwd) 
	{
		Log.debug("initDB() type:" + type + " url:" + url);
		if(type == null)
		{
			type = "mysql";
		}
		
		switch(type)
		{
		case "mysql":
			return initDBForMysql(type, url, user, pwd);
		case "sqlite":
			return initDBForSqlite(type, url, user, pwd);			
		}
		return false;
	}

	protected static boolean initDBForSqlite(String type, String url, String user, String pwd) 
	{
		Log.debug("initDBForSqlite() url:" + url);
		return initDBTables(type, url, user, pwd);
	}
	
	protected static boolean initDBForMysql(String type, String url, String user, String pwd) 
	{
		Log.debug("initDBForMysql() url:" + url);
		
		return initDBTables(type, url, user, pwd);
		
		//String sqlScriptPath = docSysWebPath + "WEB-INF/classes/config/docsystem.sql";
		//if(FileUtil.isFileExist(sqlScriptPath) == false)
		//{
		//	Log.debug("initDB sqlScriptPath:" + sqlScriptPath + " not exists");
		//	return false;
		//}
		//return executeSqlScript(sqlScriptPath, type, url, user, pwd);
	}

	private static List<Integer> getDBTabListForUpgarde(Integer oldVersion, Integer newVersion) 
	{
		if(oldVersion == null || newVersion == null || newVersion == oldVersion)
		{
			return null;
		}

		//注意：版本越旧需要更新的数据库版本越多
		//下面的代码实际上也是表面从旧版本到该版本哪些数据库结构发生过变化
		List<Integer> dbTabList = new ArrayList<Integer>();
		if(oldVersion > newVersion) //系统降级（无法确定修改的表结构，因此需要更新所有表结构）
		{
			dbTabList.add(DOCSYS_USER);
			dbTabList.add(DOCSYS_ROLE);
			dbTabList.add(DOCSYS_USER_GROUP);	
			dbTabList.add(DOCSYS_GROUP_MEMBER);	
			dbTabList.add(DOCSYS_SYS_CONFIG);
			dbTabList.add(DOCSYS_DOC_SHARE);
			dbTabList.add(DOCSYS_REPOS);
			dbTabList.add(DOCSYS_REPOS_AUTH);
			dbTabList.add(DOCSYS_DOC);
			dbTabList.add(DOCSYS_DOC_AUTH);			
			dbTabList.add(DOCSYS_DOC_LOCK);
		}
		else if(oldVersion < 20000) //2.00.00版本以下升级到该版本需要更新所有数据库表
		{
			dbTabList.add(DOCSYS_USER);
			dbTabList.add(DOCSYS_ROLE);
			dbTabList.add(DOCSYS_USER_GROUP);	
			dbTabList.add(DOCSYS_GROUP_MEMBER);	
			dbTabList.add(DOCSYS_SYS_CONFIG);
			dbTabList.add(DOCSYS_DOC_SHARE);			
			dbTabList.add(DOCSYS_REPOS);
			dbTabList.add(DOCSYS_DOC);
			dbTabList.add(DOCSYS_REPOS_AUTH);
			dbTabList.add(DOCSYS_DOC_AUTH);			
			dbTabList.add(DOCSYS_DOC_LOCK);
		}
		else if(oldVersion < 20120)
		{
			dbTabList.add(DOCSYS_DOC_SHARE);
			dbTabList.add(DOCSYS_REPOS);
			dbTabList.add(DOCSYS_DOC);
			dbTabList.add(DOCSYS_USER);
			dbTabList.add(DOCSYS_REPOS_AUTH);
			dbTabList.add(DOCSYS_DOC_AUTH);			
			dbTabList.add(DOCSYS_DOC_LOCK);
		}
		else if(oldVersion < 20128)
		{
			dbTabList.add(DOCSYS_REPOS);
			dbTabList.add(DOCSYS_DOC);
			dbTabList.add(DOCSYS_USER);
			dbTabList.add(DOCSYS_REPOS_AUTH);
			dbTabList.add(DOCSYS_DOC_AUTH);			
			dbTabList.add(DOCSYS_DOC_LOCK);			
		}
		else if(oldVersion < 20181)	
		{
			//update DB for Doc Name and Path Expand
			dbTabList.add(DOCSYS_DOC);
			dbTabList.add(DOCSYS_USER);
			dbTabList.add(DOCSYS_REPOS_AUTH);
			dbTabList.add(DOCSYS_DOC_AUTH);
			dbTabList.add(DOCSYS_DOC_LOCK);
			dbTabList.add(DOCSYS_REPOS);
		}
		else if(oldVersion < 20207)
		{
			dbTabList.add(DOCSYS_DOC);
			dbTabList.add(DOCSYS_USER);
			dbTabList.add(DOCSYS_REPOS_AUTH);
			dbTabList.add(DOCSYS_DOC_AUTH);
			dbTabList.add(DOCSYS_REPOS);
		}
		else if(oldVersion < 20208)
		{
			dbTabList.add(DOCSYS_DOC);
			dbTabList.add(DOCSYS_USER);			
			dbTabList.add(DOCSYS_REPOS);
		}
		else if(oldVersion < 20210)
		{
			dbTabList.add(DOCSYS_REPOS);
		}
		return dbTabList;
	}
	
	protected static boolean initObjMemberListMap() {
		for(int i=0; i<DBTabNameMap.length; i++)
		{
			String objName = getNameByObjType(i).toUpperCase();
			if(objName != null)
			{

				String fileName = "docsystem_" + objName + ".json";
				String filePath = docSysWebPath + "WEB-INF/classes/config/";
				ObjMemberListMap[i] = getListFromJsonFile(filePath, fileName, objName);
				if(ObjMemberListMap[i] == null)
				{
					Log.debug("initObjMemberListMap() 获取 " + objName +" MemberList失败");
					return false;
				}
			}
		}
		return true;
	}	
	
	protected static JSONArray getObjMemberList(int objType) {
		return ObjMemberListMap[objType];
	}	
	
	private static JSONArray getListFromJsonFile(String filePath, String fileName, String listName) {
		Log.debug("getObjMemberListFromFile() filePath:" + filePath + " fileName:" + fileName + " listName:" + listName);
		String s = FileUtil.readDocContentFromFile(filePath, fileName);
		if(s == null)
		{
			return null;
		}
		
		JSONObject jobj = JSON.parseObject(s);
		JSONArray list = jobj.getJSONArray(listName);
        return list;
	}

	protected static String getNameByObjType(int objType) {		
		if(objType < DBTabNameMap.length)
		{
			return DBTabNameMap[objType];
		}
		return null;
	}

	public static Object buildObjectFromJsonObj(JSONObject jsonObj, int objType) {
		switch(objType)
		{
		case DOCSYS_REPOS:
			return buildReposFromJsonObj(jsonObj, objType);
		case DOCSYS_REPOS_AUTH:
			return buildReposAuthFromJsonObj(jsonObj, objType);
		case DOCSYS_DOC:
			return buildDocFromJsonObj(jsonObj, objType);
		case DOCSYS_DOC_AUTH:
			return buildDocAuthFromJsonObj(jsonObj, objType);
		case DOCSYS_DOC_LOCK:
			return buildDocLockFromJsonObj(jsonObj, objType);
		case DOCSYS_USER:
			return buildUserFromJsonObj(jsonObj, objType);		
		case DOCSYS_ROLE:
			return buildRoleFromJsonObj(jsonObj, objType);
		case DOCSYS_USER_GROUP:
			return buildUserGroupFromJsonObj(jsonObj, objType);
		case DOCSYS_GROUP_MEMBER:
			return buildGroupMemberFromJsonObj(jsonObj, objType);
		case DOCSYS_SYS_CONFIG:
			return buildSysConfigFromJsonObj(jsonObj, objType);
		case DOCSYS_DOC_SHARE:
			return buildDocShareFromJsonObj(jsonObj, objType);
		}
		return null;
	}
	
	private static Object createObject(ResultSet rs, int objType) throws Exception {
		//Log.debug("createObject() ");
		switch(objType)
		{
		case DOCSYS_REPOS:
			return buildReposFromResultSet(rs, objType);
		case DOCSYS_REPOS_AUTH:
			return buildReposAuthFromResultSet(rs, objType);
		case DOCSYS_DOC:
			return buildDocFromResultSet(rs, objType);
		case DOCSYS_DOC_AUTH:
			return buildDocAuthFromResultSet(rs, objType);
		case DOCSYS_DOC_LOCK:
			return buildDocLockFromResultSet(rs, objType);
		case DOCSYS_USER:
			return buildUserFromResultSet(rs, objType);		
		case DOCSYS_ROLE:
			return buildRoleFromResultSet(rs, objType);
		case DOCSYS_USER_GROUP:
			return buildUserGroupFromResultSet(rs, objType);
		case DOCSYS_GROUP_MEMBER:
			return buildGroupMemberFromResultSet(rs, objType);
		case DOCSYS_SYS_CONFIG:
			return buildSysConfigFromResultSet(rs, objType);
		case DOCSYS_DOC_SHARE:
			return buildDocShareFromResultSet(rs, objType);
		}
		return null;
	}

	protected static List<Object> queryDocAuth(DocAuth qDocAuth, Integer srcVersion, Integer dstVersion, String type, String url, String user, String pwd) 
	{
		List<Object> docAuthList = dbQuery(qDocAuth, DOCSYS_DOC_AUTH, type, url, user, pwd);
    	if(docAuthList == null || docAuthList.size() == 0)
    	{
    		return docAuthList;
    	}
    	Log.printObject("queryDocAuth() docAuthList:", docAuthList);
    	
		if(srcVersion != null && dstVersion!= null && srcVersion != dstVersion &&  srcVersion < 20000 && dstVersion >= 20000) //1.xx.xx版本的docId用的是doc的数据库ID
    	{	
			//convert docId
			for(int i=0; i<docAuthList.size(); i++)
	    	{
	    		DocAuth docAuth = (DocAuth) docAuthList.get(i);	    		
	    		Log.printObject("queryDocAuth() docAuth:", docAuth);
				if(docAuth.getDocId() != null)
				{
		    		Doc qDoc = new Doc();
		    		qDoc.setVid(docAuth.getReposId());
		    		try {
		    			qDoc.setId(Integer.parseInt(docAuth.getDocId().toString()));
		    		} catch(Exception e){
		    			Log.info(e);
		    			continue;
		    		}
		    		List<Object> docList = dbQuery(qDoc, DOCSYS_DOC, type, url, user, pwd);
		    		if(docList != null && docList.size() == 1)
		    		{
		    			Doc doc = (Doc) docList.get(0);
		    			docAuth.setDocPath(doc.getPath());
		    			docAuth.setDocName(doc.getName());
		    			Long docId = buildDocId(docAuth.getDocPath(), docAuth.getDocName());
		    	        docAuth.setDocId(docId);
		    		}
				}
	    	}
    	}
    	return docAuthList;
	}
	
	protected static List<Object> dbQuery(Object qObj, int objType, String type, String url, String user, String pwd) 
	{
		Log.debug("dbQuery() objType:" + objType);
		
		List<Object> list = new ArrayList<Object>();
		
        Connection conn = null;
        Statement stmt = null;
        try{
            // 注册 JDBC 驱动
            Class.forName(JDBC_DRIVER);
        
            // 打开链接
            //Log.debug("连接数据库...");
            conn = getDBConnection(type, url,user,pwd);
        
            // 执行查询
            //Log.debug(" 实例化Statement对象...");
            stmt = (Statement) conn.createStatement();
            
            String sql = buildQuerySqlForObject(qObj, objType, null);
    		Log.debug("dbQuery() sql:" + sql);

            ResultSet rs = stmt.executeQuery(sql);
                  
            // 展开结果集数据库
            while(rs.next()){
                Object obj = createObject(rs, objType);
                if(objType == DOCSYS_DOC_AUTH)
                {
                	obj = correctDocAuth((DocAuth) obj);
                }
                list.add(obj);
            }
            	
            // 完成后关闭
            rs.close();
            stmt.close();
            conn.close();
            return list;
        }catch(SQLException se){
            // 处理 JDBC 错误
            Log.info(se);
        }catch(Exception e){
            // 处理 Class.forName 错误
            Log.info(e);
        }finally{
            // 关闭资源
            try{
                if(stmt!=null) stmt.close();
            }catch(SQLException se2){
            }// 什么都不做
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                Log.info(se);
            }
        }
		return null;
	}


	protected static DocAuth correctDocAuth(DocAuth obj) {
		//任意用户权限检查
		if(obj.getUserId() != null && obj.getUserId() == 0)
		{
			if(obj.getGroupId() == null)
			{
				return obj;
			}
			
			if(obj.getGroupId() == 0)
			{
				obj.setGroupId(null);
				return obj;
			}
			
			obj.setUserId(null);
			return obj;
		}
		
		//用户权限检查
		if(obj.getGroupId() == null)
		{
			return obj;
		}
		
		//组权限检查
		if(obj.getGroupId() == 0)
		{
			obj.setGroupId(null);
			return obj;
		}
		
		return obj;
	}

	public static boolean dbInsert(Object obj, int objType, String type, String url, String user, String pwd)
	{
		boolean ret = false;
		Connection conn = null;
        Statement stmt = null;
        try{
            // 注册 JDBC 驱动
            Class.forName(JDBC_DRIVER);
        
            // 打开链接
            //Log.debug("连接数据库...");
            conn = getDBConnection(type, url,user,pwd);
        
            // 执行查询
            //Log.debug(" 实例化Statement对象...");
            stmt = (Statement) conn.createStatement();
            
            String sql = buildInsertSqlForObject(obj, objType, null);
            //Log.debug("sql:" + sql);
            ret = stmt.execute(sql);
            //Log.debug("ret:" + ret);
            // 完成后关闭
            stmt.close();
            conn.close();
            return ret;
        }catch(SQLException se){
            // 处理 JDBC 错误
            Log.info(se);
        }catch(Exception e){
            // 处理 Class.forName 错误
            Log.info(e);
        }finally{
            // 关闭资源
            try{
                if(stmt!=null) stmt.close();
            }catch(SQLException se2){
            }// 什么都不做
            try{
                if(conn!=null) conn.close();
            }catch(SQLException se){
                Log.info(se);
            }
        }
		return ret;
	}
	
	private static Object buildSysConfigFromJsonObj(JSONObject jsonObj, int objType) {
		SysConfig obj = new SysConfig();
		return convertJsonObjToObj(jsonObj, obj, objType);
	}
	
	private static Object buildSysConfigFromResultSet(ResultSet rs, int objType) throws SQLException {
		SysConfig obj = new SysConfig();
		return convertResultSetToObj(rs, obj, objType);
	}
	
	private static Object buildGroupMemberFromJsonObj(JSONObject jsonObj, int objType) {
		GroupMember obj = new GroupMember();
		return convertJsonObjToObj(jsonObj, obj, objType);
	}
	
	private static Object buildGroupMemberFromResultSet(ResultSet rs, int objType) throws SQLException {
		GroupMember obj = new GroupMember();
		return convertResultSetToObj(rs, obj, objType);
	}

	private static Object buildUserGroupFromJsonObj(JSONObject jsonObj, int objType) {
		UserGroup obj = new UserGroup();
		return convertJsonObjToObj(jsonObj, obj, objType);
	}
	
	private static Object buildUserGroupFromResultSet(ResultSet rs, int objType) throws SQLException {
		UserGroup obj = new UserGroup();
		return convertResultSetToObj(rs, obj, objType);
	}

	private static Object buildRoleFromJsonObj(JSONObject jsonObj, int objType) {
		Role obj = new Role();
		return convertJsonObjToObj(jsonObj, obj, objType);
	}
	
	private static Object buildRoleFromResultSet(ResultSet rs, int objType) throws SQLException {
		Role obj = new Role();
		return convertResultSetToObj(rs, obj, objType);
	}
	
	private static Object buildUserFromJsonObj(JSONObject jsonObj, int objType) {
		User obj = new User();
		return convertJsonObjToObj(jsonObj, obj, objType);
	}
	
	private static Object buildUserFromResultSet(ResultSet rs, int objType) throws SQLException {
		User obj = new User();
		return convertResultSetToObj(rs, obj, objType);
	}
	
	private static Object buildReposFromJsonObj(JSONObject jsonObj, int objType) {
		Repos obj = new Repos();
		return convertJsonObjToObj(jsonObj, obj, objType);
	}
	
	private static Object buildReposFromResultSet(ResultSet rs, int objType)
	{
		Repos obj = new Repos();
		return convertResultSetToObj(rs, obj, objType);
	}
	
	private static Object buildReposAuthFromJsonObj(JSONObject jsonObj, int objType) {
		ReposAuth obj = new ReposAuth();
		return convertJsonObjToObj(jsonObj, obj, objType);
	}

	private static Object buildReposAuthFromResultSet(ResultSet rs, int objType) throws SQLException {
		ReposAuth obj = new ReposAuth();
		return convertResultSetToObj(rs, obj, objType);
	}

	private static Object buildDocFromJsonObj(JSONObject jsonObj, int objType) {
		Doc obj = new Doc();
		return convertJsonObjToObj(jsonObj, obj, objType);
	}
	
	private static Object buildDocFromResultSet(ResultSet rs, int objType) throws Exception {
		Doc obj = new Doc();
		return convertResultSetToObj(rs, obj, objType); 
	}
	
	private static Object buildDocAuthFromJsonObj(JSONObject jsonObj, int objType) {
		DocAuth obj = new DocAuth();
		return convertJsonObjToObj(jsonObj, obj, objType);
	}

	private static Object buildDocAuthFromResultSet(ResultSet rs, int objType) throws Exception {
        DocAuth obj = new DocAuth();
		return convertResultSetToObj(rs, obj, objType);
	}
	
	private static Object buildDocLockFromJsonObj(JSONObject jsonObj, int objType) {
		DocLock obj = new DocLock();
		return convertJsonObjToObj(jsonObj, obj, objType);
	}
	
	private static Object buildDocLockFromResultSet(ResultSet rs, int objType) throws SQLException {
		DocLock obj = new DocLock();
		return convertResultSetToObj(rs, obj, objType);
	}

	
	private static Object buildDocShareFromJsonObj(JSONObject jsonObj, int objType) {
		DocShare obj = new DocShare();
		return convertJsonObjToObj(jsonObj, obj, objType);
	}
	
	private static Object buildDocShareFromResultSet(ResultSet rs, int objType) {
		DocShare obj = new DocShare();
		return convertResultSetToObj(rs, obj, objType);
	}
	
	private static Object convertJsonObjToObj(JSONObject jsonObj, Object obj, int objType) 
	{
		JSONArray ObjMemberList = getObjMemberList(objType);
		if(ObjMemberList == null)
		{
			return null;
		}
			
		for(int i=0; i<ObjMemberList.size(); i++)
		{
            JSONObject objMember = (JSONObject)ObjMemberList.get(i);
        	String type = (String) objMember.get("type");
         	String name = (String) objMember.get("name");
            //Log.debug("convertJsonObjToObj() type:" + type); 
         	//Log.debug("convertJsonObjToObj() name:" + name); 
         	
 			Object value = getValueFormJsonObj(jsonObj, name, type);
         	//Log.debug("convertJsonObjToObj() value:" + value); 

 			if(value != null)
 			{ 				
				if(Reflect.setFieldValue(obj, name, value) == false)
				{
					System.out.print("convertJsonObjToObj() Reflect.setFieldValue Failed for field:" + name); 
					return null;
				}
 			}
		}
		if(objType == DOCSYS_DOC_AUTH)
		{
			obj = correctDocAuth((DocAuth)obj);
		}	
		return obj;
	}
	
	protected static Object getValueFormJsonObj(JSONObject jsonObj, String field, String type) {
		Object value = jsonObj.get(field);
		if(value == null)
		{
			return null;
		}
		
		switch(type)
		{
		case "String": //String
			return (String)value;
		case "Integer": //Integer
			return (Integer)value;
		case "Long": //Long
			return Long.parseLong(value.toString());
		}
		return null;
	}

	
	private static Object getValueFromResultSet(ResultSet rs, String field, String type){
		try {			
			switch(type)
			{
			case "String": //String
				return rs.getString(field);
			case "Integer": //Integer
				return rs.getInt(field);
			case "Long": //Long
				return rs.getLong(field);
			}
		} catch (SQLException e) {
			//Log.debug("getValueFromResultSet() Failed to get value from ResultSet for field:" + field);
			//Log.printException(e);
		}
		return null;
	}
	
	private static Object convertResultSetToObj(ResultSet rs, Object obj, int objType) 
	{
		//Log.debug("convertResultSetToObj() ");
		
		JSONArray ObjMemberList = getObjMemberList(objType);
		if(ObjMemberList == null)
		{
			Log.debug("convertResultSetToObj() ObjMemberList is null");
			return null;
		}
			
		for(int i=0; i<ObjMemberList.size(); i++)
		{
            JSONObject objMember = (JSONObject)ObjMemberList.get(i);
        	String type = (String) objMember.get("type");
         	String name = (String) objMember.get("name");
         	String dbName = (String) objMember.get("dbName");

            
 			Object value =  getValueFromResultSet(rs, dbName, type);
 			//if(objType == DOCSYS_DOC_AUTH)
 			//{
 			//	Log.debug("convertResultSetToObj() type:" + type + " name:" + name + " value:" + value); 
 			//}
 			//Log.debug("convertResultSetToObj() type:" + type); 
         	//Log.debug("convertResultSetToObj() name:" + name); 
         	
 			if(value != null)
 			{
				if(Reflect.setFieldValue(obj, name, value) == false)
				{
					return null;
				}
 			}
		}
		return obj;
	}

	private static List<JSONObject> buildParamListForObj(Object obj, int objType) {
		List<JSONObject> paramList = new ArrayList<JSONObject>();
		
		JSONArray ObjMemberList = getObjMemberList(objType);
		if(ObjMemberList == null)
		{
			return null;
		}
			
		for(int i=0; i<ObjMemberList.size(); i++)
		{
            JSONObject objMember = (JSONObject)ObjMemberList.get(i);
        	String name = (String) objMember.get("name");
              
 			Object value = null;
			try {
				value = Reflect.getFieldValue(obj, name);
			} catch (Exception e) {
				Log.info(e);
				return null;
			}
			
			if(value != null)
			{
				paramList.add(objMember);
			}			
		}
		
		return paramList;
	}
	
	private static String buildInsertSqlForObject(Object obj, int objType, String encode) {
		if(obj == null)
		{
			return 	null;
		}
		
		String dbTabName = getNameByObjType(objType);
		String sql_condition = "";
		String sql_value="";
		List<JSONObject> paramList = buildParamListForObj(obj, objType);
		int lastParamIndex = paramList.size() - 1;
		for(int i=0; i < paramList.size(); i++)
		{
			String seperator = ",";
			if(i == lastParamIndex)
			{
				seperator = "";
			}
			
			JSONObject param = paramList.get(i);
			String type = (String) param.get("type");
			String field = (String) param.get("name");
			String dbField = (String) param.get("dbName");
						
			sql_condition += dbField + seperator;	//不带,
			
			Object value = Reflect.getFieldValue(obj, field);
			switch(type)
			{			
			case "Integer": 
			case "Long":
				sql_value += " " + value + seperator; 
				break;
			case "String":
				String sqlValue = convertToSqlValue(value);
				sqlValue = enocdeString(sqlValue, encode);
				sql_value += " '" + sqlValue  + "'" + seperator; 
				break;
			}
		}
        String sql = "insert into " + dbTabName+ " (" + sql_condition + ")" + " values (" + sql_value + ")";
        return sql;
	}
	
	private static String enocdeString(String str, String encode) {
		if(encode != null)
		{
			try {
				String tmpStr = new String(str.getBytes(), encode);
				//Log.debug("enocdeString() tmpSqlValue:" + tmpStr);
				return tmpStr;
			} catch (Exception e) {
				Log.info(e);
			}
		}
		return str;
	}

	private static String buildQuerySqlForObject(Object obj, int objType, String encode) {
		String name = getNameByObjType(objType);
		String sql = "select * from " + name;
		
		if(obj == null)
		{
			return 	sql;
		}
		
		List<JSONObject> paramList = buildParamListForObj(obj, objType);
		if(paramList == null)
		{
			return sql;
		}
		
		String sql_condition = " where ";
		String sql_value="";
		for(int i=0; i < paramList.size(); i++)
		{
			String seperator = " and ";
			if(i == 0)
			{
				seperator = " ";
			}
			
			JSONObject param = paramList.get(i);
			String type = (String) param.get("type");
			String field = (String) param.get("name");
			String dbField = (String) param.get("dbName");
			
			Object value = Reflect.getFieldValue(obj, field);
			switch(type)
			{			
			case "Integer": 
			case "Long":
				sql_value += seperator + dbField + "="  + value;
				break;
			case "String": 
				String sqlValue = convertToSqlValue(value);
				sqlValue = enocdeString(sqlValue, encode);
				sql_value += seperator + dbField + "='"  + sqlValue + "'";
				break;
			}
		}
        sql = sql + sql_condition + sql_value;
        return sql;
	}
	
	static String convertToSqlValue(Object value)
	{
		String sqlValue = value.toString();
		sqlValue = sqlValue.replace("\\","\\\\");
		sqlValue = sqlValue.replace("'","\\'");
		sqlValue = sqlValue.replace('"','\"');
		return sqlValue;
	}
	
	

	/**************************** DocSys重启接口 *********************************/
    public static boolean restartServer(ReturnAjax rt) {              
    	String serverPath = Path.getParentPath(docSysWebPath, 3, OSType);
    	if(serverPath == null)
		{
			Log.debug("restartTomcat() Failed to get serverPath");
			rt.setError("获取服务器路径失败！");
			return false;
		}
    	
    	String scriptPath = serverPath + "restart.sh";
    	if(isWinOS())
    	{
    		scriptPath = serverPath + "restart.bat";
    	}
    	
    	File file = new File(scriptPath);
    	if(file.exists() == false){
    		rt.setError("找不到服务器重启脚本！");
    		return false;
    	}
    	
    	String restartCmd = buildScriptRunCmd(scriptPath);        
        return run(restartCmd, null, null) != null;
    }
    
	/**************************** DocSys升级接口 *********************************/
    public static boolean upgradeServer(ReturnAjax rt) {              
    	String serverPath = Path.getParentPath(docSysWebPath, 3, OSType);
    	if(serverPath == null)
		{
			Log.debug("upgradeSystem() Failed to get serverPath");
			rt.setError("获取服务器路径失败！");
			return false;
		}
    	
    	String scriptPath = serverPath + "upgrade.sh";
    	if(isWinOS())
    	{
    		scriptPath = serverPath + "upgrade.bat";
    	}
    	
    	File file = new File(scriptPath);
    	if(file.exists() == false){
    		rt.setError("找不到服务器升级脚本！");
    		return false;
    	}
    	
    	String restartCmd = buildScriptRunCmd(scriptPath);  
        return run(restartCmd, null, null) != null;
    }
    
	public static boolean restartTomcat(String tomcatPath, String javaHome) {              
    	String stopScriptPath = generateTomcatStopScript(tomcatPath, javaHome);
    	if(stopScriptPath == null)
		{
			Log.debug("restartTomcat() generateTomcatStopScript failed");
			return false;
		}
    	String startScriptPath = generateTomcatStartScript(tomcatPath, javaHome);
    	if(startScriptPath == null)
		{
			Log.debug("restartTomcat() generateTomcatStartScript failed");
			return false;
		}
		
    	Log.debug("restartTomcat() stopScriptPath:" + stopScriptPath);
    	Log.debug("restartTomcat() startScriptPath:" + startScriptPath);
    	
        String stopCmd = buildScriptRunCmd(stopScriptPath);
        String startCmd = buildScriptRunCmd(startScriptPath);
        
        run(stopCmd, null, null);
        return run(startCmd, null, null) != null;
    }
    
    private static String generateTomcatStopScript(String tomcatPath, String javaHome) {
		tomcatPath = Path.localDirPathFormat(tomcatPath, OSType);
		if(javaHome == null)
        {
        	javaHome = tomcatPath + "Java/jre1.8.0_162/";
        }
        javaHome = Path.localDirPathFormat(javaHome, OSType);
    	
        //对tomcatPath和javaHome进行格式转换
        String tomcatPathForReplace = tomcatPath.substring(0,tomcatPath.length()-1).replace("/", File.separator);
        String javaHomePathForReplace = javaHome.substring(0,javaHome.length()-1).replace("/", File.separator);
    	
    	String scriptName = "tomcat_stop.sh";
        if (isWinOS()) {
        	scriptName = "tomcat_stop.bat";
        }

        String ScriptTemplatePath = docSysWebPath + "WEB-INF/classes/script/"; //脚本模板
    	String content = FileUtil.readDocContentFromFile(ScriptTemplatePath, scriptName);
		content = content.replace("tomcatPath", tomcatPathForReplace);
		content = content.replace("javaHome", javaHomePathForReplace);
		if(FileUtil.saveDocContentToFile(content, tomcatPath, scriptName,  null) == true)	//自动生成脚本使用本地默认的格式
		{
			return tomcatPath + scriptName;
		}
		Log.debug("generateTomcatStopScript() FileUtil.saveDocContentToFile failed");
    	return null;
	}
    
    private static String generateTomcatStartScript(String tomcatPath, String javaHome) {
		tomcatPath = Path.localDirPathFormat(tomcatPath, OSType);
        javaHome = Path.localDirPathFormat(javaHome, OSType);
    	
        //对tomcatPath和javaHome进行格式转换
        String tomcatPathForReplace = tomcatPath.substring(0,tomcatPath.length()-1).replace("/", File.separator);
        String javaHomePathForReplace = javaHome.substring(0,javaHome.length()-1).replace("/", File.separator);
    	
    	String scriptName = "tomcat_start.sh";
    	if (isWinOS()) {
        	scriptName = "tomcat_start.bat";
        }

        String ScriptTemplatePath = docSysWebPath + "WEB-INF/classes/script/"; //脚本模板
    	String content = FileUtil.readDocContentFromFile(ScriptTemplatePath, scriptName);  //自动检测编码格式
		content = content.replace("tomcatPath", tomcatPathForReplace);
		content = content.replace("javaHome", javaHomePathForReplace);
		if(FileUtil.saveDocContentToFile(content, tomcatPath, scriptName, null) == true)
		{
			return tomcatPath + scriptName;
		}
		Log.debug("generateTomcatStartScript() FileUtil.saveDocContentToFile failed");
    	return null;
	}

	protected static String buildScriptRunCmd(String shellScriptPath) {
        String cmd = null;
        if (isWinOS()) {
        	cmd = "cmd /c " + shellScriptPath;
        }
        else
        {
        	cmd = "sh " + shellScriptPath;
        }
        return cmd;
    }   
    
    public static String run(String command, String[] envp, File dir) {
        String result = null;

    	Runtime rt = Runtime.getRuntime();
        try {
        	Process ps = rt.exec(command, envp, dir);
            
        	result = readProcessOutput(ps);

        	int exitCode = ps.waitFor();    	
        	if(exitCode == 0)
        	{
        		Log.debug("BaseController run() command:" + command +  " 执行成功！");
        	}
        	else
        	{
        		Log.debug("BaseController run() command:" + command +  " 执行失败！exitCode:" + exitCode);
        		Log.debug("BaseController run() 错误日志 result:" + result);   
        	}
        	ps.destroy();
            
        } catch (Exception e) {
            Log.info(e);
        }
        return result;
    }
    
    public static boolean run(String command, String[] envp, File dir, RunResult runResult) {
    	Integer exitCode = null;
    	String result = null;
        boolean ret = false;
        
    	Runtime rt = Runtime.getRuntime();
        try {
        	Process ps = rt.exec(command, envp, dir);
            
        	result = readProcessOutput(ps);

        	exitCode = ps.waitFor();    	
        	if(exitCode == 0)
        	{
        		Log.debug("执行成功！");
        		ret = true;
        	}
        	else
        	{
        		Log.debug("执行失败:" + exitCode);   
        		Log.debug("错误日志:" + result);   
            		
        	}
        	ps.destroy();
        	runResult.exitCode = exitCode;
        	runResult.result = result;
        } catch (Exception e) {
            Log.info(e);
        }
        return ret;
    }
    

	private static String readProcessOutput(Process ps) throws IOException {
		String result = read(ps.getInputStream(), System.out);
		if(result == null)
		{
			result = "";
		}
		
		result += read(ps.getErrorStream(), System.err);
		return result;
	}

	private static String read(InputStream inputStream, PrintStream out) throws IOException {
		String result = "";
		//printout the command line
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        String line;
        while((line = reader.readLine()) != null) {
        	result += line;
        	out.println(line);
        }
        return result;
	}

	/****************************DocSys其他接口 *********************************/
	//获取当前登录用户信息
	protected User getCurrentUser(HttpSession session){
		User user = (User) session.getAttribute("login_user");
		Log.debug("get sessionId:"+session.getId());
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
			Log.debug("获取emailConfig.properties失败");
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
	
	//检测网址是否可用
    public static boolean testUrl(String urlString)
    {
    	Log.debug("testUrl() URL:" + urlString);
        boolean ret = false;
        long lo = System.currentTimeMillis();
        URL url = null;  
        try {  
             url = new URL(urlString);  
             InputStream in = url.openStream();
             in.close();
             ret = true;
             Log.debug("连接可用");  
        } catch (Exception e) {
        	Log.info(e);
            Log.debug("连接打不开!");
        } 
        Log.debug("testUrl() used time:" + (System.currentTimeMillis()-lo) + " ms");
        return ret;
    }
    
    public static boolean testUrlWithTimeOut(String urlString,int timeOutMillSeconds){
    	Log.debug("testUrlWithTimeOut() URL:" + urlString);
    	boolean ret = false;
    	long lo = System.currentTimeMillis();
        URL url = null;
        try {  
             url = new URL(urlString);  
             URLConnection co =  url.openConnection();
             co.setConnectTimeout(timeOutMillSeconds);
             co.connect();
             ret = true;
             Log.debug("连接可用");  
        } catch (Exception e) {
        	Log.info(e);
            Log.debug("连接打不开!");  
        }  
        Log.debug("testUrlWithTimeOut() used time:" + (System.currentTimeMillis()-lo) + " ms");
        return ret;
    }
    
    /** 
     * 功能：检测当前URL是否可连接或是否有效, 
     * 描述：最多连接网络 5 次, 如果 5 次都不成功，视为该地址不可用 
     * @param urlStr 指定URL网络地址 
     * @return URL 
     */  
  public synchronized URL isConnect(String urlStr) {  
     int counts = 0;  
     if (urlStr == null || urlStr.length() <= 0) {                         
      return null;                   
     }  
     URL url = null;
	while (counts < 5) {  
      try {  
       url = new URL(urlStr);  
       HttpURLConnection con = (HttpURLConnection) url.openConnection();  
       int state = con.getResponseCode();  
       Log.debug(counts +"= "+state);  
       if (state == 200) {  
        Log.debug("URL可用！");  
       }  
       break;  
      }catch (Exception ex) {  
       counts++;   
       Log.debug("URL不可用，连接第 "+counts+" 次");  
       urlStr = null;  
       continue;  
      }  
     }  
     return url;  
  }
	
	//获取仓库信息（包括非数据库的信息）
	public Repos getReposEx(Integer reposId) {
		Repos repos = reposService.getRepos(reposId);
		return getReposEx(repos);
	}
	
	protected boolean reposCheck(Repos repos, ReturnAjax rt, HttpServletResponse response) {
		if(systemDisabled != 0)
		{
			Log.info("reposCheck() 系统已被禁用");
			rt.setError("系统维护中，请稍后重试！");
			writeJson(rt, response);			
			return false;			
		}
		
		if(repos == null)
		{
			docSysErrorLog("仓库不存在！", rt);
			writeJson(rt, response);			
			return false;
		}
		
		if(repos.disabled != null)
		{
			Log.info("仓库 " + repos.getName() + " was disabled:" + repos.disabled);
			rt.setError("仓库已被禁用:" + repos.disabled);
			writeJson(rt, response);			
			return false;					
		}
		
		if(repos.isBusy)
		{
			Log.info("仓库 " + repos.getName() + " is busy");
			rt.setError("仓库维护中，请稍后重试！");
			writeJson(rt, response);			
			return false;
		}
		return true;
	}

	public Repos getReposEx(Repos repos) {
		if(repos != null)
		{
			//从redis中获取仓库扩展配置摘要信息,用于确定remoteStorage/remoteServer/autoBackup/textSearch/versionIgnore/encrypt的配置是否有更新
			repos.reposExtConfigDigest = getReposExtConfigDigest(repos);
			Log.printObject("getReposEx() reposExtConfigDigest:", repos.reposExtConfigDigest);
			
			ReposData reposData = getReposData(repos);
			if(reposData == null)
			{
				reposData = initReposData(repos);
				initReposExtentionConfigEx(repos, reposData);
			}
			else
			{
				if(isFSM(repos))
				{
					repos.remoteStorageConfig = getReposRemoteStorageConfig(repos);
					repos.autoBackupConfig = getReposBackupConfig(repos);
				}
				else
				{
					repos.remoteServerConfig = getReposRemoteServerConfig(repos);
					repos.setVerCtrl(0);
				}
				
				repos.textSearchConfig = getReposTextSearchConfig(repos);
				repos.versionIgnoreConfig = getReposVersionIgnoreConfig(repos);			
				repos.encryptType = 0;
				EncryptConfig encryptConfig = getReposEncryptConfig(repos);
				if(encryptConfig != null && encryptConfig.type != null)
				{
					repos.encryptType = encryptConfig.type;
				}			
			}
			
			//common configs
			repos.disabled = reposData.disabled;
			repos.isBusy = reposData.isBusy;
			repos.isBussiness = systemLicenseInfo.hasLicense;
			repos.officeType = officeType;
		}
		return repos;
	}

	//注意：该接口需要返回真正的parentZipDoc
	protected Doc checkAndExtractEntryFromCompressDoc(Repos repos, Doc rootDoc, Doc doc) 
	{
		Log.debug("\n");
		Log.debug("checkAndExtractEntryFromCompressDoc() rootDoc:" + rootDoc.getLocalRootPath() + rootDoc.getPath() + rootDoc.getName());
		Log.debug("checkAndExtractEntryFromCompressDoc() doc:" +  doc.getLocalRootPath() + doc.getPath() + doc.getName());
		if(rootDoc.getName() == null || rootDoc.getName().isEmpty())
		{
			errorLog("checkAndExtractEntryFromCompressDoc() rootDoc.name 不能为空");			
			return null;
		}

		Doc parentCompressDoc = getParentCompressDoc(repos, rootDoc, doc);
		if(parentCompressDoc == null)
		{
			errorLog("checkAndExtractEntryFromCompressDoc() getParentCompressDoc 异常");
			return null;
		}
		
		Log.debug("checkAndExtractEntryFromCompressDoc() parentCompressDoc:" + parentCompressDoc.getLocalRootPath() + parentCompressDoc.getPath() + parentCompressDoc.getName());
		if(parentCompressDoc.getDocId().equals(rootDoc.getDocId()))
		{	
			//如果doc的parentCompressDoc是rootDoc，那么直接从rootDoc解压出doc
			Log.debug("checkAndExtractEntryFromCompressDoc() parentCompressDoc:" + parentCompressDoc.getPath() + parentCompressDoc.getName() + " is rootDoc");
			parentCompressDoc = rootDoc;
		}
		else
		{
			//如果doc的parentCompressDoc不存在，那么有两种可能：没有被解压出来，或者是目录（但尾缀是压缩文件尾缀）
			File parentFile = new File(parentCompressDoc.getLocalRootPath() + parentCompressDoc.getPath() + parentCompressDoc.getName());
			if(parentFile.exists() == false)
			{
				Log.debug("checkAndExtractEntryFromCompressDoc() parentCompressDoc 不存在，call checkAndExtractEntryFromCompressDoc");
				//此时无法区分该parentCompressDoc是否是目录，只能将其解压出来，然后让extractEntryFromCompressFile来找到真正的parentCompressDoc
				checkAndExtractEntryFromCompressDoc(repos, rootDoc, parentCompressDoc);				
			}
			else 
			{
				if(parentFile.isDirectory())
				{
					//表明parentCompressDoc是目录，因此需要继续向上找到真正的parentCompressDoc
					Log.debug("checkAndExtractEntryFromCompressDoc() parentCompressDoc 是目录");
					parentCompressDoc = checkAndExtractEntryFromCompressDoc(repos, rootDoc, parentCompressDoc);
				}
				else
				{
					Log.debug("checkAndExtractEntryFromCompressDoc() parentCompressDoc 是压缩文件");					
				}
			}
		}
		
		//解压zipDoc (parentCompressDoc必须已存在，无论是目录还是文件，如果是目录的话则继续向上查找，但此时肯定都存在)
		extractEntryFromCompressFile(repos, rootDoc, parentCompressDoc, doc);
		return parentCompressDoc;
	}
	
	private boolean extractEntryFromCompressFile(Repos repos, Doc rootDoc, Doc parentCompressDoc, Doc doc) 
	{
		Log.debug("extractEntryFromCompressFile() parentCompressDoc:" + parentCompressDoc.getLocalRootPath() + parentCompressDoc.getPath() + parentCompressDoc.getName());
		Log.debug("extractEntryFromCompressFile() doc:" + doc.getLocalRootPath() + doc.getPath() + doc.getName());
		
		parentCompressDoc = checkAndGetRealParentCompressDoc(repos, rootDoc, parentCompressDoc);
		if(parentCompressDoc == null)
		{
			Log.debug("extractEntryFromCompressFile() real parentCompressDoc is null");
			return false;
		}
		
		Log.debug("extractEntryFromCompressFile() real parentCompressDoc:" + parentCompressDoc.getLocalRootPath() + parentCompressDoc.getPath() + parentCompressDoc.getName());
		String compressFileType = FileUtil.getCompressFileType(parentCompressDoc.getName());
		if(compressFileType == null)
		{
			Log.debug("extractEntryFromCompressFile() " + rootDoc.getName() + " 不是压缩文件！");
			return false;
		}
		
		switch(compressFileType)
		{
		case "zip":
		case "war":
			if(extractEntryFrom7zFile(parentCompressDoc, doc) == false)
			{
				return extractEntryFromZipFile(parentCompressDoc, doc);
			}
			return true;
		case "7z":
			return extractEntryFrom7zFile(parentCompressDoc, doc);			
		case "rar":
			return extractEntryFromCompressFile(parentCompressDoc, doc);			
		case "tar":
			return extractEntryFromTarFile(parentCompressDoc, doc);
		case "tgz":
		case "tar.gz":
			return extractEntryFromTgzFile(parentCompressDoc, doc);		
		case "txz":
		case "tar.xz":
			return extractEntryFromTxzFile(parentCompressDoc, doc);			
		case "tbz2":
		case "tar.bz2":
			return extractEntryFromTarBz2File(parentCompressDoc, doc);					
		case "gz":
			return extractEntryFromGzFile(parentCompressDoc, doc);						
		case "xz":
			return extractEntryFromXzFile(parentCompressDoc, doc);
		case "bz2":
			return extractEntryFromBz2File(parentCompressDoc, doc);
		}
		return false;
	}
	


	private Doc checkAndGetRealParentCompressDoc(Repos repos, Doc rootDoc, Doc parentCompressDoc) {
		File parentFile = new File(parentCompressDoc.getLocalRootPath() + parentCompressDoc.getPath() + parentCompressDoc.getName());
		if(parentFile.exists() == false)
		{
			Log.debug("checkAndGetRealParentCompressDoc() parentCompressDoc 不存在！");
			Log.printObject("checkAndGetRealParentCompressDoc() parentCompressDoc:",parentCompressDoc);
			return null;
		}
		
		if(parentFile.isDirectory())
		{
			Log.debug("checkAndGetRealParentCompressDoc() parentCompressDoc 是目录，向上层查找realParentCompressDoc！");
			Doc parentParentCompressDoc = getParentCompressDoc(repos, rootDoc, parentCompressDoc);
			return checkAndGetRealParentCompressDoc(repos, rootDoc, parentParentCompressDoc);
		}
		return parentCompressDoc;
	}

	private boolean extractEntryFromBz2File(Doc parentZipDoc, Doc zipDoc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			Log.debug("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			Log.debug("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}

        FileInputStream fis = null;
        OutputStream fos = null;
        BZip2CompressorInputStream bis = null;

        try {
            fis = new FileInputStream(file);
            bis = new BZip2CompressorInputStream(fis);

            File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
			File parent = tempFile.getParentFile();
			if (!parent.exists()) {
				parent.mkdirs();
			}
            
            fos = new FileOutputStream(tempFile);
            int count;
            byte data[] = new byte[2048];
            while ((count = bis.read(data)) != -1) {
                fos.write(data, 0, count);
            }
            fos.flush();
            ret = true;
        } catch (IOException e) {
            Log.info(e);
        }finally {
            try {
                if(fis != null){
                    fis.close();
                }
                if(fos != null){
                    fos.close();
                }
                if(bis != null){
                    bis.close();
                }
            } catch (IOException e) {
                Log.info(e);
            }
        }
		return ret;
	}

	private boolean extractEntryFromXzFile(Doc parentZipDoc, Doc zipDoc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			Log.debug("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			Log.debug("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}

        FileInputStream  fileInputStream = null;
        XZInputStream gzipIn = null;
        OutputStream out = null;

        try {
            fileInputStream = new FileInputStream(file);
            
            gzipIn = new XZInputStream(fileInputStream, 100 * 1024);

            File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
			File parent = tempFile.getParentFile();
			if (!parent.exists()) {
				parent.mkdirs();
			}
			
            out = new FileOutputStream(tempFile);
            int count;
            byte data[] = new byte[2048];
            while ((count = gzipIn.read(data)) != -1) {
                out.write(data, 0, count);
            }
            out.flush();
            ret = true;
        } catch (IOException e) {
            Log.info(e);
        }finally {
            try {
                if(out != null){
                    out.close();
                }
                if(gzipIn != null){
                    gzipIn.close();
                }
                if(fileInputStream != null){
                    fileInputStream.close();
                }
            } catch (IOException e) {
                Log.info(e);
            }
        }
		return ret;
	}

	private boolean extractEntryFromGzFile(Doc parentZipDoc, Doc zipDoc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			Log.debug("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			Log.debug("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}

        FileInputStream  fileInputStream = null;
        GZIPInputStream gzipIn = null;
        OutputStream out = null;
        
        try {
            fileInputStream = new FileInputStream(file);
            gzipIn = new GZIPInputStream(fileInputStream);

            File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
			File parent = tempFile.getParentFile();
			if (!parent.exists()) {
				parent.mkdirs();
			}
			
            out = new FileOutputStream(tempFile);
            int count;
            byte data[] = new byte[2048];
            while ((count = gzipIn.read(data)) != -1) {
                out.write(data, 0, count);
            }
            out.flush();
            ret = true;
        } catch (IOException e) {
            Log.info(e);
        }finally {
            try {
                if(out != null){
                    out.close();
                }
                if(gzipIn != null){
                    gzipIn.close();
                }
                if(fileInputStream != null){
                    fileInputStream.close();
                }
            } catch (IOException e) {
                Log.info(e);
            }
        }
        return ret;
	}

	private boolean extractEntryFromTarBz2File(Doc parentZipDoc, Doc zipDoc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			Log.debug("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			Log.debug("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
        String expEntryPath = relativePath + zipDoc.getName();
        
        FileInputStream fis = null;
        OutputStream fos = null;
        BZip2CompressorInputStream bis = null;
        TarInputStream tis = null;
        try {
            fis = new FileInputStream(file);
            bis = new BZip2CompressorInputStream(fis);
            tis = new TarInputStream(bis, 1024 * 2);

            TarEntry entry;
            while((entry = tis.getNextEntry()) != null)
            {
            	String subEntryPath = entry.getName();
            	if(subEntryPath.equals(expEntryPath))
            	{
	            	Log.debug("subEntry:" + entry.getName());
	            	
	                if(entry.isDirectory())
	                {
	            		FileUtil.createDir(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName()); // 创建子目录
	                }
	                else
	                {
	            		File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
	        			File parent = tempFile.getParentFile();
	        			if (!parent.exists()) {
	        				parent.mkdirs();
	        			}
	        			
	                    fos = new FileOutputStream(tempFile);
	                    int count;
	                    byte data[] = new byte[2048];
	                    while ((count = tis.read(data)) != -1) {
	                        fos.write(data, 0, count);
	                    }
	                    fos.flush();
	                }
	                ret = true;
	                break;
            	}
            }
        } catch (IOException e) {
            Log.info(e);
        }finally {
            try {
                if(fis != null){
                    fis.close();
                }
                if(fos != null){
                    fos.close();
                }
                if(bis != null){
                    bis.close();
                }
                if(tis != null){
                    tis.close();
                }
            } catch (IOException e) {
                Log.info(e);
            }
        }
		return ret;
	}

	private boolean extractEntryFromTxzFile(Doc parentZipDoc, Doc zipDoc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			Log.debug("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			Log.debug("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
        String expEntryPath = relativePath + zipDoc.getName();
        
        FileInputStream  fileInputStream = null;
        BufferedInputStream bufferedInputStream = null;
        XZInputStream gzipIn = null;
        TarInputStream tarIn = null;
        OutputStream out = null;
        try {
            fileInputStream = new FileInputStream(file);
            bufferedInputStream = new BufferedInputStream(fileInputStream);
            gzipIn = new XZInputStream(bufferedInputStream);
            tarIn = new TarInputStream(gzipIn, 1024 * 2);

            TarEntry entry = null;
            while((entry = tarIn.getNextEntry()) != null)
            {
            	String subEntryPath = entry.getName();
            	if(subEntryPath.equals(expEntryPath))
            	{
	            	Log.debug("subEntry:" + entry.getName());
	                
	            	if(entry.isDirectory())
	            	{
	            		FileUtil.createDir(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName()); // 创建子目录
	            	}
	            	else
	            	{ 
	            		File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
	        			File parent = tempFile.getParentFile();
	        			if (!parent.exists()) {
	        				parent.mkdirs();
	        			}
	        			
	                    out = new FileOutputStream(tempFile);
	                    int len =0;
	                    byte[] b = new byte[2048];
	
	                    while ((len = tarIn.read(b)) != -1){
	                        out.write(b, 0, len);
	                    }
	                    out.flush();
	                }
	            	ret = true;
	            	break;
            	}
            }
        } catch (IOException e) {
            Log.info(e);
        }finally {
            try {
                if(out != null){
                    out.close();
                }
                if(tarIn != null){
                    tarIn.close();
                }
                if(gzipIn != null){
                    gzipIn.close();
                }
                if(bufferedInputStream != null){
                    bufferedInputStream.close();
                }
                if(fileInputStream != null){
                    fileInputStream.close();
                }
            } catch (IOException e) {
                Log.info(e);
            }
        }
        return ret;
	}

	private boolean extractEntryFromTgzFile(Doc parentCompressDoc, Doc doc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentCompressDoc.getLocalRootPath() + parentCompressDoc.getPath() + parentCompressDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			Log.debug("extractEntryFromTgzFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			Log.debug("extractEntryFromTgzFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(doc.getPath(), parentCompressDoc.getPath() + parentCompressDoc.getName() + "/");
        String expEntryPath = "./" + relativePath + doc.getName();
    	Log.debug("extractEntryFromTgzFile expEntryPath:" + expEntryPath);
        
        FileInputStream  fileInputStream = null;
        BufferedInputStream bufferedInputStream = null;
        GZIPInputStream gzipIn = null;
        TarInputStream tarIn = null;
        OutputStream out = null;
        try {
            fileInputStream = new FileInputStream(file);
            bufferedInputStream = new BufferedInputStream(fileInputStream);
            gzipIn = new GZIPInputStream(bufferedInputStream);
            tarIn = new TarInputStream(gzipIn, 1024 * 2);

            TarEntry entry = null;
            while((entry = tarIn.getNextEntry()) != null)
            {
            	String subEntryPath = entry.getName();
            	//Log.debug("extractEntryFromTgzFile subEntry:" + subEntryPath);
            	if(subEntryPath.equals(expEntryPath) || subEntryPath.equals(expEntryPath.substring(2)))
            	{	  
            		Log.debug("extractEntryFromTgzFile subEntry:" + subEntryPath);
            		Log.debug("extractEntryFromTgzFile subEntry:" + doc.getLocalRootPath() + doc.getPath() + doc.getName());
	            	if(entry.isDirectory())
	            	{
	            		FileUtil.createDir(doc.getLocalRootPath() + doc.getPath() + doc.getName()); // 创建子目录
	            	}
	            	else
	            	{ 
	            		File tempFile = new File(doc.getLocalRootPath() + doc.getPath() + doc.getName());
	        			File parent = tempFile.getParentFile();
	        			if (!parent.exists()) {
	        				parent.mkdirs();
	        			}
	        			
	                    out = new FileOutputStream(tempFile);
	                    int len =0;
	                    byte[] b = new byte[2048];
	
	                    while ((len = tarIn.read(b)) != -1){
	                        out.write(b, 0, len);
	                    }
	                    out.flush();
	                }
	            	ret = true;
	            	break;
            	}
            }
        } catch (IOException e) {
            Log.info(e);
        }finally {
            try {
                if(out != null){
                    out.close();
                }
                if(tarIn != null){
                    tarIn.close();
                }
                if(gzipIn != null){
                    gzipIn.close();
                }
                if(bufferedInputStream != null){
                    bufferedInputStream.close();
                }
                if(fileInputStream != null){
                    fileInputStream.close();
                }
            } catch (IOException e) {
                Log.info(e);
            }
        }
		return ret;
	}

	private boolean extractEntryFromTarFile(Doc parentZipDoc, Doc zipDoc) 
	{
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			Log.debug("extractEntryFromTarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			Log.debug("extractEntryFromTarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
        String expEntryPath = relativePath + zipDoc.getName();
		
        FileInputStream fis = null;
        OutputStream fos = null;
        TarInputStream tarInputStream = null;
        try {
            fis = new FileInputStream(file);
            tarInputStream = new TarInputStream(fis, 1024 * 2);
             
            TarEntry entry = null;
            while(true){
                entry = tarInputStream.getNextEntry();
                if( entry == null){
                    break;
                }
                
            	String subEntryPath = entry.getName();
            	if(subEntryPath.equals(expEntryPath))
            	{
            		Log.debug("subEntry:" + entry.getName());
	                
	                if(entry.isDirectory())
	            	{
	            		FileUtil.createDir(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName()); // 创建子目录
	                }
	                else
	                {
	                	File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
	        			File parent = tempFile.getParentFile();
	        			if (!parent.exists()) {
	        				parent.mkdirs();
	        			}
	        			
	                    fos = new FileOutputStream(tempFile);
	                    int count;
	                    byte data[] = new byte[2048];
	                    while ((count = tarInputStream.read(data)) != -1) {
	                        fos.write(data, 0, count);
	                    }
	                    fos.flush();
	                }
                    ret = true;
                    break;

            	}
            }
        } catch (IOException e) {
           Log.info(e);
        }finally {
            try {
                if(fis != null){
                    fis.close();
                }
                if(fos != null){
                    fos.close();
                }
                if(tarInputStream != null){
                    tarInputStream.close();
                }
            } catch (IOException e) {
                Log.info(e);
            }
        }
		return ret;
	}

	private boolean extractEntryFrom7zFile(Doc parentZipDoc, Doc zipDoc) {
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			Log.debug("extractEntryFrom7zFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			Log.debug("extractEntryFrom7zFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
        String expEntryPath = relativePath + zipDoc.getName();
		
        SevenZFile sevenZFile = null;
        OutputStream outputStream = null;
        try {
            sevenZFile = new SevenZFile(file);
            SevenZArchiveEntry entry;
            while((entry = sevenZFile.getNextEntry()) != null)
            {
            	String subEntryPath = entry.getName();
            	Log.debug("extractEntryFrom7zFile() subEntry:" + subEntryPath);
            	if(subEntryPath.equals(expEntryPath))
            	{
	            	if(entry.isDirectory())
	            	{
	            		FileUtil.createDir(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName()); // 创建子目录
	                }
	            	else
	            	{
	            		File tempFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
	        			File parent = tempFile.getParentFile();
	        			if (!parent.exists()) {
	        				parent.mkdirs();
	        			}
	        			
	                    outputStream = new FileOutputStream(tempFile);
	                    int len = 0;
	                    byte[] b = new byte[2048];
	                    while((len = sevenZFile.read(b)) != -1){
	                        outputStream.write(b, 0, len);
	                    }
	                    outputStream.flush();
	            	}
                    ret = true;
                    break;
            	}
            }
        } catch (IOException e) {
            Log.info(e);
        }finally {
            try {
                if(sevenZFile != null){
                    sevenZFile.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                Log.info(e);
            }
        }
		return ret;
	}

	//这是使用SevenZip的解压接口
	private boolean extractEntryFromCompressFile(Doc parentZipDoc, Doc zipDoc) {
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			Log.debug("extractEntryFromCompressFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			Log.debug("extractEntryFromCompressFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
	    String expEntryPath = relativePath + zipDoc.getName();
	    if(isWinOS())
	    {
	    	expEntryPath = expEntryPath.replace("/", "\\");
	    }
    	Log.debug("extractEntryFromCompressFile expEntryPath:" + expEntryPath);
        
        RandomAccessFile randomAccessFile = null;
        IInArchive inArchive = null;
        try {
            randomAccessFile = new RandomAccessFile(parentZipFilePath, "r");
            inArchive = SevenZip.openInArchive(null, // autodetect archive type
                    new RandomAccessFileInStream(randomAccessFile));

        	int[] in = new int[inArchive.getNumberOfItems()];
	        for (int i = 0; i < inArchive.getNumberOfItems(); i++) {
            	String subEntryPath = (String) inArchive.getProperty(i, PropID.PATH);
            	Log.debug("extractEntryFromCompressFile subEntryPath:" + subEntryPath);
            	if(subEntryPath.equals(expEntryPath))
            	{
                	Log.debug("extractEntryFromCompressFile expEntry found:" + subEntryPath);
                    if (((Boolean) inArchive.getProperty(i, PropID.IS_FOLDER)).booleanValue()) {
                		FileUtil.createDir(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName()); // 创建子目录
                    }
                	else
                	{
                    	File tmpFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
    					File parent = tmpFile.getParentFile();
    					if (!parent.exists()) {
     						parent.mkdirs();
     					}
                    	
                    	//解压
    				    in[0] = i;
    				    String outputDir = zipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName() + "/";
    				    Log.debug("extractEntryFromCompressFile outDir:" + outputDir);
    		            inArchive.extract(in, false, new MyExtractCallback(inArchive, "366", outputDir));
                	}
                    ret = true;
                    break;
            	}
            }
        } catch (Exception e) {
            System.err.println("extractEntryFromCompressFile Error occurs: " + e);
        } finally {
            if (inArchive != null) {
                try {
                    inArchive.close();
                } catch (SevenZipException e) {
                    System.err.println("extractEntryFromCompressFile Error closing archive: " + e);
                }
            }
            if (randomAccessFile != null) {
                try {
                    randomAccessFile.close();
                } catch (IOException e) {
                    System.err.println("extractEntryFromCompressFile Error closing file: " + e);
                }
            }
        }
        return ret;
	}
	
	@SuppressWarnings({ "unused", "deprecation" })
	private boolean extractEntryFromRarFile(Doc parentZipDoc, Doc zipDoc) {
        boolean ret = false;
		String parentZipFilePath = parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName();
		
        File file = new File(parentZipFilePath);
		if(file.exists() == false)
		{
			Log.debug("extractEntryFromRarFile " + parentZipFilePath + " 不存在！");
			return ret;
		}
		else if(file.isDirectory())
		{
			Log.debug("extractEntryFromRarFile " + parentZipFilePath + " 是目录！");
			return ret;
		}
		
	    String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
        String expEntryPath = (relativePath + zipDoc.getName()).replace("/", "\\");
        
		Archive archive = null;
        OutputStream outputStream = null;
        try {
            archive = new Archive(new FileInputStream(file));
            
            FileHeader fileHeader;
            while( (fileHeader = archive.nextFileHeader()) != null){

            	String subEntryPath = fileHeader.getFileNameW();
            	if(subEntryPath.equals(expEntryPath))
            	{
                	Log.debug("subEntry:" + subEntryPath);
                	
                	if(fileHeader.isDirectory())
                	{
                		FileUtil.createDir(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName()); // 创建子目录
                    }
                	else
                	{
                    	File tmpFile = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
    					File parent = tmpFile.getParentFile();
    					if (!parent.exists()) {
     						parent.mkdirs();
     					}
                    	
                    	outputStream = new FileOutputStream(tmpFile);
                        archive.extractFile(fileHeader, outputStream);
                	}
                    ret = true;
                    break;

            	}
            }
        } catch (Exception e) {
            Log.info(e);
        }finally {
            try {
                if(archive != null){
                    archive.close();
                }
                if(outputStream != null){
                    outputStream.close();
                }
            } catch (IOException e) {
                Log.info(e);
            }
        }
        return ret;
	}

	private boolean extractEntryFromZipFile(Doc parentZipDoc, Doc zipDoc) {
		boolean ret = false;

		ZipFile parentZipFile = null;
		try {
			parentZipFile = new ZipFile(new File(parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName()), "UTF-8");
			
			String relativePath = getZipRelativePath(zipDoc.getPath(), parentZipDoc.getPath() + parentZipDoc.getName() + "/");
			ZipEntry entry = parentZipFile.getEntry(relativePath + zipDoc.getName());
			if(entry == null)
			{
				Log.debug("extractEntryFromZipFile() " + relativePath + zipDoc.getName() + " not exists in zipFile:" + parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName());
				return false;
			}
			
			Log.debug("extractEntryFromZipFile() name:" + entry.getName());
			//注意即使是目录也要生成目录，因为该目录将是用来区分名字压缩尾缀的目录和真正的压缩文件
			if(entry.isDirectory())
			{
				Log.debug("extractEntryFromZipFile() " + relativePath + zipDoc.getName() + " is Directory in zipFile:" + parentZipDoc.getLocalRootPath() + parentZipDoc.getPath() + parentZipDoc.getName());
				File dir = new File(zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
				return dir.mkdirs();
			}
			
			File zipDocParentDir = new File(zipDoc.getLocalRootPath() + zipDoc.getPath());
			if(zipDocParentDir.exists() == false)
			{
				zipDocParentDir.mkdirs();
			}
			
			ret = dumpZipEntryToFile(parentZipFile, entry, zipDoc.getLocalRootPath() + zipDoc.getPath() + zipDoc.getName());
		} catch (IOException e) {
			Log.info(e);
		} finally {
			if(parentZipFile != null)
			{
				try {
					parentZipFile.close();
				} catch (IOException e) {
					Log.info(e);
				}
			}
		}		
		return ret;
	}
	
	 public static boolean unZip(String path, String savepath) 
	 { 
		boolean ret = false;
	    int count = -1; 
	    InputStream is = null; 
	    FileOutputStream fos = null; 
	    BufferedOutputStream bos = null; 
	    
	    File file = new File(savepath);
	    if(file.exists() == false)
	    {
	    	file.mkdir(); //创建保存目录 
	    }
	    ZipFile zipFile = null; 
	    try
	    { 
	      zipFile = new ZipFile(path,"gbk"); //解决中文乱码问题 
	      Enumeration<?> entries = zipFile.getEntries(); 
	      while(entries.hasMoreElements()) 
	      { 
			byte buf[] = new byte[2048]; 
	        ZipEntry entry = (ZipEntry)entries.nextElement(); 
	        String filename = entry.getName(); 
	        boolean ismkdir = false; 
	        if(filename.lastIndexOf("/") != -1){ //检查此文件是否带有文件夹 
	         ismkdir = true; 
	        } 
	        filename = savepath + filename; 
	        if(entry.isDirectory()){ //如果是文件夹先创建 
	         file = new File(filename); 
	         file.mkdirs(); 
	          continue; 
	        } 
	        file = new File(filename); 
	        if(!file.exists()){ //如果是目录先创建 
	         if(ismkdir){ 
	         new File(filename.substring(0, filename.lastIndexOf("/"))).mkdirs(); //目录先创建 
	         } 
	        } 
	        file.createNewFile(); //创建文件 
	        is = zipFile.getInputStream(entry); 
	        fos = new FileOutputStream(file); 
	        bos = new BufferedOutputStream(fos, 2048); 
	        while((count = is.read(buf)) > -1) 
	        { 
	          bos.write(buf, 0, count); 
	        } 
	        bos.flush(); 
	        bos.close(); 
	        fos.close(); 
	        is.close(); 
	      } 
	      zipFile.close(); 
	      ret = true;
	    }catch(IOException ioe){ 
	      Log.info(ioe); 
	    }finally{ 
	       try{ 
	       if(bos != null){ 
	         bos.close(); 
	       } 
	       if(fos != null) { 
	         fos.close(); 
	       } 
	       if(is != null){ 
	         is.close(); 
	       } 
	       if(zipFile != null){ 
	         zipFile.close(); 
	       } 
	       }catch(Exception e) { 
	         Log.info(e); 
	       } 
	    } 
	    return ret;
	} 

	//获取doc的parentZipDoc(这里有风险parentZipDoc里面的目录的名字带压缩后缀)
	private Doc getParentCompressDoc(Repos repos, Doc rootDoc, Doc doc) {
		Log.debug("getParentCompressDoc() doc:" + doc.getPath() + doc.getName());
		if(doc.getName() == null || doc.getName().isEmpty())
		{
			errorLog("getParentCompressDoc() doc.name 不能为空");
			return null;
		}
		
		Doc parentDoc = buildBasicDoc(repos.getId(), null, doc.getPid(), rootDoc.getReposPath(), doc.getPath(), "", null, 1, true, null, null, 0L, "");
		if(parentDoc.getDocId().equals(rootDoc.getDocId()))
		{
			return rootDoc;
		}
				
		String tmpLocalRootPath = Path.getReposTmpPathForDoc(repos, parentDoc);	
		parentDoc.setLocalRootPath(tmpLocalRootPath);
		
		if(FileUtil.isCompressFile(parentDoc.getName()) == false)
		{
			return getParentCompressDoc(repos, rootDoc, parentDoc);
		}
		
		return parentDoc;			
	}

	protected String getZipRelativePath(String path, String rootPath) {
		if(rootPath.equals(""))
		{
			return path;
		}
		
		if(path.indexOf(rootPath) != 0)
		{
			return null; //非法path
		}
		
		return path.substring(rootPath.length());
	}
	
	
	private boolean dumpZipEntryToFile(ZipFile zipFile, ZipEntry entry, String filePath) {
		boolean ret = false;
		int bufSize = 4096;
		byte[] buf = new byte[bufSize];
		int readedBytes;
		
		File file = new File(filePath);
		
		FileOutputStream fileOutputStream = null;
		InputStream inputStream = null;
		try {
			fileOutputStream = new FileOutputStream(file);
			inputStream = zipFile.getInputStream(entry);
			
			while ((readedBytes = inputStream.read(buf)) > 0) {
				fileOutputStream.write(buf, 0, readedBytes);
			}
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		} finally {
			if(fileOutputStream != null)
			{
				try {
					fileOutputStream.close();
				} catch (IOException e) {
					Log.info(e);
				}
			}
			if(inputStream != null)
			{
				try {
					inputStream.close();
				} catch (IOException e) {
					Log.info(e);
				}
			}
		}
		return ret;
	}
	
	protected boolean isOfficeEditorApiConfiged(HttpServletRequest request) {
		Log.debug("isOfficeEditorApiConfiged() officeEditorApi:" + officeEditorApi);
		String officeEditor = getOfficeEditor(request);
		if(officeEditor == null)
		{
			return false;
		}
		if(officeEditor.isEmpty())
		{
			return false;
		}
		return true;
	}

	protected String buildSaveDocLink(Doc doc, String authCode, String urlStyle, ReturnAjax rt) {
		Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), doc.getLocalRootPath() + doc.getPath(), doc.getName(), 1);
		if(downloadDoc == null)
		{
			Log.debug("buildSaveDocLink() buildDownloadDocInfo failed");
			return null;
		}
		
		String fileLink  = null;
		if(urlStyle != null && urlStyle.equals("REST"))
		{
			if(authCode == null)
			{
				authCode = "0";
			}
			Integer shareId = doc.getShareId();
			if(shareId == null)
			{
				shareId = 0;
			}
			fileLink = "/DocSystem/Bussiness/saveDoc/" + doc.getVid() + "/" + downloadDoc.getPath() + "/" + downloadDoc.getName() +  "/" + downloadDoc.targetPath +  "/" + downloadDoc.targetName +"/" + authCode + "/" + shareId;
		}
		else
		{
			fileLink = "/DocSystem/Bussiness/saveDoc.do?vid=" + doc.getVid() + "&path="+ downloadDoc.getPath() + "&name="+ downloadDoc.getName() + "&targetPath=" + downloadDoc.targetPath + "&targetName="+downloadDoc.targetName;	
			if(authCode != null)
			{
				fileLink += "&authCode=" + authCode;
			}
			if(doc.getShareId() != null)
			{
				fileLink += "&shareId=" + doc.getShareId();				
			}
		}
		return fileLink;
	}
	
	protected static String buildOfficeEditorKey(Doc doc) {
		String keystr = doc.getLocalRootPath() + doc.getDocId() + "_" + doc.getSize() + "_" + doc.getLatestEditTime();
		Log.debug(keystr);
		return keystr.hashCode() + "";
	}
	
	@SuppressWarnings("rawtypes")
	protected HashMap<String, String> buildQueryParamForObj(User obj, Integer pageIndex, Integer pageSize) {
		HashMap<String, String> param = new HashMap<String,String>();
		if(pageIndex != null && pageSize != null)
		{
			String start = pageIndex*pageSize + "";
			String number =  pageSize+"";
			Log.debug("buildQueryParamForObj start:" + start + " number:" + number);
			param.put("start", start);
			param.put("number", number);
		}
		
		if(obj == null)
		{
			return param;
		}
		
		//Use Reflect to set conditions
        Class userCla = (Class) obj.getClass();
        /* 得到类中的所有属性集合 */
        java.lang.reflect.Field[] fs = userCla.getDeclaredFields();
        for (int i = 0; i < fs.length; i++) 
        {
        	java.lang.reflect.Field f = fs[i];
            f.setAccessible(true); // 设置些属性是可以访问的
            String type = f.getType().toString();
            Integer fieldType = LuceneUtil2.getFieldType(type);
			if(fieldType != null)	//only support the field string\long\int\digital type
			{
	            String fieldName = f.getName();
				try {
					Object val = f.get(obj);
					if(val != null)
					{
						param.put(fieldName, val+"");
					}
	            } catch (IllegalArgumentException e) {
					Log.info(e);
				} catch (IllegalAccessException e) {
					Log.info(e);
				}
			}
        }
		return param;
	}
	
	protected JSONObject getRequestBodyAsJSONObject(HttpServletRequest request) {
		String body = "";
        try
        {
            Scanner scanner = new Scanner(request.getInputStream());
            scanner.useDelimiter("\\A");
            body = scanner.hasNext() ? scanner.next() : "";
            scanner.close();
        }
        catch (Exception ex)
        {
            return null;
        }
        
        if (body.isEmpty())
        {
            return null;
        }
        
        Log.debug("getRequestBodyAsJSONObject body:" + body);        
        JSONObject jsonObj = JSON.parseObject(body);
        return jsonObj;
	}
	
	protected static JSONObject getRemoteAuthCodeForPushDoc(String targetServerUrl,  String userName, String pwd, Integer type, ReturnAjax rt) {
		String requestUrl = targetServerUrl + "/DocSystem/Bussiness/getAuthCode.do?userName=" + userName + "&pwd="+pwd;
		if(type != null)
		{
			requestUrl += "&type="+type;
		}
		JSONObject ret = postJson(requestUrl, null, true);	//AuthCode

		if(ret == null)
		{
			Log.debug("getRemoteAuthCode() ret is null");
			rt.setError("连接服务器失败");
			return null;
		}
		
		if(ret.getString("status") == null)
		{
			//未知状态
			Log.debug("getRemoteAuthCode() ret.status is null");
			rt.setError("连接服务器失败");
			return null;
		}
		
		if(!ret.getString("status").equals("ok"))
		{
			Log.debug("getRemoteAuthCode() ret.status is not ok");
			rt.setError(ret.getString("msgInfo"));
			return null;
		}
		
		return ret;
	}
	
	/************* RemoteStorage Interfaces *******************************/
	public List<Doc> remoteStorageGetEntryList(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId) {
		Log.debug("remoteStorageGetEntryList() docId:" + doc.getDocId() + "[" + doc.getPath() + doc.getName() + "]");
        List<Doc> list = null;
		if(session == null) 
		{
			session = doRemoteStorageLogin(repos, remote);
	        if(session == null)
	        {
	        	//再尝试三次
	        	for(int i=0; i < 3; i++)
	        	{
	        		//Try Again
	        		session = doRemoteStorageLogin(repos, remote);
	        		if(session != null)
	        		{
	        			break;
	        		}
	        	}
	        }
	        
        	if(session == null)
        	{
        		return null;
        	}
			list = getRemoteStorageEntryList(session, remote, repos, doc, commitId);
        	doRemoteStorageLogout(session);
		}
		else
        {
        	list = getRemoteStorageEntryList(session, remote, repos, doc, commitId);
        }
        return list;
	}

	public static Doc remoteStorageGetEntry(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId) {
		Log.debug("remoteStorageGetEntry() [" + doc.getPath() + doc.getName() + "]");
		Doc remoteDoc = null;
        
		if(session == null) 
		{
			session = doRemoteStorageLogin(repos, remote);
	        if(session == null)
	        {
	        	//再尝试三次
	        	for(int i=0; i < 3; i++)
	        	{
	        		//Try Again
	        		session = doRemoteStorageLogin(repos, remote);
	        		if(session != null)
	        		{
	        			break;
	        		}
	        	}
	        }
			
			if(session == null)
        	{
        		return null;
        	}
			
			remoteDoc = getRemoteStorageEntry(session, remote, repos, doc, commitId);
        	doRemoteStorageLogout(session);
		}
		else
		{
        	remoteDoc = getRemoteStorageEntry(session, remote, repos, doc, commitId);
        }
		return remoteDoc;
	}
	
	public List<Doc> remoteStorageGetDBEntryList(RemoteStorageConfig remote, Repos repos, Doc doc) {
		Log.debug("getRemoteStorageDBEntryList() " + doc.getPath() + doc.getName());
		return getRemoteStorageDBEntryList(repos, doc, remote);
	}
	
	public HashMap<String, Doc> remoteStorageGetDBHashMap(RemoteStorageConfig remote, Repos repos, Doc doc) {
		Log.debug("remoteStorageGetDBHashMap() " + doc.getPath() + doc.getName());
		return getRemoteStorageDBHashMap(repos, doc, remote);
	}
	
	public Doc remoteStorageGetDBEntry(RemoteStorageConfig remote, Repos repos, Doc doc) {
		Log.debug("remoteStorageGetDBEntry() " + doc.getPath() + doc.getName());
		return getRemoteStorageDBEntry(repos, doc, false, remote);
	}
	
	//******************* 远程存储 接口 *********************************
	//Remote Storage DB Interfaces
	protected static List<Doc> getRemoteStorageDBEntryList(Repos repos, Doc doc, RemoteStorageConfig remote) {
		Log.debug("getRemoteStorageDBEntryList for doc:[" + doc.getPath() + doc.getName() + "]");

		String indexLib = getIndexLibPathForRemoteStorageDoc(repos, remote);
		if(indexLib == null)
		{
			Log.debug("getRemoteStorageDBEntryList indexLib is null");
			return null;
		}

		//查询数据库
		Doc qDoc = new Doc();
		qDoc.setVid(doc.getVid());
		qDoc.setPid(doc.getDocId());
		
		//子目录下的文件个数可能很多，但一万个应该是比较夸张了
		List<Doc> list = LuceneUtil2.getDocList(repos, qDoc, indexLib, 10000);
		return list;
	}

	protected static HashMap<String,Doc> getRemoteStorageDBHashMap(Repos repos, Doc doc, RemoteStorageConfig remote) {
		//查询数据库
		List<Doc> list = getRemoteStorageDBEntryList(repos, doc, remote);
		HashMap<String, Doc> docHashMap = new HashMap<String, Doc>();
		if(list != null)
		{
			docHashMap = new HashMap<String, Doc>();
			for(int i=0; i<list.size(); i++)
			{
				Doc subDoc = list.get(i);
				docHashMap.put(subDoc.getName(), subDoc);
			}
		}
		return docHashMap;
	}
	
	protected static Doc getRemoteStorageDBEntry(Repos repos, Doc doc, boolean dupCheck, RemoteStorageConfig remote) {
		String indexLib = getIndexLibPathForRemoteStorageDoc(repos, remote);
		if(indexLib == null)
		{
			Log.debug("getRemoteStorageDBEntry indexLib is null");
			return null;
		}
				
		//查询数据库
		Doc qDoc = new Doc();
		qDoc.setVid(doc.getVid());
		qDoc.setDocId(doc.getDocId());
		
		List<Doc> list = LuceneUtil2.getDocList(repos, qDoc, indexLib, 100);
		if(list == null || list.size() == 0)
		{
			return null;
		}
		
		if(dupCheck)
		{
			if(list.size() > 1)
			{
				Log.debug("getRemoteStorageDBEntry() 数据库存在多个DOC记录(" + doc.getName() + ")，自动清理"); 
				for(int i=0; i <list.size(); i++)
				{
					//delete Doc directly
					LuceneUtil2.deleteDoc(list.get(i), indexLib);
				}
				return null;
			}
		}
	
		return list.get(0);
	}
	
	protected static boolean addRemoteStorageDBEntry(Repos repos, Doc doc, RemoteStorageConfig remote) {
		String indexLib = getIndexLibPathForRemoteStorageDoc(repos, remote);
		if(indexLib == null)
		{
			Log.debug("addRemoteStorageDBEntry indexLib is null");
			return false;
		}
		Log.debug("addRemoteStorageDBEntry doc:" + doc.getPath() + doc.getName());
		return LuceneUtil2.addIndex(doc, null, indexLib);
	}

	protected static boolean updateRemoteStorageDBEntry(Repos repos, Doc doc, RemoteStorageConfig remote) {
		String indexLib = getIndexLibPathForRemoteStorageDoc(repos, remote);
		if(indexLib == null)
		{
			Log.debug("updateRemoteStorageDBEntry indexLib is null");
			return false;
		}
		Log.debug("updateRemoteStorageDBEntry doc:" + doc.getPath() + doc.getName());		
		//TODO : updateIndex接口存在问题，无法更新成功，因此还是需要先删除再添加
		//return LuceneUtil2.updateIndex(doc, null, indexLib);
		LuceneUtil2.deleteIndexEx(doc, indexLib, 2);
		return LuceneUtil2.addIndex(doc, null, indexLib);
	}
	
	protected static boolean deleteRemoteStorageDBEntry(Repos repos, Doc doc, RemoteStorageConfig remote) {
		String indexLib = getIndexLibPathForRemoteStorageDoc(repos, remote);
		if(indexLib == null)
		{
			Log.debug("deleteRemoteStorageDBEntry indexLib is null");
			return false;
		}
		//return LuceneUtil2.deleteIndex(doc, indexLib);
		Log.debug("deleteRemoteStorageDBEntry doc:" + doc.getPath() + doc.getName());		
		return LuceneUtil2.deleteIndexEx(doc, indexLib, 2);
	}

	//Remote Storage remoteEntry Interfaces
	protected List<Doc> getRemoteStorageEntryList(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId) {
		if(doc.getType() != null && doc.getType() != 2)
		{
			Log.debug("getRemoteStorageEntryList() doc:[" + doc.getPath() + doc.getName() + "] is not a directory");
			return null;
		}
		
		switch(remote.protocol)
		{
		case "file":
			return getRemoteStorageEntryListForLocal(session, remote, repos, doc);
		case "sftp":
			return getRemoteStorageEntryListForSftp(session, remote, repos, doc);
		case "ftp":
			return getRemoteStorageEntryListForFtp(session, remote, repos, doc);
		case "smb":
			return getRemoteStorageEntryListForSmb(session, remote, repos, doc);
		case "mxsdoc":
			return getRemoteStorageEntryListForMxsDoc(session, remote, repos, doc);
		case "svn":
			return getRemoteStorageEntryListForSvn(session, remote, repos, doc, commitId);
		case "git":
			return getRemoteStorageEntryListForGit(session, remote, repos, doc, commitId);
		default:
			Log.debug("getRemoteStorageEntryList unknown remoteStorage protocol:" + remote.protocol);
			break;
		}
		return null;
	}

	private HashMap<String, Doc> getRemoteStorageEntryHashMap(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId) {
		if(remote == null)
		{
			Log.debug("getRemoteStorageEntryHashMap remoteStorage for repos " + repos.getId() + " " + repos.getName() + " not configured");
			return null;
		}
		
		switch(remote.protocol)
		{
		case "file":
			return getRemoteStorageEntryHashMapForLocal(session, remote, repos, doc);
		case "sftp":
			return getRemoteStorageEntryHashMapForSftp(session, remote, repos, doc);
		case "ftp":
			return getRemoteStorageEntryHashMapForFtp(session, remote, repos, doc);
		case "smb":
			return getRemoteStorageEntryHashMapForSmb(session, remote, repos, doc);
		case "mxsdoc":
			return getRemoteStorageEntryHashMapForMxsDoc(session, remote, repos, doc);
		case "svn":
			return getRemoteStorageEntryHashMapForSvn(session, remote, repos, doc, commitId);
		case "git":
			return getRemoteStorageEntryHashMapForGit(session, remote, repos, doc, commitId);
		default:
			Log.debug("getRemoteStorageEntryHashMap unknown remoteStorage protocol:" + remote.protocol);
			break;
		}
		return null;
	}

	protected static Doc getRemoteStorageEntry(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId) {
		if(remote == null)
		{
			Log.debug("getRemoteStorageEntry remoteStorage for repos " + repos.getId() + " " + repos.getName() + " not configured");
			return null;
		}
		
		switch(remote.protocol)
		{
		case "file":
			return getRemoteStorageEntryForLocal( session, remote,repos, doc);
		case "sftp":
			return getRemoteStorageEntryForSftp( session, remote,repos, doc);
		case "ftp":
			return getRemoteStorageEntryForFtp(session, remote, repos, doc);
		case "smb":
			return getRemoteStorageEntryForSmb(session, remote, repos, doc);
		case "mxsdoc":
			return getRemoteStorageEntryForMxsDoc(session, remote, repos, doc);
		case "svn":
			return getRemoteStorageEntryForSvn(session, remote, repos, doc, commitId);
		case "git":
			return getRemoteStorageEntryForGit(session, remote, repos, doc, commitId);

		default:
			Log.debug("getRemoteStorageEntry unknown remoteStorage protocol:" + remote.protocol);
			break;
		}
		return null;
	}
	
	
	private static Integer getRemoteStorageEntryType(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId)
	{
		Log.debug("getRemoteStorageEntryType() doc offsetPath:" + doc.offsetPath);
		//tmpDoc 是没有 offsetPath的doc
		Doc tmpDoc = buildBasicDoc(doc.getVid(), null, null,  doc.getReposPath(), doc.offsetPath + doc.getPath(), doc.getName(), doc.getLevel(), null, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), doc.getSize(), "", "");
		
		Log.printObject("getRemoteStorageEntryType() tmpDoc:", tmpDoc);
		
		return getRemoteStorageEntryType(session, remote, tmpDoc.getPath(), tmpDoc.getName(), commitId);
	}
	
	private static void updateRemoteStorageDbEntry( RemoteStorageConfig remote, Repos repos, DocPushResult pushResult, List<CommitAction> actionList, String revision) {
		for(int i=0; i<actionList.size(); i++)
		{
			CommitAction action = actionList.get(i);
			pushResult.successCount ++;
			Doc doc = action.getDoc();
			doc.setRevision(revision);
			
			switch(action.getAction())
    		{
    		case ADD:	//add
    			addRemoteStorageDBEntry(repos, doc, remote);    			
    			break;
    		case DELETE: //delete
    			deleteRemoteStorageDBEntry(repos, doc, remote);
    			break;
    		case MODIFY: //modify
    			updateRemoteStorageDBEntry(repos, doc, remote);
    			break;
			default:
				break;
    		}
		}
	}

	protected static RemoteStorageSession doRemoteStorageLogin(Repos repos, RemoteStorageConfig remote) {
		if(remote == null)
		{
			Log.debug("doRemoteStorageLogin remoteStorage for repos " + repos.getId() + " " + repos.getName() + " not configured");
			return null;
		}
		
		RemoteStorageSession session = new RemoteStorageSession();
		session.protocol = remote.protocol;
		switch(remote.protocol)
		{
		case "file":
			return session;
		case "sftp":
			return remoteStorageLoginForSftp(repos, remote, session);
		case "ftp":
			return remoteStorageLoginForFtp(repos, remote, session);      
		case "smb":
			return remoteStorageLoginForSmb(repos, remote, session);      
		case "mxsdoc":
			return remoteStorageLoginForMxsDoc(repos, remote, session);			
		case "svn":
			return remoteStorageLoginForSvn(repos, remote, session);      
		case "git":
			return remoteStorageLoginForGit(repos, remote, session);      
		default:
			Log.debug("doRemoteStorageLogin unknown remoteStorage protocol:" + remote.protocol);
			break;
		}
		return null;
	}

	private static RemoteStorageSession remoteStorageLoginForSftp(Repos repos, RemoteStorageConfig remote, RemoteStorageSession session) {
    	SFTPUtil sftp = new SFTPUtil(remote.SFTP.userName, remote.SFTP.pwd, remote.SFTP.host, remote.SFTP.port);
        if(sftp.login() == false)
        {
        	Log.debug("doRemoteStorageLogin login failed");
        	return null;
        }
        session.sftp = sftp; 
        return session;
	}
	
	private static RemoteStorageSession remoteStorageLoginForFtp(Repos repos, RemoteStorageConfig remote,
			RemoteStorageSession session) {
    	FtpUtil ftp = new FtpUtil(remote.FTP.userName, remote.FTP.pwd, remote.FTP.host, remote.FTP.port, remote.FTP.charset, remote.FTP.isPassive);
        if(ftp.login() == false)
        {
        	Log.debug("doRemoteStorageLogin login failed");
        	return null;
        }
        session.ftp = ftp; 
        return session;
	}
	

	private static RemoteStorageSession remoteStorageLoginForSmb(Repos repos, RemoteStorageConfig remote,
			RemoteStorageSession session) {
    	SmbUtil smb = new SmbUtil(remote.SMB.userDomain, remote.SMB.userName, remote.SMB.pwd, remote.SMB.host);
        if(smb.login() == false)
        {
        	Log.debug("doRemoteStorageLogin login failed");
        	return null;
        }
        session.smb = smb; 
        return session;
	}
	

	private static RemoteStorageSession remoteStorageLoginForSvn(Repos repos, RemoteStorageConfig remote,
			RemoteStorageSession session) {
		SvnUtil svn = new SvnUtil(remote.SVN.userName, remote.SVN.pwd, remote.SVN.url);
		if(false == svn.login())
		{
			Log.debug("remoteStorageLoginForSvn() svnUtil.Init Failed");
			return null;
		}
		
        session.svn = svn; 
        return session;
	}

	private static RemoteStorageSession remoteStorageLoginForGit(Repos repos, RemoteStorageConfig remote,
			RemoteStorageSession session) {
		GitUtil git = new GitUtil(remote.GIT.userName, remote.GIT.pwd, remote.GIT.privateKey, remote.GIT.url, remote.GIT.localVerReposPath, remote.GIT.isRemote);
		if(false == git.login())
		{
			Log.debug("remoteStorageLoginForGit() gitUtil.Init Failed");
			return null;
		}
		
        session.git = git; 
        return session;
	}

	private static RemoteStorageSession remoteStorageLoginForMxsDoc(Repos repos, RemoteStorageConfig remote, RemoteStorageSession session) {
        MxsDocUtil mxsdoc = new MxsDocUtil(remote.MXSDOC.userName, remote.MXSDOC.pwd, remote.MXSDOC.url, remote.MXSDOC.reposId, remote.MXSDOC.remoteDirectory);
        if(mxsdoc.login() == false)
        {
        	Log.debug("doRemoteStorageLogin login failed");
        	return null;
        }
        session.mxsdoc = mxsdoc;
		return session;
	}

	protected static boolean doRemoteStorageLogout(RemoteStorageSession session) {
		switch(session.protocol)
		{
		case "file":
			return true;
		case "sftp":
            session.sftp.logout();
            session.sftp = null;
            return true;
		case "ftp":
            session.ftp.logout();
            session.ftp = null;
            return true;
		case "smb":
            session.smb.logout();
            session.smb = null;
            return true;
		case "svn":
            session.svn.logout();
            session.svn = null;
            return true;
		case "git":
            session.git.logout();
            session.git = null;
            return true;
		case "mxsdoc":
            session.mxsdoc.logout();
            session.mxsdoc = null;
            return true;
		default:
			Log.debug("doRemoteStorageLogout unknown remoteStorage protocol:" + session.protocol);
			break;
		}
		return false;
	}

	protected boolean doPullEntryFromRemoteStorageForDownload(RemoteStorageSession session, RemoteStorageConfig remote, 
			Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, String commitId, Integer subEntryPullFlag, boolean force, 
			DocAuth curDocAuth, HashMap<Long, DocAuth> docAuthHashMap, 
			DocPullResult pullResult) 
	{
		if(curDocAuth == null || curDocAuth.getDownloadEn() == null || curDocAuth.getDownloadEn() != 1)
		{
			Log.debug("doPullEntryFromRemoteStorageForDownload() have no right to download [" + doc.getPath() + doc.getName() + "]");
			return false;
		}
		
		if(doc.getDocId() == 0)	//For root dir, go syncUpSubDocs
		{
			Log.debug("doPullEntryFromRemoteStorageForDownload() 拉取根目录");
			return doPullSubEntriesFromRemoteStorageForDownload(session, remote, repos, doc, commitId, subEntryPullFlag, force, curDocAuth, docAuthHashMap, pullResult);					
		}
		
		boolean ret = false;		
		DocChangeType localChangeType = getLocalDocChangeType(dbDoc, localDoc);
		DocChangeType remoteChangeType = getRemoteDocChangeType(dbDoc, remoteDoc);
		
		Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " localChangeType:" + localChangeType + " remoteChangeType:" + remoteChangeType);

		//本地未改动（如果不是强制手动拉取，那么只能拉取新增的文件或目录）
		if(localChangeType == DocChangeType.NOCHANGE)
		{
			//远程有改动
			if(remoteChangeType != DocChangeType.NOCHANGE)
			{
				if(remoteChangeType == DocChangeType.REMOTEADD)
				{
					Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " 本地未改动，远程新增，拉取");
					ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);
				}
				else if(force == true)
				{
					if(remoteChangeType == DocChangeType.REMOTECHANGE)
					{
						Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " 本地未改动，远程改动，强制拉取模式，拉取");
						ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);						
					}
					else if(remoteChangeType == DocChangeType.REMOTEDELETE)
					{
						Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " 本地未改动, 远程删除, 强制拉取模式， 拉取");
						ret = remoteStoragePullEntry(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);
					}
					else if(remoteChangeType == DocChangeType.REMOTEDIRTOFILE)
					{
						Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " 本地未改动，远程目录->文件，强制拉取模式，拉取");							
						ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);						
					}
					else if(remoteChangeType == DocChangeType.REMOTEDIRTOFILE)
					{
						Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " 本地未改动，远程文件->目录，强制拉取模式，拉取");
						ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);
					}
				}
				else
				{
					Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " 本地未改动，远程改动，非强制拉取模式，不拉取");
				}
			}
			else
			{
				Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " 远程未改动，本地未改动");
				ret = true;
			}
			
			//pullSubEntries
			if(ret == true && remoteDoc != null && remoteDoc.getType() != null && remoteDoc.getType() == 2)
			{
				doPullSubEntriesFromRemoteStorageForDownload(session, remote, repos, doc, commitId, subEntryPullFlag, force, curDocAuth, docAuthHashMap, pullResult);					
			}
			return true;
		}
		
		//本地改动（强制拉取）
		if(force == true) 
		{
			remoteChangeType = getRemoteDocChangeTypeWithLocalDoc(remoteDoc, localDoc);
			if(remoteChangeType == DocChangeType.REMOTEADD)
			{
				Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " 本地未改动，远程新增，强制拉取模式，拉取");
				ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);
			}
			else if(remoteChangeType == DocChangeType.REMOTECHANGE)
			{
				Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " 本地改动, 远程改动, 强制拉取模式, 拉取");
				return remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);
			}
			else if(remoteChangeType == DocChangeType.REMOTEDELETE)
			{
				Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " 本地改动, 远程删除, 强制拉取模式，拉取");
				ret = remoteStoragePullEntry(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);					
			}
			else if(remoteChangeType == DocChangeType.REMOTEDIRTOFILE)
			{
				Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " 本地改动, 远程目录->文件, 强制拉取模式，拉取");
				ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);					
			}
			else if(remoteChangeType == DocChangeType.REMOTEFILETODIR)
			{
				Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " 本地改动, 远程文件->目录, 强制拉取模式，拉取");
				ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);					
			}
			else if(remoteChangeType == DocChangeType.NOCHANGE)
			{
				if(remoteDoc == null)
				{
					Log.debug("doPullEntryFromRemoteStorageForDownload 本地删除，远程删除，直接删除DBEntry");
					if(dbDoc != null)
					{
						deleteRemoteStorageDBEntry(repos, dbDoc, remote);
					}
					ret = true;
				}	
			}
			
			if(ret == true && remoteDoc != null && remoteDoc.getType() != null && remoteDoc.getType() == 2)
			{
				doPullSubEntriesFromRemoteStorageForDownload(session, remote, repos, doc, commitId, subEntryPullFlag, force, curDocAuth, docAuthHashMap, pullResult);
			}
		}		
		else
		{
			Log.debug("doPullEntryFromRemoteStorageForDownload " +doc.getPath() + doc.getName()+ " 本地改动, 远程改动, 非强制拉取模式，不拉取");
			return true;		
		}
		return ret;		
	}
	
	protected boolean doPullEntryFromRemoteStorage(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, String commitId, Integer subEntryPullFlag, boolean force, DocPullResult pullResult) {
		
		if(doc.getDocId() == 0)	//For root dir, go syncUpSubDocs
		{
			Log.info("doPullEntryFromRemoteStorage() 拉取根目录");
			return doPullSubEntriesFromRemoteStorage(session, remote, repos, doc, commitId, subEntryPullFlag, force, pullResult);					
		}
		
		boolean ret = false;		
		DocChangeType localChangeType = getLocalDocChangeType(dbDoc, localDoc);
		DocChangeType remoteChangeType = getRemoteDocChangeType(dbDoc, remoteDoc);
		
		Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " localChangeType:" + localChangeType + " remoteChangeType:" + remoteChangeType);

		//本地未改动（如果不是强制手动拉取，那么只能拉取新增的文件或目录）
		if(localChangeType == DocChangeType.NOCHANGE)
		{
			//远程有改动
			if(remoteChangeType != DocChangeType.NOCHANGE)
			{
				if(remoteChangeType == DocChangeType.REMOTEADD)
				{
					Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " 本地未改动，远程新增，拉取");
					ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);
				}
				else if(force == true)
				{
					if(remoteChangeType == DocChangeType.REMOTECHANGE)
					{
						Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " 本地未改动，远程改动，强制拉取模式，拉取");
						ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);						
					}
					else if(remoteChangeType == DocChangeType.REMOTEDELETE)
					{
						Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " 本地未改动, 远程删除, 强制拉取模式， 拉取");
						ret = remoteStoragePullEntry(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);
					}
					else if(remoteChangeType == DocChangeType.REMOTEDIRTOFILE)
					{
						Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " 本地未改动，远程目录->文件，强制拉取模式，拉取");							
						ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);						
					}
					else if(remoteChangeType == DocChangeType.REMOTEDIRTOFILE)
					{
						Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " 本地未改动，远程文件->目录，强制拉取模式，拉取");
						ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);
					}
				}
				else
				{
					Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " 本地未改动，远程改动，非强制拉取模式，不拉取");
				}
			}
			else
			{
				Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " 远程未改动，本地未改动");
				ret = true;
			}
			
			//pullSubEntries
			if(ret == true && remoteDoc != null && remoteDoc.getType() != null && remoteDoc.getType() == 2)
			{
				Log.debug("doPullEntryFromRemoteStorage [" +doc.getPath() + doc.getName()+ "] 拉取子目录");
				doPullSubEntriesFromRemoteStorage(session, remote, repos, doc, commitId, subEntryPullFlag, force, pullResult);					
			}
			return true;
		}
		
		//本地改动（强制拉取）
		if(force == true) 
		{
			remoteChangeType = getRemoteDocChangeTypeWithLocalDoc(remoteDoc, localDoc);
			if(remoteChangeType == DocChangeType.REMOTEADD)
			{
				Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " 本地未改动，远程新增，强制拉取模式，拉取");
				ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);
			}
			else if(remoteChangeType == DocChangeType.REMOTECHANGE)
			{
				Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " 本地改动, 远程改动, 强制拉取模式, 拉取");
				return remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);
			}
			else if(remoteChangeType == DocChangeType.REMOTEDELETE)
			{
				Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " 本地改动, 远程删除, 强制拉取模式，拉取");
				ret = remoteStoragePullEntry(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);					
			}
			else if(remoteChangeType == DocChangeType.REMOTEDIRTOFILE)
			{
				Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " 本地改动, 远程目录->文件, 强制拉取模式，拉取");
				ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);					
			}
			else if(remoteChangeType == DocChangeType.REMOTEFILETODIR)
			{
				Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " 本地改动, 远程文件->目录, 强制拉取模式，拉取");
				ret = remoteStoragePullEntry(session, remote, repos, remoteDoc, dbDoc, localDoc, remoteDoc, commitId, pullResult, remoteChangeType);					
			}
			else if(remoteChangeType == DocChangeType.NOCHANGE)
			{
				if(remoteDoc == null)
				{
					Log.debug("doPullEntryFromRemoteStorage 本地删除，远程删除，直接删除DBEntry");
					if(dbDoc != null)
					{
						deleteRemoteStorageDBEntry(repos, dbDoc, remote);
					}
				}
				ret = true;
			}
			
			if(ret == true && remoteDoc != null && remoteDoc.getType() != null && remoteDoc.getType() == 2)
			{
				Log.debug("doPullEntryFromRemoteStorage [" +doc.getPath() + doc.getName()+ "] 拉取子目录");
				doPullSubEntriesFromRemoteStorage(session, remote, repos, doc, commitId, subEntryPullFlag, force, pullResult);
			}
		}		
		else
		{
			Log.debug("doPullEntryFromRemoteStorage " +doc.getPath() + doc.getName()+ " 本地改动, 远程改动, 非强制拉取模式，不拉取");
			return true;		
		}
		return ret;		
	}
	

	protected boolean doPushEntryToRemoteStorage(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc,User accessUser, Integer subEntryPushFlag, 
			DocPushResult pushResult, List<CommitAction> actionList, boolean isSubAction, int pushType) {
		
		Log.printObject("doPushEntryToRemoteStorage() doc:", doc);		
		Log.printObject("doPushEntryToRemoteStorage() localDoc:", localDoc);
		Log.printObject("doPushEntryToRemoteStorage() dbDoc:", dbDoc);
		Log.printObject("doPushEntryToRemoteStorage() remoteDoc:", remoteDoc);
				
		//ignore check
		if(doc.isRemotePushEnabled == null)
		{
			doc.isRemotePushEnabled = isRemotePushEnabled(remote, doc, null);
	    }
		if(doc.isRemotePushEnabled == 0)
		{
    		Log.info("doPushEntryToRemoteStorage() [" + doc.getPath() + doc.getName() + "] was ignored  for RemotePush");
			return false;
		}
		
		if(doc.getDocId() == 0)	//For root dir, go syncUpSubDocs
		{
			Log.info("doPushEntryToRemoteStorage() 推送根目录");
			return doPushSubEntriesToRemoteStorage(session, remote, repos, doc, accessUser, subEntryPushFlag, pushResult, actionList, isSubAction, pushType);			
		}
		
		//get the localChangeType
		DocChangeType localChangeType = DocChangeType.NOCHANGE;	
		DocChangeType remoteChangeType = DocChangeType.NOCHANGE;
		DocChangeType realLocalChangeType = DocChangeType.NOCHANGE;
		switch(pushType)
		{
		case 1:	//localChangeOnly
			localChangeType = getLocalDocChangeType(dbDoc, localDoc);

			//get realLocalChangeType
			if(localChangeType != DocChangeType.NOCHANGE)
			{
				realLocalChangeType = getLocalDocChangeTypeWithRemoteDoc(localDoc, remoteDoc);
				Log.debug("doPushEntryToRemoteStorage [" +doc.getPath() + doc.getName()+ "] realLocalChangeType[" + realLocalChangeType + "] localChangeType[" + localChangeType + "]");
			}
			break;
		case 2: //localChangeOnly and treatRevisionNullAsLocalChange
			localChangeType = getLocalDocChangeType(dbDoc, localDoc);
			if(localChangeType != DocChangeType.NOCHANGE)
			{
				realLocalChangeType = getLocalDocChangeTypeWithRemoteDoc(localDoc, remoteDoc);
				Log.debug("doPushEntryToRemoteStorage [" +doc.getPath() + doc.getName()+ "] realLocalChangeType[" + realLocalChangeType + "] localChangeType[" + localChangeType + "]");
			}
			else	//no local Change
			{
				if(dbDoc != null && (dbDoc.getRevision() == null || dbDoc.getRevision().isEmpty()))
				{
					//treatRevisionNullAsLocalChange
					realLocalChangeType = getLocalDocChangeTypeWithRemoteDoc(localDoc, remoteDoc);
					Log.debug("doPushEntryToRemoteStorage [" +doc.getPath() + doc.getName()+ "] realLocalChangeType[" + realLocalChangeType + "] localChangeType[" + localChangeType + "] treatRevisionNullAsLocalChange");
				}
			}
			break;
		case 3:	//push LocalAddOnly
			localChangeType = getLocalDocChangeTypeWithRemoteDoc(localDoc, remoteDoc);
			if(localChangeType == DocChangeType.LOCALADD)
			{
				realLocalChangeType = localChangeType;
				Log.debug("doPushEntryToRemoteStorage [" +doc.getPath() + doc.getName()+ "] realLocalChangeType[" + realLocalChangeType + "] localChangeType[" + localChangeType + "] pushLocalAddOnly");
			}	
			break;
		case 4: //Force Push localChanged Doc or remote Changed 
			localChangeType = getLocalDocChangeType(dbDoc, localDoc);				
			if(localChangeType != DocChangeType.NOCHANGE)
			{
				realLocalChangeType = getLocalDocChangeTypeWithRemoteDoc(localDoc, remoteDoc);				
				Log.debug("doPushEntryToRemoteStorage [" +doc.getPath() + doc.getName()+ "] realLocalChangeType[" + realLocalChangeType + "] localChangeType[" + localChangeType + "]");
			}
			else
			{
				//treatRemoteChangesAsLocalChange				
				remoteChangeType = getRemoteDocChangeType(dbDoc, remoteDoc);
				if(remoteChangeType != DocChangeType.NOCHANGE)
				{
					realLocalChangeType = getLocalDocChangeTypeWithRemoteDoc(localDoc, remoteDoc);
					Log.debug("doPushEntryToRemoteStorage [" +doc.getPath() + doc.getName()+ "] realLocalChangeType[" + realLocalChangeType + "] remoteChangeType[" + remoteChangeType + "] localChangeType[" + localChangeType + "] treatRemoteChangesAsLocalChange");
				}
			}
			break;
		}
		
		boolean ret = false;
		switch(realLocalChangeType)
		{
		case LOCALADD:
			Log.debug("doPushEntryToRemoteStorage " +doc.getPath() + doc.getName()+ " 本地新增, 推送");
			ret = remoteStoragePushEntry(session, remote, repos, localDoc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, localChangeType, actionList, isSubAction);
			break;
		case LOCALCHANGE:
			Log.debug("doPushEntryToRemoteStorage " +doc.getPath() + doc.getName()+ " 本地改动, 推送");
			ret = remoteStoragePushEntry(session, remote, repos, localDoc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, localChangeType, actionList, isSubAction);
		case LOCALDELETE:
			Log.debug("doPushEntryToRemoteStorage " +doc.getPath() + doc.getName()+ " 本地删除, 推送");
			ret = remoteStoragePushEntry(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, localChangeType, actionList, isSubAction);					
			break;
		case LOCALDIRTOFILE:
			Log.debug("doPushEntryToRemoteStorage " +doc.getPath() + doc.getName()+ " 本地目录->文件, 推送");
			ret = remoteStoragePushEntry(session, remote, repos, localDoc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, localChangeType, actionList, isSubAction);					
			break;
		case LOCALFILETODIR:
			Log.debug("doPushEntryToRemoteStorage " +doc.getPath() + doc.getName()+ " 本地文件->目录, 推送");
			ret = remoteStoragePushEntry(session, remote, repos, localDoc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, localChangeType, actionList, isSubAction);
			break;
		case NOCHANGE:
			if(localDoc == null)
			{
				Log.debug("doPushEntryToRemoteStorage 本地删除，远程删除，直接删除DBEntry");
				if(dbDoc != null)
				{
					deleteRemoteStorageDBEntry(repos, dbDoc, remote);
				}
				ret = true;
			}	
			break;
		default:
			break;
		}
		
		if(ret == true && localDoc != null && localDoc.getType() != null && localDoc.getType() == 2)
		{
			CommitAction action = pushResult.action;
			if(action != null)	//it is new add dir
			{
				ArrayList<CommitAction> subActionList = new ArrayList<CommitAction>();
				doPushSubEntriesToRemoteStorage(session, remote, repos, localDoc, accessUser, subEntryPushFlag, pushResult, subActionList, true, pushType);	
				if(subActionList.size() > 0)
				{
					action.setSubActionList(subActionList);
				}
			}
			else
			{
				doPushSubEntriesToRemoteStorage(session, remote, repos, localDoc, accessUser, subEntryPushFlag, pushResult, actionList, isSubAction, pushType);						
			}
		}
		return ret;		
	}
	
	private boolean doPullSubEntriesFromRemoteStorage(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId, Integer subEntryPullFlag, boolean force, DocPullResult pullResult) {
		//子目录不递归
		if(subEntryPullFlag == 0)
		{
			return true;
		}
		
		//子目录递归不继承
		if(subEntryPullFlag == 1)
		{
			subEntryPullFlag = 0;
		}
		
		List<Doc> remoteList = getRemoteStorageEntryList(session, remote, repos, doc, commitId);
		if(remoteList == null)
		{
			Log.info("doPullSubEntriesFromRemoteStorage() getRemoteStorageEntryList return null for:" + doc.getPath() + doc.getName());			
			return false;
		}
		
		HashMap<String, Doc> dbHashMap = getRemoteStorageDBHashMap(repos, doc, remote);
		HashMap<String, Doc>  localHashMap = getLocalEntryHashMap(repos, doc);
		
		for(int i=0; i<remoteList.size(); i++)
		{
			Doc subRemoteDoc = remoteList.get(i);
			//Log.println("doPullSubEntriesFromRemoteStorage subDocName:" + subRemoteDoc.getName());
			Doc subDbDoc = dbHashMap.get(subRemoteDoc.getName());
			Doc subLocalDoc = localHashMap.get(subRemoteDoc.getName());
			doPullEntryFromRemoteStorage(session, remote, repos, subRemoteDoc, subDbDoc, subLocalDoc, subRemoteDoc, commitId, subEntryPullFlag, force, pullResult);
			if(subDbDoc != null)
			{
				dbHashMap.remove(subDbDoc.getName());
			}
		}
		
		//The entries remained in dbHashMap is the docs which have been deleted on remote server
		for (Doc subDbDoc : dbHashMap.values()) {
			Log.debug("doPullSubEntriesFromRemoteStorage() delete:" + subDbDoc.getPath() + subDbDoc.getName());			
			Doc subLocalDoc = localHashMap.get(subDbDoc.getName());
			doPullEntryFromRemoteStorage(session, remote, repos, subDbDoc, subDbDoc, subLocalDoc, null, commitId, subEntryPullFlag, force, pullResult);
		}	
		return true;
	}
	
	private boolean doPullSubEntriesFromRemoteStorageForDownload(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId, Integer subEntryPullFlag, boolean force,  DocAuth curDocAuth, HashMap<Long, DocAuth> docAuthHashMap, DocPullResult pullResult) {
		//子目录不递归
		if(subEntryPullFlag == 0)
		{
			return true;
		}
		
		//子目录递归不继承
		if(subEntryPullFlag == 1)
		{
			subEntryPullFlag = 0;
		}
		
		List<Doc> remoteList = getRemoteStorageEntryList(session, remote, repos, doc, commitId);
		if(remoteList == null)
		{
			return false;
		}
		
		HashMap<String, Doc> dbHashMap = getRemoteStorageDBHashMap(repos, doc, remote);
		HashMap<String, Doc>  localHashMap = getLocalEntryHashMap(repos, doc);
		
		for(int i=0; i<remoteList.size(); i++)
		{
			Doc subRemoteDoc = remoteList.get(i);
			//Log.println("doPullSubEntriesFromRemoteStorage subDocName:" + subRemoteDoc.getName());
			Doc subDbDoc = dbHashMap.get(subRemoteDoc.getName());
			Doc subLocalDoc = localHashMap.get(subRemoteDoc.getName());
			DocAuth subDocAuth = getDocAuthFromHashMap(subRemoteDoc.getDocId(), curDocAuth, docAuthHashMap);
			doPullEntryFromRemoteStorageForDownload(session, remote, repos, subRemoteDoc, subDbDoc, subLocalDoc, subRemoteDoc, commitId, subEntryPullFlag, force, subDocAuth, docAuthHashMap, pullResult);
			if(subDbDoc != null)
			{
				dbHashMap.remove(subDbDoc.getName());
			}
		}
		
		//The entries remained in dbHashMap is the docs which have been deleted on remote server
		for (Doc subDbDoc : dbHashMap.values()) {
			Log.debug("doPullSubEntriesFromRemoteStorage() delete:" + subDbDoc.getPath() + subDbDoc.getName());			
			Doc subLocalDoc = localHashMap.get(subDbDoc.getName());
			DocAuth subDocAuth = getDocAuthFromHashMap(subLocalDoc.getDocId(), curDocAuth, docAuthHashMap);
			doPullEntryFromRemoteStorageForDownload(session, remote, repos, subDbDoc, subDbDoc, subLocalDoc, null, commitId, subEntryPullFlag, force, subDocAuth, docAuthHashMap, pullResult);
		}	
		return true;
	}
	
	//actionList and isSubAction is for Gvn/Git RemoteStorage
	private boolean doPushSubEntriesToRemoteStorage(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, User accessUser, Integer subEntryPushFlag, 
			DocPushResult pushResult, List<CommitAction> actionList, boolean isSubAction, int pushType) 
	{		
		Log.info("doPushSubEntriesToRemoteStorage() doc:[" + doc.getPath() + doc.getName() + "]");

		//子目录不递归
		if(subEntryPushFlag == 0)
		{
			return true;
		}
		
		//子目录递归不继承
		if(subEntryPushFlag == 1)
		{
			subEntryPushFlag = 0;
		}
		
		List<Doc> localList = getLocalEntryList(repos, doc);
		if(localList == null)
		{
			Log.info("doPushSubEntriesToRemoteStorage() getLocalEntryList return null for:" + doc.getPath() + doc.getName());			
			return false;
		}
		
		HashMap<String, Doc> dbHashMap = getRemoteStorageDBHashMap(repos, doc, remote);
		
		//注意：remoteHashMap是必须获取的，即使是localChangeOnly也需要remoteDoc来确定真实的提交类型
		HashMap<String, Doc>  remoteHashMap = getRemoteStorageEntryHashMap(session, remote, repos, doc, null);
		
		//TODO: 目前的推送有个问题，已删除的文件因为不在localList中，因此永远都是无法删除的（解决方法就是遍历一次dbDocList将不在localList中的文件都删除）
		for(int i=0; i<localList.size(); i++)
		{
			Doc subLocalDoc  = localList.get(i);
			Doc subDbDoc = dbHashMap.get(subLocalDoc.getName());
			Doc subRemoteDoc = remoteHashMap.get(subLocalDoc.getName());			
			subLocalDoc.isRemotePushEnabled = isRemotePushEnabled(remote, subLocalDoc, doc); //set isRemotePushEnabled
			doPushEntryToRemoteStorage(session, remote, repos, subLocalDoc, subDbDoc, subLocalDoc, subRemoteDoc, accessUser, subEntryPushFlag, pushResult, actionList, isSubAction, pushType);
			if(subDbDoc != null)
			{
				dbHashMap.remove(subDbDoc.getName());
			}
		}
		
		//The entries remained in dbHashMap is the docs which have been deleted
		for (Doc subDbDoc : dbHashMap.values()) {
			Log.debug("doPushSubEntriesToRemoteStorage() delete:" + subDbDoc.getPath() + subDbDoc.getName());			
			Doc subRemoteDoc = remoteHashMap.get(subDbDoc.getName());	
			subDbDoc.isRemotePushEnabled = isRemotePushEnabled(remote, subDbDoc, doc); //set isRemotePushEnabled
			doPushEntryToRemoteStorage(session, remote, repos, subDbDoc, subDbDoc, null, subRemoteDoc, accessUser, subEntryPushFlag, pushResult, actionList, isSubAction, pushType);
		}	
		
		return true;
	}

	private static boolean remoteStoragePushEntry(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, User accessUser, DocPushResult pushResult,
			DocChangeType localChangeType, List<CommitAction> actionList, boolean isSubAction) {
		
		//Log.printObject("remoteStoragePushEntry() doc:", doc);
		//Log.printObject("remoteStoragePushEntry() dbDoc:", dbDoc);
		//Log.printObject("remoteStoragePushEntry() localDoc:", localDoc);
		//Log.printObject("remoteStoragePushEntry() remoteDoc:", remoteDoc);
		
		boolean ret = false;
		pushResult.action = null;	//清空action,只能在新增Dir成功的时候被设置
		
		switch(localChangeType)
		{
		case LOCALCHANGE:
			ret = remoteStorageUploadFile(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, actionList, isSubAction);
			break;
		case LOCALADD:
			ret = remoteStorageAddEntry(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, actionList, isSubAction);
			break;
		case LOCALDELETE:
			ret = remoteStorageDeleteEntry(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, actionList, isSubAction);
			break;
		case LOCALFILETODIR:
			ret = remoteStorageChangeFileToDir(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, actionList, isSubAction);
			break;
		case LOCALDIRTOFILE:
			ret = remoteStorageChangeDirToFile(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, actionList, isSubAction);
			break;
		default:
			break;						
		}
		return ret;
	}
	
	private static boolean remoteStoragePullEntry(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, String commitId, DocPullResult pullResult, 
			DocChangeType remoteChangeType) 
	{
		boolean ret = false;
		switch(remoteChangeType)
		{
		case REMOTECHANGE:
			ret = remoteStorageDownloadFile(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, pullResult, commitId);
			break;
		case REMOTEADD:
			ret = remoteStorageAddLocalEntry(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, pullResult);
			break;
		case REMOTEDELETE:
			ret = remoteStorageDeleteLocalEntry(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, pullResult);
			break;
		case REMOTEFILETODIR:
			ret = remoteStorageChangeLocalFileToDir(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, pullResult);
			break;
		case REMOTEDIRTOFILE:
			ret = remoteStorageChangeLocalDirToFile(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, pullResult);
			break;
		default:
			break;						
		}
		return ret;
	}

	private static boolean remoteStorageChangeLocalDirToFile(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, DocPullResult pullResult) {
		if(remoteStorageDeleteLocalEntry(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, pullResult) == true)
		{
			return remoteStorageDownloadFile(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, pullResult, null);
		}
		return false;
	}

	private static boolean remoteStorageChangeLocalFileToDir(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, DocPullResult pullResult) {
		if(remoteStorageDeleteLocalEntry(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, pullResult) == true)
		{
			return remoteStorageAddLocalEntry(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, pullResult);
		}
		return false;
	}

	private static boolean remoteStorageChangeDirToFile(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc,
			User accessUser, DocPushResult pushResult, List<CommitAction> actionList, boolean isSubAction) {
		
		if(deleteEntryFromRemoteStorage(session, remote, repos, remoteDoc, pushResult, actionList, isSubAction) == true)
		{
			return remoteStorageAddFile(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, actionList, isSubAction);
		}
		return false;
	}

	private static boolean remoteStorageChangeFileToDir(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc,
			User accessUser, DocPushResult pushResult, List<CommitAction> actionList, boolean isSubAction) {
		if(deleteEntryFromRemoteStorage(session, remote, repos, remoteDoc, pushResult, actionList, isSubAction) == true)
		{
			return remoteStorageAddDir(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, actionList, isSubAction);
		}
		return false;
	}

	private static boolean remoteStorageDeleteEntry(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc,
			User accessUser, DocPushResult pushResult, List<CommitAction> actionList, boolean isSubAction) {
		boolean ret = false;
		
		pushResult.totalCount ++;

		ret = deleteEntryFromRemoteStorage(session, remote, repos, remoteDoc, pushResult, actionList, ret);
		if(ret == true)
		{
			//版本仓库还需要commit，这里不是标志成功的地方
			if(remote.isVerRepos == false)
			{			
				pushResult.successCount ++;	
				if(dbDoc != null)
				{
					deleteRemoteStorageDBEntry(repos, doc, remote);
				}
			}
		}
		else
		{
			pushResult.failCount ++;
		}
		return ret;
	}

	private static boolean remoteStorageDownloadFile(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, DocPullResult pullResult, String commitId) 
	{
		boolean ret = false;
		pullResult.totalCount ++;
		ret = downloadFileFromRemoteStorage(session, remote, repos, doc, commitId);
		if(ret == true)
		{
			pullResult.successCount ++;
			pullResult.successDocList.add(doc);
			if(session.indexUpdateEn)
			{
				//add or update DB
				Doc newLocalDoc = fsGetDoc(repos, doc);
				doc.setSize(newLocalDoc.getSize());
				doc.setLatestEditTime(newLocalDoc.getLatestEditTime());
				if(dbDoc == null)
				{
					addRemoteStorageDBEntry(repos, doc, remote);
				}
				else
				{
					updateRemoteStorageDBEntry(repos, doc, remote);
				}
			}
		}
		else
		{
			pullResult.failCount ++;
		}
		return ret;
	}
	
	private static boolean remoteStorageAddLocalEntry(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, DocPullResult pullResult) 
	{
		if(doc.getType() == 1)
		{
			return remoteStorageDownloadFile(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, pullResult, null);
		}
		return remoteStorageAddLocalDir(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, pullResult);
	}
	
	private static boolean remoteStorageAddLocalDir(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, DocPullResult pullResult) 
	{
		boolean ret = false;
		pullResult.totalCount ++;
		
		ret = FileUtil.createDir(doc.getLocalRootPath() + doc.getPath() + doc.getName());
		if(ret == true)
		{
			pullResult.successCount ++;
			pullResult.successDocList.add(doc);
			if(session.indexUpdateEn)
			{
				if(dbDoc == null)
				{
					addRemoteStorageDBEntry(repos, doc, remote);
				}
				else
				{
					updateRemoteStorageDBEntry(repos, doc, remote);
				}
			}
		}
		else
		{
			pullResult.failCount ++;		
		}
		return ret;
	}
	
	private static boolean remoteStorageDeleteLocalEntry(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, DocPullResult pullResult) 
	{
		boolean ret = false;
		pullResult.totalCount ++;
		
		ret = FileUtil.delFileOrDir(doc.getLocalRootPath() + doc.getPath() + doc.getName());
		if(ret == true)
		{
			pullResult.successCount ++;
			pullResult.successDocList.add(doc);	
			if(session.indexUpdateEn)
			{
				deleteRemoteStorageDBEntry(repos, doc, remote);
			}
		}
		else
		{
			pullResult.failCount ++;		
		}
		return ret;
	}
	
	private static boolean remoteStorageUploadFile(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, User accessUser, DocPushResult pushResult, List<CommitAction> actionList, boolean isSubAction) {
		boolean ret = false;
		pushResult.totalCount ++;

		ret = uploadFileToRemoteStorage(session, remote, repos, doc, pushResult, actionList, ret);
		if(ret == true)
		{
			//版本仓库还需要commit，这里不是标志成功的地方
			if(remote.isVerRepos == false)
			{			
				//获取并更新remoteDoc Info
				Doc newRemoteDoc = remoteStorageGetEntry(session, remote, repos, doc, null);
				if(newRemoteDoc != null && newRemoteDoc.getType() != 0)
				{
					pushResult.successCount ++;
	
					
					doc.setRevision(newRemoteDoc.getRevision());
					if(dbDoc == null)
					{
						addRemoteStorageDBEntry(repos, doc, remote);
					}
					else
					{
						updateRemoteStorageDBEntry(repos, doc, remote);
					}
				}
				else
				{
					pushResult.failCount ++;					
				}
			}
			else
			{
				pushResult.successCount ++;
			}
		}
		else
		{
			pushResult.failCount ++;
		}
		return ret;
	}
	
	private static boolean remoteStorageAddFile(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, User accessUser,
			DocPushResult pushResult, List<CommitAction> actionList, boolean isSubAction) {
		boolean ret = false;
		pushResult.totalCount ++;

		
		ret = addFileToRemoteStorage(session, remote, repos, doc, pushResult, actionList, ret);
		if(ret == true)
		{
			//版本仓库还需要commit，这里不是标志成功的地方
			if(remote.isVerRepos == false)
			{
				//获取并更新remoteDoc Info
				Doc newRemoteDoc = remoteStorageGetEntry(session, remote, repos, doc, null);
				if(newRemoteDoc != null && newRemoteDoc.getType() != 0)
				{
					pushResult.successCount ++;
	
					doc.setRevision(newRemoteDoc.getRevision());
					if(dbDoc == null)
					{
						addRemoteStorageDBEntry(repos, doc, remote);
					}
					else
					{
						updateRemoteStorageDBEntry(repos, doc, remote);
					}
				}
				else
				{
					pushResult.failCount ++;					
				}
			}
			else
			{
				pushResult.successCount ++;
			}
		}
		else
		{
			pushResult.failCount ++;
		}
		return ret;
	}


	private static boolean remoteStorageAddDir(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, User accessUser,
			DocPushResult pushResult, List<CommitAction> actionList, boolean isSubAction) {
		boolean ret = false;
		pushResult.totalCount ++;

		ret = addDirToRemoteStorage(session, remote, repos, doc, pushResult, actionList, isSubAction);
		if(ret == true)
		{
			//版本仓库还需要commit，这里不是标志成功的地方
			if(remote.isVerRepos == false)
			{
				//获取并更新remoteDoc Info
				Doc newRemoteDoc = remoteStorageGetEntry(session, remote, repos, doc, null);
				if(newRemoteDoc != null && newRemoteDoc.getType() != 0)
				{
					pushResult.successCount ++;
					doc.setRevision(newRemoteDoc.getRevision());
					if(dbDoc == null)
					{
						addRemoteStorageDBEntry(repos, doc, remote);
					}
					else
					{
						updateRemoteStorageDBEntry(repos, doc, remote);
					}
				}
				else
				{
					pushResult.failCount ++;					
				}
			}
			else
			{
				pushResult.successCount ++;
			}
		}
		else
		{
			pushResult.failCount ++;
		}
		return ret;
	}
	
	private List<LogEntry> remoteStorageGetHistory(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, int maxLogNum) {
		if(remote == null)
		{
			Log.debug("remoteStorageGetHistory remoteStorage for repos " + repos.getId() + " " + repos.getName() + " not configured");
			return null;
		}
		
		switch(remote.protocol)
		{
		case "svn":
			return svnServerGetHistory(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath() + doc.getName(), maxLogNum);
		case "git":
			return gitServerGetHistory(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath() + doc.getName(), maxLogNum);
		default:
			Log.debug("remoteStorageGetHistory protocol:" + remote.protocol + " does not support history");
			break;
		}
		return null;
	}
	
	
	protected List<LogEntry> svnServerGetHistory(RemoteStorageSession session, RemoteStorageConfig remote, String entryPath, int maxLogNum) {
		return session.svn.getHistoryLogs(entryPath, 0, -1, maxLogNum);
	}
	
	protected List<LogEntry> gitServerGetHistory(RemoteStorageSession session, RemoteStorageConfig remote, String entryPath, int maxLogNum) {
		return session.git.getHistoryLogs(entryPath, null, null, maxLogNum);
	}
	

	private List<ChangedItem> remoteStorageGetHistoryDetail(RemoteStorageSession session, RemoteStorageConfig remote,
			Repos repos, Doc doc, String commitId) {
		if(remote == null)
		{
			Log.debug("remoteStorageGetHistoryDetail remoteStorage for repos " + repos.getId() + " " + repos.getName() + " not configured");
			return null;
		}
		
		switch(remote.protocol)
		{
		case "svn":
			return svnServerGetHistoryDetail(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath() + doc.getName(), commitId);
		case "git":
			return gitServerGetHistoryDetail(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath() + doc.getName(), commitId);
		default:
			Log.debug("remoteStorageGetHistory protocol:" + remote.protocol + " does not support history");
			break;
		}
		return null;
	}
	
	protected List<ChangedItem> svnServerGetHistoryDetail(RemoteStorageSession session, RemoteStorageConfig remote, String entryPath, String commitId) 
	{
		return session.svn.getHistoryDetail(entryPath, commitId); 
	}
	
	protected List<ChangedItem> gitServerGetHistoryDetail(RemoteStorageSession session, RemoteStorageConfig remote, String entryPath, String commitId) 
	{
		return session.git.getHistoryDetail(entryPath, commitId);
	}

	private static boolean remoteStorageCopyEntry(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc srcDoc, Doc dstDoc, User accessUser, String commitMsg, ReturnAjax rt, boolean isMove) {
	
		if(remote == null)
		{
			Log.debug("remoteStorageMoveEntry remoteStorage for repos " + repos.getId() + " " + repos.getName() + " not configured");
			return false;
		}
		
		DocPushResult pushResult = new DocPushResult();
		rt.setDataEx(pushResult);
		
		switch(remote.protocol)
		{
		case "file":
			pushResult.revision = "";
			return localDiskCopyEntry(session, remote,  remote.rootPath + srcDoc.offsetPath + srcDoc.getPath(), srcDoc.getName(), remote.rootPath + dstDoc.offsetPath + dstDoc.getPath(), dstDoc.getName(), isMove, srcDoc.getType());
		case "sftp":
			pushResult.revision = "";
			return sftpServerCopyEntry(session, remote,  remote.rootPath + srcDoc.offsetPath + srcDoc.getPath(), srcDoc.getName(), remote.rootPath + dstDoc.offsetPath + dstDoc.getPath(), dstDoc.getName(), isMove, srcDoc.getType());
		case "ftp":
			pushResult.revision = "";			
			return ftpServerCopyEntry(session, remote,  remote.rootPath + srcDoc.offsetPath + srcDoc.getPath(), srcDoc.getName(), remote.rootPath + dstDoc.offsetPath + dstDoc.getPath(), dstDoc.getName(), isMove, srcDoc.getType());
		case "smb":
			pushResult.revision = "";			
			return smbServerCopyEntry(session, remote,  remote.rootPath + srcDoc.offsetPath + srcDoc.getPath(), srcDoc.getName(), remote.rootPath + dstDoc.offsetPath + dstDoc.getPath(), dstDoc.getName(), isMove, srcDoc.getType());
		case "mxsdoc":
			pushResult.revision = "";			
			return mxsDocServerCopyEntry(session, remote,  remote.rootPath + srcDoc.offsetPath + srcDoc.getPath(), srcDoc.getName(), remote.rootPath + dstDoc.offsetPath + dstDoc.getPath(), dstDoc.getName(), isMove, srcDoc.getType());
		case "svn":
			return svnServerCopyEntry(session, remote,  remote.rootPath + srcDoc.offsetPath + srcDoc.getPath(), srcDoc.getName(), remote.rootPath + dstDoc.offsetPath + dstDoc.getPath(), dstDoc.getName(), commitMsg, accessUser.getName(), isMove, srcDoc.getType(), pushResult);
		case "git":
			return gitServerCopyEntry(session, remote,  remote.rootPath + srcDoc.offsetPath + srcDoc.getPath(), srcDoc.getName(), remote.rootPath + dstDoc.offsetPath + dstDoc.getPath(), dstDoc.getName(), commitMsg, accessUser.getName(), isMove, srcDoc.getType(), pushResult);
		default:
			Log.debug("remoteStorageMoveEntry unknown remoteStorage protocol:" + remote.protocol);
			break;
		}
		return false;
	}

	private static boolean gitServerCopyEntry(RemoteStorageSession session, RemoteStorageConfig remote, String srcRemotePath, String srcName, String dstRemotePath, String dstName, String commitMsg, String commitUser, boolean isMove, Integer type, DocPushResult pushResult) {
        Log.debug("gitServerCopyEntry srcRemotePath:" + srcRemotePath + " srcName:" + srcName + " dstRemotePath:" + dstRemotePath + " dstName:" + dstName);
		boolean ret = false;
		try {
			pushResult.revision = session.git.doCopy(srcRemotePath, srcName, dstRemotePath, dstName, commitMsg, commitUser, isMove);
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean svnServerCopyEntry(RemoteStorageSession session, RemoteStorageConfig remote, String srcRemotePath, String srcName, String dstRemotePath, String dstName, String commitMsg, String commitUser, boolean isMove, Integer type, DocPushResult pushResult) {
        Log.debug("svnServerCopyEntry srcRemotePath:" + srcRemotePath + " srcName:" + srcName + " dstRemotePath:" + dstRemotePath + " dstName:" + dstName);
		boolean ret = false;
		try {
			pushResult.revision = session.svn.doCopy(srcRemotePath, srcName, dstRemotePath, dstName, commitMsg, commitUser, isMove);
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}

	private static boolean mxsDocServerCopyEntry(RemoteStorageSession session, RemoteStorageConfig remote, String srcRemotePath, String srcName, String dstRemotePath, String dstName, boolean isMove, Integer type) {
        Log.debug("mxsDocServerCopyEntry srcRemotePath:" + srcRemotePath + " srcName:" + srcName + " dstRemotePath:" + dstRemotePath + " dstName:" + dstName);

        return session.mxsdoc.copy(srcRemotePath, srcName, dstRemotePath, dstName, isMove);	       	
	}

	private static boolean smbServerCopyEntry(RemoteStorageSession session, RemoteStorageConfig remote, String srcRemotePath, String srcName, String dstRemotePath, String dstName, boolean isMove, Integer type) {
        boolean ret = false;
        
        Log.debug("smbServerCopyEntry srcRemotePath:" + srcRemotePath + " srcName:" + srcName + " dstRemotePath:" + dstRemotePath + " dstName:" + dstName);
		try {
 			ret = session.smb.copy(srcRemotePath, srcName, dstRemotePath, dstName, isMove, type);			
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}

	private static boolean ftpServerCopyEntry(RemoteStorageSession session, RemoteStorageConfig remote, String srcRemotePath, String srcName, String dstRemotePath, String dstName, boolean isMove, Integer type) {
        boolean ret = false;
        
        Log.debug("ftpServerCopyEntry srcRemotePath:" + srcRemotePath + " srcName:" + srcName + " dstRemotePath:" + dstRemotePath + " dstName:" + dstName);
		try {
 			ret = session.ftp.copy(srcRemotePath, srcName, dstRemotePath, dstName, isMove, type);			
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}

	private static boolean sftpServerCopyEntry(RemoteStorageSession session, RemoteStorageConfig remote, String srcRemotePath, String srcName, String dstRemotePath, String dstName, boolean isMove, Integer type) {
        boolean ret = false;
        
        Log.debug("sftpServerCopyEntry srcRemotePath:" + srcRemotePath + " srcName:" + srcName + " dstRemotePath:" + dstRemotePath + " dstName:" + dstName);
		try {
 			ret = session.sftp.copy(srcRemotePath, srcName, dstRemotePath, dstName, isMove, type);
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}

	private static boolean localDiskCopyEntry(RemoteStorageSession session, RemoteStorageConfig remote, String srcRemotePath, String srcName, String dstRemotePath, String dstName, boolean isMove, Integer type) {
        boolean ret = false;
        
        Log.debug("downloadFileFromLocalDisk srcRemotePath:" + srcRemotePath + " srcName:" + srcName + " dstRemotePath:" + dstRemotePath + " dstName:" + dstName);
		try {
			if(isMove)
			{
				ret = FileUtil.moveFileOrDir(remote.FILE.localRootPath + srcRemotePath, srcName, remote.FILE.localRootPath + dstRemotePath, dstName, false);
			}
			else
			{
				ret = FileUtil.copyFileOrDir(remote.FILE.localRootPath + srcRemotePath + srcName, remote.FILE.localRootPath + dstRemotePath + dstName, false);				
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}

	private static boolean remoteStorageAddEntry(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, Doc dbDoc, Doc localDoc, Doc remoteDoc, User accessUser, DocPushResult pushResult, List<CommitAction> actionList, boolean isSubAction) {
		if(localDoc.getType() == 1)
		{
			return remoteStorageAddFile(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, actionList, isSubAction);
		}
		
		//locaDoc is dir
		return remoteStorageAddDir(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, accessUser, pushResult, actionList, isSubAction);
	}

	private static boolean downloadFileFromRemoteStorage(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId) {
		if(remote == null)
		{
			Log.debug("downloadFileFromRemoteStorage remoteStorage for repos " + repos.getId() + " " + repos.getName() + " not configured");
			return false;
		}
		
		switch(remote.protocol)
		{
		case "file":
			return downloadFileFromLocalDisk(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "sftp":
			return downloadFileFromSftpServer(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "ftp":
			return downloadFileFromFtpServer(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "smb":
			return downloadFileFromSmbServer(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "mxsdoc":
			return downloadFileFromMxsDocServer(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "svn":
			return downloadFileFromSvnServer(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName(), commitId);
		case "git":
			return downloadFileFromGitServer(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName(), commitId);
		default:
			Log.debug("downloadFileFromRemoteStorage unknown remoteStorage protocol:" + remote.protocol);
			break;
		}
		return false;
	}

	private static boolean uploadFileToRemoteStorage(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, DocPushResult pushResult, List<CommitAction> commitActionList, boolean isSubAction) {
		if(remote == null)
		{
			Log.debug("uploadFileToRemoteStorage remoteStorage for repos " + repos.getId() + " " + repos.getName() + " not configured");
			return false;
		}
		
		
		switch(remote.protocol)
		{
		case "file":
			return uploadFileToLocalDisk(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "sftp":
			return uploadFileToSftpServer(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "ftp":
			return uploadFileToFtpServer(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "smb":
			return uploadFileToSmbServer(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "mxsdoc":
			return uploadFileToMxsDocServer(session, remote,  remote.rootPath + doc.offsetPath + doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "svn":
			return uploadFileToSvnServer(session, remote,  doc, pushResult, commitActionList, isSubAction);
		case "git":
			return uploadFileToGitServer(session, remote,  doc, pushResult, commitActionList, isSubAction);
		default:
			Log.debug("uploadFileToRemoteStorage unknown remoteStorage protocol:" + remote.protocol);
			break;
		}
		return false;
	}

	private static boolean addFileToRemoteStorage(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, DocPushResult pushResult, List<CommitAction> commitActionList, boolean isSubAction) {
		if(remote == null)
		{
			Log.debug("addFileToRemoteStorage remoteStorage for repos " + repos.getId() + " " + repos.getName() + " not configured");
			return false;
		}
		
		
		switch(remote.protocol)
		{
		case "file":
			return uploadFileToLocalDisk(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "sftp":
			return uploadFileToSftpServer(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "ftp":
			return uploadFileToFtpServer(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "smb":
			return uploadFileToSmbServer(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "mxsdoc":
			return uploadFileToMxsDocServer(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName());
		case "svn":
			return addFileToSvnServer(session, remote,  doc, pushResult, commitActionList, isSubAction);
		case "git":
			return addFileToGitServer(session, remote,  doc, pushResult, commitActionList, isSubAction);
		default:
			Log.debug("addFileToRemoteStorage unknown remoteStorage protocol:" + remote.protocol);
			break;
		}
		return false;
	}

	private static boolean addDirToRemoteStorage(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, DocPushResult pushResult, List<CommitAction> commitActionList, boolean isSubAction) {
		if(remote == null)
		{
			Log.debug("addDirToRemoteStorage remoteStorage for repos " + repos.getId() + " " + repos.getName() + " not configured");
			return false;
		}
		
		switch(remote.protocol)
		{
		case "file":
			return addDirToLocalDisk(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getName());
		case "sftp":
			return addDirToSftpServer(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getName());
		case "ftp":
			return addDirToFtpServer(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getName());
		case "smb":
			return addDirToSmbServer(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getName());
		case "mxsdoc":
			return addDirToMxsDocServer(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getName());
		case "svn":
			return addDirToSvnServer(session, remote,  doc, pushResult, commitActionList, isSubAction);
		case "git":
			return addDirToGitServer(session, remote,  doc, pushResult, commitActionList, isSubAction);
		default:
			Log.debug("addDirToRemoteStorage unknown remoteStorage protocol:" + remote.protocol);
			break;
		}
		return false;
	}
	
	private static boolean addDirToRemoteStorage(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String name, String commitMsg, String commitUser)
	{
		boolean ret = false;
		
		switch(remote.protocol)
		{
		case "file":
			ret = addDirToLocalDisk(session, remote, remotePath, name);
			break;
		case "sftp":
			ret = addDirToSftpServer(session, remote, remotePath, name);
			break;
		case "ftp":
			ret = addDirToFtpServer(session, remote, remotePath, name);
			break;
		case "smb":
			ret = addDirToSmbServer(session, remote, remotePath, name);
			break;
		case "mxsdoc":
			ret = addDirToMxsDocServer(session, remote, remotePath, name);
			break;
		case "svn":
			ret = addDirToSvnServer(session, remote, remotePath, name, commitMsg, commitUser);
			break;
		//git会不跟踪目录节点，因此不需要处理
		case "git":
			ret = addDirToGitServer(session, remote, remotePath, name, commitMsg, commitUser);
			break;
		default:
			Log.debug("addDirsToRemoteStorage unknown remoteStorage protocol:" + remote.protocol);
			break;
		}
		return ret;
	}
	
	
	//这个函数只是添加远程目录
	protected static boolean addDirsToRemoteStorage(RemoteStorageSession session, RemoteStorageConfig remote, String basePath, String offsetPath, String commitMsg, String commitUser) {
		String remotePath = basePath;
		String path[] = offsetPath.split("/");
		
		for(int i=0; i<path.length; i++)
		{			
			if(path[i].equals(""))
			{
				continue;
			}
			
			Log.debug("addDirsToRemoteStorage() path[" + i+ "]:" + path[i]);
			Integer type = getRemoteStorageEntryTypeBasic(session, remote, remotePath, path[i], null);
			if(type == null)
			{
				Log.info("addDirsToRemoteStorage() getRemoteStorageEntryType for " + remotePath + path[i] + " 异常");
				return false;
			}
			
			if(type == 0)
			{
				Log.debug("addDirsToRemoteStorage() try to add dir:" + remotePath + path[i]);
				boolean ret = addDirToRemoteStorage(session, remote, remotePath, path[i], commitMsg, commitUser);
				if(ret == false)
				{
					Log.debug("addDirsToRemoteStorage() failed to add dir:" + remotePath + path[i]);
					return false;
				}
			}
			
			remotePath = remotePath + path[i] + "/";
		}
		
		return true;
	}

	private static Integer getRemoteStorageEntryType(RemoteStorageSession session, RemoteStorageConfig remote,
			String remotePath, String name, String commitId) 
	{
		String realRemotePath = remote.rootPath + remotePath;
		return getRemoteStorageEntryTypeBasic(session, remote, realRemotePath, name, commitId);
	}
	
	private static Integer getRemoteStorageEntryTypeBasic(RemoteStorageSession session, RemoteStorageConfig remote,
			String realRemotePath, String name, String commitId) 
	{
		switch(remote.protocol)
		{
		case "file":
			return getRemoteStorageEntryTypeForLocal( session, remote, realRemotePath, name);
		case "sftp":
			return getRemoteStorageEntryTypeForSftp( session, remote, realRemotePath, name);
		case "ftp":
			return getRemoteStorageEntryTypeForFtp(session, remote, realRemotePath, name);
		case "smb":
			return getRemoteStorageEntryTypeForSmb(session, remote, realRemotePath, name);
		case "mxsdoc":
			return getRemoteStorageEntryTypeForMxsDoc(session, remote, realRemotePath, name);
		case "svn":
			return getRemoteStorageEntryTypeForSvn(session, remote, realRemotePath, name, commitId);
		case "git":
			return getRemoteStorageEntryTypeForGit(session, remote, realRemotePath, name, commitId);
		default:
			Log.debug("getRemoteStorageEntryType unknown remoteStorage protocol:" + remote.protocol);
			break;
		}
		return null;
	}

	private static boolean deleteEntryFromRemoteStorage(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, DocPushResult pushResult, List<CommitAction> commitActionList, boolean isSubAction) {
		if(remote == null)
		{
			Log.debug("deleteEntryFromRemoteStorage remoteStorage for repos " + repos.getId() + " " + repos.getName() + " not configured");
			return false;
		}
		
		if(doc == null || doc.getType() == null || doc.getType() == 0)
		{
			Log.debug("deleteEntryFromRemoteStorage doc not exist");			
			return true;
		}
		
		switch(remote.protocol)
		{
		case "file":
			return deleteEntryFromeLocalDisk(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName(), doc.getType());
		case "sftp":
			return deleteEntryFromeSftpServer(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName(), doc.getType());
		case "ftp":
			return deleteEntryFromeFtpServer(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName(), doc.getType());
		case "smb":
			return deleteEntryFromeSmbServer(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName(), doc.getType());
		case "mxsdoc":
			return deleteEntryFromMxsDocServer(session, remote,  remote.rootPath + doc.offsetPath+ doc.getPath(), doc.getLocalRootPath() + doc.getPath(), doc.getName(), doc.getType());
		case "svn":
			return deleteEntryFromeSvnServer(session, remote,  doc, pushResult, commitActionList, isSubAction);
		case "git":
			return deleteEntryFromeGitServer(session, remote,  doc, pushResult, commitActionList, isSubAction);

		default:
			Log.debug("deleteEntryFromRemoteStorage unknown remoteStorage protocol:" + remote.protocol);
			break;
		}
		return false;
	}

	private static boolean uploadFileToSvnServer(RemoteStorageSession session, RemoteStorageConfig remote, Doc doc, DocPushResult pushResult, List<CommitAction> commitActionList, boolean isSubAction) {
		boolean ret = false;
		try {
			session.svn.modifyFile(doc, isSubAction, commitActionList);
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean uploadFileToGitServer(RemoteStorageSession session, RemoteStorageConfig remote, Doc doc, DocPushResult pushResult, List<CommitAction> commitActionList, boolean isSubAction) {
		boolean ret = false;
		try {
			session.git.modifyFile(doc, isSubAction, commitActionList);
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean downloadFileFromLocalDisk(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName) {
        boolean ret = false;
        
        Log.debug("downloadFileFromLocalDisk remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);
		try {
 			ret = FileUtil.copyFile(remote.FILE.localRootPath + remotePath + fileName, localPath + fileName, true);
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}

	private static boolean downloadFileFromSftpServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName) {
        boolean ret = false;
        
        Log.debug("downloadFileFromSftpServer remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);
		try {
 			ret = session.sftp.download(remotePath, localPath, fileName);			
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean downloadFileFromFtpServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName) {
        boolean ret = false;
        
        Log.debug("downloadFileFromFtpServer remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);
		try {
 			ret = session.ftp.download(remotePath, localPath, fileName);			
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	

	private static boolean downloadFileFromSmbServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName) {
        boolean ret = false;
        
        Log.debug("downloadFileFromSmbServer remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);
		try {
 			ret = session.smb.download(remotePath, localPath, fileName);			
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean downloadFileFromMxsDocServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName) {
        boolean ret = false;
        
        Log.debug("downloadFileFromMxsDocServer remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);
		try {
 			ret = session.mxsdoc.download(remotePath, localPath, fileName);			
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}

	private static boolean downloadFileFromSvnServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName, String commitId)  {
		boolean ret = false;
		try {
			long revision = -1L;
			if(commitId != null)
			{
				revision = Long.parseLong(commitId);
			}
			session.svn.getRemoteFile(remotePath + fileName, localPath, fileName, revision, true);
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}

	private static boolean downloadFileFromGitServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName, String commitId) {
		boolean ret = false;
		try {
			session.git.getRemoteFile(remotePath + fileName, localPath, fileName, commitId, true);
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}


	private static boolean addDirToLocalDisk(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String fileName) {
        boolean ret = false;
		Log.debug("addDirToLocalDisk remotePath:" + remotePath + " fileName:" + fileName);

		try {
			File dir = new File(remote.FILE.localRootPath + remotePath + fileName);
			ret = dir.mkdir();
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean addDirToSftpServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String fileName)  {
        boolean ret = false;
		Log.debug("addDirToSftpServer remotePath:" + remotePath + " fileName:" + fileName);

		try {
			ret = session.sftp.mkdir(remotePath + fileName); 
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean addDirToFtpServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String fileName)  {
        boolean ret = false;
		Log.debug("addDirToFtpServer remotePath:" + remotePath + " fileName:" + fileName);

		try {
			ret = session.ftp.mkdir(remotePath + fileName); 
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}

	private static boolean addDirToSmbServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String fileName)  {
        boolean ret = false;
		Log.debug("addDirToSmbServer remotePath:" + remotePath + " fileName:" + fileName);

		try {
			ret = session.smb.mkdir(remotePath + fileName); 
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean addDirToMxsDocServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String fileName)  {
        boolean ret = false;
		Log.debug("addDirToMxsDocServer remotePath:" + remotePath + " fileName:" + fileName);

		try {
			ret = session.mxsdoc.add(remotePath, fileName, 2); 	
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean addDirToSvnServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String name, String commitMsg, String commitUser) {
		boolean ret = false;
		try {
			ret = session.svn.mkdir(remotePath, name, commitMsg, commitUser);
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean addDirToGitServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String name, String commitMsg, String commitUser) {
		//GIT 仓库不会跟踪目录，因此直接成功即可
		return true;
	}

	private static boolean addFileToSvnServer(RemoteStorageSession session, RemoteStorageConfig remote, Doc doc, DocPushResult pushResult, List<CommitAction> commitActionList, boolean isSubAction) {
		boolean ret = false;
		try {
			session.svn.addEntry(doc, isSubAction, commitActionList);
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean addFileToGitServer(RemoteStorageSession session, RemoteStorageConfig remote, Doc doc, DocPushResult pushResult, List<CommitAction> commitActionList, boolean isSubAction) {
		boolean ret = false;
		try {
			session.git.addEntry(doc, isSubAction, commitActionList);
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean addDirToSvnServer(RemoteStorageSession session, RemoteStorageConfig remote, Doc doc, DocPushResult pushResult, List<CommitAction> commitActionList, boolean isSubAction) {
		boolean ret = false;
		CommitAction action = null;
		try {
			action  = session.svn.addEntry(doc, isSubAction, commitActionList);
			pushResult.action = action;
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean addDirToGitServer(RemoteStorageSession session, RemoteStorageConfig remote, Doc doc, DocPushResult pushResult, List<CommitAction> commitActionList, boolean isSubAction) {
		boolean ret = false;
		CommitAction action = null;
		try {
			action  = session.git.addEntry(doc, isSubAction, commitActionList);
			pushResult.action = action;
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	

	private static boolean deleteEntryFromeLocalDisk(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName, Integer type) {
        boolean ret = false;
		Log.debug("deleteEntryFromeLocalDisk remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);

		try {
			ret = FileUtil.delFileOrDir(remote.FILE.localRootPath + remotePath + fileName);
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;

	}
	
	private static boolean deleteEntryFromeSftpServer(RemoteStorageSession session, RemoteStorageConfig remote,  String remotePath, String localPath, String fileName, Integer type) {
        boolean ret = false;
		Log.debug("deleteEntryFromeSftpServer remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);

		try {
			if(type == 1)
			{
				ret = session.sftp.delFile(remotePath, fileName);
			}
			else
			{
				ret = session.sftp.delDirs(remotePath, fileName);
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	

	private static boolean deleteEntryFromeFtpServer(RemoteStorageSession session, RemoteStorageConfig remote,  String remotePath, String localPath, String fileName, Integer type)  {
        boolean ret = false;
		Log.debug("deleteEntryFromeFtpServer remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);

		try {
			if(type == 1)
			{
				ret = session.ftp.delFile(remotePath, fileName); 
			}
			else
			{
				ret = session.ftp.delDirs(remotePath, fileName);
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean deleteEntryFromeSmbServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName, Integer type)  {
        boolean ret = false;
		Log.debug("deleteEntryFromeSmbServer remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);

		try {
			if(type == 1)
			{
				ret = session.smb.delFile(remotePath, fileName); 
			}
			else
			{
				ret = session.smb.delDir(remotePath, fileName);
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean deleteEntryFromMxsDocServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName, Integer type)  {
        boolean ret = false;
		Log.debug("deleteEntryFromMxsDocServer remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);

		try {
			ret = session.mxsdoc.delete(remotePath, fileName); 
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean deleteEntryFromeSvnServer(RemoteStorageSession session, RemoteStorageConfig remote, Doc doc, DocPushResult pushResult, List<CommitAction> commitActionList, boolean isSubAction) {
		boolean ret = false;
		try {
			session.svn.deleteEntry(doc, isSubAction, commitActionList);
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean deleteEntryFromeGitServer(RemoteStorageSession session, RemoteStorageConfig remote, Doc doc, DocPushResult pushResult, List<CommitAction> commitActionList, boolean isSubAction){
		boolean ret = false;
		try {
			session.git.deleteEntry(doc, isSubAction, commitActionList);
			ret = true;
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean uploadFileToLocalDisk(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName) {
        boolean ret = false;
		Log.debug("uploadFileToLocalDisk remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);

		try {
			ret = FileUtil.copyFile(localPath + fileName, remote.FILE.localRootPath + remotePath + fileName, true);
		} catch (Exception e) {
			Log.info(e);
		}
        return ret;
	}
	
	private static boolean uploadFileToSftpServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName) {
        boolean ret = false;
		FileInputStream is = null;

		Log.debug("uploadFileToSftpServer remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);

		try {
        	is = new FileInputStream(localPath + fileName);
        	ret = session.sftp.upload(remotePath, fileName, is);   
		} catch (Exception e) {
			Log.info(e);
		} finally {
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e) {
					Log.info(e);
				}
			}
		}
        return ret;
	}
	
	
	private static boolean uploadFileToFtpServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName){
        boolean ret = false;
		FileInputStream is = null;

		Log.debug("uploadFileToFtpServer remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);

		try {
        	is = new FileInputStream(localPath + fileName);
        	ret = session.ftp.upload(remotePath, fileName, is);        	
		} catch (Exception e) {
			Log.info(e);
		} finally {
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e) {
					Log.info(e);
				}
			}
		}
        return ret;
	}
	

	private static boolean uploadFileToSmbServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName) {
        boolean ret = false;
		FileInputStream is = null;

		Log.debug("uploadFileToSmbServer remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);

		try {
        	is = new FileInputStream(localPath + fileName);
        	ret = session.smb.upload(remotePath, fileName, is);        	
		} catch (Exception e) {
			Log.info(e);
		} finally {
			if(is != null)
			{
				try {
					is.close();
				} catch (IOException e) {
					Log.info(e);
				}
			}
		}
        return ret;
	}
	
	private static boolean uploadFileToMxsDocServer(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String localPath, String fileName) {
		Log.debug("uploadFileToMxsDocServer remotePath:" + remotePath + " localPath:" + localPath + " fileName:" + fileName);
        return session.mxsdoc.upload(remotePath, localPath, fileName);        	
	}
	

	private List<Doc> getRemoteStorageEntryListForLocal(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc) {
		List <Doc> subEntryList =  null;

		String subDocParentPath = getSubDocParentPath(doc);
		
        Log.debug("getRemoteStorageEntryListForLocal doc:[" + doc.getPath() + doc.getName() + "]");
		try {
        	String fileRemotePath = remote.rootPath + doc.offsetPath + doc.getPath();
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
            Log.debug("getRemoteStorageEntryListForLocal fileRemotePath:" + remote.FILE.localRootPath +fileRemotePath);
                    	
            File file = new File(remote.FILE.localRootPath + fileRemotePath);
			File[] list = file.listFiles();
			if(list != null)
			{
				subEntryList = new ArrayList<Doc>();
				//Log.printObject("list:", list);
				for(int i=0; i<list.length; i++)
				{
					File subEntry = list[i];
					String subEntryName = subEntry.getName();
					int subEntryType = getEntryType(subEntry);
					String subEntryRevision = subEntry.lastModified() + "";
			    	long subEntrySize = subEntry.length();
			    	long lastChangeTime = subEntry.lastModified();
			    	long createTime = subEntry.lastModified();
			    	Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, subEntryName, null, subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
			    	subDoc.setSize(subEntrySize);
			    	subDoc.setCreateTime(createTime);
			    	subDoc.setLatestEditTime(lastChangeTime);
			    	subDoc.setRevision(subEntryRevision);
		    		subEntryList.add(subDoc);
				}
			}
		} catch (Exception e) {
			Log.info(e);
		}		
        return subEntryList;
	}
	
	private HashMap<String, Doc> getRemoteStorageEntryHashMapForLocal(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc) {
		HashMap<String, Doc> subEntryList =  new HashMap<String, Doc>();

		String subDocParentPath = getSubDocParentPath(doc);
		
        Log.debug("getRemoteStorageEntryHashMapForLocal doc:" + doc.getPath() + doc.getName());
		try {
        	String fileRemotePath = remote.rootPath + doc.offsetPath + doc.getPath();
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
            Log.debug("getRemoteStorageEntryHashMapForLocal fileRemotePath:" + remote.FILE.localRootPath +fileRemotePath);
                    	
            File file = new File(remote.FILE.localRootPath + fileRemotePath);
			File[] list = file.listFiles();
			if(list != null)
			{
				//Log.printObject("list:", list);
				for(int i=0; i<list.length; i++)
				{
					File subEntry = list[i];
					String subEntryName = subEntry.getName();
					int subEntryType = getEntryType(subEntry);
					String subEntryRevision = subEntry.lastModified() + "";
			    	long subEntrySize = subEntry.length();
			    	long lastChangeTime = subEntry.lastModified();
			    	long createTime = subEntry.lastModified();
			    	Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, subEntryName, null, subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
			    	subDoc.setSize(subEntrySize);
			    	subDoc.setCreateTime(createTime);
			    	subDoc.setLatestEditTime(lastChangeTime);
			    	subDoc.setRevision(subEntryRevision);
		    		subEntryList.put(subEntryName,subDoc);
				}
			}
		} catch (Exception e) {
			Log.info(e);
		}	
        return subEntryList;
	}

	private List<Doc> getRemoteStorageEntryListForSftp(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc) {
		List <Doc> subEntryList =  null;

		String subDocParentPath = getSubDocParentPath(doc);
		
        Log.debug("getRemoteStorageEntryListForSftp doc:[" + doc.getPath() + doc.getName() + "]");
		try {
        	String fileRemotePath = remote.rootPath + doc.offsetPath + doc.getPath();
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
            Log.debug("getRemoteStorageEntryListForSftp fileRemotePath:" + fileRemotePath);
                    	
			Vector<?> list = session.sftp.listFiles(fileRemotePath);
			if(list != null)
			{
				subEntryList = new ArrayList<Doc>();
				//Log.printObject("list:", list);
				for(int i=0; i<list.size(); i++)
				{
					LsEntry subEntry = (LsEntry) list.get(i);
					String subEntryName = subEntry.getFilename();
					if(subEntryName.equals(".") || subEntryName.equals(".."))
					{
						continue;
					}
					
					Log.debug("getRemoteStorageEntryListForSftp subEntryName:" + subEntryName);
					
					int subEntryType = getEntryType(subEntry);
					String subEntryRevision = subEntry.getAttrs().getMTime() + "";
			    	long subEntrySize = subEntry.getAttrs().getSize();
			    	long lastChangeTime = subEntry.getAttrs().getMTime();
			    	long createTime = subEntry.getAttrs().getATime();
			    	Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, subEntryName, null, subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
			    	subDoc.setSize(subEntrySize);
			    	subDoc.setCreateTime(createTime);
			    	subDoc.setLatestEditTime(lastChangeTime);
			    	subDoc.setRevision(subEntryRevision);
		    		subEntryList.add(subDoc);
				}
			}
		} catch (Exception e) {
			Log.info(e);
		}		
        return subEntryList;
	}
	
	private List<Doc> getRemoteStorageEntryListForFtp(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc) {
		List <Doc> subEntryList =  null;

		String subDocParentPath = getSubDocParentPath(doc);
		
        Log.debug("getRemoteStorageEntryListForFtp doc:[" + doc.getPath() + doc.getName() + "]");
		try {
        	String fileRemotePath = remote.rootPath + doc.offsetPath + doc.getPath();
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
            Log.debug("getRemoteStorageEntryListForFtp fileRemotePath:" + fileRemotePath);
                    	
			FTPFile[] list = session.ftp.listFiles(fileRemotePath);
			if(list != null)
			{
				subEntryList = new ArrayList<Doc>();
				//Log.printObject("list:", list);
				for(int i=0; i<list.length; i++)
				{
					FTPFile subEntry = list[i];
					String subEntryName = subEntry.getName();
					if(subEntryName.equals(".") || subEntryName.equals(".."))
					{
						continue;
					}
					
					Log.debug("getRemoteStorageEntryListForFtp subEntryName:" + subEntryName);
					
					int subEntryType = getEntryType(subEntry);
					String subEntryRevision = subEntry.getTimestamp().getTimeInMillis() + "";
			    	long subEntrySize = subEntry.getSize();
			    	long lastChangeTime = subEntry.getTimestamp().getTimeInMillis();
			    	long createTime = lastChangeTime;
			    	Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, subEntryName, null, subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
			    	subDoc.setSize(subEntrySize);
			    	subDoc.setCreateTime(createTime);
			    	subDoc.setLatestEditTime(lastChangeTime);
			    	subDoc.setRevision(subEntryRevision);
		    		subEntryList.add(subDoc);
				}
			}
		} catch (Exception e) {
			Log.info(e);
		}		
        return subEntryList;
	}
	

	private List<Doc> getRemoteStorageEntryListForSmb(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc) {
		List <Doc> subEntryList =  null;

		String subDocParentPath = getSubDocParentPath(doc);
		
        Log.debug("getRemoteStorageEntryListForSmb doc:[" + doc.getPath() + doc.getName() + "]");
		try {
        	String fileRemotePath = remote.rootPath + doc.offsetPath + doc.getPath();
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
            Log.debug("getRemoteStorageEntryListForSmb fileRemotePath:" + fileRemotePath);
                    	
			SmbFile[] list = session.smb.listFiles(fileRemotePath);
			if(list != null)
			{
				subEntryList = new ArrayList<Doc>();
				//Log.printObject("list:", list);
				for(int i=0; i<list.length; i++)
				{
					SmbFile subEntry = list[i];
					String subEntryName = subEntry.getName();
					if(subEntry.isDirectory())
					{
						//smb entry 的目录名字最后带了斜杠，必须去掉，否则会导致路径异常
						subEntryName = subEntryName.substring(0, subEntryName.length() - 1);
					}
					//if(subEntryName.equals(".") || subEntryName.equals(".."))
					//{
					//	continue;
					//}
					
					Log.debug("getRemoteStorageEntryListForSmb subEntryName:" + subEntryName);
					
					int subEntryType = getEntryType(subEntry);
					String subEntryRevision = subEntry.lastModified() + "";
			    	long subEntrySize = subEntry.length();
			    	long lastChangeTime = subEntry.lastModified();
			    	long createTime = subEntry.createTime();
			    	Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, subEntryName, null, subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
			    	subDoc.setSize(subEntrySize);
			    	subDoc.setCreateTime(createTime);
			    	subDoc.setLatestEditTime(lastChangeTime);
			    	subDoc.setRevision(subEntryRevision);
		    		subEntryList.add(subDoc);
				}
			}
		} catch (Exception e) {
			Log.info(e);
		}		
        return subEntryList;
	}

	private List<Doc> getRemoteStorageEntryListForMxsDoc(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc) {
		List <Doc> subEntryList =  null;

		String subDocParentPath = getSubDocParentPath(doc);
		
        Log.debug("getRemoteStorageEntryListForMxsDoc doc:[" + doc.getPath() + doc.getName() + "]");
		try {
        	String fileRemotePath = remote.rootPath + doc.offsetPath + doc.getPath();
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
            Log.debug("getRemoteStorageEntryListForMxsDoc fileRemotePath:" + fileRemotePath);
                    	
			JSONArray list = session.mxsdoc.listFiles(fileRemotePath);
			if(list != null)
			{
				subEntryList = new ArrayList<Doc>();
				//Log.printObject("list:", list);
				for(int i=0; i<list.size(); i++)
				{
					JSONObject subEntry = list.getJSONObject(i);
					String subEntryName = subEntry.getString("name");
					Log.debug("getRemoteStorageEntryListForMxsDoc subEntryName:" + subEntryName);

					int subEntryType = subEntry.getInteger("type");
					long subEntrySize = subEntry.getLong("size");
			    	long lastChangeTime = subEntry.getLong("latestEditTime");
			    	String subEntryRevision = lastChangeTime + "";
			    	long createTime = subEntry.getLong("createTime");
			    	Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, subEntryName, null, subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
			    	subDoc.setSize(subEntrySize);
			    	subDoc.setCreateTime(createTime);
			    	subDoc.setLatestEditTime(lastChangeTime);
			    	subDoc.setRevision(subEntryRevision);
		    		subEntryList.add(subDoc);
				}
			}
		} catch (Exception e) {
			Log.info(e);
		}		
        return subEntryList;
	}
	
	private HashMap<String, Doc> getRemoteStorageEntryHashMapForMxsDoc(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc)
	{
		HashMap<String, Doc> subEntryList =  new HashMap<String, Doc>();

		String subDocParentPath = getSubDocParentPath(doc);
		
        Log.debug("getRemoteStorageEntryHashMapForMxsDoc doc:" + doc.getPath() + doc.getName());
		try {
        	String fileRemotePath = remote.rootPath + doc.offsetPath + doc.getPath();
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
            Log.debug("getRemoteStorageEntryHashMapForMxsDoc fileRemotePath:" + fileRemotePath);

            Log.printObject("getRemoteStorageEntryHashMapForMxsDoc session:", session);
            Log.printObject("getRemoteStorageEntryHashMapForMxsDoc session.mxsdoc:", session.mxsdoc);

			JSONArray list = session.mxsdoc.listFiles(fileRemotePath);
			if(list != null)
			{
				//Log.printObject("list:", list);
				for(int i=0; i<list.size(); i++)
				{
					JSONObject subEntry = list.getJSONObject(i);
					String subEntryName = subEntry.getString("name");
					int subEntryType = subEntry.getInteger("type");
					long subEntrySize = subEntry.getLong("size");
			    	long lastChangeTime = subEntry.getLong("latestEditTime");
			    	String subEntryRevision = lastChangeTime + "";
			    	long createTime = subEntry.getLong("createTime");
			    	Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, subEntryName, null, subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
			    	subDoc.setSize(subEntrySize);
			    	subDoc.setCreateTime(createTime);
			    	subDoc.setLatestEditTime(lastChangeTime);
			    	subDoc.setRevision(subEntryRevision);
		    		subEntryList.put(subDoc.getName(), subDoc);

				}
			}
		} catch (Exception e) {
			Log.info(e);
		}		
        return subEntryList;
	}
	

	private static Integer getRemoteStorageEntryTypeForMxsDoc(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String name) 
	{
        if(name.isEmpty())
		{
			Log.debug("getRemoteStorageEntryForMxsDoc name 不能为空");
			return null;
		}
		
        Log.debug("getRemoteStorageEntryForMxsDoc for:" + remotePath + name);
        
		try {
        	JSONObject entry = session.mxsdoc.getEntry(remotePath, name);
        	if(entry != null)
        	{
				return entry.getInteger("type");
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return 0;	
	}
	
	private static Doc getRemoteStorageEntryForMxsDoc(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc) {
        Doc remoteDoc = null;
        
        if(doc.getDocId() == 0)	//rootDoc
        {
        	Log.debug("getRemoteStorageEntryForMxsDoc it is rootDoc");
			remoteDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(),  doc.getReposPath(), doc.getPath(), "", doc.getLevel(), 2, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), doc.getSize(), "", doc.offsetPath);
	    	return remoteDoc;
        }	
        
        if(doc.getName().isEmpty())
		{
			Log.debug("getRemoteStorageEntryForMxsDoc name 不能为空");
			return null;
		}
		
        Log.debug("getRemoteStorageEntryForMxsDoc doc:" + doc.getPath() + doc.getName());
		try {
        	String remoteParentPath = remote.rootPath + doc.offsetPath + doc.getPath();
        	JSONObject entry = session.mxsdoc.getEntry(remoteParentPath, doc.getName());
        	if(entry != null)
        	{
				int subEntryType = entry.getInteger("type");
				long subEntrySize = entry.getLong("size");
		    	long lastChangeTime = entry.getLong("latestEditTime");
		    	String subEntryRevision = lastChangeTime + "";
		    	long createTime = entry.getLong("createTime");
		    	remoteDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(),  doc.getReposPath(), doc.getPath(), doc.getName(), doc.getLevel(), subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
			    remoteDoc.setSize(subEntrySize);
			    remoteDoc.setCreateTime(createTime);
			    remoteDoc.setLatestEditTime(lastChangeTime);
			    remoteDoc.setRevision(subEntryRevision);
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return remoteDoc;	
    }
	
	private List<Doc> getRemoteStorageEntryListForGit(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId) {
		List <Doc> subEntryList =  null;

		String subDocParentPath = getSubDocParentPath(doc);
		int subDocLevel = getSubDocLevel(doc);
		
        Log.debug("getRemoteStorageEntryListForGit doc:[" + doc.getPath() + doc.getName() + "]");
		try {       	        	
        	String fileRemotePath = remote.rootPath  + doc.offsetPath + doc.getPath();;
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
        	Log.debug("getRemoteStorageEntryListForGit fileRemotePath:" + fileRemotePath);
            
			TreeWalk treeWalk = session.git.listFiles(fileRemotePath, commitId);
			//Log.printObject("list:", list);
			if(treeWalk != null)
			{
				subEntryList = new ArrayList<Doc>();
				while(treeWalk.next())
				{
					int type = getEntryType(treeWalk.getFileMode(0));
					if(type <= 0)
					{
						continue;
					}
		    	
					String subEntryName = treeWalk.getNameString(); 
					Log.debug("getRemoteStorageEntryListForGit subEntryName:" + subEntryName);
					
					Doc subDoc = new Doc();
					subDoc.setVid(repos.getId());
		    		subDoc.setDocId(Path.buildDocIdByName(subDocLevel,subDocParentPath,subEntryName));
		    		subDoc.setPid(doc.getDocId());
		    		subDoc.setPath(subDocParentPath);
		    		subDoc.setName(subEntryName);
		    		subDoc.setLevel(subDocLevel);
		    		subDoc.setType(type);
		    		subDoc.setLocalRootPath(doc.getLocalRootPath());
		    		subDoc.setLocalVRootPath(doc.getLocalVRootPath());
		    		subEntryList.add(subDoc);
		    	}
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return subEntryList;
	}

	private List<Doc> getRemoteStorageEntryListForSvn(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId) {
		List <Doc> subEntryList =  null;

		String subDocParentPath = getSubDocParentPath(doc);
		int subDocLevel = getSubDocLevel(doc);;
		
        Log.debug("getRemoteStorageEntryListForSvn doc:[" + doc.getPath() + doc.getName() + "]");
		try {       	        	
        	String fileRemotePath = remote.rootPath  + doc.offsetPath + doc.getPath();;
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
        	Log.debug("getRemoteStorageEntryListForSvn fileRemotePath:" + fileRemotePath);
            
			Collection<SVNDirEntry> list = session.svn.listFiles(fileRemotePath, commitId);
			if(list != null)
			{
				subEntryList = new ArrayList<Doc>();
			    Iterator<SVNDirEntry> iterator = list.iterator();
			    while (iterator.hasNext()) 
			    {
			    	SVNDirEntry subEntry = iterator.next();
			    	int subEntryType = getEntryType(subEntry.getKind());
			    	if(subEntryType <= 0)
			    	{
			    		Log.debug("getRemoteStorageEntryListForSvn() invalid subEntry subEntryType:" + subEntryType);
			    		continue;
			    	}
					
			    	String subEntryName = subEntry.getName();
					Log.debug("getRemoteStorageEntryListForSvn subEntryName:" + subEntryName);

			    	Long lastChangeTime = subEntry.getDate().getTime();
			    	Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, subEntryName, subDocLevel, subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntry.getSize(), "", doc.offsetPath);
			    	subDoc.setSize(subEntry.getSize());
			    	subDoc.setCreateTime(lastChangeTime);
			    	subDoc.setLatestEditTime(lastChangeTime);
			    	subDoc.setCreatorName(subEntry.getAuthor());
			    	subDoc.setLatestEditorName(subEntry.getAuthor());
			    	subDoc.setRevision(subEntry.getRevision()+"");
		    		subDoc.setLocalRootPath(doc.getLocalRootPath());
		    		subDoc.setLocalVRootPath(doc.getLocalVRootPath());
			        subEntryList.add(subDoc);
			    }	
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return subEntryList;
	}
	
	private HashMap<String, Doc> getRemoteStorageEntryHashMapForSftp(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc) {
		HashMap<String, Doc> subEntryList =  new HashMap<String, Doc>();

		String subDocParentPath = getSubDocParentPath(doc);
		int subDocLevel = getSubDocLevel(doc);;
		
        Log.debug("getRemoteStorageEntryHashMapForSftp doc:" + doc.getPath() + doc.getName());
		try {       	        	
        	String fileRemotePath = remote.rootPath  + doc.offsetPath + doc.getPath();;
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
        	Log.debug("getRemoteStorageEntryHashMapForSftp fileRemotePath:" + fileRemotePath);
            
			Vector<?> list = session.sftp.listFiles(fileRemotePath);
			//Log.printObject("list:", list);
			for(int i=0; i<list.size(); i++)
			{
				LsEntry subEntry = (LsEntry) list.get(i);
				String subEntryName = subEntry.getFilename();
				if(subEntryName.equals(".") || subEntryName.equals(".."))
				{
					continue;
				}
				
				//Log.println(fileRemotePath + subEntryName);
				
				int subEntryType = getEntryType(subEntry);
				String subEntryRevision = subEntry.getAttrs().getMtimeString();
		    	long subEntrySize = subEntry.getAttrs().getSize();
		    	long lastChangeTime = subEntry.getAttrs().getMTime();
		    	long createTime = subEntry.getAttrs().getATime();
		    	Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, subEntryName, subDocLevel, subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
		    	subDoc.setSize(subEntrySize);
		    	subDoc.setCreateTime(createTime);
		    	subDoc.setLatestEditTime(lastChangeTime);
		    	subDoc.setRevision(subEntryRevision);
	    		subEntryList.put(subDoc.getName(), subDoc);
			}			
		} catch (Exception e) {
			Log.info(e);
		}
        return subEntryList;
	}
	
	private HashMap<String, Doc> getRemoteStorageEntryHashMapForFtp(RemoteStorageSession session, RemoteStorageConfig remote,Repos repos, Doc doc) {
		HashMap<String, Doc> subEntryList =  new HashMap<String, Doc>();

		String subDocParentPath = getSubDocParentPath(doc);
		int subDocLevel = getSubDocLevel(doc);
		
        Log.debug("getRemoteStorageEntryHashMapForFtp doc:" + doc.getPath() + doc.getName());
		try {       	        	
        	String fileRemotePath = remote.rootPath  + doc.offsetPath + doc.getPath();;
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
        	Log.debug("getRemoteStorageEntryHashMapForFtp fileRemotePath:" + fileRemotePath);
            
			FTPFile[] list = session.ftp.listFiles(fileRemotePath);
			//Log.printObject("list:", list);
			if(list != null) {
				for(int i=0; i<list.length; i++)
				{
					FTPFile subEntry = list[i];
					String subEntryName = subEntry.getName();
					if(subEntryName.equals(".") || subEntryName.equals(".."))
					{
						continue;
					}
					
					//Log.println(fileRemotePath + subEntryName);
					
					int subEntryType = getEntryType(subEntry);
					String subEntryRevision = subEntry.getTimestamp() + "";
			    	long subEntrySize = subEntry.getSize();
			    	long lastChangeTime = subEntry.getTimestamp().getTimeInMillis();
			    	long createTime = lastChangeTime;
			    	Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, subEntryName, subDocLevel, subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
			    	subDoc.setSize(subEntrySize);
			    	subDoc.setCreateTime(createTime);
			    	subDoc.setLatestEditTime(lastChangeTime);
			    	subDoc.setRevision(subEntryRevision);
		    		subEntryList.put(subDoc.getName(), subDoc);
				}		
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return subEntryList;
	}
	
	private HashMap<String, Doc> getRemoteStorageEntryHashMapForSmb(RemoteStorageSession session, RemoteStorageConfig remote,Repos repos, Doc doc) {
		HashMap<String, Doc> subEntryList =  new HashMap<String, Doc>();

		String subDocParentPath = getSubDocParentPath(doc);
		int subDocLevel = getSubDocLevel(doc);
		
        Log.debug("getRemoteStorageEntryHashMapForSmb doc:" + doc.getPath() + doc.getName());
		try {       	        	
        	String fileRemotePath = remote.rootPath  + doc.offsetPath + doc.getPath();;
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
        	Log.debug("getRemoteStorageEntryHashMapForSmb fileRemotePath:" + fileRemotePath);
            
			SmbFile[] list = session.smb.listFiles(fileRemotePath);
			//Log.printObject("list:", list);
			if(list != null)
			{
				for(int i=0; i<list.length; i++)
				{
					SmbFile subEntry = list[i];
					String subEntryName = subEntry.getName();
					if(subEntryName.equals(".") || subEntryName.equals(".."))
					{
						continue;
					}
					
					//Log.println(fileRemotePath + subEntryName);				
					int subEntryType = getEntryType(subEntry);
					String subEntryRevision = subEntry.lastModified() + "";
			    	long subEntrySize = subEntry.length();
			    	long lastChangeTime = subEntry.lastModified();
			    	long createTime = subEntry.createTime();
			    	Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, subEntryName, subDocLevel, subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
			    	subDoc.setSize(subEntrySize);
			    	subDoc.setCreateTime(createTime);
			    	subDoc.setLatestEditTime(lastChangeTime);
			    	subDoc.setRevision(subEntryRevision);
		    		subEntryList.put(subDoc.getName(), subDoc);
				}		
			}	
		} catch (Exception e) {
			Log.info(e);
		}
        return subEntryList;
	}
	
	private HashMap<String, Doc> getRemoteStorageEntryHashMapForGit(RemoteStorageSession session, RemoteStorageConfig remote,Repos repos, Doc doc, String commitId)
	{
		HashMap<String, Doc> subEntryList =  new HashMap<String, Doc>();

		String subDocParentPath = getSubDocParentPath(doc);
		int subDocLevel = getSubDocLevel(doc);
		
        Log.debug("getRemoteStorageEntryHashMapForGit doc:" + doc.getPath() + doc.getName());
		try {       	        	
        	String fileRemotePath = remote.rootPath  + doc.offsetPath + doc.getPath();;
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
        	Log.debug("getRemoteStorageEntryHashMapForGit fileRemotePath:" + fileRemotePath);
            
			TreeWalk treeWalk = session.git.listFiles(fileRemotePath, commitId);
			if(treeWalk != null)
			{
				//Log.printObject("list:", list);
				while(treeWalk.next())
		    	{
		    		int type = getEntryType(treeWalk.getFileMode(0));
			    	if(type <= 0)
			    	{
			    		continue;
			    	}
			    	
		    		String name = treeWalk.getNameString();            			
		    		Doc subDoc = new Doc();
		    		subDoc.setVid(repos.getId());
		    		subDoc.setDocId(Path.buildDocIdByName(subDocLevel,subDocParentPath,name));
		    		subDoc.setPid(doc.getDocId());
		    		subDoc.setPath(subDocParentPath);
		    		subDoc.setName(name);
		    		subDoc.setLevel(subDocLevel);
		    		subDoc.setType(type);
		    		subDoc.setLocalRootPath(doc.getLocalRootPath());
		    		subDoc.setLocalVRootPath(doc.getLocalVRootPath());
		    		subEntryList.put(subDoc.getName(), subDoc);
		    	}
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return subEntryList;
	}

	private HashMap<String, Doc> getRemoteStorageEntryHashMapForSvn(RemoteStorageSession session, RemoteStorageConfig remote,Repos repos, Doc doc, String commitId) 
	{
		HashMap<String, Doc> subEntryList =  new HashMap<String, Doc>();

		String subDocParentPath = getSubDocParentPath(doc);
		int subDocLevel = getSubDocLevel(doc);
		
        Log.debug("getRemoteStorageEntryHashMapForSvn doc:" + doc.getPath() + doc.getName());
		try {       	        	
        	String fileRemotePath = remote.rootPath  + doc.offsetPath + doc.getPath();;
        	if(doc.getName() != null && doc.getName().isEmpty() == false)
        	{
        		fileRemotePath += doc.getName() + "/";
        	}
        	Log.debug("getRemoteStorageEntryHashMapForSvn fileRemotePath:" + fileRemotePath);
            
			Collection<SVNDirEntry> list = session.svn.listFiles(fileRemotePath, commitId);
			if(list != null)
			{
			    Iterator<SVNDirEntry> iterator = list.iterator();
			    while (iterator.hasNext()) 
			    {
			    	SVNDirEntry subEntry = iterator.next();
			    	int subEntryType = getEntryType(subEntry.getKind());
			    	if(subEntryType <= 0)
			    	{
			    		Log.debug("getRemoteStorageEntryHashMapForSvn() invalid subEntry subEntryType:" + subEntryType);
			    		continue;
			    	}
					
			    	String subEntryName = subEntry.getName();
			    	Long lastChangeTime = subEntry.getDate().getTime();
			    	Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(),  doc.getReposPath(), subDocParentPath, subEntryName, subDocLevel, subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntry.getSize(), "", doc.offsetPath);
			    	subDoc.setSize(subEntry.getSize());
			    	subDoc.setCreateTime(lastChangeTime);
			    	subDoc.setLatestEditTime(lastChangeTime);
			    	subDoc.setCreatorName(subEntry.getAuthor());
			    	subDoc.setLatestEditorName(subEntry.getAuthor());
			    	subDoc.setRevision(subEntry.getRevision()+"");
		    		subDoc.setLocalRootPath(doc.getLocalRootPath());
		    		subDoc.setLocalVRootPath(doc.getLocalVRootPath());
			        subEntryList.put(subDoc.getName(), subDoc);
			    }	
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return subEntryList;
	}

	
	private static Doc getRemoteStorageEntryForLocal(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc)	
	{
        Doc remoteDoc = null;
        
        if(doc.getDocId() == 0)	//rootDoc
        {
        	Log.debug("getRemoteStorageEntryForLocal() it is rootDoc");
			remoteDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(),  doc.getReposPath(), doc.getPath(), "", doc.getLevel(), 2, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), doc.getSize(), "", doc.offsetPath); 
	    	if(doc.offsetPath != null && doc.offsetPath.isEmpty() == false)
	    	{
	    		Integer type = getRemoteStorageEntryType(session, remote, repos, doc, null);
	    		remoteDoc.setType(type);
	    	}
			return remoteDoc;
        }	
        
        if(doc.getName().isEmpty())
		{
			Log.debug("getRemoteStorageEntryForLocal() name 不能为空");
			return null;
		}

        Log.debug("getRemoteStorageEntryForLocal doc:" + doc.getPath() + doc.getName());
        String remoteParentPath = remote.rootPath + doc.offsetPath + doc.getPath();
        Log.debug("getRemoteStorageEntryForLocal remoteParentPath:" + remoteParentPath);	    
        String entryName = doc.getName();
        
        Log.debug("getRemoteStorageEntryForLocal remoteFilePath:" + remote.FILE.localRootPath + remoteParentPath + entryName);

        File entry = new File(remote.FILE.localRootPath + remoteParentPath, entryName);
        int subEntryType = getEntryType(entry);
        String subEntryRevision = null;
		long subEntrySize = 0L;
		long lastChangeTime = 0L;
		long createTime = 0L;
		if(subEntryType != 0)
		{
			subEntryRevision = entry.lastModified() + "";
			subEntrySize = entry.length();
			lastChangeTime = entry.lastModified();
			createTime = entry.lastModified();
		}
		
		remoteDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(),  doc.getReposPath(), doc.getPath(), entryName, doc.getLevel(), subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
		remoteDoc.setSize(subEntrySize);
		remoteDoc.setCreateTime(createTime);
		remoteDoc.setLatestEditTime(lastChangeTime);
		remoteDoc.setRevision(subEntryRevision);			    	
		return remoteDoc;
	}
	
	private static Integer getRemoteStorageEntryTypeForLocal(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String name)	
	{
        if(name.isEmpty())
		{
			Log.debug("getRemoteStorageEntryTypeForLocal() name 不能为空");
			return null;
		}
        
        Log.debug("getRemoteStorageEntryTypeForLocal for:" + remotePath + name);
        
        File entry = new File(remote.FILE.localRootPath + remotePath, name);
        return getEntryType(entry);        
	}

	
	private static Integer getRemoteStorageEntryTypeForSftp(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String name) 
	{
        if(name.isEmpty())
		{
			Log.debug("getRemoteStorageEntryTypeForSftp name 不能为空");
			return null;
		}
        
        Log.debug("getRemoteStorageEntryTypeForSftp for:" + remotePath + name);
        
		try {
        	Log.debug("getRemoteStorageEntryTypeForSftp() remoteParentPath:" + remotePath);
        	Vector<?> list = session.sftp.listFiles(remotePath);
			//Log.printObject("list:", list);
			if(list != null)
			{
	        	for(int i=0; i<list.size(); i++)
				{
					LsEntry entry = (LsEntry) list.get(i);
					String entryName = entry.getFilename();
					if(entryName.equals(name))
					{
						return getEntryType(entry);
					}
				}
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return 0;
	}

	private static Doc getRemoteStorageEntryForSftp(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc) 
	{
        Doc remoteDoc = null;
        
        if(doc.getDocId() == 0)	//rootDoc
        {
        	Log.debug("getRemoteStorageEntryForSftp it is rootDoc");
			remoteDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(),  doc.getReposPath(), doc.getPath(), "", doc.getLevel(), 2, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), doc.getSize(), "", doc.offsetPath);
			if(doc.offsetPath != null && doc.offsetPath.isEmpty() == false)
	    	{
	    		Integer type = getRemoteStorageEntryType(session, remote, repos, doc, null);
	    		remoteDoc.setType(type);
	    	}
			return remoteDoc;
        }	
        
        if(doc.getName().isEmpty())
		{
			Log.debug("getRemoteStorageEntryForSftp name 不能为空");
			return null;
		}
		
        Log.debug("getRemoteStorageEntryForSftp doc:" + doc.offsetPath + doc.getPath() + doc.getName());
		try {
        	String remoteParentPath = remote.rootPath + doc.offsetPath + doc.getPath();
        	Log.debug("getRemoteStorageEntryForSftp() remoteParentPath:" + remoteParentPath);
        	Vector<?> list = session.sftp.listFiles(remoteParentPath);
			//Log.printObject("list:", list);
			if(list != null)
			{
	        	for(int i=0; i<list.size(); i++)
				{
					LsEntry entry = (LsEntry) list.get(i);
					String entryName = entry.getFilename();
					if(entryName.equals(doc.getName()))
					{
						int subEntryType = getEntryType(entry);
						String subEntryRevision = entry.getAttrs().getMtimeString();
				    	long subEntrySize = entry.getAttrs().getSize();
				    	long lastChangeTime = entry.getAttrs().getMTime();
				    	long createTime = entry.getAttrs().getATime();
				    	remoteDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(),  doc.getReposPath(), doc.getPath(), entryName, doc.getLevel(), subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
				    	remoteDoc.setSize(subEntrySize);
				    	remoteDoc.setCreateTime(createTime);
				    	remoteDoc.setLatestEditTime(lastChangeTime);
				    	remoteDoc.setRevision(subEntryRevision);			    	
						break;
					}
				}
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return remoteDoc;
	}


	private static Integer getRemoteStorageEntryTypeForFtp(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String name) 
	{
        if(name.isEmpty())
		{
			Log.debug("getRemoteStorageEntryForFtp name 不能为空");
			return null;
		}
		
        Log.debug("getRemoteStorageEntryForFtp for:" + remotePath + name);
        
		try {
        	FTPFile[] list = session.ftp.listFiles(remotePath);
			//Log.printObject("list:", list);
			for(int i=0; i<list.length; i++)
			{
				FTPFile entry = list[i];
				String entryName = entry.getName();
				if(entryName.equals(name))
				{
					return getEntryType(entry);
				}
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return 0;
	}
	
	private static Doc getRemoteStorageEntryForFtp(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc) 
	{
        Doc remoteDoc = null;
        
        if(doc.getDocId() == 0)	//rootDoc
        {
        	Log.debug("getRemoteStorageEntryForFtp it is rootDoc");
			remoteDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(),  doc.getReposPath(), doc.getPath(), "", doc.getLevel(), 2, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), doc.getSize(), "", doc.offsetPath);
			if(doc.offsetPath != null && doc.offsetPath.isEmpty() == false)
	    	{
	    		Integer type = getRemoteStorageEntryType(session, remote, repos, doc, null);
	    		remoteDoc.setType(type);
	    	}
			return remoteDoc;
        }	
        
        if(doc.getName().isEmpty())
		{
			Log.debug("getRemoteStorageEntryForFtp name 不能为空");
			return null;
		}
		
        Log.debug("getRemoteStorageEntryForFtp doc:" + doc.offsetPath +  doc.getPath() + doc.getName());
		try {
        	String remoteParentPath = remote.rootPath + doc.offsetPath + doc.getPath();

        	FTPFile[] list = session.ftp.listFiles(remoteParentPath);
			//Log.printObject("list:", list);
			for(int i=0; i<list.length; i++)
			{
				FTPFile entry = list[i];
				String entryName = entry.getName();
				if(entryName.equals(doc.getName()))
				{
					int subEntryType = getEntryType(entry);
					String subEntryRevision = entry.getTimestamp() + "";
			    	long subEntrySize = entry.getSize();
			    	long lastChangeTime = entry.getTimestamp().getTimeInMillis();
			    	long createTime = lastChangeTime;
			    	remoteDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(),  doc.getReposPath(), doc.getPath(), entryName, doc.getLevel(), subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
			    	remoteDoc.setSize(subEntrySize);
			    	remoteDoc.setCreateTime(createTime);
			    	remoteDoc.setLatestEditTime(lastChangeTime);
			    	remoteDoc.setRevision(subEntryRevision);
					break;
				}
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return remoteDoc;
	}
	

	private static Integer getRemoteStorageEntryTypeForSmb(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String name) 
	{
        if(name.isEmpty())
		{
			Log.debug("getRemoteStorageEntryForSmb name 不能为空");
			return null;
		}
		
        Log.debug("getRemoteStorageEntryForSmb for:" + remotePath + name);
        
		try {
        	SmbFile entry = session.smb.getEntry(remotePath, name);
        	if(entry != null && entry.exists())
        	{
				return getEntryType(entry);
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return 0;
	}

	private static Doc getRemoteStorageEntryForSmb(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc) 
	{
        Doc remoteDoc = null;
        
        if(doc.getDocId() == 0)	//rootDoc
        {
        	Log.debug("getRemoteStorageEntryForSmb it is rootDoc");
			remoteDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(),  doc.getReposPath(), doc.getPath(), "", doc.getLevel(), 2, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), doc.getSize(), "", doc.offsetPath);
			if(doc.offsetPath != null && doc.offsetPath.isEmpty() == false)
	    	{
	    		Integer type = getRemoteStorageEntryType(session, remote, repos, doc, null);
	    		remoteDoc.setType(type);
	    	}
			return remoteDoc;
        }	
        
        if(doc.getName().isEmpty())
		{
			Log.debug("getRemoteStorageEntryForSmb name 不能为空");
			return null;
		}
		
        Log.debug("getRemoteStorageEntryForSmb doc:" + doc.offsetPath + doc.getPath() + doc.getName());
		try {
        	String remoteParentPath = remote.rootPath + doc.offsetPath + doc.getPath();
        	Log.debug("getRemoteStorageEntryForSmb remoteParentPath:" + remoteParentPath + " docName:" + doc.getName());
    		SmbFile entry = session.smb.getEntry(remoteParentPath, doc.getName());
        	if(entry != null && entry.exists())
        	{
				int subEntryType = getEntryType(entry);
				String subEntryRevision = entry.lastModified() + "";
			    long subEntrySize = entry.length();
			    long lastChangeTime = entry.lastModified();
			    long createTime = entry.createTime();
			    remoteDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(),  doc.getReposPath(), doc.getPath(), doc.getName(), doc.getLevel(), subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), subEntrySize, "", doc.offsetPath);
			    remoteDoc.setSize(subEntrySize);
			    remoteDoc.setCreateTime(createTime);
			    remoteDoc.setLatestEditTime(lastChangeTime);
			    remoteDoc.setRevision(subEntryRevision);
			}
		} catch (Exception e) {
			Log.info(e);
		}
        return remoteDoc;
	}
	
	private static Integer getRemoteStorageEntryTypeForSvn(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String name, String commitId) 
	{
        if(name.isEmpty())
		{
			Log.debug("getRemoteStorageEntryForSvn name 不能为空");
			return null;
		}
		
        Log.debug("getRemoteStorageEntryForSvn for:" + remotePath + name);
        
		try {
        	Collection<SVNDirEntry> list = session.svn.listFiles(remotePath, commitId);
			if(list != null)
			{
				Iterator<SVNDirEntry> iterator = list.iterator();
    	        while (iterator.hasNext()) 
	    	    {
	    	    	SVNDirEntry subEntry = iterator.next();
	    	    	int subEntryType = getEntryType(subEntry.getKind());
	    	    	if(subEntryType <= 0)
	    	    	{
	    	    		continue;
	    	    	}
	    	    	
	    	    	String subEntryName = subEntry.getName();
	    	    	if(subEntryName.equals(name))
	    	    	{
	    	    		return subEntryType;
	    	    	}
	    	    }
    	    }
		} catch (Exception e) {
			Log.info(e);
		}
        return 0;
	}

	private static Doc getRemoteStorageEntryForSvn(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId) 
	{
        Doc remoteDoc = null;
        
        if(doc.getDocId() == 0)	//rootDoc
        {
        	Log.debug("getRemoteStorageEntryForSvn it is rootDoc");
			remoteDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(),  doc.getReposPath(), doc.getPath(), "", doc.getLevel(), 2, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), doc.getSize(), "", doc.offsetPath);
	    	remoteDoc.setRevision(commitId);
	    	if(doc.offsetPath != null && doc.offsetPath.isEmpty() == false)
	    	{
	    		Integer type = getRemoteStorageEntryType(session, remote, repos, doc, commitId);
	    		remoteDoc.setType(type);
	    	}
	    	return remoteDoc;
        }	
        
        if(doc.getName().isEmpty())
		{
			Log.debug("getRemoteStorageEntryForSvn name 不能为空");
			return null;
		}
		
        Log.debug("getRemoteStorageEntryForSvn doc:" + doc.offsetPath + doc.getPath() + doc.getName());
		try {
        	String remoteParentPath = remote.rootPath + doc.offsetPath + doc.getPath();

        	Collection<SVNDirEntry> list = session.svn.listFiles(remoteParentPath, commitId);
			if(list != null)
			{
				Iterator<SVNDirEntry> iterator = list.iterator();
    	        while (iterator.hasNext()) 
	    	    {
	    	    	SVNDirEntry subEntry = iterator.next();
	    	    	int subEntryType = getEntryType(subEntry.getKind());
	    	    	if(subEntryType <= 0)
	    	    	{
	    	    		continue;
	    	    	}
	    	    	
	    	    	String subEntryName = subEntry.getName();
	    	    	if(subEntryName.equals(doc.getName()))
	    	    	{
	    	    		Long lastChangeTime = subEntry.getDate().getTime();
	    	    		remoteDoc = buildBasicDoc(doc.getVid(), doc.getDocId(), doc.getPid(), doc.getReposPath(), doc.getPath(), doc.getName(), doc.getLevel(), subEntryType, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null, doc.offsetPath);
	    	    		remoteDoc.setSize(subEntry.getSize());
	    	    		remoteDoc.setCreateTime(lastChangeTime);
	    	    		remoteDoc.setLatestEditTime(lastChangeTime);
	    	    		remoteDoc.setCreatorName(subEntry.getAuthor());
	    	    		remoteDoc.setLatestEditorName(subEntry.getAuthor());
	    	    		remoteDoc.setRevision(subEntry.getRevision()+"");
	    	    		break;
	    	    	}
	    	    }
    	    }
		} catch (Exception e) {
			Log.info(e);
		}
        return remoteDoc;
	}

	private static Integer getRemoteStorageEntryTypeForGit(RemoteStorageSession session, RemoteStorageConfig remote, String remotePath, String name, String commitId) 
	{
        if(name.isEmpty())
		{
			Log.debug("getRemoteStorageEntryForGit name 不能为空");
			return null;
		}
        
        Log.debug("getRemoteStorageEntryForGit for:" + remotePath + name);
        
		try {
			
        	String remoteEntryPath = remotePath + name;        	        	
        	return session.git.checkPath(remoteEntryPath, commitId);
		} catch (Exception e) {
			Log.info(e);
		}
        return 0;
	}

	private static Doc getRemoteStorageEntryForGit(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId) 
	{
        Doc remoteDoc = null;
        
        if(doc.getDocId() == 0)	//rootDoc
        {
        	Log.debug("getRemoteStorageEntryForGit it is rootDoc");
			remoteDoc = buildBasicDoc(repos.getId(), doc.getDocId(), doc.getPid(),  doc.getReposPath(), doc.getPath(), "", doc.getLevel(), 2, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), doc.getSize(), "", doc.offsetPath);
	    	remoteDoc.setRevision(commitId);
	    	if(doc.offsetPath != null && doc.offsetPath.isEmpty() == false)
	    	{
	    		Integer type = getRemoteStorageEntryType(session, remote, repos, doc, commitId);
	    		remoteDoc.setType(type);
	    	}
			return remoteDoc;
        }	
        
        if(doc.getName().isEmpty())
		{
			Log.debug("getRemoteStorageEntryForGit name 不能为空");
			return null;
		}
        
        Log.debug("getRemoteStorageEntryForGit doc:" + doc.getPath() + doc.getName());
		try {
			
        	String remoteEntryPath = doc.offsetPath + doc.getPath() + doc.getName();        	        	
        	Integer type = session.git.checkPath(remoteEntryPath, commitId);
        	if(type == null)
        	{
        		return null;
        	}
        	
            if(type ==  0) 
    		{
    	    	return null;
    		}
            
            if(commitId != null) 
    		{
            	//If revision already set, no need to get revision
            	remoteDoc = buildBasicDoc(doc.getVid(), doc.getDocId(), doc.getPid(), doc.getReposPath(), doc.getPath(), doc.getName(), doc.getLevel(), type, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null, doc.offsetPath);
    	    	remoteDoc.setRevision(commitId);
    	    	return remoteDoc;
    		}
            
            RevCommit commit = session.git.getLatestRevCommit(doc);
            if(commit == null)
            {
            	Log.debug("getRemoteStorageEntryForGit() Failed to getLatestRevCommit");
            	return null;
            }
    		
            commitId=commit.getName();  //revision
    	    String author=commit.getAuthorIdent().getName();  //作者
    	    String commitUser=commit.getCommitterIdent().getName();
    	    long commitTime = session.git.convertCommitTime(commit.getCommitTime());
    	            
    	    //String commitUserEmail=commit.getCommitterIdent().getEmailAddress();//提交者
            remoteDoc = buildBasicDoc(doc.getVid(), doc.getDocId(), doc.getPid(), doc.getReposPath(), doc.getPath(), doc.getName(), doc.getLevel(), type, doc.getIsRealDoc(), doc.getLocalRootPath(), doc.getLocalVRootPath(), null, null, doc.offsetPath);
    		remoteDoc.setRevision(commitId);
            remoteDoc.setCreatorName(author);
            remoteDoc.setLatestEditorName(commitUser);
            remoteDoc.setLatestEditTime(commitTime);
		} catch (Exception e) {
			Log.info(e);
		}
        return remoteDoc;
	}


	private static int getEntryType(FileMode fileMode) {
		if(fileMode == null)
		{
			return -1;
		}
		
		int bits = fileMode.getBits();
		switch(bits & FileMode.TYPE_MASK)
		{
		case FileMode.TYPE_FILE:
			return 1;
		case FileMode.TYPE_TREE:
			return 2;
		case FileMode.TYPE_MISSING:
			return 0;
		}
		return -1;
	}


	private static int getEntryType(SVNNodeKind nodeKind) {
		if(nodeKind == null)
		{
			return -1;
		}
    	
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
	
	private static int getEntryType(SmbFile entry) {
		try {
			if(entry.isDirectory())
			{
				return 2;
			}
			else
			{
				return 1;
			}
		} catch (SmbException e) {
			Log.info(e);
		}
		return 0;
	}

	private static int getEntryType(FTPFile entry) {
		if(entry.isDirectory())
		{
			return 2;
		}
		return 1;
	}

	private static int getEntryType(LsEntry subEntry) {
		if(subEntry.getAttrs().isDir())
		{
			return 2;
		}
		return 1;
	}
	
	private static int getEntryType(File file) {
		if(file.exists() == false)
		{
			return 0;
		}
		
		if(file.isDirectory())
		{
			return 2;
		}
		return 1;
	}
	

	protected static String remoteStorageVerReposCommitAndPush(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, String commitUser, String commitMsg, DocPushResult pushResult) {
		String revision = null;
		switch(session.protocol)
		{
		case "svn":
			revision = session.svn.doCommit(commitMsg, commitUser, pushResult, pushResult.actionList);
			break;
		case "git":
			revision = session.git.doCommit(commitMsg, commitUser, pushResult, pushResult.actionList);
			break;
		}
		
		if(revision != null)
		{
			updateRemoteStorageDbEntry(remote, repos, pushResult, pushResult.actionList, revision);
		}
		pushResult.revision = revision;
		return revision;
	}
	
	protected boolean doPullFromRemoteStorage(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId, boolean recurcive, boolean force, ReturnAjax rt) {
		Log.info(" doPullFromRemoteStorage [" + doc.getPath() + doc.getName() + "] commitId:" + commitId + " recurcive:" + recurcive + " force:" + force);
		
		boolean ret = false;
		DocPullResult pullResult = new DocPullResult();
		pullResult.totalCount = 0;
		pullResult.failCount = 0;
		pullResult.successCount = 0;
		pullResult.successDocList = new ArrayList<Doc>();
	
		Doc localDoc = fsGetDoc(repos, doc);
		Doc dbDoc = getRemoteStorageDBEntry(repos, doc, false, remote);
		Doc remoteDoc = remoteStorageGetEntry(session, remote, repos, doc, commitId); 
		
		Integer subEntryPullFlag = 1;
		if(recurcive)
		{
			subEntryPullFlag = 2;
		}

		ret = doPullEntryFromRemoteStorage(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, commitId, subEntryPullFlag, force, pullResult);
		
		rt.setDataEx(pullResult);
		return ret;
	}
	
	protected boolean doPullFromRemoteStorageForDownload(RemoteStorageSession session, RemoteStorageConfig remote, Repos repos, Doc doc, String commitId, boolean recurcive, boolean force, DocAuth curDocAuth, HashMap<Long, DocAuth> docAuthHashMap, ReturnAjax rt) {
		Log.debug(" doPullFromRemoteStorageForDownload [" + doc.getPath() + doc.getName() + "]");
		
		if(curDocAuth == null || curDocAuth.getDownloadEn() == null || curDocAuth.getDownloadEn() != 1)
		{
			Log.debug("doPullFromRemoteStorageForDownload() have no right to download [" + doc.getPath() + doc.getName() + "]");
			return false;
		}
		
		boolean ret = false;
		DocPullResult pullResult = new DocPullResult();
		pullResult.totalCount = 0;
		pullResult.failCount = 0;
		pullResult.successCount = 0;
		pullResult.successDocList = new ArrayList<Doc>();
	
		Doc localDoc = fsGetDoc(repos, doc);
		Doc dbDoc = getRemoteStorageDBEntry(repos, doc, false, remote);
		Doc remoteDoc = remoteStorageGetEntry(session, remote, repos, doc, commitId); 
		
		Integer subEntryPullFlag = 1;
		if(recurcive)
		{
			subEntryPullFlag = 2;
		}

		ret = doPullEntryFromRemoteStorageForDownload(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, commitId, subEntryPullFlag, force, curDocAuth, docAuthHashMap, pullResult);
		
		rt.setDataEx(pullResult);
		return ret;
	}
	
	//pushType: 1: pushLocalChangeOnly 2: pushLocalChangeOnly and treatRevisionNllAsLocalChange 3: 标准模式  4: 标准模式 + treatRemoteChangesAsLocalChange
	protected boolean doPushToRemoteStorage(RemoteStorageSession session,  RemoteStorageConfig remote, Repos repos, Doc doc, User accessUser, String commitMsg, 
			boolean recurcive, int pushType, ReturnAjax rt) {
		Log.info("doPushToRemoteStorage() doc:[" +  doc.getPath() + doc.getName() + "]");
		
		//ignore check
		if(doc.isRemotePushEnabled == null)
		{
			doc.isRemotePushEnabled = isRemotePushEnabled(remote, doc, null);
	    }
		if(doc.isRemotePushEnabled == 0)
		{
    		Log.info("doPushToRemoteStorage() [" + doc.getPath() + doc.getName() + "] was ignored for RemotePush");
			return false;
		}
		
		boolean ret = false;
		DocPushResult pushResult = new DocPushResult();
		pushResult.totalCount = 0;
		pushResult.failCount = 0;
		pushResult.successCount = 0;
		pushResult.actionList = new ArrayList<CommitAction>();
		
		Doc localDoc = fsGetDoc(repos, doc);
		Log.printObject("doPushToRemoteStorage() localDoc:", localDoc);
		
		Doc dbDoc = getRemoteStorageDBEntry(repos, doc, false, remote);
		Log.printObject("doPushToRemoteStorage() dbDoc:", dbDoc);
		
		//TODO: 如果doc.offsetPath非空的话，那么远程根目录实际上并不是真正的根目录（此时是需要检查节点是否存在的）
		Doc	remoteDoc = remoteStorageGetEntry(session, remote, repos, doc, null); 
		Log.printObject("doPushToRemoteStorage() remoteDoc:", remoteDoc);			
		
		String lockInfo = "doPushToRemoteStorage [" + doc.getPath() + doc.getName()+ "] at repos[" + repos.getName() + "] remote protocol: [" + remote.protocol + "]";
		if(lockRemoteStorage(remote, accessUser, doc, lockInfo) == false)
		{
			Log.info("doPushToRemoteStorage() lockRemoteStorage [" + remote.remoteStorageIndexLib + "] failed");
			return false;
		}
		
		Date date1 = new Date();
    	
		if(remoteDoc == null || remoteDoc.getType() == null || remoteDoc.getType() == 0)
		{
			if(localDoc != null && localDoc.getType() != null && localDoc.getType() != 0)
			{
				Log.info("doPushToRemoteStorage() addDirsToRemoteStorage:" + remote.rootPath + doc.offsetPath + doc.getPath());				
				addDirsToRemoteStorage(session, remote, remote.rootPath, doc.offsetPath + doc.getPath(), commitMsg,  accessUser.getName());
			}
		}
		
		Integer subEntryPushFlag = 1;
		if(recurcive)
		{
			subEntryPushFlag = 2;
		}
		ret = doPushEntryToRemoteStorage(session, remote, repos, doc, dbDoc, localDoc, remoteDoc, accessUser, subEntryPushFlag, pushResult, pushResult.actionList, false, pushType);
		if(ret == true)
		{
			if(remote.isVerRepos == true)
			{
				if(pushResult.actionList.size() > 0)
				{
					if(remoteStorageVerReposCommitAndPush(session, remote, repos, accessUser.getName(), commitMsg, pushResult) == null)
					{
						pushResult.successCount = 0;
						pushResult.failCount = pushResult.totalCount;
					}
				}
			}
			else
			{
				pushResult.revision = "";
			}
		}

		rt.setDataEx(pushResult);
		Log.info("doPushToRemoteStorage() doc:[" +  doc.getPath() + doc.getName() + "] ret:" + ret);

		unlockRemoteStorage(remote, accessUser, doc);
		
		Date date2 = new Date();
		Log.debug("远程推送耗时：" + (date2.getTime() - date1.getTime()) + "ms doPushToRemoteStorage() [" +  remote.remoteStorageIndexLib + "] for [" + doc.getPath() + doc.getName() + "]\n");
		return ret;	
	}
	
	//这是一个阻塞函数，只有在获取到锁才会退出
	private boolean lockRemoteStorage(RemoteStorageConfig remote, User accessUser, Doc doc, String lockInfo) {
		Object synclock = getRemoteStorageSyncLock(remote.remoteStorageIndexLib);
		int retrySleepTime = 60*1000;	//60 seconds
		int retryCount = 120;	//120次（最多等待2小时）
		
		RemoteStorageLock remoteStorageLock = lockRemoteStorage(remote.remoteStorageIndexLib, 2*60*60*1000, accessUser, doc, synclock, lockInfo, retryCount, retrySleepTime);
		if(remoteStorageLock != null)
		{
			//Log.info("lockRemoteStorage() remoteStorageLock [" + remote.remoteStorageIndexLib + "] lock success for [" + doc.getPath() + doc.getName() + "]");
			return true;
		}
		
		return false;
	}
	
	private RemoteStorageLock lockRemoteStorage(String remoteStorageName, long lockDuration, User accessUser, Doc doc, Object synclock, String info, int retryCount, int retrySleepTime) 
	{
		Log.debug("lockRemoteStorage() remoteStorageLock [" + remoteStorageName + "] Start");

		RemoteStorageLock remoteStorageLock = null;
		RemoteStorageLock curLock = null;
		String lockInfo = "lockRemoteStorage() synclock:" + remoteStorageName;
		String lockName = "remoteStorageSyncLock" + remoteStorageName;
		
		int count = 0;
		for(;;)
		{
			synchronized(synclock)
			{
				redisSyncLockEx(lockName ,lockInfo);
				
				curLock = getRemoteStorageLock(remoteStorageName);
				if(curLock == null)
				{
					//Log.debug("lockRemoteStorage() remoteStorageLock [" + remoteStorageName + "] not locked");
					curLock = new RemoteStorageLock();
					curLock.state = 1;
					curLock.name = remoteStorageName;
					curLock.lockBy = accessUser.getId();
					curLock.locker = accessUser.getName();
					curLock.createTime = new Date().getTime();
					curLock.lockTime = curLock.createTime + lockDuration;
					curLock.synclock = new SyncLock();
					curLock.server = clusterServerUrl;
					curLock.info = info;
					addRemoteStorageLock(remoteStorageName, curLock);
					remoteStorageLock = curLock;
				}
				else
				{
					//check if it is locked
					if(curLock.state == 0)
					{
						//Log.debug("lockRemoteStorage() remoteStorageLock [" + remoteStorageName + "] not locked");
						curLock.state = 1;
						curLock.lockBy = accessUser.getId();
						curLock.locker = accessUser.getName();
						curLock.createTime = new Date().getTime();
						curLock.lockTime = curLock.createTime + lockDuration;
						curLock.server = clusterServerUrl;
						curLock.info = info;
						remoteStorageLock = curLock;
						updateRemoteStorageLock(remoteStorageName, curLock);
					}
					else
					{
						long curTime = new Date().getTime();
						if(curLock.lockTime < curTime)
						{
							Log.info("lockRemoteStorage() remoteStorageLock [" + curLock.name + "] is expired");
							curLock.state = 1;
							curLock.lockBy = accessUser.getId();
							curLock.locker = accessUser.getName();
							curLock.createTime = new Date().getTime();
							curLock.lockTime = curLock.createTime + lockDuration;
							curLock.server = clusterServerUrl;
							curLock.info = info;
							remoteStorageLock = curLock;
							updateRemoteStorageLock(remoteStorageName, curLock);
						}
						else
						{
							Log.debug("lockRemoteStorage() " + remoteStorageName + " was locked by " + curLock.locker + " state:" + curLock.state);
							long lockedTime = new Date().getTime() - curLock.createTime;
							Log.debug("[" + remoteStorageName + "] 已被 [" + curLock.locker + "] 锁定了 " + lockedTime  + " ms [" + curLock.info + "]\n");
						}
					}
				}
				
				redisSyncUnlockEx(lockName, lockInfo, synclock);
			}
		
			if(remoteStorageLock != null) 
			{
				Log.info("lockRemoteStorage() remoteStorageLock [" + remoteStorageName + "] Lock success for [" + doc.getPath() + doc.getName() + "]");	
				return remoteStorageLock;
			}
			
			//wait for wake up or timeout
			count++;
			if(count >= retryCount)
			{
				Log.info("lockRemoteStorage() remoteStorageLock [" + remoteStorageName + "] lock failed with max retries:" + retryCount + " for [" + doc.getPath() + doc.getName() + "]");
				break;
			}
			
			Log.info("lockRemoteStorage() remoteStorageLock [" + remoteStorageName + "] lock failed " + count + " times for [" + doc.getPath() + doc.getName() + "] , sleep " + retrySleepTime + " ms and try again");
			
			synchronized(curLock.synclock)
			{
				try {
					curLock.synclock.wait(retrySleepTime);
				} catch (InterruptedException e) {
					errorLog(e);
				}
			}
		}
		return null;
	}


	private Object getRemoteStorageSyncLock(String remoteStorage) {
		Object synclock = remoteStorageSyncLockHashMap.get(remoteStorage);
    	if(synclock == null)
    	{
    		Log.debug("getRemoteStorageSyncLock() synclock for " + remoteStorage + " is null, do create");
    		synclock = new Object();
    		remoteStorageSyncLockHashMap.put(remoteStorage, synclock);
    	}
    	return synclock;
	}

	private Integer isRemotePushEnabled(RemoteStorageConfig remote, Doc doc, Doc parentDoc) 
	{
		//最大文件检查
		if(remote.allowedMaxFile != null && remote.allowedMaxFile > 0 && doc.getSize() != null)
		{
			if(doc.getSize() > remote.allowedMaxFile)
			{
				Log.debug("isRemotePushEnabled() doc size:" + doc.getSize() + " > allowedMaxFile:" + remote.allowedMaxFile);				
				return 0;
			}
		}
		
		//文件名检查
		if(remote.notAllowedFileHashMap != null)
		{
			if(remote.notAllowedFileHashMap.get(doc.getName()) != null)
			{
				Log.debug("isRemotePushEnabled() [" + doc.getName() + "] is notAllowedFile");				
				return 0;
			}
		}
		
		//文件类型检查(目录不检查)
		if(doc.getType() != null && doc.getType() == 1)
		{
			String fileType = null;
			if(remote.isUnkownFileAllowed != null && remote.isUnkownFileAllowed == 0)	//不允许未知文件类型
			{
				//不允许未知文件类型
				fileType = FileUtil.getFileSuffix(doc.getName());
				Log.debug("isRemotePushEnabled() fileType:" + fileType + " for [" + doc.getName() + "]");				
				if(fileType == null || fileType.isEmpty())
				{
					Log.debug("isRemotePushEnabled() [" + doc.getName() + "] is unknown file type");				
					return 0;
				}				
			}
			
			if(remote.allowedFileTypeHashMap != null) //白名单
			{
				if(fileType == null)
				{
					fileType = FileUtil.getFileSuffix(doc.getName());
				}
				
				if(fileType == null || fileType.isEmpty())
				{
					fileType = "";	//避免后续再次获取文件类型
				}
				else
				{
					if(remote.allowedFileTypeHashMap.get(fileType) == null)
					{
						Log.debug("isRemotePushEnabled() [" + doc.getName() + "] is not in allowedFileTypeList");				
						return 0;
					}
				}
			}
			
			if(remote.notAllowedFileTypeHashMap != null) //黑名单
			{
				if(fileType == null)
				{
					fileType = FileUtil.getFileSuffix(doc.getName());
				}
				
				if(fileType != null && !fileType.isEmpty())
				{
					if(remote.notAllowedFileTypeHashMap.get(fileType) != null)
					{
						Log.debug("isRemotePushEnabled() [" + doc.getName() + "] is in notAllowedFileTypeList");				
						return 0;
					}
				}
			}
		}
		
		if(parentDoc == null || parentDoc.isRemotePushEnabled == null)
		{
			return isRemotePushIgnored(remote, doc, true) == true? 0:1;	
		}
		
		if(parentDoc.isRemotePushEnabled == 0)
		{
			return 0;
		}
		
		if(remote.ignoreHashMap != null && remote.ignoreHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			Log.debug("isRemotePushEnabled() RemotePush was ignored for [/" + doc.getPath() + doc.getName() + "]");
			return 0;
		}
		
		return 1;
	}
	
	private boolean isRemotePushIgnored(RemoteStorageConfig remote, Doc doc, boolean parentCheck) {
		if(remote.ignoreHashMap == null)
		{
			return false;
		}
		
		if(remote.ignoreHashMap.get("/" + doc.getPath() + doc.getName()) != null)
		{
			Log.debug("isRemotePushIgnored() RemotePush was ignored for [/" + doc.getPath() + doc.getName() + "]");
			return true;
		}
		
		if(parentCheck == false)
		{
			return false;
		}
		
		//check if textSearch was ignored for root doc
		if(remote.ignoreHashMap.get("/") != null)
		{
			Log.debug("isRemotePushIgnored() RemotePush was ignored for [/]");
			return true;
		}
		
		//check if textSearch was was ignored for parent doc
		if(doc.getPath() != null)
		{
			String [] paths = doc.getPath().split("/");
			String path = "/" + paths[0];
			Log.debug("isRemotePushIgnored() path:" + path);
			if(remote.ignoreHashMap.get(path) != null)
			{
				Log.debug("isRemotePushIgnored() RemotePush was ignored:" + path);
				return true;
			}
			
			for(int i = 1; i < paths.length; i++)
			{
				path = path + "/" + paths[i];
				if(remote.ignoreHashMap.get(path) != null)
				{
					Log.debug("isRemotePushIgnored() RemotePush was ignored:" + path);
					return true;
				}
			}			
		}
		return false;
	}

	protected JSONObject getSystemInfo() {
		JSONObject systemInfo = new JSONObject();
		
		String defaultReposStorePath = Path.getDefaultReposRootPath(OSType);
		systemInfo.put("defaultReposStorePath", defaultReposStorePath);
		
		String systemLogStorePath = Path.getSystemLogStorePath(OSType);
		systemInfo.put("systemLogStorePath", systemLogStorePath);
		
		String indexDBStorePath = Path.getDataStorePath(OSType);
		systemInfo.put("indexDBStorePath", indexDBStorePath);

		String salesDataStorePath = Path.getSaleDataStorePath(OSType);
		systemInfo.put("salesDataStorePath", salesDataStorePath);
		
		return systemInfo;
	}
	
	protected void executeDownloadPrepareTask(DownloadPrepareTask task, String requestIP) 
	{	
		Log.debug("executeDownloadPrepareTask() taskType:" + task.type);
		switch(task.type)
		{
		case 0:
			executeDownloadPrepareTaskForLocalFolder(task, requestIP);
			break;
		case 1:
			executeDownloadPrepareTaskForReposFolder(task, requestIP);
			break;
		case 2:
			executeDownloadPrepareTaskForVerReposEntry(task, requestIP);
			break;
		case 3:
			executeDownloadPrepareTaskForRemoteServerEntry(task, requestIP);
			break;
		default:
			break;
		}
	}
	
	private void executeDownloadPrepareTaskForRemoteServerEntry(DownloadPrepareTask task, String requestIP) {
		Repos repos = task.repos;
		Doc doc = task.doc;
		ReposAccess reposAccess = task.reposAccess;		

		Long deleteDelayTime = null;		
		
		//Do checkout to local
		String tmpCheckoutPath = Path.getReposTmpPathForDownload(repos,reposAccess.getAccessUser());
		String tmpCheckoutName = doc.getName();
		if(tmpCheckoutName.isEmpty())
		{
			tmpCheckoutName = repos.getName();
		}
		
		//downloadAll != 1 表示只下载在这次提交的文件
		String commitId = task.commitId;
		
		task.info = "版本检出中...";
		//将历史版本CheckOut到临时目录
		if(remoteServerCheckOutForDownload(repos, doc, reposAccess, tmpCheckoutPath, null, tmpCheckoutName, commitId, true, false, null) == null)
		{
			task.status = 3; //Failed
			task.info = "版本检出失败(当前版本没有文件或授权)";
			deleteDelayTime = 300L; //5分钟后删除
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  task.repos, task.doc, null, task.info);								
			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;
		}
		
		File entry = new File(tmpCheckoutPath, tmpCheckoutName);
		if(entry.exists() == false)
		{
			task.status = 3; //Failed
			task.info = "版本检出失败(当前版本没有文件或授权)";
			deleteDelayTime = 300L; //5分钟后删除
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  task.repos, task.doc, null, task.info);								
			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;
		}
		
		if(entry.isFile())
		{	
			if(repos.encryptType != null && repos.encryptType != 0)
			{
				//解密指定目录的文件
				task.info = "文件解密中...";
				decryptFileOrDir(repos, tmpCheckoutPath, tmpCheckoutName);
			}
			
			task.status = 2; //Success
			task.info = "版本检出成功";
			
			//更新targetPath和targetName
			task.targetPath = tmpCheckoutPath;
			task.targetName = tmpCheckoutName;
			
			deleteDelayTime = 72000L; //20小时后			
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "成功",  task.repos, task.doc, null, task.info);		
			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;
		}
	
		if(FileUtil.isEmptyDir(tmpCheckoutPath + tmpCheckoutName, true))
		{
			task.status = 3; //Failed
			task.info = "空目录无法下载";
			deleteDelayTime = 300L; //5分钟后删除
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  task.repos, task.doc, null, task.info);								
			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;		
		}
		
		String targetPath = task.targetPath;
		String targetName = task.targetName;
		
		//检查并创建压缩目录
		File dir = new File(targetPath);
		if(!dir.exists())
		{
			dir.mkdirs();
		}
		
		//加密的仓库，需要先解密再压缩
		if(repos.encryptType != null && repos.encryptType != 0)
		{
			//解密指定目录的文件
			task.info = "文件解密中...";
			decryptFileOrDir(repos, tmpCheckoutPath, tmpCheckoutName);
			
			task.info = "目录压缩中...";
			if(doCompressDir(tmpCheckoutPath, tmpCheckoutName, targetPath, targetName, null) == false)
			{
				task.status = 3; //Failed
				task.info = "目录压缩失败";
				deleteDelayTime = 300L; //5分钟后删除
				addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  task.repos, task.doc, null, task.info);								

				//删除临时目录
				FileUtil.delDir(tmpCheckoutPath + tmpCheckoutName);
				
				//延时删除任务和压缩文件
				addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
				return;
			}

			task.status = 2; //Success
			task.info = "目录压缩成功";
			deleteDelayTime = 72000L; //20小时后			
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "成功",  task.repos, task.doc, null, task.info);				
			
			//删除临时目录
			FileUtil.delDir(tmpCheckoutPath + tmpCheckoutName);

			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;
		}
		
		//压缩目录
		task.info = "目录压缩中...";
		if(doCompressDir(tmpCheckoutPath, tmpCheckoutName, task.targetPath, task.targetName, null) == false)
		{
			task.status = 3; //Failed
			task.info = "目录压缩失败";
			deleteDelayTime = 300L; //5分钟后删除
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  task.repos, task.doc, null, task.info);								
			
			//删除临时目录
			FileUtil.delDir(tmpCheckoutPath + tmpCheckoutName);		
			
			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;		
		}
		
		task.status = 2; //Success
		task.info = "目录压缩成功";
		deleteDelayTime = 72000L; //20小时后			
		addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "成功",  task.repos, task.doc, null, task.info);				

		//删除临时目录
		FileUtil.delDir(tmpCheckoutPath + tmpCheckoutName);	
		
		//延时删除任务和压缩文件
		addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
		return;		

	}

	private void executeDownloadPrepareTaskForVerReposEntry(DownloadPrepareTask task, String requestIP) {
		Repos repos = task.repos;
		Doc doc = task.doc;
		ReposAccess reposAccess = task.reposAccess;		

		Long deleteDelayTime = null;		
		
		//Do checkout to local
		String tmpCheckoutPath = Path.getReposTmpPathForDownload(repos,reposAccess.getAccessUser());
		String tmpCheckoutName = doc.getName();
		if(tmpCheckoutName.isEmpty())
		{
			tmpCheckoutName = repos.getName();
		}
		
		//downloadAll != 1 表示只下载在这次提交的文件
		Integer downloadAll = task.downloadAll;
		String commitId = task.commitId;
		HashMap<String, String> downloadList = null;
		if(downloadAll == null || downloadAll == 0)
		{
			downloadList  = new HashMap<String,String>();
			buildDownloadList(repos, true, doc, commitId, downloadList);
			if(downloadList != null && downloadList.size() == 0)
			{
				Log.debug("executeDownloadPrepareTaskForVerReposEntry() there is no changed file for commit:" + commitId);
				task.status = 3; //Failed
				task.info = "版本检出失败(当前版本没有改动的文件)";
				return;
			}
		}
		
		task.info = "版本检出中...";
		if(verReposCheckOutForDownload(repos, doc, reposAccess, tmpCheckoutPath, tmpCheckoutName, commitId, true, false, downloadList) == null)
		{
			Log.debug("executeDownloadPrepareTaskForVerReposEntry() verReposCheckOutForDownload result is null for commit:" + commitId);

			task.status = 3; //Failed
			task.info = "版本检出失败(当前版本没有文件或授权)";
			deleteDelayTime = 300L; //5分钟后删除
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  task.repos, task.doc, null, task.info);								
			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;
		}
		
		File entry = new File(tmpCheckoutPath, tmpCheckoutName);
		if(entry.exists() == false)
		{
			Log.debug("executeDownloadPrepareTaskForVerReposEntry() checkouted entry [" + tmpCheckoutPath + tmpCheckoutName + "] not exists for commit:" + commitId);
			task.status = 3; //Failed
			task.info = "版本检出失败(当前版本没有文件或者授权)";
			deleteDelayTime = 300L; //5分钟后删除
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  task.repos, task.doc, null, task.info);								
			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;
		}
		
		if(entry.isFile())
		{	
			Log.debug("executeDownloadPrepareTaskForVerReposEntry() checkouted entry [" + tmpCheckoutPath + tmpCheckoutName + "] is File for commit:" + commitId);

			if(repos.encryptType != null && repos.encryptType != 0)
			{
				//解密指定目录的文件
				task.info = "文件解密中...";
				Log.debug("executeDownloadPrepareTaskForVerReposEntry() 文件解密中...");
				decryptFileOrDir(repos, tmpCheckoutPath, tmpCheckoutName);
			}
			
			task.status = 2; //Success
			task.info = "版本检出成功";
			
			//更新targetPath和targetName
			task.targetPath = tmpCheckoutPath;
			task.targetName = tmpCheckoutName;
			
			deleteDelayTime = 72000L; //20小时后			
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "成功",  task.repos, task.doc, null, task.info);		
			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;
		}
	
		if(FileUtil.isEmptyDir(tmpCheckoutPath + tmpCheckoutName, true))
		{
			task.status = 3; //Failed
			task.info = "空目录无法下载";
			deleteDelayTime = 300L; //5分钟后删除
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  task.repos, task.doc, null, task.info);								
			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;		
		}
		
		String targetPath = task.targetPath;
		String targetName = task.targetName;
		
		//检查并创建压缩目录
		File dir = new File(targetPath);
		if(!dir.exists())
		{
			dir.mkdirs();
		}
		
		//加密的仓库，需要先解密再压缩
		if(repos.encryptType != null && repos.encryptType != 0)
		{
			//解密指定目录的文件
			task.info = "文件解密中...";
			Log.debug("executeDownloadPrepareTaskForVerReposEntry() 目录解密中...");
			decryptFileOrDir(repos, tmpCheckoutPath, tmpCheckoutName);
			
			task.info = "目录压缩中...";
			Log.debug("executeDownloadPrepareTaskForVerReposEntry() 目录压缩中...");
			if(doCompressDir(tmpCheckoutPath, tmpCheckoutName, targetPath, targetName, null) == false)
			{
				task.status = 3; //Failed
				task.info = "目录压缩失败";
				Log.debug("executeDownloadPrepareTaskForVerReposEntry() 目录压缩失败");
				deleteDelayTime = 300L; //5分钟后删除
				addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  task.repos, task.doc, null, task.info);								

				//删除临时目录
				FileUtil.delDir(tmpCheckoutPath + tmpCheckoutName);
				
				//延时删除任务和压缩文件
				addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
				return;
			}

			task.status = 2; //Success
			task.info = "目录压缩成功";
			Log.debug("executeDownloadPrepareTaskForVerReposEntry() 目录压缩成功");
			deleteDelayTime = 72000L; //20小时后			
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "成功",  task.repos, task.doc, null, task.info);				
			
			//删除临时目录
			FileUtil.delDir(tmpCheckoutPath + tmpCheckoutName);

			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;
		}
		
		//压缩目录
		task.info = "目录压缩中...";
		Log.debug("executeDownloadPrepareTaskForVerReposEntry() 目录压缩中...");
		if(doCompressDir(tmpCheckoutPath, tmpCheckoutName, task.targetPath, task.targetName, null) == false)
		{
			task.status = 3; //Failed
			task.info = "目录压缩失败";
			Log.debug("executeDownloadPrepareTaskForVerReposEntry() 目录压缩失败");
			deleteDelayTime = 300L; //5分钟后删除
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  task.repos, task.doc, null, task.info);								
			
			//删除临时目录
			FileUtil.delDir(tmpCheckoutPath + tmpCheckoutName);		
			
			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;		
		}
		
		task.status = 2; //Success
		task.info = "目录压缩成功";
		Log.debug("executeDownloadPrepareTaskForVerReposEntry() 目录压缩成功");
		deleteDelayTime = 72000L; //20小时后			
		addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "成功",  task.repos, task.doc, null, task.info);				

		//删除临时目录
		FileUtil.delDir(tmpCheckoutPath + tmpCheckoutName);	
		
		//延时删除任务和压缩文件
		addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
		return;		

	}

	private void executeDownloadPrepareTaskForLocalFolder(DownloadPrepareTask task, String requestIP) 
	{		
		if(task.inputName != null)
		{
			Log.info("executeDownloadPrepareTask() inputName is null");
			return;
		}

		String targetPath = task.targetPath;
		String targetName = task.targetName;
		Long deleteDelayTime = null;		
		
		//检查并创建压缩目录
		File dir = new File(targetPath);
		if(!dir.exists())
		{
			dir.mkdirs();
		}
		
		task.info = "目录压缩中...";
		if(doCompressDir(task.inputPath, task.inputName, targetPath, targetName, null) == false)
		{
			task.status = 3; //Failed
			task.info = "目录压缩失败";
			deleteDelayTime = 300L; //5分钟后删除
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  task.repos, task.doc, null, task.info);								
			
			if(task.deleteInput)
			{
				FileUtil.delDir(task.inputPath + task.inputName);
			}

			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;
		}
		
		task.status = 2; //Success
		task.info = "目录压缩成功";
		deleteDelayTime = 72000L; //20小时后			
		addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "成功",  task.repos, task.doc, null, task.info);				
		if(task.deleteInput)
		{
			FileUtil.delDir(task.inputPath + task.inputName);
		}
		
		//延时删除任务和压缩文件
		addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
	}
	
	private void executeDownloadPrepareTaskForReposFolder(DownloadPrepareTask task, String requestIP) {		
		String targetPath = task.targetPath;
		String targetName = task.targetName;
		Long deleteDelayTime = null;		
		
		//检查并创建压缩目录
		File dir = new File(targetPath);
		if(!dir.exists())
		{
			dir.mkdirs();
		}
				
		//加密的仓库，需要先解密再压缩
		Repos repos = task.repos;
		if(repos.encryptType != null && repos.encryptType != 0)
		{
			String tmpEncryptPath = Path.getReposTmpPathForDecrypt(repos);
			String tmpEncryptName = task.doc.getName();
			if(tmpEncryptName == null || tmpEncryptName.isEmpty())
			{
				tmpEncryptName = repos.getName(); //用仓库名作为解密存储目录
			}

			//只拷贝有权限的文件
			task.info = "文件拷贝中...";
			copyAuthedFilesForDownload(tmpEncryptPath, tmpEncryptName, repos, task.doc, task.reposAccess);

			//解密指定目录的文件
			task.info = "文件解密中...";
			decryptFileOrDir(repos, tmpEncryptPath, tmpEncryptName);
			
			task.info = "目录压缩中...";
			if(doCompressDir(tmpEncryptPath, tmpEncryptName, targetPath, targetName, null) == false)
			{
				task.status = 3; //Failed
				task.info = "目录压缩失败";
				deleteDelayTime = 300L; //5分钟后删除
				addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  task.repos, task.doc, null, task.info);								
				//删除临时解密目录
				FileUtil.delDir(tmpEncryptPath + tmpEncryptName);
				//延时删除任务和压缩文件
				addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
				return;
			}

			task.status = 2; //Success
			task.info = "目录压缩成功";
			deleteDelayTime = 72000L; //20小时后			
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "成功",  task.repos, task.doc, null, task.info);				
			//删除临时解密目录
			FileUtil.delDir(tmpEncryptPath + tmpEncryptName);
			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;
		}
			
		//非加密仓库则直接压缩有权限的文件
		task.info = "目录压缩中...";
		if(compressAuthedFilesWithZip(targetPath, targetName, task.repos, task.doc, task.reposAccess) == false)
		{
			task.status = 3; //Failed
			task.info = "目录压缩失败";
			deleteDelayTime = 300L; //5分钟后删除
			addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "失败",  task.repos, task.doc, null, task.info);				
			//延时删除任务和压缩文件
			addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);
			return;
		}
		
		task.status = 2; //Success
		task.info = "目录压缩成功";
		deleteDelayTime = 72000L; //20小时后			
		addSystemLog(requestIP, task.reposAccess.getAccessUser(), "downloadDocPrepare", "downloadDocPrepare", "下载文件", "成功",  task.repos, task.doc, null, task.info);			
		//延时删除任务和压缩文件
		addDelayTaskForDownloadPrepareTaskDelete(task, deleteDelayTime);			
	}
	
	public void addDelayTaskForDownloadPrepareTaskDelete(DownloadPrepareTask task, Long deleteDelayTime) {
		if(deleteDelayTime == null)
		{
			Log.info("addDelayTaskForDownloadPrepareTaskDelete delayTime is null");			
			return;
		}
		Log.info("addDelayTaskForDownloadPrepareTaskDelete delayTime:" + deleteDelayTime + " 秒后开始删除！" );		
		
		long curTime = new Date().getTime();
        Log.info("addDelayTaskForDownloadPrepareTaskDelete() curTime:" + curTime);        
		
		ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
        executor.schedule(
        		new Runnable() {
        			String taskId = task.id;
                    @Override
                    public void run() {
                        try {
	                        Log.info("******** DownloadPrepareTaskDeleteDelayTask *****");
	                        
	                        //检查备份任务是否已被停止
	                		DownloadPrepareTask latestTask = downloadPrepareTaskHashMap.get(taskId);
	                		if(latestTask == null)
	                		{
	                			Log.info("DownloadPrepareTaskDeleteDelayTask() 压缩任务 [" + taskId + "] 不存在");						
	                			return;
	                		}
	                		
	                		FileUtil.delFile(latestTask.targetPath + latestTask.targetName);
	                		
	                		downloadPrepareTaskHashMap.remove(taskId);
	                		
	                		Log.info("******** DownloadPrepareTaskDeleteDelayTask 压缩任务 [" + taskId + "] 删除完成\n");		                        
                        } catch(Exception e) {
	                		Log.info("******** DownloadPrepareTaskDeleteDelayTask 压缩任务 [" + taskId + "] 删除异常\n");		                        
                        	Log.info(e);                        	
                        }
                        
                    }
                },
                deleteDelayTime,
                TimeUnit.SECONDS);
	}
	
	public void addDelayTaskForCompressFileDelete(String targetPath, String targetName, Long deleteDelayTime) {
		if(deleteDelayTime == null)
		{
			Log.info("addDelayTaskForCompressFileDelete delayTime is null");			
			return;
		}
		Log.info("addDelayTaskForCompressFileDelete delayTime:" + deleteDelayTime + " 秒后开始删除！" );		
		
		long curTime = new Date().getTime();
        Log.info("addDelayTaskForCompressFileDelete() curTime:" + curTime);        
		
		ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
        executor.schedule(
        		new Runnable() {
                    @Override
                    public void run() {
                        try {
	                        Log.info("******** DownloadPrepareFileDeleteDelayTask *****");
	                        
	                        File compressFile = new File(targetPath, targetName);
	                		if(compressFile.exists())
	                		{
	                			if(FileUtil.delFile(targetPath + targetName))
		                		{
		                			Log.info("******** DownloadPrepareFileDeleteDelayTask 压缩文件 [" + targetPath + targetName + "] 删除成功\n");		                        
		                		}
		                		else
		                		{
		                			Log.info("******** DownloadPrepareFileDeleteDelayTask 压缩文件 [" + targetPath + targetName + "] 删除失败\n");		                        		                			
		                		}
	                		}
	                		else
	                		{
	                			Log.info("******** DownloadPrepareFileDeleteDelayTask 压缩文件 [" + targetPath + targetName + "] 不存在\n");		                        		                				                			
	                		}
                        } catch(Exception e) {
	                		Log.info("******** DownloadPrepareFileDeleteDelayTask 压缩任务 [" + targetPath + targetName + "] 删除异常\n");		                        
                        	Log.info(e);                        	
                        }                        
                    }
                },
                deleteDelayTime,
                TimeUnit.SECONDS);
	}
	
	protected void buildDownloadList(Repos repos, boolean isRealDoc, Doc doc, String commitId, HashMap<String, String> downloadList) 
	{
		//根据commitId获取ChangeItemsList
		List<ChangedItem> changedItemList = verReposGetHistoryDetail(repos, isRealDoc, doc, commitId);
		
		if(changedItemList == null)
		{
			Log.debug("buildDownloadList verReposGetHistoryDetail Failed");
			return;
		}
		
		String docEntryPath = doc.getPath() + doc.getName();
		//过滤掉不在doc目录下的ChangeItems
		for(int i=0; i< changedItemList.size(); i++)
		{
			ChangedItem changeItem = changedItemList.get(i);
			String changeItemEntryPath = changeItem.getEntryPath();
			if(changeItemEntryPath.contains(docEntryPath))
			{
				downloadList.put(changeItemEntryPath, changeItemEntryPath);
				Log.debug("buildDownloadList Add [" +changeItemEntryPath + "]");
			}
		}		
	}
	
	
    public boolean copyAuthedFilesForDownload(String targetPath, String targetName, Repos repos, Doc doc, ReposAccess reposAccess) 
    {
    	boolean ret = false;
    	try {	                
	    	File rootFile = new File(doc.getLocalRootPath() + doc.getPath() + doc.getName());
    		DocAuth curDocAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask());
			HashMap<Long, DocAuth> docAuthHashMap = getUserDocAuthHashMapWithMask(reposAccess.getAccessUser().getId(), repos.getId(), reposAccess.getAuthMask());
			copyAuthedFilesForDownload(rootFile, repos, doc, curDocAuth, docAuthHashMap, doc.getLocalRootPath() + doc.getPath() + doc.getName(), targetPath + targetName);	        
    	} catch(Exception e) {
    		Log.error("copyAuthedFilesForDownload() 拷贝异常");
    		errorLog(e);
    	}
    	return ret;
    }
    
    private void copyAuthedFilesForDownload(File input, Repos repos, Doc doc, DocAuth curDocAuth, HashMap<Long, DocAuth> docAuthHashMap, String srcFilePath, String dstFilePath)
    {
		if(curDocAuth == null || curDocAuth.getDownloadEn() == null || curDocAuth.getDownloadEn() != 1)
		{
			Log.debug("copyAuthedFilesForDownload() have no right to download [" + doc.getPath() + doc.getName() + "]");
			return;
		}
			
		if (input.isDirectory())
		{
			FileUtil.createDir(dstFilePath);
		}
		else
		{
			FileUtil.copyFile(srcFilePath, dstFilePath, true);
		}

        if (input.isDirectory()) {
        	//取出文件夹中的文件（或子文件夹）
            File[] flist = input.listFiles();
            
            if (flist.length > 0)
            {
    			Log.debug("copyAuthedFilesForDownload() [" + doc.getPath() + doc.getName() + "] is folder");
            	String subDocParentPath = getSubDocParentPath(doc);
            	String localRootPath = doc.getLocalRootPath();
            	String localVRootPath = doc.getLocalVRootPath();
            	
            	for (int i = 0; i < flist.length; i++) {    
            		File subFile = flist[i];
            		String subDocName = subFile.getName();
            		Integer subDocLevel = getSubDocLevel(doc);
    	    		int type = 1;
    	    		if(subFile.isDirectory())
    	    		{
    	    			type = 2;
    	    		}
    	    		long size = subFile.length();
    	    		Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(), doc.getReposPath(), subDocParentPath, subDocName, subDocLevel, type, true,localRootPath, localVRootPath, size, "", doc.offsetPath);
            		DocAuth subDocAuth = getDocAuthFromHashMap(subDoc.getDocId(), curDocAuth, docAuthHashMap);
            		String subSrcFilePath = srcFilePath + "/" + subDocName;
            		String subDstFilePath = dstFilePath + "/" + subDocName;
            		copyAuthedFilesForDownload(flist[i], repos, subDoc, subDocAuth, docAuthHashMap, subSrcFilePath, subDstFilePath);
                }
            }
        }
	}

	//压缩授权的文件
    public boolean compressAuthedFilesWithZip(String targetPath, String targetName, Repos repos, Doc doc, ReposAccess reposAccess) 
    {
    	boolean ret = false;
    	try {
	    	File zipFile = new File(targetPath + targetName);	//finalFile
	    	
	        File input = new File(doc.getLocalRootPath() + doc.getPath() + doc.getName()); //srcFile or Dir
	        if (!input.exists()){
	        	Log.info(doc.getLocalRootPath() + doc.getPath() + doc.getName() + "不存在！");
	        	return ret;
	        }   
	            
	        Project prj = new Project();
	        Zip zip = new Zip();
	        zip.setEncoding("gbk"); //文件名的编码格式，默认是运行平台使用的编码格式，会导致压缩后的文件在其他平台上打开乱码
	        zip.setProject(prj);    
	        zip.setDestFile(zipFile);    
	        FileSet fileSet = new FileSet();    
	        fileSet.setProject(prj);    
	        fileSet.setDir(input);    
	        //fileSet.setIncludes("**/*.java"); //包括哪些文件或文件夹 eg:zip.setIncludes("*.java");    
	        //fileSet.setExcludes("10张必做计算.pdf"); //排除哪些文件或文件夹    
	                
	    	DocAuth curDocAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask());
			HashMap<Long, DocAuth> docAuthHashMap = getUserDocAuthHashMapWithMask(reposAccess.getAccessUser().getId(), repos.getId(), reposAccess.getAuthMask());
	        configCompressExcludes(fileSet, input, repos, doc, curDocAuth, docAuthHashMap, null);
	        
	        zip.addFileset(fileSet);    
	        zip.execute();  
			
	        if(zipFile.exists())
	        {
	        	ret = true;
	        }
    	} catch(Exception e) {
    		Log.error("compressAuthedFilesWithZip() 压缩异常");
    		errorLog(e);
    	}
    	return ret;
    }
	
    private void configCompressExcludes(FileSet fileSet, File input, Repos repos, Doc doc, DocAuth curDocAuth, HashMap<Long, DocAuth> docAuthHashMap, String relativePath) 
    {
		if(curDocAuth == null || curDocAuth.getDownloadEn() == null || curDocAuth.getDownloadEn() != 1)
		{
			Log.debug("configCompressExcludes() have no right to download for [" + doc.getPath() + doc.getName() + "]");
			
			if(relativePath == null)	//doc is root path
			{
				fileSet.setExcludes("**/*");
				return;
			}
			
			String excludeStr = relativePath + doc.getName();
			excludeStr = excludeStr.replace(",", "?").replace(" ", "?");
			Log.debug("configCompressExcludes() excludeStr:" + excludeStr);
			if (input.isDirectory())
			{
				Log.debug("configCompressExcludes() ignore folder:" + relativePath + doc.getName() + "/");
				fileSet.setExcludes(excludeStr + "/");
			}
			else
			{
				Log.debug("configCompressExcludes() ignore file:" + relativePath + doc.getName());
				fileSet.setExcludes(excludeStr);				
			}
			return;
		}

	    //如果路径为目录（文件夹）
        if (input.isDirectory()) {
        	//取出文件夹中的文件（或子文件夹）
            File[] flist = input.listFiles();
            
            if (flist.length > 0)
            {
    			Log.debug("configCompressExcludes() [" + doc.getPath() + doc.getName() + "] is folder");
            	String subDocParentPath = getSubDocParentPath(doc);
            	String localRootPath = doc.getLocalRootPath();
            	String localVRootPath = doc.getLocalVRootPath();
            	String subRelativePath = "";
            	if(relativePath != null)
            	{
            		subRelativePath = relativePath + doc.getName() + "/";
            	}
            	Log.debug("configCompressExcludes() subRelativePath:" + subRelativePath);
            	
            	for (int i = 0; i < flist.length; i++) {    
            		File subFile = flist[i];
            		String subDocName = subFile.getName();
            		Integer subDocLevel = getSubDocLevel(doc);
    	    		int type = 1;
    	    		if(subFile.isDirectory())
    	    		{
    	    			type = 2;
    	    		}
    	    		long size = subFile.length();
    	    		Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(), doc.getReposPath(), subDocParentPath, subDocName, subDocLevel, type, true,localRootPath, localVRootPath, size, "", doc.offsetPath);
            		DocAuth subDocAuth = getDocAuthFromHashMap(subDoc.getDocId(), curDocAuth, docAuthHashMap);
            		configCompressExcludes(fileSet, flist[i], repos, subDoc, subDocAuth, docAuthHashMap, subRelativePath);
                }
            }
        }
	}

	//递归压缩
    public boolean compressAuthedFilesWith7Z(String targetPath, String targetName, Repos repos, Doc doc, ReposAccess reposAccess) 
    {
    	DocAuth curDocAuth = getUserDocAuthWithMask(repos, reposAccess.getAccessUserId(), doc, reposAccess.getAuthMask());
		HashMap<Long, DocAuth> docAuthHashMap = getUserDocAuthHashMapWithMask(reposAccess.getAccessUser().getId(), repos.getId(), reposAccess.getAuthMask());
		
    	boolean ret = false;
    	SevenZOutputFile out = null;
    	try {
	    	File input = new File(doc.getLocalRootPath() + doc.getPath() + doc.getName());
	        if (!input.exists()) 
	        {
	        	Log.debug(doc.getLocalRootPath() + doc.getPath() + doc.getName() + " 不存在");
	        	return false;
	        }
	        
	        out = new SevenZOutputFile(new File(targetPath, targetName));
	        compressAuthedFilesWith7Z(out, input, repos, doc, curDocAuth, docAuthHashMap);
	        ret = true;
    	} catch(Exception e) {
    		errorLog(e);
    	} finally {
    		if(out != null)
    		{
    			try {
					out.close();
				} catch (IOException e) {
					errorLog(e);
				}
    		}
    	}
    	return ret;
    }
	public void compressAuthedFilesWith7Z(SevenZOutputFile out, File input, Repos repos, Doc doc, DocAuth curDocAuth, HashMap<Long, DocAuth> docAuthHashMap) throws Exception 
    {		
		if(curDocAuth == null || curDocAuth.getDownloadEn() == null || curDocAuth.getDownloadEn() != 1)
		{
			Log.debug("compressAuthedFiles() have no right to download for [" + doc.getPath() + doc.getName() + "]");
			return;
		}

	    SevenZArchiveEntry entry = null;
        //如果路径为目录（文件夹）
        if (input.isDirectory()) {
        	//取出文件夹中的文件（或子文件夹）
            File[] flist = input.listFiles();

            if (flist.length == 0)//如果文件夹为空，则只需在目的地.7z文件中写入一个目录进入
            {
    			Log.debug("compressAuthedFiles() [" + doc.getPath() + doc.getName() + "] is empty folder");
            	entry = out.createArchiveEntry(input, doc.getPath() + doc.getName() + "/");
                out.putArchiveEntry(entry);
            } 
            else//如果文件夹不为空，则递归调用compress，文件夹中的每一个文件（或文件夹）进行压缩
            {
    			Log.debug("compressAuthedFiles() [" + doc.getPath() + doc.getName() + "] is folder");
            	String subDocParentPath = getSubDocParentPath(doc);
            	String localRootPath = doc.getLocalRootPath();
            	String localVRootPath = doc.getLocalVRootPath();
            	
            	for (int i = 0; i < flist.length; i++) {    
            		File subFile = flist[i];
            		String subDocName = subFile.getName();
            		Integer subDocLevel = getSubDocLevel(doc);
    	    		int type = 1;
    	    		if(subFile.isDirectory())
    	    		{
    	    			type = 2;
    	    		}
    	    		long size = subFile.length();
            		Doc subDoc = buildBasicDoc(repos.getId(), null, doc.getDocId(), doc.getReposPath(), subDocParentPath, subDocName, subDocLevel, type, true,localRootPath, localVRootPath, size, "", doc.offsetPath);
            		DocAuth subDocAuth = getDocAuthFromHashMap(subDoc.getDocId(), curDocAuth, docAuthHashMap);
            		compressAuthedFilesWith7Z(out, flist[i], repos, subDoc, subDocAuth, docAuthHashMap);
                }
            }
        } 
        else//如果不是目录（文件夹），即为文件，则先写入目录进入点，之后将文件写入7z文件中
        {
			Log.debug("compressAuthedFiles() [" + doc.getPath() + doc.getName() + "] is file");
        	FileInputStream fos = new FileInputStream(input);
            BufferedInputStream bis = new BufferedInputStream(fos);
            entry = out.createArchiveEntry(input, doc.getPath() + doc.getName());
            out.putArchiveEntry(entry);
            int len = -1;
            //将源文件写入到7z文件中
            byte[] buf = new byte[1024];
            while ((len = bis.read(buf)) != -1) {
            	out.write(buf, 0, len);
            }
            bis.close();
            fos.close();
            out.closeArchiveEntry();
       }
    }
	
	public void addDelayTaskForReposFullBackupTaskDelete(ReposFullBackupTask task, Long deleteDelayTime) {
		if(deleteDelayTime == null)
		{
			Log.info("addDelayTaskForReposFullBackupTaskDelete delayTime is null");			
			return;
		}
		Log.info("addDelayTaskForReposFullBackupTaskDelete delayTime:" + deleteDelayTime + " 秒后开始删除！" );		
		
		long curTime = new Date().getTime();
        Log.info("addDelayTaskForReposFullBackupTaskDelete() curTime:" + curTime);        
		
		ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);
        executor.schedule(
        		new Runnable() {
        			String taskId = task.id;
                    @Override
                    public void run() {
                        try {
	                        Log.info("********ReposFullBackupTaskDeleteDelayTask *****");
	                        
	                        //检查备份任务是否已被停止
	                        ReposFullBackupTask latestTask = reposFullBackupTaskHashMap.get(taskId);
	                		if(latestTask == null)
	                		{
	                			Log.info("ReposFullBackupTaskDeleteDelayTask() 压缩任务 [" + taskId + "] 不存在");						
	                			return;
	                		}
	                		
	                		reposFullBackupTaskHashMap.remove(taskId);
	                		Log.info("******** ReposFullBackupTaskDeleteDelayTask 压缩任务 [" + taskId + "] 删除完成\n");		                        
                        } catch(Exception e) {
	                		Log.info("******** ReposFullBackupTaskDeleteDelayTask 压缩任务 [" + taskId + "] 删除异常\n");		                        
                        	Log.info(e);                        	
                        }                        
                    }
                },
                deleteDelayTime,
                TimeUnit.SECONDS);
	}
	
	protected String buildSystemLogDetailContent(ReturnAjax rt) {
		if(rt == null)
		{
			return "";
		}
		
		String logDetail = "";
		if(rt.getMsgInfo() != null)
		{
			logDetail = "[info]:[" + rt.getMsgInfo() + "] ";
		}
		
		if(rt.getWarningMsg() != null)
		{
			logDetail = logDetail + "[warn]:[" + rt.getWarningMsg() + "] ";
		}
		
		if(rt.getDebugLog() != null)
		{
			logDetail = logDetail + "[debug]:[" + rt.getDebugLog() + "]";
		}
		
		Log.debug("buildSystemLogDetailContent() logDetail:" + logDetail);
		return logDetail;
	}
	
	protected boolean checkUserAccessPwd(Repos repos, Doc doc, HttpSession session, ReturnAjax rt) {
		String pwd = getDocPwd(repos, doc);
		if(pwd != null && !pwd.isEmpty())
		{
			//Do check the sharePwd
			String docPwd = (String) session.getAttribute("docPwd_" + repos.getId() + "_" + doc.getDocId());
			if(docPwd == null || docPwd.isEmpty() || !docPwd.equals(pwd))
			{
				docSysErrorLog("访问密码错误！", rt);
				rt.setMsgData("1"); //访问密码错误或未提供
				rt.setData(doc);
				return false;
			}
		}
		return true;
	}
}
