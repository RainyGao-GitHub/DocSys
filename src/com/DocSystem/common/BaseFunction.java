package com.DocSystem.common;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.net.MalformedURLException;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.net.HttpURLConnection;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.Sort;
import org.apache.lucene.search.SortField;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.search.BooleanClause.Occur;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.util.Version;
import org.redisson.api.RBucket;
import org.redisson.api.RLock;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import org.wltea.analyzer.lucene.IKAnalyzer;

import util.DateFormat;
import util.ReadProperties;
import util.ReturnAjax;
import util.Encrypt.DES;
import util.LuceneUtil.LuceneUtil2;

import com.DocSystem.common.CommonAction.CommonAction;
import com.DocSystem.common.channels.Channel;
import com.DocSystem.common.constants.LICENSE_RESULT;
import com.DocSystem.common.entity.AuthCode;
import com.DocSystem.common.entity.AutoTaskConfig;
import com.DocSystem.common.entity.BackupConfig;
import com.DocSystem.common.entity.BackupTask;
import com.DocSystem.common.entity.DownloadPrepareTask;
import com.DocSystem.common.entity.EncryptConfig;
import com.DocSystem.common.entity.FtpConfig;
import com.DocSystem.common.entity.GitConfig;
import com.DocSystem.common.entity.LDAPConfig;
import com.DocSystem.common.entity.LargeFileScanTask;
import com.DocSystem.common.entity.License;
import com.DocSystem.common.entity.LocalConfig;
import com.DocSystem.common.entity.MxsDocConfig;
import com.DocSystem.common.entity.OfficeLicense;
import com.DocSystem.common.entity.PreferLink;
import com.DocSystem.common.entity.QueryCondition;
import com.DocSystem.common.entity.QueryResult;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.RemoteStorageSyncupConfig;
import com.DocSystem.common.entity.ReposAccess;
import com.DocSystem.common.entity.ReposBackupConfig;
import com.DocSystem.common.entity.ReposFullBackupTask;
import com.DocSystem.common.entity.ReposSyncupConfig;
import com.DocSystem.common.entity.SearchIndexSyncupConfig;
import com.DocSystem.common.entity.SftpConfig;
import com.DocSystem.common.entity.SmbConfig;
import com.DocSystem.common.entity.LongTermTask;
import com.DocSystem.common.entity.SvnConfig;
import com.DocSystem.common.entity.GenericTask;
import com.DocSystem.common.entity.SystemLog;
import com.DocSystem.common.entity.UserPreferServer;
import com.DocSystem.common.entity.VerReposSyncupConfig;
import com.DocSystem.commonService.ProxyThread;
import com.DocSystem.commonService.ShareThread;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.OfficeEditLock;
import com.DocSystem.entity.RemoteStorageLock;
import com.DocSystem.entity.Repos;
import com.DocSystem.entity.ReposExtConfigDigest;
import com.DocSystem.entity.SyncSourceLock;
import com.DocSystem.entity.User;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

public class BaseFunction{	
	protected static final long CONST_SECOND = 1000;
	protected static final long CONST_MINUTE = 60*1000;
	protected static final long CONST_HOUR = 60*60*1000;
	protected static final long CONST_DAY = 24*CONST_HOUR;
	protected static final long CONST_MONTH = 30*CONST_DAY;
	protected static final long CONST_YEAR = 12*CONST_MONTH;

	protected static final int SAVE_TYPE_AddEntry = 1;
	protected static final int SAVE_TYPE_MultipartFile = 2;
	protected static final int SAVE_TYPE_FileLink = 3;
	protected static final int SAVE_TYPE_DataBuffer = 4;
	protected static final int SAVE_TYPE_ChunkedFile = 5;
	
	//getDocListType
	protected static final int GetDocList_LocalEntry = 1;
	protected static final int GetDocList_RemoteStorage = 2;
	protected static final int GetDocList_LocalEntryAndRemoteStorage = 3;
	
	//HistoryType for CommitLog and CommitEntry
	protected static final int HistoryType_RealDoc = 0;
	protected static final int HistoryType_VirtualDoc = 1;
	protected static final int HistoryType_LocalBackup = 2;
	protected static final int HistoryType_RemoteBackup = 3;
	protected static final int HistoryType_RecycleBin = 4;
	
	//应用路径
    protected static String docSysIniPath = null;
    protected static String docSysWebPath = null;
    protected static String defaultLogFilePath = null;
    protected static String webappsPath = null;
    
    //用户头像和IndexLib存放路径
    protected static String docSysDataPath = null;
	
    //系统License
    public static License systemLicenseInfo = null;
	protected static long licenseCheckTimer = 0;
	
    //OnlyOffice License
    public static OfficeLicense officeLicenseInfo = null;
    public static Integer officeType = 0; //0:内置 1:外置
    
    //系统LDAP设置
    public static LDAPConfig systemLdapConfig = null;
		
	public static int OSType = OS.UNKOWN; //

	public static String lang = "ch"; //系统语言: ch:中文  en: English

	//DocSysType
    protected static int docSysType = constants.DocSys_Community_Edition; //0: Community Edition 1: Enterprise Edition 2: Professional Edition 3: Personal Edition 
    
    protected static int isSalesServer = 0;
	protected static String serverHost = null;
	
	protected static int systemDisabled = 0; //系统禁用标记
	protected static int officeDisabled = 0; //office在线编辑禁用标记
    
	//服务器IP和MAC
    protected static String serverIP = null;
    protected static String serverMAC = null;
    protected static String serverSN = null;
	    
	//分享代理服务线程（一个服务器只允许启动一个）
	protected static ProxyThread proxyThread = null;
	//远程分享服务线程（一个服务器只允许启动一个）
	protected static ShareThread shareThread = null;

	//远程存储服务器同步锁HashMap: 远程存储服务器访问线程锁，集群时结合redisSyncLock一起使用，Map不需要存入redis
	protected static ConcurrentHashMap<String, Object> remoteStorageSyncLockHashMap = new ConcurrentHashMap<String, Object>();	

	//目录下载压缩任务HashMap: 下载任务只会在用户登录的服务器上创建，因此不需要考虑集群
	protected static ConcurrentHashMap<String, DownloadPrepareTask> downloadPrepareTaskHashMap = new ConcurrentHashMap<String, DownloadPrepareTask>();

	//仓库全量备份任务HashMap: 全量备份任务只会在用户登录的服务器上创建，因此不需要考虑集群
	protected static ConcurrentHashMap<String, ReposFullBackupTask> reposFullBackupTaskHashMap = new ConcurrentHashMap<String, ReposFullBackupTask>();
	
	//Global StatusQueryTask
	protected static ConcurrentHashMap<String, LongTermTask> longTermTaskHashMap = new ConcurrentHashMap<String, LongTermTask>();

	//Global LargFileScanTask
	protected static ConcurrentHashMap<String, LargeFileScanTask> largeFileScanTaskHashMap = new ConcurrentHashMap<String, LargeFileScanTask>();

	
	//系统默认用户
	protected static User coEditUser = new User();
    protected static User systemUser = new User();
    protected static User anyUser = new User();	//EveryOne
    
	public static boolean redisEn = false;
	public static String redisUrl = null;
	public static RedissonClient redisClient = null;
	public static int globalClusterDeployCheckState = 0;	//0:未检测 1:参数检测完成 2:全部完成
    public static boolean globalClusterDeployCheckResult = false;
    public static String globalClusterDeployCheckResultInfo = "";
    //serverUrl(http://serverIP:port)集群时用于服务器之间通信
    protected static String clusterServerUrl = null;
    protected static String clusterServerLoopbackMsg = null;	//用于集群的回环自检
	//用于检测集群相关的配置是否发生了变化（在initRedis接口中使用）
    protected static String clusterDbUrl = null;
    protected static String clusterLdapConfig = null;
    protected static String clusterOfficeEditor = null;
    protected static final Object gClusterDeployCheckSyncLock = new Object(); //用于保证集群检测的唯一性

    public static int clusterHeartBeatInterval = 300; //300秒(5分钟)，心跳间隔
    public static int clusterHeartBeatStopTime = 3*clusterHeartBeatInterval*1000;	//3次心跳
    
    //目录上传
    public static ConcurrentHashMap<String, FolderUploadAction> gFolderUploadActionHashMap = new ConcurrentHashMap<String, FolderUploadAction>();
	protected static final Object gFolderUploadActionSyncLock = new Object(); //用于保证gDocDataMap的线性存取

    //以下的全局HashMap, 集群部署时，需要存储在redis中
    //接口访问授权码HashMap
  	public static ConcurrentHashMap<String, AuthCode> authCodeMap = new ConcurrentHashMap<String, AuthCode>();
    
	//仓库锁HashMap
	protected static ConcurrentHashMap<Integer, DocLock> reposLocksMap = new ConcurrentHashMap<Integer, DocLock>();

  	//仓库的文件锁HashMap
	public static ConcurrentHashMap<Integer, ConcurrentHashMap<String, DocLock>> docLocksMap = new ConcurrentHashMap<Integer, ConcurrentHashMap<String, DocLock>>();

	//远程存储服务器锁HashMap
	protected static ConcurrentHashMap<String, RemoteStorageLock> remoteStorageLocksMap = new ConcurrentHashMap<String, RemoteStorageLock>();

	//同步资源同步锁HashMap
	protected static ConcurrentHashMap<String, SyncSourceLock> syncSourceLocksMap = new ConcurrentHashMap<String, SyncSourceLock>();
	
	//Office协同编辑打开的文件[dockey , docPath]
	public static ConcurrentHashMap<String, String> openedDocsMap = new ConcurrentHashMap<String, String>();

	//Office协同编辑同步锁HashMap
	protected static ConcurrentHashMap<String, OfficeEditLock> officeEditLocksMap = new ConcurrentHashMap<String, OfficeEditLock>();

	//reposDataHashMap（isBusy字段集群时需要放入redis，其他字段是存放仓库的线程锁，集群时是结合redisSyncLock一起使用，Map不需要放入redis）
	protected static ConcurrentHashMap<Integer, ReposData> reposDataHashMap = new ConcurrentHashMap<Integer, ReposData>();	

	//**** 仓库扩展配置: 结合reposExtConfigDigest一起使用，digest变动时才从redis中同步对应的扩展配置到localMap
	//仓库远程存储配置HashMap
	protected static ConcurrentHashMap<Integer, RemoteStorageConfig> reposRemoteStorageHashMap = new ConcurrentHashMap<Integer, RemoteStorageConfig>();	
	//仓库远程服务器前置配置HashMap
	protected static ConcurrentHashMap<Integer, RemoteStorageConfig> reposRemoteServerHashMap = new ConcurrentHashMap<Integer, RemoteStorageConfig>();		
	//仓库自动同步配置HashMap
	protected static ConcurrentHashMap<Integer, ReposSyncupConfig> reposSyncupConfigHashMap = new ConcurrentHashMap<Integer, ReposSyncupConfig>();
	//仓库自动备份配置HashMap
	protected static ConcurrentHashMap<Integer, ReposBackupConfig> reposBackupConfigHashMap = new ConcurrentHashMap<Integer, ReposBackupConfig>();
	//仓库全文搜索配置HashMap
	protected static ConcurrentHashMap<Integer, TextSearchConfig> reposTextSearchConfigHashMap = new ConcurrentHashMap<Integer, TextSearchConfig>();	
	//仓库回收站配置HashMap
	protected static ConcurrentHashMap<Integer, RecycleBinConfig> reposRecycleBinConfigHashMap = new ConcurrentHashMap<Integer, RecycleBinConfig>();	
	//仓库版本忽略配置HashMap
	protected static ConcurrentHashMap<Integer, VersionIgnoreConfig> reposVersionIgnoreConfigHashMap = new ConcurrentHashMap<Integer, VersionIgnoreConfig>();		
	//仓库加密配置HashMap
	protected static ConcurrentHashMap<Integer, EncryptConfig> reposEncryptConfigHashMap = new ConcurrentHashMap<Integer, EncryptConfig>();		
	
	//注意: 仓库的自动备份和同步任务跨服务器唯一性通过Redis中的UniqeTask来保证
	//仓库自动备份任务HashMap
	protected static ConcurrentHashMap<Integer, ConcurrentHashMap<String, BackupTask>> reposLocalBackupTaskHashMap = new ConcurrentHashMap<Integer, ConcurrentHashMap<String, BackupTask>>();
	protected static ConcurrentHashMap<Integer, ConcurrentHashMap<String, BackupTask>> reposRemoteBackupTaskHashMap = new ConcurrentHashMap<Integer, ConcurrentHashMap<String, BackupTask>>();	
	//仓库文件同步任务HashMap
	protected static ConcurrentHashMap<Integer, ConcurrentHashMap<Long, GenericTask>> reposSyncupTaskHashMap = new ConcurrentHashMap<Integer, ConcurrentHashMap<Long, GenericTask>>();

	//仓库线性任务HashMap（用于保证仓库的任务按顺序执行，不需要考虑集群）
	protected static ConcurrentHashMap<Integer, UniqueAction> uniqueActionHashMap = new ConcurrentHashMap<Integer, UniqueAction>();

	//数据库备份任务HashMap
	//数据库备份任务对系统性能影响不大，而且不存在存储冲突问题，因此不考虑集群的任务唯一性问题
	protected static ConcurrentHashMap<Long, BackupTask> dbBackupTaskHashMap = new ConcurrentHashMap<Long, BackupTask>();

	//集群心跳任务HashMap
	protected static ConcurrentHashMap<Long, GenericTask> clusterBeatTaskHashMap = new ConcurrentHashMap<Long, GenericTask>();

	//businessChannel
	protected static Channel channel = null;
	
	static {
    	initOSType();
    	docSysWebPath = Path.getWebPath(OSType);
    	webappsPath = Path.getDocSysWebParentPath(docSysWebPath);
    	if(docSysWebPath != null)
    	{
    		defaultLogFilePath = Path.getParentPath(docSysWebPath, 2, OSType) + "logs/docsys.log";
    	}
    	    	
    	if(Log.logFile == null)
    	{
    		Log.logFile = defaultLogFilePath;
    	}
    	
		docSysIniPath = webappsPath + "docSys.ini/";   
    	initSystemLanguage();
		initSystemLicenseInfo();
    	initOfficeLicenseInfo();
    	initLdapConfig();
		serverHost = getServerHost();
		clusterServerUrl = getClusterServerUrl();

		initSystemUsers();
	}
	
	private static void initSystemUsers() {
		switch(lang)
		{
		case "en":
			//系统用户
			systemUser.setId(0);
			systemUser.setType(2);	//virtual admin user
			systemUser.setName("System");	
			anyUser.setRealName("System");
			anyUser.setNickName("System");			
			//协同编辑用户
			coEditUser.setId(-1);
			coEditUser.setName("CoEditUser");
			anyUser.setRealName("CoEditUser");
			anyUser.setNickName("CoEditUser");
			//任意用户
			anyUser.setId(0);
			anyUser.setName("Everyone");
			anyUser.setRealName("Everyone");
			anyUser.setNickName("Everyone");		
			break;
		default:
			//系统用户
			systemUser.setId(0);
			systemUser.setType(2);	//virtual admin user
			systemUser.setName("System");	
			anyUser.setRealName("系统");
			anyUser.setNickName("系统");	
			//协同编辑用户
			coEditUser.setId(-1);
			coEditUser.setName("CoEditUser");
			anyUser.setRealName("协同编辑");
			anyUser.setNickName("协同编辑");
			//任意用户
			anyUser.setId(0);
			anyUser.setName("任意用户");
			anyUser.setRealName("任意用户");
			anyUser.setNickName("任意用户");		
			break;
		}		
	}

	private static void initSystemLanguage() {
		Log.debug("initSystemLanguage() ");
		lang = "ch";
		String value = ReadProperties.getValue(docSysIniPath + "docSysConfig.properties", "language");
		if(value != null)
		{
			lang = value;
		}	
	}

	//*** 集群相关接口 ***
	protected static void redisSyncLockEx(String lockName, String lockInfo) {
		SyncLock.lock(lockInfo);
		redisSyncLock(lockName, lockInfo);
	}
	
	protected static void redisSyncUnlockEx(String lockName, String lockInfo, Object syncLock) {
		redisSyncUnlock(lockName, lockInfo);
		SyncLock.unlock(syncLock, lockInfo);
	}
	
	protected static void redisSyncLock(String lockName, String lockInfo) {
		if(redisEn)
		{
			Log.debug("+++++++++++ redisSyncLock() [" + lockName + "] " + lockInfo + " lock ++++++");
			RLock lock = redisClient.getLock(lockName);
			lock.lock();
		}
	}
	
	protected static void redisSyncUnlock(String lockName, String lockInfo) {
		if(redisEn)
		{
			Log.debug("---------- redisSyncUnlock() [" + lockName + "]" + lockInfo + " unlock -------");	
			RLock lock = redisClient.getLock(lockName);
			lock.unlock();
		}
	}
	
	//UniqueTask
	public void addUniqueTaskRedis(String id, JSONObject task) {
		RMap<Object, Object> uniqueTaskMap = redisClient.getMap("uniqueTaskMap");
		uniqueTaskMap.put(id, task);
	}
	
	public void deleteUniqueTaskRedis(String id) {
		RMap<Object, Object> uniqueTaskMap = redisClient.getMap("uniqueTaskMap");
		uniqueTaskMap.remove(id);
	}
	
	public JSONObject getUniqueTaskRedis(String id) {
		RMap<Object, Object> uniqueTaskMap = redisClient.getMap("uniqueTaskMap");	
		JSONObject task =  (JSONObject) uniqueTaskMap.get(id);
		if(task != null)
		{
			Long expireTime = task.getLong("expireTime");
			if(expireTime == null)
			{
				//无效UniqueTask
				Log.info("getUniqueTaskRedis() invalid uniqueTask " + id + ": have not expireTime");
				return null;
			}
			long curTime = new Date().getTime(); 
			if(expireTime < curTime)
			{
				Log.info("getUniqueTaskRedis() uniqueTask " + id + " was expired");
				return null;
			}
			
			Log.info("getUniqueTaskRedis() uniqueTask state:" + task.getString("state"));
			return task;
		}
		return task;
	}
	
	public JSONObject checkStartUniqueTaskRedis(String uniqueTaskId) 
	{
		Log.info("checkStartUniqueTaskRedis() uniqueTaskId:" + uniqueTaskId);
		redisSyncLock("uniqueTaskMapSyncLock", uniqueTaskId);
		
		JSONObject uniqueTask = getUniqueTaskRedis(uniqueTaskId);
		if(uniqueTask == null)
		{
			Log.info("checkStartUniqueTaskRedis() 启动 uniqueTask:" + uniqueTaskId);
			
			//任务不存在或已过期
			Long expireTime = new Date().getTime() + 24*60*60*1000; //24小时后过期
			uniqueTask = new JSONObject();
			uniqueTask.put("id", uniqueTaskId);
			uniqueTask.put("state", "running");	//1: start 2: end
			uniqueTask.put("expireTime", expireTime);
			addUniqueTaskRedis(uniqueTaskId, uniqueTask);
		}
		else
		{
			//任务已存在
			Log.info("checkStartUniqueTaskRedis() uniqueTask:" + uniqueTaskId + " 执行中或者已执行");
			uniqueTask = null;
		}
		
		redisSyncUnlock("uniqueTaskMapSyncLock", uniqueTaskId);
		return uniqueTask;
	}
	
	public void stopUniqueTaskRedis(String id, JSONObject uniqueTask) {
		//更新UniqueTask状态
		Long expireTime = new Date().getTime() + 6*60*60*1000; //6小时后过期
		uniqueTask.put("state", "completed");
		uniqueTask.put("expireTime", expireTime);
		
		RMap<Object, Object> uniqueTaskMap = redisClient.getMap("uniqueTaskMap");
		uniqueTaskMap.put(id, uniqueTask);
	}
	
	//*** authCodeMap
	protected static AuthCode generateAuthCode(String usage, long duration, int maxUseCount, ReposAccess reposAccess, User user) {
		if(redisEn)
		{
			return generateAuthCodeRedis(usage, duration, maxUseCount, reposAccess, user);
		}
		else
		{
			return generateAuthCodeLocal(usage, duration, maxUseCount, reposAccess, user);
		}
	}
	protected static AuthCode generateAuthCodeLocal(String usage, long duration, int maxUseCount, ReposAccess reposAccess, User user) {
		Long curTime = new Date().getTime();

		if(authCodeMap.size() > 100)
		{
			//Do clean expired authCode
			ArrayList<String> deleteList = new ArrayList<String>();
			Iterator<Entry<String, AuthCode>> iterator = authCodeMap.entrySet().iterator();
		    while (iterator.hasNext()) 
		    {
		    	Entry<String, AuthCode> entry = iterator.next();
		        if(entry != null)
		        {
		        	if(entry.getValue().getExpTime() < curTime || entry.getValue().getRemainCount() <=0 )
		        	{
		        		deleteList.add(entry.getKey());
		        	}
		        }
	        }
		    for(int i=0; i < deleteList.size(); i++)
		    {
		    	deleteAuthCode(deleteList.get(i));
		    }
		}
		
		//add authCode to authCodeMap
		AuthCode authCode = new AuthCode();
		Long expTime = curTime + duration;
		String codeStr = usage + curTime;
		String code = "" + codeStr.hashCode();
		authCode.setUsage(usage);
		authCode.setCode(code);
		authCode.setExpTime(expTime);
		authCode.setRemainCount(maxUseCount);
		authCode.setReposAccess(reposAccess);
		authCode.user = user;
		
		authCodeMap.put(code, authCode);
		return authCode;
	}
	
	protected static AuthCode generateAuthCodeRedis(String usage, long duration, int maxUseCount, ReposAccess reposAccess, User user) {
		Long curTime = new Date().getTime();

		RMap<Object, Object> authCodeMap = redisClient.getMap("authCodeMap");
		if(authCodeMap.size() > 100)
		{
			//Do clean expired authCode
			ArrayList<String> deleteList = new ArrayList<String>();
			Iterator<Entry<Object, Object>> iterator = authCodeMap.entrySet().iterator();
		    while (iterator.hasNext()) 
		    {
		    	Entry<Object, Object> entry = iterator.next();
		        if(entry != null)
		        {
		        	AuthCode authCode = (AuthCode) entry.getValue();
		        	if(authCode.getExpTime() < curTime || authCode.getRemainCount() <=0 )
		        	{
		        		deleteList.add((String) entry.getKey());
		        	}
		        }
	        }
		    for(int i=0; i < deleteList.size(); i++)
		    {
		    	deleteAuthCode(deleteList.get(i));
		    }
		}
		
		//add authCode to authCodeMap
		AuthCode authCode = new AuthCode();
		Long expTime = curTime + duration;
		String codeStr = usage + curTime;
		String code = "" + codeStr.hashCode();
		authCode.setUsage(usage);
		authCode.setCode(code);
		authCode.setExpTime(expTime);
		authCode.setRemainCount(maxUseCount);
		authCode.setReposAccess(reposAccess);
		authCode.user = user;
		
		authCodeMap.put(code, authCode);
		return authCode;
	}
		
	protected static void deleteAuthCode(String authCode) {
		deleteAuthCodeLocal(authCode);
		if(redisEn)
		{
			deleteAuthCodeRedis(authCode);
		}
	}

	protected static void deleteAuthCodeLocal(String authCode) {
		authCodeMap.remove(authCode);
	}

	private static void deleteAuthCodeRedis(String authCode) {
		RMap<Object, Object> authCodeMap = redisClient.getMap("authCodeMap");
		authCodeMap.remove(authCode);
	}
	
	protected AuthCode getAuthCode(String authCode) {
		//先尝试从本地获取
		AuthCode code = getAuthCodeLocal(authCode);
		if(code != null)
		{
			return code;
		}
		
		if(redisEn)
		{
			return getAuthCodeRedis(authCode);
		}
		
		return null;
	}

	private AuthCode getAuthCodeLocal(String authCode) {
		return authCodeMap.get(authCode);
	}

	private AuthCode getAuthCodeRedis(String authCode) {
		RMap<Object, Object> authCodeMap = redisClient.getMap("authCodeMap");
		return (AuthCode) authCodeMap.get(authCode);
	}
	
	//*** ReposIsBusy Flag
	protected void setReposIsBusy(Integer reposId, boolean isBusy) {
		if(redisEn)
		{
			setReposIsBusyRedis(reposId, isBusy);
		}
		else
		{
			setReposIsBusyLocal(reposId, isBusy);			
		}
	}

	private void setReposIsBusyLocal(Integer reposId, boolean isBusy) {
		reposDataHashMap.get(reposId).isBusy = isBusy;
	}

	protected void setReposIsBusyRedis(Integer reposId, boolean isBusy) {
		RBucket<Object> bucket = redisClient.getBucket("ReposBusyLock" + reposId);
		if(isBusy)
		{
			BasicLock lock = new BasicLock();
			lock.expireTime = new Date().getTime() + 7200000;
			lock.locker = serverIP;
			bucket.set(lock);
		}
		else
		{
			bucket.delete();
		}
	}
	
	protected boolean getReposIsBusyRedis(Integer reposId) {
		RBucket<Object> bucket = redisClient.getBucket("ReposBusyLock" + reposId);
		BasicLock lock = (BasicLock) bucket.get();
		if(lock == null || lock.expireTime == null)
		{
			return false;
		}
		return (lock.expireTime > new Date().getTime());
	}	
	
	//*** 仓库扩展配置 ***
	//*** reposExtConfigDigestHashMap
	protected static void updateReposExtConfigDigest(Repos repos, String key, String checkSum) {
		if(repos.reposExtConfigDigest == null)
		{
			repos.reposExtConfigDigest = new JSONObject();
		}
		
		repos.reposExtConfigDigest.put(key, checkSum);
		setReposExtConfigDigest(repos, repos.reposExtConfigDigest);	
	}

	protected static void setReposExtConfigDigest(Repos repos, JSONObject config) {
		if(redisEn)
		{
			RBucket<Object> bucket = redisClient.getBucket("reposExtConfigDigest" + repos.getId());
			bucket.set(config);
			Log.printObject("setReposExtConfigDigest() config:", config);
		}
	}

	protected static boolean isReposExtConfigDigestChanged(Repos repos, String key, Object config) {
		if(redisEn == false)
		{
			return false;
		}
		
		//reposExtConfigDigest is impossible be null, so if it is null do nothing
		if(repos.reposExtConfigDigest == null)
		{
			//Log.debug("isReposExtConfigDigestChanged() repos.reposExtConfigDigest is null");
			return false;
		}

		String remoteCheckSum = getReposExtConfigDigestCheckSum(repos.reposExtConfigDigest, key);
		if(remoteCheckSum == null || remoteCheckSum.isEmpty())
		{
			//Log.debug("isReposExtConfigDigestChanged() remoteCheckSum for " + key + " is null or empty");
			if(config == null)
			{
				return false;
			}
			Log.info("isReposExtConfigDigestChanged() " + repos.getId() +  " " + repos.getName() + " " + key + "'s remoteCheckSum is empty but local config not null");
			return true;
		}

		//remoteCheckSume was set
		if(config == null)
		{
			Log.info("isReposExtConfigDigestChanged() " + repos.getId() +  " " + repos.getName() + " " + key + "'s remoteCheckSum:" + remoteCheckSum + " but local config is null");
			return true;
		}
		
		String localCheckSum = getReposExtConfigDigestLocalCheckSum(config, key);
		//Log.debug("isReposExtConfigDigestChanged() localCheckSum:" + localCheckSum + " remoteCheckSum:" + remoteCheckSum);		
		if(localCheckSum == null || !localCheckSum.equals(remoteCheckSum))
		{
			Log.info("isReposExtConfigDigestChanged() " + repos.getId() +  " " + repos.getName() + " " + key + "'s checkSum not matched localCheckSum:" + localCheckSum + " remoteCheckSum:" + remoteCheckSum);
			return true;
		}
		
		return false;
	}
	
	private static String getReposExtConfigDigestLocalCheckSum(Object config, String key) {
		switch(key)
		{
		case ReposExtConfigDigest.RemoteStorageConfig:
		case ReposExtConfigDigest.RemoteServerConfig:
			return ((RemoteStorageConfig) config).checkSum;
		case ReposExtConfigDigest.AutoSyncupConfig:
			return ((ReposSyncupConfig) config).checkSum;
		case ReposExtConfigDigest.AutoBackupConfig:
			return ((ReposBackupConfig) config).checkSum;
		case ReposExtConfigDigest.TextSearchConfig:
			return ((TextSearchConfig) config).checkSum;	
		case ReposExtConfigDigest.RecycleBinConfig:
			return ((RecycleBinConfig) config).checkSum;			
		case ReposExtConfigDigest.VersionIgnoreConfig:
			return ((VersionIgnoreConfig) config).checkSum;			
		case ReposExtConfigDigest.EncryptConfig:
			return ((EncryptConfig) config).checkSum;
		default:
			break;
		}
		return null;
	}
	
	private static String getReposExtConfigDigestCheckSum(JSONObject reposExtConfigDigest, String key) {
		return reposExtConfigDigest.getString(key);
	}
	
	//*** reposRemoteStorageHashMap
	protected static void setReposRemoteStorageConfig(Repos repos, RemoteStorageConfig config) {
		reposRemoteStorageHashMap.put(repos.getId(), config);
		if(redisEn)
		{
			String lockInfo = "setReposRemoteStorageConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			setReposRemoteStorageConfigRedis(repos, config);		
			
			redisSyncUnlock(lockName, lockInfo);		
		}
	}
	
	private static void setReposRemoteStorageConfigRedis(Repos repos, RemoteStorageConfig config) {
		RMap<Object, Object> reposRemoteStorageHashMap = redisClient.getMap("reposRemoteStorageHashMap");
		config.checkSum = new Date().getTime() + "";
		reposRemoteStorageHashMap.put(repos.getId(), config);		
		
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.RemoteStorageConfig, config.checkSum);
	}
	
	protected static void deleteReposRemoteStorageConfig(Repos repos) {
		reposRemoteStorageHashMap.remove(repos.getId());
		if(redisEn)
		{
			String lockInfo = "deleteReposRemoteStorageConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			deleteReposRemoteStorageConfigRedis(repos);
			
			redisSyncUnlock(lockName, lockInfo);					
		}
	}
	
	private static void deleteReposRemoteStorageConfigRedis(Repos repos) {
		RMap<Object, Object> reposRemoteStorageHashMap = redisClient.getMap("reposRemoteStorageHashMap");
		reposRemoteStorageHashMap.remove(repos.getId());
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.RemoteStorageConfig, "");
	}
	
	protected RemoteStorageConfig getReposRemoteStorageConfig(Repos repos) {
		RemoteStorageConfig config = reposRemoteStorageHashMap.get(repos.getId());
	
		if(isReposExtConfigDigestChanged(repos,  ReposExtConfigDigest.RemoteStorageConfig, config) == false)
		{
			return config;
		}
		config = getReposRemoteStorageConfigRedis(repos);
		if(config == null)
		{
			reposRemoteStorageHashMap.remove(repos.getId());
		}
		else
		{
			reposRemoteStorageHashMap.put(repos.getId(), config);
		}
		return config;
	}
	
	protected static RemoteStorageConfig getReposRemoteStorageConfigRedis(Repos repos) {
		RMap<Object, Object> reposRemoteStorageHashMap = redisClient.getMap("reposRemoteStorageHashMap");
		return (RemoteStorageConfig) reposRemoteStorageHashMap.get(repos.getId());
	}
	
	//*** reposRemoteServerHashMap	
	private static void setReposRemoteServerConfig(Repos repos, RemoteStorageConfig config) {
		reposRemoteServerHashMap.put(repos.getId(), config);
		if(redisEn)
		{
			String lockInfo = "setReposRemoteServerConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			setReposRemoteServerConfigRedis(repos, config);
			
			redisSyncUnlock(lockName, lockInfo);		
		}
	}
	
	private static void setReposRemoteServerConfigRedis(Repos repos, RemoteStorageConfig config) {
		RMap<Object, Object> reposRemoteServerHashMap = redisClient.getMap("reposRemoteServerHashMap");
		config.checkSum = new Date().getTime() + "";
		reposRemoteServerHashMap.put(repos.getId(), config);
		
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.RemoteServerConfig, config.checkSum);			
	}
	
	protected static void deleteReposRemoteServerConfig(Repos repos) {
		reposRemoteServerHashMap.remove(repos.getId());
		if(redisEn)
		{
			String lockInfo = "deleteReposRemoteServerConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			deleteReposRemoteServerConfigRedis(repos);
			
			redisSyncUnlock(lockName, lockInfo);				
		}
	}
	
	private static void deleteReposRemoteServerConfigRedis(Repos repos) {
		RMap<Object, Object> reposRemoteServerHashMap = redisClient.getMap("reposRemoteServerHashMap");
		reposRemoteServerHashMap.remove(repos.getId());
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.RemoteServerConfig, "");
	}
	
	protected RemoteStorageConfig getReposRemoteServerConfig(Repos repos) {
		RemoteStorageConfig config = reposRemoteServerHashMap.get(repos.getId());
	
		if(isReposExtConfigDigestChanged(repos,  ReposExtConfigDigest.RemoteServerConfig, config) == false)
		{
			return config;
		}
		config = getReposRemoteServerConfigRedis(repos);
		reposRemoteServerHashMap.put(repos.getId(), config);
		return config;
	}
	
	protected static RemoteStorageConfig getReposRemoteServerConfigRedis(Repos repos) {
		RMap<Object, Object> reposRemoteServerHashMap = redisClient.getMap("reposRemoteServerHashMap");
		return (RemoteStorageConfig) reposRemoteServerHashMap.get(repos.getId());
	}

	//*** reposSyncupConfigHashMap
	private void setReposSyncupConfig(Repos repos, ReposSyncupConfig config) {
		reposSyncupConfigHashMap.put(repos.getId(), config);		
		if(redisEn)
		{
			String lockInfo = "setReposSyncupConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			setReposSyncupConfigRedis(repos, config);

			redisSyncUnlock(lockName, lockInfo);
		}
	}
	
	private void setReposSyncupConfigRedis(Repos repos, ReposSyncupConfig config) {
		RMap<Object, Object> reposSyncupConfigHashMap = redisClient.getMap("reposSyncupConfigHashMap");
		config.checkSum = new Date().getTime() + "";
		reposSyncupConfigHashMap.put(repos.getId(), config);

		updateReposExtConfigDigest(repos, ReposExtConfigDigest.AutoSyncupConfig, config.checkSum);			
	}
	
	private void deleteReposSyncupConfig(Repos repos) {
		reposSyncupConfigHashMap.remove(repos.getId());
		if(redisEn)
		{
			String lockInfo = "deleteReposSyncupConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			deleteReposSyncupConfigRedis(repos);
			
			redisSyncUnlock(lockName, lockInfo);
		}
	}
	
	private void deleteReposSyncupConfigRedis(Repos repos) {
		RMap<Object, Object> reposSyncupConfigHashMap = redisClient.getMap("reposSyncupConfigHashMap");
		reposSyncupConfigHashMap.remove(repos.getId());
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.AutoSyncupConfig, "");	
	}
	
	protected ReposSyncupConfig getReposSyncupConfig(Repos repos) {
		ReposSyncupConfig config = reposSyncupConfigHashMap.get(repos.getId());
	
		if(isReposExtConfigDigestChanged(repos,  ReposExtConfigDigest.AutoSyncupConfig, config) == false)
		{
			return config;
		}
		
		config = getReposSyncupConfigRedis(repos);
		reposSyncupConfigHashMap.put(repos.getId(), config);
		return config;
	}
	
	private ReposSyncupConfig getReposSyncupConfigRedis(Repos repos) {
		RMap<Object, Object> reposSyncupConfigHashMap = redisClient.getMap("reposSyncupConfigHashMap");
		return (ReposSyncupConfig) reposSyncupConfigHashMap.get(repos.getId());
	}
	
	//*** reposBackupConfigHashMap
	private void setReposBackupConfig(Repos repos, ReposBackupConfig config) {
		reposBackupConfigHashMap.put(repos.getId(), config);		
		if(redisEn)
		{
			String lockInfo = "setReposBackupConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			setReposBackupConfigRedis(repos, config);

			redisSyncUnlock(lockName, lockInfo);
		}
	}

	private void setReposBackupConfigRedis(Repos repos, ReposBackupConfig config) {
		RMap<Object, Object> reposBackupConfigHashMap = redisClient.getMap("reposBackupConfigHashMap");
		config.checkSum = new Date().getTime() + "";
		reposBackupConfigHashMap.put(repos.getId(), config);

		updateReposExtConfigDigest(repos, ReposExtConfigDigest.AutoBackupConfig, config.checkSum);			
	}

	private void deleteReposBackupConfig(Repos repos) {
		reposBackupConfigHashMap.remove(repos.getId());
		if(redisEn)
		{
			String lockInfo = "deleteReposBackupConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			deleteReposBackupConfigRedis(repos);
			
			redisSyncUnlock(lockName, lockInfo);
		}
	}
	
	private void deleteReposBackupConfigRedis(Repos repos) {
		RMap<Object, Object> reposBackupConfigHashMap = redisClient.getMap("reposBackupConfigHashMap");
		reposBackupConfigHashMap.remove(repos.getId());
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.AutoBackupConfig, "");	
	}
	
	protected ReposBackupConfig getReposBackupConfig(Repos repos) {
		ReposBackupConfig config = reposBackupConfigHashMap.get(repos.getId());
	
		if(isReposExtConfigDigestChanged(repos,  ReposExtConfigDigest.AutoBackupConfig, config) == false)
		{
			return config;
		}
		
		config = getReposBackupConfigRedis(repos);
		reposBackupConfigHashMap.put(repos.getId(), config);
		return config;
	}
	
	private ReposBackupConfig getReposBackupConfigRedis(Repos repos) {
		RMap<Object, Object> reposBackupConfigHashMap = redisClient.getMap("reposBackupConfigHashMap");
		return (ReposBackupConfig) reposBackupConfigHashMap.get(repos.getId());
	}
	
	//*** reposTextSearchConfigHashMap
	protected void setReposTextSearchConfig(Repos repos, TextSearchConfig config) 
	{
		reposTextSearchConfigHashMap.put(repos.getId(), config);
		if(redisEn)
		{
			String lockInfo = "setReposTextSearchConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			setReposTextSearchConfigRedis(repos, config);

			redisSyncUnlock(lockName, lockInfo);
		}
	}

	private void setReposTextSearchConfigRedis(Repos repos, TextSearchConfig config) 
	{
		RMap<Object, Object> reposTextSearchConfigHashMap = redisClient.getMap("reposTextSearchConfigHashMap");
		config.checkSum = new Date().getTime() + "";
		reposTextSearchConfigHashMap.put(repos.getId(), config);
		
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.TextSearchConfig, config.checkSum);	
	}
	
	private void deleteReposTextSearchConfig(Repos repos) 
	{
		reposTextSearchConfigHashMap.remove(repos.getId());
		if(redisEn)
		{
			String lockInfo = "deleteReposTextSearchConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			deleteReposTextSearchConfigRedis(repos);

			redisSyncUnlock(lockName, lockInfo);
		}		
	}
	
	private void deleteReposTextSearchConfigRedis(Repos repos) 
	{
		RMap<Object, Object> reposTextSearchConfigHashMap = redisClient.getMap("reposTextSearchConfigHashMap");
		reposTextSearchConfigHashMap.remove(repos.getId());
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.TextSearchConfig, "");	
	}
	
	protected TextSearchConfig getReposTextSearchConfig(Repos repos) 
	{
		TextSearchConfig config = reposTextSearchConfigHashMap.get(repos.getId());
		if(isReposExtConfigDigestChanged(repos,  ReposExtConfigDigest.TextSearchConfig, config) == false)
		{
			return config;
		}
		
		config = getReposTextSearchConfigRedis(repos);
		reposTextSearchConfigHashMap.put(repos.getId(), config);
		return config;
	}

	private TextSearchConfig getReposTextSearchConfigRedis(Repos repos) 
	{
		RMap<Object, Object> reposTextSearchConfigHashMap = redisClient.getMap("reposTextSearchConfigHashMap");
		return (TextSearchConfig) reposTextSearchConfigHashMap.get(repos.getId());
	}
	
	//*** reposRecycleBinConfigHashMap
	protected RecycleBinConfig getReposRecycleBinConfig(Repos repos) 
	{
		RecycleBinConfig config = reposRecycleBinConfigHashMap.get(repos.getId());
		if(isReposExtConfigDigestChanged(repos,  ReposExtConfigDigest.RecycleBinConfig, config) == false)
		{
			return config;
		}
		
		config = getReposRecycleBinConfigRedis(repos);
		reposRecycleBinConfigHashMap.put(repos.getId(), config);
		return config;
	}

	private RecycleBinConfig getReposRecycleBinConfigRedis(Repos repos) 
	{
		RMap<Object, Object> reposRecycleBinConfigHashMap = redisClient.getMap("reposRecycleBinConfigHashMap");
		return (RecycleBinConfig) reposRecycleBinConfigHashMap.get(repos.getId());
	}
	
	protected void setReposRecycleBinConfig(Repos repos, RecycleBinConfig config) 
	{
		reposRecycleBinConfigHashMap.put(repos.getId(), config);
		if(redisEn)
		{
			String lockInfo = "setReposRecycleBinConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			setReposRecycleBinConfigRedis(repos, config);

			redisSyncUnlock(lockName, lockInfo);
		}
	}

	private void setReposRecycleBinConfigRedis(Repos repos, RecycleBinConfig config) 
	{
		RMap<Object, Object> reposRecycleBinConfigHashMap = redisClient.getMap("reposRecycleBinConfigHashMap");
		config.checkSum = new Date().getTime() + "";
		reposRecycleBinConfigHashMap.put(repos.getId(), config);
		
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.RecycleBinConfig, config.checkSum);	
	}
	
	private void deleteReposRecycleBinConfig(Repos repos) 
	{
		reposRecycleBinConfigHashMap.remove(repos.getId());
		if(redisEn)
		{
			String lockInfo = "deleteReposRecycleBinConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			deleteReposRecycleBinConfigRedis(repos);

			redisSyncUnlock(lockName, lockInfo);
		}		
	}
	
	private void deleteReposRecycleBinConfigRedis(Repos repos) 
	{
		RMap<Object, Object> reposRecycleBinConfigHashMap = redisClient.getMap("reposRecycleBinConfigHashMap");
		reposRecycleBinConfigHashMap.remove(repos.getId());
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.RecycleBinConfig, "");	
	}
	
	//*** reposVersionIgnoreConfigHashMap
	protected void setReposVersionIgnoreConfig(Repos repos, VersionIgnoreConfig config) 
	{
		reposVersionIgnoreConfigHashMap.put(repos.getId(), config);
		if(redisEn)
		{
			String lockInfo = "setReposVersionIgnoreConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			setReposVersionIgnoreConfigRedis(repos, config);

			redisSyncUnlock(lockName, lockInfo);
		}
	}

	private void setReposVersionIgnoreConfigRedis(Repos repos, VersionIgnoreConfig config) 
	{
		RMap<Object, Object> reposVersionIgnoreConfigHashMap = redisClient.getMap("reposVersionIgnoreConfigHashMap");
		config.checkSum = new Date().getTime() + "";
		reposVersionIgnoreConfigHashMap.put(repos.getId(), config);
		
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.VersionIgnoreConfig, config.checkSum);	
	}
	
	protected void deleteReposVersionIgnoreConfig(Repos repos) 
	{
		reposVersionIgnoreConfigHashMap.remove(repos.getId());
		if(redisEn)
		{
			String lockInfo = "deleteReposVersionIgnoreConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
			
			deleteReposVersionIgnoreConfigRedis(repos);

			redisSyncUnlock(lockName, lockInfo);			
		}		
	}
	
	private void deleteReposVersionIgnoreConfigRedis(Repos repos) 
	{
		RMap<Object, Object> reposVersionIgnoreConfigHashMap = redisClient.getMap("reposVersionIgnoreConfigHashMap");
		reposVersionIgnoreConfigHashMap.remove(repos.getId());
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.VersionIgnoreConfig, "");	
	}
	
	protected VersionIgnoreConfig getReposVersionIgnoreConfig(Repos repos) 
	{
		VersionIgnoreConfig config = reposVersionIgnoreConfigHashMap.get(repos.getId());
		if(isReposExtConfigDigestChanged(repos,  ReposExtConfigDigest.VersionIgnoreConfig, config) == false)
		{
			return config;
		}
		
		config = getReposVersionIgnoreConfigRedis(repos);
		reposVersionIgnoreConfigHashMap.put(repos.getId(), config);
		return config;
	}

	private VersionIgnoreConfig getReposVersionIgnoreConfigRedis(Repos repos) 
	{
		RMap<Object, Object> reposVersionIgnoreConfigHashMap = redisClient.getMap("reposVersionIgnoreConfigHashMap");
		return (VersionIgnoreConfig) reposVersionIgnoreConfigHashMap.get(repos.getId());
	}
	
	//*** reposEncryptConfigHashMap
	protected void setReposEncryptConfig(Repos repos, EncryptConfig config) 
	{
		reposEncryptConfigHashMap.put(repos.getId(), config);
		if(redisEn)
		{
			String lockInfo = "setReposEncryptConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
						
			setReposEncryptConfigRedis(repos, config);

			redisSyncUnlock(lockName, lockInfo);	
		}
	}

	private void setReposEncryptConfigRedis(Repos repos, EncryptConfig config) 
	{
		RMap<Object, Object> reposEncryptConfigHashMap = redisClient.getMap("reposEncryptConfigHashMap");
		config.checkSum = new Date().getTime() + "";
		reposEncryptConfigHashMap.put(repos.getId(), config);
		
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.EncryptConfig, config.checkSum);	
	}
	
	protected void deleteReposEncryptConfig(Repos repos) 
	{
		reposEncryptConfigHashMap.remove(repos.getId());
		if(redisEn)
		{
			String lockInfo = "deleteReposEncryptConfig for repos [" + repos.getId() + " " + repos.getName() + "]";
			String lockName = "reposExtConfigSyncLock" + repos.getId();
			redisSyncLock(lockName, lockInfo);
						
			deleteReposEncryptConfigRedis(repos);

			redisSyncUnlock(lockName, lockInfo);	
		}		
	}
	
	private void deleteReposEncryptConfigRedis(Repos repos) 
	{
		RMap<Object, Object> reposEncryptConfigHashMap = redisClient.getMap("reposEncryptConfigHashMap");
		reposEncryptConfigHashMap.remove(repos.getId());
		updateReposExtConfigDigest(repos, ReposExtConfigDigest.EncryptConfig, "");	
	}
	
	protected EncryptConfig getReposEncryptConfig(Repos repos) 
	{
		EncryptConfig config = reposEncryptConfigHashMap.get(repos.getId());
		if(isReposExtConfigDigestChanged(repos,  ReposExtConfigDigest.EncryptConfig, config) == false)
		{
			return config;
		}
		
		config = getReposEncryptConfigRedis(repos);
		reposEncryptConfigHashMap.put(repos.getId(), config);
		return config;
	}

	private EncryptConfig getReposEncryptConfigRedis(Repos repos) 
	{
		RMap<Object, Object> reposEncryptConfigHashMap = redisClient.getMap("reposEncryptConfigHashMap");
		return (EncryptConfig) reposEncryptConfigHashMap.get(repos.getId());
	}
	
	/************************ DocSys仓库与文件锁定接口 *******************************/
	//*** reposLocksMap ***
	//Lock Repos
	protected DocLock lockRepos(Repos repos, Integer lockType, long lockDuration, User login_user, ReturnAjax rt, boolean docLockCheckFlag, String lockInfo) {
		DocLock reposLock = null;
		String lockName = "syncLock";
		synchronized(syncLock)
		{	
			redisSyncLockEx(lockName, lockInfo);
			
			reposLock = doLockRepos(repos, lockType, lockDuration, login_user, rt, false, lockInfo); 
			
			redisSyncUnlockEx(lockName, lockInfo, syncLock);
		}
		return reposLock;
	}	
	
	protected DocLock doLockRepos(Repos repos, Integer lockType, long lockDuration, User login_user, ReturnAjax rt, boolean docLockCheckFlag, String info) {
		Log.debug("doLockRepos() Repos:]" + repos.getName() + "] lockType:" + lockType + " login_user:]" + login_user.getName() + "] docLockCheckFlag:" + docLockCheckFlag);

		//仓库锁使用了和DocLock相同的数据结构，因此借用了docLock的接口
		DocLock reposLock = getReposLock(repos);
		if(reposLock != null && isDocLocked(reposLock, lockType, login_user,rt))
		{
			Log.debug("doLockRepos() Repos [" + repos.getName() +"] was locked");
			return null;
		}
		
		//检查仓库是否有文件锁定
		if(docLockCheckFlag)
		{
			Doc rootDoc = new Doc();
			rootDoc.setVid(repos.getId());
			rootDoc.setPath("");
			rootDoc.setName("");
			if(checkDocLocked(rootDoc, DocLock.LOCK_TYPE_FORCE, login_user, true) == true)
			{
				return null;
			}
		}
		
		//Do Lock
		//lockTime is the time to release lock 
		long currentTime = new Date().getTime();
		long lockTime = currentTime + lockDuration;
		int lockState = getLockState(lockType);
		if(reposLock == null)
		{
			reposLock = new DocLock();
			reposLock.lockId = repos.getId() + "";
			reposLock.setVid(repos.getId());
			reposLock.setState(lockState);
			reposLock.locker[lockType] = login_user.getName();
			reposLock.lockBy[lockType] = login_user.getId();
			reposLock.lockTime[lockType] = lockTime;	//Set lockTime
			reposLock.createTime[lockType] = currentTime;
			reposLock.server[lockType] = clusterServerUrl;
			reposLock.info[lockType] = info;
			addReposLock(repos, reposLock);			
		}
		else
		{
			int curLockState = reposLock.getState();
			reposLock.setState(curLockState | lockState);
			reposLock.locker[lockType] = login_user.getName();
			reposLock.lockBy[lockType] = login_user.getId();
			reposLock.lockTime[lockType] = lockTime;	//Set lockTime
			reposLock.server[lockType] = clusterServerUrl;
			reposLock.info[lockType] = info;
			updateReposLock(repos, reposLock);
		}
		
		Log.debug("doLockRepos() [" + repos.getName() + "] success lockType:" + lockType + " by " + login_user.getName());
		return reposLock;
	}
	
	private void addReposLock(Repos repos, DocLock reposLock) {
		if(redisEn)
		{
			addReposLockRedis(repos, reposLock);
		}
		else
		{
			addReposLockLocal(repos, reposLock);
		}
	}
	
	private void addReposLockLocal(Repos repos, DocLock reposLock) {
		reposLocksMap.put(repos.getId(), reposLock);
	}
	
	private void addReposLockRedis(Repos repos, DocLock reposLock) {
		RMap<Object, Object> reposLocksMap = redisClient.getMap("reposLocksMap");
		reposLocksMap.put(repos.getId(), reposLock);
	}
	
	private void updateReposLock(Repos repos, DocLock reposLock) {
		if(redisEn)
		{
			updateReposLockRedis(repos, reposLock);
		}
	}
	
	private void updateReposLockRedis(Repos repos, DocLock reposLock) {
		RMap<Object, Object> reposLocksMap = redisClient.getMap("reposLocksMap");
		reposLocksMap.put(repos.getId(), reposLock);
	}
	
	private void deleteReposLock(Repos repos) {
		if(redisEn)
		{
			deleteReposLockRedis(repos);
		}
		else
		{
			deleteReposLockLocal(repos);
		}
	}

	private void deleteReposLockLocal(Repos repos) {
		reposLocksMap.remove(repos.getId());
	}

	private void deleteReposLockRedis(Repos repos) {
		RMap<Object, Object> reposLocksMap = redisClient.getMap("reposLocksMap");
		reposLocksMap.remove(repos.getId());
	}

	private DocLock getReposLock(Repos repos) {
		if(redisEn)
		{
			return getReposLockRedis(repos);
		}
		else
		{
			return getReposLockLocal(repos);
		}
	}
	
	private DocLock getReposLockLocal(Repos repos) {
		DocLock reposLock = reposLocksMap.get(repos.getId());
		return reposLock;
	}
	
	private DocLock getReposLockRedis(Repos repos) {
		RMap<Object, Object> reposLocksMap = redisClient.getMap("reposLocksMap");
		return (DocLock) reposLocksMap.get(repos.getId());
	}

	//Unlock Doc
	protected boolean unlockRepos(Repos repos, Integer lockType, User login_user) {
		DocLock reposLock = getReposLock(repos);
		
		if(reposLock == null)
		{
			return true;
		}
		
		if(reposLock.getState() == 0)
		{
			Log.debug("unlockRepos() repos was not locked:" + reposLock.getState());			
			return true;
		}
		
		Integer lockBy = reposLock.lockBy[lockType];
		Integer curLockState = reposLock.getState();
		Integer lockState = getLockState(lockType);
		if(lockBy != null && lockBy.equals(login_user.getId()) == false)
		{
			Log.debug("unlockRepos() repos was not locked by " + login_user.getName());
			return false;
		}

		Integer newLockState = curLockState & (~lockState);
		if(newLockState == 0)
		{
			deleteReposLock(repos);
		}

		Log.debug("unlockRepos() success:" + repos.getName());
		return true;
	}
	
	//*** docLocksMap ***
	//Lock Doc
	protected DocLock lockDoc(Doc doc,Integer lockType, long lockDuration, User accessUser, ReturnAjax rt, boolean subDocCheckFlag, 
			String lockInfo, Integer event) 
	{
		DocLock docLock = null;
		String lockName = "syncLock";
		synchronized(syncLock)
		{
    		redisSyncLockEx(lockName, lockInfo);
    		
			//LockDoc
			docLock = doLockDoc(doc, lockType,  lockDuration, accessUser, rt, false, lockInfo, event);
			
			redisSyncUnlockEx(lockName, lockInfo, syncLock);
		}
		return docLock;
	}

	//文件锁定接口需要支持集群部署时服务器之间操作的原子性
	protected DocLock doLockDoc(Doc doc,Integer lockType, long lockDuration, User login_user, ReturnAjax rt, boolean subDocCheckFlag, String info, Integer event) {
		Log.debug("doLockDoc() [" + doc.getPath() + doc.getName() + "] lockType:" + lockType + " login_user[" + login_user.getName() + "] subDocCheckFlag:" + subDocCheckFlag);

		if(checkDocLocked(doc, lockType, login_user, subDocCheckFlag, rt))
		{
			return null;
		}
		
		//Do Lock
		DocLock docLock = getDocLock(doc);
		if(docLock == null)
		{
			Log.debug("doLockDoc() docLock is null");
			docLock = new DocLock();
			//设置基本信息
			docLock.lockId = getDocLockId(doc);
			docLock.setVid(doc.getVid());
			docLock.setPid(doc.getPid());			
			docLock.setDocId(doc.getDocId());
			docLock.setPath(doc.getPath());			
			docLock.setName(doc.getName());			
			docLock.setType(doc.getType());
			
			//设置锁状态
			docLock.setState(getLockState(lockType));
			docLock.locker[lockType] = login_user.getName();
			docLock.lockBy[lockType] = login_user.getId();
			Long currentTime = new Date().getTime();
			docLock.createTime[lockType] = currentTime;	//Set createTime
			docLock.lockTime[lockType] = currentTime + lockDuration;	//Set lockTime
			docLock.server[lockType] = clusterServerUrl;
			docLock.info[lockType] = info;
			docLock.event[lockType] = event;
			addDocLock(doc, docLock);
			Log.debug("doLockDoc() [" + doc.getPath() + doc.getName() + "] success lockType:" + lockType + " by " + login_user.getName());
			return docLock;
		}
		else
		{
			Log.printObject("doLockDoc() docLock:", docLock);
			int curLockState = docLock.getState();
			docLock.setState(curLockState | getLockState(lockType));
			docLock.locker[lockType] = login_user.getName();
			docLock.lockBy[lockType] = login_user.getId();
			Long currentTime = new Date().getTime();
			docLock.createTime[lockType] = currentTime;	//Set createTime
			docLock.lockTime[lockType] = currentTime + lockDuration;	//Set lockTime		
			docLock.server[lockType] = clusterServerUrl;
			docLock.info[lockType] = info;
			docLock.event[lockType] = event;
			updateDocLock(doc, docLock);
			Log.debug("doLockDoc() [" + doc.getPath() + doc.getName() + "] success lockType:" + lockType + " by " + login_user.getName());
			return docLock;
		}
	}
	
	protected boolean checkDocLocked(Doc doc, Integer lockType, User login_user, boolean subDocCheckFlag) 
	{	
		ReturnAjax rt = new ReturnAjax();
		return checkDocLocked(doc, lockType, login_user, subDocCheckFlag, rt);
	}
	
	protected boolean checkDocLocked(Doc doc, Integer lockType, User login_user, boolean subDocCheckFlag, ReturnAjax rt) 
	{	
		Log.debug("checkDocLocked() [" + doc.getVid() + "] [" + doc.getPath() + doc.getName() + "] lockType:" + lockType + " user:[" + login_user.getId() + "] [" + login_user.getName() + "] subDocCheckFlag:" + subDocCheckFlag);
		
		if(isReposDocLocksMapEmpty(doc) == true)
		{
			//reposDocLocksMap is empty, so no need to check anymore
			return false;
		}
		
        DocLock docLock = getDocLock(doc);
		
		//协同编辑只需要检查当前和父节点是否强制锁定即可
		if(login_user.getId().equals(coEditUser.getId()))
		{
			docSysDebugLog("checkDocLocked() accessUser [" + login_user.getName() + "] is coEditUser", rt);
			return (isDocForceLocked(docLock, DocLock.LOCK_TYPE_FORCE, DocLock.LOCK_STATE_FORCE, login_user, rt) || isParentDocForceLocked(doc,login_user,rt));
		}
		
		if(isDocLocked(docLock, lockType, login_user,rt ))
		{
			docSysDebugLog("lockDoc() Doc [" + doc.getPath() + doc.getName() +"] was locked", rt);
			return true;
		}
		
		switch(lockType)
		{
		case DocLock.LOCK_TYPE_FORCE:
		case DocLock.LOCK_TYPE_NORMAL:
			//检查其父节点是否强制锁定
			if(isParentDocLocked(doc,login_user,rt))
			{
				docSysDebugLog("lockDoc() Parent Doc of [" + doc.getPath() + doc.getName() +"] was locked！", rt);				
				return true;
			}
			
			//Check If SubDoc was locked
			if(subDocCheckFlag)
			{
				if(isSubDocLocked(doc,login_user, rt) == true)
				{
					docSysDebugLog("lockDoc() subDoc of [" + doc.getPath() + doc.getName() +"] was locked！", rt);
					return true;
				}
			}
			break;
		default:
			//协同编辑也不需要检查上级目录和子目录
			//备注文件是平面结构，不需要检查父节点和子节点
			break;
		}
		
		return false;
	}
	
	protected static Integer getLockState(Integer lockType) {
		return DocLock.lockStateMap[lockType];
	}

	private void addDocLock(Doc doc, DocLock docLock) {
		if(redisEn)
		{
			addDocLockRedis(doc, docLock);
		}
		else
		{
			addDocLockLocal(doc, docLock);
		}
	}
	
	private void addDocLockLocal(Doc doc, DocLock docLock) {
		ConcurrentHashMap<String, DocLock> reposDocLocskMap = docLocksMap.get(doc.getVid());
		if(reposDocLocskMap == null)
		{
			reposDocLocskMap = new ConcurrentHashMap<String, DocLock>();
			docLocksMap.put(doc.getVid(), reposDocLocskMap);
		}
		reposDocLocskMap.put(docLock.lockId, docLock);
	}
	
	private void addDocLockRedis(Doc doc, DocLock docLock) {
		RMap<String, DocLock> reposDocLocskMap = redisClient.getMap("reposDocLocskMap" + doc.getVid());
		reposDocLocskMap.put(docLock.lockId, docLock);
	}
	
	private void updateDocLock(Doc doc, DocLock docLock) {
		if(redisEn)
		{
			updateDocLockRedis(doc, docLock);
		}
	}
	
	private void updateDocLockRedis(Doc doc, DocLock docLock) {
		RMap<Object, Object> reposDocLocskMap = redisClient.getMap("reposDocLocskMap" + doc.getVid());
		reposDocLocskMap.put(docLock.lockId, docLock);
	}
	
	protected void deleteDocLock(Doc doc) {
		if(redisEn)
		{
			deleteDocLockRedis(doc);
		}
		else
		{
			deleteDocLockLocal(doc);
		}
	}
	
	private void deleteDocLockLocal(Doc doc) {
		ConcurrentHashMap<String, DocLock> reposDocLocskMap = docLocksMap.get(doc.getVid());
		if(reposDocLocskMap == null)
		{
			return;
		}
		reposDocLocskMap.remove(getDocLockId(doc));
	}
	
	private void deleteDocLockRedis(Doc doc) {
		RMap<String, DocLock> reposDocLocskMap = redisClient.getMap("reposDocLocskMap" + doc.getVid());
		reposDocLocskMap.remove(getDocLockId(doc));
	}


	public static DocLock getDocLock(Doc doc) {
		if(redisEn)
		{
			return getDocLockRedis(doc);
		}
		else
		{
			return getDocLockLocal(doc);
		}
	}

	public static DocLock getDocLockLocal(Doc doc) {
		ConcurrentHashMap<String, DocLock> reposDocLocskMap = docLocksMap.get(doc.getVid());
		if(reposDocLocskMap == null)
		{
			Log.debug("getDocLockLocal() reposDocLocskMap for " + doc.getVid() + " is null");
			return null;
		}
		
		String docLockId = getDocLockId(doc);
		return reposDocLocskMap.get(docLockId);
	}

	public static DocLock getDocLockRedis(Doc doc) {
		RMap<String, DocLock> reposDocLocskMap = redisClient.getMap("reposDocLocskMap" + doc.getVid());
		String docLockId = getDocLockId(doc);
		return reposDocLocskMap.get(docLockId);
	}
	
	private boolean isReposDocLocksMapEmpty(Doc doc) {
		if(redisEn)
		{
			return isReposDocLocksMapEmptyRedis(doc);
		}
		else
		{
			return isReposDocLocksMapEmptyLocal(doc);
		}
	}

	private boolean isReposDocLocksMapEmptyLocal(Doc doc) {
		ConcurrentHashMap<String, DocLock> reposDocLocskMap = docLocksMap.get(doc.getVid());
		if(reposDocLocskMap == null || reposDocLocskMap.size() == 0)
		{
			return true;
		}
		return false;
	}
	
	private boolean isReposDocLocksMapEmptyRedis(Doc doc) {
		RMap<String, DocLock> reposDocLocskMap = redisClient.getMap("reposDocLocskMap" + doc.getVid());
		if(reposDocLocskMap == null || reposDocLocskMap.size() == 0)
		{
			return true;
		}
		return false;
	}

	private static String getDocLockId(Doc doc) {
		String lockId = doc.getVid() + "_" + doc.getPath() + doc.getName();
		//Log.debug("getDocLockId docLockId:" + lockId);
		return lockId;
	}
	
	public static boolean isDocForceLocked(DocLock docLock, User login_user,ReturnAjax rt) {
		if(docLock == null)
		{
			return false;
		}
		
		int curLockState = docLock.getState();
		if(curLockState == 0)
		{
			return false;
		}
		
		return isDocForceLocked(docLock, DocLock.LOCK_TYPE_FORCE, DocLock.LOCK_STATE_FORCE, login_user, rt);
	}
	
	public static boolean isDocLocked(DocLock docLock, Integer lockType, User login_user,ReturnAjax rt) {
		Log.debug("isDocLocked() lockType:" + lockType);
		if(docLock == null)
		{
			return false;
		}
		
		int curLockState = docLock.getState();
		if(curLockState == 0)
		{
			return false;
		}
		
		boolean ret = false;
		switch(lockType)
		{
		//RealDoc Lock
		case DocLock.LOCK_TYPE_FORCE:
			if(isDocForceLocked(docLock, DocLock.LOCK_TYPE_FORCE, DocLock.LOCK_STATE_FORCE, login_user, rt) || 	//检查文件是否上了强制锁（表明当前文件正在删除、写入、移动、复制、重命名）
					isDocLocked(docLock, DocLock.LOCK_TYPE_NORMAL, DocLock.LOCK_STATE_NORMAL, login_user, rt) ||	//检查文件是否上了普通锁
					isDocLocked(docLock, DocLock.LOCK_TYPE_COEDIT, DocLock.LOCK_STATE_COEDIT, login_user, rt))	//检查文件是否上了协同编辑锁
			{
				ret = true;
			}
			break;
		case DocLock.LOCK_TYPE_NORMAL:
			if(isDocForceLocked(docLock, DocLock.LOCK_TYPE_FORCE, DocLock.LOCK_STATE_FORCE, login_user, rt) || 	//检查文件是否上了强制锁（表明当前文件正在删除、写入、移动、复制、重命名）
					isDocLocked(docLock, DocLock.LOCK_TYPE_NORMAL, DocLock.LOCK_STATE_NORMAL, login_user, rt))		//检查文件是否上了普通锁
			{
				ret = true;
			}
			break;
		case DocLock.LOCK_TYPE_COEDIT:
			if(isDocForceLocked(docLock, DocLock.LOCK_TYPE_FORCE, DocLock.LOCK_STATE_FORCE, login_user, rt))	//检查文件是否上了强制锁（表明当前文件正在删除、写入、移动、复制、重命名）		
			{
				ret = true;
			}
			break;
		case DocLock.LOCK_TYPE_VFORCE:
			if(isDocForceLocked(docLock, DocLock.LOCK_TYPE_VFORCE, DocLock.LOCK_STATE_VFORCE, login_user, rt) || 	//检查文件是否上了强制锁（表明当前文件正在删除、写入、移动、复制、重命名）
					isDocLocked(docLock, DocLock.LOCK_TYPE_VNORMAL, DocLock.LOCK_STATE_VNORMAL, login_user, rt) ||	//检查文件是否上了普通锁
					isDocLocked(docLock, DocLock.LOCK_TYPE_VCOEDIT, DocLock.LOCK_STATE_VCOEDIT, login_user, rt))	//检查文件是否上了协同编辑锁
			{
				ret = true;
			}
			break;
		case DocLock.LOCK_TYPE_VNORMAL:
			if(isDocForceLocked(docLock, DocLock.LOCK_TYPE_VFORCE, DocLock.LOCK_STATE_VFORCE, login_user, rt) || 	//检查文件是否上了强制锁（表明当前文件正在删除、写入、移动、复制、重命名）
					isDocLocked(docLock, DocLock.LOCK_TYPE_VNORMAL, DocLock.LOCK_STATE_VNORMAL, login_user, rt))		//检查文件是否上了普通锁			
			{
				ret = true;
			}
			break;
		case DocLock.LOCK_TYPE_VCOEDIT:
			if(isDocForceLocked(docLock, DocLock.LOCK_TYPE_VFORCE, DocLock.LOCK_STATE_VFORCE, login_user, rt))	//检查文件是否上了强制锁（表明当前文件正在删除、写入、移动、复制、重命名）		
			{
				ret = true;
			}
			break;
		}
		return ret;
	}
	
	public static boolean isDocForceLocked(DocLock docLock, Integer lockType, Integer lockState, User login_user,ReturnAjax rt) {
		if(docLock == null)
		{
			return false;
		}
		
		Integer curLockState = docLock.getState();	
		if((curLockState & lockState) == 0) 
		{
			return false;
		}
		
		if(isLockOutOfDate(docLock.lockTime[lockType]))
		{
			docLock.setState(curLockState & (~lockState)); //锁已过期，删除锁			
			return false;
		}
		
		//FocreLock即使是自己锁定的也不可以解锁
		rt.setError(buildLockFailMsg(docLock, lockType));
		
		long curTime = new Date().getTime();
		String timeStamp = DateFormat.dateTimeFormat(new Date(docLock.createTime[lockType]));
		docSysDebugLog("isDocForceLocked() [" + docLock.getPath() + docLock.getName() +"] 已被 [" + docLock.lockBy[lockType] + " " + docLock.locker[lockType] + "] 在 [" + timeStamp + "] 强制锁定了 " + (curTime - docLock.createTime[lockType]) + " ms, 将于 " + (docLock.lockTime[lockType] - curTime) + " ms 后自动解锁!, lockInfo[" + docLock.info[lockType] + "]", rt);
		return true;	
	}
	
	private static String buildLockFailMsg(DocLock docLock, int lockType) {
		String msg = "文件锁定中，请稍后重试!";
		Integer event = docLock.event[lockType];
		if(event == null)
		{
			String lockTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(docLock.lockTime[lockType]);
			String timeStamp = DateFormat.dateTimeFormat(new Date(docLock.createTime[lockType]));
			msg  = "[" + docLock.getPath() + docLock.getName() +"]已被用户[" + docLock.locker[lockType] + "] 在 [" + timeStamp + "] 强制锁定:" + docLock.info[lockType] + "，自动解锁时间[" + lockTime + "], 如需强制解锁，请联系系统管理员!";
			return msg;
		}
		
		switch(docLock.event[lockType])
		{
		//File Operation
		case EVENT.lockDoc:
			return "用户[" + docLock.locker[lockType] +"]锁定了文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.addDoc:
			return "用户[" + docLock.locker[lockType] +"]正在新增文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.deleteDoc:
			return "用户[" + docLock.locker[lockType] +"]正在删除文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.updateDoc:
			return "用户[" + docLock.locker[lockType] +"]正在保存文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.moveDoc:
			return "用户[" + docLock.locker[lockType] +"]正在移动文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.copyDoc:
			return "用户[" + docLock.locker[lockType] +"]正在复制文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.updateRealDocContent:
			return "用户[" + docLock.locker[lockType] +"]正在编辑文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.updateVirualDocContent:
			return "用户[" + docLock.locker[lockType] +"]正在编辑文件备注[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.copySameDocForUpload:
			return "用户[" + docLock.locker[lockType] +"]正在上传文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.folderUpload:
			return "用户[" + docLock.locker[lockType] +"]正在上传目录[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.revertDoc:
			return "用户[" + docLock.locker[lockType] +"]正在恢复文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";			
		//File Operation EX
		case EVENT.addDocEx:
			return "用户[" + docLock.locker[lockType] +"]正在新增文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";			
		case EVENT.deleteDocEx:
			return "用户[" + docLock.locker[lockType] +"]正在删除文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";			
		case EVENT.updateDocEx:
			return "用户[" + docLock.locker[lockType] +"]正在保存文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";			
		case EVENT.moveDocEx:
			return "用户[" + docLock.locker[lockType] +"]正在移动文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.copyDocEx:
			return "用户[" + docLock.locker[lockType] +"]正在复制文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		//Office
		case EVENT.addUserToEditUsersMap:
			return "用户[" + docLock.locker[lockType] +"]正在编辑文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		//RemoteStorage
		case EVENT.remoteStoragePush:
			return "用户[" + docLock.locker[lockType] +"]正在推送文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.remoteStoragePull:
			return "用户[" + docLock.locker[lockType] +"]正在拉取文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.remoteStorageCheckOut:
			return "用户[" + docLock.locker[lockType] +"]正在检出文件[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		//AutoBackup
		case EVENT.LocalAutoBackup:
			return "用户[" + docLock.locker[lockType] +"]正在本地备份[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		case EVENT.remoteAutoBackup:
			return "用户[" + docLock.locker[lockType] +"]正在远程备份[" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		//ReposSyncup
		case EVENT.syncupLocalChangesEx_FSM:
		case EVENT.syncUpLocalWithRemoteStorage:
		case EVENT.syncupForDocChange_NoFS:
			return "用户[" + docLock.locker[lockType] +"]正在同步仓库[" + docLock.getVid() + "][" + docLock.getPath() + docLock.getName() + "],请稍后重试!";
		}
		
		return msg;
	}

	public static boolean isDocLocked(DocLock docLock, Integer lockType, Integer lockState, User login_user,ReturnAjax rt) {
		if(docLock == null)
		{
			return false;
		}
		
		int curLockState = docLock.getState();	
		if((curLockState & lockState) == 0) 
		{
			return false;
		}
		
		if(isLockOutOfDate(docLock.lockTime[lockType]))
		{
			docLock.setState(curLockState & (~lockState)); //锁已过期，删除锁			
			return false;
		}
		
		Integer lockBy = docLock.lockBy[lockType];
		if(lockBy == null)
		{
			Log.debug("isDocLocked() lockBy is null");
			return false;
		}
		
		if(lockBy.equals(login_user.getId()))
		{
			return false;
		}
			
		rt.setError(buildLockFailMsg(docLock, lockType));

		long curTime = new Date().getTime();
		String timeStamp = DateFormat.dateTimeFormat(new Date(docLock.createTime[lockType]));
		docSysDebugLog("isDocLocked() [" + docLock.getPath() + docLock.getName() +"] 已被 [" + docLock.lockBy[lockType] + " " + docLock.locker[lockType] + "] 在 [" + timeStamp + "] 锁定了 " + (curTime - docLock.createTime[lockType]) + " ms, 将于 " + (docLock.lockTime[lockType] - curTime) + " ms 后自动解锁!, lockInfo[" + docLock.info[lockType] + "]", rt);

		return true;	
	}

	public static boolean isLockOutOfDate(Long lockTime) {
		if(lockTime == null)
		{
			Log.debug("isLockOutOfDate() lockTime is null");
			return true;
		}
		
		//check if the lock was out of date
		long curTime = new Date().getTime();
		if(curTime < lockTime)	//
		{
			return false;
		}

		//Lock 自动失效
		Log.debug("isLockOutOfDate() lock expired curTime:"+curTime+" lockTime:"+lockTime);
		return true;
	}

	//确定parentDoc is Locked
	private boolean isParentDocLocked(Doc doc, User login_user,ReturnAjax rt) 
	{
		Log.printObject("isParentDocLocked() doc:", doc);
		
		if(isReposDocLocksMapEmpty(doc) == true)
		{
			//reposDocLocksMap is empty, so no need to check anymore
			return false;
		}
		
		//Check if the rootDoc locked
		Integer reposId = doc.getVid();
		Doc tempDoc = new Doc();
		tempDoc.setVid(reposId);
		tempDoc.setLocalRootPath(doc.getLocalRootPath());
		tempDoc.setPath("");
		tempDoc.setName("");
		
		DocLock docLock = getDocLock(tempDoc);
		if(isDocForceLocked(docLock, DocLock.LOCK_TYPE_FORCE, DocLock.LOCK_STATE_FORCE, login_user, rt) || 	//检查文件是否上了强制锁（表明当前文件正在删除、写入、移动、复制、重命名）
				isDocLocked(docLock, DocLock.LOCK_TYPE_NORMAL, DocLock.LOCK_STATE_NORMAL, login_user, rt))		//检查文件是否上了普通锁
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
			docLock = getDocLock(tempDoc);
			if(isDocForceLocked(docLock, DocLock.LOCK_TYPE_FORCE, DocLock.LOCK_STATE_FORCE, login_user, rt) || 	//检查文件是否上了强制锁（表明当前文件正在删除、写入、移动、复制、重命名）
					isDocLocked(docLock, DocLock.LOCK_TYPE_NORMAL, DocLock.LOCK_STATE_NORMAL, login_user, rt))		//检查文件是否上了普通锁
			{
				return true;
			}
			path = path + name +"/";
		}
		return false;
	}
	
	//确定parentDoc is Locked
	private boolean isParentDocForceLocked(Doc doc, User login_user,ReturnAjax rt) 
	{
		Log.printObject("isParentDocForceLocked() doc:", doc);

		if(isReposDocLocksMapEmpty(doc) == true)
		{
			//reposDocLocksMap is empty, so no need to check anymore
			return false;
		}
		
		//Check if the rootDoc locked
		Integer reposId = doc.getVid();
		Doc tempDoc = new Doc();
		tempDoc.setVid(reposId);
		tempDoc.setLocalRootPath(doc.getLocalRootPath());
		tempDoc.setPath("");
		tempDoc.setName("");
		DocLock docLock = getDocLock(tempDoc);
		if(isDocForceLocked(docLock, DocLock.LOCK_TYPE_FORCE, DocLock.LOCK_STATE_FORCE, login_user, rt)) 	//检查文件是否上了强制锁（表明当前文件正在删除、写入、移动、复制、重命名）
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
			docLock = getDocLock(tempDoc);
			if(isDocForceLocked(docLock, DocLock.LOCK_TYPE_FORCE, DocLock.LOCK_STATE_FORCE, login_user, rt)) 	//检查文件是否上了强制锁（表明当前文件正在删除、写入、移动、复制、重命名）
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
		Log.printObject("isSubDocLocked() doc:", doc);

		if(redisEn)
		{
			return isSubDocLockedRedis(doc, login_user, rt);
		}
		
		return isSubDocLockedLocal(doc, login_user, rt);
	}

	private boolean isSubDocLockedLocal(Doc doc, User login_user, ReturnAjax rt)
	{
		Log.printObject("isSubDocLockedLocal() doc:", doc);

		ConcurrentHashMap<String, DocLock> reposDocLocskMap = docLocksMap.get(doc.getVid());
		if(reposDocLocskMap == null || reposDocLocskMap.size() == 0)
		{
			return false;
		}
		
		String parentDocPath = doc.getName().isEmpty()? "" :doc.getPath() + doc.getName() + "/";
		//遍历所有docLocks
        Log.debug("isSubDocLockedLocal() reposDocLocskMap size:" + reposDocLocskMap.size());
		Iterator<Entry<String, DocLock>> iterator = reposDocLocskMap.entrySet().iterator();
    	while (iterator.hasNext()) 
        {
        	Entry<String, DocLock> entry = iterator.next();
            if(entry != null)
        	{
            	Log.debug("isSubDocLockedLocal reposDocLocskMap entry:" + entry.getKey());
            	DocLock docLock = entry.getValue();
    			if(isSudDocLock(docLock, parentDocPath))
    			{
    				//检查所有的锁
	            	if(isDocLocked(docLock, DocLock.LOCK_TYPE_FORCE, login_user, rt))
	        		{
	        			Log.debug("isSubDocLockedLocal() " + docLock.getName() + " is locked!");
	        			return true;
	        		}
	            }
        	}
        }
		return false;
	}
	
	private boolean isSubDocLockedRedis(Doc doc, User login_user, ReturnAjax rt)
	{
		Log.printObject("isSubDocLockedRedis() doc:", doc);

		RMap<String, DocLock> reposDocLocskMap = redisClient.getMap("reposDocLocskMap" + doc.getVid());
		if(reposDocLocskMap == null || reposDocLocskMap.size() == 0)
		{
			return false;
		}
		
		String parentDocPath = doc.getName().isEmpty()? "" :doc.getPath() + doc.getName() + "/";
		//遍历所有docLocks
        Log.debug("isSubDocLockedRedis() reposDocLocskMap size:" + reposDocLocskMap.size());
		Iterator<Entry<String, DocLock>> iterator = reposDocLocskMap.entrySet().iterator();
    	while (iterator.hasNext()) 
        {
        	Entry<String, DocLock> entry = iterator.next();
            if(entry != null)
        	{
            	Log.debug("isSubDocLockedRedis reposDocLocskMap entry:" + entry.getKey());
            	DocLock docLock = entry.getValue();
    			if(isSudDocLock(docLock, parentDocPath))
    			{
    				//检查所有的锁
	            	if(isDocLocked(docLock, DocLock.LOCK_TYPE_FORCE, login_user, rt))
	        		{
	        			Log.debug("isSubDocLockedRedis() " + docLock.getName() + " is locked!");
	        			return true;
	        		}
	            }
        	}
        }
		return false;
	}

	private boolean isSudDocLock(DocLock docLock, String parentDocPath) {
		return parentDocPath.length() == 0 || (docLock.getPath().length() >= parentDocPath.length() && docLock.getPath().indexOf(parentDocPath) == 0);
	}

	//Unlock Doc
	protected boolean unlockDoc(Doc doc, Integer lockType, User login_user) 
	{
		DocLock curDocLock = getDocLock(doc);
		if(curDocLock == null)
		{
			Log.debug("unlockDoc() curDocLock is null ");
			return true;
		}
		
		Integer curLockState = curDocLock.getState();
		if(curLockState == 0)
		{
			deleteDocLock(doc);
			Log.debug("unlockDoc() doc was not locked:" + curDocLock.getState());			
			return true;
		}
		
		int lockState = getLockState(lockType);
		Log.debug("unlockDoc() curLockState:" + curLockState + " lockState:" + lockState);
		Integer newLockState = curLockState & (~lockState);
		if(newLockState == 0)
		{
			deleteDocLock(doc);
			Log.debug("unlockDoc() success:[" + doc.getPath() + doc.getName() + "] newLockState:" + newLockState);
			return true;
		}
		
		curDocLock.setState(newLockState);
		updateDocLock(doc, curDocLock);
		Log.debug("unlockDoc() success:[" + doc.getPath() + doc.getName() + "] newLockState:" + newLockState);
		return true;
	}
	
	//*** remoteStorageLocksMap ***	
	protected Object getRemoteStorageSyncLock(String remoteStorage) {
		Object synclock = remoteStorageSyncLockHashMap.get(remoteStorage);
    	if(synclock == null)
    	{
    		Log.debug("getRemoteStorageSyncLock() synclock for " + remoteStorage + " is null, do create");
    		synclock = new Object();
    		remoteStorageSyncLockHashMap.put(remoteStorage, synclock);
    	}
    	return synclock;
	}
    
	//*** syncSourceLocksMap ***
	public static boolean lockSyncSource(
			String sourceName, String lockName, String lockInfo,
			long lockDuration, 	//锁定时长(超过该时长将自动解锁)
			Object synclock, 	//线程锁对象
			int retryCount, int retrySleepTime, //同步锁获取失败的重试次数与重试睡眠时间（如果重试次数设置为0表示取锁失败直接返回）
			User accessUser)
	{
		SyncSourceLock lock = tryLockSyncSource(sourceName, lockName, lockInfo, lockDuration, synclock, retryCount, retrySleepTime, accessUser);
		if(lock != null)
		{
			//Log.info("lockSyncSource() syncSourceLock [" + lockName + "] of [" + sourceName + "] lock success for [" + doc.getPath() + doc.getName() + "]");
			return true;
		}
		
		return false;
	}
	
	private static SyncSourceLock tryLockSyncSource(String sourceName, String lockName, String lockInfo, 
			long lockDuration, Object synclock, int retryCount, int retrySleepTime, 
			User accessUser) 
	{
		//Log.debug("tryLockSyncSource() syncSourceLock [" + lockName + "] of [" + sourceName + "] Start");

		SyncSourceLock newLock = null;
		SyncSourceLock curLock = null;
		
		int count = 0;
		for(;;)
		{
			synchronized(synclock)
			{
				redisSyncLockEx(lockName ,lockInfo);
				
				curLock = getSyncSourceLock(lockName);
				if(curLock == null)
				{
					//Log.debug("tryLockSyncSource() syncSourceLock [" + lockName + "] of [" + sourceName + "] not locked");
					curLock = new SyncSourceLock();
					curLock.state = 1;
					curLock.sourceName = sourceName;
					curLock.name = lockName;
					curLock.lockBy = accessUser.getId();
					curLock.locker = accessUser.getName();
					curLock.createTime = new Date().getTime();
					curLock.lockTime = curLock.createTime + lockDuration;
					curLock.synclock = new SyncLock();
					curLock.server = clusterServerUrl;
					curLock.info = lockInfo;
					addSyncSourceLock(lockName, curLock);
				
					newLock = curLock;
				}
				else
				{
					//check if it is locked
					if(curLock.state == 0)
					{
						//Log.debug("tryLockSyncSource() syncSourceLock [" + lockName + "] of [" + sourceName + "] not locked");
						curLock.state = 1;
						curLock.lockBy = accessUser.getId();
						curLock.locker = accessUser.getName();
						curLock.createTime = new Date().getTime();
						curLock.lockTime = curLock.createTime + lockDuration;
						curLock.server = clusterServerUrl;
						curLock.info = lockInfo;

						newLock = curLock;
						
						updateSyncSourceLock(lockName, curLock);
					}
					else
					{
						long curTime = new Date().getTime();
						if(curLock.lockTime < curTime)
						{
							Log.info("tryLockSyncSource() syncSourceLock [" + curLock.name + "] of [" + curLock.sourceName + "] is expired");
							curLock.state = 1;
							curLock.lockBy = accessUser.getId();
							curLock.locker = accessUser.getName();
							curLock.createTime = new Date().getTime();
							curLock.lockTime = curLock.createTime + lockDuration;
							curLock.server = clusterServerUrl;
							curLock.info = lockInfo;
							
							newLock = curLock;
							updateSyncSourceLock(lockName, curLock);
						}
						else
						{
							String timeStamp = DateFormat.dateTimeFormat(new Date(curLock.createTime));
							String detail = "[" + timeStamp + "] " + curLock.info + "]";
							Log.debug("tryLockSyncSource() syncSourceLock [" + lockName + "] of [" + sourceName + "] state:" + curLock.state + " 详情: " + detail);
							long lockedTime = curTime - curLock.createTime;
							long leftTime = curLock.lockTime - curTime;
							Log.debug( "[" + lockName + "] of [" + sourceName + "]已被 [" + curLock.locker + "] 锁定了 " + lockedTime  + " ms, 将于 " + leftTime + " ms 后自动解锁\n");
						}
					}
				}
				
				redisSyncUnlockEx(lockName, lockInfo, synclock);
			}
		
			if(newLock != null) 
			{
				Log.info("tryLockSyncSource() syncSourceLock [" + lockName + "] of [" + sourceName + "] Lock success");	
				return newLock;
			}
			
			//wait for wake up or timeout
			count++;
			if(count >= retryCount)
			{
				Log.info("tryLockSyncSource() syncSourceLock [" + lockName + "] of [" + sourceName + "] lock failed with max retries:" + retryCount);
				break;
			}
			
			Log.info("tryLockSyncSource() syncSourceLock [" + lockName + "] of [" + sourceName + "] lock failed " + count + " times, sleep " + retrySleepTime + " ms and try again");
			
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

	//unlockSyncSource need not to be executed with synclock, because it is already in thread safe 
	protected static boolean unlockSyncSource(String lockName, User accessUser)
	{
		Log.debug("unlockSyncSource() syncSourceLock [" + lockName + "] Start");
		SyncSourceLock curLock = getSyncSourceLock(lockName);
		if(curLock == null)
		{
			Log.debug("unlockSyncSource() syncSourceLock [" + lockName + "] was not locked");
			return true;
		}
		
		if(curLock.lockBy == null || curLock.lockBy.equals(accessUser.getId()))
		{
			curLock.state = 0;
			updateSyncSourceLock(lockName, curLock);
			
			//wakeup all pendding thread for this lock
			Log.info("unlockSyncSource() syncSourceLock [" + curLock.name + "] of [" + curLock.sourceName + "], wakeup all sleep threads");
			synchronized(curLock.synclock)
			{
				curLock.synclock.notifyAll();
			}
			Log.debug("unlockSyncSource() syncSourceLock [" + curLock.name + "] of [" + curLock.sourceName + "] unlock Success");
			return true;
		}
		
		Log.info("unlockSyncSource() syncSourceLock [" + curLock.name + "] of [" + curLock.sourceName + "] unlock failed (lockBy:" + curLock.lockBy + " unlock user:" + accessUser.getId());
		return false;
	}

	protected static void addSyncSourceLock(String lockName, SyncSourceLock lock) {
		if(redisEn)
		{
			addSyncSourceLockRedis(lockName, lock);
		}
		else
		{
			addSyncSourceLockLocal(lockName, lock);
		}
	}
	
	private static void addSyncSourceLockLocal(String lockName, SyncSourceLock lock) {
		syncSourceLocksMap.put(lockName, lock);
	}
	
	private static void addSyncSourceLockRedis(String lockName, SyncSourceLock lock) {
		RMap<Object, Object>  syncSourceLocksMap = redisClient.getMap("syncSourceLocksMap");
		syncSourceLocksMap.put(lockName, lock);
	}

	protected static void updateSyncSourceLock(String lockName, SyncSourceLock lock) {
		if(redisEn)
		{
			updateSyncSourceLockRedis(lockName, lock);
		}
	}

	private static void updateSyncSourceLockRedis(String lockName, SyncSourceLock lock) {
		RMap<Object, Object>  syncSourceLocksMap = redisClient.getMap("syncSourceLocksMap");
		syncSourceLocksMap.put(lockName, lock);
	}
	
	protected static SyncSourceLock getSyncSourceLock(String lockName) {
		if(redisEn)
		{
			return getSyncSourceLockRedis(lockName);
		}
		
		return getSyncSourceLockLocal(lockName);
	}

	private static SyncSourceLock getSyncSourceLockLocal(String lockName) {
		return syncSourceLocksMap.get(lockName);
	}
	
	private static SyncSourceLock getSyncSourceLockRedis(String lockName) {
		RMap<Object, Object>  syncSourceLocksMap = redisClient.getMap("syncSourceLocksMap");
		return (SyncSourceLock) syncSourceLocksMap.get(lockName);
	}
	
	private static void initSystemLicenseInfo() {
		Log.debug("initSystemLicenseInfo() ");
		//Default systemLicenseInfo
		systemLicenseInfo = new License();
		systemLicenseInfo.type = constants.DocSys_Community_Edition;
		systemLicenseInfo.usersCount = null;	//无限制
		systemLicenseInfo.expireTime = null; //长期有效
		systemLicenseInfo.hasLicense = false;
		systemLicenseInfo.serverSN = serverSN;
	}
	
	protected static void initLdapConfig() {
		Log.debug("initLdapConfig() ");
		//Default LDAPConfig
		systemLdapConfig = new LDAPConfig();
		systemLdapConfig.enabled = false;
		systemLdapConfig.url = "";
		systemLdapConfig.basedn = "";
		String value = ReadProperties.getValue(docSysIniPath + "docSysConfig.properties", "ldapConfig");
		if(value != null)
		{
			applySystemLdapConfig(value);
		}		
	}
		
	protected static void applySystemLdapConfig(String ldapConfig) {
		//UPdate系统ldapConfig
		if(docSysType == constants.DocSys_Enterprise_Edition)
		{
			systemLdapConfig.enabled = true;
		}
		else
		{
			systemLdapConfig.enabled = false;				
		}
		
		String [] configs = ldapConfig.split(";");
		systemLdapConfig.settings = getLDAPSettings(configs);		

		//获取url和basedn
		String ldapConfigUrl = configs[0].trim();
		URLInfo urlInfo = getUrlInfoFromUrl(ldapConfigUrl);
		if(urlInfo == null)
		{
			Log.debug("applySystemLdapConfig() ldapConfigUrl error:" + ldapConfigUrl);
			return;
		}
		
		systemLdapConfig.url = urlInfo.prefix + urlInfo.params[0] + "/";
		systemLdapConfig.basedn = "";
		if(urlInfo.params.length > 1)
		{
			systemLdapConfig.basedn = urlInfo.params[1];	//0保存的是host+port			
		}

		systemLdapConfig.authentication = getLdapAuthentication(systemLdapConfig.settings); //鉴权方式
		systemLdapConfig.authMode = getLdapAuthMode(systemLdapConfig.settings); //密码格式
		systemLdapConfig.loginMode = getLdapLoginMode(systemLdapConfig.settings); //用户属性标识，默认是uid	
		systemLdapConfig.userAccount = getLdapUserAccount(systemLdapConfig.settings); //LDAP鉴权用户（不设置则使用登录用户鉴权）				
		systemLdapConfig.userPassword = getLdapUserPassword(systemLdapConfig.settings);	//LDAP鉴权用户的密码			
		systemLdapConfig.filter = getLdapBaseFilter(systemLdapConfig.settings); //过滤条件
	}

	protected static String getLdapAuthentication(JSONObject ldapSettings) {
		if(ldapSettings == null)
		{
			return "simple";
		}
		
		String authenticationStr = ldapSettings.getString("authentication");
		if(authenticationStr == null || authenticationStr.isEmpty())
		{
			return "simple";
		}
		
		return authenticationStr;
	}

	protected static Integer getLdapAuthMode(JSONObject ldapSettings) {
		if(ldapSettings == null)
		{
			return 0;	//默认不进行密码验证
		}
		
		String authModeStr = ldapSettings.getString("authMode");
		if(authModeStr == null || authModeStr.isEmpty())
		{
			return 0; //默认不进行密码验证
		}
				
		switch(authModeStr.toLowerCase())
		{
		case "0":
		case "none":
		case "disabled":
			return 0;
		case "1":
		case "plain":	
			return 1;
		case "2":
		case "md5":
			return 2;
		}
		
		return 1;
	}
	
	protected static String getLdapLoginMode(JSONObject ldapSettings) {
		if(ldapSettings == null)
		{
			return "uid";	//默认使用uid
		}
		
		String loginMode = ldapSettings.getString("loginMode");
		if(loginMode == null || loginMode.isEmpty())
		{
			return "uid"; //默认使用uid
		}
				
		return loginMode;
	}
	
	protected static String getLdapUserAccount(JSONObject ldapSettings) {
		if(ldapSettings == null)
		{
			return null;
		}
		
		String userAccount = ldapSettings.getString("userAccount");
		if(userAccount == null || userAccount.isEmpty())
		{
			return null;
		}
				
		return userAccount;
	}
	
	protected static String getLdapUserPassword(JSONObject ldapSettings) {
		if(ldapSettings == null)
		{
			return null;
		}
		
		String userPassword = ldapSettings.getString("userPassword");
		if(userPassword == null || userPassword.isEmpty())
		{
			return null;
		}
				
		return userPassword;
	}
	
	protected static String getLdapBaseFilter(JSONObject ldapSettings) {
		if(ldapSettings == null)
		{
			return "(objectClass=*)";
		}
		
		String baseFilter = ldapSettings.getString("filter");
		if(baseFilter == null || baseFilter.isEmpty())
		{
			return "(objectClass=*)";
		}
				
		return baseFilter;
	}

	public static JSONObject getLDAPSettings(String[] configs) {
		if(configs.length < 2)
		{
			return null;
		}
		
		JSONObject settings = new JSONObject();
		for(int i=1; i<configs.length; i++)
		{
			String configStr = configs[i];
			if(!configStr.isEmpty())
			{
				String [] subStr = configStr.split("=");
				if(subStr.length >= 2)
				{
					String key = subStr[0];
					String value = subStr[1];
					if(key.equals("filter") || key.equals("userAccount"))	//将等号补回来
					{
						if(subStr.length > 2)
						{
							for(int j=2; j < subStr.length -1; j++)
							{
								value = value + "=" + subStr[j];
							}
							value = value + "=" + subStr[subStr.length -1];				
						}
					}
					settings.put(key, value);
					Log.debug("getLDAPSettings() " + key + " : " + value);
				}
			}
		}
		return settings;
	}

	protected boolean systemLicenseInfoCheck(ReturnAjax rt) {
		return channel.systemLicenseInfoCheck(rt);
	}

    public static String getServerHost() {
    	String value = ReadProperties.getValue(docSysIniPath + "mxsdoc.conf", "serverHost");
        if(value != null && !value.isEmpty())
        {
        	return value;
        }

        return "http://dw.gofreeteam.com";
    }
    
	private static void initOfficeLicenseInfo() {
		//Default licenseInfo
		officeLicenseInfo = new OfficeLicense();
		officeLicenseInfo.count =  1;
		officeLicenseInfo.type = LICENSE_RESULT.Success;
		officeLicenseInfo.packageType = constants.PACKAGE_TYPE_OS;
		officeLicenseInfo.mode = constants.LICENSE_MODE.None;
		officeLicenseInfo.branding = false;
		officeLicenseInfo.connections = constants.LICENSE_CONNECTIONS;
		officeLicenseInfo.customization = false;
		officeLicenseInfo.light = false;
		officeLicenseInfo.usersCount = 20;
		officeLicenseInfo.usersExpire = constants.LICENSE_EXPIRE_USERS_ONE_DAY;
		officeLicenseInfo.hasLicense = false;
		officeLicenseInfo.plugins= false;
		//licenseInfo.put("buildDate", oBuildDate);		
		//licenseInfo.put("endDate", null);	
	}
	
	private static int initOSType() {
		String OSName = System.getProperty("os.name"); 
		Log.debug("OSName:"+ OSName);
		String os = OSName.toLowerCase();
		OSType = OS.UNKOWN;
		if(os.startsWith("win"))
		{
			OSType = OS.Windows;
		}
		else if(os.startsWith("linux"))
		{
			OSType = OS.Linux;
		}
		else if(os.startsWith("mac"))
		{
			OSType = OS.MacOS;
		}
		return OSType;
	}
	
	protected static boolean isWinOS() {
		return OS.isWinOS(OSType);
	}	
	
	//**** 自动同步配置 *******
	protected static ReposSyncupConfig parseAutoSyncupConfig(Repos repos, String autoSyncup) {
		try {
			//autoSyncup中不允许出现转义字符 \ ,否则会导致JSON解析错误
			if(autoSyncup == null || autoSyncup.isEmpty())
			{
				return null;
			}
			
			autoSyncup = autoSyncup.replace('\\', '/');	
			
			JSONObject jsonObj = JSON.parseObject(autoSyncup);
			if(jsonObj == null)
			{
				return null;
			}
			
			Log.printObject("parseAutoSyncupConfig() ", jsonObj);
			
			VerReposSyncupConfig verReposSyncupConfig = null;
			JSONObject verReposSyncupObj = jsonObj.getJSONObject("verReposSyncupConfig");
			if(verReposSyncupObj != null)
			{
				Log.printObject("parseAutoSyncupConfig() verReposSyncupObj:", verReposSyncupObj);
				verReposSyncupConfig = getVerReposSyncupConfig(repos, verReposSyncupObj);
			}
			
			RemoteStorageSyncupConfig remoteStorageSyncupConfig = null;
			JSONObject remoteStorageSyncupObj = jsonObj.getJSONObject("remoteStorageSyncupConfig");
			if(remoteStorageSyncupObj != null)
			{
				Log.printObject("parseAutoSyncupConfig() remoteStorageSyncupObj:", remoteStorageSyncupObj);
				remoteStorageSyncupConfig = getRemoteStorageSyncupConfig(repos, remoteStorageSyncupObj);
			}
			
			SearchIndexSyncupConfig searchIndexSyncupConfig = null;
			JSONObject searchIndexSyncupObj = jsonObj.getJSONObject("searchIndexSyncupConfig");
			if(searchIndexSyncupObj != null)
			{
				Log.printObject("parseAutoSyncupConfig() searchIndexSyncupObj:", searchIndexSyncupObj);
				searchIndexSyncupConfig = getSearchIndexSyncupConfig(repos, searchIndexSyncupObj);
			}
			
			AutoTaskConfig autoTaskConfig = null;
			JSONObject autoTaskConfigObj = jsonObj.getJSONObject("autoTaskConfig");
			if(autoTaskConfigObj != null)
			{
				Log.printObject("parseAutoSyncupConfig() autoTaskConfigObj:", autoTaskConfigObj);
				autoTaskConfig = getAutoTaskConfig(repos, autoTaskConfigObj);
			}
			
			ReposSyncupConfig syncupConfig = new ReposSyncupConfig();
			syncupConfig.verReposSyncupConfig = verReposSyncupConfig;
			syncupConfig.remoteStorageSyncupConfig = remoteStorageSyncupConfig;
			syncupConfig.searchIndexSyncupConfig = searchIndexSyncupConfig;	
			syncupConfig.autoTaskConfig = autoTaskConfig;
			return syncupConfig;				
		}
		catch(Exception e) {
			errorLog(e);
			return null;
		}
	}	

	private static AutoTaskConfig getAutoTaskConfig(Repos repos, JSONObject autoTaskConfigObj) {
		AutoTaskConfig config = new AutoTaskConfig();
		config.executeTime = autoTaskConfigObj.getInteger("executeTime");
		config.weekDay1 = autoTaskConfigObj.getInteger("weekDay1");
		config.weekDay2 = autoTaskConfigObj.getInteger("weekDay2");
		config.weekDay3 = autoTaskConfigObj.getInteger("weekDay3");
		config.weekDay4 = autoTaskConfigObj.getInteger("weekDay4");
		config.weekDay5 = autoTaskConfigObj.getInteger("weekDay5");
		config.weekDay6 = autoTaskConfigObj.getInteger("weekDay6");
		config.weekDay7 = autoTaskConfigObj.getInteger("weekDay7");

		return config;
	}

	private static VerReposSyncupConfig getVerReposSyncupConfig(Repos repos, JSONObject verReposSyncupObj) {
		VerReposSyncupConfig config = new VerReposSyncupConfig();
		config.autoSyncupEn = verReposSyncupObj.getInteger("autoSyncupEn");
		return config;
	}
	
	private static RemoteStorageSyncupConfig getRemoteStorageSyncupConfig(Repos repos, JSONObject remoteStorageSyncupObj) {
		RemoteStorageSyncupConfig config = new RemoteStorageSyncupConfig();
		config.autoSyncupEn = remoteStorageSyncupObj.getInteger("autoSyncupEn");
		return config;
	}

	private static SearchIndexSyncupConfig getSearchIndexSyncupConfig(Repos repos, JSONObject searchIndexSyncupObj) {
		SearchIndexSyncupConfig config = new SearchIndexSyncupConfig();
		config.autoSyncupEn = searchIndexSyncupObj.getInteger("autoSyncupEn");
		return config;
	}
	
	//**** 自动备份配置 *******
	protected static ReposBackupConfig parseAutoBackupConfig(Repos repos, String autoBackup) {
		try {
			//autoBackup中不允许出现转义字符 \ ,否则会导致JSON解析错误
			if(autoBackup == null || autoBackup.isEmpty())
			{
				return null;
			}
			
			autoBackup = autoBackup.replace('\\', '/');	
			
			JSONObject jsonObj = JSON.parseObject(autoBackup);
			if(jsonObj == null)
			{
				return null;
			}
			
			Log.printObject("parseAutoBackupConfig() ", jsonObj);
			
			BackupConfig localBackupConfig = null;
			JSONObject localBackupObj = jsonObj.getJSONObject("localBackup");
			if(localBackupObj != null)
			{
				Log.printObject("parseAutoBackupConfig() ", localBackupObj);
				localBackupConfig = getLocalBackupConfig(repos, localBackupObj);
			}
			
			
			BackupConfig remoteBackupConfig = null;
			JSONObject remoteBackupObj = jsonObj.getJSONObject("remoteBackup");
			if(remoteBackupObj != null)
			{
				Log.printObject("parseAutoBackupConfig() ", remoteBackupObj);
				remoteBackupConfig = getRemoteBackupConfig(repos, remoteBackupObj);
			}
			
			ReposBackupConfig backupConfig = new ReposBackupConfig();
			backupConfig.localBackupConfig = localBackupConfig;
			backupConfig.remoteBackupConfig = remoteBackupConfig;
			return backupConfig;				
		}
		catch(Exception e) {
			errorLog(e);
			return null;
		}
	}
	
	private static BackupConfig getRemoteBackupConfig(Repos repos, JSONObject remoteBackupObj) {
		String remoteStorageStr = remoteBackupObj.getString("remoteStorage");
		if(remoteStorageStr == null || remoteStorageStr.isEmpty())
		{
			return null;
		}
		
		BackupConfig remoteBackupConfig = new BackupConfig();
		remoteBackupConfig.realTimeBackup = remoteBackupObj.getInteger("realTimeBackup");
		remoteBackupConfig.backupTime = remoteBackupObj.getInteger("backupTime");
		remoteBackupConfig.weekDay1 = remoteBackupObj.getInteger("weekDay1");
		remoteBackupConfig.weekDay2 = remoteBackupObj.getInteger("weekDay2");
		remoteBackupConfig.weekDay3 = remoteBackupObj.getInteger("weekDay3");
		remoteBackupConfig.weekDay4 = remoteBackupObj.getInteger("weekDay4");
		remoteBackupConfig.weekDay5 = remoteBackupObj.getInteger("weekDay5");
		remoteBackupConfig.weekDay6 = remoteBackupObj.getInteger("weekDay6");
		remoteBackupConfig.weekDay7 = remoteBackupObj.getInteger("weekDay7");
		remoteBackupConfig.indexLibBase = Path.getReposIndexLibPath(repos)  + "RemoteBackup/";

		RemoteStorageConfig remote = parseRemoteStorageConfig(repos, remoteStorageStr, "RemoteBackup");
		remoteBackupConfig.remoteStorageConfig = remote;
		if(remote != null)
		{			
			remote.allowedMaxFile =  getAllowedMaxFile(remoteBackupObj.getString("allowedMaxFile"));
			remote.isUnkownFileAllowed =  getIsUnkownFileAllowed(remoteBackupObj.getString("isUnkownFileAllowed"));
			remote.allowedFileTypeHashMap =  getHashMapByListStr(remoteBackupObj.getString("allowedFileTypeList"));
			remote.notAllowedFileTypeHashMap =  getHashMapByListStr(remoteBackupObj.getString("notAllowedFileTypeList"));
			remote.notAllowedFileHashMap =  getHashMapByListStr(remoteBackupObj.getString("notAllowedFileList"));
			
			//忽略列表初始化不在这里哦
			remote.ignoreHashMap = new ConcurrentHashMap<String, Integer>(); 
		}
		return remoteBackupConfig;
	}
	
	private static Long getAllowedMaxFile(String maxFileSizeStr) {
		Log.debug("getAllowedMaxFile() maxFileSizeStr:" + maxFileSizeStr);
		if(maxFileSizeStr == null || maxFileSizeStr.isEmpty())
		{
			return null;
		}
		
		if(maxFileSizeStr.equals("NoLimit"))
		{
			return 0L;
		}
		return Long.parseLong(maxFileSizeStr);
	}
	
	private static Integer getIsUnkownFileAllowed(String settingStr) {
		Log.debug("getIsUnkownFileAllowed() settingStr:" + settingStr);
		if(settingStr == null || settingStr.isEmpty())
		{
			return null;
		}

		int value = Integer.parseInt(settingStr);
		Log.debug("getIsUnkownFileAllowed() value:" + value);
		return value;
	}

	private static ConcurrentHashMap<String, Integer> getHashMapByListStr(String listStr)
	{
		Log.debug("getHashMapByListStr() listStr:" + listStr);
		ConcurrentHashMap<String, Integer> hashMap = null;
		if(listStr != null && listStr.isEmpty() == false)
		{
			String[] subStrs = listStr.split(";");
			if(subStrs.length > 0)
			{
				hashMap = new ConcurrentHashMap<String, Integer>();
				for(int i=0; i<subStrs.length; i++)
				{
					String fileName = subStrs[i].trim();
					if(fileName.isEmpty() == false)
					{
						hashMap.put(fileName, 1);
					}
				}
			}
		}
		return hashMap;
	}

	private static BackupConfig getLocalBackupConfig(Repos repos, JSONObject localBackupObj) {
		String localRootPath = localBackupObj.getString("localRootPath");
		if(localRootPath == null)
		{
			return null;
		}
			
		BackupConfig localBackupConfig = new BackupConfig();
		localBackupConfig.realTimeBackup = localBackupObj.getInteger("realTimeBackup");
		localBackupConfig.backupTime = localBackupObj.getInteger("backupTime");
		localBackupConfig.weekDay1 = localBackupObj.getInteger("weekDay1");
		localBackupConfig.weekDay2 = localBackupObj.getInteger("weekDay2");
		localBackupConfig.weekDay3 = localBackupObj.getInteger("weekDay3");
		localBackupConfig.weekDay4 = localBackupObj.getInteger("weekDay4");
		localBackupConfig.weekDay5 = localBackupObj.getInteger("weekDay5");
		localBackupConfig.weekDay6 = localBackupObj.getInteger("weekDay6");
		localBackupConfig.weekDay7 = localBackupObj.getInteger("weekDay7");
		localBackupConfig.indexLibBase = Path.getReposIndexLibPath(repos) + "LocalBackup/";
		
		RemoteStorageConfig remote = new RemoteStorageConfig();
		remote.protocol = "file";
		remote.rootPath = "";
		remote.FILE = new LocalConfig();
		localRootPath = Path.localDirPathFormat(localRootPath, OSType);
		remote.FILE.localRootPath = localRootPath;
		remote.ignoreHashMap = new ConcurrentHashMap<String, Integer>(); 
		
		localBackupConfig.remoteStorageConfig = remote;	
		return localBackupConfig;
	}

	protected String getBackupIndexLibForVirtualDoc(BackupConfig backupConfig, RemoteStorageConfig remote) {
		if(remote.isVerRepos || backupConfig.fullBackupEn == null || backupConfig.fullBackupEn == 0)
		{
			return backupConfig.indexLibBase + "VDoc";
		}
		
		//全量备份，只要将indexLib置空，就会触发所有文件的备份
		return null;
	}

	protected String getBackupIndexLibForRealDoc(BackupConfig backupConfig, RemoteStorageConfig remote) {
		if(remote.isVerRepos || backupConfig.fullBackupEn == null || backupConfig.fullBackupEn == 0)
		{
			return backupConfig.indexLibBase + "Doc";
		}
		
		//全量备份，只要将indexLib置空，就会触发所有文件的备份
		return null;
	}

	//实时备份没有全量备份
	protected String getRealTimeBackupIndexLibForVirtualDoc(BackupConfig backupConfig, RemoteStorageConfig remote) {
		if(remote.isVerRepos)
		{
			return backupConfig.indexLibBase + "VDoc";
		}
		return backupConfig.indexLibBase + "VDoc-RealTime";
	}

	protected String getRealTimeBackupIndexLibForRealDoc(BackupConfig backupConfig, RemoteStorageConfig remote) {
		if(remote.isVerRepos)
		{
			return backupConfig.indexLibBase + "Doc";
		}
		return backupConfig.indexLibBase + "Doc-RealTime";
	}

	public static String getBackupOffsetPathForRealDoc(Repos repos, RemoteStorageConfig remote, Date date) {
		if(remote.isVerRepos)
		{
			return "Backup/"  + serverIP + "-" + serverMAC + "-" + repos.getId() + "/data/rdata/";			
		}
		
		String backupTime = DateFormat.dateTimeFormat2(date);
		return "Backup/"  + serverIP + "-" + serverMAC + "-" + repos.getId() + "/data-" + backupTime + "/rdata/"; 
	}

	public static String getBackupOffsetPathForVirtualDoc(Repos repos, RemoteStorageConfig remote, Date date) {
		//对于备份服务器是版本仓库，那么备份不按时间存放
		if(remote.isVerRepos)
		{
			return "Backup/"  + serverIP + "-" + serverMAC + "-" + repos.getId() + "/data/vdata/";
		}
		
		String backupTime = DateFormat.dateTimeFormat2(date);
		return "Backup/"  + serverIP + "-" + serverMAC + "-" + repos.getId() + "/data-" + backupTime + "/vdata/"; 
	}

	
	public static String getRealTimeBackupOffsetPathForRealDoc(Repos repos, RemoteStorageConfig remote, Date date) {
		if(remote.isVerRepos)
		{
			return "Backup/" + serverIP + "-" + serverMAC + "-" + repos.getId() + "/data/rdata/";			
		}
		
		//实时备份按日期分目录（并在日期目录下创建目录），避免产生太多目录
		String backupDate = DateFormat.dateFormat1(date); //2021-11-25
		String backupTime = DateFormat.dateTimeFormat2(date); //20211125091005
		return "RealTimeBackup/" + serverIP + "-" + serverMAC + "-" + repos.getId() + "/rdata/" + backupDate + "/" + backupTime + "/"; 
	}

	public static String getRealTimeBackupOffsetPathForVirtualDoc(Repos repos, RemoteStorageConfig remote, Date date) {
		if(remote.isVerRepos)
		{
			return "Backup/" + serverIP + "-" + serverMAC + "-" + repos.getId() + "/data/vdata/";			
		}
		
		//实时备份按日期分目录（并在日期目录下创建目录），避免产生太多目录		
		String backupDate = DateFormat.dateFormat1(date); //2021-11-25
		String backupTime = DateFormat.dateTimeFormat2(date); //9-33-05
		return "RealTimeBackup/"  + serverIP + "-" + serverMAC + "-" + repos.getId() + "/vdata/" + backupDate + "/" + backupTime + "/"; 
	}
	
	protected static boolean isFSM(Repos repos) {
		return repos.getType() < 3;
	}
	
	
	//*** 仓库远程存储配置 **********
	protected static void initReposRemoteStorageConfig(Repos repos, String remoteStorage)
	{
		if(isFSM(repos) == false)
		{
			Log.debug("initReposRemoteStroageConfig() 前置类型仓库不支持远程存储！");
			return;
		}
		
		RemoteStorageConfig remote = parseRemoteStorageConfig(repos, remoteStorage, "RemoteStorage");
		repos.remoteStorageConfig = remote;
		if(remote == null)
		{
			deleteReposRemoteStorageConfig(repos);
		}
		else
		{
			//设置索引库位置
			remote.remoteStorageIndexLib = Path.getReposIndexLibPath(repos) + "RemoteStorage/Doc";
	
			setReposRemoteStorageConfig(repos, remote);
		}
	}
	
	protected static void initReposRemoteStorageConfigEx(Repos repos, String remoteStorage, boolean updateRedis)
	{
		if(isFSM(repos) == false)
		{
			Log.debug("initReposRemoteStorageConfigEx() 前置类型仓库不支持远程存储！");
			return;
		}
		
		RemoteStorageConfig remote = parseRemoteStorageConfig(repos, remoteStorage, "RemoteStorage");
		repos.remoteStorageConfig = remote;
		if(remote == null)
		{
			reposRemoteStorageHashMap.remove(repos.getId());
		}
		else
		{
			//设置索引库位置
			remote.remoteStorageIndexLib = Path.getReposIndexLibPath(repos) + "RemoteStorage/Doc";
			reposRemoteStorageHashMap.put(repos.getId(), remote);
		}
				
		//set digest to redis
		if(updateRedis)
		{
			if(repos.remoteStorageConfig == null)
			{
				deleteReposRemoteStorageConfig(repos);					
			}
			else
			{
				setReposRemoteStorageConfig(repos, remote);
			}
		}
	}
	
	private static String buildRemoteStorageStr(Repos repos) {
		switch(repos.getType())
		{
		case 3: //SVN 前置
		case 4: //GIT 前置
			break;
		default:
			Log.debug("buildRemoteStorageStr() remoteServer not configured");
			return null;
		}
		
		Integer verCtrl = repos.getVerCtrl();
		if(verCtrl == null)
		{
			Log.debug("buildRemoteStorageStr() verCtrl not configured");
			return null;
		}
		
		String verReposURL = null;
		String verReposUserName = "";
		String verReposPwd = "";
		
		if(repos.getIsRemote() != null && repos.getIsRemote() == 1)	//远程仓库
		{
			verReposURL = repos.getSvnPath();
			if(verReposURL == null || verReposURL.isEmpty())
			{
				Log.debug("buildRemoteStorageStr() verReposURL not configured");
				return null;
			}
			verReposUserName = repos.getSvnUser();
			verReposPwd = repos.getSvnPwd();
		}
		else
		{
			String localVerReposPath = repos.getLocalSvnPath();
			if(localVerReposPath == null || localVerReposPath.isEmpty())
			{
				localVerReposPath = repos.getPath() + "DocSysVerReposes/";
			}
			String verReposName = Path.getVerReposName(repos, true);
			verReposURL = "file://" + localVerReposPath + verReposName + "/";
			verReposUserName = "";
			verReposPwd = "";
		}
		
		
		String remoteStorage = null;
		switch(verCtrl)
		{
		case 1:
			remoteStorage = "svn://" + verReposURL + ";userName=" + verReposUserName + ";pwd=" + verReposPwd;
			break;
		case 2:
			remoteStorage = "git://" + verReposURL + ";userName=" + verReposUserName + ";pwd=" + verReposPwd;
			break;
		}
		return remoteStorage;
	}
	
	protected static String buildRemoteStorageStr(RemoteStorageConfig remote) {
		String remoteStorage = null;
		if(remote == null || remote.protocol == null)
		{
			return null;
		}
		
		switch(remote.protocol)
		{
		case "file":
			remoteStorage = buildRemoteStorageStrForDisk(remote);
			break;
		case "mxsdoc":
			remoteStorage = buildRemoteStorageStrForMxsDoc(remote);
			break;
		case "ftp":
			remoteStorage = buildRemoteStorageStrForFtp(remote);
			break;
		case "sftp":
			remoteStorage = buildRemoteStorageStrForSftp(remote);
			break;
		case "smb":
			remoteStorage = buildRemoteStorageStrForSmb(remote);
			break;
		case "git":
			remoteStorage = buildRemoteStorageStrForGit(remote);
			break;
		case "svn":
			remoteStorage = buildRemoteStorageStrForSvn(remote);
			break;
		}
		return remoteStorage;
	}

	protected static RemoteStorageConfig parseRemoteStorageConfig(Repos repos, String remoteStorage, String type) {
		if(remoteStorage == null)
		{
			return null;
		}
		
		if(remoteStorage.equals("none"))
		{
			return null;
		}
		
		String localVerReposPathForGit = getLocalVerReposPathForGit(repos, type);
		
		if(isJsonFormat(remoteStorage))
		{
			return parseRemoteStorageConfigJson(remoteStorage, localVerReposPathForGit);			
		}
		return parseRemoteStorageConfig(remoteStorage, localVerReposPathForGit);
	}
	
	protected static RemoteStorageConfig parseRemoteStorageConfigJson(String remoteStorage,
			String localVerReposPathForGit) {
		
		JSONObject jsonObj = JSON.parseObject(remoteStorage);
		if(jsonObj == null)
		{
			return null;
		}
		
		Log.printObject("parseRemoteStorageConfigJson() ", jsonObj);
		
		String legacyConfigStr = jsonObj.getString("config");
		RemoteStorageConfig remote = parseRemoteStorageConfig(legacyConfigStr, localVerReposPathForGit);	
		if(remote != null)
		{		
			remote.allowedMaxFile =  getAllowedMaxFile(jsonObj.getString("allowedMaxFile"));
			remote.isUnkownFileAllowed =  getIsUnkownFileAllowed(jsonObj.getString("isUnkownFileAllowed"));
			remote.allowedFileTypeHashMap =  getHashMapByListStr(jsonObj.getString("allowedFileTypeList"));
			remote.notAllowedFileTypeHashMap =  getHashMapByListStr(jsonObj.getString("notAllowedFileTypeList"));
			remote.notAllowedFileHashMap =  getHashMapByListStr(jsonObj.getString("notAllowedFileList"));
			
			//忽略列表初始化不在这里哦
			remote.ignoreHashMap = new ConcurrentHashMap<String, Integer>();
		}
		return remote;
	}

	protected static boolean isJsonFormat(String remoteStorage) {
		if(remoteStorage.length() > 0 && remoteStorage.charAt(0) == '{')
		{
			return true;
		}
		return false;
	}

	protected static RemoteStorageConfig parseRemoteStorageConfig(String remoteStorage, String localVerReposPathForGit) {
		if(remoteStorage == null)
		{
			return null;
		}
		
		if(remoteStorage.equals("none"))
		{
			return null;
		}
		
		//格式化远程存储配置
		remoteStorage = remoteStorage.replace('\\','/');
		
		String protocol = null;
		if(remoteStorage.indexOf("sftp://") == 0)
		{
			protocol = "sftp";
		}
		else if(remoteStorage.indexOf("ftp://") == 0)
		{
			protocol = "ftp";
		}
		else if(remoteStorage.indexOf("smb://") == 0)
		{
			protocol = "smb";		
		}
		else if(remoteStorage.indexOf("svn://") == 0) //注意协议后面携带的可以包含任意svn协议路径
		{
			protocol = "svn";
		}
		else if(remoteStorage.indexOf("git://") == 0) //注意协议后面携带的可以包含任意git协议路径
		{
			protocol = "git";
		}
		else if(remoteStorage.indexOf("mxsdoc://") == 0)
		{
			protocol = "mxsdoc";
		}
		else if(remoteStorage.indexOf("file://") == 0)
		{
			protocol = "file";
		}
		
		
		if(protocol == null)
		{
			Log.debug("parseRemoteStorageConfig unknown protocol");
			return null;
		}
		
		switch(protocol)
		{
		case "file":
			return parseRemoteStorageConfigForDisk(remoteStorage);
		case "sftp":
			return parseRemoteStorageConfigForSftp(remoteStorage);
		case "ftp":
			return parseRemoteStorageConfigForFtp(remoteStorage);
		case "smb":
			return parseRemoteStorageConfigForSmb(remoteStorage);
		case "mxsdoc":
			return parseRemoteStorageConfigForMxsDoc(remoteStorage);
		case "svn":
			return parseRemoteStorageConfigForSvn(remoteStorage);
		case "git":
			return parseRemoteStorageConfigForGit(remoteStorage, localVerReposPathForGit);
		}
		return null;
	}

	private static String getLocalVerReposPathForGit(Repos repos, String type)
	{
		//GIT的远程仓库需要本地仓库存放路径（这个仓库放在和版本仓库相同的位置）
		String localGitReposRootPath = repos.getLocalSvnPath(); 
		if(localGitReposRootPath == null || localGitReposRootPath.isEmpty())
		{
			localGitReposRootPath = repos.getPath() + "DocSysVerReposes/";
		}
		localGitReposRootPath = Path.dirPathFormat(localGitReposRootPath);
		String verReposName = null;
		if(type == null)
		{
			verReposName = repos.getId() + "_GIT_RemoteStorage";
		}
		else
		{
			verReposName = repos.getId() + "_GIT_" + type;
		}
		String localVerReposPath = localGitReposRootPath + verReposName + "/";
		return localVerReposPath;
	}
	
	private static String buildRemoteStorageStrForMxsDoc(RemoteStorageConfig remote) {
		String remoteStorage = null;
		if(remote == null || remote.MXSDOC == null)
		{
			return null;
		}
		
		remoteStorage = "mxsdoc://" + remote.MXSDOC.url;
		if(remote.MXSDOC.userName != null)
		{
			remoteStorage += ";userName=" + remote.MXSDOC.userName;
			if(remote.MXSDOC.pwd != null)
			{
				remoteStorage += ";pwd=" + remote.MXSDOC.pwd;
			}
		}
		if(remote.MXSDOC.reposId != null)
		{
			remoteStorage += ";reposId=" + remote.MXSDOC.reposId;
			
		}
		else if(remote.MXSDOC.remoteDirectory != null)
		{
			remoteStorage += ";remoteDirectory=" + remote.MXSDOC.remoteDirectory;				
		}
		if(remote.MXSDOC.authCode != null)
		{
			remoteStorage += ";authCode=" + remote.MXSDOC.authCode;								
		}
		return remoteStorage;
	}
	
	private static RemoteStorageConfig parseRemoteStorageConfigForMxsDoc(String remoteStorage) {
		RemoteStorageConfig remote = new RemoteStorageConfig();
		remote.protocol = "mxsdoc";
		remote.MXSDOC = new MxsDocConfig();
		
		String[] subStrs = remoteStorage.split(";");
		
		String url = subStrs[0];
		parseMxsDocUrl(remote, url.trim());
		
		//Parse sftpConfigs
		if(subStrs.length > 1)
		{
			JSONObject config = new JSONObject();
			for(int i=1; i<subStrs.length; i++)
			{
				String[] param = subStrs[i].split("=");
				if(param.length > 1)
				{
					config.put(param[0].trim(), param[1].trim());
				}
			}
			setRemoteAutoPushPull(remote, config);

			remote.MXSDOC.reposId = config.getInteger("reposId");
			remote.MXSDOC.remoteDirectory = config.getString("remoteDirectory");
			Log.debug("parseRemoteStorageConfigForGit reposId:" + remote.MXSDOC.reposId + " remoteDirectory:" + remote.MXSDOC.remoteDirectory);			

			
			remote.MXSDOC.userName = config.getString("userName");
			remote.MXSDOC.pwd = config.getString("pwd");
			Log.debug("parseRemoteStorageConfigForGit userName:" + remote.MXSDOC.userName + " pwd:" + remote.MXSDOC.pwd + " autoPull:" + remote.autoPull + " rootPath:" + remote.rootPath);
		}
		
		return remote;
	}

	private static void parseMxsDocUrl(RemoteStorageConfig remote, String url) {
		Log.debug("parseMxsDocUrl url:" + url);
		
		String tmpStr = url.substring("mxsdoc://".length());	
		String realUrl = tmpStr;
		remote.MXSDOC.url = realUrl;
		remote.rootPath = "";
	}
	
	private static String buildRemoteStorageStrForGit(RemoteStorageConfig remote) {
		String remoteStorage = null;
		if(remote == null || remote.GIT == null)
		{
			return null;
		}
		
		remoteStorage = "git://" + remote.GIT.url;
			
		if(remote.GIT.userName != null)
		{
			remoteStorage += ";userName=" + remote.GIT.userName;
			if(remote.GIT.pwd != null)
			{
				remoteStorage += ";pwd=" + remote.GIT.pwd;
			}
		}
		
		if(remote.GIT.privateKey != null)		
		{
			remoteStorage += ";privateKey=" + remote.GIT.pwd;
		}
		return remoteStorage;
	}

	private static RemoteStorageConfig parseRemoteStorageConfigForGit(String remoteStorage, String localVerReposPath) {
		RemoteStorageConfig remote = new RemoteStorageConfig();
		remote.protocol = "git";
		remote.isVerRepos = true;
		remote.GIT = new GitConfig();
		
		String[] subStrs = remoteStorage.split(";");
		
		String url = subStrs[0];
		parseGitUrl(remote, url.trim());
		if(remote.GIT.isRemote == 1)
		{
			remote.GIT.localVerReposPath = localVerReposPath;
		}

		//Parse sftpConfigs
		if(subStrs.length > 1)
		{
			JSONObject config = new JSONObject();
			for(int i=1; i<subStrs.length; i++)
			{
				String[] param = subStrs[i].split("=");
				if(param.length > 1)
				{
					config.put(param[0].trim(), param[1].trim());
				}
			}
			setRemoteAutoPushPull(remote, config);

			
			remote.GIT.userName = config.getString("userName");
			remote.GIT.pwd = config.getString("pwd");
			remote.GIT.privateKey = config.getString("privateKey");
			Log.debug("parseRemoteStorageConfigForGit userName:" + remote.GIT.userName + " pwd:" + remote.GIT.pwd 
					+ " privateKey:" + remote.GIT.privateKey 
					+ " autoPull:" + remote.autoPull + " rootPath:" + remote.rootPath);
		}
		
		return remote;
	}

	private static String buildRemoteStorageStrForSvn(RemoteStorageConfig remote) {
		String remoteStorage = null;
		if(remote == null || remote.SVN == null)
		{
			return null;
		}
		
		remoteStorage = "svn://" + remote.SVN.url;
			
		if(remote.SVN.userName != null)
		{
			remoteStorage += ";userName=" + remote.SVN.userName;
			if(remote.SVN.pwd != null)
			{
				remoteStorage += ";pwd=" + remote.SVN.pwd;
			}
		}
		
		return remoteStorage;
	}
	
	private static RemoteStorageConfig parseRemoteStorageConfigForSvn(String remoteStorage) {
		RemoteStorageConfig remote = new RemoteStorageConfig();
		remote.protocol = "svn";
		remote.isVerRepos = true;
		remote.SVN = new SvnConfig();
		
		String[] subStrs = remoteStorage.split(";");
		
		String url = subStrs[0];
		parseSvnUrl(remote, url.trim());

		//Parse sftpConfigs
		if(subStrs.length > 1)
		{
			JSONObject config = new JSONObject();
			for(int i=1; i<subStrs.length; i++)
			{
				String[] param = subStrs[i].split("=");
				if(param.length > 1)
				{
					config.put(param[0].trim(), param[1].trim());
				}
			}
			setRemoteAutoPushPull(remote, config);

			
			remote.SVN.userName = config.getString("userName");
			remote.SVN.pwd = config.getString("pwd");
			
			Log.debug("parseRemoteStorageConfigForSvn userName:" + remote.SVN.userName + " pwd:" + remote.SVN.pwd + " autoPull:" + remote.autoPull + " rootPath:" + remote.rootPath);
		}
		
		return remote;
	}
	
	private static String buildRemoteStorageStrForDisk(RemoteStorageConfig remote) 
	{		
		String remoteStorage = null;
		if(remote == null || remote.FILE == null)
		{
			return null;
		}
		
		remoteStorage = "file://" + remote.FILE.localRootPath;
		return remoteStorage;
	}
	
	private static RemoteStorageConfig parseRemoteStorageConfigForDisk(String remoteStorage) {
		RemoteStorageConfig remote = new RemoteStorageConfig();
		remote.protocol = "file";
		remote.FILE = new LocalConfig();
		remote.FILE.localRootPath = Path.dirPathFormat(remoteStorage.substring("file://".length()));
		return remote;
	}
	
	private static String buildRemoteStorageStrForSftp(RemoteStorageConfig remote) 
	{		
		String remoteStorage = null;
		if(remote == null || remote.SFTP == null)
		{
			return null;
		}
		
		remoteStorage = "sftp://" + remote.SFTP.host;
		if(remote.SFTP.port != null)
		{
			remoteStorage += ":" + remote.SFTP.port;
		}
		
		if(remote.rootPath != null)
		{
			remoteStorage += "/" + remote.rootPath;
		}
		
		if(remote.SFTP.userName != null)
		{
			remoteStorage += ";userName=" + remote.SFTP.userName;
			if(remote.SFTP.pwd != null)
			{
				remoteStorage += ";pwd=" + remote.SFTP.pwd;
			}
		}
		
		return remoteStorage;
	}

	private static RemoteStorageConfig parseRemoteStorageConfigForSftp(String remoteStorage) {
		RemoteStorageConfig remote = new RemoteStorageConfig();
		remote.protocol = "sftp";
		remote.SFTP = new SftpConfig();

		String[] subStrs = remoteStorage.split(";");

		//Parse sftpUrl
		String sftpUrl = subStrs[0];
		parseSftpUrl(remote, sftpUrl.trim());

		//Parse sftpConfigs
		if(subStrs.length > 1)
		{
			JSONObject config = new JSONObject();
			for(int i=1; i<subStrs.length; i++)
			{
				String[] param = subStrs[i].split("=");
				if(param.length > 1)
				{
					config.put(param[0].trim(), param[1].trim());
				}
			}
			setRemoteAutoPushPull(remote, config);

			remote.SFTP.userName = config.getString("userName");
			remote.SFTP.pwd = config.getString("pwd");
			
			Log.debug("parseRemoteStorageConfigForSftp userName:" + remote.SFTP.userName + " pwd:" + remote.SFTP.pwd + " autoPull:" + remote.autoPull);
		}
		
		return remote;
	}
	
	private static String buildRemoteStorageStrForFtp(RemoteStorageConfig remote) {
		String remoteStorage = null;
		if(remote == null || remote.FTP == null)
		{
			return null;
		}
		
		remoteStorage = "ftp://" + remote.FTP.host;
		if(remote.FTP.port != null)
		{
			remoteStorage += ":" + remote.FTP.port;
		}
		
		if(remote.rootPath != null)
		{
			remoteStorage += "/" + remote.rootPath;
		}
		
		if(remote.FTP.userName != null)
		{
			remoteStorage += ";userName=" + remote.FTP.userName;
			if(remote.FTP.pwd != null)
			{
				remoteStorage += ";pwd=" + remote.FTP.pwd;
			}
		}
		
		if(remote.FTP.charset != null)
		{
			remoteStorage += ";charset=" + remote.FTP.charset;
			
		}
		
		if(remote.FTP.isPassive != null)
		{
			remoteStorage += ";isPassive=" + remote.FTP.isPassive;
		}
		
		return remoteStorage;
	}

	private static RemoteStorageConfig parseRemoteStorageConfigForFtp(String remoteStorage) {
		RemoteStorageConfig remote = new RemoteStorageConfig();
		remote.protocol = "ftp";
		remote.FTP = new FtpConfig();

		String[] subStrs = remoteStorage.split(";");

		//Parse sftpUrl
		String ftpUrl = subStrs[0];
		parseFtpUrl(remote, ftpUrl.trim());

		//Parse sftpConfigs
		if(subStrs.length > 1)
		{
			JSONObject config = new JSONObject();
			for(int i=1; i<subStrs.length; i++)
			{
				String[] param = subStrs[i].split("=");
				if(param.length > 1)
				{
					config.put(param[0].trim(), param[1].trim());
				}
			}
			setRemoteAutoPushPull(remote, config);
			
			remote.FTP.userName = config.getString("userName");
			remote.FTP.pwd = config.getString("pwd");
			remote.FTP.charset = config.getString("charset");
			remote.FTP.isPassive = false;
			String isPassive = config.getString("isPassive");
			if(isPassive != null)
			{
				isPassive = isPassive.toLowerCase();
				if(isPassive.equals("true") || isPassive.equals("1"))
				{
					remote.FTP.isPassive = true;					
				}
			}
			
			Log.debug("parseRemoteStorageConfigForFtp userName:" + remote.FTP.userName + " pwd:" + remote.FTP.pwd + " autoPull:" + remote.autoPull);
		}
		
		return remote;
	}
	
	private static String buildRemoteStorageStrForSmb(RemoteStorageConfig remote) {
		String remoteStorage = null;
		if(remote == null || remote.SMB == null)
		{
			return null;
		}
		
		remoteStorage = "smb://" + remote.SMB.host;
		if(remote.SMB.port != null)
		{
			remoteStorage += ":" + remote.SMB.port;
		}
		
		if(remote.rootPath != null)
		{
			remoteStorage += "/" + remote.rootPath;
		}
		
		if(remote.SMB.userDomain != null)
		{
			remoteStorage += ":" + remote.SMB.userDomain;
		}
		
		if(remote.SMB.userName != null)
		{
			remoteStorage += ";userName=" + remote.SMB.userName;
			if(remote.SMB.pwd != null)
			{
				remoteStorage += ";pwd=" + remote.SMB.pwd;
			}
		}
		
		return remoteStorage;
	}
	
	private static RemoteStorageConfig parseRemoteStorageConfigForSmb(String remoteStorage) {
		RemoteStorageConfig remote = new RemoteStorageConfig();
		remote.protocol = "smb";
		remote.SMB = new SmbConfig();

		String[] subStrs = remoteStorage.split(";");

		String smbUrl = subStrs[0];
		parseSmbUrl(remote, smbUrl.trim());

		if(subStrs.length > 1)
		{
			JSONObject config = new JSONObject();
			for(int i=1; i<subStrs.length; i++)
			{
				String[] param = subStrs[i].split("=");
				if(param.length > 1)
				{
					config.put(param[0].trim(), param[1].trim());
				}
			}
			
			setRemoteAutoPushPull(remote, config);
			
			remote.SMB.userDomain = config.getString("userDomain");
			if(remote.SMB.userDomain == null)
			{
				remote.SMB.userDomain = "";
			}

			remote.SMB.userName = config.getString("userName");
			if(remote.SMB.userName == null)
			{
				remote.SMB.userName = "";
			}

			remote.SMB.pwd = config.getString("pwd");
			if(remote.SMB.pwd == null)
			{
				remote.SMB.pwd = "";
			}
			
			Log.debug("parseRemoteStorageConfigForSmb userDomain:" + remote.SMB.userDomain + " userName:" + remote.SMB.userName + " pwd:" + remote.SMB.pwd + " autoPull:" + remote.autoPull);
		}
		
		return remote;
	}
	
	private static void setRemoteAutoPushPull(RemoteStorageConfig remote, JSONObject config) {
		remote.autoPush = config.getInteger("autoPush");
		if(remote.autoPush == null)
		{
			remote.autoPush = 0;
		}
		
		remote.autoPushForce = config.getInteger("autoPushForce");
		if(remote.autoPushForce == null)
		{
			remote.autoPushForce = 0;
		}
		
		remote.autoPull = config.getInteger("autoPull");
		if(remote.autoPull == null)
		{
			remote.autoPull = 0;
		}
		
		remote.autoPullForce = config.getInteger("autoPullForce");
		if(remote.autoPullForce == null)
		{
			remote.autoPullForce = 0;
		}
	}

	
	private static void parseSftpUrl(RemoteStorageConfig remote, String sftpUrl) {
		Log.debug("parseSftpUrl sftpUrl:" + sftpUrl);
		
		String tmpStr = sftpUrl.substring("sftp://".length());
		String subStrs[] = tmpStr.split("/");
		
		String hostWithPort = subStrs[0];
		String rootPath = "";
		if(subStrs.length > 1)
		{
			rootPath = buildRemoteStorageRootPath(subStrs);
		}
		else
		{
			rootPath = "/";
		}
		Log.debug("parseSftpUrl hostWithPort:" + hostWithPort + " rootPath:" + rootPath);
		
		//seperate host with port
		String[] subStrs1 = hostWithPort.split(":");
		String host = subStrs1[0];
		Log.debug("parseSftpUrl host:" + host);

		Integer port = null;
		if(subStrs1.length > 1)
		{
			port = Integer.parseInt(subStrs1[1]);
		}
		if(port == null)
		{
			port = 22;
		}
		Log.debug("parseSftpUrl port:" + port);

		remote.SFTP.host = host;
		remote.SFTP.port = port;
		remote.rootPath = rootPath;
	}
	
	private static void parseFtpUrl(RemoteStorageConfig remote, String ftpUrl) {
		Log.debug("parseFtpUrl ftpUrl:" + ftpUrl);
		
		String tmpStr = ftpUrl.substring("ftp://".length());
		String subStrs[] = tmpStr.split("/");
		
		String hostWithPort = subStrs[0];
		String rootPath = "";
		if(subStrs.length > 1)
		{
			rootPath = buildRemoteStorageRootPath(subStrs);
		}
		else
		{
			rootPath = "/";
		}
		Log.debug("parseFtpUrl hostWithPort:" + hostWithPort + " rootPath:" + rootPath);
		
		//seperate host with port
		String[] subStrs1 = hostWithPort.split(":");
		String host = subStrs1[0];
		Log.debug("parseFtpUrl host:" + host);
		
		Integer port = null;
		if(subStrs1.length > 1)
		{
			port = Integer.parseInt(subStrs1[1]);
			Log.debug("parseFtpUrl port:" + port);
		}
		
		if(port == null)
		{
			port = 21;
		}
		Log.debug("parseFtpUrl port:" + port);
		
		remote.FTP.host = host;
		remote.FTP.port = port;
		remote.rootPath = rootPath;
	}
	

	private static void parseSmbUrl(RemoteStorageConfig remote, String url) {
		Log.debug("parseSmbUrl url:" + url);
		
		String tmpStr = url.substring("smb://".length());
		String subStrs[] = tmpStr.split("/");
		
		String hostWithPort = subStrs[0];
		String rootPath = "";
		if(subStrs.length > 1)
		{
			rootPath = buildRemoteStorageRootPath(subStrs);
		}
		else
		{
			rootPath = "/";
		}
		Log.debug("parseSmbUrl hostWithPort:" + hostWithPort + " rootPath:" + rootPath);
		
		//seperate host with port
		String[] subStrs1 = hostWithPort.split(":");
		String host = subStrs1[0];
		Log.debug("parseSmbUrl host:" + host);
		
		Integer port = null;
		if(subStrs1.length > 1)
		{
			port = Integer.parseInt(subStrs1[1]);
		}
		if(port == null)
		{
			port = 139;
		}
		Log.debug("parseSmbUrl port:" + port);

		remote.SMB.host = host;
		remote.SMB.port = port;
		remote.rootPath = rootPath;
	}
	

	private static void parseGitUrl(RemoteStorageConfig remote, String url) {
		Log.debug("parseGitUrl url:" + url);
		
		String tmpStr = url.substring("git://".length());
		
		String realUrl = tmpStr;
		
		remote.GIT.url = realUrl;
		remote.GIT.isRemote = 1;
		if(realUrl.indexOf("file://") == 0)
		{
			remote.GIT.isRemote = 0;
			remote.GIT.localVerReposPath = Path.dirPathFormat(realUrl.substring("file://".length()));	
		}
		remote.rootPath = "";
	}
	
	private static void parseSvnUrl(RemoteStorageConfig remote, String url) {
		Log.debug("parseSvnUrl url:" + url);
		
		String tmpStr = url.substring("svn://".length());
		
		String realUrl = tmpStr;		
		remote.SVN.url = realUrl;
		remote.rootPath = "";
	}

	private static String buildRemoteStorageRootPath(String[] sftpUrlSubStrs) {
		String rootPath = "";
		for(int i=1; i< sftpUrlSubStrs.length; i++)
		{
			if(!sftpUrlSubStrs[i].isEmpty())
			{
				//Log.println(sftpUrlSubStrs[i]);
				rootPath += "/" + sftpUrlSubStrs[i].trim();
			}
		}
		rootPath += "/";
		return rootPath;
	}
	
	//*** 仓库服务器前置配置 *******
	protected static void initReposRemoteServerConfig(Repos repos, String remoteStorage)
	{
		if(isFSM(repos))
		{
			Log.debug("initReposRemoteServerConfig 非前置类型仓库！");
			return;
		}
		
		RemoteStorageConfig remote = null;
		if(remoteStorage == null || remoteStorage.isEmpty())
		{
			//这部分是用来兼容2.02.15版本之前的SVN前置和GIT前置的
			remoteStorage = buildRemoteStorageStr(repos);
		}	
		
		remote = parseRemoteStorageConfig(repos, remoteStorage, "RemoteServer");
		repos.remoteServerConfig = remote;
		
		if(remote == null)
		{
			deleteReposRemoteServerConfig(repos);
		}
		else
		{	
			//设置索引库位置
			remote.remoteStorageIndexLib = Path.getReposIndexLibPath(repos)  + "RemoteServer/Doc";
			setReposRemoteServerConfig(repos, remote);
		}
	}
	
	protected static void initReposRemoteServerConfigEx(Repos repos, String remoteStorage, boolean updateRedis)
	{
		if(isFSM(repos))
		{
			Log.debug("initReposRemoteServerConfigEx() 非前置类型仓库！");
			return;
		}
		
		RemoteStorageConfig remote = null;
		if(remoteStorage == null || remoteStorage.isEmpty())
		{
			//这部分是用来兼容2.02.15版本之前的SVN前置和GIT前置的
			remoteStorage = buildRemoteStorageStr(repos);
		}	
		
		remote = parseRemoteStorageConfig(repos, remoteStorage, "RemoteServer");
		repos.remoteServerConfig = remote;
		
		if(remote == null)
		{
			reposRemoteServerHashMap.remove(repos.getId());
		}
		else
		{
			//设置索引库位置
			remote.remoteStorageIndexLib = Path.getReposIndexLibPath(repos) + "RemoteServer/Doc";
			reposRemoteServerHashMap.put(repos.getId(), remote);
		}
		
		if(updateRedis)
		{
			if(remote == null)
			{
				deleteReposRemoteServerConfig(repos);
			}
			else
			{
				setReposRemoteServerConfig(repos, remote);
			}
		}
	}
	
	protected boolean setReposRemoteServer(Repos repos, String remoteServer) {
		String reposRemoteServerConfigPath = Path.getReposRemoteServerConfigPath(repos);
		
		if(remoteServer == null || remoteServer.isEmpty())
		{
			return FileUtil.delFile(reposRemoteServerConfigPath + "remoteServer.conf");
		}
		
		return FileUtil.saveDocContentToFile(remoteServer, reposRemoteServerConfigPath, "remoteServer.conf", "UTF-8");
	}
	
	protected String getReposRemoteServer(Repos repos) {
		String configPath = Path.getReposRemoteServerConfigPath(repos);		
		return FileUtil.readDocContentFromFile(configPath, "remoteServer.conf", "UTF-8");
	}
	
	//*** 仓库自动同步配置 *****
	protected void initReposAutoSyncupConfig(Repos repos, String autoSyncup)
	{
		Log.debug("+++++++++ initReposAutoSyncupConfig for repos [" + repos.getName() + "] autoSyncup: " + autoSyncup);
		
		if(isFSM(repos) == false)
		{
			Log.debug("initReposAutoSyncupConfig 前置类型仓库不支持自动同步！");
			return;
		}
		
		ReposSyncupConfig config = parseAutoSyncupConfig(repos, autoSyncup);
		repos.autoSyncupConfig = config;
		Log.printObject("initReposAutoSyncupConfig repos.autoSyncupConfig:", repos.autoSyncupConfig);
		
		if(config == null)
		{
			deleteReposSyncupConfig(repos);
			Log.debug("initReposAutoSyncupConfig 自动同步未设置或者设置错误");
		}
		else
		{			
			setReposSyncupConfig(repos, config);		
		}
		Log.debug("------- initReposAutoSyncupConfig 自动同步配置初始化完成 -------");
	}
	
	protected void initReposAutoSyncupConfigEx(Repos repos, String autoSyncup, boolean updateRedis)
	{
		Log.debug("+++++++ initReposAutoSyncupConfigEx() for repos [" + repos.getName() + "] autoSyncup: " + autoSyncup);
		
		if(isFSM(repos) == false)
		{
			Log.debug("initReposAutoSyncupConfigEx() 前置类型仓库不支持自动同步！");
			return;
		}
		
		ReposSyncupConfig config = parseAutoSyncupConfig(repos, autoSyncup);
		repos.autoSyncupConfig = config;
		Log.printObject("initReposAutoSyncupConfigEx repos.autoSyncupConfig:", repos.autoSyncupConfig);
		
		if(config == null)
		{
			reposSyncupConfigHashMap.remove(repos.getId());
			Log.debug("initReposAutoSyncupConfigEx() 自动同步未设置或者设置错误");
		}
		else
		{
			reposSyncupConfigHashMap.put(repos.getId(), config);	
		}
		
		if(updateRedis)
		{
			if(config == null)
			{
				deleteReposSyncupConfig(repos);
			}
			else
			{				
				setReposSyncupConfig(repos, config);		
			}
		}
		
		Log.debug("------- initReposAutoSyncupConfigEx() 自动同步配置初始化完成 *****");	
	}
	
	protected String getReposAutoSyncup(Repos repos) {
		String reposAutoSyncupConfigPath = Path.getReposAutoSyncupConfigPath(repos);		
		return FileUtil.readDocContentFromFile(reposAutoSyncupConfigPath, "autoSyncup.json", "UTF-8");
	}
	
	//*** 仓库自动备份配置 *****
	protected void initReposAutoBackupConfig(Repos repos, String autoBackup)
	{
		Log.debug("+++++++++ initReposAutoBackupConfig for repos [" + repos.getName() + "] autoBackup: " + autoBackup);
		
		if(isFSM(repos) == false)
		{
			Log.debug("initReposAutoBackupConfig 前置类型仓库不支持自动备份！");
			return;
		}
		
		ReposBackupConfig config = parseAutoBackupConfig(repos, autoBackup);
		repos.autoBackupConfig = config;
		
		if(config == null)
		{
			deleteReposBackupConfig(repos);
			Log.debug("initReposAutoBackupConfig 自动备份未设置或者设置错误");
		}
		else
		{
			//Init LocalBackup ignoreHashMap
			initReposLocalBackupIgnoreHashMap(repos);
			//Init RemoteBackup ignoreHashMap
			initReposRemoteBackupIgnoreHashMap(repos);
			
			setReposBackupConfig(repos, config);		
		}
		Log.debug("------- initReposAutoBackupConfig 自动备份配置初始化完成 -------");
	}
	
	protected void initReposAutoBackupConfigEx(Repos repos, String autoBackup, boolean updateRedis)
	{
		Log.debug("+++++++ initReposAutoBackupConfigEx() for repos [" + repos.getName() + "] autoBackup: " + autoBackup);
		
		if(isFSM(repos) == false)
		{
			Log.debug("initReposAutoBackupConfigEx() 前置类型仓库不支持自动备份！");
			return;
		}
		
		ReposBackupConfig config = parseAutoBackupConfig(repos, autoBackup);
		repos.autoBackupConfig = config;
		
		if(config == null)
		{
			reposBackupConfigHashMap.remove(repos.getId());
			Log.debug("initReposAutoBackupConfigEx() 自动备份未设置或者设置错误");
		}
		else
		{
			//Init LocalBackup ignoreHashMap
			initReposLocalBackupIgnoreHashMap(repos);
			//Init RemoteBackup ignoreHashMap
			initReposRemoteBackupIgnoreHashMap(repos);
			
			reposBackupConfigHashMap.put(repos.getId(), config);	
		}
		
		if(updateRedis)
		{
			if(config == null)
			{
				deleteReposBackupConfig(repos);
			}
			else
			{				
				setReposBackupConfig(repos, config);		
			}
		}
		
		Log.debug("------- initReposAutoBackupConfigEx() 自动备份配置初始化完成 *****");	
	}
	
	private void initReposRemoteBackupIgnoreHashMap(Repos repos) {
		String configPath = Path.getReposRemoteBackupConfigPath(repos);
		
		//root doc
		File dir = new File(configPath);
		checkAndSetRemoteBackupIgnored("/", dir, repos);
	}
	
	private void checkAndSetRemoteBackupIgnored(String entryPath, File file, Repos repos) {
		Log.debug("checkAndSetRemoteBackupIgnored() entryPath:" + entryPath);
	
		if(repos.autoBackupConfig == null || repos.autoBackupConfig.remoteBackupConfig == null)
		{
			Log.debug("checkAndSetRemoteBackupIgnored() remoteBackupConfig is null");	
			return;			
		}
		
		if(file.isFile() == true)
		{
			return;
		}
		
		String ignoreFilePath = file.getAbsolutePath() + "/.ignore";
		Log.debug("checkAndSetRemoteBackupIgnored() ignoreFilePath:" + ignoreFilePath);
		
		File ignoreFile = new File(ignoreFilePath);
		if(ignoreFile.exists() == true)
		{
			Log.debug("checkAndSetRemoteBackupIgnored() RemoteBackup was ignored for [" + entryPath +"]");
			repos.autoBackupConfig.remoteBackupConfig.remoteStorageConfig.ignoreHashMap.put(entryPath, 1);
			return;
		}
		
		File[] list = file.listFiles();
		String parentPath = "/";
		if(!entryPath.equals("/"))
		{
			parentPath = entryPath + "/";
		}
		
		if(list != null)
		{
			for(int i=0; i<list.length; i++)
			{
				File subFile = list[i];
				checkAndSetRemoteBackupIgnored(parentPath + subFile.getName(), subFile, repos);			
			}
		}	
	}

	private void initReposLocalBackupIgnoreHashMap(Repos repos) {
		String configPath = Path.getReposLocalBackupConfigPath(repos);
		
		//root doc
		File dir = new File(configPath);
		checkAndSetLocalBackupIgnored("/", dir, repos);
	}
	
	private void checkAndSetLocalBackupIgnored(String entryPath, File file, Repos repos) {
		Log.debug("checkAndSetLocalBackupIgnored() entryPath:" + entryPath);

		if(repos.autoBackupConfig == null || repos.autoBackupConfig.localBackupConfig == null)
		{
			Log.debug("checkAndSetLocalBackupIgnored() localBackupConfig is null");	
			return;			
		}
		
		if(file.isFile() == true)
		{
			return;
		}
		
		String ignoreFilePath = file.getAbsolutePath() + "/.ignore";
		Log.debug("checkAndSetLocalBackupIgnored() ignoreFilePath:" + ignoreFilePath);
		
		File ignoreFile = new File(ignoreFilePath);
		if(ignoreFile.exists() == true)
		{
			Log.debug("checkAndSetLocalBackupIgnored() LocalBackup was ignored for [" + entryPath +"]");
			repos.autoBackupConfig.localBackupConfig.remoteStorageConfig.ignoreHashMap.put(entryPath, 1);
			return;
		}
		
		File[] list = file.listFiles();
		String parentPath = "/";
		if(!entryPath.equals("/"))
		{
			parentPath = entryPath + "/";
		}
		
		if(list != null)
		{
			for(int i=0; i<list.length; i++)
			{
				File subFile = list[i];
				checkAndSetLocalBackupIgnored(parentPath + subFile.getName(), subFile, repos);			
			}
		}	
	}
	
	protected boolean setReposAutoSyncup(Repos repos, String autoSyncup) {
		String reposAutoSyncupConfigPath = Path.getReposAutoSyncupConfigPath(repos);
		
		if(autoSyncup == null || autoSyncup.isEmpty())
		{
			return FileUtil.delFile(reposAutoSyncupConfigPath + "autoSyncup.json");
		}
		
		return FileUtil.saveDocContentToFile(autoSyncup, reposAutoSyncupConfigPath, "autoSyncup.json", "UTF-8");
	}
	
	protected boolean setReposAutoBackup(Repos repos, String autoBackup) {
		String reposAutoBackupConfigPath = Path.getReposAutoBackupConfigPath(repos);
		
		if(autoBackup == null || autoBackup.isEmpty())
		{
			return FileUtil.delFile(reposAutoBackupConfigPath + "autoBackup.json");
		}
		
		return FileUtil.saveDocContentToFile(autoBackup, reposAutoBackupConfigPath, "autoBackup.json", "UTF-8");
	}
	
	protected String getReposAutoBackup(Repos repos) {
		String reposAutoBackupConfigPath = Path.getReposAutoBackupConfigPath(repos);		
		return FileUtil.readDocContentFromFile(reposAutoBackupConfigPath, "autoBackup.json", "UTF-8");
	}
	
	//*** 仓库全文搜索配置  ***
	protected void initReposTextSearchConfig(Repos repos, String config) {
		Log.debug("initReposTextSearchConfigEx() config:" + config);

		TextSearchConfig textSearchConfig = parseTextSearchConfig(repos, config);
		repos.textSearchConfig = textSearchConfig;

		if(textSearchConfig == null)
		{
			deleteReposTextSearchConfig(repos);
		}
		else
		{
			//Init RealDocTextSearchDisableHashMap
			initRealDocTextSearchDisableHashMap(repos);
			//Init VirtualDocTextSearchDisableHashMap
			initVirtualDocTextSearchDisableHashMap(repos);	
			
			setReposTextSearchConfig(repos, textSearchConfig);
		}
	}
	
	protected void initReposTextSearchConfigEx(Repos repos, String config, boolean updateRedis) {
		Log.debug("initReposTextSearchConfigEx() config:" + config);

		TextSearchConfig textSearchConfig = parseTextSearchConfig(repos, config);
		repos.textSearchConfig = textSearchConfig;
		if(textSearchConfig == null)
		{
			reposTextSearchConfigHashMap.remove(repos.getId());
		}
		else
		{
			//Init RealDocTextSearchDisableHashMap
			initRealDocTextSearchDisableHashMap(repos);
			//Init VirtualDocTextSearchDisableHashMap
			initVirtualDocTextSearchDisableHashMap(repos);	
		
			reposTextSearchConfigHashMap.put(repos.getId(), textSearchConfig);
		}
		
		if(updateRedis)
		{
			if(textSearchConfig == null)
			{
				deleteReposTextSearchConfig(repos);
			}
			else
			{
				setReposTextSearchConfig(repos, textSearchConfig);
			}			
		}
	}
	
	protected static TextSearchConfig parseTextSearchConfig(Repos repos, String config) {
		try {
			//config中不允许出现转义字符 \ ,否则会导致JSON解析错误
			if(config == null || config.isEmpty())
			{
				return null;
			}
			
			config = config.replace('\\', '/');	
			
			JSONObject jsonObj = JSON.parseObject(config);
			if(jsonObj == null)
			{
				return null;
			}
			
			Log.printObject("parseTextSearchConfig() ", jsonObj);
			
			TextSearchConfig textSearchConfig = new TextSearchConfig();
			textSearchConfig.enable = false;
			
			Integer enable = jsonObj.getInteger("enable");
			if(enable != null && enable == 1)
			{
				textSearchConfig.enable = true;
			}
			Log.debug("parseTextSearchConfig textSearchConfig.enable:" + textSearchConfig.enable);
			
			textSearchConfig.realDocTextSearchDisableHashMap = new ConcurrentHashMap<String, Integer>();
			textSearchConfig.virtualDocTextSearchDisablehHashMap = new ConcurrentHashMap<String, Integer>();			
			return textSearchConfig;
		}
		catch(Exception e) {
			errorLog(e);
			return null;
		}
	}
	
	private void initRealDocTextSearchDisableHashMap(Repos repos) {
		String configPath = Path.getReposTextSearchConfigPathForRealDoc(repos);
		
		//root doc
		File dir = new File(configPath);
		checkAndSetRealDocTextSearchIgnored("/", dir, repos);
	}
	
	private void checkAndSetRealDocTextSearchIgnored(String entryPath, File file, Repos repos) {
		Log.debug("checkAndSetRealDocTextSearchIgnored() entryPath:" + entryPath);
	
		if(file.isFile() == true)
		{
			return;
		}
		
		String ignoreFilePath = file.getAbsolutePath() + "/.ignore";
		Log.debug("checkAndSetRealDocTextSearchIgnored() ignoreFilePath:" + ignoreFilePath);
		
		File ignoreFile = new File(ignoreFilePath);
		if(ignoreFile.exists() == true)
		{
			Log.debug("checkAndSetRealDocTextSearchIgnored() RealDoc textSearch was ignored for [" + entryPath +"]");
			repos.textSearchConfig.realDocTextSearchDisableHashMap.put(entryPath, 1);
			return;
		}
		
		File[] list = file.listFiles();
		String parentPath = "/";
		if(!entryPath.equals("/"))
		{
			parentPath = entryPath + "/";
		}
		
		if(list != null)
		{
			for(int i=0; i<list.length; i++)
			{
				File subFile = list[i];
				checkAndSetRealDocTextSearchIgnored(parentPath + subFile.getName(), subFile, repos);			
			}
		}	
	}

	private void initVirtualDocTextSearchDisableHashMap(Repos repos) {
		String configPath = Path.getReposTextSearchConfigPathForRealDoc(repos);
		
		//root doc
		File dir = new File(configPath);
		checkAndSetVirtualDocTextSearchIgnored("/", dir, repos);
	}
	
	private void checkAndSetVirtualDocTextSearchIgnored(String entryPath, File file, Repos repos) {
		Log.debug("checkAndSetVirtualDocTextSearchIgnored() entryPath:" + entryPath);
	
		if(file.isFile() == true)
		{
			return;
		}
		
		String ignoreFilePath = file.getAbsolutePath() + "/.ignore";
		Log.debug("checkAndSetVirtualDocTextSearchIgnored() ignoreFilePath:" + ignoreFilePath);
		
		File ignoreFile = new File(ignoreFilePath);
		if(ignoreFile.exists() == true)
		{
			Log.debug("checkAndSetVirtualDocTextSearchIgnored() VirtualDoc textSearch was ignored for [" + entryPath +"]");
			repos.textSearchConfig.virtualDocTextSearchDisablehHashMap.put(entryPath, 1);
			return;
		}
		
		File[] list = file.listFiles();
		String parentPath = "/";
		if(!entryPath.equals("/"))
		{
			parentPath = entryPath + "/";
		}
		
		if(list != null)
		{
			for(int i=0; i<list.length; i++)
			{
				File subFile = list[i];
				checkAndSetVirtualDocTextSearchIgnored(parentPath + subFile.getName(), subFile, repos);			
			}
		}	
	}
	
	protected String getReposTextSearch(Repos repos) {
		String configPath = Path.getReposTextSearchConfigPath(repos);		
		String textSearch =  FileUtil.readDocContentFromFile(configPath, "textSearch.conf", "UTF-8");
		if(textSearch == null || textSearch.isEmpty())
		{
			//兼容2.02.33以前的版本（使用docId作为关闭标记）
			String reposRealDocTextSearchConfigPath = Path.getReposTextSearchConfigPathForRealDoc(repos);
			String disableRealDocTextSearchFileName = "0";
			if(FileUtil.isFileExist(reposRealDocTextSearchConfigPath + disableRealDocTextSearchFileName) == false)
			{
				textSearch = "{enable:1}";
			}
			else
			{
				textSearch = "{enable:0}";
			}
			FileUtil.saveDocContentToFile(textSearch, configPath, "textSearch.conf", "UTF-8");
		}
		return textSearch;		
	}
	
	//*** 仓库回收站配置  ***
	protected void initReposRecycleBinConfig(Repos repos, String config) {
		Log.debug("initReposRecycleBinConfig() config:" + config);

		RecycleBinConfig recycleBinConfig = parseRecycleBinConfig(repos, config);
		repos.recycleBinConfig = recycleBinConfig;

		if(recycleBinConfig == null)
		{
			deleteReposRecycleBinConfig(repos);
		}
		else
		{
			setReposRecycleBinConfig(repos, recycleBinConfig);
		}
	}
	
	protected void initReposRecycleBinConfigEx(Repos repos, String config, boolean updateRedis) {
		Log.debug("initReposRecycleBinConfigEx() config:" + config);

		RecycleBinConfig recycleBinConfig = parseRecycleBinConfig(repos, config);
		repos.recycleBinConfig = recycleBinConfig;
		if(recycleBinConfig == null)
		{
			reposRecycleBinConfigHashMap.remove(repos.getId());
		}
		else
		{
			reposRecycleBinConfigHashMap.put(repos.getId(), recycleBinConfig);
		}
		
		if(updateRedis)
		{
			if(recycleBinConfig == null)
			{
				deleteReposRecycleBinConfig(repos);
			}
			else
			{
				setReposRecycleBinConfig(repos, recycleBinConfig);
			}			
		}
	}
	
	protected static RecycleBinConfig parseRecycleBinConfig(Repos repos, String config) {
		try {
			//config中不允许出现转义字符 \ ,否则会导致JSON解析错误
			if(config == null || config.isEmpty())
			{
				return null;
			}
			
			config = config.replace('\\', '/');	
			
			JSONObject jsonObj = JSON.parseObject(config);
			if(jsonObj == null)
			{
				return null;
			}
			
			Log.printObject("parseRecycleBinConfig() ", jsonObj);
			
			RecycleBinConfig recycleBinConfig = new RecycleBinConfig();
			recycleBinConfig.enable = false;
			
			Integer enable = jsonObj.getInteger("enable");
			if(enable != null && enable == 1)
			{
				recycleBinConfig.enable = true;
			}
			Log.debug("parseRecycleBinConfig recycleBinConfig.enable:" + recycleBinConfig.enable);
			
			return recycleBinConfig;
		}
		catch(Exception e) {
			errorLog(e);
			return null;
		}
	}
	
	protected String getReposRecycleBin(Repos repos) {
		String configPath = Path.getReposRecycleBinConfigPath(repos);		
		String recycleBin =  FileUtil.readDocContentFromFile(configPath, "recycleBin.conf", "UTF-8");
		if(recycleBin == null || recycleBin.isEmpty())
		{
			recycleBin = "{enable:0}";
		}
		return recycleBin;		
	}
	
	//*** 仓库版本忽略配置 ***
	protected void initReposVersionIgnoreConfig(Repos repos) {
		//add VersionIgnoreConfig For repos
		VersionIgnoreConfig versionIgnoreConfig = new VersionIgnoreConfig();
		versionIgnoreConfig.versionIgnoreHashMap = new ConcurrentHashMap<String, Integer>(); 
		
		//set to repos 
		repos.versionIgnoreConfig = versionIgnoreConfig;
		
		initReposVersionIgnoreHashMap(repos);
		
		setReposVersionIgnoreConfig(repos, versionIgnoreConfig);
	}
	
	protected void initReposVersionIgnoreConfigEx(Repos repos, boolean updateRedis) {		
		VersionIgnoreConfig versionIgnoreConfig = new VersionIgnoreConfig();
		versionIgnoreConfig.versionIgnoreHashMap = new ConcurrentHashMap<String, Integer>(); 
		
		//set to repos 
		repos.versionIgnoreConfig = versionIgnoreConfig;
		initReposVersionIgnoreHashMap(repos);
		
		reposVersionIgnoreConfigHashMap.put(repos.getId(), repos.versionIgnoreConfig);	
		
		if(updateRedis)
		{
			setReposVersionIgnoreConfig(repos, versionIgnoreConfig);
		}
	}
	
	private void initReposVersionIgnoreHashMap(Repos repos) {
		String reposTextSearchConfigPath = Path.getReposVersionIgnoreConfigPath(repos);
		
		//root doc
		File dir = new File(reposTextSearchConfigPath);
		checkAndSetVersionIgnored("/", dir, repos);
	}
	
	private void checkAndSetVersionIgnored(String entryPath, File file, Repos repos) {
		Log.debug("checkAndSetVersionIgnored() entryPath:" + entryPath);
		//文件忽略
		if(file.isFile() == true)
		{
			return;
		}
		
		String ignoreFilePath = file.getAbsolutePath() + "/.ignore";
		Log.debug("checkAndSetVersionIgnored() ignoreFilePath:" + ignoreFilePath);
		
		File ignoreFile = new File(ignoreFilePath);
		if(ignoreFile.exists() == true)
		{
			Log.debug("checkAndSetVersionIgnored() version was ignored for [" + entryPath +"]");
			repos.versionIgnoreConfig.versionIgnoreHashMap.put(entryPath, 1);
			return;
		}
		
		File[] list = file.listFiles();
		String parentPath = "/";
		if(!entryPath.equals("/"))
		{
			parentPath = entryPath + "/";
		}
		
		if(list != null)
		{
			for(int i=0; i<list.length; i++)
			{
				File subFile = list[i];
				checkAndSetVersionIgnored(parentPath + subFile.getName(), subFile, repos);			
			}
		}	
	}
	
	//*** 仓库加密配置 ****
	protected void initReposEncryptConfig(Repos repos) {
		EncryptConfig config = parseReposEncryptConfig(repos);
		if(config == null)
		{
			deleteReposEncryptConfig(repos);
		}
		else
		{
			setReposEncryptConfig(repos, config);
		}
	}
	
	protected void initReposEncryptConfigEx(Repos repos, boolean updateRedis) {		
		EncryptConfig config = parseReposEncryptConfig(repos);
		repos.encryptConfig = config;
		if(config == null)
		{
			reposEncryptConfigHashMap.remove(repos.getId());
		}
		else
		{
			reposEncryptConfigHashMap.put(repos.getId(), config);
		}
		
		if(updateRedis)
		{
			if(config == null)
			{
				deleteReposEncryptConfig(repos);
			}
			else
			{
				setReposEncryptConfig(repos, config);
			}
		}
	}
	
	protected EncryptConfig parseReposEncryptConfig(Repos repos) {
		String path = Path.getReposEncryptConfigPath(repos);
		String name = Path.getReposEncryptConfigFileName();
			
		EncryptConfig config = new EncryptConfig();
		String jsonStr = FileUtil.readDocContentFromFile(path, name, "UTF-8");
		if(jsonStr != null && !jsonStr.isEmpty())
		{
			JSONObject json = JSON.parseObject(jsonStr);
			config.type = json.getInteger("type");
			if(config.type == null)
			{
				return null;
			}
			config.key = json.getString("key");
			if(config.key == null)
			{
				return null;
			}
			
			Integer firstBlockSize = json.getInteger("firstBlockSize");
			if(firstBlockSize != null)
			{
				config.firstBlockSize = firstBlockSize;
			}		
			
			Integer blockSize = json.getInteger("blockSize");
			if(blockSize != null)
			{
				config.blockSize = blockSize; //default block size
			}			
			
			Integer skipSize = json.getInteger("skipSize");
			if(skipSize != null)
			{
				config.skipSize = skipSize;
			}	
			Integer maxSize = json.getInteger("maxSize");
			if(maxSize != null)
			{
				config.maxSize = maxSize;	//默认最大加密100M
			}	
			return config;
		}
		return null;
	}
	
	protected boolean removeReposEncryptConfig(Repos repos)
	{
		String path = Path.getReposEncryptConfigPath(repos);
		String name = Path.getReposEncryptConfigFileName();
		File file = new File(path, name);
		if(file.exists() == false)
		{
			return true;
		}
		
		return FileUtil.moveFileOrDir(path, name, path, "old" + name, true);
	}
	
	protected EncryptConfig recoverReposEncryptConfig(Repos repos) 
	{
		String path = Path.getReposEncryptConfigPath(repos);
		String name = Path.getReposEncryptConfigFileName();
		File file = new File(path, "old" + name);
		if(file.exists() == false)
		{
			Log.info("recoverReposEncryptConfig() there is no old config:" + path + "old" + name);
			return null;
		}
		if(FileUtil.moveFileOrDir(path, "old" + name, path, name, true) == false)
		{
			Log.info("recoverReposEncryptConfig() move config failed, from " + path + "old" + name + " to " + path + name);
			return null;
		}
		
		return parseReposEncryptConfig(repos);
	}
	
	protected EncryptConfig generateReposEncryptConfig(Repos repos, Integer encryptType) {
		EncryptConfig config = null;
		
		String path = Path.getReposEncryptConfigPath(repos);
		String name = Path.getReposEncryptConfigFileName();
		File file = new File(path, name);
		if(file.exists() == false)
		{
			//Try to recover the file
			config = recoverReposEncryptConfig(repos);
		}
		if(config != null)
		{
			return config;
		}
		
		//重新生成		
		config = new EncryptConfig();
		config.type = encryptType;
		config.key = DES.getKey();
		//config.firstBlockSize = 1024; 
		//config.blockSize = 1024;
		//config.maxSize = 100*1024*1024;
		//config.skipSize = 4096;
		
		//Save Config
		String jsonStr = JSON.toJSONString(config);
		if(FileUtil.saveDocContentToFile(jsonStr, path, name, "UTF-8") == false)
    	{
    		Log.info("generateReposEncryptConfig() 密钥保存失败");
    		return null;
    	}
		return config;
	}
	
	//*** uniqueActionHashMap
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
			//Log.debug("insertUniqueCommonAction create uniqueAction for repos:" + reposId);
			UniqueAction newUniqueAction = new UniqueAction();
			uniqueActionHashMap.put(reposId, newUniqueAction);
			uniqueAction = newUniqueAction;
		}
		
		ConcurrentHashMap<String, CommonAction> uniqueCommonActionHashMap = uniqueAction.getUniqueCommonActionHashMap();
		List<CommonAction> uniqueCommonActionList = uniqueAction.getUniqueCommonActionList();		

		//Log.debug("insertUniqueCommonAction actionType:" + action.getAction() + " docType:" + action.getDocType() + " actionId:" + action.getType() + " doc:"+ srcDoc.getDocId() + " " + srcDoc.getPath() + srcDoc.getName());
		String uniqueActionId = getUniqueActionId(action);
		CommonAction tempAction = uniqueCommonActionHashMap.get(uniqueActionId);
		//if(tempAction != null && tempAction.getType() == action.getType() && tempAction.getAction() == action.getAction() && tempAction.getDocType() == action.getDocType())
		if(tempAction != null)
		{
			Log.info("insertUniqueCommonAction action uniqueActionId:" + uniqueActionId + " doc:"+ srcDoc.getDocId() + " [" + srcDoc.getPath() + srcDoc.getName() + "] alreay in uniqueActionList");
			return false;
		}
		
		uniqueCommonActionHashMap.put(uniqueActionId, action);
		uniqueCommonActionList.add(action);
		Log.info("insertUniqueCommonAction action uniqueActionId:" + uniqueActionId + " doc:"+ srcDoc.getDocId() + " [" + srcDoc.getPath() + srcDoc.getName() + "]");
		return true;
	}
	
	protected String getUniqueActionId(CommonAction action) {
		Doc srcDoc = action.getDoc();
		String uniqueActionId = srcDoc.getDocId() + "-" + action.getType() + "-" + action.getAction() + "-" + action.getDocType();
		Log.debug("getUniqueActionId uniqueActionId:" + uniqueActionId);
		return uniqueActionId;
	}

	//注意：该接口和DocUtil中的buildBasicDoc是一样的，在这里定义是因为自动备份线程调用DocUtil类时
	public static Doc buildBasicDocBase(Integer reposId, Long docId, Long pid, String reposPath, String path, String name, 
			Integer level, Integer type, boolean isRealDoc, String localRootPath, String localVRootPath, Long size, String checkSum) 
	{
		//Format path and name
		if(reposPath == null)
		{
			reposPath = "";
		}
		
		if(path == null)
		{
			path = "";
		}
		if(name == null)
		{
			name = "";
		}
		
		//To support user call the interface by entryPath
		String[] temp = new String[2]; 
		if(name.isEmpty())
		{
			if(!path.isEmpty())
			{
				level = Path.seperatePathAndName(path, temp);
				path = temp[0];
				name = temp[1];			
			}
			else	//rootDoc
			{
				level = -1;
				docId = 0L;
				pid = -1L;				
			}
		}
		else
		{
			if(level == null)
			{
				//防止使用相对路径进行非法注入
				level = Path.seperatePathAndName(path + "/" + name, temp);
				path = temp[0];
				name = temp[1];	
			}
		}
		
		if(level == -2)
		{
			return null;
		}
		
		Doc doc = new Doc();
		doc.setVid(reposId);
		doc.setReposPath(reposPath);
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
				docId = Path.buildDocIdByName(level, path, name);
			}
			
			if(pid == null)
			{
				if(path.isEmpty())
				{
					pid = 0L;
				}
				else
				{
					pid = Path.buildDocIdByName(level-1, path, "");
				}
			}
		}

		doc.setDocId(docId);
		doc.setPid(pid);
		return doc;
	}
	
	public static Doc buildBasicDoc(Integer reposId, Long docId, Long pid, String reposPath, String path, String name, Integer level, Integer type, boolean isRealDoc, String localRootPath, String localVRootPath, Long size, String checkSum) 
	{
		Doc doc = buildBasicDocBase(reposId, docId, pid, reposPath, path, name, level, type, isRealDoc, localRootPath, localVRootPath, size, checkSum);
		doc.isBussiness = systemLicenseInfo.hasLicense;
		doc.officeType = officeType;
		return doc;
	}
	
	public static Doc buildBasicDoc(Integer reposId, Long docId, Long pid, String reposPath, String path, String name, Integer level, Integer type, boolean isRealDoc, String localRootPath, String localVRootPath, Long size, String checkSum, Doc docInfo) 
	{
		Doc doc = buildBasicDocBase(reposId, docId, pid, reposPath, path, name, level, type, isRealDoc, localRootPath, localVRootPath, size, checkSum);
		doc.isBussiness = systemLicenseInfo.hasLicense;
		doc.officeType = officeType;
		if(docInfo != null)
		{
			doc.rebasePath = docInfo.rebasePath;
			doc.offsetPath = docInfo.offsetPath;			
		}		
		return doc;
	}
	
	protected Doc buildRootDoc(Repos repos, String localRootPath, String localVRootPath) 
	{
		//String localRootPath = getReposRealPath(repos);
		//String localVRootPath = getReposVirtualPath(repos);
		return buildBasicDoc(repos.getId(), 0L, -1L, repos.getPath() + repos.getId() + "/", "", "", 0, 2, true, localRootPath, localVRootPath, null, null);
	}
	
	//VirtualDoc 的vid docId pid level都是和RealDoc一样的
	protected Doc buildVDoc(Doc doc) 
	{
		if(doc.getIsRealDoc())
		{
			Doc vDoc = buildBasicDoc(doc.getVid(), doc.getDocId(), doc.getPid(), "", "", Path.getVDocName(doc), 0, 2, false, doc.getLocalVRootPath(), doc.getLocalVRootPath(), null, null); 
			vDoc.setContent(doc.getContent());
			return vDoc;
		}
		
		Log.debug("buildVDoc() doc already is VDoc");
		return doc;
	}
	
	protected static String getSubDocParentPath(Doc doc) {
		if(doc.getName().isEmpty())
		{
			return doc.getPath();
		}
		return doc.getPath() + doc.getName() + "/";
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
			errorLog("BaseController>writeJson  ERROR!");
			errorLog(e);
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
			errorLog("BaseController>writeJson  ERROR!");
			errorLog(e);
		}
		
	}
	
	/**
	 * 向页面返回Html信息
	 * @param obj
	 * @param response
	 */

	protected void writeHtml(String html,HttpServletResponse response) {

		try {
			response.setCharacterEncoding("UTF-8");
			PrintWriter pw = response.getWriter();
			response.setContentType("text/html;charset=UTF-8");
			pw.write(html);
			pw.flush();
			pw.close();
		} catch (IOException e) {
			errorLog("BaseController>writeJson  ERROR!");
			errorLog(e);
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
							Log.debug("sortType:" + sortType);
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
							Log.debug("sortStr:" + sortStr);
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
	
	/****************************** 文件操作相关接口 ***********************************/	

    //将dstDirPath同步成srcDirPath
	protected boolean syncUpFolder(String srcParentPath,String srcName, String dstParentPath, String dstName,boolean modifyEnable) 
	{
		String srcPath =  srcParentPath + srcName;
		String dstPath =  dstParentPath + dstName;
		
		//If the dstDirPath 不存在则，直接复制整个目录
		File dstFolder = new File(dstPath);
		if(!dstFolder.exists())
		{
			return FileUtil.copyDir(srcPath,dstPath,true);
		}
	
		if(dstFolder.isFile())
		{
			Log.debug(dstPath + " 不是目录！");
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
			errorLog("syncUpFolder() Exception!");
			errorLog(e);
			return false;
		}
		return true;
	}
    
    private void syncUpForAdd(String srcParentPath,String srcName, String dstParentPath, String dstName) throws IOException {
    	Log.debug("syncUpForAddAndModify() srcParentPath:" + srcParentPath + " srcName:" + srcName + " dstParentPath:" + dstParentPath + " dstName:" + dstName );
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
        			FileUtil.copyFile(srcPath,dstPath,false);
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
    	Log.debug("syncUpForAddAndModify() srcParentPath:" + srcParentPath + " srcName:" + srcName + " dstParentPath:" + dstParentPath + " dstName:" + dstName );
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
        			FileUtil.copyFile(srcPath,dstPath,false);
        		}
        	}
        	else
        	{
        		if(srcFile.isFile())
        		{
        			FileUtil.copyFile(srcPath,dstPath,true);
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
    	Log.debug("syncUpForDelete() srcParentPath:" + srcParentPath + " srcName:" + srcName + " dstParentPath:" + dstParentPath + " dstName:" + dstName );
    	String srcPath = srcParentPath + srcName;
    	String dstPath = dstParentPath + dstName;
    	
    	File srcFile = new File(srcPath);
    	File dstFile = new File(dstPath);
        if(dstFile.exists())
        {
        	if(!srcFile.exists())
        	{
        		FileUtil.delDir(dstPath);	//删除目录或文件
        		return;
        	}
        	else
        	{
        		if(dstFile.isDirectory() != srcFile.isDirectory())	//类型不同
        		{
        			FileUtil.delDir(dstPath); //删除目录或文件
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
	
	/****************** 线程锁接口 *********************************************/
	//syncLock只用于lockDoc、checkDocLocked接口的同步执行，不能用于其他用途
	protected static final Object syncLock = new Object(); //For Doc
	//syncLockForRepos只用于新建仓库的同步执行，要保证每个仓库都有唯一的ID
	protected static final Object syncLockForRepos = new Object(); //For Repos (add/update)
	//syncLockForSystemLo用于保证系统日志的顺序写入
	protected static final Object syncLockForSystemLog = new Object(); //For SystemLog
	
	/****************** 路径相关的接口 *****************************************/
	//WebTmpPath was accessable for web
	protected String getWebUserTmpPath(User login_user) {
        String webUserTmpPath =  docSysWebPath +  "tmp/" + login_user.getId() + "/";
        Log.debug("getWebUserTmpPath() webUserTmpPath:" + webUserTmpPath);
		return webUserTmpPath;
	}

	protected String getWebUserTmpPath(User login_user, boolean autoCreate) {
        String webUserTmpPath =  docSysWebPath +  "tmp/" + login_user.getId() + "/";
        Log.debug("getWebUserTmpPath() webUserTmpPath:" + webUserTmpPath);
		if(autoCreate == true)
		{
			File dir = new File(webUserTmpPath);
			if(!dir.exists())
			{
				dir.mkdirs();
			}
		}
        return webUserTmpPath;
	}
	
	//WebTmpPath was 
	protected String getWebUploadPath() {
		String webTmpPath =  docSysWebPath +  "uploads/";
	    Log.debug("getWebUploadPath() webTmpPath:" + webTmpPath);
		return webTmpPath;
	}
	
	//WebTmpPath was 
	protected String getWebTmpPath() {
        String webTmpPath =  docSysWebPath +  "tmp/";
        Log.debug("getWebTmpPath() webTmpPath:" + webTmpPath);
		return webTmpPath;
	}
	
	protected String getWebTmpPathForPreview() {
        String webTmpPath =  docSysWebPath +  "tmp/preview/";
        Log.debug("getWebTmpPathForPreview() webTmpPath:" + webTmpPath);
		return webTmpPath;
	}
	
	protected static String getLicensePath() {
		return docSysIniPath + "license/";
	}
	
	//获取JavaHome
    public String getJavaHome() {
    	String path = null;
        path = ReadProperties.read("docSysConfig.properties", "javaHome");
        if(path != null && !path.isEmpty())
        {
        	return Path.localDirPathFormat(path, OSType);
        }
        
        //tomcat目录
        path = Path.getParentPath(docSysWebPath, 2, OSType) + "Java/jdk/";
        return path;
    }
    
	
	//获取Tomcat的安装路径
    public String getTomcatPath() {
    	//get Tomcat Path From Config File
    	String path = null;
        path = ReadProperties.read("docSysConfig.properties", "tomcatPath");
        if(path != null && !path.isEmpty())
        {
        	return Path.localDirPathFormat(path, OSType);
        }

        //tomcat目录
        path = Path.getParentPath(docSysWebPath, 2, OSType);
        return path;
    }
    
    //获取LDAP设置
	protected static String getLdapConfig() {
    	String ldapConfig = null;
    	ldapConfig = ReadProperties.read("docSysConfig.properties", "ldapConfig");
        if(ldapConfig != null && !ldapConfig.isEmpty())
        {
        	return ldapConfig;
        }

		return null;
	}

	protected Integer getMaxThreadCount() {
    	String maxThreadCountStr = null;
    	maxThreadCountStr = ReadProperties.read("docSysConfig.properties", "maxThreadCount");
        Log.debug("getMaxThreadCount() maxThreadCountStr:" + maxThreadCountStr);
    	if(maxThreadCountStr == null || maxThreadCountStr.isEmpty())
        {
        	return 1;
        }
        
        Integer maxThreadCount = null;
        try {
        	maxThreadCount = Integer.parseInt(maxThreadCountStr);
        } catch (Exception e) {
        	errorLog("getMaxThreadCount() 异常");
        	errorLog(e);
        }
        
        Log.debug("getMaxThreadCount() maxThreadCount:" + maxThreadCount);    	
        if(maxThreadCount == null)
        {
        	maxThreadCount = 1;
        }
		return maxThreadCount;
	}
	
	protected static String getRedisUrl() {
    	String redisUrl = null;
    	redisUrl = ReadProperties.read("docSysConfig.properties", "redisUrl");
        if(redisUrl != null && !redisUrl.isEmpty())
        {
        	return redisUrl;
        }

		return null;
	}
	
	protected static String getClusterServerUrl() {
		Log.debug("getClusterServerUrl() ");
		//String value = ReadProperties.getValue(docSysIniPath + "docSysConfig.properties", "serverUrl");
		String value = ReadProperties.read("docSysConfig.properties", "serverUrl");
		if(value != null)
		{
			return value;
		}
		
		return "http://localhost:8100";
	}

	protected static Integer getRedisEn() {
    	String redisEnStr = null;
    	redisEnStr = ReadProperties.read("docSysConfig.properties", "redisEn");
        Log.debug("getRedisEn() redisEnStr:" + redisEnStr);
    	if(redisEnStr == null || redisEnStr.isEmpty())
        {
        	return 0;
        }
        
        Integer redisEn = null;
        try {
        	redisEn = Integer.parseInt(redisEnStr);
        } catch (Exception e) {
        	errorLog("getRedisEn() 异常");
        	errorLog(e);
        }
        
        Log.debug("getRedisEn() redisEn:" + redisEn);    	
        if(redisEn == null)
        {
        	redisEn = 0;
        }
		return redisEn;
	}
	
	
	//获取OpenOffice的安装路径
    public String getOpenOfficePath() {
    	//get OpenOffice Home From Config File
    	String path = null;
    	path = ReadProperties.read("docSysConfig.properties", "openOfficePath");
        if(path != null && !path.isEmpty())
        {
        	return Path.localDirPathFormat(path, OSType);
        }

        switch(OSType)
        {
        case OS.Linux: 
        	path = "/opt/openoffice.org4/";
        	break;
        case OS.Windows:
        	path = "C:/Program Files (x86)/OpenOffice 4/";
        	break;
        case OS.MacOS:
        	path = "/Applications/OpenOffice.org.app/Contents/";
        	break;
        }
        return path;
    }

	//日志管理	
	protected static boolean addSystemLog(
			HttpServletRequest request, 
			User user, 
			String event, String subEvent, String action, String queryId,
			String result, 
			Repos repos, 
			Doc doc, 
			Doc newDoc, 
			String content)
    {
		String requestIP = "未知";
		if(request != null)
		{
			requestIP = getRequestIpAddress(request);
		}
		
		return addSystemLog(requestIP, user, event, subEvent, action, queryId, result, repos, doc, newDoc, content);
    }
	
	protected static boolean addSystemLog(ActionContext context, User accessUser, String result, String content)
    {
		return addSystemLog(context.requestIP, accessUser, context.event, context.subEvent, context.eventName, context.queryId, result,  context.repos, context.doc, context.newDoc, content);
    }	
	
	protected static boolean addSystemLog(FolderUploadAction action, User accessUser, String result, String content) {
		return addSystemLog(action.requestIP, accessUser, action.event, action.subEvent, action.eventName, action.queryId, result, action.repos, action.doc, null, content);					
	}
	
	protected static boolean addSystemLog(
			String requestIP, 
			User user, 
			String event, String subEvent, String action, String queryId,
			String result, 
			Repos repos, 
			Doc doc, 
			Doc newDoc, 
			String content)
    {
		SystemLog log = new SystemLog();
		log.time = new Date().getTime();
		
		log.ip = requestIP;			
		
		log.queryId = queryId;
		
		if(user == null)
		{
			log.userId = "";
			log.userName = "未知用户";							
		}
		else
		{
			log.userId = user.getId() + "";
			log.userName = user.getName();			
		}
		
		log.event = event;
		log.subEvent = subEvent;
		log.action = action;
		log.result = result;
		log.reposName = "";
		if(repos != null)
		{
			log.reposName = repos.getName();
		}
		log.path = "";
		log.name = "";
		if(doc != null)
		{
			log.path = doc.getPath();
			log.name = doc.getName();			
		}
		log.newPath = "";
		log.newName = "";
		if(newDoc != null)
		{
			log.newPath = newDoc.getPath();
			log.newName = newDoc.getName();
		}
		log.content = content;
		
		log.id = log.userName  + "-" + log.event + "-" + log.subEvent + "-" + log.time;
		
		String indexLib = getIndexLibPathForSystemLog();

		boolean ret = false;
		
		Date date1 = new Date();
		String lockInfo = "addSystemLog() syncLockForSystemLog";
		String lockName = "syncLockForSystemLog";
		if(false == lockSyncSource("SystemLog", lockName, lockInfo, 2*60*1000, syncLockForSystemLog, 3*1000, 3, systemUser))
		{
			return false;
		}    		
		
		ret = addSystemLogIndex(log, indexLib);

		unlockSyncSource(lockName, systemUser);
		
		Date date2 = new Date();
        Log.debug("addSystemLog() 创建索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
		return ret;
    }
	
	protected static boolean addSystemLogIndex(SystemLog log, String indexLib)
    {	
    	Log.debug("addSystemLogIndex() id:" + log.id + " indexLib:"+indexLib);    	
    	
    	Analyzer analyzer = null;
		Directory directory = null;
		IndexWriter indexWriter = null;
    	
		try {
	    	analyzer = new IKAnalyzer();
	    	directory = FSDirectory.open(new File(indexLib));

	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, analyzer);
	        indexWriter = new IndexWriter(directory, config);
	
	        Document document = LuceneUtil2.buildDocumentForObject(log);
	        indexWriter.addDocument(document);	        
	        
	        indexWriter.commit();
	        
	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        analyzer.close();
	        analyzer = null;	        
	    	return true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
	        errorLog("addSystemLogIndex() 异常");
			errorLog(e);
			return false;
		}
    }
	
	protected static void closeResource(IndexWriter indexWriter, Directory directory, Analyzer analyzer) {
		try {
        	if(indexWriter!=null)
        	{
        		indexWriter.close();
        	}
		} catch (IOException e1) {
			errorLog(e1);
		}
		
		if(directory != null)
		{
			try {
				directory.close();
			} catch (IOException e) {
				errorLog(e);
			}
		}
		if(analyzer != null)
		{
			analyzer.close();
		}
	}
    
	protected static String getIndexLibPathForSystemLog() 
	{
		Date curTime = new Date();
		return getIndexLibPathForSystemLog(curTime);
	}
		
	@SuppressWarnings("deprecation")
	protected static String getIndexLibPathForSystemLog(Date date) 
	{
		//按月创建Log
		String indexLibName = "SystemLog-" + date.getYear() + "-" + date.getMonth();
		String path = Path.getSystemLogStorePath(OSType) + indexLibName + "/";
		return path;
	}
	
	protected static String getIndexLibPathForPreferLink() {
		return Path.getDataStorePath(OSType) + "UserPreferLink/";
	}
	
	protected static String getIndexLibPathForUserPreferServer() {
		return Path.getDataStorePath(OSType) + "UserPreferServer/";
	}
	
	protected static String getIndexLibPathForRemoteStorageDoc(Repos repos, RemoteStorageConfig remote) {
		if(remote.remoteStorageIndexLib == null)
		{
			Log.debug("getIndexLibPathForRemoteStorageDoc() remoteStorageIndexLib is null!!!");
			//remote.remoteStorageIndexLib = getDBStorePath() + "RemoteStorage/" + repos.getId() + "/Doc";
		}
		return remote.remoteStorageIndexLib;
	}
	
	protected static String getIndexLibPathForVerReposDoc(Repos repos) {
		return Path.getReposIndexLibPath(repos) + "VerRepos/Doc";
	}
	
	protected static String getRequestIpAddress(HttpServletRequest request) {
	    String ip = null;

	    //X-Forwarded-For：Squid 服务代理
	    String ipAddresses = request.getHeader("X-Forwarded-For");
	    if (ipAddresses == null || ipAddresses.length() == 0 || "unknown".equalsIgnoreCase(ipAddresses)) 
	    {
	        //Proxy-Client-IP：apache 服务代理
	        ipAddresses = request.getHeader("Proxy-Client-IP");
	    }
	    
	    if (ipAddresses == null || ipAddresses.length() == 0 || "unknown".equalsIgnoreCase(ipAddresses)) 
	    {
	        //WL-Proxy-Client-IP：weblogic 服务代理
	        ipAddresses = request.getHeader("WL-Proxy-Client-IP");
	    }
	    
	    if (ipAddresses == null || ipAddresses.length() == 0 || "unknown".equalsIgnoreCase(ipAddresses)) 
	    {
	        //HTTP_CLIENT_IP：有些代理服务器
	        ipAddresses = request.getHeader("HTTP_CLIENT_IP");
	    }
	    
	    if (ipAddresses == null || ipAddresses.length() == 0 || "unknown".equalsIgnoreCase(ipAddresses)) 
	    {
	        //X-Real-IP：nginx服务代理
	        ipAddresses = request.getHeader("X-Real-IP");
	    }

	    //有些网络通过多层代理，那么获取到的ip就会有多个，一般都是通过逗号（,）分割开来，并且第一个ip为客户端的真实IP
	    if (ipAddresses != null && ipAddresses.length() != 0) {
	        ip = ipAddresses.split(",")[0];
	    }

	    //还是不能获取到，最后再通过request.getRemoteAddr();获取
	    if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ipAddresses)) 
	    {
	        ip = request.getRemoteAddr();
	    }
	    
	    return ip.equals("0:0:0:0:0:0:0:1")?"127.0.0.1":ip;
	}
	
	public static URLInfo getUrlInfoFromUrl(String url) {
		Log.info("getUrlInfoFromUrl()", "url:" + url);
		
		URLInfo urlInfo = new URLInfo();
		
	    String subStrs1[] = url.split("://");
	    if(subStrs1.length < 2)
	    {
	    	Log.info("getUrlInfoFromUrl()", "非法URL");
	    	return null;
	    }
	    
	    //set prefix
	    urlInfo.prefix = subStrs1[0] + "://";
	    String hostWithPortAndParams = subStrs1[1];	    
	    String subStrs2[] = hostWithPortAndParams.split("/");
    	urlInfo.params = subStrs2;

	    String hostWithPort = subStrs2[0];
	    
	    String subStrs3[] = hostWithPort.split(":");
	    if(subStrs3.length < 2)
	    {
	    	urlInfo.host = subStrs3[0];
	    }
	    else
	    {
	    	urlInfo.host = subStrs3[0];
	    	urlInfo.port = subStrs3[1];  	
	    }

	    Log.printObject("getUrlInfoFromUrl() urlInfo:", urlInfo);
		return urlInfo;
	}
	
    /**
     * 以流的方式
     * 发送文件和json对象
     *
     * @return
     */
    public static JSONObject postFileStreamAndJsonObj(String url, String fileName, byte[] fileData, HashMap<String, String> params, boolean waitForResponse) {
		JSONObject returnJson = null;
		Log.debug("\n*************************** postFileStreamAndJsonObj Start");
		Log.debug("postFileStreamAndJsonObj url:" + url);         		
		try {
            //开始设置模拟请求的参数，额，不一个个介绍了，根据需要拿
            String boundary = "------WebKitFormBoundaryUey8ljRiiZqhZHBu";
            URL u = new URL(url);
            HttpURLConnection conn = (HttpURLConnection) u.openConnection();
            conn.setDoOutput(true);
            conn.setDoInput(true);
            conn.setUseCaches(false);
            conn.setRequestMethod("POST");
            conn.setRequestProperty("connection", "Keep-Alive");
            
            //这里模拟的是火狐浏览器，具体的可以f12看看请求的user-agent是什么
            //conn.setRequestProperty("user-agent", "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1;SV1)");
            
            conn.setRequestProperty("Charsert", "UTF-8");
            //这里的content-type要设置成表单格式，模拟ajax的表单请求
            conn.setRequestProperty("Content-Type", "multipart/form-data;boundary=" + boundary);
            
            // 指定流的大小，当内容达到这个值的时候就把流输出
            //conn.setChunkedStreamingMode(10240000);
            
            //定义输出流，有什么数据要发送的，直接后面append就可以，记得转成byte再append
            DataOutputStream out = new DataOutputStream(conn.getOutputStream());
            byte[] end_data = ("\r\n--" + boundary + "--\r\n").getBytes();// 定义最后数据分隔线
 
            if(params != null)
            {
            	for (Entry<String, String> entry : params.entrySet()) {
            		String name = entry.getKey();
            		String value = entry.getValue();
            		Log.debug("postFileStreamAndJsonObj [" + name  + "] = [" + value + "]");         		

            		StringBuilder sb = new StringBuilder();            		
    	            //添加form属性
    	            sb.append("--"); 
    	            sb.append(boundary);
    	            sb.append("\r\n");
    	            //这里存放要传输的参数，name = xml
    	            sb.append("Content-Disposition: form-data; name=\"" + name + "\"");
    	            sb.append("\r\n\r\n");
    	            //把要传的json字符串放进来
    	            sb.append(value);
    	            out.write(sb.toString().getBytes("utf-8"));
    	            out.write("\r\n".getBytes("utf-8"));
            	}
            	
            	//TODO:添加paddingKey是因为有个Bug,最后一个参数会加上换行符号,修复后记得删除
        		StringBuilder paddingSB = new StringBuilder();            		
        		paddingSB.append("--"); 
        		paddingSB.append(boundary);
        		paddingSB.append("\r\n");
        		paddingSB.append("Content-Disposition: form-data; name=\"paddingKey\"");
        		paddingSB.append("\r\n\r\n");
        		paddingSB.append("paddingValue");
	            out.write(paddingSB.toString().getBytes("utf-8"));
	            out.write("\r\n".getBytes("utf-8"));
            }
            
            //add File
            if(fileData != null)
            {
            	StringBuilder sb1 = new StringBuilder();
            	sb1.append("--");
            	sb1.append(boundary);
                sb1.append("\r\n");
                sb1.append("Content-Disposition: form-data;name=\"uploadFile\";filename=\"" + fileName + "\"\r\n");
                //发送文件是以流的方式发送，所以这里的content-type是octet-stream流
                sb1.append("Content-Type:application/octet-stream\r\n\r\n");
                out.write(sb1.toString().getBytes("utf-8"));
                out.write(fileData);
            }
            //发送流
            out.write(end_data);
            out.flush();
            out.close();
            
            if(waitForResponse)
            {
				// 读取响应
				BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(),"utf-8"));//**注意点3**，需要此格式
				String lines;
				StringBuffer sb = new StringBuffer("");
				while ((lines = reader.readLine()) != null) {
					sb.append(lines);
				}
				Log.debug("postFileStreamAndJsonObj response:"+sb);			
				returnJson = JSONObject.parseObject(sb.toString());
				reader.close();
            }
            
			// 断开连接
			conn.disconnect();			
        } catch (Exception e) {
            errorLog("postFileStreamAndJsonObj 发送POST请求出现异常！" + e);
            errorLog(e);
        }
        
        Log.debug("*********************** postFileStreamAndJsonObj End\n");
        return returnJson;
    }
    
	public static JSONObject postJson(String urlString , HashMap<String, String> params, boolean waitForResponse) {
		return postFileStreamAndJsonObj(urlString, null, null, params,waitForResponse);
	}

    //注意：该函数只能用于传输小量二进制文件，而且接收也必须是非标方法
	public static JSONObject postData(String urlString ,byte[] data) {
		JSONObject returnJson = null;
		try {
			// 创建连接
			URL url = new URL(urlString);
			HttpURLConnection connection = (HttpURLConnection) url.openConnection();
			connection.setRequestMethod("POST");
			connection.setRequestProperty("connection", "Keep-Alive");
			connection.setDoOutput(true);
			connection.setDoInput(true);
			connection.setUseCaches(false);
			//connection.setInstanceFollowRedirects(true);
			//connection.setRequestProperty("Charsert", "UTF-8");
			connection.setRequestProperty("Content-Type","application/octet-stream;");	//字节流
		    // 指定流的大小，当内容达到这个值的时候就把流输出
		    //connection.setChunkedStreamingMode(10240000);
			
			//connection.getOutputStream会调用connect(因此不调用也可以)
			connection.connect();
			
			DataOutputStream out = new DataOutputStream(
					connection.getOutputStream());
			if(data != null)
			{
				out.write(data);
			}
			out.flush();
			out.close();
			// 读取响应
			BufferedReader reader = new BufferedReader(new InputStreamReader(
					connection.getInputStream(),"utf-8"));//**注意点3**，需要此格式
			String lines;
			StringBuffer sb = new StringBuffer("");
			while ((lines = reader.readLine()) != null) {
				sb.append(lines);
			}
			System.out.println("sb:"+sb);			
			returnJson = JSONObject.parseObject(sb.toString());
			reader.close();
			// 断开连接
			connection.disconnect();
		} catch (MalformedURLException e) {
			errorLog(e);
		} catch (UnsupportedEncodingException e) {
			errorLog(e);
		} catch (IOException e) {
			errorLog(e);
		}
		return returnJson;
	}
	
	public boolean saveFileFromUrl(String url, String localPath, String fileName) {
		Log.debug("saveFileFromUrl() url:" + url + " localPath:" + localPath + " fileName:" + fileName);
        boolean ret = false;
        File file = null;
        FileOutputStream os = null;
        
        try {
            File localDir = new File(localPath);
            if(localDir.exists() == false)
            {
            	localDir.mkdirs();
            }
            file = new File(localPath + fileName);
            os = new FileOutputStream(file);
            
    		ret = downloadFromUrl(url, os);
        } catch (Exception e) {
            Log.debug(e);
        } finally {
        	if(os != null)
        	{
        		try {
					os.close();
				} catch (IOException e) {
					Log.debug(e);
				}
        	}
        }
        return ret;		
	}
	
    public static boolean downloadFromUrl(String urlStr, OutputStream os) {
    	boolean ret = false;
    	InputStream is = null;
		String token="v32Eo2Tw+qWI/eiKW3D8ye7l19mf1NngRLushO6CumLMHIO1aryun0/Y3N3YQCv/TqzaO/TFHw4=";
		int timeOut = 20*1000; //20秒
    	try {
	    	URL url = new URL(urlStr);
	        HttpURLConnection conn = (HttpURLConnection)url.openConnection();
	
	        conn.setConnectTimeout(timeOut);
	        
	        //防止屏蔽程序抓取而返回403错误
	        conn.setRequestProperty("User-Agent", "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt)");
	        conn.setRequestProperty("lfwywxqyh_token",token);
	
	        is = conn.getInputStream();
	        readInputStream(is, os);
	        ret = true;
        } catch (Exception e) {
        	errorLog(e);        	
        } finally {
        	if(is != null)
        	{
        		try {
					is.close();
				} catch (IOException e) {
					errorLog(e);
				}
        	}
        }
        
        return ret;
    }
    
    public static void readInputStream(InputStream is, OutputStream os) throws Exception {
        byte[] buffer = new byte[1024];
        int len = 0;
        while((len = is.read(buffer)) != -1) {
            os.write(buffer, 0, len);
        }
    }
    
    public static  byte[] readInputStream(InputStream inputStream) throws IOException {
        byte[] buffer = new byte[1024];
        int len = 0;
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        while((len = inputStream.read(buffer)) != -1) {
            bos.write(buffer, 0, len);
        }
        bos.close();
        return bos.toByteArray();
    }
    
	protected String buildDownloadDocLink(Doc doc, String authCode, String urlStyle, Integer encryptEn, ReturnAjax rt) {
		Doc downloadDoc = buildDownloadDocInfo(doc.getVid(), doc.getPath(), doc.getName(), doc.getLocalRootPath() + doc.getPath(), doc.getName(), encryptEn);
		if(downloadDoc == null)
		{
			Log.debug("buildDownloadDocLink() buildDownloadDocInfo failed");
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
			fileLink = "/DocSystem/Doc/downloadDoc/" + doc.getVid() + "/" + downloadDoc.getPath() + "/" + downloadDoc.getName() +  "/" + downloadDoc.targetPath +  "/" + downloadDoc.targetName +"/" + authCode + "/" + shareId + "/" + downloadDoc.encryptEn;
		}
		else
		{
			fileLink = "/DocSystem/Doc/downloadDoc.do?vid=" + doc.getVid() + "&path="+ downloadDoc.getPath() + "&name="+ downloadDoc.getName() + "&targetPath=" + downloadDoc.targetPath + "&targetName="+downloadDoc.targetName + "&encryptEn="+downloadDoc.encryptEn;	
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
	
	protected static Doc buildDownloadDocInfo(Integer vid, String path, String name, String targetPath, String targetName, Integer encryptEn)
	{
		Log.debug("buildDownloadDocInfo() targetPath:" + targetPath + " targetName:"  + targetName);
		
		String encPath = Base64Util.base64EncodeURLSafe(path);
		if(encPath == null)
		{
			return null;			
		}
		
		String encName = Base64Util.base64EncodeURLSafe(name);
		if(encName == null)
		{
			return null;			
		}	
		
		String encTargetName = Base64Util.base64EncodeURLSafe(targetName);
		if(encTargetName == null)
		{
			return null;			
		}	
		String encTargetPath = Base64Util.base64EncodeURLSafe(targetPath);
		if(encTargetPath == null)
		{
			return null;			
		}	
		
		Doc doc = new Doc();
		doc.targetPath = encTargetPath;
		doc.targetName = encTargetName;
		doc.setPath(encPath);
		doc.setName(encName);
		doc.encryptEn = encryptEn;
		
		//指定目标文件的size
		File targetFile = new File(targetPath, targetName);
		if(targetFile.exists())
		{
			doc.setSize(targetFile.length());
		}
		
		if(vid != null)
		{
			doc.setVid(vid);
		}
		return doc;
	}
	
	/***** UserPreferServer *******/
	protected boolean editUserPreferServer(UserPreferServer server) {
		String indexLib = getIndexLibPathForUserPreferServer();
		return updateUserPreferServerIndex(server, indexLib);
	}
	
	protected boolean updateUserPreferServerIndex(UserPreferServer server, String indexLib)
    {	
    	Analyzer analyzer = null;
		Directory directory = null;
		IndexWriter indexWriter = null;
    	
		try {
	    	Date date1 = new Date();
	    	analyzer = new IKAnalyzer();
	    	directory = FSDirectory.open(new File(indexLib));

	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, analyzer);
	        indexWriter = new IndexWriter(directory, config);
	
	        Document document = LuceneUtil2.buildDocumentForObject(server);
	        indexWriter.addDocument(document);	        
	        
	        indexWriter.updateDocument(new Term("id", server.id), document);
	        indexWriter.commit();
	        
	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        analyzer.close();
	        analyzer = null;
	        
			Date date2 = new Date();
	        Log.debug("updateUserPreferServerIndex() 更新索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
	    	return true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
	        errorLog("updateUserPreferServerIndex() 异常");
			errorLog(e);
			return false;
		}
    }
	
	protected boolean deleteUserPreferServer(String serverId)
    {
		String indexLib = getIndexLibPathForUserPreferServer();
		return deleteUserPreferServerIndex(serverId, indexLib);
	}

	protected boolean deleteUserPreferServerIndex(String serverId, String indexLib)
	{
    	Log.debug("deleteUserPreferServerIndex() serverId:" + serverId + " indexLib:"+indexLib);
    	Analyzer analyzer = null;
    	Directory directory = null;
    	IndexWriter indexWriter = null;
    	
		try {
			Date date1 = new Date();
			directory = FSDirectory.open(new File(indexLib));
		
	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, null);
	        indexWriter = new IndexWriter(directory, config);
	        
	        Query query = new TermQuery(new Term("id", serverId));
	        indexWriter.deleteDocuments(query);
	        indexWriter.commit();

	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        
	        Date date2 = new Date();
	        Log.debug("deleteUserPreferServerIndex() 删除索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
	        return true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
			errorLog(e);
			return false;
		}
    }  

	protected static boolean addUserPreferServerIndex(UserPreferServer server, String indexLib) {
    	Log.debug("addUserPreferServerIndex() id:" + server.id + " indexLib:"+indexLib);    	
    	
    	Analyzer analyzer = null;
		Directory directory = null;
		IndexWriter indexWriter = null;
    	
		try {
	    	Date date1 = new Date();
	    	analyzer = new IKAnalyzer();
	    	directory = FSDirectory.open(new File(indexLib));

	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, analyzer);
	        indexWriter = new IndexWriter(directory, config);
	
	        Document document = LuceneUtil2.buildDocumentForObject(server);
	        indexWriter.addDocument(document);	        
	        
	        indexWriter.commit();
	        
	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        analyzer.close();
	        analyzer = null;
	        
			Date date2 = new Date();
	        Log.debug("addUserPreferServerIndex() 创建索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
	    	return true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
	        errorLog("addUserPreferServerIndex() 异常");
			errorLog(e);
			return false;
		}
    }
	
	protected static UserPreferServer getUserPreferServer(String serverId) {
		UserPreferServer queryServerInfo = new UserPreferServer();
		queryServerInfo.id = serverId;
		
		String indexLib = getIndexLibPathForUserPreferServer();
		List<UserPreferServer> list = multiQueryForUserPreferServer(queryServerInfo, indexLib, null);
		if(list == null || list.size() != 1)
		{
			return null;
		}
		return list.get(0);
	}
	
	protected static List<UserPreferServer> getUserPreferServerList(UserPreferServer queryServerInfo, QueryResult queryResult) 
	{
		//按时间正序排序
    	Sort sort = new Sort();
    	SortField field = new SortField("createTime", SortField.Type.LONG, false);
		sort.setSort(field);
		
		String indexLib = getIndexLibPathForUserPreferServer();
		List<UserPreferServer> list = multiQueryForUserPreferServer(queryServerInfo, indexLib, sort);
		return list;
	}
	
	public static List<UserPreferServer> multiQueryForUserPreferServer(UserPreferServer queryServerInfo, String indexLib, Sort sort)
	{
		List<UserPreferServer> list =  new ArrayList<UserPreferServer>();
		
	    Directory directory = null;
        DirectoryReader ireader = null;
        IndexSearcher isearcher = null;

		try {
    		File file = new File(indexLib);
    		if(!file.exists())
    		{
    			System.out.println("multiQueryForUserPreferServer() " + indexLib + " 不存在！");
    			return null;
    		}
    		
	        directory = FSDirectory.open(file);
	        ireader = DirectoryReader.open(directory);
	        isearcher = new IndexSearcher(ireader);
	
	        BooleanQuery builder = buildBooleanQueryForUserPreferServer(queryServerInfo);
	        if(builder != null)
	        {
	        	TopDocs hits = null;
	        	if(sort == null)
	        	{
	        		hits = isearcher.search( builder, 1000); 
	        	}
	        	else
	        	{
	        		hits = isearcher.search( builder, 1000, sort); 
	        	}
	        	
	        	for ( ScoreDoc scoreDoc : hits.scoreDocs )
	        	{
	        		Document document = isearcher.doc( scoreDoc.doc );
	        		UserPreferServer entry = new UserPreferServer();
	        		LuceneUtil2.buildObjectForDocument(entry, document);
		            list.add(entry);
	        	}
	        }
		} catch (Exception e) {
			errorLog("search() 异常");
			errorLog(e);
		} finally {
			if(ireader != null)
			{
				try {
					ireader.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
			
			if(directory != null)
			{
				try {
					directory.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
		}				
		return list;
    }
	
	private static BooleanQuery buildBooleanQueryForUserPreferServer(UserPreferServer queryServerInfo) 
	{
		List<QueryCondition> conditions = LuceneUtil2.buildQueryConditionsForObject(queryServerInfo, Occur.MUST, QueryCondition.SEARCH_TYPE_Term);
		BooleanQuery query = LuceneUtil2.buildBooleanQueryWithConditions(conditions);
		return query;
	}
	
	/****** UserPreferLink **************/
	protected PreferLink addPreferLink(String url, String name, String content, Integer type, User accessUser) {
		PreferLink link = new PreferLink();
		link.createTime = new Date().getTime();
		
		link.name = name;
		link.url = url;
		link.content = content;
		link.type = type;
		
		link.userId = accessUser.getId();
		link.userName = accessUser.getName();
		
		link.id = link.userId + "_" + url.hashCode() + "_" + link.createTime;
		
		String indexLib = getIndexLibPathForPreferLink();
		if(addPreferLinkIndex(link, indexLib) == false)
		{
			return null;
		}
		return link;
	}

	private boolean addPreferLinkIndex(PreferLink link, String indexLib) {
    	Log.debug("addPreferLinkIndex() id:" + link.id + " indexLib:"+indexLib);    	
    	
    	Analyzer analyzer = null;
		Directory directory = null;
		IndexWriter indexWriter = null;
    	
		try {
	    	Date date1 = new Date();
	    	analyzer = new IKAnalyzer();
	    	directory = FSDirectory.open(new File(indexLib));

	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, analyzer);
	        indexWriter = new IndexWriter(directory, config);
	
	        Document document = LuceneUtil2.buildDocumentForObject(link, "accessUserIds");
	        indexWriter.addDocument(document);	        
	        
	        indexWriter.commit();
	        
	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        analyzer.close();
	        analyzer = null;
	        
			Date date2 = new Date();
	        Log.debug("addPreferLinkIndex() 创建索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
	    	return true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
	        errorLog("addPreferLinkIndex() 异常");
			errorLog(e);
			return false;
		}
	}

	protected boolean deletePreferLink(String linkId) {
		String indexLib = getIndexLibPathForPreferLink();
		return deleteUserPreferServerIndex(linkId, indexLib);
	}
	
	protected boolean editPreferLink(PreferLink link) {
		String indexLib = getIndexLibPathForPreferLink();
		return updatePreferLinkIndex(link, indexLib);
	}
	
	private boolean updatePreferLinkIndex(PreferLink link, String indexLib) {
    	Analyzer analyzer = null;
		Directory directory = null;
		IndexWriter indexWriter = null;
    	
		try {
	    	Date date1 = new Date();
	    	analyzer = new IKAnalyzer();
	    	directory = FSDirectory.open(new File(indexLib));

	        IndexWriterConfig config = new IndexWriterConfig(Version.LUCENE_46, analyzer);
	        indexWriter = new IndexWriter(directory, config);
	
	        Document document = LuceneUtil2.buildDocumentForObject(link, "accessUserIds");
	        indexWriter.addDocument(document);	        
	        
	        indexWriter.updateDocument(new Term("id", link.id), document);
	        indexWriter.commit();
	        
	        indexWriter.close();
	        indexWriter = null;
	        directory.close();
	        directory = null;
	        analyzer.close();
	        analyzer = null;
	        
			Date date2 = new Date();
	        Log.debug("updatePreferLinkIndex() 更新索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
	    	return true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
	        errorLog("updatePreferLinkIndex() 异常");
			errorLog(e);
			return false;
		}
	}
	
	protected static BooleanQuery buildBooleanQueryForPreferLink(PreferLink queryInfo) {
		List<QueryCondition> conditions = LuceneUtil2.buildQueryConditionsForObject(queryInfo, Occur.MUST, QueryCondition.SEARCH_TYPE_Term);
		BooleanQuery query = LuceneUtil2.buildBooleanQueryWithConditions(conditions);
		return query;
	}
	
	protected static BooleanQuery buildBooleanQueryForPreferLinkLike(PreferLink queryInfo) {
		List<QueryCondition> conditions = LuceneUtil2.buildQueryConditionsForObject(queryInfo, Occur.SHOULD, QueryCondition.SEARCH_TYPE_Wildcard);
		BooleanQuery query = LuceneUtil2.buildBooleanQueryWithConditions(conditions);
		return query;
	}
	
	protected static PreferLink getPreferLink(String linkId) {
		PreferLink queryInfo = new PreferLink();
		queryInfo.id = linkId;
		
		String indexLib = getIndexLibPathForPreferLink();
		BooleanQuery query = buildBooleanQueryForPreferLink(queryInfo);
		List<PreferLink> list = multiQueryForPreferLink(query, indexLib, null);
		if(list == null || list.size() != 1)
		{
			return null;
		}
		return list.get(0);
	}
	
	protected static List<PreferLink> multiQueryForPreferLink(BooleanQuery query, String indexLib, Sort sort) {
		List<PreferLink> list =  new ArrayList<PreferLink>();
		
	    Directory directory = null;
        DirectoryReader ireader = null;
        IndexSearcher isearcher = null;

		try {
    		File file = new File(indexLib);
    		if(!file.exists())
    		{
    			System.out.println("multiQueryForPreferLink() " + indexLib + " 不存在！");
    			return null;
    		}
    		
	        directory = FSDirectory.open(file);
	        ireader = DirectoryReader.open(directory);
	        isearcher = new IndexSearcher(ireader);
	
	        if(query != null)
	        {
	        	TopDocs hits = null;
	        	if(sort == null)
	        	{
	        		hits = isearcher.search( query, 1000); 
	        	}
	        	else
	        	{
	        		hits = isearcher.search( query, 1000, sort); 
	        	}
	        	
	        	for ( ScoreDoc scoreDoc : hits.scoreDocs )
	        	{
	        		Document document = isearcher.doc( scoreDoc.doc );
	        		PreferLink entry = new PreferLink();
	        		LuceneUtil2.buildObjectForDocument(entry, document);
		            list.add(entry);
	        	}
	        }
		} catch (Exception e) {
			errorLog("search() 异常");
			errorLog(e);
		} finally {
			if(ireader != null)
			{
				try {
					ireader.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
			
			if(directory != null)
			{
				try {
					directory.close();
				} catch (Exception e1) {
					errorLog(e1);
				}
			}
		}				
		return list;
	}
	
	//errorLog
	public static void errorLog(String content) {
		Log.error(content, defaultLogFilePath);
	}
	
	public static void errorLog(Exception e) {
		Log.error(e, defaultLogFilePath);
	}
	
	public static void docSysDebugLog(String logStr, ReturnAjax rt) {
		if(rt != null)
		{
			rt.setDebugLog(logStr);
		}
		Log.debug(logStr);		
	}

	public  static void docSysWarningLog(String logStr, ReturnAjax rt) {
		if(rt != null)
		{
			rt.setWarningMsg(logStr);
		}
		Log.info(logStr);
	}
	
	public static void docSysErrorLog(String logStr, ReturnAjax rt) {
		if(rt != null)
		{
			rt.setError(logStr);
		}
		Log.info(logStr);
	}
	
	public static boolean createMonitorTrigger(String trigger)
	{
		String triggerFileName = trigger + ".trigger";
		if(false == FileUtil.createFile(docSysIniPath, triggerFileName))
		{
			Log.info("createMonitorTrigger() FileUtil.createFile 文件 [" + triggerFileName + "] 创建失败！");
			return false;					
		}
		return true;
	}
}
