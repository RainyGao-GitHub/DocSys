package com.DocSystem.common;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.HttpURLConnection;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
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
import org.wltea.analyzer.lucene.IKAnalyzer;

import util.DateFormat;
import util.ReadProperties;
import util.ReturnAjax;
import util.LuceneUtil.LuceneUtil2;

import com.DocSystem.common.CommonAction.CommonAction;
import com.DocSystem.common.constants.LICENSE_RESULT;
import com.DocSystem.common.entity.BackupConfig;
import com.DocSystem.common.entity.BackupTask;
import com.DocSystem.common.entity.EncryptConfig;
import com.DocSystem.common.entity.FtpConfig;
import com.DocSystem.common.entity.GitConfig;
import com.DocSystem.common.entity.LDAPConfig;
import com.DocSystem.common.entity.License;
import com.DocSystem.common.entity.LocalConfig;
import com.DocSystem.common.entity.MxsDocConfig;
import com.DocSystem.common.entity.OfficeLicense;
import com.DocSystem.common.entity.PreferLink;
import com.DocSystem.common.entity.QueryCondition;
import com.DocSystem.common.entity.QueryResult;
import com.DocSystem.common.entity.RemoteStorageConfig;
import com.DocSystem.common.entity.ReposBackupConfig;
import com.DocSystem.common.entity.SftpConfig;
import com.DocSystem.common.entity.SmbConfig;
import com.DocSystem.common.entity.SvnConfig;
import com.DocSystem.common.entity.SystemLog;
import com.DocSystem.common.entity.UserPreferServer;
import com.DocSystem.commonService.ProxyThread;
import com.DocSystem.commonService.ShareThread;
import com.DocSystem.entity.Doc;
import com.DocSystem.entity.DocLock;
import com.DocSystem.entity.Repos;
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

	//应用路径
    protected static String docSysIniPath = null;
    protected static String docSysWebPath = null;
    protected static String webappsPath = null;
	
    //系统License
    public static License systemLicenseInfo = null;
	protected static long licenseCheckTimer = 0;
	
    //OnlyOffice License
    public static OfficeLicense officeLicenseInfo = null;
    public static Integer officeType = 0; //0:内置 1:外置
    
    //系统LDAP设置
    public static LDAPConfig systemLdapConfig = null;
	
	public static ConcurrentHashMap<Integer, ConcurrentHashMap<String, DocLock>> docLocksMap = new ConcurrentHashMap<Integer, ConcurrentHashMap<String, DocLock>>();
	protected static ConcurrentHashMap<Integer, DocLock> reposLocksMap = new ConcurrentHashMap<Integer, DocLock>();
	
	public static int OSType = OS.UNKOWN; //
	
	//DocSysType
    protected static int docSysType = constants.DocSys_Community_Edition; //0: Community Edition 1: Enterprise Edition 2: Professional Edition 3: Personal Edition 
    
    protected static int isSalesServer = 0;
	protected static String serverHost = null;
	
    static {
    	initOSType();
    	docSysWebPath = Path.getWebPath(OSType);
    	webappsPath = Path.getDocSysWebParentPath(docSysWebPath);
		docSysIniPath = webappsPath + "docSys.ini/";   
    	initSystemLicenseInfo();
    	initOfficeLicenseInfo();
    	initLdapConfig();
		serverHost = getServerHost();		
    }
    
	private static void initSystemLicenseInfo() {
		Log.debug("initSystemLicenseInfo() ");
		//Default systemLicenseInfo
		systemLicenseInfo = new License();
		systemLicenseInfo.type = constants.DocSys_Community_Edition;
		systemLicenseInfo.usersCount = null;	//无限制
		systemLicenseInfo.expireTime = null; //长期有效
		systemLicenseInfo.hasLicense = false;
	}
	
	private static void initLdapConfig() {
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
		
		systemLdapConfig.authMode = getLdapAuthMode(systemLdapConfig.settings);
		systemLdapConfig.loginMode = getLdapLoginMode(systemLdapConfig.settings);	
		systemLdapConfig.userAccount = getLdapUserAccount(systemLdapConfig.settings);				
		systemLdapConfig.filter = getLdapBaseFilter(systemLdapConfig.settings);
	}


	private static Integer getLdapAuthMode(JSONObject ldapSettings) {
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
	
	private static String getLdapLoginMode(JSONObject ldapSettings) {
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
	
	private static String getLdapUserAccount(JSONObject ldapSettings) {
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
	
	private static String getLdapBaseFilter(JSONObject ldapSettings) {
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

	private static JSONObject getLDAPSettings(String[] configs) {
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
		if(systemLicenseInfo.expireTime != null)
		{	
			long curTime = new Date().getTime();
			if(systemLicenseInfo.expireTime < curTime) 
			{
				rt.setError("证书已过期，请购买商业版证书！");
				return false;	
			}
		}
		if(systemLicenseInfo.state != null)
		{	
			if(systemLicenseInfo.state == 0) 
			{
				rt.setError("证书已失效，请重新购买商业版证书！");
				return false;	
			}
		}
		
		return true;
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

	//分享代理服务线程（一个服务器只允许启动一个）
	protected static ProxyThread proxyThread = null;
	//远程分享服务线程（一个服务器只允许启动一个）
	protected static ShareThread shareThread = null;

	protected static ConcurrentHashMap<Integer, TextSearchConfig> reposTextSearchHashMap = new ConcurrentHashMap<Integer, TextSearchConfig>();	
	protected static ConcurrentHashMap<Integer, EncryptConfig> reposEncryptHashMap = new ConcurrentHashMap<Integer, EncryptConfig>();		
	//远程服务器前置
	protected static ConcurrentHashMap<Integer, RemoteStorageConfig> reposRemoteServerHashMap = new ConcurrentHashMap<Integer, RemoteStorageConfig>();		
	//远程存储
	protected static ConcurrentHashMap<Integer, RemoteStorageConfig> reposRemoteStorageHashMap = new ConcurrentHashMap<Integer, RemoteStorageConfig>();	
	protected static ConcurrentHashMap<Integer, ReposBackupConfig> reposBackupConfigHashMap = new ConcurrentHashMap<Integer, ReposBackupConfig>();
	protected static ConcurrentHashMap<Integer, ConcurrentHashMap<Long, BackupTask>> reposLocalBackupTaskHashMap = new ConcurrentHashMap<Integer, ConcurrentHashMap<Long, BackupTask>>();
	protected static ConcurrentHashMap<Integer, ConcurrentHashMap<Long, BackupTask>> reposRemoteBackupTaskHashMap = new ConcurrentHashMap<Integer, ConcurrentHashMap<Long, BackupTask>>();	
	
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
			Log.error(e);
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
		remoteBackupConfig.indexLibBase = getDBStorePath() + "RemoteBackup/" + repos.getId() + "/";

		RemoteStorageConfig remote = parseRemoteStorageConfig(repos, remoteStorageStr, "RemoteBackup");
		remoteBackupConfig.remoteStorageConfig = remote;
		return remoteBackupConfig;
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
		localBackupConfig.indexLibBase = getDBStorePath() + "LocalBackup/" + repos.getId() + "/";
		
		RemoteStorageConfig remote = new RemoteStorageConfig();
		remote.protocol = "file";
		remote.rootPath = "";
		remote.FILE = new LocalConfig();
		localRootPath = Path.localDirPathFormat(localRootPath, OSType);
		remote.FILE.localRootPath = localRootPath;
		
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
	private String getRealTimeBackupIndexLibForVirtualDoc(BackupConfig backupConfig, RemoteStorageConfig remote) {
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
			return "Backup/" + repos.getId() + "/data/rdata/";			
		}
		
		String backupTime = DateFormat.dateTimeFormat2(date);
		return "Backup/" + repos.getId() + "/data-" + backupTime + "/rdata/"; 
	}

	public static String getBackupOffsetPathForVirtualDoc(Repos repos, RemoteStorageConfig remote, Date date) {
		//对于备份服务器是版本仓库，那么备份不按时间存放
		if(remote.isVerRepos)
		{
			return "Backup/" + repos.getId() + "/data/vdata/";
		}
		
		String backupTime = DateFormat.dateTimeFormat2(date);
		return "Backup/" + repos.getId() + "/data-" + backupTime + "/vdata/"; 
	}

	
	public static String getRealTimeBackupOffsetPathForRealDoc(Repos repos, RemoteStorageConfig remote, Date date) {
		if(remote.isVerRepos)
		{
			return "Backup/" + repos.getId() + "/data/rdata/";			
		}
		
		//实时备份按日期分目录（并在日期目录下创建目录），避免产生太多目录
		String backupDate = DateFormat.dateFormat1(date); //2021-11-25
		String backupTime = DateFormat.dateTimeFormat2(date); //20211125091005
		return "RealTimeBackup/" + repos.getId() + "/rdata/" + backupDate + "/" + backupTime + "/"; 
	}

	public static String getRealTimeBackupOffsetPathForVirtualDoc(Repos repos, RemoteStorageConfig remote, Date date) {
		if(remote.isVerRepos)
		{
			return "Backup/" + repos.getId() + "/data/vdata/";			
		}
		
		//实时备份按日期分目录（并在日期目录下创建目录），避免产生太多目录		
		String backupDate = DateFormat.dateFormat1(date); //2021-11-25
		String backupTime = DateFormat.dateTimeFormat2(date); //9-33-05
		return "RealTimeBackup/" + repos.getId() + "/vdata/" + backupDate + "/" + backupTime + "/"; 
	}
	
	//**** 服务器前置配置 *******
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
		if(remote == null)
		{
			reposRemoteServerHashMap.remove(repos.getId());
			return;
		}
		
		//设置索引库位置
		remote.remoteStorageIndexLib = getDBStorePath() + "RemoteServer/" + repos.getId() + "/Doc";
		
		//add remote config to hashmap
		reposRemoteServerHashMap.put(repos.getId(), remote);
	}
	
	protected static boolean isFSM(Repos repos) {
		return repos.getType() < 3;
	}
	
	//******** 远程存储配置 **********
	protected void deleteRemoteStorageConfig(Repos repos) {
		Log.debug("deleteRemoteStorageConfig for  repos:" + repos.getId() + " " + repos.getName());
		reposRemoteStorageHashMap.remove(repos.getId());
		reposRemoteServerHashMap.remove(repos.getId());		
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

	protected static void initReposRemoteStorageConfig(Repos repos, String remoteStorage)
	{
		if(isFSM(repos) == false)
		{
			Log.debug("initReposRemoteServerConfig 前置类型仓库不支持远程存储！");
			return;
		}
		
		RemoteStorageConfig remote = parseRemoteStorageConfig(repos, remoteStorage, "RemoteStorage");
		if(remote == null)
		{
			reposRemoteStorageHashMap.remove(repos.getId());
			return;
		}
		
		//设置索引库位置
		remote.remoteStorageIndexLib = getDBStorePath() + "RemoteStorage/" + repos.getId() + "/Doc";

		//add remote config to hashmap
		reposRemoteStorageHashMap.put(repos.getId(), remote);
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
		
		
		if(protocol == null)
		{
			Log.debug("parseRemoteStorageConfig unknown protocol");
			return null;
		}
		
		switch(protocol)
		{
		case "sftp":
			return parseRemoteStorageConfigForSftp(repos, remoteStorage);
		case "ftp":
			return parseRemoteStorageConfigForFtp(repos, remoteStorage);
		case "smb":
			return parseRemoteStorageConfigForSmb(repos, remoteStorage);
		case "mxsdoc":
			return parseRemoteStorageConfigForMxsDoc(repos, remoteStorage);
		case "svn":
			return parseRemoteStorageConfigForSvn(repos, remoteStorage);
		case "git":
			return parseRemoteStorageConfigForGit(repos, remoteStorage, type);
		}
		return null;
	}
	
	private static RemoteStorageConfig parseRemoteStorageConfigForMxsDoc(Repos repos, String remoteStorage) {
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

	private static RemoteStorageConfig parseRemoteStorageConfigForGit(Repos repos, String remoteStorage, String type) {
		RemoteStorageConfig remote = new RemoteStorageConfig();
		remote.protocol = "git";
		remote.isVerRepos = true;
		remote.GIT = new GitConfig();
		
		String[] subStrs = remoteStorage.split(";");
		
		String url = subStrs[0];
		parseGitUrl(remote, url.trim());
		if(remote.GIT.isRemote == 1)
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
			Log.debug("parseRemoteStorageConfigForGit userName:" + remote.GIT.userName + " pwd:" + remote.GIT.pwd + " autoPull:" + remote.autoPull + " rootPath:" + remote.rootPath);
		}
		
		return remote;
	}

	private static RemoteStorageConfig parseRemoteStorageConfigForSvn(Repos repos, String remoteStorage) {
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

	private static RemoteStorageConfig parseRemoteStorageConfigForSftp(Repos repos, String remoteStorage) {
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
	
	private static RemoteStorageConfig parseRemoteStorageConfigForFtp(Repos repos, String remoteStorage) {
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
	
	private static RemoteStorageConfig parseRemoteStorageConfigForSmb(Repos repos, String remoteStorage) {
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
			//Log.debug("insertUniqueCommonAction create uniqueAction for repos:" + reposId);
			UniqueAction newUniqueAction = new UniqueAction();
			uniqueActionHashMap.put(reposId, newUniqueAction);
			uniqueAction = newUniqueAction;
		}
		
		ConcurrentHashMap<Long, CommonAction> uniqueCommonActionHashMap = uniqueAction.getUniqueCommonActionHashMap();
		List<CommonAction> uniqueCommonActionList = uniqueAction.getUniqueCommonActionList();		

		//Log.debug("insertUniqueCommonAction actionType:" + action.getAction() + " docType:" + action.getDocType() + " actionId:" + action.getType() + " doc:"+ srcDoc.getDocId() + " " + srcDoc.getPath() + srcDoc.getName());
		CommonAction tempAction = uniqueCommonActionHashMap.get(srcDoc.getDocId());
		if(tempAction != null && tempAction.getType() == action.getType() && tempAction.getAction() == action.getAction() && tempAction.getDocType() == action.getDocType())
		{
			//Log.debug("insertUniqueCommonAction action for doc:"+ srcDoc.getDocId() + " [" + srcDoc.getPath() + srcDoc.getName() + "] alreay in uniqueActionList");
			return false;
		}
		
		uniqueCommonActionHashMap.put(srcDoc.getDocId(), action);
		uniqueCommonActionList.add(action);
		Log.debug("insertUniqueCommonAction actionType:" + action.getAction() + " docType:" + action.getDocType() + " actionId:" + action.getType() + " doc:"+ srcDoc.getDocId() + " " + srcDoc.getPath() + srcDoc.getName());
		return true;
	}
	
	//注意：该接口和DocUtil中的buildBasicDoc是一样的，在这里定义是因为自动备份线程调用DocUtil类时
	public static Doc buildBasicDocBase(Integer reposId, Long docId, Long pid, String reposPath, String path, String name, 
			Integer level, Integer type, boolean isRealDoc, String localRootPath, String localVRootPath, Long size, String checkSum,
			String offsetPath) 
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
		if(offsetPath == null)
		{
			offsetPath = "";
		}
		
		//To support user call the interface by entryPath
		if(name.isEmpty())
		{
			if(!path.isEmpty())
			{
				String[] temp = new String[2]; 
				level = Path.seperatePathAndName(path, temp);
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
			level = Path.getLevelByParentPath(path);
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
		doc.offsetPath = offsetPath;
		
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
		Doc doc = buildBasicDocBase(reposId, docId, pid, reposPath, path, name, level, type, isRealDoc, localRootPath, localVRootPath, size, checkSum, "");
		doc.isBussiness = systemLicenseInfo.hasLicense;
		doc.officeType = officeType;
		return doc;
	}
	
	public static Doc buildBasicDoc(Integer reposId, Long docId, Long pid, String reposPath, String path, String name, Integer level, Integer type, boolean isRealDoc, String localRootPath, String localVRootPath, Long size, String checkSum, String offsetPath) 
	{
		Doc doc = buildBasicDocBase(reposId, docId, pid, reposPath, path, name, level, type, isRealDoc, localRootPath, localVRootPath, size, checkSum, offsetPath);
		doc.isBussiness = systemLicenseInfo.hasLicense;
		doc.officeType = officeType;
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
			Log.debug("BaseController>writeJson  ERROR!");
			Log.error(e);
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
			Log.debug("BaseController>writeJson  ERROR!");
			Log.error(e);
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
			Log.debug("BaseController>writeJson  ERROR!");
			Log.error(e);
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
			Log.debug("syncUpFolder() Exception!");
			Log.error(e);
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
	protected static final Object syncLock = new Object(); //For Doc
	protected static final Object syncLockForRepos = new Object(); //For Repos (add/update)
	
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
	protected String getLdapConfig() {
    	String ldapConfig = null;
    	ldapConfig = ReadProperties.read("docSysConfig.properties", "ldapConfig");
        if(ldapConfig != null && !ldapConfig.isEmpty())
        {
        	return ldapConfig;
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
	protected static boolean addSystemLog(HttpServletRequest request, User user, String event, String subEvent, String action, String result, Repos repos, Doc doc, Doc newDoc, String content)
    {
		SystemLog log = new SystemLog();
		log.time = new Date().getTime();
		
		if(request == null)
		{
			log.ip = "未知";			
		}
		else
		{
			log.ip = getRequestIpAddress(request);
		}
		
		
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
		return addSystemLogIndex(log, indexLib);
    }
	
	protected static boolean addSystemLogIndex(SystemLog log, String indexLib)
    {	
    	Log.debug("addSystemLogIndex() id:" + log.id + " indexLib:"+indexLib);    	
    	
    	Analyzer analyzer = null;
		Directory directory = null;
		IndexWriter indexWriter = null;
    	
		try {
	    	Date date1 = new Date();
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
	        
			Date date2 = new Date();
	        Log.debug("addSystemLogIndex() 创建索引耗时：" + (date2.getTime() - date1.getTime()) + "ms\n");
	    	return true;
		} catch (Exception e) {
			closeResource(indexWriter, directory, analyzer);
	        Log.debug("addSystemLogIndex() 异常");
			Log.error(e);
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
			e1.printStackTrace();
		}
		
		if(directory != null)
		{
			try {
				directory.close();
			} catch (IOException e) {
				Log.error(e);
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
		return getDBStorePath() + "UserPreferLink/";
	}
	
	protected static String getIndexLibPathForUserPreferServer() {
		return getDBStorePath() + "UserPreferServer/";
	}
	
	protected static String getIndexLibPathForRemoteStorageDoc(Repos repos, RemoteStorageConfig remote) {
		if(remote.remoteStorageIndexLib == null)
		{
			Log.debug("getIndexLibPathForRemoteStorageDoc() remoteStorageIndexLib is null!!!");
			//remote.remoteStorageIndexLib = getDBStorePath() + "RemoteStorage/" + repos.getId() + "/Doc";
		}
		return remote.remoteStorageIndexLib;

	}
	
	protected static String getDBStorePath() {
    	String path = null;
    	path = ReadProperties.read("docSysConfig.properties", "DBStorePath");
        if(path != null && !path.isEmpty())
        {
        	return Path.localDirPathFormat(path, OSType);
        }

        switch(OSType)
        {
        case OS.Windows:
        	path = "C:/DocSysDB/";
        	break;
        case OS.Linux: 
        	path = "/data/DocSysDB/";
        	break;
        case OS.MacOS:
        	path = "/data/DocSysDB/";
        	break;
        }
        return path;
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
    public static JSONObject postFileStreamAndJsonObj(String url, String fileName, byte[] fileData, HashMap<String, String> params) {
		JSONObject returnJson = null;
		Log.debug("\n*************************** postFileStreamAndJsonObj Start");
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
            		Log.debug("postFileStreamAndJsonObj " + name  + " = " + value);            		

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
			// 断开连接
			conn.disconnect();			
        } catch (Exception e) {
            Log.debug("postFileStreamAndJsonObj 发送POST请求出现异常！" + e);
            Log.error(e);
        }
        
        Log.debug("*********************** postFileStreamAndJsonObj End\n");
        return returnJson;
    }
    
	public static JSONObject postJson(String urlString , HashMap<String, String> params) {
		return postFileStreamAndJsonObj(urlString, null, null, params);
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
			Log.error(e);
		} catch (UnsupportedEncodingException e) {
			Log.error(e);
		} catch (IOException e) {
			Log.error(e);
		}
		return returnJson;
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
        	Log.error(e);        	
        } finally {
        	if(is != null)
        	{
        		try {
					is.close();
				} catch (IOException e) {
					Log.error(e);
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
		if(vid != null)
		{
			doc.setVid(vid);
		}
		return doc;
	}
	
	/***** UserPreferServer *******/
	protected static UserPreferServer addUserPreferServer(String serverUrl, String userName, String pwd, String serverName, User accessUser)
    {
		UserPreferServer server = new UserPreferServer();
		server.createTime = new Date().getTime();
		
		server.serverName = serverName;
		server.serverUrl = serverUrl;
		server.serverUserName = userName;
		server.serverUserPwd = pwd;
		
		server.userId = accessUser.getId();
		server.userName = accessUser.getName();
		
		server.id = server.userId + "_" + serverUrl.hashCode() + "_" + server.createTime;
		
		String indexLib = getIndexLibPathForUserPreferServer();
		if(addUserPreferServerIndex(server, indexLib) == false)
		{
			return null;
		}
		return server;
    }
	
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
	        Log.debug("updateUserPreferServerIndex() 异常");
			Log.error(e);
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
			Log.error(e);
			return false;
		}
    }  

	private static boolean addUserPreferServerIndex(UserPreferServer server, String indexLib) {
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
	        Log.debug("addUserPreferServerIndex() 异常");
			Log.error(e);
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
			System.out.println("search() 异常");
			Log.error(e);
		} finally {
			if(ireader != null)
			{
				try {
					ireader.close();
				} catch (Exception e1) {
					e1.printStackTrace();
				}
			}
			
			if(directory != null)
			{
				try {
					directory.close();
				} catch (Exception e1) {
					e1.printStackTrace();
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
	        Log.debug("addPreferLinkIndex() 异常");
			Log.error(e);
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
	        Log.debug("updatePreferLinkIndex() 异常");
			Log.error(e);
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
			System.out.println("search() 异常");
			Log.error(e);
		} finally {
			if(ireader != null)
			{
				try {
					ireader.close();
				} catch (Exception e1) {
					e1.printStackTrace();
				}
			}
			
			if(directory != null)
			{
				try {
					directory.close();
				} catch (Exception e1) {
					e1.printStackTrace();
				}
			}
		}				
		return list;
	}	
}
